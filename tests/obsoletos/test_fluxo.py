# Percorre as quatro fases e todos os passos; tira capturas e verifica erros e rolagem horizontal.
import asyncio, sys
from playwright.async_api import async_playwright
LANG = sys.argv[1] if len(sys.argv) > 1 else 'pt'
SK = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>' + open('navegador.html').read() + '</body></html>'
open('/tmp/claude-0/nav_fluxo.html','w').write(SK)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); errs = []
        for w, h, tag in [(1400, 900, 'd'), (400, 860, 'm')]:
            pg = await b.new_page(viewport={'width': w, 'height': h})
            pg.on('pageerror', lambda e: errs.append((tag, str(e))))
            pg.on('console', lambda m: errs.append((tag, m.text)) if m.type == 'error' and 'TUNNEL' not in m.text else None)
            await pg.goto('file:///tmp/claude-0/nav_fluxo.html'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
            await pg.select_option('#sel-lang', LANG); await pg.wait_for_timeout(150)
            await pg.screenshot(path=f'/tmp/claude-0/fx_{tag}_0.png')
            # caso em branco
            await pg.click('[data-act="comecar"]'); await pg.wait_for_timeout(200)
            print(tag, 'branco:', await pg.evaluate('[S.fase,S.passo,S.exemplo,FASES.map(f=>veredito(f.id).st).join(",")]'))
            print(tag, 'faltas 1a:', await pg.evaluate('faltas("1a")'), 'aviso:', await pg.locator('.aviso').count())
            await pg.screenshot(path=f'/tmp/claude-0/fx_{tag}_branco.png')
            await pg.click('[data-act="continuar-forcar"]'); await pg.wait_for_timeout(200)
            print(tag, 'forçar:', await pg.evaluate('[S.fase,S.passo]'))
            await pg.evaluate("abrirFase('piloto','2c')"); await pg.wait_for_timeout(200)
            print(tag, 'risco vazio:', await pg.locator('#passo-2c .vazio').count())
            await pg.evaluate("abrirFase('piloto','2b')"); await pg.wait_for_timeout(200)
            await pg.locator('[data-fm="dados"][value="pessoais_est"]').check(); await pg.wait_for_timeout(150)
            await pg.locator('[data-fm="dados"][value="nenhum"]').check(); await pg.wait_for_timeout(150)
            print(tag, 'dados exclusivo:', await pg.evaluate('S.caso.dados'))
            # exemplo
            await pg.evaluate('carregarExemplo("B")'); await pg.wait_for_timeout(200)
            k = 0
            for fase in ['contexto', 'piloto', 'implantacao', 'escala']:
                ps = await pg.evaluate(f"PASSOS['{fase}'].map(p=>p[0])")
                for pid in ps:
                    await pg.evaluate(f"(()=>{{S.boasVindas=false;S.fase='{fase}';S.passo='{pid}';render();}})()"); await pg.wait_for_timeout(150)
                    await pg.evaluate(f"irPara('passo-{pid}')"); await pg.wait_for_timeout(250)
                    sw = await pg.evaluate('document.documentElement.scrollWidth')
                    if sw > w + 1: errs.append((tag, 'overflow', pid, sw))
                    if tag == 'd' or pid in ('1a', '1b', '2b', '2c', '3a'):
                        k += 1; await pg.screenshot(path=f'/tmp/claude-0/fx_{tag}_{pid}.png')
                await pg.evaluate(f"(()=>{{S.passo='';render();irPara('res-{fase}');}})()"); await pg.wait_for_timeout(250)
                await pg.screenshot(path=f'/tmp/claude-0/fx_{tag}_res_{fase}.png')
            print(tag, 'vereditos B:', await pg.evaluate('FASES.map(f=>{const v=veredito(f.id);return f.id+":"+v.st+" b"+v.bloq.length+" c"+v.cond.length+" f"+v.falt}).join(" | ")'))
            await pg.evaluate("(()=>{S.fase='';render();irPara('fase-final');})()"); await pg.wait_for_timeout(250)
            await pg.screenshot(path=f'/tmp/claude-0/fx_{tag}_final.png', full_page=False)
            sw = await pg.evaluate('document.documentElement.scrollWidth')
            if sw > w + 1: errs.append((tag, 'overflow final', sw))
            # ir à pergunta pelo plano de ação
            await pg.evaluate('abrirResumo()'); await pg.wait_for_timeout(200); await pg.locator('#resumo [data-ir]').first.click(); await pg.wait_for_timeout(300)
            print(tag, 'ir:', await pg.evaluate('[S.fase,S.passo]'))
            # continuar e exportar
            await pg.evaluate("(()=>{S.fase='contexto';S.passo='1a';render();})()")
            await pg.click('[data-act="continuar"]'); await pg.wait_for_timeout(200)
            print(tag, 'após continuar:', await pg.evaluate('[S.fase,S.passo]'))
            await pg.click('[data-fase="implantacao"].step-f'); await pg.wait_for_timeout(200)
            await pg.evaluate("(()=>{S.passo='3a';render();})()"); await pg.wait_for_timeout(100)
            await pg.click('[data-resp="i-evidencia"][data-v="sim"]'); await pg.wait_for_timeout(100)
            print(tag, 'resp:', await pg.evaluate('S.resp["i-evidencia"]'))
            # calculadora completa
            await pg.evaluate("(()=>{S.passo='3c';render();})()"); await pg.wait_for_timeout(100)
            await pg.locator('details.calc > summary').click(); await pg.wait_for_timeout(300)
            print(tag, 'calc:', await pg.locator('#cres').count())
            if tag == 'd': await pg.screenshot(path=f'/tmp/claude-0/fx_{tag}_calc.png')
            js = await pg.evaluate('JSON.stringify(dadosCaso())')
            await pg.evaluate('carregarExemplo("novo")'); await pg.wait_for_timeout(150)
            await pg.evaluate(f'importarCaso({js!r})'); await pg.wait_for_timeout(150)
            print(tag, 'import:', await pg.evaluate('[S.resp["i-evidencia"], totaisCtx().alunos]'))
            md = await pg.evaluate('relMD(dadosRelatorio())'); print(tag, 'md', len(md))
            if tag == 'd': open('/tmp/claude-0/rel_'+LANG+'.md','w').write(md)
            await pg.close()
        print('erros', errs)
        await b.close()
asyncio.run(main())
