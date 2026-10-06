// =====================================================================
// Fluxo em quatro fases: contexto → piloto → implantação → sustentabilidade e expansão
// Camadas do custo de IA na educação (Krueger & Jackson, 2026, Figura 1).
// =====================================================================
const FASES = [
  { id: 'contexto', n: 1, nome: 'Contexto', sub: 'Contexto, problema e governança de IA na educação', pds: [1, 2] },
  { id: 'piloto', n: 2, nome: 'Piloto', sub: 'Testar em poucos locais, com capacidade mínima', pds: [3, 4] },
  { id: 'implantacao', n: 3, nome: 'Implantação', sub: 'Levar à rede, com todas as camadas', pds: [5, 6, 7, 8] },
  { id: 'escala', n: 4, nome: 'Sustentabilidade e expansão', sub: 'Manter, ampliar e decidir a continuidade', pds: [9] },
];
const CAMADAS = [
  [1, 'Governança, políticas e planejamento do ciclo de vida'],
  [2, 'Aplicações de IA, experiência de uso e adoção'],
  [3, 'Infraestrutura e dispositivos'],
  [4, 'Integração de dados e sistemas'],
  [5, 'Cibersegurança, privacidade e conformidade'],
  [6, 'Formação e capacidade das equipes'],
  [7, 'Operação, suporte e sustentabilidade'],
];
const CAMADAS_FASE = { contexto: [1], piloto: [1, 2, 3, 5, 6, 7], implantacao: [1, 2, 3, 4, 5, 6, 7], escala: [1, 2, 3, 4, 5, 6, 7] };
const NIVEIS_ADM = [['pais', 'País'], ['estado', 'Estado ou província'], ['municipio', 'Município ou cidade'], ['distrito', 'Distrito ou região escolar'], ['rede', 'Rede ou grupo de escolas'], ['outro', 'Outro']];
const ETAPAS_ENS = [
  ['infantil', 'Educação infantil', 'Creche e pré-escola', ['Creche', 'Pré-escola']],
  ['fund1', 'Ensino fundamental: anos iniciais', 'Do 1º ao 5º ano', ['1º ano', '2º ano', '3º ano', '4º ano', '5º ano']],
  ['fund2', 'Ensino fundamental: anos finais', 'Do 6º ao 9º ano', ['6º ano', '7º ano', '8º ano', '9º ano']],
  ['medio', 'Ensino médio', 'Da 1ª à 3ª série', ['1ª série', '2ª série', '3ª série']],
  ['superior', 'Educação superior', 'Graduação e pós-graduação', []],
  ['eja', 'Educação de jovens e adultos', 'Escolarização de quem não concluiu na idade prevista', []],
  ['profissional', 'Educação profissional e técnica', 'Cursos técnicos e de qualificação', []],
];
const DOMINIOS = [
  { id: 'qualificacao', nome: 'Qualificação', lema: 'Aprender a conhecer e a fazer', ativo: true,
    desc: 'Conhecimentos, habilidades e competências que permitem fazer algo: ler e escrever, calcular, compreender o mundo natural, usar tecnologias.',
    ex: ['Estudantes do 5º ano abaixo do nível esperado em leitura', 'Baixa proficiência em matemática ao fim do ensino fundamental', 'Pouca prática de investigação nas aulas de ciências'],
    comps: [['alfabetizacao', 'Alfabetização e linguagem', 'Leitura, escrita, oralidade e outras línguas'], ['matematica', 'Matemática', 'Numeracia, raciocínio e resolução de problemas'], ['ciencias', 'Ciências', 'Ciências da natureza e investigação científica'], ['digital', 'Letramento digital e em IA', 'Uso crítico de tecnologias, inclusive de IA'], ['outro', 'Outro componente', 'Descreva no campo abaixo']] },
  { id: 'socializacao', nome: 'Socialização', lema: 'Aprender a pertencer e a conviver', ativo: false,
    desc: 'Como as pessoas passam a fazer parte de comunidades, culturas e tradições: convivência, cidadania, valores e pertencimento à escola.',
    ex: ['Abandono ligado à falta de pertencimento', 'Conflitos e violência na escola', 'Acolhimento de estudantes migrantes'] },
  { id: 'subjetivacao', nome: 'Subjetivação', lema: 'Aprender a ser', ativo: false,
    desc: 'Como cada pessoa se torna sujeito autônomo e responsável: autonomia, pensamento crítico, projeto de vida e bem-estar.',
    ex: ['Projeto de vida no ensino médio', 'Autonomia e autorregulação da aprendizagem', 'Bem-estar emocional dos estudantes'] },
];
const RESP = [['sim', 'Sim'], ['parcial', 'Em parte'], ['nao', 'Não'], ['na', 'Não se aplica']];

