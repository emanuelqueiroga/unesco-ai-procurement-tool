// =====================================================================
// v15 · Direção A: assistente guiado ("Uma pergunta por vez")
// O percurso deixa de ser uma página rolável: cada tela mostra uma pergunta do registro CAMPOS (fluxo_dados.js),
// ou um grupo que não se separa (etapas e grade de escolas × estudantes, internet e escolas com internet…), na
// ordem dos 15 passos e com as mesmas condições de visibilidade (visivel, camposPasso). Os controles, os
// eventos e as sugestões são os de fluxo.js e app.js; o motor de custos não muda.
// Modo essencial: só as perguntas de ESSENCIAIS; "Detalhar esta fase" acrescenta as demais. Pergunta sem
// resposta usa o padrão ilustrativo que já existe (casoEfetivo / CASO_VAZIO) e aparece marcada.
// Estado da tela (qual pergunta, fases detalhadas) fica neste navegador, fora do caso (UIA_CHAVE): o caso
// salvo e exportado não muda de formato. "Não sei" fica em S.feitos['ns:<id>'] (mesmo objeto de antes).
// =====================================================================

// Perguntas que mais pesam no custo (motor: pessoas, teste, licença, internet, dispositivos, formação,
// suporte, primeira etapa, alcance e horizonte) ou no plano (problema, linha de base). No máximo 20 telas.
const ESSENCIAIS = ['pais', 'etapas', 'prioridades', 'problemas', 'linhaBase',
  'testes', 'tarefas', 'usuarios', 'tipoTec', 'pagamento', 'piloto', 'internet', 'modeloDisp', 'formacaoHoras', 'suporteNivel',
  'implantacao', 'arquitetura',
  'elegiveis', 'expansao', 'horizonte'];
// Grupos que não se separam: a primeira pergunta abre a tela e as demais (quando visíveis) vêm junto
const GRUPOS_A = { etapas: ['grade'], internet: ['escolasInternet'], modeloDisp: ['dispExistem'], conheceFerramentas: ['ferramentas'], curva: ['ondas'] };
const SECUNDARIOS_A = new Set(Object.values(GRUPOS_A).reduce((a, b) => a.concat(b), []));
const MIN_POR_PERGUNTA = 1.3;   // minutos por pergunta, para "cerca de x min restantes"
// 1.1.0 país: não está em CAMPOS (blocoPais, fluxo.js)
const PAIS_A = { id: 'pais', passo: '1a', n: '1.1.0', tipo: 'pais', onde: 'caso', opcional: true, t: 'Em que país fica a rede?',
  h: 'O país define a moeda, a taxa de câmbio e os dados de referência que já vêm preenchidos.' };
