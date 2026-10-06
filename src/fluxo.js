// =====================================================================
// Percurso em três fases: lógica, telas e eventos (dados em fluxo_dados.js)
// Durante o percurso só há perguntas; diagnóstico e recomendações ficam no plano de contratação.
// =====================================================================

const CAMPO_POR_ID = {};
CAMPOS.forEach(f => { CAMPO_POR_ID[f.id] = f; });
const CAMPOS_SUGERIDOS = ['usuarios', 'afetados', 'consequencias', 'frequencia'];
let ARQ_ABERTA = false;
let NUM_ABERTO = false;   // <details> "Ver os números detalhados" do 3.3
let CONF_LIMPAR = false;  // confirmação inline de "Começar em branco" no painel

// ----------------------------------------------------------- estado
function estadoFluxo() {
  S.ctx = Object.assign({ nivel: '', nivelOutro: '', local: '', etapas: {}, dominio: '', comps: [], compOutro: '', olhando: '' }, S.ctx || {});
  if (!S.ctx.etapas || typeof S.ctx.etapas !== 'object') S.ctx.etapas = {};
  S.resp = S.resp || {};
  S.respC = S.respC || {};
  S.feitos = S.feitos || {};
  S.info = S.info || {};
  if (S.caso && (!S.caso.piloto || typeof S.caso.piloto !== 'object')) S.caso.piloto = { escolas: '', participantes: '', meses: '' };
  if (S.fase == null || (S.fase !== '' && !PASSOS[S.fase])) S.fase = 'contexto';
  if (S.passo == null) S.passo = '';
  if (S.fase && S.passo && !PASSOS[S.fase].some(p => p[0] === S.passo)) S.passo = PASSOS[S.fase][0][0];
  if (S.vista && S.vista !== 'plano') S.vista = '';
  return S.ctx;
}
// Num caso em branco, um campo com valor padrão só conta depois que a pessoa responde.
function respondido(campo) { return S.exemplo !== 'novo' || !!(S.respC || {})[campo]; }
function aplicarExemploFluxo(k) {
  const CX = typeof CTX_EX !== 'undefined' ? CTX_EX : {}, RX = typeof RESP_EX !== 'undefined' ? RESP_EX : {};
  S.ctx = clone(CX[k] || {}); S.resp = clone(RX[k] || {}); S.feitos = {}; S.respC = {}; S.vista = ''; S.info = {}; S.revisar = [];
  // nos exemplos, as respostas de experiência de uso já estão confirmadas (as sugestões não as substituem)
  if (k !== 'novo') { CAMPOS_SUGERIDOS.forEach(c => { S.respC[c] = true; }); confirmarGerados(S.caso, S.respC); }
  S.v10 = true;
  if (CX[k]) { ['local', 'olhando', 'compOutro'].forEach(c => { if (S.ctx[c]) S.ctx[c] = tr(S.ctx[c]); }); }
  S.fase = 'contexto'; S.passo = '1a';
  estadoFluxo();
}

// ----------------------------------------------------------- cálculos
function etapasAtivas() { return ETAPAS_ENS.filter(e => (((S.ctx || {}).etapas || {})[e[0]] || {}).on); }
function alunosEtapa(id) {
  const e = ((S.ctx || {}).etapas || {})[id] || {};
  const def = ETAPAS_ENS.find(x => x[0] === id);
  const temAnos = def && def[3].length;
  if (!temAnos || e.soTotal) return +e.alunos || 0;
  return (Array.isArray(e.anos) ? e.anos : []).reduce((a, b) => a + (+b || 0), 0);
}
function totaisCtx() {
  if (!S.ctx || !S.ctx.etapas) return { escolas: 0, alunos: 0, n: 0, etapas: [] };
  const at = etapasAtivas();
  return { escolas: at.reduce((a, e) => a + (+(S.ctx.etapas[e[0]] || {}).escolas || 0), 0), alunos: at.reduce((a, e) => a + alunosEtapa(e[0]), 0), n: at.length, etapas: at.map(e => e[0]) };
}
function rotulo(lista, v) { return ((lista || []).find(o => String(o[0]) === String(v)) || ['', ''])[1]; }
function listaOpc(f) { return typeof f.opc === 'string' ? ((typeof OPC !== 'undefined' && OPC[f.opc]) || []) : (f.opc || []); }
function lerNum(v) {
  if (typeof lerNumero === 'function') return lerNumero(v);
  const s = String(v == null ? '' : v).replace(/[^\d.,-]/g, '').replace(/[.,](?=\d{3}(\D|$))/g, '').replace(',', '.');
  return s === '' ? '' : (+s || 0);
}
function valorCampo(f) {
  if (f.onde === 'resp') return S.resp[f.id];
  if (f.onde === 'ctx') return S.ctx[f.id];
  return S.caso[f.id];
}
function vazio(v) { return v == null || v === '' || (Array.isArray(v) && !v.length); }
function textoCampo(f) { return f.tPoc && S.caso.teste === 'poc' ? f.tPoc : f.t; }

