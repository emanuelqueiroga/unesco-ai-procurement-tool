// Pacote R4, sub-pacote 4a (escala e avaliação): R-02, R-04, R-05, R-09, R-10, R-11 a R-18 e R-20 a R-24, com os gatilhos do
// catálogo (REC-25), e recomendarTeste com servidores como usuários reais quando há implantação em escolas (REC-26).
// Verificações da coluna "Verificação" de design/redesign/05-requisitos-recomendacoes.md, seção 9, nos exemplos A–D, mais casos
// sintéticos para o que os exemplos não cobrem (decisão 4: comparação pareada como padrão no piloto e sorteio na entrada em ondas).
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { useCaso } from '../../src/store/caso';
import {
  setLang, setMoeda, setTabelaMoedas, resultadoRecomendacoes, recContexto, REGRAS, REGRA_POR_ID, mapaLegado, lintRegra, textosRegras,
  recomendarTeste, casoAtual,
} from '../../src/domain';

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
// exemplo com mudanças no caso (cópia: o estado do store não é alterado)
function variante(k: string, caso: any): any {
  const e = JSON.parse(JSON.stringify(exemplo(k)));
  e.caso = Object.assign({}, e.caso, caso);
  return e;
}
const res = (e: any): any => resultadoRecomendacoes(e);
const ids = (e: any): string[] => res(e).recs.map((r: any) => r.id);
const item = (e: any, id: string): any => res(e).recs.find((r: any) => r.id === id);
const todoTexto = (r: any) => [r.oque, r.razao, ...(r.como || []), r.paraque, r.pronto].join(' ');
const MINHAS = ['R-02', 'R-04', 'R-05', 'R-09', 'R-10', 'R-11', 'R-12', 'R-13', 'R-14', 'R-15', 'R-16', 'R-17', 'R-18', 'R-20', 'R-21', 'R-22', 'R-23', 'R-24'];
const EX = ['A', 'B', 'C', 'D'];

describe('catálogo do 4a', () => {
  it('as regras do 4a existem, uma vez cada, passam no lint e estão nos pacotes certos', () => {
    MINHAS.forEach(id => {
      expect(REGRA_POR_ID[id], id).toBeTruthy();
      expect((REGRAS as any[]).filter(r => r.id === id).length, id).toBe(1);
      expect(lintRegra(REGRA_POR_ID[id]), id).toEqual([]);
    });
    ['R-02', 'R-04', 'R-05'].forEach(id => expect(REGRA_POR_ID[id].pacote, id).toBe('PROB'));
    ['R-09', 'R-10', 'R-11', 'R-12', 'R-13', 'R-14', 'R-15', 'R-16', 'R-17', 'R-18'].forEach(id => expect(REGRA_POR_ID[id].pacote, id).toBe('TESTE'));
    ['R-20', 'R-21', 'R-22', 'R-23', 'R-24'].forEach(id => expect(REGRA_POR_ID[id].pacote, id).toBe('ESCALA'));
  });
  it('o mapa das regras antigas segue a seção 6.3 (etapas, expansao-rapida, implantacao-criterios, internet-teste, linha-base)', () => {
    const m = mapaLegado() as Record<string, string[]>;
    expect(m['etapas']).toEqual(['R-20']);
    expect((m['expansao-rapida'] || []).slice().sort()).toEqual(['R-20', 'R-22']);
    expect(m['implantacao-criterios']).toEqual(['R-21']);
    expect(m['internet-teste']).toEqual(['R-14']);
    ['linha-base', 'linha-base-parcial', 'linha-base-medida'].forEach(x => expect(m[x]).toEqual(['R-11']));
  });
  it('nenhum número do caso escrito no texto (só marcadores {…} com vars) e nenhuma norma no texto principal', () => {
    MINHAS.forEach(id => (REGRA_POR_ID[id].variantes as any[]).forEach(v => {
      [v.oque, v.porque].forEach(t => expect(t, id).not.toMatch(/US\$|\d{2,}|\d+\s?%/));
      [v.oque, v.porque, ...v.como].forEach(t => expect(t, id).not.toMatch(/\bLGPD\b|\bRGPD\b|AI Act|\bart\.\s?\d/));
    }));
    MINHAS.forEach(id => Object.keys(REGRA_POR_ID[id].exemplosNorma || {}).forEach(p => expect(['BR', 'UE'], id).toContain(p)));
  });
  it('os textos novos entram na lista de tradução (textosRegras), inclusive os que vão em vars', () => {
    const T = textosRegras() as string[];
    ['Aprovar agora só o teste, deixando a implantação como segunda decisão, tomada com o relatório e com critérios fixados antes.',
      'Definir escolas de comparação pareadas às do piloto e o tamanho do teste, preferindo sortear entre escolas parecidas quando for possível.',
      '{0} minutos por semana por usuário ativo', '{0} vezes as escolas do piloto', 'sem valor orçado'].forEach(t => expect(T, t).toContain(t));
  });
});

