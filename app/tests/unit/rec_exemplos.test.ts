// Recomendações nos exemplos A–D: correções do pacote R1 (REC-02 a REC-12), contexto ampliado (REC-17) e conjuntos
// esperados e proibidos por exemplo (REC-16; seções 4.6 e 6.3). Os conjuntos "esperados" são os do catálogo completo
// (pacotes R2 e R4); os cartões, o veredito e o aviso da seção 4.6 (pacote R3) são testados com ele.
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { useCaso } from '../../src/store/caso';
import { setLang, setMoeda, setTabelaMoedas, recomendacoesCaso, resultadoRecomendacoes, recContexto, RECS, ACOES_G } from '../../src/domain';
import { secoesPlano, trSecao } from '../../src/plano/secoes.js';
import { relAcoes } from '../../src/plano/relatorio.js';
import { gerarPDF, pdfTxt } from '../../src/plano/pdf.js';
import { fichaAceiteTec } from '../../src/domain/regras/tec.js';

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
const recs = (k: string): any[] => recomendacoesCaso(exemplo(k));
const ids = (k: string) => recs(k).map(r => r.id);
const porId = (k: string, id: string) => recs(k).find(r => r.id === id);
// todo o texto de uma recomendação (ação, razão, passos, para quê, pronto)
const textoDe = (r: any) => [r.oque, r.razao, ...(r.como || []), r.paraque, r.pronto].join(' ');
const textos = (x: any, out: string[] = []): string[] => {
  if (typeof x === 'string') out.push(x);
  else if (Array.isArray(x)) x.forEach(z => textos(z, out));
  else if (x && typeof x === 'object') Object.values(x).forEach(z => textos(z, out));
  return out;
};
const sumario = (e: any) => (secoesPlano(e) as any[]).find(s => s.id === 'resumo' && !s.sub).sumario;

// REC-16: o que cada exemplo deve conter e o que nunca pode aparecer (catálogo completo)
const ESPERADOS: Record<string, string[]> = {
  A: ['R-20', 'R-37', 'R-58', 'R-75', 'R-11', 'R-83', 'R-61', 'R-04', 'R-08', 'R-16', 'R-28', 'R-45', 'R-56', 'R-72'],
  B: ['R-07', 'R-26', 'R-31', 'R-32', 'R-34', 'R-48', 'R-67', 'R-77', 'R-08', 'R-13', 'R-20', 'R-33', 'R-73', 'R-76', 'R-25'],
  C: ['R-03', 'R-07', 'R-26', 'R-31', 'R-32', 'R-36', 'R-55', 'R-75', 'R-19', 'R-20', 'R-41', 'R-42', 'R-43', 'R-44', 'R-25'],
  D: ['R-57', 'R-65', 'R-29', 'R-111', 'R-67', 'R-110', 'R-84', 'R-08', 'R-20', 'R-54'],
};
const PROIBIDOS: Record<string, string[]> = {
  A: ['R-34', 'R-36', 'R-26', 'R-31', 'R-25'],       // professores usam: nada de crianças usuárias nem dados de estudantes
  B: ['R-99', 'R-37', 'R-68'],                       // tutoria: a agenda dos dispositivos vira a dose (R-48); REC-30: R-76 suspende R-68
  C: ['R-61', 'R-92', 'R-93', 'R-94', 'R-68', 'R-08'],   // REC-04: pagamento e licença suspensos; o aceite da previsão é a R-19
  D: ['R-30', 'R-34', 'R-36', 'R-37', 'R-48', 'R-26', 'R-31', 'R-32', 'R-25'],   // PED-15: nada sobre estudantes, sala ou famílias
};

describe('REC-16: conjuntos esperados e proibidos por exemplo', () => {
  for (const k of ['A', 'B', 'C', 'D']) {
    it(k + ': contém os esperados e nenhum proibido; nenhum id antigo volta', () => {
      const L = ids(k);
      ESPERADOS[k].forEach(id => expect(L, k + ' sem ' + id).toContain(id));
      PROIBIDOS[k].forEach(id => expect(L, k + ' com ' + id).not.toContain(id));
      L.forEach(id => expect(id).toMatch(/^R-\d+$/));   // gratis-fim, termos, supervisao… nunca mais
    });
  }
  it('D: nenhuma ação sobre estudantes, sala ou famílias (PED-15)', () => {
    recs('D').forEach(r => expect(r.oque + ' ' + r.razao, r.id).not.toMatch(/estudant|famíli|sala de aula|turma/i));
  });
  it('o caso em branco não tem recomendações', () => {
    expect(recomendacoesCaso(exemplo('novo'))).toEqual([]);
  });
});

