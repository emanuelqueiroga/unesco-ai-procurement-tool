// Pacote ORC: P50, dotação e premissa principal (lente "Custo e contrato"). Formato: regras/index.js.
// R2: `expansao-recorrente` vira R-73 com o texto atual.
// R4 (4c, REC-28): R-72 (orçar pelo P50 e reservar até o P90, decisão 3), R-73 (dotação de cada exercício, antes de levar ao
// mercado) e R-74 (confirmar a premissa que mais move o custo). Números só por varsRec(d, [chaves]) e numero() de
// rec_numeros.js: a simulação só roda quando uma destas regras é lida.
import { numero, varsRec } from '../rec_numeros.js';

const horizonte = k => (k.d && k.d.H) || +k.v('horizonte') || 0;
const SEM_DOTACAO = ['nao', 'parcial', 'nao_sei'];
/** a premissa que mais move o custo é de pessoal? (a linha do tornado se chama "Custo carregado de pessoal") */
const premissaPessoal = d => !!(d && d.premissa && /pessoa|pessoal/i.test(String(d.premissa.id) + ' ' + String(d.premissa.nome)));
/** parte do custo total que a premissa que mais o move pode mudar (pior lado da faixa do tornado) */
const pesoPremissa = d => (d && d.premissa && +d.total > 0 ? d.premissa.amplitude / d.total : 0);
const pesoSemFaixa = d => (d && d.semFaixa ? +d.semFaixa.parcela || 0 : 0);

