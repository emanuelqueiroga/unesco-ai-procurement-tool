// =====================================================================
// Estado, entradas, exportação, relatório e eventos gerais (v9; v11: quatro fases e migração v10 → v11;
// v13: prioridades e problemas no 1.2, detalhes de "Sim" e "Em parte" (S.respDet) e migração v12 → v13)
// =====================================================================
// 0.0.16: a versão estável guarda o caso na chave de sempre; versões de revisão (CANAL_APP = 'revisao') usam uma chave
// própria, para não trocar o caso da versão publicada nem o de outra revisão no mesmo endereço (emanuelqueiroga.github.io)
const CHAVE = 'aiedu-procurement-v9' + (typeof CANAL_APP !== 'undefined' && CANAL_APP !== 'estavel' && typeof VERSAO_APP !== 'undefined' ? '@' + VERSAO_APP : '');
const CHAVE_V8 = 'navegador-ia-educacao-v4';
function estadoInicial() {
  return {
    versao: 13, v10: true, caso: clone(CASO_VAZIO), ctx: {}, resp: {}, respC: {}, respDet: {}, feitos: {}, exemplo: 'novo',
    fase: '', passo: '1a', vista: '', boasVindas: true, info: {},
    custo: { base: 'caso', cfg: null, editado: false }, moeda: { cod: 'USD', taxa: '' }, lang: '',
  };
}
let S = estadoInicial();
let CAP = { sample: null, downloads: null };
let IA = { estado: '', resposta: null, erro: '' };
let MIGROU = false;
// v10: caso salvo encontrado ao abrir a ferramenta; a tela de boas-vindas pergunta se a pessoa quer continuá-lo
// ou começar em branco. Enquanto a escolha não é feita, o painel não mostra o caso. { nome, lugar, migrou }
let SALVO = null;

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pill = n => `<span class="pill n-${n}">${NIVEL_NOME[n]}</span>`;

