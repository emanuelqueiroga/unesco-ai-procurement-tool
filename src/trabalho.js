// =====================================================================
// v15 (proposta B): painel de trabalho
//   desktop: índice dos 15 passos à esquerda (recolhível para 56 px), um passo por vez no centro e, à direita,
//   o painel Custo | Plano | Premissas, sempre visível. Celular: o índice vira gaveta ("Passo n de 15") e o custo
//   vira uma barra inferior fixa que abre uma folha. O motor de custos não muda: tudo sai de numerosCusto(),
//   relDados(), relIcebergs(), recomendacoesCaso() e premissasDoCaso().
// =====================================================================

// ----------------------------------------------------------- estado da interface (não vai para o caso salvo)
// O caso exportado e o S do localStorage não mudam de formato: aba do painel e índice recolhido ficam numa chave
// própria deste navegador (sempre em try/catch).
const UI_CHAVE = 'upt_v15b_ui';
const UI = { aba: 'custo', recolhido: false };
try { const o = JSON.parse(localStorage.getItem(UI_CHAVE) || '{}') || {}; if (['custo', 'plano', 'premissas'].includes(o.aba)) UI.aba = o.aba; UI.recolhido = o.recolhido === true; } catch (e) { }
function uiGravar() { try { localStorage.setItem(UI_CHAVE, JSON.stringify(UI)); } catch (e) { } }
let GAVETA = false, FOLHA = false, MENU_ABERTO = false, PREM_ABERTO = false, HIST_ABERTO = false;
// última pergunta tocada (para dizer que resposta mudou o custo), custo anterior, histórico e delta por pergunta
let ULT_Q = null, CUSTO_ANT = null, MUDANCAS = [], QDELTA = {};
let PESADO = { chave: '', d: null, sin: null }, PESADO_T = 0;
const ESTREITO = () => { try { return window.matchMedia('(max-width: 900px)').matches; } catch (e) { return false; } };

// ----------------------------------------------------------- passos em ordem e estado no índice
function passosLista() {
  const L = [];
  FASES.forEach(f => PASSOS[f.id].forEach(([id, nome]) => L.push({ id, nome, fase: f.id, faseN: f.n, faseNome: f.nome, i: L.length + 1 })));
  return L;
}
// 'ok' completo · 'pend' com pendências (a pessoa passou adiante com respostas faltando) · 'andamento' · 'novo' não iniciado
function estadoIndice(id) {
  const st = estadoPasso(id);
  if (st === 'ok') return 'ok';
  if (S.feitos[id] && !PASSOS_VER.includes(id) && faltas(id).length) return 'pend';
  if (st === 'andamento') return 'andamento';
  return 'novo';
}
const EST_TXT = { ok: 'Completo', pend: 'Com pendências', andamento: 'Em andamento', novo: 'Não iniciado' };
const ICO_EST = {
  ok: '<svg class="ic-st" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8" style="fill:var(--ok)"/><path d="M5.2 9.3l2.4 2.4 5-5" fill="none" style="stroke:var(--surface)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  pend: '<svg class="ic-st" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="7.25" fill="none" style="stroke:var(--warn)" stroke-width="1.75"/><path d="M9 5v5" style="stroke:var(--warn)" stroke-width="1.9" stroke-linecap="round"/><circle cx="9" cy="12.8" r="1.1" style="fill:var(--warn)"/></svg>',
  andamento: '<svg class="ic-st" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="7.25" fill="none" style="stroke:var(--brand)" stroke-width="1.75"/><path d="M9 1.75a7.25 7.25 0 0 1 0 14.5z" style="fill:var(--brand)"/></svg>',
  novo: '<svg class="ic-st" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="7.25" fill="none" style="stroke:var(--line-3)" stroke-width="1.5"/></svg>',
};
const ICO_CHEV_B = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>';
const ICO_LISTA_B = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6.5 4.5h8M6.5 9h8M6.5 13.5h8"/><circle cx="3.25" cy="4.5" r=".9" fill="currentColor"/><circle cx="3.25" cy="9" r=".9" fill="currentColor"/><circle cx="3.25" cy="13.5" r=".9" fill="currentColor"/></svg>';
const ICO_X_B = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>';
const ICO_ILUS = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 1.6" aria-hidden="true"><circle cx="6" cy="6" r="4.6"/></svg>';
const seloIlus = (t) => `<span class="selo-il">${ICO_ILUS}<span>${esc(t || 'Ilustrativo')}</span></span>`;
// valor já formatado no idioma (grande(), din()): o tradutor do DOM não mexe nele
const vN = (x, cls) => `<span class="num${cls ? ' ' + cls : ''}" data-notr>${esc(x)}</span>`;
// v15 (B3): o número grande com o símbolo da moeda num <span> próprio (a aparência executiva o mostra menor); o texto não muda
function vNGrande(x) {
  const m = String(x).match(/^([^\d\u2212-]*?[^\d\s\u2212-])(\s?)(?=[\d\u2212-])/);
  if (!m) return vN(x);
  return `<span class="num" data-notr><span class="cm-moeda">${esc(m[1])}</span>${esc(m[2] + String(x).slice(m[0].length))}</span>`;
}

function nPasso(id) { const L = passosLista(); return (L.find(x => x.id === id) || { i: 1 }).i; }