// ----------------------------------------------------------- padrões gerados (v10)
// Nada vem marcado antes de a pessoa agir. Quando ela marca uma resposta de origem, os campos que dependem
// dela recebem um valor sugerido ("sugerido"), que só conta depois de confirmado (S.respC), como no passo 2.2.
// Mudar a origem recalcula só as sugestões ainda não confirmadas.
//   2.0 teste → 2.3.6 tamanho e duração; 2.3.1 tipo de tecnologia → 2.3.2 pagamento e 2.3.3 licença;
//   2.2.1 usuários (confirmados) → 3.1.1 pessoas na rede.
const SUB_PILOTO = ['escolas', 'participantes', 'meses'];
const PAG_LIC = { publica: ['gratuito', 'termos'], aberta: ['consumo', 'aberta'], paga: ['institucional', 'assinatura'] };
const ALUNOS_POR_PROF = 25;   // premissa ilustrativa: 1 professor para cada 25 estudantes
// Usuários de 2.2.1 já confirmados pela pessoa (uma sugestão das tarefas ainda não conta)
function usuariosMarcados() { return S.respC.usuarios || S.exemplo !== 'novo' ? (S.caso.usuarios || []) : []; }
// Base de pessoas para as sugestões: estudantes das etapas ou, se só professores usam, a estimativa de professores
function basePessoas() {
  const u = usuariosMarcados(), al = totaisCtx().alunos;
  if (!(al > 0)) return { n: 0, prof: false };
  if (!u.length || u.includes('estudantes')) return { n: al, prof: false };
  if (u.includes('professores')) return { n: Math.max(1, Math.round(al / ALUNOS_POR_PROF)), prof: true };
  return { n: 0, prof: false };
}
function padroesGerados() {
  const c = S.caso, t = totaisCtx(), g = {};
  if (c.teste === 'poc') g.piloto = { escolas: '', participantes: 15, meses: 2 };
  else if (c.teste === 'piloto' || c.teste === 'recomendar') {
    const b = basePessoas();
    g.piloto = {
      escolas: t.escolas > 0 ? Math.min(t.escolas, Math.max(3, Math.min(30, Math.round(0.05 * t.escolas)))) : '',
      participantes: b.n > 0 ? Math.max(1, Math.round(0.05 * b.n)) : '',
      meses: 4,
    };
  }
  const pl = PAG_LIC[c.tipoTec];
  if (pl) { g.pagamento = pl[0]; g.licenca = pl[1]; }
  const u = usuariosMarcados();
  if (u.length) { const b = basePessoas(); if (b.n > 0) g.elegiveis = b.n; }
  return g;
}
function aplicarPadroes() {
  if (!S.caso) return false;
  const c = S.caso, g = padroesGerados();
  let mudou = false;
  ['pagamento', 'licenca', 'elegiveis'].forEach(k => {
    if (S.respC[k]) return;
    const v = g[k] != null ? g[k] : '';
    if (c[k] !== v) { c[k] = v; mudou = true; }
  });
  c.piloto = c.piloto && typeof c.piloto === 'object' ? c.piloto : { escolas: '', participantes: '', meses: '' };
  SUB_PILOTO.forEach(k => {
    if (S.respC['piloto.' + k]) return;
    const v = g.piloto && g.piloto[k] != null ? g.piloto[k] : '';
    if (c.piloto[k] !== v) { c.piloto[k] = v; mudou = true; }
  });
  if (mudou && S.custo) S.custo.editado = false;
  return mudou;
}
// Marca como confirmados os valores já preenchidos dos campos gerados (exemplos e estados anteriores à v10)
function confirmarGerados(caso, respC) {
  ['pagamento', 'licenca', 'elegiveis'].forEach(k => { if (!vazio(caso[k])) respC[k] = true; });
  const p = caso.piloto || {};
  SUB_PILOTO.forEach(k => { if (!vazio(p[k])) respC['piloto.' + k] = true; });
}
// Confirma a sugestão de um campo (rodapé "Confirmar e continuar" ou clique na opção sugerida)
function confirmarSugestao(f) {
  if (f.id === 'piloto') SUB_PILOTO.forEach(k => { S.respC['piloto.' + k] = true; });
  S.respC[f.id] = true;
}
// O campo mostra um valor gerado ainda não confirmado pela pessoa?
function sugerido(f) {
  if (!f) return false;
  if (f.sugere) return !S.respC[f.id] && (S.caso.tarefas || []).length > 0;
  if (!f.sugDe) return false;
  if (f.id === 'piloto') { const p = S.caso.piloto || {}; return SUB_PILOTO.some(k => !S.respC['piloto.' + k] && !vazio(p[k])); }
  return !S.respC[f.id] && !vazio(valorCampo(f));
}
function textoSugerido(f) {
  if (f.sugere) return 'sugerido pela tarefa';
  return { teste: 'sugerido pela resposta 2.0', tipoTec: 'sugerido pela resposta 2.3.1', usuarios: 'sugerido pela resposta 2.2.1' }[f.sugDe] || 'sugerido';
}
// Nota que explica de onde vem o valor sugerido (só aparece enquanto a sugestão não é confirmada)
function notaSugerido(f) {
  const L = [];
  if (f.id === 'piloto' && S.caso.teste === 'poc') L.push('Sugestão para uma prova de conceito: 15 pessoas por 2 meses, sem escolas. Ajuste ao seu teste.');
  else if (f.id === 'piloto') {
    L.push('Sugestão: cerca de 5% das escolas da rede (no mínimo 3 e no máximo 30), 5% das pessoas que usariam e 4 meses. Ajuste ao seu piloto.');
    if (basePessoas().prof) L.push('Participantes estimados com uma premissa ilustrativa de 1 professor para cada 25 estudantes, e não com um dado da sua rede.');
  } else if (f.id === 'elegiveis') {
    L.push(basePessoas().prof ? 'Sugestão ilustrativa: 1 professor para cada 25 estudantes das etapas marcadas. É uma premissa desta ferramenta, e não um dado da sua rede; informe o número real se souber.'
      : 'Sugestão: o total de estudantes das etapas marcadas no passo 1.1. Confirme ou informe outro número.');
  } else if (f.id === 'pagamento' || f.id === 'licenca') L.push('Sugestão a partir do tipo de tecnologia. Confirme ou escolha outra opção.');
  return L.length ? `<div class="hint sug-nota">${L.map(x => `<span>${esc(x)}</span>`).join(' ')}</div>` : '';
}
// A pergunta está respondida? Com semSug, considera as sugestões como se estivessem confirmadas.
function qOk(f, semSug) {
  const x = S.ctx, c = S.caso, v = valorCampo(f);
  switch (f.tipo) {
    case 'seg': return !!S.resp[f.id];
    case 'etapas': return etapasAtivas().length > 0;
    case 'grade': { const at = etapasAtivas(); return at.length > 0 && at.every(e => +(x.etapas[e[0]] || {}).escolas > 0 && alunosEtapa(e[0]) > 0); }
    case 'dom': return !!x.dominio;
    case 'comps': return (x.comps || []).length > 0;
    case 'texto': case 'area': return !!String(v || '').trim();
    case 'num': return +v > 0 && (semSug || !sugerido(f));
    case 'setup': { const p = c.piloto || {}; return +p.participantes > 0 && +p.meses > 0 && (c.teste === 'poc' || +p.escolas > 0) && (semSug || !sugerido(f)); }
    default:
      if (vazio(v)) return false;
      if (!semSug && sugerido(f)) return false;
      return f.padrao ? respondido(f.id) || (semSug && sugerido(f)) : true;
  }
}
function camposPasso(id) { return CAMPOS.filter(f => f.passo === id); }
// Perguntas obrigatórias ainda sem resposta num passo (objetos de CAMPOS)
function faltas(id) { return camposPasso(id).filter(f => !f.opcional && !qOk(f)); }
// Passos sem perguntas (3.3 estimativa, 3.4 recomendações): concluídos quando abertos
const PASSOS_VER = ['3c', '3d'];
function passoFeito(id) { return PASSOS_VER.includes(id) ? !!S.feitos[id] : !faltas(id).length; }
function estadoPasso(id) {
  if (passoFeito(id)) return 'ok';
  if (!PASSOS_VER.includes(id) && camposPasso(id).some(f => qOk(f))) return 'andamento';
  return '';
}
function fasePasso(id) { return Object.keys(PASSOS).find(f => PASSOS[f].some(p => p[0] === id)); }
function numPasso(id) { return (PASSO_INFO[id] || {}).num || id; }
function nomePasso(id) { const f = fasePasso(id); return f ? (PASSOS[f].find(p => p[0] === id) || ['', ''])[1] : ''; }
function progressoFase(fid) {
  const ps = PASSOS[fid]; const feitos = ps.filter(([id]) => passoFeito(id)).length;
  return { feitos, total: ps.length, pct: feitos / ps.length, completa: feitos === ps.length };
}
function idQ(n) { return 'q-' + String(n).replace(/\./g, '-'); }
// Todas as perguntas sem resposta, para o plano de contratação
function faltasTodas() {
  const out = [];
  FASES.forEach(fa => PASSOS[fa.id].forEach(([pid]) => faltas(pid).forEach(f => out.push({ n: f.n, id: f.id, texto: textoCampo(f), passo: pid, ir: fa.id + ':' + pid + ':' + f.n.replace(/\./g, '-') }))));
  return out;
}
function questoesGov() { return QUESTOES_G; }
function numerosCusto() {
  const cfg = cfgAtual(); garantirOpc(cfg);
  const av = avaliar(calcular(cfg)), ind = indicadores(cfg, av), orc = orcamento(cfg);
  const T = av.r.anos.filter(t => t > 0);
  const anual = T.length ? T.reduce((s, t) => s + (orc.dot[t] || 0), 0) / T.length : 0;
  let camadas = null;
  try { if (typeof somaPorCamada === 'function') camadas = somaPorCamada(av); } catch (e) { camadas = null; }
  return { av, ind, orc, H: av.r.H, piloto: orc.dot[0] || 0, ano0: (av.ecoAno || [])[0] || 0, anual, porAluno: ind.icu, total: av.ctEco, camadas };
}
// Pré-marca a experiência de uso a partir das tarefas. Nos campos já confirmados, acrescenta o que as
// tarefas novas sugerem, sem retirar o que a pessoa escolheu; o campo volta a "sugerido pela tarefa"
// e o passo 2.2 mostra o aviso de revisão (S.revisar).
function aplicarSugestoes() {
  const tarefas = S.caso.tarefas || [];
  let sug = null;
  if (tarefas.length && typeof perfisSugeridos === 'function') { try { sug = perfisSugeridos(tarefas, totaisCtx().etapas); } catch (e) { sug = null; } }
  const rev = [];
  CAMPOS_SUGERIDOS.forEach(k => {
    if (S.respC[k]) {
      if (!sug || sug[k] == null) return;
      const novo = juntarSugestao(k, S.caso[k], sug[k]);
      if (JSON.stringify(novo) !== JSON.stringify(S.caso[k])) { S.caso[k] = novo; delete S.respC[k]; rev.push(k); }
      return;
    }
    if (sug && sug[k] != null) S.caso[k] = clone(sug[k]);
    else if (!tarefas.length && typeof CASO_VAZIO !== 'undefined') S.caso[k] = clone(CASO_VAZIO[k]);
  });
  if (rev.length) { S.revisar = [...new Set((S.revisar || []).concat(rev))]; if (S.custo) S.custo.editado = false; }
  return rev;
}
// União da resposta confirmada com a sugestão nova (listas) ou a frequência mais alta das duas
function juntarSugestao(k, atual, sug) {
  if (!Array.isArray(sug)) {
    const O = typeof ORDEM_FREQ !== 'undefined' ? ORDEM_FREQ : [];
    if (!atual) return sug;
    return k === 'frequencia' && O.indexOf(sug) > O.indexOf(atual) ? sug : atual;
  }
  const lista = (Array.isArray(atual) ? atual : []).concat(sug.filter(v => !(atual || []).includes(v)));
  const ids = (typeof OPC !== 'undefined' && OPC[k] ? OPC[k] : []).map(o => o[0]);
  let out = ids.filter(v => lista.includes(v)).concat(lista.filter(v => !ids.includes(v)));
  if (k === 'consequencias' && out.length > 1) out = out.filter(v => v !== 'nenhuma');
  return out;
}
// Campos da experiência de uso que as tarefas mudaram e que ainda aguardam revisão
function camposRevisar() { return (S.revisar || []).map(k => CAMPO_POR_ID[k]).filter(f => f && sugerido(f)); }
function avisoRevisar(id) {
  const fs = camposRevisar(); if (!fs.length) return '';
  if (id === '2a') return `<div class="aviso rev" role="status"><b>As tarefas mudaram as respostas sugeridas do passo 2.2.</b> <button type="button" class="link" data-ir="piloto:2b">Revisar o passo 2.2</button></div>`;
  return `<div class="aviso rev" role="status" id="aviso-rev"><b>As tarefas mudaram. Revise estas respostas.</b>
    <ul>${fs.map(f => `<li><button type="button" class="link" data-ir="piloto:2b:${f.n.replace(/\./g, '-')}"><span class="qn-l">${f.n}</span> <span>${esc(textoCampo(f))}</span></button></li>`).join('')}</ul></div>`;
}

// Premissas unitárias da estimativa, tiradas de cfgAtual(): exemplo de origem, pessoas, adoção, preço da
// licença, uso do modelo, dispositivos e conectividade. Usadas no passo 3.3 e em A2 do plano. Textos já traduzidos.
function premissasUnitarias() {
  const cfg = cfgAtual(), ce = casoAtual(), c = S.caso, L = [];
  const nf = (x, d = 1) => (+x || 0).toLocaleString(LOC(), { maximumFractionDigits: d });
  const arqC = typeof arquitetura === 'function' ? arquitetura(cfg) : ({ A: 'saas', B: 'api', C: 'ow' })[cfg.origem];
  const orig = ({ A: 'saas', B: 'api', C: 'ow' })[cfg.origem] || arqC;
  if (orig && typeof PRESET_ARQ !== 'undefined' && PRESET_ARQ[orig]) L.push(tr('Premissas de partida:') + ' ' + tr(PRESET_ARQ[orig]) + '.');
  const dm = cfg.demanda || {}, E = dm.E || [], H = Math.max(1, E.length - 1);
  const Emax = Math.max(0, ...E.slice(1));
  if (Emax) L.push(tr('Pessoas que usariam na rede:') + ' ' + fmtInt(Emax) + (ce.__elegPadrao ? ' (' + tr('premissa padrão; informe no passo 3.1.1') + ')' : '') + '.');
  if (E[0]) L.push(tr('Participantes do teste (Ano 0):') + ' ' + fmtInt(E[0]) + '.');
  if (dm.adocao != null) {
    const anos = Array.from({ length: H }, (_, i) => i + 1);
    L.push(tr('Usuários ativos entre as pessoas que usariam:') + ' ' + anos.map(t => tr('Ano ' + t) + ': ' + pct(ano(dm.adocao, t))).join('; ') + '.');
  }
  if (arqC === 'saas' && cfg.saas && cfg.saas.ativo) {
    const sa = cfg.saas;
    if (c.pagamento === 'incluida' || !(+sa.preco > 0)) L.push(tr('Licença: incluída em contrato existente, sem preço adicional.'));
    else if (c.pagamento === 'usuario') L.push(tr('Preço da licença por usuário por mês:') + ' ' + din(sa.preco, 2) + ' (' + tr('licenças contratadas = usuários ativos + ' + pct((+sa.fatorNominal || 1) - 1)) + ').');
    else L.push(tr('Preço da licença institucional por pessoa que usaria, por mês:') + ' ' + din(sa.preco, 2) + '.');
    if ((c.usuarios || []).includes('estudantes') && (c.usuarios || []).length && cfg.origem === 'A') L.push(tr('O preço de referência vem de um copiloto para professores; confira o preço por estudante, que costuma ser diferente.'));
  }
  if ((arqC === 'api' || arqC === 'ow') && +dm.s > 0) L.push(tr('Uso por usuário ativo:') + ' ' + tr(nf(dm.s) + ' sessões por mês e ' + nf(dm.i) + ' interações por sessão') + '.');
  if (arqC === 'api' && cfg.api) {
    const a = cfg.api;
    L.push(tr('Modelo por API:') + ' ' + tr(nf(a.k) + ' chamadas por interação, com ' + fmtInt(a.Tin) + ' tokens de entrada e ' + fmtInt(a.Tout) + ' de saída por chamada') + '; ' + tr('preço por milhão de tokens de entrada e de saída:') + ' ' + din(a.Pin, 2) + ' / ' + din(a.Pout, 2) + '.');
  }
  if (arqC === 'ow' && cfg.ow) {
    const o = cfg.ow;
    L.push(tr('Modelo de pesos abertos:') + ' ' + tr(fmtInt(o.Tin) + ' tokens de entrada e ' + fmtInt(o.Tout) + ' de saída por interação') + '; ' + tr('preço da hora de GPU:') + ' ' + din(o.Pgpu, 2) + '.');
  }
  if (ce.infra === 'complementar' && typeof PREMISSAS_K1 !== 'undefined') {
    const K = PREMISSAS_K1;
    L.push(tr('Dispositivos complementares:') + ' ' + din(K.precoDispositivo, 0) + ' ' + tr('por dispositivo, para ' + pct(K.fracaoSemDispositivo) + ' dos novos usuários') + '; ' + tr('conectividade incremental:') + ' ' + din(K.conectEscolaAno, 0) + ' ' + tr('por escola por ano') + '.');
  }
  return L;
}
// Adaptação ao contexto (K3.1 + K3.2) no Ano 0, para mostrar o efeito da resposta 2.3.4
function adaptacaoAno0(av) { return (av.linhas || []).filter(l => l.s === 'K3.1' || l.s === 'K3.2').reduce((t, l) => t + ((l.eco || [])[0] || 0), 0); }
// O painel só mostra a estimativa depois das respostas que a definem (2.1.1, 2.3.1 e 3.1.1)
function faltasEstimativa() { return ['tarefas', 'tipoTec', 'elegiveis'].map(k => CAMPO_POR_ID[k]).filter(f => f && !qOk(f)); }

