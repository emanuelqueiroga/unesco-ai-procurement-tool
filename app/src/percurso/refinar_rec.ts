// Lógica pura das perguntas novas do Refinar (pacote R8, REC-52; seção 7 de design/redesign/05-requisitos-recomendacoes.md):
// a faixa de custo e efeito da alternativa sem IA (1.2.9), o volume do resultado (1.2.10) e a revisão dos alertas (2.6.5).
// Sem React nem DOM: Controles.tsx só chama estas funções; tests/unit/rec_r8.test.ts as cobre. O formato de cada resposta é o
// que src/domain/rec_numeros.js (altCustoEfeito, volumeResultado) e src/domain/casos.js (revisao) leem.

const vazio = (v: unknown) => v === '' || v == null || !isFinite(+(v as any));
const numOuVazio = (v: unknown): number | '' => (vazio(v) ? '' : Math.max(0, +(v as any)));

/** mensagem (texto em português, para passar por t()) e variáveis */
export interface MensagemRec { k: string; vars?: Record<string, number> }

// ----------------------------------------------------------- 1.2.9 faixa de custo e efeito da alternativa
export type LinhaFaixa = 'custo' | 'efeito';
export type ColunaFaixa = 'min' | 'provavel' | 'max';
export const COLUNAS_FAIXA: ColunaFaixa[] = ['min', 'provavel', 'max'];
export interface Faixa { min: number | ''; provavel: number | ''; max: number | '' }
export interface CustoEfeito { custo: Faixa; efeito: Faixa }

/** uma faixa completa a partir do que está guardado: um número vale como "mais provável"; `valor` (formato antigo) também */
export function faixaDe(x: unknown): Faixa {
  if (x != null && typeof x === 'object') {
    const o = x as Record<string, unknown>;
    return { min: numOuVazio(o.min), provavel: numOuVazio(o.provavel != null ? o.provavel : o.valor), max: numOuVazio(o.max) };
  }
  return { min: '', provavel: numOuVazio(x), max: '' };
}
/** a resposta da 1.2.9 completa, com as duas faixas (custo e efeito) */
export function custoEfeitoDe(x: unknown): CustoEfeito {
  const o = (x != null && typeof x === 'object' ? x : {}) as Record<string, unknown>;
  return { custo: faixaDe(o.custo), efeito: faixaDe(o.efeito) };
}
/** a resposta depois de editar uma célula; valores negativos ou inválidos viram vazio */
export function faixaEditada(atual: unknown, linha: LinhaFaixa, coluna: ColunaFaixa, valor: number | ''): CustoEfeito {
  const r = custoEfeitoDe(atual);
  r[linha] = { ...r[linha], [coluna]: numOuVazio(valor) };
  return r;
}
/** o "mais provável" de custo e de efeito está preenchido? É o que o cálculo do efeito de empate lê (rec_numeros.js). */
export function faixaCompleta(atual: unknown): boolean {
  const r = custoEfeitoDe(atual);
  return +r.custo.provavel > 0 && +r.efeito.provavel > 0;
}
/** Erros de uma linha da faixa: o mínimo não pode passar do mais provável, nem este do máximo; zero no "mais provável" não vale. */
export function errosDaFaixa(f: Faixa): Partial<Record<ColunaFaixa, MensagemRec>> {
  const out: Partial<Record<ColunaFaixa, MensagemRec>> = {};
  if (f.provavel !== '' && +f.provavel === 0) out.provavel = { k: 'Informe um número maior que zero.' };
  if (f.min !== '' && f.provavel !== '' && +f.min > +f.provavel) out.min = { k: 'O mínimo não pode passar do mais provável.' };
  else if (f.min !== '' && f.max !== '' && +f.min > +f.max) out.min = { k: 'O mínimo não pode passar do máximo.' };
  if (f.max !== '' && f.provavel !== '' && +f.max < +f.provavel) out.max = { k: 'O máximo não pode ficar abaixo do mais provável.' };
  return out;
}

