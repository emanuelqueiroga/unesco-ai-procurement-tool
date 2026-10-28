// Desenho de uma seção do plano (dados de src/plano/secoes.js, já traduzidos por trSecao): títulos, notas, pares
// rótulo–valor, a equação do custo, listas, tabelas, cartões do perfil, a matriz camadas × fases e a Figura 1.
// Porte da parte HTML de src/resumo.js da v13 (htmlCorpoP, htmlTabelaP, htmlEqP, htmlFiguraP) com os componentes do Prumo.
// Listas com mais de 10 itens e tabelas com mais de 14 linhas começam recolhidas na página (PLA-15) e abertas
// na impressão e no PDF; a Figura 1 abre ampliada num Dialog (PLA-06).
// 0.0.15: `recolher` (tabela que repete um gráfico ao lado, REL-12) começa recolhida na página; `achado` é o
// título-achado em número de um bloco (REL-08); os títulos não mostram os códigos A1–A7 e B1–B9.
import { Fragment, createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { tr } from '../domain';
import { DataTable, KpiTile, Dialog, Button, useMediaQuery, type DataColumn, type DataRow } from '../ui';
import { fmt } from '../percurso/ambiente';
import { t, plural } from '../percurso/textos';
import { ROT_ESTADO, TXT_MATRIZ, TXT_REF } from '../plano/secoes.js';
import './plano.css';
import './plano-rec.css';

export interface SecaoPlano {
  tipo?: string; id?: string; h?: string; sub?: boolean; det?: string; soPagina?: boolean; alt?: string; img?: string;
  pre?: string[] | null; kv?: [string, string][]; kpis?: boolean; eq?: boolean; p?: string[]; list?: string[]; pos?: string[];
  table?: { head: string[]; rows: string[][]; num?: number[]; grupo?: boolean; b0?: boolean; hl?: number[]; marca?: number[] } | null;
  cartoes?: { id: string; h: string; kv: [string, string][]; hTable?: string; table?: { head: string[]; rows: string[][] } | null }[];
  mx?: MatrizDados;
  pagina?: string;
  /** 0.0.15: já traduzida por plano/relatorio.js */
  pronto?: boolean;
  /** tabela que repete o gráfico ao lado: recolhida na página, aberta na impressão e no PDF */
  recolher?: boolean;
  /** título-achado do bloco ("O custo total pode ficar entre…") */
  achado?: string;
  /** o bloco "O que pode mudar o custo" de "Quanto custa" */
  incerteza?: boolean;
  /** R6 (REC-43): lista de verificação do guia (referência), com o rótulo acima do título */
  ref?: boolean;
  /** R6 (REC-40): dados de "Como testar e avaliar" (plano/recplano.js), já traduzidos */
  avaliacao?: unknown;
}

/** REL-08: o título sem o código interno da seção ("A2. ", "B6. "), para planos e textos antigos. */
export const semCodigo = (h?: string) => String(h || '').replace(/^[AB]\d+\.\s*/, '');

interface CelulaMx { fase: string; t: string; n: string[]; na: boolean; estado: string; custo: number | null }
interface MatrizDados {
  fases: { id: string; n: number; nome: string }[];
  linhas: { n: number; nome: string; cel: CelulaMx[] }[];
  custo: boolean; somas: (number | null)[]; total: number | null;
}

/** Na impressão (Ctrl+P) as seções recolhidas abrem: o Plano liga este contexto entre `beforeprint` e `afterprint`. */
export const ModoImpressao = createContext(false);

/** Limites do PLA-15: acima disso a lista ou a tabela começa recolhida na página. */
export const MAX_ITENS_LISTA = 10;
export const MAX_LINHAS_TABELA = 14;

/** Âncora de uma seção na página (o índice interno rola até ela). */
export function ancoraDe(s: Pick<SecaoPlano, 'id' | 'h' | 'sub'>): string {
  if (!s.sub && s.id) return 'sec-' + s.id;
  const slug = String(s.h || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  return 'sub-' + (slug || 'x');
}

/** texto com endereços web clicáveis */
export function Linkado({ texto }: { texto: string }) {
  const partes = String(texto ?? '').split(/(https?:\/\/[^\s<]+[^\s<.,;)])/g);
  return <>{partes.map((p, i) => (i % 2 ? <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="pc-url">{p}</a> : <Fragment key={i}>{p}</Fragment>))}</>;
}

/** Conteúdo longo que começa recolhido na página e aberto na impressão. */
export function Recolhivel({ resumo, children }: { resumo: string; children: ReactNode }) {
  const imprimindo = useContext(ModoImpressao);
  return (
    <details className="pc-recolhe" open={imprimindo || undefined}>
      <summary>{resumo}</summary>
      <div className="pc-recolhe-corpo">{children}</div>
    </details>
  );
}

function Celula({ v, marca }: { v: string; marca: boolean }) {
  const s = String(v ?? '');
  if (s === String(tr('Resolver antes de contratar'))) return <span className="pc-tag pc-tag--crit">{s}</span>;
  // R6 (REC-19): os níveis são Condição, Recomendada e Para acompanhar (sem "Alta")
  if (s === String(tr('Tratar no plano')) || (marca && (s === String(tr('Condição')) || s === String(tr('Prioridade'))))) return <span className="pc-tag pc-tag--warn">{s}</span>;
  return <Linkado texto={s} />;
}

export function TabelaPlano({ t: tab, legenda }: { t: NonNullable<SecaoPlano['table']>; legenda?: string }) {
  if (!tab || !(tab.rows || []).length) return null;
  const num = tab.num || [], marca = tab.marca || [];
  const linhas = tab.grupo ? tab.rows.map((r, i) => (i && r[0] === tab.rows[i - 1][0] ? [''].concat(r.slice(1)) : r)) : tab.rows;
  const total = String(tr('Total'));
  const columns: DataColumn[] = tab.head.map((h, j) => ({ key: 'c' + j, label: String(h), numeric: num.includes(j) }));
  const rows: DataRow[] = linhas.map((r, i) => ({
    key: 'r' + i,
    total: r[0] === total && i === linhas.length - 1,
    selected: (tab.hl || []).includes(i),
    cells: Object.fromEntries(r.map((v, j) => {
      const c = <Celula v={v} marca={marca.includes(j)} />;
      return ['c' + j, v === '' || v == null ? '' : (tab.b0 || tab.grupo) && j === 0 ? <b>{c}</b> : c];
    })),
  }));
  const tabela = <DataTable columns={columns} rows={rows} caption={legenda} />;
  return rows.length > MAX_LINHAS_TABELA
    ? <Recolhivel resumo={t('Mostrar a tabela ({n} linhas)', { n: rows.length })}>{tabela}</Recolhivel>
    : tabela;
}

/** "Como o custo é calculado": total = teste + uso + saída − residual */
function Equacao({ kv }: { kv: [string, string][] }) {
  const total = kv[kv.length - 1], termos = kv.slice(0, -1);
  const parte = (k: string) => { const m = String(k).match(/^(.*) \(([^()]*)\)$/); return m ? [m[1], m[2]] : [k, '']; };
  const caixa = ([k, v]: [string, string], cls: string) => {
    const [l, q] = parte(k);
    return (
      <div className={'pc-eq-termo ' + cls}>
        <span className="pc-eq-v">{String(v).replace(/^− /, '')}</span>
        <span className="pc-eq-l">{l}</span>
        {q ? <span className="pc-eq-q">{q}</span> : null}
      </div>
    );
  };
  return (
    <div className="pc-eq" role="group" aria-label={kv.map(([k, v]) => k + ': ' + v).join('; ')}>
      {caixa(total, 'pc-eq-termo--total')}
      <span className="pc-eq-op" aria-hidden="true">=</span>
      {termos.map((z, i) => (
        <Fragment key={i}>
          {i ? <span className="pc-eq-op" aria-hidden="true">{/^− /.test(z[1]) ? '−' : '+'}</span> : null}
          {caixa(z, '')}
        </Fragment>
      ))}
    </div>
  );
}

function ParesValor({ kv }: { kv: [string, string][] }) {
  return (
    <dl className="pc-kv">
      {kv.map(([k, v], i) => (
        <div key={i} className="pc-kv-linha"><dt>{k}</dt><dd><Linkado texto={v} /></dd></div>
      ))}
    </dl>
  );
}

/** Estados das respostas da matriz, com a legenda em pílulas */
const ESTADOS = ['ok', 'andamento', 'pendente', 'orientacao', 'na'];
const rotuloEstado = (e: string) => String(tr((ROT_ESTADO as Record<string, string>)[e] || e));

/** A matriz camadas × fases: estado de cada célula como pílula, custo em destaque, cor da fase no cabeçalho (PLA-12). */
function MatrizPlano({ m, legenda }: { m: MatrizDados; legenda?: string }) {
  const columns: DataColumn[] = [{ key: 'camada', label: String(tr(TXT_MATRIZ.camada)) }].concat(m.fases.map((f, i) => ({ key: 'f' + i, label: f.n + '. ' + String(tr(f.nome)) })));
  const rows: DataRow[] = m.linhas.map((l) => ({
    key: 'l' + l.n,
    layer: l.n,
    cells: Object.assign({ camada: <b>{l.n + '. ' + String(tr(l.nome))}</b> }, ...l.cel.map((c, i) => ({
      ['f' + i]: (
        <div className="pc-mx-cel">
          <span className={c.na ? 'pc-mx-na' : undefined}>{String(tr(c.t))}</span>
          {!c.na && c.n.length ? <span className="pc-nota">{String(tr(TXT_MATRIZ.perguntas)) + ' ' + c.n.join(', ')}</span> : null}
          {!c.na ? (
            <span className="pc-mx-rodape">
              <span className={'pc-estado pc-estado--' + c.estado}>{rotuloEstado(c.estado)}</span>
              {c.custo != null ? <b className="pc-mx-custo">{fmt.curto(c.custo)}</b> : null}
            </span>
          ) : null}
        </div>
      ),
    }))),
  }));
  if (m.custo) {
    rows.push({ key: 'total', total: true, cells: Object.assign({ camada: String(tr('Total')) }, ...m.somas.map((v, i) => ({ ['f' + i]: v == null ? '—' : fmt.curto(v) }))) });
  }
  return (
    <div className="pc-matriz">
      <p className="pc-mx-legenda">
        <span className="pc-nota">{String(tr(TXT_MATRIZ.legenda)) + ':'}</span>
        {ESTADOS.map((e) => <span key={e} className={'pc-estado pc-estado--' + e}>{rotuloEstado(e)}</span>)}
      </p>
      <DataTable columns={columns} rows={rows} caption={legenda} />
    </div>
  );
}

function Corpo({ s, kpiOrigem }: { s: SecaoPlano; kpiOrigem?: (i: number, alinharAoFim: boolean) => ReactNode }) {
  const achado = s.achado ? <p className="pc-achado">{s.achado}</p> : null;
  const estreito = useMediaQuery('(max-width: 900px)');
  const lista = s.list && s.list.length ? (
    <ul className="pc-lista">{s.list.map((x, i) => <li key={i}><Linkado texto={x} /></li>)}</ul>
  ) : null;
  // KPIs em grade de 3 (2 no estreito): o "de onde vem?" do terceiro (e do segundo, no estreito) abre para o outro lado
  const colunas = estreito ? 2 : 3;
  const fim = (i: number) => i % colunas >= Math.ceil(colunas / 2);
  return (
    <>
      {achado}
      {(s.pre || []).map((x, i) => <p key={'pre' + i} className="pc-nota"><Linkado texto={x} /></p>)}
      {s.kv && s.kv.length ? (
        s.eq ? <Equacao kv={s.kv} />
          : s.kpis ? <div className="pc-kpis pc-kpis--3">{s.kv.map(([k, v], i) => <KpiTile key={i} label={k} value={v} origin={kpiOrigem ? kpiOrigem(i, fim(i)) : undefined} />)}</div>
            : <ParesValor kv={s.kv} />
      ) : null}
      {(s.p || []).map((x, i) => <p key={'p' + i} className="pc-paragrafo"><Linkado texto={x} /></p>)}
      {lista && s.list!.length > MAX_ITENS_LISTA
        ? <Recolhivel resumo={t('Mostrar os {n} itens', { n: s.list!.length })}>{lista}</Recolhivel>
        : lista}
      {s.mx ? <MatrizPlano m={s.mx} legenda={s.h} />
        : s.table && s.recolher && (s.table.rows || []).length <= MAX_LINHAS_TABELA
          ? <Recolhivel resumo={plural(s.table.rows.length, 'Mostrar a tabela ({n} linha)', 'Mostrar a tabela ({n} linhas)')}><TabelaPlano t={s.table} legenda={s.h} /></Recolhivel>
          : s.table ? <TabelaPlano t={s.table} legenda={s.h} /> : null}
      {(s.pos || []).map((x, i) => <p key={'pos' + i} className="pc-nota"><Linkado texto={x} /></p>)}
    </>
  );
}

function Cartoes({ s }: { s: SecaoPlano }) {
  return (
    <div className="pc-cartoes">
      {(s.cartoes || []).map((c) => (
        <section key={c.id} className="pc-cartao">
          <h3 className="pc-cartao-h">{c.h}</h3>
          <ParesValor kv={c.kv} />
          {c.table && c.table.rows.length ? <>{c.hTable ? <h4 className="pc-cartao-sub">{c.hTable}</h4> : null}<TabelaPlano t={c.table} legenda={c.hTable || c.h} /></> : null}
        </section>
      ))}
    </div>
  );
}

/** Figura 1 em miniatura, com legenda e crédito, e o visualizador ampliado (Esc, fundo e "Fechar" fecham; o foco volta ao botão). */
function Figura({ s }: { s: SecaoPlano }) {
  const [aberta, setAberta] = useState(false);
  const botao = useRef<HTMLButtonElement>(null);
  if (!s.img) return null;
  const legenda = (s.pos || []).map((x, i) => <p key={i} className="pc-nota"><Linkado texto={x} /></p>);
  return (
    <figure className="pc-figura" id={ancoraDe({ ...s, sub: false, id: s.id })}>
      <h2 className="pc-secao-h">{s.h}</h2>
      <img src={s.img} alt={s.alt || ''} width={900} height={1225} loading="lazy" decoding="async" />
      <figcaption className="pc-figura-legenda">{legenda}</figcaption>
      <div className="pc-botoes pc-figura-ampliar">
        <Button ref={botao} variant="secondary" size="sm" aria-haspopup="dialog" onClick={() => setAberta(true)}>{t('Ampliar a figura')}</Button>
      </div>
      <Dialog
        open={aberta}
        size="figure"
        title={s.h}
        returnFocusTo={botao}
        onClose={() => setAberta(false)}
        actions={<Button onClick={() => setAberta(false)}>{t('Fechar')}</Button>}
      >
        <div className="pc-figura-ampliada">
          <img src={s.img} alt={s.alt || ''} />
          {legenda}
        </div>
      </Dialog>
    </figure>
  );
}

export function Secao({ s, extra, kpiOrigem }: { s: SecaoPlano; extra?: ReactNode; kpiOrigem?: (i: number, alinharAoFim: boolean) => ReactNode }) {
  const imprimindo = useContext(ModoImpressao);
  if (s.tipo === 'bloco') return null;
  const Titulo = s.sub ? 'h3' : 'h2';
  if (s.tipo === 'figura') return <Figura s={s} />;
  const corpo = (
    <>
      {s.tipo === 'perfil' ? <>{(s.p || []).map((x, i) => <p key={i} className="pc-nota">{x}</p>)}<Cartoes s={s} /></> : <Corpo s={s} kpiOrigem={kpiOrigem} />}
      {extra}
    </>
  );
  const id = s.id || s.sub ? ancoraDe(s) : undefined;
  // seções de consulta ("Ver todos os arranjos", listas de referência): recolhidas, com a descrição no resumo
  if (s.det) {
    return (
      <details id={id} className={'pc-secao pc-secao--det' + (s.sub ? ' pc-secao--sub' : '')} open={imprimindo || undefined}>
        <summary><span className="pc-secao-h3">{semCodigo(s.h)}</span>{s.det && s.det !== s.h ? <span className="pc-nota"> · {s.det}</span> : null}</summary>
        <div className="pc-secao-corpo">{corpo}</div>
      </details>
    );
  }
  return (
    <section className={'pc-secao' + (s.sub ? ' pc-secao--sub' : '') + (s.incerteza ? ' pc-secao--bloco' : '')} id={id}>
      {s.ref && !s.sub ? <p className="pc-ref-rotulo">{String(tr(TXT_REF))}</p> : null}
      {s.h ? <Titulo className={s.sub ? 'pc-secao-h3' : 'pc-secao-h'}>{semCodigo(s.h)}</Titulo> : null}
      {corpo}
    </section>
  );
}
