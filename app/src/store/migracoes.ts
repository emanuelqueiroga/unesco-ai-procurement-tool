// Migrações do estado do caso: funções puras portadas de src/app.js (normalizarEstado, migrarEstadoV11,
// migrarEstadoV13, migrarV8, temRespostas, aplicarImportado) e uma só porta de entrada, migrar(json) → Estado14,
// que aceita os formatos 9, 11, 13 e 14, os estados guardados no localStorage (v9…v13, sem `app`) e os casos do
// app anterior 'navegador-ia-educacao' (v8, formato 4). A derivação de `origem` segue a spec ("Modelo de dados
// do caso"): respC[campo] → 'informado'; valor ≠ CASO_VAZIO e não confirmado → 'sugerido'; senão 'padrao'.
import { clone, CASO_VAZIO, CASOS, confirmarGerados, migrarCasoV10, MIGRA_DOMINIO, MIGRA_COMPS, PRIORIDADE_DO_PROBLEMA, PRIORIDADES,
  CAMPOS, QUESTOES_G, SUB_OBJ, CAMPO_POR_ID, OPC_PUBLICO, OPC_CONTESTACAO_EXISTE, OPC_TREINO, OPC_VERIFICACAO, OPC_INSTRUMENTO_TESTE, OPC_ESTRATEGIA_COMPRA,
  OPC_DOTACAO, OPC_TEMPO_JORNADA, OPC_MOMENTO_USO, OPC_APOIO_ESCOLA, OPC_UNIDADE_RESULTADO } from '../domain';
import type { Estado14, Origem } from './tipos';
import { ESSENCIAL } from './perguntas';

export const APP_ID = 'ai-education-procurement-tool';
export const APP_V8 = 'navegador-ia-educacao';
export const FORMATOS_ACEITOS = [9, 11, 13, 14];

export class ErroImportacao extends Error {
  constructor(msg: string) { super(msg); this.name = 'ErroImportacao'; }
}

const vazio = (v: any) => v == null || v === '' || (Array.isArray(v) && !v.length);
const igual = (a: any, b: any) => JSON.stringify(a === undefined ? null : a) === JSON.stringify(b === undefined ? null : b);

/** Estado inicial da v14 (porta de estadoInicial, src/app.js, sem fase/passo/vista/boasVindas/info). */
export function estadoInicial(): Estado14 {
  return {
    formato: 14, versao: 14, caso: clone(CASO_VAZIO), ctx: {}, resp: {}, respC: {}, respDet: {}, revisar: [], mantidas: {}, feitos: {}, exemplo: 'novo',
    custo: { base: 'caso', cfg: null, editado: false }, moeda: { cod: 'USD', taxa: '' }, lang: '',
    origem: {}, sugestoes: {}, modo: 'essencial', capitulo: { atual: 1, pergunta: ESSENCIAL[0].id },
  };
}

