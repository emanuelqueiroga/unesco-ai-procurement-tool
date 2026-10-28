// Pacote R4, sub-pacote 4c (Compra, contrato, orçamento e governança; REC-28): regras R-55 a R-74 e R-83 a R-87
// (regras/compra.js, contrato.js, orc.js e gov.js), nos exemplos A a D.
// Decisão 5: a frase principal nunca cita lei; exemplos de norma (Brasil e UE) ficam em `exemplosNorma`, recolhidos.
// Decisão 3: a R-72 orça pelo P50 e reserva até o P90; é "alta" quando o P50 passa 5% do valor central.
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { useCaso } from '../../src/store/caso';
import { setLang, setMoeda, setTabelaMoedas, resultadoRecomendacoes, recContexto, REGRAS, REGRA_POR_ID, mapaLegado } from '../../src/domain';
import { REGRAS_COMPRA, NOTA_EXEMPLOS_NORMA, TEXTOS_REC_R4C } from '../../src/domain/regras/compra.js';
import { REGRAS_CONTRATO } from '../../src/domain/regras/contrato.js';
import { REGRAS_ORC } from '../../src/domain/regras/orc.js';
import { REGRAS_GOV } from '../../src/domain/regras/gov.js';
import { EXIGE } from '../../src/domain/regras/index.js';
import { lintRegra } from '../../src/domain/regras/lint.js';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
beforeAll(() => { setTabelaMoedas(JSON.parse(fs.readFileSync(path.join(RAIZ, 'data', 'moedas.json'), 'utf8'))); });
afterEach(() => { setLang('pt'); setMoeda({ cod: 'USD', taxa: '', taxaDe: '' }); });
function exemplo(k: string, resp: Record<string, any> = {}): any {
  setLang('pt');
  useCaso.getState().carregarExemplo(k);
  Object.entries(resp).forEach(([campo, v]) => useCaso.getState().responder(campo, v));
  const e: any = useCaso.getState().estado();
  setMoeda(e.moeda);
  return e;
}
const res = (k: string, resp: Record<string, any> = {}): any => resultadoRecomendacoes(exemplo(k, resp));
const ids = (k: string, resp: Record<string, any> = {}): string[] => res(k, resp).recs.map((r: any) => r.id);
const porId = (k: string, id: string, resp: Record<string, any> = {}): any => res(k, resp).recs.find((r: any) => r.id === id);
const ctx = (k: string, resp: Record<string, any> = {}): any => recContexto(exemplo(k, resp));
const texto = (r: any) => [r.oque, r.razao, ...(r.como || []), r.paraque, r.pronto].join(' ');

const MINHAS = ['R-55', 'R-56', 'R-57', 'R-58', 'R-59', 'R-60', 'R-61', 'R-62', 'R-63', 'R-64', 'R-65', 'R-66', 'R-67', 'R-68', 'R-69', 'R-70', 'R-71',
  'R-72', 'R-73', 'R-74', 'R-83', 'R-84', 'R-85', 'R-86', 'R-87'];
const REGRAS_4C: any[] = ([] as any[]).concat(REGRAS_COMPRA as any[], REGRAS_CONTRATO as any[], REGRAS_ORC as any[], REGRAS_GOV as any[]);
const DAS_MINHAS = REGRAS_4C.filter(r => MINHAS.includes(r.id));
// leis, diretivas, regulamentos, instruções normativas e artigos: nunca na frase principal (decisão 5)
const RE_NORMA = /\bLei\b|\bDiretiva\b|\bRegulamento\b|\bIN SEGES\b|\bart\.|\barts\.|\bLGPD\b|\bGDPR\b|\bFERPA\b|\bCOPPA\b|\bDecreto\b|\bPortaria\b|\bResolução\b/;
const textosDaRegra = (r: any): string[] => {
  const T: string[] = [r.paraque, r.pronto];
  (r.variantes || []).forEach((v: any) => T.push(v.oque, v.porque, ...(v.como || []), v.paraque, v.pronto));
  return T.filter(Boolean);
};

