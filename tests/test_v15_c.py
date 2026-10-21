# Teste da proposta C da v15 (documento vivo, src/documento.js), de ponta a ponta e pelo clique:
#  - página inicial → "Começar": o documento abre com 0 de N respostas, lacunas pendentes e "Preencher em ordem";
#  - respostas pelo popover ancorado (texto, escolha, número de um subcampo), com Confirmar, Enter, Esc
#    (desfaz e devolve o foco à lacuna) e "Usar valor ilustrativo";
#  - o custo mostrado (bloco de números e efeito no popover) é o de numerosCusto();
#  - "Preencher em ordem" percorre as lacunas pendentes, inclusive os blocos de formulário (grade);
#  - toda pergunta de CAMPOS é alcançável pelo documento (lacuna ou bloco);
#  - navegação pelo índice (seções 1 a 5 e anexos) e pela lista de lacunas;
#  - menu Caso: abrir um exemplo com respostas no navegador pede confirmação nomeada, e Desfazer volta o caso;
#  - Baixar PDF (src/plano_pdf.js) com os valores respondidos;
#  - 1366 px e 390 px sem rolagem horizontal (alvos das lacunas ≥ 44 px no celular), árabe (RTL) sem rolagem horizontal.
# Uso: python3 tests/test_v15_c.py   (depois de bash build.sh). Capturas em /tmp/claude-0/v15_c/
import asyncio, os, re, subprocess, sys
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = '/tmp/claude-0/v15_c'
os.makedirs(TMP, exist_ok=True)
SK = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + open(os.path.join(RAIZ, 'navegador.html')).read() + '</body></html>'
ARQ = TMP + '/nav.html'
open(ARQ, 'w').write(SK)

falhas = []
def ok(cond, msg):
    print(('ok   ' if cond else 'FALHA ') + msg)
    if not cond: falhas.append(msg)

NUM = """(() => { const n = numerosCusto(); const v = document.querySelector('#dv-num [data-k="tco"] .dv-v'); const a = document.querySelector('#dv-num [data-k="ano0"] .dv-v2');
  return { tela: v ? v.textContent.trim() : '', ano0Tela: a ? a.textContent.trim() : '', tco: grande(n.total), ano0: grande(n.ano0) }; })()"""

async def abrir(pg, lang='en'):
    await pg.goto('file://' + ARQ); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
    if lang != 'en': await pg.select_option('#sel-lang', lang); await pg.wait_for_timeout(200)

async def sem_rolagem(pg, w, tag):
    sw = await pg.evaluate('document.documentElement.scrollWidth')
    ok(sw <= w + 1, f'{tag}: sem rolagem horizontal ({sw} ≤ {w})')

