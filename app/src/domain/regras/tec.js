// Pacote TEC: arquitetura, operação, integração e monitoramento (lente "Custo e contrato"). Formato: regras/index.js.
// R2: regras atuais migradas. As duas `aberta-operacao` viram uma só R-77 (REC-01); `arquitetura-decidir` vira R-75, que
// confirma a arquitetura presumida em vez de mandar "decidir" uma que o custo já usa.
// R4 (4e, REC-30): R-75 a R-82 do catálogo (seção 6.1). R-75 cita a arquitetura presumida e o motivo; R-76 esclarece a
// incoerência "modelo aberto com pagamento por uso" e suspende a R-68 (ver `incoerenciaArqPagamento` e `suspende`);
// R-77 e R-81 ganham os gatilhos do catálogo; R-78 a R-80 e R-82 são novas.
//
// Decisão 8: números ilustrativos (tempo de resposta, limiares, tamanho de amostra) só na `ficha` de aceite de cada regra,
// sempre com o rótulo "ilustrativo, ajuste", e nunca na frase da ação (oque, porque, como, pronto). Os números do caso
// (custo, servidores no pico) vêm do motor, por `vars`.
//
// Ficha de aceite (campo opcional `ficha: k => ({ titulo, linhas: [{ criterio, valor, ilustrativo: true, rotulo }] })`):
// `fichaAceiteTec(k)` junta as fichas da R-08 (teste.js, conjunto de teste e aceite) e das regras TEC que disparam, para a
// página de avaliação e para a ficha de aceite.
import { numero } from '../rec_numeros.js';
import { grande } from '../custos_ui.js';
import { fmtInt, motivoArquitetura } from '../framework.js';
import { tr } from '../i18n.js';
import { REGRAS_TESTE } from './teste.js';

/** Rótulo dos números de convenção (decisão 8): aparece em cada linha da ficha, nunca na frase da ação. */
export const ROTULO_ILUSTRATIVO = 'ilustrativo, ajuste';

// ----------------------------------------------------------- apoio
const semTecnica = k => !k.arr('formados').includes('tecnica');
/** estudantes usam e a tarefa gera texto ou tutoria: crianças em contato direto com a IA (E3, K5.4 no Ano 0) */
const criancasEmContato = k => !!k.usaEst && k.classes.some(c => ['geracao', 'tutoria'].includes(c));
const sobMedida = k => k.v('adaptacao') === 'sob_medida';
const previsao = k => k.classes.includes('previsao');
const linhasK = (d, s, re) => ((d && d.av && d.av.linhas) || []).filter(l => l.s === s && (!re || re.test(l.nome)));
const somaVP = L => L.reduce((a, l) => a + (+l.ecoVP || 0), 0);
/** custo total de uma linha K (valor presente econômico do plano) já formatado; '' sem o valor (o marcador sai "a calcular") */
const fmtK = (d, s, re) => { const t = somaVP(linhasK(d, s, re)); return t > 0.5 ? grande(t) : ''; };
const maxLista = a => (Array.isArray(a) && a.length ? Math.max(...a.map(x => +x || 0)) : 0);

// ----------------------------------------------------------- R-76 e a suspensão da R-68 (REC-30)
/**
 * Incoerência entre a arquitetura e o pagamento (3.3, item 2): modelo aberto (tipoTec "aberta" ou arquitetura efetiva
 * de pesos abertos) com pagamento "por consumo". O custo cobra horas de servidor (GPU) e o contrato trataria a cobrança
 * como uso de API. Responder a 3.2.1 como modelo por API resolve (a arquitetura escolhida é a de pagar por uso); com
 * "saas" ou "pesos abertos" escolhidos, só mudar o pagamento resolve.
 * Gatilho da R-76 e condição que a R-68 lê para ficar suspensa: `se: k => ... && !incoerenciaArqPagamento(k)`.
 */
export const incoerenciaArqPagamento = k =>
  k.v('pagamento') === 'consumo' && k.v('arquitetura') !== 'api' && (k.v('tipoTec') === 'aberta' || k.arqEf === 'ow');