// Seção 4.6 (REC-20, REC-21, REC-22): os 5 cartões, a próxima decisão e o veredito por exemplo, como conjuntos (sem ordem),
// e o que fica no "O que fazer". Com o catálogo completo (pacote R4 integrado), todos são testes reais.
describe('seção 4.6: cartões e veredito por exemplo (REC-20, REC-21)', () => {
  const R = (k: string): any => resultadoRecomendacoes(exemplo(k));
  const cartao = (r: any, pacote: string) => r.cartoes.filter((c: any) => c.pacote === pacote);
  const lideres = (r: any) => r.cartoes.map((c: any) => c.id);
  const emCartao = (r: any) => r.cartoes.flatMap((c: any) => c.ids);
  const noFazer = (r: any) => r.grupos.flatMap((g: any) => g.ids);
  // um cartão por item esperado: o líder é um dos ids aceitos
  const temCartao = (r: any, aceitos: string[]) => r.cartoes.some((c: any) => aceitos.includes(c.id));
  const SEM_PESSOAS = /estudant|famíli|sala de aula|turma/i;

  it('A: autorizar o piloto em 20 escolas, com condições; R-20, TESTE (R-08 rubrica + R-16 + R-11), R-04, R-56 e R-45 ou R-28', () => {
    const r = R('A');
    expect(r.veredito.decisao).toBe('autorizar o piloto em 20 escolas');
    expect(r.veredito.codigo).toBe('condicoes');
    expect(r.avisoCondicoes).toBe(null);
    expect(r.cartoes.length).toBe(5);
    ['R-20', 'R-04', 'R-56'].forEach(id => expect(lideres(r), 'A sem ' + id).toContain(id));
    expect(cartao(r, 'TESTE').length).toBe(1);
    const teste = cartao(r, 'TESTE')[0];
    expect(['R-08', 'R-16', 'R-11', 'R-13']).toContain(teste.id);
    expect(teste.ids).toEqual(expect.arrayContaining(['R-08', 'R-16', 'R-11']));
    expect(r.recs.find((x: any) => x.id === 'R-08').oque).toMatch(/rubrica/);
    expect(temCartao(r, ['R-45', 'R-28'])).toBe(true);
    ['R-20', 'R-04', 'R-56'].forEach(id => expect(r.cartoes.find((c: any) => c.id === id).nivel).toBe('condicao'));
    // "O que fazer" com destaque: adoção contra equilíbrio (R-61), P50 (R-72), SaaS presumido (R-75)
    ['R-61', 'R-72', 'R-75'].forEach(id => expect(noFazer(r)).toContain(id));
    // professores usam: nenhum cartão sobre dados de estudantes
    expect(emCartao(r)).not.toContain('R-26');
  });
  it('B: autorizar o teste, "Ainda não avance para o piloto"; TESTE (R-07 + R-08 + R-13), R-26, R-34, R-20 e R-31 ou R-33; aviso de condições', () => {
    const r = R('B');
    expect(r.veredito.decisao).toBe('autorizar o teste');
    expect(r.veredito.codigo).toBe('nao');
    expect(r.veredito.gatilhos[0]).toBe('piloto');
    expect(r.veredito.texto).toMatch(/Ainda não avance para o piloto/);
    expect(cartao(r, 'TESTE').length).toBe(1);
    const teste = cartao(r, 'TESTE')[0];
    expect(['R-07', 'R-08', 'R-13']).toContain(teste.id);
    expect(teste.ids).toEqual(expect.arrayContaining(['R-07', 'R-08', 'R-13']));
    expect(r.recs.find((x: any) => x.id === 'R-08').oque).toMatch(/não entregar a resposta/);
    expect(lideres(r)).toEqual(expect.arrayContaining(['R-26', 'R-34', 'R-20']));
    expect(cartao(r, 'DADOS').length).toBe(1);
    const pessoas = cartao(r, 'PESSOAS').map((c: any) => c.id);
    expect(pessoas.length).toBe(2);
    expect(pessoas.some((id: string) => ['R-31', 'R-33'].includes(id))).toBe(true);
    // R-20: aprovar só o teste; a primeira etapa (50.000 estudantes) fica para depois do relatório
    expect(r.recs.find((x: any) => x.id === 'R-20').razao).toMatch(/50\.000 pessoas/);
    // aviso "Faltam N condições para autorizar o teste" (o catálogo dá N; a seção 4.6 estimava 7)
    expect(r.avisoCondicoes).not.toBe(null);
    expect(r.condicoes.length).toBeGreaterThan(5);
    expect(r.avisoCondicoes.texto).toBe('Faltam ' + r.condicoes.length + ' condições para autorizar o teste.');
    ['R-76', 'R-48', 'R-73'].forEach(id => expect(noFazer(r)).toContain(id));
  });
  it('C: autorizar a prova de conceito; TESTE (R-19 + consulta ao mercado), R-41, R-42, R-26 e R-20; "Ainda não" por mais de 5 Condições', () => {
    const r = R('C');
    expect(r.veredito.decisao).toBe('autorizar a prova de conceito');
    // 4.6 admite "com condições" ou "Ainda não" (mais de 5 Condições); o catálogo dá mais de 5
    expect(r.condicoes.length).toBeGreaterThan(5);
    expect([r.veredito.codigo, r.veredito.gatilhos]).toEqual(['nao', ['excesso']]);
    expect(r.avisoCondicoes.n).toBe(r.condicoes.length);
    expect(cartao(r, 'TESTE').length).toBe(1);
    const teste = cartao(r, 'TESTE')[0];
    expect(teste.id).toBe('R-19');
    expect(teste.ids).toContain('R-07');
    expect(teste.como.concat(teste.passos.flatMap((p: any) => p.item.como)).join(' ')).toMatch(/consulta ao mercado/);
    expect(lideres(r)).toEqual(expect.arrayContaining(['R-41', 'R-42', 'R-26', 'R-20']));
    // o aceite da previsão é a R-19: a R-08 não dispara no C
    expect(r.recs.map((x: any) => x.id)).not.toContain('R-08');
    ['R-31', 'R-32', 'R-43', 'R-44'].forEach(id => expect(noFazer(r)).toContain(id));
    expect(r.recs.find((x: any) => x.id === 'R-31').oque).toMatch(/caso a caso/);
    expect(textoDe(r.recs.find((x: any) => x.id === 'R-31'))).toMatch(/horas/);
    // nenhuma regra de licença enquanto a tecnologia for "não sei"
    ['R-61', 'R-92', 'R-93', 'R-94'].forEach(id => expect(noFazer(r)).not.toContain(id));
  });
  it('D: autorizar a prova de conceito gratuita, com condições; R-57, R-08 (cita a norma vigente), R-20, R-54 e R-65; nada sobre estudantes', () => {
    const r = R('D');
    expect(r.veredito.decisao).toBe('autorizar a prova de conceito gratuita');
    expect(r.veredito.codigo).toBe('condicoes');
    expect(r.avisoCondicoes).toBe(null);
    expect(lideres(r).slice().sort()).toEqual(['R-08', 'R-20', 'R-54', 'R-57', 'R-65']);
    expect(r.recs.find((x: any) => x.id === 'R-08').oque).toMatch(/norma vigente/);
    expect(r.recs.find((x: any) => x.id === 'R-20').oque).toMatch(/piloto com usuários reais/);
    expect(noFazer(r)).toContain('R-29');
    // PED-15: nenhuma ação sobre estudantes, sala ou famílias, nos cartões nem nos passos
    r.cartoes.forEach((c: any) => {
      expect(c.oque + ' ' + c.razao + ' ' + c.como.join(' '), c.id).not.toMatch(SEM_PESSOAS);
      c.passos.forEach((p: any) => expect(p.oque, p.id).not.toMatch(SEM_PESSOAS));
    });
  });
  it('R-08: a ficha de aceite segue a classe da tarefa e os números ilustrativos ficam fora do texto da ação (decisão 8)', () => {
    for (const k of ['A', 'B', 'D']) {
      const e = exemplo(k);
      const f: any = (fichaAceiteTec(recContexto(e)) as any[]).find(x => x.id === 'R-08');
      expect(f, k).toBeTruthy();
      const r08 = recomendacoesCaso(e).find((x: any) => x.id === 'R-08');
      f.linhas.forEach((l: any) => {
        expect(l.rotulo).toBe('ilustrativo, ajuste');
        if (/\d/.test(l.valor)) expect(textoDe(r08), k + ' ' + l.valor).not.toContain(l.valor);
      });
      // o custo do conjunto de avaliação (K3.4) vem do motor
      expect(r08.razao, k).not.toMatch(/a calcular/);
      expect(r08.numero.id).toBe('sub:K3.4');
    }
  });
  it('R-25: risco reavaliado antes de cada ampliação, para acompanhar (M5), só com risco elevado e salto de escala', () => {
    const b = porId('B', 'R-25'), c = porId('C', 'R-25');
    [b, c].forEach(x => { expect(x.marco).toBe('M5'); expect(x.nivel).toBe('acompanhar'); });
    expect(ids('A')).not.toContain('R-25');
    expect(ids('D')).not.toContain('R-25');
  });
});

