# v15 (proposta B3): preenchimento para leigos e três aparências, de ponta a ponta.
# Uso: bash build.sh && flock /tmp/claude-0/upt-tests.lock python3 tests/test_v15_b3.py
# Verifica:
#  - caso novo: as respostas começam vazias em todos os passos (nada marcado, nenhum campo preenchido, nenhuma pergunta respondida);
#  - sugestões: "Sugerido: X" com Aceitar; nada fica marcado antes do clique; um clique aceita e marca;
#  - toda pergunta de CAMPOS (com as condições satisfeitas) tem ⓘ com texto não vazio em pt, en, es e fr, e os textos novos
#    estão traduzidos; ⓘ do passo, do painel de custo e das seções do plano;
#  - o ⓘ abre e fecha pelo teclado (Enter, Esc devolve o foco, Espaço) e pelo botão Fechar, com aria-expanded;
#  - campos de custo vazios mostram o valor ilustrativo do motor, marcado "Valor ilustrativo, usado até você informar";
#    "Afeta o custo" nas perguntas de custo; "Por que este valor?" e "O que fazer agora";
#  - Enter avança para a próxima pergunta; a contagem "Faltam N perguntas neste passo" acompanha as respostas;
#  - as três aparências mudam fontes e cores (getComputedStyle) e a escolha persiste depois de recarregar;
#  - 1366 e 390 px sem rolagem horizontal nas três aparências; árabe (RTL) sem rolagem horizontal;
#  - custo mostrado = numerosCusto(); o PDF baixa.
import asyncio, os, re
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = '/tmp/claude-0/v15_b3'
os.makedirs(TMP, exist_ok=True)
SK = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + open(os.path.join(RAIZ, 'navegador.html')).read() + '</body></html>'
open(f'{TMP}/nav.html', 'w').write(SK)
PT = re.compile(r'ã|õ|ção|ções|\b(?:você|não|também|escolas?|custo|formação|passo|pergunta)\b', re.I)
falhas = []

def ok(cond, msg):
    print(('ok   ' if cond else 'FALHA ') + msg)
    if not cond: falhas.append(msg)

SEM_ROLAGEM = "document.documentElement.scrollWidth <= innerWidth"
PASSOS = "FASES.flatMap(f => PASSOS[f.id].map(p => [f.id, p[0]]))"
# estado com todas as condições "se" satisfeitas, para que todas as perguntas de CAMPOS apareçam
TODAS = """(() => { carregarExemplo('novo'); S.boasVindas = false; S.caso.conheceFerramentas = 'sim'; S.caso.ferramentas = [novaFerramenta()];
  S.caso.internet = 'parcial'; S.caso.curva = 'ondas'; S.respC.conheceFerramentas = S.respC.internet = S.respC.curva = true; render(); })()"""

async def abrir(b, w, h, lang='pt', limpar=True):
    ctx = await b.new_context(viewport={'width': w, 'height': h}, accept_downloads=True)
    pg = await ctx.new_page(); erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    pg.on('console', lambda m: erros.append(m.text) if m.type == 'error' else None)
    await pg.goto(f'file://{TMP}/nav.html')
    if limpar: await pg.evaluate('localStorage.clear()'); await pg.reload()
    await pg.wait_for_timeout(300)
    if lang != 'en':
        await pg.select_option('#sel-lang', lang); await pg.wait_for_timeout(150)
        await pg.evaluate("(() => { const a = document.getElementById('aviso-lang'); if (a) a.hidden = true; })()")
    return ctx, pg, erros

async def ev(pg, js, t=150):
    r = await pg.evaluate(js); await pg.wait_for_timeout(t); return r

