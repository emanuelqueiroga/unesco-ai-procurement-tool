# Plano de contratação e PDF na v13 (pacote B3: src/resumo.js, src/plano_pdf.js, src/recomendacoes.js).
# Uso: python3 tests/test_v13_plano.py   (depois de bash build.sh; NAV=<arquivo> testa outro build)
# O estado novo do passo 1.2 (S.ctx.prioridades, problemas, subs, problemaOutro), da linha de base (S.caso.linhaBase*)
# e das 1.3.x (S.respDet) é montado direto no estado, sem depender das telas do percurso (pacote B1).
# Verifica:
#  - perfil do caso (página, Markdown e PDF): cartão "Prioridade e impacto" com prioridades, problemas marcados e
#    subcategorias, "Outro problema", aviso discreto de lacunas "__" nos objetivos, linha de base com os problemas e a
#    medida; cartão de governança com "Qual?" e "O que falta?"; o B1 do plano cita o que falta;
#  - matriz do caso (RQ-03): seção logo depois de "Em resumo" na página, no Markdown e no PDF; 7 camadas × 4 fases;
#    crédito e nota de custo; soma das células de custo = custo total do ciclo (numerosCusto().total, r = 0);
#    PDF em duas páginas retrato, as 7 camadas em cada uma, nenhuma página quase vazia; fontes >= 8 pt;
#    400 px: sem rolagem horizontal da página (a tabela rola dentro do próprio quadro);
#  - as cinco recomendações novas: (a) 1.3.x "Em parte" com "O que falta?" → a ação cita o que falta; (b) plano de
#    formação (problema ou prioridade que pede formação); (c) problemas sem tarefa de IA → regras e processos antes de
#    comprar; (d) objetivos com lacunas → completar as metas; (e) linha de base sem medida → registrar a medida;
#    cada uma com porque, "ir" para uma pergunta que existe, e nenhuma delas nos exemplos A–D sem o estado novo;
#  - EN: perfil, recomendações novas e textos da matriz desta ferramenta (legenda, soma, continuação) sem português.
# Imagens de verificação: /tmp/claude-0/v13_b3/v13_plano/*.png
import asyncio, json, os, re, subprocess, sys
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = '/tmp/claude-0/v13_b3/v13_plano'
os.makedirs(TMP, exist_ok=True)
for f in os.listdir(TMP):
    if f.endswith('.png'): os.remove(os.path.join(TMP, f))
NAV = os.environ.get('NAV', os.path.join(RAIZ, 'navegador.html'))
SK = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>' + open(NAV).read() + '</body></html>'
open(f'{TMP}/nav.html', 'w').write(SK)
PT = re.compile(r'ção|ções|ã|õ|\b(?:não|você|para o|do caso|também|custo|orçament|decisão)\b', re.I)
falhas = []

def ok(cond, msg):
    print(('ok   ' if cond else 'FALHA ') + msg)
    if not cond: falhas.append(msg)

def norm(s):
    return re.sub(r'\s+', ' ', str(s).replace(' ', ' ').replace(' ', ' ').replace(' ', ' ')).strip()

def paginas(arq):
    n = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', arq], capture_output=True, text=True).stdout).group(1))
    return [subprocess.run(['pdftotext', '-layout', '-f', str(i), '-l', str(i), arq, '-'], capture_output=True, text=True).stdout for i in range(1, n + 1)]

# Caso v13 sobre o exemplo B: duas prioridades, três problemas (um pede formação), subcategorias, outro problema,
# objetivos com lacunas, linha de base "Sim" sem medida e detalhes em 1.3.1 (Sim) e 1.3.2 (Em parte)
CASO_V13 = """(()=>{carregarExemplo('B'); S.boasVindas=false;
  S.ctx.prioridades=['com','sobre']; S.ctx.problemas=['C2','C6','A2']; S.ctx.subs=['C2a','C2d','A2b']; S.ctx.problemaOutro='Pouco uso dos laboratórios de informática';
  S.caso.resultado='Reduzir de 48% para __% os estudantes do 9º ano abaixo do nível adequado em matemática em __ anos.\\nFormar __ professores em letramento em IA até __.';
  S.caso.linhaBase='sim'; S.caso.linhaBaseProblemas=['C2']; S.caso.linhaBaseMedida=''; S.caso.linhaBaseProblemaTxt='';
  S.respDet={'g-politica':{qual:'Resolução 12/2025 da secretaria',falta:'aprovar no conselho estadual'},'g-comite':{qual:'Comitê de inovação (pedagogia, TI, jurídico)',falta:''}};
  S.resp['g-politica']='parcial'; S.resp['g-comite']='sim';
  S.custo.editado=false; S.vista=''; render(); abrirPlano();})()"""
