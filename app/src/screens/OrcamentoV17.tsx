// Versão de teste v017: o orçamento em três passos, como na tabela de categorias de custo.
// 1) Categorias: a equipe marca as categorias de cada desafio. 2) Opções: em cada categoria, marca as opções
// (presencial, online…). 3) Valores: para cada opção marcada, quantidade × valor unitário (ou valor por fase).
// Nada vem marcado; só quantidades e valores unitários com referência aparecem sugeridos depois da escolha.
import { useId } from 'react';
import { useCaso, type CasoStore } from '../store';
import { OptionCard, OptionCardGroup, Popover } from '../ui';
import { CampoNumero } from '../percurso/CampoNumero';
import { LOC } from '../domain';
import { t } from '../percurso/textos';
import { href } from '../percurso/rota';
import { orcamentoV16, raizOrcamento, resumoFases, categoriasEscolhidas, categoriaObrigatoria, todosObrigatorios, semFases, DURACAO_GOV_PADRAO, type CategoriaV16 } from '../percurso/orcamentoV016';
import { TIPOS, ORDEM_TIPOS, chaveOpcao, ehParametro, PARAMETROS, type TipoCusto, type LinhaOpcao } from '../percurso/custosV017';
import { alterarLit, lerLit, selecoesLit } from '../percurso/letramento';
import { ehSugerido } from '../percurso/padroesTeste';
import { formatarMoedaEst, type FrenteEstimativa } from '../percurso/estimativasOrcamento';
import { gravarOrc } from './OrcamentoV16';
import { CartaoComDica, DicaGov } from './InfoDica';
import { CATEGORIAS } from '../domain/catalogo_v016.js';
import './moldura.css';

const telaFases = (f: FrenteEstimativa) => f === 'letramento' ? 'lit-fases' : 'ed-fases';
/** v018: o nome em português de uma categoria da governança (chave da explicação do "i"). */
const nomeGovPt = (id: string) => String(((CATEGORIAS as any).governanca as any[]).find(c => c.id === id)?.nome || '');
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
    if (categoriaObrigatoria(frente, id)) return;
    const atual = categoriasEscolhidas(useCaso.getState(), frente).filter(x => !categoriaObrigatoria(frente, x));
    gravarOrc(frente, 'moeda', o.moeda);
    gravarOrc(frente, 'categorias', on ? [...atual.filter(x => x !== id), id] : atual.filter(x => x !== id));
  };
  if (!o.disponiveis.length) return <p className="pc-nota">{t('Escolha pelo menos um desafio no Contexto para ver as categorias de custo.')}</p>;
  return <div className="pv-v17" id="categorias" tabIndex={-1}>
    {porGrupo(o.disponiveis).map(([grupo, cats]) => <section key={grupo} className="pv-v17-grupo">
      {grupo ? <h2 className="pv-v17-desafio">{grupo}</h2> : null}
      <OptionCardGroup className="pc-lit-opcoes" label={grupo || t('Categorias de custo')} type="checkbox">
        {cats.map(c => { const cartao = <OptionCard key={c.id} name="categorias" value={c.id} type="checkbox" checked={sel.includes(c.id)} disabled={categoriaObrigatoria(frente, c.id)} label={nomeCat(c)}
          subtext={c.opcoes.length ? t('{n} opções', { n: c.opcoes.length }) : undefined} onChange={(id, on) => marcar(id, on)} />;
          // v018: o "i" de explicação no fluxo da governança
          return frente === 'governanca' ? <CartaoComDica key={c.id} chave={c.nome} nome={nomeCat(c)}>{cartao}</CartaoComDica> : cartao; })}
      </OptionCardGroup>
    </section>)}
  </div>;
}

