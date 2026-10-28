// Calculadora do modo Refinar: ações do store (editarCfg, linhas, faixas, base, refazer, aviso de edições pendentes),
// persistência do estado da calculadora na exportação/importação (CUS-27) e as funções puras da tela
// (árvore, contas por ano com abas, CSV na moeda escolhida, alternativas, moedas, foco).
import { describe, it, expect, beforeEach } from 'vitest';
import { useCaso, calcDe, ESTRATOS_PADRAO, editarCaminho } from '../../src/store/caso';
import { cfgDe, numerosDe } from '../../src/store/selectors';
import { migrar, calcImportado } from '../../src/store/migracoes';
import { setMoeda, setTabelaMoedas, avaliar, calcular, indicadores, PRESETS, comparar } from '../../src/domain';
import {
  resultados, linhasArvore, todosAbertos, contasPorAno, csvCustosMoeda, cfgAlternativa, listaComparacao, listaMoedas, MOEDAS_PRINCIPAIS,
  abaDoFoco, candidatosFoco, serieAnos, cfgPronta, novaLinha,
} from '../../src/screens/refinar/calc';
import moedas from '../../../data/moedas.json';

const S = () => useCaso.getState();
beforeEach(() => { setTabelaMoedas(moedas); setMoeda({ cod: 'USD', taxa: '' }); S().carregarExemplo('A'); });

describe('editarCfg e linhas (CUS-03, CUS-04, CUS-05, CUS-06)', () => {
  it('a primeira edição copia a cfg montada, grava editado e muda os números', () => {
    const antes = numerosDe(S().estado());
    expect(S().custo.cfg).toBeNull();
    S().editarCfg('demanda.adocao.1', 0.9);
    const e = S().estado();
    expect(e.custo.editado).toBe(true);
    expect(e.custo.cfg.__base).toBe('caso');
    expect(e.custo.cfg.demanda.adocao[1]).toBe(0.9);
    const depois = numerosDe(e);
    expect(depois.total).not.toBeCloseTo(antes.total, 0);
    // a cfg do estado é a usada pelo plano (cfgDe)
    expect(cfgDe(e).demanda.adocao[1]).toBe(0.9);
  });
  it('as edições seguintes partem da cfg editada', () => {
    S().editarCfg('demanda.adocao.1', 0.9);
    S().editarCfg('opc.pi', 0.04);
    const c = S().custo.cfg;
    expect(c.demanda.adocao[1]).toBe(0.9); expect(c.opc.pi).toBe(0.04);
  });
  it('horizonte limitado a 1–10 e séries completadas até o ano editado', () => {
    S().editarCfg('opc.H', 25); expect(S().custo.cfg.opc.H).toBe(10);
    S().editarCfg('opc.H', -2); expect(S().custo.cfg.opc.H).toBe(1);
    S().editarCfg('opc.H', 0); expect(S().custo.cfg.opc.H).toBe(3);   // campo vazio: volta ao padrão, como na v13
    const o: any = { v: [1, 2] };
    editarCaminho(o, 'v.4', 9); expect(o.v).toEqual([1, 2, 2, 2, 9]);
    const n: any = { s: 3 };
    editarCaminho(n, 's.1', 5); expect(n.s).toEqual([3, 5]);
    expect(serieAnos([1, 2], 3)).toEqual([1, 2, 2, 2]);
  });
  it('adicionar e remover linhas de itens, pessoas e saída', () => {
    const n0 = cfgDe(S().estado()).itens.length;
    S().adicionarLinhaCfg('itens', novaLinha.item(3));
    expect(S().custo.cfg.itens.length).toBe(n0 + 1);
    S().removerLinhaCfg('itens', n0);
    expect(S().custo.cfg.itens.length).toBe(n0);
    S().adicionarLinhaCfg('saida.itens', novaLinha.saida());
    expect(S().custo.cfg.saida.itens.at(-1).valor).toBe(0);
    const p0 = S().custo.cfg.pessoas.length;
    S().adicionarLinhaCfg('pessoas', novaLinha.pessoa(3));
    expect(S().custo.cfg.pessoas.length).toBe(p0 + 1);
    expect(resultados(S().custo.cfg).ok).toBe(true);
  });
  it('faixas dos direcionadores (CUS-16)', () => {
    S().editarFaixa('adocao', 'max', 2);
    expect(S().custo.cfg.faixas).toEqual([{ id: 'adocao', min: 0.6, max: 2 }]);
    S().editarFaixa('adocao', 'min', 0.5);
    expect(S().custo.cfg.faixas[0]).toEqual({ id: 'adocao', min: 0.5, max: 2 });
  });
});

