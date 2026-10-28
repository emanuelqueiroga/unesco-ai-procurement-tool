import type { ReactNode } from 'react';
import './Chip.css';

export type ChipProps = {
  label: string;
  /** Selecionado: fundo `primary`, texto `on-primary`. */
  pressed: boolean;
  onToggle?: (pressed: boolean) => void;
  /** Sugerido e não confirmado: fundo `accent-tint`, borda `accent`, prefixo "~". */
  suggested?: boolean;
  disabled?: boolean;
};

/** Chip de seleção múltipla: botão com `aria-pressed`, 36 px, `radius-pill`. */
export function Chip({ label, pressed, onToggle, suggested, disabled }: ChipProps) {
  const cls = ['pr-chip', suggested && !pressed ? 'pr-chip--suggested' : ''].filter(Boolean).join(' ');
  return (
    <button
      type="button"
      className={cls}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={() => onToggle?.(!pressed)}
    >
      {suggested && !pressed ? `~ ${label}` : label}
    </button>
  );
}

export type ChipGroupProps = {
  /** Rótulo acessível do grupo (a pergunta). */
  label: string;
  /** Contador acima do grupo em `caption-13`: "2 de 3 marcados". */
  counter?: ReactNode;
  children: ReactNode;
  /** Conteúdo logo abaixo do grupo, como o `TextField` do chip "Outro…". */
  after?: ReactNode;
  className?: string;
};

/** Grupo de chips na ordem do catálogo; nunca reordena ao selecionar. */
export function ChipGroup({ label, counter, children, after, className }: ChipGroupProps) {
  return (
    <div className={['pr-chip-group', className ?? ''].filter(Boolean).join(' ')}>
      {counter ? <div className="pr-chip-counter">{counter}</div> : null}
      <div className="pr-chip-list" role="group" aria-label={label}>
        {children}
      </div>
      {after ? <div className="pr-chip-after">{after}</div> : null}
    </div>
  );
}
