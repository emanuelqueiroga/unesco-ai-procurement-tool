// Base de referências na calculadora (REF-02, REF-03, REF-04): para um caminho da cfg, a linha da base que dá o valor
// padrão (fonte, ano, grau e faixa), se o valor atual sai da faixa e se a pessoa o alterou (para o "restaurar").
// A cfg sem edições (das respostas ou do exemplo em custo.base) é montada uma vez por mudança de estado e reaproveitada
// por todos os campos da tela.
import { faixaDoCampo, LOC, tr, ORIGEM_ROTULO, GRAU_NOME } from '../../domain';
import { useCaso, cfgSemEdicoes, valorDoCaminho, type Estado14 } from '../../store';

let memo: { caso: any; ctx: any; base: string; cfg: any } | null = null;
/** a cfg das respostas, sem as edições da calculadora, guardada enquanto caso, contexto e base não mudam */
export function cfgBaseDe(s: Estado14): any {
  const base = s.custo.base || 'caso';
  if (memo && memo.caso === s.caso && memo.ctx === s.ctx && memo.base === base) return memo.cfg;
  let cfg: any = null;
  try { cfg = cfgSemEdicoes(s); } catch (e) { console.warn(e); }
  memo = { caso: s.caso, ctx: s.ctx, base, cfg };
  return cfg;
}

export interface RefCampo {
  /** a linha da base ligada ao campo (faixaDoCampo, pais.js), ou null */
  faixa: any | null;
  /** o valor atual difere do das respostas (e a calculadora está editada): mostra "restaurar" */
  alterado: boolean;
}
const igual = (a: any, b: any) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** linha da base e estado de edição de um caminho da cfg, para o campo da calculadora */
export function useRefCampo(caminho: string): RefCampo {
  const caso = useCaso((s) => s.caso);
  const ctx = useCaso((s) => s.ctx);
  const custo = useCaso((s) => s.custo);
  const s = { caso, ctx, custo } as Estado14;
  const base = cfgBaseDe(s);
  const editada = !!(custo.editado && custo.cfg);
  const cfg = editada ? custo.cfg : base;
  if (!cfg) return { faixa: null, alterado: false };
  let faixa: any = null;
  try { faixa = faixaDoCampo(cfg, caminho, caso, valorDoCaminho(cfg, caminho)); } catch (e) { faixa = null; }
  const alterado = editada && !!base && !igual(valorDoCaminho(cfg, caminho), valorDoCaminho(base, caminho));
  return { faixa, alterado };
}

/** número da base no idioma ("8,55"; "15%" quando percentual) */
export function fmtRef(v: any, percentual?: boolean): string {
  if (v === '' || v == null || !Number.isFinite(+v)) return '';
  const n = percentual ? +v * 100 : +v;
  const s = n.toLocaleString(String(LOC()), { maximumFractionDigits: Math.abs(n) < 1 && n !== 0 ? 4 : 2 });
  return percentual ? s + '%' : s;
}

/** de onde vem o valor-padrão, numa linha curta: "valor ilustrativo · Convenção da ferramenta (v13), ilustrativa, 2026 · grau C" */
export function origemDaRef(f: any): string {
  const o = (ORIGEM_ROTULO as Record<string, string>)[f.origem];
  const fonte = f.fonte ? String(tr(f.fonte)) + (f.ano != null ? ', ' + f.ano : '') : (f.ano != null ? String(f.ano) : '');
  return [o ? String(tr(o)) : '', fonte, f.grau ? String(tr('grau ' + f.grau)) : ''].filter(Boolean).join(' · ');
}

/** o significado do grau ("C: estimativa de especialista ou convenção da ferramenta"), para a dica longa */
export function nomeDoGrau(g: string): string { return g ? String(tr((GRAU_NOME as Record<string, string>)[g] || g)) : ''; }
