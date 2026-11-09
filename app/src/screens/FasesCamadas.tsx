// v018: o mapa das quatro fases da página inicial da 0.0.14, de volta: para cada fase, os passos, as camadas do custo
// total que ela alimenta (células da MATRIZ com perguntas nessa fase), o que a pessoa recebe e, ao clicar, o resumo da
// fase com o que ela exige em cada camada. Embaixo, a legenda das sete camadas (Krueger e Jackson, 2026) e o botão da
// matriz camadas × fases. Fonte única dos dados: domain/fluxo_dados.js e domain/matriz.js.
import { Fragment, useState } from 'react';
import { FASES, PASSOS, PASSO_INFO, CAMADAS, MATRIZ, CREDITO_MATRIZ, numPergunta } from '../domain';
import { Button } from '../ui';
import { abrirMatriz } from './Matriz';
import { t } from '../percurso/textos';
import './fasesCamadas.css';

type Celula = { t: string; q: string[]; na?: boolean };
const MTZ = MATRIZ as unknown as Record<number, Record<string, Celula>>;
const CAM = CAMADAS as unknown as [number, string][];
const FAS = FASES as unknown as { id: string; n: number; nome: string; abertura?: string }[];
const PAS = PASSOS as unknown as Record<string, [string, string][]>;
const PINFO = PASSO_INFO as unknown as Record<string, { num?: string }>;

/** O que a pessoa recebe ao fim de cada fase (0.0.14, RQ-01). */
const RESULTADO_FASE: Record<string, string> = {
  contexto: 'Perfil da rede, prioridades, problemas e objetivos; diagnóstico de governança.',
  piloto: 'Tamanho e custo do teste (Ano 0) e o que ele exige em cada camada.',
  implantacao: 'Primeira etapa de uso real, arquitetura e custo do Ano 1.',
  expansao: 'Custo de todo o ciclo, recomendações para você e o plano de contratação em PDF.',
};

/** Camadas que a fase alimenta: células da matriz com perguntas nessa fase. */
const camadasDaFase = (fid: string) => CAM.filter(([k]) => { const c = MTZ[k]?.[fid]; return c && !c.na && (c.q || []).length; }).map(([k]) => k);

