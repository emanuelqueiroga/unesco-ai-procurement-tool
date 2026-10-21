# Teste da v15, proposta A (assistente guiado, src/assistente.js): percorre a nova experiência de ponta a ponta.
# Uso: python3 tests/test_v15_a.py   (depois de bash build.sh)
#  - 1366 px: começa um caso em branco pela página inicial, responde perguntas pelo clique e pelo teclado (Enter),
#    usa Voltar e o índice "Ir para…", confere que o medidor mostra o custo de numerosCusto() e o delta da última
#    resposta, "Não sei: usar valor ilustrativo", fim de fase, tela de resultado, plano e PDF baixado;
#  - modo essencial com no máximo 20 telas, progresso "Pergunta n de N" com N recalculado (pergunta condicional);
#  - confirmação antes de substituir um caso com respostas (menu "Caso") e Desfazer;
#  - 390 px: uma pergunta por tela, botões com 48 px ou mais, sem rolagem horizontal;
#  - árabe (RTL) em 1366 e 390 px: sem rolagem horizontal nas telas principais;
#  - inglês: nenhum texto novo da interface em português e nenhuma magnitude "mi"/"mil" no plano.
import asyncio, os, re, subprocess
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = '/tmp/claude-0/v15_a'
os.makedirs(TMP, exist_ok=True)
open(f'{TMP}/nav.html', 'w').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'
                                    + open(os.path.join(RAIZ, 'navegador.html')).read() + '</body></html>')
OK, FALHAS = [], []
def ok(c, msg):
    (OK if c else FALHAS).append(msg)
    print(('ok    ' if c else 'FALHA ') + msg)

TELA = "(() => { const a = document.getElementById('assistente'); return a ? a.dataset.tela : null; })()"
LARG = "[document.documentElement.scrollWidth, window.innerWidth]"
CUSTO = """(() => { const b = document.querySelector('[data-as-total]'); const n = numerosCusto();
  return { mostrado: b ? b.textContent.trim() : null, motor: grande(n.total), total: n.total }; })()"""
PT = re.compile(r'[ãõç]|ções|\b(não|você|pergunta|perguntas|respostas?|Fase \d|Custo total|Voltar|Continuar|Detalhar|Ir para)\b', re.I)

