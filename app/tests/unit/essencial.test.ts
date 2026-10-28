// O Essencial tem 25 telas (24 da spec mais 1.2.8, mantida por decisão de 28/10/2026), todas apontando para
// campos que existem no domínio, e cada resposta sabe que trechos do plano pode mudar.
import { describe, it, expect } from 'vitest';
import { ESSENCIAL, CAMPOS_ESSENCIAIS, afetadosPor, telaDoCampo, capituloDoCampo, telasDoCapitulo } from '../../src/store/perguntas';
import { CAMPOS, QUESTOES_G, REGRAS_REC } from '../../src/domain';

const ids = new Set((CAMPOS as any[]).map(f => f.id).concat((QUESTOES_G as any[]).map(q => q.id)));

describe('perguntas do Essencial', () => {
  it('são 25 telas, em quatro capítulos, com ids únicos', () => {
    expect(ESSENCIAL.length).toBe(25);
    expect(new Set(ESSENCIAL.map(t => t.id)).size).toBe(25);
    expect(telasDoCapitulo(1).length).toBe(11);
    expect(telasDoCapitulo(2).length).toBe(11);
    expect(telasDoCapitulo(3).length).toBe(1);
    expect(telasDoCapitulo(4).length).toBe(2);
  });
  it('a alternativa sem IA (1.2.8) está no capítulo 1', () => {
    const t = telaDoCampo('alternativa');
    expect(t && t.capitulo).toBe(1);
    expect(t && t.n).toEqual(['1.2.8']);
  });
  it('todo campo de tela existe em CAMPOS ou QUESTOES_G', () => {
    CAMPOS_ESSENCIAIS.forEach(c => expect(ids.has(c), c).toBe(true));
  });
  it('os números das perguntas são os da v13 e não se repetem', () => {
    const ns = ESSENCIAL.flatMap(t => t.n);
    expect(new Set(ns).size).toBe(ns.length);
    const nv13 = new Set((CAMPOS as any[]).map(f => f.n).concat(['1.3.1', '1.3.2', '1.3.3', '1.3.4', '1.3.5', '1.3.6']));
    ns.forEach(n => expect(nv13.has(n), n).toBe(true));
  });
  it('os demais campos ficam no Refinar, com capítulo pela fase', () => {
    const fora = (CAMPOS as any[]).map(f => f.id).filter(id => !CAMPOS_ESSENCIAIS.includes(id));
    expect(fora.length).toBeGreaterThan(15);
    fora.forEach(id => expect([1, 2, 3, 4]).toContain(capituloDoCampo(id)));
    expect(capituloDoCampo('horizonte')).toBe(4);
  });
});

describe('resposta → trechos do plano', () => {
  it('testes muda o custo do teste e o texto A1', () => {
    const a = afetadosPor('testes');
    expect(a).toContain('kpi.ano0'); expect(a).toContain('A1');
  });
  it('subcampos herdam do campo (piloto.escolas = piloto)', () => {
    expect(afetadosPor('piloto.escolas')).toEqual(afetadosPor('piloto'));
  });
  it('uma pergunta de governança vira uma ação', () => {
    expect(afetadosPor('g-comite')).toContain('rec:g-comite');
  });
  it('toda regra com campo simples é alcançada por esse campo', () => {
    (REGRAS_REC as any[]).filter(r => typeof r.campo === 'string').forEach(r => {
      expect(afetadosPor(r.campo), r.id).toContain('rec:' + r.id);
    });
  });
});
