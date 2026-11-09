// Versão de teste v016 (04/11/2026): desafios e categorias de custo por prioridade.
// Governança: 3 desafios × 9 categorias. Educando sobre a IA: 3 desafios × 11 categorias. Educando com e sem IA:
// 8 desafios × 4 dimensões (escala e implementação = fases; infraestrutura; formação docente; recursos).
// Os IDs antigos (G1–G18, A13–A15, C1–C21, F1–F10) continuam válidos nos casos salvos, fora do fluxo.

export const PRIORIDADES_V016 = ['governar', 'sobre', 'com'];
export const NOMES_V016 = { governar: 'Governando a IA na educação', sobre: 'Educando sobre a IA', com: 'Educando com e sem IA' };
export const DESCRICOES_V016 = {
  governar: 'Regras, soberania e capacidade do setor público para a IA na educação.',
  sobre: 'Letramento em IA de professores e estudantes e currículo de IA.',
  com: 'Melhorar a aprendizagem e a inclusão, com ou sem IA.',
};

const d = (id, t, desc, extra = {}) => ({ id, t, desc, obj: t + ': __.', sub: [], tarefas: [], impactos: [], v015: true, v016: true, ...extra });
export const DESAFIOS_GOV_V016 = [
  d('G21', 'Direitos e inovação responsável', 'Regulação, sandboxes regulatórios, diretrizes e padrões.', { impactos: ['uso_responsavel', 'gestao'] }),
  d('G22', 'Soberania', 'Dados, infraestrutura e independência tecnológica.', { impactos: ['gestao'] }),
  d('G23', 'Capacidade do setor público', 'Pessoas, formação e coordenação institucional.', { impactos: ['gestao'] }),
];
export const DESAFIOS_EDU_V016 = [
  d('C31', 'Educação infantil', 'Educadores da educação infantil; conteúdo para a primeira infância.', { impactos: ['aprendizagem'], educacao: true }),
  d('C32', 'Alfabetização e numeracia fundamentais', 'Professores de alfabetização e matemática; conteúdo de leitura e numeracia.', { impactos: ['aprendizagem'], educacao: true }),
  d('C33', 'Educação STEAM', 'Professores de ciências, tecnologia, engenharia, artes e matemática.', { impactos: ['aprendizagem'], educacao: true }),
  d('C34', 'Educação inclusiva e especial', 'Professores de educação especial; conteúdo acessível.', { impactos: ['inclusao'], educacao: true }),
  d('C35', 'Educação multilíngue', 'Professores de línguas; conteúdo multilíngue.', { impactos: ['inclusao'], educacao: true }),
  d('C36', 'Educação profissional e o futuro do trabalho', 'Instrutores e formadores da educação profissional e técnica.', { impactos: ['competencias'], educacao: true }),
  d('C37', 'Educação de jovens e adultos', 'Educadores de jovens e adultos; conteúdo para adultos.', { impactos: ['aprendizagem'], educacao: true }),
  d('C38', 'Bem-estar e aprendizagem socioemocional', 'Professores e educadores de bem-estar; conteúdo socioemocional.', { impactos: ['socioemocionais'], educacao: true }),
];
/** Letramento: professores (A11), estudantes (A12) e currículo (A16) seguem; A13–A15 saem do fluxo. */
export const DESAFIOS_LIT_V016 = ['A11', 'A12', 'A16'];

/** Por desafio da educação: quem forma e quais recursos (tabela "Application across educational challenges"). */
export const DIMENSOES_EDU = {
  C31: ['Educadores da educação infantil', 'Conteúdo para a primeira infância'],
  C32: ['Professores de alfabetização e numeracia', 'Conteúdo de leitura e numeracia'],
  C33: ['Professores de STEAM', 'Conteúdo de STEAM'],
  C34: ['Professores de educação inclusiva e especial', 'Conteúdo acessível'],
  C35: ['Professores de línguas e de educação multilíngue', 'Conteúdo multilíngue'],
  C36: ['Instrutores e formadores da educação profissional', 'Conteúdo profissionalizante'],
  C37: ['Educadores de jovens e adultos', 'Conteúdo para jovens e adultos'],
  C38: ['Professores e educadores de bem-estar', 'Conteúdo socioemocional'],
};

/**
 * Categorias de custo. `desafio`: o desafio que ativa a categoria; `base`: a estimativa de referência disponível
 * (formacao, equipe, licenca, infra); `opcoes`: as cost options, marcadas dentro da linha.
 */
