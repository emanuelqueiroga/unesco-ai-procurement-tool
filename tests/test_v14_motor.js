// Testes do motor da v14 (BL3.1, BL3.2, BL3.5, BL3.7, BL5.4): fases como dimensão, curva de adoção, reposição de dispositivos
// e rotatividade da formação, pagamento único × recorrente e indicadores do custo total.
// Uso: node tests/test_v14_motor.js
// Carrega custos.js, framework.js e casos.js como globais, como no build; a parte da fórmula usa um contexto isolado (vm).
const path = require('path');
const fs = require('fs');
const vm = require('vm');
global.LOC = () => 'pt-BR';
const RAIZ = path.join(__dirname, '..');
const src = f => path.join(RAIZ, 'src', f);
Object.assign(global, require(src('custos.js')));
Object.assign(global, require(src('framework.js')));
Object.assign(global, require(src('casos.js')));

let ok = 0, bad = 0;
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= Math.max(1e-6, Math.abs(b) * tol);
const eq = (n, a, b, tol) => { if (near(a, b, tol)) ok++; else { bad++; console.log('FALHA', n, a, b); } };
const chk = (n, c, extra) => { if (c) ok++; else { bad++; console.log('FALHA', n, extra !== undefined ? JSON.stringify(extra) : ''); } };
const igual = (n, a, b) => chk(n, JSON.stringify(a) === JSON.stringify(b), [a, b]);

const totDe = ctx => {
  const ids = Object.keys(ctx.etapas).filter(k => ctx.etapas[k].on);
  const al = id => { const e = ctx.etapas[id]; return (!e.soTotal && Array.isArray(e.anos) && e.anos.length) ? e.anos.reduce((a, b) => a + (+b || 0), 0) : +e.alunos || 0; };
  return { alunos: ids.reduce((s, id) => s + al(id), 0), escolas: ids.reduce((s, id) => s + (+ctx.etapas[id].escolas || 0), 0), etapas: ids };
};
const cfgDe = (caso, ctx) => { const ce = casoEfetivo(caso, totDe(ctx)); return cfgDoCaso(ce, perfilFinal(ce)); };
const mk = (k, muda) => cfgDe(Object.assign(clone(CASOS[k]), muda || {}), CTX_EX[k]);
const av = cfg => avaliar(calcular(cfg));
const soma = a => a.reduce((x, y) => x + y, 0);

// ------------------------------------------------------------------ (1) linear = v13, para os exemplos e o fixture da v10
const base = JSON.parse(fs.readFileSync(path.join(RAIZ, 'tests', 'fixtures', 'baseline_v13_motor.json'), 'utf8'));
const instantaneo = (cfg) => {
  const a = av(cfg), o = orcamento(cfg), ind = indicadores(cfg, a);
  return { E: cfg.demanda.E, ctEco: a.ctEco, ecoAno: a.ecoAno, finAno: a.finAno, dot: o.dot, icu: ind.icu, porK: a.porK, saida: a.saidaTotalNominal };
};
const cmpBase = (nome, atual) => {
  const b = base[nome];
  igual(nome + ': E por ano igual à v13', atual.E, b.E);
  eq(nome + ': ctEco igual à v13', atual.ctEco, b.ctEco, 1e-12);
  atual.ecoAno.forEach((v, t) => eq(nome + ': conta econômica do Ano ' + t, v, b.ecoAno[t], 1e-12));
  atual.finAno.forEach((v, t) => eq(nome + ': desembolso do Ano ' + t, v, b.finAno[t], 1e-12));
  atual.dot.forEach((v, t) => eq(nome + ': dotação do Ano ' + t, v, b.dot[t], 1e-12));
  eq(nome + ': índice de custo unitário', atual.icu, b.icu, 1e-12);
  Object.keys(b.porK).forEach(k => eq(nome + ': ' + k, atual.porK[k], b.porK[k], 1e-12));
  eq(nome + ': saída nominal', atual.saida, b.saida, 1e-12);
};
['A', 'B', 'C', 'D'].forEach(k => {
  cmpBase(k, instantaneo(mk(k)));
  // o padrão explícito (curva linear, sem reposição, rotatividade em branco) é o mesmo que não ter os campos
  cmpBase(k, instantaneo(mk(k, { curva: 'linear', reposicaoDisp: 'nao', rotacaoFormacao: '', ondas: [{ ano: 2, pct: 40 }, { ano: '', pct: '' }] })));
  [['ano2', 3], ['ano3', 3], ['ano2', 5], ['ano3', 5], ['ano1', 5]].forEach(([e, h]) => cmpBase(k + '_' + e + '_H' + h, instantaneo(mk(k, { expansao: e, horizonte: h }))));
});
{
  const fx = JSON.parse(fs.readFileSync(path.join(RAIZ, 'tests', 'fixtures', 'caso_v10_poc.json'), 'utf8'));
  const cm = migrarCasoV10(fx.caso);
  const ctx = { etapas: { fund2: { on: true, escolas: 300, soTotal: true, alunos: 60000 } } };
  ['ano1', 'ano2', 'ano3'].forEach(e => cmpBase('poc_' + e, instantaneo(cfgDe(Object.assign(clone(cm), { expansao: e }), ctx))));
}
// a trajetória linear é a fórmula da v13, escrita de novo
{
  const t = trajetoriaPessoas('linear', 100, 1000, 9000, 3, [], 6);
  igual('linear: trajetória v13', t, [100, 1000, Math.round(1000 + 8000 / 3), Math.round(1000 + 16000 / 3), 9000, 9000, 9000]);
  const c = mk('B', { expansao: 'ano3', horizonte: 5 });
  const P1 = 50000, E = 150000;
  igual('linear: caso B em três anos', c.demanda.E, [6000, P1, ...[1, 2].map(k => Math.round(P1 + (E - P1) * k / 3)), E, E]);
}

