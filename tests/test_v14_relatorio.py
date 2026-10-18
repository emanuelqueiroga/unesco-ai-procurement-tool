# Relatório do plano de contratação na v14 (BL6, BL5.3: src/relatorio.js, src/resumo.js, src/plano_pdf.js).
# Uso: python3 tests/test_v14_relatorio.py   (depois de bash build.sh; NAV=<arquivo> testa outro build)
# Verifica, na página (PT, exemplos A a D e caso em branco) e no PDF (PT, exemplo A e caso em branco):
#  - resumo da primeira página com os números do motor: TCO central, faixa P10 a P90 (P10 <= central <= P90),
#    custo por aprendiz/professor/usuário, Ano 0, custo anual em regime, três maiores direcionadores (tornado) e cinco ações
#    com "Quem age" só quando PASSO_AJUDA traz a área (nada inventado);
#  - "Como ler este plano" e a lista curta de respostas que faltam antes da seção 1;
#  - corpo em ordem de decisão (seções 1 a 5, depois "Anexos" A a I), com títulos numéricos gerados dos números
#    (recorrente / total, faixa, custo de saída) e sem códigos K1–K6, A1–A7, B1–B9 no corpo;
#  - cinco gráficos (fases e anos por camada, camadas, adoção, cenários, tornado), cada um com a leitura gerada dos dados,
#    na página e no PDF; simulação determinista (mesma semente, mesmo resultado) e rápida;
#  - PDF: sumário executivo com até 3 páginas (seis respostas, cinco ações com O quê, Por quê, Para quê, Como, Quem, Quando,
#    custo em resumo); corpo do caso em branco com no máximo 7 páginas depois dele; página 1 com os mesmos números da página;
#  - anexo "Premissas e fontes" com todas as entradas de premissasDoCaso (valor, origem, fonte, grau; fora da faixa marcado),
#    versaoReferencias() e a nota de métodos; glossário com todos os termos de glossarioLista();
#  - 390 px sem rolagem horizontal; árabe em RTL;
#  - PT, EN, ES e FR: todo texto novo (TXT_REL) tem tradução nos três arquivos i18n/v14_relatorio_*.json; ar, zh, bm, zu e sw
#    usam o inglês.
import asyncio, json, os, re, subprocess, sys, time
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = '/tmp/claude-0/v14_rel/test_relatorio'
os.makedirs(TMP, exist_ok=True)
NAV = os.environ.get('NAV', os.path.join(RAIZ, 'navegador.html'))
SK = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>' + open(NAV).read() + '</body></html>'
open(f'{TMP}/nav.html', 'w').write(SK)
CODIGOS = re.compile(r'\b(?:K[1-6](?:\.\d)?|A[1-7]|B[1-9])\b')
GRAFICOS = ['fases', 'camadas', 'adocao', 'cenarios', 'tornado']
falhas = []

def ok(cond, msg):
    print(('ok   ' if cond else 'FALHA ') + msg)
    if not cond: falhas.append(msg)

def norm(s):
    return re.sub(r'\s+', ' ', str(s).replace(' ', ' ').replace(' ', ' ').replace(' ', ' ')).strip()

def paginas(arq, layout=False):
    n = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', arq], capture_output=True, text=True).stdout).group(1))
    a = ['-layout'] if layout else []
    return [norm(subprocess.run(['pdftotext'] + a + ['-f', str(i), '-l', str(i), arq, '-'], capture_output=True, text=True).stdout) for i in range(1, n + 1)]

