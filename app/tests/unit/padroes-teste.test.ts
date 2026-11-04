// Versão de teste: valores pré-preenchidos nos fluxos enxutos (participantes, horas, período, equipe e situação dos itens).
import { beforeEach, describe, expect, it } from 'vitest';
import { useCaso, faltamDe } from '../../src/store';
import { setLang } from '../../src/domain';
import { escritasPadroes, ehSugerido } from '../../src/percurso/padroesTeste';
import { alterarLit, lerLit, orcamentoLetramento } from '../../src/percurso/letramento';
import { orcamentoGovernanca } from '../../src/percurso/governanca';
import { idsEd, usaIAEd } from '../../src/percurso/pedagogico';

const S = () => useCaso.getState();
const preencher = (f: 'letramento' | 'governanca' | 'educacao') => { for (let i = 0; i < 5; i++) { const w = escritasPadroes(S(), f); if (!w.length) return i; S().preencher(w); } return 99; };

describe('versão de teste: pré-preenchimento', () => {
  beforeEach(() => { setLang('pt'); S().setMoeda({ cod: 'USD', taxa: '', taxaDe: '' }); S().carregarExemplo('novo'); S().escolherPais('BRA'); });

  it('letramento: participantes saem dos totais, horas e período vêm preenchidos e nada fica bloqueado', () => {
    S().responder('prioridades', ['sobre', 'governar']); S().responder('problemas', ['A11', 'A12', 'A14', 'G11']);
    S().responder('redeNacional', { escolas: 1000, estudantes: 50000 }); S().responder('frenteAtiva', 'letramento');
    expect(preencher('letramento')).toBeLessThan(3);
    expect(lerLit(S(), 'publicos.A11.participantes').valor).toBe(2000);
    expect(lerLit(S(), 'publicos.A12.participantes').valor).toBe(50000);
    expect(lerLit(S(), 'publicos.A14.participantes').valor).toBe(1000);
    expect(lerLit(S(), 'publicos.A11.horas').valor).toBe(30);
    expect(lerLit(S(), 'orcamento.periodo').escolhas).toEqual(['12']);
    const o = orcamentoLetramento(S());
    expect(o.itens.find(i => i.id === 'oferta')!.referencia).toBe(true);
    expect(o.itens.find(i => i.id === 'desenho')!.situacao).toBe('a_estimar');
    expect(o.itens.every(i => i.respondido)).toBe(true);
    expect(faltamDe(S()).map(t => t.id).filter(id => id.startsWith('lit-'))).toEqual([]);
    expect(ehSugerido(S(), 'letramento', 'publicos.A11.participantes')).toBe(true);
  });

  it('letramento: o que a pessoa muda fica; o que ainda é sugerido acompanha os totais', () => {
    S().responder('prioridades', ['sobre']); S().responder('problemas', ['A11', 'A14']); S().responder('frenteAtiva', 'letramento');
    preencher('letramento');
    S().responder('letramento', alterarLit(S().ctx.letramento, 'alcance.estudantes', { valor: 50000, situacao: 'informado' }));
    preencher('letramento');
    expect(lerLit(S(), 'alcance.professores').valor).toBe(2000);
    expect(lerLit(S(), 'publicos.A11.participantes').valor).toBe(2000);
    S().responder('letramento', alterarLit(S().ctx.letramento, 'publicos.A11.participantes', { valor: 1800, situacao: 'informado' }));
    S().responder('letramento', alterarLit(S().ctx.letramento, 'alcance.estudantes', { valor: 60000, situacao: 'informado' }));
    preencher('letramento');
    expect(lerLit(S(), 'alcance.professores').valor).toBe(2400);
    expect(lerLit(S(), 'publicos.A11.participantes').valor).toBe(1800);
    expect(ehSugerido(S(), 'letramento', 'publicos.A11.participantes')).toBe(false);
  });

  it('governança: período de 12 meses, equipe e formação preenchidos e itens com estimativa em uso', () => {
    S().responder('prioridades', ['governar']); S().responder('problemas', ['G11']); S().responder('frenteAtiva', 'governanca');
    preencher('governanca');
    expect(S().ctx.govOrcamento.quantidades).toMatchObject({ equipeFte: 2, servidores: 50, horasServidor: 20 });
    const o = orcamentoGovernanca(S());
    expect(o.itens.filter(i => i.referencia).map(i => i.id).sort()).toEqual(['avaliacao', 'equipe', 'formacao']);
    expect(o.estimado).toBeGreaterThan(0);
  });

  it('educação com IA: abordagem mista e uso por professores; usuários sugeridos a partir dos estudantes', () => {
    S().responder('prioridades', ['com']); S().responder('problemas', ['C11']); S().responder('frenteAtiva', 'educacao');
    preencher('educacao');
    expect(usaIAEd(S())).toBe(true);
    expect(idsEd(S(), 'usoIA.quem')).toEqual(['professores']);
  });
});
