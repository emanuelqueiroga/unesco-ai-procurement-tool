// v018.1: progresso do plano de governança na coluna direita, abaixo do custo e do resumo. Uma flor de nove pétalas, uma
// por categoria, agrupadas por desafio e com a cor do desafio. Pétala não escolhida fica apagada; escolhida, ganha contorno
// e se preenche do centro para a ponta na proporção das opções que já têm valor. O arco externo de cada desafio mostra a
// parte já com valor, e o centro, a porcentagem do plano. Os mesmos números ficam numa lista para leitores de tela.
import { useId } from 'react';
import type { CasoStore } from '../store';
import { t } from '../percurso/textos';
import { LOC } from '../domain';
import { orcamentoGovernanca } from '../percurso/governanca';

interface Petala { id: string; n: string; nome: string; desafio: number; escolhida: boolean; feitas: number; total: number }

const C = 120, R0 = 34, R1 = 100, RA = 112, SETOR = 120, VAO = 8;
const rad = (g: number) => (g * Math.PI) / 180;
const pol = (r: number, g: number) => [C + r * Math.sin(rad(g)), C - r * Math.cos(rad(g))] as const;
const f2 = (n: number) => n.toFixed(2);

/** Pétala apontando para cima, da base (raio R0) à ponta (raio R1): duas curvas simétricas, ponta fina e bojo largo. */
function petala(meia: number): string {
  const h = R1 - R0, yb = C - R0, yt = C - R1;
  return `M${C} ${f2(yb)}C${f2(C - meia * 1.3)} ${f2(yb - h * 0.28)} ${f2(C - meia * 0.95)} ${f2(yt + h * 0.12)} ${C} ${f2(yt)}`
    + `C${f2(C + meia * 0.95)} ${f2(yt + h * 0.12)} ${f2(C + meia * 1.3)} ${f2(yb - h * 0.28)} ${C} ${f2(yb)}Z`;
}
/** Arco de g0 a g1 graus (sentido horário a partir do topo) no raio r. */
function arco(r: number, g0: number, g1: number): string {
  const [x0, y0] = pol(r, g0), [x1, y1] = pol(r, g1);
  return `M${f2(x0)} ${f2(y0)}A${r} ${r} 0 ${g1 - g0 > 180 ? 1 : 0} 1 ${f2(x1)} ${f2(y1)}`;
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
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const { petalas, desafios, feitas, total } = petalasDoPlano(s);
  if (!petalas.length) return null;
  const fmtPct = new Intl.NumberFormat(String(LOC()), { style: 'percent', maximumFractionDigits: 0 });
  const frac = total ? feitas / total : 0, pct = fmtPct.format(frac);
  const porDesafio = [1, 2, 3].map(d => petalas.filter(p => p.desafio === d));
  const resumo = porDesafio.map(l => { const e = l.filter(p => p.escolhida); return { esc: e.length, feitas: e.reduce((n, p) => n + p.feitas, 0), total: e.reduce((n, p) => n + p.total, 0) }; });

  const flores = porDesafio.flatMap((lista, di) => {
    // As pétalas ficam a intervalos iguais e o primeiro desafio é centrado no topo, para a flor ficar simétrica.
    const passo = SETOR / Math.max(1, lista.length), meia = Math.min(24, (R0 + (R1 - R0) * 0.4) * Math.sin(rad(passo / 2)) * 1.0);
    return lista.map((p, k) => {
      const g = di * SETOR - SETOR / 2 + (k + 0.5) * passo, f = p.escolhida ? p.feitas / Math.max(1, p.total) : 0;
      const cheia = p.escolhida && f >= 1, [tx, ty] = pol(R0 + (R1 - R0) * 0.6, g), clip = `${uid}-p${di}${k}`;
      const forma = petala(meia), giro = `rotate(${f2(g)} ${C} ${C})`, rf = f2(R0 + (R1 - R0) * f + (cheia ? 6 : 0));
      return <g key={p.id} className={'pc-flor-petala pc-flor-d' + (di + 1) + (p.escolhida ? ' is-on' : '') + (cheia ? ' is-ok' : '')}>
        <title>{p.n + ' ' + p.nome + ': ' + (p.escolhida ? t('{f} de {n} opções com valor', { f: p.feitas, n: p.total }) : t('não escolhida'))}</title>
        {p.escolhida ? <clipPath id={clip}><path d={forma} transform={giro} /></clipPath> : null}
        {p.escolhida && f > 0 ? <clipPath id={clip + 'c'}><circle className="pc-flor-borda" cx={C} cy={C} r={rf} /></clipPath> : null}
        <path className="pc-flor-fundo" d={forma} transform={giro} />
        {p.escolhida && f > 0 ? <circle className="pc-flor-cheio" cx={C} cy={C} r={rf} clipPath={`url(#${clip})`} /> : null}
        {p.escolhida ? <path className="pc-flor-contorno" d={forma} transform={giro} /> : null}
        <text x={f2(tx)} y={f2(ty)} className="pc-flor-n" textAnchor="middle" dominantBaseline="central">{p.n}</text>
        {/* o número muda de cor exatamente na borda do preenchimento */}
        {p.escolhida && f > 0 ? <text x={f2(tx)} y={f2(ty)} className="pc-flor-n pc-flor-n--sobre" textAnchor="middle" dominantBaseline="central" clipPath={`url(#${clip}c)`} aria-hidden="true">{p.n}</text> : null}
      </g>;
    });
  });
  const arcos = resumo.map((r, di) => {
    const g0 = di * SETOR - SETOR / 2 + VAO / 2, g1 = di * SETOR + SETOR / 2 - VAO / 2, fr = r.total ? r.feitas / r.total : 0;
    return <g key={di} className={'pc-flor-d' + (di + 1)}>
      <path className="pc-flor-trilho" d={arco(RA, g0, g1)} />
      {fr > 0 ? <path className="pc-flor-arco" d={arco(RA, g0, g0 + (g1 - g0) * fr)} /> : null}
    </g>;
  });
  const rotulo = t('Progresso do plano: {p} das opções escolhidas com valor ({f} de {n}).', { p: pct, f: feitas, n: total });
  return <section className="pc-mandala" aria-label={t('Progresso do plano')}>
    <h2 className="pc-mandala-titulo">{t('Progresso do plano')}</h2>
    <svg viewBox="0 0 240 240" role="img" aria-label={rotulo} className="pc-flor">
      {arcos}
      {flores}
      <circle className="pc-flor-miolo" cx={C} cy={C} r={R0 - 4} />
      <text x={C} y={C - 3} className={"pc-flor-pct" + (pct.length > 4 ? " is-longo" : "")} textAnchor="middle" dominantBaseline="central">{pct}</text>
      <text x={C} y={C + 14} className="pc-flor-sub" textAnchor="middle" dominantBaseline="central">{t('com valor')}</text>
    </svg>
    <ol className="pc-mandala-legenda">{desafios.map((d, i) => { const r = resumo[i], fr = r.total ? r.feitas / r.total : 0;
      return <li key={i} className={'pc-flor-d' + (i + 1) + (r.esc ? '' : ' is-vazio')}>
        <span className="pc-mandala-num" aria-hidden="true">{i + 1}</span>
        <span className="pc-mandala-nome">{t(d)}</span>
        <span className="pc-mandala-conta">{r.esc ? t('{f} de {n}', { f: r.feitas, n: r.total }) : '—'}</span>
        <span className="pc-mandala-barra" aria-hidden="true"><span style={{ inlineSize: `${Math.round(fr * 100)}%` }} /></span>
      </li>; })}</ol>
    <p className="pc-mandala-nota">{t('Cada pétala é uma categoria; ela se preenche à medida que as opções escolhidas recebem valor.')}</p>
  </section>;
}
