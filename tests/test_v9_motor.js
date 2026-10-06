// Testes do modelo do caso e do motor de custo da versão 9 (pacote P1).
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
  [{ tipoTec: 'aberta', arquiteturaManual: 'saas' }, 'saas'],
  [{ tipoTec: 'paga', arquiteturaManual: 'api' }, 'api'],
];
ARQ.forEach(([c, esp]) => chk('derivarArquitetura ' + JSON.stringify(c) + ' → ' + esp, derivarArquitetura(c) === esp, derivarArquitetura(c)));
chk('derivarArquitetura ignora a escolha manual quando pedido', derivarArquitetura({ tipoTec: 'aberta', arquiteturaManual: 'saas' }, true) === 'ow');
const presumida = c => casoEfetivo(Object.assign(clone(CASO_VAZIO), c), {}).__arqPresumida;
chk('__arqPresumida com tecnologia em branco', presumida({}) === true);
chk('__arqPresumida com "Ainda não sei"', presumida({ tipoTec: 'nao_sei' }) === true);
chk('sem __arqPresumida com tecnologia escolhida', presumida({ tipoTec: 'paga' }) === false);
chk('sem __arqPresumida com arquitetura manual', presumida({ tipoTec: 'nao_sei', arquiteturaManual: 'api' }) === false);

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
  chk(k + ': motor sem NaN', Number.isFinite(a.ctEco) && a.finAno.every(Number.isFinite));
  chk(k + ': exemplo de contexto e respostas', !!CTX_EX[k] && Object.keys(RESP_EX[k]).length === 6);
  RES[k] = { ce, p, cfg, a };
}
chk('B: demanda [6000, 50000, 150000, 150000] (preset C)', JSON.stringify(RES.B.cfg.demanda.E) === JSON.stringify([6000, 50000, 150000, 150000]), RES.B.cfg.demanda.E);
{ const cB = clone(RES.B.ce); cB.infra = 'complementar'; const aB = av(cfgDoCaso(cB, RES.B.p));
  chk('B com infra complementar: K1 com dispositivos e conectividade', ['K1.1', 'K1.2'].every(s => aB.porS[s] > 0));
  chk('B (infra = sim): sem K1', RES.B.a.porK.K1 === 0); }
chk('A: sem K1 (infra = sim)', RES.A.a.porK.K1 === 0);
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
  chk('parceiro paga depois: cedidoUso [0,1,1,1]', JSON.stringify(cParc.cedidoUso) === '[0,1,1,1]');
  // adaptação no caso: config < sob_medida
  const kA = n => av(cfgDoCaso(Object.assign(clone(RES.A.ce), { adaptacao: n }), RES.A.p)).porK.K3;
  chk('caso A: K3 com sob_medida > config', kA('sob_medida') > kA('config'));
  // adaptação no caso: com tipoTec e pagamento fixos, a arquitetura não muda e o total
  // (conta econômica) é não decrescente de config → conteudo → integracao → sob_medida
  const MONO = [
    ['A', { tipoTec: 'paga', pagamento: 'institucional' }, 'saas'],
    ['A', { tipoTec: 'paga', pagamento: 'usuario' }, 'saas'],
    ['A', { tipoTec: 'nao_sei', pagamento: 'institucional' }, 'saas'],
    ['D', { tipoTec: 'paga', pagamento: 'consumo', arquiteturaManual: '' }, 'api'],
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
  // horizonte de 5 anos e expansão em três anos
  const c5 = cfgDoCaso(Object.assign(clone(RES.A.ce), { horizonte: 5, expansao: 'ano3' }), RES.A.p);
  chk('horizonte 5: demanda com 6 posições e expansão em três anos', JSON.stringify(c5.demanda.E) === JSON.stringify([600, 4000, 8000, 12000, 12000, 12000]), c5.demanda.E);
  const a5 = av(c5);
  chk('horizonte 5: motor sem NaN', Number.isFinite(a5.ctEco) && a5.r.H === 5);
  // padrões do setup: PoC sem participantes → 15 pessoas e 2 meses; piloto → max(50, 5%) e 4 meses
  const cPoc = cfgDoCaso(Object.assign(clone(RES.A.ce), { teste: 'poc', piloto: { escolas: '', participantes: '', meses: '' } }), RES.A.p);
  chk('PoC sem setup: E0 = 15 e 2 meses', cPoc.demanda.E[0] === 15 && cPoc.demanda.meses[0] === 2);
  const cPil = cfgDoCaso(Object.assign(clone(RES.A.ce), { teste: 'piloto', piloto: {} }), RES.A.p);
  chk('piloto sem setup: E0 = 600 (5%) e 4 meses', cPil.demanda.E[0] === 600 && cPil.demanda.meses[0] === 4);
  // condições de base: valores ilustrativos de PREMISSAS_K1
  const cfgBc = cfgDoCaso(Object.assign(clone(RES.B.ce), { infra: 'complementar' }), RES.B.p);
  const disp = cfgBc.itens.find(x => x.s === 'K1.2');
  chk('K1.2 Ano 0 = 0,25 × E0 × 300', disp && disp.v[0] === PREMISSAS_K1.fracaoSemDispositivo * 6000 * PREMISSAS_K1.precoDispositivo);
  const con = cfgBc.itens.find(x => x.s === 'K1.1');
  chk('K1.1 Ano 0 = 600 × escolas do piloto; Ano 1 proporcional à rede', con && con.v[0] === 600 * 20 && con.v[1] === 600 * Math.round(600 * 50000 / 150000), con && con.v);
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
  chk('C → prova de conceito (tecnologia não escolhida)', rC.modo === 'poc' && rC.motivos.includes('a tecnologia ainda não foi escolhida'), rC);
  const rA = recomendarTeste(RES.A.ce);
  chk('A → piloto', rA.modo === 'piloto' && rA.motivos[0] === 'a tecnologia está escolhida' && rA.motivos.includes('há linha de base parcial'), rA);
  chk('D → prova de conceito (sob medida)', recomendarTeste(RES.D.ce).ids.includes('sob_medida'));
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

// (11) traduções das cadeias novas (PT → EN, ES, FR)
{
  const RE_NUM = /(?<![\p{L}\d.,])[-−+]?\d+(?:[.,  ]\d+)*/gu;
  const norm = s => { let i = 0; return s.replace(RE_NUM, () => '{' + (i++) + '}').replace(/\s+/g, ' ').trim(); };
  const dic = l => Object.assign({}, ...[l + '.json', 'extra_' + l + '.json', 'v9_p1_' + l + '.json'].map(f => {
    const p = path.join(__dirname, '..', 'i18n', f); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
  }));
  const txt = new Set();
  ['situacao', 'consequencias', 'linhaBase', 'impactos', 'teste', 'tarefas', 'tipoTec', 'pagamento', 'licenca', 'adaptacao', 'infra', 'expansao', 'horizonte', 'pagaDepois', 'fonte', 'simNao']
    .forEach(k => OPC[k].forEach(o => { [o[1], o[2]].forEach(x => { if (typeof x === 'string' && x) txt.add(x); }); }));
  Object.values(MOTIVOS_TESTE).forEach(x => txt.add(x));
  ['A tecnologia ainda não foi escolhida. A estimativa usa um produto pago por licença como premissa; o custo e a dependência mudam muito entre as opções.',
    'Dispositivos complementares (ilustrativo)', 'Conectividade incremental nas escolas (ilustrativo)', 'Uso cedido sem custo (valor de mercado)'].forEach(x => txt.add(x));
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