// Perguntas por fase e camada. quando(c, p): só aparece se a condição valer.
const afeta = c => (c.consequencias || []).some(k => k !== 'nenhuma');
const dadosPessoais = c => (c.dados || []).some(k => k !== 'nenhum');
const temClasse = (c, ...ks) => (c.classes || []).some(k => ks.includes(k));
const QUESTOES = [
  // Fase 1: governança de IA na educação (camada 1, transversal)
  { id: 'g-equipe', fase: 'contexto', c: 1, t: 'Há um departamento ou uma equipe designada para IA na educação?', h: 'Com responsável nomeado, atribuições e tempo dedicado.' },
  { id: 'g-politica', fase: 'contexto', c: 1, t: 'Existe política ou estratégia de IA na educação?', h: 'Documento aprovado que define finalidades, usos permitidos e responsabilidades.' },
  { id: 'g-legislacao', fase: 'contexto', c: 1, t: 'A legislação aplicável foi identificada?', h: 'Proteção de dados, regras de IA, direitos de crianças e adolescentes, compras públicas.' },
  { id: 'g-dados', fase: 'contexto', c: 1, t: 'Há política de dados educacionais?', h: 'Quem pode acessar, compartilhar, guardar e excluir dados de estudantes e servidores.' },
  { id: 'g-etica', fase: 'contexto', c: 1, t: 'Há normas de ética ou de uso responsável de IA?', h: 'Orientações para professores, estudantes e gestores, inclusive o que é proibido.' },
  { id: 'g-comite', fase: 'contexto', c: 1, t: 'Existe uma instância de governança que reúne várias áreas?', h: 'Tecnologia, pedagogia, cibersegurança, jurídico, compras, operação e direção.' },
  { id: 'g-compras', fase: 'contexto', c: 1, t: 'Há orientação para comprar e contratar IA?', h: 'Custo do ciclo de vida, diligência sobre fornecedores, cláusulas de dados e de saída.' },
  { id: 'g-orcamento', fase: 'contexto', c: 1, t: 'O planejamento orçamentário vai além do piloto?', h: 'Fonte de recursos prevista para operar e manter a solução nos próximos anos.' },
  { id: 'g-avaliacao', fase: 'contexto', c: 1, t: 'Há mecanismos de monitoramento e avaliação?', h: 'Indicadores, responsáveis e rotina para avaliar resultados e efeitos não desejados.' },
  // Fase 2: regras do piloto (camada 1)
  { id: 'r-autorizacao', fase: 'piloto', c: 1, g: 'regras', t: 'O piloto tem autorização formal e um responsável definido?' },
  { id: 'r-baselegal', fase: 'piloto', c: 1, g: 'regras', t: 'Há base legal ou consentimento para usar os dados de estudantes e servidores?', quando: c => dadosPessoais(c) },
  { id: 'r-acordo', fase: 'piloto', c: 1, g: 'regras', t: 'Há acordo de tratamento de dados com o fornecedor, sem uso para treinar modelos?', quando: c => dadosPessoais(c) },
  { id: 'r-sucesso', fase: 'piloto', c: 1, g: 'regras', t: 'A linha de base e os critérios de sucesso foram definidos antes de começar?' },
  { id: 'r-parada', fase: 'piloto', c: 1, g: 'regras', t: 'Há critérios de parada e um plano para encerrar o piloto?' },
  { id: 'r-ativos', fase: 'piloto', c: 1, g: 'regras', t: 'Está definido o destino dos dados e dos materiais produzidos se o fornecedor não for escolhido?' },
  { id: 'r-gratuito', fase: 'piloto', c: 1, g: 'regras', t: 'Os custos que a gratuidade adia foram registrados?', tag: 'piloto gratuito', quando: c => c.pilotoGratuito },
  // Fase 2: capacidade mínima nos locais do piloto
  { id: 'p-problema', fase: 'piloto', c: 2, t: 'A aplicação foi escolhida a partir do problema, e não o contrário?' },
  { id: 'p-usuarios', fase: 'piloto', c: 2, t: 'Professores, estudantes ou servidores do piloto participaram da escolha e do teste?' },
  { id: 'p-adocao', fase: 'piloto', c: 2, t: 'Há medidas de uso e adoção definidas para o piloto?' },
  { id: 'p-idiomas', fase: 'piloto', c: 2, t: 'A aplicação funciona nos idiomas e contextos dos usuários do piloto?', quando: c => c.idiomas },
  { id: 'p-conect', fase: 'piloto', c: 3, t: 'As escolas do piloto têm conectividade suficiente para o uso previsto?' },
  { id: 'p-disp', fase: 'piloto', c: 3, t: 'Há dispositivos suficientes para os participantes do piloto?' },
  { id: 'p-desplug', fase: 'piloto', c: 3, t: 'Há alternativa para escolas com pouca infraestrutura (uso sem conexão ou atividades desplugadas)?' },
  { id: 'p-protecao', fase: 'piloto', c: 5, t: 'Os dados do piloto são mínimos e estão protegidos?', quando: c => dadosPessoais(c) },
  { id: 'p-acessos', fase: 'piloto', c: 5, t: 'Contas e acessos dos participantes são controlados?' },
  { id: 'p-incidente', fase: 'piloto', c: 5, t: 'Há canal para relatar problemas e incidentes durante o piloto?' },
  { id: 'p-formacao', fase: 'piloto', c: 6, t: 'Os participantes recebem formação antes de começar?' },
  { id: 'p-apoio', fase: 'piloto', c: 6, t: 'Há apoio pedagógico para os professores do piloto?' },
  { id: 'p-suporte', fase: 'piloto', c: 7, t: 'Há suporte técnico definido nos locais do piloto?' },
  { id: 'p-acomp', fase: 'piloto', c: 7, t: 'Há responsável por acompanhar o piloto e relatar os resultados?' },
  // Fase 3: implantação, todas as camadas; 4 e 5 dependem da aplicação
  { id: 'i-evidencia', fase: 'implantacao', c: 1, t: 'A decisão de implantar se baseia na evidência do piloto?' },
  { id: 'i-contrato', fase: 'implantacao', c: 1, t: 'O contrato tem cláusulas de dados, mudança, desempenho e saída?' },
  { id: 'i-supervisao', fase: 'implantacao', c: 1, t: 'A supervisão humana está definida, com autoridade para intervir?', tag: 'afeta pessoas', quando: c => afeta(c) },
  { id: 'i-adocao', fase: 'implantacao', c: 2, t: 'Há plano de adoção para toda a rede, com metas por etapa de ensino?' },
  { id: 'i-contestacao', fase: 'implantacao', c: 2, t: 'Quem é afetado pelas saídas pode contestar e ter o erro corrigido?', tag: 'afeta pessoas', quando: c => afeta(c) },
  { id: 'i-acessib', fase: 'implantacao', c: 2, t: 'A aplicação é acessível para estudantes com deficiência e para todos os idiomas atendidos?' },
  { id: 'i-infra', fase: 'implantacao', c: 3, t: 'Conectividade e dispositivos estão dimensionados para toda a rede?' },
  { id: 'i-pico', fase: 'implantacao', c: 3, t: 'A capacidade de computação ou de consumo está dimensionada para o horário de pico?', quando: c => ['api', 'ow'].includes(c.arquitetura) },
  { id: 'i-integra', fase: 'implantacao', c: 4, t: 'A integração com os sistemas da rede (identidade, matrícula, ambiente virtual) foi testada?' },
  { id: 'i-base', fase: 'implantacao', c: 4, t: 'A base de conhecimento tem curadoria e responsável?', tag: 'base de conhecimento', quando: c => c.arquitetura === 'api' },
  { id: 'i-finalidade', fase: 'implantacao', c: 4, t: 'Dados pessoais de estudantes só entram com finalidade definida e base legal?', tag: 'dados pessoais', quando: c => dadosPessoais(c) },
  { id: 'i-rastreio', fase: 'implantacao', c: 4, t: 'As saídas que classificam ou preveem são registradas e rastreáveis?', tag: 'classificação ou previsão', quando: c => temClasse(c, 'classificacao', 'previsao') },
  { id: 'i-portab', fase: 'implantacao', c: 4, t: 'Dados e configurações podem ser exportados em formato aberto?' },
  { id: 'i-dpia', fase: 'implantacao', c: 5, t: 'A avaliação de impacto sobre a proteção de dados foi concluída?', tag: 'dados pessoais', quando: c => dadosPessoais(c) },
  { id: 'i-identidade', fase: 'implantacao', c: 5, t: 'A gestão de identidades e acessos cobre toda a rede?' },
  { id: 'i-adversarial', fase: 'implantacao', c: 5, t: 'Houve testes de segurança e testes adversariais antes de ampliar?', tag: 'risco elevado', quando: (c, p) => p.alto },
  { id: 'i-geracao', fase: 'implantacao', c: 5, t: 'Há filtros e revisão para conteúdo gerado inadequado ou incorreto?', tag: 'geração de conteúdo', quando: c => temClasse(c, 'geracao', 'conversa') },
  { id: 'i-fornecedor', fase: 'implantacao', c: 5, t: 'O fornecedor e seus subcontratados passaram por diligência?' },
  { id: 'i-incidente', fase: 'implantacao', c: 5, t: 'Há plano de resposta a incidentes, com quem pode suspender o uso?' },
  { id: 'i-formacao', fase: 'implantacao', c: 6, t: 'Há formação por perfil: professores, gestores e equipe técnica?' },
  { id: 'i-rotatividade', fase: 'implantacao', c: 6, t: 'A formação considera a rotatividade das equipes?' },
  { id: 'i-suporte', fase: 'implantacao', c: 7, t: 'O suporte aos usuários está dimensionado para toda a rede?' },
  { id: 'i-monitor', fase: 'implantacao', c: 7, t: 'Desempenho, consumo e custo são monitorados, com gatilhos de ação?' },
  { id: 'i-gestao', fase: 'implantacao', c: 7, t: 'Há responsáveis pela operação e pela gestão do contrato?' },
  // Fase 4: sustentabilidade e expansão
  { id: 's-continuidade', fase: 'escala', c: 1, t: 'A decisão de continuidade é revista periodicamente (manter, ajustar, ampliar, substituir ou encerrar)?' },
  { id: 's-politica', fase: 'escala', c: 1, t: 'A política de IA na educação foi atualizada com o que se aprendeu?' },
  { id: 's-evidencia', fase: 'escala', c: 2, t: 'Há evidência de resultado para as novas populações da expansão?' },
  { id: 's-adocao', fase: 'escala', c: 2, t: 'A adoção é acompanhada por escola e por grupo de estudantes?' },
  { id: 's-renovacao', fase: 'escala', c: 3, t: 'Há plano de renovação de dispositivos e infraestrutura?' },
  { id: 's-interop', fase: 'escala', c: 4, t: 'A interoperabilidade foi revista para não depender de um único fornecedor?' },
  { id: 's-qualidade', fase: 'escala', c: 4, t: 'A qualidade dos dados é monitorada?' },
  { id: 's-revisao', fase: 'escala', c: 5, t: 'Segurança e privacidade são revisadas periodicamente?' },
  { id: 's-mudanca', fase: 'escala', c: 5, t: 'Cada mudança relevante do sistema leva a uma nova avaliação?' },
  { id: 's-formacao', fase: 'escala', c: 6, t: 'Há formação contínua e lideranças preparadas?' },
  { id: 's-orcamento', fase: 'escala', c: 7, t: 'O orçamento recorrente está garantido nos próximos exercícios?' },
  { id: 's-saida', fase: 'escala', c: 7, t: 'O custo de saída é conhecido e o plano de transição foi testado?' },
  { id: 's-equidade', fase: 'escala', c: 7, t: 'Escolas com menos condições têm o mesmo acesso e o mesmo suporte?' },
];

