// Perguntas do modo Essencial e vínculo resposta → trecho do plano
// (spec, "Mapa das 51 perguntas para as 24 do Essencial" e "Comportamentos que fazem a narrativa").
import { CAMPOS, CAMPO_POR_ID, QUESTOES_G, REGRAS_REC, modoTeste, percursoGovernanca } from '../domain';
import type { Capitulo } from './tipos';

export interface TelaEssencial {
  /** id da tela (o id do campo principal; 'governanca' para as seis 1.3.x) */
  id: string;
  capitulo: Capitulo;
  /** números das perguntas da v13 que a tela reúne */
  n: string[];
  /** ids dos campos de CAMPOS (ou de QUESTOES_G, g-*) que a tela responde */
  campos: string[];
  /** observação da spec (só totais, sem limite, condicional…) */
  nota?: string;
}

// v015: 23 telas; país → prioridades → etapas. A antiga situação fica preservada nos dados, sem tela no percurso.
// governança (1.3.1–1.3.6, uma tela), 2.0, 2.1.1, 2.2.1, 2.2.2+2.2.3, 2.3.4, 2.3.5, 2.3.8, 2.4.1+2.4.2, 2.4.3, 2.5.1+2.5.4,
// 2.6.2, 3.1.1, 4.1.1, 4.1.2. As demais perguntas de CAMPOS ficam no modo Refinar com a premissa padrão.
export const ESSENCIAL: TelaEssencial[] = [
  { id: 'local', capitulo: 1, n: ['1.1.2'], campos: ['pais'] },
  { id: 'prioridades', capitulo: 1, n: ['1.2.1'], campos: ['prioridades'] },
  { id: 'etapas', capitulo: 1, n: ['1.1.4', '1.1.5'], campos: ['etapas', 'grade'], nota: 'só totais; detalhe por ano em Refinar' },
  { id: 'problemas', capitulo: 1, n: ['1.2.2'], campos: ['problemas'], nota: 'sem limite; subcategorias e "outro problema" em Refinar' },
  { id: 'problema', capitulo: 1, n: ['1.2.4'], campos: ['problema'] },
  { id: 'impactos', capitulo: 1, n: ['1.2.5'], campos: ['impactos'] },
  { id: 'linhaBase', capitulo: 1, n: ['1.2.7'], campos: ['linhaBase'], nota: 'detalhes em Refinar' },
  { id: 'alternativa', capitulo: 1, n: ['1.2.8'], campos: ['alternativa'] },
  { id: 'governanca', capitulo: 1, n: ['1.3.1', '1.3.2', '1.3.3', '1.3.4', '1.3.5', '1.3.6'], campos: QUESTOES_G.map((q: any) => q.id), nota: 'uma tela; os detalhes respDet em Refinar' },
  { id: 'testes', capitulo: 2, n: ['2.0'], campos: ['testes'] },
  { id: 'tarefas', capitulo: 2, n: ['2.1.1'], campos: ['tarefas'] },
  { id: 'usuarios', capitulo: 2, n: ['2.2.1'], campos: ['usuarios'] },
  { id: 'afetados', capitulo: 2, n: ['2.2.2', '2.2.3'], campos: ['afetados', 'consequencias'] },
  { id: 'tipoTec', capitulo: 2, n: ['2.3.4'], campos: ['tipoTec'], nota: 'com "não sei"' },
  { id: 'pagamento', capitulo: 2, n: ['2.3.5'], campos: ['pagamento'], nota: 'sugerido' },
  { id: 'piloto', capitulo: 2, n: ['2.3.8'], campos: ['piloto'], nota: 'sugerido' },
  { id: 'internet', capitulo: 2, n: ['2.4.1', '2.4.2'], campos: ['internet', 'escolasInternet'], nota: '2.4.2 condicional' },
  { id: 'modeloDisp', capitulo: 2, n: ['2.4.3'], campos: ['modeloDisp'] },
  { id: 'formados', capitulo: 2, n: ['2.5.1', '2.5.4'], campos: ['formados', 'formacaoHoras'], nota: 'horas com estimativa' },
  { id: 'suporteNivel', capitulo: 2, n: ['2.6.2'], campos: ['suporteNivel'] },
  { id: 'implantacao', capitulo: 3, n: ['3.1.1'], campos: ['implantacao'], nota: 'sugerido' },
  { id: 'elegiveis', capitulo: 4, n: ['4.1.1'], campos: ['elegiveis'], nota: 'sugerido' },
  { id: 'expansao', capitulo: 4, n: ['4.1.2'], campos: ['expansao'] },
];

