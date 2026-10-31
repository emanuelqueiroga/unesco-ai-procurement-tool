import { OPC } from './framework.js';

// =====================================================================
// v13 · Prioridades, problemas e objetivos do passo 1.2 (plano/9_catalogo_prioridades.md, Anexo A)
// Redação desta ferramenta. Nenhuma referência é citada para as quatro categorias nesta versão.
// Cada problema: { id, t (problema), obj (objetivo com lacunas "__"), sub: [[id, texto]], tarefas: [ids de TAREFAS],
// impactos: [ids de OPC.impactos] }. Problemas sem tarefa de IA (tarefas: []) se resolvem sobretudo com regras e processos.
// Estado: S.ctx.prioridades (ids), S.ctx.problemas (ids), S.ctx.subs (ids), S.ctx.problemaOutro (texto).
// =====================================================================
const LACUNA = '__';
const PRIORIDADES = [
  {
    id: 'governar', nome: 'Governança de IA na educação',
    desc: 'Criar as regras, as equipes e os processos para que o uso de IA na rede seja seguro, legal, equitativo e sustentável.',
    ex: ['Uma rede sem orientações para o uso de IA por estudantes', 'Escolas que usam ferramentas gratuitas sem análise de privacidade', 'Contratos de tecnologia assinados sem estimar o custo de vários anos', 'Nenhuma pessoa responsável pelo tema'],
    problemas: [
      { id: 'G1', t: 'Não há regras claras para o uso de IA por professores e estudantes.', obj: 'Publicar orientações de uso de IA para __ escolas até __.',
        sub: [['G1a', 'Uso em sala de aula'], ['G1b', 'Tarefas e avaliações (integridade acadêmica)'], ['G1c', 'Uso por faixa etária'], ['G1d', 'Comunicação com as famílias']], tarefas: ['duvidas'], impactos: ['uso_responsavel', 'gestao'] },
      { id: 'G2', t: 'Não há uma equipe ou pessoa responsável por decidir e acompanhar o uso de IA na rede.', obj: 'Instituir uma equipe com __ áreas representadas, que se reúna a cada __ meses.',
        sub: [['G2a', 'Composição da equipe'], ['G2b', 'Atribuições e decisões'], ['G2c', 'Tempo dedicado e orçamento']], tarefas: [], impactos: ['uso_responsavel'] },
      { id: 'G3', t: 'As escolas usam ferramentas de IA gratuitas sem análise de privacidade e de proteção de dados.', obj: 'Concluir a análise de dados de __% das ferramentas em uso nas escolas até __.',
        sub: [['G3a', 'Inventário das ferramentas em uso'], ['G3b', 'Termos de uso e coleta de dados'], ['G3c', 'Dados de crianças e adolescentes'], ['G3d', 'Lista de ferramentas aprovadas']], tarefas: [], impactos: ['uso_responsavel'] },
      { id: 'G4', t: 'A rede contrata tecnologia sem estimar o custo de todo o ciclo de vida.', obj: 'Exigir a estimativa de custo de __ anos em todas as contratações de IA a partir de __.',
        sub: [['G4a', 'Custo do teste e da expansão'], ['G4b', 'Custos escondidos (formação, suporte, infraestrutura)'], ['G4c', 'Custo de saída do contrato']], tarefas: [], impactos: ['gestao'] },
      { id: 'G5', t: 'Não há regras para os dados educacionais usados ou gerados por ferramentas de IA.', obj: 'Aprovar uma política de dados que cubra acesso, guarda, compartilhamento e exclusão até __.',
        sub: [['G5a', 'Quem acessa'], ['G5b', 'Por quanto tempo se guarda'], ['G5c', 'Compartilhamento com fornecedores'], ['G5d', 'Exclusão e devolução ao fim do contrato']], tarefas: [], impactos: ['uso_responsavel'] },
      { id: 'G6', t: 'A rede não sabe quais normas se aplicam ao uso de IA nas escolas.', obj: 'Ter, até __, um levantamento das normas aplicáveis revisado pela área jurídica.',
        sub: [['G6a', 'Proteção de dados'], ['G6b', 'Direitos de crianças e adolescentes'], ['G6c', 'Compras públicas'], ['G6d', 'Normas específicas sobre IA']], tarefas: [], impactos: ['uso_responsavel'] },
      { id: 'G7', t: 'Não há como saber se o uso de IA está dando resultado ou causando problemas.', obj: 'Definir __ indicadores de uso, resultado e incidentes, com relatório a cada __ meses.',
        sub: [['G7a', 'Indicadores de uso'], ['G7b', 'Resultados de aprendizagem ou de gestão'], ['G7c', 'Incidentes e reclamações'], ['G7d', 'Avaliação independente']], tarefas: ['rotinas'], impactos: ['gestao'] },
      { id: 'G8', t: 'O acesso à IA é desigual entre escolas e pode aumentar as diferenças.', obj: 'Garantir as condições mínimas de uso em __% das escolas, incluindo as rurais, até __.',
        sub: [['G8a', 'Conexão e dispositivos'], ['G8b', 'Escolas rurais e remotas'], ['G8c', 'Estudantes com deficiência'], ['G8d', 'Línguas faladas pelos estudantes']], tarefas: ['acessibilidade'], impactos: ['desigualdade', 'inclusao'] },
      { id: 'G9', t: 'Professores e gestores não sabem a quem recorrer com dúvidas sobre o uso permitido de IA.', obj: 'Responder __% das dúvidas em até __ dias úteis.',
        sub: [['G9a', 'Canal de atendimento'], ['G9b', 'Perguntas frequentes'], ['G9c', 'Casos que vão para a equipe responsável']], tarefas: ['duvidas'], impactos: ['gestao', 'uso_responsavel'] },
      { id: 'G10', t: 'A rede depende de um único fornecedor e não tem plano para encerrar ou trocar o contrato.', obj: 'Incluir cláusulas de saída e de devolução de dados em __% dos contratos de tecnologia até __.',
        sub: [['G10a', 'Devolução e formato dos dados'], ['G10b', 'Prazo de transição'], ['G10c', 'Materiais e conteúdos produzidos'], ['G10d', 'Alternativas no mercado']], tarefas: [], impactos: ['gestao'] },
    ],
  },
  {
    id: 'sobre', nome: 'Educar sobre a IA',
    desc: 'Ensinar o que é a IA, como funciona, para que serve e quais são os seus limites e riscos: o letramento em IA de estudantes, professores, gestores e famílias.',
    ex: ['Estudantes que aceitam qualquer resposta de um chatbot', 'Professores que não sabem explicar por que uma IA erra', 'Nenhuma atividade sobre IA no currículo', 'Famílias preocupadas e sem informação'],
    formacao: true,
    problemas: [
      { id: 'A1', t: 'Estudantes usam ferramentas de IA sem entender como funcionam nem por que erram.', obj: 'Até __, __% dos estudantes de __ concluem atividades de letramento em IA.',
        sub: [['A1a', 'Como a IA aprende com dados'], ['A1b', 'Erros e respostas inventadas'], ['A1c', 'Vieses'], ['A1d', 'Uso crítico das respostas']], tarefas: ['materiais', 'pratica_ia'], impactos: ['letramento_ia', 'aprendizagem'] },
      { id: 'A2', t: 'Professores não se sentem preparados para ensinar sobre IA.', obj: 'Formar __ professores em letramento em IA até __.',
        sub: [['A2a', 'Conceitos básicos'], ['A2b', 'Uso em sala'], ['A2c', 'Ética e riscos'], ['A2d', 'Avaliação das atividades']], tarefas: ['materiais'], impactos: ['letramento_ia'], formacao: true },
      { id: 'A3', t: 'O currículo não tem conteúdos nem atividades sobre IA.', obj: 'Incluir atividades sobre IA em __ componentes ou séries até __.',
        sub: [['A3a', 'Anos iniciais'], ['A3b', 'Anos finais'], ['A3c', 'Ensino médio'], ['A3d', 'Componentes que recebem o tema']], tarefas: ['planos_aula', 'materiais'], impactos: ['letramento_ia'] },
      { id: 'A4', t: 'Faltam materiais sobre IA adequados à idade e à língua dos estudantes.', obj: 'Disponibilizar __ sequências didáticas sobre IA por etapa até __.',
        sub: [['A4a', 'Por faixa etária'], ['A4b', 'Em línguas locais'], ['A4c', 'Atividades sem computador'], ['A4d', 'Atividades com computador']], tarefas: ['materiais', 'acessibilidade'], impactos: ['letramento_ia', 'inclusao'] },
      { id: 'A5', t: 'Estudantes não reconhecem conteúdo falso ou manipulado gerado por IA.', obj: 'Até __, __% dos estudantes identificam conteúdo gerado ou manipulado por IA numa avaliação diagnóstica.',
        sub: [['A5a', 'Imagens e vídeos falsos'], ['A5b', 'Textos gerados'], ['A5c', 'Checagem de fontes']], tarefas: ['materiais', 'pratica_ia'], impactos: ['letramento_ia'] },
      { id: 'A6', t: 'Estudantes não conhecem os riscos da IA para a privacidade e os próprios dados.', obj: 'Trabalhar privacidade e dados pessoais com __% dos estudantes de __ até __.',
        sub: [['A6a', 'Dados pessoais'], ['A6b', 'Consentimento'], ['A6c', 'Rastros digitais'], ['A6d', 'Uso por crianças']], tarefas: ['materiais'], impactos: ['letramento_ia', 'uso_responsavel'] },
      { id: 'A7', t: 'Gestores escolares não entendem a IA o suficiente para decidir sobre o uso nas escolas.', obj: 'Formar __ gestores em conceitos, riscos e custos da IA até __.',
        sub: [['A7a', 'Conceitos'], ['A7b', 'Riscos e regras'], ['A7c', 'Custo do ciclo de vida'], ['A7d', 'Análise de propostas de fornecedores']], tarefas: ['duvidas'], impactos: ['letramento_ia', 'gestao'], formacao: true },
      { id: 'A8', t: 'Famílias têm dúvidas e preocupações sobre o uso de IA pelos filhos.', obj: 'Realizar __ ações de informação às famílias por ano, em __ escolas.',
        sub: [['A8a', 'O que a escola usa e por quê'], ['A8b', 'Cuidados em casa'], ['A8c', 'Canais para dúvidas']], tarefas: ['duvidas', 'materiais'], impactos: ['letramento_ia', 'gestao'] },
      { id: 'A9', t: 'Estudantes não sabem quando o uso de IA em tarefas escolares é permitido.', obj: 'Acordar, até __, regras de uso de IA em tarefas com __% das turmas de __.',
        sub: [['A9a', 'Quando o uso é permitido'], ['A9b', 'Como declarar o uso'], ['A9c', 'O que é cópia']], tarefas: ['materiais'], impactos: ['letramento_ia', 'uso_responsavel'] },
      { id: 'A10', t: 'Não se conhece o nível de letramento em IA de estudantes e professores.', obj: 'Aplicar, até __, um diagnóstico de letramento em IA a __ estudantes e __ professores.',
        sub: [['A10a', 'Estudantes'], ['A10b', 'Professores'], ['A10c', 'Gestores']], tarefas: [], impactos: ['letramento_ia'], formacao: true },
    ],
  },
  {
    id: 'com', nome: 'Educar com a IA',
    desc: 'Usar a IA para apoiar o ensino, a aprendizagem e a gestão: planejar aulas, dar retorno, oferecer prática, identificar quem precisa de apoio e atender as escolas.',
    ex: ['Estudantes do 5º ano abaixo do nível esperado em leitura', 'Baixa proficiência em matemática ao fim do ensino fundamental', 'Professores que gastam muitas horas no planejamento', 'Escolas que esperam dias por respostas da secretaria'],
    problemas: [
      { id: 'C1', t: 'Estudantes abaixo do nível esperado em leitura e escrita.', obj: 'Reduzir de __% para __% os estudantes de __ abaixo do nível adequado em leitura em __ anos.',
        sub: [['C1a', 'Alfabetização inicial'], ['C1b', 'Fluência leitora'], ['C1c', 'Produção de textos'], ['C1d', 'Outras línguas']], tarefas: ['tutoria', 'feedback_redacao', 'materiais'], impactos: ['aprendizagem', 'desigualdade'] },
      { id: 'C2', t: 'Baixa proficiência em matemática.', obj: 'Reduzir de __% para __% os estudantes de __ abaixo do nível adequado em matemática em __ anos.',
        sub: [['C2a', 'Numeracia nos anos iniciais'], ['C2b', 'Anos finais do ensino fundamental'], ['C2c', 'Ensino médio'], ['C2d', 'Resolução de problemas']], tarefas: ['tutoria', 'materiais'], impactos: ['aprendizagem'] },
      { id: 'C3', t: 'Pouca prática investigativa nas aulas de ciências.', obj: 'Chegar a __ atividades investigativas de ciências por bimestre em __ escolas.',
        sub: [['C3a', 'Anos iniciais'], ['C3b', 'Anos finais'], ['C3c', 'Ensino médio']], tarefas: ['planos_aula', 'materiais'], impactos: ['aprendizagem'] },
      { id: 'C4', t: 'Professores dedicam muitas horas ao planejamento e à adaptação de materiais.', obj: 'Reduzir em __ horas por semana o tempo de planejamento dos professores de __.',
        sub: [['C4a', 'Planos de aula'], ['C4b', 'Adaptação para estudantes com dificuldades'], ['C4c', 'Atividades e avaliações']], tarefas: ['planos_aula', 'materiais'], impactos: ['tempo_docente'] },
      { id: 'C5', t: 'Estudantes demoram a receber retorno sobre redações e tarefas.', obj: 'Dar retorno a __ redações por estudante por bimestre, em até __ dias.',
        sub: [['C5a', 'Redação'], ['C5b', 'Tarefas de casa'], ['C5c', 'Avaliações formativas']], tarefas: ['feedback_redacao', 'correcao'], impactos: ['feedback', 'tempo_docente'] },
      { id: 'C6', t: 'Estudantes com defasagem não recebem apoio individual a tempo.', obj: 'Oferecer __ horas de prática individual por semana a __ estudantes com defasagem.',
        sub: [['C6a', 'Recomposição de aprendizagens'], ['C6b', 'Turmas multisseriadas'], ['C6c', 'Reforço no contraturno']], tarefas: ['tutoria', 'alerta_precoce'], impactos: ['aprendizagem', 'desigualdade'] },
      { id: 'C7', t: 'Alta taxa de abandono escolar.', obj: 'Reduzir de __% para __% o abandono no __ em __ anos.',
        sub: [['C7a', 'Frequência irregular'], ['C7b', 'Estudantes que trabalham'], ['C7c', 'Transição entre etapas']], tarefas: ['alerta_precoce'], impactos: ['permanencia'] },
      { id: 'C8', t: 'Estudantes com deficiência ou que falam outras línguas têm pouco acesso aos materiais.', obj: 'Disponibilizar, até __, __% dos materiais em formatos acessíveis ou em __ línguas.',
        sub: [['C8a', 'Deficiência visual'], ['C8b', 'Deficiência auditiva'], ['C8c', 'Estudantes migrantes'], ['C8d', 'Línguas indígenas ou locais']], tarefas: ['acessibilidade', 'materiais'], impactos: ['inclusao'] },
      { id: 'C9', t: 'Escolas e famílias esperam dias por respostas da secretaria.', obj: 'Responder __% das dúvidas de escolas e famílias em até __ dias.',
        sub: [['C9a', 'Normas e procedimentos'], ['C9b', 'Matrícula e transferência'], ['C9c', 'Comunicados às famílias']], tarefas: ['duvidas', 'rotinas'], impactos: ['gestao'] },
      { id: 'C10', t: 'Rotinas administrativas tomam o tempo de gestores e secretarias escolares.', obj: 'Reduzir em __% o tempo gasto em __ até __.',
        sub: [['C10a', 'Documentos e relatórios'], ['C10b', 'Frequência e registros'], ['C10c', 'Organização de horários']], tarefas: ['rotinas'], impactos: ['gestao'] },
    ],
  },
  {
    id: 'para', nome: 'Educar para a era da IA',
    desc: 'Preparar os estudantes para viver, estudar e trabalhar num mundo transformado pela IA: pensamento crítico, criatividade, resolução de problemas, cidadania digital e escolhas de estudo e de carreira.',
    ex: ['Ensino médio que não discute as mudanças no trabalho', 'Estudantes com pouca prática de projetos', 'Avaliações que medem só memorização', 'Cursos técnicos desatualizados'],
    problemas: [
      { id: 'F1', t: 'O currículo não prepara os estudantes para as mudanças no trabalho trazidas pela IA.', obj: 'Revisar __ componentes ou itinerários do ensino médio até __.',
        sub: [['F1a', 'Itinerários formativos'], ['F1b', 'Educação profissional e técnica'], ['F1c', 'Orientação profissional']], tarefas: ['planos_aula', 'materiais'], impactos: ['competencias'] },
      { id: 'F2', t: 'Estudantes têm pouca prática de pensamento crítico e de argumentação.', obj: 'Até __, __% dos estudantes atingem o nível __ numa avaliação de argumentação.',
        sub: [['F2a', 'Leitura crítica'], ['F2b', 'Argumentação oral e escrita'], ['F2c', 'Análise de fontes']], tarefas: ['feedback_redacao', 'tutoria'], impactos: ['competencias', 'aprendizagem'] },
      { id: 'F3', t: 'Há poucas atividades de criatividade, projetos e resolução de problemas reais.', obj: 'Realizar __ projetos por turma por ano em __ escolas.',
        sub: [['F3a', 'Aprendizagem por projetos'], ['F3b', 'Ciência e tecnologia'], ['F3c', 'Problemas da comunidade']], tarefas: ['planos_aula', 'materiais'], impactos: ['competencias'] },
      { id: 'F4', t: 'Estudantes têm pouco contato com pensamento computacional e programação.', obj: 'Oferecer __ horas por ano de pensamento computacional a __% dos estudantes de __.',
        sub: [['F4a', 'Atividades sem computador'], ['F4b', 'Programação'], ['F4c', 'Robótica'], ['F4d', 'Dados e estatística']], tarefas: ['tutoria', 'materiais'], impactos: ['competencias'] },
      { id: 'F5', t: 'A educação profissional e técnica não acompanha o uso de IA no trabalho.', obj: 'Atualizar __ cursos técnicos com conteúdos de IA aplicada até __.',
        sub: [['F5a', 'Cursos técnicos'], ['F5b', 'Estágios e parcerias'], ['F5c', 'Certificações']], tarefas: ['materiais', 'planos_aula'], impactos: ['competencias'] },
      { id: 'F6', t: 'As avaliações medem sobretudo memorização e são fáceis de responder com IA.', obj: 'Redesenhar, até __, __% das avaliações de __ para valorizar processo, argumentação e produção própria.',
        sub: [['F6a', 'Avaliações em sala'], ['F6b', 'Trabalhos e projetos'], ['F6c', 'Avaliações externas da rede']], tarefas: ['correcao', 'materiais'], impactos: ['competencias', 'feedback'] },
      { id: 'F7', t: 'Estudantes não discutem os efeitos da IA na sociedade, na democracia e no ambiente.', obj: 'Incluir debates sobre IA e sociedade em __ componentes até __.',
        sub: [['F7a', 'Informação e democracia'], ['F7b', 'Energia e ambiente'], ['F7c', 'Direitos e trabalho']], tarefas: ['materiais'], impactos: ['competencias', 'letramento_ia'] },
      { id: 'F8', t: 'Estudantes não têm orientação para escolher estudos e carreiras num mercado em mudança.', obj: 'Oferecer, até __, orientação de estudos e carreira a __% dos estudantes do __.',
        sub: [['F8a', 'Projeto de vida'], ['F8b', 'Informações sobre profissões'], ['F8c', 'Acompanhamento individual']], tarefas: ['tutoria', 'duvidas'], impactos: ['competencias', 'permanencia'] },
      { id: 'F9', t: 'Professores não sabem como mudar as práticas de ensino para a era da IA.', obj: 'Formar __ professores em metodologias para a era da IA até __.',
        sub: [['F9a', 'Ensino por projetos'], ['F9b', 'Avaliação'], ['F9c', 'Uso pedagógico da IA']], tarefas: ['planos_aula'], impactos: ['competencias'], formacao: true },
      { id: 'F10', t: 'O acesso a oportunidades de tecnologia e IA é desigual entre escolas e grupos.', obj: 'Levar atividades de tecnologia e IA a __% das escolas rurais e periféricas até __.',
        sub: [['F10a', 'Escolas rurais'], ['F10b', 'Periferias urbanas'], ['F10c', 'Meninas em tecnologia'], ['F10d', 'Estudantes com deficiência']], tarefas: ['acessibilidade', 'tutoria'], impactos: ['desigualdade', 'inclusao'] },
    ],
  },
];
// Novos desafios de governança da v015. G1–G10 continuam válidos para casos salvos.
const DESAFIOS_GOV_V015 = [
  {
    "id": "G11",
    "t": "Criar regulamentação e orientações para IA na educação",
    "desc": "Definir usos permitidos, responsabilidades e supervisão.",
    "obj": "Criar regulamentação e orientações para IA na educação: __.",
    "sub": [],
    "tarefas": [],
    "impactos": [
      "uso_responsavel",
      "gestao"
    ],
    "v015": true
  },
  {
    "id": "G12",
    "t": "Integrar a IA à estratégia nacional de educação",
    "desc": "Definir objetivos, responsabilidades, recursos e prazos para o país.",
    "obj": "Integrar a IA à estratégia nacional de educação: __.",
    "sub": [],
    "tarefas": [],
    "impactos": [
      "uso_responsavel",
      "gestao"
    ],
    "v015": true
  },
  {
    "id": "G13",
    "t": "Fortalecer a soberania e a proteção de dados",
    "desc": "Definir quem controla, acessa e compartilha os dados educacionais.",
    "obj": "Fortalecer a soberania e a proteção de dados: __.",
    "sub": [],
    "tarefas": [],
    "impactos": [
      "uso_responsavel",
      "gestao"
    ],
    "v015": true
  },
  {
    "id": "G14",
    "t": "Desenvolver a capacidade do Estado para governar a IA",
    "desc": "Preparar equipes públicas para avaliar, contratar e supervisionar IA.",
    "obj": "Desenvolver a capacidade do Estado para governar a IA: __.",
    "sub": [],
    "tarefas": [],
    "impactos": [
      "uso_responsavel",
      "gestao"
    ],
    "v015": true
  },
  {
    "id": "G15",
    "t": "Criar um sandbox para experimentação educacional",
    "desc": "Testar usos de IA em ambiente supervisionado, com salvaguardas e critérios de avaliação.",
    "obj": "Criar um sandbox para experimentação educacional: __.",
    "sub": [],
    "tarefas": [],
    "impactos": [
      "uso_responsavel",
      "gestao"
    ],
    "v015": true
  },
  {
    "id": "G16",
    "t": "Proteger a segurança, os direitos e o bem-estar de crianças e adolescentes",
    "desc": "Prevenir danos e definir supervisão, resposta a incidentes e canais de reclamação.",
    "obj": "Proteger a segurança, os direitos e o bem-estar de crianças e adolescentes: __.",
    "sub": [],
    "tarefas": [],
    "impactos": [
      "uso_responsavel",
      "gestao"
    ],
    "v015": true
  },
  {
    "id": "G17",
    "t": "Garantir equidade e inclusão no acesso à IA",
    "desc": "Considerar acessibilidade, línguas locais e escolas com menos recursos.",
    "obj": "Garantir equidade e inclusão no acesso à IA: __.",
    "sub": [],
    "tarefas": [],
    "impactos": [
      "inclusao",
      "desigualdade"
    ],
    "v015": true
  },
  {
    "id": "G18",
    "t": "Garantir transparência, responsabilização e avaliação contínua",
    "desc": "Definir indicadores, prestação de contas e revisão das decisões sobre IA.",
    "obj": "Garantir transparência, responsabilização e avaliação contínua: __.",
    "sub": [],
    "tarefas": [],
    "impactos": [
      "uso_responsavel",
      "gestao"
    ],
    "v015": true
  }
];
PRIORIDADES.find(p => p.id === 'governar').problemas.push(...DESAFIOS_GOV_V015);
// IDs novos mantêm o significado das respostas A1–A10 já salvas. O fluxo será revisto após aprovação.
const DESAFIOS_SOBRE_V015 = [
  {
    "id": "A11",
    "t": "Letramento em IA para professores",
    "obj": "Letramento em IA para professores: __.",
    "sub": [],
    "tarefas": [],
    "impactos": [
      "letramento_ia"
    ],
    "formacao": true,
    "v015": true
  },
  {
    "id": "A12",
    "t": "Letramento em IA para estudantes",
    "obj": "Letramento em IA para estudantes: __.",
    "sub": [],
    "tarefas": [],
    "impactos": [
      "letramento_ia"
    ],
    "formacao": true,
    "v015": true
  },
  {
    "id": "A13",
    "t": "Letramento em IA para formuladores de políticas e equipes técnicas",
    "obj": "Letramento em IA para formuladores de políticas e equipes técnicas: __.",
    "sub": [],
    "tarefas": [],
    "impactos": [
      "letramento_ia"
    ],
    "formacao": true,
    "v015": true
  },
  {
    "id": "A14",
    "t": "Letramento em IA para diretores escolares",
    "obj": "Letramento em IA para diretores escolares: __.",
    "sub": [],
    "tarefas": [],
    "impactos": [
      "letramento_ia"
    ],
    "formacao": true,
    "v015": true
  },
  {
    "id": "A15",
    "t": "Letramento em IA para estudantes e egressos do ensino superior",
    "obj": "Letramento em IA para estudantes e egressos do ensino superior: __.",
    "sub": [],
    "tarefas": [],
    "impactos": [
      "letramento_ia"
    ],
    "formacao": true,
    "v015": true
  },
  {
    "id": "A16",
    "t": "Construir o currículo nacional de IA",
    "obj": "Construir o currículo nacional de IA: __.",
    "sub": [],
    "tarefas": [],
    "impactos": [
      "letramento_ia"
    ],
    "formacao": true,
    "v015": true
  }
];
PRIORIDADES.find(p => p.id === 'sobre').problemas.push(...DESAFIOS_SOBRE_V015);
const PROBLEMA_POR_ID = {};
const PRIORIDADE_DO_PROBLEMA = {};
PRIORIDADES.forEach(p => p.problemas.forEach(q => { PROBLEMA_POR_ID[q.id] = q; PRIORIDADE_DO_PROBLEMA[q.id] = p.id; }));
// Aviso do 2.1 quando todos os problemas marcados se resolvem sem uma ferramenta de IA
const AVISO_SEM_FERRAMENTA = 'Os problemas marcados se resolvem principalmente com regras e processos; uma ferramenta de IA só faz sentido se apoiar uma tarefa concreta.';
// Migração dos casos da v12 (domínio e componentes) e dos exemplos A–D (plano/9_catalogo_prioridades.md)
const MIGRA_DOMINIO = { qualificacao: 'com' };
const MIGRA_COMPS = { alfabetizacao: 'C1', matematica: 'C2', ciencias: 'C3' };
const PROBLEMAS_EXEMPLO = { A: ['C4'], B: ['C2'], C: ['C7'], D: ['C9'] };

