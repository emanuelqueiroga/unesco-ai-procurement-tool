// =====================================================================
// Idiomas: PT (origem), EN, ES, FR
// O texto-fonte em português é a chave. Números viram marcadores {0}, {1}…
// para que o mesmo modelo sirva a qualquer valor ("Ano 2" → "Year {0}").
// I18N é injetado no build a partir de i18n/{en,es,fr}.json.
// =====================================================================
const IDIOMAS = [['pt', 'Português', 'pt-BR'], ['en', 'English', 'en'], ['es', 'Español', 'es'], ['fr', 'Français', 'fr']];
let LANG = 'pt';
function LOC() { const x = IDIOMAS.find(i => i[0] === LANG); return x ? x[2] : 'pt-BR'; }

const RE_NUM = /(?<![\p{L}\d.,])[-−+]?\d+(?:[.,  ]\d+)*/gu;
function normalizar(s) {
  const nums = [];
  const chave = s.replace(RE_NUM, m => { nums.push(m); return '{' + (nums.length - 1) + '}'; }).replace(/\s+/g, ' ').trim();
  return { chave, nums };
}
function tr(s) {
  if (LANG === 'pt' || s == null) return s;
  const str = String(s);
  if (!/\p{L}/u.test(str)) return str;
  const dic = (typeof I18N !== 'undefined' && I18N[LANG]) || {};
  const pre = str.match(/^\s*\[[ x]\] /);
  if (pre) return pre[0] + tr(str.slice(pre[0].length));
  const m = str.match(/^(\s*)([\s\S]*?)(\s*)$/);
  const corpo = m[2];
  if (dic[corpo] != null) return m[1] + dic[corpo] + m[3];
  const { chave, nums } = normalizar(corpo);
  let alvo = dic[chave];
  if (alvo == null && typeof moedaInfo === 'function') {
    // valores em outra moeda: procura a forma em dólar e devolve com a moeda exibida
    const mi = moedaInfo();
    if (mi.cod !== 'USD') {
      const k2 = chave.split(mi.cod + ' ').join('USD ').split(mi.cod + ')').join('USD)').split(mi.pre + ' ').join('US$ ');
      const a2 = dic[k2];
      if (a2 != null) alvo = a2.split('USD').join(mi.cod).split('US$').join(mi.pre);
    }
  }
  if (alvo == null) {
    // número com magnitude abreviada: "R$ 1,8 mi"
    const u = corpo.match(/^(.*?)(\s)(mi|bi|mil)$/);
    if (u && /\d/.test(u[1]) && dic[u[3]]) return m[1] + u[1] + u[2] + dic[u[3]] + m[3];
    // pontuação final diferente: "Escolas:" usa a tradução de "Escolas"
    const pf = corpo.match(/^([\s\S]*?\p{L}[\s\S]*?)([:.;,]+)$/u);
    if (pf) { const t = tr(pf[1]); if (t !== pf[1]) return m[1] + t + pf[2] + m[3]; }
    // várias frases: traduz cada uma e junta, se todas tiverem tradução
    const fr = corpo.split(/(?<=[.!?:])\s+(?=[A-ZÀ-Ý"“(])/u);
    if (fr.length > 1) {
      const out = fr.map(f => tr(f));
      if (out.every((o, i) => o !== fr[i] || !/\p{L}{3}/u.test(fr[i]))) return m[1] + out.join(' ') + m[3];
    }
    return str;
  }
  return m[1] + alvo.replace(/\{(\d+)\}/g, (_, i) => nums[+i] != null ? nums[+i] : '') + m[3];
}
// tradução profunda de estruturas (relatório, exportações)
function trFundo(x) {
  if (LANG === 'pt') return x;
  if (typeof x === 'string') return tr(x);
  if (Array.isArray(x)) return x.map(trFundo);
  if (x && typeof x === 'object') { const o = {}; Object.keys(x).forEach(k => { o[k] = trFundo(x[k]); }); return o; }
  return x;
}

// ---------------------------------------------------------- tradução do DOM
const ORIG = new WeakMap();      // nó de texto → { orig, out }
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
function pular(el) { return el && el.closest && el.closest('script,style,textarea,[data-notr]'); }
function trTexto(n) {
  const reg = ORIG.get(n);
  let orig = n.data;
  if (reg && n.data === reg.out) orig = reg.orig;
  const out = tr(orig);
  ORIG.set(n, { orig, out });
  if (n.data !== out) n.data = out;
}
function trAttrs(el) {
  ATTRS.forEach(a => {
    if (!el.hasAttribute(a)) return;
    const k = 'data-i18n-' + a;
    const atual = el.getAttribute(a);
    let orig = el.hasAttribute(k) && el.getAttribute(k + '-out') === atual ? el.getAttribute(k) : atual;
    const out = tr(orig);
    if (out !== orig || el.hasAttribute(k)) { el.setAttribute(k, orig); el.setAttribute(k + '-out', out); }
    if (atual !== out) el.setAttribute(a, out);
  });
}
function traduzirArvore(raiz) {
  if (!raiz) return;
  if (raiz.nodeType === 3) { if (!pular(raiz.parentElement)) trTexto(raiz); return; }
  if (raiz.nodeType !== 1 || pular(raiz)) return;
  trAttrs(raiz);
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: n => (n.nodeType === 1 ? (pular(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) : NodeFilter.FILTER_ACCEPT),
  });
  let n; while ((n = w.nextNode())) { if (n.nodeType === 3) { if (n.data.trim()) trTexto(n); } else trAttrs(n); }
}
let OBS = null;
function observarIdioma() {
  if (OBS) return;
  OBS = new MutationObserver(ms => {
    ms.forEach(m => {
      if (m.type === 'childList') m.addedNodes.forEach(traduzirArvore);
      else if (m.type === 'characterData') { const r = ORIG.get(m.target); if (!r || m.target.data !== r.out) { if (!pular(m.target.parentElement)) { ORIG.delete(m.target); trTexto(m.target); } } }
    });
  });
  OBS.observe(document.body, { childList: true, subtree: true, characterData: true });
}
function aplicarIdioma(l) {
  LANG = IDIOMAS.some(i => i[0] === l) ? l : 'pt';
  document.documentElement.lang = LOC();
  traduzirArvore(document.body);
  const t = document.querySelector('title'); if (t) { if (!t.dataset.orig) t.dataset.orig = t.textContent; t.textContent = tr(t.dataset.orig); }
}
function idiomaInicial() { return 'en'; }  // decisão da equipe: inglês como padrão nesta etapa

// ---------------------------------------------------------- números nos campos de entrada
// Os campos numéricos são <input type="text"> formatados com os separadores do idioma
// enquanto se digita (PT e ES 160.000 e 0,5; EN 160,000 e 0.5; FR 160 000 e 0,5).
// O estado guarda sempre número puro (ou '').
const SEP_CACHE = {};
function sepNum() {
  const loc = LOC();
  if (!SEP_CACHE[loc]) {
    let grupo = ',', decimal = '.';
    try {
      const ps = new Intl.NumberFormat(loc).formatToParts(12345.6);
      const g = ps.find(p => p.type === 'group'), d = ps.find(p => p.type === 'decimal');
      if (g) grupo = g.value; if (d) decimal = d.value;
    } catch (e) { }
    SEP_CACHE[loc] = { grupo, decimal };
  }
  return SEP_CACHE[loc];
}
const ESPACOS_NUM = /[\s    ]/g;
// "160.000" (pt) → 160000; "0,5" (pt) → 0.5; "160,000" (en) → 160000; "" → ''
function lerNumero(s) {
  if (typeof s === 'number') return isFinite(s) ? s : '';
  if (s == null) return '';
  const { grupo, decimal } = sepNum();
  let t = String(s).replace(ESPACOS_NUM, '').replace(/[−–]/g, '-');
  if (!t) return '';
  const outro = decimal === ',' ? '.' : ',';
  if (!t.includes(decimal)) {
    // um único separador "do outro idioma" que não forma grupo de 3 dígitos é lido como decimal ("0.5" em pt)
    const partes = t.split(outro);
    if (partes.length === 2 && !/^\d{3}$/.test(partes[1])) t = partes[0] + decimal + partes[1];
  }
  if (grupo.trim()) t = t.split(grupo).join('');
  t = t.split(decimal).join('.');
  if (decimal !== '.') t = t.replace(/,/g, '');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return '';
  const n = Number(t);
  return isFinite(n) ? n : '';
}
// número → texto do campo no idioma atual (casas = máximo de casas decimais)
function fmtEntrada(x, casas) {
  if (x === '' || x == null) return '';
  const n = typeof x === 'number' ? x : lerNumero(x);
  if (n === '' || !isFinite(n)) return '';
  try { return new Intl.NumberFormat(LOC(), { maximumFractionDigits: Math.min(20, Math.max(0, casas || 0)), useGrouping: true }).format(n); }
  catch (e) { return String(n); }
}
// campo numérico formatado; ok: false omite o ✓ dentro do valor (calculadora)
function inputNum(o = {}) {
  const casas = +o.casas || 0;
  const tipo = casas > 0 ? 'dec' : 'int';
  const v = fmtEntrada(o.valor, casas || 0);
  const inp = `<input type="text" class="num${o.cls ? ' ' + o.cls : ''}" inputmode="${tipo === 'dec' ? 'decimal' : 'numeric'}" data-num="${tipo}" data-casas="${casas}" autocomplete="off" spellcheck="false"${o.id ? ` id="${esc(o.id)}"` : ''} value="${esc(v)}" placeholder="${esc(o.ph || ' ')}"${o.rotulo ? ` aria-label="${esc(o.rotulo)}"` : ''}${o.style ? ` style="${esc(o.style)}"` : ''} ${o.attrs || ''}>`;
  if (o.ok === false) return inp;
  return `<span class="campo">${inp}<span class="ok-in" aria-hidden="true">✓</span></span>`;
}
// reformata o campo enquanto se digita, mantendo o cursor depois do mesmo dígito
function formatarCampoNum(el) {
  if (!el || el.dataset.num == null) return;
  const dec = el.dataset.num === 'dec';
  const casas = +el.dataset.casas || 0;
  const { grupo, decimal } = sepNum();
  const outro = decimal === ',' ? '.' : ',';
  const aceitaOutro = dec && grupo !== outro;   // em FR o ponto também serve de decimal
  const v = el.value;
  const pos = el.selectionStart == null ? v.length : el.selectionStart;
  let neg = false, int = '', frac = null, antes = 0;
  for (let i = 0; i < v.length; i++) {
    const c = v[i];
    if (c >= '0' && c <= '9') {
      if (frac === null) int += c; else if (!casas || frac.length < casas) frac += c; else continue;
      if (i < pos) antes++;
    } else if (dec && frac === null && (c === decimal || (aceitaOutro && c === outro))) {
      frac = ''; if (i < pos) antes++;
    } else if (dec && (c === '-' || c === '−') && !neg && !int && frac === null) {
      neg = true; if (i < pos) antes++;
    }
  }
  // zeros à esquerda saem (fica um zero se a parte inteira for só zeros)
  let z = 0; while (z < int.length - 1 && int[z] === '0') z++;
  if (z) { const antesInt = Math.max(0, antes - (neg ? 1 : 0)); antes -= Math.min(z, antesInt); int = int.slice(z); }
  let intFmt = '';
  if (int) {
    if (int.length <= 15) { try { intFmt = new Intl.NumberFormat(LOC(), { maximumFractionDigits: 0, useGrouping: true }).format(Number(int)); } catch (e) { intFmt = int; } }
    else intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, grupo);
  }
  const novo = (neg ? '-' : '') + intFmt + (frac !== null ? decimal + frac : '');
  if (novo === v) return;
  el.value = novo;
  // recoloca o cursor depois do mesmo número de caracteres significativos
  let p = 0, k = 0;
  if (antes > 0) {
    for (p = 0; p < novo.length; p++) {
      const c = novo[p];
      if ((c >= '0' && c <= '9') || c === '-' || (frac !== null && c === decimal && p === novo.length - frac.length - 1)) k++;
      if (k >= antes) { p++; break; }
    }
  }
  try { if (document.activeElement === el) el.setSelectionRange(p, p); } catch (e) { }
}
function normalizarCampoNum(el) {
  if (!el || el.dataset.num == null) return;
  const n = lerNumero(el.value);
  const novo = fmtEntrada(n, +el.dataset.casas || 0);
  if (novo !== el.value) el.value = novo;
}
// capturados em document antes dos demais manipuladores
function ligarCamposNum() {
  document.addEventListener('input', e => {
    const el = e.target;
    if (!el || !el.dataset || el.dataset.num == null) return;
    if (e.isComposing) return;
    formatarCampoNum(el);
  }, true);
  document.addEventListener('compositionend', e => { const el = e.target; if (el && el.dataset && el.dataset.num != null) formatarCampoNum(el); }, true);
  document.addEventListener('change', e => { const el = e.target; if (el && el.dataset && el.dataset.num != null) normalizarCampoNum(el); }, true);
}

// ---------------------------------------------------------- vínculo institucional
const TXT_VINCULO = 'Projeto vinculado à Cátedra UNESCO UNITWIN de Inteligência Artificial Desplugada na Educação e ao IA.EDU.';
const TXT_ISENCAO = 'As designações empregadas e a apresentação do material nesta ferramenta não implicam a expressão de qualquer opinião da UNESCO. Os autores são responsáveis pela escolha e pela apresentação dos fatos e pelas opiniões expressas, que não são necessariamente as da UNESCO e não comprometem a Organização.';
function montarIdiomas() {
  const sel = document.getElementById('sel-lang');
  if (sel) { sel.innerHTML = IDIOMAS.map(([c, n]) => `<option value="${c}" ${c === LANG ? 'selected' : ''}>${n}</option>`).join(''); }
  const v = document.getElementById('txt-vinculo'); if (v) v.textContent = TXT_VINCULO;
  const i = document.getElementById('txt-isencao'); if (i) i.textContent = TXT_ISENCAO;
}
