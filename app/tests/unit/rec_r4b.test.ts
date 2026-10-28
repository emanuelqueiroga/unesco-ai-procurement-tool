// Pacote R4, sub-pacote 4b (pessoas e dados): R-19, R-26 a R-44 com variantes por nível de risco e forma de supervisão
// (REC-27) e a ação de equidade quando o impacto é desigualdade ou inclusão (REC-31). Verificações da coluna
// "Verificação" de design/redesign/05-requisitos-recomendacoes.md, seção 9, nos exemplos A–D, mais casos sintéticos
// para o que os exemplos não cobrem (contestação inexistente, impacto de inclusão, nota e disciplina, recursos).
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { useCaso } from '../../src/store/caso';
import {
  setLang, setMoeda, setTabelaMoedas, resultadoRecomendacoes, REGRAS, REGRA_POR_ID, mapaLegado, lintRegra,
} from '../../src/domain';
import { REGRAS_PESSOAS, CAMPO_CONTESTACAO, contestacaoInexistente } from '../../src/domain/regras/pessoas.js';
import { REGRAS_DADOS } from '../../src/domain/regras/dados.js';

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
// exemplo com mudanças no caso (cópia: o estado do store não é alterado)
function variante(k: string, caso: any): any {
  const e = JSON.parse(JSON.stringify(exemplo(k)));
  e.caso = Object.assign({}, e.caso, caso);
  return e;
}
const res = (e: any): any => resultadoRecomendacoes(e);
const ids = (e: any): string[] => res(e).recs.map((r: any) => r.id);
const item = (e: any, id: string): any => res(e).recs.find((r: any) => r.id === id);
const todoTexto = (r: any) => [r.oque, r.razao, ...(r.como || []), r.paraque, r.pronto].join(' ');
const MINHAS = ['R-19'].concat(Array.from({ length: 19 }, (_, i) => 'R-' + (26 + i)));   // R-26 a R-44
const SO_PESSOAS_DADOS = (REGRAS_PESSOAS as any[]).concat(REGRAS_DADOS as any[]);

describe('catálogo do 4b', () => {
  it('R-19 e R-26 a R-44 existem, uma vez cada, e passam no lint', () => {
    MINHAS.forEach(id => {
      expect(REGRA_POR_ID[id], id).toBeTruthy();
      expect((REGRAS as any[]).filter(r => r.id === id).length, id).toBe(1);
      expect(lintRegra(REGRA_POR_ID[id]), id).toEqual([]);
    });
  });
  it('R-19 é do pacote TESTE (entra no cartão de teste) e absorve `alternativa` junto com R-03', () => {
    expect(REGRA_POR_ID['R-19'].pacote).toBe('TESTE');
    expect((mapaLegado() as Record<string, string[]>)['alternativa'].sort()).toEqual(['R-03', 'R-19']);
  });
  it('pacotes: R-26 a R-30 em DADOS e R-31 a R-44 em PESSOAS', () => {
    ['R-26', 'R-27', 'R-28', 'R-29', 'R-30'].forEach(id => expect(REGRA_POR_ID[id].pacote, id).toBe('DADOS'));
    Array.from({ length: 14 }, (_, i) => 'R-' + (31 + i)).forEach(id => expect(REGRA_POR_ID[id].pacote, id).toBe('PESSOAS'));
  });
  it('exemplosNorma só com Brasil e União Europeia; nenhuma norma no texto principal', () => {
    SO_PESSOAS_DADOS.forEach(r => {
      Object.keys(r.exemplosNorma || {}).forEach(p => expect(['BR', 'UE'], r.id).toContain(p));
      (r.variantes as any[]).forEach(v => [v.oque, v.porque, ...v.como].forEach(t => expect(t, r.id).not.toMatch(/\bLGPD\b|\bRGPD\b|AI Act|ANPD|\bart\.\s?\d/)));
    });
  });
  it('nenhum número do caso escrito no texto (só marcadores {…} com vars)', () => {
    SO_PESSOAS_DADOS.forEach(r => (r.variantes as any[]).forEach(v => [v.oque, v.porque].forEach(t => expect(t, r.id).not.toMatch(/US\$|\d{3,}|\d+\s?%/))));
  });
});