// ----------------------------------------------------------- R-75: motivo da arquitetura presumida
const MOTIVO_ARQ = {
  tipoTec: 'porque a tecnologia escolhida é aberta',
  licenca: 'porque a licença é aberta',
  'tipoTec+licenca': 'porque a tecnologia e a licença são abertas',
  pagamento: 'porque o pagamento é por consumo',
  padrao: 'porque nenhuma resposta indicou outra arquitetura',
};
const motivoDe = k => {
  let m = ['padrao'];
  try { m = motivoArquitetura(k.c); } catch (e) { m = ['padrao']; }
  return tr(MOTIVO_ARQ[m.join('+')] || MOTIVO_ARQ[m[0]] || MOTIVO_ARQ.padrao);
};
const ROT_ARQ = {
  saas: 'O custo, a integração e a saída foram calculados para um produto pronto por licença, {motivo}; as cláusulas que dependem disso são provisórias.',
  api: 'O custo, a integração e a saída foram calculados para uma aplicação com modelo por API, {motivo}; as cláusulas que dependem disso são provisórias.',
  ow: 'O custo, a integração e a saída foram calculados para um modelo de pesos abertos, {motivo}; as cláusulas que dependem disso são provisórias.',
};
const COMO_75 = ['Confirmar ou mudar a resposta 3.2.1 com a equipe técnica.', 'Na dúvida, comparar duas arquiteturas na prova de conceito, com o mesmo conjunto de teste.'];
const OQUE_75 = 'Confirmar ou mudar a arquitetura que o plano supõe, ou comparar duas na prova de conceito com o mesmo conjunto de teste.';

// ----------------------------------------------------------- R-79, R-80, R-82: fichas de aceite (ilustrativas)
const linha = (criterio, valor) => ({ criterio, valor, ilustrativo: true, rotulo: ROTULO_ILUSTRATIVO });
const FICHA_79 = ['Critérios de aceite do teste de carga',
  ['Tempo de resposta nos piores casos, com turmas inteiras conectadas', 'até 5 segundos'],
  ['Pedidos concluídos sem erro no horário de pico', 'pelo menos 99%'],
  ['Margem da capacidade contratada sobre o pico medido', '30% a mais']];
const FICHA_80 = ['Critérios de aceite do teste de segurança',
  ['Falhas graves no conjunto de ataques típicos da tarefa', 'nenhuma'],
  ['Ataques do conjunto contidos pelos filtros e pelas instruções do sistema', 'pelo menos 95%']];
const FICHA_82 = ['Limiares do monitoramento mensal',
  ['Amostra mensal de uso real, por tarefa', '100 casos'],
  ['Limiar de alerta: queda na nota de aceite em relação ao teste', '5 pontos percentuais'],
  ['Limiar de suspensão: queda na nota de aceite ou erro grave', '10 pontos percentuais ou um erro grave']];
const FICHA_82_PREVISAO = ['Limiares da revalidação anual',
  ['Diferença de erro entre grupos de estudantes', 'até 5 pontos percentuais'],
  ['Revalidação com os dados do ano letivo anterior', 'uma vez por ano letivo']];
// R-81: gatilho (compartilhado com a R-89) e o passo que a R-89 vira quando há várias ferramentas
const seR81 = k => ['integracao', 'sob_medida'].includes(k.v('adaptacao'));
const PASSO_FERRAMENTAS = 'Exigir que as ferramentas troquem dados entre si por padrão aberto e que todas sigam a mesma política de dados.';
const fichaDe = ([titulo, ...L]) => ({ titulo, linhas: L.map(([c, v]) => linha(c, v)) });
const textosFicha = F => [F[0]].concat(F.slice(1).flat());

