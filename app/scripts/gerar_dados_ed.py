# Gera app/src/percurso/educacaoDados.ts a partir das bases baixadas (UIS, Banco Mundial, UIT, ESMAP, UNICEF).
import json, csv, sys, collections, openpyxl, statistics
import os
B = os.environ.get('DADOS_ED', 'dados-ed')  # pasta com as bases baixadas (UIS, Banco Mundial, UIT, ESMAP, UNICEF)
OUT = sys.argv[1]
def wb(ind):
    d = json.load(open(f'{B}/dados/wb/{ind}.json'))[1]
    r = collections.defaultdict(dict)
    for x in d:
        iso = x.get('countryiso3code') or ''
        if len(iso) == 3 and x['value'] is not None: r[iso].setdefault(int(x['date']), []).append(float(x['value']))
    return {k: {y: sum(v)/len(v) for y, v in ys.items()} for k, ys in r.items()}
def uis(ind):
    d = json.load(open(f'{B}/dados/uis/{ind}.json'))['records']
    r = collections.defaultdict(dict)
    for x in d:
        if x['value'] is not None and len(x['geoUnit']) == 3: r[x['geoUnit']][int(x['year'])] = float(x['value'])
    return r
def ult(serie, desde=2010):
    ys = [y for y in serie if y >= desde]
    if not ys: return None
    y = max(ys); return serie[y], y
# --- escolas com eletricidade e internet (UIS SCHBSP), níveis 1, 2 e 3
esc = {}
for k, ind in [('el', 'WELEC'), ('in', 'WINTERN')]:
    for n in '123':
        s = uis(f'SCHBSP.{n}.{ind}')
        for iso, ser in s.items():
            u = ult(ser)
            if u: esc.setdefault(iso, {})[k + n] = (round(u[0], 1), u[1])
# --- razão estudante/professor (UIS PTRHC)
ptr = {}
for n, ind in [('0', 'PTRHC.02'), ('1', 'PTRHC.1'), ('2', 'PTRHC.2'), ('3', 'PTRHC.3')]:
    for iso, ser in uis(ind).items():
        u = ult(ser)
        if u and 3 <= u[0] <= 120: ptr.setdefault(iso, {})[n] = (round(u[0], 1), u[1])
# --- preço do kWh: Doing Business 2019 (US cents), atualizado pelo IPC do país e convertido ao câmbio atual
kwh = wb('IC.ELC.PRI.KH.DB1619'); cpi = wb('FP.CPI.TOTL'); fx = wb('PA.NUS.FCRF')
EURO = {'AUT','BEL','CYP','DEU','ESP','EST','FIN','FRA','GRC','HRV','IRL','ITA','LTU','LUX','LVA','MLT','NLD','PRT','SVK','SVN'}
fxeu = fx.get('EMU', {})
def cambio(iso, y):
    s = fxeu if iso in EURO and y >= 2023 else fx.get(iso, {})
    if iso == 'USA': return 1.0
    return s.get(y)
kw = {}
for iso, ser in kwh.items():
    if 2019 not in ser: continue
    c = cpi.get(iso, {}); cy = [y for y in c if y >= 2020]
    f19 = cambio(iso, 2019) or (fx.get(iso, {}).get(2019))
    if not cy or 2019 not in c or not f19: continue
    yc = max(cy); fa = cambio(iso, yc) or fx.get(iso, {}).get(yc)
    if not fa: continue
    usd = ser[2019] / 100 * f19 * (c[yc] / c[2019]) / fa
    if 0.005 <= usd <= 1.0: kw[iso] = (round(usd, 4), yc, round(ser[2019] / 100, 4))
# --- UIT 2024: banda larga fixa (5 GB) e dados móveis (2 GB)
wbk = openpyxl.load_workbook(f'{B}/e3work/dl/itu_allow.xlsx', read_only=True)
eco = openpyxl.load_workbook(f'{B}/e3work/dl/itu.xlsx', read_only=True)['economies_2008-2024']
nome2iso = {}
for i, r in enumerate(eco.iter_rows(values_only=True)):
    if i and r[0] and r[1]: nome2iso[str(r[1]).strip()] = r[0]
def num(v):
    try: return float(v)
    except: return None
bb, mb = {}, {}
for i, r in enumerate(wbk['FixedBB'].iter_rows(values_only=True)):
    if i < 2 or not r[0]: continue
    iso = nome2iso.get(str(r[0]).strip()); usd = num(r[2]); vel = num(r[5])
    if iso and usd and vel and usd > 0 and vel > 0: bb[iso] = (round(usd, 2), round(vel, 1))
