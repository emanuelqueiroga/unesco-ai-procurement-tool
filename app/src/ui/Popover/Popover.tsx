// Popover do Prumo: painel pequeno ancorado no gatilho ("de onde vem?"), sem modal. Abre e fecha no clique,
// fecha com Esc ou clique fora e devolve o foco ao gatilho.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { tx } from '../texto';
import './Popover.css';

export type PopoverProps = {
  /** texto do gatilho (padrão: "de onde vem?") */
  label?: ReactNode;
  /** título do painel */
  title?: ReactNode;
  children: ReactNode;
  /** ações no rodapé do painel (links ou botões) */
  actions?: ReactNode;
  /** alinha o painel à direita do gatilho */
  alignEnd?: boolean;
  className?: string;
};

export function Popover({ label, title, children, actions, alignEnd, className }: PopoverProps) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLSpanElement>(null);
  const gatilho = useRef<HTMLButtonElement>(null);
  const painelId = useId();
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false); };
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') { setAberto(false); gatilho.current?.focus(); } };
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', tecla); };
  }, [aberto]);
  return (
    <span ref={raiz} className={['pr-popover', className ?? ''].filter(Boolean).join(' ')}>
      <button
        ref={gatilho}
        type="button"
        className="pr-popover-gatilho"
        aria-expanded={aberto}
        aria-controls={painelId}
        onClick={() => setAberto((x) => !x)}
      >
        {label ?? tx('de onde vem?')}
      </button>
      {aberto ? (
        <span id={painelId} role="dialog" aria-label={typeof title === 'string' ? title : undefined} className={['pr-popover-painel', alignEnd ? 'pr-popover-painel--fim' : ''].filter(Boolean).join(' ')}>
          {title ? <span className="pr-popover-titulo">{title}</span> : null}
          <span className="pr-popover-corpo">{children}</span>
          {actions ? <span className="pr-popover-acoes">{actions}</span> : null}
        </span>
      ) : null}
    </span>
  );
}
