// Versão de teste v016: custo do plano somando as frentes (só quando todas estão na mesma moeda; nunca soma moedas).
import type { Estado14 } from '../store/tipos';
import { estadoDaFrente, frentesDoPlano, type FrenteId } from './frentes';
import { orcamentoGovernanca } from './governanca';
import { orcamentoLetramento } from './letramento';
import { orcamentoEd } from './pedagogico';
import { totalConhecido, type orcamentoV16 } from './orcamentoV016';
import { FASES_V016 } from '../domain/catalogo_v016.js';
import { t } from './textos';

type Orc = ReturnType<typeof orcamentoV16>;
export interface FrenteConsolidada { id: FrenteId; titulo: string; o: Orc }
export function orcamentoDaFrente(s: Estado14, id: FrenteId): Orc | null {
  const v = estadoDaFrente(s, id);
  return id === 'governanca' ? orcamentoGovernanca(v) : id === 'letramento' ? orcamentoLetramento(v) : id === 'educacao' ? orcamentoEd(v) as Orc : null;
}
export function consolidadoV16(s: Estado14) {
  const frentes: FrenteConsolidada[] = frentesDoPlano(s).flatMap(f => { const o = orcamentoDaFrente(s, f.id); return o ? [{ id: f.id, titulo: t(f.titulo), o }] : []; });
  const moedas = [...new Set(frentes.map(f => f.o.moeda))], mesmaMoeda = moedas.length === 1;
  const soma = (fn: (o: Orc) => number) => Math.round(frentes.reduce((n, f) => n + fn(f.o), 0) * 100) / 100;
  const fases = FASES_V016.map(p => ({ id: p.id, nome: t(p.nome),
    valor: soma(o => { const x = o.fases.find(z => z.id === p.id); return x ? x.informado + x.estimado : 0; }),
    presente: frentes.some(f => f.o.fases.some(z => z.id === p.id)) })).filter(p => p.presente);
  return { frentes, mesmaMoeda, moeda: moedas[0] || 'USD', moedas,
    informado: soma(o => o.informado), estimado: soma(o => o.estimado), conhecido: soma(o => totalConhecido(o)), faltam: frentes.reduce((n, f) => n + f.o.faltam, 0), fases };
}
