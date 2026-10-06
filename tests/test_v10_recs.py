# Recomendações para o seu caso (v10, pacote R2): motor de regras, passo 3.4, seção do plano e PDF.
# Uso: python3 tests/test_v10_recs.py   (depois de bash build.sh; NAV=<arquivo> testa outro build)
# Verifica:
#  - exemplos A–D: lista não vazia, itens completos (quando, tipo, prioridade, texto curto, porque.n, ir), sem duplicatas,
#    ordenada por prioridade e momento, com ações específicas de cada caso (ex.: D, piloto gratuito → custos adiados);
#  - os quatro exemplos geram listas diferentes;
#  - caso em branco: nenhuma recomendação; depois de marcar "paga" + "por usuário" (cliques no 2.3), aparece a
#    ação da licença por usuário com porque 2.3.2; governança "Não" no 1.3.4 gera a ação de política de dados;
#  - todo "Ir à pergunta" leva a uma pergunta que existe; o clique no passo 3.4 e no plano abre a pergunta;
#  - passo 3.4 mostra um item por recomendação, agrupado por momento, com a contagem por tipo;
#  - plano: seção "recs" depois do resumo e antes do bloco A (página e Markdown);
#  - EN: passo 3.4 e seção do plano sem português; PDF (pdftotext) com a seção antes do bloco A e sem português nela
#    (o PDF inteiro é verificado por tests/test_v9_plano.py).
import asyncio, os, re, subprocess, sys
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAV = os.environ.get('NAV', os.path.join(RAIZ, 'navegador.html'))
TMP = '/tmp/claude-0/v10_recs'
os.makedirs(TMP, exist_ok=True)
SK = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>' + open(NAV).read() + '</body></html>'
open(f'{TMP}/nav.html', 'w').write(SK)
PT = re.compile(r'ção|ções|ã|õ|\b(?:não|você|para o|do caso|também|custo|orçament|decisão)\b', re.I)
IGNORAR = ('Cátedra', 'Desplugada', 'Tutor de matemática')
ESPERADO = {   # ações que cada exemplo deve gerar (casos.js)
    'A': ['lic-institucional', 'etapas', 'integracao', 'fonte-parcial', 'g-comite'],
    'B': ['consumo-limites', 'consumo-monitorar', 'sob-medida', 'aberta-operacao', 'dados-acordo', 'dados-impacto', 'supervisao', 'contestacao', 'fonte-nao'],
    'C': ['tecnologia', 'teste-recomendado', 'alternativa', 'paga-indefinido', 'supervisao'],
    'D': ['gratis-adiados', 'gratis-fim', 'gratis-ativos', 'termos', 'sob-medida'],
}
falhas = []

def ok(cond, msg):
    print(('ok   ' if cond else 'FALHA ') + msg)
    if not cond: falhas.append(msg)

def resto_pt(txt):
    return [l.strip() for l in txt.split('\n') if PT.search(l) and not any(x in l for x in IGNORAR)]

RECS = "(()=>recomendacoesCaso())()"
VALIDA = """(() => { const R = recomendacoesCaso(); const err = [];
  const Q = ['antes_teste', 'antes_contratar', 'manter'], P = ['alta', 'media'];
  const ids = new Set(), txt = new Set();
  R.forEach((r, i) => {
    if (!Q.includes(r.quando)) err.push(r.id + ' quando ' + r.quando);
    if (!['custo', 'politica'].includes(r.tipo)) err.push(r.id + ' tipo ' + r.tipo);
    if (!P.includes(r.prioridade)) err.push(r.id + ' prioridade ' + r.prioridade);
    if (!r.texto || r.texto.split(/\\s+/).length > 30) err.push(r.id + ' texto longo ou vazio');
    if (!r.porque || !/^\\d\\.\\d(\\.\\d+)?$/.test(r.porque.n || '') || !r.porque.pergunta || !r.porque.resposta) err.push(r.id + ' porque incompleto');
    if (!/^(contexto|piloto|custo):\\w+:[\\d-]+$/.test(r.ir || '')) err.push(r.id + ' ir ' + r.ir);
    else if (r.ir.split(':')[2] !== r.porque.n.replace(/\\./g, '-')) err.push(r.id + ' ir não bate com porque.n');
    if (ids.has(r.id) || txt.has(r.texto)) err.push(r.id + ' duplicada'); ids.add(r.id); txt.add(r.texto);
    if (/UNESCO/.test(r.texto)) err.push(r.id + ' cita a UNESCO');
    if (i) { const a = R[i - 1]; const ka = P.indexOf(a.prioridade) * 10 + Q.indexOf(a.quando), kb = P.indexOf(r.prioridade) * 10 + Q.indexOf(r.quando); if (kb < ka) err.push(r.id + ' fora de ordem'); }
  });
  return { n: R.length, ids: R.map(r => r.id), err, irs: [...new Set(R.map(r => r.ir))] }; })()"""

