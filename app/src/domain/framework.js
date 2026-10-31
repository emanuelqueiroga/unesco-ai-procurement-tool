import { LOC } from './i18n.js';

// =====================================================================
// Conteúdo do guia (pontos de decisão, risco, evidência, listas) e
// regras que montam o percurso específico de cada caso.
// =====================================================================

const NIVEIS = ['limitado', 'moderado', 'elevado', 'critico'];
const NIVEL_NOME = { limitado: 'Limitado', moderado: 'Moderado', elevado: 'Elevado', critico: 'Crítico' };
const NIVEL_CRIT = {
  limitado: 'Consequência pequena, percebida e corrigida antes de atingir pessoas; saída de apoio facilmente ignorada; sem dados sensíveis.',
  moderado: 'Consequência perceptível, mas reversível em tempo útil; atinge pessoas de forma indireta; revisão humana viável no volume previsto.',
  elevado: 'Influencia decisões sobre estudantes ou servidores, envolve dados sensíveis, contato direto e frequente com crianças ou grande escala; a correção é possível, mas custosa ou lenta.',
  critico: 'Determina na prática uma decisão de consequência material, difícil de reverter, sobre pessoas com baixa capacidade de contestação, ou sem mecanismo para detectar o erro a tempo.',
};
const maxNivel = (...ns) => NIVEIS[Math.max(...ns.map(n => NIVEIS.indexOf(n)))];

// ----------------------------------------------------------- opções do formulário
const OPC = {
  situacao: [
    ['nova', 'Iniciar uma nova iniciativa', 'Ainda não há solução escolhida nem fornecedor.'],
    ['proposta', 'Avaliar uma proposta já recebida', 'Um fornecedor, parceiro ou área interna já apresentou uma solução.'],
    ['renovar', 'Renovar ou ampliar um contrato', 'A solução está em uso e o contrato vence ou vai crescer.'],
    ['orcamento', 'Estimar o orçamento', 'É preciso saber quanto custará e quanto pedir por exercício.'],
  ],
  // v9: impacto desejado (1.2.5) — [id, texto, subtexto]
  impactos: [
    ['aprendizagem', 'Melhorar a aprendizagem dos estudantes', 'Ex.: proficiência em leitura ou em matemática'],
    ['desigualdade', 'Reduzir diferenças de aprendizagem entre escolas ou grupos', ''],
    ['tempo_docente', 'Liberar tempo dos professores para os estudantes', ''],
    ['feedback', 'Dar retorno mais rápido aos estudantes', ''],
    ['permanencia', 'Reduzir o abandono e melhorar a permanência', ''],
    ['inclusao', 'Ampliar o acesso e a inclusão', 'Ex.: outros idiomas, deficiência'],
    ['gestao', 'Responder mais rápido às escolas e às famílias', ''],
    // v13: impactos das prioridades "Governar", "Educar sobre" e "Educar para a era da IA" (plano/9_catalogo_prioridades.md)
    ['letramento_ia', 'Desenvolver o letramento em IA', 'Ex.: entender como a IA funciona, erra e influencia decisões'],
    ['uso_responsavel', 'Garantir o uso seguro e responsável da IA', 'Ex.: regras de uso, proteção de dados, integridade acadêmica'],
    ['competencias', 'Desenvolver competências para a era da IA', 'Ex.: pensamento crítico, criatividade, resolução de problemas'],
    ['competencias_vida', 'Desenvolver competências para a vida e o trabalho', ''],
    ['bem_estar', 'Promover o bem-estar social e emocional', ''],
    ['socioemocionais', 'Desenvolver competências pessoais e interpessoais', ''],
    ['cidadania_global', 'Desenvolver a cidadania global', ''],
    ['outro', 'Outro', 'Descreva no campo abaixo'],
  ],
  // v9: pergunta 2.0 (guia, cap. 14, "Instrumentos de aprendizagem")
  teste: [
    ['poc', 'Prova de conceito', 'Testa se a solução funciona tecnicamente, com a equipe e dados de teste, sem usuários reais.'],
    ['piloto', 'Piloto', 'Testa o uso com professores ou estudantes reais, em poucas escolas e por tempo limitado.'],
    ['recomendar', 'Não sei, recomende para mim', 'Responda às próximas perguntas como se fosse um piloto. O plano de contratação recomenda prova de conceito, piloto ou os dois e explica por quê.'],
  ],
  // v11: a 2.0 é múltipla (S.caso.testes ⊂ {'poc','piloto'} ou ['recomendar'], exclusiva); as opções são as de OPC.teste.
  // testeEfetivo: rótulos do teste derivado (casoEfetivo → ce.teste), com 'ambos' quando as duas são marcadas.
  testeEfetivo: [
    ['poc', 'Prova de conceito'], ['piloto', 'Piloto'],
    ['ambos', 'Prova de conceito e depois piloto', 'Primeiro testa se a solução funciona tecnicamente; depois, testa o uso com pessoas reais em poucas escolas.'],
    ['recomendar', 'Não sei, recomende para mim'],
  ],
  // v11: ferramentas (2.3)
  nFerramentas: [['1', 'Uma'], ['2', 'Duas'], ['3mais', 'Três ou mais'], ['nao_sei', 'Ainda não sei']],
  conheceFerramentas: [['sim', 'Sim'], ['nao', 'Ainda não']],
  // tarefas (2.1.1): preenchido abaixo a partir de TAREFAS — [id, texto, exemplo]
  tarefas: [],
  // v9: adoção (2.3)
  tipoTec: [
    ['publica', 'Pública ou gratuita, oferecida por governo ou instituição pública'],
    ['aberta', 'Aberta (código ou modelo aberto), operada pela rede ou por empresa contratada'],
    ['paga', 'Produto ou serviço pago de uma empresa'],
    ['nao_sei', 'Ainda não sei'],
  ],
  pagamento: [
    ['usuario', 'Licença por usuário'],
    ['institucional', 'Assinatura institucional (valor fixo para a rede)'],
    ['consumo', 'Por consumo (paga pelo uso)'],
    ['incluida', 'Incluída numa plataforma que a rede já paga'],
    ['gratuito', 'Doação ou piloto gratuito'],
  ],
  licenca: [
    ['assinatura', 'Licença de uso por prazo (assinatura)'],
    ['aberta', 'Licença aberta (pode usar, modificar e hospedar)'],
    ['termos', 'Termos de uso padrão, sem contrato negociado'],
    ['nao_sei', 'Ainda não sei'],
  ],
  adaptacao: [
    ['config', 'Nenhuma ou só configuração (contas, turmas, permissões)'],
    ['conteudo', 'Adaptação de conteúdo e idioma (currículo, exemplos locais, língua)'],
    ['integracao', 'Integração com sistemas da rede (login, matrícula, ambiente virtual)'],
    ['sob_medida', 'Desenvolvimento sob medida (novas funções, aplicação própria)'],
  ],
  // v11: 2.4 Infraestrutura e dispositivos (camada 3); substitui a antiga pergunta "infra"
  internet: [
    ['sim', 'Sim', 'Todas as escolas do uso previsto têm conexão estável e rápida o suficiente.'],
    ['parcial', 'Parcialmente', 'Só parte das escolas tem internet adequada.'],
    ['nao', 'Não', 'As escolas vão precisar de conexão nova ou melhor.'],
  ],
  modeloDisp: [
    ['um_por_aluno', 'Um por estudante', 'Cada estudante usa um dispositivo da escola só para si.'],
    ['compartilhado', 'Compartilhado na sala', 'Os estudantes dividem os dispositivos da sala em pequenos grupos.'],
    ['rotativo', 'Rotativo (carrinho ou laboratório)', 'Um conjunto de dispositivos circula entre as turmas da escola.'],
    ['por_professor', 'Um por professor', 'Só os professores usam; os estudantes não precisam de dispositivo.'],
    ['proprio', 'Dispositivos próprios das pessoas', 'Cada pessoa usa o próprio celular ou computador.'],
  ],
  dispExistem: [
    ['sim', 'Sim', 'As escolas já têm os dispositivos necessários, em bom estado.'],
    ['parcial', 'Parcialmente', 'Faltam dispositivos em parte das escolas ou turmas.'],
    ['nao', 'Não', 'Será preciso comprar ou alugar os dispositivos.'],
  ],
  // v11: 2.5 Formação e capacidade das equipes (camada 6)
  // R8 (REC-52, PED-12): 'coordenacao' é opção nova; casos.js ainda não calcula o tempo de formação desse papel (ROTULO_PAPEL), então não muda o custo
  formados: [['professores', 'Professores'], ['gestores', 'Gestores escolares'], ['coordenacao', 'Coordenação pedagógica'], ['tecnica', 'Equipe técnica'], ['administrativo', 'Equipe administrativa']],
  formacaoTipo: [
    ['tecnologia', 'Uso da tecnologia', 'Como acessar e usar a ferramenta no dia a dia.'],
    ['pedagogico', 'Uso pedagógico', 'Como usar a ferramenta para ensinar e acompanhar os estudantes.'],
    ['piloto', 'Formação específica do piloto', 'O que testar, como registrar e como avaliar o piloto.'],
    ['dados_etica', 'Proteção de dados e uso responsável', 'Cuidados com dados pessoais, limites da IA e como contestar erros.'],
  ],
  formacaoFormato: [
    ['presencial', 'Presencial', 'Encontros com formadores nas escolas ou em polos.'],
    ['online', 'Online', 'Cursos e encontros a distância.'],
    ['hibrida', 'Híbrida', 'Parte presencial e parte online.'],
  ],
  formacaoPaga: [
    ['fornecedor', 'Incluída no contrato do fornecedor'], ['rede', 'A própria rede'],
    ['parceiro', 'Parceiro ou outro programa'], ['indefinido', 'Ainda não definido'],
  ],
  // v11: 2.6 Operação e suporte (camada 7)
  suporteQuem: [['fornecedor', 'Equipe do fornecedor'], ['rede', 'Equipe da própria rede'], ['ambos', 'As duas']],
  suporteNivel: [
    ['basico', 'Básico', 'Atendimento por um canal escrito, em horário comercial, para dúvidas de acesso e uso.'],
    ['ampliado', 'Ampliado', 'Atendimento por vários canais, com prazos de resposta definidos e apoio às escolas nos primeiros meses.'],
    ['dedicado', 'Dedicado', 'Uma equipe ou pessoa de referência para a rede, com resposta rápida e visitas às escolas quando preciso.'],
  ],
  acompanhamento: [
    ['leve', 'Leve', 'Indicadores de uso e registro de incidentes, revistos de tempos em tempos.'],
    ['regular', 'Regular', 'Indicadores mensais e revisão de uma amostra das respostas da IA a cada período.'],
    ['intensivo', 'Intensivo', 'Revisão frequente de amostras, acompanhamento por escola e relatórios para a coordenação.'],
  ],
  // v11: 4.1.2 em quanto tempo, depois da implantação (3.1), o uso chega a todas as pessoas
  expansao: [['ano1', 'Um ano depois da implantação'], ['ano2', 'Dois anos depois da implantação'], ['ano3', 'Três anos depois da implantação']],
  horizonte: [[3, '3 anos'], [5, '5 anos']],
  // v14: 4.1.4 curva de adoção e 4.1.6 reposição dos dispositivos comprados
  curva: [['linear', 'Linear', 'Passos iguais, do primeiro ano da implantação até toda a rede.'], ['s', 'Em S', 'Começa devagar, acelera no meio e desacelera no fim, com os mesmos pontos de partida e de chegada da linear.'], ['ondas', 'Em ondas', 'Você informa em que ano a rede chega a cada porcentagem do total (até 4 ondas).']],
  reposicaoDisp: [['nao', 'Não repor dentro do horizonte'], ['3', 'A cada 3 anos'], ['4', 'A cada 4 anos'], ['5', 'A cada 5 anos']],
  simNao: [['sim', 'Sim'], ['nao', 'Ainda não']],
  classes: [
    ['geracao', 'Geração de conteúdo'], ['recomendacao', 'Recomendação'], ['classificacao', 'Classificação'],
    ['previsao', 'Previsão'], ['apoio', 'Apoio à decisão'], ['automacao', 'Automação'],
    ['avaliacao', 'Avaliação e feedback'], ['tutoria', 'Tutoria'], ['agentes', 'Agentes (ações encadeadas)'],
  ],
  autonomia: [
    [1, 'Informação', 'Produz informação sem indicar ação.'],
    [2, 'Sugestão', 'Produz uma opção ou primeira versão que a pessoa analisa.'],
    [3, 'Recomendação', 'Indica a ação preferencial; a pessoa decide.'],
    [4, 'Ação sujeita a aprovação', 'Prepara uma ação que só ocorre após autorização.'],
    [5, 'Execução dentro de limites', 'Executa automaticamente sob condições definidas.'],
    [6, 'Execução encadeada', 'Organiza e executa vários passos ou aciona ferramentas.'],
  ],
  usuarios: [['professores', 'Professores'], ['estudantes', 'Estudantes'], ['gestores', 'Gestores escolares'], ['administrativo', 'Servidores administrativos'], ['familias', 'Famílias']],
  afetados: [['criancas', 'Crianças e adolescentes'], ['adultos_est', 'Estudantes adultos'], ['professores', 'Professores'], ['servidores', 'Servidores'], ['familias', 'Famílias']],
  consequencias: [
    // v9: textos em linguagem de uso (ids e pesos iguais aos da v8)
    ['nenhuma', 'Usar como apoio na própria tarefa, sem decidir sobre pessoas', 0],
    ['organizacao', 'Organizar filas, comunicados ou rotinas', 0],
    ['formativa', 'Dar retorno formativo aos estudantes', 1],
    ['apoio_est', 'Decidir quais estudantes recebem apoio primeiro', 2],
    ['nota', 'Atribuir notas ou conceitos', 2],
    ['acesso', 'Decidir acesso, matrícula ou nível de ensino', 2],
    ['disciplina', 'Acompanhar comportamento ou provas', 2],
    ['recursos', 'Distribuir recursos entre escolas ou pessoas', 2],
  ],
  dados: [
    ['nenhum', 'Sem dados pessoais'], ['pessoais_serv', 'Dados pessoais de servidores'], ['pessoais_est', 'Dados pessoais de estudantes'],
    ['sensiveis', 'Dados sensíveis ou inferências (saúde, deficiência, condição socioeconômica, desempenho detalhado)'],
  ],
  frequencia: [['eventual', 'Eventual (mensal ou menos)'], ['semanal', 'Semanal'], ['diaria', 'Diária'], ['continua', 'Contínua ou várias vezes ao dia']],
  reversibilidade: [
    ['antes', 'O erro é percebido e corrigido antes de atingir pessoas', 'limitado'],
    ['tempo', 'Atinge pessoas, mas é reversível em tempo útil', 'moderado'],
    ['lenta', 'A correção é possível, mas lenta ou custosa', 'elevado'],
    ['dificil', 'Difícil de reverter ou de detectar a tempo', 'critico'],
  ],
  verificabilidade: [['sim', 'Há informação para verificar e registrar como cada saída foi produzida', 'limitado'], ['parcial', 'Parcialmente', 'moderado'], ['nao', 'Não, a solução é opaca para a instituição', 'elevado']],
  contestacao: [['efetiva', 'Existe caminho efetivo, com prazo e autoridade para rever', 'limitado'], ['formal', 'Existe apenas formalmente', 'moderado'], ['nao', 'Não existe', 'elevado'], ['na', 'Não se aplica (não afeta pessoas)', 'limitado']],
  cumulativo: [['nao', 'Não', 'limitado'], ['possivel', 'Possível', 'moderado'], ['sim', 'Sim, o mesmo grupo é afetado repetidamente ou por anos', 'elevado']],
  // v11: pergunta 3.2.1 (S.caso.arquitetura). 'nao_sei' usa a arquitetura presumida (derivarArquitetura);
  // 'indefinida' fica só para exibição de casos antigos (não é opção da pergunta).
  arquitetura: [
    ['saas', 'Produto pronto (SaaS) por licença', 'Um produto pronto, usado pela internet e pago por licença ou assinatura. O fornecedor cuida da tecnologia.'],
    ['api', 'Aplicação própria ou contratada usando modelo por API, com base de conhecimento (RAG)', 'Uma aplicação feita para a rede, que usa um modelo de IA de uma empresa, pago pelo uso, e consulta documentos da rede.'],
    ['ow', 'Modelo de pesos abertos em infraestrutura contratada', 'Um modelo aberto instalado em servidores contratados, com custo de infraestrutura e de uma equipe que o opera.'],
    // R8 (REC-52, decisão 10): opções novas. arquiteturaEscolhida() só conhece saas, api e ow: com estas duas o custo usa a arquitetura
    // presumida (como em "Ainda não sei"), até o motor ganhar um exemplo de partida próprio (E5).
    ['preditivo', 'Modelo preditivo treinado com dados da rede', 'Um modelo treinado com os dados da rede para prever um resultado, como o risco de abandono.'],
    ['ow_api', 'Modelo aberto usado pela API de uma empresa', 'Uma aplicação usa pela internet um modelo aberto oferecido por uma empresa, que cobra pelo uso.'],
    ['nao_sei', 'Ainda não sei (usar a arquitetura presumida)', 'A ferramenta usa a arquitetura deduzida das respostas sobre tecnologia, pagamento e licença.'],
    ['indefinida', 'Ainda não definida'],
  ],
  linhaBase: [['sim', 'Sim, medida'], ['parcial', 'Em parte ou estimada'], ['nao', 'Não']],
  capacidade: [
    ['finalidade', 'Definir a finalidade'], ['risco', 'Aceitar riscos'], ['evidencia', 'Interpretar evidências'],
    ['continuidade', 'Decidir sobre continuidade'], ['contas', 'Prestar contas'],
  ],
  degrau: [
    [1, 'Testar em ambiente controlado'], [2, 'Piloto limitado'], [3, 'Implantação em escala restrita'], [4, 'Ampliação para a rede'], [5, 'Afirmar efeito educacional'],
  ],
};

