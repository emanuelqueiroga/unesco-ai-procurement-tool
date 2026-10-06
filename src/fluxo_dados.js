// =====================================================================
// Percurso em três fases: contexto → prova de conceito ou piloto → custo do ciclo de vida
// Camadas do custo total (Krueger e Jackson, 2026, Figura 1, p. 11).
// Todas as perguntas vêm do registro declarativo CAMPOS (renderizado em fluxo.js).
// =====================================================================
const FASES = [
  { id: 'contexto', n: 1, nome: 'Contexto', sub: 'Onde e para quem, problema e impacto, governança de IA na educação',
    abertura: 'Descreva a rede, o problema e a governança que já existe. Nada aqui é avaliado agora: o diagnóstico aparece só no plano de contratação.' },
  { id: 'piloto', n: 2, nome: 'Prova de conceito ou piloto', sub: 'Aplicações, experiência de uso e adoção', info: 'c2',
    abertura: 'Esta fase corresponde à camada 2 do custo total: o que a IA vai fazer (2.1 Aplicações), quem a usa e como (2.2 Experiência de uso) e o que é preciso para que o uso aconteça de fato, incluindo licenças e pagamento (2.3 Adoção).' },
  { id: 'custo', n: 3, nome: 'Custo do ciclo de vida', sub: 'Escala, fonte de recursos e estimativa de custo', info: 'c37',
    abertura: 'Quanto o caso custa depois do teste, ao longo dos anos de uso, distribuído pelas sete camadas do custo total. Os valores são ilustrativos.' },
];
// Passos por fase. O passo '20' (pergunta 2.0) abre a fase 2 e fica sempre visível.
const PASSOS = {
  contexto: [['1a', 'Onde e para quem'], ['1b', 'Problema e impacto'], ['1c', 'Governança de IA na educação']],
  piloto: [['20', 'Prova de conceito ou piloto'], ['2a', 'Aplicações'], ['2b', 'Experiência de uso'], ['2c', 'Adoção']],
  custo: [['3a', 'Escala e horizonte'], ['3b', 'Fonte de recursos'], ['3c', 'Estimativa de custo']],
};
// Número exibido de cada passo, selo de camada e ⓘ
const PASSO_INFO = {
  '1a': { num: '1.1' }, '1b': { num: '1.2' },
  '1c': { num: '1.3', selo: 'Camada 1 do custo total', info: 'c1', abertura: 'A governança é a camada que atravessa todas as fases: quem decide, com que regras e com que recursos. Responda sobre a rede como um todo, e não só sobre este caso.' },
  '20': { num: '2.0' },
  '2a': { num: '2.1', selo: 'Camada 2', info: 'c2', abertura: 'Descreva o que você quer que a IA faça no dia a dia da escola ou da rede, e não o produto.' },
  '2b': { num: '2.2', selo: 'Camada 2', info: 'c2', abertura: 'Como as pessoas vão usar a ferramenta no dia a dia. As respostas vêm sugeridas pelas tarefas do passo 2.1; ajuste o que for diferente na sua rede.' },
  '2c': { num: '2.3', selo: 'Camadas 2, 3 e 4', info: 'c234', abertura: 'O setup da prova de conceito ou do piloto: que tecnologia, como se paga, que licença, quanto adaptar e de que tamanho. Estas respostas definem as premissas de custo.' },
  '3a': { num: '3.1', selo: 'Camadas 3 a 7' },
  '3b': { num: '3.2', selo: 'Camadas 1 e 7' },
  '3c': { num: '3.3', selo: 'Camadas 1 a 7', info: 'c37' },
};
const CAMADAS = [
  [1, 'Governança, políticas e planejamento do ciclo de vida'],
  [2, 'Aplicações de IA, experiência de uso e adoção'],
  [3, 'Infraestrutura e dispositivos'],
  [4, 'Integração de dados e sistemas'],
  [5, 'Cibersegurança, privacidade e conformidade'],
  [6, 'Formação e capacidade das equipes'],
  [7, 'Operação, suporte e sustentabilidade'],
];
// Passos que alimentam cada camada (anel externo da mandala)
const CAMADA_PASSOS = { 1: ['1c'], 2: ['2a', '2b', '2c'], 3: ['2c', '3a'], 4: ['2c', '3a'], 5: ['3c'], 6: ['3c'], 7: ['3b', '3c'] };

