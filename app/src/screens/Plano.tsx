// Plano de contratação: Em resumo, Quanto custa, O que fazer, O que exigir e Apêndice (D8–D11, M4), com o
// relatório em PDF e o caso em JSON. As seções vêm de src/plano/secoes.js (porte de src/resumo.js da v13).
// P3: links "Rever a resposta" para qualquer pergunta (href.campo), lacunas nas duas classes (as mesmas do PDF),
// fatos do caso em fichas, "de onde vem?" nos KPIs, gráfico da dotação por exercício, índice interno, impressão.
// 0.0.15 (REL-01 a REL-08, REL-12, REL-16): "Em resumo" é o sumário executivo (custo total com a faixa P10–P90,
// indicadores com o nome de cada denominador, seis respostas, cinco ações em cartões, um iceberg por fase e os três
// maiores direcionadores); cada página abre com a pergunta de decisão, o parágrafo de abertura e o título-achado.
// PB-06 a PB-08: "Em resumo" espelha a página 1 do policy brief (a recomendação, as cinco frases, os três números, as
// quatro etapas e as cinco ações só com o quê, quem e quando); o resto fica em "Ver detalhes", recolhido no fim.
// Dois downloads em todas as páginas: o policy brief (principal, plano/pdf_brief.js) e o anexo técnico (plano/pdf.js).
import { useContext, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { CAMADAS, LOC, getLang, tr, mil, unidMil } from '../domain';
import { useCaso, type CasoStore, type Estado14 } from '../store';
import { PlanIndex, LayerBars, SourceTag, Alert, Button, Popover, TextField, type PlanIndexItem } from '../ui';
import { Shell, Rodape } from './Shell';
import { usePainel } from './PlanoVivo';
import { baixarArquivo, exportarCaso } from './acoes';
import { avisar } from './Confirmar';
import { Secao, ModoImpressao, ancoraDe, type SecaoPlano } from './Secao';
import { fmt, sincronizar } from '../percurso/ambiente';
import { VERSAO } from '../percurso/canal';
import { t, plural, minusc } from '../percurso/textos';
import { href, type PaginaPlano } from '../percurso/rota';
import { tituloParcial, textoLacunas, rotuloOrigem, driversDe, explicacaoKpi, type KpiOuSaida, type Painel } from '../percurso/painel';
import { secoesPlano, trSecao, painelPlano } from '../plano/secoes.js';
import { R } from '../plano/relatorio.js';
import { Iceberg } from './Iceberg';
import { FaixaTco, IndicadoresResumo, SeisRespostas, Direcionadores, ComoLer, BriefRecomendacao, CincoFrases, TresNumeros, LinhaEtapas, type SumarioPlano } from './Sumario';
import { VereditoResumo, AvisoCondicoes, Cuidado, Contadores, CartoesBrief, Pendencias, Sequencia, TesteAvaliar, PlanoAcao } from './PlanoRec';
import { useBrief, type BriefDados } from './brief';

import { TXT_REF } from '../plano/secoes.js';
import figuraTCO from '../../../assets/fig1_tco.jpg';
import './plano.css';

const nomeCamada = (n: number) => String(tr(((CAMADAS as any[]).find((c) => c[0] === n) || [n, ''])[1]));
const PAGINAS: PaginaPlano[] = ['resumo', 'custa', 'fazer', 'exigir', 'apendice'];
const TITULO_PAGINA: Record<string, string> = { resumo: 'Em resumo', custa: 'Quanto custa', fazer: 'O que fazer', exigir: 'O que exigir', apendice: 'Apêndice', faltam: 'Respostas que faltam' };

/** Qual PDF: o policy brief (até 6 páginas, o principal) ou o anexo técnico para a contratação (o relatório completo). */
export type TipoPDF = 'brief' | 'anexo';

/** Gera o PDF (jsPDF carregado sob demanda) e entrega o arquivo (capacidade `downloads` do ambiente ou link). */
export async function baixarPDF(e: Estado14, tipo: TipoPDF = 'anexo'): Promise<void> {
  sincronizar(e);
  const base: any = await import('../plano/pdf.js');
  const m: any = tipo === 'brief' ? await import('../plano/pdf_brief.js') : base;
  // o anexo leva a Figura 1 e os logotipos; o brief não usa imagens
  const recursos = tipo === 'brief' ? {} : await base.recursosPDF();
  const opts = { versao: VERSAO, lang: getLang(), ...recursos };
  const doc = await (tipo === 'brief' ? m.gerarBrief(e, opts) : m.gerarPDF(e, opts));
  const nome = tipo === 'brief'
    ? (typeof m.nomeArqBrief === 'function' ? m.nomeArqBrief(e) : String(base.nomeArqPDF(e)).replace(/\.pdf$/i, '') + '-policy-brief.pdf')
    : (typeof m.nomeArqAnexo === 'function' ? m.nomeArqAnexo(e) : m.nomeArqPDF(e));
  const como = await baixarArquivo(nome, doc.output('blob'), 'application/pdf');
  if (como === 'link') avisar(t('Arquivo enviado para download.'));
}

export function BotaoPDF({ s, tipo = 'anexo', variante = tipo === 'brief' ? 'primary' : 'secondary', tamanho = 'sm', rotulo }: { s: CasoStore; tipo?: TipoPDF; variante?: 'primary' | 'secondary'; tamanho?: 'sm' | 'md'; rotulo?: string }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState('');
  return (
    <>
      <Button
        variant={variante}
        size={tamanho}
        disabled={gerando}
        aria-busy={gerando || undefined}
        data-pdf={tipo}
        onClick={async () => {
          setGerando(true); setErro('');
          try { await baixarPDF(s.estado(), tipo); } catch (err) { console.error(err); setErro(t('Não foi possível gerar o PDF. Tente de novo; se continuar, exporte o caso e avise a equipe.')); }
          finally { setGerando(false); }
        }}
      >
        {gerando ? t('Gerando o PDF…') : rotulo || (tipo === 'brief' ? t('Baixar o policy brief (PDF)') : t('Anexo técnico (PDF)'))}
      </Button>
      {erro ? <span className="pc-erro" role="alert">{erro}</span> : null}
    </>
  );
}

/** Os dois downloads (PB-08): o policy brief como ação principal e o anexo técnico como secundária. */
export function BotoesPDF({ s, tamanho = 'sm', className }: { s: CasoStore; tamanho?: 'sm' | 'md'; className?: string }) {
  return (
    <div className={['pc-botoes', 'pc-botoes-pdf', className || ''].filter(Boolean).join(' ')} role="group" aria-label={t('Baixar o plano')}>
      <BotaoPDF s={s} tipo="brief" tamanho={tamanho} />
      <BotaoPDF s={s} tipo="anexo" tamanho={tamanho} />
    </div>
  );
}

// ----------------------------------------------------------- "de onde vem?" (CUS-02)
const FRASE_ORIGEM: Record<string, string> = {
  padrao: 'Este número usa pelo menos uma premissa padrão: confirme as respostas abaixo.',
  sugerido: 'Este número usa uma sugestão da ferramenta, ainda não confirmada.',
  informado: 'Este número vem das suas respostas.',
  refinado: 'Este número usa premissas que você ajustou no Refinar.',
};

function ConteudoOrigem({ s, id, origem }: { s: CasoStore; id: KpiOuSaida; origem: string }) {
  // o cálculo só roda quando o popover abre (este componente só monta aberto)
  const x = useMemo(() => explicacaoKpi(s, id), [s.caso, s.ctx, s.resp, s.origem, s.custo, s.moeda, s.exemplo, s.lang, id]);  // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <span className="pc-pop-bloco"><SourceTag origin={origem as any} label={rotuloOrigem(origem)} /> {t(FRASE_ORIGEM[origem] || FRASE_ORIGEM.informado)}</span>
      {x.conta.length ? (
        <span className="pc-pop-bloco"><b>{t('Como é calculado')}</b>{x.conta.map((l, i) => <span key={i} className="pc-pop-item">{l}</span>)}</span>
      ) : null}
      {x.premissas.length ? (
        <span className="pc-pop-bloco"><b>{t('Premissas que o alimentam')}</b>{x.premissas.map((l, i) => <span key={i} className="pc-pop-item">{l}</span>)}</span>
      ) : null}
      {(x as any).fontes ? <span className="pc-pop-bloco">{(x as any).fontes}</span> : null}
      {x.drivers.length ? (
        <span className="pc-pop-bloco">
          <b>{t('Respostas que mais pesam')}</b>
          {x.drivers.slice(0, 4).map((d) => (
            <span key={d.campo} className="pc-pop-item"><a href={d.href}>{d.label}</a> <SourceTag origin={d.origem} label={rotuloOrigem(d.origem)} /></span>
          ))}
        </span>
      ) : null}
    </>
  );
}

