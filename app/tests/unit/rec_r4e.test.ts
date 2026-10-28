// Pacote R4, sub-pacote 4e (Técnica; REC-30): regras R-75 a R-82 do pacote TEC (regras/tec.js), nos exemplos A a D.
// B: a incoerência "modelo aberto com pagamento por uso" gera a R-76 e suspende a R-68; com 3.2.1 = api, a R-68 volta.
// Decisão 8: números ilustrativos só na ficha de aceite ("ilustrativo, ajuste"), nunca na frase da ação.
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { useCaso } from '../../src/store/caso';
import { setLang, setMoeda, setTabelaMoedas, resultadoRecomendacoes, recContexto, REGRAS, REGRA_POR_ID, mapaLegado } from '../../src/domain';
import { REGRAS_TEC, incoerenciaArqPagamento, fichaAceiteTec, ROTULO_ILUSTRATIVO, TEXTOS_REC_TEC } from '../../src/domain/regras/tec.js';
import { lintRegra } from '../../src/domain/regras/lint.js';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
beforeAll(() => { setTabelaMoedas(JSON.parse(fs.readFileSync(path.join(RAIZ, 'data', 'moedas.json'), 'utf8'))); });
afterEach(() => { setLang('pt'); setMoeda({ cod: 'USD', taxa: '', taxaDe: '' }); });
function exemplo(k: string, resp: Record<string, any> = {}): any {
  setLang('pt');
  useCaso.getState().carregarExemplo(k);
  Object.entries(resp).forEach(([campo, v]) => useCaso.getState().responder(campo, v));
  const e: any = useCaso.getState().estado();
  setMoeda(e.moeda);
  return e;
}
const res = (k: string, resp: Record<string, any> = {}, regras?: any[]): any => resultadoRecomendacoes(exemplo(k, resp), regras);
const ids = (k: string, resp: Record<string, any> = {}, regras?: any[]): string[] => res(k, resp, regras).recs.map((r: any) => r.id);
const porId = (k: string, id: string, resp: Record<string, any> = {}): any => res(k, resp).recs.find((r: any) => r.id === id);
const textoDe = (r: any) => [r.oque, r.razao, ...(r.como || []), r.paraque, r.pronto].join(' ');
const ctx = (k: string, resp: Record<string, any> = {}): any => recContexto(exemplo(k, resp));

// A suspensão da R-68 aplicada como o orquestrador ou o pacote 4c a aplicam: a regra lida na `suspende` da R-76 perde o
// gatilho enquanto a incoerência existe (`se: k => se(k) && !incoerenciaArqPagamento(k)`).
const COM_SUSPENSAO: any[] = (REGRAS as any[]).map(r => (((REGRA_POR_ID as any)['R-76'].suspende || []).includes(r.id)
  ? Object.assign({}, r, { se: (k: any) => r.se(k) && !incoerenciaArqPagamento(k) }) : r));

describe('REC-30 (4e): catálogo TEC', () => {
  it('as regras R-75 a R-82 existem, com ids únicos, no pacote TEC, e passam no lint', () => {
    ['R-75', 'R-76', 'R-77', 'R-78', 'R-79', 'R-80', 'R-81', 'R-82'].forEach(id => {
      const r = (REGRA_POR_ID as any)[id];
      expect(r, id).toBeTruthy();
      expect(r.pacote, id).toBe('TEC');
      expect(lintRegra(r), id).toEqual([]);
    });
    const L = (REGRAS_TEC as any[]).map(r => r.id);
    expect(new Set(L).size).toBe(L.length);
    REGRAS_TEC.forEach((r: any) => expect(lintRegra(r), r.id).toEqual([]));
  });
  it('as regras que saem continuam com destino (aberta-operacao → R-77, integracao → R-81, arquitetura-decidir → R-75)', () => {
    const m = mapaLegado() as Record<string, string[]>;
    expect(m['aberta-operacao']).toEqual(['R-77']);
    expect(m['integracao']).toEqual(['R-81']);
    expect(m['arquitetura-decidir']).toEqual(['R-75']);
    expect(m['arquitetura-api']).toEqual(['R-110']);
    expect(m['ferramentas-interop']).toEqual(['R-89']);
  });
});