// ----------------------------------------------------------- v9: tarefas educacionais (2.1)
// O que a pessoa quer que a IA faça, em linguagem de escola. As colunas técnicas (classes,
// autonomia, dados, reversibilidade, efeito cumulativo) não aparecem no percurso: servem para
// derivar o caso efetivo (casoEfetivo) e as sugestões do passo 2.2 (perfisSugeridos).
const TAREFAS = [
  { id: 'planos_aula', t: 'Preparar planos de aula', ex: 'Ex.: uma sequência de aulas de frações para o 5º ano',
    classes: ['geracao'], autonomia: 2, usuarios: ['professores'], afetados: ['professores', 'criancas'], consequencias: ['nenhuma'],
    dados: ['nenhum'], reversibilidade: 'antes', cumulativo: 'nao', frequencia: 'semanal' },
  { id: 'materiais', t: 'Criar ou adaptar materiais e atividades', ex: 'Ex.: adaptar um texto para estudantes com dificuldade de leitura',
    classes: ['geracao'], autonomia: 2, usuarios: ['professores'], afetados: ['professores', 'criancas'], consequencias: ['nenhuma'],
    dados: ['nenhum'], reversibilidade: 'antes', cumulativo: 'nao', frequencia: 'semanal' },
  { id: 'feedback_redacao', t: 'Dar retorno sobre redações e textos dos estudantes', ex: 'Ex.: comentários sobre coesão em textos do 9º ano, revisados pelo professor',
    classes: ['avaliacao', 'geracao'], autonomia: 2, usuarios: ['professores'], afetados: ['criancas', 'professores'], consequencias: ['formativa'],
    dados: ['pessoais_est'], reversibilidade: 'tempo', cumulativo: 'possivel', frequencia: 'semanal' },
  { id: 'correcao', t: 'Corrigir ou pontuar tarefas e provas', ex: 'Ex.: pontuar questões abertas de uma avaliação bimestral',
    classes: ['avaliacao', 'classificacao'], autonomia: 3, usuarios: ['professores'], afetados: ['criancas', 'familias'], consequencias: ['nota'],
    dados: ['pessoais_est', 'sensiveis'], reversibilidade: 'lenta', cumulativo: 'sim', frequencia: 'semanal' },
  { id: 'tutoria', t: 'Oferecer prática individual e tutoria aos estudantes', ex: 'Ex.: exercícios de matemática com dicas passo a passo',
    classes: ['tutoria', 'geracao', 'recomendacao'], autonomia: 3, usuarios: ['estudantes', 'professores'], afetados: ['criancas', 'professores', 'familias'], consequencias: ['formativa'],
    dados: ['pessoais_est', 'sensiveis'], reversibilidade: 'tempo', cumulativo: 'sim', frequencia: 'continua' },
  { id: 'alerta_precoce', t: 'Identificar estudantes que precisam de apoio', ex: 'Ex.: sinalizar risco de abandono a partir de faltas e notas',
    classes: ['previsao', 'apoio'], autonomia: 3, usuarios: ['gestores', 'professores'], afetados: ['criancas', 'familias'], consequencias: ['apoio_est'],
    dados: ['pessoais_est', 'sensiveis'], reversibilidade: 'lenta', cumulativo: 'sim', frequencia: 'semanal' },
  { id: 'duvidas', t: 'Responder dúvidas de escolas, servidores ou famílias', ex: 'Ex.: perguntas sobre normas de matrícula e prazos',
    classes: ['geracao', 'classificacao'], autonomia: 2, usuarios: ['administrativo', 'gestores'], afetados: ['servidores'], consequencias: ['organizacao'],
    dados: ['pessoais_serv'], reversibilidade: 'antes', cumulativo: 'nao', frequencia: 'diaria' },
  { id: 'rotinas', t: 'Apoiar rotinas administrativas', ex: 'Ex.: organizar horários, convocações e comunicados',
    classes: ['automacao', 'geracao'], autonomia: 4, usuarios: ['administrativo', 'gestores'], afetados: ['servidores', 'professores'], consequencias: ['organizacao'],
    dados: ['pessoais_serv'], reversibilidade: 'antes', cumulativo: 'nao', frequencia: 'diaria' },
  // v13: prática orientada de letramento em IA (prioridade "Educar sobre a IA"); no motor, perfil próximo ao de tutoria
  { id: 'pratica_ia', t: 'Praticar o uso crítico de ferramentas de IA em atividades orientadas', ex: 'Ex.: estudantes comparam respostas de um chatbot com fontes confiáveis',
    classes: ['geracao', 'tutoria'], autonomia: 2, usuarios: ['estudantes', 'professores'], afetados: ['criancas', 'professores'], consequencias: ['formativa'],
    dados: ['pessoais_est'], reversibilidade: 'antes', cumulativo: 'nao', frequencia: 'semanal' },
  { id: 'acessibilidade', t: 'Traduzir conteúdos ou torná-los acessíveis', ex: 'Ex.: legendas, leitura em voz alta, versão na língua local',
    classes: ['geracao'], autonomia: 2, usuarios: ['professores', 'estudantes'], afetados: ['criancas', 'familias'], consequencias: ['nenhuma'],
    dados: ['nenhum'], reversibilidade: 'antes', cumulativo: 'nao', frequencia: 'semanal' },
  { id: 'outra', t: 'Outra', ex: 'Descreva no campo abaixo',
    classes: ['geracao'], autonomia: 2, usuarios: [], afetados: [], consequencias: ['nenhuma'],
    dados: ['nenhum'], reversibilidade: 'tempo', cumulativo: 'possivel', frequencia: 'semanal' },
];
OPC.tarefas = TAREFAS.map(x => [x.id, x.t, x.ex]);
// v11: a 2.0 múltipla usa as mesmas opções de OPC.teste
OPC.testes = OPC.teste;
OPC.arquiteturaPergunta = OPC.arquitetura.filter(o => o[0] !== 'indefinida');
// Tarefas ligadas a cada impacto (só para a etiqueta "sugerida pelo impacto" no 2.1; não pré-marcam)
const IMPACTO_TAREFAS = {
  // Estes resultados educacionais não implicam adotar uma ferramenta de IA.
  competencias_vida: [], bem_estar: [], socioemocionais: [], cidadania_global: [],
  aprendizagem: ['tutoria', 'feedback_redacao', 'materiais'],
  desigualdade: ['tutoria', 'alerta_precoce', 'materiais'],
  tempo_docente: ['planos_aula', 'materiais', 'correcao'],
  feedback: ['feedback_redacao', 'correcao'],
  permanencia: ['alerta_precoce'],
  inclusao: ['acessibilidade', 'materiais'],
  gestao: ['duvidas', 'rotinas'],
  letramento_ia: ['pratica_ia', 'materiais'],
  uso_responsavel: ['duvidas'],
  competencias: ['planos_aula', 'materiais', 'tutoria'],
  outro: [],
};
const ETAPAS_CRIANCAS = ['infantil', 'fund1', 'fund2', 'medio'];
const ORDEM_FREQ = ['eventual', 'semanal', 'diaria', 'continua'];
const ORDEM_REV = ['antes', 'tempo', 'lenta', 'dificil'];
const ORDEM_CUM = ['nao', 'possivel', 'sim'];
const tarefasDe = lista => (lista || []).map(id => TAREFAS.find(x => x.id === id)).filter(Boolean);
// união preservando a ordem das opções em OPC
const uniaoOrd = (opcs, valores) => { const s = new Set(valores); return opcs.map(o => o[0]).filter(id => s.has(id)); };
const piorDe = (ordem, valores, padrao) => valores.length ? ordem[Math.max(...valores.map(v => Math.max(0, ordem.indexOf(v))))] : padrao;

