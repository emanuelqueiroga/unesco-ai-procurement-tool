// Canal do build: 'estavel' (padrão) ou 'revisao' (VITE_CANAL=revisao npm run build). A revisão mostra a faixa
// amarela, não é indexada (meta robots, injetada pelo vite.config.ts) e guarda o caso numa chave própria.
import pkg from '../../package.json';
import { CHAVE } from '../store';

export const VERSAO: string = pkg.version;
export const CANAL: 'estavel' | 'revisao' = import.meta.env.VITE_CANAL === 'revisao' ? 'revisao' : 'estavel';
export const CHAVE_CASO = CANAL === 'revisao' ? `${CHAVE}@${VERSAO}` : CHAVE;
export const URL_ESTAVEL = 'https://emanuelqueiroga.github.io/unesco-ai-procurement-tool/';
