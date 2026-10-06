# Coleta os textos-fonte em português: espiona todas as chamadas de tr() num idioma fictício (xx)
# enquanto percorre os estados da interface (boas-vindas, caso em branco, exemplos, passos, resumo, relatório).
import asyncio, json, re
from playwright.async_api import async_playwright
SK = '<!doctype html><html><head><meta charset=utf8></head><body>' + open('/home/claude/app/navegador.html').read() + '</body></html>'
open('/tmp/claude-0/nav_ext.html','w').write(SK)
ESPIAO = """(() => { window.__K = new Set(); I18N.xx = {}; IDIOMAS.push(['xx','X','pt-BR']);
  const orig = tr; tr = function (s) { if (s != null) { const t = String(s); if (/\\p{L}{2}/u.test(t)) { const m = t.replace(/^\\s*\\[[ x]\\] /, '').trim(); if (m) window.__K.add(normalizar(m).chave); } } return orig(s); };
  S.lang = 'xx'; aplicarIdioma('xx'); render(); })()"""
DADOS = """(() => { const id = s => /^[a-z0-9_\\-.]+$/.test(s);
 const walk = x => { if (typeof x === 'string') { if (!id(x) && /\\p{L}{2}/u.test(x)) tr(x); } else if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') Object.values(x).forEach(v => typeof v === 'function' ? 0 : walk(v)); };
 [FASES, CAMADAS, NIVEIS_ADM, ETAPAS_ENS, DOMINIOS, RESP, QUESTOES, PASSOS, ACOES, PERG_FASE, VEREDITOS, CAMPOS_RISCO, CTX_EX, TXT_VINCULO, TXT_ISENCAO, ARRANJOS, APRENDIZAGEM, REC, NOTA_ARQ, CATS].forEach(walk);
 trFundo(secoesResumo()); try { gerarPDF(); } catch (e) {}
 trFundo(dadosRelatorio()); relMD(dadosRelatorio()); relHTML(dadosRelatorio(), true); try { csvCustos(); } catch (e) {} })()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1360,'height':900})
        await pg.goto('file:///tmp/claude-0/nav_ext.html'); await pg.evaluate("localStorage.clear()"); await pg.reload(); await pg.wait_for_timeout(300)
        await pg.evaluate(ESPIAO); await pg.wait_for_timeout(150)
        for dl in [False, True]:
            await pg.evaluate(f"CAP.downloads = {'({save:()=>0})' if dl else 'null'}")
            for ex in ['novo','B','A','C','D']:
                await pg.evaluate(f"carregarExemplo('{ex}')"); await pg.wait_for_timeout(100)
                await pg.evaluate(DADOS)
                for fase in ['contexto','piloto','implantacao','escala']:
                    for pid in await pg.evaluate(f"PASSOS['{fase}'].map(p=>p[0])"):
                        await pg.evaluate(f"(()=>{{S.boasVindas=false;S.calcAberta=true;S.fase='{fase}';S.passo='{pid}';render();}})()"); await pg.wait_for_timeout(60)
                        await pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)"); await pg.wait_for_timeout(60)
                        if pid == '1a':
                            await pg.evaluate("(()=>{const o=clone(S.ctx); for (const e of ETAPAS_ENS){S.ctx.etapas[e[0]]={on:true,escolas:1,alunos:1,porAno:true};} S.ctx.nivel='outro'; render(); S.ctx=o; render();})()")
                        if pid == '1b':
                            await pg.evaluate("(()=>{const o=clone(S.ctx); S.ctx.dominio='qualificacao'; S.ctx.comps=['outro'];render(); S.ctx=o; render();})()")
                        if pid == '3b':
                            for sb in await pg.eval_on_selector_all('[data-sub]', 'els => els.map(e => e.dataset.sub)'):
                                await pg.click(f'[data-sub="{sb}"]'); await pg.wait_for_timeout(50)
                        if pid == '3c':
                            for ar in ['saas','api','ow']:
                                await pg.evaluate(f"(()=>{{S.caso.arquitetura='{ar}';S.respC.arquitetura=true;S.custo.cfg=null;render();}})()"); await pg.wait_for_timeout(80)
                    await pg.evaluate(f"(()=>{{S.passo='';render();}})()")
                await pg.evaluate("(()=>{S.fase='';render();})()"); await pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)"); await pg.wait_for_timeout(150)
                for pul in ['{}', '{"implantacao":true,"escala":true}', '{"escala":true}']:
                    await pg.evaluate(f"(()=>{{S.pular={pul};abrirResumo();}})()"); await pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)"); await pg.wait_for_timeout(100)
                    await pg.evaluate(DADOS)
                    await pg.evaluate("(()=>{S.vista='';S.fase='implantacao';S.passo='';render();S.fase='escala';render();S.fase='piloto';render();})()"); await pg.wait_for_timeout(60)
                await pg.evaluate("(()=>{S.pular={};S.vista='';render();})()")
            await pg.evaluate("(()=>{S.boasVindas=true;render();})()"); await pg.wait_for_timeout(100)
        K = await pg.evaluate('[...window.__K]')
        await b.close()
    fin = sorted({x for x in K if x.strip() and re.search(r'[A-Za-zÀ-ÿ]{2}', x) and not re.match(r'^[A-Z]{3} · ', x)})
    json.dump(fin, open('/home/claude/app/i18n/pt_fontes3.json','w'), ensure_ascii=False, indent=0)
    en = json.load(open('/home/claude/app/i18n/en.json')); ex = json.load(open('/home/claude/app/i18n/extra_en.json'))
    novos = [x for x in fin if x not in en and x not in ex]
    json.dump(novos, open('/home/claude/app/i18n/pt_novos.json','w'), ensure_ascii=False, indent=0)
    print(len(fin), 'novos', len(novos))
asyncio.run(main())
