// Lista as chaves de tradução (textos em português) da interface v14 e diz quais faltam em cada idioma.
// Fontes: chamadas t('…'), tx('…') e plural(n, '…', '…') em src/percurso, src/screens e src/ui; os mapas de
// textos (src/percurso/textos.ts, DE_QUEM em Controles.tsx, rótulos dos componentes) e os títulos das páginas
// do plano (TIT_PAGINAS em src/plano/secoes.js). Grava ../i18n/v14_chaves.json e, com --faltam, imprime por
// idioma as chaves que os dicionários mesclados (src/i18n/<l>.json, gerados por scripts/i18n.mjs) não têm.
// Uso: node scripts/i18n.mjs && node scripts/chaves-v14.mjs --faltam
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arquivos = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? arquivos(p) : /\.(tsx?|js)$/.test(f) ? [p] : []; });
const fontes = ['src/percurso', 'src/screens', 'src/ui'].flatMap((d) => arquivos(join(APP, d))).filter((f) => !/Galeria/.test(f));

const chaves = new Set();
const lit = `'((?:[^'\\\\]|\\\\.)*)'`;
const reT = new RegExp(`\\b(?:t|tx)\\(\\s*${lit}`, 'g');
const rePlural = new RegExp(`\\bplural\\([^,]+,\\s*${lit}\\s*,\\s*${lit}`, 'g');
const limpa = (s) => s.replace(/\\'/g, "'").replace(/\\n/g, '\n');
// textos passados a t()/tx()/plural() são sempre de interface, mesmo uma palavra só ("e", "horas", "atual")
const deChamada = new Set();
for (const f of fontes) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(reT)) deChamada.add(limpa(m[1]));
  for (const m of src.matchAll(rePlural)) { deChamada.add(limpa(m[1])); deChamada.add(limpa(m[2])); }
}
deChamada.forEach((k) => chaves.add(k));
// mapas de textos: valores em aspas simples com letras (pares chave: 'valor')
const mapas = [
  ['src/percurso/textos.ts', null],
  ['src/percurso/Controles.tsx', /const DE_QUEM[\s\S]*?\n\};/],
  ['src/ui/Recommendation/Recommendation.tsx', /const PRIORITY_LABEL[^\n]*/],
  ['src/ui/RiskPill/RiskPill.tsx', /RISK_LABELS[^=]*=\s*\{[\s\S]*?\n\};/],
  ['src/ui/SourceTag/SourceTag.tsx', /ORIGIN_LABELS[^=]*=\s*\{[\s\S]*?\n\};/],
  ['src/ui/PlanPanel/PlanPanel.tsx', /const STATE_LABEL[\s\S]*?\n\};/],
  ['src/ui/ChapterNav/ChapterNav.tsx', /const MARK_LABEL[\s\S]*?\n\};/],
  ['src/ui/PilotSize/PilotSize.tsx', /const LABELS[^\n]*/],
  ['src/plano/secoes.js', /const TIT_PAGINAS[^\n]*/],
  ['src/screens/Percurso.tsx', /const TITULO_EXTRA[\s\S]*?\n\};/],
];
const reValor = new RegExp(`:\\s*${lit}`, 'g');
for (const [f, trecho] of mapas) {
  let src = readFileSync(join(APP, f), 'utf8');
  if (trecho) { const m = src.match(trecho); src = m ? m[0] : ''; }
  for (const m of src.matchAll(reValor)) { const v = limpa(m[1]); if (/[a-zà-ú]{2}/i.test(v) && !/^(pr-|pc-|var\(|#|\.\/)/.test(v)) chaves.add(v); }
}
// fora: identificadores, rotas e textos sem letras
const lista = [...chaves].filter((k) => !/\n|\('|'\)/.test(k) && (deChamada.has(k) ? /\p{L}/u.test(k) : /\p{L}{2}/u.test(k) && !/^[a-z]+([-.][a-z]+)*$/.test(k)) && !/^#\//.test(k)).sort((a, b) => a.localeCompare(b, 'pt'));
writeFileSync(join(APP, '..', 'i18n', 'v14_chaves.json'), JSON.stringify(lista, null, 1) + '\n');
console.log(`${lista.length} chaves da interface v14 → i18n/v14_chaves.json`);

if (process.argv.includes('--faltam')) {
  const saida = {};
  for (const l of ['en', 'es', 'fr', 'ar', 'zh', 'bm', 'zu', 'sw']) {
    const p = join(APP, 'src', 'i18n', `${l}.json`);
    const d = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {};
    const falta = lista.filter((k) => !(k in d));
    saida[l] = falta;
    console.log(`${l}: faltam ${falta.length}`);
  }
  if (process.argv.includes('--json')) writeFileSync(join(APP, '..', 'i18n', 'v14_faltam.json'), JSON.stringify(saida, null, 1) + '\n');
}
