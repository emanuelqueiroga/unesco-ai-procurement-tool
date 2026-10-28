// Lint do formato das regras (REC-14; seção 3.1 de design/redesign/05-requisitos-recomendacoes.md).
// lintRegra(r) → lista de problemas em texto (vazia = regra válida); lintCatalogo(regras) junta os de todas e
// confere ids repetidos (REC-01). Rodado por tests/unit/rec_lint.test.ts no `npm test`.
import { PACOTES, AREAS, MARCOS, EXIGE } from './index.js';

const PALAVRAS = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
// infinitivo: a primeira palavra termina em -ar, -er, -ir, -or ou -ôr ("Pôr")
const RE_INFINITIVO = /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]*(ar|er|ir|or|ôr)$/;
// citação no texto principal: "(Autor, 2026" ou "p. 7"
const RE_CITACAO = /\(\D*\d{4}|\bp\.\s?\d/;
const RE_MARCADOR = /\{([a-zA-Z0-9_]+)\}/g;
const TIPOS = ['custo', 'politica', 'uso'];
const IDS_PACOTE = PACOTES.map(p => p[0]);
const IDS_MARCO = MARCOS.map(m => m[0]);

/** Problemas de um texto de ação (`oque`). */
export function lintOque(s) {
  const P = [];
  const t = String(s || '').trim();
  if (!t) return ['oque vazio'];
  const primeira = t.split(/\s+/)[0].replace(/[,;.]$/, '');
  if (!RE_INFINITIVO.test(primeira)) P.push('oque não começa com verbo no infinitivo: "' + primeira + '"');
  if (PALAVRAS(t) > 25) P.push('oque com ' + PALAVRAS(t) + ' palavras (máximo 25)');
  if (t.includes(':')) P.push('oque usa ":" para separar diagnóstico e ação');
  if (RE_CITACAO.test(t)) P.push('oque traz citação');
  return P;
}

/** Problemas de um texto de razão (`porque`). */
export function lintPorque(s) {
  const t = String(s || '').trim();
  if (!t) return ['porque vazio'];
  const P = [];
  if (PALAVRAS(t) > 30) P.push('porque com ' + PALAVRAS(t) + ' palavras (máximo 30)');
  if (RE_CITACAO.test(t)) P.push('porque traz citação');
  if (/^A resposta\b/.test(t)) P.push('porque repete a resposta');
  return P;
}

/** Problemas de uma regra (lista vazia = válida). */
export function lintRegra(r) {
  const P = [];
  const id = r && r.id;
  const add = m => P.push((id || '?') + ': ' + m);
  if (!r || typeof r !== 'object') return ['regra inválida'];
  if (!/^R-\d{2,3}$/.test(String(id))) add('id fora do formato R-nn');
  if (typeof r.versao !== 'number') add('sem versao');
  if (!IDS_PACOTE.includes(r.pacote)) add('pacote inválido: ' + r.pacote);
  if (!TIPOS.includes(r.tipo)) add('tipo inválido: ' + r.tipo);
  if (!Array.isArray(r.substitui)) add('sem substitui (use [] se for nova)');
  if (!Array.isArray(r.campos) || !r.campos.length) add('sem campos de origem');
  if (typeof r.se !== 'function') add('sem gatilho se(k)');
  if (!Array.isArray(r.quem) || !r.quem.length) add('sem quem');
  else r.quem.forEach(q => { if (!AREAS[q]) add('quem desconhecido: ' + q); });
  if (typeof r.marco !== 'function' && !IDS_MARCO.includes(r.marco)) add('marco inválido: ' + r.marco);
  if (!String(r.paraque || '').trim()) add('sem paraque');
  if (!String(r.pronto || '').trim() && !(r.variantes || []).every(v => String(v.pronto || '').trim())) add('pronto vazio');
  ['condicao', 'alta', 'numero', 'vars', 'origem', 'provisoria', 'passos'].forEach(c => { if (r[c] != null && typeof r[c] !== 'function') add(c + ' deve ser função de k'); });
  if (r.requer != null && !Array.isArray(r.requer)) add('requer deve ser lista de campos');
  if (r.depende != null && !Array.isArray(r.depende)) add('depende deve ser lista de ids');
  // custo → cláusula exigida (ou motivo explícito para não haver)
  if (r.exige != null) {
    if (!Array.isArray(r.exige)) add('exige deve ser lista');
    else r.exige.forEach(x => { if (!EXIGE[x]) add('exige desconhecido: ' + x); });
  }
  if ((r.tipo === 'custo' || r.pacote === 'CONTRATO') && !(Array.isArray(r.exige) && r.exige.length) && !String(r.semExige || '').trim())
    add('regra de custo ou de contrato sem exige (ou semExige com o motivo)');
  // variantes
  const V = r.variantes;
  if (!Array.isArray(V) || !V.length) { add('sem variantes'); return P; }
  V.forEach((v, i) => {
    const pre = 'variante ' + (i + 1) + ': ';
    if (i === V.length - 1 && v.quando) add(pre + 'a última variante não pode ter quando (é a padrão)');
    if (i < V.length - 1 && typeof v.quando !== 'function') add(pre + 'sem quando(k)');
    lintOque(v.oque).forEach(m => add(pre + m));
    lintPorque(v.porque).forEach(m => add(pre + m));
    if (!Array.isArray(v.como) || v.como.length < 2 || v.como.length > 4) add(pre + 'como precisa de 2 a 4 passos');
    else v.como.forEach((c, j) => { if (!String(c || '').trim()) add(pre + 'passo ' + (j + 1) + ' vazio'); });
    if (v.marco != null && !IDS_MARCO.includes(v.marco)) add(pre + 'marco inválido');
    if (v.quem != null) (v.quem || []).forEach(q => { if (!AREAS[q]) add(pre + 'quem desconhecido: ' + q); });
    // marcadores só com vars; com numero, a razão leva um número do caso
    const marc = [...String(v.oque + ' ' + v.porque).matchAll(RE_MARCADOR)].map(m => m[1]);
    if (marc.length && typeof r.vars !== 'function') add(pre + 'marcadores {…} sem vars(k, d)');
    if (typeof r.numero === 'function' && !/\{[a-zA-Z0-9_]+\}|\d/.test(String(v.porque))) add(pre + 'regra com numero, mas o porque não traz número do caso');
  });
  return P;
}

/** Problemas do catálogo inteiro: os de cada regra e os ids repetidos (REC-01). */
export function lintCatalogo(regras) {
  const P = [];
  const vistos = new Map();
  (regras || []).forEach(r => {
    lintRegra(r).forEach(m => P.push(m));
    if (vistos.has(r.id)) P.push(r.id + ': id repetido');
    vistos.set(r.id, true);
  });
  return P;
}
