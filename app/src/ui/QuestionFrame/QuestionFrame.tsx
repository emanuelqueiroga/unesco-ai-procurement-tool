import type { ReactNode } from 'react';
import './QuestionFrame.css';
import { tx } from '../texto';

export type QuestionFrameProps = {
  /** "Capítulo 2 · O teste · pergunta 6 de 11". */
  kicker: ReactNode;
  /** A pergunta, em `question-26`. Uma por tela. */
  title: string;
  /** Explicação em `body-16` `ink-2`: por que perguntamos. */
  explanation?: ReactNode;
  /** Ajuda aberta sob a explicação ("Como responder", "Quem costuma saber", "Exemplo"); fica fora do `<p>` da explicação. */
  help?: ReactNode;
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
  help,
  children,
  actions,
  affects,
  affectsPrefix,
  className,
}: QuestionFrameProps) {
  return (
    <section className={['pr-questionframe', className ?? ''].filter(Boolean).join(' ')}>
      <div className="pr-questionframe-kicker">{kicker}</div>
      <h1 className="pr-questionframe-title">{title}</h1>
      {explanation ? <p className="pr-questionframe-text">{explanation}</p> : null}
      {help ? <div className="pr-questionframe-help">{help}</div> : null}
      <div className="pr-questionframe-control">{children}</div>
      {actions ? <div className="pr-questionframe-actions">{actions}</div> : null}
      {affects ? (
        <div className="pr-questionframe-affects">
          {affectsPrefix ?? tx('Esta resposta muda no plano:')} {affects}
        </div>
      ) : null}
    </section>
  );
}
