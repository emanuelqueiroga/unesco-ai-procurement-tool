// Versão de teste v016: prioridades, desafios, fases e orçamento por categoria.
// v017: o orçamento passou a nascer das categorias e opções escolhidas (v017-teste.test.ts); os testes do modelo
// de situações e estimativas automáticas da v016 ficam desligados aqui.
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

  it.skip('governança: sem tamanho da rede; 3 desafios ativam suas categorias; fases antes do orçamento', () => {
    S().responder('prioridades', ['governar']); S().responder('problemas', ['G21', 'G23']); S().responder('frenteAtiva', 'governanca');
    expect(ids()).toEqual(['local', 'prioridades', 'problemas', 'gov-equipe', 'gov-fases', 'gov-recursos']);
    expect(faltamDe(S()).map(t => t.id)).not.toContain('problemas');
    expect(orcamentoGovernanca(S()).itens.map(i => i.id)).toEqual(['g11', 'g12', 'g13', 'g31', 'g32', 'g33']);
  });

  it.skip('governança: estimativa por fase soma o total e cada fase tem seu valor', () => {
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

  it.skip('fases desmarcadas saem da conta; valor informado é por fase', () => {
    S().responder('prioridades', ['governar']); S().responder('problemas', ['G21']); S().responder('frenteAtiva', 'governanca');
    preencher('governanca');
    S().responder('govOrcamento.fases.piloto', { on: false, meses: 4, alcance: 5 });
    expect(fasesAtivas(S(), 'governanca').map(f => f.id)).toEqual(['implantacao', 'expansao']);
    S().responder('govOrcamento.itens.g11', { situacao: 'informado', valores: { piloto: 999, implantacao: 100, expansao: 50 } });
    const o = orcamentoGovernanca(S());
    expect(o.itens.find(i => i.id === 'g11')!.valor).toBe(150);
    expect(o.fases.map(f => f.informado)).toEqual([100, 50]);
  });

  it.skip('letramento: só professores e estudantes; lideranças entram na formação', () => {
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

  it.skip('educação: 8 desafios novos; dimensões com os educadores e conteúdos dos desafios; licença só com IA', () => {
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

  it.skip('letramento: 2.2 estima pelos estudantes e 2.3 segue sem estimativa; formação soma as fases sem perder pessoas', () => {
    S().responder('prioridades', ['sobre']); S().responder('problemas', ['A11', 'A12']); S().responder('frenteAtiva', 'letramento');
    S().responder('letramento', alterarLit(S().ctx.letramento, 'publicos.A11.participantes', { valor: 50, situacao: 'informado' }));
    preencher('letramento');
    const o = orcamentoLetramento(S());
    expect(o.itens.find(i => i.id === 'l13')!.estimativa!.conta.quantidades[0].valor).toBe(50);
    expect(o.itens.find(i => i.id === 'l23')!.estimativa).toBeNull();
    S().responder('letramento', alterarLit(S().ctx.letramento, 'publicos.A12.participantes', { valor: 1000, situacao: 'informado' }));
    const l22 = orcamentoLetramento(S()).itens.find(i => i.id === 'l22')!.estimativa!;
    // 1000 estudantes: 50 × 4 + 330 × 12 + 1000 × 12 meses de licença a US$ 9
    expect(l22.valorUSD).toBe((50 * 4 + 330 * 12 + 1000 * 12) * 9);
    // disponível, mas não entra sozinha no custo
    expect(orcamentoLetramento(S()).itens.find(i => i.id === 'l22')!.estimado).toBeNull();
    const q = o.itens.find(i => i.id === 'l11')!.estimativa!.conta.quantidades.filter(x => /pessoas novas/.test(x.rotulo)).reduce((n, x) => n + x.valor, 0);
    expect(q).toBe(50);
  });

  it.skip('premissa editável substitui o custo por hora em todas as linhas da frente', () => {
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

  it.skip('premissa na moeda do plano: conta direta na moeda local e o resumo diz que é valor da equipe', async () => {
    const { premissaV16, riscosV16, linhasMemoria, taxaV16 } = await import('../../src/percurso/orcamentoV016');
    S().setMoeda({ cod: 'BRL', taxa: '5.222334', taxaDe: 'BRL' });
    S().responder('prioridades', ['governar']); S().responder('problemas', ['G23']); S().responder('frenteAtiva', 'governanca');
    preencher('governanca');
    S().responder('govOrcamento.moeda', 'BRL');
    let o = orcamentoGovernanca(S()), g31 = o.itens.find(i => i.id === 'g31')!.estimativa!;
    expect(taxaV16('BRL', S())).toBe(5.2223);
    // referência em US$: o total é exatamente US$ total × taxa exibida (4 casas)
    expect(g31.valor).toBe(Math.round(g31.valorUSD! * 5.2223 * 100) / 100);
    expect(riscosV16('governanca', o)[0]).toMatch(/iguais para todos os países/);
    S().responder('govOrcamento.premissas.sal_especialista_pedagogico', { valor: 120000, moeda: 'BRL' });
    expect(premissaV16(S(), 'governanca', 'sal.especialista_pedagogico', 'BRL').equipe).toBe(true);
    o = orcamentoGovernanca(S()); g31 = o.itens.find(i => i.id === 'g31')!.estimativa!;
    const fte = S().ctx.govOrcamento.quantidades.equipeFte; const n = typeof fte === 'number' ? fte : fte.valor;
    expect(g31.valor).toBe(Math.round(n * 28 / 12 * 120000 * 100) / 100);
    expect(riscosV16('governanca', o)[0]).toMatch(/valores da equipe|informados pela equipe/);
    expect(linhasMemoria(o).join(' ')).toMatch(/valor da equipe/);
  });

  it.skip('educação: infraestrutura estima conexão e dispositivos; eletricidade vira risco', async () => {
    const { riscosV16 } = await import('../../src/percurso/orcamentoV016');
    const { alterarEd } = await import('../../src/percurso/pedagogico');
    S().responder('prioridades', ['com']); S().responder('problemas', ['C32']); S().responder('frenteAtiva', 'educacao');
    preencher('educacao');
    for (const [c, v] of [['escolasSemConexao', 100], ['dispositivos', 1000], ['escolasSemEletricidade', 7]] as const) S().responder('educacao', alterarEd(S(), 'orcamento.quantidades.' + c, v));
    const o = orcamentoEd(S()), e2 = o.itens.find(i => i.id === 'e2')!.estimativa!;
    // conexão: 5 escolas × 4/12 + 33 × 12/12 + 100 × 12/12 anos × US$ 600; dispositivos: 1000 × US$ 300
    expect(e2.valorUSD).toBe(Math.round(((5 * 4 / 12 + 33 + 100) * 600 + 1000 * 300) * 100) / 100);
    expect(riscosV16('educacao', o as any).join(' ')).toMatch(/7 escolas sem eletricidade/);
  });
});
