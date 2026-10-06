# Plano de contratação (v9, pacote P3): página e PDF.
# Uso: python3 tests/test_v9_plano.py   (depois de bash build.sh)
# Verifica, para os exemplos A–D e um caso em branco:
#  - o botão [data-act="gerar-plano"] abre #plano;
#  - blocos "Custo e compra" e "Política e governança", nessa ordem, com as seções A1–A8 e B1–B9;
#  - nenhuma seção "Suas respostas";
#  - C (teste "recomendar") mostra a recomendação de prova de conceito com motivo;
#  - caso em branco mostra "Plano parcial" com a lista numerada e botões "Responder";
#  - A3 tem 7 linhas de camada e o link da UNESDOC;
#  - sem erro de console e sem rolagem horizontal (1400 e 400 px);
#  - PDF em EN (pdftotext): "Procurement plan", "Cost and procurement", "Policy and governance", a URL,
#    nome procurement-plan-<slug>.pdf e nenhuma palavra em português da lista do test_idiomas.py.
import asyncio, os, re, subprocess, sys
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = '/tmp/claude-0/v9_plano'
os.makedirs(TMP, exist_ok=True)
SK = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>' + open(os.path.join(RAIZ, 'navegador.html')).read() + '</body></html>'
open(f'{TMP}/nav.html', 'w').write(SK)
URL_TCO = 'https://unesdoc.unesco.org/ark:/48223/pf0000399348'
PT = re.compile(r'ção|ções|ã|õ|\b(?:não|você|para o|do caso|também|custo|orçament|decisão)\b', re.I)
SECOES = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9']
falhas = []

def ok(cond, msg):
    print(('ok   ' if cond else 'FALHA ') + msg)
    if not cond: falhas.append(msg)