// ----------------------------------------------------------- v10 → v11 (plano/6_v11.md, "Campos")
// Caso: teste → testes; PoC da v10 (caso.piloto sem escolas) → caso.poc; infra → internet + dispExistem;
// arquiteturaManual → arquitetura; sem pagaDepois e fonte. Usa migrarCasoV10 (casos.js) e completa localmente.
function migrarCasoLocalV11(c0: any) {
  const c = clone(c0 || {});
  if (!Array.isArray(c.testes) || !c.testes.length) c.testes = c.teste === 'ambos' ? ['poc', 'piloto'] : c.teste ? [c.teste] : [];
  if (c.testes.length === 1 && c.testes[0] === 'poc' && c.piloto && !(c.poc && (+c.poc.participantes > 0 || +c.poc.meses > 0))) {
    c.poc = { participantes: c.piloto.participantes == null ? '' : c.piloto.participantes, meses: c.piloto.meses == null ? '' : c.piloto.meses };
    c.piloto = { escolas: '', participantes: '', meses: '' };
  }
  if (c.infra && !c.internet) {
    if (c.infra === 'sim') { c.internet = 'sim'; c.dispExistem = 'sim'; }
    else if (c.infra === 'complementar') { c.internet = 'parcial'; c.dispExistem = 'parcial'; }
  }
  if (c.arquiteturaManual && !c.arquitetura) c.arquitetura = c.arquiteturaManual;
  ['pagaDepois', 'fonte', 'infra', 'arquiteturaManual'].forEach(k => { delete c[k]; });
  return c;
}
// Estado: o caso (acima), as confirmações (respC), as fases e os passos (a fase "custo" vira "expansao").
export function migrarEstadoV11(o: any) {
  const c0 = o.caso || {};
  let c: any = null;
  try { c = migrarCasoV10(clone(c0)); } catch (e) { console.warn(e); c = null; }
  c = migrarCasoLocalV11(c || c0);
  const rc = o.respC = o.respC || {};
  if (rc.teste) { rc.testes = true; delete rc.teste; }
  if (rc.infra) { if (c.internet) rc.internet = true; if (c.dispExistem) rc.dispExistem = true; delete rc.infra; }
  if (rc.arquiteturaManual) { if (c.arquitetura) rc.arquitetura = true; delete rc.arquiteturaManual; }
  delete rc.pagaDepois; delete rc.fonte;
  // PoC da v10: as confirmações do tamanho do teste passam para caso.poc
  if (c.testes.length === 1 && c.testes[0] === 'poc') ['participantes', 'meses'].forEach(k => { if (rc['piloto.' + k]) { rc['poc.' + k] = true; delete rc['piloto.' + k]; } });
  // valores que a migração preencheu (dispositivos e primeira etapa da implantação) ficam confirmados:
  // as sugestões geradas não os substituem
  if (c.dispExistem) rc.dispExistem = true;
  ['escolas', 'pessoas'].forEach(k => { if (c.implantacao && !(c.implantacao[k] === '' || c.implantacao[k] == null)) rc['implantacao.' + k] = true; });
  o.caso = c;
  if (Array.isArray(o.revisar)) o.revisar = o.revisar.filter((k: string) => !['infra', 'arquiteturaManual', 'pagaDepois', 'fonte'].includes(k));
  // fases e passos: 3.1 Escala → 4.1; 3.2 Fonte de recursos (removido) → 4.1; 3.3 → 4.2; 3.4 → 4.3
  const fe = o.feitos || {}, novoFe: Record<string, boolean> = {};
  if (fe['3c']) novoFe['4b'] = true;
  if (fe['3d']) novoFe['4c'] = true;
  Object.keys(fe).forEach(k => { if (/^(1|2)/.test(k)) novoFe[k] = fe[k]; });
  o.feitos = novoFe;
  if (o.fase === 'custo') { o.fase = 'expansao'; o.passo = ({ '3a': '4a', '3b': '4a', '3c': '4b', '3d': '4c' } as Record<string, string>)[o.passo] || '4a'; }
  o.versao = 11;
  return o;
}
// ----------------------------------------------------------- v12 → v13 (plano/10_v13_contrato.md, RQ-19)
// problemas na ordem do catálogo (antes ordemProblemas, src/fluxo.js)
export function ordemProblemas(ids: string[]) {
  const s = new Set(ids); const out: string[] = [];
  (PRIORIDADES as any[]).forEach(p => p.problemas.forEach((q: any) => { if (s.has(q.id)) out.push(q.id); }));
  return out.concat(ids.filter(k => !out.includes(k)));
}
export function migrarEstadoV13(o: any) {
  const x = o.ctx = o.ctx || {};
  const MD: any = MIGRA_DOMINIO || {}, MC: any = MIGRA_COMPS || {};
  const PP: any = PRIORIDADE_DO_PROBLEMA || {};
  const pr = new Set<string>(Array.isArray(x.prioridades) ? x.prioridades : []), pb = new Set<string>(Array.isArray(x.problemas) ? x.problemas : []);
  if (x.dominio && MD[x.dominio]) pr.add(MD[x.dominio]);
  (Array.isArray(x.comps) ? x.comps : []).forEach((k: string) => {
    if (MC[k]) pb.add(MC[k]);
    else if (k === 'digital') { pr.add('sobre'); pb.add('A1'); }
  });
  pb.forEach(id => { if (PP[id]) pr.add(PP[id]); });
  if ((x.comps || []).includes('outro') && String(x.compOutro || '').trim() && !String(x.problemaOutro || '').trim()) x.problemaOutro = x.compOutro;
  const ordP = (PRIORIDADES as any[]).map(p => p.id);
  x.prioridades = ordP.filter(id => pr.has(id));
  x.problemas = ordemProblemas([...pb]);
  x.subs = Array.isArray(x.subs) ? x.subs : [];
  if (x.problemaOutro == null) x.problemaOutro = '';
  delete x.dominio; delete x.comps; delete x.compOutro;
  const c = o.caso = o.caso || {}, rc = o.respC = o.respC || {};
  if (!Array.isArray(c.linhaBaseProblemas)) c.linhaBaseProblemas = [];
  ['linhaBaseMedida', 'linhaBaseProblemaTxt'].forEach(k => { if (c[k] == null) c[k] = ''; });
  if (!o.respDet || typeof o.respDet !== 'object') o.respDet = {};
  const cheio = (v: any) => !(v == null || v === '' || (Array.isArray(v) && !v.length));
  if (cheio(x.olhando)) rc.olhando = true;
  ['problema', 'impactos', 'resultado', 'tarefas', 'nFerramentas'].forEach(k => { if (cheio(c[k])) rc[k] = true; });
  if (o.info) Object.keys(o.info).forEach(k => { if (/^pr-/.test(k)) delete o.info[k]; });
  o.versao = 13;
  return o;
}
// ----------------------------------------------------------- v8 (formato 4) → v9 (plano, seção E.2)
export function migrarV8(o: any) {
  const c8 = Object.assign({}, o.caso || {});
  const r8: any = Object.assign({}, o.resp || {});
  const rc8 = o.respC || {};
  const ex8 = o.exemplo || 'novo';
  const resp8 = (k: string) => ex8 !== 'novo' || !!rc8[k];
  // contexto: estudantes por ano passa a ser o padrão
  const ctx = clone(o.ctx || {}); ctx.etapas = ctx.etapas || {};
  Object.keys(ctx.etapas).forEach(id => {
    const e = ctx.etapas[id] || {};
    if (e.porAno === true) e.soTotal = false; else if (+e.alunos > 0) e.soTotal = true;
    delete e.porAno;
  });
  // governança: g-equipe fundida em g-comite; orçamento vira a pergunta 3.2.2
  if (r8['g-comite'] == null && r8['g-equipe'] != null) r8['g-comite'] = r8['g-equipe'];
  const MAPA_FONTE: Record<string, string> = { sim: 'sim', parcial: 'parcial', nao: 'nao' };
  const fonte = MAPA_FONTE[r8['g-orcamento']] || MAPA_FONTE[r8['s-orcamento']] || '';
  const resp: any = {};
  Object.keys(r8).forEach(k => {
    if (['g-equipe', 'g-orcamento', 'g-avaliacao'].includes(k) || /^[rpis]-/.test(k)) return;
    resp[k] = r8[k] === 'na' ? 'nao_sei' : r8[k];
  });
  // classes técnicas → tarefas educacionais
  const cl: string[] = c8.classes || [], us: string[] = c8.usuarios || [];
  const tarefas: string[] = [];
  if (cl.some(x => x === 'tutoria' || x === 'recomendacao')) tarefas.push('tutoria');
  if (cl.some(x => x === 'previsao' || x === 'apoio')) tarefas.push('alerta_precoce');
  if (cl.includes('avaliacao')) tarefas.push('feedback_redacao');
  if (cl.some(x => x === 'automacao' || x === 'agentes')) tarefas.push('rotinas');
  if (cl.includes('classificacao') && us.includes('administrativo')) tarefas.push('duvidas');
  if (cl.includes('geracao') && !tarefas.length) tarefas.push('materiais');
  // arquitetura → adoção
  const arq = c8.arquitetura;
  const arqDef = ['saas', 'api', 'ow'].includes(arq);
  const tipoTec = arqDef ? (arq === 'ow' ? 'aberta' : 'paga') : '';
  const adaptacao = arqDef ? (arq === 'saas' ? 'integracao' : 'sob_medida') : '';
  const pagamento = c8.pilotoGratuito ? 'gratuito' : arq === 'saas' ? 'institucional' : (arq === 'api' || arq === 'ow') ? 'consumo' : '';
  const H = o.custo && o.custo.cfg && o.custo.cfg.opc && +o.custo.cfg.opc.H;
  const p8 = o.piloto || {};
  const caso: any = Object.assign({}, c8, {
    tarefas, tipoTec, adaptacao, pagamento, licenca: '', arquiteturaManual: arqDef ? arq : '',
    piloto: { escolas: p8.escolas == null ? '' : p8.escolas, participantes: p8.participantes == null ? '' : p8.participantes, meses: p8.meses == null ? '' : p8.meses },
    teste: c8.situacao === 'testar' ? 'recomendar' : 'piloto',
    situacao: c8.situacao === 'testar' ? 'nova' : c8.situacao === 'incidente' ? 'renovar' : (c8.situacao || 'nova'),
    alternativa: c8.alternativaSemIA === true ? 'sim' : c8.alternativaSemIA === false ? 'nao' : '',
    horizonte: H > 0 ? H : 3, expansao: 'ano1', fonte,
    // num caso em branco, o padrão de 1.000 elegíveis da v8 não foi uma resposta
    elegiveis: resp8('elegiveis') && +c8.elegiveis > 0 ? +c8.elegiveis : '',
  });
  // R8 (REC-52): três das perguntas de risco da v8 voltam como perguntas do Refinar com o mesmo domínio de respostas
  // (treino; contestacao → contestacaoExiste; verificabilidade → verificacao). vulneraveis e idiomas eram sim/não e não viram chips.
  const pelaLista = (L: any[], v: any) => (idsDe(L).includes(String(v)) ? String(v) : '');
  // só o que a pessoa respondeu (ou o exemplo trazia): num caso em branco, os valores da v8 eram premissas e não respostas
  const resposta8 = (L: any[], k: string, v: any) => (resp8(k) ? pelaLista(L, v) : '');
  const treino = resposta8(OPC_TREINO, 'treino', c8.treino), contestacao = resposta8(OPC_CONTESTACAO_EXISTE, 'contestacao', c8.contestacao),
    verificacao = resposta8(OPC_VERIFICACAO, 'verificabilidade', c8.verificabilidade);
  ['populacao', 'capacidade', 'classes', 'autonomia', 'dados', 'treino', 'vulneraveis', 'idiomas', 'verificabilidade', 'contestacao',
    'reversibilidade', 'cumulativo', 'alcance', 'arquitetura', 'pilotoGratuito', 'alternativaSemIA'].forEach(k => { delete caso[k]; });
  Object.assign(caso, { treino, contestacaoExiste: contestacao, verificacao });
  // respC: campos que continuam + os que vieram de valores respondidos
  const respC: Record<string, boolean> = {};
  Object.keys(rc8).forEach(k => { if (rc8[k] && k in CASO_VAZIO && k !== 'treino') respC[k] = true; });
  if (treino) respC.treino = true;
  if (contestacao) respC.contestacaoExiste = true;
  if (verificacao) respC.verificacao = true;
  if (resp8('alternativaSemIA')) respC.alternativa = true;
  if (tarefas.length && resp8('classes')) respC.tarefas = true;
  if (tipoTec && resp8('arquitetura')) { respC.tipoTec = true; respC.adaptacao = true; respC.arquiteturaManual = true; }
  if (pagamento && (resp8('arquitetura') || (c8.pilotoGratuito && resp8('pilotoGratuito')))) respC.pagamento = true;
  if (resp8('situacao')) respC.teste = true;
  if (fonte) respC.fonte = true;
  if (['escolas', 'participantes', 'meses'].some(k => +p8[k] > 0)) respC.piloto = true;
  ['escolas', 'participantes', 'meses'].forEach(k => { if (+p8[k] > 0) respC['piloto.' + k] = true; });
  // exemplos da v8: as respostas do exemplo ficam confirmadas (as sugestões da v10 não as substituem)
  if (ex8 !== 'novo') confirmarGerados(caso, respC);
  return {
    versao: 9, v10: true, caso, ctx, resp, respC, feitos: {},
    exemplo: ex8 === 'novo' ? 'novo' : 'editado',
    fase: 'contexto', passo: '1a', vista: '', boasVindas: o.boasVindas === true, info: {},
    custo: { base: 'caso', cfg: null, editado: false },
    moeda: o.moeda || { cod: 'USD', taxa: '' }, lang: o.lang || '',
  };
}

