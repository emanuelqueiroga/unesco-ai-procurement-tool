// Pacote R7 (motor), decisão 2 opção b: REC-46 a REC-51 e REC-13 (design/redesign/05-requisitos-recomendacoes.md, seções 8 e 9).
// Números de referência dos exemplos (antes → depois do R7), com a simulação de 1.500 sorteios e semente 20261003:
//   A  moderado → moderado  Ano 0 125.270 → 137.270   custo total 4.747.846 → 4.759.846  (K3.4 +12 mil)
//   B  elevado  → elevado   Ano 0 336.234 → 393.234   custo total 1.770.133 → 1.827.133  (K3.4 +12 mil, K5.4 no Ano 0 +45 mil)
//   C  elevado  → elevado   Ano 0 120.254 → 132.254   custo total 1.643.396 → 1.655.396  (K3.4 +12 mil)
//   D  limitado → moderado  Ano 0 162.173 → 162.173   custo total   570.107 →   630.407  (verificabilidade "parcial": governança do
//      nível moderado; o painel mediu 618,4 mil só com E1; com E2 o D mantém os 12 mil de K3.4 que já tinha no nível limitado)
import { describe, it, expect } from 'vitest';
import { clone, calcular, avaliar } from '../../src/domain/custos.js';
import {
  casoEfetivo, perfilFinal, alertas, verificabilidadeDe, motivoArquitetura, alertaArqPresumida, ALERTA_ARQ_PRESUMIDA,
  notaNormativa, perfilamento, AI_ACT_APLICACAO, dataAiActVerificada, extrasPD, TEXTOS_REC_R7,
} from '../../src/domain/framework.js';
import { CASOS, CTX_EX, CASO_VAZIO, cfgDoCaso, governancaPorRisco, revisaoPorVolume, contatoCriancasGen } from '../../src/domain/casos.js';

const totDe = (ctx) => {
  const ids = Object.keys(ctx.etapas).filter((k) => ctx.etapas[k].on);
  const al = (id) => { const e = ctx.etapas[id]; return (!e.soTotal && Array.isArray(e.anos) && e.anos.length) ? e.anos.reduce((a, b) => a + (+b || 0), 0) : +e.alunos || 0; };
  return { alunos: ids.reduce((s, id) => s + al(id), 0), escolas: ids.reduce((s, id) => s + (+ctx.etapas[id].escolas || 0), 0), etapas: ids };
};
const ceDe = (k, muda) => casoEfetivo(Object.assign(clone(CASOS[k]), muda || {}), totDe(CTX_EX[k]));
const tudo = (k, muda) => { const ce = ceDe(k, muda), p = perfilFinal(ce), cfg = cfgDoCaso(ce, p), a = avaliar(calcular(cfg)); return { ce, p, cfg, a }; };
const linha = (a, s, nome) => a.linhas.filter((l) => l.s === s && (!nome || l.nome === nome));
const ano0 = (a, s) => linha(a, s).reduce((x, l) => x + l.v[0], 0);
const R = { A: tudo('A'), B: tudo('B'), C: tudo('C'), D: tudo('D') };

describe('REC-46: verificabilidade (decisão 2, opção b)', () => {
  it('api e pesos abertos → parcial; termos de uso padrão fora delas → não; resposta do contrato prevalece', () => {
    expect(verificabilidadeDe({ arquitetura: 'api', licenca: 'termos' })).toBe('parcial');
    expect(verificabilidadeDe({ arquitetura: 'ow', licenca: 'aberta' })).toBe('parcial');
    expect(verificabilidadeDe({ arquitetura: 'saas', licenca: 'termos' })).toBe('nao');
    expect(verificabilidadeDe({ arquitetura: 'saas', licenca: 'assinatura' })).toBe('parcial');
    expect(verificabilidadeDe({ arquitetura: 'api', verificacao: 'sim' })).toBe('sim');
    expect(verificabilidadeDe({ arquitetura: 'ow', verificacao: 'nao' })).toBe('nao');
    expect(casoEfetivo(Object.assign(clone(CASO_VAZIO), { arquitetura: 'api' }), {}).verificabilidade).toBe('parcial');
  });
  it('D: opacidade deixa de ser limitada, nível moderado, custo total 630.407 (618,4 mil do E1 + K3.4)', () => {
    expect(R.D.ce.verificabilidade).toBe('parcial');
    expect(R.D.p.P.opacidade).toBe('moderado');
    expect(R.D.p.agregado).toBe('moderado');
    expect(Math.round(R.D.a.ctEco)).toBe(630407);
    expect(Math.round(R.D.a.ctEco - ano0(R.D.a, 'K3.4'))).toBe(618407);
  });
  it('A, B e C não mudam de nível', () => {
    expect([R.A.p.agregado, R.B.p.agregado, R.C.p.agregado]).toEqual(['moderado', 'elevado', 'elevado']);
  });
});

