# Teste da v14 (BL1.1, BL1.3, BL1.5, BL4.3): país no passo 1.1, moeda e câmbio, marcadores de origem (dos dados do país, editado por você,
# estimado pela região, valor ilustrativo) com "restaurar", faixa de referência no painel de custos, premissasDoCaso e versaoReferencias na página,
# 390 px sem rolagem horizontal e EN/ES/FR sem restos de português no bloco do país.
# Uso: bash build.sh && flock /tmp/claude-0/upt-tests.lock python3 tests/test_v14_pais.py   (capturas em /tmp/claude-0/v14_pais/)
import asyncio, os, re, sys
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = '/tmp/claude-0/v14_pais'
os.makedirs(TMP, exist_ok=True)
SK = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>' + open(os.path.join(RAIZ, 'navegador.html')).read() + '</body></html>'
ARQ = TMP + '/v14_pais.html'
open(ARQ, 'w').write(SK)
PT = re.compile(r'ã|õ|ção|ções|\b(?:você|não|também|para o|da rede|do caso|escolas?|custo|orçamento|formação|passo|região)\b', re.I)

falhas = []
def ok(cond, msg):
    print(('ok   ' if cond else 'FALHA ') + msg)
    if not cond: falhas.append(msg)

async def abrir(pg, lang='pt'):
    await pg.goto('file://' + ARQ); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
    await pg.select_option('#sel-lang', lang); await pg.wait_for_timeout(150)

async def ev(pg, js, t=120):
    r = await pg.evaluate(js); await pg.wait_for_timeout(t); return r

async def passo11(pg):
    await pg.evaluate("(()=>{carregarExemplo('novo'); S.boasVindas=false; abrirFase('contexto','1a');})()"); await pg.wait_for_timeout(250)

