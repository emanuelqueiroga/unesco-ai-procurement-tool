// Pacote R8 (REC-52): as perguntas da seção 7 de design/redesign/05-requisitos-recomendacoes.md no Refinar (13 perguntas e 3 opções
// novas em perguntas que já existem), com "Quem costuma saber"; sem resposta, "não informado" e a regra na variante "Decidir…";
// o Essencial continua com 25 telas. Responder muda o resultado das regras (R-32, R-46, R-47, R-52, R-53, R-55, R-56, R-73) e do
// motor onde a seção 7 e a 8 (E7) preveem (contestação, treino, verificação, público, revisão dos alertas).
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useCaso } from '../../src/store/caso';
import {
  ESSENCIAL, CAMPOS_ESSENCIAIS, CAMPOS_REC, CAMPOS_REC_TODOS, REC_DAS_PERGUNTAS_REC, afetadosPor, capituloDoCampo, migrar, estadoInicial,
  normalizarRespostasRec, derivarOrigem,
} from '../../src/store';
import { camposRefinar, numerosDe, respondido } from '../../src/store/selectors';
import { lacunasDe } from '../../src/percurso/painel';
import { ControleCampo, TIPOS_SIMPLES } from '../../src/percurso/Controles';
import { alternarOpcao } from '../../src/percurso/refinar';
import {
  faixaEditada, faixaDe, custoEfeitoDe, errosDaFaixa, faixaCompleta, volumeDe, volumeEditado, avisoVolume, revisaoDe, revisaoEditada, errosDaRevisao,
  revisaoCompleta, revisaoIncompleta, TEXTOS_REC_R8,
} from '../../src/percurso/refinar_rec';
import {
  CAMPOS, CAMPO_POR_ID, CASO_VAZIO, OPC, casoAtual, perfil, resultadoRecomendacoes, quemSabe, dicaDoCampo, ajudaTextos, glossarioMarcas, GLOSSARIO,
  alertas, perfilFinal, CAMPOS_CUSTO, setLang, setMoeda, setTabelaMoedas, limiar, numerosRec, avaliabilidade, clone,
  OPC_PUBLICO, OPC_CONTESTACAO_EXISTE, OPC_TREINO, OPC_VERIFICACAO, OPC_INSTRUMENTO_TESTE, OPC_ESTRATEGIA_COMPRA, OPC_DOTACAO, OPC_TEMPO_JORNADA, OPC_MOMENTO_USO,
  OPC_APOIO_ESCOLA, OPC_UNIDADE_RESULTADO,
} from '../../src/domain';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const FIX = path.join(RAIZ, 'tests', 'fixtures');
beforeAll(() => { setTabelaMoedas(JSON.parse(fs.readFileSync(path.join(RAIZ, 'data', 'moedas.json'), 'utf8'))); });
afterEach(() => { setLang('pt'); setMoeda({ cod: 'USD', taxa: '', taxaDe: '' }); });

const S = () => useCaso.getState();
beforeEach(() => { setLang('pt'); S().carregarExemplo('novo'); });
/** carrega o exemplo, responde no modo Refinar (origem "refinado") e devolve o estado */
function com(exemplo: string, respostas: Record<string, any> = {}): any {
  S().carregarExemplo(exemplo);
  S().setModo('refinar');
  Object.entries(respostas).forEach(([c, v]) => S().refinar(c, v));
  return S().estado();
}
const res = (e: any): any => resultadoRecomendacoes(e);
const rec = (e: any, id: string): any => res(e).recs.find((r: any) => r.id === id);
const ids = (e: any): string[] => res(e).recs.map((r: any) => r.id);
const custoTotal = (e: any): number => numerosDe(e).av.ctEco as number;

const POR_CAPITULO: Record<number, string[]> = {
  1: ['publico', 'altCustoEfeito', 'volumeResultado'],
  2: ['instrumentoTeste', 'contestacaoExiste', 'momentoUso', 'treino', 'tempoJornada', 'apoioEscola', 'revisao'],
  3: ['estrategiaCompra', 'dotacao', 'verificacao'],
};
const TODAS = [1, 2, 3].flatMap(c => POR_CAPITULO[c]);

