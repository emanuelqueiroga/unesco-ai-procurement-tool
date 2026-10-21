# Equivalente, no documento vivo (proposta C da v15), do teste do percurso por passos (tests/obsoletos/test_v9_fluxo.py).
# O percurso por passos, o stepper, a mandala, o painel lateral, os rodapés "Confirmar e continuar" e as telas 4.2 e 4.3
# deixaram de existir de propósito: o documento os substitui. O que o teste antigo verificava e continua valendo
# é verificado aqui pelo documento (lacunas, popover e blocos de formulário):
#  - caso em branco: nada marcado, nenhuma sugestão, nenhum elemento removido, só 2.3.3, 2.4.2 e 4.1.5 ocultas;
#  - toda pergunta visível de CAMPOS aparece com o seu número (no popover da lacuna ou no bloco), sem repetição;
#  - 2.0 múltipla com "recomende" exclusiva; tarefas sugerem o 2.2 (não conta até confirmar; tarefas novas acrescentam
#    e devolvem o campo a "sugerido"); 1.1 completo pela interface, estudantes por ano e "só o total";
#  - sugestões geradas (2.0 → 2.3.8, 2.3.4 → 2.3.5 e 2.3.6, 2.4.3 → 2.4.4, 2.2.1 e 1.1 → 4.1.1 → 3.1.1, horas estimadas)
#    aparecem como valor ilustrativo no texto e só contam depois de confirmadas; clicar na opção sugerida confirma;
#  - lista de ferramentas (2.3.3) sem caixas de diálogo do navegador, com foco no lugar certo;
#  - "Começar em branco" (menu Caso) pede confirmação; caso salvo oferecido na página inicial; exemplos sem "sugerido";
#  - 1400 e 400 px sem rolagem horizontal, PT e EN (sem "network" em inglês), sem erros de console.
# Uso: python3 tests/test_v15_c_fluxo.py   (depois de bash build.sh). Capturas em /tmp/claude-0/v15_c_fluxo/
import asyncio, os, re, sys
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = '/tmp/claude-0/v15_c_fluxo'
os.makedirs(TMP, exist_ok=True)
SK = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + open(os.path.join(RAIZ, 'navegador.html')).read() + '</body></html>'
ARQ = TMP + '/nav.html'
open(ARQ, 'w').write(SK)
PROIBIDOS = ['.vpill', '.resultado', '.pds-fase', '[name=autonomia]', '[data-fm=dados]', '[data-fb=vulneraveis]', '[data-fb=idiomas]',
             '[name=verificabilidade]', '[name=contestacao]', '[data-fm=capacidade]', '[data-fm=classes]', '[name=arquiteturaManual]',
             '[name=pagaDepois]', '[name=fonte]', '[name=infra]', '[name=teste]', 'details.arq', '.alert.bloqueio', '.alert.atencao', '.nivel-card']
falhas = []
def ok(cond, msg):
    print(('ok   ' if cond else 'FALHA ') + msg)
    if not cond: falhas.append(msg)

async def ev(pg, js, t=120):
    r = await pg.evaluate(js); await pg.wait_for_timeout(t); return r

async def lac(pg, k):
    """Abre a lacuna k (fora do sumário) pelo clique."""
    await pg.locator(f'#dv-doc .dv-ed [data-lac="{k}"]').first.click(); await pg.wait_for_timeout(180)

async def confirmar(pg):
    await pg.click('#lac-pop [data-lp="ok"]'); await pg.wait_for_timeout(250)

async def esc(pg):
    await pg.keyboard.press('Escape'); await pg.wait_for_timeout(150)

async def branco(pg, etapas=False):
    js = "(()=>{carregarExemplo('novo'); S.boasVindas=false;" + (" S.ctx.etapas={fund2:{on:true,escolas:600,soTotal:true,alunos:150000}};" if etapas else '') + " render(); window.scrollTo(0,0);})()"
    await ev(pg, js, 250)