// Sugestões do passo 2.2 a partir das tarefas marcadas (2.1) e das etapas (1.1.4).
// Se há etapas marcadas e nenhuma é de educação básica (só superior, EJA, profissional),
// "criancas" vira "adultos_est". Sem etapas marcadas, mantém "criancas".
function perfisSugeridos(tarefas, etapasIds) {
  const T = tarefasDe(tarefas);
  const et = etapasIds || [];
  const adultos = et.length > 0 && !et.some(e => ETAPAS_CRIANCAS.includes(e));
  const usuarios = uniaoOrd(OPC.usuarios, [].concat(...T.map(x => x.usuarios)));
  let afetados = [].concat(...T.map(x => x.afetados));
  if (adultos) afetados = afetados.map(a => a === 'criancas' ? 'adultos_est' : a);
  afetados = uniaoOrd(OPC.afetados, afetados);
  let consequencias = uniaoOrd(OPC.consequencias, [].concat(...T.map(x => x.consequencias)));
  if (consequencias.length > 1) consequencias = consequencias.filter(k => k !== 'nenhuma');
  if (!consequencias.length) consequencias = ['nenhuma'];
  const frequencia = piorDe(ORDEM_FREQ, T.map(x => x.frequencia), 'semanal');
  return { usuarios, afetados, consequencias, frequencia };
}

// Arquitetura presumida a partir das respostas de adoção (2.3). Devolve 'saas' | 'api' | 'ow'.
// v11: a escolha da pergunta 3.2.1 (c.arquitetura = 'saas' | 'api' | 'ow') prevalece; 'nao_sei' ou vazio usa a presumida.
// Compatibilidade: c.arquiteturaManual (v9–v10) vale como escolha quando c.arquitetura não é uma das três.
// Com ignorarManual = true, devolve a arquitetura deduzida mesmo que haja escolha.
const ARQS = ['saas', 'api', 'ow'];
function arquiteturaEscolhida(c) {
  c = c || {};
  if (ARQS.includes(c.arquitetura)) return c.arquitetura;
  if (ARQS.includes(c.arquiteturaManual)) return c.arquiteturaManual;
  return '';
}
function derivarArquitetura(c, ignorarManual) {
  c = c || {};
  const esc = ignorarManual ? '' : arquiteturaEscolhida(c);
  if (esc) return esc;
  if (c.tipoTec === 'aberta' || c.licenca === 'aberta') return 'ow';
  if (c.pagamento === 'consumo') return 'api';
  return 'saas';
}

// R7 (REC-13, TEC-19): de que respostas veio a arquitetura presumida, na ordem de derivarArquitetura.
// Devolve os campos usados ('tipoTec', 'licenca', 'pagamento') ou ['padrao'] quando nenhuma resposta decidiu (SaaS).
function motivoArquitetura(c) {
  c = c || {};
  const m = [];
  if (c.tipoTec === 'aberta') m.push('tipoTec');
  if (c.licenca === 'aberta') m.push('licenca');
  if (m.length) return m;
  if (c.pagamento === 'consumo') return ['pagamento'];
  return ['padrao'];
}

// R7 (REC-46, E1; decisão 2, opção b). api e pesos abertos → 'parcial' (a rede não vê o modelo, os dados de treino
// nem as trocas de versão, a menos que contrate isso); termos de uso padrão (fora de api/ow) → 'nao'; o resto → 'parcial'.
// Uma resposta futura sobre o que o contrato garante (pergunta `verificacao` do Refinar, seção 7) entra aqui:
// 'sim' → 'sim', 'nao' → 'nao'. Sem ela, vale a premissa acima.
const VERIF_RESPOSTA = { sim: 'sim', parcial: 'parcial', nao: 'nao' };
function verificabilidadeDe(c) {
  c = c || {};
  if (VERIF_RESPOSTA[c.verificacao]) return VERIF_RESPOSTA[c.verificacao];
  if (['api', 'ow'].includes(c.arquitetura)) return 'parcial';
  return c.licenca === 'termos' ? 'nao' : 'parcial';
}

// v11: teste derivado da 2.0 (múltipla). testes ⊂ {'poc','piloto'} ou ['recomendar'] (exclusiva).
// Os dois marcados → 'ambos'; um só → 'poc' | 'piloto'; ['recomendar'] → 'recomendar'; vazio → ''.
// Compatibilidade: com testes vazio e c.teste antigo preenchido, usa c.teste.
function testeDe(c) {
  c = c || {};
  const ts = Array.isArray(c.testes) ? c.testes : [];
  if (ts.includes('recomendar')) return 'recomendar';
  const poc = ts.includes('poc'), pil = ts.includes('piloto');
  if (poc && pil) return 'ambos';
  if (poc) return 'poc';
  if (pil) return 'piloto';
  return ['poc', 'piloto', 'ambos', 'recomendar'].includes(c.teste) ? c.teste : '';
}

// v11: quantas das pessoas que usariam (E) são estudantes e quantas são professores.
// CONVENÇÃO EDITORIAL ILUSTRATIVA (a mesma da sugestão do passo 3.1/4.1): 1 professor para cada 25 estudantes.
// Se estudantes usam, E conta estudantes e os professores são E ÷ 25; se não, E conta servidores, divididos
// igualmente entre os papéis marcados (professores, gestores, servidores administrativos).
const RAZAO_EST_PROF = 25;
function papeisUsuarios(c, E) {
  const us = (c && c.usuarios) || [];
  E = +E || 0;
  const usaEst = us.includes('estudantes');
  const equipe = us.filter(u => ['professores', 'gestores', 'administrativo'].includes(u));
  const parte = equipe.length ? E / equipe.length : 0;
  if (usaEst) return { usaEst, estudantes: E, professores: Math.round(E / RAZAO_EST_PROF), gestores: 0, administrativo: 0, equipe };
  return { usaEst, estudantes: 0, professores: us.includes('professores') ? Math.round(parte) : 0,
    gestores: us.includes('gestores') ? Math.round(parte) : 0, administrativo: us.includes('administrativo') ? Math.round(parte) : 0, equipe };
}

// Caso efetivo: cópia do caso com os campos legados (classes, autonomia, dados, reversibilidade,
// verificabilidade, contestação, arquitetura...) derivados das tarefas e da adoção. Não altera c.
// tot = { alunos, escolas, etapas: [ids] } (totaisCtx()).
// v11: deriva teste (incl. 'ambos'), usa c.arquitetura quando é saas/api/ow, conta estudantes e professores
// usuários (usuariosEstudantes, usuariosProfessores) e a primeira etapa da implantação (implantacaoEfetiva).
function casoEfetivo(c, tot) {
  const ce = JSON.parse(JSON.stringify(c || {}));
  tot = tot || {};
  const alunos = +tot.alunos || 0, escolas = +tot.escolas || 0;
  const T = tarefasDe(ce.tarefas);
  const us = ce.usuarios || [], af = ce.afetados || [];
  ce.consequencias = Array.isArray(ce.consequencias) ? ce.consequencias : ['nenhuma'];
  const cons = ce.consequencias;
  ce.teste = testeDe(ce);
  ce.testes = Array.isArray(ce.testes) ? ce.testes : [];
  ce.classes = uniaoOrd(OPC.classes, [].concat(...T.map(x => x.classes)));
  ce.autonomia = T.length ? Math.max(...T.map(x => x.autonomia)) : 2;
  // dados
  const dd = [].concat(...T.map(x => x.dados));
  if (us.includes('estudantes')) dd.push('pessoais_est');
  if (us.some(u => ['professores', 'gestores', 'administrativo'].includes(u))) dd.push('pessoais_serv');
  if (af.includes('criancas') && cons.some(k => ['nota', 'apoio_est', 'acesso', 'disciplina'].includes(k))) dd.push('sensiveis');
  let dados = uniaoOrd(OPC.dados, dd);
  if (dados.length > 1) dados = dados.filter(x => x !== 'nenhum');
  ce.dados = dados.length ? dados : ['nenhum'];
  // R8 (REC-52): a resposta da pergunta 2.3.9 (treino) troca a premissa; sem resposta (ou "não sei"), vale a premissa de antes
  ce.treino = ['sim', 'nao'].includes(c && c.treino) ? c.treino : 'nao_sei';   // premissa: o plano pede a cláusula de proibição
  ce.reversibilidade = piorDe(ORDEM_REV, T.map(x => x.reversibilidade), 'tempo');
  ce.cumulativo = piorDe(ORDEM_CUM, T.map(x => x.cumulativo), 'possivel');
  // arquitetura: escolha da 3.2.1 (ou a manual antiga) ou a presumida
  const escolhida = arquiteturaEscolhida(c);
  ce.arquiteturaResposta = (c && c.arquitetura) || '';
  ce.arquitetura = escolhida || derivarArquitetura(ce, true);
  ce.__arqEscolhida = !!escolhida;
  // R7 (REC-13, E6): sem arquitetura escolhida na 3.2.1 (em branco ou "Ainda não sei"), a arquitetura usada pelo custo é
  // sempre presumida, tenha ou não a tecnologia sido escolhida (antes só valia com tipoTec vazio ou "não sei").
  ce.__arqPresumida = !escolhida;
  ce.__arqMotivo = escolhida ? [] : motivoArquitetura(ce);
  // R7 (REC-46, E1, decisão 2 opção b): a verificabilidade não vem da arquitetura. Pela API ou com pesos abertos a rede
  // só verifica o que contratar (registro de versão, registros de uso, conjunto de teste reexecutável): vale "parcial"
  // até haver resposta. Fora delas, termos de uso padrão → "não"; o resto → "parcial" (como antes).
  ce.verificabilidade = verificabilidadeDe(ce);
  const pesoMax = Math.max(0, ...cons.map(k => (OPC.consequencias.find(x => x[0] === k) || [0, 0, 0])[2]));
  // R8 (REC-52, E7): a pergunta 2.2.5 (contestacaoExiste) troca a premissa "formal"; "não sei" e a falta de resposta a mantêm
  ce.contestacao = pesoMax === 0 ? 'na' : (['efetiva', 'formal', 'nao'].includes(c && c.contestacaoExiste) ? c.contestacaoExiste : 'formal');
  // R8 (REC-52): a pergunta 1.1.6 (publico) alimenta vulneraveis (antes fixo em falso) e idiomas; sem resposta, vale a premissa de antes
  const pub = Array.isArray(c && c.publico) ? c.publico : [];
  ce.vulneraveis = pub.some(v => /defici|acolh/i.test(String(v)));
  ce.idiomas = T.some(x => x.id === 'acessibilidade') || ['conteudo', 'integracao', 'sob_medida'].includes(ce.adaptacao) || pub.some(v => /lingu|idioma/i.test(String(v)));
  // pessoas que usariam (E): informado; senão estudantes das etapas (se estudantes usam) ou
  // 1 professor para cada 25 estudantes (se só professores usam, convenção ilustrativa); senão 1.000
  const usaEst = us.includes('estudantes'), soProf = !usaEst && us.includes('professores');
  if (+ce.elegiveis > 0) { ce.elegiveis = +ce.elegiveis; ce.__elegPadrao = false; }
  else {
    ce.elegiveis = (usaEst && alunos > 0) ? alunos : (soProf && alunos > 0 ? Math.max(1, Math.round(alunos / RAZAO_EST_PROF)) : 1000);
    ce.__elegPadrao = true;
  }
  ce.alcance = (af.includes('criancas') || af.includes('adultos_est')) && alunos > 0 ? alunos : '';
  ce.pilotoGratuito = ce.pagamento === 'gratuito';
  ce.alternativaSemIA = ce.alternativa === 'sim';
  ce.escolasRede = escolas;
  ce.alunosRede = alunos;
  ce.professoresRede = alunos > 0 ? Math.round(alunos / RAZAO_EST_PROF) : 0;
  // contagens efetivas por papel (na escala completa E)
  const pap = papeisUsuarios(ce, ce.elegiveis);
  ce.usuariosEstudantes = pap.estudantes;
  ce.usuariosProfessores = pap.professores;
  ce.horizonte = +ce.horizonte || 3;
  ce.piloto = Object.assign({ escolas: '', participantes: '', meses: '' }, ce.piloto || {});
  ce.poc = Object.assign({ participantes: '', meses: '' }, ce.poc || {});
  // primeira etapa da implantação (3.1): informada ou 1/3 de E (sugestão ilustrativa); escolas proporcionais
  const imp = Object.assign({ escolas: '', pessoas: '' }, ce.implantacao || {});
  ce.implantacao = imp;
  const E = ce.elegiveis;
  const p1 = +imp.pessoas > 0 ? Math.min(E, Math.round(+imp.pessoas)) : Math.max(1, Math.round(E / 3));
  const e1 = +imp.escolas > 0 ? Math.round(+imp.escolas) : (escolas > 0 ? Math.max(1, Math.round(escolas * p1 / E)) : 0);
  ce.implantacaoEfetiva = { pessoas: p1, escolas: e1, padraoPessoas: !(+imp.pessoas > 0), padraoEscolas: !(+imp.escolas > 0) };
  ce.ferramentas = Array.isArray(ce.ferramentas) ? ce.ferramentas : [];
  return ce;
}

