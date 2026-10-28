// =====================================================================
// Números ligados às recomendações (pacote R5 do sistema de recomendações: REC-32 a REC-37;
// design/redesign/05-requisitos-recomendacoes.md, seções 3.1, 3.2, 5.1, 5.2, 8 (E9–E12) e 9, e o parecer de
// econometria, design/redesign/recomendacoes/econometria.md, seções 2.2 e 3).
//
// Tudo sai do mesmo seletor que alimenta o plano (numerosCusto sobre cfgAtual), mais a simulação de Monte Carlo com
// a semente e o número de cenários do relatório (1.500, 20261003), guardada por caso: a página, o PDF e as regras
// leem os mesmos números. Sem números (caso em branco ou sem o tipo de tecnologia, 2.3.4), numerosRec devolve null e
// numero() devolve "a calcular".
//
//   numerosRec(estado)        → d (k.d das regras) ou null
//   numero(chave, d)          → { id, rotulo, valor, bruto, fonte, ilustrativo, falta } (valor "a calcular" sem número)
//   varsRec(d, chaves?)       → { chave: texto formatado } para os marcadores {…} das regras (sem número, a chave falta
//                               e o marcador sai "a calcular", como em recomendacoes.js:preencher)
//   indicadoresRec(d)         → indicadores rotulados pela pergunta que respondem (REC-35, ECO-09)
//   avaliabilidade(estado, d) → efeito mínimo detectável do piloto e da 1ª etapa, com premissas (REC-33, ECO-02/19)
//   limiar(estado, d)         → efeito ou tempo de empate, ou custo por unidade de resultado (REC-34, ECO-12)
//   valeOQueCusta(estado, d)  → dados do bloco "Vale o que custa?" (fórmula com o custo do caso quando falta resposta)
//   semFaixaRec(cfg, av)      → parte do custo total que nenhum direcionador da simulação move (REC-37, ECO-17)
//   pesadoRec(cfg)            → { sim, tor, cen } (simulação, tornado e cenários), uma vez por caso
//
// Decisão 3: o valor central fica na manchete e o P50 ao lado, como "valor para orçar"; o P90 é o "teto prudente".
// Decisão 8: os números de convenção (efeito mínimo, limiar, custo-hora) saem só aqui, sempre com o rótulo
// "ilustrativo, a confirmar", e nunca na frase da ação.
// Perguntas do Refinar que estes cálculos leem quando existirem (seção 7; pacote R8), lidas de forma defensiva:
//   caso.altCustoEfeito = { custo: US$ por pessoa por ano, efeito: DP }   (ou { custo: { provavel }, efeito: { provavel } })
//   caso.volumeResultado = { unidade: 'solicitacoes' | 'estudantes' | …, volume: n, periodo: 'mes' | 'ano' }  (ou um número por mês)
// Os textos em português são as chaves de tradução (tr); {0}, {1}… são lugares de valores.
// =====================================================================
import { simular, tornado, cenarios, avaliar, calcular, clone, direcionadores, compLicenca } from './custos.js';
import { din, grande, pct } from './custos_ui.js';
import { fmtInt, recomendarTeste } from './framework.js';
import { tr, LOC } from './i18n.js';
import { numerosCusto, cfgAtual, casoAtual, respondido, totaisCtx } from './fluxo.js';
import { refValor } from './referencias_base.js';

export const REC_N_SIM = 1500;
export const REC_SEMENTE = 20261003;