const PASSOS = {
  contexto: [['1a', 'Onde e para quem'], ['1b', 'Que problema você quer resolver'], ['1c', 'Governança de IA na educação']],
  piloto: [['2a', 'O que a solução faz'], ['2b', 'Pessoas, dados e consequências'], ['2c', 'Perfil de risco'], ['2d', 'Regras do piloto'], ['2e', 'Capacidade mínima nos locais do piloto'], ['2f', 'Custo do piloto']],
  implantacao: [['3a', 'Capacidade da rede, camada por camada'], ['3b', 'Contrato, dados e supervisão'], ['3c', 'Custo total e orçamento']],
  escala: [['4a', 'Sustentabilidade e expansão, camada por camada'], ['4b', 'Sustentabilidade financeira'], ['4c', 'Decisão de continuidade']],
};
// O que fazer quando a resposta é "Não" ou "Em parte"
const ACOES = {
  'g-equipe': 'Designar uma equipe ou um responsável por IA na educação, com atribuições e tempo dedicado.',
  'g-politica': 'Aprovar uma política ou estratégia de IA na educação, com finalidades, usos permitidos e responsabilidades.',
  'g-legislacao': 'Mapear a legislação aplicável: proteção de dados, regras de IA, direitos de crianças e compras públicas.',
  'g-dados': 'Definir a política de dados educacionais: acesso, compartilhamento, guarda e exclusão.',
  'g-etica': 'Publicar orientações de uso responsável de IA para professores, estudantes e gestores.',
  'g-comite': 'Criar uma instância de governança com tecnologia, pedagogia, jurídico, compras, segurança e direção.',
  'g-compras': 'Adotar orientação de compras de IA com custo do ciclo de vida, diligência e cláusulas de dados e de saída.',
  'g-orcamento': 'Prever a fonte de recursos para operar e manter a solução depois do piloto.',
  'g-avaliacao': 'Definir indicadores, responsáveis e rotina de monitoramento e avaliação.',
  'r-autorizacao': 'Formalizar a autorização do piloto e nomear um responsável.',
  'r-baselegal': 'Confirmar a base legal ou obter consentimento para usar os dados.',
  'r-acordo': 'Assinar acordo de tratamento de dados que proíba usar os dados para treinar modelos.',
  'r-sucesso': 'Medir a linha de base e fixar os critérios de sucesso antes de começar.',
  'r-parada': 'Definir critérios de parada e como encerrar o piloto.',
  'r-ativos': 'Acordar o destino dos dados e dos materiais se o fornecedor não for escolhido.',
  'r-gratuito': 'Registrar os custos que a gratuidade adia e o preço depois do piloto.',
  'p-problema': 'Rever a escolha da aplicação a partir do problema definido na fase 1.',
  'p-usuarios': 'Envolver professores, estudantes ou servidores na escolha e no teste.',
  'p-adocao': 'Definir medidas de uso e adoção para acompanhar o piloto.',
  'p-idiomas': 'Testar a aplicação nos idiomas e contextos dos usuários.',
  'p-conect': 'Garantir conectividade nas escolas do piloto ou ajustar o uso previsto.',
  'p-disp': 'Garantir dispositivos para os participantes do piloto.',
  'p-desplug': 'Prever alternativa sem conexão ou atividades desplugadas para escolas com pouca infraestrutura.',
  'p-protecao': 'Minimizar e proteger os dados do piloto.',
  'p-acessos': 'Controlar contas e acessos dos participantes.',
  'p-incidente': 'Abrir um canal para relatar problemas e incidentes.',
  'p-formacao': 'Formar os participantes antes de começar.',
  'p-apoio': 'Organizar apoio pedagógico aos professores do piloto.',
  'p-suporte': 'Definir o suporte técnico nos locais do piloto.',
  'p-acomp': 'Nomear quem acompanha o piloto e relata os resultados.',
  'i-evidencia': 'Basear a decisão de implantar na evidência do piloto.',
  'i-contrato': 'Incluir no contrato cláusulas de dados, mudança, desempenho e saída.',
  'i-supervisao': 'Definir a supervisão humana, com autoridade para intervir.',
  'i-adocao': 'Fazer um plano de adoção com metas por etapa de ensino.',
  'i-contestacao': 'Criar um caminho para contestar saídas e corrigir erros.',
  'i-acessib': 'Garantir acessibilidade e cobertura de idiomas.',
  'i-infra': 'Dimensionar conectividade e dispositivos para toda a rede.',
  'i-pico': 'Dimensionar a capacidade para o horário de pico.',
  'i-integra': 'Testar a integração com identidade, matrícula e ambiente virtual.',
  'i-base': 'Nomear responsável e rotina de curadoria da base de conhecimento.',
  'i-finalidade': 'Limitar os dados pessoais de estudantes a finalidades definidas e com base legal.',
  'i-rastreio': 'Registrar e tornar rastreáveis as saídas que classificam ou preveem.',
  'i-portab': 'Garantir a exportação de dados e configurações em formato aberto.',
  'i-dpia': 'Concluir a avaliação de impacto sobre a proteção de dados.',
  'i-identidade': 'Estender a gestão de identidades e acessos a toda a rede.',
  'i-adversarial': 'Fazer testes de segurança e testes adversariais antes de ampliar.',
  'i-geracao': 'Instalar filtros e revisão para o conteúdo gerado.',
  'i-fornecedor': 'Fazer diligência sobre o fornecedor e seus subcontratados.',
  'i-incidente': 'Aprovar um plano de resposta a incidentes, com quem pode suspender o uso.',
  'i-formacao': 'Planejar a formação por perfil.',
  'i-rotatividade': 'Prever formação para quem entra nas equipes.',
  'i-suporte': 'Dimensionar o suporte aos usuários para toda a rede.',
  'i-monitor': 'Monitorar desempenho, consumo e custo, com gatilhos de ação.',
  'i-gestao': 'Nomear responsáveis pela operação e pela gestão do contrato.',
  's-continuidade': 'Marcar revisões periódicas da decisão de continuidade.',
  's-politica': 'Atualizar a política de IA na educação com as lições aprendidas.',
  's-evidencia': 'Produzir evidência de resultado para as novas populações.',
  's-adocao': 'Acompanhar a adoção por escola e por grupo de estudantes.',
  's-renovacao': 'Planejar a renovação de dispositivos e infraestrutura.',
  's-interop': 'Rever a interoperabilidade para reduzir a dependência de um fornecedor.',
  's-qualidade': 'Monitorar a qualidade dos dados.',
  's-revisao': 'Agendar revisões periódicas de segurança e privacidade.',
  's-mudanca': 'Reavaliar o sistema a cada mudança relevante.',
  's-formacao': 'Manter formação contínua e preparar lideranças.',
  's-orcamento': 'Garantir orçamento recorrente para os próximos exercícios.',
  's-saida': 'Calcular o custo de saída e testar o plano de transição.',
  's-equidade': 'Garantir o mesmo acesso e suporte às escolas com menos condições.',
};
// "Não" nestas perguntas impede avançar
const ESSENCIAIS = new Set(['g-legislacao', 'g-dados', 'r-autorizacao', 'r-baselegal', 'r-acordo', 'r-sucesso', 'r-parada', 'p-problema', 'p-protecao', 'p-acessos', 'p-formacao',
  'i-evidencia', 'i-contrato', 'i-supervisao', 'i-contestacao', 'i-finalidade', 'i-dpia', 'i-identidade', 'i-adversarial', 'i-incidente', 's-evidencia', 's-orcamento', 's-saida', 's-equidade']);
