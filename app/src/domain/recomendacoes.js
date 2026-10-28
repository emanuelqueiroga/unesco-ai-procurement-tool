// =====================================================================
// Recomendações do caso: motor que transforma as respostas DESTE caso em ações (v10–v13; pacote R2 do sistema de
// recomendações, design/redesign/05-requisitos-recomendacoes.md, seções 3 e 6).
// O catálogo de regras fica em ./regras/ (um arquivo por pacote, formato e lint em regras/index.js e regras/lint.js);
// aqui ficam o contexto das regras (recContexto), a avaliação e a saída pública; a pontuação, os cartões, o veredito
// e os grupos (pacote R3) vêm de rec_selecao.js:
//   resultadoRecomendacoes(estado) → { recs, pend, suspensas, proxMarco, nivel, forma, arqEf, arqPresumida,
//                                      cartoes, veredito, avisoCondicoes, grupos, baseComum, condicoes, vazio }
//   recomendacoesCaso(estado)      → recs (a mesma lista; é o que as telas e o PDF já usam)
// Cada item de `recs` (ordem da seção 4.1: pontos, marco mais próximo, pacote e número do R-nn; nunca a posição
// no catálogo):
//   id ('R-26'), versao, pacote, lente, titulo (do pacote), tipo ('custo'|'politica'|'uso'), substitui, variante,
//   oque, razao, como[], paraque, pronto (textos em português, com os marcadores {…} preenchidos),
//   quem[] (códigos de 3.4) e quemRot[] (rótulos), marco ('M1'..'M5') e marcoNome, pd, condicao (bool),
//   nivel ('condicao'|'recomendada'|'acompanhar') e rotuloNivel ("Condição para autorizar o teste"; rotuloNivel(item, true)
//   traduz), pontos (0–14) e criterio { bloqueio, pessoas, dinheiro, urgencia, dependencia, especificidade, semNumero }
//   (4.1, auditoria), curto, depende, numero, exige, semExige, indicador, base, exemplosNorma,
//   provisoria, etiqueta ("(presumida: confirme na 3.2.1)" ou ''), confirmar ("(a confirmar na pergunta n)" ou ''),
//   generica, semNumero,
//   origem { campo, n, pergunta, resposta, sugerido } (a pergunta e a resposta que dispararam a regra),
//   chaves { oque, razao, como, paraque, pronto, vars } (para traduzir: trRec(item, campo)),
//   e os campos antigos, mantidos até o pacote R6: quando ('antes_teste'|'antes_contratar'|'manter', do marco),
//   prioridade (do nível: 'alta' = Condição, 'media' = as outras; PRIO_REC dá 'Condição' ou 'Recomendada', nunca
//   "Alta"/"Média"; para os três níveis use `nivel` e `rotuloNivel`), texto (= oque), porque (= origem, sem o campo), ir ('fase:passo:n').
// O texto em português é a chave de tradução (tr no domínio, t nas telas).
// Reimplementação: só a parte pura (sem DOM); a global S virou o parâmetro `estado`.
// =====================================================================
import { OPC, tarefasDe, recomendarTeste, fmtInt, formaSupervisao, alertas, arquiteturaEscolhida } from './framework.js';
import { numerosRec } from './rec_numeros.js';
import { horasFormacaoEstimada } from './casos.js';
import { clone } from './custos.js';
import { PRIORIDADES, problemasMarcados, sugestoesProblemas, temLacuna } from './prioridades.js';
import { CAMPOS } from './fluxo_dados.js';
import { tr, LOC } from './i18n.js';
import { CAMPO_POR_ID, respondido, listaOpc, textoCampo, sugerido, fasePasso, casoAtual, perfil, cfgAtual, numerosCusto } from './fluxo.js';
import {
  REGRAS, REGRA_POR_ID, PENDENCIAS, PACOTES, LENTES, AREAS, MARCOS, EXIGE, ORDEM_PACOTE, ORDEM_MARCO, LENTE_PACOTE, TITULO_PACOTE,
  NOME_MARCO, QUANDO_MARCO, mapaLegado, textosRegras,
} from './regras/index.js';
import { lintRegra, lintCatalogo } from './regras/lint.js';
import {
  pontuar, compararPontos, selecao, rotuloNivel, rotuloNivelCurto, trVeredito, trAviso, pendenciasSugeridas as pendenciasSugeridasSel, TEXTOS_REC_R3 as TEXTOS_SEL_R3,
} from './rec_selecao.js';

