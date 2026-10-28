// Os textos novos da interface v14 estão traduzidos nos nove idiomas da v13 (português é a chave).
// A lista de chaves vem de scripts/chaves-v14.mjs (chamadas t/tx/plural e mapas de textos); os dicionários
// mesclados, de scripts/i18n.mjs (i18n/<l>.json + v9…v14_*).
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
execFileSync('node', ['scripts/i18n.mjs'], { cwd: APP });
execFileSync('node', ['scripts/chaves-v14.mjs'], { cwd: APP });
const chaves: string[] = JSON.parse(fs.readFileSync(path.join(APP, '..', 'i18n', 'v14_chaves.json'), 'utf8'));
const marcas = (s: string) => (s.match(/\{[a-zA-Z]+\}/g) || []).sort().join(',');

describe('traduções da interface v14', () => {
  it('a lista de chaves não está vazia', () => { expect(chaves.length).toBeGreaterThan(300); });
  for (const l of ['en', 'es', 'fr', 'ar', 'zh', 'bm', 'zu', 'sw']) {
    it(`${l}: todas as chaves traduzidas, com os mesmos marcadores`, () => {
      const d = JSON.parse(fs.readFileSync(path.join(APP, 'src', 'i18n', `${l}.json`), 'utf8'));
      const faltam = chaves.filter((k) => !(k in d) || !String(d[k]).trim());
      expect(faltam, faltam.slice(0, 5).join(' | ')).toEqual([]);
      const ruins = chaves.filter((k) => marcas(k) !== marcas(String(d[k])));
      expect(ruins, ruins.slice(0, 5).join(' | ')).toEqual([]);
    });
  }
});