// ----------------------------------------------------------- textos (chaves de tradução)
export const A_CALCULAR_R5 = 'a calcular';
export const A_COMPLETAR = 'a completar';
export const ILUSTRATIVO = 'ilustrativo, a confirmar';
export const A_DEFINIR = 'a definir pela rede';
export const TXT_R5 = {
  // rótulos dos números (numero)
  central: 'Custo total, cenário-base (valor central)',
  p10: 'Custo total, P10',
  p50: 'Valor para orçar (P50 do custo total)',
  p90: 'Teto prudente (P90 do custo total)',
  faixa: 'Faixa provável do custo total (P10 a P90)',
  p50Delta: 'Diferença entre o P50 e o valor central',
  reserva: 'Reserva até o teto prudente (P90 menos P50)',
  ano0: 'Custo do Ano 0 (prova de conceito ou piloto)',
  dotAno0: 'Dotação do Ano 0',
  dotacao: 'Dotação a solicitar por exercício',
  dotFaixa: 'Dotação por exercício na operação',
  recorrente: 'Parte recorrente do custo total',
  regime: 'Custo anual em regime',
  saida: 'Desembolso de transição e saída, em preços correntes',
  saidaEco: 'Camada de saída do custo total',
  anosParaSair: 'Custo de sair, em anos de custo recorrente',
  premissa: 'Premissa que mais move o custo',
  aEq: 'Adoção de equilíbrio da licença institucional',
  adocao: 'Adoção prevista (usuários ativos entre as pessoas com acesso)',
  semFaixa: 'Parte do custo total sem faixa na simulação',
  estresse: 'Custo total no cenário de estresse',
  mdesPiloto: 'Efeito mínimo detectável do piloto',
  mdesEtapa: 'Efeito mínimo detectável da primeira etapa',
  limiar: 'Limiar “vale o que custa”',
  intervalo: '{0} a {1}',
  // indicadores rotulados pela pergunta que respondem (REC-35)
  iMediaAprend: 'Por aprendiz com acesso por ano',
  iMediaProf: 'Por professor com acesso por ano',
  iMediaPessoa: 'Por pessoa com acesso por ano',
  qMedia: 'Quanto custa, em média no ciclo (com o Ano 0), cada pessoa com acesso?',
  iRegimeAcesso: 'Em regime, por pessoa com acesso por ano (Ano {0})',
  qRegimeAcesso: 'Quanto custará cada pessoa com acesso quando a rede inteira usar?',
  iRegimeAtivo: 'Em regime, por usuário ativo por ano (Ano {0})',
  qRegimeAtivo: 'Quanto custa cada pessoa que usa de fato? É o número da meta, do contrato e da decisão de ampliar.',
  iTeste: 'Custo do teste por participante',
  qTeste: 'Quanto custa cada participante do teste? Não serve para projetar a escala.',
  iBenef: 'Em regime, por estudante atendido por ano (Ano {0})',
  qBenef: 'Quanto custa cada estudante que recebe o efeito, e não só quem usa a ferramenta?',
  nBenef: 'Estudantes das etapas atendidas: {0}.',
  nAno0Dot: 'Dotação do Ano 0: {0}.',
  // faixa, P50 e P90 (decisão 3; REC-36)
  kP50: 'Valor para orçar (P50): {0}',
  kP90: 'Teto prudente (P90): {0}',
  kP50Delta: 'O P50 fica {0} acima do valor central.',
  kNotaBase: 'O valor central é o cenário-base, com cada premissa no valor mais provável. Como as faixas são assimétricas para cima, orce pelo P50 e reserve até o P90.',
  // parcela sem faixa e estresse (REC-37)
  avisoSemFaixa: 'A faixa subestima a incerteza: {0} do custo total está em itens sem faixa na simulação ({1}). Confirme estes itens com cotações.',
  notaEstresse: 'O cenário de estresse ({0}) passa do P90 ({1}) porque combina extremos que a simulação raramente sorteia juntos.',
  // avaliabilidade (REC-33)
  avT: 'Tamanho mínimo de efeito detectável',
  avPiloto: 'Piloto com {0} escolas e {1} escolas de comparação: efeito mínimo detectável de {2}.',
  avPilotoMetade: 'Dividindo as {0} escolas do piloto em {1} e {2}: {3}.',
  avViabilidade: 'Com efeito mínimo detectável acima de 0,20 DP, o piloto mede viabilidade (uso, custo e suporte), e não o efeito.',
  avEtapa: 'Primeira etapa por sorteio, {0} escolas entram e {1} esperam: efeito mínimo detectável de {2}.',
  avOndas: 'Duas ondas sorteadas de {0} e {1} escolas: efeito mínimo detectável de {2}.',
  avUsuarios: 'Entre quem usa (adoção de {0}): cerca de {1}.',
  avNecessarias: 'Escolas necessárias no total, metade em cada grupo: {0}.',
  avSolic: 'Sorteio de {0} solicitações entre os dois braços: efeito mínimo detectável de {1}.',
  avSolicFalta: 'Sorteio das solicitações: informe o volume de solicitações para calcular o efeito mínimo detectável.',
  avSemPiloto: 'Sem piloto com escolas, não há efeito mínimo detectável de piloto a calcular.',
  avSemResultado: 'Sem impacto em aprendizagem, permanência ou tempo, o tamanho de efeito não se aplica.',
  avPremAlfa: 'Nível de significância de 5% (bilateral) e poder de 80% (multiplicador 2,8).',
  avPremEscola: 'Sorteio ou pareamento por escola, com o mesmo número de escolas em cada grupo.',
  avPremIcc: 'Correlação intraclasse (ICC) de {0} para {1}.',
  avPremR2: 'Variância explicada pela linha de base (R²): {0} no nível da escola e {1} no do estudante.',
  avPremR2Zero: 'Sem linha de base que explique o resultado (R² = 0).',
  avPremN: 'Pessoas medidas por escola: {0}.',
  avPremBase: 'Taxa-base de abandono de {0}.',
  avPremSolic: 'Sorteio individual das solicitações, metade em cada braço.',
  avProf: 'proficiência', avTempo: 'tempo docente ou de gestão', avAband: 'abandono',
  // limiar e "Vale o que custa?" (REC-34)
  vT: 'Vale o que custa?',
  vTempo: 'Para empatar o custo em regime ({0} por usuário ativo por ano), cada {1} ativo precisa liberar cerca de {2} horas por ano, ≈ {3} min por semana.',
  vTempoF: 'Minutos por semana para empatar = custo em regime por usuário ativo × 60 ÷ (custo-hora × {0} semanas letivas).',
  vSolic: 'Para empatar o custo em regime ({0} por ano; {1} por solicitação, com {2} solicitações por ano), cada solicitação precisa economizar cerca de {3} min de trabalho.',
  vSolicF: 'Minutos por solicitação para empatar = {0} × 60 ÷ ({1} por hora × solicitações por ano).',
  vAprend: 'Para valer o mesmo que a alternativa ({0} DP a {1} por estudante por ano), a IA precisa de efeito de pelo menos {2} DP com {3} por estudante por ano em regime.',
  vAprendF: 'Efeito de empate = efeito da alternativa × {0} ÷ custo da alternativa por estudante por ano.',
  vAband: 'Cada ponto percentual a menos de abandono custa cerca de {0} por estudante que deixa de abandonar ({1} estudantes; custo em regime de {2}; só o sistema, sem a resposta ao alerta).',
  vAbandF: 'Custo por abandono evitado a cada ponto percentual = custo em regime ÷ (estudantes × 1%).',
  vSemNumeros: 'A calcular quando o plano tiver números (pergunta 2.3.4).',
  vPremCh: 'Custo-hora de {0} por {1} (convenção da ferramenta).',
  vPremSem: '{0} semanas letivas por ano.',
  vPremAlt: 'Sem o custo e o efeito da alternativa sem IA, o limiar fica na fórmula.',
  vPremVol: 'Sem o volume de solicitações por ano, o limiar fica na fórmula.',
  vProfessor: 'professor', vServidor: 'servidor',
  // seis respostas, linha "Indicadores" (ECO-10: sem "sem passar de")
  inRegime: 'Custo em regime por usuário ativo: {0} por ano (Ano {1}); limite para ampliar: {2}.',
  inLimiar: 'Vale o que custa: {0}',
};
const trN = (t, ...v) => String(tr(t)).replace(/\{(\d+)\}/g, (_, i) => (v[+i] != null ? v[+i] : ''));
const T5 = (k, ...v) => trN(TXT_R5[k], ...v);
/** textos novos do pacote R5 (chaves de tradução para o orquestrador) */
export const TEXTOS_REC_R5 = [A_CALCULAR_R5, A_COMPLETAR, ILUSTRATIVO, A_DEFINIR].concat(Object.values(TXT_R5));

// ----------------------------------------------------------- formatação
const num = (x, d) => (+x || 0).toLocaleString(LOC(), { minimumFractionDigits: d, maximumFractionDigits: d });
const sinal = x => (x < 0 ? '−' : '+');
const sinalGrande = x => (Math.abs(x) < 0.5 ? grande(0) : sinal(x) + grande(Math.abs(x)));
const sinalPct = (x, d = 1) => sinal(x) + pct(Math.abs(x), d);
const dp = x => num(x, 2) + ' DP';
const pp = x => num(x, 1) + ' p.p.';