// ----------------------------------------------------------- perguntas novas do Refinar (R8, REC-52)
// As 13 respostas novas (CASO_VAZIO) chegam de arquivos antigos em branco e de arquivos editados à mão em qualquer formato: aqui
// cada uma volta ao formato que as regras e o motor leem; o que não é um id conhecido vira "não informado" (vazio).
const idsDe = (L: any[]) => (L as any[]).map(o => String(o[0]));
const ENUMS_REC: Record<string, string[]> = {
  contestacaoExiste: idsDe(OPC_CONTESTACAO_EXISTE), treino: idsDe(OPC_TREINO), verificacao: idsDe(OPC_VERIFICACAO), instrumentoTeste: idsDe(OPC_INSTRUMENTO_TESTE),
  estrategiaCompra: idsDe(OPC_ESTRATEGIA_COMPRA), dotacao: idsDe(OPC_DOTACAO), tempoJornada: idsDe(OPC_TEMPO_JORNADA), momentoUso: idsDe(OPC_MOMENTO_USO),
};
// apoioEscola é lido por prefixo (ninguem, nenhum, nao = sem referência): fica o que a lista conhece
ENUMS_REC.apoioEscola = idsDe(OPC_APOIO_ESCOLA);
const numOuVazio = (v: any): number | '' => (v === '' || v == null || !isFinite(+v) ? '' : Math.max(0, +v));
const faixaNormal = (x: any) => {
  if (x != null && typeof x === 'object') return { min: numOuVazio(x.min), provavel: numOuVazio(x.provavel != null ? x.provavel : x.valor), max: numOuVazio(x.max) };
  return { min: '', provavel: numOuVazio(x), max: '' };
};
/** Completa e normaliza as respostas novas do Refinar no caso (no lugar). Não mexe em nada que já esteja no formato certo. */
export function normalizarRespostasRec(c: any): any {
  Object.keys(ENUMS_REC).forEach(k => { if (!ENUMS_REC[k].includes(String(c[k]))) c[k] = ''; });
  // publico: lista de ids conhecidos, na ordem do catálogo; "nenhum" e "não sei" não se combinam com os grupos
  const bruto: any[] = Array.isArray(c.publico) ? c.publico : (typeof c.publico === 'string' && c.publico ? [c.publico] : []);
  const ordem = idsDe(OPC_PUBLICO), excl = ['nenhum', 'nao_sei'];
  const set = new Set(bruto.map(String).filter(v => ordem.includes(v)));
  const grupos = ordem.filter(v => set.has(v) && !excl.includes(v));
  c.publico = grupos.length ? grupos : ordem.filter(v => set.has(v)).slice(0, 1);
  const a = c.altCustoEfeito && typeof c.altCustoEfeito === 'object' ? c.altCustoEfeito : {};
  c.altCustoEfeito = { custo: faixaNormal(a.custo), efeito: faixaNormal(a.efeito) };
  const v = c.volumeResultado;
  if (v != null && typeof v === 'object' && !Array.isArray(v)) {
    c.volumeResultado = { unidade: idsDe(OPC_UNIDADE_RESULTADO).includes(String(v.unidade)) ? String(v.unidade) : '', volume: numOuVazio(v.volume), periodo: v.periodo === 'ano' ? 'ano' : 'mes' };
  } else {
    // um número solto vale como solicitações por mês (o formato que rec_numeros.js também aceita)
    const x = numOuVazio(v);
    c.volumeResultado = { unidade: x === '' ? '' : 'solicitacoes', volume: x, periodo: 'mes' };
  }
  const r = c.revisao && typeof c.revisao === 'object' ? c.revisao : {};
  const tx = numOuVazio(r.taxaAlerta);
  c.revisao = { taxaAlerta: tx === '' ? '' : Math.min(100, tx), minutos: numOuVazio(r.minutos) };
  return c;
}