describe('REC-27: conjuntos por exemplo', () => {
  it('C contém R-19, R-41, R-42, R-31 (caso a caso) e R-33', () => {
    const e = exemplo('C');
    const L = ids(e);
    ['R-19', 'R-41', 'R-42', 'R-31', 'R-33'].forEach(id => expect(L, 'C sem ' + id).toContain(id));
    expect(item(e, 'R-31').variante).toBe(0);
    expect(item(e, 'R-31').oque).toMatch(/caso a caso/);
  });
  it('B contém R-34, R-35, R-31 (por exceção) e R-33', () => {
    const e = exemplo('B');
    const L = ids(e);
    ['R-34', 'R-35', 'R-31', 'R-33'].forEach(id => expect(L, 'B sem ' + id).toContain(id));
    expect(item(e, 'R-31').variante).toBe(2);
    expect(item(e, 'R-31').oque).toMatch(/exceção/);
    expect(item(e, 'R-31').oque).not.toMatch(/caso a caso/);
  });
  it('A e D não contêm R-44 (nem as demais regras de risco elevado)', () => {
    ['A', 'D'].forEach(k => {
      const L = ids(exemplo(k));
      ['R-44', 'R-39', 'R-31', 'R-32', 'R-33', 'R-41', 'R-42', 'R-43', 'R-40', 'R-19', 'R-35'].forEach(id => expect(L, k + ' com ' + id).not.toContain(id));
    });
  });
  it('B e C contêm a avaliação de impacto sobre direitos (R-44) e quem pode suspender (R-39)', () => {
    ['B', 'C'].forEach(k => ['R-44', 'R-39'].forEach(id => expect(ids(exemplo(k)), k + ' sem ' + id).toContain(id)));
  });
  it('A tem R-28 e R-38, e nenhuma regra de crianças usuárias nem de dados de estudantes', () => {
    const L = ids(exemplo('A'));
    ['R-28', 'R-37', 'R-38'].forEach(id => expect(L).toContain(id));
    ['R-26', 'R-34', 'R-35', 'R-36'].forEach(id => expect(L).not.toContain(id));
    expect(todoTexto(item(exemplo('A'), 'R-28'))).not.toMatch(/uso adequado à idade/);
  });
  it('C tem R-32, R-36, R-43 e R-44; R-43 só com "recursos" nas consequências', () => {
    const L = ids(exemplo('C'));
    ['R-32', 'R-36', 'R-43', 'R-44'].forEach(id => expect(L, id).toContain(id));
    expect(ids(exemplo('B'))).not.toContain('R-43');
  });
  it('níveis: R-41 e R-33 são Condição no C e Recomendada no B; R-34, R-42 e R-26 são Condição; R-35 é Recomendada', () => {
    const B = exemplo('B'), C = exemplo('C');
    expect(item(C, 'R-41').nivel).toBe('condicao');
    expect(item(B, 'R-41').nivel).toBe('recomendada');
    expect(item(C, 'R-33').nivel).toBe('condicao');
    expect(item(B, 'R-33').nivel).toBe('recomendada');
    expect(item(B, 'R-34').nivel).toBe('condicao');
    ['B', 'C'].forEach(k => ['R-42', 'R-26', 'R-27'].forEach(id => expect(item(exemplo(k), id).nivel, k + ' ' + id).toBe('condicao')));
    expect(item(B, 'R-35').nivel).toBe('recomendada');
  });
  it('cartões: no C, R-41 e R-42 são os dois cartões de Proteção de pessoas; no B, R-31 e R-34', () => {
    const pessoas = (k: string) => res(exemplo(k)).cartoes.filter((c: any) => c.pacote === 'PESSOAS').map((c: any) => c.id).sort();
    expect(pessoas('C')).toEqual(['R-41', 'R-42']);
    expect(pessoas('B')).toEqual(['R-31', 'R-34']);
    // R-19 entra no único cartão de teste do C, e R-27 no cartão de dados com R-26
    const C = res(exemplo('C'));
    expect(C.cartoes.filter((c: any) => c.pacote === 'TESTE').length).toBe(1);
    expect(C.cartoes.find((c: any) => c.pacote === 'TESTE').ids).toContain('R-19');
    expect(C.cartoes.filter((c: any) => c.pacote === 'DADOS').length).toBe(1);
    expect(C.cartoes.find((c: any) => c.pacote === 'DADOS').ids).toEqual(expect.arrayContaining(['R-26', 'R-27']));
  });
  it('o veredito do B cita o pacote de dados, a revisão humana e as regras para crianças usuárias', () => {
    const v = res(exemplo('B')).veredito;
    expect(v.texto).toMatch(/pacote de dados/);
    expect(v.texto).toMatch(/regras para crianças usuárias/);
  });
});

