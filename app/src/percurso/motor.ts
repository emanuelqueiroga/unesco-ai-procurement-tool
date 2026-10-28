// Lógica pura das perguntas do motor de custos (4.1.4 a 4.1.7): ondas de adoção (até 4 linhas, ano e % acumulado),
// campos numéricos com casas decimais e limites, a curva efetiva do caso e o texto de como o uso cresce. Sem React
// nem DOM: Controles.tsx e sintese.ts só chamam estas funções, e tests/unit/motor-perguntas.test.ts as cobre.
import { ondasValidas } from '../domain';

// ----------------------------------------------------------- ondas (4.1.5)
export const MAX_ONDAS = 4;
/** primeiro ano em que uma onda pode acontecer: o Ano 1 é a primeira etapa (4.1.2 e 3.1.1) */
export const ANO_MIN_ONDA = 2;

export interface Onda { ano: number | ''; pct: number | '' }
export type CampoOnda = 'ano' | 'pct';
/** mensagem (texto em português, para passar por t()) e variáveis */
export interface Mensagem { k: string; vars?: Record<string, number> }

const vazio = (v: unknown) => v === '' || v == null || !isFinite(+(v as any));
const numOuVazio = (v: unknown): number | '' => (vazio(v) ? '' : +(v as any));

/** as 4 linhas da tela, completando com linhas em branco o que o caso tem guardado */
export function linhasDeOndas(ondas: unknown): Onda[] {
  const L: any[] = Array.isArray(ondas) ? ondas : [];
  return Array.from({ length: MAX_ONDAS }, (_, i) => ({ ano: numOuVazio((L[i] || {}).ano), pct: numOuVazio((L[i] || {}).pct) }));
}

/** tira as linhas em branco do fim (a lista guardada no caso só vai até a última linha preenchida) */
export function compactarOndas(L: Onda[]): Onda[] {
  const out = L.slice(0, MAX_ONDAS).map((o) => ({ ano: numOuVazio(o.ano), pct: numOuVazio(o.pct) }));
  while (out.length && out[out.length - 1].ano === '' && out[out.length - 1].pct === '') out.pop();
  return out;
}

/** A lista de ondas depois de editar um campo da linha i: ano inteiro ≥ 0, porcentagem ≥ 0 (acima de 100 fica e o erro aparece). */
export function ondaEditada(ondas: unknown, i: number, campo: CampoOnda, valor: number | ''): Onda[] {
  const L = linhasDeOndas(ondas);
  if (i < 0 || i >= MAX_ONDAS) return compactarOndas(L);
  const v = vazio(valor) ? '' : campo === 'ano' ? Math.max(0, Math.round(+valor)) : Math.max(0, +valor);
  L[i] = { ...L[i], [campo]: v };
  return compactarOndas(L);
}

/** Erros de uma linha de ondas. `H` é o horizonte do caso (anos depois do Ano 0). */
export function errosDaOnda(o: Onda, H?: number): { ano?: Mensagem; pct?: Mensagem } {
  const out: { ano?: Mensagem; pct?: Mensagem } = {};
  const temAno = o.ano !== '', temPct = o.pct !== '';
  if (temAno && +o.ano < ANO_MIN_ONDA) out.ano = { k: 'Use o Ano 2 ou depois: o Ano 1 é a primeira etapa.' };
  else if (temAno && H && +o.ano > H) out.ano = { k: 'Depois do horizonte ({n} anos): esta onda não entra no custo.', vars: { n: H } };
  else if (!temAno && temPct) out.ano = { k: 'Informe também o ano.' };
  if (temPct && +o.pct > 100) out.pct = { k: 'Não pode passar de 100%.' };
  else if (temPct && +o.pct === 0) out.pct = { k: 'Informe uma porcentagem maior que zero.' };
  else if (temAno && !temPct) out.pct = { k: 'Informe também a porcentagem.' };
  return out;
}

export type AvisoOndas =
  | { tipo: 'sem_validas' }
  | { tipo: 'ultima_abaixo'; ano: number; pct: number };

/**
 * Aviso das ondas (4.1.5): sem nenhuma onda válida o motor usa a curva linear; e, se o patamar final não chega a 100%, o uso fica
 * nesse patamar depois da última onda. `ondasValidas` é o filtro do motor (ano inteiro ≥ 2, porcentagem de 0 a 100).
 */
export function avisoOndas(ondas: unknown): AvisoOndas | null {
  const v: { ano: number; pct: number }[] = ondasValidas(ondas as any);
  if (!v.length) return { tipo: 'sem_validas' };
  const patamar = Math.max(...v.map((o) => o.pct));   // o uso nunca diminui: vale o maior patamar
  const ultimo = v[v.length - 1];
  return patamar < 100 ? { tipo: 'ultima_abaixo', ano: ultimo.ano, pct: patamar } : null;
}

// ----------------------------------------------------------- campos numéricos com casas (4.1.7)
/** limite superior de campos com teto (a porcentagem de rotatividade vai de 0 a 100) */
export const MAX_POR_CAMPO: Record<string, number> = { rotacaoFormacao: 100 };
/** casas decimais de um campo `num` (4.1.7: uma casa); sem `casas`, inteiro. Em campos com casas o zero vale: 0% é uma resposta, diferente de em branco. */
export const casasDoCampo = (f: { casas?: number } | undefined): number => Math.max(0, Math.floor(+((f && f.casas) || 0)));

/** valor a gravar: arredondado às casas do campo, não negativo; '' fica ''. */
export function valorComCasas(x: number | '', casas: number): number | '' {
  if (vazio(x)) return '';
  const p = Math.pow(10, casas);
  return Math.max(0, Math.round(+x * p) / p);
}

/** mensagem do campo numérico com casas e teto: fora de 0 a max */
export function erroDeIntervalo(v: unknown, max?: number): Mensagem | undefined {
  if (vazio(v)) return undefined;
  const n = +(v as any);
  if (n < 0 || (max != null && n > max)) return { k: 'Informe um número entre 0 e {n}.', vars: { n: max ?? 0 } };
  return undefined;
}

// ----------------------------------------------------------- como o uso cresce (4.1.4 e 4.1.5)
export type TipoCurva = 'linear' | 's' | 'ondas';
export const horizonteDoCaso = (c: Record<string, any>): number => Math.max(1, Math.round(+c.horizonte || 3));

/** a curva que o motor usa: "ondas" sem nenhuma onda válida cai na linear (casos.js) */
export function curvaEfetiva(c: Record<string, any>): TipoCurva {
  const x = String(c.curva || 'linear');
  if (x === 's') return 's';
  if (x === 'ondas') return ondasValidas(c.ondas).length ? 'ondas' : 'linear';
  return 'linear';
}

export interface Crescimento {
  tipo: TipoCurva;
  /** só em ondas: as ondas válidas (ano e % acumulado), em ordem de ano */
  ondas: { ano: number; pct: number }[];
  /** só em ondas: patamar em que o uso fica depois da última onda, quando abaixo de 100% */
  patamar: number | null;
}
export function crescimentoDoCaso(c: Record<string, any>): Crescimento {
  const tipo = curvaEfetiva(c);
  if (tipo !== 'ondas') return { tipo, ondas: [], patamar: null };
  const ondas: { ano: number; pct: number }[] = ondasValidas(c.ondas);
  const patamar = Math.max(...ondas.map((o) => o.pct));
  return { tipo, ondas, patamar: patamar < 100 ? patamar : null };
}