# Números esperados, calculados direto com as funções do motor (sem passar por src/relatorio.js)
MOTOR = r"""(() => {
  const n = numerosCusto(); const tco = n.av.tco;
  const cfg = cfgAtual(); garantirOpc(cfg);
  const sim = simular(cfg, 1500, 20261003), tor = tornado(cfg);
  const central = tco.tcoDescontado;
  const lo = Math.min(sim.ct.p10, central), hi = Math.max(sim.ct.p90, central);
  const apr = tco.custoPorAprendizAno != null ? tco.custoPorAprendizAno : tco.custoPorProfessorAno != null ? tco.custoPorProfessorAno : n.ind.icu;
  const recs = recomendacoesCaso().slice(0, 5);
  const quem = r => { const p = String(r.ir || '').split(':')[1]; const a = p && PASSO_AJUDA[p]; return a && a.quem ? tr(a.quem) : ''; };
  const L = relDados(n);
  return { central, lo, hi, p10: sim.ct.p10, p90: sim.ct.p90, centralTxt: grande(central), loTxt: grande(lo), hiTxt: grande(hi),
    apr: din(apr, 2), ano0: grande(n.ano0), regime: grande(tco.anual.eco), pRec: pct(tco.pRecorrente),
    direc: tor.rows.slice(0, 3).map(r => tr(r.nome)), acoes: recs.map(r => { const t = tr(r.texto), m = t.match(/^(.*?)\s?[:：]\s+(.+)$/s); return { texto: t, oque: m ? m[1] : t, quem: quem(r) }; }),
    rel: L ? { central: L.central, lo: L.lo, hi: L.hi } : null,
    nPrem: (premissasDoCaso(S.caso, cfg) || []).length };
})()"""

PAGINA = r"""(() => { const P = document.getElementById('plano'); if (!P) return null;
  const ids = [...P.querySelectorAll('[data-sec]')].map(e => e.dataset.sec);
  const corpoEls = [...P.querySelectorAll('.rp-sintese, .rp-comoler, .rp-princ-sec, .rp-princ-sec ~ div[data-sec]')].filter(e => !e.closest('.rp-anexos'));
  const sec = id => (P.querySelector('[data-sec="' + id + '"]') || {});
  const antes = [];
  const ax = P.querySelector('.rp-anexos');
  P.querySelectorAll('[data-sec]').forEach(e => { if (e.dataset.sec === 'anexos' || (ax && (ax === e || ax.contains(e)))) return; antes.push(e); });
  const corpo = antes.filter(e => !antes.some(o => o !== e && o.contains(e))).map(e => e.innerText).join('\n');
  const g = {};
  GR.forEach(t => { const f = P.querySelector('[data-grafico="' + t + '"]'); g[t] = f ? { n: 1, leitura: (f.querySelector('.rg-leitura') || {}).innerText || '', titulo: (f.querySelector('.rp-graf-t') || {}).innerText || '' } : null; });
  const H = [...P.querySelectorAll('.rp-princ-sec')].map(e => ({ rot: (e.querySelector('.rp-rot') || {}).textContent, h: (e.querySelector('h3') || {}).textContent }));
  return { vista: S.vista, ids, corpo, sintese: sec('sintese').innerText || '', tc: [...P.querySelectorAll('[data-sec="sintese"] .rp-tc')].map(e => e.innerText),
    graf: g, H, comoler: sec('comoler').innerText || '', faltas: [...P.querySelectorAll('[data-sec="faltas"]')].length,
    premissas: sec('premissas').innerText || '', nLinhasPrem: sec('premissas').querySelectorAll('table tbody tr').length,
    foraN: sec('premissas').querySelectorAll('table tbody tr.hl, table tbody tr[data-fora]').length,
    metodos: sec('metodos').innerText || '', glossario: sec('glossario').innerText || '',
    sw: document.documentElement.scrollWidth, dir: document.documentElement.dir, anexoG: (sec('anexo-g').innerText || ''), refsAntes: ids.indexOf('metodos') < ids.indexOf('anexo-h') }; })()""".replace('GR', json.dumps(GRAFICOS))

PREM = r"""(() => { const L = premissasDoCaso(S.caso, cfgAtual()) || []; const v = versaoReferencias();
  return { rot: L.map(p => tr(p.rotulo)), fora: L.filter(p => p.foraDaFaixa).length, ver: v ? v.referencias : '', glos: glossarioLista(LANG).map(g => g.termo) }; })()"""

GRAF_TXT = r"""(() => { const G = relGraficos(relDados()); return G ? Object.fromEntries(Object.entries(G).map(([k, g]) => [k, { h: g.h, leitura: g.leitura }])) : null; })()"""

