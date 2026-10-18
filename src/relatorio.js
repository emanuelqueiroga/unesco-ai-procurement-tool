// =====================================================================
// v14 (BL6, BL5.3): plano de contratação em ordem de decisão.
// Dados e textos do relatório novo: resumo de uma página, cinco seções do corpo, gráficos, premissas e glossário.
// Fonte de dados: o motor (numerosCusto, avaliar, cenarios, tornado, simular), premissasDoCaso e glossarioLista.
// secoesPlano() (resumo.js) chama relComporPlano() com as seções antigas; a página (resumo.js) e o PDF (plano_pdf.js)
// leem a mesma lista, na mesma ordem. Textos em português (chave de tradução, i18n/v14_relatorio_*.json);
// {0}, {1}… são lugares de valores (trN). Nenhum número é inventado: o que o motor não calcula não aparece.
// A simulação de Monte Carlo usa semente fixa (REL_SEMENTE) para a página, o PDF e os testes darem o mesmo resultado.
// =====================================================================
const REL_N_SIM = 1500, REL_SEMENTE = 20261003;

const TXT_REL = {
  // resumo da primeira página
  sintese: 'Em resumo',
  sinteseAbre: 'Os números principais da estimativa ilustrativa e as cinco ações mais importantes.',
  kTco: 'Custo total do ciclo de vida (TCO)',
  kTcoFaixa: 'Faixa provável (P10 a P90): {0} a {1}',
  kTcoNotaD: 'Soma dos custos de todos os anos, em preços do Ano 0 e descontada à taxa de {0} ao ano. A faixa vem de {1} simulações; o valor central é o cenário esperado.',
  kTcoNota0: 'Soma dos custos de todos os anos, em preços do Ano 0 e sem desconto. A faixa vem de {0} simulações; o valor central é o cenário esperado.',
  kApr: 'Custo por aprendiz por ano',
  kProf: 'Custo por professor por ano',
  kUsu: 'Custo por usuário ativo por ano',
  kRegime: 'Custo anual em regime (Ano {0})',
  regimeDesemb: 'A rede desembolsa {0} nesse ano.',
  regimePlena: 'Primeiro ano em que o uso chega à escala plena.',
  regimeUltimo: 'A escala plena não é alcançada no horizonte: vale o último ano.',
  regimeDepois: 'Primeiro ano depois do fim do financiamento externo.',
  regimeFinanc: 'Há financiamento externo até o fim do horizonte: o valor inclui insumos cedidos.',
  direcionadores: 'O que mais move o custo',
  direcionadorFaixa: 'do mínimo ao máximo da faixa, o custo total muda de {0} a {1}',
  acoes5: 'As cinco ações mais importantes',
  quemAge: 'Quem age:',
  semAcoes: 'Ainda não há respostas suficientes para recomendar ações. Responda às perguntas das fases 1 a 4.',
  semCusto: 'Não foi possível calcular a estimativa com as respostas atuais.',
  // como ler
  comoLer: 'Como ler este plano',
  comoLer1: 'Este plano responde, em ordem, a cinco perguntas de quem decide: o que se compra, quanto custa e quando, o que pode mudar o custo, o que exigir na contratação e que governança é necessária. A primeira página resume tudo; os anexos trazem os detalhes.',
  comoLer2: 'Os valores são ilustrativos, a menos que o anexo de premissas cite uma fonte. Todos estão em preços do Ano 0.',
  comoLer3: 'Custo pago uma vez: implantação e compras iniciais. Custo recorrente: o que se repete todo ano. A faixa P10 a P90 mostra a incerteza: em 80% dos cenários simulados o custo fica dentro dela.',
  comoLer4: 'Em “Quem age”, a área indicada é a que costuma saber responder à pergunta que originou a ação; confirme com a sua equipe.',
  comoLer5: 'Os termos técnicos estão explicados no glossário, no fim.',
  // faltas (curta, perto do topo)
  faltasLink: 'Ver todas as respostas que faltam',
  kCentral: 'valor central',
  faltasMais: 'As primeiras estão abaixo; a lista completa está no anexo A.',
  // seções do corpo: pergunta
  q1: 'O que se compra',
  q2: 'O que custa e quando',
  q3: 'O que pode mudar o custo',
  q4: 'O que exigir na contratação',
  q5: 'Que governança é necessária',
  // seções do corpo: achado
  h1: 'A estimativa considera {0} pessoas usando em toda a rede',
  h1Padrao: 'A estimativa considera {0} pessoas usando em toda a rede (premissa padrão)',
  h1Sem: 'Os fatos do caso e a forma de começar',
  h2: 'Os custos recorrentes são {0} do total',
  h2Sem: 'O custo por fase e por ano ainda não pôde ser calculado',
  h3: 'O custo total pode ficar entre {0} e {1}',
  h3Sem: 'A incerteza do custo ainda não pôde ser calculada',
  h4Sair: 'Sair do contrato custaria {0}, ou {1} anos de custo recorrente',
  h4SairV: 'Sair do contrato custaria {0}',
  h4Req: 'O contrato deve cobrir {0} requisitos e cláusulas deste caso',
  h5Nenhuma: 'Nenhuma das {0} condições de governança está confirmada',
  h5Algumas: 'Estão confirmadas {0} de {1} condições de governança',
  h5Todas: 'Todas as {0} condições de governança estão confirmadas',
  // subtítulos
  sFatos: 'Fatos do caso',
  sPessoas: 'Quem seria alcançado',
  sFases: 'Custo por fase',
  sOrcamento: 'Dotação a solicitar por exercício',
  sCenarios: 'Cenários',
  sDirec: 'Direcionadores do custo',
  sSimula: 'Simulação de incerteza',
  sMaisCamadas: 'O que cada fase exige, por camada, está no anexo B.',
  // tabela de fases
  fFase: 'Fase',
  fAnos: 'Anos',
  fUnico: 'Pago uma vez',
  fRecorr: 'Recorrente',
  fTotal: 'Total',
  fPessoas: 'Pessoas alcançadas',
  fAprend: 'Aprendizes',
  fProfs: 'Professores',
  anoUm: 'Ano {0}',
  anosAte: 'Anos {0} a {1}',
  fNota: 'Valores na conta econômica, em valor presente. Pessoas alcançadas: o máximo de pessoas que teriam acesso à solução na fase. A saída entra na última fase.',
  // gráficos
  gFasesT: 'Custo por ano, por camada',
  gFasesS: 'Conta econômica, em preços do Ano 0, sem desconto ({0}); a saída entra no último ano',
  gFasesL: 'O maior custo anual é o do Ano {0}: {1}. Nele, a camada {2} ({3}) pesa mais, com {4} do ano.',
  gCamadasT: 'Custo por camada',
  gCamadasS: 'Total do ciclo de vida, por camada do quadro de Krueger e Jackson (2026)',
  gCamadasL: 'A camada {0} ({1}) concentra {2} do custo total; em seguida vem a camada {3} ({4}), com {5}.',
  gCamadasL1: 'A camada {0} ({1}) concentra {2} do custo total.',
  gAdocaoT: 'Adoção e pessoas alcançadas',
  gAdocaoS: 'Pessoas que teriam acesso e pessoas que usam de fato, por ano',
  gAdocaoL: 'No Ano {0}, {1} pessoas teriam acesso à solução e {2} ({3}) a usariam de fato.',
  gAcesso: 'Pessoas que teriam acesso',
  gUso: 'Pessoas que usam de fato',
  gCenariosT: 'Cenários lado a lado',
  gCenariosS: 'Custo total do ciclo de vida, pago uma vez e recorrente',
  gCenariosL: 'No cenário de estresse o custo total chega a {0}, {1} acima do esperado ({2}).',
  gCenariosL0: 'Os três cenários têm o mesmo custo total: {0}.',
  gUnico: 'Pago uma vez',
  gRecorr: 'Recorrente',
  cenAlta: 'Mais pessoas usam: adoção 50% maior, até 90%.',
  cenEstresse: 'Alta adoção, com preços, câmbio e consumo maiores.',
  cenEsperado: 'As premissas do caso.',
  gTornadoT: 'O que mais move o custo',
  gTornadoS: 'Efeito sobre o custo total quando cada direcionador vai ao mínimo ou ao máximo da sua faixa; os demais ficam no valor provável',
  gTornadoL: 'O direcionador que mais pesa é {0}: do mínimo ao máximo da faixa, o custo total muda de {1} a {2}.',
  gReduz: 'No mínimo da faixa',
  gAumenta: 'No máximo da faixa',
  gBase: 'Custo central: {0}',
  // simulação
  simSaida: 'Saída',
  simCt: 'Custo total do ciclo de vida',
  simDot: 'Dotação total nos exercícios',
  simRisco: 'Custo em risco (P90 menos P50)',
  simNota: '{0} cenários, com semente fixa {1}: o mesmo caso dá sempre o mesmo resultado. Em cada cenário, os direcionadores variam dentro das suas faixas (distribuição triangular, com o valor mais provável no valor central). As faixas são convenções do guia, não medidas.',
  // anexos
  anexos: 'Anexos',
  anexosAbre: 'Detalhes de apoio ao corpo do plano.',
  anexo: 'Anexo {0}',
  aA: 'Respostas do caso',
  aB: 'O que cada fase exige, por camada',
  aC: 'Recomendações, por momento',
  aD: 'Como o custo é calculado',
  aE: 'Requisitos e cláusulas para a contratação',
  aF: 'Governança em detalhe',
  aG: 'Premissas e fontes',
  aH: 'Glossário',
  aI: 'Referências e créditos',
  faltasTodas: 'Respostas que faltam',
  faltasDemais: 'Demais respostas que faltam',
  faltasDemaisP: 'As cinco primeiras estão na página 2; aqui estão as demais.',
  recsResto: 'As cinco primeiras ações estão no resumo, na primeira página; aqui estão as demais, por momento.',
  recsTodas: 'Todas as ações estão no resumo, na primeira página.',
  // premissas
  pPremissa: 'Premissa',
  pValor: 'Valor',
  pOrigem: 'Origem',
  pFonte: 'Fonte e ano',
  pGrau: 'Grau',
  pFaixa: 'Faixa de referência',
  pFora: 'Fora da faixa',
  pSemFaixa: 'sem faixa',
  pIntro: 'Todos os valores que o cálculo usou, com a origem de cada um. Valores fora da faixa de referência estão marcados e destacados.',
  pGraus: 'Graus: A, estatística oficial; B, estudo ou registro de compra; C, estimativa de especialista ou convenção da ferramenta.',
  pVazio: 'Nenhuma premissa com valor.',
  pAno: 'ano {0}',
  pSemFonte: 'sem fonte informada',
  metodos: 'Como o modelo funciona hoje',
  met1: 'O modelo calcula o custo de cada ano em duas contas: a econômica (preços do Ano 0, com o tempo das equipes da rede e os insumos cedidos, descontada à taxa real informada) e a orçamentária (preços correntes, só o que a rede desembolsa).',
  met2: 'Os custos são distribuídos pelas sete camadas do quadro de Krueger e Jackson (2026) e pelas fases do caso. Essa distribuição é uma convenção desta ferramenta.',
  met3: 'Três cenários são comparados: o esperado, o de alta adoção (adoção 50% maior, até 90%) e o de estresse (alta adoção com preços, câmbio e consumo maiores).',
  met4: 'A simulação de Monte Carlo sorteia {0} vezes os direcionadores dentro de faixas plausíveis, com choques comuns de adoção e câmbio e semente fixa ({1}). P10 e P90 são os percentis 10 e 90 do custo total; a faixa mostrada nunca exclui o valor central.',
  met5: 'Limites: as faixas dos direcionadores são convenções do guia, não medidas; a simulação não inclui riscos de contrato, mudanças na lei nem erros nos dados; o modelo não estima benefícios nem efeito na aprendizagem; o custo de saída depende do fechamento escolhido.',
  met6: 'Os valores são ilustrativos, salvo os que a tabela dá como dado do país ou da região, ou com fonte de grau A ou B.',
  verRef: 'Base de referências v{0} ({1}, {2} linhas); perfis de país v{3} ({4}, {5} países).',
  // glossário
  gTermo: 'Termo',
  gSignif: 'Significado',
  gIntro: 'Termos técnicos e orçamentários, em linguagem simples.',
  // texto leve
  aprendizes: 'aprendizes',
  professores: 'professores',
};
const trN = (t, ...v) => String(tr(t)).replace(/\{(\d+)\}/g, (_, i) => v[+i] != null ? v[+i] : '');
const R14 = (k, ...v) => trN(TXT_REL[k], ...v);
// Todos os textos novos (para os testes de tradução)
function textosRelatorio() { return Object.values(TXT_REL); }

