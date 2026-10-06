import asyncio, sys
from playwright.async_api import async_playwright
SK = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0}</style></head><body>' + open('navegador.html').read() + '</body></html>'
open('/tmp/claude-0/nav_test.html','w').write(SK)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        errs=[]
        for w,h,tag,scheme in [(1360,900,'d','light'),(400,860,'m','light'),(1360,900,'dk','dark')]:
            pg = await b.new_page(viewport={'width':w,'height':h}, color_scheme=scheme)
            pg.on('console', lambda m: errs.append((tag,m.type,m.text)) if m.type in ('error','warning') else None)
            pg.on('pageerror', lambda e: errs.append((tag,'pageerror',str(e))))
            await pg.goto('file:///tmp/claude-0/nav_test.html')
            await pg.wait_for_timeout(500)
            for t in ['caso','diagnostico','percurso','listas','custos','relatorio']:
                await pg.click(f'nav.tabs [data-tab="{t}"]')
                await pg.wait_for_timeout(200)
                if t=='custos':
                    await pg.click('details[data-det="prem"] > summary')
                await pg.screenshot(path=f'/tmp/claude-0/ui_{tag}_{t}.png', full_page=True)
                sw = await pg.evaluate('document.documentElement.scrollWidth')
                if sw > w+1: errs.append((tag,'overflow',t,sw))
            await pg.close()
        print(errs or 'no errors')
        await b.close()
asyncio.run(main())
