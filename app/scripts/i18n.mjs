// Monta os dicionários de tradução a partir de i18n/*.json (raiz do repositório), com a mesma regra de
// precedência do build.sh da v13: <l>.json, extra_<l>.json, v9_*, v10_*, v11_*, v12_*, v13_*, v0_* (os últimos
// prevalecem); nos idiomas novos (ar zh bm zu sw), <l>.json e v13_*_<l>.json, e o que falta vem do inglês em
// tempo de execução (dicionario(), src/domain/i18n.js). Saída: src/i18n/<l>.json, carregados sob demanda por
// src/i18n/index.ts. Roda no prebuild (`node scripts/i18n.mjs`); a saída não é versionada.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(aqui, '../..');
const ORIGEM = join(RAIZ, 'i18n');
const DESTINO = resolve(aqui, '../src/i18n');

const NOVOS = ['ar', 'zh', 'bm', 'zu', 'sw'];
const IDIOMAS = ['en', 'es', 'fr', ...NOVOS];

const todos = readdirSync(ORIGEM).filter(f => f.endsWith('.json')).sort();
const porPrefixo = (prefixo, l) => todos.filter(f => f.startsWith(prefixo + '_') && f.endsWith('_' + l + '.json'));

mkdirSync(DESTINO, { recursive: true });
const resumo = [];
for (const l of IDIOMAS) {
  const arqs = NOVOS.includes(l)
    ? [`${l}.json`, ...porPrefixo('v13', l)]
    : [`${l}.json`, `extra_${l}.json`, ...['v9', 'v10', 'v11', 'v12', 'v13', 'v0'].flatMap(p => porPrefixo(p, l))];
  const d = {};
  for (const f of arqs) {
    const p = join(ORIGEM, f);
    if (existsSync(p)) Object.assign(d, JSON.parse(readFileSync(p, 'utf8')));
  }
  writeFileSync(join(DESTINO, `${l}.json`), JSON.stringify(d));
  resumo.push(`${l}: ${Object.keys(d).length} chaves de ${arqs.filter(f => existsSync(join(ORIGEM, f))).length} arquivos`);
}
console.log('i18n → src/i18n/: ' + resumo.join('; '));
