// =====================================================================
// Catálogo de regras de recomendação (design/redesign/05-requisitos-recomendacoes.md, seções 3 e 6).
//
// COMO ADICIONAR OU MUDAR UMA REGRA (leia antes de editar um arquivo de pacote)
//  1. Cada pacote da seção 3.3 tem um arquivo: prob.js, teste.js, escala.js, dados.js, pessoas.js, uso.js,
//     compra.js, contrato.js, orc.js, tec.js e gov.js. Cada um exporta um array de regras no formato `Regra`
//     (typedef abaixo). Ponha a regra no arquivo do seu `pacote`; a ordem no array não importa (a saída é
//     ordenada pelo motor, e embaralhar o catálogo não pode mudar o resultado).
//  2. `id` é o R-nn do catálogo (seção 6): estável, nunca reaproveitado, citado na página, no PDF e na
//     exportação. Uma regra atual que sai ou se funde vai para `substitui` da regra que a absorve
//     (o teste rec_catalogo.test.ts confere que as 66 regras antigas têm destino).
//  3. Os gatilhos (`se`, `quando`, `condicao`, `marco`…) leem só o contexto `k` de recContexto(estado)
//     (recomendacoes.js; campos listados em `ContextoRec`). Não leia `estado` direto e não use `k.proxMarco`
//     em `se`, `condicao` nem `marco` (ele só fica definitivo depois da primeira passada).
//  4. Textos em português (são as chaves de tradução). `oque` começa com verbo no infinitivo, até 25 palavras,
//     sem ":" e sem citação; `porque` dá a razão e o risco de não fazer, até 30 palavras; `como` tem de 2 a 4
//     passos; `pronto` nunca fica vazio; regra de `tipo: 'custo'` tem `exige` (ids de EXIGE) ou `semExige` com o
//     motivo. Marcadores `{nome}` são preenchidos por `vars(k, d)`; sem valor, saem como "a calcular".
//     O lint (regras/lint.js) cobra isso no `npm test` (tests/unit/rec_lint.test.ts).
//  5. Normas e artigos não entram no texto principal: vão para `exemplosNorma` (decisão 5). Referências só as
//     que o documento traz sem "a verificar".
//  6. Rode `npx vitest run tests/unit/rec_` antes de terminar.
// =====================================================================
import { DADOS_REQ, CONTRATO } from '../framework.js';
import { REGRAS_PROB } from './prob.js';
import { REGRAS_TESTE } from './teste.js';
import { REGRAS_ESCALA } from './escala.js';
import { REGRAS_DADOS } from './dados.js';
import { REGRAS_PESSOAS } from './pessoas.js';
import { REGRAS_USO } from './uso.js';
import { REGRAS_COMPRA } from './compra.js';
import { REGRAS_CONTRATO } from './contrato.js';
import { REGRAS_ORC } from './orc.js';
import { REGRAS_TEC } from './tec.js';
import { REGRAS_GOV } from './gov.js';
import { PENDENCIAS } from './pendencias.js';

