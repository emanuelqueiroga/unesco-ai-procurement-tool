# Teste do percurso da v9 (pacote P2): fases, passos, numeração, ✓, sugestões, mandala, ⓘ e estudantes por ano.
# v10 (R1): nada marcado no caso em branco, escolha do caso salvo nas boas-vindas, "Começar em branco" no painel,
# padrões gerados como "sugerido" (2.0 → 2.3.6, 2.3.1 → 2.3.2/2.3.3, 2.2.1 → 3.1.1), passo 3.4 e 3.3 recolhido.
# Uso: python3 tests/test_v9_fluxo.py   (depois de bash build.sh). Capturas em /tmp/claude-0/v9_fx_*.png
import asyncio, os, re, sys
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs('/tmp/claude-0', exist_ok=True)
SK = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>' + open(os.path.join(RAIZ, 'navegador.html')).read() + '</body></html>'
ARQ = '/tmp/claude-0/v9_fx.html'
open(ARQ, 'w').write(SK)
URL_TCO = 'https://unesdoc.unesco.org/ark:/48223/pf0000399348'
PASSOS = [('contexto', ['1a', '1b', '1c']), ('piloto', ['20', '2a', '2b', '2c']), ('custo', ['3a', '3b', '3c', '3d'])]
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

async def percorrer(pg, tag, w, erros, fotos, branco=False):
    """Abre todos os passos de todas as fases e confere numeração, elementos removidos e rolagem horizontal.
    Com branco=True, confere também que nenhuma opção vem marcada (v10, decisão A)."""
    nums = []
    for fase, ps in PASSOS:
        for pid in ps:
            await pg.evaluate(f"(()=>{{S.boasVindas=false;S.info={{}};abrirFase('{fase}','{pid}');}})()"); await pg.wait_for_timeout(80)
            await pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)"); await pg.wait_for_timeout(60)
            sw = await pg.evaluate('document.documentElement.scrollWidth')
            if sw > w + 1: erros.append(f'{tag} rolagem horizontal no passo {pid}: {sw}')
            for sel in PROIBIDOS:
                if await pg.locator(sel).count(): erros.append(f'{tag} elemento removido presente: {sel} ({pid})')
            if branco:
                mc = await pg.evaluate("[...document.querySelectorAll('#main input:checked, #main [aria-pressed=\"true\"]')].filter(e=>!e.closest('#custos-box')).map(e=>(e.name||e.dataset.fm||e.dataset.resp||'')+'='+(e.value||e.dataset.v||''))")
                if mc: erros.append(f'{tag} caso em branco com opção marcada no passo {pid}: {mc}')
                sg = await pg.evaluate("[...document.querySelectorAll('#main .q.sug')].map(q=>q.dataset.campo)")
                if sg: erros.append(f'{tag} caso em branco com sugestão antes de qualquer resposta no passo {pid}: {sg}')
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
                nums = await percorrer(pg, tag + '-branco', w, erros, False, branco=True)
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
                # P1-3: mudar as tarefas depois de confirmar o 2.2 acrescenta as sugestões novas e pede revisão
                ok(not await pg.evaluate("faltasEstimativa().length===0") and await pg.locator('#painel .estim .linha').count() == 0, f'{tag} painel sem estimativa antes de 3.1.1')
                await pg.evaluate("abrirFase('piloto','2a')"); await pg.wait_for_timeout(100)
                await pg.locator('[data-fm="tarefas"][value="duvidas"]').click(); await pg.wait_for_timeout(200)
                us = await pg.evaluate("S.caso.usuarios")
                ok(all(u in us for u in ['estudantes', 'professores', 'administrativo', 'gestores']), f'{tag} tarefas novas acrescentam usuários sem retirar os confirmados {us}')
                ok(await pg.evaluate("!S.respC.usuarios && sugerido(CAMPO_POR_ID.usuarios)"), f'{tag} campo alterado volta a "sugerido pela tarefa"')
                ok(await pg.locator('#passo-2a .aviso.rev').count() == 1, f'{tag} aviso de revisão no 2.1')
                await pg.evaluate("abrirFase('piloto','2b')"); await pg.wait_for_timeout(150)
                av = await pg.evaluate("(document.querySelector('#aviso-rev b')||{}).textContent||''")
                ok(av == ('As tarefas mudaram. Revise estas respostas.' if lang == 'pt' else 'Your tasks changed. Review these answers.'), f'{tag} aviso no 2.2: "{av}"')
                ok(await pg.locator('#passo-2b [data-act="continuar-confirmar"]').count() == 1, f'{tag} rodapé do 2.2 volta a "Confirmar e continuar"')
                await pg.locator('#passo-2b [data-act="continuar-confirmar"]').click(); await pg.wait_for_timeout(200)
                ok(await pg.evaluate("qOk(CAMPO_POR_ID.usuarios) && !document.querySelector('.aviso.rev')"), f'{tag} confirmar de novo retira o aviso')
                await pg.evaluate("abrirFase('piloto','2a')"); await pg.wait_for_timeout(100)
                await pg.locator('[data-fm="tarefas"][value="duvidas"]').click(); await pg.wait_for_timeout(200)
                ok(await pg.evaluate("S.caso.usuarios.includes('administrativo') && !!S.respC.usuarios"), f'{tag} desmarcar uma tarefa não retira respostas confirmadas')
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
                ok(await pg.locator('#passo-3c .adapt').count() == 1 and await pg.locator('#passo-3c ul.prem-u li').count() >= 3, f'{tag} 3.3 com linha de adaptação e premissas unitárias')
                await pg.evaluate("(()=>{S.caso.elegiveis=5000; S.respC.elegiveis=true; S.caso.tipoTec='paga'; S.respC.tipoTec=true; S.custo.editado=false; render();})()"); await pg.wait_for_timeout(200)
                pe = await pg.evaluate("(document.querySelector('#painel .estim .premissa')||{}).textContent||''")
                ok(('5.000' in pe or '5,000' in pe) and await pg.locator('#painel .estim .linha').count() == 2, f'{tag} painel com estimativa e premissa de pessoas: "{pe}"')
                await pg.locator('#painel [data-act="gerar-plano"]').click(); await pg.wait_for_timeout(300)
                ok(await pg.evaluate("S.vista==='plano'") and await pg.locator('#plano').count() == 1, f'{tag} clique mostra #plano')
                await pg.screenshot(path=f'/tmp/claude-0/v9_fx_{tag}_plano.png')
                await pg.evaluate("(()=>{S.vista='';render();})()"); await pg.wait_for_timeout(100)
                ok(len(await pg.evaluate('faltasTodas()')) > 0, f'{tag} faltasTodas lista perguntas sem resposta no caso em branco')
                # ---- v10: passo 3.4 e 3.3 recolhido
                ok(await pg.evaluate("PASSOS.custo.map(p=>p[0]).join()==='3a,3b,3c,3d' && numPasso('3d')==='3.4'"), f'{tag} passo 3.4 na fase 3')
                ok(await pg.locator('#passo-3c details[data-numdet] .tw table').count() >= 2 and await pg.locator('#passo-3c details[data-numdet] ul.prem-u').count() == 1, f'{tag} 3.3: tabelas e premissas dentro de "Ver os números detalhados"')
                ok(await pg.locator('#passo-3c details[data-calc]').count() == 1, f'{tag} 3.3: calculadora completa no seu próprio <details>')
                ordem = await pg.evaluate("(()=>{const c=document.querySelector('#passo-3c .passo-corpo'); const k=c.querySelector('.kpis'), d=c.querySelector('details[data-numdet]'), f=c.querySelector('.formula-box'); return [!!(k&&d&&(k.compareDocumentPosition(d)&4)), !f || !!(f.compareDocumentPosition(k)&4), typeof renderFormula==='function', !!f];})()")
                ok(ordem[0] and ordem[1] and (ordem[2] == ordem[3]), f'{tag} 3.3: fórmula (se houver) antes dos indicadores, números detalhados depois {ordem}')
                ok(await pg.locator('#pe-3c [data-act="continuar"]').count() == 1 and await pg.locator('#pe-3c [data-act="gerar-plano"]').count() == 0, f'{tag} rodapé do 3.3 continua para 3.4')
                await pg.evaluate("abrirFase('custo','3d')"); await pg.wait_for_timeout(250)
                ok(await pg.evaluate("passoFeito('3d') && document.querySelector('[data-setor=\"3d\"]').classList.contains('m-ok')"), f'{tag} 3.4 concluído ao ser aberto (mandala)')
                ok(await pg.locator('#pe-3d [data-act="gerar-plano"]').count() == 1 and await pg.locator('#fpe-custo [data-act="gerar-plano"]').count() == 1, f'{tag} rodapés do 3.4 e da fase 3 com "Gerar plano de contratação"')
                ok(await pg.evaluate("document.querySelector('#passo-3d .passo-corpo').textContent.trim().length>20"), f'{tag} 3.4 com conteúdo')
                if lang == 'en' and w == 1400: await pg.screenshot(path=f'/tmp/claude-0/v10_fx_{tag}_3d.png', full_page=True)
                # ---- v10: padrões gerados como "sugerido"
                await pg.evaluate("carregarExemplo('novo')"); await pg.evaluate("(()=>{S.boasVindas=false; S.ctx.etapas={fund2:{on:true,escolas:600,soTotal:true,alunos:150000}}; abrirFase('piloto','2c');})()"); await pg.wait_for_timeout(200)
                ok(await pg.evaluate("S.caso.piloto.participantes==='' && S.caso.pagamento==='' && S.caso.licenca==='' && S.caso.elegiveis===''"), f'{tag} sem padrões antes de marcar as origens')
                ok(await pg.locator('#passo-2c input:checked').count() == 0 and await pg.locator('#passo-2c .q.sug').count() == 0, f'{tag} 2.3 sem opção marcada nem sugestão')
                # 2.0 → 2.3.6
                await pg.locator('[data-f="teste"][value="poc"]').click(); await pg.wait_for_timeout(200)
                ok(await pg.evaluate("JSON.stringify(S.caso.piloto)") == '{"escolas":"","participantes":15,"meses":2}', f'{tag} PoC sugere 15 pessoas e 2 meses, sem escolas')
                ok(await pg.locator('#q-2-3-6.sug .sug-tag').is_visible() and not await pg.evaluate("qOk(CAMPO_POR_ID.piloto)"), f'{tag} 2.3.6 "sugerido" e não conta como respondida')
                tagt = await pg.evaluate("document.querySelector('#q-2-3-6 .sug-tag').textContent")
                ok(tagt == ('sugerido pela resposta 2.0' if lang == 'pt' else 'suggested by answer 2.0'), f'{tag} etiqueta da 2.3.6: "{tagt}"')
                await pg.locator('[data-f="teste"][value="piloto"]').click(); await pg.wait_for_timeout(200)
                ok(await pg.evaluate("JSON.stringify(S.caso.piloto)") == '{"escolas":30,"participantes":7500,"meses":4}', f'{tag} piloto sugere 5% das escolas (máx. 30), 5% dos estudantes e 4 meses: {await pg.evaluate("JSON.stringify(S.caso.piloto)")}')
                await pg.locator('#pl-meses').fill('6'); await pg.locator('#pl-meses').press('Tab'); await pg.wait_for_timeout(150)
                await pg.locator('[data-f="teste"][value="poc"]').click(); await pg.wait_for_timeout(200)
                ok(await pg.evaluate("S.caso.piloto.meses===6 && S.caso.piloto.participantes===15"), f'{tag} mudar 2.0 recalcula só o que não foi confirmado (meses 6 mantido)')
                await pg.locator('[data-f="teste"][value="piloto"]').click(); await pg.wait_for_timeout(200)
                # 2.3.1 → 2.3.2 e 2.3.3
                await pg.locator('[data-f="tipoTec"][value="aberta"]').click(); await pg.wait_for_timeout(200)
                ok(await pg.evaluate("S.caso.pagamento==='consumo' && S.caso.licenca==='aberta' && sugerido(CAMPO_POR_ID.pagamento) && sugerido(CAMPO_POR_ID.licenca)"), f'{tag} aberta sugere "por consumo" e "licença aberta"')
                ok(await pg.locator('[data-f="pagamento"][value="consumo"]').is_checked() and await pg.locator('#q-2-3-2.sug .sug-tag').is_visible(), f'{tag} sugestão de pagamento marcada e com etiqueta')
                await pg.locator('[data-f="pagamento"][value="usuario"]').click(); await pg.wait_for_timeout(150)
                await pg.locator('[data-f="tipoTec"][value="paga"]').click(); await pg.wait_for_timeout(200)
                ok(await pg.evaluate("S.caso.pagamento==='usuario' && S.caso.licenca==='assinatura'"), f'{tag} paga muda só a licença não confirmada (pagamento escolhido mantido)')
                if lang == 'en': await pg.evaluate("irPara('q-2-3-1')"); await pg.wait_for_timeout(250); await pg.screenshot(path=f'/tmp/claude-0/v10_fx_{tag}_2c.png')
                await pg.locator('[data-f="tipoTec"][value="publica"]').click(); await pg.wait_for_timeout(200)
                ok(await pg.evaluate("S.caso.licenca==='termos' && S.caso.pagamento==='usuario'"), f'{tag} pública sugere termos de uso padrão')
                await pg.locator('#q-2-3-3 [value="termos"]').click(); await pg.wait_for_timeout(150)
                ok(await pg.evaluate("!!S.respC.licenca && !sugerido(CAMPO_POR_ID.licenca)"), f'{tag} clicar na opção sugerida confirma a sugestão')
                await pg.locator('[data-f="tipoTec"][value="nao_sei"]').click(); await pg.wait_for_timeout(200)
                ok(await pg.evaluate("S.caso.licenca==='termos' && S.caso.pagamento==='usuario'"), f'{tag} "Ainda não sei" não apaga respostas confirmadas')
                # rodapé: só sugestões pendentes → "Confirmar e continuar"
                await pg.evaluate("(()=>{S.caso.adaptacao='config'; S.caso.infra='sim'; S.respC.adaptacao=S.respC.infra=true; render();})()"); await pg.wait_for_timeout(150)
                ok(await pg.locator('#passo-2c [data-act="continuar-confirmar"]').count() == 1, f'{tag} 2.3 com sugestões pendentes oferece "Confirmar e continuar"')
                await pg.locator('#passo-2c [data-act="continuar-confirmar"]').click(); await pg.wait_for_timeout(250)
                ok(await pg.evaluate("passoFeito('2c') && !!S.respC['piloto.escolas'] && !!S.respC['piloto.participantes']"), f'{tag} confirmar aceita as sugestões do 2.3')
                # 2.2.1 → 3.1.1
                ok(await pg.evaluate("S.caso.elegiveis===''"), f'{tag} 3.1.1 vazio enquanto 2.2.1 não foi marcada')
                await pg.evaluate("abrirFase('piloto','2b')"); await pg.wait_for_timeout(150)
                await pg.locator('#passo-2b [data-fm="usuarios"][value="professores"]').click(); await pg.wait_for_timeout(200)
                ok(await pg.evaluate("S.caso.elegiveis===6000 && sugerido(CAMPO_POR_ID.elegiveis)"), f'{tag} só professores: 3.1.1 sugere 1 professor para cada 25 estudantes ({await pg.evaluate("S.caso.elegiveis")})')
                await pg.evaluate("abrirFase('custo','3a')"); await pg.wait_for_timeout(200)
                nota = await pg.evaluate("(document.querySelector('#q-3-1-1 .sug-nota')||{}).textContent||''")
                ok('25' in nota and ('ilustrativa' in nota or 'llustrative' in nota), f'{tag} 3.1.1: nota marca a estimativa como ilustrativa: "{nota[:80]}"')
                if lang == 'en': await pg.evaluate("irPara('q-3-1-1')"); await pg.wait_for_timeout(250); await pg.screenshot(path=f'/tmp/claude-0/v10_fx_{tag}_3a.png')
                await pg.evaluate("abrirFase('piloto','2b')"); await pg.wait_for_timeout(150)
                await pg.locator('#passo-2b [data-fm="usuarios"][value="estudantes"]').click(); await pg.wait_for_timeout(200)
                ok(await pg.evaluate("S.caso.elegiveis===150000 && sugerido(CAMPO_POR_ID.elegiveis) && !qOk(CAMPO_POR_ID.elegiveis)"), f'{tag} com estudantes: 3.1.1 sugere o total de estudantes')
                await pg.evaluate("abrirFase('custo','3a')"); await pg.wait_for_timeout(150)
                await pg.locator('#f-elegiveis').fill('90000'); await pg.locator('#f-elegiveis').press('Tab'); await pg.wait_for_timeout(150)
                await pg.evaluate("abrirFase('piloto','2b')"); await pg.wait_for_timeout(150)
                await pg.locator('#passo-2b [data-fm="usuarios"][value="estudantes"]').click(); await pg.wait_for_timeout(200)
                ok(await pg.evaluate("S.caso.elegiveis===90000 && qOk(CAMPO_POR_ID.elegiveis)"), f'{tag} 3.1.1 confirmado não é recalculado')
                # ---- v10: "Começar em branco" no painel, com confirmação inline
                ok(await pg.locator('#painel #btn-limpar').count() == 1, f'{tag} painel com "Começar em branco"')
                await pg.locator('#painel #btn-limpar').click(); await pg.wait_for_timeout(150)
                ok(await pg.locator('#conf-limpar').is_visible(), f'{tag} confirmação inline aparece')
                await pg.locator('#conf-limpar [data-act="limpar-nao"]').click(); await pg.wait_for_timeout(150)
                ok(await pg.evaluate("S.caso.elegiveis===90000") and await pg.locator('#conf-limpar').count() == 0, f'{tag} cancelar mantém as respostas')
                await pg.locator('#painel #btn-limpar').click(); await pg.wait_for_timeout(150)
                if lang == 'en': await pg.evaluate("document.getElementById('conf-limpar').scrollIntoView()"); await pg.wait_for_timeout(150); await pg.screenshot(path=f'/tmp/claude-0/v10_fx_{tag}_limpar.png')
                await pg.locator('#conf-limpar [data-act="limpar-ok"]').click(); await pg.wait_for_timeout(250)
                ok(await pg.evaluate("S.caso.elegiveis==='' && !temRespostas(S) && S.fase==='contexto'"), f'{tag} confirmar apaga e começa em branco')
                # ---- v10: caso salvo não abre sozinho
                await pg.evaluate("carregarExemplo('B')"); await pg.wait_for_timeout(150)
                await pg.reload(); await pg.wait_for_timeout(400)
                ok(await pg.evaluate("S.boasVindas===true && !!SALVO") and await pg.locator('#boas [data-act="continuar-salvo"]').count() == 1 and await pg.locator('#boas [data-act="comecar"]').count() == 1, f'{tag} caso salvo: boas-vindas oferecem continuar ou começar em branco')
                nome = await pg.evaluate("document.querySelector('#boas .salvo-caso').textContent")
                ok(('utor' in nome) and ('·' in nome) and ('Rede estadual' in nome or 'State school system' in nome), f'{tag} nome e lugar do caso salvo: "{nome}"')
                ok(await pg.locator('#painel .fatos').count() == 0 and await pg.locator('#stepper').count() == 0 and await pg.locator('#main .fase').count() == 0, f'{tag} caso salvo não aparece antes da escolha')
                if lang == 'en': await pg.screenshot(path=f'/tmp/claude-0/v10_fx_{tag}_salvo.png')
                await pg.locator('#boas [data-act="continuar-salvo"]').click(); await pg.wait_for_timeout(250)
                ok(await pg.evaluate("S.boasVindas===false && S.exemplo==='B' && !SALVO && S.caso.elegiveis===150000"), f'{tag} "Continuar o caso salvo" abre o caso')
                await pg.reload(); await pg.wait_for_timeout(400)
                await pg.locator('#boas [data-act="comecar"]').click(); await pg.wait_for_timeout(250)
                ok(await pg.evaluate("S.exemplo==='novo' && !temRespostas(S) && !SALVO && S.boasVindas===false"), f'{tag} "Começar em branco" descarta o caso salvo')
                await pg.reload(); await pg.wait_for_timeout(400)
                ok(await pg.locator('#boas [data-act="continuar-salvo"]').count() == 0, f'{tag} caso em branco salvo não pede escolha')
                # caso da v8 no localStorage: convertido, mas não abre sozinho
                v8 = open(os.path.join(RAIZ, 'tests', 'fixtures', 'localStorage_v8_branco_parcial.json')).read()
                await pg.evaluate("t => { localStorage.clear(); localStorage.setItem('navegador-ia-educacao-v4', t); }", v8); await pg.reload(); await pg.wait_for_timeout(400)
                ok(await pg.locator('#boas [data-act="continuar-salvo"]').count() == 1 and await pg.evaluate("SALVO && SALVO.migrou===true"), f'{tag} caso da v8 oferecido nas boas-vindas')
                await pg.locator('#boas [data-act="continuar-salvo"]').click(); await pg.wait_for_timeout(250)
                ok(await pg.evaluate("JSON.stringify(S.caso.piloto)") == '{"escolas":5,"participantes":300,"meses":3}', f'{tag} caso da v8: tamanho do piloto mantido (não vira sugestão)')
                await pg.evaluate("localStorage.clear()"); await pg.select_option('#sel-lang', lang); await pg.wait_for_timeout(150)
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
