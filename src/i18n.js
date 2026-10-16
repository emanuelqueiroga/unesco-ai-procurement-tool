// =====================================================================
// Idiomas: PT (origem), EN, ES, FR e, na v13 (RQ-18), AR, ZH, BM, ZU e SW
// O texto-fonte em português é a chave. Números viram marcadores {0}, {1}…
// para que o mesmo modelo sirva a qualquer valor ("Ano 2" → "Year {0}").
// I18N é injetado no build a partir de i18n/<l>.json (en es fr ar zh bm zu sw).
// =====================================================================
// [código, nome na própria língua, locale do Intl, lang do <html>, direção]
const IDIOMAS = [['pt', 'Português', 'pt-BR'], ['en', 'English', 'en'], ['es', 'Español', 'es'], ['fr', 'Français', 'fr'],
  ['ar', 'العربية', 'ar-u-nu-latn', 'ar', 'rtl'], ['zh', '中文', 'zh-CN', 'zh-Hans'], ['bm', 'Bamanankan', 'fr-ML', 'bm'],
  ['zu', 'isiZulu', 'zu-ZA', 'zu'], ['sw', 'Kiswahili', 'sw', 'sw']];
// v13: idiomas traduzidos sem revisão nativa. Neles, a chave que falta usa o inglês (I18N.en), e não o português,
// e a plataforma mostra o aviso de tradução preliminar até o idioma ser marcado como revisado
// (aqui, com true, ou no dicionário, com "__revisado": true em i18n/<l>.json ou i18n/v13_*_<l>.json).
const IDIOMAS_NOVOS = ['ar', 'zh', 'bm', 'zu', 'sw'];
const IDIOMAS_REVISADOS = { ar: false, zh: false, bm: false, zu: false, sw: false };
// Locales do Intl: o primeiro que o navegador suporta (números, datas, nomes de moeda).
//  ar: algarismos ocidentais (-u-nu-latn), como nos dicionários.
//  bm: o Chromium não traz o CLDR do bambara; fr-ML (francês do Mali) em todos os navegadores, para que os
//      separadores sejam os mesmos (1 234 567,8) e as datas saiam em francês, língua de trabalho no Mali.
//  zu: zu-ZA quando houver (Firefox); senão en (os mesmos separadores, 1,234.5; datas em inglês).
const LOC_CANDIDATOS = { ar: ['ar-u-nu-latn'], zh: ['zh-CN', 'zh'], bm: ['fr-ML', 'fr'], zu: ['zu-ZA', 'zu', 'en'], sw: ['sw', 'sw-KE', 'en'] };
const LOC_RESOLVIDO = {};
let LANG = 'pt';
function LOC() {
  const x = IDIOMAS.find(i => i[0] === LANG);
  if (!x) return 'pt-BR';
  const c = LOC_CANDIDATOS[LANG];
  if (!c) return x[2];
  if (!LOC_RESOLVIDO[LANG]) {
    let r = c[c.length - 1];
    try { r = c.find(l => Intl.NumberFormat.supportedLocalesOf([l]).length && Intl.DateTimeFormat.supportedLocalesOf([l]).length) || r; } catch (e) { }
    LOC_RESOLVIDO[LANG] = r;
  }
  return LOC_RESOLVIDO[LANG];
}
function idiomaInfo(l) { const x = IDIOMAS.find(i => i[0] === (l || LANG)) || IDIOMAS[0]; return { cod: x[0], nome: x[1], loc: x[2], lang: x[3] || x[2], dir: x[4] || 'ltr' }; }