const QUANDO_REC = [['antes_teste', 'Antes do teste'], ['antes_contratar', 'Antes de contratar'], ['manter', 'Para manter e ampliar']];
const TIPO_REC = { custo: 'Custo e compra', politica: 'Política e governança' };
// rótulo do nível pelo campo de compatibilidade `prioridade` (REC-19: sem "Alta", "Média" nem "Normal")
const PRIO_REC = { alta: 'Condição', media: 'Recomendada', condicao: 'Condição', recomendada: 'Recomendada', acompanhar: 'Para acompanhar' };
const TIT_REC = 'Recomendações para você';
const TXT_REC = {
  intro: 'Ações para este caso, geradas a partir das suas respostas. Comece pelas condições. Cada ação mostra a pergunta e a resposta que a originou: se mudar a resposta, a lista muda.',
  introPlano: 'Ações geradas a partir das respostas deste caso, por momento e prioridade. As listas do guia, nas seções seguintes, servem de referência completa.',
  vazio: 'Ainda não há respostas suficientes para recomendar ações. Responda às perguntas das fases 1 a 4.',
  negrito: 'Em negrito: condições para avançar.',
  ir: 'Ir à pergunta',
  porque: 'Por quê:',
};

// ----------------------------------------------------------- respostas
// Valor respondido de um campo ('' se não respondido). Campos com valor padrão só contam depois que a pessoa responde.
function recValor(id, estado) {
  const f = (typeof CAMPO_POR_ID !== 'undefined' && CAMPO_POR_ID[id]) || null;
  const onde = f ? f.onde : 'caso';
  const v = onde === 'resp' ? (estado.resp || {})[id] : onde === 'ctx' ? (estado.ctx || {})[id] : (estado.caso || {})[id];
  if (v == null || v === '' || (Array.isArray(v) && !v.length)) return '';
  if (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).some(k => v[k] !== '' && v[k] != null)) return '';
  if (f && f.padrao && typeof respondido === 'function' && !respondido(id, estado)) return '';
  return v;
}
// v13: perguntas 1.2.1 e 1.2.2 (criadas no percurso pelo pacote B1); enquanto não estiverem em CAMPOS, estes dados bastam
const REC_CAMPO_V13 = {
  prioridades: { passo: '1b', n: '1.2.1', id: 'prioridades', onde: 'ctx', t: 'Qual é a prioridade da sua rede para a IA na educação?' },
  problemas: { passo: '1b', n: '1.2.2', id: 'problemas', onde: 'ctx', t: 'Quais problemas você quer resolver?' },
};
function recCampo(id) {
  const ach = x => (typeof CAMPO_POR_ID !== 'undefined' && CAMPO_POR_ID[x]) || (typeof CAMPOS !== 'undefined' ? CAMPOS.find(f => f.id === x) : null);
  return ach(id) || (id === 'testes' ? ach('teste') : null) || REC_CAMPO_V13[id] || null;
}
function recOpcoes(f, id) {
  if (!f) return (typeof OPC !== 'undefined' && id && OPC[id]) || [];
  const L = typeof listaOpc === 'function' ? listaOpc(f) : typeof f.opc === 'string' ? ((typeof OPC !== 'undefined' && OPC[f.opc]) || []) : (f.opc || []);
  // perguntas sem lista própria (3.2.1 é do tipo 'arq'): as opções de OPC com o mesmo id (REC-10: nunca "nao_sei" cru)
  return L.length ? L : ((typeof OPC !== 'undefined' && OPC[f.id || id]) || []);
}
// Rótulo (PT) de cada valor da resposta
// Rótulo (PT) de cada valor da resposta
function recRotulos(id, vals, estado) {
  const f = recCampo(id); let L = recOpcoes(f, id);
  if (!L.length && id === 'testes' && typeof OPC !== 'undefined') L = OPC.teste || [];
  const c = (estado || {}).caso || {};
  return [].concat(vals == null ? [] : vals).map(v => {
    if (id === 'tarefas' && v === 'outra' && c.tarefaOutra) return c.tarefaOutra;
    const o = L.find(x => String(x[0]) === String(v));
    return o ? o[1] : v === 'nao_sei' ? 'Não sei' : String(v);
  }).filter(Boolean);
}
function recIr(f) {
  if (!f) return '';
  const fase = typeof fasePasso === 'function' ? fasePasso(f.passo) : '';
  return fase ? fase + ':' + f.passo + ':' + String(f.n).replace(/\./g, '-') : '';
}
function recPorque(id, vals, estado) {
  const f = recCampo(id);
  if (!f) return { n: '', pergunta: '', resposta: '' };
  const pergunta = typeof textoCampo === 'function' ? textoCampo(f, (estado || {}).caso) : f.t;
  // resposta ainda sugerida (pré-marcada pela ferramenta e não confirmada pela pessoa)
  let sug = false;
  try { sug = typeof sugerido === 'function' && !!sugerido(f, estado || {}); } catch (e) { }
  return { n: f.n, pergunta, resposta: recRotulos(id, vals, estado).join('; '), sugerido: sug };
}