// ----------------------------------------------------------- normalização (v9 → v10 → v11 → v13)
// completa o estado com os valores padrão e retira o que não existe mais; `o.versao` diz de onde vem
export function normalizarEstado(o: any) {
  // antes da v10, pagamento, licença, tamanho do teste e pessoas na rede só tinham valor quando respondidos:
  // ficam confirmados, para que as sugestões geradas não os substituam
  o.caso = o.caso || {}; o.respC = o.respC || {};
  if (!o.v10) { confirmarGerados(o.caso, o.respC); o.v10 = true; }
  if (!(+o.versao >= 11)) migrarEstadoV11(o);
  if (+o.versao < 13) migrarEstadoV13(o);
  o.versao = 13;
  o.caso = Object.assign(clone(CASO_VAZIO), o.caso || {});
  o.caso.piloto = Object.assign({ escolas: '', participantes: '', meses: '' }, o.caso.piloto || {});
  o.caso.poc = Object.assign({ participantes: '', meses: '' }, o.caso.poc || {});
  o.caso.implantacao = Object.assign({ escolas: '', pessoas: '' }, o.caso.implantacao || {});
  normalizarRespostasRec(o.caso);   // R8: perguntas novas do Refinar em branco ou em formato antigo
  if (!Array.isArray(o.caso.testes)) o.caso.testes = [];
  if (!Array.isArray(o.caso.ferramentas)) o.caso.ferramentas = [];
  ['pagaDepois', 'fonte', 'infra', 'arquiteturaManual'].forEach(k => { delete o.caso[k]; });
  if (!Array.isArray(o.caso.linhaBaseProblemas)) o.caso.linhaBaseProblemas = [];
  // 0.0.15 (REF-11): país da rede (ISO3, 'outro' ou '') e valores do perfil do país editados pela pessoa
  if (typeof o.caso.pais !== 'string') o.caso.pais = '';
  if (!o.caso.editados || typeof o.caso.editados !== 'object' || Array.isArray(o.caso.editados)) o.caso.editados = {};
  o.ctx = o.ctx || {}; o.resp = o.resp || {}; o.feitos = o.feitos || {};
  o.respDet = o.respDet && typeof o.respDet === 'object' ? o.respDet : {};
  ['prioridades', 'problemas', 'subs'].forEach(k => { if (!Array.isArray(o.ctx[k])) o.ctx[k] = []; });
  if (o.ctx.problemaOutro == null) o.ctx.problemaOutro = '';
  if (!o.ctx.etapas || typeof o.ctx.etapas !== 'object') o.ctx.etapas = {};
  o.custo = o.custo || { base: 'caso', cfg: null, editado: false };
  o.moeda = o.moeda || { cod: 'USD', taxa: '' };
  o.revisar = Array.isArray(o.revisar) ? o.revisar : [];
  ['piloto', 'pular', 'checks', 'sub', 'tab', 'dimAberta', 'pdAberto', 'fase', 'passo', 'vista', 'boasVindas', 'info'].forEach(k => { delete o[k]; });
  return o;
}