// ------------------------------------------------------------------ (2) curva em S
{
  const P1 = 10000, E = 100000;
  const lin = trajetoriaPessoas('linear', 500, P1, E, 3, [], 6), s3 = trajetoriaPessoas('s', 500, P1, E, 3, [], 6);
  igual('S: Ano 0 igual ao teste', s3[0], 500);
  chk('S: começa na primeira etapa e chega a toda a rede, como a linear', s3[1] === P1 && s3[4] === E && s3[1] === lin[1] && s3[4] === lin[4], s3);
  chk('S: depois de chegar, fica em E', s3[5] === E && s3[6] === E);
  chk('S: não decrescente', s3.every((v, i) => i < 2 || v >= s3[i - 1]), s3);
  chk('S com 3 anos: abaixo da linear no 1º passo e acima no 2º', s3[2] < lin[2] && s3[3] > lin[3], [s3, lin]);
  [1, 2].forEach(n => igual('S com ' + n + ' ano(s) de expansão coincide com a linear', trajetoriaPessoas('s', 500, P1, E, n, [], 6), trajetoriaPessoas('linear', 500, P1, E, n, [], 6)));
  // monotonia em muitos casos, inclusive com a primeira etapa igual ao total e números pequenos
  let mono = true, pontas = true;
  [[1, 1], [1, 5], [3, 4], [7, 13], [10000, 10000], [999, 1000000], [50000, 150000]].forEach(([p1, e]) => [1, 2, 3].forEach(n => {
    const tt = trajetoriaPessoas('s', 1, p1, e, n, [], 8);
    for (let i = 2; i < tt.length; i++) if (tt[i] < tt[i - 1]) mono = false;
    if (tt[1] !== p1 || tt[Math.min(n + 1, 8)] !== e) pontas = false;
  }));
  chk('S: monotônica em todas as combinações', mono); chk('S: pontas iguais às da linear em todas as combinações', pontas);
  // pelo caso: mesma demanda de partida, E por ano diferente só no meio, e custo próximo (mesmas pontas)
  const cL = mk('B', { expansao: 'ano3', horizonte: 5 }), cS = mk('B', { expansao: 'ano3', horizonte: 5, curva: 's' });
  chk('S pelo caso: Ano 0, Ano 1 e Ano 4 em diante iguais à linear', cS.demanda.E[0] === cL.demanda.E[0] && cS.demanda.E[1] === cL.demanda.E[1] && cS.demanda.E[4] === cL.demanda.E[4] && cS.demanda.E[5] === cL.demanda.E[5]);
  chk('S pelo caso: Anos 2 e 3 diferentes da linear', cS.demanda.E[2] !== cL.demanda.E[2] && cS.demanda.E[3] !== cL.demanda.E[3], [cS.demanda.E, cL.demanda.E]);
  chk('S pelo caso: custo diferente da linear', Math.abs(av(cS).ctEco - av(cL).ctEco) > 1);
  chk('S: meta da curva', cS.v11.curva === 's');
  const cS1 = mk('B', { expansao: 'ano1', horizonte: 3, curva: 's' });
  igual('S com 1 ano: demanda igual à da linear', cS1.demanda.E, mk('B').demanda.E);
}

// ------------------------------------------------------------------ (3) ondas
{
  const P1 = 50000, E = 150000;
  const c = mk('B', { horizonte: 5, curva: 'ondas', ondas: [{ ano: 2, pct: 50 }, { ano: 4, pct: 100 }, { ano: '', pct: '' }, { ano: '', pct: '' }] });
  igual('ondas: 50% no Ano 2, 100% no Ano 4', c.demanda.E, [6000, P1, 75000, 75000, E, E]);
  chk('ondas: meta guarda as ondas e os anos de expansão', c.v11.curva === 'ondas' && c.v11.ondas.length === 2 && c.v11.anosExpansao === 3, c.v11);
  // linhas fora de ordem, repetidas, inválidas e do Ano 1 (que é sempre a primeira etapa)
  const t = trajetoriaPessoas('ondas', 10, 20, 1000, 1, [{ ano: 4, pct: 100 }, { ano: 1, pct: 90 }, { ano: 2, pct: 30 }, { ano: 'x', pct: 50 }, { ano: 3, pct: 0 }, { ano: 3, pct: 200 }, { ano: 2, pct: '' }], 6);
  igual('ondas: ignora Ano 1 e linhas inválidas; % acima de 100 vale 100', t, [10, 20, 300, 1000, 1000, 1000, 1000]);
  // o % nunca diminui e nunca fica abaixo da etapa anterior
  igual('ondas: não diminui', trajetoriaPessoas('ondas', 10, 600, 1000, 1, [{ ano: 2, pct: 80 }, { ano: 3, pct: 40 }], 4), [10, 600, 800, 800, 800]);
  igual('ondas: abaixo da primeira etapa, fica na primeira etapa', trajetoriaPessoas('ondas', 10, 600, 1000, 1, [{ ano: 2, pct: 30 }], 3), [10, 600, 600, 600]);
  igual('ondas: última onda abaixo de 100% fica no patamar', trajetoriaPessoas('ondas', 10, 100, 1000, 1, [{ ano: 2, pct: 70 }], 5), [10, 100, 700, 700, 700, 700]);
  igual('ondas: sem linhas válidas, vale a linear', trajetoriaPessoas('ondas', 10, 100, 1000, 2, [{ ano: '', pct: '' }], 4), trajetoriaPessoas('linear', 10, 100, 1000, 2, [], 4));
  chk('ondas: ondasValidas ordena por ano', ondasValidas([{ ano: 5, pct: 10 }, { ano: 3, pct: 20 }])[0].ano === 3);
  const c0 = mk('B', { horizonte: 5, curva: 'ondas', ondas: [{ ano: '', pct: '' }] });
  igual('ondas vazias: demanda da linear', c0.demanda.E, mk('B', { horizonte: 5 }).demanda.E);
  chk('ondas vazias: meta volta a linear', c0.v11.curva === 'linear');
  // as ondas alimentam o motor: custo = o das mesmas pessoas por ano informadas à mão
  const man = clone(c); const aOnda = av(c), aMan = av(man);
  eq('ondas: custo igual ao da demanda copiada', aOnda.ctEco, aMan.ctEco);
  chk('ondas: 4 linhas válidas', trajetoriaPessoas('ondas', 1, 10, 1000, 1, [{ ano: 2, pct: 20 }, { ano: 3, pct: 40 }, { ano: 4, pct: 60 }, { ano: 5, pct: 100 }], 6).join() === '1,10,200,400,600,1000,1000');
}

