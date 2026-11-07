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
const item = (o: { itens: any[] }, id: string) => o.itens.find(i => i.id === id)!;
const custo = (f: 'letramento' | 'governanca', cat: string, op: string, v: Record<string, unknown>) => gravarOrc(f, 'itens.' + cat + '.custos.' + chaveOpcao(op), v);

describe('v017: categorias → opções → valores', () => {
  beforeEach(() => { setLang('pt'); S().setMoeda({ cod: 'USD', taxa: '', taxaDe: '' }); S().carregarExemplo('novo'); S().escolherPais('BRA'); });

  it('as etapas visíveis: sem tela Valores; governança sem Fases', () => {
    S().responder('prioridades', ['governar']); S().responder('problemas', ['G21', 'G23']); S().responder('frenteAtiva', 'governanca');
    expect(ids()).toEqual(['local', 'prioridades', 'problemas', 'gov-categorias', 'gov-opcoes']);
    S().responder('prioridades', ['sobre']); S().responder('problemas', ['A11']); S().responder('frenteAtiva', 'letramento');
    expect(ids()).toEqual(['local', 'prioridades', 'problemas', 'lit-participantes', 'lit-categorias', 'lit-opcoes', 'lit-fases']);
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
    expect(item(o, 'l12').marcadas).toEqual([]); expect(item(o, 'l12').pendentes).toBe(1); // categoria sem opção escolhida
    gravarOrc('letramento', 'itens.l12.opcoes', ['Formação presencial']);
    custo('letramento', 'l12', 'Formação presencial', { qtd: 1000 });
    o = orcamentoLetramento(S());
    expect(item(o, 'l12').linhas[0].status).toBe('falta'); expect(item(o, 'l12').linhas[0].falta).toContain('horas por pessoa');
    custo('letramento', 'l12', 'Formação presencial', { qtd: 1000, horas: 20 });
    o = orcamentoLetramento(S()); let l = item(o, 'l12').linhas[0];
    // 1000 pessoas, alcance 5% / 33% / 100%: 50, 280 e 670 pessoas novas × 20 h × US$ 12
    expect(l.status).toBe('referencia'); expect(l.porFase).toEqual({ piloto: 12000, implantacao: 67200, expansao: 160800 }); expect(l.total).toBe(240000);
    expect(o.estimado).toBe(240000); expect(o.informado).toBe(0); expect(item(o, 'l12').pendentes).toBe(0);
    custo('letramento', 'l12', 'Formação presencial', { qtd: 1000, horas: 20, unit: 10 });
    o = orcamentoLetramento(S()); l = item(o, 'l12').linhas[0];
    expect(l.status).toBe('informado'); expect(l.total).toBe(200000); expect(o.informado).toBe(200000);
  });

  it('licença, equipe, valor por fase e categoria sem opções', () => {
    S().responder('prioridades', ['governar']); S().responder('problemas', ['G21', 'G23']); S().responder('frenteAtiva', 'governanca');
    preencher('governanca'); gravarOrc('governanca', 'moeda', 'USD');
    gravarOrc('governanca', 'categorias', ['g11', 'g31', 'g32']);
    gravarOrc('governanca', 'itens.g11.opcoes', ['Proteção de dados pessoais e privacidade']);
    gravarOrc('governanca', 'itens.g31.opcoes', ['Especialistas em IA e educação']);
    custo('governanca', 'g11', 'Proteção de dados pessoais e privacidade', { fases: { total: 6000 } });
    custo('governanca', 'g31', 'Especialistas em IA e educação', { qtd: 2 });
    const o = orcamentoGovernanca(S()), [g11, g31, g32] = o.itens;
    expect(g11.linhas[0]).toMatchObject({ tipo: 'fechado', status: 'informado', total: 6000 });
    // governança sem fases: 2 pessoas × 12 meses (duração padrão) / 12 × US$ 36.000
    expect(g31.linhas[0]).toMatchObject({ tipo: 'equipe', status: 'referencia', total: 72000 });
    expect(g32.marcadas).toEqual(['Formação e desenvolvimento profissional']); expect(g32.linhas[0].tipo).toBe('formacao');
    expect(o.faltam).toBe(1); // g32 sem quantidades
    const m = matrizFases(o);
    expect(m.filter(r => r.nivel === 0).map(r => r.id)).toEqual(['g11', 'g31', 'g32']);
    expect(m.find(r => r.id === 'g11')!.porFase).toEqual({ total: 6000 });
  });

  it('Públicos: professores + diretores e coordenadores viram a quantidade sugerida da formação', async () => {
    const { alterarLit } = await import('../../src/percurso/letramento');
    S().responder('prioridades', ['sobre']); S().responder('problemas', ['A11']); S().responder('frenteAtiva', 'letramento');
    preencher('letramento'); gravarOrc('letramento', 'moeda', 'USD');
    S().responder('letramento', alterarLit(S().ctx.letramento, 'publicos.A11.participantes', { valor: 800, situacao: 'informado' }));
    S().responder('letramento', alterarLit(S().ctx.letramento, 'publicos.A11.incluiLiderancas', { escolhas: ['sim'] }));
    S().responder('letramento', alterarLit(S().ctx.letramento, 'publicos.A11.liderancas', { valor: 200, situacao: 'informado' }));
    gravarOrc('letramento', 'categorias', ['l12']); gravarOrc('letramento', 'itens.l12.opcoes', ['Formação online']);
    const l = item(orcamentoLetramento(S()), 'l12').linhas[0];
    expect(l.qtd).toBe(1000); expect(l.qtdSugerida).toBe(true);
  });

  it('trocar o tipo de custo: sem referência, falta o valor unitário', () => {
    S().responder('prioridades', ['sobre']); S().responder('problemas', ['A11', 'A12']); S().responder('frenteAtiva', 'letramento');
    preencher('letramento'); gravarOrc('letramento', 'moeda', 'USD');
    gravarOrc('letramento', 'categorias', ['l22']);
    gravarOrc('letramento', 'itens.l22.opcoes', ['Plataformas de aprendizagem de IA']);
    custo('letramento', 'l22', 'Plataformas de aprendizagem de IA', { qtd: 1000 });
    let l = item(orcamentoLetramento(S()), 'l22').linhas[0];
    expect(l.tipo).toBe('licenca'); expect(l.total).toBe((50 * 4 + 330 * 12 + 1000 * 12) * 9);
    custo('letramento', 'l22', 'Plataformas de aprendizagem de IA', { qtd: 1000, tipo: 'pessoa' });
    l = item(orcamentoLetramento(S()), 'l22').linhas[0];
    expect(l.status).toBe('falta'); expect(l.falta).toContain('custo por pessoa');
  });

  it('governança: duração do plano muda a conta de equipe', () => {
    S().responder('prioridades', ['governar']); S().responder('problemas', ['G21', 'G23']); S().responder('frenteAtiva', 'governanca');
    preencher('governanca'); gravarOrc('governanca', 'moeda', 'USD');
    gravarOrc('governanca', 'categorias', ['g31']); gravarOrc('governanca', 'itens.g31.opcoes', ['Especialistas em IA e educação']);
    custo('governanca', 'g31', 'Especialistas em IA e educação', { qtd: 2 });
    gravarOrc('governanca', 'duracao', 24);
    expect(orcamentoGovernanca(S()).itens[0].linhas[0].total).toBe(144000);
  });

  it('categorias obrigatórias: 1.1–1.3, 2.1–2.2 e 3.1–3.2 do letramento entram sozinhas; governança não tem', () => {
    S().responder('prioridades', ['sobre']); S().responder('problemas', ['A11', 'A12', 'A16']); S().responder('frenteAtiva', 'letramento');
    expect(orcamentoLetramento(S()).itens.map(i => i.id)).toEqual(['l11', 'l12', 'l13', 'l21', 'l22', 'l31', 'l32']);
    gravarOrc('letramento', 'categorias', ['l14']);
    expect(orcamentoLetramento(S()).itens.map(i => i.id)).toEqual(['l11', 'l12', 'l13', 'l14', 'l21', 'l22', 'l31', 'l32']);
    S().responder('prioridades', ['governar']); S().responder('problemas', ['G21', 'G22', 'G23']); S().responder('frenteAtiva', 'governanca');
    expect(orcamentoGovernanca(S()).itens).toEqual([]);
  });

  it('1.1: os 6 itens são parâmetros obrigatórios, sem linha de custo', async () => {
    const { alterarLit } = await import('../../src/percurso/letramento');
    S().responder('prioridades', ['sobre']); S().responder('problemas', ['A11']); S().responder('frenteAtiva', 'letramento');
    const g = (c: string, v: number) => S().responder('letramento', alterarLit(S().ctx.letramento, c, { valor: v, situacao: 'informado' }));
    let i = item(orcamentoLetramento(S()), 'l11');
    expect(i.parametros).toHaveLength(6); expect(i.linhas).toEqual([]); expect(i.respondido).toBe(false);
    g('publicos.A11.participantes', 800); g('publicos.A11.horas', 20); g('publicos.A11.cursos', 2);
    g('orcamento.parametros.frequencia', 1); g('orcamento.parametros.duracao', 12);
    expect(item(orcamentoLetramento(S()), 'l11').pendentes).toBe(1);
    g('orcamento.parametros.reciclagem', 0);
    i = item(orcamentoLetramento(S()), 'l11'); expect(i.pendentes).toBe(0); expect(i.respondido).toBe(true);
  });

  it('sem tela Valores: Opções só fica respondida com os valores; o plano mantém o bloco de valores', async () => {
    const { telaRespondida } = await import('../../src/store');
    const { planoLetramento } = await import('../../src/percurso/letramento');
    S().responder('prioridades', ['sobre']); S().responder('problemas', ['A11']); S().responder('frenteAtiva', 'letramento');
    preencher('letramento'); gravarOrc('letramento', 'moeda', 'USD');
    gravarOrc('letramento', 'itens.l12.opcoes', ['Formação presencial']); gravarOrc('letramento', 'itens.l13.opcoes', ['Materiais e recursos de formação']);
    custo('letramento', 'l13', 'Materiais e recursos de formação', { fases: { piloto: 100 } });
    for (const [c, v] of [['publicos.A11.participantes', 800], ['publicos.A11.horas', 20], ['publicos.A11.cursos', 1], ['orcamento.parametros.frequencia', 1], ['orcamento.parametros.duracao', 12], ['orcamento.parametros.reciclagem', 0]] as const)
      S().responder('letramento', (await import('../../src/percurso/letramento')).alterarLit(S().ctx.letramento, c, { valor: v, situacao: 'informado' }));
    const tela = telasAtivas(S()).find(t => t.id === 'lit-opcoes')!;
    expect(telaRespondida(S(), tela)).toBe(false);
    custo('letramento', 'l12', 'Formação presencial', { qtd: 1000, horas: 20 });
    expect(telaRespondida(S(), tela)).toBe(true);
    expect(planoLetramento(S()).blocos.map(b => b.titulo)).toContain('Valores');
  });
});
