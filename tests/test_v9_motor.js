// Testes do modelo do caso e do motor de custo da versão 9 (pacote P1), atualizados na v11 (pacote S1):
// 2.0 múltipla ('ambos'), arquitetura na 3.2, internet, dispositivos, formação, suporte, acompanhamento,
// ferramentas adicionais, primeira etapa da implantação e migração de casos da v10.
// Uso: node tests/test_v9_motor.js
// Carrega custos.js, framework.js e casos.js como globais, como no build.
const path = require('path');
const fs = require('fs');
global.LOC = () => 'pt-BR';
const src = f => path.join(__dirname, '..', 'src', f);
Object.assign(global, require(src('custos.js')));
Object.assign(global, require(src('framework.js')));
Object.assign(global, require(src('casos.js')));

let ok = 0, bad = 0;
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= Math.max(1, Math.abs(b) * tol);
const eq = (n, a, b, tol) => { if (near(a, b, tol)) ok++; else { bad++; console.log('FALHA', n, a, b); } };
const chk = (n, c, extra) => { if (c) ok++; else { bad++; console.log('FALHA', n, extra !== undefined ? JSON.stringify(extra) : ''); } };
const mesmo = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const av = cfg => avaliar(calcular(cfg));
const soma = o => Object.values(o).reduce((a, b) => a + b, 0);
const totDe = ctx => {
  const ids = Object.keys(ctx.etapas).filter(k => ctx.etapas[k].on);
  const al = id => { const e = ctx.etapas[id]; return (!e.soTotal && Array.isArray(e.anos) && e.anos.length) ? e.anos.reduce((a, b) => a + (+b || 0), 0) : +e.alunos || 0; };
  return { alunos: ids.reduce((s, id) => s + al(id), 0), escolas: ids.reduce((s, id) => s + (+ctx.etapas[id].escolas || 0), 0), etapas: ids };
};

// (1) neutralidade dos parâmetros novos
for (const k of ['A', 'B', 'C']) {
  const c0 = clone(PRESETS[k]), c1 = clone(PRESETS[k]);
  c1.adaptacao = { fK31: 1, fK32: 1 }; c1.cedidoUso = [0, 0, 0, 0];
  const a0 = av(c0), a1 = av(c1);
  eq(k + ' neutro: ctEco', a1.ctEco, a0.ctEco);
  const t0 = resumo(calcular(c0)).tot, t1 = resumo(calcular(c1)).tot;
  t0.forEach((v, t) => eq(k + ' neutro: tot ano ' + t, t1[t], v));
  const d0 = orcamento(c0).dot, d1 = orcamento(c1).dot;
  d0.forEach((v, t) => eq(k + ' neutro: dotação ano ' + t, d1[t], v));
  eq(k + ' fatoresAdaptacao sem nível', fatoresAdaptacao('', k).fK31 + fatoresAdaptacao(undefined, k).fK32, 2);
}

// (2) tabela de adaptação (B.10): K3 e total por preset e nível (conta econômica, modo padrão, preset puro)
const TAB = {
  A: { config: [21625, 4678721], conteudo: [27250, 4684346], integracao: [59250, 4749946], sob_medida: [122063, 4875758] },
  B: { config: [21100, 392977], conteudo: [21100, 392977], integracao: [56300, 459857], sob_medida: [122300, 585257] },
  C: { config: [37400, 1470013], conteudo: [45400, 1478013], integracao: [103000, 1575933], sob_medida: [215000, 1763533] },
};
const NIV = ['config', 'conteudo', 'integracao', 'sob_medida'];
for (const k of ['A', 'B', 'C']) {
  const base = av(clone(PRESETS[k]));
  let ant = -Infinity; const K3 = {};
  NIV.forEach(n => {
    const cfg = clone(PRESETS[k]); cfg.adaptacao = fatoresAdaptacao(n, k);
    const a = av(cfg);
    K3[n] = a.porK.K3;
    eq(k + ' ' + n + ' K3', a.porK.K3, TAB[k][n][0]);
    eq(k + ' ' + n + ' total', a.ctEco, TAB[k][n][1]);
    chk(k + ' K3 não decrescente até ' + n, a.porK.K3 >= ant - 1e-9); ant = a.porK.K3;
    // K6.1 (manutenção) acompanha K3.1 (implantação)
    eq(k + ' ' + n + ' K6.1 acompanha K3.1', a.porS['K6.1'] / base.porS['K6.1'], a.porS['K3.1'] / base.porS['K3.1'], 1e-9);
    eq(k + ' ' + n + ' K3.1 escala por fK31', a.porS['K3.1'] / base.porS['K3.1'], cfg.adaptacao.fK31, 1e-9);
    eq(k + ' ' + n + ' identidade Σ subcomponentes', soma(a.porS), a.ctEco);
  });
  chk(k + ' sob_medida > config', K3.sob_medida > K3.config);
  const ref = { A: 'integracao', B: 'sob_medida', C: 'sob_medida' }[k];
  chk(k + ' nível de referência é neutro', fatoresAdaptacao(ref, k).fK31 === 1 && fatoresAdaptacao(ref, k).fK32 === 1);
}
chk('fatoresAdaptacao aceita arquitetura', JSON.stringify(fatoresAdaptacao('config', 'saas')) === JSON.stringify(fatoresAdaptacao('config', 'A')));
// valor residual (fechamento por continuidade) usa a implantação ajustada
{
  const c0 = clone(PRESETS.B); c0.opc = { fechamento: 'continuidade' };
  const c1 = clone(c0); c1.adaptacao = fatoresAdaptacao('config', 'B');
  const v0 = av(c0).vr, v1 = av(c1).vr;
  eq('valor residual escala com a adaptação', v1 / v0, fatoresAdaptacao('config', 'B').fK31, 1e-9);
}

// (3) uso cedido sem custo no preset B (API)
{
  const c0 = clone(PRESETS.B), c1 = clone(PRESETS.B); c1.cedidoUso = [1, 0, 0, 0];
  const a0 = av(c0), a1 = av(c1), o0 = orcamento(c0), o1 = orcamento(c1);
  chk('cedido: dotação do Ano 0 cai', o1.dot[0] < o0.dot[0], [o1.dot[0], o0.dot[0]]);
  [1, 2, 3].forEach(t => eq('cedido: dotação do Ano ' + t + ' igual', o1.dot[t], o0.dot[t]));
  eq('cedido: conta econômica não muda', a1.ctEco, a0.ctEco);
  chk('cedido: fac.doado > 0', a1.fac.doado > 0);
  chk('cedido: linha "Uso cedido sem custo"', a1.linhas.some(l => l.nome === 'Uso cedido sem custo (valor de mercado)' && l.nat === 'O' && l.v[0] > 0));
  chk('cedido: sem desembolso de K2.2–K2.5 no Ano 0', a1.linhas.filter(l => /^K2\.[2-5]$/.test(l.s) && l.nat === 'D').every(l => Math.abs(l.v[0]) < 1e-9));
  const cC = clone(PRESETS.C); cC.cedidoUso = [1, 1, 1, 1];
  const aC = av(cC);
  chk('cedido total em pesos abertos: GPUs sem desembolso', aC.linhas.filter(l => l.s === 'K2.3' && l.nat === 'D').every(l => l.v.every(x => Math.abs(x) < 1e-9)));
  eq('cedido total em pesos abertos: conta econômica igual', aC.ctEco, av(clone(PRESETS.C)).ctEco);
  const cS = clone(PRESETS.B); cS.cedidoUso = [1, 0, 0, 0]; cS.opc = { doados: false };
  chk('cedido sem modo doados: sem linha O', !av(cS).linhas.some(l => l.nat === 'O'));
}

