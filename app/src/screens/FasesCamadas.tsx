// v018 (proposta): "Como funciona" da página inicial numa peça só, no lugar do mapa das fases, do diagrama do modelo de
// custo e do "Como funciona" recolhido. Mostra o caminho como ele é hoje na ferramenta: duas telas em comum (onde e
// prioridade) e, a partir da prioridade, dois caminhos. Só "Governando a IA na educação": contexto, categorias de custo,
// opções e o plano de governança. Qualquer outra prioridade ou combinação: os quatro capítulos da 0.0.14, com os passos,
// as camadas do custo total que cada um alimenta (células da MATRIZ com perguntas nessa fase), o que a pessoa recebe e o
// resumo da fase por camada. Embaixo, a legenda das sete camadas (Krueger e Jackson, 2026) e o botão da matriz.
import { Fragment, useState } from 'react';
import { FASES, PASSOS, PASSO_INFO, CAMADAS, MATRIZ, CREDITO_MATRIZ, numPergunta } from '../domain';
import { ESSENCIAL, type Capitulo } from '../store';
import { Button } from '../ui';
import { abrirMatriz } from './Matriz';
import { CAPITULOS_INFO, t } from '../percurso/textos';
import './fasesCamadas.css';

type Celula = { t: string; q: string[]; na?: boolean };
const MTZ = MATRIZ as unknown as Record<number, Record<string, Celula>>;
const CAM = CAMADAS as unknown as [number, string][];
const FAS = FASES as unknown as { id: string; n: number; nome: string; abertura?: string }[];
const PAS = PASSOS as unknown as Record<string, [string, string][]>;
const PINFO = PASSO_INFO as unknown as Record<string, { num?: string }>;

