import type { ReactNode } from 'react';
import { KpiTile } from '../KpiTile/KpiTile';
import './ChapterSummary.css';
import { tx } from '../texto';

export type ChapterSummaryProps = {
  n: number;
  /** Kicker com o nome da etapa; o padrão é "Em resumo". */
  kicker?: string;
  title: string;
  /** Até dois parágrafos em prosa, gerados das respostas. Sem veredito. */
  paragraphs: ReactNode[];
  /** O número que o capítulo liberou (capítulos 2, 3 e 4). */
  kpi?: {
    kicker?: ReactNode;
    label: ReactNode;
    value: string;
    fullValue?: string;
    origin?: ReactNode;
  };
  /** Linha "Já apareceram N recomendações" com link para o plano. */
  recommendations?: ReactNode;
  /** Cartão de prévia do próximo capítulo, à direita, abaixo do KPI. */
  next?: { title: ReactNode; text: ReactNode };
  /** Ações de navegação: Voltar à última pergunta e Próximo. */
  actions?: ReactNode;
  className?: string;
};

/** Síntese de fim de capítulo: prosa à esquerda, KPI destacado à direita. */
export function ChapterSummary({
  n,
  kicker,
  title,
  paragraphs,
  kpi,
  recommendations,
  next,
  actions,
  className,
}: ChapterSummaryProps) {
  return (
    <section className={['pr-chaptersummary', className ?? ''].filter(Boolean).join(' ')}>
      <div className="pr-chaptersummary-kicker">{kicker ?? tx('Em resumo')}</div>
      <h1 className="pr-chaptersummary-title">{title}</h1>
      <div className={['pr-chaptersummary-grid', kpi || next ? '' : 'pr-chaptersummary-grid--single'].join(' ')}>
        <div className="pr-chaptersummary-prose">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {recommendations ? <div className="pr-chaptersummary-recs">{recommendations}</div> : null}
        </div>
        {kpi || next ? (
          <div className="pr-chaptersummary-side">
            {kpi ? (
              <KpiTile
                highlight
                kicker={kpi.kicker}
                label={kpi.label}
                value={kpi.value}
                fullValue={kpi.fullValue}
                origin={kpi.origin}
              />
            ) : null}
            {next ? (
              <div className="pr-chaptersummary-next">
                <div className="pr-chaptersummary-next-title">{next.title}</div>
                <div>{next.text}</div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {actions ? <div className="pr-chaptersummary-actions">{actions}</div> : null}
    </section>
  );
}
