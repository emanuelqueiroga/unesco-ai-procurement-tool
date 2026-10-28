// Pacote CONTRATO: serviço, versão, saída, propriedade, consumo e fiscalização (lente "Custo e contrato").
// Formato: regras/index.js. R2: regras atuais migradas; R-65 reúne `termos` (agora começa por "Negociar", REC-06) e
// `arquitetura-saas`; R-68 reúne as duas de consumo e segue a arquitetura efetiva (REC-08).
// R4 (4c, REC-28): R-64 (níveis de serviço do sistema), R-65 (assinatura e arquitetura saas ou api), R-66 (saída com o preço
// da transição), R-67 (modelo ajustado à rede), R-68 (teto de consumo; fica suspensa na incoerência de arquitetura e
// pagamento que tec.js:incoerenciaArqPagamento detecta, REC-30), R-69 (matriz de riscos), R-70 (gestor e fiscais) e R-71 (registro de cada saída).
// Decisão 5: o texto principal não cita norma; exemplos só em `exemplosNorma` (Brasil e UE). Cada regra liga a sua cláusula
// em `exige`.
import { numero, varsRec } from '../rec_numeros.js';
import { incoerenciaArqPagamento } from './tec.js';

/** ferramenta externa (R-64): paga, aberta ou "não sei" (suspensa), ou arquitetura respondida que não seja plataforma pública */
const externa = k => { const t = k.v('tipoTec'); return ['paga', 'aberta', 'nao_sei'].includes(t) || (t !== 'publica' && !k.arqPresumida); };
const cambioNoTopo = k => {
  const L = k.d && k.d.tor && k.d.tor.rows;
  return !!L && L.slice(0, 3).some(x => /^fx$|c[âa]mbio/i.test(String(x.id) + ' ' + String(x.nome)));
};
const LIC = ['termos', 'assinatura'];
const COMO_65 = ['Pôr no contrato que termos online não alteram as condições materiais.', 'Exigir a identificação da versão do modelo e aviso prévio de troca ou descontinuação.', 'Prever o direito de testar a nova versão e de rescindir sem multa.'];

