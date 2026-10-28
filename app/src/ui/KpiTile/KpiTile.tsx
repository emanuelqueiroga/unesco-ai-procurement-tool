import type { ReactNode } from 'react';
import './KpiTile.css';
import { tx } from '../texto';

export type KpiTileProps = {
  /** Rótulo em `caption-13`, sempre acima do número. */
  label: ReactNode;
  /** Número abreviado ("R$ 184 mil"); sem valor, o cartão está vazio e mostra "—". */
  value?: string;
  /** Valor completo, no `title` do número. */
  fullValue?: string;
  /** Linha de origem: `SourceLine`, ou texto como "aparece no capítulo 4" quando vazio. */
  origin?: ReactNode;
  /** Recém-atualizado: borda 2 px `accent` e a legenda em `accent-ink`. */
  fresh?: boolean;
  freshLabel?: string;
  /** Na síntese de capítulo: borda 2 px `primary` sobre `surface-plan`. */
  highlight?: boolean;
  /** Linha extra acima do rótulo ("O primeiro número do seu plano"). */
  kicker?: ReactNode;
  /** Versão do painel lateral: `kpi-20` e rótulo de 11 px. */
  compact?: boolean;
  className?: string;
};

/** Cartão de número-chave: rótulo acima, número grande, linha de origem abaixo. */
export function KpiTile({
  label,
  value,
  fullValue,
  origin,
  fresh,
  freshLabel,
  highlight,
  kicker,
  compact,
  className,
}: KpiTileProps) {
  const empty = value === undefined || value === '';
  const cls = [
    'pr-kpitile',
    compact ? 'pr-kpitile--compact' : '',
    fresh ? 'pr-kpitile--fresh' : '',
    highlight ? 'pr-kpitile--highlight' : '',
    empty ? 'pr-kpitile--empty' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls}>
      {kicker ? <div className="pr-kpitile-label">{kicker}</div> : null}
      <div className="pr-kpitile-label">{label}</div>
      <div className="pr-kpitile-value" title={fullValue}>
        {empty ? '—' : value}
      </div>
      {fresh || origin ? (
        <div className="pr-kpitile-origin">
          {fresh ? <span className="pr-kpitile-fresh">{freshLabel ?? tx('atualizado agora')}</span> : null}
          {fresh && origin ? <span aria-hidden="true"> · </span> : null}
          {origin}
        </div>
      ) : null}
    </div>
  );
}