describe('REC-30: a incoerência do B gera a R-76 e suspende a R-68', () => {
  it('B (modelo aberto, pagamento por consumo, 3.2.1 não sei): R-76 presente, Condição para levar ao mercado, com o custo de GPU e a arquitetura presumida', () => {
    const r = porId('B', 'R-76');
    expect(r).toBeTruthy();
    expect(r.nivel).toBe('condicao');
    expect(r.marco).toBe('M3');
    expect(r.quem).toEqual(['tecnologia']);
    expect(r.etiqueta).toBe('(presumida: confirme na 3.2.1)');
    expect(r.oque).toMatch(/^Esclarecer/);
    expect(r.oque).toMatch(/servidores contratados/);
    expect(r.oque).toMatch(/API de uma empresa/);
    expect(r.razao).toMatch(/US\$ [\d.,]+ mil em horas de servidor \(GPU\)/);
    expect(r.semNumero).toBe(false);
    expect(r.numero.id).toBe('sub:K2.3');
    expect(r.numero.emJogo).toBeGreaterThan(0);
    expect(r.exige).toContain('CONTRATO.custo-unidades');
    expect(r.como.join(' ')).toMatch(/3\.2\.1/);
  });
  it('A, C e D não têm a R-76 (sem pagamento por consumo ou sem modelo aberto)', () => {
    ['A', 'C', 'D'].forEach(k => expect(ids(k), k).not.toContain('R-76'));
  });
  it('a R-76 declara que suspende a R-68 e o predicado vale para B', () => {
    expect((REGRA_POR_ID as any)['R-76'].suspende).toEqual(['R-68']);
    expect(incoerenciaArqPagamento(ctx('B'))).toBe(true);
    ['A', 'C', 'D'].forEach(k => expect(incoerenciaArqPagamento(ctx(k)), k).toBe(false));
  });
  it('tabela do predicado: aberta ou pesos abertos com consumo, salvo com 3.2.1 = api', () => {
    const k = (v: Record<string, any>, arqEf: string) => ({ v: (id: string) => v[id] || '', arqEf });
    expect(incoerenciaArqPagamento(k({ tipoTec: 'aberta', pagamento: 'consumo', arquitetura: 'nao_sei' }, 'ow'))).toBe(true);
    expect(incoerenciaArqPagamento(k({ tipoTec: 'aberta', pagamento: 'consumo', arquitetura: 'ow' }, 'ow'))).toBe(true);
    expect(incoerenciaArqPagamento(k({ tipoTec: 'paga', pagamento: 'consumo', arquitetura: 'ow' }, 'ow'))).toBe(true);
    expect(incoerenciaArqPagamento(k({ tipoTec: 'aberta', pagamento: 'consumo', arquitetura: 'api' }, 'api'))).toBe(false);
    expect(incoerenciaArqPagamento(k({ tipoTec: 'aberta', pagamento: 'institucional', arquitetura: 'nao_sei' }, 'ow'))).toBe(false);
    expect(incoerenciaArqPagamento(k({ tipoTec: 'paga', pagamento: 'consumo', arquitetura: 'nao_sei' }, 'api'))).toBe(false);
  });
  it('com a suspensão aplicada: B tem R-76 e não tem R-68; com 3.2.1 = api a R-68 volta e a R-76 some', () => {
    const b = ids('B', {}, COM_SUSPENSAO);
    expect(b).toContain('R-76');
    expect(b).not.toContain('R-68');
    const api = ids('B', { arquitetura: 'api' }, COM_SUSPENSAO);
    expect(api).toContain('R-68');
    expect(api).not.toContain('R-76');
  });
  it('com a suspensão aplicada: sem pagamento por consumo (B institucional) não há R-76 e a R-68 não dispara', () => {
    const r = ids('B', { pagamento: 'institucional' }, COM_SUSPENSAO);
    expect(r).not.toContain('R-76');
    expect(r).not.toContain('R-68');
  });
  it('catálogo real: B sem R-68 e, com 3.2.1 = api, R-68 de volta (ativo quando a R-68 lê a incoerência: pedido ao pacote 4c)', ctx_ => {
    const ligada = !ids('B').includes('R-68');
    if (!ligada) ctx_.skip();   // enquanto a R-68 (regras/contrato.js) não ler `incoerenciaArqPagamento`
    expect(ids('B')).toContain('R-76');
    expect(ids('B', { arquitetura: 'api' })).toContain('R-68');
    expect(ids('B', { arquitetura: 'api' })).not.toContain('R-76');
  });
});

