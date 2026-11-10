// Cartão de custo da moldura atual (v018): no computador, a coluna à direita; no celular e em telas médias, uma faixa
// noite sob o cabeçalho. No percurso da 0.0.14, os números do painel "Seu plano" (usePainel: custo total, Ano 0, por ano,
// por usuário). No fluxo da governança (v017), o cartão "Custo desta frente", com os números que orcamentoGovernanca
// já devolve (informado, estimado, faltam), sempre na moeda do orçamento; nada é somado de novo.
import type { ReactNode } from 'react';
import { telasAtivas, type CasoStore } from '../store';
import { LOC, percursoGovernanca } from '../domain';
import { t } from '../percurso/textos';
import { href } from '../percurso/rota';
import { orcamentoGovernanca } from '../percurso/governanca';
import { formatarMoedaEst, type Estimativa, type FrenteEstimativa } from '../percurso/estimativasOrcamento';
import { mesesV16 } from '../percurso/orcamentoV016';
import { usePainel } from './PlanoVivo';
import './moldura.css';

/** Telas de recursos de cada frente (a tabela de orçamento). */
export const TELA_RECURSOS: Record<FrenteEstimativa, string> = { governanca: 'gov-recursos', letramento: 'lit-recursos', educacao: 'ed-recursos' };
/** Telas, fora da de recursos, cujas respostas entram numa estimativa (participantes e horas do letramento). */
// v017: as quantidades ficam em cada opção, na tela de valores
const ALIMENTA: Partial<Record<FrenteEstimativa, Record<string, string[]>>> = {};

interface ItemCusto { id: string; nome: string; estimativa?: Estimativa | null }
export interface DadosCusto {
  frente: FrenteEstimativa;
  informado: number; informados: number; estimado: number; estimados: number; faltam: number;
  total: number | null; totalComEstimativas: number | null; moeda: string;
  itens: ItemCusto[];
  meses: number | null;
  recursos: string | null;
  /** v016: custo por fase (informado + estimado) */
  fases?: { id: string; nome: string; meses: number; informado: number; estimado: number }[];
  /** v018.1: custo conhecido separado em investimento e operação */
  capex?: number; opex?: number;
}

/** Números do orçamento da frente atual; null no projeto de uso de IA. */
export function dadosCusto(s: CasoStore): DadosCusto | null {
  // v018: só o fluxo da governança (v017) tem cartão próprio; o percurso da 0.0.14 usa o cartão do projeto
  if (!percursoGovernanca(s.ctx)) return null;
  const f: FrenteEstimativa = 'governanca';
  const o = orcamentoGovernanca(s);
  const tela = telasAtivas(s).find(q => q.id === TELA_RECURSOS[f]);
  return {
    frente: f, informado: o.informado, informados: o.informados, estimado: o.estimado, estimados: o.estimados, faltam: o.faltam,
    total: o.total, totalComEstimativas: o.totalComEstimativas, moeda: o.moeda,
    itens: o.itens.map((i: any) => ({ id: String(i.id), nome: t(String(i.nome)), estimativa: i.estimativa })),
    meses: mesesV16(s, f), recursos: tela ? href.pergunta(tela.capitulo, tela.id) : null, fases: (o as any).fases, capex: (o as any).capex, opex: (o as any).opex,
  };
}

/** "R$ 3,56 mi": valor curto para o cartão; o valor cheio fica na lista e no rótulo acessível. */
export function moedaCurta(v: number, cod: string): string {
  try { return new Intl.NumberFormat(String(LOC()), { style: 'currency', currency: cod, notation: 'compact', maximumFractionDigits: 2 }).format(v); }
  catch { return formatarMoedaEst(v, cod); }
}
const itens = (n: number) => n === 1 ? t('1 item') : t('{n} itens', { n });

/** O número grande: o total quando completo; com faltas, informado + estimado da própria frente, e só "faltam N itens". */
function principal(d: DadosCusto): { valor: number | null; nota: string; completo: boolean } {
  const completo = d.estimados ? d.totalComEstimativas : d.total;
  if (completo !== null) return { valor: completo, completo: true, nota: '' };
  const conhecido = d.informados + d.estimados ? Math.round((d.informado + d.estimado) * 100) / 100 : null;
  return { valor: conhecido, completo: false, nota: faltam(d.faltam) };
}
export const faltam = (n: number) => n === 1 ? t('falta 1 item') : t('faltam {n} itens', { n });