/** O estado tem alguma resposta dada pela pessoa (ou é um exemplo)? (porta de temRespostas, src/app.js) */
export function temRespostas(o: any): boolean {
  if (!o || !o.caso) return false;
  if (o.exemplo && o.exemplo !== 'novo') return true;
  if (Object.keys(o.respC || {}).some(k => o.respC[k])) return true;
  if (Object.keys(o.resp || {}).some(k => o.resp[k])) return true;
  if (o.origem && Object.keys(o.origem).some(k => o.origem[k] === 'informado' || o.origem[k] === 'refinado')) return true;
  const x = o.ctx || {}, c = o.caso;
  if (x.nivel || x.local || x.olhando || x.problemaOutro || ['prioridades', 'problemas', 'subs'].some(k => (x[k] || []).length) || Object.values(x.etapas || {}).some((e: any) => e && e.on)) return true;
  if (Object.values(o.respDet || {}).some((d: any) => d && (String(d.qual || '').trim() || String(d.falta || '').trim()))) return true;
  return ['titulo', 'problema', 'resultado', 'linhaBaseMedida', 'linhaBaseProblemaTxt', 'teste', 'tipoTec', 'pagamento', 'licenca', 'elegiveis', 'nFerramentas', 'conheceFerramentas', 'internet', 'modeloDisp', 'formacaoFormato', 'formacaoPaga', 'suporteQuem', 'suporteNivel', 'acompanhamento', 'arquitetura'].some(k => c[k]) || ['tarefas', 'impactos', 'usuarios', 'testes', 'ferramentas', 'formados', 'formacaoTipo', 'linhaBaseProblemas'].some(k => (c[k] || []).length);
}