/** O que a pessoa recebe ao fim de cada capítulo do caminho da 0.0.14. */
const RESULTADO_FASE: Record<string, string> = {
  contexto: 'Perfil da rede, prioridades, problemas e objetivos; diagnóstico de governança.',
  piloto: 'Tamanho e custo do teste (Ano 0) e o que ele exige em cada camada.',
  implantacao: 'Primeira etapa de uso real, arquitetura e custo do Ano 1.',
  expansao: 'Custo de todo o ciclo, recomendações para você e o plano de contratação em PDF.',
};
/** Passos que hoje ficam só no modo Refinar, e passos que são resultado (aparecem no plano, sem pergunta). */
const SO_REFINAR = new Set(['3b']);
const RESULTADO = new Set(['4b', '4c']);
/** Caminho da governança (v017): o que cada etapa pede e entrega. */
const ETAPAS_GOV: { titulo: string; texto: string }[] = [
  { titulo: 'Contexto', texto: 'País, instituição e os desafios: direitos e inovação responsável, soberania, capacidade do setor público.' },
  { titulo: 'Categorias de custo', texto: '9 categorias, de regulação e sandboxes a dados, infraestrutura, pessoal e coordenação.' },
  { titulo: 'Opções e valores', texto: 'Equipes de referência por papel, salário do país (ILOSTAT) com encargos, viagens, overhead e taxa.' },
];
const PRIORIDADES = ['Governando a IA na educação', 'Educando sobre a IA', 'Educando com e sem IA'];

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
    <section className="pc-fases-mapa ini-mapa cf" aria-labelledby="ini-mapa-t">
      <div className="ini-mapa-cab">
        <p className="ini-kicker"><span>{t('Como funciona')}</span></p>
        <h2 id="ini-mapa-t">{t('Do contexto ao plano: o caminho depende da prioridade')}</h2>
        <p className="ini-mapa-sub">{t('Todo plano começa por onde e por quê. A prioridade escolhida decide o que vem depois.')}</p>
      </div>

      <ol className="cf-comum" aria-label={t('Telas em comum')}>
        <li><span className="cf-n" aria-hidden="true">1</span><div><b>{t('Onde')}</b><span>{t('País e instituição responsável pelo plano.')}</span></div></li>
        <li><span className="cf-n" aria-hidden="true">2</span><div><b>{t('Prioridade')}</b><span>{t('Uma ou mais:')}</span>
          <span className="cf-prio">{PRIORIDADES.map((p) => <span key={p}>{t(p)}</span>)}</span></div></li>
      </ol>

      <div className="cf-caminhos">
        <article className="cf-caminho cf-gov" aria-labelledby="cf-gov-t">
          <header className="cf-caminho-cab">
            <p className="cf-se">{t('Se a prioridade for só')}</p>
            <h3 id="cf-gov-t">{t('Governando a IA na educação')}</h3>
            <p>{t('Plano de governança: três etapas, sem fases de teste e implantação.')}</p>
          </header>
          <ol className="cf-etapas">
            {ETAPAS_GOV.map((e, i) => <li key={e.titulo}><span className="cf-n" aria-hidden="true">{i + 1}</span><div><b>{t(e.titulo)}</b><span>{t(e.texto)}</span></div></li>)}
          </ol>
          <div className="ini-f-res cf-res"><p className="ini-f-l">{t('O que você recebe')}</p><p>{t('O plano de governança com o custo por categoria e opção, o resumo para decisão e o anexo técnico em PDF.')}</p></div>
          <p className="cf-cam">{t('Alimenta sobretudo a camada 1 do custo total:')} <span className="ini-cams"><span className="cam-1"><span className="ini-cn" aria-hidden="true">1</span></span></span> {t(CAM[0][1])}.</p>
        </article>

        <article className="cf-caminho cf-ed" aria-labelledby="cf-ed-t">
          <header className="cf-caminho-cab">
            <p className="cf-se">{t('Se a prioridade incluir')}</p>
            <h3 id="cf-ed-t">{t('Educando sobre a IA ou Educando com e sem IA')}</h3>
            <p>{t('Plano de contratação com o custo do ciclo de vida, em quatro capítulos. Clique num capítulo para ver o que ele pede em cada camada do custo total.')}</p>
          </header>
          <div className="ini-fases">
            {FAS.map((f) => {
              const ab = aberta === f.id, cap = CAPITULOS_INFO[f.n as Capitulo];
              const nPerg = ESSENCIAL.filter((x) => x.capitulo === f.n && !['local', 'prioridades'].includes(x.id)).length;
              return <Fragment key={f.id}>
                <article className={'ini-f f' + f.n + (ab ? ' aberta' : '')} onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) alternar(f.id); }}>
                  <h4 className="ini-f-h">
                    <button type="button" className="ini-f-b" aria-expanded={ab} aria-controls={'ini-p-' + f.id} onClick={() => alternar(f.id)}>
                      <span className="ini-f-n" aria-hidden="true">{f.n}</span>
                      <span className="ini-f-tt"><span className="ini-f-fase">{t(f.nome)}</span><span className="ini-f-nome">{t(cap.titulo)}</span></span>
                      <Chevron />
                    </button>
                  </h4>
                  <div className="ini-f-corpo">
                    <div className="ini-f-bl"><p className="ini-f-l">{nPerg === 1 ? t('Passos · 1 tela') : t('Passos · {n} telas', { n: nPerg })}</p>
                      <ol className="ini-passos">{(PAS[f.id] || []).filter(([id]) => !RESULTADO.has(id)).map(([id, nome]) => <li key={id}><span className="ini-pn">{PINFO[id]?.num || ''}</span><span className="ini-pt">{t(nome)}{SO_REFINAR.has(id) ? <em className="cf-ref"> {t('(no modo Refinar)')}</em> : null}</span></li>)}</ol></div>
                    <div className="ini-f-bl"><p className="ini-f-l">{t('Camadas que alimenta')}</p>
                      <ul className="ini-cams">{camadasDaFase(f.id).map((k) => <li key={k} className={'cam-' + k} title={t(CAM[k - 1][1])}><span className="ini-cn" aria-hidden="true">{k}</span><span className="pc-sr">{t(CAM[k - 1][1])}</span></li>)}</ul></div>
                    <div className="ini-f-res"><p className="ini-f-l">{t('O que você recebe')}</p><p>{t(RESULTADO_FASE[f.id] || '')}</p></div>
                    <p className="ini-f-mais" aria-hidden="true"><span>{t(ab ? 'Fechar o resumo' : 'Ver o resumo da fase')}</span></p>
                  </div>
                </article>
                {ab ? <div className={'ini-p f' + f.n} id={'ini-p-' + f.id} role="region" aria-labelledby={'ini-pt-' + f.id}>
                  <div className="ini-p-cab">
                    <span className="ini-f-n" aria-hidden="true">{f.n}</span>
                    <div className="ini-p-tt"><p className="ini-p-e">{t(f.nome)}</p><h4 id={'ini-pt-' + f.id}>{t(cap.titulo)}</h4></div>
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
        </article>
      </div>

      <div className="ini-leg">
        <p className="ini-leg-t">{t('As sete camadas do custo total')}</p>
        <ol className="ini-leg-l">{CAM.map(([k, nome]) => <li key={k} className={'cam-' + k}><span className="ini-cn" aria-hidden="true">{k}</span><span>{t(nome)}</span></li>)}</ol>
        <p className="cf-valores">{t('Em qualquer caminho, cada valor aparece como informado pela equipe, estimado por uma referência com fonte, ou ainda sem valor.')}</p>
      </div>
      <BotaoMatriz />
    </section>
  );
}
