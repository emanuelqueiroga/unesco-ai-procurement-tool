// =====================================================================
// Teste de regressão v015 — decomporFases (custos.js)
// Verifica que a soma das fases (piloto, implantação, expansão) é igual ao custo total.
// =====================================================================
const API = require('./../src/custos.js');

// Cria um cfg mínimo baseado no preset A
function fazerCfg(sobre) {
  const cfg = JSON.parse(JSON.stringify(API.PRESETS.A));
  cfg.opc = { H: 3 };
  if (sobre) Object.assign(cfg, sobre);
  return cfg;
}

function teste(nome, fn) {
  try { fn(); console.log('✓', nome); }
  catch (e) { console.log('✗', nome, '-', e.message); process.exitCode = 1; }
}
function assertEqual(a, b, msg) {
  if (Math.abs(a - b) > 1e-9) throw new Error(msg + ' (esperado ' + b + ', obteve ' + a + ')');
}

// Teste 1: soma das fases = total nominal (consistência interna)
teste('soma das fases = total nominal (consistência interna)', () => {
  const cfg = fazerCfg();
  const r = API.calcular(cfg);
  const av = API.avaliar(r);
  const fases = API.decomporFases(av);
  const somaFases = fases.piloto.total + fases.impl.total + fases.expansao.total;
  // total nominal = soma de todas as linhas nat='D' em todos os anos + saída
  let totalNominal = 0;
  av.linhas.forEach(l => { if (l.nat !== 'O') l.v.forEach(v => { totalNominal += v; }); });
  av.saida.forEach(s => { totalNominal += s.valor; });
  assertEqual(somaFases, totalNominal, 'soma das fases deve ser igual ao total nominal');
  console.log('  piloto=' + fases.piloto.total.toFixed(2) + ' impl=' + fases.impl.total.toFixed(2) + ' exp=' + fases.expansao.total.toFixed(2) + ' total nominal=' + totalNominal.toFixed(2));
});

// Teste 2: único + recorrente = total por fase
teste('único + recorrente = total por fase', () => {
  const cfg = fazerCfg();
  const r = API.calcular(cfg);
  const av = API.avaliar(r);
  const fases = API.decomporFases(av);
  for (const f of ['piloto', 'impl', 'expansao']) {
    const fase = fases[f];
    assertEqual(fase.unico + fase.recorrente, fase.total, f + ': único + recorrente deve ser igual a total');
  }
  console.log('  piloto: único=' + fases.piloto.unico.toFixed(2) + ' rec=' + fases.piloto.recorrente.toFixed(2));
  console.log('  impl: único=' + fases.impl.unico.toFixed(2) + ' rec=' + fases.impl.recorrente.toFixed(2));
  console.log('  exp: único=' + fases.expansao.unico.toFixed(2) + ' rec=' + fases.expansao.recorrente.toFixed(2));
});

// Teste 3: pessoas por fase são não-negativas
teste('pessoas por fase são não-negativas', () => {
  const cfg = fazerCfg();
  const r = API.calcular(cfg);
  const av = API.avaliar(r);
  const fases = API.decomporFases(av);
  for (const f of ['piloto', 'impl', 'expansao']) {
    if (fases[f].pessoas < 0) throw new Error(f + ': pessoas não pode ser negativo (' + fases[f].pessoas + ')');
  }
  console.log('  piloto=' + fases.piloto.pessoas + ' impl=' + fases.impl.pessoas + ' exp=' + fases.expansao.pessoas);
});

// Teste 4: linhas detalhadas por fase
teste('linhas detalhadas por fase', () => {
  const cfg = fazerCfg();
  const r = API.calcular(cfg);
  const av = API.avaliar(r);
  const fases = API.decomporFases(av);
  for (const f of ['piloto', 'impl', 'expansao']) {
    const fase = fases[f];
    if (!Array.isArray(fase.linhas)) throw new Error(f + ': linhas deve ser um array');
    for (const linha of fase.linhas) {
      if (typeof linha.unico !== 'number' || typeof linha.recorrente !== 'number') {
        throw new Error(f + ': linha deve ter unico e recorrente');
      }
      if (Math.abs(linha.unico + linha.recorrente - linha.total) > 1e-9) {
        throw new Error(f + ': linha ' + linha.nome + ': único + recorrente != total');
      }
    }
  }
  console.log('  piloto linhas=' + fases.piloto.linhas.length + ' impl linhas=' + fases.impl.linhas.length + ' exp linhas=' + fases.expansao.linhas.length);
});

// Teste 5: horizonte 1 (apenas piloto e implantação, sem expansão)
teste('horizonte 1 sem expansão', () => {
  const cfg = fazerCfg({ opc: { H: 1 } });
  cfg.demanda.E = [600, 12000];
  cfg.demanda.adocao = [0.70, 0.35];
  const r = API.calcular(cfg);
  const av = API.avaliar(r);
  const fases = API.decomporFases(av);
  assertEqual(fases.expansao.total, 0, 'expansão deve ser 0 com horizonte 1');
  // total nominal = piloto + impl
  let totalNominal = 0;
  av.linhas.forEach(l => { if (l.nat !== 'O') l.v.forEach(v => { totalNominal += v; }); });
  av.saida.forEach(s => { totalNominal += s.valor; });
  assertEqual(fases.piloto.total + fases.impl.total, totalNominal, 'soma piloto + impl deve ser igual ao total nominal com H=1');
  console.log('  piloto=' + fases.piloto.total.toFixed(2) + ' impl=' + fases.impl.total.toFixed(2) + ' total nominal=' + totalNominal.toFixed(2));
});

