// =====================================================================
// v15 (proposta B3): botões ⓘ e explicações no lugar.
//   Cada passo, pergunta, opção de sentido não óbvio, número e termo do painel de custo e seção do plano tem um botão ⓘ
//   (button com aria-expanded e aria-controls). Ele abre uma explicação curta logo abaixo, no próprio lugar (nada flutua
//   sobre o texto, então nada passa da largura da tela no celular). Uma explicação aberta por vez; Esc fecha e devolve o
//   foco ao botão; toque e clique funcionam igual. O estado aberto sobrevive aos redesenhos da tela (EX_ABERTO).
//   Conteúdo: PASSO_AJUDA (passos), dicas das perguntas, CAMPOS (exemplos), glossário e os textos novos de
//   explica_dados.js (EX_Q, EX_OPC, EX_CUSTO, EX_PLANO), em português; o tradutor do DOM (i18n.js) os traduz.
// =====================================================================
let EX_ABERTO = '';
const ICO_I = '<svg class="ib-ic" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false"><circle cx="9" cy="9" r="7.6" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="5.6" r="1.05" fill="currentColor"/><path d="M9 8.2v5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
const ICO_X_EX = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>';
const exSeguro = k => String(k).replace(/[^a-zA-Z0-9_-]/g, '-');
const exId = k => 'ex-' + exSeguro(k);
// Botão ⓘ. O nome acessível junta "Sobre a pergunta" (ou outro rótulo) ao texto do elemento indicado (alvo), quando há.
// k: chave da explicação ('q:<campo>', 'o:<campo>:<valor>', 'c:<termo>', 's:<seção>', 'p:<passo>')
function botaoEx(k, rot, alvo, controla) {
  const s = exSeguro(k), aberto = k.startsWith('p:') ? (typeof ajudaAberto === 'function' && ajudaAberto(k.slice(2))) : EX_ABERTO === k;
  return `<button type="button" class="ib" id="ib-${s}" data-ex="${esc(k)}" aria-expanded="${aberto}" aria-controls="${controla || exId(k)}" aria-labelledby="ibr-${s}${alvo ? ' ' + alvo : ''}">${ICO_I}<span class="sr" id="ibr-${s}">${esc(rot || 'Explicação')}</span></button>`;
}
// Painel da explicação (fica no HTML, escondido, para o leitor de tela e o tradutor; o botão o mostra)
function painelEx(k, corpo) {
  if (!corpo) return '';
  return `<div class="ex-pop" id="${exId(k)}" data-ex-painel="${esc(k)}"${EX_ABERTO === k ? '' : ' hidden'}><div class="ex-in">${corpo}</div>
    <button type="button" class="ex-x" data-ex-fechar><span aria-hidden="true">${ICO_X_EX}</span><span>Fechar</span><span class="sr">: <span>Explicação</span></span></button></div>`;
}
const exP = (t, cls) => `<p class="ex-p${cls ? ' ' + cls : ''}">${typeof glossarioTexto === 'function' ? glossarioTexto(t) : esc(tr(t))}</p>`;
const exQuem = q => q ? `<p class="ex-p ex-quem"><b>${esc(tr(AJUDA_ROT.quem))}</b> <span>${esc(tr(q))}</span></p>` : '';

// ----------------------------------------------------------- conteúdo
// Pergunta: o texto novo (EX_Q) ou a dica (quando a dica não está à vista sob o rótulo), quem costuma saber e o exemplo
function corpoExCampo(f, o) {
  o = o || {};
  const partes = [];
  const novo = typeof EX_Q !== 'undefined' ? EX_Q[f.id] : '';
  if (novo) partes.push(exP(novo));
  else if (f.dica) partes.push(o.dicaVisivel ? '' : `<div class="dica"><span class="dica-r">${esc(tr(AJUDA_ROT.dica))}</span> <span class="dica-t">${glossarioTexto(f.dica)}</span></div>`);
  const a = typeof PASSO_AJUDA !== 'undefined' ? PASSO_AJUDA[f.passo] : null;
  if (a && a.quem) partes.push(exQuem(a.quem));
  if (o.ex) partes.push(`<p class="hint ex ex-p ex-ex">${esc(tr(o.ex))}</p>`);
  // sem nada além da dica que já está à vista: repete a dica, para a explicação nunca ficar vazia
  if (!partes.join('').trim() && f.dica) partes.push(exP(f.dica));
  return partes.join('');
}
function exCampo(f, o) { return painelEx('q:' + f.id, corpoExCampo(f, o)); }
function exOpcao(campo, v) { const t = typeof EX_OPC !== 'undefined' ? EX_OPC[campo + ':' + v] : ''; return t ? painelEx('o:' + campo + ':' + v, exP(t)) : ''; }
function temExOpcao(campo, v) { return typeof EX_OPC !== 'undefined' && !!EX_OPC[campo + ':' + v]; }
// Termo do painel de custo; com glossário, a definição do glossário vem antes
const EX_CUSTO_GL = { tco: 'tco', faixa: 'p10p90' };
function corpoExCusto(k) {
  const g = EX_CUSTO_GL[k] && typeof GLOSSARIO_POR_ID !== 'undefined' ? GLOSSARIO_POR_ID[EX_CUSTO_GL[k]] : null;
  const t = typeof EX_CUSTO !== 'undefined' ? EX_CUSTO[k] : '';
  return (g ? `<p class="ex-p ex-gl"><b>${esc(tr(g.termo))}</b>${g.extenso ? ` <span class="muted">(${esc(tr(g.extenso))})</span>` : ''}: <span>${esc(tr(g.def))}</span></p>` : '') + (t ? exP(t) : '');
}
function exCusto(k) { return painelEx('c:' + k, corpoExCusto(k)); }
function botaoExCusto(k, alvo) { return botaoEx('c:' + k, 'Sobre este número', alvo); }
function exPlano(sec) { const t = typeof EX_PLANO !== 'undefined' ? EX_PLANO[sec] : ''; return t ? painelEx('s:' + sec, exP(t)) : ''; }
function temExPlano(sec) { return typeof EX_PLANO !== 'undefined' && !!EX_PLANO[sec]; }
// Todas as chaves e textos (para os testes): { q: {id: texto}, ... } e a lista de textos novos
function explicaTextos() {
  const L = [];
  [typeof EX_Q !== 'undefined' ? EX_Q : {}, typeof EX_OPC !== 'undefined' ? EX_OPC : {}, typeof EX_CUSTO !== 'undefined' ? EX_CUSTO : {}, typeof EX_PLANO !== 'undefined' ? EX_PLANO : {}].forEach(o => Object.values(o).forEach(t => L.push(t)));
  return L;
}