describe('base de premissas e refazer (CUS-10, CUS-11)', () => {
  it('trocar a base descarta as edições e usa o exemplo do guia', () => {
    S().editarCfg('opc.pi', 0.04);
    S().setBaseCusto('B');
    expect(S().custo).toMatchObject({ base: 'B', cfg: null, editado: false });
    expect(cfgDe(S().estado()).api.ativo).toBe(true);
    // edição sobre um exemplo persiste (editado = true) e sobrevive à exportação
    S().editarCfg('api.k', 2);
    expect(S().custo.cfg.__base).toBe('B');
    const e = migrar(JSON.parse(JSON.stringify(S().exportar())));
    expect(e.custo.cfg.api.k).toBe(2);
    S().setBaseCusto('zz'); expect(S().custo.base).toBe('caso');
  });
  it('refazer a partir das respostas', () => {
    S().editarCfg('opc.pi', 0.04);
    S().refazerCfg();
    expect(S().custo).toMatchObject({ cfg: null, editado: false });
  });
  it('mudar uma resposta que alimenta o custo depois de editar: guarda e avisa; manter ou refazer', () => {
    S().editarCfg('demanda.adocao.1', 0.9);
    S().responder('horizonte', 5);
    expect(calcDe(S().custo).pendente).toBe(true);
    expect(S().custo.cfg.demanda.adocao[1]).toBe(0.9);
    S().manterEdicoesCfg();
    expect(calcDe(S().custo).pendente).toBe(false);
    expect(S().custo.cfg.demanda.adocao[1]).toBe(0.9);
    S().responder('horizonte', 3);
    expect(calcDe(S().custo).pendente).toBe(true);
    S().refazerCfg();
    expect(calcDe(S().custo).pendente).toBe(false);
    expect(S().custo.cfg).toBeNull();
  });
  it('sem edições, a resposta refaz a cfg em silêncio (como na v13)', () => {
    S().responder('horizonte', 5);
    expect(calcDe(S().custo).pendente).toBe(false);
    expect(S().custo.cfg).toBeNull();
    expect(cfgDe(S().estado()).opc.H).toBe(5);
  });
});

describe('estado da calculadora: persistência e importação (CUS-27)', () => {
  it('padrões da v13 (estadoCusto)', () => {
    const c = calcDe(undefined);
    expect(c).toMatchObject({ base: 'caso', conta: 'eco', avancado: false, alts: [], lambda: '', refAlt: null });
    expect(c.estratos).toEqual(ESTRATOS_PADRAO);
  });
  it('setCalc grava conta, avançado, abertos, alternativas, λ, estratos e não mexe na cfg', () => {
    S().setCalc({ conta: 'fin', avancado: true, abertos: { K2: true }, alts: [{ nome: 'Status quo', impl: 0, anual: 1000, fte: 0.5, efeito: 0 }], lambda: 500, refAlt: 0, cfg: { x: 1 } as any });
    const c = calcDe(S().custo);
    expect(c).toMatchObject({ conta: 'fin', avancado: true, abertos: { K2: true }, lambda: 500, refAlt: 0 });
    expect(S().custo.cfg).toBeNull();
  });
  it('exportar → importar preserva o estado da calculadora e as edições', () => {
    S().editarCfg('opc.pi', 0.04);
    S().setCalc({ conta: 'fin', avancado: true, estratos: [{ nome: 'Rural', part: 1, fK1: 2, fK4: 1.5 }], efeitoCaso: 0.2 });
    const json = JSON.stringify(S().exportar());
    S().carregarExemplo('novo');
    S().importar(json);
    const c = calcDe(S().custo);
    expect(c).toMatchObject({ conta: 'fin', avancado: true, efeitoCaso: 0.2, editado: true });
    expect(c.estratos).toEqual([{ nome: 'Rural', part: 1, fK1: 2, fK4: 1.5 }]);
    expect(S().custo.cfg.opc.pi).toBe(0.04);
  });
  it('a migração aceita conta/avancado/alts/lambda/estratos da v13 e descarta lixo', () => {
    const o = calcImportado({ conta: 'fin', avancado: true, abertos: { K1: true, x: 3 }, alts: [{ nome: 'SQ', impl: '1000', anual: 5, fte: null }], lambda: '250', estratos: [{ nome: 'A', part: 0.5, fK1: 1, fK4: 1 }], refAlt: -2, lixo: 1 });
    expect(o).toEqual({ conta: 'fin', avancado: true, abertos: { K1: true }, alts: [{ nome: 'SQ', impl: 1000, anual: 5, fte: '', efeito: '' }], lambda: 250, estratos: [{ nome: 'A', part: 0.5, fK1: 1, fK4: 1 }] });
    const e = migrar({ app: 'ai-education-procurement-tool', formato: 13, versao: 13, caso: {}, custo: { base: 'caso', cfg: null, editado: false, conta: 'fin', avancado: true, pendente: true } });
    expect(calcDe(e.custo)).toMatchObject({ conta: 'fin', avancado: true, pendente: false });
  });
});

