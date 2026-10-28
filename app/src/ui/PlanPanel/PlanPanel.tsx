import { useEffect, useRef } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { KpiTile } from '../KpiTile/KpiTile';
import './PlanPanel.css';
import { tx } from '../texto';

export type PlanPanelState = 'empty' | 'writing' | 'complete';

export type PanelKpi = {
  id: string;
  label: string;
  /** Sem valor: "—" em `line-control`. */
  value?: string;
  fullValue?: string;
  /** Só um item em âmbar por vez. */
  fresh?: boolean;
};

export type PanelRecommendation = {
  id: string;
  text: string;
  fresh?: boolean;
};

export type PanelSection = {
  id: string;
  /** "Quanto custa", "O que exigir". */
  title: string;
  /** "aparece no capítulo 4", "4 cláusulas já definidas". */
  note?: string;
};

export type PlanPanelProps = {
  state: PlanPanelState;
  /** Rótulos da zona por estado; o padrão é "Seu plano · em branco | escrevendo | completo". */
  stateLabels?: Partial<Record<PlanPanelState, string>>;
  /** Link "Abrir inteiro". */
  openHref?: string;
  onOpen?: (e: MouseEvent<HTMLAnchorElement>) => void;
  /** Capa: kicker, título do caso em serif e uma linha de fatos. */
  kicker?: string;
  title?: string;
  facts?: string;
  /** Em branco: o que mostrar nas lacunas ("Rede: ———"). */
  emptyTitle?: string;
  emptyFacts?: string;
  emptyMessage?: string;
  summaryTitle?: string;
  kpis: PanelKpi[];
  /** Linha de origem abaixo dos KPIs ("estimativa com premissas padrão · de onde vem?"). */
  originLine?: ReactNode;
  recommendationsTitle?: string;
  recommendations?: PanelRecommendation[];
  /** Total de recomendações, mostrado ao lado do título. */
  recommendationsCount?: number;
  /** Páginas ainda vazias ou resumidas, em `muted`. */
  sections?: PanelSection[];
  /** Rodapé: só "Abrir o plano inteiro" e "Baixar PDF". */
  footer?: ReactNode;
  /** Sem a largura fixa de 400 px (dentro da gaveta). */
  fluid?: boolean;
  /** Sem a zona e o fundo `surface-0`: só o papel. */
  paperOnly?: boolean;
  className?: string;
};

const STATE_LABEL: Record<PlanPanelState, string> = {
  empty: 'Seu plano · em branco',
  writing: 'Seu plano · escrevendo',
  complete: 'Seu plano · completo',
};

/** O plano em miniatura, que se preenche a cada resposta. Rola sozinho até o item recém-mudado. */
export function PlanPanel({
  state,
  stateLabels,
  openHref,
  onOpen,
  kicker = tx('Plano de contratação'),
  title,
  facts,
  emptyTitle = tx('Rede: ———'),
  emptyFacts = tx('Problema: ——— · Teste: ———'),
  emptyMessage = tx('A primeira resposta escreve a primeira linha.'),
  summaryTitle = tx('Em resumo'),
  kpis,
  originLine,
  recommendationsTitle = tx('O que fazer'),
  recommendations = [],
  recommendationsCount,
  sections = [],
  footer,
  fluid,
  paperOnly,
  className,
}: PlanPanelProps) {
  const paper = useRef<HTMLDivElement>(null);
  const freshKey = [...kpis.filter((k) => k.fresh).map((k) => `k:${k.id}`), ...recommendations.filter((r) => r.fresh).map((r) => `r:${r.id}`)].join(',');

  useEffect(() => {
    if (!freshKey || !paper.current) return;
    const el = paper.current.querySelector<HTMLElement>('[data-fresh="true"]');
    if (el && typeof el.scrollIntoView === 'function') {
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }
  }, [freshKey]);

  const empty = state === 'empty';
  const zone = stateLabels?.[state] ?? tx(STATE_LABEL[state]);

  const paperEl = (
    <div
      ref={paper}
      className={['pr-planpanel-paper', empty ? 'pr-planpanel-paper--empty' : ''].filter(Boolean).join(' ')}
    >
      <div className="pr-planpanel-cover">
        <div className="pr-planpanel-kicker">{kicker}</div>
        <div className={['pr-planpanel-title', empty ? 'pr-planpanel-title--empty' : ''].filter(Boolean).join(' ')}>
          {empty ? emptyTitle : title}
        </div>
        <div className="pr-planpanel-facts">{empty ? emptyFacts : facts}</div>
      </div>

      <div className={['pr-planpanel-sec', empty ? 'pr-planpanel-sec--dim' : ''].filter(Boolean).join(' ')}>
        {summaryTitle}
      </div>
      <div className="pr-planpanel-kpis">
        {kpis.map((k) => (
          <div key={k.id} data-fresh={k.fresh ? 'true' : undefined}>
            <KpiTile compact label={k.label} value={k.value} fullValue={k.fullValue} fresh={k.fresh} />
          </div>
        ))}
      </div>
      {originLine ? <div className="pr-planpanel-origin">{originLine}</div> : null}

      {!empty && (recommendations.length > 0 || recommendationsCount) ? (
        <>
          <div className="pr-planpanel-sec">
            {recommendationsTitle}
            {recommendationsCount ? <span className="pr-planpanel-count"> · {recommendationsCount}</span> : null}
          </div>
          <ul className="pr-planpanel-recs">
            {recommendations.map((r) => (
              <li
                key={r.id}
                className={['pr-planpanel-rec', r.fresh ? 'pr-planpanel-rec--fresh' : ''].filter(Boolean).join(' ')}
                data-fresh={r.fresh ? 'true' : undefined}
              >
                <i className="pr-planpanel-box" aria-hidden="true" />
                <span>
                  {r.fresh ? <span className="pr-planpanel-new">{tx('Novo:')} </span> : null}
                  {r.text}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {sections.map((s) => (
        <div key={s.id} className="pr-planpanel-sec pr-planpanel-sec--dim">
          {s.title}
          {s.note ? <span className="pr-planpanel-count"> · {s.note}</span> : null}
          {empty ? (
            <span className="pr-planpanel-skeleton" aria-hidden="true">
              <i style={{ width: '70%' }} />
              <i style={{ width: '45%' }} />
            </span>
          ) : null}
        </div>
      ))}

      {empty ? <div className="pr-planpanel-empty-msg">{emptyMessage}</div> : null}
      {footer ? <div className="pr-planpanel-footer">{footer}</div> : null}
    </div>
  );

  if (paperOnly) return paperEl;

  // Embutido numa moldura que já é o landmark "Seu plano" (modo fluido), o painel é só um bloco: dois `aside`
  // com o mesmo nome, um dentro do outro, confundem a navegação por landmarks do leitor de tela.
  const Raiz = fluid ? 'div' : 'aside';
  return (
    <Raiz
      className={['pr-planpanel', fluid ? 'pr-planpanel--fluid' : '', className ?? ''].filter(Boolean).join(' ')}
      aria-label={fluid ? undefined : tx('Seu plano')}
    >
      <div className="pr-planpanel-zone">
        <span>{zone}</span>
        {openHref ? (
          <a className="pr-planpanel-open" href={openHref} onClick={onOpen}>
            {tx('Abrir inteiro')}
          </a>
        ) : null}
      </div>
      {paperEl}
    </Raiz>
  );
}