// ----------------------------------------------------------- índice dos passos
function renderIndice() {
  const el = document.getElementById('indice'); if (!el) return;
  if (S.boasVindas !== false || S.vista === 'plano') { el.innerHTML = ''; return; }
  const L = passosLista(), atual = S.passo;
  const est = {}; L.forEach(p => { est[p.id] = estadoIndice(p.id); });
  const nOk = L.filter(p => est[p.id] === 'ok').length, nPend = L.filter(p => est[p.id] === 'pend').length;
  const fAt = FASES.find(f => f.id === S.fase) || FASES[0];
  const itens = FASES.map(f => `<li class="ix-f"><p class="ix-ft" id="ixf-${f.id}"><span>${esc(tr('Fase ' + f.n))}</span> · <span>${esc(f.nome)}</span></p>
    <ol class="ix-ps" aria-labelledby="ixf-${f.id}">${PASSOS[f.id].map(([id, nome]) => {
      const st = est[id], at = id === atual, nf = faltas(id).length;
      const nota = at ? `<span class="ix-nota">${esc(tr(st === 'ok' ? 'Completo · você está aqui' : 'Você está aqui'))}</span>`
        : st === 'pend' ? `<span class="ix-nota pend">${esc(tr(nf === 1 ? '1 pergunta pendente' : nf + ' perguntas pendentes'))}</span>` : '';
      return `<li><button type="button" class="ix-p st-${st}${at ? ' at' : ''}" data-ir="${f.id}:${id}" ${at ? 'aria-current="step"' : ''} title="${esc(numPasso(id) + ' ' + tr(nome) + ' · ' + tr(EST_TXT[st]))}">
        <span class="ix-n">${numPasso(id)}</span><span class="ix-t"><span class="ix-nome">${esc(nome)}</span>${nota}</span>${ICO_EST[st]}<span class="sr">${esc(EST_TXT[st])}</span></button></li>`;
    }).join('')}</ol></li>`).join('');
  const rec = UI.recolhido && !ESTREITO();
  el.classList.toggle('recolhido', rec);
  el.classList.toggle('aberto', GAVETA);
  el.innerHTML = `<div class="ix-in">
    <div class="ix-cab">
      <div class="ix-prog"><b>${esc(tr('Passo ' + nPasso(atual) + ' de ' + L.length))}</b><span>${esc(tr('Fase ' + fAt.n + ' de ' + FASES.length))}</span></div>
      <div class="ix-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${L.length}" aria-valuenow="${nOk}" aria-label="${esc(tr('Passos completos'))}"><i style="width:${(100 * nOk / L.length).toFixed(1)}%"></i></div>
      <p class="ix-res">${esc(tr(nOk === 1 ? '1 completo' : nOk + ' completos'))}${nPend ? ' · ' + esc(tr(nPend === 1 ? '1 com pendências' : nPend + ' com pendências')) : ''}</p>
      <p class="ix-falta" id="ix-falta">${esc(textoFaltaTotal())}</p>
      <button type="button" class="ix-rec" data-act="indice-recolher" aria-expanded="${!rec}" aria-controls="ix-lista" aria-label="${esc(tr(rec ? 'Mostrar o índice dos passos' : 'Recolher o índice dos passos'))}">${ICO_CHEV_B}</button>
      <button type="button" class="ix-fechar" data-act="gaveta-fechar" aria-label="${esc(tr('Fechar o índice'))}">${ICO_X_B}</button>
    </div>
    <ol class="ix-fases" id="ix-lista">${itens}</ol>
    <div class="ix-pe"><ul class="ix-leg">${['ok', 'pend', 'andamento', 'novo'].map(k => `<li>${ICO_EST[k]}<span>${esc(EST_TXT[k])}</span></li>`).join('')}</ul>
      <p class="ix-salvo"><span aria-hidden="true">✓</span> <span>Salvo neste navegador</span></p></div></div>`;
}

// ----------------------------------------------------------- passo atual (centro)
function botaoSeguir(fid, id) { return rodapeNav(fid, id, true); }
// Navegação do passo: ← passo anterior e o próximo passo (uma ação primária). Com respostas sugeridas ainda não confirmadas,
// "Confirmar e continuar"; com respostas faltando, "Continuar" leva adiante e o passo fica com pendências no índice.
function rodapeNav(fid, id, soPri) {
  const L = passosLista(), i = L.findIndex(x => x.id === id), ant = L[i - 1], prox = L[i + 1];
  const fs = PASSOS_VER.includes(id) ? [] : faltas(id), pend = fs.filter(f => !qOk(f, true));
  let pri;
  if (!prox) pri = `<button type="button" class="btn pri nav-seg" data-act="gerar-plano"><span>Ver plano</span> <span aria-hidden="true">→</span></button>`;
  else {
    // v15 (B3): nada é aceito sem a pessoa pedir; "Continuar" sempre avança (as sugestões se aceitam no aviso do passo)
    const act = !fs.length ? 'continuar' : 'continuar-forcar';
    const rot = tr('Continuar para ' + numPasso(prox.id));
    pri = `<button type="button" class="btn pri nav-seg" data-act="${act}" data-de="${id}"><span>${esc(rot)}</span> <span class="nav-nome">${esc(prox.nome)}</span> <span aria-hidden="true">→</span></button>`;
  }
  if (soPri) return pri;
  const volta = ant ? `<button type="button" class="btn nav-ant" data-ir="${ant.fase}:${ant.id}"><span aria-hidden="true">←</span> <span>${esc(tr('Voltar para ' + numPasso(ant.id)))}</span></button>` : '<span></span>';
  return `<div class="passo-nav">${volta}${pri}</div>`;
}
function rodapePasso(fid, id) {
  const fs = PASSOS_VER.includes(id) ? [] : faltas(id), pend = fs.filter(f => !qOk(f, true));
  let msg = '';
  if (PASSOS_VER.includes(id)) msg = '';
  else if (!fs.length) msg = `<p class="ok-msg">${esc(tr('Passo completo.'))}</p>`;
  else {
    // v15 (B3): o que falta, com um botão para aceitar as sugestões do passo (todas de uma vez, por escolha da pessoa)
    const nS = nSugestoesPasso(id), L = passosLista(), prox = L[L.findIndex(x => x.id === id) + 1];
    const aceitar = !nS ? '' : !pend.length && prox ? `<button type="button" class="btn" data-act="continuar-confirmar" data-de="${id}">${esc(tr('Aceitar as sugestões e continuar'))}</button>`
      : `<button type="button" class="btn" data-act="aceitar-sug" data-de="${id}">${esc(tr(nS === 1 ? 'Aceitar 1 sugestão deste passo' : 'Aceitar as ' + nS + ' sugestões deste passo'))}</button>`;
    msg = `<div class="aviso pe-falta"><b>${esc(textoFaltaPasso(id))}</b>${!pend.length ? ` <span class="pe-msg">${esc(tr(id === '2b' ? 'Revise as respostas sugeridas pelas tarefas.' : 'Revise as respostas sugeridas.'))}</span>` : ''}
    <ul>${fs.map(f => `<li><button type="button" class="link" data-ir="${fid}:${id}:${f.n.replace(/\./g, '-')}"><span class="qn-l">${f.n}</span> <span>${esc(textoCampo(f))}</span></button></li>`).join('')}</ul>
    ${aceitar ? `<div class="pe-acoes">${aceitar}</div>` : ''}
    <p class="small muted">${esc(tr('Você pode continuar e voltar depois.'))}</p></div>`;
  }
  return `<div class="pe" id="pe-${id}">${msg}${rodapeNav(fid, id)}</div>`;
}
function renderCentro() {
  const id = S.passo, fid = S.fase, f = FASES.find(z => z.id === fid) || FASES[0];
  const nome = nomePasso(id), a = PASSO_AJUDA[id] || {}, st = estadoPasso(id);
  const nq = PASSOS_VER.includes(id) ? 0 : camposPasso(id).length;
  const L = passosLista();
  const g = typeof glossarioTexto === 'function' ? glossarioTexto : (x => esc(tr(x)));
  const ex = ['A', 'B', 'C', 'D', 'editado'].includes(S.exemplo);
  return `<button type="button" class="passo-gaveta-b" data-act="gaveta" aria-expanded="${GAVETA}" aria-controls="indice">${ICO_LISTA_B}<span><b>${esc(tr('Passo ' + nPasso(id) + ' de ' + L.length))}</b> · <span>${numPasso(id)}</span> <span>${esc(nome)}</span></span>${ICO_CHEV_B}</button>
    <section class="passo aberto st-${st || 'novo'}" id="passo-${id}" aria-labelledby="passo-h">
      <p class="passo-meta"><span>${esc(tr('Fase ' + f.n + ' de ' + FASES.length))}</span> · <span>${esc(f.nome)}</span>${nq ? ` · <span>${esc(tr(nq === 1 ? '1 pergunta' : nq + ' perguntas'))}</span>` : ''}${ex ? ` · <span class="tag-ex">Exemplo</span>` : ''}</p>
      <div class="passo-tit"><h1 class="passo-h" id="passo-h" tabindex="-1"><span class="passo-n">${numPasso(id)}</span> <span>${esc(nome)}</span></h1>${PASSO_AJUDA[id] ? botaoEx('p:' + id, 'Sobre o passo', 'passo-h', 'ajuda-' + id) : ''}</div>
      ${nq ? `<p class="falta-passo${faltas(id).length ? '' : ' zero'}" id="falta-passo" aria-live="polite">${esc(textoFaltaPasso(id))}</p>` : ''}
      ${a.serve ? `<p class="passo-sub">${g(a.serve)}</p>` : ''}
      <div class="passo-corpo">${corpoPasso(id)}${rodapePasso(fid, id)}</div>
    </section>`;
}
function focoPasso() { const h = document.getElementById('passo-h') || document.getElementById('prem-h'); if (h) try { h.focus({ preventScroll: true }); } catch (e) { } }
// Painel avançado de premissas (calculadora completa de custos_ui.js), numa vista própria no centro
function renderPremAvancado() {
  const id = S.passo;
  return `<section class="prem-av" id="prem-av" aria-labelledby="prem-h">
    <button type="button" class="btn nav-ant" data-act="prem-fechar"><span aria-hidden="true">←</span> <span>${esc(tr('Voltar ao passo ' + numPasso(id)))}</span></button>
    <h1 class="passo-h" id="prem-h" tabindex="-1">Premissas de custo</h1>
    <p class="passo-sub">Preços, quantidades, itens e cenários da estimativa. Os valores são ilustrativos até você substituí-los por cotações e dados locais; cada mudança aparece no painel de custo.</p>
    <div id="custos-box" class="embutido">${typeof renderCustos === 'function' ? renderCustos() : ''}</div></section>`;
}