describe('REC-52: as 13 perguntas existem, fora do Essencial, numeradas no capítulo certo', () => {
  it('o Essencial continua com exatamente 25 telas, e nenhuma pergunta nova está nele', () => {
    expect(ESSENCIAL.length).toBe(25);
    TODAS.forEach(c => expect(CAMPOS_ESSENCIAIS, c).not.toContain(c));
  });
  it('são 13, todas em CAMPOS, marcadas `opcional`, do caso, com tipo que o Refinar sabe desenhar', () => {
    expect(TODAS.length).toBe(13);
    expect(CAMPOS_REC_TODOS).toEqual(TODAS);
    TODAS.forEach(c => {
      const f: any = (CAMPO_POR_ID as any)[c];
      expect(f, c).toBeTruthy();
      expect(f.opcional, c).toBe(true);
      expect(f.onde, c).toBe('caso');
      expect(TIPOS_SIMPLES, c).toContain(f.tipo);
      expect(typeof f.t, c).toBe('string');
      expect(f.t.endsWith('?'), c).toBe(true);
    });
  });
  it('cada uma está numerada no seu capítulo, com número único, e o mapa de capítulos de perguntas.ts confere', () => {
    const ns = TODAS.map(c => (CAMPO_POR_ID as any)[c].n as string);
    expect(new Set(ns).size).toBe(13);
    expect(new Set((CAMPOS as any[]).map(f => f.n)).size).toBe((CAMPOS as any[]).length);   // sem número repetido em CAMPOS
    [1, 2, 3].forEach(cap => POR_CAPITULO[cap].forEach(c => {
      const f: any = (CAMPO_POR_ID as any)[c];
      expect(f.n.startsWith(cap + '.'), c + ' ' + f.n).toBe(true);
      expect(String(f.passo).startsWith(String(cap)), c).toBe(true);
      expect(capituloDoCampo(c), c).toBe(cap);
    }));
    expect(CAMPOS_REC[1]).toEqual(POR_CAPITULO[1]);
    expect(CAMPOS_REC[2]).toEqual(POR_CAPITULO[2]);
    expect(CAMPOS_REC[3]).toEqual(POR_CAPITULO[3]);
    expect(CAMPOS_REC[4]).toEqual([]);
  });
  it('têm "Quem costuma saber" e uma explicação curta (dica, até 170 caracteres, só com marcas do glossário)', () => {
    const marcasValidas = new Set((GLOSSARIO as any[]).map(g => g.id));
    TODAS.forEach(c => {
      const f: any = (CAMPO_POR_ID as any)[c];
      expect(quemSabe(f.n), c + ' quem').toBeTruthy();
      const d = dicaDoCampo(c);
      expect(d, c + ' dica').toBeTruthy();
      expect(String(d).length, c + ' tamanho').toBeLessThanOrEqual(170);
      glossarioMarcas(String(d)).forEach((m: string) => expect(marcasValidas.has(m), c + ' ' + m).toBe(true));
    });
    // os textos novos de ajuda entram na lista que as traduções leem
    const tx = ajudaTextos();
    TODAS.forEach(c => expect(tx, c).toContain(dicaDoCampo(c)));
  });
});

describe('REC-52: cada pergunta aparece no Refinar do seu capítulo e desenha o controle', () => {
  const eRefinar = () => { S().carregarExemplo('B'); S().setModo('refinar'); return S().estado(); };
  it('camposRefinar(capítulo) traz as perguntas do capítulo; a de alertas só com a tarefa de alerta precoce', () => {
    [1, 2, 3].forEach(cap => POR_CAPITULO[cap].forEach(c => expect(camposRefinar(cap as any), c).toContain(c)));
    expect(camposRefinar(4 as any)).not.toEqual(expect.arrayContaining(TODAS));
    const f: any = (CAMPO_POR_ID as any).revisao;
    expect(f.se({ tarefas: ['planos_aula'] })).toBe(false);
    expect(f.se({ tarefas: [] })).toBe(false);
    expect(f.se({ tarefas: ['alerta_precoce'] })).toBe(true);
    // as demais não têm condição: aparecem sempre
    TODAS.filter(c => c !== 'revisao').forEach(c => expect((CAMPO_POR_ID as any)[c].se, c).toBeUndefined());
  });
  it('o controle de cada uma monta sem erro e mostra a pergunta e as opções (renderToString)', () => {
    const e: any = eRefinar();
    const listas: Record<string, any[]> = {
      publico: OPC_PUBLICO, contestacaoExiste: OPC_CONTESTACAO_EXISTE, treino: OPC_TREINO, verificacao: OPC_VERIFICACAO, instrumentoTeste: OPC_INSTRUMENTO_TESTE,
      estrategiaCompra: OPC_ESTRATEGIA_COMPRA, dotacao: OPC_DOTACAO, tempoJornada: OPC_TEMPO_JORNADA, momentoUso: OPC_MOMENTO_USO, apoioEscola: OPC_APOIO_ESCOLA,
    };
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
    Object.entries(listas).forEach(([c, L]) => {
      const html = renderToString(createElement(ControleCampo, { e, campo: c }));
      expect(html, c).toContain(esc((CAMPO_POR_ID as any)[c].t));
      L.forEach(o => expect(html, c + ' ' + o[0]).toContain(esc(String(o[1]))));
      // cartões de seleção (radio) trazem um <input> por opção; os chips do público, um botão por opção
      expect((html.match(c === 'publico' ? /<button/g : /<input/g) || []).length, c).toBe(L.length);
    });
    const faixa = renderToString(createElement(ControleCampo, { e, campo: 'altCustoEfeito' }));
    ['Custo por pessoa por ano, em US$', 'Efeito esperado, em desvios-padrão', 'Mínimo', 'Mais provável', 'Máximo'].forEach(x => expect(faixa, x).toContain(x));
    expect((faixa.match(/<input/g) || []).length).toBe(6);
    const vol = renderToString(createElement(ControleCampo, { e, campo: 'volumeResultado' }));
    ['Unidade do resultado', 'Volume esperado', 'Período do volume', 'Solicitações respondidas', 'Estudantes atendidos', 'Por mês', 'Por ano'].forEach(x => expect(vol, x).toContain(x));
    const rev = renderToString(createElement(ControleCampo, { e, campo: 'revisao' }));
    ['Estudantes sinalizados por mês, em % dos alcançados', 'Minutos para revisar cada alerta'].forEach(x => expect(rev, x).toContain(x));
    // todo campo tem rótulo (label for=id): nenhum <input> sem rótulo
    [faixa, vol, rev].forEach(h => expect((h.match(/<label/g) || []).length).toBeGreaterThanOrEqual((h.match(/<input/g) || []).length));
  });
  it('"nenhum" e "não sei" do público não se combinam com os grupos (alternarOpcao)', () => {
    const ordem = OPC_PUBLICO.map(o => o[0]);
    let v = alternarOpcao('publico', [], ordem, 'rural', true);
    v = alternarOpcao('publico', v, ordem, 'deficiencia', true);
    expect(v).toEqual(['rural', 'deficiencia']);
    expect(alternarOpcao('publico', v, ordem, 'nenhum', true)).toEqual(['nenhum']);
    expect(alternarOpcao('publico', ['nenhum'], ordem, 'lingua', true)).toEqual(['lingua']);
    expect(alternarOpcao('publico', ['nao_sei'], ordem, 'rural', true)).toEqual(['rural']);
    expect(alternarOpcao('publico', v, ordem, 'nao_sei', true)).toEqual(['nao_sei']);
    expect(alternarOpcao('publico', ['nenhum'], ordem, 'nao_sei', true)).toEqual(['nao_sei']);
    // a regra antiga da 2.2.3 continua igual
    expect(alternarOpcao('consequencias', ['nota'], ['nota', 'nenhuma'], 'nenhuma', true)).toEqual(['nenhuma']);
  });
});

