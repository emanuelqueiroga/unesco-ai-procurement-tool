// v022: valores sugeridos por país (UIS, Banco Mundial, UIT, ESMAP, UNICEF), piloto entre 10 e 60 locais, pessoas por
// fase, custo econômico × desembolso novo e a metodologia gerada do próprio modelo.
import { describe, it, expect } from 'vitest';
import { orcamentoEducacao, calcularDesafio, publicoSugerido, fasesCalc, COMPONENTES, CATEGORIAS_ED, SIM, padraoParam } from '../../src/percurso/educacaoV20';
import { semEnergiaPais, semInternetPais, razaoPais, deficienciaPais, precoPais, paramPais, DEFICIENCIA_MUNDO } from '../../src/percurso/educacaoPais';
import { ESCOLAS_UIS, KWH_PAIS, BANDA_UIT, MOVEL_UIT, PVOUT, RAZAO_UIS } from '../../src/percurso/educacaoDados';
import { MET_ED } from '../../src/percurso/metodologiaEd';
import { FORMULAS_MET_ED } from '../../src/percurso/formulasMetEd';

const TODAS = CATEGORIAS_ED.flatMap((c) => c.opcoes.map((o) => o.id));
const estado = (ed: Record<string, unknown>, pais = 'BRA') => ({ ctx: { prioridades: ['com'], edV20: ed }, caso: { pais }, moeda: { cod: 'USD', taxa: '', taxaDe: '' } }) as any;
const base = (pais = 'BRA', extra: Record<string, unknown> = {}) => estado({ desafios: ['C32'], categorias: { C32: ['e1', 'e2', 'e3', 'e4'] }, opcoes: { C32: TODAS }, ...extra }, pais);
const comp = (s: any, d: string, id: string, alt: 'com' | 'sem') => calcularDesafio(s, d).opcoes.flatMap((o) => o.comps).find((c) => c.def.id === id && c.alt === alt)!;

describe('v022: dados por país', () => {
  it('bases com cobertura ampla e valores plausíveis', () => {
    expect(Object.keys(ESCOLAS_UIS).length).toBeGreaterThan(150); expect(Object.keys(RAZAO_UIS).length).toBeGreaterThan(150);
    expect(Object.keys(KWH_PAIS).length).toBeGreaterThan(120); expect(Object.keys(BANDA_UIT).length).toBeGreaterThan(180);
    expect(Object.keys(MOVEL_UIT).length).toBeGreaterThan(180); expect(Object.keys(PVOUT).length).toBeGreaterThan(180);
    for (const [, v] of Object.entries(KWH_PAIS)) { expect(v[0]).toBeGreaterThan(0.004); expect(v[0]).toBeLessThan(1.01); }
    for (const [, v] of Object.entries(PVOUT)) { expect(v).toBeGreaterThan(1); expect(v).toBeLessThan(8); }
  });
  it('Brasil e Quênia: condições de partida e razão vêm da UIS', () => {
    const b = semInternetPais('BRA', 'C32')!; expect(b.grau).toBe('A'); expect(b.v).toBeCloseTo(100 - ESCOLAS_UIS.BRA.in1![0], 1);
    expect(semEnergiaPais('KEN', 'C32')!.v).toBeCloseTo(100 - ESCOLAS_UIS.KEN.el1![0], 1);
    const s = publicoSugerido(estado({ desafios: ['C32'] }, 'BRA'), 'C32');
    expect(s.semInternet).toBeCloseTo(b.v, 1);
    expect(s.professores).toBe(Math.max(10, Math.round(s.estudantes / razaoPais('BRA', 'C32')!.v)));
  });
  it('sem dado do país: mediana do grupo (grau B) ou convenção (C)', () => {
    expect(semEnergiaPais('XXX', 'C32')).toMatchObject({ grau: 'B', mediana: true });
    expect(semEnergiaPais(undefined, 'C32')).toBeNull();
    const moz = semInternetPais('MOZ', 'C32')!; expect(moz.mediana).toBe(true); expect(moz.v).toBeGreaterThan(60);
    expect(publicoSugerido(estado({ desafios: ['C32'] }, 'MOZ'), 'C32').semInternet).toBe(moz.v);
    expect(deficienciaPais('XXX')).toMatchObject({ v: DEFICIENCIA_MUNDO, grau: 'B' });
    const k = precoPais('kwh', 'XXX')!; expect(k.mediana).toBe(true); expect(k.v).toBeGreaterThan(0);
  });
  it('preço do kWh, do Mbps e do GB e banda mínima do país entram nas linhas', () => {
    const s = base('KEN');
    expect(comp(s, 'C32', 'e21-eletricidade', 'com').unitRef).toBeCloseTo(KWH_PAIS.KEN[0], 2);
    const m = comp(s, 'C32', 'e22-mensalidade', 'com');
    expect(m.unitRef).toBeCloseTo(BANDA_UIT.KEN[0] / BANDA_UIT.KEN[1], 2); expect(m.params.minimo).toBe(BANDA_UIT.KEN[1]); expect(m.def.classe).toBe('opex');
    expect(comp(s, 'C32', 'e21-sistemas', 'com').params.pvout).toBe(PVOUT.KEN);
  });
  it('gestão segue o divisor editado dos dispositivos; quebra é percentual do investimento em dispositivos', () => {
    const a = comp(base(), 'C32', 'e23-gestao', 'com').total, b = comp(base('BRA', { linhas: { C32: { 'e23-estudantes': { p: { porDisp: 1 } } } } }), 'C32', 'e23-gestao', 'com').total;
    expect(b).toBeGreaterThan(a * 1.5);
    const q = comp(base(), 'C32', 'e23-quebra', 'com'); expect(q.def.pctDe!.ids).toContain('e23-estudantes'); expect(q.total).toBeGreaterThan(0);
  });
  it('eletricidade só nos locais ligados à rede', () => {
    const s = base('KEN'), c = comp(s, 'C32', 'e21-eletricidade', 'com'), f = calcularDesafio(s, 'C32').fases.at(-1)!;
    expect(c.porFase.at(-1)!.qtd).toBeLessThan((f.A + f.P) * f.meses);
  });
  it('licença de estudantes: 0% nos desafios de crianças menores de 13 anos', () => {
    const pd = COMPONENTES.find((c) => c.id === 'e43-licenca')!.params![0];
    expect(padraoParam(pd, 'com', 'BRA', 'C32')).toBe(0); expect(padraoParam(pd, 'com', 'BRA', 'C33')).toBe(100);
  });
});

