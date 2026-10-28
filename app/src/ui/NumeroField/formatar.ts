// Formatação de números enquanto se digita, nos separadores do idioma (porte de formatarCampoNum, src/i18n.js da
// v13): 1600000 → 1.600.000 (pt, es), 1,600,000 (en), 1 600 000 (fr). O valor guardado é sempre número puro.
export interface Separadores { grupo: string; decimal: string }

const CACHE: Record<string, Separadores> = {};
export function separadores(locale?: string): Separadores {
  const k = locale || '';
  if (!CACHE[k]) {
    let grupo = ',', decimal = '.';
    try {
      const ps = new Intl.NumberFormat(locale || undefined).formatToParts(12345.6);
      grupo = ps.find((p) => p.type === 'group')?.value ?? ',';
      decimal = ps.find((p) => p.type === 'decimal')?.value ?? '.';
    } catch { /* separadores padrão */ }
    CACHE[k] = { grupo, decimal };
  }
  return CACHE[k];
}

/** Lê o texto digitado no idioma: aceita o separador decimal do idioma (e "." ou "," quando inequívoco). */
export function lerDigitado(texto: string, locale?: string): number | '' {
  const { decimal } = separadores(locale);
  let s = String(texto ?? '').replace(/[\s  ]/g, '');
  if (!s) return '';
  const neg = /^[-−]/.test(s);
  // só dígitos e o separador decimal do idioma; os demais separadores são de milhar
  const outros = decimal === ',' ? /\./g : /,/g;
  s = s.replace(outros, '').replace(/[^\d,.]/g, '');
  if (decimal === ',') s = s.replace(',', '.');
  const n = parseFloat(s);
  if (!isFinite(n)) return '';
  return neg ? -n : n;
}

/** Formata um número para exibição no campo (sem limite de casas além de `casas`). */
export function paraTexto(n: number | '' | null | undefined, locale?: string, casas = 6): string {
  if (n === '' || n == null || !isFinite(n as number)) return '';
  try { return new Intl.NumberFormat(locale || undefined, { maximumFractionDigits: casas, useGrouping: true }).format(n as number); }
  catch { return String(n); }
}

export interface Digitacao { texto: string; caret: number; valor: number | '' }

/**
 * Reformata o texto enquanto a pessoa digita, mantendo o cursor depois do mesmo dígito.
 * `decimais`: aceita separador decimal (o texto digitado depois dele é preservado, inclusive zeros à direita).
 */
export function formatarDigitando(texto: string, caret: number, locale?: string, decimais = false, negativo = false): Digitacao {
  const { grupo, decimal } = separadores(locale);
  const bruto = String(texto ?? '');
  // dígitos antes do cursor (o que conta para reposicionar)
  const antes = bruto.slice(0, caret);
  const digitosAntes = (antes.match(/\d/g) || []).length;
  const temDecimalAntes = decimais && antes.includes(decimal);
  const neg = negativo && /^[\s]*[-−]/.test(bruto);
  // separar parte inteira e decimal pelo primeiro separador decimal do idioma
  let inteiro = bruto, fracao: string | null = null;
  if (decimais) {
    const i = bruto.indexOf(decimal);
    if (i >= 0) { inteiro = bruto.slice(0, i); fracao = bruto.slice(i + 1).replace(/\D/g, ''); }
  }
  let digs = inteiro.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (!digs && fracao !== null) digs = '0';
  if (!digs && fracao === null) return { texto: neg ? '-' : '', caret: neg ? 1 : 0, valor: '' };
  const agrupado = digs.replace(/\B(?=(\d{3})+(?!\d))/g, grupo);
  const textoFinal = (neg ? '-' : '') + agrupado + (fracao !== null ? decimal + fracao : '');
  const valorNum = parseFloat(digs + (fracao ? '.' + fracao : '')) * (neg ? -1 : 1);
  // novo cursor: depois do mesmo número de dígitos (e depois do separador decimal, se já estava depois dele)
  let vistos = 0, pos = neg ? 1 : 0;
  const alvo = digitosAntes;
  if (alvo === 0) pos = neg ? 1 : 0;
  else {
    for (let j = 0; j < textoFinal.length; j++) {
      if (/\d/.test(textoFinal[j])) { vistos++; if (vistos === alvo) { pos = j + 1; break; } }
    }
    if (vistos < alvo) pos = textoFinal.length;
  }
  if (temDecimalAntes && fracao !== null && pos <= agrupado.length + (neg ? 1 : 0)) pos = agrupado.length + (neg ? 1 : 0) + 1;
  return { texto: textoFinal, caret: pos, valor: isFinite(valorNum) ? valorNum : '' };
}
