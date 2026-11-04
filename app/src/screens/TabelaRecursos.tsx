// Tabela de recursos do orçamento (teste de layout da v015), comum às frentes de governança, letramento e educação.
// Cada linha: o nome, a situação em pílulas (A levantar · Sem custo · Tenho o valor · Usar estimativa, esta só onde
// há base de cálculo) e o valor à direita com uma nota. A linha aberta mostra o campo do valor, a conta da estimativa
// em blocos ou o que falta. Os dados, as situações e as regras são os de cada frente: esta tela só os apresenta.
import { useState, type ReactNode } from 'react';
import { Button, Popover, TextField } from '../ui';
import { CampoNumero } from '../percurso/CampoNumero';
import { telasAtivas, type CasoStore } from '../store';
import { href } from '../percurso/rota';
import { focarPendencia } from '../percurso/navegacaoOrientada';
import { t } from '../percurso/textos';
import { formatarMoedaEst, type Estimativa, type PendenciaEstimativa } from '../percurso/estimativasOrcamento';
import { ContaEstimativa } from './EstimativaReferencia';
import './moldura.css';

export interface OpcaoSituacao { id: string; rotulo: string }
export interface LinhaRecurso {
  id: string;
  /** id do elemento da linha (usado pelas pendências e por "Adicionar recurso") */
  ancora: string;
  nome: string;
  /** situação salva: a_estimar, sem_custo, informado, referencia ou uma situação de custo compartilhado */
  situacao: string;
  valor: number | '' | undefined;
  estimativa: Estimativa | null;
  emUso: boolean;
  /** custo compartilhado: custeado em outra frente, não somado de novo */
  compartilhado?: { frente: string; valor: string } | null;
  /** custo compartilhado: escolhido dentro de "Tenho o valor" (Neste orçamento · Custeado na governança…) */
  extras?: OpcaoSituacao[];
  respondido: boolean;
  topo?: ReactNode;
  quantidades?: ReactNode;
  origem?: ReactNode;
  detalhe: string;
  onSituacao: (id: string) => void;
  onValor: (v: number | '') => void;
  onDetalhe: (v: string) => void;
  onRemover?: () => void;
}

const SITUACOES: OpcaoSituacao[] = [
  { id: 'a_estimar', rotulo: 'A levantar' }, { id: 'sem_custo', rotulo: 'Sem custo' }, { id: 'informado', rotulo: 'Tenho o valor' },
];

/** Divide a conta em blocos e operadores (só no nível de fora dos parênteses). */
export function blocosConta(conta: string): { texto: string; op: boolean }[] {
  const out: { texto: string; op: boolean }[] = [];
  let atual = '', prof = 0;
  for (let i = 0; i < conta.length; i++) {
    const c = conta[i];
    if (c === '(') prof++;
    if (c === ')') prof = Math.max(0, prof - 1);
    if (!prof && '×=+÷'.includes(c) && conta[i - 1] === ' ' && conta[i + 1] === ' ') {
      if (atual.trim()) out.push({ texto: atual.trim(), op: false });
      out.push({ texto: c, op: true });
      atual = '';
    } else atual += c;
  }
  if (atual.trim()) out.push({ texto: atual.trim(), op: false });
  return out;
}

function LinkPendencia({ s, p, tela }: { s: CasoStore; p: PendenciaEstimativa; tela: string }) {
  if (p.tela === tela) return <a href={'#' + p.ancora} onClick={e => { e.preventDefault(); focarPendencia(p.ancora); }}>{p.texto}</a>;
  const q = telasAtivas(s).find(x => x.id === p.tela);
  return q ? <a href={href.pergunta(q.capitulo, q.id)}>{p.texto}</a> : <span>{p.texto}</span>;
}
function Falta({ s, est, tela }: { s: CasoStore; est: Estimativa; tela: string }) {
  return <p className="pc-rec-falta">{est.pendencias?.length
    ? <>{t('Para ver uma estimativa de referência, informe')}: {est.pendencias.map((p, i) => <span key={i}>{i ? ' · ' : ''}<LinkPendencia s={s} p={p} tela={tela} /></span>)}</>
    : est.mensagem}</p>;
}

/** A conta em blocos; a fonte resumida em monoespaçada e o resto em "Ver a conta completa". */
function ContaBlocos({ est }: { est: Estimativa }) {
  const blocos = blocosConta(est.conta.calculo || ''), ultimo = blocos.length - 1, grau = est.conta.parametros[0]?.grau;
  const fechar = <button type="button" className="pc-est-fechar" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))}>{t('Fechar')}</button>;
  return <div className="pc-rec-conta">
    <p className="pc-rec-blocos">{blocos.map((b, i) => <span key={i} className={b.op ? 'pc-rec-op' : i === ultimo ? 'pc-rec-bloco pc-rec-bloco--res' : 'pc-rec-bloco'}>{b.texto}</span>)}</p>
    <div className="pc-rec-conta-pe">
      <span className="pc-rec-fonte">{t('Convenção ilustrativa')}{grau ? ' · ' + t('grau {g}', { g: grau }) : ''}</span>
      <span className="pc-est pc-rec-conta-completa"><Popover className="pc-est-popover" label={t('Ver a conta completa')} title={t('Como a estimativa foi calculada')} actions={fechar}><ContaEstimativa est={est} /></Popover></span>
    </div>
  </div>;
}

