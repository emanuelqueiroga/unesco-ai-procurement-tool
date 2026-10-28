// Ajuda e glossário (AJU): lógica pura de domain/glossario.js e domain/ajuda.js, mais as regras de texto da 0.0.15
// (painel com no máximo 80 palavras, dica com até 170 caracteres, toda marca [[id]] existe no glossário) e o vocabulário
// "capítulo/pergunta" (AJU-17). O ambiente é node (sem DOM): o balão do termo é conferido no navegador.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GLOSSARIO, glossarioLista, glossarioPartes, glossarioSemMarcas, glossarioMarcas, glossarioTextos, termoDe,
  ajudaDaPergunta, quemSabe, ajudaDeTela, ajudaDoPasso, dicaDoCampo, dicaDaTela, ajudaTextos, DICAS, DICA_NA_TELA, PASSO_AJUDA, INFO_C236,
  CAMPOS, CAMPO_POR_ID, QUESTOES_G,
} from '../../src/domain';
import { ESSENCIAL } from '../../src/store';
import { LEAD, CAPITULOS_INFO } from '../../src/percurso/textos';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const palavras = (s: string) => String(s).replace(/\[\[[a-z0-9]+\|?|\]\]/g, ' ').split(/\s+/).filter(Boolean).length;
const todasAsMarcas = (s: string) => glossarioMarcas(s);

describe('glossário (AJU-10)', () => {
  it('tem os 15 termos da 0.0.15, com id único e definição', () => {
    expect(GLOSSARIO.map((g) => g.id)).toEqual(['tco', 'api', 'pesos', 'eti', 'capital', 'corrente', 'desconto', 'recorrente', 'saas', 'poc', 'piloto', 'camada', 'p10p90', 'linhabase', 'dotacao']);
    expect(new Set(GLOSSARIO.map((g) => g.id)).size).toBe(15);
    GLOSSARIO.forEach((g) => { expect(g.termo, g.id).toBeTruthy(); expect(g.def.length, g.id).toBeGreaterThan(40); });
  });
  it('a definição não traz marcas', () => { GLOSSARIO.forEach((g) => expect(g.def, g.id).not.toMatch(/\[\[/)); });
  it('termoDe devolve o verbete ou null', () => {
    expect(termoDe('tco')?.termo).toBe('TCO');
    expect(termoDe('dotacao')?.def).toMatch(/exercício/);
    expect(termoDe('nao-existe')).toBeNull();
  });
  it('glossarioLista: { id, termo, def } em ordem alfabética do termo, em português', () => {
    const L = glossarioLista();
    expect(L).toHaveLength(15);
    L.forEach((x) => { expect(x.id && x.termo && x.def).toBeTruthy(); });
    expect(L.map((x) => x.termo)).toEqual([...L.map((x) => x.termo)].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })));
    expect(L[0].termo).toBe('API');
    expect(L.find((x) => x.id === 'eti')?.extenso).toBe('equivalente a tempo integral');
  });
  it('glossarioLista com tradutor traduz e reordena pelo termo traduzido', () => {
    const en: Record<string, string> = { 'Dotação': 'Appropriation', 'Camada': 'Layer', 'TCO': 'TCO' };
    const L = glossarioLista((s: string) => en[s] ?? s, 'en');
    expect(L.find((x) => x.id === 'dotacao')?.termo).toBe('Appropriation');
    expect(L.map((x) => x.termo)).toEqual([...L.map((x) => x.termo)].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })));
  });
  it('glossarioTextos lista rótulos, termos, definições e extensos', () => {
    const tx = glossarioTextos();
    expect(tx).toContain('Glossário');
    expect(tx).toContain('Definição de');
    GLOSSARIO.forEach((g) => { expect(tx).toContain(g.def); });
  });
});