const relMais = (x, s) => (x < 0 ? '−' : '+') + s;
const relSinal = x => (Math.abs(x) < 0.5 ? grande(0) : relMais(x, grande(Math.abs(x))));
const relCap = s => { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };

// ----------------------------------------------------------- dados
let REL_CACHE = null;
// Parte cara (simulação, tornado, cenários) guardada por caso: página, PDF e testes chamam várias vezes
function relPesado(cfg) {
  const chave = JSON.stringify(cfg);
  if (REL_CACHE && REL_CACHE.chave === chave) return REL_CACHE;
  const sim = simular(cfg, REL_N_SIM, REL_SEMENTE);
  const tor = tornado(cfg);
  const cs = cenarios(cfg);
  const cen = ['Esperado', 'Alta adoção', 'Estresse'].map(nome => {
    const a = avaliar(cs[nome]);
    return { nome, ct: a.ctEco, unico: a.fases.unico, rec: a.fases.recorrente };
  });
  REL_CACHE = { chave, sim, tor, cen };
  return REL_CACHE;
}
// Números do relatório novo, ou null se a estimativa não puder ser calculada
function relDados(n) {
  try {
    n = n || numerosCusto();
    if (!n || !n.av || !n.av.tco) return null;
    const cfg = cfgAtual(); garantirOpc(cfg);
    const av = n.av, tco = av.tco, H = av.r.H, T = av.r.anos;
    const P = relPesado(cfg);
    const central = tco.tcoDescontado;
    // a faixa nunca exclui o valor central (a distribuição é assimétrica)
    const lo = Math.min(P.sim.ct.p10, central), hi = Math.max(P.sim.ct.p90, central);
    const apr = tco.custoPorAprendizAno != null ? { v: tco.custoPorAprendizAno, k: 'kApr' }
      : tco.custoPorProfessorAno != null ? { v: tco.custoPorProfessorAno, k: 'kProf' } : { v: n.ind.icu, k: 'kUsu' };
    const sc = n.camadas || somaPorCamada(av);
    const anual = tco.anual;
    // custo por ano, por camada (conta econômica, preços do Ano 0); a saída entra no último ano
    const anos = T.map(t => {
      const v = [1, 2, 3, 4, 5, 6, 7].map(k => (sc.porAno[k] || [])[t] || 0);
      if (t === H) av.saida.forEach(x => { v[(CAMADA_DE_S[x.s] || 7) - 1] += x.eco; });
      return { t, fase: av.fases.faseAno[t], v, total: v.reduce((a, b) => a + b, 0) };
    });
    const camTot = [1, 2, 3, 4, 5, 6, 7].map(k => sc.total[k] || 0);
    const fases = av.fases.ids.map(id => av.fases.porFase[id]).filter(f => f.anos.length);
    return { n, cfg, av, tco, H, T, P, sim: P.sim, central, lo, hi, apr, anual, anos, camTot, fases, tor: P.tor, cen: P.cen,
      ano0: (av.ecoAno || [])[0] || 0, E: av.r.E, U: av.r.U };
  } catch (e) { console.warn(e); return null; }
}

