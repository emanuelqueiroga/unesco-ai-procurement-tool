// Pacote R4, sub-pacote 4d (USO): R-45 a R-54 (REC-29; design/redesign/05-requisitos-recomendacoes.md, 6.1 e 9;
// parecer de pedagogia PED-R01 a R26). Verificação do REC-29: B cita "3 estudantes por dispositivo" (R-48, pelas
// premissas, nunca fixo); A cita as 3 h e o cenário em ciclos (R-45); D não tem R-45 na variante para professores.
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { useCaso } from '../../src/store/caso';
import { setLang, setMoeda, setTabelaMoedas, resultadoRecomendacoes, recContexto, REGRAS, textosRegras } from '../../src/domain';
import { lintRegra } from '../../src/domain/regras/lint.js';
import { REGRAS_USO, HORAS_CICLOS, HORAS_MINIMAS_CICLOS, cenarioCiclos, TEXTOS_REC_R4D } from '../../src/domain/regras/uso.js';
import { PREMISSAS_V11 } from '../../src/domain/casos.js';
import { numerosRec, numero } from '../../src/domain/rec_numeros.js';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
beforeAll(() => { setTabelaMoedas(JSON.parse(fs.readFileSync(path.join(RAIZ, 'data', 'moedas.json'), 'utf8'))); });
afterEach(() => { setLang('pt'); setMoeda({ cod: 'USD', taxa: '', taxaDe: '' }); });

/** estado do exemplo, com ajustes opcionais nas respostas (e.caso, e.ctx, e.resp) */
function exemplo(k: string, ajusta?: (e: any) => void): any {
  setLang('pt');
  useCaso.getState().carregarExemplo(k);
  const e: any = useCaso.getState().estado();
  setMoeda(e.moeda);
  if (ajusta) ajusta(e);
  return e;
}
const res = (k: string, ajusta?: (e: any) => void): any => resultadoRecomendacoes(exemplo(k, ajusta));
const rec = (k: string, id: string, ajusta?: (e: any) => void): any => res(k, ajusta).recs.find((r: any) => r.id === id);
const ids = (k: string, ajusta?: (e: any) => void): string[] => res(k, ajusta).recs.map((r: any) => r.id);
const texto = (r: any) => [r.oque, r.razao, ...(r.como || []), r.paraque, r.pronto].join(' ');
const IDS_4D = ['R-45', 'R-46', 'R-47', 'R-48', 'R-49', 'R-50', 'R-51', 'R-52', 'R-53', 'R-54'];
const regra = (id: string): any => (REGRAS as any[]).find(r => r.id === id);

describe('REC-29: catálogo do pacote 4d', () => {
  it('R-45 a R-54 existem no pacote USO, uma vez cada, e passam no lint', () => {
    IDS_4D.forEach(id => {
      const R = (REGRAS as any[]).filter(r => r.id === id);
      expect(R.length, id).toBe(1);
      expect(R[0].pacote, id).toBe('USO');
      expect(lintRegra(R[0]), id).toEqual([]);
    });
    expect((REGRAS_USO as any[]).map(r => r.id)).toEqual(expect.arrayContaining(IDS_4D));
  });
  it('quem age, marco e tipo seguem o catálogo (6.1)', () => {
    const quem: Record<string, string[]> = {
      'R-45': ['formacao'], 'R-46': ['pessoas', 'formacao'], 'R-47': ['pedagogica', 'escolas'], 'R-48': ['pedagogica', 'escolas'],
      'R-49': ['pedagogica', 'formacao'], 'R-50': ['pedagogica'], 'R-51': ['formacao'], 'R-52': ['inclusao', 'tecnologia'],
      'R-53': ['tecnologia', 'pedagogica'], 'R-54': ['pedagogica', 'juridico'],
    };
    Object.entries(quem).forEach(([id, q]) => { expect(regra(id).quem, id).toEqual(q); expect(regra(id).marco, id).toBe('M1'); });
  });
  it('as regras atuais de uso que continuam não mudaram de id (R-95, R-96, R-99, R-101 a R-104, R-107, R-108, R-112)', () => {
    ['R-95', 'R-96', 'R-99', 'R-101', 'R-102', 'R-103', 'R-104', 'R-107', 'R-108', 'R-112'].forEach(id => expect(regra(id), id).toBeTruthy());
  });
  it('as frases com marcador entram na extração das traduções', () => {
    const T = textosRegras() as string[];
    // textos de vars (tr) vão no array do pacote; os das variantes saem de textosRegras
    TEXTOS_REC_R4D.forEach(t => expect(typeof t).toBe('string'));
    expect(TEXTOS_REC_R4D).toContain('{0} estudantes por dispositivo');
    expect(T).toContain(regra('R-54').paraque);
    expect(T).toContain(regra('R-48').variantes[0].porque);
  });
});