describe('marcas [[id]] e [[id|texto]]', () => {
  it('glossarioPartes separa texto e termos', () => {
    const p = glossarioPartes('Custo [[recorrente|recorrente]] e [[piloto]] no [[capital|orçamento de capital]].');
    expect(p).toEqual([
      { texto: 'Custo ' }, { id: 'recorrente', rotulo: 'recorrente', termoPadrao: false },
      { texto: ' e ' }, { id: 'piloto', rotulo: 'Piloto', termoPadrao: true },
      { texto: ' no ' }, { id: 'capital', rotulo: 'orçamento de capital', termoPadrao: false }, { texto: '.' },
    ]);
  });
  it('marca desconhecida vira texto; texto sem marca fica inteiro; vazio dá lista vazia', () => {
    expect(glossarioPartes('a [[xyz|tal]] b')).toEqual([{ texto: 'a ' }, { texto: 'tal' }, { texto: ' b' }]);
    expect(glossarioPartes('sem marca')).toEqual([{ texto: 'sem marca' }]);
    expect(glossarioPartes('')).toEqual([]);
    expect(glossarioPartes(null as unknown as string)).toEqual([]);
  });
  it('chamadas seguidas não compartilham o estado do regex (lastIndex)', () => {
    const t = 'um [[tco]] e um [[api]]';
    expect(glossarioPartes(t)).toEqual(glossarioPartes(t));
    expect(glossarioMarcas(t)).toEqual(['tco', 'api']);
    expect(glossarioMarcas(t)).toEqual(['tco', 'api']);
    expect(glossarioSemMarcas(t)).toBe('um TCO e um API');
    expect(glossarioSemMarcas(t)).toBe('um TCO e um API');
  });
  it('glossarioSemMarcas usa o texto da marca quando há', () => {
    expect(glossarioSemMarcas('Na [[poc|prova de conceito]] testa-se; no [[piloto]], o uso real.')).toBe('Na prova de conceito testa-se; no Piloto, o uso real.');
  });
});

