import type { Estado14 } from "../store/tipos";
import { problemasMarcados, PROBLEMA_POR_ID } from "../domain/prioridades.js";
import { OPC, etapasAtivas, alunosEtapa, ALUNOS_POR_PROF } from "../domain";
import { orcamentoLetramento, alterarLit } from "./letramento";
import { nomePais, paisDoCaso } from "../domain/pais.js";
import { LOC } from "../domain/i18n.js";
import { t } from "./textos";
import { E, TITULOS_ED } from "./pedagogicoTitulos";
import { moedaGovernanca, orcamentoGovernanca, valorItemOrcamento } from "./governanca";
import {
  estimativaReferencia,
  itemEmReferencia,
  valorEstimado,
  totaisOrcamento,
  linhasTotais,
  notaEstimativas,
} from "./estimativasOrcamento";
export { E, TITULOS_ED };
type EstadoEd = Pick<Estado14, "ctx" | "caso" | "moeda">;
export interface OpcaoEd {
  id: string;
  texto: string;
}
export interface CampoEd {
  caminho: string;
  label: string;
  tela: string;
  opcoes?: OpcaoEd[];
  multipla?: boolean;
  numero?: boolean;
  decimal?: boolean;
  zero?: boolean;
  grupo?: string;
  nota?: string;
}
const op = (v: readonly (readonly [string, string])[]): OpcaoEd[] =>
  v.map(([id, texto]) => ({ id, texto }));
const P: OpcaoEd = {
  id: "_pendente",
  texto: E("Informação a levantar", "Information to gather"),
};
/** Decisões gerais pertencem ao conjunto de temas. Trocar os desafios conserva o conjunto anterior sem ativá-lo no novo plano. */
export function chaveEd(s: Pick<Estado14, "ctx">) {
  return (
    temasEd(s)
      .map((q) => q.id)
      .sort()
      .join("+") || "sem-temas"
  );
}
export function alterarEd(s: Pick<Estado14, "ctx">, p: string, v: any) {
  return alterarLit(
    s.ctx.educacao,
    /^(temas|contexto)(\.|$)/.test(p) ? p : "percursos." + chaveEd(s) + "." + p,
    v,
  );
}
export const lerEd = (s: Pick<Estado14, "ctx">, p: string): any =>
  p
    .split(".")
    .reduce(
      (o, k) => o?.[k],
      /^(temas|contexto)(\.|$)/.test(p)
        ? s.ctx.educacao
        : s.ctx.educacao?.percursos?.[chaveEd(s)],
    );
export const idsEd = (s: Pick<Estado14, "ctx">, p: string): string[] =>
  Array.isArray(lerEd(s, p)?.escolhas) ? lerEd(s, p).escolhas : [];
export const usaIAEd = (s: Pick<Estado14, "ctx">) =>
  idsEd(s, "intervencao.tipo").some((id) => ["ia", "mista"].includes(id));
export const digitalEd = (s: Pick<Estado14, "ctx">) =>
  usaIAEd(s) || idsEd(s, "intervencao.recursos").includes("digital");
export const testeEd = (s: Pick<Estado14, "ctx">) =>
  idsEd(s, "avaliacao.tipo").some((id) =>
    ["pedagogica", "piloto", ...(usaIAEd(s) ? ["poc", "ambos"] : [])].includes(
      id,
    ),
  );
