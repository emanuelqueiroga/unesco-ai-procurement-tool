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
  ok(await p.getByRole('link', { name: 'Rever as respostas' }).isVisible(), `${rotulo}: ainda há respostas faltando no fim`);
  const plano = await p.locator('main').innerText();
  ok(plano.includes('Rede Municipal de Exemplo'), `${rotulo}: plano sem o nome da rede`);
  ok(/Custo total, 3 anos/.test(plano), `${rotulo}: plano sem o custo total`);
  ok(/Comece por estas/.test(plano), `${rotulo}: plano sem recomendações`);
  await semRolagemHorizontal(p, `${rotulo} plano`);

  // as respostas ficaram guardadas com a origem certa
  await p.waitForTimeout(400);   // a gravação no navegador tem um pequeno atraso
  // a chave é 'aiedu-procurement-v14' (estável) ou 'aiedu-procurement-v14@<versão>' (revisão)
  const guardado = JSON.parse(await p.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.startsWith('aiedu-procurement-v14')); return k ? localStorage.getItem(k) : null; }));
  ok(guardado && guardado.formato === 14, `${rotulo}: estado v14 não foi salvo`);
  ok(guardado.origem.tarefas === 'informado' && guardado.origem['piloto.escolas'] === 'informado', `${rotulo}: sugestões aceitas não viraram 'informado'`);
  ok(guardado.caso.escolasInternet === 30 && guardado.caso.internet === 'parcial', `${rotulo}: internet parcial não gravou 30 escolas`);

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
  ok(await p.getByText('Há um caso salvo neste navegador.').isVisible(), `${rotulo}: início não ofereceu continuar o caso`);

  ok(erros.length === 0, `${rotulo}: erros na página: ${erros.join(' | ')}`);
  await ctx.close();
}

async function gavetaCelular(b) {
  const ctx = await b.newContext({ viewport: { width: 400, height: 860 } });
  const p = await ctx.newPage();
  await p.goto(BASE + '#/capitulo/2/internet');
  await p.getByRole('button', { name: 'Abrir o seu plano' }).click();
  ok(await p.getByRole('region', { name: 'Seu plano' }).isVisible(), '400px: a gaveta não abriu');
  await p.keyboard.press('Escape');
  ok(!(await p.getByRole('region', { name: 'Seu plano' }).isVisible().catch(() => false)), '400px: a gaveta não fechou com Esc');
  await ctx.close();
}

const b = await chromium.launch();
try {
  for (const w of [1360, 400]) { console.log(`percurso em ${w}px`); await percorrer(b, w); }
  console.log('gaveta no celular'); await gavetaCelular(b);
} finally { await b.close(); servidor.close(); }
console.log(`${verificacoes - falhas} de ${verificacoes} verificações ok`);
process.exit(falhas ? 1 : 0);
