// Versão de teste v016: tela de fases (Piloto, Implantação, Expansão) e tabela de orçamento por categoria,
// comuns às três frentes.
import { useState } from 'react';
import { useCaso, type CasoStore } from '../store';
import { Button } from '../ui';
import { BotaoLinkPlano } from './CompartilharV16';
import { CampoNumero } from '../percurso/CampoNumero';
import { t } from '../percurso/textos';
import { href } from '../percurso/rota';
import { alterarLit } from '../percurso/letramento';
import { alterarEd } from '../percurso/pedagogico';
import { fasesV16, orcamentoV16, raizOrcamento, resumoFases, matrizFases, resumoProsa, riscosV16, totalConhecido, linhasMemoria, pidsDaBase, premissaV16, taxaV16, chavePremissa, type Base } from '../percurso/orcamentoV016';
import { formatarMoedaEst, type FrenteEstimativa } from '../percurso/estimativasOrcamento';
import { TabelaRecursos, type LinhaRecurso } from './TabelaRecursos';
import './moldura.css';

/** Grava um caminho dentro do orçamento da frente. */
export function gravarOrc(frente: FrenteEstimativa, caminho: string, valor: any) {
  const s = useCaso.getState();
  if (frente === 'governanca') s.responder('govOrcamento.' + caminho, valor);
  else if (frente === 'letramento') s.responder('letramento', alterarLit(s.ctx.letramento, 'orcamento.' + caminho, valor));
  else s.responder('educacao', alterarEd(s, 'orcamento.' + caminho, valor));
}
const telaFases = (f: FrenteEstimativa) => f === 'governanca' ? 'gov-fases' : f === 'letramento' ? 'lit-fases' : 'ed-fases';
export const telaOrcamento = (f: FrenteEstimativa) => f === 'governanca' ? 'gov-recursos' : f === 'letramento' ? 'lit-recursos' : 'ed-recursos';

/** Fases: incluir, meses e alcance acumulado (% das pessoas) de cada uma. */
export function FasesV16({ s, frente }: { s: CasoStore; frente: FrenteEstimativa }) {
  const fases = fasesV16(s, frente);
  const salvar = (id: string, campo: string, v: any) => { const atual = raizOrcamento(useCaso.getState(), frente).fases?.[id] || {}; gravarOrc(frente, 'fases.' + id, { ...atual, [campo]: v }); };
  return <div className="pv-fases" id="fases" tabIndex={-1}>
    <div className="pv-fases-cab" aria-hidden="true"><span>{t('Fase')}</span><span>{t('Meses')}</span><span>{t('Alcance acumulado (% das pessoas)')}</span></div>
    {fases.map(f => <div key={f.id} className={'pv-fases-linha' + (f.on ? '' : ' is-off')} role="group" aria-label={f.nome}>
      <label className="pv-fases-nome"><input type="checkbox" checked={f.on} onChange={e => salvar(f.id, 'on', e.currentTarget.checked)} /><span>{f.nome}</span></label>
      <CampoNumero label={t('Meses') + ' · ' + f.nome} value={f.meses} onChange={v => salvar(f.id, 'meses', v === '' ? undefined : v)} />
      <CampoNumero label={t('Alcance acumulado (% das pessoas)') + ' · ' + f.nome} value={f.alcance} onChange={v => salvar(f.id, 'alcance', v === '' ? undefined : Math.min(100, v as number))} />
    </div>)}
  </div>;
}