// ----------------------------------------------------------- contexto das regras
const fmtR = x => (typeof fmtInt === 'function' ? fmtInt(x) : String(Math.round(+x || 0)));
// 2.0: lista de testes marcados (v11) → 'poc' | 'piloto' | 'ambos' | 'recomendar' | ''
function recTestes(c) {
  c = c || {};
  if (Array.isArray(c.testes) && c.testes.length) return c.testes.slice();
  return c.teste && c.teste !== 'ambos' ? [c.teste] : c.teste === 'ambos' ? ['poc', 'piloto'] : [];
}
function recTesteDe(c) {
  const T = recTestes(c);
  if (T.includes('recomendar')) return 'recomendar';
  if (T.includes('poc') && T.includes('piloto')) return 'ambos';
  return T[0] || '';
}
// ferramentas com nome (2.3.3), só quando a pessoa disse que já sabe quais são
const recPagaFerr = f => ['usuario', 'institucional', 'consumo'].includes(f.pagamento) || (f.tipoTec === 'paga' && !['gratuito', 'incluida'].includes(f.pagamento));
function recFerramentas(c) {
  return (Array.isArray(c.ferramentas) ? c.ferramentas : []).filter(f => f && String(f.nome || '').trim())
    .map(f => Object.assign({}, f, { nome: String(f.nome).trim() }));
}
function recContexto(estado) {
  const c = estado.caso || {};
  let ce = c;
  try { ce = casoAtual(estado); } catch (e) { console.warn(e); }
  let rec = { modo: 'piloto' };
  try { rec = recomendarTeste(ce) || rec; } catch (e) { }
  let p = null;
  try { p = typeof perfil === 'function' ? perfil(estado) : null; } catch (e) { }
  const v = id => recValor(id, estado);
  const arr = id => { const x = v(id); return Array.isArray(x) ? x : x ? [x] : []; };
  const testes = v('testes') ? recTestes(c) : (v('teste') ? recTestes({ teste: c.teste }) : []);
  const teste = testes.length ? recTesteDe({ testes }) : '';
  const modo = teste === 'poc' ? 'poc' : (teste === 'recomendar' || !teste) && rec.modo === 'poc' ? 'poc' : 'piloto';
  const peso = k => ((typeof OPC !== 'undefined' ? OPC.consequencias : []).find(x => x[0] === k) || [0, 0, 0])[2];
  const cons = ce.consequencias || [];
  const consDecide = cons.filter(k => peso(k) >= 2);
  const pesoMax = Math.max(0, ...cons.map(peso));
  // dados pessoais de estudantes: vêm das tarefas (2.1.1) ou de estudantes como usuários (2.2.1)
  const dadosEst = (ce.dados || []).some(d => d === 'pessoais_est' || d === 'sensiveis');
  const T = typeof tarefasDe === 'function' ? tarefasDe(c.tarefas) : [];
  const tDados = T.filter(t => (t.dados || []).some(d => d === 'pessoais_est' || d === 'sensiveis')).map(t => t.id);
  const usaEst = (ce.usuarios || []).includes('estudantes');
  const campoDados = tDados.length || !usaEst ? 'tarefas' : 'usuarios';
  const valsDados = campoDados === 'usuarios' ? ['estudantes'] : (tDados.length ? tDados : c.tarefas || []);
  const eleg = +v('elegiveis') || 0;
  // ferramentas
  const ferr = v('conheceFerramentas') === 'sim' ? recFerramentas(c) : [];
  // a primeira ferramenta é a principal: tecnologia e pagamento vêm das perguntas 2.3.4 e 2.3.5
  if (ferr[0]) { if (c.tipoTec) ferr[0].tipoTec = c.tipoTec; if (c.pagamento) ferr[0].pagamento = c.pagamento; }
  const variasFerr = ferr.length > 1 || ['2', '3mais'].includes(v('nFerramentas'));
  const vistas = {}; let sobrepostas = false;
  ferr.forEach(f => (f.tarefas || []).forEach(t => { if (vistas[t]) sobrepostas = true; vistas[t] = true; }));
  // preço por usuário por mês: só faz sentido para licença por usuário ou assinatura institucional
  const semPreco = ferr.filter(f => recPagaFerr(f) && f.pagamento !== 'consumo' && !(+f.preco > 0));
  // internet: com "Parcialmente", cita também quantas escolas já têm internet adequada
  const escI = +c.escolasInternet || 0;
  const valsInternet = [v('internet')].concat(v('internet') === 'parcial' && escI > 0 ? [tr('{0} escolas com internet adequada'.replace('{0}', fmtR(escI)))] : []).filter(Boolean);
  // horas de formação
  let h = +c.formacaoHoras || 0;
  if (c.formacaoEstimativa) { try { h = typeof horasFormacaoEstimada === 'function' ? horasFormacaoEstimada(ce) : h; } catch (e) { } }
  // horas com até uma casa decimal ("1,5 horas por pessoa", e não "2"): a estimativa por tarefa pode dar meia hora
  const fmtH = x => (+x || 0).toLocaleString(LOC(), { maximumFractionDigits: 1 });
  const valHoras = h ? tr((c.formacaoEstimativa ? '{0} horas por pessoa (estimativa)' : '{0} horas por pessoa').replace('{0}', fmtH(h))) : '';
  // primeira etapa da implantação (3.1)
  const im = c.implantacao || {};
  const implP = +im.pessoas || 0, implE = +im.escolas || 0;
  const valImpl = implE ? tr('{0} escolas e {1} pessoas'.replace('{0}', fmtR(implE)).replace('{1}', fmtR(implP))) : implP ? tr('{0} pessoas'.replace('{0}', fmtR(implP))) : '';
  const implTudo = implP > 0 && eleg > 0 && implP >= 0.8 * eleg;
  const valEleg = eleg ? tr('{0} pessoas'.replace('{0}', fmtR(eleg))) : '';
  // v13: prioridades e problemas do passo 1.2 (estado.ctx.prioridades, estado.ctx.problemas; leitura defensiva)
  const x = estado.ctx || {};
  const probs = typeof problemasMarcados === 'function' ? problemasMarcados(x) : [];
  let sp = null;
  try { sp = typeof sugestoesProblemas === 'function' ? sugestoesProblemas(x) : null; } catch (e) { console.warn(e); }
  // formação: vem dos problemas marcados que a pedem ou de uma prioridade marcada que a pede
  const pForm = probs.filter(q => q.formacao);
  const prForm = typeof PRIORIDADES !== 'undefined' ? PRIORIDADES.filter(z => z.formacao && (x.prioridades || []).includes(z.id)) : [];
  const formacaoDe = pForm.length ? { campo: 'problemas', vals: pForm.map(q => q.t) } : { campo: 'prioridades', vals: prForm.map(z => z.nome) };
  const metasLacuna = typeof temLacuna === 'function' && temLacuna(c.resultado);
  const medidaBase = String(c.linhaBaseMedida || '').trim();
  // R2 (REC-17): perfil de risco, supervisão, alertas, arquitetura efetiva, classes, escala e situação
  const nivel = p ? p.agregado : '';
  let forma = '';
  try { forma = p ? formaSupervisao(ce, p) : ''; } catch (e) { console.warn(e); }
  let als = [];
  try { als = p ? alertas(ce, p) : []; } catch (e) { console.warn(e); }
  // 'ow_api' (modelo aberto servido por API de terceiros) segue as regras de API; 'preditivo' ainda não tem exemplo de
  // partida no motor e usa a arquitetura presumida (R8)
  const arqEf = c.arquitetura === 'ow_api' ? 'api' : ['saas', 'api', 'ow'].includes(ce.arquitetura) ? ce.arquitetura : 'saas';
  const arqPresumida = !arquiteturaEscolhida(c);
  const usuarios = ce.usuarios || [], afetados = ce.afetados || [];
  const impactos = arr('impactos');
  const situacao = String(c.situacao || '');
  const temPiloto = ['piloto', 'ambos'].includes(teste) || (['recomendar', ''].includes(teste) && ['piloto', 'ambos'].includes(rec.modo));
  const resp = id => String((estado.resp || {})[id] || '');
  const falta = id => String((((estado.respDet || {})[id]) || {}).falta || '').trim().replace(/\.$/, '');
  const k = { c, ce, rec, v, arr, p, alto: !!(p && p.alto), testes, teste, poc: modo === 'poc', temPiloto,
    gratis: v('pagamento') === 'gratuito' || v('tipoTec') === 'publica',
    consDecide, pesoMax, dadosEst, campoDados, valsDados, eleg, ferr, variasFerr, sobrepostas, semPreco,
    valsInternet, valHoras, implP, implTudo, valImpl, valEleg, probs, sp, formacaoDe, metasLacuna, medidaBase,
    nivel, determinantes: p ? p.determinantes || [] : [], forma, alertas: als, arqEf, arqPresumida, classes: ce.classes || [],
    tarefas: Array.isArray(c.tarefas) ? c.tarefas : [], usuarios, usaEst, afetados, criancas: afetados.includes('criancas'),
    impactos, impactoEducacional: impactos.some(z => ['aprendizagem', 'permanencia', 'desigualdade', 'tempo_docente'].includes(z)),
    escRede: +ce.escolasRede || 0, situacao, resp, falta, proxMarco: marcoDaSituacao(situacao, teste), pend: [], pendCampos: [],
    // subproblemas marcados no passo 1.2 (estado.ctx.subs), para as regras que leem C4b e afins (R-52)
    subs: Array.isArray(x.subs) ? x.subs : [] };
  // números do caso: só quando alguma regra pede (cálculo do motor), uma vez por contexto
  let memo = null;
  Object.defineProperty(k, 'd', { enumerable: true, get() { if (!memo) memo = { d: numerosRec(estado) }; return memo.d; } });
  // pendências (3.3, item 4): suspendem as regras que as `requer`em
  PENDENCIAS.forEach(pd => {
    let ok = false;
    try { ok = !!pd.se(k); } catch (e) { console.warn(e); }
    if (!ok) return;
    const pq = recPorque(pd.campo, k.v(pd.campo), estado);
    k.pend.push({ id: pd.id, campo: pd.campo, n: pq.n, pergunta: pq.pergunta, resposta: pq.resposta, motivo: pd.motivo, suspende: [], ir: recIr(recCampo(pd.campo)) });
    k.pendCampos.push(pd.campo);
  });
  return k;
}