// Explicações das camadas (botão ⓘ) e referência comum ao documento de TCO
const CAMADAS_INFO = {
  c1: 'Camada 1 · Governança, políticas e planejamento do ciclo de vida. No quadro de custo total em camadas de Krueger e Jackson (2026, p. 11), esta camada reúne estruturas de governança, política, revisão ética, orientação de compras, rotinas de monitoramento, revisão jurídica e planejamento do ciclo de vida. Os autores observam que a governança passa a fazer parte da estrutura de custo da operação.',
  c2: 'Camada 2 · Aplicações de IA, experiência de uso e adoção. É o que professores, estudantes e gestores veem e usam: as ferramentas e aplicações (o que a IA faz), a experiência de uso (quem usa e como) e a adoção (as condições para o uso acontecer, incluindo assinaturas e licenças). Segundo Krueger e Jackson (2026, p. 11), é a parte mais visível do investimento, mas só uma parte do custo do ciclo de vida.',
  c234: 'As respostas sobre tecnologia, pagamento e licença alimentam a camada 2; as de dispositivos e internet, a camada 3 (infraestrutura e dispositivos); e o nível de adaptação, a camada 4 (integração de dados e sistemas). Krueger e Jackson (2026, p. 7–8) lembram que uma ferramenta gratuita ou doada não elimina os custos do ciclo de vida.',
  c37: 'As sete camadas do quadro de Krueger e Jackson (2026, p. 11): 1 governança; 2 aplicações, experiência de uso e adoção; 3 infraestrutura e dispositivos; 4 integração de dados e sistemas; 5 cibersegurança, privacidade e conformidade; 6 formação e capacidade das equipes; 7 operação, suporte e sustentabilidade. A correspondência entre os componentes de custo da ferramenta (K1 a K6) e as camadas é uma convenção desta ferramenta.',
};
const REF_TCO = {
  autores: 'Krueger, K. e Jackson, F. para CoSN (2026).',
  titulo: 'Beyond the price tag: Rethinking total cost of ownership for AI in education systems.',
  local: 'Paris: UNESCO.',
  texto: 'Krueger, K. e Jackson, F. para CoSN (2026). Beyond the price tag: Rethinking total cost of ownership for AI in education systems. Paris: UNESCO.',
  link: 'Abrir o documento na UNESDOC',
  url: 'https://unesdoc.unesco.org/ark:/48223/pf0000399348',
  nota: 'Documento encomendado pela UNESCO; as opiniões são dos autores.',
};

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

// Governança de IA na educação (passo 1.3, camada 1). Sem etiqueta "essencial" no percurso.
const RESP_G = [['sim', 'Sim'], ['parcial', 'Em parte'], ['nao', 'Não'], ['nao_sei', 'Não sei']];
const QUESTOES_G = [
  { id: 'g-comite', n: '1.3.1', t: 'Sua rede tem uma equipe ou instância responsável por IA na educação, que reúna várias áreas?', h: 'Uma equipe nomeada que decide e acompanha o uso de IA, com tempo dedicado.', ex: 'Exemplo: um comitê com pedagogia, tecnologia, jurídico, compras, proteção de dados e direção, que se reúne todo mês e tem uma pessoa responsável.' },
  { id: 'g-politica', n: '1.3.2', t: 'Você tem uma política ou estratégia de IA na educação?', h: 'Documento aprovado que diz para que a IA pode ser usada, por quem e com que responsabilidades.', ex: 'Exemplo: uma resolução da secretaria que lista os usos permitidos para professores e estudantes e quem responde por eles.' },
  { id: 'g-legislacao', n: '1.3.3', t: 'Você já identificou as leis que se aplicam ao uso de IA nas escolas?', h: 'Proteção de dados, regras sobre IA, direitos de crianças e adolescentes e compras públicas.', ex: 'Exemplo: uma nota da assessoria jurídica que lista as leis aplicáveis e o que cada uma exige.' },
  { id: 'g-dados', n: '1.3.4', t: 'Sua rede tem uma política de dados educacionais?', h: 'Quem pode acessar, compartilhar, guardar e excluir dados de estudantes e servidores.', ex: 'Exemplo: regras escritas que dizem por quanto tempo notas e frequência são guardadas e com quem podem ser compartilhadas.' },
  { id: 'g-etica', n: '1.3.5', t: 'Você já publicou orientações de uso responsável de IA para professores, estudantes e gestores?', h: 'O que é permitido, o que é proibido e o que fazer em caso de dúvida.', ex: 'Exemplo: um guia curto para professores sobre uso de IA em tarefas e avaliações, com regras de integridade acadêmica.' },
  { id: 'g-compras', n: '1.3.6', t: 'Sua rede tem regras ou orientações para comprar tecnologia com IA?', h: 'Custo do ciclo de vida, análise do fornecedor e cláusulas de dados e de saída.', ex: 'Exemplo: um modelo de termo de referência que exige o custo de uso por vários anos e a devolução dos dados ao final do contrato.' },
];

