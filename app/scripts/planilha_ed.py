# Planilha de cálculo da metodologia da educação (PT e EN), com fórmulas visíveis, a partir de met-ed.json.
import json, sys
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from openpyxl.utils import get_column_letter
D = json.load(open(sys.argv[1])); OUT = sys.argv[2]; L = sys.argv[3]
T = lambda pt, en: pt if L == 'pt' else en
B = lambda x: x[L] if isinstance(x, dict) else x
H = Font(bold=True); FILL = PatternFill('solid', fgColor='E8EEF7')
FASE = {f['id']: B(f['nomeBi']) for f in D['fasesPadrao']}
ALT = {'com': T('Com IA', 'With AI'), 'sem': T('Sem IA', 'Without AI')}
CL = {'capex': 'CapEx', 'opex': 'OpEx', 'uso': 'Utility'}
wb = Workbook()
def cab(ws, linha, cols):
    for j, c in enumerate(cols, 1):
        x = ws.cell(row=linha, column=j, value=c); x.font = H; x.fill = FILL; x.alignment = Alignment(wrap_text=True, vertical='top')
def larg(ws, ws_w):
    for j, w in enumerate(ws_w, 1): ws.column_dimensions[get_column_letter(j)].width = w
# ---------- Leia-me
ws = wb.active; ws.title = T('Leia-me', 'Read me')
txt = [T('Modelo de custeio: Educando com e sem IA (v022)', 'Costing model: Educating with and without AI (v022)'), '',
 T('Esta planilha refaz, com fórmulas visíveis, o caso de exemplo da metodologia: Brasil, desafio de alfabetização e numeracia (C32), todas as opções das quatro categorias, valores em US$ e as sugestões da ferramenta.',
   'This spreadsheet recomputes, with visible formulas, the methodology example case: Brazil, foundational literacy and numeracy challenge (C32), all options in the four categories, values in US$ and the tool suggestions.'),
 T('Na aba Linhas, cada valor é quantidade × preço unitário; nas linhas de pessoas, a quantidade é pessoas × dedicação × meses (pessoa-mês) e o preço é o custo mensal com encargos. A aba Resumo soma por alternativa e por classe com SOMASES e aplica os custos adicionais.',
   'In the Lines sheet, each value is quantity × unit price; in people lines, the quantity is people × allocation × months (person-months) and the price is the monthly cost with contributions. The Summary sheet sums by alternative and class with SUMIFS and applies the additional costs.'),
 T('Mude um preço ou uma quantidade em azul para ver o efeito no total. A ferramenta calcula as quantidades a partir do público e das fases (aba Fases) e das regras de cada linha (aba Catálogo e metodologia).',
   'Change a price or a quantity in blue to see the effect on the total. The tool computes quantities from the population and phases (Phases sheet) and the rules of each line (Catalogue sheet and methodology).'),
 '', T('Público do caso', 'Case population') + f": {D['publico']['estudantes']:,} " + T('estudantes', 'students') + f", {D['publico']['professores']:,} " + T('professores', 'teachers') + f", {D['publico']['escolas']:,} " + T('escolas', 'schools'),
 T('Locais sem energia', 'Sites without electricity') + f": {D['publico']['semEnergia']}% · " + T('sem internet', 'without internet') + f": {D['publico']['semInternet']}% · " + T('com deficiência', 'with disabilities') + f": {D['publico']['deficiencia']}%",
 T('Gerado a partir do modelo da ferramenta em', 'Generated from the tool model on') + ' ' + D['geradoEm'] + '.']
for i, x in enumerate(txt, 1):
    c = ws.cell(row=i, column=1, value=x); c.alignment = Alignment(wrap_text=True, vertical='top')