describe('REC-52: sem resposta, "não informado" (a regra usa a variante "Decidir…")', () => {
  it('caso em branco: nenhuma delas respondida, valores neutros e nunca lacuna', () => {
    const e: any = S().estado();
    TODAS.forEach(c => {
      expect(respondido(e, c), c).toBe(false);
      expect(e.origem[c] || 'padrao', c).toBe('padrao');
      expect(lacunasDe(e).itens.map((x: any) => x.campo), c).not.toContain(c);
    });
    expect(e.caso.publico).toEqual([]);
    ['contestacaoExiste', 'treino', 'verificacao', 'instrumentoTeste', 'estrategiaCompra', 'dotacao', 'tempoJornada', 'apoioEscola', 'momentoUso']
      .forEach(c => expect(e.caso[c], c).toBe(''));
    expect(e.caso.revisao).toEqual({ taxaAlerta: '', minutos: '' });
    expect(e.caso.volumeResultado.volume).toBe('');
    expect(faixaCompleta(e.caso.altCustoEfeito)).toBe(false);
  });
  it('responder no Refinar grava com origem "refinado" e marca a pergunta como respondida', () => {
    const e: any = com('B', { dotacao: 'sim', publico: ['rural'], revisao: { taxaAlerta: 3, minutos: 10 } });
    ['dotacao', 'publico', 'revisao'].forEach(c => { expect(e.origem[c], c).toBe('refinado'); expect(respondido(e, c), c).toBe(true); });
    expect(e.respC.dotacao).toBe(true);
  });
  it('nos exemplos A a D, sem respostas, os números do R7 não mudam (nada das perguntas novas entra na conta)', () => {
    const esperado: Record<string, number> = { A: 4759846, B: 1827133, C: 1655396, D: 630407 };
    Object.entries(esperado).forEach(([k, v]) => expect(Math.round(custoTotal(com(k))), k).toBe(v));
  });
});

