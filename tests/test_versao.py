# Versão no build de revisão da proposta A (0.0.16-alpha; mesma lógica da 0.0.14 da versão estável).
# Uso: CANAL=revisao bash build.sh && python3 tests/test_versao.py   (NAV=<arquivo> testa outro build)
# Verifica: VERSAO_APP = arquivo VERSION, CANAL_APP = 'revisao', chaves de armazenamento com o sufixo '@' + versão,
# versão visível no rodapé (refeita ao trocar o idioma) e no rodapé do PDF; 1366 e 390 px sem rolagem horizontal.
import asyncio, os, subprocess
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = '/tmp/claude-0/versao_v15_A'
os.makedirs(TMP, exist_ok=True)
NAV = os.environ.get('NAV', os.path.join(RAIZ, 'navegador.html'))
open(f'{TMP}/nav.html', 'w').write('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>' + open(NAV).read() + '</body></html>')
VERSAO = open(os.path.join(RAIZ, 'VERSION')).read().strip()
CHAVES = {'CHAVE': 'aiedu-procurement-v9', 'AJUDA_CHAVE': 'upt_ajuda_v14', 'UIA_CHAVE': 'upt_v15a_ui'}   # constante -> chave da versão estável
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
            for c, base in CHAVES.items():
                ok(await pg.evaluate(c) == base + '@' + VERSAO, f'{tag}: {c} termina com @{VERSAO}')
            el = pg.locator('footer #txt-versao')
            await el.scroll_into_view_if_needed()
            rod = await el.inner_text()
            ok(f'Version {VERSAO}' in rod and await el.is_visible(), f'{tag}: versão visível no rodapé ({rod})')
            await pg.select_option('#sel-lang', 'pt'); await pg.wait_for_timeout(150)
            ok(f'Versão {VERSAO}' in await el.inner_text(), f'{tag}: rodapé refeito ao trocar o idioma')
            await pg.select_option('#sel-lang', 'en'); await pg.wait_for_timeout(150)
            await pg.evaluate("(()=>{carregarExemplo('A'); S.boasVindas=false; salvar(); render();})()"); await pg.wait_for_timeout(300)
            ok(await pg.evaluate("localStorage.getItem(CHAVE) !== null && localStorage.getItem('aiedu-procurement-v9') === null"), f'{tag}: o caso fica na chave da revisão, não na da versão estável')
            sw = await pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
            ok(sw <= 1, f'{tag}: sem rolagem horizontal ({sw})')
            ok(not errs, f'{tag}: sem erros na página {errs[:2]}')
            if w == 1366:
                await pg.evaluate("abrirPlano()"); await pg.wait_for_timeout(400)
                async with pg.expect_download() as dl:
                    await pg.evaluate("baixarPDF()")
                d = await dl.value; arq = f'{TMP}/plano.pdf'; await d.save_as(arq)
                txt = subprocess.run(['pdftotext', '-f', '2', '-l', '2', arq, '-'], capture_output=True, text=True).stdout
                ok(f'v{VERSAO}' in txt, 'PDF: versão no rodapé das páginas internas')
            await ctx.close()
        await b.close()
    print(f'\n{len(falhas)} FALHA(S)' if falhas else '\nTUDO OK')
    if falhas: raise SystemExit(1)

asyncio.run(main())
