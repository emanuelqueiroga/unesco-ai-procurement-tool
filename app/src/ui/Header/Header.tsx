import type { MouseEvent, ReactNode } from 'react';
import './Header.css';

export type HeaderLogo = { src: string; alt: string };

export type HeaderProps = {
  /** Os dois logos, na ordem: Cátedra UNESCO UNITWIN, IA.EDU. Sempre sobre a placa branca. */
  logos: HeaderLogo[];
  /** Sempre "AI in Education Procurement Tool"; nunca traduzido nem abreviado. */
  name?: string;
  /** Link do nome (a página inicial). */
  href?: string;
  onNavigate?: (href: string, e: MouseEvent<HTMLAnchorElement>) => void;
  /** Contexto do caso em `caption-13` `muted`; some em celular. */
  context?: ReactNode;
  /** Botões de 36 px à direita ("Idioma", "Modo: Essencial"). */
  actions?: ReactNode;
  /** Versão de 56 px com logos de 28 px (celular). Também acontece por media query a 400 px. */
  compact?: boolean;
  className?: string;
};

/** Cabeçalho de 64 px com a placa dos logos, o nome da ferramenta e os controles. */
export function Header({
  logos,
  name = 'AI in Education Procurement Tool',
  href,
  onNavigate,
  context,
  actions,
  compact,
  className,
}: HeaderProps) {
  return (
    <header className={['pr-header', compact ? 'pr-header--compact' : '', className ?? ''].filter(Boolean).join(' ')}>
      <div className="pr-header-plate">
        {logos.map((l) => (
          <img key={l.src} className="pr-header-logo" src={l.src} alt={l.alt} />
        ))}
      </div>
      {href ? (
        <a className="pr-header-name" href={href} onClick={onNavigate ? (e) => onNavigate(href, e) : undefined}>
          {name}
        </a>
      ) : (
        <div className="pr-header-name">{name}</div>
      )}
      <div className="pr-header-spacer" />
      {context ? <div className="pr-header-context">{context}</div> : null}
      {actions ? <div className="pr-header-actions">{actions}</div> : null}
    </header>
  );
}
