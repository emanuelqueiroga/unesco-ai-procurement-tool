// =====================================================================
// Plano de contratação: textos fixos, recomendações e tabela das camadas
// As recomendações de RECS eram perguntas da v8 (regras do piloto, capacidade
// mínima, implantação, sustentabilidade); agora são ações do plano, aplicadas
// ao caso efetivo (casoEfetivo). Camadas: Krueger e Jackson (2026, Figura 1, p. 11).
// O texto em português é a chave de tradução (i18n/v9_p3_*.json).
// =====================================================================

// Títulos dos blocos e das seções (mesma ordem na página e no PDF)
const TIT_PLANO = {
  faltas: 'Respostas que faltam',
  resumo: 'Resumo do caso',
  A: 'Custo e compra',
  B: 'Política e governança',
  A1: 'Prova de conceito ou piloto',
  A2: 'Custo estimado (ilustrativo)',
  A3: 'Lista de verificação de custos pelas sete camadas',
  A4: 'Arranjo de aquisição',
  A5: 'Requisitos e cláusulas de custo e compra',
  A6: 'Dependência e saída',
  A7: 'Documentos do dossiê a preparar',
  B1: 'Governança da rede (camada 1)',
  B2: 'Funções que não podem ser terceirizadas',
  B3: 'Regras da prova de conceito ou do piloto',
  B4: 'Capacidade mínima nos locais',
  B5: 'Perfil de risco e premissas',
  B6: 'Dados, verificação e contestação',
  B7: 'Antes de levar à rede e para manter',
  B8: 'Monitoramento e avaliação',
  B9: 'Critérios dos pontos de decisão do guia',
  refs: 'Referências',
};

// Faixa fixa abaixo do título (página e capa do PDF)
const FAIXA_PLANO = 'Documento de trabalho baseado no guia do projeto e no quadro de custo total em camadas de Krueger e Jackson (2026). Valores ilustrativos. As opiniões e recomendações são desta ferramenta e não da UNESCO.';

// Referências (anexo). Só o guia do projeto e Krueger e Jackson (2026).
const URL_TCO = 'https://unesdoc.unesco.org/ark:/48223/pf0000399348';
const REFS_PLANO = [
  'Guia do projeto: caps. 11 (custo do ciclo de vida), 12 (orçamento), 13 (requisitos), 14 (estratégia de aquisição), 15 (propostas) e 16 (contratos).',
  'Krueger, K. e Jackson, F. para CoSN (2026). Beyond the price tag: Rethinking total cost of ownership for AI in education systems. Paris: UNESCO.',
  'Documento encomendado pela UNESCO; as opiniões são dos autores.',
];
// Nota de rodapé das tabelas que usam o documento
const REF_CURTA = 'Fonte: Krueger, K. e Jackson, F. para CoSN (2026). Beyond the price tag: Rethinking total cost of ownership for AI in education systems. Paris: UNESCO.';

// ----------------------------------------------------------- recomendações
const recAfeta = ce => (ce.consequencias || []).some(k => k !== 'nenhuma');
const recDadosPessoais = ce => (ce.dados || []).some(k => k !== 'nenhum');
const recClasse = (ce, ...ks) => (ce.classes || []).some(k => ks.includes(k));
const recGratuito = ce => ce.pagamento === 'gratuito' || ce.tipoTec === 'publica' || !!ce.pilotoGratuito;

