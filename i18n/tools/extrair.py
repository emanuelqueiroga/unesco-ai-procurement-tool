# Coleta os textos em português exibidos pelo navegador (DOM em vários estados + dados + literais do código).
import asyncio, json, re, glob
from playwright.async_api import async_playwright
SK = '<!doctype html><html><head><meta charset=utf8></head><body>' + open('/home/claude/app/navegador.html').read() + '</body></html>'
open('/tmp/claude-0/nav_ext.html','w').write(SK)
COLETA = """(() => { const out = new Set(); const add = s => { if (!s) return; const n = normalizar(String(s)).chave; if (/\\p{L}{2}/u.test(n)) out.add(n); };
 const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
 let n; while ((n = w.nextNode())) { if (n.nodeType === 3) { const p = n.parentElement; if (p && p.closest('script,style,textarea,[data-notr]')) continue; add(n.data); }
   else ['placeholder','aria-label','title','alt'].forEach(a => { if (n.hasAttribute(a)) add(n.getAttribute(a)); }); }
 return [...out]; })()"""
DADOS = """(() => { const out = new Set(); const id = s => /^[a-z0-9_\\-.]+$/.test(s);
 const walk = x => { if (typeof x === 'string') { if (!id(x) && /\\p{L}{2}/u.test(x)) out.add(normalizar(x).chave); } else if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') Object.values(x).forEach(walk); };
 [NIVEL_NOME, NIVEL_CRIT, OPC, DIMENSOES, DILIGENCIA, PDS, DOSSIE, INSTRUMENTOS, CAPITULOS, ROTAS, ESCADA, SUPERVISAO, CONTESTACAO, FORMAS_SUP, DADOS_REQ, CONTRATO, MUDANCA, METRICAS, SEVERIDADE, PACOTE, LOCKIN, CASOS, ARVORE, NOME_K, SAL_NOME, TABS, TXT_VINCULO, TXT_ISENCAO].forEach(walk);
 for (const k of Object.keys(CASOS)) { const c = CASOS[k], p = perfilFinal(c); walk(alertas(c, p).map(a => a.texto)); for (let i = 1; i <= 9; i++) { try { walk(extrasPD(i, c, p)); } catch (e) {} } walk(p.J); }
 walk(dadosRelatorio()); return [...out]; })()"""
async def main():
    tudo = set()
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1360,'height':900})
        await pg.goto('file:///tmp/claude-0/nav_ext.html'); await pg.evaluate("localStorage.clear()"); await pg.reload(); await pg.wait_for_timeout(300)
        await pg.select_option('#sel-lang','pt'); await pg.wait_for_timeout(100)
        async def col(): tudo.update(await pg.evaluate(COLETA))
        for ex in ['A','B','C','D','novo']:
            await pg.select_option('#sel-exemplo', ex); await pg.wait_for_timeout(120)
            tudo.update(await pg.evaluate(DADOS))
            for t in ['caso','diagnostico','percurso','listas','custos','relatorio']:
                await pg.click(f'nav.tabs [data-tab="{t}"]'); await pg.wait_for_timeout(100)
                if t == 'percurso':
                    await pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")
                if t == 'listas':
                    for sb in await pg.eval_on_selector_all('[data-sub]', 'els => els.map(e => e.dataset.sub)'):
                        await pg.click(f'[data-sub="{sb}"]'); await pg.wait_for_timeout(60); await col()
                if t == 'custos' and ex in ('A','novo'):
                    for base in ['caso','A','B','C']:
                        await pg.click(f'[data-cbase="{base}"]'); await pg.wait_for_timeout(100)
                        await pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")
                        await pg.click('[data-act="abrir-tudo"]'); await pg.wait_for_timeout(80); await col()
                        await pg.click('[data-cconta="fin"]'); await pg.wait_for_timeout(80); await col()
                        await pg.click('[data-cconta="eco"]'); await pg.wait_for_timeout(50)
                    await pg.check('[data-cavanc]'); await pg.wait_for_timeout(120)
                    await pg.click('[data-act="simular"]'); await pg.wait_for_timeout(2500)
                    await pg.click('[data-act="add-alt"]'); await pg.wait_for_timeout(100)
                    await pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)"); await col()
                    await pg.check('[data-ccompat]'); await pg.wait_for_timeout(100); await col(); await pg.uncheck('[data-ccompat]')
                    await pg.uncheck('[data-cavanc]'); await pg.wait_for_timeout(80)
                await col()
        tudo.update(await pg.evaluate("[...new Set([TXT_VINCULO, TXT_ISENCAO, 'Relatório do caso', 'Gerado pelo Navegador de decisão de IA na educação em 04/10/2026. Documento de trabalho baseado no guia; valores ilustrativos.'].map(s=>normalizar(s).chave))]"))
        await b.close()
    # literais do código (fragmentos de texto em templates e strings com espaço)
    for f in glob.glob('/home/claude/app/src/*.js'):
        if 'custos_v1' in f or 'i18n' in f: continue
        src = open(f).read()
        for m in re.finditer(r"'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`", src):
            txt = m.group(1) if m.group(1) is not None else m.group(2)
            txt = re.sub(r'\$\{(?:[^{}]|\{[^{}]*\})*\}', '\u0000', txt)
            for frag in re.split(r'<[^>]*>|\u0000', txt):
                frag = frag.strip()
                if len(frag) > 2 and re.search(r'[a-záéíóúãõâêôç]{3,}', frag) and ' ' in frag and not re.search(r'[{};=]|=>|\(\)', frag):
                    tudo.add(frag)
    def norm(s):
        nums=[]; s2=re.sub(r'(?<![^\W\d_])(?<![\d.,])[-−+]?\d+(?:[.,  ]\d+)*', lambda m: (nums.append(1), '{%d}'%(len(nums)-1))[1], s)
        return re.sub(r'\s+',' ',s2).strip()
    final = sorted({norm(x) if not re.search(r'\{\d+\}', x) else x for x in tudo if x.strip()})
    final = [x for x in final if re.search(r'[A-Za-zÀ-ÿ]{2}', x) and not re.fullmatch(r'[A-Z]{1,3}[\d.{}]*', x)]
    json.dump(final, open('/home/claude/app/i18n/pt_fontes.json','w'), ensure_ascii=False, indent=0)
    print(len(final))
asyncio.run(main())