function Barra({ d }: { d: DadosCusto }) {
  const n = d.informados + d.estimados + d.faltam, soma = d.informado + d.estimado;
  const lev = n ? d.faltam / n : 0, resto = 1 - lev;
  const inf = soma > 0 ? resto * d.informado / soma : 0, est = soma > 0 ? resto * d.estimado / soma : 0;
  const rotulo = t('Informado {inf}, estimado {est}, {n} sem valor', { inf: formatarMoedaEst(d.informado, d.moeda), est: formatarMoedaEst(d.estimado, d.moeda), n: itens(d.faltam) });
  return <div className="pc-custo-barra" role="img" aria-label={rotulo}>
    <span className="pc-custo-barra-inf" style={{ inlineSize: (inf * 100).toFixed(2) + '%' }} />
    <span className="pc-custo-barra-est" style={{ inlineSize: (est * 100).toFixed(2) + '%' }} />
  </div>;
}

function rotuloPeriodo(base: string, meses: number | null) { return meses ? base + ' · ' + t('{n} meses', { n: meses }) : base; }

/** Cartão noite do custo da frente, com a lista Informado / Estimado / A levantar. */
export function CartaoCustoFrente({ d, compacto = false }: { d: DadosCusto; compacto?: boolean }) {
  const p = principal(d);
  return <section className={'pc-custo' + (compacto ? ' pc-custo--compacto' : '')} aria-label={t('Custo desta frente')}>
    <div className="pc-custo-cab">
      <h2 className="pc-custo-rotulo">{rotuloPeriodo(compacto ? t('Custo') : t('Custo desta frente'), d.meses)}</h2>
      <p className="pc-custo-total" title={p.valor === null ? undefined : formatarMoedaEst(p.valor, d.moeda)}>
        {p.valor === null ? '—' : moedaCurta(p.valor, d.moeda)}
        {p.valor !== null ? <span className="pc-sr"> ({formatarMoedaEst(p.valor, d.moeda)}{p.completo ? '' : ', ' + t('parcial')})</span> : null}
      </p>
      {p.nota ? <p className="pc-custo-nota">{p.nota}</p> : null}
    </div>
    <Barra d={d} />
    {compacto ? <dl className="pc-custo-tres">
      <div><dt>{t('Informado')}</dt><dd>{d.informados ? moedaCurta(d.informado, d.moeda) : '—'}</dd></div>
      <div><dt>{t('Estimado')}</dt><dd className="pc-custo-est">{d.estimados ? moedaCurta(d.estimado, d.moeda) : '—'}</dd></div>
      <div><dt>{t('Falta valor')}</dt><dd>{itens(d.faltam)}</dd></div>
    </dl> : <dl className="pc-custo-lista">
      <dt><i className="pc-custo-marca pc-custo-marca--inf" aria-hidden="true" />{t('Informado')}</dt>
      <dd>{d.informados ? formatarMoedaEst(d.informado, d.moeda) : '—'}</dd>
      <dt><i className="pc-custo-marca pc-custo-marca--est" aria-hidden="true" />{t('Estimado')}</dt>
      <dd className="pc-custo-est">{d.estimados ? formatarMoedaEst(d.estimado, d.moeda) : '—'}</dd>
      <dt><i className="pc-custo-marca pc-custo-marca--lev" aria-hidden="true" />{t('Falta valor')}</dt>
      <dd>{itens(d.faltam)}</dd>
      {/* v018.1: investimento e operação do custo conhecido */}
      {d.capex !== undefined && d.opex !== undefined && d.capex + d.opex > 0 ? <>
        <dt>{t('Investimento (CapEx)')}</dt><dd>{formatarMoedaEst(d.capex, d.moeda)}</dd>
        <dt>{t('Operação (OpEx)')}</dt><dd>{formatarMoedaEst(d.opex, d.moeda)}</dd>
      </> : null}
    </dl>}
    {!compacto && d.fases?.length && !(d.fases.length === 1 && d.fases[0].id === 'total') ? <dl className="pc-custo-fases" aria-label={t('Custo por fase')}>{d.fases.map(f => <div key={f.id}><dt>{f.nome}</dt><dd>{f.informado + f.estimado ? moedaCurta(f.informado + f.estimado, d.moeda) : '—'}</dd></div>)}</dl> : null}
  </section>;
}