/** Passo 2: opções de cada categoria escolhida. */
export function OpcoesV17({ s, frente }: { s: CasoStore; frente: FrenteEstimativa }) {
  const o = orcamentoV16(s, frente), fmt = (v: number) => formatarMoedaEst(v, o.moeda);
  const marcar = (c: CategoriaV16, r: string, on: boolean) => {
    const x = raizOrcamento(useCaso.getState(), frente).itens?.[c.id]?.opcoes, atual: string[] = Array.isArray(x) ? x : [];
    gravarOrc(frente, 'itens.' + c.id + '.opcoes', on ? [...atual.filter(v => v !== r), r] : atual.filter(v => v !== r));
  };
  if (!o.itens.length) return <p className="pc-nota">{t('Volte e escolha pelo menos uma categoria de custo.')}</p>;
  // v017: a tela Valores saiu; o que só existia nela (duração ou resumo das fases, total da categoria, valor das
  // categorias sem opções e custo por fase) fica aqui.
  return <div className="pv-v17" id="opcoes" tabIndex={-1}>
    {semFases(frente) ? <div className="pv-v17-campos">{(() => { const campo = <CampoNumero label={t('Duração do plano (meses)')} value={raizOrcamento(s, frente).duracao ?? ''} placeholder={String(DURACAO_GOV_PADRAO)} onChange={v => gravarOrc(frente, 'duracao', v === '' ? undefined : v)} />;
      return frente === 'governanca' ? <div className="pc-dica-campo">{campo}<DicaGov chave="Duração do plano (meses)" inicio /></div> : campo; })()}</div>
      : <p className="pv-v17-fases-resumo">{resumoFases(s, frente)} · {o.moeda} · <a href={href.pergunta(4, telaFases(frente))}>{t('Alterar fases')}</a></p>}
    {porGrupo(o.itens).map(([grupo, itens]) => <section key={grupo} className="pv-v17-grupo">
      {grupo ? <h2 className="pv-v17-desafio">{grupo}</h2> : null}
      {itens.map(i => <div key={i.id} className="pv-v17-cat">
        <div className="pv-v17-cat-cab"><h3 className="pv-v17-cat-nome">{nomeCat(i)}{frente === 'governanca' ? <DicaGov chave={nomeGovPt(i.id)} nome={nomeCat(i)} inicio /> : null}</h3><span className="pv-v17-cat-total">{i.valor === null ? '—' : fmt(i.valor)}</span></div>
        {todosObrigatorios(frente, i.id) ? i.opcoes.map(r => <CampoParametro key={r} s={s} rotulo={r} titulo />)
        : i.opcoes.length ? <OptionCardGroup className="pc-lit-opcoes" label={nomeCat(i)} type="checkbox">
          {i.opcoes.map(r => { const on = i.marcadas.includes(r), l = i.linhas.find(x => x.rotulo === r);
            const cartao = <OptionCard key={r} name={'op-' + i.id} value={r} type="checkbox" checked={on} label={t(r)} onChange={(_v, v) => marcar(i, r, v)} />;
            return [frente === 'governanca' ? <CartaoComDica key={r} chave={r}>{cartao}</CartaoComDica> : cartao,
              on ? <div key={r + '-abre'} className="pv-v17-abre">{ehParametro(frente, i.id, r) ? <CampoParametro s={s} rotulo={r} /> : l ? <LinhaValor s={s} frente={frente} cat={i.id} l={l} moeda={o.moeda} /> : null}</div> : null]; })}
        </OptionCardGroup> : i.linhas.map(l => <LinhaValor key={l.chave} s={s} frente={frente} cat={i.id} l={l} moeda={o.moeda} />)}
      </div>)}
    </section>)}
    {!semFases(frente) && o.fases.length ? <div className="pv-por-fase" aria-label={t('Custo por fase')}>
      <h3 className="pv-rec-grupo">{t('Custo por fase')}</h3>
      {o.fases.map(f => <div key={f.id} className="pv-por-fase-linha"><span>{f.nome} · {t('{n} meses', { n: f.meses })}</span>
        <span className="pv-por-fase-num">{f.informado + f.estimado ? fmt(f.informado + f.estimado) : '—'}</span></div>)}
    </div> : null}
  </div>;
}