// ----------------------------------------------------------- resumo da primeira página
function relQuem(r) {
  const passo = String((r && r.ir) || '').split(':')[1];
  const a = passo && typeof PASSO_AJUDA !== 'undefined' ? PASSO_AJUDA[passo] : null;
  return a && a.quem ? relCap(tr(a.quem)) : '';
}
function relNotaRegime(an) {
  if (an.rotulo === 'ultimo_ano_do_horizonte') return R14('regimeUltimo');
  if (an.rotulo === 'depois_do_financiamento') return R14('regimeDepois');
  if (an.rotulo === 'financiamento_ate_o_fim') return R14('regimeFinanc');
  return R14('regimePlena');
}
function relSintese(d, recs, principal) {
  const o = { pronto: true, tipo: 'sintese', id: 'sintese', h: tr(TXT_REL.sintese), p: [R14('sinteseAbre')], principal: principal ? tr(principal) : '' };
  const top = (recs || []).slice(0, 5).map((r, i) => ({ n: i + 1, texto: tr(r.texto), quem: relQuem(r), tipo: tr(TIPO_REC[r.tipo] || r.tipo), prio: r.prioridade,
    quando: tr((QUANDO_REC.find(z => z[0] === r.quando) || ['', r.quando])[1]), id: r.id, ir: r.ir || '' }));
  o.recs = top;
  if (!d) { o.semCusto = R14('semCusto'); o.kv = []; o.list = top.map(r => r.texto); return o; }
  const rD = d.tco.r;
  const direc = d.tor.rows.slice(0, 3);
  const mx = Math.max(1e-9, ...direc.map(r => Math.max(Math.abs(r.lo), Math.abs(r.hi))));
  o.d = {
    central: d.central, lo: d.lo, hi: d.hi, centralTxt: grande(d.central), loTxt: grande(d.lo), hiTxt: grande(d.hi),
    faixaTxt: R14('kTcoFaixa', grande(d.lo), grande(d.hi)),
    nota: rD ? R14('kTcoNotaD', pct(rD, rD < 0.1 ? 1 : 0), fmtInt(d.sim.N)) : R14('kTcoNota0', fmtInt(d.sim.N)),
    kpis: [
      { id: 'apr', v: din(d.apr.v, 2), l: R14(d.apr.k) },
      { id: 'ano0', v: grande(d.ano0), l: tr('Custo do Ano 0 (prova de conceito ou piloto)') },
      { id: 'regime', v: grande(d.anual.eco), l: R14('kRegime', d.anual.ano), nota: relNotaRegime(d.anual) + ' ' + R14('regimeDesemb', grande(d.anual.desembolso)) },
    ],
    drivers: direc.map(r => ({ nome: tr(r.nome), faixa: '×' + numP(r.min, 2) + ' – ×' + numP(r.max, 2), lo: r.lo, hi: r.hi, loTxt: relSinal(r.lo), hiTxt: relSinal(r.hi),
      txt: R14('direcionadorFaixa', relSinal(r.lo), relSinal(r.hi)), w: Math.max(Math.abs(r.lo), Math.abs(r.hi)) / mx })),
  };
  o.kv = [[R14('kTco'), grande(d.central)], [R14('kTcoFaixa', grande(d.lo), grande(d.hi)), ''], [R14(d.apr.k), din(d.apr.v, 2)],
    [tr('Custo do Ano 0 (prova de conceito ou piloto)'), grande(d.ano0)], [R14('kRegime', d.anual.ano), grande(d.anual.eco)]]
    .concat(o.d.drivers.map((x, i) => [(i + 1) + '. ' + x.nome, x.txt]));
  o.list = top.map(r => r.texto + (r.quem ? ' (' + R14('quemAge') + ' ' + r.quem + ')' : ''));
  return o;
}