/** Etiqueta de origem do número e o "de onde vem?" com origem, premissas e as ações "Ajustar premissas" e "Ir à pergunta". */
export function OrigemKpi({ s, id, origem, rotuloKpi, alinharAoFim }: { s: CasoStore; id: KpiOuSaida; origem: string; rotuloKpi: string; alinharAoFim?: boolean }) {
  const ir = driversDe(s, id)[0];
  return (
    <span className="pc-origem-kpi">
      <SourceTag origin={origem as any} label={rotuloOrigem(origem)} />
      <Popover
        title={rotuloKpi}
        alignEnd={alinharAoFim}
        actions={(
          <>
            <a href={href.refinar('premissas', String(id).startsWith('kpi.') ? String(id) : undefined)}>{t('Ajustar premissas')}</a>
            {ir ? <a href={ir.href}>{t('Ir à pergunta')}</a> : null}
            <a href={href.plano('apendice')}>{t('Ver premissas e fontes')}</a>
          </>
        )}
      >
        <ConteudoOrigem s={s} id={id} origem={origem} />
      </Popover>
    </span>
  );
}

// ----------------------------------------------------------- gráficos
function BarrasCamadas({ p }: { p: Painel }) {
  const total = p.camadas.reduce((a, c) => a + c.valor, 0);
  if (!(total > 0)) return null;
  const maior = [...p.camadas].sort((a, b) => b.valor - a.valor)[0];
  return (
    <LayerBars
      title={t('Custo por camada, {H} anos', { H: p.H })}
      items={p.camadas.filter((c) => c.valor > 0).map((c) => ({ layer: c.layer, label: nomeCamada(c.layer), value: c.valor, display: fmt.curto(c.valor) }))}
      conclusion={t('A maior parte do custo está em {c} ({pct} do total).', { c: minusc(nomeCamada(maior.layer)), pct: Math.round((100 * maior.valor) / total) + '%' })}
      caption={t('Sete camadas de Krueger e Jackson (2026). Custo econômico em valores constantes.')}
    />
  );
}