// grupo: regras (B3), local (B4), rede e manter (B7), dados (B6), aval (B8)
// poc: true → também vale na prova de conceito (só para o grupo "local")
// textoPoc: redação para quando o teste é uma prova de conceito
// quando(ce, p): condição sobre o caso efetivo e o perfil de risco
const RECS = [
  // regras da prova de conceito ou do piloto (ex-r-*)
  { id: 'r-autorizacao', grupo: 'regras', camada: 1, texto: 'Formalizar a autorização do piloto e nomear um responsável.', textoPoc: 'Formalizar a autorização da prova de conceito e nomear um responsável.' },
  { id: 'r-baselegal', grupo: 'regras', camada: 1, texto: 'Confirmar a base legal ou obter consentimento para usar os dados.', quando: ce => recDadosPessoais(ce), dadosReais: true },
  { id: 'r-acordo', grupo: 'regras', camada: 1, texto: 'Assinar acordo de tratamento de dados que proíba usar os dados para treinar modelos.', quando: ce => recDadosPessoais(ce), dadosReais: true },
  { id: 'r-sucesso', grupo: 'regras', camada: 1, texto: 'Medir a linha de base e fixar os critérios de sucesso antes de começar.' },
  { id: 'r-parada', grupo: 'regras', camada: 1, texto: 'Definir critérios de parada e como encerrar o piloto.', textoPoc: 'Definir critérios de parada e como encerrar a prova de conceito.' },
  { id: 'r-ativos', grupo: 'regras', camada: 1, texto: 'Acordar o destino dos dados e dos materiais se o fornecedor não for escolhido.' },
  { id: 'r-gratuito', grupo: 'regras', camada: 1, texto: 'Registrar os custos que a gratuidade adia e o preço depois do piloto.', textoPoc: 'Registrar os custos que a gratuidade adia e o preço depois da prova de conceito.', quando: ce => recGratuito(ce) },
  // capacidade mínima nos locais (ex-p-*)
  { id: 'p-problema', grupo: 'local', camada: 2, poc: true, texto: 'Rever a escolha da aplicação a partir do problema definido na fase 1.' },
  { id: 'p-usuarios', grupo: 'local', camada: 2, poc: true, texto: 'Envolver professores, estudantes ou servidores na escolha e no teste.' },
  { id: 'p-adocao', grupo: 'local', camada: 2, texto: 'Definir medidas de uso e adoção para acompanhar o piloto.' },
  { id: 'p-idiomas', grupo: 'local', camada: 2, texto: 'Testar a aplicação nos idiomas e contextos dos usuários.', quando: ce => !!ce.idiomas },
  { id: 'p-conect', grupo: 'local', camada: 3, texto: 'Garantir conectividade nas escolas do piloto ou ajustar o uso previsto.', quando: ce => ce.internet !== 'sim' },
  { id: 'p-disp', grupo: 'local', camada: 3, texto: 'Garantir dispositivos para os participantes do piloto.', quando: ce => ce.dispExistem !== 'sim' || ce.modeloDisp === 'proprio' },
  { id: 'p-desplug', grupo: 'local', camada: 3, texto: 'Prever alternativa sem conexão ou atividades desplugadas para escolas com pouca infraestrutura.', quando: ce => ce.internet !== 'sim' || ce.dispExistem !== 'sim' },
  { id: 'p-protecao', grupo: 'local', camada: 5, texto: 'Minimizar e proteger os dados do piloto.', quando: ce => recDadosPessoais(ce) },
  { id: 'p-acessos', grupo: 'local', camada: 5, poc: true, texto: 'Controlar contas e acessos dos participantes.' },
  { id: 'p-incidente', grupo: 'local', camada: 5, poc: true, texto: 'Abrir um canal para relatar problemas e incidentes.' },
  { id: 'p-formacao', grupo: 'local', camada: 6, texto: 'Formar os participantes antes de começar.' },
  { id: 'p-apoio', grupo: 'local', camada: 6, texto: 'Organizar apoio pedagógico aos professores do piloto.' },
  { id: 'p-suporte', grupo: 'local', camada: 7, texto: 'Definir o suporte técnico nos locais do piloto.' },
  { id: 'p-acomp', grupo: 'local', camada: 7, poc: true, texto: 'Nomear quem acompanha o piloto e relata os resultados.', textoPoc: 'Nomear quem acompanha a prova de conceito e relata os resultados.' },
  // antes de levar à rede (ex-i-*)
  { id: 'i-evidencia', grupo: 'rede', camada: 1, texto: 'Basear a decisão de implantar na evidência do piloto.' },
  { id: 'i-contrato', grupo: 'rede', camada: 1, texto: 'Incluir no contrato cláusulas de dados, mudança, desempenho e saída.' },
  { id: 'i-supervisao', grupo: 'rede', camada: 1, texto: 'Definir a supervisão humana, com autoridade para intervir.', quando: ce => recAfeta(ce) },
  { id: 'i-adocao', grupo: 'rede', camada: 2, texto: 'Fazer um plano de adoção com metas por etapa de ensino.' },
  { id: 'i-acessib', grupo: 'rede', camada: 2, texto: 'Garantir acessibilidade e cobertura de idiomas.' },
  { id: 'i-infra', grupo: 'rede', camada: 3, texto: 'Dimensionar conectividade e dispositivos para toda a rede.' },
  { id: 'i-pico', grupo: 'rede', camada: 3, texto: 'Dimensionar a capacidade para o horário de pico.', quando: ce => ['api', 'ow'].includes(ce.arquitetura) },
  { id: 'i-integra', grupo: 'rede', camada: 4, texto: 'Testar a integração com identidade, matrícula e ambiente virtual.' },
  { id: 'i-base', grupo: 'rede', camada: 4, texto: 'Nomear responsável e rotina de curadoria da base de conhecimento.', quando: ce => ce.arquitetura === 'api' },
  { id: 'i-finalidade', grupo: 'rede', camada: 4, texto: 'Limitar os dados pessoais de estudantes a finalidades definidas e com base legal.', quando: ce => recDadosPessoais(ce) },
  { id: 'i-portab', grupo: 'rede', camada: 4, texto: 'Garantir a exportação de dados e configurações em formato aberto.' },
  { id: 'i-dpia', grupo: 'rede', camada: 5, texto: 'Concluir a avaliação de impacto sobre a proteção de dados.', quando: ce => recDadosPessoais(ce) },
  { id: 'i-identidade', grupo: 'rede', camada: 5, texto: 'Estender a gestão de identidades e acessos a toda a rede.' },
  { id: 'i-adversarial', grupo: 'rede', camada: 5, texto: 'Fazer testes de segurança e testes adversariais antes de ampliar.', quando: (ce, p) => !!(p && p.alto) },
  { id: 'i-geracao', grupo: 'rede', camada: 5, texto: 'Instalar filtros e revisão para o conteúdo gerado.', quando: ce => recClasse(ce, 'geracao', 'conversa') },
  { id: 'i-fornecedor', grupo: 'rede', camada: 5, texto: 'Fazer diligência sobre o fornecedor e seus subcontratados.' },
  { id: 'i-incidente', grupo: 'rede', camada: 5, texto: 'Aprovar um plano de resposta a incidentes, com quem pode suspender o uso.' },
  { id: 'i-formacao', grupo: 'rede', camada: 6, texto: 'Planejar a formação por perfil.' },
  { id: 'i-rotatividade', grupo: 'rede', camada: 6, texto: 'Prever formação para quem entra nas equipes.' },
  { id: 'i-suporte', grupo: 'rede', camada: 7, texto: 'Dimensionar o suporte aos usuários para toda a rede.' },
  { id: 'i-monitor', grupo: 'rede', camada: 7, texto: 'Monitorar desempenho, consumo e custo, com gatilhos de ação.' },
  { id: 'i-gestao', grupo: 'rede', camada: 7, texto: 'Nomear responsáveis pela operação e pela gestão do contrato.' },
  // dados, verificação e contestação (B6)
  { id: 'i-rastreio', grupo: 'dados', camada: 4, texto: 'Registrar e tornar rastreáveis as saídas que classificam ou preveem.', quando: ce => recClasse(ce, 'classificacao', 'previsao') },
  { id: 'v-verificar', grupo: 'dados', camada: 4, texto: 'Exigir informação para verificar e registrar como cada saída foi produzida.' },
  { id: 'i-contestacao', grupo: 'dados', camada: 2, texto: 'Criar um caminho para contestar saídas e corrigir erros, com prazo e autoridade para rever.', quando: ce => recAfeta(ce) },
  // para manter e ampliar (ex-s-*)
  { id: 's-continuidade', grupo: 'manter', camada: 1, texto: 'Marcar revisões periódicas da decisão de continuidade.' },
  { id: 's-politica', grupo: 'manter', camada: 1, texto: 'Atualizar a política de IA na educação com as lições aprendidas.' },
  { id: 's-evidencia', grupo: 'manter', camada: 2, texto: 'Produzir evidência de resultado para as novas populações.' },
  { id: 's-adocao', grupo: 'manter', camada: 2, texto: 'Acompanhar a adoção por escola e por grupo de estudantes.' },
  { id: 's-renovacao', grupo: 'manter', camada: 3, texto: 'Planejar a renovação de dispositivos e infraestrutura.' },
  { id: 's-interop', grupo: 'manter', camada: 4, texto: 'Rever a interoperabilidade para reduzir a dependência de um fornecedor.' },
  { id: 's-qualidade', grupo: 'manter', camada: 4, texto: 'Monitorar a qualidade dos dados.' },
  { id: 's-revisao', grupo: 'manter', camada: 5, texto: 'Agendar revisões periódicas de segurança e privacidade.' },
  { id: 's-mudanca', grupo: 'manter', camada: 5, texto: 'Reavaliar o sistema a cada mudança relevante.' },
  { id: 's-formacao', grupo: 'manter', camada: 6, texto: 'Manter formação contínua e preparar lideranças.' },
  { id: 's-saida', grupo: 'manter', camada: 7, texto: 'Calcular o custo de saída e testar o plano de transição.' },
  { id: 's-equidade', grupo: 'manter', camada: 7, texto: 'Garantir o mesmo acesso e suporte às escolas com menos condições.' },
  // monitoramento (B8). v11: sem fonte de recursos (o passo saiu do percurso).
  { id: 'g-avaliacao', grupo: 'aval', camada: 1, texto: 'Definir indicadores, responsáveis e rotina de monitoramento e avaliação.' },
];