function Valor({ l, moeda }: { l: LinhaRecurso; moeda: string }) {
  const est = l.estimativa, disp = typeof est?.valor === 'number' ? formatarMoedaEst(est.valor, est.moeda) : null;
  let valor = '—', nota = '', classe = 'pc-rec-valor--vazio';
  if (l.compartilhado) { valor = l.compartilhado.valor; nota = t('custeado em {frente}', { frente: l.compartilhado.frente }); classe = 'pc-rec-valor--sem'; }
  else if (l.emUso) { if (disp) { valor = disp; classe = 'pc-rec-valor--est'; } }
  else if (l.situacao === 'informado') { const ok = typeof l.valor === 'number' && Number.isFinite(l.valor) && l.valor >= 0; if (ok) { valor = formatarMoedaEst(l.valor as number, moeda); classe = 'pc-rec-valor--inf'; } }
  else if (l.situacao === 'sem_custo') { valor = formatarMoedaEst(0, moeda); classe = 'pc-rec-valor--sem'; }
  else if (l.situacao === 'a_estimar' && disp) nota = t('estimativa disponível: {valor}', { valor: disp });
  return <div className="pc-rec-valor"><span className={'pc-rec-valor-num ' + classe}>{valor}</span>{nota ? <span className="pc-rec-valor-nota">{nota}</span> : null}</div>;
}

function rotuloSituacao(l: LinhaRecurso): { texto: string; classe: string } | null {
  if (l.compartilhado) return { texto: t('custeado em {frente}', { frente: l.compartilhado.frente }), classe: 'pc-rec-chip--sem' };
  // no celular, o valor (cor e número) já diz informado, estimado ou sem custo; só "a levantar" precisa de rótulo
  if (!l.emUso && l.situacao === 'a_estimar') return { texto: t('A levantar'), classe: 'pc-rec-chip--lev' };
  return null;
}

function Linha({ s, l, moeda, tela, tentou, aberta, onAbrir }: { s: CasoStore; l: LinhaRecurso; moeda: string; tela: string; tentou: boolean; aberta: boolean; onAbrir: (v: boolean) => void }) {
  const est = l.estimativa, erro = tentou && !l.respondido, corpo = l.ancora + '-corpo';
  const opcoes = [...SITUACOES, ...(est ? [{ id: 'referencia', rotulo: 'Usar estimativa' }] : [])];
  const compartilhado = !!l.compartilhado || (l.extras || []).some(o => o.id === l.situacao);
  // "Tenho o valor" inclui o custo já custeado em outra frente (escolhido dentro da linha aberta)
  const ativa = (id: string) => id === 'referencia' ? l.emUso : !l.emUso && (l.situacao === id || id === 'informado' && compartilhado);
  const chip = rotuloSituacao(l), comValor = !l.emUso && (l.situacao === 'informado' || compartilhado);
  const valorInvalido = typeof l.valor === 'number' && (!Number.isFinite(l.valor) || l.valor < 0);
  return <div className={'pc-rec-linha' + (aberta ? ' is-aberta' : '') + (erro ? ' is-erro' : '')} id={l.ancora} tabIndex={-1} data-recurso={l.id}>
    <div className="pc-rec-cab">
      <button type="button" className="pc-rec-nome" aria-expanded={aberta} aria-controls={corpo} onClick={() => onAbrir(!aberta)}>
        <span>{l.nome}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="pc-rec-seta"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {chip ? <span className={'pc-rec-chip ' + chip.classe}>{chip.texto}</span> : null}
      <div className="pc-rec-pilulas" role="group" aria-label={t('Situação do custo') + ': ' + l.nome}>
        {opcoes.map(o => {
          const on = ativa(o.id), ref = o.id === 'referencia';
          const indisponivel = ref && !on && typeof est?.valor !== 'number';
          return <button key={o.id} type="button" aria-pressed={on} disabled={indisponivel}
            className={'pc-rec-pilula' + (ref ? ' pc-rec-pilula--est' : '')}
            onClick={() => { if (!on) l.onSituacao(o.id); onAbrir(true); }}>{t(o.rotulo)}</button>;
        })}
      </div>
      <Valor l={l} moeda={moeda} />
      {erro ? <p id={l.ancora + '-erro'} className="pc-lit-erro pc-rec-erro">{t('Informe a situação e, quando necessário, o valor ou o item de origem.')}</p> : null}
    </div>
    <details className="pc-lit-grupo pc-rec-corpo" id={corpo} open={aberta} onToggle={e => { if (e.currentTarget.open !== aberta) onAbrir(e.currentTarget.open); }}>
      <summary className="pc-rec-sum" tabIndex={-1} aria-hidden="true">{l.nome}</summary>
      <div className="pc-rec-corpo-dados">
        {l.topo}
        {comValor && l.extras?.length ? <div className="pc-rec-onde" role="group" aria-label={t('Tenho o valor') + ': ' + l.nome}>
          {[{ id: 'informado', rotulo: 'Neste orçamento' }, ...l.extras].map(o => <button key={o.id} type="button" className="pc-rec-pilula pc-rec-pilula--sm" aria-pressed={l.situacao === o.id} onClick={() => { if (l.situacao !== o.id) l.onSituacao(o.id); }}>{t(o.rotulo)}</button>)}
        </div> : null}
        {!l.emUso && l.situacao === 'informado' ? <div className="pc-rec-campo"><CampoNumero label={t('Valor informado') + ' (' + moeda + ')'} value={typeof l.valor === 'number' ? l.valor : ''} decimais
          error={erro || valorInvalido ? t('Informe um valor maior ou igual a zero.') : undefined} onChange={l.onValor} /></div> : null}
        {l.emUso && est ? typeof est.valor === 'number' ? <ContaBlocos est={est} /> : <><p className="pc-rec-falta"><b>{t('Estimativa em uso, mas indisponível.')}</b></p><Falta s={s} est={est} tela={tela} /></> : null}
        {l.origem}
        {!compartilhado && !l.emUso && est && typeof est.valor !== 'number' && l.situacao !== 'sem_custo' && l.situacao !== 'informado' ? <Falta s={s} est={est} tela={tela} /> : null}
        {l.quantidades && !compartilhado && l.situacao !== 'sem_custo' && !(l.situacao === 'informado' && !l.emUso) ? <div className="pc-rec-quantidades">{l.quantidades}</div> : null}
        {l.onRemover ? <Button variant="link" onClick={l.onRemover}>{t('Remover')}</Button> : null}
      </div>
    </details>
  </div>;
}

