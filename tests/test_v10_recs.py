# Recomendações para você (v10, pacote R2; v11, pacote S3): motor de regras, passo 4.3, seção do plano e PDF.
# Uso: python3 tests/test_v10_recs.py   (depois de bash build.sh; NAV=<arquivo> testa outro build)
# Verifica:
#  - exemplos A–D: lista não vazia, itens completos (quando, tipo, prioridade, texto curto, porque.n, ir), sem duplicatas,
#    ordenada por prioridade e momento, com ações específicas de cada caso (ex.: D, piloto gratuito → custos adiados);
#  - os quatro exemplos geram listas diferentes;
#  - caso em branco: nenhuma recomendação; depois de marcar "paga" + "por usuário" (cliques no 2.3), aparece a
#    ação da licença por usuário com porque 2.3.5; governança "Não" no 1.3.4 gera a ação de política de dados;
#  - v11: regras novas (internet, dispositivos, formação, suporte, acompanhamento, PoC + piloto, várias ferramentas,
#    ferramenta paga sem preço, implantação, arquitetura), cada uma com porque e "ir" da pergunta certa;
#    nenhuma ação de fonte de recursos (pagaDepois, fonte) nem da antiga pergunta "infra";
#  - todo "Ir à pergunta" leva a uma pergunta que existe; o clique no passo 3.4 e no plano abre a pergunta;
#  - passo 4.3 mostra um item por recomendação, agrupado por momento, com a contagem por tipo;
#  - plano: seção "recs" depois do resumo e antes do bloco A (página e Markdown);
#  - EN: passo 4.3 e seção do plano sem português; PDF (pdftotext) com a seção antes do bloco A e sem português nela
#    (o PDF inteiro é verificado por tests/test_v9_plano.py).
import asyncio, json, os, re, subprocess, sys
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAV = os.environ.get('NAV', os.path.join(RAIZ, 'navegador.html'))
TMP = '/tmp/claude-0/v10_recs'
os.makedirs(TMP, exist_ok=True)
SK = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>' + open(NAV).read() + '</body></html>'
open(f'{TMP}/nav.html', 'w').write(SK)
PT = re.compile(r'ção|ções|ã|õ|\b(?:não|você|para o|do caso|também|custo|orçament|decisão)\b', re.I)
IGNORAR = ('Cátedra', 'Desplugada', 'Tutor de matemática')
ESPERADO = {   # ações que cada exemplo deve gerar (casos.js, v11)
    'A': ['lic-institucional', 'etapas', 'integracao', 'g-comite', 'formacao-horas', 'formacao-continua', 'expansao-recorrente'],
    'B': ['consumo-limites', 'consumo-monitorar', 'sob-medida', 'aberta-operacao', 'dados-acordo', 'dados-impacto', 'supervisao', 'contestacao',
          'disp-compartilhado', 'implantacao-criterios', 'expansao-rapida'],
    'C': ['tecnologia', 'teste-recomendado', 'teste-ambos', 'alternativa', 'supervisao', 'formacao-pagador', 'ferramentas-levantar'],
    'D': ['gratis-adiados', 'gratis-fim', 'gratis-ativos', 'termos', 'sob-medida', 'disp-proprio', 'arquitetura-api'],
}
REMOVIDAS = ['paga-indefinido', 'paga-parceiro', 'paga-governo', 'fonte-nao', 'fonte-parcial', 'infra-complementar', 'infra-levantar']
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
    if (!/^(contexto|piloto|implantacao|expansao):\\w+:[\\d-]+$/.test(r.ir || '')) err.push(r.id + ' ir ' + r.ir);
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
            ok(not [i for i in REMOVIDAS if i in r['ids']], f'{ex}: sem ações de fonte de recursos nem da pergunta "infra"')
        ok(len({tuple(sorted(v)) for v in listas.values()}) == 4, 'A–D: listas diferentes entre os casos')
        ok('gratis-adiados' not in listas['A'] and 'consumo-limites' not in listas['A'], 'A: sem ações de gratuidade nem de consumo')

        # 2. caso em branco: nada; depois de marcar no percurso, ações do que foi marcado
        await carregar(pg, 'novo')
        ok(await pg.evaluate(RECS) == [], 'novo: nenhuma recomendação antes de responder')
        await pg.evaluate("abrirFase('piloto','2c')"); await pg.wait_for_timeout(150)
        await pg.locator('input[name="tipoTec"][value="paga"]').check(force=True); await pg.wait_for_timeout(150)
        await pg.locator('input[name="pagamento"][value="usuario"]').check(force=True); await pg.wait_for_timeout(150)
        r = await pg.evaluate("(()=>{const x=recomendacoesCaso().find(r=>r.id==='lic-usuario'); return x ? {n:x.porque.n, resp:x.porque.resposta, ir:x.ir, ids: recomendacoesCaso().map(r=>r.id)} : {ids: recomendacoesCaso().map(r=>r.id)};})()")
        ok(r.get('n') == '2.3.5' and r.get('resp') == 'Licença por usuário' and r.get('ir') == 'piloto:2c:2-3-5', f'novo: paga + por usuário gera a ação da licença por usuário ({r})')
        ok('lic-institucional' not in r['ids'], 'novo: sem ação de assinatura institucional')
        await pg.evaluate("abrirFase('contexto','1c')"); await pg.wait_for_timeout(150)
        await pg.locator('[data-resp="g-dados"][data-v="nao"]').click(); await pg.wait_for_timeout(100)
        r = await pg.evaluate("(()=>{const x=recomendacoesCaso().find(r=>r.id==='g-dados'); return x ? [x.porque.n, x.porque.resposta, x.prioridade] : null;})()")
        ok(r == ['1.3.4', 'Não', 'alta'], f'novo: governança "Não" em 1.3.4 gera ação de política de dados ({r})')

        # 2b. v11: regras novas a partir de respostas marcadas (caso em branco; S.respC marca o que foi respondido)
        CEN = [
            ({'internet': 'parcial', 'escolasInternet': 120}, 'internet-parcial', '2.4.1', 'piloto:2d:2-4-1', 'Parcialmente; 120 escolas com internet adequada'),
            ({'internet': 'nao'}, 'internet-nao', '2.4.1', 'piloto:2d:2-4-1', 'Não'),
            ({'modeloDisp': 'um_por_aluno', 'dispExistem': 'nao'}, 'disp-nao', '2.4.4', 'piloto:2d:2-4-4', 'Não'),
            ({'modeloDisp': 'um_por_aluno', 'dispExistem': 'parcial'}, 'disp-parcial', '2.4.4', 'piloto:2d:2-4-4', 'Parcialmente'),
            ({'formacaoPaga': 'indefinido'}, 'formacao-pagador', '2.5.5', 'piloto:2e:2-5-5', 'Ainda não definido'),
            ({'formacaoPaga': 'fornecedor'}, 'formacao-contrato', '2.5.5', 'piloto:2e:2-5-5', 'Incluída no contrato do fornecedor'),
            ({'formados': ['professores']}, 'formacao-papeis', '2.5.1', 'piloto:2e:2-5-1', 'Professores'),
            ({'suporteQuem': 'fornecedor'}, 'suporte-sla', '2.6.1', 'piloto:2f:2-6-1', 'Equipe do fornecedor'),
            ({'suporteQuem': 'rede', 'suporteNivel': 'dedicado'}, 'suporte-dedicado', '2.6.2', 'piloto:2f:2-6-2', 'Dedicado'),
            ({'acompanhamento': 'intensivo'}, 'acomp-intensivo', '2.6.3', 'piloto:2f:2-6-3', 'Intensivo'),
            ({'acompanhamento': 'leve', 'tarefas': ['alerta_precoce'], 'consequencias': ['apoio_est', 'recursos']}, 'acomp-reforcar', '2.6.3', 'piloto:2f:2-6-3', 'Leve'),
            ({'testes': ['poc', 'piloto']}, 'teste-ambos', '2.0', 'piloto:20:2-0', 'Prova de conceito; Piloto'),
            ({'nFerramentas': '2', 'conheceFerramentas': 'sim', 'ferramentas': [{'nome': 'Tutor X', 'tarefas': ['tutoria'], 'tipoTec': 'paga', 'pagamento': 'usuario', 'preco': ''},
              {'nome': 'Corretor Y', 'tarefas': ['tutoria'], 'tipoTec': 'paga', 'pagamento': 'institucional', 'preco': 3}], 'tipoTec': 'paga', 'pagamento': 'usuario'}, 'ferramentas-cotacao', '2.3.3', 'piloto:2c:2-3-3', 'Tutor X'),
            ({'nFerramentas': '2', 'conheceFerramentas': 'sim', 'ferramentas': [{'nome': 'Tutor X', 'tarefas': ['tutoria'], 'tipoTec': 'paga', 'pagamento': 'usuario', 'preco': 5},
              {'nome': 'Corretor Y', 'tarefas': ['tutoria'], 'tipoTec': 'paga', 'pagamento': 'institucional', 'preco': 3}]}, 'ferramentas-interop', '2.3.3', 'piloto:2c:2-3-3', 'Tutor X; Corretor Y'),
            ({'elegiveis': 60000, 'implantacao': {'escolas': 400, 'pessoas': 60000}}, 'etapas', '3.1.1', 'implantacao:3a:3-1-1', '400 escolas e 60.000 pessoas'),
            ({'arquitetura': 'nao_sei'}, 'arquitetura-decidir', '3.2.1', 'implantacao:3b:3-2-1', None),
            ({'elegiveis': 80000, 'expansao': 'ano1'}, 'expansao-rapida', '4.1.2', 'expansao:4a:4-1-2', None),
        ]
        for campos, rid, n_, ir_, resp_ in CEN:
            js = json.dumps(campos)
            r = await pg.evaluate(f"""(()=>{{carregarExemplo('novo'); S.boasVindas=false; const m={js}; Object.assign(S.caso, m); Object.keys(m).forEach(k=>{{S.respC[k]=true;}});
              if (m.tarefas) {{ S.respC.usuarios=true; S.respC.afetados=true; }}
              const R=recomendacoesCaso(); const x=R.find(r=>r.id==='{rid}'); return {{ids: R.map(r=>r.id), x: x ? {{n:x.porque.n, ir:x.ir, resp:x.porque.resposta, txt:x.texto}} : null}};}})()""")
            x = r['x']
            ok(x is not None and x['n'] == n_ and x['ir'] == ir_ and (resp_ is None or x['resp'] == resp_), f'v11 {rid}: {campos} → porque {n_} e ir {ir_} ({x})')
            if x and rid in ('internet-parcial', 'internet-nao'): ok('Krueger e Jackson, 2026, p. 7' in x['txt'], f'v11 {rid}: cita Krueger e Jackson (2026, p. 7)')
            if x: ok(await ir_existe(pg, x['ir']), f'v11 {rid}: "Ir à pergunta" abre {x["ir"]}')
        r = await pg.evaluate("""(()=>{carregarExemplo('novo'); S.boasVindas=false; Object.assign(S.caso, {internet:'sim', modeloDisp:'um_por_aluno', dispExistem:'sim', suporteQuem:'rede', suporteNivel:'ampliado', acompanhamento:'regular', formacaoPaga:'rede'});
          ['internet','modeloDisp','dispExistem','suporteQuem','suporteNivel','acompanhamento','formacaoPaga'].forEach(k=>{S.respC[k]=true;}); return recomendacoesCaso().map(r=>r.id);})()""")
        ok(not [i for i in r if i.startswith(('internet', 'disp-', 'suporte', 'acomp', 'formacao-pagador', 'formacao-contrato'))], f'v11: respostas neutras não geram ações de infraestrutura, suporte ou formação ({r})')

        # 3. passo 4.3 (exemplo B)
        await carregar(pg, 'B')
        n = len(await pg.evaluate(RECS))
        await pg.evaluate("abrirFase('expansao','4c')"); await pg.wait_for_timeout(200)
        r = await pg.evaluate("""(()=>{const P=document.getElementById('passo-4c'); if(!P) return null;
          return {itens: P.querySelectorAll('.rc-item').length, irs: P.querySelectorAll('.rc-item [data-ir]').length,
            grupos: [...P.querySelectorAll('.rc-grupo')].map(g=>g.dataset.quando), cont: (P.querySelector('.rc-cont')||{}).innerText||'',
            pq: (P.querySelector('.rc-pq')||{}).innerText||'', css: !!document.getElementById('css-recs'),
            plano: P.closest('.fase') ? P.closest('.fase').querySelectorAll('[data-act="gerar-plano"]').length : 0};})()""")
        ok(r is not None, 'B: passo 4.3 aberto')
        if r:
            ok(r['itens'] == n and r['irs'] == n, f'B: 4.3 mostra {r["itens"]} itens com "Ir à pergunta" ({n} recomendações)')
            ok(r['grupos'] == ['antes_teste', 'antes_contratar', 'manter'], f'B: grupos por momento {r["grupos"]}')
            ok('Custo e compra' in r['cont'] and 'Política e governança' in r['cont'], 'B: contagem por tipo')
            ok(r['pq'].startswith('Por quê:') and '→' in r['pq'], f'B: linha "Por quê" ({r["pq"][:80]})')
            ok(r['css'], 'B: CSS das recomendações injetado (#css-recs)')
            ok(r['plano'] >= 1, 'B: botão "Gerar plano de contratação" no passo 4.3')
            alvo = await pg.evaluate("document.querySelector('#passo-4c .rc-item [data-ir]').dataset.ir")
            await pg.locator('#passo-4c .rc-item [data-ir]').first.click(); await pg.wait_for_timeout(250)
            f_, p_, q_ = alvo.split(':')
            ok(await pg.evaluate(f"S.passo==='{p_}' && S.vista!=='plano' && !!document.getElementById('q-{q_}')"), f'B: "Ir à pergunta" no 4.3 abre {alvo}')
            await pg.screenshot(path=f'{TMP}/ir_B.png')
            await pg.evaluate("abrirFase('expansao','4c')"); await pg.wait_for_timeout(150)
            await pg.evaluate("irPara('passo-4c')"); await pg.wait_for_timeout(200)
            await pg.screenshot(path=f'{TMP}/passo43_B.png', full_page=False)

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
            ok('## Recomendações para você' in md and md.index('## Recomendações para você') < md.index('## A. Custo e compra'), f'plano {ex}: Markdown com a seção antes do bloco A')
            if ex == 'D':
                await pg.screenshot(path=f'{TMP}/plano_D.png')
                await pg.locator('[data-sec="recs"] [data-ir]').first.click(); await pg.wait_for_timeout(250)
                ok(await pg.evaluate("S.vista!=='plano' && !document.getElementById('plano')"), 'plano D: "Ir à pergunta" volta ao percurso')

        # 5. EN: passo 3.4, seção do plano e PDF
        await pg.select_option('#sel-lang', 'en'); await pg.wait_for_timeout(200)
        for ex in ['A', 'B', 'C', 'D']:
            await carregar(pg, ex)
            await pg.evaluate("abrirFase('expansao','4c')"); await pg.wait_for_timeout(200)
            t34 = await pg.evaluate("(document.getElementById('passo-4c')||{}).innerText||''")
            ok('Before the test' in t34 or 'Before contracting' in t34, f'en {ex}: 4.3 em inglês')
            ok(not resto_pt(t34), f'en {ex}: 4.3 sem português {resto_pt(t34)[:3]}')
            ok(not re.search(r'\bnetwork', t34, re.I), f'en {ex}: 4.3 sem "network"')
            await abrir_plano(pg)
            tp = await pg.evaluate("(document.querySelector('#plano [data-sec=recs]')||{}).innerText||''")
            ok('Recommendations for you' in tp and 'for your case' not in tp and not resto_pt(tp), f'en {ex}: seção do plano em inglês {resto_pt(tp)[:3]}')
            ok(not re.search(r'\bnetwork', tp, re.I), f'en {ex}: seção do plano sem "network"')
            async with pg.expect_download() as dl:
                await pg.click('#plano .res-topo [data-act="pdf"]')
            d = await dl.value
            arq = f'{TMP}/recs_en_{ex}.pdf'; await d.save_as(arq)
            txt = subprocess.run(['pdftotext', '-layout', arq, '-'], capture_output=True, text=True).stdout
            plano = re.sub(r'\s+', ' ', txt)
            ok('Recommendations for you' in plano and 'Cost and procurement' in plano and plano.index('Recommendations for you') < plano.index('Cost and procurement'), f'pdf en {ex}: seção antes do bloco A')
            ok('Before the test' in plano or 'Before contracting' in plano, f'pdf en {ex}: grupos por momento')
            # português: só no trecho da seção (o PDF inteiro é verificado por test_v9_plano.py)
            i0 = txt.find('Recommendations for you'); i1 = txt.find('Cost and procurement', i0)
            trecho = txt[i0:i1] if i0 >= 0 and i1 > i0 else txt
            ok(not resto_pt(trecho), f'pdf en {ex}: seção sem português {resto_pt(trecho)[:3]}')
            if ex == 'D': ok('free period ends' in plano, 'pdf en D: ação do fim do período gratuito')
            if ex == 'B': ok('spending cap' in plano, 'pdf en B: ação de limite de gasto')
        ok(not errs, f'sem erros de console {errs[:5]}')
        await b.close()
    print('\n' + ('TUDO OK' if not falhas else f'{len(falhas)} FALHA(S)'))
    sys.exit(1 if falhas else 0)

asyncio.run(main())
