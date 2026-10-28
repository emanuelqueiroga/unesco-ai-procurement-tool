// Teste de ponta a ponta do percurso (0.1.0-alpha.2): percorre as 25 perguntas do Essencial pela interface,
// em 1360 px (painel ao lado) e em 400 px (gaveta), sobre o build em ../docs/app.
// Verifica: o primeiro número aparece ao responder 2.3.4; as sugestões aceitas viram respostas; as sínteses;
// o plano completo; exportação JSON no formato 14; o caso continua depois de recarregar; nenhuma rolagem
// horizontal; nenhum erro de página. Uso: npm run build && npm run e2e
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

// E2E_DIR: outra pasta de build (por exemplo, o build de revisão)
const RAIZ = path.resolve(process.env.E2E_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../docs/app'));
if (!fs.existsSync(path.join(RAIZ, 'index.html'))) { console.error('Rode antes: npm run build'); process.exit(2); }
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' };
const servidor = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const arq = path.join(RAIZ, url === '/' ? 'index.html' : url);
  if (!arq.startsWith(RAIZ) || !fs.existsSync(arq)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(arq)] || 'application/octet-stream' });
  fs.createReadStream(arq).pipe(res);
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${servidor.address().port}/`;

let falhas = 0, verificacoes = 0;
const ok = (cond, msg) => { verificacoes++; if (!cond) { falhas++; console.error('  ✗ ' + msg); } };

const continuar = (p) => p.getByRole('button', { name: /^(Continuar|Aceitar a sugestão e continuar)$/ }).click();
const radio = (p, nome) => p.getByRole('radio', { name: nome }).check();
const caixa = (p, nome) => p.getByRole('checkbox', { name: nome }).check();

// uma ação por tela do Essencial; sem ação = aceitar a sugestão (ou seguir) com o botão principal
const RESPOSTAS = {
  nivel: (p) => radio(p, /^Município ou cidade/),
  local: (p) => p.getByLabel('Nome do lugar ou da rede').fill('Rede Municipal de Exemplo'),
  situacao: (p) => radio(p, /^Iniciar uma nova iniciativa/),
  etapas: async (p) => { await caixa(p, /anos finais/); await p.locator('#pr-schoolsgrid-fund2-escolas').fill('48'); await p.locator('#pr-schoolsgrid-fund2-estudantes').fill('9000'); },
  prioridades: (p) => caixa(p, /^Educar com a IA/),
  problemas: (p) => caixa(p, /^Baixa proficiência em matemática/),
  // a sugestão do 1.2.4 tem lacunas (____) e só conta como resposta quando a pessoa as preenche (PER-06)
  problema: (p) => p.locator('[data-tela="problema"] textarea').first().fill('Metade dos estudantes dos anos finais não atinge o nível adequado em matemática; as turmas são grandes e não há reforço no contraturno.'),
  linhaBase: (p) => radio(p, /^Não$/),
  alternativa: (p) => radio(p, /^Ainda não/),
  governanca: async (p) => { const linhas = p.locator('.pc-gov-linha'); const n = await linhas.count(); for (let i = 0; i < n; i++) await linhas.nth(i).getByRole('button', { name: i < 2 ? 'Sim' : 'Em parte' }).click(); },
  testes: (p) => caixa(p, /^Piloto/),
  tipoTec: (p) => radio(p, /^Produto ou serviço pago/),
  internet: async (p) => { await radio(p, /^Parcialmente/); await p.getByRole('textbox', { name: 'Em quantas?' }).fill('30'); },
  modeloDisp: (p) => radio(p, /^Um por professor/),
  formados: async (p) => { await p.getByRole('button', { name: 'Professores', exact: true }).click(); await p.getByRole('button', { name: /^Usar a estimativa/ }).click(); },
  suporteNivel: (p) => radio(p, /^Básico/),
  expansao: (p) => radio(p, /^Dois anos depois/),
};

async function semRolagemHorizontal(p, onde) {
  const [sw, cw] = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  ok(sw <= cw, `${onde}: rolagem horizontal (${sw} > ${cw})`);
}

async function percorrer(b, largura) {
  const rotulo = `${largura}px`;
  const ctx = await b.newContext({ viewport: { width: largura, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage();
  const erros = [];
  p.on('pageerror', (e) => erros.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) erros.push(m.text()); });
  await p.goto(BASE);
  // a ferramenta abre em inglês (como na v13); o teste percorre em português, pelo seletor de idioma do cabeçalho
  await p.locator('#sel-lang').waitFor({ state: 'attached' });
  ok((await p.locator('#sel-lang').inputValue()) === 'en', `${rotulo}: idioma inicial não é o inglês`);
  ok(/writes itself/i.test(await p.locator('h1').first().innerText()), `${rotulo}: início não está em inglês`);
  await p.selectOption('#sel-lang', 'pt');
  await p.getByRole('heading', { level: 1, name: /se escreve enquanto você responde/ }).waitFor({ timeout: 5000 });
  ok(await p.getByRole('heading', { level: 1 }).first().isVisible(), `${rotulo}: início sem título`);
  await semRolagemHorizontal(p, `${rotulo} início`);
  await p.getByRole('link', { name: 'Começar', exact: true }).click();

  const gaveta = largura < 1100;
  const textoPlano = async () => (gaveta ? p.locator('.pr-plandrawer-bar').innerText() : p.locator('.pc-plano').innerText());
  let telas = 0, capitulo = 0, numeroApareceu = false;
  for (let passo = 0; passo < 60; passo++) {
    const h = await p.evaluate(() => location.hash);
    // espera a tela correspondente ao endereço estar desenhada antes de interagir
    const sel = /^#\/capitulo\/(\d)$/.test(h) ? `[data-abertura="${h.slice(-1)}"]` : /\/sintese$/.test(h) ? `[data-sintese="${h.split('/')[2]}"]` : /^#\/capitulo\/\d\/\w+$/.test(h) ? `[data-tela="${h.split('/')[3]}"]` : null;
    if (sel) await p.locator(sel).waitFor({ timeout: 5000 });
    if (/^#\/capitulo\/\d$/.test(h)) { capitulo++; await semRolagemHorizontal(p, `${rotulo} abertura ${capitulo}`); await p.getByRole('link', { name: 'Começar o capítulo' }).click(); continue; }
    const m = h.match(/^#\/capitulo\/(\d)\/(\w+)$/);
    if (!m) break;
    if (m[2] === 'sintese') {
      const n = +m[1];
      ok(await p.getByRole('heading', { name: n === 4 ? 'O plano está completo' : 'Até aqui, o que você já sabe' }).isVisible(), `${rotulo}: síntese ${n} sem título`);
      if (n >= 2) ok(/US\$/.test(await p.locator('.pr-chaptersummary, main').first().innerText()), `${rotulo}: síntese ${n} sem número`);
      await semRolagemHorizontal(p, `${rotulo} síntese ${n}`);
      await p.getByRole('link', { name: n < 4 ? new RegExp(`^Capítulo ${n + 1}:`) : /^Abrir o plano$/ }).click();
      continue;
    }
    const tela = m[2];
    telas++;
    const antesNumero = /US\$/.test(await textoPlano());
    if (RESPOSTAS[tela]) await RESPOSTAS[tela](p);
    if (tela === 'tipoTec') {
      await p.waitForTimeout(100);
      const depois = await textoPlano();
      ok(!antesNumero && /US\$/.test(depois), `${rotulo}: o primeiro número não apareceu ao responder 2.3.4`);
      numeroApareceu = /US\$/.test(depois);
    }
    await semRolagemHorizontal(p, `${rotulo} ${tela}`);
    await continuar(p);
  }
  ok(telas === 25, `${rotulo}: percorreu ${telas} telas (esperado 25)`);
  ok(numeroApareceu, `${rotulo}: número não apareceu`);
  ok((await p.evaluate(() => location.hash)) === '#/plano', `${rotulo}: não terminou no plano`);
  await p.locator('.pc-plano-pagina').waitFor({ timeout: 5000 });
  const semFalta = await p.getByRole('link', { name: 'Rever as respostas' }).isVisible();
  if (!semFalta && process.env.E2E_DEBUG) { await p.evaluate(() => { location.hash = '#/plano/faltam'; }); await p.waitForTimeout(400); console.log((await p.locator('.pc-plano-pagina').innerText()).slice(0, 1200)); await p.evaluate(() => { location.hash = '#/plano'; }); await p.waitForTimeout(300); }
  ok(semFalta, `${rotulo}: ainda há respostas faltando no fim`);
  const plano = await p.locator('main').innerText();
  ok(plano.includes('Rede Municipal de Exemplo'), `${rotulo}: plano sem o nome da rede`);
  if (!/Custo total, 3 anos/i.test(plano) && process.env.E2E_DEBUG) console.log(plano.slice(0, 2500));
  ok(/Custo total, 3 anos/i.test(plano), `${rotulo}: plano sem o custo total`);
  ok(/Comece por estas/.test(plano), `${rotulo}: plano sem recomendações`);
  await semRolagemHorizontal(p, `${rotulo} plano`);

  // as respostas ficaram guardadas com a origem certa
  await p.waitForTimeout(400);   // a gravação no navegador tem um pequeno atraso
  // a chave é 'aiedu-procurement-v14' (estável) ou 'aiedu-procurement-v14@<versão>' (revisão)
  const guardado = JSON.parse(await p.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.startsWith('aiedu-procurement-v14')); return k ? localStorage.getItem(k) : null; }));
  ok(guardado && guardado.formato === 14, `${rotulo}: estado v14 não foi salvo`);
  ok(guardado.origem.tarefas === 'informado' && guardado.origem['piloto.escolas'] === 'informado', `${rotulo}: sugestões aceitas não viraram 'informado'`);
  ok(guardado.caso.escolasInternet === 30 && guardado.caso.internet === 'parcial', `${rotulo}: internet parcial não gravou 30 escolas`);

  // trocar o idioma no plano: o título e as recomendações mudam juntos
  await p.selectOption('#sel-lang', 'es');
  await p.waitForTimeout(300);
  const planoEs = await p.locator('main').innerText();
  ok(/Comience por estas|Empiece por estas|Empiece|Comience/.test(planoEs) || !/Comece por estas/.test(planoEs), `${rotulo}: plano não mudou para espanhol`);
  ok(!/Rever a escolha|Por quê: você respondeu/.test(planoEs), `${rotulo}: recomendações continuaram em português no espanhol`);
  await p.selectOption('#sel-lang', 'pt');
  await p.waitForTimeout(300);

  // exportar o caso
  await p.getByRole('button', { name: 'Caso', exact: true }).click();
  const [dl] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Exportar caso (.json)' }).click()]);
  const json = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
  ok(json.app === 'ai-education-procurement-tool' && json.formato === 14 && json.origem && json.modo === 'essencial', `${rotulo}: JSON exportado fora do formato 14`);
  ok(/^ai-education-case-/.test(dl.suggestedFilename()), `${rotulo}: nome do arquivo exportado`);
  await p.keyboard.press('Escape');

  // recarregar: o caso continua e o início oferece continuar
  await p.goto(BASE);
  await p.reload();
  await p.locator('#sel-lang').waitFor({ state: 'attached' });
  ok(await p.getByText('Há um caso salvo neste navegador.').isVisible(), `${rotulo}: início não ofereceu continuar o caso (o idioma guardado, português, também volta)`);

  ok(erros.length === 0, `${rotulo}: erros na página: ${erros.join(' | ')}`);
  await ctx.close();
}

async function gavetaCelular(b) {
  const ctx = await b.newContext({ viewport: { width: 400, height: 860 } });
  const p = await ctx.newPage();
  await p.goto(BASE + '#/capitulo/2/internet');
  await p.locator('.pr-plandrawer-bar').click();   // em inglês, idioma inicial
  ok(await p.locator('.pr-plandrawer-sheet').isVisible(), '400px: a gaveta não abriu');
  ok(/plan/i.test(await p.locator('.pr-plandrawer-sheet').getAttribute('aria-label')), '400px: a gaveta sem rótulo traduzido');
  await p.keyboard.press('Escape');
  ok(!(await p.locator('.pr-plandrawer-sheet').isVisible().catch(() => false)), '400px: a gaveta não fechou com Esc');
  await ctx.close();
}

// os nove idiomas: a tela troca de idioma, o árabe vira RTL e nenhum deles cria rolagem horizontal
async function idiomas(b) {
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } });
  const p = await ctx.newPage();
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());   // sem rede externa: as fontes do sistema bastam
  await p.goto(BASE + '#/capitulo/2/piloto');
  await p.locator('#sel-lang').waitFor({ state: 'attached' });
  const vistos = new Set();
  for (const l of ['pt', 'en', 'es', 'fr', 'ar', 'zh', 'bm', 'zu', 'sw']) {
    await p.selectOption('#sel-lang', l);
    await p.waitForTimeout(250);
    const h1 = await p.locator('main h1').first().innerText();
    vistos.add(h1);
    const dir = await p.evaluate(() => document.documentElement.dir);
    ok(dir === (l === 'ar' ? 'rtl' : 'ltr'), `${l}: direção ${dir}`);
    await semRolagemHorizontal(p, `idioma ${l}`);
    if (['ar', 'zh', 'bm', 'zu', 'sw'].includes(l)) ok(await p.locator('.pc-aviso-trad').isVisible(), `${l}: sem o aviso de tradução preliminar`);
  }
  ok(vistos.size === 9, `os nove idiomas deram ${vistos.size} títulos diferentes`);
  await ctx.close();
}

// ---------------------------------------------------------------- release: rodapé, matriz, confirmação, refinar, "de onde vem?", árabe
// abre a ferramenta num contexto novo (localStorage vazio), em português, e junta os erros de página
async function abrirPt(b, largura = 1360, hash = '', exemplo = false) {
  const ctx = await b.newContext({ viewport: { width: largura, height: 900 } });
  const p = await ctx.newPage();
  const erros = [];
  p.on('pageerror', (e) => erros.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) erros.push(m.text()); });
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await p.goto(BASE);
  await p.locator('#sel-lang').waitFor({ state: 'attached' });
  await p.selectOption('#sel-lang', 'pt');
  await p.getByRole('heading', { level: 1, name: /se escreve enquanto você responde/ }).waitFor({ timeout: 5000 });
  if (exemplo) {
    await p.getByRole('button', { name: 'Ver um plano de exemplo' }).click();
    await p.waitForFunction(() => location.hash === '#/plano', null, { timeout: 5000 });
    await p.locator('.pc-plano-pagina').waitFor({ timeout: 5000 });
  }
  if (hash) { await irPara(p, hash); }
  return { ctx, p, erros };
}
async function irPara(p, hash) {
  await p.evaluate((h) => { location.hash = h; }, hash);
  await p.waitForFunction((h) => location.hash === h, hash, { timeout: 5000 });
  await p.waitForTimeout(250);
}

// 1. o rodapé institucional aparece no início, numa pergunta, no plano e no refinar
async function rodape(b) {
  const { ctx, p, erros } = await abrirPt(b, 1360, '', true);
  await irPara(p, '#/');
  for (const [onde, hash] of [['início', '#/'], ['pergunta', '#/capitulo/2/internet'], ['plano', '#/plano'], ['refinar', '#/refinar']]) {
    await irPara(p, hash);
    const r = p.locator('[data-testid="rodape"]');
    await r.first().waitFor({ timeout: 5000 });
    ok(await r.count() === 1, `rodapé (${onde}): esperava exatamente um rodapé, achou ${await r.count()}`);
    ok(await r.first().isVisible(), `rodapé (${onde}): não está visível`);
    ok(/Versão/.test(await p.locator('[data-testid="versao"]').first().innerText()), `rodapé (${onde}): sem a versão`);
  }
  ok(erros.length === 0, `rodapé: erros na página: ${erros.join(' | ')}`);
  await ctx.close();
}

// 2. a matriz completa abre num diálogo com uma tabela; o Esc fecha e o foco volta ao botão
async function matriz(b) {
  const { ctx, p, erros } = await abrirPt(b);
  const botao = p.getByRole('button', { name: 'Ver a matriz completa', exact: true });
  await botao.click();
  const dlg = p.getByRole('dialog');
  await dlg.first().waitFor({ timeout: 5000 });
  ok(await dlg.locator('table.pc-matriz-tabela').isVisible(), 'matriz: o diálogo não tem a tabela');
  ok((await dlg.locator('tbody tr').count()) >= 7, 'matriz: menos de sete linhas de camadas');
  ok((await dlg.locator('thead th').count()) >= 5, 'matriz: faltam as colunas das fases');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(200);
  ok(!(await p.locator('.pc-matriz').isVisible().catch(() => false)), 'matriz: não fechou com Esc');
  ok(await botao.evaluate((el) => el === document.activeElement), 'matriz: o foco não voltou ao botão "Ver a matriz completa"');
  // o botão "Matriz" do cabeçalho abre o mesmo diálogo, e "Ver na matriz" destaca uma fase
  await p.getByRole('button', { name: 'Matriz camadas × fases', exact: true }).click();
  await p.locator('.pc-matriz table').waitFor({ timeout: 5000 });
  await p.keyboard.press('Escape');
  await p.getByRole('button', { name: 'Ver na matriz', exact: true }).first().click();
  await p.locator('.pc-matriz table').waitFor({ timeout: 5000 });
  ok((await p.locator('.pc-matriz th[aria-current="true"]').count()) === 1, 'matriz: "Ver na matriz" não destacou a fase');
  await p.keyboard.press('Escape');
  ok(erros.length === 0, `matriz: erros na página: ${erros.join(' | ')}`);
  await ctx.close();
}

// 3. "Começar em branco" com um caso editado pede confirmação; Cancelar mantém, confirmar apaga
async function confirmacao(b) {
  const { ctx, p, erros } = await abrirPt(b, 1360, '', true);
  // exemplo ainda não editado: trocar não pergunta
  await irPara(p, '#/');
  ok(await p.getByText('Há um exemplo aberto neste navegador.').isVisible(), 'confirmação: início sem o aviso do exemplo aberto');
  // editar uma resposta: o caso passa a "editado"
  await irPara(p, '#/capitulo/1/local');
  await p.locator('[data-tela="local"]').waitFor({ timeout: 5000 });
  await p.getByLabel('Nome do lugar ou da rede').fill('Rede Editada de Teste');
  await p.waitForTimeout(400);
  await irPara(p, '#/');
  ok(await p.getByText('Há um caso salvo neste navegador.').isVisible(), 'confirmação: após editar, o início não mostra "caso salvo"');
  ok(await p.getByText(/apaga o caso salvo/).isVisible(), 'confirmação: sem o aviso de que começar em branco apaga o caso');
  const branco = p.getByRole('button', { name: 'Começar em branco', exact: true });
  await branco.click();
  const dlg = p.getByRole('dialog', { name: 'Apagar o caso atual?' });
  await dlg.waitFor({ timeout: 5000 });
  ok(await dlg.getByRole('button', { name: 'Cancelar', exact: true }).evaluate((el) => el === document.activeElement), 'confirmação: o foco não começa em "Cancelar"');
  ok(await dlg.getByRole('button', { name: 'Exportar o caso antes' }).isVisible(), 'confirmação: sem "Exportar o caso antes"');
  await dlg.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await p.waitForTimeout(200);
  ok(!(await dlg.isVisible().catch(() => false)), 'confirmação: Cancelar não fechou o diálogo');
  ok(await p.getByText('Há um caso salvo neste navegador.').isVisible(), 'confirmação: Cancelar não manteve o caso');
  ok(!(await p.getByRole('link', { name: 'Começar', exact: true }).isVisible().catch(() => false)), 'confirmação: o link "Começar" apareceu após cancelar');
  // Esc também cancela e devolve o foco
  await branco.click();
  await dlg.waitFor({ timeout: 5000 });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  ok(!(await dlg.isVisible().catch(() => false)) && await p.getByText('Há um caso salvo neste navegador.').isVisible(), 'confirmação: Esc não cancelou mantendo o caso');
  ok(await branco.evaluate((el) => el === document.activeElement), 'confirmação: o foco não voltou ao botão "Começar em branco"');
  // confirmar apaga
  await branco.click();
  await dlg.waitFor({ timeout: 5000 });
  await dlg.getByRole('button', { name: 'Apagar e começar em branco' }).click();
  await p.getByRole('link', { name: 'Começar', exact: true }).waitFor({ timeout: 5000 });
  ok(!(await p.getByText('Há um caso salvo neste navegador.').isVisible().catch(() => false)), 'confirmação: o caso continuou depois de confirmar');
  ok((await p.evaluate(() => location.hash)) === '#/', 'confirmação: não ficou no início');
  ok(erros.length === 0, `confirmação: erros na página: ${erros.join(' | ')}`);
  await ctx.close();
}

// 4. calculadora (Refinar): abas, formatação ao digitar, total que muda, sem rolagem horizontal a 400 px
async function refinar(b) {
  const { ctx, p, erros } = await abrirPt(b, 1360, '#/refinar/premissas', true);
  await p.getByRole('heading', { level: 1, name: 'Custo total e orçamento' }).waitFor({ timeout: 5000 });
  const abas = p.getByRole('navigation', { name: 'Abas da calculadora' });
  ok((await abas.getByRole('link').count()) === 3, 'refinar: esperava três abas');
  const aba = (nome) => abas.getByRole('link', { name: nome, exact: true });
  ok((await aba('Premissas por ano').getAttribute('aria-current')) === 'page', 'refinar: a aba Premissas não está ativa');
  ok(await p.locator('#rf-demanda').isVisible(), 'refinar: a aba Premissas não mostra a demanda');

  // digitar em "Pessoas elegíveis, Ano 1": 1.600.000 formatado enquanto se digita e total que muda
  const numeros = p.locator('.rf-numeros');
  const antes = await numeros.innerText();
  const campo = p.locator('[id="rf-demanda.E"]').getByLabel('Ano 1', { exact: true });
  await campo.click();
  await campo.press('Control+A');
  await campo.press('Backspace');
  await campo.pressSequentially('1600000', { delay: 20 });
  ok((await campo.inputValue()) === '1.600.000', `refinar: o campo não formatou ao digitar (${await campo.inputValue()})`);
  await campo.pressSequentially('0', { delay: 20 });
  ok((await campo.inputValue()) === '16.000.000', `refinar: o campo não reformatou ao digitar mais um dígito (${await campo.inputValue()})`);
  await campo.press('Backspace');
  await p.waitForTimeout(300);
  const depois = await numeros.innerText();
  ok(depois !== antes, 'refinar: o total não mudou ao editar as pessoas elegíveis');
  ok(/Custo total do ciclo de vida/.test(depois) && /US\$/.test(depois), 'refinar: números-chave sem o custo total');
  await campo.blur();
  ok((await campo.inputValue()) === '1.600.000', `refinar: o campo perdeu a formatação ao sair (${await campo.inputValue()})`);
  ok(/refinado/.test(await numeros.innerText()), 'refinar: o número não passou a "refinado" depois da edição');

  // as três abas trocam o conteúdo e o endereço
  await aba('Ferramentas e licenças').click();
  await p.waitForFunction(() => location.hash === '#/refinar/ferramentas', null, { timeout: 5000 });
  await p.waitForTimeout(300);
  ok((await aba('Ferramentas e licenças').getAttribute('aria-current')) === 'page', 'refinar: a aba Ferramentas não ficou ativa');
  ok(!(await p.locator('#rf-demanda').isVisible().catch(() => false)), 'refinar: a aba Ferramentas ainda mostra a demanda');
  const textoFerr = await p.locator('.rf-conteudo').innerText();
  await aba('Cenários e sensibilidade').click();
  await p.waitForFunction(() => location.hash === '#/refinar/cenarios', null, { timeout: 5000 });
  await p.waitForTimeout(300);
  ok((await aba('Cenários e sensibilidade').getAttribute('aria-current')) === 'page', 'refinar: a aba Cenários não ficou ativa');
  const textoCen = await p.locator('.rf-conteudo').innerText();
  ok(textoCen.length > 100 && textoCen !== textoFerr, 'refinar: a aba Cenários não trocou o conteúdo');
  await aba('Premissas por ano').click();
  await p.waitForFunction(() => location.hash === '#/refinar/premissas', null, { timeout: 5000 });
  await p.waitForTimeout(300);
  ok(await p.locator('#rf-demanda').isVisible(), 'refinar: voltar a Premissas não mostrou a demanda');
  ok(erros.length === 0, `refinar: erros na página: ${erros.join(' | ')}`);
  await ctx.close();

  // 400 px: nenhuma das abas cria rolagem horizontal
  const m = await abrirPt(b, 400, '#/refinar/premissas', true);
  for (const [nome, hash] of [['premissas', '#/refinar/premissas'], ['ferramentas', '#/refinar/ferramentas'], ['cenários', '#/refinar/cenarios']]) {
    await irPara(m.p, hash);
    await m.p.locator('.rf-conteudo').waitFor({ timeout: 5000 });
    ok((await m.p.locator('.rf-conteudo').innerText()).length > 100, `refinar 400px ${nome}: aba vazia`);
    await semRolagemHorizontal(m.p, `refinar 400px ${nome}`);
  }
  ok(m.erros.length === 0, `refinar 400px: erros na página: ${m.erros.join(' | ')}`);
  await m.ctx.close();
}

// 5. "de onde vem?" de um KPI do plano: origem, "Ajustar premissas" e Esc
async function deOndeVem(b) {
  const { ctx, p, erros } = await abrirPt(b, 1360, '#/plano', true);
  const gatilho = p.getByRole('button', { name: 'de onde vem?' }).first();
  await gatilho.scrollIntoViewIfNeeded();
  ok((await gatilho.getAttribute('aria-expanded')) === 'false', 'de onde vem?: já começa aberto');
  await gatilho.click();
  const painel = p.locator('.pr-popover-painel').first();
  await painel.waitFor({ timeout: 5000 });
  ok((await gatilho.getAttribute('aria-expanded')) === 'true', 'de onde vem?: aria-expanded não mudou ao abrir');
  const ajustar = painel.getByRole('link', { name: 'Ajustar premissas' });
  ok(await ajustar.isVisible(), 'de onde vem?: sem o link "Ajustar premissas"');
  ok(/^#\/refinar\/premissas/.test((await ajustar.getAttribute('href')) || ''), `de onde vem?: href inesperado (${await ajustar.getAttribute('href')})`);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(200);
  ok(!(await p.locator('.pr-popover-painel').count()), 'de onde vem?: não fechou com Esc');
  ok(await gatilho.evaluate((el) => el === document.activeElement), 'de onde vem?: o foco não voltou ao gatilho');
  // seguir o link leva à calculadora, na aba Premissas
  await gatilho.click();
  await p.locator('.pr-popover-painel').first().getByRole('link', { name: 'Ajustar premissas' }).click();
  await p.waitForFunction(() => /^#\/refinar\/premissas/.test(location.hash), null, { timeout: 5000 });
  await p.getByRole('heading', { level: 1, name: 'Custo total e orçamento' }).waitFor({ timeout: 5000 });
  ok(true, 'de onde vem?: chegou à calculadora');
  ok(erros.length === 0, `de onde vem?: erros na página: ${erros.join(' | ')}`);
  await ctx.close();
}

// 6. árabe: o plano e a calculadora ficam em RTL, sem rolagem horizontal a 400 px
async function arabe(b) {
  const { ctx, p, erros } = await abrirPt(b, 400, '', true);
  await p.selectOption('#sel-lang', 'ar');
  await p.waitForTimeout(400);
  for (const [nome, hash] of [['calculadora', '#/refinar/premissas'], ['plano', '#/plano']]) {
    await irPara(p, hash);
    await p.locator(hash === '#/plano' ? '.pc-plano-pagina' : '.rf-conteudo').waitFor({ timeout: 5000 });
    ok((await p.evaluate(() => document.documentElement.dir)) === 'rtl', `árabe ${nome}: html sem dir="rtl"`);
    ok((await p.evaluate(() => document.documentElement.lang)) === 'ar', `árabe ${nome}: html sem lang="ar"`);
    ok((await p.evaluate(() => getComputedStyle(document.body).direction)) === 'rtl', `árabe ${nome}: direção calculada não é rtl`);
    await semRolagemHorizontal(p, `árabe 400px ${nome}`);
  }
  for (const aba of ['ferramentas', 'cenarios']) {
    await irPara(p, '#/refinar/' + aba);
    await p.locator('.rf-conteudo').waitFor({ timeout: 5000 });
    await semRolagemHorizontal(p, `árabe 400px ${aba}`);
  }
  ok(erros.length === 0, `árabe: erros na página: ${erros.join(' | ')}`);
  await ctx.close();
}

const b = await chromium.launch();
try {
  for (const w of [1360, 400]) { console.log(`percurso em ${w}px`); await percorrer(b, w); }
  console.log('gaveta no celular'); await gavetaCelular(b);
  console.log('nove idiomas'); await idiomas(b);
  console.log('rodapé'); await rodape(b);
  console.log('matriz'); await matriz(b);
  console.log('confirmação'); await confirmacao(b);
  console.log('refinar'); await refinar(b);
  console.log('de onde vem?'); await deOndeVem(b);
  console.log('árabe'); await arabe(b);
} finally { await b.close(); servidor.close(); }
console.log(`${verificacoes - falhas} de ${verificacoes} verificações ok`);
process.exit(falhas ? 1 : 0);
