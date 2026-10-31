// Sugestões do percurso como função pura: porta de aplicarPadroes, aplicarProblemas e aplicarSugestoes
// (src/fluxo.js), que mutavam S depois de cada mudança. Aqui devolvem a lista de {campo, valor, deQuem} a gravar
// pelo store com sugerir(); só campos ainda 'padrao' ou 'sugerido' entram. Para os campos de experiência de uso
// (2.2) já informados, a união nova com o que as tarefas sugerem (juntarSugestao) vai em `revisar`, para a
// interface pedir revisão em vez de substituir a resposta (no legado o valor era trocado e desconfirmado).
import { percursoLetramento, temGovernanca, projetoUsoDefinido, estadoDoProjeto, CASO_VAZIO, padroesGerados, sugProblemas, juntarSugestao, perfisSugeridos, totaisCtx,
  CAMPOS_GERADOS, CAMPOS_PROB, CAMPOS_SUGERIDOS, SUB_OBJ, clone } from '../domain';
import type { Estado14, Sugestao } from './tipos';

const igual = (a: any, b: any) => JSON.stringify(a === undefined ? null : a) === JSON.stringify(b === undefined ? null : b);
/** o campo ainda aceita sugestão? (não foi informado nem refinado) */
export function aceitaSugestao(estado: Estado14, campo: string): boolean {
  const o = (estado.origem || {})[campo];
  return o !== 'informado' && o !== 'refinado' && !(estado.respC || {})[campo];
}

export interface ResultadoSugestoes { sugestoes: Sugestao[]; revisar: { campo: string; valor: any }[] }

export function aplicarSugestoes(estado: Estado14): ResultadoSugestoes {
  if (percursoLetramento(estado.ctx) || temGovernanca(estado.ctx) && !projetoUsoDefinido(estado.ctx)) return { sugestoes: [], revisar: [] };
  const c: any = estado.caso || {}, x: any = estado.ctx || {};
  const out: Sugestao[] = [], revisar: { campo: string; valor: any }[] = [];
  const push = (campo: string, valor: any, deQuem: string, atual: any) => { if (!igual(atual, valor)) out.push({ campo, valor, deQuem }); };
  // 1. padrões gerados (2.0 → 2.3.8; 2.3.4 → 2.3.5 e 2.3.6; 2.4.3 → 2.4.4; 2.2.1 → 4.1.1; 4.1.1/1.1 → 3.1.1; 2.0 → 2.3.1)
  const g: any = padroesGerados(estado);
  const DE_QUEM: Record<string, string> = { pagamento: 'tipoTec', licenca: 'tipoTec', elegiveis: 'usuarios', dispExistem: 'modeloDisp', nFerramentas: 'testes', piloto: 'testes', poc: 'testes', implantacao: 'elegiveis' };
  CAMPOS_GERADOS.forEach((k: string) => {
    if (!aceitaSugestao(estado, k)) return;
    push(k, g[k] != null ? g[k] : '', DE_QUEM[k], c[k]);
  });
  Object.keys(SUB_OBJ).forEach(o => {
    (SUB_OBJ as any)[o].forEach((k: string) => {
      const chave = o + '.' + k;
      if (!aceitaSugestao(estado, chave)) return;
      push(chave, g[o] && g[o][k] != null ? g[o][k] : '', DE_QUEM[o], (c[o] || {})[k]);
    });
  });
  // 2. problemas marcados no 1.2 → 1.2.3 a 1.2.6 e 2.1.1
  const contexto = projetoUsoDefinido(x) ? estadoDoProjeto({ ...estado, ctx: { ...x, frenteAtiva: 'projeto' } }).ctx : x;
  const sp: any = sugProblemas(contexto);
  let tarefasMudam = false;
  if (sp) CAMPOS_PROB.forEach((k: string) => {
    if (!aceitaSugestao(estado, k)) return;
    const alvo = k === 'olhando' ? x : c;
    const v = Array.isArray(sp[k]) ? sp[k].slice() : (sp[k] || '');
    const atual = alvo[k] == null ? (Array.isArray(v) ? [] : '') : alvo[k];
    if (!igual(atual, v)) { out.push({ campo: k, valor: v, deQuem: 'problemas' }); if (k === 'tarefas') tarefasMudam = true; }
  });
  // 3. tarefas → experiência de uso (2.2): perfisSugeridos
  const tarefas: string[] = tarefasMudam ? (out.find(s => s.campo === 'tarefas') as Sugestao).valor : (c.tarefas || []);
  let sug: any = null;
  if (tarefas.length) { try { sug = perfisSugeridos(tarefas, totaisCtx(x).etapas); } catch (e) { sug = null; } }
  CAMPOS_SUGERIDOS.forEach((k: string) => {
    if (!aceitaSugestao(estado, k)) {
      if (!sug || sug[k] == null) return;
      const novo = juntarSugestao(k, c[k], sug[k]);
      if (!igual(novo, c[k])) revisar.push({ campo: k, valor: novo });
      return;
    }
    if (sug && sug[k] != null) push(k, clone(sug[k]), 'tarefas', c[k]);
    else if (!tarefas.length) push(k, clone((CASO_VAZIO as any)[k]), 'tarefas', c[k]);
  });
  // 4. a primeira ferramenta da lista é a principal: tecnologia e pagamento são os das perguntas 2.3.4 e 2.3.5
  const f0 = (c.ferramentas || [])[0];
  if (f0) {
    if (f0.tipoTec !== (c.tipoTec || '')) out.push({ campo: 'ferramentas.0.tipoTec', valor: c.tipoTec || '', deQuem: 'tipoTec' });
    const pag = out.find(s => s.campo === 'pagamento');
    const pagamento = pag ? pag.valor : (c.pagamento || '');
    if (f0.pagamento !== pagamento) out.push({ campo: 'ferramentas.0.pagamento', valor: pagamento, deQuem: 'pagamento' });
  }
  return { sugestoes: out, revisar };
}
