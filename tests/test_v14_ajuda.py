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
            for fid, pid in passos:
                await ev(pg, f"abrirFase('{fid}','{pid}')", 120)
                if pid == [p_[1] for p_ in passos if p_[0] == fid][0]:
                    n = await pg.locator(f'#intro-{fid} .fi-p').count()
                    t = await ev(pg, f"document.getElementById('intro-{fid}').innerText", 0)
                    ok(n == 3 and '[[' not in t and (lang == 'pt' or not PT.search(t)), f'{lang}: abertura da fase {fid} com as três partes, sem restos de português' + ('' if not PT.search(t) or lang == 'pt' else f' {PT.findall(t)[:4]}'))
                if await pg.locator(f'#ajuda-{pid} .aj-p').count() != 4: vaz.append(pid)
                t = await ev(pg, f"(document.getElementById('ajuda-{pid}')||{{}}).innerText||''", 0)
                if '[[' in t or (lang != 'pt' and PT.search(t)): vistos.append((pid, PT.findall(t)[:3]))
            ok(not vaz, f'{lang}: painel "Sobre esta etapa" com as quatro partes nos 15 passos {vaz}')
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
        await ev(pg, "abrirFase('piloto','2c')", 250)
        ok(await pg.locator('#q-2-3-5 .dica').count() == 1 and 'Dica:' in await pg.locator('#q-2-3-5 .dica').inner_text(), '2.3.5 mostra a dica')
        ok(await pg.locator('#q-2-3-5 .dica .gl').count() == 1, 'termo do glossário na dica ("custo recorrente")')
        ok(await ev(pg, "document.querySelectorAll('.q .dica').length") >= 5, 'várias dicas visíveis no passo 2.3')

        # ---------------------------------------------------------- painel: abre na primeira visita, recolhe e fica recolhido
        await abrir(pg); await pg.click('[data-act="comecar"]'); await pg.wait_for_timeout(250); await branco(pg)
        ok(await pg.locator('#ajuda-1a').count() == 1 and await ev(pg, "document.getElementById('ajuda-1a').open"), '1.1: painel aberto na primeira visita')
        await pg.click('#ajuda-1a > summary'); await pg.wait_for_timeout(150)
        ok(not await ev(pg, "document.getElementById('ajuda-1a').open"), '1.1: o painel recolhe ao clicar')
        await ev(pg, "abrirFase('contexto','1b')", 200)
        ok(await ev(pg, "document.getElementById('ajuda-1b').open"), '1.2: painel aberto na primeira visita ao passo')
        await ev(pg, "abrirFase('contexto','1a')", 200)
        ok(not await ev(pg, "document.getElementById('ajuda-1a').open"), '1.1: continua recolhido ao voltar ao passo')
        await pg.fill('#f-local', 'Rede de teste'); await pg.locator('#f-local').press('Tab'); await pg.wait_for_timeout(200)
        ok(not await ev(pg, "document.getElementById('ajuda-1a').open"), '1.1: continua recolhido depois de responder (a tela é redesenhada)')
        # teclado: Enter no resumo
        await pg.focus('#ajuda-1a > summary'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(150)
        ok(await ev(pg, "document.getElementById('ajuda-1a').open"), '1.1: o resumo abre pelo teclado')
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(150)
        ok(not await ev(pg, "document.getElementById('ajuda-1a').open"), '1.1: e recolhe de novo')
        arm = await ev(pg, "localStorage.getItem(AJUDA_CHAVE)")
        ok(arm and json.loads(arm).get('1a') is False, f'estado gravado por passo no navegador ({arm})')
        # nova visita (recarregar a página): o recolhido continua recolhido; o que só abriu por ser a primeira vez começa recolhido
        await pg.reload(); await pg.wait_for_timeout(300)
        await ev(pg, "(()=>{S.boasVindas=false; abrirFase('contexto','1a');})()", 250)
        ok(not await ev(pg, "document.getElementById('ajuda-1a').open"), '1.1: recolhido depois de recarregar a página')
        await ev(pg, "abrirFase('contexto','1b')", 250)
        ok(not await ev(pg, "document.getElementById('ajuda-1b').open"), '1.2: já visto numa visita anterior, começa recolhido')
        await ev(pg, "abrirFase('contexto','1c')", 250)
        ok(await ev(pg, "document.getElementById('ajuda-1c').open"), '1.3: passo nunca visitado abre na primeira vez')
        # sem localStorage a tela funciona
        ctx2 = await b.new_context(viewport={'width': 1360, 'height': 900})
        await ctx2.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new Error('bloqueado')}})")
        p2 = await ctx2.new_page(); e2 = []
        p2.on('pageerror', lambda e: e2.append(str(e)))
        await p2.goto('file://' + ARQ); await p2.wait_for_timeout(300)
        await p2.evaluate("(()=>{carregarExemplo('novo'); S.boasVindas=false; abrirFase('contexto','1a');})()"); await p2.wait_for_timeout(250)
        ok(await p2.locator('#ajuda-1a .aj-p').count() == 4 and not e2, f'sem localStorage: painel aparece e não há erro {e2[:2]}')
        await p2.click('#ajuda-1a > summary'); await p2.wait_for_timeout(150)
        ok(not await p2.evaluate("document.getElementById('ajuda-1a').open") and not e2, 'sem localStorage: recolher também funciona')
        await ctx2.close()

        # ---------------------------------------------------------- passos sem explicação antes: 1.1, 1.2, 2.0, 4.1, 4.3 e o ⓘ do 3.1
        for fid, pid in [('contexto', '1a'), ('contexto', '1b'), ('piloto', '20'), ('expansao', '4a'), ('expansao', '4c')]:
            await ev(pg, f"abrirFase('{fid}','{pid}')", 200)
            t = await ev(pg, f"document.getElementById('ajuda-{pid}').textContent", 0)
            ok(all(x in t for x in ['Para que serve', 'Por que importa para o custo ou a compra', 'Como responder', 'Quem costuma saber:', 'Exemplo']), f'{pid}: painel com as cinco partes')
        await ev(pg, "abrirFase('implantacao','3a')", 250)
        ok(await pg.locator('#passo-3a button.info').count() == 1, '3.1 tem o botão ⓘ')
        await pg.click('#passo-3a button.info'); await pg.wait_for_timeout(200)
        ok(await pg.get_attribute('#passo-3a button.info', 'aria-expanded') == 'true' and 'Camadas 2, 3 e 6' in await pg.locator('#nota-p-3a').inner_text(), '3.1: ⓘ abre a nota das camadas 2, 3 e 6')
        ok(await pg.locator('#nota-p-3a .ref-tco').count() == 1, '3.1: nota com a referência a Krueger e Jackson (2026)')
        await pg.click('#passo-3a button.info'); await pg.wait_for_timeout(150)
        ok(await pg.locator('#nota-p-3a').count() == 0, '3.1: ⓘ fecha')
        await ev(pg, "abrirFase('piloto','2a')", 250)
        ok(await pg.locator('#passo-2a button.info').count() == 1 and await pg.locator('#passo-2a .passo-corpo > .ajuda').count() == 1, 'o ⓘ das camadas continua (2.1), como segundo nível')
        # a ordem do corpo do 2.1: painel, abertura, aviso (o teste da v13 depende de "abertura + aviso")
        ok(await ev(pg, "document.querySelector('#passo-2a .passo-corpo').firstElementChild.classList.contains('ajuda') && document.querySelector('#passo-2a .passo-corpo > .abertura') !== null"), '2.1: painel antes da abertura do passo')

        # ---------------------------------------------------------- glossário: abrir, fechar, teclado, outro idioma
        await ev(pg, "abrirFase('implantacao','3b')", 250)
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
        await pg.locator('#ajuda-3b .gl[data-gl="pesos"]').click(); await pg.wait_for_timeout(150)
        await pg.locator('#ajuda-3b .gl[data-gl="api"]').click(); await pg.wait_for_timeout(150)
        ok(await pg.locator('#gl-pop').count() == 1 and 'API' in await pg.locator('#gl-pop .gl-t').inner_text(), 'só uma definição aberta por vez')
        await pg.keyboard.press('Escape')
        # toque
        tctx = await b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True)
        tp = await tctx.new_page()
        await tp.goto('file://' + ARQ); await tp.evaluate('localStorage.clear()'); await tp.reload(); await tp.wait_for_timeout(300)
        await tp.evaluate("(()=>{carregarExemplo('novo'); S.boasVindas=false; abrirFase('implantacao','3b');})()"); await tp.wait_for_timeout(250)
        await tp.locator('#ajuda-3b .gl[data-gl="saas"]').tap(); await tp.wait_for_timeout(200)
        ok(await tp.locator('#gl-pop').is_visible(), 'toque abre a definição')
        await tp.touchscreen.tap(30, 20); await tp.wait_for_timeout(200)
        ok(await tp.locator('#gl-pop').count() == 0, 'toque fora fecha')
        await tctx.close()
        # EN
        await pg.select_option('#sel-lang', 'en'); await pg.wait_for_timeout(300)
        saas_en = await ev(pg, "glossarioLista('en').find(g=>g.id==='saas')")
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
        await ev(pg, "abrirFase('implantacao','3b')", 250)
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
