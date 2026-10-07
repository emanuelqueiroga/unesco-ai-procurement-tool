# Plano de contratação (v9, pacote P3): página e PDF.
# Uso: python3 tests/test_v9_plano.py   (depois de bash build.sh)
# Verifica, para os exemplos A–D e um caso em branco:
#  - o botão [data-act="gerar-plano"] abre #plano;
#  - blocos "Custo e compra" e "Política e governança", nessa ordem, com as seções A1–A7 e B1–B9
#    (v11: a seção "Fonte de recursos" saiu; o dossiê passou a A7);
#  - nenhuma seção "Suas respostas";
#  - C (teste "recomendar") mostra a recomendação de prova de conceito com motivo;
#  - caso em branco mostra "Plano parcial" com a lista numerada e botões "Responder";
#  - A3 tem 7 linhas de camada e o link da UNESDOC;
#  - v10/v11: seção "Recomendações para você" (data-sec="recs") depois do resumo e antes do bloco A;
#  - v11: resumo com ferramentas, internet, dispositivos, formação, suporte, acompanhamento, implantação;
#    nada de fonte de recursos; Figura 1 (Krueger e Jackson, 2026, p. 11) em A3 com legenda e crédito;
#    A2 traz "Como o custo é calculado" (formula.js) quando a fórmula está no build;
#  - sem erro de console e sem rolagem horizontal (1400 e 400 px);
#  - v12: relatório com capa (recomendação principal e isenção), "Em resumo" (data-sec="resumo": 4 KPIs, gráfico de barras
#    por camada com 7 barras e gráfico de colunas por exercício, fatos do caso), "Recomendações para você" (até 5 cartões de
#    prioridade alta e a lista completa com "Ir à pergunta"), "Perfil do caso" (data-sec="perfil", cartões por área com os
#    campos v11), blocos A e B com faixa colorida, respostas que faltam no fim; painel lateral escondido; índice com a seção
#    atual; barra de ações fixa (Baixar PDF, Voltar, Copiar texto, Exportar/Importar); nenhum texto abaixo de .86rem;
#    figura de A3 em miniatura com "Ampliar a figura" e visualizador (Esc, fundo, Fechar; foco preso e devolvido);
#  - PDF em EN (pdftotext): "Procurement plan", "Recommendations for you", "Cost and procurement", "Policy and governance", a URL,
#    a Figura 1 numa página própria (imagem JPEG 900×1225 e crédito CC BY-SA 3.0 IGO na mesma página),
#    nome procurement-plan-<slug>.pdf e nenhuma palavra em português da lista do test_idiomas.py.
import asyncio, os, re, subprocess, sys
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = '/tmp/claude-0/v9_plano'
os.makedirs(TMP, exist_ok=True)
NAV = os.environ.get('NAV', os.path.join(RAIZ, 'navegador.html'))   # NAV=<arquivo> testa outro build
SK = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>' + open(NAV).read() + '</body></html>'
open(f'{TMP}/nav.html', 'w').write(SK)
URL_TCO = 'https://unesdoc.unesco.org/ark:/48223/pf0000399348'
PT = re.compile(r'ção|ções|ã|õ|\b(?:não|você|para o|do caso|também|custo|orçament|decisão)\b', re.I)
SECOES = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9']
RESUMO_V11 = ['Prova de conceito ou piloto', 'Quantas ferramentas', 'Internet adequada nas escolas', 'Modelo de uso dos dispositivos', 'Os dispositivos já existem',
  'Quem será formado', 'Formato da formação', 'Horas de formação por pessoa', 'Quem paga a formação', 'Quem dá suporte aos usuários', 'Nível de suporte',
  'Nível de acompanhamento do uso', 'Primeira etapa da implantação', 'Arquitetura considerada', 'Tempo para chegar a todos depois da implantação']