// ----------------------------------------------------------- números do painel
function numerosSeguros() { try { return numerosCusto(); } catch (e) { console.warn(e); return null; } }
function chaveCfg() { try { return JSON.stringify(cfgAtual()); } catch (e) { return ''; } }
// Compara com o custo anterior e registra a mudança causada pela última resposta (região aria-live do painel)
function medirCusto(n) {
  n = n || numerosSeguros(); if (!n) return null;
  const cur = { total: n.total, ano0: n.ano0, anual: ((n.av.tco || {}).anual || {}).eco || 0 };
  if (CUSTO_ANT && Math.abs(cur.total - CUSTO_ANT.total) >= 0.5) {
    const q = ULT_Q && Date.now() - ULT_Q.quando < 5000 ? ULT_Q : null;
    const m = { delta: cur.total - CUSTO_ANT.total, n: q ? q.n : '', t: q ? q.t : '', id: q ? q.id : '' };
    MUDANCAS.unshift(m); MUDANCAS = MUDANCAS.slice(0, 8);
    if (m.n) QDELTA[m.n] = m.delta;
  }
  CUSTO_ANT = cur;
  return n;
}
function resetMudancas() { CUSTO_ANT = null; MUDANCAS = []; QDELTA = {}; ULT_Q = null; PESADO = { chave: '', d: null, sin: null }; }
const sinalCusto = x => (x < 0 ? '−' : '+') + grande(Math.abs(x));
function textoMudanca(m) {
  return `<span>Última mudança:</span> ${vN(sinalCusto(m.delta), 'cm-dv')} <span class="cm-dq">${m.n ? `<span>${esc(m.n)}</span> <span>${esc(m.t)}</span>` : '<span>Premissas de custo</span>'}</span>`;
}
// Faixa provável, icebergs e direcionadores: a parte cara (simulação, tornado) roda depois, fora do clique
function agendarPesado() {
  clearTimeout(PESADO_T);
  PESADO_T = setTimeout(() => {
    const chave = chaveCfg(); if (!chave || PESADO.chave === chave) return;
    const n = numerosSeguros(); if (!n) return;
    let d = null, sin = null;
    try { d = typeof relDados === 'function' ? relDados(n) : null; } catch (e) { d = null; }
    try { sin = d && typeof relSintese === 'function' ? relSintese(d, [], '') : null; } catch (e) { sin = null; }
    PESADO = { chave, d, sin };
    if (S.boasVindas === false && S.vista !== 'plano') { renderPainel(); renderBarraCel(); }
  }, 260);
}
function pesadoAtual() { return PESADO.chave && PESADO.chave === chaveCfg() ? PESADO : null; }