// ----------------------------------------------------------- componentes
function nCampo(o) {
  if (typeof inputNum === 'function') return inputNum(o);
  const v = o.valor == null || o.valor === '' ? '' : (typeof fmtEntrada === 'function' ? fmtEntrada(o.valor, o.casas || 0) : o.valor);
  return `<span class="campo"><input type="text" inputmode="numeric" data-num="int" autocomplete="off" id="${esc(o.id)}" ${o.attrs || ''} value="${esc(v)}" placeholder="${esc(o.ph || ' ')}"${o.rotulo ? ` aria-label="${esc(o.rotulo)}"` : ''}><span class="ok-in" aria-hidden="true">✓</span></span>`;
}
function tCampo(id, attrs, val, ph, rotulo) {
  return `<span class="campo"><input id="${id}" type="text" ${attrs} value="${esc(val || '')}" placeholder="${esc(ph || ' ')}"${rotulo ? ` aria-label="${esc(rotulo)}"` : ''}><span class="ok-in" aria-hidden="true">✓</span></span>`;
}
function aCampo(id, attrs, val, rows, ph) {
  return `<span class="campo area"><textarea id="${id}" ${attrs} rows="${rows || 3}" placeholder="${esc(ph || ' ')}">${esc(val || '')}</textarea><span class="ok-in" aria-hidden="true">✓</span></span>`;
}
function attrCampo(f, id) { return f.onde === 'ctx' ? `data-ctxt="${id || f.id}"` : `data-f="${id || f.id}"`; }
function subOpc(o) { return o[2] && typeof o[2] === 'string' && !(typeof NIVEIS !== 'undefined' && NIVEIS.includes(o[2])) ? o[2] : ''; }
function marcado(f, valOpc) {
  const v = valorCampo(f);
  const tem = Array.isArray(v) ? v.includes(valOpc) : String(v) === String(valOpc) && v !== '' && v != null;
  if (!tem) return false;
  if (f.onde === 'ctx' || f.onde === 'resp') return true;
  return respondido(f.id) || sugerido(f) || !f.padrao;
}
function campoOutro(f) {
  if (!f.outro) return '';
  const v = valorCampo(f);
  const on = Array.isArray(v) ? v.includes(f.outro.v) : v === f.outro.v;
  if (!on) return '';
  const val = f.onde === 'ctx' ? S.ctx[f.outro.id] : S.caso[f.outro.id];
  return `<div class="outro">${tCampo('f-' + f.outro.id, attrCampo(f, f.outro.id), val, f.outro.t, f.outro.t)}</div>`;
}
function opRadio(f) {
  const nome = f.id, attr = f.onde === 'ctx' ? 'data-ctx' : 'data-f';
  return `<div class="opts${f.cols ? ' cols' : ''}" role="radiogroup" aria-labelledby="qt-${f.id}">${listaOpc(f).map(o => `<label class="opt"><input type="radio" name="${nome}" value="${esc(o[0])}" ${attr}="${nome}" ${marcado(f, o[0]) ? 'checked' : ''}><span><b>${esc(o[1])}</b>${subOpc(o) ? `<small>${esc(subOpc(o))}</small>` : ''}</span></label>`).join('')}</div>${campoOutro(f)}`;
}
function opChips(f) {
  return `<div class="chips" role="group" aria-labelledby="qt-${f.id}">${listaOpc(f).map(o => `<label class="chip"><input type="checkbox" data-fm="${f.id}" value="${esc(o[0])}" ${marcado(f, o[0]) ? 'checked' : ''}><span>${esc(o[1])}${subOpc(o) ? ` <small>${esc(subOpc(o))}</small>` : ''}</span></label>`).join('')}</div>${campoOutro(f)}`;
}
// Tarefas: cartões com exemplo; as ligadas ao impacto escolhido recebem a etiqueta "sugerida pelo impacto"
function opMulti(f) {
  const imps = S.caso.impactos || [];
  const IT = typeof IMPACTO_TAREFAS !== 'undefined' ? IMPACTO_TAREFAS : {};
  const ligadas = new Set(imps.flatMap(i => IT[i] || []));
  return `<div class="opts cols" role="group" aria-labelledby="qt-${f.id}">${listaOpc(f).map(o => `<label class="opt"><input type="checkbox" data-fm="${f.id}" value="${esc(o[0])}" ${marcado(f, o[0]) ? 'checked' : ''}><span><b>${esc(o[1])}</b>${subOpc(o) ? `<small>${esc(subOpc(o))}</small>` : ''}${ligadas.has(o[0]) ? '<span class="tag sug-imp">sugerida pelo impacto</span>' : ''}</span></label>`).join('')}</div>${campoOutro(f)}`;
}
function opSeg(f) {
  const v = S.resp[f.id];
  return `<div class="seg" role="group" aria-labelledby="qt-${f.id}">${RESP_G.map(([k, n]) => `<button type="button" data-resp="${f.id}" data-v="${k}" aria-pressed="${v === k}">${esc(n)}</button>`).join('')}</div>`;
}
function opEtapas() {
  const x = S.ctx;
  return `<div class="opts cols" role="group" aria-labelledby="qt-etapas">${ETAPAS_ENS.map(([id, nome, sub]) => `<label class="opt"><input type="checkbox" data-etapa="${id}" ${(x.etapas[id] || {}).on ? 'checked' : ''}><span><b>${esc(nome)}</b><small>${esc(sub)}</small></span></label>`).join('')}</div>`;
}
function opGrade() {
  const x = S.ctx, at = etapasAtivas(), t = totaisCtx();
  if (!at.length) return `<p class="hint vazio-g">Marque antes as etapas de ensino na pergunta 1.1.4.</p>`;
  const linhas = at.map(([id, nome, , anos]) => {
    const e = x.etapas[id] || {};
    const porAno = anos.length && !e.soTotal;
    const lab = (txt, path, val) => `<label class="g-c"><span>${esc(txt)}</span>${nCampo({ id: 'n-' + path.replace(/\./g, '-'), attrs: `data-ctxn="${path}"`, valor: val, casas: 0, rotulo: tr(nome) + ': ' + tr(txt), ph: ' ' })}</label>`;
    const campos = [lab('Escolas', `etapas.${id}.escolas`, e.escolas)];
    if (porAno) anos.forEach((a, i) => campos.push(lab(a, `etapas.${id}.anos.${i}`, (e.anos || [])[i])));
    else campos.push(lab('Estudantes', `etapas.${id}.alunos`, e.alunos));
    const alt = anos.length ? `<button type="button" class="link" data-sototal="${id}">${esc(porAno ? 'Informar só o total da etapa' : 'Detalhar por ano ou série')}</button>` : '';
    return `<div class="g-etapa" data-g="${id}"><div class="g-cab"><b>${esc(nome)}</b>${porAno ? `<span class="g-tot"><span>Total da etapa:</span> <output class="num" data-sum="${id}">${fmtInt(alunosEtapa(id))}</output></span>` : ''}</div>
      <div class="g-campos">${campos.join('')}</div>${alt ? `<div class="g-alt">${alt}</div>` : ''}</div>`;
  }).join('');
  return `<div class="grade">${linhas}</div>
    <div class="totais"><span><span>Total:</span> <b class="num" data-tot="escolas">${fmtInt(t.escolas)}</b> <span>escolas</span></span><span><b class="num" data-tot="alunos">${fmtInt(t.alunos)}</b> <span>estudantes</span></span><span><b class="num">${t.n}</b> <span>etapas</span></span></div>`;
}
function opDominio() {
  const x = S.ctx;
  return `<div class="doms" role="radiogroup" aria-labelledby="qt-dominio">${DOMINIOS.map(d => `<label class="dom${d.ativo ? '' : ' off'}${x.dominio === d.id ? ' sel' : ''}">
      <input type="radio" name="dominio" data-ctx="dominio" value="${d.id}" ${x.dominio === d.id ? 'checked' : ''} ${d.ativo ? '' : 'disabled'}>
      <span class="dom-t"><b>${esc(d.lema)}</b><span class="dom-nome">${esc(d.nome)}</span>${d.ativo ? '' : '<span class="tag">em breve</span>'}</span>
      <span class="dom-d">${esc(d.desc)}</span>
      <span class="dom-ex"><span class="eyebrow">Exemplos</span><ul>${d.ex.map(e => `<li>${esc(e)}</li>`).join('')}</ul></span></label>`).join('')}</div>`;
}
function opComps() {
  const x = S.ctx, d = DOMINIOS.find(z => z.id === x.dominio);
  if (!d || !d.comps) return `<p class="hint vazio-g">Escolha antes o tipo de problema na pergunta 1.2.1.</p>`;
  return `<div class="opts cols" role="group" aria-labelledby="qt-comps">${d.comps.map(([k, n, s]) => `<label class="opt"><input type="checkbox" data-comp="${k}" ${(x.comps || []).includes(k) ? 'checked' : ''}><span><b>${esc(n)}</b><small>${esc(s)}</small></span></label>`).join('')}</div>
    ${(x.comps || []).includes('outro') ? `<div class="outro">${tCampo('c-compOutro', 'data-ctxt="compOutro"', x.compOutro, 'Qual componente?', 'Qual componente?')}</div>` : ''}`;
}
function opSetup() {
  const c = S.caso, p = c.piloto || {}, poc = c.teste === 'poc', t = totaisCtx();
  const lab = (txt, k) => `<label class="g-c"><span>${esc(txt)}</span>${nCampo({ id: 'pl-' + k, attrs: `data-fn="piloto.${k}"`, valor: p[k], casas: 0, rotulo: txt, ph: ' ' })}</label>`;
  const pctRede = !poc && t.escolas && +p.escolas ? Math.min(1, +p.escolas / t.escolas) : 0;
  return `<div class="g-campos setup">${poc ? '' : lab('Escolas', 'escolas')}${lab(poc ? 'Pessoas que vão testar' : 'Participantes', 'participantes')}${lab('Duração (meses)', 'meses')}</div>
    <div class="hint" id="pct-rede"${pctRede ? '' : ' hidden'}><span>Escolas do piloto em relação à rede:</span> <b class="num">${pct(pctRede)}</b></div>`;
}
function controle(f) {
  switch (f.tipo) {
    case 'radio': return opRadio(f);
    case 'chips': return opChips(f);
    case 'multi': return opMulti(f);
    case 'seg': return opSeg(f);
    case 'etapas': return opEtapas();
    case 'grade': return opGrade();
    case 'dom': return opDominio();
    case 'comps': return opComps();
    case 'setup': return opSetup();
    case 'texto': {
      let ph = f.ph;
      if (f.id === 'titulo') { const t0 = (S.caso.tarefas || [])[0]; ph = t0 ? (t0 === 'outra' ? (S.caso.tarefaOutra || '') : rotulo(listaOpc(CAMPO_POR_ID.tarefas), t0)) : ''; }
      return tCampo('f-' + f.id, attrCampo(f), valorCampo(f), ph);
    }
    case 'area': return aCampo('f-' + f.id, attrCampo(f), valorCampo(f), f.rows, f.ph);
    case 'num': return nCampo({ id: 'f-' + f.id, attrs: `data-fn="${f.id}"`, valor: valorCampo(f), casas: 0, rotulo: f.t, ph: ' ' });
  }
  return '';
}
function renderQ(f) {
  const ok = qOk(f), sug = sugerido(f) && !vazio(valorCampo(f));
  const poc = S.caso.teste === 'poc' && f.tPoc;
  const t = poc ? f.tPoc : f.t, h = poc ? f.hPoc : f.h, ex = poc ? f.exPoc : f.ex;
  const rotTag = ['texto', 'area', 'num'].includes(f.tipo) ? `label for="f-${f.id}"` : 'div';
  let extra = '';
  if (f.id === 'elegiveis') {
    const tt = totaisCtx();
    if ((S.caso.usuarios || []).includes('estudantes') && tt.alunos > 0 && +S.caso.elegiveis !== tt.alunos) extra = `<div class="hint"><button type="button" class="link" data-act="usar-alunos">${esc(tr('Usar o total de estudantes do contexto (' + fmtInt(tt.alunos) + ')'))}</button></div>`;
  }
  return `<div class="q${ok ? ' ok' : ''}${sug ? ' sug' : ''}" id="${idQ(f.n)}" data-n="${f.n}" data-campo="${f.id}">
    <${rotTag} class="q-t" id="qt-${f.id}"><span class="qn">${f.n}</span> <span class="qt">${esc(t)}</span>${f.opcional ? ' <span class="tag opc">opcional</span>' : ''}${f.sugere || f.sugDe ? `<span class="tag sug-tag">${esc(textoSugerido(f))}</span>` : ''}<span class="sr q-sr">${ok ? 'respondida' : ''}</span></${rotTag.split(' ')[0]}>
    ${h ? `<div class="hint">${esc(h)}</div>` : ''}${ex ? `<div class="hint ex">${esc(ex)}</div>` : ''}
    ${controle(f)}${sug ? notaSugerido(f) : ''}${extra}</div>`;
}
// Botão ⓘ e nota com a explicação da camada e a referência ao documento de Krueger e Jackson (2026)
const INFO_ROT = { c1: 'Sobre a camada 1', c2: 'Sobre a camada 2', c234: 'Sobre as camadas 2, 3 e 4', c37: 'Sobre as sete camadas' };
function botaoInfo(chave, id) {
  return `<button type="button" class="info" data-info="${chave}" data-info-id="${id}" aria-expanded="${!!S.info[id]}" aria-controls="nota-${id}" aria-label="${esc(INFO_ROT[chave] || 'Sobre as camadas')}">ⓘ</button>`;
}
function notaInfo(chave, id) {
  if (!S.info[id]) return '';
  return `<div class="info-nota" id="nota-${id}"><p>${esc(CAMADAS_INFO[chave])}</p>
    <p class="ref-tco"><span>${esc(REF_TCO.autores)}</span> <cite data-notr>${esc(REF_TCO.titulo)}</cite> <span>${esc(REF_TCO.local)}</span>
      <a href="${REF_TCO.url}" target="_blank" rel="noopener">${esc(REF_TCO.link)}</a></p>
    <p class="small muted">${esc(REF_TCO.nota)}</p></div>`;
}

