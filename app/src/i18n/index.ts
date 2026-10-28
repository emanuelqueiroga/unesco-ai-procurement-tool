// Idiomas da interface: os dicionários gerados por scripts/i18n.mjs (src/i18n/<l>.json) entram sob demanda e
// são entregues ao módulo de domínio (setDicionarios/setLang). O português é a língua das chaves e não tem arquivo.
import { IDIOMAS, IDIOMAS_NOVOS, setDicionarios, getDicionarios, setLang, getLang, tr, idiomaInfo, magnitudes } from '../domain';

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
    if (k === 'ar') carregados[k] = corrigirMagnitudes(carregados[k], magnitudes('ar'));
  }
  setDicionarios({ ...(getDicionarios() || {}), ...carregados });
  setLang(l);
  carregarFonteIdioma(l);
  if (typeof document !== 'undefined') {
    const info: any = idiomaInfo(l);   // lang do <html> (bm, não fr-ML) e direção
    document.documentElement.lang = info.lang || 'pt-BR';
    document.documentElement.dir = info.dir === 'rtl' ? 'rtl' : 'ltr';
  }
  return l;
}

/** Valores abreviados (k, M, bn): o dicionário árabe traduz "US$ {0} mil" por "US$ {0} ألف", e uma palavra árabe
 *  no meio de um valor inverte a leitura de "US$ 336.2". As entradas voltam às abreviações de `magnitudes('ar')`
 *  (as mesmas de grande()), como na v13: só a palavra que vem logo depois de um número ({0}) é trocada; "por
 *  milhão de tokens" e outros usos da palavra ficam como estão. */
export function corrigirMagnitudes(dic: Record<string, string>, mags: string[]): Record<string, string> {
  const unidades: Record<string, string> = { 'ألف': mags[0], 'مليون': mags[1], 'مليار': mags[2] };
  const re = /(\{\d+\}) (ألف|مليون|مليار)(?![\u0600-\u06FF])/g;
  const out: Record<string, string> = {};
  for (const k of Object.keys(dic)) {
    const v = dic[k];
    out[k] = typeof v === 'string' && v.includes('{') ? v.replace(re, (_, n, u) => `${n} ${unidades[u]}`) : v;
  }
  return out;
}

/** Idioma inicial: o guardado no caso, senão inglês (decisão da equipe na v13: inglês como padrão). */
export function idiomaInicial(guardado?: string): string {
  const ids = idiomasDisponiveis();
  return guardado && ids.includes(guardado) ? guardado : 'en';
}

// Fontes dos idiomas fora do latim básico (como carregarFonteIdioma na v13): só a folha do idioma escolhido.
const FONTES_IDIOMA: Record<string, string> = {
  ar: 'https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@500;600&family=Noto+Sans+Arabic:wght@400;500;600&display=swap',
  zh: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600&family=Noto+Serif+SC:wght@500;600&display=swap',
  // bm: só os glifos que o latim básico não tem (Ɛ Ɔ Ɲ Ŋ ɛ ɔ ɲ ŋ e os acentos combinantes), como na v13
  bm: 'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600&family=Noto+Serif:wght@500;600&display=swap&text=' + encodeURIComponent('ƐƆƝŊɛɔɲŋ\u0300\u0301\u030c'),
};
function carregarFonteIdioma(l: string) {
  const url = FONTES_IDIOMA[l];
  if (!url || typeof document === 'undefined' || document.getElementById('fonte-' + l)) return;
  const k = document.createElement('link');
  // sem bloquear a pintura: a folha entra como 'print' e vira 'all' quando chega (se o Google Fonts estiver
  // inacessível, por exemplo em redes que o bloqueiam, a página segue com as fontes do sistema)
  k.id = 'fonte-' + l; k.rel = 'stylesheet'; k.href = url; k.media = 'print';
  k.onload = () => { k.media = 'all'; };
  document.head.appendChild(k);
}
