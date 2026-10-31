// Textos do percurso (v14): capítulos, a frase de abertura de cada pergunta e os rótulos dos trechos do plano.
// Português é a chave de tradução; `t()` traduz quando há dicionário (os textos novos entram nos
// dicionários em i18n/v14_<l>.json; até lá aparecem em português nos outros idiomas).
import { tr, nomePais, paisDoCaso, percursoGovernanca } from '../domain';
import type { Capitulo } from '../store';

export const t = (s: string, vars?: Record<string, string | number>): string => {
  let out = String(tr(s) ?? s);
  if (vars) Object.keys(vars).forEach((k) => { out = out.split('{' + k + '}').join(String(vars[k])); });
  return out;
};

export interface InfoCapitulo {
  n: Capitulo;
  titulo: string;
  guia: string;
  texto: string;
  minutos: number;
  /** o que o capítulo entrega, na página inicial */
  entrega: string;
  /** camadas de custo que o capítulo alimenta */
  alimenta: string;
}

export const CAPITULOS_INFO: Record<Capitulo, InfoCapitulo> = {
  1: {
    n: 1, titulo: 'Contexto', minutos: 7,
    guia: 'Qual é o contexto da sua rede e o que você quer melhorar?',
    texto: 'Descreva sua rede, suas prioridades e o problema que você quer resolver. Este capítulo reúne o contexto educacional, o alcance pretendido e as primeiras recomendações de governança.',
    entrega: 'contexto e prioridades do planejamento',
    alimenta: 'governança, políticas e planejamento',
  },
  2: {
    n: 2, titulo: 'Prova de conceito ou piloto', minutos: 8,
    guia: 'O que você precisa verificar antes de decidir pela implantação?',
    texto: 'Defina como avaliar a proposta antes de ampliar seu uso. Escolha uma prova de conceito, um piloto ou ambos e descreva as tarefas, os participantes e os recursos necessários. Ao final, revise a estimativa de custo do teste.',
    entrega: 'escopo e estimativa de custo da prova de conceito ou do piloto',
    // camadas 2 a 7 (2.2 e 2.3 também alimentam as camadas 4 e 5, segundo a 0.0.15)
    alimenta: 'aplicações, integração de dados, segurança e privacidade, internet e dispositivos, formação, suporte',
  },
  3: {
    n: 3, titulo: 'Implantação', minutos: 1,
    guia: 'Como iniciar o uso com o alcance e os recursos planejados?',
    texto: 'Defina o alcance inicial da implantação: quantas escolas e pessoas serão atendidas no primeiro ano de uso. O plano usa esses dados para estimar o custo dessa etapa.',
    entrega: 'alcance e estimativa de custo da implantação',
    // a 0.0.15 liga o 3.1 às camadas 2, 3 e 6; a arquitetura (3.2, camadas 4 e 5) só aparece no Refinar
    alimenta: 'aplicações, internet e dispositivos, formação (e, no Refinar, integração de dados e segurança)',
  },
  4: {
    n: 4, titulo: 'Expansão', minutos: 2,
    guia: 'Como ampliar o alcance e sustentar o uso ao longo dos anos?',
    texto: 'Informe o público previsto para a expansão e o prazo para alcançá-lo. O plano reúne as estimativas de implantação e expansão para projetar os custos ao longo do horizonte definido e apoiar a contratação.',
    entrega: 'estimativa de custo da expansão e do ciclo de vida',
    alimenta: 'todas as camadas, ao longo do horizonte',
  },
};

