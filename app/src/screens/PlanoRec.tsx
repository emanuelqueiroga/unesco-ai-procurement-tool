// Recomendações na página do plano (pacote R6: REC-38 a REC-45). Desenha os dados já traduzidos de
// src/plano/recplano.js (planoRec), os mesmos do PDF:
//   Em resumo: VereditoResumo (recomendação principal = veredito da próxima decisão, com o aviso de mais de 5
//              condições), Cuidado (3 frases), Contadores e CartoesRec (os 5 cartões: O quê, Por quê, Para quê,
//              Como, Quem age, Marco, O que está em jogo, Pronto quando e a origem numa linha pequena);
//   O que fazer: Pendencias ("Antes de decidir, responda"), Sequencia (portões G1–G4 e os pontos de decisão do
//              guia em ordem), TesteAvaliar ("Como testar e avaliar") e PlanoAcao (pacotes em sanfona, por marco).
// A 360 px os rótulos dos cartões ficam acima do conteúdo e as tabelas viram itens (DataTable; COM-22, REC-45).
import { useContext } from 'react';
import { Alert, DataTable, type DataColumn, type DataRow } from '../ui';
import { t } from '../percurso/textos';
import { href } from '../percurso/rota';
import { ModoImpressao } from './Secao';
import './plano.css';
import './plano-rec.css';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type PlanoRecDados = any;

const irCampo = (campo?: string) => (campo ? href.campo(campo) : undefined);

// ----------------------------------------------------------- Em resumo
/** Recomendação principal: o veredito da próxima decisão (4.4), a mesma frase da capa, do PDF e da síntese. */
export function VereditoResumo({ P }: { P: PlanoRecDados }) {
  const imprimindo = useContext(ModoImpressao);
  if (!P) return null;
  const v = P.veredito;
  return (
    <div className={'pc-callout pc-veredito pc-veredito--' + (v.codigo || 'sem')} id="sec-veredito">
      <span className="pc-callout-rotulo">{P.rotulos.principal}</span>
      <span className="pc-veredito-rotulo">{v.rotulo}</span>
      <span className="pc-veredito-texto">{v.texto}</span>
      {P.porque ? <span className="pc-nota">{P.porque}</span> : null}
      {P.aviso ? (
        <details className="pc-recolhe pc-veredito-aviso" open={imprimindo || undefined}>
          <summary>{P.aviso.texto} {P.aviso.ver}</summary>
          <ol className="pc-lista pc-recolhe-corpo">
            {P.aviso.lista.map((x: any) => <li key={x.id}><b>{x.id}</b> · {x.oque} <span className="pc-nota">({x.titulo})</span></li>)}
          </ol>
        </details>
      ) : null}
      {P.nRecs ? <a className="pc-callout-link" href={href.plano('fazer')}>{t('Ver a sequência de decisões e o plano de ação')}</a> : null}
    </div>
  );
}

/** Nível de cuidado deste caso, em 3 frases (5.1; ETI-13). */
export function Cuidado({ P }: { P: PlanoRecDados }) {
  if (!P || !P.cuidado || !P.cuidado.length) return null;
  return (
    <section className="pc-plano-sec pc-cuidado" id="sec-cuidado">
      <h2 className="pc-plano-h2">{P.rotulos.cuidado}</h2>
      <p className="pc-paragrafo">{P.cuidado.join(' ')}</p>
    </section>
  );
}

/** "Governança: x de 6", "Condições de uso nas escolas: x de 4" e "Faltam n respostas" (com link). */
export function Contadores({ P }: { P: PlanoRecDados }) {
  if (!P) return null;
  const c = P.contadores;
  return (
    <p className="pc-contagens pc-contadores" aria-label={t('Contadores do plano')}>
      <span className="pc-selo">{c.gov.texto}</span>
      {c.uso ? <span className={'pc-selo' + (c.uso.prontas < 4 ? ' pc-selo--falta' : '')}>{c.uso.texto}</span> : null}
      {c.faltam.n ? <a className="pc-selo pc-selo--link" href={href.plano('faltam')}>{c.faltam.texto}</a> : <span className="pc-selo">{c.faltam.texto}</span>}
    </p>
  );
}

function Campo({ rot, children }: { rot: string; children: React.ReactNode }) {
  return <div className="pc-rc-l"><dt>{rot}</dt><dd>{children}</dd></div>;
}

