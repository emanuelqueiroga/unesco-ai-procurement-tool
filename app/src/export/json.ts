// Exportação do caso em JSON (formato 14): porta de dadosCaso, slugCaso, nomeArq e nomeArqCaso (src/app.js).
// O arquivo continua legível pela v13 nas chaves que ela conhece; `origem`, `sugestoes`, `modo` e `capitulo` são novos.
import type { Estado14, DadosCaso14 } from '../store/tipos';

export const APP_ID = 'ai-education-procurement-tool';

export function dadosCaso(e: Estado14, agora: Date = new Date()): DadosCaso14 {
  return {
    app: APP_ID, formato: 14, versao: 14, v10: true, salvo: agora.toISOString(), exemplo: e.exemplo,
    caso: e.caso, ctx: e.ctx, resp: e.resp, respC: e.respC, respDet: e.respDet || {}, revisar: e.revisar || [], feitos: e.feitos || {},
    ...(e.mantidas && Object.keys(e.mantidas).length ? { mantidas: e.mantidas } : {}),
    custo: e.custo, moeda: e.moeda, lang: e.lang,
    origem: e.origem || {}, sugestoes: e.sugestoes || {}, modo: e.modo || 'essencial', capitulo: e.capitulo || { atual: 1, pergunta: '' },
  };
}
export function textoCaso(e: Estado14, agora?: Date): string { return JSON.stringify(dadosCaso(e, agora), null, 2); }

export function slugCaso(e: Estado14): string {
  const base = e.caso.titulo || (e.ctx && e.ctx.olhando) || 'case';
  return String(base).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'case';
}
export function nomeArq(e: Estado14, ext: string): string { return 'procurement-plan-' + slugCaso(e) + '.' + ext; }
export function nomeArqCaso(e: Estado14): string { return 'ai-education-case-' + slugCaso(e) + '.json'; }
