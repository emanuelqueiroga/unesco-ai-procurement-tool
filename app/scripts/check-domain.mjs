// Guarda da separação domínio/interface (design/redesign/02-especificacao-reimplementacao.md, "Módulos reaproveitados"):
// nenhum arquivo de src/domain/ nem de src/plano/ (seções e PDF do plano; exceto as fontes geradas,
// fontes_pdf.generated.js) pode tocar o DOM (document., innerHTML, window.), o localStorage nem a global S da aplicação legada. Sai com código 1 e lista as ocorrências; 0 quando está limpo.
// Uso: node scripts/check-domain.mjs  (ou npm run lint:domain)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = [path.join(RAIZ, 'src', 'domain'), path.join(RAIZ, 'src', 'plano')];
const IGNORADOS = new Set(['fontes_pdf.generated.js']);

// [descrição, regex]. Para S: qualquer acesso `S.` ou `typeof S` que não seja de uma variável local
// (declarada com const/let/var dentro de uma função, isto é, numa linha indentada).
const PROIBIDOS = [
  ['document.', /(?<![\w$.])document\./],
  ['innerHTML', /\binnerHTML\b/],
  ['localStorage', /\blocalStorage\b/],
  ['window.', /(?<![\w$.])window\./],
  ['global S', /(?<![\w$.'"`])(?:S\.|S\[|typeof S\b)/],
];

// remove comentários (// e /* */) para que só código conte; cadeias de texto ficam
function semComentarios(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

const arquivos = DIRS.filter(d => fs.existsSync(d)).flatMap(d => fs.readdirSync(d).filter(f => /\.(js|ts|mjs)$/.test(f) && !IGNORADOS.has(f)).sort()
  .map(f => path.relative(path.join(RAIZ, 'src'), path.join(d, f))));
const falhas = [];
for (const f of arquivos) {
  const src = semComentarios(fs.readFileSync(path.join(RAIZ, 'src', f), 'utf8'));
  const linhas = src.split('\n');
  // declarações locais de S (dentro de função): `  const S = ...`
  const temSLocal = linhas.some(l => /^\s+(const|let|var)\s+S\b/.test(l));
  linhas.forEach((l, i) => {
    for (const [nome, re] of PROIBIDOS) {
      if (!re.test(l)) continue;
      if (nome === 'global S' && temSLocal && /\bS\.(push|length|filter|map|forEach|reduce|some|every|find)\b/.test(l)) continue;
      falhas.push(`${f}:${i + 1}: ${nome} → ${l.trim().slice(0, 120)}`);
    }
  });
}
if (falhas.length) {
  console.error('check-domain: ' + falhas.length + ' ocorrência(s) proibida(s) em src/domain/ ou src/plano/');
  falhas.forEach(x => console.error('  ' + x));
  process.exit(1);
}
console.log('check-domain: ' + arquivos.length + ' arquivos em src/domain/ e src/plano/ sem document., innerHTML, localStorage, window. nem S global.');
