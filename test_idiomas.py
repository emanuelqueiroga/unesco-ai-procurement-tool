# Percorre as quatro fases da v11 em EN/ES/FR e lista textos que ficaram em português
# (percurso, ⓘ, details, calculadora, plano de contratação, Markdown do plano).
# Rodar a partir de /home/claude/app depois de `bash build.sh`. Resultado em /tmp/claude-0/sobras.json.
import asyncio, json, os, re
from playwright.async_api import async_playwright
os.makedirs('/tmp/claude-0', exist_ok=True)
SK = '<!doctype html><html><head><meta charset=utf8></head><body>' + open('navegador.html').read() + '</body></html>'
open('/tmp/claude-0/nav_lang.html','w').write(SK)
PT = re.compile(r'ção|ções|ã|õ|\b(?:não|você|para o|do caso|também|custo|orçament|decisão)\b', re.I)
IGNORAR = ('Cátedra', 'Desplugada', 'Tutor de matemática', 'São Tomé')
# magnitudes em português depois de um valor ("US$ 162 mil", "2,65 mi") ou na unidade ("USD mil"):
# em inglês e francês, "162 mil" se lê como 162 milhões. Em espanhol, "mil" é correto.
MAG_PT = re.compile(r'(?:\d|\b[A-Z]{3})[\s\u00a0\u202f](?:mil|mi|bi)\b')
COL = """(() => { const out = new Set(); const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
 let n; while ((n = w.nextNode())) { const p = n.parentElement; if (!p || p.closest('script,style,textarea,[data-notr],#txt-vinculo')) continue; const t = n.data.trim(); if (t) out.add(t); }
 document.querySelectorAll('[aria-label],[title],[placeholder]').forEach(e => ['aria-label','title','placeholder'].forEach(a => { const v = e.getAttribute(a); if (v) out.add(v); }));
 return [...out]; })()"""
ABRIR = """(() => {
  document.querySelectorAll('[data-info]').forEach(b => { const id = b.dataset.infoId || b.dataset.info; S.info[id] = true; FIG_ABERTA[id] = true; });
  render();
  document.querySelectorAll('details').forEach(d => d.open = true);
  const box = document.getElementById('custos-box');
  if (box && !box.innerHTML && typeof renderCustos === 'function') { box.innerHTML = renderCustos(); renderCustosResultados(); }
  document.querySelectorAll('details').forEach(d => d.open = true);
})()"""
FASES = ['contexto', 'piloto', 'implantacao', 'expansao']
LANG_ATUAL = ['']
def resto(t):
    if any(x in t for x in IGNORAR): return False
    if t.startswith('data:image/'): return False
    return bool(PT.search(t) or (LANG_ATUAL[0] in ('en', 'fr') and MAG_PT.search(t)))
async def main():
    res = {}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for lang in ['en','es','fr']:
            pg = await b.new_page(viewport={'width':1360,'height':900}); errs=[]
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto('file:///tmp/claude-0/nav_lang.html'); await pg.evaluate('localStorage.clear()'); await pg.reload(); await pg.wait_for_timeout(300)
            await pg.select_option('#sel-lang', lang); await pg.wait_for_timeout(200)
            LANG_ATUAL[0] = lang
            sobra = set()
            async def col():
                for t in await pg.evaluate(COL):
                    if resto(t): sobra.add(t)
            await col()
            for ex in ['novo','A','B','C','D','v11']:
                if ex == 'v11':
                    # caso com as variações da v11: PoC e piloto, várias ferramentas, internet parcial, horas estimadas e sugestões
                    await pg.evaluate("""(()=>{carregarExemplo('B'); const c=S.caso; c.testes=['poc','piloto']; c.conheceFerramentas='sim';
                      c.ferramentas.push({nome:'X',tarefas:['tutoria'],tipoTec:'paga',pagamento:'usuario',preco:3});
                      c.internet='parcial'; c.escolasInternet=100; c.modeloDisp='proprio'; delete S.respC.dispExistem; c.dispExistem='';
                      c.formacaoHoras=2; c.formacaoEstimativa=true; delete S.respC.formacaoHoras;
                      ['poc.participantes','poc.meses','implantacao.escolas','implantacao.pessoas'].forEach(k=>delete S.respC[k]); c.arquitetura='';
                      c.poc={participantes:'',meses:''}; c.implantacao={escolas:'',pessoas:''}; render();})()"""); await pg.wait_for_timeout(150)
                else:
                    await pg.evaluate(f"carregarExemplo('{ex}')"); await pg.wait_for_timeout(150)
                for fase in FASES:
                    for pid in await pg.evaluate(f"PASSOS['{fase}'].map(p=>p[0])"):
                        await pg.evaluate(f"(()=>{{S.boasVindas=false;S.calcAberta=true;S.vista='';S.fase='{fase}';S.passo='{pid}';render();}})()"); await pg.wait_for_timeout(100)
                        await pg.evaluate(ABRIR); await pg.wait_for_timeout(80)
                        await col()
                # todas as fases fechadas, painel e chamada final
                await pg.evaluate("(()=>{S.fase='';S.vista='';render();})()"); await pg.evaluate(ABRIR); await pg.wait_for_timeout(150); await col()
                # plano de contratação (página e estrutura usada no PDF)
                await pg.evaluate("abrirPlano()"); await pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)"); await pg.wait_for_timeout(200); await col()
                for t in await pg.evaluate("JSON.stringify(trFundo(secoesPlano())).split('\",\"')"):
                    if resto(t) and not re.match(r'^(contexto|piloto|custo):\w+:', t): sobra.add('PDF: ' + t[:200])
                md = await pg.evaluate("relMD(dadosRelatorio())")
                for l in md.split('\n'):
                    if resto(l): sobra.add('MD: ' + l[:200])
                await pg.evaluate("(()=>{S.vista='';render();})()")
            res[lang] = {'sobra': sorted(sobra), 'errs': errs}
            await pg.close()
        await b.close()
    json.dump(res, open('/tmp/claude-0/sobras.json','w'), ensure_ascii=False, indent=1)
    for l,v in res.items(): print(l, 'restos', len(v['sobra']), 'erros', v['errs'][:3])
asyncio.run(main())