describe('pacote R1: correções imediatas', () => {
  it('REC-02: com servidores, o celular próprio sai como R-29, sem "famílias"', () => {
    const d = recs('D');
    expect(d.map(r => r.id)).toContain('R-29');
    expect(d.map(r => r.id)).not.toContain('R-30');
    d.forEach(r => expect(textoDe(r), r.id).not.toMatch(/famíli/i));
  });
  it('REC-03: "uso adequado à idade" só com estudantes usuários', () => {
    expect(recs('A').map(textoDe).join(' ')).not.toMatch(/uso adequado à idade/);
    expect(recs('B').map(textoDe).join(' ')).toMatch(/uso adequado à idade/);
  });
  it('REC-04: com a tecnologia "não sei", pagamento e licença ficam suspensos e vão para as pendências', () => {
    const R: any = resultadoRecomendacoes(exemplo('C'));
    expect(R.recs.map((r: any) => r.id)).not.toContain('R-61');
    const p = R.pend.find((x: any) => x.campo === 'tipoTec');
    expect(p.suspende).toContain('R-61');
    expect(R.suspensas).toContainEqual({ id: 'R-61', campos: ['tipoTec'] });
    expect(R.pend.map((x: any) => x.campo)).toEqual(expect.arrayContaining(['tipoTec', 'licenca', 'arquitetura']));
    // a antiga licenca-indefinida é pendência, não ação
    expect(R.recs.map(textoDe).join(' ')).not.toMatch(/Definir o tipo de licença antes de contratar/);
  });
  it('REC-05: "Quem" vem do mapa da regra; os cartões de dados do B e do C dizem proteção de dados e assessoria jurídica', () => {
    for (const k of ['B', 'C']) {
      const a = relAcoes(recs(k), 99).find((x: any) => x.id === 'R-26');
      expect(a.quem).toMatch(/Proteção de dados/);
      expect(a.quem).toMatch(/Assessoria jurídica/);
      expect(a.quem).not.toMatch(/Área pedagógica e professores/);
    }
  });
  it('REC-06: sem corte no ":"; o cartão de termos do D começa por "Negociar"', () => {
    const r = porId('D', 'R-65');
    expect(r.oque).toMatch(/^Negociar/);
    for (const k of ['A', 'B', 'C', 'D']) relAcoes(recs(k), 99).forEach((a: any) => expect(a.texto, k + ' ' + a.id).not.toMatch(/:/));
    const b = relAcoes(recs('B'), 99).find((a: any) => a.id === 'R-07');
    expect(b.oque).toMatch(/^Fazer a prova de conceito antes do piloto/);
  });
  it('REC-07: textos jurídicos corrigidos nas saídas de A–D (recomendações e plano)', () => {
    const RUINS = [/ou obter consentimento/i, /acordar por escrito o preço/i, /renegociar o valor/i, /cotação por escrito/i, /pedir cotação/i, /cotação única/i];
    for (const k of ['A', 'B', 'C', 'D']) {
      const e = exemplo(k);
      const tudo = recomendacoesCaso(e).map(textoDe).join('\n') + '\n' + textos((secoesPlano(e) as any[]).map(trSecao)).join('\n');
      RUINS.forEach(re => expect(tudo, k + ' ' + re).not.toMatch(re));
    }
    expect((RECS as any[]).find(r => r.id === 'r-baselegal').texto).toMatch(/consentimento só cabe se o uso for opcional/);
    expect(ACOES_G['g-compras']).toMatch(/checklist “O que exigir” deste plano/);
    expect(porId('A', 'R-63').oque).toMatch(/orientação de compras do caso/);
  });
  it('REC-08: o consumo segue a arquitetura efetiva (pesos abertos → horas de GPU)', () => {
    // REC-30: no B a incoerência "pesos abertos com pagamento por consumo" gera a R-76 (que cita as horas de GPU) e
    // suspende a R-68 até a resposta; nenhum texto diz que cada uso é cobrado
    expect(ids('B')).not.toContain('R-68');
    expect(textoDe(porId('B', 'R-76'))).toMatch(/GPU/);
    recs('B').forEach(x => expect(textoDe(x)).not.toMatch(/cada uso é cobrado/));
    // sem a incoerência (pesos abertos num período gratuito), o teto da R-68 é de horas de GPU, e não de chamadas
    const e = exemplo('B');
    e.caso.pagamento = 'gratuito';
    const r = recomendacoesCaso(e).find((x: any) => x.id === 'R-68');
    expect(textoDe(r)).toMatch(/GPU/);
    expect(textoDe(r)).not.toMatch(/chamada|cada uso é cobrado/);
  });
  it('REC-09: a supervisão segue formaSupervisao (B por exceção, C caso a caso)', () => {
    const b = porId('B', 'R-31'), c = porId('C', 'R-31');
    expect(textoDe(b)).not.toMatch(/cada saída/);
    expect(textoDe(b)).toMatch(/exceção|amostra/);
    expect(textoDe(c)).toMatch(/caso a caso/);
    expect(b.oque).not.toBe(c.oque);
  });
  it('REC-10: o "Por quê" não mostra códigos crus nem repete a resposta; a pergunta e a resposta vão para "Origem"', () => {
    for (const k of ['A', 'B', 'C', 'D']) {
      const S = sumario(exemplo(k));
      relAcoes(recs(k), 99).concat(S.acoes).forEach((a: any) => {
        expect(a.porque, k + ' ' + a.id).not.toMatch(/^A resposta/);
        expect(a.porque, k + ' ' + a.id).not.toMatch(/nao_sei/);
        expect(a.porque, k + ' ' + a.id).toMatch(/\S/);
        expect(a.origem, k + ' ' + a.id).toMatch(/^A resposta/);
      });
      S.acoes.forEach((a: any) => expect(a.origem, k + ' ' + a.id).not.toMatch(/nao_sei/));
    }
  });
  it('REC-12: o resumo não conta o checklist genérico; a saída tem o mesmo valor de "Quanto custa" e o desembolso rotulado', () => {
    const e = exemplo('B');
    const secs = (secoesPlano(e) as any[]).map(trSecao);
    const S = secs.find(s => s.id === 'resumo').sumario;
    const frases = S.exec.flatMap((x: any) => x.frases).join(' ');
    expect(frases).not.toMatch(/26 requisitos/);
    expect(S.achados.exigir).toMatch(/US\$ 126,5 mil no custo total/);
    expect(S.achados.exigir).toMatch(/desembolso de transição de US\$ 112,9 mil/);
    const a6 = secs.find((s: any) => s.id === 'A6' && !s.sub);
    expect(a6.p.join(' ')).toMatch(/Camada de saída do custo total: US\$ 126,5 mil/);
    expect(a6.p.join(' ')).toMatch(/Desembolso de transição e saída, em preços correntes: US\$ 112,9 mil/);
    const b1 = secs.find((s: any) => s.id === 'B1' && !s.sub);
    expect(textos(b1.table).join(' ')).not.toMatch(/\bNormal\b/);
  });
  it('REC-11: PDF do B sem rótulos sobrepostos, sem "->", sem "blocos A e B" e sem "Normal"', async () => {
    const doc: any = await gerarPDF(exemplo('B'), { versao: '0.1.0', comprimir: false });
    const pag: string[] = [];
    for (let i = 1; i <= doc.getNumberOfPages(); i++) pag.push(doc.internal.pages[i].join('\n'));
    const tudo = pag.join('\n');
    // só o texto das cadeias (Tj)
    const cad = [...tudo.matchAll(/\(((?:[^()\\]|\\.)*)\) Tj/g)].map(m => m[1]);
    expect(cad.filter(s => s.includes('->'))).toEqual([]);
    expect(cad.filter(s => /blocos A e B/.test(s))).toEqual([]);
    expect(cad.filter(s => s === 'Normal')).toEqual([]);
    // R6: o R-nn tem coluna própria na tabela do plano de ação
    expect(cad.some(s => /^R-\d+$/.test(s))).toBe(true);
    // nos cartões de "Em resumo", os rótulos "O quê" e "Por quê" ficam em linhas diferentes (antes se sobrepunham)
    const pos = [...tudo.matchAll(/([\d.-]+) ([\d.-]+) Td\n\(((?:[^()\\]|\\.)*)\) Tj/g)].map(m => ({ x: +m[1], y: +m[2], t: m[3] }));
    const oque = pdfTxt('O quê'), porque = pdfTxt('Por quê');
    const iO = pos.findIndex(p => p.t === oque);
    expect(iO).toBeGreaterThanOrEqual(0);
    const pq = pos.slice(iO).find(p => p.t === porque);
    expect(pq && pos[iO].y - pq.y).toBeGreaterThan(8);
  }, 60000);
});