// ------------------------------------------------------------------ (4) fases e (6) único × recorrente: somas
const CENAS = {};
['A', 'B', 'C', 'D'].forEach(k => { CENAS[k] = mk(k); CENAS[k + ' 5 anos, 3 de expansão'] = mk(k, { expansao: 'ano3', horizonte: 5 }); });
['A', 'B', 'C'].forEach(k => { CENAS['preset ' + k] = clone(PRESETS[k]); });
CENAS['B em S, 5 anos'] = mk('B', { expansao: 'ano3', horizonte: 5, curva: 's' });
CENAS['B ondas'] = mk('B', { horizonte: 5, curva: 'ondas', ondas: [{ ano: 3, pct: 60 }, { ano: 5, pct: 100 }] });
CENAS['A desconto 3%'] = (() => { const c = mk('A', { horizonte: 5 }); c.opc = Object.assign({}, c.opc, { r: 0.03 }); return c; })();
CENAS['B saída 50% e desconto 5%'] = (() => { const c = mk('B'); c.opc = Object.assign({}, c.opc, { pSaida: 0.5, r: 0.05 }); return c; })();
CENAS['D continuidade'] = (() => { const c = mk('D'); c.opc = Object.assign({}, c.opc, { fechamento: 'continuidade' }); return c; })();
CENAS['C compatibilidade v1'] = (() => { const c = mk('C'); c.opc = Object.assign({}, OPC_COMPAT, { H: 3 }); return c; })();
CENAS['A pessoal a 80% e itens prováveis'] = (() => { const c = mk('A'); c.opc = Object.assign({}, c.opc, { sigmaCap: 0.8 }); c.itens[0].prob = 0.5; return c; })();
CENAS['B tecnologia pública, 5 anos'] = mk('B', { tipoTec: 'publica', horizonte: 5 });
CENAS['A formação paga pelo fornecedor, dispositivos, reposição a cada 3 anos'] = mk('A', { expansao: 'ano3', horizonte: 5, formacaoPaga: 'fornecedor', dispExistem: 'nao', modeloDisp: 'por_professor', reposicaoDisp: '3', formados: ['professores', 'gestores', 'tecnica'] });
CENAS['B reposição a cada 4 anos, rotatividade 15%'] = mk('B', { expansao: 'ano2', horizonte: 5, dispExistem: 'nao', reposicaoDisp: '4', rotacaoFormacao: 15 });
CENAS['D PoC + piloto, 2 anos'] = mk('D', { testes: ['poc', 'piloto'], poc: { participantes: 15, meses: 2 }, expansao: 'ano2', horizonte: 5 });
const IDS = ['piloto', 'implantacao', 'expansao'];
Object.keys(CENAS).forEach(nome => {
  const cfg = CENAS[nome], a = av(cfg), F = a.fases, r = a.r, H = r.H;
  // as fases de cada ano
  igual(nome + ': fase de cada ano', r.fases, r.anos.map(t => t === 0 ? 'piloto' : t === 1 ? 'implantacao' : 'expansao'));
  igual(nome + ': faseAno do resultado', F.faseAno, r.fases);
  igual(nome + ': anos por fase', IDS.map(id => F.porFase[id].anos), [[0], [1], r.anos.filter(t => t >= 2)]);
  // as fases somam o total
  eq(nome + ': Σ fases = ctEco', IDS.reduce((s, id) => s + F.porFase[id].total, 0), a.ctEco);
  eq(nome + ': total das fases = ctEco', F.total, a.ctEco);
  const sc = somaPorCamada(a);
  for (let i = 1; i <= 7; i++) {
    eq(nome + ': camada ' + i + ' somada nas fases = somaPorCamada', IDS.reduce((s, id) => s + F.porFase[id].porCamada[i], 0), sc.total[i]);
  }
  Object.keys(a.porK).forEach(k => eq(nome + ': componente ' + k + ' somado nas fases', IDS.reduce((s, id) => s + F.porFase[id].porK[k], 0), a.porK[k]));
  IDS.forEach(id => {
    const p = F.porFase[id];
    eq(nome + ': ' + id + ': camadas somam a fase', soma(Object.values(p.porCamada)), p.total);
    eq(nome + ': ' + id + ': componentes somam a fase', soma(Object.values(p.porK)), p.total);
    // (6) único + recorrente = total
    eq(nome + ': ' + id + ': único + recorrente = total da fase', p.unico + p.recorrente, p.total);
    // com o fechamento "continuidade" o valor residual (negativo) abate o pagamento único da última fase
    chk(nome + ': ' + id + ': partes não negativas', (cfg.opc && cfg.opc.fechamento === 'continuidade' && id === IDS[a.r.fases[H] === 'piloto' ? 0 : a.r.fases[H] === 'implantacao' ? 1 : 2] ? true : p.unico > -1e-6) && p.recorrente > -1e-6, [p.unico, p.recorrente]);
  });
  eq(nome + ': único + recorrente = ctEco', F.unico + F.recorrente, a.ctEco);
  F.unicoAno.forEach((u, t) => eq(nome + ': Ano ' + t + ': único + recorrente = custo do ano', u + F.recorrenteAno[t], t === H ? a.ecoAno[t] + a.saida.reduce((s, x) => s + x.eco, 0) - (a.vr ? a.vr / a.disc[H] : 0) : a.ecoAno[t]));
  // o nominal é a conta econômica em preços correntes e sem desconto
  eq(nome + ': nominal das fases = indicador', a.tco.tcoNominal, F.nominal);
  const nom = a.linhas.reduce((s, l) => s + soma(r.anos.map(t => l.eco[t] * a.defl[t])), 0) + a.saida.reduce((s, x) => s + x.eco * a.defl[H], 0) - (a.vr ? a.vr / a.disc[H] * a.defl[H] : 0);
  eq(nome + ': nominal = soma das linhas em preços correntes', a.tco.tcoNominal, nom);
  // pessoas por fase
  eq(nome + ': pessoas do piloto = E do Ano 0', F.porFase.piloto.pessoas, r.E[0]);
  eq(nome + ': pessoas da implantação = E do Ano 1', F.porFase.implantacao.pessoas, r.E[1]);
  eq(nome + ': pessoas da expansão = máx. de E', F.porFase.expansao.pessoas, Math.max(0, ...r.E.slice(2)));
  eq(nome + ': pessoas-ano somam', IDS.reduce((s, id) => s + F.porFase[id].anosPessoa, 0), soma(r.E));
  // o indicador também sai do indicadores()
  const ind = indicadores(cfg, a);
  chk(nome + ': indicadores() expõe tco e fases', ind.tco === a.tco && ind.fases === a.fases);
});

