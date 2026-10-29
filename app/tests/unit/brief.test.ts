// Policy brief (design/redesign/06-policy-brief.md, PB-01 a PB-05): dados puros (plano/brief.js), o PDF do brief
// (plano/pdf_brief.js), o anexo técnico (plano/pdf.js) e a redação construtiva da recomendação (domain/rec_selecao.js).
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { useCaso } from '../../src/store/caso';
import { setDicionarios, setLang, setMoeda, setTabelaMoedas, getLang, tr, resultadoRecomendacoes, TEXTOS_REC_R3 } from '../../src/domain';
import { secoesPlano, trSecao } from '../../src/plano/secoes.js';
import { painelDe } from '../../src/percurso/painel';
import { sinteseCapitulo } from '../../src/percurso/sintese';
import { briefDados, limitarPalavras, TEXTOS_BRIEF } from '../../src/plano/brief.js';
import { gerarBrief, nomeArqBrief } from '../../src/plano/pdf_brief.js';
import { gerarPDF, pdfTxt } from '../../src/plano/pdf.js';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(AQUI, '..', '..', '..');
const lerJSON = (f: string) => JSON.parse(fs.readFileSync(f, 'utf8'));
const IDIOMAS = ['pt', 'en', 'es', 'fr', 'ar', 'zh', 'bm', 'zu', 'sw'];
const EX = ['A', 'B', 'C', 'D'];