describe('REC-47 e REC-48: K3.4 e K5.4 no Ano 0', () => {
  it('K3.4 > 0 no Ano 0 em A, B, C e D (todos os níveis)', () => {
    ['A', 'B', 'C', 'D'].forEach((k) => expect(ano0(R[k].a, 'K3.4'), k).toBe(12000));
    ['critico', 'elevado', 'moderado', 'limitado', 'minimo'].forEach((n) => {
      const c = { pessoas: [], itens: [] }; governancaPorRisco(c, n);
      expect(c.itens.filter((x) => x.s === 'K3.4' && x.v[0] > 0).length, n).toBe(1);
    });
  });
  it('K5.4 > 0 no Ano 0 só com crianças em contato direto (B)', () => {
    expect(contatoCriancasGen(R.B.ce)).toBe(true);
    expect(ano0(R.B.a, 'K5.4')).toBe(45000);
    ['A', 'C', 'D'].forEach((k) => { expect(contatoCriancasGen(R[k].ce), k).toBe(false); expect(ano0(R[k].a, 'K5.4'), k).toBe(0); });
    expect(R.B.cfg.v11.governanca.contatoCriancas).toBe(true);
  });
  it('fora do risco elevado (perfil ajustado), o contato direto ainda antecipa os testes adversariais', () => {
    const c = { pessoas: [], itens: [] }; governancaPorRisco(c, 'moderado', null, { contatoCriancas: true });
    const k54 = c.itens.filter((x) => x.s === 'K5.4' && x.v[0] > 0);
    expect(k54.length).toBe(1);
    expect(k54[0].v).toEqual([45000, 0, 0, 0]);
  });
});

describe('REC-49: K5.3 ligado ao volume de revisão (P2)', () => {
  it('sem taxa de alerta e minutos informados, nenhuma linha nova e os números do C não mudam', () => {
    expect(linha(R.C.a, 'K5.3', 'Revisão caso a caso dos alertas (volume)')).toEqual([]);
    expect(R.C.cfg.v11.revisaoVolume).toBeUndefined();
    expect(revisaoPorVolume({ taxaAlerta: 2 })).toBeNull();
  });
  it('C: mudar a taxa de alerta muda K5.3; as horas seguem alcançados × taxa × meses × minutos', () => {
    const c2 = tudo('C', { revisao: { taxaAlerta: 2, minutos: 20 } });
    const c4 = tudo('C', { revisao: { taxaAlerta: 4, minutos: 20 } });
    const k = (x) => linha(x.a, 'K5.3').reduce((s, l) => s + l.v.reduce((a, b) => a + b, 0), 0);
    expect(k(c2)).toBeGreaterThan(k(R.C));
    expect(k(c4)).toBeGreaterThan(k(c2));
    const vol = c2.cfg.v11.revisaoVolume;
    expect(vol.horas[1]).toBeGreaterThan(0);
    const alc = vol.alertasMes[1] / 0.02;
    expect(vol.horas[1]).toBeCloseTo(alc * 0.02 * Math.min(12, c2.cfg.demanda.meses[1]) * 20 / 60, 6);
    // a linha de volume não é escalada pelo nível de acompanhamento (4.x)
    const ci = tudo('C', { revisao: { taxaAlerta: 2, minutos: 20 }, acompanhamento: 'intensivo' });
    expect(linha(ci.a, 'K5.3', 'Revisão caso a caso dos alertas (volume)')[0].v).toEqual(linha(c2.a, 'K5.3', 'Revisão caso a caso dos alertas (volume)')[0].v);
  });
});

