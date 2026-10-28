// Lint do formato das regras (REC-14, seção 3.1): todo o catálogo passa; o lint pega os defeitos comuns; os textos
// que chegam às telas nos exemplos A–D também seguem o formato (com os marcadores já preenchidos).
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { useCaso } from '../../src/store/caso';
import { setLang, setMoeda, setTabelaMoedas, REGRAS, lintCatalogo, lintRegra, recomendacoesCaso, AREAS_REC, EXIGE_REC } from '../../src/domain';
import { lintOque, lintPorque } from '../../src/domain/regras/lint.js';
import { CONTRATO_SLUGS_TODOS } from '../../src/domain/regras/index.js';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
setTabelaMoedas(JSON.parse(fs.readFileSync(path.join(RAIZ, 'data', 'moedas.json'), 'utf8')));
function exemplo(k: string): any {
  setLang('pt');
  useCaso.getState().carregarExemplo(k);
  const e: any = useCaso.getState().estado();
  setMoeda(e.moeda);
  return e;
}

const BOA = {
  id: 'R-99', versao: 1, pacote: 'USO', tipo: 'politica', substitui: [], campos: ['modeloDisp'], se: () => true,
  variantes: [{ oque: 'Organizar a agenda dos dispositivos.', porque: 'Sem agenda, o dispositivo falta na hora da aula.', como: ['Montar a agenda.', 'Nomear quem cuida.'] }],
  paraque: 'Os dispositivos estão prontos.', quem: ['escolas'], marco: 'M1', pronto: 'A agenda está publicada.',
};
const com = (x: any) => Object.assign({}, BOA, x);

describe('lint das regras (REC-14)', () => {
  it('todo o catálogo passa no lint, sem ids repetidos', () => {
    const P = lintCatalogo(REGRAS as any[]);
    expect(P, P.slice(0, 8).join('\n')).toEqual([]);
  });
  it('o lint pega os defeitos do formato', () => {
    expect(lintRegra(BOA)).toEqual([]);
    const v = (x: any) => com({ variantes: [Object.assign({}, BOA.variantes[0], x)] });
    expect(lintRegra(v({ oque: 'Termos de uso padrão não bastam: negocie um contrato.' })).join(' ')).toMatch(/infinitivo/);
    expect(lintRegra(v({ oque: 'Negociar um contrato: termos de uso não bastam.' })).join(' ')).toMatch(/":"/);
    expect(lintRegra(v({ oque: 'Fazer ' + 'muito '.repeat(30) + 'mais.' })).join(' ')).toMatch(/palavras/);
    expect(lintRegra(v({ oque: 'Medir o custo (Krueger e Jackson, 2026).' })).join(' ')).toMatch(/citação/);
    expect(lintRegra(v({ porque: 'A resposta “Não” à pergunta 1.2.7.' })).join(' ')).toMatch(/repete a resposta/);
    expect(lintRegra(v({ como: ['Um passo só.'] })).join(' ')).toMatch(/2 a 4 passos/);
    expect(lintRegra(com({ pronto: '' })).join(' ')).toMatch(/pronto vazio/);
    expect(lintRegra(com({ tipo: 'custo' })).join(' ')).toMatch(/sem exige/);
    expect(lintRegra(com({ tipo: 'custo', exige: ['CONTRATO.nao-existe'] })).join(' ')).toMatch(/exige desconhecido/);
    expect(lintRegra(com({ tipo: 'custo', exige: ['CONTRATO.custo-consumo'] }))).toEqual([]);
    expect(lintRegra(com({ quem: ['quemSabe'] })).join(' ')).toMatch(/quem desconhecido/);
    expect(lintRegra(com({ marco: 'antes_teste' })).join(' ')).toMatch(/marco inválido/);
    expect(lintRegra(com({ variantes: [Object.assign({ quando: () => true }, BOA.variantes[0])] })).join(' ')).toMatch(/última variante/);
    expect(lintRegra(com({ variantes: [Object.assign({}, BOA.variantes[0], { oque: 'Fixar o teto de {teto}.' })] })).join(' ')).toMatch(/marcadores/);
    expect(lintCatalogo([BOA, BOA]).join(' ')).toMatch(/id repetido/);
  });
  it('as cláusulas exigíveis cobrem todas as linhas de CONTRATO e DADOS_REQ', () => {
    CONTRATO_SLUGS_TODOS.forEach((id: string) => expect((EXIGE_REC as any)[id], id).toBeTruthy());
    expect((EXIGE_REC as any)['DADOS_REQ.treino']).toBeTruthy();
  });
  it('os textos que chegam às telas nos exemplos A–D seguem o formato', () => {
    for (const k of ['A', 'B', 'C', 'D']) {
      recomendacoesCaso(exemplo(k)).forEach((r: any) => {
        expect(lintOque(r.oque), k + ' ' + r.id).toEqual([]);
        expect(lintPorque(r.razao), k + ' ' + r.id).toEqual([]);
        expect(r.como.length, k + ' ' + r.id).toBeGreaterThanOrEqual(2);
        expect(r.pronto, k + ' ' + r.id).toMatch(/\S/);
        expect(r.paraque, k + ' ' + r.id).toMatch(/\S/);
        r.quem.forEach((q: string) => expect((AREAS_REC as any)[q], k + ' ' + r.id + ' ' + q).toBeTruthy());
        expect(['M1', 'M2', 'M3', 'M4', 'M5']).toContain(r.marco);
        expect(['condicao', 'recomendada', 'acompanhar']).toContain(r.nivel);
      });
    }
  });
});
