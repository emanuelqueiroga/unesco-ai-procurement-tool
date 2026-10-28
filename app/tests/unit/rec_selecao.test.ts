// Seleção das recomendações (pacote R3; seções 3.3, 4 e 5 de design/redesign/05-requisitos-recomendacoes.md):
// pontuação auditável (REC-18), três níveis (REC-19), 5 cartões (REC-20), veredito (REC-21), aviso de mais de 5
// Condições (REC-22), "O que fazer" por pacote (REC-23) e caso incompleto ou em branco (REC-24).
// Os conjuntos de cartões por exemplo (seção 4.6) estão em rec_exemplos.test.ts.
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { useCaso } from '../../src/store/caso';
import {
  setLang, setMoeda, setTabelaMoedas, resultadoRecomendacoes, recContexto, REGRAS, PRIO_REC, secaoRecomendacoes, rotuloNivel, trVeredito,
  trAviso, trCartao, TEXTOS_REC_R3,
} from '../../src/domain';
import { pendenciasSugeridas, rotuloNivelCurto, emJogoDe, MAX_CONDICOES } from '../../src/domain/rec_selecao.js';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
beforeAll(() => { setTabelaMoedas(JSON.parse(fs.readFileSync(path.join(RAIZ, 'data', 'moedas.json'), 'utf8'))); });
afterEach(() => { setLang('pt'); setMoeda({ cod: 'USD', taxa: '', taxaDe: '' }); });
function exemplo(k: string): any {
  setLang('pt');
  useCaso.getState().carregarExemplo(k);
  const e: any = useCaso.getState().estado();
  setMoeda(e.moeda);
  return e;
}
const res = (k: string): any => resultadoRecomendacoes(exemplo(k));
const EX = ['A', 'B', 'C', 'D'];