beforeAll(() => {
  const dic: Record<string, any> = {};
  IDIOMAS.slice(1).forEach(l => { const f = path.join(AQUI, '..', '..', 'src', 'i18n', l + '.json'); dic[l] = fs.existsSync(f) ? lerJSON(f) : {}; });
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
function variante(k: string, caso: any): any {
  const e = JSON.parse(JSON.stringify(exemplo(k)));
  e.caso = Object.assign({}, e.caso, caso);
  return e;
}
// todos os textos de uma estrutura
function textos(x: any, out: string[] = []): string[] {
  if (typeof x === 'string') out.push(x);
  else if (Array.isArray(x)) x.forEach(z => textos(z, out));
  else if (x && typeof x === 'object') Object.values(x).forEach(z => textos(z, out));
  return out;
}
const RUIM = /undefined|NaN|\bnull\b|\[object/;
const palavras = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
// texto de uma página de PDF não comprimido: as cadeias dos operadores Tj, juntas
const frasesPag = (pag: string) => (pag.match(/\((?:[^()\\]|\\.)*\)\s*Tj/g) || []).map(z => z.replace(/\)\s*Tj$/, '').slice(1).replace(/\\(.)/g, '$1')).join(' ');
const paginas = (doc: any) => { const L: string[] = []; for (let i = 1; i <= doc.getNumberOfPages(); i++) L.push(doc.internal.pages[i].join('\n')); return L; };
const AINDA_NAO = /ainda\s+n(?:ã|\\343|a)o\s+avance/i;
const ZERO = /^(?:[A-Z]{0,3}\$?\s*)?[−-]?0(?:[.,]0+)?(?:\s*(?:mil|mi|k|M))?$/;

describe('PB-01: briefDados', () => {
  for (const k of EX) {
    it(`exemplo ${k}: título, recomendação, cinco frases, três números, quatro etapas, páginas 2–6 e cinco ações`, () => {
      const e = exemplo(k);
      const antes = JSON.stringify(e);
      const B: any = briefDados(e);
      expect(JSON.stringify(e), 'o estado não muda').toBe(antes);
      expect(B.vazio).toBe(false);
      expect(B.titulo).toBe(e.caso.titulo);
      expect(B.subtitulo).toBe(e.ctx.local);
      expect(B.data).toMatch(/\d{4}/);
      expect(B.selo).toBe('Estimativa ilustrativa');
      // a recomendação é a do veredito (mesma decisão e mesma frase do motor), sem a lista "Faltam"
      const V: any = resultadoRecomendacoes(e).veredito;
      expect(B.recomendacao.texto).toBe('Próxima decisão: ' + V.decisao + '. ' + V.frase);
      expect(B.recomendacao.porque).toMatch(/^Por quê: /);
      expect(Object.keys(B.frases)).toEqual(['contexto', 'teste', 'implantacao', 'expansao', 'custo']);
      Object.values(B.frases).forEach((f: any) => { expect(f.rotulo).toMatch(/\S/); expect(f.texto).toMatch(/\S/); expect(f.falta).toBeUndefined(); });
      expect(B.frases.contexto.texto).toContain(e.ctx.local);
      // três números: o total com a faixa P10–P90 na nota (os mesmos valores do sumário do plano)
      const S: any = (secoesPlano(e).find((s: any) => s.id === 'resumo') as any).sumario;
      expect(B.numeros.map((n: any) => n.id)).toEqual(['total', 'ano0', 'regime']);
      expect(B.numeros[0].valor).toBe(S.faixa.centralTxt);
      expect(B.numeros[0].nota).toContain('P10');
      expect(B.numeros[0].nota).toContain(S.faixa.loTxt);
      expect(B.numeros[0].nota).toContain(S.faixa.hiTxt);
      expect(B.numeros[1].valor).toBe(S.indicadores.find((z: any) => z.id === 'ano0').valor);
      expect(B.numeros[2].rotulo).toMatch(/^Custo anual em regime \(Ano \d\)$/);
      B.numeros.forEach((n: any) => expect(n.valor).toMatch(/US\$/));
      expect(B.frases.custo.texto).toContain(B.numeros[0].valor);
      expect(B.frases.custo.texto).toContain(B.numeros[1].valor);
      expect(B.frases.custo.texto).toContain(B.numeros[2].valor);
      // etapas: teste, implantação, expansão e rede toda; as três primeiras somam o custo total
      expect(B.etapas.map((z: any) => z.id)).toEqual(['teste', 'implantacao', 'expansao', 'rede']);
      B.etapas.forEach((z: any) => { expect(z.nome).toMatch(/\S/); expect(z.anos).toMatch(/Ano/); expect(z.custo).toBeGreaterThan(0); expect(z.custoTxt).toMatch(/US\$/); });
      const soma = B.etapas.slice(0, 3).reduce((a: number, z: any) => a + z.custo, 0);
      expect(Math.abs(soma - S.faixa.central) / S.faixa.central).toBeLessThan(0.001);
      expect(B.etapas[3].custoTxt).toContain(B.numeros[2].valor);
      // páginas 2–6 com título-achado, abertura e blocos
      expect(Object.keys(B.paginas)).toEqual(['problema', 'desenho', 'custo', 'riscos', 'passos']);
      Object.values(B.paginas).forEach((p: any) => { expect(p.secao).toMatch(/\S/); expect(p.titulo).toMatch(/\S/); expect(p.abre).toMatch(/\S/); expect(p.blocos.length).toBeGreaterThan(0); });
      expect(B.paginas.custo.titulo).toContain(S.faixa.centralTxt);
      expect(B.paginas.desenho.blocos.some((b: any) => b.tipo === 'etapas')).toBe(true);
      expect(B.paginas.riscos.blocos.find((b: any) => b.tipo === 'lista').itens.length).toBe(3);   // dados, supervisão, contestação
      // cinco ações: só o quê, quem e quando (as mesmas dos cartões do plano)
      expect(B.acoes.length).toBe(5);
      expect(B.acoes.map((a: any) => a.id)).toEqual(S.rec.cartoes.map((c: any) => c.id));
      B.acoes.forEach((a: any, i: number) => { expect(a.n).toBe(i + 1); expect(Object.keys(a).sort()).toEqual(['id', 'n', 'oque', 'quando', 'quem']); ['oque', 'quem', 'quando'].forEach(f => expect(a[f]).toMatch(/\S/)); });
      expect(textos(B).filter(t => RUIM.test(t))).toEqual([]);
    });
  }

  it('B: o teste começa pela prova de conceito, como a recomendação', () => {
    const B: any = briefDados(exemplo('B'));
    expect(B.frases.teste.rotulo).toBe('Prova de conceito e piloto');
    expect(B.frases.teste.texto).toMatch(/^Prova de conceito; depois, piloto em 20 escolas, 6\.000 participantes, 4 meses; critério para passar: /);
    expect(B.frases.implantacao.texto).toBe('Implantação no Ano 1 em 200 escolas, 50.000 pessoas, depois que o teste cumprir os critérios.');
    expect(B.frases.expansao.texto).toBe('Chega à rede toda no Ano 2, com 150.000 pessoas (um ano depois da implantação).');
    expect(B.recomendacao.texto).toBe('Próxima decisão: autorizar o teste. Recomendação: começar por uma prova de conceito antes do piloto.');
  });

  it('caso em branco: vazio, cada frase "a definir" com a pergunta que falta, sem números', () => {
    const B: any = briefDados(exemplo('novo'));
    expect(B.vazio).toBe(true);
    Object.values(B.frases).forEach((f: any) => {
      expect(f.texto).toMatch(/^A definir: responda à pergunta \S+ \(.+\)\.$/);
      expect(f.falta.n).toMatch(/^\d/);
      expect(f.falta.pergunta).toMatch(/\S/);
      expect(f.falta.ir).toMatch(/^#\//);
      expect(f.texto).toContain(f.falta.n);
    });
    expect(B.frases.custo.falta.n).toBe('2.3.4');
    B.numeros.forEach((n: any) => { expect(n.valor).toBe('—'); expect(n.nota).toContain('2.3.4'); });
    B.etapas.forEach((z: any) => expect(z.custoTxt).toBe('—'));
    expect(B.acoes).toEqual([]);
    expect(textos(B).filter(t => /US\$/.test(t))).toEqual([]);
    expect(textos(B).filter(t => RUIM.test(t))).toEqual([]);
    // sem caso: não lança
    const V: any = briefDados({} as any);
    expect(V.vazio).toBe(true);
    expect(V.acoes).toEqual([]);
  });

  it('traduz no idioma atual e lista os textos novos', () => {
    const e = exemplo('A');
    setLang('en');
    const B: any = briefDados(e);
    setLang('pt');
    expect(B.numeros[0].valor).toMatch(/^US\$ [\d.]+ M$/);   // formatação do inglês
    expect(TEXTOS_BRIEF).toContain('A definir: responda à pergunta {0} ({1}).');
    expect(TEXTOS_BRIEF).toContain('Estimativa ilustrativa');
    expect(new Set(TEXTOS_BRIEF).size).toBe(TEXTOS_BRIEF.length);
    expect(limitarPalavras('um dois três quatro', 3)).toBe('um dois…');
  });
});

describe('PB-02: PDF do brief, até 6 páginas e o resumo numa só', () => {
  it('nome do arquivo', () => {
    expect(nomeArqBrief(exemplo('A'))).toMatch(/^policy-brief-[a-z0-9-]+\.pdf$/);
  });
  for (const k of EX) {
    it(`exemplo ${k} nos 9 idiomas: 6 páginas, nada transborda, o resumo executivo na página 1`, async () => {
      const e = exemplo(k);
      for (const l of IDIOMAS) {
        const doc: any = await gerarBrief(e, { versao: '0.1.0-test', lang: l, comprimir: false });
        expect(doc.getNumberOfPages(), `${k} ${l}`).toBeLessThanOrEqual(6);
        expect(doc.getNumberOfPages(), `${k} ${l}`).toBe(6);
        const I = doc.briefInfo;
        expect(I.paginas.map((p: any) => p.id)).toEqual(['resumo', 'problema', 'desenho', 'custo', 'riscos', 'passos']);
        // o conteúdo de cada página termina antes do rodapé: o resumo cabe em exatamente uma página
        I.paginas.forEach((p: any) => expect(p.altura, `${k} ${l} ${p.id}`).toBeLessThanOrEqual(I.base));
        expect(I.paginas[0].escala, `${k} ${l}: resumo legível`).toBeGreaterThanOrEqual(0.8);
        const txt = doc.output() as string;
        expect(txt.startsWith('%PDF-')).toBe(true);
        // (ar, zh e bm usam fonte embutida: o texto sai codificado por glifo)
        if (!['ar', 'zh', 'bm'].includes(l)) expect(txt).toContain('v0.1.0-test');
        expect(txt).not.toMatch(/\((?:[^()\\]|\\.)*(?:undefined|NaN|\[object)(?:[^()\\]|\\.)*\)\s*Tj/);
        if (l === 'pt') {
          // fim do resumo: a página 2 abre "O problema"; a página 1 traz as cinco frases e os três números
          const pag = paginas(doc).map(frasesPag);
          expect(pag[1]).toContain(pdfTxt('2  ·  O PROBLEMA'));
          expect(pag[0]).not.toContain(pdfTxt('O PROBLEMA'));
          const B: any = briefDados(e);
          ['Contexto', 'Implantação', 'Expansão', 'Custo'].forEach(r => expect(pag[0]).toContain(pdfTxt(r)));
          B.numeros.forEach((n: any) => expect(pag[0]).toContain(pdfTxt(n.valor)));
          expect(pag[0]).toContain(pdfTxt('ESTIMATIVA ILUSTRATIVA'));
          expect(pag[5]).toContain(pdfTxt(B.acoes[0].quando));
        }
      }
      expect(getLang()).toBe('pt');   // o idioma volta ao de antes
    }, 180000);
  }
  it('caso em branco: também 6 páginas, com "a definir"', async () => {
    const doc: any = await gerarBrief(exemplo('novo'), { versao: '0.1.0', comprimir: false });
    expect(doc.getNumberOfPages()).toBe(6);
    doc.briefInfo.paginas.forEach((p: any) => expect(p.altura).toBeLessThanOrEqual(doc.briefInfo.base));
    expect(frasesPag(paginas(doc)[0])).toContain(pdfTxt('A definir: responda à pergunta 2.3.4'));
  }, 60000);
});

describe('PB-03: frases curtas, tabelas pequenas, nenhuma linha com zero', () => {
  for (const k of EX) {
    it(`exemplo ${k}`, () => {
      const B: any = briefDados(exemplo(k));
      Object.values(B.frases).forEach((f: any) => expect(palavras(f.texto), f.texto).toBeLessThanOrEqual(35));
      Object.values(B.paginas).forEach((p: any) => p.blocos.forEach((b: any) => {
        if (b.tipo === 'tabela') {
          expect(b.rows.length, b.titulo).toBeLessThanOrEqual(8);
          expect(b.rows.length, b.titulo).toBeGreaterThan(0);
          b.rows.forEach((r: string[]) => { expect(r.length).toBe(b.head.length); r.slice(1).forEach(c => expect(String(c), b.titulo).not.toMatch(ZERO)); });
        }
        if (b.tipo === 'barras') b.itens.forEach((it: any) => { expect(Math.abs(it.valor)).toBeGreaterThanOrEqual(0.5); expect(it.txt).not.toMatch(ZERO); });
        if (b.tipo === 'numeros') b.itens.forEach((it: any) => expect(it.valor).not.toMatch(ZERO));
      }));
      // a página 2 (o problema) fica em até ~250 palavras
      const n = B.paginas.problema.blocos.reduce((a: number, b: any) => a + palavras([b.titulo, b.texto].join(' ')), 0);
      expect(n).toBeLessThanOrEqual(250);
    });
  }
  it('limitarPalavras corta acima de 35 palavras', () => {
    const longa = Array.from({ length: 50 }, (_, i) => 'p' + i).join(' ');
    expect(palavras(limitarPalavras(longa))).toBe(34);
    expect(limitarPalavras(longa).endsWith('…')).toBe(true);
  });
});

describe('PB-04: o PDF de sempre é o anexo técnico, sem o resumo executivo', () => {
  for (const k of EX) {
    it(`exemplo ${k}: título do anexo, sem "Em resumo", com índice e a linha que remete ao brief`, async () => {
      const doc: any = await gerarPDF(exemplo(k), { versao: '0.1.0', comprimir: false });
      const pag = paginas(doc), txt = pag.map(frasesPag);
      expect(txt[0]).toContain(pdfTxt('Anexo técnico para a contratação'));
      expect(txt[0]).toContain(pdfTxt('NESTE ANEXO'));
      expect(txt[0]).toContain(pdfTxt('Este anexo acompanha o policy brief deste caso'));
      expect(pag.filter(p => p.includes('(' + pdfTxt('Em resumo') + ')'))).toEqual([]);
      expect(txt.join(' ')).not.toContain(pdfTxt('A proposta em seis respostas'));
      expect(txt.join(' ')).not.toContain(pdfTxt(tr('Como ler este plano')));
      // o cabeçalho das páginas internas usa o título do anexo
      expect(txt[2]).toContain(pdfTxt('Anexo técnico para a contratação'));
      // o conteúdo do anexo continua: sequência de decisões, plano de ação, quanto custa, o que exigir, apêndice
      ['Sequência de decisões', 'Plano de ação', 'Quanto custa', 'O que exigir', 'Apêndice'].forEach(t => expect(txt.join(' '), t).toContain(pdfTxt(tr(t))));
    }, 60000);
  }
});

describe('PB-05: redação construtiva da recomendação, sem "Ainda não avance"', () => {
  it('os quatro gatilhos do código "nao" têm frase construtiva', () => {
    const casos: [string, any, string][] = [
      ['B', {}, 'piloto'],
      ['C', {}, 'excesso'],
      ['B', { problema: 'Os estudantes precisam de um tutor com inteligência artificial para matemática.' }, 'problema'],
      ['C', { contestacaoExiste: 'nao' }, 'contestacao'],
    ];
    for (const [k, mud, g] of casos) {
      const v: any = resultadoRecomendacoes(variante(k, mud)).veredito;
      expect(v.codigo, g).toBe('nao');
      expect(v.gatilhos, g).toContain(g);
      expect(v.frase, g).toMatch(/^Recomendação: /);
      expect(v.texto, g).not.toMatch(AINDA_NAO);
      expect(v.rotulo, g).not.toMatch(AINDA_NAO);
    }
    expect(TEXTOS_REC_R3.filter((s: string) => AINDA_NAO.test(s))).toEqual([]);
  });
  for (const k of EX) {
    it(`exemplo ${k}: página (brief e seções), síntese do capítulo 4, brief em PDF e anexo`, async () => {
      const e = exemplo(k);
      expect(textos(briefDados(e)).filter(t => AINDA_NAO.test(t))).toEqual([]);
      expect(textos((secoesPlano(e) as any[]).map(trSecao)).filter(t => AINDA_NAO.test(t))).toEqual([]);
      expect(painelDe(e).veredito).not.toMatch(AINDA_NAO);
      const s4: any = sinteseCapitulo(4, e as any);
      expect(textos(s4).filter(t => AINDA_NAO.test(t))).toEqual([]);
      const brief: any = await gerarBrief(e, { versao: '0.1.0', comprimir: false });
      expect(paginas(brief).map(frasesPag).join(' ')).not.toMatch(AINDA_NAO);
      const anexo: any = await gerarPDF(e, { versao: '0.1.0', comprimir: false });
      expect(paginas(anexo).map(frasesPag).join(' ')).not.toMatch(AINDA_NAO);
    }, 60000);
  }
});
