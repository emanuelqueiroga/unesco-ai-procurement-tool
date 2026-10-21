# Idiomas novos da v13 (RQ-18, pacote L): árabe, chinês, bambara, zulu e suaíli.
# Uso: python3 tests/test_v13_idiomas.py   (depois de bash build.sh; NAV=<arquivo> testa outro build)
# Capturas, PDFs e PNGs das páginas do PDF em /tmp/claude-0/v13_l/test/.
# Verifica:
#  - seletor com 9 idiomas, cada um com o nome na própria língua (lang e dir em cada <option>);
#  - <html dir="rtl" lang="ar"> em árabe e dir="ltr" nos outros oito; lang do <html> de cada idioma;
#  - árabe sem rolagem horizontal a 400 e a 1360 px: página inicial, passo 1.2, passo 2.3 e plano;
#  - mandala não espelhada (posição relativa dos textos igual à do português; SVG com direction ltr);
#  - números da esquerda para a direita (KPIs, valores, campos numéricos isolados e com direction ltr;
#    "US$" à esquerda do número na tela);
#  - aviso de tradução preliminar, no idioma e em inglês, nos 4 lugares (abaixo do seletor, faixa no topo,
#    pé do plano, capa e rodapé do PDF) só nos idiomas novos; some com IDIOMAS_REVISADOS ou "__revisado";
#  - fallback: chave ausente no idioma novo usa o inglês (nunca o português);
#  - números nos campos (sepNum, lerNumero, fmtEntrada, digitação) nos cinco idiomas; MAGNITUDES, UNID_MIL e
#    unidadesParaPT;
#  - folha do Google Fonts para ar, zh e bm e pilha de fontes por :lang;
#  - PDF em ar, zh e bm gerado sem erro, com a fonte embutida (pdffonts) e o texto extraído (pdftotext) com
#    letras árabes, ideogramas e ɛ/ɔ; PT continua só com Helvetica e sem aviso.
import asyncio, os, re, subprocess, sys, base64
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = os.environ.get('TMP_TESTE', '/tmp/claude-0/v13_l/test')
os.makedirs(TMP, exist_ok=True)
NAV = os.environ.get('NAV', os.path.join(RAIZ, 'navegador.html'))
SK = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>' + open(NAV).read() + '</body></html>'
ARQ = f'{TMP}/nav.html'
open(ARQ, 'w').write(SK)
NOVOS = ['ar', 'zh', 'bm', 'zu', 'sw']
ANTIGOS = ['pt', 'en', 'es', 'fr']
NOMES = {'pt': 'Português', 'en': 'English', 'es': 'Español', 'fr': 'Français', 'ar': 'العربية', 'zh': '中文', 'bm': 'Bamanankan', 'zu': 'isiZulu', 'sw': 'Kiswahili'}
HTML_LANG = {'pt': 'pt-BR', 'en': 'en', 'es': 'es', 'fr': 'fr', 'ar': 'ar', 'zh': 'zh-Hans', 'bm': 'bm', 'zu': 'zu', 'sw': 'sw'}
AVISO_EN = 'The language of this version is a preliminary translation and still needs to be reviewed by native speakers.'
RE_AR = re.compile('[؀-ۿﭐ-﷿ﹰ-﻿]')
RE_ZH = re.compile('[一-鿿]')
falhas = []

def ok(cond, msg):
    print(('ok   ' if cond else 'FALHA ') + msg)
    if not cond: falhas.append(msg)

def norm(s):
    return re.sub(r'\s+', ' ', str(s).replace(' ', ' ').replace(' ', ' ')).strip()

def pdf_paginas(arq):
    n = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', arq], capture_output=True, text=True).stdout).group(1))
    return [subprocess.run(['pdftotext', '-f', str(i), '-l', str(i), arq, '-'], capture_output=True, text=True).stdout for i in range(1, n + 1)]