describe('REC-52: responder muda o resultado das regras', () => {
  it('contestacaoExiste = "nao": R-32 vira Condição e o veredito "Ainda não avance" cita a contestação (B e C)', () => {
    ['B', 'C'].forEach(k => {
      const antes = com(k);
      expect(rec(antes, 'R-32').nivel, k).toBe('recomendada');
      expect(res(antes).veredito.gatilhos, k).not.toContain('contestacao');
      const depois = com(k, { contestacaoExiste: 'nao' });
      expect(rec(depois, 'R-32').nivel, k).toBe('condicao');
      expect(rec(depois, 'R-32').condicao, k).toBe(true);
      expect(res(depois).veredito.codigo, k).toBe('nao');
      expect(res(depois).veredito.gatilhos, k).toContain('contestacao');
      expect(res(depois).condicoes, k).toContain('R-32');
      ['efetiva', 'formal', 'nao_sei'].forEach(v => {
        const x = com(k, { contestacaoExiste: v });
        expect(rec(x, 'R-32').nivel, k + ' ' + v).toBe('recomendada');
        expect(res(x).veredito.gatilhos, k + ' ' + v).not.toContain('contestacao');
      });
    });
  });
  it('contestacaoExiste troca a premissa "formal" do risco (E7): "não" sobe, "efetiva" desce; "não sei" mantém', () => {
    const nivel = (e: any, d = 'contestacao') => (perfil as any)(e).P[d];
    const base = nivel(com('C'));
    expect(base).toBe('moderado');
    expect(nivel(com('C', { contestacaoExiste: 'nao' }))).toBe('critico');
    expect(nivel(com('C', { contestacaoExiste: 'efetiva' }))).toBe('limitado');
    expect(nivel(com('C', { contestacaoExiste: 'nao_sei' }))).toBe(base);
    expect(casoAtual(com('C')).contestacao).toBe('formal');
    expect(casoAtual(com('C', { contestacaoExiste: 'nao' })).contestacao).toBe('nao');
    // sem decisão sobre pessoas, a premissa continua "não se aplica"
    expect(casoAtual(com('D', { contestacaoExiste: 'nao' })).contestacao).toBe('na');
  });
  it('verificacao = "nao" muda o risco do D (opacidade) e o custo total; "sim" o devolve ao nível limitado', () => {
    const d0 = com('D'), dn = com('D', { verificacao: 'nao' }), ds = com('D', { verificacao: 'sim' }), dp = com('D', { verificacao: 'parcial' });
    expect((perfil as any)(d0).P.opacidade).toBe('moderado');
    expect((perfil as any)(dn).P.opacidade).toBe('elevado');
    expect((perfil as any)(ds).P.opacidade).toBe('limitado');
    expect((perfil as any)(dp).P.opacidade).toBe('moderado');
    expect((perfil as any)(d0).agregado).toBe('moderado');
    expect((perfil as any)(dn).agregado).toBe('elevado');
    expect((perfil as any)(ds).agregado).toBe('limitado');
    expect(casoAtual(dn).verificabilidade).toBe('nao');
    expect(custoTotal(dn)).toBeGreaterThan(custoTotal(d0));
    expect(custoTotal(ds)).toBeLessThan(custoTotal(d0));
    expect(custoTotal(dp)).toBe(custoTotal(d0));
    // A, B e C: "sim" e "não" mexem no nível só onde a dimensão pesa (A sobe; B e C já são elevados)
    expect((perfil as any)(com('A', { verificacao: 'nao' })).agregado).toBe('elevado');
  });
  it('treino troca a premissa "não sei": "sim" gera o alerta de bloqueio e "não" tira a atenção', () => {
    const ce0 = casoAtual(com('B')), ces = casoAtual(com('B', { treino: 'sim' })), cen = casoAtual(com('B', { treino: 'nao' }));
    expect([ce0.treino, ces.treino, cen.treino]).toEqual(['nao_sei', 'sim', 'nao']);
    const al = (ce: any) => (alertas as any)(ce, perfilFinal(ce)).map((a: any) => a.texto);
    expect(al(ce0).some((x: string) => /Não se sabe se os dados serão usados para treinamento/.test(x))).toBe(true);
    expect(al(ces).some((x: string) => /Os dados podem ser usados pelo fornecedor para treinar/.test(x))).toBe(true);
    expect(al(cen).some((x: string) => /treinamento|treinar/.test(x))).toBe(false);
  });
  it('publico alimenta vulneráveis e idiomas; R-52 e R-53 disparam com os ids deficiencia, lingua e rural', () => {
    expect(casoAtual(com('A')).vulneraveis).toBe(false);
    expect(casoAtual(com('A', { publico: ['deficiencia'] })).vulneraveis).toBe(true);
    expect(casoAtual(com('A', { publico: ['acolhimento'] })).vulneraveis).toBe(true);
    expect(casoAtual(com('A', { publico: ['rural', 'tradicionais'] })).vulneraveis).toBe(false);
    expect(casoAtual(com('A', { publico: ['lingua'] })).idiomas).toBe(true);
    expect((perfil as any)(com('A', { publico: ['deficiencia'] })).P.pessoas).toBe('elevado');
    // B não tem R-52 sem a resposta (o impacto de inclusão e as subcategorias de acessibilidade também a disparam, como no A)
    expect(ids(com('B'))).not.toContain('R-52');
    expect(ids(com('B', { publico: ['deficiencia'] }))).toContain('R-52');
    expect(ids(com('B', { publico: ['lingua'] }))).toContain('R-52');
    expect(rec(com('B', { publico: ['lingua'] }), 'R-52').origem.campo).toBe('publico');
    expect(ids(com('B', { publico: ['rural'] }))).not.toContain('R-52');
    expect(ids(com('B', { publico: ['nenhum'] }))).not.toContain('R-52');
    expect(ids(com('A'))).not.toContain('R-53');
    const r53 = rec(com('A', { publico: ['rural'] }), 'R-53');
    expect(r53).toBeTruthy();
    expect(r53.origem.campo).toBe('publico');
    expect(ids(com('A', { publico: ['nao_sei'] }))).not.toContain('R-53');
  });
  it('dotacao: "sim" deixa R-73 como Recomendada; "não", "em parte" e "não sei" a tornam Condição', () => {
    expect(rec(com('A', { dotacao: 'sim' }), 'R-73').nivel).toBe('recomendada');
    ['nao', 'parcial', 'nao_sei'].forEach(v => expect(rec(com('A', { dotacao: v }), 'R-73').nivel, v).toBe('condicao'));
    expect(rec(com('A'), 'R-73').nivel).toBe('recomendada');
  });
  it('tempoJornada: "sim" tira R-46; "em parte" a mantém Recomendada; "não" a torna Condição', () => {
    expect(ids(com('A'))).toContain('R-46');
    expect(ids(com('A', { tempoJornada: 'sim' }))).not.toContain('R-46');
    expect(rec(com('A', { tempoJornada: 'parcial' }), 'R-46').nivel).toBe('recomendada');
    expect(rec(com('A', { tempoJornada: 'nao' }), 'R-46').nivel).toBe('condicao');
  });
  it('apoioEscola: sem resposta ou "ninguém definido", R-47 pede a referência; com coordenação, muda de variante', () => {
    const antes = rec(com('A'), 'R-47');
    expect(antes).toBeTruthy();
    expect(rec(com('A', { apoioEscola: 'ninguem' }), 'R-47').variante).toBe(antes.variante);
    expect(rec(com('A', { apoioEscola: 'nao_sei' }), 'R-47').variante).toBe(antes.variante);
    expect(rec(com('A', { apoioEscola: 'coordenacao' }), 'R-47').variante).toBe(1);
  });
  it('estrategiaCompra e instrumentoTeste: "não sei" dispara R-55 e R-56; uma escolha firme tira R-55', () => {
    expect(ids(com('A'))).not.toContain('R-55');
    expect(ids(com('A', { estrategiaCompra: 'nao_sei' }))).toContain('R-55');
    expect(ids(com('A', { estrategiaCompra: 'licitacao' }))).not.toContain('R-55');
    expect(rec(com('A', { estrategiaCompra: 'nao_sei' }), 'R-55').origem.campo).toBe('estrategiaCompra');
    const sem = ids(com('D'));
    const com56 = ids(com('D', { instrumentoTeste: 'nao_sei' }));
    expect(com56).toContain('R-56');
    expect(sem.includes('R-56') || com56.includes('R-56')).toBe(true);
    expect(ids(com('A', { instrumentoTeste: 'contratado' }))).toEqual(expect.not.arrayContaining(['R-99']));
  });
  it('revisao (alerta precoce): taxa e minutos informados criam a linha de revisão por volume em K5.3 e sobem o custo; um só não basta', () => {
    const c0 = com('C');
    expect((CAMPO_POR_ID as any).revisao.se(c0.caso)).toBe(true);
    const base = custoTotal(c0);
    expect(custoTotal(com('C', { revisao: { taxaAlerta: 2, minutos: '' } }))).toBe(base);
    expect(custoTotal(com('C', { revisao: { taxaAlerta: '', minutos: 20 } }))).toBe(base);
    const c2 = custoTotal(com('C', { revisao: { taxaAlerta: 2, minutos: 20 } })), c4 = custoTotal(com('C', { revisao: { taxaAlerta: 4, minutos: 20 } }));
    expect(c2).toBeGreaterThan(base);
    expect(c4).toBeGreaterThan(c2);
    const linhas = (e: any) => numerosDe(e).av.linhas.filter((l: any) => l.s === 'K5.3' && /volume/.test(l.nome));
    expect(linhas(c0)).toEqual([]);
    expect(linhas(com('C', { revisao: { taxaAlerta: 2, minutos: 20 } })).length).toBeGreaterThan(0);
  });
  it('altCustoEfeito e volumeResultado completam os números ligados (efeito de empate; custo por solicitação)', () => {
    const b = com('B');
    expect((limiar(b, numerosRec(b)) as any).completo).toBe(false);
    const b2 = com('B', { altCustoEfeito: { custo: { min: 20, provavel: 30, max: 45 }, efeito: { min: 0.05, provavel: 0.1, max: 0.2 } } });
    const l = limiar(b2, numerosRec(b2)) as any;
    expect(l.completo).toBe(true);
    expect(l.valor.custoPor01DP).toBeCloseTo(30, 6);
    const d = com('D');
    expect((limiar(d, numerosRec(d)) as any).completo).toBe(false);
    const d2 = com('D', { volumeResultado: { unidade: 'solicitacoes', volume: 3000, periodo: 'mes' } });
    expect((limiar(d2, numerosRec(d2)) as any).completo).toBe(true);
    const av = (avaliabilidade(d2, numerosRec(d2)) as any).solicitacoes;
    expect(av.falta).toBeUndefined();
    expect(av.N).toBeGreaterThan(0);
  });
  it('momentoUso fica gravado (nenhuma regra o lê ainda: a R-48 do pacote de regras pode ler `momentoUso`)', () => {
    const e = com('B', { momentoUso: 'aula' });
    expect(e.caso.momentoUso).toBe('aula');
    expect(e.origem.momentoUso).toBe('refinado');
  });
});