// ----------------------------------------------------------- origem
/** chaves que têm origem: campos de CAMPOS (caso e ctx), subcampos 'piloto.escolas'… e as perguntas g-* */
export function chavesOrigem(): string[] {
  const L: string[] = [];
  (CAMPOS as any[]).forEach(f => { if (f.onde !== 'resp') L.push(f.id); });
  Object.keys(SUB_OBJ).forEach(o => (SUB_OBJ as any)[o].forEach((k: string) => L.push(o + '.' + k)));
  (QUESTOES_G as any[]).forEach(q => L.push(q.id));
  return L;
}
function valorDe(o: any, chave: string) {
  if (/^g-/.test(chave)) return (o.resp || {})[chave];
  const [a, b] = chave.split('.');
  const f = (CAMPO_POR_ID as any)[a];
  const cont = f && f.onde === 'ctx' ? (o.ctx || {}) : (o.caso || {});
  return b ? ((cont[a] || {})[b]) : cont[a];
}
function valorPadrao(chave: string) {
  if (/^g-/.test(chave)) return undefined;
  const [a, b] = chave.split('.');
  const f = (CAMPO_POR_ID as any)[a];
  if (f && f.onde === 'ctx') return f.tipo === 'etapas' || f.tipo === 'grade' ? {} : (f.tipo === 'prior' || f.tipo === 'problemas') ? [] : '';
  const v = (CASO_VAZIO as any)[a];
  return b ? (v || {})[b] : v;
}
/** origem de um campo pela regra da spec (estado v13): respC → informado; valor ≠ padrão e não confirmado → sugerido; senão padrao */
export function origemDerivada(o: any, chave: string): Origem {
  if (/^g-/.test(chave)) return (o.resp || {})[chave] ? 'informado' : 'padrao';
  if ((o.respC || {})[chave]) return 'informado';
  const v = valorDe(o, chave), p = valorPadrao(chave);
  const f = (CAMPO_POR_ID as any)[chave];
  if (f && (f.tipo === 'etapas' || f.tipo === 'grade')) return Object.values(v || {}).some((e: any) => e && (e.on || +e.escolas > 0 || +e.alunos > 0)) ? 'sugerido' : 'padrao';
  if (vazio(v) && vazio(p)) return 'padrao';
  return igual(v, p) ? 'padrao' : 'sugerido';
}
export function derivarOrigem(o: any, existente?: Record<string, Origem>): Record<string, Origem> {
  const out: Record<string, Origem> = {};
  chavesOrigem().forEach(k => {
    const e = existente && existente[k];
    out[k] = e && ['padrao', 'sugerido', 'informado', 'refinado'].includes(e) ? e : origemDerivada(o, k);
  });
  // chaves extras já registradas (campos fora de CAMPOS) ficam
  if (existente) Object.keys(existente).forEach(k => { if (!(k in out) && existente[k]) out[k] = existente[k]; });
  return out;
}
/** respC derivado de origem (compatibilidade com a v13: informado/refinado = confirmado) */
export function respCDeOrigem(origem: Record<string, Origem>, anterior?: Record<string, boolean>): Record<string, boolean> {
  const out: Record<string, boolean> = Object.assign({}, anterior || {});
  Object.keys(origem).forEach(k => { if (/^g-/.test(k)) return; if (origem[k] === 'informado' || origem[k] === 'refinado') out[k] = true; else delete out[k]; });
  return out;
}