async def abrir_caso(pg, ex):
    await pg.evaluate(f"(()=>{{carregarExemplo('{ex}'); S.boasVindas=false; S.vista=''; render();}})()")
    await pg.wait_for_timeout(150)
    await pg.locator('[data-act="gerar-plano"]:visible').first.click()
    await pg.wait_for_timeout(250)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, h, tag in [(1400, 900, 'd'), (400, 860, 'm')]:
            ctx = await b.new_context(viewport={'width': w, 'height': h}, accept_downloads=True)
            pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') and 'TUNNEL' not in m.text else None)
            await pg.goto(f'file://{TMP}/nav.html'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
            await pg.select_option('#sel-lang', 'pt'); await pg.wait_for_timeout(150)
            for ex in ['A', 'B', 'C', 'D', 'novo']:
                await abrir_caso(pg, ex)
                r = await pg.evaluate("""(() => { const P = document.getElementById('plano'); if (!P) return null;
                  const ordem = [...P.querySelectorAll('[data-bloco], [data-sec]')].map(e => e.dataset.bloco ? '[' + e.dataset.bloco + ']' : e.dataset.sec);
                  const blocos = [...P.querySelectorAll('[data-bloco]')].map(e => e.textContent.trim());
                  const a3 = P.querySelector('[data-sec="A3"] table tbody');
                  return { vista: S.vista, ordem, blocos, texto: P.innerText,
                    a3linhas: a3 ? a3.rows.length : 0, a3link: !!P.querySelector('[data-sec="A3"] a[href="%s"]'),
                    a1: (P.querySelector('[data-sec="A1"]') || {}).innerText || '',
                    parcial: (P.querySelector('.parcial') || {}).innerText || '', nResp: P.querySelectorAll('.parcial [data-ir]').length,
                    sw: document.documentElement.scrollWidth }; })()""" % URL_TCO)
                ok(r is not None and r['vista'] == 'plano', f'{tag} {ex}: #plano aberto pelo botão')
                if not r: continue
                o = r['ordem']
                ok(o.index('[A]') < o.index('[B]') if '[A]' in o and '[B]' in o else False, f'{tag} {ex}: bloco A antes do bloco B')
                ok(r['blocos'][:2] == ['A. Custo e compra', 'B. Política e governança'], f'{tag} {ex}: nomes dos blocos {r["blocos"][:2]}')
                ok([s for s in o if s in SECOES] == SECOES, f'{tag} {ex}: seções A1–A8 e B1–B9 em ordem')
                ok(all(o.index(s) > o.index('[A]') for s in SECOES[:8]) and all(o.index(s) > o.index('[B]') for s in SECOES[8:]), f'{tag} {ex}: seções dentro dos blocos')
                ok('Suas respostas' not in r['texto'], f'{tag} {ex}: sem "Suas respostas"')
                ok(r['a3linhas'] == 7 and r['a3link'], f'{tag} {ex}: A3 com 7 camadas ({r["a3linhas"]}) e link UNESDOC')
                ok('não da UNESCO' in r['texto'], f'{tag} {ex}: faixa de isenção')
                ok(r['sw'] <= w + 1, f'{tag} {ex}: sem rolagem horizontal ({r["sw"]})')
                if ex == 'C':
                    ok('Recomendação: começar por uma prova de conceito' in r['a1'] and 'Por quê' in r['a1'], f'{tag} C: A1 recomenda prova de conceito com motivo')
                if ex == 'novo':
                    ok(re.search(r'Plano parcial: \d+ perguntas? sem resposta', r['parcial']) is not None and r['nResp'] > 0, f'{tag} novo: "Plano parcial" com lista ({r["nResp"]})')
                    ok(re.search(r'\b1\.1\.\d', r['parcial']) is not None, f'{tag} novo: lista numerada')
                await pg.screenshot(path=f'{TMP}/plano_{tag}_{ex}.png')
            # P1-4 / P2-6: "recomende para mim" com setup de piloto; P2-2: ponto de equilíbrio só com licença institucional
            await pg.evaluate("""(()=>{carregarExemplo('novo'); S.boasVindas=false; S.caso.teste='recomendar'; S.respC.teste=true;
              S.caso.piloto={escolas:20, participantes:1200, meses:4}; S.caso.tipoTec='paga'; S.caso.pagamento='usuario'; S.custo.editado=false; S.vista=''; render();})()""")
            await pg.locator('[data-act="gerar-plano"]:visible').first.click(); await pg.wait_for_timeout(250)
            r = await pg.evaluate("""(()=>{const P=document.getElementById('plano'); const tr=[...P.querySelectorAll('[data-sec=resumo] tr')].find(t=>/Escolas no teste/.test(t.innerText));
              return {esc: tr ? tr.querySelector('td').innerText : '', a1: P.querySelector('[data-sec=A1]').innerText, a3: P.querySelector('[data-sec=A3]').parentElement.innerText,
                a2: (P.querySelector('[data-sec=A2] .kpi-nota')||{}).innerText||'', prem: P.querySelector('[data-sec=A2]').innerText}})()""")
            ok(r['esc'] == '20', f'{tag} resumo mostra as escolas digitadas com "recomende" ({r["esc"]})')
            ok('descreve um piloto' in r['a1'] and '2.3.6' in r['a1'], f'{tag} A1 avisa que o setup descreve um piloto')
            ok('licença institucional só compensa' not in r['a3'], f'{tag} A3 sem ponto de equilíbrio com licença por usuário')
            ok('premissas padrão' in r['a2'], f'{tag} A2 rotula estimativa com premissas padrão')
            ok('Preço da licença por usuário por mês' in r['prem'] and 'Premissas de partida' in r['prem'], f'{tag} A2 lista preço da licença e exemplo de origem')
            # Responder leva de volta à pergunta
            if tag == 'd':
                await pg.locator('.parcial [data-ir]').first.click(); await pg.wait_for_timeout(200)
                ok(await pg.evaluate("S.vista !== 'plano' && !document.getElementById('plano')"), 'd novo: "Responder" volta ao percurso')
            # PDF
            if tag == 'd':
                for lang in ['pt', 'en']:
                    await pg.select_option('#sel-lang', lang); await pg.wait_for_timeout(150)
                    for ex in (['B'] if lang == 'pt' else ['A', 'B', 'C', 'D', 'novo']):
                        await abrir_caso(pg, ex)
                        async with pg.expect_download() as dl:
                            await pg.click('#plano .res-topo [data-act="pdf"]')
                        d = await dl.value
                        arq = f'{TMP}/plano_{lang}_{ex}.pdf'; await d.save_as(arq)
                        ok(re.fullmatch(r'procurement-plan-[a-z0-9-]+\.pdf', d.suggested_filename) is not None, f'pdf {lang} {ex}: nome {d.suggested_filename}')
                        txt = subprocess.run(['pdftotext', '-layout', arq, '-'], capture_output=True, text=True).stdout
                        plano = re.sub(r'\s+', ' ', txt)
                        if lang == 'en':
                            for s in ['Procurement plan', 'Cost and procurement', 'Policy and governance', URL_TCO]:
                                ok(s in plano, f'pdf en {ex}: contém "{s}"')
                            ok('Cost and procurement' in plano and 'Policy and governance' in plano and plano.index('Cost and procurement') < plano.index('Policy and governance'), f'pdf en {ex}: bloco A antes do B')
                            resto = [l.strip() for l in txt.split('\n') if PT.search(l) and 'Cátedra' not in l and 'Desplugada' not in l]
                            ok(not resto, f'pdf en {ex}: sem português ({len(resto)}) {resto[:5]}')
                        else:
                            ok('Plano de contratação' in plano and 'Custo e compra' in plano and URL_TCO in plano, f'pdf pt {ex}: título, bloco A e URL')
            ok(not errs, f'{tag}: sem erros de console {errs[:5]}')
            await ctx.close()
        await b.close()
    print('\n' + ('TUDO OK' if not falhas else f'{len(falhas)} FALHA(S)'))
    sys.exit(1 if falhas else 0)

asyncio.run(main())