/** ids de todos os campos do Essencial (inclui g-*) */
export const CAMPOS_ESSENCIAIS: string[] = ESSENCIAL.flatMap(t => t.campos);
export const CAPITULOS: Capitulo[] = [1, 2, 3, 4];
export type EscopoPercurso = { ctx?: Record<string, any> };
export const GOVERNANCA: TelaEssencial[] = [
  ...ESSENCIAL.filter(t => ['local', 'prioridades', 'problemas'].includes(t.id)),
  { id: 'gov-projeto', capitulo: 1, n: [], campos: ['projetoIA'] },
  { id: 'gov-diagnostico', capitulo: 2, n: [], campos: ['govDiagnostico'] },
  { id: 'gov-instrumentos', capitulo: 2, n: [], campos: ['govInstrumentos'] },
  { id: 'gov-solucoes', capitulo: 2, n: [], campos: ['govSolucoes'] },
  { id: 'gov-atores', capitulo: 3, n: [], campos: ['govAtores'] },
  { id: 'gov-acoes', capitulo: 3, n: [], campos: ['govAcoes'] },
  { id: 'gov-capacidade', capitulo: 3, n: [], campos: ['govCapacidade'] },
  { id: 'gov-recursos', capitulo: 3, n: [], campos: ['govOrcamento'] },
  { id: 'gov-sandbox', capitulo: 3, n: [], campos: ['govSandbox'] },
  { id: 'gov-revisao', capitulo: 4, n: [], campos: ['govRevisao'] },
];
export const TODAS_TELAS = [...ESSENCIAL, ...GOVERNANCA.filter(t => !ESSENCIAL.some(e => e.id === t.id))];
export function telasAtivas(e?: EscopoPercurso): TelaEssencial[] {
  if (!percursoGovernanca(e?.ctx)) return ESSENCIAL;
  return GOVERNANCA.filter(t => (t.id !== 'gov-projeto' || e?.ctx?.prioridades.some((id: string) => id !== 'governar'))
    && (t.id !== 'gov-sandbox' || e?.ctx?.problemas?.includes('G15')));
}
export function telasDoCapitulo(n: Capitulo, e?: EscopoPercurso): TelaEssencial[] { return telasAtivas(e).filter(t => t.capitulo === n); }
export function telaDoCampo(campo: string): TelaEssencial | undefined { return TODAS_TELAS.find(t => t.campos.includes(campo) || (campo === 'redeNacional' && t.id === 'problemas')); }
export function essencial(campo: string): boolean { return CAMPOS_ESSENCIAIS.includes(campo); }
// Campos que o Refinar grava em ctx/caso mas que não são perguntas de CAMPOS (subcategorias e "Outro problema" do 1.2.2).
// ondeMora (caso.ts) procura o campo em CAMPO_POR_ID para saber se mora em ctx; sem este registro eles iriam para `caso`.
{
  const reg: any = CAMPO_POR_ID;
  for (const id of [...GOVERNANCA.flatMap(t => t.campos), 'frenteAtiva', 'govSelecoes', 'govDetalhes']) { if (!reg[id]) reg[id] = { id, onde: 'ctx', tipo: 'extra', passo: '' }; }
  reg.redeNacional = { id: 'redeNacional', onde: 'ctx', tipo: 'extra', passo: '' };
  if (!reg.subs) reg.subs = { id: 'subs', onde: 'ctx', tipo: 'extra', passo: '' };
  if (!reg.problemaOutro) reg.problemaOutro = { id: 'problemaOutro', onde: 'ctx', tipo: 'extra', passo: '' };
}
/** capítulo dos campos de detalhe que não são perguntas de CAMPOS */
const CAPITULO_EXTRA: Record<string, Capitulo> = { subs: 1, problemaOutro: 1, linhaBaseProblemas: 1, linhaBaseProblemaTxt: 1, linhaBaseMedida: 1 };
/** capítulo de um campo: no Essencial pela tela; fora dele pela fase do passo em CAMPOS (contexto 1, piloto 2, implantacao 3, expansao 4) */
export function capituloDoCampo(campo: string): Capitulo {
  const t = telaDoCampo(campo);
  if (t) return t.capitulo;
  if (CAPITULO_EXTRA[campo]) return CAPITULO_EXTRA[campo];
  const f: any = (CAMPOS as any[]).find(c => c.id === campo);
  const p = f ? String(f.passo) : '';
  return (p.startsWith('1') ? 1 : p.startsWith('2') ? 2 : p.startsWith('3') ? 3 : 4) as Capitulo;
}

