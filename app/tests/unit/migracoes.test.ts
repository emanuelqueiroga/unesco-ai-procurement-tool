// migrar(json) aceita os formatos 9, 11, 13 e 14, o estado guardado pela v13 e os casos do app anterior (v8),
// e deriva a origem de cada campo. Fixtures: tests/fixtures do repositório (v8 e v10) e um caso v13 montado aqui.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrar, ErroImportacao, estadoInicial, origemDerivada, derivarOrigem, respCDeOrigem, temRespostas, FORMATOS_ACEITOS } from '../../src/store/migracoes';
import { dadosCaso, nomeArqCaso, slugCaso } from '../../src/export/json';
import { CASOS, CTX_EX, RESP_EX, CASO_VAZIO, clone } from '../../src/domain';

const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'tests', 'fixtures');
const ler = (n: string) => JSON.parse(fs.readFileSync(path.join(FIX, n), 'utf8'));

// um caso v13 exportado: o exemplo A como a v13 o guardava, com algumas respostas confirmadas
function casoV13() {
  const caso = Object.assign(clone(CASO_VAZIO), clone((CASOS as any).A));
  return {
    app: 'ai-education-procurement-tool', formato: 13, versao: 13, v10: true, salvo: '2026-10-20T10:00:00.000Z', exemplo: 'editado',
    caso, ctx: clone((CTX_EX as any).A), resp: clone((RESP_EX as any).A), respC: { tarefas: true, usuarios: true, 'piloto.escolas': true, piloto: true },
    respDet: { 'g-comite': { qual: 'Comitê de tecnologia' } }, revisar: [], feitos: {},
    custo: { base: 'caso', cfg: null, editado: false }, moeda: { cod: 'BRL', taxa: '5.2' }, lang: 'pt',
  };
}

describe('migrar: entrada', () => {
  it('rejeita o que não é um caso', () => {
    expect(() => migrar('isto não é json')).toThrow(ErroImportacao);
    expect(() => migrar([1, 2])).toThrow(ErroImportacao);
    expect(() => migrar({ app: 'ai-education-procurement-tool', formato: 13 })).toThrow(/caso/);
    expect(() => migrar({ app: 'outro-app', caso: {} })).toThrow(/outro aplicativo/);
    expect(() => migrar({ app: 'ai-education-procurement-tool', formato: 7, caso: {} })).toThrow(/Formato 7/);
  });
  it('formatos aceitos: 9, 11, 13 e 14', () => { expect(FORMATOS_ACEITOS).toEqual([9, 11, 13, 14]); });
  it('aceita texto JSON', () => {
    const e = migrar(JSON.stringify(casoV13()));
    expect(e.formato).toBe(14); expect(e.caso.titulo).toBe((CASOS as any).A.titulo);
  });
});

describe('migrar: formato 13 → 14', () => {
  const e = migrar(casoV13());
  it('mantém caso, ctx, resp, respDet, moeda e idioma', () => {
    expect(e.versao).toBe(14);
    expect(e.ctx.local).toBe((CTX_EX as any).A.local);
    expect(e.resp).toEqual((RESP_EX as any).A);
    expect(e.respDet['g-comite']).toEqual({ qual: 'Comitê de tecnologia' });
    expect(e.moeda).toEqual({ cod: 'BRL', taxa: '5.2' });
    expect(e.lang).toBe('pt');
    expect(e.exemplo).toBe('editado');
  });
  it('deriva a origem: confirmado → informado; valor ≠ padrão → sugerido; vazio → padrao', () => {
    expect(e.origem.tarefas).toBe('informado');
    expect(e.origem['piloto.escolas']).toBe('informado');
    expect(e.origem.titulo).toBe('sugerido');       // valor do exemplo sem respC
    expect(e.origem.escolasInternet).toBe('padrao'); // vazio no exemplo A
    expect(e.origem.local).toBe('sugerido');         // ctx preenchido sem respC
    expect(e.origem['g-comite']).toBe('informado');  // governança respondida
  });
  it('respC continua coerente com a origem', () => {
    expect(e.respC.tarefas).toBe(true);
    expect(e.respC.titulo).toBeUndefined();
    Object.keys(e.respC).forEach(k => expect(['informado', 'refinado']).toContain(e.origem[k]));
  });
  it('começa no Essencial, capítulo 1', () => {
    expect(e.modo).toBe('essencial'); expect(e.capitulo.atual).toBe(1); expect(e.capitulo.pergunta).toBe('nivel');
  });
});