async def fluxo(pg, lang, w, tag, erros, dialogos):
    await pg.goto('file://' + ARQ); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
    await pg.select_option('#sel-lang', lang); await pg.wait_for_timeout(150)
    await pg.click('[data-act="comecar"]'); await pg.wait_for_timeout(300)
    ok(await ev(pg, "S.boasVindas===false && S.exemplo==='novo' && !!document.getElementById('dv-doc')"), f'{tag} caso em branco abre o documento')
    # ---- caso em branco
    r = await ev(pg, f"""(() => ({{ marcados: [...document.querySelectorAll('#plano input:checked, #plano [aria-pressed="true"]')].filter(e=>!e.closest('#custos-box')).length,
      sug: document.querySelectorAll('#plano .q.sug').length, resp: document.querySelectorAll('#dv-doc .dv-ed .lac-ok').length,
      proib: {PROIBIDOS!r}.filter(s => document.querySelector(s)), ocultas: CAMPOS.filter(f=>!visivel(f)).map(f=>f.n).join() }}))()""")
    ok(r['marcados'] == 0 and r['sug'] == 0, f'{tag} caso em branco: nada marcado e nenhuma sugestão ({r["marcados"]}, {r["sug"]})')
    ok(r['resp'] == 0, f'{tag} caso em branco: nenhuma lacuna como resposta dada ({r["resp"]})')
    ok(not r['proib'], f'{tag} elementos removidos ausentes {r["proib"]}')
    ok(r['ocultas'] == '2.3.3,2.4.2,4.1.5', f'{tag} só 2.3.3, 2.4.2 e 4.1.5 ficam ocultas (condicionais): {r["ocultas"]}')
    # ---- numeração: cada pergunta visível com o seu número, no popover ou no bloco
    nums = await ev(pg, """(() => { const out = []; CAMPOS.filter(visivel).forEach(f => { abrirCampo(f);
        const p = document.querySelector('#lac-pop .lp-n'), q = document.getElementById(idQ(f.n)), qn = q && q.querySelector('.qn');
        const n = p && DOC.pop && DOC.pop.f.id === f.id ? (p.textContent.match(/\\d\\.\\d(\\.\\d+)?/) || [''])[0] : qn ? qn.textContent.trim() : '';
        out.push([f.n, n]); }); fecharPop('cancelar'); return out; })()""", 300)
    ok(all(a == b for a, b in nums) and len(set(b for _, b in nums)) == len(nums), f'{tag} todas as perguntas visíveis aparecem com o número certo ({sum(a == b for a, b in nums)} de {len(nums)})')
    # ---- 2.0 múltipla com "recomende" exclusiva
    await lac(pg, 'testes')
    ok(await pg.locator('#lac-pop [data-fm=testes][type=checkbox]').count() == 3, f'{tag} 2.0 múltipla com três opções')
    await pg.locator('#lac-pop [data-fm="testes"][value="poc"]').click(); await pg.wait_for_timeout(120)
    await pg.locator('#lac-pop [data-fm="testes"][value="piloto"]').click(); await pg.wait_for_timeout(120)
    ok(await ev(pg, "JSON.stringify(S.caso.testes)==='[\"poc\",\"piloto\"]' && modoTeste()==='ambos' && casoAtual().teste==='ambos'"), f'{tag} 2.0: prova de conceito e piloto')
    await pg.locator('#lac-pop [data-fm="testes"][value="recomendar"]').click(); await pg.wait_for_timeout(120)
    ok(await ev(pg, "JSON.stringify(S.caso.testes)==='[\"recomendar\"]'") and not await pg.locator('#lac-pop [data-fm="testes"][value="poc"]').is_checked(), f'{tag} 2.0: "recomende" exclui as outras')
    await pg.locator('#lac-pop [data-fm="testes"][value="piloto"]').click(); await pg.wait_for_timeout(120)
    ok(await ev(pg, "JSON.stringify(S.caso.testes)==='[\"piloto\"]'"), f'{tag} 2.0: marcar piloto retira "recomende"')
    await pg.locator('#lac-pop [data-fm="testes"][value="piloto"]').click(); await pg.wait_for_timeout(120)
    ok(await ev(pg, "S.caso.testes.length===0 && !qOk(CAMPO_POR_ID.testes)"), f'{tag} 2.0: desmarcar tudo deixa sem resposta')
    await confirmar(pg)
    ok(await ev(pg, "!!DOC.pop && !document.getElementById('lp-erro').hidden"), f'{tag} Confirmar sem resposta mostra o erro e não fecha')
    await esc(pg)
    # ---- tarefas sugerem o 2.2
    await lac(pg, 'tarefas'); await pg.locator('#lac-pop [data-fm="tarefas"][value="tutoria"]').click(); await pg.wait_for_timeout(200); await confirmar(pg)
    ok(await ev(pg, "S.caso.usuarios.includes('estudantes') && sugerido(CAMPO_POR_ID.usuarios) && !qOk(CAMPO_POR_ID.usuarios)"), f'{tag} tutoria sugere estudantes em 2.2.1, sem contar como resposta')
    ok(await pg.locator('#plano-s1 [data-lac="usuarios"].lac-ilus').count() == 1, f'{tag} sugestão aparece como valor ilustrativo no texto')
    await lac(pg, 'usuarios')
    t = await pg.locator('#q-2-2-1.sug .sug-tag').text_content()
    ok(t == ('sugerido pela tarefa' if lang == 'pt' else 'suggested by the task'), f'{tag} etiqueta "{t}"')
    await confirmar(pg)
    ok(await ev(pg, "qOk(CAMPO_POR_ID.usuarios)") and await pg.locator('#plano-s1 [data-lac="usuarios"].lac-ok').count() == 1, f'{tag} Confirmar aceita a sugestão')
    await lac(pg, 'tarefas'); await pg.locator('#lac-pop [data-fm="tarefas"][value="duvidas"]').click(); await pg.wait_for_timeout(200); await confirmar(pg)
    us = await ev(pg, "S.caso.usuarios")
    ok(all(u in us for u in ['estudantes', 'professores', 'administrativo', 'gestores']), f'{tag} tarefas novas acrescentam usuários sem retirar os confirmados {us}')
    ok(await ev(pg, "!S.respC.usuarios && sugerido(CAMPO_POR_ID.usuarios)") and await pg.locator('#plano-s1 [data-lac="usuarios"].lac-ilus').count() == 1, f'{tag} campo alterado volta a ilustrativo ("sugerido pela tarefa")')
    # ---- 1.1 pela interface
    await lac(pg, 'nivel'); await pg.locator('#lac-pop [data-ctx="nivel"][value="estado"]').click(); await pg.wait_for_timeout(150); await confirmar(pg)
    await lac(pg, 'local'); await pg.keyboard.type('Rede X'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(250)
    await lac(pg, 'situacao'); await pg.locator('#lac-pop [data-f="situacao"][value="nova"]').click(); await pg.wait_for_timeout(150); await confirmar(pg)
    await lac(pg, 'etapas'); await pg.locator('#lac-pop [data-etapa="fund2"]').check(); await pg.wait_for_timeout(150); await confirmar(pg)
    ok(await pg.locator('[data-ctxn^="etapas.fund2.anos."]').count() == 4, f'{tag} fund2 mostra 4 campos por ano na grade')
    await pg.locator('#n-etapas-fund2-escolas').fill('600'); await pg.locator('#n-etapas-fund2-escolas').press('Tab')
    for i, v in enumerate(['40000', '38000', '37000', '35000']):
        loc = pg.locator(f'#n-etapas-fund2-anos-{i}'); await loc.fill(v); await loc.press('Tab')
    await pg.wait_for_timeout(250)
    ok(await ev(pg, "alunosEtapa('fund2')===150000 && totaisCtx().alunos===150000"), f'{tag} total da etapa = soma dos anos')
    ok(await ev(pg, "passoFeito('1a')"), f'{tag} perguntas do 1.1 respondidas pelo documento')
    ok(await ev(pg, "['nivel','local','situacao','etapas'].every(k=>document.querySelector('#plano-s1 [data-lac=\"'+k+'\"]').classList.contains('lac-ok'))"), f'{tag} lacunas do 1.1 como respostas dadas')
    await pg.locator('[data-sototal="fund2"]').click(); await pg.wait_for_timeout(150)
    ok(await ev(pg, "S.ctx.etapas.fund2.soTotal===true && !!document.querySelector('[data-ctxn=\"etapas.fund2.alunos\"]')"), f'{tag} "Informar só o total da etapa" alterna')
    await pg.locator('[data-sototal="fund2"]').click(); await pg.wait_for_timeout(150)
    # ---- 1.3
    await pg.locator('#bl-gov [data-resp="g-politica"][data-v="sim"]').click(); await pg.wait_for_timeout(150)
    ok(await ev(pg, "document.querySelector('#q-1-3-2').classList.contains('ok')"), f'{tag} 1.3.2 respondida no bloco de governança')
    ok(await pg.locator('#bl-gov .q').count() == 6 and await pg.locator('[data-resp="g-equipe"]').count() == 0, f'{tag} 1.3 com seis perguntas, sem g-equipe')
    if lang == 'en':
        ts = await ev(pg, "[...document.querySelectorAll('#bl-gov .q .qt')].map(e=>e.textContent)")
        ok(len(ts) == 6 and all(re.match(r'(Does your education system have|Do you have|Did you)', t) for t in ts), f'{tag} perguntas 1.3 em EN')
        ok(not re.search(r'(?i)\bnetworks?\b', await ev(pg, "document.body.innerText")), f'{tag} EN sem "network"')
    # ---- sugestões geradas
    await branco(pg)
    ok(await ev(pg, "S.caso.piloto.participantes==='' && S.caso.poc.participantes==='' && S.caso.pagamento==='' && S.caso.licenca==='' && S.caso.elegiveis===''"), f'{tag} nada gerado antes das respostas de origem')
    await lac(pg, 'testes'); await pg.locator('#lac-pop [data-fm="testes"][value="poc"]').click(); await pg.wait_for_timeout(150); await confirmar(pg)
    ok(await ev(pg, "JSON.stringify(S.caso.poc)") == '{"participantes":15,"meses":2}' and await ev(pg, "!qOk(CAMPO_POR_ID.piloto)"), f'{tag} PoC sugere 15 pessoas e 2 meses, sem contar como resposta')
    ok((await pg.locator('#plano-s1 [data-lac="poc:participantes"].lac-ilus').inner_text()).strip().endswith('15'), f'{tag} sugestão da PoC como valor ilustrativo no texto')
    ok(await pg.locator('#plano-s1 [data-lac="piloto:escolas"]').count() == 0, f'{tag} só PoC: sem a frase do piloto')
    await lac(pg, 'poc:participantes')
    tt = await pg.locator('#lac-pop .lp-t').inner_text()
    ok(len(tt) > 10, f'{tag} subcampo com a sua pergunta ("{tt}")')
    await confirmar(pg)
    ok(await ev(pg, "!!S.respC['poc.participantes'] && !S.respC['poc.meses']"), f'{tag} Confirmar aceita só o subcampo aberto')
    await branco(pg, etapas=True)
    await lac(pg, 'testes'); await pg.locator('#lac-pop [data-fm="testes"][value="poc"]').click(); await pg.locator('#lac-pop [data-fm="testes"][value="piloto"]').click(); await pg.wait_for_timeout(150); await confirmar(pg)
    ok(await ev(pg, "JSON.stringify(S.caso.piloto)") == '{"escolas":30,"participantes":7500,"meses":4}' and await ev(pg, "S.caso.poc.participantes===15"), f'{tag} PoC + piloto: as duas sugestões')
    # ferramentas
    await lac(pg, 'nFerramentas'); await pg.locator('#lac-pop [data-f="nFerramentas"][value="2"]').click(); await pg.wait_for_timeout(150); await confirmar(pg)
    ok(await pg.locator('#q-2-3-3').count() == 0, f'{tag} 2.3.3 oculta antes de "Você já sabe quais?"')
    await lac(pg, 'conheceFerramentas'); await pg.locator('#lac-pop [data-f="conheceFerramentas"][value="sim"]').click(); await pg.wait_for_timeout(200); await confirmar(pg)
    ok(await pg.locator('#q-2-3-3 fieldset.ferr').count() == 2, f'{tag} "Sim" abre a lista com 2 linhas (resposta 2.3.1)')
    await pg.locator('#fe-0-nome').fill('Tutor X'); await pg.locator('#fe-0-nome').press('Tab')
    await pg.locator('#fe-1-nome').fill('Gerador Y'); await pg.locator('#fe-1-nome').press('Tab'); await pg.wait_for_timeout(150)
    ok(await ev(pg, "qOk(CAMPO_POR_ID.ferramentas)"), f'{tag} 2.3.3 respondida com nomes nas linhas')
    await pg.locator('#ferr-add').click(); await pg.wait_for_timeout(200)
    ok(await pg.locator('#q-2-3-3 fieldset.ferr').count() == 3 and await ev(pg, "document.activeElement.id") == 'fe-2-nome', f'{tag} "Adicionar ferramenta" cria a linha e põe o foco no nome')
    await pg.locator('#ferr-2 [data-act="ferr-rm"]').click(); await pg.wait_for_timeout(200)
    ok(await pg.locator('#q-2-3-3 fieldset.ferr').count() == 2 and await ev(pg, "document.activeElement.id") == 'ferr-add', f'{tag} "Remover" retira a linha e devolve o foco')
    # tecnologia → pagamento e licença
    await lac(pg, 'tipoTec'); await pg.locator('#lac-pop [data-f="tipoTec"][value="aberta"]').click(); await pg.wait_for_timeout(150); await confirmar(pg)
    ok(await ev(pg, "S.caso.pagamento==='consumo' && S.caso.licenca==='aberta' && sugerido(CAMPO_POR_ID.pagamento) && sugerido(CAMPO_POR_ID.licenca) && S.caso.ferramentas[0].tipoTec==='aberta'"), f'{tag} aberta sugere "por consumo" e "licença aberta"')
    ok(await pg.locator('#plano-s1 [data-lac="pagamento"].lac-ilus').count() == 1, f'{tag} pagamento sugerido como valor ilustrativo')
    await lac(pg, 'licenca'); await pg.locator('#lac-pop [data-f="licenca"][value="aberta"]').click(); await pg.wait_for_timeout(200)
    ok(await ev(pg, "!!S.respC.licenca && !sugerido(CAMPO_POR_ID.licenca)"), f'{tag} clicar na opção sugerida confirma a sugestão')
    await confirmar(pg)
    # internet e dispositivos
    ok(await pg.locator('[data-lac="escolasInternet"]').count() == 0, f'{tag} 2.4.2 oculta sem "Parcialmente"')
    await lac(pg, 'internet'); await pg.locator('#lac-pop [data-f="internet"][value="parcial"]').click(); await pg.wait_for_timeout(150); await confirmar(pg)
    await lac(pg, 'escolasInternet'); await pg.keyboard.type('400'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(250)
    ok(await ev(pg, "S.caso.escolasInternet===400 && qOk(CAMPO_POR_ID.escolasInternet)"), f'{tag} "Parcialmente" mostra 2.4.2, que grava o número')
    await lac(pg, 'modeloDisp'); await pg.locator('#lac-pop [data-f="modeloDisp"][value="proprio"]').click(); await pg.wait_for_timeout(150); await confirmar(pg)
    ok(await ev(pg, "S.caso.dispExistem==='sim' && sugerido(CAMPO_POR_ID.dispExistem)"), f'{tag} dispositivos próprios sugerem "já existem: sim"')
    await lac(pg, 'modeloDisp'); await pg.locator('#lac-pop [data-f="modeloDisp"][value="compartilhado"]').click(); await pg.wait_for_timeout(150); await confirmar(pg)
    ok(await ev(pg, "S.caso.dispExistem===''"), f'{tag} mudar o modelo retira a sugestão não confirmada')
    # horas: "Usar valor ilustrativo" no lugar de "Usar uma estimativa"
    await lac(pg, 'formacaoHoras'); await pg.click('#lac-pop [data-lp="ilus"]'); await pg.wait_for_timeout(250)
    h = await ev(pg, "[S.caso.formacaoHoras, S.caso.formacaoEstimativa, sugerido(CAMPO_POR_ID.formacaoHoras), qOk(CAMPO_POR_ID.formacaoHoras)]")
    ok(h[0] > 0 and h[1] is True and h[2] is True and h[3] is False, f'{tag} "Usar valor ilustrativo" preenche as horas com a estimativa, como sugestão {h}')
    await lac(pg, 'formacaoHoras'); await pg.locator('#f-formacaoHoras').fill('12'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(250)
    ok(await ev(pg, "S.caso.formacaoHoras===12 && S.caso.formacaoEstimativa===false && qOk(CAMPO_POR_ID.formacaoHoras)"), f'{tag} horas digitadas deixam de ser estimativa')
    # 4.1.1 e 3.1.1
    ok(await ev(pg, "S.caso.elegiveis===''"), f'{tag} 4.1.1 vazio enquanto 2.2.1 não foi respondida')
    await lac(pg, 'usuarios'); await pg.locator('#lac-pop [data-fm="usuarios"][value="professores"]').click(); await pg.wait_for_timeout(150); await confirmar(pg)
    ok(await ev(pg, "S.caso.elegiveis===6000 && sugerido(CAMPO_POR_ID.elegiveis)"), f'{tag} só professores: 4.1.1 sugere 1 professor para cada 25 estudantes')
    ok(await ev(pg, "JSON.stringify(S.caso.implantacao)") == '{"escolas":200,"pessoas":2000}', f'{tag} 3.1.1 sugere 1/3 das pessoas de 4.1.1 e das escolas')
    await lac(pg, 'elegiveis')
    nota = await ev(pg, "(document.querySelector('#lac-pop .sug-nota')||{}).textContent||''")
    ok('25' in nota, f'{tag} 4.1.1: nota marca a estimativa ilustrativa ("{nota[:60]}")')
    await esc(pg)
    # arquitetura
    await lac(pg, 'arquitetura')
    ok(await pg.locator('#lac-pop [name=arquitetura]').count() == 4 and await pg.locator('#lac-pop [name=arquitetura]:checked').count() == 0, f'{tag} 3.2.1 com quatro opções e nada marcado')
    await pg.locator('#lac-pop [name=arquitetura][value="nao_sei"]').click(); await pg.wait_for_timeout(150); await confirmar(pg)
    ok(await ev(pg, "S.caso.arquitetura==='nao_sei' && qOk(CAMPO_POR_ID.arquitetura)"), f'{tag} "Ainda não sei" responde 3.2.1')
    ok(not dialogos, f'{tag} nenhuma caixa de diálogo do navegador: {dialogos}')
    # ---- rolagem horizontal por seção
    ruins = []
    for sid in ['sintese', 's1', 's2', 's3', 's4', 's5', 'anexos']:
        await ev(pg, f"document.getElementById('plano-{sid}').scrollIntoView()", 80)
        sw = await ev(pg, "document.documentElement.scrollWidth", 0)
        if sw > w + 1: ruins.append((sid, sw))
    ok(not ruins, f'{tag} sem rolagem horizontal em nenhuma seção {ruins}')
    await pg.screenshot(path=f'{TMP}/{tag}.png')
    # ---- caso salvo e exemplos
    await ev(pg, "(()=>{carregarExemplo('B'); S.boasVindas=false; render();})()", 200)
    await pg.reload(); await pg.wait_for_timeout(400)
    ok(await ev(pg, "S.boasVindas===true && !!SALVO") and await pg.locator('.salvo [data-act="continuar-salvo"]').count() == 1, f'{tag} caso salvo oferecido na página inicial')
    await pg.click('.salvo [data-act="continuar-salvo"]'); await pg.wait_for_timeout(300)
    ok(await ev(pg, "S.boasVindas===false && S.exemplo==='B' && !!document.getElementById('dv-doc')"), f'{tag} "Continuar o caso salvo" abre o documento')
    for ex in 'ACD':
        await ev(pg, f"(()=>{{carregarExemplo('{ex}'); S.boasVindas=false; render();}})()", 200)
        ok(await pg.locator('#plano .q.sug').count() == 0 and await pg.locator('#plano-s1 [data-lac="usuarios"].lac-ok').count() == 1, f'{tag} exemplo {ex}: experiência de uso sem "sugerido"')
    ok(not erros, f'{tag} sem erros de console' + ('' if not erros else ': ' + '; '.join(erros[:5])))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for lang, w, h in [('pt', 1400, 900), ('en', 1400, 900), ('pt', 400, 860)]:
            tag = f'{lang}-{w}'
            pg = await b.new_page(viewport={'width': w, 'height': h})
            erros, dialogos = [], []
            pg.on('dialog', lambda d, dl=dialogos: (dl.append(d.message), asyncio.ensure_future(d.dismiss())))
            pg.on('pageerror', lambda e, er=erros: er.append(f'pageerror: {e}'))
            pg.on('console', lambda m, er=erros: er.append(f'console: {m.text}') if m.type == 'error' and 'Failed to load resource' not in m.text else None)
            await fluxo(pg, lang, w, tag, erros, dialogos)
            await pg.close()
        await b.close()
    print('\n' + ('TUDO OK' if not falhas else f'{len(falhas)} FALHA(S)'))
    sys.exit(1 if falhas else 0)

asyncio.run(main())
