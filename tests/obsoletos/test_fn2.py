import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1360,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type=='error' and 'TUNNEL' not in m.text else None)
        await pg.goto('file:///tmp/claude-0/nav_test.html'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
        for k in ['A','B','C','D']:
            await pg.select_option('#sel-exemplo', k); await pg.wait_for_timeout(150)
            res = await pg.evaluate("(() => { const p = perfilFinal(S.caso); const av=avaliar(calcular(cfgAtual())); return [S.caso.titulo, p.agregado, Math.round(av.ctEco), cfgAtual().itens.map(x=>x.s).join(',')] })()")
            print(k, res)
        await pg.click('nav.tabs [data-tab="custos"]')
        for k in ['A','B','C']:
            await pg.click(f'[data-cbase="{k}"]'); await pg.wait_for_timeout(150)
            v = await pg.inner_text('.kpis .kpi:first-child .v')
            await pg.check('[data-ccompat]'); await pg.wait_for_timeout(150)
            vc = await pg.inner_text('.kpis .kpi:first-child .v')
            tc = await pg.evaluate("Math.round(resumo(calcular(cfgAtual())).tco)")
            await pg.uncheck('[data-ccompat]'); await pg.wait_for_timeout(150)
            print('preset',k,'v2',v,'compat',vc,'v1 tco',tc)
        await pg.click('[data-cbase="A"]')
        # tree toggle
        await pg.click('[data-tog="K2"]'); await pg.wait_for_timeout(80); await pg.click('[data-tog="K2.1"]'); await pg.wait_for_timeout(80)
        print('rows open', await pg.evaluate("document.querySelectorAll('table.arv tr.ir').length"))
        await pg.click('[data-cconta="fin"]'); await pg.wait_for_timeout(80)
        print('fin total', await pg.inner_text('table.arv tr.tot td:nth-last-child(3)'))
        # currencies
        for cod in ['BRL','EUR','JPY','INR','NGN']:
            await pg.select_option('#moeda',cod); await pg.wait_for_timeout(100)
            print(cod, await pg.inner_text('.kpis .kpi:first-child .v'))
        await pg.fill('#taxa','5'); await pg.dispatch_event('#taxa','change'); await pg.wait_for_timeout(100)
        print('NGN override 5', await pg.inner_text('.kpis .kpi:first-child .v'))
        await pg.select_option('#moeda','USD'); await pg.wait_for_timeout(100)
        print('moeda after USD', await pg.evaluate("JSON.stringify(S.moeda)"))
        # horizon
        await pg.click('details[data-det="prem"] > summary')
        await pg.fill('[data-cfg="opc.H"]','5'); await pg.dispatch_event('[data-cfg="opc.H"]','change'); await pg.wait_for_timeout(150)
        print('H5 cols', await pg.evaluate("document.querySelectorAll('table.arv thead th').length"), await pg.inner_text('.kpis .kpi:first-child .v'))
        # advanced
        await pg.check('[data-cavanc]'); await pg.wait_for_timeout(150)
        await pg.click('[data-act="simular"]'); await pg.wait_for_timeout(2500)
        print('MC', await pg.evaluate("SIM && [SIM.res.ct.p10, SIM.res.ct.p50, SIM.res.ct.p90].map(Math.round)"))
        await pg.click('[data-act="add-alt"]'); await pg.wait_for_timeout(100)
        await pg.fill('[data-alt="0"][data-campo="anual"]','300000'); await pg.dispatch_event('[data-alt="0"][data-campo="anual"]','change'); await pg.wait_for_timeout(100)
        await pg.screenshot(path='/tmp/claude-0/ui_adv.png', full_page=True)
        await pg.click('nav.tabs [data-tab="relatorio"]'); await pg.wait_for_timeout(100)
        md = await pg.evaluate("relMD(dadosRelatorio())"); i = md.find('## Custo'); print(md[i:i+900])
        csv = await pg.evaluate("csvCustos()"); print(csv[:300])
        await pg.reload(); await pg.wait_for_timeout(300)
        print('persist', await pg.evaluate("[S.tab, S.custo.avancado, opcoes(cfgAtual()).H]"))
        print('errors', errs)
        await b.close()
asyncio.run(main())