// ----------------------------------------------------------- painel direito: Custo | Plano | Premissas
const ABAS = [['custo', 'Custo'], ['plano', 'Plano'], ['premissas', 'Premissas']];
function renderPainel() {
  const el = document.getElementById('painel'); if (!el) return;
  if (S.boasVindas !== false || S.vista === 'plano') { el.innerHTML = ''; el.classList.remove('aberto'); return; }
  const n = numerosSeguros();
  const corpo = UI.aba === 'plano' ? abaPlano(n) : UI.aba === 'premissas' ? abaPremissas(n) : abaCusto(n);
  el.classList.toggle('aberto', FOLHA);
  const rolar = (el.querySelector('.pn-corpo') || {}).scrollTop || 0;
  el.innerHTML = `<div class="pn-in">
    <div class="pn-folha-cab"><h2 class="pn-folha-t">Custo do caso</h2><button type="button" class="btn pn-fechar" data-act="folha-fechar">${ICO_X_B}<span>Fechar</span></button></div>
    <div class="pn-tabs" role="tablist" aria-label="${esc(tr('Painel do caso'))}">${ABAS.map(([k, r]) => `<button type="button" role="tab" id="tab-${k}" aria-controls="pn-${k}" aria-selected="${UI.aba === k}" tabindex="${UI.aba === k ? 0 : -1}" data-aba="${k}">${esc(r)}</button>`).join('')}</div>
    <div class="pn-corpo"><section class="pn-sec" role="tabpanel" id="pn-${UI.aba}" aria-labelledby="tab-${UI.aba}" tabindex="0">${corpo}</section></div>
    <div class="sr" aria-live="polite" id="cm-viva">${MUDANCAS[0] ? textoMudanca(MUDANCAS[0]) : ''}</div></div>`;
  const pc = el.querySelector('.pn-corpo'); if (pc && rolar) pc.scrollTop = rolar;
}
function faltasEstimativaHTML() {
  const fe = faltasEstimativa(); if (!fe.length) return '';
  return `<div class="cm-falta"><p><b>${esc(tr(fe.length === 1 ? 'Falta 1 resposta para estimar o seu caso.' : 'Faltam ' + fe.length + ' respostas para estimar o seu caso.'))}</b> <span>Até lá, os números usam premissas padrão.</span></p>
    <ul>${fe.map(f => `<li><button type="button" class="link" data-ir="${irCampo(f)}"><span class="qn-l">${f.n}</span> <span>${esc(textoCampo(f))}</span></button></li>`).join('')}</ul></div>`;
}
function abaCusto(n) {
  if (!n) return '<p class="muted">Não foi possível calcular com as premissas atuais.</p>';
  const tco = n.av.tco || {}, an = tco.anual || {}, H = n.H;
  const P = pesadoAtual(); if (!P) agendarPesado();
  const d = P && P.d, sd = P && P.sin && P.sin.d;
  let faixa = `<p class="cm-faixa-t muted" id="cm-faixa">Calculando a faixa provável…</p>`;
  if (d) {
    const w = Math.max(d.hi - d.lo, d.central * 0.02), a = d.lo - 0.4 * w, b = d.hi + 0.4 * w, pos = v => (100 * (v - a) / (b - a)).toFixed(1);
    faixa = `<div class="cm-faixa" id="cm-faixa" role="img" aria-label="${esc(tr('Faixa provável') + ': ' + grande(d.lo) + ' – ' + grande(d.hi))}"><i style="inset-inline-start:${pos(d.lo)}%;width:${(pos(d.hi) - pos(d.lo))}%"></i><b style="inset-inline-start:${pos(d.central)}%"></b></div>
      <div class="cm-hl"><p class="cm-faixa-t" id="cm-faixa-t"><span>Faixa provável:</span> ${vN(grande(d.lo))} <span>a</span> ${vN(grande(d.hi))} <span class="muted">(8 em 10 cenários)</span></p>${botaoExCusto('faixa', 'cm-faixa-t')}</div>${exCusto('faixa')}`;
  }
  const mud = MUDANCAS[0];
  const hist = MUDANCAS.length > 1 ? `<details class="cm-hist" data-hist ${HIST_ABERTO ? 'open' : ''}><summary>Ver as últimas mudanças</summary><ol>${MUDANCAS.map(m => `<li>${vN(sinalCusto(m.delta))} <span>${m.n ? `<span>${esc(m.n)}</span> <span>${esc(m.t)}</span>` : '<span>Premissas de custo</span>'}</span></li>`).join('')}</ol></details>` : '';
  // custo por fase (icebergs em forma compacta: visível no orçamento × abaixo da linha d'água)
  let fases = '', I = null;
  try {
    I = typeof relIcebergs === 'function' ? relIcebergs({ av: n.av }) : null;
    if (I && I.fases.length) {
      const mx = Math.max(1, ...I.fases.map(f => Math.max(0, f.tAcima) + Math.max(0, f.tAbaixo)));
      fases = `<div class="cm-bloco"><div class="cm-hl"><h3 class="cm-h" id="cm-fases-h">Custo por fase</h3>${botaoExCusto('fases', 'cm-fases-h')}</div>${exCusto('fases')}
        <div class="cm-hl"><p class="cm-leg" id="cm-leg"><span class="cm-sw cm-sw-a"></span><span>${esc(I.acima)}</span> <span class="cm-sw cm-sw-b"></span><span>${esc(I.abaixo)}</span></p>${botaoExCusto('linha', 'cm-leg')}</div>${exCusto('linha')}
        <ul class="cm-fases">${I.fases.map(f => `<li><div class="cm-fl"><span><b>${esc(f.nome)}</b> <span class="muted">· ${esc(f.anosTxt)}</span></span>${vN(grande(f.total), 'cm-fv')}</div>
          <div class="cm-fb" aria-hidden="true"><i class="a" style="width:${(100 * Math.max(0, f.tAcima) / mx).toFixed(1)}%"></i><i class="b" style="width:${(100 * Math.max(0, f.tAbaixo) / mx).toFixed(1)}%"></i></div>
          <p class="cm-fo">${esc(f.ocultoTxt)}</p></li>`).join('')}</ul></div>`;
    }
  } catch (e) { console.warn(e); }
  const dir = sd ? `<div class="cm-bloco" id="cm-dir"><div class="cm-hl"><h3 class="cm-h" id="cm-dir-h">O que mais muda o custo</h3>${botaoExCusto('fatores', 'cm-dir-h')}</div>${exCusto('fatores')}<ol class="cm-dir">${sd.drivers.map(x => `<li><span class="cm-dn">${esc(x.nome)}</span>${vN(x.loTxt + ' / ' + x.hiTxt, 'cm-dr')}<span class="cm-db" aria-hidden="true"><i style="width:${Math.max(4, 100 * x.w).toFixed(1)}%"></i></span></li>`).join('')}</ol>
    <p class="cm-nota muted">Variação do custo total quando cada premissa vai do valor baixo ao alto.</p></div>` : '';
  return `<div class="cm" data-k="custo">
    <div class="cm-topo"><div class="cm-hl"><h2 class="cm-l" id="cm-l">Custo total do ciclo de vida</h2>${botaoExCusto('tco', 'cm-l')}</div>${seloIlus()}</div>${exCusto('tco')}
    <div class="cm-vl"><p class="cm-v" id="cm-tco">${vNGrande(grande(n.total))}</p>${d && n.total > 0 ? `<span class="cm-chip" aria-hidden="true">±${esc(pct(Math.max(n.total - d.lo, d.hi - n.total) / n.total))}</span>` : ''}</div>
    <p class="cm-anos muted">${esc(tr('Ano 0 a Ano ' + H))} · <span>preços do Ano 0, com desconto</span></p>
    ${faixa}
    <dl class="cm-kv"><div><dt><span id="cm-ano0-l">${esc(tr('Ano 0 (teste)'))}</span>${botaoExCusto('ano0', 'cm-ano0-l')}</dt><dd id="cm-ano0">${vN(grande(n.ano0))}</dd></div>
      <div><dt><span id="cm-anual-l">${esc(tr('Por ano em regime (Ano ' + (an.ano != null ? an.ano : H) + ')'))}</span>${botaoExCusto('anual', 'cm-anual-l')}</dt><dd id="cm-anual">${vN(grande(an.eco || 0))}</dd></div></dl>
    ${exCusto('ano0')}${exCusto('anual')}
    ${blocoPorQue(n, I, sd)}
    <div class="cm-mud" id="cm-mud"><div class="cm-hl">${mud ? `<p id="cm-mud-t">${textoMudanca(mud)}</p>` : '<p class="muted" id="cm-mud-t">Cada resposta que muda o custo aparece aqui.</p>'}${botaoExCusto('mud', 'cm-mud-t')}</div>${exCusto('mud')}${hist}</div>
    ${faltasEstimativaHTML()}
    ${fases}${dir}
    <div class="cm-hl"><p class="cm-nota muted" id="cm-ilus-t">Valores ilustrativos. Substitua por cotações e dados locais.</p>${botaoExCusto('ilus', 'cm-ilus-t')}</div>${exCusto('ilus')}</div>`;
}
// Frase de decisão do caso, montada só com as respostas (nada é inventado)
function fraseDecisao() {
  const c = S.caso, m = modoTeste(c), p = c.piloto || {}, po = c.poc || {}, im = c.implantacao || {};
  const nI = x => fmtInt(+x || 0);
  let a = '';
  if (m === 'piloto' && +p.meses > 0 && +p.escolas > 0) a = tr('Fazer um piloto de ' + nI(p.meses) + ' meses em ' + nI(p.escolas) + ' escolas antes de contratar a primeira etapa.');
  else if (m === 'piloto' && +p.meses > 0) a = tr('Fazer um piloto de ' + nI(p.meses) + ' meses antes de contratar a primeira etapa.');
  else if (m === 'poc' && +po.meses > 0) a = tr('Fazer uma prova de conceito de ' + nI(po.meses) + ' meses com ' + nI(po.participantes) + ' pessoas antes de decidir o piloto.');
  else if (m === 'ambos' && +po.meses > 0 && +p.meses > 0) a = tr('Fazer uma prova de conceito de ' + nI(po.meses) + ' meses e, depois, um piloto de ' + nI(p.meses) + ' meses em ' + nI(p.escolas) + ' escolas antes de contratar a primeira etapa.');
  else if (m === 'recomendar') a = tr('Testar antes de comprar: a ferramenta recomenda o tipo de teste no plano.');
  if (!a) return '';
  if (+im.pessoas > 0) a += ' ' + tr('A primeira etapa leva a ferramenta a ' + nI(im.escolas) + ' escolas e ' + nI(im.pessoas) + ' pessoas.');
  return a;
}
function abaPlano(n) {
  const dec = fraseDecisao();
  const tco = n && n.av.tco ? n.av.tco : null;
  return `<div class="pl" data-k="plano">
    <div class="cm-hl"><h2 class="cm-h" id="pl-dec-h">Decisão recomendada</h2>${botaoExCusto('decisao', 'pl-dec-h')}</div>${exCusto('decisao')}
    ${dec ? `<p class="pl-dec" data-notr>${esc(dec)}</p>` : `<p class="muted">Responda o passo 2.0 (prova de conceito ou piloto) e o tamanho do teste no 2.3.8 para ver a decisão.</p>`}
    ${n ? `<h2 class="cm-h">Números</h2><dl class="pl-kv"><div><dt>Custo total do ciclo de vida</dt><dd>${vN(grande(n.total))}</dd></div><div><dt>${esc(tr('Ano 0 (teste)'))}</dt><dd>${vN(grande(n.ano0))}</dd></div>
      ${tco ? `<div><dt>${esc(tr('Por ano em regime (Ano ' + tco.anual.ano + ')'))}</dt><dd>${vN(grande(tco.anual.eco))}</dd></div>` : ''}</dl>${seloIlus('Estimativa ilustrativa')}` : ''}
    <div class="cm-hl"><h2 class="cm-h" id="pl-agora-h">O que fazer agora</h2>${botaoEx('c:agora', 'Sobre esta seção', 'pl-agora-h')}</div>${exCusto('agora')}
    ${listaAgora(5, true)}
    <button type="button" class="btn pl-ver" data-act="gerar-plano">Ver o plano completo</button></div>`;
}
// premissas que cada passo usa (ids de premissasDoCaso: perfil do país e linhas da base de referências)
const PREM_PASSO = {
  '1a': /^(escolas|estudantes|professores|pctUrbano|pctEscolasInternet|salarioProfessor|inflacao|taxaDesconto|idiomas)$/,
  '1c': /^gov\./, '20': /^(saas\.preco|api\.modelo|ow\.gpu)/, '2a': /^(saas\.preco|api\.|rag\.|ow\.)/, '2b': /^(saas\.preco|api\.modelo|ow\.gpu)/,
  '2c': /^(saas\.|api\.(modelo|rerank|implantacao|manutPct)|rag\.|ow\.(gpu|implantacao|manutPct))/, '2d': /^(k1\.|pctEscolasInternet)/,
  '2e': /(^formacao\.|\.formacao\.|^salarioProfessor$|^conv\.horasAno$)/, '2f': /^(v11\.fornecedor|sal\.)/, '3a': /^(k1\.|formacao\.|saas\.preco)/,
  '3b': /^(api\.|ow\.|rag\.|saas\.(implantacao|juridico|manutPct)|sal\.eng|sal\.analista_privacidade)/, '4a': /(^inflacao$|^taxaDesconto$|\.saida\.|^saida\.)/,
};
function abaPremissas(n) {
  let L = [];
  try { L = premissasDoCaso(S.caso, cfgAtual()) || []; } catch (e) { L = []; }
  const rx = PREM_PASSO[S.passo];
  const usadas = rx ? L.filter(p => rx.test(p.campo)) : L;
  const lin = p => `<li><span class="pm-r">${esc(tr(p.rotulo))}</span>${vN(typeof relValorPremissa === 'function' ? relValorPremissa(p) : String(p.valor), 'pm-v')}${p.unidade && !/^%|US\$/.test(p.unidade) ? `<span class="pm-u muted">${esc(tr(p.unidade))}</span>` : ''}${typeof marcadorOrigem === 'function' ? marcadorOrigem(p) : ''}</li>`;
  return `<div class="pm" data-k="premissas">
    <div class="cm-hl"><h2 class="cm-h" id="pm-h">${esc(tr('Premissas que o passo ' + numPasso(S.passo) + ' usa'))}</h2>${botaoEx('c:premissas', 'Sobre esta seção', 'pm-h')}</div>${exCusto('premissas')}
    ${usadas.length ? `<ul class="pm-l">${usadas.slice(0, 14).map(lin).join('')}</ul>${usadas.length > 14 ? `<p class="small muted">${esc(tr('E mais ' + (usadas.length - 14) + ' no painel completo.'))}</p>` : ''}`
      : '<p class="muted">Este passo não usa custos unitários da base de referências. As respostas dele mudam quantidades (pessoas, escolas, meses).</p>'}
    <p class="cm-nota muted">${esc(tr('O custo usa ' + L.length + ' premissas no total. Cada uma mostra de onde veio; valores sem fonte são ilustrativos.'))}</p>
    <button type="button" class="btn" data-act="prem-abrir">Abrir o painel completo de premissas</button></div>`;
}

