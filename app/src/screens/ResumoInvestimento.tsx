// v022.1: "Resumo do investimento" no plano: quadro por prioridade e uma tabela de categorias para cada prioridade,
// no período do plano e na moeda escolhida pela pessoa.
import type { ReactNode } from 'react';
import type { CasoStore } from '../store';
import { t } from '../percurso/textos';
import { formatarMoedaEst } from '../percurso/estimativasOrcamento';
import { resumoInvestimento, type LinhaInvestimento } from '../percurso/resumoInvestimento';
import './resumoInvestimento.css';

export function ResumoInvestimento({ s }: { s: CasoStore }) {
  const r = resumoInvestimento(s);
  if (!r || !r.prioridades.length) return null;
  const f = (v: number) => formatarMoedaEst(v, r.moeda);
  const cab = (primeira: string, meses = r.meses) => <thead><tr><th scope="col">{primeira}</th>
    <th scope="col">CapEx<span className="ri-sub">{t('investimento')}</span></th>
    <th scope="col">OpEx<span className="ri-sub">{t('operação')}</span></th>
    <th scope="col">{t('Custo de utilidades')}<span className="ri-sub">{t('consumo medido')}</span></th>
    <th scope="col">{t('Total')}<span className="ri-sub">{t('{n} meses', { n: meses })}</span></th></tr></thead>;
  const linha = (l: LinhaInvestimento, nome: ReactNode, cls = '', key?: string) => <tr key={key} className={cls}><th scope="row">{nome}</th>
    <td>{l.semValor ? t('falta valor') : f(l.k)}</td><td>{l.semValor ? '—' : f(l.x)}</td><td>{l.semValor ? '—' : f(l.u)}</td><td className="ri-total">{l.semValor ? '—' : f(l.total)}</td></tr>;
  const periodo = r.mesesIguais ? t('Orçamento de {n} meses · {moeda}', { n: r.meses, moeda: r.moeda }) : t('Orçamento de até {n} meses · {moeda}', { n: r.meses, moeda: r.moeda });
  return <section className="ri" aria-labelledby="ri-titulo">
    <h2 id="ri-titulo">{t('Resumo do investimento')}</h2>
    <p className="ri-periodo">{periodo}</p>
    <p className="pc-nota">{t('Todos os valores cobrem o período completo do plano.')}</p>
    <div className="ri-rolo" tabIndex={0} role="region" aria-label={t('Resumo do investimento')}>
      <table className="ri-tabela">
        {cab(t('Prioridade'))}
        <tbody>{r.prioridades.map(p => linha(p, <><span className="ri-nome">{p.rotulo}</span><span className="ri-desc">{p.descricao}{r.mesesIguais ? '' : ' · ' + t('{n} meses', { n: p.meses })}</span></>, 'ri-prioridade ri-prioridade--' + p.id, p.id))}</tbody>
        <tfoot>{linha(r.total, t('Total'), 'ri-linha-total')}</tfoot>
      </table>
    </div>
    <div className="ri-faixa"><span><b>{t('Investimento total')}</b> {f(r.total.total)}</span>
      {r.pctOperacaoUso === null ? null : <span>{t('{p}% vai para operação e uso', { p: r.pctOperacaoUso })}</span>}</div>
    {r.prioridades.map(p => <div key={p.id} className="ri-bloco">
      <h3>{p.rotulo} <span className="ri-desc">{t('{n} meses', { n: p.meses })}</span></h3>
      <div className="ri-rolo" tabIndex={0} role="region" aria-label={p.rotulo}>
        <table className="ri-tabela ri-tabela--cat">
          {cab(t('Categoria'), p.meses)}
          <tbody>{p.categorias.map(c => linha(c, c.rotulo, '', c.rotulo))}</tbody>
          <tfoot>{linha(p, t('Total'), 'ri-linha-total')}</tfoot>
        </table>
      </div>
      {p.semIA !== undefined ? <p className="pc-nota">{t('Os valores da educação são os da alternativa com IA. A alternativa sem IA soma {v}.', { v: f(p.semIA) })}</p> : null}
    </div>)}
    <p className="pc-nota">{t('O OpEx não inclui o consumo medido, que aparece em custo de utilidades. Custos compartilhados entram uma vez só.')}</p>
  </section>;
}