// ----------------------------------------------------------- salvar, carregar e migrar
function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch (e) { } }
// completa o estado com os valores padrão e retira o que não existe mais (v9 → v10 → v11 → v13)
function normalizarEstado() {
  // antes da v10, pagamento, licença, tamanho do teste e pessoas na rede só tinham valor quando respondidos:
  // ficam confirmados, para que as sugestões geradas (fluxo.js, aplicarPadroes) não os substituam
  S.caso = S.caso || {}; S.respC = S.respC || {};
  if (!S.v10) { if (typeof confirmarGerados === 'function') confirmarGerados(S.caso, S.respC); S.v10 = true; }
  if (!(+S.versao >= 11)) migrarEstadoV11(S);
  if (+S.versao < 13) migrarEstadoV13(S);
  S.versao = 13;
  S.caso = Object.assign(clone(CASO_VAZIO), S.caso || {});
  S.caso.piloto = Object.assign({ escolas: '', participantes: '', meses: '' }, S.caso.piloto || {});
  S.caso.poc = Object.assign({ participantes: '', meses: '' }, S.caso.poc || {});
  S.caso.implantacao = Object.assign({ escolas: '', pessoas: '' }, S.caso.implantacao || {});
  if (!Array.isArray(S.caso.testes)) S.caso.testes = [];
  if (!Array.isArray(S.caso.ferramentas)) S.caso.ferramentas = [];
  ['pagaDepois', 'fonte', 'infra', 'arquiteturaManual'].forEach(k => { delete S.caso[k]; });
  if (!Array.isArray(S.caso.linhaBaseProblemas)) S.caso.linhaBaseProblemas = [];
  S.ctx = S.ctx || {}; S.resp = S.resp || {}; S.feitos = S.feitos || {}; S.info = S.info || {};
  S.respDet = S.respDet && typeof S.respDet === 'object' ? S.respDet : {};
  ['prioridades', 'problemas', 'subs'].forEach(k => { if (!Array.isArray(S.ctx[k])) S.ctx[k] = []; });
  if (S.ctx.problemaOutro == null) S.ctx.problemaOutro = '';
  S.custo = S.custo || { base: 'caso', cfg: null, editado: false };
  S.moeda = S.moeda || { cod: 'USD', taxa: '' };
  if (!(S.fase === '' || (typeof PASSOS !== 'undefined' && PASSOS[S.fase]))) { S.fase = 'contexto'; S.passo = '1a'; }
  if (!['', 'plano'].includes(S.vista || '')) S.vista = '';
  ['piloto', 'pular', 'checks', 'sub', 'tab', 'dimAberta', 'pdAberto'].forEach(k => { delete S[k]; });
}
function carregar() {
  let o = null;
  try { const t = localStorage.getItem(CHAVE); if (t) o = JSON.parse(t); } catch (e) { o = null; }
  if (!o || !o.caso) {
    o = null;
    try {
      const t8 = localStorage.getItem(CHAVE_V8);
      if (t8) { const v = JSON.parse(t8); if (v && v.caso) { o = migrarV8(v); MIGROU = true; } }
    } catch (e) { o = null; MIGROU = false; }
  }
  if (o && o.caso) { S = Object.assign(estadoInicial(), o); if (!o.versao) S.versao = 9; }
  normalizarEstado();
  if (MIGROU) salvar();   // grava na chave nova; a chave antiga fica intacta
  // v10: um caso salvo (desta versão, de uma sessão anterior ou convertido da v8) não abre preenchido sem a pessoa pedir
  if (o && o.caso && temRespostas(S)) {
    const ex = ['A', 'B', 'C', 'D'].includes(S.exemplo) && typeof CASOS !== 'undefined' && CASOS[S.exemplo] ? CASOS[S.exemplo].titulo : '';
    SALVO = { nome: S.caso.titulo || (S.ctx && S.ctx.olhando) || '', exemplo: ex, lugar: (S.ctx && S.ctx.local) || '', migrou: MIGROU };
    S.boasVindas = true; S.vista = '';
  }
}
// O estado tem alguma resposta dada pela pessoa (ou é um exemplo)?
function temRespostas(o) {
  if (!o || !o.caso) return false;
  if (o.exemplo && o.exemplo !== 'novo') return true;
  if (Object.keys(o.respC || {}).some(k => o.respC[k])) return true;
  if (Object.keys(o.resp || {}).some(k => o.resp[k])) return true;
  const x = o.ctx || {}, c = o.caso;
  if (x.nivel || x.local || x.olhando || x.problemaOutro || ['prioridades', 'problemas', 'subs'].some(k => (x[k] || []).length) || Object.values(x.etapas || {}).some(e => e && e.on)) return true;
  if (Object.values(o.respDet || {}).some(d => d && (String(d.qual || '').trim() || String(d.falta || '').trim()))) return true;
  return ['titulo', 'problema', 'resultado', 'linhaBaseMedida', 'linhaBaseProblemaTxt', 'teste', 'tipoTec', 'pagamento', 'licenca', 'elegiveis', 'nFerramentas', 'conheceFerramentas', 'internet', 'modeloDisp', 'formacaoFormato', 'formacaoPaga', 'suporteQuem', 'suporteNivel', 'acompanhamento', 'arquitetura'].some(k => c[k]) || ['tarefas', 'impactos', 'usuarios', 'testes', 'ferramentas', 'formados', 'formacaoTipo', 'linhaBaseProblemas'].some(k => (c[k] || []).length);
}
// Boas-vindas: continuar o caso salvo, no passo em que a pessoa parou
function continuarSalvo() {
  const migrou = SALVO && SALVO.migrou;
  SALVO = null; S.boasVindas = false; S.vista = '';
  const f = PASSOS[S.fase] ? S.fase : 'contexto';
  const p = PASSOS[f].some(x => x[0] === S.passo) ? S.passo : PASSOS[f][0][0];
  abrirFase(f, p);
  toast(tr(migrou ? 'Caso da versão anterior convertido. Revise as respostas de adoção.' : 'Caso salvo aberto.'));
}
// ----------------------------------------------------------- migração v10 → v11 (plano/6_v11.md, "Campos")
// Caso: teste → testes; PoC da v10 (caso.piloto sem escolas) → caso.poc; infra → internet + dispExistem;
// arquiteturaManual → arquitetura; sem pagaDepois e fonte. Usa migrarCasoV10 (casos.js/framework.js) quando existe.
function migrarCasoLocalV11(c0) {
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
// Estado: o caso (acima), as confirmações (S.respC), as fases e os passos (a fase "custo" vira "expansao").
function migrarEstadoV11(o) {
  const c0 = o.caso || {};
  let c = null;
  if (typeof migrarCasoV10 === 'function') { try { c = migrarCasoV10(clone(c0)); } catch (e) { console.warn(e); c = null; } }
  c = migrarCasoLocalV11(c || c0);
  const rc = o.respC = o.respC || {};
  if (rc.teste) { rc.testes = true; delete rc.teste; }
  if (rc.infra) { if (c.internet) rc.internet = true; if (c.dispExistem) rc.dispExistem = true; delete rc.infra; }
  if (rc.arquiteturaManual) { if (c.arquitetura) rc.arquitetura = true; delete rc.arquiteturaManual; }
  delete rc.pagaDepois; delete rc.fonte;
  // PoC da v10: as confirmações do tamanho do teste passam para caso.poc
  if (c.testes.length === 1 && c.testes[0] === 'poc') ['participantes', 'meses'].forEach(k => { if (rc['piloto.' + k]) { rc['poc.' + k] = true; delete rc['piloto.' + k]; } });
  // valores que a migração preencheu (dispositivos e primeira etapa da implantação) ficam confirmados:
  // as sugestões geradas (fluxo.js, aplicarPadroes) não os substituem
  if (c.dispExistem) rc.dispExistem = true;
  ['escolas', 'pessoas'].forEach(k => { if (c.implantacao && !(c.implantacao[k] === '' || c.implantacao[k] == null)) rc['implantacao.' + k] = true; });
  o.caso = c;
  if (Array.isArray(o.revisar)) o.revisar = o.revisar.filter(k => !['infra', 'arquiteturaManual', 'pagaDepois', 'fonte'].includes(k));
  // fases e passos: 3.1 Escala → 4.1; 3.2 Fonte de recursos (removido) → 4.1; 3.3 → 4.2; 3.4 → 4.3
  const fe = o.feitos || {}, novoFe = {};
  if (fe['3c']) novoFe['4b'] = true;
  if (fe['3d']) novoFe['4c'] = true;
  Object.keys(fe).forEach(k => { if (/^(1|2)/.test(k)) novoFe[k] = fe[k]; });
  o.feitos = novoFe;
  if (o.fase === 'custo') { o.fase = 'expansao'; o.passo = ({ '3a': '4a', '3b': '4a', '3c': '4b', '3d': '4c' })[o.passo] || '4a'; }
  o.versao = 11;
  return o;
}
// ----------------------------------------------------------- migração v12 → v13 (plano/10_v13_contrato.md, RQ-19)
// Contexto: domínio e componentes → prioridades e problemas (MIGRA_DOMINIO, MIGRA_COMPS); componente "outro" →
// "Outro problema"; "Letramento digital e em IA" → prioridade "Educar sobre a IA", problema A1. Caso: campos novos do
// 1.2.7 vazios. S.respDet = {}. Os valores já preenchidos dos campos que a v13 passa a sugerir (1.2.3–1.2.6, 2.1.1 e
// 2.3.1) ficam confirmados: as sugestões novas não os substituem.
function migrarEstadoV13(o) {
  const x = o.ctx = o.ctx || {};
  const MD = typeof MIGRA_DOMINIO !== 'undefined' ? MIGRA_DOMINIO : {}, MC = typeof MIGRA_COMPS !== 'undefined' ? MIGRA_COMPS : {};
  const PP = typeof PRIORIDADE_DO_PROBLEMA !== 'undefined' ? PRIORIDADE_DO_PROBLEMA : {};
  const pr = new Set(Array.isArray(x.prioridades) ? x.prioridades : []), pb = new Set(Array.isArray(x.problemas) ? x.problemas : []);
  if (x.dominio && MD[x.dominio]) pr.add(MD[x.dominio]);
  (Array.isArray(x.comps) ? x.comps : []).forEach(k => {
    if (MC[k]) pb.add(MC[k]);
    else if (k === 'digital') { pr.add('sobre'); pb.add('A1'); }
  });
  pb.forEach(id => { if (PP[id]) pr.add(PP[id]); });
  if ((x.comps || []).includes('outro') && String(x.compOutro || '').trim() && !String(x.problemaOutro || '').trim()) x.problemaOutro = x.compOutro;
  const ordP = typeof PRIORIDADES !== 'undefined' ? PRIORIDADES.map(p => p.id) : [...pr];
  x.prioridades = ordP.filter(id => pr.has(id));
  x.problemas = typeof ordemProblemas === 'function' ? ordemProblemas([...pb]) : [...pb];
  x.subs = Array.isArray(x.subs) ? x.subs : [];
  if (x.problemaOutro == null) x.problemaOutro = '';
  delete x.dominio; delete x.comps; delete x.compOutro;
  const c = o.caso = o.caso || {}, rc = o.respC = o.respC || {};
  if (!Array.isArray(c.linhaBaseProblemas)) c.linhaBaseProblemas = [];
  ['linhaBaseMedida', 'linhaBaseProblemaTxt'].forEach(k => { if (c[k] == null) c[k] = ''; });
  if (!o.respDet || typeof o.respDet !== 'object') o.respDet = {};
  const cheio = v => !(v == null || v === '' || (Array.isArray(v) && !v.length));
  if (cheio(x.olhando)) rc.olhando = true;
  ['problema', 'impactos', 'resultado', 'tarefas', 'nFerramentas'].forEach(k => { if (cheio(c[k])) rc[k] = true; });
  if (o.info) Object.keys(o.info).forEach(k => { if (/^pr-/.test(k)) delete o.info[k]; });
  o.versao = 13;
  return o;
}
// Converte um estado ou uma exportação da v8 (formato 4) para a v9 (plano, seção E.2).
function migrarV8(o) {
  const c8 = Object.assign({}, o.caso || {});
  const r8 = Object.assign({}, o.resp || {});
  const rc8 = o.respC || {};
  const ex8 = o.exemplo || 'novo';
  const resp8 = k => ex8 !== 'novo' || !!rc8[k];
  // contexto: estudantes por ano passa a ser o padrão
  const ctx = clone(o.ctx || {}); ctx.etapas = ctx.etapas || {};
  Object.keys(ctx.etapas).forEach(id => {
    const e = ctx.etapas[id] || {};
    if (e.porAno === true) e.soTotal = false; else if (+e.alunos > 0) e.soTotal = true;
    delete e.porAno;
  });
  // governança: g-equipe fundida em g-comite; orçamento vira a pergunta 3.2.2
  if (r8['g-comite'] == null && r8['g-equipe'] != null) r8['g-comite'] = r8['g-equipe'];
  const MAPA_FONTE = { sim: 'sim', parcial: 'parcial', nao: 'nao' };
  const fonte = MAPA_FONTE[r8['g-orcamento']] || MAPA_FONTE[r8['s-orcamento']] || '';
  const resp = {};
  Object.keys(r8).forEach(k => {
    if (['g-equipe', 'g-orcamento', 'g-avaliacao'].includes(k) || /^[rpis]-/.test(k)) return;
    resp[k] = r8[k] === 'na' ? 'nao_sei' : r8[k];
  });
  // classes técnicas → tarefas educacionais
  const cl = c8.classes || [], us = c8.usuarios || [];
  const tarefas = [];
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
  const caso = Object.assign({}, c8, {
    tarefas, tipoTec, adaptacao, pagamento, licenca: '', arquiteturaManual: arqDef ? arq : '',
    piloto: { escolas: p8.escolas == null ? '' : p8.escolas, participantes: p8.participantes == null ? '' : p8.participantes, meses: p8.meses == null ? '' : p8.meses },
    teste: c8.situacao === 'testar' ? 'recomendar' : 'piloto',
    situacao: c8.situacao === 'testar' ? 'nova' : c8.situacao === 'incidente' ? 'renovar' : (c8.situacao || 'nova'),
    alternativa: c8.alternativaSemIA === true ? 'sim' : c8.alternativaSemIA === false ? 'nao' : '',
    horizonte: H > 0 ? H : 3, expansao: 'ano1', fonte,
    // num caso em branco, o padrão de 1.000 elegíveis da v8 não foi uma resposta
    elegiveis: resp8('elegiveis') && +c8.elegiveis > 0 ? +c8.elegiveis : '',
  });
  ['populacao', 'capacidade', 'classes', 'autonomia', 'dados', 'treino', 'vulneraveis', 'idiomas', 'verificabilidade', 'contestacao',
    'reversibilidade', 'cumulativo', 'alcance', 'arquitetura', 'pilotoGratuito', 'alternativaSemIA'].forEach(k => { delete caso[k]; });
  // respC: campos que continuam + os que vieram de valores respondidos
  const respC = {};
  Object.keys(rc8).forEach(k => { if (rc8[k] && k in CASO_VAZIO) respC[k] = true; });
  if (resp8('alternativaSemIA')) respC.alternativa = true;
  if (tarefas.length && resp8('classes')) respC.tarefas = true;
  if (tipoTec && resp8('arquitetura')) { respC.tipoTec = true; respC.adaptacao = true; respC.arquiteturaManual = true; }
  if (pagamento && (resp8('arquitetura') || (c8.pilotoGratuito && resp8('pilotoGratuito')))) respC.pagamento = true;
  if (resp8('situacao')) respC.teste = true;
  if (fonte) respC.fonte = true;
  if (['escolas', 'participantes', 'meses'].some(k => +p8[k] > 0)) respC.piloto = true;
  ['escolas', 'participantes', 'meses'].forEach(k => { if (+p8[k] > 0) respC['piloto.' + k] = true; });
  // exemplos da v8: as respostas do exemplo ficam confirmadas (as sugestões da v10 não as substituem)
  if (ex8 !== 'novo' && typeof confirmarGerados === 'function') confirmarGerados(caso, respC);
  return {
    versao: 9, v10: true, caso, ctx, resp, respC, feitos: {},
    exemplo: ex8 === 'novo' ? 'novo' : 'editado',
    fase: 'contexto', passo: '1a', vista: '', boasVindas: o.boasVindas === true, info: {},
    custo: { base: 'caso', cfg: null, editado: false },
    moeda: o.moeda || { cod: 'USD', taxa: '' }, lang: o.lang || '',
  };
}
function toast(msg) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 2600);
}