/** @type {import('./index.js').Regra[]} */
export const REGRAS_CONTRATO = [
  {
    id: 'R-64', versao: 1, pacote: 'CONTRATO', tipo: 'custo', substitui: [], campos: ['tipoTec', 'arquitetura'], requer: ['tipoTec'],
    se: k => externa(k),
    origem: k => (k.v('tipoTec') ? { campo: 'tipoTec' } : { campo: 'arquitetura' }),
    variantes: [{
      oque: 'Fixar níveis de serviço do sistema (disponibilidade no horário escolar, tempo de resposta, prazo de correção), medidos pela rede, com desconto na fatura.',
      porque: 'Os níveis do suporte ao usuário não garantem que o sistema esteja no ar; sem metas medidas pela rede, a falha não gera desconto nem rescisão.',
      como: ['Montar uma tabela com indicador, meta, fonte da medição, periodicidade e faixa de desconto.', 'Pôr um teto de desconto e a rescisão após falhas repetidas.', 'Medir os indicadores pela rede, e não só pelo relatório do fornecedor.'],
    }],
    paraque: 'As escolas contam com o sistema no ar quando precisam dele, e a rede tem como cobrar quando não está.',
    quem: ['tecnologia', 'fiscal'], marco: 'M3', pd: 7,
    alta: k => ['continua', 'diaria'].includes(k.v('frequencia')) || k.eleg >= 5000,
    exige: ['CONTRATO.desempenho-sla', 'CONTRATO.desconto-sla'],
    exemplosNorma: { BR: ['Lei 14.133/2021, art. 144 (remuneração variável por desempenho)', 'IN SEGES/MP 5/2017 (instrumento de medição de resultado)'] },
    pronto: 'A minuta traz os níveis de serviço do sistema, a medição pela rede e o desconto na fatura.',
  },
  {
    id: 'R-65', versao: 2, pacote: 'CONTRATO', tipo: 'custo', substitui: ['termos', 'arquitetura-saas'], campos: ['licenca', 'arquitetura'], requer: ['tipoTec'],
    se: k => LIC.includes(k.v('licenca')) || (!!k.v('tipoTec') && k.v('tipoTec') !== 'publica' && ['saas', 'api'].includes(k.arqEf)),
    variantes: [
      { quando: k => k.v('licenca') === 'termos',
        oque: 'Negociar um contrato que prevaleça sobre os termos online, com a versão do modelo identificada e aviso prévio de mudanças.',
        porque: 'Termos de uso padrão podem mudar sem aviso e não garantem as condições materiais de que a rede precisa.',
        como: COMO_65,
        origem: () => ({ campo: 'licenca' }) },
      { quando: k => k.v('licenca') === 'assinatura',
        oque: 'Exigir que o contrato prevaleça sobre os termos online, com versão do modelo identificada, aviso prévio de troca e direito de rescindir sem multa.',
        porque: 'O mesmo nome de modelo muda de comportamento, e o teste vale só para a versão testada; sem aviso, a rede perde o que aprovou.',
        como: COMO_65,
        origem: () => ({ campo: 'licenca' }) },
      { oque: 'Exigir aviso prévio de mudanças do produto e direito de exportar dados e configurações ao final do contrato.',
        porque: 'O produto pronto muda por decisão do fornecedor; sem aviso e sem exportação, a rede perde o controle do serviço e da saída.',
        como: ['Fixar o prazo de aviso prévio de mudanças relevantes.', 'Exigir a exportação de dados e configurações em formato aberto ao final.'],
        origem: k => (k.arqPresumida ? { campo: 'tipoTec' } : { campo: 'arquitetura' }) },
    ],
    paraque: 'O que foi testado e contratado continua valendo durante o contrato.',
    quem: ['juridico', 'tecnologia'], marco: 'M3', pd: 7, curto: 'o contrato acima dos termos de uso',
    condicao: k => k.v('licenca') === 'termos', alta: k => k.v('licenca') === 'termos',
    provisoria: k => k.arqPresumida && !LIC.includes(k.v('licenca')),
    exige: ['CONTRATO.escopo-hierarquia', 'CONTRATO.mudanca-versao', 'CONTRATO.mudanca-aviso', 'CONTRATO.saida-exportacao'],
    exemplosNorma: { UE: ['Diretiva 2014/24/UE, art. 72 (modificação de contratos durante a vigência)'] },
    pronto: 'A minuta traz a hierarquia documental, a versão do modelo e o prazo de aviso prévio.',
  },
  {
    id: 'R-66', versao: 1, pacote: 'CONTRATO', tipo: 'custo', substitui: [], campos: ['tipoTec', 'arquitetura'],
    se: k => !!k.d && k.d.anosParaSair > 0,
    origem: k => (k.v('tipoTec') ? { campo: 'tipoTec' } : { campo: 'arquitetura' }),
    variantes: [
      { quando: k => k.arqEf === 'api',
        oque: 'Exigir o preço da transição e o pacote de saída, com uma camada que permita trocar de modelo e exportar a base.',
        porque: 'Uma saída negociada no fim fica nas mãos do fornecedor; sair custaria {saida}, ou {anosParaSair} anos de custo recorrente, e trocar de modelo exige trabalho.',
        como: ['Exigir uma camada de integração que permita trocar o modelo sem refazer o sistema.', 'Exigir a exportação da base de conhecimento, dos registros e das configurações em formato aberto.', 'Pôr na proposta o preço fixo da transição e fazer um teste real de exportação no primeiro ano.'] },
      { oque: 'Exigir na proposta o preço da transição e o pacote de saída no contrato, com um teste real de exportação no primeiro ano.',
        porque: 'Uma saída negociada no fim do contrato fica nas mãos do fornecedor; sair custaria {saida}, ou {anosParaSair} anos de custo recorrente.',
        como: ['Definir o escopo da transição: dados, registros, configurações e integrações, com prazo.', 'Pôr na proposta o preço fixo da assistência de transição.', 'Fazer um teste real de exportação no primeiro ano, com aceite assinado.', 'Exigir o prazo e a evidência de exclusão ao final.'] },
    ],
    paraque: 'A rede pode trocar de fornecedor sem perder dados nem pagar o preço que o fornecedor quiser.',
    quem: ['tecnologia', 'juridico'], marco: 'M3', pd: 7,
    alta: k => !!k.d && k.d.anosParaSair >= 0.25,
    numero: (k, d) => numero('saida', d), vars: (k, d) => varsRec(d, ['saida', 'anosParaSair']),
    exige: ['CONTRATO.saida-exportacao', 'CONTRATO.saida-transicao', 'CONTRATO.saida-continuidade', 'CONTRATO.saida-exclusao'],
    exemplosNorma: { UE: ['Regulamento (UE) 2023/2854 (Lei de Dados), cap. VI (troca de serviços de tratamento de dados)'] },
    pronto: 'A proposta traz o preço da transição, o contrato traz o pacote de saída e o teste de exportação está marcado.',
  },
  {
    id: 'R-67', versao: 2, pacote: 'CONTRATO', tipo: 'custo', substitui: ['sob-medida'], campos: ['adaptacao', 'tarefas'],
    se: k => k.v('adaptacao') === 'sob_medida' || k.classes.includes('previsao'),
    origem: k => (k.v('adaptacao') === 'sob_medida' ? { campo: 'adaptacao' } : { campo: 'tarefas' }),
    variantes: [
      { quando: k => k.classes.includes('previsao'),
        oque: 'Garantir que o modelo ajustado com dados da rede, as variáveis e a documentação são da rede, que pode retreiná-lo sem o fornecedor.',
        porque: 'O ativo mais valioso do alerta é o modelo ajustado à rede; sem esses direitos, a rede depende do fornecedor para corrigir, retreinar ou trocar.',
        como: ['Pôr no contrato que o modelo treinado com dados da rede, os dados, as variáveis e a documentação são da rede.', 'Exigir a documentação e o código de treino, para retreinar sem o fornecedor.', 'Prever a transferência de conhecimento à equipe da rede durante o contrato.'] },
      { oque: 'Garantir no contrato que código e configurações são da rede, com documentação e transferência de conhecimento à equipe.',
        porque: 'Sem esses direitos, a rede depende do fornecedor para corrigir, mudar ou trocar a solução que pagou para desenvolver.',
        como: ['Pôr no contrato a propriedade do código, das configurações e da documentação.', 'Prever a transferência de conhecimento à equipe da rede durante o contrato.'] },
    ],
    paraque: 'A rede pode manter e mudar a solução sem depender do fornecedor.',
    quem: ['juridico', 'tecnologia'], marco: 'M3', pd: 7,
    alta: () => true, exige: ['CONTRATO.direitos-ativos', 'CONTRATO.saida-conhecimento', 'CONTRATO.ativos-desenvolvidos'],
    pronto: 'A minuta traz a propriedade do código e do modelo e o plano de transferência de conhecimento.',
  },
  {
    id: 'R-68', versao: 2, pacote: 'CONTRATO', tipo: 'custo', substitui: ['consumo-limites', 'consumo-monitorar'], campos: ['pagamento', 'arquitetura'], requer: ['tipoTec'],
    // REC-30: na incoerência entre pesos abertos e consumo (R-76), o teto espera a resposta da 3.2.1
    // consumo, ou modelo por API ou de pesos abertos durante um período gratuito (o consumo começa depois); licença fixa não tem teto
    se: k => (k.v('pagamento') === 'consumo' || (['api', 'ow'].includes(k.arqEf) && k.v('pagamento') === 'gratuito')) && !incoerenciaArqPagamento(k),
    origem: k => (k.v('pagamento') === 'consumo' ? { campo: 'pagamento' } : { campo: k.v('tipoTec') ? 'tipoTec' : 'arquitetura' }),
    variantes: [
      { quando: k => k.arqEf === 'ow',
        oque: 'Fixar um teto anual para as horas de servidor (GPU) do modelo aberto, com alertas a 70% e 90% e aprovação para passar do teto.',
        porque: 'O custo do modelo aberto cresce com as horas de GPU contratadas; sem teto, a despesa ultrapassa a dotação sem que ninguém decida.',
        como: ['Fixar o teto pelas horas de GPU previstas mais uma margem de risco.', 'Exigir relatório mensal das horas usadas antes da fatura.', 'Acompanhar as horas todo mês e rever o teto a cada ano.'] },
      { quando: k => k.arqEf === 'api' && k.v('pagamento') === 'gratuito',
        oque: 'Fixar um teto anual de consumo das chamadas ao modelo, para valer depois do período gratuito, com alertas a 70% e 90%.',
        porque: 'Depois do período gratuito cada chamada ao modelo será cobrada e o valor cresce com a adoção; sem teto, a despesa ultrapassa a dotação sem que ninguém decida.',
        como: ['Fixar o teto pelo consumo previsto mais uma margem de risco, para o primeiro ano pago.', 'Exigir um painel de consumo acessível à rede e relatório mensal antes da fatura.', 'Acompanhar o consumo todo mês e rever o teto a cada ano.'] },
      { quando: k => k.arqEf === 'api',
        oque: 'Fixar um teto anual de consumo das chamadas ao modelo, com alertas a 70% e 90% e aprovação para passar do teto.',
        porque: 'Cada chamada ao modelo é cobrada e o valor cresce com a adoção; sem teto, a despesa ultrapassa a dotação sem que ninguém decida.',
        como: ['Fixar o teto pelo consumo previsto mais uma margem de risco.', 'Exigir um painel de consumo acessível à rede e relatório mensal antes da fatura.', 'Acompanhar o consumo todo mês e rever o teto a cada ano.'] },
      { oque: 'Exigir no contrato limite de gasto, alertas e relatório mensal de consumo, visíveis antes da fatura.',
        porque: 'Na cobrança por uso, o valor cresce com a adoção; sem limite e alertas, a fatura chega antes da decisão.',
        como: ['Fixar o limite anual de gasto e os alertas.', 'Acompanhar o consumo todo mês e rever o limite a cada ano.'] },
    ],
    paraque: 'A despesa de uso fica dentro da dotação, com decisão explícita para passar dela.',
    quem: ['tecnologia', 'fiscal'], marco: 'M3', pd: 7,
    alta: () => true, provisoria: k => k.arqPresumida,
    exige: ['CONTRATO.custo-consumo', 'CONTRATO.custo-unidades'],
    pronto: 'A minuta traz o teto anual, os alertas e o relatório mensal de consumo.',
  },
  {
    id: 'R-69', versao: 1, pacote: 'CONTRATO', tipo: 'custo', substitui: [], campos: ['tipoTec', 'elegiveis'],
    se: k => !!k.d && (k.alto || k.eleg >= 50000 || cambioNoTopo(k)),
    origem: k => (k.alto ? { campo: 'tarefas', vals: k.tarefas } : k.eleg >= 50000 ? { campo: 'elegiveis', vals: [k.valEleg] } : { campo: 'tipoTec' }),
    variantes: [{
      oque: 'Incluir no contrato uma matriz de riscos que defina quem arca com preço do modelo, câmbio, falha de terceiro e incidente de dados.',
      porque: 'Sem alocação, o risco volta todo para a rede, e o modelo, a nuvem e o câmbio estão fora do controle dela.',
      como: ['Listar os riscos dos direcionadores de custo do plano.', 'Para cada risco, dizer quem arca, o limite e o gatilho de reequilíbrio.'],
    }],
    paraque: 'Cada risco do contrato tem dono, limite e gatilho, e a rede não paga sozinha por falhas de terceiros.',
    quem: ['compras', 'orcamento', 'juridico'], marco: 'M3', pd: 7,
    alta: k => k.alto, exige: ['CONTRATO.matriz-riscos', 'CONTRATO.direitos-terceiros'],
    exemplosNorma: { BR: ['Lei 14.133/2021, arts. 6º, XXVII, e 22 (matriz de alocação de riscos)'] },
    pronto: 'A minuta traz a matriz de riscos, com quem arca, o limite e o gatilho de cada um.',
  },
  {
    id: 'R-70', versao: 1, pacote: 'CONTRATO', tipo: 'custo', substitui: [], campos: ['tipoTec', 'formacaoPaga'], requer: ['tipoTec'],
    se: k => (!!k.v('tipoTec') && k.v('tipoTec') !== 'publica') || k.v('formacaoPaga') === 'fornecedor',
    origem: k => (k.v('tipoTec') && k.v('tipoTec') !== 'publica' ? { campo: 'tipoTec' } : { campo: 'formacaoPaga' }),
    variantes: [{
      oque: 'Designar o gestor e os fiscais do contrato (técnico e pedagógico) antes de assinar, com horas reservadas e um painel mensal.',
      porque: 'Uma cláusula sem ninguém para usá-la não protege a rede, e a estimativa já conta {gestao} para gerir o contrato.',
      como: ['Publicar o ato de designação do gestor e dos fiscais, com as horas reservadas.', 'Ligar cada obrigação do contrato a um responsável público.', 'Marcar a reunião mensal com o fornecedor, com ata e painel dos indicadores exigidos.'],
    }],
    paraque: 'Cada cláusula do contrato tem alguém com tempo e autoridade para cobrá-la.',
    quem: ['gabinete'], marco: 'M4', pd: 7,
    alta: k => k.eleg >= 5000,
    numero: (k, d) => numero('sub:K5.1', d),
    vars: (k, d) => { const n = numero('sub:K5.1', d); return n.falta ? {} : { gestao: n.valor }; },
    exige: ['CONTRATO.gestor-fiscais', 'CONTRATO.gestao-responsavel'],
    exemplosNorma: { BR: ['Lei 14.133/2021, arts. 7º e 117 (agentes públicos e fiscalização)'] },
    pronto: 'O ato que designa o gestor e os fiscais, com as horas reservadas, está publicado antes da assinatura.',
  },
  {
    id: 'R-71', versao: 1, pacote: 'CONTRATO', tipo: 'custo', substitui: [], campos: ['consequencias'],
    se: k => k.consDecide.length > 0 || (k.alto && k.tarefas.length > 0),
    origem: k => (k.consDecide.length ? { campo: 'consequencias', vals: k.consDecide } : { campo: 'tarefas', vals: k.tarefas }),
    variantes: [
      { quando: k => k.criancas || k.afetados.includes('estudantes'),
        oque: 'Registrar em cada saída que afeta um estudante a versão do modelo, da base e da configuração, com prazo de guarda.',
        porque: 'Sem esse registro não dá para contestar uma decisão sobre um estudante nem investigar o que aconteceu.',
        como: ['Exigir no contrato o registro da versão do modelo, da base e da configuração em cada saída.', 'Fixar o prazo de guarda dos registros e quem pode consultá-los.', 'Testar, antes de começar, que o registro permite reconstituir uma saída contestada.'] },
      { oque: 'Registrar em cada saída que afeta uma pessoa a versão do modelo, da base e da configuração, com prazo de guarda.',
        porque: 'Sem esse registro não dá para contestar uma decisão que afeta uma pessoa nem investigar o que aconteceu.',
        como: ['Exigir no contrato o registro da versão do modelo, da base e da configuração em cada saída.', 'Fixar o prazo de guarda dos registros e quem pode consultá-los.', 'Testar, antes de começar, que o registro permite reconstituir uma saída contestada.'] },
    ],
    paraque: 'Qualquer saída que afete uma pessoa pode ser contestada e investigada depois.',
    quem: ['tecnologia', 'protecao_dados'], marco: 'M3', pd: 7,
    alta: () => true, exige: ['CONTRATO.dados-registros', 'CONTRATO.verificacao-contestacao'],
    exemplosNorma: { UE: ['Regulamento (UE) 2024/1689 (Lei de IA), art. 12 (manutenção de registros)'] },
    pronto: 'A minuta exige o registro de versão em cada saída e o prazo de guarda, e o teste de reconstituição foi feito.',
  },
  {
    id: 'R-94', versao: 1, pacote: 'CONTRATO', tipo: 'custo', substitui: ['lic-usuario-rever'], campos: ['pagamento'], requer: ['tipoTec'],
    se: k => k.v('pagamento') === 'usuario',
    variantes: [{
      oque: 'Rever a cada semestre as licenças sem uso e cancelar ou realocar as que sobram.',
      porque: 'Sem revisão periódica, a rede continua pagando por licenças que ninguém usa.',
      como: ['Pedir ao fornecedor o relatório de uso por licença a cada semestre.', 'Cancelar ou realocar as licenças sem uso.'],
    }],
    paraque: 'A rede paga só pelas licenças que estão em uso.',
    quem: ['fiscal'], marco: 'M5', pd: 8,
    exige: ['CONTRATO.custo-unidades'],
    pronto: 'O relatório semestral de uso por licença está previsto no contrato e tem quem o leia.',
  },
  {
    id: 'R-105', versao: 1, pacote: 'CONTRATO', tipo: 'custo', substitui: ['suporte-sla'], campos: ['suporteQuem'],
    se: k => k.v('suporteQuem') === 'fornecedor',
    variantes: [{
      oque: 'Fixar no contrato os níveis de serviço do suporte ao usuário (horário, canais, prazos de resposta e de solução) e as penalidades.',
      porque: 'Sem prazos e penalidades, o suporte do fornecedor responde quando puder, e as escolas param de usar a ferramenta.',
      como: ['Definir horário, canais e prazos de resposta e de solução.', 'Prever o desconto na fatura quando os prazos não forem cumpridos.'],
    }],
    paraque: 'As escolas têm resposta do suporte no prazo de que precisam.',
    quem: ['compras', 'fiscal'], marco: 'M3', pd: 7,
    alta: () => true, exige: ['CONTRATO.desempenho-sla'],
    pronto: 'A minuta traz os níveis de serviço do suporte e as penalidades.',
  },
  {
    id: 'R-106', versao: 1, pacote: 'CONTRATO', tipo: 'custo', substitui: ['suporte-divisao'], campos: ['suporteQuem'],
    se: k => k.v('suporteQuem') === 'ambos',
    variantes: [{
      oque: 'Dividir por escrito o que o suporte do fornecedor e o da rede atendem, com prazos de resposta para cada um.',
      porque: 'Sem divisão clara, cada equipe espera a outra e a escola fica sem resposta.',
      como: ['Listar o que cada suporte atende.', 'Fixar os prazos de resposta de cada um e como um chamado passa de um para o outro.'],
    }],
    paraque: 'Cada pedido de suporte tem um responsável e um prazo.',
    quem: ['tecnologia', 'fiscal'], marco: 'M3',
    exige: ['CONTRATO.direitos-matriz', 'CONTRATO.desempenho-sla'],
    pronto: 'A matriz de suporte, com prazos, está anexa ao contrato.',
  },
];
