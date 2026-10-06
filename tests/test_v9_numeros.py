# Teste P4 (v9): números formatados enquanto se digita, ✓ dentro do valor e migração da v8.
# v11 (S2): campos numéricos novos (2.4.2, 2.5.4, 3.1.1, preço na lista de ferramentas) e migração v10 → v11
# (exportação e localStorage), com formato 11 na exportação.
# Rodar a partir de /home/claude/app depois de `bash build.sh`:  python3 tests/test_v9_numeros.py
import asyncio, json, os, re, sys
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIX = os.path.join(RAIZ, 'tests', 'fixtures')
os.makedirs('/tmp/claude-0', exist_ok=True)
SK = '<!doctype html><html><head><meta charset=utf8></head><body>' + open(os.path.join(RAIZ, 'navegador.html')).read() + '</body></html>'
ARQ = '/tmp/claude-0/nav_v9_numeros.html'
open(ARQ, 'w').write(SK)

OK, FALHAS = [], []
def chk(cond, msg):
    (OK if cond else FALHAS).append(msg)
    if not cond: print('FALHA:', msg)

ESP = re.compile('[    ]')
ESPERADO = {'pt': '160.000', 'en': '160,000', 'es': '160.000', 'fr': '160 000'}
MEIO = {'pt': '1.650.000', 'en': '1,650,000', 'es': '1.650.000', 'fr': '1 650 000'}
DEC = {'pt': ('0,5', '0,5'), 'en': ('0.5', '0.5'), 'es': ('0,5', '0,5'), 'fr': ('0,5', '0,5')}

# abre o passo 1.1 com a etapa fund2 marcada e devolve o seletor do primeiro campo por ano (ou de estudantes)
PREP_CTX = """(() => {
  carregarExemplo('novo'); S.boasVindas = false;
  S.ctx.etapas = S.ctx.etapas || {}; S.ctx.etapas.fund2 = Object.assign({ on: true, escolas: '', anos: [], alunos: '' }, S.ctx.etapas.fund2 || {}, { on: true });
  S.fase = 'contexto'; S.passo = '1a'; S.vista = ''; render();
  const xs = [...document.querySelectorAll('input[data-num]')].filter(i => /fund2/.test(i.dataset.ctxn || i.dataset.fn || ''));
  const alvo = xs.find(i => /anos|alunos/.test(i.dataset.ctxn || i.dataset.fn || '')) || xs[0];
  if (!alvo) return null;
  if (!alvo.id) alvo.id = 'teste-num-alvo';
  return { id: alvo.id, path: alvo.dataset.ctxn || alvo.dataset.fn };
})()"""
LER_CTX = """(p => { const ks = p.split('.'); let o = S.ctx; for (const k of ks) { if (o == null) return undefined; o = o[k]; } return o; })"""
OK_VISIVEL = """(id => { const i = document.getElementById(id); const ok = i && i.parentElement && i.parentElement.querySelector('.ok-in');
  if (!ok) return null; const cs = getComputedStyle(ok); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0; })"""
PREP_CALC = """(() => {
  carregarExemplo('B'); S.boasVindas = false; S.vista = ''; render();
  let box = document.getElementById('custos-box');
  if (!box) { box = document.createElement('div'); box.id = 'custos-box'; document.querySelector('#main').appendChild(box); }
  box.innerHTML = renderCustos(); renderCustosResultados();
  document.querySelectorAll('#custos-box details').forEach(d => d.open = true);
  const i = document.querySelector('#custos-box input[data-cfg="opc.pi"]');
  if (!i) return null; i.id = 'teste-dec'; return i.dataset.num;
})()"""

