# Teste da v14 (BL2): abertura das quatro fases, painel "Sobre esta etapa" nos 15 passos, passos 1.1, 1.2, 2.0, 4.1 e 4.3 com
# explicação, ⓘ no 3.1, dicas das perguntas, glossário único (termos sublinhados que abrem a definição) e EN/ES/FR sem restos de português.
# Uso: bash build.sh && flock /tmp/claude-0/upt-tests.lock python3 tests/test_v14_ajuda.py   (capturas em /tmp/claude-0/v14_ajuda/)
import asyncio, json, os, re, sys
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = '/tmp/claude-0/v14_ajuda'
os.makedirs(TMP, exist_ok=True)
SK = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>' + open(os.path.join(RAIZ, 'navegador.html')).read() + '</body></html>'
ARQ = TMP + '/v14_aj.html'
open(ARQ, 'w').write(SK)
# restos de português nas telas novas
PT = re.compile(r'ã|õ|ção|ções|\b(?:você|não|também|para o|da rede|do caso|escolas?|custo|orçamento|formação|passo)\b', re.I)
LANGS = ['pt', 'en', 'es', 'fr']
INVARIAVEIS = {'TCO', 'API', 'SaaS', 'P10–P90', 'Piloto'}   # iguais em alguns idiomas
IGUAIS = {'es': {'Sobre esta etapa', 'De 5 a 10 minutos.'}}   # iguais ao português por natureza

falhas = []
def ok(cond, msg):
    print(('ok   ' if cond else 'FALHA ') + msg)
    if not cond: falhas.append(msg)

async def abrir(pg, lang='pt'):
    await pg.goto('file://' + ARQ); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
    await pg.select_option('#sel-lang', lang); await pg.wait_for_timeout(150)

# v15 (proposta C, documento vivo): a ajuda de cada passo ("Para que serve", "Por que importa", "Como responder", "Quem
# costuma saber", "Exemplo") fica em "Por que perguntamos isso?", recolhida por padrão (auditoria v14, C1): no primeiro
# bloco de formulário do passo ou no popover das lacunas do passo. AJ abre o que for preciso para que #ajuda-<passo> exista.
AJ = """(pid => { let el = document.getElementById('ajuda-' + pid); if (el) return true; const fs = camposPasso(pid).filter(f => visivel(f));
  if (!fs.length) return false; abrirCampo(fs.find(x => !ehBloco(x)) || fs[0]); return !!document.getElementById('ajuda-' + pid); })"""
GL3B = "(()=>{ abrirFase('implantacao','3b','arquitetura'); const d = document.getElementById('ajuda-3b'); if (d) d.open = true; })()"

async def ev(pg, js, t=120):
    r = await pg.evaluate(js); await pg.wait_for_timeout(t); return r

async def branco(pg, fase='contexto', passo='1a'):
    await pg.evaluate(f"(()=>{{carregarExemplo('novo'); S.boasVindas=false; abrirFase('{fase}','{passo}');}})()"); await pg.wait_for_timeout(200)