// ---------------------------------------------------------------------
// Registro declarativo de todas as perguntas do percurso.
// { passo, n, id, onde: 'ctx'|'caso'|'resp', tipo, opc, t, h, ex, ph, opcional, padrao, outro }
// tipo: radio | chips | multi (cartões com subtexto) | seg | texto | area | num | grade | etapas | dom | comps | setup
// opc: nome de lista em OPC (framework.js) ou a própria lista.
// padrao: o campo tem valor padrão no caso em branco; só conta depois que a pessoa responde (S.respC).
// outro: { v, id, t } abre um campo de texto quando a opção v está marcada.
// ---------------------------------------------------------------------
const CAMPOS = [
  // 1.1 Onde e para quem
  { passo: '1a', n: '1.1.1', id: 'nivel', onde: 'ctx', tipo: 'radio', opc: NIVEIS_ADM, cols: true, t: 'Em que nível administrativo a decisão será tomada?', h: 'O nível que decide e paga.', ex: 'Exemplo: secretaria estadual de educação.', outro: { v: 'outro', id: 'nivelOutro', t: 'Qual nível?' } },
  { passo: '1a', n: '1.1.2', id: 'local', onde: 'ctx', tipo: 'texto', t: 'Qual é o nome do lugar ou da rede?', ph: 'Ex.: Rede estadual do Rio Grande do Sul, distrito escolar 3' },
  { passo: '1a', n: '1.1.3', id: 'situacao', onde: 'caso', tipo: 'radio', opc: 'situacao', cols: true, padrao: true, t: 'Em que ponto você está?', h: 'Isso ajusta o plano de contratação.' },
  { passo: '1a', n: '1.1.4', id: 'etapas', onde: 'ctx', tipo: 'etapas', t: 'Quais etapas de ensino serão atendidas?', h: 'Marque uma ou mais.' },
  { passo: '1a', n: '1.1.5', id: 'grade', onde: 'ctx', tipo: 'grade', t: 'Quantas escolas e quantos estudantes há em cada etapa, por ano ou série?', h: 'Informe os estudantes de cada ano ou série; o total da etapa é calculado.', ex: 'Exemplo: 6º ano 40.000; 7º ano 38.000.' },
  // 1.2 Problema e impacto
  { passo: '1b', n: '1.2.1', id: 'dominio', onde: 'ctx', tipo: 'dom', t: 'Que tipo de problema educacional você quer resolver?' },
  { passo: '1b', n: '1.2.2', id: 'comps', onde: 'ctx', tipo: 'comps', t: 'Quais componentes estão em jogo?' },
  { passo: '1b', n: '1.2.3', id: 'olhando', onde: 'ctx', tipo: 'texto', t: 'Como a equipe descreve o problema, em poucas palavras?', h: 'Vira o título do caso se você não der outro nome.', ph: 'Ex.: estudantes chegam ao 9º ano abaixo do esperado em matemática' },
  { passo: '1b', n: '1.2.4', id: 'problema', onde: 'caso', tipo: 'area', rows: 4, t: 'Descreva a situação atual sem citar tecnologia', h: 'Situação atual, quem é afetado e o que se sabe sobre as causas. Se, ao retirar a palavra "IA", o texto deixa de explicar o problema, reescreva.', ex: 'Exemplo: nas escolas da zona rural, metade dos estudantes do 5º ano não lê com fluência; as turmas são multisseriadas e não há reforço no contraturno.' },
  { passo: '1b', n: '1.2.5', id: 'impactos', onde: 'caso', tipo: 'chips', opc: 'impactos', t: 'Que impacto você quer alcançar?', h: 'Marque um ou mais. O impacto orienta as tarefas sugeridas no passo 2.1.', outro: { v: 'outro', id: 'impactoOutro', t: 'Qual impacto?' } },
  { passo: '1b', n: '1.2.6', id: 'resultado', onde: 'caso', tipo: 'area', rows: 2, opcional: true, t: 'Se quiser, detalhe o resultado esperado e como vai medi-lo', ex: 'Exemplo: reduzir de 50% para 35% os estudantes abaixo do nível adequado em leitura em dois anos.' },
  { passo: '1b', n: '1.2.7', id: 'linhaBase', onde: 'caso', tipo: 'radio', opc: 'linhaBase', padrao: true, t: 'Você tem uma medida atual do problema (linha de base)?', ex: 'Exemplo: resultados da avaliação de leitura do ano passado, por escola.' },
  { passo: '1b', n: '1.2.8', id: 'alternativa', onde: 'caso', tipo: 'radio', opc: 'simNao', t: 'Você já comparou ao menos uma alternativa sem IA?', ex: 'Exemplo: reforço escolar no contraturno, redesenho do processo ou um software convencional de exercícios.' },
  // 1.3 Governança (camada 1)
  ...QUESTOES_G.map(q => ({ passo: '1c', n: q.n, id: q.id, onde: 'resp', tipo: 'seg', opc: RESP_G, t: q.t, h: q.h, ex: q.ex })),
  // 2.0 Prova de conceito ou piloto
  { passo: '20', n: '2.0', id: 'teste', onde: 'caso', tipo: 'radio', opc: 'teste', cols: true, t: 'Você vai começar por uma prova de conceito ou por um piloto?', h: 'As duas servem para aprender antes de comprar. A diferença é com quem e em que condições se testa.' },
  // 2.1 Aplicações
  { passo: '2a', n: '2.1.1', id: 'tarefas', onde: 'caso', tipo: 'multi', opc: 'tarefas', t: 'O que você quer que a IA faça?', h: 'Escolha uma ou mais tarefas. Cada tarefa já sugere quem usa e quem é afetado no passo 2.2.', outro: { v: 'outra', id: 'tarefaOutra', t: 'Qual tarefa?' } },
  { passo: '2a', n: '2.1.2', id: 'titulo', onde: 'caso', tipo: 'texto', opcional: true, t: 'Como você vai chamar esta aplicação?', h: 'Aparece no plano de contratação.' },
  // 2.2 Experiência de uso
  { passo: '2b', n: '2.2.1', id: 'usuarios', onde: 'caso', tipo: 'chips', opc: 'usuarios', sugere: true, t: 'Quem vai usar a ferramenta?', ex: 'Exemplo: professores do 6º ao 9º ano.' },
  { passo: '2b', n: '2.2.2', id: 'afetados', onde: 'caso', tipo: 'chips', opc: 'afetados', sugere: true, t: 'Quem recebe ou é afetado pelo que a ferramenta produz?', ex: 'Exemplo: os estudantes que recebem as atividades preparadas pelo professor.' },
  { passo: '2b', n: '2.2.3', id: 'consequencias', onde: 'caso', tipo: 'chips', opc: 'consequencias', sugere: true, padrao: true, t: 'O que as pessoas vão fazer com a resposta da ferramenta?', ex: 'Exemplo: o professor revisa o plano de aula e decide o que usar.' },
  { passo: '2b', n: '2.2.4', id: 'frequencia', onde: 'caso', tipo: 'radio', opc: 'frequencia', cols: true, sugere: true, padrao: true, t: 'Com que frequência cada pessoa vai usar?' },
  // 2.3 Adoção
  { passo: '2c', n: '2.3.1', id: 'tipoTec', onde: 'caso', tipo: 'radio', opc: 'tipoTec', cols: true, t: 'Que tipo de tecnologia você pretende usar?', ex: 'Exemplo: uma plataforma do ministério (pública), um modelo aberto instalado numa nuvem contratada (aberta), a assinatura de um assistente para professores (paga).' },
  { passo: '2c', n: '2.3.2', id: 'pagamento', onde: 'caso', tipo: 'radio', opc: 'pagamento', cols: true, t: 'Como vai ser o pagamento?', h: 'Pense no período da prova de conceito ou do piloto.', ex: 'Exemplo: um valor por professor por mês (por usuário); um valor anual fixo para todas as escolas (institucional).' },
  { passo: '2c', n: '2.3.3', id: 'licenca', onde: 'caso', tipo: 'radio', opc: 'licenca', cols: true, t: 'Que tipo de licença?', ex: 'Exemplo: os termos aceitos ao criar uma conta gratuita são termos de uso padrão.' },
  { passo: '2c', n: '2.3.4', id: 'adaptacao', onde: 'caso', tipo: 'radio', opc: 'adaptacao', cols: true, t: 'Quanto a ferramenta precisa ser adaptada ao seu contexto?', h: 'Cada nível inclui os anteriores. Mais adaptação aumenta o custo de implantação e de manutenção.', ex: 'Exemplo: traduzir para a língua local e alinhar as atividades ao currículo é adaptação de conteúdo e idioma.' },
  { passo: '2c', n: '2.3.5', id: 'infra', onde: 'caso', tipo: 'radio', opc: 'infra', cols: true, t: 'As escolas da prova de conceito ou do piloto já têm os dispositivos e a internet que o uso exige?', ex: 'Exemplo: um computador ou tablet por estudante durante a aula e internet que aguente uma turma inteira conectada.' },
  { passo: '2c', n: '2.3.6', id: 'piloto', onde: 'caso', tipo: 'setup',
    t: 'De que tamanho e por quanto tempo será o piloto?', h: 'Participantes são as pessoas que usam a ferramenta.', ex: 'Exemplo: 20 escolas, 600 professores, 4 meses.',
    tPoc: 'Quantas pessoas vão testar e por quanto tempo?', hPoc: 'Na prova de conceito testam a equipe e algumas pessoas convidadas, sem usuários reais.', exPoc: 'Exemplo: 15 pessoas, 2 meses.' },
  // 3.1 Escala e horizonte
  { passo: '3a', n: '3.1.1', id: 'elegiveis', onde: 'caso', tipo: 'num', t: 'Se der certo, quantas pessoas usariam a ferramenta em toda a rede?', h: 'Base da estimativa de custo depois do teste.', ex: 'Exemplo: 12.000 professores ou 150.000 estudantes.' },
  { passo: '3a', n: '3.1.2', id: 'expansao', onde: 'caso', tipo: 'radio', opc: 'expansao', cols: true, padrao: true, t: 'Em quanto tempo você pretende chegar a todas essas pessoas?' },
  { passo: '3a', n: '3.1.3', id: 'horizonte', onde: 'caso', tipo: 'radio', opc: 'horizonte', cols: true, padrao: true, t: 'Por quantos anos de uso você quer estimar o custo?', h: 'Além do Ano 0, que é o da prova de conceito ou do piloto.' },
  // 3.2 Fonte de recursos
  { passo: '3b', n: '3.2.1', id: 'pagaDepois', onde: 'caso', tipo: 'radio', opc: 'pagaDepois', cols: true, t: 'Quem vai pagar a tecnologia depois da prova de conceito ou do piloto?', ex: 'Exemplo: a própria secretaria, com recursos do tesouro estadual.' },
  { passo: '3b', n: '3.2.2', id: 'fonte', onde: 'caso', tipo: 'radio', opc: 'fonte', cols: true, t: 'Você já tem fonte de recursos para manter a ferramenta nos próximos anos?', ex: 'Exemplo: uma linha no orçamento plurianual para tecnologia educacional.' },
];