/**
 * @typedef {'PROB'|'TESTE'|'ESCALA'|'GOV'|'DADOS'|'PESSOAS'|'USO'|'COMPRA'|'CONTRATO'|'ORC'|'TEC'} Pacote
 * @typedef {'M1'|'M2'|'M3'|'M4'|'M5'} Marco
 * @typedef {'gabinete'|'pedagogica'|'escolas'|'formacao'|'inclusao'|'avaliacao'|'tecnologia'|'protecao_dados'|'juridico'|'compras'|'orcamento'|'pessoas'|'fiscal'|'controle'|'comunicacao'} Area
 *
 * @typedef {Object} ContextoRec  contexto `k` das regras (recContexto em recomendacoes.js)
 * @property {Object} c            caso como respondido (estado.caso)
 * @property {Object} ce           caso efetivo (casoAtual: classes, dados, arquitetura, implantacaoEfetiva…)
 * @property {(id:string)=>any} v  valor respondido de um campo ('' se não respondido)
 * @property {(id:string)=>any[]} arr  o mesmo, sempre como lista
 * @property {(id:string)=>string} resp  resposta de governança (1.3.x): 'sim'|'parcial'|'nao'|'nao_sei'|''
 * @property {(id:string)=>string} falta  "O que falta?" de uma resposta "Em parte" (1.3.x)
 * @property {Object} rec          recomendarTeste(ce): { modo: 'poc'|'piloto'|'ambos', ids, motivos }
 * @property {''|'poc'|'piloto'|'ambos'|'recomendar'} teste  teste escolhido na 2.0
 * @property {boolean} poc         o teste efetivo é só uma prova de conceito
 * @property {boolean} temPiloto   haverá piloto (escolhido ou recomendado)
 * @property {string} nivel        perfil.agregado: 'limitado'|'moderado'|'elevado'|'critico'
 * @property {string[]} determinantes  dimensões que fixam o nível
 * @property {boolean} alto        nivel elevado ou crítico
 * @property {string} forma        formaSupervisao: 'caso'|'critica'|'excecao'|'amostra'|'sistema'
 * @property {{nivel:string,texto:string,cap:number}[]} alertas  alertas(ce, perfil)
 * @property {'saas'|'api'|'ow'} arqEf   arquitetura escolhida na 3.2.1 ou presumida
 * @property {boolean} arqPresumida  verdadeiro sempre que a 3.2.1 não tem saas, api nem ow (não sei ou vazia)
 * @property {string[]} classes    classes das tarefas (ce.classes)
 * @property {string[]} tarefas    tarefas marcadas (2.1.1)
 * @property {string[]} usuarios   quem usa (2.2.1); `usaEst` = estudantes usam
 * @property {boolean} usaEst
 * @property {string[]} afetados   quem é afetado (2.2.2); `criancas` = crianças e adolescentes afetados
 * @property {boolean} criancas
 * @property {string[]} consDecide consequências com peso 2 (decisões sobre pessoas)
 * @property {boolean} dadosEst    dados pessoais ou sensíveis de estudantes
 * @property {number} eleg         pessoas que usariam (4.1.1, respondido)
 * @property {number} escRede      escolas da rede (soma das etapas de 1.1.5)
 * @property {string} situacao     1.1.3: 'nova'|'proposta'|'renovar'|'orcamento'
 * @property {Marco} proxMarco     próximo marco (3.5); definitivo só na segunda passada
 * @property {{id:string,campo:string}[]} pend  pendências (regras/pendencias.js)
 * @property {Object|null} d       números do caso (lazy; null sem números): total, ano0, anual, porAluno, H, orc, ind, av,
 *                                 saida (desembolso), saidaEco (camada de saída do custo total), anosParaSair, pRecorrente
 *
 * @typedef {Object} Variante
 * @property {(k:ContextoRec)=>boolean} [quando]  a primeira verdadeira vale; a última não tem `quando` (padrão)
 * @property {string} oque         a ação (verbo no infinitivo, ≤ 25 palavras, sem ":")
 * @property {string} porque       a razão e o risco de não fazer (≤ 30 palavras)
 * @property {string[]} como       2 a 4 passos próprios
 * @property {string} [paraque]    sobrepõe o da regra
 * @property {string} [pronto]     sobrepõe o da regra
 * @property {Marco} [marco]       sobrepõe o da regra
 * @property {Area[]} [quem]       sobrepõe o da regra
 * @property {(k:ContextoRec)=>{campo:string,vals?:any[]}} [origem]  sobrepõe o da regra
 * @property {string} [curto]      sobrepõe o da regra
 *
 * @typedef {Object} Numero
 * @property {string} rotulo  @property {number|string} valor  @property {string} [fonte]  @property {boolean} [ilustrativo]
 * @property {number} [emJogo]  dinheiro ligado à ação, na mesma unidade de d.total (critério "Dinheiro em jogo" de 4.1);
 *                              sem ele, vale o bruto de numero('p50' | 'saida' | 'sub:K5.5'…, d) de rec_numeros.js
 *
 * @typedef {Object} Regra
 * @property {string} id                 'R-26'
 * @property {number} versao             sobe quando o texto ou o gatilho muda
 * @property {Pacote} pacote
 * @property {'custo'|'politica'|'uso'} tipo   mantém a separação "O que fazer" × "O que exigir"
 * @property {string[]} substitui        ids das regras atuais que esta absorve (rastreio da migração)
 * @property {string[]} campos           perguntas de origem (ids de CAMPOS ou QUESTOES_G); a primeira é a padrão
 * @property {(k:ContextoRec)=>boolean} se  gatilho
 * @property {Variante[]} variantes
 * @property {string} paraque
 * @property {Area[]} quem               quem age (3.4); nunca quem sabe responder
 * @property {Marco|((k:ContextoRec)=>Marco)} marco
 * @property {number} [pd]               ponto de decisão do guia (1..9)
 * @property {(k:ContextoRec)=>boolean} [condicao]  verdadeiro = "Condição" para o marco
 * @property {(k:ContextoRec)=>boolean} [alta]      "Recomendada (alta)" do catálogo; desde o pacote R3 não muda a ordem nem o
 *                                    nível (a ordem vem da pontuação de 4.1, rec_selecao.js); fica só como registro
 * @property {string} pronto             critério de pronto
 * @property {string[]} [depende]        ids que precisam vir antes
 * @property {string[]} [requer]         campos que, pendentes (k.pend), suspendem a regra (ela vai para a pendência)
 * @property {(k:ContextoRec, d:Object|null)=>Numero|null} [numero]
 * @property {(k:ContextoRec, d:Object|null)=>Object<string,string>} [vars]  valores dos marcadores {nome}
 * @property {string[]} [exige]          ids de EXIGE ('CONTRATO.<slug>' | 'DADOS_REQ.<id>')
 * @property {string} [semExige]         motivo de uma regra de custo sem cláusula (custo interno da rede)
 * @property {string|null} [indicador]
 * @property {string[]} [base]           ids de referências comuns
 * @property {{BR?:string[],UE?:string[]}} [exemplosNorma]
 * @property {(k:ContextoRec)=>{campo:string,vals?:any[]}} [origem]  pergunta → resposta citada (padrão: campos[0] e o valor)
 * @property {(k:ContextoRec)=>boolean} [provisoria]  apoia-se em valor presumido (ex.: arquitetura presumida)
 * @property {(k:ContextoRec)=>(string|{texto:string,falta?:string})[]} [passos]  passos extras do caso (regras fundidas),
 *                                    depois de `como`; `falta` é o "O que falta?" digitado (sem tradução)
 * @property {string[]} [textosExtras]  textos literais usados em `passos` (para a extração das traduções)
 * @property {boolean} [generica]        base comum: fora dos cartões e da contagem
 * @property {string} [curto]            a ação em poucas palavras, sem verbo ("o pacote de dados"), para o "Faltam" do
 *                                    veredito (4.4); sem ele, o veredito usa o `oque`
 * @property {boolean|((k:ContextoRec)=>boolean)} [irreversivel]  só pode ser feita antes do marco (sortear, medir a linha de
 *                                    base): 2 pontos de urgência (4.1); sem o campo, vale REC_IRREVERSIVEIS
 * @property {boolean} [grupos]          trata grupos (equidade): +1 em "Pessoas e direitos" com impacto de desigualdade ou
 *                                    inclusão (4.1); sem o campo, vale REC_GRUPOS
 * @property {boolean} [tocaPessoas]     conta em "Pessoas e direitos" fora dos pacotes PESSOAS e DADOS (4.1)
 */