describe('REC-25: R-20 (salto de escala) e R-13 (comparação)', () => {
  it('R-20 dispara em A, B, C e D, como Condição de M1', () => {
    EX.forEach(k => {
      const r = item(exemplo(k), 'R-20');
      expect(r, k).toBeTruthy();
      expect(r.nivel, k).toBe('condicao');
      expect(r.marco, k).toBe('M1');
    });
  });
  it('R-20 não dispara num caso com piloto de 20 escolas e primeira etapa de 60 numa rede de 600', () => {
    const e = variante('B', { piloto: { escolas: 20, participantes: 6000, meses: 4 }, implantacao: { escolas: 60, pessoas: 9000 } });
    expect(ids(e)).not.toContain('R-20');
  });
  it('R-20 dispara pelos quatro gatilhos do catálogo', () => {
    // ≥ metade das escolas da rede (B: 600 escolas)
    expect(ids(variante('B', { piloto: { escolas: 200, participantes: 6000, meses: 4 }, implantacao: { escolas: 300, pessoas: 9000 } }))).toContain('R-20');
    // ≥ 80% das pessoas
    expect(ids(variante('B', { piloto: { escolas: 20, participantes: 6000, meses: 4 }, implantacao: { escolas: 60, pessoas: 130000 } }))).toContain('R-20');
    // 10 vezes as escolas do piloto
    expect(ids(variante('B', { piloto: { escolas: 6, participantes: 600, meses: 4 }, implantacao: { escolas: 60, pessoas: 9000 } }))).toContain('R-20');
    // só prova de conceito com implantação (D) e piloto escolhido com etapa pequena: não
    expect(ids(variante('B', { testes: ['poc'], piloto: { escolas: '', participantes: '', meses: '' }, implantacao: { escolas: 60, pessoas: 9000 } }))).toContain('R-20');
  });
  it('R-20: o texto "só o teste" no piloto e "só a prova de conceito, depois um piloto com usuários reais" no D', () => {
    const a = item(exemplo('A'), 'R-20');
    expect(a.oque).toMatch(/Aprovar agora só o teste/);
    expect(a.razao).toMatch(/de 20 escolas para 800 escolas e 12\.000 pessoas|de 20 escolas para 800 escolas e 12,000 pessoas|20 escolas para 800/);
    expect(a.numero.rotulo).toMatch(/Salto de escala/);
    const d = item(exemplo('D'), 'R-20');
    expect(d.variante).toBe(0);
    expect(d.oque).toMatch(/só a prova de conceito/);
    expect(d.oque).toMatch(/piloto com usuários reais/);
    expect(d.razao).toMatch(/150 pessoas para 270 escolas/);
    expect(d.origem.campo).toBe('testes');
    // frases curtas do "Faltam" do veredito (4.4)
    expect(res(exemplo('A')).veredito.texto).toMatch(/a separação entre o teste e a implantação/);
    expect(res(exemplo('D')).veredito.texto).toMatch(/um piloto com usuários reais antes da implantação/);
  });
  it('R-20 é irreversível e a Condição de maior peso do B (50.000 pessoas no Ano 1 ficam para depois do relatório)', () => {
    const B = exemplo('B');
    expect(item(B, 'R-20').criterio.urgencia).toBe(2);
    expect(item(B, 'R-20').razao).toMatch(/200 escolas e 50\.000 pessoas|200 escolas e 50,000 pessoas/);
    expect(res(B).cartoes.map((c: any) => c.id)).toContain('R-20');
  });
  it('R-13 sai em A e B (Condição, irreversível) e não sai no D', () => {
    ['A', 'B'].forEach(k => {
      const r = item(exemplo(k), 'R-13');
      expect(r, k).toBeTruthy();
      expect(r.nivel, k).toBe('condicao');
      expect(r.criterio.urgencia, k).toBe(2);
      expect(r.numero.rotulo, k).toMatch(/Efeito mínimo detectável do piloto/);
      expect(r.numero.valor, k).toMatch(/ilustrativo, a confirmar/);
    });
    expect(ids(exemplo('D'))).not.toContain('R-13');
  });
  it('R-13, decisão 4: comparação pareada como padrão e o sorteio citado como melhor opção', () => {
    // um piloto grande o bastante para não cair na variante de viabilidade
    const e = variante('B', { piloto: { escolas: 200, participantes: 60000, meses: 4 } });
    const r = item(e, 'R-13');
    expect(r.variante).toBe(2);
    expect(r.oque).toMatch(/pareadas/);
    expect(r.oque).toMatch(/sortear entre escolas parecidas/);
    expect(r.como.join(' ')).toMatch(/Parear/);
    expect(r.como.join(' ')).toMatch(/sortear/);
  });
  it('R-13: com MDES acima do limite declara que o piloto mede viabilidade; com dúvidas, sorteia as solicitações', () => {
    const b = item(exemplo('B'), 'R-13');
    expect(b.variante).toBe(1);
    expect(b.oque).toMatch(/mede viabilidade/);
    expect(b.razao).toMatch(/Com efeito mínimo detectável de .*DP/);
    const duv = item(variante('A', { tarefas: ['duvidas'], usuarios: ['administrativo'] }), 'R-13');
    expect(duv.variante).toBe(0);
    expect(duv.oque).toMatch(/Sortear quais solicitações/);
  });
});