// ----------------------------------------------------------- parte cara (uma vez por caso)
const CACHE = new Map();   // JSON da cfg → { sim, tor, cen, sf }
/** Simulação (1.500 cenários, semente fixa), tornado, cenários e parcela sem faixa, guardados por caso. */
export function pesadoRec(cfg) {
  const chave = JSON.stringify(cfg);
  const ja = CACHE.get(chave);
  if (ja) return ja;
  const sim = simular(cfg, REC_N_SIM, REC_SEMENTE);
  const tor = tornado(cfg);
  const cs = cenarios(cfg);
  const cen = ['Esperado', 'Alta adoção', 'Estresse'].map(nome => {
    const a = avaliar(cs[nome]);
    return { nome, ct: a.ctEco, unico: a.fases.unico, rec: a.fases.recorrente };
  });
  let sf = null;
  try { sf = semFaixaRec(cfg); } catch (e) { console.warn(e); }
  const v = { chave, sim, tor, cen, sf };
  CACHE.set(chave, v);
  while (CACHE.size > 6) CACHE.delete(CACHE.keys().next().value);
  return v;
}
export const recCacheTamanho = () => CACHE.size;

/**
 * Parte do custo total em itens que nenhum direcionador da simulação move (ECO-17): com todos os direcionadores no
 * mínimo e depois no máximo da faixa, as linhas cujo valor não muda. → { valor, parcela, itens: [{ s, nome, valor }] }
 */
export function semFaixaRec(cfg, avBase) {
  const av = avBase || avaliar(calcular(cfg));
  const D = direcionadores(cfg);
  const lo = clone(cfg), hi = clone(cfg);
  D.forEach(d => { d.ap(lo, d.min); d.ap(hi, d.max); });
  const aL = avaliar(calcular(lo)), aH = avaliar(calcular(hi));
  const igual = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
  const itens = [];
  const ver = (L, LL, LH) => L.forEach((l, i) => {
    const a = LL[i], b = LH[i];
    if (!a || !b || a.s !== l.s || a.nome !== l.nome) return;
    if (igual(a.ecoVP, l.ecoVP) && igual(b.ecoVP, l.ecoVP) && Math.abs(l.ecoVP) > 0.5) itens.push({ s: l.s, nome: l.nome, valor: l.ecoVP });
  });
  ver(av.linhas, aL.linhas, aH.linhas);
  ver(av.saida, aL.saida, aH.saida);
  const valor = itens.reduce((s, x) => s + x.valor, 0);
  itens.sort((a, b) => b.valor - a.valor);
  return { valor, parcela: av.ctEco ? valor / av.ctEco : 0, itens };
}

// ----------------------------------------------------------- o seletor (k.d)
function copiaEstado(estado) {
  const E = Object.assign({}, estado || {});
  if (E.custo) E.custo = Object.assign({}, E.custo, { cfg: E.custo.cfg ? clone(E.custo.cfg) : null });
  return E;
}
/** o plano só mostra números depois do tipo de tecnologia (2.3.4), como percurso/painel.ts:temNumeros */
function comNumeros(estado) {
  return !!(estado && estado.caso && (estado.exemplo !== 'novo' || respondido('tipoTec', estado)));
}
const anoDe = (arr, t) => (Array.isArray(arr) ? arr[Math.min(t, arr.length - 1)] || 0 : +arr || 0);

/**
 * Números do caso para as regras (k.d) e para o relatório: os de numerosCusto (mesmas chaves que o R2 expunha) mais
 * P10/P50/P90, dotação, custo em risco, tornado, adoção, aEq, indicadores, parcela sem faixa, estresse,
 * avaliabilidade e limiar. null sem números.
 * pre: { cfg, custo } já calculados (secoes.js), para não refazer numerosCusto.
 */
export function numerosRec(estado, pre) {
  try {
    if (!comNumeros(estado)) return null;
    let cfg = pre && pre.cfg, n = pre && pre.custo;
    if (!cfg || !n) { cfg = cfgAtual(copiaEstado(estado)); n = numerosCusto(cfg); }
    if (!n || !n.av || !n.av.tco) return null;
    const av = n.av, tco = av.tco, r = av.r, H = av.r.H, T = r.anos;
    const central = av.ctEco;
    const dot = (n.orc && n.orc.dot) || [];
    const dotOp = dot.filter((x, t) => t > 0);
    const U = r.U || [], E = r.E || [];
    const adocao = T.filter(t => t > 0).map(t => (E[t] ? U[t] / E[t] : 0));
    let lic = null;
    try { lic = compLicenca(cfg); } catch (e) { lic = null; }
    const d = {
      // R2 (mesmas chaves)
      n, av, ind: n.ind, orc: n.orc, H, total: n.total, ano0: n.ano0, anual: n.anual, porAluno: n.porAluno,
      saida: (n.orc && n.orc.saida) || 0, saidaEco: av.saidaEco || 0, anosParaSair: (n.ind && n.ind.anosParaSair) || 0,
      pRecorrente: tco.pRecorrente || 0,
      // R5
      cfg, central, dot: dot.slice(), dotOpMin: dotOp.length ? Math.min(...dotOp) : 0, dotOpMax: dotOp.length ? Math.max(...dotOp) : 0,
      regime: tco.anual, E: E.slice(), U: U.slice(), adocao, adocaoMin: adocao.length ? Math.min(...adocao) : 0, adocaoMax: adocao.length ? Math.max(...adocao) : 0,
      aEq: lic && Number.isFinite(lic.aEq) ? lic.aEq : null, licenca: lic,
    };
    // A simulação (≈ 1 s por caso), o tornado e os cenários só rodam quando alguém lê um destes campos (uma regra que
    // cita o P50, o relatório), e uma vez por caso (pesadoRec): regras que só leem a saída ou a dotação não pagam.
    let pesado = null;
    const P = () => {
      if (pesado) return pesado;
      const X = pesadoRec(cfg), s = X.sim.ct;
      const est = (X.cen || []).find(c => c.nome === 'Estresse');
      const top = X.tor && X.tor.rows && X.tor.rows[0] ? X.tor.rows[0] : null;
      pesado = { sim: X.sim, tor: X.tor, cen: X.cen, p10: s.p10, p50: s.p50, p90: s.p90, lo: Math.min(s.p10, central), hi: Math.max(s.p90, central),
        p50Delta: central ? (s.p50 - central) / central : 0, reserva: s.p90 - s.p50,
        dotP50: (X.sim.dot || []).map(q => q.p50), custoEmRisco: (X.sim.custoEmRisco || []).slice(),
        premissa: top ? { id: top.id, nome: top.nome, lo: top.lo, hi: top.hi, amplitude: Math.max(Math.abs(top.lo), Math.abs(top.hi)) } : null,
        semFaixa: X.sf ? Object.assign({}, X.sf, { aviso: X.sf.parcela > 0.25 }) : null,
        estresse: est ? { ct: est.ct, acimaP90: est.ct > s.p90 } : null };
      return pesado;
    };
    ['sim', 'tor', 'cen', 'p10', 'p50', 'p90', 'lo', 'hi', 'p50Delta', 'reserva', 'dotP50', 'custoEmRisco', 'premissa', 'semFaixa', 'estresse']
      .forEach(c => Object.defineProperty(d, c, { enumerable: true, get() { return P()[c]; } }));
    d.indicadores = indicadoresRec(d, estado);
    d.aval = avaliabilidade(estado, d);
    d.limiar = limiar(estado, d);
    return d;
  } catch (e) { console.warn(e); return null; }
}