// ----------------------------------------------------------- corpo dos passos
function corpoPadrao(id) {
  const pi = PASSO_INFO[id] || {};
  let s = pi.abertura ? `<p class="abertura muted">${esc(pi.abertura)}</p>` : '';
  if (id === '2b') s += avisoRevisar(id);
  s += camposPasso(id).map(renderQ).join('');
  if (id === '2a') s += avisoRevisar(id);
  if (id === '1b' && typeof CAP !== 'undefined' && CAP.sample) {
    s += `<div class="ai" id="ia-box"><div class="row" style="justify-content:space-between"><div><b>Estruturar a descrição com Claude</b><div class="small muted">Lê o problema e o resultado, sugere respostas para a fase 2 e aponta lacunas. Você revisa antes de aplicar.</div></div>
      <button class="btn pri" type="button" data-act="ia" ${IA.estado === 'rodando' ? 'disabled' : ''}>${IA.estado === 'rodando' ? 'Analisando…' : 'Analisar descrição'}</button></div><div id="ia-out">${typeof renderIA === 'function' ? renderIA() : ''}</div></div>`;
  }
  if (id === '2c') s += detalheArquitetura();
  return s;
}
function detalheArquitetura() {
  const c = S.caso;
  let presumida = '';
  if (typeof derivarArquitetura === 'function') { try { presumida = derivarArquitetura(Object.assign({}, c, { arquiteturaManual: '' })); } catch (e) { presumida = ''; } }
  const arqs = ((typeof OPC !== 'undefined' && OPC.arquitetura) || []).filter(o => o[0] !== 'indefinida');
  const opcs = [['', 'Usar a arquitetura presumida'], ...arqs];
  const atual = c.arquiteturaManual || '';
  // v10: nenhuma opção vem marcada; "Usar a arquitetura presumida" só aparece marcada se a pessoa a escolheu
  const marcada = v => atual === v && (v !== '' || !!S.respC.arquiteturaManual);
  return `<details class="arq" data-arq ${ARQ_ABERTA ? 'open' : ''}><summary>Para equipes técnicas: arquitetura presumida</summary>
    <div class="arq-in"><p class="hint">A ferramenta deduz a arquitetura das respostas acima para estimar o custo. Mude só se souber que é outra.</p>
      <p><span>Arquitetura presumida:</span> <b>${esc(rotulo(arqs, presumida) || '—')}</b></p>
      <div class="opts" role="radiogroup" aria-label="Arquitetura">${opcs.map(o => `<label class="opt"><input type="radio" name="arquiteturaManual" value="${esc(o[0])}" data-f="arquiteturaManual" ${marcada(o[0]) ? 'checked' : ''}><span><b>${esc(o[1])}</b></span></label>`).join('')}</div></div></details>`;
}
function seletorMoeda() {
  if (typeof MOEDAS === 'undefined' || typeof moedaInfo !== 'function') return '';
  const mi = moedaInfo();
  const nm = c => (typeof nomeMoeda === 'function' ? nomeMoeda(c) : c);
  const top = ['USD', 'EUR', 'BRL', 'GBP', 'JPY', 'CNY', 'INR', 'MXN', 'ARS', 'ZAR'];
  const resto = Object.keys(MOEDAS.taxas || {}).filter(c => !top.includes(c)).sort((a, b) => nm(a).localeCompare(nm(b), LOC()));
  const op = c => `<option value="${c}" ${mi.cod === c ? 'selected' : ''}>${c} · ${esc(nm(c))}</option>`;
  return `<div class="moeda-est"><label for="moeda-est">Moeda de exibição</label><select class="f" id="moeda-est" data-moeda="cod">${top.map(op).join('')}<option disabled>──────────</option>${resto.map(op).join('')}</select></div>`;
}
function passo3c() {
  let n;
  try { n = numerosCusto(); } catch (e) { return '<p class="muted">Não foi possível calcular com as premissas atuais.</p>'; }
  const T = n.av.r.anos;
  const pend = ['2c', '3a', '3b'].some(id => faltas(id).length);
  const cam = n.camadas;
  let prem = [];
  try { prem = premissasUnitarias(); } catch (e) { console.warn(e); }
  const nivelAd = S.caso.adaptacao ? tr(rotulo(listaOpc(CAMPO_POR_ID.adaptacao), S.caso.adaptacao)) : tr('nível do exemplo do guia');
  const linhaAdapt = `<p class="adapt"><span>${esc(tr('Adaptação (K3.1 + K3.2), Ano 0:'))}</span> <b class="num">${grande(adaptacaoAno0(n.av))}</b> <span class="muted">· <span>${esc(tr('Nível escolhido no passo 2.3.4:'))}</span> ${esc(nivelAd)}</span></p>`;
  const tabCam = cam ? (() => {
    const tot = CAMADAS.reduce((s, [k]) => s + ((cam.total || {})[k] || 0), 0);
    const thC = [tr('Camada'), tr('Ano 0') + ' (' + unidMil() + ')', tr('Total do ciclo') + ' (' + unidMil() + ')'];
    return `<h3 class="sub-h">Custo por camada</h3><div class="tw"><table class="pilha"><thead><tr><th>Camada</th><th class="n"><span>Ano 0</span> (${esc(unidMil())})</th><th class="n"><span>Total do ciclo</span> (${esc(unidMil())})</th><th class="n">%</th></tr></thead><tbody>
      ${CAMADAS.map(([k, nome]) => `<tr><td data-th="${esc(thC[0])}"><span class="cn-t">${k}</span> <span>${esc(nome)}</span></td><td class="n" data-th="${esc(thC[1])}">${mil((cam.ano0 || {})[k] || 0)}</td><td class="n" data-th="${esc(thC[2])}">${mil((cam.total || {})[k] || 0)}</td><td class="n" data-th="%">${pct(tot ? ((cam.total || {})[k] || 0) / tot : 0)}</td></tr>`).join('')}
      <tr class="tot"><td data-th="${esc(thC[0])}">Total</td><td class="n" data-th="${esc(thC[1])}">${mil(CAMADAS.reduce((s, [k]) => s + ((cam.ano0 || {})[k] || 0), 0))}</td><td class="n" data-th="${esc(thC[2])}">${mil(tot)}</td><td class="n" data-th="%">100%</td></tr></tbody></table></div>`;
  })() : '';
  // v10: "Como o custo é calculado" (R3) no topo, depois os indicadores; tabelas e premissas recolhidas
  let formula = '';
  if (typeof renderFormula === 'function') { try { formula = renderFormula(); } catch (e) { console.error(e); formula = ''; } }
  return `${seletorMoeda()}
    ${pend ? '<p class="hint">Enquanto faltarem respostas nos passos 2.3, 3.1 e 3.2, a estimativa usa premissas padrão.</p>' : ''}
    ${formula ? `<div class="formula-box">${formula}</div>` : ''}
    <div class="kpis kpis5">
      <div class="kpi"><span class="v">${grande(n.ano0)}</span><span class="l">Custo do Ano 0 (prova de conceito ou piloto)</span></div>
      <div class="kpi"><span class="v">${grande(n.total)}</span><span class="l">Custo total do ciclo de vida</span></div>
      <div class="kpi"><span class="v">${grande(n.anual)}</span><span class="l">Dotação média por ano de operação</span></div>
      <div class="kpi"><span class="v">${din(n.porAluno, 2)}</span><span class="l">Por usuário ativo por ano</span></div>
      <div class="kpi"><span class="v">${(n.ind.anosParaSair || 0).toLocaleString(LOC(), { maximumFractionDigits: (n.ind.anosParaSair || 0) < 1 ? 2 : 1 })}</span><span class="l">Custo de sair, em anos de custo recorrente</span></div></div>
    ${linhaAdapt}
    <p class="note"><span>Valores ilustrativos. Substitua por cotações e dados locais.</span> <span>Custo total em preços constantes, com tempo das equipes; dotação em preços correntes, só desembolso.</span></p>
    <details class="calc numeros" data-numdet ${NUM_ABERTO ? 'open' : ''}><summary>Ver os números detalhados</summary>
      <div class="embutido det-num">
    ${tabCam}
    <h3 class="sub-h">Dotação a solicitar por exercício</h3>
    <div class="tw"><table class="pilha"><thead><tr><th>Exercício</th>${T.map(x => `<th class="n">${esc(tr('Ano ' + x))}</th>`).join('')}</tr></thead><tbody>
      <tr><td data-th="${esc(tr('Exercício'))}"><span>Dotação a solicitar</span> (${esc(unidMil())})</td>${T.map(x => `<td class="n" data-th="${esc(tr('Ano ' + x))}">${mil(n.orc.dot[x])}</td>`).join('')}</tr></tbody></table></div>
    <h3 class="sub-h">Premissas desta estimativa</h3>
    <ul class="req prem-u">${prem.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    <p class="note">Premissas ilustrativas. Ajuste preços, quantidades e itens na calculadora completa, logo abaixo.</p>
      </div></details>
    <details class="calc" data-calc ${S.calcAberta ? 'open' : ''}><summary>Ajustar premissas, itens e cenários na calculadora completa</summary>
      <div id="custos-box" class="embutido">${S.calcAberta && typeof renderCustos === 'function' ? renderCustos() : ''}</div></details>`;
}
// Passo 3.4: recomendações de ação para o caso (R2, recomendacoes.js)
function passo3d() {
  if (typeof renderRecomendacoes === 'function') {
    try { return renderRecomendacoes(); } catch (e) { console.error(e); return '<p class="muted">Não foi possível montar as recomendações com as respostas atuais.</p>'; }
  }
  return '<p class="muted">As recomendações para o seu caso ainda não estão disponíveis nesta versão da ferramenta.</p>';
}
function corpoPasso(id) { return id === '3c' ? passo3c() : id === '3d' ? passo3d() : corpoPadrao(id); }