async def abrir(pg, ex):
    await pg.evaluate(f"(()=>{{carregarExemplo('{ex}'); S.boasVindas=false; S.vista=''; render(); abrirPlano();}})()")
    await pg.wait_for_timeout(250)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1200, 'height': 900}, accept_downloads=True)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') and 'TUNNEL' not in m.text else None)
        await pg.goto(f'file://{TMP}/nav.html'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
        await pg.select_option('#sel-lang', 'pt'); await pg.wait_for_timeout(150)

        # ------------------------------------------------------------ página: resumo, ordem, gráficos, anexos
        for ex in ['A', 'B', 'C', 'D', 'novo']:
            await abrir(pg, ex)
            M = await pg.evaluate(MOTOR); r = await pg.evaluate(PAGINA); PR = await pg.evaluate(PREM)
            ok(r is not None and r['vista'] == 'plano', f'{ex}: plano aberto')
            if not r: continue
            s = r['sintese']
            ok(M['p10'] > 0 and M['lo'] <= M['central'] <= M['hi'] and M['rel'] and abs(M['rel']['central'] - M['central']) < 1e-6 and abs(M['rel']['lo'] - M['lo']) < 1e-6 and abs(M['rel']['hi'] - M['hi']) < 1e-6,
               f'{ex}: P10 <= central <= P90, iguais aos do motor ({M["loTxt"]} / {M["centralTxt"]} / {M["hiTxt"]})')
            ok(M['centralTxt'] in s and M['loTxt'] in s and M['hiTxt'] in s and 'P10 a P90' in s, f'{ex}: resumo com o TCO central e a faixa P10 a P90')
            ok(M['apr'] in s and M['ano0'] in s and M['regime'] in s, f'{ex}: resumo com custo por pessoa, Ano 0 e custo anual em regime ({M["apr"]}, {M["ano0"]}, {M["regime"]})')
            ok(all(d in s for d in M['direc']) and len(M['direc']) == 3, f'{ex}: três maiores direcionadores do tornado {M["direc"]}')
            ok(len(r['tc']) == len(M['acoes']) and all(a['oque'] in t for a, t in zip(M['acoes'], r['tc'])), f'{ex}: cinco ações do motor de recomendações ({len(r["tc"])})')
            SEIS = ['O quê?', 'Por quê?', 'Para quê?', 'Como?', 'Quem?', 'Quando?']
            ok(all(all(k in t for k in SEIS) for t in r['tc']), f'{ex}: cada ação responde O quê, Por quê, Para quê, Como, Quem e Quando')
            ok(all(((a['quem'] and a['quem'][:1].upper() + a['quem'][1:] in t) or (not a['quem'] and 'A equipe responsável pelo caso' in t)) for a, t in zip(M['acoes'], r['tc'])), f'{ex}: "Quem?" com a área de PASSO_AJUDA ou a equipe do caso (nada inventado)')
            IC = await pg.evaluate("""(() => { const d = relDados(numerosCusto()); const I = relIcebergs(d); return I ? { f: I.fases.map(f => ({ dif: Math.abs(f.tAcima + f.tAbaixo - d.av.fases.porFase[f.id].total), tot: d.av.fases.porFase[f.id].total })), n: document.querySelectorAll('[data-sec="sintese"] .ic').length } : null; })()""")
            ok(IC is not None and len(IC['f']) >= 1 and IC['n'] == len(IC['f']) and all(x['dif'] < 1e-6 * max(1, abs(x['tot'])) for x in IC['f']), f'{ex}: um iceberg por fase, e acima + abaixo da água = custo da fase no motor ({IC and len(IC["f"])})')
            ok('A proposta em seis respostas' in s and all(k in s for k in ['O quê?', 'Por quê?', 'Para quê?', 'Como?', 'Entregáveis', 'Indicadores']), f'{ex}: sumário executivo com as seis respostas')
            # ordem de decisão
            ids = r['ids']; ordem = ['sintese', 'comoler', 's1', 's2', 's3', 's4', 's5', 'anexos', 'anexo-a', 'anexo-b', 'anexo-c', 'anexo-d', 'anexo-e', 'anexo-f', 'anexo-g', 'anexo-h', 'anexo-i']
            ok([i for i in ids if i in ordem] == ordem, f'{ex}: resumo, "Como ler", seções 1 a 5 e anexos A a I em ordem')
            ok('Como ler este plano' in r['comoler'] and ids.index('comoler') < ids.index('s1'), f'{ex}: caixa "Como ler este plano" antes da seção 1')
            if ex == 'novo': ok(r['faltas'] == 2 and ids.index('faltas') < ids.index('s1'), f'{ex}: lista curta de respostas que faltam antes da seção 1 e lista completa no anexo A')
            ok([h['rot'] for h in r['H']] == ['O que se compra', 'O que custa e quando', 'O que pode mudar o custo', 'O que exigir na contratação', 'Que governança é necessária'], f'{ex}: perguntas das cinco seções')
            h = [x['h'] for x in r['H']]
            ok(f'Os custos recorrentes são {M["pRec"]} do total' == h[1], f'{ex}: título 2 gerado do número ({h[1]})')
            ok(h[2] == f'O custo total pode ficar entre {M["loTxt"]} e {M["hiTxt"]}', f'{ex}: título 3 com a faixa do motor ({h[2]})')
            ok(re.match(r'(Sair do contrato custaria|O contrato deve cobrir)', h[3]) is not None and re.search(r'\d', h[3]) is not None, f'{ex}: título 4 com número ({h[3]})')
            ok(re.search(r'\d', h[4]) is not None and re.search(r'(Nenhuma|Estão confirmadas|Todas)', h[4]) is not None, f'{ex}: título 5 com número ({h[4]})')
            ok(not CODIGOS.search(r['corpo']), f'{ex}: nenhum código K1–K6, A1–A7, B1–B9 no corpo ({CODIGOS.findall(r["corpo"])[:5]})')
            # gráficos
            ok(all(r['graf'][t] for t in GRAFICOS), f'{ex}: cinco gráficos na página ({[t for t in GRAFICOS if r["graf"][t]]})')
            G = await pg.evaluate(GRAF_TXT)
            ok(G and all(len(r['graf'][t]['leitura']) > 30 and r['graf'][t]['leitura'] == G[t]['leitura'] for t in GRAFICOS), f'{ex}: cada gráfico com a leitura gerada dos dados')
            if ex == 'A': print('     leituras:', ' | '.join(r['graf'][t]['leitura'][:70] for t in GRAFICOS))
            # anexo de premissas
            ok(r['nLinhasPrem'] == M['nPrem'] and all(norm(x)[:24] in norm(r['premissas']) for x in PR['rot']), f'{ex}: anexo "Premissas e fontes" lista as {M["nPrem"]} entradas de premissasDoCaso ({r["nLinhasPrem"]})')
            ok(all(k in r['premissas'] for k in ['Valor', 'Origem', 'Fonte e ano', 'Grau']), f'{ex}: colunas valor, origem, fonte e grau')
            if PR['fora']: ok(r['premissas'].count('Fora da faixa') >= PR['fora'], f'{ex}: {PR["fora"]} valores fora da faixa marcados')
            ok(PR['ver'] and PR['ver'] in r['metodos'] and 'Monte Carlo' in r['metodos'] and 'semente fixa (20261003)' in r['metodos'] and r['refsAntes'], f'{ex}: métodos com versaoReferencias() ({PR["ver"]}), Monte Carlo e semente')
            ok(all(norm(t)[:20] in norm(r['glossario']) for t in PR['glos']) and len(PR['glos']) > 5, f'{ex}: glossário com os {len(PR["glos"])} termos')
        # ------------------------------------------------------------ simulação: determinista e rápida
        v = await pg.evaluate("""(() => { carregarExemplo('A'); const cfg = cfgAtual(); garantirOpc(cfg);
          let t0 = performance.now(); const a = simular(cfg, 1500, 20261003); const t1 = performance.now() - t0;
          const b = simular(cfg, 1500, 20261003); const c = simular(cfg, 1500, 7);
          t0 = performance.now(); REL_CACHE = null; relDados(); const t2 = performance.now() - t0;
          t0 = performance.now(); relDados(); const t3 = performance.now() - t0;
          return { igual: a.ct.p10 === b.ct.p10 && a.ct.p50 === b.ct.p50 && a.ct.p90 === b.ct.p90, outra: c.ct.p10 !== a.ct.p10, t1, t2, t3, seed: a.seed }; })()""")
        ok(v['igual'] and v['outra'], 'simulação determinista: mesma semente, mesmo resultado; outra semente, outro resultado')
        ok(v['t2'] < 3000 and v['t3'] < 100, f'simulação rápida: primeira chamada {v["t2"]:.0f} ms, em cache {v["t3"]:.0f} ms')

        # ------------------------------------------------------------ 390 px e árabe (RTL)
        for lang, w in [('pt', 390), ('ar', 390), ('ar', 1200)]:
            c2 = await b.new_context(viewport={'width': w, 'height': 800})
            q = await c2.new_page()
            await q.goto(f'file://{TMP}/nav.html'); await q.evaluate('localStorage.clear()'); await q.reload(); await q.wait_for_timeout(300)
            await q.select_option('#sel-lang', lang); await q.wait_for_timeout(150)
            await abrir(q, 'A')
            r = await q.evaluate(PAGINA)
            if lang == 'pt':
                ok(r['sw'] <= w + 1, f'{lang} {w} px: sem rolagem horizontal ({r["sw"]})')
                await q.screenshot(path=f'{TMP}/pagina_{lang}_{w}.png', full_page=False)
            else:
                ok(r['dir'] == 'rtl' and all(r['graf'][t] for t in GRAFICOS) and len(r['tc']) == 5, f'{lang} {w} px: RTL com os cinco gráficos e as cinco ações')
                if w == 390: ok(r['sw'] <= w + 1, f'{lang} {w} px: sem rolagem horizontal ({r["sw"]})')
            await c2.close()

        # ------------------------------------------------------------ PDF (PT): exemplo A e caso em branco
        for ex in ['A', 'novo']:
            await abrir(pg, ex)
            M = await pg.evaluate(MOTOR); PR = await pg.evaluate(PREM); G = await pg.evaluate(GRAF_TXT)
            async with pg.expect_download() as dl:
                await pg.locator('[data-act="pdf"]:visible').first.click()
            d = await dl.value; arq = f'{TMP}/relatorio_pt_{ex}.pdf'; await d.save_as(arq)
            P = paginas(arq); N = len(P); raw = norm(' '.join(paginas(arq)))
            pAx = next((i + 1 for i, t in enumerate(P) if i > 1 and 'ANEXO A' in t), 0)
            ok(pAx > 2, f'pdf {ex}: anexos começam na p. {pAx} de {N}')
            corpo = P[:pAx - 1]
            pCo = next((i + 1 for i, t in enumerate(P) if 'Como ler este plano' in t and 'NESTE PLANO' in t), 0)
            execu = ' '.join(P[:pCo - 1]); nEx = pCo - 1
            ok(1 <= nEx <= 3, f'pdf {ex}: sumário executivo com {nEx} páginas (máximo 3)')
            if ex == 'novo': ok(len(corpo) - nEx <= 7, f'pdf {ex}: corpo do caso em branco com {len(corpo) - nEx} páginas depois do sumário (máximo 7); anexos {N - len(corpo)}')
            else: print(f'     pdf {ex}: sumário {nEx} páginas, corpo {len(corpo) - nEx}, anexos {N - len(corpo)}, total {N}')
            c = P[0]
            ok(all(norm(k) in c for k in [M['centralTxt'], M['loTxt'], M['hiTxt'], M['apr'], M['ano0'], M['regime']]), f'pdf {ex}: página 1 com os números do motor ({M["centralTxt"]}, {M["loTxt"]} a {M["hiTxt"]})')
            ok('A proposta em seis respostas' in c and 'O quê?' in c and 'Por quê?' in c, f'pdf {ex}: página 1 com as seis respostas')
            ok(all(d_ in execu for d_ in M['direc']) and all(norm(a['oque'])[:28] in execu for a in M['acoes']), f'pdf {ex}: sumário executivo com os três direcionadores e as cinco ações')
            ok(all(a['quem'][:1].upper() + a['quem'][1:] in execu for a in M['acoes'] if a['quem']), f'pdf {ex}: "Quem?" no sumário executivo')
            ok(not CODIGOS.search(' '.join(corpo)), f'pdf {ex}: sem códigos K, A e B no corpo ({CODIGOS.findall(" ".join(corpo))[:5]})')
            ok(all(norm(G[t]['h']) in raw for t in GRAFICOS), f'pdf {ex}: cinco gráficos com título ({[t for t in GRAFICOS if norm(G[t]["h"]) in raw]})')
            ok(all(norm(G[t]['leitura']).replace('−', '-') in raw for t in GRAFICOS), f'pdf {ex}: cada gráfico com a leitura da página')
            ok(f'Os custos recorrentes são {M["pRec"]} do total' in raw and f'O custo total pode ficar entre {M["loTxt"]} e {M["hiTxt"]}' in raw, f'pdf {ex}: títulos numéricos iguais aos da página')
            anexoG = ' '.join(P[pAx - 1:])
            ok(all(norm(x)[:20] in anexoG for x in PR['rot']), f'pdf {ex}: anexo "Premissas e fontes" lista as {len(PR["rot"])} entradas')
            ok(PR['ver'] in anexoG and 'Monte Carlo' in anexoG and 'semente fixa (20261003)' in anexoG, f'pdf {ex}: versaoReferencias() e nota de métodos no PDF')
            ok(all(norm(t)[:20] in anexoG for t in PR['glos']), f'pdf {ex}: glossário completo no PDF')
            if PR['fora']: ok(anexoG.count('Fora da faixa') >= PR['fora'], f'pdf {ex}: valores fora da faixa marcados no PDF')
            if ex == 'A':
                subprocess.run(['pdftoppm', '-r', '80', '-png', '-f', '1', '-l', '2', arq, f'{TMP}/pdf_pt_A'])

        # ------------------------------------------------------------ idiomas: textos novos traduzidos
        TXT = await pg.evaluate("Object.assign({}, TXT_REL)")
        J = {l: json.load(open(os.path.join(RAIZ, 'i18n', f'v14_relatorio_{l}.json'))) for l in ['en', 'es', 'fr']}
        for l in ['en', 'es', 'fr']:
            falta = [k for k, v in TXT.items() if v not in J[l] or not J[l][v] or not str(J[l][v]).strip()]
            ok(not falta, f'{l}: todo texto novo tem tradução em i18n/v14_relatorio_{l}.json ({len(TXT)} textos; faltam {falta[:4]})')
            ph = [k for k, v in TXT.items() if v in J[l] and sorted(re.findall(r'\{\d\}', v)) != sorted(re.findall(r'\{\d\}', J[l][v]))]
            ok(not ph, f'{l}: mesmos marcadores {{0}}, {{1}} nas traduções ({ph[:4]})')
        for l in ['en', 'es', 'fr']:
            await pg.select_option('#sel-lang', l); await pg.wait_for_timeout(150)
            # palavras iguais nos dois idiomas (ex.: "Total", "Fase" e "Valor" em espanhol) valem se o arquivo i18n as traz
            ig = [k for k, v in TXT.items() if J[l].get(v) == v]
            sem = await pg.evaluate("(ig => Object.entries(TXT_REL).filter(([k, v]) => !ig.includes(k) && tr(v) === v).map(([k]) => k))(%s)" % json.dumps(ig))
            ok(not sem, f'{l}: tr() devolve a tradução de todos os textos novos (sem tradução: {sem[:5]})')
            await abrir(pg, 'A')
            t = await pg.evaluate("document.getElementById('plano').innerText")
            ok(not re.search(r'Como ler este plano|Os números principais|O que se compra|As cinco ações|Faixa provável|Anexo [A-I]\b', t), f'{l}: página sem os títulos novos em português')
        for l in ['ar', 'zh', 'bm', 'zu', 'sw']:
            await pg.select_option('#sel-lang', l); await pg.wait_for_timeout(150)
            r = await pg.evaluate("[tr(TXT_REL.comoLer), tr(TXT_REL.q3), tr(TXT_REL.gCenariosL0)]")
            ok(r == ['How to read this plan', 'What could change the cost', 'The three scenarios have the same total cost: {0}.'], f'{l}: textos novos em inglês (fallback) {r}')
        await pg.select_option('#sel-lang', 'pt')
        ok(not errs, f'sem erros de console {errs[:5]}')
        await b.close()
    print('\n' + ('TUDO OK' if not falhas else f'{len(falhas)} FALHA(S)'))
    sys.exit(1 if falhas else 0)

asyncio.run(main())
