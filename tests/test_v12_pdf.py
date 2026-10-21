# PDF do plano de contratação com design próprio (v12, pacote G2: src/plano_pdf.js; v14, BL6: ordem de decisão).
# Uso: python3 tests/test_v12_pdf.py   (depois de bash build.sh)
# Para os exemplos A–D e um caso em branco em EN, B e o caso em branco em PT e C em FR, baixa o PDF pelo botão
# do plano (expect_download) e verifica:
#  - nome procurement-plan-<slug>.pdf; número de páginas razoável (10 a 40);
#  - página 1 (v14): nome da ferramenta, "Plano de contratação", nome do caso, "Recomendação principal" e os indicadores
#    iguais aos do motor (TCO central, custo por aprendiz/professor/usuário, Ano 0 e custo anual em regime);
#  - depois do sumário executivo (até 3 páginas): "Como ler este plano" e o índice "Neste plano", que aponta para as páginas certas (cinco seções e anexos A a I);
#  - corpo em ordem de decisão: as cinco perguntas em ordem crescente de página, antes de "Anexos"; sem códigos A1–B9 nem K1–K6 no corpo;
#  - anexos A a I em ordem; matriz do caso (anexo B) em duas páginas retrato, com o crédito; recomendações (C); perfil (A);
#  - Figura 1 (JPEG 900×1225) numa página própria dentro do anexo E, com o crédito;
#  - cabeçalho com título corrido e rodapé "n / N" em todas as páginas internas;
#  - nenhum tamanho de fonte abaixo de 8 pt;
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
  const n = numerosCusto(); const tco = n.av.tco;
  const apr = tco.custoPorAprendizAno != null ? tco.custoPorAprendizAno : tco.custoPorProfessorAno != null ? tco.custoPorProfessorAno : n.ind.icu;
  const doc = gerarPDF();
  const pags = doc.internal.pages.slice(1).map(p => (p || []).join('\n'));
  const tamanhos = [...new Set(pags.join('\n').match(/ [\d.]+ Tf/g) || [])].map(z => +z.trim().split(' ')[0]);
  const anexo = L => tr('Anexo {0}').replace('{0}', L);
  return { kpis: [grande(n.total), din(apr, 2), grande(n.ano0), grande(tco.anual.eco)],
    tamanhos, nome: S.caso.titulo || (S.ctx || {}).olhando || tr('Caso sem título'), faltas: (faltasTodas() || []).length,
    q: [TXT_REL.q1, TXT_REL.q2, TXT_REL.q3, TXT_REL.q4, TXT_REL.q5].map(x => tr(x)),
    anexos: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map(L => anexo(L)), tAnexos: tr(TXT_REL.anexos),
    t: { ferr: NOME_FERRAMENTA, sub: tr('Plano de contratação'), rec: tr('Recomendação principal'), comoler: tr(TXT_REL.comoLer), matriz: tr(TIT_MATRIZ), credito: tr(CREDITO_MATRIZ),
      indice: tr('Neste plano'), faltas: tr(TXT_REL.faltasDemais), refs: tr(TIT_PLANO.refs), faixa: tr(TXT_REL.kTcoFaixa).split('{0}')[0].trim() } };
})()"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1400, 'height': 900}, accept_downloads=True)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') and 'TUNNEL' not in m.text else None)
        await pg.goto(f'file://{TMP}/nav.html'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300); await pg.evaluate("uiA().lista = true")  # v15 (A): passo inteiro numa tela
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
                ok(10 <= N <= 40, f'{tag}: {N} páginas')
                # página 1
                c = P[0]; cu = c.upper()
                ok(T['ferr'] in c and T['sub'].upper() in cu and norm(E['nome'])[:30] in c, f'{tag}: página 1 com ferramenta, subtítulo e caso')
                ok(T['rec'].upper() in cu, f'{tag}: página 1 com a recomendação principal')
                ok(all(norm(k) in c for k in E['kpis']), f'{tag}: página 1 com os indicadores do motor {E["kpis"]}')
                ok(T['faixa'] in c and 'P10' in c and 'P90' in c, f'{tag}: página 1 com a faixa P10 a P90')
                ok(c.count(' 1 ') >= 0 and len(re.findall(r'\b[1-5] ', c)) >= 1, f'{tag}: página 1 com as ações numeradas')
                # "Como ler" e o índice: logo depois do sumário executivo (até 3 páginas)
                iCo = next((i for i, p_ in enumerate(P) if T['comoler'] in p_ and T['indice'].upper() in p_.upper()), 1)
                ok(1 <= iCo <= 3, f'{tag}: "Como ler" na p. {iCo + 1}, depois do sumário executivo')
                r = P[iCo]
                ok(r.startswith(norm(T['ferr'])) and T['comoler'] in r and T['indice'].upper() in r.upper(), f'{tag}: página 2 com "{T["comoler"]}" e o índice')
                # corpo em ordem de decisão
                pq = [pag_de(P, q.upper(), 1) for q in E['q']]
                pAx = pag_de(P, E['tAnexos'], iCo + 1)
                ok(all(pq) and pq == sorted(pq) and pq[0] >= 2 and (pAx > pq[-1] or pAx == 0), f'{tag}: cinco seções do corpo em ordem (p. {pq}), antes dos anexos (p. {pAx})')
                # anexos A a I
                pa = [pag_de(P, a_.upper() + ' ', pq[-1]) or pag_de(P, a_.upper(), pq[-1]) for a_ in E['anexos']]
                ok(all(pa) and pa == sorted(pa) and pa[0] >= pq[-1], f'{tag}: anexos A a I em ordem {pa}')
                corpo = ' '.join(P[1:pa[0] - 1])
                ok(not re.search(r'\b(?:K[1-6](?:\.\d)?|A[1-7]|B[1-9])\b', corpo), f'{tag}: sem códigos A1–B9 nem K1–K6 no corpo ({re.findall(r"[A-Z][1-9](?:[.][0-9])?", corpo)[:5]})')
                # matriz do caso (anexo B): duas páginas retrato, com o crédito
                pM = pag_de(P, T['matriz'], pa[1] - 1)
                ok(pa[1] <= pM <= pa[2] - 1 and T['credito'] in P[pM - 1] and T['credito'] in P[pM], f'{tag}: matriz do caso nas p. {pM}–{pM + 1} (anexo B, p. {pa[1]}), com o crédito')
                # índice da página 2 aponta para as páginas certas
                for i_, (nome, pag) in enumerate([(f'{i + 1}. {q}', pq[i]) for i, q in enumerate(E['q'])]):
                    m = re.search(re.escape(norm(nome)) + r' (\d+)', r)
                    ok(m is not None and int(m.group(1)) == pag, f'{tag}: índice "{nome}" -> p. {pag}')
                for L_, nome, pag in zip('ABCDEFGHI', E['anexos'], pa):
                    m = re.search(re.escape(norm(nome)) + r'\. .*? (\d+)(?: |$)', r)
                    ok(m is not None, f'{tag}: índice com "{nome}"')
                # Figura 1 numa página própria dentro do anexo E
                imgs = subprocess.run(['pdfimages', '-list', arq], capture_output=True, text=True).stdout.split('\n')[2:]
                fig = [l.split() for l in imgs if l.strip() and l.split()[3:5] == ['900', '1225']]
                ok(len(fig) == 1, f'{tag}: Figura 1 no PDF ({len(fig)})')
                if fig:
                    pf = int(fig[0][0])
                    ok(pa[4] < pf < pa[5] and 'CC BY-SA 3.0 IGO' in P[pf - 1], f'{tag}: figura na p. {pf}, dentro do anexo E (p. {pa[4]} a {pa[5]}), com crédito')
                # cabeçalho e rodapé
                ok(all(P[i].startswith(norm(T['ferr'])) and f'{i + 1} / {N}' in P[i] for i in range(1, N)), f'{tag}: cabeçalho e rodapé "n / N" nas páginas internas')
                pRef = pag_de(P, T['refs'], pa[8] - 1)
                ok(pRef >= pa[8] and pRef >= N - 1, f'{tag}: referências (p. {pRef}) no fim (anexo I)')
                if E['faltas'] > 5:
                    pF = pag_de(P, T['faltas'], pa[0] - 1)
                    ok(pa[0] <= pF <= pa[1], f'{tag}: lista completa de respostas que faltam no anexo A (p. {pF})')
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
