# Página inicial e matriz camadas × fases (v13, pacote B2: src/inicio.js, src/inicio.css).
# Uso: python3 tests/test_v13_inicio.py   (depois de bash build.sh). Capturas em /tmp/claude-0/v13_b2/test_*.png
# Verifica:
#  - a página abre por padrão sem caso pré-carregado (#inicio, sem stepper), com título, frase e os botões
#    "Iniciar o plano de contratação" (EN "Start procurement plan"), "Ver um exemplo preenchido" e "Importar caso";
#  - "Iniciar" leva ao passo 1.1; caso salvo: bloco com "Continuar o caso salvo" e "Começar em branco";
#  - imagem das 4 fases: passos (PASSOS/PASSO_INFO.num), camadas com perguntas na MATRIZ, resultado; fase abre e fecha
#    na própria página (aria-expanded, só uma aberta, clique no cartão), com a abertura e as 7 camadas da coluna;
#  - tabela 7 × 4 (caption TIT_MATRIZ, scope col/row, crédito CREDITO_MATRIZ); matriz do caso com selos e custos;
#  - visualizador: <dialog> modal, foco no "Fechar", Tab preso, Esc fecha e devolve o foco; clique no fundo fecha;
#  - 400 px sem rolagem horizontal da página (fechada, fase aberta, visualizador); nada abaixo de .86rem;
#    prefers-reduced-motion sem animação;
#  - EN/ES/FR: nenhum resto em português nos textos deste pacote (regex de test_idiomas.py). Restos que vêm de
#    textos de outros pacotes (matriz.js, fluxo_dados.js) só avisam; com ESTRITO=1 também falham.
# Funciona com e sem os ganchos do pacote B1 (boasVindas → paginaInicial; eventoFluxo → eventoInicio): sem eles,
# o teste os liga à mão.
import asyncio, os, re, sys
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = '/tmp/claude-0/v13_b2'
os.makedirs(TMP, exist_ok=True)
NAV = os.environ.get('NAV', os.path.join(RAIZ, 'navegador.html'))
SK = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>' + open(NAV).read() + '</body></html>'
ARQ = f'{TMP}/test_nav.html'
open(ARQ, 'w').write(SK)
PT = re.compile(r'ção|ções|ã|õ|\b(?:não|você|para o|do caso|também|custo|orçament|decisão)\b', re.I)
MAG_PT = re.compile(r'(?:\d|\b[A-Z]{3})[\s  ](?:mil|mi|bi)\b')
IGNORAR = ('Cátedra', 'Desplugada')
ESTRITO = os.environ.get('ESTRITO') == '1'
falhas, avisos = [], []

def ok(cond, msg):
    print(('ok   ' if cond else 'FALHA ') + msg)
    if not cond: falhas.append(msg)

def aviso(msg):
    print('aviso ' + msg); avisos.append(msg)

# liga os ganchos do B1 se ainda não existirem (boasVindas e eventoFluxo)
GANCHOS = """(() => {
  const r = { boas: /paginaInicial/.test(String(boasVindas)), evento: /eventoInicio/.test(String(eventoFluxo)) };
  if (!r.boas) boasVindas = () => paginaInicial(typeof SALVO !== 'undefined' ? SALVO : null);
  if (!r.evento && !window.__ganchoInicio) {
    window.__ganchoInicio = true;
    document.addEventListener('click', e => { if (eventoInicio(e)) e.stopPropagation(); }, true);
  }
  render();
  return r;
})()"""
# textos visíveis (e title/aria-label) de uma raiz, fora de [data-notr]
COL = """(sel => { const out = new Set(); document.querySelectorAll(sel).forEach(raiz => {
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) { const p = n.parentElement; if (!p || p.closest('script,style,[data-notr]')) continue; const t = n.data.trim(); if (t) out.add(t); }
  raiz.querySelectorAll('[aria-label],[title]').forEach(e => ['aria-label', 'title'].forEach(a => { const v = e.getAttribute(a); if (v) out.add(v); })); });
  return [...out]; })"""