// regras do único × recorrente, linha a linha
{
  const a = av(CENAS['A formação paga pelo fornecedor, dispositivos, reposição a cada 3 anos']);
  const H = a.r.H, un = (l, t) => l.vu[t], porTag = tag => a.linhas.filter(l => l.tag === tag);
  porTag('implantacao').forEach(l => eq('implantação é única: ' + l.nome, soma(l.vu), soma(l.v)));
  porTag('manutencao').forEach(l => eq('manutenção é recorrente: ' + l.nome, soma(l.vu), 0));
  porTag('licenca').forEach(l => eq('licença é recorrente', soma(l.vu), 0));
  porTag('dispositivo').forEach(l => eq('compra de dispositivos é única', soma(l.vu), soma(l.v)));
  porTag('reposicao_dispositivo').forEach(l => eq('reposição de dispositivos é recorrente', soma(l.vu), 0));
  a.linhas.filter(l => /^K3\./.test(l.s)).forEach(l => eq('K3 é único: ' + l.nome, soma(l.vu), soma(l.v)));
  a.linhas.filter(l => /^K(1\.1|1\.3|2\.|4\.1|4\.2|5\.|6\.[12])/.test(l.s)).forEach(l => eq('operação, governança e manutenção são recorrentes: ' + l.s + ' ' + l.nome, soma(l.vu), 0));
  // formação: só as pessoas novas na rede são formação inicial
  const k44 = a.linhas.find(l => l.s === 'K4.4' && l.q && !l.tag);
  eq('formação do Ano 0: tudo é inicial', k44.vu[0], k44.v[0]);
  chk('formação: a parte inicial nunca passa do total do ano', k44.v.every((v, t) => k44.vu[t] <= v + 1e-9));
  const U = a.r.U;
  [1, 2, 3, 4, 5].forEach(t => eq('formação do Ano ' + t + ': inicial = aumento dos usuários ativos × custo', k44.vu[t], Math.max(U[t] - U[t - 1], 0) * (k44.v[t] / k44.q[t]), 1e-9));
  chk('formação: há reposição (recorrente) a partir do Ano 1', k44.v[2] - k44.vu[2] > 0);
}

// ------------------------------------------------------------------ (5) EAC
{
  const c0 = mk('A', { horizonte: 5 }), a0 = av(c0);
  eq('CAE com r = 0: VP ÷ n', a0.tco.cae, a0.ctEco / 6);
  chk('CAE: n = H + 1', a0.tco.n === 6);
  [0.03, 0.08].forEach(r => {
    const c = mk('A', { horizonte: 5 }); c.opc = Object.assign({}, c.opc, { r });
    const a = av(c), n = a.r.H + 1;
    eq('CAE com r = ' + r + ': VP·r/(1−(1+r)^−n)', a.tco.cae, a.ctEco * r / (1 - Math.pow(1 + r, -n)));
    // o CAE, descontado em n anos postecipados, devolve o VP
    let vp = 0; for (let t = 1; t <= n; t++) vp += a.tco.cae / Math.pow(1 + r, t);
    eq('CAE com r = ' + r + ': anuidade descontada = VP', vp, a.ctEco, 1e-9);
    eq('CAE: igual a cae() do motor', a.tco.cae, cae(a.ctEco, r, n));
    chk('TCO descontado menor que o nominal', a.tco.tcoDescontado < a.tco.tcoNominal);
    eq('TCO descontado = ctEco', a.tco.tcoDescontado, a.ctEco);
  });
  // r = 0 e correções ligadas: nominal = custo reinflado, descontado = preços constantes
  chk('TCO nominal maior que o descontado com inflação e r = 0', a0.tco.tcoNominal > a0.tco.tcoDescontado);
  const cc = mk('A', { horizonte: 5 }); cc.opc = Object.assign({}, cc.opc, { correcoes: false, pi: 0 });
  const ac = av(cc); eq('sem inflação e r = 0: nominal = descontado', ac.tco.tcoNominal, ac.tco.tcoDescontado);
}

