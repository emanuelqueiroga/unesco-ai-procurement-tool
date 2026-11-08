import type { MouseEvent } from 'react';
import './ChapterNav.css';
import { tx } from '../texto';

export type ChapterState = 'done' | 'current' | 'todo';
export type QuestionState = 'done' | 'current' | 'todo' | 'suggested';

export type NavQuestion = {
  id: string;
  title: string;
  state: QuestionState;
  href: string;
};

export type NavChapter = {
  n: number;
  title: string;
  state: ChapterState;
  href: string;
  /** Só o capítulo aberto traz as perguntas. */
  questions?: NavQuestion[];
};

export type ChapterNavProps = {
  /** Rótulo de zona com o contador: "Seu percurso · 11 de 24". */
  zoneLabel: string;
  chapters: NavChapter[];
  /** Interceptar a navegação por hash sem recarregar. */
  onNavigate?: (href: string, e: MouseEvent<HTMLAnchorElement>) => void;
  /** Legenda das marcas no rodapé da coluna. */
  legend?: boolean;
  className?: string;
};

const MARK: Record<QuestionState, string> = { done: '✓', current: '●', todo: '○', suggested: '~' };
const MARK_LABEL: Record<QuestionState, string> = {
  done: 'respondida',
  current: 'atual',
  todo: 'pendente',
  suggested: 'sugerida, a confirmar',
};

/** Lista vertical do percurso: os quatro capítulos e, no capítulo aberto, suas perguntas com estado. */
export function ChapterNav({ zoneLabel, chapters, onNavigate, legend = true, className }: ChapterNavProps) {
  return (
    <nav className={['pr-chapternav', className ?? ''].filter(Boolean).join(' ')} aria-label={tx('Seu caminho')}>
      <div className="pr-chapternav-zone">{zoneLabel}</div>
      <ol className="pr-chapternav-list">
        {chapters.map((c) => (
          <li key={c.n} className="pr-chapternav-item">
            <a
              className={`pr-chapternav-chapter pr-chapternav-chapter--${c.state}`}
              href={c.href}
              aria-current={c.state === 'current' ? 'step' : undefined}
              onClick={onNavigate ? (e) => onNavigate(c.href, e) : undefined}
            >
              <span className={`pr-chapternav-dot pr-chapternav-dot--${c.state}`} aria-hidden="true">
                {c.state === 'done' ? '✓' : c.n}
              </span>
              <span className="pr-chapternav-title">
                {c.n} · {c.title}
              </span>
            </a>
            {c.questions && c.questions.length > 0 ? (
              <ol className="pr-chapternav-questions">
                {c.questions.map((q) => (
                  <li key={q.id}>
                    <a
                      className={`pr-chapternav-q pr-chapternav-q--${q.state}`}
                      href={q.href}
                      aria-current={q.state === 'current' ? 'page' : undefined}
                      onClick={onNavigate ? (e) => onNavigate(q.href, e) : undefined}
                    >
                      <span aria-hidden="true">{MARK[q.state]} </span>
                      <span className="pr-chapternav-sr">{tx(MARK_LABEL[q.state])}: </span>
                      {q.title}
                    </a>
                  </li>
                ))}
              </ol>
            ) : null}
          </li>
        ))}
      </ol>
      {legend ? (
        <div className="pr-chapternav-legend">
          <span>✓ {tx('respondida')}</span>
          <span>● {tx('atual')}</span>
          <span>○ {tx('pendente')}</span>
          <span>~ {tx('sugerida')}</span>
        </div>
      ) : null}
    </nav>
  );
}
