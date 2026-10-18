#!/usr/bin/env python3
"""Valida data/referencias.json e data/paises.json (BL4.5).

Uso: python3 tools/checar_referencias.py [--refs ARQ] [--paises ARQ] [--moedas ARQ]
Sai com código 1 e lista cada problema se algo estiver errado (o build.sh para nesse caso).
"""
import argparse, json, os, re, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# ISO 3166-1 alfa-3 (249 códigos)
ISO3 = set("""ABW AFG AGO AIA ALA ALB AND ARE ARG ARM ASM ATA ATF ATG AUS AUT AZE BDI BEL BEN BES BFA BGD BGR BHR BHS BIH BLM BLR BLZ BMU BOL BRA BRB BRN BTN BVT BWA CAF CAN CCK CHE CHL CHN CIV CMR COD COG COK COL COM CPV CRI CUB CUW CXR CYM CYP CZE DEU DJI DMA DNK DOM DZA ECU EGY ERI ESH ESP EST ETH FIN FJI FLK FRA FRO FSM GAB GBR GEO GGY GHA GIB GIN GLP GMB GNB GNQ GRC GRD GRL GTM GUF GUM GUY HKG HMD HND HRV HTI HUN IDN IMN IND IOT IRL IRN IRQ ISL ISR ITA JAM JEY JOR JPN KAZ KEN KGZ KHM KIR KNA KOR KWT LAO LBN LBR LBY LCA LIE LKA LSO LTU LUX LVA MAC MAF MAR MCO MDA MDG MDV MEX MHL MKD MLI MLT MMR MNE MNG MNP MOZ MRT MSR MTQ MUS MWI MYS MYT NAM NCL NER NFK NGA NIC NIU NLD NOR NPL NRU NZL OMN PAK PAN PCN PER PHL PLW PNG POL PRI PRK PRT PRY PSE PYF QAT REU ROU RUS RWA SAU SDN SEN SGP SGS SHN SJM SLB SLE SLV SMR SOM SPM SRB SSD STP SUR SVK SVN SWE SWZ SXM SYC SYR TCA TCD TGO THA TJK TKL TKM TLS TON TTO TUN TUR TUV TWN TZA UGA UKR UMI URY USA UZB VAT VCT VEN VGB VIR VNM VUT WLF WSM YEM ZAF ZMB ZWE""".split())
GRAUS = {'A', 'B', 'C'}
GRUPOS_RENDA = {'baixa', 'media-baixa', 'media-alta', 'alta'}
CAMPOS_PAIS = ['escolas', 'estudantes', 'professores', 'pctUrbano', 'pctEscolasInternet', 'salarioProfessor', 'inflacao', 'taxaDesconto', 'idiomas']
DATA = re.compile(r'^\d{4}-\d{2}-\d{2}$')
VERSAO = re.compile(r'^\d+\.\d+\.\d+$')
CODIGO_REGIAO = re.compile(r'^[A-Z]{2,5}$')


def num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and x == x and abs(x) != float('inf')