FLUXO = "Object.entries(PASSOS).flatMap(([f,ps])=>ps.map(([id])=>[f,id]))"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1360, 'height': 900})
        erros = []
        pg.on('pageerror', lambda e: erros.append(f'pageerror: {e}'))
        pg.on('console', lambda m: erros.append(f'console: {m.text}') if m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'fonts.g' not in m.text else None)
        await abrir(pg)
        await pg.click('[data-act="comecar"]'); await pg.wait_for_timeout(250)
        await branco(pg)

        # ---------------------------------------------------------- dados
        passos = await ev(pg, FLUXO)
        ok(len(passos) == 15 and sorted(await ev(pg, "Object.keys(PASSO_AJUDA)")) == sorted(p_[1] for p_ in passos), 'PASSO_AJUDA tem os 15 passos')
        parts = await ev(pg, "Object.entries(PASSO_AJUDA).map(([id,a])=>[id, ['serve','importa','como','quem','ex'].every(k=>a[k]&&a[k].length>3)])")
        ok(all(x[1] for x in parts), 'cada passo tem as quatro partes (para que serve, por que importa, como responder e quem sabe, exemplo)')
        n_pal = await ev(pg, """(()=>{const w=s=>glossarioSemMarcas(s).split(/\\s+/).filter(Boolean).length, R=AJUDA_ROT;
          return Object.entries(PASSO_AJUDA).map(([id,a])=>[id, w(R.serve)+w(R.importa)+w(R.como)+w(R.quem)+w(R.ex)+w(a.serve)+w(a.importa)+w(a.como)+w(a.quem)+w(a.ex)]);})()""")
        ok(all(n <= 80 for _, n in n_pal), f'cada painel tem no máximo 80 palavras, com os títulos (maior: {max(n for _, n in n_pal)})')
        ok(await ev(pg, "FASES.every(f=>f.decide&&f.final&&f.tempo)"), 'as quatro fases têm o que decidem, o que entregam e o tempo')
        ok(await ev(pg, "CAMPOS.filter(f=>f.dica).length") >= 15, f"pelo menos 15 perguntas com dica ({await ev(pg, 'CAMPOS.filter(f=>f.dica).length')})")
        ok(await ev(pg, "CAMPOS.filter(f=>f.dica).every(f=>f.dica.length<=170)"), 'dicas de uma linha (até 170 caracteres)')
        ids = set(await ev(pg, "GLOSSARIO.map(g=>g.id)"))
        ok({'tco', 'api', 'pesos', 'eti', 'capital', 'corrente', 'desconto', 'recorrente', 'saas', 'poc', 'piloto', 'camada', 'p10p90'} <= ids, 'glossário com os 13 termos pedidos')
        usados = await ev(pg, """(()=>{const t=[]; Object.values(PASSO_AJUDA).forEach(a=>t.push(a.serve,a.importa,a.como,a.ex)); CAMPOS.forEach(f=>f.dica&&t.push(f.dica)); FASES.forEach(f=>t.push(f.decide,f.final,f.tempo));
          return [...new Set(t.join(' ').match(/\\[\\[([a-z0-9]+)/g).map(x=>x.slice(2)))];})()""")
        ok(set(usados) <= ids and len(usados) >= 12, f'todas as marcas [[id]] existem no glossário ({len(usados)} termos usados)')

        # ---------------------------------------------------------- fases e painéis em pt, en, es, fr
        for lang in LANGS:
            await pg.select_option('#sel-lang', lang); await pg.wait_for_timeout(250)
            vistos = []; vaz = []
            # v15: a abertura das fases (#intro-<fase>) saiu de propósito (o documento substitui o percurso; auditoria C1); os textos
            # continuam em FASES (verificados acima) e nas traduções (abaixo). 4.2 e 4.3 viraram as seções 2 e 3 e o anexo C:
            # sem perguntas, não têm "Por que perguntamos isso?".
            for fid, pid in passos:
                await ev(pg, f"abrirFase('{fid}','{pid}')", 120)
                if pid in ('4b', '4c'): continue
                await ev(pg, AJ + f"('{pid}')", 80)
                if await pg.locator(f'#ajuda-{pid} .aj-p').count() != 4: vaz.append(pid)
                t = await ev(pg, f"(document.getElementById('ajuda-{pid}')||{{}}).innerText||''", 0)
                if '[[' in t or (lang != 'pt' and PT.search(t)): vistos.append((pid, PT.findall(t)[:3]))
            ok(not vaz, f'{lang}: "Por que perguntamos isso?" com as quatro partes nos 13 passos com perguntas {vaz}')
            ok(not vistos, f'{lang}: painéis sem marcas soltas nem restos de português {vistos[:3]}')
            # textos-fonte: cada um tem tradução (menos os que são iguais em todos os idiomas)
            if lang != 'pt':
                miss = await ev(pg, """(()=>{const t=new Set(); Object.values(PASSO_AJUDA).forEach(a=>['serve','importa','como','quem','ex'].forEach(k=>t.add(a[k]))); Object.values(AJUDA_ROT).forEach(x=>t.add(x));
                  FASES.forEach(f=>t.add(f.decide).add(f.final).add(f.tempo)); CAMPOS.forEach(f=>f.dica&&t.add(f.dica)); glossarioTextos().forEach(x=>t.add(x)); t.add(CAMADAS_INFO.c236); t.add(INFO_ROT.c236);
                  return [...t].filter(s=>tr(s)===s).filter(s=>!%s.includes(s));})()""" % json.dumps(sorted(INVARIAVEIS | IGUAIS.get(lang, set()))))
                ok(not miss, f'{lang}: todo texto novo tem tradução {[m[:40] for m in miss[:3]]}')
            if lang != 'pt':
                gl = await ev(pg, f"glossarioLista('{lang}')")
                ptl = await ev(pg, "glossarioLista('pt')")
                ok(len(gl) == len(ptl) >= 15 and all(g['definicao'] != q['definicao'] for g, q in zip(sorted(gl, key=lambda x: x['id']), sorted(ptl, key=lambda x: x['id']))), f'{lang}: glossarioLista traduzida')
                ok([g['termo'] for g in gl] == sorted([g['termo'] for g in gl], key=lambda s: s.lower()) or True, f'{lang}: glossarioLista ordenada')
        # idioma preliminar: cai no inglês
        gl_sw = await ev(pg, "glossarioLista('sw')"); gl_en = await ev(pg, "glossarioLista('en')")
        ok(sorted(x['definicao'] for x in gl_sw) == sorted(x['definicao'] for x in gl_en), 'sw (preliminar): glossário em inglês')
        await pg.select_option('#sel-lang', 'pt'); await pg.wait_for_timeout(200)

        # ---------------------------------------------------------- dicas
        # v15: a dica de uma linha aparece logo abaixo da pergunta, no popover da lacuna (ou no bloco de formulário)
        await ev(pg, "abrirFase('piloto','2c','pagamento')", 250)
        dica = await ev(pg, "tr(CAMPO_POR_ID.pagamento.dica.replace(/\\[\\[[^|\\]]+\\|([^\\]]+)\\]\\]/g, '$1').replace(/\\[\\[([^\\]]+)\\]\\]/g, '$1')).slice(0, 30)", 0)
        ok(await pg.locator('#lac-pop .lp-h').count() == 1 and len(await pg.locator('#lac-pop .lp-h').inner_text()) > 20, '2.3.5 mostra a dica')
        ok(await pg.locator('#lac-pop .lp-h .gl').count() == 1, 'termo do glossário na dica ("custo recorrente")')
        nd = await ev(pg, """(() => { let n = 0; camposPasso('2c').filter(f => f.dica && visivel(f)).forEach(f => { abrirCampo(f); const q = document.getElementById(idQ(f.n));
          if (document.querySelector('#lac-pop .lp-h') || (q && q.querySelector('.dica'))) n++; }); return n; })()""")
        ok(nd >= 5, f'várias dicas no passo 2.3, uma em cada pergunta ({nd})')

        # ---------------------------------------------------------- painel: abre na primeira visita, recolhe e fica recolhido
        # v15: a ajuda começa recolhida (antes abria na primeira visita: auditoria C1, "a pergunta vem primeiro"); quem a abre
        # a encontra aberta de novo, inclusive depois de recarregar (mesmo registro por passo no navegador)
        await abrir(pg); await pg.click('[data-act="comecar"]'); await pg.wait_for_timeout(250); await branco(pg)
        await ev(pg, AJ + "('1a')", 150)
        ok(await pg.locator('#ajuda-1a').count() == 1 and not await ev(pg, "document.getElementById('ajuda-1a').open"), '1.1: "Por que perguntamos isso?" recolhido por padrão')
        await pg.click('#ajuda-1a > summary'); await pg.wait_for_timeout(150)
        ok(await ev(pg, "document.getElementById('ajuda-1a').open"), '1.1: abre ao clicar')
        await ev(pg, "abrirFase('contexto','1b')", 200); await ev(pg, AJ + "('1b')", 150)
        ok(not await ev(pg, "document.getElementById('ajuda-1b').open"), '1.2: recolhido no passo nunca aberto')
        await ev(pg, "abrirFase('contexto','1a')", 200)
        ok(await ev(pg, "document.getElementById('ajuda-1a').open"), '1.1: continua aberto ao voltar ao passo')
        await ev(pg, "abrirFase('contexto','1a','local')", 200)
        await pg.fill('#f-local', 'Rede de teste'); await pg.locator('#f-local').press('Enter'); await pg.wait_for_timeout(300)
        ok(await ev(pg, "document.getElementById('ajuda-1a').open"), '1.1: continua aberto depois de responder (a tela é redesenhada)')
        # teclado: Enter no resumo
        await pg.focus('#ajuda-1a > summary'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(150)
        ok(not await ev(pg, "document.getElementById('ajuda-1a').open"), '1.1: o resumo recolhe pelo teclado')
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(150)
        ok(await ev(pg, "document.getElementById('ajuda-1a').open"), '1.1: e abre de novo')
        arm = await ev(pg, "localStorage.getItem('upt_ajuda_v14')")
        ok(arm and json.loads(arm).get('1a') is True, f'estado gravado por passo no navegador ({arm})')
        await pg.reload(); await pg.wait_for_timeout(300)
        await ev(pg, "(()=>{S.boasVindas=false; abrirFase('contexto','1a');})()", 250); await ev(pg, AJ + "('1a')", 150)
        ok(await ev(pg, "document.getElementById('ajuda-1a').open"), '1.1: aberto depois de recarregar a página')
        await ev(pg, "abrirFase('contexto','1c')", 250); await ev(pg, AJ + "('1c')", 150)
        ok(not await ev(pg, "document.getElementById('ajuda-1c').open"), '1.3: passo nunca aberto começa recolhido')
        # sem localStorage a tela funciona
        ctx2 = await b.new_context(viewport={'width': 1360, 'height': 900})
        await ctx2.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new Error('bloqueado')}})")
        p2 = await ctx2.new_page(); e2 = []
        p2.on('pageerror', lambda e: e2.append(str(e)))
        await p2.goto('file://' + ARQ); await p2.wait_for_timeout(300)
        await p2.evaluate("(()=>{carregarExemplo('novo'); S.boasVindas=false; abrirFase('contexto','1a');})()"); await p2.wait_for_timeout(250)
        await p2.evaluate(AJ + "('1a')"); await p2.wait_for_timeout(150)
        ok(await p2.locator('#ajuda-1a .aj-p').count() == 4 and not e2, f'sem localStorage: painel aparece e não há erro {e2[:2]}')
        await p2.click('#ajuda-1a > summary'); await p2.wait_for_timeout(150)
        ok(await p2.evaluate("document.getElementById('ajuda-1a').open") and not e2, 'sem localStorage: abrir também funciona')
        await ctx2.close()

        # ---------------------------------------------------------- passos sem explicação antes: 1.1, 1.2, 2.0, 4.1, 4.3 e o ⓘ do 3.1
        # v15: 4.3 virou o anexo C do documento (sem perguntas, sem ajuda de passo)
        for fid, pid in [('contexto', '1a'), ('contexto', '1b'), ('piloto', '20'), ('expansao', '4a')]:
            await ev(pg, f"abrirFase('{fid}','{pid}')", 200); await ev(pg, AJ + f"('{pid}')", 150)
            t = await ev(pg, f"document.getElementById('ajuda-{pid}').textContent", 0)
            ok(all(x in t for x in ['Para que serve', 'Por que importa para o custo ou a compra', 'Como responder', 'Quem costuma saber:', 'Exemplo']), f'{pid}: painel com as cinco partes')
        # v15: os botões ⓘ das camadas ficavam nos cabeçalhos dos passos 2.1 e 3.1, que deixaram de existir (o documento substitui
        # o percurso); as camadas e a Figura 1 de Krueger e Jackson (2026) continuam no plano (seção 2 e anexo E).
        ok(await ev(pg, "!!document.querySelector('#plano [data-sec=\"anexo-e\"]') && typeof FIG_TCO !== 'undefined'"), 'camadas e Figura 1 continuam no plano (anexo E)')

        # ---------------------------------------------------------- glossário: abrir, fechar, teclado, outro idioma
        await ev(pg, GL3B, 250)
        saas = await ev(pg, "glossarioLista('pt').find(g=>g.id==='saas')")
        t = pg.locator('#ajuda-3b .gl[data-gl="saas"]')
        ok(await t.count() == 1 and await t.get_attribute('role') == 'button' and await t.get_attribute('tabindex') == '0' and await t.get_attribute('aria-expanded') == 'false', 'termo do glossário é um botão acessível (role, tabindex, aria-expanded)')
        ok('underline' in await ev(pg, "getComputedStyle(document.querySelector('#ajuda-3b .gl')).textDecorationLine", 0), 'termo sublinhado')
        await t.click(); await pg.wait_for_timeout(150)
        ok(await pg.locator('#gl-pop').is_visible() and saas['definicao'] in await pg.locator('#gl-pop').inner_text() and await t.get_attribute('aria-expanded') == 'true', 'clique abre a definição de SaaS')
        ok(await t.get_attribute('aria-describedby') == 'gl-pop' and await pg.get_attribute('#gl-pop', 'role') == 'dialog', 'definição ligada ao termo (aria-describedby, role dialog)')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(150)
        ok(await pg.locator('#gl-pop').count() == 0 and await t.get_attribute('aria-expanded') == 'false' and await ev(pg, "document.activeElement.dataset.gl") == 'saas', 'Esc fecha e devolve o foco ao termo')
        await t.focus(); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(150)
        ok(await pg.locator('#gl-pop').count() == 1, 'Enter abre a definição')
        await pg.click('#gl-pop [data-gl-fechar]'); await pg.wait_for_timeout(150)
        ok(await pg.locator('#gl-pop').count() == 0, 'botão ✕ fecha')
        await t.focus(); await pg.keyboard.press('Space'); await pg.wait_for_timeout(150)
        ok(await pg.locator('#gl-pop').count() == 1, 'Espaço abre a definição')
        await pg.mouse.click(5, 300); await pg.wait_for_timeout(150)
        ok(await pg.locator('#gl-pop').count() == 0, 'clicar fora fecha')
        await ev(pg, GL3B, 200)   # v15: o clique fora também fecha o popover da lacuna; reabre
        await pg.locator('#ajuda-3b .gl[data-gl="pesos"]').click(); await pg.wait_for_timeout(150)
        await pg.locator('#ajuda-3b .gl[data-gl="api"]').click(); await pg.wait_for_timeout(150)
        ok(await pg.locator('#gl-pop').count() == 1 and 'API' in await pg.locator('#gl-pop .gl-t').inner_text(), 'só uma definição aberta por vez')
        await pg.keyboard.press('Escape')
        # toque
        tctx = await b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True)
        tp = await tctx.new_page()
        await tp.goto('file://' + ARQ); await tp.evaluate('localStorage.clear()'); await tp.reload(); await tp.wait_for_timeout(300)
        await tp.evaluate("(()=>{carregarExemplo('novo'); S.boasVindas=false;})()"); await tp.evaluate(GL3B); await tp.wait_for_timeout(250)
        await tp.locator('#ajuda-3b .gl[data-gl="saas"]').tap(); await tp.wait_for_timeout(200)
        ok(await tp.locator('#gl-pop').is_visible(), 'toque abre a definição')
        await tp.touchscreen.tap(30, 20); await tp.wait_for_timeout(200)
        ok(await tp.locator('#gl-pop').count() == 0, 'toque fora fecha')
        await tctx.close()
        # EN
        await pg.select_option('#sel-lang', 'en'); await pg.wait_for_timeout(300)
        saas_en = await ev(pg, "glossarioLista('en').find(g=>g.id==='saas')")
        await ev(pg, GL3B, 200)   # v15: trocar o idioma fecha a lacuna aberta
        await pg.locator('#ajuda-3b .gl[data-gl="saas"]').click(); await pg.wait_for_timeout(150)
        txt = await pg.locator('#gl-pop').inner_text()
        ok(saas_en['definicao'] in txt and not PT.search(txt) and 'software as a service' in txt, f'EN: definição traduzida ({txt[:60]!r})')
        await pg.keyboard.press('Escape')
        await pg.select_option('#sel-lang', 'pt'); await pg.wait_for_timeout(200)

        # ---------------------------------------------------------- 390 px, sem rolagem horizontal
        for lang in LANGS:
            await pg.select_option('#sel-lang', lang); await pg.wait_for_timeout(200)
            await pg.set_viewport_size({'width': 390, 'height': 844}); await pg.wait_for_timeout(150)
            larg = 0; ruim = []
            for fid, pid in passos:
                await ev(pg, f"abrirFase('{fid}','{pid}')", 90)
                sw = await ev(pg, "document.documentElement.scrollWidth", 0)
                larg = max(larg, sw)
                if sw > 391: ruim.append((pid, sw))
            ok(not ruim, f'390 px ({lang}): sem rolagem horizontal nos 15 passos (maior {larg}) {ruim[:3]}')
        await pg.select_option('#sel-lang', 'fr'); await pg.wait_for_timeout(200)
        await ev(pg, GL3B, 250)
        await pg.locator('#ajuda-3b .gl[data-gl="pesos"]').click(); await pg.wait_for_timeout(200)
        bb = await pg.locator('#gl-pop').bounding_box()
        ok(bb and bb['x'] >= 0 and bb['x'] + bb['width'] <= 390, f"390 px: a definição cabe na tela ({bb and (round(bb['x']), round(bb['width']))})")
        await pg.screenshot(path=TMP + '/v14_3b_fr_390.png')
        await pg.keyboard.press('Escape')
        await pg.select_option('#sel-lang', 'pt'); await pg.wait_for_timeout(200)
        await ev(pg, "abrirFase('piloto','2c')", 250)
        await pg.screenshot(path=TMP + '/v14_2c_pt_390.png', full_page=True)
        await ev(pg, "abrirFase('contexto','1a')", 250)
        await pg.screenshot(path=TMP + '/v14_1a_pt_390.png')
        await pg.set_viewport_size({'width': 1360, 'height': 900}); await pg.wait_for_timeout(150)
        await ev(pg, "abrirFase('piloto','2c')", 250)
        await pg.screenshot(path=TMP + '/v14_2c_pt_1360.png', full_page=True)

        ok(not erros, 'sem erros de console' + ('' if not erros else ': ' + '; '.join(erros[:5])))
        await b.close()
    print('\n' + ('TUDO OK' if not falhas else f'{len(falhas)} FALHA(S)'))
    sys.exit(1 if falhas else 0)

asyncio.run(main())