// ------------------------------------------------------------------ (5) custo por aprendiz e por professor, parte recorrente
{
  const c = mk('B'), a = av(c), E = a.r.E;
  const aprend = soma(E), prof = soma(E) / RAZAO_EST_PROF;
  eq('B: aprendizes-ano = Σ E (estudantes usam)', a.tco.anosAprendiz, aprend);
  eq('B: professores-ano = Σ E ÷ 25', a.tco.anosProfessor, prof);
  eq('B: custo por aprendiz por ano = custo total ÷ aprendizes-ano', a.tco.custoPorAprendizAno, a.ctEco / aprend);
  eq('B: custo por professor por ano = custo total ÷ professores-ano', a.tco.custoPorProfessorAno, a.ctEco / prof);
  eq('B: parte recorrente = recorrente ÷ total', a.tco.pRecorrente, a.fases.recorrente / a.ctEco);
  chk('B: parte recorrente entre 0 e 1', a.tco.pRecorrente > 0 && a.tco.pRecorrente < 1);
  // sem estudantes usando (A: professores): sem custo por aprendiz; professores = os usuários
  const aA = av(mk('A'));
  chk('A: sem custo por aprendiz (estudantes não usam)', aA.tco.custoPorAprendizAno === null && aA.tco.anosAprendiz === 0);
  eq('A: custo por professor por ano = custo total ÷ Σ E', aA.tco.custoPorProfessorAno, aA.ctEco / soma(aA.r.E));
  // com desconto: custo nivelado (o denominador é descontado com o mesmo fator)
  const cd = mk('B'); cd.opc = Object.assign({}, cd.opc, { r: 0.05 });
  const ad = av(cd);
  eq('B com r = 5%: custo por aprendiz nivelado', ad.tco.custoPorAprendizAno, ad.ctEco / soma(ad.r.E.map((e, t) => e * Math.pow(1.05, -t))));
  // presets: a unidade da configuração decide o papel
  eq('preset C (estudantes): custo por aprendiz', av(PRESETS.C).tco.custoPorAprendizAno, av(PRESETS.C).ctEco / soma(av(PRESETS.C).r.E));
  chk('preset B (servidores): sem custo por aprendiz nem por professor', av(PRESETS.B).tco.custoPorAprendizAno === null && av(PRESETS.B).tco.custoPorProfessorAno === null);
  // a etapa e os papéis vêm do caso: D (servidores administrativos e gestores) não tem professores
  const aD = av(mk('D')); chk('D: sem professores', aD.tco.custoPorProfessorAno === null);
  const aDP = av(mk('D', { usuarios: ['professores', 'gestores'] }));
  eq('professores e gestores: metade das pessoas são professores', aDP.tco.anosProfessor, soma(aDP.r.E) / 2);
}

// ------------------------------------------------------------------ (5) custo anual em regime e financiamento externo
{
  const a1 = av(mk('B'));
  chk('regime: primeiro ano da Expansão em escala plena (linear em 1 ano: Ano 2)', a1.tco.anual.ano === 2 && a1.tco.anual.fase === 'expansao' && a1.tco.anual.rotulo === 'primeiro_ano_em_escala_plena', a1.tco.anual);
  eq('regime: custo econômico do ano', a1.tco.anual.eco, a1.ecoAno[2]);
  eq('regime: custo nominal do ano', a1.tco.anual.nominal, a1.ecoAno[2] * a1.defl[2]);
  eq('regime: desembolso do ano', a1.tco.anual.desembolso, a1.finAno[2]);
  eq('regime: único + recorrente = custo do ano', a1.tco.anual.unico + a1.tco.anual.recorrente, a1.tco.anual.eco);
  const a3 = av(mk('B', { expansao: 'ano3', horizonte: 5 }));
  chk('regime: expansão em 3 anos chega à escala plena no Ano 4', a3.tco.anual.ano === 4 && a3.tco.anual.escalaPlenaNoHorizonte === true, a3.tco.anual);
  const a3c = av(mk('B', { expansao: 'ano3', horizonte: 3 }));
  chk('regime: horizonte de 3 anos com expansão em 3: sem escala plena, usa o Ano 3 e avisa', a3c.tco.anual.ano === 3 && a3c.tco.anual.escalaPlenaNoHorizonte === false && a3c.tco.anual.rotulo === 'ultimo_ano_do_horizonte', a3c.tco.anual);
  // uso cedido (financiamento externo): até o Ano 2, em 5 anos → vale o Ano 3 e o rótulo diz isso
  const cf = mk('B', { horizonte: 5 }); cf.cedidoUso = [1, 1, 1, 0, 0, 0];
  const af = av(cf);
  chk('financiamento acaba no Ano 2: o regime é o Ano 3, rotulado', af.tco.anual.ano === 3 && af.tco.anual.rotulo === 'depois_do_financiamento' && af.tco.anual.financiamentoExterno.encerraEm === 2, af.tco.anual);
  const cAte5 = mk('B', { horizonte: 5 }); cAte5.cedidoUso = [1, 1, 1, 1, 1, 1];
  chk('financiamento acaba no Ano 2: o desembolso do Ano 3 já inclui o que antes era cedido', af.tco.anual.desembolso > av(cAte5).finAno[3] + 1, [af.tco.anual.desembolso, av(cAte5).finAno[3]]);
  eq('financiamento acaba no Ano 2: o custo econômico do Ano 3 não muda (o cedido entra a valor de mercado)', af.tco.anual.eco, av(cAte5).ecoAno[3], 1e-9);
  // cedido até o fim do horizonte: o ano é o de escala plena, com aviso
  const ap = av(mk('B', { tipoTec: 'publica', horizonte: 5 }));
  chk('financiamento até o fim do horizonte: rótulo de aviso', ap.tco.anual.rotulo === 'financiamento_ate_o_fim' && ap.tco.anual.ano === 2 && ap.tco.anual.financiamentoExterno.encerraEm === null, ap.tco.anual);
  // piloto gratuito (só o Ano 0) não muda o ano nem o rótulo
  const ag = av(mk('D', { pagamento: 'gratuito' }));
  chk('teste gratuito (só o Ano 0): rótulo padrão', ag.tco.anual.rotulo === 'primeiro_ano_em_escala_plena' && ag.tco.anual.financiamentoExterno === null, ag.tco.anual);
  // sem os doados na conta (opc.doados = false) o aviso vem da configuração
  const cn = mk('B', { horizonte: 5 }); cn.cedidoUso = [1, 1, 1, 0, 0, 0]; cn.opc = Object.assign({}, cn.opc, { doados: false });
  chk('sem doados na conta: financiamento lido da configuração', av(cn).tco.anual.rotulo === 'depois_do_financiamento' && av(cn).tco.anual.ano === 3);
}