// marco pela situação do caso (1.1.3), quando não há Condição aberta (3.5)
function marcoDaSituacao(situacao, teste) {
  if (situacao === 'renovar') return 'M5';
  if (situacao === 'orcamento') return teste ? 'M1' : 'M3';
  return 'M1';
}

// Números do caso para as regras (k.d): rec_numeros.js (pacote R5).

// ----------------------------------------------------------- avaliação das regras
const ETIQUETA_PRESUMIDA = '(presumida: confirme na 3.2.1)';
const A_CALCULAR = 'a calcular';
const TXT_FALTA = 'O que falta:';
function seguro(f, ...a) { try { return f(...a); } catch (e) { console.warn(e); return undefined; } }
const valorDe = (x, k) => (typeof x === 'function' ? seguro(x, k) : x);
// {nome} → vars[nome]; sem valor, "a calcular" (traduzido quando `trad`)
function preencher(s, vars, trad) {
  let falta = false;
  const out = String(s == null ? '' : s).replace(/\{([a-zA-Z0-9_]+)\}/g, (m, n) => {
    if (vars && vars[n] != null && vars[n] !== '') return String(vars[n]);
    falta = true; return trad ? tr(A_CALCULAR) : A_CALCULAR;
  });
  return { s: out, falta };
}
// passo: texto (chave) ou { texto, falta } (com o "O que falta?" de uma resposta "Em parte")
function textoPasso(p, vars, trad) {
  const T = x => (trad ? tr(x) : x);
  if (p && typeof p === 'object') return preencher(T(p.texto), vars, trad).s + (p.falta ? ' ' + T(TXT_FALTA) + ' ' + p.falta + '.' : '');
  return preencher(T(p), vars, trad).s;
}
const numId = id => +String(id).replace(/\D/g, '') || 0;
const nivelDe = (condicao, marco) => (condicao ? 'condicao' : marco === 'M5' ? 'acompanhar' : 'recomendada');

