import type { ReactNode } from 'react';
import { IconBlocked, IconInfo, IconWarning } from '../icons';
import './Alert.css';

export type AlertKind = 'info' | 'atencao' | 'bloqueio';

export type AlertProps = {
  kind: AlertKind;
  /** Título em peso 600. */
  title: ReactNode;
  /** Uma frase que diz o que fazer. */
  children?: ReactNode;
  className?: string;
};

const ICON: Record<AlertKind, typeof IconInfo> = { info: IconInfo, atencao: IconWarning, bloqueio: IconBlocked };

/** Faixa de aviso em três níveis. Um alerta por tela, no topo do conteúdo a que se refere. */
export function Alert({ kind, title, children, className }: AlertProps) {
  const Icon = ICON[kind];
  return (
    <div
      className={['pr-alert', `pr-alert--${kind}`, className ?? ''].filter(Boolean).join(' ')}
      role={kind === 'bloqueio' ? 'alert' : undefined}
    >
      <Icon className="pr-alert-icon" />
      <div className="pr-alert-body">
        <b className="pr-alert-title">{title}</b>
        {children}
      </div>
    </div>
  );
}