// ----------------------------------------------------------- gráficos (dados já traduzidos e formatados)
const relCamNome = n => tr(nomeCamada(n));
function relGraficos(d) {
  if (!d) return null;
  const G = {};
  // 1. custo por ano, por camada, com as fases
  const maxA = Math.max(...d.anos.map(a => a.total));
  const iMax = d.anos.findIndex(a => a.total === maxA);
  const aMax = d.anos[iMax >= 0 ? iMax : 0];
  const kMax = aMax.v.indexOf(Math.max(...aMax.v)) + 1;
  G.fases = { tipo: 'fases', id: 'g-fases', h: R14('gFasesT'), sub: R14('gFasesS', unidMil()),
    leitura: R14('gFasesL', aMax.t, grande(aMax.total), kMax, relCamNome(kMax), pct(aMax.total ? aMax.v[kMax - 1] / aMax.total : 0)),
    anos: d.anos.map(a => ({ t: a.t, rot: tr('Ano ' + a.t), fase: a.fase, faseNome: tr((FASES_MOTOR.find(z => z[0] === a.fase) || ['', a.fase])[1]), v: a.v, total: a.total, totTxt: mil(a.total) })),
    camadas: [1, 2, 3, 4, 5, 6, 7].map(k => ({ n: k, nome: relCamNome(k) })) };
  // 2. custo por camada
  const tot = d.camTot.reduce((a, b) => a + b, 0);
  const ord = d.camTot.map((v, i) => [v, i + 1]).sort((a, b) => b[0] - a[0]);
  G.camadas = { tipo: 'camadas', id: 'g-camadas', h: R14('gCamadasT'), sub: R14('gCamadasS'),
    leitura: ord[1] && ord[1][0] > 0 ? R14('gCamadasL', ord[0][1], relCamNome(ord[0][1]), pct(tot ? ord[0][0] / tot : 0), ord[1][1], relCamNome(ord[1][1]), pct(tot ? ord[1][0] / tot : 0))
      : R14('gCamadasL1', ord[0][1], relCamNome(ord[0][1]), pct(tot ? ord[0][0] / tot : 0)),
    vals: d.camTot, tot, valsTxt: d.camTot.map(grande), pcts: d.camTot.map(v => pct(tot ? v / tot : 0)), totTxt: grande(tot), H: d.H,
    camadas: [1, 2, 3, 4, 5, 6, 7].map(k => ({ n: k, nome: relCamNome(k) })) };
  // 3. adoção e pessoas alcançadas
  const iH = d.T.length - 1, EH = d.E[iH], UH = d.U[iH];
  G.adocao = { tipo: 'adocao', id: 'g-adocao', h: R14('gAdocaoT'), sub: R14('gAdocaoS'),
    leitura: R14('gAdocaoL', d.H, fmtInt(EH), fmtInt(UH), pct(EH ? UH / EH : 0)),
    anos: d.T.map(t => ({ t, rot: tr('Ano ' + t), E: d.E[t], U: d.U[t], ad: d.E[t] ? d.U[t] / d.E[t] : 0, eTxt: fmtInt(d.E[t]), uTxt: fmtInt(d.U[t]), adTxt: pct(d.E[t] ? d.U[t] / d.E[t] : 0) })),
    leg: [R14('gAcesso'), R14('gUso')] };
  // 4. cenários lado a lado
  const esp = d.cen[0], est = d.cen[2];
  const desc = { 'Esperado': R14('cenEsperado'), 'Alta adoção': R14('cenAlta'), 'Estresse': R14('cenEstresse') };
  G.cenarios = { tipo: 'cenarios', id: 'g-cenarios', h: R14('gCenariosT'), sub: R14('gCenariosS'),
    leitura: est.ct - esp.ct > 1 ? R14('gCenariosL', grande(est.ct), pct((est.ct - esp.ct) / esp.ct), grande(esp.ct)) : R14('gCenariosL0', grande(esp.ct)),
    itens: d.cen.map(c => ({ nome: tr(c.nome), desc: desc[c.nome], unico: c.unico, rec: c.rec, total: c.ct, totTxt: grande(c.ct), unicoTxt: grande(c.unico), recTxt: grande(c.rec) })),
    leg: [R14('gUnico'), R14('gRecorr')] };
  // 5. tornado
  const rows = d.tor.rows.slice(0, 6);
  const mx = Math.max(1e-9, ...rows.map(r => Math.max(Math.abs(r.lo), Math.abs(r.hi))));
  const r0 = rows[0];
  G.tornado = { tipo: 'tornado', id: 'g-tornado', h: R14('gTornadoT'), sub: R14('gTornadoS'),
    leitura: r0 ? R14('gTornadoL', tr(r0.nome), relSinal(r0.lo), relSinal(r0.hi)) : '',
    base: d.central, baseTxt: R14('gBase', grande(d.central)), max: mx,
    linhas: rows.map(r => ({ nome: tr(r.nome), faixa: '×' + numP(r.min, 2) + ' – ×' + numP(r.max, 2), lo: r.lo, hi: r.hi, loTxt: relSinal(r.lo), hiTxt: relSinal(r.hi) })),
    leg: [R14('gReduz'), R14('gAumenta')] };
  Object.values(G).forEach(g => { g.p = [g.leitura]; g.pronto = true; });
  return G;
}

// ----------------------------------------------------------- tabelas
function relTabelaFases(d) {
  const L = d.fases;
  const temA = L.some(f => f.aprendizes > 0), temP = L.some(f => f.professores > 0);
  const u = ' (' + unidMil() + ')';
  const head = [R14('fFase'), R14('fAnos'), R14('fUnico') + u, R14('fRecorr') + u, R14('fTotal') + u, R14('fPessoas')].concat(temA ? [R14('fAprend')] : []).concat(temP ? [R14('fProfs')] : []);
  const anos = f => f.anos.length === 1 ? R14('anoUm', f.anos[0]) : R14('anosAte', f.anos[0], f.anos[f.anos.length - 1]);
  const rows = L.map(f => [tr((FASES_MOTOR.find(z => z[0] === f.id) || ['', f.id])[1]), anos(f), mil(f.unico), mil(f.recorrente), mil(f.total), fmtInt(f.pessoas)]
    .concat(temA ? [f.aprendizes > 0 ? fmtInt(f.aprendizes) : '—'] : []).concat(temP ? [f.professores > 0 ? fmtInt(f.professores) : '—'] : []));
  const s = k => L.reduce((a, f) => a + f[k], 0), mxp = k => Math.max(0, ...L.map(f => f[k] || 0));
  rows.push([tr('Total'), '', mil(s('unico')), mil(s('recorrente')), mil(s('total')), fmtInt(mxp('pessoas'))]
    .concat(temA ? [fmtInt(mxp('aprendizes'))] : []).concat(temP ? [fmtInt(mxp('professores'))] : []));
  return { head, rows, num: head.map((h, i) => i).filter(i => i >= 2), b0: true, larg: [] };
}
function relTabelaSimulacao(d) {
  const q = (a, f) => f(a);
  const lin = (rot, a) => [rot, mil(a.p10), mil(a.p50), mil(a.p90), mil(a.p90 - a.p50)];
  return { head: [R14('simSaida') + ' (' + unidMil() + ')', 'P10', 'P50', 'P90', R14('simRisco')],
    rows: [lin(R14('simCt'), d.sim.ct), lin(R14('simDot'), d.sim.dotTot)], num: [1, 2, 3, 4], b0: true };
}