// ----------------------------------------------------------- 1.2.10 volume do resultado
export interface VolumeResultado { unidade: string; volume: number | ''; periodo: 'mes' | 'ano' }
export const UNIDADES_RESULTADO = ['solicitacoes', 'estudantes'];
export function volumeDe(x: unknown): VolumeResultado {
  if (x != null && typeof x === 'object') {
    const o = x as Record<string, unknown>;
    return { unidade: UNIDADES_RESULTADO.includes(String(o.unidade)) ? String(o.unidade) : '', volume: numOuVazio(o.volume), periodo: o.periodo === 'ano' ? 'ano' : 'mes' };
  }
  // um número solto vale como solicitações por mês (formato lido por rec_numeros.js)
  return { unidade: vazio(x) ? '' : 'solicitacoes', volume: numOuVazio(x), periodo: 'mes' };
}
export function volumeEditado(atual: unknown, patch: Partial<VolumeResultado>): VolumeResultado {
  const v = { ...volumeDe(atual), ...patch };
  return { unidade: UNIDADES_RESULTADO.includes(v.unidade) ? v.unidade : '', volume: numOuVazio(v.volume), periodo: v.periodo === 'ano' ? 'ano' : 'mes' };
}
/** Aviso do volume: o cálculo precisa da unidade junto com o volume, e do volume junto com a unidade. */
export function avisoVolume(v: VolumeResultado): MensagemRec | undefined {
  if (+v.volume > 0 && !v.unidade) return { k: 'Escolha também a unidade do resultado.' };
  if (v.unidade && !(+v.volume > 0)) return { k: 'Informe também o volume.' };
  return undefined;
}

// ----------------------------------------------------------- 2.6.5 revisão dos alertas
export interface RevisaoAlertas { taxaAlerta: number | ''; minutos: number | '' }
export function revisaoDe(x: unknown): RevisaoAlertas {
  const o = (x != null && typeof x === 'object' ? x : {}) as Record<string, unknown>;
  return { taxaAlerta: numOuVazio(o.taxaAlerta), minutos: numOuVazio(o.minutos) };
}
export function revisaoEditada(atual: unknown, campo: keyof RevisaoAlertas, valor: number | ''): RevisaoAlertas {
  const r = revisaoDe(atual);
  r[campo] = campo === 'taxaAlerta' && !vazio(valor) ? Math.min(100, Math.max(0, Math.round(+valor * 10) / 10)) : numOuVazio(valor);
  return r;
}
/** Erros da revisão: a taxa vai de 0 a 100% (maior que zero) e os minutos pedem um número maior que zero. O custo só entra com os dois. */
export function errosDaRevisao(r: RevisaoAlertas): Partial<Record<keyof RevisaoAlertas, MensagemRec>> {
  const out: Partial<Record<keyof RevisaoAlertas, MensagemRec>> = {};
  if (r.taxaAlerta !== '' && +r.taxaAlerta === 0) out.taxaAlerta = { k: 'Informe um número maior que zero.' };
  if (r.minutos !== '' && +r.minutos === 0) out.minutos = { k: 'Informe um número maior que zero.' };
  return out;
}
/** a revisão tem os dois números que o custo (casos.js, revisaoPorVolume) exige? */
export function revisaoCompleta(x: unknown): boolean {
  const r = revisaoDe(x);
  return +r.taxaAlerta > 0 && +r.minutos > 0;
}
/** só falta um dos dois números: a linha de revisão por volume ainda não entra no custo */
export function revisaoIncompleta(x: unknown): boolean {
  const r = revisaoDe(x);
  return (+r.taxaAlerta > 0) !== (+r.minutos > 0);
}

/** Textos em português das mensagens acima (chaves de tradução), para a extração das traduções. */
export const TEXTOS_REC_R8: string[] = [
  'Informe um número maior que zero.',
  'O mínimo não pode passar do mais provável.',
  'O mínimo não pode passar do máximo.',
  'O máximo não pode ficar abaixo do mais provável.',
  'Escolha também a unidade do resultado.',
  'Informe também o volume.',
];
