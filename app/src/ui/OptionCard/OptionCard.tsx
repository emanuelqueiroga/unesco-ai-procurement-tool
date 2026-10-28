import type { ReactNode } from 'react';
import './OptionCard.css';

export type OptionCardProps = {
  /** Nome do grupo de rádio (ou da caixa). */
  name: string;
  value: string;
  label: ReactNode;
  /** Subtexto em `caption-13` `muted` à direita ("em 30 de 48 escolas"). */
  subtext?: ReactNode;
  checked: boolean;
  onChange?: (value: string, checked: boolean) => void;
  /** Escolha única (padrão) ou múltipla. */
  type?: 'radio' | 'checkbox';
  disabled?: boolean;
  /** Campo condicional (`OptionCardField`), mostrado dentro do cartão selecionado, à direita. */
  children?: ReactNode;
};

/** Cartão de opção com controle nativo; selecionado: borda 2 px `primary`, fundo `primary-tint`, peso 600. */
export function OptionCard({
  name,
  value,
  label,
  subtext,
  checked,
  onChange,
  type = 'radio',
  disabled,
  children,
}: OptionCardProps) {
  const cls = ['pr-optioncard', checked ? 'pr-optioncard--selected' : '', disabled ? 'pr-optioncard--disabled' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <label className={cls}>
      <input
        className="pr-optioncard-input"
        type={type}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(value, e.target.checked)}
      />
      <span className="pr-optioncard-label">{label}</span>
      {checked && children ? <span className="pr-optioncard-extra">{children}</span> : null}
      {subtext ? <span className="pr-optioncard-sub">{subtext}</span> : null}
    </label>
  );
}

export type OptionCardFieldProps = {
  /** Legenda visível antes do campo ("Em quantas?"); também é o `aria-label`. */
  label: string;
  value: string;
  onChange?: (value: string) => void;
  /** Texto depois do campo ("de 48"). */
  suffix?: ReactNode;
  size?: number;
};

/** Campo numérico curto para dentro de um `OptionCard` selecionado. */
export function OptionCardField({ label, value, onChange, suffix, size = 4 }: OptionCardFieldProps) {
  return (
    <>
      <span className="pr-optioncard-caption">{label}</span>
      <input
        className="pr-optioncard-field"
        aria-label={label}
        inputMode="numeric"
        size={size}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onClick={(e) => e.stopPropagation()}
      />
      {suffix ? <span className="pr-optioncard-caption">{suffix}</span> : null}
    </>
  );
}

export type OptionCardGroupProps = {
  /** Rótulo acessível do grupo (a pergunta). */
  label: string;
  type?: 'radio' | 'checkbox';
  children: ReactNode;
  className?: string;
};

/** Lista vertical de cartões, uma coluna, com `role="radiogroup"` ou `role="group"`. */
export function OptionCardGroup({ label, type = 'radio', children, className }: OptionCardGroupProps) {
  return (
    <div
      className={['pr-optioncard-group', className ?? ''].filter(Boolean).join(' ')}
      role={type === 'radio' ? 'radiogroup' : 'group'}
      aria-label={label}
    >
      {children}
    </div>
  );
}