VISTAS = {
    'inicio': "(()=>{S.boasVindas=true; S.vista=''; render(); window.scrollTo(0,0);})()",
    '1b': "(()=>{carregarExemplo('B'); S.boasVindas=false; S.vista=''; S.fase='contexto'; S.passo='1b'; render(); window.scrollTo(0,0);})()",
    '2c': "(()=>{carregarExemplo('B'); S.boasVindas=false; S.vista=''; S.fase='piloto'; S.passo='2c'; render(); window.scrollTo(0,0);})()",
    'plano': "(()=>{carregarExemplo('B'); S.boasVindas=false; S.vista=''; render(); abrirPlano();})()",
}
# posição dos textos da mandala relativa ao próprio SVG
MANDALA = """(() => { const s = document.querySelector('svg.mandala') || document.querySelector('#plano [data-grafico]'); if (!s) return null; const r = s.getBoundingClientRect();
  const cs = getComputedStyle(s); let el = s, tf = [];
  while (el && el !== document.documentElement) { const t = getComputedStyle(el).transform; if (t && t !== 'none') tf.push(t); el = el.parentElement; }
  return { dir: cs.direction, tf, txt: [...s.querySelectorAll('text')].map(t => { const b = t.getBoundingClientRect(); return [t.textContent, Math.round(b.left - r.left + b.width / 2), Math.round(b.top - r.top + b.height / 2)]; }) }; })()"""
# primeiro e último caractere de um valor monetário na tela
ORDEM_VALOR = """(() => { const out = []; document.querySelectorAll('.kpi .v, .rp-kpi .v, .resumo .linha .num, td.n, .dv-v, .dv-v2').forEach(el => {
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const t = n.data;
    const i = t.indexOf('US$'); const m = t.match(/\\d[\\d.,\\s\\u00a0\\u202f]*\\d/); if (i < 0 || !m) continue;
    const r1 = document.createRange(); r1.setStart(n, i); r1.setEnd(n, i + 1); const r2 = document.createRange(); r2.setStart(n, m.index); r2.setEnd(n, m.index + 1);
    const a = r1.getBoundingClientRect(), b = r2.getBoundingClientRect(); if (a.width && b.width) out.push([t, a.left < b.left]); } });
  return out; })()"""