// ----------------------------------------------------------- premissas e fontes (BL6.4)
function relValorPremissa(p) {
  const def = typeof PAIS_CAMPO_POR_ID !== 'undefined' ? PAIS_CAMPO_POR_ID[p.campo] : null;
  const v = p.valor;
  if (Array.isArray(v)) return v.join(', ');
  if (!Number.isFinite(+v)) return String(v);
  const u = String(p.unidade || '');
  if (def) {
    if (def.tipo === 'frac') return pct(+v, 1);
    if (def.tipo === 'pct100') return numP(+v, 1) + '%';
    if (def.tipo === 'usd') return din(+v, 0);
    return fmtInt(+v);
  }
  if (/^US\$|^USD/.test(u) || /US\$/.test(u)) return din(+v, Math.abs(+v) < 100 ? 2 : 0);
  if (/fração|fraçao|%/.test(u) && Math.abs(+v) <= 1.5) return pct(+v, 1);
  return numP(+v, Math.abs(+v) < 10 ? 2 : 0);
}
function relFaixaPremissa(p) {
  if (p.baixo == null || p.alto == null || !(+p.alto > +p.baixo)) return R14('pSemFaixa');
  return relValorPremissa(Object.assign({}, p, { valor: p.baixo })) + ' – ' + relValorPremissa(Object.assign({}, p, { valor: p.alto }));
}
function relPremissas() {
  let L = [];
  try { L = premissasDoCaso(S.caso, cfgAtual()) || []; } catch (e) { console.warn(e); L = []; }
  const rows = L.map(p => {
    const unid = p.unidade ? tr(p.unidade) : '';
    return [tr(p.rotulo) + (unid ? ' (' + unid + ')' : ''), relValorPremissa(p), tr(ORIGEM_ROTULO[p.origem] || p.origem),
      [p.fonte ? tr(p.fonte) : R14('pSemFonte'), p.ano != null ? R14('pAno', p.ano) : ''].filter(Boolean).join(', '),
      p.grau || '—', (p.foraDaFaixa ? R14('pFora') + ': ' : '') + relFaixaPremissa(p)];
  });
  const hl = L.map((p, i) => p.foraDaFaixa ? i : -1).filter(i => i >= 0);
  const v = typeof versaoReferencias === 'function' ? versaoReferencias() : null;
  const out = [];
  out.push({ pronto: true, sub: true, id: 'premissas', aberto: true, h: R14('aG'), p: [R14('pIntro')], marcaFora: R14('pFora'),
    table: rows.length ? { head: [R14('pPremissa'), R14('pValor'), R14('pOrigem'), R14('pFonte'), R14('pGrau'), R14('pFaixa')], rows, hl, larg: [138, 62, 62, 100, 28, 0] } : null,
    pos: rows.length ? [R14('pGraus')] : [R14('pVazio')] });
  const met = ['met1', 'met2', 'met3'].map(k => R14(k)).concat([R14('met4', fmtInt(REL_N_SIM), REL_SEMENTE), R14('met5'), R14('met6')]);
  out.push({ pronto: true, sub: true, id: 'metodos', h: R14('metodos'), list: met,
    pos: v ? [R14('verRef', v.referencias, v.atualizado, v.linhas, v.paises, v.paisesAtualizado, v.nPaises)] : [] });
  return out;
}
function relGlossario() {
  let L = [];
  try { L = glossarioLista(LANG) || []; } catch (e) { console.warn(e); }
  return { pronto: true, sub: true, id: 'glossario', aberto: true, h: R14('aH'), p: [R14('gIntro')],
    table: { head: [R14('gTermo'), R14('gSignif')], rows: L.map(g => [g.termo + (g.extenso ? ' (' + g.extenso + ')' : ''), g.definicao]), b0: true, larg: [140] } };
}

