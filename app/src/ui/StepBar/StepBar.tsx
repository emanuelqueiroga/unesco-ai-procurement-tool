import type { MouseEvent } from 'react';
import './StepBar.css';
import { tx } from '../texto';

export type Step = {
  n: number;
  /** Nome da etapa ("Contexto", "Implementação e recursos"). */
  label: string;
  href: string;
  /** Concluída: ✓ e segmento cheio; atual: rótulo em `ink` 600 com "n de m"; a fazer: segmento vazio ou parcial. */
  state: 'done' | 'current' | 'todo';
  /** Proporção preenchida do segmento, 0 a 1 (na atual: a posição da tela dentro da etapa). */
  progress: number;
  /** Na etapa atual: posição da tela dentro dela ("2 de 4"). */
  position?: string;
};

export type StepBarProps = {
  steps: Step[];
  /** Celular: só os segmentos e, acima, "Etapa n de m · nome". */
  compact?: boolean;
  label?: string;
  onNavigate?: (href: string, e: MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
};

/** Etapas da frente em linha, no cabeçalho: segmentos com ✓ nas concluídas e "Etapa · n de m" na atual. */
export function StepBar({ steps, compact, label, onNavigate, className }: StepBarProps) {
  const atual = steps.find((s) => s.state === 'current');
  return (
    <nav className={['pr-stepbar', compact ? 'pr-stepbar--compact' : '', className ?? ''].filter(Boolean).join(' ')} aria-label={label ?? tx('Etapas da frente')}>
      {compact && atual ? (
        <p className="pr-stepbar-resumo">
          <strong>{tx('Etapa {n} de {total}', { n: steps.indexOf(atual) + 1, total: steps.length })}</strong> · {atual.label}
          {atual.position ? <span className="pr-stepbar-pos"> · {atual.position}</span> : null}
        </p>
      ) : null}
      <ol className="pr-stepbar-lista" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((s) => {
          const pct = s.state === 'done' ? 100 : Math.round(Math.max(0, Math.min(1, s.progress)) * 100);
          const nome = s.state === 'done' ? tx('{nome}, concluída', { nome: s.label }) : s.state === 'current' ? s.label + (s.position ? ' · ' + s.position : '') : s.label;
          return (
            <li key={s.n} className={`pr-stepbar-item pr-stepbar-item--${s.state}`}>
              <a href={s.href} aria-current={s.state === 'current' ? 'step' : undefined} aria-label={compact ? nome : undefined}
                onClick={onNavigate ? (e) => onNavigate(s.href, e) : undefined}>
                <span className="pr-stepbar-trilho" aria-hidden="true"><i style={{ inlineSize: `${pct}%` }} /></span>
                {compact ? null : (
                  <span className="pr-stepbar-rotulo">
                    {s.state === 'done' ? <span aria-hidden="true">✓ </span> : null}
                    {s.label}
                    {s.state === 'current' && s.position ? <span className="pr-stepbar-pos"> · {s.position}</span> : null}
                    {s.state === 'done' ? <span className="pr-stepbar-sr"> ({tx('concluída')})</span> : null}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
