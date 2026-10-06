# Teste do percurso da v9 (pacote P2): fases, passos, numeração, ✓, sugestões, mandala, ⓘ e estudantes por ano.
# Uso: python3 tests/test_v9_fluxo.py   (depois de bash build.sh). Capturas em /tmp/claude-0/v9_fx_*.png
import asyncio, os, re, sys
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs('/tmp/claude-0', exist_ok=True)
SK = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>' + open(os.path.join(RAIZ, 'navegador.html')).read() + '</body></html>'
ARQ = '/tmp/claude-0/v9_fx.html'
open(ARQ, 'w').write(SK)
URL_TCO = 'https://unesdoc.unesco.org/ark:/48223/pf0000399348'
PASSOS = [('contexto', ['1a', '1b', '1c']), ('piloto', ['20', '2a', '2b', '2c']), ('custo', ['3a', '3b', '3c'])]
PROIBIDOS = ['.vpill', '.resultado', '.pds-fase', '[name=autonomia]', '[data-fm=dados]', '[data-fb=vulneraveis]', '[data-fb=idiomas]',
             '[name=verificabilidade]', '[name=contestacao]', '[data-fm=capacidade]', '[data-fm=classes]', '[name=arquitetura]',
             '.alert.bloqueio', '.alert.atencao', '.nivel-card', '#res-contexto', '#res-piloto', '#res-custo', '.tag.ess']
falhas = []
def ok(cond, msg):
    print(('ok   ' if cond else 'FALHA ') + msg)
    if not cond: falhas.append(msg)

async def abrir(pg, lang):
    await pg.goto('file://' + ARQ); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
    await pg.select_option('#sel-lang', lang); await pg.wait_for_timeout(150)

