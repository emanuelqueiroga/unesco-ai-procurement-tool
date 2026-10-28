// Compila design/redesign/prumo/tokens.json em src/styles/tokens.css.
// Roda no prebuild (`node scripts/tokens.mjs`) e a saída é versionada.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const origem = resolve(aqui, '../../design/redesign/prumo/tokens.json');
const destino = resolve(aqui, '../src/styles/tokens.css');

const tokens = JSON.parse(readFileSync(origem, 'utf8'));

const claro = [];
const escuro = [];

for (const t of tokens.color.tokens) {
  claro.push(`  --${t.name}: ${t.value.light};`);
  escuro.push(`  --${t.name}: ${t.value.dark};`);
}
for (const t of tokens.spacing.tokens) claro.push(`  --${t.name}: ${t.value};`);
for (const t of tokens.radius.tokens) claro.push(`  --${t.name}: ${t.value};`);
for (const t of tokens.shadow.tokens) {
  claro.push(`  --${t.name}: ${t.value.light};`);
  escuro.push(`  --${t.name}: ${t.value.dark};`);
}
for (const [nome, familia] of Object.entries(tokens.type.families)) {
  claro.push(`  --font-${nome}: ${familia};`);
}

const tipografia = [];
for (const grupo of tokens.type.groups) {
  tipografia.push(`/* ${grupo.name} */`);
  for (const s of grupo.styles) {
    const decl = [
      `font-family: var(--font-${grupo.family})`,
      `font-size: ${s.fontSize}`,
      `line-height: ${s.lineHeight}`,
      `font-weight: ${s.fontWeight}`,
    ];
    if (s.letterSpacing) decl.push(`letter-spacing: ${s.letterSpacing}`);
    if (s.name.startsWith('label-')) decl.push('text-transform: uppercase');
    if (s.name.startsWith('kpi-')) decl.push('font-variant-numeric: tabular-nums');
    tipografia.push(`.t-${s.name} { ${decl.join('; ')}; }`);
  }
}

const css = `/* Gerado por scripts/tokens.mjs a partir de design/redesign/prumo/tokens.json. Não edite à mão. */
/* ${tokens.name} v${tokens.version} · tema claro em :root, escuro em [data-theme="dark"] */
:root {
${claro.join('\n')}
}

[data-theme="dark"] {
${escuro.join('\n')}
}

${tipografia.join('\n')}
`;

mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, css);
console.log(`tokens.css: ${tokens.color.tokens.length} cores, ${tipografia.length - tokens.type.groups.length} estilos de texto -> ${destino}`);