describe('REC-28 (4c): catálogo', () => {
  it('as 25 regras R-55 a R-74 e R-83 a R-87 existem, com ids únicos, e passam no lint', () => {
    MINHAS.forEach(id => {
      const r = (REGRA_POR_ID as any)[id];
      expect(r, id).toBeTruthy();
      expect(lintRegra(r), id).toEqual([]);
    });
    const L = REGRAS_4C.map(r => r.id);
    expect(new Set(L).size).toBe(L.length);
    expect(REGRAS_4C.filter(r => MINHAS.includes(r.id)).length).toBe(MINHAS.length);
  });
  it('pacotes: R-55 a R-63 COMPRA, R-64 a R-71 CONTRATO, R-72 a R-74 ORC, R-83 a R-87 GOV', () => {
    const P = (a: number, b: number) => MINHAS.filter(id => +id.slice(2) >= a && +id.slice(2) <= b);
    P(55, 63).forEach(id => expect((REGRA_POR_ID as any)[id].pacote, id).toBe('COMPRA'));
    P(64, 71).forEach(id => expect((REGRA_POR_ID as any)[id].pacote, id).toBe('CONTRATO'));
    P(72, 74).forEach(id => expect((REGRA_POR_ID as any)[id].pacote, id).toBe('ORC'));
    P(83, 87).forEach(id => expect((REGRA_POR_ID as any)[id].pacote, id).toBe('GOV'));
  });
  it('as regras de custo ligam a cláusula (exige) ou dizem por que não geram cláusula (semExige); todos os ids de exige existem em EXIGE', () => {
    DAS_MINHAS.forEach(r => {
      if (r.tipo === 'custo' || r.pacote === 'CONTRATO') expect(!!(r.exige && r.exige.length) || !!r.semExige, r.id).toBe(true);
      (r.exige || []).forEach((x: string) => expect((EXIGE as any)[x], r.id + ' ' + x).toBeTruthy());
    });
  });
  it('as 9 cláusulas novas foram acrescentadas a EXIGE, com grupo e texto', () => {
    ['etapa-sem-obrigacao', 'nao-preferencia', 'planilha-precos', 'demonstracao', 'preco-faixa', 'desconto-sla', 'ativos-desenvolvidos',
      'matriz-riscos', 'gestor-fiscais'].forEach(s => {
      const c = (EXIGE as any)['CONTRATO.' + s];
      expect(c, s).toBeTruthy();
      expect(c.grupo, s).toBeTruthy();
      expect(c.texto.length, s).toBeGreaterThan(30);
      expect(TEXTOS_REC_R4C, s).toContain(c.texto);
    });
    // e as que já existiam continuam
    ['custo-unidades', 'saida-exportacao', 'desempenho-sla', 'direitos-ativos'].forEach(s => expect((EXIGE as any)['CONTRATO.' + s], s).toBeTruthy());
  });
  it('as regras que saem continuam com destino', () => {
    const m = mapaLegado() as Record<string, string[]>;
    expect(m['gratis-fim']).toEqual(['R-57']);
    expect(m['lic-institucional']).toEqual(['R-61']);
    expect(m['teste-ambos-contrato']).toEqual(['R-56']);
    expect(m['expansao-recorrente']).toEqual(['R-73']);
    expect(m['g-comite']).toEqual(['R-83']);
    expect(m['tecnologia']).toContain('R-55');
  });
});

describe('Decisão 5: a frase principal não cita lei; os exemplos de norma ficam à parte, só Brasil e UE', () => {
  it('nenhum oque, porque, passo, paraque ou pronto das minhas regras traz lei, diretiva, regulamento ou artigo', () => {
    DAS_MINHAS.forEach(r => textosDaRegra(r).forEach(t => expect(RE_NORMA.test(t), r.id + ': ' + t).toBe(false)));
  });
  it('exemplosNorma só tem as chaves BR e UE, com textos não vazios', () => {
    const comNorma = DAS_MINHAS.filter(r => r.exemplosNorma);
    expect(comNorma.length).toBeGreaterThanOrEqual(8);
    comNorma.forEach(r => {
      Object.entries(r.exemplosNorma).forEach(([pais, lista]: [string, any]) => {
        expect(['BR', 'UE'], r.id + ' ' + pais).toContain(pais);
        expect(lista.length, r.id).toBeGreaterThan(0);
        lista.forEach((t: string) => expect(t.length, r.id).toBeGreaterThan(15));
      });
    });
  });
  it('a recomendação carrega exemplosNorma (para o botão recolhido) e a nota manda confirmar com a assessoria jurídica', () => {
    const r59 = porId('A', 'R-59');
    expect(r59.exemplosNorma.BR[0]).toMatch(/14\.133/);
    expect(r59.exemplosNorma.UE[0]).toMatch(/2014\/24\/UE/);
    expect(texto(r59)).not.toMatch(RE_NORMA);
    expect(NOTA_EXEMPLOS_NORMA).toMatch(/confirme com a assessoria jurídica/);
    expect(TEXTOS_REC_R4C).toContain(NOTA_EXEMPLOS_NORMA);
    expect(TEXTOS_REC_R4C).toContain('Lei 14.133/2021, art. 23 (valor estimado)');
    expect(new Set(TEXTOS_REC_R4C).size).toBe(TEXTOS_REC_R4C.length);
  });
});