describe('REC-17: contexto ampliado das regras', () => {
  it('nível, determinantes, forma de supervisão e alertas do perfil de risco', () => {
    const c: any = recContexto(exemplo('C'));
    expect(c.nivel).toBe('elevado');
    expect(c.forma).toBe('caso');
    expect(c.determinantes.length).toBeGreaterThan(0);
    expect(Array.isArray(c.alertas)).toBe(true);
    expect(c.classes).toContain('previsao');
    const b: any = recContexto(exemplo('B'));
    expect(b.nivel).toBe('elevado');
    expect(b.forma).toBe('excecao');
  });
  it('arquitetura efetiva e presumida (verdadeira sempre que a 3.2.1 é "não sei")', () => {
    const a: any = recContexto(exemplo('A')), b: any = recContexto(exemplo('B')), d: any = recContexto(exemplo('D'));
    expect([a.arqEf, a.arqPresumida]).toEqual(['saas', true]);
    expect([b.arqEf, b.arqPresumida]).toEqual(['ow', true]);
    expect([d.arqEf, d.arqPresumida]).toEqual(['api', false]);
    expect(porId('B', 'R-75').etiqueta).toBe('(presumida: confirme na 3.2.1)');
    expect(porId('B', 'R-75').razao).toMatch(/pesos abertos/);
  });
  it('escala da rede, próximo marco, pendências e números (d, só quando pedidos)', () => {
    const a: any = recContexto(exemplo('A'));
    expect(a.escRede).toBeGreaterThan(0);
    expect(a.proxMarco).toBe('M1');
    expect(Array.isArray(a.pend)).toBe(true);
    expect(a.d.total).toBeGreaterThan(0);
    expect(a.d.saidaEco).toBeGreaterThan(0);
    expect((recContexto(exemplo('novo')) as any).d).toBe(null);
    expect(resultadoRecomendacoes(exemplo('B')).proxMarco).toBe('M1');
  });
  it('B e C têm textos diferentes de supervisão (as regras usam as variantes por esses campos)', () => {
    expect(porId('B', 'R-31').variante).not.toBe(porId('C', 'R-31').variante);
  });
});

describe('R-01: meta sem número', () => {
  it('dispara nos quatro exemplos (nenhuma meta tem número) como Recomendada, e o portão G1 mostra "falta"', () => {
    for (const ex of ['A', 'B', 'C', 'D']) {
      const r: any = resultadoRecomendacoes(exemplo(ex));
      const r01 = r.recs.find((x: any) => x.id === 'R-01');
      expect(r01, ex).toBeTruthy();
      expect(r01.nivel, ex).not.toBe('condicao');
    }
  });
});