// Respostas anteriores que ajudam a responder (evita perguntar duas vezes sem contexto)
const REFS = {
  'r-sucesso': ['1.2', c => (OPC.linhaBase.find(o => o[0] === c.linhaBase) || ['', ''])[1], 'linhaBase'],
  'r-acordo': ['2.2', c => ({ nao: 'Não, está vedado por contrato', sim: 'Sim, ou depende de configuração', nao_sei: 'Não sabemos' })[c.treino], 'treino'],
  'i-contestacao': ['2.2', c => (OPC.contestacao.find(o => o[0] === c.contestacao) || ['', ''])[1], 'contestacao'],
};
// Campos do caso que definem o perfil de risco
const CAMPOS_RISCO = [['classes', 'O que a IA faz', '2a'], ['autonomia', 'Grau de autonomia', '2a'], ['usuarios', 'Quem usa o sistema', '2b'], ['afetados', 'Quem é afetado pelas saídas', '2b'],
  ['consequencias', 'Em que entra a saída do sistema', '2b'], ['dados', 'Que dados são usados', '2b'], ['frequencia', 'Frequência de uso', '2b'], ['reversibilidade', 'Se a saída estiver errada', '2b'],
  ['verificabilidade', 'Verificação das saídas', '2b'], ['contestacao', 'Contestação', '2b'], ['cumulativo', 'Efeitos cumulativos', '2b']];