// ----------------------------------------------------------- celular: barra inferior de custo e gavetas
function renderBarraCel() {
  const el = document.getElementById('barra-cel'); if (!el) return;
  const on = S.boasVindas === false && S.vista !== 'plano';
  el.hidden = !on; document.body.classList.toggle('com-barra', on);
  if (!on) { el.innerHTML = ''; return; }
  const n = numerosSeguros(), m = MUDANCAS[0];
  el.innerHTML = `<button type="button" class="bc-custo" data-act="folha" aria-expanded="${FOLHA}" aria-controls="painel">
      <span class="bc-l1">${n ? vN(grande(n.total), 'bc-v') : ''}${m ? ` ${vN(sinalCusto(m.delta), 'bc-d')}` : ''}</span>
      <span class="bc-l2"><span class="bc-il">Ilustrativo</span> · <span>Ver custo</span> <span aria-hidden="true">▴</span></span></button>
    ${PREM_ABERTO ? '' : botaoCel()}`;
}
// botão curto da barra inferior: a mesma ação do "Continuar" do passo
function botaoCel() {
  const L = passosLista(), i = L.findIndex(x => x.id === S.passo), prox = L[i + 1];
  if (!prox) return `<button type="button" class="btn pri bc-seg" data-act="gerar-plano"><span>Ver plano</span> <span aria-hidden="true">→</span></button>`;
  const fs = PASSOS_VER.includes(S.passo) ? [] : faltas(S.passo), pend = fs.filter(f => !qOk(f, true));
  const act = !fs.length ? 'continuar' : 'continuar-forcar';
  return `<button type="button" class="btn pri bc-seg" data-act="${act}" data-de="${S.passo}" aria-label="${esc(tr('Continuar para ' + numPasso(prox.id)))}"><span>${esc(tr('Continuar'))}</span> <span aria-hidden="true">→</span></button>`;
}
function fecharGavetas() {
  GAVETA = false; FOLHA = false;
  const v = document.getElementById('veu'); if (v) v.hidden = true;
  document.documentElement.classList.remove('gaveta-aberta');
  const i = document.getElementById('indice'), p = document.getElementById('painel');
  if (i) i.classList.remove('aberto'); if (p) p.classList.remove('aberto');
}
function abrirGaveta(qual) {
  fecharGavetas(); fecharMenu();
  if (qual === 'indice') GAVETA = true; else FOLHA = true;
  const v = document.getElementById('veu'); if (v) v.hidden = false;
  document.documentElement.classList.add('gaveta-aberta');
  renderIndice(); renderPainel(); renderBarraCel();
  const alvo = document.getElementById(qual === 'indice' ? 'indice' : 'painel');
  requestAnimationFrame(() => { const b = alvo && alvo.querySelector(qual === 'indice' ? '.ix-p.at' : '[role=tab][aria-selected=true]'); if (b) b.focus(); });
}

