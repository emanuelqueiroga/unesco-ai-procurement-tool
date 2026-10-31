// Rotas por hash (funciona no GitHub Pages e no arquivo local, sem servidor):
//   #/                         início
//   #/capitulo/:n              abertura do capítulo
//   #/capitulo/:n/:tela        pergunta (id da tela do Essencial, perguntas.ts)
//   #/capitulo/:n/sintese      síntese do capítulo
//   #/plano[/custa|fazer|exigir|apendice|faltam]   páginas do plano
//   #/refinar[/premissas|ferramentas|cenarios]   calculadora do modo Refinar
//   #/galeria                  galeria de componentes do Prumo
import { useEffect, useState } from 'react';
import type { Capitulo } from '../store';
import { TODAS_TELAS, telaDoCampo, capituloDoCampo } from '../store';

export type PaginaPlano = 'resumo' | 'custa' | 'fazer' | 'exigir' | 'apendice' | 'faltam';
const PAGINAS: PaginaPlano[] = ['resumo', 'custa', 'fazer', 'exigir', 'apendice', 'faltam'];

export type AbaRefinar = 'premissas' | 'ferramentas' | 'cenarios';
const ABAS: AbaRefinar[] = ['premissas', 'ferramentas', 'cenarios'];

export type Rota =
  | { tipo: 'inicio' }
  | { tipo: 'abertura'; n: Capitulo }
  | { tipo: 'pergunta'; n: Capitulo; tela: string }
  | { tipo: 'sintese'; n: Capitulo; foco?: string }
  | { tipo: 'plano'; pagina: PaginaPlano }
  | { tipo: 'refinar'; aba: AbaRefinar; foco?: string }
  | { tipo: 'galeria' };

const cap = (s: string): Capitulo | null => (['1', '2', '3', '4'].includes(s) ? (+s as Capitulo) : null);

export function lerRota(hash: string): Rota {
  const p = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (p[0] === 'galeria') return { tipo: 'galeria' };
  // #/refinar/premissas/<campo> abre a aba com o campo em foco ("Ajustar premissas" do "de onde vem?")
  if (p[0] === 'refinar') return { tipo: 'refinar', aba: ABAS.includes(p[1] as AbaRefinar) ? (p[1] as AbaRefinar) : 'premissas', foco: p[2] || undefined };
  if (p[0] === 'plano') return { tipo: 'plano', pagina: PAGINAS.includes(p[1] as PaginaPlano) ? (p[1] as PaginaPlano) : 'resumo' };
  if (p[0] === 'capitulo') {
    const n = cap(p[1] || '');
    if (!n) return { tipo: 'inicio' };
    if (!p[2]) return { tipo: 'abertura', n };
    // #/capitulo/:n/sintese/<campo>: a síntese com as premissas do capítulo abertas e o campo em foco
    if (p[2] === 'sintese') return p[3] ? { tipo: 'sintese', n, foco: p[3] } : { tipo: 'sintese', n };
    if (n === 1 && p[2] === 'situacao') return { tipo: 'pergunta', n: 1, tela: 'prioridades' };
    if (n === 1 && p[2] === 'nivel') return { tipo: 'pergunta', n: 1, tela: 'local' };
    const t = TODAS_TELAS.find((x) => x.id === p[2] && x.capitulo === n);
    return t ? { tipo: 'pergunta', n, tela: t.id } : { tipo: 'abertura', n };
  }
  return { tipo: 'inicio' };
}

export const href = {
  inicio: () => '#/',
  abertura: (n: number) => `#/capitulo/${n}`,
  pergunta: (n: number, tela: string) => `#/capitulo/${n}/${tela}`,
  sintese: (n: number) => `#/capitulo/${n}/sintese`,
  refinar: (aba: AbaRefinar = 'premissas', foco?: string) => `#/refinar/${aba}${foco ? '/' + foco : ''}`,
  plano: (pagina: PaginaPlano = 'resumo') => (pagina === 'resumo' ? '#/plano' : `#/plano/${pagina}`),
  /** Onde responder um campo qualquer: a tela do Essencial, ou a síntese do capítulo com o campo em foco (Refinar). */
  campo: (campo: string) => {
    if (campo === 'situacao') return '#/capitulo/1/prioridades';
    if (['nivel', 'nivelOutro', 'local'].includes(campo)) return '#/capitulo/1/local';
    const base = String(campo).split('.')[0];
    const t = telaDoCampo(base);
    if (t) return `#/capitulo/${t.capitulo}/${t.id}`;
    return `#/capitulo/${capituloDoCampo(base)}/sintese/${base}`;
  },
  tela: (id: string) => {
    if (id === 'situacao') return '#/capitulo/1/prioridades';
    if (id === 'nivel') return '#/capitulo/1/local';
    const t = TODAS_TELAS.find((x) => x.id === id);
    return t ? `#/capitulo/${t.capitulo}/${t.id}` : '#/';
  },
};

export function ir(destino: string) {
  if (typeof window === 'undefined') return;
  if (window.location.hash === destino) return;
  window.location.hash = destino;
}

export function useRota(): Rota {
  const ler = () => lerRota(typeof window === 'undefined' ? '' : window.location.hash);
  const [rota, setRota] = useState<Rota>(ler);
  useEffect(() => {
    const mudou = () => {
      setRota(ler());
      // cada tela começa do topo; o foco vai para o título (main) para leitores de tela
      window.scrollTo(0, 0);
      requestAnimationFrame(() => {
        const alvo = document.querySelector<HTMLElement>('[data-foco-inicial]') || document.querySelector<HTMLElement>('main h1');
        if (alvo) { if (!alvo.hasAttribute('tabindex')) alvo.setAttribute('tabindex', '-1'); alvo.focus({ preventScroll: true }); }
      });
    };
    window.addEventListener('hashchange', mudou);
    return () => window.removeEventListener('hashchange', mudou);
  }, []);
  return rota;
}