/** Ordem dos pacotes (desempate da seção 4.1), lente e título do cartão. */
export const PACOTES = [
  ['PROB', 'decisao', 'Problema, meta e alternativa'],
  ['TESTE', 'decisao', 'Teste e avaliação'],
  ['ESCALA', 'decisao', 'Etapas e expansão'],
  ['DADOS', 'pessoas', 'Dados pessoais e dispositivos'],
  ['PESSOAS', 'pessoas', 'Proteção de pessoas e direitos'],
  ['USO', 'pessoas', 'Uso nas escolas e formação'],
  ['COMPRA', 'custo', 'Estratégia de compra e preço'],
  ['CONTRATO', 'custo', 'Contrato, serviço e saída'],
  ['ORC', 'custo', 'Orçamento e sustentabilidade'],
  ['TEC', 'custo', 'Arquitetura e operação técnica'],
  ['GOV', 'decisao', 'Governança e continuidade'],
];
export const LENTES = { decisao: 'Decisão e evidência', pessoas: 'Pessoas e uso', custo: 'Custo e contrato' };
export const ORDEM_PACOTE = Object.fromEntries(PACOTES.map((p, i) => [p[0], i]));
export const LENTE_PACOTE = Object.fromEntries(PACOTES.map(p => [p[0], p[1]]));
export const TITULO_PACOTE = Object.fromEntries(PACOTES.map(p => [p[0], p[2]]));

