// Versão de teste v017: o orçamento nasce das categorias e opções escolhidas (categorias → opções → valores).
import { beforeEach, describe, expect, it } from 'vitest';
import { useCaso, telasAtivas } from '../../src/store';
import { setLang } from '../../src/domain';
import { orcamentoGovernanca } from '../../src/percurso/governanca';
import { orcamentoLetramento } from '../../src/percurso/letramento';
import { escritasPadroes } from '../../src/percurso/padroesTeste';
import { matrizFases, resumoProsa } from '../../src/percurso/orcamentoV016';
import { chaveOpcao } from '../../src/percurso/custosV017';
import { gravarOrc } from '../../src/screens/OrcamentoV16';

const S = () => useCaso.getState();
const ids = () => telasAtivas(S()).map(t => t.id);
const preencher = (f: 'letramento' | 'governanca' | 'educacao') => { for (let i = 0; i < 6; i++) { const w = escritasPadroes(S(), f); if (!w.length) return; S().preencher(w); } };
const custo = (f: 'letramento' | 'governanca', cat: string, op: string, v: Record<string, unknown>) => gravarOrc(f, 'itens.' + cat + '.custos.' + chaveOpcao(op), v);

describe('v017: categorias → opções → valores', () => {
  beforeEach(() => { setLang('pt'); S().setMoeda({ cod: 'USD', taxa: '', taxaDe: '' }); S().carregarExemplo('novo'); S().escolherPais('BRA'); });

  it('as etapas visíveis são Categorias, Opções, Fases e valores', () => {
    S().responder('prioridades', ['governar']); S().responder('problemas', ['G21', 'G23']); S().responder('frenteAtiva', 'governanca');
    expect(ids()).toEqual(['local', 'prioridades', 'problemas', 'gov-categorias', 'gov-opcoes', 'gov-fases', 'gov-recursos']);
    S().responder('prioridades', ['sobre']); S().responder('problemas', ['A11']); S().responder('frenteAtiva', 'letramento');
    expect(ids()).toEqual(['local', 'prioridades', 'problemas', 'lit-participantes', 'lit-categorias', 'lit-opcoes', 'lit-fases', 'lit-recursos']);
  });

  it('nada vem marcado: sem categoria escolhida não há custo e falta 1 item', () => {
    S().responder('prioridades', ['governar']); S().responder('problemas', ['G21', 'G23']); S().responder('frenteAtiva', 'governanca');
    preencher('governanca');
    const o = orcamentoGovernanca(S());
    expect(o.disponiveis.map(c => c.id)).toEqual(['g11', 'g12', 'g13', 'g31', 'g32', 'g33']);
    expect(o.itens).toEqual([]); expect(o.faltam).toBe(1);
    expect(resumoProsa(o)).toMatch(/Nenhuma categoria/);
  });

  it('formação presencial: pessoas × horas × custo por hora, por fase; trocar o custo por hora vira valor informado', () => {
    S().responder('prioridades', ['sobre']); S().responder('problemas', ['A11']); S().responder('frenteAtiva', 'letramento');
    preencher('letramento'); gravarOrc('letramento', 'moeda', 'USD');
    gravarOrc('letramento', 'categorias', ['l12']);
    let o = orcamentoLetramento(S());
    expect(o.itens[0].marcadas).toEqual([]); expect(o.faltam).toBe(1); // categoria sem opção escolhida
    gravarOrc('letramento', 'itens.l12.opcoes', ['Formação presencial']);
    custo('letramento', 'l12', 'Formação presencial', { qtd: 1000 });
    o = orcamentoLetramento(S());
    expect(o.itens[0].linhas[0].status).toBe('falta'); expect(o.itens[0].linhas[0].falta).toContain('horas por pessoa');
    custo('letramento', 'l12', 'Formação presencial', { qtd: 1000, horas: 20 });
    o = orcamentoLetramento(S()); let l = o.itens[0].linhas[0];
    // 1000 pessoas, alcance 5% / 33% / 100%: 50, 280 e 670 pessoas novas × 20 h × US$ 12
    expect(l.status).toBe('referencia'); expect(l.porFase).toEqual({ piloto: 12000, implantacao: 67200, expansao: 160800 }); expect(l.total).toBe(240000);
    expect(o.estimado).toBe(240000); expect(o.informado).toBe(0); expect(o.faltam).toBe(0);
    custo('letramento', 'l12', 'Formação presencial', { qtd: 1000, horas: 20, unit: 10 });
    o = orcamentoLetramento(S()); l = o.itens[0].linhas[0];
    expect(l.status).toBe('informado'); expect(l.total).toBe(200000); expect(o.informado).toBe(200000);
  });

  it('licença, equipe, valor por fase e categoria sem opções', () => {
    S().responder('prioridades', ['governar']); S().responder('problemas', ['G21', 'G23']); S().responder('frenteAtiva', 'governanca');
    preencher('governanca'); gravarOrc('governanca', 'moeda', 'USD');
    gravarOrc('governanca', 'categorias', ['g11', 'g31', 'g32']);
    gravarOrc('governanca', 'itens.g11.opcoes', ['Proteção de dados pessoais e privacidade']);
    gravarOrc('governanca', 'itens.g31.opcoes', ['Especialistas em IA e educação']);
    custo('governanca', 'g11', 'Proteção de dados pessoais e privacidade', { fases: { piloto: 1000, implantacao: 5000 } });
    custo('governanca', 'g31', 'Especialistas em IA e educação', { qtd: 2 });
    const o = orcamentoGovernanca(S()), [g11, g31, g32] = o.itens;
    expect(g11.linhas[0]).toMatchObject({ tipo: 'fechado', status: 'informado', total: 6000 });
    // 2 pessoas × (4 + 12 + 12) / 12 × US$ 36.000
    expect(g31.linhas[0]).toMatchObject({ tipo: 'equipe', status: 'referencia', total: 168000 });
    expect(g32.marcadas).toEqual(['Formação e desenvolvimento profissional']); expect(g32.linhas[0].tipo).toBe('formacao');
    expect(o.faltam).toBe(1); // g32 sem quantidades
    const m = matrizFases(o);
    expect(m.filter(r => r.nivel === 0).map(r => r.id)).toEqual(['g11', 'g31', 'g32']);
    expect(m.find(r => r.id === 'g11')!.porFase).toEqual({ piloto: 1000, implantacao: 5000, expansao: 0 });
  });

  it('Públicos: professores + diretores e coordenadores viram a quantidade sugerida da formação', async () => {
    const { alterarLit } = await import('../../src/percurso/letramento');
    S().responder('prioridades', ['sobre']); S().responder('problemas', ['A11']); S().responder('frenteAtiva', 'letramento');
    preencher('letramento'); gravarOrc('letramento', 'moeda', 'USD');
    S().responder('letramento', alterarLit(S().ctx.letramento, 'publicos.A11.participantes', { valor: 800, situacao: 'informado' }));
    S().responder('letramento', alterarLit(S().ctx.letramento, 'publicos.A11.incluiLiderancas', { escolhas: ['sim'] }));
    S().responder('letramento', alterarLit(S().ctx.letramento, 'publicos.A11.liderancas', { valor: 200, situacao: 'informado' }));
    gravarOrc('letramento', 'categorias', ['l12']); gravarOrc('letramento', 'itens.l12.opcoes', ['Formação online']);
    const l = orcamentoLetramento(S()).itens[0].linhas[0];
    expect(l.qtd).toBe(1000); expect(l.qtdSugerida).toBe(true);
  });

  it('trocar o tipo de custo: sem referência, falta o valor unitário', () => {
    S().responder('prioridades', ['sobre']); S().responder('problemas', ['A11', 'A12']); S().responder('frenteAtiva', 'letramento');
    preencher('letramento'); gravarOrc('letramento', 'moeda', 'USD');
    gravarOrc('letramento', 'categorias', ['l22']);
    gravarOrc('letramento', 'itens.l22.opcoes', ['Plataformas de aprendizagem de IA']);
    custo('letramento', 'l22', 'Plataformas de aprendizagem de IA', { qtd: 1000 });
    let l = orcamentoLetramento(S()).itens[0].linhas[0];
    expect(l.tipo).toBe('licenca'); expect(l.total).toBe((50 * 4 + 330 * 12 + 1000 * 12) * 9);
    custo('letramento', 'l22', 'Plataformas de aprendizagem de IA', { qtd: 1000, tipo: 'pessoa' });
    l = orcamentoLetramento(S()).itens[0].linhas[0];
    expect(l.status).toBe('falta'); expect(l.falta).toContain('custo por pessoa');
  });
});