// ----------------------------------------------------------- composição do plano
// S_ = seções do plano antigo (resumo.js); devolve a lista na ordem de decisão: página 1, corpo (1 a 5) e anexos.
function relComporPlano(S_, d) {
  const by = id => S_.find(s => s.id === id && !s.sub);
  const subsDe = id => { const i = S_.indexOf(by(id)); const o = []; if (i < 0) return o; for (let j = i + 1; j < S_.length && S_[j].sub; j++) o.push(S_[j]); return o; };
  const sub = (s, extra) => s ? Object.assign({}, s, { sub: true, h: s.id && TIT_PLANO[s.id] ? tr(TIT_PLANO[s.id]) : s.h }, extra || {}) : null;
  const subH = (s, h) => s ? Object.assign({}, s, { sub: true }, h ? { h } : {}) : null;
  const L = [];
  const add = (...xs) => xs.flat().forEach(x => { if (x) L.push(x); });
  const nums = relDados(d.custo);
  const G = relGraficos(nums);
  const gq = typeof govQuestoes === 'function' ? govQuestoes() : [];
  const resp = S.resp || {};
  const nSim = gq.filter(q => resp[q.id] === 'sim').length;
  let recs = [];
  try { recs = recomendacoesCaso() || []; } catch (e) { console.warn(e); }
  const a1 = by('A1');

  // ---- primeira página, "como ler" e faltas (curtas)
  add(relSintese(nums, recs, a1 ? a1.principal : ''));
  add({ pronto: true, tipo: 'caixa', id: 'comoler', h: R14('comoLer'), list: ['comoLer1', 'comoLer2', 'comoLer3', 'comoLer4', 'comoLer5'].map(k => R14(k)) });
  const fa = by('faltas');
  if (fa) {
    const n = fa.list.length, K = 5;
    add(Object.assign({}, fa, { tipo: 'faltas', curta: true, list: fa.list.slice(0, K), irs: fa.irs.slice(0, K), total: n,
      p: fa.p.slice(0, 1).concat(n > K ? [R14('faltasMais')] : fa.p.slice(1, 2)) }));
  }

  // ---- 1. O que se compra
  const eleg = nums ? Math.round(nums.E[nums.E.length - 1]) : 0;
  const padrao = !!(d.ce && d.ce.__elegPadrao);
  add({ pronto: true, tipo: 'princ', id: 's1', num: '1', rotulo: R14('q1'), h: eleg > 0 ? R14(padrao ? 'h1Padrao' : 'h1', fmtInt(eleg)) : R14('h1Sem') });
  const res = by('resumo');
  if (res && res.fatos && res.fatos.length) add({ sub: true, tipo: 'fatos', id: 'fatos', h: R14('sFatos'), fatos: res.fatos, kv: res.fatos });
  add(sub(a1));
  add(S_.find(s => s.sub && s.h === 'Ferramentas' && s.table) ? subH(S_.find(s => s.sub && s.h === 'Ferramentas' && s.table)) : null);
  add(sub(by('A4')));
  if (G) add(Object.assign({ sub: true }, G.adocao));

  // ---- 2. O que custa e quando
  if (nums) {
    const pr = nums.tco.pRecorrente;
    add({ pronto: true, tipo: 'princ', id: 's2', num: '2', rotulo: R14('q2'), h: R14('h2', pct(pr)) });
    add({ pronto: true, sub: true, id: 'fases', h: R14('sFases'), table: relTabelaFases(nums), pos: [R14('fNota')] });
    add(Object.assign({ sub: true }, G.fases), Object.assign({ sub: true }, G.camadas));
    const orc = subsDe('A2').find(s => s.h === 'Dotação a solicitar por exercício');
    add(orc ? subH(orc, R14('sOrcamento')) : null);
    const alertas = subsDe('A3').find(s => s.h === 'Pontos de atenção de custo neste caso');
    add(alertas ? subH(alertas) : null);
    add({ pronto: true, sub: true, tipo: 'nota', id: 'ref-matriz', p: [R14('sMaisCamadas')] });
  } else {
    add({ pronto: true, tipo: 'princ', id: 's2', num: '2', rotulo: R14('q2'), h: R14('h2Sem') }, { pronto: true, sub: true, tipo: 'nota', id: 'sem-custo', p: [R14('semCusto')] });
  }

  // ---- 3. O que pode mudar o custo
  if (nums) {
    add({ pronto: true, tipo: 'princ', id: 's3', num: '3', rotulo: R14('q3'), h: R14('h3', grande(nums.lo), grande(nums.hi)) });
    add(Object.assign({ sub: true }, G.cenarios), Object.assign({ sub: true }, G.tornado));
    add({ pronto: true, sub: true, id: 'simulacao', h: R14('sSimula'), table: relTabelaSimulacao(nums), pos: [R14('simNota', fmtInt(nums.sim.N), nums.sim.seed)] });
  } else {
    add({ pronto: true, tipo: 'princ', id: 's3', num: '3', rotulo: R14('q3'), h: R14('h3Sem') }, { pronto: true, sub: true, tipo: 'nota', id: 'sem-custo3', p: [R14('semCusto')] });
  }

  // ---- 4. O que exigir na contratação (bloco A: requisitos e dependência; as tabelas longas vão aos anexos)
  const a5 = by('A5'), a6 = by('A6');
  const nReq = a5 && a5.table ? a5.table.rows.length : 0;
  let h4;
  if (nums && nums.tco && d.custo.orc && d.custo.orc.saida > 0) {
    const ap = (d.custo.ind || {}).anosParaSair;
    h4 = ap ? R14('h4Sair', grande(d.custo.orc.saida), numP(ap, 1)) : R14('h4SairV', grande(d.custo.orc.saida));
  } else h4 = R14('h4Req', fmtInt(nReq + (a5 && a5.list ? a5.list.length : 0)));
  add({ pronto: true, tipo: 'princ', id: 's4', num: '4', rotulo: R14('q4'), h: h4 });
  if (a5) add(Object.assign({}, a5, { sub: true, h: tr(TIT_PLANO.A5), table: null }));
  add(sub(a6), subH(subsDe('A6')[0]));

  // ---- 5. Que governança é necessária (bloco B: o essencial; o detalhe vai ao anexo F)
  const nG = gq.length;
  add({ pronto: true, tipo: 'princ', id: 's5', num: '5', rotulo: R14('q5'), h: nSim === 0 ? R14('h5Nenhuma', nG) : nSim >= nG ? R14('h5Todas', nG) : R14('h5Algumas', nSim, nG) });
  add(sub(by('B1')), sub(by('B2')), sub(by('B3')));
  const b5 = by('B5');
  if (b5) add(Object.assign({}, b5, { sub: true, h: tr(TIT_PLANO.B5), table: null }));
  const sB5 = subsDe('B5');
  add(sB5.filter(s => s.h === 'Forma de supervisão indicada' || s.h === 'Pontos de atenção' || s.h === 'Nota normativa').map(s => subH(s)));
  add(sub(by('B6')));
  const b8 = by('B8');
  if (b8) add(Object.assign({}, b8, { sub: true, h: tr(TIT_PLANO.B8), table: null }));

  // ---- anexos
  add({ pronto: true, tipo: 'anexos', id: 'anexos', h: R14('anexos'), p: [R14('anexosAbre')] });
  const anexo = (letra, id, h) => add({ pronto: true, tipo: 'anexo', id: 'anexo-' + id, letra, h });
  anexo('A', 'a', R14('aA'));
  const temFerr = S_.some(z => z.sub && z.h === 'Ferramentas' && z.table);
  if (res) add(Object.assign({}, res, { sub: true, tipo: 'perfil', h: tr(TIT_PLANO.resumo),
    cartoes: (res.cartoes || []).map(z => Object.assign({}, z, temFerr && z.id === 'adocao' ? { table: null, hTable: '' } : {},
      { kv: z.kv.filter(([, v]) => v != null && String(v).trim() !== '' && String(v).trim() !== '—') })).filter(z => z.kv.length || z.table),
    kv: (res.kv || []).filter(([, v]) => v != null && String(v).trim() !== '' && String(v).trim() !== '—') }));   // o que não foi respondido está na lista de respostas que faltam
  if (fa) {
    const K = 5, n = fa.list.length;
    if (n > K) add(Object.assign({}, fa, { tipo: 'faltas', sub: true, curta: false, pronto: false, h: R14('faltasDemais'), list: fa.list.slice(K), irs: fa.irs.slice(K), p: [R14('faltasDemaisP')] }));
  }
  anexo('B', 'b', R14('aB'));
  const mx = by('matriz'); if (mx) add(Object.assign({}, mx, { sub: true, tipo: 'matriz' }));
  anexo('C', 'c', R14('aC'));
  const rc = by('recs');
  if (rc) add(Object.assign({}, rc, { sub: true, tipo: 'recs', resto: 5, p: recs.length ? [recs.length > 5 ? R14('recsResto') : R14('recsTodas')] : rc.p }));
  anexo('D', 'd', R14('aD'));
  const a2 = by('A2');
  if (a2) {
    // o resumo da primeira página já traz o TCO, o Ano 0 e o custo de sair; aqui ficam só os indicadores que não aparecem lá
    const jaNoResumo = ['Custo do Ano 0 (prova de conceito ou piloto)', 'Custo total do ciclo de vida', 'Custo de sair, em anos de custo recorrente'];
    add(Object.assign({}, a2, { sub: true, h: tr(TIT_PLANO.A2), kpis: false, graf: null, kv: (a2.kv || []).filter(([k]) => !jaNoResumo.includes(k)) }));
    // fora: o que os gráficos e a tabela de premissas (anexo G) já mostram
    const repetidos = ['Dotação a solicitar por exercício', 'Como ler a estimativa', 'Custo por camada', 'Premissas desta estimativa'];
    const derivado = ['Pessoas que poderiam usar:', 'Nem todas usam.', 'Usuários ativos no Ano', 'Caminho da demanda:', 'Ano 0: piloto', 'Ano 1: primeira etapa', 'Depois, o uso cresce', 'Preço da licença:', 'Custo por pessoa formada:', 'Preços e quantidades de partida:'];
    subsDe('A2').forEach(s => {
      if (repetidos.includes(s.h)) return;
      if (s.h === 'Como o custo é calculado') s = Object.assign({}, s, { p: (s.p || []).slice(0, 1) });
      if (s.h === 'De onde vêm os números') s = Object.assign({}, s, { list: (s.list || []).filter(z => !derivado.some(d => String(z).startsWith(d))) });
      add(subH(s));
    });
  }
  anexo('E', 'e', R14('aE'));
  subsDe('A1').forEach(s => add(subH(s)));
  const clB = subsDe('B6').find(z => z.h === 'Cláusulas de dados e de verificação' && z.table);
  if (a5 && a5.table) add({ sub: true, id: 'clausulas', h: tr(TIT_PLANO.A5), table: clB ? Object.assign({}, a5.table, { rows: a5.table.rows.concat(clB.table.rows) }) : a5.table });
  const a3 = by('A3');
  if (a3) { add(sub(a3)); subsDe('A3').filter(s => s.h !== 'Pontos de atenção de custo neste caso').forEach(s => add(subH(s))); }
  subsDe('A4').forEach(s => add(subH(s)));
  add(sub(by('A7')));
  anexo('F', 'f', R14('aF'));
  add(sub(by('B4')));
  if (b5 && b5.table) add({ sub: true, id: 'dimensoes', h: tr(TIT_PLANO.B5), table: b5.table });
  add(sB5.filter(s => s.h === 'Premissas deduzidas das tarefas escolhidas').map(s => subH(s)));
  subsDe('B6').forEach(s => { if (!(s.h === 'Cláusulas de dados e de verificação' && s.table)) add(subH(s)); });
  add(sub(by('B7')), subsDe('B7').map(s => subH(s)));
  if (b8 && b8.table) add({ sub: true, id: 'metricas', h: tr(TIT_PLANO.B8), table: b8.table, pos: b8.pos });
  add(sub(by('B9')), subsDe('B9').map(s => subH(s)));
  anexo('G', 'g', R14('aG'));
  add(relPremissas());
  anexo('H', 'h', R14('aH'));
  add(relGlossario());
  anexo('I', 'i', R14('aI'));
  const rf = by('refs'); if (rf) add(Object.assign({}, rf, { sub: true, tipo: 'refs' }));
  return L;
}