// Prova de conceito, piloto ou os dois? (guia, cap. 14, instrumentos de aprendizagem)
// Devolve { modo: 'poc' | 'piloto' | 'ambos', motivos: [frases em PT, chaves de i18n], ids: [códigos dos motivos],
//   poc: bool, piloto: bool }.
// v11: quando há motivo para uma prova de conceito e a solução vai chegar a professores ou estudantes,
// recomenda os dois (prova de conceito e depois piloto). Só servidores e gestores → só a prova de conceito.
const MOTIVOS_TESTE = {
  tecnologia: 'a tecnologia ainda não foi escolhida',
  sob_medida: 'a solução exige desenvolvimento sob medida, cuja viabilidade técnica ainda não foi demonstrada',
  outra: 'há uma tarefa fora da lista, sem referência de uso',
  linha_base: 'sem linha de base, um piloto ainda não conseguiria medir mudança',
  pessoas_reais: 'depois, a solução será usada por professores ou estudantes, o que pede um piloto antes da implantação',
  servidores_reais: 'depois, a solução será usada por servidores nas escolas, e só um piloto mostra se as respostas servem a quem atende',
  escolhida: 'a tecnologia está escolhida',
  adapt_config: 'a adaptação se limita à configuração',
  adapt_conteudo: 'a adaptação se limita a conteúdo e idioma',
  adapt_integracao: 'a adaptação se limita à integração com sistemas da rede',
  base_sim: 'há linha de base medida',
  base_parcial: 'há linha de base parcial',
};
// REC-26: servidores (gestores e administrativos) também são usuários reais quando a implantação chega às escolas;
// `implantacao.escolas` informado, ou pessoas informadas numa rede com escolas (a 3.1.1 conta o que a pessoa respondeu,
// não a sugestão de casoEfetivo)
function servidoresEmEscolas(ce) {
  const us = ce.usuarios || [];
  if (!(us.includes('gestores') || us.includes('administrativo'))) return false;
  const im = ce.implantacao || {};
  return +im.escolas > 0 || (+im.pessoas > 0 && +ce.escolasRede > 0);
}
function recomendarTeste(ce) {
  ce = ce || {};
  const poc = [];
  if (!ce.tipoTec || ce.tipoTec === 'nao_sei') poc.push('tecnologia');
  if (ce.adaptacao === 'sob_medida') poc.push('sob_medida');
  if ((ce.tarefas || []).includes('outra')) poc.push('outra');
  if (ce.linhaBase === 'nao') poc.push('linha_base');
  const fim = (modo, ids) => ({ modo, ids, motivos: ids.map(k => MOTIVOS_TESTE[k]), poc: modo !== 'piloto', piloto: modo !== 'poc' });
  if (poc.length) {
    const us = ce.usuarios || [];
    const reais = us.includes('professores') || us.includes('estudantes');
    if (reais) return fim('ambos', poc.concat('pessoas_reais'));
    // REC-26: servidores com implantação em escolas são usuários reais (D: prova de conceito e depois piloto)
    return servidoresEmEscolas(ce) ? fim('ambos', poc.concat('servidores_reais')) : fim('poc', poc);
  }
  const ok = ['escolhida'];
  if (['config', 'conteudo', 'integracao'].includes(ce.adaptacao)) ok.push('adapt_' + ce.adaptacao);
  if (ce.linhaBase === 'sim' || ce.linhaBase === 'parcial') ok.push('base_' + ce.linhaBase);
  return fim('piloto', ok);
}

// ----------------------------------------------------------- perfil de risco
const DIMENSOES = [
  ['peso', 'Peso da decisão', 'Que consequência decorre do uso da saída?'],
  ['autonomia', 'Autonomia', 'Quantas barreiras efetivas existem entre uma saída inadequada e sua consequência real?'],
  ['escala', 'Escala', 'Quantas pessoas, escolas, decisões ou documentos são alcançados?'],
  ['frequencia', 'Frequência', 'Com que repetição ocorre a exposição?'],
  ['pessoas', 'Pessoas afetadas', 'Que condições ampliam o impacto ou reduzem a capacidade de perceber e contestar erros?'],
  ['dados', 'Dados', 'Que dados são usados ou inferidos?'],
  ['reversibilidade', 'Reversibilidade', 'O dano pode ser detectado e corrigido em tempo útil?'],
  ['opacidade', 'Opacidade', 'Há informação suficiente para verificar, revisar e atribuir responsabilidade?'],
  ['contestacao', 'Contestação', 'Existe caminho efetivo para questionar e obter revisão?'],
  ['cumulativo', 'Efeito cumulativo', 'Pequenos efeitos se acumulam ao longo do tempo, entre ferramentas ou sobre o mesmo grupo?'],
];

const opcNivel = (lista, v) => { const o = lista.find(x => x[0] === v); return o ? o[2] : 'moderado'; };

function perfilAutomatico(c) {
  const P = {}, J = {};
  const cons = c.consequencias || [];
  const pesoMax = Math.max(0, ...cons.map(k => (OPC.consequencias.find(x => x[0] === k) || [0, 0, 0])[2]));
  // Peso
  P.peso = pesoMax === 0 ? 'limitado' : pesoMax === 1 ? 'moderado' : (c.autonomia >= 5 ? 'critico' : 'elevado');
  J.peso = pesoMax === 2 ? (c.autonomia >= 5 ? 'A saída participa de decisão de consequência e é executada automaticamente.' : 'A saída influencia decisões sobre pessoas (avaliação, acesso, priorização, disciplina ou recursos).')
    : pesoMax === 1 ? 'A saída tem consequência perceptível, mas indireta.' : 'A saída apoia uma tarefa sem decidir sobre pessoas.';
  // Autonomia
  P.autonomia = c.autonomia <= 2 ? 'limitado' : c.autonomia <= 4 ? 'moderado' : (pesoMax === 2 ? 'critico' : 'elevado');
  J.autonomia = 'Configuração ' + c.autonomia + ' da escala: ' + ((OPC.autonomia.find(a => a[0] === c.autonomia) || [0, ''])[1]).toLowerCase() + '.';
  // Escala
  const af0 = c.afetados || [];
  const contato0 = (c.usuarios || []).includes('estudantes') && af0.includes('criancas');
  const pesa = pesoMax >= 1 || contato0;
  const E = Math.max(+c.elegiveis || 0, +c.alcance || 0);
  P.escala = pesa ? (E < 1000 ? 'limitado' : E < 10000 ? 'moderado' : 'elevado') : (E < 10000 ? 'limitado' : 'moderado');
  J.escala = fmtInt(E) + ' pessoas alcançadas. ' + (E >= 10000 && !pesa ? 'Grande escala, mas a saída não decide sobre pessoas.' : 'Baixa severidade por ocorrência não significa baixo impacto agregado.');
  // Frequência
  P.frequencia = (pesa ? { eventual: 'limitado', semanal: 'moderado', diaria: 'moderado', continua: 'elevado' } : { eventual: 'limitado', semanal: 'limitado', diaria: 'limitado', continua: 'moderado' })[c.frequencia] || 'moderado';
  J.frequencia = 'Exposição ' + ((OPC.frequencia.find(f => f[0] === c.frequencia) || ['', ''])[1]).toLowerCase() + '.' + (pesa ? '' : ' Como a saída não decide sobre pessoas, a repetição pesa menos.');
  // Pessoas
  const af = c.afetados || [];
  const contatoCriancas = (c.usuarios || []).includes('estudantes') && af.includes('criancas');
  P.pessoas = contatoCriancas || c.vulneraveis ? 'elevado' : (af.includes('criancas') || af.includes('adultos_est') || af.includes('familias')) ? 'moderado' : 'limitado';
  J.pessoas = contatoCriancas ? 'Contato direto de crianças e adolescentes com o sistema.' : c.vulneraveis ? 'Há pessoas com menor capacidade de perceber e contestar erros.' :
    P.pessoas === 'moderado' ? 'Estudantes ou famílias são afetados sem interagir diretamente.' : 'Afeta apenas profissionais adultos.';
  // Dados
  const dd = c.dados || [];
  P.dados = dd.includes('sensiveis') ? 'elevado' : dd.includes('pessoais_est') ? 'moderado' : 'limitado';
  if (c.treino === 'sim' && P.dados !== 'limitado') P.dados = maxNivel(P.dados, 'elevado');
  J.dados = dd.includes('sensiveis') ? 'Dados sensíveis ou inferências sensíveis.' : dd.includes('pessoais_est') ? 'Dados pessoais de estudantes.' : dd.includes('pessoais_serv') ? 'Dados pessoais de servidores, sem categorias sensíveis.' : 'Sem dados pessoais declarados.';
  if (c.treino === 'sim') J.dados += ' O fornecedor pode usar os dados para treinar ou melhorar modelos.';
  // Reversibilidade, opacidade, contestação, cumulativo
  P.reversibilidade = opcNivel(OPC.reversibilidade, c.reversibilidade);
  J.reversibilidade = (OPC.reversibilidade.find(x => x[0] === c.reversibilidade) || ['', ''])[1] + '.';
  P.opacidade = opcNivel(OPC.verificabilidade, c.verificabilidade);
  J.opacidade = (OPC.verificabilidade.find(x => x[0] === c.verificabilidade) || ['', ''])[1] + '.';
  P.contestacao = opcNivel(OPC.contestacao, c.contestacao);
  if (c.contestacao === 'nao' && pesoMax === 2) P.contestacao = 'critico';
  if (c.contestacao === 'na' && pesoMax >= 1) P.contestacao = 'moderado';
  J.contestacao = (OPC.contestacao.find(x => x[0] === c.contestacao) || ['', ''])[1] + '.' + (c.contestacao === 'na' && pesoMax >= 1 ? ' Como a saída afeta pessoas, um caminho de contestação é necessário.' : '');
  P.cumulativo = opcNivel(OPC.cumulativo, c.cumulativo);
  J.cumulativo = (OPC.cumulativo.find(x => x[0] === c.cumulativo) || ['', ''])[1] + '.';
  return { P, J };
}

function perfilFinal(c) {
  const auto = perfilAutomatico(c);
  const P = Object.assign({}, auto.P), J = Object.assign({}, auto.J), origem = {};
  Object.keys(c.ajustes || {}).forEach(k => {
    const a = c.ajustes[k];
    if (a && a.nivel && a.nivel !== auto.P[k]) { P[k] = a.nivel; J[k] = (a.motivo || 'Ajuste manual sem justificativa registrada.'); origem[k] = 'ajuste'; }
  });
  const agregado = maxNivel(...Object.values(P));
  const determinantes = Object.keys(P).filter(k => P[k] === agregado);
  return { P, J, auto: auto.P, origem, agregado, determinantes, alto: agregado === 'elevado' || agregado === 'critico' };
}

// Categorias do Anexo III (ponto 3) do Regulamento Europeu de IA
function anexoIII(c) {
  const cons = c.consequencias || [];
  const hits = [];
  if (cons.includes('acesso')) hits.push('determinar acesso, admissão ou o nível de ensino adequado');
  if (cons.includes('nota')) hits.push('avaliar resultados de aprendizagem');
  if (cons.includes('disciplina')) hits.push('monitorar comportamento proibido durante provas');
  return hits;
}

