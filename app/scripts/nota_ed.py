# Nota técnica da metodologia da educação (markdown para pandoc/xelatex), em PT ou EN, a partir de met-ed.json.
import json, sys
D = json.load(open(sys.argv[1])); L = sys.argv[3]; OUT = sys.argv[2]
T = lambda pt, en: pt if L == 'pt' else en
B = lambda x: (x[L] if isinstance(x, dict) else x) or ''
M = D['met']
def esc(s): return str(s).replace('|', '\\|').replace('*', '\\*').replace('_', '\\_').replace('#', '\\#').replace('$', '\\$')
def tex(s): return s.replace('{,}', '.') if L == 'en' else s
def num(v, d=2):
    s = f"{v:,.{d}f}"
    return s.replace(',', 'X').replace('.', ',').replace('X', '.') if L == 'pt' else s
o = []
o.append('---')
o.append('title: "' + T('Nota técnica: modelo de custeio de Educando com e sem IA', 'Technical note: costing model for Educating with and without AI') + '"')
o.append('subtitle: "AI in Education Procurement Tool · v022"')
o.append('date: "' + T('15 de novembro de 2026', '15 November 2026') + '"')
o.append('lang: ' + ('pt-BR' if L == 'pt' else 'en-GB'))
o.append('geometry: margin=2.2cm\nfontsize: 10pt\nmainfont: DejaVu Serif\nsansfont: DejaVu Sans\nmonofont: DejaVu Sans Mono\nmathfont: "Latin Modern Math"\ncolorlinks: true\nlinkcolor: blue\nurlcolor: blue\ntoc: true\nnumbersections: true\nheader-includes:\n  - \\usepackage{amsmath}\n  - \\usepackage{longtable}\n  - \\setlength{\\emergencystretch}{3em}\n---\n')
o.append('# ' + T('Objetivo e alcance', 'Purpose and scope'))
o.append(B(M['lead']) + ' ' + B(M['arquivos']) + '\n')
o.append('# ' + B(M['hSimples']))
for x in M['simples']: o.append(B(x) + '\n')
o.append('# ' + B(M['hPassos']))
for p in M['passos']:
    o.append('## ' + B(p['titulo']).split('. ', 1)[-1]); o.append(B(p['texto']) + '\n')
o.append('# ' + B(M['hNotacao']))
o.append('| ' + ' | '.join(B(c) for c in M['cabNotacao']) + ' |'); o.append('|:--|:----------|:--|')
for s, d, u in M['notacao']: o.append(f'| ${tex(s)}$ | {esc(B(d))} | {esc(B(u))} |')
o.append('')
o.append('# ' + B(M['hEquacoes']))
n = 0
for e in M['equacoes']:
    o.append('## ' + B(e['titulo']))
    for x in e['tex']:
        n += 1; o.append(f'$$ {tex(x)} \\qquad ({n}) $$')
    o.append('\n' + B(e['texto']) + '\n')
o.append('# ' + B(M['hDados']))
o.append(B(M['dados']) + '\n')
F = D['fontes']
rows = [(T('Locais sem energia e sem internet (%)', 'Sites without electricity and internet (%)'), F['uisEscolas']['nome'], 'A', F['uisEscolas']['licenca']),
        (T('Estudantes por professor', 'Pupils per teacher'), F['uisRazao']['nome'], 'A', F['uisRazao']['licenca']),
        (T('Estudantes com deficiência (%)', 'Students with disabilities (%)'), F['unicef']['nome'], 'A / B', F['unicef']['licenca']),
        (T('Preço do kWh', 'Price per kWh'), F['kwh']['nome'], 'B', F['kwh']['licenca']),
        (T('Produção solar por kW', 'Solar output per kW'), F['pvout']['nome'], 'A', F['pvout']['licenca']),
        (T('Preço por Mbps e banda mínima', 'Price per Mbps and minimum bandwidth'), F['banda']['nome'], 'B', F['banda']['licenca']),
        (T('Preço do GB de dados móveis', 'Price per GB of mobile data'), F['movel']['nome'], 'A', F['movel']['licenca'])]