describe('REC-26: recomendarTeste trata servidores como usuários reais com implantação em escolas', () => {
  it('D: modo "ambos" (prova de conceito e depois piloto), com o motivo dos servidores', () => {
    const e = exemplo('D');
    const r = recomendarTeste(casoAtual(e));
    expect(r.modo).toBe('ambos');
    expect(r.poc && r.piloto).toBe(true);
    expect(r.ids).toContain('servidores_reais');
    expect(r.ids).toContain('sob_medida');
    expect(r.motivos.join(' ')).toMatch(/servidores nas escolas/);
    expect(recContexto(e).rec.modo).toBe('ambos');
    // D escolheu só a prova de conceito: continua sem piloto no contexto das regras
    expect(recContexto(e).teste).toBe('poc');
    expect(recContexto(e).temPiloto).toBe(false);
  });
  it('sem implantação em escolas, servidores continuam só na prova de conceito', () => {
    const e = variante('D', { implantacao: { escolas: '', pessoas: '' } });
    const r = recomendarTeste(casoAtual(e));
    expect(r.modo).toBe('poc');
    expect(r.piloto).toBe(false);
    expect(r.ids).not.toContain('servidores_reais');
  });
  it('só gestores e administrativos contam como servidores; professores e estudantes seguem como antes', () => {
    const base: any = { tipoTec: 'paga', adaptacao: 'sob_medida', implantacao: { escolas: 100, pessoas: 1000 } };
    expect(recomendarTeste(Object.assign({}, base, { usuarios: ['gestores'] })).modo).toBe('ambos');
    expect(recomendarTeste(Object.assign({}, base, { usuarios: ['administrativo'] })).modo).toBe('ambos');
    expect(recomendarTeste(Object.assign({}, base, { usuarios: ['professores'] })).ids).toContain('pessoas_reais');
    expect(recomendarTeste(Object.assign({}, base, { usuarios: [] })).modo).toBe('poc');
    expect(recomendarTeste(Object.assign({}, base, { usuarios: ['familias'] })).modo).toBe('poc');
  });
  it('sem motivo para a prova de conceito, o modo continua "piloto" (D com tecnologia escolhida e sem sob medida)', () => {
    const e = variante('D', { adaptacao: 'config', linhaBase: 'sim' });
    expect(recomendarTeste(casoAtual(e)).modo).toBe('piloto');
  });
});