describe('v022: fases, pessoas e plano', () => {
  it('piloto de 9 meses entre 10 e 60 locais', () => {
    const fs = fasesCalc(base(), 'C32'), p = fs.find((f) => f.id === 'piloto')!;
    expect(p.meses).toBe(9); expect(p.E).toBeGreaterThanOrEqual(10); expect(p.E).toBeLessThanOrEqual(60);
  });
  it('pessoas: conta por fase fecha com o total do papel', () => {
    const c = comp(base(), 'C32', 'e12-implantadores', 'com');
    for (const r of c.papeis) expect(Math.abs(r.porFase.reduce((n, x) => n + x.valor, 0) - r.valor)).toBeLessThan(0.05);
  });
  it('servidor que já existe sai do desembolso novo e fica no custo econômico', () => {
    const s = base('BRA', { linhas: { C32: { 'e13-equipe': { papeis: { 'Coordenação do programa': { existente: true } } } } } });
    const r = orcamentoEducacao(s);
    expect(r.com.existente).toBeGreaterThan(0); expect(Math.abs(r.com.desembolso + r.com.existente - r.com.total)).toBeLessThan(0.05);
  });
  it('material impresso nas duas alternativas e viagens com 0%', () => {
    expect(COMPONENTES.find((c) => c.id === 'e41-impresso')!.alt).toBe('ambos'); expect(SIM.viagens).toBe(0);
  });
});

describe('v022: metodologia', () => {
  it('toda fórmula e todo símbolo têm MathML gerado', () => {
    for (const [s] of MET_ED.notacao) expect(FORMULAS_MET_ED[s], s).toBeTruthy();
    for (const e of MET_ED.equacoes) for (const x of e.tex) expect(FORMULAS_MET_ED[x], x).toBeTruthy();
  });
  it('textos em português e inglês', () => { for (const x of [...MET_ED.simples, ...MET_ED.comparacao, ...MET_ED.limites]) { expect(x.pt.length).toBeGreaterThan(50); expect(x.en.length).toBeGreaterThan(50); } });
});
