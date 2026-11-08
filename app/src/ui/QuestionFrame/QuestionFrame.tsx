import { createContext, useContext, type ReactNode } from 'react';
import './QuestionFrame.css';
import { tx } from '../texto';

export type QuestionFrameProps = {
  /** Nome da etapa e posição da pergunta, sem prefixo de capítulo. */
  kicker?: ReactNode;
  /** A pergunta, em `question-26`. Uma por tela. */
  title: string;
  /** Explicação em `body-16` `ink-2`: por que perguntamos. */
  explanation?: ReactNode;
  /** Ajuda aberta sob a explicação ("Como responder", "Quem costuma saber", "Exemplo"); fica fora do `<p>` da explicação. */
  help?: ReactNode;
  /** O controle: TextField, OptionCard, Chip, Segmented, SchoolsGrid ou PilotSize. */
  children: ReactNode;
  /** Botões: "Voltar", "Próximo" e o link "Por que perguntamos isso?". */
  actions?: ReactNode;
  /** Rodapé: "Esta resposta muda no plano: custo do teste (Ano 0) · regras do piloto (seção A1)". */
  affects?: ReactNode;
  affectsPrefix?: string;
  className?: string;
};

/** Dentro da moldura nova (teste de layout), os botões ficam fora do quadro da pergunta, logo abaixo dele. */
export const AcoesForaDoQuadro = createContext(false);

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
  const fora = useContext(AcoesForaDoQuadro);
  const botoes = actions ? <div className={'pr-questionframe-actions' + (fora ? ' pr-questionframe-actions--fora' : '')}>{actions}</div> : null;
  const quadro = (
    <section className={['pr-questionframe', className ?? ''].filter(Boolean).join(' ')}>
      {kicker ? <div className="pr-questionframe-kicker">{kicker}</div> : null}
      <h1 className="pr-questionframe-title">{title}</h1>
      {explanation ? <p className="pr-questionframe-text">{explanation}</p> : null}
      {help ? <div className="pr-questionframe-help">{help}</div> : null}
      <div className="pr-questionframe-control">{children}</div>
      {fora ? null : botoes}
      {affects ? (
        <div className="pr-questionframe-affects">
          {affectsPrefix ?? tx('Esta resposta muda no plano:')} {affects}
        </div>
      ) : null}
    </section>
  );
  return fora ? <>{quadro}{botoes}</> : quadro;
}