// (4) soma por camada
const verCamadas = (n, cfg) => {
  const a = av(cfg), sc = somaPorCamada(a);
  eq(n + ': Σ camadas (total) = ctEco', soma(sc.total), a.ctEco);
  eq(n + ': Σ camadas (Ano 0) = ecoAno[0]', soma(sc.ano0), a.ecoAno[0]);
  eq(n + ': Σ camadas (desembolso do Ano 0) = finAno[0]', soma(sc.fin0), a.finAno[0]);
  chk(n + ': sete camadas', Object.keys(sc.total).length === 7 && Object.keys(sc.ano0).length === 7);
  return sc;
};
for (const k of ['A', 'B', 'C']) verCamadas('preset ' + k, clone(PRESETS[k]));
{ const c = clone(PRESETS.C); c.opc = { fechamento: 'continuidade' }; verCamadas('preset C, continuidade', c); }
chk('CAMADA_DE_S cobre toda a árvore', ARVORE.every(([, , ss]) => ss.every(([s]) => CAMADA_DE_S[s] >= 1 && CAMADA_DE_S[s] <= 7)));
chk('CAMADA_DE_S: K3.3 → 1, K2.1 → 2, K1.2 → 3, K2.4 → 4, K5.2 → 5, K4.3 → 6, K6.3 → 7',
  CAMADA_DE_S['K3.3'] === 1 && CAMADA_DE_S['K2.1'] === 2 && CAMADA_DE_S['K1.2'] === 3 && CAMADA_DE_S['K2.4'] === 4 && CAMADA_DE_S['K5.2'] === 5 && CAMADA_DE_S['K4.3'] === 6 && CAMADA_DE_S['K6.3'] === 7);

// (5) arquitetura derivada
const ARQ = [
  [{ tipoTec: 'paga', pagamento: 'institucional' }, 'saas'],
  [{ tipoTec: 'paga', pagamento: 'usuario', licenca: 'assinatura' }, 'saas'],
  [{ tipoTec: 'paga', pagamento: 'consumo' }, 'api'],
  [{ tipoTec: 'paga', pagamento: 'institucional', adaptacao: 'sob_medida' }, 'saas'],
  [{ tipoTec: 'nao_sei', pagamento: 'usuario', adaptacao: 'sob_medida' }, 'saas'],
  [{ tipoTec: 'paga', pagamento: 'consumo', adaptacao: 'config' }, 'api'],
  [{ tipoTec: 'aberta', pagamento: 'consumo' }, 'ow'],
  [{ tipoTec: 'paga', licenca: 'aberta' }, 'ow'],
  [{ tipoTec: 'publica', pagamento: 'gratuito' }, 'saas'],
  [{}, 'saas'],
  [{ tipoTec: 'nao_sei', pagamento: 'consumo' }, 'api'],
  [{ tipoTec: 'aberta', arquitetura: 'saas' }, 'saas'],
  [{ tipoTec: 'paga', arquitetura: 'api' }, 'api'],
  [{ tipoTec: 'aberta', arquitetura: 'nao_sei' }, 'ow'],
  [{ tipoTec: 'paga', pagamento: 'consumo', arquitetura: '' }, 'api'],
  [{ tipoTec: 'paga', arquiteturaManual: 'ow' }, 'ow'],
];
ARQ.forEach(([c, esp]) => chk('derivarArquitetura ' + JSON.stringify(c) + ' → ' + esp, derivarArquitetura(c) === esp, derivarArquitetura(c)));
chk('derivarArquitetura ignora a escolha quando pedido', derivarArquitetura({ tipoTec: 'aberta', arquitetura: 'saas' }, true) === 'ow');
chk('casoEfetivo usa a arquitetura da 3.2.1', casoEfetivo(Object.assign(clone(CASO_VAZIO), { tipoTec: 'aberta', arquitetura: 'api' }), {}).arquitetura === 'api');
chk('casoEfetivo com "Ainda não sei" usa a presumida', (() => { const e = casoEfetivo(Object.assign(clone(CASO_VAZIO), { tipoTec: 'aberta', arquitetura: 'nao_sei' }), {}); return e.arquitetura === 'ow' && !e.__arqEscolhida; })());
chk('OPC.arquitetura tem nao_sei; arquiteturaPergunta sem indefinida', OPC.arquitetura.some(o => o[0] === 'nao_sei') && !OPC.arquiteturaPergunta.some(o => o[0] === 'indefinida'));
const presumida = c => casoEfetivo(Object.assign(clone(CASO_VAZIO), c), {}).__arqPresumida;
chk('__arqPresumida com tecnologia em branco', presumida({}) === true);
chk('__arqPresumida com "Ainda não sei"', presumida({ tipoTec: 'nao_sei' }) === true);
chk('sem __arqPresumida com tecnologia escolhida', presumida({ tipoTec: 'paga' }) === false);
chk('sem __arqPresumida com arquitetura escolhida', presumida({ tipoTec: 'nao_sei', arquitetura: 'api' }) === false);

// (6) caso efetivo de cada tarefa isolada
TAREFAS.forEach(x => {
  const c = Object.assign(clone(CASO_VAZIO), { tarefas: [x.id] });
  const antes = JSON.stringify(c);
  const ce = casoEfetivo(c, { alunos: 1000, escolas: 10, etapas: ['fund2'] });
  chk('tarefa ' + x.id + ': classes', mesmo(ce.classes, x.classes), ce.classes);
  chk('tarefa ' + x.id + ': autonomia', ce.autonomia === x.autonomia, ce.autonomia);
  chk('tarefa ' + x.id + ': reversibilidade e cumulativo', ce.reversibilidade === x.reversibilidade && ce.cumulativo === x.cumulativo);
  chk('tarefa ' + x.id + ': entrada não alterada', JSON.stringify(c) === antes);
  chk('tarefa ' + x.id + ': em OPC.tarefas', OPC.tarefas.some(o => o[0] === x.id && o[1] === x.t && o[2] === x.ex));
});
{
  const ce = casoEfetivo(clone(CASO_VAZIO), {});
  chk('sem tarefa: classes vazias, autonomia 2, reversibilidade tempo, cumulativo possível',
    ce.classes.length === 0 && ce.autonomia === 2 && ce.reversibilidade === 'tempo' && ce.cumulativo === 'possivel');
  chk('sem tarefa: dados = nenhum; treino = não sei', mesmo(ce.dados, ['nenhum']) && ce.treino === 'nao_sei');
  chk('sem tarefa: elegíveis padrão 1000 com flag', ce.elegiveis === 1000 && ce.__elegPadrao === true);
  const c2 = Object.assign(clone(CASO_VAZIO), { tarefas: ['planos_aula', 'correcao'], usuarios: ['professores', 'estudantes'], afetados: ['criancas'], consequencias: ['nota'] });
  const ce2 = casoEfetivo(c2, { alunos: 5000, escolas: 20, etapas: ['fund1'] });
  chk('regras de dados: estudantes, servidores e sensíveis', mesmo(ce2.dados, ['pessoais_serv', 'pessoais_est', 'sensiveis']), ce2.dados);
  chk('pior reversibilidade e cumulativo entre tarefas', ce2.reversibilidade === 'lenta' && ce2.cumulativo === 'sim');
  chk('autonomia máxima entre tarefas', ce2.autonomia === 3);
  chk('elegíveis = estudantes do contexto quando estudantes usam', ce2.elegiveis === 5000 && ce2.__elegPadrao === true);
  chk('alcance = estudantes do contexto quando crianças são afetadas', ce2.alcance === 5000);
  chk('contestação formal quando a saída afeta pessoas', ce2.contestacao === 'formal');
  chk('verificabilidade: termos de uso → não', casoEfetivo(Object.assign(clone(CASO_VAZIO), { tipoTec: 'paga', licenca: 'termos' }), {}).verificabilidade === 'nao');
  chk('verificabilidade: API → sim', casoEfetivo(Object.assign(clone(CASO_VAZIO), { pagamento: 'consumo', licenca: 'termos' }), {}).verificabilidade === 'sim');
  chk('elegíveis informados prevalecem', casoEfetivo(Object.assign(clone(CASO_VAZIO), { elegiveis: '700' }), { alunos: 9 }).elegiveis === 700);
  chk('idiomas derivado da adaptação', casoEfetivo(Object.assign(clone(CASO_VAZIO), { adaptacao: 'conteudo' }), {}).idiomas === true);
  chk('piloto gratuito e alternativa', (() => { const e = casoEfetivo(Object.assign(clone(CASO_VAZIO), { pagamento: 'gratuito', alternativa: 'sim' }), {}); return e.pilotoGratuito && e.alternativaSemIA; })());
}