describe('REC-13: arquitetura presumida', () => {
  it('marcada sempre que a 3.2.1 está em branco ou "não sei", com o motivo', () => {
    expect([R.A.ce.__arqPresumida, R.B.ce.__arqPresumida, R.C.ce.__arqPresumida, R.D.ce.__arqPresumida]).toEqual([true, true, true, false]);
    expect(R.B.ce.__arqMotivo).toEqual(['tipoTec', 'licenca']);
    expect(R.A.ce.__arqMotivo).toEqual(['padrao']);
    expect(motivoArquitetura({ pagamento: 'consumo' })).toEqual(['pagamento']);
    expect(casoEfetivo(Object.assign(clone(CASO_VAZIO), { tipoTec: 'paga', arquitetura: 'nao_sei' }), {}).__arqPresumida).toBe(true);
    expect(casoEfetivo(Object.assign(clone(CASO_VAZIO), { tipoTec: 'nao_sei', arquitetura: 'ow' }), {}).__arqPresumida).toBe(false);
  });
  it('o alerta cita a arquitetura de fato presumida (B: pesos abertos), e não sempre "produto pago por licença"', () => {
    const txt = (k) => alertas(R[k].ce, R[k].p).filter((x) => x.cap === 9 && /presume/.test(x.texto));
    expect(txt('B')).toHaveLength(1);
    expect(txt('B')[0].texto).toMatch(/pesos abertos/);
    expect(txt('B')[0].nivel).toBe('info');
    expect(txt('A')[0].texto).toBe(ALERTA_ARQ_PRESUMIDA.comTec.saas);
    expect(txt('A')[0].nivel).toBe('atencao');   // proposta recebida
    expect(txt('C')[0].texto).toBe(ALERTA_ARQ_PRESUMIDA.semTec.saas);
    expect(txt('D')).toEqual([]);
    expect(alertaArqPresumida({ tipoTec: 'nao_sei', arquitetura: 'api' })).toMatch(/por API/);
    alertas(R.B.ce, R.B.p).forEach((x) => expect(x.texto).not.toMatch(/produto pago por licença como premissa/));
  });
});

describe('REC-50: nota normativa com perfilamento e data verificada', () => {
  it('C (alerta precoce com dados de estudantes) recebe a nota; A e D não', () => {
    expect(perfilamento(R.C.ce)).toBe(true);
    const n = notaNormativa(R.C.ce);
    expect(n).not.toBeNull();
    expect(n.perfilamento).toBe(true);
    expect(n.decisao).toBe(true);
    expect(n.paragrafos.join(' ')).toMatch(/perfilamento/);
    expect(notaNormativa(R.A.ce)).toBeNull();
    expect(notaNormativa(R.D.ce)).toBeNull();
    expect(extrasPD(3, R.C.ce, R.C.p).some((x) => /perfilamento/.test(x))).toBe(true);
  });
  it('nota é a de sempre para as categorias do Anexo III', () => {
    const ce = casoEfetivo(Object.assign(clone(CASO_VAZIO), { consequencias: ['nota'] }), {});
    expect(notaNormativa(ce).paragrafos[0]).toMatch(/^O uso descrito corresponde a categorias/);
    expect(notaNormativa(ce).categorias).toEqual(['avaliar resultados de aprendizagem']);
  });
  it('a data vem de uma constante com fonte; só entra no texto com data de verificação', () => {
    expect(AI_ACT_APLICACAO.fonte).toMatch(/2024\/1689/);
    expect(AI_ACT_APLICACAO.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect('verificadoEm' in AI_ACT_APLICACAO).toBe(true);
    const sem = notaNormativa(R.C.ce);
    if (!dataAiActVerificada()) {
      expect(sem.data).toBeNull();
      expect(sem.paragrafos.join(' ')).not.toMatch(/20\d\d/);
    }
    const antes = AI_ACT_APLICACAO.verificadoEm;
    try {
      AI_ACT_APLICACAO.verificadoEm = '2026-10-28';
      expect(dataAiActVerificada()).toBe(true);
      expect(notaNormativa(R.C.ce).paragrafos.join(' ')).toContain(AI_ACT_APLICACAO.rotulo);
      AI_ACT_APLICACAO.verificadoEm = '28/10';   // formato inválido = não verificada
      expect(dataAiActVerificada()).toBe(false);
    } finally { AI_ACT_APLICACAO.verificadoEm = antes; }
  });
});

describe('frases novas do R7 para a tradução', () => {
  it('TEXTOS_REC_R7 traz os seis alertas, as frases da nota e os nomes das linhas novas', () => {
    [...Object.values(ALERTA_ARQ_PRESUMIDA.semTec), ...Object.values(ALERTA_ARQ_PRESUMIDA.comTec)].forEach((t) => expect(TEXTOS_REC_R7).toContain(t));
    const c = notaNormativa(R.C.ce); c.paragrafos.forEach((t) => expect(TEXTOS_REC_R7).toContain(t));
    expect(TEXTOS_REC_R7).toContain('Revisão caso a caso dos alertas (volume)');
    expect(TEXTOS_REC_R7).toContain('Testes adversariais antes do teste com crianças');
  });
});