async def gerar_pdf(pg, nome):
    t = await pg.evaluate("(()=>{ const d = gerarPDF(); return [d.output('datauristring').split(',')[1], d.getNumberOfPages()]; })()")
    arq = f'{TMP}/{nome}.pdf'
    open(arq, 'wb').write(base64.b64decode(t[0]))
    return arq

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1360, 'height': 900}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'ERR_' not in m.text and 'Failed to load resource' not in m.text else None)
        await pg.goto(f'file://{ARQ}'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)

        # ------------------------------------------------ seletor
        ops = await pg.evaluate("[...document.querySelectorAll('#sel-lang option')].map(o => [o.value, o.textContent, o.lang, o.dir])")
        ok(len(ops) == 9 and [o[0] for o in ops] == ANTIGOS + NOVOS, f'seletor com 9 idiomas {[o[0] for o in ops]}')
        ok(all(o[1] == NOMES[o[0]] for o in ops), 'nomes na própria língua ' + ', '.join(o[1] for o in ops))
        ok(all(o[2] == HTML_LANG[o[0]] and o[3] == ('rtl' if o[0] == 'ar' else 'ltr') for o in ops), 'lang e dir em cada opção')

        # ------------------------------------------------ direção, lang, aviso e fallback em cada idioma
        en_dic = await pg.evaluate("Object.keys(I18N.en).length")
        for l in ANTIGOS + NOVOS:
            await pg.select_option('#sel-lang', l); await pg.wait_for_timeout(150)
            await pg.evaluate(VISTAS['inicio'])
            d = await pg.evaluate("[document.documentElement.dir, document.documentElement.lang, LANG]")
            ok(d == [('rtl' if l == 'ar' else 'ltr'), HTML_LANG[l], l], f'{l}: <html dir="{d[0]}" lang="{d[1]}">')
            novo = l in NOVOS
            a = await pg.evaluate("""(() => { const f = document.getElementById('faixa-trad'), a = document.getElementById('aviso-lang');
              const vis = el => !!el && !el.hidden && el.getBoundingClientRect().height > 0;
              return { faixa: vis(f) ? f.textContent : '', sel: vis(a) ? a.textContent : '', loc: avisoTraducao() && avisoTraducao().local,
                selTop: vis(a) ? a.getBoundingClientRect().top : 0, selBottom: document.getElementById('sel-lang').getBoundingClientRect().bottom }; })()""")
            if novo:
                ok(bool(a['loc']) and a['loc'] in a['faixa'] and AVISO_EN in a['faixa'], f'{l}: (b) faixa no topo com o aviso no idioma e em inglês')
                ok(a['loc'] in a['sel'] and AVISO_EN in a['sel'] and 0 <= a['selTop'] - a['selBottom'] < 40, f'{l}: (a) aviso logo abaixo do seletor ao escolher o idioma')
                if l != 'en': ok(a['loc'] != AVISO_EN, f'{l}: aviso traduzido ({a["loc"][:40]}…)')
                # fallback EN: chave que o inglês tem e o idioma não
                fb = await pg.evaluate("""(() => { const k = Object.keys(I18N.en).find(k => !(k in (I18N[LANG] || {})) && /\\p{L}{4}/u.test(k) && !/[{}]/.test(k) && I18N.en[k] !== k);
                  if (k) return [k, tr(k), I18N.en[k], tr('Texto que não existe em nenhum dicionário xyz')];
                  const k2 = 'Chave só do inglês para testar o fallback'; I18N.en[k2] = 'English-only key to test the fallback'; if (typeof DIC_FALLBACK !== 'undefined') delete DIC_FALLBACK[LANG];
                  const r = [k2, tr(k2), I18N.en[k2], tr('Texto que não existe em nenhum dicionário xyz')]; delete I18N.en[k2]; if (typeof DIC_FALLBACK !== 'undefined') delete DIC_FALLBACK[LANG]; return r; })()""")
                ok(fb is not None and fb[1] == fb[2], f'{l}: chave ausente usa o inglês ({fb and fb[0][:30]!r} → {fb and fb[1][:30]!r})')
            else:
                ok(not a['faixa'] and not a['sel'] and a['loc'] is None, f'{l}: sem aviso de tradução')
        ok(en_dic > 1000, f'dicionário EN carregado ({en_dic} chaves)')

        # ------------------------------------------------ marca "revisado"
        await pg.select_option('#sel-lang', 'zh'); await pg.wait_for_timeout(100)
        r = await pg.evaluate("""(() => { const o = [];
          IDIOMAS_REVISADOS.zh = true; atualizarAvisoTrad(); o.push(document.getElementById('faixa-trad').hidden, avisoTraducao());
          IDIOMAS_REVISADOS.zh = false; I18N.zh.__revisado = true; atualizarAvisoTrad(); o.push(document.getElementById('faixa-trad').hidden, avisoTraducao());
          delete I18N.zh.__revisado; atualizarAvisoTrad(); o.push(document.getElementById('faixa-trad').hidden);
          return o; })()""")
        ok(r == [True, None, True, None, False], f'aviso some com IDIOMAS_REVISADOS e com "__revisado" no dicionário {r}')

        # ------------------------------------------------ números, magnitudes e unidades
        for l in NOVOS:
            await pg.select_option('#sel-lang', l); await pg.wait_for_timeout(100)
            n = await pg.evaluate("""(() => { const s = sepNum(), v = [1234567.5, -2500.25, 0.5, 160000];
              const ida = v.map(x => [fmtEntrada(x, 2), lerNumero(fmtEntrada(x, 2))]);
              const el = document.createElement('input'); el.dataset.num = 'dec'; el.dataset.casas = '2'; document.body.appendChild(el);
              el.value = '1234567' + s.decimal + '75'; formatarCampoNum(el); const dig = [el.value, lerNumero(el.value)]; el.remove();
              const M = magnitudes(), g = grande(2650000 / moedaInfo().f);
              return { loc: LOC(), s, ida, dig, M, g, pt: unidadesParaPT(g), um: unidMil(), umPT: unidadesParaPT('(' + unidMil() + ')'),
                intl: Intl.NumberFormat.supportedLocalesOf([LOC()]).length }; })()""")
            ok(n['intl'] == 1, f'{l}: locale {n["loc"]} suportado pelo Intl; separadores {n["s"]}')
            ok(all(abs(x[1] - v) < 1e-9 for x, v in zip(n['ida'], [1234567.5, -2500.25, 0.5, 160000])), f'{l}: fmtEntrada → lerNumero {[x[0] for x in n["ida"]]}')
            ok(n['dig'][1] == 1234567.75, f'{l}: digitação formatada {n["dig"][0]!r} → {n["dig"][1]}')
            ok(len(n['M']) == 3 and n['M'][1] in n['g'], f'{l}: MAGNITUDES {n["M"]}; grande() {n["g"]!r}')
            ok(n['pt'].endswith(' mi'), f'{l}: unidadesParaPT({n["g"]!r}) = {n["pt"]!r}')
            ok(n['umPT'] == '(USD mil)', f'{l}: UNID_MIL {n["um"]!r} → {n["umPT"]!r}')

        # ------------------------------------------------ fontes da página
        for l, fam in [('ar', 'Noto Sans Arabic'), ('zh', 'Noto Sans SC'), ('bm', 'Noto Sans')]:
            await pg.select_option('#sel-lang', l); await pg.wait_for_timeout(100)
            f = await pg.evaluate(f"""(() => {{ const k = document.getElementById('fonte-{l}'); return [k ? k.href : '', getComputedStyle(document.documentElement).getPropertyValue('--f-ui'), getComputedStyle(document.body).fontSize, document.querySelectorAll('link[href^="http"]').length]; }})()""")
            # v15: sem Google Fonts (a página funciona sem rede; brief da v15, regra 5): nenhuma folha externa, a família vem do sistema
            ok(not f[0] and f[3] == 0, f'{l}: nenhuma folha de fontes externa ({f[0][:60]}, {f[3]} links)')
            ok(fam in f[1] and f[2] == '16px', f'{l}: --f-ui com {fam}; corpo {f[2]}')
        await pg.select_option('#sel-lang', 'pt'); await pg.wait_for_timeout(100)
        f = await pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--f-ui')")
        ok('Arabic' not in f and 'SC' not in f, 'PT: pilha de fontes original')

        # ------------------------------------------------ gráfico SVG do plano (PT x AR); v15: a mandala saiu (auditoria A6),
        # a mesma verificação (SVG não se espelha em RTL) vale para o primeiro gráfico do documento
        await pg.evaluate(VISTAS['2c']); await pg.wait_for_timeout(200)
        m_pt = await pg.evaluate(MANDALA)
        await pg.select_option('#sel-lang', 'ar'); await pg.wait_for_timeout(150)
        await pg.evaluate(VISTAS['2c']); await pg.wait_for_timeout(200)
        m_ar = await pg.evaluate(MANDALA)
        ok(m_pt and m_ar and not m_ar['tf'] and (m_ar['dir'] == 'ltr' or not m_ar['txt']), f'ar: gráfico do plano sem transformação CSS ({m_ar and m_ar["dir"]})')
        # mesmas posições horizontais (o SVG não se espelha); na vertical, só o deslocamento uniforme da métrica da fonte
        par = list(zip(m_pt['txt'], m_ar['txt'])) if m_pt and m_ar else []
        dy = [c[2] - a[2] for a, c in par]
        # v15: os gráficos do plano são HTML (não SVG) e se espelham pelo próprio fluxo RTL; a comparação de posições só vale para SVG
        if par:
            ok(len(par) > 5 and all(a[0] == c[0] and abs(a[1] - c[1]) <= 2 for a, c in par) and max(dy) - min(dy) <= 2,
               f'ar: gráfico com os {len(par)} textos nas mesmas posições do português (Δy uniforme {sorted(set(dy))})')
        await pg.screenshot(path=f'{TMP}/ar_2c_mandala.png', clip={'x': 0, 'y': 0, 'width': 1360, 'height': 900})

        # ------------------------------------------------ números LTR em árabe
        nd = await pg.evaluate("""(() => { const q = s => [...document.querySelectorAll(s)];
          const els = q('.num, td.n, .kpi .v, input[data-num]');
          return { n: els.length, ruins: els.filter(e => { const c = getComputedStyle(e); return c.direction !== 'ltr' || !/isolate|plaintext/.test(c.unicodeBidi); }).map(e => e.className).slice(0, 5) }; })()""")
        ok(nd['n'] > 0 and not nd['ruins'], f'ar: {nd["n"]} números e campos com direction ltr isolada {nd["ruins"]}')
        await pg.evaluate(VISTAS['plano']); await pg.wait_for_timeout(300)
        ov = await pg.evaluate(ORDEM_VALOR)
        ok(len(ov) > 3 and all(x[1] for x in ov), f'ar: "US$" à esquerda do número em {len(ov)} valores do plano ({[x[0] for x in ov if not x[1]][:3]})')
        pe = await pg.evaluate("(() => { const a = document.querySelector('#plano .rp-corpo > .rp-aviso-trad'); return a ? [a.textContent, a === document.querySelector('#plano .rp-corpo').lastElementChild] : null; })()")
        ok(pe and AVISO_EN in pe[0] and RE_AR.search(pe[0]) and pe[1], 'ar: (c) aviso no pé do plano, no idioma e em inglês')

        # ------------------------------------------------ rolagem horizontal em árabe (400 e 1360 px) e capturas
        for w in [400, 1360]:
            await pg.set_viewport_size({'width': w, 'height': 900})
            for v, js in VISTAS.items():
                await pg.evaluate(js); await pg.wait_for_timeout(250)
                await pg.evaluate("(() => { const a = document.getElementById('aviso-lang'); if (a) a.hidden = true; })()")
                sw = await pg.evaluate("[document.documentElement.scrollWidth, document.documentElement.clientWidth, document.body.scrollWidth]")
                ok(sw[0] <= sw[1] and sw[2] <= sw[1], f'ar {w}px {v}: sem rolagem horizontal ({sw[0]} / {sw[1]})')
                await pg.screenshot(path=f'{TMP}/ar_{v}_{w}.png', full_page=v != 'plano')
        await pg.set_viewport_size({'width': 1360, 'height': 900})
        for l in ['zh', 'bm', 'zu', 'sw']:
            await pg.select_option('#sel-lang', l); await pg.wait_for_timeout(150)
            await pg.evaluate(VISTAS['inicio']); await pg.wait_for_timeout(200)
            await pg.screenshot(path=f'{TMP}/{l}_inicio_1360.png')
        for l in ['pt', 'en']:
            await pg.select_option('#sel-lang', l); await pg.wait_for_timeout(100)
            await pg.evaluate(VISTAS['plano']); await pg.wait_for_timeout(250)
            ok(await pg.evaluate("!document.querySelector('.rp-aviso-trad, .aviso-trad')"), f'{l}: nenhum aviso de tradução no plano nem na página')

        # ------------------------------------------------ PDF
        for l, fonte, rx, nome in [('ar', 'NotoAr', RE_AR, 'letras árabes'), ('zh', 'NotoSC', RE_ZH, 'ideogramas'), ('bm', 'NotoLatin', re.compile('[ɛɔƐƆ]'), 'ɛ/ɔ'), ('pt', None, None, ''), ('sw', None, None, '')]:
            await pg.select_option('#sel-lang', l); await pg.wait_for_timeout(150)
            await pg.evaluate(VISTAS['plano']); await pg.wait_for_timeout(200)
            n0 = len(errs)
            try:
                arq = await gerar_pdf(pg, 'plano_' + l)
            except Exception as e:
                ok(False, f'{l}: PDF gerado ({e})'); continue
            ok(len(errs) == n0, f'{l}: PDF gerado sem erro {errs[n0:][:2]}')
            P = pdf_paginas(arq)
            fontes = subprocess.run(['pdffonts', arq], capture_output=True, text=True).stdout
            subprocess.run(['pdftoppm', '-r', '70', '-png', '-f', '1', '-l', '3', arq, f'{TMP}/pdf_{l}'])
            if fonte:
                ok(fonte in fontes and 'Identity-H' in fontes, f'{l}: fonte {fonte} embutida no PDF')
                todo = ''.join(P)
                ok(len(rx.findall(todo)) > 20, f'{l}: texto extraído com {nome} ({len(rx.findall(todo))})')
                ok(AVISO_EN in norm(P[0]) and (l == 'zh' or True), f'{l}: (d) aviso na capa do PDF')
                rod = [i + 1 for i, t in enumerate(P[1:], 1) if AVISO_EN not in norm(t)]
                ok(not rod, f'{l}: (d) aviso no rodapé das {len(P) - 1} páginas internas {rod[:5]}')
                loc = await pg.evaluate('avisoTraducao().local')
                if l == 'bm': ok(norm(loc) in norm(P[0]), 'bm: aviso em bambara na capa do PDF')
                if l == 'zh': ok(loc in P[0].replace('\n', '').replace(' ', ''), 'zh: aviso em chinês na capa do PDF')
                ok('?' not in re.sub(r'(?<=[A-Za-z])\?(?=\s|$)', '', re.sub(r'https?://\S+', '', P[0])).replace('؟', ''), f'{l}: capa sem "?" de caracteres trocados (as perguntas do sumário, em inglês, terminam em "?")')
            elif l == 'pt':
                ok('Helvetica' in fontes and 'Noto' not in fontes, 'pt: PDF só com Helvetica')
                ok(AVISO_EN not in norm(''.join(P)), 'pt: PDF sem aviso de tradução')
            else:
                ok('Noto' not in fontes and AVISO_EN in norm(P[0]) and AVISO_EN in norm(P[1]), 'sw: PDF em Helvetica (WinAnsi) com o aviso na capa e no rodapé')
        ok(not errs, f'sem erros de página {errs[:3]}')
        await b.close()
    print(f'\n{len(falhas)} falha(s)' if falhas else '\nTUDO OK')
    print('capturas e PDFs em', TMP)
    sys.exit(1 if falhas else 0)

asyncio.run(main())