async def percorrer(pg, tag, w, erros, fotos):
    """Abre todos os passos de todas as fases e confere numeração, elementos removidos e rolagem horizontal."""
    nums = []
    for fase, ps in PASSOS:
        for pid in ps:
            await pg.evaluate(f"(()=>{{S.boasVindas=false;S.info={{}};abrirFase('{fase}','{pid}');}})()"); await pg.wait_for_timeout(80)
            await pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)"); await pg.wait_for_timeout(60)
            sw = await pg.evaluate('document.documentElement.scrollWidth')
            if sw > w + 1: erros.append(f'{tag} rolagem horizontal no passo {pid}: {sw}')
            for sel in PROIBIDOS:
                if await pg.locator(sel).count(): erros.append(f'{tag} elemento removido presente: {sel} ({pid})')
            qs = await pg.evaluate(f"[...document.querySelectorAll('#passo-{pid} .q')].filter(q=>!q.closest('#custos-box')).map(q=>[q.id,q.dataset.n,(q.querySelector('.qn')||{{}}).textContent||''])")
            for qid, n, qn in qs:
                if not re.fullmatch(r'\d\.\d(\.\d+)?', qn.strip()): erros.append(f'{tag} .q sem número válido: {qid} "{qn}"')
                if n != qn.strip(): erros.append(f'{tag} data-n difere de .qn: {qid}')
                nums.append(qn.strip())
            if fotos:
                await pg.evaluate(f"irPara('passo-{pid}')"); await pg.wait_for_timeout(200)
                await pg.screenshot(path=f'/tmp/claude-0/v9_fx_{tag}_{pid}.png')
    return nums

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for lang in ['pt', 'en']:
            for w, h, disp in [(1400, 900, 'd'), (400, 860, 'm')]:
                tag = f'{lang}-{disp}'
                pg = await b.new_page(viewport={'width': w, 'height': h})
                erros = []
                pg.on('pageerror', lambda e, t=tag: erros.append(f'{t} pageerror: {e}'))
                pg.on('console', lambda m, t=tag: erros.append(f'{t} console: {m.text}') if m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'fonts.g' not in m.text else None)
                await abrir(pg, lang)
                await pg.screenshot(path=f'/tmp/claude-0/v9_fx_{tag}_boas.png')
                # caso em branco
                await pg.click('[data-act="comecar"]'); await pg.wait_for_timeout(250)
                ok(await pg.evaluate("S.fase==='contexto' && S.passo==='1a' && S.exemplo==='novo'"), f'{tag} caso em branco abre 1.1')
                nums = await percorrer(pg, tag + '-branco', w, erros, False)
                todos = await pg.evaluate("CAMPOS.map(f=>f.n)")
                ok(sorted(nums) == sorted(todos), f'{tag} todas as perguntas de CAMPOS aparecem com número ({len(nums)} de {len(todos)})')
                ok(len(set(nums)) == len(nums), f'{tag} numeração única')
                # 2.0 é o primeiro item da fase 2
                await pg.evaluate("abrirFase('piloto','2a')"); await pg.wait_for_timeout(150)
                prim = await pg.evaluate("(()=>{const c=document.querySelector('#fase-piloto .fase-corpo'); const p=c.querySelector('.passo'); const q=c.querySelector('.q'); return [p&&p.id, q&&q.dataset.n];})()")
                ok(prim == ['passo-20', '2.0'], f'{tag} 2.0 é o primeiro item da fase 2 {prim}')
                ok(await pg.locator('[name=teste]').count() == 3, f'{tag} 2.0 com três opções')
                # tarefas pré-marcam a experiência de uso
                await pg.locator('[data-fm="tarefas"][value="tutoria"]').click(); await pg.wait_for_timeout(200)
                await pg.evaluate("abrirFase('piloto','2b')"); await pg.wait_for_timeout(150)
                est = pg.locator('#passo-2b [data-fm="usuarios"][value="estudantes"]')
                ok(await est.is_checked(), f'{tag} tutoria pré-marca estudantes em 2.2')
                ok(await pg.locator('#passo-2b .q.sug[data-campo="usuarios"] .sug-tag').is_visible(), f'{tag} etiqueta "sugerido pela tarefa" visível')
                ok(not await pg.evaluate("qOk(CAMPO_POR_ID.usuarios)"), f'{tag} sugestão não confirmada não conta como respondida')
                await pg.evaluate("abrirFase('piloto','2a')"); await pg.wait_for_timeout(100)
                await pg.locator('[data-fm="tarefas"][value="tutoria"]').click(); await pg.wait_for_timeout(200)
                ok(await pg.evaluate("(S.caso.usuarios||[]).length===0"), f'{tag} desmarcar a tarefa limpa as sugestões não confirmadas')
                await pg.locator('[data-fm="tarefas"][value="tutoria"]').click(); await pg.wait_for_timeout(200)
                await pg.evaluate("abrirFase('piloto','2b')"); await pg.wait_for_timeout(150)
                await pg.locator('#passo-2b [data-act="continuar-confirmar"]').click(); await pg.wait_for_timeout(200)
                ok(await pg.evaluate("qOk(CAMPO_POR_ID.usuarios) && S.passo==='2c'"), f'{tag} "Confirmar e continuar" confirma as sugestões e abre 2.3')
                # 1.1 completo pela interface → mandala verde no setor 1a; estudantes por ano
                await pg.evaluate("abrirFase('contexto','1a')"); await pg.wait_for_timeout(150)
                await pg.locator('[data-ctx="nivel"][value="estado"]').click(); await pg.wait_for_timeout(150)
                await pg.locator('#f-local').fill('Rede X'); await pg.wait_for_timeout(50)
                await pg.locator('[data-f="situacao"][value="nova"]').click(); await pg.wait_for_timeout(150)
                await pg.locator('[data-etapa="fund2"]').click(); await pg.wait_for_timeout(150)
                anos = await pg.locator('[data-ctxn^="etapas.fund2.anos."]').count()
                ok(anos == 4, f'{tag} marcar fund2 mostra 4 campos por ano ({anos})')
                ok(await pg.locator('[data-porano]').count() == 0, f'{tag} sem checkbox "detalhar por ano"')
                await pg.locator('#n-etapas-fund2-escolas').fill('600'); await pg.locator('#n-etapas-fund2-escolas').press('Tab')
                for i, v in enumerate(['40000', '38000', '37000', '35000']):
                    loc = pg.locator(f'#n-etapas-fund2-anos-{i}'); await loc.fill(v); await loc.press('Tab')
                await pg.wait_for_timeout(200)
                ok(await pg.evaluate("alunosEtapa('fund2')===150000 && totaisCtx().alunos===150000"), f'{tag} total da etapa = soma dos anos')
                ok(await pg.evaluate("passoFeito('1a')"), f'{tag} passo 1.1 completo')
                ok(await pg.evaluate("document.querySelector('[data-setor=\"1a\"]').classList.contains('m-ok')"), f'{tag} mandala: setor 1a com m-ok')
                ok(await pg.evaluate("document.querySelector('#passo-1a .pn').textContent.includes('✓')"), f'{tag} número do passo vira ✓')
                ok(await pg.evaluate("document.querySelector('#q-1-1-2').classList.contains('ok')"), f'{tag} pergunta 1.1.2 marcada como respondida')
                await pg.locator('[data-sototal="fund2"]').click(); await pg.wait_for_timeout(150)
                ok(await pg.evaluate("S.ctx.etapas.fund2.soTotal===true && !!document.querySelector('[data-ctxn=\"etapas.fund2.alunos\"]')"), f'{tag} "Informar só o total da etapa" alterna')
                await pg.locator('[data-sototal="fund2"]').click(); await pg.wait_for_timeout(150)
                ok(await pg.evaluate("S.ctx.etapas.fund2.soTotal===false"), f'{tag} "Detalhar por ano ou série" volta')
                # nenhuma cor de alerta (--crit) na mandala
                crit = await pg.evaluate("""(()=>{const d=document.createElement('div'); d.style.color='var(--crit)'; document.body.appendChild(d); const c=getComputedStyle(d).color; d.remove();
                  return [...document.querySelectorAll('.mandala *')].filter(e=>{const s=getComputedStyle(e); return s.fill===c||s.stroke===c;}).length;})()""")
                ok(crit == 0, f'{tag} mandala sem cor --crit')
                # ⓘ do 1.3
                await pg.evaluate("abrirFase('contexto','1c')"); await pg.wait_for_timeout(150)
                await pg.locator('#passo-1c button.info').click(); await pg.wait_for_timeout(150)
                href = await pg.evaluate("(document.querySelector('#nota-p-1c a')||{}).href||''")
                ok(href == URL_TCO, f'{tag} ⓘ do 1.3 abre nota com link para a UNESDOC')
                ok(await pg.evaluate("!!document.querySelector('#nota-p-1c cite[data-notr]')"), f'{tag} título do documento em <cite data-notr>')
                await pg.locator('#passo-1c button.info').click(); await pg.wait_for_timeout(150)
                ok(await pg.locator('#nota-p-1c').count() == 0, f'{tag} novo clique fecha a nota')
                await pg.locator('#passo-1c [data-resp="g-politica"][data-v="sim"]').click(); await pg.wait_for_timeout(100)
                ok(await pg.evaluate("document.querySelector('#q-1-3-2').classList.contains('ok') && document.querySelector('[data-resp=\"g-politica\"][data-v=\"sim\"]').getAttribute('aria-pressed')==='true'"), f'{tag} segmentado marca ✓ na pergunta')
                if lang == 'en':
                    ts = await pg.evaluate("[...document.querySelectorAll('#passo-1c .q .qt')].map(e=>e.textContent)")
                    ok(len(ts) == 6 and all(re.match(r'(Does your network have|Do you have|Did you)', t) for t in ts), f'{tag} perguntas 1.3 em EN no formato "Does your network have / Do you have / Did you"')
                    exs = await pg.evaluate("[...document.querySelectorAll('#passo-1c .q .hint.ex')].map(e=>e.textContent)")
                    ok(len(exs) == 6 and all(t.startswith('Example:') for t in exs), f'{tag} toda pergunta 1.3 tem "Example:"')
                    ok(await pg.evaluate("document.querySelector('#q-1-3-2 .qt').textContent") == 'Do you have an AI in education policy or strategy?', f'{tag} g-politica em EN')
                ok(await pg.locator('#passo-1c .q').count() == 6 and await pg.locator('[data-resp="g-equipe"]').count() == 0, f'{tag} 1.3 com seis perguntas, sem g-equipe')
                # domínio: lema em <b>
                await pg.evaluate("abrirFase('contexto','1b')"); await pg.wait_for_timeout(150)
                lema = await pg.evaluate("document.querySelector('.dom .dom-t b').textContent")
                ok(lema == ('Aprender a conhecer e a fazer' if lang == 'pt' else 'Learning to know and to do'), f'{tag} cartão de domínio com o lema em <b> ({lema})')
                # botão gerar plano em painel, stepper, rodapé da fase 3 e chamada final
                await pg.evaluate("abrirFase('custo','3c')"); await pg.wait_for_timeout(300)
                n = await pg.evaluate("['#painel','#stepper','#fpe-custo','#fase-final'].filter(s=>document.querySelector(s+' [data-act=\"gerar-plano\"]')).length")
                ok(n == 4, f'{tag} "Gerar plano de contratação" nos quatro lugares ({n})')
                ok(await pg.evaluate("passoFeito('3c')"), f'{tag} 3.3 concluído ao ser aberto')
                ok(await pg.locator('#passo-3c .tw table').count() >= 2, f'{tag} 3.3 com tabelas de camadas e de dotação')
                await pg.locator('#painel [data-act="gerar-plano"]').click(); await pg.wait_for_timeout(300)
                ok(await pg.evaluate("S.vista==='plano'") and await pg.locator('#plano').count() == 1, f'{tag} clique mostra #plano')
                await pg.screenshot(path=f'/tmp/claude-0/v9_fx_{tag}_plano.png')
                await pg.evaluate("(()=>{S.vista='';render();})()"); await pg.wait_for_timeout(100)
                ok(len(await pg.evaluate('faltasTodas()')) > 0, f'{tag} faltasTodas lista perguntas sem resposta no caso em branco')
                # exemplos preenchidos: todos os passos, capturas
                for ex in ['A', 'B', 'C', 'D']:
                    await pg.evaluate(f"carregarExemplo('{ex}')"); await pg.wait_for_timeout(150)
                    await percorrer(pg, f'{tag}-{ex}', w, erros, ex == 'B')
                    await pg.evaluate("abrirFase('piloto','2b')"); await pg.wait_for_timeout(100)
                    ok(await pg.locator('.q.sug').count() == 0, f'{tag} exemplo {ex}: experiência de uso sem "sugerido"')
                await pg.evaluate("carregarExemplo('B')"); await pg.evaluate("abrirFase('piloto','2a')"); await pg.wait_for_timeout(200)
                await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(100)
                await pg.screenshot(path=f'/tmp/claude-0/v9_fx_{tag}_painel.png', full_page=True)
                ok(not erros, f'{tag} sem erros de console nem rolagem horizontal' + ('' if not erros else ': ' + '; '.join(erros[:6])))
                await pg.close()
        await b.close()
    print('\n' + ('TUDO OK' if not falhas else f'{len(falhas)} FALHA(S)'))
    sys.exit(1 if falhas else 0)

asyncio.run(main())