describe('REC-52: opções novas em perguntas que já existem', () => {
  it('3.2.1 oferece "Modelo preditivo treinado com dados da rede" e "Modelo aberto usado pela API de uma empresa"', () => {
    const o: any[] = (OPC as any).arquitetura;
    expect(o.find(x => x[0] === 'preditivo')[1]).toBe('Modelo preditivo treinado com dados da rede');
    expect(o.find(x => x[0] === 'ow_api')[1]).toBe('Modelo aberto usado pela API de uma empresa');
    expect((OPC as any).arquiteturaPergunta.map((x: any) => x[0])).toEqual(expect.arrayContaining(['saas', 'api', 'ow', 'preditivo', 'ow_api', 'nao_sei']));
    const e: any = com('B');
    const html = renderToString(createElement(ControleCampo, { e, campo: 'arquitetura' }));
    expect(html).toContain('Modelo preditivo treinado com dados da rede');
    expect(html).toContain('Modelo aberto usado pela API de uma empresa');
  });
  it('escolhê-las usa a arquitetura presumida no custo (como "ainda não sei") e mostra o aviso no controle', () => {
    const nao = com('B', { arquitetura: 'nao_sei' });
    ['preditivo', 'ow_api'].forEach(v => {
      const e = com('B', { arquitetura: v });
      expect(e.caso.arquitetura).toBe(v);
      expect(casoAtual(e).__arqPresumida).toBe(true);
      expect(casoAtual(e).arquitetura).toBe(casoAtual(nao).arquitetura);
      expect(custoTotal(e)).toBe(custoTotal(nao));
      expect(renderToString(createElement(ControleCampo, { e: S().estado() as any, campo: 'arquitetura' }))).toContain('ainda não tem um exemplo de partida próprio');
    });
    expect(renderToString(createElement(ControleCampo, { e: com('B', { arquitetura: 'api' }) as any, campo: 'arquitetura' }))).not.toContain('exemplo de partida próprio');
  });
  it('2.5.1 oferece "Coordenação pedagógica"; marcá-la não muda o custo (o papel ainda não é calculado) nem quebra as regras', () => {
    const o: any[] = (OPC as any).formados;
    expect(o.map(x => x[0])).toEqual(['professores', 'gestores', 'coordenacao', 'tecnica', 'administrativo']);
    expect(o.find(x => x[0] === 'coordenacao')[1]).toBe('Coordenação pedagógica');
    const a = com('A');
    const b = com('A', { formados: ['professores', 'coordenacao'] });
    expect(custoTotal(b)).toBe(custoTotal(a));
    expect(ids(b)).toEqual(expect.arrayContaining(['R-46']));
    expect(renderToString(createElement(ControleCampo, { e: b as any, campo: 'formados' }))).toContain('Coordenação pedagógica');
  });
});

