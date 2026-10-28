// Ambiente do domínio: a tabela de moedas, a moeda e o idioma são estado de módulo em src/domain/
// (antes globais da v13). Este módulo os mantém em dia com o store e oferece a formatação de números.
import moedas from '../../../data/moedas.json';
import { setTabelaMoedas, setMoeda, getMoeda, grande, din, LOC } from '../domain';
import type { Estado14 } from '../store';

setTabelaMoedas(moedas);

/** Chamar antes de calcular ou formatar com o estado `e` (barato: só troca a referência). */
let ultima: unknown = null;
export function sincronizar(e: Pick<Estado14, 'moeda'>) {
  if (ultima !== e.moeda || !getMoeda()) { setMoeda(e.moeda); ultima = e.moeda; }
}

export const fmt = {
  /** valor curto: "US$ 1,77 mi" */
  curto: (v: number) => (isFinite(v) ? grande(v) : '—'),
  /** valor por extenso: "US$ 1.770.133" */
  cheio: (v: number) => (isFinite(v) ? din(v) : '—'),
  /** inteiro com separador do idioma */
  int: (v: number | string) => { const n = +v; return isFinite(n) && String(v) !== '' ? Math.round(n).toLocaleString(LOC()) : '—'; },
};

export const MOEDAS = moedas as { fonte: string; data: string; taxas: Record<string, number> };