// ----------------------------------------------------------- derivados
// caso efetivo: o caso com os campos legados deduzidos das tarefas e da adoção (P1)
function casoAtual() {
  return typeof casoEfetivo === 'function' ? casoEfetivo(S.caso, totaisCtx()) : S.caso;
}
function perfil() { return perfilFinal(casoAtual()); }
function cfgAtual() {
  if (S.custo.base !== 'caso') {
    if (!S.custo.cfg || S.custo.cfg.__base !== S.custo.base) { S.custo.cfg = clone(PRESETS[S.custo.base]); S.custo.cfg.__base = S.custo.base; S.custo.editado = false; }
    return S.custo.cfg;
  }
  if (!S.custo.cfg || S.custo.cfg.__base !== 'caso' || !S.custo.editado) {
    const ce = casoAtual();
    S.custo.cfg = cfgDoCaso(ce, perfilFinal(ce)); S.custo.cfg.__base = 'caso';
  }
  return S.custo.cfg;
}
// campos cuja mudança refaz as premissas de custo montadas a partir do caso
const CAMPOS_CUSTO = ['pais', 'editados', 'tarefas', 'usuarios', 'afetados', 'consequencias', 'testes', 'tipoTec', 'pagamento', 'licenca', 'adaptacao', 'piloto', 'poc',
  'nFerramentas', 'conheceFerramentas', 'ferramentas', 'internet', 'escolasInternet', 'modeloDisp', 'dispExistem', 'formados', 'formacaoTipo', 'formacaoFormato',
  'formacaoHoras', 'formacaoPaga', 'suporteQuem', 'suporteNivel', 'acompanhamento', 'implantacao', 'arquitetura', 'elegiveis', 'expansao', 'horizonte', 'curva', 'ondas', 'reposicaoDisp', 'rotacaoFormacao'];
