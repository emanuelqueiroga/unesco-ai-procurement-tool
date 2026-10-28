// =====================================================================
// Relatório do plano de contratação (porte de src/relatorio.js da 0.0.15-rc.1, BL6 e BL5.3), parte pura: dados e
// textos do sumário executivo de "Em resumo" (faixa P10–P90, indicadores, seis respostas, cinco ações, icebergs por
// fase, três maiores direcionadores), das tabelas novas de "Quanto custa" (custo por fase, indicadores do custo total,
// adoção, cenários, direcionadores, simulação), dos títulos-achado e dos anexos "Premissas e fontes" e "Glossário".
// A página (screens/Plano.tsx, Iceberg.tsx), as seções (secoes.js) e o PDF (pdf.js) leem daqui: mesmos números,
// mesmos nomes. Nada de DOM; os textos em português são as chaves de tradução (os da 0.0.15 ficam iguais, para
// reaproveitar i18n/v15_relatorio_<l>.json); {0}, {1}… são lugares de valores.
// Monte Carlo: 1.500 cenários com semente fixa 20261003, calculados uma vez por caso (cache pela cfg): digitar o
// título, trocar de página do plano ou gerar o PDF não refaz a simulação.
// Caso sem números (sem o tipo de tecnologia, 2.3.4): relDados devolve null e nada aqui mostra valor.
// Módulos de outros pacotes (referencias.js, glossario.js, ajuda.js) entram por import.meta.glob: se ainda não
// existirem, as partes que dependem deles somem, sem quebrar o build.
// =====================================================================
import {
  tr, grande, din, mil, pct, unidMil, fmtInt, LOC, clone,
  numerosCusto, cfgAtual, FASES_MOTOR, TIPO_REC, QUANDO_REC, trRec, rotuloQuem,
} from '../domain/index.ts';
import { temNumeros } from '../percurso/painel.ts';
// R5 (REC-32 a REC-37): números ligados às recomendações, P50/P90, indicadores rotulados, avaliabilidade, limiar e
// parcela sem faixa; a simulação, o tornado e os cenários são os mesmos das regras (um cálculo por caso)
import { numerosRec, pesadoRec, recCacheTamanho, faixaRec, frasesIndicadoresRec, valeOQueCusta, REC_N_SIM, REC_SEMENTE } from '../domain/rec_numeros.js';

export const REL_N_SIM = REC_N_SIM;
export const REL_SEMENTE = REC_SEMENTE;

// módulos opcionais (pacotes C e E): {} enquanto o arquivo não existe
const OPCIONAIS = import.meta.glob(['../domain/referencias.js', '../domain/glossario.js', '../domain/ajuda.js'], { eager: true });
function opcional(arq, nome) {
  const m = OPCIONAIS['../domain/' + arq + '.js'];
  return m && typeof m[nome] === 'function' ? m[nome] : null;
}