// ------------------------------------------------------------------ (7) reposição de dispositivos (BL3.5)
{
  const muda = { expansao: 'ano3', horizonte: 5, dispExistem: 'nao', modeloDisp: 'um_por_aluno', formados: ['professores'] };
  const c0 = mk('B', muda);
  const a0 = av(c0);
  const dev = a0.linhas.find(l => l.tag === 'dispositivo');
  chk('reposição desligada: sem linha de reposição, como na v13', !a0.linhas.some(l => l.tag === 'reposicao_dispositivo') && !c0.reposicao && c0.v11.dispositivos.ciclo === 0);
  const q0 = dev.q;
  chk('sem reposição: há compras nos Anos 0 a 4', q0.slice(0, 5).every(n => n > 0) && q0[5] === 0, q0);
  [3, 4, 5].forEach(n => {
    const c = mk('B', Object.assign({}, muda, { reposicaoDisp: String(n) })), a = av(c);
    chk('ciclo ' + n + ': configuração', c.reposicao && c.reposicao.ciclo === n && c.v11.dispositivos.ciclo === n);
    const rep = a.linhas.find(l => l.tag === 'reposicao_dispositivo');
    const esperado = a.r.anos.map(t => { let s = 0; for (let k = t - n; k >= 0; k -= n) s += q0[k]; return s; });
    if (esperado.some(x => x > 0)) {
      igual('ciclo ' + n + ': quantidades repostas por ano', rep.q, esperado);
      a.r.anos.forEach(t => {
        // a reposição só existe nos anos em que algum lote completa o ciclo, ao preço unitário do ano (inflação de itens locais)
        eq('ciclo ' + n + ': valor do Ano ' + t, rep.v[t], esperado[t] * 300 * a.r.infl[t]);
        chk('ciclo ' + n + ': Ano ' + t + (esperado[t] > 0 ? ' repõe' : ' não repõe'), (rep.v[t] > 0) === (t >= n && esperado[t] > 0));
      });
      eq('ciclo ' + n + ': reposição é recorrente', soma(rep.vu), 0);
      chk('ciclo ' + n + ': reposição é capital no orçamento', rep.orc === 'capital' && rep.s === 'K1.2');
      eq('ciclo ' + n + ': o custo sobe exatamente a reposição', a.ctEco - a0.ctEco, rep.ecoVP);
      eq('ciclo ' + n + ': as compras iniciais não mudam', a.linhas.find(l => l.tag === 'dispositivo').ecoVP, dev.ecoVP);
    } else chk('ciclo ' + n + ': sem reposição dentro do horizonte de 5 anos', !a.linhas.some(l => l.tag === 'reposicao_dispositivo') && Math.abs(a.ctEco - a0.ctEco) < 1e-6);
  });
  // ciclo 3, lotes dos Anos 0 a 4: reposição nos Anos 3, 4 e 5 (lotes dos Anos 0, 1 e 2)
  const a3 = av(mk('B', Object.assign({}, muda, { reposicaoDisp: '3' })));
  const r3 = a3.linhas.find(l => l.tag === 'reposicao_dispositivo');
  igual('ciclo 3: reposição só nos Anos 3 a 5', r3.q.map(n => n > 0), [false, false, false, true, true, true]);
  igual('ciclo 3: Ano 3 repõe o lote do Ano 0, Ano 4 o do 1, Ano 5 o do 2', r3.q.slice(3), [q0[0], q0[1], q0[2]]);
  // ciclo maior que o horizonte: nada
  const aH = av(mk('B', { dispExistem: 'nao', modeloDisp: 'um_por_aluno', reposicaoDisp: '5' }));
  chk('ciclo 5 com horizonte de 3 anos: sem reposição', !aH.linhas.some(l => l.tag === 'reposicao_dispositivo'));
  // 4 anos com lote do Ano 0 apenas (dispositivos próprios nos demais): a reposição do Ano 4 é só desse lote
  // sem compra, sem reposição
  const aN = av(mk('B', { dispExistem: 'sim', reposicaoDisp: '3', horizonte: 5 }));
  chk('dispositivos já existem: nada a repor', !aN.linhas.some(l => l.tag === 'reposicao_dispositivo'));
  // a reposição aparece no recorrente das fases e as somas continuam fechando
  eq('ciclo 3: Σ fases = ctEco', a3.fases.total, a3.ctEco);
  chk('ciclo 3: recorrente maior que sem reposição', a3.fases.recorrente > a0.fases.recorrente);
  eq('ciclo 3: único igual ao sem reposição', a3.fases.unico, a0.fases.unico, 1e-12);
}

// ------------------------------------------------------------------ (8) rotatividade da formação (BL3.5)
{
  const k44 = (cfg, nome) => { const a = av(cfg); return a.linhas.filter(l => l.s === 'K4.4').reduce((s, l) => s + l.ecoVP, 0); };
  // em branco ou igual ao padrão da v13 (10%): mesmos números (modo "ativos": exemplo A e D)
  ['A', 'D'].forEach(k => {
    const b = k44(mk(k, { horizonte: 5 })), x10 = k44(mk(k, { horizonte: 5, rotacaoFormacao: 10 }));
    eq(k + ': rotatividade 10% = padrão da v13', x10, b);
    const x5 = k44(mk(k, { horizonte: 5, rotacaoFormacao: 5 })), x25 = k44(mk(k, { horizonte: 5, rotacaoFormacao: 25 })), x0 = k44(mk(k, { horizonte: 5, rotacaoFormacao: 0 }));
    chk(k + ': mais rotatividade, mais custo de formação', x0 < x5 && x5 < b && b < x25, [x0, x5, b, x25]);
    const c = mk(k, { horizonte: 5, rotacaoFormacao: 25 });
    chk(k + ': rotatividade informada chega ao motor e ao meta', Math.abs(c.formacaoTempo.rot - 0.25) < 1e-12 && c.v11.formacao.rotacao === 0.25 && c.v11.formacao.rotacaoInformada === true, c.v11.formacao);
    chk(k + ': rotatividade em branco: meta com o padrão', mk(k).v11.formacao.rotacao === 0.10 && mk(k).v11.formacao.rotacaoInformada === false);
  });
  // com outros papéis formados (gestores, equipe técnica), a mesma rotatividade vale para eles
  const ex = (rot) => { const c = mk('D', { horizonte: 5, formados: ['administrativo', 'gestores', 'tecnica'], rotacaoFormacao: rot }); return k44(c); };
  chk('papéis extras: mais rotatividade, mais custo', ex(0) < ex(10) && ex(10) < ex(30), [ex(0), ex(10), ex(30)]);
  // modo razão (estudantes usam, professores formados): em branco = v13; informada = novas + rotatividade × estoque
  const rB = mk('B', { horizonte: 5 });
  eq('B: modo razão em branco = v13', k44(rB), k44(mk('B', { horizonte: 5, rotacaoFormacao: '' })));
  const b0 = k44(mk('B', { horizonte: 5, rotacaoFormacao: 0 })), b10 = k44(mk('B', { horizonte: 5, rotacaoFormacao: 10 })), b30 = k44(mk('B', { horizonte: 5, rotacaoFormacao: 30 }));
  chk('B: rotatividade informada no modo razão: mais rotatividade, mais custo', b0 < b10 && b10 < b30, [b0, b10, b30]);
  const aB = av(mk('B', { horizonte: 5, rotacaoFormacao: 10 })), lB = aB.linhas.find(l => l.s === 'K4.4' && !l.tag);
  const S = aB.r.E.map(e => e / mk('B').formacaoTempo.razao);
  lB.q.forEach((n, t) => eq('B: professores formados no Ano ' + t, n, t === 0 ? S[0] : Math.max(S[t] - S[t - 1], 0) + 0.10 * S[t - 1]));
  chk('B: meta da rotatividade informada', mk('B', { rotacaoFormacao: 10 }).formacaoTempo.rotEstoque === 0.1);
  chk('B: sem rotatividade informada, sem rotEstoque', mk('B').formacaoTempo.rotEstoque === undefined);
  // fora do intervalo: limitada a 0–100%
  eq('rotatividade acima de 100% vale 100%', mk('D', { rotacaoFormacao: 250 }).formacaoTempo.rot, 1);
}