CREDITO = 'Figura 1 de Krueger, K. e Jackson, F. para CoSN (2026), Beyond the price tag, p. 11. © UNESCO 2026, licença CC BY-SA 3.0 IGO; reproduzida sem alterações.'
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
                await pg.evaluate("Promise.all([...document.querySelectorAll('#plano figure img')].map(i => i.decode().catch(() => null)))")
                r = await pg.evaluate("""(() => { const P = document.getElementById('plano'); if (!P) return null;
                  const ordem = [...P.querySelectorAll('[data-bloco], [data-sec]')].map(e => e.dataset.bloco ? '[' + e.dataset.bloco + ']' : e.dataset.sec);
                  const blocos = [...P.querySelectorAll('[data-bloco]')].map(e => e.textContent.trim());
                  const a3 = P.querySelector('[data-sec="A3"] table tbody');
                  return { vista: S.vista, ordem, blocos, texto: P.innerText,
                    a3linhas: a3 ? a3.rows.length : 0, a3link: !!P.querySelector('[data-sec="A3"] a[href="%s"]'),
                    a1: (P.querySelector('[data-sec="A1"]') || {}).innerText || '', a2: (P.querySelector('[data-sec="A2"]') || {}).innerText || '',
                    formula: typeof secaoFormula === 'function',
                    resumo: (P.querySelector('[data-sec="perfil"]') || {}).innerText || '', recsH: (P.querySelector('[data-sec="recs"] h3') || {}).innerText || '',
                    capa: (P.querySelector('.rp-capa') || {}).textContent || '', kpis: P.querySelectorAll('[data-sec="resumo"] .rp-kpi').length,
                    barras: P.querySelectorAll('[data-sec="resumo"] .rp-bar svg').length, cols: P.querySelectorAll('[data-sec="resumo"] .rp-col svg').length,
                    cartoes: P.querySelectorAll('[data-sec="perfil"] .rp-card').length, topo: P.querySelectorAll('[data-sec="recs"] .rp-tc').length,
                    altas: P.querySelectorAll('[data-sec="recs"] .rc-item[data-prio="alta"]').length,
                    painel: getComputedStyle(document.getElementById('painel')).display, indice: P.querySelectorAll('.rp-indice a[data-toc-l]').length,
                    barra: [...P.querySelectorAll('.rp-barra [data-act]')].map(b => b.dataset.act),
                    faltasFim: (() => { const f = P.querySelector('[data-sec="faltas"]'); const r = P.querySelector('[data-sec="refs"]'); return !f || (r && (r.compareDocumentPosition(f) & 4) > 0); })(),
                    minFonte: (() => { let m = 99, q = ''; P.querySelectorAll('*').forEach(e => { if (!e.childNodes.length || ![...e.childNodes].some(n => n.nodeType === 3 && n.data.trim())) return; const r = e.getBoundingClientRect(); if (!r.width) return; const f = parseFloat(getComputedStyle(e).fontSize); if (f < m) { m = f; q = e.className + ' ' + e.textContent.slice(0, 30); } }); return [m, q]; })(),
                    fig: (() => { const f = P.querySelector('[data-sec="A3"] figure img, [data-sec="A3"] ~ figure img, #plano-fig-tco img'); const sec = f && f.closest('section'); return f ? { ok: f.complete && f.naturalWidth === 900 && f.naturalHeight === 1225, w: f.getBoundingClientRect().width, sec: sec ? sec.dataset.sec : '', cap: (f.closest('figure').querySelector('figcaption') || {}).innerText || '' } : null; })(),
                    temFig: typeof FIG_TCO !== 'undefined',
                    parcial: (P.querySelector('.parcial') || {}).innerText || '', nResp: P.querySelectorAll('.parcial [data-ir]').length,
                    sw: document.documentElement.scrollWidth }; })()""" % URL_TCO)
                ok(r is not None and r['vista'] == 'plano', f'{tag} {ex}: #plano aberto pelo botão')
                if not r: continue
                o = r['ordem']
                ok(o.index('[A]') < o.index('[B]') if '[A]' in o and '[B]' in o else False, f'{tag} {ex}: bloco A antes do bloco B')
                ok([re.sub(r'^[AB]\.?\s*', '', re.sub(r'^([AB])\1', r'\1', b)) for b in r['blocos'][:2]] == ['Custo e compra', 'Política e governança'], f'{tag} {ex}: nomes dos blocos {r["blocos"][:2]}')
                ok([s for s in o if s in SECOES] == SECOES and 'A8' not in o, f'{tag} {ex}: seções A1–A7 e B1–B9 em ordem')
                ok(all(o.index(s) > o.index('[A]') for s in SECOES[:7]) and all(o.index(s) > o.index('[B]') for s in SECOES[7:]), f'{tag} {ex}: seções dentro dos blocos')
                ok('Fonte de recursos' not in r['texto'] and 'Quem paga depois do teste' not in r['texto'], f'{tag} {ex}: sem fonte de recursos')
                faltam = [k for k in RESUMO_V11 if k not in r['resumo']]
                ok(not faltam, f'{tag} {ex}: resumo com os campos v11 (faltam {faltam})')
                ok(r['recsH'] == 'Recomendações para você', f'{tag} {ex}: título "Recomendações para você" ({r["recsH"]})')
                if r['temFig']:
                    ok(r['fig'] is not None and r['fig']['sec'] == 'A3' and r['fig']['ok'], f'{tag} {ex}: Figura 1 na seção A3 ({r["fig"] and {k: v for k, v in r["fig"].items() if k != "cap"}})')
                    ok(r['fig'] is not None and r['fig']['cap'] == CREDITO, f'{tag} {ex}: legenda e crédito da Figura 1')
                    ok(r['fig'] is not None and r['fig']['w'] <= w - 20, f'{tag} {ex}: figura cabe na largura ({r["fig"] and r["fig"]["w"]})')
                else: ok(False, f'{tag} {ex}: FIG_TCO no build')
                ok('recs' in o and 'resumo' in o and o.index('resumo') < o.index('recs') < o.index('perfil') < o.index('[A]'), f'{tag} {ex}: Em resumo, recomendações e perfil do caso antes do bloco A ({o[:4]})')
                ok('Recomendação principal' in r['capa'] and 'não da UNESCO' in r['capa'] and 'Plano de contratação' in r['capa'], f'{tag} {ex}: capa com recomendação principal e isenção')
                ok(r['kpis'] == 4 and r['barras'] == 7 and r['cols'] >= 4, f'{tag} {ex}: Em resumo com 4 KPIs, 7 barras e colunas por exercício ({r["kpis"]}, {r["barras"]}, {r["cols"]})')
                ok(r['cartoes'] >= 7, f'{tag} {ex}: perfil do caso em cartões ({r["cartoes"]})')
                ok(r['topo'] == min(5, r['altas']), f'{tag} {ex}: {r["topo"]} cartões de prioridade alta ({r["altas"]} altas)')
                ok(r['painel'] == 'none', f'{tag} {ex}: painel lateral escondido na vista do plano')
                ok(r['indice'] >= 6 and r['barra'][:2] == ['pdf', 'voltar-percurso'] and 'copiar' in r['barra'] and 'imp-json' in r['barra'], f'{tag} {ex}: índice ({r["indice"]}) e barra de ações {r["barra"]}')
                ok(r['faltasFim'], f'{tag} {ex}: respostas que faltam no fim')
                ok(r['minFonte'][0] >= 13.75, f'{tag} {ex}: nenhum texto abaixo de .86rem ({r["minFonte"]})')
                if r['formula']: ok('Como o custo é calculado' in r['a2'] and 'As contas de cada ano' in r['a2'], f'{tag} {ex}: A2 com a fórmula do custo')
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
            await pg.evaluate("""(()=>{carregarExemplo('novo'); S.boasVindas=false; S.caso.testes=['recomendar']; S.caso.teste='recomendar'; S.respC.testes=true; S.respC.teste=true;
              S.caso.piloto={escolas:20, participantes:1200, meses:4}; S.caso.tipoTec='paga'; S.caso.pagamento='usuario';
              ['piloto','piloto.escolas','piloto.participantes','piloto.meses','setup','tipoTec','pagamento'].forEach(k=>{S.respC[k]=true;});
              S.custo.editado=false; S.vista=''; render();})()""")
            await pg.locator('[data-act="gerar-plano"]:visible').first.click(); await pg.wait_for_timeout(250)
            r = await pg.evaluate("""(()=>{const P=document.getElementById('plano'); const tr=[...P.querySelectorAll('[data-sec=perfil] .rp-kv')].find(t=>/^Piloto: escolas/.test(t.querySelector('dt').innerText));
              return {esc: tr ? tr.querySelector('dd').innerText : '', a1: P.querySelector('[data-sec=A1]').innerText, a3: P.querySelector('[data-sec=A3]').parentElement.innerText,
                a2: (P.querySelector('[data-sec=A2] .kpi-nota')||{}).innerText||'', prem: P.querySelector('[data-sec=A2]').textContent}})()""")
            ok(r['esc'].startswith('20 escolas'), f'{tag} resumo mostra as escolas digitadas com "recomende" ({r["esc"]})')
            ok('descreve um piloto' in r['a1'] and '2.3.8' in r['a1'] if 'prova de conceito.' in r['a1'] else True, f'{tag} A1 avisa que o setup descreve um piloto quando recomenda só a prova de conceito')
            ok('licença institucional só compensa' not in r['a3'], f'{tag} A3 sem ponto de equilíbrio com licença por usuário')
            ok('premissas padrão' in r['a2'], f'{tag} A2 rotula estimativa com premissas padrão')
            # v10: com a fórmula (formula.js), preço e origem ficam em "De onde vêm os números"
            ok(('Preço da licença por usuário por mês' in r['prem'] and 'Premissas de partida' in r['prem']) or ('Preço da licença:' in r['prem'] and 'Preços e quantidades de partida' in r['prem']), f'{tag} A2 lista preço da licença e exemplo de origem')
            # v12: figura de A3 em miniatura e visualizador sobre a página
            v = await pg.evaluate("""(()=>{const f=document.querySelector('#plano-fig-tco'); const b=f && f.parentElement.querySelector('.fig-amp');
              return {img: f ? f.querySelector('img').getBoundingClientRect().width : 0, btn: !!b, velho: document.querySelectorAll('#plano [data-fig]').length};})()""")
            ok(v['btn'] and 0 < v['img'] <= 462 and v['velho'] == 0, f'{tag} A3: miniatura até 460 px com "Ampliar a figura" ({v})')
            await pg.locator('#plano .fig-amp').scroll_into_view_if_needed(); await pg.locator('#plano .fig-amp').click(); await pg.wait_for_timeout(200)
            v = await pg.evaluate("""(()=>{const d=document.getElementById('visor-fig'); const i=d && d.querySelector('img'); const r=i && i.getBoundingClientRect();
              return {open: !!(d && d.open), role: d && d.getAttribute('role'), modal: d && d.getAttribute('aria-modal'), foco: !!(document.activeElement && document.activeElement.closest('#visor-fig')),
                w: r ? r.width : 0, cap: (d.querySelector('.visor-leg')||{}).innerText||'', sw: document.documentElement.scrollWidth};})()""")
            ok(v['open'] and v['role'] == 'dialog' and v['modal'] == 'true' and v['foco'] and v['w'] <= w and 'CC BY-SA 3.0 IGO' in v['cap'] and v['sw'] <= w + 1, f'{tag} visualizador aberto, modal, com foco e legenda ({v})')
            for _ in range(4): await pg.keyboard.press('Tab')
            ok(await pg.evaluate("!!document.activeElement.closest('#visor-fig')"), f'{tag} visualizador: foco preso')
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(150)
            ok(await pg.evaluate("!document.getElementById('visor-fig').open && document.activeElement.classList.contains('fig-amp')"), f'{tag} visualizador: Esc fecha e devolve o foco ao botão')
            await pg.locator('#plano-fig-tco img').click(); await pg.wait_for_timeout(150)
            await pg.mouse.click(3, h - 3); await pg.wait_for_timeout(150)
            ok(await pg.evaluate("!document.getElementById('visor-fig').open"), f'{tag} visualizador: clique no fundo fecha')
            await pg.locator('#plano .fig-amp').click(); await pg.wait_for_timeout(150)
            await pg.locator('#visor-fig [data-visor-fechar]').click(); await pg.wait_for_timeout(150)
            ok(await pg.evaluate("!document.getElementById('visor-fig').open"), f'{tag} visualizador: "Fechar" fecha')
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
                            for s in ['Procurement plan', 'Recommendations for you', 'Cost and procurement', 'Policy and governance', URL_TCO]:
                                ok(s in plano, f'pdf en {ex}: contém "{s}"')
                            ok('Recommendations for your case' not in plano and 'Funding source' not in plano and 'Source of funds' not in plano, f'pdf en {ex}: sem título antigo nem fonte de recursos')
                            # Figura 1 numa página própria: JPEG 900×1225 sozinho na página, com o crédito na mesma página
                            imgs = subprocess.run(['pdfimages', '-list', arq], capture_output=True, text=True).stdout.split('\n')[2:]
                            fig = [l.split() for l in imgs if l.strip() and l.split()[3:5] == ['900', '1225']]
                            ok(len(fig) == 1, f'pdf en {ex}: Figura 1 (JPEG 900×1225) no PDF ({len(fig)})')
                            if fig:
                                pag = int(fig[0][0])
                                tp = subprocess.run(['pdftotext', '-layout', '-f', str(pag), '-l', str(pag), arq, '-'], capture_output=True, text=True).stdout
                                ok('CC BY-SA 3.0 IGO' in tp and 'Figure 1' in tp and 'reproduced without changes' in tp, f'pdf en {ex}: crédito da figura na página {pag}')
                                ok(len([l for l in tp.split('\n') if l.strip()]) <= 8, f'pdf en {ex}: página da figura só com título, figura, legenda e rodapé')
                                antes = subprocess.run(['pdftotext', '-layout', '-f', '1', '-l', str(pag - 1), arq, '-'], capture_output=True, text=True).stdout
                                ok('A3.' in antes and 'A4.' not in antes, f'pdf en {ex}: figura logo depois de A3')
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