// Temas sobrepostos usam uma única ação, uma única meta e o mesmo orçamento educacional.
const TEMA: Record<string, string> = {
  C11: "fundamentos",
  C1: "fundamentos",
  C2: "fundamentos",
  C12: "stem",
  C3: "stem",
  C13: "recuperacao",
  C6: "recuperacao",
  C14: "eja",
  C15: "acessibilidade",
  C8: "acessibilidade",
  C16: "multilingue",
  C17: "trabalho",
  F1: "trabalho",
  F8: "trabalho",
  C18: "tvet",
  F5: "tvet",
  C19: "bemestar",
  C20: "cidadania",
  F7: "cidadania",
  C21: "competencias",
  F2: "competencias",
  F3: "projetos",
  F4: "computacional",
  F6: "avaliacao",
  F9: "docentes",
  F10: "equidade",
};
// Título, objetivo sugerido, ações e indicador; nenhuma sugestão representa uma resposta confirmada.
const TEMAS: Record<string, [string, string, string[], string]> = {
  fundamentos: [
    E("Alfabetização e numeracia", "Foundational literacy and numeracy"),
    E(
      "Ampliar a aprendizagem em leitura, escrita e matemática",
      "Improve learning in reading, writing and mathematics",
    ),
    [
      E(
        "Prática orientada de leitura e matemática",
        "Guided reading and mathematics practice",
      ),
      E(
        "Apoio aos professores e materiais estruturados",
        "Teacher support and structured materials",
      ),
    ],
    E(
      "Estudantes que atingem os objetivos de aprendizagem",
      "Students meeting learning objectives",
    ),
  ],
  stem: [
    E("Educação STEM", "STEM education"),
    E(
      "Ampliar oportunidades de investigação em STEM",
      "Expand opportunities for STEM inquiry",
    ),
    [
      E("Projetos de investigação científica", "Scientific inquiry projects"),
      E(
        "Atividades práticas e resolução de problemas",
        "Practical activities and problem solving",
      ),
    ],
    E(
      "Participação e aprendizagem em projetos STEM",
      "Participation and learning in STEM projects",
    ),
  ],
  recuperacao: [
    E("Recuperação das aprendizagens", "Remedial learning"),
    E(
      "Recuperar aprendizagens ainda não consolidadas",
      "Recover learning that has not yet been consolidated",
    ),
    [
      E(
        "Tutoria e apoio em pequenos grupos",
        "Tutoring and small-group support",
      ),
      E(
        "Atividades adaptadas às necessidades de aprendizagem",
        "Activities adapted to learning needs",
      ),
    ],
    E(
      "Progresso nas aprendizagens priorizadas",
      "Progress in priority learning areas",
    ),
  ],
  eja: [
    E("Educação de jovens e adultos", "Youth and adult education"),
    E(
      "Apoiar a retomada e a conclusão dos estudos",
      "Support re-entry and completion of education",
    ),
    [
      E(
        "Horários e percursos flexíveis",
        "Flexible schedules and learning pathways",
      ),
      E(
        "Reconhecimento de saberes e apoio à permanência",
        "Recognition of prior learning and retention support",
      ),
    ],
    E(
      "Participação, permanência e conclusão dos estudos",
      "Participation, retention and completion",
    ),
  ],
  acessibilidade: [
    E("Acessibilidade e deficiência", "Accessibility and disability"),
    E(
      "Garantir participação e aprendizagem com acessibilidade",
      "Ensure accessible participation and learning",
    ),
    [
      E("Materiais em formatos acessíveis", "Materials in accessible formats"),
      E(
        "Apoio especializado e adaptações pedagógicas",
        "Specialist support and educational adaptations",
      ),
    ],
    E(
      "Acesso, participação e aprendizagem dos estudantes com deficiência",
      "Access, participation and learning for students with disabilities",
    ),
  ],
  multilingue: [
    E("Educação multilíngue", "Multilingual education"),
    E(
      "Ampliar a aprendizagem nas línguas dos estudantes",
      "Expand learning in students’ languages",
    ),
    [
      E(
        "Materiais e atividades em línguas locais",
        "Materials and activities in local languages",
      ),
      E(
        "Mediação linguística e participação das comunidades",
        "Language mediation and community participation",
      ),
    ],
    E(
      "Disponibilidade e uso de materiais nas línguas dos estudantes",
      "Availability and use of materials in students’ languages",
    ),
  ],
  trabalho: [
    E("Futuro do trabalho e orientação", "Future of work and career guidance"),
    E(
      "Preparar escolhas de estudo e trabalho em um mundo com IA",
      "Prepare study and career choices in a world with AI",
    ),
    [
      E("Orientação de estudos e carreira", "Study and career guidance"),
      E(
        "Projetos sobre mudanças no trabalho e na sociedade",
        "Projects on changes in work and society",
      ),
    ],
    E(
      "Estudantes com orientação e competências para o trabalho",
      "Students receiving guidance and developing work-related competencies",
    ),
  ],
  tvet: [
    E("Educação técnica e profissional", "Technical and vocational education"),
    E(
      "Atualizar a educação técnica e profissional",
      "Update technical and vocational education",
    ),
    [
      E(
        "Revisão de cursos e competências profissionais",
        "Review of courses and occupational competencies",
      ),
      E(
        "Parcerias, projetos e experiências de trabalho",
        "Partnerships, projects and work experience",
      ),
    ],
    E(
      "Cursos atualizados e participação em experiências profissionais",
      "Updated courses and participation in work experience",
    ),
  ],
  bemestar: [
    E("Bem-estar social e emocional", "Social and emotional well-being"),
    E(
      "Fortalecer o bem-estar e o apoio aos estudantes",
      "Strengthen student well-being and support",
    ),
    [
      E(
        "Atividades de convivência e apoio socioemocional",
        "Activities for positive relationships and social-emotional support",
      ),
      E(
        "Acolhimento e encaminhamento para apoio especializado",
        "Support and referral to specialist services",
      ),
    ],
    E(
      "Participação, percepção de bem-estar e acesso ao apoio",
      "Participation, perceived well-being and access to support",
    ),
  ],
  cidadania: [
    E("Cidadania global e digital", "Global and digital citizenship"),
    E(
      "Desenvolver cidadania e análise crítica dos efeitos da IA",
      "Develop citizenship and critical analysis of AI’s impacts",
    ),
    [
      E(
        "Debates sobre direitos, democracia e ambiente",
        "Debates on rights, democracy and the environment",
      ),
      E(
        "Projetos de cidadania e análise de fontes",
        "Citizenship projects and source analysis",
      ),
    ],
    E(
      "Participação e qualidade da análise crítica dos estudantes",
      "Participation and quality of students’ critical analysis",
    ),
  ],
  competencias: [
    E(
      "Pensamento crítico e competências interpessoais",
      "Critical thinking and interpersonal skills",
    ),
    E(
      "Desenvolver argumentação, colaboração e resolução de problemas",
      "Develop reasoning, collaboration and problem-solving skills",
    ),
    [
      E(
        "Debates, análise de fontes e argumentação",
        "Debates, source analysis and reasoning",
      ),
      E(
        "Projetos colaborativos e resolução de problemas",
        "Collaborative projects and problem solving",
      ),
    ],
    E(
      "Desempenho em rubricas de argumentação e colaboração",
      "Performance on reasoning and collaboration rubrics",
    ),
  ],
  projetos: [
    E("Criatividade e projetos", "Creativity and projects"),
    E(
      "Ampliar a criação e a resolução de problemas reais",
      "Expand creativity and real-world problem solving",
    ),
    [
      E(
        "Projetos interdisciplinares e problemas da comunidade",
        "Interdisciplinary projects and community problems",
      ),
      E(
        "Portfólios e apresentações de criações próprias",
        "Portfolios and presentations of original work",
      ),
    ],
    E(
      "Qualidade e participação em projetos autorais",
      "Quality and participation in original projects",
    ),
  ],
  computacional: [
    E("Pensamento computacional", "Computational thinking"),
    E(
      "Desenvolver pensamento computacional e compreensão de dados",
      "Develop computational thinking and understanding of data",
    ),
    [
      E(
        "Atividades desplugadas de lógica e algoritmos",
        "Unplugged logic and algorithm activities",
      ),
      E(
        "Programação, dados e robótica quando houver recursos",
        "Programming, data and robotics where resources are available",
      ),
    ],
    E(
      "Resolução de problemas de lógica e algoritmos",
      "Solving logic and algorithm problems",
    ),
  ],
  avaliacao: [
    E("Avaliação da aprendizagem", "Learning assessment"),
    E(
      "Valorizar processo, argumentação e produção própria nas avaliações",
      "Value process, reasoning and original work in assessment",
    ),
    [
      E(
        "Rubricas, portfólios e avaliação formativa",
        "Rubrics, portfolios and formative assessment",
      ),
      E(
        "Redesenho de tarefas e apresentação do processo",
        "Task redesign and presentation of the learning process",
      ),
    ],
    E(
      "Avaliações que demonstram processo e aprendizagem",
      "Assessments demonstrating process and learning",
    ),
  ],
  docentes: [
    E(
      "Práticas e formação docente",
      "Teaching practice and teacher development",
    ),
    E(
      "Apoiar mudanças nas práticas de ensino e avaliação",
      "Support changes in teaching and assessment practices",
    ),
    [
      E(
        "Formação e acompanhamento entre professores",
        "Teacher development and peer support",
      ),
      E(
        "Planejamento conjunto e revisão de práticas",
        "Joint planning and practice review",
      ),
    ],
    E(
      "Professores que aplicam e revisam novas práticas",
      "Teachers applying and reviewing new practices",
    ),
  ],
  equidade: [
    E("Equidade de oportunidades", "Equity of opportunity"),
    E(
      "Ampliar oportunidades para grupos menos atendidos",
      "Expand opportunities for underserved groups",
    ),
    [
      E(
        "Priorizar escolas e grupos com menos oportunidades",
        "Prioritize schools and groups with fewer opportunities",
      ),
      E(
        "Acessibilidade, apoio local e participação comunitária",
        "Accessibility, local support and community participation",
      ),
    ],
    E(
      "Participação e resultados por grupo e território",
      "Participation and outcomes by group and area",
    ),
  ],
};
export function temasEd(s: Pick<Estado14, "ctx">) {
  const qs = problemasMarcados(s.ctx).filter((q: any) =>
      /^[CF]\d+$/.test(q.id),
    ),
    grupos = new Map<string, any>();
  for (const q of qs) {
    const id = TEMA[q.id] || q.id,
      d = TEMAS[id] || [
        q.t,
        E(
          "Melhorar os resultados educacionais do tema",
          "Improve educational outcomes in this area",
        ),
        [
          E(
            "Revisar práticas e materiais pedagógicos",
            "Review teaching practices and materials",
          ),
        ],
        E(
          "Participação e resultados de aprendizagem",
          "Participation and learning outcomes",
        ),
      ];
    if (!grupos.has(id))
      grupos.set(id, {
        id,
        nome: d[0],
        objetivo: d[1],
        acoes: d[2],
        indicador: d[3],
        desafios: [],
      });
    grupos.get(id).desafios.push(q.id);
  }
  return [...grupos.values()] as {
    id: string;
    nome: string;
    objetivo: string;
    acoes: string[];
    indicador: string;
    desafios: string[];
  }[];
}
export const CUSTOS_ED = [
  ["equipe", E("Equipe e coordenação", "Team and coordination")],
  ["materiais", E("Materiais e acessibilidade", "Materials and accessibility")],
  [
    "formacao",
    E("Formação e apoio pedagógico", "Training and educational support"),
  ],
  ["avaliacao", E("Avaliação e acompanhamento", "Evaluation and monitoring")],
  [
    "participacao",
    E(
      "Participação e apoio aos estudantes",
      "Participation and student support",
    ),
  ],
] as const;
export function camposEd(s: EstadoEd): CampoEd[] {
  const fs: CampoEd[] = [];
  const add = (
    tela: string,
    caminho: string,
    label: string,
    ops: readonly (readonly [string, string])[],
    multipla = false,
    grupo?: string,
  ) =>
    // versão de teste: telas enxutas sem a opção "Informação a levantar" (campo sem resposta já fica pendente)
    fs.push({ tela, caminho, label, opcoes: ["ed-intervencao", "ed-tecnologia"].includes(tela) || caminho === "orcamento.periodo" ? op(ops) : [...op(ops), P], multipla, grupo });
  const num = (
    tela: string,
    caminho: string,
    label: string,
    grupo?: string,
    zero = false,
  ) =>
    fs.push({
      tela,
      caminho,
      label,
      numero: true,
      decimal: caminho.endsWith(".meta"),
      grupo,
      zero,
    });
  add(
    "ed-intervencao",
    "intervencao.tipo",
    E(
      "Como a intervenção será realizada?",
      "How will the intervention be delivered?",
    ),
    [
      ["sem", E("Sem IA", "Without AI")],
      ["ia", E("Com IA", "With AI")],
      ["mista", E("Com e sem IA", "With and without AI")],
      ["definir", E("Abordagem a definir", "Approach to be decided")],
    ],
  );
  add(
    "ed-intervencao",
    "intervencao.recursos",
    E(
      "Quais recursos pedagógicos serão usados?",
      "Which educational resources will be used?",
    ),
    [
      [
        "presencial",
        E(
          "Atividades presenciais e materiais impressos",
          "In-person activities and printed materials",
        ),
      ],
      [
        "comunidade",
        E("Projetos e apoio da comunidade", "Projects and community support"),
      ],
      [
        "digital",
        E(
          "Atividades ou materiais digitais",
          "Digital activities or materials",
        ),
      ],
    ],
    true,
  );
  for (const q of temasEd(s)) {
    add(
      "ed-objetivos",
      `temas.${q.id}.objetivo`,
      E("Objetivo de aprendizagem", "Learning objective"),
      [["objetivo", q.objetivo]],
      false,
      q.nome,
    );
    num(
      "ed-objetivos",
      `temas.${q.id}.meta`,
      E(
        "Meta ou resultado esperado — valor",
        "Target or expected outcome — value",
      ),
      q.nome,
      true,
    );
    add(
      "ed-objetivos",
      `temas.${q.id}.unidade`,
      E("Unidade da meta", "Target unit"),
      [
        [
          "percentual",
          E("Percentual de estudantes (%)", "Percentage of students (%)"),
        ],
        ["estudantes", E("Estudantes", "Students")],
        ["professores", E("Professores", "Teachers")],
        ["escolas", E("Escolas", "Schools")],
        [
          "cursos",
          E(
            "Cursos ou componentes curriculares",
            "Courses or curriculum components",
          ),
        ],
        ["pontos", E("Pontos em uma avaliação", "Assessment points")],
      ],
      false,
      q.nome,
    );
    add(
      "ed-objetivos",
      `temas.${q.id}.indicador`,
      E("Indicador sugerido", "Suggested indicator"),
      [["indicador", q.indicador]],
      false,
      q.nome,
    );
    add(
      "ed-acoes",
      `temas.${q.id}.acoes`,
      E("Ações para este tema", "Activities for this area"),
      q.acoes.map((x, i) => ["acao" + i, x]),
      true,
      q.nome,
    );
  }
  add(
    "ed-avaliacao",
    "avaliacao.tipo",
    E(
      "Como verificar se a intervenção funciona?",
      "How will you check whether the intervention works?",
    ),
    [
      [
        "continua",
        E("Avaliação durante a execução", "Evaluation during delivery"),
      ],
      [
        "pedagogica",
        E(
          "Validação pedagógica de materiais ou atividades",
          "Pedagogical validation of materials or activities",
        ),
      ],
      [
        "piloto",
        E(
          "Piloto educacional em pequena escala",
          "Small-scale educational pilot",
        ),
      ],
      ...(usaIAEd(s)
        ? ([
            [
              "poc",
              E(
                "Prova de conceito técnica da IA",
                "Technical AI proof of concept",
              ),
            ],
            [
              "ambos",
              E(
                "Prova de conceito técnica e piloto educacional",
                "Technical proof of concept and educational pilot",
              ),
            ],
          ] as [string, string][])
        : []),
    ],
  );
  add(
    "ed-avaliacao",
    "avaliacao.evidencias",
    E("Como demonstrar os resultados?", "How will outcomes be demonstrated?"),
    [
      [
        "rubricas",
        E("Rubricas e produções dos estudantes", "Rubrics and student work"),
      ],
      ["aprendizagem", E("Avaliações de aprendizagem", "Learning assessments")],
      [
        "participacao",
        E(
          "Registros de participação e conclusão",
          "Participation and completion records",
        ),
      ],
      [
        "escuta",
        E(
          "Escuta de estudantes e professores",
          "Feedback from students and teachers",
        ),
      ],
    ],
    true,
  );
  if (testeEd(s)) {
    if (
      idsEd(s, "avaliacao.tipo").some((id) => ["piloto", "ambos"].includes(id))
    )
      num(
        "ed-teste",
        "teste.escolas",
        E("Escolas na validação", "Schools in validation"),
      );
    num(
      "ed-teste",
      "teste.participantes",
      E("Participantes na validação", "Participants in validation"),
    );
    num(
      "ed-teste",
      "teste.meses",
      E("Duração da validação em meses", "Validation duration in months"),
    );
    add(
      "ed-teste",
      "teste.criterios",
      E("Critérios para continuar", "Criteria for continuing"),
      [
        [
          "aprendizagem",
          E(
            "Aprendizagem e participação demonstradas",
            "Demonstrated learning and participation",
          ),
        ],
        [
          "viabilidade",
          E(
            "Condições de execução e custo verificadas",
            "Delivery conditions and cost verified",
          ),
        ],
        [
          "seguranca",
          E(
            "Salvaguardas e acessibilidade verificadas",
            "Safeguards and accessibility verified",
          ),
        ],
      ],
      true,
    );
  }
  if (usaIAEd(s)) {
    add(
      "ed-tecnologia",
      "tecnologia.funcao",
      E("Qual função a IA terá?", "What role will AI play?"),
      [
        [
          "materiais",
          E(
            "Apoio à preparação e adaptação de materiais",
            "Support for preparing and adapting materials",
          ),
        ],
        [
          "pratica",
          E(
            "Prática orientada com supervisão docente",
            "Guided practice with teacher supervision",
          ),
        ],
        [
          "acessibilidade",
          E(
            "Acessibilidade e apoio linguístico",
            "Accessibility and language support",
          ),
        ],
        [
          "exploracao",
          E(
            "Exploração crítica de aplicações de IA",
            "Critical exploration of AI applications",
          ),
        ],
      ],
      true,
    );
    add(
      "ed-tecnologia",
      "tecnologia.solucao",
      E(
        "Como disponibilizar a solução?",
        "How will the solution be made available?",
      ),
      [
        [
          "existente",
          E(
            "Recurso já disponível na rede",
            "Resource already available in the system",
          ),
        ],
        [
          "aberto",
          E("Solução aberta ou compartilhada", "Open or shared solution"),
        ],
        ["contratar", E("Contratação a avaliar", "Procurement to be assessed")],
        [
          "desenvolver",
          E(
            "Desenvolvimento ou adaptação a avaliar",
            "Development or adaptation to be assessed",
          ),
        ],
      ],
    );
    add(
      "ed-tecnologia",
      "tecnologia.salvaguardas",
      E("Salvaguardas necessárias", "Required safeguards"),
      [
        [
          "docente",
          E(
            "Supervisão docente e revisão das respostas",
            "Teacher supervision and review of outputs",
          ),
        ],
        [
          "dados",
          E(
            "Proteção de dados e minimização da coleta",
            "Data protection and data minimization",
          ),
        ],
        [
          "criancas",
          E(
            "Proteção de crianças e canais de reclamação",
            "Child protection and complaint channels",
          ),
        ],
        [
          "inclusao",
          E(
            "Acessibilidade, equidade e alternativas de participação",
            "Accessibility, equity and alternative ways to participate",
          ),
        ],
      ],
      true,
    );
  }
  if (digitalEd(s)) {
    add(
      "ed-digital",
      "digital.conexao",
      E("Conectividade necessária", "Connectivity requirements"),
      [
        [
          "offline",
          E(
            "Atividades podem funcionar sem conexão contínua",
            "Activities can work without a continuous connection",
          ),
        ],
        [
          "disponivel",
          E(
            "Conexão disponível para o uso previsto",
            "Connectivity available for the intended use",
          ),
        ],
        [
          "ampliar",
          E(
            "Conexão precisa ser ampliada",
            "Connectivity needs to be expanded",
          ),
        ],
      ],
    );
    add(
      "ed-digital",
      "digital.dispositivos",
      E("Acesso a dispositivos", "Access to devices"),
      [
        [
          "existentes",
          E("Usar dispositivos existentes", "Use existing devices"),
        ],
        [
          "compartilhados",
          E("Organizar uso compartilhado", "Arrange shared use"),
        ],
        [
          "adquirir",
          E("Prever aquisição ou empréstimo", "Plan purchase or loan"),
        ],
      ],
    );
  }
  num(
    "ed-execucao",
    "execucao.participantes",
    E("Total de participantes únicos", "Total unique participants"),
    E("Alcance da execução", "Delivery scope"),
  );
  num(
    "ed-execucao",
    "execucao.escolas",
    E("Escolas atendidas na execução", "Schools served during delivery"),
    E("Alcance da execução", "Delivery scope"),
  );
  add(
    "ed-execucao",
    "execucao.responsavel",
    E("Responsável pela execução", "Delivery lead"),
    [
      ["ministerio", E("Ministério da Educação", "Ministry of Education")],
      [
        "curriculo",
        E("Equipe nacional de currículo", "National curriculum team"),
      ],
      [
        "redes",
        E(
          "Equipes educacionais regionais e locais",
          "Regional and local education teams",
        ),
      ],
      ["escolas", E("Equipes escolares", "School teams")],
    ],
    true,
  );
  add(
    "ed-execucao",
    "execucao.prazo",
    E("Prazo de execução", "Delivery timeline"),
    [
      ["6m", E("Até 6 meses", "Within 6 months")],
      ["12m", E("Até 12 meses", "Within 12 months")],
      ["24m", E("Até 24 meses", "Within 24 months")],
    ],
  );
  add(
    "ed-execucao",
    "execucao.apoio",
    E("Apoio aos profissionais", "Support for professionals"),
    [
      [
        "formacao",
        E(
          "Formação e acompanhamento pedagógico",
          "Training and educational support",
        ),
      ],
      [
        "pares",
        E(
          "Planejamento conjunto e apoio entre pares",
          "Joint planning and peer support",
        ),
      ],
      [
        "orientacoes",
        E(
          "Materiais de orientação e tempo de planejamento",
          "Guidance materials and planning time",
        ),
      ],
    ],
    true,
  );
  add(
    "ed-recursos",
    "orcamento.periodo",
    E("Período do orçamento", "Budget period"),
    [
      ["inicial", E("Preparação e primeiro ano", "Preparation and first year")],
      ["anual", E("Um ano de execução", "One year of delivery")],
      ["trienal", E("Três anos de execução", "Three years of delivery")],
    ],
  );
  add(
    "ed-recursos",
    "orcamento.fonte",
    E("Fonte dos valores", "Source of amounts"),
    [
      [
        "equipe",
        E(
          "Estimativas da equipe responsável",
          "Estimates from the responsible team",
        ),
      ],
      [
        "oficial",
        E("Orçamento e referências oficiais", "Budget and official references"),
      ],
      [
        "cotacoes",
        E("Cotações ou contratos existentes", "Quotes or existing contracts"),
      ],
    ],
    true,
  );
  add(
    "ed-acompanhamento",
    "revisao.responsavel",
    E("Responsável pelo acompanhamento", "Monitoring lead"),
    [
      ["equipe", E("Equipe responsável pelo programa", "Programme team")],
      [
        "avaliacao",
        E("Equipe de avaliação educacional", "Educational evaluation team"),
      ],
      [
        "escolas",
        E(
          "Equipes escolares e coordenação nacional",
          "School teams and national coordination",
        ),
      ],
    ],
    true,
  );
  add(
    "ed-acompanhamento",
    "revisao.periodicidade",
    E("Periodicidade da revisão", "Review frequency"),
    [
      ["mensal", E("Mensal", "Monthly")],
      ["trimestral", E("Trimestral", "Quarterly")],
      ["semestral", E("Semestral", "Every six months")],
      ["anual", E("Anual", "Annually")],
    ],
  );
  add(
    "ed-acompanhamento",
    "revisao.equidade",
    E(
      "Como verificar a equidade dos resultados?",
      "How will equity in outcomes be checked?",
    ),
    [
      [
        "grupos",
        E(
          "Comparar participação e resultados entre grupos",
          "Compare participation and outcomes across groups",
        ),
      ],
      [
        "territorios",
        E("Comparar escolas e territórios", "Compare schools and areas"),
      ],
      [
        "acessibilidade",
        E(
          "Revisar barreiras de acesso e participação",
          "Review barriers to access and participation",
        ),
      ],
    ],
    true,
  );
  add(
    "ed-expansao",
    "expansao.decisao",
    E("Decisão após a revisão", "Decision after review"),
    [
      [
        "manter",
        E(
          "Manter o alcance e melhorar a execução",
          "Maintain scope and improve delivery",
        ),
      ],
      [
        "ampliar",
        E(
          "Ampliar quando os critérios forem atendidos",
          "Expand when criteria are met",
        ),
      ],
      [
        "reformular",
        E(
          "Reformular ou interromper se houver problemas",
          "Redesign or stop if there are problems",
        ),
      ],
    ],
  );
  add(
    "ed-expansao",
    "expansao.criterios",
    E(
      "Condições para continuar ou ampliar",
      "Conditions for continuing or expanding",
    ),
    [
      [
        "resultados",
        E(
          "Resultados educacionais e equidade demonstrados",
          "Demonstrated educational outcomes and equity",
        ),
      ],
      [
        "recursos",
        E(
          "Equipe, orçamento e condições disponíveis",
          "Team, budget and conditions available",
        ),
      ],
      [
        "seguranca",
        E("Riscos e salvaguardas revisados", "Risks and safeguards reviewed"),
      ],
    ],
    true,
  );
  if (idsEd(s, "expansao.decisao").includes("ampliar"))
    num(
      "ed-expansao",
      "expansao.participantes",
      E(
        "Participantes únicos previstos na expansão",
        "Unique participants planned for expansion",
      ),
    );
  // Versão de teste: só o essencial para a estimativa. Os demais campos continuam guardados, fora do fluxo.
  add(
    "ed-tecnologia",
    "usoIA.quem",
    E("Quem usa a ferramenta de IA?", "Who uses the AI tool?"),
    [
      ["professores", E("Professores", "Teachers")],
      ["estudantes", E("Estudantes", "Students")],
      ["ambos", E("Professores e estudantes", "Teachers and students")],
    ],
  );
  const mantidos = ["intervencao.tipo", "usoIA.quem", "orcamento.periodo"];
  return fs.filter((f) => mantidos.includes(f.caminho) || f.caminho.startsWith("orcamento.adicionais."));
}
export function impactosPedagogicos(s: Pick<Estado14, "ctx">) {
  const qs = problemasMarcados(s.ctx).filter((q: any) =>
      /^[CF]\d+$/.test(q.id),
    ),
    ids = [...new Set(qs.flatMap((q: any) => q.impactos || []))];
  return ids.map((id) => ({
    id: String(id),
    texto: String((OPC.impactos as any[]).find((o) => o[0] === id)?.[1] || id),
  }));
}
export function campoEdRespondido(s: EstadoEd, f: CampoEd) {
  const v = lerEd(s, f.caminho);
  return f.numero
    ? v?.situacao === "a_levantar" ||
        (typeof v?.valor === "number" &&
          Number.isFinite(v.valor) &&
          (f.decimal || Number.isSafeInteger(v.valor)) &&
          v.valor >= (f.zero ? 0 : 1) &&
          (!(
            f.caminho.endsWith(".meta") &&
            idsEd(s, f.caminho.replace(/meta$/, "unidade")).includes(
              "percentual",
            )
          ) ||
            v.valor <= 100))
    : idsEd(s, f.caminho).some((id) => f.opcoes?.some((o) => o.id === id));
}
export function valorEd(s: EstadoEd, f: CampoEd) {
  const v = lerEd(s, f.caminho);
  const base = f.numero
    ? v?.situacao === "a_levantar"
      ? t(P.texto)
      : typeof v?.valor === "number"
        ? new Intl.NumberFormat(String(LOC())).format(v.valor)
        : t("Não informado")
    : idsEd(s, f.caminho)
        .filter((id) => f.opcoes?.some((o) => o.id === id))
        .map((id) => t(f.opcoes?.find((o) => o.id === id)?.texto || id))
        .join("; ") || t("Não informado");
  return base;
}
export function custosEd(s: EstadoEd) {
  return [
    ...CUSTOS_ED.map(([id, nome]) => ({ id, nome })),
    ...(usaIAEd(s)
      ? [
          {
            id: "digital",
            nome: E("Conectividade e dispositivos", "Connectivity and devices"),
          },
        ]
      : []),
    ...(usaIAEd(s)
      ? [
          {
            id: "ia",
            nome: E(
              "Solução de IA e salvaguardas",
              "AI solution and safeguards",
            ),
          },
        ]
      : []),
    ...Object.keys(lerEd(s, "orcamento.adicionais") || {}).map((id) => ({
      id,
      nome: E("Recurso adicional", "Additional resource"),
    })),
  ];
}
export function referenciasEd(s: EstadoEd, frente: string) {
  return frente === "governanca"
    ? orcamentoGovernanca(s).itens
    : frente === "letramento"
      ? orcamentoLetramento(s).itens
      : [];
}
export function orcamentoEd(s: EstadoEd) {
  const o = lerEd(s, "orcamento") || {},
    itens = custosEd(s).map((c) => {
      const v = o.itens?.[c.id] || {},
        compartilhado =
          ["governanca", "letramento"].includes(v.situacao) &&
          s.ctx.prioridades?.includes(
            v.situacao === "governanca" ? "governar" : "sobre",
          );
      const estimativa = estimativaReferencia("educacao", c.id, s),
        emRef = itemEmReferencia("educacao", c.id, v);
      const valor =
        v.situacao === "sem_custo"
          ? 0
          : v.situacao === "informado" &&
              typeof v.valor === "number" &&
              Number.isFinite(v.valor) &&
              v.valor >= 0
            ? v.valor
            : null;
      return {
        ...c,
        valor,
        compartilhado,
        referencia: String(v.referencia || ""),
        situacao: v.situacao || "",
        detalhe: String(v.detalhe || ""),
        estimativa,
        emReferencia: emRef,
        estimado: valorEstimado(estimativa, emRef),
        respondido:
          (valor !== null ||
            v.situacao === "a_estimar" ||
            emRef ||
            (compartilhado &&
              referenciasEd(s, v.situacao).some(
                (ref) => ref.id === v.referencia,
              ))) &&
          (!c.id.startsWith("adicional-") || !!o.adicionais?.[c.id]?.nome),
      };
    });
  // Custos compartilhados ficam na frente de origem: não somam aqui nem contam como faltantes desta frente.
  const tot = totaisOrcamento(
    itens.map((c) =>
      c.compartilhado
        ? { valor: null, estimado: null, conta: false, falta: false }
        : c,
    ),
    itens.every((c) => c.respondido),
  );
  const semCompartilhado = !itens.some((c) => c.compartilhado);
  return {
    itens,
    moeda: String(o.moeda || s.moeda.cod || "USD"),
    periodo: valorEd(
      s,
      camposEd(s).find((f) => f.caminho === "orcamento.periodo")!,
    ),
    subtotal: tot.informado,
    ...tot,
    total: semCompartilhado ? tot.total : null,
    totalComEstimativas: semCompartilhado ? tot.totalComEstimativas : null,
  };
}
export const TELAS_ED = [
  ["ed-intervencao", 2],
  ["ed-tecnologia", 2],
  ["ed-recursos", 3],
] as const;
/** Versão de teste: Intervenção · Uso de IA (só com IA ou mista) · Orçamento. */
export function telasEd(s: EstadoEd) {
  return TELAS_ED.filter(([id]) => id !== "ed-tecnologia" || usaIAEd(s)).map(([id]) => id);
}
export function errosEd(s: EstadoEd, tela: string): string[] {
  const e: string[] = [],
    n = (p: string) =>
      lerEd(s, p)?.situacao === "a_levantar" ? null : lerEd(s, p)?.valor;
  const a = n("execucao.participantes"),
    b = n("expansao.participantes");
  if (
    tela === "ed-expansao" &&
    idsEd(s, "expansao.decisao").includes("ampliar") &&
    typeof a === "number" &&
    typeof b === "number" &&
    b < a
  )
    e.push(
      E(
        "A expansão deve incluir pelo menos o alcance atual.",
        "Expansion must include at least the current scope.",
      ),
    );
  return e;
}
export function edRespondido(s: EstadoEd, id: string) {
  return (
    temasEd(s).length > 0 &&
    camposEd(s)
      .filter((f) => f.tela === id)
      .every((f) => campoEdRespondido(s, f)) &&
    errosEd(s, id).length === 0 &&
    (id !== "ed-recursos" || orcamentoEd(s).itens.every((i) => i.respondido))
  );
}
export function telaEdLegada(id: string) {
  return (
    (
      {
        problema: "ed-objetivos",
        impactos: "ed-objetivos",
        linhaBase: "ed-objetivos",
        alternativa: "ed-intervencao",
        governanca: "ed-tecnologia",
        testes: "ed-avaliacao",
        tarefas: "ed-tecnologia",
        usuarios: "ed-execucao",
        afetados: "ed-tecnologia",
        tipoTec: "ed-tecnologia",
        pagamento: "ed-recursos",
        piloto: "ed-teste",
        internet: "ed-digital",
        modeloDisp: "ed-digital",
        formados: "ed-execucao",
        suporteNivel: "ed-execucao",
        implantacao: "ed-execucao",
        elegiveis: "ed-execucao",
        expansao: "ed-expansao",
      } as Record<string, string>
    )[id] || id
  );
}
export function definicoesPendentesEd(s: EstadoEd) {
  return (
    camposEd(s).filter(
      (f) =>
        lerEd(s, f.caminho)?.situacao === "a_levantar" ||
        idsEd(s, f.caminho).some((id) => ["_pendente", "definir"].includes(id)),
    ).length + orcamentoEd(s).faltam
  );
}
/** Quantidades opcionais das telas Intervenção e Uso de IA (alimentam as estimativas), para o resumo. */
export function quantidadesEd(s: EstadoEd, tela: string) {
  const fmt = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v > 0 ? new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 2 }).format(v) : t("Não informado");
  if (tela === "ed-intervencao") return [
    { rotulo: t("Profissionais a formar"), valor: fmt(lerEd(s, "orcamento.quantidades.profissionais")) },
    { rotulo: t("Horas por profissional"), valor: fmt(lerEd(s, "orcamento.quantidades.horasProfissional")) },
  ];
  if (tela === "ed-tecnologia") return [{ rotulo: t(E("Usuários da ferramenta", "Tool users")), valor: fmt(usuariosIAEd(s)) }];
  return [];
}
/** Total do Contexto sugerido para os usuários da ferramenta (estudantes das etapas escolhidas); null sem sugestão. */
export function usuariosSugeridosEd(s: EstadoEd): number | null {
  const quem = idsEd(s, "usoIA.quem");
  const alunos = etapasAtivas(s.ctx).reduce((n: number, et: any) => n + alunosEtapa(s.ctx, et[0]), 0);
  if (!quem.length || alunos <= 0) return null;
  // professores: 1 para cada 25 estudantes (premissa ilustrativa da ferramenta)
  const prof = Math.max(1, Math.round(alunos / ALUNOS_POR_PROF));
  return quem.includes("ambos") ? alunos + prof : quem.includes("estudantes") ? alunos : prof;
}
/** Usuários da ferramenta: o número digitado, senão o total sugerido pelo Contexto. */
export function usuariosIAEd(s: EstadoEd): number | null {
  const v = lerEd(s, "orcamento.quantidades.usuarios");
  return typeof v === "number" && Number.isSafeInteger(v) && v > 0 ? v : usuariosSugeridosEd(s);
}
export function planoEd(s: EstadoEd) {
  const fs = camposEd(s),
    temas = temasEd(s),
    o = orcamentoEd(s),
    pendentes = definicoesPendentesEd(s),
    faltam = [
      ...(!s.caso.pais ? ["local"] : []),
      ...(!etapasAtivas(s.ctx).length ||
      !etapasAtivas(s.ctx).every(
        (et: any) =>
          Number(s.ctx.etapas?.[et[0]]?.escolas) > 0 &&
          alunosEtapa(s.ctx, et[0]) > 0,
      )
        ? ["etapas"]
        : []),
      ...(!temas.length ? ["problemas"] : []),
      ...telasEd(s).filter((id) => !edRespondido(s, id)),
    ];
  const blocos = [
    {
      titulo: t("Contexto"),
      linhas: [
        {
          rotulo: t("País"),
          valor: nomePais(paisDoCaso(s.caso)) || t("Não informado"),
        },
        ...(lerEd(s, "contexto.detalhe")
          ? [
              {
                rotulo: t("Informações adicionais"),
                valor: String(lerEd(s, "contexto.detalhe")),
              },
            ]
          : []),
        ...(s.ctx.problemaOutro
          ? [
              {
                rotulo: t("Informações adicionais"),
                valor: String(s.ctx.problemaOutro),
              },
            ]
          : []),
        ...etapasAtivas(s.ctx).map((et: any) => ({
          rotulo: t(et[1]),
          valor: t(
            E(
              "{escolas} escolas · {estudantes} estudantes",
              "{escolas} schools · {estudantes} students",
            ),
            {
              escolas: new Intl.NumberFormat(String(LOC())).format(
                Number(s.ctx.etapas?.[et[0]]?.escolas || 0),
              ),
              estudantes: new Intl.NumberFormat(String(LOC())).format(
                alunosEtapa(s.ctx, et[0]),
              ),
            },
          ),
        })),
        ...impactosPedagogicos(s).map((i) => ({
          rotulo: t(E("Impacto esperado", "Expected impact")),
          valor: t(i.texto),
        })),
        ...temas.map((q) => ({
          rotulo: t(q.nome),
          valor: q.desafios
            .map((id) =>
              t((PROBLEMA_POR_ID as Record<string, any>)[id]?.t || id),
            )
            .join("; "),
        })),
      ],
    },
    ...telasEd(s).map((id) => ({
      titulo: t(TITULOS_ED[id]),
      linhas: [
        ...fs
          .filter((f) => f.tela === id)
          .map((f) => ({
            rotulo: (f.grupo ? t(f.grupo) + " · " : "") + t(f.label),
            valor: valorEd(s, f),
          })),
        ...quantidadesEd(s, id),
      ],
    })),
  ];
  const recursos = blocos.find(
    (b) => b.titulo === t(TITULOS_ED["ed-recursos"]),
  );
  const compartilhadoTexto = (i: (typeof o.itens)[number]) =>
    t(
      E(
        "Custo compartilhado — referência: {ref}",
        "Shared cost — reference: {ref}",
      ),
      {
        ref:
          referenciasEd(s, i.situacao).find((r) => r.id === i.referencia)
            ?.nome || t("Não informado"),
      },
    );
  recursos?.linhas.push(
    ...o.itens.map((i) => {
      const base = i.compartilhado
        ? compartilhadoTexto(i)
        : i.valor !== null || i.emReferencia
          ? valorItemOrcamento(
              { ...i, referencia: i.emReferencia },
              o.moeda,
            )
          : i.situacao === "a_estimar" || i.detalhe
            ? t("Custo ainda a levantar")
            : t("Não informado");
      return {
        rotulo:
          i.nome === E("Recurso adicional", "Additional resource")
            ? t(
                String(
                  lerEd(s, "orcamento.adicionais")?.[i.id]?.nome || i.nome,
                ),
              )
            : t(i.nome),
        valor: base,
      };
    }),
    ...linhasTotais(o).map((l) => ({ rotulo: l.rotulo, valor: l.valor })),
    ...notaEstimativas(o),
  );
  return {
    titulo: t(
      E("Plano de intervenção educacional", "Educational intervention plan"),
    ),
    pais: nomePais(paisDoCaso(s.caso)),
    temas,
    blocos,
    orcamento: o,
    faltam,
    pendentes,
    proxima: !temas.length
      ? t(
          E(
            "Selecione os desafios educacionais.",
            "Select the educational challenges.",
          ),
        )
      : faltam.length || pendentes
        ? t(
            E(
              "Complete a intervenção e os valores do orçamento.",
              "Complete the intervention and the budget amounts.",
            ),
          )
        : t(
            E(
              "Revise e aprove o plano antes de iniciar a execução.",
              "Review and approve the plan before starting delivery.",
            ),
          ),
    escopo: o.estimados
      ? t(
          "Participantes e recursos são compartilhados entre temas, sem duplicar contagens ou custos. O orçamento separa os valores informados das estimativas de referência escolhidas, que são ilustrativas.",
        )
      : t(
          E(
            "Participantes e recursos são compartilhados entre temas, sem duplicar contagens ou custos. O orçamento reúne somente valores informados.",
            "Participants and resources are shared across themes without duplicating counts or costs. The budget includes only entered amounts.",
          ),
        ),
  };
}
