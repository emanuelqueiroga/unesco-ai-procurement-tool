# Versão no build de revisão (0.0.15-rc.1; mesma lógica da 0.0.14 da versão estável).
# Uso: CANAL=revisao bash build.sh && python3 tests/test_versao.py   (NAV=<arquivo> testa outro build)
# Verifica: VERSAO_APP = arquivo VERSION, CANAL_APP = 'revisao', chaves de armazenamento com o sufixo '@' + versão,
# versão visível no rodapé e no PDF; "Início" e "Matriz camadas × fases" no cabeçalho (como na 0.0.14); 1366 e 390 px.
import asyncio, os, subprocess
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = '/tmp/claude-0/versao_v14'
os.makedirs(TMP, exist_ok=True)
NAV = os.environ.get('NAV', os.path.join(RAIZ, 'navegador.html'))
open(f'{TMP}/nav.html', 'w').write('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>' + open(NAV).read() + '</body></html>')
VERSAO = open(os.path.join(RAIZ, 'VERSION')).read().strip()
falhas = []

def ok(c, m):
    print(('ok   ' if c else 'FALHA ') + m)
    if not c: falhas.append(m)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, h in [(1366, 900), (390, 844)]:
            ctx = await b.new_context(viewport={'width': w, 'height': h}, accept_downloads=True)
            pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(f'file://{TMP}/nav.html'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(400)
            tag = f'{w}px'
            ok(await pg.evaluate('VERSAO_APP') == VERSAO, f'{tag}: VERSAO_APP = VERSION ({VERSAO})')
            ok(await pg.evaluate('CANAL_APP') == 'revisao', f'{tag}: CANAL_APP = revisao')
            ok(await pg.evaluate('CHAVE') == 'aiedu-procurement-v9@' + VERSAO, f'{tag}: CHAVE termina com @{VERSAO}')
            ok(await pg.evaluate('AJUDA_CHAVE') == 'upt_ajuda_v14@' + VERSAO, f'{tag}: AJUDA_CHAVE termina com @{VERSAO}')
            rod = await pg.inner_text('#txt-versao')
            ok(f'Version {VERSAO}' in rod and await pg.locator('footer #txt-versao').is_visible(), f'{tag}: rodapé com a versão ({rod})')
            await pg.select_option('#sel-lang', 'pt'); await pg.wait_for_timeout(150)
            ok(f'Versão {VERSAO}' in await pg.inner_text('#txt-versao'), f'{tag}: rodapé refeito ao trocar o idioma')
            await pg.select_option('#sel-lang', 'en'); await pg.wait_for_timeout(150)
            # Início e matriz no cabeçalho (como na 0.0.14): caso em branco salvo abre no percurso
            await pg.evaluate("(()=>{carregarExemplo('novo'); S.boasVindas=false; abrirFase('contexto','1a'); salvar();})()")
            await pg.reload(); await pg.wait_for_timeout(500)
            ok(await pg.locator('#stepper').count() > 0, f'{tag}: caso em branco salvo abre no percurso')
            await pg.locator('.nav-top [data-act="ver-matriz"]').click(); await pg.wait_for_timeout(300)
            ok(await pg.locator('#visor-matriz[open] table.mt-tab').count() == 1, f'{tag}: botão do cabeçalho abre a matriz no percurso')
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
            ok(await pg.locator('#visor-matriz[open]').count() == 0, f'{tag}: Esc fecha a matriz')
            await pg.evaluate("(()=>{S.ctx.local='Rede teste 0.0.15'; salvar(); render();})()")
            ok(await pg.evaluate("localStorage.getItem(CHAVE) !== null && localStorage.getItem('aiedu-procurement-v9') === null"), f'{tag}: o caso fica na chave da revisão, não na da versão estável')
            await pg.locator('.nav-top [data-act="inicio"]').click(); await pg.wait_for_timeout(400)
            ok(await pg.locator('#stepper').count() == 0 and await pg.get_by_role('button', name='See the full matrix').count() == 1, f'{tag}: "Home" leva à página inicial, com o botão da matriz')
            ok(await pg.evaluate("S.ctx.local") == 'Rede teste 0.0.15' and await pg.evaluate("SALVO !== null"), f'{tag}: o caso continua salvo e a página oferece continuá-lo')
            await pg.get_by_role('button', name='Continue the saved case').click(); await pg.wait_for_timeout(400)
            ok(await pg.locator('#stepper').count() == 1 and await pg.evaluate("S.ctx.local") == 'Rede teste 0.0.15', f'{tag}: "Continuar o caso salvo" volta ao percurso com as respostas')
            sw = await pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
            ok(sw <= 1, f'{tag}: sem rolagem horizontal ({sw})')
            await pg.screenshot(path=f'{TMP}/cabecalho_{w}.png')
            ok(not errs, f'{tag}: sem erros na página {errs[:2]}')
            if w == 1366:
                await pg.evaluate("(()=>{carregarExemplo('A'); S.boasVindas=false; render(); abrirPlano();})()"); await pg.wait_for_timeout(400)
                async with pg.expect_download() as dl:
                    await pg.locator('[data-act="pdf"]:visible').first.click()
                d = await dl.value; arq = f'{TMP}/plano.pdf'; await d.save_as(arq)
                txt = subprocess.run(['pdftotext', '-f', '2', '-l', '2', arq, '-'], capture_output=True, text=True).stdout
                ok(f'v{VERSAO}' in txt, 'PDF: versão no rodapé das páginas internas')
            await ctx.close()
        await b.close()
    print(f'\n{len(falhas)} FALHA(S)' if falhas else '\nTUDO OK')
    if falhas: raise SystemExit(1)

asyncio.run(main())