ws['A1'].font = Font(bold=True, size=14); ws.column_dimensions['A'].width = 120
# ---------- Fases
wf = wb.create_sheet(T('Fases', 'Phases'))
cab(wf, 1, [T('Fase', 'Phase'), T('Meses', 'Months'), T('Locais', 'Sites'), T('Estudantes', 'Students'), T('Professores', 'Teachers'), T('Novos locais', 'New sites'), T('Novos estudantes', 'New students'), T('Novos professores', 'New teachers'), T('Locais da infraestrutura', 'Infrastructure sites'), T('Estudantes em casa', 'Students at home')])
for i, f in enumerate(D['fases'], 2):
    for j, v in enumerate([FASE[f['id']], f['meses'], f['E'], f['A'], f['P'], f['nE'], f['nA'], f['nP'], f['Ei'], f['casa']], 1): wf.cell(row=i, column=j, value=v)
larg(wf, [20, 8, 10, 14, 12, 12, 16, 16, 18, 16])
# ---------- Linhas
wl = wb.create_sheet(T('Linhas', 'Lines'))
cols = ['ID', T('Opção', 'Option'), T('Linha', 'Line'), T('Alternativa', 'Alternative'), T('Classe', 'Class'), T('Entra no total (1/0)', 'In total (1/0)'), T('Trabalho de pessoas (1/0)', 'People work (1/0)'),
        T('Papel', 'Role'), T('Fase', 'Phase'), T('Pessoas', 'People'), T('Dedicação', 'Allocation'), T('Meses', 'Months'), T('Quantidade', 'Quantity'), T('Unidade', 'Unit'), T('Preço unitário (US$)', 'Unit price (US$)'), T('Valor (US$)', 'Value (US$)')]
cab(wl, 1, cols); larg(wl, [18, 8, 40, 11, 9, 9, 9, 30, 16, 9, 10, 8, 14, 16, 14, 16])
blue = Font(color='1F4E9E'); row = 2
OPN = {o['id']: o['n'] for c in D['categorias'] for o in c['opcoes']}
for l in D['linhas']:
    inc = 0 if l['informativo'] else 1
    pess = 1 if (l['tipo'] == 'papeis' or any(x.get('perfil') for x in [c['preco'] or {} for c in D['catalogo'] if c['id'] == l['id']])) else 0
    if l['tipo'] == 'papeis':
        for pp in l['papeis']:
            for x in pp['porFase']:
                vals = [l['id'], OPN[l['op']], B(l['nome']), ALT[l['alt']], CL[l['classe']], inc, 1, B(pp['papel']), FASE[x['fase']], x['n'], pp['ded'], x['meses'], None, T('pessoa-mês', 'person-month'), round(pp['unit'], 2), None]
                for j, v in enumerate(vals, 1): wl.cell(row=row, column=j, value=v)
                wl.cell(row=row, column=13, value=f'=J{row}*K{row}*L{row}'); wl.cell(row=row, column=16, value=f'=M{row}*O{row}')
                for j in (10, 11, 15): wl.cell(row=row, column=j).font = blue
                row += 1
    else:
        for x in l['porFase']:
            if not x['qtd'] and not x['valor']: continue
            un = '% ' + T('de outras linhas', 'of other lines') if l['tipo'] == 'pct' else B(l['unidade'])
            vals = [l['id'], OPN[l['op']], B(l['nome']), ALT[l['alt']], CL[l['classe']], inc, pess, '', FASE[x['fase']], None, None, None, round(x['qtd'], 4), un, round(x['unit'], 6), None]
            for j, v in enumerate(vals, 1): wl.cell(row=row, column=j, value=v)
            wl.cell(row=row, column=16, value=f'=M{row}*O{row}')
            for j in (13, 15): wl.cell(row=row, column=j).font = blue
            row += 1
ult = row - 1
for r in range(2, ult + 1):
    for j in (13, 15, 16): wl.cell(row=r, column=j).number_format = '#,##0.00'
