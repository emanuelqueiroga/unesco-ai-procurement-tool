// Pacote R5 do sistema de recomendações (REC-32 a REC-37): números ligados às recomendações, lidos do mesmo seletor de
// numerosCusto e da mesma simulação do relatório (domain/rec_numeros.js e plano/relatorio.js).
// Valores de referência calculados com o motor atual (depois do R7: K3.4 no Ano 0 de A, B e C; K5.4 no Ano 0 do B;
// D moderado), e não com os números do painel (que eram anteriores ao R7):
//   central / P10 / P50 / P90  A 4.759.846 / 4.694.261 / 5.148.910 / 5.739.336 (P50 +8,2%)
//                              B 1.827.133 / 1.789.203 / 1.853.654 / 1.927.698 (+1,5%)
//                              C 1.655.396 / 1.646.563 / 1.743.068 / 1.866.985 (+5,3%)
//                              D   630.407 /   621.356 /   653.715 /   691.776 (+3,7%)
//   B: média do ciclo por aprendiz US$ 5,13; regime (Ano 2) US$ 3,13 por acesso e US$ 8,94 por usuário ativo;
//      teste US$ 66 por participante (393.234 ÷ 6.000; o painel dizia US$ 56, antes do R7); saída US$ 112,9 mil, 0,47 anos;
//      itens sem faixa 43% do custo total; estresse US$ 2,04 mi acima do P90.
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { useCaso } from '../../src/store/caso';
import { setLang, setMoeda, setTabelaMoedas } from '../../src/domain';
import * as RN from '../../src/domain/rec_numeros.js';
import * as REL from '../../src/plano/relatorio.js';
import { secoesPlano } from '../../src/plano/secoes.js';

// os módulos são JS: tipos soltos nos testes
const { numerosRec, numero, varsRec, avaliabilidade, limiar, valeOQueCusta, indicadoresRec, faixaRec, frasesIndicadoresRec,
  mdesEscolas, escolasPara, recCacheTamanho, CHAVES_NUMERO, TEXTOS_REC_R5, CONV_AVAL } = RN as any;
const { relDados, relFaixa, relIndicadores, relSimulacao, relCenarios, relAvaliacao } = REL as any;
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
const D: Record<string, any> = {};
const dDe = (k: string) => (D[k] ||= numerosRec(exemplo(k)));

