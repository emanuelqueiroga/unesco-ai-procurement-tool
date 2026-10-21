# Teste do percurso da v13 (pacote B1): passo 1.2 com prioridades e problemas (marcar todos, subcategorias, "Outro"),
# sugestões que nascem dos problemas (1.2.3–1.2.6 e 2.1.1) com lacunas "__", detalhe de "Sim" e "Em parte" (1.2.7 e
# 1.3.x), camada 2 enxuta no teste (2.2 e 2.3 → 3.1), sugestão do 2.3.1, migração v12 → v13 e exportação formato 13,
# exemplos A–D, 400 px e EN sem restos de português nas telas novas.
# Uso: bash build.sh && python3 tests/test_v13_fluxo.py   (capturas em /tmp/claude-0/v13_b1/)
import asyncio, json, os, re, sys
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = '/tmp/claude-0/v13_b1'
os.makedirs(TMP, exist_ok=True)
SK = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>' + open(os.path.join(RAIZ, 'navegador.html')).read() + '</body></html>'
ARQ = TMP + '/v13_fx.html'
open(ARQ, 'w').write(SK)
# restos de português (regex de test_idiomas.py, mais palavras das telas novas)
PT = re.compile(r'ção|ções|ã|õ|\b(?:não|você|para o|do caso|também|custo|orçament|decisão)\b', re.I)
PT13 = re.compile(r'\b(?:Marcar|Desmarcar|marcados|Subcategorias|Objetivo|Outro problema|passo|rede|perguntas|sugerido|lacunas|falta|Qual|Quais|camada|implanta)', re.I)

falhas = []
def ok(cond, msg):
    print(('ok   ' if cond else 'FALHA ') + msg)
    if not cond: falhas.append(msg)

async def abrir(pg, lang='pt'):
    await pg.goto('file://' + ARQ); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
    await pg.select_option('#sel-lang', lang); await pg.wait_for_timeout(150)

async def branco(pg):
    await pg.evaluate("(()=>{carregarExemplo('novo'); S.boasVindas=false; abrirFase('contexto','1b');})()"); await pg.wait_for_timeout(200)

async def ev(pg, js, t=150):
    r = await pg.evaluate(js); await pg.wait_for_timeout(t); return r