// ----------------------------------------------------------- resposta → trechos do plano
// Trechos: 'kpi.ano0' (custo do teste), 'kpi.anual' (dotação média por exercício), 'kpi.total' (custo do ciclo),
// 'kpi.porAluno', 'A1' (teste e implantação, TXT_A1/TXT_A1_POC), 'A2' (premissas da estimativa), 'rec:<id>' (regra de REGRAS_REC).
// Tabela mínima campo → KPIs: o que entra em cfgDoCaso muda a estimativa (CAMPOS_CUSTO em fluxo.js); o contexto
// (etapas, grade) muda a demanda padrão. Os ids de regras vêm de REGRAS_REC[].campo (as regras com campo em função
// — formacao-plano, ferramentas-*, gratis-adiados, dados-* — entram pelos campos que o seu contexto lê).
const KPIS_TODOS = ['kpi.ano0', 'kpi.anual', 'kpi.total', 'kpi.porAluno'];
const KPI_POR_CAMPO: Record<string, string[]> = {
  redeNacional: KPIS_TODOS, etapas: KPIS_TODOS, grade: KPIS_TODOS, usuarios: KPIS_TODOS, elegiveis: KPIS_TODOS, tarefas: KPIS_TODOS, tipoTec: KPIS_TODOS,
  testes: ['kpi.ano0', 'kpi.total', 'A1'], piloto: ['kpi.ano0', 'kpi.total', 'A1'], poc: ['kpi.ano0', 'kpi.total', 'A1'],
  implantacao: ['kpi.anual', 'kpi.total', 'A1'], expansao: ['kpi.anual', 'kpi.total', 'A1'], horizonte: ['kpi.anual', 'kpi.total'],
  pagamento: KPIS_TODOS, licenca: ['A2'], adaptacao: ['kpi.ano0', 'kpi.total'], arquitetura: KPIS_TODOS,
  nFerramentas: ['kpi.anual', 'kpi.total'], conheceFerramentas: ['A2'], ferramentas: KPIS_TODOS,
  internet: KPIS_TODOS, escolasInternet: KPIS_TODOS, modeloDisp: ['kpi.ano0', 'kpi.total'], dispExistem: ['kpi.ano0', 'kpi.total'],
  formados: ['kpi.ano0', 'kpi.anual', 'kpi.total'], formacaoHoras: ['kpi.ano0', 'kpi.anual', 'kpi.total'], formacaoFormato: ['kpi.ano0', 'kpi.anual', 'kpi.total'],
  formacaoTipo: ['A2'], formacaoPaga: ['kpi.anual', 'kpi.total'],
  suporteQuem: ['kpi.anual', 'kpi.total'], suporteNivel: ['kpi.anual', 'kpi.total'], acompanhamento: ['kpi.anual', 'kpi.total'],
  afetados: ['A2'], consequencias: ['A2'], frequencia: ['A2'],
  // v15 (MOT-02): perguntas opcionais do motor, só no Refinar do capítulo 4 (curva, ondas, reposição dos dispositivos, rotatividade)
  curva: ['kpi.anual', 'kpi.total', 'A2'], ondas: ['kpi.anual', 'kpi.total', 'A2'],
  reposicaoDisp: ['kpi.anual', 'kpi.total', 'A2'], rotacaoFormacao: ['kpi.anual', 'kpi.total', 'A2'],
  // R8 (REC-52): respostas do Refinar que mudam o risco, e com ele a governança proporcional (casoEfetivo), ou a revisão por volume (K5.3).
  // As demais perguntas novas só mudam recomendações e números ligados a elas (REC_DAS_PERGUNTAS_REC).
  publico: KPIS_TODOS, contestacaoExiste: KPIS_TODOS, treino: KPIS_TODOS, verificacao: KPIS_TODOS,
  revisao: ['kpi.ano0', 'kpi.anual', 'kpi.total'],
};
/**
 * R8 (REC-52): as 13 perguntas novas do Refinar (seção 7 de design/redesign/05-requisitos-recomendacoes.md), por capítulo.
 * Todas são `opcional` em CAMPOS, ficam fora do Essencial (que continua com 25 telas) e, sem resposta, valem "não informado":
 * a regra dispara na variante "Decidir…" e o motor mantém a premissa de antes. `revisao` só aparece com a tarefa de alerta precoce.
 */