// ------------------------------------------------------------------ (9) o resto do motor segue funcionando
{
  const c = mk('B', { horizonte: 5, curva: 's', reposicaoDisp: '3', dispExistem: 'nao', rotacaoFormacao: 12 });
  const s = simular(c, 30);
  chk('Monte Carlo com as opções novas', s.N === 30 && s.ct.p50 > 0 && s.dot.length === 6);
  const cs = cenarios(c);
  chk('cenários com as opções novas', Object.keys(cs).length === 3);
  const t = tornado(c); chk('tornado com as opções novas', t.rows.length > 0 && t.base > 0);
  const aAlta = av(cfgAltaAdocao(c)); eq('cenário de alta adoção: fases somam', aAlta.fases.total, aAlta.ctEco);
  const aEst = av(cfgEstresse(c)); eq('cenário de estresse: fases somam', aEst.fases.total, aEst.ctEco);
  // fasesAno substitui a regra
  const cc = clone(PRESETS.A); cc.fasesAno = ['piloto', 'implantacao', 'implantacao', 'expansao'];
  const aa = av(cc); igual('fasesAno substitui a regra', aa.r.fases, cc.fasesAno); eq('fasesAno: fases somam', aa.fases.total, aa.ctEco);
  // presets (sem caso): demanda por unidade
  chk('preset sem caso: fases e indicadores existem', av(PRESETS.A).tco.anual.ano >= 1 && av(PRESETS.A).fases.ids.length === 3);
}

