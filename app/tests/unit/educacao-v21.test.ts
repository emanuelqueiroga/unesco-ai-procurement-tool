// v021: modelo paramétrico de Educando com e sem IA (linhas por opção, fases e público por desafio, infraestrutura
// compartilhada, escolhas da ferramenta de IA, reposição pela vida útil) e o ciclo de telas por desafio.
import { describe, it, expect } from 'vitest';
import { orcamentoEducacao, calcularDesafio, fasesCalc, categoriasEscolhidas, opcoesEscolhidas, fases, COMPONENTES, CATEGORIAS_ED } from '../../src/percurso/educacaoV20';
import { telasAtivas } from '../../src/store/perguntas';

const TODAS = CATEGORIAS_ED.flatMap((c) => c.opcoes.map((o) => o.id));
const estado = (ed: Record<string, unknown>, pais = 'BRA') => ({ ctx: { prioridades: ['com'], edV20: ed }, caso: { pais }, moeda: { cod: 'USD', taxa: '', taxaDe: '' } }) as any;
const base = (extra: Record<string, unknown> = {}) => estado({ desafios: ['C32'], categorias: { C32: ['e1', 'e2', 'e3', 'e4'] }, opcoes: { C32: TODAS }, ...extra });
const comp = (s: any, d: string, id: string, alt: 'com' | 'sem') => calcularDesafio(s, d).opcoes.flatMap((o) => o.comps).find((c) => c.def.id === id && c.alt === alt)!;

describe('v021: catálogo de linhas', () => {
  it('toda opção tem linhas e toda linha diz alternativa e classe', () => {
    for (const c of CATEGORIAS_ED) for (const o of c.opcoes) expect(COMPONENTES.some((x) => x.op === o.id), o.id).toBe(true);
    for (const x of COMPONENTES) { expect(['ambos', 'com', 'sem']).toContain(x.alt); expect(['capex', 'opex', 'uso']).toContain(x.classe); expect(x.qtd || x.papeis || x.pctDe, x.id).toBeTruthy(); }
  });
  it('ferramentas de IA só na alternativa com IA', () => { for (const x of COMPONENTES.filter((c) => c.op === 'e43')) expect(x.alt).toBe('com'); });
  it('CapEx + OpEx + Utility = total em cada opção e no plano', () => {
    const r = orcamentoEducacao(base());
    for (const a of ['com', 'sem'] as const) {
      for (const o of r.porDesafio.C32.opcoes) expect(Math.abs(o[a].k + o[a].x + o[a].u - o[a].total)).toBeLessThan(0.05);
      expect(Math.abs(r[a].k + r[a].x + r[a].u - r[a].total)).toBeLessThan(0.05);
    }
    expect(r.com.total).toBeGreaterThan(0); expect(r.sem.total).toBeGreaterThan(0);
  });
  it('o tempo dos professores em formação fica fora do total', () => {
    const r = orcamentoEducacao(base()), o = r.porDesafio.C32.opcoes.find((x) => x.op === 'e31')!;
    const tempo = o.comps.find((c) => c.def.id === 'e31-tempo' && c.alt === 'com')!;
    expect(tempo.total).toBeGreaterThan(0);
    const soma = o.comps.filter((c) => c.alt === 'com' && !c.def.informativo).reduce((n, c) => n + c.total, 0);
    expect(Math.abs(o.com.total - soma)).toBeLessThan(0.05);
  });
});