// Teste 6: clamp de horizonte (migrarCasoV10)
const casos = require('./../src/casos.js');
teste('clamp de horizonte na importação', () => {
  const casoInvalido = JSON.parse(JSON.stringify(casos.CASO_VAZIO));
  casoInvalido.horizonte = 100;
  const migrado = casos.migrarCasoV10(casoInvalido);
  if (migrado.horizonte !== 10) throw new Error('horizonte deve ser clampado a 10, obteve ' + migrado.horizonte);
  console.log('  horizonte clampado para ' + migrado.horizonte);
});

// Teste 7: campos numéricos inválidos na importação
teste('campos arrays inválidos na importação', () => {
  const casoInvalido = JSON.parse(JSON.stringify(casos.CASO_VAZIO));
  casoInvalido.prioridades = 'não é um array';
  casoInvalido.problemas = null;
  const migrado = casos.migrarCasoV10(casoInvalido);
  if (!Array.isArray(migrado.prioridades)) throw new Error('prioridades deve ser array');
  if (!Array.isArray(migrado.problemas)) throw new Error('problemas deve ser array');
  console.log('  prioridades=' + JSON.stringify(migrado.prioridades) + ' problemas=' + JSON.stringify(migrado.problemas));
});

// Teste 8: consolidação financeira por múltiplas iniciativas (consolidarIniciativas)
teste('consolidação por múltiplas iniciativas', () => {
  const iniciativas = [
    { id: 'ini-1', prioridadeId: 'com', objetivo: 'Melhorar leitura', beneficiarios: 10000, nivelModalidade: 'basico', estrategia: 'tecnologia', dim: { professores: 400, administrativos: 10, beneficiarios: 10000, horasFormacao: 20 } },
    { id: 'ini-2', prioridadeId: 'governar', objetivo: 'Governança de IA', beneficiarios: 0, nivelModalidade: 'medio', estrategia: 'governanca', dim: { professores: 0, administrativos: 5, beneficiarios: 0, horasFormacao: 10 } },
  ];
  const cfg = fazerCfg();
  const r = API.calcular(cfg);
  const av = API.avaliar(r);
  const cons = API.consolidarIniciativas(iniciativas, cfg, av);
  if (!cons.iniciativas || cons.iniciativas.length !== 2) throw new Error('deve haver 2 iniciativas');
  if (!cons.consolidacao.totalGeral) throw new Error('total geral deve ser maior que zero');
  console.log('  ini-1 total=' + cons.iniciativas[0].custos.total + ' ini-2 total=' + cons.iniciativas[1].custos.total);
  console.log('  total geral=' + cons.consolidacao.totalGeral.toFixed(2) + ' único=' + cons.consolidacao.unico.toFixed(2) + ' recorrente=' + cons.consolidacao.recorrente.toFixed(2));
});

// Teste 9: consolidação com custos informados manualmente
teste('consolidação com custos manuais', () => {
  const iniciativas = [
    { id: 'ini-1', prioridadeId: 'com', objetivo: 'Leitura', beneficiarios: 5000, nivelModalidade: 'basico', estrategia: 'tecnologia', dim: { professores: 200, administrativos: 5, beneficiarios: 5000, horasFormacao: 15 }, custos: { impl: 100000, recorrente: 50000, total: 150000, anos: [100000, 25000, 25000] } },
    { id: 'ini-2', prioridadeId: 'sobre', objetivo: 'Letramento', beneficiarios: 3000, nivelModalidade: 'medio', estrategia: 'formacao', dim: { professores: 100, administrativos: 2, beneficiarios: 3000, horasFormacao: 40 }, custos: { impl: 50000, recorrente: 30000, total: 80000, anos: [50000, 15000, 15000] } },
  ];
  const cons = API.consolidarIniciativas(iniciativas, null, null);
  if (cons.consolidacao.totalGeral !== 230000) throw new Error('total geral deve ser 230000, obteve ' + cons.consolidacao.totalGeral);
  if (cons.consolidacao.unico !== 150000) throw new Error('único deve ser 150000, obteve ' + cons.consolidacao.unico);
  if (cons.consolidacao.recorrente !== 80000) throw new Error('recorrente deve ser 80000, obteve ' + cons.consolidacao.recorrente);
  console.log('  total geral=' + cons.consolidacao.totalGeral + ' único=' + cons.consolidacao.unico + ' recorrente=' + cons.consolidacao.recorrente);
});

// Teste 10: transparência de premissas (premissasComOrigem)
teste('transparência de premissas', () => {
  const cfg = fazerCfg();
  const prem = API.premissasComOrigem(cfg);
  if (!Array.isArray(prem) || prem.length === 0) throw new Error('deve retornar premissas');
  // Cada premissa deve ter campo, valor, origem, fonte, ano, grau, faixa
  prem.forEach(p => {
    if (!p.campo) throw new Error('premissa sem campo');
    if (!p.origem) throw new Error('premissa sem origem');
    if (!p.fonte) throw new Error('premissa sem fonte');
    if (!p.ano) throw new Error('premissa sem ano');
    if (!p.grau) throw new Error('premissa sem grau');
    if (!Array.isArray(p.faixa) || p.faixa.length !== 2) throw new Error('premissa sem faixa válida');
  });
  console.log('  ' + prem.length + ' premissas com origem');
  // Verificar que pelo menos uma tem grau C (convenção da ferramenta)
  const grausC = prem.filter(p => p.grau === 'C').length;
  if (grausC === 0) throw new Error('deve haver pelo menos uma premissa grau C');
  console.log('  graus C=' + grausC + ' de ' + prem.length);
});

console.log('\nTodos os testes de regressão v015 concluídos.');