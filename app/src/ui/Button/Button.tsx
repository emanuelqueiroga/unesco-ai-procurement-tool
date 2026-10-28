import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'link';
export type ButtonSize = 'md' | 'sm';

type Common = {
  variant?: ButtonVariant;
  /** `sm` (36 px) é só para o cabeçalho e a gaveta; a área de toque continua 44 px. */
  size?: ButtonSize;
  /** Em celular o primário ocupa a largura toda. */
  fullWidth?: boolean;
  /** Ícone de traço antes do texto. Um botão só com ícone precisa de `aria-label`. */
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export type ButtonProps = Common &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { href?: undefined };

export type ButtonLinkProps = Common &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & {
    href: string;
    disabled?: boolean;
  };

function classes({ variant = 'primary', size = 'md', fullWidth, icon, children, className }: Common) {
  return [
    'pr-button',
    `pr-button--${variant}`,
    size === 'sm' ? 'pr-button--sm' : '',
    fullWidth ? 'pr-button--full' : '',
    icon && !children ? 'pr-button--icon-only' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

/** Botão de ação em três pesos. Com `href` vira um link com a mesma aparência. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps | ButtonLinkProps>(function Button(props, ref) {
  const { variant, size, fullWidth, icon, children, className, ...rest } = props;
  const cls = classes({ variant, size, fullWidth, icon, children, className });
  if ('href' in rest && typeof rest.href === 'string') {
    const { disabled, ...a } = rest as ButtonLinkProps;
    return (
      <a
        {...a}
        ref={ref as unknown as React.Ref<HTMLAnchorElement>}
        className={cls}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : a.tabIndex}
      >
        {icon}
        {children}
      </a>
    );
  }
  const b = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type="button" {...b} ref={ref} className={cls}>
      {icon}
      {children}
    </button>
  );
});