// ----------------------------------------------------------- calculadora (CUS-27)
// Estado de exibição da calculadora da v13 (estadoCusto, custos_ui.js) e da tela Refinar da v14: conta, modo
// avançado, nós abertos da árvore, alternativas, λ, estratos de equidade e o aviso de edições pendentes.
// Só os campos conhecidos, com o tipo conferido; o resto é descartado.
const ehNum = (v: any) => v === '' || (typeof v === 'number' && isFinite(v));
export function calcImportado(c: any): Record<string, any> {
  const out: Record<string, any> = {};
  if (!c || typeof c !== 'object') return out;
  if (c.conta === 'eco' || c.conta === 'fin') out.conta = c.conta;
  if (typeof c.avancado === 'boolean') out.avancado = c.avancado;
  if (c.pendente === true) out.pendente = true;
  if (c.abertos && typeof c.abertos === 'object' && !Array.isArray(c.abertos)) out.abertos = Object.fromEntries(Object.entries(c.abertos).filter(([, v]) => typeof v === 'boolean'));
  if (Array.isArray(c.alts)) out.alts = c.alts.filter((a: any) => a && typeof a === 'object').map((a: any) => ({ nome: String(a.nome ?? ''), impl: num(a.impl), anual: num(a.anual), fte: num(a.fte), efeito: num(a.efeito) }));
  if (ehNum(c.lambda) || typeof c.lambda === 'string') out.lambda = num(c.lambda);
  if (Array.isArray(c.estratos) && c.estratos.length) out.estratos = c.estratos.filter((z: any) => z && typeof z === 'object').map((z: any) => ({ nome: String(z.nome ?? ''), part: +z.part || 0, fK1: +z.fK1 || 1, fK4: +z.fK4 || 1 }));
  if (c.refAlt === null || (typeof c.refAlt === 'number' && c.refAlt >= 0)) out.refAlt = c.refAlt;
  if (c.efeitoCaso != null) out.efeitoCaso = num(c.efeitoCaso);
  ['lmdi0', 'lmdi1'].forEach(k => { if (typeof c[k] === 'number' && c[k] >= 0) out[k] = c[k]; });
  return out;
}
function num(v: any): number | '' {
  if (v === '' || v == null) return '';
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return isFinite(n) ? n : '';
}