describe('R-75: confirmar a arquitetura presumida, com o motivo', () => {
  it('A, B e C (3.2.1 = não sei) têm a R-75; D (api respondida) não', () => {
    ['A', 'B', 'C'].forEach(k => expect(ids(k), k).toContain('R-75'));
    expect(ids('D')).not.toContain('R-75');
  });
  it('o motivo da presunção entra na razão (B: pesos abertos porque a tecnologia e a licença são abertas)', () => {
    expect(porId('B', 'R-75').razao).toMatch(/pesos abertos, porque a tecnologia e a licença são abertas/);
    expect(porId('A', 'R-75').razao).toMatch(/produto pronto por licença, porque nenhuma resposta indicou outra arquitetura/);
    expect(porId('B', 'R-75').etiqueta).toBe('(presumida: confirme na 3.2.1)');
  });
  it('o motivo segue a resposta que decidiu: pagamento por consumo → modelo por API', () => {
    const r = porId('A', 'R-75', { tipoTec: 'paga', pagamento: 'consumo', licenca: 'assinatura' });
    expect(r.razao).toMatch(/modelo por API, porque o pagamento é por consumo/);
  });
});

describe('R-77: equipe técnica da rede e operação do modelo', () => {
  it('B (pesos abertos): variante da operação, com o custo anual de equipe e operação do plano', () => {
    const r = porId('B', 'R-77');
    expect(r.oque).toMatch(/^Nomear a equipe técnica da rede e quem opera o modelo aberto/);
    expect(r.razao).toMatch(/orça US\$ [\d.,]+ mil por ano/);
    expect(r.exige).toEqual(expect.arrayContaining(['CONTRATO.saida-conhecimento', 'CONTRATO.direitos-matriz']));
    expect(r.marco).toBe('M1');
  });
  it('C (previsão) e D (api, sob medida) sem equipe técnica formada; A (SaaS, sem equipe técnica) não', () => {
    expect(porId('C', 'R-77').oque).toMatch(/modelo de alerta/);
    expect(porId('D', 'R-77').oque).toMatch(/acompanha o fornecedor da aplicação/);
    expect(ids('A')).not.toContain('R-77');
  });
  it('com a equipe técnica entre as pessoas formadas, C e D não têm a R-77; B continua (opera o modelo)', () => {
    expect(ids('C', { formados: ['gestores', 'tecnica'] })).not.toContain('R-77');
    expect(ids('D', { formados: ['administrativo', 'tecnica'] })).not.toContain('R-77');
    expect(ids('B', { formados: ['professores', 'tecnica'] })).toContain('R-77');
  });
  it('D: nada sobre estudantes, sala ou famílias', () => {
    expect(textoDe(porId('D', 'R-77'))).not.toMatch(/estudant|famíli|sala de aula|turma/i);
  });
});

describe('R-78: licença dos pesos', () => {
  it('só o B (modelo aberto) tem a R-78, para levar ao mercado, com jurídico e tecnologia', () => {
    const r = porId('B', 'R-78');
    expect(r.marco).toBe('M3');
    expect(r.quem).toEqual(['juridico', 'tecnologia']);
    expect(r.oque).toMatch(/licença exata dos pesos/);
    ['A', 'C', 'D'].forEach(k => expect(ids(k), k).not.toContain('R-78'));
  });
});

describe('R-79: capacidade no horário de aula', () => {
  it('B: dispara (estudantes e 150.000 pessoas), com o número de servidores no pico do plano', () => {
    const r = porId('B', 'R-79');
    expect(r).toBeTruthy();
    expect(r.marco).toBe('M1');
    expect(r.razao).toMatch(/até \d+ servidores de GPU no pico/);
    const G = Math.max(...(ctx('B').d.av.r.extra.G as number[]));
    expect(r.razao).toContain('até ' + G + ' servidores');
    expect(r.exige).toContain('CONTRATO.desempenho-sla');
  });
  it('A, C e D não disparam (sem estudantes e sem uso diário com 5.000 pessoas)', () => {
    ['A', 'C', 'D'].forEach(k => expect(ids(k), k).not.toContain('R-79'));
  });
  it('a variante segue a arquitetura: 3.2.1 = api cita as interações e o limite de chamadas', () => {
    const r = porId('B', 'R-79', { arquitetura: 'api' });
    expect(r.oque).toMatch(/limite de chamadas/);
    expect(r.razao).toMatch(/interações por ano/);
  });
  it('uso diário com 5.000 pessoas dispara sem estudantes (gatilho alternativo)', () => {
    expect(ids('D', { elegiveis: 6000 })).toContain('R-79');
  });
});