/** "Quem age" (3.4): código → rótulo neutro quanto ao país. */
export const AREAS = {
  gabinete: 'Gabinete (dirigente da rede)',
  pedagogica: 'Área pedagógica e currículo',
  escolas: 'Gestão escolar (direção e coordenação)',
  formacao: 'Formação de professores',
  inclusao: 'Educação especial e inclusão',
  avaliacao: 'Avaliação e dados',
  tecnologia: 'Tecnologia e segurança da informação',
  protecao_dados: 'Proteção de dados (encarregado)',
  juridico: 'Assessoria jurídica',
  compras: 'Compras e contratação',
  orcamento: 'Planejamento e orçamento',
  pessoas: 'Gestão de pessoas',
  fiscal: 'Gestor e fiscais do contrato',
  controle: 'Controle interno e ouvidoria',
  comunicacao: 'Comunicação',
};

/** Marcos do processo (3.5), na ordem; `quando` é o momento antigo (compatibilidade até o pacote R6). */
export const MARCOS = [
  ['M1', 'Autorizar o teste', 'antes_teste'],
  ['M2', 'Decidir depois do teste', 'antes_contratar'],
  ['M3', 'Levar ao mercado', 'antes_contratar'],
  ['M4', 'Assinar a implantação', 'antes_contratar'],
  ['M5', 'Acompanhar, ampliar e renovar', 'manter'],
];
export const ORDEM_MARCO = Object.fromEntries(MARCOS.map((m, i) => [m[0], i]));
export const NOME_MARCO = Object.fromEntries(MARCOS.map(m => [m[0], m[1]]));
export const QUANDO_MARCO = Object.fromEntries(MARCOS.map(m => [m[0], m[2]]));

/** Níveis de prioridade (4.2), na ordem: código, rótulo curto e rótulo com o marco ({marco} = MARCO_FRASE). */
export const NIVEIS = [
  ['condicao', 'Condição', 'Condição para {marco}'],
  ['recomendada', 'Recomendada', 'Recomendada antes de {marco}'],
  ['acompanhar', 'Para acompanhar', 'Para acompanhar'],
];
export const ORDEM_NIVEL = Object.fromEntries(NIVEIS.map((n, i) => [n[0], i]));
export const NOME_NIVEL = Object.fromEntries(NIVEIS.map(n => [n[0], n[1]]));
export const ROTULO_NIVEL = Object.fromEntries(NIVEIS.map(n => [n[0], n[2]]));
/** O marco como complemento de frase: "Condição para autorizar o teste", "Faltam 7 condições para autorizar o teste". */
export const MARCO_FRASE = {
  M1: 'autorizar o teste', M2: 'decidir depois do teste', M3: 'levar ao mercado', M4: 'assinar a implantação', M5: 'acompanhar, ampliar e renovar',
};
/** Pontuação (4.1): regras que só podem ser feitas antes do marco (urgência 2), quando a regra não traz `irreversivel`. */
export const REC_IRREVERSIVEIS = ['R-11', 'R-13', 'R-20'];
/** Pontuação (4.1): regras que tratam grupos (equidade), quando a regra não traz `grupos`. */
export const REC_GRUPOS = ['R-14', 'R-33'];
/** Impactos (1.2.3) que dão o +1 de equidade às regras que tratam grupos. */
export const IMPACTOS_GRUPOS = ['desigualdade', 'inclusao'];
/** Pacotes que contam em "Pessoas e direitos" (4.1). */
export const PACOTES_PESSOAS = ['PESSOAS', 'DADOS'];