// (7) exemplos A–D
const EXP = {
  A: { arq: 'saas', nivel: 'moderado', E0: 600, m0: 4, preset: 'A' },
  B: { arq: 'ow', nivel: 'elevado', E0: 6000, m0: 4 },
  C: { arq: 'saas', nivel: 'elevado', E0: 120, m0: 6 },
  D: { arq: 'api', nivel: 'limitado', E0: 150, m0: 3, preset: 'B' },
};
const RES = {};
for (const k of ['A', 'B', 'C', 'D']) {
  const c = CASOS[k], antes = JSON.stringify(c);
  const tot = totDe(CTX_EX[k]);
  const ce = casoEfetivo(c, tot), p = perfilFinal(ce), cfg = cfgDoCaso(ce, p);
  chk(k + ': caso de entrada não alterado', JSON.stringify(c) === antes);
  chk(k + ': arquitetura derivada ' + EXP[k].arq, ce.arquitetura === EXP[k].arq, ce.arquitetura);
  chk(k + ': nível de risco ' + EXP[k].nivel, p.agregado === EXP[k].nivel, [p.agregado, p.P]);
  chk(k + ': E0 = ' + EXP[k].E0, cfg.demanda.E[0] === EXP[k].E0, cfg.demanda.E);
  chk(k + ': meses do Ano 0 = ' + EXP[k].m0, cfg.demanda.meses[0] === EXP[k].m0, cfg.demanda.meses);
  const a = av(cfg);
  if (EXP[k].preset) eq(k + ': K3 igual ao preset ' + EXP[k].preset, a.porK.K3, av(clone(PRESETS[EXP[k].preset])).porK.K3);
  verCamadas('exemplo ' + k, cfg);
  chk(k + ': motor sem NaN', Number.isFinite(a.ctEco) && a.finAno.every(Number.isFinite) && a.linhas.every(l => l.v.every(Number.isFinite)));
  chk(k + ': exemplo sem campos removidos na v11', ['teste', 'pagaDepois', 'fonte', 'infra', 'arquiteturaManual'].every(f => !(f in c)));
  chk(k + ': migrarCasoV10 não altera o exemplo v11', JSON.stringify(migrarCasoV10(c)) === JSON.stringify(c));
  chk(k + ': exemplo de contexto e respostas', !!CTX_EX[k] && Object.keys(RESP_EX[k]).length === 6);
  RES[k] = { ce, p, cfg, a };
}
chk('B: demanda [6000, 50000, 150000, 150000] (preset C)', JSON.stringify(RES.B.cfg.demanda.E) === JSON.stringify([6000, 50000, 150000, 150000]), RES.B.cfg.demanda.E);
{ const cB = Object.assign(clone(RES.B.ce), { internet: 'parcial', dispExistem: 'parcial' }); const aB = av(cfgDoCaso(cB, RES.B.p));
  chk('B com internet e dispositivos parciais: K1 com dispositivos e conectividade', ['K1.1', 'K1.2'].every(s => aB.porS[s] > 0));
  chk('B (internet e dispositivos: sim): sem K1', RES.B.a.porK.K1 === 0); }