NOVAS = ['formacao-plano', 'sem-ferramenta', 'metas-lacunas', 'linha-base-medida']

# Matriz: soma das células de custo, total do ciclo e soma das camadas
SOMA = """(() => { const s = secoesPlano().find(z => z.id === 'matriz' && !z.sub); const n = numerosCusto(); const cam = n.camadas || somaPorCamada(n.av);
  const cel = s.mx.linhas.reduce((a, l) => a + l.cel.reduce((b, c) => b + (+c.custo || 0), 0), 0);
  return { custo: s.mx.custo, cel, somas: s.mx.somas, total: s.mx.total, ciclo: n.total, camadas: [1,2,3,4,5,6,7].reduce((a, k) => a + (cam.total[k] || 0), 0),
    linhas: s.mx.linhas.length, fases: s.mx.fases.map(f => f.id), rows: s.table.rows.length, grandeTotal: grande(s.mx.total),
    celulas: s.mx.linhas.map(l => l.cel.map(c => c.custo == null ? null : grande(c.custo))) }; })()"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, h, tag in [(1400, 900, 'd'), (400, 860, 'm')]:
            ctx = await b.new_context(viewport={'width': w, 'height': h}, accept_downloads=True)
            pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') and 'TUNNEL' not in m.text else None)
            await pg.goto(f'file://{TMP}/nav.html'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
            await pg.select_option('#sel-lang', 'pt'); await pg.wait_for_timeout(150)
            await pg.evaluate(CASO_V13); await pg.wait_for_timeout(300)

            # ---------------------------------------------------------------- página
            r = await pg.evaluate("""(() => { const P = document.getElementById('plano'); if (!P) return null;
              const o = [...P.querySelectorAll('[data-bloco], [data-sec]')].map(e => e.dataset.bloco ? '[' + e.dataset.bloco + ']' : e.dataset.sec);
              const card = id => (P.querySelector('[data-sec="perfil"] .rp-card[data-area="' + id + '"]') || {}).innerText || '';
              const M = P.querySelector('[data-sec="matriz"]'), W = M && (M.querySelector('.rp-mx-w') || M.querySelector('table').parentElement);
              const minF = el => { let m = 99; el.querySelectorAll('*').forEach(e => { if (![...e.childNodes].some(n => n.nodeType === 3 && n.data.trim())) return; const r = e.getBoundingClientRect(); if (!r.width) return; m = Math.min(m, parseFloat(getComputedStyle(e).fontSize)); }); return m; };
              return { o, prob: card('problema'), gov: card('governanca'), lac: P.querySelectorAll('[data-sec="perfil"] .rp-lac').length,
                b1: (P.querySelector('[data-sec="B1"]') || {}).innerText || '', mx: M ? M.innerText : '', mxH: M ? (M.querySelector('h3') || {}).innerText : '',
                linhas: M ? M.querySelectorAll('table tbody tr').length : 0, fonteMx: M ? minF(M) : 0, fontePerfil: minF(P.querySelector('[data-sec="perfil"]')),
                sw: document.documentElement.scrollWidth, wScroll: W ? W.scrollWidth > W.clientWidth + 1 : null, toc: !!P.querySelector('.rp-indice a[data-toc-l="matriz"]') }; })()""")
            ok(r is not None, f'{tag}: plano aberto')
            if not r: continue
            o = r['o']
            ok('matriz' in o and o.index('resumo') < o.index('matriz') < o.index('recs') < o.index('perfil'), f'{tag}: matriz logo depois de "Em resumo" ({o[:5]})')
            ok(r['mxH'] == 'O que cada fase exige, por camada' and r['toc'], f'{tag}: título da matriz e item no índice ({r["mxH"]})')
            ok(r['linhas'] >= 7, f'{tag}: matriz com 7 camadas ({r["linhas"]})')
            ok('Camadas: Krueger e Jackson (2026, p. 11). Distribuição por fase: elaboração desta ferramenta.' in r['mx'], f'{tag}: crédito da matriz')
            ok('Soma das células de custo (igual ao custo total do ciclo):' in r['mx'], f'{tag}: soma das células de custo na página')
            ok(r['fonteMx'] >= 13.75 and r['fontePerfil'] >= 13.75, f'{tag}: nenhum texto abaixo de .86rem (matriz {r["fonteMx"]}, perfil {r["fontePerfil"]})')
            ok(r['sw'] <= w + 1, f'{tag}: sem rolagem horizontal da página ({r["sw"]})')
            if tag == 'm': ok(r['wScroll'] is not False, f'{tag}: a matriz rola dentro do próprio quadro')
            pr = r['prob']
            for s in ['Prioridade e impacto', 'Prioridades', 'Educar sobre a IA; Educar com a IA', 'Problemas marcados',
                      'Baixa proficiência em matemática (Numeracia nos anos iniciais; Resolução de problemas).',
                      'Professores não se sentem preparados para ensinar sobre IA (Uso em sala).',
                      'Estudantes com defasagem não recebem apoio individual a tempo.',
                      'Outro problema', 'Pouco uso dos laboratórios de informática',
                      'Para quais problemas: Baixa proficiência em matemática', 'Medida: não informada']:
                ok(s in pr, f'{tag}: perfil "Prioridade e impacto" com "{s}"')
            ok('Problema e impacto' not in pr, f'{tag}: rótulo antigo "Problema e impacto" saiu')
            ok(r['lac'] == 1 and 'Há lacunas (__) a completar com os dados da rede.' in pr, f'{tag}: aviso discreto de lacunas nos objetivos ({r["lac"]})')
            for s in ['Governança de IA na educação', 'Qual: Comitê de inovação (pedagogia, TI, jurídico)', 'Em parte', 'Qual: Resolução 12/2025 da secretaria', 'O que falta: aprovar no conselho estadual']:
                ok(s in r['gov'], f'{tag}: perfil de governança com "{s}"')
            ok('O que falta: aprovar no conselho estadual.' in r['b1'] and 'Qual: Resolução 12/2025 da secretaria.' in r['b1'], f'{tag}: B1 com "Qual?" e "O que falta?"')
            await pg.locator('#plano-matriz').scroll_into_view_if_needed()
            await pg.locator('#plano-matriz').screenshot(path=f'{TMP}/pagina_{tag}_matriz.png')
            await pg.locator('#plano-perfil .rp-perfil').screenshot(path=f'{TMP}/pagina_{tag}_perfil.png')

            if tag == 'd':
                # ------------------------------------------------------------ soma da matriz = total do ciclo
                m = await pg.evaluate(SOMA)
                ok(m['linhas'] == 7 and m['fases'] == ['contexto', 'piloto', 'implantacao', 'expansao'] and m['rows'] == 8, f'matriz 7 × 4 com linha de total ({m["linhas"]}, {m["fases"]}, {m["rows"]})')
                ok(m['custo'] and abs(m['cel'] - m['ciclo']) < 0.5 and abs(m['total'] - m['ciclo']) < 0.5 and abs(m['camadas'] - m['ciclo']) < 0.5,
                   f'soma das células = custo total do ciclo, r = 0 ({m["cel"]:.2f} / {m["ciclo"]:.2f} / camadas {m["camadas"]:.2f})')
                ok(m['somas'][0] is None, 'fase 1 sem custo estimado')
                # ------------------------------------------------------------ Markdown e HTML
                md = await pg.evaluate("relMD(dadosRelatorio())")
                i_res, i_mx, i_rec = md.find('## Resumo do caso'), md.find('## O que cada fase exige, por camada'), md.find('## Recomendações para você')
                ok(0 <= i_res < i_mx < i_rec, f'Markdown: matriz entre o resumo e as recomendações ({i_res}, {i_mx}, {i_rec})')
                tmd = md[i_mx:i_rec]
                ok(tmd.count('\n| ') >= 9 and '| Camada | 1. Contexto | 2. Prova de conceito ou piloto | 3. Implantação | 4. Expansão |' in tmd, 'Markdown: tabela camada × fase com cabeçalho e 8 linhas')
                ok('(Respondido' in tmd or '· Respondido' in tmd, 'Markdown: células com estado')
                ok('Camadas: Krueger e Jackson (2026, p. 11)' in tmd and 'Custo de cada célula' in tmd, 'Markdown: crédito e nota de custo')
                ok('**Prioridades:** Educar sobre a IA; Educar com a IA' in md and 'O que falta: aprovar no conselho estadual' in md, 'Markdown: perfil com prioridades e detalhes')
                html = await pg.evaluate("relHTML(dadosRelatorio(), true)")
                ok('O que cada fase exige, por camada' in html and 'Distribuição por fase: elaboração desta ferramenta.' in html, 'HTML exportado com a matriz e o crédito')

                # ------------------------------------------------------------ recomendações novas
                R = await pg.evaluate("recomendacoesCaso().map(r => ({id: r.id, quando: r.quando, tipo: r.tipo, prio: r.prioridade, texto: r.texto, n: r.porque.n, resp: r.porque.resposta, ir: r.ir}))")
                by = {x['id']: x for x in R}
                g = by.get('g-politica')
                ok(g and g['texto'].endswith('O que falta: aprovar no conselho estadual.') and g['resp'] == 'Em parte' and g['n'] == '1.3.2', f'(a) 1.3.2 "Em parte" cita o que falta ({g and g["texto"]})')
                x = by.get('formacao-plano')
                ok(x and x['quando'] == 'antes_teste' and x['n'] == '1.2.2' and 'Professores não se sentem preparados para ensinar sobre IA.' in x['resp'] and 'camada 6' in x['texto'], f'(b) plano de formação antes do teste ({x})')
                x = by.get('metas-lacunas')
                ok(x and x['quando'] == 'antes_teste' and x['n'] == '1.2.6' and x['resp'] == 'Com lacunas a completar', f'(d) metas com lacunas ({x})')
                x = by.get('linha-base-medida')
                ok(x and x['quando'] == 'antes_teste' and x['prio'] == 'media' and x['n'] == '1.2.7', f'(e) linha de base sem medida, prioridade média ({x})')
                ok('sem-ferramenta' not in by, '(c) sem a ação de regras e processos quando há problemas com tarefa de IA')
                ruins = []
                for x in [by[k] for k in NOVAS + ['g-politica'] if k in by]:
                    f_, p_, q_ = x['ir'].split(':')
                    if not await pg.evaluate(f"(()=>{{abrirFase('{f_}','{p_}','{q_}'); return S.passo==='{p_}' && !!document.getElementById('q-{q_}');}})()"): ruins.append(x['ir'])
                ok(not ruins, f'recomendações novas: "Ir à pergunta" leva a perguntas que existem {ruins}')
                CEN = [
                    ("S.ctx.prioridades=['governar']; S.ctx.problemas=['G2','G4','G10'];", 'sem-ferramenta', lambda x: x['quando'] == 'antes_contratar' and x['tipo'] == 'custo' and x['n'] == '1.2.2'),
                    ("S.ctx.prioridades=['sobre']; S.ctx.problemas=['A1'];", 'formacao-plano', lambda x: x['n'] == '1.2.1' and x['resp'] == 'Educar sobre a IA'),
                    ("S.ctx.prioridades=['com']; S.ctx.problemas=['C2']; S.caso.linhaBase='parcial'; S.caso.linhaBaseMedida='Avaliação estadual de matemática do 9º ano, 2025';", 'linha-base-medida', None),
                    ("S.ctx.prioridades=['governar','com']; S.ctx.problemas=['G2','C2'];", 'sem-ferramenta', None),
                    ("S.ctx.prioridades=['com']; S.ctx.problemas=['C2']; S.caso.resultado='Reduzir de 48% para 35% os estudantes abaixo do nível adequado em dois anos.';", 'metas-lacunas', None),
                    ("S.resp['g-politica']='parcial'; S.respDet={'g-politica':{qual:'Resolução 12',falta:''}};", 'g-politica-falta', None),
                ]
                for js, rid, cond in CEN:
                    x = await pg.evaluate(f"""(()=>{{carregarExemplo('B'); S.boasVindas=false; {js} const R=recomendacoesCaso();
                      const g=R.find(r=>r.id==='g-politica'); const x=R.find(r=>r.id==='{rid}');
                      return {{x: x ? {{quando:x.quando, tipo:x.tipo, n:x.porque.n, resp:x.porque.resposta}} : null, g: g ? g.texto : ''}};}})()""")
                    if rid == 'g-politica-falta': ok('O que falta' not in x['g'], 'sem "O que falta?" preenchido, a ação de 1.3.2 fica como antes')
                    elif cond: ok(x['x'] is not None and cond(x['x']), f'{rid}: {js.strip()} ({x["x"]})')
                    else: ok(x['x'] is None, f'{rid} ausente: {js.strip()}')
                for ex in ['A', 'B', 'C', 'D']:
                    ids = await pg.evaluate(f"(()=>{{carregarExemplo('{ex}'); S.boasVindas=false; return recomendacoesCaso().map(r=>r.id);}})()")
                    ok(not [i for i in ['formacao-plano', 'sem-ferramenta', 'metas-lacunas'] if i in ids], f'{ex}: sem as regras novas do passo 1.2 sem o estado novo')

                # ------------------------------------------------------------ PDF (PT)
                await pg.evaluate(CASO_V13); await pg.wait_for_timeout(250)
                m = await pg.evaluate(SOMA)
                tam = await pg.evaluate("(() => { const d = gerarPDF(); const t = d.internal.pages.slice(1).map(p => (p || []).join('\\n')).join('\\n'); return [...new Set(t.match(/ [\\d.]+ Tf/g) || [])].map(z => +z.trim().split(' ')[0]); })()")
                ok(min(tam) >= 8, f'PDF: menor fonte {min(tam)} pt')
                async with pg.expect_download() as dl:
                    await pg.locator('[data-act="pdf"]:visible').first.click()
                d = await dl.value; arq = f'{TMP}/plano_pt_B_v13.pdf'; await d.save_as(arq)
                P = paginas(arq); PN = [norm(t) for t in P]
                pm = [i for i, t in enumerate(PN) if i > 0 and 'O que cada fase exige, por camada' in t]
                ok(len(pm) == 2 and pm[1] == pm[0] + 1 and pm[0] >= 2, f'PDF: matriz em duas páginas seguidas ({[i + 1 for i in pm]})')
                if len(pm) == 2:
                    a, b_ = PN[pm[0]], PN[pm[1]]
                    pR = next((i for i, t in enumerate(PN) if 'Recomendações para você' in t and i > 0), -1)
                    pRes = next((i for i, t in enumerate(PN) if 'Em resumo' in t and i > 0), -1)
                    ok(pRes < pm[0] and pm[1] < pR, f'PDF: matriz entre "Em resumo" (p. {pRes + 1}) e as recomendações (p. {pR + 1})')
                    ok('1. Contexto' in a and '2. Prova de conceito ou piloto' in a and '3. Implantação' in b_ and '4. Expansão' in b_, 'PDF: fases 1 e 2 na primeira página, 3 e 4 na segunda')
                    ok(all(f'{k}. ' in a and f'{k}. ' in b_ for k in range(1, 8)) and '7. Operação' in a and '7. Operação' in b_, 'PDF: as 7 camadas nas duas páginas')
                    ok('Camadas: Krueger e Jackson (2026, p. 11). Distribuição por fase: elaboração desta ferramenta.' in a and 'Distribuição por fase: elaboração desta ferramenta.' in b_, 'PDF: crédito nas duas páginas')
                    ok('Custo de cada célula, na conta econômica' in a + b_, 'PDF: nota de custo')
                    ok(norm('Soma das células de custo (igual ao custo total do ciclo): ' + m['grandeTotal']) in b_, f'PDF: soma das células = {m["grandeTotal"]}')
                    vals = [v for l in m['celulas'] for v in l if v]
                    ok(all(norm(v) in a + ' ' + b_ for v in vals), 'PDF: custo de cada célula na matriz')
                    ok('Respondido' in a and 'Estado das respostas' in a, 'PDF: estado das células e legenda')
                    ok(all(len([l for l in P[i].split('\n') if l.strip()]) >= 30 for i in pm), 'PDF: páginas da matriz cheias (nenhuma quase vazia)')
                tudo = norm(' '.join(P))
                for s in ['Prioridade e impacto', 'Educar sobre a IA; Educar com a IA', 'Baixa proficiência em matemática (Numeracia nos anos iniciais; Resolução de problemas).',
                          'Qual: Resolução 12/2025 da secretaria', 'O que falta: aprovar no conselho estadual', 'Medida: não informada', 'Governança de IA na educação']:
                    ok(norm(s) in tudo, f'PDF: perfil com "{s}"')
                ok('Montar um plano de formação antes do teste' in tudo and 'Completar as metas com os números da rede' in tudo, 'PDF: recomendações novas')
                quase = [i + 1 for i, t in enumerate(P) if 0 < len([l for l in t.split('\n') if l.strip()]) <= 4]
                ok(not quase, f'PDF: nenhuma página quase vazia {quase}')
                for i in pm: subprocess.run(['pdftoppm', '-r', '90', '-png', '-f', str(i + 1), '-l', str(i + 1), arq, f'{TMP}/pdf_pt_matriz_p{i + 1}'])
                pP = next((i for i, t in enumerate(PN) if 'Perfil do caso' in t and i > 0), -1)
                if pP >= 0: subprocess.run(['pdftoppm', '-r', '90', '-png', '-f', str(pP + 1), '-l', str(pP + 1), arq, f'{TMP}/pdf_pt_perfil_p{pP + 1}'])

                # ------------------------------------------------------------ EN
                await pg.select_option('#sel-lang', 'en'); await pg.wait_for_timeout(200)
                await pg.evaluate(CASO_V13); await pg.wait_for_timeout(300)
                r = await pg.evaluate("""(() => { const P = document.getElementById('plano');
                  return { prob: P.querySelector('.rp-card[data-area="problema"]').innerText, gov: P.querySelector('.rp-card[data-area="governanca"]').innerText,
                    recs: recomendacoesCaso().filter(r => ['formacao-plano','metas-lacunas','linha-base-medida','g-politica'].includes(r.id)).map(r => tr(r.texto)) }; })()""")
                ok('Priority and impact' in r['prob'] and 'Selected problems' in r['prob'] and 'Measure: not provided' in r['prob'], 'en: cartão "Priority and impact"')
                ok('Specifically:' in r['gov'] and 'What is missing:' in r['gov'], 'en: cartão de governança com os detalhes')
                ok(len(r['recs']) == 4 and not [t for t in r['recs'] if PT.search(t.replace('aprovar no conselho estadual', ''))], f'en: recomendações novas sem português {r["recs"]}')
                ok(not [t for t in r['recs'] if re.search(r'\bnetwork', t, re.I)], 'en: recomendações novas sem "network"')
                async with pg.expect_download() as dl:
                    await pg.locator('[data-act="pdf"]:visible').first.click()
                d = await dl.value; arq = f'{TMP}/plano_en_B_v13.pdf'; await d.save_as(arq)
                P = paginas(arq); tudo = norm(' '.join(P))
                ok('Status of the answers' in tudo and '(continued)' in tudo and 'Sum of the cost cells (equal to the total life-cycle cost):' in tudo, 'en PDF: legenda, continuação e soma da matriz em inglês')
                ok('Answered' in tudo and 'Priority and impact' in tudo, 'en PDF: estados e perfil em inglês')
                for i, t in enumerate(P):
                    if 'Status of the answers' in t: subprocess.run(['pdftoppm', '-r', '90', '-png', '-f', str(i + 1), '-l', str(i + 1), arq, f'{TMP}/pdf_en_matriz_p{i + 1}'])
            ok(not errs, f'{tag}: sem erros de console {errs[:5]}')
            await ctx.close()
        await b.close()
    print('\n' + ('TUDO OK' if not falhas else f'{len(falhas)} FALHA(S)'))
    sys.exit(1 if falhas else 0)

asyncio.run(main())
