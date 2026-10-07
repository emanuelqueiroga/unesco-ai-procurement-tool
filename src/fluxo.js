// =====================================================================
// Percurso em quatro fases (v11): lógica, telas e eventos (dados em fluxo_dados.js)
// Durante o percurso só há perguntas; diagnóstico e recomendações ficam no fim da fase 4 e no plano de contratação.
// =====================================================================

const CAMPO_POR_ID = {};
CAMPOS.forEach(f => { CAMPO_POR_ID[f.id] = f; });
// v11: um campo do caso cujo valor em CASO_VAZIO não é vazio só conta depois que a pessoa responde
if (typeof CASO_VAZIO !== 'undefined') CAMPOS.forEach(f => {
  const v = CASO_VAZIO[f.id];
  if (f.onde === 'caso' && !f.padrao && ['radio', 'chips', 'multi'].includes(f.tipo) && !(v == null || v === '' || (Array.isArray(v) && !v.length))) f.padrao = true;
});
const CAMPOS_SUGERIDOS = ['usuarios', 'afetados', 'consequencias', 'frequencia'];
// Passos sem perguntas (4.2 estimativa, 4.3 recomendações): concluídos quando abertos
const PASSOS_VER = ['4b', '4c'];
let NUM_ABERTO = false;   // <details> "Ver os números detalhados" do 4.2
let CONF_LIMPAR = false;  // confirmação inline de "Começar em branco" no painel
const FIG_ABERTA = {};    // (v11) figura aberta por nota ⓘ; desde a v12 a figura aparece sempre e nada lê este objeto