/** Um cartão de "Comece por estas" (4.3; 5.1). */
export function CartaoRec({ c, R }: { c: any; R: any }) {
  const imprimindo = useContext(ModoImpressao);
  const link = irCampo(c.campo);
  return (
    <article className={'pc-rc pc-rc--' + (c.nivel || 'recomendada')} aria-labelledby={'rc-' + c.id}>
      <header className="pc-rc-cab">
        <span className="pc-rc-n" aria-hidden="true">{c.n}</span>
        <span className="pc-rc-pacote">{c.titulo}</span>
        <span className={'pc-rc-nivel pc-rc-nivel--' + (c.nivel || 'recomendada')}>{c.rotuloNivel}</span>
      </header>
      <dl className="pc-rc-dl">
        <Campo rot={R.oque}><b id={'rc-' + c.id}>{c.oque}</b> <span className="pc-rc-id">{c.id}</span>{c.etiqueta ? <span className="pc-nota"> {c.etiqueta}</span> : null}</Campo>
        <Campo rot={R.porque}>{c.razao}</Campo>
        {c.paraque ? <Campo rot={R.paraque}>{c.paraque}</Campo> : null}
        {c.como && c.como.length ? <Campo rot={R.como}><ol className="pc-rc-como">{c.como.map((x: string, i: number) => <li key={i}>{x}</li>)}</ol></Campo> : null}
        <Campo rot={R.quem}>{c.quem}</Campo>
        <Campo rot={R.marco}>{c.marco}</Campo>
        {c.emJogo ? <Campo rot={R.jogo}>{c.emJogo.rotulo}: <b className="pc-rc-num">{c.emJogo.valor}</b></Campo> : null}
        {c.pronto ? <Campo rot={R.pronto}>{c.pronto}</Campo> : null}
      </dl>
      {c.passos && c.passos.length ? (
        <details className="pc-rc-passos" open={imprimindo || undefined}>
          <summary>{R.junto} ({c.passos.length})</summary>
          <ul className="pc-lista">{c.passos.map((p: any) => <li key={p.id}><b>{p.id}</b> · {p.oque}</li>)}</ul>
        </details>
      ) : null}
      {c.origem ? (
        <p className="pc-rc-origem">{R.origem}: {c.origem}{link ? <> · <a href={link}>{t('Rever a resposta')}</a></> : null}</p>
      ) : null}
    </article>
  );
}

/** "Comece por estas": os 5 cartões da seleção (4.3). */
export function CartoesRec({ P }: { P: PlanoRecDados }) {
  if (!P) return null;
  return (
    <section className="pc-plano-sec" id="sec-acoes">
      <h2 className="pc-plano-h2">{t('Comece por estas')}</h2>
      {!P.cartoes.length ? (
        <Alert kind="info" title={P.vazioInfo ? P.vazioInfo.texto : t('Ainda sem recomendações')}>
          {P.vazioInfo ? P.vazioInfo.explicacao : null}
          {P.vazioInfo && P.vazioInfo.perguntas.length ? (
            <ul className="pc-faltam-numero">{P.vazioInfo.perguntas.map((q: any) => <li key={q.campo}><a href={href.campo(q.campo)}>{q.n} · {q.pergunta}</a></li>)}</ul>
          ) : null}
        </Alert>
      ) : (
        <>
          <div className="pc-rcs">{P.cartoes.map((c: any) => <CartaoRec key={c.id} c={c} R={P.rotulos} />)}</div>
          <a href={href.plano('fazer')}>{t('Ver todas as {n} recomendações, por pacote', { n: P.nRecs })}</a>
        </>
      )}
    </section>
  );
}

