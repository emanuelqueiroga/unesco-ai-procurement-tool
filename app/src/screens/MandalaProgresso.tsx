// v018.1: progresso do plano de governança na coluna direita, abaixo do custo e do resumo. Uma mandala em três setores,
// um por desafio, com uma pétala por categoria: contorno tracejado quando a categoria não foi escolhida; escolhida, a
// pétala se preenche do centro para fora na proporção das opções que já têm valor. O anel externo mostra a parte do
// plano com valor, e o centro, a porcentagem. Os mesmos números ficam numa lista para leitores de tela.
import type { CasoStore } from '../store';
import { t } from '../percurso/textos';
import { LOC } from '../domain';
import { orcamentoGovernanca } from '../percurso/governanca';

interface Petala { id: string; n: string; nome: string; desafio: number; escolhida: boolean; feitas: number; total: number }

const C = 100, R0 = 38, R1 = 80, RA = 90;
const pol = (r: number, a: number) => [C + r * Math.sin(a), C - r * Math.cos(a)] as const;
/** Setor anular de a0 a a1 (radianos, sentido horário a partir do topo), entre os raios ri e re. */
function setor(ri: number, re: number, a0: number, a1: number): string {
  const [x0, y0] = pol(re, a0), [x1, y1] = pol(re, a1), [x2, y2] = pol(ri, a1), [x3, y3] = pol(ri, a0), g = a1 - a0 > Math.PI ? 1 : 0;
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${re} ${re} 0 ${g} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}A${ri} ${ri} 0 ${g} 0 ${x3.toFixed(2)} ${y3.toFixed(2)}Z`;
}
function arco(r: number, a0: number, a1: number): string {
  const [x0, y0] = pol(r, a0), [x1, y1] = pol(r, a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

export function petalasDoPlano(s: CasoStore): { petalas: Petala[]; desafios: string[]; feitas: number; total: number } {
  const o: any = orcamentoGovernanca(s), sel = new Set<string>(o.selecionadas || []), desafios: string[] = [];
  const petalas: Petala[] = (o.disponiveis || []).map((c: any) => {
    const d = Number(String(c.n).split('.')[0]) || 1; if (!desafios[d - 1]) desafios[d - 1] = String(c.grupo || '');
    const item = (o.itens || []).find((i: any) => i.id === c.id), linhas = item ? item.linhas : [];
    return { id: c.id, n: c.n, nome: t(c.nome), desafio: d, escolhida: sel.has(c.id), total: item ? Math.max(1, linhas.length) : 0, feitas: linhas.filter((l: any) => l.status !== 'falta' && l.total !== null).length };
  });
  const esc = petalas.filter(p => p.escolhida);
  return { petalas, desafios, feitas: esc.reduce((n, p) => n + p.feitas, 0), total: esc.reduce((n, p) => n + p.total, 0) };
}

export function MandalaProgresso({ s }: { s: CasoStore }) {
  const { petalas, desafios, feitas, total } = petalasDoPlano(s);
  if (!petalas.length) return null;
  const frac = total ? feitas / total : 0, pct = new Intl.NumberFormat(String(LOC()), { style: 'percent', maximumFractionDigits: 0 }).format(frac);
  const porDesafio = [1, 2, 3].map(d => petalas.filter(p => p.desafio === d));
  const vao = 0.05, setorD = (2 * Math.PI) / 3;
  const formas = porDesafio.flatMap((lista, di) => {
    const a0 = di * setorD + vao, larg = (setorD - 2 * vao) / Math.max(1, lista.length);
    return lista.map((p, k) => {
      const b0 = a0 + k * larg + 0.02, b1 = a0 + (k + 1) * larg - 0.02, f = p.escolhida ? p.feitas / Math.max(1, p.total) : 0;
      const meio = (b0 + b1) / 2, [tx, ty] = pol((R0 + R1) / 2 + 4, meio);
      return <g key={p.id} className={'pc-mandala-petala' + (p.escolhida ? ' is-on' : '') + (p.escolhida && f >= 1 ? ' is-ok' : '')}>
        <title>{p.n + ' ' + p.nome + ': ' + (p.escolhida ? t('{f} de {n} opções com valor', { f: p.feitas, n: p.total }) : t('não escolhida'))}</title>
        <path className="pc-mandala-fundo" d={setor(R0, R1, b0, b1)} />
        {f > 0 ? <path className="pc-mandala-cheio" d={setor(R0, R0 + (R1 - R0) * f, b0, b1)} /> : null}
        <text x={tx} y={ty} className="pc-mandala-n" textAnchor="middle" dominantBaseline="central">{p.n}</text>
      </g>;
    });
  });
  const rotulo = t('Progresso do plano: {p} das opções escolhidas com valor ({f} de {n}).', { p: pct, f: feitas, n: total });
  return <section className="pc-mandala" aria-label={t('Progresso do plano')}>
    <h2 className="pc-mandala-titulo">{t('Progresso do plano')}</h2>
    <svg viewBox="0 0 200 200" role="img" aria-label={rotulo} className="pc-mandala-svg">
      <circle className="pc-mandala-trilho" cx={C} cy={C} r={RA} />
      {frac > 0 ? <path className="pc-mandala-anel" d={frac >= 1 ? arco(RA, 0, 2 * Math.PI - 0.0001) : arco(RA, 0, 2 * Math.PI * frac)} /> : null}
      {[0, 1, 2].map(i => { const [x0, y0] = pol(R0 - 2, i * setorD), [x1, y1] = pol(RA - 4, i * setorD); return <line key={i} className="pc-mandala-raio" x1={x0} y1={y0} x2={x1} y2={y1} />; })}
      {formas}
      <circle className="pc-mandala-miolo" cx={C} cy={C} r={R0 - 6} />
      <text x={C} y={C - 4} className="pc-mandala-pct" textAnchor="middle" dominantBaseline="central">{pct}</text>
      <text x={C} y={C + 14} className="pc-mandala-sub" textAnchor="middle" dominantBaseline="central">{t('com valor')}</text>
    </svg>
    <ol className="pc-mandala-legenda">{desafios.map((d, i) => { const l = porDesafio[i], esc = l.filter(p => p.escolhida);
      return <li key={i}><span className="pc-mandala-num">{i + 1}</span><span className="pc-mandala-nome">{t(d)}</span>
        <span className="pc-mandala-conta">{esc.length ? t('{f} de {n}', { f: esc.reduce((n, p) => n + p.feitas, 0), n: esc.reduce((n, p) => n + p.total, 0) }) : '—'}</span></li>; })}</ol>
    <p className="pc-mandala-nota">{t('Cada pétala é uma categoria; ela se preenche à medida que as opções escolhidas recebem valor.')}</p>
  </section>;
}
