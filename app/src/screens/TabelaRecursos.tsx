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
  /** situações extras (custo compartilhado) depois das quatro */
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

/** A conta em blocos, com a fonte em letra monoespaçada pequena e o link para a conta completa. */
function ContaBlocos({ est }: { est: Estimativa }) {
  const blocos = blocosConta(est.conta.calculo || ''), ultimo = blocos.length - 1;
  const origens = [...new Set(est.conta.quantidades.map(q => q.origem))];
  const fonte = [...est.conta.parametros.map(p => t('Parâmetro') + ' ' + p.id + ' · ' + t(p.fonte) + ' · ' + t('grau {g}', { g: p.grau }) + (p.ano ? ' · ' + t('preços de {ano}', { ano: p.ano }) : '')),
    ...(origens.length ? [t('Quantidades usadas') + ': ' + origens.join('; ')] : [])].join(' · ');
  const fechar = <button type="button" className="pc-est-fechar" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))}>{t('Fechar')}</button>;
  return <div className="pc-rec-conta">
    <p className="pc-rec-conta-titulo">{t('Como a estimativa foi calculada')}</p>
    <p className="pc-rec-blocos">{blocos.map((b, i) => <span key={i} className={b.op ? 'pc-rec-op' : i === ultimo ? 'pc-rec-bloco pc-rec-bloco--res' : 'pc-rec-bloco'}>{b.texto}</span>)}</p>
    <p className="pc-rec-fonte">{fonte}</p>
    <div className="pc-est pc-rec-conta-completa"><Popover className="pc-est-popover" label={t('Ver a conta completa')} title={t('Como a estimativa foi calculada')} actions={fechar}><ContaEstimativa est={est} /></Popover></div>
  </div>;
}

function Valor({ l, moeda }: { l: LinhaRecurso; moeda: string }) {
  const est = l.estimativa, disp = typeof est?.valor === 'number' ? formatarMoedaEst(est.valor, est.moeda) : null;
  let valor = '—', nota = t('não informado'), classe = 'pc-rec-valor--vazio';
  if (l.compartilhado) { valor = l.compartilhado.valor; nota = t('custeado em {frente}', { frente: l.compartilhado.frente }); classe = 'pc-rec-valor--sem'; }
  else if (l.emUso) { if (disp) { valor = disp; classe = 'pc-rec-valor--est'; } nota = disp ? t('estimativa de referência') : t('estimativa indisponível'); }
  else if (l.situacao === 'informado') { const ok = typeof l.valor === 'number' && Number.isFinite(l.valor) && l.valor >= 0; valor = ok ? formatarMoedaEst(l.valor as number, moeda) : t('Digite o valor'); nota = t('informado'); classe = ok ? 'pc-rec-valor--inf' : 'pc-rec-valor--vazio'; }
  else if (l.situacao === 'sem_custo') { valor = formatarMoedaEst(0, moeda); nota = t('fora deste orçamento'); classe = 'pc-rec-valor--sem'; }
  else if (l.situacao === 'a_estimar') nota = disp ? t('estimativa disponível: {valor}', { valor: disp }) : t('pendente no plano');
  else if (disp) nota = t('estimativa disponível: {valor}', { valor: disp });
  return <div className="pc-rec-valor"><span className={'pc-rec-valor-num ' + classe}>{valor}</span><span className="pc-rec-valor-nota">{nota}</span></div>;
}

function rotuloSituacao(l: LinhaRecurso): { texto: string; classe: string } {
  if (l.compartilhado) return { texto: t('custeado em {frente}', { frente: l.compartilhado.frente }), classe: 'pc-rec-chip--sem' };
  if (l.emUso) return { texto: t('Estimativa de referência'), classe: 'pc-rec-chip--est' };
  if (l.situacao === 'informado') return { texto: t('Informado'), classe: 'pc-rec-chip--inf' };
  if (l.situacao === 'sem_custo') return { texto: t('Sem custo neste orçamento'), classe: 'pc-rec-chip--sem' };
  if (l.situacao === 'a_estimar') return { texto: t('A levantar'), classe: 'pc-rec-chip--lev' };
  return { texto: t('Escolha a situação'), classe: 'pc-rec-chip--lev' };
}