/** escolhe a variante: a primeira cujo quando(k) é verdadeiro; a última (sem quando) é a padrão */
function varianteDe(r, k) {
  const V = r.variantes || [];
  const i = V.findIndex(v => !v.quando || !!seguro(v.quando, k));
  return i < 0 ? null : { v: V[i], i };
}

/** monta o item de saída de uma regra disparada */
function montarItem(r, esc, k, estado) {
  const { v, i } = esc;
  const marco = v.marco || valorDe(r.marco, k) || 'M1';
  const condicao = r.condicao ? !!seguro(r.condicao, k) : false;
  const nivel = nivelDe(condicao, marco);
  const o = (v.origem || r.origem) ? seguro(v.origem || r.origem, k) : null;
  const campo = (o && o.campo) || r.campos[0];
  const vals = o && o.vals != null ? o.vals : k.v(campo);
  const porque = recPorque(campo, vals, estado);
  const vars = r.vars ? seguro(r.vars, k, k.d) || {} : {};
  const numero = r.numero ? seguro(r.numero, k, k.d) || null : null;
  const passosCaso = r.passos ? seguro(r.passos, k) || [] : [];
  const comoChaves = (v.como || []).concat(passosCaso);
  const fOque = preencher(v.oque, vars), fRazao = preencher(v.porque, vars);
  const quem = (v.quem || r.quem || []).slice();
  const provisoria = r.provisoria ? !!seguro(r.provisoria, k) : false;
  const paraque = v.paraque || r.paraque || '', pronto = v.pronto || r.pronto || '';
  const curto = v.curto || r.curto || '';
  return {
    id: r.id, versao: r.versao, pacote: r.pacote, lente: LENTE_PACOTE[r.pacote], titulo: TITULO_PACOTE[r.pacote], tipo: r.tipo,
    substitui: (r.substitui || []).slice(), variante: i,
    oque: fOque.s, razao: fRazao.s, como: comoChaves.map(z => textoPasso(z, vars, false)),
    paraque: preencher(paraque, vars).s, pronto: preencher(pronto, vars).s,
    quem, quemRot: quem.map(q => AREAS[q] || q), marco, marcoNome: NOME_MARCO[marco] || '', pd: r.pd || null,
    condicao, nivel, rotuloNivel: rotuloNivel(nivel, marco), pontos: 0, criterio: null, curto: preencher(curto, vars).s,
    depende: (r.depende || []).slice(), numero,
    exige: (r.exige || []).slice(), semExige: r.semExige || '', indicador: r.indicador || null, base: (r.base || []).slice(),
    exemplosNorma: r.exemplosNorma || null, provisoria, etiqueta: provisoria && k.arqPresumida ? ETIQUETA_PRESUMIDA : '',
    confirmar: '', generica: !!r.generica, semNumero: fOque.falta || fRazao.falta,
    origem: Object.assign({ campo }, porque),
    chaves: { oque: v.oque, razao: v.porque, como: comoChaves, paraque, pronto, curto, vars },
    // compatibilidade (telas, PDF e seções atuais)
    quando: QUANDO_MARCO[marco] || 'antes_teste', prioridade: PRIORIDADE_NIVEL[nivel], texto: fOque.s, porque, ir: recIr(recCampo(campo)),
  };
}

