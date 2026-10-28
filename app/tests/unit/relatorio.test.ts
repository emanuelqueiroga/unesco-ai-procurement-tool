// Relatório da 0.0.15-rc.1 no plano (plano/relatorio.js, pacote D): faixa P10–P90, indicadores com o nome do
// denominador, icebergs por fase, custo por fase, seis respostas, cinco ações, títulos sem códigos, caso em branco e PDF.
// Números de referência do exemplo B (design/redesign/paridade-0015/REL.md): P10 1.732.203, central 1.770.133,
// P90 1.870.698; icebergs 336.234, 416.803 e 1.017.095; custo em regime 469.534.
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { useCaso } from '../../src/store/caso';
import { numerosDe } from '../../src/store/selectors';
import { setLang, setMoeda, setTabelaMoedas, din, tr } from '../../src/domain';
import { secoesPlano, trSecao, secoesDaPagina } from '../../src/plano/secoes.js';
import { gerarPDF, pdfTxt } from '../../src/plano/pdf.js';
import { relDados, relFaixa, relIndicadores, relIcebergs, relTabelaFases, relCacheTamanho, relAcoes, R } from '../../src/plano/relatorio.js';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(AQUI, '..', '..', '..');
beforeAll(() => { setTabelaMoedas(JSON.parse(fs.readFileSync(path.join(RAIZ, 'data', 'moedas.json'), 'utf8'))); });
afterEach(() => { setLang('pt'); setMoeda({ cod: 'USD', taxa: '', taxaDe: '' }); });

function exemplo(k: string): any {
  setLang('pt');
  useCaso.getState().carregarExemplo(k);
  const e: any = useCaso.getState().estado();
  setMoeda(e.moeda);
  return e;
}
const textos = (x: any, out: string[] = []): string[] => {
  if (typeof x === 'string') out.push(x);
  else if (Array.isArray(x)) x.forEach(z => textos(z, out));
  else if (x && typeof x === 'object') Object.values(x).forEach(z => textos(z, out));
  return out;
};
const sumario = (e: any) => (secoesPlano(e) as any[]).find(s => s.id === 'resumo' && !s.sub).sumario;

describe('números do exemplo B (REL-20)', () => {
  it('faixa P10–P90, valor central e custo em regime', () => {
    const d: any = relDados(exemplo('B'));
    expect(Math.round(d.lo)).toBe(1732203);
    expect(Math.round(d.central)).toBe(1770133);
    expect(Math.round(d.hi)).toBe(1870698);
    expect(d.lo).toBeLessThanOrEqual(d.central);
    expect(d.hi).toBeGreaterThanOrEqual(d.central);
    expect(Math.round(d.anual.eco)).toBe(469534);
    expect(d.anual.ano).toBe(2);
    const f: any = relFaixa(d);
    expect(f.faixaTxt).toBe('Faixa provável (P10 a P90): US$ 1,73 mi a US$ 1,87 mi');
    expect(f.pLo).toBeLessThanOrEqual(f.pCentral);
    expect(f.pCentral).toBeLessThanOrEqual(f.pHi);
  });

  it('icebergs: acima + abaixo = custo da fase, mesma escala nas três fases', () => {
    const d: any = relDados(exemplo('B'));
    const I: any = relIcebergs(d);
    expect(I.fases.map((f: any) => f.id)).toEqual(['piloto', 'implantacao', 'expansao']);
    expect(I.fases.map((f: any) => Math.round(f.tAcima + f.tAbaixo))).toEqual([336234, 416803, 1017095]);
    I.fases.forEach((f: any) => expect(f.tAcima + f.tAbaixo).toBeCloseTo(d.av.fases.porFase[f.id].total, 6));
    const ws = I.fases.flatMap((f: any) => f.acima.concat(f.abaixo).map((x: any) => x.w));
    expect(Math.max(...ws)).toBeCloseTo(1, 9);
    expect(I.fases.map((f: any) => f.ocultoTxt)).toEqual(['94% abaixo da linha d’água', '87% abaixo da linha d’água', '89% abaixo da linha d’água']);
    expect(I.fases[0].acima.find((x: any) => x.k === 'icComp').nome).toBe('Computação e hospedagem');
  });

  it('custo por fase (MOT-03): o total das fases é o custo total', () => {
    const d: any = relDados(exemplo('B'));
    const t: any = relTabelaFases(d);
    expect(t.rows.map((r: string[]) => r[0])).toEqual(['Prova de conceito ou piloto', 'Implantação', 'Expansão', 'Total']);
    expect(t.rows[3].slice(2, 5)).toEqual(['446,7', '1.323,5', '1.770,1']);
  });

  it('a simulação roda uma vez por caso (cache): a segunda chamada não simula de novo', () => {
    const e = exemplo('B');
    const a: any = relDados(e);
    const n = relCacheTamanho();
    const t0 = Date.now();
    const b: any = relDados(e);
    expect(Date.now() - t0).toBeLessThan(250);
    expect(relCacheTamanho()).toBe(n);
    expect(b.sim).toBe(a.sim);
  });
});

