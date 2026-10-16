# PDF do plano de contratação com design próprio (v12, pacote G2: src/plano_pdf.js).
# Uso: python3 tests/test_v12_pdf.py   (depois de bash build.sh)
# Para os exemplos A–D e um caso em branco em EN, B e o caso em branco em PT e C em FR, baixa o PDF pelo botão
# do plano (expect_download) e verifica:
#  - nome procurement-plan-<slug>.pdf; número de páginas razoável (12 a 40);
#  - capa: nome da ferramenta, "Plano de contratação", nome do caso, "Recomendação principal", 4 KPIs iguais a
#    numerosCusto() (grande(ano0), grande(total), grande(anual), din(porAluno, 2)) e índice "Neste plano";
#  - "Em resumo" (p. 2): os mesmos KPIs, 7 barras de camada nas cores da Figura 1 com largura proporcional ao
#    custo total da camada (somaPorCamada), rótulos, valores e % das camadas, valores das colunas por exercício
#    iguais à dotação do passo 4.2 (mil(orc.dot[t])), fatos do caso; caso em branco: aviso "Plano parcial";
#  - "Recomendações para você" antes do bloco A; índice da capa aponta para as páginas certas;
#  - faixas dos blocos A e B (página própria, A antes de B) e as seções A1–A7 e B1–B9 em ordem;
#  - Figura 1 (JPEG 900×1225) numa página própria entre A3 e A4, com o crédito;
#  - cabeçalho com título corrido e rodapé "n / N" em todas as páginas internas;
#  - nenhum tamanho de fonte abaixo de 8 pt;
#  - v13: matriz do caso em duas páginas retrato entre "Em resumo" e as recomendações, com o crédito, e no índice da capa;
#  - EN: nenhuma palavra em português (mesma expressão do test_idiomas.py) nem magnitude "mil/mi/bi" (páginas da
#    matriz fora da busca enquanto os textos de src/matriz.js não tiverem tradução).
import asyncio, os, re, subprocess, sys
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = '/tmp/claude-0/v13_b3/v12_pdf'
os.makedirs(TMP, exist_ok=True)
NAV = os.environ.get('NAV', os.path.join(RAIZ, 'navegador.html'))
SK = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>' + open(NAV).read() + '</body></html>'
open(f'{TMP}/nav.html', 'w').write(SK)
PT = re.compile(r'ção|ções|ã|õ|\b(?:não|você|para o|do caso|também|custo|orçament|decisão)\b', re.I)
MAG_PT = re.compile(r'(?:\d|\b[A-Z]{3})[\s  ](?:mil|mi|bi)\b')
SECOES = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9']
CASOS = [('en', ['A', 'B', 'C', 'D', 'novo']), ('pt', ['B', 'novo']), ('fr', ['C'])]
falhas = []
# v13: textos de src/matriz.js ainda sem tradução (são traduzidos por outro pacote); enquanto houver, as páginas
# da matriz do caso ficam fora da busca por português (o teste avisa)
PEND_MATRIZ = "(() => LANG === 'pt' || typeof MATRIZ === 'undefined' ? [] : [TIT_MATRIZ, CREDITO_MATRIZ, NOTA_MATRIZ_CUSTO].concat(...Object.values(MATRIZ).map(r => Object.values(r).map(c => c.t))).filter(s => tr(s) === s))()"

def ok(cond, msg):
    print(('ok   ' if cond else 'FALHA ') + msg)
    if not cond: falhas.append(msg)

def norm(s):
    return re.sub(r'\s+', ' ', str(s).replace(' ', ' ').replace(' ', ' ').replace(' ', ' ')).strip()

def paginas(arq):
    n = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', arq], capture_output=True, text=True).stdout).group(1))
    return [norm(subprocess.run(['pdftotext', '-layout', '-f', str(i), '-l', str(i), arq, '-'], capture_output=True, text=True).stdout) for i in range(1, n + 1)]

def pag_de(P, s, desde=1):
    for i in range(desde, len(P)):
        if s in P[i]: return i + 1
    return 0