describe('REC-29: A cita as 3 h e o cenário em ciclos (R-45)', () => {
  it('A: R-45 em ciclos, com "3 horas por pessoa" e o cenário em ciclos', () => {
    const r = rec('A', 'R-45');
    expect(r).toBeTruthy();
    expect(r.variante).toBe(1);
    expect(r.marco).toBe('M1');
    expect(r.oque).toMatch(/^Planejar a formação dos professores em ciclos/);
    expect(r.razao).toContain('3 horas por pessoa');
    expect(texto(r)).toMatch(/cenário em ciclos/);
    expect(r.como.join(' ')).toContain(HORAS_CICLOS + ' horas por pessoa');
    expect(r.como.join(' ')).toMatch(/ilustrativo, a confirmar/);
    expect(r.origem.campo).toBe('formacaoHoras');
  });
  it('o cenário não muda a estimativa central e a diferença é a de 3 h para 8 h só na linha dos professores', () => {
    const e = exemplo('A');
    const antes: any = numerosRec(e);
    const r = resultadoRecomendacoes(e).recs.find((x: any) => x.id === 'R-45');
    const depois: any = numerosRec(e);
    expect(depois.central).toBeCloseTo(antes.central, 6);
    expect(depois.total).toBeCloseTo(antes.total, 6);
    const base = numero('sub:K4.4', antes).bruto.total;      // custo do tempo de formação no custo total (A: só professores)
    const c = cenarioCiclos(antes);
    expect(c.de).toBe(3);
    expect(c.para).toBe(HORAS_CICLOS);
    expect(c.delta).toBeCloseTo(base * (HORAS_CICLOS - 3) / 3, 4);
    expect(r.numero.emJogo).toBeCloseTo(c.delta, 4);
    expect(r.numero.ilustrativo).toBe(true);
    expect(r.numero.valor).toMatch(/3 horas por pessoa → 8 horas por pessoa/);
  });
  it('B e C também têm formação em ciclos; no C, com a simulação do protocolo para o estudante sinalizado', () => {
    expect(rec('B', 'R-45').variante).toBe(1);
    expect(rec('B', 'R-45').razao).toContain('2 horas por pessoa');
    const c = rec('C', 'R-45');
    expect(c.variante).toBe(0);
    expect(c.oque).toMatch(/protocolo/);
    expect(c.razao).toContain('3 horas por pessoa');
  });
  it('A: R-45 lidera o cartão de uso (ou o de dados, R-28, no catálogo completo): está entre os 5 cartões', () => {
    const R = res('A');
    const emCartao = R.cartoes.flatMap((c: any) => c.ids);
    expect(emCartao.includes('R-45') || emCartao.includes('R-28')).toBe(true);
  });
  it('com 8 horas ou mais por pessoa, sem estimativa, não há formação em ciclos nem "confirmar horas"', () => {
    expect(ids('A', e => { e.caso.formacaoEstimativa = false; e.caso.formacaoHoras = HORAS_MINIMAS_CICLOS; })).not.toContain('R-45');
    const r = rec('A', 'R-45', e => { e.caso.formacaoEstimativa = false; e.caso.formacaoHoras = 6; });
    expect(r.razao).toContain('6 horas por pessoa');
    expect(r.variante).toBe(1);
  });
  it('o texto não traz número fixo: muda com as horas do caso', () => {
    const r = rec('A', 'R-45', e => { e.caso.formacaoEstimativa = false; e.caso.formacaoHoras = 4; });
    expect(r.razao).toContain('4 horas por pessoa');
    expect(r.razao).not.toContain('3 horas');
  });
});

