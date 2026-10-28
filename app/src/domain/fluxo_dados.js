// =====================================================================
// Percurso em quatro fases (v11): contexto → prova de conceito ou piloto → implantação → expansão
// Camadas do custo total (Krueger e Jackson, 2026, Figura 1, p. 11).
// Todas as perguntas vêm do registro declarativo CAMPOS (renderizado em fluxo.js).
// =====================================================================
const FASES = [
  { id: 'contexto', n: 1, nome: 'Contexto', sub: 'Onde e para quem, prioridade e impacto, governança de IA na educação',
    abertura: 'Descreva a rede, o problema e a governança que já existe. Nada aqui é avaliado agora: o diagnóstico aparece só no plano de contratação.' },
  { id: 'piloto', n: 2, nome: 'Prova de conceito ou piloto', sub: 'Aplicações, experiência de uso, adoção, infraestrutura, formação e suporte', info: 'c2',
    abertura: 'O teste antes da compra e tudo o que ele exige: o que a IA vai fazer (2.1), quem a usa e como (2.2), que ferramentas e como se pagam (2.3), internet e dispositivos (2.4), formação das equipes (2.5) e suporte (2.6). Cada passo corresponde a uma camada do custo total.' },
  { id: 'implantacao', n: 3, nome: 'Implantação', sub: 'Primeira etapa da implantação, arquitetura e integração', info: 'c45',
    abertura: 'Depois do teste, a primeira etapa de uso real: quantas escolas e pessoas começam e como a ferramenta se liga aos sistemas da rede.' },
  { id: 'expansao', n: 4, nome: 'Expansão', sub: 'Escala e horizonte, estimativa de custo e recomendações', info: 'c37',
    abertura: 'Até onde o uso pode chegar, quanto o caso custa ao longo dos anos, distribuído pelas sete camadas do custo total, e o que fazer a seguir. Os valores são ilustrativos.' },
];
// Passos por fase. O passo '20' (pergunta 2.0) abre a fase 2 e fica sempre visível.
const PASSOS = {
  contexto: [['1a', 'Onde e para quem'], ['1b', 'Prioridade e impacto'], ['1c', 'Governança de IA na educação']],
  piloto: [['20', 'Prova de conceito ou piloto'], ['2a', 'Aplicações'], ['2b', 'Experiência de uso'], ['2c', 'Adoção'],
    ['2d', 'Infraestrutura e dispositivos'], ['2e', 'Formação e capacidade das equipes'], ['2f', 'Operação e suporte']],
  implantacao: [['3a', 'Primeira etapa da implantação'], ['3b', 'Arquitetura e integração']],
  expansao: [['4a', 'Escala e horizonte'], ['4b', 'Estimativa de custo'], ['4c', 'Recomendações para você']],
};
// Número exibido de cada passo, selo de camada e ⓘ
const PASSO_INFO = {
  '1a': { num: '1.1' }, '1b': { num: '1.2' },
  '1c': { num: '1.3', selo: 'Camada 1 do custo total', info: 'c1', abertura: 'A governança é a camada que atravessa todas as fases: quem decide, com que regras e com que recursos. Responda sobre a rede como um todo, e não só sobre este caso.' },
  '20': { num: '2.0' },
  '2a': { num: '2.1', selo: 'Camada 2', info: 'c2', abertura: 'Descreva o que você quer que a IA faça no dia a dia da escola ou da rede, e não o produto.' },
  '2b': { num: '2.2', selo: 'Camadas 2 e 5', info: 'c2', abertura: 'Como as pessoas vão usar a ferramenta no dia a dia. As respostas vêm sugeridas pelas tarefas do passo 2.1; ajuste o que for diferente na sua rede.' },
  '2c': { num: '2.3', selo: 'Camadas 2 e 4', info: 'c24', abertura: 'Que ferramentas você vai usar, como se pagam, que licença têm, quanto adaptar e de que tamanho será o teste. Estas respostas definem as premissas de custo.' },
  '2d': { num: '2.4', selo: 'Camada 3', info: 'c3', abertura: 'Internet e dispositivos são perguntas separadas: uma escola pode ter boa conexão e faltar equipamento, ou o contrário.' },
  '2e': { num: '2.5', selo: 'Camada 6', info: 'c6', abertura: 'Quem precisa aprender a usar a ferramenta, que tipo de formação, em que formato, por quantas horas e quem paga.' },
  '2f': { num: '2.6', selo: 'Camada 7', info: 'c7', abertura: 'Quem atende as dúvidas e os problemas das escolas e com que intensidade a rede acompanha o uso.' },
  '3a': { num: '3.1', selo: 'Camadas 2, 3 e 6', abertura: 'A implantação costuma começar por uma parte da rede. Diga quantas escolas e quantas pessoas entram na primeira etapa, logo depois do teste.' },
  '3b': { num: '3.2', selo: 'Camadas 4 e 5', info: 'c45', abertura: 'Arquitetura é a forma como a ferramenta funciona por dentro e se liga aos sistemas da rede. Há três arranjos comuns: um produto pronto que a rede assina; uma aplicação, própria ou contratada, que usa pela internet um modelo de IA de uma empresa (API); ou um modelo aberto instalado numa nuvem contratada pela rede. O arranjo muda o custo de integração, de segurança e de saída do contrato. Se não souber, a ferramenta usa a arquitetura presumida a partir das respostas do passo 2.3.' },
  '4a': { num: '4.1' },
  '4b': { num: '4.2', selo: 'Camadas 1 a 7', info: 'c37' },
  '4c': { num: '4.3' },
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
const CAMADA_PASSOS = { 1: ['1c'], 2: ['2a', '2b', '2c'], 3: ['2d'], 4: ['2c', '3b'], 5: ['2b', '3b'], 6: ['2e'], 7: ['2f'] };

// Explicações das camadas (botão ⓘ) e referência comum ao documento de TCO
const CAMADAS_INFO = {
  c1: 'Camada 1 · Governança, políticas e planejamento do ciclo de vida. No quadro de custo total em camadas de Krueger e Jackson (2026, p. 11), esta camada reúne estruturas de governança, política, revisão ética, orientação de compras, rotinas de monitoramento, revisão jurídica e planejamento do ciclo de vida. Os autores observam que a governança passa a fazer parte da estrutura de custo da operação.',
  c2: 'Camada 2 · Aplicações de IA, experiência de uso e adoção. É o que professores, estudantes e gestores veem e usam: as ferramentas e aplicações (o que a IA faz), a experiência de uso (quem usa e como) e a adoção (as condições para o uso acontecer, incluindo assinaturas e licenças). Segundo Krueger e Jackson (2026, p. 11), é a parte mais visível do investimento, mas só uma parte do custo do ciclo de vida.',
  c24: 'As respostas sobre ferramentas, tecnologia, pagamento e licença alimentam a camada 2 (aplicações, experiência de uso e adoção); o nível de adaptação alimenta a camada 4 (integração de dados e sistemas). Krueger e Jackson (2026, p. 7–8) lembram que uma ferramenta gratuita ou doada não elimina os custos do ciclo de vida.',
  c3: 'Camada 3 · Infraestrutura e dispositivos. No quadro de Krueger e Jackson (2026, p. 11), a IA aumenta a demanda por infraestrutura e conexão, à medida que crescem a nuvem, o uso de dispositivos e os serviços de ensino com IA, e acelera pressões que já existiam sobre a capacidade dos dispositivos.',
  c6: 'Camada 6 · Formação e capacidade das equipes. Krueger e Jackson (2026, p. 11) apontam a preparação das equipes como um dos fatores que mais pesam no custo total e uma das maiores barreiras para sustentar a IA: a primeira formação dá lugar a demandas contínuas de acompanhamento, de formação em governança, de suporte técnico e de formação por função.',
  c7: 'Camada 7 · Operação, suporte e sustentabilidade. Segundo Krueger e Jackson (2026, p. 11), exige suporte técnico contínuo, monitoramento, gestão de fornecedores, manutenção, supervisão operacional, avaliação e planejamento da sustentabilidade, durante todo o ciclo de vida.',
  c45: 'Camadas 4 e 5 · Integração de dados e sistemas; cibersegurança, privacidade e conformidade. No quadro de Krueger e Jackson (2026, p. 11), a IA depende de interoperabilidade, cadastro de turmas, sistemas de identidade e sistemas de gestão escolar, e amplia a importância da gestão de identidades, da proteção da privacidade e da gestão de riscos de terceiros. A arquitetura escolhida define boa parte desses custos.',
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
// Figura 1 (p. 11) de Krueger e Jackson (2026), mostrada sem alteração no ⓘ das camadas.
// FIG_TCO (data URI da imagem) é injetado pelo build.sh a partir de assets/fig1_tco.jpg.
const FIG_INFO = {
  botao: 'Ver a figura das sete camadas',
  fechar: 'Fechar a figura',
  alt: 'Figura 1 de Krueger e Jackson (2026), em inglês: as sete camadas do custo total da IA na educação. 1 Governança, políticas e planejamento do ciclo de vida; 2 Aplicações de IA, experiência de uso e adoção; 3 Infraestrutura e dispositivos; 4 Integração de dados e sistemas; 5 Cibersegurança, privacidade e conformidade; 6 Formação e capacidade das equipes; 7 Operação, suporte e sustentabilidade. Mensagem principal: a implantação da IA cria custos em sete camadas interligadas, da governança e da adoção à operação e à sustentabilidade de longo prazo.',
  legenda: 'Figura 1 de Krueger, K. e Jackson, F. para CoSN (2026), Beyond the price tag, p. 11. © UNESCO 2026, licença CC BY-SA 3.0 IGO; reproduzida sem alterações.',
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
// v13: os três domínios da v12 (DOMINIOS) deram lugar às quatro prioridades de src/prioridades.js (PRIORIDADES).

// Governança de IA na educação (passo 1.3, camada 1). Sem etiqueta "essencial" no percurso.
const RESP_G = [['sim', 'Sim'], ['parcial', 'Em parte'], ['nao', 'Não'], ['nao_sei', 'Não sei']];
const QUESTOES_G = [
  { id: 'g-comite', detalhe: 'Qual equipe ou instância? Quem participa?', n: '1.3.1', t: 'Sua rede tem uma equipe ou instância responsável por IA na educação, que reúna várias áreas?', h: 'Uma equipe nomeada que decide e acompanha o uso de IA, com tempo dedicado.', ex: 'Exemplo: um comitê com pedagogia, tecnologia, jurídico, compras, proteção de dados e direção, que se reúne todo mês e tem uma pessoa responsável.' },
  { id: 'g-politica', detalhe: 'Qual documento? (nome, data ou link)', n: '1.3.2', t: 'Você tem uma política ou estratégia de IA na educação?', h: 'Documento aprovado que diz para que a IA pode ser usada, por quem e com que responsabilidades.', ex: 'Exemplo: uma resolução da secretaria que lista os usos permitidos para professores e estudantes e quem responde por eles.' },
  // v11 (ajuste 1): "leis" → "regulamentação"
  { id: 'g-legislacao', detalhe: 'Quais normas já foram identificadas?', n: '1.3.3', t: 'Você já identificou a regulamentação que se aplica ao uso de IA nas escolas?', h: 'Proteção de dados, regras sobre IA, direitos de crianças e adolescentes e compras públicas.', ex: 'Exemplo: uma nota da assessoria jurídica que lista as normas aplicáveis e o que cada uma exige.' },
  { id: 'g-dados', detalhe: 'Qual política ou norma de dados?', n: '1.3.4', t: 'Sua rede tem uma política de dados educacionais?', h: 'Quem pode acessar, compartilhar, guardar e excluir dados de estudantes e servidores.', ex: 'Exemplo: regras escritas que dizem por quanto tempo notas e frequência são guardadas e com quem podem ser compartilhadas.' },
  { id: 'g-etica', detalhe: 'Quais orientações? Para quem?', n: '1.3.5', t: 'Você já publicou orientações de uso responsável de IA para professores, estudantes e gestores?', h: 'O que é permitido, o que é proibido e o que fazer em caso de dúvida.', ex: 'Exemplo: um guia curto para professores sobre uso de IA em tarefas e avaliações, com regras de integridade acadêmica.' },
  // v11 (ajuste 3): "para a contratação de IA"
  { id: 'g-compras', detalhe: 'Quais regras ou modelos?', n: '1.3.6', t: 'Sua rede tem regras ou orientações para a contratação de IA?', h: 'Custo do ciclo de vida, análise do fornecedor e cláusulas de dados e de saída.', ex: 'Exemplo: um modelo de termo de referência que exige o custo de uso por vários anos e a devolução dos dados ao final do contrato.' },
];

// ---------------------------------------------------------------------
// R8 (REC-52): opções das perguntas novas do Refinar (seção 7 de design/redesign/05-requisitos-recomendacoes.md). Os ids são os
// que as regras de src/domain/regras/ e o motor leem (publico: /defici/, /lingu|idioma/, /rural|remot/; apoioEscola: vazio ou
// começando por ninguem|nenhum|nao = sem referência; verificacao: sim|parcial|nao; dotacao e contestacaoExiste: ver as regras).
// ---------------------------------------------------------------------
const OPC_PUBLICO = [
  ['rural', 'Escolas rurais ou remotas'], ['tradicionais', 'Comunidades tradicionais (indígenas, quilombolas)'],
  ['deficiencia', 'Estudantes com deficiência'], ['lingua', 'Outra língua em casa'], ['acolhimento', 'Crianças em acolhimento'],
  ['nenhum', 'Nenhum destes'], ['nao_sei', 'Não sei'],
];
const OPC_CONTESTACAO_EXISTE = [
  ['efetiva', 'Existe caminho efetivo, com prazo e autoridade para rever'], ['formal', 'Existe apenas formalmente'], ['nao', 'Não existe'], ['nao_sei', 'Não sei'],
];
const OPC_TREINO = [['sim', 'Sim, os termos permitem'], ['nao', 'Não, o contrato ou a conta institucional proíbe'], ['nao_sei', 'Não sei']];
const OPC_VERIFICACAO = [['sim', 'Sim, os dois'], ['parcial', 'Em parte'], ['nao', 'Não']];
const OPC_INSTRUMENTO_TESTE = [
  ['contratado', 'Contratado à parte, com preço próprio'], ['gratuito', 'Gratuito, por doação ou cooperação do fornecedor'],
  ['fase_contrato', 'Como fase do contrato principal'], ['parceria', 'Parceria de pesquisa com universidade ou instituto'], ['nao_sei', 'Não sei'],
];
const OPC_ESTRATEGIA_COMPRA = [
  ['licitacao', 'Licitação de produto pronto'], ['licitacao_demo', 'Licitação com etapa de demonstração'],
  ['dialogo', 'Diálogo com o mercado ou instrumento de inovação'], ['ata', 'Ata de preços, acordo-quadro ou compra conjunta'],
  ['direta', 'Contratação direta'], ['nao_sei', 'Não sei'],
];
const OPC_DOTACAO = [['sim', 'Sim, prevista'], ['parcial', 'Em parte'], ['nao', 'Não prevista'], ['nao_sei', 'Não sei']];
const OPC_TEMPO_JORNADA = [['sim', 'Sim, dentro da jornada'], ['parcial', 'Em parte'], ['nao', 'Não, fora do horário pago']];
const OPC_MOMENTO_USO = [
  ['aula', 'Na aula regular, dentro da grade'], ['contraturno', 'No contraturno'], ['casa', 'Em casa'], ['planejamento', 'No tempo de planejamento do professor'],
];
const OPC_APOIO_ESCOLA = [
  ['coordenacao', 'Coordenação pedagógica'], ['formador', 'Formador da secretaria'], ['referencia', 'Professor de referência'],
  ['ninguem', 'Ninguém definido'], ['nao_sei', 'Não sei'],
];
// volumeResultado.unidade: as que o cálculo do custo por unidade de resultado entende (rec_numeros.js)
const OPC_UNIDADE_RESULTADO = [['solicitacoes', 'Solicitações respondidas'], ['estudantes', 'Estudantes atendidos']];
const OPC_PERIODO_RESULTADO = [['mes', 'Por mês'], ['ano', 'Por ano']];

// ---------------------------------------------------------------------
// Registro declarativo de todas as perguntas do percurso.
// { passo, n, id, onde: 'ctx'|'caso'|'resp', tipo, opc, t, h, ex, ph, opcional, padrao, outro, se }
// tipo: radio | chips | multi (cartões com subtexto) | seg | texto | area | num | grade | etapas
//       | prior (1.2.1, cartões de prioridade, várias) | problemas (1.2.2, problemas por prioridade, subcategorias e "Outro")
//       | testes (2.0, múltipla com opção exclusiva) | ferramentas (lista 2.3.3) | setup (tamanho do teste)
//       | implant (3.1.1) | horas (2.5.4, com "Usar uma estimativa") | arq (3.2.1)
// opc: nome de lista em OPC (framework.js) ou a própria lista.
// padrao: o campo tem valor padrão no caso em branco; só conta depois que a pessoa responde (S.respC).
//   (fluxo.js também marca padrao nos campos cujo valor em CASO_VAZIO não é vazio.)
// outro: { v, id, t } abre um campo de texto quando a opção v está marcada.
// sugDe: id da pergunta de origem; ao ser marcada, ela gera um valor sugerido para este campo (fluxo.js, padroesGerados).
// se: c => bool; a pergunta só aparece (e só conta) quando a condição vale.
// detalhe (v13): campo de detalhe quando a resposta é "Sim" ou "Em parte" (1.2.7 e 1.3.x; opcional, nunca bloqueia o passo).
//   1.3.x: { qual, falta } → S.respDet[id].qual|falta; 1.2.7: { v, problemas, medida, exMedida } → caso.linhaBaseProblemas,
//   caso.linhaBaseProblemaTxt e caso.linhaBaseMedida.
// sugDe 'problemas' (v13): sugestão que nasce dos problemas marcados no 1.2 (sugestoesProblemas, prioridades.js).
// ---------------------------------------------------------------------
const CAMPOS = [
  // 1.1 Onde e para quem
  { passo: '1a', n: '1.1.1', id: 'nivel', onde: 'ctx', tipo: 'radio', opc: NIVEIS_ADM, cols: true, t: 'Em que nível administrativo a decisão será tomada?', h: 'O nível que decide e paga.', ex: 'Exemplo: secretaria estadual de educação.', outro: { v: 'outro', id: 'nivelOutro', t: 'Qual nível?' } },
  { passo: '1a', n: '1.1.2', id: 'local', onde: 'ctx', tipo: 'texto', t: 'Qual é o nome do lugar ou da rede?', ph: 'Ex.: Rede estadual do Rio Grande do Sul, distrito escolar 3' },
  { passo: '1a', n: '1.1.3', id: 'situacao', onde: 'caso', tipo: 'radio', opc: 'situacao', cols: true, padrao: true, t: 'Em que ponto você está?', h: 'Isso ajusta o plano de contratação.' },
  { passo: '1a', n: '1.1.4', id: 'etapas', onde: 'ctx', tipo: 'etapas', t: 'Quais etapas de ensino serão atendidas?', h: 'Marque uma ou mais.' },
  { passo: '1a', n: '1.1.5', id: 'grade', onde: 'ctx', tipo: 'grade', t: 'Quantas escolas e quantos estudantes há em cada etapa, por ano ou série?', h: 'Informe os estudantes de cada ano ou série; o total da etapa é calculado.', ex: 'Exemplo: 6º ano 40.000; 7º ano 38.000.' },
  { passo: '1a', n: '1.1.6', id: 'publico', onde: 'caso', tipo: 'chips', opc: OPC_PUBLICO, opcional: true, t: 'O público atendido inclui algum destes grupos?', h: 'Marque todos os que valem para a rede. Eles pedem acessibilidade, línguas e conexão adequadas e entram na análise de equidade. "Nenhum destes" e "Não sei" não se combinam com os outros.', ex: 'Exemplo: escolas rurais com internet instável e estudantes com deficiência visual.' },
  // 1.2 Prioridade e impacto (v13: prioridades e problemas no lugar de domínio e componentes)
  { passo: '1b', n: '1.2.1', id: 'prioridades', onde: 'ctx', tipo: 'prior', t: 'Qual é a prioridade da sua rede para a IA na educação?', h: 'Marque uma ou mais.' },
  { passo: '1b', n: '1.2.2', id: 'problemas', onde: 'ctx', tipo: 'problemas', t: 'Quais problemas você quer resolver?', h: 'Marque um ou mais, ou todos de uma prioridade. Os objetivos já vêm escritos; você completa os números da sua rede.' },
  { passo: '1b', n: '1.2.3', id: 'olhando', onde: 'ctx', tipo: 'texto', sugDe: 'problemas', t: 'Como a equipe descreve o problema, em poucas palavras?', h: 'Vira o título do caso se você não der outro nome.', ph: 'Ex.: estudantes chegam ao 9º ano abaixo do esperado em matemática' },
  { passo: '1b', n: '1.2.4', id: 'problema', onde: 'caso', tipo: 'area', rows: 4, sugDe: 'problemas', t: 'Descreva a situação atual sem citar tecnologia', h: 'Situação atual, quem é afetado e o que se sabe sobre as causas. Se, ao retirar a palavra "IA", o texto deixa de explicar o problema, reescreva.', ex: 'Exemplo: nas escolas da zona rural, metade dos estudantes do 5º ano não lê com fluência; as turmas são multisseriadas e não há reforço no contraturno.' },
  { passo: '1b', n: '1.2.5', id: 'impactos', onde: 'caso', tipo: 'chips', opc: 'impactos', sugDe: 'problemas', t: 'Que impacto você quer alcançar?', h: 'Marque um ou mais. O impacto orienta as tarefas sugeridas no passo 2.1.', outro: { v: 'outro', id: 'impactoOutro', t: 'Qual impacto?' } },
  { passo: '1b', n: '1.2.6', id: 'resultado', onde: 'caso', tipo: 'area', rows: 3, opcional: true, sugDe: 'problemas', t: 'Se quiser, detalhe o resultado esperado e como vai medi-lo', ex: 'Exemplo: reduzir de 50% para 35% os estudantes abaixo do nível adequado em leitura em dois anos.' },
  { passo: '1b', n: '1.2.7', id: 'linhaBase', onde: 'caso', tipo: 'radio', opc: 'linhaBase', padrao: true,
    detalhe: { v: ['sim', 'parcial'], problemas: 'Para quais problemas?', medida: 'Qual medida?', exMedida: 'Ex.: avaliação estadual de leitura do 5º ano, 2025' }, t: 'Você tem uma medida atual do problema (linha de base)?', ex: 'Exemplo: resultados da avaliação de leitura do ano passado, por escola.' },
  { passo: '1b', n: '1.2.8', id: 'alternativa', onde: 'caso', tipo: 'radio', opc: 'simNao', t: 'Você já comparou ao menos uma alternativa sem IA?', ex: 'Exemplo: reforço escolar no contraturno, redesenho do processo ou um software convencional de exercícios.' },
  { passo: '1b', n: '1.2.9', id: 'altCustoEfeito', onde: 'caso', tipo: 'faixa', opcional: true, t: 'Quanto custa e que efeito tem a alternativa sem IA que você comparou?', h: 'Dê uma faixa: mínimo, mais provável e máximo. O custo é por pessoa por ano e o efeito é o ganho médio de aprendizagem, em desvios-padrão da avaliação. Sem isso, o plano mostra só a fórmula.', ex: 'Exemplo: reforço no contraturno, US$ 40 por estudante por ano, com efeito esperado de 0,10 desvio-padrão.' },
  { passo: '1b', n: '1.2.10', id: 'volumeResultado', onde: 'caso', tipo: 'volume', opcional: true, t: 'Qual resultado a ferramenta entrega, e em que volume?', h: 'Escolha a unidade e informe o volume esperado, por mês ou por ano. Com isso o plano calcula o custo por unidade de resultado.', ex: 'Exemplo: 3.000 solicitações por mês.' },
  // 1.3 Governança (camada 1)
  ...QUESTOES_G.map(q => ({ passo: '1c', n: q.n, id: q.id, onde: 'resp', tipo: 'seg', opc: RESP_G, t: q.t, h: q.h, ex: q.ex, detalhe: { qual: q.detalhe, falta: 'O que falta?' } })),
  // 2.0 Prova de conceito ou piloto (múltipla: as duas podem ser marcadas; "Não sei, recomende para mim" é exclusiva)
  { passo: '20', n: '2.0', id: 'testes', onde: 'caso', tipo: 'testes', opc: 'teste', cols: true, t: 'Você vai começar por uma prova de conceito, por um piloto ou pelos dois?', h: 'As duas servem para aprender antes de comprar. A diferença é com quem e em que condições se testa. Você pode marcar as duas: primeiro a prova de conceito, depois o piloto.' },
  { passo: '20', n: '2.0.1', id: 'instrumentoTeste', onde: 'caso', tipo: 'radio', opc: OPC_INSTRUMENTO_TESTE, cols: true, opcional: true, t: 'Como o teste será contratado ou viabilizado?', h: 'O instrumento define se o teste cria direito de continuar com o fornecedor. Sem resposta, a ferramenta o deduz das respostas sobre teste, pagamento e situação.', ex: 'Exemplo: um contrato pequeno e separado, sem direito de continuar.' },
  // 2.1 Aplicações
  { passo: '2a', n: '2.1.1', id: 'tarefas', onde: 'caso', tipo: 'multi', opc: 'tarefas', sugDe: 'problemas', t: 'O que você quer que a IA faça?', h: 'Escolha uma ou mais tarefas. Cada tarefa já sugere quem usa e quem é afetado no passo 2.2.', outro: { v: 'outra', id: 'tarefaOutra', t: 'Qual tarefa?' } },
  { passo: '2a', n: '2.1.2', id: 'titulo', onde: 'caso', tipo: 'texto', opcional: true, t: 'Como você vai chamar esta aplicação?', h: 'Aparece no plano de contratação.' },
  // 2.2 Experiência de uso
  { passo: '2b', n: '2.2.1', id: 'usuarios', onde: 'caso', tipo: 'chips', opc: 'usuarios', sugere: true, t: 'Quem vai usar a ferramenta?', ex: 'Exemplo: professores do 6º ao 9º ano.' },
  { passo: '2b', n: '2.2.2', id: 'afetados', onde: 'caso', tipo: 'chips', opc: 'afetados', sugere: true, t: 'Quem recebe ou é afetado pelo que a ferramenta produz?', ex: 'Exemplo: os estudantes que recebem as atividades preparadas pelo professor.' },
  { passo: '2b', n: '2.2.3', id: 'consequencias', onde: 'caso', tipo: 'chips', opc: 'consequencias', sugere: true, padrao: true, t: 'O que as pessoas vão fazer com a resposta da ferramenta?', ex: 'Exemplo: o professor revisa o plano de aula e decide o que usar.' },
  { passo: '2b', n: '2.2.4', id: 'frequencia', onde: 'caso', tipo: 'radio', opc: 'frequencia', cols: true, sugere: true, padrao: true, t: 'Com que frequência cada pessoa vai usar?' },
  { passo: '2b', n: '2.2.5', id: 'contestacaoExiste', onde: 'caso', tipo: 'radio', opc: OPC_CONTESTACAO_EXISTE, cols: true, opcional: true, t: 'Existe um caminho para contestar o que a ferramenta produz e rever a decisão?', h: 'Contestar é pedir a revisão a uma pessoa com prazo e autoridade para mudar o resultado. Sem resposta, a ferramenta presume que o caminho existe só no papel e diz isso no plano.', ex: 'Exemplo: a família pede revisão à direção da escola, que responde em até 10 dias e pode mudar o resultado.' },
  { passo: '2b', n: '2.2.6', id: 'momentoUso', onde: 'caso', tipo: 'radio', opc: OPC_MOMENTO_USO, cols: true, opcional: true, t: 'Em que momento a ferramenta será usada?', h: 'O momento diz de onde sai o tempo de uso: da grade, do contraturno, de casa ou do planejamento do professor. Sem resposta, o plano pede para decidir.', ex: 'Exemplo: duas sessões de 30 minutos por semana, na aula de matemática.' },
  // 2.3 Adoção (ferramentas; as perguntas 2.3.4 a 2.3.7 valem para a ferramenta principal, a primeira da lista)
  { passo: '2c', n: '2.3.1', id: 'nFerramentas', onde: 'caso', tipo: 'radio', opc: 'nFerramentas', cols: true, sugDe: 'testes', t: 'Quantas ferramentas você pretende usar?', h: 'Conte as ferramentas de IA que as pessoas vão usar neste caso.', ex: 'Exemplo: um assistente para planejar aulas e outra ferramenta para corrigir redações são duas ferramentas.' },
  { passo: '2c', n: '2.3.2', id: 'conheceFerramentas', onde: 'caso', tipo: 'radio', opc: 'conheceFerramentas', cols: true, t: 'Você já sabe quais?' },
  { passo: '2c', n: '2.3.3', id: 'ferramentas', onde: 'caso', tipo: 'ferramentas', se: c => c.conheceFerramentas === 'sim', t: 'Quais ferramentas?', h: 'A primeira da lista é a ferramenta principal: as perguntas 2.3.4 a 2.3.7 se referem a ela. O preço é opcional; sem ele, a estimativa usa um preço ilustrativo.' },
  { passo: '2c', n: '2.3.4', id: 'tipoTec', onde: 'caso', tipo: 'radio', opc: 'tipoTec', cols: true, t: 'Que tipo de tecnologia é a ferramenta principal?', ex: 'Exemplo: uma plataforma do ministério (pública), um modelo aberto instalado numa nuvem contratada (aberta), a assinatura de um assistente para professores (paga).' },
  { passo: '2c', n: '2.3.5', id: 'pagamento', onde: 'caso', tipo: 'radio', opc: 'pagamento', cols: true, sugDe: 'tipoTec', t: 'Como vai ser o pagamento da ferramenta principal?', h: 'Pense no período da prova de conceito ou do piloto.', ex: 'Exemplo: um valor por professor por mês (por usuário); um valor anual fixo para todas as escolas (institucional).' },
  { passo: '2c', n: '2.3.6', id: 'licenca', onde: 'caso', tipo: 'radio', opc: 'licenca', cols: true, sugDe: 'tipoTec', t: 'Que tipo de licença tem a ferramenta principal?', ex: 'Exemplo: os termos aceitos ao criar uma conta gratuita são termos de uso padrão.' },
  { passo: '2c', n: '2.3.7', id: 'adaptacao', onde: 'caso', tipo: 'radio', opc: 'adaptacao', cols: true, t: 'Quanto a ferramenta principal precisa ser adaptada ao seu contexto?', h: 'Cada nível inclui os anteriores. Mais adaptação aumenta o custo de implantação e de manutenção.', ex: 'Exemplo: traduzir para a língua local e alinhar as atividades ao currículo é adaptação de conteúdo e idioma.' },
  { passo: '2c', n: '2.3.8', id: 'piloto', onde: 'caso', tipo: 'setup', sugDe: 'testes',
    t: 'De que tamanho e por quanto tempo será o piloto?', h: 'Participantes são as pessoas que usam a ferramenta.', ex: 'Exemplo: 20 escolas, 600 professores, 4 meses.',
    tPoc: 'Quantas pessoas vão testar e por quanto tempo?', hPoc: 'Na prova de conceito testam a equipe e algumas pessoas convidadas, sem usuários reais.', exPoc: 'Exemplo: 15 pessoas, 2 meses.',
    tAmbos: 'De que tamanho e por quanto tempo serão a prova de conceito e o piloto?', hAmbos: 'Primeiro a prova de conceito, com a equipe e algumas pessoas convidadas; depois o piloto, com usuários reais em poucas escolas.', exAmbos: 'Exemplo: prova de conceito com 15 pessoas por 2 meses; piloto com 20 escolas, 600 professores, 4 meses.' },
  { passo: '2c', n: '2.3.9', id: 'treino', onde: 'caso', tipo: 'radio', opc: OPC_TREINO, cols: true, opcional: true, t: 'O fornecedor pode usar os dados da rede para treinar ou melhorar os modelos dele?', h: 'Proibir esse uso é obrigação do contrato, e não uma configuração da conta. Sem resposta, a ferramenta presume que não se sabe e pede a cláusula de proibição.', ex: 'Exemplo: o contrato diz que os dados dos estudantes não treinam modelos do fornecedor.' },
  // 2.4 Infraestrutura e dispositivos (camada 3): internet e dispositivos separados
  { passo: '2d', n: '2.4.1', id: 'internet', onde: 'caso', tipo: 'radio', opc: 'internet', cols: true, t: 'As escolas têm internet adequada para o uso previsto?', h: 'Adequada: aguenta todas as pessoas que vão usar a ferramenta ao mesmo tempo, por exemplo uma turma inteira conectada.', ex: 'Exemplo: em metade das escolas a conexão cai quando duas turmas usam a internet ao mesmo tempo (parcialmente).' },
  { passo: '2d', n: '2.4.2', id: 'escolasInternet', onde: 'caso', tipo: 'num', se: c => c.internet === 'parcial', t: 'Quantas escolas da rede têm internet adequada?', h: 'A estimativa considera o custo de conexão para as demais escolas.', ex: 'Exemplo: 400 das 600 escolas.' },
  { passo: '2d', n: '2.4.3', id: 'modeloDisp', onde: 'caso', tipo: 'radio', opc: 'modeloDisp', cols: true, t: 'Como os dispositivos serão usados?', ex: 'Exemplo: um carrinho com 30 tablets que circula entre as turmas da escola é uso rotativo.' },
  { passo: '2d', n: '2.4.4', id: 'dispExistem', onde: 'caso', tipo: 'radio', opc: 'dispExistem', cols: true, sugDe: 'modeloDisp', t: 'Esses dispositivos já existem?', h: 'Considere se estão em condições de uso e se rodam a ferramenta.' },
  // 2.5 Formação e capacidade das equipes (camada 6)
  { passo: '2e', n: '2.5.1', id: 'formados', onde: 'caso', tipo: 'chips', opc: 'formados', t: 'Quem será formado?', h: 'Marque um ou mais.' },
  { passo: '2e', n: '2.5.2', id: 'formacaoTipo', onde: 'caso', tipo: 'chips', opc: 'formacaoTipo', t: 'Que tipo de formação?', h: 'Marque um ou mais.' },
  { passo: '2e', n: '2.5.3', id: 'formacaoFormato', onde: 'caso', tipo: 'radio', opc: 'formacaoFormato', cols: true, t: 'Em que formato?' },
  { passo: '2e', n: '2.5.4', id: 'formacaoHoras', onde: 'caso', tipo: 'horas', t: 'Quantas horas de formação por pessoa?', h: 'Some todas as atividades de formação previstas para cada pessoa.', ex: 'Exemplo: 4 horas de oficina e 4 horas de acompanhamento em sala = 8 horas.' },
  { passo: '2e', n: '2.5.5', id: 'formacaoPaga', onde: 'caso', tipo: 'radio', opc: 'formacaoPaga', cols: true, t: 'Quem paga a formação?' },
  { passo: '2e', n: '2.5.6', id: 'tempoJornada', onde: 'caso', tipo: 'radio', opc: OPC_TEMPO_JORNADA, cols: true, opcional: true, t: 'A formação e o uso cabem na jornada paga dos professores?', h: 'Formação fora do horário de trabalho tem pouca adesão e pode criar problema trabalhista. O tempo do professor é custo mesmo quando não é gasto novo.', ex: 'Exemplo: a formação usa as horas de trabalho pedagógico coletivo da escola.' },
  // 2.6 Operação e suporte (camada 7)
  { passo: '2f', n: '2.6.1', id: 'suporteQuem', onde: 'caso', tipo: 'radio', opc: 'suporteQuem', cols: true, t: 'Quem vai dar suporte aos usuários?', ex: 'Exemplo: o fornecedor atende pelo chat e a equipe de tecnologia da rede resolve o acesso e as contas (as duas).' },
  { passo: '2f', n: '2.6.2', id: 'suporteNivel', onde: 'caso', tipo: 'radio', opc: 'suporteNivel', cols: true, t: 'Que nível de suporte?' },
  { passo: '2f', n: '2.6.3', id: 'acompanhamento', onde: 'caso', tipo: 'radio', opc: 'acompanhamento', cols: true, t: 'Que nível de acompanhamento do uso?', h: 'Acompanhar o uso é verificar quem usa, como usa e com que resultado.' },
  { passo: '2f', n: '2.6.4', id: 'apoioEscola', onde: 'caso', tipo: 'radio', opc: OPC_APOIO_ESCOLA, cols: true, opcional: true, t: 'Quem apoia os professores na escola, no dia a dia, no uso da ferramenta?', h: 'O suporte técnico resolve acesso e senha. A dúvida sobre como usar na aula precisa de alguém na escola que conheça a turma.', ex: 'Exemplo: um professor de referência por escola, com 2 a 4 horas por semana para apoiar os colegas.' },
  { passo: '2f', n: '2.6.5', id: 'revisao', onde: 'caso', tipo: 'revisao', se: c => (c.tarefas || []).includes('alerta_precoce'), opcional: true, t: 'Quanto trabalho de revisão os alertas vão dar?', h: 'Cada alerta precisa da revisão de uma pessoa antes de virar ação. Com a taxa e os minutos, a estimativa soma as horas de revisão ao custo; sem eles, essa linha não entra.', ex: 'Exemplo: 5% dos estudantes alcançados sinalizados por mês, 15 minutos para revisar cada alerta.' },
  // 3.1 Primeira etapa da implantação
  { passo: '3a', n: '3.1.1', id: 'implantacao', onde: 'caso', tipo: 'implant', sugDe: 'elegiveis', t: 'Na primeira etapa, quantas escolas e quantas pessoas vão usar?', h: 'É o primeiro ano de uso depois do teste (Ano 1 da estimativa).', ex: 'Exemplo: 200 escolas e 4.000 professores no primeiro ano.' },
  { passo: '3a', n: '3.1.2', id: 'estrategiaCompra', onde: 'caso', tipo: 'radio', opc: OPC_ESTRATEGIA_COMPRA, cols: true, opcional: true, t: 'Como a necessidade vai ao mercado?', h: 'O instrumento certo depende da maturidade da solução: um produto pronto ou algo a desenvolver. Sem resposta, a ferramenta o deduz do tipo de tecnologia e da adaptação.', ex: 'Exemplo: diálogo com o mercado para uma solução ainda sem produto pronto.' },
  { passo: '3a', n: '3.1.3', id: 'dotacao', onde: 'caso', tipo: 'radio', opc: OPC_DOTACAO, cols: true, opcional: true, t: 'A despesa dos próximos exercícios está prevista no orçamento?', h: 'Um contrato de vários anos sem previsão orçamentária é um vício comum. Responda sobre os exercícios depois do teste.', ex: 'Exemplo: a despesa do Ano 1 está no orçamento, e a dos anos seguintes ainda não (em parte).' },
  // 3.2 Arquitetura e integração (antes ficava no 2.3)
  { passo: '3b', n: '3.2.1', id: 'arquitetura', onde: 'caso', tipo: 'arq', t: 'Qual arquitetura a ferramenta principal vai usar?', h: 'Mude só se souber; senão, use a arquitetura presumida.' },
  { passo: '3b', n: '3.2.2', id: 'verificacao', onde: 'caso', tipo: 'radio', opc: OPC_VERIFICACAO, cols: true, opcional: true, t: 'O contrato garante o registro da versão do modelo e os registros de uso?', h: 'Sem esses registros a rede não consegue refazer testes nem explicar uma saída. A resposta define a verificabilidade da ferramenta no cálculo do risco.', ex: 'Exemplo: o fornecedor avisa cada troca de versão e entrega os registros de uso todo mês.' },
  // 4.1 Escala e horizonte
  { passo: '4a', n: '4.1.1', id: 'elegiveis', onde: 'caso', tipo: 'num', sugDe: 'usuarios', t: 'Se der certo, quantas pessoas usariam a ferramenta em toda a rede?', h: 'Base da estimativa de custo depois da implantação.', ex: 'Exemplo: 12.000 professores ou 150.000 estudantes.' },
  { passo: '4a', n: '4.1.2', id: 'expansao', onde: 'caso', tipo: 'radio', opc: 'expansao', cols: true, padrao: true, t: 'Em quanto tempo, depois da implantação, você pretende chegar a todas essas pessoas?' },
  { passo: '4a', n: '4.1.3', id: 'horizonte', onde: 'caso', tipo: 'radio', opc: 'horizonte', cols: true, padrao: true, t: 'Por quantos anos de uso você quer estimar o custo?', h: 'Além do Ano 0, que é o da prova de conceito ou do piloto.' },
  // v14: curva de adoção, reposição dos dispositivos e rotatividade das pessoas formadas (opcionais; os padrões reproduzem a v13)
  { passo: '4a', n: '4.1.4', id: 'curva', onde: 'caso', tipo: 'radio', opc: 'curva', cols: true, opcional: true, t: 'Como o uso cresce depois da primeira etapa?', h: 'Define quantas pessoas usam em cada ano até chegarem a toda a rede. Em S, a diferença para a linear só aparece quando a resposta do 4.1.2 é três anos. Sem resposta, vale a linear.' },
  { passo: '4a', n: '4.1.5', id: 'ondas', onde: 'caso', tipo: 'ondas', se: c => c.curva === 'ondas', t: 'Em que ano a rede chega a cada porcentagem do total?', h: 'Até 4 ondas, com o ano (a partir do Ano 2) e a porcentagem acumulada das pessoas do 4.1.1. Entre as ondas o uso fica no patamar anterior; se a última onda não chegar a 100%, o uso fica nesse patamar. Estas ondas substituem a resposta do 4.1.2.', ex: 'Exemplo: Ano 2, 50%; Ano 4, 100%.' },
  { passo: '4a', n: '4.1.6', id: 'reposicaoDisp', onde: 'caso', tipo: 'radio', opc: 'reposicaoDisp', cols: true, opcional: true, t: 'Com que frequência os dispositivos comprados serão repostos?', h: 'Vale para os dispositivos que a estimativa compra (passo 2.4). Cada lote é comprado de novo ao fim do ciclo, dentro do horizonte, e a reposição entra no custo recorrente. Sem resposta, não há reposição.' },
  { passo: '4a', n: '4.1.7', id: 'rotacaoFormacao', onde: 'caso', tipo: 'num', casas: 1, opcional: true, t: 'Que porcentagem das pessoas formadas sai da rede a cada ano e precisa ser substituída?', h: 'Quem chega para repor essas pessoas precisa de nova formação. Se você deixar em branco, a estimativa usa 10% ao ano.', ex: 'Exemplo: 15 (por cento ao ano).' },
];

// 3.2.1: as três arquiteturas em linguagem simples
const ARQ_DESC = {
  saas: 'A rede assina um produto pronto, usado pelo navegador ou por aplicativo; o fornecedor opera tudo.',
  api: 'Uma aplicação, própria ou contratada, usa pela internet o modelo de IA de uma empresa e paga pelo uso; pode consultar documentos da rede.',
  ow: 'Um modelo aberto roda numa nuvem contratada pela rede, que responde pela operação e pela segurança.',
  // R8 (REC-52, decisão 10): opções novas; a estimativa de custo ainda não tem exemplo de partida próprio para elas
  preditivo: 'Um modelo treinado com os dados da rede para prever um resultado, como o risco de abandono.',
  ow_api: 'Uma aplicação usa pela internet um modelo aberto oferecido por uma empresa, que cobra pelo uso.',
};

export { OPC_PUBLICO, OPC_CONTESTACAO_EXISTE, OPC_TREINO, OPC_VERIFICACAO, OPC_INSTRUMENTO_TESTE, OPC_ESTRATEGIA_COMPRA, OPC_DOTACAO, OPC_TEMPO_JORNADA, OPC_MOMENTO_USO, OPC_APOIO_ESCOLA,
  OPC_UNIDADE_RESULTADO, OPC_PERIODO_RESULTADO, FASES, PASSOS, PASSO_INFO, CAMADAS, CAMADA_PASSOS, CAMADAS_INFO, REF_TCO, FIG_INFO, NIVEIS_ADM, ETAPAS_ENS, RESP_G, QUESTOES_G, CAMPOS, ARQ_DESC };
