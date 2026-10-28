import { useCallback, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const KEY = 'aiedu-theme';
/** cor da barra do navegador (meta theme-color) em cada tema: a superfície do cabeçalho */
const COR_BARRA: Record<Theme, string> = { light: '#ffffff', dark: '#16232a' };

function stored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

function doSistema(): Theme {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Tema inicial: o guardado, senão `prefers-color-scheme`. */
export function initialTheme(): Theme {
  return stored() ?? doSistema();
}

/** Aplica `data-theme` no `<html>` (o claro é a ausência do atributo) e a cor da barra do navegador.
 *  O `color-scheme` acompanha o atributo em base.css: controles nativos e listas de `<select>` ficam escuros. */
export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COR_BARRA[theme]);
}

// Estado do tema compartilhado entre quem o lê (o botão do cabeçalho e o diálogo "Caso" mostram o mesmo tema).
let atual: Theme | null = null;
const ouvintes = new Set<() => void>();
const ler = (): Theme => (atual ??= initialTheme());
function definir(t: Theme) {
  if (atual === t) return;
  atual = t;
  applyTheme(t);
  ouvintes.forEach((f) => f());
}
const assinar = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f); }; };

/** Enquanto a pessoa não escolher um tema, a interface acompanha o do sistema (também quando ele muda). */
export function acompanharTemaDoSistema(): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const mudou = () => { if (!stored()) definir(mq.matches ? 'dark' : 'light'); };
  mq.addEventListener('change', mudou);
  return () => mq.removeEventListener('change', mudou);
}

/** Estado do tema sincronizado com o `<html>` e o `localStorage`. */
export function useTheme(): [Theme, (t: Theme) => void, () => void] {
  const theme = useSyncExternalStore(assinar, ler, () => 'light' as Theme);
  const setTheme = useCallback((t: Theme) => {
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* sem armazenamento: só o atributo */
    }
    definir(t);
  }, []);
  const toggle = useCallback(() => setTheme(ler() === 'dark' ? 'light' : 'dark'), [setTheme]);
  return [theme, setTheme, toggle];
}