/** Orçamento: uma linha por categoria (agrupadas por desafio), cost options marcáveis e valor por fase. */
export function OrcamentoV16({ s, frente, tentou }: { s: CasoStore; frente: FrenteEstimativa; tentou: boolean }) {
  const o = orcamentoV16(s, frente), salvo = raizOrcamento(s, frente).itens || {};
  const item = (id: string) => raizOrcamento(useCaso.getState(), frente).itens?.[id] || {};
  const salvar = (id: string, novo: any) => { gravarOrc(frente, 'moeda', o.moeda); gravarOrc(frente, 'itens.' + id, novo); };
  const linhas: LinhaRecurso[] = o.itens.map(i => ({
    id: i.id, ancora: 'rec-' + i.id, nome: (i.n ? i.n + ' ' : '') + t(i.nome), grupo: i.grupo || undefined, situacao: i.situacao, valor: i.valor ?? '', estimativa: i.estimativa, emUso: i.referencia,
    respondido: i.respondido, detalhe: i.detalhe,
    opcoes: i.opcoes.map(r => ({ rotulo: r, on: i.marcadas.includes(r) })),
    onOpcao: (r, on) => { const x = item(i.id), atual: string[] = Array.isArray(x.opcoes) ? x.opcoes : []; salvar(i.id, { ...x, opcoes: on ? [...atual.filter(v => v !== r), r] : atual.filter(v => v !== r) }); },
    fases: o.fases.map(f => ({ id: f.id, nome: f.nome, valor: typeof salvo[i.id]?.valores?.[f.id] === 'number' ? salvo[i.id].valores[f.id] : '' })),
    onValorFase: (fid, v) => { const x = item(i.id); salvar(i.id, { ...x, situacao: 'informado', valores: { ...(x.valores || {}), [fid]: v } }); },
    quantidades: i.base ? <div className="pv-premissa">{pidsDaBase(i.base as Base).map(pid => { const p = premissaV16(s, frente, pid, o.moeda), taxa = taxaV16(o.moeda, s);
      const ref = taxa === null ? p.referenciaUSD : Math.round(p.referenciaUSD * taxa * 100) / 100, refTxt = formatarMoedaEst(ref, taxa === null ? 'USD' : o.moeda) + (o.moeda !== 'USD' && taxa !== null ? ' = ' + formatarMoedaEst(p.referenciaUSD, 'USD') : '');
      const atual = p.equipe ? Math.round(((p.moedaValor === o.moeda ? p.valor : p.valorLocal) ?? p.valor) * 100) / 100 : '';
      return <CampoNumero key={pid} label={taxa === null ? p.item + ' (US$)' : p.rotulo} value={atual} decimais placeholder={String(ref)}
        hint={t('Vazio = referência genérica ({v}). Vale para todas as linhas desta frente que usam este valor.', { v: refTxt })}
        onChange={v => gravarOrc(frente, 'premissas.' + chavePremissa(pid), v === '' ? undefined : { valor: v, moeda: taxa === null ? 'USD' : o.moeda })} />; })}</div> : undefined,
    onSituacao: id => salvar(i.id, { ...item(i.id), situacao: id }),
    onValor: v => salvar(i.id, { ...item(i.id), valor: v, situacao: 'informado' }),
    onDetalhe: v => salvar(i.id, { ...item(i.id), detalhe: v }),
  }));
  const disponiveis = o.itens.filter(i => !i.referencia && !['informado', 'sem_custo'].includes(i.situacao) && typeof i.estimativa?.valor === 'number');
  return <>
    <TabelaRecursos s={s} linhas={linhas} moeda={o.moeda} tela={telaOrcamento(frente)} tentou={tentou}
      contexto={{ resumo: resumoFases(s, frente) + ' · ' + o.moeda, completo: true, href: href.pergunta(3, telaFases(frente)), campos: null }}
      disponiveis={disponiveis.length} onUsarTodas={() => { for (const i of disponiveis) salvar(i.id, { ...item(i.id), situacao: 'referencia' }); }} />
    {o.fases.length ? <div className="pv-por-fase" aria-label={t('Custo por fase')}>
      <h3 className="pv-rec-grupo">{t('Custo por fase')}</h3>
      {o.fases.map(f => <div key={f.id} className="pv-por-fase-linha"><span>{f.nome} · {t('{n} meses', { n: f.meses })}</span>
        <span className="pv-por-fase-num">{f.informado ? formatarMoedaEst(f.informado, o.moeda) : ''}{f.informado && f.estimado ? ' + ' : ''}{f.estimado ? <span className="pc-rec-valor--est">{formatarMoedaEst(f.estimado, o.moeda)}</span> : null}{!f.informado && !f.estimado ? '—' : ''}</span></div>)}
    </div> : null}
  </>;
}