/** "Esta resposta muda": o item com estimativa que a pergunta atual alimenta e o valor em âmbar; a conta fica em "Ver a conta". */
export function RespostaMuda({ d, tela }: { d: DadosCusto; tela: string }) {
  const ids = ALIMENTA[d.frente]?.[tela] || [];
  const lista = d.itens.filter(i => ids.includes(i.id) && typeof i.estimativa?.valor === 'number');
  if (!lista.length) return null;
  return <section className="pc-custo-muda" aria-label={t('Esta resposta muda')}>
    <h2 className="pc-custo-muda-titulo">{t('Esta resposta muda')}</h2>
    {lista.map(i => { const e = i.estimativa!; return <p key={i.id} className="pc-custo-muda-linha"><span className="pc-custo-muda-nome">{i.nome}</span>
      <strong className="pc-custo-muda-valor" title={t('estimativa de referência, ilustrativa')}>{formatarMoedaEst(e.valor as number, e.moeda)}<span className="pc-sr"> ({t('estimativa de referência, ilustrativa')})</span></strong></p>; })}
    {d.recursos ? <a href={d.recursos} className="pc-custo-muda-link">{t('Ver a conta')}</a> : null}
  </section>;
}

function Links({ d, tela }: { d: DadosCusto | null; tela?: string }) {
  const naRecursos = !!d && tela === TELA_RECURSOS[d.frente];
  return <nav className="pc-custo-links" aria-label={t('Orçamento e resumo')}>
    {d?.recursos && !naRecursos ? <a className="pc-custo-link" href={d.recursos}>{t('Valores')} <span aria-hidden="true">→</span></a> : null}
    <a className="pc-custo-link" href={href.plano()}>{t('Resumo desta frente')} <span aria-hidden="true">→</span></a>
  </nav>;
}

/** Coluna direita no computador: o cartão, o bloco "Esta resposta muda" (ou a legenda, no orçamento) e os links. */
export function ColunaCusto({ s, tela }: { s: CasoStore; tela?: string }) {
  const d = dadosCusto(s);
  if (!d) return <aside className="pc-coluna-custo" aria-label={t('Custo deste projeto')}>
    <CartaoCustoProjeto s={s} />
    <nav className="pc-custo-links" aria-label={t('Plano')}>
      <a className="pc-custo-link" href={href.plano()}>{t('Ver o plano')} <span aria-hidden="true">→</span></a>
    </nav>
  </aside>;
  const naRecursos = tela === TELA_RECURSOS[d.frente];
  return <aside className="pc-coluna-custo" aria-label={t('Custo desta frente')}>
    <CartaoCustoFrente d={d} />
    {!naRecursos && tela ? <RespostaMuda d={d} tela={tela} /> : null}
    <Links d={d} tela={tela} />
  </aside>;
}

/** Celular e telas médias: faixa noite logo abaixo do cabeçalho, que leva ao orçamento (no orçamento, o cartão compacto). */
export function FaixaCusto({ s, tela }: { s: CasoStore; tela?: string }) {
  const d = dadosCusto(s);
  if (!d) return <FaixaProjeto s={s} />;
  if (tela === TELA_RECURSOS[d.frente]) return <div className="pc-faixa-custo-wrap"><CartaoCustoFrente d={d} compacto /></div>;
  const p = principal(d);
  const conteudo: ReactNode = <>
    <span className="pc-faixa-custo-total">{p.valor === null ? '—' : moedaCurta(p.valor, d.moeda)}</span>
    <span className="pc-faixa-custo-dir">{p.nota} <span aria-hidden="true">›</span></span>
  </>;
  const rotulo = t('Custo desta frente') + ': ' + (p.valor === null ? '—' : formatarMoedaEst(p.valor, d.moeda)) + (p.nota ? '. ' + p.nota : '');
  return <div className="pc-faixa-custo-wrap">{d.recursos
    ? <a className="pc-faixa-custo" href={d.recursos} aria-label={rotulo + '. ' + t('Valores')}>{conteudo}</a>
    : <div className="pc-faixa-custo" aria-label={rotulo}>{conteudo}</div>}</div>;
}

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

/** Percurso da 0.0.14: faixa noite com o total, que leva ao plano. */
function FaixaProjeto({ s }: { s: CasoStore }) {
  const p = usePainel(s), total = p.kpis.find(k => k.id === 'kpi.total');
  return <div className="pc-faixa-custo-wrap"><a className="pc-faixa-custo" href={href.plano()} aria-label={(total?.label || t('Custo deste projeto')) + ': ' + (total?.fullValue || '—') + '. ' + t('Ver o plano')}>
    <span className="pc-faixa-custo-total">{total?.value ?? '—'}</span>
    <span className="pc-faixa-custo-dir">{total?.label} <span aria-hidden="true">›</span></span>
  </a></div>;
}
