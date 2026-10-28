// Termo do glossário (AJU-11): uma palavra sublinhada, no meio de um texto de ajuda, que abre a definição.
// Abre com clique, toque, Enter ou Espaço (é um <button>). Só uma definição fica aberta por vez na página. Esc fecha e devolve o
// foco ao termo; Tab, o ✕ e o clique fora também fecham. O painel vai para o <body> (não é cortado por cartões nem por
// `overflow`), é posicionado pelo retângulo do termo, preso à largura da tela (cabe em 400 px) e alinhado ao fim do termo no
// árabe (RTL). Ao abrir, o foco vai para o painel, para que o leitor de tela leia a definição.
import { Fragment, useEffect, useId, useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { termoDe, glossarioPartes } from '../../domain/glossario.js';
import { tx } from '../texto';
import './Termo.css';

// Um só aberto por vez: o id da instância aberta vive no módulo e todas as instâncias assinam.
let abertoId: string | null = null;
const ouvintes = new Set<() => void>();
const definir = (v: string | null) => { if (abertoId === v) return; abertoId = v; ouvintes.forEach((f) => f()); };
const assinar = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f); }; };
const lerAberto = () => abertoId;

const MARGEM = 16;
const LARGURA = 340;

export type TermoProps = {
  /** id do verbete do glossário (domain/glossario.js) */
  id: string;
  /** texto na frase; o padrão é o nome do termo no glossário */
  children?: ReactNode;
};

/** Termo sublinhado que abre a definição do glossário. Um id desconhecido sai como texto comum. */
export function Termo({ id, children }: TermoProps) {
  const verbete = termoDe(id);
  const uid = useId();
  const aberto = useSyncExternalStore(assinar, lerAberto, lerAberto) === uid;
  const gatilho = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLDivElement>(null);

  const posicionar = () => {
    const g = gatilho.current, p = painel.current;
    if (!g || !p) return;
    const vw = document.documentElement.clientWidth, vh = window.innerHeight;
    const larg = Math.min(LARGURA, vw - 2 * MARGEM);
    p.style.width = larg + 'px';
    const rects = g.getClientRects();
    const primeiro = rects.length ? rects[0] : g.getBoundingClientRect();
    const ultimo = rects.length ? rects[rects.length - 1] : primeiro;
    if (ultimo.bottom < 0 || primeiro.top > vh) { definir(null); return; }   // o termo saiu da tela
    const rtl = getComputedStyle(g).direction === 'rtl';
    const ancora = (r: DOMRect) => Math.max(MARGEM, Math.min(rtl ? r.right - larg : r.left, vw - MARGEM - larg));
    const alt = p.offsetHeight;
    let topo = ultimo.bottom + 6, esq = ancora(ultimo);
    if (topo + alt > vh - MARGEM && primeiro.top - 6 - alt >= MARGEM) { topo = primeiro.top - 6 - alt; esq = ancora(primeiro); }
    p.style.left = esq + 'px';
    p.style.top = Math.max(MARGEM, Math.min(topo, vh - MARGEM - alt)) + 'px';
  };

  // ao abrir: posiciona antes de pintar e leva o foco ao painel
  useLayoutEffect(() => {
    if (!aberto) return;
    posicionar();
    painel.current?.focus({ preventScroll: true });
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (voltarFoco: boolean) => {
      definir(null);
      if (voltarFoco) gatilho.current?.focus({ preventScroll: true });
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      e.preventDefault();
      fechar(true);
    };
    const fora = (e: Event) => {
      const t = e.target as Element | null;
      if (t && t.closest && (t.closest('[data-termo-painel]') || t.closest('[data-termo-gatilho]'))) return;
      fechar(false);
    };
    document.addEventListener('keydown', tecla, true);
    document.addEventListener('pointerdown', fora, true);
    window.addEventListener('resize', posicionar);
    window.addEventListener('scroll', posicionar, true);
    return () => {
      document.removeEventListener('keydown', tecla, true);
      document.removeEventListener('pointerdown', fora, true);
      window.removeEventListener('resize', posicionar);
      window.removeEventListener('scroll', posicionar, true);
    };
  }, [aberto]);

  // o termo saiu da tela com o painel aberto: não deixa o painel órfão
  useEffect(() => () => { if (abertoId === uid) definir(null); }, [uid]);

  if (!verbete) return <>{children}</>;
  const nome = tx(verbete.termo);
  const ext = verbete.extenso ? tx(verbete.extenso) : '';
  return (
    <>
      <button
        ref={gatilho}
        type="button"
        className="pr-termo"
        data-termo-gatilho=""
        aria-expanded={aberto}
        aria-haspopup="dialog"
        aria-controls={aberto ? uid : undefined}
        onClick={() => definir(aberto ? null : uid)}
      >
        {children ?? nome}
      </button>
      {aberto ? createPortal(
        <div
          ref={painel}
          id={uid}
          role="dialog"
          tabIndex={-1}
          aria-label={tx('Definição de') + ' ' + nome}
          className="pr-termo-painel"
          data-termo-painel=""
          onKeyDown={(e) => {
            // Tab sai do painel: volta ao termo e deixa o navegador seguir dali
            if (e.key === 'Tab') { definir(null); gatilho.current?.focus({ preventScroll: true }); }
          }}
        >
          <div className="pr-termo-cab">
            <span className="pr-termo-nome">
              <b>{nome}</b>
              {ext ? <span className="pr-termo-ext"> {ext}</span> : null}
            </span>
            <button
              type="button"
              className="pr-termo-fechar"
              aria-label={tx('Fechar')}
              onClick={() => { definir(null); gatilho.current?.focus({ preventScroll: true }); }}
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
          <p className="pr-termo-def" dir="auto">{tx(verbete.def)}</p>
        </div>,
        document.body,
      ) : null}
    </>
  );
}

type Parte = { texto?: string; id?: string; rotulo?: string; termoPadrao?: boolean };

export type TextoComTermosProps = {
  /** texto em português (a chave de tradução), com marcas [[id]] ou [[id|texto]] */
  texto: string;
  /** false quando o texto já vem traduzido */
  traduzir?: boolean;
};

/** Texto de ajuda com os termos do glossário sublinhados: traduz o texto (a tradução mantém as marcas) e troca cada marca por um <Termo>. */
export function TextoComTermos({ texto, traduzir = true }: TextoComTermosProps) {
  const t = traduzir ? tx(texto) : texto;
  return (
    <>
      {(glossarioPartes(t) as Parte[]).map((p, i) => (
        <Fragment key={i}>
          {p.id ? <Termo id={p.id}>{p.termoPadrao ? undefined : p.rotulo}</Termo> : p.texto}
        </Fragment>
      ))}
    </>
  );
}