// campo de compatibilidade `prioridade` (telas e PDF atuais destacam 'alta'): 'alta' só para as Condições; as outras
// ficam 'media' (o rótulo do nível de verdade é `rotuloNivel`/`nivel`; o pacote R6 troca as telas e o PDF)
const PRIORIDADE_NIVEL = { condicao: 'alta', recomendada: 'media', acompanhar: 'media' };

// ----------------------------------------------------------- pendências (3.3, item 4)
const ARQS_EFEITO = ['saas', 'api', 'ow'];
/**
 * Efeito no custo de responder a 3.2.1: o custo total do caso em cada arquitetura (3.3, item 4; TEC-03). null quando o
 * custo foi editado no Refinar ou parte de um modelo pronto (o efeito não seria o do caso) ou quando não há números.
 */
function efeitoArquitetura(estado) {
  const sc = estado.custo;
  if (sc && (sc.editado || (sc.base && sc.base !== 'caso'))) return null;
  const rot = a => ((typeof OPC !== 'undefined' && OPC.arquitetura) || []).find(x => x[0] === a);
  const valores = ARQS_EFEITO.map(a => {
    const E = Object.assign({}, estado, { caso: Object.assign({}, estado.caso, { arquitetura: a }), custo: undefined });
    const n = numerosRec(E);
    return n ? { arq: a, rotulo: (rot(a) || [a, a])[1], total: n.total, ano0: n.ano0 } : null;
  });
  if (valores.some(x => !x)) return null;
  return { rotulo: TXT_PEND.efeitoArq, valores };
}
const TXT_PEND = {
  efeitoArq: 'Custo total do caso em cada arquitetura',
};
// tipo da pendência: premissa que o custo já usa (arquitetura presumida) ou resposta "não sei"
const TIPO_PEND = { arquitetura: 'premissa' };
/** Completa as pendências: tipo, efeito no custo (arquitetura, calculado só quando lido) e as respostas sugeridas. */
function completarPendencias(pend, estado) {
  pend.forEach(p => {
    p.tipo = TIPO_PEND[p.campo] || 'nao_sei';
    if (p.campo === 'arquitetura') {
      let memo;
      Object.defineProperty(p, 'efeito', { enumerable: true, configurable: true, get() { if (memo === undefined) memo = efeitoArquitetura(estado); return memo; } });
    }
  });
  return pend;
}
// caso em branco (3.3, item 4): as 3 perguntas que mais liberam ações
const PERGUNTAS_VAZIO = ['testes', 'tarefas', 'pagamento'];
function perguntasVazio(estado) {
  return PERGUNTAS_VAZIO.map(id => {
    const f = recCampo(id);
    const pergunta = f ? (typeof textoCampo === 'function' ? textoCampo(f, (estado || {}).caso) : f.t) : '';
    return { campo: id, n: f ? f.n : '', pergunta, ir: recIr(f) };
  });
}

/**
 * Resultado completo das recomendações do caso. `regras` (opcional) troca o catálogo (testes de ordem e de regras novas).
 * → { recs, pend, suspensas: [{ id, campos }], proxMarco, nivel, forma, arqEf, arqPresumida,
 *     cartoes, veredito, avisoCondicoes, grupos, baseComum, condicoes, vazio }  (formato em rec_selecao.js)
 */