describe('REC-32: numero(k, d) lê o mesmo seletor de numerosCusto', () => {
  it('B: saída US$ 112,9 mil e 0,47 anos; dotação com 4 valores; premissa principal com a amplitude', () => {
    const d = dDe('B');
    expect(Math.round(d.total)).toBe(1827133);
    expect(numero('saida', d).valor).toBe('US$ 112,9 mil');
    expect(numero('saidaEco', d).valor).toBe('US$ 126,5 mil');
    expect(numero('anosParaSair', d).valor).toBe('0,47');
    expect(d.dot.length).toBe(4);
    expect(numero('dotacao', d).valor).toBe('Ano 0: US$ 360,2 mil; Ano 1: US$ 319,4 mil; Ano 2: US$ 336,7 mil; Ano 3: US$ 279,8 mil');
    expect(numero('dotFaixa', d).valor).toBe('US$ 279,8 mil a US$ 336,7 mil');
    expect(numero('recorrente', d).valor).toBe('75%');
    expect(numero('premissa', d).valor).toBe('Custo carregado de pessoal (−US$ 84 mil a +US$ 125,9 mil)');
    expect(numero('adocao', d).valor).toBe('35% a 45%');
    expect(numero('saida', d).falta).toBe(false);
    // custo de um subcomponente (R-18: avaliação de impacto com comparador, US$ 60 mil nos Anos 1 e 2)
    const k55 = numero('sub:K5.5', d);
    expect(Math.round(k55.bruto.total)).toBe(120000);
    // todas as chaves dão um valor no B, exceto as que não se aplicam (licença, beneficiário, limiar sem resposta)
    const sem = CHAVES_NUMERO.filter((k: string) => numero(k, d).falta);
    expect(sem.sort()).toEqual(['aEq', 'beneficiario', 'limiar']);
  });

  it('A: adoção de equilíbrio de 60% contra 35% a 50% previstos (R-61)', () => {
    const d = dDe('A');
    expect(numero('aEq', d).valor).toBe('60%');
    expect(numero('adocao', d).valor).toBe('35% a 50%');
    expect(numero('premissa', d).valor).toMatch(/^Câmbio/);
  });

  it('caso em branco: sem números, "a calcular" e nenhum valor', () => {
    const e = exemplo('novo');
    expect(numerosRec(e)).toBeNull();
    const x = numero('p50', null);
    expect(x.valor).toBe('a calcular');
    expect(x.falta).toBe(true);
    expect(x.bruto).toBeNull();
    expect(varsRec(null)).toEqual({});
    expect(indicadoresRec(null, e)).toEqual([]);
    expect(frasesIndicadoresRec(null)).toEqual([]);
  });

  it('varsRec preenche os marcadores {…} das regras com os mesmos textos de numero()', () => {
    const d = dDe('A');
    const v = varsRec(d);
    const txt = 'Central {central}, P10 {p10}, P50 {p50}, P90 {p90}.'.replace(/\{(\w+)\}/g, (_, n) => v[n]);
    expect(txt).toBe('Central US$ 4,76 mi, P10 US$ 4,69 mi, P50 US$ 5,15 mi, P90 US$ 5,74 mi.');
    expect(v.premissaNome).toBe('Câmbio (itens em moeda estrangeira)');
    expect(varsRec(d, ['p50'])).toEqual({ p50: 'US$ 5,15 mi' });
  });

  it('as regras e o relatório usam a mesma simulação (um cálculo por caso)', () => {
    const e = exemplo('B');
    const d = numerosRec(e);
    expect(d.p50).toBeGreaterThan(d.central);   // a simulação só roda quando um campo dela é lido
    const n = recCacheTamanho();
    const r: any = relDados(e);
    expect(recCacheTamanho()).toBe(n);
    expect(r.sim).toBe(d.sim);
    expect(r.rec.p50).toBe(d.p50);
  });
});

describe('REC-36: P10, P50, P90 e central (decisão 3)', () => {
  const REF: Record<string, number[]> = {
    A: [4759846, 4694261, 5148910, 5739336], B: [1827133, 1789203, 1853654, 1927698],
    C: [1655396, 1646563, 1743068, 1866985], D: [630407, 621356, 653715, 691776],
  };
  for (const k of ['A', 'B', 'C', 'D']) {
    it(k + ': central, P10, P50 e P90 do motor atual', () => {
      const d = dDe(k);
      expect([d.central, d.p10, d.p50, d.p90].map(Math.round)).toEqual(REF[k]);
    });
  }
  it('A: os quatro valores que R-72 cita; P50 mais de 5% acima do central em A e C, não em B e D', () => {
    const v = varsRec(dDe('A'));
    expect([v.p10, v.p50, v.p90, v.central]).toEqual(['US$ 4,69 mi', 'US$ 5,15 mi', 'US$ 5,74 mi', 'US$ 4,76 mi']);
    expect(v.p50Delta).toBe('+8,2%');
    expect(varsRec(dDe('C')).p50Delta).toBe('+5,3%');
    expect(dDe('A').p50Delta).toBeGreaterThan(0.05);
    expect(dDe('C').p50Delta).toBeGreaterThan(0.05);
    expect(dDe('B').p50Delta).toBeLessThan(0.05);
    expect(dDe('D').p50Delta).toBeLessThan(0.05);
  });
  it('a manchete continua no central e o P50 vai ao lado como "valor para orçar"', () => {
    const f: any = relFaixa(relDados(exemplo('B')));
    expect(f.centralTxt).toBe('US$ 1,83 mi');
    expect(f.faixaTxt).toBe('Faixa provável (P10 a P90): US$ 1,79 mi a US$ 1,93 mi');
    expect(f.p50Rot).toBe('Valor para orçar (P50): US$ 1,85 mi');
    expect(f.p90Rot).toBe('Teto prudente (P90): US$ 1,93 mi');
    expect(f.nota).toMatch(/^Valor para orçar \(P50\): US\$ 1,85 mi\. Teto prudente \(P90\): US\$ 1,93 mi\./);
    expect(f.nota).not.toContain('cenário esperado');
    expect(f.pP50).toBeGreaterThan(f.pCentral);
    expect(f.pP50).toBeLessThan(f.pHi);
    expect(faixaRec(dDe('A')).p50DeltaTxt).toBe('O P50 fica 8,2% acima do valor central.');
  });
});