function marcarCampo(campo) {
  S.respC[campo] = true;
  if (S.exemplo !== 'novo') S.exemplo = 'editado';
  if (CAMPOS_CUSTO.includes(campo)) S.custo.editado = false;
}
// gancho do percurso (P2); devolve true se já redesenhou
function gancho(campo) { try { return typeof aoMudarCampo === 'function' ? !!aoMudarCampo(campo) : false; } catch (e) { console.error(e); return false; } }

// ----------------------------------------------------------- opções (✓ por CSS)
function radios(nome, lista, val, cols) {
  return `<div class="opts${cols ? ' cols' : ''}">${lista.map(o => `
    <label class="opt"><input type="radio" name="${nome}" value="${o[0]}" data-f="${nome}" ${String(val) === String(o[0]) && respondido(nome) ? 'checked' : ''}>
    <span><b>${esc(o[1])}</b>${o[2] && typeof o[2] === 'string' && !NIVEIS.includes(o[2]) ? `<small>${esc(o[2])}</small>` : ''}</span></label>`).join('')}</div>`;
}
function chips(nome, lista, vals) {
  return `<div class="chips">${lista.map(o => `<label class="chip"><input type="checkbox" data-fm="${nome}" value="${o[0]}" ${(vals || []).includes(o[0]) && respondido(nome) ? 'checked' : ''}><span>${esc(o[1])}${o[2] && typeof o[2] === 'string' && !NIVEIS.includes(o[2]) ? `<small>${esc(o[2])}</small>` : ''}</span></label>`).join('')}</div>`;
}

// ----------------------------------------------------------- Claude (sample)
function renderIA() {
  if (IA.estado === 'erro') return `<p class="small" style="color:var(--crit)">${esc(IA.erro)}</p>`;
  if (!IA.resposta) return '';
  const r = IA.resposta;
  const lac = (r.lacunas || []).map(x => `<li>${esc(x)}</li>`).join('');
  return `<div class="grid2">
      <div class="q"><span class="lbl">Problema reescrito sem tecnologia</span><p>${esc(r.problemaReformulado || '')}</p></div>
      <div class="q"><span class="lbl">Resultado esperado</span><p>${esc(r.resultadoReformulado || '')}</p></div>
    </div>
    ${lac ? `<div class="q"><span class="lbl">Perguntas que a descrição ainda não responde</span><ul class="small" style="margin:0;padding-left:18px">${lac}</ul></div>` : ''}
    <div class="row"><button class="btn pri" type="button" data-act="ia-aplicar">Aplicar sugestões ao formulário</button><button class="btn" type="button" data-act="ia-texto">Usar só o texto reescrito</button>
    <span class="small muted">Sugestões de um modelo. Revise cada resposta antes de decidir.</span></div>`;
}
const IA_CAMPOS = { impactos: 'lista', tarefas: 'lista', usuarios: 'lista', afetados: 'lista', consequencias: 'lista', frequencia: 'valor' };
async function analisarIA() {
  const c = S.caso, x = S.ctx || {};
  if (!(c.problema || '').trim()) { toast(tr('Descreva o problema antes de analisar.')); return; }
  IA = { estado: 'rodando', resposta: null, erro: '' };
  render();
  const listas = {};
  Object.keys(IA_CAMPOS).forEach(k => { listas[k] = (OPC[k] || []).map(o => o[0] + ' = ' + o[1]); });
  const prompt = `Você apoia gestores públicos de educação a estruturar um caso de uso de inteligência artificial, seguindo um guia de decisão. O guia exige que o problema seja descrito sem mencionar tecnologia e que a solução seja descrita pelo que se quer que a IA faça no dia a dia da escola ou da rede (tarefas educacionais), e não pelo produto.

Descrição fornecida pelo gestor:
- Como a equipe descreve o problema: ${x.olhando || '(não informado)'}
- Nome do caso: ${c.titulo || '(não informado)'}
- Situação atual: ${c.problema}
- Resultado esperado: ${c.resultado || '(não informado)'}

Responda APENAS com um objeto JSON, escrito em ${({ pt: 'português do Brasil', en: 'inglês', es: 'espanhol', fr: 'francês', ar: 'árabe', zh: 'chinês simplificado', bm: 'bambara', zu: 'zulu', sw: 'suaíli' })[LANG] || 'português do Brasil'} (os identificadores permitidos das sugestões ficam exatamente como estão), com estas chaves:
- "problemaReformulado": a situação atual reescrita sem nenhuma referência a tecnologia, IA, produto ou fornecedor (2 a 4 frases, sem inventar dados que não estejam na descrição);
- "resultadoReformulado": o resultado desejado, mensurável, sem citar tecnologia (1 frase);
- "lacunas": lista de 3 a 6 perguntas objetivas que a descrição ainda não responde e que o gestor precisa responder antes de avançar;
- "sugestoes": objeto com as respostas mais prováveis. Em cada lista abaixo, use SOMENTE o identificador antes do sinal "=" (o texto depois dele é só a explicação): ${JSON.stringify(listas)}. Chaves: impactos (lista: o impacto educacional desejado), tarefas (lista: o que se quer que a IA faça), usuarios (lista: quem vai usar a ferramenta), afetados (lista: quem recebe ou é afetado pelo que ela produz), consequencias (lista: o que as pessoas vão fazer com a resposta da ferramenta), frequencia (um identificador: com que frequência cada pessoa vai usar). Omita uma chave quando a descrição não permitir inferir com razoável segurança. Não sugira grau de autonomia, dados, arquitetura, fornecedor nem produto.`;
  try {
    const r = await CAP.sample.json(prompt, { modelTier: 'default' });
    IA = { estado: 'ok', resposta: r || {}, erro: '' };
  } catch (e) {
    const msg = { rate_limited: 'Muitas consultas em pouco tempo. Tente novamente em alguns minutos.', not_granted: 'O uso do Claude não foi autorizado nesta página.', invalid_json: 'A resposta veio em formato inesperado. Tente novamente.', refused: 'O Claude não analisou esta descrição. Reformule o texto e tente de novo.' }[e && e.code] || 'Não foi possível analisar agora. Tente novamente.';
    IA = { estado: 'erro', resposta: null, erro: tr(msg) };
    if (e && ['not_granted', 'sampling_disabled', 'capability_disabled', 'capability_removed', 'not_declared'].includes(e.code)) CAP.sample = null;
  }
  render();
}
function aplicarIA(soTexto) {
  const r = IA.resposta || {};
  if (r.problemaReformulado) S.caso.problema = r.problemaReformulado;
  if (r.resultadoReformulado) S.caso.resultado = r.resultadoReformulado;
  if (!soTexto && r.sugestoes) {
    const s = r.sugestoes, c = S.caso;
    const id = v => String(v == null ? '' : v).split('=')[0].trim();
    const okVal = (k, v) => (OPC[k] || []).some(o => String(o[0]) === v);
    const lista = k => Array.isArray(s[k]) ? [...new Set(s[k].map(id).filter(v => okVal(k, v)))] : [];
    // impacto e tarefas primeiro: as tarefas sugerem o passo 2.2 (gancho do percurso)
    ['impactos', 'tarefas'].forEach(k => { const v = lista(k); if (v.length) { c[k] = v; marcarCampo(k); gancho(k); } });
    ['usuarios', 'afetados', 'consequencias'].forEach(k => {
      let v = lista(k); if (!v.length) return;
      if (k === 'consequencias' && v.length > 1) v = v.filter(x => x !== 'nenhuma');
      c[k] = v; marcarCampo(k);
    });
    if (s.frequencia != null && okVal('frequencia', id(s.frequencia))) { c.frequencia = id(s.frequencia); marcarCampo('frequencia'); }
  }
  ['problema', 'resultado'].forEach(k => { if (S.caso[k]) S.respC[k] = true; });
  if (S.exemplo !== 'novo') S.exemplo = 'editado';
  S.custo.editado = false;
  toast(tr(soTexto ? 'Texto reescrito aplicado.' : 'Sugestões aplicadas. Revise as respostas.'));
  render();
}