/** Frase de abertura de cada tela do Essencial (tom explicativo: por que a pergunta importa para o plano). */
export const LEAD: Record<string, string> = {
  nivel: 'Quem decide e paga define as regras de compra, o orçamento e quem assina o contrato.',
  local: 'O planejamento é sempre nacional. Escolha o país e, se quiser, informe a instituição responsável.',
  situacao: 'Uma proposta já recebida pede outras perguntas que uma iniciativa do zero. O plano ajusta as recomendações a esse ponto.',
  etapas: 'Selecione as etapas e informe escolas e estudantes.',
  prioridades: 'Escolha uma ou mais prioridades.',
  problemas: 'Selecione todos os desafios que fazem parte do seu plano.',
  problema: 'Um problema bem descrito, sem citar tecnologia, é o que permite comparar a IA com outras soluções.',
  impactos: 'O impacto vira o resultado esperado do teste e os indicadores do plano.',
  linhaBase: 'Sem uma medida de antes, não há como saber se o teste funcionou.',
  alternativa: 'Você já comparou ao menos uma alternativa sem IA?',
  governanca: 'Marque o que já existe no país.',
  testes: 'Testar antes de comprar reduz o risco. A escolha muda o tamanho e o custo do teste.',
  tarefas: 'A tarefa define que tipo de ferramenta procurar, quem a usa e que dados ela trata.',
  usuarios: 'Quem usa define quantas licenças, quanta formação e quantos dispositivos entram no custo.',
  afetados: 'Quanto mais a resposta da ferramenta pesa sobre crianças e adolescentes, mais salvaguardas o plano pede.',
  tipoTec: 'O tipo de tecnologia muda a forma de pagamento, as cláusulas do contrato e o custo de operação.',
  pagamento: 'A forma de pagamento muda o custo do teste e o risco de ficar preso a um fornecedor depois.',
  piloto: 'Um [[piloto]] pequeno ensina quase tanto quanto um grande e custa muito menos. Sugerimos cerca de 5% das escolas por 4 meses; mude se já tiver um plano.',
  internet: 'Conexão e dispositivos costumam custar mais do que a ferramenta. A resposta define o que entra no custo do teste.',
  modeloDisp: 'O modelo de uso define quantos dispositivos comprar ou manter.',
  formados: 'Formação é uma das maiores parcelas do custo, e a mais esquecida nos orçamentos.',
  suporteNivel: 'O suporte é custo de todos os anos, não só do teste.',
  implantacao: 'O primeiro ano de uso real costuma ser bem menor do que a rede inteira. Sugerimos um terço das pessoas; mude se já tiver um plano.',
  elegiveis: 'É a base da estimativa depois da implantação: licenças, formação e suporte crescem com esse número.',
  expansao: 'O ritmo de expansão distribui o custo pelos exercícios do orçamento.',
};

/** Rótulos dos trechos do plano que uma resposta pode mudar (afetadosPor, perguntas.ts). */
export function rotuloAfetado(id: string, H = 3): string | null {
  const R: Record<string, string> = {
    'kpi.ano0': 'custo do teste (Ano 0)',
    'kpi.anual': 'custo por ano de operação',
    'kpi.total': 'custo total em {H} anos',
    'kpi.porAluno': 'custo por estudante',
    A1: 'regras do teste e da implantação (A1)',
    A2: 'premissas da estimativa (A2)',
  };
  return R[id] ? t(R[id], { H }) : null;
}

/** "Esta resposta muda no plano: …" */
export function linhaAfeta(afetados: string[], H = 3): string {
  const partes = afetados.map((a) => rotuloAfetado(a, H)).filter(Boolean) as string[];
  const recs = afetados.filter((a) => a.startsWith('rec:')).length;
  if (recs) partes.push(recs === 1 ? t('1 recomendação possível') : t('{n} recomendações possíveis', { n: recs }));
  return partes.length ? partes.join(' · ') : t('perfil do caso');
}

export const NOME_TESTE: Record<string, string> = { poc: 'Prova de conceito', piloto: 'Piloto', ambos: 'Prova de conceito e piloto', recomendar: 'Teste a definir' };

/** Nome curto de cada tela, para a navegação lateral e a lista de pendências. */
export const CURTO: Record<string, string> = {
  nivel: 'Nível da decisão', local: 'País', situacao: 'Em que ponto você está', etapas: 'Etapas, escolas e estudantes',
  prioridades: 'Prioridades', problemas: 'Desafios', problema: 'Situação atual', impactos: 'Impacto esperado', linhaBase: 'Linha de base',
  alternativa: 'Soluções de política educacional', governanca: 'Governança de IA na educação', testes: 'Tipo de teste', tarefas: 'O que a IA faz', usuarios: 'Quem usa',
  afetados: 'Quem é afetado', tipoTec: 'Tipo de tecnologia', pagamento: 'Pagamento', piloto: 'Tamanho do teste', internet: 'Internet',
  modeloDisp: 'Dispositivos', formados: 'Formação', suporteNivel: 'Suporte', implantacao: 'Implantação', elegiveis: 'Pessoas na rede',
  expansao: 'Ritmo de expansão',
};

/** Título de cada tela: a pergunta da v13 (traduzida pelos dicionários existentes) ou um título próprio da tela composta. */
export const TITULO_TELA: Record<string, string> = {
  local: 'Qual país você está planejando?',
  prioridades: 'Prioridades',
  problemas: 'Quais desafios você quer enfrentar?',
  alternativa: 'Soluções de política educacional',
  etapas: 'Etapas, escolas e estudantes',
  governanca: 'Governança de IA na educação',
  afetados: 'Quem é afetado pelo que a ferramenta produz?',
  formados: 'Quem será formado, e por quantas horas?',
  internet: 'As escolas têm internet adequada para o uso previsto?',
};