// Governança (passo 1.3): o que fazer quando a resposta é Não, Em parte ou Não sei
const ACOES_G = {
  'g-comite': 'Designar uma equipe ou instância responsável por IA na educação, com tempo dedicado e participação de pedagogia, tecnologia, jurídico, compras, proteção de dados e direção.',
  'g-politica': 'Aprovar uma política ou estratégia de IA na educação, com finalidades, usos permitidos e responsabilidades.',
  'g-legislacao': 'Mapear a legislação aplicável: proteção de dados, regras de IA, direitos de crianças e compras públicas.',
  'g-dados': 'Definir a política de dados educacionais: acesso, compartilhamento, guarda e exclusão.',
  'g-etica': 'Publicar orientações de uso responsável de IA para professores, estudantes e gestores.',
  'g-compras': 'Adotar orientação de compras de IA com custo do ciclo de vida, diligência e cláusulas de dados e de saída.',
};
const PRIORIDADE_G = { 'g-legislacao': 'alta', 'g-dados': 'alta' };
const RESP_G_NOME = { sim: 'Sim', parcial: 'Em parte', nao: 'Não', nao_sei: 'Não sei' };

// Funções que não podem ser terceirizadas (guia, cap. 2)
const FUNCOES_INTERNAS = ['Definir a finalidade', 'Aceitar riscos', 'Interpretar evidências', 'Decidir sobre continuidade', 'Prestar contas'];