describe('REC-52: ligação com o plano (perguntas.ts)', () => {
  it('as que mudam o risco mudam os KPIs; as de regra apontam as recomendações que as leem', () => {
    ['publico', 'contestacaoExiste', 'treino', 'verificacao'].forEach(c => expect(afetadosPor(c), c).toEqual(expect.arrayContaining(['kpi.ano0', 'kpi.anual', 'kpi.total'])));
    expect(afetadosPor('revisao')).toEqual(expect.arrayContaining(['kpi.anual', 'kpi.total', 'rec:R-31']));
    expect(afetadosPor('contestacaoExiste')).toContain('rec:R-32');
    expect(afetadosPor('dotacao')).toContain('rec:R-73');
    expect(afetadosPor('estrategiaCompra')).toContain('rec:R-55');
    expect(afetadosPor('instrumentoTeste')).toContain('rec:R-56');
    expect(afetadosPor('tempoJornada')).toContain('rec:R-46');
    expect(afetadosPor('apoioEscola')).toContain('rec:R-47');
    expect(afetadosPor('publico')).toEqual(expect.arrayContaining(['rec:R-52', 'rec:R-53']));
    expect(afetadosPor('altCustoEfeito')).toContain('rec:R-17');
    expect(afetadosPor('volumeResultado')).toContain('rec:R-17');
    Object.keys(REC_DAS_PERGUNTAS_REC).forEach(c => expect(TODAS, c).toContain(c));
  });
  it('quem muda risco ou revisão está em CAMPOS_CUSTO (a calculadora editada fica "pendente")', () => {
    ['publico', 'contestacaoExiste', 'treino', 'verificacao', 'revisao'].forEach(c => expect(CAMPOS_CUSTO, c).toContain(c));
  });
});