function resultadoRecomendacoes(estado, regras) {
  if (!estado || !estado.caso) {
    const sel = selecao([], { proxMarco: 'M1' }, { perguntas: perguntasVazio(estado) });
    return { recs: [], pend: [], suspensas: [], proxMarco: 'M1', nivel: '', forma: '', arqEf: '', arqPresumida: false,
      cartoes: [], veredito: sel.veredito, avisoCondicoes: null, grupos: [], baseComum: [], condicoes: [], vazio: sel.vazio };
  }
  const k = recContexto(estado);
  const R = regras || REGRAS;
  // 1ª passada: gatilho, suspensão por pendência, variante, marco e condição
  const disparadas = [], suspensas = [];
  R.forEach(r => {
    if (!seguro(r.se, k)) return;
    const req = (r.requer || []).filter(c => k.pendCampos.includes(c));
    if (req.length) {
      suspensas.push({ id: r.id, campos: req });
      k.pend.forEach(p => { if (req.includes(p.campo) && !p.suspende.includes(r.id)) p.suspende.push(r.id); });
      return;
    }
    if (!varianteDe(r, k)) return;
    disparadas.push(r);
  });
  const porId = Object.fromEntries(R.map(r => [r.id, r]));
  // próximo marco: o primeiro com Condição aberta; sem nenhuma, o da situação do caso (3.5)
  const marcosCond = disparadas.filter(r => r.condicao && seguro(r.condicao, k)).map(r => { const e = varianteDe(r, k); return (e && e.v.marco) || valorDe(r.marco, k) || 'M1'; });
  if (marcosCond.length) k.proxMarco = marcosCond.sort((a, b) => ORDEM_MARCO[a] - ORDEM_MARCO[b])[0];
  // 2ª passada: textos (as variantes podem ler k.proxMarco)
  const itens = disparadas.map(r => { const e = varianteDe(r, k); return e ? montarItem(r, e, k, estado) : null; }).filter(Boolean);
  // pontuação de 4.1 (REC-18) e a ordem que dela decorre
  pontuar(itens, k, id => porId[id]);
  itens.sort((a, b) => compararPontos(a, b, k.proxMarco));
  const out = [], vistos = new Set();
  itens.forEach(it => { if (!it.oque || vistos.has(it.id) || vistos.has('t:' + it.oque)) return; vistos.add(it.id); vistos.add('t:' + it.oque); out.push(it); });
  // pendências: tipo, efeito no custo e as respostas sugeridas que disparam ações (3.3, item 4)
  const pend = completarPendencias(k.pend, estado).concat(pendenciasSugeridasDe(out));
  // cartões, veredito, aviso, grupos e caso em branco (REC-20 a REC-24)
  const sel = selecao(out, k, { perguntas: perguntasVazio(estado) });
  return { recs: out, pend, suspensas: suspensas.sort((a, b) => numId(a.id) - numId(b.id)), proxMarco: k.proxMarco,
    nivel: k.nivel, forma: k.forma, arqEf: k.arqEf, arqPresumida: k.arqPresumida,
    cartoes: sel.cartoes, veredito: sel.veredito, avisoCondicoes: sel.avisoCondicoes, grupos: sel.grupos, baseComum: sel.baseComum,
    condicoes: sel.condicoes, vazio: sel.vazio };
}

// Lista de recomendações do caso (a mesma de resultadoRecomendacoes(estado).recs)
function recomendacoesCaso(estado) { return resultadoRecomendacoes(estado).recs; }

/**
 * Texto traduzido de um campo do item: 'oque' | 'razao' | 'paraque' | 'pronto' → texto; 'como' → lista de passos.
 * Traduz a chave e depois preenche os marcadores (o texto em português do item já vem preenchido).
 */
function trRec(item, campo) {
  const ch = (item && item.chaves) || null;
  if (!ch) { const x = item ? item[campo === 'oque' ? 'texto' : campo] : ''; return campo === 'como' ? (x || []).map(z => tr(z)) : tr(x || ''); }
  if (campo === 'como') return (ch.como || []).map(z => textoPasso(z, ch.vars, true));
  return preencher(tr(ch[campo] || ''), ch.vars, true).s;
}
/**
 * Cartão traduzido (para as telas e o PDF): { titulo, rotuloNivel, oque, razao, paraque, pronto, como[], quem[], etiqueta,
 * passos: [{ id, oque, origem }] } — a origem como "n Pergunta — Resposta".
 */
function trCartao(c) {
  if (!c) return null;
  const L = c.lider;
  return {
    titulo: tr(c.titulo), rotuloNivel: rotuloNivel(c.nivel, c.marco, true), oque: trRec(L, 'oque'), razao: trRec(L, 'razao'),
    paraque: trRec(L, 'paraque'), pronto: trRec(L, 'pronto'), como: trRec(L, 'como'), quem: rotuloQuem(c.quem),
    etiqueta: trEtiqueta(c.etiqueta), origem: recPorqueTexto(L),
    passos: (c.passos || []).map(p => ({ id: p.id, oque: trRec(p.item, 'oque'), origem: recPorqueTexto(p.item) })),
  };
}
// "(presumida: confirme na 3.2.1) (a confirmar na pergunta 2.1.1)" traduzido parte a parte
function trEtiqueta(s) {
  return String(s || '').split(/(?<=\))\s+(?=\()/).filter(Boolean).map(x => {
    const m = x.match(/^\(a confirmar na pergunta (.+)\)$/);
    return m ? tr('(a confirmar na pergunta {n})').replace('{n}', m[1]) : tr(x);
  }).join(' ');
}
/** rótulos traduzidos de "quem age" (3.4) */
function rotuloQuem(codigos) { return (codigos || []).map(q => tr(AREAS[q] || q)); }

