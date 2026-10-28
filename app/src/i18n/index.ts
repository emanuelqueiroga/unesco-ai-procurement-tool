// Idiomas da interface: os dicionários gerados por scripts/i18n.mjs (src/i18n/<l>.json) entram sob demanda e
// são entregues ao módulo de domínio (setDicionarios/setLang). O português é a língua das chaves e não tem arquivo.
import { IDIOMAS, IDIOMAS_NOVOS, setDicionarios, getDicionarios, setLang, getLang, tr } from '../domain';

export { IDIOMAS, IDIOMAS_NOVOS, getLang, tr };

const carregados: Record<string, Record<string, string>> = {};
const ARQUIVOS = import.meta.glob('./*.json', { import: 'default' }) as Record<string, () => Promise<Record<string, string>>>;

export function idiomasDisponiveis(): string[] { return (IDIOMAS as any[]).map(i => i[0]); }

/** Carrega o dicionário de `l` (e o inglês, base dos idiomas novos) e torna `l` o idioma corrente. */
export async function usarIdioma(l: string): Promise<string> {
  const ids = idiomasDisponiveis();
  if (!ids.includes(l)) l = 'pt';
  const precisa = l === 'pt' ? [] : (IDIOMAS_NOVOS as string[]).includes(l) ? ['en', l] : [l];
  for (const k of precisa) {
    if (carregados[k]) continue;
    const f = ARQUIVOS[`./${k}.json`];
    carregados[k] = f ? await f() : {};
  }
  setDicionarios({ ...(getDicionarios() || {}), ...carregados });
  setLang(l);
  if (typeof document !== 'undefined') {
    const info = (IDIOMAS as any[]).find(i => i[0] === l);
    document.documentElement.lang = info ? info[2].split('-u-')[0] : 'pt-BR';
    document.documentElement.dir = info && info[4] === 'rtl' ? 'rtl' : 'ltr';
  }
  return l;
}

/** Idioma inicial: o guardado no caso, senão português. Na linha 0.1.x os textos novos da v14 só existem em
 *  português (os dicionários v14_<l>.json vêm com a publicação); começar pelo idioma do navegador misturaria
 *  as duas línguas na mesma tela. Quem quiser outro idioma escolhe na caixa "Caso". */
export function idiomaInicial(guardado?: string): string {
  const ids = idiomasDisponiveis();
  return guardado && ids.includes(guardado) ? guardado : 'pt';
}