describe('REC-52: migrações e formatos', () => {
  it('um caso antigo, sem os campos novos, ganha os valores neutros e nenhuma resposta nova', () => {
    const o: any = JSON.parse(JSON.stringify({ ...S().estado(), app: 'ai-education-procurement-tool', formato: 14 }));
    TODAS.forEach(c => { delete o.caso[c]; });
    const e = migrar(o);
    TODAS.forEach(c => expect((e.caso as any)[c], c).toEqual((CASO_VAZIO as any)[c]));
    TODAS.forEach(c => expect(e.origem[c], c).toBe('padrao'));
    expect(e.respC.publico).toBeUndefined();
  });
  it('respostas dadas em formato antigo ou editado à mão voltam ao formato que as regras leem', () => {
    const c: any = clone(CASO_VAZIO);
    Object.assign(c, {
      publico: ['rural', 'inventado', 'nenhum'], contestacaoExiste: 'talvez', treino: 'nao', dotacao: 7, apoioEscola: 'coordenacao',
      altCustoEfeito: { custo: 12, efeito: { valor: 0.1, min: -3 } }, volumeResultado: 3000, revisao: { taxaAlerta: 250, minutos: '15' },
    });
    normalizarRespostasRec(c);
    expect(c.publico).toEqual(['rural']);
    expect(c.contestacaoExiste).toBe('');
    expect(c.treino).toBe('nao');
    expect(c.dotacao).toBe('');
    expect(c.apoioEscola).toBe('coordenacao');
    expect(c.altCustoEfeito).toEqual({ custo: { min: '', provavel: 12, max: '' }, efeito: { min: 0, provavel: 0.1, max: '' } });
    expect(c.volumeResultado).toEqual({ unidade: 'solicitacoes', volume: 3000, periodo: 'mes' });
    expect(c.revisao).toEqual({ taxaAlerta: 100, minutos: 15 });
    // publico como texto solto, só com exclusivas e vazio
    const d: any = { publico: 'deficiencia' }; normalizarRespostasRec(d); expect(d.publico).toEqual(['deficiencia']);
    const f: any = { publico: ['nao_sei', 'nenhum'] }; normalizarRespostasRec(f); expect(f.publico).toEqual(['nenhum']);
    const g: any = {}; normalizarRespostasRec(g); expect(g.publico).toEqual([]); expect(g.volumeResultado).toEqual({ unidade: '', volume: '', periodo: 'mes' });
  });
  it('o formato que rec_numeros.js lê (números soltos) continua valendo depois de migrar', () => {
    const o: any = JSON.parse(JSON.stringify({ ...S().estado(), app: 'ai-education-procurement-tool', formato: 14 }));
    o.caso.altCustoEfeito = { custo: 30, efeito: 0.1 }; o.caso.volumeResultado = 3000;
    const e = migrar(o);
    expect(faixaCompleta(e.caso.altCustoEfeito)).toBe(true);
    expect(e.caso.volumeResultado).toEqual({ unidade: 'solicitacoes', volume: 3000, periodo: 'mes' });
  });
  it('v8: treino, contestação e verificabilidade voltam como respostas das perguntas novas (só os ids que a lista conhece)', () => {
    const B = migrar(JSON.parse(fs.readFileSync(path.join(FIX, 'caso_v8_B.json'), 'utf8')));
    expect(B.caso.treino).toBe('nao');
    expect(B.caso.contestacaoExiste).toBe('formal');
    expect(B.caso.verificacao).toBe('sim');
    expect(B.respC.treino).toBe(true);
    expect(B.origem.contestacaoExiste).toBe('informado');
    const A = migrar(JSON.parse(fs.readFileSync(path.join(FIX, 'caso_v8_A.json'), 'utf8')));
    expect(A.caso.contestacaoExiste).toBe('');           // "na" (não se aplica) não é resposta da pergunta nova
    expect(A.origem.contestacaoExiste).toBe('padrao');
    expect(A.caso.verificacao).toBe('parcial');
    // caso em branco (v8): nada respondido, nenhuma resposta fantasma
    const X = migrar(JSON.parse(fs.readFileSync(path.join(FIX, 'caso_v8_branco_parcial.json'), 'utf8')));
    expect(X.respC.treino).toBeUndefined();
    expect(X.origem.treino).toBe('padrao');
    ['vulneraveis', 'idiomas', 'verificabilidade', 'contestacao'].forEach(k => expect(k in X.caso, k).toBe(false));
  });
  it('estadoInicial e derivarOrigem conhecem as 13 chaves', () => {
    const e = estadoInicial();
    const o = derivarOrigem({ caso: e.caso, ctx: e.ctx, resp: {}, respC: {} });
    TODAS.forEach(c => { expect(c in o, c).toBe(true); expect(o[c], c).toBe('padrao'); });
  });
});

