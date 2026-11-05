// Versão de teste v016: prioridades, desafios, fases e orçamento por categoria.
import { beforeEach, describe, expect, it } from 'vitest';
import { useCaso, telasAtivas, faltamDe } from '../../src/store';
import { setLang, PRIORIDADES } from '../../src/domain';
import { PRIORIDADES_V016 } from '../../src/domain/catalogo_v016.js';
import { confirmarPrioridades } from '../../src/percurso/confirmarPrioridades';
import { orcamentoGovernanca } from '../../src/percurso/governanca';
import { orcamentoLetramento, alterarLit, publicosLetramento } from '../../src/percurso/letramento';
import { orcamentoEd } from '../../src/percurso/pedagogico';
import { escritasPadroes } from '../../src/percurso/padroesTeste';
import { fasesAtivas } from '../../src/percurso/orcamentoV016';

const S = () => useCaso.getState();
const ids = () => telasAtivas(S()).map(t => t.id);
const preencher = (f: 'letramento' | 'governanca' | 'educacao') => { for (let i = 0; i < 6; i++) { const w = escritasPadroes(S(), f); if (!w.length) return; S().preencher(w); } };

describe('v016: versão de teste', () => {
  beforeEach(() => { setLang('pt'); S().setMoeda({ cod: 'USD', taxa: '', taxaDe: '' }); S().carregarExemplo('novo'); S().escolherPais('BRA'); });

  it('três prioridades no gerúndio; "para a era da IA" não entra mais', () => {
    expect(PRIORIDADES_V016).toEqual(['governar', 'sobre', 'com']);
    const nomes = (PRIORIDADES as any[]).filter(p => PRIORIDADES_V016.includes(p.id)).map(p => p.nome);
    expect(nomes).toEqual(['Governando a IA na educação', 'Educando sobre a IA', 'Educando com e sem IA']);
    confirmarPrioridades(['para', 'sobre']);
    expect(S().ctx.prioridades).toEqual(['sobre']);
  });

  it('governança: sem tamanho da rede; 3 desafios ativam suas categorias; fases antes do orçamento', () => {
    S().responder('prioridades', ['governar']); S().responder('problemas', ['G21', 'G23']); S().responder('frenteAtiva', 'governanca');
    expect(ids()).toEqual(['local', 'prioridades', 'problemas', 'gov-equipe', 'gov-fases', 'gov-recursos']);
    expect(faltamDe(S()).map(t => t.id)).not.toContain('problemas');
    expect(orcamentoGovernanca(S()).itens.map(i => i.id)).toEqual(['g11', 'g12', 'g13', 'g31', 'g32', 'g33']);
  });

  it('governança: estimativa por fase soma o total e cada fase tem seu valor', () => {
    S().responder('prioridades', ['governar']); S().responder('problemas', ['G23']); S().responder('frenteAtiva', 'governanca');
    preencher('governanca');
    const o = orcamentoGovernanca(S()), equipe = o.itens.find(i => i.id === 'g31')!;
    expect(equipe.referencia).toBe(true);
    // 2 pessoas × (4+12+12)/12 × US$ 36.000
    expect(equipe.estimativa!.valorUSD).toBeCloseTo(2 * (28 / 12) * 36000, 0);
    const fases = (equipe.estimativa as any).fases;
    expect(fases.map((f: any) => f.id)).toEqual(['piloto', 'implantacao', 'expansao']);
    expect(o.fases.reduce((n, f) => n + f.estimado, 0)).toBeCloseTo(o.estimado, 2);
    expect(o.itens.find(i => i.id === 'g31')!.marcadas.length).toBe(4);
  });

  it('fases desmarcadas saem da conta; valor informado é por fase', () => {
    S().responder('prioridades', ['governar']); S().responder('problemas', ['G21']); S().responder('frenteAtiva', 'governanca');
    preencher('governanca');
    S().responder('govOrcamento.fases.piloto', { on: false, meses: 4, alcance: 5 });
    expect(fasesAtivas(S(), 'governanca').map(f => f.id)).toEqual(['implantacao', 'expansao']);
    S().responder('govOrcamento.itens.g11', { situacao: 'informado', valores: { piloto: 999, implantacao: 100, expansao: 50 } });
    const o = orcamentoGovernanca(S());
    expect(o.itens.find(i => i.id === 'g11')!.valor).toBe(150);
    expect(o.fases.map(f => f.informado)).toEqual([100, 50]);
  });

  it('letramento: só professores e estudantes; lideranças entram na formação', () => {
    S().responder('prioridades', ['sobre']); S().responder('problemas', ['A11', 'A12', 'A13', 'A16']); S().responder('frenteAtiva', 'letramento');
    expect(publicosLetramento(S()).map(p => p.id)).toEqual(['A11', 'A12']);
    expect(ids()).toEqual(['local', 'prioridades', 'problemas', 'lit-participantes', 'lit-fases', 'lit-recursos']);
    preencher('letramento');
    S().responder('letramento', alterarLit(S().ctx.letramento, 'publicos.A11.participantes', { valor: 1000, situacao: 'informado' }));
    preencher('letramento');
    const sem = orcamentoLetramento(S()).itens.find(i => i.id === 'l11')!.estimativa!.valorUSD!;
    S().responder('letramento', alterarLit(S().ctx.letramento, 'publicos.A11.incluiLiderancas', { escolhas: ['sim'] }));
    S().responder('letramento', alterarLit(S().ctx.letramento, 'publicos.A11.liderancas', { valor: 200, situacao: 'informado' }));
    const com = orcamentoLetramento(S()).itens.find(i => i.id === 'l11')!.estimativa!.valorUSD!;
    expect(com / sem).toBeCloseTo(1.2, 1);
    expect(orcamentoLetramento(S()).itens.map(i => i.id)).toEqual(['l11', 'l12', 'l13', 'l14', 'l15', 'l21', 'l22', 'l23', 'l31', 'l32', 'l33']);
  });

  it('educação: 8 desafios novos; dimensões com os educadores e conteúdos dos desafios; licença só com IA', () => {
    S().responder('prioridades', ['com']); S().responder('problemas', ['C32', 'C33']); S().responder('frenteAtiva', 'educacao');
    expect(ids()).toContain('ed-fases'); expect(ids()).not.toContain('ed-tecnologia');
    preencher('educacao');
    const o = orcamentoEd(S());
    expect(o.itens.map(i => i.id)).toEqual(['e2', 'e3', 'e4']);
    expect(o.itens[1].opcoes).toEqual(['Professores de alfabetização e numeracia', 'Professores de STEAM']);
    expect(o.itens[2].opcoes).toContain('Ferramentas de IA');
    expect(faltamDe(S()).map(t => t.id).filter(id => id.startsWith('ed-'))).toEqual([]);
  });
});

