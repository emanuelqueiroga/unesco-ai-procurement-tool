# Correção 0.0.14 (primeira com Versionamento Semântico).
# Uso: python3 tests/test_v0014.py   (depois de bash build.sh; NAV=<arquivo> testa outro build)
# Verifica: versão no rodapé (VERSAO_APP do arquivo VERSION) e no PDF; chave de armazenamento estável inalterada;
# "Início" no cabeçalho volta à página inicial a partir do percurso sem apagar o caso; o botão da matriz no cabeçalho
# abre a matriz de qualquer tela; o cenário relatado (caso em branco salvo abre direto no percurso) tem saída;
# 1366 e 390 px sem rolagem horizontal.
import asyncio, os, re, subprocess
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = '/tmp/claude-0/v0014'
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
            ok(await pg.evaluate('VERSAO_APP') == VERSAO and await pg.evaluate('CANAL_APP') == 'estavel', f'{tag}: VERSAO_APP = {VERSAO}, canal estável')
            ok(await pg.evaluate('CHAVE') == 'aiedu-procurement-v9', f'{tag}: chave de armazenamento da versão estável inalterada')
            rod = await pg.inner_text('#txt-versao')
            ok(f'Version {VERSAO}' in rod, f'{tag}: rodapé com a versão ({rod})')
            # cenário relatado: caso em branco salvo noutra versão abre direto no percurso
            await pg.evaluate("(()=>{carregarExemplo('novo'); S.boasVindas=false; abrirFase('contexto','1a'); salvar();})()")
            await pg.reload(); await pg.wait_for_timeout(500)
            noPercurso = await pg.locator('#stepper').count() > 0
            ok(noPercurso, f'{tag}: caso em branco salvo abre no percurso (cenário relatado)')
            # matriz pelo cabeçalho, a partir do percurso
            await pg.locator('.nav-top [data-act="ver-matriz"]').click(); await pg.wait_for_timeout(300)
            ok(await pg.locator('#visor-matriz[open] table.mt-tab').count() == 1, f'{tag}: botão do cabeçalho abre a matriz no percurso')
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
            ok(await pg.locator('#visor-matriz[open]').count() == 0, f'{tag}: Esc fecha a matriz')
            # responde algo e volta ao início sem perder o caso
            await pg.evaluate("(()=>{S.ctx.local='Rede teste 0.0.14'; salvar(); render();})()")
            await pg.locator('.nav-top [data-act="inicio"]').click(); await pg.wait_for_timeout(400)
            ok(await pg.locator('#stepper').count() == 0 and await pg.get_by_role('button', name='See the full matrix').count() == 1, f'{tag}: "Home" leva à página inicial, com o botão da matriz')
            ok(await pg.evaluate("S.ctx.local") == 'Rede teste 0.0.14' and 'Rede teste 0.0.14' not in '' and await pg.evaluate("SALVO !== null"), f'{tag}: o caso continua salvo e a página oferece continuá-lo')
            await pg.get_by_role('button', name='Continue the saved case').click(); await pg.wait_for_timeout(400)
            ok(await pg.locator('#stepper').count() == 1 and await pg.evaluate("S.ctx.local") == 'Rede teste 0.0.14', f'{tag}: "Continuar o caso salvo" volta ao percurso com as respostas')
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
                ok(f'v{VERSAO}' in txt, f'PDF: versão no rodapé das páginas internas')
            await ctx.close()
        await b.close()
    print(f'\n{len(falhas)} FALHA(S)' if falhas else '\nTUDO OK')

asyncio.run(main())