describe('REC-52: lógica das perguntas de formato próprio (refinar_rec.ts)', () => {
  it('faixa: edita uma célula, aceita números soltos e valida a ordem mínimo ≤ mais provável ≤ máximo', () => {
    let r = faixaEditada(undefined, 'custo', 'provavel', 40);
    r = faixaEditada(r, 'efeito', 'provavel', 0.1);
    r = faixaEditada(r, 'custo', 'min', 20);
    r = faixaEditada(r, 'custo', 'max', 60);
    expect(r).toEqual({ custo: { min: 20, provavel: 40, max: 60 }, efeito: { min: '', provavel: 0.1, max: '' } });
    expect(faixaCompleta(r)).toBe(true);
    expect(faixaEditada(r, 'custo', 'min', -5).custo.min).toBe(0);
    expect(faixaEditada(r, 'custo', 'min', '').custo.min).toBe('');
    expect(faixaDe(30)).toEqual({ min: '', provavel: 30, max: '' });
    expect(faixaDe({ valor: 7 }).provavel).toBe(7);
    expect(custoEfeitoDe(null).custo.provavel).toBe('');
    expect(errosDaFaixa({ min: 50, provavel: 40, max: 60 }).min?.k).toBe('O mínimo não pode passar do mais provável.');
    expect(errosDaFaixa({ min: 50, provavel: '', max: 40 }).min?.k).toBe('O mínimo não pode passar do máximo.');
    expect(errosDaFaixa({ min: 20, provavel: 40, max: 30 }).max?.k).toBe('O máximo não pode ficar abaixo do mais provável.');
    expect(errosDaFaixa({ min: '', provavel: 0, max: '' }).provavel?.k).toBe('Informe um número maior que zero.');
    expect(errosDaFaixa({ min: 20, provavel: 40, max: 60 })).toEqual({});
    expect(faixaCompleta({ custo: { provavel: 0 }, efeito: { provavel: 0.1 } })).toBe(false);
  });
  it('volume: unidade conhecida, período por mês ou por ano, aviso quando falta uma das duas partes', () => {
    expect(volumeDe(undefined)).toEqual({ unidade: '', volume: '', periodo: 'mes' });
    expect(volumeDe(500)).toEqual({ unidade: 'solicitacoes', volume: 500, periodo: 'mes' });
    expect(volumeDe({ unidade: 'outra', volume: 5, periodo: 'ano' })).toEqual({ unidade: '', volume: 5, periodo: 'ano' });
    let v = volumeEditado(undefined, { volume: 3000 });
    expect(avisoVolume(v)?.k).toBe('Escolha também a unidade do resultado.');
    v = volumeEditado(v, { unidade: 'solicitacoes', periodo: 'ano' });
    expect(v).toEqual({ unidade: 'solicitacoes', volume: 3000, periodo: 'ano' });
    expect(avisoVolume(v)).toBeUndefined();
    expect(avisoVolume(volumeEditado(undefined, { unidade: 'estudantes' }))?.k).toBe('Informe também o volume.');
    expect(OPC_UNIDADE_RESULTADO.map(o => o[0])).toEqual(['solicitacoes', 'estudantes']);
  });
  it('revisão: taxa de 0 a 100%, minutos maiores que zero, e o custo só entra com os dois', () => {
    expect(revisaoDe(undefined)).toEqual({ taxaAlerta: '', minutos: '' });
    let r = revisaoEditada(undefined, 'taxaAlerta', 2.55);
    expect(r.taxaAlerta).toBe(2.6);
    expect(revisaoEditada(r, 'taxaAlerta', 400).taxaAlerta).toBe(100);
    expect(revisaoIncompleta(r)).toBe(true);
    expect(revisaoCompleta(r)).toBe(false);
    r = revisaoEditada(r, 'minutos', 15);
    expect(revisaoCompleta(r)).toBe(true);
    expect(revisaoIncompleta(r)).toBe(false);
    expect(errosDaRevisao({ taxaAlerta: 0, minutos: 0 })).toEqual({ taxaAlerta: { k: 'Informe um número maior que zero.' }, minutos: { k: 'Informe um número maior que zero.' } });
    expect(errosDaRevisao(r)).toEqual({});
  });
  it('todas as mensagens estão em TEXTOS_REC_R8 (para a extração das traduções)', () => {
    const ks = new Set<string>();
    const add = (m?: { k: string }) => { if (m) ks.add(m.k); };
    [{ min: 50, provavel: 40, max: 30 }, { min: 50, provavel: '', max: 40 }, { min: '', provavel: 0, max: '' }].forEach(f => Object.values(errosDaFaixa(f as any)).forEach(add));
    add(avisoVolume({ unidade: '', volume: 5, periodo: 'mes' })); add(avisoVolume({ unidade: 'estudantes', volume: '', periodo: 'mes' }));
    Object.values(errosDaRevisao({ taxaAlerta: 0, minutos: 0 })).forEach(add);
    ks.forEach(k => expect(TEXTOS_REC_R8, k).toContain(k));
  });
});