wl.freeze_panes = 'A2'; wl.auto_filter.ref = f'A1:P{ult}'
# ---------- Resumo
wr = wb.create_sheet(T('Resumo', 'Summary'))
nl = wl.title
rng = lambda c: f"'{nl}'!${c}$2:${c}${ult}"
cab(wr, 1, ['', ALT['com'], ALT['sem']])
itens = [('CapEx', 'capex'), ('OpEx', 'opex'), ('Utility', 'uso')]
r = 2
for rot, cl in itens:
    wr.cell(row=r, column=1, value=rot + T(' (custo direto)', ' (direct cost)'))
    for j, a in ((2, 'com'), (3, 'sem')):
        wr.cell(row=r, column=j, value=f'=SUMIFS({rng("P")},{rng("D")},"{ALT[a]}",{rng("E")},"{CL[cl]}",{rng("F")},1)')
    r += 1
wr.cell(row=5, column=1, value=T('Custo direto (D)', 'Direct cost (D)')); [wr.cell(row=5, column=j, value=f'=SUM({c}2:{c}4)') for j, c in ((2, 'B'), (3, 'C'))]
wr.cell(row=6, column=1, value=T('Trabalho de pessoas (P)', 'People work (P)'))
for j, a in ((2, 'com'), (3, 'sem')): wr.cell(row=6, column=j, value=f'=SUMIFS({rng("P")},{rng("D")},"{ALT[a]}",{rng("G")},1,{rng("F")},1)')
wr.cell(row=8, column=1, value=T('Viagens (% de P)', 'Travel (% of P)')); wr.cell(row=8, column=2, value=D['sim']['viagens'] / 100)
wr.cell(row=9, column=1, value=T('Custos indiretos (% de P + V)', 'Indirect costs (% of P + V)')); wr.cell(row=9, column=2, value=D['sim']['overhead'] / 100)
wr.cell(row=10, column=1, value=T('Taxa administrativa (% de D + V)', 'Administrative fee (% of D + V)')); wr.cell(row=10, column=2, value=D['sim']['taxa'] / 100)
for rr in (8, 9, 10): wr.cell(row=rr, column=2).number_format = '0%'; wr.cell(row=rr, column=2).font = blue
for rr, rot, f in ((12, T('Viagens (V)', 'Travel (V)'), '=$B$8*{c}6'), (13, T('Custos indiretos (O)', 'Indirect costs (O)'), '=$B$9*({c}6+{c}12)'), (14, T('Taxa administrativa (T)', 'Administrative fee (T)'), '=$B$10*({c}5+{c}12)'),
                   (15, T('Custo total', 'Total cost'), '={c}5+{c}12+{c}13+{c}14')):
    wr.cell(row=rr, column=1, value=rot)
    for j, c in ((2, 'B'), (3, 'C')): wr.cell(row=rr, column=j, value=f.format(c=c))
wr.cell(row=15, column=1).font = H
wr.cell(row=17, column=1, value=T('Total calculado pela ferramenta', 'Total computed by the tool')); wr.cell(row=17, column=2, value=D['resultado']['com']['total']); wr.cell(row=17, column=3, value=D['resultado']['sem']['total'])
wr.cell(row=18, column=1, value=T('Diferença (arredondamentos)', 'Difference (rounding)')); wr.cell(row=18, column=2, value='=B15-B17'); wr.cell(row=18, column=3, value='=C15-C17')
for rr in list(range(2, 7)) + list(range(12, 19)):
    for j in (2, 3): wr.cell(row=rr, column=j).number_format = '#,##0.00'
larg(wr, [44, 20, 20])
# ---------- Dados do país
wd = wb.create_sheet(T('Dados do país', 'Country data'))
cab(wd, 1, [T('Item', 'Item'), T('Valor', 'Value'), T('Ano', 'Year'), T('Fonte', 'Source'), T('Grau', 'Grade')])
P = D['pais']; it = [(T('Locais sem energia (%) · C32', 'Sites without electricity (%) · C32'), P['semEnergia']), (T('Locais sem internet (%) · C32', 'Sites without internet (%) · C32'), P['semInternet']),
  (T('Estudantes por professor · C32', 'Pupils per teacher · C32'), P['razao']), (T('Estudantes com deficiência (%)', 'Students with disabilities (%)'), P['deficiencia']),
  (T('Preço do kWh (US$)', 'Price per kWh (US$)'), P['kwh']), (T('Preço por Mbps por mês (US$)', 'Price per Mbps per month (US$)'), P['mbps']), (T('Banda mínima por local (Mbps)', 'Minimum bandwidth per site (Mbps)'), P['velBanda']),
  (T('Preço do GB de dados móveis (US$)', 'Price per GB of mobile data (US$)'), P['gb']), (T('Produção solar por kW (kWh por dia)', 'Solar output per kW (kWh per day)'), P['pvout'])]
