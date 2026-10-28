// Aviso único quando o navegador não guarda as respostas (localStorage bloqueado, indisponível ou cheio).
// A gravação em si é de store/persistencia.ts (`salvar()` devolve false e não lança); aqui só se verifica, uma vez
// na abertura, com uma escrita de teste, e depois de cada mudança, se a chave do caso continua lá.
import { create } from 'zustand';
import { useCaso } from '../store';

export const useSalvamento = create<{ falhou: boolean; dispensado: boolean }>(() => ({ falhou: false, dispensado: false }));

/** O navegador aceita escrever no localStorage? (escrita e leitura de teste, sem tocar no caso) */
export function armazenamentoFunciona(st?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null): boolean {
  try {
    const s = st === undefined ? (typeof localStorage !== 'undefined' ? localStorage : null) : st;
    if (!s) return false;
    const k = 'aiedu-teste-gravacao';
    s.setItem(k, '1');
    const ok = s.getItem(k) === '1';
    s.removeItem(k);
    return ok;
  } catch { return false; }
}

export function marcarFalha() {
  if (!useSalvamento.getState().falhou) useSalvamento.setState({ falhou: true, dispensado: false });
}

/** Verifica o armazenamento agora e, depois, 1 s depois de cada mudança do caso (a gravação tem um atraso de
 *  250 ms): se a chave do caso não existe, o navegador não está guardando. Devolve a função que desliga. */
export function vigiarSalvamento(chave: string): () => void {
  if (!armazenamentoFunciona()) { marcarFalha(); return () => {}; }
  let timer: ReturnType<typeof setTimeout> | null = null;
  const des = useCaso.subscribe((s, a) => {
    if (s.caso === a.caso && s.resp === a.resp && s.ctx === a.ctx) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      try { if (localStorage.getItem(chave) == null) marcarFalha(); } catch { marcarFalha(); }
    }, 1000);
  });
  return () => { des(); if (timer) clearTimeout(timer); };
}
