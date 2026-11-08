// Caso no endereço (P-01): o plano vai inteiro no fragmento do link (depois de `#`, que o navegador não envia
// ao servidor), sem servidor nem banco de dados. Formato do código:
//   v1.z.<base64url>   JSON compactado e comprimido com deflate-raw (CompressionStream)
//   v1.j.<base64url>   o mesmo JSON sem compressão (navegador sem CompressionStream)
// O JSON é o do exportar (dadosCaso, export/json.ts) sem a data e sem os valores vazios iguais ao caso em
// branco (o caso em branco os devolve na leitura); chaves que o caso apagou vão em "~d". Funções puras: o
// navegador e o Node 18+ têm TextEncoder, btoa e (com compressão) CompressionStream.
import type { Estado14 } from '../store/tipos';
import { estadoInicial, migrar } from '../store/migracoes';
import { dadosCaso, APP_ID } from '../export/json';

export const VERSAO_LINK = 1;
export const PARAM_LINK = 'caso';
const APAGADAS = '~d';

export type MotivoErroLink = 'formato' | 'versao' | 'dados' | 'navegador';
export class ErroLink extends Error {
  motivo: MotivoErroLink;
  constructor(motivo: MotivoErroLink, msg?: string) { super(msg || motivo); this.motivo = motivo; this.name = 'ErroLink'; }
}

// ----------------------------------------------------------- compactar (sem os vazios do caso em branco)
const ehObjeto = (v: any): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const vazioIgual = (v: any, b: any) => {
  if (v === b) return v === '' || v === null || v === false;
  if (Array.isArray(v) && Array.isArray(b)) return !v.length && !b.length;
  if (ehObjeto(v) && ehObjeto(b)) return !Object.keys(v).length && !Object.keys(b).length;
  return false;
};
const json = (o: any) => JSON.parse(JSON.stringify(o));

/** Diferença de `v` em relação à base: omite os valores vazios iguais aos da base e desce nos objetos. */
function diferenca(v: Record<string, any>, b: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  Object.keys(v).forEach((k) => {
    const x = v[k], y = b[k];
    if (ehObjeto(x) && ehObjeto(y) && Object.keys(y).length) {
      const d = diferenca(x, y);
      if (Object.keys(d).length) out[k] = d;
      return;
    }
    if (k in b && vazioIgual(x, y)) return;
    out[k] = x;
  });
  const apagadas = Object.keys(b).filter((k) => !(k in v));
  if (apagadas.length) out[APAGADAS] = apagadas;
  return out;
}
function juntar(b: Record<string, any>, d: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...b };
  Object.keys(d).forEach((k) => {
    if (k === APAGADAS) return;
    out[k] = ehObjeto(d[k]) && ehObjeto(b[k]) && Object.keys(b[k]).length ? juntar(b[k], d[k]) : d[k];
  });
  if (Array.isArray(d[APAGADAS])) d[APAGADAS].forEach((k: any) => { delete out[String(k)]; });
  return out;
}

function baseCompacta(): Record<string, any> { return semData(json(dadosCaso(estadoInicial(), new Date(0)))); }
function semData(o: Record<string, any>) { delete o.salvo; return o; }

/** O objeto que vai no link (sem data, sem os vazios do caso em branco). */
export function compactarCaso(e: Estado14): Record<string, any> {
  return diferenca(semData(json(dadosCaso(e, new Date(0)))), baseCompacta());
}
/** Desfaz compactarCaso: devolve um objeto no formato do exportar (dadosCaso), pronto para migrar(). */
export function expandirCaso(d: Record<string, any>): Record<string, any> {
  if (!ehObjeto(d)) throw new ErroLink('dados');
  return { ...juntar(baseCompacta(), d), app: APP_ID, formato: 14, versao: 14, v10: true };
}