describe('REC-28: A, B, C e D', () => {
  it('A: R-04 (agente 4a) e R-56 entre os 5 cartões; a R-56 é Condição do marco M1', () => {
    const R = res('A');
    const lideres = R.cartoes.map((c: any) => c.id);
    expect(lideres).toContain('R-04');
    expect(lideres).toContain('R-56');
    expect(R.cartoes.length).toBe(5);
    const r = R.recs.find((x: any) => x.id === 'R-56');
    expect(r.nivel).toBe('condicao');
    expect(r.marco).toBe('M1');
    expect(r.oque).toMatch(/^Contratar o teste sem criar direito de continuar/);
    expect(r.exige).toEqual(expect.arrayContaining(['CONTRATO.etapa-sem-obrigacao']));
  });
  it('D (teste gratuito): R-57 lidera o cartão e é Condição; a regra antiga gratis-fim não aparece', () => {
    const R = res('D');
    expect(R.cartoes.map((c: any) => c.id)).toContain('R-57');
    expect(R.recs.map((r: any) => r.id)).not.toContain('gratis-fim');
    expect(R.recs.map((r: any) => r.id)).not.toContain('gratis-ativos');
    const r = R.recs.find((x: any) => x.id === 'R-57');
    expect(r.nivel).toBe('condicao');
    expect(r.marco).toBe('M1');
    expect(r.oque).toMatch(/instrumento publicado/);
    expect(r.exige).toContain('CONTRATO.nao-preferencia');
    expect(r.razao).toMatch(/US\$ [\d.,]+/);
  });
  it('A, B e D têm a R-64 (níveis de serviço do sistema, com desconto na fatura)', () => {
    ['A', 'B', 'D'].forEach(k => expect(ids(k), k).toContain('R-64'));
    const r = porId('A', 'R-64');
    expect(r.exige).toEqual(expect.arrayContaining(['CONTRATO.desempenho-sla', 'CONTRATO.desconto-sla']));
    expect(r.oque).toMatch(/^Fixar níveis de serviço/);
  });
  it('C (previsão, tipo de tecnologia sem resposta): R-60, R-61, R-64, R-65 e R-70 suspensas até responder 3.1', () => {
    const R = res('C');
    const susp = R.suspensas.map((s: any) => s.id);
    ['R-60', 'R-61', 'R-64', 'R-65', 'R-70'].forEach(id => {
      expect(susp, id).toContain(id);
      expect(R.recs.map((r: any) => r.id), id).not.toContain(id);
    });
  });
  it('as minhas regras que ficam em A, B, C e D respeitam o limite de palavras do cartão (oque ≤ 25 e razão ≤ 30, com os números preenchidos)', () => {
    ['A', 'B', 'C', 'D'].forEach(k => res(k).recs.filter((r: any) => MINHAS.includes(r.id)).forEach((r: any) => {
      expect(r.oque.split(/\s+/).length, k + ' ' + r.id + ' oque').toBeLessThanOrEqual(25);
      expect(r.razao.split(/\s+/).length, k + ' ' + r.id + ' razão').toBeLessThanOrEqual(30);
      expect(r.oque, k + ' ' + r.id).not.toMatch(/[{}]/);
      expect(r.razao, k + ' ' + r.id).not.toMatch(/[{}]/);
    }));
  });
  it('caso em branco: nenhuma das minhas regras dispara', () => {
    const R = res('novo');
    expect(R.recs.filter((r: any) => MINHAS.includes(r.id))).toEqual([]);
  });
});

describe('R-72: orçar pelo P50 e reservar até o P90 (decisão 3)', () => {
  it('A: números da simulação na razão (central, P50, P10, P90 e a diferença percentual)', () => {
    const r = porId('A', 'R-72');
    expect(r).toBeTruthy();
    expect(r.oque).toMatch(/^Orçar pelo P50/);
    expect(r.razao).toMatch(/P50 é US\$ [\d.,]+ (mi|mil)/);
    expect(r.razao).toMatch(/P10/);
    expect(r.razao).toMatch(/P90/);
    expect(r.como.join(' ')).toMatch(/\+[\d.,]+% sobre o valor central/);
    expect(r.numero.id).toBe('p50');
    expect(r.marco).toBe('M3');
  });
  it('é "alta" só quando o P50 passa 5% do valor central', () => {
    const alta = (REGRA_POR_ID as any)['R-72'].alta;
    expect(alta({ d: { p50Delta: 0.06 } })).toBe(true);
    expect(alta({ d: { p50Delta: 0.05 } })).toBe(false);
    expect(alta({ d: { p50Delta: 0.01 } })).toBe(false);
    expect(alta({ d: null })).toBe(false);
    expect(alta(ctx('A'))).toBe(ctx('A').d.p50Delta > 0.05);
  });
  it('a variante com a diferença só vale quando o P50 passa 0,5% do central; abaixo disso a frase não promete diferença', () => {
    const v = (REGRA_POR_ID as any)['R-72'].variantes;
    expect(v.length).toBe(2);
    expect(v[0].quando({ d: { p50Delta: 0.02 } })).toBe(true);
    expect(v[0].quando({ d: { p50Delta: 0.001 } })).toBe(false);
  });
});