/** "24 meses · BRL": os meses do período (ou a resposta) e a moeda. */
export function resumoPeriodo(meses: number | null, periodo: string, moeda: string): string {
  return (meses ? t('{n} meses', { n: meses }) : periodo || t('Período do orçamento')) + ' · ' + moeda;
}

export interface ContextoOrcamento { resumo: string; completo: boolean; campos: ReactNode; /** "mudar" leva a outra tela (o período da governança fica em Equipe e formação) */ href?: string }

/** Linha discreta "24 meses · BRL" com "mudar"; abre as perguntas do período e da fonte (abertas enquanto faltam). */
function Contexto({ c }: { c: ContextoOrcamento }) {
  const [aberto, setAberto] = useState(!c.completo);
  if (c.href) return <p className="pc-rec-contexto pc-rec-contexto--link"><span>{c.resumo}</span> <a className="pc-rec-ctx-mudar" href={c.href}>{t('mudar')}</a></p>;
  return <details className="pc-rec-contexto" open={aberto} onToggle={e => setAberto(e.currentTarget.open)}>
    <summary><span>{c.resumo}</span><span className="pc-rec-ctx-mudar">{aberto ? t('fechar') : t('mudar')}</span></summary>
    <div className="pc-rec-contexto-campos">{c.campos}</div>
  </details>;
}

export function TabelaRecursos({ s, linhas, moeda, tela, tentou, contexto, disponiveis, onUsarTodas, onAdicionar }: {
  s: CasoStore; linhas: LinhaRecurso[]; moeda: string; tela: string; tentou: boolean; contexto: ContextoOrcamento;
  disponiveis: number; onUsarTodas: () => void; onAdicionar: () => void;
}) {
  const [aberta, setAberta] = useState<string | null>(null);
  return <div className="pc-rec">
    <Contexto c={contexto} />
    <div className="pc-rec-tabela">
      {linhas.map(l => <Linha key={l.id} s={s} l={l} moeda={moeda} tela={tela} tentou={tentou} aberta={aberta === l.id} onAbrir={v => setAberta(v ? l.id : a => a === l.id ? null : a)} />)}
      <div className="pc-rec-rodape">
        {disponiveis ? <button type="button" className="pc-rec-todas" onClick={onUsarTodas}>{t('Usar a estimativa nos itens sem valor ({n})', { n: disponiveis })}</button> : <span />}
        <Button variant="link" onClick={onAdicionar}>{t('Adicionar recurso +')}</Button>
      </div>
    </div>
  </div>;
}
