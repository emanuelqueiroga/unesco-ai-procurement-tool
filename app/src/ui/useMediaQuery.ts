import { useEffect, useState } from 'react';

/** Devolve se a media query casa; `false` fora do navegador. */
export function useMediaQuery(query: string): boolean {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Pontos de quebra do Prumo. */
export const BREAKPOINTS = {
  /** O painel do plano vira gaveta. */
  drawer: '(max-width: 1100px)',
  /** A navegação de capítulos vira barra. */
  bar: '(max-width: 900px)',
  /** Tabelas viram cartões. */
  cards: '(max-width: 640px)',
  /** Largura mínima. */
  narrow: '(max-width: 400px)',
} as const;
