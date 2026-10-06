# Percorre as fases em EN/ES/FR e lista textos que ficaram em português.
import asyncio, json, re
from playwright.async_api import async_playwright
SK = '<!doctype html><html><head><meta charset=utf8></head><body>' + open('navegador.html').read() + '</body></html>'
open('/tmp/claude-0/nav_lang.html','w').write(SK)
PT = re.compile(r'ção|ções|ã|õ|\b(?:não|você|para o|do caso|também|custo|orçament|decisão)\b', re.I)
COL = """(() => { const out = new Set(); const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
 let n; while ((n = w.nextNode())) { const p = n.parentElement; if (!p || p.closest('script,style,textarea,[data-notr],#txt-vinculo')) continue; const t = n.data.trim(); if (t) out.add(t); }
 document.querySelectorAll('[aria-label],[title],[placeholder]').forEach(e => ['aria-label','title','placeholder'].forEach(a => { const v = e.getAttribute(a); if (v) out.add(v); }));
 return [...out]; })()"""
async def main():
    res = {}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for lang in ['en','es','fr']:
            pg = await b.new_page(viewport={'width':1360,'height':900}); errs=[]
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto('file:///tmp/claude-0/nav_lang.html'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
            await pg.select_option('#sel-lang', lang); await pg.wait_for_timeout(200)
            sobra = set()
            async def col():
                for t in await pg.evaluate(COL):
                    if PT.search(t) and 'Cátedra' not in t and 'Desplugada' not in t and 'Tutor de matemática' not in t: sobra.add(t)
            await col()
            for ex in ['novo','B','C']:
                await pg.evaluate(f"carregarExemplo('{ex}')"); await pg.wait_for_timeout(150)
                for fase in ['contexto','piloto','implantacao','escala']:
                    for pid in await pg.evaluate(f"PASSOS['{fase}'].map(p=>p[0])"):
                        await pg.evaluate(f"(()=>{{S.boasVindas=false;S.calcAberta=true;S.fase='{fase}';S.passo='{pid}';render();}})()"); await pg.wait_for_timeout(100)
                        await pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)"); await pg.wait_for_timeout(80)
                        await col()
                await pg.evaluate("(()=>{S.fase='';render();})()"); await pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)"); await pg.wait_for_timeout(200); await col()
                for pul in ['{}', '{"implantacao":true,"escala":true}']:
                    await pg.evaluate(f"(()=>{{S.pular={pul};abrirResumo();}})()"); await pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)"); await pg.wait_for_timeout(150); await col()
                    for t in await pg.evaluate("JSON.stringify(trFundo(secoesResumo())).split('\",\"')"):
                        if PT.search(t) and 'Cátedra' not in t and 'Tutor de matemática' not in t: sobra.add('PDF: ' + t[:200])
                await pg.evaluate("(()=>{S.pular={};S.vista='';render();})()")
            md = await pg.evaluate("relMD(dadosRelatorio())")
            sobra_md = [l for l in md.split('\n') if PT.search(l) and 'Cátedra' not in l and 'Tutor de matemática' not in l][:20]
            res[lang] = {'sobra': sorted(sobra), 'md': sobra_md, 'errs': errs}
            await pg.close()
        await b.close()
    json.dump(res, open('/tmp/claude-0/sobras.json','w'), ensure_ascii=False, indent=1)
    for l,v in res.items(): print(l, 'restos', len(v['sobra']), 'md', len(v['md']), 'erros', v['errs'])
asyncio.run(main())