chk('A: sem K1 (internet e dispositivos: sim)', RES.A.a.porK.K1 === 0);
// exemplos A–C com os campos novos neutros: mesmos números da v10 (conta econômica, K e dotação)
{
  const V10 = { A: [4747846, [94080, 1407079, 1435089, 1514809]], B: [1770133, [300357, 319354, 336675, 279765]], C: [1643396, [78204, 426641, 441560, 389177]] };
  for (const k of ['A', 'B', 'C']) {
    eq(k + ': conta econômica igual à da v10 (campos novos neutros)', RES[k].a.ctEco, V10[k][0], 1e-6);
    orcamento(RES[k].cfg).dot.forEach((v, t) => eq(k + ': dotação do Ano ' + t + ' igual à da v10', v, V10[k][1][t], 1e-6));
  }
  // D: formação online (mais realista) muda só o programa de formação (K4.3 × 0,5)
  const dP = cfgDoCaso(Object.assign(clone(RES.D.ce), { formacaoFormato: 'presencial' }), RES.D.p);
  eq('D presencial: conta econômica igual à da v10', av(dP).ctEco, 577607, 1e-6);
  eq('D online: K4.3 = metade do presencial', RES.D.a.porS['K4.3'], av(dP).porS['K4.3'] * 0.5, 1e-9);
}
chk('A: licença paga no piloto (fatorPreco[0] = 1)', RES.A.cfg.saas.fatorPreco[0] === 1 && RES.A.cfg.saas.mesesCobr[0] === 4);
chk('C: arquitetura presumida', RES.C.ce.__arqPresumida === true);
chk('D: uso cedido no Ano 0 (gratuito)', JSON.stringify(RES.D.cfg.cedidoUso) === JSON.stringify([1, 0, 0, 0]));
chk('D: sem desembolso de consumo e hospedagem no Ano 0', RES.D.a.linhas.filter(l => /^K2\.[2-5]$/.test(l.s) && l.nat === 'D').every(l => Math.abs(l.fin[0]) < 1e-9));
chk('D: linha cedida no Ano 0', RES.D.a.linhas.some(l => l.tag === 'doado' && l.v[0] > 0));
{ // gratuito em SaaS: licença do Ano 0 cedida; tecnologia pública: todos os anos cedidos
  const ceG = Object.assign(clone(RES.A.ce), { pagamento: 'gratuito' });
  const cG = cfgDoCaso(ceG, RES.A.p);
  chk('SaaS gratuito: fatorPreco [0,1,1,1]', JSON.stringify(cG.saas.fatorPreco) === '[0,1,1,1]');
  chk('SaaS gratuito: dotação do Ano 0 menor', orcamento(cG).dot[0] < orcamento(RES.A.cfg).dot[0]);
  const cP = cfgDoCaso(Object.assign(clone(RES.A.ce), { tipoTec: 'publica' }), RES.A.p);
  chk('tecnologia pública: licença sem preço em todos os anos', cP.saas.fatorPreco.every(f => f === 0));
  const cU = cfgDoCaso(Object.assign(clone(RES.A.ce), { pagamento: 'usuario' }), RES.A.p);
  chk('licença por usuário: preço nominal e quantidade pela adoção', cU.saas.preco === PRESETS.A.saas.precoNominal && cU.saas.qtd[1] === Math.ceil(12000 * 0.35 * 1.15));
  const cI = cfgDoCaso(Object.assign(clone(RES.A.ce), { pagamento: 'incluida' }), RES.A.p);
  chk('incluída numa plataforma: preço 0', cI.saas.preco === 0);
  const cParc = cfgDoCaso(Object.assign(clone(RES.D.ce), { pagaDepois: 'parceiro', pagamento: 'consumo' }), RES.D.p);
  chk('pagaDepois removido: sem efeito no custo (cedidoUso [0,0,0,0])', JSON.stringify(cParc.cedidoUso) === '[0,0,0,0]');
  // adaptação no caso: config < sob_medida
  const kA = n => av(cfgDoCaso(Object.assign(clone(RES.A.ce), { adaptacao: n }), RES.A.p)).porK.K3;
  chk('caso A: K3 com sob_medida > config', kA('sob_medida') > kA('config'));
  // adaptação no caso: com tipoTec e pagamento fixos, a arquitetura não muda e o total
  // (conta econômica) é não decrescente de config → conteudo → integracao → sob_medida
  const MONO = [
    ['A', { tipoTec: 'paga', pagamento: 'institucional' }, 'saas'],
    ['A', { tipoTec: 'paga', pagamento: 'usuario' }, 'saas'],
    ['A', { tipoTec: 'nao_sei', pagamento: 'institucional' }, 'saas'],
    ['D', { tipoTec: 'paga', pagamento: 'consumo', arquitetura: '' }, 'api'],
    ['C', { tipoTec: 'paga', pagamento: 'consumo' }, 'api'],
    ['B', { tipoTec: 'aberta', pagamento: 'consumo' }, 'ow'],
    ['C', { tipoTec: 'aberta', pagamento: 'institucional' }, 'ow'],
  ];
  MONO.forEach(([k, fix, arqEsp]) => {
    let ant = -Infinity, okMono = true, okArq = true; const tots = [];
    NIV.forEach(n => {
      const c = Object.assign(clone(CASOS[k]), fix, { adaptacao: n });
      const ce = casoEfetivo(c, totDe(CTX_EX[k]));
      if (ce.arquitetura !== arqEsp) okArq = false;
      const t = av(cfgDoCaso(ce, perfilFinal(ce))).ctEco;
      tots.push(Math.round(t));
      if (!(t >= ant - 1e-6)) okMono = false; ant = t;
    });
    const nome = 'caso ' + k + ' ' + JSON.stringify(fix);
    chk(nome + ': arquitetura ' + arqEsp + ' em todos os níveis de adaptação', okArq);
    chk(nome + ': total não decrescente de config a sob_medida', okMono, tots);
    chk(nome + ': sob_medida > config', tots[3] > tots[0], tots);
  });
  // horizonte de 5 anos; primeira etapa da implantação (1/3, sugestão) e todos três anos depois dela
  const c5 = cfgDoCaso(Object.assign(clone(RES.A.ce), { horizonte: 5, expansao: 'ano3', implantacao: { escolas: '', pessoas: '' } }), RES.A.p);
  chk('horizonte 5: demanda com 6 posições, 1/3 no Ano 1 e todos três anos depois', JSON.stringify(c5.demanda.E) === JSON.stringify([600, 4000, 6667, 9333, 12000, 12000]), c5.demanda.E);
  const c2 = cfgDoCaso(Object.assign(clone(RES.A.ce), { expansao: 'ano2', implantacao: { escolas: '', pessoas: 3000 } }), RES.A.p);
  chk('implantação de 3.000 e todos dois anos depois', JSON.stringify(c2.demanda.E) === JSON.stringify([600, 3000, 7500, 12000]), c2.demanda.E);
  const c1 = cfgDoCaso(Object.assign(clone(RES.A.ce), { expansao: 'ano1', implantacao: { escolas: '', pessoas: '' } }), RES.A.p);
  chk('sem primeira etapa informada: 1/3 no Ano 1 e todos no Ano 2', JSON.stringify(c1.demanda.E) === JSON.stringify([600, 4000, 12000, 12000]), c1.demanda.E);
  const a5 = av(c5);
  chk('horizonte 5: motor sem NaN', Number.isFinite(a5.ctEco) && a5.r.H === 5);
  // padrões do setup: PoC sem participantes → 15 pessoas e 2 meses; piloto → max(50, 5%) e 4 meses
  const cPoc = cfgDoCaso(Object.assign(clone(RES.A.ce), { testes: ['poc'], piloto: { escolas: '', participantes: '', meses: '' } }), RES.A.p);
  chk('PoC sem setup: E0 = 15 e 2 meses', cPoc.demanda.E[0] === 15 && cPoc.demanda.meses[0] === 2);
  const cPocV10 = cfgDoCaso(Object.assign(clone(RES.A.ce), { testes: [], teste: 'poc', piloto: { escolas: '', participantes: 40, meses: 3 } }), RES.A.p);
  chk('compatibilidade: teste antigo "poc" com setup em piloto', cPocV10.demanda.E[0] === 40 && cPocV10.demanda.meses[0] === 3);
  const cPil = cfgDoCaso(Object.assign(clone(RES.A.ce), { testes: ['piloto'], piloto: {} }), RES.A.p);
  chk('piloto sem setup: E0 = 600 (5%) e 4 meses', cPil.demanda.E[0] === 600 && cPil.demanda.meses[0] === 4);
  // condições de base: valores ilustrativos de PREMISSAS_K1 e PREMISSAS_V11 (B: 600 escolas, piloto em 20, 200 na implantação)
  const cfgBc = cfgDoCaso(Object.assign(clone(RES.B.ce), { internet: 'nao', modeloDisp: 'compartilhado', dispExistem: 'nao' }), RES.B.p);
  const disp = cfgBc.itens.find(x => x.s === 'K1.2');
  chk('K1.2 Ano 0 = ⌈6.000 ÷ 3⌉ × 300 (compartilhado, não existem)', disp && disp.v[0] === Math.ceil(6000 / 3) * PREMISSAS_K1.precoDispositivo && disp.q[0] === 2000 && disp.un === 'dispositivo', disp && disp.v);
  chk('K1.2 Ano 1 = só os novos', disp && disp.q[1] === Math.ceil(50000 / 3) - 2000, disp && disp.q);
  const con = cfgBc.itens.find(x => x.s === 'K1.1');
  chk('K1.1 = 600 × escolas do escopo (20 no piloto, 200 na implantação, depois todas)', con && con.v[0] === 600 * 20 && con.v[1] === 600 * 200 && con.v[2] === 600 * 600 && con.un === 'escola', con && con.v);
  const cfgBp = cfgDoCaso(Object.assign(clone(RES.B.ce), { internet: 'parcial', escolasInternet: 450 }), RES.B.p);
  const conP = cfgBp.itens.find(x => x.s === 'K1.1');
  chk('K1.1 parcial: escolas sem internet proporcionais (150 de 600)', conP && conP.q[2] === 150 && conP.q[1] === 50 && conP.q[0] === 5, conP && conP.q);
}
chk('alerta de tecnologia não escolhida (C em situação de orçamento)', (() => {
  const ce = casoEfetivo(Object.assign(clone(CASOS.C), { situacao: 'orcamento' }), totDe(CTX_EX.C));
  return alertas(ce, perfilFinal(ce)).some(a => a.texto.startsWith('A tecnologia ainda não foi escolhida.'));
})());
chk('sem alerta de tecnologia quando escolhida (A)', !alertas(RES.A.ce, RES.A.p).some(a => a.texto.startsWith('A tecnologia ainda não foi escolhida.')));

// (8) sugestões do passo 2.2
{
  const s = perfisSugeridos(['tutoria'], ['fund2']);
  chk('tutoria: usuários estudantes e professores', mesmo(s.usuarios, ['estudantes', 'professores']), s.usuarios);
  chk('tutoria: afetados com crianças', s.afetados.includes('criancas') && !s.afetados.includes('adultos_est'));
  chk('tutoria: frequência contínua', s.frequencia === 'continua');
  const sup = perfisSugeridos(['tutoria'], ['superior']);
  chk('só educação superior: crianças → estudantes adultos', sup.afetados.includes('adultos_est') && !sup.afetados.includes('criancas'), sup.afetados);
  const mix = perfisSugeridos(['tutoria'], ['superior', 'medio']);
  chk('etapa básica presente: mantém crianças', mix.afetados.includes('criancas'));
  const u = perfisSugeridos(['planos_aula', 'feedback_redacao'], []);
  chk('consequências: união sem "nenhuma"', mesmo(u.consequencias, ['formativa']), u.consequencias);
  const v = perfisSugeridos([], []);
  chk('sem tarefa: listas vazias, nenhuma, semanal', v.usuarios.length === 0 && v.afetados.length === 0 && mesmo(v.consequencias, ['nenhuma']) && v.frequencia === 'semanal');
  const w = perfisSugeridos(['planos_aula', 'duvidas'], ['fund1']);
  chk('frequência mais intensa entre tarefas', w.frequencia === 'diaria');
  chk('IMPACTO_TAREFAS só aponta tarefas existentes', Object.values(IMPACTO_TAREFAS).every(l => l.every(id => TAREFAS.some(t => t.id === id))));
  chk('IMPACTO_TAREFAS cobre todos os impactos', OPC.impactos.every(o => Array.isArray(IMPACTO_TAREFAS[o[0]])));
}

// (9) recomendação de prova de conceito ou piloto
{
  const rC = recomendarTeste(RES.C.ce);
  chk('C → prova de conceito e depois piloto (tecnologia não escolhida; professores usam)', rC.modo === 'ambos' && rC.poc && rC.piloto && rC.motivos.includes('a tecnologia ainda não foi escolhida') && rC.ids.includes('pessoas_reais'), rC);
  const rA = recomendarTeste(RES.A.ce);
  chk('A → piloto', rA.modo === 'piloto' && rA.motivos[0] === 'a tecnologia está escolhida' && rA.motivos.includes('há linha de base parcial'), rA);
  chk('D → só prova de conceito (sob medida; só servidores e gestores)', (() => { const r = recomendarTeste(RES.D.ce); return r.modo === 'poc' && r.ids.includes('sob_medida') && !r.piloto; })());
  chk('A → piloto sem prova de conceito', rA.piloto && !rA.poc);
  chk('tarefa fora da lista e sem linha de base → PoC com dois motivos', (() => { const r = recomendarTeste({ tipoTec: 'paga', tarefas: ['outra'], linhaBase: 'nao' }); return r.modo === 'poc' && r.motivos.length === 2; })());
  chk('motivos são chaves de MOTIVOS_TESTE', [rA, rC].every(r => r.motivos.every(m => Object.values(MOTIVOS_TESTE).includes(m))));
}

