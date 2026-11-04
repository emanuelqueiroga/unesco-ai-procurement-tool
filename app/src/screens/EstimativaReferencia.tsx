// Linha "Estimativa de referência" dos itens de orçamento (v015): mostra o valor, a conta e o botão para usá-la.
// Nada é preenchido sem o clique; a conta sai da mesma função pura usada pelo plano e pelos PDFs.
import { Button, Popover, type PanelKpi } from '../ui';
import { CampoNumero } from '../percurso/CampoNumero';
import { telasAtivas, type CasoStore } from '../store';
import { href } from '../percurso/rota';
import { focarPendencia } from '../percurso/navegacaoOrientada';
import { t } from '../percurso/textos';
import { formatarMoedaEst, textoEstimado, type Estimativa, type PendenciaEstimativa } from '../percurso/estimativasOrcamento';
import { LOC } from '../domain';
import './estimativas.css';

const numero = (v: number) => new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 6 }).format(v);

export function ContaEstimativa({ est }: { est: Estimativa }) {
  const c = est.conta;
  return <span className="pc-est-conta">
    <span><b>{t('Fórmula')}:</b> {c.formula}</span>
    {c.calculo ? <span><b>{t('Conta')}:</b> {c.calculo}</span> : null}
    {c.quantidades.length ? <span className="pc-est-bloco"><b>{t('Quantidades usadas')}</b>
      {c.quantidades.map((q, i) => <span key={i}>{q.rotulo}: {numero(q.valor)} <span className="pc-est-origem">({t('pergunta: {origem}', { origem: q.origem })})</span></span>)}</span> : null}
    {c.periodo ? <span><b>{t('Período do orçamento')}:</b> {c.periodo.rotulo}</span> : null}
    {c.parametros.map(p => <span className="pc-est-bloco" key={p.id}><b>{t('Parâmetro')}</b>
      <span>{t(p.item)}: {formatarMoedaEst(p.valor, p.moeda)} · {t('unidade: {u}', { u: t(p.unidade) })}</span>
      <span>{t('Fonte')}: {t(p.fonte)} · {t('grau {g}', { g: p.grau })}{p.ano ? ' · ' + t('preços de {ano}', { ano: p.ano }) : ''}</span></span>)}
    <span>{c.nota}</span>
    <span><b>{t('Conversão de moeda')}:</b> {c.conversao
      ? t('1 US$ = {taxa} {moeda} ({fonte}{data}).', { taxa: numero(c.conversao.taxa), moeda: c.conversao.para, fonte: c.conversao.fonte, data: c.conversao.data ? ', ' + c.conversao.data : '' })
      : est.moeda === 'USD' ? t('valores em US$, sem conversão.') : t('sem taxa conhecida para {moeda}.', { moeda: est.moeda })}</span>
  </span>;
}

function LinkPendencia({ s, p, tela }: { s: CasoStore; p: PendenciaEstimativa; tela: string }) {
  if (p.tela === tela) return <a href={'#' + p.ancora} onClick={e => { e.preventDefault(); focarPendencia(p.ancora); }}>{p.texto}</a>;
  const q = telasAtivas(s).find(x => x.id === p.tela);
  return q ? <a href={href.pergunta(q.capitulo, q.id)}>{p.texto}</a> : <span>{p.texto}</span>;
}

/** Linha de estimativa de um item; não aparece em categorias sem base de cálculo. */
export function LinhaEstimativa({ s, est, tela, emUso, onUsar, nome }: { s: CasoStore; est: Estimativa | null; tela: string; emUso: boolean; onUsar: () => void; nome: string }) {
  if (!est) return null;
  // Fechar reaproveita o Esc do Popover (fecha e devolve o foco ao gatilho); no celular o painel vira uma folha.
  const fechar = <button type="button" className="pc-est-fechar" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))}>{t('Fechar')}</button>;
  const conta = <Popover className="pc-est-popover" label={t('Ver a conta')} title={t('Como a estimativa foi calculada')} actions={fechar}><ContaEstimativa est={est} /></Popover>;
  if (est.valor === null) return <div className="pc-est pc-est--falta" role="group" aria-label={t('Estimativa de referência') + ': ' + nome}>
    <p>{emUso ? <b>{t('Estimativa em uso, mas indisponível.')} </b> : null}{est.pendencias?.length
      ? <>{t('Para ver uma estimativa de referência, informe')}: {est.pendencias.map((p, i) => <span key={i}>{i ? ' · ' : ''}<LinkPendencia s={s} p={p} tela={tela} /></span>)}</>
      : est.mensagem}</p>
    <p className="pc-est-acoes">{conta}</p>
  </div>;
  return <div className={'pc-est' + (emUso ? ' pc-est--uso' : '')} role="group" aria-label={t('Estimativa de referência') + ': ' + nome}>
    <p><span>{t('Estimativa de referência')}:</span> <strong>{formatarMoedaEst(est.valor, est.moeda)}</strong> <span className="pc-est-rotulo">({t('estimativa de referência, ilustrativa')})</span></p>
    <p className="pc-est-acoes">{conta}
      {emUso ? <span className="pc-est-uso" role="status">{t('Em uso neste item. Escolha outra situação para desfazer.')}</span>
        : <Button size="sm" variant="secondary" onClick={onUsar} aria-label={t('Usar esta estimativa') + ': ' + nome}>{t('Usar esta estimativa')}</Button>}</p>
  </div>;
}