describe('v016: correções da avaliação por agentes', () => {
  beforeEach(() => { setLang('pt'); S().setMoeda({ cod: 'USD', taxa: '', taxaDe: '' }); S().carregarExemplo('novo'); S().escolherPais('BRA'); });

  it('fases editadas não voltam ao padrão com o pré-preenchimento', () => {
    S().responder('prioridades', ['governar']); S().responder('problemas', ['G23']); S().responder('frenteAtiva', 'governanca');
    preencher('governanca');
    S().responder('govOrcamento.fases.piloto', { on: true, meses: 6, alcance: 10 });
    S().responder('govOrcamento.fases.expansao', { on: false, meses: 12, alcance: 100 });
    preencher('governanca');
    expect(fasesAtivas(S(), 'governanca').map(f => [f.id, f.meses, f.alcance])).toEqual([['piloto', 6, 10], ['implantacao', 12, 33]]);
  });

  it('letramento: linhas de estudantes sem estimativa; formação soma as fases sem perder pessoas', () => {
    S().responder('prioridades', ['sobre']); S().responder('problemas', ['A11', 'A12']); S().responder('frenteAtiva', 'letramento');
    S().responder('letramento', alterarLit(S().ctx.letramento, 'publicos.A11.participantes', { valor: 50, situacao: 'informado' }));
    preencher('letramento');
    const o = orcamentoLetramento(S());
    expect(o.itens.find(i => i.id === 'l22')!.estimativa).toBeNull();
    expect(o.itens.find(i => i.id === 'l23')!.estimativa).toBeNull();
    const q = o.itens.find(i => i.id === 'l11')!.estimativa!.conta.quantidades.filter(x => /pessoas novas/.test(x.rotulo)).reduce((n, x) => n + x.valor, 0);
    expect(q).toBe(50);
  });

  it('premissa editável substitui o custo por hora em todas as linhas da frente', () => {
    S().responder('prioridades', ['governar']); S().responder('problemas', ['G23']); S().responder('frenteAtiva', 'governanca');
    preencher('governanca');
    const antes = orcamentoGovernanca(S()).itens.find(i => i.id === 'g32')!.estimativa!.valorUSD!;
    S().responder('govOrcamento.premissas.formacao_custoHora_programa', 6);
    const depois = orcamentoGovernanca(S()).itens.find(i => i.id === 'g32')!.estimativa!.valorUSD!;
    expect(depois / antes).toBeCloseTo(0.5, 5);
  });

  it('o link do plano leva o caso inteiro e volta igual', async () => {
    S().responder('prioridades', ['governar']); S().responder('problemas', ['G21', 'G23']); S().responder('frenteAtiva', 'governanca'); S().responder('local', 'Secretaria X');
    preencher('governanca');
    const { codificarCaso, decodificarCaso } = await import('../../src/compartilhar/codec');
    const e = await decodificarCaso(await codificarCaso(S().estado()));
    expect(e.ctx.local).toBe('Secretaria X');
    expect(e.ctx.govOrcamento.quantidades).toEqual(S().ctx.govOrcamento.quantidades);
  });
});
