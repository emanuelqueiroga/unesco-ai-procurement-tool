// v018 (proposta, versão enxuta): "Como funciona" da página inicial numa peça só, no lugar do mapa das fases, do diagrama
// do modelo de custo e do "Como funciona" recolhido. Mostra o caminho como ele é hoje: país, instituição e prioridade em
// comum; depois, dois caminhos. Só "Governando a IA na educação": contexto, categorias de custo, opções e o plano de
// governança. Qualquer outra prioridade ou combinação: os quatro capítulos da 0.0.14. Cada capítulo mostra o essencial
// (telas, camadas que alimenta, o que entrega); os passos e o que a fase exige em cada camada abrem ao clicar. Embaixo,
// as sete camadas (Krueger e Jackson, 2026) e o botão da matriz.
import { useState } from 'react';
import { FASES, PASSOS, PASSO_INFO, CAMADAS, MATRIZ, CREDITO_MATRIZ, FIG_INFO, numPergunta, tr } from '../domain';
import { ESSENCIAL, type Capitulo } from '../store';
import { Button } from '../ui';
import { abrirMatriz, abrirFigura } from './Matriz';
import figuraTCO from '../../../assets/fig1_tco.jpg';
import { CAPITULOS_INFO, t } from '../percurso/textos';
import { CATEGORIAS, DESAFIOS_GOV_V016 } from '../domain/catalogo_v016.js';
import './fasesCamadas.css';

type Celula = { t: string; q: string[]; na?: boolean };
const MTZ = MATRIZ as unknown as Record<number, Record<string, Celula>>;
const CAM = CAMADAS as unknown as [number, string][];
const FAS = FASES as unknown as { id: string; n: number; nome: string; abertura?: string }[];
const PAS = PASSOS as unknown as Record<string, [string, string][]>;
const PINFO = PASSO_INFO as unknown as Record<string, { num?: string }>;

/** O que cada capítulo do caminho da 0.0.14 entrega, em poucas palavras. */
const ENTREGA: Record<string, string> = {
  contexto: 'Perfil da rede e diagnóstico de governança',
  piloto: 'Custo do teste (Ano 0)',
  implantacao: 'Custo do primeiro ano',
  expansao: 'Custo do ciclo, recomendações e PDF',
};
const SO_REFINAR = new Set(['3b']);
const RESULTADO = new Set(['4b', '4c']);
const ETAPAS_GOV = ['Contexto', 'Categorias de custo', 'Opções e valores'];
/** Camadas do custo total que cada categoria da governança alimenta (elaboração desta ferramenta, como a distribuição
 *  da matriz): regulação, sandboxes, diretrizes e coordenação na camada 1; proteção de dados e cibersegurança na 5;
 *  dados e interoperabilidade na 4; hospedagem na 3; independência tecnológica nas 2 e 7; pessoas e formação na 6. */
const CAMADAS_GOV: Record<string, number[]> = { g11: [1, 5], g12: [1], g13: [1, 5], g21: [4, 5], g22: [3], g23: [2, 7], g31: [6], g32: [6], g33: [1] };
const CATS_GOV = (CATEGORIAS as any).governanca as { id: string; n: string; desafio: string; nome: string }[];
const DES_GOV = DESAFIOS_GOV_V016 as unknown as { id: string; t?: string; nome?: string }[];
const nomeDesafio = (d: { t?: string; nome?: string }) => d.nome || d.t || '';
const camadasGov = [...new Set(Object.values(CAMADAS_GOV).flat())].sort();

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

