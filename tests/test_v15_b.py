# v15 (proposta B, painel de trabalho): percurso de ponta a ponta na nova interface.
# Uso: python3 tests/test_v15_b.py   (depois de bash build.sh)
# Em 1366 px e 390 px, em inglês e em árabe (RTL):
#  - começa um caso novo pela página inicial; o passo 1.1 abre sozinho no centro, com h1 e o índice dos 15 passos
#    (lateral no desktop; gaveta "Passo n de 15" no celular);
#  - responde perguntas pelo clique (1.1.1, 1.1.4, 1.1.5, 2.3.4) e confere que o custo mostrado (painel, ou barra e folha
#    no celular) é o de numerosCusto(); a resposta que muda o custo mostra o delta junto da pergunta e em "Última mudança";
#  - navega: Continuar, Voltar, índice (ou gaveta); o número do passo nunca some e o estado aparece em texto;
#  - abas Custo | Plano | Premissas; menu Caso com confirmação antes de substituir o caso e "Desfazer";
#  - abre o plano (sumário executivo primeiro, anexos recolhidos, nenhuma caixa grudada sobre o texto) e baixa o PDF;
#  - sem rolagem horizontal em nenhuma etapa; sem erros no console; alvos de toque de 44 px no celular;
#  - em inglês, nenhuma magnitude portuguesa ("mil", "mi") no painel nem no plano.
import asyncio, os, re
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = '/tmp/claude-0/v15_b'
os.makedirs(TMP, exist_ok=True)
SK = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + open(os.path.join(RAIZ, 'navegador.html')).read() + '</body></html>'
open(f'{TMP}/nav.html', 'w').write(SK)
MAG_PT = re.compile(r'(?:\d|\b[A-Z]{3})[\s  ](?:mil|mi|bi)\b')
falhas = []

def ok(cond, msg):
    print(('ok   ' if cond else 'FALHA ') + msg)
    if not cond: falhas.append(msg)

SEM_ROLAGEM = "document.documentElement.scrollWidth <= innerWidth"
CUSTO_MOTOR = "grande(numerosCusto().total)"

async def rolagem(pg, tag, onde):
    ok(await pg.evaluate(SEM_ROLAGEM), f'{tag}: sem rolagem horizontal ({onde}; {await pg.evaluate("[document.documentElement.scrollWidth, innerWidth]")})')

async def custo_mostrado(pg, cel):
    if not cel: return await pg.evaluate("document.querySelector('#cm-tco').textContent.trim()")
    return await pg.evaluate("document.querySelector('.bc-v').textContent.trim()")

async def clicar(pg, sel):
    await pg.locator(sel).first.scroll_into_view_if_needed()
    await pg.locator(sel).first.click()
    await pg.wait_for_timeout(250)

