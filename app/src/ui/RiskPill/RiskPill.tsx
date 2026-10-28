import './RiskPill.css';
import { tx } from '../texto';

/** Níveis de risco e estados de célula da matriz. */
export type RiskLevel =
  | 'limitado'
  | 'moderado'
  | 'elevado'
  | 'critico'
  | 'orientacao'
  | 'nao-se-aplica'
  | 'respondido'
  | 'em-andamento'
  | 'pendente';

export const RISK_LABELS: Record<RiskLevel, string> = {
  limitado: 'Limitado',
  moderado: 'Moderado',
  elevado: 'Elevado',
  critico: 'Crítico',
  orientacao: 'Orientação',
  'nao-se-aplica': 'Não se aplica',
  respondido: 'Respondido',
  'em-andamento': 'Em andamento',
  pendente: 'Pendente',
};

const TONE: Record<RiskLevel, 'ok' | 'warn' | 'high' | 'crit' | 'info'> = {
  limitado: 'ok',
  moderado: 'warn',
  elevado: 'high',
  critico: 'crit',
  orientacao: 'info',
  'nao-se-aplica': 'info',
  respondido: 'ok',
  'em-andamento': 'warn',
  pendente: 'info',
};

export type RiskPillProps = {
  level: RiskLevel;
  /** Texto, se vier traduzido de fora; o padrão é a palavra do nível. */
  label?: string;
  className?: string;
};

/** Pílula de nível de risco ou de estado, sempre com a palavra. Não é botão. */
export function RiskPill({ level, label, className }: RiskPillProps) {
  return (
    <span className={['pr-riskpill', `pr-riskpill--${TONE[level]}`, className ?? ''].filter(Boolean).join(' ')}>
      <i className="pr-riskpill-dot" aria-hidden="true" />
      {label ?? tx(RISK_LABELS[level])}
    </span>
  );
}
