// Versão de teste v017: o orçamento em três passos, como na tabela de categorias de custo.
// 1) Categorias: a equipe marca as categorias de cada desafio. 2) Opções: em cada categoria, marca as opções
// (presencial, online…). 3) Valores: para cada opção marcada, quantidade × valor unitário (ou valor por fase).
// Nada vem marcado; só quantidades e valores unitários com referência aparecem sugeridos depois da escolha.
import { useId } from 'react';
import { useCaso, type CasoStore } from '../store';
import { OptionCard, OptionCardGroup } from '../ui';
import { CampoNumero } from '../percurso/CampoNumero';
import { LOC } from '../domain';
import { t } from '../percurso/textos';
import { href } from '../percurso/rota';
import { orcamentoV16, raizOrcamento, resumoFases, categoriasEscolhidas, semFases, DURACAO_GOV_PADRAO, type CategoriaV16 } from '../percurso/orcamentoV016';
import { TIPOS, ORDEM_TIPOS, chaveOpcao, ehParametro, PARAMETROS, type TipoCusto, type LinhaOpcao } from '../percurso/custosV017';
import { alterarLit, lerLit, selecoesLit, camposLetramento } from '../percurso/letramento';
import { selecionarLit } from '../percurso/letramentoInterface';
import { ehSugerido } from '../percurso/padroesTeste';
import { formatarMoedaEst, type FrenteEstimativa } from '../percurso/estimativasOrcamento';
import { gravarOrc } from './OrcamentoV16';
import './moldura.css';

const telaFases = (f: FrenteEstimativa) => f === 'letramento' ? 'lit-fases' : 'ed-fases';
const nomeCat = (c: { n: string; nome: string }) => (c.n ? c.n + ' ' : '') + t(c.nome);
/** Agrupa as categorias pelo desafio (na educação, um grupo só). */
function porGrupo<T extends { grupo: string }>(lista: T[]): [string, T[]][] {
  const m = new Map<string, T[]>();
  for (const c of lista) { const k = c.grupo || ''; m.set(k, [...(m.get(k) || []), c]); }
  return [...m.entries()];
}

/** Passo 1: categorias de custo de cada desafio escolhido. */
export function CategoriasV17({ s, frente }: { s: CasoStore; frente: FrenteEstimativa }) {
  const o = orcamentoV16(s, frente), sel = categoriasEscolhidas(s, frente);
  const marcar = (id: string, on: boolean) => {
    const atual = categoriasEscolhidas(useCaso.getState(), frente);
    gravarOrc(frente, 'moeda', o.moeda);
    gravarOrc(frente, 'categorias', on ? [...atual.filter(x => x !== id), id] : atual.filter(x => x !== id));
  };
  if (!o.disponiveis.length) return <p className="pc-nota">{t('Escolha pelo menos um desafio no Contexto para ver as categorias de custo.')}</p>;
  return <div className="pv-v17" id="categorias" tabIndex={-1}>
    {porGrupo(o.disponiveis).map(([grupo, cats]) => <section key={grupo} className="pv-v17-grupo">
      {grupo ? <h2 className="pv-v17-desafio">{grupo}</h2> : null}
      <OptionCardGroup className="pc-lit-opcoes" label={grupo || t('Categorias de custo')} type="checkbox">
        {cats.map(c => <OptionCard key={c.id} name="categorias" value={c.id} type="checkbox" checked={sel.includes(c.id)} label={nomeCat(c)}
          subtext={c.opcoes.length ? t('{n} opções', { n: c.opcoes.length }) : undefined} onChange={(id, on) => marcar(id, on)} />)}
      </OptionCardGroup>
    </section>)}
  </div>;
}

