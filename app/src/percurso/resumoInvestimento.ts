// v022.1: "Resumo do investimento" do resumo para decisão: um quadro com uma linha por prioridade escolhida (CapEx, OpEx,
// custo de utilidades e total, no período do plano e na moeda escolhida pela pessoa) e, para cada prioridade, uma tabela
// com as categorias. Os números são os mesmos do plano: nada é recalculado aqui.
import type { Estado14 } from '../store/tipos';
import { percursoGovernanca, percursoEducacaoV20, percursoCombinado, percursoLetramentoV23, prioridadesNoCombinado } from '../domain';
import { t } from './textos';
import { orcamentoV16, matrizFases, totalConhecido } from './orcamentoV016';
import { orcamentoEducacao, CATEGORIAS_ED } from './educacaoV20';

export interface LinhaInvestimento { rotulo: string; k: number; x: number; u: number; total: number; semValor?: boolean }
export interface PrioridadeInvestimento extends LinhaInvestimento { id: 'governanca' | 'letramento' | 'educacao'; descricao: string; meses: number; categorias: LinhaInvestimento[]; /** educação: total da alternativa sem IA */ semIA?: number }
export interface ResumoInvestimento { moeda: string; meses: number; mesesIguais: boolean; prioridades: PrioridadeInvestimento[]; total: LinhaInvestimento; pctOperacaoUso: number | null }

const r2 = (v: number) => Math.round(v * 100) / 100;
const somaLinhas = (rotulo: string, ls: LinhaInvestimento[]): LinhaInvestimento =>
  ({ rotulo, k: r2(ls.reduce((n, l) => n + l.k, 0)), x: r2(ls.reduce((n, l) => n + l.x, 0)), u: r2(ls.reduce((n, l) => n + l.u, 0)), total: r2(ls.reduce((n, l) => n + l.total, 0)) });

function governanca(s: Pick<Estado14, 'ctx' | 'moeda'>, f: 'governanca' | 'letramento' = 'governanca'): PrioridadeInvestimento {
  const o = orcamentoV16(s as any, f);
  const categorias = matrizFases(o).filter(l => !l.nivel).map(l => {
    const total = l.total ?? 0, k = l.capex ?? 0, u = l.uso ?? 0;
    return { rotulo: (l.n ? l.n + ' ' : '') + l.nome, k, u, x: r2(total - k - u), total, semValor: l.total === null };
  });
  const total = totalConhecido(o), k = Number(o.capex) || 0, u = Number(o.uso) || 0;
  const nome = f === 'governanca' ? { rotulo: t('Governança'), descricao: t('Salvaguardas, soberania e capacidade do setor público') }
    : { rotulo: t('Educando sobre a IA'), descricao: t('Letramento em IA de professores e estudantes e currículo de IA.') };
  return { id: f, ...nome, meses: o.fases.reduce((n, x) => n + x.meses, 0),
    k, u, x: r2(total - k - u), total, categorias };
}

function educacao(s: Pick<Estado14, 'ctx' | 'moeda'>): PrioridadeInvestimento {
  const r = orcamentoEducacao(s), c = r.com;
  const categorias: LinhaInvestimento[] = CATEGORIAS_ED.map(cat => somaLinhas(cat.n + ' ' + t(cat.nome), c.linhas.filter(l => l.cat === cat.id).map(l => ({ rotulo: '', k: l.k, x: l.x, u: l.u, total: l.total }))))
    .filter(l => l.total > 0);
  const adic = r2(c.V + c.O + c.T);
  if (adic > 0) categorias.push({ rotulo: t('Viagens, overhead e taxa administrativa'), k: 0, x: adic, u: 0, total: adic });
  return { id: 'educacao', rotulo: t('Educação com e sem IA'), descricao: t('Ensino, aprendizagem e inclusão; alternativa com IA'), meses: r.meses,
    k: c.k, x: c.x, u: c.u, total: c.total, categorias, semIA: r.sem.total };
}

/** O resumo do investimento do caso (null quando o caso não está num dos percursos novos). */
export function resumoInvestimento(s: Pick<Estado14, 'ctx' | 'moeda'>): ResumoInvestimento | null {
  const comb = percursoCombinado(s.ctx), pr: string[] = comb ? prioridadesNoCombinado(s.ctx) : [];
  const gov = comb ? pr.includes('governar') : percursoGovernanca(s.ctx), lit = comb ? pr.includes('sobre') : percursoLetramentoV23(s.ctx), ed = comb ? pr.includes('com') : percursoEducacaoV20(s.ctx);
  if (!gov && !lit && !ed) return null;
  const prioridades = [...(gov ? [governanca(s)] : []), ...(lit ? [governanca(s, 'letramento')] : []), ...(ed ? [educacao(s)] : [])];
  const total = somaLinhas(t('Total'), prioridades);
  const meses = Math.max(...prioridades.map(p => p.meses));
  return { moeda: String(s.moeda?.cod || 'USD'), meses, mesesIguais: prioridades.every(p => p.meses === meses), prioridades, total,
    pctOperacaoUso: total.total > 0 ? Math.round((total.x + total.u) / total.total * 100) : null };
}