const RE_NUM = /(?<![\p{L}\d.,])[-−+]?\d+(?:[.,  ]\d+)*/gu;
// Magnitudes abreviadas (milhar, milhão, bilhão) e unidade "milhares de <moeda>" por idioma.
// Usadas por grande() e unidMil() (custos_ui.js). Em inglês, "162 mil" se leria como 162 milhões.
// v13: ar k/M/bn (o árabe não tem abreviação corrente; os valores ficam isolados da esquerda para a direita
// na página e no PDF, e uma palavra árabe dentro deles inverteria a leitura: "US$ 2.65 M" e não "US$ 2.65 مليون");
// zh 千/百万/十亿 (grande() divide por 10³, 10⁶ e 10⁹, por isso não 万/亿); bm k/M/Md (formas francesas,
// correntes no Mali); zu k/M/bn (as da África do Sul); sw k/M/B (as da imprensa do Quênia e da Tanzânia).
const MAGNITUDES = { pt: ['mil', 'mi', 'bi'], en: ['k', 'M', 'bn'], es: ['mil', 'M', 'mil M'], fr: ['k', 'M', 'Md'],
  ar: ['k', 'M', 'bn'], zh: ['千', '百万', '十亿'], bm: ['k', 'M', 'Md'], zu: ['k', 'M', 'bn'], sw: ['k', 'M', 'B'] };
const UNID_MIL = { pt: c => c + ' mil', en: c => c + ' thousand', es: c => 'miles de ' + c, fr: c => 'milliers de ' + c,
  ar: c => 'آلاف ' + c, zh: c => '千' + c, bm: c => c + ' ×1000', zu: c => 'izinkulungwane ze-' + c, sw: c => 'maelfu ya ' + c };
