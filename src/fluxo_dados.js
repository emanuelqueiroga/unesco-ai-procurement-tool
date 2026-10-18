// =====================================================================
// Percurso em quatro fases (v11): contexto → prova de conceito ou piloto → implantação → expansão
// Camadas do custo total (Krueger e Jackson, 2026, Figura 1, p. 11).
// Todas as perguntas vêm do registro declarativo CAMPOS (renderizado em fluxo.js).
// =====================================================================
const FASES = [
  { id: 'contexto', n: 1, nome: 'Contexto', sub: 'Onde e para quem, prioridade e impacto, governança de IA na educação',
    abertura: 'Descreva a rede, o problema e a governança que já existe. Nada aqui é avaliado agora: o diagnóstico aparece só no plano de contratação.',
    decide: 'Para quem e para quê: a rede atendida, o problema a resolver e a governança de IA que a rede já tem.',
    final: 'Um retrato da rede e do problema, que gera as sugestões das fases seguintes e abre o plano de contratação.',
    tempo: 'De 15 a 25 minutos, com os números da rede à mão. As respostas ficam salvas e você pode voltar depois.' },
  { id: 'piloto', n: 2, nome: 'Prova de conceito ou piloto', sub: 'Aplicações, experiência de uso, adoção, infraestrutura, formação e suporte', info: 'c2',
    abertura: 'O teste antes da compra e tudo o que ele exige: o que a IA vai fazer (2.1), quem a usa e como (2.2), que ferramentas e como se pagam (2.3), internet e dispositivos (2.4), formação das equipes (2.5) e suporte (2.6). Cada passo corresponde a uma camada do custo total.',
    decide: 'Como a rede testa a IA antes de comprar: o que ela faz, quem a usa, que ferramenta e como se paga, e o que as escolas e as equipes precisam.',
    final: 'As premissas de custo do teste (Ano 0): ferramenta, pagamento, tamanho do teste, internet, dispositivos, formação e suporte.',
    tempo: 'De 20 a 30 minutos. Parte das respostas vem sugerida e basta confirmar.' },
  { id: 'implantacao', n: 3, nome: 'Implantação', sub: 'Primeira etapa da implantação, arquitetura e integração', info: 'c45',
    abertura: 'Depois do teste, a primeira etapa de uso real: quantas escolas e pessoas começam e como a ferramenta se liga aos sistemas da rede.',
    decide: 'Com quantas escolas e pessoas começa o uso real e como a ferramenta se liga aos sistemas da rede.',
    final: 'A primeira etapa da implantação (Ano 1) e a arquitetura da ferramenta, que muda o custo de integração e de segurança.',
    tempo: 'De 5 a 10 minutos.' },
  { id: 'expansao', n: 4, nome: 'Expansão', sub: 'Escala e horizonte, estimativa de custo e recomendações', info: 'c37',
    abertura: 'Até onde o uso pode chegar, quanto o caso custa ao longo dos anos, distribuído pelas sete camadas do custo total, e o que fazer a seguir. Os valores são ilustrativos.',
    decide: 'Até onde o uso pode chegar, em quanto tempo e por quantos anos a rede quer estimar o custo.',
    final: 'A estimativa de custo por ano e por camada, a dotação a solicitar por exercício e as recomendações para o caso. Os valores são ilustrativos.',
    tempo: 'De 5 a 10 minutos, mais o tempo de ler a estimativa e as recomendações.' },
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
  '3a': { num: '3.1', selo: 'Camadas 2, 3 e 6', info: 'c236', abertura: 'A implantação costuma começar por uma parte da rede. Diga quantas escolas e quantas pessoas entram na primeira etapa, logo depois do teste.' },
  '3b': { num: '3.2', selo: 'Camadas 4 e 5', info: 'c45', abertura: 'Arquitetura é a forma como a ferramenta funciona por dentro e se liga aos sistemas da rede. Há três arranjos comuns: um produto pronto que a rede assina; uma aplicação, própria ou contratada, que usa pela internet um modelo de IA de uma empresa (API); ou um modelo aberto instalado numa nuvem contratada pela rede. O arranjo muda o custo de integração, de segurança e de saída do contrato. Se não souber, a ferramenta usa a arquitetura presumida a partir das respostas do passo 2.3.' },
  '4a': { num: '4.1' },
  '4b': { num: '4.2', selo: 'Camadas 1 a 7', info: 'c37' },
  '4c': { num: '4.3' },
};
// v14 (BL2.2): painel "Sobre esta etapa" dos 15 passos. Quatro partes, no máximo 80 palavras no total
// (com os títulos): serve (para que serve), importa (por que importa para o custo ou a compra), como (como responder),
// quem (quem na secretaria ou no ministério costuma saber) e ex (exemplo). [[id]] e [[id|texto]] marcam termos do glossário (glossario.js).
const AJUDA_ROT = { painel: 'Sobre esta etapa', serve: 'Para que serve', importa: 'Por que importa para o custo ou a compra', como: 'Como responder', quem: 'Quem costuma saber:', ex: 'Exemplo',
  faseDecide: 'O que esta fase decide', faseFinal: 'O que você terá ao final', faseTempo: 'Tempo para responder', dica: 'Dica:' };