describe('REC-33: avaliabilidade, com premissas visíveis e "ilustrativo, a confirmar"', () => {
  it('B: piloto 20 + 20 entre 0,20 e 0,26 DP; 1ª etapa 200 de 600 entre 0,05 e 0,08 DP', () => {
    const a = dDe('B').aval;
    expect(a.tipo).toBe('aprendizagem');
    expect(a.piloto.tratadas).toBe(20);
    expect(a.piloto.comparacao).toBe(20);
    expect(a.piloto.mdes).toBeGreaterThanOrEqual(0.20);
    expect(a.piloto.mdes).toBeLessThanOrEqual(0.26);
    expect(a.piloto.metade.mdes).toBeCloseTo(0.31, 2);   // 10 + 10 (o ECO dá ≈ 0,33)
    expect(a.etapa.entram).toBe(200);
    expect(a.etapa.esperam).toBe(400);
    expect(a.etapa.mdes).toBeGreaterThanOrEqual(0.05);
    expect(a.etapa.mdes).toBeLessThanOrEqual(0.08);
    expect(a.etapa.mdesUsuarios).toBeCloseTo(0.13, 2);   // ÷ adoção de 45% no Ano 1
    expect(a.medeViabilidade).toBe(true);
    expect(a.rotulo).toBe('ilustrativo, a confirmar');
    const prem = a.premissas.join(' ');
    expect(prem).toContain('poder de 80%');
    expect(prem).toContain('(ICC) de 0,15');
    expect(prem).toContain('R²');
    expect(a.linhas.join(' ')).toContain('o piloto mede viabilidade');
    expect(numero('mdesPiloto', dDe('B')).valor).toBe('0,22 DP (ilustrativo, a confirmar)');
    expect(numero('mdesEtapa', dDe('B')).ilustrativo).toBe(true);
  });
  it('A: tempo docente, piloto ≈ 0,27 DP e duas ondas de 400 ≈ 0,07 DP', () => {
    const a = dDe('A').aval;
    expect(a.tipo).toBe('tempo');
    expect(a.piloto.mdes).toBeCloseTo(0.27, 2);
    expect(a.etapa.ondas).toBe(true);
    expect([a.etapa.entram, a.etapa.esperam]).toEqual([400, 400]);
    expect(a.etapa.mdes).toBeCloseTo(0.07, 2);
  });
  it('C: abandono em pontos percentuais, piloto 10 + 10 ≈ 9 p.p. e duas ondas de 150 ≈ 2 p.p.', () => {
    const a = dDe('C').aval;
    expect(a.tipo).toBe('permanencia');
    expect(a.unidade).toBe('p.p.');
    expect(a.piloto.mdesPP).toBeGreaterThan(7);
    expect(a.piloto.mdesPP).toBeLessThan(10);
    expect([a.etapa.entram, a.etapa.esperam]).toEqual([150, 150]);
    expect(a.etapa.mdesPP).toBeCloseTo(2.2, 1);
    expect(a.premissas.join(' ')).toContain('Taxa-base de abandono de 10%');
  });
  it('D: só prova de conceito com dúvidas, sem piloto; o sorteio das solicitações pede o volume', () => {
    const e = exemplo('D');
    const a = avaliabilidade(e, dDe('D'));
    expect(a.tipo).toBe('solicitacoes');
    expect(a.piloto).toBeNull();
    expect(a.solicitacoes.falta).toBe(true);
    expect(a.linhas.join(' ')).toContain('a completar');
    // com o volume (pergunta 1.2.9 do Refinar): 3.000 por mês, 3 meses de prova de conceito → 9.000 → ≈ 0,06 DP
    e.caso.volumeResultado = { unidade: 'solicitacoes', volume: 3000, periodo: 'mes' };
    const b = avaliabilidade(e, dDe('D'));
    expect(b.solicitacoes.N).toBe(9000);
    expect(b.solicitacoes.mdes).toBeCloseTo(0.059, 3);
  });
  it('fórmula de Bloom e escolas necessárias', () => {
    expect(mdesEscolas(40, 0.5, 300, 0.15, 0.6, 0.4)).toBeCloseTo(0.2199, 4);
    expect(mdesEscolas(1, 0.5, 300, 0.15)).toBeNull();
    const J = escolasPara(0.10, 300, 0.15, 0.6, 0.4);
    expect(J % 2).toBe(0);
    expect(mdesEscolas(J, 0.5, 300, 0.15, 0.6, 0.4)).toBeLessThanOrEqual(0.10);
    expect(CONV_AVAL.M).toBe(2.8);
  });
});

