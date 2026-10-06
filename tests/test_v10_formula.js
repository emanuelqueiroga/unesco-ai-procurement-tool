// Testes da fórmula do custo (v10, pacote R3): src/formula.js
// Uso: node tests/test_v10_formula.js
// Carrega i18n.js, custos.js, framework.js, casos.js, custos_ui.js, fluxo_dados.js e formula.js num
// contexto isolado, como no build (sem as linhas "if (typeof module"), com stubs de S, MOEDAS, esc e cfgAtual.
// Verifica, para os exemplos A–D e variantes (desconto, saída provável, continuidade, modo de compatibilidade,
// adaptação, outra moeda): (1) os termos da fórmula geral somam ctEco; (2) as linhas de cada ano mais
// "Outros itens" somam o custo econômico do ano; (3) cada linha é uma conta "×" e "=" ou um valor fixo da
// premissa; (4) os valores mostrados (arredondados) também fecham; (5) HTML, seções do plano e traduções EN/ES/FR.
// v11: variantes com internet, dispositivos, formação (papéis, formato, pagador), suporte do fornecedor,
// acompanhamento, prova de conceito + piloto e ferramentas adicionais; as linhas novas são contas exatas e a
// origem explica o caminho da demanda (teste → primeira etapa da implantação → expansão).
const fs = require('fs'), path = require('path'), vm = require('vm');
const RAIZ = path.join(__dirname, '..');
// as linhas "if (typeof module…" (exportações para o node) viram código morto, mesmo quando ocupam mais de uma linha
const ler = f => fs.readFileSync(path.join(RAIZ, f), 'utf8').replace(/^if \(typeof module/gm, 'if (false && typeof module');
const json = f => JSON.parse(fs.readFileSync(path.join(RAIZ, f), 'utf8'));

function dicionario(l) {
  const d = {};
  const arqs = [`i18n/${l}.json`, `i18n/extra_${l}.json`]
    .concat(fs.readdirSync(path.join(RAIZ, 'i18n')).filter(f => /^v9_.*\.json$/.test(f) && f.endsWith(`_${l}.json`)).sort().map(f => 'i18n/' + f))
    .concat(fs.readdirSync(path.join(RAIZ, 'i18n')).filter(f => /^v10_.*\.json$/.test(f) && f.endsWith(`_${l}.json`)).sort().map(f => 'i18n/' + f))
    .concat(fs.readdirSync(path.join(RAIZ, 'i18n')).filter(f => /^v11_.*\.json$/.test(f) && f.endsWith(`_${l}.json`)).sort().map(f => 'i18n/' + f));
  arqs.forEach(f => { if (fs.existsSync(path.join(RAIZ, f))) Object.assign(d, json(f)); });
  return d;
}
const I18N = { en: dicionario('en'), es: dicionario('es'), fr: dicionario('fr') };
const MOEDAS = (() => { try { return json('../guia/custos2/moedas.json'); } catch (e) { return { taxas: { USD: 1, BRL: 5.4, EUR: 0.92 } }; } })();

const ctx = vm.createContext({ console, Intl, Math, JSON, Number, String, Array, Object, Set, Map, Date, isFinite, isNaN, parseFloat });
vm.runInContext(`const I18N = ${JSON.stringify(I18N)}; const MOEDAS = ${JSON.stringify(MOEDAS)};
  var S = { moeda: { cod: 'USD', taxa: '' } }; var CFG = null; function cfgAtual() { return CFG; }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));`, ctx);
['src/i18n.js', 'src/custos.js', 'src/framework.js', 'src/casos.js', 'src/custos_ui.js', 'src/fluxo_dados.js', 'src/formula.js'].forEach(f => vm.runInContext(ler(f), ctx, { filename: f }));
const run = code => vm.runInContext(code, ctx);

let ok = 0, bad = 0;
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= Math.max(1e-6, Math.abs(b) * tol);
const eq = (n, a, b, tol) => { if (near(a, b, tol)) ok++; else { bad++; console.log('FALHA', n, a, b); } };
const chk = (n, c, extra) => { if (c) ok++; else { bad++; console.log('FALHA', n, extra !== undefined ? JSON.stringify(extra) : ''); } };

// configurações: exemplos A–D a partir do caso (como no app) e variantes
run(`
  function totDe(x) {
    const ids = Object.keys(x.etapas).filter(k => x.etapas[k].on);
    const al = id => { const e = x.etapas[id]; return (!e.soTotal && Array.isArray(e.anos) && e.anos.length) ? e.anos.reduce((a, b) => a + (+b || 0), 0) : +e.alunos || 0; };
    return { alunos: ids.reduce((s, id) => s + al(id), 0), escolas: ids.reduce((s, id) => s + (+x.etapas[id].escolas || 0), 0), etapas: ids };
  }
  function cfgExemplo(k, muda) {
    const c = Object.assign(clone(CASOS[k]), muda || {});
    const ce = casoEfetivo(c, totDe(CTX_EX[k])); return cfgDoCaso(ce, perfilFinal(ce));
  }
  var CENARIOS = {};
  ['A', 'B', 'C', 'D'].forEach(k => { CENARIOS[k] = cfgExemplo(k); });
  ['A', 'B', 'C'].forEach(k => { CENARIOS['preset ' + k] = clone(PRESETS[k]); });
  CENARIOS['A com desconto 3%'] = (() => { const c = cfgExemplo('A'); c.opc = Object.assign({}, c.opc, { r: 0.03 }); return c; })();
  CENARIOS['B com saída provável 50% e desconto 5%'] = (() => { const c = cfgExemplo('B'); c.opc = Object.assign({}, c.opc, { pSaida: 0.5, r: 0.05 }); return c; })();
  CENARIOS['D com continuidade'] = (() => { const c = cfgExemplo('D'); c.opc = Object.assign({}, c.opc, { fechamento: 'continuidade' }); return c; })();
  CENARIOS['C compatibilidade v1'] = (() => { const c = cfgExemplo('C'); c.opc = Object.assign({}, OPC_COMPAT, { H: 3 }); return c; })();
  CENARIOS['A adaptação só configuração'] = cfgExemplo('A', { adaptacao: 'config' });
  CENARIOS['A gratuito, internet e dispositivos parciais'] = cfgExemplo('A', { pagamento: 'gratuito', internet: 'parcial', dispExistem: 'parcial' });
  CENARIOS['B v11: PoC + piloto, sem internet nem dispositivos, formação online do fornecedor, suporte dedicado do fornecedor, acompanhamento intensivo'] =
    cfgExemplo('B', { testes: ['poc', 'piloto'], poc: { participantes: 15, meses: 2 }, internet: 'nao', modeloDisp: 'um_por_aluno', dispExistem: 'nao',
      formados: ['professores', 'gestores', 'tecnica'], formacaoFormato: 'online', formacaoPaga: 'fornecedor', formacaoHoras: 6, formacaoEstimativa: false,
      suporteQuem: 'fornecedor', suporteNivel: 'dedicado', acompanhamento: 'intensivo' });
  CENARIOS['A v11: duas ferramentas extras, suporte das duas equipes, formação híbrida, internet parcial com número'] =
    cfgExemplo('A', { nFerramentas: '3mais', ferramentas: [CASOS.A.ferramentas[0], { nome: 'Corretor de redações', tarefas: ['feedback_redacao'], tipoTec: 'paga', pagamento: 'usuario', preco: 4 },
      { nome: 'Banco de questões', tarefas: ['materiais'], tipoTec: 'paga', pagamento: 'institucional', preco: '' }],
      internet: 'parcial', escolasInternet: 600, modeloDisp: 'rotativo', dispExistem: 'nao', formados: ['professores', 'administrativo'], formacaoFormato: 'hibrida',
      suporteQuem: 'ambos', suporteNivel: 'ampliado', acompanhamento: 'leve' });
  CENARIOS['D v11: PoC, suporte básico do fornecedor'] = cfgExemplo('D', { suporteQuem: 'fornecedor', suporteNivel: 'basico' });
  CENARIOS['B tecnologia pública, 5 anos'] = cfgExemplo('B', { tipoTec: 'publica', horizonte: 5 });
  CENARIOS['A pessoal interno a 80% (sigma)'] = (() => { const c = cfgExemplo('A'); c.opc = Object.assign({}, c.opc, { sigmaCap: 0.8 }); c.itens[0].prob = 0.5; return c; })();
`);
const nomes = run('Object.keys(CENARIOS)');

function verificar(nome, moeda) {
  run(`S.moeda = { cod: ${JSON.stringify(moeda || 'USD')}, taxa: '' }; CFG = CENARIOS[${JSON.stringify(nome)}];`);
  const r = run(`(() => {
    const av = avaliar(calcular(CFG)), ex = explicacaoCusto(CFG), f = moedaInfo().f;
    return { ex: JSON.parse(JSON.stringify(ex)), ct: av.ctEco, ecoAno: av.ecoAno, disc: av.disc, saidaEco: av.saidaEco, vr: av.vr || 0, H: av.r.H, f, fixo: FX_FIXO };
  })()`);
  const { ex, ct, ecoAno, disc, H, f } = r;
  const tag = nome + (moeda ? ' [' + moeda + ']' : '');
  // (1) fórmula geral
  const soma = ex.formula.termos.reduce((s, x) => s + (x.sinal === -1 ? -1 : 1) * x.valor, 0);
  eq(tag + ': termos somam ctEco', soma, ct);
  eq(tag + ': total da fórmula = ctEco', ex.formula.total, ct);
  chk(tag + ': termos teste, uso e saída', ['teste', 'uso', 'saida'].every((id, i) => ex.formula.termos[i].id === id));
  eq(tag + ': uso = soma dos Anos 1..H', ex.formula.termos[1].valor, ex.formula.termos[1].anos.reduce((s, a) => s + a.valor, 0));
  // valores mostrados (arredondados na moeda de exibição) fecham exatamente
  const rnd = x => Math.round(x * f);
  chk(tag + ': parcelas mostradas somam o total mostrado', rnd(ex.formula.termos.reduce((s, x) => s + (x.sinal === -1 ? -1 : 1) * x.mostrado, 0)) === rnd(ex.formula.totalMostrado));
  chk(tag + ': total mostrado = ctEco arredondado', rnd(ex.formula.totalMostrado) === Math.round(ct * f));
  chk(tag + ': texto da fórmula com "=" e "+"', /=/.test(ex.formula.texto) && /\+/.test(ex.formula.numeros));
  chk(tag + ': nota de valor presente só com desconto', !!ex.formula.notaVP === disc.some(d => Math.abs(d - 1) > 1e-12));
  // (2) anos
  chk(tag + ': abas Ano 0..H e Saída', ex.anos.length === H + 2 && ex.anos[H + 1].id === 'saida');
  ex.anos.forEach(a => {
    const linhas = a.linhas.concat(a.outros ? a.outros.itens : []);
    const s = a.linhas.reduce((t, x) => t + x.valor, 0) + (a.outros ? a.outros.valor : 0);
    if (a.id !== 'saida') {
      eq(`${tag}: ${a.rotulo} linhas + outros = custo econômico do ano`, s, ecoAno[a.t]);
      eq(`${tag}: ${a.rotulo} total = ano × desconto`, a.total, ecoAno[a.t] * disc[a.t]);
      if (a.outros) chk(`${tag}: ${a.rotulo} linhas mostradas cobrem ≥ 90%`, a.linhas.reduce((t, x) => t + x.valor, 0) >= 0.9 * ecoAno[a.t] - 1e-6);
      chk(`${tag}: ${a.rotulo} mostrado fecha`, rnd(a.linhas.reduce((t, x) => t + x.mostrado, 0) + (a.outros ? a.outros.mostrado : 0)) === rnd(a.somaMostrada));
    } else {
      eq(`${tag}: saída linhas + outros = soma`, s, a.soma);
      eq(`${tag}: saída × probabilidade × desconto = saidaEco`, a.continuidade ? 0 : a.soma * a.pSaida * disc[H], r.saidaEco);
      eq(`${tag}: total da saída`, a.total, r.saidaEco);
    }
    if (a.outros) eq(`${tag}: ${a.rotulo} outros = soma dos itens`, a.outros.valor, a.outros.itens.reduce((t, x) => t + x.valor, 0));
    if (a.outros) chk(`${tag}: ${a.rotulo} "Outros itens (N)" com N > 1`, a.outros.n === a.outros.itens.length && a.outros.n > 1);
    // (3) cada linha é uma conta
    linhas.forEach(x => {
      const conta = x.texto.includes('×') && x.texto.includes('=');
      chk(`${tag}: ${a.rotulo} "${x.nome}" escrito como conta ou valor fixo`, conta || x.texto.startsWith(r.fixo), x.texto);
      if (x.qtd != null) {
        const v = x.qtd * x.preco * (x.mult || 1) / (x.divisor || 1);
        eq(`${tag}: ${a.rotulo} "${x.nome}" quantidade × preço = valor`, v, x.valor, 1e-9);
      }
      if (x.fator != null) eq(`${tag}: ${a.rotulo} "${x.nome}" base × fator = valor`, x.base * x.fator / (x.divisor || 1), x.valor, 1e-9);
      chk(`${tag}: ${a.rotulo} "${x.nome}" sem NaN`, !/NaN|undefined|Infinity/.test(x.texto), x.texto);
    });
  });
  chk(tag + ': origem com pessoas, adoção e preços de partida', ex.origem.length >= 4 && /Pessoas que poderiam usar|people|personas|personnes/i.test(ex.origem.join(' ')));
  chk(tag + ': três frases de leitura', ex.leitura.length === 3, ex.leitura);
}
nomes.forEach(n => verificar(n));
verificar('A', 'BRL'); verificar('D', 'EUR');

// unidades traduzidas em palavras simples
run(`CFG = CENARIOS.A; S.moeda = { cod: 'USD', taxa: '' }; LANG = 'pt';`);
const exA = run('explicacaoCusto(CFG)');
const ano1 = exA.anos[1];
chk('A, Ano 1: licenças em "licenças-mês" com "÷" de preços do Ano 0', ano1.linhas[0].texto.startsWith('144.000 licenças-mês × US$ 9,00 por licença por mês ÷ 1,025 = US$ 1.264.39'), ano1.linhas[0].texto);
chk('A: "pessoa em tempo integral" no lugar de FTE', JSON.stringify(exA).includes('pessoa em tempo integral') && !/FTE/.test(exA.anos.map(a => a.linhas.map(x => x.texto).join(' ')).join(' ')));
chk('A: origem "12.000 licenças × 12 meses = 144.000 licenças-mês"', exA.origem.some(x => x.includes('12.000 licenças × 12 meses = 144.000 licenças-mês')), exA.origem);
chk('A: origem com adoção de 35% no Ano 1', exA.origem.some(x => x.includes('Ano 1: 35%')));
chk('A: leitura com o que mais pesa, o que muda e onde editar', /mais pesa/.test(exA.leitura[0]) && /muda o custo/.test(exA.leitura[1]) && /calculadora completa/.test(exA.leitura[2]));
chk('A: total da fórmula igual ao KPI (grande)', run('grande(explicacaoCusto(CFG).formula.totalMostrado) === grande(avaliar(calcular(CFG)).ctEco)'));

// v11: linhas novas como contas exatas e origem com o caminho da demanda
run(`LANG = 'pt'; S.moeda = { cod: 'USD', taxa: '' };`);
const exV = run(`explicacaoCusto(CENARIOS[${JSON.stringify('B v11: PoC + piloto, sem internet nem dispositivos, formação online do fornecedor, suporte dedicado do fornecedor, acompanhamento intensivo')}])`);
const todas = a => a.linhas.concat(a.outros ? a.outros.itens : []);
const linhaV = (a, re) => todas(a).find(x => re.test(x.nome));
const a0 = exV.anos[0], a1 = exV.anos[1];
const net = linhaV(a1, /^Conexão das escolas/);
chk('v11 B: internet como conta "escolas sem internet adequada × US$ 600 por escola por ano"', net && /escolas? sem internet adequada × US\$ 600 por escola por ano = /.test(net.texto), net && net.texto);
const disp = linhaV(a0, /^Dispositivos a comprar/);
chk('v11 B: dispositivos como conta "dispositivos novos × US$ 300 por dispositivo"', disp && /dispositivos novos × US\$ 300 por dispositivo = /.test(disp.texto), disp && disp.texto);
const sup0 = linhaV(a0, /^Suporte do fornecedor/), sup1 = linhaV(a1, /^Suporte do fornecedor/);
chk('v11 B: suporte do fornecedor no Ano 0 com os meses do teste (× 6/12)', sup0 && /usuários? ativos? × US\$ 5,00 por usuário ativo por ano × 6\/12 \(meses do teste\) = /.test(sup0.texto), sup0 && sup0.texto);
chk('v11 B: suporte do fornecedor no Ano 1 por usuário ativo', sup1 && /usuários ativos × US\$ 5,00 por usuário ativo por ano ÷ 1,025 = /.test(sup1.texto), sup1 && sup1.texto);
const prog = exV.anos.map(a => linhaV(a, /^Programa de formação|^Formação de professores|^Formação \(materiais/)).find(Boolean);
chk('v11 B: programa de formação × 0,5 (formato online), cedido sem custo', prog && /× 0,5 \(formato da formação, passo 2\.5\.3\)/.test(prog.texto) && prog.tipo === 'O', prog && [prog.texto, prog.tipo]);
const papel = exV.anos.map(a => linhaV(a, /^Tempo de formação: equipe técnica/)).find(Boolean);
chk('v11 B: formação da equipe técnica como pessoas formadas × preço', papel && /pessoas? formadas? × US\$ [\d,]+ por pessoa formada = /.test(papel.texto), papel && papel.texto);
const oV = exV.origem.join(' | ');
chk('v11 B: origem com caminho da demanda, PoC + piloto e meses somados', /Caminho da demanda/.test(oV) && /prova de conceito e depois piloto/.test(oV) && /meses de uso: 6, a soma/.test(oV), exV.origem);
chk('v11 B: origem com primeira etapa da implantação (Ano 1)', /Ano 1: primeira etapa da implantação, com 50\.000 pessoas/.test(oV), exV.origem);
chk('v11 B: origem explica internet, dispositivos, formação, suporte e acompanhamento',
  /Internet \(passo 2\.4\)/.test(oV) && /Dispositivos \(passo 2\.4\)/.test(oV) && /Formação \(passo 2\.5\)/.test(oV) && /Suporte do fornecedor: usuários ativos × US\$ 5,00/.test(oV) && /Acompanhamento do uso/.test(oV), exV.origem);
const exF = run(`explicacaoCusto(CENARIOS[${JSON.stringify('A v11: duas ferramentas extras, suporte das duas equipes, formação híbrida, internet parcial com número')}])`);
const corr = exF.anos.map(a => linhaV(a, /^Licenças: Corretor de redações/)).filter(Boolean)[1];
chk('v11 A: licenças da ferramenta extra pelo nome, "licenças-mês × US$ 4,00"', corr && /licenças-mês × US\$ 4,00 por licença por mês ÷ 1,025 = /.test(corr.texto), corr && corr.texto);
chk('v11 A: ferramenta sem preço usa o preço de exemplo, dito na origem', exF.origem.some(x => /^Licenças: Banco de questões: .*preço de exemplo do guia; peça cotação/.test(x)), exF.origem);
chk('v11 A: ferramenta com preço informado, dita na origem', exF.origem.some(x => /^Licenças: Corretor de redações: .*preço informado no passo 2\.3/.test(x)), exF.origem);
chk('v11 A: internet parcial com número de escolas', exF.origem.some(x => /Escolas sem internet adequada: \d+% das escolas do escopo/.test(x)), exF.origem);
chk('v11 A: dispositivos rotativos explicados', exF.origem.some(x => /Rotativo/.test(x) && /30 dispositivos por escola/.test(x)), exF.origem);
// exemplos A–C neutros: sem internet, dispositivos, suporte do fornecedor nem licenças extras
['A', 'B', 'C'].forEach(k => {
  const nomes = run(`calcular(CENARIOS.${k}).linhas.map(l => l.nome)`);
  chk(`v11 ${k}: exemplo neutro (sem linhas novas)`, !nomes.some(n => /^Conexão das escolas|^Dispositivos a comprar|^Suporte do fornecedor|^Licenças: /.test(n)), nomes);
});

// HTML e seções do plano
const html = run(`S.formulaAno = undefined; renderFormula()`);
chk('renderFormula: título e id', html.includes('Como o custo é calculado') && html.includes('id="formula-box"'));
chk('renderFormula: abas Ano 0..3 e Saída', (html.match(/data-formula-ano="/g) || []).length === 5);
chk('renderFormula: Ano 1 selecionado por padrão', /data-formula-ano="1" aria-selected="true"/.test(html));
chk('renderFormula: nota de valores ilustrativos', html.includes('Valores ilustrativos. Mude as premissas na calculadora completa.'));
chk('renderFormula: sem alert/prompt/confirm', !/alert\(|prompt\(|confirm\(/.test(fs.readFileSync(path.join(RAIZ, 'src/formula.js'), 'utf8')));
const htmlS = run(`S.formulaAno = 'saida'; renderFormula()`);
chk('renderFormula: aba Saída selecionada por S.formulaAno', /data-formula-ano="saida" aria-selected="true"/.test(htmlS) && htmlS.includes('Custo de saída'));
const htmlX = run(`S.formulaAno = '9'; renderFormula()`);
chk('renderFormula: ano inválido volta ao Ano 1', /data-formula-ano="1" aria-selected="true"/.test(htmlX));
const css = run('CSS_FORMULA');
const tamanhos = [...css.matchAll(/font-size:\s*([\d.]+)rem/g)].map(m => +m[1]);
chk('CSS: fontes ≥ .86rem', tamanhos.every(x => x >= 0.86), tamanhos);
chk('CSS: fundo branco no bloco', /\.fx\{background:#fff/.test(css));
const secs = run(`S.formulaAno = undefined; secaoFormula()`);
chk('secaoFormula: 4 seções no formato do plano', secs.length === 4 && secs.every(s => s.sub && s.h));
chk('secaoFormula: kv com o total', secs[0].kv.some(([k, v]) => k === 'Custo total do ciclo de vida' && /US\$/.test(v)));
chk('secaoFormula: tabela Ano | Item | Cálculo | Valor', JSON.stringify(secs[1].table.head) === JSON.stringify(['Ano', 'Item', 'Cálculo', 'Valor']) && secs[1].table.rows.every(r => r.length === 4));
chk('secaoFormula: tabela com total de cada ano', ['Total do Ano 0', 'Total do Ano 1', 'Total do Ano 3', 'Custo de saída'].every(t => secs[1].table.rows.some(r => r[1] === t)));

// traduções EN, ES e FR: todo texto novo passa por tr() e tem tradução
run(`var FALTAM = new Set(); const fxT0 = fxT;
  fxT = function (s) { const o = fxT0(s); const k = normalizar(String(s)).chave, d = I18N[LANG] || {};
    if (LANG !== 'pt' && o === s && d[String(s)] == null && d[k] == null && /\\p{L}{3}/u.test(String(s)) && !/^(US\\$|R\\$|€)/.test(String(s))) FALTAM.add(k); return o; };`);
for (const l of ['en', 'es', 'fr']) {
  for (const n of nomes) {
    run(`LANG = ${JSON.stringify(l)}; S.moeda = { cod: 'USD', taxa: '' }; CFG = CENARIOS[${JSON.stringify(n)}];
      ['0','1','saida'].forEach(a => { S.formulaAno = a; renderFormula(); }); secaoFormula();`);
  }
}
const faltam = run('[...FALTAM]');
chk('traduções: nenhuma frase nova sem tradução em EN/ES/FR', faltam.length === 0, faltam.slice(0, 40));
if (process.env.FALTAM) fs.writeFileSync(process.env.FALTAM, JSON.stringify(faltam, null, 1));
run(`LANG = 'en'; CFG = CENARIOS.A; S.formulaAno = undefined;`);
const exEN = run('explicacaoCusto(CFG)');
chk('EN: licence line in English', /^144,000 license-months × US\$ 9\.00 per license per month ÷ 1\.025 = US\$ 1,264,39\d$/.test(exEN.anos[1].linhas[0].texto), exEN.anos[1].linhas[0].texto);
chk('EN: formula in English', /^Total life-cycle cost = /.test(exEN.formula.texto), exEN.formula.texto);
run(`LANG = 'pt';`);

console.log(`\n${ok} verificações ok, ${bad} falhas`);
process.exit(bad ? 1 : 0);