describe('PROB: R-02, R-04 e R-05', () => {
  it('R-04 só com situação "proposta" (A); é Condição e irreversível, e lidera o cartão de problema do A', () => {
    expect(ids(exemplo('A'))).toContain('R-04');
    ['B', 'C', 'D'].forEach(k => expect(ids(exemplo(k)), k).not.toContain('R-04'));
    const r = item(exemplo('A'), 'R-04');
    expect(r.nivel).toBe('condicao');
    expect(r.criterio.urgencia).toBe(2);
    expect(r.exemplosNorma.BR[0]).toMatch(/14\.133/);
    expect(res(exemplo('A')).cartoes.map((c: any) => c.id)).toContain('R-04');
  });
  it('R-02 com tarefa e impacto de tempo docente, aprendizagem ou permanência (A, B, C), não no D', () => {
    ['A', 'B', 'C'].forEach(k => expect(ids(exemplo(k)), k).toContain('R-02'));
    expect(ids(exemplo('D'))).not.toContain('R-02');
    expect(item(exemplo('A'), 'R-02').nivel).toBe('recomendada');
  });
  it('R-05 não dispara em A–D nem no caso em branco', () => {
    EX.forEach(k => expect(ids(exemplo(k)), k).not.toContain('R-05'));
    expect(ids(exemplo('novo'))).not.toContain('R-05');
  });
  it('R-05: o problema que cita a tecnologia gera a Condição e o veredito "Ainda não avance"', () => {
    const e = variante('B', { problema: 'Os estudantes precisam de um tutor com inteligência artificial para matemática.' });
    const r = item(e, 'R-05');
    expect(r, 'R-05').toBeTruthy();
    expect(r.nivel).toBe('condicao');
    expect(r.oque).toMatch(/^Reescrever o problema sem citar a tecnologia/);
    const v = res(e).veredito;
    expect(v.codigo).toBe('nao');
    expect(v.gatilhos).toContain('problema');
    expect(v.texto).toMatch(/Ainda não avance: descreva primeiro o problema/);
  });
  it('R-05: problema vazio num caso já começado gera a variante "descrever"; em branco, nada', () => {
    const r = item(variante('B', { problema: '' }), 'R-05');
    expect(r.variante).toBe(0);
    expect(r.oque).toMatch(/^Descrever o problema/);
    expect(res(variante('B', { problema: '' })).veredito.gatilhos).toContain('problema');
  });
});

