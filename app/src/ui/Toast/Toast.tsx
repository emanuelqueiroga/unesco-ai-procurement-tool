import { useEffect } from 'react';
import type { ReactNode } from 'react';
import './Toast.css';

export type ToastProps = {
  open: boolean;
  /** Uma frase. */
  message: ReactNode;
  /** No máximo um link de ação ("Desfazer"). */
  action?: { label: string; onClick: () => void };
  /** Some em 4 segundos; `0` desliga o temporizador. */
  duration?: number;
  onClose?: () => void;
  /** Só para amostra (galeria): fica no fluxo em vez do canto inferior. */
  inline?: boolean;
  className?: string;
};

/** Aviso breve de confirmação, `role="status"`, no canto inferior. Nunca para erro. */
export function Toast({ open, message, action, duration = 4000, onClose, inline, className }: ToastProps) {
  useEffect(() => {
    if (!open || !duration || !onClose) return;
    const t = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(t);
  }, [open, duration, onClose]);
  if (!open) return null;
  return (
    <div
      className={['pr-toast', inline ? 'pr-toast--inline' : '', className ?? ''].filter(Boolean).join(' ')}
      role="status"
    >
      <span>{message}</span>
      {action ? (
        <button type="button" className="pr-toast-action" onClick={action.onClick}>
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