MARC = "(()=>{const m=document.querySelector('[data-pc-l=inflacao] .marc'); return m?[m.dataset.origem, m.firstChild.textContent.trim(), m.title]:null;})()"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1360, 'height': 900})
        erros = []
        pg.on('pageerror', lambda e: erros.append(f'pageerror: {e}'))
        pg.on('console', lambda m: erros.append(f'console: {m.text}') if m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
        await abrir(pg)
        await pg.click('[data-act="comecar"]'); await pg.wait_for_timeout(250)
        await passo11(pg)

        # ---------------------------------------------------------- o seletor de país abre o passo 1.1
        ok(await ev(pg, "!!document.getElementById('f-pais')"), 'o passo 1.1 tem o seletor de país')
        # v15 (proposta C): no documento, a pergunta 1.1.1 é uma lacuna do texto ([data-lac=nivel]); o caminho até ela mudou
        ordem = await ev(pg, "(()=>{const a=document.getElementById('f-pais'), b=document.getElementById('q-1-1-1')||document.querySelector('#plano-s1 [data-lac=nivel]'); return !!(a&&b&&(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING));})()")
        ok(ordem, 'o seletor de país vem antes da pergunta 1.1.1')
        opts = await ev(pg, "[...document.querySelectorAll('#f-pais option')].map(o=>[o.value,o.textContent.trim()])")
        ok([o[0] for o in opts if o[0] and o[0] != 'outro'] == ['BRA', 'IDN', 'MAR', 'MEX', 'KEN'] or sorted(o[0] for o in opts if o[0] and o[0] != 'outro') == ['BRA', 'IDN', 'KEN', 'MAR', 'MEX'], f'os 5 países piloto na lista: {[o[0] for o in opts]}')
        ok(opts[-1] == ['outro', 'Outro país ou não listado'], 'a última opção é "Outro país ou não listado"')
        ok(await ev(pg, "S.caso.pais===''"), 'sem escolha, o país fica vazio')
        ok(await ev(pg, "(()=>{const m=document.querySelector('[data-pc-l=inflacao] .marc'); return m&&m.dataset.origem;})()") == 'ilustrativo', 'sem país, a inflação já mostra o valor ilustrativo')

        # ---------------------------------------------------------- moeda e câmbio
        moedas = {'BRA': 'BRL', 'MEX': 'MXN', 'KEN': 'KES', 'MAR': 'MAD', 'IDN': 'IDR'}
        for iso, cod in moedas.items():
            await pg.select_option('#f-pais', iso); await pg.wait_for_timeout(150)
            r = await ev(pg, "[S.caso.pais, S.moeda.cod, S.moeda.taxa, moedaInfo().f, MOEDAS.taxas[S.moeda.cod]]")
            ok(r[0] == iso and r[1] == cod and r[2] == '' and abs(r[3] - r[4]) < 1e-9, f'{iso}: moeda {cod} e a taxa de referência ({r[3]})')
        await pg.select_option('#f-pais', 'BRA'); await pg.wait_for_timeout(150)
        nota = await ev(pg, "document.querySelector('.pais-nota').innerText")
        ok('BRL' in nota and 'US$ =' in nota and 'América Latina e Caribe' in nota and 'renda média-alta' in nota and 'Banco Mundial, a verificar' in nota, f'a nota mostra moeda, câmbio, região e grupo de renda: {nota[:120]!r}')
        # o câmbio mostrado muda se a pessoa substitui a taxa (painel de custos): o seletor de moeda da etapa 4.2 acompanha o país
        await pg.select_option('#f-pais', 'outro'); await pg.wait_for_timeout(150)
        ok(await ev(pg, "S.caso.pais==='outro' && S.moeda.cod==='BRL'"), '"Outro país" não muda a moeda escolhida antes')
        ok('valores ilustrativos' in await ev(pg, "document.querySelector('.pais-nota').innerText"), '"Outro país" explica que valem os valores ilustrativos')
        ok(await ev(pg, "listaPaises().length")==5, 'cinco perfis em PAISES')

        # ---------------------------------------------------------- marcadores: valor ilustrativo → editado por você → restaurar
        await pg.select_option('#f-pais', 'BRA'); await pg.wait_for_timeout(150)
        m = await ev(pg, MARC)
        ok(m[0] == 'ilustrativo' and m[1] == 'valor ilustrativo', f'inflação: marcador "valor ilustrativo": {m[:2]}')
        ok('Convenção da ferramenta (v13), ilustrativa' in m[2] and 'Ano:' in m[2], f'dica do marcador com fonte e ano: {m[2]!r}')
        ok('Grau: C' in m[2], 'dica do marcador com o grau C')
        ok(await ev(pg, "document.getElementById('pc-inflacao').value") in ('2,5', '2.5'), f'inflação ilustrativa de 2,5%: {await ev(pg, "document.getElementById(\'pc-inflacao\').value")}')
        ok(await ev(pg, "document.querySelector('[data-pc-rest=inflacao]')") is None, 'sem edição, não há "restaurar"')
        await pg.fill('#pc-inflacao', '3,5'); await pg.wait_for_timeout(200)
        m = await ev(pg, "(()=>{const m=document.querySelector('[data-pc-l=inflacao] .marc'); return m?[m.dataset.origem, m.firstChild.textContent.trim()]:null;})()")
        ok(m == ['usuario', 'editado por você'], f'ao digitar, o marcador passa a "editado por você": {m}')
        ok(abs(await ev(pg, "S.caso.editados.inflacao") - 0.035) < 1e-12, 'a edição fica em caso.editados (fração)')
        ok(await ev(pg, "document.querySelector('[data-pc-rest=inflacao]')") is not None, 'aparece "restaurar"')
        ok(abs(await ev(pg, "cfgAtual().opc.pi") - 0.035) < 1e-12 or abs(await ev(pg, "premissasDoCaso(S.caso).find(x=>x.campo==='inflacao').valor") - 0.035) < 1e-12, 'a inflação editada vale para o custo (premissas)')
        ok(await ev(pg, "document.activeElement && document.activeElement.id") == 'pc-inflacao', 'digitar não tira o foco do campo')
        await pg.click('[data-pc-rest=inflacao]'); await pg.wait_for_timeout(250)
        m = await ev(pg, "(()=>{const m=document.querySelector('[data-pc-l=inflacao] .marc'); return m?[m.dataset.origem, m.firstChild.textContent.trim()]:null;})()")
        ok(m == ['ilustrativo', 'valor ilustrativo'], f'"restaurar" volta ao marcador "valor ilustrativo": {m}')
        ok(await ev(pg, "document.getElementById('pc-inflacao').value") in ('2,5', '2.5') and await ev(pg, "Object.keys(S.caso.editados).length") == 0, 'e ao valor da base (2,5), sem edição guardada')
        ok(abs(await ev(pg, "valorEfetivoCampo(S.caso,'inflacao').valor") - 0.025) < 1e-12, 'valorEfetivoCampo volta a 0,025')

        # ---------------------------------------------------------- dado do país e estimativa da região (dados injetados no teste: o seed só tem moeda, região e renda)
        await ev(pg, "paisPorIso('BRA').inflacao = {valor: 0.045, fonte: 'IBGE (teste)', ano: 2025}; render();")
        m = await ev(pg, "(()=>{const m=document.querySelector('[data-pc-l=inflacao] .marc'); return m?[m.dataset.origem, m.firstChild.textContent.trim(), m.title]:null;})()")
        ok(m[0] == 'pais' and m[1] == 'dos dados do país', f'com dado do país: "dos dados do país": {m[:2]}')
        ok('IBGE (teste)' in m[2] and 'Ano: 2025' in m[2], f'dica com a fonte e o ano do dado: {m[2]!r}')
        ok(await ev(pg, "document.getElementById('pc-inflacao').value") in ('4,5', '4.5'), 'o campo mostra 4,5')
        ok(abs(await ev(pg, "cfgAtual().opc.pi") - 0.045) < 1e-12, 'a inflação do país entra no custo (cfg.opc.pi = 0,045)')
        await pg.fill('#pc-inflacao', '5'); await pg.wait_for_timeout(200)
        ok(await ev(pg, "document.querySelector('[data-pc-l=inflacao] .marc').dataset.origem") == 'usuario', 'editar o dado do país: "editado por você"')
        await pg.click('[data-pc-rest=inflacao]'); await pg.wait_for_timeout(250)
        ok(await ev(pg, "document.querySelector('[data-pc-l=inflacao] .marc').dataset.origem") == 'pais' and await ev(pg, "document.getElementById('pc-inflacao').value") in ('4,5', '4.5'), '"restaurar" traz o dado do país de volta')
        await ev(pg, "REFERENCIAS.referencias.push({id:'macro.inflacao', item:'Inflação anual na moeda do orçamento', unidade:'fração por ano', valor:0.06, baixo:0.05, alto:0.07, moeda:null, anoPreco:null, escopo:'LAC', fonte:{titulo:'Estimativa regional (teste)', url:null}, acesso:'2026-10-18', grau:'B'});")
        await pg.select_option('#f-pais', 'MEX'); await pg.wait_for_timeout(200)
        m = await ev(pg, "(()=>{const m=document.querySelector('[data-pc-l=inflacao] .marc'); return m?[m.dataset.origem, m.firstChild.textContent.trim(), m.title]:null;})()")
        ok(m[0] == 'regiao' and m[1] == 'estimado pela região' and 'Grau: B' in m[2] and 'Estimativa regional (teste)' in m[2], f'México sem dado próprio: "estimado pela região": {m}')
        ok(await ev(pg, "document.getElementById('pc-inflacao').value") in ('6', '6,0', '6.0'), 'e mostra o valor da região (6%)')
        await pg.fill('#pc-inflacao', '7'); await pg.wait_for_timeout(150)
        ok(await ev(pg, "document.querySelector('[data-pc-l=inflacao] .marc').dataset.origem") == 'usuario', 'editar o valor da região: "editado por você"')
        await pg.click('[data-pc-rest=inflacao]'); await pg.wait_for_timeout(250)
        ok(await ev(pg, "document.querySelector('[data-pc-l=inflacao] .marc').dataset.origem") == 'regiao', '"restaurar" volta ao valor da região')
        # Quênia não está em LAC: cai no valor ilustrativo global
        await pg.select_option('#f-pais', 'KEN'); await pg.wait_for_timeout(200)
        ok(await ev(pg, "document.querySelector('[data-pc-l=inflacao] .marc').dataset.origem") == 'ilustrativo', 'sem linha do país nem da região: valor ilustrativo (cadeia de recuo)')
        # campos sem dado nem padrão não ganham marcador nem valor inventado
        ok(await ev(pg, "document.querySelector('[data-pc-l=escolas] .marc')") is None and await ev(pg, "document.getElementById('pc-escolas').value") == '', 'escolas sem dado: campo vazio e sem marcador')
        # digitar num campo sem dado: editado; apagar o texto volta a "sem dado"
        await pg.fill('#pc-escolas', '1200'); await pg.wait_for_timeout(200)
        ok(await ev(pg, "document.querySelector('[data-pc-l=escolas] .marc').dataset.origem") == 'usuario' and await ev(pg, "S.caso.editados.escolas") == 1200, 'número de escolas digitado: "editado por você"')
        ok(await ev(pg, "document.querySelector('[data-pc-rest=escolas]').textContent.trim()") == 'apagar', 'sem valor na base, a ação é "apagar"')
        await pg.click('[data-pc-rest=escolas]'); await pg.wait_for_timeout(200)
        ok(await ev(pg, "document.querySelector('[data-pc-l=escolas] .marc')") is None, 'apagar remove o valor e o marcador')
        # mudar de país descarta as edições do perfil anterior
        await pg.fill('#pc-professores', '300'); await pg.wait_for_timeout(150)
        await pg.select_option('#f-pais', 'IDN'); await pg.wait_for_timeout(200)
        ok(await ev(pg, "Object.keys(S.caso.editados).length") == 0 and await ev(pg, "document.getElementById('pc-professores').value") == '', 'trocar de país descarta as edições do perfil')
        await ev(pg, "REFERENCIAS.referencias.pop(); paisPorIso('BRA').inflacao = null; render();")

        # ---------------------------------------------------------- premissasDoCaso e versaoReferencias na página
        pr = await ev(pg, "(()=>{carregarExemplo('A'); S.caso.pais='BRA'; S.custo.editado=false; return premissasDoCaso(S.caso, cfgAtual());})()")
        ok(len(pr) > 10 and all(k in pr[0] for k in ['campo', 'rotulo', 'valor', 'unidade', 'origem', 'fonte', 'ano', 'grau', 'foraDaFaixa']), 'premissasDoCaso na página devolve o contrato')
        ok({x['origem'] for x in pr} == {'ilustrativo'}, 'Brasil sem dados próprios: tudo ilustrativo')
        pr = await ev(pg, "(()=>{S.custo.editado=true; S.custo.cfg.saas.preco=20; return premissasDoCaso(S.caso, cfgAtual());})()")
        lic = [x for x in pr if x['campo'] == 'saas.preco'][0]
        ok(lic['origem'] == 'usuario' and lic['foraDaFaixa'] is True and lic['valor'] == 20, f'licença editada para 20: usuario e fora da faixa: {lic["origem"]}, {lic["foraDaFaixa"]}')
        vr = await ev(pg, "versaoReferencias()")
        ok(vr['referencias'] == '1.0.0' and vr['linhas'] >= 70 and vr['nPaises'] == 5 and vr['paises'] == '1.0.0', f'versaoReferencias: {vr["texto"]}')

        # ---------------------------------------------------------- faixa de referência no painel de custos (BL4.3)
        await ev(pg, "(()=>{carregarExemplo('A'); S.boasVindas=false; S.calcAberta=true; S.custo.abrirPrem=true; abrirFase('expansao','4b');})()", 400)
        n = await ev(pg, "document.querySelectorAll('#custos-box .rf').length")
        ok(n >= 15, f'o painel mostra a faixa de referência nos custos com linha na base ({n})')
        rf = await ev(pg, "(()=>{const e=document.querySelector('#custos-box [data-rf-path=\"saas.preco\"]'); return e?[e.className, e.innerText, e.title]:null;})()")
        ok(rf is not None and 'seu valor 9' in rf[1] and 'faixa de referência 8,55 a 10,35' in rf[1] and 'grau C' in rf[1] and 'fora' not in rf[0], f'licença: "seu valor · faixa de referência": {rf and rf[1]!r}')
        ok(rf is not None and 'US$ por licença por mês' in rf[2] and 'Convenção da ferramenta' in rf[2], 'a dica traz a unidade, a fonte e o grau')
        await ev(pg, "document.querySelector('#custos-box details[data-det=linhas]').open=true")
        sel = '#custos-box input[data-cfg="saas.preco"]'
        await pg.fill(sel, '20'); await pg.wait_for_timeout(150)
        rf = await ev(pg, "(()=>{const e=document.querySelector('#custos-box [data-rf-path=\"saas.preco\"]'); return [e.className, e.innerText];})()")
        ok('fora' in rf[0].split() and 'fora da faixa' in rf[1] and 'seu valor 20' in rf[1], f'valor 20: sinalizado como fora da faixa: {rf[1]!r}')
        await pg.fill(sel, '9,5'); await pg.wait_for_timeout(150)
        rf = await ev(pg, "document.querySelector('#custos-box [data-rf-path=\"saas.preco\"]').className")
        ok('fora' not in rf.split(), 'valor 9,5, dentro da faixa: sem sinal')
        await pg.fill(sel, '8'); await pg.press(sel, 'Tab'); await pg.wait_for_timeout(300)
        ok(await ev(pg, "document.querySelector('#custos-box [data-rf-path=\"saas.preco\"]').classList.contains('fora')") and await ev(pg, "S.custo.cfg.saas.preco") == 8, 'valor 8 (abaixo de 8,55): sinalizado e gravado depois de sair do campo')
        sal = '#custos-box input[data-cfg="salarios.eng_ml"]'
        await pg.fill(sal, '100000'); await pg.wait_for_timeout(150)
        ok(await ev(pg, "document.querySelector('#custos-box [data-rf-path=\"salarios.eng_ml\"]').classList.contains('fora')"), 'salário de ML de 100.000 (faixa 54.000 a 69.000): fora da faixa')
        ok((await ev(pg, "document.querySelector('#custos-box [data-rf-path=\"implantacao.0.valor\"]').innerText")).startswith('seu valor 40.000 · sem faixa de referência'), 'implantação (sem faixa conhecida): mostra o valor da base e não sinaliza')
        await pg.fill('#custos-box input[data-cfg="implantacao.0.valor"]', '400000'); await pg.wait_for_timeout(150)
        ok(not await ev(pg, "document.querySelector('#custos-box [data-rf-path=\"implantacao.0.valor\"]').classList.contains('fora')"), 'implantação 10 vezes maior: sem faixa, sem sinal')
        pct = await ev(pg, "document.querySelector('#custos-box [data-rf-path=\"implantacao.0.manutPct\"]').innerText")
        ok('15' in pct, f'manutenção em % usa a mesma unidade do campo: {pct!r}')
        ok(await ev(pg, "document.querySelector('#custos-box input[data-cfg=\"opc.pi\"]')") is not None and 'sem faixa de referência' in await ev(pg, "document.querySelector('#custos-box [data-rf-path=\"opc.pi\"]').innerText"), 'inflação no painel: valor da base, sem faixa')
        await pg.screenshot(path=TMP + '/painel_faixa.png')

        # ---------------------------------------------------------- 390 px, sem rolagem horizontal
        pm = await b.new_page(viewport={'width': 390, 'height': 800})
        await pm.goto('file://' + ARQ); await pm.evaluate('localStorage.clear()'); await pm.reload(); await pm.wait_for_timeout(300)
        await pm.select_option('#sel-lang', 'pt'); await pm.wait_for_timeout(150)
        await pm.click('[data-act="comecar"]'); await pm.wait_for_timeout(250)
        await pm.evaluate("(()=>{carregarExemplo('novo'); S.boasVindas=false; abrirFase('contexto','1a');})()"); await pm.wait_for_timeout(250)
        await pm.select_option('#f-pais', 'BRA'); await pm.wait_for_timeout(250)
        await pm.fill('#pc-inflacao', '3,5'); await pm.wait_for_timeout(200)
        await pm.evaluate("document.querySelector('.pais-q').scrollIntoView()")
        larg = await pm.evaluate("[document.documentElement.scrollWidth, window.innerWidth, document.body.scrollWidth]")
        ok(larg[0] <= larg[1] and larg[2] <= larg[1], f'390 px, passo 1.1 com o país escolhido: sem rolagem horizontal {larg}')
        fora = await pm.evaluate("[...document.querySelectorAll('.pais-q *')].filter(e=>{const r=e.getBoundingClientRect(); return r.width>0 && (r.right>window.innerWidth+1 || r.left<-1);}).map(e=>e.tagName+'.'+e.className).slice(0,5)")
        ok(not fora, f'nada do bloco do país passa da largura da tela: {fora}')
        cols = await pm.evaluate("getComputedStyle(document.querySelector('.pc-grade')).gridTemplateColumns.split(' ').length")
        ok(cols == 1, f'uma coluna de campos em 390 px ({cols})')
        await pm.screenshot(path=TMP + '/pais_390.png')
        await pm.evaluate("(()=>{carregarExemplo('A'); S.boasVindas=false; S.calcAberta=true; S.custo.abrirPrem=true; abrirFase('expansao','4b');})()"); await pm.wait_for_timeout(400)
        await pm.evaluate("document.querySelector('#custos-box details[data-det=linhas]').open=true"); await pm.wait_for_timeout(150)
        larg = await pm.evaluate("[document.documentElement.scrollWidth, window.innerWidth]")
        ok(larg[0] <= larg[1], f'390 px, painel de custos com as faixas de referência: sem rolagem horizontal da página {larg}')
        await pm.screenshot(path=TMP + '/painel_390.png')
        await pm.close()

        # ---------------------------------------------------------- idiomas: sem português no bloco do país
        for lang in ['en', 'es', 'fr']:
            await abrir(pg, lang); await pg.click('[data-act="comecar"]'); await pg.wait_for_timeout(250); await passo11(pg)
            await pg.select_option('#f-pais', 'BRA'); await pg.wait_for_timeout(250)
            await pg.fill('#pc-inflacao', '3,5'); await pg.wait_for_timeout(200)
            txt = await ev(pg, "document.querySelector('.pais-q').innerText")
            txt += ' ' + ' '.join(await ev(pg, "[...document.querySelectorAll('.pais-q [title], .pais-q [aria-label]')].map(e=>(e.title||'')+' '+(e.getAttribute('aria-label')||''))"))
            sobras = sorted(set(m.group(0).lower() for m in PT.finditer(txt)))
            ok(not sobras, f'{lang}: sem restos de português no bloco do país: {sobras}')
            marc = await ev(pg, "document.querySelector('[data-pc-l=inflacao] .marc').firstChild.textContent.trim()")
            ok(marc != 'editado por você', f'{lang}: marcador traduzido: {marc!r}')
        # painel de custos em inglês: faixa de referência traduzida
        await ev(pg, "(()=>{carregarExemplo('A'); S.boasVindas=false; S.calcAberta=true; S.custo.abrirPrem=true; abrirFase('expansao','4b');})()", 400)
        rft = await ev(pg, "document.querySelector('#custos-box [data-rf-path=\"saas.preco\"]').innerText")
        ok('plage de référence' in rft and 'faixa' not in rft, f'fr: faixa de referência traduzida: {rft!r}')

        # ---------------------------------------------------------- o país é parte do caso salvo e exportado
        await abrir(pg); await pg.click('[data-act="comecar"]'); await pg.wait_for_timeout(250); await passo11(pg)
        await pg.select_option('#f-pais', 'KEN'); await pg.fill('#pc-professores', '250'); await pg.wait_for_timeout(300)
        dc = await ev(pg, "dadosCaso().caso")
        ok(dc['pais'] == 'KEN' and dc['editados'] == {'professores': 250}, f'dadosCaso exporta o país e as edições: {dc["pais"]}, {dc["editados"]}')
        await ev(pg, "carregarExemplo('novo')")
        ok(await ev(pg, "S.caso.pais===''"), 'caso em branco sem país')
        await ev(pg, "importarCaso(JSON.stringify(Object.assign(dadosCaso(), {caso: Object.assign(dadosCaso().caso, {pais:'MAR', editados:{professores:90}})})))")
        ok(await ev(pg, "[S.caso.pais, S.caso.editados.professores]") == ['MAR', 90], 'importar o caso traz o país e as edições de volta')

        ok(not erros, f'sem erros no console: {erros[:3]}')
        await b.close()
    print('\n%d falhas' % len(falhas)); sys.exit(1 if falhas else 0)

asyncio.run(main())