const Chevron = () => <svg className="ini-chev" aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 20 20"><path d="M5.3 7.3 10 12l4.7-4.7 1.4 1.4L10 14.8 3.9 8.7l1.4-1.4Z" fill="currentColor" /></svg>;
const Grade = () => <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 20 20"><path d="M2 3h16v14H2V3Zm1.6 1.6v3h3.6v-3H3.6Zm5.2 0v3h3.6v-3H8.8Zm5.2 0v3h2.4v-3H14Zm-10.4 4.6v3h3.6v-3H3.6Zm5.2 0v3h3.6v-3H8.8Zm5.2 0v3h2.4v-3H14Zm-10.4 4.6v2.2h3.6v-2.2H3.6Zm5.2 0v2.2h3.6v-2.2H8.8Zm5.2 0v2.2h2.4v-2.2H14Z" fill="currentColor" /></svg>;
const Cams = ({ ks }: { ks: number[] }) => <ul className="ini-cams cf-cams">{ks.map((k) => <li key={k} className={'cam-' + k} title={t(CAM[k - 1][1])}><span className="ini-cn" aria-hidden="true">{k}</span><span className="pc-sr">{t(CAM[k - 1][1])}</span></li>)}</ul>;

export function FasesCamadas() {
  const [aberta, setAberta] = useState('');
  const alternar = (id: string) => setAberta((a) => (a === id ? '' : id));
  const fase = FAS.find((f) => f.id === aberta);
  return (
    <section className="pc-fases-mapa cf" aria-labelledby="cf-t">
      <div className="cf-cab">
        <p className="ini-kicker"><span>{t('Como funciona')}</span></p>
        <h2 id="cf-t">{t('Dois caminhos, conforme a prioridade')}</h2>
        <p className="cf-sub">{t('Todo plano começa pelo país, pela instituição e pela prioridade. Depois, o caminho muda.')}</p>
      </div>

      <div className="cf-trilha cf-gov">
        <p className="cf-quando"><span>{t('Só')}</span> {t('Governando a IA na educação')}</p>
        <ol className="cf-passos">
          {ETAPAS_GOV.map((e, i) => <li key={e}><span className="cf-n" aria-hidden="true">{i + 1}</span>{t(e)}</li>)}
          <li className="cf-fim">{t('Plano de governança, resumo e anexo em PDF')}</li>
        </ol>
        <div className="cf-gov-cam">
          <span className="cf-gov-l">{t('Camadas que alimenta')}</span><Cams ks={camadasGov} />
          <button type="button" className="cf-link" aria-expanded={aberta === 'gov'} aria-controls="cf-painel-gov" onClick={() => alternar('gov')}>{t(aberta === 'gov' ? 'Fechar' : 'Ver por categoria')}<Chevron /></button>
        </div>
        {aberta === 'gov' ? <div className="cf-painel cf-painel-gov" id="cf-painel-gov" role="region" aria-labelledby="cf-gov-t">
          <div className="cf-painel-cab"><h3 id="cf-gov-t">{t('Categorias de custo da governança e as camadas que alimentam')}</h3></div>
          <div className="cf-gov-grade">{DES_GOV.map((d) => <div key={d.id}>
            <p className="ini-f-l">{t(nomeDesafio(d))}</p>
            <ul className="cf-gov-cats">{CATS_GOV.filter((c) => c.desafio === d.id).map((c) => <li key={c.id}>
              <span className="cf-gov-cat"><span className="cf-gov-n">{c.n}</span>{t(c.nome)}</span><Cams ks={CAMADAS_GOV[c.id] || []} /></li>)}</ul>
          </div>)}</div>
          <p className="ini-cred">{t('Ligação entre categorias e camadas: elaboração desta ferramenta.')}</p>
        </div> : null}
      </div>

      <div className="cf-trilha cf-ed">
        <p className="cf-quando"><span>{t('Com')}</span> {t('Educando sobre a IA ou Educando com e sem IA')}</p>
        <ol className="cf-caps">
          {FAS.map((f) => {
            const ab = aberta === f.id, cap = CAPITULOS_INFO[f.n as Capitulo];
            const n = ESSENCIAL.filter((x) => x.capitulo === f.n && !['local', 'prioridades'].includes(x.id)).length;
            return <li key={f.id} className={'cf-cap f' + f.n + (ab ? ' aberta' : '')}>
              <button type="button" className="cf-cap-b" aria-expanded={ab} aria-controls="cf-painel" onClick={() => alternar(f.id)}>
                <span className="cf-cap-cab"><span className="cf-cap-n" aria-hidden="true">{f.n}</span><span className="cf-cap-nome">{t(cap.titulo)}</span><Chevron /></span>
                <span className="cf-cap-fase">{t(f.nome)} · {n === 1 ? t('1 tela') : t('{n} telas', { n })}</span>
              </button>
              <div className="cf-cap-corpo">
                <Cams ks={camadasDaFase(f.id)} />
                <p className="cf-cap-rec">{t(ENTREGA[f.id])}</p>
              </div>
            </li>;
          })}
        </ol>
        {fase ? <div className={'cf-painel f' + fase.n} id="cf-painel" role="region" aria-labelledby="cf-painel-t">
          <div className="cf-painel-cab">
            <h3 id="cf-painel-t">{fase.n}. {t(CAPITULOS_INFO[fase.n as Capitulo].titulo)}</h3>
            <Button variant="secondary" size="sm" onClick={() => setAberta('')}>{t('Fechar o resumo')}</Button>
          </div>
          {fase.abertura ? <p className="ini-p-ab">{t(fase.abertura)}</p> : null}
          <div className="cf-painel-grade">
            <div><p className="ini-f-l">{t('Passos')}</p>
              <ol className="ini-passos">{(PAS[fase.id] || []).filter(([id]) => !RESULTADO.has(id)).map(([id, nome]) => <li key={id}><span className="ini-pn">{PINFO[id]?.num || ''}</span><span className="ini-pt">{t(nome)}{SO_REFINAR.has(id) ? <em className="cf-ref"> {t('(no modo Refinar)')}</em> : null}</span></li>)}</ol></div>
            <div><p className="ini-f-l">{t('O que esta fase exige, por camada')}</p>
              <ol className="ini-cels">{CAM.map(([k, nome]) => {
                const cel = MTZ[k]?.[fase.id]; if (!cel || cel.na) return null;
                const ns = numerosCelula(cel.q);
                return <li key={k} className={'ini-cel cam-' + k}><span className="ini-cn" aria-hidden="true">{k}</span>
                  <div className="ini-cel-c"><p className="ini-cel-n">{t(nome)}</p><p className="ini-cel-t">{t(cel.t)}</p>
                    {ns.length ? <p className="ini-q"><span className="ini-q-l">{t('Perguntas')}</span> <span className="ini-q-n">{ns.join(' · ')}</span></p> : null}</div></li>;
              })}</ol></div>
          </div>
        </div> : null}
      </div>

      <div className="cf-leg">
        <div className="cf-leg-txt">
          <p className="ini-leg-t">{t('As sete camadas do custo total')}</p>
          <ol className="cf-leg-l">{CAM.map(([k, nome]) => <li key={k} className={'cam-' + k}><span className="ini-cn" aria-hidden="true">{k}</span><span>{t(nome)}</span></li>)}</ol>
          <div className="cf-leg-pe">
            <Button variant="secondary" size="sm" icon={<Grade />} onClick={() => abrirMatriz(aberta && aberta !== 'gov' ? aberta : undefined)} aria-haspopup="dialog">{t('Ver a matriz completa')}</Button>
            <Button variant="secondary" size="sm" onClick={abrirFigura} aria-haspopup="dialog">{String(tr((FIG_INFO as any).botao))}</Button>
            <span className="ini-cred">{t(String(CREDITO_MATRIZ))}</span>
          </div>
        </div>
        <button type="button" className="cf-fig" onClick={abrirFigura} aria-haspopup="dialog" aria-label={String(tr((FIG_INFO as any).botao))}>
          <img src={figuraTCO} alt="" loading="lazy" width={900} height={1225} />
          <span>{t('Figura original: Krueger e Jackson (2026, p. 11)')}</span>
        </button>
      </div>
    </section>
  );
}
