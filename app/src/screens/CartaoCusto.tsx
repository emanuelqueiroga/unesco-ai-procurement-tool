// Cartão de custo da moldura atual (v018): no computador, a coluna à direita com os números que o painel
// "Seu plano" já mostra (custo total, Ano 0, por ano, por usuário); no celular e em telas médias, uma faixa noite
// sob o cabeçalho que leva ao plano. Os números são os de usePainel; nada é somado de novo.
import type { CasoStore } from '../store';
import { t } from '../percurso/textos';
import { href } from '../percurso/rota';
import { usePainel } from './PlanoVivo';
import './moldura.css';

/** O cartão noite com o total e os demais números do painel. */
export function CartaoCustoProjeto({ s }: { s: CasoStore }) {
  const p = usePainel(s);
  const total = p.kpis.find(k => k.id === 'kpi.total'), resto = p.kpis.filter(k => k.id !== 'kpi.total');
  const padrao = p.kpis.some(k => k.value && k.origem === 'padrao');
  const nota = p.temNumeros ? (padrao ? t('estimativa com premissas padrão') : t('estimativa com as suas respostas')) : t('Os números aparecem quando você disser o tipo de tecnologia (pergunta 2.3.4).');
  return <section className="pc-custo" aria-label={t('Custo deste projeto')}>
    <div className="pc-custo-cab">
      <h2 className="pc-custo-rotulo">{total?.label || t('Custo deste projeto')}</h2>
      <p className="pc-custo-total" title={total?.fullValue}>{total?.value ?? '—'}</p>
      <p className="pc-custo-nota">{nota}</p>
    </div>
    <dl className="pc-custo-lista">{resto.map(k => <div key={k.id} className="pc-custo-lista-par"><dt>{k.label}</dt><dd title={k.fullValue}>{k.value ?? '—'}</dd></div>)}</dl>
  </section>;
}

/** Coluna direita no computador: o cartão e o link para o plano. */
export function ColunaCusto({ s }: { s: CasoStore }) {
  return <aside className="pc-coluna-custo" aria-label={t('Custo deste projeto')}>
    <CartaoCustoProjeto s={s} />
    <nav className="pc-custo-links" aria-label={t('Plano')}>
      <a className="pc-custo-link" href={href.plano()}>{t('Ver o plano')} <span aria-hidden="true">→</span></a>
    </nav>
  </aside>;
}

/** Celular e telas médias: faixa noite com o total, que leva ao plano. */
export function FaixaCusto({ s }: { s: CasoStore }) {
  const p = usePainel(s), total = p.kpis.find(k => k.id === 'kpi.total');
  return <div className="pc-faixa-custo-wrap"><a className="pc-faixa-custo" href={href.plano()} aria-label={(total?.label || t('Custo deste projeto')) + ': ' + (total?.fullValue || '—') + '. ' + t('Ver o plano')}>
    <span className="pc-faixa-custo-total">{total?.value ?? '—'}</span>
    <span className="pc-faixa-custo-dir">{total?.label} <span aria-hidden="true">›</span></span>
  </a></div>;
}