# textos-fonte de outros pacotes (traduzidos por eles): células e títulos da matriz, fases, passos e camadas
ALHEIOS = """(() => { const s = [CREDITO_MATRIZ, TIT_MATRIZ, NOTA_MATRIZ_CUSTO];
  Object.values(MATRIZ).forEach(l => Object.values(l).forEach(c => s.push(c.t)));
  FASES.forEach(f => s.push(f.nome, f.sub, f.abertura)); Object.values(PASSOS).forEach(ps => ps.forEach(p => s.push(p[1])));
  CAMADAS.forEach(c => s.push(c[1])); return s.filter(Boolean); })()"""
# menor fonte (px) entre os elementos com texto de uma raiz
FONTE_MIN = """(sel => { let m = 99, onde = ''; document.querySelectorAll(sel).forEach(raiz => raiz.querySelectorAll('*').forEach(e => {
  if (e.closest('.sr') || !e.offsetParent && getComputedStyle(e).position !== 'fixed') return;
  if (![...e.childNodes].some(n => n.nodeType === 3 && n.data.trim())) return;
  const f = parseFloat(getComputedStyle(e).fontSize); if (f < m) { m = f; onde = e.className || e.tagName; } }));
  return [m, onde, parseFloat(getComputedStyle(document.documentElement).fontSize)]; })"""
LARGURA = "document.documentElement.scrollWidth - document.documentElement.clientWidth"

async def abrir(pg, lang, limpar=True):
    await pg.goto('file://' + ARQ)
    if limpar: await pg.evaluate('localStorage.clear()')
    await pg.reload(); await pg.wait_for_timeout(300)
    await pg.select_option('#sel-lang', lang); await pg.wait_for_timeout(150)
    g = await pg.evaluate(GANCHOS); await pg.wait_for_timeout(150)
    return g