// ----------------------------------------------------------- bytes, base64url e compressão
function paraBase64url(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function deBase64url(s: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) throw new ErroLink('dados');
  const b = s.replace(/-/g, '+').replace(/_/g, '/');
  let bin: string;
  try { bin = atob(b + '==='.slice((b.length + 3) % 4)); } catch { throw new ErroLink('dados'); }
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function passarPor(bytes: Uint8Array, stream: { readable: ReadableStream<Uint8Array>; writable: WritableStream<Uint8Array> }): Promise<Uint8Array> {
  // o erro de dados corrompidos aparece na leitura e também na escrita: os dois são esperados aqui
  let erroEscrita: unknown = null;
  const escrita = (async () => { const w = stream.writable.getWriter(); await w.write(bytes); await w.close(); })().catch((err) => { erroEscrita = err; });
  const partes: Uint8Array[] = [];
  const r = stream.readable.getReader();
  try {
    for (;;) { const { done, value } = await r.read(); if (done) break; partes.push(value); }
  } finally { await escrita; }
  if (erroEscrita) throw erroEscrita;
  const out = new Uint8Array(partes.reduce((n, p) => n + p.length, 0));
  let i = 0; partes.forEach((p) => { out.set(p, i); i += p.length; });
  return out;
}
export const temCompressao = () => typeof (globalThis as any).CompressionStream === 'function' && typeof (globalThis as any).DecompressionStream === 'function';
async function comprimir(b: Uint8Array): Promise<Uint8Array> { return passarPor(b, new (globalThis as any).CompressionStream('deflate-raw')); }
async function descomprimir(b: Uint8Array): Promise<Uint8Array> { return passarPor(b, new (globalThis as any).DecompressionStream('deflate-raw')); }

// ----------------------------------------------------------- código do link
/** Codifica o caso: "v1.z.<dados>" (comprimido) ou "v1.j.<dados>" (sem compressão, quando não há como comprimir
 *  ou com `comprimir: false`). */
export async function codificarCaso(e: Estado14, o: { comprimir?: boolean } = {}): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(compactarCaso(e)));
  if (o.comprimir !== false && temCompressao()) {
    try { return `v${VERSAO_LINK}.z.` + paraBase64url(await comprimir(bytes)); } catch { /* sem compressão abaixo */ }
  }
  return `v${VERSAO_LINK}.j.` + paraBase64url(bytes);
}

/** Lê o código do link e devolve o estado (já migrado, como na importação). Lança ErroLink: 'formato' (não é
 *  um código de caso), 'versao' (versão desconhecida, de uma ferramenta mais nova), 'dados' (cortado ou
 *  alterado), 'navegador' (comprimido e este navegador não descomprime). */
export async function decodificarCaso(codigo: string): Promise<Estado14> {
  const m = /^v(\d+)\.([a-z])\.(.*)$/.exec(String(codigo || '').trim());
  if (!m) throw new ErroLink('formato');
  if (+m[1] !== VERSAO_LINK) throw new ErroLink('versao');
  if (m[2] !== 'z' && m[2] !== 'j') throw new ErroLink('versao');
  let bytes = deBase64url(m[3]);
  if (!bytes.length) throw new ErroLink('dados');
  if (m[2] === 'z') {
    if (!temCompressao()) throw new ErroLink('navegador');
    try { bytes = await descomprimir(bytes); } catch { throw new ErroLink('dados'); }
  }
  let obj: any;
  try { obj = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { throw new ErroLink('dados'); }
  try { return migrar(expandirCaso(obj)); } catch (err) { if (err instanceof ErroLink) throw err; throw new ErroLink('dados', String((err as any)?.message || err)); }
}

// ----------------------------------------------------------- endereço
/** O código do caso no fragmento ("#/plano?caso=v1.z.…"), ou null. */
export function codigoDoHash(hash: string): string | null {
  const m = /[?&]caso=([^&]*)/.exec(String(hash || ''));
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch { return m[1]; }
}
/** O fragmento sem a parte "?caso=…" (a rota que fica no endereço depois de ler o link). */
export function hashSemCodigo(hash: string): string {
  const h = String(hash || '');
  const i = h.indexOf('?');
  return i < 0 ? h : h.slice(0, i);
}
/** Monta o link: endereço da ferramenta (sem fragmento) + "#/plano?caso=<código>". */
export function montarLink(base: string, codigo: string): string {
  return String(base).split('#')[0] + '#/plano?' + PARAM_LINK + '=' + codigo;
}