// ----------------------------------------------------------- passos, rodapés e fases
function resumoPasso(id) {
  const x = S.ctx, c = S.caso;
  if (id === '1a' && passoFeito(id)) { const t = totaisCtx(); return [tr(rotulo(NIVEIS_ADM, x.nivel)), x.local, fmtInt(t.alunos) + ' ' + tr('estudantes')].filter(Boolean).join(' · '); }
  if (id === '1b' && x.olhando) return x.olhando;
  if (id === '2a' && (c.tarefas || []).length) return rotTarefas(3);
  if (id === '20' && c.teste) return tr(rotulo(listaOpc(CAMPO_POR_ID.teste), c.teste));
  if (id === '2c' && qOk(CAMPO_POR_ID.tipoTec)) return tr(rotulo(listaOpc(CAMPO_POR_ID.tipoTec), c.tipoTec));
  if (id === '3c') return S.feitos['3c'] ? tr('Estimativa vista') : '';
  if (id === '3d') return S.feitos['3d'] ? tr('Recomendações vistas') : '';
  const cs = camposPasso(id).filter(f => !f.opcional);
  return tr(cs.filter(qOk).length + ' de ' + cs.length + ' respondidas');
}
function rotTarefas(lim) {
  const c = S.caso, ts = (c.tarefas || []).map(k => k === 'outra' ? (c.tarefaOutra || tr('Outra')) : tr(rotulo(listaOpc(CAMPO_POR_ID.tarefas), k)));
  return ts.slice(0, lim).join('; ') + (ts.length > lim ? ' +' + (ts.length - lim) : '');
}
function proximo(fid, id) {
  const ps = PASSOS[fid], i = ps.findIndex(p => p[0] === id);
  if (i < ps.length - 1) return { tipo: 'passo', id: ps[i + 1][0] };
  const nf = FASES[FASES.findIndex(f => f.id === fid) + 1];
  return nf ? { tipo: 'fase', fase: nf } : { tipo: 'plano' };
}
function botaoSeguir(fid, id, act) {
  const p = proximo(fid, id);
  if (p.tipo === 'plano') return `<button type="button" class="btn pri" data-act="gerar-plano">${esc(tr('Gerar plano de contratação'))}</button>`;
  const txt = p.tipo === 'passo' ? tr('Continuar para ' + numPasso(p.id)) : tr('Continuar para a fase ' + p.fase.n + ': ' + p.fase.nome);
  return `<button type="button" class="btn pri" data-act="${act || 'continuar'}"${act === 'ir-fase' ? ` data-f2="${p.fase.id}"` : ''} data-de="${id}">${esc(txt)}</button>`;
}
function rodapePasso(fid, id) {
  if (PASSOS_VER.includes(id)) return `<div class="pe" id="pe-${id}"><div class="passo-pe">${botaoSeguir(fid, id)}</div></div>`;
  const fs = faltas(id);
  // pendentes de verdade: sem resposta mesmo considerando as sugestões como confirmadas
  const pend = fs.filter(f => !qOk(f, true));
  if (!fs.length) return `<div class="pe" id="pe-${id}"><div class="passo-pe"><span class="ok-msg">${esc(tr('Passo completo.'))}</span>${botaoSeguir(fid, id)}</div></div>`;
  if (!pend.length) {
    const p = proximo(fid, id);
    return `<div class="pe" id="pe-${id}"><div class="passo-pe"><span class="muted">${esc(tr(id === '2b' ? 'Revise as respostas sugeridas pelas tarefas.' : 'Revise as respostas sugeridas.'))}</span>
      <button type="button" class="btn pri" data-act="continuar-confirmar" data-de="${id}">${esc(p.tipo === 'passo' ? tr('Confirmar e continuar para ' + numPasso(p.id)) : tr('Confirmar e continuar'))}</button></div></div>`;
  }
  return `<div class="pe" id="pe-${id}"><div class="aviso"><b>${esc(tr('Ainda falta responder neste passo:'))}</b>
    <ul>${fs.map(f => `<li><button type="button" class="link" data-ir="${fid}:${id}:${f.n.replace(/\./g, '-')}"><span class="qn-l">${f.n}</span> <span>${esc(textoCampo(f))}</span></button></li>`).join('')}</ul>
    <div class="row"><button type="button" class="btn" data-act="continuar-forcar" data-de="${id}">${esc(tr('Continuar mesmo assim'))}</button><span class="small muted">${esc(tr('Você pode voltar depois.'))}</span></div></div></div>`;
}
function rodapeFase(f) {
  const n = PASSOS[f.id].reduce((s, [id]) => s + (PASSOS_VER.includes(id) ? 0 : faltas(id).length), 0);
  const naoVistos = PASSOS[f.id].filter(([id]) => PASSOS_VER.includes(id) && !S.feitos[id]).map(([id]) => id);
  const ult = PASSOS[f.id][PASSOS[f.id].length - 1][0];
  const completa = progressoFase(f.id).completa;
  const msg = completa ? `<span class="ok-msg">${esc(tr('Fase ' + f.n + ' completa'))}</span>`
    : `<span class="muted">${esc(n ? (n === 1 ? tr('Falta 1 resposta nesta fase. Você pode continuar e voltar depois.') : tr('Faltam ' + n + ' respostas nesta fase. Você pode continuar e voltar depois.')) : tr(naoVistos.includes('3c') ? 'Abra a estimativa de custo para concluir esta fase.' : 'Abra as recomendações para o seu caso (3.4) para concluir esta fase.'))}</span>`;
  return `<div class="fase-pe" id="fpe-${f.id}">${msg}${botaoSeguir(f.id, ult, f.id === 'custo' ? '' : 'ir-fase')}</div>`;
}
function marcaPasso(id, st) {
  return st === 'ok' ? `<span aria-hidden="true">✓</span><span class="sr">${numPasso(id)}</span>` : numPasso(id);
}
function renderPasso(f, id, nome) {
  const fixo = id === '20';
  const ab = fixo || S.passo === id, st = estadoPasso(id), pi = PASSO_INFO[id] || {};
  const selo = pi.selo ? ` <span class="selo">${esc(pi.selo)}</span>` : '';
  const info = pi.info ? botaoInfo(pi.info, 'p-' + id) : '';
  const titulo = `<span class="pn">${marcaPasso(id, st)}</span><span class="pt"><b><span>${esc(nome)}</span>${selo}</b>${!ab ? `<small>${esc(resumoPasso(id))}</small>` : ''}</span>`;
  const cab = fixo ? `<div class="passo-cab fixo">${titulo}</div>` : `<button type="button" class="passo-cab" data-passo="${id}" aria-expanded="${ab}">${titulo}<span class="chev" aria-hidden="true"></span></button>`;
  return `<div class="passo st-${st || 'novo'}${ab ? ' aberto' : ''}${fixo ? ' fixo' : ''}" id="passo-${id}">
    <div class="passo-topo">${cab}${info}</div>${pi.info ? notaInfo(pi.info, 'p-' + id) : ''}
    ${ab ? `<div class="passo-corpo">${corpoPasso(id)}${rodapePasso(f.id, id)}</div>` : ''}</div>`;
}
function marcaFase(f, pr) { return pr.completa ? `<span aria-hidden="true">✓</span><span class="sr">${f.n}</span>` : f.n; }
function renderFase(f) {
  const aberta = S.fase === f.id, pr = progressoFase(f.id);
  const cab = `<button type="button" class="fase-cab" data-fase="${f.id}" aria-expanded="${aberta}">
      <span class="fase-n">${marcaFase(f, pr)}</span><span class="fase-t"><b>${esc(f.nome)}</b><small>${esc(f.sub)}</small></span>
      <span class="fase-st">${esc(tr(pr.feitos + ' de ' + pr.total + ' passos'))}</span><span class="chev" aria-hidden="true"></span></button>`;
  if (!aberta) return `<section class="fase f${f.n}${pr.completa ? ' feita' : ''}" id="fase-${f.id}">${cab}</section>`;
  const ab = `<p class="abertura"><span>${esc(f.abertura)}</span>${f.info ? ' ' + botaoInfo(f.info, 'f-' + f.id) : ''}</p>${f.info ? notaInfo(f.info, 'f-' + f.id) : ''}`;
  return `<section class="fase f${f.n} aberta${pr.completa ? ' feita' : ''}" id="fase-${f.id}">${cab}
    <div class="fase-corpo">${ab}
      ${PASSOS[f.id].map(([id, nome]) => renderPasso(f, id, nome)).join('')}
      ${rodapeFase(f)}
    </div></section>`;
}
function renderStepper() {
  const el = $('#stepper'); if (!el) return;
  el.innerHTML = FASES.map(f => {
    const pr = progressoFase(f.id), at = S.fase === f.id && S.vista !== 'plano';
    return `<button type="button" class="step-f f${f.n}${at ? ' at' : ''}${pr.completa ? ' feita' : ''}" data-fase="${f.id}" aria-current="${at}">
      <span class="sf-n">${marcaFase(f, pr)}</span><span class="sf-t">${esc(f.nome)}</span><span class="sf-bar"><i style="width:${Math.round(100 * pr.pct)}%"></i></span></button>`;
  }).join('') + `<button type="button" class="step-r${S.vista === 'plano' ? ' at' : ''}" data-act="gerar-plano" aria-current="${S.vista === 'plano'}"><span class="sf-t">${esc(tr('Gerar plano de contratação'))}</span></button>`;
}
function boasVindas() {
  const sv = typeof SALVO !== 'undefined' ? SALVO : null;
  const nome = sv ? (sv.nome || (sv.exemplo ? tr(sv.exemplo) : '')) : '';
  const escolha = sv ? `<div class="salvo" role="group" aria-labelledby="salvo-t">
      <h3 id="salvo-t">Há um caso salvo neste navegador</h3>
      <p class="salvo-caso">${nome ? `<b data-notr>${esc(nome)}</b>` : '<b>Caso sem nome</b>'}${sv.lugar ? ` <span class="muted">·</span> <span data-notr>${esc(sv.lugar)}</span>` : ''}${sv.exemplo && !sv.nome ? ' <span class="tag">exemplo</span>' : ''}</p>
      ${sv.migrou ? '<p class="small muted">Convertido da versão anterior da ferramenta. Revise as respostas de adoção.</p>' : ''}
      <div class="row"><button type="button" class="btn pri grande" data-act="continuar-salvo">Continuar o caso salvo</button><button type="button" class="btn grande" data-act="comecar">Começar em branco</button></div>
      <p class="small muted">Começar em branco ou abrir um exemplo apaga o caso salvo. Para guardá-lo, continue o caso e use "Exportar caso" no painel.</p>
    </div>` : '';
  return `<section class="boas card" id="boas">${escolha}
    <div class="eyebrow">Como funciona</div>
    <h2>Do contexto ao plano de contratação, em três fases</h2>
    <p>Você descreve a sua rede, o problema e o que quer que a IA faça, escolhe entre prova de conceito e piloto e define como vai adotar e pagar a tecnologia. No fim, um clique gera o plano de contratação, com custo, compra e recomendações de política. Os valores são ilustrativos.</p>
    <ol class="boas-fases">${FASES.map(f => `<li class="f${f.n}"><span class="fase-n">${f.n}</span><span><b>${esc(f.nome)}</b><small>${esc(f.sub)}</small></span></li>`).join('')}</ol>
    ${sv ? '' : '<div class="row"><button type="button" class="btn pri grande" data-act="comecar">Começar um caso em branco</button><button type="button" class="btn grande" data-act="ver-exemplo">Ver um exemplo preenchido</button></div>'}
    ${sv ? '<div class="row"><button type="button" class="link" data-act="ver-exemplo">Ver um exemplo preenchido</button></div>' : ''}
    <p class="small muted">As respostas ficam salvas só neste navegador. Você pode exportar o caso a qualquer momento.</p>
  </section>`;
}
function chamadaFinal() {
  return `<section class="cta-resumo card" id="fase-final"><div><div class="eyebrow">Ao terminar</div><h2>Plano de contratação</h2>
    <p class="muted">Custo e compra primeiro, depois política e governança, com o diagnóstico e as recomendações do caso. Você pode gerar o plano a qualquer momento: ele lista o que ainda falta responder. Exporte em PDF.</p></div>
    <button type="button" class="btn pri grande" data-act="gerar-plano">Gerar plano de contratação</button></section>`;
}