// ----------------------------------------------------------- indicadores rotulados (REC-35)
/**
 * Indicadores rotulados pela pergunta que respondem (ECO-09): média do ciclo por pessoa com acesso, custo em regime
 * por pessoa com acesso, custo em regime por usuário ativo e custo do teste por participante; com usuários que não são
 * estudantes e efeito sobre estudantes (C), o custo em regime por estudante atendido no lugar do custo por acesso.
 * → [{ id, rotulo, pergunta, valor, bruto, nota? }] (textos já traduzidos)
 */
export function indicadoresRec(d, estado) {
  if (!d || !d.av) return [];
  const tco = d.av.tco, an = d.regime || tco.anual, ano = an.ano;
  const E = d.E || d.av.r.E, U = d.U || d.av.r.U;
  const L = [];
  if (tco.custoPorAprendizAno != null) L.push({ id: 'mediaAcesso', papel: 'aprendiz', rotulo: T5('iMediaAprend'), pergunta: T5('qMedia'), valor: din(tco.custoPorAprendizAno, 2), bruto: tco.custoPorAprendizAno });
  else if (tco.custoPorProfessorAno != null) L.push({ id: 'mediaAcesso', papel: 'professor', rotulo: T5('iMediaProf'), pergunta: T5('qMedia'), valor: din(tco.custoPorProfessorAno, 2), bruto: tco.custoPorProfessorAno });
  else if (d.ind && d.ind.icuElegivel) L.push({ id: 'mediaAcesso', papel: 'pessoa', rotulo: T5('iMediaPessoa'), pergunta: T5('qMedia'), valor: din(d.ind.icuElegivel, 2), bruto: d.ind.icuElegivel });
  const benef = beneficiarios(estado);
  const regAcesso = E[ano] ? an.eco / E[ano] : null;
  if (benef > 0) {
    const v = an.eco / benef;
    L.push({ id: 'beneficiario', rotulo: T5('iBenef', ano), pergunta: T5('qBenef'), valor: din(v, 2), bruto: v, nota: T5('nBenef', fmtInt(benef)) });
  } else if (regAcesso != null) L.push({ id: 'regimeAcesso', rotulo: T5('iRegimeAcesso', ano), pergunta: T5('qRegimeAcesso'), valor: din(regAcesso, 2), bruto: regAcesso });
  if (U[ano]) { const v = an.eco / U[ano]; L.push({ id: 'regimeAtivo', rotulo: T5('iRegimeAtivo', ano), pergunta: T5('qRegimeAtivo'), valor: din(v, 2), bruto: v }); }
  if (E[0]) { const v = (d.ano0 || 0) / E[0]; L.push({ id: 'teste', rotulo: T5('iTeste'), pergunta: T5('qTeste'), valor: din(v, 0), bruto: v }); }
  return L;
}
/** estudantes que recebem o efeito quando quem usa não são estudantes (C); 0 quando não se aplica */
function beneficiarios(estado) {
  if (!estado || !estado.caso) return 0;
  let ce = estado.caso;
  try { ce = casoAtual(estado); } catch (e) { }
  const us = ce.usuarios || [], af = ce.afetados || [], imp = ce.impactos || [];
  // o efeito é sobre estudantes (aprendizagem, desigualdade ou permanência), mas quem usa não são eles
  if (us.includes('estudantes') || !imp.some(z => ['permanencia', 'aprendizagem', 'desigualdade'].includes(z))) return 0;
  const vol = volume(estado.caso);
  if (vol && /estud|alun/.test(vol.unidade)) return vol.porAno;
  let alunos = 0;
  try { alunos = +totaisCtx(estado.ctx || {}).alunos || 0; } catch (e) { }
  return alunos;
}

// ----------------------------------------------------------- respostas novas do Refinar (lidas se existirem)
function volume(c) {
  const v = (c || {}).volumeResultado;
  if (v == null || v === '') return null;
  if (typeof v === 'number' || typeof v === 'string') { const x = +v; return x > 0 ? { unidade: 'solicitacoes', porAno: x * 12 } : null; }
  const x = +v.volume || 0;
  if (!(x > 0)) return null;
  return { unidade: String(v.unidade || 'solicitacoes'), porAno: v.periodo === 'ano' ? x : x * 12 };
}
function alternativa(c) {
  const a = (c || {}).altCustoEfeito;
  if (!a || typeof a !== 'object') return null;
  const val = x => (x && typeof x === 'object' ? +(x.provavel != null ? x.provavel : x.valor) : +x);
  const custo = val(a.custo), efeito = val(a.efeito);
  return custo > 0 && efeito > 0 ? { custo, efeito } : null;
}