def checar(refs, paises, moedas):
    """Devolve a lista de problemas (vazia = tudo certo)."""
    E = []
    taxas = (moedas or {}).get('taxas') or {}
    # --- cabeçalhos de versão
    for nome, d in (('referencias.json', refs), ('paises.json', paises)):
        if not isinstance(d, dict):
            E.append(f'{nome}: a raiz deve ser um objeto'); continue
        if not isinstance(d.get('versao'), str) or not VERSAO.match(d.get('versao', '')):
            E.append(f'{nome}: "versao" ausente ou fora do formato 1.0.0')
        if not isinstance(d.get('atualizado'), str) or not DATA.match(d.get('atualizado', '')):
            E.append(f'{nome}: "atualizado" ausente ou fora do formato AAAA-MM-DD')
    if not isinstance(refs, dict) or not isinstance(paises, dict):
        return E
    # --- regiões e países
    regioes = paises.get('regioes')
    cods_regiao = set()
    if not isinstance(regioes, list) or not regioes:
        E.append('paises.json: "regioes" deve ser uma lista não vazia')
    else:
        for i, r in enumerate(regioes):
            c = r.get('codigo') if isinstance(r, dict) else None
            if not isinstance(c, str) or not CODIGO_REGIAO.match(c): E.append(f'paises.json: regioes[{i}] sem código válido'); continue
            if c in ISO3: E.append(f'paises.json: o código de região {c} coincide com um código ISO de país')
            if c in cods_regiao: E.append(f'paises.json: região {c} repetida')
            if not isinstance(r.get('nome'), str) or not r['nome'].strip(): E.append(f'paises.json: região {c} sem nome')
            cods_regiao.add(c)
    lista = paises.get('paises')
    iso_vistos = set()
    if not isinstance(lista, list) or not lista:
        E.append('paises.json: "paises" deve ser uma lista não vazia'); lista = []
    for i, p in enumerate(lista):
        if not isinstance(p, dict): E.append(f'paises[{i}]: deve ser um objeto'); continue
        iso = p.get('iso3'); rot = f'paises[{iso or i}]'
        if iso not in ISO3: E.append(f'{rot}: iso3 inválido ({iso!r})')
        elif iso in iso_vistos: E.append(f'{rot}: iso3 repetido')
        iso_vistos.add(iso)
        for k in ('nome', 'regiao', 'grupoRenda', 'moeda') + tuple(CAMPOS_PAIS):
            if k not in p: E.append(f'{rot}: campo "{k}" ausente')
        if not isinstance(p.get('nome'), str) or not str(p.get('nome', '')).strip(): E.append(f'{rot}: "nome" vazio')
        if p.get('regiao') not in cods_regiao: E.append(f'{rot}: região {p.get("regiao")!r} não existe em "regioes"')
        if p.get('moeda') not in taxas: E.append(f'{rot}: moeda {p.get("moeda")!r} não existe em moedas.json')
        for k in ['grupoRenda'] + CAMPOS_PAIS:
            v = p.get(k)
            if v is None:
                if k == 'grupoRenda': E.append(f'{rot}: "grupoRenda" não pode ser nulo')
                continue
            if not isinstance(v, dict) or not {'valor', 'fonte', 'ano'} <= set(v): E.append(f'{rot}.{k}: deve ser null ou {{valor, fonte, ano}}'); continue
            if not isinstance(v['fonte'], str) or not v['fonte'].strip(): E.append(f'{rot}.{k}: "fonte" vazia')
            if v['ano'] is not None and (not isinstance(v['ano'], int) or isinstance(v['ano'], bool) or not 1950 <= v['ano'] <= 2100): E.append(f'{rot}.{k}: "ano" deve ser inteiro de 1950 a 2100 ou null')
            x = v['valor']
            if k == 'grupoRenda':
                if x not in GRUPOS_RENDA: E.append(f'{rot}.grupoRenda: valor deve ser um de {sorted(GRUPOS_RENDA)}')
            elif k == 'idiomas':
                if not isinstance(x, list) or not x or not all(isinstance(s, str) and re.match(r'^[a-z]{2,3}$', s) for s in x): E.append(f'{rot}.idiomas: lista de códigos ISO 639 (ex.: ["pt"])')
            elif not num(x): E.append(f'{rot}.{k}: valor deve ser número')
            elif k in ('pctUrbano', 'pctEscolasInternet') and not 0 <= x <= 100: E.append(f'{rot}.{k}: porcentagem de 0 a 100')
            elif k in ('inflacao', 'taxaDesconto') and not -0.5 <= x <= 5: E.append(f'{rot}.{k}: fração por ano (0,05 = 5%), entre -0,5 e 5')
            elif k in ('escolas', 'estudantes', 'professores', 'salarioProfessor') and x < 0: E.append(f'{rot}.{k}: não pode ser negativo')
    # --- referências
    itens = refs.get('referencias')
    if not isinstance(itens, list) or not itens:
        E.append('referencias.json: "referencias" deve ser uma lista não vazia'); itens = []
    ids = set()
    for i, r in enumerate(itens):
        if not isinstance(r, dict): E.append(f'referencias[{i}]: deve ser um objeto'); continue
        rid = r.get('id'); rot = f'referencias[{rid or i}]'
        for k in ('id', 'item', 'unidade', 'valor', 'baixo', 'alto', 'moeda', 'anoPreco', 'escopo', 'fonte', 'acesso', 'grau'):
            if k not in r: E.append(f'{rot}: campo "{k}" ausente')
        if not isinstance(rid, str) or not rid.strip(): E.append(f'{rot}: "id" vazio')
        # a mesma grandeza pode ter uma linha por escopo; o par (id, escopo) é a chave
        chave = (rid, r.get('escopo'))
        if chave in ids: E.append(f'{rot}: par id e escopo repetido ({r.get("escopo")!r})')
        ids.add(chave)
        for k in ('item', 'unidade'):
            if not isinstance(r.get(k), str) or not r.get(k, '').strip(): E.append(f'{rot}: "{k}" vazio')
        v, lo, hi = r.get('valor'), r.get('baixo'), r.get('alto')
        if not (num(v) and num(lo) and num(hi)): E.append(f'{rot}: valor, baixo e alto devem ser números')
        elif not lo <= v <= hi: E.append(f'{rot}: precisa valer baixo <= valor <= alto ({lo} <= {v} <= {hi})')
        if r.get('grau') not in GRAUS: E.append(f'{rot}: grau deve ser A, B ou C ({r.get("grau")!r})')
        esc = r.get('escopo')
        if not (esc == 'global' or esc in cods_regiao or esc in ISO3): E.append(f'{rot}: escopo {esc!r} deve ser "global", um código de região de paises.json ou um ISO3')
        m = r.get('moeda')
        if m is not None and m not in taxas: E.append(f'{rot}: moeda {m!r} não existe em moedas.json')
        ap = r.get('anoPreco')
        if m is not None and (not isinstance(ap, int) or isinstance(ap, bool) or not 1950 <= ap <= 2100): E.append(f'{rot}: anoPreco deve ser um ano inteiro quando há moeda')
        if m is None and ap is not None and not isinstance(ap, int): E.append(f'{rot}: anoPreco deve ser inteiro ou null')
        f = r.get('fonte')
        if not isinstance(f, dict) or not isinstance(f.get('titulo'), str) or not f.get('titulo', '').strip() or 'url' not in f:
            E.append(f'{rot}: "fonte" deve ser {{titulo, url}} com título não vazio')
        elif f['url'] is not None and not (isinstance(f['url'], str) and re.match(r'^https?://\S+$', f['url'])): E.append(f'{rot}: fonte.url deve ser null ou um endereço http(s)')
        if not isinstance(r.get('acesso'), str) or not DATA.match(r.get('acesso', '')): E.append(f'{rot}: "acesso" deve estar no formato AAAA-MM-DD')
        if r.get('grau') in ('A', 'B') and isinstance(f, dict) and f.get('url') is None and 'Convenção da ferramenta' in str(f.get('titulo')):
            E.append(f'{rot}: uma convenção da ferramenta só pode ter grau C')
    # toda grandeza com linha por país ou região precisa da linha global (cadeia de recuo);
    # ids 'pais.*' (dados que só existem por país) ficam isentos
    globais = {c[0] for c in ids if c[1] == 'global'}
    for rid, esc in sorted(c for c in ids if c[1] != 'global' and c[0] is not None):
        if rid not in globais and not rid.startswith('pais.'): E.append(f'referencias[{rid}]: há linha de escopo {esc} sem a linha global correspondente')
    return E


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--refs', default=os.path.join(RAIZ, 'data', 'referencias.json'))
    ap.add_argument('--paises', default=os.path.join(RAIZ, 'data', 'paises.json'))
    ap.add_argument('--moedas', default=os.path.join(RAIZ, 'data', 'moedas.json'))
    a = ap.parse_args(argv)
    dados = []
    for arq in (a.refs, a.paises, a.moedas):
        try:
            with open(arq, encoding='utf-8') as f: dados.append(json.load(f))
        except (OSError, ValueError) as e:
            print(f'erro: não consegui ler {arq}: {e}', file=sys.stderr); return 1
    erros = checar(*dados)
    if erros:
        print(f'{len(erros)} problema(s) em data/:', file=sys.stderr)
        for e in erros: print('  -', e, file=sys.stderr)
        return 1
    n = len(dados[0]['referencias']); p = len(dados[1]['paises'])
    print(f'referências ok: {n} linhas (v{dados[0]["versao"]}), {p} países (v{dados[1]["versao"]})')
    return 0


if __name__ == '__main__':
    sys.exit(main())