for i, (rot, x) in enumerate(it, 2):
    for j, v in enumerate([rot, x and x['v'], x and x.get('ano'), x and (x['fonte'] + (', ' + '/'.join(x.get('niveis') or []) if x.get('niveis') else '')), x and x['grau']], 1): wd.cell(row=i, column=j, value=v)
n = len(it) + 3
wd.cell(row=n, column=1, value=T('Nível de preços (EUA = 1), Banco Mundial', 'Price level (USA = 1), World Bank')); wd.cell(row=n, column=2, value=P['nivel']['v']); wd.cell(row=n, column=3, value=P['nivel']['ano'])
for i, f in enumerate(D['fontes'].values(), n + 2):
    wd.cell(row=i, column=1, value=f['nome']); wd.cell(row=i, column=4, value=f['url']); wd.cell(row=i, column=5, value=f['licenca'])
larg(wd, [60, 12, 8, 60, 18])
# ---------- Catálogo
wc = wb.create_sheet(T('Catálogo', 'Catalogue'))
cab(wc, 1, ['ID', T('Opção', 'Option'), T('Linha', 'Line'), T('Alternativa', 'Alternative'), T('Classe', 'Class'), T('Conta', 'Calculation'), T('Parâmetros (sugestão)', 'Parameters (suggestion)'), T('Preço (US$) e origem', 'Price (US$) and origin'), T('Equipe', 'Team'), T('Nota', 'Note')])
AL = {'ambos': T('com e sem IA', 'with and without AI'), 'com': T('só com IA', 'with AI only'), 'sem': T('só sem IA', 'without AI only')}
def pad(v, pct):
    u = '%' if pct else ''
    return f"{v}{u}" if not isinstance(v, dict) else f"{T('com IA', 'with AI')} {v['com']}{u} / {T('sem IA', 'without AI')} {v['sem']}{u}"
for i, c in enumerate(D['catalogo'], 2):
    pr = c['preco']; po = ''
    if pr:
        po = B(pr['rotulo']) + ': ' + (T(f"perfil {pr['perfil']} (ILOSTAT)", f"profile {pr['perfil']} (ILOSTAT)") if pr['perfil'] else pad(pr['padrao'], False) + ' · ' + (T('dado do país', 'country data') + f" ({pr['pais']})" if pr['pais'] else T('× nível de preços', '× price level') if pr['local'] else T('internacional', 'international')))
    eq = '; '.join(f"{B(x['papel'])} (G{x['perfil']}) {x['pessoas'] if x['pessoas'] is not None else '1/' + str(x['porParam'])} × {round(x['ded'] * 100)}%" + (' *' if x['especialista'] else '') for x in c['papeis'])
    vals = [c['id'], OPN[c['op']], B(c['nome']), AL[c['alt']], CL[c['classe']], B(c['formula']), '; '.join(B(x['rotulo']) + ' = ' + pad(x['padrao'], x['pct']) + (f" ({T('país', 'country')})" if x['pais'] else '') for x in c['params']), po, eq, B(c['nota']) if c['nota'] else '']
    for j, v in enumerate(vals, 1):
        x = wc.cell(row=i, column=j, value=v); x.alignment = Alignment(wrap_text=True, vertical='top')
larg(wc, [18, 8, 34, 14, 9, 50, 50, 40, 50, 50]); wc.freeze_panes = 'A2'
wb.save(OUT); print('ok', OUT, ult - 1, 'linhas')