o.append('| ' + T('Valor', 'Value') + ' | ' + T('Fonte e regra', 'Source and rule') + ' | ' + T('Grau', 'Grade') + ' | ' + T('Licença', 'Licence') + ' |'); o.append('|:------|:--------------|:--|:-----|')
for r in rows: o.append('| ' + ' | '.join(esc(x) for x in r) + ' |')
o.append('\n' + T('Sem dado do país, vale a mediana do grupo do FMI do país (economias avançadas, emergentes ou de renda baixa), com grau B, ou a convenção da ferramenta, com grau C. Níveis usados por desafio (escolas; razão): ', 'Without country data, the median of the country IMF group (advanced, emerging or low-income economies) applies, with grade B, or the tool convention, with grade C. Levels used by challenge (schools; ratio): ')
         + '; '.join(f"{d} ({'/'.join(x['escolas'])}; {'/'.join(x['razao'])})" for d, x in D['niveis'].items()) + '. ' + T('Os níveis seguem a CINE: 0 pré-escola, 1 primário, 2 secundário inferior, 3 secundário superior.', 'Levels follow ISCED: 0 pre-primary, 1 primary, 2 lower secondary, 3 upper secondary.') + '\n')
# exemplo
o.append('# ' + T('Caso de exemplo: Brasil, alfabetização e numeracia', 'Example case: Brazil, foundational literacy and numeracy'))
p = D['publico']; P = D['pais']
o.append(T(f"O caso usa as sugestões da ferramenta para o Brasil no desafio C32, com todas as opções das quatro categorias e valores em US$. O público sugerido é de {num(p['estudantes'],0)} estudantes, {num(p['professores'],0)} professores e {num(p['escolas'],0)} escolas; {num(p['semEnergia'],1)}% dos locais sem energia e {num(p['semInternet'],1)}% sem internet (UIS, primário, {P['semInternet']['ano']}); {num(P['razao']['v'],1)} estudantes por professor (UIS); {num(p['deficiencia'],1)}% de estudantes com deficiência ({B({'pt': 'estimativa mundial do UNICEF', 'en': ''})}). O kWh custa US$ {num(P['kwh']['v'],4)}, o Mbps por mês US$ {num(P['mbps']['v'],4)} com banda mínima de {num(P['velBanda']['v'],0)} Mbps, e um kW solar produz {num(P['pvout']['v'],2)} kWh por dia.",
  f"The case uses the tool suggestions for Brazil in challenge C32, with all options in the four categories and values in US$. The suggested population is {num(p['estudantes'],0)} students, {num(p['professores'],0)} teachers and {num(p['escolas'],0)} schools; {num(p['semEnergia'],1)}% of sites without electricity and {num(p['semInternet'],1)}% without internet (UIS, primary, {P['semInternet']['ano']}); {num(P['razao']['v'],1)} pupils per teacher (UIS); {num(p['deficiencia'],1)}% of students with disabilities (UNICEF world estimate). A kWh costs US$ {num(P['kwh']['v'],4)}, a Mbps per month US$ {num(P['mbps']['v'],4)} with a minimum bandwidth of {num(P['velBanda']['v'],0)} Mbps, and a solar kW produces {num(P['pvout']['v'],2)} kWh per day.") + '\n')
o.append('| ' + ' | '.join([T('Fase', 'Phase'), T('Meses', 'Months'), T('Locais', 'Sites'), T('Estudantes', 'Students'), T('Professores', 'Teachers'), T('Novos estudantes', 'New students')]) + ' |'); o.append('|:--|--:|--:|--:|--:|--:|')
FN = {f['id']: B(f['nomeBi']) for f in D['fasesPadrao']}
for f in D['fases']: o.append(f"| {FN[f['id']]} | {f['meses']} | {num(f['E'],0)} | {num(f['A'],0)} | {num(f['P'],0)} | {num(f['nA'],0)} |")
o.append('')
R = D['resultado']
o.append('| | ' + T('Com IA', 'With AI') + ' | ' + T('Sem IA', 'Without AI') + ' |'); o.append('|:--|--:|--:|')
for rot, k in [('CapEx', 'k'), ('OpEx', 'x'), ('Utility', 'u'), (T('Custo direto', 'Direct cost'), 'direto'), (T('Trabalho de pessoas', 'People work'), 'P'), (T('Viagens', 'Travel'), 'V'), (T('Custos indiretos', 'Indirect costs'), 'O'), (T('Taxa administrativa', 'Administrative fee'), 'T'), (T('Custo total', 'Total cost'), 'total')]:
    o.append(f"| {rot} | {num(R['com'][k])} | {num(R['sem'][k])} |")
