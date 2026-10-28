import type { MouseEvent, ReactNode } from 'react';
import './Recommendation.css';
import { tx } from '../texto';

export type RecommendationPriority = 'alta' | 'media';

export type RecommendationProps = {
  /** Número de ordem, em `muted` tabular. */
  n?: number;
  /** A ação, com verbo no infinitivo, no máximo duas linhas. */
  action: ReactNode;
  /** "Por quê:" ligado à resposta; omitido na versão compacta. */
  why?: ReactNode;
  priority?: RecommendationPriority;
  priorityLabel?: string;
  /** Momento: "Antes do teste", "Antes de contratar", "Para manter e ampliar". */
  moment?: string;
  /** Tipo: "Custo e compra", "Política e governança"… */
  kind?: string;
  /** Link "Ir à pergunta". */
  link?: { href?: string; label?: string; onClick?: (e: MouseEvent<HTMLElement>) => void };
  /** Recém-criada: borda de 2 px `accent`. */
  fresh?: boolean;
  /** Painel lateral e "Comece por estas": só o número e a ação. */
  compact?: boolean;
  className?: string;
};

const PRIORITY_LABEL: Record<RecommendationPriority, string> = { alta: 'Prioridade alta', media: 'Prioridade média' };

/** Item de recomendação: a ação, o porquê e três etiquetas (prioridade, momento, tipo). */
export function Recommendation({
  n,
  action,
  why,
  priority,
  priorityLabel,
  moment,
  kind,
  link,
  fresh,
  compact,
  className,
}: RecommendationProps) {
  const cls = [
    'pr-recommendation',
    fresh ? 'pr-recommendation--fresh' : '',
    compact ? 'pr-recommendation--compact' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  const hasMeta = !compact && (priority || moment || kind || link);
  return (
    <div className={cls}>
      {n !== undefined ? <span className="pr-recommendation-n">{n}</span> : null}
      <div className="pr-recommendation-body">
        <div className="pr-recommendation-action">{action}</div>
        {!compact && why ? <div className="pr-recommendation-why">{why}</div> : null}
        {hasMeta ? (
          <div className="pr-recommendation-meta">
            {priority ? (
              <span className={`pr-recommendation-pill pr-recommendation-pill--${priority}`}>
                {priorityLabel ?? tx(PRIORITY_LABEL[priority])}
              </span>
            ) : null}
            {moment ? <span className="pr-recommendation-pill pr-recommendation-pill--line">{moment}</span> : null}
            {kind ? <span className="pr-recommendation-pill pr-recommendation-pill--line">{kind}</span> : null}
            {link ? (
              link.href ? (
                <a className="pr-recommendation-link" href={link.href} onClick={link.onClick}>
                  {link.label ?? tx('Ir à pergunta')}
                </a>
              ) : (
                <button type="button" className="pr-recommendation-link" onClick={link.onClick}>
                  {link.label ?? tx('Ir à pergunta')}
                </button>
              )
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