async def tela(pg): return await pg.evaluate(TELA)
async def seguir(pg):
    await pg.locator('#as-nav .as-seguir, .as-fim-a .as-seguir').first.click(); await pg.wait_for_timeout(150)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1366, 'height': 900}, accept_downloads=True)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        externos = []
        pg.on('request', lambda r: externos.append(r.url) if r.url.startswith('http') else None)
        await pg.goto(f'file://{TMP}/nav.html'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)

        # ------------------------------------------------------------ início e primeira tela
        await pg.locator('#inicio [data-act="comecar"]').click(); await pg.wait_for_timeout(200)
        ok(await tela(pg) == 'q:pais', f'1366: "Começar" abre a primeira pergunta (1.1.0) ({await tela(pg)})')
        prog = await pg.locator('#as-prog').inner_text()
        ok('Phase 1 of 4' in prog and re.search(r'Question 1 of (\d+)', prog) is not None, f'progresso "Phase 1 of 4 · Question 1 of N" ({prog[:80]!r})')
        N = int(re.search(r'Question 1 of (\d+)', prog).group(1))
        ok(N <= 20, f'modo essencial com no máximo 20 telas de pergunta ({N})')
        ok(await pg.locator('#as-tela .as-h').count() == 1 and await pg.locator('#as-tela .as-q').count() == 1, 'uma pergunta por tela')
        ok(await pg.evaluate("document.querySelector('.as-por') && !document.querySelector('.as-por').open"), '"Por que perguntamos?" fechado por padrão')
        ok('3 answers are missing' in await pg.locator('#as-custo').inner_text(), 'medidor: "Faltam 3 respostas para estimar" antes das respostas mínimas')

        # ------------------------------------------------------------ 1.1.4/1.1.5 juntas, pelo clique e pelo teclado
        await seguir(pg)
        ok(await tela(pg) == 'q:etapas', f'Continuar sem responder leva à próxima tela ({await tela(pg)})')
        await pg.locator('label.opt:has([data-etapa="fund2"])').click(); await pg.wait_for_timeout(200)
        ok(await pg.locator('#n-etapas-fund2-escolas').count() == 1, 'a grade de escolas × estudantes aparece na mesma tela (grupo indissociável)')
        await pg.click('#n-etapas-fund2-escolas'); await pg.keyboard.type('600')
        for i, v in enumerate(['40000', '39000', '38000', '37000']):
            await pg.click(f'#n-etapas-fund2-anos-{i}'); await pg.keyboard.type(v)
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(250)
        ok(await tela(pg) == 'q:prioridades', f'Enter continua ({await tela(pg)})')
        ok(await pg.evaluate("totaisCtx().alunos") == 154000 and await pg.evaluate("totaisCtx().escolas") == 600, 'respostas da grade gravadas (600 escolas, 154.000 estudantes)')
        await pg.locator('#as-nav .as-voltar').click(); await pg.wait_for_timeout(150)
        ok(await tela(pg) == 'q:etapas', 'Voltar leva à tela anterior')
        await pg.keyboard.press('Alt+ArrowRight')  # nada
        await seguir(pg)

        # ------------------------------------------------------------ índice "Ir para…" com os 15 passos
        await pg.locator('#as-prog [data-as="indice"]').click(); await pg.wait_for_timeout(150)
        ok(await pg.locator('dialog#as-ind[open]').count() == 1 and await pg.locator('#as-ind [data-as-passo]').count() == 15, 'índice "Ir para…" com os 15 passos')
        nums = await pg.locator('#as-ind .as-ix-pn').all_inner_texts()
        ok(nums[:4] == ['1.1', '1.2', '1.3', '2.0'] and nums[-1] == '4.3', f'números dos passos sempre visíveis ({nums[:4]}…{nums[-1:]})')
        est = await pg.locator('#as-ind [data-as-passo="1a"] .as-ix-e').inner_text()
        ok(est.strip() in ('In progress', 'Essentials answered', 'Complete'), f'estado do passo em texto ({est!r})')
        await pg.locator('#as-ind [data-as-passo="2a"]').click(); await pg.wait_for_timeout(200)
        ok(await tela(pg) == 'q:tarefas', f'índice abre o passo 2.1 ({await tela(pg)})')
        await pg.locator('#as-tela label.opt').nth(0).click(); await pg.locator('#as-tela label.opt').nth(1).click(); await pg.wait_for_timeout(150)
        ok(await pg.evaluate("(S.caso.tarefas||[]).length") == 2, 'duas tarefas marcadas pelo clique')
        await seguir(pg)
        ok(await tela(pg) == 'q:usuarios', f'próxima essencial: 2.2.1 ({await tela(pg)})')
        lbl = await pg.locator('#as-nav .as-seguir').inner_text()
        ok('Confirm' in lbl, f'sugestão pendente: o botão diz "Confirmar e continuar" ({lbl.strip()!r})')
        await seguir(pg)
        ok(await pg.evaluate("!!S.respC.usuarios"), 'Continuar confirma a sugestão')
        ok(await tela(pg) == 'q:tipoTec', f'próxima: 2.3.4 ({await tela(pg)})')
        await pg.locator('#as-tela label.opt:has(input[value="paga"])').click(); await pg.wait_for_timeout(250)

        # ------------------------------------------------------------ medidor de custo = numerosCusto()
        C = await pg.evaluate(CUSTO)
        ok(C['mostrado'] and C['mostrado'] == C['motor'], f'medidor mostra o custo total do motor ({C["mostrado"]} = {C["motor"]})')
        await seguir(pg)
        ok(await tela(pg) == 'q:pagamento', f'próxima: 2.3.5 ({await tela(pg)})')
        await pg.locator('#as-tela label.opt:has(input[value="usuario"])').click(); await pg.wait_for_timeout(300)
        C2 = await pg.evaluate(CUSTO)
        d = await pg.locator('#as-custo .as-c-d').inner_text()
        ok(C2['mostrado'] == C2['motor'] and C2['total'] != C['total'], f'a resposta muda o custo e o medidor acompanha ({C["mostrado"]} → {C2["mostrado"]})')
        ok('in the total cost' in d and '2.3.5' in d, f'delta da última resposta, com a pergunta ({d.strip()[:90]!r})')
        live = await pg.evaluate("document.getElementById('as-c-live').textContent")
        ok('Estimated total cost' in live, f'mudança anunciada em região aria-live ({live[:60]!r})')
        await pg.locator('#as-custo [data-as="gaveta"]').click(); await pg.wait_for_timeout(300)
        g = await pg.locator('#as-gaveta').inner_text()
        ok('Year 0' in g and 'Likely range' in g and 'steady state' in g, f'gaveta com Ano 0, custo anual e faixa ({g[:80]!r})')
        await pg.locator('#as-custo [data-as="gaveta"]').click()

        # ------------------------------------------------------------ pergunta condicional: N recalculado
        await pg.evaluate("irTelaA('q:internet')"); await pg.wait_for_timeout(150)
        n0 = await pg.evaluate("telasA().filter(t => t.tipo === 'q').length")
        await pg.locator('#as-tela label.opt:has(input[value="parcial"])').click(); await pg.wait_for_timeout(200)
        ok(await pg.locator('#f-escolasInternet').count() == 1, 'internet "em parte": a pergunta 2.4.2 aparece na mesma tela')
        await pg.evaluate("FASES.forEach(F => { uiA().detalhar[F.id] = true; }); render()"); await pg.wait_for_timeout(100)
        nD = await pg.evaluate("telasA().filter(t => t.tipo === 'q').length")
        await pg.evaluate("S.caso.conheceFerramentas = 'sim'; render()")
        nF = await pg.evaluate("telasA().filter(t => t.tipo === 'q').length")
        ok(nD > n0 and nF == nD, f'"Detalhar" acrescenta perguntas ({n0} → {nD}); condicionais agrupadas não mudam a contagem')
        prog = await pg.locator('#as-prog').inner_text()
        ok(f'of {nD}' in prog, f'N do progresso recalculado ({" ".join(prog.split())[:60]!r})')
        await pg.evaluate("FASES.forEach(F => { uiA().detalhar[F.id] = false; }); render()")

        # ------------------------------------------------------------ "Não sei: usar valor ilustrativo"
        await pg.evaluate("irTelaA('q:suporteNivel')"); await pg.wait_for_timeout(150)
        await pg.locator('#as-tela [data-as-ns="suporteNivel"]').click(); await pg.wait_for_timeout(200)
        ok(await tela(pg) == 'fim:piloto' and await pg.evaluate("!!S.feitos['ns:suporteNivel'] && !S.respC.suporteNivel"), f'"Não sei" usa o padrão e avança (2.6.2 é a última essencial da fase 2: {await tela(pg)})')

        # ------------------------------------------------------------ fim de fase
        await pg.evaluate("irTelaA('fim:piloto')"); await pg.wait_for_timeout(200)
        t = await pg.locator('#as-tela').inner_text()
        ok('Key answers in this phase' in t and 'Cost of this phase' in t and 'Review answers' in t and 'Detail this phase' in t, 'fim de fase: respostas-chave, custo da fase, Revisar, Continuar e Detalhar')
        F = await pg.evaluate("(() => { const n = numerosCusto(); return grande(n.av.fases.porFase.piloto.total); })()")
        ok(F in t, f'custo da fase vem do motor ({F})')
        ok('Illustrative default' in t, 'perguntas sem resposta marcadas como padrão ilustrativo')

        # ------------------------------------------------------------ resultado, plano e PDF
        await pg.evaluate("irTelaA('res')"); await pg.wait_for_timeout(500)
        r = await pg.evaluate("(() => { const d = relDados(numerosCusto()); return { tco: grande(d.central), lo: grande(d.lo), hi: grande(d.hi), t: document.getElementById('as-tela').innerText }; })()")
        ok(r['tco'].split(' ')[1] in r['t'] and r['lo'] in r['t'] and r['hi'] in r['t'], f'resultado: TCO herói com a faixa ({r["tco"]}, {r["lo"]}–{r["hi"]})')
        ok(await pg.locator('#as-tela .as-tres > div').count() == 3 and await pg.locator('#as-tela .as-acoes li').count() == 3, 'resultado: três números e três principais ações')
        await pg.locator('#as-tela [data-act="gerar-plano"]').click(); await pg.wait_for_timeout(600)
        ok(await pg.evaluate("S.vista") == 'plano' and await pg.locator('#plano .rp-capa-num').count() == 1, 'Ver plano abre o plano, com os números na capa')
        P = await pg.evaluate("""(() => { const P = document.getElementById('plano'); const s = P.querySelector('.rp-sintese');
          const kids = [...s.children].map(e => e.className || e.tagName);
          return { numAntes: [...s.querySelectorAll('h4.rp-sub')].map(h => h.textContent)[0], ax: [...P.querySelectorAll('details.rp-ax')].length, axAbertos: [...P.querySelectorAll('details.rp-ax[open]')].length,
            pos: getComputedStyle(P.querySelector('.rp-comoler')).position }; })()""")
        ok(P['numAntes'] == 'The main figures', f'síntese começa pelos números ({P["numAntes"]!r})')
        ok(P['ax'] == 9 and P['axAbertos'] == 0, f'anexos recolhidos na página ({P["ax"]}, abertos {P["axAbertos"]})')
        ok(P['pos'] == 'static', f'"Como ler este plano" não fica fixo sobre o texto ({P["pos"]})')
        await pg.evaluate("document.querySelector('#plano a[href=\"#plano-anexo-g\"]').click()"); await pg.wait_for_timeout(300)
        ok(await pg.evaluate("document.querySelector('#plano-anexo-g details').open"), 'link do índice abre o anexo recolhido')
        async with pg.expect_download() as dl:
            await pg.locator('#plano [data-act="pdf"]').first.click()
        dw = await dl.value
        arq = f'{TMP}/plano.pdf'; await dw.save_as(arq)
        info = subprocess.run(['pdfinfo', arq], capture_output=True, text=True).stdout
        ok(re.fullmatch(r'procurement-plan-[a-z0-9-]+\.pdf', dw.suggested_filename) is not None and 'Pages:' in info, f'PDF baixado ({dw.suggested_filename}, {re.search(r"Pages:\s+(\d+)", info).group(1) if "Pages:" in info else "?"} páginas)')
        txt = await pg.evaluate("document.getElementById('plano').innerText")
        ok(not re.search(r'\d (mi|mil|bi)\b', txt), f'plano em inglês sem "mi"/"mil" ({re.findall(r".{12}\d (?:mi|mil|bi)\b", txt)[:3]})')
        ok(await pg.evaluate(LARG) == [1366, 1366], 'plano em 1366 px sem rolagem horizontal')

        # ------------------------------------------------------------ troca de caso com confirmação e Desfazer
        await pg.locator('#plano [data-act="voltar-percurso"]').click(); await pg.wait_for_timeout(200)
        antes = await pg.evaluate("JSON.stringify(S.caso)")
        await pg.locator('#menu-caso > summary').click()
        await pg.select_option('#sel-exemplo', 'A'); await pg.wait_for_timeout(200)
        ok(await pg.locator('dialog#dlg-troca[open]').count() == 1, 'abrir um exemplo com respostas no caso pede confirmação')
        await pg.locator('#dlg-troca [data-act="troca-nao"]').click(); await pg.wait_for_timeout(150)
        ok(await pg.evaluate("JSON.stringify(S.caso)") == antes, 'Cancelar mantém o caso')
        await pg.locator('#menu-caso > summary').click()
        await pg.select_option('#sel-exemplo', 'A'); await pg.wait_for_timeout(150)
        await pg.locator('#dlg-troca [data-act="troca-ok"]').click(); await pg.wait_for_timeout(250)
        ok(await pg.evaluate("S.exemplo") == 'A', 'Substituir abre o exemplo')
        await pg.locator('#toast .toast-a').click(); await pg.wait_for_timeout(250)
        ok(await pg.evaluate("JSON.stringify(S.caso)") == antes and await pg.evaluate("S.exemplo") == 'novo', 'Desfazer restaura o caso anterior')

        # ------------------------------------------------------------ nenhum texto em português na interface em inglês
        restos = await pg.evaluate("""async () => { carregarExemplo('A'); S.boasVindas = false; FASES.forEach(F => { uiA().detalhar[F.id] = true; }); render();
          const out = new Set();
          for (const k of telasA().map(t => t.k)) { irTelaA(k); await new Promise(r => setTimeout(r, 20));
            for (const sel of ['#as-prog', '.as-eb', '.as-nav', '.as-fim-a', '.as-res-a', '#as-custo', '.as-ns', '.as-por > summary', '.as-st', '.as-chaves .as-k-alt', '.as-fim-ix h2']) document.querySelectorAll(sel).forEach(e => out.add(e.innerText)); }
          irTelaA('q:pais'); render(); return [...out]; }""")
        pt = [x for x in restos if PT.search(x)]
        ok(not pt, f'textos novos traduzidos para o inglês ({pt[:3]})')
        await pg.evaluate("FASES.forEach(F => { uiA().detalhar[F.id] = false; }); render()")
        ok(not externos, f'nenhum recurso externo carregado ({externos[:2]})')
        ok(not errs, f'1366: sem erros no console ({errs[:3]})')

        # ------------------------------------------------------------ 390 px
        m = await b.new_page(viewport={'width': 390, 'height': 844}); erm = []
        m.on('pageerror', lambda e: erm.append(str(e)))
        await m.goto(f'file://{TMP}/nav.html'); await m.evaluate('localStorage.clear()'); await m.reload(); await m.wait_for_timeout(300)
        await m.locator('#inicio [data-act="comecar"]').click(); await m.wait_for_timeout(200)
        ok(await tela(m) == 'q:pais' and await m.evaluate(LARG) == [390, 390], '390: primeira pergunta sem rolagem horizontal')
        hs = await m.evaluate("[...document.querySelectorAll('#as-nav .btn')].map(b => Math.round(b.getBoundingClientRect().height))")
        ok(hs and min(hs) >= 48, f'390: Voltar e Continuar com 48 px ou mais ({hs})')
        fx = await m.evaluate("getComputedStyle(document.getElementById('as-nav')).position")
        ok(fx == 'fixed', f'390: navegação fixa embaixo ({fx})')
        await m.locator('#as-nav .as-seguir').click(); await m.wait_for_timeout(150)
        await m.locator('label.opt:has([data-etapa="fund2"])').click(); await m.wait_for_timeout(200)
        ok(await m.evaluate(LARG) == [390, 390], '390: grade de escolas × estudantes sem rolagem horizontal')
        for k in ['q:tarefas', 'q:piloto', 'fim:piloto', 'res']:
            await m.evaluate(f"(()=>{{ carregarExemplo('A'); S.boasVindas=false; irTelaA('{k}'); }})()"); await m.wait_for_timeout(300)
            ok(await m.evaluate(LARG) == [390, 390], f'390: tela {k} sem rolagem horizontal')
            if k.startswith('q:'): ok(await m.locator('#as-tela .as-q').count() == 1, f'390: {k} com uma pergunta na tela')
        await m.locator('#as-tela [data-act="gerar-plano"]').click(); await m.wait_for_timeout(500)
        ok(await m.evaluate(LARG) == [390, 390], '390: plano sem rolagem horizontal')
        await m.screenshot(path=f'{TMP}/plano_390.png')
        ok(not erm, f'390: sem erros ({erm[:2]})')

        # ------------------------------------------------------------ árabe (RTL), 1366 e 390 px
        for w, h in [(1366, 900), (390, 844)]:
            a = await b.new_page(viewport={'width': w, 'height': h}); era = []
            a.on('pageerror', lambda e: era.append(str(e)))
            await a.goto(f'file://{TMP}/nav.html'); await a.evaluate('localStorage.clear()'); await a.reload(); await a.wait_for_timeout(300)
            await a.select_option('#sel-lang', 'ar'); await a.wait_for_timeout(200)
            ok(await a.evaluate("document.documentElement.dir") == 'rtl', f'ar {w}: página em RTL')
            ok(await a.evaluate(LARG) == [w, w], f'ar {w}: página inicial sem rolagem horizontal ({await a.evaluate(LARG)})')
            await a.locator('#inicio [data-act="comecar"]').click(); await a.wait_for_timeout(200)
            for k in ['q:pais', 'q:etapas', 'q:pagamento', 'fim:piloto', 'res', 'plano']:
                if k == 'plano': await a.evaluate("gerarPlano()")
                else: await a.evaluate(f"(()=>{{ carregarExemplo('A'); S.boasVindas=false; irTelaA('{k}'); }})()")
                await a.wait_for_timeout(350)
                sw = await a.evaluate(LARG)
                ok(sw == [w, w], f'ar {w}: {k} sem rolagem horizontal ({sw})')
            await a.screenshot(path=f'{TMP}/ar_{w}.png')
            ok(not era, f'ar {w}: sem erros ({era[:2]})')
        await b.close()
    print(f'\n{len(OK)} ok, {len(FALHAS)} falha(s)')
    if FALHAS: raise SystemExit(1)

asyncio.run(main())