/** Resumo da frente: "Em resumo" e a tabela categoria × fase (mesma conta do cartão e dos PDFs). */
export function ResumoV16({ s, frente }: { s: CasoStore; frente: FrenteEstimativa }) {
  const o = orcamentoV16(s, frente), linhas = matrizFases(o);
  const val = (v: number | null, tipo: string) => v === null ? (tipo === 'a_levantar' ? t('a levantar') : '—') : formatarMoedaEst(v, o.moeda);
  return <section className="pv-resumo" aria-labelledby={'pv-resumo-' + frente}>
    <h2 id={'pv-resumo-' + frente} className="pv-resumo-titulo">{t('Em resumo')}</h2>
    <p className="pv-resumo-prosa">{resumoProsa(o)}</p>
    <div className="pv-matriz-rolagem" tabIndex={0} role="region" aria-label={t('Custo por categoria e fase')}>
      <table className="pv-matriz">
        <caption>{t('Custo por categoria e fase')}</caption>
        <thead><tr><th scope="col">{t('Categoria')}</th>{o.fases.map(f => <th scope="col" key={f.id}>{f.nome}<span className="pv-matriz-sub">{t('{n} meses', { n: f.meses })} · {f.alcance}%</span></th>)}<th scope="col">{t('Total')}</th></tr></thead>
        <tbody>{linhas.map(l => <tr key={l.id} className={'pv-matriz--' + l.tipo + (l.nivel ? ' pv-matriz--opcao' : '')}><th scope="row">{(l.n ? l.n + ' ' : '') + l.nome}</th>{o.fases.map(f => <td key={f.id}>{val(l.porFase[f.id], l.tipo)}</td>)}<td className="pv-matriz-total">{val(l.total, l.tipo)}</td></tr>)}</tbody>
        <tfoot><tr><th scope="row">{t('Custo conhecido')}</th>{o.fases.map(f => <td key={f.id}>{formatarMoedaEst(f.informado + f.estimado, o.moeda)}</td>)}<td className="pv-matriz-total">{formatarMoedaEst(totalConhecido(o), o.moeda)}</td></tr></tfoot>
      </table>
    </div>
    <p className="pv-matriz-nota"><span className="pv-matriz-est">{t('Em âmbar')}</span>: {t('estimado (quantidades e valores unitários abaixo)')}. {t('"a levantar": ainda sem valor, fora do custo conhecido.')}</p>
    {o.memoria.length ? <><h3 className="pv-resumo-sub">{t('O que está sendo custeado')}</h3><ul className="pv-resumo-riscos">{linhasMemoria(o).map(l => <li key={l}>{l}</li>)}</ul></> : null}
    <h3 className="pv-resumo-sub">{t('Riscos e condições')}</h3>
    <ul className="pv-resumo-riscos">{riscosV16(frente, o).map(r => <li key={r}>{r}</li>)}</ul>
  </section>;
}

/** Botões dos PDFs, iguais nas três frentes. */
export function BotoesPDFV16({ s, frente }: { s: CasoStore; frente: FrenteEstimativa }) {
  const [erro, setErro] = useState(''), [ocupado, setOcupado] = useState(false);
  const nomeFrente = frente === 'governanca' ? 'governanca' : frente === 'letramento' ? 'letramento' : 'educacao';
  const baixar = async (tipo: 'brief' | 'anexo') => {
    setOcupado(true); setErro('');
    try { const m = await import('../plano/pdf_v016'); const doc: any = await m.gerarPDFFrenteV16(s.estado(), { frente, tipo }); doc.save(m.nomeArquivoV16(tipo, nomeFrente)); }
    catch (e) { console.error(e); setErro(t('Não foi possível gerar o PDF.')); }
    finally { setOcupado(false); }
  };
  return <div className="pv-pdfs"><div className="pc-botoes">
    <Button disabled={ocupado} onClick={() => void baixar('brief')}>{t('Resumo para decisão (PDF)')}</Button>
    <Button disabled={ocupado} variant="secondary" onClick={() => void baixar('anexo')}>{t('Anexo técnico (PDF)')}</Button>
  </div><BotaoLinkPlano /><p className="pc-nota">{t('Resumo: 1–2 páginas para quem decide. Anexo: todas as respostas e a memória das estimativas.')}</p>{erro ? <p role="alert">{erro}</p> : null}</div>;
}