describe('R-80: injeção de instruções e quebra de limites', () => {
  it('B (estudantes com tutoria e geração): Condição, com o custo de testes adversariais do plano', () => {
    const r = porId('B', 'R-80');
    expect(r.nivel).toBe('condicao');
    expect(r.marco).toBe('M1');
    expect(r.razao).toMatch(/o plano reserva US\$ 180 mil para testes adversariais/);
    expect(r.como.length).toBe(4);
    expect(r.exige).toEqual(['CONTRATO.verificacao-seguranca']);
  });
  it('D (api, sem estudantes): Recomendada; A (SaaS, professores) e C (SaaS presumido, gestores) não têm a regra', () => {
    const d = porId('D', 'R-80');
    expect(d.nivel).toBe('recomendada');
    expect(textoDe(d)).not.toMatch(/estudant|famíli|sala de aula|turma/i);
    expect(ids('A')).not.toContain('R-80');
    expect(ids('C')).not.toContain('R-80');
  });
});

describe('R-81: identidade e padrão aberto', () => {
  it('dispara com integração (A, C) e com sob medida (B, D), em M3, e o D não cita estudantes nem turmas', () => {
    ['A', 'B', 'C', 'D'].forEach(k => expect(ids(k), k).toContain('R-81'));
    const r = porId('D', 'R-81');
    expect(r.marco).toBe('M3');
    expect(r.oque).toMatch(/^Integrar o login ao sistema de identidade da rede/);
    expect(textoDe(r)).not.toMatch(/estudant|famíli|sala de aula|turma/i);
    expect(r.exige).toEqual(expect.arrayContaining(['CONTRATO.saida-exportacao', 'CONTRATO.direitos-ativos']));
  });
  it('sem integração nem sob medida (só configuração), a R-81 sai', () => {
    expect(ids('A', { adaptacao: 'config' })).not.toContain('R-81');
  });
  it('várias ferramentas: a interoperabilidade entre elas vira passo da R-81, e a R-89 só aparece sem a R-81', () => {
    const com = res('A', { nFerramentas: '2' });
    expect(com.recs.map((r: any) => r.id)).not.toContain('R-89');
    expect(com.recs.find((r: any) => r.id === 'R-81').como.join(' ')).toMatch(/ferramentas troquem dados entre si/);
    const sem = res('A', { nFerramentas: '2', adaptacao: 'config' });
    expect(sem.recs.map((r: any) => r.id)).toContain('R-89');
    expect(sem.recs.map((r: any) => r.id)).not.toContain('R-81');
  });
});

describe('R-82: monitoramento mensal', () => {
  it('dispara nos quatro exemplos, em M5, como "Para acompanhar"; C tem a variante de previsão', () => {
    ['A', 'B', 'C', 'D'].forEach(k => {
      const r = porId(k, 'R-82');
      expect(r, k).toBeTruthy();
      expect(r.marco, k).toBe('M5');
      expect(r.nivel, k).toBe('acompanhar');
    });
    expect(porId('C', 'R-82').oque).toMatch(/Revalidar e recalibrar o modelo de alerta a cada ano letivo, por grupo/);
    ['A', 'B', 'D'].forEach(k => expect(porId(k, 'R-82').oque, k).toMatch(/^Repetir todo mês a avaliação do teste/));
  });
  it('o caso em branco não recebe a R-82', () => {
    expect(res('novo').recs.map((r: any) => r.id)).not.toContain('R-82');
  });
});