export const CAMPOS_REC: Record<Capitulo, string[]> = {
  1: ['publico', 'altCustoEfeito', 'volumeResultado'],
  2: ['instrumentoTeste', 'contestacaoExiste', 'momentoUso', 'treino', 'tempoJornada', 'apoioEscola', 'revisao'],
  3: ['estrategiaCompra', 'dotacao', 'verificacao'],
  4: [],
};
/** todas as perguntas de CAMPOS_REC, em ordem de capítulo */
export const CAMPOS_REC_TODOS: string[] = ([1, 2, 3, 4] as Capitulo[]).flatMap(c => CAMPOS_REC[c]);
/**
 * Regras (ids do catálogo, `rec:<id>`) que leem uma pergunta nova sem que ela conste em `campos` da regra (REGRAS_REC): R-32 (contestacaoExiste),
 * R-73 (dotacao), R-55 (estrategiaCompra), R-56 (instrumentoTeste), R-31 (revisao, as horas da revisão caso a caso) e R-17 (altCustoEfeito e
 * volumeResultado, o efeito de empate e o custo por unidade). tempoJornada, apoioEscola e publico já entram por `campos` (R-46, R-47, R-52, R-53).
 */
export const REC_DAS_PERGUNTAS_REC: Record<string, string[]> = {
  contestacaoExiste: ['rec:R-32'], dotacao: ['rec:R-73'], estrategiaCompra: ['rec:R-55'], instrumentoTeste: ['rec:R-56'],
  revisao: ['rec:R-31'], altCustoEfeito: ['rec:R-17'], volumeResultado: ['rec:R-17'],
};
/** perguntas opcionais do motor (4.1.4 a 4.1.7): só no Refinar; nunca são lacuna e, sem resposta, valem os padrões da v13 */
export const CAMPOS_MOTOR = ['curva', 'ondas', 'reposicaoDisp', 'rotacaoFormacao'];
/**
 * "De onde vem?" dos números do motor (MOT-12): a pergunta (ou as perguntas) do Refinar que o número lê e, quando não há pergunta,
 * a nota da convenção. `nota` é texto em português para o consumidor passar por t().
 *  - curva: como o uso cresce (4.1.4 e, em ondas, 4.1.5); reposicao: ciclo dos dispositivos (4.1.6); rotatividade: 4.1.7;
 *  - fases: fronteiras dos anos (convenção, sem pergunta); unicoRecorrente: o que é pagamento único e o que é recorrente.
 */
export interface FonteMotor { campos: string[]; nota?: string }
export const FONTES_MOTOR: Record<string, FonteMotor> = {
  curva: { campos: ['curva', 'ondas'] },
  reposicao: { campos: ['reposicaoDisp'] },
  rotatividade: { campos: ['rotacaoFormacao'] },
  fases: { campos: [], nota: 'As fases seguem o calendário: o Ano 0 é a prova de conceito ou o piloto, o Ano 1 é a implantação e, do Ano 2 em diante, a expansão.' },
  unicoRecorrente: { campos: [], nota: 'O pagamento único reúne a implantação, a integração, a formação inicial e a compra de dispositivos. O recorrente reúne licenças, conectividade, operação, suporte, reciclagem da formação e reposição.' },
  regime: { campos: ['elegiveis', 'expansao', 'curva', 'ondas', 'horizonte'] },
};
/** o número tem uma pergunta do motor por trás? (ids de FONTES_MOTOR com pergunta) */
export function fonteMotor(id: string): FonteMotor | null { return FONTES_MOTOR[id] || null; }
/** trechos do plano que dependem de uma pergunta do motor: o inverso de afetadosPor para os 4 campos */
export function motorQueAfeta(trecho: string): string[] { return CAMPOS_MOTOR.filter((c) => (KPI_POR_CAMPO[c] || []).includes(trecho)); }

// regras cujo `campo` é função (lê o contexto k): campos de origem declarados aqui
const REGRAS_CAMPO_FN: Record<string, string[]> = {
  'formacao-plano': ['problemas', 'prioridades'], 'ferramentas-levantar': ['nFerramentas', 'conheceFerramentas'], 'ferramentas-interop': ['ferramentas', 'nFerramentas'],
  'ferramentas-sobrepostas': ['ferramentas'], 'gratis-adiados': ['pagamento', 'tipoTec'], 'dados-acordo': ['tarefas', 'usuarios'], 'dados-base-legal': ['tarefas', 'usuarios'], 'dados-impacto': ['tarefas', 'usuarios'],
};
const GOV = QUESTOES_G.map((q: any) => q.id as string);