describe('ajuda das perguntas (AJU-04, AJU-05)', () => {
  it('toda tela do Essencial tem "Como responder" e "Quem costuma saber"', () => {
    ESSENCIAL.forEach((t) => {
      const a = ajudaDeTela(t.n);
      expect(a, t.id).not.toBeNull();
      expect(a!.como, t.id + ' como').toBeTruthy();
      expect(a!.quem, t.id + ' quem').toBeTruthy();
    });
  });
  it('toda pergunta tem "Quem costuma saber", inclusive as do Refinar', () => {
    [...(CAMPOS as any[]), ...(QUESTOES_G as any[])].forEach((c) => { expect(quemSabe(c.n), c.n).toBeTruthy(); });
  });
  it('as partes de uma tela somam até 80 palavras, com os rótulos', () => {
    const rotulos = palavras('Como responder') + palavras('Quem costuma saber') + palavras('Exemplo');
    const casos: [string, any][] = ESSENCIAL.map((t) => [t.id, ajudaDeTela(t.n)]);
    casos.push(['piloto/poc', ajudaDeTela(['2.3.8'], { modo: 'poc' })], ['piloto/ambos', ajudaDeTela(['2.3.8'], { modo: 'ambos' })]);
    casos.forEach(([id, a]) => {
      const n = rotulos + palavras(a.como || '') + palavras(a.quem || '') + palavras(a.exemplo || '');
      expect(n, id).toBeLessThanOrEqual(80);
    });
  });
  it('o tamanho do teste (2.3.8) muda com o tipo de teste', () => {
    const base = ajudaDaPergunta('2.3.8');
    const poc = ajudaDaPergunta('2.3.8', { modo: 'poc' });
    const ambos = ajudaDaPergunta('2.3.8', { modo: 'ambos' });
    expect(poc!.como).toMatch(/prova de conceito/);
    expect(ambos!.como).toMatch(/depois o piloto/);
    expect(new Set([base!.como, poc!.como, ambos!.como]).size).toBe(3);
    expect(ajudaDaPergunta('2.3.8', { modo: 'piloto' })).toEqual(base);
    expect(ajudaDaPergunta('2.3.4', { modo: 'poc' })).toEqual(ajudaDaPergunta('2.3.4'));
  });
  it('ajudaDaPergunta e quemSabe: número exato, número do passo e desconhecido', () => {
    expect(quemSabe('2.4.1')).toBe('tecnologia da informação e infraestrutura escolar');
    expect(quemSabe('2.4')).toBe('tecnologia da informação e infraestrutura escolar');
    expect(quemSabe('4.2')).toBe('finanças e orçamento');
    expect(quemSabe('1.3.3')).toBe('assessoria jurídica');
    expect(quemSabe('9.9.9')).toBeNull();
    expect(quemSabe('')).toBeNull();
    expect(quemSabe(undefined as unknown as string)).toBeNull();
    expect(ajudaDaPergunta('abc')).toBeNull();
    const a = ajudaDaPergunta('3.1.1')!;
    expect(a).toEqual({ como: PASSO_AJUDA['3.1'].como, quem: PASSO_AJUDA['3.1'].quem, exemplo: PASSO_AJUDA['3.1'].ex });
  });
  it('uma tela de várias perguntas junta as partes na ordem dada', () => {
    const a = ajudaDeTela(['2.5.1', '2.5.4'])!;
    expect(a.como).toBe(PASSO_AJUDA['2.5'].como);
    expect(a.exemplo).toBe(PASSO_AJUDA['2.5'].ex);
    expect(ajudaDeTela([])).toBeNull();
    expect(ajudaDeTela(['x.y'])).toBeNull();
  });
  it('ajudaDoPasso traz as cinco partes da 0.0.15 para os 15 passos', () => {
    ['1.1', '1.2', '1.3', '2.0', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '3.1', '3.2', '4.1', '4.2', '4.3'].forEach((n) => {
      const a = ajudaDoPasso(n)!;
      expect(a, n).toBeTruthy();
      ['serve', 'importa', 'como', 'quem', 'ex'].forEach((k) => expect((a as any)[k], n + k).toBeTruthy());
    });
    expect(ajudaDoPasso('9.9')).toBeNull();
  });
});

describe('dicas (AJU-09)', () => {
  it('são as 23 da 0.0.15, de campos que existem, com até 170 caracteres sem as marcas', () => {
    expect(Object.keys(DICAS)).toHaveLength(23);
    Object.entries(DICAS).forEach(([id, d]) => {
      expect((CAMPO_POR_ID as any)[id], id).toBeTruthy();
      expect(glossarioSemMarcas(d).length, id).toBeLessThanOrEqual(170);
    });
  });
  it('dicaDoCampo e dicaDaTela', () => {
    expect(dicaDoCampo('tipoTec')).toMatch(/Gratuita não é o mesmo que sem custo/);
    expect(dicaDoCampo('local')).toBeNull();
    expect(dicaDaTela(['tipoTec'])).toBe(DICAS.tipoTec);
    expect(dicaDaTela(['formacaoHoras', 'formados'])).toBe(DICAS.formacaoHoras);
    expect(dicaDaTela(['nivel'])).toBeNull();
    DICA_NA_TELA.forEach((c) => expect(DICAS[c as keyof typeof DICAS], c).toBeTruthy());
  });
  it('as dicas do Essencial cabem na tela: só as marcadas aparecem, e são de campos do Essencial', () => {
    const campos = new Set(ESSENCIAL.flatMap((t) => t.campos));
    DICA_NA_TELA.forEach((c) => expect(campos.has(c), c).toBe(true));
  });
});