// ----------------------------------------------------------- HTML dos gráficos (página)
const relCor = n => (typeof corCamada === 'function' ? corCamada(n) : '#0C1D53');
function htmlGrafP(g) {
  const cab = `<figcaption><span class="rp-graf-t" id="${g.id}-t">${esc(g.h)}</span> <span class="rp-graf-s">${esc(g.sub || '')}</span></figcaption>`;
  const leit = g.leitura ? `<p class="rg-leitura">${esc(g.leitura)}</p>` : '';
  const leg = (cores, rot) => `<p class="rp-leg rg-leg">${rot.map((r, i) => `<span><i style="background:${cores[i]}"></i>${esc(r)}</span>`).join('')}</p>`;
  let corpo = '';
  if (g.tipo === 'fases') {
    const max = Math.max(1, ...g.anos.map(a => a.total)), Hh = 150;
    const FC = { piloto: 'var(--f2)', implantacao: 'var(--f3)', expansao: 'var(--f4)' };
    corpo = leg(g.camadas.map(c => relCor(c.n)), g.camadas.map(c => c.n + '. ' + c.nome))
      + `<div class="rg-cols" style="--n:${g.anos.length}" role="list">${g.anos.map(a => `<div class="rg-col" role="listitem" data-ano="${a.t}">
        <span class="rg-col-v">${esc(a.totTxt)}</span>
        <div class="rg-pilha" style="height:${Math.max(a.total > 0 ? 3 : 1, Hh * a.total / max).toFixed(1)}px">${a.v.map((v, i) => v > 0 ? `<i style="flex:${v};background:${relCor(i + 1)}" title="${esc((i + 1) + '. ' + g.camadas[i].nome + ': ' + grande(v))}"></i>` : '').join('')}</div>
        <span class="rg-col-a">${esc(a.rot)}</span><span class="rg-col-f" style="border-top-color:${FC[a.fase] || 'var(--f2)'}">${esc(a.faseNome)}</span></div>`).join('')}</div>`;
  } else if (g.tipo === 'camadas') {
    const max = Math.max(1e-9, ...g.vals);
    corpo = `<ol class="rp-barras">${g.vals.map((v, i) => `<li class="rp-bar"><span class="rp-bar-l"><span class="rp-cn" style="background:${relCor(i + 1)}" aria-hidden="true">${i + 1}</span><span><span class="sr">${esc(tr('Camada ' + (i + 1)))}: </span>${esc(g.camadas[i].nome)}</span></span>
      <span class="rg-trilho" aria-hidden="true"><i style="width:${(v > 0 ? Math.max(.8, 100 * v / max) : 0).toFixed(2)}%;background:${relCor(i + 1)}"></i></span>
      <span class="rp-bar-v"><b>${esc(g.valsTxt[i])}</b> <span>${esc(g.pcts[i])}</span></span></li>`).join('')}</ol>`;
  } else if (g.tipo === 'adocao') {
    const max = Math.max(1, ...g.anos.map(a => a.E)), Hh = 130;
    corpo = leg(['var(--f1s)', 'var(--f3)'], g.leg)
      + `<div class="rg-cols" style="--n:${g.anos.length}" role="list">${g.anos.map(a => `<div class="rg-col" role="listitem" data-ano="${a.t}">
        <span class="rg-col-v">${esc(a.eTxt)}</span>
        <div class="rg-acesso" style="height:${Math.max(a.E > 0 ? 3 : 1, Hh * a.E / max).toFixed(1)}px" title="${esc(g.leg[0] + ': ' + a.eTxt)}"><i style="height:${(100 * (a.ad || 0)).toFixed(1)}%" title="${esc(g.leg[1] + ': ' + a.uTxt)}"></i></div>
        <span class="rg-col-a">${esc(a.rot)}</span><span class="rg-col-u">${esc(a.uTxt)} · ${esc(a.adTxt)}</span></div>`).join('')}</div>`;
  } else if (g.tipo === 'cenarios') {
    const max = Math.max(1e-9, ...g.itens.map(c => c.total));
    corpo = leg(['var(--f2)', 'var(--f4)'], g.leg)
      + `<ul class="rg-cen">${g.itens.map(c => `<li><p class="rg-cen-n"><b>${esc(c.nome)}</b> <span>${esc(c.desc)}</span></p>
        <div class="rg-cen-b" style="width:${(100 * c.total / max).toFixed(1)}%" role="img" aria-label="${esc(c.nome + ': ' + c.totTxt)}"><i style="flex:${Math.max(0, c.unico)};background:var(--f2)" title="${esc(g.leg[0] + ': ' + c.unicoTxt)}"></i><i style="flex:${Math.max(0, c.rec)};background:var(--f4)" title="${esc(g.leg[1] + ': ' + c.recTxt)}"></i></div>
        <p class="rg-cen-v"><b>${esc(c.totTxt)}</b> <span>${esc(g.leg[0])} ${esc(c.unicoTxt)} · ${esc(g.leg[1])} ${esc(c.recTxt)}</span></p></li>`).join('')}</ul>`;
  } else if (g.tipo === 'tornado') {
    corpo = leg(['var(--f2)', '#B3261E'], g.leg) + `<p class="rg-base">${esc(g.baseTxt)}</p>`
      + `<ul class="rg-tor">${g.linhas.map(r => {
        const w = x => (50 * Math.abs(x) / g.max).toFixed(2);
        const barra = (x, cor) => `<i style="width:${w(x)}%;background:${cor};${x < 0 ? 'right:50%' : 'left:50%'}"></i>`;
        return `<li><p class="rg-tor-n"><b>${esc(r.nome)}</b> <span>${esc(r.faixa)}</span></p>
        <div class="rg-tor-t" role="img" aria-label="${esc(r.nome + ': ' + r.loTxt + ' / ' + r.hiTxt)}">${barra(r.lo, 'var(--f2)')}${barra(r.hi, '#B3261E')}<u></u></div>
        <p class="rg-tor-v"><span>${esc(r.loTxt)}</span><span>${esc(r.hiTxt)}</span></p></li>`;
      }).join('')}</ul>`;
  }
  return `<figure class="rp-graf rg" data-grafico="${g.tipo}" aria-labelledby="${g.id}-t">${cab}${corpo}${leit}</figure>`;
}