// ----------------------------------------------------------- mandala
function mandala() {
  const cx = 150, cy = 150;
  const pt = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const f1 = v => v.toFixed(1);
  const setor = (r0, r1, a0, a1) => {
    const g = r0 ? 0.012 : 0.02;
    const [x0, y0] = pt(r1, a0 + g), [x1, y1] = pt(r1, a1 - g);
    const larga = a1 - a0 > Math.PI ? 1 : 0;
    if (!r0) return `M${cx},${cy} L${f1(x0)},${f1(y0)} A${r1},${r1} 0 ${larga} 1 ${f1(x1)},${f1(y1)}Z`;
    const [x2, y2] = pt(r0, a1 - g), [x3, y3] = pt(r0, a0 + g);
    return `M${f1(x0)},${f1(y0)} A${r1},${r1} 0 ${larga} 1 ${f1(x1)},${f1(y1)} L${f1(x2)},${f1(y2)} A${r0},${r0} 0 ${larga} 0 ${f1(x3)},${f1(y3)}Z`;
  };
  const ang = (i, n) => -Math.PI / 2 + i * 2 * Math.PI / n;
  const ANEIS = { contexto: [0, 48], piloto: [52, 86], custo: [90, 118] };
  const EST = { ok: ['m-ok', 'concluído'], andamento: ['m-and', 'em andamento'], '': ['m-vazio', 'ainda não iniciado'] };
  let s = `<svg class="mandala" viewBox="-6 -6 312 312" role="img" aria-label="${esc(tr('Mandala: fases, passos e camadas'))}">`;
  FASES.forEach(f => {
    const [r0, r1] = ANEIS[f.id], ps = PASSOS[f.id];
    ps.forEach(([id, nome], i) => {
      const a0 = ang(i, ps.length), a1 = ang(i + 1, ps.length), st = estadoPasso(id), [cls, rot] = EST[st];
      const at = S.vista !== 'plano' && S.fase === f.id && (S.passo === id);
      const [tx, ty] = pt(r0 ? (r0 + r1) / 2 : 30, (a0 + a1) / 2);
      s += `<a href="#" data-ir="${f.id}:${id}" data-setor="${id}" class="m-set f${f.n} ${cls}${at ? ' m-at' : ''}"><title>${esc(numPasso(id) + ' ' + tr(nome) + ' · ' + tr(rot))}</title><path d="${setor(r0, r1, a0, a1)}"/><text x="${f1(tx)}" y="${f1(ty + 4)}" text-anchor="middle">${numPasso(id)}</text></a>`;
    });
  });
  CAMADAS.forEach(([n, nome], i) => {
    const a0 = ang(i, 7), a1 = ang(i + 1, 7);
    const ok = CAMADA_PASSOS[n].every(passoFeito);
    const alvo = CAMADA_PASSOS[n][0];
    s += `<a href="#" data-ir="${fasePasso(alvo)}:${alvo}" data-camada="${n}" class="m-cam ${ok ? 'm-ok' : 'm-vazio'}"><title>${esc(tr('Camada') + ' ' + n + ' · ' + tr(nome) + ' · ' + tr(ok ? 'concluída' : 'ainda não concluída'))}</title><path d="${setor(124, 138, a0, a1)}"/></a>`;
    const [x, y] = pt(147, (a0 + a1) / 2);
    s += `<text x="${f1(x)}" y="${f1(y + 4)}" text-anchor="middle" class="m-l">${n}</text>`;
  });
  return s + '</svg>';
}

