// Páginas do plano (P3): a lógica que a tela e o PDF compartilham, sem DOM.
// Links de "rever a resposta", contagens iguais na página e no PDF, caso em branco sem números inventados,
// rótulos sem "nao_sei" e a explicação de cada número ("de onde vem?").
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { useCaso } from '../../src/store/caso';
import { setDicionarios, setLang, setMoeda, setTabelaMoedas } from '../../src/domain';
import { lerRota, href } from '../../src/percurso/rota';
import {
  painelDe, lacunasDe, paraNumeroDe, rotuloResposta, explicacaoKpi, driversDe, tituloParcial, textoLacunas, textoCondicoes, KPI_IDS,
} from '../../src/percurso/painel';
import { painelPlano, secoesPlano } from '../../src/plano/secoes.js';
import { gerarPDF, pdfTxt } from '../../src/plano/pdf.js';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(AQUI, '..', '..', '..');
const lerJSON = (f: string) => JSON.parse(fs.readFileSync(f, 'utf8'));

beforeAll(() => {
  const dic: Record<string, any> = {};
  ['en', 'es', 'fr', 'ar', 'zh', 'bm'].forEach((l) => { const f = path.join(AQUI, '..', '..', 'src', 'i18n', l + '.json'); dic[l] = fs.existsSync(f) ? lerJSON(f) : {}; });
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
const paginasPDF = (doc: any) => { const p: string[] = []; for (let i = 1; i <= doc.getNumberOfPages(); i++) p.push(doc.internal.pages[i].join('\n')); return p; };

describe('links das ações recomendadas e das lacunas', () => {
  for (const k of ['A', 'B', 'C', 'D', 'novo']) {
    it(`exemplo ${k}: todo link resolve para uma pergunta ou para a síntese com o campo em foco`, () => {
      const e = exemplo(k);
      const P = painelDe(e);
      const alvos = [...P.recs.map((r) => r.href), ...P.lacunas.itens.map((l) => l.href), ...P.paraNumero.map((x) => x.href)];
      alvos.forEach((h) => {
        expect(h, 'link vazio').toBeTruthy();
        const r = lerRota(h as string);
        expect(['pergunta', 'sintese'], String(h)).toContain(r.tipo);
        if (r.tipo === 'sintese') expect(r.foco, String(h)).toBeTruthy();
      });
      P.recs.forEach((r) => { expect(r.campo, r.id).toBeTruthy(); expect(r.href).toBe(href.campo(r.campo as string)); });
    });
  }
});

describe('mesmas contagens na página e no PDF', () => {
  for (const k of ['novo', 'A', 'C']) {
    it(`exemplo ${k}: lacunas, ações e condições batem`, async () => {
      const e = exemplo(k);
      const P = painelDe(e);
      expect(P.lacunas.total).toBe(P.lacunas.essencial + P.lacunas.refino);
      expect(P.lacunas.itens.length).toBe(P.lacunas.total);
      expect(P.lacunas.itens.filter((l) => l.essencial).length).toBe(P.lacunas.essencial);
      // R6: condições abertas no próximo marco (veredito) ≤ ações de nível Condição; os cartões são ações do caso
      expect(P.nCondicoes).toBeLessThanOrEqual(P.recs.filter((r) => r.nivel === 'condicao').length);
      P.cartoes.forEach((c) => expect(P.recs.some((r) => r.id === c.id), c.id).toBe(true));
      const PP = painelPlano(e);
      if (P.lacunas.total) {
        expect(PP.faltas, 'seção de respostas que faltam').toBeTruthy();
        expect(PP.faltas.list.length).toBe(P.lacunas.total);
        expect(PP.faltas.irs.length).toBe(P.lacunas.total);
        expect(PP.faltas.nEss).toBe(P.lacunas.essencial);
        expect(PP.faltas.nRef).toBe(P.lacunas.refino);
        expect(PP.faltas.p[0]).toBe(tituloParcial(P.lacunas));
        // o mesmo título aparece no PDF
        const doc: any = await gerarPDF(e, { versao: '0.1.0', comprimir: false });
        expect(doc.output() as string).toContain('(' + pdfTxt(tituloParcial(P.lacunas)) + ')');
      } else {
        expect(PP.faltas).toBeFalsy();
      }
      // as ações da seção "recs" são as mesmas do painel
      const recs = secoesPlano(e).find((s: any) => s.id === 'recs');
      expect(recs).toBeTruthy();
    }, 60000);
  }

  it('textos de contagem concordam em número', () => {
    expect(tituloParcial({ total: 1 })).toBe('Plano parcial: 1 resposta pendente.');
    expect(tituloParcial({ total: 7 })).toBe('Plano parcial: 7 respostas pendentes.');
    expect(textoCondicoes(0)).toBe('Nenhuma condição aberta');
    expect(textoCondicoes(1)).toBe('1 condição aberta');
    expect(textoCondicoes(3)).toBe('3 condições abertas');
    expect(textoLacunas({ essencial: 2, refino: 0 })).toMatch(/2/);
  });
});

describe('caso em branco: sem números inventados', () => {
  it('sem tipo de tecnologia, o painel não traz valores e diz o que responder', () => {
    const e = exemplo('novo');
    const P = painelDe(e);
    expect(P.temNumeros).toBe(false);
    P.kpis.forEach((k) => { expect(k.value).toBeUndefined(); expect(k.bruto).toBeUndefined(); });
    expect(P.camadas).toEqual([]);
    expect(P.paraNumero[0].campo).toBe('tipoTec');
    expect(P.paraNumero[0].obrigatoria).toBe(true);
    expect(lerRota(P.paraNumero[0].href).tipo).toBe('pergunta');
    const PP = painelPlano(e);
    expect(PP.semNumeros).toBe(true);
    const a2 = secoesPlano(e).find((s: any) => s.id === 'A2');
    expect(a2.semNumeros).toBe(true);
    expect(a2.graf).toBeFalsy();
  });

  it('o PDF diz "Ainda sem números" e não imprime os quatro valores', async () => {
    const e = exemplo('novo');
    const doc: any = await gerarPDF(e, { versao: '0.1.0', comprimir: false });
    const pag = paginasPDF(doc);
    expect(pag[0]).toContain('(' + pdfTxt('Ainda sem números') + ')');
    expect(pag.join('\n')).not.toMatch(/\((?:[^()\\]|\\.)*(?:undefined|NaN)(?:[^()\\]|\\.)*\)\s*Tj/);
  }, 60000);

  it('ao dizer o tipo de tecnologia, os números aparecem e saem de "novo" com origem padrão', () => {
    exemplo('novo');
    useCaso.getState().responder('tipoTec', 'paga');
    const e: any = useCaso.getState().estado();
    const P = painelDe(e);
    expect(P.temNumeros).toBe(true);
    expect(P.kpis.every((k) => typeof k.value === 'string' && k.value.length > 0)).toBe(true);
    expect(P.paraNumero.some((x) => x.campo === 'tipoTec')).toBe(false);
    expect(painelPlano(e).semNumeros).toBe(false);
  });
});

describe('PLA-19: rótulos de resposta', () => {
  it('"nao_sei" nunca aparece cru; opções conhecidas viram o texto da opção', () => {
    expect(rotuloResposta('arquitetura', 'nao_sei')).not.toMatch(/nao_sei/);
    expect(rotuloResposta(undefined, 'nao_sei')).toBe('Não sei');
    expect(rotuloResposta('arquitetura', 'nao_sei')).toMatch(/arquitetura presumida/i);
    expect(rotuloResposta('x', '')).toBe('—');
    expect(rotuloResposta('x', 'Texto livre digitado')).toBe('Texto livre digitado');
  });

  for (const k of ['A', 'B', 'C', 'D', 'novo']) {
    it(`exemplo ${k}: nenhuma ação nem "Por quê" mostra "nao_sei"`, () => {
      const e = exemplo(k);
      const P = painelDe(e);
      P.recs.forEach((r) => {
        expect(JSON.stringify(r), r.id).not.toMatch(/nao_sei/);
      });
      const txt: string[] = [];
      const colher = (x: any) => { if (typeof x === 'string') txt.push(x); else if (Array.isArray(x)) x.forEach(colher); else if (x && typeof x === 'object') Object.values(x).forEach(colher); };
      colher(secoesPlano(e).filter((s: any) => s.id === 'recs' || s.id === 'A1'));
      expect(txt.filter((t) => /\bnao_sei\b/.test(t))).toEqual([]);
    });
  }
});

describe('CUS-02: de onde vem cada número', () => {
  it('exemplo A: cada KPI explica origem, conta e respostas que pesam', () => {
    const e = exemplo('A');
    for (const id of KPI_IDS) {
      const x = explicacaoKpi(e, id);
      expect(['padrao', 'sugerido', 'informado', 'refinado']).toContain(x.origem);
      expect(x.conta.length, id).toBeGreaterThan(0);
      expect(x.conta.join(' ')).not.toMatch(/undefined|NaN|\[object/);
      expect(x.drivers.length, id).toBeGreaterThan(0);
      x.drivers.forEach((d) => expect(lerRota(d.href).tipo).not.toBe('inicio'));
      expect(x.irCampo).toEqual(x.drivers[0]);
    }
    expect(explicacaoKpi(e, 'saida').conta.length).toBeGreaterThan(0);
  });

  it('caso em branco com tipo de tecnologia: as menos firmes vêm primeiro', () => {
    exemplo('novo');
    useCaso.getState().responder('tipoTec', 'paga');
    const e: any = useCaso.getState().estado();
    const ordem = ['padrao', 'sugerido', 'informado', 'refinado'];
    const d = driversDe(e, 'kpi.total');
    expect(d.length).toBeGreaterThan(2);
    const idx = d.map((x) => ordem.indexOf(x.origem));
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
    expect(explicacaoKpi(e, 'kpi.total').origem).toBe('padrao');
  });

  it('paraNumeroDe lista só o que falta, com a obrigatória primeiro', () => {
    exemplo('novo');
    let L = paraNumeroDe(useCaso.getState().estado());
    expect(L.map((x) => x.campo)).toEqual(['tipoTec', 'tarefas', 'elegiveis']);
    useCaso.getState().responder('tipoTec', 'paga');
    L = paraNumeroDe(useCaso.getState().estado());
    expect(L.map((x) => x.campo)).toEqual(['tarefas', 'elegiveis']);
    expect(L.every((x) => !x.obrigatoria)).toBe(true);
    expect(paraNumeroDe(exemplo('A'))).toEqual([]);
  });
});

describe('lacunasDe', () => {
  it('em branco: Essencial e refinamento somam o total e cada item tem link', () => {
    const e = exemplo('novo');
    const L = lacunasDe(e);
    expect(L.essencial).toBeGreaterThan(10);
    expect(L.refino).toBeGreaterThan(0);
    expect(L.total).toBe(L.essencial + L.refino);
    expect(new Set(L.itens.map((l) => l.n + '|' + l.campo)).size).toBe(L.itens.length);
    L.itens.forEach((l) => { expect(l.texto).toBeTruthy(); expect(lerRota(l.href).tipo).not.toBe('inicio'); });
  });
  it('exemplos completos: nenhuma lacuna', () => {
    for (const k of ['A', 'B', 'C', 'D']) expect(lacunasDe(exemplo(k)).total, k).toBe(0);
  });
});