async def fluxo(pg, w, tag, erros):
    cel = w < 600
    await abrir(pg)
    await pg.click('[data-act="comecar"]'); await pg.wait_for_timeout(500)
    ok(await pg.evaluate('S.boasVindas === false && !!document.getElementById("dv-doc")'), f'{tag}: "Começar" abre o documento')
    pr = await pg.evaluate('progressoDoc()')
    ok(pr['n'] == 0 and pr['N'] > 30, f'{tag}: caso em branco com 0 de {pr["N"]} respostas')
    t = await pg.locator('#top-doc .tp-n').inner_text()
    ok(re.search(r'0 of \d+', t) is not None, f'{tag}: barra superior mostra "0 of N" ({t!r})')
    ok(await pg.locator('#dv-num [data-k="tco"] .dv-v').count() == 1, f'{tag}: bloco de números com o TCO no topo')
    ok('Illustrative' in await pg.locator('#dv-num').inner_text(), f'{tag}: números marcados como ilustrativos')
    await sem_rolagem(pg, w, tag + ' início')

    # todas as perguntas alcançáveis: cada campo aplicável tem lacuna ou bloco no documento
    falt = await pg.evaluate("""(() => camposAplicaveis().filter(f => !(document.querySelector(`#dv-doc [data-lac="${f.id}"], #dv-doc [data-lac^="${f.id}:"]`) || document.getElementById(idQ(f.n)))).map(f => f.n))()""")
    ok(not falt, f'{tag}: toda pergunta aplicável aparece no documento (faltam: {falt})')
    todos = await pg.evaluate("CAMPOS.filter(f => !ordemDoc().L.includes(f.id)).map(f => f.n)")
    ok(not todos, f'{tag}: toda pergunta de CAMPOS está na ordem do documento ({todos})')

    # 1) "Preencher em ordem" abre a primeira lacuna (nome da rede), digita e confirma com Enter
    fila = '#dv-fab' if cel else '#top-doc [data-act="dv-fila"]'
    await pg.click(fila); await pg.wait_for_timeout(400)
    ok(await pg.evaluate('DOC.pop && DOC.pop.key') == 'local', f'{tag}: Preencher em ordem abre a lacuna "local"')
    ok(await pg.evaluate('document.activeElement && document.activeElement.id') == 'f-local', f'{tag}: foco no campo do popover')
    await pg.keyboard.type('Pelotas municipal network'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(600)
    ok(await pg.evaluate('S.ctx.local') == 'Pelotas municipal network', f'{tag}: resposta gravada em S.ctx.local')
    ok(await pg.evaluate('DOC.pop && DOC.pop.key') == 'nivel', f'{tag}: a fila segue para a próxima lacuna (nível)')
    # 2) escolha pelo clique no popover
    await pg.locator('#lac-pop .opt').nth(2).click(); await pg.wait_for_timeout(300)
    await pg.click('#lac-pop [data-lp="ok"]'); await pg.wait_for_timeout(600)
    ok(await pg.evaluate('S.ctx.nivel') == 'municipio', f'{tag}: nível respondido pelo clique')
    txt = await pg.locator('#plano-s1 .dv-f').first.inner_text()
    ok('Pelotas municipal network' in txt and 'municipality' in txt.lower(), f'{tag}: a frase da seção 1 mostra as respostas ({txt[:90]!r})')
    # 3) Esc fecha sem mudar e devolve o foco à lacuna
    k = await pg.evaluate('DOC.pop && DOC.pop.key')
    await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
    ok(await pg.evaluate('!DOC.pop && !document.getElementById("lac-pop")'), f'{tag}: Esc fecha o popover')
    ok(await pg.evaluate('document.activeElement && document.activeElement.dataset.lac') == k, f'{tag}: foco volta à lacuna {k}')

    # 4) etapas e grade (bloco de formulário) pelo clique
    await pg.click('#dv-doc [data-lac="etapas"]'); await pg.wait_for_timeout(300)
    await pg.locator('#lac-pop input[data-etapa="fund2"]').check(); await pg.wait_for_timeout(300)
    await pg.click('#lac-pop [data-lp="ok"]'); await pg.wait_for_timeout(600)
    ok(await pg.evaluate("!!(S.ctx.etapas.fund2 || {}).on"), f'{tag}: etapa marcada no popover')
    g = pg.locator('#q-1-1-5 input[data-ctxn="etapas.fund2.escolas"]')
    ok(await g.count() == 1, f'{tag}: bloco da grade escolas × estudantes no documento')
    await g.fill('120'); await g.dispatch_event('change')
    await pg.locator('#q-1-1-5 [data-sototal="fund2"]').click(); await pg.wait_for_timeout(300)
    al = pg.locator('#q-1-1-5 input[data-ctxn="etapas.fund2.alunos"]'); await al.fill('40000'); await al.dispatch_event('change'); await pg.wait_for_timeout(600)
    ok(await pg.evaluate("totaisCtx().alunos") == 40000, f'{tag}: 40 000 estudantes gravados pela grade')

    # 5) custo mostrado = numerosCusto(), e o efeito no popover acompanha a resposta
    n0 = await pg.evaluate(NUM)
    ok(n0['tela'] == n0['tco'] and n0['ano0Tela'] == n0['ano0'], f'{tag}: números do topo = numerosCusto() ({n0})')
    await pg.click('#dv-doc [data-lac="testes"]'); await pg.wait_for_timeout(300)
    await pg.locator('#lac-pop input[data-fm="testes"][value="piloto"]').check(); await pg.wait_for_timeout(300)
    await pg.click('#lac-pop [data-lp="ok"]'); await pg.wait_for_timeout(600)
    await pg.click('#plano-s1 [data-lac="piloto:participantes"]'); await pg.wait_for_timeout(300)
    await pg.fill('#lp-in', '5000'); await pg.dispatch_event('#lp-in', 'change'); await pg.wait_for_timeout(300)
    await pg.click('#lac-pop [data-lp="ok"]'); await pg.wait_for_timeout(700)
    ok(await pg.evaluate("S.caso.piloto.participantes === 5000 && S.respC['piloto.participantes'] === true"), f'{tag}: subcampo do piloto confirmado')
    # pessoas que usariam (4.1.1): muda o custo recorrente
    await pg.click('#plano-s1 [data-lac="elegiveis"]'); await pg.wait_for_timeout(300)
    antes = await pg.evaluate('numerosCusto().total')
    await pg.fill('#f-elegiveis', '20000'); await pg.dispatch_event('#f-elegiveis', 'change'); await pg.wait_for_timeout(400)
    ef = await pg.locator('#lp-ef').inner_text()
    depois = await pg.evaluate('numerosCusto().total')
    esperado = await pg.evaluate(f'(() => {{ const d = {depois} - {antes}; return (Math.abs(d) < 0.5 ? grande(0) : (d < 0 ? "−" : "+") + grande(Math.abs(d))); }})()')
    ok(abs(depois - antes) > 1 and esperado in ef, f'{tag}: efeito no custo no popover = delta de numerosCusto ({esperado} em {ef!r})')
    await pg.click('#lac-pop [data-lp="ok"]'); await pg.wait_for_timeout(700)
    ok(await pg.evaluate("+S.caso.elegiveis === 20000 && S.respC.elegiveis === true"), f'{tag}: pessoas que usariam confirmadas')
    n1 = await pg.evaluate(NUM)
    ok(n1['tela'] == n1['tco'] and n1['tco'] != n0['tco'], f'{tag}: o TCO do topo mudou e é o de numerosCusto() ({n0["tco"]} → {n1["tela"]})')
    ok('Last change' in await pg.locator('#dv-num').inner_text(), f'{tag}: bloco de números mostra a última mudança')
    # 6) "Usar valor ilustrativo" tira a resposta
    await pg.click('#plano-s1 [data-lac="piloto:participantes"]'); await pg.wait_for_timeout(300)
    await pg.click('#lac-pop [data-lp="ilus"]'); await pg.wait_for_timeout(600)
    ok(await pg.evaluate("!S.respC['piloto.participantes']"), f'{tag}: "Usar valor ilustrativo" desfaz a resposta')
    ok(await pg.locator('#plano-s1 [data-lac="piloto:participantes"].lac-ilus, #plano-s1 [data-lac="piloto:participantes"].lac-vazio').count() >= 1, f'{tag}: a lacuna volta a ser ilustrativa (pontilhada)')
    pr2 = await pg.evaluate('progressoDoc()')
    ok(pr2['n'] >= 4, f'{tag}: progresso {pr2["n"]} de {pr2["N"]}')

    # 7) lista de lacunas pendentes e navegação pelo índice
    if cel:
        await pg.click('#btn-gaveta'); await pg.wait_for_timeout(300)
        ok(await pg.evaluate("document.body.classList.contains('dv-gaveta')"), f'{tag}: índice abre em gaveta')
    await pg.locator('#dv-ind .dv-pl').first.click(); await pg.wait_for_timeout(500)
    ok(await pg.evaluate('!!DOC.pop || !!DOC.alvo'), f'{tag}: item da lista de lacunas abre a lacuna')
    await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
    for sid in ['s2', 's5', 'anexos']:
        if cel:
            await pg.click('#btn-gaveta'); await pg.wait_for_timeout(250)
        await pg.click(f'#dv-ind a[href="#plano-{sid}"]'); await pg.wait_for_timeout(400)
        top = await pg.evaluate(f"document.getElementById('plano-{sid}').getBoundingClientRect().top")
        ok(0 <= top < 300, f'{tag}: índice leva à seção {sid} (topo em {round(top)} px)')
    ok(await pg.locator('#plano-s2 .rs-ice').count() == 1, f'{tag}: seção 2 mostra os icebergs por fase')
    ok(await pg.locator('#plano-s5 #bl-gov .q').count() == 6, f'{tag}: seção 5 traz as seis perguntas de governança como bloco')
    await sem_rolagem(pg, w, tag + ' documento')
    if cel:
        h = await pg.evaluate("Math.min(...[...document.querySelectorAll('#plano-s1 .dv-f .lac')].map(b => b.getBoundingClientRect().height))")
        ok(h >= 44 - 0.5, f'{tag}: alvo das lacunas ≥ 44 px ({h:.1f})')
        await pg.screenshot(path=f'{TMP}/{tag}_doc.png')
    else:
        await pg.screenshot(path=f'{TMP}/{tag}_doc.png')

    # 8) PDF com os valores respondidos
    async with pg.expect_download() as dl:
        await pg.locator('[data-act="pdf"]:visible').first.click()
    d = await dl.value
    arq = f'{TMP}/{tag}.pdf'; await d.save_as(arq)
    ok(re.fullmatch(r'procurement-plan-[a-z0-9-]+\.pdf', d.suggested_filename) is not None, f'{tag}: PDF baixado ({d.suggested_filename})')
    try:
        txt = subprocess.run(['pdftotext', '-layout', arq, '-'], capture_output=True, text=True).stdout
        ok('Pelotas municipal network' in txt, f'{tag}: o PDF traz a resposta "Pelotas municipal network"')
        tco = (await pg.evaluate(NUM))['tco']
        ok(tco.replace(' ', ' ') in txt.replace(' ', ' '), f'{tag}: o PDF traz o TCO {tco}')
    except FileNotFoundError:
        print('aviso: pdftotext ausente')

    # 9) menu Caso: abrir um exemplo pede confirmação; Desfazer volta o caso
    await pg.click('#btn-caso'); await pg.wait_for_timeout(200)
    ok(await pg.evaluate("!document.getElementById('menu-caso').hidden"), f'{tag}: menu Caso abre')
    await pg.click('#menu-caso [data-act="dv-ex"][data-k="A"]'); await pg.wait_for_timeout(300)
    ok(await pg.evaluate("!!document.querySelector('#dlg-troca[open]')"), f'{tag}: abrir um exemplo pede confirmação')
    await pg.click('#dlg-troca [data-troca="nao"]'); await pg.wait_for_timeout(300)
    ok(await pg.evaluate('S.ctx.local') == 'Pelotas municipal network', f'{tag}: Cancelar mantém o caso')
    await pg.click('#btn-caso'); await pg.click('#menu-caso [data-act="dv-ex"][data-k="A"]'); await pg.wait_for_timeout(300)
    await pg.click('#dlg-troca [data-troca="ok"]'); await pg.wait_for_timeout(800)
    ok(await pg.evaluate("S.exemplo") == 'A', f'{tag}: Substituir abre o exemplo A')
    await pg.click('#toast-desf'); await pg.wait_for_timeout(800)
    ok(await pg.evaluate('S.ctx.local') == 'Pelotas municipal network', f'{tag}: Desfazer volta o caso anterior')
    ok(not erros, f'{tag}: sem erros de console {erros[:3]}')

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, h, tag in [(1366, 900, 'd1366'), (390, 844, 'm390')]:
            ctx = await b.new_context(viewport={'width': w, 'height': h}, accept_downloads=True, device_scale_factor=1)
            pg = await ctx.new_page()
            erros = []
            pg.on('pageerror', lambda e, er=erros: er.append(str(e)))
            pg.on('console', lambda m, er=erros: er.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
            await fluxo(pg, w, tag, erros)
            await ctx.close()
        # árabe (RTL) com o exemplo A, nas duas larguras
        for w, h in [(1366, 900), (390, 844)]:
            ctx = await b.new_context(viewport={'width': w, 'height': h}, accept_downloads=True)
            pg = await ctx.new_page()
            await abrir(pg, 'ar')
            await pg.click('[data-act="ver-exemplo"]'); await pg.wait_for_timeout(800)
            ok(await pg.evaluate("document.documentElement.dir") == 'rtl', f'ar {w}: dir=rtl')
            await sem_rolagem(pg, w, f'ar {w} documento')
            await pg.locator('#plano-s1 .dv-f .lac').first.click(); await pg.wait_for_timeout(400)
            r = await pg.evaluate("(() => { const r = document.getElementById('lac-pop').getBoundingClientRect(); return [r.left, r.right, innerWidth]; })()")
            ok(r[0] >= -1 and r[1] <= r[2] + 1, f'ar {w}: popover dentro da tela ({r})')
            await sem_rolagem(pg, w, f'ar {w} popover')
            await pg.screenshot(path=f'{TMP}/ar_{w}.png')
            await ctx.close()
        await b.close()
    print('\n' + ('TUDO OK' if not falhas else f'{len(falhas)} falha(s)'))
    sys.exit(1 if falhas else 0)

asyncio.run(main())