describe('variantes por nível de risco, forma de supervisão e tipo de uso', () => {
  it('R-31 segue a forma de supervisão (caso, crítica, exceção, amostra, sistema)', () => {
    const r = REGRA_POR_ID['R-31'];
    const forma = (f: string) => r.variantes.findIndex((v: any) => !v.quando || v.quando({ forma: f }));
    expect(['caso', 'critica', 'excecao', 'amostra', 'sistema'].map(forma)).toEqual([0, 1, 2, 3, 4]);
  });
  it('R-31 caso a caso pede a conta das horas por semana', () => {
    expect(todoTexto(item(exemplo('C'), 'R-31'))).toMatch(/horas por semana/);
  });
  it('R-33: risco elevado traz o limite de diferença; sem risco elevado, a comparação simples entre grupos', () => {
    const b = item(exemplo('B'), 'R-33'), c = item(exemplo('C'), 'R-33');
    expect(b.variante).toBe(0);
    expect(c.variante).toBe(0);
    expect(b.oque).toMatch(/limite de diferença/);
    const d = item(variante('D', { impactos: ['inclusao'] }), 'R-33');
    expect(d.variante).toBe(1);
    expect(d.oque).not.toMatch(/limite de diferença/);
    expect(d.quem).toContain('inclusao');
    expect(d.nivel).toBe('recomendada');
    expect(d.origem.campo).toBe('impactos');
  });
  it('R-34: com tutoria ou geração, idade, filtros e aviso de que é uma máquina; o texto "uso adequado à idade" fica no B', () => {
    const b = item(exemplo('B'), 'R-34');
    expect(b.variante).toBe(0);
    expect(todoTexto(b)).toMatch(/máquina/);
    expect(todoTexto(b)).toMatch(/uso adequado à idade/);
    expect(todoTexto(b)).toMatch(/filtros/);
    // estudantes usam, mas a ferramenta não gera nem faz tutoria: texto padrão, sem o aviso de máquina
    const e = variante('B', { tarefas: ['correcao'], usuarios: ['estudantes', 'professores'] });
    const r = item(e, 'R-34');
    expect(r.variante).toBe(1);
    expect(todoTexto(r)).not.toMatch(/máquina/);
  });
  it('R-35 só com crianças usuárias e uso diário ou contínuo', () => {
    expect(ids(variante('B', { frequencia: 'eventual' }))).not.toContain('R-35');
    expect(ids(variante('B', { frequencia: 'diaria' }))).toContain('R-35');
    expect(ids(exemplo('C'))).not.toContain('R-35');
  });
  it('R-41: Condição com alerta precoce (texto do limiar); Recomendada quando a indicação de apoio vem de outra tarefa', () => {
    const c = item(exemplo('C'), 'R-41'), b = item(exemplo('B'), 'R-41');
    expect(c.variante).toBe(0);
    expect(c.oque).toMatch(/antes do primeiro alerta/);
    expect(b.variante).toBe(1);
    expect(b.oque).not.toMatch(/alerta/);
  });
  it('R-42: texto do alerta no C; texto das saídas sobre estudantes no B', () => {
    expect(item(exemplo('C'), 'R-42').variante).toBe(0);
    expect(item(exemplo('B'), 'R-42').variante).toBe(1);
    expect(item(exemplo('B'), 'R-42').oque).toMatch(/saídas da ferramenta/);
  });
  it('R-40: nota ou matrícula com uma pessoa; disciplina veda emoções e atenção', () => {
    const nota = item(variante('C', { consequencias: ['nota'] }), 'R-40');
    expect(nota.variante).toBe(1);
    expect(nota.nivel).toBe('condicao');
    expect(nota.exige.length).toBeGreaterThan(0);
    const disc = item(variante('C', { consequencias: ['disciplina'] }), 'R-40');
    expect(disc.variante).toBe(0);
    expect(disc.oque).toMatch(/emoções ou atenção/);
    expect(ids(exemplo('C'))).not.toContain('R-40');
  });
  it('R-27: Condição no marco M1 com dados de estudantes; Recomendada no M3 com dados só de adultos', () => {
    ['B', 'C'].forEach(k => { const r = item(exemplo(k), 'R-27'); expect(r.marco).toBe('M1'); expect(r.nivel).toBe('condicao'); expect(r.variante).toBe(0); });
    const d = item(exemplo('D'), 'R-27');
    expect(d.marco).toBe('M3');
    expect(d.nivel).toBe('recomendada');
    expect(d.variante).toBe(1);
    expect(ids(exemplo('novo'))).not.toContain('R-27');
  });
  it('D: as regras de dados não falam de estudantes nem de famílias', () => {
    const d = item(exemplo('D'), 'R-27');
    expect(todoTexto(d)).not.toMatch(/estudant|famíli|sala de aula|turma/i);
  });
  it('R-43 aparece só com "recursos" e é do marco M3', () => {
    const r = item(variante('A', { consequencias: ['recursos'] }), 'R-43');
    expect(r).toBeTruthy();
    expect(r.marco).toBe('M3');
  });
  it('R-38 só com professores ou estudantes usuários, ou crianças ou famílias afetadas', () => {
    expect(ids(exemplo('A'))).toContain('R-38');
    expect(ids(exemplo('D'))).not.toContain('R-38');
  });
});

