// Matriz camadas × fases (7 × 4) e Figura 1 de Krueger e Jackson (2026), acessíveis de qualquer tela: botão
// "Matriz" no cabeçalho, links da página inicial e ⓘ das camadas. Geral quando não há caso; com selos de estado
// e custo por célula quando há. Cada diálogo fecha com Esc e devolve o foco a quem o abriu.
import { useMemo, useState } from 'react';
import { create } from 'zustand';
import { TIT_MATRIZ, CREDITO_MATRIZ, NOTA_MATRIZ_CUSTO, CAMADAS_INFO, REF_TCO, FIG_INFO, FIG_TITULO, FIG_ALT, FIG_LEGENDA, grande, tr } from '../domain';
import { useCaso, temRespostas } from '../store';
import { secaoMatriz, ROT_ESTADO, TXT_MATRIZ, rotuloCamada } from '../plano/secoes.js';
import { Dialog, Button, Popover, IconInfo } from '../ui';
import { t } from '../percurso/textos';
import figuraTCO from '../../../assets/fig1_tco.jpg';
import './shell.css';

interface Celula { fase: string; t: string; n: string[]; na: boolean; estado: string; custo: number | null }
interface Linha { n: number; nome: string; cel: Celula[] }
interface Matriz { fases: { id: string; n: number; nome: string }[]; linhas: Linha[]; custo: boolean; somas: (number | null)[]; total: number | null }

/** Estado de abertura dos diálogos: qualquer tela abre pelo `abrirMatriz`/`abrirFigura`. `fase` destaca uma coluna. */
export const useMatriz = create<{ matriz: boolean; fase: string | null; figura: boolean }>(() => ({ matriz: false, fase: null, figura: false }));
export const abrirMatriz = (fase?: string) => useMatriz.setState({ matriz: true, fase: fase || null });
export const abrirFigura = () => useMatriz.setState({ figura: true });

/** Chave do texto de ⓘ da camada (4 e 5 compartilham `c45`). */
const chaveInfo = (k: number) => (k === 4 || k === 5 ? 'c45' : 'c' + k);

function InfoCamada({ k }: { k: number }) {
  const txt = (CAMADAS_INFO as Record<string, string>)[chaveInfo(k)];
  if (!txt) return null;
  return (
    <Popover
      className="pc-matriz-info"
      label={<><IconInfo size={16} /><span className="pc-sr">{t('Sobre a camada {n}', { n: k })}</span></>}
      title={rotuloCamada(k).replace(/^\d+\. /, '')}
      actions={<a href={REF_TCO.url} target="_blank" rel="noopener noreferrer">{String(tr(REF_TCO.link))}</a>}
    >
      {String(tr(txt))} {String(tr(REF_TCO.texto))}
    </Popover>
  );
}

function CelulaMatriz({ c, comCaso }: { c: Celula; comCaso: boolean }) {
  return (
    <div className="pc-matriz-cel">
      <span>{String(tr(c.t))}</span>
      {!c.na && c.n.length ? <span className="pc-matriz-q">{String(tr(TXT_MATRIZ.perguntas))} {c.n.join(', ')}</span> : null}
      {comCaso && !c.na ? <span className={`pc-selo pc-selo--${c.estado}`}>{String(tr((ROT_ESTADO as Record<string, string>)[c.estado] || c.estado))}</span> : null}
      {c.custo != null ? <span className="pc-matriz-custo">{grande(c.custo)}</span> : null}
    </div>
  );
}