// ----------------------------------------------------------- abrir e fechar
function exSincronizar() {
  document.querySelectorAll('[data-ex-painel]').forEach(p => { p.hidden = p.dataset.exPainel !== EX_ABERTO; });
  document.querySelectorAll('.ib[data-ex]').forEach(b => {
    const k = b.dataset.ex;
    if (k.startsWith('p:')) { const d = document.getElementById('ajuda-' + k.slice(2)); b.setAttribute('aria-expanded', String(!!(d && d.open))); }
    else b.setAttribute('aria-expanded', String(k === EX_ABERTO));
  });
}
function exAbrir(k) {
  EX_ABERTO = k; exSincronizar();
  const p = document.getElementById(exId(k));
  if (p) { try { const r = p.getBoundingClientRect(); if (r.bottom > window.innerHeight - 80) p.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { } }
}
function exFechar(devolver) {
  const k = EX_ABERTO; if (!k) return false;
  EX_ABERTO = ''; exSincronizar();
  if (devolver) { const b = document.getElementById('ib-' + exSeguro(k)); if (b) try { b.focus({ preventScroll: true }); } catch (e) { } }
  return true;
}
// ⓘ de um passo: abre e fecha "Por que perguntamos?" (details#ajuda-<id>) no próprio lugar
function exPasso(k, b) {
  const d = document.getElementById('ajuda-' + k.slice(2)); if (!d) return;
  d.open = !d.open; b.setAttribute('aria-expanded', String(d.open));
  if (d.open) { try { d.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { } }
}
function ligarExplica() {
  if (typeof document === 'undefined' || ligarExplica.feito) return;
  ligarExplica.feito = true;
  document.addEventListener('click', e => {
    const t = e.target; if (!t || !t.closest) return;
    const x = t.closest('[data-ex-fechar]');
    if (x) { e.preventDefault(); e.stopPropagation(); exFechar(true); return; }
    const b = t.closest('.ib[data-ex]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const k = b.dataset.ex;
    if (k.startsWith('p:')) { exPasso(k, b); return; }
    if (EX_ABERTO === k) exFechar(false); else exAbrir(k);
  }, true);
  // Esc fecha a explicação aberta (antes das gavetas e da folha) e devolve o foco ao botão; num passo, recolhe "Por que perguntamos?"
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (typeof GL_ABERTO !== 'undefined' && GL_ABERTO) return;
    if (EX_ABERTO) { e.stopPropagation(); e.preventDefault(); exFechar(true); return; }
    const a = document.activeElement, d = a && a.closest ? (a.closest('details.ajuda[open]') || (a.matches('.ib[data-ex^="p:"]') ? document.getElementById('ajuda-' + a.dataset.ex.slice(2)) : null)) : null;
    if (d && d.open) { e.stopPropagation(); e.preventDefault(); d.open = false; const b = document.getElementById('ib-p-' + d.dataset.ajuda); if (b) { b.setAttribute('aria-expanded', 'false'); b.focus({ preventScroll: true }); } }
  }, true);
  // "Por que perguntamos?" aberto ou fechado pelo próprio resumo: o ⓘ do passo acompanha
  document.addEventListener('toggle', e => { const d = e.target; if (d && d.dataset && d.dataset.ajuda != null) { const b = document.getElementById('ib-p-' + d.dataset.ajuda); if (b) b.setAttribute('aria-expanded', String(d.open)); } }, true);
}
ligarExplica();