// ----------------------------------------------------------- avaliabilidade (REC-33)
// Convenções de grau C do parecer ECO (seção 2.2): ICC 0,15 (proficiência), 0,10 (tempo docente) e 0,05 (abandono);
// com linha de base, R² 0,6 (escola) e 0,4 (estudante), a metade com linha de base parcial; o abandono de uma coorte
// nova não tem pré-teste individual (R² = 0); taxa-base de abandono de 10%. α = 5% bilateral e poder de 80%: M = 2,8.
export const CONV_AVAL = {
  M: 2.8, alfa: 0.05, poder: 0.8,
  icc: { aprendizagem: 0.15, tempo: 0.10, permanencia: 0.05 },
  r2: { escola: 0.6, estudante: 0.4 }, taxaAbandono: 0.10, alvos: [0.10, 0.15, 0.20], limiteViabilidade: 0.20,
  semanasLetivas: 40,
};
/** tipo de resultado medido, pela 1.2.x (impactos) e pela tarefa */
function tipoResultado(ce) {
  const imp = ce.impactos || [];
  if ((ce.tarefas || []).includes('duvidas') && !imp.some(z => ['aprendizagem', 'desigualdade', 'permanencia'].includes(z))) return 'solicitacoes';
  if (imp.some(z => z === 'aprendizagem' || z === 'desigualdade')) return 'aprendizagem';
  if (imp.includes('permanencia')) return 'permanencia';
  if (imp.some(z => z === 'tempo_docente' || z === 'gestao')) return 'tempo';
  return '';
}
/** MDES por escola (Bloom 1995): M × √( ρ(1−R²e) / (P(1−P)J) + (1−ρ)(1−R²i) / (P(1−P)Jn) ) */
export function mdesEscolas(J, P, n, icc, r2e = 0, r2i = 0, M = CONV_AVAL.M) {
  if (!(J > 1) || !(P > 0 && P < 1) || !(n > 0)) return null;
  const q = P * (1 - P) * J;
  return M * Math.sqrt(icc * (1 - r2e) / q + (1 - icc) * (1 - r2i) / (q * n));
}
/** escolas necessárias (total, metade em cada grupo) para detectar `alvo` */
export function escolasPara(alvo, n, icc, r2e = 0, r2i = 0, M = CONV_AVAL.M) {
  if (!(alvo > 0) || !(n > 0)) return null;
  const J = 4 * M * M * (icc * (1 - r2e) + (1 - icc) * (1 - r2i) / n) / (alvo * alvo);
  return 2 * Math.ceil(J / 2);
}

/**
 * Tamanho mínimo de efeito detectável do piloto (com tantas escolas de comparação quanto as do piloto, e dividindo o
 * piloto ao meio) e da primeira etapa por sorteio (entrada em ondas), com as premissas visíveis. Sem resultado medido
 * nem escolas, os campos ficam null com o motivo. → { tipo, unidade, piloto, etapa, solicitacoes, necessarias,
 * medeViabilidade, premissas[], linhas[], rotulo }
 */
export function avaliabilidade(estado, d) {
  if (!estado || !estado.caso) return null;
  const c = estado.caso;
  let ce = c;
  try { ce = casoAtual(estado); } catch (e) { }
  const tipo = tipoResultado(ce);
  const out = { tipo, unidade: tipo === 'permanencia' ? 'p.p.' : 'DP', piloto: null, etapa: null, solicitacoes: null, necessarias: null,
    medeViabilidade: false, premissas: [], linhas: [], rotulo: tr(ILUSTRATIVO), ilustrativo: true };
  if (!tipo) { out.linhas.push(T5('avSemResultado')); return out; }
  const usaEst = (ce.usuarios || []).includes('estudantes');
  let tot = { escolas: 0, alunos: 0 };
  try { tot = totaisCtx(estado.ctx || {}); } catch (e) { }
  const escRede = +ce.escolasRede || +tot.escolas || 0;
  const alunosEscola = escRede && +tot.alunos ? +tot.alunos / escRede : 0;
  const sobreEstudantes = tipo === 'aprendizagem' || tipo === 'permanencia';
  const icc = CONV_AVAL.icc[tipo] || CONV_AVAL.icc.aprendizagem;
  const lb = String(ce.linhaBase || c.linhaBase || '');
  const fR2 = tipo === 'permanencia' ? 0 : lb === 'sim' ? 1 : lb === 'parcial' ? 0.5 : 0;
  const r2e = CONV_AVAL.r2.escola * fR2, r2i = CONV_AVAL.r2.estudante * fR2;
  // DP → p.p. para o abandono (desvio-padrão de uma proporção com a taxa-base)
  const emPP = x => 100 * x * Math.sqrt(CONV_AVAL.taxaAbandono * (1 - CONV_AVAL.taxaAbandono));
  const fmtEf = x => (tipo === 'permanencia' ? pp(emPP(x)) + ' (' + dp(x) + ')' : dp(x));
  const nomeRes = { aprendizagem: TXT_R5.avProf, tempo: TXT_R5.avTempo, permanencia: TXT_R5.avAband, solicitacoes: TXT_R5.avTempo }[tipo];
  // premissas visíveis
  out.premissas.push(T5('avPremAlfa'));
  if (tipo === 'solicitacoes') out.premissas.push(T5('avPremSolic'));
  else {
    out.premissas.push(T5('avPremEscola'));
    out.premissas.push(T5('avPremIcc', num(icc, 2), tr(nomeRes)));
    out.premissas.push(fR2 ? T5('avPremR2', num(r2e, 2), num(r2i, 2)) : T5('avPremR2Zero'));
    if (tipo === 'permanencia') out.premissas.push(T5('avPremBase', pct(CONV_AVAL.taxaAbandono)));
  }
  // dúvidas e solicitações (D): sorteio individual das solicitações na prova de conceito
  if (tipo === 'solicitacoes') {
    const vol = volume(c);
    const meses = +((c.poc || {}).meses) || +((c.piloto || {}).meses) || 3;
    if (vol && /solic|pedid|atend/.test(vol.unidade)) {
      const N = Math.round(vol.porAno * meses / 12);
      const m = N > 1 ? CONV_AVAL.M * Math.sqrt(1 / (0.25 * N)) : null;
      out.solicitacoes = { N, meses, mdes: m };
      if (m != null) out.linhas.push(T5('avSolic', fmtInt(N), dp(m)));
    } else { out.solicitacoes = { N: null, meses, mdes: null, falta: true }; out.linhas.push(T5('avSolicFalta') + ' (' + tr(A_COMPLETAR) + ')'); }
    return out;
  }
  // piloto: tantas escolas de comparação quanto as do piloto (comparação pareada ou sorteio; decisão 4)
  const pe = +((c.piloto || {}).escolas) || 0, pp_ = +((c.piloto || {}).participantes) || 0;
  let temPiloto = (c.testes || []).some(z => z === 'piloto' || z === 'ambos') || c.teste === 'piloto' || c.teste === 'ambos';
  if (!temPiloto && (c.testes || []).includes('recomendar')) { try { temPiloto = recomendarTeste(ce).piloto; } catch (e) { } }
  if (pe > 0 && (temPiloto || pp_ > 0)) {
    const n = sobreEstudantes && !usaEst ? alunosEscola : (pp_ > 0 ? pp_ / pe : alunosEscola);
    if (n > 0) {
      const m = mdesEscolas(2 * pe, 0.5, n, icc, r2e, r2i);
      const a = Math.floor(pe / 2), b = pe - a;
      const mm = a >= 1 && b >= 1 ? mdesEscolas(pe, a / pe, n, icc, r2e, r2i) : null;
      out.piloto = { tratadas: pe, comparacao: pe, n, mdes: m, mdesPP: tipo === 'permanencia' && m != null ? emPP(m) : null,
        metade: mm != null ? { a, b, mdes: mm, mdesPP: tipo === 'permanencia' ? emPP(mm) : null } : null };
      out.premissas.push(T5('avPremN', num(n, 0)));
      out.linhas.push(T5('avPiloto', fmtInt(pe), fmtInt(pe), fmtEf(m)));
      if (mm != null) out.linhas.push(T5('avPilotoMetade', fmtInt(pe), fmtInt(a), fmtInt(b), fmtEf(mm)));
      out.medeViabilidade = m > CONV_AVAL.limiteViabilidade;
      if (out.medeViabilidade) out.linhas.push(T5('avViabilidade'));
      out.necessarias = {};
      CONV_AVAL.alvos.forEach(x => { out.necessarias[num(x, 2)] = escolasPara(x, n, icc, r2e, r2i); });
      out.linhas.push(T5('avNecessarias', CONV_AVAL.alvos.map(x => dp(x) + ': ' + fmtInt(out.necessarias[num(x, 2)])).join('; ')));
    }
  } else out.linhas.push(T5('avSemPiloto'));
  // primeira etapa: entrada sorteada (as que esperam servem de comparação); toda a rede no Ano 1 → duas ondas
  const ie = +((c.implantacao || {}).escolas) || 0;
  const eleg = +c.elegiveis || 0;
  if (ie > 0) {
    const ondas = !(escRede > ie);
    const J = ondas ? ie : escRede, a = ondas ? Math.floor(ie / 2) : ie, b = J - a;
    const n = sobreEstudantes && !usaEst ? alunosEscola : (eleg > 0 && escRede > 0 ? eleg / escRede : alunosEscola);
    const m = a >= 1 && b >= 1 && n > 0 ? mdesEscolas(J, a / J, n, icc, r2e, r2i) : null;
    if (m != null) {
      const ad = d && d.adocao && d.adocao[0] > 0 ? d.adocao[0] : null;
      out.etapa = { ondas, entram: a, esperam: b, J, n, mdes: m, mdesPP: tipo === 'permanencia' ? emPP(m) : null,
        adocao: ad, mdesUsuarios: ad && tipo !== 'permanencia' ? m / ad : null };
      out.linhas.push(ondas ? T5('avOndas', fmtInt(a), fmtInt(b), fmtEf(m)) : T5('avEtapa', fmtInt(a), fmtInt(b), fmtEf(m)));
      if (out.etapa.mdesUsuarios != null) out.linhas.push(T5('avUsuarios', pct(ad), dp(out.etapa.mdesUsuarios)));
    }
  }
  return out;
}