// ------------------------------------------------------------------ (10) texto da fórmula e do percurso
{
  const json = f => JSON.parse(fs.readFileSync(path.join(RAIZ, f), 'utf8'));
  const ler = f => fs.readFileSync(path.join(RAIZ, f), 'utf8').replace(/^if \(typeof module/gm, 'if (false && typeof module');
  const dic = l => {
    const d = {};
    const arqs = [`i18n/${l}.json`, `i18n/extra_${l}.json`]
      .concat(['v9', 'v10', 'v11', 'v12', 'v13', 'v14'].flatMap(p => fs.readdirSync(path.join(RAIZ, 'i18n')).filter(f => f.startsWith(p + '_') && f.endsWith(`_${l}.json`)).sort().map(f => 'i18n/' + f)));
    arqs.forEach(f => { if (fs.existsSync(path.join(RAIZ, f))) Object.assign(d, json(f)); });
    return d;
  };
  const I18N = { en: dic('en'), es: dic('es'), fr: dic('fr') };
  const ctx = vm.createContext({ console, Intl, Math, JSON, Number, String, Array, Object, Set, Map, Date, isFinite, isNaN, parseFloat });
  vm.runInContext(`const I18N = ${JSON.stringify(I18N)}; const MOEDAS = { taxas: { USD: 1, BRL: 5.4, EUR: 0.92 } }; const REFERENCIAS = ${JSON.stringify(json('data/referencias.json'))};
    var S = { moeda: { cod: 'USD', taxa: '' } }; var CFG = null; function cfgAtual() { return CFG; }
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));`, ctx);
  ['src/i18n.js', 'src/custos.js', 'src/framework.js', 'src/casos.js', 'src/custos_ui.js', 'src/fluxo_dados.js', 'src/formula.js'].forEach(f => vm.runInContext(ler(f), ctx, { filename: f }));
  const run = code => vm.runInContext(code, ctx);
  run(`function totDe(x) { const ids = Object.keys(x.etapas).filter(k => x.etapas[k].on); const al = id => { const e = x.etapas[id]; return (!e.soTotal && Array.isArray(e.anos) && e.anos.length) ? e.anos.reduce((a, b) => a + (+b || 0), 0) : +e.alunos || 0; };
    return { alunos: ids.reduce((s, id) => s + al(id), 0), escolas: ids.reduce((s, id) => s + (+x.etapas[id].escolas || 0), 0), etapas: ids }; }
    function cfgEx(k, muda) { const c = Object.assign(clone(CASOS[k]), muda || {}); const ce = casoEfetivo(c, totDe(CTX_EX[k])); return cfgDoCaso(ce, perfilFinal(ce)); }`);
  const textoOrigem = (k, muda, lang) => run(`LANG = ${JSON.stringify(lang || 'pt')}; CFG = cfgEx(${JSON.stringify(k)}, ${JSON.stringify(muda)}); explicacaoCusto(CFG).origem.join(' | ')`);
  const L3 = { expansao: 'ano3', horizonte: 5 };
  chk('fórmula, linear: texto da v13', /Depois, o uso cresce em partes iguais até 150\.000 pessoas no Ano 4\./.test(textoOrigem('B', L3)), textoOrigem('B', L3));
  chk('fórmula, em S: descreve a curva', /curva em S .* até 150\.000 pessoas no Ano 4\./.test(textoOrigem('B', Object.assign({ curva: 's' }, L3))), textoOrigem('B', Object.assign({ curva: 's' }, L3)));
  chk('fórmula, em S além do horizonte', /curva em S e chegaria a 150\.000 pessoas no Ano 4, depois do horizonte/.test(textoOrigem('B', { expansao: 'ano3', horizonte: 3, curva: 's' })));
  const to = textoOrigem('B', { horizonte: 5, curva: 'ondas', ondas: [{ ano: 2, pct: 50 }, { ano: 4, pct: 100 }] });
  chk('fórmula, ondas: lista as ondas', /em ondas, segundo o passo 4\.1\.5: Ano 2: 50% das pessoas que usariam; Ano 4: 100% das pessoas que usariam\./.test(to), to);
  const tr_ = textoOrigem('A', { dispExistem: 'nao', modeloDisp: 'por_professor', reposicaoDisp: '4', horizonte: 5 });
  chk('fórmula: reposição de dispositivos', /Reposição dos dispositivos \(passo 4\.1\.6\): cada lote comprado é comprado de novo a cada 4 anos/.test(tr_), tr_);
  const tx = textoOrigem('B', { rotacaoFormacao: 10 });
  chk('sem NaN nem undefined nos textos novos', ![to, tr_, tx].some(t => /NaN|undefined|Infinity/.test(t)));
  // as linhas da conta com reposição continuam sendo contas exatas
  ['pt', 'en'].forEach(lang => {
    const ex = run(`LANG = ${JSON.stringify(lang)}; CFG = cfgEx('A', { expansao: 'ano3', horizonte: 5, dispExistem: 'nao', modeloDisp: 'por_professor', reposicaoDisp: '3' }); JSON.parse(JSON.stringify(explicacaoCusto(CFG)))`);
    const linhas = [].concat(...ex.anos.map(a => a.linhas.concat(a.outros ? a.outros.itens : [])));
    const rep = linhas.filter(x => /^(Reposição de dispositivos|Device replacement)/.test(x.nome));
    chk('fórmula [' + lang + ']: linha de reposição presente', rep.length > 0, linhas.map(x => x.nome));
    rep.forEach(x => chk('fórmula [' + lang + ']: reposição escrita como conta', x.texto.includes('×') && x.texto.includes('=') && !/NaN/.test(x.texto), x.texto));
  });
  // textos novos do percurso e da estimativa com tradução em inglês, espanhol e francês
  const novos = run(`CAMPOS.filter(f => ['curva', 'ondas', 'reposicaoDisp', 'rotacaoFormacao'].includes(f.id)).map(f => ({ id: f.id, n: f.n, t: f.t, h: f.h || '', ex: f.ex || '', se: !!f.se, tipo: f.tipo, opc: f.opc ? OPC[f.opc] : null }))`);
  chk('4 perguntas novas no passo 4.1 (4.1.4 a 4.1.7)', novos.map(f => f.n).join() === '4.1.4,4.1.5,4.1.6,4.1.7', novos.map(f => f.n));
  ['en', 'es', 'fr'].forEach(l => {
    const falta = [];
    const precisa = s => { if (s && !(I18N[l][s] != null)) falta.push(s); };
    novos.forEach(f => { precisa(f.t); precisa(f.h); precisa(f.ex); (f.opc || []).forEach(o => { precisa(o[1]); precisa(o[2]); }); });
    [ 'Custo por fase', 'Fase', 'Pagamento único', 'Recorrente', 'Pessoas alcançadas', 'Indicadores do custo total', 'Custo anual equivalente', 'Por estudante por ano', 'Por professor por ano',
      'Custo total nominal (preços correntes, sem desconto)', 'Parte do custo total que é recorrente', 'Custo total, descontado', 'Onda', '% acumulado da rede',
      'O pagamento único reúne a implantação, a integração, a formação inicial e a compra de dispositivos. O recorrente reúne licenças, conectividade, operação, suporte, reciclagem da formação e reposição.',
      'Desembolso da rede nesse ano, em preços correntes:', 'Custo anual em regime (Ano {0}, primeiro ano da Expansão com toda a rede)',
      'Custo anual no último ano do horizonte (Ano {0}); a rede ainda não chega a todas as pessoas',
      'Custo anual em regime (Ano {0}, primeiro ano depois do fim do financiamento externo)', 'Custo anual em regime (Ano {0}); há financiamento externo até o fim do horizonte', 'Anos {0} a {1}',
      'Depois, o uso cresce em ondas, segundo o passo {0}:', 'Ano {0}: {1}% das pessoas que usariam', 'Entre uma onda e outra o uso fica no patamar anterior, e depois da última onda fica no último patamar.',
      'Depois, o uso cresce em curva em S (devagar no começo, mais rápido no meio e devagar no fim) até {0} pessoas no Ano {1}.', 'Depois, o uso cresce em curva em S e chegaria a {0} pessoas no Ano {1}, depois do horizonte da estimativa.',
      'Reposição dos dispositivos (passo {0}): cada lote comprado é comprado de novo a cada {1} anos, dentro do horizonte, ao mesmo preço corrigido; entra no custo recorrente.',
      'Pessoas formadas a cada ano: 1 para cada {0} pessoas que poderiam usar (as novas), mais {1}% das já formadas (quem sai e é substituído, passo {2}).'
    ].forEach(precisa);
    chk('tradução [' + l + '] dos textos novos', falta.length === 0, falta);
  });
}

console.log('\nverificações:', ok, 'ok,', bad, 'falhas');
process.exit(bad ? 1 : 0);
