// v020/v021: o percurso "Educando com e sem IA" aparece traduzido em todos os idiomas. Cobre o que as chamadas t('...')
// literais não cobrem (scripts/chaves-v14.mjs): nomes do catálogo, títulos das telas, partes das contas e bases dos
// custos adicionais. Em es, fr, ar, zh e sw a tradução não pode ser a cópia do inglês; em ar e zh, não pode trazer
// palavras em alfabeto latino além de nomes próprios e siglas. bm e zu usam o inglês (traduções preliminares).
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIAS_ED, DESAFIOS_ED, AMBIENTES, MODALIDADES, FASES_PADRAO, COMPONENTES, IA_TIPO, IA_ARQ, IA_PAG, IA_LIC, ligadoPadrao, publicoSugerido, IA_PADRAO } from '../../src/percurso/educacaoV20';
import { TITULOS, NOTA_TIPO } from '../../src/screens/EducacaoV20';
import { normalizar } from '../../src/domain';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
execFileSync('node', ['scripts/i18n.mjs'], { cwd: APP });
const dic = (l: string) => JSON.parse(fs.readFileSync(path.join(APP, 'src', 'i18n', `${l}.json`), 'utf8'));

// v021: o catálogo de linhas (nomes, contas, parâmetros, preços, unidades, notas, papéis) e as escolhas da ferramenta de IA
const linhas = COMPONENTES.flatMap((c) => [c.nome, c.formula, c.unidade, c.nota, c.preco?.rotulo, ...(c.params || []).map((p) => p.rotulo), ...(c.papeis || []).map((p) => p.papel)]).filter(Boolean) as string[];
const motivos = [...new Set(COMPONENTES.map((c) => ligadoPadrao(c, 'C99', { ...publicoSugerido({ ctx: {} } as any, 'C32'), modalidade: 'presencial' }, { ...IA_PADRAO, arq: 'zz' }).motivo).filter(Boolean))] as string[];
const ia = [...IA_TIPO, ...IA_ARQ, ...IA_PAG, ...IA_LIC].map((x) => x[1]);
const contas = linhas;
const TEXTOS = [...new Set([
  ...DESAFIOS_ED.flatMap((d) => [d.nome, d.desc]),
  ...CATEGORIAS_ED.flatMap((c) => [c.nome, ...c.opcoes.map((o) => o.nome)]),
  ...AMBIENTES.map((a) => a[1]), ...MODALIDADES.map((m) => m[1]), ...FASES_PADRAO.map((f) => f.nome),
  ...Object.values(TITULOS), ...Object.values(NOTA_TIPO), ...linhas, ...motivos, ...ia,
  'trabalho de pessoas', 'trabalho e viagens', 'custo direto e viagens', 'Com IA', 'Sem IA', 'Meses',
  'Diagrama do modelo de custo', 'Desafios e dimensões', 'Cada desafio traz suas categorias de custo', 'Escolha uma ou mais',
  'valores que a equipe já tem', 'itens ainda sem valor',
])];
const valor = (d: Record<string, string>, k: string) => d[k] ?? d[normalizar(k).chave];
// iguais ao inglês e corretos no idioma
const IGUAIS: Record<string, string[]> = { fr: ['Infrastructure', 'Phase', 'Phases', 'Mode', 'Plan', 'Usage', 'maintenance', 'Offline', 'Online', 'kWh', 'Mediation', 'Coaching individuel', 'kits', 'pages'], es: ['Offline', 'Online', 'kWh', 'kits'], sw: ['Offline', 'Online', 'kWh'] };
// siglas e unidades técnicas (GB, kWh, Mbps, GPU, RAG, ML, API, SaaS, US$) ficam em alfabeto latino também em árabe e chinês
const NOMES = /\b(STEAM|UNESCO|IA\.EDU|Krueger|Jackson|AI|SEL|TVET|offline|Offline|online|Online|coaching|tokens|software|hardware|GB|kWh|kW|Mbps|GPUs?|RAG|ML|API|SaaS|US|ILOSTAT|IMF|SSA|PPP|ITU|ESMAP|PVOUT|UNICEF|MICS|UIS|Doing Business|ILO|GPU)\b|\{[a-zA-Z0-9]+\}/g;

describe('v021: Educando com e sem IA traduzido em todos os idiomas', () => {
  it('o catálogo tem textos para conferir', () => { expect(TEXTOS.length).toBeGreaterThan(60); expect(contas.length).toBeGreaterThan(200); expect(motivos.length).toBe(3); });
  const en = dic('en');
  for (const l of ['en', 'es', 'fr', 'ar', 'zh', 'sw', 'bm', 'zu']) {
    it(`${l}: todos os textos têm tradução`, () => {
      const d = dic(l);
      const faltam = TEXTOS.filter((k) => !String(valor(d, k) ?? '').trim());
      expect(faltam, faltam.slice(0, 8).join(' | ')).toEqual([]);
    });
  }
  for (const l of ['es', 'fr', 'ar', 'zh', 'sw']) {
    it(`${l}: nenhuma tradução é cópia do inglês`, () => {
      const d = dic(l);
      const copias = TEXTOS.filter((k) => { const v = valor(d, k), e = valor(en, k); return v === e && /[A-Za-z]{3,}/.test(v) && !(IGUAIS[l] || []).includes(v); });
      expect(copias, copias.slice(0, 8).join(' | ')).toEqual([]);
    });
  }
  for (const l of ['ar', 'zh']) {
    it(`${l}: sem palavras em alfabeto latino além de nomes e siglas`, () => {
      const d = dic(l);
      const latinas = TEXTOS.filter((k) => /[A-Za-z]{2,}/.test(String(valor(d, k)).replace(NOMES, '')));
      expect(latinas, latinas.slice(0, 8).map((k) => k + ' → ' + valor(d, k)).join(' | ')).toEqual([]);
    });
  }
});