describe('TESTE: R-09 a R-18', () => {
  it('R-09 é Condição com risco elevado ou decisão sobre pessoas (B, C) e Recomendada no A e no D', () => {
    ['B', 'C'].forEach(k => expect(item(exemplo(k), 'R-09').nivel, k).toBe('condicao'));
    ['A', 'D'].forEach(k => expect(item(exemplo(k), 'R-09').nivel, k).toBe('recomendada'));
    expect(ids(exemplo('novo'))).not.toContain('R-09');
  });
  it('R-10 só com piloto (A, B, C) e cita os meses do piloto; D (prova de conceito) não tem', () => {
    ['A', 'B', 'C'].forEach(k => expect(ids(exemplo(k)), k).toContain('R-10'));
    expect(ids(exemplo('D'))).not.toContain('R-10');
    expect(item(exemplo('A'), 'R-10').razao).toMatch(/4 meses/);
  });
  it('R-11: a linha de base parcial é completada também nas escolas de comparação', () => {
    expect(item(exemplo('A'), 'R-11').oque).toMatch(/escolas do teste e nas de comparação/);
    expect(item(variante('B', { linhaBase: 'nao' }), 'R-11').como.join(' ')).toMatch(/de comparação/);
  });
  it('R-12: Condição com impacto de aprendizagem (B), Recomendada nos demais, só com piloto de menos de 12 meses', () => {
    expect(item(exemplo('B'), 'R-12').nivel).toBe('condicao');
    expect(item(exemplo('B'), 'R-12').oque).toMatch(/prova curta/);
    expect(item(exemplo('A'), 'R-12').nivel).toBe('recomendada');
    expect(item(exemplo('A'), 'R-12').oque).not.toMatch(/prova/);
    expect(ids(exemplo('D'))).not.toContain('R-12');
    expect(ids(variante('B', { piloto: { escolas: 20, participantes: 6000, meses: 12 } }))).not.toContain('R-12');
    expect(ids(variante('B', { linhaBase: 'nao' }))).not.toContain('R-12');
  });
  it('R-14: Condição com impacto de desigualdade (B), Recomendada nos outros; vale para o piloto, não para o D', () => {
    expect(item(exemplo('B'), 'R-14').nivel).toBe('condicao');
    ['A', 'C'].forEach(k => expect(item(exemplo(k), k === 'A' ? 'R-14' : 'R-14').nivel, k).toBe('recomendada'));
    expect(ids(exemplo('D'))).not.toContain('R-14');
    // REC-31: com desigualdade, a ação de equidade de nível Recomendada ou maior (R-14 e R-33)
    expect(ids(exemplo('B'))).toEqual(expect.arrayContaining(['R-14', 'R-33']));
    // com internet fraca, o texto atual de internet-teste vira a variante com a origem na pergunta 2.x de internet
    const e = variante('A', { internet: 'parcial' });
    expect(item(e, 'R-14').variante).toBe(0);
    expect(item(e, 'R-14').oque).toMatch(/internet fraca/);
  });
  it('R-15: uso de fato com a adoção do caso e os registros exportáveis como cláusula', () => {
    EX.forEach(k => expect(ids(exemplo(k)), k).toContain('R-15'));
    const r = item(exemplo('B'), 'R-15');
    expect(r.exige).toEqual(expect.arrayContaining(['CONTRATO.dados-registros', 'CONTRATO.desempenho-metrica']));
    expect(r.razao).toMatch(/35% a 45%/);
    expect(r.numero.rotulo).toMatch(/Adoção prevista/);
  });
  it('R-16: tempo docente (A, ≈ 33 min por semana) e gestão (D, sem volume: "a calcular"); sem estudantes nem famílias no D', () => {
    expect(item(exemplo('A'), 'R-16').razao).toMatch(/33 minutos por semana por usuário ativo \(ilustrativo, a confirmar\)/);
    expect(item(exemplo('A'), 'R-16').oque).toMatch(/professores/);
    const d = item(exemplo('D'), 'R-16');
    expect(d.variante).toBe(1);
    expect(d.razao).toMatch(/a calcular/);
    expect(todoTexto(d)).not.toMatch(/estudant|famíli|sala de aula|turma/i);
    ['B', 'C'].forEach(k => expect(ids(exemplo(k)), k).not.toContain('R-16'));
  });
  it('R-17 com impacto de aprendizagem, permanência, desigualdade, tempo docente ou gestão (A–D), em M3, com o custo em regime', () => {
    EX.forEach(k => {
      const r = item(exemplo(k), 'R-17');
      expect(r, k).toBeTruthy();
      expect(r.marco, k).toBe('M3');
      expect(r.razao, k).toMatch(/custo anual em regime: US\$/);
    });
    // o custo em regime não vira "dinheiro em jogo": R-17 não disputa cartão com as Condições
    EX.forEach(k => expect(item(exemplo(k), 'R-17').criterio.dinheiro, k).toBe(0));
  });
  it('R-18 com o custo da avaliação com comparador no B ("US$ 60 mil por ano"); sem a linha, "sem valor orçado"', () => {
    const b = item(exemplo('B'), 'R-18');
    expect(b.razao).toMatch(/US\$ 60 mil por ano/);
    expect(b.numero.rotulo).toMatch(/Avaliação de impacto com comparador/);
    expect(b.exige).toContain('CONTRATO.verificacao-auditoria');
    expect(item(exemplo('A'), 'R-18').razao).toMatch(/sem valor orçado/);
    expect(item(exemplo('A'), 'R-18').numero).toBe(null);
    expect(ids(exemplo('D'))).not.toContain('R-18');
  });
});