// ----------------------------------------------------------- textos (chaves de tradução)
export const TXT_REL = {
  // aberturas das páginas e perguntas de decisão (0.0.15: sinteseAbre, q1–q5, i1–i5)
  sinteseAbre: 'O que se propõe, por que, para que, como, o que será entregue e como medir, com os números principais da estimativa ilustrativa.',
  q2: 'O que custa e quando', q3: 'O que pode mudar o custo', q4: 'O que exigir na contratação', q5: 'Que governança é necessária',
  i2: 'Esta seção mostra quanto se gasta em cada fase e em cada ano, separando o que é pago uma vez do que se repete. Serve para pedir a dotação de cada exercício.',
  i3: 'Esta seção mostra o que pode fazer o custo subir ou cair e quanto. Serve para decidir quais premissas confirmar antes de contratar.',
  anexosAbre: 'Detalhes de apoio ao corpo do plano.',
  // títulos-achado
  h2: 'Os custos recorrentes são {0} do total',
  h3: 'O custo total pode ficar entre {0} e {1}',
  // REC-12: o mesmo valor de "Quanto custa" (camada de saída do custo total) e o desembolso com o seu rótulo
  h4Sair: 'Sair do contrato custaria {0} no custo total, com desembolso de transição de {1} ({2} anos de custo recorrente)',
  h4SairV: 'Sair do contrato custaria {0} no custo total',
  h4Req: 'O contrato deve cobrir {0} requisitos e cláusulas deste caso',
  h5Nenhuma: 'Nenhuma das {0} condições de governança está confirmada',
  h5Algumas: 'Estão confirmadas {0} de {1} condições de governança',
  h5Todas: 'Todas as {0} condições de governança estão confirmadas',
  // TCO e indicadores
  kTco: 'Custo total do ciclo de vida (TCO)',
  kTcoFaixa: 'Faixa provável (P10 a P90): {0} a {1}',
  kTcoNotaD: 'Soma dos custos de todos os anos, em preços do Ano 0 e descontada à taxa de {0} ao ano. A faixa vem de {1} simulações; o valor central é o cenário esperado.',
  kTcoNota0: 'Soma dos custos de todos os anos, em preços do Ano 0 e sem desconto. A faixa vem de {0} simulações; o valor central é o cenário esperado.',
  kTco80: 'Em 80% dos cenários simulados, o custo total fica dentro da faixa.',
  kCentral: 'valor central',
  // R5 (decisão 3, REC-36): o central é o cenário-base; o P50 vai ao lado como "valor para orçar"
  kTcoNotaD5: 'Soma dos custos de todos os anos, em preços do Ano 0 e descontada à taxa de {0} ao ano. A faixa vem de {1} simulações; o valor central é o cenário-base, com cada premissa no valor mais provável.',
  kTcoNota05: 'Soma dos custos de todos os anos, em preços do Ano 0 e sem desconto. A faixa vem de {0} simulações; o valor central é o cenário-base, com cada premissa no valor mais provável.',
  kP50P90: 'Valor para orçar (P50): {0}. Teto prudente (P90): {1}.',
  kDot0: 'Dotação do Ano 0: {0}.',
  kAno0: 'Custo do Ano 0 (prova de conceito ou piloto)',
  kAprAcesso: 'Por aprendiz com acesso por ano',
  kProfAcesso: 'Por professor com acesso por ano',
  kUsu: 'Por usuário ativo por ano',
  kRegime: 'Custo anual em regime (Ano {0})',
  regimeDesemb: 'A rede desembolsa {0} nesse ano.',
  regimePlena: 'Primeiro ano em que o uso chega à escala plena.',
  regimeUltimo: 'A escala plena não é alcançada no horizonte: vale o último ano.',
  regimeDepois: 'Primeiro ano depois do fim do financiamento externo.',
  regimeFinanc: 'Há financiamento externo até o fim do horizonte: o valor inclui insumos cedidos.',
  // seis respostas
  exT: 'A proposta em seis respostas',
  exDim: 'Dimensão', exResp: 'Resposta deste caso',
  exOque: 'O quê?', exOqueP: 'O que será feito?',
  exPorque: 'Por quê?', exPorqueP: 'Por que isso precisa ser feito?',
  exParaque: 'Para quê?', exParaqueP: 'Qual é a finalidade?',
  exComo: 'Como?', exComoP: 'Como será realizado?',
  exEntreg: 'Entregáveis', exEntregP: 'O que será produzido?',
  exInd: 'Indicadores', exIndP: 'Como verificar se deu certo?',
  exQuem: 'Quem?', exQuando: 'Quando?',
  exFalta: 'Ainda sem resposta: complete o passo {0}.',
  oqApl: 'Contratar e implantar uma solução de IA para: {0}.',
  oqUsu: 'Quem usa: {0}.',
  oqArq: 'Ponto de partida de arquitetura: {0}.',
  oqEsc: 'Alcance previsto: {0} pessoas com acesso à solução no Ano {1}.',
  pqProb: 'Problemas identificados: {0}.',
  pqSit: 'Situação atual: {0}',
  pqPri: 'Prioridades da rede: {0}.',
  paImp: 'Impacto desejado: {0}.',
  paRes: 'Resultado esperado: {0}',
  coTeste: 'Testar primeiro: {0} ({1}).',
  coTeste0: 'Testar primeiro: {0}.',
  coEtapa: 'Implantar numa primeira etapa: {0}.',
  coExp: 'Expandir até a rede toda: {0}.',
  coForm: 'Formar {0}, {1} por pessoa.',
  coForm0: 'Formar {0}.',
  coSup: 'Suporte aos usuários: {0}.',
  enTeste: 'Relatório de avaliação do teste, com a decisão de continuar, ajustar ou parar.',
  enContrato: 'Contrato com {0} requisitos e cláusulas deste caso, incluindo o plano de saída.',
  enUso: 'Solução em uso por {0} pessoas no Ano {1} ({2} das que têm acesso).',
  enForm: 'Pessoas formadas: {0}.',
  enGov: 'Condições de governança confirmadas antes de contratar ({0} de {1} hoje).',
  inRes: 'Resultado: {0}',
  inBase: 'Linha de base: {0}',
  inAdo: 'Adoção: parcela das pessoas com acesso que usam de fato (estimativa: {0} no Ano {1}).',
  inGov: 'Governança: condições confirmadas ({0} de {1} hoje).',
  // ações
  acoesAbre: 'Cada ação responde a seis perguntas. A lista sai das respostas deste caso: se uma resposta mudar, a ação muda.',
  acPorqueResp: 'A resposta “{1}” à pergunta {0} ({2}).',
  acOrigemCurta: 'Pergunta {0}: {1}.',
  acParaCustoT: 'Evitar que o teste comece sem as condições para medir resultado e custo.',
  acParaCustoC: 'Contratar com custo conhecido, preço previsível e saída possível.',
  acParaCustoM: 'Manter o custo sob controle durante a implantação e a expansão.',
  acParaPolT: 'Proteger estudantes e professores e garantir que o teste possa ser avaliado.',
  acParaPolC: 'Contratar com regras claras de uso, dados e responsabilidade.',
  acParaPolM: 'Manter o uso seguro, acompanhado e sujeito a revisão.',
  acComo: 'Revise a resposta {0} ({1}) e siga o detalhe em “{2}”.',
  acComo0: 'Siga o detalhe em “{0}”.',
  acQuem0: 'A equipe responsável pelo caso.',
  acQuandoT: 'Antes do teste: antes de começar a prova de conceito ou o piloto (Ano 0).',
  acQuandoC: 'Antes de contratar: antes de assinar o contrato da implantação (fim do Ano 0).',
  acQuandoM: 'Para manter e ampliar: durante a implantação e a expansão (Ano 1 em diante).',
  semAcoes: 'Ainda não há respostas suficientes para recomendar ações. Responda às perguntas das fases 1 a 4.',
  // custo em resumo e icebergs
  custoT: 'O custo em resumo',
  custoAbre: 'Quanto cada fase custa por ano, o que aparece no preço da proposta e o que fica escondido, e o que mais pode mudar o total.',
  icT: 'O custo de cada fase: o que se vê e o que fica escondido',
  icAbre: 'Acima da linha d’água, o que costuma aparecer no preço da proposta: dispositivos novos, licenças, consumo de IA, computação e hospedagem. Abaixo, o que a rede também paga para a solução funcionar. Valores por ano, em média, na conta econômica; as barras usam a mesma escala nas três fases.',
  icAnos: 'Ano {0}', icAnosAte: 'Anos {0} a {1}',
  icAcima: 'Preço da proposta', icAbaixo: 'Abaixo da linha d’água',
  icMedia: 'Por ano, em média', icTotal: 'Total da fase: {0}',
  icOculto: '{0} abaixo da linha d’água',
  icAlt: '{0}: {1} por ano, em média; {2} abaixo da linha d’água.',
  icNota: 'A divisão entre o preço da proposta e o que fica abaixo da linha d’água é uma convenção desta ferramenta, inspirada em Krueger e Jackson (2026, Beyond the price tag); não faz parte do quadro de camadas.',
  icDisp: 'Dispositivos novos', icLic: 'Licenças e assinaturas', icCons: 'Consumo de IA (uso pago)',
  icCon: 'Conectividade e acesso', icInf: 'Dados e conhecimento', icComp: 'Computação e hospedagem', icImp: 'Implantação e integração',
  icFor: 'Formação', icOpe: 'Operação e suporte', icGov: 'Governança e saída',
  direcionadores: 'O que mais move o custo',
  direcionadorFaixa: 'do mínimo ao máximo da faixa, o custo total muda de {0} a {1}',
  // como ler
  comoLer: 'Como ler este plano',
  comoLer2: 'Os valores são ilustrativos, a menos que o anexo de premissas cite uma fonte. Todos estão em preços do Ano 0.',
  comoLer3: 'Custo pago uma vez: implantação e compras iniciais. Custo recorrente: o que se repete todo ano. A faixa P10 a P90 mostra a incerteza: em 80% dos cenários simulados o custo fica dentro dela.',
  comoLer4: 'Em “Quem?”, a área indicada é a que age; confirme os nomes com a sua equipe.',
  comoLer5: 'Os termos técnicos estão explicados no glossário, no fim.',
  // custo por fase (MOT-03: as chaves do motor, i18n/v15_motor_*)
  sFases: 'Custo por fase', fFase: 'Fase', fAnos: 'Anos', fUnico: 'Pagamento único', fRecorr: 'Recorrente', fTotal: 'Total',
  fPessoas: 'Pessoas alcançadas', fAprend: 'Aprendizes', fProfs: 'Professores', anoUm: 'Ano {0}', anosAte: 'Anos {0} a {1}',
  fNotaMotor: 'O pagamento único reúne a implantação, a integração, a formação inicial e a compra de dispositivos. O recorrente reúne licenças, conectividade, operação, suporte, reciclagem da formação e reposição.',
  fNota: 'Valores na conta econômica, em valor presente. Pessoas alcançadas: o máximo de pessoas que teriam acesso à solução na fase. A saída entra na última fase.',
  // indicadores do custo total (MOT-04: as chaves do motor)
  sInd: 'Indicadores do custo total',
  indDesc: 'Custo total, descontado',
  indNominal: 'Custo total nominal (preços correntes, sem desconto)',
  indCae: 'Custo anual equivalente',
  indRec: 'Parte do custo total que é recorrente',
  indDesemb: 'Desembolso da rede nesse ano, em preços correntes:',
  indRegPlena: 'Custo anual em regime (Ano {0}, primeiro ano da Expansão com toda a rede)',
  indRegUltimo: 'Custo anual no último ano do horizonte (Ano {0}); a rede ainda não chega a todas as pessoas',
  indRegDepois: 'Custo anual em regime (Ano {0}, primeiro ano depois do fim do financiamento externo)',
  indRegFinanc: 'Custo anual em regime (Ano {0}); há financiamento externo até o fim do horizonte',
  // adoção, cenários, direcionadores e simulação
  gAdocaoT: 'Adoção e pessoas alcançadas',
  gAdocaoL: 'No Ano {0}, {1} pessoas teriam acesso à solução e {2} ({3}) a usariam de fato.',
  gAcesso: 'Pessoas que teriam acesso', gUso: 'Pessoas que usam de fato', gAdesao: 'Parcela que usa',
  exercicio: 'Exercício',
  sCenarios: 'Cenários', cenario: 'Cenário',
  gCenariosL: 'No cenário de estresse o custo total chega a {0}, {1} acima do esperado ({2}).',
  gCenariosL0: 'Os três cenários têm o mesmo custo total: {0}.',
  gUnico: 'Pago uma vez', gRecorr: 'Recorrente',
  cenAlta: 'Mais pessoas usam: adoção 50% maior, até 90%.',
  cenEstresse: 'Alta adoção, com preços, câmbio e consumo maiores.',
  cenEsperado: 'As premissas do caso.',
  sDirec: 'Direcionadores do custo', direcionador: 'Direcionador', faixa: 'Faixa',
  gTornadoS: 'Efeito sobre o custo total quando cada direcionador vai ao mínimo ou ao máximo da sua faixa; os demais ficam no valor provável',
  gTornadoL: 'O direcionador que mais pesa é {0}: do mínimo ao máximo da faixa, o custo total muda de {1} a {2}.',
  gReduz: 'No mínimo da faixa', gAumenta: 'No máximo da faixa', gBase: 'Custo central: {0}',
  sSimula: 'Simulação de incerteza',
  simP50: 'P50 (valor para orçar)', simP90: 'P90 (teto prudente)',
  simSaida: 'Saída', simCt: 'Custo total do ciclo de vida', simDot: 'Dotação total nos exercícios', simRisco: 'Custo em risco (P90 menos P50)',
  simNota: '{0} cenários, com semente fixa {1}: o mesmo caso dá sempre o mesmo resultado. Em cada cenário, os direcionadores variam dentro das suas faixas (distribuição triangular, com o valor mais provável no valor central). As faixas são convenções do guia, não medidas.',
  // premissas e fontes
  aG: 'Premissas e fontes',
  pPremissa: 'Premissa', pValor: 'Valor', pOrigem: 'Origem', pFonte: 'Fonte e ano', pGrau: 'Grau', pFaixa: 'Faixa de referência',
  pFora: 'Fora da faixa', pSemFaixa: 'sem faixa', pAno: 'ano {0}', pSemFonte: 'sem fonte informada',
  pIntro: 'Todos os valores que o cálculo usou, com a origem de cada um. Valores fora da faixa de referência estão marcados e destacados.',
  pGraus: 'Graus: A, estatística oficial; B, estudo ou registro de compra; C, estimativa de especialista ou convenção da ferramenta.',
  pVazio: 'Nenhuma premissa com valor.',
  pOrPais: 'dos dados do país', pOrUsuario: 'editado por você', pOrRegiao: 'estimado pela região', pOrIlustr: 'valor ilustrativo',
  pVersao: 'Base de referências v{0}; perfis de país v{1} ({2}).',
  pLista: 'Premissas desta estimativa',
  metodos: 'Como o modelo funciona hoje',
  met1: 'O modelo calcula o custo de cada ano em duas contas: a econômica (preços do Ano 0, com o tempo das equipes da rede e os insumos cedidos, descontada à taxa real informada) e a orçamentária (preços correntes, só o que a rede desembolsa).',
  met2: 'Os custos são distribuídos pelas sete camadas do quadro de Krueger e Jackson (2026) e pelas fases do caso. Essa distribuição é uma convenção desta ferramenta.',
  met3: 'Três cenários são comparados: o esperado, o de alta adoção (adoção 50% maior, até 90%) e o de estresse (alta adoção com preços, câmbio e consumo maiores).',
  met4: 'A simulação de Monte Carlo sorteia {0} vezes os direcionadores dentro de faixas plausíveis, com choques comuns de adoção e câmbio e semente fixa ({1}). P10 e P90 são os percentis 10 e 90 do custo total; a faixa mostrada nunca exclui o valor central.',
  met5: 'Limites: as faixas dos direcionadores são convenções do guia, não medidas; a simulação não inclui riscos de contrato, mudanças na lei nem erros nos dados; o modelo não estima benefícios nem efeito na aprendizagem; o custo de saída depende do fechamento escolhido.',
  met6: 'Os valores são ilustrativos, salvo os que a tabela dá como dado do país ou da região, ou com fonte de grau A ou B.',
  // glossário
  aH: 'Glossário', gTermo: 'Termo', gSignif: 'Significado', gIntro: 'Termos técnicos e orçamentários, em linguagem simples.',
};
/** tr() com {0}, {1}… */
export const trN = (t, ...v) => String(tr(t)).replace(/\{(\d+)\}/g, (_, i) => (v[+i] != null ? v[+i] : ''));
export const R = (k, ...v) => trN(TXT_REL[k], ...v);
/** todos os textos novos (para o levantamento de chaves e os testes de tradução) */
export function textosRelatorio() { return Object.values(TXT_REL); }

