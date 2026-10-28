// Persistência no navegador: porta de salvar() e carregar() (src/app.js). A v14 guarda o caso numa chave própria
// e, ao abrir sem caso v14, lê o da v13 (chave 'aiedu-procurement-v9', estável) ou o do app anterior
// ('navegador-ia-educacao-v4'), convertendo com migrar(); as chaves antigas ficam intactas, como na v13.
// Recebe o `storage` como parâmetro (Storage do navegador ou um objeto de teste) e nunca lança.
import type { Estado14 } from './tipos';
import { migrar, temRespostas } from './migracoes';
import { useCaso, soEstado, type CasoStore } from './caso';

export const CHAVE = 'aiedu-procurement-v14';
export const CHAVE_V13 = 'aiedu-procurement-v9';
export const CHAVE_V8 = 'navegador-ia-educacao-v4';

export interface StorageLike { getItem(k: string): string | null; setItem(k: string, v: string): void }
export interface Carga { estado: Estado14; de: 'v14' | 'v13' | 'v8'; temRespostas: boolean }

function storagePadrao(): StorageLike | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { return null; }
}
function ler(st: StorageLike, chave: string): any {
  try { const t = st.getItem(chave); if (!t) return null; const o = JSON.parse(t); return o && typeof o === 'object' && o.caso ? o : null; } catch (e) { return null; }
}

/** Lê o caso guardado (v14, senão v13, senão v8). null quando não há nada aproveitável. */
export function carregar(st: StorageLike | null = storagePadrao()): Carga | null {
  if (!st) return null;
  const fontes: [string, Carga['de']][] = [[CHAVE, 'v14'], [CHAVE_V13, 'v13'], [CHAVE_V8, 'v8']];
  for (const [chave, de] of fontes) {
    const o = ler(st, chave);
    if (!o) continue;
    try {
      // o estado da v13 no localStorage não tem `app`; migrar() aceita pelo `versao`
      const estado = migrar(de === 'v8' ? { ...o, app: 'navegador-ia-educacao' } : o);
      return { estado, de, temRespostas: temRespostas(estado) };
    } catch (e) { console.warn('caso guardado ignorado', chave, e); }
  }
  return null;
}

export function salvar(estado: Estado14, st: StorageLike | null = storagePadrao()): boolean {
  if (!st) return false;
  try { st.setItem(CHAVE, JSON.stringify(soEstado(estado))); return true; } catch (e) { return false; }
}

/** Liga o store ao storage: carrega o caso guardado e grava a cada mudança de estado (com um pequeno atraso). */
export function ligarPersistencia(st: StorageLike | null = storagePadrao(), atrasoMs = 250): () => void {
  const c = carregar(st);
  if (c) useCaso.getState().repor(c.estado, c.de);
  let timer: ReturnType<typeof setTimeout> | null = null;
  const CHAVES = ['caso', 'ctx', 'resp', 'respC', 'respDet', 'revisar', 'feitos', 'custo', 'moeda', 'lang', 'origem', 'sugestoes', 'modo', 'capitulo', 'exemplo'] as const;
  const mudou = (a: CasoStore, b: CasoStore) => CHAVES.some(k => a[k] !== b[k]);
  const gravarJa = () => { if (timer) { clearTimeout(timer); timer = null; salvar(soEstado(useCaso.getState()), st); } };
  const des = useCaso.subscribe((s, anterior) => {
    if (!mudou(s, anterior)) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; salvar(soEstado(useCaso.getState()), st); }, atrasoMs);
  });
  // ao fechar ou esconder a aba, o que ainda estava no atraso é gravado na hora
  const aoEsconder = () => { if (typeof document === 'undefined' || document.visibilityState === 'hidden') gravarJa(); };
  if (typeof window !== 'undefined') { window.addEventListener('pagehide', gravarJa); document.addEventListener('visibilitychange', aoEsconder); }
  return () => {
    des();
    gravarJa();
    if (typeof window !== 'undefined') { window.removeEventListener('pagehide', gravarJa); document.removeEventListener('visibilitychange', aoEsconder); }
  };
}
