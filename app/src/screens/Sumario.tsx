// Sumário executivo de "Em resumo" (REL-01 a REL-06, REL-16; porte de htmlSinteseP da 0.0.15-rc.1): o custo total com a
// faixa P10–P90 (R6: com o P50 "valor para orçar" e o P90 "teto prudente" ao lado do cenário-base), os indicadores com
// o nome de cada denominador, a proposta em seis respostas, os três maiores direcionadores e "Como ler este plano".
// R6: o veredito, o nível de cuidado, os contadores e os 5 cartões ficam em PlanoRec.tsx (dados em `sumario.rec`).
// Os dados vêm de plano/relatorio.js pela seção "resumo" (`sumario`), os mesmos do PDF do anexo técnico.
// PB-06: o topo de "Em resumo" espelha a página 1 do policy brief (plano/brief.js:briefDados): a recomendação
// (BriefRecomendacao), as cinco frases (CincoFrases), os três números (TresNumeros) e as quatro etapas (LinhaEtapas).
import { useContext, type ReactNode } from 'react';
import { KpiTile, useMediaQuery } from '../ui';
import { t } from '../percurso/textos';
import { href } from '../percurso/rota';
import { R } from '../plano/relatorio.js';
import { ModoImpressao } from './Secao';
import { ORDEM_FRASES, KPI_DO_NUMERO, hrefFalta, anosTxt, type BriefDados } from './brief';
import './plano.css';
import './plano-rec.css';
import './plano-brief.css';

export interface FaixaTCO {
  rotulo: string; centralTxt: string; faixaTxt: string; nota: string; alt: string; pLo: number; pHi: number; pCentral: number;
  p50Rot?: string; p90Rot?: string; p50DeltaTxt?: string; aviso?: string; notaEstresse?: string;
}
export interface IndicadorResumo { id: string; kpi: string; rotulo: string; valor: string; cheio?: string; nota?: string }
export interface Resposta6 { id: string; rot: string; perg: string; frases: string[]; falta: string; campo: string }
export interface AcaoResumo {
  n: number; id: string; tipo: string; prioridade: string; nPergunta: string; tipoTxt: string; quandoRot: string;
  oque: string; porque: string; origem: string; paraque: string; como: string; quem: string; quandoTxt: string;
}
export interface Direcionador { id: string; nome: string; faixa: string; loTxt: string; hiTxt: string; txt: string; w: number }
export interface SumarioPlano {
  numeros: boolean; faixa: FaixaTCO | null; indicadores: IndicadorResumo[]; exec: Resposta6[]; acoes: AcaoResumo[]; nRecs: number;
  ice: any; drivers: Direcionador[]; achados: Record<string, string>;
  /** R6: recomendações no relatório (plano/recplano.js:planoRec), já traduzidas */
  rec: any;
}
type Origem = (kpi: string, rotulo: string, alinharAoFim: boolean) => ReactNode;

// ----------------------------------------------------------- página 1 do brief (PB-06)
/** A recomendação do brief em uma frase, com o porquê; a cor da borda segue o veredito interno. */
export function BriefRecomendacao({ b, verFazer }: { b: BriefDados; verFazer?: boolean }) {
  return (
    <div className={'pc-callout pc-veredito pc-brief-rec pc-veredito--' + (b.recomendacao.codigo || 'sem')} id="sec-veredito">
      <span className="pc-callout-rotulo">{(b.rotulos && b.rotulos.recomendacao) || t('Recomendação')}</span>
      <span className="pc-veredito-texto">{b.recomendacao.texto}</span>
      {b.recomendacao.porque ? <span className="pc-nota">{b.recomendacao.porque}</span> : null}
      {verFazer ? <a className="pc-callout-link" href={href.plano('fazer')}>{t('Ver a sequência de decisões e o plano de ação')}</a> : null}
    </div>
  );
}