// ----------------------------------------------------------- painel lateral
function renderPainel() {
  const el = $('#painel'); if (!el) return;
  // escolha pendente entre o caso salvo e um caso em branco: o painel não mostra o caso salvo
  if (typeof SALVO !== 'undefined' && SALVO && S.boasVindas !== false) {
    el.innerHTML = `<div class="card painel-in"><div class="prog"><div class="eyebrow">Seu progresso</div>
      <p class="small muted">Escolha se quer continuar o caso salvo ou começar em branco.</p></div></div>`;
    return;
  }
  const t = totaisCtx(), c = S.caso;
  const prog = FASES.map(f => { const pr = progressoFase(f.id); return `<li><button type="button" class="prog-f f${f.n}${pr.completa ? ' feita' : ''}" data-fase="${f.id}"><span class="fase-n">${marcaFase(f, pr)}</span><span class="vl-t">${esc(f.nome)}</span><span class="vl-n">${esc(tr(pr.feitos + ' de ' + pr.total + ' passos'))}</span></button></li>`; }).join('');
  const teste = c.teste ? (c.teste === 'recomendar' ? tr('a recomendar') : tr(rotulo(listaOpc(CAMPO_POR_ID.teste), c.teste))) : '—';
  const tec = c.tipoTec ? tr(rotulo(listaOpc(CAMPO_POR_ID.tipoTec), c.tipoTec)) : '—';
  let est = '';
  const fe = faltasEstimativa();
  if (!fe.length) {
    try {
      const n = numerosCusto(), ce = casoAtual();
      const pessoas = Math.max(0, ...(n.av.r.E || []).slice(1)) || +ce.elegiveis || 0;
      est = `<div class="estim"><div class="eyebrow">Estimativa ilustrativa</div>
        <p class="small premissa">${esc(tr('Considera ' + fmtInt(pessoas) + ' pessoas usando a ferramenta na rede (passo 3.1.1).'))}</p>
        <div class="linha"><span>Ano 0 (prova de conceito ou piloto)</span><span class="num">${grande(n.ano0)}</span></div>
        <div class="linha"><span><span>Custo total do ciclo</span> <small>(${esc(tr(n.H + ' anos'))})</small></span><span class="num">${grande(n.total)}</span></div>
        <p class="small muted">Valores ilustrativos. As premissas estão no passo 3.3.</p></div>`;
    } catch (e) { est = ''; }
  } else {
    est = `<div class="estim"><div class="eyebrow">Estimativa ilustrativa</div>
      <p class="small muted">${esc(tr('A estimativa de custo aparece depois destas respostas:'))}</p>
      <ul class="req small">${fe.map(f => `<li><button type="button" class="link" data-ir="${fasePasso(f.passo)}:${f.passo}:${f.n.replace(/\./g, '-')}"><span class="qn-l">${f.n}</span> <span>${esc(textoCampo(f))}</span></button></li>`).join('')}</ul></div>`;
  }
  const exp = `<button type="button" class="link" data-act="exp-json">${CAP.downloads ? 'Exportar caso' : 'Copiar dados do caso'}</button>`;
  el.innerHTML = `<div class="card painel-in">
    <div class="prog"><div class="eyebrow">Seu progresso</div><ul class="vlist">${prog}</ul></div>
    <div class="mand">${mandala()}
      <p class="small muted leg-m"><span>Verde: concluído. Cor clara: em andamento. Contorno: ainda não iniciado. Centro: fase 1; anéis: fases 2 e 3; anel externo: as sete camadas do custo total.</span> ${botaoInfo('c37', 'm')}</p>${notaInfo('c37', 'm')}
      <ol class="leg">${CAMADAS.map(([n, nome]) => `<li><span class="cn">${n}</span>${esc(nome)}</li>`).join('')}</ol></div>
    <div class="fatos"><div class="eyebrow">Seu caso</div>
      <div class="linha"><span>Lugar</span><span>${esc(S.ctx.local || '—')}</span></div>
      <div class="linha"><span>Estudantes</span><span class="num">${t.alunos ? fmtInt(t.alunos) : '—'}</span></div>
      <div class="linha"><span>Aplicações</span><span>${esc((c.tarefas || []).length ? rotTarefas(3) : '—')}</span></div>
      <div class="linha"><span>Teste</span><span>${esc(teste)}</span></div>
      <div class="linha"><span>Tecnologia</span><span>${esc(tec)}</span></div>
    </div>
    ${est}
    <div class="painel-acoes"><button class="btn pri grande" type="button" data-act="gerar-plano">Gerar plano de contratação</button>
      <span class="small muted">Salvo neste navegador</span>
      <span class="row small">${exp}<button type="button" class="link" data-act="imp-json">Importar caso</button>${temRespostas(S) && !CONF_LIMPAR ? '<button type="button" class="link" id="btn-limpar" data-act="limpar-pedir">Começar em branco</button>' : ''}</span>
      ${CONF_LIMPAR ? confLimpar() : ''}</div>
  </div>`;
}

// Confirmação inline de "Começar em branco" (sem caixas de diálogo do navegador)
function confLimpar() {
  return `<div class="conf-limpar" id="conf-limpar" role="group" aria-labelledby="conf-limpar-t">
    <p id="conf-limpar-t"><b>Começar em branco?</b> <span>As respostas atuais serão apagadas deste navegador. Para guardá-las, exporte o caso antes.</span></p>
    <div class="row"><button type="button" class="btn pri" data-act="limpar-ok">Apagar e começar em branco</button><button type="button" class="btn" data-act="limpar-nao">Cancelar</button></div></div>`;
}

