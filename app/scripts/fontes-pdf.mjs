// Fontes do PDF para os idiomas fora do WinAnsi (árabe, chinês e bambara), como o FONTES_PDF que o build.sh da v13
// injetava. Roda tools/subset_fonts.py (Python 3 + fontTools + fontes Noto) e grava src/plano/fontes_pdf.generated.js
// com `export default { ar: {...}, zh: {...}, latin: {...} }`. O gerador do PDF (src/plano/pdf.js) importa esse
// arquivo sob demanda, só quando o idioma precisa dele, para que o pacote principal não cresça.
// Caracteres cobertos: os dicionários do idioma em i18n/ (<l>.json, v13_*_<l>.json e v14_*_<l>.json), o inglês,
// ASCII e Latin-1 (ver o cabeçalho de tools/subset_fonts.py).
// Sem Python, fontTools ou as fontes, o script avisa e grava `export default null`: o PDF sai com a Helvetica e a
// troca de caracteres da v13 (o mesmo que SEM_FONTES=1 no build.sh). SEM_FONTES=1 força esse caminho.
// Uso: node scripts/fontes-pdf.mjs  (ou npm run fontes-pdf)
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(aqui, '../..');
const DESTINO = resolve(aqui, '../src/plano/fontes_pdf.generated.js');
const CABECALHO = '// Gerado por scripts/fontes-pdf.mjs (tools/subset_fonts.py). Não editar.\n/* eslint-disable */\n';

function gravar(obj, nota) {
  mkdirSync(dirname(DESTINO), { recursive: true });
  writeFileSync(DESTINO, CABECALHO + (nota ? '// ' + nota + '\n' : '') + 'export default ' + (obj ? JSON.stringify(obj) : 'null') + ';\n');
}

if (process.env.SEM_FONTES) {
  gravar(null, 'SEM_FONTES: PDF com Helvetica e troca de caracteres');
  console.log('fontes-pdf: SEM_FONTES, gravado ' + DESTINO + ' sem fontes');
  process.exit(0);
}
const r = spawnSync('python3', [join(RAIZ, 'tools', 'subset_fonts.py'), '--relatorio'], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const m = r.status === 0 && /const FONTES_PDF = (\{[\s\S]*\});\s*$/.exec(r.stdout || '');
if (!m) {
  console.warn('fontes-pdf: não foi possível gerar as fontes (' + (r.error ? r.error.message : (r.stderr || '').trim().split('\n').pop() || 'saída inesperada') + ').');
  console.warn('fontes-pdf: o PDF em árabe, chinês e bambara sai com a Helvetica e a troca de caracteres da v13.');
  gravar(null, 'fontes indisponíveis na geração: PDF com Helvetica e troca de caracteres');
  process.exit(0);
}
const fontes = JSON.parse(m[1]);
gravar(fontes);
if (r.stderr) process.stderr.write(r.stderr);
const kb = n => Math.round(n / 1024) + ' KB';
console.log('fontes-pdf: ' + Object.entries(fontes).map(([k, f]) => k + ' (' + f.idiomas.join(', ') + ') ' + kb((f.regular || '').length + (f.bold || '').length)).join('; ') + ' → ' + DESTINO);