// Vista de compatibilidade do catálogo para o store (perguntas.ts:afetadosPor) e testes antigos: uma entrada por campo
// de origem, { id, campo, tipo, pacote }. O catálogo de verdade é REGRAS (ids únicos).
const REGRAS_REC = REGRAS.flatMap(r => (r.campos || []).map(campo => ({ id: r.id, campo, tipo: r.tipo, pacote: r.pacote })));

// Textos novos do pacote R2 (chaves de tradução para o orquestrador): catálogo, pendências, rótulos e mensagens do motor
// e as frases novas do R1 fora do catálogo (plano/secoes.js, plano_dados.js; as de plano/relatorio.js estão em TXT_REL)
// pendências das respostas sugeridas (rec_selecao.js)
function pendenciasSugeridasDe(itens) { return pendenciasSugeridasSel(itens); }

const TEXTOS_REC_R2 = textosRegras().concat([ETIQUETA_PRESUMIDA, A_CALCULAR, TXT_REC.introPlano,
  'Camada de saída do custo total:', 'Desembolso de transição e saída, em preços correntes:',
  'Confirmar a base legal para usar os dados; o consentimento só cabe se o uso for opcional e recusar não trouxer prejuízo.',
  'Usar o checklist “O que exigir” deste plano neste caso e, depois, adotar uma orientação de compras de IA da rede, com custo do ciclo de vida, diligência e cláusulas de dados e de saída.']);

// Textos novos do pacote R3: seleção e veredito (rec_selecao.js), pendências e as frases trocadas em TXT_REC
const TEXTOS_REC_R3 = TEXTOS_SEL_R3.concat([TXT_PEND.efeitoArq, TXT_REC.intro, TXT_REC.negrito, 'Para acompanhar']);

// ----------------------------------------------------------- textos traduzidos
const recTrPartes = s => String(s || '').split('; ').map(z => tr(z)).join('; ');
// "1.3.2 Pergunta? — Resposta" já traduzido (origem da ação; REC-11: sem "→", que o PDF trocava por "->")
function recPorqueTexto(r) {
  const p = r.porque || {};
  return [p.n, tr(p.pergunta)].filter(Boolean).join(' ') + (p.resposta ? ' — ' + recTrPartes(p.resposta) : '') + (p.sugerido ? ' (' + tr('sugerido') + ')' : '');
}
function recContagem(recs) {
  const n = { custo: 0, politica: 0 };
  recs.forEach(r => { n[r.tipo] = (n[r.tipo] || 0) + 1; });
  return n;
}

// ----------------------------------------------------------- HTML (passo 4.3 e página do plano)

// ----------------------------------------------------------- plano (formato de secoesPlano)
function secaoRecomendacoes(recs, estado) {
  if (!recs) { try { recs = estado ? recomendacoesCaso(estado) : []; } catch (e) { console.warn(e); recs = []; } }
  const rows = [], negrito = [];
  QUANDO_REC.forEach(([q, nome]) => recs.filter(r => r.quando === q).forEach(r => {
    if (r.prioridade === 'alta') negrito.push(rows.length);
    rows.push([tr(nome), tr(r.texto), recPorqueTexto(r)]);
  }));
  // só textos (sem códigos internos), para a tradução profunda e as exportações; a página refaz a lista (renderPlano)
  return { id: 'recs', h: TIT_REC, p: [recs.length ? TXT_REC.introPlano : TXT_REC.vazio],
    table: rows.length ? { head: ['Quando', 'Ação', 'Por quê'], rows, grupo: true, negrito, larg: [86, 0, 170] } : null,
    pos: rows.length ? [TXT_REC.negrito] : null };
}

export {
  QUANDO_REC, TIPO_REC, PRIO_REC, TIT_REC, TXT_REC, REGRAS_REC, REC_CAMPO_V13, recValor, recCampo, recOpcoes, recRotulos, recIr, recPorque, recTestes,
  recTesteDe, recFerramentas, recPagaFerr, recContexto, recomendacoesCaso, recPorqueTexto, recContagem, secaoRecomendacoes,
  // R2: catálogo, saída completa e apoio aos pacotes seguintes
  REGRAS, REGRA_POR_ID, resultadoRecomendacoes, trRec, rotuloQuem, marcoDaSituacao, mapaLegado, textosRegras, lintRegra, lintCatalogo,
  TEXTOS_REC_R2, PACOTES as PACOTES_REC, LENTES as LENTES_REC, AREAS as AREAS_REC, MARCOS as MARCOS_REC, EXIGE as EXIGE_REC,
  PENDENCIAS as PENDENCIAS_REC,
  // R3: pontuação, níveis, cartões, veredito e grupos (rec_selecao.js)
  rotuloNivel, rotuloNivelCurto, trVeredito, trAviso, trCartao, efeitoArquitetura, TEXTOS_REC_R3,
};