// ----------------------------------------------------------- cabeçalho: menu Caso
function nomeCasoAtual() {
  const ex = ['A', 'B', 'C', 'D'].includes(S.exemplo) && CASOS[S.exemplo] ? CASOS[S.exemplo].titulo : '';
  return (S.caso && S.caso.titulo) || (S.ctx && S.ctx.olhando) || (ex ? tr(ex) : '');
}
function renderCabecalho() {
  const el = document.getElementById('caso-m'); if (!el) return;
  const nome = S.boasVindas !== false && SALVO ? (SALVO.nome || '') : nomeCasoAtual();
  const ex = ['A', 'B', 'C', 'D'].includes(S.exemplo) && S.boasVindas === false;
  el.innerHTML = `<button type="button" class="caso-b" id="btn-caso" data-act="menu-caso" aria-haspopup="menu" aria-expanded="${MENU_ABERTO}" aria-controls="menu-caso">
    <span class="caso-r">Caso</span><span class="caso-n"${nome ? ' data-notr' : ''}>${esc(nome || tr('Caso sem nome'))}</span>${ex ? '<span class="tag-ex">Exemplo</span>' : ''}${ICO_CHEV_B}</button>`;
  const bp = document.getElementById('btn-ver-plano'); if (bp) bp.hidden = S.vista === 'plano';
}
const EXEMPLOS_MENU = [['A', 'Exemplo: copiloto para professores'], ['B', 'Exemplo: tutor para estudantes'], ['C', 'Exemplo: alerta precoce de abandono'], ['D', 'Exemplo: assistente administrativo']];
function abrirMenu(botao) {
  const m = document.getElementById('menu-caso'); if (!m) return;
  MENU_ABERTO = true;
  const exp = CAP.downloads ? 'Exportar caso (.json)' : 'Copiar dados do caso';
  m.innerHTML = `<div class="mc-in">
    <p class="mc-t">Caso</p>
    <button type="button" role="menuitem" class="mc-i" data-act="caso-novo">Novo caso em branco</button>
    <button type="button" role="menuitem" class="mc-i" data-act="imp-json">Importar caso…</button>
    <button type="button" role="menuitem" class="mc-i" data-act="exp-json">${esc(exp)}</button>
    <p class="mc-t">Abrir um exemplo</p>
    ${EXEMPLOS_MENU.map(([k, t]) => `<button type="button" role="menuitem" class="mc-i" data-act="caso-exemplo" data-ex="${k}">${esc(t)}</button>`).join('')}
    <p class="mc-t mc-cel">Plano</p>
    <button type="button" role="menuitem" class="mc-i mc-cel" data-act="gerar-plano">Ver plano</button>
    <p class="mc-nota">As respostas ficam salvas só neste navegador.</p></div>`;
  m.hidden = false;
  const b = botao || document.getElementById('btn-caso');
  const r = b ? b.getBoundingClientRect() : { left: 16, bottom: 56, right: 300 };
  const larg = Math.min(320, window.innerWidth - 16);
  const rtl = document.documentElement.dir === 'rtl';
  let x = rtl ? r.right - larg : r.left; x = Math.max(8, Math.min(x, window.innerWidth - larg - 8));
  m.style.left = x + 'px'; m.style.top = (r.bottom + 6) + 'px'; m.style.width = larg + 'px';
  document.querySelectorAll('[data-act="menu-caso"]').forEach(x => x.setAttribute('aria-expanded', 'true'));
  requestAnimationFrame(() => { const i = m.querySelector('.mc-i'); if (i) i.focus(); });
}
function fecharMenu(devolver) {
  const m = document.getElementById('menu-caso'); if (!m || m.hidden) { MENU_ABERTO = false; return; }
  m.hidden = true; MENU_ABERTO = false;
  document.querySelectorAll('[data-act="menu-caso"]').forEach(x => x.setAttribute('aria-expanded', 'false'));
  if (devolver) { const b = document.getElementById(ESTREITO() ? 'btn-menu' : 'btn-caso'); if (b) b.focus(); }
}