// ----------------------------------------------------------- relatório e exportação
const dadosRelatorio = () => secoesPlano();
function tituloPlano() { return S.caso.titulo || (S.ctx && S.ctx.olhando) || tr('Plano de contratação'); }
// v14: título de seção nas exportações (corpo: "1. pergunta: achado"; anexos: "Anexo A. título")
const tituloRel = s => s.rotulo ? s.num + '. ' + s.rotulo + ': ' + s.h : s.letra ? tr('Anexo {0}').replace('{0}', s.letra) + '. ' + s.h : s.h;
function relHTML(secs, completo) {
  secs = trFundo(secs);
  const e = esc;
  const body = secs.map(s => `${tituloRel(s) ? `<h3>${e(tituloRel(s))}</h3>` : ''}
    ${(s.pre || []).map(x => `<p><b>${e(x)}</b></p>`).join('')}
    ${(s.kv || []).length ? `<div class="tw"><table><tbody>${s.kv.map(([k, v]) => `<tr><th style="width:28%">${e(k)}</th><td>${e(v)}</td></tr>`).join('')}</tbody></table></div>` : ''}
    ${(s.p || []).map(x => `<p>${e(x)}</p>`).join('')}
    ${(s.list || []).length ? `<ul>${s.list.map(x => `<li>${e(x)}</li>`).join('')}</ul>` : ''}
    ${s.table ? `<div class="tw"><table><thead><tr>${s.table.head.map(h => `<th>${e(h)}</th>`).join('')}</tr></thead><tbody>${s.table.rows.map(r => `<tr>${r.map(x => `<td>${e(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}
    ${(s.pos || []).map(x => `<p class="note">${e(x)}</p>`).join('')}`).join('');
  if (!completo) return body;
  return `<!doctype html><html lang="${LOC()}"><head><meta charset="utf-8"><title>${e(tituloPlano())}</title>
  <style>body{font:15px/1.5 Georgia,serif;max-width:860px;margin:32px auto;padding:0 20px;color:#17212B}h1,h3{color:#0C2D4D;font-family:Arial,sans-serif}table{border-collapse:collapse;width:100%;font:13px Arial,sans-serif;margin:6px 0}th,td{border:1px solid #DDE3E9;padding:5px 8px;text-align:left;vertical-align:top}th{background:#EEF3F8}.note{color:#586674;border-left:3px solid #C3CDD7;padding-left:10px}</style></head>
  <body><h1>${e(tituloPlano())}</h1><p>${e(NOME_FERRAMENTA + ' · ' + tr('Plano de contratação') + ' · ' + tr('Gerado em') + ' ' + new Date().toLocaleDateString(LOC()) + '. ' + tr('Documento de trabalho baseado no guia; valores ilustrativos.'))}</p><p>${e(tr(TXT_VINCULO))}</p><p><small>${e(tr(TXT_ISENCAO))}</small></p>${body}</body></html>`;
}
function relMD(secs) {
  secs = trFundo(secs);
  const L = ['# ' + tituloPlano(), '', '_' + NOME_FERRAMENTA + ' · ' + tr('Plano de contratação') + ' · ' + tr('Gerado em') + ' ' + new Date().toLocaleDateString(LOC()) + '. ' + tr('Documento de trabalho baseado no guia; valores ilustrativos.') + '_', '', tr(TXT_VINCULO), '', '_' + tr(TXT_ISENCAO) + '_', ''];
  secs.forEach(s => {
    if (tituloRel(s)) L.push('## ' + tituloRel(s), '');
    (s.pre || []).forEach(x => L.push('**' + x + '**', ''));
    (s.kv || []).forEach(([k, v]) => L.push('- **' + k + ':** ' + (v || '')));
    if ((s.kv || []).length) L.push('');
    (s.p || []).forEach(x => L.push(x, ''));
    (s.list || []).forEach(x => L.push('- ' + x));
    if ((s.list || []).length) L.push('');
    if (s.table) { L.push('| ' + s.table.head.join(' | ') + ' |', '|' + s.table.head.map(() => '---').join('|') + '|'); s.table.rows.forEach(r => L.push('| ' + r.map(x => String(x).replace(/\|/g, '/')).join(' | ') + ' |')); L.push(''); }
    (s.pos || []).forEach(x => L.push('> ' + x, ''));
  });
  return L.join('\n');
}
async function baixar(nome, dados) {
  if (!CAP.downloads) return false;
  try { await CAP.downloads.save({ filename: nome, data: dados }); toast(tr('Arquivo enviado para download.')); return true; }
  catch (e) { if (e && e.code !== 'declined') toast(tr('Não foi possível baixar agora.')); return false; }
}
function slugCaso() {
  return (S.caso.titulo || (S.ctx && S.ctx.olhando) || 'case').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'case';
}
function nomeArq(ext) { return 'procurement-plan-' + slugCaso() + '.' + ext; }
function nomeArqCaso() { return 'ai-education-case-' + slugCaso() + '.json'; }
function dadosCaso() {
  return { app: 'ai-education-procurement-tool', formato: 13, versao: 13, v10: true, salvo: new Date().toISOString(), exemplo: S.exemplo, caso: S.caso, ctx: S.ctx, resp: S.resp, respC: S.respC, respDet: S.respDet || {}, revisar: S.revisar || [], feitos: S.feitos, custo: S.custo, moeda: S.moeda, lang: S.lang };
}
function aplicarImportado(o) {
  S.caso = clone(o.caso);   // normalizarEstado migra (v10 → v11) e completa com CASO_VAZIO
  S.ctx = o.ctx || {}; S.resp = o.resp || {}; S.respC = o.respC || {}; S.respDet = o.respDet && typeof o.respDet === 'object' ? o.respDet : {}; S.feitos = o.feitos || {}; S.revisar = Array.isArray(o.revisar) ? o.revisar : [];
  S.custo = o.custo || { base: 'caso', cfg: null, editado: false };
  if (o.moeda) S.moeda = o.moeda;
  S.exemplo = o.exemplo === 'novo' ? 'novo' : 'editado';
  S.fase = 'contexto'; S.passo = '1a'; S.vista = ''; S.boasVindas = false; S.v10 = !!o.v10;
  // formato 9 (v9 e v10) passa pela migração v10 → v11; formatos 9 e 11 (v11 e v12) passam pela migração v12 → v13
  S.versao = +o.formato === 13 ? 13 : +o.formato === 11 || +o.versao === 11 ? 11 : 9;
  SALVO = null; CONF_LIMPAR = false;
  if (typeof descartarPop === 'function') descartarPop();
  IA = { estado: '', resposta: null, erro: '' };
  normalizarEstado();
}
function importarCaso(txt) {
  let o = null;
  try { o = JSON.parse(txt); } catch (e) { o = null; }
  if (o && o.app === 'ai-education-procurement-tool' && [9, 11, 13].includes(+o.formato) && o.caso) {
    aplicarImportado(o); S.boasVindas = false; render(); window.scrollTo(0, 0); toast(tr('Caso importado.')); return true;
  }
  if (o && o.app === 'navegador-ia-educacao' && o.caso) {
    aplicarImportado(migrarV8(o)); S.boasVindas = false; render(); window.scrollTo(0, 0); toast(tr('Caso da versão anterior convertido. Revise as respostas de adoção.')); return true;
  }
  toast(tr('Este arquivo não é um caso exportado pela ferramenta.'));
  return false;
}
// v15 (auditoria C3): pela interface (arquivo escolhido ou dados colados), importar um caso que substitui respostas
// deste navegador pede confirmação nomeada antes (confirmarTroca, documento.js); importarCaso() continua direto
function importarComConfirmacao(txt) {
  let o = null;
  try { o = JSON.parse(txt); } catch (e) { o = null; }
  const valido = o && o.caso && ((o.app === 'ai-education-procurement-tool' && [9, 11, 13].includes(+o.formato)) || o.app === 'navegador-ia-educacao');
  if (valido && typeof confirmarTroca === 'function' && typeof precisaConfirmar === 'function' && precisaConfirmar()) {
    confirmarTroca((o.caso && o.caso.titulo) || (o.ctx && o.ctx.olhando) || tr('o caso importado'), () => importarCaso(txt));
    return true;
  }
  return importarCaso(txt);
}
function copiarTexto(txt, ok) {
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => toast(tr(ok)), () => toast(tr('Não foi possível copiar.')));
  else toast(tr('Não foi possível copiar.'));
}
function escolherArquivoCaso() {
  let inp = document.getElementById('imp-json');
  if (!inp) {
    inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json'; inp.id = 'imp-json'; inp.hidden = true;
    document.body.appendChild(inp);
  }
  inp.click();
}
// Importar caso: escolher o arquivo .json ou colar os dados copiados com "Copiar dados do caso"
function abrirImportar() {
  let dlg = document.getElementById('dlg-imp');
  if (!dlg) {
    dlg = document.createElement('dialog'); dlg.id = 'dlg-imp'; dlg.className = 'dlg-imp'; dlg.setAttribute('aria-labelledby', 'dlg-imp-t');
    document.body.appendChild(dlg);
  }
  dlg.innerHTML = `<form method="dialog" class="dlg-in">
    <h2 id="dlg-imp-t">${esc(tr('Importar caso'))}</h2>
    <p>${esc(tr('Escolha o arquivo .json exportado pela ferramenta ou cole os dados do caso copiados antes.'))}</p>
    <div class="row"><button type="button" class="btn" data-act="imp-arquivo">${esc(tr('Escolher arquivo .json'))}</button></div>
    <label for="imp-txt">${esc(tr('Dados do caso copiados'))}</label>
    <textarea id="imp-txt" rows="5" spellcheck="false" placeholder="{&quot;app&quot;: &quot;ai-education-procurement-tool&quot;, …}"></textarea>
    <div class="row dlg-pe"><button type="button" class="btn pri" data-act="imp-colar">${esc(tr('Importar dados colados'))}</button><button type="submit" class="btn" value="cancelar">${esc(tr('Cancelar'))}</button></div>
  </form>`;
  try { dlg.showModal(); } catch (e) { dlg.setAttribute('open', ''); }
  const ta = dlg.querySelector('#imp-txt'); if (ta) ta.focus();
}
function fecharImportar() { const d = document.getElementById('dlg-imp'); if (d) { try { d.close(); } catch (e) { d.removeAttribute('open'); } } }
function selecionarTexto() {
  const r = document.querySelector('#plano') || document.querySelector('.report'); if (!r) return;
  const sel = window.getSelection(), rg = document.createRange(); rg.selectNodeContents(r); sel.removeAllRanges(); sel.addRange(rg);
  toast(tr('Texto selecionado. Use Ctrl+C para copiar.'));
}

// ----------------------------------------------------------- caminhos e exemplos
function setPath(obj, path, val) {
  const ks = path.split('.'); let o = obj;
  for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null) o[ks[i]] = {}; o = o[ks[i]]; }
  o[ks[ks.length - 1]] = val;
}
function editarCfg() {
  if (S.custo.base === 'caso') S.custo.editado = true;
}
function textosExemplo() {
  const k = S.exemplo; if (!CASOS[k]) return;
  ['titulo', 'problema', 'resultado', 'linhaBaseMedida'].forEach(f => { if (CASOS[k][f]) S.caso[f] = tr(CASOS[k][f]); });
  (CASOS[k].ferramentas || []).forEach((fe, i) => { if (fe && fe.nome && S.caso.ferramentas && S.caso.ferramentas[i]) S.caso.ferramentas[i].nome = tr(fe.nome); });
  ['tarefaOutra', 'impactoOutro'].forEach(f => { if (CASOS[k][f]) S.caso[f] = tr(CASOS[k][f]); });
  const cx = CTX_EX[k]; if (cx && S.ctx) ['local', 'olhando', 'problemaOutro'].forEach(f => { if (cx[f]) S.ctx[f] = tr(cx[f]); });
}
function carregarExemplo(k) {
  SALVO = null; CONF_LIMPAR = false;
  if (typeof descartarPop === 'function') descartarPop();   // v15: lacuna aberta no documento não sobrevive à troca de caso
  if (k === 'novo' || !CASOS[k]) { S.caso = clone(CASO_VAZIO); S.exemplo = 'novo'; k = 'novo'; }
  else { S.caso = clone(CASOS[k]); S.exemplo = k; textosExemplo(); }
  aplicarExemploFluxo(k);
  S.caso = Object.assign(clone(CASO_VAZIO), S.caso);
  S.custo = { base: 'caso', cfg: null, editado: false }; IA = { estado: '', resposta: null, erro: '' };
  render(); window.scrollTo(0, 0);
  toast(tr(k === 'novo' ? 'Caso em branco.' : 'Exemplo carregado. As respostas são ilustrativas.'));
}

// ----------------------------------------------------------- entradas do caso
// valor numérico de um campo: inteiros não negativos no percurso
function valorNum(el) {
  const v = lerNumero(el.value);
  if (v === '') return '';
  return el.dataset.num === 'dec' ? v : Math.max(0, Math.round(v));
}
function gravarNumCaso(el, path) {
  setPath(S.caso, path, valorNum(el));
  const top = path.split('.')[0];
  marcarCampo(top); if (top !== path) S.respC[path] = true;
  return top;
}
const NUMERICOS_F = ['degrau', 'horizonte', 'autonomia'];

function ligar() {
  ligarCamposNum();
  document.addEventListener('click', e => {
    if (custosEvento(e)) return;
    if (eventoFluxo(e)) return;
    const cb = e.target.closest('[data-cbase]');
    if (cb) { S.custo.base = cb.dataset.cbase; S.custo.cfg = null; S.custo.editado = false; render(); return; }
    const a = e.target.closest('[data-act]'); if (!a) return;
    const act = a.dataset.act;
    if (act === 'limpar') carregarExemplo('novo');
    else if (act === 'ia') analisarIA();
    else if (act === 'ia-aplicar') aplicarIA(false);
    else if (act === 'ia-texto') aplicarIA(true);
    else if (act === 'ir-prem' || act === 'ir-linhas') { const d = document.querySelector(`details[data-det="${act === 'ir-prem' ? 'prem' : 'linhas'}"]`); if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
    else if (act === 'recalc') { S.custo.editado = false; S.custo.cfg = null; render(); }
    else if (act === 'rm') { const cfg = cfgAtual(); const arr = a.dataset.arr.split('.').reduce((o, k) => o[k], cfg); arr.splice(+a.dataset.i, 1); editarCfg(); render(); }
    else if (act === 'add-item') { const cfg = cfgAtual(); (cfg.itens = cfg.itens || []).push({ cat: 'Outros', nome: 'Novo item', nat: 'EXT', v: [0, 0, 0, 0] }); editarCfg(); render(); }
    else if (act === 'add-pessoa') { const cfg = cfgAtual(); (cfg.pessoas = cfg.pessoas || []).push({ cat: 'Pessoas', nome: 'Nova atividade', nat: 'CAP', partes: [['gestor_produto', [0, 0.1, 0.1, 0.1]]] }); editarCfg(); render(); }
    else if (act === 'add-saida') { const cfg = cfgAtual(); cfg.saida = cfg.saida || {}; (cfg.saida.itens = cfg.saida.itens || []).push({ nome: 'Novo custo de saída', valor: 0 }); editarCfg(); render(); }
    else if (act === 'copiar') {
      const txt = relMD(dadosRelatorio());
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => toast(tr('Plano copiado.')), () => selecionarTexto());
      else selecionarTexto();
    }
    else if (act === 'exp-json') {
      const t = JSON.stringify(dadosCaso(), null, 1);
      if (CAP.downloads) baixar(nomeArqCaso(), t); else copiarTexto(JSON.stringify(dadosCaso()), 'Dados do caso copiados.');
    }
    else if (act === 'copiar-json') copiarTexto(JSON.stringify(dadosCaso()), 'Dados do caso copiados.');
    else if (act === 'imp-json') abrirImportar();
    else if (act === 'imp-arquivo') { fecharImportar(); escolherArquivoCaso(); }
    else if (act === 'imp-colar') {
      const ta = document.getElementById('imp-txt'), txt = ta ? ta.value.trim() : '';
      if (!txt) { toast(tr('Cole antes os dados do caso.')); return; }
      if (importarComConfirmacao(txt)) fecharImportar();
    }
    else if (act === 'dl-md') baixar(nomeArq('md'), relMD(dadosRelatorio()));
    else if (act === 'dl-html') baixar(nomeArq('html'), relHTML(dadosRelatorio(), true));
    else if (act === 'dl-csv') baixar('costs-' + slugCaso() + '.csv', csvCustos());
    else if (act === 'dl-json') baixar(nomeArqCaso(), JSON.stringify(dadosCaso(), null, 1));
  });
  // "restaurar" não tira o foco do campo: sem isso, o 'change' redesenha a tela antes do clique chegar ao botão
  document.addEventListener('mousedown', e => { if (e.target && e.target.closest && e.target.closest('[data-pc-rest]')) e.preventDefault(); });
  document.addEventListener('toggle', e => {
    eventoFluxo(e);
    const d = e.target; if (d.dataset && d.dataset.det === 'prem') S.custo.abrirPrem = d.open;
  }, true);
  document.addEventListener('input', e => {
    if (eventoFluxo(e)) return;
    const el = e.target; if (!el.dataset) return;
    // números do caso: atualizam estado e laterais sem redesenhar
    if (el.dataset.num != null && (el.dataset.fn || el.dataset.f)) { gravarNumCaso(el, el.dataset.fn || el.dataset.f); atualizarLaterais(); return; }
    if (el.dataset.f && (el.tagName === 'TEXTAREA' || el.type === 'text')) { S.caso[el.dataset.f] = el.value; marcarCampo(el.dataset.f); atualizarLaterais(); return; }
    if (el.dataset.cfgs) { setPath(cfgAtual(), el.dataset.cfgs, el.value); editarCfg(); salvar(); }
    if (el.dataset.cfg && typeof atualizarSeloFaixa === 'function') atualizarSeloFaixa(el, true);   // v14 (BL4.3): a faixa de referência acompanha a digitação
  });
  document.addEventListener('change', e => {
    const el = e.target;
    if (el.id === 'imp-json' && el.files && el.files[0]) { const r = new FileReader(); r.onload = () => importarComConfirmacao(String(r.result)); r.readAsText(el.files[0]); el.value = ''; return; }
    if (custosEvento(e)) return;
    if (eventoFluxo(e)) return;
    if (!el.dataset) return;
    if (el.id === 'sel-lang') { if (typeof descartarPop === 'function') descartarPop(true); S.lang = el.value; NOMES_MOEDA = null; aplicarIdioma(S.lang); textosExemplo(); render(); return; }
    if (el.id === 'sel-exemplo') { if (el.value) carregarExemplo(el.value); el.value = ''; return; }
    if (el.dataset.num != null && (el.dataset.fn || el.dataset.f)) {
      const top = gravarNumCaso(el, el.dataset.fn || el.dataset.f);
      if (!gancho(top)) atualizarLaterais();
      return;
    }
    if (el.dataset.f && el.type !== 'text' && el.tagName !== 'TEXTAREA') {
      const k = el.dataset.f; let v = el.value;
      if (NUMERICOS_F.includes(k)) v = +v;
      S.caso[k] = v; marcarCampo(k);
      if (!gancho(k)) atualizarLaterais();
      return;
    }
    if (el.dataset.fm) {
      const k = el.dataset.fm; const s = new Set(S.caso[k] || []); el.checked ? s.add(el.value) : s.delete(el.value);
      // "nenhuma"/"nenhum" exclui as demais opções, e vice-versa
      const nada = { consequencias: 'nenhuma', dados: 'nenhum', testes: 'recomendar' }[k];
      if (nada && el.checked) { if (el.value === nada) { s.clear(); s.add(nada); } else s.delete(nada); }
      S.caso[k] = [...s]; marcarCampo(k);
      if (gancho(k)) return;
      if (nada) document.querySelectorAll(`[data-fm="${k}"]`).forEach(x => { x.checked = S.caso[k].includes(x.value); });
      atualizarLaterais(); return;
    }
    if (el.dataset.fb) { S.caso[el.dataset.fb] = el.checked; marcarCampo(el.dataset.fb); if (!gancho(el.dataset.fb)) atualizarLaterais(); return; }
    if (el.dataset.cfg) {
      let v = lerNumero(el.value); if (v === '') v = 0;
      if (el.dataset.pct) v = v / 100;
      setPath(cfgAtual(), el.dataset.cfg, v); editarCfg(); renderCustosResultados(); atualizarLaterais();
      if (typeof atualizarSeloFaixa === 'function') atualizarSeloFaixa(el, false);
      return;
    }
    if (el.dataset.cfgs) { setPath(cfgAtual(), el.dataset.cfgs, el.value); editarCfg(); renderCustosResultados(); atualizarLaterais(); return; }
    if (el.dataset.moeda) {
      if (el.dataset.moeda === 'taxa' && el.dataset.mcod !== S.moeda.cod) return;
      if (el.dataset.moeda === 'cod') { S.moeda.cod = el.value; S.moeda.taxa = ''; render(); }
      else { S.moeda.taxa = lerNumero(el.value); S.moeda.taxaDe = S.moeda.cod; renderCustosResultados(); atualizarLaterais(); }
      return;
    }
  });
}

// ----------------------------------------------------------- início
carregar();
if (!S.lang) S.lang = idiomaInicial();
aplicarIdioma(S.lang);
textosExemplo();
observarIdioma();
montarIdiomas();
ligar();
render();
(async () => {
  if (!window.claude || !window.claude.use) return;
  try { CAP.sample = await window.claude.use('sample'); } catch (e) { CAP.sample = null; }
  try { CAP.downloads = await window.claude.use('downloads'); } catch (e) { CAP.downloads = null; }
  render();
})();