describe('REC-29: D sem R-45 na variante para professores', () => {
  it('D: R-45 só na variante "confirmar as horas" (sem ciclos), no marco M3', () => {
    const r = rec('D', 'R-45');
    expect(r).toBeTruthy();
    expect(r.variante).toBe(3);
    expect(r.oque).toMatch(/^Confirmar as horas de formação/);
    expect(texto(r)).not.toMatch(/ciclos/);
    expect(r.marco).toBe('M3');
    expect(r.numero).toBe(null);
    expect(r.razao).toContain('1,5 horas por pessoa');
  });
  it('D: professores formados, mas tarefa de dúvidas (não pedagógica): continua em "confirmar as horas"', () => {
    const r = rec('D', 'R-45', e => { e.caso.formados = ['professores']; });
    expect(r.variante).toBe(3);
  });
  it('D: nenhuma regra de sala de aula, de estudantes ou de professores do pacote 4d; só R-54', () => {
    const L = ids('D');
    ['R-46', 'R-47', 'R-48', 'R-49', 'R-50', 'R-51', 'R-52', 'R-53'].forEach(id => expect(L, id).not.toContain(id));
    expect(L).toContain('R-54');
    res('D').recs.filter((r: any) => IDS_4D.includes(r.id)).forEach((r: any) => expect(texto(r), r.id).not.toMatch(/estudant|famíli|sala de aula|turma/i));
  });
});

describe('REC-29: B cita os estudantes por dispositivo (R-48)', () => {
  it('B: R-48 cita "3 estudantes por dispositivo" e não sai R-99', () => {
    const r = rec('B', 'R-48');
    expect(r).toBeTruthy();
    expect(r.razao).toContain('3 estudantes por dispositivo');
    expect(r.variante).toBe(0);
    expect(r.oque).toMatch(/dose semanal por estudante/);
    expect(ids('B')).not.toContain('R-99');
    expect(r.marco).toBe('M1');
  });
  it('o número vem das premissas (nunca fixo): muda quando a premissa muda', () => {
    const antigo = PREMISSAS_V11.estudantesPorDispositivo;
    try {
      (PREMISSAS_V11 as any).estudantesPorDispositivo = 5;
      expect(rec('B', 'R-48').razao).toContain('5 estudantes por dispositivo');
    } finally { (PREMISSAS_V11 as any).estudantesPorDispositivo = antigo; }
    expect(rec('B', 'R-48').razao).toContain(antigo + ' estudantes por dispositivo');
  });
  it('dispositivo rotativo cita os dispositivos por escola; um por estudante vai para a variante padrão', () => {
    const rot = rec('B', 'R-48', e => { e.caso.modeloDisp = 'rotativo'; });
    expect(rot.variante).toBe(1);
    expect(rot.razao).toContain(PREMISSAS_V11.dispositivosPorEscolaRotativo + ' dispositivos por escola');
    const um = rec('B', 'R-48', e => { e.caso.modeloDisp = 'um_por_aluno'; });
    expect(um.variante).toBe(2);
    expect(um.razao).not.toMatch(/por dispositivo/);
  });
  it('sem tutoria com estudantes não há R-48, e o dispositivo compartilhado fica com R-99', () => {
    expect(ids('A')).not.toContain('R-48');
    const L = ids('A', e => { e.caso.modeloDisp = 'compartilhado'; });
    expect(L).toContain('R-99');
    expect(L).not.toContain('R-48');
  });
});

describe('R-46: tempo na jornada (PN tempoJornada)', () => {
  it('sem resposta: Recomendada em A, B e C, citando o custo do tempo em formação', () => {
    for (const k of ['A', 'B', 'C']) {
      const r = rec(k, 'R-46');
      expect(r, k).toBeTruthy();
      expect(r.nivel, k).toBe('recomendada');
      expect(r.razao, k).toMatch(/US\$/);
      expect(r.exemplosNorma.BR[0]).toMatch(/11\.738/);
    }
    expect(ids('D')).not.toContain('R-46');
  });
  it('com "não", vira Condição; com "sim", sai', () => {
    expect(rec('A', 'R-46', e => { e.caso.tempoJornada = 'nao'; }).nivel).toBe('condicao');
    expect(rec('A', 'R-46', e => { e.caso.tempoJornada = 'parcial'; }).nivel).toBe('recomendada');
    expect(ids('A', e => { e.caso.tempoJornada = 'sim'; })).not.toContain('R-46');
  });
  it('sem números do caso, o marcador sai "a calcular" e não quebra', () => {
    const k = recContexto(exemplo('A'));
    expect(regra('R-46').vars(k, null)).toEqual({});
    expect(regra('R-46').numero(k, null)).toBe(null);
    expect(regra('R-45').numero(k, null)).toBe(null);
    expect(cenarioCiclos(null)).toBe(null);
  });
});