// ----------------------------------------------------------- O que fazer
/** "Antes de decidir, responda" (5.3, bloco 1): as pendências, com o efeito no custo quando o motor o tem. */
export function Pendencias({ P }: { P: PlanoRecDados }) {
  if (!P) return null;
  const R = P.rotulos;
  return (
    <section className="pc-plano-sec" id="sec-pend">
      <h2 className="pc-plano-h2">{R.pendT}</h2>
      {!P.pend.length ? <p className="pc-nota">{R.pendVazio}</p> : (
        <>
          <p className="pc-nota">{R.pendIntro}</p>
          <ul className="pc-pends">
            {P.pend.map((p: any) => (
              <li key={p.id} className="pc-pend">
                <span className={'pc-tag pc-tag--' + (p.tipo === 'premissa' ? 'info' : 'warn')}>{p.rotuloTipo}</span>
                <span className="pc-pend-q"><b>{p.n}</b> {p.pergunta} <span className="pc-nota">— {p.resposta}</span></span>
                <span className="pc-paragrafo">{p.motivo}</span>
                {p.linhaIds ? <span className="pc-nota">{p.linhaIds}</span> : null}
                {p.efeito ? (
                  <dl className="pc-kv pc-pend-efeito" aria-label={p.efeito.rotulo}>
                    {p.efeito.valores.map((v: any) => (
                      <div key={v.arq} className="pc-kv-linha"><dt>{v.rotulo}{v.atual ? ' (' + R.pendAtual + ')' : ''}</dt><dd><b>{v.total}</b></dd></div>
                    ))}
                  </dl>
                ) : null}
                {p.campo ? <a href={href.campo(p.campo)}>{R.pendResponder}</a> : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

const COLS_CRIT = (r: any): DataColumn[] => [
  { key: 'c', label: r.criterio }, { key: 'v', label: r.valor }, { key: 'e', label: r.estado }, { key: 'i', label: r.vem },
];
/** "Sequência de decisões" (4.5; 5.3, bloco 2): os portões com os critérios e o estado, e os pontos de decisão 1–9. */
export function Sequencia({ P }: { P: PlanoRecDados }) {
  if (!P) return null;
  const S = P.sequencia, r = S.rotulos;
  return (
    <section className="pc-plano-sec" id="sec-sequencia">
      <h2 className="pc-plano-h2">{S.titulo}</h2>
      <p className="pc-nota">{S.intro}</p>
      <ol className="pc-portoes">
        {S.portoes.map((g: any) => {
          const rows: DataRow[] = g.criterios.map((k: any, i: number) => ({
            key: g.id + i,
            cells: { c: k.criterio, v: k.valor, e: <span className={'pc-estado pc-estado--' + ({ pronto: 'ok', falta: 'pendente', premissa: 'andamento', impossivel: 'pendente' } as Record<string, string>)[k.estado]}>{k.rotuloEstado}</span>, i: k.ids.join(', ') || '—' },
          }));
          return (
            <li key={g.id} className={'pc-portao pc-portao--' + g.marco}>
              <h3 className="pc-secao-h3">{g.titulo}</h3>
              <p className="pc-portao-meta"><span><b>{r.decisao}:</b> {g.decisao}</span> <span><b>{r.quem}:</b> {g.quem}</span> <span><b>{r.quando}:</b> {g.quando}</span></p>
              <DataTable columns={COLS_CRIT(r)} rows={rows} caption={g.titulo} />
            </li>
          );
        })}
      </ol>
      <h3 className="pc-secao-h3">{S.pdTitulo}</h3>
      <ol className="pc-pds">
        {S.pds.map((p: any) => <li key={p.n}><b>{p.n}. {p.titulo}</b> <span className="pc-nota">{p.acoes}</span></li>)}
      </ol>
    </section>
  );
}

function TabelaFicha({ titulo, linhas, rot }: { titulo: string; linhas: any[]; rot: any }) {
  if (!linhas.length) return null;
  const cols: DataColumn[] = [{ key: 'c', label: rot.criterio }, { key: 'v', label: rot.limiar }];
  return <DataTable columns={cols} rows={linhas.map((l, i) => ({ key: 'l' + i, cells: { c: l.criterio, v: <>{l.valor} <span className="pc-nota">({l.rotulo})</span></> } }))} caption={titulo} showCaption />;
}
/** "Como testar e avaliar" (5.3, bloco 3; REC-40): ficha de aceite, desenho de avaliação, quem pode ficar para trás. */
export function TesteAvaliar({ T: X }: { T: any }) {
  if (!X) return null;
  const F = X.ficha;
  return (
    <div className="pc-teste">
      <section className="pc-secao pc-secao--sub" id="sub-ficha-aceite">
        <h3 className="pc-secao-h3">{F.titulo}</h3>
        <p className="pc-nota">{F.intro}</p>
        <p className="pc-paragrafo"><b>{F.classeTxt}</b></p>
        <TabelaFicha titulo={F.classeTxt} linhas={F.linhas} rot={F.rotulos} />
        {F.blocos.map((b: any) => <TabelaFicha key={b.id} titulo={b.titulo + ' (' + b.id + ')'} linhas={b.linhas} rot={F.rotulos} />)}
        <dl className="pc-kv">{F.fixos.map(([k, v]: [string, string]) => <div key={k} className="pc-kv-linha"><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      </section>
      {X.aval ? (
        <section className="pc-secao pc-secao--sub">
          <h3 className="pc-secao-h3">{X.aval.titulo} <span className="pc-nota">({X.aval.rotulo})</span></h3>
          <ul className="pc-lista">{X.aval.linhas.map((l: string, i: number) => <li key={i}>{l}</li>)}</ul>
          {X.aval.premissas.length ? <><p className="pc-nota">{X.aval.rotuloPrem}</p><ul className="pc-lista pc-nota">{X.aval.premissas.map((l: string, i: number) => <li key={i}>{l}</li>)}</ul></> : null}
          {X.custoAval ? <p className="pc-nota">{X.custoAval}</p> : null}
        </section>
      ) : null}
      <section className="pc-secao pc-secao--sub">
        <h3 className="pc-secao-h3">{X.grupos.titulo}</h3>
        <dl className="pc-kv">{X.grupos.linhas.map(([k, v]: [string, string]) => <div key={k} className="pc-kv-linha"><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      </section>
      {X.vale ? (
        <section className="pc-secao pc-secao--sub">
          <h3 className="pc-secao-h3">{X.vale.titulo} <span className="pc-nota">({X.vale.rotulo})</span></h3>
          <p className="pc-paragrafo">{X.vale.frase}</p>
          {X.vale.premissas.length ? <ul className="pc-lista pc-nota">{X.vale.premissas.map((l: string, i: number) => <li key={i}>{l}</li>)}</ul> : null}
        </section>
      ) : null}
    </div>
  );
}

/** "Plano de ação" (5.3, bloco 4; REC-23): até 11 pacotes em sanfona, por marco; cada passo com R-nn e origem. */
export function PlanoAcao({ P }: { P: PlanoRecDados }) {
  const imprimindo = useContext(ModoImpressao);
  if (!P || !P.plano.grupos.length) return null;
  const A = P.plano, R = P.rotulos;
  return (
    <section className="pc-plano-sec" id="sec-plano-acao">
      <h2 className="pc-plano-h2">{A.titulo}</h2>
      <p className="pc-nota">{A.intro}</p>
      {A.grupos.map((g: any, gi: number) => (
        <details key={g.pacote} className="pc-recolhe pc-pacote" open={imprimindo || gi === 0 || undefined}>
          <summary>
            <span className="pc-pacote-t">{g.titulo}</span>
            <span className={'pc-rc-nivel pc-rc-nivel--' + g.nivel}>{g.rotuloNivel}</span>
            <span className="pc-nota">{g.contagem}</span>
          </summary>
          <div className="pc-recolhe-corpo">
            {g.marcos.map((m: any) => (
              <div key={m.marco} className="pc-pacote-marco">
                <h4 className="pc-cartao-sub">{R.marco}: {m.nome}</h4>
                <ul className="pc-acoes">
                  {m.itens.map((it: any) => (
                    <li key={it.id} className="pc-acao">
                      <span className="pc-acao-t"><b className="pc-rc-id">{it.id}</b> {it.oque}{it.etiqueta ? <span className="pc-nota"> {it.etiqueta}</span> : null}</span>
                      <span className={'pc-rc-nivel pc-rc-nivel--' + it.nivel}>{it.rotuloNivel}</span>
                      <span className="pc-nota"><b>{R.quem}:</b> {it.quem}</span>
                      {it.pronto ? <span className="pc-nota"><b>{R.pronto}:</b> {it.pronto}</span> : null}
                      {it.origem ? <span className="pc-rc-origem">{R.origem}: {it.origem}{it.campo ? <> · <a href={href.campo(it.campo)}>{t('Rever a resposta')}</a></> : null}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      ))}
      {A.base.length ? (
        <p className="pc-nota"><b>{A.baseTitulo}:</b> {A.base.map((b: any) => b.id + ' · ' + b.oque).join(' ')}</p>
      ) : null}
    </section>
  );
}