function Selecao({ label, value, opcoes, onChange }: { label: string; value: string; opcoes: [string, string][]; onChange: (v: string) => void }) {
  const id = useId();
  return <div className="pcx-campo pv-v17-tipo"><label className="pcx-rotulo" htmlFor={id}>{label}</label>
    <select id={id} className="pcx-select" value={value} onChange={ev => onChange(ev.target.value)}>{opcoes.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></div>;
}

/** Uma opção marcada: como calcular, os campos do tipo e o resultado (por fase, ou total na governança). */
function LinhaValor({ s, frente, cat, l, moeda, comNome = true }: { s: CasoStore; frente: FrenteEstimativa; cat: string; l: LinhaOpcao; moeda: string; comNome?: boolean }) {
  const caminho = 'itens.' + cat + '.custos.' + chaveOpcao(l.rotulo), def = TIPOS[l.tipo], fases = orcamentoV16(s, frente).fases, total = semFases(frente);
  const atual = () => raizOrcamento(useCaso.getState(), frente).itens?.[cat]?.custos?.[chaveOpcao(l.rotulo)] || {};
  const gravar = (campo: string, v: unknown) => gravarOrc(frente, caminho, { ...atual(), [campo]: v === '' ? undefined : v });
  const nome = t(l.rotulo), fmt = (v: number) => formatarMoedaEst(v, moeda);
  return <div className={'pv-v17-linha pv-v17-linha--' + l.status} role="group" aria-label={nome}>
    <div className="pv-v17-linha-cab">
      {comNome ? <h4 className="pv-v17-op">{nome}</h4> : <span className="pv-v17-op-sub">{t('Custo desta opção')}</span>}
      <p className={'pv-v17-total' + (l.status === 'referencia' ? ' pc-rec-valor--est' : '')}>{l.total === null ? '—' : fmt(l.total)}</p>
    </div>
    <Selecao label={t('Como calcular')} value={l.tipo} opcoes={ORDEM_TIPOS.map(k => [k, t(k === 'fechado' && total ? 'Valor total' : TIPOS[k].rotulo)])}
      onChange={v => gravarOrc(frente, caminho, { ...atual(), tipo: v as TipoCusto, unit: undefined, horas: undefined, ...(v === 'fechado' ? {} : { fases: undefined }) })} />
    {l.tipo === 'fechado'
      ? <div className="pv-v17-campos">{fases.map(f => <CampoNumero key={f.id} label={total ? t('Valor total') + ' (' + moeda + ')' : f.nome} value={l.valoresFase[f.id] ?? ''} decimais
          onChange={v => gravarOrc(frente, caminho, { ...atual(), fases: { ...(atual().fases || {}), [f.id]: v === '' ? undefined : v } })} />)}</div>
      : <div className="pv-v17-campos">
          <CampoNumero label={t(def.qtd!)} value={l.qtd ?? ''} suggested={l.qtdSugerida} onChange={v => gravar('qtd', v)} />
          {def.horas ? <CampoNumero label={t('Horas por pessoa')} value={l.horas ?? ''} decimais suggested={l.horasSugerida} onChange={v => gravar('horas', v)} /> : null}
          <CampoNumero label={t(def.unit!) + ' (' + moeda + ')'} value={l.unitDaReferencia ? '' : l.unit ?? ''} decimais placeholder={l.unitRef === null ? undefined : new Intl.NumberFormat(String(LOC()), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(l.unitRef)}
            hint={l.unitRef === null ? undefined : t('Vazio = referência genérica ({v}).', { v: fmt(l.unitRef) })} onChange={v => gravar('unit', v)} />
        </div>}
    {l.qtdSugerida || l.horasSugerida ? <p className="pc-nota">{t('Valores em destaque são sugeridos; altere se precisar.')}</p> : null}
    {l.status === 'falta' ? <p className="pv-v17-falta">{t('Falta')}: {l.falta.join(', ')}</p>
      : !total ? <p className="pv-v17-fases">{fases.map(f => f.nome + ' ' + fmt(l.porFase[f.id] || 0)).join(' · ')}{l.status === 'referencia' ? ' · ' + t('referência genérica, igual para todos os países') : ''}</p>
      : l.status === 'referencia' ? <p className="pv-v17-fases">{t('referência genérica, igual para todos os países')}</p> : null}
  </div>;
}

/** Valor de um campo do letramento ({ valor } ou número). */
const valorLit = (v: any) => { const x = v && typeof v === 'object' ? v.valor : v; return typeof x === 'number' ? x : ''; };
const gravarLit = (caminho: string, valor: any) => { const st = useCaso.getState(); st.responder('letramento', alterarLit(st.ctx.letramento, caminho, valor)); };
const numeroLit = (v: number | '') => v === '' ? { valor: '', situacao: 'informado', origem: 'informado' } : { valor: v, situacao: 'informado', origem: 'informado' };

/** Item da 1.1 marcado: o campo do parâmetro (no número de professores, também diretores e coordenadores). */
function CampoParametro({ s, rotulo }: { s: CasoStore; rotulo: string }) {
  const p = PARAMETROS[rotulo], lider = selecoesLit(s, 'publicos.A11.incluiLiderancas').includes('sim');
  return <div className="pv-v17-linha pv-v17-param" role="group" aria-label={t(rotulo)}>
    <div className="pv-v17-campos">
      <CampoNumero label={t(p.rotulo)} value={valorLit(lerLit(s, p.campo))} decimais={p.decimais} suggested={ehSugerido(s, 'letramento', p.campo)} onChange={v => gravarLit(p.campo, numeroLit(v))} />
      {p.liderancas && lider ? <CampoNumero label={t('Número de diretores e coordenadores')} value={valorLit(lerLit(s, 'publicos.A11.liderancas'))} onChange={v => gravarLit('publicos.A11.liderancas', numeroLit(v))} /> : null}
    </div>
    {p.liderancas ? <><span className="pv-v17-pergunta" aria-hidden="true">{t('Inclui diretores e coordenadores?')}</span><OptionCardGroup className="pc-lit-opcoes pv-v17-simnao" label={t('Inclui diretores e coordenadores?')} type="radio">
      {[['sim', 'Sim'], ['nao', 'Não']].map(([id, txt]) => <OptionCard key={id} name="lider" value={id} type="radio" label={t(txt)} checked={selecoesLit(s, 'publicos.A11.incluiLiderancas').includes(id)}
        onChange={() => gravarLit('publicos.A11.incluiLiderancas', { escolhas: [id], origem: 'informado' })} />)}
    </OptionCardGroup></> : null}
  </div>;
}

/** Estudantes (letramento): níveis e número, no topo do grupo de estudantes; alimentam licenças e avaliações. */
function BlocoEstudantes({ s }: { s: CasoStore }) {
  const f = camposLetramento(s).find(c => c.caminho === 'publicos.A12.niveis'), ids = selecoesLit(s, 'publicos.A12.niveis');
  return <div className="pv-v17-linha pv-v17-param" role="group" aria-label={t('Estudantes')}>
    <span className="pv-v17-pergunta">{t('Níveis')}</span>
    {f ? <OptionCardGroup className="pc-lit-opcoes" label={t('Níveis')} type="checkbox">{(f.opcoes || []).map(op => <OptionCard key={op.id} name="niveis" value={op.id} type="checkbox" label={t(op.texto)} checked={ids.includes(op.id)}
      onChange={(id, on) => gravarLit('publicos.A12.niveis', { escolhas: selecionarLit(ids, id, on, true), origem: 'informado' })} />)}</OptionCardGroup> : null}
    <div className="pv-v17-campos"><CampoNumero label={t('Número de estudantes')} value={valorLit(lerLit(s, 'publicos.A12.participantes'))} suggested={ehSugerido(s, 'letramento', 'publicos.A12.participantes')} onChange={v => gravarLit('publicos.A12.participantes', numeroLit(v))} /></div>
  </div>;
}

/** Opções e valores: ao marcar uma opção, os campos dela abrem logo abaixo. */
export function ValoresV17({ s, frente }: { s: CasoStore; frente: FrenteEstimativa }) {
  const o = orcamentoV16(s, frente), fmt = (v: number) => formatarMoedaEst(v, o.moeda), total = semFases(frente);
  const marcar = (c: CategoriaV16, r: string, on: boolean) => {
    const x = raizOrcamento(useCaso.getState(), frente).itens?.[c.id]?.opcoes, atual: string[] = Array.isArray(x) ? x : [];
    gravarOrc(frente, 'moeda', o.moeda);
    gravarOrc(frente, 'itens.' + c.id + '.opcoes', on ? [...atual.filter(v => v !== r), r] : atual.filter(v => v !== r));
  };
  if (!o.itens.length) return <p className="pc-nota">{t('Volte e escolha pelo menos uma categoria de custo.')}</p>;
  const linhaDe = (i: (typeof o.itens)[number], r: string) => i.linhas.find(l => l.rotulo === r);
  return <div className="pv-v17" id="valores" tabIndex={-1}>
    {total ? <div className="pv-v17-campos pv-v17-duracao"><CampoNumero label={t('Duração do plano (meses)')} value={raizOrcamento(s, frente).duracao ?? ''} placeholder={String(DURACAO_GOV_PADRAO)}
        hint={t('Vazio = {n} meses. Usada nas contas de equipe e de licenças.', { n: DURACAO_GOV_PADRAO })} onChange={v => gravarOrc(frente, 'duracao', v === '' ? undefined : v)} /></div>
      : <p className="pv-v17-fases-resumo">{resumoFases(s, frente)} · {o.moeda} · <a href={href.pergunta(3, telaFases(frente))}>{t('Alterar fases')}</a></p>}
    {porGrupo(o.itens).map(([grupo, itens]) => <section key={grupo} className="pv-v17-grupo">
      {grupo ? <h2 className="pv-v17-desafio">{grupo}</h2> : null}
      {frente === 'letramento' && itens.some(i => i.id.startsWith('l2')) ? <BlocoEstudantes s={s} /> : null}
      {itens.map(i => <div key={i.id} className="pv-v17-cat">
        <div className="pv-v17-cat-cab"><h3 className="pv-v17-cat-nome">{nomeCat(i)}</h3><span className="pv-v17-cat-total">{i.valor === null ? (i.linhas.length || !i.parametros.length ? '—' : '') : fmt(i.valor)}</span></div>
        {i.opcoes.length ? <OptionCardGroup className="pv-v17-ops" label={nomeCat(i)} type="checkbox">
          {i.opcoes.map(r => { const on = i.marcadas.includes(r), l = linhaDe(i, r), param = ehParametro(frente, i.id, r);
            return <div key={r} className={'pv-v17-op-item' + (on ? ' is-on' : '')}>
              <OptionCard name={'op-' + i.id} value={r} type="checkbox" checked={on} label={t(r)} onChange={(_v, v) => marcar(i, r, v)} />
              {on ? param ? <CampoParametro s={s} rotulo={r} /> : l ? <LinhaValor s={s} frente={frente} cat={i.id} l={l} moeda={o.moeda} comNome={false} /> : null : null}
            </div>; })}
        </OptionCardGroup> : i.linhas.map(l => <LinhaValor key={l.chave} s={s} frente={frente} cat={i.id} l={l} moeda={o.moeda} comNome={false} />)}
      </div>)}
    </section>)}
    {!total && o.fases.length ? <div className="pv-por-fase" aria-label={t('Custo por fase')}>
      <h3 className="pv-rec-grupo">{t('Custo por fase')}</h3>
      {o.fases.map(f => <div key={f.id} className="pv-por-fase-linha"><span>{f.nome} · {t('{n} meses', { n: f.meses })}</span>
        <span className="pv-por-fase-num">{f.informado + f.estimado ? fmt(f.informado + f.estimado) : '—'}</span></div>)}
    </div> : null}
  </div>;
}
/** Rota antiga da tela de opções: agora opções e valores ficam juntos. */
export const OpcoesV17 = ValoresV17;