describe('R-47: referência e direção na escola (PN apoioEscola)', () => {
  it('piloto com 20 escolas e sem apoio definido: referência e direção, citando as escolas do piloto', () => {
    for (const k of ['A', 'B', 'C']) {
      const r = rec(k, 'R-47');
      expect(r, k).toBeTruthy();
      expect(r.variante, k).toBe(0);
      expect(r.oque).toMatch(/pessoa de referência/);
    }
    expect(rec('A', 'R-47').razao).toContain('20 escolas');
    expect(rec('C', 'R-47').razao).toContain('10 escolas');
    expect(rec('A', 'R-47').origem.resposta).toBe('20 escolas');
  });
  it('com referência definida na pergunta nova, só a direção; com direção formada também, sai', () => {
    expect(rec('A', 'R-47', e => { e.caso.apoioEscola = 'coordenacao'; }).variante).toBe(1);
    expect(ids('A', e => { e.caso.apoioEscola = 'coordenacao'; e.caso.formados = ['professores', 'gestores']; })).not.toContain('R-47');
  });
  it('piloto com menos de 5 escolas: só a direção', () => {
    expect(rec('A', 'R-47', e => { e.caso.piloto.escolas = 4; }).variante).toBe(1);
  });
  it('só prova de conceito, sem professores nem estudantes: não sai', () => {
    expect(ids('D')).not.toContain('R-47');
  });
});

describe('R-49 e R-50: relatórios do tutor e orientação de uso da IA', () => {
  it('R-49 só com estudantes e tutoria, correção ou retorno', () => {
    const r = rec('B', 'R-49');
    expect(r).toBeTruthy();
    expect(r.oque).toMatch(/painel por turma/);
    ['A', 'C', 'D'].forEach(k => expect(ids(k), k).not.toContain('R-49'));
  });
  it('R-50: "não" ou "em parte" na 1.3.5 com professores ou estudantes usando; "em parte" leva o "O que falta?"', () => {
    ['A', 'B', 'C'].forEach(k => expect(ids(k), k).toContain('R-50'));
    expect(ids('D')).not.toContain('R-50');
    expect(ids('A', e => { e.resp['g-etica'] = 'sim'; })).not.toContain('R-50');
    const r = rec('A', 'R-50', e => { e.resp['g-etica'] = 'parcial'; e.respDet = { 'g-etica': { falta: 'a parte dos estudantes.' } }; });
    expect(r.como.join(' ')).toContain('O que falta: a parte dos estudantes');
    expect(r.origem.campo).toBe('g-etica');
  });
});

describe('R-51: comunidade de prática e formadores da expansão', () => {
  it('piloto de 20 escolas e expansão de 800: reunir, multiplicadores e formadores (M1), citando a implantação', () => {
    const r = rec('A', 'R-51');
    expect(r.variante).toBe(0);
    expect(r.marco).toBe('M1');
    expect(r.razao).toContain('800 escolas');
    expect(r.oque).toMatch(/multiplicadores/);
    expect(r.oque).toMatch(/formadores da expansão/);
  });
  it('expansão menor que 100 escolas: só a comunidade de prática', () => {
    const r = rec('A', 'R-51', e => { e.caso.implantacao.escolas = 50; });
    expect(r.variante).toBe(1);
    expect(r.marco).toBe('M1');
    expect(r.oque).not.toMatch(/formadores da expansão/);
  });
  it('piloto com menos de 5 escolas e expansão grande: dimensionar os formadores antes de assinar (M4)', () => {
    const r = rec('A', 'R-51', e => { e.caso.piloto.escolas = 3; });
    expect(r.variante).toBe(2);
    expect(r.marco).toBe('M4');
  });
  it('D (só servidores usam, sem piloto): não sai', () => {
    expect(ids('D')).not.toContain('R-51');
  });
});