function magnitudes(l) { return MAGNITUDES[l || LANG] || MAGNITUDES.pt; }
function unidMilDe(cod, l) { return (UNID_MIL[l || LANG] || UNID_MIL.pt)(cod); }
// Devolve valores e unidades do idioma exibido à forma em português (a forma das chaves do dicionário):
// "Árvore de custos (USD thousand)" → "Árvore de custos (USD mil)"; "US$ 2.65 M" → "US$ 2.65 mi".
function unidadesParaPT(s) {
  if (LANG === 'pt') return s;
  const cod = typeof moedaInfo === 'function' ? moedaInfo().cod : 'USD';
  let out = s.split(unidMilDe(cod)).join(unidMilDe(cod, 'pt'));
  const L = magnitudes(), P = MAGNITUDES.pt;
  const rx = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ordem = [2, 1, 0].filter(i => L[i] !== P[i]);   // "mil M" antes de "mil"
  if (ordem.length) out = out.replace(new RegExp('(\\d) (' + ordem.map(i => rx(L[i])).join('|') + ')(?![\\p{L}])', 'gu'), (_, d, u) => d + ' ' + P[L.indexOf(u)]);
  return out;
}
function normalizar(s) {
  const nums = [];
  const chave = s.replace(RE_NUM, m => { nums.push(m); return '{' + (nums.length - 1) + '}'; }).replace(/\s+/g, ' ').trim();
  return { chave, nums };
}
// Dicionário do idioma exibido. Nos idiomas novos, o que falta vem do inglês (nunca do português).
const DIC_FALLBACK = {};
function dicionario(l) {
  l = l || LANG;
  if (typeof I18N === 'undefined') return {};
  const d = I18N[l] || {};
  if (!IDIOMAS_NOVOS.includes(l)) return d;
  const en = I18N.en || {}, c = DIC_FALLBACK[l];
  if (c && c.d === d && c.en === en) return c.m;
  const m = Object.assign({}, en, d);
  DIC_FALLBACK[l] = { d, en, m };
  return m;
}
function tr(s) {
  if (LANG === 'pt' || s == null) return s;
  const str = String(s);
  if (!/\p{L}/u.test(str)) return str;
  const dic = dicionario();
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
  if (alvo == null && !tr.emPT) {
    // valores e unidades já no idioma exibido (grande(), unidMil()): procura a forma em português
    const pt = unidadesParaPT(corpo);
    if (pt !== corpo) { let t; tr.emPT = true; try { t = tr(pt); } finally { tr.emPT = false; } if (t !== pt) return m[1] + t + m[3]; }
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
  const out = setasRTL(tr(orig));
  ORIG.set(n, { orig, out });
  if (n.data !== out) n.data = out;
}
// v13: em árabe (rtl), as setas do texto apontam para o outro lado ("Continuar →" → "… ←")
function setasRTL(s) { return LANG === 'ar' && typeof s === 'string' && /[→←]/.test(s) ? s.replace(/[→←]/g, c => (c === '→' ? '←' : '→')) : s; }
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
  const inf = idiomaInfo();
  document.documentElement.lang = inf.lang;
  document.documentElement.dir = inf.dir;   // v13: árabe da direita para a esquerda (idiomas.css)
  carregarFonteIdioma(LANG);
  atualizarAvisoTrad();
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
const MARCAS_BIDI = /[\u200e\u200f\u061c\u202a-\u202e\u2066-\u2069]/g;   // v13: o Intl em árabe põe marcas de direção ("\u061c-5")
// "160.000" (pt) → 160000; "0,5" (pt) → 0.5; "160,000" (en) → 160000; "" → ''
function lerNumero(s) {
  if (typeof s === 'number') return isFinite(s) ? s : '';
  if (s == null) return '';
  const { grupo, decimal } = sepNum();
  let t = String(s).replace(ESPACOS_NUM, '').replace(MARCAS_BIDI, '').replace(/[−–]/g, '-');
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
  if (sel) {
    sel.innerHTML = IDIOMAS.map(([c, n]) => { const f = idiomaInfo(c); return `<option value="${c}" lang="${f.lang}" dir="${f.dir}" ${c === LANG ? 'selected' : ''}>${n}</option>`; }).join('');
    // v13: aviso de tradução preliminar logo abaixo do seletor, quando se escolhe um idioma novo
    if (!sel.dataset.avisoTrad) { sel.dataset.avisoTrad = '1'; sel.addEventListener('change', () => mostrarAvisoLang(sel.value)); }
  }
  const v = document.getElementById('txt-vinculo'); if (v) v.textContent = TXT_VINCULO;
  const i = document.getElementById('txt-isencao'); if (i) i.textContent = TXT_ISENCAO;
}

// ---------------------------------------------------------- v13 (RQ-18): fontes dos idiomas novos na página
// Google Fonts é a única origem externa de CSS. Árabe: Noto Sans Arabic (interface) e Noto Naskh Arabic (títulos);
// chinês: Noto Sans SC e Noto Serif SC (o Google entrega só as fatias usadas, por unicode-range); bambara: o
// Source Sans 3 cobre ɛ ɔ ɲ ŋ, mas não as maiúsculas Ɛ Ɔ Ɲ (que text-transform: uppercase produz) — Noto Sans e
// Noto Serif entram na pilha (idiomas.css) só para essas letras (parâmetro text=, poucos KB).
const FONTES_IDIOMA = {
  ar: 'https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@500;600;700&family=Noto+Sans+Arabic:wght@400;600;700&display=swap',
  zh: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;600;700&family=Noto+Serif+SC:wght@600;700&display=swap',
  bm: 'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&family=Noto+Serif:wght@600;700&display=swap&text=' + encodeURIComponent('ƐƆƝŊɛɔɲŋ\u0300\u0301\u030c'),
};
function carregarFonteIdioma(l) {
  const url = FONTES_IDIOMA[l];
  if (!url || typeof document === 'undefined' || document.getElementById('fonte-' + l)) return;
  try {
    const k = document.createElement('link');
    k.id = 'fonte-' + l; k.rel = 'stylesheet'; k.href = url;
    (document.head || document.documentElement).appendChild(k);
  } catch (e) { }
}

// ---------------------------------------------------------- v13 (RQ-18): aviso de tradução preliminar
// Nos idiomas novos ainda não revisados: no idioma e em inglês, (a) abaixo do seletor ao escolher o idioma,
// (b) numa faixa no topo da página, (c) no pé do plano de contratação e (d) na capa e no rodapé do PDF
// (avisoTradPDF, plano_pdf.js). Textos em i18n/v13_idiomas_<l>.json.
const AVISO_TRAD = 'A linguagem desta versão é uma tradução preliminar e ainda precisa ser revisada por falantes nativos.';
const AVISO_TRAD_EN = 'The language of this version is a preliminary translation and still needs to be reviewed by native speakers.';
function idiomaRevisado(l) {
  if (IDIOMAS_REVISADOS[l]) return true;
  const d = typeof I18N !== 'undefined' && I18N[l];
  return !!(d && (d.__revisado === true || d.__revisado === 'true'));
}
function avisoTraducao(l) {
  l = l || LANG;
  if (!IDIOMAS_NOVOS.includes(l) || idiomaRevisado(l)) return null;
  const I = typeof I18N !== 'undefined' ? I18N : {};
  const en = (I.en || {})[AVISO_TRAD] || AVISO_TRAD_EN;
  const f = idiomaInfo(l);
  return { local: (I[l] || {})[AVISO_TRAD] || en, en, lang: f.lang, dir: f.dir };
}
function escAviso(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }
// HTML do aviso (data-notr: o tradutor do DOM não toca nele)
function avisoTradHTML(cls, l) {
  const a = avisoTraducao(l);
  if (!a) return '';
  const en = a.en !== a.local ? ` <span class="aviso-trad-en" lang="en" dir="ltr">${escAviso(a.en)}</span>` : '';
  return `<p class="aviso-trad${cls ? ' ' + cls : ''}" role="note" data-notr data-aviso-trad="${escAviso(l || LANG)}"><span class="aviso-trad-ic" aria-hidden="true">!</span><span class="aviso-trad-tx"><span lang="${a.lang}" dir="${a.dir}">${escAviso(a.local)}</span>${en}</span></p>`;
}
// (a) abaixo do seletor de idioma: aparece ao escolher um idioma novo; fecha no ×, com Esc ou ao voltar a PT/EN/ES/FR
function mostrarAvisoLang(l) {
  const box = document.getElementById('aviso-lang');
  if (!box) return;
  const h = avisoTradHTML('aviso-lang-tx', l);
  if (!h) { box.hidden = true; box.innerHTML = ''; return; }
  box.innerHTML = h + `<button type="button" class="aviso-lang-x" data-notr aria-label="${escAviso((dicionario(l) || {})['Fechar'] || 'Close')}">×</button>`;
  box.hidden = false;
  const fechar = () => { box.hidden = true; document.removeEventListener('keydown', esc, true); };
  const esc = e => { if (e.key === 'Escape') fechar(); };
  box.querySelector('.aviso-lang-x').addEventListener('click', fechar);
  document.addEventListener('keydown', esc, true);
}
// (b) faixa no topo e (c) pé do plano; o plano é redesenhado a cada render, por isso um observador recoloca o aviso
let OBS_AVISO = null;
function avisoNoPlano() {
  const corpo = document.querySelector('#plano .rp-corpo');
  if (!corpo) return;
  const atual = corpo.querySelector(':scope > .rp-aviso-trad');
  const a = avisoTraducao();
  if (!a) { if (atual) atual.remove(); return; }
  if (atual && atual.dataset.avisoTrad === LANG) return;
  if (atual) atual.remove();
  corpo.insertAdjacentHTML('beforeend', avisoTradHTML('rp-aviso-trad'));
}
function atualizarAvisoTrad() {
  if (typeof document === 'undefined') return;
  const f = document.getElementById('faixa-trad');
  if (f) { const h = avisoTradHTML('faixa-trad-tx'); f.innerHTML = h; f.hidden = !h; }
  const box = document.getElementById('aviso-lang');
  if (box && !avisoTraducao()) { box.hidden = true; box.innerHTML = ''; }
  avisoNoPlano();
  if (!OBS_AVISO && document.body && typeof MutationObserver !== 'undefined') {
    OBS_AVISO = new MutationObserver(() => avisoNoPlano());
    OBS_AVISO.observe(document.body, { childList: true, subtree: true });
  }
}