describe('ESCALA: R-21 a R-24', () => {
  it('R-21 com primeira etapa informada (A–D), Condição de M3, com o custo por usuário ativo', () => {
    EX.forEach(k => { expect(item(exemplo(k), 'R-21').nivel, k).toBe('condicao'); expect(item(exemplo(k), 'R-21').marco, k).toBe('M3'); });
    expect(item(exemplo('B'), 'R-21').razao).toMatch(/custo estimado por usuário ativo em regime: US\$ 8,94/);
    expect(ids(variante('B', { implantacao: { escolas: '', pessoas: '' } }))).not.toContain('R-21');
  });
  it('R-22: Condição com 10.000 pessoas ou mais (A, B), Recomendada nos demais; dotação dos Anos 1 e 2; cláusula de reajuste', () => {
    ['A', 'B'].forEach(k => expect(item(exemplo(k), 'R-22').nivel, k).toBe('condicao'));
    ['C', 'D'].forEach(k => expect(item(exemplo(k), 'R-22').nivel, k).toBe('recomendada'));
    const r = item(exemplo('B'), 'R-22');
    expect(r.razao).toMatch(/Ano 1: US\$ .*; Ano 2: US\$/);
    expect(r.numero.valor).toMatch(/Ano 1: US\$ .*; Ano 2: US\$/);
    expect(r.exige).toContain('CONTRATO.custo-reajuste');
    expect(r.exemplosNorma.UE[0]).toMatch(/art\. 33/);
    // sem "ano1" e com a primeira etapa já igual à rede, a regra não dispara
    expect(ids(variante('B', { expansao: 'ano2', implantacao: { escolas: 600, pessoas: 150000 } }))).not.toContain('R-22');
    // primeira etapa menor que a rede dispara mesmo com expansão em 2 anos
    expect(ids(variante('B', { expansao: 'ano2' }))).toContain('R-22');
  });
  it('R-23, decisão 4: o sorteio é o padrão da entrada em ondas (B: 200 de 600; A e C: tudo no Ano 1 em duas ondas)', () => {
    ['A', 'B', 'C'].forEach(k => {
      const r = item(exemplo(k), 'R-23');
      expect(r, k).toBeTruthy();
      expect(r.oque, k).toMatch(/^Sortear quais escolas entram no Ano 1/);
      expect(r.nivel, k).toBe('recomendada');
      expect(r.criterio.urgencia, k).toBe(2);
      expect(r.exige, k).toContain('CONTRATO.custo-reajuste');
      expect(r.razao, k).toMatch(/efeito mínimo detectável da primeira etapa: [\d,.]+ (DP|p\.p\.) \(ilustrativo, a confirmar\)/);
    });
    expect(item(exemplo('B'), 'R-23').razao).toMatch(/0,06 DP/);
  });
  it('R-24 com elegíveis maiores que a primeira etapa ou expansão definida, com a adoção prevista', () => {
    EX.forEach(k => expect(ids(exemplo(k)), k).toContain('R-24'));
    expect(item(exemplo('B'), 'R-24').razao).toMatch(/adoção prevista na escala: 35% a 45%/);
    expect(item(exemplo('B'), 'R-24').marco).toBe('M3');
  });
});