function Selecao({ label, value, opcoes, onChange }: { label: string; value: string; opcoes: [string, string][]; onChange: (v: string) => void }) {
  const id = useId();
  return <div className="pcx-campo pv-v17-tipo"><label className="pcx-rotulo" htmlFor={id}>{label}</label>
    <select id={id} className="pcx-select" value={value} onChange={ev => onChange(ev.target.value)}>{opcoes.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></div>;
}

/** Uma opção marcada: como calcular, os campos do tipo e o resultado por fase. */
function LinhaValor({ s, frente, cat, l, moeda }: { s: CasoStore; frente: FrenteEstimativa; cat: string; l: LinhaOpcao; moeda: string }) {
  const caminho = 'itens.' + cat + '.custos.' + chaveOpcao(l.rotulo), def = TIPOS[l.tipo], fases = orcamentoV16(s, frente).fases;
  const atual = () => raizOrcamento(useCaso.getState(), frente).itens?.[cat]?.custos?.[chaveOpcao(l.rotulo)] || {};
  const gravar = (campo: string, v: unknown) => gravarOrc(frente, caminho, { ...atual(), [campo]: v === '' ? undefined : v });
  const nome = t(l.rotulo), fmt = (v: number) => formatarMoedaEst(v, moeda);
  return <div className={'pv-v17-linha pv-v17-linha--' + l.status} role="group" aria-label={nome}>
    <div className="pv-v17-linha-cab">
      <h4 className="pv-v17-op">{nome}</h4>
      <p className={'pv-v17-total' + (l.status === 'referencia' ? ' pc-rec-valor--est' : '')}>{l.total === null ? '—' : fmt(l.total)}</p>
    </div>
    {frente === 'governanca' ? null : <Selecao label={t('Como calcular')} value={l.tipo} opcoes={ORDEM_TIPOS.map(k => [k, t(k === 'fechado' && semFases(frente) ? 'Valor total' : TIPOS[k].rotulo)])}
      onChange={v => gravarOrc(frente, caminho, { ...atual(), tipo: v as TipoCusto, unit: undefined, horas: undefined, ...(v === 'fechado' ? {} : { fases: undefined }) })} />}
    {l.tipo === 'fechado'
      ? <div className="pv-v17-campos">{fases.map(f => <CampoNumero key={f.id} label={semFases(frente) ? t('Valor total') + ' (' + moeda + ')' : f.nome} value={l.valoresFase[f.id] ?? ''} decimais
          onChange={v => gravarOrc(frente, caminho, { ...atual(), fases: { ...(atual().fases || {}), [f.id]: v === '' ? undefined : v } })} />)}</div>
      : <div className="pv-v17-campos">
          <CampoNumero label={t(def.qtd!)} value={l.qtd ?? ''} suggested={l.qtdSugerida} decimais={l.tipo === 'equipe'} onChange={v => gravar('qtd', v)} />
          {def.horas ? <CampoNumero label={t(def.horasRotulo || 'Horas por pessoa')} value={l.horas ?? ''} suggested={l.esforcoC && !!l.horas} decimais onChange={v => gravar('horas', v)} /> : null}
          <CampoNumero label={t(def.unit!) + ' (' + moeda + ')'} value={l.unitDaReferencia ? '' : l.unit ?? ''} decimais placeholder={l.unitRef === null ? undefined : new Intl.NumberFormat(String(LOC()), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(l.unitRef)}
            hint={l.unitRef === null ? undefined : t('Vazio = referência genérica ({v}).', { v: fmt(l.unitRef) })} onChange={v => gravar('unit', v)} />
        </div>}
    {frente === 'governanca' && l.conta && l.status !== 'falta' ? <ComoCalculado l={l} /> : null}
    {l.esforcoC ? <p className="pc-nota">{t('Esforço de referência (grau C, convenção a calibrar); altere se precisar.')}</p>
      : l.qtdSugerida ? <p className="pc-nota">{t('Quantidade sugerida a partir do Contexto; altere se precisar.')}</p> : null}
    {l.status === 'falta' ? <p className="pv-v17-falta">{t('Falta')}: {l.falta.join(', ')}</p>
      : semFases(frente) ? (l.status === 'referencia' ? <p className="pv-v17-fases">{t('referência genérica, igual para todos os países')}</p> : null)
      : <p className="pv-v17-fases">{fases.map(f => f.nome + ' ' + fmt(l.porFase[f.id] || 0)).join(' · ')}{l.status === 'referencia' ? ' · ' + t('referência genérica, igual para todos os países') : ''}</p>}
  </div>;
}

const valorLit = (v: any) => { const x = v && typeof v === 'object' ? v.valor : v; return typeof x === 'number' ? x : ''; };
const gravarLit = (caminho: string, valor: any) => { const st = useCaso.getState(); st.responder('letramento', alterarLit(st.ctx.letramento, caminho, valor)); };
const numeroLit = (v: number | '') => ({ valor: v, situacao: 'informado', origem: 'informado' });
/** Item da 1.1 marcado: o campo do parâmetro (no número de professores, também se inclui diretores e coordenadores). */
function CampoParametro({ s, rotulo, titulo }: { s: CasoStore; rotulo: string; titulo?: boolean }) {
  const p = PARAMETROS[rotulo], lider = selecoesLit(s, 'publicos.A11.incluiLiderancas');
  return <div className="pv-v17-linha" role="group" aria-label={t(rotulo)}>
    {titulo ? <div className="pv-v17-linha-cab"><h4 className="pv-v17-op">{t(rotulo)}</h4></div> : null}
    <div className="pv-v17-campos">
      <CampoNumero label={t(p.rotulo)} value={valorLit(lerLit(s, p.campo))} decimais={p.decimais} suggested={ehSugerido(s, 'letramento', p.campo)} onChange={v => gravarLit(p.campo, numeroLit(v))} />
    </div>
    {p.liderancas ? <><h3 className="pv-campo-titulo" aria-hidden="true">{t('Inclui diretores e coordenadores?')}</h3>
      <OptionCardGroup className="pc-lit-opcoes pv-opcoes-linha" label={t('Inclui diretores e coordenadores?')} type="radio">
        {[['sim', 'Sim'], ['nao', 'Não']].map(([id, txt]) => <OptionCard key={id} name={'lider-' + rotulo} value={id} type="radio" label={t(txt)} checked={lider.includes(id)}
          onChange={() => gravarLit('publicos.A11.incluiLiderancas', { escolhas: [id], origem: 'informado' })} />)}
      </OptionCardGroup>
      {lider.includes('sim') ? <div className="pv-v17-campos"><CampoNumero label={t('Número de diretores e coordenadores')} value={valorLit(lerLit(s, 'publicos.A11.liderancas'))} onChange={v => gravarLit('publicos.A11.liderancas', numeroLit(v))} /></div> : null}
    </> : null}
  </div>;
}

/** Passo 3: valores de cada opção marcada, por fase. */
export function ValoresV17({ s, frente }: { s: CasoStore; frente: FrenteEstimativa }) {
  const o = orcamentoV16(s, frente), fmt = (v: number) => formatarMoedaEst(v, o.moeda);
  if (!o.itens.length) return <p className="pc-nota">{t('Volte e escolha pelo menos uma categoria de custo.')}</p>;
  return <div className="pv-v17" id="valores" tabIndex={-1}>
    {semFases(frente) ? <div className="pv-v17-campos"><CampoNumero label={t('Duração do plano (meses)')} value={raizOrcamento(s, frente).duracao ?? ''} placeholder={String(DURACAO_GOV_PADRAO)} onChange={v => gravarOrc(frente, 'duracao', v === '' ? undefined : v)} /></div>
      : <p className="pv-v17-fases-resumo">{resumoFases(s, frente)} · {o.moeda} · <a href={href.pergunta(4, telaFases(frente))}>{t('Alterar fases')}</a></p>}
    {porGrupo(o.itens).map(([grupo, itens]) => <section key={grupo} className="pv-v17-grupo">
      {grupo ? <h2 className="pv-v17-desafio">{grupo}</h2> : null}
      {itens.map(i => <div key={i.id} className="pv-v17-cat">
        <div className="pv-v17-cat-cab"><h3 className="pv-v17-cat-nome">{nomeCat(i)}</h3><span className="pv-v17-cat-total">{i.valor === null ? '—' : fmt(i.valor)}</span></div>
        {i.marcadas.length ? [...i.parametros.map(r => <CampoParametro key={r} s={s} rotulo={r} />), ...i.linhas.map(l => <LinhaValor key={l.chave} s={s} frente={frente} cat={i.id} l={l} moeda={o.moeda} />)]
          : <p className="pv-v17-falta">{t('Nenhuma opção escolhida.')} <a href={href.pergunta(3, frente === 'governanca' ? 'gov-opcoes' : frente === 'letramento' ? 'lit-opcoes' : 'ed-opcoes')}>{t('Escolher opções')}</a></p>}
      </div>)}
    </section>)}
    {!semFases(frente) && o.fases.length ? <div className="pv-por-fase" aria-label={t('Custo por fase')}>
      <h3 className="pv-rec-grupo">{t('Custo por fase')}</h3>
      {o.fases.map(f => <div key={f.id} className="pv-por-fase-linha"><span>{f.nome} · {t('{n} meses', { n: f.meses })}</span>
        <span className="pv-por-fase-num">{f.informado + f.estimado ? fmt(f.informado + f.estimado) : '—'}</span></div>)}
    </div> : null}
  </div>;
}

/** v018: "Como foi calculado" — a conta da opção e de onde vem cada número, com o link das fontes públicas. */
function ComoCalculado({ l }: { l: LinhaOpcao }) {
  const c = l.conta!;
  const fechar = <button type="button" className="pc-est-fechar" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))}>{t('Fechar')}</button>;
  return <p className="pc-est-acoes pv-v17-conta"><Popover className="pc-est-popover" label={t('Como foi calculado')} title={t('Como foi calculado')} actions={fechar}>
    {c.formula ? <span className="pv-conta-formula">{c.formula}</span> : null}
    <span className="pv-conta-partes">{c.partes.map(p => <span key={p.rotulo} className="pv-conta-parte">
      <b>{p.rotulo}: {p.valor}</b> <span>{p.texto}</span>
      {p.fontes.map(f => <span key={f.titulo} className="pv-conta-fonte">{t('Fonte')}: {f.url ? <a href={f.url} target="_blank" rel="noopener noreferrer">{f.titulo}</a> : f.titulo}</span>)}
    </span>)}</span>
    <span className="pv-conta-grau">{t('Graus de confiança: A = estatística oficial; B = estudo ou caso real com fonte; C = convenção da ferramenta, a calibrar.')}</span>
  </Popover></p>;
}