/** trechos do plano que a resposta a `campo` pode mudar */
export function afetadosPor(campo: string): string[] {
  const base = String(campo).split('.')[0];
  const out: string[] = [];
  const add = (x: string) => { if (!out.includes(x)) out.push(x); };
  (KPI_POR_CAMPO[base] || []).forEach(add);
  if (GOV.includes(base)) add('rec:' + base);   // cada resposta Não/Em parte/Não sei vira uma ação (ACOES_G)
  (REC_DAS_PERGUNTAS_REC[base] || []).forEach(add);
  (REGRAS_REC as any[]).forEach(r => {
    const c = typeof r.campo === 'function' ? (REGRAS_CAMPO_FN[r.id] || []) : [r.campo];
    if (c.includes(base)) add('rec:' + r.id);
  });
  return out;
}

// ----------------------------------------------------------- perguntas só do Refinar que não são campos de CAMPOS
/**
 * Detalhes de perguntas do Essencial que só existem no modo Refinar: estudantes por ano (1.1.5), subcategorias e
 * "Outro problema" (1.2.2), medida da linha de base (1.2.7) e "Qual?/O que falta?" da governança (1.3.x). `id` é o
 * que a síntese usa para o âncora (`prem-<id>`); `campos` são os campos do estado que guardam a resposta.
 */
export interface ExtraRefinar { id: string; capitulo: Capitulo; n: string; campos: string[] }
export const EXTRAS_REFINAR: ExtraRefinar[] = [
  { id: 'grade', capitulo: 1, n: '1.1.5', campos: ['etapas'] },
  { id: 'subs', capitulo: 1, n: '1.2.2', campos: ['subs'] },
  { id: 'problemaOutro', capitulo: 1, n: '1.2.2', campos: ['problemaOutro'] },
  { id: 'linhaBase', capitulo: 1, n: '1.2.7', campos: ['linhaBaseProblemas', 'linhaBaseProblemaTxt', 'linhaBaseMedida'] },
  { id: 'governanca', capitulo: 1, n: '1.3', campos: [] },
];
export function extrasDoCapitulo(capitulo: Capitulo): ExtraRefinar[] { return EXTRAS_REFINAR.filter(x => x.capitulo === capitulo); }
/** o id de âncora de um campo na síntese (`#/capitulo/:n/sintese/:campo`): campos de detalhe apontam para o seu bloco */
export function idDoFoco(campo: string): string {
  const c = String(campo || '');
  if (/^g-/.test(c)) return 'governanca';
  if (['linhaBaseProblemas', 'linhaBaseProblemaTxt', 'linhaBaseMedida'].includes(c)) return 'linhaBase';
  return c;
}
/** compara números de pergunta ("1.2.7" < "1.3" < "2.0") */
export function comparaN(a: string, b: string): number {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d; }
  return 0;
}

// ----------------------------------------------------------- ajuda da tela ("Por que perguntamos isso?")
/**
 * Textos de ajuda (`h` e `ex` do domínio, sem traduzir) de todos os campos da tela, e não só do primeiro: as telas
 * compostas (2.2.2 + 2.2.3, 1.1.4 + 1.1.5, 2.4.1 + 2.4.2…) mostram a ajuda de cada pergunta, e o tamanho do teste (2.3.8) usa as
 * variantes da prova de conceito e dos dois (`hPoc/exPoc`, `hAmbos/exAmbos`). Na governança cada linha mostra a sua.
 */
export function ajudaDaTela(caso: Record<string, any>, tela: TelaEssencial): string[] {
  const out: string[] = [];
  if (tela.id === 'governanca') return out;
  const add = (x?: unknown) => { if (typeof x === 'string' && x && !out.includes(x)) out.push(x); };
  tela.campos.forEach(c => {
    const f: any = (CAMPO_POR_ID as any)[c];
    if (!f) return;
    if (f.id === 'piloto') {
      const m = modoTeste(caso);
      if (m === 'poc') { add(f.hPoc); add(f.exPoc); } else if (m === 'ambos') { add(f.hAmbos); add(f.exAmbos); } else { add(f.h); add(f.ex); }
      return;
    }
    add(f.h); add(f.ex);
  });
  return out;
}
