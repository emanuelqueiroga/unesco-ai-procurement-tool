// Gera src/percurso/formulasMetEd.ts: as fórmulas da metodologia da educação em MathML (KaTeX), para a página não
// depender de biblioteca de matemática no navegador. Uso: KATEX=<caminho do katex> npx vite-node scripts/formulas-ed.ts
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { MET_ED } from '../src/percurso/metodologiaEd';
const katex = createRequire(import.meta.url)(process.env.KATEX || 'katex');
const out: Record<string, { b: string; i: string }> = {};
const r = (tex: string, d: boolean) => katex.renderToString(tex, { output: 'mathml', displayMode: d, throwOnError: true, strict: 'ignore' });
for (const [s] of MET_ED.notacao) out[s] = { b: r(s, true), i: r(s, false) };
for (const e of MET_ED.equacoes) for (const x of e.tex) out[x] = { b: r(x, true), i: r(x, false) };
fs.writeFileSync('src/percurso/formulasMetEd.ts', '// Gerado por scripts/formulas-ed.ts (KaTeX, saída MathML). Não editar à mão.\nexport const FORMULAS_MET_ED: Record<string, { b: string; i: string }> = ' + JSON.stringify(out) + ';\n');
console.log(Object.keys(out).length, 'fórmulas');