// (10) alertas de um caso em branco
{
  const antes = JSON.stringify(CASO_VAZIO);
  const ce = casoEfetivo(CASO_VAZIO, { alunos: 0, escolas: 0, etapas: [] });
  const A = alertas(ce, perfilFinal(ce));
  chk('caso em branco: sem alerta de funções não terceirizáveis', !A.some(a => /terceirizad/.test(a.texto)));
  chk('caso em branco: sem alerta de treino (sem dado pessoal)', !A.some(a => /treinamento|treinar/.test(a.texto)));
  chk('caso em branco: CASO_VAZIO não alterado', JSON.stringify(CASO_VAZIO) === antes);
  chk('caso em branco: cfgDoCaso funciona', Number.isFinite(av(cfgDoCaso(ce, perfilFinal(ce))).ctEco));
  const ceD = RES.C.ce;
  chk('alerta de treino quando há dado pessoal', alertas(ceD, RES.C.p).some(a => /treinamento/.test(a.texto)));
  chk('OPC.situacao sem testar e incidente', !OPC.situacao.some(o => ['testar', 'incidente'].includes(o[0])) && OPC.situacao.length === 4);
}

// (12) v11: parâmetros novos movem a linha certa na direção certa
{
  const cfgDe = (k, muda) => { const c = Object.assign(clone(CASOS[k]), muda || {}); const ce = casoEfetivo(c, totDe(CTX_EX[k])); return cfgDoCaso(ce, perfilFinal(ce)); };
  const aDe = (k, muda) => av(cfgDe(k, muda));
  const S_ = (a, s) => a.porS[s] || 0;
  // contrato de opções (ids exatos)
  const ids = k => OPC[k].map(o => o[0]).join(',');
  const CONTRATO_OPC = {
    teste: 'poc,piloto,recomendar', testes: 'poc,piloto,recomendar', testeEfetivo: 'poc,piloto,ambos,recomendar',
    nFerramentas: '1,2,3mais,nao_sei', conheceFerramentas: 'sim,nao', internet: 'sim,parcial,nao',
    modeloDisp: 'um_por_aluno,compartilhado,rotativo,por_professor,proprio', dispExistem: 'sim,parcial,nao',
    formados: 'professores,gestores,tecnica,administrativo', formacaoTipo: 'tecnologia,pedagogico,piloto,dados_etica',
    formacaoFormato: 'presencial,online,hibrida', formacaoPaga: 'fornecedor,rede,parceiro,indefinido',
    suporteQuem: 'fornecedor,rede,ambos', suporteNivel: 'basico,ampliado,dedicado', acompanhamento: 'leve,regular,intensivo',
    arquitetura: 'saas,api,ow,nao_sei,indefinida', arquiteturaPergunta: 'saas,api,ow,nao_sei', expansao: 'ano1,ano2,ano3',
  };
  Object.entries(CONTRATO_OPC).forEach(([k, v]) => chk('OPC.' + k + ' = ' + v, OPC[k] && ids(k) === v, OPC[k] && ids(k)));
  chk('OPC.suporteNivel e acompanhamento com descrição', ['suporteNivel', 'acompanhamento'].every(k => OPC[k].every(o => typeof o[2] === 'string' && o[2].length > 20)));
  chk('OPC sem pagaDepois, fonte e infra', !OPC.pagaDepois && !OPC.fonte && !OPC.infra);
  chk('CASO_VAZIO v11: campos novos vazios e sem campos removidos',
    ['teste', 'pagaDepois', 'fonte', 'infra', 'arquiteturaManual'].every(f => !(f in CASO_VAZIO)) && Array.isArray(CASO_VAZIO.testes) && !CASO_VAZIO.testes.length &&
    CASO_VAZIO.formacaoHoras === '' && CASO_VAZIO.formacaoEstimativa === false && CASO_VAZIO.arquitetura === '' &&
    ['internet', 'modeloDisp', 'dispExistem', 'formacaoFormato', 'formacaoPaga', 'suporteQuem', 'suporteNivel', 'acompanhamento', 'nFerramentas', 'conheceFerramentas'].every(f => CASO_VAZIO[f] === ''));
  chk('PREMISSAS_V11.horasFormacao é número', typeof PREMISSAS_V11.horasFormacao === 'number' && PREMISSAS_V11.horasFormacao > 0);
  chk('horasFormacaoEstimada por arquitetura (exemplos do guia)', horasFormacaoEstimada('saas') === PRESETS.A.formacaoTempo.horas && horasFormacaoEstimada('api') === PRESETS.B.formacaoTempo.horas && horasFormacaoEstimada('ow') === PRESETS.C.formacaoTempo.horas && horasFormacaoEstimada(RES.B.ce) === 2);

  // neutralidade: campos novos vazios = valores neutros dos exemplos
  const VAZIOS = { internet: '', escolasInternet: '', modeloDisp: '', dispExistem: '', formados: [], formacaoTipo: [], formacaoFormato: '', formacaoHoras: '',
    formacaoEstimativa: false, formacaoPaga: '', suporteQuem: '', suporteNivel: '', acompanhamento: '', ferramentas: [], nFerramentas: '', conheceFerramentas: '' };
  for (const k of ['A', 'B', 'C']) {
    const a0 = aDe(k, VAZIOS);
    eq(k + ': campos novos vazios = valores neutros (conta econômica)', a0.ctEco, RES[k].a.ctEco, 1e-9);
    orcamento(cfgDe(k, VAZIOS)).dot.forEach((v, t) => eq(k + ': campos novos vazios = neutros (dotação Ano ' + t + ')', v, orcamento(RES[k].cfg).dot[t], 1e-9));
  }
  // preset puro × caso neutro: a linha de formação, de suporte e de gestão é a do exemplo do guia
  {
    const pA = av(clone(PRESETS.A));
    ['K4.2', 'K4.3', 'K4.4', 'K4.1'].forEach(s => eq('A neutro: ' + s + ' igual ao preset A', S_(RES.A.a, s), S_(pA, s), 1e-9));
    eq('A neutro: K2.1 igual ao preset A', S_(RES.A.a, 'K2.1'), S_(pA, 'K2.1'), 1e-9);
  }

  // K1.1 internet: não > parcial > sim (B, todas as escolas)
  {
    const k1 = v => S_(aDe('B', { internet: v, escolasInternet: 300 }), 'K1.1');
    const n = k1('nao'), p = k1('parcial'), sm = k1('sim');
    chk('internet: não > parcial > sim = 0', n > p && p > sm && sm === 0, [n, p, sm]);
    const pSemNum = S_(aDe('B', { internet: 'parcial', escolasInternet: '' }), 'K1.1');
    eq('internet parcial sem número = metade de "não"', pSemNum, n * 0.5, 0.01);
    chk('K1.1 só muda a camada 3 (resto igual)', (() => { const a = aDe('B', { internet: 'nao' }); return near(a.ctEco - S_(a, 'K1.1'), RES.B.a.ctEco, 1e-9); })());
  }
  // K1.2 dispositivos: um por estudante > compartilhado > rotativo para os mesmos usuários; lacuna não > parcial > sim
  {
    const k2 = (m, ex) => S_(aDe('B', { modeloDisp: m, dispExistem: ex || 'nao' }), 'K1.2');
    const um = k2('um_por_aluno'), co = k2('compartilhado'), ro = k2('rotativo'), pr = k2('proprio'), pp = k2('por_professor');
    chk('dispositivos: um por estudante > compartilhado > rotativo > próprios = 0', um > co && co > ro && ro > pr && pr === 0, [um, co, ro, pr]);
    chk('dispositivos: um por professor < compartilhado (estudantes ÷ 25)', pp > 0 && pp < co, [pp, co]);
    chk('dispositivos: não > parcial > sim = 0', k2('um_por_aluno', 'nao') > k2('um_por_aluno', 'parcial') && k2('um_por_aluno', 'parcial') > 0 && k2('um_por_aluno', 'sim') === 0);
    eq('dispositivos parcial = metade de "não"', k2('compartilhado', 'parcial'), k2('compartilhado', 'nao') * 0.5, 0.001);
    const cfgU = cfgDe('B', { modeloDisp: 'um_por_aluno', dispExistem: 'nao' }), it = cfgU.itens.find(x => x.s === 'K1.2');
    chk('dispositivos um por estudante: comprados = novos usuários de cada ano', JSON.stringify(it.q) === JSON.stringify([6000, 44000, 100000, 0]), it.q);
    chk('dispositivos: linha de capital', it.orc === 'capital');
  }
  // K4.2 suporte: dedicado > ampliado > básico; fornecedor tem linha própria por usuário ativo
  {
    const k42 = (n, q) => S_(aDe('A', { suporteNivel: n, suporteQuem: q || 'rede' }), 'K4.2');
    chk('suporte da rede: dedicado > ampliado > básico', k42('dedicado') > k42('ampliado') && k42('ampliado') > k42('basico'), [k42('dedicado'), k42('ampliado'), k42('basico')]);
    eq('suporte básico = metade do ampliado (rede)', k42('basico'), k42('ampliado') * 0.5, 1e-9);
    const aF = aDe('A', { suporteQuem: 'fornecedor', suporteNivel: 'dedicado' });
    const lf = aF.linhas.find(l => l.nome === 'Suporte do fornecedor');
    chk('suporte do fornecedor: linha "Suporte do fornecedor" em K4.2, desembolso, por usuário ativo', lf && lf.s === 'K4.2' && lf.nat === 'D' && lf.un === 'usuário ativo por ano' && lf.v[1] > 0);
    eq('suporte do fornecedor: q = usuários ativos do Ano 1', lf.q[1], Math.round(aF.r.U[1]), 1e-9);
    const intF = aF.linhas.filter(l => l.s === 'K4.2' && l.nat === 'C').reduce((s, l) => s + l.ecoVP, 0);
    const intR = S_(aDe('A', { suporteQuem: 'rede', suporteNivel: 'dedicado' }), 'K4.2');
    eq('suporte do fornecedor: parte interna = 25% da rede', intF, intR * 0.25, 1e-9);
    chk('suporte do fornecedor básico: sem linha do fornecedor', !aDe('A', { suporteQuem: 'fornecedor', suporteNivel: 'basico' }).linhas.some(l => l.nome === 'Suporte do fornecedor'));
    const aAm = aDe('A', { suporteQuem: 'ambos', suporteNivel: 'dedicado' }), la = aAm.linhas.find(l => l.nome === 'Suporte do fornecedor');
    eq('suporte das duas equipes: metade da taxa do fornecedor', la.v[1], lf.v[1] * 0.5, 1e-9);
    chk('suporte: fornecedor dedicado > fornecedor ampliado', S_(aF, 'K4.2') > S_(aDe('A', { suporteQuem: 'fornecedor', suporteNivel: 'ampliado' }), 'K4.2'));
  }
  // K4.1 e K5.3 por acompanhamento; operação técnica do modelo (pesos abertos) não muda
  {
    const g = (k, n) => { const a = aDe(k, { acompanhamento: n }); return S_(a, 'K4.1') + S_(a, 'K5.3'); };
    chk('acompanhamento: intensivo > regular > leve (A)', g('A', 'intensivo') > g('A', 'regular') && g('A', 'regular') > g('A', 'leve'));
    eq('acompanhamento regular = neutro (A)', g('A', 'regular'), S_(RES.A.a, 'K4.1') + S_(RES.A.a, 'K5.3'), 1e-9);
    const opm = n => aDe('B', { acompanhamento: n }).linhas.filter(l => l.tag === 'opmodelo').reduce((s, l) => s + l.ecoVP, 0);
    eq('acompanhamento não muda a operação do modelo (B)', opm('intensivo'), opm('leve'), 1e-9);
  }
  // formação: online < híbrida < presencial (K4.3); fornecedor paga → orçamento menor, conta econômica igual
  {
    const k43 = f => S_(aDe('A', { formacaoFormato: f }), 'K4.3');
    chk('formação: online < híbrida < presencial', k43('online') < k43('hibrida') && k43('hibrida') < k43('presencial'), [k43('online'), k43('hibrida'), k43('presencial')]);
    const cF = cfgDe('A', { formacaoPaga: 'fornecedor' }), aF = av(cF);
    eq('formação paga pelo fornecedor: conta econômica igual', aF.ctEco, RES.A.a.ctEco, 1e-9);
    const oF = orcamento(cF).dot, o0 = orcamento(RES.A.cfg).dot;
    chk('formação paga pelo fornecedor: dotação menor em todos os anos', oF.every((v, t) => v < o0[t]), [oF, o0]);
    chk('formação paga pelo fornecedor: linha cedida (O) em K4.3', aF.linhas.some(l => l.s === 'K4.3' && l.nat === 'O' && l.pagador === 'fornecedor'));
    chk('formação paga por parceiro: cedida a terceiro', av(cfgDe('A', { formacaoPaga: 'parceiro' })).linhas.some(l => l.s === 'K4.3' && l.nat === 'O' && l.pagador === 'terceiro'));
    // K4.4: horas informadas, estimativa e papéis
    const k44 = m => S_(aDe('A', m), 'K4.4');
    eq('horas informadas (6 h) dobram o tempo de formação (3 h)', k44({ formacaoEstimativa: false, formacaoHoras: 6 }), 2 * S_(RES.A.a, 'K4.4'), 1e-9);
    eq('"Usar uma estimativa" usa as horas do exemplo do guia', k44({ formacaoEstimativa: true, formacaoHoras: 10 }), S_(RES.A.a, 'K4.4'), 1e-9);
    const aT = aDe('A', { formados: ['professores', 'tecnica', 'gestores'] });
    chk('formação com equipe técnica e gestores: linhas próprias em K4.4', ['Tempo de formação: equipe técnica', 'Tempo de formação: gestores escolares'].every(n => aT.linhas.some(l => l.nome === n && l.s === 'K4.4' && l.q && l.q[0] > 0)));
    chk('formação com mais papéis > só professores', S_(aT, 'K4.4') > S_(RES.A.a, 'K4.4'));
    const aG = aDe('C', { formados: ['gestores'] });
    eq('C: só gestores formados = metade das pessoas que usariam', S_(aG, 'K4.4'), S_(RES.C.a, 'K4.4') * 0.5, 1e-9);
    chk('B (estudantes usam): sem professores formados, só gestores', (() => { const a = aDe('B', { formados: ['gestores'] }); return a.linhas.some(l => l.nome === 'Tempo de formação: gestores escolares') && !a.linhas.some(l => l.nome === PRESETS.C.formacaoTempo.nome && l.v.some(x => x > 0)); })());
  }
  // ferramentas adicionais pagas: linha K2.1 com o nome da ferramenta
  {
    const ferr = (f2) => ({ ferramentas: [clone(CASOS.A.ferramentas[0]), f2] });
    const aX = aDe('A', ferr({ nome: 'Corretor de redações', tarefas: ['feedback_redacao'], tipoTec: 'paga', pagamento: 'institucional', preco: 4 }));
    const lx = aX.linhas.find(l => l.nome === 'Licenças: Corretor de redações');
    chk('ferramenta adicional paga: linha K2.1 "Licenças: <nome>"', lx && lx.s === 'K2.1' && lx.nat === 'D' && lx.un === 'licença-mês');
    eq('ferramenta adicional institucional: 12.000 × 12 × US$ 4 no Ano 1', lx.v[1], 12000 * 12 * 4, 1e-9);
    eq('ferramenta adicional: Ano 0 com os meses do teste', lx.q[0], 600 * 4, 1e-9);
    eq('ferramenta adicional: resto do custo igual', aX.ctEco - lx.ecoVP, RES.A.a.ctEco, 1e-9);
    const lu = aDe('A', ferr({ nome: 'X', tipoTec: 'paga', pagamento: 'usuario', preco: '' })).linhas.find(l => l.nome === 'Licenças: X');
    eq('ferramenta por usuário: adoção e preço do exemplo do guia', lu.v[1], Math.ceil(12000 * PRESETS.A.demanda.adocao[1]) * 12 * PRESETS.A.saas.precoNominal, 1e-9);
    chk('ferramenta pública, aberta ou por consumo: sem linha', ['publica', 'aberta'].every(tp => !aDe('A', ferr({ nome: 'Y', tipoTec: tp, pagamento: 'institucional' })).linhas.some(l => l.nome === 'Licenças: Y'))
      && !aDe('A', ferr({ nome: 'Y', tipoTec: 'paga', pagamento: 'consumo' })).linhas.some(l => l.nome === 'Licenças: Y'));
    chk('ferramenta sem nome: "Licenças: ferramenta 2"', aDe('A', ferr({ nome: '', tipoTec: 'paga', pagamento: 'institucional' })).linhas.some(l => l.nome === 'Licenças: ferramenta 2'));
    const lb = aDe('B', ferr({ nome: 'Planejador', tarefas: ['planos_aula'], tipoTec: 'paga', pagamento: 'institucional', preco: 5 })).linhas.find(l => l.nome === 'Licenças: Planejador');
    eq('ferramenta só para professores num caso com estudantes: estudantes ÷ 25', lb.q[3], Math.round(150000 / 25) * 12, 1e-9);
    const pr = cfgDe('A', { ferramentas: [Object.assign(clone(CASOS.A.ferramentas[0]), { preco: 7 })] });
    chk('preço informado da ferramenta principal substitui o do exemplo', pr.saas.preco === 7);
  }
  // 2.0 múltipla: prova de conceito e depois piloto
  {
    chk('testeDe: os dois → ambos; um só; recomendar; vazio; compatibilidade',
      testeDe({ testes: ['poc', 'piloto'] }) === 'ambos' && testeDe({ testes: ['piloto'] }) === 'piloto' && testeDe({ testes: ['poc'] }) === 'poc' &&
      testeDe({ testes: ['recomendar'] }) === 'recomendar' && testeDe({ testes: [] }) === '' && testeDe({ testes: [], teste: 'poc' }) === 'poc' && testeDe({ teste: 'piloto' }) === 'piloto');
    chk('casoEfetivo deriva teste = ambos', casoEfetivo(Object.assign(clone(CASO_VAZIO), { testes: ['piloto', 'poc'] }), {}).teste === 'ambos');
    const cA = cfgDe('A', { testes: ['poc', 'piloto'], poc: { participantes: 15, meses: 3 } });
    chk('ambos: Ano 0 = participantes do piloto e meses da PoC + do piloto', cA.demanda.E[0] === 600 && cA.demanda.meses[0] === 7, [cA.demanda.E[0], cA.demanda.meses[0]]);
    chk('ambos sem meses da PoC: 2 + 4', cfgDe('A', { testes: ['poc', 'piloto'], piloto: { escolas: 20, participantes: 600, meses: '' } }).demanda.meses[0] === 6);
    chk('ambos: no máximo 12 meses', cfgDe('A', { testes: ['poc', 'piloto'], poc: { participantes: 15, meses: 6 }, piloto: { escolas: 20, participantes: 600, meses: 9 } }).demanda.meses[0] === 12);
    chk('ambos: licença do Ano 0 cobrada pelos meses do Ano 0', cA.saas.mesesCobr[0] === 7);
    chk('ambos custa mais que só o piloto', av(cA).ctEco > RES.A.a.ctEco);
    chk('PoC sem escolas: sem internet no Ano 0', (() => { const c = cfgDe('B', { testes: ['poc'], internet: 'nao' }); const it = c.itens.find(x => x.s === 'K1.1'); return it.q[0] === 0 && it.q[1] > 0; })());
  }
  // contagens efetivas e primeira etapa da implantação
  {
    const e1 = casoEfetivo(Object.assign(clone(CASO_VAZIO), { usuarios: ['professores'] }), { alunos: 50000, escolas: 100, etapas: ['fund1'] });
    chk('só professores usam: elegíveis padrão = estudantes ÷ 25', e1.elegiveis === 2000 && e1.__elegPadrao && e1.usuariosProfessores === 2000 && e1.usuariosEstudantes === 0, [e1.elegiveis, e1.usuariosProfessores]);
    const e2 = casoEfetivo(Object.assign(clone(CASO_VAZIO), { usuarios: ['estudantes', 'professores'] }), { alunos: 50000, escolas: 100, etapas: ['fund1'] });
    chk('estudantes usam: estudantes = E, professores = E ÷ 25', e2.usuariosEstudantes === 50000 && e2.usuariosProfessores === 2000 && e2.professoresRede === 2000);
    chk('primeira etapa padrão: 1/3 das pessoas e escolas proporcionais', e2.implantacaoEfetiva.pessoas === 16667 && e2.implantacaoEfetiva.escolas === 33 && e2.implantacaoEfetiva.padraoPessoas);
    const e3 = casoEfetivo(Object.assign(clone(CASO_VAZIO), { usuarios: ['estudantes'], implantacao: { escolas: 10, pessoas: 5000 } }), { alunos: 50000, escolas: 100 });
    chk('primeira etapa informada', e3.implantacaoEfetiva.pessoas === 5000 && e3.implantacaoEfetiva.escolas === 10 && !e3.implantacaoEfetiva.padraoPessoas);
    chk('cfg.v11: metadados para a fórmula', ['internet', 'dispositivos', 'formacao', 'suporte', 'acompanhamento', 'ferramentas'].every(k => RES.A.cfg.v11 && RES.A.cfg.v11[k]) && RES.A.cfg.v11.implantacao === 12000);
  }
  // migração de casos da v10 (exemplos publicados na v10): mesmos números
  {
    // exemplos como estavam na v10 (src/casos.js do commit "v10 publicada"), só os campos do caso
    const V10_VAZIO = { titulo: '', situacao: 'nova', problema: '', resultado: '', linhaBase: 'nao', alternativa: '', impactos: [], impactoOutro: '',
      teste: '', tarefas: [], tarefaOutra: '', usuarios: [], afetados: [], consequencias: ['nenhuma'], frequencia: 'semanal',
      tipoTec: '', pagamento: '', licenca: '', adaptacao: '', infra: '', piloto: { escolas: '', participantes: '', meses: '' }, arquiteturaManual: '',
      elegiveis: '', expansao: 'ano1', horizonte: 3, pagaDepois: '', fonte: '', ajustes: {}, degrau: 2 };
    const v10 = x => Object.assign(clone(V10_VAZIO), x);
    const V10 = {
      A: v10({ situacao: 'proposta', impactos: ['tempo_docente'], linhaBase: 'parcial', alternativa: 'sim', teste: 'piloto', tarefas: ['planos_aula', 'materiais'],
        usuarios: ['professores'], afetados: ['professores', 'criancas'], tipoTec: 'paga', pagamento: 'institucional', licenca: 'assinatura', adaptacao: 'integracao', infra: 'sim',
        piloto: { escolas: 20, participantes: 600, meses: 4 }, elegiveis: 12000, expansao: 'ano1', pagaDepois: 'rede', fonte: 'parcial' }),
      B: v10({ impactos: ['aprendizagem', 'desigualdade'], linhaBase: 'sim', alternativa: 'sim', teste: 'piloto', tarefas: ['tutoria'],
        usuarios: ['estudantes', 'professores'], afetados: ['criancas', 'professores', 'familias'], consequencias: ['formativa', 'apoio_est'], frequencia: 'continua',
        tipoTec: 'aberta', pagamento: 'consumo', licenca: 'aberta', adaptacao: 'sob_medida', infra: 'sim', piloto: { escolas: 20, participantes: 6000, meses: 4 },
        elegiveis: 150000, expansao: 'ano2', pagaDepois: 'rede', fonte: 'nao' }),
      C: v10({ impactos: ['permanencia'], linhaBase: 'sim', alternativa: 'nao', teste: 'recomendar', tarefas: ['alerta_precoce'],
        usuarios: ['gestores', 'professores'], afetados: ['criancas', 'familias'], consequencias: ['apoio_est', 'recursos'],
        tipoTec: 'nao_sei', pagamento: 'institucional', licenca: 'nao_sei', adaptacao: 'integracao', infra: 'sim', piloto: { escolas: 10, participantes: 120, meses: 6 },
        elegiveis: 2500, expansao: 'ano1', pagaDepois: 'indefinido', fonte: 'parcial' }),
      D: v10({ situacao: 'orcamento', impactos: ['gestao'], linhaBase: 'parcial', alternativa: 'sim', teste: 'poc', tarefas: ['duvidas'],
        usuarios: ['administrativo', 'gestores'], afetados: ['servidores'], consequencias: ['organizacao'], frequencia: 'diaria',
        tipoTec: 'paga', pagamento: 'gratuito', licenca: 'termos', adaptacao: 'sob_medida', infra: 'sim', piloto: { escolas: '', participantes: 150, meses: 3 }, arquiteturaManual: 'api',
        elegiveis: 3000, expansao: 'ano1', pagaDepois: 'rede', fonte: 'sim' }),
    };
    const NUM10 = { A: 4747846, B: 1770133, C: 1643396, D: 577607 };
    for (const k of ['A', 'B', 'C', 'D']) {
      const velho = clone(V10[k]), antes = JSON.stringify(velho);
      const m = migrarCasoV10(velho);
      chk(k + ' v10: migrarCasoV10 não altera a entrada', JSON.stringify(velho) === antes);
      chk(k + ' v10 migrado: sem campos removidos', ['teste', 'pagaDepois', 'fonte', 'infra', 'arquiteturaManual'].every(f => !(f in m)));
      chk(k + ' v10 migrado: testes', JSON.stringify(m.testes) === JSON.stringify([velho.teste]));
      chk(k + ' v10 migrado: infra sim → internet e dispositivos sim', m.internet === 'sim' && m.dispExistem === 'sim');
      const ce = casoEfetivo(m, totDe(CTX_EX[k])), cfg = cfgDoCaso(ce, perfilFinal(ce));
      eq(k + ' v10 migrado: mesma conta econômica da v10', av(cfg).ctEco, NUM10[k], 1e-6);
      chk(k + ' v10 migrado: idempotente', JSON.stringify(migrarCasoV10(m)) === JSON.stringify(m));
    }
    const mD = migrarCasoV10(V10.D);
    chk('D v10: setup da PoC passa para poc; arquiteturaManual → arquitetura', mD.poc.participantes === 150 && mD.poc.meses === 3 && mD.piloto.participantes === '' && mD.arquitetura === 'api');
    const mC = migrarCasoV10(Object.assign(clone(V10.A), { infra: 'complementar', expansao: 'ano3', teste: 'ambos' }));
    chk('v10 complementar → parcial + parcial; ano3 → ano2 sem primeira etapa; ambos → [poc, piloto]',
      mC.internet === 'parcial' && mC.dispExistem === 'parcial' && mC.expansao === 'ano2' && mC.implantacao.pessoas === '' && JSON.stringify(mC.testes) === '["poc","piloto"]');
    const ceC = casoEfetivo(mC, totDe(CTX_EX.A));
    chk('v10 ano3 migrado: mesma trajetória (1/3, 2/3, todos)', JSON.stringify(cfgDoCaso(ceC, perfilFinal(ceC)).demanda.E.slice(1)) === JSON.stringify([4000, 8000, 12000]));
    const m2 = migrarCasoV10(Object.assign(clone(V10.B), { expansao: 'ano2' }));
    const ce2 = casoEfetivo(m2, totDe(CTX_EX.B));
    chk('v10 ano2 migrado: 1/3 no Ano 1 e todos no Ano 2', m2.expansao === 'ano1' && JSON.stringify(cfgDoCaso(ce2, perfilFinal(ce2)).demanda.E.slice(1)) === JSON.stringify([50000, 150000, 150000]));
    chk('migrarCasoV10 de caso vazio = CASO_VAZIO', JSON.stringify(migrarCasoV10({})) === JSON.stringify(Object.assign(clone(CASO_VAZIO), { testes: [], implantacao: { escolas: '', pessoas: '' }, expansao: 'ano1' })));
  }
  // casos combinados finitos
  {
    const extremos = { testes: ['poc', 'piloto'], internet: 'nao', modeloDisp: 'rotativo', dispExistem: 'nao', formados: ['professores', 'gestores', 'tecnica', 'administrativo'],
      formacaoFormato: 'hibrida', formacaoPaga: 'parceiro', suporteQuem: 'ambos', suporteNivel: 'dedicado', acompanhamento: 'intensivo', horizonte: 5, expansao: 'ano3',
      ferramentas: [{ nome: 'P' }, { nome: 'Q', tipoTec: 'paga', pagamento: 'usuario', preco: 3 }] };
    for (const k of ['A', 'B', 'C', 'D']) {
      const cfg = cfgDe(k, extremos), a = av(cfg);
      chk(k + ' com todas as respostas novas: finito e camadas fecham', Number.isFinite(a.ctEco) && a.linhas.every(l => l.v.every(Number.isFinite)) && near(soma(somaPorCamada(a).total), a.ctEco));
    }
    const vazio = casoEfetivo(clone(CASO_VAZIO), {});
    chk('caso em branco v11: finito', Number.isFinite(av(cfgDoCaso(vazio, perfilFinal(vazio))).ctEco));
  }
}