/** @type {import('./index.js').Regra[]} */
export const REGRAS_TEC = [
  {
    id: 'R-75', versao: 2, pacote: 'TEC', tipo: 'custo', substitui: ['arquitetura-decidir'], campos: ['arquitetura'],
    se: k => k.v('arquitetura') === 'nao_sei',
    variantes: [
      { quando: k => k.arqEf === 'api', oque: OQUE_75, porque: ROT_ARQ.api, como: COMO_75 },
      { quando: k => k.arqEf === 'ow', oque: OQUE_75, porque: ROT_ARQ.ow, como: COMO_75 },
      { oque: OQUE_75, porque: ROT_ARQ.saas, como: COMO_75 },
    ],
    vars: k => ({ motivo: motivoDe(k) }),
    textosExtras: Object.values(MOTIVO_ARQ),
    paraque: 'O custo e as cláusulas do plano correspondem à arquitetura que vai ser contratada.',
    quem: ['tecnologia'], marco: k => (k.poc || k.rec.poc ? 'M1' : 'M3'), pd: 5,
    alta: k => ['proposta', 'orcamento'].includes(k.situacao) || k.eleg >= 10000 || k.v('adaptacao') === 'sob_medida',
    provisoria: () => true,
    exige: ['CONTRATO.escopo-objeto'],
    pronto: 'A resposta 3.2.1 está confirmada ou a comparação na prova de conceito está planejada.',
  },
  {
    // Modelo aberto com pagamento por uso: a estimativa cobra horas de GPU e o contrato trataria como uso de API. É a
    // incoerência de B. Suspende a R-68 (campo `suspende` e `incoerenciaArqPagamento`): ver o pedido ao pacote 4c no relatório.
    id: 'R-76', versao: 1, pacote: 'TEC', tipo: 'custo', substitui: [], campos: ['pagamento', 'tipoTec', 'arquitetura'],
    se: incoerenciaArqPagamento,
    suspende: ['R-68'],
    origem: () => ({ campo: 'pagamento' }),
    variantes: [{
      oque: 'Esclarecer se o modelo aberto roda em servidores contratados pela rede, pagos por hora, ou pela API de uma empresa, paga por uso.',
      porque: 'O custo cobra {gpu} em horas de servidor (GPU), mas o pagamento por consumo supõe uso de API; a estimativa e as cláusulas dependem da resposta.',
      como: [
        'Perguntar à equipe técnica se o modelo roda em servidores contratados pela rede ou na API de uma empresa.',
        'Se for a API, responder a 3.2.1 como modelo por API; se forem servidores, rever a forma de pagamento na 2.3.5.',
        'Conferir o custo recalculado e as cláusulas de consumo, que voltam a valer com a resposta.',
      ],
    }],
    vars: (k, d) => { const g = fmtK(d, 'K2.3', /GPU/); return g ? { gpu: g } : {}; },
    numero: (k, d) => {
      const t = somaVP(linhasK(d, 'K2.3', /GPU/));
      return t > 0.5 ? { id: 'sub:K2.3', rotulo: 'Horas de servidor (GPU) no custo total', valor: grande(t), bruto: { total: t }, fonte: 'Quanto custa', emJogo: t } : null;
    },
    paraque: 'A estimativa e as cláusulas de consumo descrevem uma só forma de usar o modelo aberto.',
    quem: ['tecnologia'], marco: 'M3', pd: 5,
    condicao: () => true, alta: () => true, provisoria: k => k.arqPresumida,
    exige: ['CONTRATO.custo-unidades'],
    pronto: 'A forma de usar o modelo aberto está confirmada, e as respostas 3.2.1 e 2.3.5 são coerentes entre si.',
  },
  {
    // arqEf ow: a operação do modelo aberto (as duas `aberta-operacao`); api, sob medida ou previsão sem equipe técnica
    // formada: a equipe que acompanha o fornecedor (tec-capacidade-interna)
    id: 'R-77', versao: 2, pacote: 'TEC', tipo: 'custo', substitui: ['aberta-operacao'], campos: ['tipoTec', 'arquitetura', 'formados', 'adaptacao'],
    se: k => k.arqEf === 'ow' || ((k.arqEf === 'api' || sobMedida(k) || previsao(k)) && semTecnica(k)),
    origem: k => (k.v('tipoTec') === 'aberta' ? { campo: 'tipoTec' } : k.arqEf === 'ow' ? { campo: 'arquitetura' } : { campo: 'formados', vals: k.arr('formados') }),
    variantes: [
      { quando: k => k.arqEf === 'ow',
        oque: 'Nomear a equipe técnica da rede e quem opera o modelo aberto, com manual, infraestrutura reprodutível e transferência de conhecimento medida.',
        porque: 'Pesos abertos só dão controle se alguém da rede o usa; o plano orça {equipe} por ano para isso, e sem equipe a dependência só muda de lugar.',
        como: ['Nomear a pessoa ou a equipe da rede que acompanha o fornecedor e opera o modelo.', 'Exigir manual de operação e infraestrutura descrita em código, que a rede consiga reproduzir.', 'Medir a transferência de conhecimento por entregas antes do fim do contrato.'] },
      { quando: previsao,
        oque: 'Nomear a equipe técnica da rede que valida, opera e recalibra o modelo de alerta, formada desde a prova de conceito.',
        porque: 'Sem equipe técnica própria, a rede não consegue fiscalizar o fornecedor nem recalibrar o modelo quando os dados mudam.',
        como: ['Reservar tempo de trabalho para a equipe técnica desde a prova de conceito.', 'Incluir a equipe técnica entre as pessoas formadas na pergunta 2.5.1.', 'Medir a transferência de conhecimento por entregas.'],
        paraque: 'A rede tem quem valide e recalibre o modelo sem depender do fornecedor.' },
      { quando: k => k.arqEf === 'api',
        oque: 'Nomear a equipe técnica da rede que acompanha o fornecedor da aplicação e fiscaliza o contrato, formada desde a prova de conceito.',
        porque: 'Quem não tem capacidade técnica própria não consegue fiscalizar o contrato nem usar os direitos de saída.',
        como: ['Reservar tempo de trabalho para uma equipe técnica da rede, desde a prova de conceito.', 'Incluir a equipe técnica entre as pessoas formadas na pergunta 2.5.1.', 'Medir a transferência de conhecimento por entregas.'],
        paraque: 'A rede tem quem fiscalize o fornecedor e use os direitos de saída.' },
      { oque: 'Nomear a equipe técnica da rede que assume o código e acompanha o desenvolvimento sob medida, com tempo reservado.',
        porque: 'Sem capacidade técnica própria, a rede não consegue receber o código nem manter a solução depois do contrato.',
        como: ['Reservar tempo de trabalho para a equipe técnica desde a prova de conceito.', 'Incluir a equipe técnica entre as pessoas formadas na pergunta 2.5.1.', 'Medir a transferência de conhecimento por entregas.'],
        paraque: 'A rede tem quem receba o código e mantenha a solução depois do contrato.' },
    ],
    vars: (k, d) => {
      const n = numero('sub:K4.1', d);
      return !n.falta && n.bruto && n.bruto.porAno > 0 ? { equipe: grande(n.bruto.porAno) } : {};
    },
    paraque: 'A rede mantém o controle do modelo aberto que escolheu.',
    quem: ['tecnologia', 'pessoas'], marco: 'M1', pd: 7,
    alta: k => k.arqEf === 'ow',
    provisoria: k => k.arqPresumida && k.v('tipoTec') !== 'aberta' && ['api', 'ow'].includes(k.arqEf),
    exige: ['CONTRATO.saida-conhecimento', 'CONTRATO.direitos-matriz'],
    pronto: 'A equipe técnica e quem opera o modelo estão nomeados, com o manual de operação e a transferência de conhecimento previstos.',
  },
  {
    id: 'R-78', versao: 1, pacote: 'TEC', tipo: 'politica', substitui: [], campos: ['licenca', 'tipoTec', 'arquitetura'],
    se: k => k.arqEf === 'ow' || k.v('licenca') === 'aberta' || k.v('tipoTec') === 'aberta',
    origem: k => ({ campo: k.v('licenca') === 'aberta' ? 'licenca' : k.v('tipoTec') === 'aberta' ? 'tipoTec' : 'arquitetura' }),
    variantes: [{
      oque: 'Verificar a licença exata dos pesos do modelo aberto quanto ao uso por governo, ao uso aceitável, à redistribuição e à atribuição.',
      porque: '“Aberto” cobre licenças muito diferentes, e algumas limitam o uso por governos ou a escala; descobrir isso depois do contrato obriga a trocar o modelo.',
      como: ['Pedir ao fornecedor a licença exata e a versão dos pesos.', 'Obter parecer jurídico sobre o uso por governo e sobre as restrições de uso aceitável.', 'Registrar a licença e a versão no dossiê da contratação.'],
    }],
    paraque: 'O modelo aberto escolhido pode ser usado, mantido e trocado pela rede sem surpresa jurídica.',
    quem: ['juridico', 'tecnologia'], marco: 'M3', pd: 7,
    pronto: 'O parecer jurídico sobre a licença dos pesos está no dossiê, com a versão do modelo.',
  },
  {
    id: 'R-79', versao: 1, pacote: 'TEC', tipo: 'custo', substitui: [], campos: ['usuarios', 'elegiveis', 'frequencia'],
    se: k => (k.usaEst && k.eleg >= 10000) || (['diaria', 'continua'].includes(k.v('frequencia')) && k.eleg >= 5000),
    origem: k => (k.usaEst ? { campo: 'usuarios', vals: ['estudantes'] } : { campo: 'frequencia' }),
    variantes: [
      { quando: k => k.arqEf === 'ow',
        oque: 'Medir no teste o uso simultâneo no horário de aula e o tempo de resposta com turmas inteiras, e confirmar a capacidade dos servidores.',
        porque: 'A estimativa supõe até {servidoresPico} servidores de GPU no pico; se a ferramenta trava na aula, a aula se perde e o resultado do piloto deixa de valer.',
        como: ['Montar o teste de carga com o pico estimado: turmas, estudantes e escolas no mesmo horário.', 'Medir o tempo de resposta nos piores casos, e não só na média, e a banda por turma.', 'Exigir no contrato a cláusula de capacidade e de aumento de servidores no pico.'] },
      { quando: k => k.arqEf === 'api',
        oque: 'Medir no teste o uso simultâneo no horário de aula e o tempo de resposta com turmas inteiras, e confirmar o limite de chamadas contratado.',
        porque: 'A estimativa supõe {interacoes} interações por ano em regime; se o limite de chamadas trava a aula, a aula se perde e o piloto deixa de valer.',
        como: ['Montar o teste de carga com o pico estimado: turmas, estudantes e escolas no mesmo horário.', 'Medir o tempo de resposta nos piores casos, e não só na média, e a banda por turma.', 'Confirmar o limite de taxa da API e exigir a cláusula de capacidade.'] },
      { oque: 'Medir no teste o uso simultâneo no horário de aula e o tempo de resposta com turmas inteiras, e confirmar a capacidade contratada.',
        porque: 'Se a ferramenta trava no horário de aula, a aula se perde e o piloto deixa de valer; a capacidade para {pessoas} pessoas precisa estar no contrato.',
        como: ['Montar o teste de carga com o pico estimado: turmas, estudantes e escolas no mesmo horário.', 'Medir o tempo de resposta nos piores casos, e não só na média, e a banda por turma.', 'Exigir no contrato a cláusula de capacidade e de tempo de resposta.'] },
    ],
    vars: (k, d) => {
      const o = { pessoas: fmtInt(k.eleg) };
      const G = maxLista(d && d.av && d.av.r && d.av.r.extra && d.av.r.extra.G);
      if (G > 0) o.servidoresPico = fmtInt(G);
      const I = maxLista(d && d.av && d.av.r && d.av.r.I);
      if (I > 0) o.interacoes = fmtInt(I);
      return o;
    },
    ficha: () => fichaDe(FICHA_79),
    textosExtras: textosFicha(FICHA_79),
    paraque: 'A ferramenta aguenta o horário de aula antes de a rede se comprometer com a escala.',
    quem: ['tecnologia'], marco: 'M1', pd: 4,
    provisoria: k => k.arqPresumida,
    exige: ['CONTRATO.desempenho-sla'],
    pronto: 'O resultado do teste de carga, com a capacidade confirmada, está registrado e a cláusula de capacidade está prevista no contrato.',
  },
  {
    id: 'R-80', versao: 1, pacote: 'TEC', tipo: 'custo', substitui: [], campos: ['arquitetura', 'usuarios', 'tarefas'],
    se: k => ['api', 'ow'].includes(k.arqEf) || criancasEmContato(k),
    origem: k => (criancasEmContato(k) ? { campo: 'usuarios', vals: ['estudantes'] } : { campo: 'arquitetura' }),
    variantes: [
      { quando: criancasEmContato,
        oque: 'Testar a injeção de instruções e a quebra de limites antes do contato dos estudantes com a ferramenta e repetir antes de ampliar.',
        porque: 'Estudantes vão testar os limites do tutor, e documentos da base podem trazer instruções escondidas; o plano reserva {k54} para testes adversariais.',
        como: ['Montar um conjunto de ataques típicos da tarefa, com injeção de instruções em documentos e perguntas.', 'Incluir os ataques de estudantes: pedir respostas inadequadas à idade e burlar os filtros.', 'Fixar o critério de aprovação e corrigir o que falhar antes do teste com estudantes.', 'Repetir o conjunto antes de ampliar e a cada nova versão do modelo.'] },
      { oque: 'Testar a injeção de instruções e a quebra de limites antes do teste com pessoas e repetir antes de ampliar.',
        porque: 'Quem usa pode levar a ferramenta a responder o que não deveria, e documentos da base podem trazer instruções escondidas.',
        como: ['Montar um conjunto de ataques típicos da tarefa, com injeção de instruções em documentos e perguntas.', 'Fixar o critério de aprovação e corrigir o que falhar antes de seguir.', 'Repetir o conjunto antes de ampliar e a cada nova versão do modelo.'] },
    ],
    vars: (k, d) => { const t = fmtK(d, 'K5.4'); return t ? { k54: t } : {}; },
    ficha: () => fichaDe(FICHA_80),
    textosExtras: textosFicha(FICHA_80),
    paraque: 'A ferramenta resiste ao uso indevido antes de chegar às pessoas.',
    quem: ['tecnologia'], marco: 'M1', pd: 4,
    condicao: criancasEmContato,
    provisoria: k => k.arqPresumida && !criancasEmContato(k),
    exige: ['CONTRATO.verificacao-seguranca'],
    pronto: 'O conjunto de ataques, o critério de aprovação e o resultado dos testes estão registrados antes do teste com pessoas.',
  },
  {
    id: 'R-81', versao: 2, pacote: 'TEC', tipo: 'custo', substitui: ['integracao'], campos: ['adaptacao'],
    se: seR81,
    variantes: [{
      oque: 'Integrar o login ao sistema de identidade da rede e trocar dados de cadastro por padrão aberto ou API documentada, com acesso mínimo por perfil.',
      porque: 'Integração sob medida e sem padrão prende a rede ao fornecedor, e contas fora do controle da rede deixam acessos abertos quando alguém sai.',
      como: ['Ligar o login ao sistema de identidade da rede e rever os perfis e os acessos.', 'Trocar os dados de cadastro por OneRoster ou padrão equivalente, e usar LTI 1.3 com o ambiente virtual.', 'Testar a integração na prova de conceito, com registro de acessos.'],
    }],
    // R-89 (várias ferramentas) vira passo desta ação quando as duas disparam
    passos: k => (k.variasFerr ? [PASSO_FERRAMENTAS] : []),
    textosExtras: [PASSO_FERRAMENTAS],
    paraque: 'A ferramenta conversa com os sistemas da rede sem prendê-la ao fornecedor.',
    quem: ['tecnologia'], marco: 'M3', pd: 7,
    alta: k => sobMedida(k),
    exige: ['CONTRATO.saida-exportacao', 'CONTRATO.direitos-ativos'],
    pronto: 'O termo de referência lista os sistemas, o padrão de integração, os perfis de acesso e a exportação em formato aberto.',
  },
  {
    id: 'R-82', versao: 1, pacote: 'TEC', tipo: 'politica', substitui: [], campos: ['tarefas'],
    se: k => k.tarefas.length > 0,
    origem: k => ({ campo: 'tarefas', vals: k.tarefas }),
    variantes: [
      { quando: previsao,
        oque: 'Revalidar e recalibrar o modelo de alerta a cada ano letivo, por grupo, e acompanhar todo mês uma amostra de uso real.',
        porque: 'Modelos de previsão perdem precisão quando os dados mudam, e os erros podem crescer num grupo antes de aparecerem na média.',
        como: ['Refazer as métricas do teste por grupo de estudantes a cada ano letivo e quando mudarem o registro de frequência, os critérios ou a população.', 'Acompanhar todo mês uma amostra de uso real, com a mesma rubrica do teste.', 'Congelar o modelo se ele cair abaixo do limiar fixado antes.'],
        pronto: 'O relatório anual por grupo, os limiares de alerta e de suspensão e o responsável por cada um estão definidos.' },
      { oque: 'Repetir todo mês a avaliação do teste numa amostra de uso real, com limiares de alerta e suspensão, e a cada nova versão do modelo.',
        porque: 'A qualidade muda com a versão, a base e o uso, e só se percebe medindo sempre da mesma forma.',
        como: ['Montar uma amostra mensal de uso real, com a mesma rubrica do teste.', 'Acompanhar num painel os erros graves, o tempo de resposta e o custo por uso, ligados às linhas K5.3 e K6.2 do plano de custos.', 'Fixar os limiares de alerta e de suspensão, com quem decide em cada caso.', 'Reexecutar o conjunto completo a cada nova versão, base ou mudança nos dados.'] },
    ],
    // a ficha da variante de previsão junta a da revalidação anual
    ficha: k => (previsao(k)
      ? { titulo: FICHA_82[0], linhas: fichaDe(FICHA_82).linhas.concat(fichaDe(FICHA_82_PREVISAO).linhas) }
      : fichaDe(FICHA_82)),
    textosExtras: textosFicha(FICHA_82).concat(textosFicha(FICHA_82_PREVISAO)),
    paraque: 'A rede percebe a queda de qualidade a tempo de agir.',
    quem: ['avaliacao', 'tecnologia'], marco: 'M5', pd: 8,
    alta: k => k.alto,
    pronto: 'O painel mensal, os limiares de alerta e de suspensão e o responsável por cada um estão definidos.',
  },
  {
    id: 'R-89', versao: 2, pacote: 'TEC', tipo: 'politica', substitui: ['ferramentas-interop'], campos: ['ferramentas', 'nFerramentas'],
    // com R-81 ativa, a interoperabilidade entre as ferramentas é um passo dela
    se: k => k.variasFerr && !seR81(k),
    origem: k => (k.ferr.length > 1 ? { campo: 'ferramentas', vals: k.ferr.map(f => f.nome) } : { campo: 'nFerramentas', vals: [k.v('nFerramentas')] }),
    variantes: [{
      oque: 'Exigir interoperabilidade entre as ferramentas e aplicar uma só política de dados a todas elas, com acesso, guarda, exclusão e proibição de treinar modelos.',
      porque: 'Ferramentas com regras de dados diferentes multiplicam os riscos e os contratos que a rede precisa fiscalizar.',
      como: ['Aplicar as mesmas cláusulas de dados a todos os contratos.', 'Exigir que as ferramentas troquem dados por padrão aberto.'],
    }],
    paraque: 'Todas as ferramentas seguem as mesmas regras de dados e conversam entre si.',
    quem: ['tecnologia', 'protecao_dados'], marco: 'M3',
    alta: () => true,
    pronto: 'Os contratos de todas as ferramentas têm as mesmas cláusulas de dados.',
  },
  {
    id: 'R-110', versao: 1, pacote: 'TEC', tipo: 'custo', substitui: ['arquitetura-api'], campos: ['arquitetura'],
    se: k => k.v('arquitetura') === 'api',
    variantes: [{
      oque: 'Definir quem integra e governa a aplicação que usa o modelo por API.',
      porque: 'Com o modelo por API, a integração e a governança da aplicação ficam com a rede ou com um integrador contratado.',
      como: ['Decidir se a aplicação fica com a equipe da rede ou com um integrador.', 'Dividir por escrito as responsabilidades entre a rede, o integrador e o provedor do modelo.'],
    }],
    paraque: 'Cada parte da aplicação tem um responsável conhecido.',
    quem: ['tecnologia'], marco: 'M3', pd: 7,
    exige: ['CONTRATO.direitos-matriz', 'CONTRATO.direitos-terceiros'],
    pronto: 'A matriz de responsabilidades entre a rede, o integrador e o provedor do modelo está aprovada.',
  },
];