/** @type {import('./index.js').Regra[]} */
export const REGRAS_ORC = [
  {
    id: 'R-72', versao: 1, pacote: 'ORC', tipo: 'custo', substitui: [], campos: ['tipoTec'],
    se: k => !!k.d,
    origem: k => (k.v('tipoTec') ? { campo: 'tipoTec' } : { campo: 'situacao' }),
    variantes: [
      { quando: k => k.d.p50Delta > 0.005,
        oque: 'Orçar pelo P50 da simulação e reservar a diferença até o P90, e não pelo valor central.',
        porque: 'Em mais da metade dos cenários o custo passa de {central}: o P50 é {p50}, o P10 {p10} e o P90 {p90}.',
        como: ['Pedir a dotação pelo valor do P50 ({p50Delta} sobre o valor central) e registrar o P90 como teto prudente.', 'Mostrar à instância que aprova o orçamento a faixa do P10 ao P90, e não só o valor central.'] },
      { oque: 'Orçar pelo P50 da simulação e reservar a diferença até o P90, e não pelo valor central.',
        porque: 'O P50 é {p50}, praticamente igual ao central ({central}); o P10 é {p10} e o P90, {p90}, até onde convém reservar.',
        como: ['Pedir a dotação pelo valor do P50 e registrar o P90 como teto prudente.', 'Mostrar à instância que aprova o orçamento a faixa do P10 ao P90, e não só o valor central.'] },
    ],
    paraque: 'A dotação cobre o custo provável, e a reserva cobre o que a simulação mostra como risco razoável.',
    quem: ['orcamento'], marco: 'M3', pd: 6,
    alta: k => !!k.d && k.d.p50Delta > 0.05,
    numero: (k, d) => numero('p50', d, { emJogo: Math.max(1, (+d.p50 || 0) - (+d.central || 0)) }),
    vars: (k, d) => varsRec(d, ['central', 'p10', 'p50', 'p90', 'p50Delta']),
    semExige: 'Reserva orçamentária da própria rede; não gera cláusula.',
    pronto: 'A dotação pedida segue o P50 da simulação, e a reserva até o P90 está registrada.',
  },
  {
    id: 'R-73', versao: 2, pacote: 'ORC', tipo: 'custo', substitui: ['expansao-recorrente'], campos: ['situacao', 'horizonte'],
    se: k => !!k.d && horizonte(k) >= 1 && (k.d.pRecorrente >= 0.5 || k.situacao === 'orcamento'),
    origem: k => (k.situacao === 'orcamento' ? { campo: 'situacao' } : { campo: 'horizonte' }),
    variantes: [{
      oque: 'Reservar a dotação de cada exercício e inscrevê-la no plano plurianual antes de levar a compra ao mercado.',
      porque: '{recorrente} do custo total é recorrente, de {dotFaixa} por ano na operação; um contrato sem dotação futura vira corte no meio do ciclo.',
      como: ['Enviar ao orçamento a tabela de dotação por exercício do plano, separando custeio e capital.', 'Reservar a margem de risco até o P90 do custo total.', 'Incluir a despesa no planejamento anual de compras e no plano plurianual antes de lançar o edital.'],
    }],
    paraque: 'O uso não para por falta de dotação no meio do contrato.',
    quem: ['orcamento'], marco: 'M3', pd: 6, curto: 'a dotação de cada exercício',
    // Condição só quando o contrato passa de um exercício e a pergunta nova `dotacao` (Refinar) diz que a despesa não está prevista
    condicao: k => horizonte(k) >= 2 && SEM_DOTACAO.includes(k.v('dotacao')),
    numero: (k, d) => numero('recorrente', d, { emJogo: (+d.total || 0) * (+d.pRecorrente || 0) }),
    vars: (k, d) => varsRec(d, ['recorrente', 'dotFaixa']),
    semExige: 'Dotação orçamentária da própria rede.',
    exemplosNorma: { BR: ['Lei Complementar 101/2000, art. 16 (impacto orçamentário-financeiro de despesa que dura mais de um exercício)'] },
    pronto: 'A dotação de cada exercício está reservada no plano plurianual, com a margem de risco.',
  },
  {
    id: 'R-74', versao: 1, pacote: 'ORC', tipo: 'custo', substitui: [], campos: ['tipoTec'],
    se: k => pesoPremissa(k.d) > 0.05 || pesoSemFaixa(k.d) > 0.10,
    origem: k => (k.v('tipoTec') ? { campo: 'tipoTec' } : { campo: 'situacao' }),
    variantes: [
      { quando: k => pesoPremissa(k.d) > 0.05 && premissaPessoal(k.d),
        oque: 'Confirmar com a gestão de pessoas quem existe e quanto custa a equipe, a premissa que mais move o custo.',
        porque: 'A premissa que mais move o custo é {premissa}; confirmá-la reduz a incerteza mais do que refinar qualquer outra.',
        como: ['Pedir à gestão de pessoas a lista de quem existe, com o regime e o custo carregado de cada um.', 'Trocar o valor de exemplo da ferramenta pelo valor confirmado e reler o custo total.'] },
      { quando: k => pesoPremissa(k.d) > 0.05,
        oque: 'Confirmar primeiro a premissa que mais move o custo, com um valor que o mercado ou a rede possa sustentar.',
        porque: 'A premissa que mais move o custo é {premissa}; confirmá-la reduz a incerteza mais do que refinar qualquer outra.',
        como: ['Obter contrato de referência ou cotações de mais de um fornecedor que sustentem o valor da premissa.', 'Trocar o valor de exemplo da ferramenta pelo valor confirmado e reler o custo total.'] },
      { oque: 'Confirmar com cotações os itens que a simulação não consegue variar, e que somam parte relevante do custo total.',
        porque: 'Os itens sem faixa na simulação somam {semFaixa} do custo total, e por isso a faixa do P10 ao P90 subestima a incerteza.',
        como: ['Obter cotações de mais de um fornecedor para os itens sem faixa.', 'Trocar o valor de exemplo da ferramenta pelo valor confirmado e reler o custo total.'] },
    ],
    paraque: 'A estimativa se apoia em valores confirmados nos itens que mais pesam.',
    quem: ['compras', 'orcamento', 'pessoas'], marco: 'M3', pd: 6,
    alta: k => pesoPremissa(k.d) > 0.10,
    numero: (k, d) => numero('premissa', d, { emJogo: Math.max(0, d && d.premissa ? d.premissa.amplitude : 0) }),
    vars: (k, d) => varsRec(d, ['premissa', 'semFaixa']),
    semExige: 'Confirmação de um valor de custo da própria rede; não gera cláusula.',
    pronto: 'O valor da premissa que mais move o custo está confirmado e o custo total foi relido.',
  },
];