const numP = (x, d = 1) => (+x || 0).toLocaleString(LOC(), { maximumFractionDigits: Math.abs(+x || 0) < 1 && d > 0 ? 2 : d, minimumFractionDigits: 0 });
const vezes = x => '×' + (+x || 0).toLocaleString(LOC(), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const relMais = (x, s) => (x < 0 ? '−' : '+') + s;
const relSinal = x => (Math.abs(x) < 0.5 ? grande(0) : relMais(x, grande(Math.abs(x))));
const relCap = s => { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };
const nomeFase = id => tr((FASES_MOTOR.find(z => z[0] === id) || ['', id])[1]);
const anosTxt = anos => (anos.length === 1 ? R('anoUm', anos[0]) : R('anosAte', anos[0], anos[anos.length - 1]));

// ----------------------------------------------------------- números (uma simulação por caso)
/**
 * Parte cara (simulação, tornado, cenários), guardada por caso: a página, o PDF, as regras (k.d) e os testes chamam
 * várias vezes. R5: o cache é o de domain/rec_numeros.js (pesadoRec), o mesmo das recomendações.
 */
export function relPesado(cfg) { return pesadoRec(cfg); }
/** quantas simulações já rodaram (testes: a segunda chamada do mesmo caso não roda de novo) */
export const relCacheTamanho = () => recCacheTamanho();

function copiaEstado(estado) {
  const e = Object.assign({}, estado || {});
  if (e.custo) e.custo = Object.assign({}, e.custo, { cfg: e.custo.cfg ? clone(e.custo.cfg) : null });
  return e;
}

/**
 * Números do relatório, ou null quando o plano não mostra números (sem o tipo de tecnologia) ou a estimativa falha.
 * pre: { cfg, custo } já calculados (secoes.js), para não refazer numerosCusto.
 */
export function relDados(estado, pre) {
  try {
    if (!temNumeros(estado)) return null;
    let cfg = pre && pre.cfg, n = pre && pre.custo;
    if (!cfg || !n) { cfg = cfgAtual(copiaEstado(estado)); n = numerosCusto(cfg); }
    if (!n || !n.av || !n.av.tco || !n.av.fases) return null;
    const av = n.av, tco = av.tco;
    const P = relPesado(cfg);
    const central = tco.tcoDescontado;
    // R5: o mesmo seletor das regras (k.d), com P50/P90, indicadores rotulados, avaliabilidade, limiar e sem faixa
    const rec = numerosRec(estado, { cfg, custo: n });
    // a faixa nunca exclui o valor central (a distribuição é assimétrica)
    const lo = Math.min(P.sim.ct.p10, central), hi = Math.max(P.sim.ct.p90, central);
    const fases = av.fases.ids.map(id => av.fases.porFase[id]).filter(f => f.anos.length);
    return { n, cfg, av, tco, H: av.r.H, T: av.r.anos, E: av.r.E, U: av.r.U, sim: P.sim, tor: P.tor, cen: P.cen,
      central, lo, hi, fases, ano0: (av.ecoAno || [])[0] || 0, anual: tco.anual,
      aprendiz: tco.custoPorAprendizAno, professor: tco.custoPorProfessorAno, usuario: n.porAluno,
      saida: n.orc ? n.orc.saida || 0 : 0, saidaEco: av.saidaEco || 0, anosParaSair: (n.ind || {}).anosParaSair || 0, rec };
  } catch (e) { console.warn(e); return null; }
}

// ----------------------------------------------------------- TCO, faixa e indicadores
/** O TCO com a faixa P10–P90 e as posições (0–100) da barra com o marcador do valor central. */
// R5 (decisão 3, REC-36, REC-37): o valor central continua na manchete e o P50 vai ao lado como "valor para orçar",
// com o P90 como "teto prudente" (p50Rot, p90Rot, pP50); a nota abre com os dois. aviso: itens sem faixa > 25% do
// custo total; notaEstresse: por que o estresse passa do P90. Campos novos para a página e o PDF (pacote R6).
export function relFaixa(d) {
  if (!d) return null;
  const w = Math.max(d.hi - d.lo, d.central * 0.02), a = d.lo - 0.5 * w, b = d.hi + 0.5 * w;
  const pos = v => Math.max(0, Math.min(100, (100 * (v - a)) / (b - a)));
  const r = d.tco.r;
  const fr = faixaRec(d.rec) || {};
  const p50 = d.rec ? d.rec.p50 : d.sim.ct.p50, p90 = d.rec ? d.rec.p90 : d.sim.ct.p90;
  const soma = r ? R('kTcoNotaD5', pct(r, r < 0.1 ? 1 : 0), fmtInt(d.sim.N)) : R('kTcoNota05', fmtInt(d.sim.N));
  return {
    central: d.central, lo: d.lo, hi: d.hi, rotulo: R('kTco'),
    centralTxt: grande(d.central), loTxt: grande(d.lo), hiTxt: grande(d.hi), faixaTxt: R('kTcoFaixa', grande(d.lo), grande(d.hi)),
    nota: R('kP50P90', grande(p50), grande(p90)) + ' ' + soma + ' ' + R('kTco80'),
    alt: R('kTcoFaixa', grande(d.lo), grande(d.hi)) + '; ' + R('kCentral') + ': ' + grande(d.central) + '; ' + R('kP50P90', grande(p50), grande(p90)),
    pLo: pos(d.lo), pHi: pos(d.hi), pCentral: pos(d.central), pP50: pos(p50),
    p50, p90, p50Txt: grande(p50), p90Txt: grande(p90), p50Rot: fr.p50Rot || '', p90Rot: fr.p90Rot || '',
    p50Delta: fr.p50Delta || 0, p50DeltaTxt: fr.p50DeltaTxt || '', notaBase: fr.notaBase || '',
    aviso: fr.aviso || '', notaEstresse: fr.notaEstresse || '',
  };
}
function notaRegime(an) {
  if (an.rotulo === 'ultimo_ano_do_horizonte') return R('regimeUltimo');
  if (an.rotulo === 'depois_do_financiamento') return R('regimeDepois');
  if (an.rotulo === 'financiamento_ate_o_fim') return R('regimeFinanc');
  return R('regimePlena');
}
/**
 * Indicadores ao lado do TCO (R5, REC-35; seção 5.1): o custo do Ano 0 com a dotação do Ano 0 e os indicadores
 * rotulados pela pergunta que respondem (domain/rec_numeros.js:indicadoresRec): média do ciclo por pessoa com acesso,
 * custo em regime por pessoa com acesso (ou por estudante atendido, quando quem usa não é quem recebe o efeito),
 * custo em regime por usuário ativo e custo do teste por participante. `pergunta`: a pergunta que cada um responde.
 * kpi: o KPI do painel cujo "de onde vem?" explica o número. Sai a frase "sem passar de US$ x" (ECO-10).
 */
export function relIndicadores(d) {
  if (!d) return [];
  if (d.rec && d.rec.indicadores) {
    const dot0 = (d.rec.dot || [])[0];
    const L = [{ id: 'ano0', kpi: 'kpi.ano0', rotulo: R('kAno0'), valor: grande(d.ano0), cheio: din(d.ano0), bruto: d.ano0,
      nota: dot0 != null ? R('kDot0', grande(dot0)) : '' }];
    // o indicador da média do ciclo mantém o id do papel ('aprendiz' | 'professor' | 'pessoa'), como antes do R5
    d.rec.indicadores.forEach(x => L.push({ id: x.id === 'mediaAcesso' ? x.papel : x.id, kpi: x.id === 'teste' ? 'kpi.ano0' : 'kpi.porAluno', rotulo: x.rotulo, pergunta: x.pergunta,
      valor: x.valor, cheio: x.valor, bruto: x.bruto, nota: x.nota || '' }));
    return L;
  }
  const L = [
    { id: 'ano0', kpi: 'kpi.ano0', rotulo: R('kAno0'), valor: grande(d.ano0), cheio: din(d.ano0), bruto: d.ano0 },
    { id: 'regime', kpi: 'kpi.anual', rotulo: R('kRegime', d.anual.ano), valor: grande(d.anual.eco), cheio: din(d.anual.eco), bruto: d.anual.eco,
      nota: notaRegime(d.anual) + ' ' + R('regimeDesemb', grande(d.anual.desembolso)) },
  ];
  if (d.aprendiz != null) L.push({ id: 'aprendiz', kpi: 'kpi.porAluno', rotulo: R('kAprAcesso'), valor: din(d.aprendiz, 2), bruto: d.aprendiz });
  else if (d.professor != null) L.push({ id: 'professor', kpi: 'kpi.porAluno', rotulo: R('kProfAcesso'), valor: din(d.professor, 2), bruto: d.professor });
  L.push({ id: 'usuario', kpi: 'kpi.porAluno', rotulo: R('kUsu'), valor: din(d.usuario, 2), bruto: d.usuario });
  return L;
}
/** Os n maiores direcionadores do tornado, com a faixa, a barra (0–1) e a frase. */
export function relDirecionadores(d, n = 3) {
  if (!d || !d.tor) return [];
  const rows = d.tor.rows.slice(0, n);
  const mx = Math.max(1e-9, ...rows.map(r => Math.max(Math.abs(r.lo), Math.abs(r.hi))));
  return rows.map(r => ({ id: r.id, nome: tr(r.nome), faixa: vezes(r.min) + ' – ' + vezes(r.max), lo: r.lo, hi: r.hi,
    loTxt: relSinal(r.lo), hiTxt: relSinal(r.hi), txt: R('direcionadorFaixa', relSinal(r.lo), relSinal(r.hi)), w: Math.max(Math.abs(r.lo), Math.abs(r.hi)) / mx }));
}

/**
 * R5 (REC-33, REC-34): dados de "Como testar e avaliar" para a página e o PDF (pacote R6): o tamanho mínimo de efeito
 * detectável do piloto e da 1ª etapa, com as premissas e o rótulo "ilustrativo, a confirmar", e o bloco "Vale o que
 * custa?" (fórmula com o custo do caso quando falta resposta). estado: o mesmo de relDados. null sem números.
 */
export function relAvaliacao(d, estado) {
  if (!d || !d.rec) return null;
  return { aval: d.rec.aval || null, vale: valeOQueCusta(estado, d.rec) };
}

// ----------------------------------------------------------- icebergs por fase
// Soma, por fase e por subcomponente, os mesmos valores de decomporFases (conta econômica em valor presente; saída e
// valor residual na fase do ano H): a soma de cada iceberg é av.fases.porFase[id].total.
export const IC_ACIMA = [['icDisp', ['K1.2']], ['icLic', ['K2.1']], ['icCons', ['K2.2']], ['icComp', ['K2.3', 'K2.5']]];
export const IC_ABAIXO = [['icCon', ['K1.1', 'K1.3']], ['icInf', ['K2.4']], ['icImp', ['K3.1', 'K3.2', 'K3.3', 'K3.4']],
  ['icFor', ['K4.3', 'K4.4']], ['icOpe', ['K4.1', 'K4.2']], ['icGov', ['K5.1', 'K5.2', 'K5.3', 'K5.4', 'K5.5', 'K6.1', 'K6.2', 'K6.3']]];
export function relIcebergs(d) {
  if (!d || !d.av || !d.av.fases) return null;
  const av = d.av, F = av.fases, T = av.r.anos, H = av.r.H;
  const porS = {}; F.ids.forEach(id => { porS[id] = {}; });
  const soma = (id, sub, v) => { porS[id][sub] = (porS[id][sub] || 0) + v; };
  av.linhas.forEach(l => T.forEach(t => { if (l.eco[t]) soma(F.faseAno[t], l.s, l.eco[t] * av.disc[t]); }));
  (av.saida || []).forEach(x => soma(F.faseAno[H], x.s, x.ecoVP));
  if (av.vr) soma(F.faseAno[H], 'K6.3', -av.vr);
  const grupo = (id, G) => G.map(([k, ss]) => ({ k, nome: R(k), v: ss.reduce((a, z) => a + (porS[id][z] || 0), 0) }));
  const fases = F.ids.map(id => F.porFase[id]).filter(f => f.anos.length).map(f => {
    const n = f.anos.length, acima = grupo(f.id, IC_ACIMA), abaixo = grupo(f.id, IC_ABAIXO);
    const tA = acima.reduce((a, x) => a + x.v, 0), tB = abaixo.reduce((a, x) => a + x.v, 0);
    return { id: f.id, nome: nomeFase(f.id), anosTxt: n === 1 ? R('icAnos', f.anos[0]) : R('icAnosAte', f.anos[0], f.anos[n - 1]), n,
      total: f.total, media: f.total / n, acima: acima.map(x => Object.assign(x, { ano: x.v / n })), abaixo: abaixo.map(x => Object.assign(x, { ano: x.v / n })),
      tAcima: tA, tAbaixo: tB, pOculto: tA + tB > 0 ? Math.max(0, tB) / (Math.max(0, tA) + Math.max(0, tB)) : 0 };
  });
  const mx = Math.max(1e-9, ...fases.flatMap(f => f.acima.concat(f.abaixo).map(x => Math.abs(x.ano))));
  fases.forEach(f => {
    f.acima.concat(f.abaixo).forEach(x => { x.w = Math.max(0, x.ano) / mx; x.txt = grande(x.ano); x.zero = x.ano < 0.5; });
    f.mediaTxt = grande(f.media); f.totalTxt = R('icTotal', grande(f.total)); f.ocultoTxt = R('icOculto', pct(f.pOculto)); f.vazio = Math.abs(f.total) < 0.5;
    f.alt = R('icAlt', f.nome, f.mediaTxt, pct(f.pOculto));
  });
  return { h: R('icT'), abre: R('icAbre'), nota: R('icNota'), acima: R('icAcima'), abaixo: R('icAbaixo'), mediaRot: R('icMedia'), fases };
}

// ----------------------------------------------------------- tabelas de "Quanto custa" (já traduzidas e formatadas)
/** MOT-03: custo por fase, pagamento único × recorrente, pessoas, aprendizes e professores; total = custo total. */
export function relTabelaFases(d) {
  if (!d) return null;
  const L = d.fases;
  const temA = L.some(f => f.aprendizes > 0), temP = L.some(f => f.professores > 0);
  const u = ' (' + unidMil() + ')';
  const head = [R('fFase'), R('fAnos'), R('fUnico') + u, R('fRecorr') + u, R('fTotal') + u, R('fPessoas')].concat(temA ? [R('fAprend')] : []).concat(temP ? [R('fProfs')] : []);
  const rows = L.map(f => [nomeFase(f.id), anosTxt(f.anos), mil(f.unico), mil(f.recorrente), mil(f.total), fmtInt(f.pessoas)]
    .concat(temA ? [f.aprendizes > 0 ? fmtInt(f.aprendizes) : '—'] : []).concat(temP ? [f.professores > 0 ? fmtInt(f.professores) : '—'] : []));
  const s = k => L.reduce((a, f) => a + f[k], 0), mxp = k => Math.max(0, ...L.map(f => f[k] || 0));
  rows.push([tr('Total'), '', mil(s('unico')), mil(s('recorrente')), mil(s('total')), fmtInt(mxp('pessoas'))]
    .concat(temA ? [fmtInt(mxp('aprendizes'))] : []).concat(temP ? [fmtInt(mxp('professores'))] : []));
  return { head, rows, num: head.map((h, i) => i).filter(i => i >= 2), b0: true, pronto: true };
}
/** MOT-04: indicadores do custo total que não estão nos cartões de A2 (sem repetir o TCO nem o custo por usuário). */
export function relIndicadoresTCO(d) {
  if (!d) return [];
  const t = d.tco, an = d.anual, kv = [];
  if (t.r) kv.push([R('indDesc'), grande(t.tcoDescontado)]);
  kv.push([R('indNominal'), grande(t.tcoNominal)]);
  kv.push([R('indCae'), grande(t.cae)]);
  if (d.aprendiz != null) kv.push([R('kAprAcesso'), din(d.aprendiz, 2)]);
  if (d.professor != null) kv.push([R('kProfAcesso'), din(d.professor, 2)]);
  kv.push([R('indRec'), pct(t.pRecorrente)]);
  const rot = an.rotulo === 'ultimo_ano_do_horizonte' ? 'indRegUltimo' : an.rotulo === 'depois_do_financiamento' ? 'indRegDepois' : an.rotulo === 'financiamento_ate_o_fim' ? 'indRegFinanc' : 'indRegPlena';
  kv.push([R(rot, an.ano), grande(an.eco) + ' · ' + R('indDesemb') + ' ' + grande(an.desembolso)]);
  return kv;
}
/** Pessoas com acesso e que usam, por ano, com a parcela; e a frase de leitura. */
export function relAdocao(d) {
  if (!d) return null;
  const iH = d.T.length - 1, EH = d.E[iH], UH = d.U[iH];
  return {
    leitura: R('gAdocaoL', d.H, fmtInt(EH), fmtInt(UH), pct(EH ? UH / EH : 0)),
    table: { head: [R('exercicio')].concat(d.T.map(t => tr('Ano ' + t))),
      rows: [[R('gAcesso')].concat(d.T.map(t => fmtInt(d.E[t]))), [R('gUso')].concat(d.T.map(t => fmtInt(d.U[t]))),
        [R('gAdesao')].concat(d.T.map(t => pct(d.E[t] ? d.U[t] / d.E[t] : 0)))],
      num: d.T.map((t, i) => i + 1), pronto: true },
  };
}
/** Os três cenários lado a lado (pago uma vez, recorrente, total) e a frase de leitura. */
export function relCenarios(d) {
  if (!d || !d.cen) return null;
  const esp = d.cen[0], est = d.cen[2], u = ' (' + unidMil() + ')';
  const desc = { 'Esperado': R('cenEsperado'), 'Alta adoção': R('cenAlta'), 'Estresse': R('cenEstresse') };
  return {
    // R5 (REC-37): por que o estresse pode passar do P90 ('' quando não passa)
    nota: d.rec ? (faixaRec(d.rec) || {}).notaEstresse || '' : '',
    leitura: est.ct - esp.ct > 1 ? R('gCenariosL', grande(est.ct), pct((est.ct - esp.ct) / esp.ct), grande(esp.ct)) : R('gCenariosL0', grande(esp.ct)),
    table: { head: [R('cenario'), R('gUnico') + u, R('gRecorr') + u, R('fTotal') + u],
      rows: d.cen.map(c => [tr(c.nome) + '. ' + desc[c.nome], mil(c.unico), mil(c.rec), mil(c.ct)]), num: [1, 2, 3], b0: true, pronto: true },
  };
}
/** O tornado completo (até 6 direcionadores), com a frase de leitura. */
export function relTornado(d) {
  if (!d || !d.tor) return null;
  const L = relDirecionadores(d, 6);
  return {
    leitura: L[0] ? R('gTornadoL', L[0].nome, L[0].loTxt, L[0].hiTxt) : '',
    sub: R('gTornadoS') + '. ' + R('gBase', grande(d.central)) + '.',
    table: { head: [R('direcionador'), R('faixa'), R('gReduz'), R('gAumenta')], rows: L.map(r => [r.nome, r.faixa, r.loTxt, r.hiTxt]), num: [2, 3], b0: true, pronto: true },
  };
}
/** Simulação de incerteza: P10, P50, P90 e custo em risco do TCO e da dotação total. */
export function relSimulacao(d) {
  if (!d || !d.sim) return null;
  const lin = (rot, a) => [rot, mil(a.p10), mil(a.p50), mil(a.p90), mil(a.p90 - a.p50)];
  // R5 (REC-37): aviso de itens sem faixa (> 25% do custo total) e nota sobre o estresse; pos = as notas na ordem de leitura
  const fr = d.rec ? faixaRec(d.rec) || {} : {};
  const nota = R('simNota', fmtInt(d.sim.N), d.sim.seed);
  return {
    aviso: fr.aviso || '', notaEstresse: fr.notaEstresse || '', pos: [fr.aviso, nota, fr.notaEstresse].filter(Boolean),
    nota,
    // R6 (5.2, decisão 3): P50 e P90 rotulados
    table: { head: [R('simSaida') + ' (' + unidMil() + ')', 'P10', R('simP50'), R('simP90'), R('simRisco')], rows: [lin(R('simCt'), d.sim.ct), lin(R('simDot'), d.sim.dotTot)], num: [1, 2, 3, 4], b0: true, pronto: true },
  };
}

// ----------------------------------------------------------- títulos-achado (REL-08)
/** ex: { nReq, nSim, nG } */
export function relAchados(d, ex) {
  ex = ex || {};
  const o = {};
  if (d) {
    o.custa = R('h2', pct(d.tco.pRecorrente));
    o.incerteza = R('h3', grande(d.lo), grande(d.hi));
    const sEco = d.saidaEco > 0 ? d.saidaEco : d.saida;
    if (sEco > 0) o.exigir = d.anosParaSair && d.saida > 0 ? R('h4Sair', grande(sEco), grande(d.saida), numP(d.anosParaSair, 1)) : R('h4SairV', grande(sEco));
  }
  if (!o.exigir && ex.nReq > 0) o.exigir = R('h4Req', fmtInt(ex.nReq));
  if (ex.nG > 0) o.fazer = ex.nSim === 0 ? R('h5Nenhuma', ex.nG) : ex.nSim >= ex.nG ? R('h5Todas', ex.nG) : R('h5Algumas', ex.nSim, ex.nG);
  return o;
}

// ----------------------------------------------------------- seis respostas (sumário executivo)
// Tudo sai das respostas do caso (pares de "resumo", em português nas chaves) e dos números do motor; nada é inventado.
// campo: a pergunta que, respondida, preenche a dimensão (link "Responder" na página).
const REL_SEM = v => v == null || String(v).trim() === '' || String(v).trim() === '—';
const relPonto = s => String(s || '').trim().replace(/[.。]\s*$/, '');
/** resKv: pares [chave em português, valor] da seção "resumo"; ex: { nReq, nSim, nG } */
export function relExecutivo(resKv, d, ex) {
  ex = ex || {};
  const kv = {}; (resKv || []).forEach(([k, v]) => { kv[k] = v; });
  const g = k => (REL_SEM(kv[k]) ? '' : String(tr(kv[k])).replace(/\n\(.*\)$/s, '').replace(/\n/g, '; ').trim());
  const L = [];
  const dim = (id, kR, kP, passo, campo, frases) => L.push({ id, rot: R(kR), perg: R(kP), frases: frases.filter(Boolean), falta: R('exFalta', passo), campo });
  const iH = d ? d.T.length - 1 : 0, EH = d ? d.E[iH] : 0, UH = d ? d.U[iH] : 0;
  const eleg = d ? Math.round(EH) : 0;
  dim('oque', 'exOque', 'exOqueP', '2.1', 'tarefas', [g('Aplicações') && R('oqApl', relPonto(g('Aplicações'))), g('Quem usa') && R('oqUsu', relPonto(g('Quem usa'))),
    g('Arquitetura considerada') && R('oqArq', relPonto(g('Arquitetura considerada'))), eleg > 0 && R('oqEsc', fmtInt(eleg), d.H)]);
  dim('porque', 'exPorque', 'exPorqueP', '1.2', 'problemas', [g('Problemas marcados') && R('pqProb', relPonto(g('Problemas marcados'))), g('Situação atual') && R('pqSit', g('Situação atual')),
    !g('Problemas marcados') && g('Prioridades') && R('pqPri', relPonto(g('Prioridades')))]);
  dim('paraque', 'exParaque', 'exParaqueP', '1.2', 'impactos', [g('Impacto desejado') && R('paImp', relPonto(g('Impacto desejado'))), g('Resultado esperado e como medir') && R('paRes', g('Resultado esperado e como medir'))]);
  const teste = g('Prova de conceito ou piloto'), setup = g('Piloto: escolas, participantes e duração') || g('Prova de conceito: participantes e duração');
  const horas = g('Horas de formação por pessoa'), formados = g('Quem será formado');
  dim('como', 'exComo', 'exComoP', '2.0', 'testes', [teste && (setup ? R('coTeste', relPonto(teste), relPonto(setup)) : R('coTeste0', relPonto(teste))),
    g('Primeira etapa da implantação') && R('coEtapa', relPonto(g('Primeira etapa da implantação'))),
    g('Tempo para chegar a todos depois da implantação') && R('coExp', relPonto(g('Tempo para chegar a todos depois da implantação'))),
    formados && (horas ? R('coForm', relPonto(formados), relPonto(horas)) : R('coForm0', relPonto(formados))),
    g('Quem dá suporte aos usuários') && R('coSup', relPonto(g('Quem dá suporte aos usuários')))]);
  dim('entreg', 'exEntreg', 'exEntregP', '2.0', 'testes', [teste && R('enTeste'), ex.nReq > 0 && R('enContrato', fmtInt(ex.nReq)),
    UH > 0 && R('enUso', fmtInt(Math.round(UH)), d.H, pct(EH ? UH / EH : 0)), formados && R('enForm', relPonto(formados)),
    ex.nG > 0 && R('enGov', ex.nSim, ex.nG)]);
  // R5 (ECO-10, REC-35): sem "sem passar de US$ x" (a estimativa central não é teto); o custo em regime por usuário
  // ativo com o limite "a definir pela rede" e o limiar "vale o que custa" (fórmula com o custo do caso se faltar resposta)
  const indRec = d && d.rec ? frasesIndicadoresRec(d.rec) : [];
  dim('ind', 'exInd', 'exIndP', '1.2', 'resultado', [g('Resultado esperado e como medir') && R('inRes', g('Resultado esperado e como medir')),
    g('Linha de base') && R('inBase', g('Linha de base')), ...indRec,
    UH > 0 && R('inAdo', pct(EH ? UH / EH : 0), d.H), ex.nG > 0 && R('inGov', ex.nSim, ex.nG)]);
  return L;
}

// ----------------------------------------------------------- cinco ações em cartões (O quê, Por quê, Para quê, Como, Quem, Quando)
// R1 (REC-05, REC-06, REC-10): o "O quê" é a ação da regra (sem corte no ":"), o "Por quê" é a razão da regra (nunca a
// resposta nem códigos crus), a pergunta e a resposta vão para "Origem", e "Quem" é quem age (mapa da regra, seção 3.4);
// quemSabe (ajuda.js) fica só como reserva para itens sem esse mapa.
/**
 * recs: recomendações do caso (recomendacoesCaso, com origem/porque.resposta já em rótulo); n: quantas (5).
 */
export function relAcoes(recs, n = 5) {
  const quemSabe = opcional('ajuda', 'quemSabe');
  const juntaQuem = L => (L.length <= 1 ? L.join('') : L.slice(0, -1).join(', ') + ' ' + tr('e') + ' ' + L[L.length - 1]);
  return (recs || []).slice(0, n).map((r, i) => {
    const p = r.origem || r.porque || {};
    const resp = Array.isArray(p.resposta) ? p.resposta.map(z => tr(z)).join('; ') : String(p.resposta || '').split('; ').map(z => tr(z)).join('; ');
    const origem = p.n ? R('acPorqueResp', p.n, resp, String(tr(p.pergunta || ''))) + (p.sugerido ? ' (' + tr('sugerido') + ')' : '') : '';
    const q = r.quando === 'antes_teste' ? 'T' : r.quando === 'antes_contratar' ? 'C' : 'M';
    const pagina = tr(r.tipo === 'custo' ? 'O que exigir' : 'O que fazer');
    const oque = r.chaves ? trRec(r, 'oque') : String(tr(r.texto || ''));
    const razao = r.chaves ? trRec(r, 'razao') : String(tr(r.razao || ''));
    const passos = r.chaves ? trRec(r, 'como') : [];
    let quem = r.quem && r.quem.length ? relCap(juntaQuem(rotuloQuem(r.quem))) : '';
    if (!quem && quemSabe && p.n) { try { const z = quemSabe(String(p.n)); if (z) quem = relCap(tr(z)); } catch (e) { console.warn(e); } }
    const etiqueta = r.etiqueta ? ' ' + tr(r.etiqueta) : '';
    return {
      n: i + 1, id: String(r.id), tipo: r.tipo, prioridade: r.prioridade, quando: r.quando, nPergunta: p.n ? String(p.n) : '',
      tipoTxt: String(tr(TIPO_REC[r.tipo] || r.tipo || '')), quandoRot: String(tr((QUANDO_REC.find(z => z[0] === r.quando) || ['', r.quando || ''])[1])),
      oque: oque + etiqueta, texto: oque,
      porque: razao,
      origem, origemCurta: p.n ? R('acOrigemCurta', p.n, resp) + (p.sugerido ? ' (' + tr('sugerido') + ')' : '') : '',
      paraque: r.chaves && r.chaves.paraque ? trRec(r, 'paraque') : R((r.tipo === 'politica' ? 'acParaPol' : 'acParaCusto') + q),
      como: passos.length ? passos.join(' ') : p.n ? R('acComo', p.n, String(tr(p.pergunta || '')), pagina) : R('acComo0', pagina),
      passos,
      quem: quem || R('acQuem0'),
      quandoTxt: R('acQuando' + q),
      // R2: novos campos para os pacotes R3 e R6
      marco: r.marco || '', nivel: r.nivel || '', pronto: r.chaves && r.chaves.pronto ? trRec(r, 'pronto') : '', etiqueta: r.etiqueta ? tr(r.etiqueta) : '',
    };
  });
}

// ----------------------------------------------------------- premissas e fontes (pacote C: referencias.js)
const ORIGEM_ROT = { pais: 'pOrPais', usuario: 'pOrUsuario', regiao: 'pOrRegiao', ilustrativo: 'pOrIlustr' };
function valorPremissa(p, v) {
  if (Array.isArray(v)) return v.join(', ');
  if (v == null || v === '') return '—';
  if (!Number.isFinite(+v)) return String(tr(v));
  const u = String(p.unidade || '');
  if (/US\$|USD/.test(u)) return din(+v, Math.abs(+v) < 100 ? 2 : 0);
  if (/fração|%/.test(u) && Math.abs(+v) <= 1.5) return pct(+v, 1);
  return numP(+v, Math.abs(+v) < 10 ? 2 : 0) + (u && !/US\$|USD|fração|%/.test(u) ? ' ' + tr(u) : '');
}
function faixaPremissa(p) {
  if (p.baixo == null || p.alto == null || !(+p.alto > +p.baixo)) return R('pSemFaixa');
  return valorPremissa(p, p.baixo) + ' – ' + valorPremissa(p, p.alto);
}
/** A tabela de premissas do caso (null sem o módulo de referências), a nota dos graus e a versão das bases. */
export function relPremissas(estado) {
  const premissasDoCaso = opcional('referencias', 'premissasDoCaso'), versaoReferencias = opcional('referencias', 'versaoReferencias');
  let L = null;
  if (premissasDoCaso) { try { L = premissasDoCaso(copiaEstado(estado)) || []; } catch (e) { console.warn(e); L = []; } }
  let v = null;
  if (versaoReferencias) { try { v = versaoReferencias(); } catch (e) { console.warn(e); } }
  const metodos = ['met1', 'met2', 'met3'].map(k => R(k)).concat([R('met4', fmtInt(REL_N_SIM), REL_SEMENTE), R('met5'), R('met6')]);
  const versao = v ? R('pVersao', v.referencias || '?', v.paises || '?', v.data || '?') : '';
  if (!L) return { table: null, pos: [], metodos, versao, disponivel: false };
  const rows = L.map(p => [String(tr(p.rotulo)), valorPremissa(p, p.valor), R(ORIGEM_ROT[p.origem] || 'pOrIlustr'),
    [p.fonte ? String(tr(p.fonte)) : R('pSemFonte'), p.ano != null && p.ano !== '' ? R('pAno', p.ano) : ''].filter(Boolean).join(', '),
    p.grau || '—', (p.fora ? R('pFora') + ': ' : '') + faixaPremissa(p)]);
  const hl = L.map((p, i) => (p.fora ? i : -1)).filter(i => i >= 0);
  return {
    disponivel: true, nFora: hl.length,
    table: rows.length ? { head: [R('pPremissa'), R('pValor'), R('pOrigem'), R('pFonte'), R('pGrau'), R('pFaixa')], rows, hl, larg: [130, 62, 62, 100, 30, 0], pronto: true } : null,
    pos: rows.length ? [R('pGraus')] : [R('pVazio')], metodos, versao,
  };
}

// ----------------------------------------------------------- glossário (pacote E: glossario.js)
/** Tabela do glossário no idioma da interface, ou null sem o módulo. */
export function relGlossario() {
  const lista = opcional('glossario', 'glossarioLista');
  if (!lista) return null;
  const semMarcas = opcional('glossario', 'glossarioSemMarcas') || (s => String(s || ''));
  let L = [];
  try { L = lista(tr, LOC()) || []; } catch (e) { console.warn(e); L = []; }
  if (!L.length) return null;
  return { head: [R('gTermo'), R('gSignif')], rows: L.map(g => [semMarcas(g.termo) + (g.extenso ? ' (' + semMarcas(g.extenso) + ')' : ''), semMarcas(g.def)]), b0: true, larg: [140], pronto: true };
}
