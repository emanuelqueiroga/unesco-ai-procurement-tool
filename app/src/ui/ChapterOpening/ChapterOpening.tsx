import type { ReactNode } from 'react';
import './ChapterOpening.css';
import { tx } from '../texto';

export type ChapterOpeningProps = {
  /** Número do capítulo, 1 a 4: define a cor do traço (`phase-N`). */
  n: number;
  total?: number;
  /** Kicker opcional; sem ele, exibe apenas o título da etapa. */
  kicker?: string;
  title: string;
  /** Pergunta-guia, uma pergunta de verdade em linguagem de educação. */
  guide: string;
  /** Um parágrafo de no máximo três frases, terminando com o ganho concreto. */
  children: ReactNode;
  questions?: number;
  minutes?: number;
  /** Ações de navegação: Voltar e Próximo. */
  action?: ReactNode;
  className?: string;
};

/** Tela de abertura de capítulo: traço da fase, kicker, título grande, pergunta-guia e metadados. */
export function ChapterOpening({
  n,
  kicker,
  title,
  guide,
  children,
  questions,
  minutes,
  action,
  className,
}: ChapterOpeningProps) {
  return (
    <section className={['pr-chapteropening', className ?? ''].filter(Boolean).join(' ')}>
      <div className="pr-chapteropening-phase" style={{ background: `var(--phase-${n})` }} aria-hidden="true" />
      {kicker ? <div className="pr-chapteropening-kicker">{kicker}</div> : null}
      <h1 className="pr-chapteropening-title">{title}</h1>
      <p className="pr-chapteropening-guide">{guide}</p>
      <p className="pr-chapteropening-text">{children}</p>
      {questions !== undefined || minutes !== undefined ? (
        <div className="pr-chapteropening-meta">
          {questions !== undefined ? (
            <span>
              <b>{questions}</b> {questions === 1 ? tx('pergunta') : tx('perguntas')}
            </span>
          ) : null}
          {minutes !== undefined ? (
            <span>
              <b>~{minutes}</b> {tx('minutos')}
            </span>
          ) : null}
        </div>
      ) : null}
      {action ? <div className="pr-chapteropening-action">{action}</div> : null}
    </section>
  );
}