// ----------------------------------------------------------- A3: sete camadas
// "O que considerar" parafraseia a Figura 1 (p. 11) de Krueger e Jackson (2026).
// "Onde está": subcomponentes da árvore de custos (convenção desta ferramenta, CAMADA_DE_S).
const A3_CAMADAS = [
  { n: 1, considerar: 'Estruturas de governança, política, revisão ética, orientação de compras, rotinas de monitoramento, revisão jurídica e planejamento do ciclo de vida (p. 11).' },
  { n: 2, considerar: 'Ferramentas, aplicações, assinaturas e experiências de uso mais visíveis para professores, estudantes e gestores (p. 11).' },
  { n: 3, considerar: 'Infraestrutura, banda, nuvem e dispositivos (p. 11). Em sistemas com poucos recursos, conectividade, dispositivos e energia podem ser o primeiro e maior custo (p. 7).' },
  { n: 4, considerar: 'Interoperabilidade, matrícula, identidade, plataformas de aprendizagem e sistemas de informação de estudantes; acervo de conhecimento institucional (p. 11).' },
  { n: 5, considerar: 'Gestão de identidade, monitoramento, risco de terceiros, privacidade e conformidade (p. 11).' },
  { n: 6, considerar: 'Formação contínua por função: professores e equipes técnicas, administrativas e de liderança (p. 6, p. 11).' },
  { n: 7, considerar: 'Suporte técnico, monitoramento, gestão de fornecedores, manutenção, avaliação e planejamento da sustentabilidade (p. 11).' },
];
// Se CAMADA_DE_S (custos.js) não estiver disponível, a mesma convenção (plano, A.3)
const CAMADA_DE_S_PLANO = {
  'K1.1': 3, 'K1.2': 3, 'K1.3': 5, 'K2.1': 2, 'K2.2': 2, 'K2.3': 3, 'K2.4': 4, 'K2.5': 3,
  'K3.1': 4, 'K3.2': 2, 'K3.3': 1, 'K3.4': 7, 'K4.1': 7, 'K4.2': 7, 'K4.3': 6, 'K4.4': 6,
  'K5.1': 7, 'K5.2': 5, 'K5.3': 7, 'K5.4': 5, 'K5.5': 7, 'K6.1': 7, 'K6.2': 7, 'K6.3': 7,
};
const NOTA_CONVENCAO = 'A correspondência entre os componentes de custo da ferramenta (K1 a K6) e as sete camadas é uma convenção desta ferramenta.';
const NOTA_SAIDA = 'A saída não consta no documento; está na camada 7 por convenção da ferramenta.';
// Linhas condicionais da lista de verificação (A3)
const A3_ALERTAS = {
  gratuito: 'Custos adiados pela gratuidade: uma ferramenta doada, gratuita ou embutida passa por fora do momento em que as condições normalmente são negociadas, e os custos que ela adia não desaparecem. Registre o que acontece quando o período gratuito terminar (p. 7–8; p. 13, pergunta 2).',
  consumo: 'Custo variável por uso: cada uso consome capacidade de computação e é cobrado à medida que se acumula. Monitore esse custo à medida que o uso cresce (p. 6).',
  licencas: 'Licenças pagas e não usadas são desperdício (p. 3): compare o custo por usuário licenciado com o custo por usuário ativo.',
  base: 'Condições de base: em sistemas com poucos recursos, conectividade, dispositivos e energia podem ser o primeiro e maior custo, e a desigualdade de acesso começa aí (p. 7).',
};