describe('funções da tela', () => {
  const cfgA = () => cfgPronta(PRESETS.A);
  it('resultados: erro claro com campos que quebram o cálculo (CUS-28)', () => {
    expect(resultados(cfgA()).ok).toBe(true);
    const ruim = cfgA(); ruim.demanda = null;
    const r = resultados(ruim);
    expect(r.ok).toBe(false);
  });
  it('árvore: fechada mostra K1–K6; aberta soma igual ao total, nas duas contas (CUS-12)', () => {
    const cfg = cfgA(), av = avaliar(calcular(cfg)), ind = indicadores(cfg, av);
    const f = linhasArvore(av, ind, 'eco', {});
    expect(f.linhas.map((l) => l.id)).toEqual(['K1', 'K2', 'K3', 'K4', 'K5', 'K6']);
    expect(f.total.total).toBeCloseTo(av.ctEco, 6);
    expect(f.linhas.reduce((a, l) => a + l.total, 0)).toBeCloseTo(av.ctEco, 6);
    const a = linhasArvore(av, ind, 'eco', todosAbertos());
    const insumos = a.linhas.filter((l) => l.nivel === 2).reduce((s, l) => s + l.total, 0);
    expect(insumos - av.vr).toBeCloseTo(av.ctEco, 4);
    const fin = linhasArvore(av, ind, 'fin', {});
    const desembolso = av.linhas.reduce((s: number, l: any) => s + l.fin.reduce((x: number, y: number) => x + y, 0), 0) + av.saidaFin;
    expect(fin.total.total).toBeCloseTo(desembolso, 4);
  });
  it('contas por ano: abas Ano 0…H e Saída; linhas + outros = soma do ano (CUS-19, porte do teste de renderFormula)', () => {
    const cx = contasPorAno(cfgA())!;
    expect(cx.abas.map((a) => a.id)).toEqual(['0', '1', '2', '3', 'saida']);
    cx.anos.forEach((a: any) => {
      const soma = a.linhas.reduce((s: number, x: any) => s + x.mostrado, 0) + (a.outros ? a.outros.mostrado : 0);
      expect(soma).toBeCloseTo(a.somaMostrada, 6);
      if (a.outros) expect(a.outros.itens.length).toBe(a.outros.n);
    });
    const h5 = cfgA(); h5.opc.H = 5;
    expect(contasPorAno(h5)!.abas.length).toBe(7);
  });
  it('CSV na moeda escolhida, com o separador decimal do idioma (CUS-22)', () => {
    const cfg = cfgA();
    const usd = csvCustosMoeda(cfg);
    expect(usd.charCodeAt(0)).toBe(0xfeff);
    const linhas = usd.slice(1).split('\n');
    expect(linhas[0]).toContain('USD');
    setMoeda({ cod: 'BRL', taxa: 5, taxaDe: 'BRL' });
    const brl = csvCustosMoeda(cfg).slice(1).split('\n');
    expect(brl[0]).toContain('BRL');
    const ult = (l: string) => +l.split(';').at(-1)!.replace(',', '.');
    // total econômico em BRL = 5 × o de US$; soma = custo econômico (sem o valor residual)
    expect(ult(brl[1])).toBeCloseTo(ult(linhas[1]) * 5, 1);
    const av = avaliar(calcular(cfg));
    const soma = brl.slice(1).reduce((s, l) => s + ult(l), 0);
    expect(soma / 5).toBeCloseTo(av.ctEco + av.vr, -1);
    expect(brl[1]).toMatch(/\d,\d\d$/);   // pt: vírgula decimal
  });
  it('alternativas: cfgAlternativa e a referência na frente (CUS-24)', () => {
    const cfg = cfgA();
    const alt = cfgAlternativa({ nome: 'SQ', impl: 1000, anual: 2000, fte: 0.5 }, cfg);
    expect(alt.implantacao[0].valor).toBe(1000);
    expect(alt.itens[0].v).toEqual([0, 2000, 2000, 2000]);
    const lista = listaComparacao('Seu caso', cfg, [{ nome: 'SQ', impl: 0, anual: 1000, fte: 0, efeito: 0 }], 0.3, 0);
    expect(lista[0].nome).toBe('SQ');
    const comp = comparar(lista);
    expect(comp[1].dC).toBeGreaterThan(0);
  });
  it('moedas: principais no topo, demais por nome', () => {
    const { principais, demais } = listaMoedas();
    expect(principais).toEqual(MOEDAS_PRINCIPAIS);
    expect(demais).not.toContain('USD');
    expect(demais.length).toBeGreaterThan(100);
  });
  it('foco: aba de cada campo e ids candidatos', () => {
    expect(abaDoFoco('saas.preco')).toBe('ferramentas');
    expect(abaDoFoco('demanda.adocao.1')).toBe('premissas');
    expect(abaDoFoco('tornado')).toBe('cenarios');
    expect(abaDoFoco('kpi.porAluno')).toBe('cenarios');
    expect(abaDoFoco('kpi.total')).toBe('premissas');
    expect(abaDoFoco(undefined)).toBeNull();
    expect(candidatosFoco('demanda.adocao.1')).toEqual(['rf-demanda.adocao.1', 'rf-demanda.adocao', 'rf-demanda']);
  });
});