describe('R-32 e a pergunta 2.2.5 (contestação)', () => {
  const R32 = (e: any) => item(e, 'R-32');
  it('sem a pergunta (hoje), R-32 é Recomendada: nunca Condição, nem "Ainda não" pela contestação', () => {
    ['B', 'C'].forEach(k => {
      const e = exemplo(k);
      expect(R32(e).nivel, k).toBe('recomendada');
      expect(R32(e).condicao, k).toBe(false);
      expect(res(e).veredito.gatilhos, k).not.toContain('contestacao');
      expect(R32(e).variante, k).toBe(1);      // crianças e famílias afetadas
    });
  });
  it('desconhecida (vazia, "não sei", efetiva ou só formal) nunca vale como "não existe"', () => {
    ['', 'nao_sei', 'efetiva', 'formal', 'na', undefined].forEach(v => {
      const e = variante('C', { [CAMPO_CONTESTACAO]: v });
      expect(contestacaoInexistente({ v: (id: string) => (e.caso as any)[id] ?? '' } as any), String(v)).toBe(false);
      expect(R32(e).condicao, String(v)).toBe(false);
      expect(res(e).veredito.gatilhos, String(v)).not.toContain('contestacao');
    });
  });
  it('só "não existe" torna R-32 Condição, com o texto de criar o caminho antes de usar e o veredito "Ainda não avance"', () => {
    const e = variante('C', { [CAMPO_CONTESTACAO]: 'nao' });
    const r = R32(e);
    expect(r.condicao).toBe(true);
    expect(r.nivel).toBe('condicao');
    expect(r.variante).toBe(0);
    expect(r.oque).toMatch(/antes de usar a ferramenta/);
    const v = res(e).veredito;
    expect(v.codigo).toBe('nao');
    expect(v.gatilhos).toContain('contestacao');
    expect(res(e).condicoes).toContain('R-32');
  });
  it('sem decisão sobre pessoas, R-32 não dispara, mesmo com "não existe"', () => {
    expect(ids(variante('D', { [CAMPO_CONTESTACAO]: 'nao' }))).not.toContain('R-32');
  });
  it('com adultos apenas afetados, vale o texto geral do caminho de contestação', () => {
    const e = variante('C', { afetados: ['servidores'], usuarios: ['gestores'] });
    const r = R32(e);
    expect(r).toBeTruthy();
    expect(r.variante).toBe(2);
    expect(r.nivel).toBe('recomendada');
  });
});

