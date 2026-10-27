// =====================================================================
// v15 (proposta B3): preenchimento para leigos e aparências.
//   1. Três aparências trocáveis (só tokens CSS, src/b3.css): pub (serviço público), exe (financeira executiva) e
//      exp (explicar para leigos, padrão). Seletor "Aparência" no cabeçalho; a escolha fica neste navegador.
//   2. Nada vem preenchido: as respostas começam vazias. Onde o sistema tem uma sugestão, a pergunta mostra
//      "Sugerido: X" e um botão que a aceita com um clique (fluxo.js, renderQ). O motor continua a usar as mesmas
//      premissas de antes; só a tela deixa de mostrar a sugestão como resposta.
//   3. Campos de custo sem resposta mostram o valor ilustrativo que o motor está usando, marcado como tal.
//   4. Enter avança para a próxima pergunta; depois da última resposta do passo, o foco vai para "Próximo passo";
//      contagem do que falta no passo e no total; validação em linha dos números.
// =====================================================================

// ----------------------------------------------------------- 1. aparências
const APAR_CHAVE = 'upt_v15b3_aparencia' + (typeof CANAL_APP !== 'undefined' && CANAL_APP !== 'estavel' && typeof VERSAO_APP !== 'undefined' ? '@' + VERSAO_APP : '');  // 0.0.16: chave própria nas revisões
const APARENCIAS = [['exp', 'Para leigos'], ['pub', 'Serviço público'], ['exe', 'Executiva']];
let APAR = 'exp';
try { const v = localStorage.getItem(APAR_CHAVE); if (APARENCIAS.some(a => a[0] === v)) APAR = v; } catch (e) { }
function aplicarAparencia(v, gravar) {
  APAR = APARENCIAS.some(a => a[0] === v) ? v : 'exp';
  if (typeof document !== 'undefined') document.documentElement.dataset.aparencia = APAR;
  if (gravar) { try { localStorage.setItem(APAR_CHAVE, APAR); } catch (e) { } }
  const s = typeof document !== 'undefined' && document.getElementById('sel-apar'); if (s && s.value !== APAR) s.value = APAR;
}
const ICO_APAR = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 1.75a6.25 6.25 0 1 0 0 12.5c.9 0 1.4-.6 1.4-1.3 0-.9-.8-1.2-.8-2 0-.7.6-1.2 1.3-1.2h1.6c1.6 0 2.75-1.2 2.75-2.8 0-2.9-2.8-5.2-6.25-5.2z"/><circle cx="5" cy="7" r=".9" fill="currentColor"/><circle cx="7.4" cy="4.6" r=".9" fill="currentColor"/><circle cx="10.6" cy="5" r=".9" fill="currentColor"/></svg>';
function montarAparencia() {
  const c = document.querySelector('.top .ctrls'); if (!c || document.getElementById('sel-apar')) return;
  const l = document.createElement('label');
  l.className = 'ctl ctl-apar'; l.setAttribute('for', 'sel-apar');
  l.innerHTML = `${ICO_APAR}<span class="ctl-r">Aparência</span><select id="sel-apar">${APARENCIAS.map(([k, n]) => `<option value="${k}" ${k === APAR ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
  c.insertBefore(l, c.firstChild);
}
if (typeof document !== 'undefined') {
  aplicarAparencia(APAR, false);
  // esc() é definido em app.js, que vem depois no mesmo script: o seletor entra logo depois da carga
  Promise.resolve().then(montarAparencia);
  document.addEventListener('change', e => { if (e.target && e.target.id === 'sel-apar') { e.stopPropagation(); aplicarAparencia(e.target.value, true); } }, true);
}

// ----------------------------------------------------------- 2 e 3. sugestões e valores ilustrativos
// Campos gerados pelas sugestões (fluxo.js, aplicarPadroes): só mostram o valor depois que a pessoa o confirma
const CAMINHOS_GERADOS = /^(elegiveis|formacaoHoras|piloto\.|poc\.|implantacao\.)/;
// Valor que o campo mostra: num campo gerado ainda não confirmado, vazio (o valor do motor aparece como ilustrativo)
function valorVisivel(path, v) {
  if (CAMINHOS_GERADOS.test(path) && !(S.respC || {})[path]) return '';
  return v;
}
// Premissas que o motor está usando agora (casos.js, cfgDoCaso → cfg.v11)
function metaV11() { try { const c = cfgAtual(); return (c && c.v11) || null; } catch (e) { return null; } }
function valorIlustrativo(path) {
  const m = metaV11(); if (!m) return null;
  let P = typeof PREMISSAS_V11 !== 'undefined' ? PREMISSAS_V11 : {};
  try { if (typeof premissasV11 === 'function') P = premissasV11(escoposDe(casoAtual())); } catch (e) { }
  const c = S.caso || {}, pil = c.piloto || {}, pc = c.poc || {};
  const x = (() => {
    switch (path) {
      case 'elegiveis': return m.E;
      case 'piloto.participantes': return m.teste === 'poc' ? null : m.E0;
      case 'piloto.meses': return m.teste === 'ambos' ? (+pil.meses > 0 ? +pil.meses : P.pilotoMeses) : m.teste === 'poc' ? null : m.m0;
      case 'piloto.escolas': return m.teste === 'poc' ? null : (m.escolas || [])[0];
      case 'poc.participantes': return m.teste === 'poc' ? m.E0 : P.pocParticipantes;
      case 'poc.meses': return m.teste === 'poc' ? m.m0 : (+pc.meses > 0 ? +pc.meses : P.pocMeses);
      case 'implantacao.pessoas': return m.implantacao;
      case 'implantacao.escolas': return (m.escolas || [])[1];
      case 'formacaoHoras': return (m.formacao || {}).horas;
      case 'rotacaoFormacao': { const r = (m.formacao || {}).rotacao; return r != null && isFinite(r) ? Math.round(r * 1000) / 10 : (P.rotacaoFormacao || 0.1) * 100; }
      case 'escolasInternet': { const t = typeof totaisCtx === 'function' ? totaisCtx().escolas : 0, fs = (m.internet || {}).fracaoSem; return t > 0 && fs != null ? Math.round(t * (1 - fs)) : null; }
    }
    return null;
  })();
  return x == null || !isFinite(+x) || +x <= 0 && path !== 'rotacaoFormacao' ? null : +x;
}
// Unidade mostrada ao lado do número
const UNID_CAMPO = { elegiveis: 'pessoas', escolasInternet: 'escolas', formacaoHoras: 'horas por pessoa', rotacaoFormacao: '% ao ano',
  'piloto.escolas': 'escolas', 'piloto.participantes': 'pessoas', 'piloto.meses': 'meses', 'poc.participantes': 'pessoas', 'poc.meses': 'meses',
  'implantacao.escolas': 'escolas', 'implantacao.pessoas': 'pessoas' };
// Campo numérico do percurso com unidade e, quando vazio, o valor ilustrativo do motor como marca d'água marcada
// o: { id, path, valor, casas, rotulo, unid }
function campoNumB3(o) {
  const v = valorVisivel(o.path, o.valor);
  const il = vazio(v) ? valorIlustrativo(o.path) : null;
  const unid = o.unid != null ? o.unid : UNID_CAMPO[o.path] || '';
  const desc = il != null ? (o.notaId || `il-${o.id}`) : '';
  const attrs = `data-fn="${o.path}" data-path="${o.path}"${il != null ? ` data-ilus="${o.path}" aria-describedby="${desc}"` : ''}`;
  const campo = nCampoBase({ id: o.id, attrs, valor: v, casas: o.casas || 0, rotulo: o.rotulo, ph: il != null ? fmtEntrada(il, o.casas || (o.path === 'rotacaoFormacao' ? 1 : 0)) : ' ' });
  return `<span class="campo-u${il != null ? ' com-ilus' : ''}">${campo}${unid ? `<span class="unid" aria-hidden="true">${esc(unid)}</span>` : ''}</span>${il != null && !o.notaId ? notaIlus(desc) : ''}`;
}
function nCampoBase(o) {
  if (typeof inputNum === 'function') return inputNum(o);
  return `<span class="campo"><input type="text" inputmode="numeric" data-num="int" autocomplete="off" id="${esc(o.id)}" ${o.attrs || ''} value="${esc(o.valor == null ? '' : o.valor)}" placeholder="${esc(o.ph || ' ')}"></span>`;
}
// Uma marca só para um grupo de campos (tamanho do teste, primeira etapa), quando algum mostra o valor ilustrativo
function notaIlusGrupo(id, paths) { return paths.some(p => vazio(valorVisivel(p, p.split('.').reduce((o, k) => (o || {})[k], S.caso))) && valorIlustrativo(p) != null) ? notaIlus(id) : ''; }
// Marca do valor ilustrativo, com ⓘ que explica de onde ele vem
function notaIlus(id) {
  return `<span class="ilus-nota" id="${id}"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 1.6" aria-hidden="true"><circle cx="6" cy="6" r="4.6"/></svg><span>Valor ilustrativo, usado até você informar</span></span>`;
}
// Texto legível do valor sugerido (cada rótulo num <span>, para o tradutor do DOM)
function valorSugeridoHTML(f) {
  const c = S.caso, sp = s => `<span>${esc(s)}</span>`, n = (x, u) => `<b class="num" data-notr>${esc(fmtInt(+x || 0))}</b> ${sp(u)}`;
  const v = valorCampo(f);
  switch (f.tipo) {
    case 'radio': return `<b>${sp(rotulo(listaOpc(f), v))}</b>`;
    case 'chips': case 'multi': return `<b>${(v || []).map(k => sp(k === 'outra' ? (c.tarefaOutra || 'Outra') : k === 'outro' ? (c.impactoOutro || 'Outro') : rotulo(listaOpc(f), k))).join(', ')}</b>`;
    case 'texto': case 'area': return `<span class="sug-txt" data-notr>${esc(String(v || ''))}</span>`;
    case 'num': return n(v, UNID_CAMPO[f.id] || '');
    case 'horas': return `${n(vazio(v) || !sugerido(f) ? horasEstimativa() : v, 'horas por pessoa')} <span class="muted">(${sp('estimativa ilustrativa')})</span>`;
    case 'setup': case 'implant': return subcampos(f).filter(([o, k]) => !S.respC[o + '.' + k] && !vazio((c[o] || {})[k]))
      .map(([o, k]) => n(c[o][k], UNID_CAMPO[o + '.' + k] || '')).join(' <span aria-hidden="true">·</span> ');
  }
  return sp(String(v == null ? '' : v));
}
// A pergunta tem uma sugestão para aceitar? (horas: a estimativa ilustrativa fica sempre à mão enquanto não há resposta)
function temSugestao(f) {
  if (f.tipo === 'horas') return !S.respC[f.id] && (sugerido(f) || vazio(S.caso[f.id]));
  if (!sugerido(f)) return false;
  if (f.tipo === 'setup' || f.tipo === 'implant') return true;
  return !vazio(valorCampo(f));
}
function caixaSugestao(f) {
  if (!temSugestao(f)) return '';
  const nota = sugerido(f) || f.tipo === 'horas' ? notaSugerido(f) : '';
  return `<div class="sug-box" id="sug-${f.id}"><p class="sug-v"><span class="sug-l">Sugerido:</span> ${valorSugeridoHTML(f)}</p>
    <button type="button" class="btn sug-ok" data-act="aceitar" data-campo="${f.id}" aria-describedby="sug-${f.id}">Aceitar a sugestão</button>${nota}</div>`;
}
function aceitarSugestao(f) {
  if (!f) return;
  if (f.tipo === 'horas' && !sugerido(f)) { S.caso.formacaoHoras = horasEstimativa(); S.caso.formacaoEstimativa = true; }
  confirmarSugestao(f);
  S.revisar = (S.revisar || []).filter(k => k !== f.id);
  if (S.exemplo !== 'novo') S.exemplo = 'editado';
}
function aceitarTodasPasso(id) {
  let n = 0;
  camposPasso(id).forEach(f => { if (temSugestao(f) && f.tipo !== 'horas') { aceitarSugestao(f); n++; } });
  return n;
}
function nSugestoesPasso(id) { return PASSOS_VER.includes(id) ? 0 : camposPasso(id).filter(f => temSugestao(f) && f.tipo !== 'horas').length; }
// Escolha com valor padrão que pesa no custo e ainda sem resposta: o motor usa o padrão, que aparece marcado como ilustrativo
function ilusPadrao(f) {
  if (!f.padrao || !afetaCusto(f) || respondido(f.id) || sugerido(f) || f.onde !== 'caso') return '';
  const v = valorCampo(f); if (vazio(v)) return '';
  const rot = (Array.isArray(v) ? v : [v]).map(k => `<span>${esc(rotulo(listaOpc(f), k))}</span>`).join(', ');
  return `<p class="ilus-nota ilus-padrao" id="il-${f.id}"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 1.6" aria-hidden="true"><circle cx="6" cy="6" r="4.6"/></svg><span>Valor ilustrativo, usado até você informar</span>: <b>${rot}</b></p>`;
}
// Perguntas que afetam o custo (as que refazem as premissas de custo, app.js, e as escolas e estudantes do 1.1)
function afetaCusto(f) { return (typeof CAMPOS_CUSTO !== 'undefined' && CAMPOS_CUSTO.includes(f.id)) || ['etapas', 'grade'].includes(f.id); }
const tagCusto = () => `<span class="tag custo-tag"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M6 3v6M7.6 4.4c-.3-.4-.9-.6-1.6-.6-.9 0-1.5.4-1.5 1.1 0 1.5 3.2.8 3.2 2.3 0 .7-.7 1.1-1.6 1.1-.8 0-1.4-.3-1.7-.8" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg><span>Afeta o custo</span></span>`;

// ----------------------------------------------------------- 4. o que falta, Enter e foco
function faltasTotal() { let n = 0; FASES.forEach(fa => PASSOS[fa.id].forEach(([id]) => { if (!PASSOS_VER.includes(id)) n += faltas(id).length; })); return n; }
function textoFaltaPasso(id) {
  if (PASSOS_VER.includes(id)) return '';
  const n = faltas(id).length;
  return tr(n === 0 ? 'Nenhuma pergunta falta neste passo' : n === 1 ? 'Falta 1 pergunta neste passo' : 'Faltam ' + n + ' perguntas neste passo');
}
function textoFaltaTotal() { const n = faltasTotal(); return tr(n === 0 ? 'Todas as perguntas respondidas' : n === 1 ? 'Falta 1 pergunta no total' : 'Faltam ' + n + ' perguntas no total'); }
// atualiza a contagem e as marcas d'água sem redesenhar a tela (chamado por atualizarFaseViva)
function atualizarB3() {
  const fp = document.getElementById('falta-passo');
  if (fp && S.passo) { const t = textoFaltaPasso(S.passo); if (fp.textContent !== t) fp.textContent = t; fp.classList.toggle('zero', !faltas(S.passo).length); }
  document.querySelectorAll('#main input[data-ilus]').forEach(i => {
    if (i.value) return;
    const v = valorIlustrativo(i.dataset.ilus); if (v == null) return;
    const ph = fmtEntrada(v, i.dataset.ilus === 'rotacaoFormacao' ? 1 : 0); if (i.placeholder !== ph) i.placeholder = ph;
  });
  validarCampos();
  focoDepoisDaResposta();
}
// Validação em linha: diz o que corrigir, sem apagar o que a pessoa digitou
const PRECISA_MAIOR_QUE_ZERO = /^(elegiveis|formacaoHoras|piloto\.|poc\.|implantacao\.|etapas\.[a-z0-9]+\.escolas)/;
function erroCampo(el) {
  const path = el.dataset.path || el.dataset.fn || el.dataset.f || el.dataset.ctxn || '';
  const v = lerNumero(el.value); if (v === '' || !path) return '';
  if (PRECISA_MAIOR_QUE_ZERO.test(path) && +v <= 0) return 'O número precisa ser maior que zero.';
  if ((path === 'rotacaoFormacao' || /^ondas\.\d+\.pct$/.test(path)) && (+v < 0 || +v > 100)) return 'A porcentagem vai de 0 a 100.';
  const rede = typeof totaisCtx === 'function' ? totaisCtx().escolas : 0;
  if (rede > 0 && ['escolasInternet', 'piloto.escolas', 'implantacao.escolas'].includes(path) && +v > rede) return 'O número é maior que o total informado no passo 1.1. Confira os dois.';
  return '';
}
function validarCampos() {
  document.querySelectorAll('#main .passo input[data-num]').forEach(el => {
    const msg = erroCampo(el), id = 'err-' + el.id;
    let p = document.getElementById(id);
    if (!msg) { if (p) p.remove(); if (el.getAttribute('aria-invalid')) { el.removeAttribute('aria-invalid'); el.setAttribute('aria-describedby', (el.getAttribute('aria-describedby') || '').split(' ').filter(x => x && x !== id).join(' ')); if (!el.getAttribute('aria-describedby')) el.removeAttribute('aria-describedby'); } return; }
    if (!p) {
      p = document.createElement('span'); p.className = 'q-erro'; p.id = id; p.setAttribute('role', 'alert');
      const alvo = el.closest('.campo-u') || el.closest('.campo') || el; alvo.insertAdjacentElement('afterend', p);
    }
    if (p.dataset.msg !== msg) { p.dataset.msg = msg; p.textContent = tr(msg); }
    el.setAttribute('aria-invalid', 'true');
    const d = (el.getAttribute('aria-describedby') || '').split(' ').filter(Boolean); if (!d.includes(id)) { d.push(id); el.setAttribute('aria-describedby', d.join(' ')); }
  });
}
// Próximo alvo de foco depois da pergunta q: o primeiro controle da pergunta seguinte, ou o botão do próximo passo
function alvoDepois(q) {
  const qs = [...document.querySelectorAll('#main .passo .q[data-n]')].filter(x => x.offsetParent !== null && !x.closest('details:not([open])'));
  const i = qs.indexOf(q);
  for (let j = i + 1; j < qs.length; j++) if (primeiroControle(qs[j])) return qs[j].id;
  return '';
}
function primeiroControle(q) {
  const sel = q.querySelector('.sug-ok') || q.querySelector('input[type=radio]:checked') ||
    [...q.querySelectorAll('input:not([type=hidden]):not([disabled]), select, textarea, .seg button')].find(x => x.offsetParent !== null);
  return sel || null;
}
function focarAlvo(qid) {
  const q = qid && document.getElementById(qid), c = q && primeiroControle(q);
  const alvo = c || document.querySelector('#main .pe .nav-seg');
  if (!alvo) return;
  try { alvo.focus({ preventScroll: true }); alvo.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { }
}
let ULT_ESCOLHA = null, FALTA_ANT = { passo: '', n: -1 };
if (typeof document !== 'undefined') {
  // Enter num campo ou numa opção de uma pergunta: grava a resposta e vai para a próxima pergunta (na última, "Próximo passo")
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey || e.isComposing || e.defaultPrevented) return;
    const el = e.target; if (!el || !el.closest || !el.closest('#main .passo')) return;
    const q = el.closest('.q[data-n]'); if (!q) return;
    const campo = el.tagName === 'SELECT' || (el.tagName === 'INPUT' && ['text', 'number', 'radio', 'checkbox'].includes(el.type));
    if (!campo) return;
    e.preventDefault();
    if (el.type === 'radio' && !el.checked) el.click();
    const alvo = alvoDepois(q);
    ULT_ESCOLHA = null;
    if (el.blur) el.blur();
    requestAnimationFrame(() => focarAlvo(alvo));
  });
  // escolha feita pelo ponteiro (ou Enter/Espaço num botão de resposta): pode levar o foco ao "Próximo passo"
  let PONTEIRO = 0;
  document.addEventListener('pointerdown', () => { PONTEIRO = Date.now(); }, true);
  document.addEventListener('change', e => {
    const el = e.target; if (!el || !el.closest || !el.closest('#main .passo .q[data-n]')) return;
    if (el.type === 'radio' && Date.now() - PONTEIRO < 1500) ULT_ESCOLHA = { quando: Date.now(), passo: S.passo, q: el.closest('.q[data-n]').id };
  }, true);
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest && e.target.closest('#main .passo .q[data-n] [data-resp]');
    if (b) ULT_ESCOLHA = { quando: Date.now(), passo: S.passo, q: b.closest('.q[data-n]').id };
  }, true);
}
// Depois de uma resposta: se ela completou o passo, o foco vai para "Próximo passo"
function focoDepoisDaResposta() {
  if (!S || S.vista === 'plano' || S.boasVindas !== false || !S.passo || PASSOS_VER.includes(S.passo)) { FALTA_ANT = { passo: '', n: -1 }; return; }
  const n = faltas(S.passo).length, antes = FALTA_ANT.passo === S.passo ? FALTA_ANT.n : -1;
  FALTA_ANT = { passo: S.passo, n };
  const u = ULT_ESCOLHA; ULT_ESCOLHA = null;
  if (!u || u.passo !== S.passo || Date.now() - u.quando > 1500) return;
  // a resposta abriu um campo de detalhe (Sim ou Em parte): o foco fica com a pessoa, que pode detalhar
  if (u.q && document.querySelector('#' + u.q + ' .q-det-in')) return;
  if (antes > 0 && n === 0) requestAnimationFrame(() => {
    const b = document.querySelector('#main .pe .nav-seg');
    if (b) { try { b.focus({ preventScroll: true }); b.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { } }
  });
}
// Ações dos botões novos (chamado por eventoFluxo)
function eventoB3(e) {
  if (e.type !== 'click') return false;
  const a = e.target.closest && e.target.closest('[data-act]'); if (!a) return false;
  const act = a.dataset.act;
  if (act === 'aceitar') {
    const f = CAMPO_POR_ID[a.dataset.campo]; if (!f) return true;
    const q = a.closest('.q'), alvo = q ? alvoDepois(q) : '';
    aceitarSugestao(f); render(); toast(tr('Sugestão aceita.'));
    requestAnimationFrame(() => focarAlvo(alvo));
    return true;
  }
  if (act === 'aceitar-sug') {
    const n = aceitarTodasPasso(a.dataset.de || S.passo); render();
    toast(tr(n === 1 ? 'Sugestão aceita.' : n + ' sugestões aceitas.'));
    requestAnimationFrame(() => { const b = document.querySelector('#main .pe .nav-seg'); if (b) b.focus({ preventScroll: true }); });
    return true;
  }
  return false;
}

// ----------------------------------------------------------- painel: "Por que este valor?" e "O que fazer agora"
// 2 ou 3 fatores em frases simples: a fase que concentra o custo e as premissas que mais o fazem variar (tornado, relSintese)
function blocoPorQue(n, I, sd) {
  const L = [];
  if (I && I.fases && I.fases.length) {
    const tot = I.fases.reduce((s, f) => s + Math.max(0, f.total), 0), f = I.fases.slice().sort((a, b) => b.total - a.total)[0];
    if (tot > 0 && f) L.push(`<li><span>A maior parte do custo vem da fase</span> <b>${esc(f.nome)}</b> ${vN('(' + pct(f.total / tot) + ')')}.</li>`);
  }
  if (sd && sd.drivers) sd.drivers.slice(0, 2).forEach((x, i) => {
    L.push(`<li><b data-notr>${esc(x.nome)}</b> <span>${i === 0 ? 'é o que mais pesa.' : 'vem em seguida.'}</span> <span>Do valor mais baixo ao mais alto da premissa, o custo total muda de</span> ${vN(x.loTxt)} <span>a</span> ${vN(x.hiTxt)}.</li>`);
  });
  if (!L.length) return '';
  return `<div class="cm-bloco cm-porque" id="cm-porque"><div class="cm-hl"><h3 class="cm-h" id="cm-porque-h">Por que este valor?</h3>${botaoExCusto('porque', 'cm-porque-h')}</div>${exCusto('porque')}
    <ul class="cm-pq">${L.join('')}</ul></div>`;
}
// Recomendações existentes, das de prioridade alta para as de prioridade média
function acoesAgora(max) {
  let R = [];
  try { R = typeof recomendacoesCaso === 'function' ? recomendacoesCaso() : []; } catch (e) { R = []; }
  const ord = { alta: 0, media: 1 };
  return R.map((r, i) => ({ r, i })).sort((a, b) => ((ord[a.r.prioridade] ?? 2) - (ord[b.r.prioridade] ?? 2)) || a.i - b.i).slice(0, max || R.length).map(x => x.r);
}
function listaAgora(max, comIr, comDet) {
  const R = acoesAgora(max);
  if (!R.length) return '<p class="muted">As ações aparecem conforme as respostas.</p>';
  return `<ol class="ag-l">${R.map(r => {
    const t = tr(r.texto), mm = t.match(/^(.*?)\s?[:：]\s+(.+)$/s);
    return `<li class="ag-i${r.prioridade === 'alta' ? ' alta' : ''}"><span class="ag-pr">${esc(tr(r.prioridade === 'alta' ? 'Prioridade alta' : 'Prioridade média'))}</span>
      <p class="ag-t" data-notr>${esc(mm ? mm[1] : t)}</p>${mm && comDet ? `<p class="ag-d" data-notr>${esc(mm[2])}</p>` : ''}${comIr && r.ir ? `<button type="button" class="link" data-ir="${esc(r.ir)}">Ir à pergunta</button>` : ''}</li>`;
  }).join('')}</ol>`;
}