describe('v021: edição das linhas', () => {
  it('desligar uma linha tira o valor dela, sem apagar o que foi digitado', () => {
    const s = base({ linhas: { C32: { 'e13-painel': { off: true, unit: 999 } } } });
    const c = comp(s, 'C32', 'e13-painel', 'com');
    expect(c.on).toBe(false); expect(c.total).toBe(0); expect(c.unit).toBe(999);
  });
  it('parâmetro e preço editados mudam a conta', () => {
    const a = comp(base(), 'C32', 'e23-estudantes', 'com').total;
    const b = comp(base({ linhas: { C32: { 'e23-estudantes': { p: { porDisp: 1 } } } } }), 'C32', 'e23-estudantes', 'com').total;
    expect(b).toBeGreaterThan(a * 2.5);
    const c = comp(base({ linhas: { C32: { 'e13-painel': { unit: 0 } } } }), 'C32', 'e13-painel', 'sem');
    expect(c.total).toBe(0);
  });
  it('parâmetro diferente com IA e sem IA', () => {
    const s = base({ linhas: { C32: { e31: { p: { horas: { com: 40 } } } } } });
    expect(comp(s, 'C32', 'e31-formadores', 'com').params.horas).toBe(40);
    expect(comp(s, 'C32', 'e31-formadores', 'sem').params.horas).toBe(20);
    // valor comum da opção: vale para as outras linhas que usam as horas do curso
    expect(comp(s, 'C32', 'e31-encontros', 'com').params.horas).toBe(40);
  });
  it('equipe: papel extra com perfil do país e alternativa', () => {
    const s = base({ extras: { C32: { 'e13-equipe': [{ id: 'p1', papel: 'Comunicação', perfil: 3, pessoas: 2, ded: 0.5, alt: 'com' }] } } });
    const com = comp(s, 'C32', 'e13-equipe', 'com'), sem = comp(s, 'C32', 'e13-equipe', 'sem');
    expect(com.papeis.some((p) => p.papel === 'Comunicação')).toBe(true);
    expect(sem.papeis.some((p) => p.papel === 'Comunicação')).toBe(false);
    expect(com.total).toBeGreaterThan(sem.total);
  });
});

describe('v021: desafios, ambiente e infraestrutura', () => {
  it('itens próprios ligam só no desafio deles', () => {
    const s = estado({ desafios: ['C32', 'C34'], categorias: { C32: ['e3'], C34: ['e3'] }, opcoes: { C32: ['e33'], C34: ['e33'] } });
    expect(comp(s, 'C34', 'e33-apoio', 'com').on).toBe(true);
    const c = comp(s, 'C32', 'e33-apoio', 'com');
    expect(c.on).toBe(false); expect(c.motivo).toBe('item próprio de outro desafio');
  });
  it('as mesmas escolas de outro desafio não repetem a infraestrutura', () => {
    const ed = { desafios: ['C32', 'C33'], categorias: { C32: ['e2'], C33: ['e2'] }, opcoes: { C32: ['e21', 'e22'], C33: ['e21', 'e22'] }, publico: { C33: { estudantes: 100000, escolas: 300 }, C32: { estudantes: 100000, escolas: 300 } } };
    const sep = calcularDesafio(estado(ed), 'C33'), junto = calcularDesafio(estado({ ...ed, publico: { ...ed.publico, C33: { ...ed.publico.C33, mesmas: 'C32' } } }), 'C33');
    const v = (dc: any, id: string) => dc.opcoes.flatMap((o: any) => o.comps).find((c: any) => c.def.id === id && c.alt === 'com').total;
    expect(v(sep, 'e21-sistemas')).toBeGreaterThan(0); expect(v(junto, 'e21-sistemas')).toBe(0);
    expect(v(junto, 'e22-mensalidade')).toBe(0);
    // a eletricidade é consumo das pessoas, não da escola: continua
    expect(v(junto, 'e21-eletricidade')).toBe(v(sep, 'e21-eletricidade'));
  });
  it('modalidade online: sem infraestrutura de escola, dados móveis e um dispositivo por estudante', () => {
    const s = base({ publico: { C32: { modalidade: 'online', dispositivos: 0 } } });
    const fs = fasesCalc(s, 'C32');
    expect(fs.every((f) => f.Ei === 0)).toBe(true);
    expect(comp(s, 'C32', 'e22-dados', 'com').total).toBeGreaterThan(0);
    const disp = comp(s, 'C32', 'e23-estudantes', 'com');
    expect(disp.porFase.reduce((n, v) => n + v.qtd, 0)).toBeGreaterThanOrEqual(fs.at(-1)!.A);
  });
  it('vida útil: a compra se repete quando acaba dentro do plano', () => {
    const curto = comp(base(), 'C32', 'e23-professores', 'sem').porFase.reduce((n, v) => n + v.qtd, 0);
    const longo = base({ fasesD: { C32: [{}, {}, {}, { meses: 60 }] } });
    const q = comp(longo, 'C32', 'e23-professores', 'sem').porFase.reduce((n, v) => n + v.qtd, 0);
    expect(q).toBeGreaterThan(curto * 1.2);
  });
});