export const CATEGORIAS = {
  governanca: [
    { id: 'g11', n: '1.1', desafio: 'G21', nome: 'Regulação e salvaguardas de direitos humanos', opcoes: ['Classificação de segurança e risco de IA', 'Direitos e proteção de crianças', 'Proteção de dados pessoais e privacidade', 'Equidade algorítmica, não discriminação, transparência, explicabilidade e prestação de contas', 'Cibersegurança e notificação de incidentes', 'Propriedade intelectual e direitos autorais'] },
    { id: 'g12', n: '1.2', desafio: 'G21', nome: 'Sandboxes regulatórios', opcoes: ['Ambientes de teste controlados', 'Supervisão regulatória', 'Avaliações de risco'] },
    { id: 'g13', n: '1.3', desafio: 'G21', nome: 'Diretrizes e padrões', opcoes: ['Diretrizes éticas de IA para a educação', 'Diretrizes de contratação de IA e avaliação de fornecedores', 'Diretrizes de uso de IA adequado à idade', 'Políticas de uso de IA por professores e estudantes', 'Padrões de gestão de riscos de IA', 'Padrões de transparência e documentação de IA', 'Padrões de governança e segurança de dados', 'Diretrizes de garantia de qualidade e avaliação de IA'] },
    { id: 'g21', n: '2.1', desafio: 'G22', nome: 'Governança e proteção de dados e infraestrutura pública digital', opcoes: [] },
    // v018: "Data centers locais" saiu (decisão de 08/11/2026); casos salvos com ela guardam a marcação
    { id: 'g22', n: '2.2', desafio: 'G22', nome: 'Infraestrutura digital e hospedagem', opcoes: ['Serviços de nuvem soberana', 'Hospedagem segura', 'Armazenamento de dados', 'Infraestrutura de computação'] },
    { id: 'g23', n: '2.3', desafio: 'G22', nome: 'Independência tecnológica', opcoes: ['Adoção e manutenção de código aberto', 'Transferência de tecnologia', 'Customização local', 'Redução da dependência de fornecedores'] },
    { id: 'g31', n: '3.1', desafio: 'G23', nome: 'Recursos humanos especializados', base: 'equipe', opcoes: ['Especialistas em TI (IA, dados, segurança, infraestrutura)', 'Profissionais jurídicos', 'Pessoal de governança de IA', 'Especialistas em IA e educação'] },
    { id: 'g32', n: '3.2', desafio: 'G23', nome: 'Formação e desenvolvimento profissional', base: 'formacao', opcoes: [] },
    { id: 'g33', n: '3.3', desafio: 'G23', nome: 'Governança institucional e coordenação', opcoes: ['Comitês de governança', 'Coordenação interministerial', 'Estruturas institucionais de governança'] },
  ],
  letramento: [
    { id: 'l11', n: '1.1', desafio: 'A11', nome: 'Escala, duração e frequência da formação', base: 'formacao', opcoes: ['Número de professores a formar', 'Horas por curso', 'Número de cursos por professor', 'Frequência da formação', 'Duração e calendário', 'Frequência de reciclagem'] },
    { id: 'l12', n: '1.2', desafio: 'A11', nome: 'Entrega e implementação da formação', opcoes: ['Formação presencial', 'Formação online', 'Formação híbrida', 'Formação de formadores', 'Formação na escola'] },
    { id: 'l13', n: '1.3', desafio: 'A11', nome: 'Recursos e plataformas de formação', base: 'licenca', opcoes: ['Plataformas digitais de formação', 'Ferramentas e licenças de IA para a formação', 'Materiais e recursos de formação', 'Ambientes práticos de experimentação com IA'] },
    { id: 'l14', n: '1.4', desafio: 'A11', nome: 'Avaliação e certificação de competências docentes', opcoes: ['Avaliações de competências em IA', 'Certificação profissional', 'Credenciais digitais'] },
    { id: 'l15', n: '1.5', desafio: 'A11', nome: 'Desenvolvimento profissional contínuo e apoio', opcoes: ['Cursos de reciclagem', 'Comunidades de aprendizagem profissional', 'Mentoria e coaching', 'Apoio técnico e pedagógico'] },
    { id: 'l21', n: '2.1', desafio: 'A12', nome: 'Recursos de aprendizagem de letramento em IA', opcoes: ['Materiais adequados à idade', 'Atividades interativas de IA', 'Recursos educacionais abertos', 'Recursos multilíngues', 'Materiais acessíveis'] },
    { id: 'l22', n: '2.2', desafio: 'A12', nome: 'Ferramentas e ambientes de aprendizagem', base: 'licenca', opcoes: ['Plataformas de aprendizagem de IA', 'Softwares e licenças educacionais de IA', 'Ferramentas práticas de experimentação com IA', 'Recursos offline e desplugados'] },
    { id: 'l23', n: '2.3', desafio: 'A12', nome: 'Engajamento, conscientização e avaliação dos estudantes', opcoes: ['Campanhas de conscientização sobre IA', 'Clubes de IA e atividades extracurriculares', 'Oficinas para estudantes', 'Competições e desafios de IA', 'Avaliações de letramento em IA'] },
    { id: 'l31', n: '3.1', desafio: 'A16', nome: 'Desenho e desenvolvimento curricular', opcoes: ['Marcos nacionais de currículo de IA', 'Objetivos de aprendizagem por série', 'Modelos de progressão de competências', 'Integração curricular entre disciplinas', 'Consultas às partes interessadas'] },
    { id: 'l32', n: '3.2', desafio: 'A16', nome: 'Conteúdo curricular e materiais de aprendizagem', opcoes: ['Livros didáticos e guias do professor', 'Recursos curriculares digitais', 'Contextualização e localização', 'Recursos educacionais abertos'] },
    { id: 'l33', n: '3.3', desafio: 'A16', nome: 'Implementação, expansão e manutenção do currículo', opcoes: ['Pilotos do currículo', 'Implementação nacional em etapas', 'Apoio à implementação nas escolas', 'Disseminação do currículo', 'Frequência de atualização do currículo'] },
  ],
  educacao: [
    { id: 'e2', n: '2', nome: 'Infraestrutura', base: 'infra', opcoes: ['Eletricidade', 'Conectividade', 'Largura de banda', 'Dispositivos'] },
    { id: 'e3', n: '3', nome: 'Formação docente', base: 'formacao', opcoes: [] },
    { id: 'e4', n: '4', nome: 'Recursos', base: 'licenca', opcoes: ['Plataformas', 'Ferramentas de IA'] },
  ],
};

export const FASES_V016 = [
  { id: 'piloto', nome: 'Piloto', meses: 4, alcance: 5 },
  { id: 'implantacao', nome: 'Implantação', meses: 12, alcance: 33 },
  { id: 'expansao', nome: 'Expansão', meses: 12, alcance: 100 },
];