async def carregar(pg, ex):
    await pg.evaluate(f"(()=>{{carregarExemplo('{ex}'); S.boasVindas=false; S.vista=''; render();}})()")
    await pg.wait_for_timeout(120)

async def ir_existe(pg, ir):
    f, p, q = ir.split(':')
    return await pg.evaluate(f"(()=>{{abrirFase('{f}','{p}','{q}'); return S.passo==='{p}' && !!document.getElementById('q-{q}');}})()")

async def abrir_plano(pg):
    await pg.evaluate("(()=>{S.vista='';render();})()")
    await pg.locator('[data-act="gerar-plano"]:visible').first.click()
    await pg.wait_for_timeout(250)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1360, 'height': 900}, accept_downloads=True)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') and 'TUNNEL' not in m.text else None)
        await pg.goto(f'file://{TMP}/nav.html'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
        await pg.select_option('#sel-lang', 'pt'); await pg.wait_for_timeout(150)

        # 1. motor de regras nos exemplos A–D
        listas = {}
        for ex in ['A', 'B', 'C', 'D']:
            await carregar(pg, ex)
            r = await pg.evaluate(VALIDA)
            listas[ex] = r['ids']
            ok(r['n'] > 0, f'{ex}: {r["n"]} recomendações')
            ok(not r['err'], f'{ex}: itens completos, curtos, sem duplicata e ordenados {r["err"][:4]}')
            falta = [i for i in ESPERADO[ex] if i not in r['ids']]
            ok(not falta, f'{ex}: ações específicas do caso presentes (faltam {falta})')
            ruins = []
            for ir in r['irs']:
                if not await ir_existe(pg, ir): ruins.append(ir)
            ok(not ruins, f'{ex}: todo "Ir à pergunta" leva a uma pergunta existente {ruins[:3]}')
        ok(len({tuple(sorted(v)) for v in listas.values()}) == 4, 'A–D: listas diferentes entre os casos')
        ok('gratis-adiados' not in listas['A'] and 'consumo-limites' not in listas['A'], 'A: sem ações de gratuidade nem de consumo')

        # 2. caso em branco: nada; depois de marcar no percurso, ações do que foi marcado
        await carregar(pg, 'novo')
        ok(await pg.evaluate(RECS) == [], 'novo: nenhuma recomendação antes de responder')
        await pg.evaluate("abrirFase('piloto','2c')"); await pg.wait_for_timeout(150)
        await pg.locator('input[name="tipoTec"][value="paga"]').check(force=True); await pg.wait_for_timeout(150)
        await pg.locator('input[name="pagamento"][value="usuario"]').check(force=True); await pg.wait_for_timeout(150)
        r = await pg.evaluate("(()=>{const x=recomendacoesCaso().find(r=>r.id==='lic-usuario'); return x ? {n:x.porque.n, resp:x.porque.resposta, ir:x.ir, ids: recomendacoesCaso().map(r=>r.id)} : {ids: recomendacoesCaso().map(r=>r.id)};})()")
        ok(r.get('n') == '2.3.2' and r.get('resp') == 'Licença por usuário' and r.get('ir') == 'piloto:2c:2-3-2', f'novo: paga + por usuário gera a ação da licença por usuário ({r})')
        ok('lic-institucional' not in r['ids'], 'novo: sem ação de assinatura institucional')
        await pg.evaluate("abrirFase('contexto','1c')"); await pg.wait_for_timeout(150)
        await pg.locator('[data-resp="g-dados"][data-v="nao"]').click(); await pg.wait_for_timeout(100)
        r = await pg.evaluate("(()=>{const x=recomendacoesCaso().find(r=>r.id==='g-dados'); return x ? [x.porque.n, x.porque.resposta, x.prioridade] : null;})()")
        ok(r == ['1.3.4', 'Não', 'alta'], f'novo: governança "Não" em 1.3.4 gera ação de política de dados ({r})')

        # 3. passo 3.4 (exemplo B)
        await carregar(pg, 'B')
        n = len(await pg.evaluate(RECS))
        await pg.evaluate("abrirFase('custo','3d')"); await pg.wait_for_timeout(200)
        r = await pg.evaluate("""(()=>{const P=document.getElementById('passo-3d'); if(!P) return null;
          return {itens: P.querySelectorAll('.rc-item').length, irs: P.querySelectorAll('.rc-item [data-ir]').length,
            grupos: [...P.querySelectorAll('.rc-grupo')].map(g=>g.dataset.quando), cont: (P.querySelector('.rc-cont')||{}).innerText||'',
            pq: (P.querySelector('.rc-pq')||{}).innerText||'', css: !!document.getElementById('css-recs'),
            plano: P.closest('.fase') ? P.closest('.fase').querySelectorAll('[data-act="gerar-plano"]').length : 0};})()""")
        ok(r is not None, 'B: passo 3.4 aberto')
        if r:
            ok(r['itens'] == n and r['irs'] == n, f'B: 3.4 mostra {r["itens"]} itens com "Ir à pergunta" ({n} recomendações)')
            ok(r['grupos'] == ['antes_teste', 'antes_contratar', 'manter'], f'B: grupos por momento {r["grupos"]}')
            ok('Custo e compra' in r['cont'] and 'Política e governança' in r['cont'], 'B: contagem por tipo')
            ok(r['pq'].startswith('Por quê:') and '→' in r['pq'], f'B: linha "Por quê" ({r["pq"][:80]})')
            ok(r['css'], 'B: CSS das recomendações injetado (#css-recs)')
            ok(r['plano'] >= 1, 'B: botão "Gerar plano de contratação" no passo 3.4')
            alvo = await pg.evaluate("document.querySelector('#passo-3d .rc-item [data-ir]').dataset.ir")
            await pg.locator('#passo-3d .rc-item [data-ir]').first.click(); await pg.wait_for_timeout(250)
            f_, p_, q_ = alvo.split(':')
            ok(await pg.evaluate(f"S.passo==='{p_}' && S.vista!=='plano' && !!document.getElementById('q-{q_}')"), f'B: "Ir à pergunta" no 3.4 abre {alvo}')
            await pg.screenshot(path=f'{TMP}/ir_B.png')
            await pg.evaluate("abrirFase('custo','3d')"); await pg.wait_for_timeout(150)
            await pg.evaluate("irPara('passo-3d')"); await pg.wait_for_timeout(200)
            await pg.screenshot(path=f'{TMP}/passo34_B.png', full_page=False)

        # 4. plano: seção depois do resumo e antes do bloco A
        for ex in ['A', 'B', 'C', 'D', 'novo']:
            await carregar(pg, ex)
            n = len(await pg.evaluate(RECS))
            await abrir_plano(pg)
            r = await pg.evaluate("""(()=>{const P=document.getElementById('plano'); if(!P) return null;
              const o=[...P.querySelectorAll('[data-bloco], [data-sec]')].map(e=>e.dataset.bloco ? '['+e.dataset.bloco+']' : e.dataset.sec);
              const R=P.querySelector('[data-sec="recs"]');
              return {o, itens: R ? R.querySelectorAll('.rc-item').length : -1, irs: R ? R.querySelectorAll('[data-ir]').length : -1, txt: R ? R.innerText : ''};})()""")
            o = r['o'] if r else []
            ok('recs' in o and 'resumo' in o and '[A]' in o and o.index('resumo') < o.index('recs') < o.index('[A]'), f'plano {ex}: seção de recomendações depois do resumo e antes do bloco A')
            ok(r and r['itens'] == n and r['irs'] == n, f'plano {ex}: {r and r["itens"]} itens com "Ir à pergunta" ({n})')
            if ex == 'novo': ok('Ainda não há respostas suficientes' in r['txt'], 'plano novo: mensagem de lista vazia')
            md = await pg.evaluate("relMD(dadosRelatorio())")
            ok('## Recomendações para o seu caso' in md and md.index('## Recomendações para o seu caso') < md.index('## A. Custo e compra'), f'plano {ex}: Markdown com a seção antes do bloco A')
            if ex == 'D':
                await pg.screenshot(path=f'{TMP}/plano_D.png')
                await pg.locator('[data-sec="recs"] [data-ir]').first.click(); await pg.wait_for_timeout(250)
                ok(await pg.evaluate("S.vista!=='plano' && !document.getElementById('plano')"), 'plano D: "Ir à pergunta" volta ao percurso')

        # 5. EN: passo 3.4, seção do plano e PDF
        await pg.select_option('#sel-lang', 'en'); await pg.wait_for_timeout(200)
        for ex in ['A', 'B', 'C', 'D']:
            await carregar(pg, ex)
            await pg.evaluate("abrirFase('custo','3d')"); await pg.wait_for_timeout(200)
            t34 = await pg.evaluate("(document.getElementById('passo-3d')||{}).innerText||''")
            ok('Before the test' in t34 or 'Before contracting' in t34, f'en {ex}: 3.4 em inglês')
            ok(not resto_pt(t34), f'en {ex}: 3.4 sem português {resto_pt(t34)[:3]}')
            await abrir_plano(pg)
            tp = await pg.evaluate("(document.querySelector('#plano [data-sec=recs]')||{}).innerText||''")
            ok('Recommendations for your case' in tp and not resto_pt(tp), f'en {ex}: seção do plano em inglês {resto_pt(tp)[:3]}')
            async with pg.expect_download() as dl:
                await pg.click('#plano .res-topo [data-act="pdf"]')
            d = await dl.value
            arq = f'{TMP}/recs_en_{ex}.pdf'; await d.save_as(arq)
            txt = subprocess.run(['pdftotext', '-layout', arq, '-'], capture_output=True, text=True).stdout
            plano = re.sub(r'\s+', ' ', txt)
            ok('Recommendations for your case' in plano and 'Cost and procurement' in plano and plano.index('Recommendations for your case') < plano.index('Cost and procurement'), f'pdf en {ex}: seção antes do bloco A')
            ok('Before the test' in plano or 'Before contracting' in plano, f'pdf en {ex}: grupos por momento')
            # português: só no trecho da seção (o PDF inteiro é verificado por test_v9_plano.py)
            i0 = txt.find('Recommendations for your case'); i1 = txt.find('Cost and procurement', i0)
            trecho = txt[i0:i1] if i0 >= 0 and i1 > i0 else txt
            ok(not resto_pt(trecho), f'pdf en {ex}: seção sem português {resto_pt(trecho)[:3]}')
            if ex == 'D': ok('free period ends' in plano, 'pdf en D: ação do fim do período gratuito')
            if ex == 'B': ok('spending cap' in plano, 'pdf en B: ação de limite de gasto')
        ok(not errs, f'sem erros de console {errs[:5]}')
        await b.close()
    print('\n' + ('TUDO OK' if not falhas else f'{len(falhas)} FALHA(S)'))
    sys.exit(1 if falhas else 0)

asyncio.run(main())