const ROT_SUB_A = { escolas: 'escolas', participantes: 'participantes', meses: 'meses', pessoas: 'pessoas' };
const ICO_A = {
  seta: '<svg class="ico as-seta" aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 20 20"><path d="M11.3 4.3 17 10l-5.7 5.7-1.4-1.4 3.3-3.3H3V9h10.2L9.9 5.7l1.4-1.4Z" fill="currentColor"/></svg>',
  volta: '<svg class="ico as-seta" aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 20 20"><path d="M8.7 4.3 3 10l5.7 5.7 1.4-1.4L6.8 11H17V9H6.8l3.3-3.3-1.4-1.4Z" fill="currentColor"/></svg>',
  lista: '<svg class="ico" aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  ok: '<svg class="ico" aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sobe: '<svg class="ico as-chev" aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  pdf: '<svg class="ico" aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  x: '<svg class="ico" aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};

// ----------------------------------------------------------- estado da tela (fora do caso)
const UIA_CHAVE = 'upt_v15a_ui';
let UIA = null;
function uiA() {
  if (UIA) return UIA;
  UIA = { tela: '', detalhar: {}, ultimo: null, delta: null, gaveta: false, desenhada: null, sync: '' };
  try {
    const o = JSON.parse(localStorage.getItem(UIA_CHAVE) || 'null');
    if (o && typeof o === 'object') {
      if (typeof o.tela === 'string') UIA.tela = o.tela;
      if (o.detalhar && typeof o.detalhar === 'object') Object.keys(o.detalhar).forEach(k => { if (PASSOS[k]) UIA.detalhar[k] = !!o.detalhar[k]; });
    }
  } catch (e) { }
  return UIA;
}
function uiGravar() { try { localStorage.setItem(UIA_CHAVE, JSON.stringify({ tela: uiA().tela, detalhar: uiA().detalhar })); } catch (e) { } }
// caso novo, exemplo ou importação: volta à primeira tela, no modo essencial
function resetAssistente() { const u = uiA(); u.tela = ''; u.detalhar = {}; u.ultimo = null; u.delta = null; u.gaveta = false; u.sync = ''; uiGravar(); }
const naoSeiA = id => !!((S.feitos || {})['ns:' + id]);

// ----------------------------------------------------------- telas
function camposTelaPasso(pid) {
  const L = camposPasso(pid).filter(f => !SECUNDARIOS_A.has(f.id));
  return pid === '1a' && typeof blocoPais === 'function' ? [PAIS_A].concat(L) : L;
}
function grupoA(f) { return (GRUPOS_A[f.id] || []).map(id => CAMPO_POR_ID[id]).filter(g => g && visivel(g)); }
const essencialA = f => ESSENCIAIS.includes(f.id);
// Todas as telas na ordem do percurso; com essencial, só as essenciais (mais as das fases detalhadas)
function telasA(todas) {
  const u = uiA(), L = [];
  FASES.forEach(F => {
    const det = todas || !!u.detalhar[F.id];
    PASSOS[F.id].forEach(([pid]) => {
      if (pid === '4b' || pid === '4c') { if (det) L.push({ k: pid === '4b' ? 'est' : 'rec', tipo: pid === '4b' ? 'est' : 'rec', fase: F.id, passo: pid }); return; }
      camposTelaPasso(pid).forEach(f => { const ess = essencialA(f); if (ess || det) L.push({ k: 'q:' + f.id, tipo: 'q', fase: F.id, passo: pid, f, ess }); });
    });
    L.push(F.id === 'expansao' ? { k: 'res', tipo: 'res', fase: F.id, passo: '' } : { k: 'fim:' + F.id, tipo: 'fim', fase: F.id, passo: '' });
  });
  return L;
}
const perguntasA = L => L.filter(t => t.tipo === 'q');
function respondidaA(t) {
  if (t.f.tipo === 'pais') return !!(S.caso && S.caso.pais);
  return qOk(t.f) || naoSeiA(t.f.id);
}
function faseDaTelaA(k) {
  if (k === 'est' || k === 'rec' || k === 'res') return 'expansao';
  if (/^fim:/.test(k)) return k.slice(4);
  const id = k.slice(2);
  if (id === 'pais') return 'contexto';
  const f = CAMPO_POR_ID[id];
  return f ? fasePasso(passoDe(f)) : '';
}
function telaAtualA(L) {
  L = L || telasA();
  const u = uiA();
  let t = L.find(x => x.k === u.tela);
  // S.fase / S.passo mudados por outro código (continuar o caso salvo, "Ir à pergunta", testes): a primeira tela do passo
  const ext = u.sync && u.sync !== (S.fase || '') + ':' + (S.passo || '');
  if (ext) {
    const k = PASSOS[S.fase] && PASSOS[S.fase].some(p => p[0] === S.passo) ? primeiraTelaPassoA(S.passo) : '';
    if (k && marcarTelaA(k)) return telasA().find(x => x.k === u.tela);
  }
  if (!t) {
    const fase = PASSOS[S.fase] ? S.fase : 'contexto';
    t = L.find(x => x.passo === S.passo && x.fase === fase) || L.find(x => x.fase === fase) || L[0];
  }
  return t;
}
function primeiraTelaPassoA(pid) {
  if (pid === '4b') return 'est';
  if (pid === '4c') return 'rec';
  const t = telasA(true).find(x => x.passo === pid && x.tipo === 'q');
  const ess = telasA().find(x => x.passo === pid && x.tipo === 'q');
  return (ess || t || {}).k || '';
}
// Abre a tela k; se ela estiver fora do modo essencial, a fase passa a ser detalhada. Sem render (quem chama redesenha).
function marcarTelaA(k) {
  const u = uiA();
  let L = telasA(), t = L.find(x => x.k === k);
  if (!t) { const fase = faseDaTelaA(k); if (fase) { u.detalhar[fase] = true; L = telasA(); t = L.find(x => x.k === k); } }
  if (!t) return false;
  u.tela = t.k; S.fase = t.fase; S.passo = t.passo || PASSOS[t.fase][PASSOS[t.fase].length - 1][0]; u.sync = S.fase + ':' + S.passo;
  S.vista = ''; S.boasVindas = false; uiGravar();
  return true;
}
function irTelaA(k) { if (marcarTelaA(k)) render(); }
// abrirFase (fluxo.js): a pergunta alvo (id, número "1.2.7" ou "1-2-7") ou a primeira tela do passo
function irAlvoA(passo, alvo) {
  let k = '';
  if (alvo) {
    const a = String(alvo);
    if (a === 'pais' || a === '1-1-0' || a === '1.1.0') k = 'q:pais';
    else {
      const f = CAMPO_POR_ID[a] || CAMPOS.find(x => x.n === a || x.n.replace(/\./g, '-') === a.replace(/^q-/, ''));
      if (f) { const cab = Object.keys(GRUPOS_A).find(h => GRUPOS_A[h].includes(f.id)); k = 'q:' + (cab || f.id); }
    }
  }
  // sem alvo: fica na tela atual se ela já é deste passo (continuar o caso salvo)
  if (!k) { const at = telasA().find(x => x.k === uiA().tela); k = at && at.passo === passo ? at.k : primeiraTelaPassoA(passo); }
  if (!k || !marcarTelaA(k)) { uiA().tela = ''; uiA().sync = ''; }
}
function telaMudou() { const u = uiA(); const m = u.desenhada !== u.tela; u.desenhada = u.tela; return m; }
function focarTela() { requestAnimationFrame(() => { const h = document.getElementById('as-h'); if (h) try { h.focus({ preventScroll: true }); } catch (e) { } }); }

// ----------------------------------------------------------- navegação
function confirmarTelaA(t) {
  if (t.tipo !== 'q' || t.f.tipo === 'pais') return;
  [t.f].concat(grupoA(t.f)).forEach(f => { if (sugerido(f) && (f.tipo === 'setup' || f.tipo === 'implant' || !vazio(valorCampo(f)))) confirmarSugestao(f); });
  S.revisar = (S.revisar || []).filter(k => !S.respC[k]);
}
function avancarA() {
  const L = telasA(), t = telaAtualA(L);
  if (t.tipo === 'res') { gerarPlano(); return; }
  confirmarTelaA(t);
  if (t.tipo === 'est') S.feitos['4b'] = true;
  if (t.tipo === 'rec') S.feitos['4c'] = true;
  const L2 = telasA(), i = L2.findIndex(x => x.k === t.k);
  const prox = L2[i + 1];
  if (prox) irTelaA(prox.k); else gerarPlano();
}
function voltarA() {
  const L = telasA(), t = telaAtualA(L), i = L.findIndex(x => x.k === t.k);
  if (i > 0) irTelaA(L[i - 1].k);
}
function detalharA(fase, on) {
  const u = uiA(); u.detalhar[fase] = on; uiGravar();
  if (!on) { render(); return; }
  const L = telasA(), t = L.find(x => x.fase === fase && ((x.tipo === 'q' && !x.ess) || x.tipo === 'est'));
  if (t) irTelaA(t.k); else render();
}
function naoSeiCampoA(id) {
  const f = id === 'pais' ? null : CAMPO_POR_ID[id]; if (!f) return;
  const vz = typeof CASO_VAZIO !== 'undefined' ? CASO_VAZIO[f.id] : '';
  if (f.tipo === 'setup' || f.tipo === 'implant') subcampos(f).forEach(([o, k]) => { delete S.respC[o + '.' + k]; });
  else if (f.onde === 'caso') S.caso[f.id] = clone(vz == null ? '' : vz);
  delete S.respC[f.id];
  S.feitos['ns:' + f.id] = true;
  if (S.custo) S.custo.editado = false;
  if (S.exemplo !== 'novo') S.exemplo = 'editado';
  if (f.id === 'tarefas' && typeof aplicarSugestoes === 'function') aplicarSugestoes();
  avancarA();
}

// ----------------------------------------------------------- textos de estado
function estadoQA(f) {
  if (f.tipo === 'pais') return S.caso.pais ? ['ok', 'Sua resposta'] : ['pad', 'Padrão ilustrativo'];
  if (qOk(f)) return ['ok', 'Sua resposta'];
  if (sugerido(f) && (f.tipo === 'setup' || f.tipo === 'implant' || !vazio(valorCampo(f)))) return ['sug', 'Sugerido: confirme'];
  if (['texto', 'area', 'prior', 'problemas'].includes(f.tipo)) return ['vazio', 'Sem resposta'];
  return ['pad', 'Padrão ilustrativo'];
}
function seloEstadoA(f) {
  const [c, t] = estadoQA(f);
  return `<span class="as-st as-st-${c}" data-as-st="${esc(f.id)}">${c === 'ok' ? ICO_A.ok : ''}<span>${esc(t)}</span></span>`;
}
function resumoRespA(f) {
  const c = S.caso, x = S.ctx || {};
  if (f.tipo === 'pais') { const p = typeof paisDoCaso === 'function' ? paisDoCaso(c) : null; return c.pais === (typeof OUTRO_PAIS !== 'undefined' ? OUTRO_PAIS : '') ? tr('Outro país ou não listado') : p ? tr(p.nome) : ''; }
  const v = valorCampo(f), L = listaOpc(f);
  switch (f.tipo) {
    case 'etapas': { const t = totaisCtx(); return t.n ? etapasAtivas().map(e => tr(e[1])).join('; ') + (t.alunos ? ' · ' + tr(fmtInt(t.escolas) + ' escolas') + ' · ' + tr(fmtInt(t.alunos) + ' estudantes') : '') : ''; }
    case 'prior': return (x.prioridades || []).map(id => tr(((typeof PRIORIDADES !== 'undefined' ? PRIORIDADES : []).find(p => p.id === id) || {}).nome || id)).join('; ');
    case 'problemas': { const n = (typeof problemasMarcados === 'function' ? problemasMarcados(x).length : 0) + (String(x.problemaOutro || '').trim() ? 1 : 0); return n ? tr(n === 1 ? '1 problema marcado' : n + ' problemas marcados') : ''; }
    case 'testes': return rotTestes();
    case 'setup': case 'implant': return subcampos(f).map(([o, k]) => { const val = (c[o] || {})[k]; return vazio(val) ? '' : fmtInt(val) + ' ' + tr(ROT_SUB_A[k] || k); }).filter(Boolean).join(', ');
    case 'arq': return v ? (v === 'nao_sei' ? tr('Ainda não sei') : tr(rotulo((typeof OPC !== 'undefined' && OPC.arquitetura) || [], v))) : '';
    case 'radio': return v ? tr(rotulo(L, v)) : '';
    case 'chips': case 'multi': return (v || []).map(k => k === 'outra' && c.tarefaOutra ? c.tarefaOutra : tr(rotulo(L, k) || k)).join('; ');
    case 'num': case 'horas': return +v > 0 ? fmtInt(v) : '';
    case 'seg': return v ? tr(rotulo(RESP_G, v)) : '';
    case 'texto': case 'area': return String(v || '').slice(0, 140);
    case 'ferramentas': return (c.ferramentas || []).map(t => t.nome).filter(Boolean).join('; ');
    default: return '';
  }
}
// Respostas que a estimativa exige (2.1.1, 2.3.4, 4.1.1); uma sugestão ainda não confirmada já conta para o medidor
function faltasEstA() { return ['tarefas', 'tipoTec', 'elegiveis'].map(k => CAMPO_POR_ID[k]).filter(f => f && !qOk(f, true)); }
const minutosA = n => Math.max(1, Math.round(n * MIN_POR_PERGUNTA));

// ----------------------------------------------------------- barra de progresso
function htmlProgA(L, t) {
  const fi = Math.max(0, FASES.findIndex(F => F.id === t.fase)), F = FASES[fi];
  const Q = perguntasA(L), iq = Q.indexOf(t), N = Q.length, nOk = Q.filter(respondidaA).length;
  const resto = Q.filter((x, i) => (iq < 0 ? true : i >= iq) && !respondidaA(x)).length;
  const u = uiA(), nDet = FASES.filter(f => u.detalhar[f.id]).length;
  const modo = nDet === FASES.length ? 'Todas as perguntas' : u.detalhar[F.id] ? 'Fase detalhada' : 'Modo essencial';
  const conta = t.tipo === 'q' ? tr('Pergunta ' + (iq + 1) + ' de ' + N) : tr(nOk + ' de ' + N + ' perguntas');
  const tempo = resto ? tr('cerca de ' + minutosA(resto) + ' min restantes') : '';
  const fimF = t.tipo === 'fim' || t.tipo === 'res';
  const barras = FASES.map(f => {
    const qs = Q.filter(x => x.fase === f.id);
    return `<span class="as-pb-f" style="flex:${Math.max(1, qs.length)}">${qs.map(x => `<i class="${respondidaA(x) ? 'on' : ''}${x === t ? ' at' : ''}"></i>`).join('')}</span>`;
  }).join('');
  return `<nav class="as-prog" id="as-prog" aria-label="${esc(tr('Progresso'))}">
    <div class="as-prog-l"><p class="as-pf"><b>${esc(tr('Fase ' + F.n + ' de ' + FASES.length))}</b>${fimF && t.tipo === 'fim' ? ` <span>${esc(tr('concluída'))}</span>` : ''} <span class="as-pf-n">· <span>${esc(F.nome)}</span></span></p>
      <p class="as-pq"><b>${esc(conta)}</b>${tempo ? ` <span class="as-pt">· ${esc(tempo)}</span>` : ''}</p></div>
    <div class="as-prog-r"><span class="as-modo">${esc(tr(modo))}</span>
      <button type="button" class="btn as-ir" data-as="indice" aria-haspopup="dialog">${ICO_A.lista}<span>Ir para…</span></button></div>
    <div class="as-pb" role="progressbar" aria-valuemin="0" aria-valuemax="${N}" aria-valuenow="${nOk}" aria-label="${esc(tr(nOk + ' de ' + N + ' perguntas respondidas'))}">${barras}</div>
  </nav>`;
}

// ----------------------------------------------------------- tela de pergunta
function ajudaQA(f, h) {
  const a = PASSO_AJUDA[f.passo] || {}, R = AJUDA_ROT, g = typeof glossarioTexto === 'function' ? glossarioTexto : (s => esc(tr(s)));
  const { ex } = f.tipo === 'pais' ? {} : textosQ(f);
  const partes = [];
  if (f.dica && h) partes.push(`<p>${g(f.dica)}</p>`);
  if (a.importa) partes.push(`<p><b>${esc(tr(R.importa))}.</b> <span>${g(a.importa)}</span></p>`);
  if (a.quem) partes.push(`<p><b>${esc(tr(R.quem))}</b> <span>${esc(tr(a.quem))}</span>.</p>`);
  if (ex) partes.push(`<p class="as-ex">${esc(ex)}</p>`);
  if (!partes.length) return '';
  return `<details class="as-por" data-as-por="${esc(f.id)}"><summary>Por que perguntamos?</summary><div class="as-por-in">${partes.join('')}</div></details>`;
}
function nsA(f) {
  if (!['radio', 'chips', 'multi', 'num', 'setup', 'implant'].includes(f.tipo)) return '';
  const on = naoSeiA(f.id) && !qOk(f);
  const vz = typeof CASO_VAZIO !== 'undefined' ? CASO_VAZIO[f.id] : '';
  const pad = f.tipo === 'radio' && f.padrao && !vazio(vz) ? rotulo(listaOpc(f), vz) : '';
  return `<button type="button" class="as-ns${on ? ' on' : ''}" data-as-ns="${esc(f.id)}" aria-pressed="${on}"><span class="as-ns-i" aria-hidden="true"></span><span class="as-ns-t"><b>Não sei: usar valor ilustrativo</b>
    <small>${pad ? `<span>${esc(tr('Consideramos:'))}</span> <span>${esc(tr(pad))}</span>. <span>Você pode trocar depois.</span>` : '<span>A estimativa usa o valor ilustrativo da ferramenta. Você pode responder depois.</span>'}</small></span></button>`;
}
function htmlQA(f, nivel) {
  const prim = nivel === 1, H = prim ? 'h1' : 'h2';
  const cab = `${prim ? 'id="as-h" tabindex="-1"' : ''} class="as-h${prim ? '' : ' as-h2'}"`;
  if (f.tipo === 'pais') {
    return `<div class="as-q as-pais"><${H} ${cab}><span>${esc(f.t)}</span> <span class="tag opc">opcional</span></${H}>
      <p class="as-linha">${esc(f.h)}</p>${ajudaQA(f, '')}${blocoPais()}</div>`;
  }
  const { t, h } = textosQ(f);
  const linha = h ? esc(h) : f.dica ? glossarioTexto(f.dica) : '';
  const lab = ['texto', 'area', 'num', 'horas'].includes(f.tipo);
  const tit = lab ? `<label for="f-${f.id}" id="qt-${f.id}" class="q-t"><span class="qt">${esc(t)}</span></label>` : `<span id="qt-${f.id}" class="q-t"><span class="qt">${esc(t)}</span></span>`;
  const ok = qOk(f), sug = sugerido(f) && (f.tipo === 'setup' || f.tipo === 'implant' || !vazio(valorCampo(f)));
  return `<div class="q as-q${ok ? ' ok' : ''}${sug ? ' sug' : ''}" id="${idQ(f.n)}" data-n="${f.n}" data-campo="${f.id}">
    <${H} ${cab}>${tit}${f.opcional ? ' <span class="tag opc">opcional</span>' : ''}</${H}>
    ${linha ? `<p class="as-linha">${linha}</p>` : ''}${ajudaQA(f, h)}
    <div class="as-ctl">${controle(f)}</div>${sug ? notaSugerido(f) : ''}${extraQ(f)}${prim ? nsA(f) : ''}</div>`;
}
function htmlTelaQ(t) {
  const f = t.f, g = grupoA(f);
  const eb = `<div class="as-eb"><p><span class="as-pn">${esc(numPasso(t.passo))}</span> <span>${esc(nomePasso(t.passo))}</span> <span class="as-qn">· ${esc(f.n)}</span>${t.ess ? '' : ` <span class="tag opc">${esc(tr('detalhe'))}</span>`}</p>${seloEstadoA(f)}</div>`;
  return `${eb}${htmlQA(f, 1)}${g.map(x => `<div class="as-grp">${htmlQA(x, 2)}</div>`).join('')}`;
}
function rotuloSeguirA(t, L) {
  if (t.tipo === 'q') {
    const sug = t.f.tipo !== 'pais' && [t.f].concat(grupoA(t.f)).some(f => sugerido(f) && (f.tipo === 'setup' || f.tipo === 'implant' || !vazio(valorCampo(f))));
    return sug ? 'Confirmar e continuar' : 'Continuar';
  }
  if (t.tipo === 'fim') { const F = FASES[FASES.findIndex(x => x.id === t.fase) + 1]; return F ? tr('Continuar para a fase ' + F.n) : 'Continuar'; }
  return 'Continuar';
}
function htmlNavA(t, L) {
  const i = L.findIndex(x => x.k === t.k);
  return `<div class="as-nav" id="as-nav">
    <button type="button" class="btn pri as-seguir" data-as="seguir"><span>${esc(tr(rotuloSeguirA(t, L)))}</span>${ICO_A.seta}</button>
    <button type="button" class="btn as-voltar" data-as="voltar"${i <= 0 ? ' disabled' : ''}>${ICO_A.volta}<span>Voltar</span></button>
    <span class="as-tecla">${esc(tr('ou pressione Enter'))}</span></div>`;
}

// ----------------------------------------------------------- fim de fase
function custoFaseA(fid) {
  if (fid === 'contexto') return `<p class="as-cf-v0">A fase 1 não tem custo próprio: as respostas dela dimensionam as fases seguintes.</p>`;
  const fe = faltasEstA();
  if (fe.length) return `<p class="as-cf-v0">${esc(tr('A estimativa aparece depois destas respostas:'))}</p><ul class="as-falta">${fe.map(f => `<li><button type="button" class="link" data-as-ir="q:${esc(f.id)}"><span class="qn-l">${esc(f.n)}</span> <span>${esc(textoCampo(f))}</span></button></li>`).join('')}</ul>`;
  let n; try { n = numerosCusto(); } catch (e) { return ''; }
  const P = n.av.fases && n.av.fases.porFase[fid]; if (!P || !P.anos.length) return '';
  const anos = P.anos.length === 1 ? tr('Ano ' + P.anos[0]) : tr('Anos ' + P.anos[0] + ' a ' + P.anos[P.anos.length - 1]);
  const cam = CAMADAS.map(([k, nome]) => ({ k, nome, v: (P.porCamada || {})[k] || 0 })).filter(c => c.v >= 0.5).sort((a, b) => b.v - a.v);
  const mx = Math.max(1, ...cam.map(c => c.v));
  return `<p class="as-cf-l">${esc(anos)}</p><p class="as-cf-v"><b class="num">${esc(grande(P.total))}</b> <span class="selo-il">Ilustrativo</span></p>
    <p class="as-cf-s"><span>Pagamento único</span> <b class="num">${esc(grande(P.unico))}</b> · <span>Recorrente</span> <b class="num">${esc(grande(P.recorrente))}</b></p>
    <ul class="as-cam">${cam.map(c => `<li><span class="as-cam-n"><span class="as-cam-k" style="background:var(--d${c.k})" aria-hidden="true"></span><span>${esc(c.nome)}</span></span><span class="as-cam-b" aria-hidden="true"><i style="width:${(100 * c.v / mx).toFixed(1)}%;background:var(--d${c.k})"></i></span><b class="num">${esc(grande(c.v))}</b></li>`).join('')}</ul>`;
}
function htmlChaveA(t) {
  const f = t.f, r = resumoRespA(f), ok = respondidaA(t) && !naoSeiA(f.id);
  return `<li><div class="as-k-t"><span class="as-pn">${esc(f.n)}</span> <span>${esc(f.tipo === 'pais' ? f.t : textoCampo(f))}</span></div>
    <div class="as-k-r">${ok && r ? `<span>${esc(r)}</span>` : seloEstadoA(f)}</div>
    <button type="button" class="link as-k-alt" data-as-ir="${esc(t.k)}" aria-label="${esc(tr('Alterar') + ': ' + (f.tipo === 'pais' ? tr(f.t) : textoCampo(f)))}">Alterar</button></li>`;
}
function htmlIndiceListaA(L) {
  const Q = perguntasA(L), t = telaAtualA(L);
  const est = pid => {
    if (pid === '4b' || pid === '4c') return S.feitos[pid] ? ['ok', 'Visto'] : ['', 'Não visto'];
    const fs = camposTelaPasso(pid).reduce((a, f) => a.concat([f], f.tipo === 'pais' ? [] : grupoA(f)), []);
    const ok = f => f.tipo === 'pais' ? !!S.caso.pais : qOk(f) || naoSeiA(f.id);
    const obr = fs.filter(f => !f.opcional), ess = fs.filter(essencialA);
    if (obr.length && obr.every(ok)) return ['ok', 'Completo'];
    if (ess.length && ess.every(ok)) return ['ess', 'Essenciais respondidas'];
    if (fs.some(ok)) return ['and', 'Em andamento'];
    return ess.length ? ['', 'Não iniciado'] : ['opc', 'Opcional · padrão ilustrativo'];
  };
  return FASES.map(F => {
    const qs = Q.filter(x => x.fase === F.id), nOk = qs.filter(respondidaA).length;
    const feita = qs.length && nOk === qs.length;
    return `<section class="as-ix-f"><h3><span class="as-ix-n${feita ? ' ok' : ''}">${feita ? ICO_A.ok : ''}<span>${F.n}</span></span> <span>${esc(F.nome)}</span> <span class="as-ix-c">${esc(tr(nOk + ' de ' + qs.length))}</span></h3>
      <ol>${PASSOS[F.id].map(([pid, nome]) => { const [c, txt] = est(pid); const at = t.passo === pid;
        return `<li><button type="button" class="as-ix-p${at ? ' at' : ''}" data-as-passo="${pid}"${at ? ' aria-current="step"' : ''}><span class="as-ix-pn">${esc(numPasso(pid))}</span><span class="as-ix-pt">${esc(nome)}</span><span class="as-ix-e as-ix-${c || 'novo'}">${c === 'ok' || c === 'ess' ? ICO_A.ok : ''}<span>${esc(txt)}</span></span></button></li>`; }).join('')}</ol></section>`;
  }).join('') + `<button type="button" class="as-ix-plano" data-act="gerar-plano"><span>Plano de contratação</span> <span class="as-ix-e">Prévia disponível</span></button>`;
}
function htmlFimA(t, L) {
  const fi = FASES.findIndex(x => x.id === t.fase), F = FASES[fi], prox = FASES[fi + 1];
  const todas = telasA(true).filter(x => x.fase === F.id && x.tipo === 'q');
  const ess = todas.filter(x => x.ess), nEss = ess.filter(respondidaA).length, opc = todas.length - ess.length;
  const det = !!uiA().detalhar[F.id];
  const chaves = perguntasA(L).filter(x => x.fase === F.id).slice(0, 12);
  const qProx = prox ? perguntasA(L).filter(x => x.fase === prox.id).length : 0;
  const okTudo = nEss === ess.length;
  return `<div class="as-fim">
    <div class="as-fim-p">
      <p class="as-fim-ok${okTudo ? '' : ' warn'}">${okTudo ? ICO_A.ok : ''}<span>${esc(tr(nEss + ' de ' + ess.length + ' perguntas essenciais respondidas'))}</span></p>
      <h1 class="as-h" id="as-h" tabindex="-1">${esc(tr(okTudo ? 'Fase ' + F.n + ' concluída:' : 'Fim da fase ' + F.n + ':'))} ${esc(tr(F.nome))}</h1>
      <p class="as-linha"><span>Confira as respostas que mais pesam no custo.</span>${prox ? ` <span>${esc(tr('A seguir vem a fase ' + prox.n + ','))} ${esc(tr(prox.nome))}: ${esc(tr(qProx === 1 ? '1 pergunta, cerca de ' + minutosA(1) + ' minutos.' : qProx + ' perguntas, cerca de ' + minutosA(qProx) + ' minutos.'))}</span>` : ''}</p>
      <div class="as-fim-g">
        <section class="as-card"><h2>Respostas-chave desta fase</h2><ul class="as-chaves">${chaves.map(htmlChaveA).join('')}</ul></section>
        <section class="as-card as-cf"><h2>Custo desta fase</h2>${custoFaseA(F.id)}</section>
      </div>
      <div class="as-fim-a">
        <button type="button" class="btn pri as-seguir" data-as="seguir"><span>${esc(tr(rotuloSeguirA(t, L)))}</span>${ICO_A.seta}</button>
        <button type="button" class="btn" data-as="revisar" data-fase="${F.id}">Revisar respostas</button>
        ${!det && opc > 0 ? `<button type="button" class="link as-det" data-as="detalhar" data-fase="${F.id}">${esc(tr('Detalhar esta fase (' + opc + ' perguntas opcionais)'))}</button>`
          : det ? `<button type="button" class="link as-det" data-as="essencial" data-fase="${F.id}">Voltar ao modo essencial nesta fase</button>` : ''}
      </div>
    </div>
    <aside class="as-card as-fim-ix" aria-labelledby="as-fim-ix-t"><h2 id="as-fim-ix-t">${ICO_A.lista}<span>Ir para…</span></h2><p class="as-linha">Escolha uma fase ou um passo para voltar a ele.</p>${htmlIndiceListaA(L)}</aside>
  </div>`;
}

// ----------------------------------------------------------- resultado
function acoesTopA(nMax) {
  let R = [];
  try { R = typeof recomendacoesCaso === 'function' ? recomendacoesCaso() : []; } catch (e) { R = []; }
  return { total: R.length, top: R.slice(0, nMax).map(r => ({ texto: tr(r.texto), quando: tr((QUANDO_REC.find(z => z[0] === r.quando) || ['', r.quando || ''])[1]), quem: typeof relQuem === 'function' ? relQuem(r) : '', prio: r.prioridade })) };
}
function htmlResA(t, L) {
  const Q = perguntasA(L), nOk = Q.filter(respondidaA).length, x = S.ctx || {}, c = S.caso;
  const fe = faltasEstA();
  let n = null, d = null;
  if (!fe.length) { try { n = numerosCusto(); d = relDados(n); } catch (e) { d = null; } }
  const titulo = c.titulo || x.olhando || tr('Seu caso');
    const meta = [x.local || '', d ? tr('Ano 0 a Ano ' + d.H) : ''].filter(Boolean).join(' · ');
  const A = acoesTopA(3);
  let corpo;
  if (!d) {
    corpo = `<section class="as-card"><h2>Faltam respostas para estimar o custo</h2><ul class="as-falta">${fe.map(f => `<li><button type="button" class="link" data-as-ir="q:${esc(f.id)}"><span class="qn-l">${esc(f.n)}</span> <span>${esc(textoCampo(f))}</span></button></li>`).join('')}</ul></section>`;
  } else {
    const w = Math.max(d.hi - d.lo, d.central * 0.02), a = d.lo - 0.5 * w, b = d.hi + 0.5 * w, pos = v => (100 * (v - a) / (b - a)).toFixed(2);
    corpo = `<section class="as-card as-heroi" aria-labelledby="as-tco-l">
      <div class="as-heroi-c"><span class="as-heroi-l" id="as-tco-l">Custo total do ciclo de vida</span><span class="selo-il">Ilustrativo</span></div>
      <p class="as-heroi-v num" data-as-tco>${valorKpiP(grande(d.central))}</p>
      <p class="as-faixa-l"><b>Faixa provável</b> <span>· ${esc(tr('8 em 10 de ' + fmtInt(d.sim.N) + ' simulações'))}</span></p>
      <div class="as-faixa" role="img" aria-label="${esc(tr('Faixa provável') + ': ' + grande(d.lo) + ' – ' + grande(d.hi))}"><i style="inset-inline-start:${pos(d.lo)}%;width:${(pos(d.hi) - pos(d.lo)).toFixed(2)}%"></i><b style="inset-inline-start:${pos(d.central)}%"></b></div>
      <p class="as-faixa-v num"><span>${esc(grande(d.lo))}</span><span>${esc(grande(d.hi))}</span></p>
      <dl class="as-tres">
        <div><dt>${esc(R14(d.apr.k))}</dt><dd class="num">${esc(din(d.apr.v, 2))}</dd></div>
        <div><dt>${esc(tr('Custo do Ano 0 (prova de conceito ou piloto)'))}</dt><dd class="num">${esc(grande(d.ano0))}</dd></div>
        <div><dt>${esc(R14('kRegime', d.anual.ano))}</dt><dd class="num">${esc(grande(d.anual.eco))}</dd></div>
      </dl></section>`;
  }
  const acoes = A.top.length ? `<section class="as-acoes" aria-labelledby="as-ac-t"><div class="as-acoes-c"><h2 id="as-ac-t">${esc(tr('As ' + A.top.length + ' ações principais'))}</h2>${A.total > A.top.length ? `<button type="button" class="link" data-as-ir="rec">${esc(tr('Ver as ' + A.total))}</button>` : ''}</div>
    <ol>${A.top.map((r, i) => `<li><span class="as-ac-n" aria-hidden="true">${i + 1}</span><div><p class="as-ac-t">${esc(r.texto)}</p><p class="as-ac-m">${[r.quando, r.quem].filter(Boolean).map(esc).join(' · ')}</p></div></li>`).join('')}</ol></section>` : '';
  return `<div class="as-res">
    <p class="as-fim-ok${fe.length ? ' warn' : ''}">${fe.length ? '' : ICO_A.ok}<span>${esc(tr((fe.length ? 'Estimativa parcial · ' : 'Estimativa pronta · ') + nOk + ' de ' + Q.length + ' perguntas'))}</span></p>
    <h1 class="as-h" id="as-h" tabindex="-1" data-notr>${esc(titulo)}</h1>
    ${meta ? `<p class="as-linha" data-notr>${esc(meta)}</p>` : ''}
    <div class="as-res-g">${corpo}${acoes}</div>
    <div class="as-res-a">
      <button type="button" class="btn pri" data-act="gerar-plano"><span>Ver plano</span>${ICO_A.seta}</button>
      <button type="button" class="btn" data-act="pdf">${ICO_A.pdf}<span>Baixar PDF</span></button>
    </div>
    <p class="as-res-l"><button type="button" class="link" data-as="voltar">Voltar à última pergunta</button> · <button type="button" class="link" data-as-ir="est">Ver a estimativa detalhada (4.2)</button> · <button type="button" class="link" data-as-ir="rec">Ver as recomendações (4.3)</button></p>
  </div>`;
}
function htmlEstA() {
  return `<div class="as-eb"><p><span class="as-pn">4.2</span> <span>Estimativa de custo</span></p></div><h1 class="as-h" id="as-h" tabindex="-1">Estimativa de custo</h1>
    <p class="as-linha">O custo de todo o ciclo, por fase e por camada. Valores ilustrativos: substitua por cotações e dados locais.</p><div class="as-est passo-corpo">${passo4b()}</div>`;
}
function htmlRecA() {
  return `<div class="as-eb"><p><span class="as-pn">4.3</span> <span>Recomendações para você</span></p></div><h1 class="as-h" id="as-h" tabindex="-1">Recomendações para você</h1>
    <p class="as-linha">As ações para este caso, por prioridade, a partir das suas respostas.</p><div class="as-rec passo-corpo">${passo4c()}</div>`;
}

// ----------------------------------------------------------- tela inteira
function faixaExA() {
  const ex = ['A', 'B', 'C', 'D', 'editado'].includes(S.exemplo);
  if (!ex) return '';
  const tituloEx = ['A', 'B', 'C', 'D'].includes(S.exemplo) && typeof CASOS !== 'undefined' && CASOS[S.exemplo] ? CASOS[S.exemplo].titulo : '';
  return `<div class="as-exf" role="note"><span class="as-exf-e">Exemplo</span> <span>${tituloEx ? esc(tr(tituloEx)) + '. ' : ''}</span><span>Respostas fictícias, para ver como funciona.</span> <button type="button" class="link" data-act="limpar">Começar um caso em branco</button></div>`;
}
function renderAssistente() {
  const t0 = telaAtualA(), L = telasA(), t = L.find(x => x.k === t0.k) || t0, u = uiA();
  u.tela = t.k; S.fase = t.fase; S.passo = t.passo || PASSOS[t.fase][PASSOS[t.fase].length - 1][0]; u.sync = S.fase + ':' + S.passo; uiGravar();
  if (t.tipo === 'est') S.feitos['4b'] = true;
  if (t.tipo === 'rec') S.feitos['4c'] = true;
  if (t.tipo === 'res') { S.feitos['4b'] = true; S.feitos['4c'] = true; }
  // "Não sei" deixa de valer quando a pergunta ganha resposta
  Object.keys(S.feitos || {}).forEach(k => { if (/^ns:/.test(k)) { const f = CAMPO_POR_ID[k.slice(3)]; if (!f || qOk(f)) delete S.feitos[k]; } });
  u.qAtual = t.tipo === 'q' ? t.f : null;
  const corpo = t.tipo === 'q' ? htmlTelaQ(t) : t.tipo === 'fim' ? htmlFimA(t, L) : t.tipo === 'res' ? htmlResA(t, L) : t.tipo === 'est' ? htmlEstA() : htmlRecA();
  return `<div class="as as-t-${t.tipo}" id="assistente" data-tela="${esc(t.k)}">${htmlProgA(L, t)}${faixaExA()}
    <div class="as-tela" id="as-tela">${corpo}</div>${t.tipo === 'q' || t.tipo === 'est' || t.tipo === 'rec' ? htmlNavA(t, L) : ''}</div>`;
}
// Depois de cada resposta (atualizarLaterais): progresso, selos, rótulo do botão e medidor, sem redesenhar a pergunta
function atualizarAssistente() {
  if (!document.body.classList.contains('vista-as')) return;
  const L = telasA(), t = telaAtualA(L);
  const p = document.getElementById('as-prog'); if (p) { const h = htmlProgA(L, t); if (p.outerHTML !== h) p.outerHTML = h; }
  document.querySelectorAll('[data-as-st]').forEach(el => { const f = el.dataset.asSt === 'pais' ? PAIS_A : CAMPO_POR_ID[el.dataset.asSt]; if (f) { const h = seloEstadoA(f); if (el.outerHTML !== h) el.outerHTML = h; } });
  const b = document.querySelector('#as-nav .as-seguir span'); if (b) b.textContent = tr(rotuloSeguirA(t, L));
  document.querySelectorAll('[data-as-ns]').forEach(el => { const f = CAMPO_POR_ID[el.dataset.asNs]; const on = !!f && naoSeiA(f.id) && !qOk(f); el.classList.toggle('on', on); el.setAttribute('aria-pressed', String(on)); });
  renderCustoBarra();
}

// ----------------------------------------------------------- medidor de custo (rodapé fixo e gaveta)
function renderCustoBarra() {
  const el = document.getElementById('as-custo'); if (!el) return;
  const on = S.vista !== 'plano' && S.boasVindas === false && uiA().tela !== 'res';
  el.hidden = !on; document.body.classList.toggle('com-custo', on); document.body.classList.toggle('as-sem-nav', !document.getElementById('as-nav'));
  if (!on) return;
  const u = uiA(), fe = faltasEstA();
  if (fe.length) {
    u.ultimo = null; u.delta = null;
    el.innerHTML = `<div class="as-c-in as-c-falta"><p><b>${esc(tr(fe.length === 1 ? 'Falta 1 resposta para estimar o custo' : 'Faltam ' + fe.length + ' respostas para estimar o custo'))}</b></p>
      <p class="as-c-fl">${fe.map(f => `<button type="button" class="link" data-as-ir="q:${esc(f.id)}"><span class="qn-l">${esc(f.n)}</span> <span>${esc(textoCampo(f))}</span></button>`).join('')}</p></div>`;
    return;
  }
  let n; try { n = numerosCusto(); } catch (e) { el.innerHTML = ''; return; }
  const tot = n.total, a0 = n.ano0;
  if (u.ultimo && (Math.abs(tot - u.ultimo.total) >= 0.5 || Math.abs(a0 - u.ultimo.ano0) >= 0.5)) {
    const q = u.qAtual;
    u.delta = { v: tot - u.ultimo.total, a0: a0 - u.ultimo.ano0, q: q ? q.n + ' ' + tr(q.tipo === 'pais' ? q.t : textoCampo(q)) : '' };
    const live = document.getElementById('as-c-live');
    if (live) live.textContent = tr('Custo total estimado') + ': ' + grande(tot) + ' (' + relSinal(u.delta.v) + ')';
  }
  u.ultimo = { total: tot, ano0: a0 };
  const A = n.av.tco && n.av.tco.anual;
  const D = u.delta;
  const delta = D ? `<span class="as-c-d${D.v < 0 ? ' baixa' : ''}"><span class="as-c-di" aria-hidden="true">${D.v < 0 ? '↓' : '↑'}</span><span><b class="num">${esc(relSinal(D.v))}</b> <span>${esc(tr('no custo total'))}</span>${Math.abs(D.a0) >= 0.5 ? ` · <b class="num">${esc(relSinal(D.a0))}</b> <span>${esc(tr('no Ano 0'))}</span>` : ''}</span><small><span>${esc(tr('com sua última resposta'))}</span>${D.q ? ': ' + esc(D.q) : ''}</small></span>`
    : `<span class="as-c-d as-c-d0"><small>Cada resposta atualiza esta estimativa.</small></span>`;
  const H = n.av.r.H;
  const gav = u.gaveta ? gavetaA(n) : '';
  el.innerHTML = `${gav}<div class="as-c-in">
    <button type="button" class="as-c-b" data-as="gaveta" aria-expanded="${!!u.gaveta}" aria-controls="as-gaveta">
      <span class="as-c-t"><span class="as-c-l">${esc(tr('Custo total estimado · Ano 0 a Ano ' + H))}</span><span class="as-c-lc">Custo total</span>
        <span class="as-c-v"><b class="num" data-as-total>${esc(grande(tot))}</b> <span class="selo-il">Ilustrativo</span></span></span>
      ${delta}
      <span class="as-c-n"><span><small>${esc(tr('Ano 0 (piloto)'))}</small><b class="num">${esc(grande(a0))}</b></span>${A ? `<span><small>${esc(tr('Por ano em regime (Ano ' + A.ano + ')'))}</small><b class="num">${esc(grande(A.eco))}</b></span>` : ''}</span>
      <span class="as-c-mais"><span>${esc(u.gaveta ? tr('Fechar detalhes do custo') : tr('Ver detalhes do custo'))}</span>${ICO_A.sobe}</span>
    </button></div>`;
}
function gavetaA(n) {
  let d = null; try { d = relDados(n); } catch (e) { d = null; }
  const A = n.av.tco && n.av.tco.anual;
  const lin = (l, v, s) => `<div><dt>${esc(l)}</dt><dd class="num">${esc(v)}${s ? ` <small>${esc(s)}</small>` : ''}</dd></div>`;
  return `<div class="as-gaveta" id="as-gaveta" role="region" aria-label="${esc(tr('Detalhes do custo'))}"><dl>
    ${lin(tr('Custo do Ano 0 (prova de conceito ou piloto)'), grande(n.ano0))}
    ${A ? lin(tr('Por ano em regime (Ano ' + A.ano + ')'), grande(A.eco)) : ''}
    ${d ? lin(tr('Faixa provável'), grande(d.lo) + ' – ' + grande(d.hi), tr('8 em 10 cenários')) : ''}
    ${d ? lin(R14(d.apr.k), din(d.apr.v, 2)) : ''}</dl>
    <p class="as-gav-n"><span>Valores ilustrativos. Substitua por cotações e dados locais.</span> <button type="button" class="link" data-as-ir="est">Ver a estimativa detalhada (4.2)</button></p></div>`;
}
function nomeCasoTopo() {
  const el = document.getElementById('caso-nome'); if (!el) return;
  const on = S.boasVindas === false;
  const nome = on ? (S.caso.titulo || (S.ctx || {}).olhando || '') : '';
  const ex = on && ['A', 'B', 'C', 'D', 'editado'].includes(S.exemplo);
  el.innerHTML = on ? `${nome ? `<span class="cnome-t" data-notr>${esc(nome)}</span>` : ''}${ex ? ' <span class="tag cn-ex">Exemplo</span>' : ''} <span class="cn-s">${ICO_A.ok}<span>Salvo neste navegador</span></span>` : '';
}

// ----------------------------------------------------------- índice "Ir para…"
function abrirIndiceA() {
  let d = document.getElementById('as-ind');
  if (!d) {
    d = document.createElement('dialog'); d.id = 'as-ind'; d.className = 'as-ind'; d.setAttribute('aria-labelledby', 'as-ind-t');
    d.addEventListener('click', e => { if (e.target === d) fecharIndiceA(); });
    document.body.appendChild(d);
  }
  const L = telasA(), todas = FASES.every(F => uiA().detalhar[F.id]);
  d.innerHTML = `<div class="as-ind-in"><div class="as-ind-c"><h2 id="as-ind-t">${ICO_A.lista}<span>Ir para…</span></h2>
      <button type="button" class="btn as-ind-x" data-as="fechar-ind">${ICO_A.x}<span>Fechar</span></button></div>
    <p class="as-linha">Escolha uma fase ou um passo para voltar a ele. O número de cada passo não muda.</p>
    <label class="check as-ind-todas"><input type="checkbox" data-as-todas ${todas ? 'checked' : ''}> <span>Mostrar todas as perguntas (não só as essenciais)</span></label>
    ${htmlIndiceListaA(L)}</div>`;
  try { d.showModal(); } catch (e) { d.setAttribute('open', ''); }
  const at = d.querySelector('.as-ix-p.at') || d.querySelector('[data-as="fechar-ind"]'); if (at) at.focus();
}
function fecharIndiceA() { const d = document.getElementById('as-ind'); if (d) { try { d.close(); } catch (e) { d.removeAttribute('open'); } } }

// ----------------------------------------------------------- troca de caso com confirmação (C3)
function casoComRespostas() { return S.boasVindas === false && (S.exemplo === 'editado' || (S.exemplo === 'novo' && temRespostas(S))) || (typeof SALVO !== 'undefined' && !!SALVO); }
let TROCA_PENDENTE = null;
function trocarCaso(fn, alvo) {
  if (!casoComRespostas()) { fn(); return; }
  TROCA_PENDENTE = fn;
  let d = document.getElementById('dlg-troca');
  if (!d) { d = document.createElement('dialog'); d.id = 'dlg-troca'; d.className = 'dlg-imp dlg-troca'; d.setAttribute('aria-labelledby', 'dlg-troca-t'); document.body.appendChild(d); }
  const nome = S.caso.titulo || (S.ctx || {}).olhando || (SALVO && SALVO.nome) || tr('Caso sem nome');
  d.innerHTML = `<div class="dlg-in"><h2 id="dlg-troca-t">${esc(tr('Substituir o caso atual?'))}</h2>
    <p><span>${esc(tr('As respostas de'))}</span> <b data-notr>${esc(nome)}</b> <span>${esc(tr('serão apagadas deste navegador'))}</span>${alvo ? ` <span>${esc(tr('e o caso passa a ser:'))}</span> <b>${esc(tr(alvo))}</b>` : ''}.</p>
    <p class="small muted">Para guardar as respostas, exporte o caso antes.</p>
    <div class="row dlg-pe"><button type="button" class="btn pri" data-act="troca-ok">Substituir o caso</button><button type="button" class="btn" data-act="exp-json">${CAP.downloads ? 'Exportar antes' : 'Copiar os dados antes'}</button><button type="button" class="btn" data-act="troca-nao">Cancelar</button></div></div>`;
  try { d.showModal(); } catch (e) { d.setAttribute('open', ''); }
  const b = d.querySelector('[data-act="troca-nao"]'); if (b) b.focus();
}
function fecharTroca() { const d = document.getElementById('dlg-troca'); if (d) { try { d.close(); } catch (e) { d.removeAttribute('open'); } } }
let DESFAZER = null;
function executarTroca() {
  const fn = TROCA_PENDENTE; TROCA_PENDENTE = null; fecharTroca(); if (!fn) return;
  const antes = JSON.stringify(S), salvo = typeof SALVO !== 'undefined' ? SALVO : null;
  fn();
  DESFAZER = { s: antes, salvo };
  toastAcao(tr('Caso substituído.'), tr('Desfazer'), () => {
    const o = DESFAZER; DESFAZER = null; if (!o) return;
    S = Object.assign(estadoInicial(), JSON.parse(o.s)); normalizarEstado(); SALVO = o.salvo; if (!SALVO) S.boasVindas = false;
    resetAssistente(); render(); toast(tr('Caso anterior restaurado.'));
  });
}
// toast com uma ação (Desfazer), por 10 segundos, com role="status"
function toastAcao(msg, rot, fn) {
  const t = $('#toast'); if (!t) return;
  t.innerHTML = `<span>${esc(msg)}</span> <button type="button" class="link toast-a">${esc(rot)}</button>`; t.hidden = false;
  const b = t.querySelector('button'); if (b) b.onclick = () => { t.hidden = true; fn(); };
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; DESFAZER = null; }, 10000);
}