describe('REC-34: limiar() e "Vale o que custa?"', () => {
  it('A: ≈ 33 min por semana por professor ativo', () => {
    const e = exemplo('A');
    const L = limiar(e, dDe('A'));
    expect(L.tipo).toBe('tempo');
    expect(L.completo).toBe(true);
    expect(Math.round(L.valor.minSemana)).toBe(33);
    expect(L.frase).toContain('≈ 33 min por semana');
    expect(L.rotulo).toBe('ilustrativo, a confirmar');
    expect(valeOQueCusta(e, dDe('A')).titulo).toBe('Vale o que custa?');
  });
  it('D sem volume: a fórmula com o custo do caso e "a completar"', () => {
    const e = exemplo('D');
    const v = valeOQueCusta(e, dDe('D'));
    expect(v.completo).toBe(false);
    expect(v.aCompletar).toBe('a completar');
    expect(v.formula).toContain('US$ 114,9 mil');
    expect(v.frase).toBe(v.formula);
    // com o volume: 36.000 solicitações por ano → ≈ 19 min por solicitação
    e.caso.volumeResultado = { unidade: 'solicitacoes', volume: 36000, periodo: 'ano' };
    const L = limiar(e, dDe('D'));
    expect(L.completo).toBe(true);
    expect(Math.round(L.valor.min)).toBe(19);
  });
  it('B sem a alternativa: fórmula com US$ 3,13; com a alternativa, o efeito de empate', () => {
    const e = exemplo('B');
    const L = limiar(e, dDe('B'));
    expect(L.tipo).toBe('aprendizagem');
    expect(L.completo).toBe(false);
    expect(L.formula).toContain('US$ 3,13');
    e.caso.altCustoEfeito = { custo: 10, efeito: 0.1 };
    const M = limiar(e, dDe('B'));
    expect(M.completo).toBe(true);
    expect(M.valor.efeitoEmpate).toBeCloseTo(0.1 * 3.1302 / 10, 4);
  });
  it('C: custo por abandono evitado a cada ponto percentual, sobre os estudantes atendidos', () => {
    const L = dDe('C').limiar;
    expect(L.tipo).toBe('permanencia');
    expect(L.valor.alunos).toBe(80000);
    expect(Math.round(L.valor.porAbandono)).toBe(615);
  });
  it('caso sem números: limiar sem valor', () => {
    const L = limiar(exemplo('B'), null);
    expect(L.completo).toBe(false);
    expect(L.valor).toBeNull();
  });
});