// (11) traduções das cadeias novas (PT → EN, ES, FR)
{
  const RE_NUM = /(?<![\p{L}\d.,])[-−+]?\d+(?:[.,  ]\d+)*/gu;
  const norm = s => { let i = 0; return s.replace(RE_NUM, () => '{' + (i++) + '}').replace(/\s+/g, ' ').trim(); };
  const dic = l => Object.assign({}, ...[l + '.json', 'extra_' + l + '.json', 'v9_p1_' + l + '.json', 'v11_s1_' + l + '.json'].map(f => {
    const p = path.join(__dirname, '..', 'i18n', f); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
  }));
  const txt = new Set();
  ['situacao', 'consequencias', 'linhaBase', 'impactos', 'teste', 'testeEfetivo', 'tarefas', 'tipoTec', 'pagamento', 'licenca', 'adaptacao', 'expansao', 'horizonte', 'simNao',
    'nFerramentas', 'conheceFerramentas', 'internet', 'modeloDisp', 'dispExistem', 'formados', 'formacaoTipo', 'formacaoFormato', 'formacaoPaga',
    'suporteQuem', 'suporteNivel', 'acompanhamento', 'arquitetura']
    .forEach(k => OPC[k].forEach(o => { [o[1], o[2]].forEach(x => { if (typeof x === 'string' && x) txt.add(x); }); }));
  Object.values(MOTIVOS_TESTE).forEach(x => txt.add(x));
  ['A tecnologia ainda não foi escolhida. A estimativa usa um produto pago por licença como premissa; o custo e a dependência mudam muito entre as opções.',
    'Uso cedido sem custo (valor de mercado)', 'Conexão das escolas sem internet adequada (ilustrativo)', 'Dispositivos a comprar (ilustrativo)',
    'Suporte do fornecedor', 'Licenças:', 'ferramenta', 'escola', 'dispositivo', 'usuário ativo por ano', 'Tempo de formação: professores',
    'Tempo de formação: gestores escolares', 'Tempo de formação: equipe técnica', 'Tempo de formação: equipe administrativa'].forEach(x => txt.add(x));
  Object.values(CASOS).forEach(c => (c.ferramentas || []).forEach(f => txt.add(f.nome)));
  Object.values(CASOS).forEach(c => [c.titulo, c.problema, c.resultado].forEach(x => txt.add(x)));
  Object.values(CTX_EX).forEach(c => [c.local, c.olhando, c.compOutro].forEach(x => { if (x) txt.add(x); }));
  for (const l of ['en', 'es', 'fr']) {
    const d = dic(l);
    const falta = [...txt].filter(s => d[s] == null && d[norm(s)] == null);
    chk('traduções ' + l + ': nenhuma cadeia nova sem tradução', falta.length === 0, falta);
  }
}

console.log('\nverificações: ' + ok + ' ok, ' + bad + ' falhas');
if (bad) process.exit(1);