// ----------------------------------------------------------- limiar e "Vale o que custa?" (REC-34)
function custoHora(cfg, professor) {
  const esc = (cfg && cfg.escopos) || undefined;
  if (professor) {
    const sp = cfg && cfg.v11 && cfg.v11.salarioProfessor;
    if (sp && sp.custoHora > 0) return sp.custoHora;
    return refValor('formacao.custoHora.saas', esc) || 12;
  }
  return refValor('formacao.custoHora.api', esc) || 10;
}
/**
 * Efeito ou tempo que empata o custo, ou custo por unidade de resultado, conforme o resultado medido:
 *   tempo (A): minutos por semana por usuário ativo; solicitacoes (D): minutos por solicitação (pede o volume);
 *   aprendizagem (B): efeito de empate com a alternativa (pede custo e efeito); permanencia (C): custo por abandono evitado.
 * Sem a resposta de que precisa (custo e efeito da alternativa, volume), completo = false e a frase é a fórmula com o
 * custo do caso ("a completar"). → { tipo, completo, valor, frase, formula, premissas[], rotulo } ou null quando não se aplica
 */
export function limiar(estado, d) {
  if (!estado || !estado.caso) return null;
  const c = estado.caso;
  let ce = c;
  try { ce = casoAtual(estado); } catch (e) { }
  const tipo = tipoResultado(ce);
  if (!tipo) return null;
  const base = { tipo, completo: false, valor: null, frase: '', formula: '', premissas: [], rotulo: tr(ILUSTRATIVO), ilustrativo: true };
  if (!d || !d.av) return Object.assign(base, { frase: T5('vSemNumeros'), formula: formulaDe(tipo, null, ce) });
  const an = d.regime || d.av.tco.anual, ano = an.ano;
  const E = d.E || d.av.r.E, U = d.U || d.av.r.U;
  const cfg = d.cfg;
  const prof = (ce.usuarios || []).includes('professores');
  if (tipo === 'tempo') {
    const ativo = U[ano] ? an.eco / U[ano] : 0;
    const ch = custoHora(cfg, prof), sem = CONV_AVAL.semanasLetivas;
    const h = ch ? ativo / ch : 0, min = h * 60 / sem;
    base.premissas.push(T5('vPremCh', din(ch, 2), tr(prof ? TXT_R5.vProfessor : TXT_R5.vServidor)), T5('vPremSem', fmtInt(sem)));
    return Object.assign(base, { completo: h > 0, valor: { horasAno: h, minSemana: min, ativo, custoHora: ch },
      frase: T5('vTempo', din(ativo, 2), tr(prof ? TXT_R5.vProfessor : TXT_R5.vServidor), num(h, 0), num(min, 0)), formula: T5('vTempoF', fmtInt(sem)) });
  }
  if (tipo === 'solicitacoes') {
    const ch = custoHora(cfg, false), vol = volume(c);
    base.premissas.push(T5('vPremCh', din(ch, 2), tr(TXT_R5.vServidor)));
    const formula = T5('vSolicF', grande(an.eco), din(ch, 2));
    if (!(vol && /solic|pedid|atend/.test(vol.unidade))) { base.premissas.push(T5('vPremVol')); return Object.assign(base, { frase: formula, formula }); }
    const porSolic = an.eco / vol.porAno, min = porSolic / ch * 60;
    return Object.assign(base, { completo: true, valor: { porSolicitacao: porSolic, min, volumeAno: vol.porAno, custoHora: ch },
      frase: T5('vSolic', grande(an.eco), din(porSolic, 2), fmtInt(vol.porAno), num(min, 0)), formula });
  }
  if (tipo === 'aprendizagem') {
    const porAcesso = E[ano] ? an.eco / E[ano] : 0;
    const formula = T5('vAprendF', din(porAcesso, 2));
    const alt = alternativa(c);
    if (!alt) { base.premissas.push(T5('vPremAlt')); return Object.assign(base, { valor: { porAcesso }, frase: formula, formula }); }
    const ef = alt.efeito * porAcesso / alt.custo;
    return Object.assign(base, { completo: true, valor: { porAcesso, efeitoEmpate: ef, custoPor01DP: alt.custo * 0.1 / alt.efeito },
      frase: T5('vAprend', num(alt.efeito, 2), din(alt.custo, 2), num(ef, 2), din(porAcesso, 2)), formula });
  }
  // permanência: custo por abandono evitado a cada ponto percentual, sobre os estudantes atendidos
  let alunos = beneficiarios(estado);
  if (!alunos) { try { alunos = +totaisCtx(estado.ctx || {}).alunos || 0; } catch (e) { } }
  const formula = T5('vAbandF');
  if (!alunos) return Object.assign(base, { frase: formula, formula });
  const porAband = an.eco / (alunos * 0.01);
  return Object.assign(base, { completo: true, valor: { porAbandono: porAband, alunos },
    frase: T5('vAband', din(porAband, 0), fmtInt(alunos), grande(an.eco)), formula });
}
function formulaDe(tipo, d, ce) {
  if (tipo === 'tempo') return T5('vTempoF', fmtInt(CONV_AVAL.semanasLetivas));
  if (tipo === 'solicitacoes') return T5('vSolicF', tr(A_CALCULAR_R5), tr(A_CALCULAR_R5));
  if (tipo === 'aprendizagem') return T5('vAprendF', tr(A_CALCULAR_R5));
  return T5('vAbandF');
}
/** Dados do bloco "Vale o que custa?" (ECO-12): título, frase (resultado ou fórmula), "a completar", premissas e rótulo. */
export function valeOQueCusta(estado, d) {
  const L = d && d.limiar !== undefined ? d.limiar : limiar(estado, d);
  if (!L) return null;
  return { titulo: T5('vT'), tipo: L.tipo, frase: L.frase, formula: L.formula, completo: L.completo, aCompletar: L.completo ? '' : tr(A_COMPLETAR),
    premissas: L.premissas.slice(), rotulo: L.rotulo, valor: L.valor };
}