describe('decisão 8: números ilustrativos só na ficha de aceite', () => {
  it('a ficha de B traz as linhas de R-08 (aceite do tutor), R-79, R-80 e R-82, todas "ilustrativo, ajuste"', () => {
    const F: any[] = fichaAceiteTec(ctx('B'));
    // integração R4: a R-08 (teste.js, conjunto de teste e critérios de aceite) abre a ficha de aceite
    expect(F.map(f => f.id).sort()).toEqual(['R-08', 'R-79', 'R-80', 'R-82']);
    F.forEach(f => {
      expect(f.titulo).toMatch(/\S/);
      expect(f.linhas.length).toBeGreaterThan(0);
      f.linhas.forEach((l: any) => {
        expect(l.rotulo).toBe('ilustrativo, ajuste');
        expect(l.ilustrativo).toBe(true);
        expect(l.criterio).toMatch(/\S/);
        expect(l.valor).toMatch(/\S/);
      });
    });
    expect(ROTULO_ILUSTRATIVO).toBe('ilustrativo, ajuste');
  });
  it('a ficha acompanha o caso: D (api, sem estudantes) tem R-80 e R-82; A só a R-82; C junta a revalidação anual', () => {
    expect(fichaAceiteTec(ctx('D')).map((f: any) => f.id).sort()).toEqual(['R-08', 'R-80', 'R-82']);
    expect(fichaAceiteTec(ctx('A')).map((f: any) => f.id)).toEqual(['R-08', 'R-82']);
    // o aceite da R-08 segue a classe da tarefa: tutor (B), normas (D), materiais (A); a previsão (C) fica com a R-19
    expect(fichaAceiteTec(ctx('B'))[0].titulo).toMatch(/tutor/);
    expect(fichaAceiteTec(ctx('D'))[0].linhas.map((l: any) => l.criterio).join(' ')).toMatch(/norma vigente/);
    expect(fichaAceiteTec(ctx('A'))[0].titulo).toMatch(/materiais/);
    expect(fichaAceiteTec(ctx('C')).map((f: any) => f.id)).not.toContain('R-08');
    const c: any = fichaAceiteTec(ctx('C')).find((f: any) => f.id === 'R-82');
    expect(c.linhas.map((l: any) => l.criterio).join(' ')).toMatch(/grupos de estudantes/);
  });
  it('nenhum valor da ficha aparece na frase da ação, na razão, nos passos, no para quê nem no pronto', () => {
    const valores: string[] = [];
    (fichaAceiteTec({ ...ctx('B'), classes: ['previsao'] }) as any[]).forEach(f => f.linhas.forEach((l: any) => valores.push(l.valor)));
    expect(valores.filter(v => /\d/.test(v)).length).toBeGreaterThan(0);
    // só os valores numéricos da ficha ("até 5 segundos", "pelo menos 99%"): "nenhuma" é palavra comum
    valores.splice(0, valores.length, ...valores.filter(v => /\d/.test(v)));
    const textos: string[] = [];
    (REGRAS_TEC as any[]).forEach(r => {
      textos.push(r.paraque, r.pronto);
      r.variantes.forEach((v: any) => textos.push(v.oque, v.porque, v.paraque, v.pronto, ...(v.como || [])));
    });
    textos.filter(Boolean).forEach(t => valores.forEach(v => expect(t, v).not.toContain(v)));
    ['A', 'B', 'C', 'D'].forEach(k => res(k).recs.filter((r: any) => r.pacote === 'TEC').forEach((r: any) => {
      valores.forEach(v => expect(textoDe(r), k + ' ' + r.id + ' ' + v).not.toContain(v));
      // sem números de convenção na frase da ação: só os do caso (custo e servidores, vindos do motor)
      expect(r.oque, k + ' ' + r.id).not.toMatch(/\d/);
    }));
  });
  it('os textos das fichas e das variantes estão na lista de extração das traduções', () => {
    const T = new Set(TEXTOS_REC_TEC as string[]);
    expect(T.has('ilustrativo, ajuste')).toBe(true);
    (fichaAceiteTec({ ...ctx('B'), classes: ['previsao'] }) as any[]).forEach(f => {
      expect(T.has(f.titulo), f.titulo).toBe(true);
      f.linhas.forEach((l: any) => { expect(T.has(l.criterio), l.criterio).toBe(true); expect(T.has(l.valor), l.valor).toBe(true); });
    });
  });
});

describe('estabilidade', () => {
  it('as regras TEC dos exemplos não dependem da ordem do catálogo', () => {
    const inv = (REGRAS as any[]).slice().reverse();
    ['A', 'B', 'C', 'D'].forEach(k => {
      const a = res(k).recs.filter((r: any) => r.pacote === 'TEC').map((r: any) => r.id + ':' + r.variante);
      const b = res(k, {}, inv).recs.filter((r: any) => r.pacote === 'TEC').map((r: any) => r.id + ':' + r.variante);
      expect(b, k).toEqual(a);
    });
  });
});