describe('marcas e vocabulário nos textos (AJU-13, AJU-17)', () => {
  const textos = [
    ...ajudaTextos(), ...Object.values(LEAD),
    ...Object.values(CAPITULOS_INFO).flatMap((i) => [i.guia, i.texto, i.entrega, i.alimenta]),
  ];
  it('toda marca existe no glossário', () => {
    textos.forEach((s) => glossarioMarcas(s).forEach((id) => expect(termoDe(id), `${id} em «${s.slice(0, 50)}»`).not.toBeNull()));
  });
  it('as marcas estão equilibradas ([[ sempre fecha com ]])', () => {
    textos.forEach((s) => { expect((s.match(/\[\[/g) || []).length, s.slice(0, 50)).toBe((s.match(/\]\]/g) || []).length); });
  });
  it('os termos do glossário estão marcados onde aparecem nas dicas e na ajuda', () => {
    expect(todasAsMarcas(DICAS.testes)).toEqual(['poc', 'piloto']);
    expect(todasAsMarcas(DICAS.arquitetura)).toEqual(['saas', 'api', 'pesos']);
    expect(todasAsMarcas(PASSO_AJUDA['4.2'].serve)).toEqual(['tco', 'camada', 'dotacao']);
    expect(todasAsMarcas(LEAD.piloto)).toEqual(['piloto']);
  });
  it('nenhum texto de ajuda diz "passo" ou "fase" onde a versão fala "capítulo" ou "pergunta"', () => {
    const ruins = textos.filter((s) => /\b(passos?|fases?)\b/i.test(s));
    expect(ruins).toEqual([]);
  });
  it('a nota das camadas 2, 3 e 6 não aponta para passos que não existem', () => {
    expect(INFO_C236).not.toMatch(/passos?\b/);
    expect(INFO_C236).toMatch(/Krueger e Jackson/);
  });
});

describe('abertura dos capítulos (AJU-01, AJU-03, decisão 7)', () => {
  it('mantém os tempos da nova versão (7, 8, 1 e 2 minutos)', () => {
    expect([1, 2, 3, 4].map((n) => (CAPITULOS_INFO as any)[n].minutos)).toEqual([7, 8, 1, 2]);
  });
  it('"Alimenta:" cita as camadas segundo a 0.0.15', () => {
    const al = (n: number) => (CAPITULOS_INFO as any)[n].alimenta as string;
    expect(al(2)).toMatch(/integração de dados/);
    expect(al(2)).toMatch(/segurança e privacidade/);
    expect(al(3)).toMatch(/aplicações/);
    expect(al(3)).toMatch(/internet e dispositivos/);
    expect(al(3)).toMatch(/formação/);
    expect(al(3)).toMatch(/Refinar/);
    expect(al(3)).not.toMatch(/operação e suporte/);
  });
  it('todo capítulo diz o que a pessoa leva ao final', () => { [1, 2, 3, 4].forEach((n) => expect((CAPITULOS_INFO as any)[n].entrega).toBeTruthy()); });
});

describe('traduções copiadas da 0.0.15 (AJU-14)', () => {
  execFileSync('node', ['scripts/i18n.mjs'], { cwd: APP });
  const dic = (l: string) => JSON.parse(fs.readFileSync(path.join(APP, 'src', 'i18n', `${l}.json`), 'utf8')) as Record<string, string>;
  const textos = [...ajudaTextos(), ...glossarioTextos()];
  for (const l of ['en', 'es', 'fr']) {
    it(`${l}: o que já está traduzido mantém as mesmas marcas do glossário`, () => {
      const d = dic(l);
      const ruins = textos.filter((s) => d[s] != null && glossarioMarcas(s).join() !== glossarioMarcas(d[s]).join());
      expect(ruins, ruins.slice(0, 3).join(' | ')).toEqual([]);
    });
    it(`${l}: os rótulos do glossário e os 15 termos têm tradução`, () => {
      const d = dic(l);
      const faltam = glossarioTextos().filter((s) => !d[s]);
      expect(faltam, faltam.join(' | ')).toEqual([]);
    });
  }
});