// ----------------------------------------------------------- numero(k, d) e marcadores {…} (REC-32)
// Cada chave: [rótulo (TXT_R5), fonte (página do plano), valor bruto, formato, ilustrativo]
const ROT = k => TXT_R5[k] || k;
const CHAVES = {
  central: ['central', 'Quanto custa', d => d.central, grande],
  p10: ['p10', 'Quanto custa', d => d.p10, grande],
  p50: ['p50', 'Quanto custa', d => d.p50, grande],
  p90: ['p90', 'Quanto custa', d => d.p90, grande],
  faixa: ['faixa', 'Quanto custa', d => [d.lo, d.hi], v => T5('intervalo', grande(v[0]), grande(v[1]))],
  p50Delta: ['p50Delta', 'Quanto custa', d => d.p50Delta, v => sinalPct(v, 1)],
  reserva: ['reserva', 'Quanto custa', d => d.reserva, grande],
  ano0: ['ano0', 'Quanto custa', d => d.ano0, grande],
  dotAno0: ['dotAno0', 'Quanto custa', d => (d.dot || [])[0], grande],
  dotacao: ['dotacao', 'Quanto custa', d => d.dot, v => v.map((x, t) => tr('Ano ' + t) + ': ' + grande(x)).join('; ')],
  dotFaixa: ['dotFaixa', 'Quanto custa', d => (d.dot && d.dot.length > 1 ? [d.dotOpMin, d.dotOpMax] : null), v => T5('intervalo', grande(v[0]), grande(v[1]))],
  recorrente: ['recorrente', 'Quanto custa', d => d.pRecorrente, v => pct(v)],
  regime: ['regime', 'Quanto custa', d => d.regime && d.regime.eco, grande],
  saida: ['saida', 'O que exigir', d => d.saida, grande],
  saidaEco: ['saidaEco', 'Quanto custa', d => d.saidaEco, grande],
  anosParaSair: ['anosParaSair', 'Quanto custa', d => d.anosParaSair, v => num(v, 2)],
  premissa: ['premissa', 'Quanto custa', d => d.premissa, v => tr(v.nome) + ' (' + T5('intervalo', sinalGrande(v.lo), sinalGrande(v.hi)) + ')'],
  aEq: ['aEq', 'Quanto custa', d => d.aEq, v => pct(v)],
  adocao: ['adocao', 'Quanto custa', d => (d.adocao && d.adocao.length ? [d.adocaoMin, d.adocaoMax] : null),
    v => (Math.round(v[0] * 100) === Math.round(v[1] * 100) ? pct(v[0]) : T5('intervalo', pct(v[0]), pct(v[1])))],
  semFaixa: ['semFaixa', 'Quanto custa', d => d.semFaixa && d.semFaixa.parcela, v => pct(v)],
  estresse: ['estresse', 'Quanto custa', d => d.estresse && d.estresse.ct, grande],
  mediaAcesso: ['iMediaAprend', 'Em resumo', d => indic(d, 'mediaAcesso'), v => din(v, 2)],
  regimeAcesso: ['iRegimeAcesso', 'Em resumo', d => indic(d, 'regimeAcesso'), v => din(v, 2)],
  regimeAtivo: ['iRegimeAtivo', 'Em resumo', d => indic(d, 'regimeAtivo'), v => din(v, 2)],
  testeParticipante: ['iTeste', 'Em resumo', d => indic(d, 'teste'), v => din(v, 0)],
  beneficiario: ['iBenef', 'Em resumo', d => indic(d, 'beneficiario'), v => din(v, 2)],
  mdesPiloto: ['mdesPiloto', 'Como testar e avaliar', d => d.aval && d.aval.piloto && d.aval.piloto.mdes, (v, d) => fmtMdes(v, d), true],
  mdesEtapa: ['mdesEtapa', 'Como testar e avaliar', d => d.aval && d.aval.etapa && d.aval.etapa.mdes, (v, d) => fmtMdes(v, d), true],
  limiar: ['limiar', 'Como testar e avaliar', d => (d.limiar && d.limiar.completo ? d.limiar.frase : null), v => v, true],
};
const indic = (d, id) => { const x = (d.indicadores || []).find(z => z.id === id); return x ? x.bruto : null; };
function fmtMdes(v, d) {
  if (d && d.aval && d.aval.tipo === 'permanencia') return pp(100 * v * Math.sqrt(CONV_AVAL.taxaAbandono * (1 - CONV_AVAL.taxaAbandono)));
  return dp(v);
}
const vazioV = v => v == null || (typeof v === 'number' && !Number.isFinite(v)) || (Array.isArray(v) && (!v.length || v.some(x => x == null || !Number.isFinite(+x))));
/** chaves de número disponíveis para as regras */
export const CHAVES_NUMERO = Object.keys(CHAVES);

