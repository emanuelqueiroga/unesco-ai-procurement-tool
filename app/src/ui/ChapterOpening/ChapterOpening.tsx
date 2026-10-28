import type { ReactNode } from 'react';
import './ChapterOpening.css';

export type ChapterOpeningProps = {
  /** Número do capítulo, 1 a 4: define a cor do traço (`phase-N`). */
  n: number;
  total?: number;
  /** Kicker; o padrão é "Capítulo N de 4". */
  kicker?: string;
  title: string;
  /** Pergunta-guia, uma pergunta de verdade em linguagem de educação. */
  guide: string;
  /** Um parágrafo de no máximo três frases, terminando com o ganho concreto. */
  children: ReactNode;
  questions?: number;
  minutes?: number;
  /** O único botão primário: "Começar o capítulo". */
  action?: ReactNode;
  className?: string;
};

/** Tela de abertura de capítulo: traço da fase, kicker, título grande, pergunta-guia e metadados. */
export function ChapterOpening({
  n,
  total = 4,
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
      <div className="pr-chapteropening-kicker">{kicker ?? `Capítulo ${n} de ${total}`}</div>
      <h1 className="pr-chapteropening-title">{title}</h1>
      <p className="pr-chapteropening-guide">{guide}</p>
      <p className="pr-chapteropening-text">{children}</p>
      {questions !== undefined || minutes !== undefined ? (
        <div className="pr-chapteropening-meta">
          {questions !== undefined ? (
            <span>
              <b>{questions}</b> perguntas
            </span>
          ) : null}
          {minutes !== undefined ? (
            <span>
              <b>~{minutes}</b> minutos
            </span>
          ) : null}
        </div>
      ) : null}
      {action ? <div className="pr-chapteropening-action">{action}</div> : null}
    </section>
  );
}