// ----------------------------------------------------------- porta de entrada
function ehV8(o: any) {
  if (o.app === APP_V8) return true;
  if (o.app === APP_ID || o.formato != null) return false;
  const c = o.caso || {};
  return 'classes' in c || 'alternativaSemIA' in c || 'populacao' in c || 'capacidade' in c;
}
/** Converte qualquer caso aceito (JSON exportado, estado do localStorage, v8) no estado v14. Lança ErroImportacao. */
export function migrar(json: any): Estado14 {
  let o: any = json;
  if (typeof o === 'string') { try { o = JSON.parse(o); } catch (e) { throw new ErroImportacao('O texto não é um JSON válido.'); } }
  if (!o || typeof o !== 'object' || Array.isArray(o)) throw new ErroImportacao('O arquivo não é um caso exportado pela ferramenta (esperava um objeto JSON).');
  if (!o.caso || typeof o.caso !== 'object') throw new ErroImportacao('O arquivo não é um caso exportado pela ferramenta (falta a chave "caso").');
  if (o.app != null && o.app !== APP_ID && o.app !== APP_V8) throw new ErroImportacao(`O arquivo pertence a outro aplicativo ("${o.app}").`);
  if (o.app === APP_ID && o.formato != null && !FORMATOS_ACEITOS.includes(+o.formato)) throw new ErroImportacao(`Formato ${o.formato} não é aceito (aceitos: ${FORMATOS_ACEITOS.join(', ')}).`);
  let migrouV8 = false;
  if (ehV8(o)) { o = migrarV8(o); migrouV8 = true; }
  else {
    o = clone(o);
    // formato 9 (v9 e v10) passa pela migração v10 → v11; 9 e 11 (v11 e v12) pela v12 → v13 (aplicarImportado, src/app.js)
    const f = +o.formato;
    o.versao = f === 14 ? 14 : f === 13 ? 13 : f === 11 || +o.versao === 11 ? 11 : (+o.versao === 13 ? 13 : +o.versao === 14 ? 14 : 9);
    o.v10 = !!o.v10;
  }
  const origemAntes: Record<string, Origem> | undefined = o.origem && typeof o.origem === 'object' ? o.origem : undefined;
  const versaoAntes = +o.versao;
  normalizarEstado(o);
  const e = estadoInicial();
  const origem = derivarOrigem(o, versaoAntes >= 14 ? origemAntes : undefined);
  const out: Estado14 = {
    ...e,
    caso: o.caso, ctx: o.ctx, resp: o.resp, respDet: o.respDet, revisar: o.revisar, feitos: o.feitos || {},
    mantidas: o.mantidas && typeof o.mantidas === 'object' && !Array.isArray(o.mantidas) ? o.mantidas : {},
    custo: o.custo && typeof o.custo === 'object' ? { ...calcImportado(o.custo), base: o.custo.base || 'caso', cfg: o.custo.cfg || null, editado: !!o.custo.editado } : e.custo,
    moeda: o.moeda && o.moeda.cod ? o.moeda : e.moeda, lang: typeof o.lang === 'string' ? o.lang : '',
    exemplo: o.exemplo === 'novo' || !o.exemplo ? 'novo' : (migrouV8 ? 'editado' : (['A', 'B', 'C', 'D'].includes(o.exemplo) && (CASOS as any)[o.exemplo] ? o.exemplo : 'editado')),
    origem, sugestoes: o.sugestoes && typeof o.sugestoes === 'object' ? o.sugestoes : {},
    modo: o.modo === 'refinar' ? 'refinar' : 'essencial',
    capitulo: o.capitulo && [1, 2, 3, 4].includes(+o.capitulo.atual) ? { atual: +o.capitulo.atual as 1 | 2 | 3 | 4, pergunta: String(o.capitulo.pergunta || '') } : e.capitulo,
  };
  out.respC = respCDeOrigem(origem, o.respC);
  // um cfg editado na calculadora só vale se veio do caso; presets voltam a ser montados
  if (out.custo.cfg && !out.custo.editado) out.custo.cfg = null;
  if (!out.custo.cfg) delete (out.custo as any).pendente;
  return out;
}