describe('indicadores com o nome do denominador (decisão 3)', () => {
  it('US$ 4,97 por aprendiz com acesso e US$ 12,77 por usuário ativo, sem o mesmo número com dois nomes', () => {
    const e = exemplo('B');
    const n: any = numerosDe(e);
    const L = relIndicadores(relDados(e)) as any[];
    const por = Object.fromEntries(L.map(k => [k.id, k]));
    expect(por.aprendiz.rotulo).toBe('Por aprendiz com acesso por ano');
    expect(por.aprendiz.valor).toBe('US$ 4,97');
    expect(por.usuario.rotulo).toBe('Por usuário ativo por ano');
    expect(por.usuario.valor).toBe(din(n.porAluno, 2));
    expect(por.usuario.valor).toBe('US$ 12,77');
    // o mesmo rótulo de A2 (página "Quanto custa" e PDF)
    const a2 = (secoesPlano(e) as any[]).find(s => s.id === 'A2' && !s.sub);
    expect(a2.kv[3]).toEqual([por.usuario.rotulo, por.usuario.valor]);
    // nenhum texto do plano chama o custo por usuário de "por estudante"
    expect(textos((secoesPlano(e) as any[]).map(trSecao)).filter(t => /Por estudante por ano/.test(t))).toEqual([]);
  });
});

describe('sumário executivo (REL-03, REL-04)', () => {
  it('seis respostas tiradas do caso e dos números', () => {
    const S = sumario(exemplo('B'));
    expect(S.exec.map((x: any) => x.id)).toEqual(['oque', 'porque', 'paraque', 'como', 'entreg', 'ind']);
    const tudo = S.exec.flatMap((x: any) => x.frases).join(' ');
    expect(tudo).toContain('Contrato com 26 requisitos');
    expect(tudo).toContain('Solução em uso por 60.000 pessoas no Ano 3 (40% das que têm acesso)');
    expect(tudo).toContain('Alcance previsto: 150.000 pessoas');
  });

  it('cinco ações: Por quê dá a razão (nunca igual à origem), Quem e Quando preenchidos', () => {
    const S = sumario(exemplo('B'));
    expect(S.acoes.length).toBe(5);
    expect(S.acoes.map((a: any) => a.n)).toEqual([1, 2, 3, 4, 5]);
    S.acoes.forEach((a: any) => {
      expect(a.porque).toMatch(/\S/);
      expect(a.porque).not.toBe(a.origem);
      expect(a.quem).toMatch(/\S/);
      expect(a.quandoTxt).toMatch(/^Antes|^Para manter/);
      expect(a.como).not.toMatch(/anexo/);
    });
    const r = S.acoes.find((a: any) => a.id === 'teste-rever');
    expect(r.oque).toBe('Rever a escolha do piloto');
    expect(r.porque).toBe('Pelas respostas, uma prova de conceito deveria vir antes.');
    // sem razão no texto, a resposta que originou a ação
    expect(relAcoes([{ id: 'x', texto: 'Fazer algo.', quando: 'manter', tipo: 'custo', prioridade: 'media', porque: { n: '2.1.1', pergunta: 'P?', resposta: 'R' } }])[0].porque)
      .toBe(R('acPorqueResp', '2.1.1', 'R', 'P?'));
  });

  it('títulos-achado e "Quanto custa" sem códigos A2., A3. nem K3.3 (REL-08)', () => {
    const e = exemplo('B');
    const secs = (secoesPlano(e) as any[]).map(trSecao);
    const S = secs.find(s => s.id === 'resumo').sumario;
    expect(S.achados.custa).toBe('Os custos recorrentes são 75% do total');
    expect(S.achados.incerteza).toBe('O custo total pode ficar entre US$ 1,73 mi e US$ 1,87 mi');
    expect(S.achados.exigir).toBe('Sair do contrato custaria US$ 112,9 mil, ou 0,47 anos de custo recorrente');
    expect(S.achados.fazer).toBe('Estão confirmadas 1 de 6 condições de governança');
    const custa = secoesDaPagina(secs, 'custa').filter((s: any) => s.tipo !== 'bloco');
    const txt = textos(custa.map((s: any) => ({ h: s.h, p: s.p, list: s.list, kv: s.kv, table: s.table }))).join('\n');
    expect(txt).not.toMatch(/\bA[1-7]\.\s|\bB[1-9]\.\s|\bK[1-6]\.\d/);
    // as tabelas novas estão na página
    ['Custo por fase', 'Indicadores do custo total', 'Cenários', 'Direcionadores do custo', 'Simulação de incerteza'].forEach(h =>
      expect(custa.some((s: any) => s.h === h), h).toBe(true));
  });
});

