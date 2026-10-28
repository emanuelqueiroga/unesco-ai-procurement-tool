import type { MouseEvent } from 'react';
import './ChapterBar.css';

export type BarChapter = {
  n: number;
  /** Nome curto do capítulo ("Sua rede", "O teste"). */
  label: string;
  /** Proporção de perguntas respondidas, 0 a 1. */
  progress: number;
  /** Capítulo atual: rótulo em `ink` 600; concluído: ✓. */
  state?: 'done' | 'current' | 'todo';
  href: string;
};

export type ChapterBarProps = {
  chapters: BarChapter[];
  /** Só os números nos rótulos (400 px). */
  compact?: boolean;
  /** Sem rótulos (só os trilhos). */
  bare?: boolean;
  onNavigate?: (href: string, e: MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
};

/** Barra de quatro segmentos com o progresso de cada capítulo, na cor da sua fase. */
export function ChapterBar({ chapters, compact, bare, onNavigate, className }: ChapterBarProps) {
  return (
    <div
      className={['pr-chapterbar', compact ? 'pr-chapterbar--compact' : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
      role="group"
      aria-label="Capítulos"
    >
      {chapters.map((c) => {
        const pct = Math.round(Math.max(0, Math.min(1, c.progress)) * 100);
        const state = c.state ?? (pct >= 100 ? 'done' : 'todo');
        const text = `${c.n} · ${c.label}`;
        return (
          <a
            key={c.n}
            className={`pr-chapterbar-item pr-chapterbar-item--${state}`}
            href={c.href}
            aria-label={`Capítulo ${c.n}, ${c.label}: ${pct}% respondido`}
            aria-current={state === 'current' ? 'step' : undefined}
            onClick={onNavigate ? (e) => onNavigate(c.href, e) : undefined}
          >
            <span className="pr-chapterbar-track" aria-hidden="true">
              <i
                className="pr-chapterbar-fill"
                style={{ width: `${pct}%`, background: `var(--phase-${c.n})` }}
              />
            </span>
            {bare ? null : (
              <span className="pr-chapterbar-label" aria-hidden="true">
                <span className="pr-chapterbar-full">{text}</span>
                <span className="pr-chapterbar-short">{c.n}</span>
                {state === 'done' ? ' ✓' : ''}
              </span>
            )}
          </a>
        );
      })}
    </div>
  );
}