N_CAMADA2 = "(()=>{S.caso.conheceFerramentas='sim'; S.respC.conheceFerramentas=true; const ps=['2a','2b','2c']; return ps.reduce((n,p)=>n+camposPasso(p).length,0);})()"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1360, 'height': 900})
        erros = []; dialogos = []
        pg.on('dialog', lambda d: (dialogos.append(d.message), asyncio.ensure_future(d.dismiss())))
        pg.on('pageerror', lambda e: erros.append(f'pageerror: {e}'))
        pg.on('console', lambda m: erros.append(f'console: {m.text}') if m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'fonts.g' not in m.text else None)
        await abrir(pg)
        await pg.click('[data-act="comecar"]'); await pg.wait_for_timeout(250)
        await branco(pg)

        # ---------------------------------------------------------- 1.2.1 prioridades
        ok(await ev(pg, "nomePasso('1b')") == 'Prioridade e impacto' and (await ev(pg, "FASES[0].sub")).startswith('Onde e para quem, prioridade e impacto'), 'passo 1.2 "Prioridade e impacto" e subtítulo da fase 1')
        ok(await ev(pg, "typeof DOMINIOS==='undefined' && !CAMPOS.some(f=>['dom','comps'].includes(f.tipo))"), 'DOMINIOS e os tipos dom/comps saíram')
        ok(await pg.locator('#q-1-2-1 .pri [data-prior]').count() == 4 and await pg.locator('#q-1-2-1 input:checked').count() == 0, '1.2.1: quatro cartões, nada marcado')
        ok(await pg.locator('#q-1-2-1 .qt').text_content() == 'Qual é a prioridade da sua rede para a IA na educação?', '1.2.1: texto da pergunta')
        ok(await pg.locator('#q-1-2-2 .vazio-g').count() == 1, '1.2.2: dica para marcar antes uma prioridade')
        ok(not await ev(pg, "qOk(CAMPO_POR_ID.prioridades) || qOk(CAMPO_POR_ID.problemas)"), '1.2.1 e 1.2.2 sem resposta no caso em branco')
        await pg.click('#pr-com'); await pg.wait_for_timeout(200)
        ok(await ev(pg, "JSON.stringify(S.ctx.prioridades)") == '["com"]' and await ev(pg, "qOk(CAMPO_POR_ID.prioridades)"), 'marcar "Educar com a IA" responde 1.2.1')
        ok(await pg.locator('#q-1-2-2 .prob-grupo').count() == 1 and await pg.locator('#q-1-2-2 [data-prob]').count() == 10, '1.2.2: um grupo com 10 problemas')
        ok((await pg.locator('#q-1-2-2 .pg-n').text_content()).strip() == '0 de 10 marcados', 'contador "0 de 10 marcados"')
        ok(await pg.locator('#q-1-2-2 .prob-obj').count() == 10, 'cada problema mostra o objetivo')
        # ⓘ da prioridade: abre e fecha sem mudar a seleção, pelo teclado, com aria-expanded
        await pg.focus('#bi-pr-com'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(200)
        n_ex = await ev(pg, "PRIORIDADES.find(p=>p.id==='com').ex.length")
        ok(await pg.locator('#nota-pr-com li').count() == n_ex and await pg.get_attribute('#bi-pr-com', 'aria-expanded') == 'true', f'ⓘ abre os {n_ex} exemplos (aria-expanded)')
        ok(await ev(pg, "document.activeElement.id") == 'bi-pr-com' and await pg.locator('#pr-com').is_checked(), 'foco fica no ⓘ e a seleção não muda')
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(200)
        ok(await pg.locator('#nota-pr-com').count() == 0 and await pg.get_attribute('#bi-pr-com', 'aria-expanded') == 'false', 'ⓘ fecha de novo')
        await pg.click('#bi-pr-governar'); await pg.wait_for_timeout(150)
        ok(not await pg.locator('#pr-governar').is_checked() and await pg.locator('#nota-pr-governar').count() == 1, 'ⓘ de uma prioridade não marcada não a marca')
        await pg.click('#bi-pr-governar'); await pg.wait_for_timeout(150)

        # ---------------------------------------------------------- 1.2.2 problemas
        await pg.fill('#c-problemaOutro', 'Falta de bibliotecas'); await pg.locator('#c-problemaOutro').press('Tab'); await pg.wait_for_timeout(200)
        ok(await ev(pg, "qOk(CAMPO_POR_ID.problemas) && S.ctx.problemaOutro==='Falta de bibliotecas'"), '"Outro problema" sozinho responde 1.2.2')
        await pg.click('#pt-com'); await pg.wait_for_timeout(200)
        ok(await ev(pg, "S.ctx.problemas.length") == 10 and (await pg.locator('#q-1-2-2 .pg-n').text_content()).strip() == '10 de 10 marcados', '"Marcar todos" marca os 10 problemas da prioridade')
        ok(await ev(pg, "document.activeElement.id") == 'pn-com', 'foco passa para "Desmarcar todos"')
        await pg.click('#pn-com'); await pg.wait_for_timeout(200)
        ok(await ev(pg, "S.ctx.problemas.length===0 && S.ctx.problemaOutro==='Falta de bibliotecas'"), '"Desmarcar todos" não apaga o texto de "Outro"')
        await pg.fill('#c-problemaOutro', ''); await pg.locator('#c-problemaOutro').press('Tab'); await pg.wait_for_timeout(200)
        await pg.click('#pb-C2'); await pg.wait_for_timeout(200)
        ok(await ev(pg, "JSON.stringify(S.ctx.problemas)") == '["C2"]' and await ev(pg, "qOk(CAMPO_POR_ID.problemas)"), 'marcar um problema responde 1.2.2')
        ok(await pg.locator('#q-1-2-2 details.prob-sub[data-subdet="C2"]').count() == 1 and not await ev(pg, "document.querySelector('details.prob-sub[data-subdet=\"C2\"]').open"), 'problema marcado mostra as subcategorias, recolhidas')
        ok(await pg.locator('details.prob-sub[data-subdet="C1"]').count() == 0, 'problema não marcado não mostra subcategorias')
        await pg.click('details.prob-sub[data-subdet="C2"] summary'); await pg.wait_for_timeout(150)
        await pg.click('label:has(#sb-C2b)'); await pg.wait_for_timeout(200)
        ok(await ev(pg, "JSON.stringify(S.ctx.subs)") == '["C2b"]' and await ev(pg, "subsMarcadas().map(s=>s.id).join()") == 'C2b', 'subcategoria marcada fica no estado (subsMarcadas)')
        ok(await ev(pg, "document.querySelector('details.prob-sub[data-subdet=\"C2\"]').open") and '(1)' in await pg.locator('details.prob-sub[data-subdet="C2"] summary').text_content(), 'subcategorias continuam abertas, com a contagem')
        await pg.screenshot(path=TMP + '/v13_1b_1360.png', full_page=True)
        # desmarcar a prioridade não apaga os problemas (só deixam de contar)
        await pg.click('#pr-com'); await pg.wait_for_timeout(200)
        ok(await ev(pg, "JSON.stringify(S.ctx.problemas)==='[\"C2\"]' && !qOk(CAMPO_POR_ID.problemas) && problemasMarcados(S.ctx).length===0"), 'desmarcar a prioridade guarda os problemas, que deixam de contar')
        await pg.click('#pr-com'); await pg.wait_for_timeout(200)
        ok(await ev(pg, "qOk(CAMPO_POR_ID.problemas)"), 'marcar de novo a prioridade traz os problemas de volta')

        # ---------------------------------------------------------- sugestões dos problemas
        sp = await ev(pg, "sugestoesProblemas(S.ctx, tr)")
        ok(await ev(pg, "S.ctx.olhando") == sp['olhando'] and await ev(pg, "sugerido(CAMPO_POR_ID.olhando)"), f'1.2.3 sugerido: "{sp["olhando"]}"')
        ok(await ev(pg, "S.caso.problema") == sp['problema'] and await ev(pg, "!qOk(CAMPO_POR_ID.problema) && !qOk(CAMPO_POR_ID.problema, true)"), '1.2.4 com o modelo e lacunas: não conta como respondida, nem confirmada')
        ok(await ev(pg, "S.caso.impactos") == sp["impactos"] and await ev(pg, "sugerido(CAMPO_POR_ID.impactos)"), f'1.2.5 sugerido: {sp["impactos"]}')
        ok(await ev(pg, "S.caso.resultado") == sp['resultado'] and await ev(pg, "temLacuna(S.caso.resultado) && !qOk(CAMPO_POR_ID.resultado, true)"), '1.2.6 com os objetivos e lacunas')
        ok(await ev(pg, "S.caso.tarefas") == sp["tarefas"] and await ev(pg, "sugerido(CAMPO_POR_ID.tarefas) && !qOk(CAMPO_POR_ID.tarefas)"), f'2.1.1 sugerido: {sp["tarefas"]}')
        ok(await ev(pg, "(S.caso.usuarios||[]).length>0 && sugerido(CAMPO_POR_ID.usuarios)"), 'tarefas sugeridas sugerem o 2.2 (aplicarSugestoes)')
        tags = await ev(pg, "[...document.querySelectorAll('#passo-1b .q.sug .sug-tag')].map(e=>e.closest('.q').dataset.campo+'='+e.textContent)")
        ok(sorted(tags) == sorted([k + '=sugerido pelos problemas do passo 1.2' for k in ['olhando', 'problema', 'impactos', 'resultado']]), f'etiquetas no 1.2: {tags}')
        notas = await ev(pg, "[...document.querySelectorAll('#passo-1b .q.sug .sug-nota')].map(e=>e.textContent.trim())")
        ok(len(notas) == 4 and all(n == 'Sugestão a partir dos problemas marcados no passo 1.2. Confirme ou ajuste.' for n in notas), 'linha de "por quê" em cada sugestão do 1.2')
        ok(await pg.locator('#q-1-2-4.lacuna .lacuna-dica').is_visible() and await pg.locator('#q-1-2-6.lacuna .lacuna-dica').is_visible() and not await pg.locator('#q-1-2-3 .lacuna-dica').is_visible(), 'dica das lacunas sob 1.2.4 e 1.2.6')
        ok((await pg.locator('#q-1-2-4 .lacuna-dica').text_content()).strip() == 'Complete as lacunas marcadas com __ com os dados da sua rede.', 'texto da dica das lacunas')
        # mais problemas recalculam o que não foi confirmado
        await pg.click('#pb-C4'); await pg.wait_for_timeout(250)
        ok('(e mais 1)' in await ev(pg, "S.ctx.olhando") and 'tempo_docente' in await ev(pg, "S.caso.impactos") and 'planos_aula' in await ev(pg, "S.caso.tarefas"), 'marcar C4 recalcula 1.2.3, 1.2.5 e 2.1.1')
        # digitar confirma; depois as sugestões não substituem
        await pg.fill('#f-olhando', 'Matemática e tempo dos professores'); await pg.wait_for_timeout(150)
        await pg.locator('#q-1-2-5 [data-fm="impactos"][value="desigualdade"]').check(); await pg.wait_for_timeout(200)
        ok(await ev(pg, "!!S.respC.olhando && !!S.respC.impactos && !sugerido(CAMPO_POR_ID.olhando) && qOk(CAMPO_POR_ID.olhando) && qOk(CAMPO_POR_ID.impactos)"), 'digitar no 1.2.3 e marcar um impacto confirmam')
        await pg.click('#pb-C7'); await pg.wait_for_timeout(250)
        ok(await ev(pg, "S.ctx.olhando==='Matemática e tempo dos professores' && !S.caso.impactos.includes('permanencia') && S.caso.tarefas.includes('alerta_precoce')"), 'C7 muda só o que não foi confirmado (2.1.1 sim; 1.2.3 e 1.2.5 não)')
        await pg.fill('#f-problema', 'Na rede, hoje: 60% dos estudantes do 9º ano estão abaixo do nível adequado.'); await pg.wait_for_timeout(150)
        ok(await ev(pg, "qOk(CAMPO_POR_ID.problema) && !document.querySelector('#q-1-2-4').classList.contains('lacuna')"), '1.2.4 sem lacunas conta como respondida e a dica some')
        await pg.fill('#f-problema', 'Na rede, hoje: __ estudantes.'); await pg.wait_for_timeout(150)
        ok(await ev(pg, "!qOk(CAMPO_POR_ID.problema) && document.querySelector('#q-1-2-4').classList.contains('lacuna')"), 'texto digitado com "__" volta a não contar')
        await pg.fill('#f-problema', 'Na rede, hoje: 60% dos estudantes do 9º ano estão abaixo do nível adequado.'); await pg.wait_for_timeout(150)
        # 2.1: tarefas sugeridas, confirmação por "Confirmar e continuar"
        await ev(pg, "abrirFase('piloto','2a')", 200)
        # v15 (B3): as tarefas sugeridas aparecem em "Sugerido: …" com Aceitar, sem nada marcado
        ok(await pg.locator('#q-2-1-1.sug .sug-tag').text_content() == 'sugerido pelos problemas do passo 1.2' and await pg.locator('#q-2-1-1 input:checked').count() == 0 and await pg.locator('#sug-tarefas .sug-v b > span').count() == len(await ev(pg, "S.caso.tarefas")), '2.1.1 abre com as tarefas sugeridas')
        ok(await pg.locator('#passo-2a .aviso.sem-ferr').count() == 0, 'sem aviso de "regras e processos" quando há tarefas')
        await ev(pg, "abrirFase('piloto','2b')", 200)
        ok((await pg.locator('#q-2-2-1.sug .sug-nota').text_content()).strip() == 'Sugestão a partir das tarefas marcadas no passo 2.1. Confirme ou ajuste.', '2.2.1: linha de "por quê" da sugestão das tarefas')
        await ev(pg, "abrirFase('piloto','2a')", 200)
        await pg.click('#pe-2a [data-act="continuar-confirmar"]'); await pg.wait_for_timeout(250)
        ok(await ev(pg, "!!S.respC.tarefas && qOk(CAMPO_POR_ID.tarefas) && S.passo==='2b'"), '"Confirmar e continuar" confirma as tarefas')
        # só problemas sem tarefa de IA → aviso no topo do 2.1
        await branco(pg)
        await ev(pg, "(()=>{S.ctx.prioridades=['governar']; S.ctx.problemas=['G2','G4']; render(); abrirFase('piloto','2a');})()", 250)
        ok(await pg.locator('#passo-2a .aviso.sem-ferr').count() == 1 and await ev(pg, "S.caso.tarefas.length===0"), 'problemas sem tarefa de IA: aviso AVISO_SEM_FERRAMENTA no 2.1 e nada marcado')
        ok(await ev(pg, "document.querySelector('#passo-2a .passo-corpo').firstElementChild.classList.contains('sem-ferr') || document.querySelector('#passo-2a .abertura + .sem-ferr')!==null || document.querySelector('#passo-2a .passo-corpo > .ajuda + .sem-ferr')!==null"), 'aviso no topo do passo')

        # ---------------------------------------------------------- 1.2.7 e 1.3.x: detalhe de "Sim" e "Em parte"
        await ev(pg, "(()=>{S.ctx.prioridades=['com']; S.ctx.problemas=['C1','C2']; abrirFase('contexto','1b');})()", 250)
        ok(await pg.locator('#det-linhaBase .q-det-in').count() == 0, '1.2.7 sem resposta: sem detalhe')
        await pg.click('#q-1-2-7 [data-f="linhaBase"][value="sim"]'); await pg.wait_for_timeout(200)
        ok(await pg.locator('#det-linhaBase [data-fm="linhaBaseProblemas"]').count() == 2 and await pg.locator('#f-linhaBaseMedida').count() == 1, '"Sim": caixas com os problemas marcados e "Qual medida?"')
        ok(await pg.get_attribute('#f-linhaBaseMedida', 'placeholder') == 'Ex.: avaliação estadual de leitura do 5º ano, 2025', 'exemplo da medida')
        await pg.click('label[for="lb-C2"]'); await pg.wait_for_timeout(150)
        await pg.fill('#f-linhaBaseMedida', 'Prova da rede 2025'); await pg.wait_for_timeout(150)
        ok(await ev(pg, "JSON.stringify(S.caso.linhaBaseProblemas)==='[\"C2\"]' && S.caso.linhaBaseMedida==='Prova da rede 2025'"), 'detalhe do 1.2.7 gravado no caso')
        await pg.click('#q-1-2-7 [data-f="linhaBase"][value="nao"]'); await pg.wait_for_timeout(200)
        ok(await pg.locator('#det-linhaBase .q-det-in').count() == 0 and await ev(pg, "S.caso.linhaBaseMedida==='Prova da rede 2025'"), '"Não" esconde o detalhe e guarda os dados')
        await pg.click('#q-1-2-7 [data-f="linhaBase"][value="parcial"]'); await pg.wait_for_timeout(200)
        ok(await pg.locator('#lb-C2').is_checked() and await pg.input_value('#f-linhaBaseMedida') == 'Prova da rede 2025', '"Em parte" mostra de novo os dados guardados')
        await ev(pg, "(()=>{S.ctx.problemas=[]; render();})()", 200)
        ok(await pg.locator('#det-linhaBase #f-linhaBaseProblemaTxt').count() == 1 and await pg.locator('#det-linhaBase [data-fm]').count() == 0, 'sem problemas marcados: "Para quais problemas?" em texto livre')
        await pg.fill('#f-linhaBaseProblemaTxt', 'Leitura no 5º ano'); await pg.wait_for_timeout(150)
        ok(await ev(pg, "S.caso.linhaBaseProblemaTxt") == 'Leitura no 5º ano', 'texto livre gravado em linhaBaseProblemaTxt')
        await ev(pg, "abrirFase('contexto','1c')", 200)
        labels = {'g-comite': 'Qual equipe ou instância? Quem participa?', 'g-politica': 'Qual documento? (nome, data ou link)', 'g-legislacao': 'Quais normas já foram identificadas?',
                  'g-dados': 'Qual política ou norma de dados?', 'g-etica': 'Quais orientações? Para quem?', 'g-compras': 'Quais regras ou modelos?'}
        for gid, lab in labels.items():
            await pg.click(f'[data-resp="{gid}"][data-v="sim"]'); await pg.wait_for_timeout(120)
            t = await ev(pg, f"(document.querySelector('label[for=\"dt-{gid}-qual\"] span')||{{}}).textContent||''", 0)
            ok(t == lab and await pg.locator(f'#dt-{gid}-falta').count() == 0, f'{gid} "Sim": campo "{lab}"')
        ok(await ev(pg, "document.activeElement.dataset.resp") == 'g-compras', 'o foco fica no botão da resposta (detalhe trocado no lugar)')
        await pg.click('[data-resp="g-comite"][data-v="parcial"]'); await pg.wait_for_timeout(150)
        ok(await pg.locator('#dt-g-comite-qual').count() == 1 and await pg.locator('#dt-g-comite-falta').count() == 1, '"Em parte": "Qual?" e "O que falta?"')
        await pg.fill('#dt-g-comite-qual', 'Comitê com pedagogia e TI'); await pg.fill('#dt-g-comite-falta', 'Jurídico e proteção de dados'); await pg.wait_for_timeout(150)
        ok(await ev(pg, "JSON.stringify(S.respDet['g-comite'])") == '{"qual":"Comitê com pedagogia e TI","falta":"Jurídico e proteção de dados"}', 'detalhe gravado em S.respDet')
        await pg.click('[data-resp="g-comite"][data-v="nao"]'); await pg.wait_for_timeout(150)
        ok(await pg.locator('#dt-g-comite-qual').count() == 0 and await ev(pg, "S.respDet['g-comite'].qual") == 'Comitê com pedagogia e TI', '"Não" esconde o detalhe e guarda o texto')
        await ev(pg, "(()=>{QUESTOES_G.forEach(q=>{S.resp[q.id]='sim'}); render();})()", 150)
        ok(await ev(pg, "passoFeito('1c')"), 'detalhe vazio não bloqueia o passo 1.3')
        await pg.click('[data-resp="g-comite"][data-v="parcial"]'); await pg.wait_for_timeout(150)
        await ev(pg, "irPara('q-1-3-1')", 300)
        await pg.screenshot(path=TMP + '/v13_1c_1360.png')

        # ---------------------------------------------------------- camada 2 enxuta no teste
        await branco(pg)
        ok(await ev(pg, N_CAMADA2) == 14, 'sem resposta 2.0: 14 perguntas da camada 2 (como na v12)')
        ok(await ev(pg, "S.caso.nFerramentas===''"), '2.3.1 sem sugestão antes do 2.0')
        await ev(pg, "abrirFase('piloto','20')")
        await pg.locator('[data-fm="testes"][value="piloto"]').click(); await pg.wait_for_timeout(200)
        ok(await ev(pg, N_CAMADA2) == 11, 'piloto: 11 perguntas da camada 2')
        ok(await ev(pg, "camposPasso('3a').map(f=>f.id).join()") == 'implantacao,frequencia,licenca,adaptacao', 'piloto: 2.2.4, 2.3.6 e 2.3.7 no passo 3.1, depois do 3.1.1')
        ok(await ev(pg, "S.caso.nFerramentas==='1' && sugerido(CAMPO_POR_ID.nFerramentas)"), '2.3.1 "Uma" sugerida pela resposta 2.0')
        await ev(pg, "abrirFase('piloto','2c')", 200)
        ok(await pg.locator('#q-2-3-1.sug .sug-tag').text_content() == 'sugerido pela resposta 2.0' and (await pg.locator('#q-2-3-1 .sug-nota').text_content()).strip() == 'Testar uma ferramenta por vez permite saber o que funcionou. Confirme ou escolha outra opção.', '2.3.1: etiqueta e "por quê"')
        det = pg.locator('#passo-2c details.desc-imp[data-desc="2c"]')
        ok(await det.count() == 1 and not await ev(pg, "document.querySelector('#passo-2c details.desc-imp').open"), '2.3: "Para a implantação" recolhido no fim do passo')
        ok((await det.locator(':scope > summary').text_content()).strip() == 'Para a implantação (pode responder agora ou depois)' and (await det.locator('.desc-in > .hint').text_content()).strip() == 'Estas perguntas também aparecem no passo 3.1.', 'resumo e nota do <details>')
        ok(await ev(pg, "[...document.querySelectorAll('#passo-2c details.desc-imp .q')].map(q=>q.dataset.n).join()") == '2.3.6,2.3.7', '2.3.6 e 2.3.7 dentro do <details>')
        ok(await ev(pg, "document.querySelector('#passo-2c .passo-corpo > details.desc-imp + .pe')!==null"), '<details> logo antes do rodapé do passo')
        await det.locator(':scope > summary').click(); await pg.wait_for_timeout(150)
        await pg.locator('#q-2-3-1 [data-f="nFerramentas"][value="1"]').click(); await pg.wait_for_timeout(200)
        ok(await ev(pg, "!!S.respC.nFerramentas && !sugerido(CAMPO_POR_ID.nFerramentas)") and await ev(pg, "document.querySelector('#passo-2c details.desc-imp').open"), 'clicar na opção sugerida confirma; o <details> continua aberto')
        await pg.locator('#q-2-3-6 [data-f="licenca"][value="assinatura"]').click(); await pg.wait_for_timeout(200)
        ok(await ev(pg, "S.caso.licenca==='assinatura' && qOk(CAMPO_POR_ID.licenca)"), 'responder 2.3.6 dentro do <details>')
        await ev(pg, "irPara('passo-2c')", 300)
        await pg.screenshot(path=TMP + '/v13_2c_piloto_1360.png', full_page=False)
        ok(await ev(pg, "faltas('2c').every(f=>!['licenca','adaptacao'].includes(f.id)) && faltas('3a').some(f=>f.id==='adaptacao')"), 'validação: 2.3.7 conta no 3.1, não no 2.3')
        ft = await ev(pg, "faltasTodas().filter(x=>['frequencia','adaptacao'].includes(x.id)).map(x=>x.ir)")
        ok(sorted(ft) == ['implantacao:3a:2-2-4', 'implantacao:3a:2-3-7'], f'faltasTodas leva ao passo 3.1: {ft}')
        await ev(pg, "abrirFase('implantacao','3a')", 250)
        ok(await pg.locator('#desc-3a h3').text_content() == 'Da camada 2: decisões que ficaram para a implantação' and await ev(pg, "[...document.querySelectorAll('#desc-3a .q')].map(q=>q.dataset.n).join()") == '2.2.4,2.3.6,2.3.7', '3.1: subtítulo e as perguntas descidas, depois das do passo')
        ok(await ev(pg, "document.querySelector('#q-3-1-1').compareDocumentPosition(document.querySelector('#desc-3a')) & 4"), '3.1.1 antes do bloco da camada 2')
        ok(await pg.locator('#q-2-3-6 [value="assinatura"]').is_checked(), 'resposta dada no 2.3 aparece no 3.1')
        await ev(pg, "irPara('desc-3a')", 300)
        await pg.screenshot(path=TMP + '/v13_3a_piloto_1360.png')
        await ev(pg, "abrirFase('piloto','2b')", 200)
        ok(await pg.locator('#passo-2b .passo-corpo > .q').count() == 3 and await ev(pg, "camposPasso('2b').map(f=>f.n).join()") == '2.2.1,2.2.2,2.2.3' and await pg.locator('#passo-2b details.desc-imp #q-2-2-4').count() == 1, 'piloto: 2.2 com 2.2.1–2.2.3 e 2.2.4 em "Para a implantação"')
        # ir à pergunta descida a partir do painel ou do plano abre o 3.1
        await ev(pg, "abrirFase('implantacao','','frequencia')", 300)
        ok(await ev(pg, "S.passo") == '3a', 'abrirFase pelo id de uma pergunta descida vai ao 3.1')
        # PoC: 9; os dois: 11; "recomende": 14; respostas mantidas
        await ev(pg, "abrirFase('piloto','20')")
        await pg.locator('[data-fm="testes"][value="piloto"]').click(); await pg.wait_for_timeout(150)
        await pg.locator('[data-fm="testes"][value="poc"]').click(); await pg.wait_for_timeout(200)
        ok(await ev(pg, N_CAMADA2) == 9 and await ev(pg, "camposPasso('2b').map(f=>f.n).join()") == '2.2.1', 'prova de conceito: 9 perguntas; 2.2 só com 2.2.1')
        await pg.locator('[data-fm="testes"][value="piloto"]').click(); await pg.wait_for_timeout(200)
        ok(await ev(pg, N_CAMADA2) == 11, 'prova de conceito + piloto: 11 (segue o piloto)')
        await pg.locator('[data-fm="testes"][value="recomendar"]').click(); await pg.wait_for_timeout(200)
        ok(await ev(pg, N_CAMADA2) == 14 and await ev(pg, "camposPasso('3a').length") == 1, '"recomende": tudo como na v12')
        ok(await ev(pg, "S.caso.licenca==='assinatura' && !!S.respC.licenca"), 'trocar o 2.0 não perde respostas')
        await pg.locator('[data-fm="testes"][value="recomendar"]').click(); await pg.wait_for_timeout(200)
        ok(await ev(pg, N_CAMADA2) == 14, 'desmarcar o 2.0: tudo como na v12')

        # ---------------------------------------------------------- migração v12 → v13 e exportação
        v12 = {'versao': 11, 'v10': True, 'exemplo': 'novo', 'fase': 'contexto', 'passo': '1b', 'vista': '', 'boasVindas': False, 'info': {}, 'feitos': {},
               'caso': {'titulo': '', 'problema': 'Proficiência baixa.', 'resultado': '', 'impactos': ['aprendizagem'], 'testes': ['piloto'], 'tarefas': ['tutoria'], 'nFerramentas': '2',
                        'piloto': {'escolas': '', 'participantes': '', 'meses': ''}, 'poc': {'participantes': '', 'meses': ''}, 'implantacao': {'escolas': '', 'pessoas': ''}},
               'ctx': {'nivel': 'estado', 'local': 'Rede Y', 'etapas': {}, 'dominio': 'qualificacao', 'comps': ['matematica'], 'compOutro': '', 'olhando': 'Matemática no 9º ano'},
               'resp': {'g-comite': 'sim'}, 'respC': {'problema': True}, 'custo': {'base': 'caso', 'cfg': None, 'editado': False}, 'moeda': {'cod': 'USD', 'taxa': ''}, 'lang': 'pt'}
        await pg.evaluate("t => { localStorage.clear(); localStorage.setItem('aiedu-procurement-v9', t); }", json.dumps(v12)); await pg.reload(); await pg.wait_for_timeout(400)
        await pg.select_option('#sel-lang', 'pt'); await pg.wait_for_timeout(150)
        ok(await pg.locator('[data-act="continuar-salvo"]').count() == 1, 'estado v12 oferecido como caso salvo')
        await pg.click('[data-act="continuar-salvo"]'); await pg.wait_for_timeout(300)
        m = await ev(pg, "({v:S.versao, pr:S.ctx.prioridades, pb:S.ctx.problemas, ol:S.ctx.olhando, dom:'dominio' in S.ctx, comps:'comps' in S.ctx, rd:S.respDet, t:S.caso.tarefas, nf:S.caso.nFerramentas, rc:['olhando','tarefas','impactos','nFerramentas'].every(k=>S.respC[k]), lb:S.caso.linhaBaseProblemas, lm:S.caso.linhaBaseMedida})")
        ok(m['v'] == 13 and m['pr'] == ['com'] and m['pb'] == ['C2'] and not m['dom'] and not m['comps'], f'v12 → v13: domínio "qualificacao" e comps ["matematica"] viram prioridade "com" e problema C2 ({m["pr"]}, {m["pb"]})')
        ok(m['ol'] == 'Matemática no 9º ano' and m['t'] == ['tutoria'] and m['nf'] == '2' and m['rc'], 'v12 → v13: olhando, tarefas e 2.3.1 mantidos e confirmados (sugestões não os substituem)')
        ok(m['rd'] == {} and m['lb'] == [] and m['lm'] == '', 'v12 → v13: respDet e campos novos do 1.2.7 vazios')
        ok(await ev(pg, "S.caso.problema==='Proficiência baixa.' && JSON.stringify(S.caso.impactos)==='[\"aprendizagem\"]'"), 'v12 → v13: respostas do 1.2 mantidas')
        # comps "outro" → "Outro problema"; "digital" → Educar sobre a IA
        r = await ev(pg, """(()=>{const o={versao:11, caso:{}, ctx:{dominio:'qualificacao', comps:['outro','digital'], compOutro:'Convivência escolar'}, respC:{}}; migrarEstadoV13(o); return o.ctx;})()""")
        ok(r['problemaOutro'] == 'Convivência escolar' and r['prioridades'] == ['sobre', 'com'] and r['problemas'] == ['A1'], f'componente "outro" → Outro problema; "digital" → A1 ({r})')
        # importação formato 11 e exportação formato 13 (ida e volta)
        f11 = {'app': 'ai-education-procurement-tool', 'formato': 11, 'versao': 11, 'v10': True, 'exemplo': 'editado', 'caso': v12['caso'], 'ctx': v12['ctx'], 'resp': v12['resp'], 'respC': {}, 'feitos': {}}
        okimp = await pg.evaluate("t => importarCaso(t)", json.dumps(f11)); await pg.wait_for_timeout(250)
        ok(okimp and await ev(pg, "S.versao===13 && S.ctx.problemas.join()==='C2' && S.caso.tarefas.join()==='tutoria' && !!S.respC.tarefas"), 'importa formato 11 e migra para a v13')
        await ev(pg, "(()=>{S.respDet={'g-dados':{qual:'Resolução 12',falta:''}}; S.ctx.subs=['C2b'];})()", 50)
        ex = await ev(pg, "dadosCaso()")
        ok(ex['formato'] == 13 and ex['versao'] == 13 and ex['respDet'] == {'g-dados': {'qual': 'Resolução 12', 'falta': ''}}, 'exportação formato 13 com respDet')
        await ev(pg, "carregarExemplo('novo')", 150)
        okimp = await pg.evaluate("t => importarCaso(t)", json.dumps(ex)); await pg.wait_for_timeout(250)
        ok(okimp and await ev(pg, "S.respDet['g-dados'].qual==='Resolução 12' && S.ctx.subs.join()==='C2b' && S.versao===13"), 'importa formato 13 (ida e volta)')

        # ---------------------------------------------------------- exemplos A–D
        ok(await ev(pg, "['A','B','C','D'].every(k=>JSON.stringify(CTX_EX[k].problemas)===JSON.stringify(PROBLEMAS_EXEMPLO[k]) && CTX_EX[k].prioridades.join()==='com' && !('dominio' in CTX_EX[k]))"), 'CTX_EX: prioridade "com" e problemas de PROBLEMAS_EXEMPLO')
        for k in 'ABCD':
            await ev(pg, f"(()=>{{carregarExemplo('{k}'); S.boasVindas=false; render();}})()", 200)
            r = await ev(pg, "({sug: CAMPOS.filter(f=>visivel(f) && sugerido(f)).map(f=>f.id), ol: S.ctx.olhando, p1: passoFeito('1b'), t: S.caso.tarefas.length, n: S.caso.nFerramentas, pr: qOk(CAMPO_POR_ID.prioridades) && qOk(CAMPO_POR_ID.problemas), rc: CAMPOS_PROB.every(c=>S.respC[c])})")
            ok(not r['sug'] and r['p1'] and r['pr'] and r['rc'] and r['t'] > 0, f'exemplo {k}: 1.2 completo, nenhuma sugestão pendente ({r["sug"]})')
            await ev(pg, "abrirFase('contexto','1b')", 200)
            ok(await pg.locator('#passo-1b .q.sug').count() == 0 and await pg.locator('#det-linhaBase .q-det-in').count() == 1, f'exemplo {k}: 1.2 sem "sugerido" e com o detalhe da linha de base')

        # ---------------------------------------------------------- 400 px
        await pg.set_viewport_size({'width': 400, 'height': 860}); await pg.wait_for_timeout(200)
        await branco(pg)
        await ev(pg, "(()=>{S.ctx.prioridades=PRIORIDADES.map(p=>p.id); S.ctx.problemas=PRIORIDADES.flatMap(p=>p.problemas.map(q=>q.id)); S.info['pr-sobre']=true; Object.keys(PROBLEMA_POR_ID).forEach(k=>{SUB_ABERTO[k]=true}); S.caso.linhaBase='sim'; S.respC.linhaBase=true; render();})()", 300)
        sw = await ev(pg, "document.documentElement.scrollWidth")
        ok(sw <= 401, f'400 px: passo 1.2 com tudo marcado sem rolagem horizontal ({sw})')
        await ev(pg, "irPara('passo-1b')", 300)
        await pg.screenshot(path=TMP + '/v13_1b_400.png')
        await ev(pg, "(()=>{S.caso.testes=['piloto']; S.respC.testes=true; DESC_ABERTO['2c']=true; DESC_ABERTO['2b']=true; abrirFase('piloto','2c');})()", 300)
        sw = await ev(pg, "document.documentElement.scrollWidth")
        ok(sw <= 401, f'400 px: 2.3 no piloto com "Para a implantação" aberto ({sw})')
        await ev(pg, "irPara('passo-2c')", 300)
        await pg.screenshot(path=TMP + '/v13_2c_piloto_400.png', full_page=True)
        await ev(pg, "abrirFase('implantacao','3a')", 300)
        ok(await ev(pg, "document.documentElement.scrollWidth") <= 401, '400 px: 3.1 com as perguntas da camada 2')
        await ev(pg, "irPara('desc-3a')", 300)
        await pg.screenshot(path=TMP + '/v13_3a_400.png')
        await ev(pg, "(()=>{QUESTOES_G.forEach(q=>{S.resp[q.id]='parcial'}); abrirFase('contexto','1c');})()", 300)
        ok(await ev(pg, "document.documentElement.scrollWidth") <= 401, '400 px: 1.3 com os detalhes abertos')

        # ---------------------------------------------------------- EN: telas novas sem restos de português
        await pg.set_viewport_size({'width': 1360, 'height': 900}); await pg.wait_for_timeout(150)
        await pg.select_option('#sel-lang', 'en'); await pg.wait_for_timeout(300)
        await ev(pg, "(()=>{S.ctx.prioridades=['com']; S.ctx.problemas=['C2']; S.ctx.subs=[]; SUB_ABERTO.C2=true; S.info={'pr-com':true}; S.caso.linhaBase='parcial'; S.respC.linhaBase=true; ['olhando','problema','impactos','resultado','tarefas'].forEach(k=>delete S.respC[k]); abrirFase('contexto','1b');})()", 300)
        SEL = ['#passo-1b .pt b', '#passo-1b .passo-h', '#q-1-2-1 .q-t', '#q-1-2-1 > .hint', '#q-1-2-2 .q-t', '#q-1-2-2 > .hint', '.pg-n', '.pg-acoes', '.prob-ol', '.prob-sub summary', '.prob-outro label',
               '#q-1-2-3 .sug-tag', '#q-1-2-3 .sug-nota', '#q-1-2-4 .lacuna-dica', '#det-linhaBase .q-det-c', '#nota-pr-com .eyebrow', '#fase-contexto .fase-t small']
        txt = await ev(pg, f"{json.dumps(SEL)}.flatMap(s=>[...document.querySelectorAll(s)].map(e=>e.innerText)).join(' | ')")
        ph = await pg.get_attribute('#f-linhaBaseMedida', 'placeholder')
        ok(txt and not PT.search(txt) and not PT13.search(txt) and not PT.search(ph), f'EN 1.2 sem restos de português: {(PT.findall(txt) + PT13.findall(txt))[:6]}')
        ok('Priority and impact' in txt and 'Select all' in txt and '0 of 10 selected' not in txt and '1 of 10 selected' in txt, 'EN 1.2: nomes e contador traduzidos')
        await ev(pg, "(()=>{abrirFase('contexto','1c');})()", 250)
        txt = await ev(pg, "[...document.querySelectorAll('#passo-1c .q-det label')].map(e=>e.innerText).join(' | ')")
        ok(txt and not PT.search(txt) and not PT13.search(txt), f'EN 1.3: rótulos do detalhe traduzidos ({txt[:80]!r})')
        await ev(pg, "(()=>{S.caso.testes=['piloto']; DESC_ABERTO['2c']=true; abrirFase('piloto','2c');})()", 250)
        txt = await ev(pg, "[...document.querySelectorAll('#passo-2c details.desc-imp > summary, #passo-2c .desc-in > .hint, #q-2-3-1 .sug-tag, #q-2-3-1 .sug-nota')].map(e=>e.innerText).join(' | ')")
        ok(txt.count('|') >= 1 and not PT.search(txt) and not PT13.search(txt), f'EN 2.3: "Para a implantação" traduzido ({txt[:120]})')
        await ev(pg, "abrirFase('implantacao','3a')", 250)
        txt = await ev(pg, "(document.querySelector('#desc-3a h3')||{}).innerText||''")
        ok(txt == 'From layer 2: decisions left for deployment', f'EN 3.1: "{txt}"')
        en = await ev(pg, "document.body.innerText")
        ok(not re.search(r'(?i)\bnetworks?\b', en), 'EN sem "network"')
        await ev(pg, "irPara('desc-3a')", 300)
        await pg.screenshot(path=TMP + '/v13_3a_en_1360.png')

        ok(not dialogos, f'nenhuma caixa de diálogo do navegador: {dialogos}')
        ok(not erros, 'sem erros de console' + ('' if not erros else ': ' + '; '.join(erros[:5])))
        await b.close()
    print('\n' + ('TUDO OK' if not falhas else f'{len(falhas)} FALHA(S)'))
    sys.exit(1 if falhas else 0)

asyncio.run(main())
