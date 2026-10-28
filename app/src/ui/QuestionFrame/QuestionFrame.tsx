import type { ReactNode } from 'react';
import './QuestionFrame.css';

export type QuestionFrameProps = {
  /** "Capítulo 2 · O teste · pergunta 6 de 11". */
  kicker: ReactNode;
  /** A pergunta, em `question-26`. Uma por tela. */
  title: string;
  /** Explicação em `body-16` `ink-2`: por que perguntamos. */
  explanation?: ReactNode;
  /** O controle: TextField, OptionCard, Chip, Segmented, SchoolsGrid ou PilotSize. */
  children: ReactNode;
  /** Botões: primário, "Pular por agora" e o link "Por que perguntamos isso?". */
  actions?: ReactNode;
  /** Rodapé: "Esta resposta muda no plano: custo do teste (Ano 0) · regras do piloto (seção A1)". */
  affects?: ReactNode;
  affectsPrefix?: string;
  className?: string;
};

/** Moldura de uma pergunta: kicker, título, explicação, controle, ações e o rodapé do que muda no plano. */
export function QuestionFrame({
  kicker,
  title,
  explanation,
  children,
  actions,
  affects,
  affectsPrefix = 'Esta resposta muda no plano:',
  className,
}: QuestionFrameProps) {
  return (
    <section className={['pr-questionframe', className ?? ''].filter(Boolean).join(' ')}>
      <div className="pr-questionframe-kicker">{kicker}</div>
      <h1 className="pr-questionframe-title">{title}</h1>
      {explanation ? <p className="pr-questionframe-text">{explanation}</p> : null}
      <div className="pr-questionframe-control">{children}</div>
      {actions ? <div className="pr-questionframe-actions">{actions}</div> : null}
      {affects ? (
        <div className="pr-questionframe-affects">
          {affectsPrefix} {affects}
        </div>
      ) : null}
    </section>
  );
}