export function TabelaMatriz({ m, comCaso, fase }: { m: Matriz; comCaso: boolean; fase?: string | null }) {
  const destaque = (id: string) => (fase && id === fase ? ' pc-matriz-destaque' : '');
  return (
    <table className="pc-matriz-tabela">
      <caption className="pc-sr">{String(tr(TIT_MATRIZ))}</caption>
      <thead>
        <tr>
          <th scope="col">{String(tr(TXT_MATRIZ.camada))}</th>
          {m.fases.map((f) => (
            <th key={f.id} scope="col" className={destaque(f.id).trim()} aria-current={fase === f.id ? 'true' : undefined}>{f.n}. {String(tr(f.nome))}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {m.linhas.map((l) => (
          <tr key={l.n}>
            <th scope="row" data-label={String(tr(TXT_MATRIZ.camada))}>
              <span className="pc-matriz-camada">
                <span className="pc-matriz-amostra" style={{ background: `var(--layer-${l.n})` }} aria-hidden="true" />
                <span>{rotuloCamada(l.n)}</span>
                <InfoCamada k={l.n} />
              </span>
            </th>
            {l.cel.map((c, i) => (
              <td key={c.fase} data-label={`${m.fases[i].n}. ${String(tr(m.fases[i].nome))}`} className={destaque(c.fase).trim() || undefined}>
                <CelulaMatriz c={c} comCaso={comCaso} />
              </td>
            ))}
          </tr>
        ))}
        {m.custo ? (
          <tr className="pc-matriz-total">
            <th scope="row" data-label={String(tr(TXT_MATRIZ.camada))}>{String(tr('Total'))}</th>
            {m.somas.map((v, i) => (
              <td key={i} data-label={`${m.fases[i].n}. ${String(tr(m.fases[i].nome))}`}>{v == null ? '—' : grande(v)}</td>
            ))}
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}

function ConteudoMatriz({ fase }: { fase: string | null }) {
  const s = useCaso();
  const comCaso = temRespostas(s);
  const m = useMemo<Matriz | null>(() => {
    try { return (secaoMatriz(s.estado()) as any)?.mx ?? null; } catch (e) { console.warn(e); return null; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.caso, s.ctx, s.resp, s.respC, s.respDet, s.custo, s.moeda, s.lang]);
  if (!m) return <p>{t('Não foi possível montar a matriz agora.')}</p>;
  const custo = comCaso && m.custo;
  return (
    <div className="pc-matriz-corpo">
      <p>{comCaso ? String(tr(TXT_MATRIZ.intro)) : t('O que cada camada do custo total exige em cada fase. Responda ao percurso para ver o estado das respostas deste caso e, com a estimativa completa, o custo de cada célula.')}</p>
      <TabelaMatriz m={custo ? m : { ...m, custo: false }} comCaso={comCaso} fase={fase} />
      <p className="pc-matriz-nota">
        {custo ? <>{String(tr(NOTA_MATRIZ_CUSTO))} {String(tr(TXT_MATRIZ.soma))} {grande(m.total || 0)}.</> : comCaso ? String(tr(TXT_MATRIZ.semCusto)) : null}
        {custo || comCaso ? ' ' : ''}{String(tr(CREDITO_MATRIZ))}
      </p>
      <div className="pc-botoes">
        <Button variant="secondary" size="sm" onClick={abrirFigura} aria-haspopup="dialog">{String(tr(FIG_INFO.botao))}</Button>
      </div>
    </div>
  );
}

/** Os dois diálogos, montados uma vez pela moldura. */
export function MatrizHost() {
  const { matriz, fase, figura } = useMatriz();
  const [erroImg, setErroImg] = useState(false);
  const fecharMatriz = () => useMatriz.setState({ matriz: false, fase: null });
  const fecharFigura = () => useMatriz.setState({ figura: false });
  return (
    <>
      {/* com a figura ou um ⓘ aberto por cima, o Esc fecha só o de cima */}
      <Dialog open={matriz} onClose={() => { if (!figura && !document.querySelector('.pc-matriz .pr-popover-painel')) fecharMatriz(); }} title={String(tr(TIT_MATRIZ))} className="pc-matriz" actions={<Button variant="secondary" onClick={fecharMatriz}>{t('Fechar')}</Button>}>
        {matriz ? <ConteudoMatriz fase={fase} /> : null}
      </Dialog>
      <Dialog
        open={figura}
        onClose={fecharFigura}
        size="figure"
        title={String(tr(FIG_TITULO))}
        actions={<Button variant="secondary" onClick={fecharFigura}>{String(tr(FIG_INFO.fechar))}</Button>}
      >
        <figure className="pc-figura-ampliada">
          {erroImg ? <p>{t('Não foi possível carregar a figura.')}</p> : (
            <img src={figuraTCO} alt={String(tr(FIG_ALT))} onError={() => setErroImg(true)} />
          )}
          <figcaption className="pc-nota">{String(tr(FIG_LEGENDA))}</figcaption>
        </figure>
      </Dialog>
    </>
  );
}