/** As cinco frases do resumo executivo (contexto, teste, implantação, expansão e custo), com "Responder" quando falta. */
export function CincoFrases({ b }: { b: BriefDados }) {
  const frases = ORDEM_FRASES.map((id) => [id, b.frases[id]] as const).filter(([, f]) => f && f.texto);
  if (!frases.length) return null;
  return (
    <section className="pc-plano-sec" id="sec-frases" aria-label={(b.rotulos && b.rotulos.resumoExec) || t('Resumo executivo')}>
      <dl className="pc-frases">
        {frases.map(([id, f]) => (
          <div key={id} className="pc-frase" data-frase={id}>
            <dt>{f!.rotulo}</dt>
            <dd>
              {f!.texto}
              {f!.falta ? <> <a className="pc-frase-ir" href={hrefFalta(f!.falta.ir)} aria-label={t('Responder') + ': ' + [f!.falta.n, f!.falta.pergunta].filter(Boolean).join(' ')}>{t('Responder')}</a></> : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Os três números do brief: custo total com a faixa, custo do Ano 0 e custo anual em regime. */
export function TresNumeros({ b, origem }: { b: BriefDados; origem?: Origem }) {
  if (!b.numeros || !b.numeros.length) return null;
  return (
    <section className="pc-plano-sec" id="sec-numeros" aria-label={(b.rotulos && b.rotulos.numeros) || t('Os números principais')}>
      <div className="pc-kpis pc-brief-numeros">
        {b.numeros.map((k, i) => (
          <div key={k.id} className="pc-brief-numero" data-numero={k.id}>
            <KpiTile label={k.rotulo} value={k.valor} origin={origem ? origem(KPI_DO_NUMERO[k.id] || 'kpi.total', k.rotulo, i > 0) : undefined} />
            {k.nota ? <p className="pc-nota">{k.nota}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

/** A linha do tempo das quatro etapas, com os anos e o custo de cada uma. */
export function LinhaEtapas({ b }: { b: BriefDados }) {
  if (!b.etapas || !b.etapas.length) return null;
  return (
    <section className="pc-plano-sec" id="sec-etapas">
      <h2 className="pc-plano-h2">{(b.rotulos && b.rotulos.etapas) || t('As quatro etapas e o custo de cada uma')}</h2>
      <ol className="pc-etapas">
        {b.etapas.map((e, i) => (
          <li key={e.id} className={'pc-etapa pc-etapa--' + Math.min(4, i + 1)} data-etapa={e.id}>
            <span className="pc-etapa-nome">{e.nome}</span>
            {anosTxt(e.anos) ? <span className="pc-etapa-anos">{anosTxt(e.anos)}</span> : null}
            {e.custoTxt ? <span className="pc-etapa-custo">{e.custoTxt}</span> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** O custo total com a faixa provável: frase, barra com a faixa e o marcador do valor central, nota de leitura. */
export function FaixaTco({ f, rotulo, origem }: { f: FaixaTCO; rotulo: string; origem?: ReactNode }) {
  return (
    <div className="pc-tco">
      <span className="pc-tco-rotulo">{rotulo}</span>
      <span className="pc-tco-valor">{f.centralTxt} <span className="pc-tco-base">({t('cenário-base')})</span></span>
      {f.p50Rot ? <p className="pc-tco-rotulos"><b>{f.p50Rot}</b><span>{f.p90Rot}</span></p> : null}
      <span className="pc-tco-faixa">{f.faixaTxt}</span>
      <div className="pc-tco-barra" role="img" aria-label={f.alt}>
        <i className="pc-tco-barra-faixa" style={{ insetInlineStart: f.pLo.toFixed(2) + '%', inlineSize: Math.max(0.5, f.pHi - f.pLo).toFixed(2) + '%' }} />
        <b className="pc-tco-barra-central" style={{ insetInlineStart: f.pCentral.toFixed(2) + '%' }} />
      </div>
      <p className="pc-nota">{f.nota}</p>
      {origem ? <div className="pc-tco-origem">{origem}</div> : null}
    </div>
  );
}

export function IndicadoresResumo({ L, origem }: { L: IndicadorResumo[]; origem?: Origem }) {
  const estreito = useMediaQuery('(max-width: 900px)');
  const cols = estreito ? 2 : Math.min(4, L.length);
  return (
    <div className="pc-kpis pc-kpis--ind">
      {L.map((k, i) => (
        <div key={k.id} className="pc-ind" data-k={k.id}>
          <KpiTile label={k.rotulo} value={k.valor} fullValue={k.cheio} origin={origem ? origem(k.kpi, k.rotulo, i % cols >= cols / 2) : undefined} />
          {k.nota ? <p className="pc-nota pc-ind-nota">{k.nota}</p> : null}
        </div>
      ))}
    </div>
  );
}

/** "A proposta em seis respostas": uma ficha por dimensão; sem dados, "Ainda sem resposta" com o link para responder. */
export function SeisRespostas({ L }: { L: Resposta6[] }) {
  if (!L.length) return null;
  return (
    <section className="pc-plano-sec" id="sec-seis">
      <h2 className="pc-plano-h2">{R('exT')}</h2>
      <dl className="pc-seis">
        {L.map((x) => (
          <div key={x.id} className="pc-seis-linha" data-dim={x.id}>
            <dt><b>{x.rot}</b><span className="pc-nota">{x.perg}</span></dt>
            <dd>
              {x.frases.length > 1 ? <ul className="pc-lista">{x.frases.map((f, i) => <li key={i}>{f}</li>)}</ul>
                : x.frases.length ? <p className="pc-paragrafo">{x.frases[0]}</p>
                  : <p className="pc-nota">{x.falta} <a href={href.campo(x.campo)}>{t('Responder')}</a></p>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Os três direcionadores que mais movem o custo total (do tornado), com a faixa e uma barra relativa. */
export function Direcionadores({ L }: { L: Direcionador[] }) {
  if (!L.length) return null;
  return (
    <div className="pc-dir-bloco">
      <h3 className="pc-secao-h3">{R('direcionadores')}</h3>
      <ol className="pc-dir">
        {L.map((x) => (
          <li key={x.id} className="pc-dir-item">
            <span className="pc-dir-nome"><b>{x.nome}</b> <span className="pc-nota">{x.faixa}</span></span>
            <span className="pc-dir-barra" aria-hidden="true"><i style={{ inlineSize: Math.max(2, 100 * x.w).toFixed(1) + '%' }} /></span>
            <span className="pc-dir-txt">{x.txt.charAt(0).toUpperCase() + x.txt.slice(1)}.</span>
          </li>
        ))}
      </ol>
      <a href={href.plano('custa')}>{t('Ver cenários, direcionadores e simulação em “Quanto custa”')}</a>
    </div>
  );
}

/** "Como ler este plano" (REL-16): recolhido na página, aberto na impressão. */
export function ComoLer() {
  const imprimindo = useContext(ModoImpressao);
  return (
    <details className="pc-recolhe pc-comoler" open={imprimindo || undefined}>
      <summary>{R('comoLer')}</summary>
      <ul className="pc-lista pc-recolhe-corpo">
        {['comoLer2', 'comoLer3', 'comoLer5'].map((k) => <li key={k}>{R(k)}</li>)}
      </ul>
    </details>
  );
}