describe('sem consentimento como alternativa (a base legal na rede pública é a tarefa pública)', () => {
  const RUIM = /ou obter consentimento|ou (pedir|colher|coletar) (o )?consentimento|consentimento (das famílias|dos pais) como (base|alternativa)|alternativa ao consentimento/i;
  it('nenhum texto das regras do 4b, em nenhuma variante, oferece o consentimento como alternativa', () => {
    SO_PESSOAS_DADOS.forEach(r => {
      (r.variantes as any[]).forEach(v => [v.oque, v.porque, ...v.como, v.paraque, v.pronto].filter(Boolean).forEach(t => expect(t, r.id).not.toMatch(RUIM)));
      (r.textosExtras || []).forEach((t: string) => expect(t, r.id).not.toMatch(RUIM));
    });
  });
  it('quando o consentimento aparece (só em R-26), ou vem condicionado a uso opcional sem prejuízo, depois da base legal da política educacional, ou é a razão de não usá-lo ("raramente é livre")', () => {
    SO_PESSOAS_DADOS.forEach(r => (r.variantes as any[]).forEach(v => v.como.concat([v.oque, v.porque]).filter((t: string) => /consentiment/i.test(t)).forEach((t: string) => {
      expect(r.id).toBe('R-26');
      if (/raramente é livre/.test(t)) return;
      expect(t).toMatch(/base legal no exercício da política educacional/);
      expect(t).toMatch(/só cabe se o uso for opcional e recusar não trouxer prejuízo/);
    })));
    ['B', 'C'].forEach(k => expect(todoTexto(item(exemplo(k), 'R-26'))).not.toMatch(RUIM));
  });
  it('nas saídas de A–D não há "ou obter consentimento"', () => {
    ['A', 'B', 'C', 'D'].forEach(k => res(exemplo(k)).recs.forEach((r: any) => expect(todoTexto(r), k + ' ' + r.id).not.toMatch(RUIM)));
  });
});

describe('REC-31: impacto de desigualdade ou inclusão pede uma ação de equidade Recomendada ou maior', () => {
  const EQUIDADE = ['R-14', 'R-33'];
  const equidade = (e: any) => res(e).recs.filter((r: any) => EQUIDADE.includes(r.id));
  it('B (desigualdade): R-33 presente como Recomendada ou maior (R-14 vem do pacote 4a)', () => {
    const L = equidade(exemplo('B'));
    expect(L.map((r: any) => r.id)).toContain('R-33');
    expect(L.every((r: any) => r.nivel !== 'acompanhar')).toBe(true);
  });
  for (const impacto of ['desigualdade', 'inclusao']) {
    for (const k of ['A', 'D']) {
      it(k + ' com impacto de ' + impacto + ': R-33 como Recomendada, mesmo com risco limitado ou moderado', () => {
        const e = variante(k, { impactos: [impacto] });
        const r = item(e, 'R-33');
        expect(r, k + ' sem R-33').toBeTruthy();
        expect(['condicao', 'recomendada']).toContain(r.nivel);
        expect(r.marco).toBe('M1');
      });
    }
  }
  it('sem impacto de desigualdade ou inclusão, e sem tutoria, correção, alerta ou risco elevado, não há R-33', () => {
    ['A', 'D'].forEach(k => expect(ids(exemplo(k))).not.toContain('R-33'));
  });
  it('a pontuação dá o ponto de equidade a R-33 com esse impacto', () => {
    const B = item(exemplo('B'), 'R-33');
    const sem = item(variante('B', { impactos: ['aprendizagem'] }), 'R-33');
    expect(B.criterio.pessoas).toBeGreaterThanOrEqual(sem.criterio.pessoas);
    const D = item(variante('D', { impactos: ['inclusao'] }), 'R-33');
    expect(D.criterio.pessoas).toBe(3);   // 2 (risco moderado) + 1 (equidade); sem o impacto a regra nem dispara
  });
});