// ----------------------------------------------------------- estado
const SUB_OBJ = { piloto: ['escolas', 'participantes', 'meses'], poc: ['participantes', 'meses'], implantacao: ['escolas', 'pessoas'] };
function objVazio(k) { const o = {}; SUB_OBJ[k].forEach(x => { o[x] = ''; }); return o; }
function estadoFluxo() {
  S.ctx = Object.assign({ nivel: '', nivelOutro: '', local: '', etapas: {}, dominio: '', comps: [], compOutro: '', olhando: '' }, S.ctx || {});
  if (!S.ctx.etapas || typeof S.ctx.etapas !== 'object') S.ctx.etapas = {};
  S.resp = S.resp || {};
  S.respC = S.respC || {};
  S.feitos = S.feitos || {};
  S.info = S.info || {};
  if (S.caso) {
    Object.keys(SUB_OBJ).forEach(k => { if (!S.caso[k] || typeof S.caso[k] !== 'object') S.caso[k] = objVazio(k); });
    if (!Array.isArray(S.caso.testes)) S.caso.testes = [];
    if (!Array.isArray(S.caso.ferramentas)) S.caso.ferramentas = [];
  }
  if (S.fase == null || (S.fase !== '' && !PASSOS[S.fase])) S.fase = 'contexto';
  if (S.passo == null) S.passo = '';
  if (S.fase && S.passo && !PASSOS[S.fase].some(p => p[0] === S.passo)) S.passo = PASSOS[S.fase][0][0];
  if (S.vista && S.vista !== 'plano') S.vista = '';
  return S.ctx;
}
// 2.0: testes marcados (compatível com o campo antigo "teste") e modo derivado
function testesDe(c) {
  c = c || S.caso || {};
  const t = Array.isArray(c.testes) ? c.testes : [];
  if (!t.length && c.teste) return c.teste === 'ambos' ? ['poc', 'piloto'] : [c.teste];
  return t;
}
// 'poc' | 'piloto' | 'ambos' | 'recomendar' | ''
function modoTeste(c) {
  const t = testesDe(c);
  if (t.includes('recomendar')) return 'recomendar';
  if (t.includes('poc') && t.includes('piloto')) return 'ambos';
  return t[0] || '';
}
// A pergunta aparece? (condição "se" do registro CAMPOS)
function visivel(f) { try { return !f.se || !!f.se(S.caso || {}); } catch (e) { return true; } }
// Num caso em branco, um campo com valor padrão só conta depois que a pessoa responde.
function respondido(campo) { return S.exemplo !== 'novo' || !!(S.respC || {})[campo]; }
function aplicarExemploFluxo(k) {
  const CX = typeof CTX_EX !== 'undefined' ? CTX_EX : {}, RX = typeof RESP_EX !== 'undefined' ? RESP_EX : {};
  S.ctx = clone(CX[k] || {}); S.resp = clone(RX[k] || {}); S.feitos = {}; S.respC = {}; S.vista = ''; S.info = {}; S.revisar = [];
  // nos exemplos, as respostas de experiência de uso já estão confirmadas (as sugestões não as substituem)
  if (k !== 'novo') {
    // v11: nos exemplos, horas de formação "estimadas" aparecem com o número da estimativa e a arquitetura
    // não informada aparece como "Ainda não sei (usar a presumida)", as duas já respondidas
    if (S.caso.formacaoEstimativa && vazio(S.caso.formacaoHoras)) S.caso.formacaoHoras = horasEstimativa();
    if (!S.caso.arquitetura) S.caso.arquitetura = 'nao_sei';
    CAMPOS_SUGERIDOS.forEach(c => { S.respC[c] = true; }); confirmarGerados(S.caso, S.respC);
  }
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
function textoCampo(f) { const m = modoTeste(); return m === 'poc' && f.tPoc ? f.tPoc : m === 'ambos' && f.tAmbos ? f.tAmbos : f.t; }

// ----------------------------------------------------------- padrões gerados (v10, ampliados na v11)
// Nada vem marcado antes de a pessoa agir. Quando ela marca uma resposta de origem, os campos que dependem
// dela recebem um valor sugerido ("sugerido"), que só conta depois de confirmado (S.respC), como no passo 2.2.
// Mudar a origem recalcula só as sugestões ainda não confirmadas.
//   2.0 testes → 2.3.8 tamanho e duração (PoC, piloto ou os dois); 2.3.4 tipo de tecnologia → 2.3.5 pagamento e 2.3.6 licença;
//   2.4.3 dispositivos próprios → 2.4.4 "já existem"; 2.2.1 usuários (confirmados) → 4.1.1 pessoas na rede;
//   4.1.1 pessoas na rede (ou as etapas do 1.1) → 3.1.1 primeira etapa (1/3); botão "Usar uma estimativa" → 2.5.4 horas.
const PAG_LIC = { publica: ['gratuito', 'termos'], aberta: ['consumo', 'aberta'], paga: ['institucional', 'assinatura'] };
const ALUNOS_POR_PROF = 25;   // premissa ilustrativa: 1 professor para cada 25 estudantes
// premissa ilustrativa (casos.js, PREMISSAS_V11): a primeira etapa da implantação alcança 1/3 das pessoas e das escolas
const FRACAO_IMPLANT = typeof PREMISSAS_V11 !== 'undefined' && +PREMISSAS_V11.implantacaoFracao > 0 ? +PREMISSAS_V11.implantacaoFracao : 1 / 3;
const CAMPOS_GERADOS = ['pagamento', 'licenca', 'elegiveis', 'dispExistem'];
// Horas de formação por pessoa da estimativa ilustrativa (premissa do motor, se houver)
function horasEstimativa() {
  if (typeof horasFormacaoEstimada === 'function') { try { const h = +horasFormacaoEstimada(S.caso); if (h > 0) return h; } catch (e) { } }
  const P = typeof PREMISSAS_V11 !== 'undefined' ? PREMISSAS_V11 : {};
  const h = +(P.horasFormacao || (P.formacao && P.formacao.horas) || 0);
  return h > 0 ? h : 8;
}
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
// Origem da sugestão do 3.1.1: 'eleg' (resposta 4.1.1) | 'etapas' (passo 1.1) | ''
function origemImplantacao() { return +S.caso.elegiveis > 0 ? 'eleg' : totaisCtx().alunos > 0 || totaisCtx().escolas > 0 ? 'etapas' : ''; }
function padroesGerados() {
  const c = S.caso, t = totaisCtx(), g = {}, m = modoTeste(c);
  if (m === 'poc' || m === 'ambos') g.poc = { participantes: 15, meses: 2 };
  if (m === 'piloto' || m === 'recomendar' || m === 'ambos') {
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
  if (c.modeloDisp === 'proprio') g.dispExistem = 'sim';
  const o = origemImplantacao();
  if (o) {
    const E = o === 'eleg' ? +c.elegiveis : basePessoas().n;
    g.implantacao = { escolas: t.escolas > 0 ? Math.max(1, Math.round(FRACAO_IMPLANT * t.escolas)) : '', pessoas: E > 0 ? Math.max(1, Math.round(FRACAO_IMPLANT * E)) : '' };
  }
  return g;
}
function aplicarPadroes() {
  if (!S.caso) return false;
  const c = S.caso, g = padroesGerados();
  let mudou = false;
  CAMPOS_GERADOS.forEach(k => {
    if (S.respC[k]) return;
    const v = g[k] != null ? g[k] : '';
    if (c[k] !== v) { c[k] = v; mudou = true; }
  });
  Object.keys(SUB_OBJ).forEach(o => {
    c[o] = c[o] && typeof c[o] === 'object' ? c[o] : objVazio(o);
    SUB_OBJ[o].forEach(k => {
      if (S.respC[o + '.' + k]) return;
      const v = g[o] && g[o][k] != null ? g[o][k] : '';
      if (c[o][k] !== v) { c[o][k] = v; mudou = true; }
    });
  });
  // a primeira ferramenta da lista é a principal: tecnologia e pagamento são os das perguntas 2.3.4 e 2.3.5
  const f0 = (c.ferramentas || [])[0];
  if (f0) { if (f0.tipoTec !== (c.tipoTec || '')) { f0.tipoTec = c.tipoTec || ''; mudou = true; } if (f0.pagamento !== (c.pagamento || '')) { f0.pagamento = c.pagamento || ''; mudou = true; } }
  if (mudou && S.custo) S.custo.editado = false;
  return mudou;
}
// Marca como confirmados os valores já preenchidos dos campos gerados (exemplos e estados anteriores à v10)
function confirmarGerados(caso, respC) {
  CAMPOS_GERADOS.concat(['formacaoHoras']).forEach(k => { if (!vazio(caso[k])) respC[k] = true; });
  Object.keys(SUB_OBJ).forEach(o => { const p = caso[o] || {}; SUB_OBJ[o].forEach(k => { if (!vazio(p[k])) respC[o + '.' + k] = true; }); });
}
// Subcampos (objeto.chave) de uma pergunta de tamanho: 2.3.8 conforme a resposta 2.0; 3.1.1
function subcampos(f) {
  if (f.id === 'implantacao') return SUB_OBJ.implantacao.map(k => ['implantacao', k]);
  if (f.id !== 'piloto') return [];
  const m = modoTeste(), L = [];
  if (m === 'poc' || m === 'ambos') SUB_OBJ.poc.forEach(k => L.push(['poc', k]));
  if (m !== 'poc') SUB_OBJ.piloto.forEach(k => L.push(['piloto', k]));
  return L;
}
// Confirma a sugestão de um campo (rodapé "Confirmar e continuar" ou clique na opção sugerida)
function confirmarSugestao(f) {
  subcampos(f).forEach(([o, k]) => { S.respC[o + '.' + k] = true; });
  S.respC[f.id] = true;
}
// O campo mostra um valor gerado ainda não confirmado pela pessoa?
function sugerido(f) {
  if (!f) return false;
  if (f.sugere) return !S.respC[f.id] && (S.caso.tarefas || []).length > 0;
  if (f.tipo === 'horas') return !S.respC[f.id] && !!S.caso.formacaoEstimativa && !vazio(S.caso[f.id]);
  if (!f.sugDe) return false;
  if (f.tipo === 'setup' || f.tipo === 'implant') return subcampos(f).some(([o, k]) => !S.respC[o + '.' + k] && !vazio((S.caso[o] || {})[k]));
  return !S.respC[f.id] && !vazio(valorCampo(f));
}
function textoSugerido(f) {
  if (f.sugere) return 'sugerido pela tarefa';
  if (f.tipo === 'horas') return 'estimativa ilustrativa';
  if (f.id === 'implantacao') return origemImplantacao() === 'eleg' ? 'sugerido pela resposta 4.1.1' : 'sugerido pelas etapas do passo 1.1';
  return { testes: 'sugerido pela resposta 2.0', tipoTec: 'sugerido pela resposta 2.3.4', usuarios: 'sugerido pela resposta 2.2.1', modeloDisp: 'sugerido pela resposta 2.4.3' }[f.sugDe] || 'sugerido';
}
// Nota que explica de onde vem o valor sugerido (só aparece enquanto a sugestão não é confirmada)
function notaSugerido(f) {
  const L = [], m = modoTeste();
  if (f.id === 'piloto') {
    if (m === 'poc' || m === 'ambos') L.push('Sugestão para uma prova de conceito: 15 pessoas por 2 meses, sem escolas. Ajuste ao seu teste.');
    if (m !== 'poc') {
      L.push('Sugestão: cerca de 5% das escolas da rede (no mínimo 3 e no máximo 30), 5% das pessoas que usariam e 4 meses. Ajuste ao seu piloto.');
      if (basePessoas().prof) L.push('Participantes estimados com uma premissa ilustrativa de 1 professor para cada 25 estudantes, e não com um dado da sua rede.');
    }
  } else if (f.id === 'elegiveis') {
    L.push(basePessoas().prof ? 'Sugestão ilustrativa: 1 professor para cada 25 estudantes das etapas marcadas. É uma premissa desta ferramenta, e não um dado da sua rede; informe o número real se souber.'
      : 'Sugestão: o total de estudantes das etapas marcadas no passo 1.1. Confirme ou informe outro número.');
  } else if (f.id === 'implantacao') {
    L.push(origemImplantacao() === 'eleg' ? 'Sugestão ilustrativa: um terço das pessoas da resposta 4.1.1 e um terço das escolas da rede. Confirme ou informe os números da sua primeira etapa.'
      : 'Sugestão ilustrativa: um terço dos estudantes e das escolas das etapas marcadas no passo 1.1. Confirme ou informe os números da sua primeira etapa.');
  } else if (f.id === 'pagamento' || f.id === 'licenca') L.push('Sugestão a partir do tipo de tecnologia. Confirme ou escolha outra opção.');
  else if (f.id === 'dispExistem') L.push('Sugestão: com dispositivos próprios das pessoas, a rede não precisa comprar equipamentos. Confirme ou escolha outra opção.');
  else if (f.id === 'formacaoHoras') L.push('Estimativa ilustrativa: ' + horasEstimativa() + ' horas por pessoa. É uma premissa desta ferramenta, e não um dado da sua rede; confirme ou informe as horas do seu plano de formação.');
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
    case 'num': case 'horas': return +v > 0 && (semSug || !sugerido(f));
    case 'testes': return testesDe(c).length > 0;
    case 'ferramentas': { const L = c.ferramentas || []; return L.length > 0 && L.every(t => !!String(t.nome || '').trim()); }
    case 'setup': case 'implant': {
      const sc = subcampos(f);
      return sc.length > 0 && sc.every(([o, k]) => +(c[o] || {})[k] > 0 || (o === 'implantacao' && k === 'escolas' && !(totaisCtx().escolas > 0))) && (semSug || !sugerido(f));
    }
    case 'arq': return !!c.arquitetura;
    default:
      if (vazio(v)) return false;
      if (!semSug && sugerido(f)) return false;
      return f.padrao ? respondido(f.id) || (semSug && sugerido(f)) : true;
  }
}
function camposPasso(id) { return CAMPOS.filter(f => f.passo === id && visivel(f)); }
// Perguntas obrigatórias ainda sem resposta num passo (objetos de CAMPOS)
function faltas(id) { return camposPasso(id).filter(f => !f.opcional && !qOk(f)); }
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
// licença, uso do modelo, dispositivos e conectividade. Usadas no passo 4.2 e em A2 do plano. Textos já traduzidos.
function premissasUnitarias() {
  const cfg = cfgAtual(), ce = casoAtual(), c = S.caso, L = [];
  const nf = (x, d = 1) => (+x || 0).toLocaleString(LOC(), { maximumFractionDigits: d });
  const arqC = typeof arquitetura === 'function' ? arquitetura(cfg) : ({ A: 'saas', B: 'api', C: 'ow' })[cfg.origem];
  const orig = ({ A: 'saas', B: 'api', C: 'ow' })[cfg.origem] || arqC;
  if (orig && typeof PRESET_ARQ !== 'undefined' && PRESET_ARQ[orig]) L.push(tr('Premissas de partida:') + ' ' + tr(PRESET_ARQ[orig]) + '.');
  const dm = cfg.demanda || {}, E = dm.E || [], H = Math.max(1, E.length - 1);
  const Emax = Math.max(0, ...E.slice(1));
  if (Emax) L.push(tr('Pessoas que usariam na rede:') + ' ' + fmtInt(Emax) + (ce.__elegPadrao ? ' (' + tr('premissa padrão; informe no passo 4.1.1') + ')' : '') + '.');
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
  // v11: internet e dispositivos separados (2.4)
  if (typeof PREMISSAS_K1 !== 'undefined') {
    const K = PREMISSAS_K1;
    if (c.internet === 'nao' || c.internet === 'parcial') L.push(tr('Conexão para as escolas sem internet adequada:') + ' ' + din(K.conectEscolaAno, 0) + ' ' + tr('por escola por ano') + '.');
    if ((c.dispExistem === 'nao' || c.dispExistem === 'parcial') && c.modeloDisp && c.modeloDisp !== 'proprio') L.push(tr('Dispositivos que faltam:') + ' ' + din(K.precoDispositivo, 0) + ' ' + tr('por dispositivo') + '.');
  }
  return L;
}
// Adaptação ao contexto (K3.1 + K3.2) no Ano 0, para mostrar o efeito da resposta 2.3.7
function adaptacaoAno0(av) { return (av.linhas || []).filter(l => l.s === 'K3.1' || l.s === 'K3.2').reduce((t, l) => t + ((l.eco || [])[0] || 0), 0); }
// O painel só mostra a estimativa depois das respostas que a definem (2.1.1, 2.3.4 e 4.1.1)
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
// 2.3.8 tamanho e duração: campos da prova de conceito (caso.poc), do piloto (caso.piloto) ou dos dois
function opSetup() {
  const c = S.caso, m = modoTeste(), t = totaisCtx();
  const lab = (o, txt, k) => `<label class="g-c"><span>${esc(txt)}</span>${nCampo({ id: (o === 'poc' ? 'poc-' : 'pl-') + k, attrs: `data-fn="${o}.${k}"`, valor: (c[o] || {})[k], casas: 0, rotulo: tr(txt), ph: ' ' })}</label>`;
  const p = c.piloto || {};
  const pctRede = m !== 'poc' && t.escolas && +p.escolas ? Math.min(1, +p.escolas / t.escolas) : 0;
  const poc = `<div class="g-campos setup">${lab('poc', 'Pessoas que vão testar', 'participantes')}${lab('poc', 'Duração (meses)', 'meses')}</div>`;
  const pil = `<div class="g-campos setup">${lab('piloto', 'Escolas', 'escolas')}${lab('piloto', 'Participantes', 'participantes')}${lab('piloto', 'Duração (meses)', 'meses')}</div>
    <div class="hint" id="pct-rede"${pctRede ? '' : ' hidden'}><span>Escolas do piloto em relação à rede:</span> <b class="num">${pct(pctRede)}</b></div>`;
  if (m === 'poc') return poc;
  if (m === 'ambos') return `<div class="setup-dois"><div class="setup-bloco"><h4 class="setup-h">Prova de conceito</h4>${poc}</div><div class="setup-bloco"><h4 class="setup-h">Piloto</h4>${pil}</div></div>`;
  return pil;
}
// 2.0: prova de conceito, piloto ou os dois; "Não sei, recomende para mim" é exclusiva (app.js)
function opTestes(f) {
  return `<div class="opts cols" role="group" aria-labelledby="qt-${f.id}">${listaOpc(f).map(o => `<label class="opt"><input type="checkbox" data-fm="testes" value="${esc(o[0])}" ${testesDe().includes(o[0]) ? 'checked' : ''}><span><b>${esc(o[1])}</b>${subOpc(o) ? `<small>${esc(subOpc(o))}</small>` : ''}</span></label>`).join('')}</div>`;
}
// 2.3.3 lista de ferramentas: adicionar e remover linhas no próprio passo (sem caixas de diálogo)
function rotTarefa(k) { return k === 'outra' ? (S.caso.tarefaOutra || 'Outra tarefa') : rotulo(listaOpc(CAMPO_POR_ID.tarefas), k); }
function opFerramentas() {
  const c = S.caso, L = c.ferramentas || [], tars = c.tarefas || [];
  const sel = (i, k, lista, val, rot) => `<label class="g-c fe-c"><span>${esc(rot)}</span><select class="f" id="fe-${i}-${k}" data-ferr="${i}.${k}"><option value="">${esc('Escolha')}</option>${lista.map(o => `<option value="${esc(o[0])}" ${String(val) === String(o[0]) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label>`;
  const linhas = L.map((t, i) => {
    const princ = i === 0;
    const nTit = tr('Ferramenta ' + (i + 1));
    return `<fieldset class="ferr" id="ferr-${i}" aria-labelledby="ferr-t-${i}">
      <div class="ferr-cab"><b id="ferr-t-${i}"><span>${esc(nTit)}</span>${princ ? ` <span class="tag">${esc('principal')}</span>` : ''}</b>
        <button type="button" class="link" data-act="ferr-rm" data-i="${i}" aria-label="${esc(tr('Remover') + ' ' + nTit)}">Remover</button></div>
      <label class="g-c fe-nome"><span>Nome da ferramenta</span>${tCampo('fe-' + i + '-nome', `data-ferr="${i}.nome"`, t.nome, ' ')}</label>
      <div class="fe-tar" role="group" aria-labelledby="fe-tt-${i}"><span class="fe-l" id="fe-tt-${i}">Tarefas que ela cobre</span>
        ${tars.length ? `<div class="chips">${tars.map(k => `<label class="chip"><input type="checkbox" data-ferr-t="${i}" value="${esc(k)}" ${(t.tarefas || []).includes(k) ? 'checked' : ''}><span>${esc(rotTarefa(k))}</span></label>`).join('')}</div>`
          : `<p class="hint">Marque antes as tarefas no passo 2.1.</p>`}</div>
      <div class="fe-sel">${sel(i, 'tipoTec', listaOpc(CAMPO_POR_ID.tipoTec), princ ? c.tipoTec : t.tipoTec, 'Tipo de tecnologia')}${sel(i, 'pagamento', listaOpc(CAMPO_POR_ID.pagamento), princ ? c.pagamento : t.pagamento, 'Forma de pagamento')}
        <label class="g-c fe-c"><span>Preço por usuário por mês, em US$ (opcional)</span>${nCampo({ id: 'fe-' + i + '-preco', attrs: `data-ferr="${i}.preco"`, valor: t.preco, casas: 2, ph: ' ' })}</label></div>
      ${princ ? '<p class="hint">Na ferramenta principal, tecnologia e pagamento são as respostas 2.3.4 e 2.3.5.</p>' : ''}</fieldset>`;
  }).join('');
  return `<div class="ferrs">${linhas || '<p class="hint vazio-g">Nenhuma ferramenta na lista.</p>'}
    <div class="row"><button type="button" class="btn" data-act="ferr-add" id="ferr-add">+ <span>Adicionar ferramenta</span></button></div></div>`;
}
// 3.1.1 primeira etapa da implantação
function opImplant() {
  const c = S.caso, p = c.implantacao || {}, t = totaisCtx();
  const lab = (txt, k) => `<label class="g-c"><span>${esc(txt)}</span>${nCampo({ id: 'im-' + k, attrs: `data-fn="implantacao.${k}"`, valor: p[k], casas: 0, rotulo: tr(txt), ph: ' ' })}</label>`;
  return `<div class="g-campos setup">${lab('Escolas', 'escolas')}${lab('Pessoas', 'pessoas')}</div>
    ${t.escolas > 0 ? `<div class="hint"><span>Escolas da rede, segundo o passo 1.1:</span> <b class="num">${fmtInt(t.escolas)}</b></div>` : ''}`;
}
// 2.5.4 horas de formação por pessoa, com "Usar uma estimativa" (valor ilustrativo marcado como sugerido)
function opHoras(f) {
  const c = S.caso, est = sugerido(f);
  return `<div class="horas">${nCampo({ id: 'f-' + f.id, attrs: `data-fn="${f.id}"`, valor: c[f.id], casas: 0, rotulo: tr(f.t), ph: ' ' })}
    ${est ? '' : `<button type="button" class="btn" data-act="horas-est">Usar uma estimativa</button>`}</div>`;
}
// 3.2.1 arquitetura: as três opções em linguagem simples e "Ainda não sei (usar a presumida: X)"
function arqPresumida() {
  if (typeof derivarArquitetura !== 'function') return '';
  try { return derivarArquitetura(Object.assign({}, S.caso, { arquitetura: '', arquiteturaManual: '' }), true); } catch (e) { return ''; }
}
function opArq(f) {
  const c = S.caso;
  const arqs = ((typeof OPC !== 'undefined' && OPC.arquitetura) || []).filter(o => ['saas', 'api', 'ow'].includes(o[0]));
  const pres = rotulo(arqs, arqPresumida());
  const op = (v, corpo) => `<label class="opt"><input type="radio" name="arquitetura" value="${v}" data-f="arquitetura" ${c.arquitetura === v ? 'checked' : ''}><span>${corpo}</span></label>`;
  return `<div class="opts" role="radiogroup" aria-labelledby="qt-${f.id}">
    ${arqs.map(o => op(o[0], `<b>${esc(o[1])}</b>${ARQ_DESC[o[0]] ? `<small>${esc(ARQ_DESC[o[0]])}</small>` : ''}`)).join('')}
    ${op('nao_sei', `<b><span>Ainda não sei</span>${pres ? ` (<span>usar a presumida:</span> <span>${esc(pres)}</span>)` : ''}</b><small>${esc('A ferramenta deduz a arquitetura das respostas do passo 2.3 para estimar o custo.')}</small>`)}</div>`;
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
    case 'testes': return opTestes(f);
    case 'ferramentas': return opFerramentas();
    case 'implant': return opImplant();
    case 'horas': return opHoras(f);
    case 'arq': return opArq(f);
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
  const ok = qOk(f), sug = sugerido(f) && (f.tipo === 'setup' || f.tipo === 'implant' || !vazio(valorCampo(f)));
  const m = modoTeste();
  const alt = m === 'poc' && f.tPoc ? 'Poc' : m === 'ambos' && f.tAmbos ? 'Ambos' : '';
  const t = alt ? f['t' + alt] : f.t, h = alt ? f['h' + alt] : f.h, ex = alt ? f['ex' + alt] : f.ex;
  const rotTag = ['texto', 'area', 'num', 'horas'].includes(f.tipo) ? `label for="f-${f.id}"` : 'div';
  let extra = '';
  if (f.id === 'elegiveis') {
    const tt = totaisCtx();
    if ((S.caso.usuarios || []).includes('estudantes') && tt.alunos > 0 && +S.caso.elegiveis !== tt.alunos) extra = `<div class="hint"><button type="button" class="link" data-act="usar-alunos">${esc(tr('Usar o total de estudantes do contexto (' + fmtInt(tt.alunos) + ')'))}</button></div>`;
  }
  if (f.id === 'escolasInternet') { const tt = totaisCtx(); if (tt.escolas > 0) extra = `<div class="hint"><span>Escolas da rede, segundo o passo 1.1:</span> <b class="num">${fmtInt(tt.escolas)}</b></div>`; }
  const temTag = f.sugere || f.sugDe || f.tipo === 'horas';
  return `<div class="q${ok ? ' ok' : ''}${sug ? ' sug' : ''}" id="${idQ(f.n)}" data-n="${f.n}" data-campo="${f.id}">
    <${rotTag} class="q-t" id="qt-${f.id}"><span class="qn">${f.n}</span> <span class="qt">${esc(t)}</span>${f.opcional ? ' <span class="tag opc">opcional</span>' : ''}${temTag ? `<span class="tag sug-tag">${esc(textoSugerido(f))}</span>` : ''}<span class="sr q-sr">${ok ? 'respondida' : ''}</span></${rotTag.split(' ')[0]}>
    ${h ? `<div class="hint">${esc(h)}</div>` : ''}${ex ? `<div class="hint ex">${esc(ex)}</div>` : ''}
    ${controle(f)}${sug ? notaSugerido(f) : ''}${extra}</div>`;
}
// Botão ⓘ e nota com a explicação da camada, a referência ao documento de Krueger e Jackson (2026)
// e o botão que abre a Figura 1 (p. 11) sem alteração, com legenda e crédito.
const INFO_ROT = { c1: 'Sobre a camada 1', c2: 'Sobre a camada 2', c24: 'Sobre as camadas 2 e 4', c3: 'Sobre a camada 3', c6: 'Sobre a camada 6', c7: 'Sobre a camada 7', c45: 'Sobre as camadas 4 e 5', c37: 'Sobre as sete camadas' };
function botaoInfo(chave, id) {
  return `<button type="button" class="info" data-info="${chave}" data-info-id="${id}" aria-expanded="${!!S.info[id]}" aria-controls="nota-${id}" aria-label="${esc(INFO_ROT[chave] || 'Sobre as camadas')}">ⓘ</button>`;
}
// v12: a figura aparece logo, em miniatura (até ~460 px) com legenda e crédito; "Ampliar a figura" ou um clique
// na miniatura abrem o visualizador sobre a página (abrirVisor), sem nova janela. O plano (A3) usa os mesmos.
function figuraMini(o) {
  if (typeof FIG_TCO === 'undefined' || !FIG_TCO) return '';
  return `<div class="fig-box"><figure class="fig-tco fig-mini" id="${o.id}">${o.titulo ? `<h4 class="fig-h">${esc(o.titulo)}</h4>` : ''}
    <img src="${FIG_TCO}" alt="${esc(o.alt || '')}" width="900" height="1225" decoding="async" data-visor title="Ampliar a figura">
    <figcaption>${esc(o.legenda || '')}</figcaption></figure>
    <button type="button" class="btn fig-amp" data-visor aria-haspopup="dialog"><svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16"><path d="M6.5 1a5.5 5.5 0 0 1 4.38 8.82l3.65 3.65-1.06 1.06-3.65-3.65A5.5 5.5 0 1 1 6.5 1Zm0 1.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM7.25 4v1.75H9v1.5H7.25V9h-1.5V7.25H4v-1.5h1.75V4h1.5Z" fill="currentColor"/></svg><span>Ampliar a figura</span></button></div>`;
}
function figuraCamadas(id) {
  return figuraMini({ id: 'fig-' + id, alt: FIG_INFO.alt, legenda: FIG_INFO.legenda });
}
function notaInfo(chave, id) {
  if (!S.info[id]) return '';
  const fig = figuraCamadas(id);
  return `<div class="info-nota${fig ? ' com-fig' : ''}" id="nota-${id}"><div class="info-grade"><div class="info-txt"><p>${esc(CAMADAS_INFO[chave])}</p>
    <p class="ref-tco"><span>${esc(REF_TCO.autores)}</span> <cite data-notr>${esc(REF_TCO.titulo)}</cite> <span>${esc(REF_TCO.local)}</span>
      <a href="${REF_TCO.url}" target="_blank" rel="noopener">${esc(REF_TCO.link)}</a></p>
    <p class="small muted">${esc(REF_TCO.nota)}</p></div>${fig}</div></div>`;
}
// Visualizador da figura: <dialog> modal (role="dialog", aria-modal), fundo escurecido, imagem ajustada à largura
// com rolagem; fecha com Esc, clique no fundo ou "Fechar"; foco preso no visualizador e devolvido a quem o abriu.
let VISOR_VOLTA = null;
function abrirVisor(volta) {
  if (typeof FIG_TCO === 'undefined' || !FIG_TCO) return;
  let d = document.getElementById('visor-fig');
  if (!d) {
    d = document.createElement('dialog'); d.id = 'visor-fig'; d.className = 'visor';
    d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'visor-t');
    d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-visor-fechar]')) { e.stopPropagation(); fecharVisor(); } });
    d.addEventListener('cancel', e => { e.preventDefault(); fecharVisor(); });
    d.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); fecharVisor(); return; }
      if (e.key !== 'Tab') return;
      const f = [...d.querySelectorAll('button, a[href], [tabindex="0"]')];
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
    });
    document.body.appendChild(d);
  }
  VISOR_VOLTA = volta || document.activeElement;
  d.innerHTML = `<div class="visor-in">
    <div class="visor-cab"><h2 id="visor-t">${esc(typeof FIG_TITULO !== 'undefined' ? FIG_TITULO : 'Quadro de custo total em camadas')}</h2>
      <button type="button" class="btn visor-x" data-visor-fechar><span aria-hidden="true">✕</span> <span>Fechar</span></button></div>
    <div class="visor-corpo" tabindex="0" role="region" aria-labelledby="visor-t"><img src="${FIG_TCO}" alt="${esc(FIG_INFO.alt)}" width="900" height="1225" decoding="async"></div>
    <p class="visor-leg">${esc(FIG_INFO.legenda)}</p></div>`;
  document.documentElement.classList.add('visor-aberto');
  try { d.showModal(); } catch (e) { d.setAttribute('open', ''); }
  const x = d.querySelector('[data-visor-fechar]'); if (x) x.focus();
}
function fecharVisor() {
  const d = document.getElementById('visor-fig'); if (!d) return;
  try { d.close(); } catch (e) { d.removeAttribute('open'); }
  document.documentElement.classList.remove('visor-aberto');
  const v = VISOR_VOLTA; VISOR_VOLTA = null;
  if (v && v.isConnected) { try { v.focus({ preventScroll: true }); } catch (e) { } }
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
  return s;
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
function passo4b() {
  let n;
  try { n = numerosCusto(); } catch (e) { return '<p class="muted">Não foi possível calcular com as premissas atuais.</p>'; }
  const T = n.av.r.anos;
  const pend = ['2c', '2d', '2e', '2f', '3a', '3b', '4a'].some(id => faltas(id).length);
  const cam = n.camadas;
  let prem = [];
  try { prem = premissasUnitarias(); } catch (e) { console.warn(e); }
  const nivelAd = S.caso.adaptacao ? tr(rotulo(listaOpc(CAMPO_POR_ID.adaptacao), S.caso.adaptacao)) : tr('nível do exemplo do guia');
  const linhaAdapt = `<p class="adapt"><span>${esc(tr('Adaptação (K3.1 + K3.2), Ano 0:'))}</span> <b class="num">${grande(adaptacaoAno0(n.av))}</b> <span class="muted">· <span>${esc(tr('Nível escolhido no passo 2.3.7:'))}</span> ${esc(nivelAd)}</span></p>`;
  const tabCam = cam ? (() => {
    const tot = CAMADAS.reduce((s, [k]) => s + ((cam.total || {})[k] || 0), 0);
    const thC = [tr('Camada'), tr('Ano 0') + ' (' + unidMil() + ')', tr('Total do ciclo') + ' (' + unidMil() + ')'];
    return `<h3 class="sub-h">Custo por camada</h3><div class="tw"><table class="pilha"><thead><tr><th>Camada</th><th class="n"><span>Ano 0</span> (${esc(unidMil())})</th><th class="n"><span>Total do ciclo</span> (${esc(unidMil())})</th><th class="n">%</th></tr></thead><tbody>
      ${CAMADAS.map(([k, nome]) => `<tr><td data-th="${esc(thC[0])}"><span class="cn-t">${k}</span> <span>${esc(nome)}</span></td><td class="n" data-th="${esc(thC[1])}">${mil((cam.ano0 || {})[k] || 0)}</td><td class="n" data-th="${esc(thC[2])}">${mil((cam.total || {})[k] || 0)}</td><td class="n" data-th="%">${pct(tot ? ((cam.total || {})[k] || 0) / tot : 0)}</td></tr>`).join('')}
      <tr class="tot"><td data-th="${esc(thC[0])}">Total</td><td class="n" data-th="${esc(thC[1])}">${mil(CAMADAS.reduce((s, [k]) => s + ((cam.ano0 || {})[k] || 0), 0))}</td><td class="n" data-th="${esc(thC[2])}">${mil(tot)}</td><td class="n" data-th="%">100%</td></tr></tbody></table></div>`;
  })() : '';
  // "Como o custo é calculado" (formula.js) no topo, depois os indicadores; tabelas e premissas recolhidas
  let formula = '';
  if (typeof renderFormula === 'function') { try { formula = renderFormula(); } catch (e) { console.error(e); formula = ''; } }
  return `${seletorMoeda()}
    ${pend ? '<p class="hint">Enquanto faltarem respostas nos passos 2.3 a 2.6, 3.1, 3.2 e 4.1, a estimativa usa premissas padrão.</p>' : ''}
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
// Passo 4.3: recomendações para você (recomendacoes.js)
function passo4c() {
  if (typeof renderRecomendacoes === 'function') {
    try { return renderRecomendacoes(); } catch (e) { console.error(e); return '<p class="muted">Não foi possível montar as recomendações com as respostas atuais.</p>'; }
  }
  return '<p class="muted">As recomendações para você ainda não estão disponíveis nesta versão da ferramenta.</p>';
}
function corpoPasso(id) { return id === '4b' ? passo4b() : id === '4c' ? passo4c() : corpoPadrao(id); }

// ----------------------------------------------------------- passos, rodapés e fases
function resumoPasso(id) {
  const x = S.ctx, c = S.caso;
  if (id === '1a' && passoFeito(id)) { const t = totaisCtx(); return [tr(rotulo(NIVEIS_ADM, x.nivel)), x.local, fmtInt(t.alunos) + ' ' + tr('estudantes')].filter(Boolean).join(' · '); }
  if (id === '1b' && x.olhando) return x.olhando;
  if (id === '2a' && (c.tarefas || []).length) return rotTarefas(3);
  if (id === '20' && testesDe(c).length) return rotTestes();
  if (id === '2c' && qOk(CAMPO_POR_ID.tipoTec)) return tr(rotulo(listaOpc(CAMPO_POR_ID.tipoTec), c.tipoTec));
  if (id === '2d' && c.internet) return tr('Internet') + ': ' + tr(rotulo(listaOpc(CAMPO_POR_ID.internet), c.internet));
  if (id === '4b') return S.feitos['4b'] ? tr('Estimativa vista') : '';
  if (id === '4c') return S.feitos['4c'] ? tr('Recomendações vistas') : '';
  const cs = camposPasso(id).filter(f => !f.opcional);
  return tr(cs.filter(qOk).length + ' de ' + cs.length + ' respondidas');
}
// Rótulo traduzido da resposta 2.0 ("Prova de conceito + Piloto")
function rotTestes() { const L = listaOpc(CAMPO_POR_ID.testes); return testesDe().map(k => tr(rotulo(L, k))).join(' + '); }
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
    : `<span class="muted">${esc(n ? (n === 1 ? tr('Falta 1 resposta nesta fase. Você pode continuar e voltar depois.') : tr('Faltam ' + n + ' respostas nesta fase. Você pode continuar e voltar depois.')) : tr(naoVistos.includes('4b') ? 'Abra a estimativa de custo para concluir esta fase.' : 'Abra as recomendações para você (4.3) para concluir esta fase.'))}</span>`;
  return `<div class="fase-pe" id="fpe-${f.id}">${msg}${botaoSeguir(f.id, ult, f.id === 'expansao' ? '' : 'ir-fase')}</div>`;
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
    <h2>Do contexto ao plano de contratação, em quatro fases</h2>
    <p>Você descreve a sua rede, o problema e o que quer que a IA faça; planeja a prova de conceito ou o piloto, com ferramentas, internet, dispositivos, formação e suporte; define a primeira etapa da implantação e até onde quer chegar na expansão. No fim, você vê a estimativa de custo e as recomendações para você, e um clique gera o plano de contratação. Os valores são ilustrativos.</p>
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
  const ANEIS = { contexto: [0, 40], piloto: [44, 76], implantacao: [80, 98], expansao: [102, 120] };
  const EST = { ok: ['m-ok', 'concluído'], andamento: ['m-and', 'em andamento'], '': ['m-vazio', 'ainda não iniciado'] };
  let s = `<svg class="mandala" viewBox="-6 -6 312 312" role="img" aria-label="${esc(tr('Mandala: fases, passos e camadas'))}">`;
  FASES.forEach(f => {
    const [r0, r1] = ANEIS[f.id], ps = PASSOS[f.id];
    ps.forEach(([id, nome], i) => {
      const a0 = ang(i, ps.length), a1 = ang(i + 1, ps.length), st = estadoPasso(id), [cls, rot] = EST[st];
      const at = S.vista !== 'plano' && S.fase === f.id && (S.passo === id);
      const [tx, ty] = pt(r0 ? (r0 + r1) / 2 : 24, (a0 + a1) / 2);
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
  const m = modoTeste(c);
  const teste = m ? (m === 'recomendar' ? tr('a recomendar') : rotTestes()) : '—';
  const tec = c.tipoTec ? tr(rotulo(listaOpc(CAMPO_POR_ID.tipoTec), c.tipoTec)) : '—';
  let est = '';
  const fe = faltasEstimativa();
  if (!fe.length) {
    try {
      const n = numerosCusto(), ce = casoAtual();
      const pessoas = Math.max(0, ...(n.av.r.E || []).slice(1)) || +ce.elegiveis || 0;
      est = `<div class="estim"><div class="eyebrow">Estimativa ilustrativa</div>
        <p class="small premissa">${esc(tr('Considera ' + fmtInt(pessoas) + ' pessoas usando a ferramenta na rede (passo 4.1.1).'))}</p>
        <div class="linha"><span>Ano 0 (prova de conceito ou piloto)</span><span class="num">${grande(n.ano0)}</span></div>
        <div class="linha"><span><span>Custo total do ciclo</span> <small>(${esc(tr(n.H + ' anos'))})</small></span><span class="num">${grande(n.total)}</span></div>
        <p class="small muted">Valores ilustrativos. As premissas estão no passo 4.2.</p></div>`;
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
      <p class="small muted leg-m"><span>Verde: concluído. Cor clara: em andamento. Contorno: ainda não iniciado. Centro: fase 1; anéis: fases 2, 3 e 4; anel externo: as sete camadas do custo total.</span> ${botaoInfo('c37', 'm')}</p>${notaInfo('c37', 'm')}
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
  if (S.vista !== 'plano' && S.fase === 'expansao' && PASSOS_VER.includes(S.passo)) S.feitos[S.passo] = true;
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
  // v12: na vista do plano o painel lateral sai e o relatório usa a largura toda (fluxo.css: body.vista-plano)
  document.body.classList.toggle('vista-plano', S.vista === 'plano');
  if (S.vista === 'plano' && typeof montarPlano === 'function') { try { montarPlano(); } catch (e) { console.warn(e); } }
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
  const f = CAMPO_POR_ID[campo], c = S.caso;
  if (campo === 'tarefas') aplicarSugestoes();
  if (campo === 'testes') delete c.teste;   // v11: casoEfetivo deriva "teste" de "testes"
  // 2.3.2 "Sim": a lista de ferramentas começa com tantas linhas quantas a resposta 2.3.1 indica
  if (campo === 'conheceFerramentas' && c.conheceFerramentas === 'sim' && !(c.ferramentas || []).length) {
    const n = ({ '1': 1, '2': 2, '3mais': 3 })[c.nFerramentas] || 1;
    c.ferramentas = Array.from({ length: n }, () => novaFerramenta());
  }
  if (campo === 'formacaoHoras') c.formacaoEstimativa = false;   // horas digitadas pela pessoa
  if (['piloto', 'poc', 'implantacao', 'elegiveis', 'escolasInternet', 'formacaoHoras'].includes(String(campo).split('.')[0])) {
    const p = c.piloto || {}, t = totaisCtx(), el = document.getElementById('pct-rede');
    const v = modoTeste() !== 'poc' && t.escolas && +p.escolas ? Math.min(1, +p.escolas / t.escolas) : 0;
    if (el) { el.hidden = !v; const b = el.querySelector('b'); if (b) b.textContent = pct(v); }
    atualizarLaterais(); return true;
  }
  if ((f && ['texto', 'area'].includes(f.tipo)) || ['tarefaOutra', 'impactoOutro', 'nivelOutro', 'titulo', 'problema', 'resultado'].includes(campo)) { atualizarLaterais(); return true; }
  render(); return true;
}
function novaFerramenta() { return { nome: '', tarefas: [], tipoTec: '', pagamento: '', preco: '' }; }
// Lista de ferramentas (2.3.3): data-ferr="<i>.<campo>" e data-ferr-t="<i>" (tarefas)
function gravarFerramenta(el, final) {
  const c = S.caso, L = c.ferramentas = c.ferramentas || [];
  if (el.dataset.ferrT != null) {
    const t = L[+el.dataset.ferrT]; if (!t) return;
    const s = new Set(t.tarefas || []); el.checked ? s.add(el.value) : s.delete(el.value);
    const ord = c.tarefas || []; t.tarefas = ord.filter(k => s.has(k));
  } else {
    const [i, k] = el.dataset.ferr.split('.'), t = L[+i]; if (!t) return;
    if (k === 'preco') { const v = lerNum(el.value); t.preco = v === '' ? '' : Math.max(0, +v || 0); }
    else t[k] = el.value;
    // ferramenta principal: tecnologia e pagamento são as respostas 2.3.4 e 2.3.5
    if (+i === 0 && (k === 'tipoTec' || k === 'pagamento')) { c[k] = el.value; if (el.value) S.respC[k] = true; else delete S.respC[k]; }
  }
  S.respC.ferramentas = true;
  if (S.exemplo !== 'novo') S.exemplo = 'editado';
  if (S.custo) S.custo.editado = false;
  if (final && el.dataset.ferr && /\.(tipoTec|pagamento)$/.test(el.dataset.ferr) && el.dataset.ferr.startsWith('0.')) { render(); return; }
  atualizarLaterais();
}
function eventoFluxo(e) {
  const el = e.target;
  if (e.type === 'click') {
    const inf = el.closest('[data-info]');
    if (inf) { const id = inf.dataset.infoId || inf.dataset.info; S.info[id] = !S.info[id]; render(); return true; }
    const vz = el.closest('[data-visor]');
    if (vz) {
      // clique na miniatura: o foco volta depois ao botão "Ampliar a figura" da mesma figura
      const b = vz.tagName === 'BUTTON' ? vz : ((vz.closest('.fig-box') || document).querySelector('button[data-visor]'));
      abrirVisor(b); return true;
    }
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
    if (act === 'ferr-add') {
      const L = S.caso.ferramentas = S.caso.ferramentas || []; L.push(novaFerramenta()); S.respC.ferramentas = true; if (S.custo) S.custo.editado = false; render();
      requestAnimationFrame(() => { const i = document.getElementById('fe-' + (L.length - 1) + '-nome'); if (i) i.focus(); });
      return true;
    }
    if (act === 'ferr-rm') {
      const L = S.caso.ferramentas || [], i = +a.dataset.i;
      L.splice(i, 1);
      // a nova primeira ferramenta passa a ser a principal: a tecnologia e o pagamento dela, se informados, viram as respostas 2.3.4 e 2.3.5
      if (i === 0 && L[0]) ['tipoTec', 'pagamento'].forEach(k => { if (L[0][k]) { S.caso[k] = L[0][k]; S.respC[k] = true; } });
      if (S.custo) S.custo.editado = false; render();
      requestAnimationFrame(() => { const b = document.getElementById('ferr-add'); if (b) b.focus(); });
      return true;
    }
    if (act === 'horas-est') {
      S.caso.formacaoHoras = horasEstimativa(); S.caso.formacaoEstimativa = true; delete S.respC.formacaoHoras;
      if (S.custo) S.custo.editado = false; if (S.exemplo !== 'novo') S.exemplo = 'editado'; render();
      requestAnimationFrame(() => { const i = document.getElementById('f-formacaoHoras'); if (i) i.focus({ preventScroll: true }); });
      return true;
    }
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
  if ((e.type === 'change' || e.type === 'input') && el.dataset && (el.dataset.ferr != null || el.dataset.ferrT != null)) {
    if (e.type === 'input' && el.tagName === 'SELECT') return true;
    gravarFerramenta(el, e.type === 'change'); return true;
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