describe('R-52 e R-53: acessibilidade, línguas e conexão fraca', () => {
  it('R-52 sai com impacto de inclusão, problema C8, subproblema C4b ou público com deficiência ou outra língua; só no A entre os exemplos', () => {
    // integração R4: com k.subs exposto, o A (subproblema C4b, adaptação para estudantes com dificuldades) passa a ter a R-52
    expect(ids('A'), 'A').toContain('R-52');
    ['B', 'C', 'D'].forEach(k => expect(ids(k), k).not.toContain('R-52'));
    // sem o C4b, cada gatilho sozinho
    expect(ids('A', e => { e.ctx.subs = ['C4a']; })).not.toContain('R-52');
    expect(ids('A', e => { e.ctx.subs = ['C4a']; e.caso.impactos = ['inclusao']; })).toContain('R-52');
    expect(ids('A', e => { e.ctx.subs = []; e.ctx.problemas = ['C8']; })).toContain('R-52');
    expect(ids('A', e => { e.ctx.subs = ['C4a']; e.caso.publico = ['deficiencia']; })).toContain('R-52');
    expect(ids('A', e => { e.ctx.subs = ['C4a']; e.caso.publico = ['lingua']; })).toContain('R-52');
  });
  it('R-52 com o subproblema C4b (k.subs) e sem os outros gatilhos', () => {
    const se = regra('R-52').se;
    const base = { impactos: [], probs: [], arr: () => [] };
    expect(se({ ...base, subs: ['C4b'] })).toBe(true);
    expect(se({ ...base, subs: ['C4a'] })).toBe(false);
    expect(se({ ...base })).toBe(false);
  });
  it('R-52 exige requisitos no termo de referência e trata grupos (equidade)', () => {
    const r = rec('A', 'R-52', e => { e.caso.impactos = ['inclusao']; });
    expect(r.exige).toEqual(['CONTRATO.escopo-requisitos']);
    expect(regra('R-52').grupos).toBe(true);
    expect(r.quem).toEqual(['inclusao', 'tecnologia']);
  });
  it('R-53 sai com internet parcial ou não, ou público rural; não nos exemplos A–D (internet adequada)', () => {
    ['A', 'B', 'C', 'D'].forEach(k => expect(ids(k), k).not.toContain('R-53'));
    const p = rec('A', 'R-53', e => { e.caso.internet = 'parcial'; });
    expect(p.origem.campo).toBe('internet');
    expect(ids('A', e => { e.caso.internet = 'nao'; })).toContain('R-53');
    const r = rec('A', 'R-53', e => { e.caso.publico = ['rural']; });
    expect(r.origem.campo).toBe('publico');
    expect(r.oque).toMatch(/banda por sessão/);
  });
});

describe('R-54: curadoria da base de normas', () => {
  it('D (tarefa de dúvidas): sai, com o custo da curadoria e ligada à origem', () => {
    const r = rec('D', 'R-54');
    expect(r).toBeTruthy();
    expect(r.razao).toMatch(/curadoria da base pesa US\$/);
    expect(r.numero.id).toBe('sub:K4.1');
    expect(r.numero.emJogo).toBeGreaterThan(0);
    expect(r.quem).toEqual(['pedagogica', 'juridico']);
    expect(r.origem.campo).toBe('tarefas');
  });
  it('D: R-54 fica no "O que fazer", no grupo do pacote USO, e lidera o cartão-pacote de uso do M1 (se ele entrar nos 5)', () => {
    const R = res('D');
    const g = R.grupos.find((x: any) => x.pacote === 'USO');
    expect(g).toBeTruthy();
    expect(g.ids).toContain('R-54');
    R.cartoes.filter((c: any) => c.pacote === 'USO' && c.marco === 'M1').forEach((c: any) => expect(c.id).toBe('R-54'));
  });
  it('A, B e C não têm R-54', () => {
    ['A', 'B', 'C'].forEach(k => expect(ids(k), k).not.toContain('R-54'));
  });
});

describe('textos do pacote 4d', () => {
  it('sem "bloqueio", sem normas no texto principal e sem citação; formato do lint nos exemplos A–D', () => {
    ['A', 'B', 'C', 'D'].forEach(k => res(k).recs.filter((r: any) => IDS_4D.includes(r.id)).forEach((r: any) => {
      expect(texto(r), k + ' ' + r.id).not.toMatch(/bloqueio|\bLei\b|LGPD|art\. ?\d/i);
      expect(r.como.length).toBeGreaterThanOrEqual(2);
      expect(r.como.length).toBeLessThanOrEqual(4);
      expect(r.pronto).toMatch(/\S/);
      expect(r.semNumero, k + ' ' + r.id).toBe(false);
    }));
  });
  it('as regras do pacote não dependem da ordem no catálogo (R-48 troca a variante pelo modelo de dispositivo, não pela posição)', () => {
    const a = res('B').recs.filter((r: any) => IDS_4D.includes(r.id)).map((r: any) => [r.id, r.variante, r.pontos]);
    const b = resultadoRecomendacoes(exemplo('B'), (REGRAS as any[]).slice().reverse()).recs.filter((r: any) => IDS_4D.includes(r.id)).map((r: any) => [r.id, r.variante, r.pontos]);
    expect(b).toEqual(a);
  });
});