describe('R-73: dotação de cada exercício (substitui expansao-recorrente)', () => {
  it('A: parte recorrente e faixa anual na razão; é Recomendada enquanto a dotação não for dita como ausente', () => {
    const r = porId('A', 'R-73');
    expect(r.oque).toMatch(/^Reservar a dotação de cada exercício/);
    expect(r.razao).toMatch(/\d+% do custo total é recorrente, de US\$ [\d.,]+ (mi|mil) a US\$ [\d.,]+ (mi|mil) por ano/);
    expect(r.nivel).toBe('recomendada');
    expect(r.numero.id).toBe('recorrente');
  });
  it('vira Condição quando o contrato passa de um exercício e a dotação (pergunta nova) não está prevista', () => {
    ['nao', 'parcial', 'nao_sei'].forEach(v => expect(porId('A', 'R-73', { dotacao: v }).nivel, v).toBe('condicao'));
    expect(porId('A', 'R-73', { dotacao: 'sim' }).nivel).toBe('recomendada');
  });
  it('a regra antiga expansao-recorrente tem destino na R-73', () => {
    expect((REGRA_POR_ID as any)['R-73'].substitui).toContain('expansao-recorrente');
  });
});

describe('R-74: confirmar a premissa que mais move o custo', () => {
  it('A: a razão nomeia a premissa e a faixa; o passo pede contrato de referência ou cotações', () => {
    const r = porId('A', 'R-74');
    expect(r.razao).toMatch(/A premissa que mais move o custo é .+ \(/);
    expect(r.numero.id).toBe('premissa');
    expect(r.como.join(' ')).toMatch(/cotações de mais de um fornecedor/);
    expect(r.quem).toEqual(expect.arrayContaining(['compras', 'orcamento']));
  });
});

describe('R-61: licença por usuário ou institucional (adoção de equilíbrio)', () => {
  it('A: razão com a adoção prevista e a de equilíbrio; passo com preço por faixa de usuários ativos', () => {
    const r = porId('A', 'R-61');
    expect(r).toBeTruthy();
    expect(r.razao).toMatch(/\d+% a \d+%/);
    expect(r.razao).toMatch(/\d+% de equilíbrio/);
    expect(r.numero.id).toBe('aEq');
    expect(r.exige).toContain('CONTRATO.preco-faixa');
  });
});

describe('R-68: pagamento por consumo, sem duplicar a R-76 (REC-30)', () => {
  it('B (modelo aberto com pagamento por consumo): R-68 suspensa pela incoerência; com 3.2.1 = api ela volta', () => {
    expect(ids('B')).toContain('R-76');
    expect(ids('B')).not.toContain('R-68');
    expect(ids('B', { arquitetura: 'api' })).toContain('R-68');
    expect(ids('B', { arquitetura: 'api' })).not.toContain('R-76');
  });
  it('limites e monitoramento do consumo ligam a cláusula custo-consumo', () => {
    const r = porId('B', 'R-68', { arquitetura: 'api' });
    expect(r.exige).toEqual(expect.arrayContaining(['CONTRATO.custo-consumo', 'CONTRATO.custo-unidades']));
  });
});

describe('R-83 a R-87: governança', () => {
  it('R-87 só existe quando a situação é renovar, é Condição do marco M4 e traz o custo anual em regime', () => {
    ['A', 'B', 'C', 'D'].forEach(k => expect(ids(k), k).not.toContain('R-87'));
    const r = porId('A', 'R-87', { situacao: 'renovar' });
    expect(r).toBeTruthy();
    expect(r.nivel).toBe('condicao');
    expect(r.marco).toBe('M4');
    expect(r.razao).toMatch(/US\$ [\d.,]+ (mi|mil)/);
    expect(r.exige).toContain('CONTRATO.saida-exportacao');
    expect(r.exemplosNorma.BR[0]).toMatch(/art\. 107/);
    expect(r.oque).not.toMatch(RE_NORMA);
  });
  it('R-85 (programa de vários anos) é do marco M4 e R-86 (publicar ficha e relatório) é do M2', () => {
    expect((REGRA_POR_ID as any)['R-85'].marco).toBe('M4');
    expect((REGRA_POR_ID as any)['R-86'].marco).toBe('M2');
    expect(ids('A')).toContain('R-86');
  });
  it('R-83 tem a variante da equipe por ato e a nova, de quem opera partes do sistema', () => {
    const r = (REGRA_POR_ID as any)['R-83'];
    expect(r.variantes.length).toBe(2);
    expect(r.substitui).toContain('g-comite');
  });
});