/**
 * Um número do caso para uma regra (campo `numero` do formato 3.1), lido do seletor d (k.d).
 * Sem números (d null) ou sem o valor: valor "a calcular" (traduzido) e falta = true.
 * Chaves: CHAVES_NUMERO, ou 'sub:K5.5' (custo de um subcomponente no custo total, com a média por ano de operação).
 */
export function numero(chave, d, extra) {
  const sub = /^sub:(K\d\.\d)$/.exec(String(chave || ''));
  if (sub) return numeroSub(sub[1], d, extra);
  const def = CHAVES[chave];
  const rot = def ? ROT(def[0]) : String(chave || '');
  const out = { id: chave, rotulo: tr(rot).replace(/\s*\(Ano \{0\}\)/, ''), valor: tr(A_CALCULAR_R5), bruto: null, fonte: def ? def[1] : '', ilustrativo: !!(def && def[4]), falta: true };
  if (def && d) {
    let v = null;
    try { v = def[2](d); } catch (e) { v = null; }
    if (!vazioV(v)) { out.bruto = v; out.valor = def[3](v, d); out.falta = false; }
  }
  if (out.ilustrativo && !out.falta) out.valor += ' (' + tr(ILUSTRATIVO) + ')';
  return Object.assign(out, extra || {});
}
function numeroSub(s, d, extra) {
  const out = { id: 'sub:' + s, rotulo: s, valor: tr(A_CALCULAR_R5), bruto: null, fonte: 'Quanto custa', ilustrativo: false, falta: true };
  if (d && d.av) {
    const L = d.av.linhas.filter(l => l.s === s);
    if (L.length) {
      const total = L.reduce((a, l) => a + l.ecoVP, 0);
      const T = d.av.r.anos.filter(t => t > 0);
      const porAno = T.length ? T.reduce((a, t) => a + L.reduce((b, l) => b + (l.eco[t] || 0), 0), 0) / T.length : 0;
      const ano0 = L.reduce((a, l) => a + (l.eco[0] || 0), 0);
      out.rotulo = tr(L[0].nome); out.bruto = { total, porAno, ano0 }; out.valor = grande(total); out.falta = false;
    }
  }
  return Object.assign(out, extra || {});
}
/**
 * Valores formatados para os marcadores {…} das regras: { central, p10, p50, p90, …, premissaNome, dot0…dotH }.
 * Sem números, {} (os marcadores saem "a calcular"). chaves: lista opcional para limitar.
 */
export function varsRec(d, chaves) {
  if (!d) return {};
  const ks = chaves && chaves.length ? chaves : CHAVES_NUMERO;
  const o = {};
  ks.forEach(k => { const x = numero(k, d); if (!x.falta) o[k] = x.valor; });
  if (!chaves) {
    if (d.premissa) { o.premissaNome = tr(d.premissa.nome); o.premissaLo = sinalGrande(d.premissa.lo); o.premissaHi = sinalGrande(d.premissa.hi); }
    (d.dot || []).forEach((x, t) => { o['dot' + t] = grande(x); });
    if (d.regime) o.anoRegime = String(d.regime.ano);
  }
  return o;
}

// ----------------------------------------------------------- linhas do relatório (Em resumo e Quanto custa)
/** P50, P90, diferença e nota do cenário-base para a faixa do "Em resumo" (decisão 3). */
export function faixaRec(d) {
  if (!d) return null;
  return {
    p10: d.p10, p50: d.p50, p90: d.p90, central: d.central, p50Delta: d.p50Delta,
    p10Txt: grande(d.p10), p50Txt: grande(d.p50), p90Txt: grande(d.p90), centralTxt: grande(d.central),
    p50Rot: T5('kP50', grande(d.p50)), p90Rot: T5('kP90', grande(d.p90)),
    p50DeltaTxt: d.p50Delta > 0.0005 ? T5('kP50Delta', pct(d.p50Delta, 1)) : '', notaBase: T5('kNotaBase'),
    aviso: avisoSemFaixa(d), notaEstresse: notaEstresse(d),
  };
}
/** REC-37: aviso quando os itens sem faixa passam de 25% do custo total ('' quando não) */
export function avisoSemFaixa(d) {
  const sf = d && d.semFaixa;
  if (!sf || !(sf.parcela > 0.25)) return '';
  const itens = sf.itens.slice(0, 3).map(x => tr(x.nome) + ', ' + grande(x.valor)).join('; ');
  return T5('avisoSemFaixa', pct(sf.parcela), itens);
}
/** REC-37: por que o estresse pode passar do P90 ('' quando não passa) */
export function notaEstresse(d) {
  if (!d || !d.estresse || !d.estresse.acimaP90) return '';
  return T5('notaEstresse', grande(d.estresse.ct), grande(d.p90));
}
/** Frases da linha "Indicadores" das seis respostas (sem "sem passar de US$ x"; ECO-10). */
export function frasesIndicadoresRec(d) {
  if (!d) return [];
  const L = [];
  const at = (d.indicadores || []).find(x => x.id === 'regimeAtivo');
  if (at) L.push(T5('inRegime', at.valor, d.regime ? d.regime.ano : '', tr(A_DEFINIR)));
  const lm = d.limiar;
  if (lm && lm.frase) L.push(T5('inLimiar', lm.frase + ' (' + tr(lm.completo ? ILUSTRATIVO : A_COMPLETAR) + ')'));
  return L;
}