// ----------------------------------------------------------- render
function render() {
  estadoFluxo();
  if (S.vista !== 'plano' && S.fase === 'custo' && PASSOS_VER.includes(S.passo)) S.feitos[S.passo] = true;
  aplicarPadroes();
  const y = window.scrollY, foco = document.activeElement && document.activeElement.id;
  const ex = ['A', 'B', 'C', 'D', 'editado'].includes(S.exemplo) && S.boasVindas === false;
  const tituloEx = ['A', 'B', 'C', 'D'].includes(S.exemplo) && typeof CASOS !== 'undefined' && CASOS[S.exemplo] ? CASOS[S.exemplo].titulo : '';
  let corpo;
  if (S.vista === 'plano') corpo = typeof renderPlano === 'function' ? renderPlano() : `<section class="card" id="plano"><p class="muted">O plano de contratação ainda não está disponível.</p><button type="button" class="btn" data-act="voltar-percurso">Voltar ao percurso</button></section>`;
  else corpo = FASES.map(renderFase).join('') + chamadaFinal();
  $('#main').innerHTML = `${S.boasVindas !== false ? '' : '<nav class="stepper" id="stepper" aria-label="Fases"></nav>'}
    ${S.boasVindas !== false ? boasVindas() : ''}
    ${ex ? `<div class="alert info"><span class="ic">Exemplo</span><span>${tituloEx ? esc(tr('Você está vendo um caso ilustrativo do guia, com respostas fictícias:')) + ' <b>' + esc(tr(tituloEx)) + '</b>. ' : ''}<span>Edite as respostas ou comece um caso em branco.</span></span><button class="btn" type="button" data-act="limpar">Começar um caso em branco</button></div>` : ''}
    ${S.boasVindas !== false && S.vista !== 'plano' ? '' : corpo}`;
  renderStepper(); renderPainel();
  if (document.getElementById('cres') && typeof renderCustosResultados === 'function') renderCustosResultados();
  if (foco) { const f = document.getElementById(foco); if (f) try { f.focus({ preventScroll: true }); } catch (e) { } }
  window.scrollTo(0, y);
  salvar();
}
function atualizarLaterais() { aplicarPadroes(); renderStepper(); renderPainel(); atualizarFaseViva(); salvar(); }
// Atualiza marcas de respondida, passos, rodapés e cabeçalho da fase aberta sem redesenhar a página
function atualizarFaseViva() {
  document.querySelectorAll('.q[data-campo]').forEach(q => {
    const f = CAMPO_POR_ID[q.dataset.campo]; if (!f) return;
    const ok = qOk(f), sug = sugerido(f) && !vazio(valorCampo(f));
    q.classList.toggle('ok', ok); q.classList.toggle('sug', sug);
    const sr = q.querySelector('.q-sr'); if (sr && sr.dataset.v !== String(ok)) { sr.dataset.v = String(ok); sr.textContent = ok ? tr('respondida') : ''; }
  });
  const fid = S.fase; if (!fid || S.vista === 'plano') return;
  const sec = document.getElementById('fase-' + fid); if (!sec) return;
  const f = FASES.find(z => z.id === fid), pr = progressoFase(fid);
  sec.classList.toggle('feita', pr.completa);
  const fn = sec.querySelector('.fase-cab .fase-n'); if (fn) { const h = String(marcaFase(f, pr)); if (fn.innerHTML !== h) fn.innerHTML = h; }
  const fst = sec.querySelector('.fase-cab .fase-st'); if (fst) fst.textContent = tr(pr.feitos + ' de ' + pr.total + ' passos');
  PASSOS[fid].forEach(([id]) => {
    const p = document.getElementById('passo-' + id); if (!p) return;
    const st = estadoPasso(id);
    ['st-ok', 'st-andamento', 'st-novo'].forEach(c => p.classList.remove(c)); p.classList.add('st-' + (st || 'novo'));
    const pn = p.querySelector('.pn'); if (pn) { const h = String(marcaPasso(id, st)); if (pn.innerHTML !== h) pn.innerHTML = h; }
    const sm = p.querySelector('.pt small'); if (sm) sm.textContent = resumoPasso(id);
  });
  ['20', S.passo].filter(Boolean).forEach(id => {
    const pe = document.getElementById('pe-' + id);
    if (pe && PASSOS[fid].some(p => p[0] === id)) { const novo = rodapePasso(fid, id); if (pe.outerHTML !== novo) pe.outerHTML = novo; }
  });
  const fpe = document.getElementById('fpe-' + fid); if (fpe) { const novo = rodapeFase(f); if (fpe.outerHTML !== novo) fpe.outerHTML = novo; }
}
function alvoQ(alvo) {
  if (!alvo) return '';
  if (document.getElementById('q-' + alvo)) return 'q-' + alvo;
  const f = CAMPO_POR_ID[alvo] || CAMPOS.find(x => x.n === alvo);
  return f ? idQ(f.n) : 'q-' + alvo;
}
function irPara(id) {
  const el = document.getElementById(id); if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - (document.querySelector('.top') || { offsetHeight: 0 }).offsetHeight - 12;
  window.scrollTo({ top, behavior: 'smooth' });
  if (el.classList.contains('q')) { el.classList.add('pisca'); setTimeout(() => el.classList.remove('pisca'), 1600); }
}
function abrirFase(fid, passo, alvo) {
  if (!PASSOS[fid]) return;
  if (alvo && !passo) { const f = CAMPO_POR_ID[alvo]; if (f) passo = f.passo; }
  S.fase = fid; S.passo = passo || PASSOS[fid][0][0]; S.boasVindas = false; S.vista = ''; render();
  requestAnimationFrame(() => irPara(alvo ? alvoQ(alvo) : 'passo-' + S.passo));
}
function gerarPlano() {
  S.boasVindas = false;
  if (typeof abrirPlano === 'function') { abrirPlano(); return; }
  S.vista = 'plano'; render(); window.scrollTo({ top: 0, behavior: 'instant' });
}
function continuar(modo, de) {
  const id = de || S.passo, fid = fasePasso(id); if (!fid) return;
  if (modo === 'normal' && faltas(id).length) { render(); return; }
  if (modo === 'confirmar') {
    camposPasso(id).forEach(f => { if (sugerido(f) && !vazio(valorCampo(f))) confirmarSugestao(f); });
    S.revisar = (S.revisar || []).filter(k => !S.respC[k]);
  }
  S.feitos[id] = true;
  const p = proximo(fid, id);
  if (p.tipo === 'plano') { gerarPlano(); return; }
  if (p.tipo === 'fase') { abrirFase(p.fase.id); return; }
  S.fase = fid; S.passo = p.id; render(); requestAnimationFrame(() => irPara('passo-' + p.id));
}
// Gancho chamado por app.js depois de gravar S.caso[campo] (ou um caminho como 'piloto.escolas').
// Devolve true porque já atualizou a tela.
function aoMudarCampo(campo) {
  const f = CAMPO_POR_ID[campo];
  if (campo === 'tarefas') aplicarSugestoes();
  if (String(campo).startsWith('piloto') || campo === 'elegiveis') {
    const c = S.caso, p = c.piloto || {}, t = totaisCtx(), el = document.getElementById('pct-rede');
    const v = c.teste !== 'poc' && t.escolas && +p.escolas ? Math.min(1, +p.escolas / t.escolas) : 0;
    if (el) { el.hidden = !v; const b = el.querySelector('b'); if (b) b.textContent = pct(v); }
    atualizarLaterais(); return true;
  }
  if ((f && ['texto', 'area'].includes(f.tipo)) || ['tarefaOutra', 'impactoOutro', 'nivelOutro', 'titulo', 'problema', 'resultado'].includes(campo)) { atualizarLaterais(); return true; }
  render(); return true;
}
function eventoFluxo(e) {
  const el = e.target;
  if (e.type === 'click') {
    const inf = el.closest('[data-info]');
    if (inf) { const id = inf.dataset.infoId || inf.dataset.info; S.info[id] = !S.info[id]; render(); return true; }
    const iz = el.closest('[data-ir]');
    if (iz) { e.preventDefault(); const [f, p, q] = iz.dataset.ir.split(':'); abrirFase(f, p, q); return true; }
    const fz = el.closest('[data-fase]');
    if (fz) { const id = fz.dataset.fase; if (S.fase === id && S.vista !== 'plano' && fz.classList.contains('fase-cab')) { S.fase = ''; render(); } else abrirFase(id, S.fase === id ? S.passo : ''); return true; }
    const pz = el.closest('[data-passo]');
    if (pz) { const id = pz.dataset.passo; S.passo = S.passo === id ? '' : id; render(); if (S.passo) requestAnimationFrame(() => irPara('passo-' + id)); return true; }
    const rz = el.closest('[data-resp]');
    if (rz) {
      const id = rz.dataset.resp, v = rz.dataset.v;
      if (S.resp[id] === v) delete S.resp[id]; else S.resp[id] = v;
      if (S.exemplo !== 'novo') S.exemplo = 'editado';
      const grp = rz.closest('.seg');
      if (grp) grp.querySelectorAll('[data-resp]').forEach(b => b.setAttribute('aria-pressed', String(S.resp[id] === b.dataset.v)));
      atualizarLaterais(); return true;
    }
    const tz = el.closest('[data-sototal]');
    if (tz) { const id = tz.dataset.sototal; const et = S.ctx.etapas[id] = S.ctx.etapas[id] || {}; et.soTotal = !et.soTotal; if (et.soTotal && !(+et.alunos > 0)) { const s = (et.anos || []).reduce((a, b) => a + (+b || 0), 0); if (s > 0) et.alunos = s; } render(); return true; }
    // clique na opção já marcada por sugestão: confirma a sugestão (o navegador não dispara "change")
    if (el.matches && el.matches('input[type=radio][data-f]')) {
      const f = CAMPO_POR_ID[el.dataset.f];
      if (f && sugerido(f) && String(S.caso[f.id]) === el.value) { confirmarSugestao(f); S.revisar = (S.revisar || []).filter(k => k !== f.id); atualizarLaterais(); return true; }
      return false;
    }
    const a = el.closest('[data-act]'); if (!a) return false;
    const act = a.dataset.act;
    if (act === 'continuar-salvo') { continuarSalvo(); return true; }
    if (act === 'limpar-pedir') { CONF_LIMPAR = true; renderPainel(); requestAnimationFrame(() => { const b = document.querySelector('#conf-limpar [data-act="limpar-nao"]'); if (b) b.focus(); }); return true; }
    if (act === 'limpar-nao') { CONF_LIMPAR = false; renderPainel(); requestAnimationFrame(() => { const b = document.getElementById('btn-limpar'); if (b) b.focus(); }); return true; }
    if (act === 'limpar-ok') { CONF_LIMPAR = false; carregarExemplo('novo'); S.boasVindas = false; abrirFase('contexto', '1a'); return true; }
    if (act === 'continuar') { continuar('normal', a.dataset.de); return true; }
    if (act === 'continuar-forcar') { continuar('forcar', a.dataset.de); return true; }
    if (act === 'continuar-confirmar') { continuar('confirmar', a.dataset.de); return true; }
    if (act === 'ir-fase') { const ult = PASSOS[S.fase] ? PASSOS[S.fase][PASSOS[S.fase].length - 1][0] : ''; if (ult && a.dataset.de === ult && passoFeito(ult)) S.feitos[ult] = true; abrirFase(a.dataset.f2); return true; }
    if (act === 'comecar') { S.boasVindas = false; carregarExemplo('novo'); S.boasVindas = false; abrirFase('contexto', '1a'); return true; }
    if (act === 'ver-exemplo') { carregarExemplo('B'); S.boasVindas = false; abrirFase('contexto', '1a'); return true; }
    if (act === 'gerar-plano' || act === 'ir-resumo' || act === 'ir-final') { gerarPlano(); return true; }
    if (act === 'voltar-percurso' || act === 'voltar-fases') { S.vista = ''; render(); window.scrollTo({ top: 0, behavior: 'instant' }); return true; }
    if (act === 'pdf') { if (typeof baixarPDF === 'function') baixarPDF(); return true; }
    if (act === 'usar-alunos') { S.caso.elegiveis = totaisCtx().alunos; S.respC.elegiveis = true; if (S.custo) S.custo.editado = false; if (S.exemplo !== 'novo') S.exemplo = 'editado'; render(); toast(tr('Total de estudantes aplicado.')); return true; }
    return false;
  }
  if (e.type === 'change') {
    if (el.dataset.ctx) {
      S.ctx[el.dataset.ctx] = el.value; if (S.exemplo !== 'novo') S.exemplo = 'editado';
      if (el.dataset.ctx === 'dominio') S.ctx.comps = [];
      render(); return true;
    }
    if (el.dataset.etapa) {
      const id = el.dataset.etapa; S.ctx.etapas[id] = Object.assign(S.ctx.etapas[id] || {}, { on: el.checked });
      if (S.exemplo !== 'novo') S.exemplo = 'editado';
      if ((S.caso.tarefas || []).length) aplicarSugestoes();
      render(); return true;
    }
    if (el.dataset.comp) { const s = new Set(S.ctx.comps || []); el.checked ? s.add(el.dataset.comp) : s.delete(el.dataset.comp); S.ctx.comps = [...s]; if (S.exemplo !== 'novo') S.exemplo = 'editado'; render(); return true; }
    if (el.dataset.ctxn) { gravarCtxn(el); return true; }
    if (el.dataset.ctxt) { S.ctx[el.dataset.ctxt] = el.value; atualizarLaterais(); return true; }
  }
  if (e.type === 'input') {
    if (el.dataset.ctxt) { S.ctx[el.dataset.ctxt] = el.value; if (S.exemplo !== 'novo') S.exemplo = 'editado'; atualizarLaterais(); return true; }
    if (el.dataset.ctxn) { gravarCtxn(el); return true; }
  }
  if (e.type === 'toggle' && el.dataset) {
    if (el.dataset.arq != null) { ARQ_ABERTA = el.open; return false; }
    if (el.dataset.numdet != null) { NUM_ABERTO = el.open; return false; }
    if (el.dataset.calc != null) {
      S.calcAberta = el.open;
      const box = document.getElementById('custos-box');
      if (el.open && box && !box.innerHTML && typeof renderCustos === 'function') { box.innerHTML = renderCustos(); renderCustosResultados(); }
      salvar(); return false;
    }
  }
  return false;
}
// Escolas e estudantes por etapa e ano (data-ctxn="etapas.<id>.<campo>[.<i>]")
function gravarCtxn(el) {
  const v = lerNum(el.value);
  const val = v === '' ? '' : Math.max(0, Math.round(+v || 0));
  const ks = el.dataset.ctxn.split('.');
  const et = S.ctx.etapas[ks[1]] = S.ctx.etapas[ks[1]] || {};
  if (ks[2] === 'anos') { et.anos = Array.isArray(et.anos) ? et.anos : []; et.anos[+ks[3]] = val; } else et[ks[2]] = val;
  if (S.exemplo !== 'novo') S.exemplo = 'editado';
  const s = document.querySelector(`[data-sum="${ks[1]}"]`); if (s) s.textContent = fmtInt(alunosEtapa(ks[1]));
  const t = totaisCtx(); const te = document.querySelector('[data-tot="escolas"]'), ta = document.querySelector('[data-tot="alunos"]');
  if (te) te.textContent = fmtInt(t.escolas); if (ta) ta.textContent = fmtInt(t.alunos);
  atualizarLaterais();
}