for i, r in enumerate(wbk['MobileBB'].iter_rows(values_only=True)):
    if i < 2 or not r[0]: continue
    iso = nome2iso.get(str(r[0]).strip()); usd = num(r[2]); gb = num(r[5])
    if iso and usd and gb and usd > 0 and gb > 0: mb[iso] = (round(usd, 2), round(gb, 1))
# --- potencial fotovoltaico (Banco Mundial/ESMAP, PVOUT nível 1, kWh/kWp/dia)
pv = {}
ws = openpyxl.load_workbook(f'{B}/e3work/dl/pv.xlsx', read_only=True)['Country indicators']
for i, r in enumerate(ws.iter_rows(values_only=True)):
    if i < 2 or not r[0] or len(str(r[0])) != 3: continue
    v = num(r[11])
    if v and 1 < v < 8: pv[r[0]] = round(v, 2)
# --- crianças de 2 a 17 anos com dificuldade funcional (UNICEF, MICS)
fd = {}
for r in csv.DictReader(open(f'{B}/e6work/fd.csv')):
    if r['SEX'] == '_T' and r['OBS_VALUE']:
        y = int(r['TIME_PERIOD'][:4]); v = float(r['OBS_VALUE'])
        if r['REF_AREA'] not in fd or fd[r['REF_AREA']][1] < y: fd[r['REF_AREA']] = (v, y)
# --- saída
def j(v): return json.dumps(v, ensure_ascii=False, separators=(',', ':'))
L = ['// Gerado por scripts/gerar_dados_ed.py a partir de bases públicas (consulta de 15/11/2026). Não editar à mão.',
     '// Cada valor é [valor, ano]. Fontes, licenças e graus em FONTES_ED; a metodologia da educação explica o uso de cada um.',
     'export type VA = [number, number];']
L.append('/** % de escolas com eletricidade (el) e com internet para fins pedagógicos (in) por nível CINE 1, 2 e 3 (UIS, SCHBSP). */')
L.append('export const ESCOLAS_UIS: Record<string, Partial<Record<"el1"|"el2"|"el3"|"in1"|"in2"|"in3", VA>>> = ' + j({k: {a: list(b) for a, b in v.items()} for k, v in sorted(esc.items())}) + ';')
L.append('/** Estudantes por professor por nível: 0 pré-escola, 1 primário, 2 secundário inferior, 3 secundário superior (UIS, PTRHC). */')
L.append('export const RAZAO_UIS: Record<string, Partial<Record<"0"|"1"|"2"|"3", VA>>> = ' + j({k: {a: list(b) for a, b in v.items()} for k, v in sorted(ptr.items())}) + ';')
L.append('/** Preço comercial do kWh em US$ correntes: [US$ atual, ano do IPC, US$ de 2019] (Doing Business 2019, IPC e câmbio do Banco Mundial). */')
L.append('export const KWH_PAIS: Record<string, [number, number, number]> = ' + j({k: list(v) for k, v in sorted(kw.items())}) + ';')
L.append('/** Cesta de banda larga fixa da UIT, 2024: [US$ por mês, velocidade anunciada em Mbps]. */')
L.append('export const BANDA_UIT: Record<string, [number, number]> = ' + j({k: list(v) for k, v in sorted(bb.items())}) + ';')
L.append('/** Cesta de dados móveis da UIT, 2024: [US$ por mês, franquia em GB]. */')
L.append('export const MOVEL_UIT: Record<string, [number, number]> = ' + j({k: list(v) for k, v in sorted(mb.items())}) + ';')
L.append('/** Potencial fotovoltaico prático (PVOUT nível 1, kWh por kWp por dia, média de longo prazo; Banco Mundial/ESMAP e Solargis). */')
L.append('export const PVOUT: Record<string, number> = ' + j(dict(sorted(pv.items()))) + ';')
L.append('/** Crianças de 2 a 17 anos com dificuldade funcional, % (UNICEF, FD_FUNC_DIFFICULTY, pesquisas MICS). */')
L.append('export const DEFICIENCIA_UNICEF: Record<string, VA> = ' + j({k: list(v) for k, v in sorted(fd.items())}) + ';')
open(OUT, 'w').write('\n'.join(L) + '\n')
print('escolas', len(esc), 'razao', len(ptr), 'kwh', len(kw), 'banda', len(bb), 'movel', len(mb), 'pv', len(pv), 'def', len(fd))
for iso in ['BRA', 'KEN', 'MOZ', 'IND', 'FRA', 'USA']:
    print(iso, esc.get(iso), ptr.get(iso), kw.get(iso), bb.get(iso), mb.get(iso), pv.get(iso), fd.get(iso))