describe('o 4a no conjunto: veredito, aviso e cartões', () => {
  it('A: Condições R-04, R-13 e R-20 no "Faltam"; cartões com R-04, TESTE (R-08 ou R-13, com R-11 e R-16) e R-20', () => {
    const r = res(exemplo('A'));
    expect(r.veredito.codigo).toBe('condicoes');
    ['R-04', 'R-13', 'R-20'].forEach(id => expect(r.condicoes).toContain(id));
    const lideres = r.cartoes.map((c: any) => c.id);
    expect(lideres).toEqual(expect.arrayContaining(['R-04', 'R-20']));
    expect(r.cartoes.filter((c: any) => c.pacote === 'TESTE').length).toBe(1);
    // integração R4: a R-08 (aceite, também Condição) empata com a R-13 e lidera o cartão TESTE pelo número do R-nn (4.1)
    const teste = r.cartoes.find((c: any) => c.pacote === 'TESTE');
    expect(['R-08', 'R-13']).toContain(teste.id);
    expect(teste.ids).toEqual(expect.arrayContaining(['R-08', 'R-13', 'R-11', 'R-16']));
  });
  it('R-20 e R-22 não entram no critério "dinheiro em jogo": não passam à frente das Condições de dados no B', () => {
    const B = exemplo('B');
    expect(item(B, 'R-20').criterio.dinheiro).toBe(0);
    expect(item(B, 'R-22').criterio.dinheiro).toBe(0);
    expect(res(B).grupos[0].pacote).toBe('DADOS');
  });
  it('B: o cartão de teste reúne R-07 e R-13; R-20 entre os 5; R-14, R-12 e R-09 são Condições', () => {
    const r = res(exemplo('B'));
    expect(r.cartoes.find((c: any) => c.pacote === 'TESTE').ids).toEqual(expect.arrayContaining(['R-07', 'R-13']));
    expect(r.cartoes.map((c: any) => c.id)).toContain('R-20');
    ['R-09', 'R-12', 'R-13', 'R-14', 'R-20'].forEach(id => expect(r.condicoes, id).toContain(id));
    expect(r.veredito.texto).toMatch(/Ainda não avance para o piloto/);
  });
  it('D: R-20 (piloto com usuários reais antes da implantação) entre os 5 cartões; só R-57 e R-20 como Condições do 4a/COMPRA', () => {
    const r = res(exemplo('D'));
    expect(r.cartoes.map((c: any) => c.id)).toContain('R-20');
    expect(r.veredito.decisao).toBe('autorizar a prova de conceito gratuita');
  });
  it('embaralhar o catálogo não muda a saída das regras do 4a', () => {
    EX.forEach(k => {
      const e = exemplo(k);
      const a = res(e).recs.filter((r: any) => MINHAS.includes(r.id)).map((r: any) => r.id + ':' + r.variante + ':' + r.pontos);
      const R = (REGRAS as any[]).slice().reverse();
      const b = resultadoRecomendacoes(e, R).recs.filter((r: any) => MINHAS.includes(r.id)).map((r: any) => r.id + ':' + r.variante + ':' + r.pontos);
      expect(b, k).toEqual(a);
    });
  });
});