/** Quantidade opcional usada só pela estimativa (não entra nas pendências). */
export function CampoQuantidade({ id, label, value, onChange, decimais = false, dica = true, sugerido = false }: { id: string; label: string; value: unknown; onChange: (v: number | '') => void; decimais?: boolean; dica?: boolean; sugerido?: boolean }) {
  const ok = value === '' || value == null || typeof value === 'number' && Number.isFinite(value) && value > 0 && (decimais || Number.isSafeInteger(value));
  return <div className="pc-lit-campo pc-est-quantidade" id={id} tabIndex={-1}>
    <CampoNumero label={label} value={typeof value === 'number' ? value : ''} decimais={decimais} onChange={onChange}
      hint={dica ? t('Opcional. Usado apenas na estimativa de referência.') : undefined}
      error={ok ? undefined : t(decimais ? 'Informe um número maior que zero.' : 'Informe um número inteiro maior que zero.')} />
    {sugerido ? <span className="pc-sugerido">{t('sugerido')}</span> : null}
  </div>;
}

/** Botão do fim do orçamento: aplica a estimativa só aos itens sem valor que têm conta completa. */
export function UsarEstimativas({ quantos, onUsar }: { quantos: number; onUsar: () => void }) {
  return <div className="pc-est-todas">
    <Button variant="secondary" disabled={!quantos} onClick={onUsar}>{t('Usar a estimativa em todos os itens sem valor')}</Button>
    <p className="pc-nota">{quantos ? t('{n} itens sem valor têm estimativa de referência disponível. Os valores já informados não mudam.', { n: quantos }) : t('Nenhum item sem valor tem estimativa de referência disponível.')}</p>
  </div>;
}

/** Itens sem valor (vazio ou "custo ainda a levantar") com estimativa calculável. */
export function semValorComEstimativa<T extends { valor: number | null; estimativa?: Estimativa | null; situacao?: string; compartilhado?: boolean }>(itens: T[], emUso: (i: T) => boolean): T[] {
  return itens.filter(i => i.valor === null && !i.compartilhado && !emUso(i) && typeof i.estimativa?.valor === 'number' && ['', 'a_estimar', 'informado'].includes(String(i.situacao || '')));
}

/** Totais separados: Informado, Estimado pela ferramenta, Ainda a levantar e, sem faltas, o Total. */
export function TotaisOrcamentoView({ linhas, nota }: { linhas: { rotulo: string; valor: string; destaque?: boolean }[]; nota?: string }) {
  return <div className="pc-gov-orcamento pc-est-totais" role="status">
    <dl>{linhas.map((l, i) => <div key={i} className={l.destaque ? 'pc-est-total' : undefined}><dt>{l.rotulo}</dt><dd>{l.valor}</dd></div>)}</dl>
    {nota ? <p className="pc-nota">{nota}</p> : null}
  </div>;
}

/** KPIs do painel: o total só sem faltas; a estimativa sempre com o rótulo honesto. */
export function kpisOrcamento(id: string, o: { subtotal: number; informados: number; estimado?: number; estimados?: number; faltam: number; total: number | null; totalComEstimativas?: number | null; moeda: string }): PanelKpi[] {
  const est = o.estimados || 0, completo = est ? o.totalComEstimativas ?? null : o.total;
  const kEst: PanelKpi = { id: id + '-estimado', label: t('Estimativa de referência, ilustrativa'), value: est ? formatarMoedaEst(o.estimado || 0, o.moeda) : undefined, fullValue: est ? textoEstimado(o.estimado || 0, o.moeda) : undefined };
  if (completo !== null) return [{ id, label: est ? t('Total (inclui estimativas de referência)') : t('Total'), value: formatarMoedaEst(completo, o.moeda) }, ...(est ? [kEst] : [])];
  return [{ id, label: t('Informado'), value: o.informados ? formatarMoedaEst(o.subtotal, o.moeda) : t('Não informado') }, kEst];
}