describe('REC-35: indicadores rotulados; some "sem passar de US$ x"', () => {
  it('B: 5,13 / 3,13 / 8,94 / 66, cada um com a pergunta que responde', () => {
    const L = dDe('B').indicadores;
    expect(L.map((x: any) => [x.id, x.valor])).toEqual([['mediaAcesso', 'US$ 5,13'], ['regimeAcesso', 'US$ 3,13'], ['regimeAtivo', 'US$ 8,94'], ['teste', 'US$ 66']]);
    expect(L.every((x: any) => /\?$/.test(x.pergunta) || /\.$/.test(x.pergunta))).toBe(true);
    expect(L.find((x: any) => x.id === 'regimeAtivo').rotulo).toBe('Em regime, por usuário ativo por ano (Ano 2)');
  });
  it('C: custo em regime por estudante atendido (quem usa são servidores)', () => {
    const L = dDe('C').indicadores;
    expect(L.map((x: any) => x.id)).toEqual(['mediaAcesso', 'beneficiario', 'regimeAtivo', 'teste']);
    expect(L.find((x: any) => x.id === 'beneficiario').valor).toBe('US$ 6,15');
    expect(dDe('A').indicadores.map((x: any) => x.id)).not.toContain('beneficiario');
  });
  it('"Em resumo" do B: Ano 0 com a dotação e os quatro indicadores; a linha Indicadores sem "sem passar de"', () => {
    const e = exemplo('B');
    const L = relIndicadores(relDados(e)) as any[];
    expect(L.map(k => k.valor)).toEqual(['US$ 393,2 mil', 'US$ 5,13', 'US$ 3,13', 'US$ 8,94', 'US$ 66']);
    expect(L[0].nota).toBe('Dotação do Ano 0: US$ 360,2 mil.');
    const S = (secoesPlano(e) as any[]).find(s => s.id === 'resumo' && !s.sub).sumario;
    const ind = S.exec.find((x: any) => x.id === 'ind').frases.join(' ');
    expect(ind).not.toContain('sem passar de');
    expect(ind).toContain('Custo em regime por usuário ativo: US$ 8,94 por ano (Ano 2); limite para ampliar: a definir pela rede.');
    expect(ind).toContain('Vale o que custa: Efeito de empate');
    expect(ind).toContain('(a completar)');
  });
});

describe('REC-37: parcela "sem faixa" acima de 25% e nota sobre o estresse', () => {
  it('B mostra o aviso (plataforma de US$ 180 mil, avaliação com comparador) e a nota do estresse', () => {
    const d = dDe('B');
    expect(d.semFaixa.parcela).toBeGreaterThan(0.25);
    expect(d.semFaixa.aviso).toBe(true);
    const nomes = d.semFaixa.itens.map((x: any) => x.nome);
    expect(nomes).toContain('Plataforma do tutor e integrações (implantação)');
    expect(nomes).toContain('Avaliação de impacto com comparador');
    const r: any = relDados(exemplo('B'));
    const f: any = relFaixa(r);
    expect(f.aviso).toMatch(/^A faixa subestima a incerteza: 43% do custo total está em itens sem faixa/);
    expect(f.notaEstresse).toBe('O cenário de estresse (US$ 2,04 mi) passa do P90 (US$ 1,93 mi) porque combina extremos que a simulação raramente sorteia juntos.');
    const si: any = relSimulacao(r);
    expect(si.pos).toEqual([f.aviso, si.nota, f.notaEstresse]);
    expect((relCenarios(r) as any).nota).toBe(f.notaEstresse);
  });
  it('A não mostra o aviso (5% sem faixa)', () => {
    const d = dDe('A');
    expect(d.semFaixa.parcela).toBeLessThan(0.25);
    expect(faixaRec(d).aviso).toBe('');
  });
});

describe('relatório: dados de "Como testar e avaliar" para o pacote R6', () => {
  it('B: avaliabilidade e "Vale o que custa?" a partir de relDados', () => {
    const e = exemplo('B');
    const x: any = relAvaliacao(relDados(e), e);
    expect(x.aval.piloto.tratadas).toBe(20);
    expect(x.vale.aCompletar).toBe('a completar');
    expect(relAvaliacao(null, e)).toBeNull();
  });
  it('textos novos listados para a tradução', () => {
    expect(TEXTOS_REC_R5).toContain('ilustrativo, a confirmar');
    expect(TEXTOS_REC_R5).toContain('Vale o que custa?');
    expect(TEXTOS_REC_R5.every((t: string) => typeof t === 'string' && t.length > 0)).toBe(true);
  });
});
