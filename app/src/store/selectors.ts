// Seletores: derivações puras do estado v14 para a interface (plano, KPIs, recomendações, progresso).
// Recebem o Estado14 (ou o store) e nunca o mutam: cfgAtual guarda a cfg em estado.custo, por isso recebe uma cópia.
import { clone, cfgAtual, numerosCusto, casoAtual, perfil, recomendacoesCaso, premissasUnitarias, faltasEstimativa, modoTeste, QUESTOES_G, CAMPO_POR_ID } from '../domain';
import type { Estado14, Origem, Capitulo } from './tipos';
import { ESSENCIAL, telasDoCapitulo, type TelaEssencial } from './perguntas';
import { soEstado } from './caso';

/** cfg de custo do caso (ou do preset escolhido em custo.base), sem gravar no estado */
export function cfgDe(s: Estado14): any {
  const e: any = { ...soEstado(s), custo: { ...s.custo, cfg: s.custo.cfg ? clone(s.custo.cfg) : null } };
  return cfgAtual(e);
}
export interface Numeros { ano0: number; anual: number; total: number; porAluno: number; H: number; camadas: any; av: any; ind: any; orc: any; piloto: number }
export function numerosDe(s: Estado14): Numeros { return numerosCusto(cfgDe(s)) as Numeros; }
export function casoEfetivoDe(s: Estado14) { return casoAtual(s); }
export function perfilDe(s: Estado14) { return perfil(s); }
export function recomendacoesDe(s: Estado14): any[] { return recomendacoesCaso(s); }
export function premissasDe(s: Estado14): any[] { return premissasUnitarias(s, cfgDe(s)); }
/** respostas que faltam para a estimativa ter base (tarefas, tecnologia, elegíveis) */
export function faltasEstimativaDe(s: Estado14): any[] { return faltasEstimativa(s); }

export function origemDe(s: Estado14, campo: string): Origem { return s.origem[campo] || (s.respC[campo] ? 'informado' : 'padrao'); }
export const respondido = (s: Estado14, campo: string) => { const o = origemDe(s, campo); return o === 'informado' || o === 'refinado'; };

/** campos que a tela realmente pergunta neste caso: o tamanho do teste segue a resposta 2.0 (prova de conceito,
 *  piloto ou os dois) e as perguntas condicionais (2.4.2) só contam quando aparecem */
export function camposAtivos(s: Estado14, t: TelaEssencial): string[] {
  if (t.id === 'piloto') { const m = modoTeste(s.caso); return m === 'poc' ? ['poc'] : m === 'ambos' ? ['poc', 'piloto'] : ['piloto']; }
  return t.campos.filter(c => { const f: any = (CAMPO_POR_ID as any)[c]; try { return !f || !f.se || !!f.se(s.caso); } catch (e) { return true; } });
}
/** a tela do Essencial está respondida? (governança: as seis perguntas; as demais: o campo principal e os ativos obrigatórios) */
export function telaRespondida(s: Estado14, t: TelaEssencial): boolean {
  if (t.id === 'governanca') return t.campos.every(g => !!s.resp[g]);
  if (t.id === 'internet' || t.id === 'piloto') return camposAtivos(s, t).every(c => respondido(s, c));
  return respondido(s, t.campos[0]);
}
export interface Progresso { capitulo: Capitulo; total: number; feitas: number; completo: boolean }
export function progressoDe(s: Estado14): Progresso[] {
  return ([1, 2, 3, 4] as Capitulo[]).map(c => {
    const telas = telasDoCapitulo(c), feitas = telas.filter(t => telaRespondida(s, t)).length;
    return { capitulo: c, total: telas.length, feitas, completo: feitas === telas.length };
  });
}
export function faltamDe(s: Estado14): TelaEssencial[] { return ESSENCIAL.filter(t => !telaRespondida(s, t)); }
export function telaAtual(s: Estado14): TelaEssencial { return ESSENCIAL.find(t => t.id === s.capitulo.pergunta) || telasDoCapitulo(s.capitulo.atual)[0] || ESSENCIAL[0]; }
export function proximaTela(s: Estado14): TelaEssencial | null {
  const i = ESSENCIAL.indexOf(telaAtual(s));
  return ESSENCIAL[i + 1] || null;
}
export function telaAnterior(s: Estado14): TelaEssencial | null {
  const i = ESSENCIAL.indexOf(telaAtual(s));
  return i > 0 ? ESSENCIAL[i - 1] : null;
}
/** campos do modo Refinar: os de CAMPOS que não estão em nenhuma tela do Essencial, por capítulo */
export function camposRefinar(capitulo: Capitulo): string[] {
  const ess = new Set(ESSENCIAL.flatMap(t => t.campos));
  return Object.keys(CAMPO_POR_ID).filter(id => !ess.has(id) && String((CAMPO_POR_ID as any)[id].passo || '').startsWith(String(capitulo)));
}
/** governança: perguntas com a resposta e a origem */
export function governancaDe(s: Estado14) {
  return (QUESTOES_G as any[]).map(q => ({ id: q.id as string, resposta: s.resp[q.id] || '', det: s.respDet[q.id], origem: origemDe(s, q.id) }));
}
/** cabeçalho do plano: título, rede e teste (mostrados assim que existem) */
export function cabecalhoDe(s: Estado14) {
  const c = s.caso, x = s.ctx;
  return { titulo: c.titulo || x.olhando || '', rede: x.local || '', nivel: x.nivel || '', testes: (c.testes || []) as string[], exemplo: s.exemplo };
}