// ----------------------------------------------------------- ficha de aceite e textos
/**
 * Linhas da ficha de aceite das regras TEC que disparam neste caso: [{ id, titulo, linhas: [{ criterio, valor,
 * ilustrativo: true, rotulo: 'ilustrativo, ajuste' }] }]. Só a ficha leva números de convenção (decisão 8).
 * `k` é o contexto das regras (recContexto).
 */
export function fichaAceiteTec(k) {
  const out = [];
  // a R-08 (teste.js: conjunto de teste e critérios de aceite por classe da tarefa) abre a ficha de aceite
  REGRAS_TESTE.filter(r => r.id === 'R-08').concat(REGRAS_TEC).forEach(r => {
    if (typeof r.ficha !== 'function') return;
    let ok = false;
    try { ok = !!r.se(k); } catch (e) { ok = false; }
    if (!ok) return;
    let f = null;
    try { f = r.ficha(k); } catch (e) { f = null; }
    if (f && f.linhas && f.linhas.length) out.push(Object.assign({ id: r.id }, f));
  });
  return out;
}

/** Textos novos do pacote TEC (chaves de tradução) fora das variantes: rótulo da ficha, fichas, motivos e passos extras. */
export const TEXTOS_REC_TEC = [ROTULO_ILUSTRATIVO].concat(
  REGRAS_TEC.flatMap(r => r.textosExtras || []));