const CSS_RELATORIO = `
.rg .rg-leitura { margin: 0; padding-top: 10px; border-top: 1px solid var(--rp-line); font-size: .97rem; line-height: 1.5; color: var(--rp-ink); }
.rg .rg-leg { margin: 0; }
.rg .rg-leg i, .rp-leg i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-inline-end: 6px; vertical-align: -1px; }
.rg-cols { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 6px; align-items: end; }
.rg-col { display: flex; flex-direction: column; align-items: stretch; justify-content: flex-end; gap: 4px; min-width: 0; }
.rg-col-v { font-size: .86rem; font-weight: 700; color: var(--rp-head); text-align: center; line-height: 1.2; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.rg-pilha { display: flex; flex-direction: column-reverse; width: 100%; max-width: 64px; margin-inline: auto; border-radius: 3px 3px 0 0; overflow: hidden; }
.rg-pilha i { display: block; min-height: 1px; }
.rg-col-a { text-align: center; padding-top: 6px; border-top: 2px solid var(--rp-head); font-size: .86rem; color: var(--ink-2); line-height: 1.25; }
.rg-col-f { text-align: center; font-size: .86rem; line-height: 1.25; color: var(--rp-muted); border-top: 4px solid; padding-top: 3px; overflow-wrap: anywhere; }
.rg-col-u { text-align: center; font-size: .86rem; line-height: 1.25; color: var(--rp-muted); overflow-wrap: anywhere; }
.rg-acesso { position: relative; display: flex; align-items: flex-end; width: 100%; max-width: 64px; margin-inline: auto; background: var(--f1s); border-radius: 3px 3px 0 0; overflow: hidden; }
.rg-acesso i { display: block; width: 100%; background: var(--f3); }
.rg-trilho { display: block; height: 12px; background: #EEF3F8; border-radius: 2px; overflow: hidden; }
.rg-trilho i { display: block; height: 100%; }
.rg-cen, .rg-tor { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
.rg-cen p, .rg-tor p { margin: 0; }
.rg-cen-n, .rg-tor-n { display: flex; flex-wrap: wrap; gap: 2px 10px; align-items: baseline; font-size: .97rem; color: var(--rp-head); }
.rg-cen-n span, .rg-tor-n span { font-size: .9rem; color: var(--rp-muted); font-weight: 400; }
.rg-cen-b { display: flex; height: 22px; margin: 6px 0 4px; border-radius: 3px; overflow: hidden; min-width: 2px; }
.rg-cen-b i { display: block; height: 100%; }
.rg-cen-v { font-size: .9rem; color: var(--rp-muted); }
.rg-cen-v b { color: var(--rp-head); font-size: 1rem; margin-inline-end: 8px; }
.rg-base { margin: 0; font-size: .9rem; color: var(--rp-muted); }
.rg-tor-t { position: relative; height: 20px; margin: 6px 0 2px; background: #F5F8FB; border-radius: 3px; }
.rg-tor-t i { position: absolute; top: 3px; bottom: 3px; border-radius: 2px; }
.rg-tor-t u { position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; background: var(--rp-head); text-decoration: none; }
.rg-tor-v { display: flex; justify-content: space-between; gap: 8px; font-size: .9rem; color: var(--rp-ink); font-variant-numeric: tabular-nums; }
/* resumo da primeira página */
.rs-topo { display: grid; gap: 14px; }
.rs-tco { display: grid; gap: 10px; padding: 20px 22px; border: 1px solid var(--rp-line); border-top: 6px solid var(--rp-brand); border-radius: 10px; background: #fff; }
.rs-tco-l { font-size: .9rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--rp-muted); }
.rs-tco-v { font-size: 1.2rem; font-weight: 700; color: var(--rp-head); line-height: 1.1; }
.rs-tco-v .n { font-size: 2.8rem; letter-spacing: -.02em; white-space: nowrap; }
.rs-tco-v .u { font-size: 1.2rem; font-weight: 600; color: var(--ink-2); }
.rs-tco-f { font-size: 1.05rem; font-weight: 600; color: var(--rp-head); }
.rs-faixa { position: relative; height: 14px; margin: 4px 0 2px; background: #EEF3F8; border-radius: 7px; }
.rs-faixa i { position: absolute; top: 0; bottom: 0; background: #A9D4F5; border-radius: 7px; }
.rs-faixa b { position: absolute; top: -4px; bottom: -4px; width: 4px; margin-inline-start: -2px; background: var(--rp-head); border-radius: 2px; }
.rs-nota { margin: 0; font-size: .9rem; line-height: 1.45; color: var(--rp-muted); }
.rs-kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.rs-kpis .rp-kpi-n { font-size: .9rem; line-height: 1.4; color: var(--rp-muted); }
.rs-dir { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; counter-reset: d; }
.rs-dir li { display: grid; gap: 4px; padding: 10px 14px; border: 1px solid var(--rp-line); border-radius: 10px; background: #fff; }
.rs-dir b { color: var(--rp-head); }
.rs-dir span { font-size: .9rem; color: var(--rp-muted); }
.rs-dir .rs-d-b { display: block; height: 8px; border-radius: 4px; background: #B3261E; opacity: .85; }
.rs-quem { font-size: .9rem; color: var(--rp-muted); margin: 0; }
.rs-quem b { color: var(--rp-head); }
.rp-rot { margin: 0; font-size: .86rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--rp-brand); }
.rp-comoler { padding: 18px 22px; border-radius: 10px; background: var(--rp-bg); border: 1px solid var(--rp-line); border-inline-start: 5px solid var(--rp-brand); display: grid; gap: 8px; }
.rp-comoler h3 { margin: 0; font-family: var(--f-head); font-size: 1.2rem; color: var(--rp-head); }
.rp-comoler ul { margin: 0; padding-inline-start: 1.2em; display: grid; gap: 6px; }
.rp-anexos { display: grid; gap: 36px; }
.rp-anexo .rp-num { font-size: 2.2rem; }
.rp-item { display: grid; gap: 10px; }
.rp-item > h4 { margin: 6px 0 0; font-family: var(--f-head); font-size: 1.2rem; color: var(--rp-head); }
.rp-fatos-b { display: grid; gap: 10px; }
@media (max-width: 720px) {
  .rs-kpis { grid-template-columns: minmax(0, 1fr); }
  .rs-tco-v .n { font-size: 2.2rem; }
  .rg-col-v { font-size: .86rem; }
  .rg-cols { gap: 3px; }
  .rp-graf { padding: 14px; }
}
`;
function cssRelatorio() {
  try {
    if (typeof document === 'undefined' || document.getElementById('css-relatorio')) return;
    const st = document.createElement('style'); st.id = 'css-relatorio'; st.textContent = CSS_RELATORIO;
    (document.head || document.documentElement).appendChild(st);
  } catch (e) { }
}