// Exemplos ilustrativos de contexto (coerentes com os casos A–D)
const CTX_EX = {
  A: { nivel: 'estado', local: 'Rede estadual (exemplo)', etapas: { fund2: { on: true, escolas: 420, alunos: 160000 }, medio: { on: true, escolas: 380, alunos: 140000 } }, dominio: 'qualificacao', comps: ['alfabetizacao', 'matematica', 'ciencias'], olhando: 'Professores dedicam muitas horas ao planejamento de aulas e à adaptação de materiais.' },
  B: { nivel: 'estado', local: 'Rede estadual (exemplo)', etapas: { fund2: { on: true, escolas: 600, alunos: 150000, porAno: true, anos: [40000, 38000, 37000, 35000] } }, dominio: 'qualificacao', comps: ['matematica'], olhando: 'Estudantes chegam ao 9º ano com proficiência em matemática abaixo do esperado.' },
  C: { nivel: 'estado', local: 'Rede estadual (exemplo)', etapas: { medio: { on: true, escolas: 300, alunos: 80000 } }, dominio: 'qualificacao', comps: ['outro'], compOutro: 'Permanência e conclusão do ensino médio', olhando: 'Alta taxa de abandono no 1º ano do ensino médio.' },
  D: { nivel: 'municipio', local: 'Secretaria municipal (exemplo)', etapas: { infantil: { on: true, escolas: 120, alunos: 30000 }, fund1: { on: true, escolas: 150, alunos: 45000 } }, dominio: '', comps: [], olhando: 'Servidores das escolas esperam dias por respostas sobre normas e procedimentos.' },
};
const RESP_EX = {
  B: { 'g-equipe': 'parcial', 'g-politica': 'nao', 'g-legislacao': 'sim', 'g-dados': 'parcial', 'g-etica': 'nao', 'g-comite': 'nao', 'g-compras': 'parcial', 'g-orcamento': 'nao', 'g-avaliacao': 'parcial',
    'r-autorizacao': 'sim', 'r-baselegal': 'sim', 'r-acordo': 'parcial', 'r-sucesso': 'sim', 'r-parada': 'parcial', 'r-ativos': 'nao',
    'p-problema': 'sim', 'p-usuarios': 'parcial', 'p-adocao': 'sim', 'p-conect': 'parcial', 'p-disp': 'nao', 'p-desplug': 'nao', 'p-protecao': 'sim', 'p-acessos': 'sim', 'p-incidente': 'parcial', 'p-formacao': 'sim', 'p-apoio': 'parcial', 'p-suporte': 'parcial', 'p-acomp': 'sim',
    'i-evidencia': 'parcial', 'i-contrato': 'parcial', 'i-adocao': 'nao', 'i-infra': 'nao', 'i-integra': 'parcial', 'i-portab': 'nao', 'i-identidade': 'parcial', 'i-formacao': 'parcial', 'i-monitor': 'nao',
    'p-idiomas': 'sim', 'i-supervisao': 'parcial', 'i-contestacao': 'nao', 'i-acessib': 'parcial', 'i-pico': 'sim', 'i-finalidade': 'sim', 'i-dpia': 'parcial', 'i-adversarial': 'parcial', 'i-geracao': 'parcial',
    'i-fornecedor': 'sim', 'i-incidente': 'parcial', 'i-rotatividade': 'nao', 'i-suporte': 'parcial', 'i-gestao': 'sim' },
};