async def percurso(b, w, h, lang):
    tag = f'{lang} {w}px'
    cel = w < 900
    ctx = await b.new_context(viewport={'width': w, 'height': h}, accept_downloads=True)
    pg = await ctx.new_page(); erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    pg.on('console', lambda m: erros.append(m.text) if m.type == 'error' else None)
    await pg.goto(f'file://{TMP}/nav.html'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
    if lang != 'en':
        await pg.select_option('#sel-lang', lang); await pg.wait_for_timeout(200)
        await pg.evaluate("(() => { const a = document.getElementById('aviso-lang'); if (a) a.hidden = true; })()")
    ok(await pg.evaluate("document.documentElement.dir") == ('rtl' if lang == 'ar' else 'ltr'), f'{tag}: direção do texto')
    ok(await pg.evaluate("!document.querySelector('link[href*=\"fonts.googleapis\"]')"), f'{tag}: sem fontes externas')
    hdr = await pg.evaluate("document.querySelector('.top').getBoundingClientRect().height")
    ok(54 <= hdr <= 60, f'{tag}: cabeçalho de 56 px ({hdr:.0f})')
    await rolagem(pg, tag, 'página inicial')

    # caso novo pela página inicial
    await clicar(pg, '#inicio [data-act="comecar"]')
    E = await pg.evaluate("({ v: document.body.dataset.vista, passo: S.passo, h1: (document.querySelector('#passo-1a h1')||{}).textContent || '', n: document.querySelectorAll('#indice .ix-p').length, ex: S.exemplo })")
    ok(E['v'] == 'trabalho' and E['passo'] == '1a' and '1.1' in E['h1'] and E['n'] == 15 and E['ex'] == 'novo', f'{tag}: caso novo abre o passo 1.1 com h1 e índice dos 15 passos ({E})')
    ok(await pg.evaluate("document.querySelectorAll('#main .passo').length") == 1, f'{tag}: um passo por vez no centro')
    if cel:
        ok(await pg.locator('.passo-gaveta-b').is_visible() and not await pg.locator('#indice').is_visible(), f'{tag}: índice vira gaveta ("Passo n de 15")')
        ok(await pg.locator('#barra-cel .bc-custo').is_visible() and not await pg.locator('#painel').is_visible(), f'{tag}: custo vira barra inferior')
    else:
        ok(await pg.locator('#indice').is_visible() and await pg.locator('#painel #pn-custo').is_visible(), f'{tag}: índice à esquerda e painel de custo à direita, visíveis')
    ok(await pg.evaluate("!!document.querySelector('#ajuda-1a') && !document.querySelector('#ajuda-1a').open"), f'{tag}: "Por que perguntamos?" recolhido')
    await rolagem(pg, tag, 'passo 1.1')

    # respostas pelo clique: 1.1.1, 1.1.4 e 1.1.5
    await clicar(pg, '#q-1-1-1 input[value="estado"] + span')
    ok(await pg.evaluate("S.ctx.nivel") == 'estado', f'{tag}: 1.1.1 respondida pelo clique')
    await clicar(pg, '#q-1-1-4 input[data-etapa="fund2"] + span')
    ok(await pg.evaluate("!!(S.ctx.etapas.fund2||{}).on"), f'{tag}: 1.1.4 respondida pelo clique')
    for sel, v in [('#n-etapas-fund2-escolas', '300'), ('#n-etapas-fund2-anos-0', '20000'), ('#n-etapas-fund2-anos-1', '19000'), ('#n-etapas-fund2-anos-2', '18000'), ('#n-etapas-fund2-anos-3', '17000')]:
        await pg.locator(sel).scroll_into_view_if_needed(); await pg.locator(sel).click(); await pg.keyboard.type(v); await pg.keyboard.press('Tab')
    await pg.wait_for_timeout(400)
    ok(await pg.evaluate("totaisCtx().alunos") == 74000, f'{tag}: 1.1.5 digitada ({await pg.evaluate("totaisCtx().alunos")} estudantes)')
    ok(await custo_mostrado(pg, cel) == await pg.evaluate(CUSTO_MOTOR), f'{tag}: custo mostrado = numerosCusto() ({await custo_mostrado(pg, cel)})')
    ok(await pg.evaluate("document.querySelector('#indice .ix-p[data-ir=\"contexto:1a\"]').classList.contains('st-andamento')"), f'{tag}: índice marca 1.1 em andamento')

    # navegação: Continuar → 1.2; Voltar → 1.1
    await clicar(pg, '#pe-1a .nav-seg')
    ok(await pg.evaluate("S.passo") == '1b' and await pg.locator('#passo-1b').count() == 1, f'{tag}: Continuar leva ao 1.2')
    ok(await pg.evaluate("document.querySelector('#indice .ix-p[data-ir=\"contexto:1a\"] .ix-n').textContent") == '1.1', f'{tag}: o número do passo fica no índice')
    st = await pg.evaluate("[document.querySelector('#indice .ix-p[data-ir=\"contexto:1a\"]').className, document.querySelector('#indice .ix-p[data-ir=\"contexto:1a\"] .sr').textContent]")
    ok('st-pend' in st[0] and st[1].strip() != '', f'{tag}: 1.1 deixado com respostas faltando fica "com pendências", com texto ({st})')
    await clicar(pg, '#pe-1b .nav-ant')
    ok(await pg.evaluate("S.passo") == '1a', f'{tag}: Voltar leva ao 1.1')

    # índice (gaveta no celular) → 2.3
    if cel:
        await clicar(pg, '.passo-gaveta-b')
        ok(await pg.locator('#indice').is_visible(), f'{tag}: a gaveta do índice abre')
        alvos = await pg.evaluate("[...document.querySelectorAll('#indice .ix-p')].map(e => e.getBoundingClientRect().height)")
        ok(min(alvos) >= 44, f'{tag}: itens do índice com 44 px ou mais ({min(alvos):.0f})')
        await rolagem(pg, tag, 'gaveta aberta')
    await clicar(pg, '#indice .ix-p[data-ir="piloto:2c"]')
    ok(await pg.evaluate("S.passo") == '2c' and not await pg.evaluate("document.getElementById('indice').classList.contains('aberto')"), f'{tag}: o índice leva ao 2.3 (e a gaveta fecha)')

    # resposta que muda o custo: delta junto da pergunta e em "Última mudança"
    antes = await pg.evaluate("numerosCusto().total")
    await clicar(pg, '#q-2-3-4 input[value="publica"] + span')
    await pg.wait_for_timeout(300)
    depois = await pg.evaluate("numerosCusto().total")
    ok(abs(depois - antes) >= 0.5, f'{tag}: 2.3.4 muda o custo ({antes:.0f} → {depois:.0f})')
    d = await pg.evaluate("(() => { const p = document.querySelector('#q-2-3-4 .q-delta'); return p && !p.hidden ? p.textContent : ''; })()")
    ok(d and await pg.evaluate("grande(Math.abs(MUDANCAS[0].delta))") in d, f'{tag}: delta junto da pergunta ("{d.strip()}")')
    ok(await pg.evaluate("MUDANCAS[0].n") == '2.3.4' and '2.3.4' in await pg.evaluate("document.getElementById('cm-viva').textContent"), f'{tag}: "Última mudança" cita a pergunta 2.3.4 numa região aria-live')
    ok(await pg.evaluate("document.getElementById('cm-viva').getAttribute('aria-live')") == 'polite', f'{tag}: região aria-live polite')
    ok(await custo_mostrado(pg, cel) == await pg.evaluate(CUSTO_MOTOR), f'{tag}: custo mostrado acompanha numerosCusto() depois da resposta')
    if cel:
        await clicar(pg, '#barra-cel .bc-custo')
        ok(await pg.locator('#painel').is_visible(), f'{tag}: a barra de custo abre a folha')
        ok(await pg.evaluate("document.querySelector('#cm-tco').textContent.trim()") == await pg.evaluate(CUSTO_MOTOR), f'{tag}: folha com o custo de numerosCusto()')
        hs = await pg.evaluate("[...document.querySelectorAll('#painel [role=tab], #painel .pn-fechar, #barra-cel button')].map(e => e.getBoundingClientRect().height)")
        ok(min(hs) >= 44, f'{tag}: abas, fechar e barra com 44 px ou mais ({min(hs):.0f})')
        await rolagem(pg, tag, 'folha aberta')
    await pg.wait_for_timeout(500)
    ok(await pg.evaluate("!!document.querySelector('#pn-custo .cm-faixa') && !!document.querySelector('#pn-custo .cm-fases') && document.querySelectorAll('#pn-custo .cm-dir li').length === 3"), f'{tag}: painel com faixa, custo por fase e três direcionadores')
    ok(await pg.evaluate("document.querySelector('#cm-ano0').textContent.trim() === grande(numerosCusto().ano0) && document.querySelector('#cm-anual').textContent.trim() === grande(numerosCusto().av.tco.anual.eco)"), f'{tag}: Ano 0 e anual em regime iguais aos do motor')
    if lang == 'en':
        t = await pg.evaluate("document.getElementById('painel').innerText")
        ok(not MAG_PT.search(t), f'{tag}: painel sem "mil/mi" ({MAG_PT.findall(t)[:3]})')

    # abas Plano e Premissas
    await clicar(pg, '#tab-plano')
    ok(await pg.evaluate("UI.aba") == 'plano' and await pg.locator('#pn-plano .pl-dec, #pn-plano .muted').first.is_visible(), f'{tag}: aba Plano')
    await clicar(pg, '#tab-premissas')
    ok(await pg.evaluate("UI.aba") == 'premissas' and await pg.evaluate("document.querySelectorAll('#pn-premissas .pm-l li').length") > 0, f'{tag}: aba Premissas com as premissas do passo 2.3')
    await clicar(pg, '#pn-premissas [data-act="prem-abrir"]')
    ok(await pg.evaluate("!!document.querySelector('#prem-av #custos-box input[data-cfg]')"), f'{tag}: painel avançado de premissas (custos_ui) no centro')
    await clicar(pg, '#prem-av [data-act="prem-fechar"]')
    ok(await pg.locator('#passo-2c').count() == 1, f'{tag}: volta do painel avançado ao passo')
    if not cel: await clicar(pg, '#tab-custo')

    # menu Caso: confirmação antes de substituir e "Desfazer"
    await clicar(pg, '#btn-menu' if cel else '#btn-caso')
    ok(await pg.locator('#menu-caso').is_visible(), f'{tag}: menu Caso abre')
    await clicar(pg, '#menu-caso [data-act="caso-exemplo"][data-ex="A"]')
    ok(await pg.locator('#dlg-troca').is_visible() and await pg.evaluate("S.exemplo") == 'novo', f'{tag}: pede confirmação antes de substituir o caso')
    await clicar(pg, '#dlg-troca [data-act="troca-ok"]')
    ok(await pg.evaluate("S.exemplo") == 'A', f'{tag}: exemplo carregado depois de confirmar')
    ok(await pg.locator('#toast button').is_visible(), f'{tag}: aviso com "Desfazer"')
    await pg.locator('#toast button').click(); await pg.wait_for_timeout(300)
    ok(await pg.evaluate("S.exemplo === 'novo' && totaisCtx().alunos === 74000"), f'{tag}: "Desfazer" restaura o caso anterior')

    # plano: vista de leitura e PDF
    if cel:
        await clicar(pg, '#btn-menu'); await clicar(pg, '#menu-caso [data-act="gerar-plano"]')
    else: await clicar(pg, '#btn-ver-plano')
    await pg.wait_for_timeout(500)
    P = await pg.evaluate("""(() => { const P = document.getElementById('plano'); const toc = [...P.querySelectorAll('[data-toc]')].map(e => e.dataset.toc);
      const cl = P.querySelector('aside.rp-comoler');
      return { vista: S.vista, toc: toc.slice(0, 2), anexos: P.querySelectorAll('details.rp-anexo-d').length, abertos: P.querySelectorAll('details.rp-anexo-d[open]').length,
        comoler: cl ? getComputedStyle(cl).position : '', top: getComputedStyle(document.querySelector('.top')).position, indice: !!P.querySelector('.rp-indice') }; })()""")
    ok(P['vista'] == 'plano' and P['toc'][0] == 'sintese', f'{tag}: plano abre com o sumário executivo primeiro ({P["toc"]})')
    ok(P['anexos'] >= 9 and P['abertos'] == 0, f'{tag}: anexos recolhidos ({P["anexos"]})')
    ok(P['comoler'] != 'sticky' and P['top'] != 'sticky' and P['indice'], f'{tag}: sem caixa grudada sobre o texto, cabeçalho não fixo, com índice ({P})')
    await rolagem(pg, tag, 'plano')
    if lang == 'en':
        t = await pg.evaluate("document.getElementById('plano').innerText")
        ok(not MAG_PT.search(t), f'{tag}: plano sem "mil/mi" ({MAG_PT.findall(t)[:3]})')
    await pg.evaluate("document.querySelector('#plano a[href=\"#plano-anexo-g\"], #plano a[href=\"#plano-premissas\"]') && document.querySelector('#plano a[href=\"#plano-anexo-g\"], #plano a[href=\"#plano-premissas\"]').click()")
    await pg.wait_for_timeout(200)
    async with pg.expect_download() as dl:
        await pg.locator('[data-act="pdf"]:visible').first.click()
    dd = await dl.value
    arq = f'{TMP}/plano_{lang}_{w}.pdf'; await dd.save_as(arq)
    ok(re.fullmatch(r'procurement-plan-[a-z0-9-]+\.pdf', dd.suggested_filename) is not None and os.path.getsize(arq) > 20000, f'{tag}: PDF baixado ({dd.suggested_filename}, {os.path.getsize(arq)} bytes)')
    await clicar(pg, '#plano [data-act="voltar-percurso"]')
    ok(await pg.evaluate("document.body.dataset.vista") == 'trabalho', f'{tag}: "Voltar ao caso" volta ao painel de trabalho')
    await rolagem(pg, tag, 'volta ao caso')
    ok(not erros, f'{tag}: sem erros no console ({erros[:3]})')
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, h in [(1366, 900), (390, 844)]:
            for lang in ['en', 'ar']:
                await percurso(b, w, h, lang)
        await b.close()
    print(f'\n{len(falhas)} falha(s)')
    raise SystemExit(1 if falhas else 0)

asyncio.run(main())
