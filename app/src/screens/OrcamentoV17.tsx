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
import { TIPOS, ORDEM_TIPOS, NOME_PERFIL, chaveOpcao, ehParametro, PARAMETROS, type TipoCusto, type LinhaOpcao } from '../percurso/custosV017';
import { alterarLit, lerLit, selecoesLit } from '../percurso/letramento';
import { ehSugerido } from '../percurso/padroesTeste';
import { formatarMoedaEst, type FrenteEstimativa } from '../percurso/estimativasOrcamento';
import { gravarOrc } from './OrcamentoV16';
import { CartaoComDica, DicaGov } from './InfoDica';
import { CATEGORIAS } from '../domain/catalogo_v016.js';
import { ADICIONAIS, ID_ADICIONAIS, PERGUNTAS_ADICIONAIS, type SalvoAdicionais } from '../percurso/adicionaisGov';
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

/** Passo 2: opções de cada categoria escolhida. v018 (governança): com `cat`, só a categoria da página; a duração do
 *  plano e os custos adicionais ficam na última página (AdicionaisPaginaV18). */
export function OpcoesV17({ s, frente, cat }: { s: CasoStore; frente: FrenteEstimativa; cat?: string }) {
  const o = orcamentoV16(s, frente), fmt = (v: number) => formatarMoedaEst(v, o.moeda);
  const marcar = (c: CategoriaV16, r: string, on: boolean) => {
    const x = raizOrcamento(useCaso.getState(), frente).itens?.[c.id]?.opcoes, atual: string[] = Array.isArray(x) ? x : [];
    gravarOrc(frente, 'itens.' + c.id + '.opcoes', on ? [...atual.filter(v => v !== r), r] : atual.filter(v => v !== r));
  };
  if (!o.itens.length) return <p className="pc-nota">{t('Volte e escolha pelo menos uma categoria de custo.')}</p>;
  // v017: a tela Valores saiu; o que só existia nela (duração ou resumo das fases, total da categoria, valor das
  // categorias sem opções e custo por fase) fica aqui.
  const lista = cat ? o.itens.filter(i => i.id === cat) : o.itens;
  return <div className="pv-v17" id="opcoes" tabIndex={-1}>
    {cat ? null : semFases(frente) ? <div className="pv-v17-campos">{(() => { const campo = <CampoNumero label={t('Duração do plano (meses)')} value={raizOrcamento(s, frente).duracao ?? ''} placeholder={String(DURACAO_GOV_PADRAO)} onChange={v => gravarOrc(frente, 'duracao', v === '' ? undefined : v)} />;
      return frente === 'governanca' ? <div className="pc-dica-campo">{campo}<DicaGov chave="Duração do plano (meses)" inicio /></div> : campo; })()}</div>
      : <p className="pv-v17-fases-resumo">{resumoFases(s, frente)} · {o.moeda} · <a href={href.pergunta(4, telaFases(frente))}>{t('Alterar fases')}</a></p>}
    {porGrupo(lista).map(([grupo, itens]) => <section key={grupo} className="pv-v17-grupo">
      {grupo ? <h2 className="pv-v17-desafio">{grupo}</h2> : null}
      {itens.map(i => <div key={i.id} className="pv-v17-cat">
        <div className="pv-v17-cat-cab"><h3 className="pv-v17-cat-nome">{nomeCat(i)}{frente === 'governanca' ? <DicaGov chave={nomeGovPt(i.id)} nome={nomeCat(i)} inicio /> : null}</h3><span className="pv-v17-cat-total">{i.valor === null ? '—' : fmt(i.valor)}</span></div>
        {i.id === ID_ADICIONAIS ? <AdicionaisV18 s={s} linhas={i.linhas} moeda={o.moeda} />
        : todosObrigatorios(frente, i.id) ? i.opcoes.map(r => <CampoParametro key={r} s={s} rotulo={r} titulo />)
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

/** v018 (governança): última página do fluxo: a duração do plano (padrão de 12 meses) e os custos adicionais. */
export function AdicionaisPaginaV18({ s }: { s: CasoStore }) {
  const frente: FrenteEstimativa = 'governanca', o = orcamentoV16(s, frente), i = o.itens.find(x => x.id === ID_ADICIONAIS);
  const fmt = (v: number) => formatarMoedaEst(v, o.moeda);
  return <div className="pv-v17" id="opcoes" tabIndex={-1}>
    <div className="pv-v17-campos"><div className="pc-dica-campo"><CampoNumero label={t('Duração do plano (meses)')} value={raizOrcamento(s, frente).duracao ?? ''} placeholder={String(DURACAO_GOV_PADRAO)}
      onChange={v => gravarOrc(frente, 'duracao', v === '' ? undefined : v)} /><DicaGov chave="Duração do plano (meses)" inicio /></div></div>
    {i ? <section className="pv-v17-grupo"><div className="pv-v17-cat">
      <div className="pv-v17-cat-cab"><h3 className="pv-v17-cat-nome">{nomeCat(i)}<DicaGov chave={nomeGovPt(i.id)} nome={nomeCat(i)} inicio /></h3><span className="pv-v17-cat-total">{i.valor === null ? '—' : fmt(i.valor)}</span></div>
      <AdicionaisV18 s={s} linhas={i.linhas} moeda={o.moeda} />
    </div></section> : <p className="pc-nota">{t('Volte e escolha pelo menos uma categoria de custo.')}</p>}
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
    {l.tipo === 'time' ? <EquipeV18 l={l} moeda={moeda} atual={atual} gravar={gravar} />
      : l.tipo === 'fechado'
      ? <div className="pv-v17-campos">{fases.map(f => <CampoNumero key={f.id} label={semFases(frente) ? t('Valor total') + ' (' + moeda + ')' : f.nome} value={l.valoresFase[f.id] ?? ''} decimais
          onChange={v => gravarOrc(frente, caminho, { ...atual(), fases: { ...(atual().fases || {}), [f.id]: v === '' ? undefined : v } })} />)}</div>
      : <div className="pv-v17-campos">
          <CampoNumero label={t(def.qtd!)} value={l.qtd ?? ''} suggested={l.qtdSugerida} decimais={l.tipo === 'equipe'} onChange={v => gravar('qtd', v)} />
          {def.horas ? <CampoNumero label={t(def.horasRotulo || 'Horas por pessoa')} value={l.horas ?? ''} suggested={l.esforcoC && !!l.horas} decimais onChange={v => gravar('horas', v)} /> : null}
          <CampoNumero label={t(def.unit!) + ' (' + moeda + ')'} value={l.unitDaReferencia ? '' : l.unit ?? ''} decimais placeholder={l.unitRef === null ? undefined : new Intl.NumberFormat(String(LOC()), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(l.unitRef)}
            hint={l.unitRef === null ? undefined : l.refPais ? t('Vazio = salário do país (ILOSTAT) com encargos ({v}).', { v: fmt(l.unitRef) }) : frente === 'governanca' ? t('Vazio = estimativa de referência ({v}).', { v: fmt(l.unitRef) }) : t('Vazio = referência genérica ({v}).', { v: fmt(l.unitRef) })} onChange={v => gravar('unit', v)} />
        </div>}
    {frente === 'governanca' && l.conta && l.status !== 'falta' ? <ComoCalculado l={l} /> : null}
    {l.tipo === 'time' ? null
      : l.qtdSugerida ? <p className="pc-nota">{t('Quantidade sugerida a partir do Contexto; altere se precisar.')}</p> : null}
    {l.status === 'falta' ? <p className="pv-v17-falta">{t('Falta')}: {l.falta.join(', ')}</p>
      : semFases(frente) ? (l.status === 'referencia' && !l.refPais ? <p className="pv-v17-fases">{t('estimativa de referência, que pode variar conforme o contexto')}</p> : null)
      : <p className="pv-v17-fases">{fases.map(f => f.nome + ' ' + fmt(l.porFase[f.id] || 0)).join(' · ')}{l.status === 'referencia' ? ' · ' + (l.refPais ? t('salário do país (ILOSTAT)') : t('referência genérica, igual para todos os países')) : ''}</p>}
  </div>;
}

/** v018 (governança): a equipe de referência da opção — meses (no trabalho pontual), resumo da equipe e, aberto sob
 *  pedido, pessoas e custo mensal de cada papel. Os detalhes de cada papel ficam em "Como foi calculado". */
function EquipeV18({ l, moeda, atual, gravar }: { l: LinhaOpcao; moeda: string; atual: () => any; gravar: (campo: string, v: unknown) => void }) {
  const n2 = (v: number) => new Intl.NumberFormat(String(LOC()), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const gravarPapel = (papel: string, campo: 'qtd' | 'unit' | 'existente', v: number | '' | boolean) => { const ps = { ...(atual().papeis || {}) }; ps[papel] = { ...(ps[papel] || {}), [campo]: v === '' || v === false ? undefined : v }; gravar('papeis', ps); };
  const salvo = atual(), time = l.time || [];
  return <>
    {l.continua ? null : <div className="pv-v17-campos"><CampoNumero label={t('Meses de trabalho')} value={l.horas ?? ''} suggested={!(salvo.horas > 0)} decimais onChange={v => gravar('horas', v)} /></div>}
    <p className="pc-nota">{t(l.continua ? 'Equipe de referência (grau C): {n} pessoas durante todo o plano.' : 'Equipe de referência (grau C): {n} pessoas.', { n: new Intl.NumberFormat(String(LOC())).format(l.qtd || 0) })} <a href={'#/esforcos/' + l.chave}>{t('De onde vem')}</a></p>
    <details className="pv-equipe">
      <summary>{t('Ajustar a equipe')}</summary>
      {time.map(p => <div key={p.papel} className="pv-equipe-papel" role="group" aria-label={t(p.papel)}>
        <p className="pv-equipe-nome"><b>{t(p.papel)}</b> <span>{Math.round(p.dedicacao * 100)}% · {t(NOME_PERFIL[p.perfil])}{p.especialista ? ' · ' + t('prêmio de especialista') : ''}</span></p>
        <div className="pv-v17-campos">
          <CampoNumero label={t('Pessoas')} value={p.qtdInformada ? p.qtd : ''} placeholder={String(p.qtdRef)} decimais onChange={v => gravarPapel(p.papel, 'qtd', v)} />
          <CampoNumero label={t('Custo mensal por pessoa') + ' (' + moeda + ')'} value={p.daRef ? '' : p.unit ?? ''} placeholder={p.ref === null ? undefined : n2(p.ref)} decimais
            hint={p.ref === null ? undefined : p.salPais ? t(p.especialista ? 'Vazio = salário do país (ILOSTAT) com encargos e prêmio de especialista.' : 'Vazio = salário do país (ILOSTAT) com encargos.') : t('Vazio = mediana mundial do ILOSTAT.')} onChange={v => gravarPapel(p.papel, 'unit', v)} />
        </div>
        <label className="pv-equipe-existente"><input type="checkbox" checked={p.existente} onChange={e => gravarPapel(p.papel, 'existente', e.target.checked)} /> {t('Servidor que já existe (fora do desembolso novo)')}</label>
      </div>)}
    </details>
  </>;
}

/** v018 (governança): viagens, overhead e taxa administrativa — um percentual editável cada, com o padrão de fonte
 *  pública e "Como foi calculado". */
function AdicionaisV18({ s, linhas, moeda }: { s: CasoStore; linhas: LinhaOpcao[]; moeda: string }) {
  const fmt = (v: number) => formatarMoedaEst(v, moeda), n = (v: number) => new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 2 }).format(v);
  const salvo = (raizOrcamento(s, 'governanca').adicionais || {}) as SalvoAdicionais;
  const gravar = (k: string, v: unknown) => gravarOrc('governanca', 'adicionais', { ...(raizOrcamento(useCaso.getState(), 'governanca').adicionais || {}), [k]: v });
  return <>{linhas.map(l => { const a = ADICIONAIS.find(x => x.chave === l.chave)!, nome = t(l.rotulo), q = PERGUNTAS_ADICIONAIS[a.chave];
    const fundacao = a.chave === 'taxa' && salvo.executor === 'fundacao';
    return <div key={l.chave} className={'pv-v17-linha pv-v17-linha--' + l.status} role="group" aria-label={nome}>
      <div className="pv-v17-linha-cab">
        <h4 className="pv-v17-op">{nome}<DicaGov chave={a.rotulo} nome={nome} inicio /></h4>
        <p className={'pv-v17-total' + (l.status === 'referencia' ? ' pc-rec-valor--est' : '')}>{l.total === null ? '—' : fmt(l.total)}</p>
      </div>
      <p className="pv-campo-titulo" aria-hidden="true">{t(q.pergunta)}</p>
      <OptionCardGroup className={'pc-lit-opcoes ' + (q.opcoes.length > 2 ? 'pv-opcoes-coluna' : 'pv-opcoes-linha')} label={t(q.pergunta)} type="radio">
        {q.opcoes.map(([id, txt]) => <OptionCard key={id} name={'adic-' + a.chave} value={id} type="radio" label={t(txt)} checked={salvo[q.campo] === id}
          onChange={() => gravar(q.campo, id)} />)}
      </OptionCardGroup>
      {l.naoAplica ? <p className="pc-nota">{l.memoria}</p> : <>
        <div className="pv-v17-campos">
          <CampoNumero label={t(a.base === 'opcoes' ? 'Percentual sobre os custos das opções (%)' : 'Percentual sobre os custos diretos (%)')} value={typeof salvo[a.chave] === 'number' ? salvo[a.chave] as number : ''}
            placeholder={n(a.padrao)} decimais hint={(fundacao ? t('Informe a taxa do contrato; no Brasil, fundações de apoio podem cobrar até 15%.') + ' ' : '') + t('Vazio = {p}% (referência com fonte).', { p: n(a.padrao) })}
            onChange={v => gravar(a.chave, v === '' ? undefined : v)} />
        </div>
        {l.conta && l.status !== 'falta' ? <ComoCalculado l={l} /> : null}
        {l.status === 'falta' ? <p className="pv-v17-falta">{t('Falta')}: {l.falta.join(', ')}</p> : null}
      </>}
    </div>; })}</>;
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
    <span className="pv-conta-partes">{c.partes.map((p, i) => <span key={i} className="pv-conta-parte">
      <b>{p.rotulo}: {p.valor}</b> <span>{p.texto}</span>
      {p.fontes.map(f => <span key={f.titulo} className="pv-conta-fonte">{t('Fonte')}: {f.url ? <a href={f.url} target="_blank" rel="noopener noreferrer">{f.titulo}</a> : f.titulo}</span>)}
      {p.pagina ? <span className="pv-conta-fonte"><a href={p.pagina}>{p.pagina.startsWith('#/esforcos') ? t('Ver as equipes de referência') : t('Ver salários e encargos por país')}</a></span> : null}
    </span>)}</span>
    <span className="pv-conta-grau">{t('Graus de confiança: A = estatística oficial; B = estudo ou caso real com fonte; C = estimativa da ferramenta, que pode variar conforme o contexto.')}</span>
    <span className="pv-conta-fonte"><a href={href.metodologia()}>{t('Como o custo é calculado')}</a></span>
  </Popover></p>;
}
