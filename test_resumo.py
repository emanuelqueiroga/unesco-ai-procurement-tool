# Pular as fases 3 e 4, abrir o resumo, gerar o PDF e conferir o conteúdo.
import asyncio, sys
from playwright.async_api import async_playwright
LANG = sys.argv[1] if len(sys.argv) > 1 else 'pt'
SK = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>' + open('navegador.html').read() + '</body></html>'
open('/tmp/claude-0/nav_res.html','w').write(SK)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); errs = []
        for w, h, tag in [(1400, 900, 'd'), (400, 860, 'm')]:
            ctx = await b.new_context(viewport={'width': w, 'height': h}, accept_downloads=True); pg = await ctx.new_page()
            pg.on('pageerror', lambda e: errs.append((tag, str(e))))
            pg.on('console', lambda m: errs.append((tag, m.text)) if m.type in ('error', 'warning') and 'TUNNEL' not in m.text else None)
            await pg.goto('file:///tmp/claude-0/nav_res.html'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
            await pg.select_option('#sel-lang', LANG); await pg.wait_for_timeout(150)
            await pg.click('[data-act="ver-exemplo"]'); await pg.wait_for_timeout(200)
            await pg.evaluate("(()=>{S.fase='piloto';S.passo='';render();irPara('res-piloto');})()"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'/tmp/claude-0/rs_{tag}_res2.png')
            await pg.click('#res-piloto [data-act="pular-resto"]'); await pg.wait_for_timeout(300)
            print(tag, 'vista', await pg.evaluate('[S.vista, JSON.stringify(S.pular), FASES.map(f=>veredito(f.id).st).join(",")]'))
            print(tag, 'rec', await pg.evaluate('recomendacao().texto'))
            sw = await pg.evaluate('document.documentElement.scrollWidth')
            if sw > w + 1: errs.append((tag, 'overflow', sw))
            await pg.screenshot(path=f'/tmp/claude-0/rs_{tag}_top.png')
            await pg.screenshot(path=f'/tmp/claude-0/rs_{tag}_full.png', full_page=True)
            if tag == 'd':
                async with pg.expect_download() as dl:
                    await pg.click('.res-topo [data-act="pdf"]')
                d = await dl.value; await d.save_as(f'/tmp/claude-0/resumo_{LANG}.pdf'); print('pdf ok', d.suggested_filename)
            # fase pulada: abrir e avaliar
            await pg.click('[data-act="voltar-fases"]'); await pg.wait_for_timeout(200)
            await pg.click('#fase-implantacao .fase-cab'); await pg.wait_for_timeout(200)
            await pg.screenshot(path=f'/tmp/claude-0/rs_{tag}_pulada.png')
            await pg.click('#fase-implantacao [data-act="avaliar-fase"]'); await pg.wait_for_timeout(200)
            print(tag, 'avaliar', await pg.evaluate('[S.fase,S.passo,JSON.stringify(S.pular)]'))
            await pg.evaluate("abrirResumo()"); await pg.wait_for_timeout(200)
            print(tag, 'rec2', await pg.evaluate('recomendacao().texto'))
            await ctx.close()
        print('erros', errs)
        await b.close()
asyncio.run(main())