describe('migrar: formato 9 (v10, PoC)', () => {
  const o = ler('caso_v10_poc.json');
  const e = migrar(o);
  it('teste → testes e PoC separada do piloto (v10 → v11)', () => {
    expect(e.caso.testes).toEqual(['poc']);
    expect(e.caso.teste).toBeUndefined();
    expect(+e.caso.poc.participantes > 0 || +e.caso.poc.meses > 0).toBe(true);
    expect(e.caso.piloto).toEqual({ escolas: '', participantes: '', meses: '' });
  });
  it('campos removidos não voltam; ctx no formato v13', () => {
    ['pagaDepois', 'fonte', 'infra', 'arquiteturaManual'].forEach(k => expect(k in e.caso, k).toBe(false));
    expect(Array.isArray(e.ctx.prioridades)).toBe(true); expect(Array.isArray(e.ctx.problemas)).toBe(true);
    expect('dominio' in e.ctx).toBe(false);
  });
  it('as respostas dadas ficam informadas', () => {
    expect(e.origem.tarefas).toBe('informado');
    expect(e.origem.usuarios).toBe('informado');
  });
});

describe('migrar: app anterior (v8, formato 4)', () => {
  it('os quatro exemplos convertem para o v14 com tarefas e caso editado', () => {
    ['A', 'B', 'C', 'D'].forEach(k => {
      const e = migrar(ler(`caso_v8_${k}.json`));
      expect(e.formato).toBe(14);
      expect(e.exemplo).toBe('editado');
      expect(e.caso.tarefas.length, k).toBeGreaterThan(0);
      expect(e.caso.horizonte).toBeGreaterThan(0);
      expect(Object.values(e.origem)).toContain('informado');
      expect('classes' in e.caso).toBe(false);
    });
  });
  it('um caso em branco com respostas parciais não vira exemplo', () => {
    const e = migrar(ler('caso_v8_branco_parcial.json'));
    expect(e.exemplo).toBe('novo');
    expect(e.caso.elegiveis === '' || e.origem.elegiveis !== 'padrao').toBe(true);
  });
  it('reconhece a v8 pelo conteúdo quando falta "app"', () => {
    const o = ler('caso_v8_A.json'); delete o.app;
    expect(migrar(o).caso.tarefas.length).toBeGreaterThan(0);
  });
});

describe('migrar: formato 14 e ida e volta', () => {
  it('exportar e importar preserva origem, modo e capítulo', () => {
    const e = migrar(casoV13());
    e.origem.horizonte = 'refinado'; e.caso.horizonte = 5; e.modo = 'refinar'; e.capitulo = { atual: 2, pergunta: 'piloto' }; e.sugestoes.piloto = 'testes';
    const json = dadosCaso(e, new Date('2026-10-28T12:00:00Z'));
    expect(json.formato).toBe(14); expect(json.salvo).toBe('2026-10-28T12:00:00.000Z');
    const f = migrar(JSON.parse(JSON.stringify(json)));
    expect(f.origem.horizonte).toBe('refinado'); expect(f.caso.horizonte).toBe(5);
    expect(f.respC.horizonte).toBe(true);
    expect(f.modo).toBe('refinar'); expect(f.capitulo).toEqual({ atual: 2, pergunta: 'piloto' });
    expect(f.sugestoes.piloto).toBe('testes');
  });
  it('o estado guardado pela v13 (sem "app") também entra', () => {
    const o: any = casoV13(); delete o.app; delete o.formato; delete o.salvo; o.fase = 'piloto'; o.passo = '2b'; o.boasVindas = true;
    const e = migrar(o);
    expect(e.versao).toBe(14); expect('fase' in e).toBe(false); expect('boasVindas' in e).toBe(false);
  });
  it('a cfg editada na calculadora só vale quando editado = true', () => {
    const o: any = casoV13(); o.custo = { base: 'caso', cfg: { x: 1 }, editado: false };
    expect(migrar(o).custo.cfg).toBeNull();
    o.custo = { base: 'caso', cfg: { x: 1 }, editado: true };
    expect(migrar(o).custo.cfg).toEqual({ x: 1 });
  });
});

describe('origem e exportação', () => {
  it('origemDerivada sobre o estado inicial é padrao em tudo', () => {
    const e = estadoInicial();
    expect(origemDerivada(e, 'tarefas')).toBe('padrao');
    expect(origemDerivada(e, 'piloto.escolas')).toBe('padrao');
    expect(origemDerivada(e, 'etapas')).toBe('padrao');
    expect(Object.values(derivarOrigem(e)).every(v => v === 'padrao')).toBe(true);
    expect(temRespostas(e)).toBe(false);
  });
  it('respCDeOrigem ignora governança e remove o que deixou de ser confirmado', () => {
    expect(respCDeOrigem({ tarefas: 'informado', titulo: 'sugerido', 'g-comite': 'informado' }, { titulo: true })).toEqual({ tarefas: true });
  });
  it('nome do arquivo vem do título', () => {
    const e = estadoInicial(); e.caso.titulo = 'Tutor de matemática: 2º ciclo';
    expect(slugCaso(e)).toBe('tutor-de-matematica-2-ciclo');
    expect(nomeArqCaso(e)).toBe('ai-education-case-tutor-de-matematica-2-ciclo.json');
    expect(nomeArqCaso(estadoInicial())).toBe('ai-education-case-case.json');
  });
});