describe('v021: ferramenta de IA (formas de oferta da 0.0.14)', () => {
  const ligadas = (ia: Record<string, string>) => calcularDesafio(base({ ia: { C32: ia } }), 'C32').opcoes.find((o) => o.op === 'e43')!.comps.filter((c) => c.on).map((c) => c.def.id);
  it('SaaS por usuário: licenças', () => { const l = ligadas({}); expect(l).toContain('e43-licenca'); expect(l).not.toContain('e43-tokens'); });
  it('API: tokens, RAG, desenvolvimento e manutenção', () => { const l = ligadas({ arq: 'api', pag: 'consumo' }); for (const id of ['e43-tokens', 'e43-rag', 'e43-desenvolvimento', 'e43-manutencao']) expect(l).toContain(id); expect(l).not.toContain('e43-licenca'); });
  it('pesos abertos: GPUs, infraestrutura e equipe de ML', () => { const l = ligadas({ arq: 'ow', tipo: 'aberta', pag: 'consumo', lic: 'aberta' }); for (const id of ['e43-gpu', 'e43-infra', 'e43-equipe']) expect(l).toContain(id); expect(l).not.toContain('e43-juridico'); });
  it('assinatura institucional e piloto gratuito', () => { expect(ligadas({ pag: 'institucional' })).toContain('e43-institucional'); expect(ligadas({ pag: 'gratuito' })).toContain('e43-gratuito'); });
  it('ferramenta pública: licença sem custo', () => {
    const c = calcularDesafio(base({ ia: { C32: { tipo: 'publica' } } }), 'C32').opcoes.find((o) => o.op === 'e43')!.comps.find((x) => x.def.id === 'e43-licenca')!;
    expect(c.total).toBe(0);
  });
  it('o custo de desenvolvimento e o de saída seguem a arquitetura', () => {
    const dev = (arq: string) => comp(base({ ia: { C32: { arq } } }), 'C32', 'e43-desenvolvimento', 'com').unitRef;
    expect(dev('ow')).toBeGreaterThan(dev('api'));
  });
});

describe('v021: telas por desafio e casos da v020', () => {
  it('ciclo por desafio, como na governança', () => {
    const s = estado({ desafios: ['C32', 'C34'], categorias: { C32: ['e1', 'e3'], C34: ['e2'] } });
    const ids = telasAtivas(s).map((t) => t.id).filter((id) => id.startsWith('ed-'));
    expect(ids).toEqual(['ed-desafios', 'ed-publico-C32', 'ed-fases-C32', 'ed-categorias-C32', 'ed-opcoes-C32-e1', 'ed-opcoes-C32-e3', 'ed-resumo-C32',
      'ed-publico-C34', 'ed-fases-C34', 'ed-categorias-C34', 'ed-opcoes-C34-e2', 'ed-resumo-C34', 'ed-adicionais']);
  });
  it('caso da v020 (opções sem categorias, fases comuns) continua valendo', () => {
    const s = estado({ desafios: ['C31'], opcoes: { C31: ['e11', 'e23', 'e42'] }, fases: [{}, { meses: 9 }] });
    expect(categoriasEscolhidas(s, 'C31')).toEqual(['e1', 'e2', 'e4']);
    expect(opcoesEscolhidas(s, 'C31')).toEqual(['e11', 'e23', 'e42']);
    expect(fases(s, 'C31')[1].meses).toBe(9);
  });
});
