// Plano de contratação (src/plano/): seções da página e do PDF (porte de src/resumo.js) e o PDF (porte de
// src/plano_pdf.js). As expectativas vêm dos testes da v13 (tests/test_v9_plano.py, test_v12_pdf.py,
// test_v13_plano.py): A1–A7 e B1–B9 em ordem, matriz entre o resumo e as recomendações, "Respostas que faltam" só no
// plano parcial e referências; aqui, também a página nova de cada seção (v14).
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { useCaso } from '../../src/store/caso';
import { numerosDe } from '../../src/store/selectors';
import { nomeArq } from '../../src/export/json';
import { setDicionarios, setLang, setMoeda, setTabelaMoedas, grande, din, tr, CREDITO_MATRIZ, TIT_MATRIZ } from '../../src/domain';
import { secoesPlano, painelPlano, trSecao, secoesDaPagina, PAGINAS_PLANO, PAGINA_SECAO, TIT_PAGINAS } from '../../src/plano/secoes.js';
import { gerarPDF, nomeArqPDF, pdfTxt, quebrarCJK, carregarFontesPDF } from '../../src/plano/pdf.js';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(AQUI, '..', '..', '..');
const lerJSON = (f: string) => JSON.parse(fs.readFileSync(f, 'utf8'));
const IDIOMAS = ['en', 'es', 'fr', 'ar', 'zh', 'bm'];
const dataURI = (f: string, mime: string) => 'data:' + mime + ';base64,' + fs.readFileSync(path.join(RAIZ, f)).toString('base64');

beforeAll(() => {
  const dic: Record<string, any> = {};
  IDIOMAS.forEach(l => { const f = path.join(AQUI, '..', '..', 'src', 'i18n', l + '.json'); dic[l] = fs.existsSync(f) ? lerJSON(f) : {}; });
  setDicionarios(dic);
  setTabelaMoedas(lerJSON(path.join(RAIZ, 'data', 'moedas.json')));
});
afterEach(() => { setLang('pt'); setMoeda({ cod: 'USD', taxa: '', taxaDe: '' }); });

function exemplo(k: string): any {
  setLang('pt');
  useCaso.getState().carregarExemplo(k);
  const e: any = useCaso.getState().estado();
  setMoeda(e.moeda);
  return e;
}
const A_ = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'], B_ = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9'];
const IDS = ['resumo', 'perfil', 'matriz', 'recs', 'A', ...A_, 'B', ...B_, 'refs'];