/** Colunas "Dotação a solicitar por exercício": barras em SVG, valores e anos em texto, cores pelas fases do Prumo. */
export function GraficoDotacao({ anos, dot }: { anos: number[]; dot: number[] }) {
  if (!anos.length) return null;
  const max = Math.max(1, ...dot);
  const dec = anos.length > 6 ? 0 : 1;
  const titulo = t('Dotação a solicitar por exercício');
  return (
    <figure className={'pc-grafico' + (anos.length > 6 ? ' pc-grafico--largo' : '')} id="sec-dotacao">
      <figcaption className="pc-grafico-titulo">{titulo} <span className="pc-nota">({unidMil()})</span></figcaption>
      <ol className="pc-colunas" style={{ gridTemplateColumns: `repeat(${anos.length}, minmax(${anos.length > 6 ? 44 : 0}px, 1fr))` }}>
        {anos.map((a, i) => {
          const h = Math.max(0, Math.min(100, ((dot[i] || 0) / max) * 100));
          return (
            <li key={a} className="pc-coluna" aria-label={`${tr('Ano ' + a)}: ${fmt.curto(dot[i] || 0)}`}>
              <span className="pc-coluna-valor" aria-hidden="true">{mil(dot[i] || 0, dec)}</span>
              <svg className={'pc-coluna-barra pc-coluna-barra--' + (a === 0 ? '0' : a === 1 ? '1' : 'n')} viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                <rect x="0" y={100 - h} width="10" height={h} />
              </svg>
              <span className="pc-coluna-ano" aria-hidden="true">{String(tr('Ano ' + a))}</span>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

// ----------------------------------------------------------- Em resumo
function TituloEditavel({ s, p }: { s: CasoStore; p: Painel }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState('');
  const abrir = () => { setValor(String(s.caso.titulo || s.ctx.olhando || '')); setEditando(true); };
  const salvar = () => { s.responder('titulo', valor.trim()); setEditando(false); };
  return (
    <>
      <h1 className="pc-plano-titulo">{p.titulo || t('Caso sem nome')}</h1>
      {editando ? (
        <form className="pc-titulo-form" onSubmit={(e) => { e.preventDefault(); salvar(); }} onKeyDown={(e) => { if (e.key === 'Escape') setEditando(false); }}>
          <TextField label={t('Título do caso')} value={valor} onChange={setValor} inputProps={{ autoFocus: true, maxLength: 120 }} />
          <div className="pc-botoes">
            <Button type="submit" size="sm">{t('Salvar')}</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setEditando(false)}>{t('Cancelar')}</Button>
          </div>
        </form>
      ) : (
        <p className="pc-titulo-editar"><Button type="button" variant="link" size="sm" onClick={abrir}>{t('Editar o título')}</Button></p>
      )}
    </>
  );
}

function SemNumeros({ p }: { p: Painel }) {
  return (
    <Alert kind="info" title={t('Ainda sem números')}>
      {t('Os números do plano aparecem quando você disser o tipo de tecnologia da ferramenta (pergunta 2.3.4).')}
      {p.paraNumero.length ? (
        <ul className="pc-faltam-numero">
          {p.paraNumero.map((f) => (
            <li key={f.campo}><a href={f.href}>{f.n} · {f.label}</a>{f.obrigatoria ? null : <span className="pc-nota"> · {t('deixa o número mais fiel')}</span>}</li>
          ))}
        </ul>
      ) : null}
    </Alert>
  );
}

/** O que saiu do topo de "Em resumo" (PB-06): recolhido em "Ver detalhes" no fim da página, aberto na impressão. */
function DetalhesResumo({ p, sum, origem }: { p: Painel; sum: SumarioPlano | null; origem: (kpi: string, rotulo: string, fim: boolean) => React.ReactNode }) {
  const imprimindo = useContext(ModoImpressao);
  const [aberto, setAberto] = useState(false);
  const L = p.lacunas;
  const P = sum ? sum.rec : null;
  const kTotal = p.kpis.find((z) => z.id === 'kpi.total');
  const comNumeros = p.temNumeros && !!sum && sum.numeros && !!sum.faixa;
  const mostra = aberto || imprimindo;
  return (
    <details className="pc-recolhe pc-resumo-det" id="sec-detalhes" open={mostra || undefined} onToggle={(e) => setAberto((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>{t('Ver detalhes')}<span className="pc-nota pc-resumo-det-nota">{t('nível de cuidado, governança, faixa de custo, indicadores, a proposta em seis respostas e o custo por fase')}</span></summary>
      {mostra ? (
        <div className="pc-recolhe-corpo pc-resumo-det-corpo">
          <p className="pc-lead">{R('sinteseAbre')}</p>
          {L.total ? (
            <Alert kind="info" title={tituloParcial(L)}>
              {textoLacunas(L)} {t('O plano já pode ser usado; o que depende dessas respostas usa premissas padrão.')} <a href={href.plano('faltam')}>{t('Ver o que falta')}</a>
            </Alert>
          ) : null}
          <AvisoCondicoes P={P} />
          <Cuidado P={P} />
          <Contadores P={P} />
          {comNumeros ? (
            <section className="pc-plano-sec" id="sec-faixa" aria-label={t('Faixa de custo e indicadores')}>
              <FaixaTco f={sum!.faixa!} rotulo={kTotal ? kTotal.label : sum!.faixa!.rotulo} origem={origem('kpi.total', sum!.faixa!.rotulo, false)} />
              <IndicadoresResumo L={sum!.indicadores} origem={origem} />
            </section>
          ) : null}
          {sum ? <SeisRespostas L={sum.exec} /> : null}
          <a href={href.plano('apendice')}>{t('Ver o perfil completo do caso')}</a>
          {comNumeros && sum ? (
            <section className="pc-plano-sec" id="sec-custo-resumo">
              <h2 className="pc-plano-h2">{R('custoT')}</h2>
              <p className="pc-nota">{R('custoAbre')}</p>
              {sum.ice ? <Iceberg ice={sum.ice} /> : null}
              <Direcionadores L={sum.drivers} />
            </section>
          ) : null}
          <ComoLer />
        </div>
      ) : null}
    </details>
  );
}

function Resumo({ s, p, sum, b }: { s: CasoStore; p: Painel; sum: SumarioPlano | null; b: BriefDados | null }) {
  const data = (b && b.data) || new Date().toLocaleDateString(LOC(), { year: 'numeric', month: 'long', day: 'numeric' });
  // "de onde vem?" dos números: o KPI do painel que os explica (origem e respostas que pesam)
  const origem = (kpi: string, rotulo: string, fim: boolean) => {
    const k = p.kpis.find((z) => z.id === kpi);
    return k ? <OrigemKpi s={s} id={kpi as KpiOuSaida} origem={k.origem} rotuloKpi={rotulo} alinharAoFim={fim} /> : null;
  };
  const P = sum ? sum.rec : null;
  const fatos = p.fatos;
  return (
    <>
      <header className="pc-plano-capa">
        <p className="pc-kicker">{p.temNumeros && p.premissas ? t('Plano de contratação · estimativa com {n} respostas a confirmar', { n: p.premissas }) : t('Plano de contratação')}</p>
        <TituloEditavel s={s} p={p} />
        {fatos ? <p className="pc-plano-fatos">{fatos}</p> : null}
        <p className="pc-nota">{t('Gerado em')} {data}{s.exemplo !== 'novo' ? ' · ' + t('Exemplo ilustrativo: as respostas não são de uma rede real.') : ''}</p>
      </header>
      {b ? <BriefRecomendacao b={b} verFazer={!!(P && P.nRecs)} /> : <VereditoResumo P={P} />}
      {b ? <CincoFrases b={b} /> : null}
      {p.temNumeros && b ? <TresNumeros b={b} origem={origem} /> : !p.temNumeros ? <SemNumeros p={p} /> : null}
      {b ? <LinhaEtapas b={b} /> : null}
      <CartoesBrief acoes={b ? b.acoes : []} P={P} rotulos={b ? b.rotulos : undefined} />
      <DetalhesResumo p={p} sum={sum} origem={origem} />
    </>
  );
}

// ----------------------------------------------------------- O que fazer
// 5.3: (1) Antes de decidir, responda; (2) Sequência de decisões; (3) Como testar e avaliar (A1 ampliada);
// (4) Plano de ação por pacote; (5) as listas do guia como referência, citando os R-nn sem repetir o texto.
function Fazer({ secs, achado, sum }: { secs: SecaoPlano[]; achado?: string; sum: SumarioPlano | null }) {
  const P = sum ? sum.rec : null;
  const a1 = secs.find((x) => x.id === 'A1' && !x.sub);
  const iA1 = secs.findIndex((x) => x.id === 'A1' && !x.sub);
  const subsA1 = secs.filter((x, i) => x.pagina === 'fazer' && x.sub && i > iA1 && i < secs.findIndex((y, j) => j > iA1 && !y.sub));
  const resto = secs.filter((x) => x.pagina === 'fazer' && x.id !== 'recs' && x !== a1 && !subsA1.includes(x));
  return (
    <>
      <Abertura titulo={t('O que fazer')} pergunta={R('q5')} achado={achado} intro={t('A próxima decisão, o que responder antes, os portões entre as etapas, como testar e avaliar e as ações deste caso por pacote. Cada ação tem o seu número (R-nn) e a pergunta que a originou: se mudar a resposta, a lista muda.')} />
      {P && P.veredito.texto ? <p className="pc-paragrafo"><b>{P.veredito.texto}</b></p> : null}
      {!P || !P.nRecs ? <Alert kind="info" title={t('Ainda não há respostas suficientes para recomendar ações.')} /> : null}
      <Pendencias P={P} />
      {P && P.nRecs ? <Sequencia P={P} /> : null}
      {a1 ? <Secao s={a1} extra={<TesteAvaliar T={(a1 as any).avaliacao} />} /> : null}
      {subsA1.map((x, j) => <Secao key={'a1' + j} s={x} />)}
      <PlanoAcao P={P} />
      <div className="pc-ref-bloco" id="sec-referencia">
        <h2 className="pc-plano-h2">{String(tr(TXT_REF))}</h2>
        {P ? <p className="pc-nota">{P.rotulos.refIntro}</p> : null}
      </div>
      {resto.map((x, j) => <Secao key={j} s={x} />)}
    </>
  );
}

// ----------------------------------------------------------- páginas com seções
/** Abertura de uma página do plano: a pergunta de decisão (etiqueta), o título, o achado em número e o parágrafo. */
function Abertura({ titulo, pergunta, achado, intro }: { titulo: string; pergunta?: string; achado?: string; intro?: string }) {
  return (
    <header className="pc-abertura">
      {pergunta ? <p className="pc-kicker">{pergunta}</p> : null}
      <h1 className="pc-plano-titulo">{titulo}</h1>
      {achado ? <p className="pc-achado">{achado}</p> : null}
      {intro ? <p className="pc-lead">{intro}</p> : null}
    </header>
  );
}

function Pagina({ titulo, pergunta, achado, intro, secs, pagina, extra, kpiOrigem }: {
  titulo: string; pergunta?: string; achado?: string; intro?: string; secs: SecaoPlano[]; pagina: string;
  /** conteúdo no fim de uma seção (pelo id) */
  extra?: Record<string, React.ReactNode>;
  kpiOrigem?: Record<string, (i: number, alinharAoFim: boolean) => React.ReactNode>;
}) {
  return (
    <>
      <Abertura titulo={titulo} pergunta={pergunta} achado={achado} intro={intro} />
      {secs.filter((x) => x.pagina === pagina && x.id !== 'faltas').map((x, j) => (
        <Secao key={j} s={x} extra={x.id && !x.sub ? extra?.[x.id] : undefined} kpiOrigem={x.id && !x.sub ? kpiOrigem?.[x.id] : undefined} />
      ))}
    </>
  );
}

function Faltam({ p, semTitulo }: { p: Painel; semTitulo?: boolean }) {
  const L = p.lacunas;
  const ess = L.itens.filter((i) => i.essencial), ref = L.itens.filter((i) => !i.essencial);
  const lista = (itens: typeof ess, inicio: number) => (
    <ol className="pc-faltam" start={inicio}>
      {itens.map((it) => (
        <li key={it.campo + it.n}>
          <a href={it.href}>{it.n} · {it.texto}</a>
          <span className="pc-nota"> · {it.capituloTitulo}</span>
        </li>
      ))}
    </ol>
  );
  return (
    <section className="pc-plano-sec" id="faltam">
      {!semTitulo ? <h2 className="pc-plano-h2">{t('Respostas que faltam')}</h2> : null}
      {!L.total ? <p className="pc-nota">{t('Todas as perguntas do Essencial estão respondidas.')}</p> : (
        <>
          <p className="pc-paragrafo"><b>{tituloParcial(L)}</b> {textoLacunas(L)}</p>
          <p className="pc-nota">{t('Enquanto uma pergunta não é respondida, o plano usa a premissa padrão ou a sugestão. Nada impede baixar o plano; estas são as respostas que mais o deixariam fiel à sua rede.')}</p>
          {ess.length ? (
            <>
              <h3 className="pc-secao-h3">{plural(ess.length, '{n} pergunta do Essencial', '{n} perguntas do Essencial')}</h3>
              {lista(ess, 1)}
            </>
          ) : null}
          {ref.length ? (
            <>
              <h3 className="pc-secao-h3">{t('{n} de refinamento', { n: ref.length })}</h3>
              <p className="pc-nota">{t('Estas perguntas ficam no modo Refinar; o plano usa a premissa padrão até você respondê-las.')}</p>
              {lista(ref, ess.length + 1)}
            </>
          ) : null}
        </>
      )}
    </section>
  );
}

// ----------------------------------------------------------- índice interno das páginas longas (PLA-08)
interface Entrada { id: string; label: string }

function rolarPara(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduz = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduz ? 'auto' : 'smooth', block: 'start' });
  const alvo = el.querySelector<HTMLElement>('h1, h2, h3') || el;
  if (!alvo.hasAttribute('tabindex')) alvo.setAttribute('tabindex', '-1');
  alvo.focus({ preventScroll: true });
}

function IndiceInterno({ entradas }: { entradas: Entrada[] }) {
  const [atual, setAtual] = useState('');
  const chave = entradas.map((e) => e.id).join('|');
  useEffect(() => {
    const ids = entradas.map((e) => e.id);
    const calcular = () => {
      let cur = ids[0] || '';
      for (const id of ids) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= 140) cur = id; }
      setAtual(cur);
    };
    calcular();
    window.addEventListener('scroll', calcular, { passive: true });
    return () => window.removeEventListener('scroll', calcular);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);
  if (entradas.length < 3) return null;
  return (
    <nav className="pc-plano-interno" aria-label={t('Nesta página')}>
      <span className="pc-plano-interno-rotulo">{t('Nesta página')}</span>
      {entradas.map((e) => (
        <button key={e.id} type="button" className="pc-plano-interno-link" aria-current={atual === e.id ? 'location' : undefined} onClick={() => rolarPara(e.id)}>{e.label}</button>
      ))}
    </nav>
  );
}

function entradasDe(pagina: PaginaPlano, secs: SecaoPlano[], p: Painel, sum?: SumarioPlano | null): Entrada[] {
  const L: Entrada[] = [];
  // PB-06: "Em resumo" é uma página curta, sem índice interno (o resto está em "Ver detalhes", no fim)
  if (pagina === 'resumo') return L;
  if (pagina === 'fazer') {
    const P = sum ? sum.rec : null;
    if (P) L.push({ id: 'sec-pend', label: P.rotulos.pendT });
    if (P && P.nRecs) L.push({ id: 'sec-sequencia', label: P.sequencia.titulo });
    L.push({ id: 'sec-A1', label: P ? P.teste.titulo : t('Como testar e avaliar') });
    if (P && P.plano.grupos.length) L.push({ id: 'sec-plano-acao', label: P.plano.titulo });
    L.push({ id: 'sec-referencia', label: String(tr(TXT_REF)) });
    return L;
  }
  if (pagina === 'custa' && p.temNumeros) L.push({ id: 'sec-dotacao', label: t('Dotação a solicitar por exercício') });
  secs.filter((x) => x.pagina === pagina && x.tipo !== 'bloco' && x.tipo !== 'faltas' && x.h && x.id !== 'recs').forEach((x) => {
    if (x.tipo === 'figura') { L.push({ id: 'sec-' + x.id, label: String(x.h) }); return; }
    if (x.sub && !(pagina === 'custa' && !x.det)) return;
    // em "Quanto custa", das subseções novas só o bloco "O que pode mudar o custo" entra no índice
    if (x.sub && ((x.pronto && !x.incerteza) || x.recolher)) return;
    L.push({ id: ancoraDe(x), label: String(x.h).replace(/^[AB]\d\.\s*/, '') });
  });
  if (pagina === 'apendice' && p.lacunas.total) L.push({ id: 'faltam', label: t('Respostas que faltam') });
  return L;
}

// ----------------------------------------------------------- a página
export function Plano({ pagina }: { pagina: PaginaPlano }) {
  const s = useCaso();
  const p = usePainel(s);
  const dados = useMemo(() => {
    sincronizar(s);
    const brutas = secoesPlano(s, { figura: figuraTCO });
    const secs = (brutas as any[]).map((x) => trSecao(x)) as SecaoPlano[];
    let pp: any = {};
    try { pp = painelPlano(s, secs as any); } catch (e) { pp = {}; }
    const sum = ((secs.find((x) => x.id === 'resumo' && !x.sub) as any) || {}).sumario as SumarioPlano | undefined;
    return { secs, sum: sum || null, graf: (pp.graf || null) as { anos: number[]; dot: number[] } | null };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.caso, s.ctx, s.resp, s.origem, s.custo, s.moeda, s.exemplo, s.lang, p]);
  const { secs, sum, graf } = dados;
  const brief = useBrief(s);
  const ach = (sum && sum.achados) || {};

  // Ctrl+P: o documento traz as cinco páginas, uma por folha, com tudo aberto (PLA-07)
  const [imprimindo, setImprimindo] = useState(false);
  useEffect(() => {
    const antes = () => flushSync(() => setImprimindo(true));
    const depois = () => setImprimindo(false);
    window.addEventListener('beforeprint', antes);
    window.addEventListener('afterprint', depois);
    return () => { window.removeEventListener('beforeprint', antes); window.removeEventListener('afterprint', depois); };
  }, []);

  const conta = (pg: string) => secs.filter((x) => x.pagina === pg && !x.sub && x.tipo !== 'bloco').length;
  const itens: PlanIndexItem[] = [
    { id: 'resumo', label: t('Em resumo'), href: href.plano('resumo'), active: pagina === 'resumo' },
    { id: 'custa', label: t('Quanto custa'), href: href.plano('custa'), active: pagina === 'custa', count: conta('custa') || undefined },
    { id: 'fazer', label: t('O que fazer'), href: href.plano('fazer'), count: p.recs.length || undefined, active: pagina === 'fazer' },
    { id: 'exigir', label: t('O que exigir'), href: href.plano('exigir'), active: pagina === 'exigir', count: conta('exigir') || undefined },
  ];
  const secundarios: PlanIndexItem[] = [
    { id: 'apendice', label: t('Apêndice'), href: href.plano('apendice'), active: pagina === 'apendice' },
    { id: 'faltam', label: t('Respostas que faltam'), href: href.plano('faltam'), count: p.lacunas.total || undefined, active: pagina === 'faltam' },
  ];
  const voltar = p.lacunas.itens.find((i) => i.essencial);

  // "de onde vem?" dos seis números de "Quanto custa": os quatro KPIs, o Ano 0 por participante e a saída
  const idsA2: KpiOuSaida[] = ['kpi.ano0', 'kpi.total', 'kpi.anual', 'kpi.porAluno', 'kpi.ano0', 'saida'];
  const origemA2 = (i: number, fim: boolean) => {
    const k = p.kpis[[0, 1, 2, 3, 0, 1][i]];
    return k && p.temNumeros ? <OrigemKpi s={s} id={idsA2[i]} origem={k.origem} rotuloKpi={String((secs.find((x) => x.id === 'A2' && !x.sub)?.kv || [])[i]?.[0] || k.label)} alinharAoFim={fim} /> : undefined;
  };
  const extraA2 = (
    <>
      {p.temNumeros ? <><BarrasCamadas p={p} />{graf ? <GraficoDotacao anos={graf.anos} dot={graf.dot} /> : null}</> : <a href={href.campo('tipoTec')}>{t('Ir à pergunta')}</a>}
    </>
  );

  const conteudo = (pg: PaginaPlano | 'faltam') => (
    pg === 'resumo' ? <Resumo s={s} p={p} sum={sum} b={brief} />
      : pg === 'fazer' ? <Fazer secs={secs} achado={ach.fazer} sum={sum} />
        : pg === 'custa' ? <Pagina titulo={t('Quanto custa')} pergunta={R('q2')} achado={p.temNumeros ? ach.custa : undefined} intro={R('i2')} secs={secs} pagina="custa" extra={{ A2: extraA2 }} kpiOrigem={{ A2: origemA2 }} />
          : pg === 'exigir' ? <Pagina titulo={t('O que exigir')} pergunta={R('q4')} achado={ach.exigir} intro={t('O que pedir na contratação: o arranjo de aquisição, as cláusulas de custo, dados e saída, a diligência proporcional ao risco e os documentos do dossiê.')} secs={secs} pagina="exigir" />
            : pg === 'apendice' ? <><Pagina titulo={t('Apêndice')} intro={R('anexosAbre')} secs={secs} pagina="apendice" /><Faltam p={p} /></>
              : <><h1 className="pc-plano-titulo">{t('Respostas que faltam')}</h1><Faltam p={p} semTitulo /></>
  );

  return (
    <Shell nav={false} plano={false} contexto={t('Plano de contratação')}>
      <ModoImpressao.Provider value={imprimindo}>
        <div className="pc-plano-pagina">
          <PlanIndex zoneLabel={t('Neste plano')} items={itens} secondary={secundarios} />
          <div className="pc-plano-conteudo">
            <div className="pc-botoes pc-plano-acoes">
              <Button variant="secondary" size="sm" href={voltar ? voltar.href : href.abertura(1)}>
                {voltar ? t('Voltar às perguntas · {n} faltam', { n: p.lacunas.essencial }) : t('Rever as respostas')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { void exportarCaso(); }}>{t('Exportar caso')}</Button>
              <BotoesPDF s={s} />
            </div>
            {imprimindo ? null : <IndiceInterno key={pagina} entradas={entradasDe(pagina, secs, p, sum)} />}
            {imprimindo
              ? PAGINAS.map((pg) => <div key={pg} className="pc-folha">{conteudo(pg)}</div>)
              : conteudo(pagina)}
            <nav className="pc-plano-proxima" aria-label={t('Páginas do plano')}>
              {PAGINAS.filter((x) => x !== pagina).map((x) => (
                <a key={x} href={href.plano(x)}>{t(TITULO_PAGINA[x])}</a>
              ))}
            </nav>
            <Rodape />
          </div>
        </div>
      </ModoImpressao.Provider>
    </Shell>
  );
}