async def digitar_vazio(pg, sel, texto):
    await pg.click(sel)
    await pg.evaluate("id => { const i = document.getElementById(id); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); }", sel[1:])
    await pg.keyboard.type(texto, delay=15)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1400, 'height': 900})
        erros = []
        pg.on('pageerror', lambda e: erros.append(str(e)))
        pg.on('console', lambda m: erros.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)  # fontes externas não carregam sem rede
        await pg.goto('file://' + ARQ); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
        chk(await pg.evaluate('LANG') == 'en', 'idioma inicial é en')

        for lang in ['pt', 'en', 'es', 'fr']:
            await pg.select_option('#sel-lang', lang); await pg.wait_for_timeout(150)
            alvo = await pg.evaluate(PREP_CTX)
            chk(alvo is not None, f'{lang}: há campo numérico formatado (data-num) por etapa em 1.1.5')
            if not alvo: continue
            sel = '#' + alvo['id']
            chk(await pg.evaluate(f"document.querySelector('{sel}').type") == 'text', f'{lang}: campo numérico é type=text')
            vis0 = await pg.evaluate(OK_VISIVEL, alvo['id'])
            await digitar_vazio(pg, sel, '160000')
            v = await pg.input_value(sel)
            chk(ESP.sub(' ', v) == ESPERADO[lang], f'{lang}: 160000 vira {ESPERADO[lang]!r} (veio {v!r})')
            pos = await pg.evaluate(f"document.querySelector('{sel}').selectionStart")
            chk(pos == len(v), f'{lang}: cursor no fim ({pos} de {len(v)})')
            est = await pg.evaluate(LER_CTX + f"('{alvo['path']}')")
            chk(est == 160000, f'{lang}: estado guarda número puro 160000 (veio {est!r})')
            vis1 = await pg.evaluate(OK_VISIVEL, alvo['id'])
            chk(vis1 is True, f'{lang}: ✓ visível dentro do campo preenchido')
            chk(vis0 is False, f'{lang}: ✓ oculto no campo vazio (veio {vis0})')
            # dígito no meio: depois do "16"
            await pg.evaluate(f"(() => {{ const i = document.querySelector('{sel}'); i.focus(); i.setSelectionRange(2, 2); }})()")
            await pg.keyboard.type('5')
            v2 = await pg.input_value(sel)
            pos2 = await pg.evaluate(f"document.querySelector('{sel}').selectionStart")
            chk(ESP.sub(' ', v2) == MEIO[lang], f'{lang}: inserir 5 no meio dá {MEIO[lang]!r} (veio {v2!r})')
            chk(re.sub(r'\D', '', v2[:pos2]) == '165', f'{lang}: cursor fica depois do dígito inserido (antes do cursor: {v2[:pos2]!r})')
            await pg.keyboard.press('Tab'); await pg.wait_for_timeout(80)
            est2 = await pg.evaluate(LER_CTX + f"('{alvo['path']}')")
            chk(est2 == 1650000, f'{lang}: estado depois do change = 1650000 (veio {est2!r})')
            # calculadora: campo decimal
            tipo = await pg.evaluate(PREP_CALC)
            chk(tipo == 'dec', f'{lang}: campo da calculadora é decimal (data-num={tipo!r})')
            if tipo:
                digit, esperado = DEC[lang]
                await digitar_vazio(pg, '#teste-dec', digit)
                vd = await pg.input_value('#teste-dec')
                chk(vd == esperado, f'{lang}: calculadora aceita {digit!r} (veio {vd!r})')
                await pg.keyboard.press('Tab'); await pg.wait_for_timeout(80)
                pi = await pg.evaluate('cfgAtual().opc.pi')
                chk(abs((pi or 0) - 0.005) < 1e-12, f'{lang}: inflação 0,5% gravada como 0.005 (veio {pi!r})')
        # reformatação ao trocar de idioma
        await pg.select_option('#sel-lang', 'pt'); await pg.wait_for_timeout(100)
        alvo = await pg.evaluate(PREP_CTX)
        if alvo:
            await digitar_vazio(pg, '#' + alvo['id'], '160000'); await pg.keyboard.press('Tab')
            await pg.select_option('#sel-lang', 'en'); await pg.wait_for_timeout(150)
            await pg.evaluate("(() => { S.fase = 'contexto'; S.passo = '1a'; render(); })()")
            v = await pg.evaluate(f"(() => {{ const i = [...document.querySelectorAll('input[data-num]')].find(x => (x.dataset.ctxn || x.dataset.fn) === '{alvo['path']}'); return i && i.value; }})()")
            chk(v == '160,000', f'troca pt→en reformata o campo (veio {v!r})')

        # ---- migração: importar exportações da v8
        await pg.select_option('#sel-lang', 'pt'); await pg.wait_for_timeout(100)
        for nome in sorted(os.listdir(FIX)):
            if not nome.startswith('caso_v8_'): continue
            txt = open(os.path.join(FIX, nome)).read()
            r = await pg.evaluate("t => { const ok = importarCaso(t); return { ok, v: S.versao, caso: S.caso, ctx: S.ctx, resp: S.resp, respC: S.respC }; }", txt)
            chk(r['ok'] and r['v'] == 11, f'{nome}: importado e convertido para a versão 11')
            chk('g-equipe' not in r['resp'] and not any(re.match(r'[rpis]-', k) for k in r['resp']), f'{nome}: resp sem g-equipe nem r-/p-/i-/s-')
            chk(all(k not in r['caso'] for k in ['classes', 'autonomia', 'dados', 'populacao', 'capacidade', 'pilotoGratuito', 'pagaDepois', 'fonte', 'infra', 'arquiteturaManual', 'teste']), f'{nome}: campos legados retirados do caso')
            chk(r['caso'].get('arquitetura', '') in ('', 'saas', 'api', 'ow', 'nao_sei'), f'{nome}: arquitetura v11 válida ({r["caso"].get("arquitetura")!r})')
            chk(all('porAno' not in e for e in r['ctx'].get('etapas', {}).values()), f'{nome}: porAno retirado das etapas')
            o = json.loads(txt)
            if nome == 'caso_v8_branco_parcial.json':
                c = r['caso']
                chk(c['tarefas'] == ['alerta_precoce'], f'{nome}: classes previsao+apoio → tarefa alerta_precoce (veio {c["tarefas"]})')
                chk('fonte' not in c, f'{nome}: fonte de recursos removida na v11')
                chk(r['ctx']['etapas']['fund1'].get('soTotal') is True, f'{nome}: fund1 só com total → soTotal true')
                chk(r['ctx']['etapas']['fund2'].get('soTotal') is False, f'{nome}: fund2 por ano → soTotal false')
                chk(r['resp'].get('g-comite') == 'nao' and r['resp'].get('g-politica') == 'nao_sei', f'{nome}: g-comite mantido e na → nao_sei')
                chk(c['testes'] == ['recomendar'] and c['situacao'] == 'nova', f'{nome}: situacao testar → testes [recomendar] e situacao nova')
                chk(c['piloto'] == {'escolas': 5, 'participantes': 300, 'meses': 3}, f'{nome}: S.piloto → caso.piloto')
                chk(r['respC'].get('tarefas') is True and r['respC'].get('testes') is True and 'fonte' not in r['respC'] and 'teste' not in r['respC'], f'{nome}: respC de tarefas e testes, sem teste nem fonte')
                chk(c['elegiveis'] == '', f'{nome}: elegíveis padrão da v8 não vira resposta')
            if nome == 'caso_v8_B.json':
                c = r['caso']
                chk(c['tarefas'] == ['tutoria'] and c['tipoTec'] == 'aberta' and c['adaptacao'] == 'sob_medida' and c['pagamento'] == 'consumo' and c['arquitetura'] == 'ow',
                    f'{nome}: ow → tutoria/aberta/sob_medida/consumo/arquitetura ow')
                chk('fonte' not in c and c['alternativa'] == 'sim', f'{nome}: sem fonte e alternativa sim')
            if nome == 'caso_v8_D.json':
                c = r['caso']
                chk(c['tarefas'] == ['duvidas'] and c['pagamento'] == 'gratuito' and c['tipoTec'] == 'paga', f'{nome}: D → duvidas, gratuito, paga')
            # exportar e reimportar dá o mesmo caso
            ida = await pg.evaluate("() => { const a = JSON.stringify(S.caso); const d = JSON.stringify(dadosCaso()); importarCaso(d); return [a, JSON.stringify(S.caso), JSON.parse(d)]; }")
            chk(ida[0] == ida[1], f'{nome}: exportar e reimportar preserva o caso')
            chk(ida[2].get('app') == 'ai-education-procurement-tool' and ida[2].get('formato') == 11, f'{nome}: exportação no formato 11')
            # o plano é gerado sem erro
            try:
                await pg.evaluate("secoesPlano().length")
                chk(True, f'{nome}: secoesPlano() roda')
            except Exception as e:
                chk(False, f'{nome}: secoesPlano() falhou: {e}')
        r = await pg.evaluate("importarCaso('{\"app\":\"outro\"}')")
        chk(r is False, 'arquivo de outro formato é recusado')

        # ---- migração do localStorage antigo
        txt = open(os.path.join(FIX, 'localStorage_v8_branco_parcial.json')).read()
        await pg.evaluate("t => { localStorage.clear(); localStorage.setItem('navegador-ia-educacao-v4', t); }", txt)
        await pg.reload(); await pg.wait_for_timeout(400)
        r = await pg.evaluate("({ v: S.versao, caso: S.caso, ctx: S.ctx, resp: S.resp, nova: !!localStorage.getItem('aiedu-procurement-v9'), velha: !!localStorage.getItem('navegador-ia-educacao-v4') })")
        chk(r['v'] == 11, 'localStorage v8: S.versao === 11')
        chk(r['caso']['tarefas'] == ['alerta_precoce'] and 'fonte' not in r['caso'] and r['caso']['testes'] == ['recomendar'], 'localStorage v8: tarefas e testes convertidos, sem fonte')
        chk(r['ctx']['etapas']['fund1'].get('soTotal') is True, 'localStorage v8: fund1.soTotal === true')
        chk('g-equipe' not in r['resp'], 'localStorage v8: resp sem g-equipe')
        chk(r['nova'] and r['velha'], 'localStorage v8: grava na chave v9 e mantém a antiga')

        # ---- v11: migração v10 → v11 (exportação da v10 e estado salvo no localStorage)
        V10_OK = """(() => { const c = S.caso, rc = S.respC;
          return { testes: c.testes, poc: c.poc, piloto: c.piloto, internet: c.internet, disp: c.dispExistem, arq: c.arquitetura,
            removidos: ['teste', 'pagaDepois', 'fonte', 'infra', 'arquiteturaManual'].filter(k => k in c),
            rc: ['testes', 'poc.participantes', 'poc.meses', 'arquitetura', 'internet', 'dispExistem'].filter(k => rc[k]),
            rcVelhos: ['teste', 'infra', 'arquiteturaManual', 'pagaDepois', 'fonte', 'piloto.participantes'].filter(k => rc[k]),
            impl: c.implantacao, implC: !!rc['implantacao.pessoas'], eleg: c.elegiveis, pag: c.pagamento, pagSug: sugerido(CAMPO_POR_ID.pagamento),
            fase: S.fase, passo: S.passo, feitos: Object.keys(S.feitos).sort(), v: S.versao, ce: casoAtual().teste }; })()"""
        def conferir_v10(r, nome):
            chk(r['v'] == 11, f'{nome}: versão 11')
            chk(r['testes'] == ['poc'] and r['ce'] == 'poc', f'{nome}: teste poc → testes [poc] (casoEfetivo: {r["ce"]!r})')
            chk(r['poc'] == {'participantes': 20, 'meses': 3} and r['piloto']['participantes'] == '', f'{nome}: tamanho da PoC da v10 → caso.poc ({r["poc"]}, {r["piloto"]})')
            chk(r['internet'] == 'parcial' and r['disp'] == 'parcial', f'{nome}: infra complementar → internet e dispositivos parciais')
            chk(r['arq'] == 'api', f'{nome}: arquiteturaManual → arquitetura ({r["arq"]!r})')
            chk(not r['removidos'], f'{nome}: campos removidos fora do caso ({r["removidos"]})')
            chk(set(r['rc']) == {'testes', 'poc.participantes', 'poc.meses', 'arquitetura', 'internet', 'dispExistem'} and not r['rcVelhos'], f'{nome}: confirmações migradas {r["rc"]} / restos {r["rcVelhos"]}')
            chk(r['impl']['pessoas'] == 5000 and r['implC'] and r['eleg'] == 5000, f'{nome}: expansão no 1º ano → primeira etapa com as 5.000 pessoas, confirmada ({r["impl"]})')
            chk(r['pag'] == 'institucional' and r['pagSug'], f'{nome}: sugestão não confirmada da v10 continua "sugerido"')
        txt = open(os.path.join(FIX, 'caso_v10_poc.json')).read()
        r = await pg.evaluate("t => { importarCaso(t); render(); return " + V10_OK + "; }", txt)
        conferir_v10(r, 'exportação v10')
        chk(r['fase'] == 'contexto', 'exportação v10: importação abre o 1.1')
        ida = await pg.evaluate("() => { const d = JSON.stringify(dadosCaso()); importarCaso(d); return [JSON.parse(d).formato, " + V10_OK + "]; }")
        chk(ida[0] == 11 and ida[1]['poc'] == {'participantes': 20, 'meses': 3} and ida[1]['impl']['pessoas'] == 5000, 'exportação v11 reimportada sem nova migração')
        txt = open(os.path.join(FIX, 'localStorage_v10_poc.json')).read()
        await pg.evaluate("t => { localStorage.clear(); localStorage.setItem('aiedu-procurement-v9', t); }", txt)
        await pg.reload(); await pg.wait_for_timeout(400)
        chk(await pg.evaluate("!!SALVO && S.boasVindas===true"), 'localStorage v10: caso salvo oferecido nas boas-vindas')
        await pg.evaluate("continuarSalvo()"); await pg.wait_for_timeout(300)
        r = await pg.evaluate(V10_OK)
        conferir_v10(r, 'localStorage v10')
        chk(r['fase'] == 'expansao' and r['passo'] == '4b' and r['feitos'] == ['2a', '4b', '4c'], f'localStorage v10: passo 3.3 → 4.2, feitos 3.3/3.4 → 4.2/4.3 (2.1 mantido) ({r["fase"]}, {r["passo"]}, {r["feitos"]})')
        chk(await pg.evaluate("JSON.parse(localStorage.getItem('aiedu-procurement-v9')).versao") == 11, 'localStorage v10: estado regravado na versão 11')

        # ---- v11: campos numéricos novos formatados enquanto se digita
        NOVOS = [('#f-escolasInternet', "(()=>{S.caso.internet='parcial'; S.respC.internet=true; abrirFase('piloto','2d');})()", 'S.caso.escolasInternet', '12345', 12345),
                 ('#f-formacaoHoras', "abrirFase('piloto','2e')", 'S.caso.formacaoHoras', '1200', 1200),
                 ('#im-pessoas', "abrirFase('implantacao','3a')", 'S.caso.implantacao.pessoas', '25000', 25000)]
        FMT = {'pt': {12345: '12.345', 1200: '1.200', 25000: '25.000'}, 'en': {12345: '12,345', 1200: '1,200', 25000: '25,000'}, 'fr': {12345: '12 345', 1200: '1 200', 25000: '25 000'}}
        for lang in ['pt', 'en', 'fr']:
            await pg.select_option('#sel-lang', lang); await pg.wait_for_timeout(120)
            await pg.evaluate("(()=>{carregarExemplo('novo'); S.boasVindas=false; S.ctx.etapas={fund2:{on:true,escolas:600,soTotal:true,alunos:150000}}; render();})()"); await pg.wait_for_timeout(120)
            for sel, abrir, campo, dig, num in NOVOS:
                await pg.evaluate(abrir); await pg.wait_for_timeout(150)
                await digitar_vazio(pg, sel, dig)
                v = await pg.input_value(sel)
                chk(ESP.sub(' ', v) == FMT[lang][num], f'{lang}: {sel} formata {dig} como {FMT[lang][num]!r} (veio {v!r})')
                await pg.keyboard.press('Tab'); await pg.wait_for_timeout(100)
                chk(await pg.evaluate(campo) == num, f'{lang}: {campo} = {num} (número puro)')
            # preço por usuário por mês (decimal) numa linha da lista de ferramentas
            await pg.evaluate("(()=>{S.caso.conheceFerramentas='sim'; S.respC.conheceFerramentas=true; S.caso.ferramentas=[{nome:'A',tarefas:[],tipoTec:'',pagamento:'',preco:''}]; abrirFase('piloto','2c');})()"); await pg.wait_for_timeout(150)
            await digitar_vazio(pg, '#fe-0-preco', '12.5' if lang == 'en' else '12,5')
            await pg.keyboard.press('Tab'); await pg.wait_for_timeout(100)
            chk(await pg.evaluate("S.caso.ferramentas[0].preco") == 12.5, f'{lang}: preço da ferramenta gravado como 12.5')
            chk(await pg.evaluate("document.getElementById('fe-0-preco').dataset.num") == 'dec', f'{lang}: preço é campo decimal')

        chk(not erros, 'sem erros de console: ' + ' | '.join(erros[:5]))
        await b.close()
    print(f'verificações: {len(OK)} ok, {len(FALHAS)} falhas')
    sys.exit(1 if FALHAS else 0)

asyncio.run(main())