// embaralhamento determinístico (Mulberry32), o mesmo de rec_catalogo.test.ts
function embaralhar<T>(L: T[], semente: number): T[] {
  let s = semente >>> 0;
  const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const out = L.slice();
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

// regra mínima válida para os testes de pontuação e de veredito (catálogo trocado em resultadoRecomendacoes)
let seq = 0;
function regra(id: string, x: any = {}): any {
  seq++;
  return Object.assign({
    id, versao: 1, pacote: 'PROB', tipo: 'politica', substitui: [], campos: ['alternativa'], se: () => true,
    variantes: [{ oque: 'Fazer a ação de teste ' + id + ' número ' + seq + '.', porque: 'Razão da ação.', como: ['Passo um.', 'Passo dois.'] }],
    paraque: 'Para testar.', quem: ['gabinete'], marco: 'M1', pronto: 'Pronto.',
  }, x);
}
const cond = () => true;
const resCom = (k: string, regras: any[]): any => resultadoRecomendacoes(exemplo(k), regras);
const item = (R: any, id: string) => R.recs.find((r: any) => r.id === id);

// assinatura completa da seleção (para comparar saídas)
const assinatura = (R: any) => JSON.stringify({
  recs: R.recs.map((r: any) => [r.id, r.variante, r.pontos, r.criterio]),
  cartoes: R.cartoes.map((c: any) => [c.n, c.chave, c.ids, c.motivo]),
  veredito: R.veredito.texto, aviso: R.avisoCondicoes && R.avisoCondicoes.texto,
  grupos: R.grupos.map((g: any) => [g.pacote, g.ids]), base: R.baseComum.map((r: any) => r.id), cond: R.condicoes,
});

describe('REC-18: pontuação de 4.1, gravada na ação', () => {
  it('toda ação tem pontos (0–14) e o critério, cuja soma dá os pontos', () => {
    for (const k of EX) {
      res(k).recs.forEach((r: any) => {
        const c = r.criterio;
        expect(Object.keys(c).sort()).toEqual(['bloqueio', 'dependencia', 'dinheiro', 'especificidade', 'pessoas', 'semNumero', 'urgencia']);
        const soma = c.bloqueio + c.pessoas + c.dinheiro + c.urgencia + c.dependencia + c.especificidade + c.semNumero;
        expect(r.pontos, k + ' ' + r.id).toBe(Math.max(0, Math.min(14, soma)));
        expect(c.bloqueio).toBe(r.condicao ? 4 : 0);
        expect(c.pessoas).toBeGreaterThanOrEqual(0); expect(c.pessoas).toBeLessThanOrEqual(3);
        expect([0, 1, 2, 3]).toContain(c.dinheiro);
        expect([0, 1, 2]).toContain(c.urgencia);
        expect([0, 1, 2]).toContain(c.dependencia);
      });
    }
  });
  it('a lista sai em ordem de pontos; no empate, o marco mais próximo e a ordem dos pacotes', () => {
    for (const k of EX) {
      const L = res(k).recs;
      L.forEach((r: any, i: number) => { if (i) expect(L[i - 1].pontos, k + ' ' + r.id).toBeGreaterThanOrEqual(r.pontos); });
    }
    // B: dados e pessoas com risco elevado vêm antes do teste (mais pontos em "Pessoas e direitos")
    const b = res('B').recs.map((r: any) => r.id);
    expect(b.indexOf('R-26')).toBeLessThan(b.indexOf('R-07'));
    expect(item(res('B'), 'R-26').criterio.pessoas).toBe(3);
  });
  it('embaralhar o catálogo não muda nada da saída: ações, pontos, cartões, veredito, aviso e grupos', () => {
    for (const k of EX) {
      const e = exemplo(k);
      const base = assinatura(resultadoRecomendacoes(e));
      [3, 11, 99].forEach(s => expect(assinatura(resultadoRecomendacoes(e, embaralhar(REGRAS as any[], s))), k + ' ' + s).toBe(base));
    }
  });
  it('dinheiro em jogo: fração do custo total ligada por numero.emJogo', () => {
    const fr = (f: number) => (k: any, d: any) => ({ rotulo: 'Em jogo', valor: 1, emJogo: d ? d.total * f : 0 });
    const R = resCom('A', [
      regra('R-901', { numero: fr(0.12) }), regra('R-902', { numero: fr(0.07) }), regra('R-903', { numero: fr(0.02) }),
      regra('R-904', { numero: fr(0.001) }), regra('R-905'),
    ]);
    expect(['R-901', 'R-902', 'R-903', 'R-904', 'R-905'].map(id => item(R, id).criterio.dinheiro)).toEqual([3, 2, 1, 0, 0]);
     // o formato de numero(chave, d) de rec_numeros.js: o bruto das chaves de dinheiro e dos subcomponentes
    expect(emJogoDe({ id: 'saida', bruto: 50 })).toBe(50);
    expect(emJogoDe({ id: 'sub:K5.5', bruto: { total: 70, porAno: 10 } })).toBe(70);
    expect(emJogoDe({ id: 'aEq', bruto: 0.6 })).toBe(0);
    expect(emJogoDe(null)).toBe(0);
    const S = resCom('A', [regra('R-901', { numero: (k: any, d: any) => ({ id: 'saida', rotulo: 'Saída', valor: 'x', bruto: d.total * 0.06 }) })]);
    expect(item(S, 'R-901').criterio.dinheiro).toBe(2);
  });
  it('dependência (+1 por ação que esta destrava, até 2), base comum (−1) e marcador sem número (−1)', () => {
    const R = resCom('A', [
      regra('R-901'), regra('R-902', { depende: ['R-901'] }), regra('R-903', { depende: ['R-901', 'R-902'] }), regra('R-904', { depende: ['R-901'] }),
      regra('R-905', { generica: true, condicao: cond }),
      regra('R-906', { vars: () => ({}), variantes: [{ oque: 'Fazer a ação com {valor} de teste.', porque: 'Razão da ação.', como: ['Passo um.', 'Passo dois.'] }] }),
    ]);
    expect(item(R, 'R-901').criterio.dependencia).toBe(2);
    expect(item(R, 'R-902').criterio.dependencia).toBe(1);
    expect(item(R, 'R-903').criterio.dependencia).toBe(0);
    expect(item(R, 'R-905').criterio.especificidade).toBe(-1);
    expect(item(R, 'R-906').oque).toMatch(/a calcular/);
    expect(item(R, 'R-906').criterio.semNumero).toBe(-1);
  });
  it('urgência: 2 só antes do marco (irreversível ou cláusula antes do edital), 1 antes de M4, 0 em M4 e M5', () => {
    const R = resCom('A', [
      regra('R-901', { irreversivel: true }), regra('R-902', { marco: 'M3' }), regra('R-903', { marco: 'M4' }), regra('R-904', { marco: 'M5' }),
      regra('R-905', { marco: 'M3', pacote: 'CONTRATO', tipo: 'custo', exige: ['CONTRATO.saida-exportacao'] }),
      regra('R-906', { irreversivel: (k: any) => k.temPiloto }),
    ]);
    expect(['R-901', 'R-902', 'R-903', 'R-904', 'R-905', 'R-906'].map(id => item(R, id).criterio.urgencia)).toEqual([2, 1, 0, 0, 2, 2]);
    // do catálogo: a linha de base (R-11) só pode ser medida antes do teste
    expect(item(res('A'), 'R-11').criterio.urgencia).toBe(2);
  });
  it('pessoas e direitos: 3 com risco elevado, 2 com risco moderado ou crianças afetadas, +1 de equidade em quem trata grupos', () => {
    const P = (k: string, x: any = {}) => item(resCom(k, [regra('R-901', Object.assign({ pacote: 'DADOS' }, x))]), 'R-901').criterio.pessoas;
    expect(P('B')).toBe(3);            // elevado
    expect(P('A')).toBe(2);            // moderado, crianças afetadas
    expect(P('D')).toBe(2);            // moderado
    expect(P('B', { pacote: 'COMPRA', tipo: 'custo', semExige: 'teste' })).toBe(0);
    // B marca o impacto de desigualdade: a regra que trata grupos ganha 1
    expect(P('B', { pacote: 'TESTE', grupos: true })).toBe(1);
    expect(P('A', { pacote: 'TESTE', grupos: true })).toBe(0);   // A não marca desigualdade
    // uso com crianças usuárias (B: tutoria com estudantes)
    expect(P('B', { pacote: 'USO', tipo: 'uso' })).toBe(3);
  });
});

describe('REC-19: três níveis (Condição, Recomendada, Para acompanhar)', () => {
  const PROIBIDAS = /^(Alta|Média|Normal)$/;
  it('cada ação tem um dos três níveis e o rótulo com o marco', () => {
    for (const k of EX) {
      const R = res(k);
      R.recs.forEach((r: any) => {
        expect(['condicao', 'recomendada', 'acompanhar']).toContain(r.nivel);
        expect(r.nivel === 'condicao').toBe(r.condicao);
        if (r.marco === 'M5' && !r.condicao) expect(r.nivel).toBe('acompanhar');
        expect(r.rotuloNivel).toBe(rotuloNivel(r));
        expect(r.rotuloNivel).toMatch(/^(Condição para |Recomendada antes de |Para acompanhar$)/);
        Object.values(r).forEach(v => { if (typeof v === 'string') expect(v, k + ' ' + r.id).not.toMatch(PROIBIDAS); });
        expect(r).not.toHaveProperty('alta');
        expect(['alta', 'media']).toContain(r.prioridade);         // compatibilidade: 'alta' = Condição
        expect(r.prioridade === 'alta').toBe(r.condicao);
      });
      R.cartoes.forEach((c: any) => expect(c.rotuloNivel).toMatch(/^(Condição para |Recomendada antes de |Para acompanhar$)/));
      R.grupos.forEach((g: any) => expect(g.rotuloNivel).not.toMatch(PROIBIDAS));
      const sec: any = secaoRecomendacoes(null, exemplo(k));
      JSON.stringify(sec).split('"').forEach(s => expect(s).not.toMatch(PROIBIDAS));
    }
  });
  it('rótulos: "Condição para autorizar o teste", "Recomendada antes de levar ao mercado", "Para acompanhar"; PRIO_REC sem "Alta"/"Média"', () => {
    expect(rotuloNivel('condicao', 'M1')).toBe('Condição para autorizar o teste');
    expect(rotuloNivel('recomendada', 'M3')).toBe('Recomendada antes de levar ao mercado');
    expect(rotuloNivel('acompanhar', 'M5')).toBe('Para acompanhar');
    expect(rotuloNivelCurto('acompanhar')).toBe('Para acompanhar');
    Object.values(PRIO_REC as Record<string, string>).forEach(v => expect(v).not.toMatch(PROIBIDAS));
    expect((PRIO_REC as any).alta).toBe('Condição');
  });
  it.todo('PDF e telas sem "Alta"/"Média" (pacote R6: plano/secoes.js B1 ainda escreve "Alta"/"Média" na governança; pdf.js e painel.ts dizem "ações de prioridade alta")');
});

describe('REC-20: os 5 cartões (4.3)', () => {
  it('no máximo 5, nenhuma ação genérica, 1 por pacote (PESSOAS pode dar 2 com risco alto)', () => {
    for (const k of EX) {
      const R = res(k), alto = recContexto(exemplo(k)).alto;
      expect(R.cartoes.length).toBe(5);
      R.cartoes.forEach((c: any, i: number) => {
        expect(c.n).toBe(i + 1);
        expect(c.lider.generica).toBe(false);
        c.ids.forEach((id: string) => expect(item(R, id).pacote).toBe(c.pacote));
        c.ids.forEach((id: string) => expect(item(R, id).marco).toBe(c.marco));
        expect(c.passos.map((p: any) => p.id)).toEqual(c.ids.slice(1));
        c.passos.forEach((p: any) => expect(p.origem.campo).toBeTruthy());
      });
      const porPacote: Record<string, number> = {};
      R.cartoes.forEach((c: any) => { porPacote[c.pacote] = (porPacote[c.pacote] || 0) + 1; });
      Object.entries(porPacote).forEach(([p, n]) => expect(n, k + ' ' + p).toBeLessThanOrEqual(p === 'PESSOAS' && alto ? 2 : 1));
    }
  });
  it('as Condições do próximo marco vêm primeiro; as lentes ausentes ganham vaga', () => {
    for (const k of EX) {
      const R = res(k);
      const nCond = R.cartoes.filter((c: any) => c.nivel === 'condicao' && c.marco === R.proxMarco).length;
      R.cartoes.slice(0, nCond).forEach((c: any) => expect(c.motivo).toBe('condicao'));
      // 4.3, item 3: "se sobrar vaga" depois das Condições, as três lentes aparecem quando há candidato Condição ou
      // Recomendada até M3. Com 5 cartões de Condição (B e C, com o aviso de 4.3, item 5) não sobra vaga.
      const porCondicao = R.cartoes.filter((c: any) => c.motivo === 'condicao').length;
      if (porCondicao >= 5) { expect(R.avisoCondicoes, k).not.toBe(null); continue; }
      ['decisao', 'pessoas', 'custo'].forEach(l => {
        const tem = R.recs.some((r: any) => r.lente === l && !r.generica && r.nivel !== 'acompanhar' && ['M1', 'M2', 'M3'].includes(r.marco));
        if (tem) expect(R.cartoes.some((c: any) => c.lente === l), k + ' ' + l).toBe(true);
      });
    }
  });
  it('B (risco elevado): dois cartões de PESSOAS; A (moderado): as Condições de PESSOAS ficam num só cartão', () => {
    const b = res('B').cartoes.filter((c: any) => c.pacote === 'PESSOAS');
    expect(b.length).toBe(2);
    const R = resCom('A', [regra('R-901', { pacote: 'PESSOAS', condicao: cond }), regra('R-902', { pacote: 'PESSOAS', condicao: cond })]);
    expect(R.cartoes.filter((c: any) => c.pacote === 'PESSOAS').map((c: any) => c.ids)).toEqual([['R-901', 'R-902']]);
  });
  it('no empate da etapa 4, no máximo 1 cartão por pergunta de origem', () => {
    const R = resCom('A', [
      regra('R-901', { condicao: cond, campos: ['alternativa'] }),
      regra('R-902', { pacote: 'DADOS', condicao: cond, campos: ['internet'] }),
      regra('R-903', { pacote: 'PESSOAS', condicao: cond, campos: ['modeloDisp'] }),
      regra('R-904', { pacote: 'COMPRA', tipo: 'custo', semExige: 'teste', condicao: cond, campos: ['pagamento'] }),
      regra('R-905', { pacote: 'TESTE', campos: ['alternativa'] }),      // mesma pergunta do cartão 1
      regra('R-906', { pacote: 'ESCALA', campos: ['linhaBase'] }),
    ]);
    expect(item(R, 'R-905').pontos).toBe(item(R, 'R-906').pontos);
    const ids = R.cartoes.map((c: any) => c.id);
    expect(ids).toContain('R-906');
    expect(ids).not.toContain('R-905');
  });
  it('resposta sugerida: só lidera cartão se for Condição, sempre com "(a confirmar na pergunta n)"', () => {
    const e = Object.assign({}, exemplo('B'), { respC: {} });
    const R: any = resultadoRecomendacoes(e);
    const r26 = R.cartoes.find((c: any) => c.id === 'R-26');
    expect(r26.etiqueta).toBe('(a confirmar na pergunta 2.1.1)');
    expect(item(R, 'R-26').confirmar).toBe('(a confirmar na pergunta 2.1.1)');
    R.cartoes.forEach((c: any) => { if (c.lider.origem.sugerido) expect(c.nivel).toBe('condicao'); });
    // A sem confirmações: R-37 (Recomendada, sobre resposta sugerida) não lidera cartão, mas fica no "O que fazer"
    const A: any = resultadoRecomendacoes(Object.assign({}, exemplo('A'), { respC: {} }));
    expect(A.cartoes.map((c: any) => c.id)).not.toContain('R-37');
    expect(A.grupos.flatMap((g: any) => g.ids)).toContain('R-37');
    // trCartao: textos traduzidos e a etiqueta
    expect((trCartao(r26) as any).etiqueta).toBe('(a confirmar na pergunta 2.1.1)');
    expect((trCartao(r26) as any).rotuloNivel).toBe('Condição para autorizar o teste');
  });
});

describe('REC-21: veredito da próxima decisão (4.4)', () => {
  it('três partes; o mesmo texto em todas as chamadas e na versão traduzida (capa, Em resumo, PDF, síntese)', () => {
    for (const k of EX) {
      const v = res(k).veredito;
      expect(v.texto).toMatch(/^Próxima decisão: .+\. (Pode avançar|Pode avançar com condições|Ainda não avance)/);
      expect(v.texto).toMatch(/(Faltam|Comece por): .+\.$/);
      expect(v.faltam.length).toBe(3);
      expect(v.faltam.map((f: any) => f.id)).toEqual(res(k).cartoes.slice(0, 3).map((c: any) => c.id));
      expect(res(k).veredito.texto).toBe(v.texto);
      expect((trVeredito(v) as any).texto).toBe(v.texto);
      expect(v.porque).toMatch(/\S/);
    }
  });
  it('B: "Ainda não avance para o piloto" (gatilho ii, mais o iv); C: "Ainda não" por mais de 5 Condições (iv); A e D: com condições', () => {
    const b = res('B').veredito;
    expect(b.codigo).toBe('nao');
    // integração R4: com as regras novas o B tem mais de 5 Condições; o gatilho do piloto vem primeiro e dá a frase
    expect(b.gatilhos).toEqual(['piloto', 'excesso']);
    expect(b.texto).toMatch(/^Próxima decisão: autorizar o teste\. Ainda não avance para o piloto/);
    expect(res('A').veredito.texto).toMatch(/^Próxima decisão: autorizar o piloto em 20 escolas\. Pode avançar com condições\. Faltam: /);
    expect(res('A').veredito.porque).toBe(res('A').condicoes.length + ' condições abertas para autorizar o teste.');
    // seção 4.6: o C pode sair "com condições" ou "Ainda não" (mais de 5 Condições); com o catálogo completo é "Ainda não"
    const C = res('C'), c = C.veredito;
    expect(C.condicoes.length).toBeGreaterThan(MAX_CONDICOES);
    expect([c.codigo, c.gatilhos]).toEqual(['nao', ['excesso']]);
    expect(c.texto).toMatch(new RegExp('^Próxima decisão: autorizar a prova de conceito\\. Ainda não avance: há ' + C.condicoes.length + ' condições abertas para autorizar o teste\\.'));
    expect(c.porque).toBe('Há ' + C.condicoes.length + ' condições abertas para autorizar o teste, mais do que dá para cumprir antes da decisão.');
    expect(res('D').veredito.texto).toMatch(/^Próxima decisão: autorizar a prova de conceito gratuita\. Pode avançar com condições\./);
  });
  it('"Ainda não avance" só nos 4 gatilhos: R-05, piloto antes da prova de conceito, R-32 como Condição, mais de 5 Condições', () => {
    expect(resCom('A', [regra('R-901')]).veredito.codigo).toBe('pode');
    expect(resCom('A', [regra('R-901')]).veredito.texto).toMatch(/Pode avançar\. Comece por: /);
    expect(resCom('A', [regra('R-901', { condicao: cond })]).veredito.codigo).toBe('condicoes');
    const p = resCom('A', [regra('R-05'), regra('R-901', { condicao: cond })]).veredito;
    expect([p.codigo, p.gatilhos]).toEqual(['nao', ['problema']]);
    expect(p.frase).toMatch(/^Ainda não avance: descreva primeiro o problema/);
    expect(resCom('A', [regra('R-32', { pacote: 'PESSOAS' })]).veredito.codigo).toBe('pode');      // R-32 Recomendada não basta
    const c = resCom('A', [regra('R-32', { pacote: 'PESSOAS', condicao: cond })]).veredito;
    expect([c.codigo, c.gatilhos]).toEqual(['nao', ['contestacao']]);
    // 5 Condições ainda é "com condições"; 6 é "Ainda não"
    const nConds = (n: number) => Array.from({ length: n }, (_, i) => regra('R-9' + (10 + i), { condicao: cond }));
    expect(resCom('A', nConds(MAX_CONDICOES)).veredito.codigo).toBe('condicoes');
    const x = resCom('A', nConds(6)).veredito;
    expect([x.codigo, x.gatilhos]).toEqual(['nao', ['excesso']]);
    expect(x.frase).toBe('Ainda não avance: há 6 condições abertas para autorizar o teste.');
  });
  it('as Condições de outro marco não contam; o "Faltam" usa o texto curto quando a regra o tem', () => {
    const R = resCom('A', [regra('R-901', { condicao: cond, curto: 'o pacote de dados' }), regra('R-902', { condicao: cond, marco: 'M3', pacote: 'TESTE' })]);
    expect(R.veredito.nCondicoes).toBe(1);
    expect(R.veredito.texto).toMatch(/Faltam: o pacote de dados; /);
    expect((trVeredito(R.veredito) as any).faltam[0]).toBe('o pacote de dados');
  });
});

describe('REC-22: aviso de mais de 5 Condições no próximo marco', () => {
  it('com 7 Condições, "Faltam 7 condições para autorizar o teste", a lista e os 5 cartões de maior pontuação', () => {
    const R = resCom('A', Array.from({ length: 7 }, (_, i) => regra('R-9' + (10 + i), {
      condicao: cond, pacote: ['PROB', 'TESTE', 'ESCALA', 'DADOS', 'PESSOAS', 'USO', 'GOV'][i],
    })));
    expect(R.avisoCondicoes.texto).toBe('Faltam 7 condições para autorizar o teste.');
    expect(trAviso(R.avisoCondicoes)).toBe('Faltam 7 condições para autorizar o teste.');
    expect(R.avisoCondicoes.lista.map((x: any) => x.id).sort()).toEqual(R.condicoes.slice().sort());
    expect(R.avisoCondicoes.lista.length).toBe(7);
    expect(R.cartoes.every((c: any) => c.nivel === 'condicao')).toBe(true);
    const top5 = R.avisoCondicoes.lista.slice(0, 5).map((x: any) => x.id).sort();
    expect(R.cartoes.map((c: any) => c.id).sort()).toEqual(top5);
    expect(R.veredito.codigo).toBe('nao');
  });
  it('sem aviso com até 5 Condições (A e D); B e C mostram o aviso com a lista (REC-22)', () => {
    for (const k of ['A', 'D']) {
      expect(res(k).condicoes.length).toBeLessThanOrEqual(MAX_CONDICOES);
      expect(res(k).avisoCondicoes).toBe(null);
    }
    for (const k of ['B', 'C']) {
      const R = res(k), a = R.avisoCondicoes;
      expect(a, k).not.toBe(null);
      expect(a.n).toBe(R.condicoes.length);
      expect(a.texto).toBe('Faltam ' + R.condicoes.length + ' condições para autorizar o teste.');
      expect(a.lista.map((x: any) => x.id).sort()).toEqual(R.condicoes.slice().sort());
      expect(R.cartoes.every((c: any) => c.nivel === 'condicao' && c.marco === R.proxMarco)).toBe(true);
    }
  });
});

describe('REC-23: "O que fazer" por pacote', () => {
  it('no máximo 12 itens no nível de cima (11 pacotes e as pendências), com todas as ações e as suas origens', () => {
    for (const k of EX) {
      const R = res(k);
      expect(R.grupos.length + (R.pend.length ? 1 : 0)).toBeLessThanOrEqual(12);
      expect(new Set(R.grupos.map((g: any) => g.pacote)).size).toBe(R.grupos.length);
      const nosGrupos = R.grupos.flatMap((g: any) => g.itens);
      const acoes = R.recs.filter((r: any) => !r.generica);
      expect(nosGrupos.map((r: any) => r.id).sort()).toEqual(acoes.map((r: any) => r.id).sort());
      // cada passo mostra o R-nn e a origem
      expect(new Set(nosGrupos.map((r: any) => r.id + '|' + r.origem.campo + '|' + r.origem.resposta)))
        .toEqual(new Set(acoes.map((r: any) => r.id + '|' + r.origem.campo + '|' + r.origem.resposta)));
      R.grupos.forEach((g: any) => {
        expect(g.marcos.flatMap((m: any) => m.itens.map((x: any) => x.id)).sort()).toEqual(g.ids.slice().sort());
        g.itens.forEach((x: any) => { expect(x.pacote).toBe(g.pacote); expect(x.id).toMatch(/^R-\d+$/); });
      });
      // as genéricas ficam na base comum
      expect(R.baseComum.map((r: any) => r.id)).toEqual(R.recs.filter((r: any) => r.generica).map((r: any) => r.id));
      expect(R.baseComum.map((r: any) => r.id)).toContain('R-112');
    }
  });
  it('a ordem dos grupos segue a melhor ação de cada um', () => {
    const R = res('B');
    expect(R.grupos[0].pacote).toBe('DADOS');
    R.grupos.forEach((g: any, i: number) => { if (i) expect(R.grupos[i - 1].pontos).toBeGreaterThanOrEqual(g.pontos); });
  });
});

describe('REC-24: caso incompleto e caso em branco (3.3, item 4)', () => {
  it('C: as pendências citam tipoTec, licenca, arquitetura e nFerramentas; a arquitetura é premissa com o efeito no custo', () => {
    const R = res('C');
    expect(R.pend.map((p: any) => p.campo)).toEqual(expect.arrayContaining(['tipoTec', 'licenca', 'arquitetura', 'nFerramentas']));
    const tipos = Object.fromEntries(R.pend.map((p: any) => [p.campo, p.tipo]));
    expect(tipos).toMatchObject({ tipoTec: 'nao_sei', licenca: 'nao_sei', arquitetura: 'premissa', nFerramentas: 'nao_sei' });
    const ef = R.pend.find((p: any) => p.campo === 'arquitetura').efeito;
    expect(ef.valores.map((v: any) => v.arq)).toEqual(['saas', 'api', 'ow']);
    ef.valores.forEach((v: any) => expect(v.total).toBeGreaterThan(0));
    // nenhuma pendência vira ação
    expect(R.recs.map((r: any) => r.id)).not.toContain('R-61');
  });
  it('B: o custo na arquitetura presumida (pesos abertos) é o custo total do caso', () => {
    const e = exemplo('B');
    const R: any = resultadoRecomendacoes(e);
    const ef = R.pend.find((p: any) => p.campo === 'arquitetura').efeito;
    const ow = ef.valores.find((v: any) => v.arq === 'ow').total;
    expect(Math.abs(ow - (recContexto(e) as any).d.total)).toBeLessThan(1);
  });
  it('respostas sugeridas não confirmadas vão para "Antes de decidir, responda" com as ações que dependem delas', () => {
    const R: any = resultadoRecomendacoes(Object.assign({}, exemplo('B'), { respC: {} }));
    const s = R.pend.find((p: any) => p.tipo === 'sugerida' && p.campo === 'tarefas');
    expect(s.dependem).toContain('R-26');
    expect(s.n).toBe('2.1.1');
    expect(pendenciasSugeridas([{ id: 'R-1', origem: { campo: 'x', n: '9.9', sugerido: true } }, { id: 'R-2', origem: { campo: 'y' } }]).map((p: any) => p.campo)).toEqual(['x']);
    // os exemplos, com as respostas confirmadas, não têm pendência sugerida
    for (const k of EX) expect(res(k).pend.filter((p: any) => p.tipo === 'sugerida')).toEqual([]);
  });
  it('caso em branco: "Ainda sem recomendações" e as 3 perguntas que mais liberam ações (2.0, 2.1.1 e 2.3.5)', () => {
    const R = res('novo');
    expect(R.recs).toEqual([]);
    expect(R.cartoes).toEqual([]);
    expect(R.grupos).toEqual([]);
    expect(R.veredito.codigo).toBe('sem');
    expect(R.veredito.texto).toBe('Ainda sem recomendações');
    expect((trVeredito(R.veredito) as any).texto).toBe('Ainda sem recomendações');
    expect(R.vazio.texto).toBe('Ainda sem recomendações');
    expect(R.vazio.perguntas.map((p: any) => p.n)).toEqual(['2.0', '2.1.1', '2.3.5']);
    R.vazio.perguntas.forEach((p: any) => { expect(p.pergunta).toMatch(/\?$/); expect(p.ir).toMatch(/:/); });
    expect((resultadoRecomendacoes({} as any) as any).veredito.codigo).toBe('sem');
    for (const k of EX) expect(res(k).vazio).toBe(null);
  });
});

describe('textos novos do pacote R3', () => {
  it('TEXTOS_REC_R3 traz as frases do veredito, dos níveis e do caso em branco', () => {
    ['Pode avançar com condições.', 'Ainda não avance para o piloto: comece por uma prova de conceito.', 'Condição para {marco}',
      'Recomendada antes de {marco}', 'Para acompanhar', 'Faltam {n} condições para {marco}.', 'Ainda sem recomendações', 'autorizar o teste',
      '(a confirmar na pergunta {n})', 'Custo total do caso em cada arquitetura'].forEach(s => expect(TEXTOS_REC_R3).toContain(s));
  });
});
