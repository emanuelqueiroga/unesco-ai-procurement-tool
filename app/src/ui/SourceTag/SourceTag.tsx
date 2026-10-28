import type { MouseEvent, ReactNode } from 'react';
import './SourceTag.css';
import { tx } from '../texto';

/** As quatro origens de um valor, sempre as mesmas palavras. */
export type Origin = 'padrao' | 'sugerido' | 'informado' | 'refinado';

export const ORIGIN_LABELS: Record<Origin, string> = {
  padrao: 'padrão',
  sugerido: '~ sugerido',
  informado: 'informado',
  refinado: 'refinado',
};

export type SourceTagProps = {
  origin: Origin;
  /** Texto da etiqueta, se a tradução vier de fora; o padrão são as quatro palavras. */
  label?: string;
  className?: string;
};

/** Etiqueta de origem com quatro estados fixos. Use sempre com `SourceLink` na mesma linha. */
export function SourceTag({ origin, label, className }: SourceTagProps) {
  return (
    <span className={['pr-sourcetag', `pr-sourcetag--${origin}`, className ?? ''].filter(Boolean).join(' ')}>
      {label ?? tx(ORIGIN_LABELS[origin])}
    </span>
  );
}

export type SourceLinkProps = {
  href?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  children?: ReactNode;
  className?: string;
};

/** O link "de onde vem?", companheiro obrigatório da etiqueta: abre a premissa ou leva à pergunta. */
export function SourceLink({ href, onClick, children, className }: SourceLinkProps) {
  const cls = ['pr-sourcelink', className ?? ''].filter(Boolean).join(' ');
  if (href) {
    return (
      <a className={cls} href={href} onClick={onClick}>
        {children ?? tx('de onde vem?')}
      </a>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick}>
      {children ?? tx('de onde vem?')}
    </button>
  );
}

export type SourceLineProps = {
  origin?: Origin;
  /** Texto entre a etiqueta e o link: "em 4 premissas", "5% de 48 escolas". */
  note?: ReactNode;
  href?: string;
  onWhence?: (e: MouseEvent<HTMLElement>) => void;
  /** Rótulo do link; o padrão é "de onde vem?". */
  linkLabel?: ReactNode;
  className?: string;
};

/** Linha de origem completa: etiqueta · nota · "de onde vem?". */
export function SourceLine({ origin, note, href, onWhence, linkLabel, className }: SourceLineProps) {
  return (
    <span className={['pr-sourceline', className ?? ''].filter(Boolean).join(' ')}>
      {origin ? <SourceTag origin={origin} /> : null}
      {note ? <span className="pr-sourceline-note">{note}</span> : null}
      <span className="pr-sourceline-sep" aria-hidden="true">
        ·
      </span>
      <SourceLink href={href} onClick={onWhence}>
        {linkLabel}
      </SourceLink>
    </span>
  );
}