// ----------------------------------------------------------- diligência proporcional
const DILIGENCIA = [
  ['Evidência', 'Cap. 8', 'Documentação do fornecedor e teste local simples.', 'Evidência independente, testes por grupo, piloto com desenho comparativo.'],
  ['Dados', 'Cap. 7', 'Minimização e regras padrão de retenção.', 'Avaliação de impacto à proteção de dados, controles de acesso reforçados, proibição de reúso.'],
  ['Fornecedor', 'Cap. 15', 'Verificação documental.', 'Diligência aprofundada, demonstração em ambiente controlado, auditoria.'],
  ['Contrato', 'Cap. 16', 'Cláusulas essenciais.', 'Notificação prévia de mudanças, direito de auditoria, suspensão, saída assistida.'],
  ['Supervisão', 'Cap. 17', 'Revisão pelo próprio usuário.', 'Revisão com tempo, informação e autoridade definidos; amostragem independente.'],
  ['Monitoramento', 'Cap. 18', 'Indicadores trimestrais de uso e qualidade.', 'Indicadores mensais, por grupo, com limiares de suspensão.'],
  ['Escala e aprovação', 'Cap. 19', 'Expansão por decisão da área responsável.', 'Expansão por etapas, com aprovação de instância superior.'],
];

// ----------------------------------------------------------- pontos de decisão
const PDS = [
  { n: 1, titulo: 'O problema está definido', cap: 3, instr: '', docs: ['D1', 'D3'],
    pergunta: 'O problema está definido o suficiente para comparar alternativas sem pressupor que a IA é a resposta?',
    criterios: ['Descrição verificável da situação atual e da população afetada', 'Linha de base compatível com a escala da decisão', 'Resultado desejado formulado sem referência a uma tecnologia específica', 'Causas e fatores classificados como evidência, interpretação ou hipótese', 'Restrições e lacunas de informação registradas', 'Responsável institucional pela análise e hipótese de valor público (D1) coerente com o problema'],
    seNao: 'Não pesquise fornecedores. Volte ao diagnóstico ou reduza o escopo do problema.' },
  { n: 2, titulo: 'A IA permanece justificável', cap: 4, instr: '', docs: ['D4'],
    pergunta: 'Há justificativa suficiente para manter a IA entre as alternativas que seguirão para análise detalhada?',
    criterios: ['Comparação documentada de alternativas plausíveis, incluindo a situação atual e ao menos uma alternativa sem IA', 'Indicação da necessidade que a IA atende melhor do que alternativas mais simples', 'Estimativa do benefício adicional esperado', 'Lista dos novos custos, riscos, capacidades e dependências a avaliar', 'Ação útil definida para depois da saída do sistema (o que acontece com a resposta, a classificação ou a previsão)'],
    seNao: 'Se a justificativa ainda for inovação, disponibilidade da tecnologia, pressão do mercado ou funcionalidades atraentes, a comparação não terminou. Adotar uma alternativa sem IA é um resultado legítimo.' },
  { n: 3, titulo: 'Caso de uso, risco e dados aceitáveis', cap: 7, instr: 'A, B', docs: ['D5', 'D6', 'D7'],
    pergunta: 'O risco residual do caso de uso, incluindo o tratamento de dados, é compatível com a finalidade pública, com os controles disponíveis e com a capacidade da instituição?',
    criterios: ['Canvas completo (D5), com escopo e limites definidos e plataformas separadas em casos de uso', 'Cenários de dano e pessoas afetadas identificados, com perfil de risco por dimensão (D6)', 'Diferenças entre grupos procuradas, documentadas e com resposta definida; ausência de evidência registrada como incerteza', 'Controles com responsável, mecanismo e forma de verificação, e capacidade real para operá-los', 'Caminho de contestação e remediação para casos que afetam pessoas', 'Fluxo de dados documentado, incluindo saídas, registros e inferências, convertido em requisitos (D7)', 'Gatilhos de reclassificação definidos'],
    seNao: 'Se uma consequência grave não puder ser compreendida, mitigada ou contestada, reduza escala, autonomia ou dados, redesenhe o caso de uso ou não prossiga. Se o destino dos dados ainda depende de afirmações genéricas de fornecedores, o caso não está pronto.' },
  { n: 4, titulo: 'Evidência suficiente para a próxima escala', cap: 8, instr: 'C', docs: ['D8'],
    pergunta: 'A evidência disponível é suficiente para o nível de risco, para a afirmação que se pretende sustentar e para o degrau que se pretende alcançar?',
    criterios: ['Afirmações materiais formuladas com função, população, contexto e comparação', 'Evidência compatível com o risco e com o degrau pretendido, nomeada pelo que efetivamente mede', 'Registro do que foi medido, em que população, contra que referência e com que versão do sistema', 'Limitações, incertezas, diferenças entre grupos e conflitos de interesse documentados', 'Para pilotos, desenho completo e critérios de decisão fixados antes dos resultados', 'Gatilhos de reavaliação definidos'],
    seNao: 'Limite a autorização ao degrau que a evidência sustenta (teste ou piloto), produza a evidência faltante ou abandone a afirmação que não pode ser sustentada.' },
  { n: 5, titulo: 'A solução é viável', cap: 12, instr: 'G, I', docs: ['D9', 'D10', 'D11'],
    pergunta: 'A solução desenhada é compatível com a capacidade da instituição, com o grau de dependência aceitável e com um orçamento sustentável além do período inicial?',
    criterios: ['Mapa de arquitetura (D9) com componentes críticos, responsáveis, observabilidade e definição de mudança material', 'Avaliação de dependência (D10) com formas de lock-in aceitas, custo e prazo de saída e pacote de transição', 'Árvore de custos completa (D11), com horizonte, insumos e premissas, incluindo condições de base, capacidade interna, governança proporcional ao risco e saída', 'As duas contas, econômica e orçamentária, com o índice de custo unitário decomposto por componente', 'Cenários e faixas dos direcionadores, com os principais direcionadores identificados', 'Visão orçamentária por exercício, separando compromisso, variável, reservas, capital e corrente, capacidade interna e insumos cedidos, com fonte de recursos para todos os anos', 'Benefícios classificados como economia real, capacidade liberada ou benefício operacional', 'Sustentabilidade demonstrada sem depender de condições promocionais', 'Diagnóstico de capacidade (D2) atualizado para a solução escolhida'],
    seNao: 'Se o custo depende de preços promocionais, se os direcionadores de consumo são desconhecidos, se a expansão gera custos que a instituição não consegue estimar ou controlar, ou se a saída é inviável no prazo contratual, redesenhe a arquitetura, reduza a escala, revise o licenciamento ou volte às alternativas.' },
  { n: 6, titulo: 'Requisitos e estratégia de aquisição prontos', cap: 14, instr: 'E', docs: ['D12', 'D13'],
    pergunta: 'Necessidades, riscos e condições de governança foram traduzidos em requisitos verificáveis, e existe uma forma coerente de levar a necessidade ao mercado sem perder os controles?',
    criterios: ['Requisitos materiais com origem explicável, prioridade justificada, forma de verificação e critério de aceitação (D12)', 'Requisitos de documentação, monitoramento, mudança material, portabilidade e saída definidos quando relevantes', 'Clareza sobre o que será feito internamente, adquirido, compartilhado ou obtido por parceria (D13)', 'Instrumento de aprendizagem para cada incerteza crítica, com critérios de avanço e de parada', 'Responsável pela integração, conhecimento que permanece público e dependências aceitas explicitados', 'Revisão conjunta por política educacional, tecnologia, aquisições, finanças, dados e segurança'],
    seNao: 'Se a especificação ainda depende de palavras genéricas, ou se a única justificativa da estratégia é que o produto está disponível, que um fornecedor ofereceu piloto ou que "sempre compramos assim", não vá ao mercado.' },
  { n: 7, titulo: 'O contrato protege o interesse público', cap: 16, instr: 'D, F', docs: ['D14', 'D15'],
    pergunta: 'O arranjo contratual preserva a capacidade de observar, questionar, modificar, restringir e encerrar o uso durante todo o ciclo de vida?',
    criterios: ['Objeto definido pelo caso de uso, com funcionalidades autorizadas e limites, de preferência implementados tecnicamente', 'Requisitos materiais e promessas que influenciaram a seleção incorporados, com hierarquia documental definida', 'Mecanismos proporcionais para desempenho, dados, segurança, documentação, subprocessadores, consumo e incidentes', 'Níveis de governança de mudança (registro, notificação, teste, aprovação, nova autorização), incluindo mudanças urgentes', 'Portabilidade, assistência de transição, exclusão e continuidade que tornem o encerramento plausível', 'Plano de gestão contratual com responsáveis públicos e capacidade para usar os direitos previstos'],
    seNao: 'Se o fornecedor pode modificar unilateralmente características essenciais, se a instituição não consegue verificar as condições pelas quais selecionou a proposta ou se o encerramento depende de negociação futura com o próprio fornecedor, não assine nessas condições.' },
  { n: 8, titulo: 'Operação sob controle', cap: 18, instr: 'H', docs: ['D16', 'D17'],
    pergunta: 'A instituição consegue detectar mudança, dano, perda de desempenho ou desvio de custo a tempo de agir?',
    criterios: ['Processo futuro, papéis, supervisão viável no volume real, formação e suporte implantados (D16)', 'Métricas de desempenho, risco, equidade, custo e implementação com responsável, gatilho e resposta (D17)', 'Registro de versões e informação sobre mudanças de componentes críticos, ligados aos gatilhos de reavaliação', 'Procedimento de incidentes com níveis de severidade, contenção, investigação, remediação e aprendizagem', 'Critérios de expansão, pausa e suspensão, com autoridade nomeada para cada decisão'],
    seNao: 'Se a instituição não consegue saber que o modelo mudou, se uma degradação pode ficar invisível até produzir dano ou se há alertas sem pessoas autorizadas a agir, não entre em operação ou restrinja a operação ao que pode ser observado.' },
  { n: 9, titulo: 'Continuidade justificada', cap: 19, instr: 'I', docs: ['D18'],
    pergunta: 'A continuidade, nas condições propostas, é uma decisão pública justificável diante da evidência acumulada, dos custos futuros e das alternativas disponíveis hoje?',
    criterios: ['O caso de uso permanece ligado a uma finalidade pública relevante e o problema ainda existe', 'Resultados observados comparados à hipótese de valor, à linha de base e às alternativas atuais', 'Custos futuros recalculados; riscos residuais, equidade, capacidade, dependência e custo de oportunidade considerados', 'Decisão escolhida com condições, responsáveis, prazo e indicadores', 'Próxima revisão marcada por data e por gatilhos'],
    seNao: 'Se a instituição não consegue explicar que valor continuará sendo produzido, por que a solução atual é preferível às alternativas e sob que condições essa conclusão será revista, não há base para renovar.' },
];

const DOSSIE = [
  ['D1', 'Hipótese de valor público e mapa de impactos', 1, ''], ['D2', 'Diagnóstico de capacidade', 2, ''],
  ['D3', 'Declaração do problema com linha de base', 3, ''], ['D4', 'Matriz de alternativas', 4, ''],
  ['D5', 'Canvas do caso de uso', 5, 'A'], ['D6', 'Perfil de risco e impacto, com equidade', 6, 'B'],
  ['D7', 'Mapa de fluxo de dados e requisitos de dados', 7, ''], ['D8', 'Matriz de evidência e plano de piloto', 8, 'C'],
  ['D9', 'Mapa de arquitetura e definição de mudança material', 9, ''], ['D10', 'Avaliação de dependência e pacote de transição', 10, 'I'],
  ['D11', 'Árvore de custos, duas contas, incerteza e orçamento', '11, 12', 'G'], ['D12', 'Especificação de requisitos', 13, 'E'],
  ['D13', 'Estratégia de aquisição', 14, ''], ['D14', 'Avaliação de propostas e diligência do fornecedor', 15, 'D'],
  ['D15', 'Contrato e plano de gestão contratual', 16, 'F'], ['D16', 'Plano de implementação e supervisão', 17, ''],
  ['D17', 'Plano de monitoramento e incidentes', 18, 'H'], ['D18', 'Revisão de valor e decisão de continuidade ou saída', 19, 'I'],
];
const INSTRUMENTOS = {
  A: 'Canvas do caso de uso', B: 'Avaliação de risco e impacto', C: 'Matriz de evidência e plano de piloto',
  D: 'Avaliação de propostas e diligência do fornecedor', E: 'Modelo de requisito', F: 'Checklist contratual e plano de gestão',
  G: 'Planilha de custo total e orçamento', H: 'Plano de monitoramento e registro de incidentes', I: 'Plano de saída e decisão de continuidade',
};
const CAPITULOS = {
  1: 'A IA como decisão de política pública', 2: 'Capacidade institucional para governar IA', 3: 'Definir o problema',
  4: 'Comparar alternativas antes de escolher a IA', 5: 'Definir o caso de uso', 6: 'Risco, impacto e direitos',
  7: 'Dados, privacidade, segurança e propriedade intelectual', 8: 'Evidência suficiente para a próxima decisão',
  9: 'Arquitetura da solução', 10: 'Fornecedores, dependência e portabilidade',
  11: 'Quanto custará: a árvore de custos do ciclo de vida', 12: 'Do custo ao orçamento', 13: 'Transformar o dossiê em requisitos', 14: 'Estratégia de aquisição',
  15: 'Avaliar propostas e fornecedores', 16: 'Contratos para sistemas que mudam', 17: 'Implementação e supervisão humana',
  18: 'Monitoramento, mudança e incidentes', 19: 'Avaliar o valor e decidir a continuidade',
};