async def vazio_e_sugestoes(b):
    ctx, pg, erros = await abrir(b, 1366, 900, 'pt')
    await pg.click('#inicio [data-act="comecar"]'); await pg.wait_for_timeout(300)
    ok(await ev(pg, "S.exemplo") == 'novo', 'caso novo pela página inicial')
    marcados, cheios, respondidas = [], [], []
    for fid, pid in await ev(pg, PASSOS, 0):
        await ev(pg, f"abrirFase('{fid}','{pid}')", 120)
        m = await ev(pg, """[...document.querySelectorAll('#main .passo .q input:checked, #main .passo .q [aria-pressed="true"]')].map(e => (e.closest('.q')||{}).dataset.n)""", 0)
        c = await ev(pg, """[...document.querySelectorAll('#main .passo .q input[type=text], #main .passo .q textarea')].filter(e => e.value.trim()).map(e => e.id)""", 0)
        r = await ev(pg, f"camposPasso('{pid}').filter(f => qOk(f)).map(f => f.n)", 0)
        marcados += m; cheios += c; respondidas += r
    ok(not marcados, f'caso novo: nada marcado em nenhum passo ({marcados[:5]})')
    ok(not cheios, f'caso novo: nenhum campo preenchido ({cheios[:5]})')
    ok(not respondidas, f'caso novo: nenhuma pergunta conta como respondida ({respondidas[:5]})')
    ok(await ev(pg, "faltasTotal()") > 30 and 'Faltam' in await ev(pg, "document.getElementById('ix-falta').textContent", 0), f'índice diz quantas perguntas faltam no total ({await ev(pg, "faltasTotal()", 0)})')

    # sugestões dos problemas (1.2) → tarefas (2.1): aparecem em "Sugerido", sem marcar
    await ev(pg, "abrirFase('contexto','1b')")
    await pg.click('label[for="pr-com"]'); await pg.wait_for_timeout(200)
    await pg.click('#pb-C2'); await pg.wait_for_timeout(250)
    ok(await ev(pg, "sugerido(CAMPO_POR_ID.problema) && document.getElementById('f-problema').value === ''"), '1.2.4: a sugestão não entra no campo')
    ok(await pg.locator('#sug-problema [data-act="aceitar"]').is_visible(), '1.2.4: "Sugerido" com o botão Aceitar')
    await ev(pg, "abrirFase('piloto','2a')", 200)
    n = await ev(pg, "S.caso.tarefas.length", 0)
    ok(n > 0 and await pg.locator('#q-2-1-1 input:checked').count() == 0 and await pg.locator('#sug-tarefas .sug-v b > span').count() == n, f'2.1.1: {n} tarefas sugeridas, nenhuma marcada')
    await pg.click('#sug-tarefas [data-act="aceitar"]'); await pg.wait_for_timeout(250)
    ok(await ev(pg, "qOk(CAMPO_POR_ID.tarefas) && !sugerido(CAMPO_POR_ID.tarefas)") and await pg.locator('#q-2-1-1 input:checked').count() == n, 'um clique em Aceitar marca as tarefas sugeridas')
    ok(await pg.locator('#sug-tarefas').count() == 0, 'a caixa de sugestão some depois de aceitar')
    # 2.0 → 2.3.8: a sugestão do tamanho do teste não entra nos campos; os campos mostram o valor ilustrativo do motor
    await ev(pg, "abrirFase('piloto','20')")
    await pg.locator('[data-fm="testes"][value="piloto"]').click(); await pg.wait_for_timeout(250)
    await ev(pg, "abrirFase('piloto','2c')", 250)
    ok(await pg.locator('#q-2-3-1 input:checked').count() == 0 and await pg.locator('#sug-nFerramentas [data-act="aceitar"]').count() == 1, '2.3.1: "Uma" sugerida, não marcada')
    il = await ev(pg, """(() => { const i = document.getElementById('pl-participantes'); return { v: i.value, ph: i.placeholder, esp: fmtEntrada(valorIlustrativo('piloto.participantes'), 0),
      motor: cfgAtual().v11.E0, nota: (document.getElementById(i.getAttribute('aria-describedby')) || {}).textContent || '' }; })()""", 0)
    ok(il['v'] == '' and il['ph'] == il['esp'] and il['ph'] != '' and 'Valor ilustrativo, usado até você informar' in il['nota'], f'2.3.8: campo vazio mostra o valor ilustrativo do motor, marcado ({il})')
    ok(await ev(pg, "lerNumero(document.getElementById('pl-participantes').placeholder) === cfgAtual().v11.E0", 0), 'o valor ilustrativo é o que o motor usa (cfg.v11.E0)')
    ok(await pg.locator('#q-2-3-8 .custo-tag').count() == 1 and await pg.locator('#q-2-3-2 .custo-tag').count() == 1, '"Afeta o custo" nas perguntas de custo')
    # digitar substitui o ilustrativo; o custo mostrado segue numerosCusto()
    await pg.locator('#pl-participantes').click(); await pg.keyboard.type('300'); await pg.keyboard.press('Tab'); await pg.wait_for_timeout(300)
    ok(await ev(pg, "S.caso.piloto.participantes === 300 && !!S.respC['piloto.participantes']"), 'participantes digitados gravados')
    ok(await ev(pg, "document.querySelector('#cm-tco').textContent.trim() === grande(numerosCusto().total)"), 'custo mostrado = numerosCusto()')
    # validação em linha
    await pg.locator('#pl-meses').click(); await pg.keyboard.type('0'); await pg.keyboard.press('Tab'); await pg.wait_for_timeout(250)
    ok(await ev(pg, "(document.getElementById('err-pl-meses')||{}).textContent === 'O número precisa ser maior que zero.' && document.getElementById('pl-meses').getAttribute('aria-invalid') === 'true'"), 'validação em linha diz como corrigir')
    await pg.locator('#pl-meses').fill('4'); await pg.locator('#pl-meses').press('Tab'); await pg.wait_for_timeout(250)
    ok(await pg.locator('#err-pl-meses').count() == 0, 'a mensagem some quando o número é corrigido')
    # 2.5.4 horas: a estimativa é uma sugestão de um clique
    await ev(pg, "abrirFase('piloto','2e')", 200)
    ok(await ev(pg, "document.getElementById('f-formacaoHoras').value === '' && !qOk(CAMPO_POR_ID.formacaoHoras)"), '2.5.4 começa vazia')
    await pg.click('#q-2-5-4 [data-act="aceitar"]'); await pg.wait_for_timeout(250)
    ok(await ev(pg, "qOk(CAMPO_POR_ID.formacaoHoras) && +document.getElementById('f-formacaoHoras').value > 0"), '2.5.4 aceita a estimativa com um clique')
    # Enter avança; a contagem acompanha; escolha curta como fichas
    await ev(pg, "abrirFase('contexto','1a')", 200)
    f0 = await ev(pg, "document.getElementById('falta-passo').textContent", 0)
    await pg.locator('#f-local').click(); await pg.keyboard.type('Rede Teste'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(350)
    ok(await ev(pg, "S.ctx.local") == 'Rede Teste' and await ev(pg, "!!document.activeElement.closest('#q-1-1-3')"), f'Enter grava e leva à pergunta seguinte ({await ev(pg, "(document.activeElement.closest(\'.q\')||{}).id", 0)})')
    f1 = await ev(pg, "document.getElementById('falta-passo').textContent", 0)
    ok(f0 != f1 and 'Faltam' in f1, f'"Faltam N perguntas neste passo" acompanha ({f0} → {f1})')
    await ev(pg, "abrirFase('piloto','2f')", 200)
    ok(await pg.locator('#q-2-6-1 .opts.curtas').count() == 1, 'escolha curta (2.6.1) em fichas grandes')
    for q, v in [('suporteQuem', 'rede'), ('suporteNivel', 'basico')]:
        await pg.locator(f'[data-f="{q}"][value="{v}"]').click(); await pg.wait_for_timeout(200)
    await pg.locator('[data-f="acompanhamento"][value="leve"]').click(); await pg.wait_for_timeout(400)
    ok(await ev(pg, "document.activeElement.classList.contains('nav-seg')"), 'depois da última resposta do passo, o foco vai para o próximo passo')
    ok(not erros, f'sem erros no console ({erros[:3]})')
    await ctx.close()

async def explicacoes(b):
    ctx, pg, erros = await abrir(b, 1366, 900, 'pt')
    await ev(pg, TODAS, 300)
    for lang in ['pt', 'en', 'es', 'fr']:
        await pg.select_option('#sel-lang', lang); await pg.wait_for_timeout(250)
        await ev(pg, TODAS, 300)
        sem, vazias, campos = [], [], set()
        for fid, pid in await ev(pg, PASSOS, 0):
            await ev(pg, f"abrirFase('{fid}','{pid}')", 80)
            r = await ev(pg, """[...document.querySelectorAll('#main .passo .q[data-campo]')].map(q => { const id = q.dataset.campo, b = q.querySelector(':scope > .q-cab > .ib[data-ex="q:' + id + '"]'),
              p = b && document.getElementById(b.getAttribute('aria-controls')); return [id, !!b, p ? p.textContent.replace(/\\s+/g, ' ').replace(/(Fechar|Close|Cerrar|Fermer)\\s*:.*$/, '').trim() : ''] })""", 0)
            for id, tem, txt in r:
                campos.add(id)
                if not tem: sem.append(id)
                elif len(txt) < 20: vazias.append(id)
        todos = set(await ev(pg, "CAMPOS.map(f => f.id)", 0))
        ok(todos <= campos, f'{lang}: todas as perguntas de CAMPOS apareceram ({sorted(todos - campos)})')
        ok(not sem, f'{lang}: toda pergunta tem ⓘ ({sem[:5]})')
        ok(not vazias, f'{lang}: toda explicação tem texto ({vazias[:5]})')
        if lang != 'pt':
            falt = await ev(pg, f"explicaTextos().concat(EX_UI.filter(t => !['Sobre esta etapa','escolas','estimativa ilustrativa','a','Fechar','Prioridade alta','Prioridade média','Ir à pergunta','pessoas','meses'].includes(t))).filter(t => !(I18N['{lang}'] || {{}})[t])", 0)
            ok(not falt, f'{lang}: textos novos traduzidos ({len(falt)} sem tradução: {falt[:2]})')
            await ev(pg, "abrirFase('piloto','2c')", 200)
            t = await ev(pg, "[...document.querySelectorAll('#main .ex-pop')].map(p => p.textContent).join(' ')", 0)
            ok(not PT.search(t), f'{lang}: explicações do 2.3 sem restos de português ({PT.findall(t)[:4]})')
    await pg.select_option('#sel-lang', 'pt'); await pg.wait_for_timeout(200)
    ok(await ev(pg, "CAMPOS.every(f => corpoExCampo(f, { ex: f.ex }).replace(/<[^>]+>/g, '').trim().length > 20)", 0), 'corpoExCampo não vazio para toda pergunta de CAMPOS')
    ok(await ev(pg, "Object.keys(PASSO_AJUDA).length === 15 && FASES.flatMap(f => PASSOS[f.id]).every(p => !!PASSO_AJUDA[p[0]])", 0), 'os 15 passos têm explicação (PASSO_AJUDA)')

    # teclado: Enter abre, Esc fecha e devolve o foco, Espaço reabre, "Fechar" fecha
    await ev(pg, "abrirFase('piloto','2c')", 200)
    b = '#ib-q-tipoTec'
    await pg.focus(b); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(150)
    ok(await ev(pg, f"document.querySelector('{b}').getAttribute('aria-expanded') === 'true' && !document.getElementById('ex-q-tipoTec').hidden"), 'Enter abre a explicação (aria-expanded=true)')
    await pg.keyboard.press('Escape'); await pg.wait_for_timeout(150)
    ok(await ev(pg, f"document.getElementById('ex-q-tipoTec').hidden && document.activeElement === document.querySelector('{b}') && document.querySelector('{b}').getAttribute('aria-expanded') === 'false'"), 'Esc fecha e devolve o foco ao botão')
    await pg.keyboard.press('Space'); await pg.wait_for_timeout(150)
    ok(await ev(pg, "!document.getElementById('ex-q-tipoTec').hidden"), 'Espaço abre de novo')
    await pg.click('#ex-q-tipoTec [data-ex-fechar]'); await pg.wait_for_timeout(150)
    ok(await ev(pg, f"document.getElementById('ex-q-tipoTec').hidden && document.activeElement === document.querySelector('{b}')"), '"Fechar" fecha e devolve o foco')
    await pg.click('#ib-q-tipoTec'); await pg.click('#ib-q-pagamento'); await pg.wait_for_timeout(150)
    ok(await ev(pg, "document.getElementById('ex-q-tipoTec').hidden && !document.getElementById('ex-q-pagamento').hidden"), 'uma explicação aberta por vez')
    await pg.click('#ib-o-pagamento-consumo'); await pg.wait_for_timeout(150)
    ok(await ev(pg, "!document.getElementById('ex-o-pagamento-consumo').hidden && !S.caso.pagamento"), 'ⓘ de uma opção explica sem marcar a opção')
    # ⓘ do passo abre "Por que perguntamos?"
    await pg.click('#ib-p-2c'); await pg.wait_for_timeout(150)
    ok(await ev(pg, "document.getElementById('ajuda-2c').open && document.getElementById('ib-p-2c').getAttribute('aria-expanded') === 'true'"), 'ⓘ do passo abre a explicação do passo')
    # painel: ⓘ dos números e "Por que este valor?"
    await pg.wait_for_timeout(500)
    for k in ['tco', 'faixa', 'ano0', 'anual', 'fases', 'linha', 'fatores', 'porque', 'mud', 'ilus']:
        ok(await pg.locator(f'#painel #ib-c-{k}').count() == 1 and len((await ev(pg, f"document.getElementById('ex-c-{k}').textContent", 0)).strip()) > 20, f'painel: ⓘ de "{k}" com explicação')
    pq = await ev(pg, "[...document.querySelectorAll('#cm-porque li')].map(l => l.textContent.trim())", 0)
    ok(2 <= len(pq) <= 3 and 'fase' in pq[0], f'"Por que este valor?" com 2 ou 3 fatores em frases ({pq[:1]})')
    await pg.click('#tab-plano'); await pg.wait_for_timeout(200)
    ok(await pg.locator('#pn-plano .ag-l li').count() >= 1 and await pg.locator('#pn-plano #ib-c-agora').count() == 1, 'aba Plano: "O que fazer agora" com ações e ⓘ')
    alta = await ev(pg, "[...document.querySelectorAll('#pn-plano .ag-i')].map(l => l.classList.contains('alta'))", 0)
    ok(alta == sorted(alta, reverse=True), f'ações por prioridade (alta antes de média) {alta}')
    # plano: ⓘ nas seções e "O que fazer agora" no fim
    await ev(pg, "carregarExemplo('A'); S.boasVindas=false; abrirPlano()", 500)
    secs = await ev(pg, "[...document.querySelectorAll('#plano .ib[data-ex^=\"s:\"]')].map(b => b.dataset.ex.slice(2))", 0)
    ok(all(s in secs for s in ['sintese', 's1', 's2', 's3', 's4', 's5', 'anexos', 'anexo-a', 'anexo-i']), f'plano: ⓘ nas seções ({secs})')
    ok(await pg.locator('#plano-agora .ag-l li').count() >= 3, 'plano: "O que fazer agora" com as recomendações')
    ok(await ev(pg, "(() => { const a = document.getElementById('plano-agora'), x = document.getElementById('plano-anexos'); return !!(a.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_FOLLOWING); })()"), 'plano: "O que fazer agora" no fim do corpo, antes dos anexos')
    ok(not erros, f'sem erros no console ({erros[:3]})')
    await ctx.close()

async def aparencias(b):
    estilos = {}
    for w, h in [(1366, 900), (390, 844)]:
        ctx, pg, erros = await abrir(b, w, h, 'pt')
        await ev(pg, "carregarExemplo('A'); S.boasVindas=false; abrirFase('piloto','2c')", 400)
        ok(await ev(pg, "document.documentElement.dataset.aparencia", 0) == 'exp', f'{w}px: aparência padrão "Para leigos" (exp)')
        ok(await pg.locator('#sel-apar').count() == 1 and await ev(pg, "!!document.querySelector('label[for=sel-apar]') && document.querySelector('label[for=sel-apar]').textContent.includes('Aparência')", 0), f'{w}px: seletor "Aparência" rotulado no cabeçalho')
        for ap in ['pub', 'exe', 'exp']:
            await pg.select_option('#sel-apar', ap); await pg.wait_for_timeout(250)
            await ev(pg, "document.fonts.ready.then(() => 1)", 100)
            if w > 900: await pg.click('#ib-q-tipoTec'); await pg.wait_for_timeout(150)
            e = await ev(pg, """(() => { const g = (s, p) => { const el = document.querySelector(s); return el ? getComputedStyle(el)[p] : ''; };
              return { corpo: g('body', 'fontFamily'), h1: g('#passo-h', 'fontFamily'), cor: g('#passo-h', 'color'), fundo: g('body', 'backgroundColor'), btn: g('.nav-seg', 'borderRadius'),
                num: g('#cm-tco', 'color'), fonte: document.fonts.check('600 16px "' + (document.documentElement.dataset.aparencia === 'exe' ? 'UPT Inter' : 'UPT Noto Sans') + '"') }; })()""", 0)
            estilos[(w, ap)] = e
            ok(await ev(pg, SEM_ROLAGEM, 0), f'{w}px {ap}: sem rolagem horizontal no passo 2.3')
            await ev(pg, "abrirFase('expansao','4a')", 200)
            ok(await ev(pg, SEM_ROLAGEM, 0), f'{w}px {ap}: sem rolagem horizontal no passo 4.1')
            await ev(pg, "abrirPlano()", 400)
            ok(await ev(pg, SEM_ROLAGEM, 0), f'{w}px {ap}: sem rolagem horizontal no plano')
            await ev(pg, "abrirFase('piloto','2c')", 300)
        a, x, p = estilos[(w, 'pub')], estilos[(w, 'exe')], estilos[(w, 'exp')]
        ok('UPT Noto Sans' in a['corpo'] and 'UPT Inter' in x['corpo'] and 'UPT Noto Sans' in p['corpo'], f'{w}px: fontes do corpo por aparência ({a["corpo"][:20]} | {x["corpo"][:20]} | {p["corpo"][:20]})')
        ok('UPT Noto Serif' in p['h1'] and 'Serif' not in a['h1'] and 'Serif' not in x['h1'], f'{w}px: serifa só nos títulos do Kit 3')
        ok(len({a['cor'], x['cor'], p['cor']}) == 3 and len({a['fundo'], x['fundo']}) == 2 and len({a['btn'], x['btn'], p['btn']}) == 3, f'{w}px: cores e raios diferentes ({a["cor"]}, {x["cor"]}, {p["cor"]}; {a["btn"]}, {x["btn"]}, {p["btn"]})')
        ok(a['fonte'] and x['fonte'] and p['fonte'], f'{w}px: fontes embutidas carregadas (document.fonts)')
        if w > 900: ok(p['num'] == 'rgb(0, 105, 180)' and a['num'] == 'rgb(11, 12, 12)', f'número grande: azul no Kit 3, preto no Kit 1 ({p["num"]}, {a["num"]})')
        # persiste depois de recarregar
        await pg.select_option('#sel-apar', 'exe'); await pg.wait_for_timeout(150)
        await pg.reload(); await pg.wait_for_timeout(400)
        ok(await ev(pg, "document.documentElement.dataset.aparencia + '|' + document.getElementById('sel-apar').value", 0) == 'exe|exe', f'{w}px: a aparência escolhida persiste depois de recarregar')
        await pg.select_option('#sel-apar', 'exp'); await pg.wait_for_timeout(100)
        ok(not erros, f'{w}px: sem erros no console ({erros[:3]})')
        await ctx.close()
    # sem localStorage: a página funciona com a aparência padrão
    ctx = await b.new_context(viewport={'width': 1366, 'height': 900})
    pg = await ctx.new_page(); er = []; pg.on('pageerror', lambda e: er.append(str(e)))
    await pg.add_init_script("Object.defineProperty(window, 'localStorage', { get() { throw new Error('bloqueado'); } })")
    await pg.goto(f'file://{TMP}/nav.html'); await pg.wait_for_timeout(400)
    await pg.select_option('#sel-apar', 'pub'); await pg.wait_for_timeout(150)
    ok(await ev(pg, "document.documentElement.dataset.aparencia", 0) == 'pub' and not er, f'sem localStorage: aparência troca sem erro ({er[:2]})')
    await ctx.close()

async def ponta_a_ponta(b, w, h, lang):
    tag = f'{lang} {w}px'
    ctx, pg, erros = await abrir(b, w, h, lang)
    ok(await ev(pg, "document.documentElement.dir", 0) == ('rtl' if lang == 'ar' else 'ltr'), f'{tag}: direção')
    ok(await ev(pg, SEM_ROLAGEM, 0), f'{tag}: página inicial sem rolagem horizontal')
    await pg.click('#inicio [data-act="comecar"]'); await pg.wait_for_timeout(300)
    await pg.locator('#q-1-1-1 input[value="estado"] + span').click(); await pg.wait_for_timeout(200)
    await pg.locator('#q-1-1-4 input[data-etapa="fund2"] + span').click(); await pg.wait_for_timeout(200)
    for sel, v in [('#n-etapas-fund2-escolas', '300'), ('#n-etapas-fund2-anos-0', '20000')]:
        await pg.locator(sel).click(); await pg.keyboard.type(v); await pg.keyboard.press('Tab')
    await pg.wait_for_timeout(300)
    ok(await ev(pg, SEM_ROLAGEM, 0), f'{tag}: passo 1.1 sem rolagem horizontal')
    await pg.locator('#ib-q-nivel').click(); await pg.wait_for_timeout(150)
    ok(await ev(pg, "!document.getElementById('ex-q-nivel').hidden", 0) and await ev(pg, SEM_ROLAGEM, 0), f'{tag}: ⓘ aberto sem rolagem horizontal')
    cel = w < 900
    mostrado = await ev(pg, "document.querySelector('.bc-v').textContent.trim()" if cel else "document.querySelector('#cm-tco').textContent.trim()", 0)
    ok(mostrado == await ev(pg, "grande(numerosCusto().total)", 0), f'{tag}: custo mostrado = numerosCusto() ({mostrado})')
    await ev(pg, "abrirFase('piloto','2c')", 300)
    ok(await ev(pg, SEM_ROLAGEM, 0), f'{tag}: passo 2.3 sem rolagem horizontal')
    if cel:
        await pg.click('#barra-cel .bc-custo'); await pg.wait_for_timeout(300)
        await pg.wait_for_timeout(500)
        ok(await pg.locator('#painel #cm-porque').count() == 1 and await ev(pg, SEM_ROLAGEM, 0), f'{tag}: folha de custo com "Por que este valor?", sem rolagem horizontal')
        await pg.click('#painel .pn-fechar'); await pg.wait_for_timeout(200)
    await ev(pg, "gerarPlano()", 500)
    ok(await ev(pg, SEM_ROLAGEM, 0), f'{tag}: plano sem rolagem horizontal')
    async with pg.expect_download() as dl:
        await pg.locator('[data-act="pdf"]:visible').first.click()
    d = await dl.value; arq = f'{TMP}/plano_{lang}_{w}.pdf'; await d.save_as(arq)
    ok(os.path.getsize(arq) > 20000 and d.suggested_filename.endswith('.pdf'), f'{tag}: PDF baixado ({os.path.getsize(arq)} bytes)')
    ok(not erros, f'{tag}: sem erros no console ({erros[:3]})')
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        await vazio_e_sugestoes(b)
        await explicacoes(b)
        await aparencias(b)
        for w, h in [(1366, 900), (390, 844)]:
            for lang in ['pt', 'ar']:
                await ponta_a_ponta(b, w, h, lang)
        await b.close()
    print(f'\n{len(falhas)} falha(s)')
    raise SystemExit(1 if falhas else 0)

asyncio.run(main())