// todos os textos de uma estrutura (strings em qualquer profundidade)
function textos(x: any, out: string[] = []): string[] {
  if (typeof x === 'string') out.push(x);
  else if (Array.isArray(x)) x.forEach(z => textos(z, out));
  else if (x && typeof x === 'object') Object.values(x).forEach(z => textos(z, out));
  return out;
}
const RUIM = /undefined|NaN|\bnull\b|\[object/;

describe('secoesPlano', () => {
  for (const k of ['A', 'B', 'C', 'D']) {
    it(`exemplo ${k}: seções da v13 em ordem, com página e sem textos quebrados`, () => {
      const e = exemplo(k);
      const antes = JSON.stringify(e);
      const secs = secoesPlano(e);
      expect(JSON.stringify(e), 'o estado não muda').toBe(antes);
      const ids = secs.filter((s: any) => !s.sub).map((s: any) => s.id);
      expect(ids).toEqual(IDS);   // exemplos completos: sem "Respostas que faltam"
      // A1–A7 dentro do bloco A, B1–B9 dentro do bloco B (test_v9_plano.py)
      expect(ids.indexOf('A')).toBeLessThan(ids.indexOf('A1'));
      expect(ids.indexOf('B')).toBeGreaterThan(ids.indexOf('A7'));
      // páginas: todas válidas; seções de primeiro nível conforme PAGINA_SECAO; subseções herdam (salvo as do apêndice)
      let pai: any = null;
      for (const s of secs) {
        expect(PAGINAS_PLANO, `${s.id || s.h}`).toContain(s.pagina);
        if (!s.sub) { expect(s.pagina).toBe((PAGINA_SECAO as Record<string, string>)[s.id]); pai = s; }
        else if (s.tipo !== 'figura' && pai.id !== 'perfil') expect(s.pagina, s.h).toBe(pai.pagina);
      }
      expect(secs.find((s: any) => s.id === 'fig-tco').pagina).toBe('apendice');
      // nenhum texto com undefined, NaN, null ou [object, em português e traduzido
      const ruins = textos(secs).filter(t => RUIM.test(t));
      expect(ruins).toEqual([]);
      setLang('en');
      const en = secoesPlano(e).map(trSecao);
      expect(textos(en).filter(t => RUIM.test(t))).toEqual([]);
      expect(en.find((s: any) => s.id === 'A2').h).toBe('A2. ' + tr('Custo estimado (ilustrativo)'));
    });
  }

  it('números-chave iguais aos de numerosDe (A2, painel e matriz)', () => {
    for (const k of ['A', 'B', 'C', 'D']) {
      const e = exemplo(k), n = numerosDe(e);
      const secs = secoesPlano(e);
      const a2 = secs.find((s: any) => s.id === 'A2');
      expect(a2.graf.total).toBeCloseTo(n.total, 6);
      expect(a2.graf.anual).toBeCloseTo(n.anual, 6);
      expect(a2.graf.tot0).toBeCloseTo(n.ano0, 2);
      expect(a2.kv[1]).toEqual(['Custo total do ciclo de vida', grande(n.total)]);
      expect(a2.kv[2]).toEqual(['Dotação média por ano de operação', grande(n.anual)]);
      expect(a2.kv[3]).toEqual(['Por usuário ativo por ano', din(n.porAluno, 2)]);
      const P = painelPlano(e);
      expect(P.kpis.map((z: any) => z[1])).toEqual(a2.kv.slice(0, 4).map((z: any) => z[1]));
      expect(P.principal).toMatch(/\S/);
      expect(P.fatos.length).toBeGreaterThan(3);
      expect(P.cartoes.length).toBeGreaterThanOrEqual(7);
      expect(P.faltas).toBeNull();
      // matriz 7 × 4 com linha de total; soma das células = custo total do ciclo (test_v13_plano.py)
      const mx = secs.find((s: any) => s.id === 'matriz');
      expect(mx.mx.linhas.length).toBe(7);
      expect(mx.mx.fases.map((f: any) => f.id)).toEqual(['contexto', 'piloto', 'implantacao', 'expansao']);
      expect(mx.table.rows.length).toBe(8);
      expect(Math.abs(mx.mx.total - n.total)).toBeLessThan(0.5);
      expect(mx.mx.somas[0]).toBeNull();
      expect(mx.h).toBe(TIT_MATRIZ);
      expect(mx.pos).toContain(CREDITO_MATRIZ);
    }
  });

  it('exemplo C recomenda prova de conceito com motivo (A1)', () => {
    const a1 = secoesPlano(exemplo('C')).find((s: any) => s.id === 'A1');
    expect(a1.p.join(' ')).toContain('Recomendação: começar por uma prova de conceito');
    expect(a1.p).toContain('Por quê:');
    expect(a1.list.length).toBeGreaterThan(0);
  });

  it('caso em branco: plano parcial com as respostas que faltam', () => {
    const e = exemplo('novo');
    const secs = secoesPlano(e);
    const ids = secs.filter((s: any) => !s.sub).map((s: any) => s.id);
    expect(ids).toEqual(['faltas', ...IDS]);
    const f = secs[0];
    expect(f.tipo).toBe('faltas');
    expect(f.pagina).toBe('apendice');
    expect(f.p[0]).toMatch(/^Plano parcial: \d+ perguntas? sem resposta\.$/);
    expect(f.list.length).toBeGreaterThan(5);
    expect(f.list.some((z: string) => /^1\.1\.\d/.test(z))).toBe(true);
    expect(f.irs.length).toBe(f.list.length);
    expect(textos(secs).filter(t => RUIM.test(t))).toEqual([]);
    // no apêndice, as respostas que faltam ficam no fim; o painel traz o aviso
    const ap = secoesDaPagina(secs, 'apendice');
    expect(ap[ap.length - 1].id).toBe('faltas');
    expect(ap.filter((s: any) => !s.sub).map((s: any) => s.id)).toEqual(['perfil', 'matriz', 'refs', 'faltas']);
    const P = painelPlano(e);
    expect(P.faltas && P.faltas.list.length).toBe(f.list.length);
    // A2 com aviso de premissas padrão
    expect(secs.find((s: any) => s.id === 'A2').pre[0]).toMatch(/^Estimativa baseada em premissas padrão: \d+ perguntas ainda sem resposta\.$/);
  });

  it('secoesDaPagina: cada página com as suas seções, na ordem do plano', () => {
    const secs = secoesPlano(exemplo('A'));
    const de = (pg: string) => secoesDaPagina(secs, pg).filter((s: any) => !s.sub).map((s: any) => s.id);
    expect(PAGINAS_PLANO).toEqual(['resumo', 'custa', 'fazer', 'exigir', 'apendice']);
    expect(Object.keys(TIT_PAGINAS)).toEqual(PAGINAS_PLANO);
    expect(de('resumo')).toEqual(['resumo']);
    expect(de('custa')).toEqual(['A', 'A2', 'A3']);
    expect(de('fazer')).toEqual(['recs', 'A1', 'B', 'B1', 'B2', 'B3', 'B4', 'B7', 'B8', 'B9']);
    expect(de('exigir')).toEqual(['A4', 'A5', 'A6', 'A7', 'B5', 'B6']);
    expect(de('apendice')).toEqual(['perfil', 'matriz', 'refs']);
    expect(secoesDaPagina(secs, 'apendice').map((s: any) => s.id || s.h)).toEqual(['perfil', 'Ferramentas', 'Etapas, escolas e estudantes', 'matriz', 'fig-tco', 'refs']);
    expect(PAGINAS_PLANO.reduce((n, pg) => n + secoesDaPagina(secs, pg).length, 0)).toBe(secs.length);
  });

  it('figura: omitida com figura: false; data URI vai em img', () => {
    const e = exemplo('A');
    expect(secoesPlano(e, { figura: false }).some((s: any) => s.id === 'fig-tco')).toBe(false);
    expect(secoesPlano(e, { figura: 'data:image/jpeg;base64,AAAA' }).find((s: any) => s.id === 'fig-tco').img).toBe('data:image/jpeg;base64,AAAA');
  });
});

describe('PDF', () => {
  const paginas = (doc: any) => doc.getNumberOfPages();
  const bytes = (doc: any) => (doc.output('arraybuffer') as ArrayBuffer).byteLength;

  it('nome do arquivo como na v13', () => {
    const e = exemplo('A');
    expect(nomeArqPDF(e)).toBe(nomeArq(e, 'pdf'));
    expect(nomeArqPDF(e)).toMatch(/^procurement-plan-[a-z0-9-]+\.pdf$/);
  });

  it('pdfTxt troca o que está fora do WinAnsi (Helvetica)', () => {
    expect(pdfTxt('a → b ≥ c − d')).toBe('a -> b >= c - d');
    expect(pdfTxt('€ “x” ç')).toBe('€ “x” ç');
    expect(pdfTxt(undefined)).toBe('');
    expect(quebrarCJK('采购计划生命周期总成本', 30, (s: string) => s.length * 10).every(l => l.length <= 3)).toBe(true);
  });

  for (const k of ['A', 'B', 'C', 'D']) {
    it(`exemplo ${k} em pt, en, es e fr`, async () => {
      const e = exemplo(k);
      for (const l of ['pt', 'en', 'es', 'fr']) {
        const doc: any = await gerarPDF(e, { versao: '0.1.0-test', lang: l, comprimir: false });
        const n = paginas(doc);
        expect(n, `${k} ${l}: páginas`).toBeGreaterThanOrEqual(14);
        expect(n, `${k} ${l}: páginas`).toBeLessThanOrEqual(60);
        const txt = doc.output() as string;
        expect(txt.startsWith('%PDF-')).toBe(true);
        expect(txt).toContain('v0.1.0-test');
        expect(txt).not.toMatch(/\((?:[^()\\]|\\.)*(?:undefined|NaN|\[object)(?:[^()\\]|\\.)*\)\s*Tj/);
        setLang(l); const sub = '(' + pdfTxt(tr('Plano de contratação')) + ')'; setLang('pt');
        // (no francês, o ’ de "Plan d’achat" vira o byte 0x92 do WinAnsi no arquivo)
        if (l !== 'fr') expect(txt).toContain(sub);
        expect(bytes(doc)).toBeGreaterThan(20000);
      }
      expect((await import('../../src/domain')).getLang()).toBe('pt');   // o idioma volta ao de antes
    }, 60000);
  }

  it('títulos das páginas e das seções A1–A7 e B1–B9 na ordem nova', async () => {
    const e = exemplo('A');
    const doc: any = await gerarPDF(e, { versao: '0.1.0', comprimir: false });
    const pag: string[] = [];
    for (let i = 1; i <= doc.getNumberOfPages(); i++) {
      const s = doc.internal.pages[i].join('\n');
      pag.push(s);
    }
    // a capa (página 1, índice 0) lista os títulos no índice "Neste plano": a busca começa na página 2
    const onde = (t: string) => pag.findIndex((p, i) => i > 0 && p.includes('(' + pdfTxt(t) + ')'));
    const pR = onde('Em resumo'), pC = onde('Quanto custa'), pF = onde('O que fazer'), pE = onde('O que exigir'), pA = onde('Apêndice');
    expect(pR).toBe(1);
    expect([pR, pC, pF, pE, pA].every((p, i, L) => p > 0 && (!i || p > L[i - 1]))).toBe(true);
    // números das seções nas faixas, na página certa
    const numPag = (id: string) => pag.findIndex((p, i) => i > 1 && p.includes('(' + id + '.)'));
    expect([numPag('A2'), numPag('A3')].every(p => p >= pC && p < pF)).toBe(true);
    expect([numPag('A1'), numPag('B1'), numPag('B3'), numPag('B9')].every(p => p >= pF && p < pE)).toBe(true);
    expect([numPag('A4'), numPag('A7'), numPag('B5'), numPag('B6')].every(p => p >= pE && p < pA)).toBe(true);
  }, 60000);

  it('caso em branco: PDF parcial com as respostas que faltam no fim', async () => {
    const e = exemplo('novo');
    const doc: any = await gerarPDF(e, { versao: '0.1.0', comprimir: false });
    expect(paginas(doc)).toBeGreaterThanOrEqual(14);
    // a lista começa numa página própria depois das referências e vai até o fim
    const pag: string[] = [];
    for (let i = 1; i <= doc.getNumberOfPages(); i++) pag.push(doc.internal.pages[i].join('\n'));
    const pF = pag.findIndex((p, i) => i > 0 && p.includes('(' + pdfTxt(tr('Respostas que faltam')) + ')'));
    const pRef = pag.findIndex((p, i) => i > 0 && p.includes('(' + pdfTxt(tr('Referências')) + ')'));
    expect(pF).toBeGreaterThan(pRef);
    expect(pRef).toBeGreaterThan(0);
    expect(pag.length - pF).toBeLessThanOrEqual(3);
  }, 60000);

  it('figura e logos (data URIs) entram na capa e numa página própria', async () => {
    const e = exemplo('B');
    const sem: any = await gerarPDF(e, { versao: '0.1.0' });
    const com: any = await gerarPDF(e, { versao: '0.1.0', figura: dataURI('assets/fig1_tco.jpg', 'image/jpeg'),
      logos: [dataURI('assets/catedra.png', 'image/png'), dataURI('assets/iaedu.png', 'image/png')] });
    expect(paginas(com)).toBe(paginas(sem) + 1);
    expect(bytes(com)).toBeGreaterThan(bytes(sem) + 200000);
  }, 60000);

  it('árabe, chinês e bambara com as fontes geradas; sem elas, Helvetica e troca de caracteres', async () => {
    const F: any = await carregarFontesPDF();
    const temFontes = !!(F && F.ar && F.zh && F.latin);
    if (!temFontes) console.warn('plano.test: sem src/plano/fontes_pdf.generated.js (rode npm run fontes-pdf); testando só a reserva');
    for (const k of ['A', 'D']) {
      const e = exemplo(k);
      for (const [l, nome] of [['ar', 'NotoAr'], ['zh', 'NotoSC'], ['bm', 'NotoLatin']]) {
        const doc: any = await gerarPDF(e, { versao: '0.1.0', lang: l, comprimir: false });
        const n = paginas(doc), txt = doc.output() as string;
        expect(n, `${k} ${l}`).toBeGreaterThanOrEqual(14);
        expect(n, `${k} ${l}`).toBeLessThanOrEqual(70);
        if (temFontes) expect(txt, `${k} ${l}: fonte embutida`).toContain('/BaseFont /' + nome);
        expect(bytes(doc)).toBeGreaterThan(20000);
      }
    }
    // reserva (SEM_FONTES): Helvetica com a troca de caracteres da v13
    const doc: any = await gerarPDF(exemplo('A'), { versao: '0.1.0', lang: 'zh', fontes: null, comprimir: false });
    expect(paginas(doc)).toBeGreaterThanOrEqual(14);
    const txt = doc.output() as string;
    expect(txt).not.toContain('/BaseFont /NotoSC');
    expect(txt).toContain('preliminary translation');   // aviso de tradução preliminar (em inglês, na segunda linha)
  }, 120000);
});