o.append('\n' + T('CapEx, OpEx e Utility somam o custo total; os custos adicionais entram no OpEx. A planilha que acompanha esta nota refaz cada linha e chega aos mesmos totais, salvo diferenças de centavos de arredondamento.', 'CapEx, OpEx and Utility add up to the total cost; additional costs enter OpEx. The spreadsheet accompanying this note recomputes each line and reaches the same totals, except for rounding differences of cents.') + '\n')
top = sorted([l for l in D['linhas'] if not l['informativo']], key=lambda l: -l['total'])[:12]
o.append(T('As doze linhas de maior valor no caso são:', 'The twelve highest-value lines in the case are:') + '\n')
o.append('| ' + T('Linha', 'Line') + ' | ' + T('Alternativa', 'Alternative') + ' | ' + T('Classe', 'Class') + ' | US$ |'); o.append('|:------|:--|:--|--:|')
AL = {'com': T('com IA', 'with AI'), 'sem': T('sem IA', 'without AI'), 'ambos': T('com e sem IA', 'with and without AI')}
CL = {'capex': 'CapEx', 'opex': 'OpEx', 'uso': 'Utility'}
for l in top: o.append(f"| {esc(B(l['nome']))} | {AL[l['alt']]} | {CL[l['classe']]} | {num(l['total'])} |")
o.append('')
# catálogo
o.append('# ' + B(M['hCatalogo'])); o.append(B(M['catalogo']) + '\n')
BASE = {'E': T('locais', 'sites'), 'A': T('estudantes', 'students'), 'P': T('professores', 'teachers'), 'def': T('estudantes com deficiência', 'students with disabilities')}
def pad(v, pct=False):
    u = '%' if pct else ''
    return f"{v}{u}" if not isinstance(v, dict) else f"{T('com IA', 'with AI')} {v['com']}{u}, {T('sem IA', 'without AI')} {v['sem']}{u}"
for c in D['categorias']:
    o.append(f"## {c['n']} {esc(B(c['nome']))}")
    for op in c['opcoes']:
        o.append(f"### {op['n']} {esc(B(op['nome']))}")
        for d in [x for x in D['catalogo'] if x['op'] == op['id']]:
            partes = [AL[d['alt']] + ', ' + CL[d['classe']] + (', ' + B(d['unidade']) if B(d['unidade']) else '') + '.', T('Conta: ', 'Calculation: ') + B(d['formula']) + '.']
            if d['params']: partes.append(T('Parâmetros: ', 'Parameters: ') + '; '.join(B(x['rotulo']) + ' = ' + pad(x['padrao'], x['pct']) + (T(' (valor do país)', ' (country value)') if x['pais'] else '') + ((' (' + ', '.join(f"{k} {v}" for k, v in x['porDesafio'].items()) + ')') if x['porDesafio'] else '') for x in d['params']) + '.')
            pr = d['preco']
            if pr: partes.append(T('Preço: ', 'Price: ') + B(pr['rotulo']) + ', ' + (T(f"custo {'da hora' if pr['hora'] else 'mensal'} do perfil {pr['perfil']} no país (ILOSTAT, com encargos)", f"{'hourly' if pr['hora'] else 'monthly'} cost of profile {pr['perfil']} in the country (ILOSTAT, with contributions)") if pr['perfil'] else 'US$ ' + pad(pr['padrao']) + ' ' + (T('substituído pelo dado do país', 'replaced by country data') if pr['pais'] else T('× nível de preços do país', '× country price level') if pr['local'] else T('(referência internacional)', '(international reference)'))) + '.')
            if d['papeis']: partes.append(T('Equipe: ', 'Team: ') + '; '.join(f"{B(x['papel'])} ({T('perfil', 'profile')} {x['perfil']}, " + (f"{x['pessoas']} " + T('pessoa(s)', 'person(s)') if x['pessoas'] is not None else T('1 para cada ', '1 per ') + str(next((pp['padrao'] for pp in d['params'] if pp['id'] == x['porParam']), '')) + ' ' + BASE[x['base'] or 'E']) + f", {round(x['ded']*100)}%" + (T(', com prêmio de especialista', ', with specialist premium') if x['especialista'] else '') + ')' for x in d['papeis']) + '.')
            if d['vida']: partes.append(T('Vida útil: ', 'Useful life: ') + f"{d['vida']} " + T('meses', 'months') + '.')
            if d['extra']: partes.append(T('Só nos desafios ', 'Only in challenges ') + ', '.join(d['extra']) + '.')
            if d['nota']: partes.append(B(d['nota']))
            o.append(f"#### {esc(B(d['nome']))} ({esc(d['id'])}) {{.unnumbered}}"); o.append(esc(' '.join(partes)) + '\n')
o.append('# ' + B(M['hComparacao']))
for x in M['comparacao']: o.append(B(x) + '\n')
o.append('# ' + B(M['hLimites']))
for x in M['limites']: o.append(B(x) + '\n')
o.append('# ' + B(M['hGraus'])); o.append(B(M['graus']) + '\n')
o.append('# ' + B(M['hRefs']))
for r, u in M['refs']: o.append(f"- {esc(r)} <{u}>")
open(OUT, 'w').write('\n'.join(o) + '\n'); print('ok', OUT)
