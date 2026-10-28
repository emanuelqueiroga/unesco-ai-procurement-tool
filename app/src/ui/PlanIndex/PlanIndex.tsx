import type { MouseEvent, ReactNode } from 'react';
import { BREAKPOINTS, useMediaQuery } from '../useMediaQuery';
import './PlanIndex.css';
import { tx } from '../texto';

export type PlanIndexItem = {
  id: string;
  label: string;
  href: string;
  /** Contagem ao lado ("· 9"). */
  count?: number | string;
  active?: boolean;
  /** Apêndice e referências: em `muted`. */
  dim?: boolean;
};

export type PlanIndexProps = {
  /** Rótulo de zona: "Neste plano". */
  zoneLabel?: string;
  /** As quatro páginas, na ordem fixa. */
  items: PlanIndexItem[];
  /** Depois do divisor: apêndice, referências, respostas que faltam. */
  secondary?: PlanIndexItem[];
  /** Nota no rodapé ("Clique em qualquer número para ver de onde vem."). */
  note?: ReactNode;
  onNavigate?: (href: string, e: MouseEvent<HTMLAnchorElement>) => void;
  /** Força a faixa de chips com rolagem horizontal; abaixo de 1100 px isso acontece sozinho. */
  strip?: boolean;
  className?: string;
};

/** Índice lateral do plano (240 px); abaixo de 1100 px vira faixa de chips com rolagem horizontal. */
export function PlanIndex({
  zoneLabel,
  items,
  secondary = [],
  note,
  onNavigate,
  strip: forceStrip,
  className,
}: PlanIndexProps) {
  const narrow = useMediaQuery(BREAKPOINTS.drawer);
  const strip = forceStrip ?? narrow;
  const render = (it: PlanIndexItem) => (
    <a
      key={it.id}
      className={['pr-planindex-link', it.active ? 'pr-planindex-link--active' : '', it.dim ? 'pr-planindex-link--dim' : '']
        .filter(Boolean)
        .join(' ')}
      href={it.href}
      aria-current={it.active ? 'page' : undefined}
      onClick={onNavigate ? (e) => onNavigate(it.href, e) : undefined}
    >
      {it.label}
      {it.count !== undefined ? <span className="pr-planindex-count">{'\u00a0·\u00a0'}{it.count}</span> : null}
    </a>
  );
  return (
    <nav
      className={['pr-planindex', strip ? 'pr-planindex--strip' : '', className ?? ''].filter(Boolean).join(' ')}
      aria-label={zoneLabel ?? tx('Neste plano')}
    >
      <div className="pr-planindex-zone">{zoneLabel ?? tx('Neste plano')}</div>
      <div className="pr-planindex-list">
        {items.map(render)}
        {secondary.length > 0 ? <div className="pr-planindex-divider" role="separator" /> : null}
        {secondary.map(render)}
      </div>
      {note ? <div className="pr-planindex-note">{note}</div> : null}
    </nav>
  );
}