# Dados esperados, calculados na página com as mesmas funções, e inspeção do conteúdo de cada página do PDF
# (doc.internal.pages: operadores de cor, retângulos e tamanhos de fonte)
JS = r"""(() => {
  const n = numerosCusto(); const cam = n.camadas || somaPorCamada(n.av);
  const tr_ = s => tr(s);
  const doc = gerarPDF();
  const pags = doc.internal.pages.slice(1).map(p => (p || []).join('\n'));
  const cores = [1,2,3,4,5,6,7].map(k => { const d = new window.jspdf.jsPDF({ unit: 'pt' }); d.setFillColor(...PDF_COR.camadas[k]);
    const L = d.internal.pages[1]; return L[L.length - 1]; });
  const vals = [1,2,3,4,5,6,7].map(k => cam.total[k] || 0);
  const tot = vals.reduce((a, b) => a + b, 0);
  const tamanhos = [...new Set(pags.join('\n').match(/ [\d.]+ Tf/g) || [])].map(z => +z.trim().split(' ')[0]);
  // retângulo desenhado logo depois de cada cor de camada na página 2
  const p2 = pags[1] || '';
  const barras = cores.map(c => { const i = p2.indexOf(c + '\n'); if (i < 0) return null;
    const m = p2.slice(i + c.length + 1, i + c.length + 120).match(/^([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) re/); return m ? Math.abs(+m[3]) : null; });
  return { kpis: [grande(n.ano0), grande(n.total), grande(n.anual), din(n.porAluno, 2)],
    camadas: [1,2,3,4,5,6,7].map(k => ({ rot: k + '. ' + tr(nomeCamada(k)), v: grande(vals[k - 1]), p: pct(tot ? vals[k - 1] / tot : 0), val: vals[k - 1] })),
    dot: n.av.r.anos.map(a => mil(n.orc.dot[a] || 0)), barras, tamanhos,
    nome: S.caso.titulo || (S.ctx || {}).olhando || tr('Caso sem título'), faltas: (faltasTodas() || []).length,
    t: { ferr: NOME_FERRAMENTA, sub: tr('Plano de contratação'), rec: tr('Recomendação principal'), resumo: tr('Em resumo'), recs: tr('Recomendações para você'),
      perfil: tr('Perfil do caso'), matriz: tr(TIT_MATRIZ), credito: tr(CREDITO_MATRIZ), A: 'A. ' + tr(TIT_PLANO.A), B: 'B. ' + tr(TIT_PLANO.B), indice: tr('Neste plano'), fatos: tr('Fatos do caso'),
      barras: tr('Custo por camada'), colunas: tr('Dotação por exercício'), faltas: tr(TIT_PLANO.faltas), refs: tr(TIT_PLANO.refs),
      parcial: n ? tr('Plano parcial: {0} respostas pendentes.'.replace('{0}', (faltasTodas() || []).length)) : '' } };
})()"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1400, 'height': 900}, accept_downloads=True)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') and 'TUNNEL' not in m.text else None)
        await pg.goto(f'file://{TMP}/nav.html'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
        for lang, exs in CASOS:
            await pg.select_option('#sel-lang', lang); await pg.wait_for_timeout(150)
            for ex in exs:
                tag = f'{lang} {ex}'
                await pg.evaluate(f"(()=>{{carregarExemplo('{ex}'); S.boasVindas=false; S.vista=''; render(); abrirPlano();}})()")
                await pg.wait_for_timeout(200)
                async with pg.expect_download() as dl:
                    await pg.locator('[data-act="pdf"]:visible').first.click()
                d = await dl.value
                arq = f'{TMP}/plano_{lang}_{ex}.pdf'; await d.save_as(arq)
                ok(re.fullmatch(r'procurement-plan-[a-z0-9-]+\.pdf', d.suggested_filename) is not None, f'{tag}: nome {d.suggested_filename}')
                E = await pg.evaluate(JS); T = {k: norm(v) for k, v in E['t'].items()}
                P = paginas(arq); N = len(P)
                ok(12 <= N <= 40, f'{tag}: {N} páginas')
                # capa
                c = P[0]; cu = c.upper()
                ok(T['ferr'] in c and T['sub'] in c and norm(E['nome'])[:30] in c, f'{tag}: capa com ferramenta, subtítulo e caso')
                ok(T['rec'].upper() in cu, f'{tag}: capa com a recomendação principal')
                ok(all(norm(k) in c for k in E['kpis']), f'{tag}: capa com os 4 KPIs de numerosCusto() {E["kpis"]}')
                ok(T['indice'].upper() in cu, f'{tag}: capa com o índice')
                # Em resumo
                r = P[1]
                ok(r.startswith(norm(T['ferr'])) and T['resumo'] in r, f'{tag}: página 2 é "{T["resumo"]}" com cabeçalho')
                ok(all(norm(k) in r for k in E['kpis']), f'{tag}: resumo com os 4 KPIs')
                ok(T['barras'] in r and all(norm(z['rot'])[:24] in r and norm(z['v']) in r for z in E['camadas']), f'{tag}: 7 barras com rótulo e valor')
                ok(all(norm(z['p']) in r for z in E['camadas']), f'{tag}: % das camadas')
                ok(T['colunas'] in r and all(norm(v) in r for v in E['dot']), f'{tag}: colunas por exercício = dotação do passo 4.2 {E["dot"]}')
                ok(T['fatos'] in r, f'{tag}: fatos do caso')
                br = E['barras']; mx = max(z['val'] for z in E['camadas'])
                larg_max = max([w for w in br if w] or [0])
                prop = all((z['val'] <= 0 and (w is None or w <= 1.6)) or (w is not None and (abs(w / larg_max - z['val'] / mx) < 0.01 or (w <= 1.6 and z['val'] / mx < 0.01)))
                           for z, w in zip(E['camadas'], br)) if larg_max else False
                ok(prop and sum(1 for w in br if w) == sum(1 for z in E['camadas'] if z['val'] > 0), f'{tag}: barras nas cores das camadas e proporcionais ao custo ({[round(w or 0) for w in br]})')
                if E['faltas']: ok(T['parcial'] in r, f'{tag}: aviso "{T["parcial"]}"')
                # ordem: recomendações antes do bloco A; faixas A e B; seções
                pR = pag_de(P, T['recs']); pA = pag_de(P, T['A'], 2); pB = pag_de(P, T['B'], 2)
                ok(0 < pR < pA < pB, f'{tag}: recomendações (p. {pR}) antes do bloco A (p. {pA}) e do B (p. {pB})')
                ok(P[pA - 1].count(T['sub'].upper()) >= 1 and P[pB - 1].count(T['sub'].upper()) >= 1, f'{tag}: faixas dos blocos com o sobretítulo')
                ps = [pag_de(P, s + '. ', pA - 1) for s in SECOES]
                ok(all(ps) and ps == sorted(ps) and all(x >= pB for x in ps[7:]) and all(pA <= x < pB for x in ps[:7]), f'{tag}: faixas A1–A7 e B1–B9 em ordem {ps}')
                # v13: matriz do caso em duas páginas retrato, entre "Em resumo" e as recomendações, com o crédito
                pM = pag_de(P, T['matriz'], 1)
                ok(2 < pM and pM + 1 < pR and T['matriz'] in P[pM] and T['credito'] in P[pM - 1] and T['credito'] in P[pM], f'{tag}: matriz do caso nas p. {pM}–{pM + 1}, antes das recomendações (p. {pR}), com o crédito')
                pP = pag_de(P, T['perfil'])
                ok(pR <= pP < pA, f'{tag}: perfil do caso (p. {pP}) entre recomendações e bloco A')
                # índice da capa aponta para as páginas certas
                for nome, pag in [(T['resumo'], 2), (T['matriz'], pM), (T['recs'], pR), (T['A'], pA), (T['B'], pB)]:
                    ok(re.search(re.escape(nome) + r' (\d+)', c) is not None and int(re.search(re.escape(nome) + r' (\d+)', c).group(1)) == pag, f'{tag}: índice "{nome}" -> p. {pag}')
                # Figura 1 numa página própria entre A3 e A4
                imgs = subprocess.run(['pdfimages', '-list', arq], capture_output=True, text=True).stdout.split('\n')[2:]
                fig = [l.split() for l in imgs if l.strip() and l.split()[3:5] == ['900', '1225']]
                ok(len(fig) == 1, f'{tag}: Figura 1 no PDF ({len(fig)})')
                if fig:
                    pf = int(fig[0][0])
                    ok(ps[2] < pf <= ps[3] - 1 and 'CC BY-SA 3.0 IGO' in P[pf - 1], f'{tag}: figura na p. {pf}, entre A3 (p. {ps[2]}) e A4 (p. {ps[3]}), com crédito')
                # cabeçalho e rodapé
                ok(all(P[i].startswith(norm(T['ferr'])) and f'{i + 1} / {N}' in P[i] for i in range(1, N)), f'{tag}: cabeçalho e rodapé "n / N" nas páginas internas')
                pRef = pag_de(P, T['refs'], pB - 1); pF = pag_de(P, T['faltas'], pRef - 1) if E['faltas'] else 0
                ok(pRef > ps[-1] and (pRef == N if not E['faltas'] else pF > pRef), f'{tag}: referências (p. {pRef}) no fim, respostas pendentes depois (p. {pF})')
                # tipografia: nada abaixo de 8 pt
                ok(min(E['tamanhos']) >= 8, f'{tag}: menor fonte {min(E["tamanhos"])} pt')
                if lang == 'en':
                    txt = subprocess.run(['pdftotext', '-layout', arq, '-'], capture_output=True, text=True).stdout
                    pend = await pg.evaluate(PEND_MATRIZ)
                    if pend:
                        print(f'aviso {tag}: {len(pend)} textos de src/matriz.js sem tradução; páginas da matriz fora da busca')
                        tm = norm(await pg.evaluate("tr(TIT_MATRIZ)"))
                        txt = '\n'.join(subprocess.run(['pdftotext', '-layout', '-f', str(i + 1), '-l', str(i + 1), arq, '-'], capture_output=True, text=True).stdout for i in range(N) if tm not in P[i])
                    resto = [l.strip() for l in txt.split('\n') if (PT.search(l) or MAG_PT.search(l)) and 'Cátedra' not in l and 'Desplugada' not in l]
                    ok(not resto, f'{tag}: sem português ({len(resto)}) {resto[:5]}')
        ok(not errs, f'sem erros de console {errs[:5]}')
        await b.close()
    print('\n' + ('TUDO OK' if not falhas else f'{len(falhas)} FALHA(S)'))
    sys.exit(1 if falhas else 0)

asyncio.run(main())
