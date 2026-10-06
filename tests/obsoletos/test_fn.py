import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1360,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///tmp/claude-0/nav_test.html'); await pg.wait_for_timeout(300)
        for k in ['A','B','C','D']:
            await pg.select_option('#sel-exemplo', k); await pg.wait_for_timeout(150)
            res = await pg.evaluate("(() => { const p = perfilFinal(S.caso); return [S.caso.titulo, p.agregado, alertas(S.caso,p).map(a=>a.nivel[0]).join(''), pdsDaRota().join(','), resumo(calcular(cfgAtual())).tco.toFixed(0)] })()")
            print(k, res)
        # cost presets in UI
        await pg.click('nav.tabs [data-tab="custos"]')
        for k in ['A','B','C']:
            await pg.click(f'[data-cbase="{k}"]'); await pg.wait_for_timeout(150)
            v = await pg.inner_text('.kpis .kpi:first-child .v'); print('preset',k,v)
        # edit a parameter: preco licença A
        await pg.click('[data-cbase="A"]'); await pg.click('[data-act="ir-prem"]')
        await pg.fill('[data-cfg="saas.preco"]','10'); await pg.dispatch_event('[data-cfg="saas.preco"]','change'); await pg.wait_for_timeout(100)
        print('A preco10', await pg.inner_text('.kpis .kpi:first-child .v'))
        # BRL
        await pg.select_option('#moeda','BRL'); await pg.wait_for_timeout(100)
        await pg.fill('#taxa','5'); await pg.dispatch_event('#taxa','change'); await pg.wait_for_timeout(100)
        print('BRL', await pg.inner_text('.kpis .kpi:first-child .v'))
        # add item & remove
        await pg.click('[data-act="ir-linhas"]'); await pg.click('[data-act="add-item"]'); await pg.wait_for_timeout(100)
        n = await pg.evaluate("cfgAtual().itens.length"); print('itens', n)
        # percurso checks
        await pg.click('nav.tabs [data-tab="percurso"]')
        await pg.check('[data-chk="pd5-0"]'); await pg.wait_for_timeout(100)
        print('prog', await pg.inner_text('nav.tabs [data-tab="percurso"] .ct'))
        # diag ajuste
        await pg.click('nav.tabs [data-tab="diagnostico"]')
        await pg.select_option('[data-aj="opacidade"]','critico'); await pg.wait_for_timeout(100)
        print('agreg', await pg.inner_text('.nivel-big'))
        # listas
        await pg.click('nav.tabs [data-tab="listas"]')
        for sb in ['dados','contrato','mudanca','supervisao','contestacao','monitoramento','incidentes','saida']:
            await pg.click(f'[data-sub="{sb}"]'); await pg.wait_for_timeout(60)
        await pg.click('nav.tabs [data-tab="relatorio"]'); await pg.wait_for_timeout(100)
        md = await pg.evaluate("relMD(dadosRelatorio())"); print(md[:600]); print('...len', len(md))
        csv = await pg.evaluate("csvCustos()"); print(csv[:200])
        # reload persistence
        await pg.reload(); await pg.wait_for_timeout(300)
        print('persist', await pg.evaluate("[S.tab, S.checks['pd5-0'], S.caso.titulo]"))
        print('errors', errs)
        await b.close()
asyncio.run(main())