// ----------------------------------------------------------- trocar de caso: confirmação nomeada e "Desfazer"
// Qualquer troca de um caso com respostas (novo, exemplo, importar) pede confirmação; depois da troca, o aviso
// oferece "Desfazer" por 10 segundos (o estado anterior fica só na memória da página).
let TROCA = null;
function pedirTroca(destino, aplicar) {
  if (!temRespostas(S)) { trocarCaso(aplicar); return; }
  TROCA = aplicar;
  let d = document.getElementById('dlg-troca');
  if (!d) { d = document.createElement('dialog'); d.id = 'dlg-troca'; d.className = 'dlg-imp dlg-troca'; d.setAttribute('aria-labelledby', 'dlg-troca-t'); document.body.appendChild(d); }
  const nome = nomeCasoAtual() || tr('Caso sem nome');
  d.innerHTML = `<form method="dialog" class="dlg-in">
    <h2 id="dlg-troca-t">${esc(tr('Substituir o caso atual?'))}</h2>
    <p><span>${esc(tr('O caso'))}</span> <b data-notr>“${esc(nome)}”</b> <span>${esc(tr('será substituído por'))}</span> <b data-notr>${esc(tr(destino))}</b>. <span>${esc(tr('As respostas atuais serão apagadas deste navegador.'))}</span></p>
    <p class="small muted">Para guardá-las, exporte o caso antes. Depois de substituir, você ainda pode desfazer por alguns segundos.</p>
    <div class="row dlg-pe"><button type="button" class="btn" data-act="troca-exportar">${esc(CAP.downloads ? tr('Exportar antes') : tr('Copiar os dados antes'))}</button>
      <button type="button" class="btn pri" data-act="troca-ok">${esc(tr('Substituir'))}</button><button type="submit" class="btn" value="cancelar" data-act="troca-nao">${esc(tr('Cancelar'))}</button></div></form>`;
  try { d.showModal(); } catch (e) { d.setAttribute('open', ''); }
  requestAnimationFrame(() => { const b = d.querySelector('[data-act="troca-nao"]'); if (b) b.focus(); });
}
function fecharTroca() { const d = document.getElementById('dlg-troca'); if (d) { try { d.close(); } catch (e) { d.removeAttribute('open'); } } }
function trocarCaso(aplicar) {
  const antes = JSON.stringify(S), salvo = SALVO ? Object.assign({}, SALVO) : null;
  const tinha = temRespostas(S);
  aplicar();
  resetMudancas();
  if (tinha) toastAcao(tr('Caso substituído.'), tr('Desfazer'), () => {
    try { S = JSON.parse(antes); SALVO = salvo; normalizarEstado(); resetMudancas(); render(); toast(tr('Caso anterior restaurado.')); } catch (e) { console.warn(e); }
  });
}
function toastAcao(msg, rot, fn) {
  const t = document.getElementById('toast'); if (!t) return;
  t.innerHTML = `<span>${esc(msg)}</span><button type="button">${esc(rot)}</button>`;
  t.hidden = false;
  const b = t.querySelector('button');
  b.addEventListener('click', () => { t.hidden = true; fn(); });
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 10000);
}

// ----------------------------------------------------------- render
function render() {
  estadoFluxo();
  if (S.vista !== 'plano' && S.fase === 'expansao' && PASSOS_VER.includes(S.passo)) S.feitos[S.passo] = true;
  aplicarPadroes();
  const y = window.scrollY, foco = document.activeElement && document.activeElement.id;
  const modo = S.boasVindas !== false ? 'inicio' : S.vista === 'plano' ? 'plano' : 'trabalho';
  if (modo === 'trabalho') {
    if (!S.fase || !PASSOS[S.fase]) S.fase = 'contexto';
    if (!PASSOS[S.fase].some(p => p[0] === S.passo)) S.passo = PASSOS[S.fase][0][0];
  }
  document.body.dataset.vista = modo;
  document.body.classList.toggle('vista-plano', modo === 'plano');
  document.body.classList.toggle('ix-recolhido', UI.recolhido);
  let corpo;
  if (modo === 'inicio') corpo = boasVindas();
  else if (modo === 'plano') corpo = typeof renderPlano === 'function' ? renderPlano() : `<section class="card" id="plano"><p class="muted">O plano de contratação ainda não está disponível.</p><button type="button" class="btn" data-act="voltar-percurso">Voltar ao caso</button></section>`;
  else corpo = PREM_ABERTO ? renderPremAvancado() : renderCentro();
  $('#main').innerHTML = corpo;
  if (modo === 'trabalho') medirCusto();
  renderIndice(); renderPainel(); renderBarraCel(); renderCabecalho(); aplicarDeltas();
  if (modo === 'plano' && typeof montarPlano === 'function') { try { montarPlano(); } catch (e) { console.warn(e); } }
  if (document.getElementById('cres') && typeof renderCustosResultados === 'function') renderCustosResultados();
  if (foco) { const f = document.getElementById(foco); if (f) try { f.focus({ preventScroll: true }); } catch (e) { } }
  window.scrollTo(0, y);
  if (modo === 'trabalho' && !PREM_ABERTO && typeof atualizarB3 === 'function') atualizarB3();
  salvar();
}
// Depois de uma resposta que não redesenha a tela: índice, painel, barra, marcas das perguntas e rodapé do passo
function atualizarLaterais() {
  aplicarPadroes();
  if (S.boasVindas === false && S.vista !== 'plano') medirCusto();
  renderIndice(); renderPainel(); renderBarraCel(); renderCabecalho(); atualizarFaseViva(); aplicarDeltas();
  salvar();
}
function aplicarDeltas() {
  document.querySelectorAll('.q[data-n] > .q-delta').forEach(p => {
    const n = p.parentElement.dataset.n, d = QDELTA[n];
    if (d == null || Math.abs(d) < 0.5) { p.hidden = true; return; }
    p.hidden = false; p.removeAttribute('aria-hidden');
    p.innerHTML = `<span>Esta resposta mudou o custo total em</span> ${vN(sinalCusto(d), d < 0 ? 'baixa' : 'alta')}`;
  });
}
function atualizarFaseViva() {
  document.querySelectorAll('.q[data-campo]').forEach(q => {
    const f = CAMPO_POR_ID[q.dataset.campo]; if (!f) return;
    const ok = qOk(f), sug = sugerido(f) && !vazio(valorCampo(f));
    q.classList.toggle('ok', ok); q.classList.toggle('sug', sug);
    if (f.sugDe === 'problemas' && ['texto', 'area'].includes(f.tipo)) q.classList.toggle('lacuna', temLac(valorCampo(f)));
    const sr = q.querySelector('.q-sr'); if (sr && sr.dataset.v !== String(ok)) { sr.dataset.v = String(ok); sr.textContent = ok ? tr('respondida') : ''; }
  });
  if (S.vista === 'plano' || S.boasVindas !== false || PREM_ABERTO) return;
  if (typeof atualizarB3 === 'function') atualizarB3();
  const p = document.getElementById('passo-' + S.passo); if (!p) return;
  const st = estadoPasso(S.passo);
  ['st-ok', 'st-andamento', 'st-novo'].forEach(c => p.classList.remove(c)); p.classList.add('st-' + (st || 'novo'));
  const pe = document.getElementById('pe-' + S.passo);
  if (pe) { const novo = rodapePasso(S.fase, S.passo); if (pe.outerHTML !== novo) { const ativo = document.activeElement && pe.contains(document.activeElement); pe.outerHTML = novo; if (ativo) { const b = document.querySelector('#pe-' + S.passo + ' .nav-seg'); if (b) b.focus({ preventScroll: true }); } } }
}

