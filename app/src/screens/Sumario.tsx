// Sumário executivo de "Em resumo" (REL-01 a REL-06, REL-16; porte de htmlSinteseP da 0.0.15-rc.1): o custo total com a
// faixa P10–P90 (R6: com o P50 "valor para orçar" e o P90 "teto prudente" ao lado do cenário-base), os indicadores com
// o nome de cada denominador, a proposta em seis respostas, os três maiores direcionadores e "Como ler este plano".
// R6: o veredito, o nível de cuidado, os contadores e os 5 cartões ficam em PlanoRec.tsx (dados em `sumario.rec`).
// Os dados vêm de plano/relatorio.js pela seção "resumo" (`sumario`), os mesmos do PDF.
import { useContext, type ReactNode } from 'react';
import { KpiTile, useMediaQuery } from '../ui';
import { t } from '../percurso/textos';
import { href } from '../percurso/rota';
import { R } from '../plano/relatorio.js';
import { ModoImpressao } from './Secao';
import './plano.css';
import './plano-rec.css';

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