const PASSO_AJUDA = {
  '1a': { serve: 'Registra onde a decisão será tomada e quantas escolas e estudantes o caso atende.',
    importa: 'O número de escolas e de estudantes dimensiona licenças, formação, suporte e dispositivos, e portanto o custo.',
    como: 'Use o cadastro oficial de escolas e matrículas.', quem: 'planejamento ou estatística educacional',
    ex: 'Rede estadual; no 6º ano, 40.000 estudantes.' },
  '1b': { serve: 'Diz que problema da rede você quer resolver, sem falar de tecnologia.',
    importa: 'O problema define o que a ferramenta faz e quem a usa. Uma [[linhabase|linha de base]] mostra depois se o gasto valeu a pena.',
    como: 'Escolha a prioridade e marque os problemas.', quem: 'área pedagógica e de avaliação',
    ex: 'Metade dos estudantes do 5º ano rural não lê com fluência.' },
  '1c': { serve: 'Mostra o que a rede já tem de equipes e regras para o uso de IA na educação.',
    importa: 'Governança é a [[camada]] 1 do custo total: comitês, revisão jurídica e monitoramento ocupam tempo pago.',
    como: 'Responda sobre a rede toda.', quem: 'gabinete, assessoria jurídica e proteção de dados',
    ex: 'Há comitê, mas não política de dados: “Sim” para o comitê e “Não” para a política.' },
  '20': { serve: 'Escolhe como a rede testa a IA antes de comprar: [[poc|prova de conceito]], [[piloto]] ou os dois.',
    importa: 'O teste define o tamanho e a duração do Ano 0 e quanto se gasta antes de decidir comprar.',
    como: 'Marque as duas, ou peça uma recomendação.', quem: 'tecnologia e área pedagógica',
    ex: 'Prova de conceito de 2 meses e, depois, piloto em 20 escolas.' },
  '2a': { serve: 'Descreve o que a IA fará no dia a dia da escola, e não o produto.',
    importa: 'A tarefa define quem usa e com que frequência, e isso muda licenças, formação e suporte.',
    como: 'Marque uma ou mais tarefas; as sugeridas vêm do problema do passo 1.2.', quem: 'área pedagógica e professores',
    ex: 'Planejar aulas e corrigir redações.' },
  '2b': { serve: 'Diz quem usa a ferramenta, quem recebe o resultado e com que frequência.',
    importa: 'Mais pessoas e mais uso significam mais licenças, mais formação e, em ferramentas pagas por uso, mais custo.',
    como: 'Confirme ou ajuste as respostas sugeridas pelas tarefas.', quem: 'área pedagógica e coordenação das escolas',
    ex: 'Professores do 6º ao 9º ano usam; os estudantes recebem as atividades.' },
  '2c': { serve: 'Registra as ferramentas, como se pagam, a licença e quanto adaptar.',
    importa: 'Preço, forma de pagamento e adaptação definem o custo do Ano 0 e o que se repete todo ano ([[recorrente|custo recorrente]]).',
    como: 'Se ainda não escolheu, responda “Ainda não sei”.', quem: 'compras e tecnologia',
    ex: 'Assinatura de [[saas|SaaS]] por professor por mês, com configuração de contas e turmas.' },
  '2d': { serve: 'Diz se as escolas têm internet e dispositivos para usar a ferramenta.',
    importa: 'Conexão nova é [[recorrente|custo recorrente]]; dispositivos novos são uma compra, em geral do [[capital|orçamento de capital]].',
    como: 'Pergunte às escolas ou use o último levantamento de infraestrutura.', quem: 'tecnologia da informação e infraestrutura escolar',
    ex: 'Em 400 das 600 escolas a internet aguenta uma turma inteira.' },
  '2e': { serve: 'Planeja quem será formado, em que formato e por quantas horas.',
    importa: 'A formação está entre os fatores que mais pesam no custo total: horas de cada pessoa, pagas ou tiradas do trabalho.',
    como: 'Sem as horas, use “Usar uma estimativa”.', quem: 'formação de professores e gestão de pessoas',
    ex: '4 horas de oficina e 4 de acompanhamento em sala: 8 horas por professor.' },
  '2f': { serve: 'Diz quem atende as dúvidas e os problemas das escolas e como a rede acompanha o uso.',
    importa: 'Suporte e acompanhamento ocupam equipes todo ano; esse tempo é medido em [[eti|ETI]].',
    como: 'Escolha quem dá o suporte e o nível desejado.', quem: 'tecnologia e atendimento às escolas',
    ex: 'O fornecedor atende pelo chat; a equipe da rede cuida de acessos e contas.' },
  '3a': { serve: 'Define quantas escolas e pessoas começam a usar logo depois do teste.',
    importa: 'É o Ano 1 da estimativa: licenças, formação, suporte e dispositivos crescem com o número de pessoas.',
    como: 'Use a sugestão ou informe o que a rede consegue atender.', quem: 'planejamento e tecnologia',
    ex: '200 escolas e 4.000 professores no primeiro ano.' },
  '3b': { serve: 'Escolhe como a ferramenta funciona e se liga aos sistemas da rede: produto pronto ([[saas|SaaS]]), [[api|API]] ou [[pesos|pesos abertos]].',
    importa: 'O arranjo muda o custo de integração, de segurança e de saída do contrato.',
    como: 'Se não souber, use a arquitetura presumida.', quem: 'tecnologia e segurança da informação',
    ex: 'A rede assina um assistente pronto e o fornecedor opera tudo.' },
  '4a': { serve: 'Define até onde o uso chega, em quanto tempo e por quantos anos estimar.',
    importa: 'É a base da estimativa: o custo anual cresce com as pessoas que usam.',
    como: 'Informe as pessoas da rede toda, mesmo que só parte comece agora.', quem: 'planejamento e orçamento',
    ex: '12.000 professores em 2 anos, custo estimado por 5 anos.' },
  '4b': { serve: 'Mostra o custo total ([[tco|TCO]]) por ano e por [[camada]], e a [[dotacao|dotação]] por exercício.',
    importa: 'Separa o que se paga uma vez ([[capital|orçamento de capital]]) do que se repete ([[corrente|orçamento corrente]]).',
    como: 'Nada a responder: ajuste na calculadora a [[desconto|taxa de desconto]] e as faixas [[p10p90|P10–P90]].', quem: 'finanças e orçamento',
    ex: 'Dispositivos do Ano 0 vão ao orçamento de capital; a assinatura, ao corrente.' },
  '4c': { serve: 'Lista as ações para este caso, por prioridade, a partir das suas respostas.',
    importa: 'Mostra o que fazer antes do teste e de contratar, com custo e compra separados de política.',
    como: 'Nada a responder: leia as de prioridade alta e use “Ir à pergunta”.', quem: 'quem coordena a compra e a assessoria jurídica',
    ex: 'Sem medida do problema, a lista pede medi-lo antes.' },
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
  c236: 'Camadas 2, 3 e 6 · Aplicações de IA, experiência de uso e adoção (camada 2); infraestrutura e dispositivos (camada 3); formação e capacidade das equipes (camada 6). Nesta primeira etapa as três crescem juntas, porque dependem do número de escolas e de pessoas que passam a usar a ferramenta. As notas dos passos 2.1, 2.4 e 2.5 trazem o que Krueger e Jackson (2026, p. 11) dizem de cada camada.',
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
  { passo: '1a', n: '1.1.5', id: 'grade', dica: 'Estes números dimensionam licenças, formação e suporte. O cadastro de escolas e matrículas da rede serve.', onde: 'ctx', tipo: 'grade', t: 'Quantas escolas e quantos estudantes há em cada etapa, por ano ou série?', h: 'Informe os estudantes de cada ano ou série; o total da etapa é calculado.', ex: 'Exemplo: 6º ano 40.000; 7º ano 38.000.' },
  // 1.2 Prioridade e impacto (v13: prioridades e problemas no lugar de domínio e componentes)
  { passo: '1b', n: '1.2.1', id: 'prioridades', onde: 'ctx', tipo: 'prior', t: 'Qual é a prioridade da sua rede para a IA na educação?', h: 'Marque uma ou mais.' },
  { passo: '1b', n: '1.2.2', id: 'problemas', onde: 'ctx', tipo: 'problemas', t: 'Quais problemas você quer resolver?', h: 'Marque um ou mais, ou todos de uma prioridade. Os objetivos já vêm escritos; você completa os números da sua rede.' },
  { passo: '1b', n: '1.2.3', id: 'olhando', onde: 'ctx', tipo: 'texto', sugDe: 'problemas', t: 'Como a equipe descreve o problema, em poucas palavras?', h: 'Vira o título do caso se você não der outro nome.', ph: 'Ex.: estudantes chegam ao 9º ano abaixo do esperado em matemática' },
  { passo: '1b', n: '1.2.4', id: 'problema', onde: 'caso', tipo: 'area', rows: 4, sugDe: 'problemas', t: 'Descreva a situação atual sem citar tecnologia', h: 'Situação atual, quem é afetado e o que se sabe sobre as causas. Se, ao retirar a palavra "IA", o texto deixa de explicar o problema, reescreva.', ex: 'Exemplo: nas escolas da zona rural, metade dos estudantes do 5º ano não lê com fluência; as turmas são multisseriadas e não há reforço no contraturno.' },
  { passo: '1b', n: '1.2.5', id: 'impactos', onde: 'caso', tipo: 'chips', opc: 'impactos', sugDe: 'problemas', t: 'Que impacto você quer alcançar?', h: 'Marque um ou mais. O impacto orienta as tarefas sugeridas no passo 2.1.', outro: { v: 'outro', id: 'impactoOutro', t: 'Qual impacto?' } },
  { passo: '1b', n: '1.2.6', id: 'resultado', onde: 'caso', tipo: 'area', rows: 3, opcional: true, sugDe: 'problemas', t: 'Se quiser, detalhe o resultado esperado e como vai medi-lo', ex: 'Exemplo: reduzir de 50% para 35% os estudantes abaixo do nível adequado em leitura em dois anos.' },
  { passo: '1b', n: '1.2.7', id: 'linhaBase', dica: 'Sem uma [[linhabase|linha de base]], não dá para saber depois se a IA ajudou.', onde: 'caso', tipo: 'radio', opc: 'linhaBase', padrao: true,
    detalhe: { v: ['sim', 'parcial'], problemas: 'Para quais problemas?', medida: 'Qual medida?', exMedida: 'Ex.: avaliação estadual de leitura do 5º ano, 2025' }, t: 'Você tem uma medida atual do problema (linha de base)?', ex: 'Exemplo: resultados da avaliação de leitura do ano passado, por escola.' },
  { passo: '1b', n: '1.2.8', id: 'alternativa', onde: 'caso', tipo: 'radio', opc: 'simNao', t: 'Você já comparou ao menos uma alternativa sem IA?', ex: 'Exemplo: reforço escolar no contraturno, redesenho do processo ou um software convencional de exercícios.' },
  // 1.3 Governança (camada 1)
  ...QUESTOES_G.map(q => ({ passo: '1c', n: q.n, id: q.id, onde: 'resp', tipo: 'seg', opc: RESP_G, t: q.t, h: q.h, ex: q.ex, detalhe: { qual: q.detalhe, falta: 'O que falta?' } })),
  // 2.0 Prova de conceito ou piloto (múltipla: as duas podem ser marcadas; "Não sei, recomende para mim" é exclusiva)
  { passo: '20', n: '2.0', id: 'testes', dica: 'Na [[poc|prova de conceito]] testa-se a tecnologia; no [[piloto]], o uso real.', onde: 'caso', tipo: 'testes', opc: 'teste', cols: true, t: 'Você vai começar por uma prova de conceito, por um piloto ou pelos dois?', h: 'As duas servem para aprender antes de comprar. A diferença é com quem e em que condições se testa. Você pode marcar as duas: primeiro a prova de conceito, depois o piloto.' },
  // 2.1 Aplicações
  { passo: '2a', n: '2.1.1', id: 'tarefas', dica: 'Cada tarefa muda quem usa a ferramenta e quanto a usa, e isso muda o custo.', onde: 'caso', tipo: 'multi', opc: 'tarefas', sugDe: 'problemas', t: 'O que você quer que a IA faça?', h: 'Escolha uma ou mais tarefas. Cada tarefa já sugere quem usa e quem é afetado no passo 2.2.', outro: { v: 'outra', id: 'tarefaOutra', t: 'Qual tarefa?' } },
  { passo: '2a', n: '2.1.2', id: 'titulo', onde: 'caso', tipo: 'texto', opcional: true, t: 'Como você vai chamar esta aplicação?', h: 'Aparece no plano de contratação.' },
  // 2.2 Experiência de uso
  { passo: '2b', n: '2.2.1', id: 'usuarios', onde: 'caso', tipo: 'chips', opc: 'usuarios', sugere: true, t: 'Quem vai usar a ferramenta?', ex: 'Exemplo: professores do 6º ao 9º ano.' },
  { passo: '2b', n: '2.2.2', id: 'afetados', onde: 'caso', tipo: 'chips', opc: 'afetados', sugere: true, t: 'Quem recebe ou é afetado pelo que a ferramenta produz?', ex: 'Exemplo: os estudantes que recebem as atividades preparadas pelo professor.' },
  { passo: '2b', n: '2.2.3', id: 'consequencias', onde: 'caso', tipo: 'chips', opc: 'consequencias', sugere: true, padrao: true, t: 'O que as pessoas vão fazer com a resposta da ferramenta?', ex: 'Exemplo: o professor revisa o plano de aula e decide o que usar.' },
  { passo: '2b', n: '2.2.4', id: 'frequencia', dica: 'Em ferramentas pagas por uso, mais uso significa mais custo.', onde: 'caso', tipo: 'radio', opc: 'frequencia', cols: true, sugere: true, padrao: true, t: 'Com que frequência cada pessoa vai usar?' },
  // 2.3 Adoção (ferramentas; as perguntas 2.3.4 a 2.3.7 valem para a ferramenta principal, a primeira da lista)
  { passo: '2c', n: '2.3.1', id: 'nFerramentas', dica: 'Cada ferramenta tem a sua licença, adaptação e suporte, e soma ao custo.', onde: 'caso', tipo: 'radio', opc: 'nFerramentas', cols: true, sugDe: 'testes', t: 'Quantas ferramentas você pretende usar?', h: 'Conte as ferramentas de IA que as pessoas vão usar neste caso.', ex: 'Exemplo: um assistente para planejar aulas e outra ferramenta para corrigir redações são duas ferramentas.' },
  { passo: '2c', n: '2.3.2', id: 'conheceFerramentas', onde: 'caso', tipo: 'radio', opc: 'conheceFerramentas', cols: true, t: 'Você já sabe quais?' },
  { passo: '2c', n: '2.3.3', id: 'ferramentas', dica: 'O preço é por licença por mês. Uma cotação do fornecedor dá o valor mais próximo da realidade.', onde: 'caso', tipo: 'ferramentas', se: c => c.conheceFerramentas === 'sim', t: 'Quais ferramentas?', h: 'A primeira da lista é a ferramenta principal: as perguntas 2.3.4 a 2.3.7 se referem a ela. O preço é opcional; sem ele, a estimativa usa um preço ilustrativo.' },
  { passo: '2c', n: '2.3.4', id: 'tipoTec', dica: 'Gratuita não é o mesmo que sem custo: formação, suporte e integração continuam a ser pagos.', onde: 'caso', tipo: 'radio', opc: 'tipoTec', cols: true, t: 'Que tipo de tecnologia é a ferramenta principal?', ex: 'Exemplo: uma plataforma do ministério (pública), um modelo aberto instalado numa nuvem contratada (aberta), a assinatura de um assistente para professores (paga).' },
  { passo: '2c', n: '2.3.5', id: 'pagamento', dica: 'Por usuário ou por consumo, o custo cresce com o uso; o valor institucional é fixo e se repete todo ano ([[recorrente|custo recorrente]]).', onde: 'caso', tipo: 'radio', opc: 'pagamento', cols: true, sugDe: 'tipoTec', t: 'Como vai ser o pagamento da ferramenta principal?', h: 'Pense no período da prova de conceito ou do piloto.', ex: 'Exemplo: um valor por professor por mês (por usuário); um valor anual fixo para todas as escolas (institucional).' },
  { passo: '2c', n: '2.3.6', id: 'licenca', dica: 'A licença diz o que a rede pode fazer com a ferramenta, por quanto tempo e o que acontece ao sair.', onde: 'caso', tipo: 'radio', opc: 'licenca', cols: true, sugDe: 'tipoTec', t: 'Que tipo de licença tem a ferramenta principal?', ex: 'Exemplo: os termos aceitos ao criar uma conta gratuita são termos de uso padrão.' },
  { passo: '2c', n: '2.3.7', id: 'adaptacao', dica: 'Ajustar contas e turmas é simples; ligar a sistemas da rede ou programar exige equipe técnica, medida em [[eti|ETI]].', onde: 'caso', tipo: 'radio', opc: 'adaptacao', cols: true, t: 'Quanto a ferramenta principal precisa ser adaptada ao seu contexto?', h: 'Cada nível inclui os anteriores. Mais adaptação aumenta o custo de implantação e de manutenção.', ex: 'Exemplo: traduzir para a língua local e alinhar as atividades ao currículo é adaptação de conteúdo e idioma.' },
  { passo: '2c', n: '2.3.8', id: 'piloto', dica: 'Participantes e meses definem as licenças e o suporte do Ano 0.', onde: 'caso', tipo: 'setup', sugDe: 'testes',
    t: 'De que tamanho e por quanto tempo será o piloto?', h: 'Participantes são as pessoas que usam a ferramenta.', ex: 'Exemplo: 20 escolas, 600 professores, 4 meses.',
    tPoc: 'Quantas pessoas vão testar e por quanto tempo?', hPoc: 'Na prova de conceito testam a equipe e algumas pessoas convidadas, sem usuários reais.', exPoc: 'Exemplo: 15 pessoas, 2 meses.',
    tAmbos: 'De que tamanho e por quanto tempo serão a prova de conceito e o piloto?', hAmbos: 'Primeiro a prova de conceito, com a equipe e algumas pessoas convidadas; depois o piloto, com usuários reais em poucas escolas.', exAmbos: 'Exemplo: prova de conceito com 15 pessoas por 2 meses; piloto com 20 escolas, 600 professores, 4 meses.' },
  // 2.4 Infraestrutura e dispositivos (camada 3): internet e dispositivos separados
  { passo: '2d', n: '2.4.1', id: 'internet', dica: 'Conexão nova é [[recorrente|custo recorrente]]: uma mensalidade por escola, todo ano.', onde: 'caso', tipo: 'radio', opc: 'internet', cols: true, t: 'As escolas têm internet adequada para o uso previsto?', h: 'Adequada: aguenta todas as pessoas que vão usar a ferramenta ao mesmo tempo, por exemplo uma turma inteira conectada.', ex: 'Exemplo: em metade das escolas a conexão cai quando duas turmas usam a internet ao mesmo tempo (parcialmente).' },
  { passo: '2d', n: '2.4.2', id: 'escolasInternet', onde: 'caso', tipo: 'num', se: c => c.internet === 'parcial', t: 'Quantas escolas da rede têm internet adequada?', h: 'A estimativa considera o custo de conexão para as demais escolas.', ex: 'Exemplo: 400 das 600 escolas.' },
  { passo: '2d', n: '2.4.3', id: 'modeloDisp', dica: 'O modelo de uso define quantos dispositivos a rede precisa comprar.', onde: 'caso', tipo: 'radio', opc: 'modeloDisp', cols: true, t: 'Como os dispositivos serão usados?', ex: 'Exemplo: um carrinho com 30 tablets que circula entre as turmas da escola é uso rotativo.' },
  { passo: '2d', n: '2.4.4', id: 'dispExistem', dica: 'Dispositivos novos são uma compra, em geral do [[capital|orçamento de capital]].', onde: 'caso', tipo: 'radio', opc: 'dispExistem', cols: true, sugDe: 'modeloDisp', t: 'Esses dispositivos já existem?', h: 'Considere se estão em condições de uso e se rodam a ferramenta.' },
  // 2.5 Formação e capacidade das equipes (camada 6)
  { passo: '2e', n: '2.5.1', id: 'formados', onde: 'caso', tipo: 'chips', opc: 'formados', t: 'Quem será formado?', h: 'Marque um ou mais.' },
  { passo: '2e', n: '2.5.2', id: 'formacaoTipo', onde: 'caso', tipo: 'chips', opc: 'formacaoTipo', t: 'Que tipo de formação?', h: 'Marque um ou mais.' },
  { passo: '2e', n: '2.5.3', id: 'formacaoFormato', onde: 'caso', tipo: 'radio', opc: 'formacaoFormato', cols: true, t: 'Em que formato?' },
  { passo: '2e', n: '2.5.4', id: 'formacaoHoras', dica: 'O custo é horas por pessoa × pessoas formadas × custo da hora.', onde: 'caso', tipo: 'horas', t: 'Quantas horas de formação por pessoa?', h: 'Some todas as atividades de formação previstas para cada pessoa.', ex: 'Exemplo: 4 horas de oficina e 4 horas de acompanhamento em sala = 8 horas.' },
  { passo: '2e', n: '2.5.5', id: 'formacaoPaga', dica: 'Se o fornecedor ou um parceiro paga, o custo aparece no total, mas não na [[dotacao|dotação]] da rede.', onde: 'caso', tipo: 'radio', opc: 'formacaoPaga', cols: true, t: 'Quem paga a formação?' },
  // 2.6 Operação e suporte (camada 7)
  { passo: '2f', n: '2.6.1', id: 'suporteQuem', onde: 'caso', tipo: 'radio', opc: 'suporteQuem', cols: true, t: 'Quem vai dar suporte aos usuários?', ex: 'Exemplo: o fornecedor atende pelo chat e a equipe de tecnologia da rede resolve o acesso e as contas (as duas).' },
  { passo: '2f', n: '2.6.2', id: 'suporteNivel', dica: 'Mais suporte significa mais tempo de equipe, medido em [[eti|ETI]].', onde: 'caso', tipo: 'radio', opc: 'suporteNivel', cols: true, t: 'Que nível de suporte?' },
  { passo: '2f', n: '2.6.3', id: 'acompanhamento', dica: 'Acompanhar mais exige mais tempo de gestão e de monitoramento da equipe.', onde: 'caso', tipo: 'radio', opc: 'acompanhamento', cols: true, t: 'Que nível de acompanhamento do uso?', h: 'Acompanhar o uso é verificar quem usa, como usa e com que resultado.' },
  // 3.1 Primeira etapa da implantação
  { passo: '3a', n: '3.1.1', id: 'implantacao', dica: 'Estas pessoas entram no Ano 1 da estimativa e definem licenças, formação e suporte desse ano.', onde: 'caso', tipo: 'implant', sugDe: 'elegiveis', t: 'Na primeira etapa, quantas escolas e quantas pessoas vão usar?', h: 'É o primeiro ano de uso depois do teste (Ano 1 da estimativa).', ex: 'Exemplo: 200 escolas e 4.000 professores no primeiro ano.' },
  // 3.2 Arquitetura e integração (antes ficava no 2.3)
  { passo: '3b', n: '3.2.1', id: 'arquitetura', dica: 'Produto pronto ([[saas|SaaS]]), aplicação que usa uma [[api|API]] ou modelo de [[pesos|pesos abertos]]: cada um tem custos diferentes.', onde: 'caso', tipo: 'arq', t: 'Qual arquitetura a ferramenta principal vai usar?', h: 'Mude só se souber; senão, use a arquitetura presumida.' },
  // 4.1 Escala e horizonte
  { passo: '4a', n: '4.1.1', id: 'elegiveis', dica: 'Todas as pessoas que usariam a ferramenta: o [[recorrente|custo recorrente]] anual cresce com este número.', onde: 'caso', tipo: 'num', sugDe: 'usuarios', t: 'Se der certo, quantas pessoas usariam a ferramenta em toda a rede?', h: 'Base da estimativa de custo depois da implantação.', ex: 'Exemplo: 12.000 professores ou 150.000 estudantes.' },
  { passo: '4a', n: '4.1.2', id: 'expansao', onde: 'caso', tipo: 'radio', opc: 'expansao', cols: true, padrao: true, t: 'Em quanto tempo, depois da implantação, você pretende chegar a todas essas pessoas?' },
  { passo: '4a', n: '4.1.3', id: 'horizonte', dica: 'Um horizonte maior mostra o custo de manter a ferramenta, e não só o de começar.', onde: 'caso', tipo: 'radio', opc: 'horizonte', cols: true, padrao: true, t: 'Por quantos anos de uso você quer estimar o custo?', h: 'Além do Ano 0, que é o da prova de conceito ou do piloto.' },
];

// 3.2.1: as três arquiteturas em linguagem simples
const ARQ_DESC = {
  saas: 'A rede assina um produto pronto, usado pelo navegador ou por aplicativo; o fornecedor opera tudo.',
  api: 'Uma aplicação, própria ou contratada, usa pela internet o modelo de IA de uma empresa e paga pelo uso; pode consultar documentos da rede.',
  ow: 'Um modelo aberto roda numa nuvem contratada pela rede, que responde pela operação e pela segurança.',
};