// ----------------------------------------------------------- textos fixos
const TXT_A1 = [
  'Mantenha separadas duas decisões: se vale a pena aprender sobre uma solução e se a evidência justifica a aquisição ou a expansão.',
  'O desenho do teste deve explicitar que sucesso técnico não gera direito nem decisão automática de continuidade.',
  'Contratar por etapas limita o compromisso inicial e permite avançar à medida que as hipóteses se confirmam: viabilidade, população restrita, expansão por critérios definidos previamente.',
];
const TXT_A1_POC = 'Use dados de teste ou selecionados, sem usuários reais nem integrações que criem dependência.';
const TXT_A4 = 'Os arranjos são combináveis: uma aplicação própria pode usar um modelo por API e uma base de conhecimento compartilhada. O que importa é a clareza sobre quem controla cada componente e por quê.';
// v11: a seção "Fonte de recursos" saiu do plano; estes dois textos continuam em A5 (requisitos de custo e compra)
const TXT_A5 = {
  sempre: 'Teste o orçamento sem condições promocionais e compare as propostas no mesmo horizonte, incluindo mudança e saída.',
  incluida: 'Verifique se o preço da plataforma que a rede já paga mudou com a IA e em que unidade é cobrado (Krueger e Jackson, 2026, p. 6, custos embutidos e distribuídos).',
};
// Figura 1 de Krueger e Jackson (2026, p. 11), reproduzida em A3 (página) e no PDF (página própria).
// A imagem vem de assets/fig1_tco.jpg, injetada pelo build como FIG_TCO (data URI); sem ela, a figura não aparece.
const FIG_LEGENDA = 'Figura 1 de Krueger, K. e Jackson, F. para CoSN (2026), Beyond the price tag, p. 11. © UNESCO 2026, licença CC BY-SA 3.0 IGO; reproduzida sem alterações.';
const FIG_TITULO = 'Quadro de custo total em camadas';
const FIG_ALT = 'Figura 1 de Krueger e Jackson (2026): as sete camadas do custo total da IA na educação, de governança a operação e sustentabilidade.';
const TXT_B1_REF = 'Krueger e Jackson (2026) incluem na camada 1 estruturas de governança, política, revisão ética, orientação de compras e revisão jurídica (p. 11) e sugerem uma governança que reúna tecnologia, currículo, cibersegurança, jurídico e conformidade, compras, operação e direção (p. 12).';
const TXT_B8_REF = 'Krueger e Jackson (2026, p. 13) sugerem mecanismos para medir impacto organizacional, sustentabilidade, equidade, efetividade operacional e qualidade da implementação no longo prazo.';

if (typeof module !== 'undefined') module.exports = { TIT_PLANO, FAIXA_PLANO, URL_TCO, REFS_PLANO, REF_CURTA, RECS, ACOES_G, PRIORIDADE_G, RESP_G_NOME, FUNCOES_INTERNAS, A3_CAMADAS, CAMADA_DE_S_PLANO, NOTA_CONVENCAO, NOTA_SAIDA, A3_ALERTAS, TXT_A1, TXT_A1_POC, TXT_A4, TXT_A5, FIG_LEGENDA, FIG_TITULO, FIG_ALT, TXT_B1_REF, TXT_B8_REF };