/** "1 recomendação" / "7 recomendações": as duas formas são chaves de tradução. */
export const plural = (n: number, um: string, varios: string) => (n === 1 ? t(um, { n }) : t(varios, { n }));

/** Minúsculas para inserir um rótulo no meio da frase, sem estragar siglas: "Educar com a IA" → "educar com a IA". */
export const minusc = (s: string) => String(s ?? '').split(/(\s+)/).map((w) => ((w.match(/\p{Lu}/gu) || []).length >= 2 ? w : w.toLocaleLowerCase())).join('');
/** Só a primeira letra em minúscula (para frases que já trazem nomes próprios). */
export const minusc1 = (s: string) => { const v = String(s ?? ''); return /^\p{Lu}\p{Lu}/u.test(v) ? v : v.charAt(0).toLocaleLowerCase() + v.slice(1); };

/**
 * Textos novos das telas do pacote R6 (recomendações no relatório; chaves de tradução para o orquestrador). Os do
 * relatório e do PDF estão em plano/recplano.js (TEXTOS_REC_R6), plano/secoes.js (TEXTOS_REC_R6_SECOES),
 * plano/relatorio.js (TXT_REL: simP50, simP90) e plano/pdf.js (PDF_TXT: verSeq, cuidado, proxima).
 */
export const TEXTOS_REC_R6_TELAS = [
  'Ver a sequência de decisões e o plano de ação', 'Contadores do plano', 'Ainda sem recomendações',
  'Ver todas as {n} recomendações, por pacote', 'Como testar e avaliar', 'cenário-base',
  'A próxima decisão, o que responder antes, os portões entre as etapas, como testar e avaliar e as ações deste caso por pacote. Cada ação tem o seu número (R-nn) e a pergunta que a originou: se mudar a resposta, a lista muda.',
  'Nenhuma condição aberta', '1 condição aberta', '{0} condições abertas', '{n} condição', '{n} condições',
  'Como a arquitetura não foi definida, o modelo usa {arq} como ponto de partida (presumida; confirme na pergunta 3.2.1).',
];

/** Rótulos da revisão v015; os ids e as respostas de governança continuam os mesmos. */
export function tituloGovernanca(id: string, caso: Record<string, unknown>, original: string): string {
  if (id === 'g-politica') return t('Incorporar a IA à estratégia nacional de educação');
  if (id === 'g-legislacao') {
    const pais = nomePais(paisDoCaso(caso));
    return pais ? t('Regulamentação em {pais}', { pais }) : t('Regulamentação no país');
  }
  const curtos: Record<string, string> = {
    'g-comite': 'Há um departamento ou uma equipe designada para IA na educação?',
    'g-dados': 'Há política de dados educacionais?',
    'g-etica': 'Há normas de ética ou de uso responsável de IA?',
    'g-compras': 'Há orientação para comprar e contratar IA?',
  };
  return t(curtos[id] || original);
}

export const GOVERNANCA_INFO: Record<Capitulo, InfoCapitulo> = {
  1: CAPITULOS_INFO[1],
  2: { n: 2, titulo: 'Diagnóstico institucional', guia: 'O que já existe e quais lacunas precisam ser resolvidas?', texto: '', minutos: 5, entrega: '', alimenta: '' },
  3: { n: 3, titulo: 'Plano de ação e recursos', guia: 'Quem fará o quê, até quando e com quais recursos?', texto: '', minutos: 8, entrega: '', alimenta: '' },
  4: { n: 4, titulo: 'Acompanhamento e revisão', guia: 'Como acompanhar os resultados e revisar a política?', texto: '', minutos: 3, entrega: '', alimenta: '' },
};
export function infoCapitulo(n: Capitulo, s?: { ctx?: Record<string, any> }): InfoCapitulo {
  return percursoGovernanca(s?.ctx) ? GOVERNANCA_INFO[n] : CAPITULOS_INFO[n];
}
Object.assign(CURTO, {
 'gov-projeto': 'Projeto de uso de IA', 'gov-diagnostico': 'Lacunas e resultados', 'gov-instrumentos': 'Instrumentos e evidências',
 'gov-solucoes': 'Soluções de política educacional', 'gov-atores': 'Instituições e grupos afetados', 'gov-acoes': 'Ações e responsabilidades',
 'gov-capacidade': 'Capacidade institucional', 'gov-recursos': 'Recursos e orçamento', 'gov-sandbox': 'Experimentação supervisionada', 'gov-revisao': 'Indicadores e revisão',
});
