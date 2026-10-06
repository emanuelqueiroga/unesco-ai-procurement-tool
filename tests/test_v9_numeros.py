# Teste P4 (v9): números formatados enquanto se digita, ✓ dentro do valor e migração da v8.
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
            chk(r['ok'] and r['v'] == 9, f'{nome}: importado e convertido para a versão 9')
            chk('g-equipe' not in r['resp'] and not any(re.match(r'[rpis]-', k) for k in r['resp']), f'{nome}: resp sem g-equipe nem r-/p-/i-/s-')
            chk(all(k not in r['caso'] for k in ['classes', 'autonomia', 'dados', 'arquitetura', 'populacao', 'capacidade', 'pilotoGratuito']), f'{nome}: campos legados retirados do caso')
            chk(all('porAno' not in e for e in r['ctx'].get('etapas', {}).values()), f'{nome}: porAno retirado das etapas')
            o = json.loads(txt)
            if nome == 'caso_v8_branco_parcial.json':
                c = r['caso']
                chk(c['tarefas'] == ['alerta_precoce'], f'{nome}: classes previsao+apoio → tarefa alerta_precoce (veio {c["tarefas"]})')
                chk(c['fonte'] == 'parcial', f'{nome}: g-orcamento parcial → fonte parcial (veio {c["fonte"]!r})')
                chk(r['ctx']['etapas']['fund1'].get('soTotal') is True, f'{nome}: fund1 só com total → soTotal true')
                chk(r['ctx']['etapas']['fund2'].get('soTotal') is False, f'{nome}: fund2 por ano → soTotal false')
                chk(r['resp'].get('g-comite') == 'nao' and r['resp'].get('g-politica') == 'nao_sei', f'{nome}: g-comite mantido e na → nao_sei')
                chk(c['teste'] == 'recomendar' and c['situacao'] == 'nova', f'{nome}: situacao testar → teste recomendar e situacao nova')
                chk(c['piloto'] == {'escolas': 5, 'participantes': 300, 'meses': 3}, f'{nome}: S.piloto → caso.piloto')
                chk(r['respC'].get('tarefas') is True and r['respC'].get('teste') is True and r['respC'].get('fonte') is True, f'{nome}: respC de tarefas, teste e fonte')
                chk(c['elegiveis'] == '', f'{nome}: elegíveis padrão da v8 não vira resposta')
            if nome == 'caso_v8_B.json':
                c = r['caso']
                chk(c['tarefas'] == ['tutoria'] and c['tipoTec'] == 'aberta' and c['adaptacao'] == 'sob_medida' and c['pagamento'] == 'consumo' and c['arquiteturaManual'] == 'ow',
                    f'{nome}: ow → tutoria/aberta/sob_medida/consumo/ow')
                chk(c['fonte'] == 'nao' and c['alternativa'] == 'sim', f'{nome}: fonte nao e alternativa sim')
            if nome == 'caso_v8_D.json':
                c = r['caso']
                chk(c['tarefas'] == ['duvidas'] and c['pagamento'] == 'gratuito' and c['tipoTec'] == 'paga', f'{nome}: D → duvidas, gratuito, paga')
            # exportar e reimportar dá o mesmo caso
            ida = await pg.evaluate("() => { const a = JSON.stringify(S.caso); const d = JSON.stringify(dadosCaso()); importarCaso(d); return [a, JSON.stringify(S.caso), JSON.parse(d)]; }")
            chk(ida[0] == ida[1], f'{nome}: exportar e reimportar preserva o caso')
            chk(ida[2].get('app') == 'ai-education-procurement-tool' and ida[2].get('formato') == 9, f'{nome}: exportação no formato 9')
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
        chk(r['v'] == 9, 'localStorage v8: S.versao === 9')
        chk(r['caso']['tarefas'] == ['alerta_precoce'] and r['caso']['fonte'] == 'parcial', 'localStorage v8: tarefas e fonte convertidas')
        chk(r['ctx']['etapas']['fund1'].get('soTotal') is True, 'localStorage v8: fund1.soTotal === true')
        chk('g-equipe' not in r['resp'], 'localStorage v8: resp sem g-equipe')
        chk(r['nova'] and r['velha'], 'localStorage v8: grava na chave v9 e mantém a antiga')

        chk(not erros, 'sem erros de console: ' + ' | '.join(erros[:5]))
        await b.close()
    print(f'verificações: {len(OK)} ok, {len(FALHAS)} falhas')
    sys.exit(1 if FALHAS else 0)

asyncio.run(main())
