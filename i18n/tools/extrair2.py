# Coleta os textos em português da interface em fases (DOM em vários estados + dados + relatório).
import asyncio, json, re, sys
from playwright.async_api import async_playwright
SK = '<!doctype html><html><head><meta charset=utf8></head><body>' + open('/home/claude/app/navegador.html').read() + '</body></html>'
open('/tmp/claude-0/nav_ext.html','w').write(SK)
COLETA = """(() => { const out = new Set(); const add = s => { if (!s) return; const n = normalizar(String(s)).chave; if (/\\p{L}{2}/u.test(n)) out.add(n); };
 const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
 let n; while ((n = w.nextNode())) { if (n.nodeType === 3) { const p = n.parentElement; if (p && p.closest('script,style,textarea,[data-notr]')) continue; add(n.data); }
   else ['placeholder','aria-label','title','alt'].forEach(a => { if (n.hasAttribute(a)) add(n.getAttribute(a)); }); }
 return [...out]; })()"""
DADOS = """(() => { const out = new Set(); const id = s => /^[a-z0-9_\\-.]+$/.test(s);
 const walk = x => { if (typeof x === 'string') { if (!id(x) && /\\p{L}{2}/u.test(x)) out.add(normalizar(x).chave); } else if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object' && typeof x !== 'function') Object.values(x).forEach(v => typeof v === 'function' ? 0 : walk(v)); };
 [FASES, CAMADAS, NIVEIS_ADM, ETAPAS_ENS, DOMINIOS, RESP, QUESTOES, PASSOS, CTX_EX, TXT_VINCULO, TXT_ISENCAO].forEach(walk);
 walk(dadosRelatorio()); return [...out]; })()"""
async def main():
    tudo = set()
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1360,'height':900})
        await pg.goto('file:///tmp/claude-0/nav_ext.html'); await pg.evaluate("localStorage.clear()"); await pg.reload(); await pg.wait_for_timeout(300)
        await pg.select_option('#sel-lang','pt'); await pg.wait_for_timeout(100)
        async def col(): tudo.update(await pg.evaluate(COLETA))
        for ex in ['B','A','C','D','novo']:
            await pg.evaluate(f"carregarExemplo('{ex}')"); await pg.wait_for_timeout(120)
            tudo.update(await pg.evaluate(DADOS))
            for fase in ['contexto','piloto','implantacao','escala']:
                for pid in await pg.evaluate(f"PASSOS['{fase}'].map(p=>p[0])"):
                    await pg.evaluate(f"(()=>{{S.fase='{fase}';S.passo='{pid}';render();}})()"); await pg.wait_for_timeout(80)
                    await pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)"); await pg.wait_for_timeout(60)
                    if pid == '1a' and ex == 'B':
                        await pg.evaluate("(()=>{for (const e of ETAPAS_ENS){S.ctx.etapas[e[0]]={on:true,escolas:1,alunos:1,porAno:true};} S.ctx.nivel='outro'; render();})()"); await pg.wait_for_timeout(80)
                        await col(); await pg.evaluate("carregarExemplo('B')")
                        await pg.evaluate(f"(()=>{{S.fase='{fase}';S.passo='{pid}';render();}})()")
                    if pid == '1b':
                        await pg.evaluate("(()=>{S.ctx.comps=['outro'];render();})()"); await col()
                    if pid == '3b':
                        for sb in await pg.eval_on_selector_all('[data-sub]', 'els => els.map(e => e.dataset.sub)'):
                            await pg.click(f'[data-sub="{sb}"]'); await pg.wait_for_timeout(60); await col()
                    await col()
            await pg.evaluate("(()=>{S.fase='';render();})()"); await pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)"); await pg.wait_for_timeout(200); await col()
        await b.close()
    fin = sorted(x for x in tudo if x.strip() and re.search(r'[A-Za-zÀ-ÿ]{2}', x) and not re.match(r'^[A-Z]{3} · ', x))
    fin = sorted({re.sub(r'^\[[ x]\] ', '', x) for x in fin})
    json.dump(fin, open('/home/claude/app/i18n/pt_fontes2.json','w'), ensure_ascii=False, indent=0)
    en = json.load(open('/home/claude/app/i18n/en.json')); ex = json.load(open('/home/claude/app/i18n/extra_en.json'))
    novos = [x for x in fin if x not in en and x not in ex]
    json.dump(novos, open('/home/claude/app/i18n/pt_novos.json','w'), ensure_ascii=False, indent=0)
    print(len(fin), 'novos', len(novos))
asyncio.run(main())