async def restos(pg, sel, lang, alheios_pt, tag):
    alheios = set(await pg.evaluate("(a => a.map(s => tr(s)))", alheios_pt))
    meus, deles = [], []
    for t in await pg.evaluate(COL, sel):
        if any(x in t for x in IGNORAR) or re.fullmatch(r'[\d.\s·–-]+', t): continue
        if PT.search(t) or (lang in ('en', 'fr') and MAG_PT.search(t)):
            (deles if t in alheios or any(t in a for a in alheios) else meus).append(t)
    ok(not meus, f'{tag}: sem restos em português nos textos deste pacote {meus[:5]}')
    if deles:
        if ESTRITO: ok(False, f'{tag}: restos de outros pacotes {deles[:4]}')
        else: aviso(f'{tag}: {len(deles)} textos de outros pacotes ainda sem tradução (ex.: {deles[0][:70]!r})')

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1360, 'height': 900}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'TUNNEL' not in m.text and 'fonts.g' not in m.text else None)
        g = await abrir(pg, 'en')
        print(f'info ganchos do B1: boasVindas {"sim" if g["boas"] else "não (ligado pelo teste)"}, eventoFluxo {"sim" if g["evento"] else "não (ligado pelo teste)"}')
        alheios_pt = await pg.evaluate(ALHEIOS)

        # ---- página inicial por padrão, sem caso
        E = await pg.evaluate("""(() => ({ ini: !!document.querySelector('#main > #inicio'), stepper: !!document.querySelector('#stepper'),
          boas: S.boasVindas, ex: S.exemplo, salvo: !!document.querySelector('#inicio .ini-salvo'),
          h1: (document.querySelector('#inicio h1') || {}).textContent, nh1: document.querySelectorAll('h1').length,
          cta: (document.querySelector('#inicio .ini-acoes [data-act="comecar"]') || {}).textContent,
          ctaPri: !!document.querySelector('#inicio .ini-acoes [data-act="comecar"].pri'),
          exemplo: !!document.querySelector('#inicio [data-act="ver-exemplo"]'), imp: !!document.querySelector('#inicio [data-act="imp-json"]'),
          painel: getComputedStyle(document.getElementById('painel')).display }))()""")
        ok(E['ini'] and not E['stepper'] and E['boas'] is not False and E['ex'] == 'novo' and not E['salvo'], 'abre na página inicial, sem caso pré-carregado nem bloco de caso salvo')
        ok(E['nh1'] == 1 and 'procurement plan' in (E['h1'] or ''), f'um h1: "{E["h1"]}"')
        ok((E['cta'] or '').strip() == 'Start procurement plan' and E['ctaPri'], f'botão principal "{(E["cta"] or "").strip()}"')
        ok(E['exemplo'] and E['imp'], 'ações "Ver um exemplo preenchido" e "Importar caso"')
        ok(E['painel'] == 'none', 'painel lateral escondido na página inicial')

        # ---- imagem das quatro fases
        F = await pg.evaluate("""(() => FASES.map(f => { const c = document.querySelector(`[data-inicio-card="${f.id}"]`); if (!c) return null;
          const b = c.querySelector('button[data-inicio-fase]');
          return { id: f.id, n: (c.querySelector('.ini-f-n') || {}).textContent, botao: !!b && b.getAttribute('aria-expanded') === 'false' && !!b.getAttribute('aria-controls'),
            passos: [...c.querySelectorAll('.ini-pn')].map(x => x.textContent), esperado: PASSOS[f.id].map(p => PASSO_INFO[p[0]].num),
            cams: [...c.querySelectorAll('.ini-cams li .ini-cn')].map(x => +x.textContent.trim()),
            camsEsp: CAMADAS.map(k => k[0]).filter(k => !MATRIZ[k][f.id].na && MATRIZ[k][f.id].q.length),
            res: (c.querySelector('.ini-f-res p:last-child') || {}).textContent, resEsp: tr(RESULTADO_FASE[f.id]) }; }))()""")
        ok(all(F) and len(F) == 4, '4 fases na imagem')
        for f in F:
            if not f: continue
            ok(f['botao'] and f['n'] == str(F.index(f) + 1), f'fase {f["id"]}: botão real com aria-expanded e aria-controls')
            ok(f['passos'] == f['esperado'], f'fase {f["id"]}: passos {f["passos"]}')
            ok(f['cams'] == f['camsEsp'] and f['cams'], f'fase {f["id"]}: camadas {f["cams"]}')
            ok(f['res'] and f['res'] == f['resEsp'], f'fase {f["id"]}: resultado "{(f["res"] or "")[:50]}"')
        cred = await pg.evaluate("(document.querySelector('.ini-mapa-pe .ini-cred') || {}).textContent")
        ok(cred == await pg.evaluate('tr(CREDITO_MATRIZ)'), 'crédito da matriz visível sob a imagem')
        await pg.screenshot(path=f'{TMP}/test_inicio_1360.png', full_page=True)

        ESTADO = """(() => ({ abertas: [...document.querySelectorAll('.ini-p')].filter(x => !x.hidden && x.offsetHeight).map(x => x.id),
          exp: [...document.querySelectorAll('button.ini-f-b')].filter(x => x.getAttribute('aria-expanded') === 'true').map(x => x.dataset.inicioFase) }))()"""
        await pg.click('button.ini-f-b[data-inicio-fase="piloto"]'); await pg.wait_for_timeout(250)
        st = await pg.evaluate(ESTADO)
        ok(st['abertas'] == ['ini-p-piloto'] and st['exp'] == ['piloto'], f'clicar na fase 2 abre o resumo dela {st}')
        P = await pg.evaluate("""(() => { const p = document.getElementById('ini-p-piloto');
          return { ab: (p.querySelector('.ini-p-ab') || {}).textContent, abEsp: tr(FASES[1].abertura), cels: p.querySelectorAll('.ini-cel').length,
            na: p.querySelectorAll('.ini-cel.na').length, t: [...p.querySelectorAll('.ini-cel-t')].map(x => x.textContent),
            tEsp: CAMADAS.map(k => tr(MATRIZ[k[0]].piloto.t)), foco: document.activeElement && document.activeElement.dataset.inicioFase,
            semRender: !!document.querySelector('#main > #inicio') }; })()""")
        ok(P['ab'] == P['abEsp'] and P['cels'] == 7 and P['t'] == P['tEsp'], 'resumo da fase: abertura e as 7 camadas da coluna da matriz')
        ok(P['foco'] == 'piloto', 'o foco fica no botão da fase')
        await pg.screenshot(path=f'{TMP}/test_fase_1360.png', full_page=True)
        await pg.click('button.ini-f-b[data-inicio-fase="contexto"]'); await pg.wait_for_timeout(200)
        st = await pg.evaluate(ESTADO)
        ok(st['abertas'] == ['ini-p-contexto'] and st['exp'] == ['contexto'], 'abrir outra fase fecha a anterior (só uma aberta)')
        await pg.click('#ini-p-contexto .ini-p-x'); await pg.wait_for_timeout(200)
        st = await pg.evaluate(ESTADO)
        foco = await pg.evaluate('document.activeElement && document.activeElement.id')
        ok(not st['abertas'] and not st['exp'] and foco == 'ini-b-contexto', '"Fechar o resumo" fecha e devolve o foco ao botão da fase')
        await pg.click('[data-inicio-card="implantacao"] .ini-f-res'); await pg.wait_for_timeout(200)
        st = await pg.evaluate(ESTADO)
        ok(st['exp'] == ['implantacao'], 'clique em qualquer ponto do cartão abre a fase')
        await pg.click('button.ini-f-b[data-inicio-fase="implantacao"]'); await pg.wait_for_timeout(200)
        st = await pg.evaluate(ESTADO)
        ok(not st['abertas'], 'clicar de novo fecha a fase')
        await pg.keyboard.press('Tab'); await pg.wait_for_timeout(50)

        # ---- tabela da matriz
        T = await pg.evaluate("""(() => { const d = document.createElement('div'); d.innerHTML = renderMatrizTabela({ caso: false });
          const t = d.querySelector('table');
          return { cap: (t.querySelector('caption') || {}).textContent, col: t.querySelectorAll('thead th[scope="col"]').length,
            linhas: [...t.querySelectorAll('tbody tr')].map(r => [r.querySelectorAll('th[scope="row"]').length, r.querySelectorAll('td').length]),
            na: t.querySelectorAll('td.na').length, cred: (d.querySelector('.mt-cred') || {}).textContent, selos: t.querySelectorAll('.mt-selo').length }; })()""")
        ok(T['cap'] == 'O que cada fase exige, por camada' and T['col'] == 5, f'tabela com caption TIT_MATRIZ e 1 + 4 cabeçalhos de coluna')
        ok(len(T['linhas']) == 7 and all(l == [1, 4] for l in T['linhas']), 'tabela 7 × 4 com cabeçalho de linha (scope="row")')
        ok(T['na'] >= 1 and T['selos'] == 0 and T['cred'] == 'Camadas: Krueger e Jackson (2026, p. 11). Distribuição por fase: elaboração desta ferramenta.', 'matriz geral: "não se aplica", sem selos e com o crédito')

        # ---- visualizador da matriz geral
        await pg.locator('.ini-mapa-pe [data-act="ver-matriz"]').click(); await pg.wait_for_timeout(250)
        V = await pg.evaluate("""(() => { const d = document.getElementById('visor-matriz');
          return { aberto: !!d && d.open, modal: d && d.matches(':modal'), role: d && d.getAttribute('role'), am: d && d.getAttribute('aria-modal'),
            lab: d && !!document.getElementById(d.getAttribute('aria-labelledby')), foco: document.activeElement && document.activeElement.hasAttribute('data-matriz-fechar'),
            linhas: d ? d.querySelectorAll('tbody tr').length : 0, selos: d ? d.querySelectorAll('.mt-selo').length : 0,
            cred: !!(d && d.querySelector('.mt-cred')), cap: d && d.querySelector('caption') && d.querySelector('caption').id,
            html: document.documentElement.classList.contains('visor-aberto') }; })()""")
        ok(V['aberto'] and V['modal'] and V['role'] == 'dialog' and V['am'] == 'true' and V['lab'], 'visualizador: <dialog> modal com role, aria-modal e título')
        ok(V['foco'] and V['html'], 'foco no "Fechar" e página sem rolagem por trás')
        ok(V['linhas'] == 7 and V['selos'] == 0 and V['cred'], 'na página inicial mostra a matriz geral, com crédito')
        await pg.screenshot(path=f'{TMP}/test_matriz_1360.png')
        await restos(pg, '#visor-matriz', 'en', alheios_pt, 'EN visualizador')
        # foco preso: Tab várias vezes não sai do diálogo
        dentro = True
        for _ in range(5):
            await pg.keyboard.press('Tab'); await pg.wait_for_timeout(30)
            dentro = dentro and await pg.evaluate("!!document.activeElement.closest('#visor-matriz')")
        await pg.keyboard.press('Shift+Tab'); await pg.keyboard.press('Shift+Tab'); await pg.keyboard.press('Shift+Tab')
        dentro = dentro and await pg.evaluate("!!document.activeElement.closest('#visor-matriz')")
        ok(dentro, 'Tab e Shift+Tab ficam presos no visualizador')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(150)
        R = await pg.evaluate("""(() => ({ aberto: document.getElementById('visor-matriz').open, foco: document.activeElement && document.activeElement.dataset.act,
          dentro: !!(document.activeElement && document.activeElement.closest('.ini-mapa-pe')), html: document.documentElement.classList.contains('visor-aberto') }))()""")
        ok(not R['aberto'] and R['foco'] == 'ver-matriz' and R['dentro'] and not R['html'], 'Esc fecha e devolve o foco ao link "Ver a matriz completa"')
        await pg.locator('.ini-mapa-pe [data-act="ver-matriz"]').click(); await pg.wait_for_timeout(200)
        await pg.mouse.click(5, 5); await pg.wait_for_timeout(150)
        ok(not await pg.evaluate("document.getElementById('visor-matriz').open"), 'clique no fundo fecha o visualizador')
        await pg.locator('.ini-mapa-pe [data-act="ver-matriz"]').click(); await pg.wait_for_timeout(200)
        await pg.click('#visor-matriz [data-matriz-fechar]'); await pg.wait_for_timeout(150)
        ok(not await pg.evaluate("document.getElementById('visor-matriz').open"), '"Fechar" fecha o visualizador')

        # ---- textos em EN, ES e FR (fase aberta, legenda, visualizador)
        await pg.click('button.ini-f-b[data-inicio-fase="piloto"]'); await pg.wait_for_timeout(150)
        await restos(pg, '#inicio', 'en', alheios_pt, 'EN página inicial')
        for lang in ['es', 'fr']:
            await pg.select_option('#sel-lang', lang); await pg.wait_for_timeout(200)
            for fid in ['contexto', 'piloto', 'implantacao', 'expansao']:
                await pg.evaluate(f"INICIO_ABERTA = ''; alternarFaseInicio('{fid}')"); await pg.wait_for_timeout(60)
                await restos(pg, '#inicio', lang, alheios_pt, f'{lang.upper()} página inicial, fase {fid}')
            await pg.evaluate("abrirMatriz(document.body)"); await pg.wait_for_timeout(150)
            await restos(pg, '#visor-matriz', lang, alheios_pt, f'{lang.upper()} visualizador')
            await pg.evaluate('fecharMatriz()')
        cta = await pg.evaluate("document.querySelector('#inicio .ini-acoes [data-act=\"comecar\"]').textContent.trim()")
        ok(cta == "Commencer le plan d’achat", f'FR: botão principal "{cta}"')
        await pg.select_option('#sel-lang', 'en'); await pg.wait_for_timeout(150)

        # ---- tipografia: nada abaixo de .86rem
        await pg.evaluate("INICIO_ABERTA = ''; alternarFaseInicio('piloto'); abrirMatriz(document.body)"); await pg.wait_for_timeout(150)
        m, onde, rem = await pg.evaluate(FONTE_MIN, '#inicio, #visor-matriz')
        ok(m >= 0.86 * rem - 0.05, f'menor fonte na página inicial e na matriz: {m:.2f} px ({onde}); mínimo {0.86 * rem:.2f} px')
        await pg.evaluate('fecharMatriz()')

        # ---- "Iniciar" leva ao 1.1
        await pg.evaluate('window.scrollTo(0, 0)')
        await pg.click('#inicio .ini-acoes [data-act="comecar"]'); await pg.wait_for_timeout(400)
        I = await pg.evaluate("({ fase: S.fase, passo: S.passo, boas: S.boasVindas, ini: !!document.getElementById('inicio'), p: !!document.getElementById('passo-1a') })")
        ok(I['fase'] == 'contexto' and I['passo'] == '1a' and I['boas'] is False and not I['ini'] and I['p'], f'"Iniciar" leva ao passo 1.1 {I}')

        # ---- matriz do caso (dentro do percurso)
        await pg.evaluate("(()=>{ carregarExemplo('B'); S.boasVindas = false; abrirFase('contexto', '1a'); })()"); await pg.wait_for_timeout(300)
        await pg.evaluate("abrirMatriz(document.body)"); await pg.wait_for_timeout(250)
        C = await pg.evaluate("""(() => { const d = document.getElementById('visor-matriz'); const mc = matrizCaso();
          const est = [...d.querySelectorAll('tbody td')].map(td => (td.querySelector('.mt-selo') || {}).className || '');
          const esp = []; for (let k = 1; k <= 7; k++) FASES_MATRIZ.forEach(f => esp.push('mt-selo est-' + mc.celulas[k][f].estado));
          return { selos: d.querySelectorAll('.mt-selo').length, est, esp, custo: mc.custo, v: d.querySelectorAll('.mt-v').length,
            nota: !!d.querySelector('.mt-nota'), cred: !!d.querySelector('.mt-cred'), caso: d.querySelector('.mt').classList.contains('mt-caso') }; })()""")
        ok(C['caso'] and C['selos'] == 28 and C['est'] == C['esp'], 'no percurso mostra a matriz do caso, com o selo de estado de cada célula')
        ok(C['custo'] and C['v'] == 21 and C['nota'] and C['cred'], f'exemplo B: custo nas 21 células das fases 2 a 4, nota de custo e crédito')
        await pg.screenshot(path=f'{TMP}/test_matriz_caso_1360.png')
        await restos(pg, '#visor-matriz', 'en', alheios_pt, 'EN matriz do caso')
        await pg.evaluate('fecharMatriz()')

        # ---- caso salvo
        await pg.evaluate('salvar()')
        await abrir(pg, 'en', limpar=False)
        Sv = await pg.evaluate("""(() => ({ salvo: !!document.querySelector('#inicio .ini-salvo [data-act="continuar-salvo"]'),
          branco: !!document.querySelector('#inicio .ini-salvo [data-act="comecar"]'), cta: !!document.querySelector('#inicio .ini-acoes [data-act="comecar"]') }))()""")
        ok(Sv['salvo'] and Sv['branco'] and Sv['cta'], 'caso salvo: bloco com "Continuar o caso salvo" e "Começar em branco"')
        await pg.click('#inicio [data-act="continuar-salvo"]'); await pg.wait_for_timeout(300)
        ok(await pg.evaluate("S.boasVindas === false && S.exemplo === 'B' && !document.getElementById('inicio')"), '"Continuar o caso salvo" abre o caso')

        # ---- movimento reduzido
        await pg.emulate_media(reduced_motion='reduce')
        await abrir(pg, 'en')
        await pg.click('button.ini-f-b[data-inicio-fase="expansao"]'); await pg.wait_for_timeout(100)
        an = await pg.evaluate("[getComputedStyle(document.getElementById('ini-p-expansao')).animationName, getComputedStyle(document.querySelector('.ini-chev')).transitionDuration]")
        ok(an[0] == 'none' and an[1] in ('0s', '1e-05s'), f'prefers-reduced-motion: sem animação {an}')
        ok(not errs, f'sem erros no console {errs[:3]}')
        await pg.close()

        # ---- 400 px
        pg = await b.new_page(viewport={'width': 400, 'height': 860}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await abrir(pg, 'en')
        ok(await pg.evaluate(LARGURA) <= 0, '400 px: página inicial sem rolagem horizontal')
        await pg.screenshot(path=f'{TMP}/test_inicio_400.png', full_page=True)
        await pg.click('button.ini-f-b[data-inicio-fase="piloto"]'); await pg.wait_for_timeout(300)
        Lw = await pg.evaluate("""(() => { const p = document.getElementById('ini-p-piloto'), c = document.querySelector('[data-inicio-card="piloto"]');
          const ws = [...document.querySelectorAll('#inicio *')].map(e => e.getBoundingClientRect()).filter(r => r.width).map(r => r.right);
          return { depois: p.getBoundingClientRect().top >= c.getBoundingClientRect().bottom - 2, dir: Math.max(...ws) }; })()""")
        ok(await pg.evaluate(LARGURA) <= 0 and Lw['dir'] <= 400.5, f'400 px: fase aberta sem rolagem horizontal (maior right {Lw["dir"]:.1f})')
        ok(Lw['depois'], '400 px: fases empilhadas, resumo logo abaixo do cartão da fase')
        await pg.screenshot(path=f'{TMP}/test_fase_400.png', full_page=True)
        await pg.locator('#ini-p-piloto [data-act="ver-matriz"]').click(); await pg.wait_for_timeout(250)
        M = await pg.evaluate("""(() => { const r = document.querySelector('#visor-matriz .mt-rol'), th = document.querySelector('#visor-matriz tbody th');
          const vi = document.querySelector('#visor-matriz .visor-in').getBoundingClientRect();
          r.scrollLeft = 300; const fixa = Math.abs(th.getBoundingClientRect().left - r.getBoundingClientRect().left) < 2;
          return { rola: r.scrollWidth > r.clientWidth, fixa, cabe: vi.left >= 0 && vi.right <= 400.5 && vi.bottom <= innerHeight + 0.5,
            pagina: document.documentElement.scrollWidth - document.documentElement.clientWidth }; })()""")
        ok(M['rola'] and M['fixa'] and M['cabe'] and M['pagina'] <= 0, f'400 px: visualizador cabe na tela, tabela rola dentro dele com a primeira coluna fixa {M}')
        await pg.evaluate("document.querySelector('#visor-matriz .mt-rol').scrollLeft = 0")
        await pg.screenshot(path=f'{TMP}/test_matriz_400.png')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(100)
        ok(not errs, f'400 px: sem erros {errs[:3]}')
        await b.close()
    print(f'\n{len(falhas)} falha(s), {len(avisos)} aviso(s)')
    sys.exit(1 if falhas else 0)

asyncio.run(main())