// ----------------------------------------------------------- eventos do painel de trabalho (chamado por eventoFluxo)
function eventoTrabalho(e) {
  const el = e.target;
  if (e.type === 'toggle' && el.dataset && el.dataset.hist != null) { HIST_ABERTO = el.open; return true; }
  if (e.type === 'keydown') {
    if (e.key === 'Escape') {
      if (MENU_ABERTO) { fecharMenu(true); return true; }
      if (GAVETA || FOLHA) { const q = GAVETA ? 'btn-gaveta' : 'folha'; fecharGavetas(); renderBarraCel(); const b = document.querySelector(q === 'folha' ? '.bc-custo' : '.passo-gaveta-b'); if (b) b.focus(); return true; }
    }
    // abas do painel: setas
    const tab = el.closest && el.closest('[role=tab][data-aba]');
    if (tab && ['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) {
      const ks = ABAS.map(a => a[0]), i = ks.indexOf(tab.dataset.aba), rtl = document.documentElement.dir === 'rtl';
      let j = e.key === 'Home' ? 0 : e.key === 'End' ? ks.length - 1 : (i + ((e.key === 'ArrowRight') !== rtl ? 1 : -1) + ks.length) % ks.length;
      UI.aba = ks[j]; uiGravar(); renderPainel(); const nb = document.getElementById('tab-' + ks[j]); if (nb) nb.focus(); e.preventDefault(); return true;
    }
    if (MENU_ABERTO && ['ArrowDown', 'ArrowUp'].includes(e.key)) {
      const its = [...document.querySelectorAll('#menu-caso .mc-i')].filter(x => x.offsetParent !== null), i = its.indexOf(document.activeElement);
      const j = (i + (e.key === 'ArrowDown' ? 1 : -1) + its.length) % its.length; if (its[j]) its[j].focus(); e.preventDefault(); return true;
    }
    return false;
  }
  if (e.type !== 'click') return false;
  if (MENU_ABERTO && !el.closest('#menu-caso') && !el.closest('[data-act="menu-caso"]')) fecharMenu();
  if (el.id === 'veu') { fecharGavetas(); renderBarraCel(); renderIndice(); return true; }
  const ab = el.closest('[data-aba]');
  if (ab) { UI.aba = ab.dataset.aba; uiGravar(); renderPainel(); const nb = document.getElementById('tab-' + UI.aba); if (nb) nb.focus(); return true; }
  const a = el.closest('[data-act]'); if (!a) return false;
  const act = a.dataset.act;
  if (act === 'menu-caso') { if (MENU_ABERTO) fecharMenu(); else abrirMenu(a); return true; }
  if (act === 'caso-novo') { fecharMenu(); pedirTroca('um caso em branco', () => { carregarExemplo('novo'); S.boasVindas = false; abrirFase('contexto', '1a'); }); return true; }
  if (act === 'caso-exemplo') { const k = a.dataset.ex; fecharMenu(); pedirTroca((EXEMPLOS_MENU.find(z => z[0] === k) || ['', ''])[1], () => { carregarExemplo(k); S.boasVindas = false; abrirFase('contexto', '1a'); }); return true; }
  if (act === 'troca-ok') { const f = TROCA; TROCA = null; fecharTroca(); if (f) trocarCaso(f); return true; }
  if (act === 'troca-nao') { TROCA = null; fecharTroca(); return true; }
  if (act === 'troca-exportar') { const t = JSON.stringify(dadosCaso(), null, 1); if (CAP.downloads) baixar(nomeArqCaso(), t); else copiarTexto(JSON.stringify(dadosCaso()), 'Dados do caso copiados.'); return true; }
  if (act === 'indice-recolher') { UI.recolhido = !UI.recolhido; uiGravar(); document.body.classList.toggle('ix-recolhido', UI.recolhido); renderIndice(); const b = document.querySelector('.ix-rec'); if (b) b.focus(); return true; }
  if (act === 'gaveta') { if (GAVETA) { fecharGavetas(); renderIndice(); } else abrirGaveta('indice'); return true; }
  if (act === 'gaveta-fechar') { fecharGavetas(); renderIndice(); renderBarraCel(); const b = document.querySelector('.passo-gaveta-b'); if (b) b.focus(); return true; }
  if (act === 'folha') { if (FOLHA) { fecharGavetas(); renderPainel(); renderBarraCel(); } else abrirGaveta('painel'); return true; }
  if (act === 'folha-fechar') { fecharGavetas(); renderPainel(); renderBarraCel(); const b = document.querySelector('.bc-custo'); if (b) b.focus(); return true; }
  if (act === 'prem-abrir') { fecharGavetas(); PREM_ABERTO = true; render(); window.scrollTo({ top: 0, behavior: 'instant' }); focoPasso(); return true; }
  if (act === 'prem-fechar') { PREM_ABERTO = false; render(); window.scrollTo({ top: 0, behavior: 'instant' }); focoPasso(); return true; }
  if (act === 'ir-trabalho') { e.preventDefault(); if (S.boasVindas === false) { PREM_ABERTO = false; abrirFase(S.fase || 'contexto', S.passo); } else window.scrollTo({ top: 0 }); return true; }
  return false;
}
// a última pergunta tocada (para o delta "esta resposta mudou o custo")
function marcarPerguntaTocada(e) {
  const t = e.target; if (!t || !t.closest) return;
  const q = t.closest('.q[data-n]');
  if (q) { ULT_Q = { n: q.dataset.n, id: q.dataset.campo || '', t: ((q.querySelector('.qt') || q.querySelector('.q-t') || {}).textContent || '').trim(), quando: Date.now() }; return; }
  if (t.closest('#prem-av, #custos-box')) ULT_Q = { n: '', id: '', t: '', quando: Date.now() };
}
if (typeof document !== 'undefined') {
  ['change', 'input', 'click'].forEach(tp => document.addEventListener(tp, marcarPerguntaTocada, true));
  document.addEventListener('keydown', e => { try { eventoTrabalho(e); } catch (x) { console.warn(x); } });
  window.addEventListener('resize', () => { if (!ESTREITO() && (GAVETA || FOLHA)) { fecharGavetas(); renderIndice(); renderPainel(); } });
}