/** Números das perguntas de uma célula, com as sequências agrupadas (1.3.1–1.3.6). */
function numerosCelula(ids: string[]): string[] {
  const ns = [...new Set((ids || []).map((id) => String(numPergunta(id) || '')).filter(Boolean))];
  const ch = (n: string) => n.split('.').map((x) => +x || 0);
  ns.sort((a, b) => { const x = ch(a), y = ch(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; });
  const out: string[] = []; let ini: string | null = null, ant: string | null = null;
  const fecha = () => { if (ini) out.push(ini === ant ? ini : ini + '–' + ant); };
  for (const n of ns) {
    const p = ch(n), q = ant ? ch(ant) : null;
    const seguido = q && p.length === q.length && p.slice(0, -1).join('.') === q.slice(0, -1).join('.') && p[p.length - 1] === q[q.length - 1] + 1;
    if (seguido) ant = n; else { fecha(); ini = ant = n; }
  }
  fecha();
  return out;
}

const Chevron = () => <svg className="ini-chev" aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 20 20"><path d="M5.3 7.3 10 12l4.7-4.7 1.4 1.4L10 14.8 3.9 8.7l1.4-1.4Z" fill="currentColor" /></svg>;
const Grade = () => <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 20 20"><path d="M2 3h16v14H2V3Zm1.6 1.6v3h3.6v-3H3.6Zm5.2 0v3h3.6v-3H8.8Zm5.2 0v3h2.4v-3H14Zm-10.4 4.6v3h3.6v-3H3.6Zm5.2 0v3h3.6v-3H8.8Zm5.2 0v3h2.4v-3H14Zm-10.4 4.6v2.2h3.6v-2.2H3.6Zm5.2 0v2.2h3.6v-2.2H8.8Zm5.2 0v2.2h2.4v-2.2H14Z" fill="currentColor" /></svg>;

function BotaoMatriz({ fase }: { fase?: string }) {
  return <div className="ini-mapa-pe">
    <Button variant="secondary" className="ini-vm" icon={<Grade />} onClick={() => abrirMatriz(fase)} aria-haspopup="dialog">{t('Ver a matriz completa')}</Button>
    <p className="ini-cred">{t(String(CREDITO_MATRIZ))}</p>
  </div>;
}

export function FasesCamadas() {
  const [aberta, setAberta] = useState('');
  const alternar = (id: string) => setAberta((a) => (a === id ? '' : id));
  return (
    <section className="pc-fases-mapa ini-mapa" aria-labelledby="ini-mapa-t">
      <div className="ini-mapa-cab">
        <p className="ini-kicker"><span>{t('Como funciona')}</span></p>
        <h2 id="ini-mapa-t">{t('Do contexto ao plano de contratação, em quatro fases')}</h2>
        <p className="ini-mapa-sub">{t('Clique numa fase para ver o que ela pede em cada camada do custo total.')}</p>
      </div>
      <div className="ini-fases">
        {FAS.map((f) => {
          const ab = aberta === f.id;
          return <Fragment key={f.id}>
            <article className={'ini-f f' + f.n + (ab ? ' aberta' : '')} onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) alternar(f.id); }}>
              <h3 className="ini-f-h">
                <button type="button" className="ini-f-b" aria-expanded={ab} aria-controls={'ini-p-' + f.id} onClick={() => alternar(f.id)}>
                  <span className="ini-f-n" aria-hidden="true">{f.n}</span>
                  <span className="ini-f-tt"><span className="ini-f-fase">{t('Fase {n}', { n: f.n })}</span><span className="ini-f-nome">{t(f.nome)}</span></span>
                  <Chevron />
                </button>
              </h3>
              <div className="ini-f-corpo">
                <div className="ini-f-bl"><p className="ini-f-l">{t('Passos')}</p>
                  <ol className="ini-passos">{(PAS[f.id] || []).map(([id, nome]) => <li key={id}><span className="ini-pn">{PINFO[id]?.num || ''}</span><span className="ini-pt">{t(nome)}</span></li>)}</ol></div>
                <div className="ini-f-bl"><p className="ini-f-l">{t('Camadas que alimenta')}</p>
                  <ul className="ini-cams">{camadasDaFase(f.id).map((k) => <li key={k} className={'cam-' + k} title={t(CAM[k - 1][1])}><span className="ini-cn" aria-hidden="true">{k}</span><span className="pc-sr">{t(CAM[k - 1][1])}</span></li>)}</ul></div>
                <div className="ini-f-res"><p className="ini-f-l">{t('O que você recebe')}</p><p>{t(RESULTADO_FASE[f.id] || '')}</p></div>
                <p className="ini-f-mais" aria-hidden="true"><span>{t(ab ? 'Fechar o resumo' : 'Ver o resumo da fase')}</span></p>
              </div>
            </article>
            {ab ? <div className={'ini-p f' + f.n} id={'ini-p-' + f.id} role="region" aria-labelledby={'ini-pt-' + f.id}>
              <div className="ini-p-cab">
                <span className="ini-f-n" aria-hidden="true">{f.n}</span>
                <div className="ini-p-tt"><p className="ini-p-e">{t('Fase {n}', { n: f.n })}</p><h3 id={'ini-pt-' + f.id}>{t(f.nome)}</h3></div>
                <Button variant="secondary" size="sm" className="ini-p-x" onClick={() => setAberta('')}>{t('Fechar o resumo')}</Button>
              </div>
              {f.abertura ? <p className="ini-p-ab">{t(f.abertura)}</p> : null}
              <p className="ini-p-l">{t('O que esta fase exige, por camada')}</p>
              <ol className="ini-cels">{CAM.map(([k, nome]) => {
                const cel = MTZ[k]?.[f.id]; if (!cel) return null;
                const ns = numerosCelula(cel.q);
                return <li key={k} className={'ini-cel cam-' + k + (cel.na ? ' na' : '')}><span className="ini-cn" aria-hidden="true">{k}</span>
                  <div className="ini-cel-c"><p className="ini-cel-n"><span className="pc-sr">{t('Camada {n}:', { n: k })} </span><span>{t(nome)}</span></p>
                    <p className="ini-cel-t">{t(cel.t)}</p>
                    {ns.length ? <p className="ini-q"><span className="ini-q-l">{t('Perguntas')}</span> <span className="ini-q-n">{ns.join(' · ')}</span></p> : null}</div></li>;
              })}</ol>
              <BotaoMatriz fase={f.id} />
            </div> : null}
          </Fragment>;
        })}
      </div>
      <div className="ini-leg">
        <p className="ini-leg-t">{t('As sete camadas do custo total')}</p>
        <ol className="ini-leg-l">{CAM.map(([k, nome]) => <li key={k} className={'cam-' + k}><span className="ini-cn" aria-hidden="true">{k}</span><span>{t(nome)}</span></li>)}</ol>
      </div>
      <BotaoMatriz />
    </section>
  );
}