// ----------------------------------------------------------- rotas por situação
// Cada passo: {cap, pd?, instr?, nota}
const ROTAS = {
  nova: {
    resumo: 'Percurso completo, na ordem em que as decisões normalmente ocorrem. Use os pontos de decisão como marcos de aprovação interna.',
    passos: [
      { cap: 1, docs: ['D1'], nota: 'Formule a hipótese de valor público: que mudança, para quem, medida como.' },
      { cap: 2, docs: ['D2'], nota: 'Diagnostique a capacidade para governar este caso de uso e identifique a função mais frágil.' },
      { cap: 3, pd: 1, nota: 'Descreva o problema sem mencionar tecnologia e meça a linha de base.' },
      { cap: 4, pd: 2, nota: 'Compare alternativas, incluindo não intervir, redesenhar o processo e software convencional.' },
      { cap: 5, instr: 'A', nota: 'Delimite o caso de uso: o que a IA fará, para quem, com que autonomia e limites.' },
      { cap: 6, instr: 'B', nota: 'Construa o perfil de risco por dimensão, com equidade, contestação e remediação.' },
      { cap: 7, pd: 3, nota: 'Mapeie o fluxo de dados até o encerramento e converta-o em requisitos.' },
      { cap: 8, pd: 4, instr: 'C', nota: 'Defina a evidência exigida para o degrau pretendido.' },
      { cap: 9, nota: 'Desenhe a arquitetura em camadas e defina o que é mudança material.' },
      { cap: 10, nota: 'Torne visíveis as dependências e o custo e o prazo de saída.' },
      { cap: 11, instr: 'G', nota: 'Estime o custo total com o modelo paramétrico.' },
      { cap: 12, pd: 5, nota: 'Converta a árvore de custos em orçamento por exercício, com cenários e faixas dos direcionadores.' },
      { cap: 13, instr: 'E', nota: 'Traduza o dossiê em requisitos rastreáveis e verificáveis.' },
      { cap: 14, pd: 6, nota: 'Escolha o arranjo de aquisição e os instrumentos de aprendizagem.' },
      { cap: 15, instr: 'D', nota: 'Avalie propostas separando admissibilidade, comparação e capacidade de entrega.' },
      { cap: 16, pd: 7, instr: 'F', nota: 'Contrate para um sistema que muda: mudança, registros, saída e gestão contratual.' },
      { cap: 17, nota: 'Implemente com supervisão humana testada no volume real.' },
      { cap: 18, pd: 8, instr: 'H', nota: 'Monitore com métricas que têm responsável, gatilho e resposta.' },
      { cap: 19, pd: 9, instr: 'I', nota: 'Revise o valor antes de cada renovação e decida a continuidade.' },
    ] },
  proposta: {
    resumo: 'Reconstrua o problema e as alternativas sem a proposta. Só depois avalie a solução oferecida contra o que a instituição precisa.',
    passos: [
      { cap: 3, pd: 1, nota: 'Reescreva o problema sem a proposta e sem o nome do produto.' },
      { cap: 4, pd: 2, nota: 'Compare a proposta com alternativas, inclusive sem IA.' },
      { cap: 5, instr: 'A', nota: 'Decomponha a oferta em casos de uso; aprove alguns e restrinja outros, se for o caso.' },
      { cap: 6, instr: 'B', nota: 'Classifique o risco pelo uso, não pelo produto.' },
      { cap: 7, pd: 3, nota: 'Exija o fluxo de dados completo, inclusive treinamento, subprocessadores e retenção.' },
      { cap: 8, pd: 4, instr: 'C', nota: 'Verifique as afirmações do fornecedor com a matriz de evidência.' },
      { cap: 11, instr: 'G', nota: 'Monte a árvore de custos normalizada, não apenas o preço da licença.' },
      { cap: 12, pd: 5, nota: 'Teste o orçamento sem condições promocionais.' },
      { cap: 13, nota: 'Se avançar, converta o que importa em requisitos e vá ao mercado com eles.' },
      { cap: 14, pd: 6, nota: 'Separe a decisão de aprender sobre a solução da decisão de adquiri-la.' },
    ] },
  renovar: {
    resumo: 'Renovar é uma nova decisão pública, comparada com as alternativas de hoje. Comece pela revisão de valor.',
    passos: [
      { cap: 19, pd: 9, instr: 'I', nota: 'Revise o valor com dados da operação real (Instrumento I, Parte 3).' },
      { cap: 18, pd: 8, instr: 'H', nota: 'Verifique se a operação esteve sob controle: versões, incidentes, métricas por grupo.' },
      { cap: 12, pd: 5, instr: 'G', nota: 'Recalcule a árvore de custos para o novo horizonte, incluindo saída.' },
      { cap: 10, nota: 'Reavalie a dependência: ela cresce silenciosamente.' },
      { cap: 16, pd: 7, instr: 'F', nota: 'Revise o contrato com o checklist antes de renovar.' },
      { cap: 6, nota: 'Se houver nova população, escala, autonomia ou finalidade, reclassifique o risco.' },
    ] },
  incidente: {
    resumo: 'Classifique a severidade, contenha e preserve registros. Depois reclassifique o risco e verifique a governança de mudança.',
    passos: [
      { cap: 18, instr: 'H', nota: 'Classifique a severidade, contenha, comunique e preserve versões, dados e registros.' },
      { cap: 6, nota: 'Reavalie o perfil de risco: o incidente contradiz a análise anterior?' },
      { cap: 16, nota: 'Verifique as obrigações de notificação, cooperação e mudança no contrato.' },
      { cap: 18, pd: 8, nota: 'Decida retomada, restrição ou suspensão com a autoridade definida.' },
      { cap: 19, nota: 'Se o problema for estrutural, antecipe a revisão de continuidade.' },
    ] },
  orcamento: {
    resumo: 'Parta da demanda e das premissas de uso, some pessoas, governança proporcional ao risco, mudança e saída, e converta em dotação por exercício.',
    passos: [
      { cap: 5, instr: 'A', nota: 'Use o canvas para fixar as premissas de uso (quem, quanto, com que frequência).' },
      { cap: 6, instr: 'B', nota: 'Use o perfil de risco para dimensionar a governança.' },
      { cap: 11, instr: 'G', nota: 'Estime o custo total com o modelo paramétrico (aba Custos).' },
      { cap: 12, pd: 5, nota: 'Converta em orçamento por exercício, com cenários e faixas dos direcionadores.' },
    ] },
  testar: {
    resumo: 'Escolha o instrumento de aprendizagem a partir da pergunta que ainda precisa de resposta. Defina critérios de parada e o destino dos ativos antes de começar.',
    passos: [
      { cap: 3, pd: 1, nota: 'Mesmo um teste precisa de problema e linha de base definidos.' },
      { cap: 8, pd: 4, instr: 'C', nota: 'Escolha o degrau da escada de evidência e desenhe o piloto antes dos resultados.' },
      { cap: 14, nota: 'Prova de conceito, ambiente controlado ou piloto: escolha pela pergunta.' },
      { cap: 7, nota: 'Nenhum teste dispensa as obrigações de proteção de dados.' },
      { cap: 10, nota: 'Registre os ativos que o teste produzirá e o destino deles se o fornecedor não for escolhido.' },
    ] },
};

// ----------------------------------------------------------- evidência
const ESCADA = {
  1: 'Documentação do fornecedor verificada; teste funcional com tarefas da instituição.',
  2: 'Teste local com usuários reais; desenho de piloto completo; supervisão viável no volume do piloto; análise de risco aprovada.',
  3: 'Resultados do piloto contra linha de base e comparador; usabilidade e impacto operacional; diferenças entre grupos examinadas.',
  4: 'Evidência de que controles e resultados se mantêm com mais volume e diversidade; custo validado em uso real.',
  5: 'Medida direta do resultado com desenho capaz de sustentar inferência causal, quando viável.',
};

