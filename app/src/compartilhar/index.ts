// Versão de teste v016: compartilhar o plano por link, sem servidor (o caso vai no fragmento do endereço; codec.ts,
// trazido da 0.1.0-alpha.8). Ao abrir um link: sem caso neste navegador, o plano recebido abre direto; com caso,
// uma faixa pergunta se substitui (nada é trocado sem a escolha da pessoa).
import { create } from 'zustand';
import { useCaso, soEstado } from '../store/caso';
import { temRespostas } from '../store/migracoes';
import { URL_ESTAVEL } from '../percurso/canal';
import type { Estado14 } from '../store/tipos';
import { codificarCaso, decodificarCaso, codigoDoHash, hashSemCodigo, montarLink, ErroLink } from './codec';

export const LIMITE_LINK = 8000;
export function baseDoEndereco(): string {
  try { if (typeof location !== 'undefined' && /^https?:/.test(location.protocol)) return location.href.split('#')[0]; } catch { /* abaixo */ }
  return URL_ESTAVEL;
}
export async function linkDoPlano(): Promise<string> { return montarLink(baseDoEndereco(), await codificarCaso(soEstado(useCaso.getState()))); }

export const useRecebido = create<{ pendente: Estado14 | null; erro: string }>(() => ({ pendente: null, erro: '' }));
function porNoStore(e: Estado14) { const lang = useCaso.getState().lang; useCaso.getState().importar({ ...e, lang: lang || e.lang || '' } as any); }
export function aceitarRecebido() { const p = useRecebido.getState().pendente; if (p) porNoStore(p); useRecebido.setState({ pendente: null }); }
export function recusarRecebido() { useRecebido.setState({ pendente: null }); }

/** Lê "#/plano?caso=…". Nunca lança. */
export async function lerLinkDoEndereco(): Promise<void> {
  if (typeof location === 'undefined') return;
  const codigo = codigoDoHash(location.hash);
  if (codigo == null) return;
  const destino = hashSemCodigo(location.hash) || '#/plano';
  try { history.replaceState(history.state, '', location.pathname + location.search + destino); } catch { location.hash = destino; }
  try {
    const e = await decodificarCaso(codigo);
    if (temRespostas(soEstado(useCaso.getState()))) useRecebido.setState({ pendente: e });
    else porNoStore(e);
  } catch (err) {
    const motivo = err instanceof ErroLink ? err.motivo : 'dados';
    useRecebido.setState({ erro: motivo === 'navegador' ? 'navegador' : 'dados' });
  }
}