describe('caso em branco: sem números (REL-15)', () => {
  it('sem faixa, indicadores, icebergs nem direcionadores; seis respostas dizem o que falta', () => {
    const e = exemplo('novo');
    expect(relDados(e)).toBeNull();
    const S = sumario(e);
    expect(S.numeros).toBe(false);
    expect(S.faixa).toBeNull();
    expect(S.indicadores).toEqual([]);
    expect(S.ice).toBeNull();
    expect(S.drivers).toEqual([]);
    expect(S.exec.every((x: any) => x.frases.length || /^Ainda sem resposta/.test(x.falta))).toBe(true);
    expect(S.exec.find((x: any) => x.id === 'oque').campo).toBe('tarefas');
    expect(textos(S).filter(t => /US\$/.test(t))).toEqual([]);
  });

  it('o PDF em branco não traz a faixa nem os indicadores', async () => {
    const doc: any = await gerarPDF(exemplo('novo'), { versao: '0.1.0', comprimir: false });
    const txt = doc.output() as string;
    expect(txt).not.toContain(pdfTxt('Faixa provável'));
    expect(txt).not.toContain(pdfTxt(tr('Por aprendiz com acesso por ano')));
  }, 60000);
});

describe('PDF do exemplo B', () => {
  it('mesmos números e nomes da página; icebergs com o rótulo inteiro; sem códigos', async () => {
    const doc: any = await gerarPDF(exemplo('B'), { versao: '0.1.0', comprimir: false });
    const pag: string[] = [];
    for (let i = 1; i <= doc.getNumberOfPages(); i++) pag.push(doc.internal.pages[i].join('\n'));
    const tudo = pag.join('\n');
    const tem = (s: string) => tudo.includes('(' + pdfTxt(s).replace(/[()]/g, '\\$&'));
    expect(tem('Faixa provável (P10 a P90): US$ 1,73 mi a US$ 1,87 mi')).toBe(true);
    expect(tem('US$ 469,5 mil')).toBe(true);
    expect(tem('Por usuário ativo por ano')).toBe(true);
    expect(tem('US$ 12,77')).toBe(true);
    expect(tem('US$ 4,97')).toBe(true);
    expect(tudo).not.toContain(pdfTxt('Por estudante por ano'));
    expect(tem('A proposta em seis respostas')).toBe(true);
    expect(tem('94%')).toBe(true);   // (o ’ vira o byte 0x92 do WinAnsi no arquivo)
    // "Computação e hospedagem" quebra em duas linhas, nunca "Computação…"
    expect(tudo).not.toContain(pdfTxt('Computação…'));
    expect(tem('Computação e')).toBe(true);
    expect(tudo).not.toMatch(/\((?:[^()\\]|\\.)*\bK3\.3\b/);
    // "Em resumo" (sumário executivo) cabe em até 3 páginas (REL-17): "Quanto custa" começa até a p. 5
    const pC = pag.findIndex((p, i) => i > 0 && p.includes('(' + pdfTxt(tr('Quanto custa')) + ')'));
    expect(pC).toBeLessThanOrEqual(4);
  }, 60000);
});
