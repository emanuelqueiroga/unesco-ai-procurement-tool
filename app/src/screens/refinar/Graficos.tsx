// Gráficos da calculadora em SVG simples, com os rótulos em HTML (o texto não encolhe com a largura e nunca
// fica abaixo de 13 px) e cores por token: tornado (CUS-15), faixas P10–P90 do Monte Carlo (CUS-17) e índice de
// custo unitário por componente (CUS-18). Cada gráfico traz o número ao lado da barra, para não depender da cor.
import { din, pct, LOC } from '../../domain';
import { t } from '../../percurso/textos';
import './fases.css';

const nf = (x: number, d = 2) => (+x || 0).toLocaleString(String(LOC()), { maximumFractionDigits: d });

export interface LinhaTornado { id: string; nome: string; min: number; max: number; lo: number; hi: number }

/** Tornado: barras a partir do custo base (linha central), mínimo e máximo da faixa de cada direcionador */
export function Tornado({ rows, base, rotuloBase }: { rows: LinhaTornado[]; base: number; rotuloBase: string }) {
  const mx = Math.max(...rows.map((r) => Math.max(Math.abs(r.lo), Math.abs(r.hi))), 1e-9);
  const barra = (v: number, cls: string) => {
    const w = (Math.abs(v) / mx) * 49;
    const x = v < 0 ? 50 - w : 50;
    return <rect className={cls} x={x} y={1} width={Math.max(w, 0.3)} height={8} />;
  };
  return (
    <figure className="rf-grafico" aria-label={t('Sensibilidade do custo total')}>
      <ul className="rf-tornado">
        {rows.map((r) => (
          <li key={r.id} className="rf-tornado-linha">
            <span className="rf-tornado-nome">{t(r.nome)} <span className="rf-mudo">(×{nf(r.min)} {t('a')} ×{nf(r.max)})</span></span>
            <svg className="rf-tornado-svg" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
              {barra(r.lo, 'rf-cor-min')}
              {barra(r.hi, 'rf-cor-max')}
              <line x1={50} x2={50} y1={0} y2={10} className="rf-eixo" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="rf-tornado-val">
              <span><i className="rf-amostra rf-amostra--min" aria-hidden="true" />{t('mínimo')}: {r.lo >= 0 ? '+' : '−'}{din(Math.abs(r.lo))}</span>
              <span><i className="rf-amostra rf-amostra--max" aria-hidden="true" />{t('máximo')}: {r.hi >= 0 ? '+' : '−'}{din(Math.abs(r.hi))}</span>
            </span>
          </li>
        ))}
      </ul>
      <figcaption className="rf-nota">{rotuloBase}: {din(base)}. <span className="rf-legenda"><i className="rf-amostra rf-amostra--min" aria-hidden="true" />{t('direcionador no mínimo da faixa')} <i className="rf-amostra rf-amostra--max" aria-hidden="true" />{t('no máximo da faixa')}</span></figcaption>
    </figure>
  );
}

export interface FaixaMC { id: string; rotulo: string; p10: number; p50: number; p90: number }

/** Faixas P10–P90 com a mediana marcada; as linhas de um grupo dividem a mesma escala */
export function FaixasMC({ linhas, titulo, fmt }: { linhas: FaixaMC[]; titulo: string; fmt: (v: number) => string }) {
  const mx = Math.max(...linhas.map((l) => l.p90), 1e-9);
  const x = (v: number) => (Math.max(0, v) / mx) * 98 + 1;
  return (
    <figure className="rf-grafico" aria-label={titulo}>
      <ul className="rf-mc">
        {linhas.map((l) => (
          <li key={l.id} className="rf-mc-linha">
            <span className="rf-mc-nome">{l.rotulo}</span>
            <svg className="rf-mc-svg" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
              <line x1={1} x2={99} y1={5} y2={5} className="rf-eixo" vectorEffect="non-scaling-stroke" />
              <rect className="rf-cor-faixa" x={x(l.p10)} y={2} width={Math.max(x(l.p90) - x(l.p10), 0.4)} height={6} />
              <rect className="rf-cor-mediana" x={x(l.p50) - 0.4} y={0} width={0.8} height={10} />
            </svg>
            <span className="rf-mc-val">P10 {fmt(l.p10)} · P50 {fmt(l.p50)} · P90 {fmt(l.p90)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Índice de custo unitário por componente: barras horizontais com o valor e a parte do total */
export function BarrasICU({ itens, total }: { itens: { k: string; nome: string; v: number }[]; total: number }) {
  const mx = Math.max(...itens.map((i) => Math.abs(i.v)), 1e-9);
  return (
    <figure className="rf-grafico" aria-label={t('Índice de custo unitário por componente')}>
      <ul className="rf-barras">
        {itens.map((i) => (
          <li key={i.k} className="rf-barras-linha">
            <span className="rf-barras-nome">{i.nome}</span>
            <svg className="rf-barras-svg" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
              <rect className="rf-cor-barra" x={0} y={1} width={Math.max((Math.max(i.v, 0) / mx) * 100, 0.3)} height={8} />
            </svg>
            <span className="rf-barras-val">{din(i.v, 2)} ({pct(total ? i.v / total : 0)})</span>
          </li>
        ))}
      </ul>
      <figcaption className="rf-nota"><b>{t('Índice total')}</b>: {din(total, 2)} {t('por usuário ativo por ano = soma dos componentes')}</figcaption>
    </figure>
  );
}

export interface BarraFase { id: string; nome: string; rotuloAnos: string; unico: number; recorrente: number; total: number }

/**
 * Barras empilhadas por fase (MOT-10): pagamento único e recorrente. Todas as fases dividem a mesma escala, para comparar o
 * tamanho; o valor de cada parte e o total vêm escritos ao lado, para não depender só da cor.
 */
export function BarrasFases({ fases, fmt }: { fases: BarraFase[]; fmt: (v: number) => string }) {
  const mx = Math.max(...fases.map((f) => Math.max(f.total, f.unico + f.recorrente)), 1e-9);
  const w = (v: number) => (Math.max(0, v) / mx) * 100;
  return (
    <figure className="rf-grafico" aria-label={t('Custo por fase')}>
      <ul className="rf-barras">
        {fases.map((f) => (
          <li key={f.id} className="rf-barras-linha">
            <span className="rf-barras-nome">{t(f.nome)} <span className="rf-mudo">({f.rotuloAnos})</span></span>
            <svg className="rf-barras-svg" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
              <rect className="rf-cor-unico" x={0} y={1} width={w(f.unico)} height={8} />
              <rect className="rf-cor-recorrente" x={w(f.unico)} y={1} width={w(f.recorrente)} height={8} />
            </svg>
            <span className="rf-barras-val">
              <span><i className="rf-amostra rf-amostra--unico" aria-hidden="true" />{t('Pagamento único')}: {fmt(f.unico)}</span>
              <span><i className="rf-amostra rf-amostra--recorrente" aria-hidden="true" />{t('Recorrente')}: {fmt(f.recorrente)}</span>
              <span>{t('Total')}: {fmt(f.total)}</span>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
