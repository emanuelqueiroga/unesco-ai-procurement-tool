// Versão de teste v016: tela de fases (Piloto, Implantação, Expansão) e tabela de orçamento por categoria,
// comuns às três frentes.
import { useCaso, type CasoStore } from '../store';
import { CampoNumero } from '../percurso/CampoNumero';
import { t } from '../percurso/textos';
import { href } from '../percurso/rota';
import { alterarLit } from '../percurso/letramento';
import { alterarEd } from '../percurso/pedagogico';
import { fasesV16, orcamentoV16, raizOrcamento, resumoFases } from '../percurso/orcamentoV016';
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
      <CampoNumero label={t('Meses')} value={f.meses} onChange={v => salvar(f.id, 'meses', v === '' ? undefined : v)} />
      <CampoNumero label={t('Alcance acumulado (% das pessoas)')} value={f.alcance} onChange={v => salvar(f.id, 'alcance', v === '' ? undefined : Math.min(100, v as number))} />
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