/**
 * Cláusulas que uma regra pode exigir: 'CONTRATO.<slug>' (linhas de CONTRATO em framework.js, achadas pelo começo do
 * texto) e 'DADOS_REQ.<id>' (ids de DADOS_REQ). EXIGE[id] = { grupo, texto }.
 */
const CONTRATO_SLUGS = [
  ['escopo-objeto', 'Objeto definido'], ['escopo-limites', 'Limites e funções'], ['escopo-requisitos', 'Requisitos materiais'],
  ['escopo-hierarquia', 'Hierarquia documental'], ['desempenho-aceite', 'Critérios de aceitação'], ['desempenho-sla', 'Níveis de serviço'],
  ['desempenho-metrica', 'Métrica de desempenho'], ['desempenho-degradacao', 'Respostas graduais'], ['mudanca-versao', 'Identificação do modelo'],
  ['mudanca-material', 'Definição de mudança'], ['mudanca-aviso', 'Prazo de notificação'], ['mudanca-comercial', 'Mudanças de subprocessador'],
  ['dados-finalidades', 'Categorias e finalidades'], ['dados-treino', 'Regra de treinamento'], ['dados-retencao', 'Retenção por categoria'],
  ['dados-registros', 'Registros mínimos'], ['verificacao-auditoria', 'Auditoria com objeto'], ['verificacao-seguranca', 'Controles de segurança'],
  ['verificacao-incidentes', 'Incidentes'], ['verificacao-suspensao', 'Suspensão de funcionalidade'], ['verificacao-contestacao', 'Registros e cooperação'],
  ['direitos-matriz', 'Matriz de responsabilidades'], ['direitos-ativos', 'Direitos sobre dados'], ['direitos-terceiros', 'Terceiros críticos'],
  ['custo-unidades', 'Unidades de cobrança'], ['custo-consumo', 'Consumo visível'], ['custo-reajuste', 'Regras de reajuste'],
  ['saida-exportacao', 'Ativos exportáveis'], ['saida-transicao', 'Assistência de transição'], ['saida-conhecimento', 'Transferência de conhecimento'],
  ['saida-continuidade', 'Continuidade e processo'], ['saida-exclusao', 'Exclusão:'], ['gestao-responsavel', 'Responsável público'],
];
export const EXIGE = {};
CONTRATO_SLUGS.forEach(([slug, ini]) => {
  const l = (CONTRATO || []).find(x => String(x[1]).startsWith(ini));
  if (l) EXIGE['CONTRATO.' + slug] = { grupo: l[0], texto: l[1] };
});
(DADOS_REQ || []).forEach(([id, nome, texto]) => { EXIGE['DADOS_REQ.' + id] = { grupo: nome, texto }; });
export const CONTRATO_SLUGS_TODOS = CONTRATO_SLUGS.map(s => 'CONTRATO.' + s[0]);
// Pacote R4 (4c): cláusulas de compra e contrato que as regras R-55 a R-71 exigem e que o checklist de framework.js não traz.
// Só se acrescenta aqui (o grupo é o de CONTRATO mais próximo; o texto é a chave de tradução).
[
  ['etapa-sem-obrigacao', 'Compra', 'Cada etapa do teste é uma decisão separada: nenhuma obriga à seguinte nem à compra, e cada uma tem o preço fixado antes de começar'],
  ['nao-preferencia', 'Compra', 'Cláusula de não preferência: o teste gratuito não cria obrigação nem vantagem na compra que vier depois'],
  ['planilha-precos', 'Compra', 'Planilha de preços padronizada, com as linhas do custo do ciclo de vida no horizonte do plano'],
  ['demonstracao', 'Compra', 'Demonstração do licitante provisoriamente vencedor, com roteiro, dados e critérios de aprovação publicados antes'],
  ['preco-faixa', 'Custo', 'Preço de todos os anos e por faixa de usuários ativos, com a adoção mínima para continuar'],
  ['desconto-sla', 'Desempenho', 'Desconto na fatura quando os níveis de serviço do sistema não forem cumpridos, com teto e rescisão após falhas repetidas'],
  ['ativos-desenvolvidos', 'Direitos', 'O que o fornecedor desenvolve ou ajusta com dados da rede (código, configurações, modelo, variáveis e documentação) é da rede, que pode refazê-lo sem o fornecedor'],
  ['matriz-riscos', 'Direitos', 'Matriz de riscos: quem arca com o preço do modelo ou da nuvem, o câmbio, a falha de terceiro e o incidente de dados'],
  ['gestor-fiscais', 'Gestão', 'Gestor e fiscais (técnico e pedagógico) designados antes de assinar, com horas reservadas e painel mensal'],
].forEach(([slug, grupo, texto]) => { EXIGE['CONTRATO.' + slug] = { grupo, texto }; });

