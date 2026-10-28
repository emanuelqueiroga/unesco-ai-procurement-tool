import { useId, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { useFocusTrap } from '../focusTrap';
import './Dialog.css';

export type DialogProps = {
  open: boolean;
  /** Fecha com Esc, clique no fundo ou pelo botão secundário. */
  onClose: () => void;
  title: ReactNode;
  /** Texto em `body-14` `ink-2`, ou o conteúdo da figura. */
  children?: ReactNode;
  /** No máximo dois botões, secundário antes do primário. */
  actions?: ReactNode;
  /** Visualizador de figura: caixa de até 90% da tela. */
  size?: 'default' | 'figure';
  /** O botão que abriu o diálogo, para devolver o foco. */
  returnFocusTo?: RefObject<HTMLElement>;
  /** Só para amostra (galeria): preso ao contêiner pai, sem prender o foco. */
  inline?: boolean;
  className?: string;
};

/** Diálogo modal: `role="dialog"`, `aria-modal`, foco preso e devolvido ao botão de origem. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
  size = 'default',
  returnFocusTo,
  inline,
  className,
}: DialogProps) {
  const box = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(box, open && !inline, onClose, returnFocusTo);
  if (!open) return null;
  return (
    <div className={['pr-dialog-root', inline ? 'pr-dialog-root--inline' : ''].filter(Boolean).join(' ')}>
      <div className="pr-dialog-overlay" onClick={onClose} aria-hidden="true" />
      <div
        ref={box}
        className={['pr-dialog', size === 'figure' ? 'pr-dialog--figure' : '', className ?? ''].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal={inline ? undefined : true}
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <h2 id={titleId} className="pr-dialog-title">
          {title}
        </h2>
        {children ? <div className="pr-dialog-body">{children}</div> : null}
        {actions ? <div className="pr-dialog-actions">{actions}</div> : null}
      </div>
    </div>
  );
}