function Linha({ s, l, moeda, tela, tentou, aberta, onAbrir }: { s: CasoStore; l: LinhaRecurso; moeda: string; tela: string; tentou: boolean; aberta: boolean; onAbrir: (v: boolean) => void }) {
  const est = l.estimativa, erro = tentou && !l.respondido, corpo = l.ancora + '-corpo';
  const opcoes = [...SITUACOES, ...(est ? [{ id: 'referencia', rotulo: 'Usar estimativa' }] : []), ...(l.extras || [])];
  const ativa = (id: string) => id === 'referencia' ? l.emUso : !l.emUso && l.situacao === id;
  const chip = rotuloSituacao(l), semEstimativa = l.situacao === 'a_estimar' || (!l.situacao && !l.compartilhado);
  const valorInvalido = typeof l.valor === 'number' && (!Number.isFinite(l.valor) || l.valor < 0);
  return <div className={'pc-rec-linha' + (aberta ? ' is-aberta' : '') + (erro ? ' is-erro' : '')} id={l.ancora} tabIndex={-1} data-recurso={l.id}>
    <div className="pc-rec-cab">
      <button type="button" className="pc-rec-nome" aria-expanded={aberta} aria-controls={corpo} onClick={() => onAbrir(!aberta)}>
        <span>{l.nome}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="pc-rec-seta"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      <span className={'pc-rec-chip ' + chip.classe}>{chip.texto}</span>
      <div className="pc-rec-pilulas" role="group" aria-label={t('Situação do custo') + ': ' + l.nome}>
        {opcoes.map(o => {
          const on = ativa(o.id), ref = o.id === 'referencia';
          const indisponivel = ref && !on && typeof est?.valor !== 'number';
          return <button key={o.id} type="button" aria-pressed={on} disabled={indisponivel} title={indisponivel ? t('Estimativa indisponível: falta uma quantidade ou o período.') : undefined}
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
        {!l.emUso && l.situacao === 'informado' ? <div className="pc-rec-campo"><CampoNumero label={t('Valor total no período') + ' (' + moeda + ')'} value={typeof l.valor === 'number' ? l.valor : ''} decimais
          error={erro || valorInvalido ? t('Informe um valor maior ou igual a zero.') : undefined} onChange={l.onValor} /></div> : null}
        {l.emUso && est ? typeof est.valor === 'number' ? <ContaBlocos est={est} /> : <><p className="pc-rec-falta"><b>{t('Estimativa em uso, mas indisponível.')}</b></p><Falta s={s} est={est} tela={tela} /></> : null}
        {l.origem}
        {!l.compartilhado && semEstimativa && !l.emUso ? est === null
          ? <p className="pc-rec-falta">{t('A ferramenta não tem base para estimar este item. Ele fica pendente no plano até a equipe informar.')}</p>
          : typeof est.valor === 'number'
            ? <p className="pc-rec-falta">{t('Estimativa de referência disponível: {valor}. Escolha "Usar estimativa" para usá-la neste item.', { valor: formatarMoedaEst(est.valor, est.moeda) })}</p>
            : <Falta s={s} est={est} tela={tela} /> : null}
        {l.quantidades && !l.compartilhado && l.situacao !== 'sem_custo' && !(l.situacao === 'informado' && !l.emUso) ? <div className="pc-rec-quantidades">{l.quantidades}</div> : null}
        <details className="pc-gov-detalhes"><summary>{t('Adicionar mais informações +')}{l.detalhe ? ' · ' + t('Informações adicionadas') : ''}</summary>
          <TextField multiline label={t('Detalhamento e fonte do item')} value={l.detalhe} onChange={l.onDetalhe} />
        </details>
        {l.onRemover ? <Button variant="link" onClick={l.onRemover}>{t('Remover')}</Button> : null}
      </div>
    </details>
  </div>;
}

export interface ContextoOrcamento { periodo: string; moeda: string; cambio: string; fonte: string; completo: boolean; campos: ReactNode }

/** Faixa Período · Moeda e câmbio · Fonte; "mudar" abre as perguntas do período e da fonte (abertas enquanto faltam). */
function Contexto({ c }: { c: ContextoOrcamento }) {
  const [aberto, setAberto] = useState(!c.completo);
  return <details className="pc-rec-contexto" open={aberto} onToggle={e => setAberto(e.currentTarget.open)}>
    <summary>
      <span><span className="pc-rec-ctx-rot">{t('Período')}</span> <strong>{c.periodo || t('a definir')}</strong></span>
      <span><span className="pc-rec-ctx-rot">{t('Moeda')}</span> <strong>{c.moeda}</strong>{c.cambio ? ' · ' + c.cambio : ''}</span>
      <span><span className="pc-rec-ctx-rot">{t('Fonte')}</span> <strong>{c.fonte || t('a definir')}</strong></span>
      <span className="pc-rec-ctx-mudar">{aberto ? t('fechar') : t('mudar')}</span>
    </summary>
    <div className="pc-rec-contexto-campos">{c.campos}</div>
  </details>;
}

export function TabelaRecursos({ s, linhas, moeda, tela, tentou, contexto, aviso, disponiveis, onUsarTodas, onAdicionar }: {
  s: CasoStore; linhas: LinhaRecurso[]; moeda: string; tela: string; tentou: boolean; contexto: ContextoOrcamento; aviso?: ReactNode;
  disponiveis: number; onUsarTodas: () => void; onAdicionar: () => void;
}) {
  const [aberta, setAberta] = useState<string | null>(null);
  return <div className="pc-rec">
    <Contexto c={contexto} />
    {aviso ? <p className="pc-nota">{aviso}</p> : null}
    <div className="pc-rec-tabela">
      <div className="pc-rec-cabecalho" aria-hidden="true"><span>{t('Recurso e situação')}</span><span>{t('Valor')}</span></div>
      {linhas.map(l => <Linha key={l.id} s={s} l={l} moeda={moeda} tela={tela} tentou={tentou} aberta={aberta === l.id} onAbrir={v => setAberta(v ? l.id : a => a === l.id ? null : a)} />)}
      <div className="pc-rec-rodape">
        <button type="button" className="pc-rec-todas" disabled={!disponiveis} onClick={onUsarTodas}>
          {disponiveis ? t('Usar a estimativa nos itens sem valor ({n})', { n: disponiveis }) : t('Nenhum item sem valor tem estimativa de referência disponível.')}
        </button>
        <Button variant="link" onClick={onAdicionar}>{t('Adicionar recurso +')}</Button>
      </div>
    </div>
  </div>;
}