/** O catálogo inteiro (ordem dos pacotes; a ordem não muda a saída). */
export const REGRAS = [].concat(REGRAS_PROB, REGRAS_TESTE, REGRAS_ESCALA, REGRAS_DADOS, REGRAS_PESSOAS, REGRAS_USO,
  REGRAS_COMPRA, REGRAS_CONTRATO, REGRAS_ORC, REGRAS_TEC, REGRAS_GOV);
export const REGRA_POR_ID = Object.fromEntries(REGRAS.map(r => [r.id, r]));
export { PENDENCIAS };

/**
 * Destino das 66 regras da v13 (contando as duas `aberta-operacao`) e das ações de governança: id antigo → R-nn
 * (ou 'pendencia:<id>'). Sai de `substitui` das regras e das pendências; o teste confere a lista completa.
 */
export function mapaLegado() {
  const m = {};
  REGRAS.forEach(r => (r.substitui || []).forEach(x => { (m[x] = m[x] || []).push(r.id); }));
  PENDENCIAS.forEach(p => (p.substitui || []).forEach(x => { (m[x] = m[x] || []).push('pendencia:' + p.id); }));
  return m;
}

/** Todos os textos do catálogo (chaves de tradução), sem repetição: para a extração do orquestrador. */
export function textosRegras() {
  const out = new Set();
  const add = s => { if (typeof s === 'string' && s.trim()) out.add(s); };
  REGRAS.forEach(r => {
    add(r.paraque); add(r.pronto);
    add(r.curto);
    (r.variantes || []).forEach(v => { add(v.oque); add(v.porque); (v.como || []).forEach(add); add(v.paraque); add(v.pronto); add(v.curto); });
    (r.textosExtras || []).forEach(add);
    // exemplos de norma (decisão 5: recolhidos e filtrados pelo país) também vão para a extração
    Object.values(r.exemplosNorma || {}).forEach(L => (Array.isArray(L) ? L : [L]).forEach(add));
  });
  PENDENCIAS.forEach(p => add(p.motivo));
  Object.values(AREAS).forEach(add);
  MARCOS.forEach(m => add(m[1]));
  NIVEIS.forEach(n => { add(n[1]); add(n[2]); });
  Object.values(MARCO_FRASE).forEach(add);
  PACOTES.forEach(p => add(p[2]));
  Object.values(LENTES).forEach(add);
  return [...out];
}
