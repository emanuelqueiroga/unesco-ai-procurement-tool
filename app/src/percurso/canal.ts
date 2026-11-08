// Canal do build: 'estavel' (padrão) ou 'revisao' (VITE_CANAL=revisao npm run build). A revisão mostra a faixa
// amarela, não é indexada (meta robots, injetada pelo vite.config.ts) e guarda o caso numa chave própria.
// Build de teste (VITE_TESTE=<nome>): chave própria `${CHAVE}@${VERSAO}-teste-<nome>`, para não ler nem gravar os
// rascunhos da revisão publicada na mesma origem, e a faixa diz que é uma versão de teste.
import pkg from '../../package.json';
import { CHAVE } from '../store';

export const VERSAO: string = pkg.version;
export const CANAL: 'estavel' | 'revisao' = import.meta.env.VITE_CANAL === 'revisao' ? 'revisao' : 'estavel';
/** Nome do build de teste (VITE_TESTE); vazio fora dele. */
export const TESTE: string = String(import.meta.env.VITE_TESTE || '').trim();
export const CHAVE_CASO = TESTE ? `${CHAVE}@${VERSAO}-teste-${TESTE}` : CANAL === 'revisao' ? `${CHAVE}@${VERSAO}` : CHAVE;
export const URL_ESTAVEL = 'https://emanuelqueiroga.github.io/unesco-ai-procurement-tool/';