// ----------------------------------------------------------- eventos
function eventoAssistente(e) {
  const el = e.target;
  if (e.type === 'change' && el && el.dataset && el.dataset.asTodas != null) {
    FASES.forEach(F => { uiA().detalhar[F.id] = el.checked; }); uiGravar(); fecharIndiceA(); render(); return true;
  }
  if (e.type !== 'click' || !el || !el.closest) return false;
  const ns = el.closest('[data-as-ns]'); if (ns) { naoSeiCampoA(ns.dataset.asNs); return true; }
  const ir = el.closest('[data-as-ir]'); if (ir) { fecharIndiceA(); irTelaA(ir.dataset.asIr); return true; }
  const ps = el.closest('[data-as-passo]'); if (ps) { fecharIndiceA(); const k = primeiraTelaPassoA(ps.dataset.asPasso); if (k) irTelaA(k); return true; }
  const a = el.closest('[data-as]'); if (!a) {
    const ac = el.closest('[data-act]'); if (!ac) return false;
    if (ac.dataset.act === 'troca-ok') { executarTroca(); return true; }
    if (ac.dataset.act === 'novo-caso') { trocarCaso(() => { carregarExemplo('novo'); S.boasVindas = false; abrirFase('contexto', '1a'); }, 'Caso em branco'); return true; }
    if (ac.dataset.act === 'troca-nao') { TROCA_PENDENTE = null; fecharTroca(); return true; }
    if (ac.dataset.act === 'gerar-plano') fecharIndiceA();
    return false;
  }
  const act = a.dataset.as;
  if (act === 'seguir') { avancarA(); return true; }
  if (act === 'voltar') { voltarA(); return true; }
  if (act === 'indice') { abrirIndiceA(); return true; }
  if (act === 'fechar-ind') { fecharIndiceA(); return true; }
  if (act === 'detalhar') { detalharA(a.dataset.fase, true); return true; }
  if (act === 'essencial') { detalharA(a.dataset.fase, false); return true; }
  if (act === 'revisar') { const t = telasA().find(x => x.fase === a.dataset.fase && x.tipo === 'q'); if (t) irTelaA(t.k); return true; }
  if (act === 'gaveta') { uiA().gaveta = !uiA().gaveta; renderCustoBarra(); const b = document.querySelector('#as-custo [data-as="gaveta"]'); if (b) b.focus(); return true; }
  return false;
}
// Enter continua; Alt+← volta (fora de áreas de texto, botões e diálogos)
if (typeof document !== 'undefined') document.addEventListener('keydown', e => {
  if (!document.body.classList.contains('vista-as') || document.querySelector('dialog[open]')) return;
  const el = e.target || document.body;
  if (e.key === 'ArrowLeft' && e.altKey && !(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) { e.preventDefault(); voltarA(); return; }
  if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
  const tag = el.tagName;
  if (['TEXTAREA', 'BUTTON', 'A', 'SUMMARY', 'SELECT'].includes(tag)) return;
  if (el !== document.body && !(el.closest && el.closest('#as-tela'))) return;
  e.preventDefault();
  if (tag === 'INPUT' && (el.type === 'text' || el.type === 'number')) el.dispatchEvent(new Event('change', { bubbles: true }));
  avancarA();
});
// menu "Caso": fecha depois de escolher uma ação ou ao clicar fora
if (typeof document !== 'undefined') document.addEventListener('click', e => {
  const m = document.getElementById('menu-caso'); if (!m || !m.open) return;
  if (!m.contains(e.target) || (e.target.closest && e.target.closest('.menu-i'))) m.open = false;
}, true);
// plano: um link para um anexo recolhido (índice, "lista completa no anexo A") abre o anexo antes de rolar
if (typeof document !== 'undefined') document.addEventListener('click', e => {
  const a = e.target && e.target.closest && e.target.closest('a[href^="#plano-"]'); if (!a) return;
  const alvo = document.getElementById(a.getAttribute('href').slice(1)); if (!alvo) return;
  const d = alvo.matches('details') ? alvo : alvo.querySelector(':scope > details.rp-ax') || alvo.closest('details.rp-ax');
  if (d && !d.open) d.open = true;
}, true);