// ----------------------------------------------------------- listas
const SUPERVISAO = [
  ['Informação', 'O supervisor recebe entrada, fontes recuperadas, grau de confiança e justificativa para entender a saída e seus limites?'],
  ['Competência', 'Consegue identificar os problemas relevantes? Há para quem escalonar o que não sabe avaliar?'],
  ['Tempo', 'Consegue revisar com qualidade dentro da carga real, no volume previsto após a expansão?'],
  ['Autoridade', 'Pode editar, rejeitar, encaminhar ou impedir a ação, e isso está implementado na interface?'],
  ['Independência prática', 'Consegue discordar sem que a recomendação do sistema se torne o resultado padrão?'],
  ['Capacidade de intervir', 'Pode interromper ou corrigir antes que a consequência se produza?'],
];
const CONTESTACAO = [
  ['Conhecimento', 'As pessoas sabem que a IA participa do processo e que podem contestar.'],
  ['Acesso', 'O canal é utilizável por elas, inclusive crianças e famílias.'],
  ['Informação', 'Quem contesta e quem revisa dispõem da informação necessária.'],
  ['Autoridade', 'Quem revisa pode alterar a decisão.'],
  ['Prazo', 'A revisão ocorre antes que a consequência se torne irreversível.'],
  ['Registro', 'As contestações são registradas e analisadas como sinal de problemas recorrentes.'],
];
const FORMAS_SUP = {
  caso: ['Revisão caso a caso', 'Cada saída aprovada antes de produzir consequência; casos de consequência elevada e volume administrável.'],
  critica: ['Revisão antes de ação crítica', 'O sistema executa etapas preparatórias, mas uma ação específica exige aprovação.'],
  excecao: ['Revisão por exceção', 'Casos com características definidas (baixa confiança, fora do escopo, dado incompleto) vão para uma pessoa.'],
  amostra: ['Revisão por amostragem', 'Parte das saídas é examinada para detectar problemas recorrentes; baixa consequência e alto volume.'],
  sistema: ['Supervisão do sistema', 'Indicadores, padrões de erro e incidentes agregados, acompanhados pela equipe responsável.'],
};
const DADOS_REQ = [
  ['treino', 'Uso de dados para treinamento', 'Proibição, ou condição explícita definida pela instituição, como obrigação contratual e não configuração.'],
  ['secundario', 'Usos secundários', 'Lista de finalidades autorizadas; demais usos vedados.'],
  ['sub', 'Subprocessadores', 'Lista atualizada e notificação prévia de mudanças relevantes, com direito de objeção.'],
  ['retencao', 'Retenção', 'Prazo por categoria de dado, inclusive registros e cópias de segurança.'],
  ['exclusao', 'Exclusão', 'Processo, prazo, alcance (incluindo subprocessadores) e evidência de conclusão.'],
  ['local', 'Localização', 'Regiões de armazenamento e processamento e comunicação de mudanças.'],
  ['rag', 'RAG e ferramentas', 'Preservação das permissões de origem; rastreabilidade das fontes; limites de ação.'],
  ['seg', 'Segurança e incidentes', 'Controles mínimos, notificação em prazo compatível com a resposta institucional, cooperação na investigação.'],
  ['pi', 'Propriedade intelectual', 'Direitos sobre saídas compatíveis com o uso previsto; licença restrita do fornecedor sobre entradas.'],
];
const CONTRATO = [
  ['Escopo', 'Objeto definido pelo caso de uso: finalidade, usuários, população, autonomia, funções autorizadas'],
  ['Escopo', 'Limites e funções desabilitadas, de preferência por configuração'],
  ['Escopo', 'Requisitos materiais e promessas da proposta incorporados'],
  ['Escopo', 'Hierarquia documental; termos online não alteram condições materiais'],
  ['Desempenho', 'Critérios de aceitação antes da produção'],
  ['Desempenho', 'Níveis de serviço (disponibilidade, latência, suporte)'],
  ['Desempenho', 'Métrica de desempenho do caso de uso e indicadores de qualidade'],
  ['Desempenho', 'Respostas graduais à degradação'],
  ['Mudança', 'Identificação do modelo e informação de versão disponível'],
  ['Mudança', 'Definição de mudança material e níveis: registro, notificação, teste, aprovação, nova autorização'],
  ['Mudança', 'Prazo de notificação prévia; mudanças urgentes com avaliação posterior'],
  ['Mudança', 'Mudanças de subprocessador e de modelo comercial governadas'],
  ['Dados', 'Categorias e finalidades autorizadas; vedação de outros usos'],
  ['Dados', 'Regra de treinamento e melhoria (inclui terceiros)'],
  ['Dados', 'Retenção por categoria; localização; exclusão verificável'],
  ['Dados', 'Registros mínimos disponíveis à instituição'],
  ['Verificação', 'Auditoria com objeto definido; cooperação com avaliações', 'alto'],
  ['Verificação', 'Controles de segurança mantidos na vigência'],
  ['Verificação', 'Incidentes: definição, comunicação, prazo, contenção, investigação, remediação'],
  ['Verificação', 'Suspensão de funcionalidade distinta de suspensão do caso e de rescisão', 'alto'],
  ['Verificação', 'Registros e cooperação para contestação e revisão retrospectiva', 'pessoas'],
  ['Direitos', 'Matriz de responsabilidades por atividade'],
  ['Direitos', 'Direitos sobre dados, configurações, customizações, saídas, base de conhecimento, documentação'],
  ['Direitos', 'Terceiros críticos identificados; obrigações alcançam a cadeia'],
  ['Custo', 'Unidades de cobrança e medição definidas'],
  ['Custo', 'Consumo visível antes da fatura; alertas e limites', 'consumo'],
  ['Custo', 'Regras de reajuste, compromisso mínimo, fim de descontos, mudança de unidade'],
  ['Saída', 'Ativos exportáveis, formatos, metadados e prazos; teste de exportação na vigência'],
  ['Saída', 'Assistência de transição com escopo, prazo e condições econômicas', 'alto'],
  ['Saída', 'Transferência de conhecimento ao longo da vigência'],
  ['Saída', 'Continuidade e processo alternativo; acesso após o término'],
  ['Saída', 'Exclusão: alcance, prazo, exceções, evidência de conclusão'],
  ['Gestão', 'Responsável público para cada obrigação e capacidade para usá-la'],
];
const MUDANCA = [
  ['Registro', 'Mudança operacional sem efeito material.', 'Correção de defeito, ajuste de interface.'],
  ['Notificação', 'Alteração relevante que não modifica condições essenciais.', 'Nova versão do produto; novo subprocessador não crítico.'],
  ['Notificação e teste', 'Mudança capaz de alterar comportamento ou desempenho.', 'Troca de versão do modelo; mudança no mecanismo de recuperação.'],
  ['Aprovação', 'Altera condição essencial cuja aceitação é decisão institucional.', 'Mudança no fluxo de dados ou na localização; novo provedor de modelo.'],
  ['Nova autorização', 'Muda finalidade, autonomia ou população além do escopo aprovado.', 'Habilitar pontuação automática; ampliar a estudantes de outra etapa.'],
];
const METRICAS = [
  ['Técnica', 'Disponibilidade, latência, erros de API, falhas de integração.', 'Contínuo ou diário', 'Contínuo ou diário'],
  ['Desempenho', 'Erros relevantes; amostras de saídas avaliadas com rubrica; fidelidade às fontes no RAG.', 'Mensal', 'Semanal; testes amplos por evento'],
  ['Operacional', 'Tempo total do processo, retrabalho, volume de revisão, correções, escalonamentos.', 'Mensal', 'Mensal'],
  ['Equidade', 'Desempenho, acesso e contestações por grupo, em janelas estáveis.', 'Trimestral', 'Mensal'],
  ['Custo', 'Usuários ativos, chamadas, tokens por interação, custo por usuário ativo, projeção contra o orçamento.', 'Mensal; alerta de anomalia diário', 'Mensal; alerta de anomalia diário'],
  ['Resultado e valor', 'Aprendizagem, participação, uso da capacidade liberada.', 'Semestral ou anual', 'Semestral ou anual'],
];
const SEVERIDADE = [
  ['Baixo', 'Sem consequência para pessoas; facilmente reversível.', 'Registro e correção na rotina.'],
  ['Moderado', 'Consequência limitada e reversível, ou risco detectado antes de atingir pessoas.', 'Investigação em dias; responsável pelo sistema.'],
  ['Alto', 'Pessoas afetadas, dados expostos ou função crítica comprometida; reversão possível.', 'Contenção em horas; comunicação à governança e ao fornecedor.'],
  ['Crítico', 'Dano relevante ou de difícil reversão, exposição ampla de dados de estudantes, controle essencial inoperante.', 'Restrição ou suspensão imediata; comunicação às pessoas afetadas e às autoridades competentes, conforme a lei.'],
];
const PACOTE = [
  ['Dados e saídas', 'Que informações, incluindo inferências e classificações, devem permanecer acessíveis e em que formato?', ''],
  ['Metadados e esquemas', 'Como interpretar os dados fora da solução atual?', ''],
  ['Histórico e registros', 'Que interações, decisões e registros de auditoria preservar?', ''],
  ['Configurações, instruções e regras', 'Que lógica institucional precisa ser documentada para reconstrução?', ''],
  ['Base de conhecimento', 'Como reconstruir conteúdos, permissões e fontes?', 'rag'],
  ['Embeddings e índices', 'Serão transferidos ou reconstruídos, a que custo?', 'rag'],
  ['Integrações', 'Há especificações, credenciais e documentação suficientes?', ''],
  ['Avaliações', 'Que testes e evidências acompanham a migração?', ''],
  ['Conhecimento', 'Quem precisa ser treinado antes da transição?', ''],
];
const LOCKIN = {
  saas: ['Contratual e comercial: prazos, compromissos mínimos e descontos que mudam o preço ao sair.', 'Operacional: processo reorganizado em torno do produto.', 'Dados: materiais e históricos em formato que não se reutiliza fora da solução.'],
  api: ['Técnica: integrações e instruções ajustadas a um modelo específico.', 'Dados: embeddings dependem do modelo que os gerou e podem precisar ser reconstruídos.', 'Conhecimento: só o integrador entende a configuração.'],
  ow: ['Conhecimento: operação do modelo concentrada em poucas pessoas ou em um integrador.', 'Técnica: infraestrutura especializada e serviços da nuvem contratada.', 'Pesos abertos não implicam independência: o lock-in pode apenas mudar de lugar.'],
  indefinida: ['Defina a arquitetura antes de avaliar dependência: cada arranjo cria formas diferentes de lock-in.'],
};

// ----------------------------------------------------------- sinais de alerta
function alertas(c, perfil) {
  const A = [];
  const add = (nivel, texto, cap) => A.push({ nivel, texto, cap });
  const desc = ((c.problema || '') + ' ' + (c.resultado || '')).toLowerCase();
  if (/\b(ia|inteligência artificial|chatgpt|gpt|chatbot|copiloto|tutor|algoritmo|plataforma|software|aplicativo)\b/.test(desc))
    add('atencao', 'A descrição do problema ou do resultado menciona tecnologia. Se, ao retirar a palavra "IA", a proposta deixa de explicar o problema, a definição precisa ser refeita.', 3);
  if (c.linhaBase === 'nao') add('bloqueio', 'Não há linha de base. Sem ela não é possível avaliar mudança e o sucesso tende a ser redefinido depois.', 3);
  if (c.linhaBase === 'parcial') add('atencao', 'A linha de base é parcial. Registre a lacuna e como será medida antes da intervenção.', 3);
  if (!c.alternativaSemIA) add('atencao', 'Nenhuma alternativa sem IA foi comparada. Adotar uma alternativa sem IA é um resultado legítimo do Ponto de decisão 2.', 4);
  // v9: funções que não podem ser terceirizadas deixaram de ser pergunta (recomendação fixa no plano, B2)
  if (c.autonomia >= 5 && (c.consequencias || []).some(k => ['nota', 'acesso', 'disciplina', 'apoio_est', 'recursos'].includes(k)))
    add('bloqueio', 'Execução automática em decisão de consequência sobre pessoas. Considere transformar a execução em apoio à decisão antes de adicionar controles.', 6);
  if (c.autonomia === 6) add('atencao', 'Execução encadeada: defina que ações o sistema pode executar, que dados acessa e quando a pessoa intervém.', 5);
  if (perfil.P.contestacao === 'critico' || (c.contestacao === 'nao' && (c.consequencias || []).some(k => k !== 'nenhuma')))
    add('bloqueio', 'A saída afeta pessoas e não há caminho de contestação. Quando não há remediação plausível para uma consequência grave, o nível de risco aceitável diminui.', 6);
  if (c.treino === 'sim') add('bloqueio', 'Os dados podem ser usados pelo fornecedor para treinar ou melhorar modelos. Isso deve ser proibido ou condicionado como obrigação contratual, e não como configuração.', 7);
  const dadoPessoal = (c.dados || []).some(k => ['pessoais_serv', 'pessoais_est', 'sensiveis'].includes(k));
  if (c.treino === 'nao_sei' && dadoPessoal) add('atencao', 'Não se sabe se os dados serão usados para treinamento. A explicação sobre o destino dos dados não pode depender de afirmações genéricas do fornecedor.', 7);
  if (c.pilotoGratuito) add('atencao', 'Piloto gratuito: o custo pode não estar na licença, mas na dependência criada durante a experimentação. Registre antes os ativos que o piloto produzirá e o destino deles se o fornecedor não for escolhido.', 14);
  if ((c.usuarios || []).includes('estudantes') && (c.afetados || []).includes('criancas') && (c.classes || []).some(k => ['geracao', 'tutoria'].includes(k)))
    add('atencao', 'Interação generativa direta com crianças: explicações e mecanismos de contestação precisam ser compreensíveis para elas, e a exposição pode durar anos.', 6);
  if ((c.classes || []).includes('previsao')) add('atencao', 'Previsão não é explicação causal: a associação não diz o que fazer. Defina a ação útil depois do alerta e quem a executa.', 4);
  if ((c.classes || []).includes('tutoria') || ((c.classes || []).length >= 3)) add('atencao', 'Rótulos como "tutor" ou "plataforma" escondem vários casos de uso. Preencha um canvas para cada função e aprove-as separadamente.', 5);
  if (c.verificabilidade === 'nao') add('atencao', 'A instituição não consegue verificar como as saídas são produzidas. Sem registro de versões e fontes, a evidência não pode ser vinculada à configuração em uso.', 9);
  // R7 (REC-13, E6): o alerta cita a arquitetura de fato presumida (não sempre "produto pago por licença"). Com uma
  // decisão perto (proposta, renovação, orçamento) é ponto de atenção; nos outros casos, informação.
  if (c.__arqPresumida || c.arquitetura === 'indefinida') {
    const txt = alertaArqPresumida(c);
    if (txt) add(['proposta', 'renovar', 'orcamento'].includes(c.situacao) ? 'atencao' : 'info', txt, 9);
  }
  if (perfil.alto && Math.max(+c.elegiveis || 0, +c.alcance || 0) >= 10000 && ['caso', 'critica'].includes(formaSupervisao(c, perfil)))
    add('atencao', 'Revisão humana caso a caso em grande volume: teste se há tempo real para revisar no volume previsto após a expansão.', 17);
  if (c.situacao === 'renovar') add('info', 'Renovar é uma nova decisão pública. Compare com as alternativas de hoje, não com a situação de antes da contratação.', 19);
  if (c.situacao === 'incidente') add('info', 'Corrigir o sistema não é o mesmo que reparar a consequência. Remediar pode exigir corrigir registros, repetir avaliações e comunicar as pessoas afetadas.', 18);
  const ordem = { bloqueio: 0, atencao: 1, info: 2 };
  return A.sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
}