// ----------------------------------------------------------- consultas (sem efeitos colaterais)
// Problemas marcados que pertencem a prioridades marcadas, na ordem do catálogo
function problemasMarcados(x) {
  x = x || {};
  const pr = new Set(x.prioridades || []), ps = new Set(x.problemas || []);
  const out = [];
  PRIORIDADES.forEach(p => { if (pr.has(p.id)) p.problemas.forEach(q => { if (ps.has(q.id)) out.push(q); }); });
  return out;
}
// Sugestões que nascem dos problemas: tarefas e impactos (união, na ordem das opções), descrição curta,
// modelo da situação atual e objetivos (com lacunas)
function sugestoesProblemas(x, trf) {
  const t = trf || (s => s);
  const ps = problemasMarcados(x);
  const outro = String((x || {}).problemaOutro || '').trim();
  const uni = (k, ordem) => { const s = new Set(); ps.forEach(q => (q[k] || []).forEach(v => s.add(v))); return ordem ? ordem.filter(v => s.has(v)) : [...s]; };
  const ordT = typeof OPC !== 'undefined' && OPC.tarefas ? OPC.tarefas.map(o => o[0]) : null;
  const ordI = typeof OPC !== 'undefined' && OPC.impactos ? OPC.impactos.map(o => o[0]) : null;
  const tarefas = uni('tarefas', ordT), impactos = uni('impactos', ordI);
  const textos = ps.map(q => t(q.t));
  if (outro) textos.push(outro);
  const olhando = textos.length ? textos[0].replace(/\.$/, '') + (textos.length > 1 ? ' ' + t('(e mais ' + (textos.length - 1) + ')') : '') : '';
  const objetivos = ps.map(q => q.v015 ? t(q.t) + ': __.' : t(q.obj));
  return {
    n: ps.length + (outro ? 1 : 0), problemas: ps.map(q => q.id), tarefas, impactos, olhando,
    resultado: objetivos.join('\n'),
    problema: textos.length ? t(ps.some(q => q.v015) ? 'Desafios selecionados:' : 'Na rede, hoje:') + ' ' + textos.join(' ') + ' ' + t('Quem é afetado: __. O que se sabe sobre as causas: __.') : '',
    semFerramenta: ps.length > 0 && !outro && ps.every(q => !(q.tarefas || []).length),
    formacao: ps.some(q => q.formacao) || (x && (x.prioridades || []).some(id => (PRIORIDADES.find(p => p.id === id) || {}).formacao)),
  };
}
function temLacuna(s) { return String(s || '').includes(LACUNA); }

export { LACUNA, PRIORIDADES, PROBLEMA_POR_ID, PRIORIDADE_DO_PROBLEMA, AVISO_SEM_FERRAMENTA, MIGRA_DOMINIO, MIGRA_COMPS, PROBLEMAS_EXEMPLO, problemasMarcados, sugestoesProblemas, temLacuna };
