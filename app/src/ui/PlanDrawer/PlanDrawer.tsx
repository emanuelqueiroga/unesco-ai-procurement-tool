import { useRef } from 'react';
import type { ReactNode } from 'react';
import { IconChevronUp } from '../icons';
import { useFocusTrap } from '../focusTrap';
import './PlanDrawer.css';

export type PlanDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Rótulo de zona: "Seu plano · escrevendo". */
  zoneLabel: string;
  /** Destaque do resumo em `accent-ink`: "1 número novo". */
  highlight?: string;
  /** Resto do resumo em `muted`: "2 recomendações · 13 lacunas". */
  summary?: string;
  /** O KPI mais recente, em `kpi-20`. */
  kpi?: string;
  /** O conteúdo da gaveta: um `PlanPanel` com `paperOnly`. */
  children: ReactNode;
  closeLabel?: string;
  openLabel?: string;
  /** Só para amostra (galeria): a gaveta fica presa ao contêiner pai, sem prender o foco. */
  inline?: boolean;
  className?: string;
};

/** Versão móvel do PlanPanel: barra inferior com o resumo, que abre como gaveta com foco preso e Esc. */
export function PlanDrawer({
  open,
  onOpenChange,
  zoneLabel,
  highlight,
  summary,
  kpi,
  children,
  closeLabel = 'Fechar',
  openLabel = 'Abrir o seu plano',
  inline,
  className,
}: PlanDrawerProps) {
  const sheet = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => onOpenChange(false);
  useFocusTrap(sheet, open && !inline, close, trigger);

  return (
    <div className={['pr-plandrawer', inline ? 'pr-plandrawer--inline' : '', className ?? ''].filter(Boolean).join(' ')}>
      {!open || inline ? (
        <button
          ref={trigger}
          type="button"
          className="pr-plandrawer-bar"
          aria-label={openLabel}
          aria-expanded={open}
          onClick={() => onOpenChange(true)}
        >
          <span className="pr-plandrawer-handle" aria-hidden="true" />
          <span className="pr-plandrawer-text">
            <span className="pr-plandrawer-zone">{zoneLabel}</span>
            <span className="pr-plandrawer-summary">
              {highlight ? <span className="pr-plandrawer-highlight">{highlight}</span> : null}
              {highlight && summary ? ' · ' : ''}
              {summary}
            </span>
          </span>
          {kpi ? <span className="pr-plandrawer-kpi">{kpi}</span> : null}
          <IconChevronUp />
        </button>
      ) : null}

      {open ? (
        <>
          <div className="pr-plandrawer-overlay" onClick={close} aria-hidden="true" />
          <section ref={sheet} className="pr-plandrawer-sheet" aria-label="Seu plano" tabIndex={-1}>
            <span className="pr-plandrawer-handle pr-plandrawer-handle--sheet" aria-hidden="true" />
            <div className="pr-plandrawer-head">
              <span className="pr-plandrawer-zone">{zoneLabel}</span>
              <button type="button" className="pr-plandrawer-close" onClick={close}>
                {closeLabel}
              </button>
            </div>
            <div className="pr-plandrawer-body">{children}</div>
          </section>
        </>
      ) : null}
    </div>
  );
}