// R7 (REC-13): texto do alerta de arquitetura presumida, por arquitetura e por haver ou não tecnologia escolhida.
// Frases inteiras (e não montadas por partes) para a tradução por frase.
const ALERTA_ARQ_PRESUMIDA = {
  semTec: {
    saas: 'A tecnologia ainda não foi escolhida. A estimativa presume um produto pronto pago por licença (SaaS); o custo e a dependência mudam muito entre as opções. Confirme a arquitetura na pergunta 3.2.1.',
    api: 'A tecnologia ainda não foi escolhida. A estimativa presume uma aplicação que usa um modelo de IA por API, pago pelo uso; o custo e a dependência mudam muito entre as opções. Confirme a arquitetura na pergunta 3.2.1.',
    ow: 'A tecnologia ainda não foi escolhida. A estimativa presume um modelo de pesos abertos em servidores contratados; o custo e a dependência mudam muito entre as opções. Confirme a arquitetura na pergunta 3.2.1.',
  },
  comTec: {
    saas: 'A arquitetura não foi informada na pergunta 3.2.1. A estimativa presume um produto pronto pago por licença (SaaS), deduzido das respostas sobre tecnologia, pagamento e licença. Confirme, porque o custo e a dependência mudam muito entre as opções.',
    api: 'A arquitetura não foi informada na pergunta 3.2.1. A estimativa presume uma aplicação que usa um modelo de IA por API, pago pelo uso, deduzida das respostas sobre tecnologia, pagamento e licença. Confirme, porque o custo e a dependência mudam muito entre as opções.',
    ow: 'A arquitetura não foi informada na pergunta 3.2.1. A estimativa presume um modelo de pesos abertos em servidores contratados, deduzido das respostas sobre tecnologia, pagamento e licença. Confirme, porque o custo e a dependência mudam muito entre as opções.',
  },
};
function alertaArqPresumida(c) {
  c = c || {};
  const arq = ['saas', 'api', 'ow'].includes(c.arquitetura) ? c.arquitetura : 'saas';   // 'indefinida' → SaaS (cfgDoCaso)
  const semTec = !c.tipoTec || c.tipoTec === 'nao_sei';
  return ALERTA_ARQ_PRESUMIDA[semTec ? 'semTec' : 'comTec'][arq];
}

// ----------------------------------------------------------- nota normativa (R7, REC-50, E13; ETI-14)
// Data de aplicação das obrigações do Regulamento Europeu de IA para os sistemas de alto risco do Anexo III.
// A data só entra no texto quando `verificadoEm` está preenchido (AAAA-MM-DD) por quem conferiu a fonte; sem isso,
// a nota manda verificar a data na legislação aplicável (as referências "a verificar" não entram no texto: decisão do
// painel). Situação em 28/10/2026: o art. 113 do Regulamento (UE) 2024/1689 fixa 2 de agosto de 2026, e a proposta de
// simplificação (Digital Omnibus) adia a data para até 2 de dezembro de 2027; a versão anterior da ferramenta citava
// "dezembro de 2027". Não foi possível conferir se o adiamento foi publicado, por isso `verificadoEm` fica vazio.
// Para citar a data: preencha `data`, `rotulo` (frase em português, traduzida por tr()) e `verificadoEm`.
const AI_ACT_APLICACAO = {
  data: '2027-12-02',
  rotulo: 'dezembro de 2027',
  fonte: 'Regulamento (UE) 2024/1689, art. 113, com a alteração proposta pelo pacote de simplificação Digital Omnibus (a verificar)',
  verificadoEm: '',
};
const dataAiActVerificada = (k = AI_ACT_APLICACAO) => !!(k && /^\d{4}-\d{2}-\d{2}$/.test(k.verificadoEm || '') && k.data && k.rotulo);
// Perfilamento: previsão ou classificação individual de estudantes com dados pessoais (ex.: alerta precoce de
// abandono). Não está listado de forma expressa no Anexo III, ponto 3, mas o perfilamento torna de alto risco qualquer
// uso do Anexo III (art. 6(3)) e, com decisão de efeito relevante, há o direito de revisão de decisão automatizada.
function perfilamento(c) {
  c = c || {};
  const dd = c.dados || [];
  return (c.classes || []).includes('previsao') && (dd.includes('pessoais_est') || dd.includes('sensiveis'));
}
const CONSEQ_RELEVANTE = ['nota', 'acesso', 'disciplina', 'apoio_est', 'recursos'];
/**
 * Nota normativa do caso, ou null. { categorias: anexoIII(c), perfilamento, decisao, data: AI_ACT_APLICACAO | null,
 * paragrafos: [frases em PT, para tr()] }. A primeira frase muda se há categorias do Anexo III; a de perfilamento
 * entra quando há perfilamento; a última cita a data só se ela foi verificada.
 */
function notaNormativa(c) {
  c = c || {};
  const cat = anexoIII(c), perf = perfilamento(c);
  if (!cat.length && !perf) return null;
  const decisao = (c.consequencias || []).some(k => CONSEQ_RELEVANTE.includes(k));
  const P = [];
  if (cat.length) P.push('O uso descrito corresponde a categorias que o Regulamento Europeu de IA classifica como de alto risco na educação (Anexo III, ponto 3):');
  if (perf) P.push(decisao
    ? 'O uso faz perfilamento de estudantes (previsão individual com dados pessoais) e apoia decisões com efeito sobre eles. Na legislação europeia, o perfilamento torna de alto risco os usos do Anexo III, e a pessoa afetada tem direito a pedir revisão humana de decisões automatizadas. Confirme a classificação com a assessoria jurídica.'
    : 'O uso faz perfilamento de estudantes (previsão individual com dados pessoais). Na legislação europeia, o perfilamento torna de alto risco os usos do Anexo III. Confirme a classificação com a assessoria jurídica.');
  const ok = dataAiActVerificada();
  P.push(ok ? 'Obrigações aplicáveis a partir de ' + AI_ACT_APLICACAO.rotulo + '. Verifique a legislação da jurisdição aplicável.'
    : 'Verifique na legislação da jurisdição aplicável a partir de quando essas obrigações valem.');
  return { categorias: cat, perfilamento: perf, decisao, data: ok ? AI_ACT_APLICACAO : null, paragrafos: P };
}

// Frases novas do pacote R7 (para a extração de traduções)
const TEXTOS_REC_R7 = [
  ...Object.values(ALERTA_ARQ_PRESUMIDA.semTec), ...Object.values(ALERTA_ARQ_PRESUMIDA.comTec),
  'O uso faz perfilamento de estudantes (previsão individual com dados pessoais) e apoia decisões com efeito sobre eles. Na legislação europeia, o perfilamento torna de alto risco os usos do Anexo III, e a pessoa afetada tem direito a pedir revisão humana de decisões automatizadas. Confirme a classificação com a assessoria jurídica.',
  'O uso faz perfilamento de estudantes (previsão individual com dados pessoais). Na legislação europeia, o perfilamento torna de alto risco os usos do Anexo III. Confirme a classificação com a assessoria jurídica.',
  'Verifique na legislação da jurisdição aplicável a partir de quando essas obrigações valem.',
  'Análise jurídica da classificação na jurisdição aplicável (o uso envolve perfilamento de estudantes)',
  'Revisão caso a caso dos alertas (volume)',
  'Testes adversariais antes do teste com crianças',
];

function formaSupervisao(c, perfil) {
  const alto = perfil.alto;
  if (c.autonomia >= 5) return alto ? 'critica' : 'excecao';
  if (alto && +c.elegiveis < 10000) return 'caso';
  if (alto) return 'excecao';
  if (c.autonomia <= 2) return 'amostra';
  return 'excecao';
}

// ----------------------------------------------------------- critérios adicionais por caso
function extrasPD(n, c, perfil) {
  const X = [];
  const alto = perfil.alto;
  const crianca = (c.afetados || []).includes('criancas');
  if (n === 1 && c.linhaBase !== 'sim') X.push('Medir a linha de base antes de qualquer piloto (hoje: ' + (c.linhaBase === 'parcial' ? 'parcial' : 'inexistente') + ')');
  if (n === 2 && c.situacao === 'proposta') X.push('A proposta recebida foi comparada como uma alternativa entre outras, e não como ponto de partida');
  if (n === 3) {
    if (alto) X.push('Avaliação de impacto à proteção de dados, controles de acesso reforçados e proibição de reúso');
    if (crianca) X.push('Mecanismo de contestação utilizável por crianças e famílias, com linguagem adequada à idade');
    if ((c.dados || []).includes('sensiveis')) X.push('Inferências sensíveis tratadas como dado sensível, inclusive em registros e saídas');
    if (anexoIII(c).length) X.push('Análise jurídica da classificação na jurisdição aplicável (o uso corresponde a categorias de alto risco do Regulamento Europeu)');
    else if (perfilamento(c)) X.push('Análise jurídica da classificação na jurisdição aplicável (o uso envolve perfilamento de estudantes)');
  }
  if (n === 4) {
    if (alto) X.push('Evidência independente, testes por grupo e piloto com desenho comparativo');
    if (c.idiomas) X.push('Testes no nível da tarefa para cada idioma ou variedade linguística atendida');
    X.push('Degrau pretendido: ' + (OPC.degrau.find(d => d[0] === +c.degrau) || [0, ''])[1].toLowerCase() + '. Evidência mínima: ' + ESCADA[+c.degrau || 2].toLowerCase());
  }
  if (n === 5) {
    if (c.arquitetura === 'saas') X.push('Custo por usuário ativo comparado ao custo por licença, e adoção mínima que justifica a licença institucional');
    if (c.arquitetura === 'api') X.push('Limites e alertas de consumo; custo por interação estimado com chamadas auxiliares e contexto real');
    if (c.arquitetura === 'ow') X.push('Comparação com a mesma função por API no mesmo horizonte; hospedagem própria justificada por controle, não só por preço');
    if (alto) X.push('Governança proporcional ao risco orçada como custo do caso de uso (monitoramento, auditoria, avaliação de impacto)');
  }
  if (n === 6) {
    if (c.pilotoGratuito) X.push('Ativos produzidos pelo piloto gratuito e seu destino registrados antes do início');
    if (c.situacao === 'testar' || c.teste) X.push('Teste com pergunta, critérios de parada e possibilidade real de não continuar');
  }
  if (n === 7) {
    if (alto) X.push('Notificação prévia de mudanças, direito de auditoria, suspensão de funcionalidade e saída assistida');
    if (c.arquitetura === 'api') X.push('Unidades de consumo, visibilidade antes da fatura e regras para troca de versão do modelo');
    if (c.arquitetura === 'saas') X.push('Lista de funcionalidades autorizadas e mecanismo para desabilitar as não autorizadas');
  }
  if (n === 8) {
    if (alto) X.push('Indicadores mensais, desagregados por grupo, com limiares de suspensão');
    X.push('Supervisão: ' + FORMAS_SUP[formaSupervisao(c, perfil)][0].toLowerCase() + ', testada no volume real');
  }
  if (n === 9 && c.situacao === 'renovar') X.push('Custo de saída e prazo de transição comparados ao benefício futuro da alternativa');
  return X;
}

function instrumentosCaso(c, perfil) {
  const base = { nova: ['A', 'B', 'C', 'G'], proposta: ['A', 'B', 'C', 'D', 'G'], renovar: ['I', 'H', 'G', 'F'], incidente: ['H', 'B', 'F'], orcamento: ['G', 'A', 'B'], testar: ['C', 'A', 'B'] }[c.situacao] || ['A'];
  const s = new Set(base);
  if (perfil.alto) s.add('B');
  return [...s];
}

// ----------------------------------------------------------- utilitários de formato
function fmtInt(x) { return Math.round(+x || 0).toLocaleString(LOC()); }

export { TAREFAS, tarefasDe, IMPACTO_TAREFAS, MOTIVOS_TESTE, perfisSugeridos, derivarArquitetura, arquiteturaEscolhida, testeDe, papeisUsuarios, RAZAO_EST_PROF, casoEfetivo, recomendarTeste, NIVEIS, NIVEL_NOME, NIVEL_CRIT, OPC, DIMENSOES, perfilAutomatico, perfilFinal, anexoIII, AI_ACT_APLICACAO, dataAiActVerificada, perfilamento, notaNormativa, ALERTA_ARQ_PRESUMIDA, alertaArqPresumida, motivoArquitetura, verificabilidadeDe, TEXTOS_REC_R7, DILIGENCIA, PDS, DOSSIE, INSTRUMENTOS, CAPITULOS, ROTAS, ESCADA, SUPERVISAO, CONTESTACAO, FORMAS_SUP, DADOS_REQ, CONTRATO, MUDANCA, METRICAS, SEVERIDADE, PACOTE, LOCKIN, alertas, formaSupervisao, extrasPD, instrumentosCaso, fmtInt, maxNivel, ETAPAS_CRIANCAS, ORDEM_FREQ, ORDEM_REV, ORDEM_CUM, uniaoOrd, piorDe, ARQS, opcNivel };
