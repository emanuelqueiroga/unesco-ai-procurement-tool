// Desenho de uma seção do plano (dados de src/plano/secoes.js, já traduzidos por trSecao): títulos, notas, pares
// rótulo–valor, a equação do custo, listas, tabelas, cartões do perfil e a Figura 1. Porte da parte HTML de
// src/resumo.js da v13 (htmlCorpoP, htmlTabelaP, htmlEqP, htmlFiguraP) com os componentes do Prumo.
import { Fragment, type ReactNode } from 'react';
import { tr } from '../domain';
import { DataTable, KpiTile, type DataColumn, type DataRow } from '../ui';

export interface SecaoPlano {
  tipo?: string; id?: string; h?: string; sub?: boolean; det?: string; soPagina?: boolean; alt?: string; img?: string;
  pre?: string[] | null; kv?: [string, string][]; kpis?: boolean; eq?: boolean; p?: string[]; list?: string[]; pos?: string[];
  table?: { head: string[]; rows: string[][]; num?: number[]; grupo?: boolean; b0?: boolean; hl?: number[]; marca?: number[] } | null;
  cartoes?: { id: string; h: string; kv: [string, string][]; hTable?: string; table?: { head: string[]; rows: string[][] } | null }[];
  pagina?: string;
}

/** texto com endereços web clicáveis */
export function Linkado({ texto }: { texto: string }) {
  const partes = String(texto ?? '').split(/(https?:\/\/[^\s<]+[^\s<.,;)])/g);
  return <>{partes.map((p, i) => (i % 2 ? <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="pc-url">{p}</a> : <Fragment key={i}>{p}</Fragment>))}</>;
}

function Celula({ v, marca }: { v: string; marca: boolean }) {
  const s = String(v ?? '');
  if (s === String(tr('Resolver antes de contratar'))) return <span className="pc-tag pc-tag--crit">{s}</span>;
  if (s === String(tr('Tratar no plano')) || (marca && (s === String(tr('Alta')) || s === String(tr('Prioridade'))))) return <span className="pc-tag pc-tag--warn">{s}</span>;
  return <Linkado texto={s} />;
}

export function TabelaPlano({ t, legenda }: { t: NonNullable<SecaoPlano['table']>; legenda?: string }) {
  if (!t || !(t.rows || []).length) return null;
  const num = t.num || [], marca = t.marca || [];
  const linhas = t.grupo ? t.rows.map((r, i) => (i && r[0] === t.rows[i - 1][0] ? [''].concat(r.slice(1)) : r)) : t.rows;
  const total = String(tr('Total'));
  const columns: DataColumn[] = t.head.map((h, j) => ({ key: 'c' + j, label: String(h), numeric: num.includes(j) }));
  const rows: DataRow[] = linhas.map((r, i) => ({
    key: 'r' + i,
    total: r[0] === total && i === linhas.length - 1,
    selected: (t.hl || []).includes(i),
    cells: Object.fromEntries(r.map((v, j) => {
      const c = <Celula v={v} marca={marca.includes(j)} />;
      return ['c' + j, (t.b0 || t.grupo) && j === 0 && v ? <b>{c}</b> : c];
    })),
  }));
  return <DataTable columns={columns} rows={rows} caption={legenda} />;
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

function Corpo({ s }: { s: SecaoPlano }) {
  return (
    <>
      {(s.pre || []).map((x, i) => <p key={'pre' + i} className="pc-nota"><Linkado texto={x} /></p>)}
      {s.kv && s.kv.length ? (
        s.eq ? <Equacao kv={s.kv} />
          : s.kpis ? <div className="pc-kpis pc-kpis--3">{s.kv.map(([k, v], i) => <KpiTile key={i} label={k} value={v} />)}</div>
            : <ParesValor kv={s.kv} />
      ) : null}
      {(s.p || []).map((x, i) => <p key={'p' + i} className="pc-paragrafo"><Linkado texto={x} /></p>)}
      {s.list && s.list.length ? <ul className="pc-lista">{s.list.map((x, i) => <li key={i}><Linkado texto={x} /></li>)}</ul> : null}
      {s.table ? <TabelaPlano t={s.table} legenda={s.h} /> : null}
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

export function Secao({ s, extra }: { s: SecaoPlano; extra?: ReactNode }) {
  if (s.tipo === 'bloco') return null;
  const Titulo = s.sub ? 'h3' : 'h2';
  if (s.tipo === 'figura') {
    if (!s.img) return null;
    return (
      <figure className="pc-figura" id={s.id}>
        <h2 className="pc-secao-h">{s.h}</h2>
        <img src={s.img} alt={s.alt || ''} width={900} height={1225} loading="lazy" decoding="async" />
        {(s.pos || []).map((x, i) => <figcaption key={i} className="pc-nota"><Linkado texto={x} /></figcaption>)}
      </figure>
    );
  }
  const corpo = (
    <>
      {s.tipo === 'perfil' ? <>{(s.p || []).map((x, i) => <p key={i} className="pc-nota">{x}</p>)}<Cartoes s={s} /></> : <Corpo s={s} />}
      {extra}
    </>
  );
  // seções de consulta ("Ver todos os arranjos", listas de referência): recolhidas, com a descrição no resumo
  if (s.det) {
    return (
      <details className={'pc-secao pc-secao--det' + (s.sub ? ' pc-secao--sub' : '')}>
        <summary><span className="pc-secao-h3">{s.h}</span>{s.det && s.det !== s.h ? <span className="pc-nota"> · {s.det}</span> : null}</summary>
        <div className="pc-secao-corpo">{corpo}</div>
      </details>
    );
  }
  return (
    <section className={'pc-secao' + (s.sub ? ' pc-secao--sub' : '')} id={s.id && !s.sub ? 'sec-' + s.id : undefined}>
      {s.h ? <Titulo className={s.sub ? 'pc-secao-h3' : 'pc-secao-h'}>{s.h}</Titulo> : null}
      {corpo}
    </section>
  );
}
