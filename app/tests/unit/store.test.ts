// O store: responder/sugerir/confirmar/refinar com a origem certa, sugestões em cascata que nunca sobrescrevem
// uma resposta, exemplos, importação e exportação, persistência (com um storage de teste) e seletores do plano.
import { describe, it, expect, beforeEach } from 'vitest';
import { useCaso } from '../../src/store/caso';
import { carregar, salvar, ligarPersistencia, CHAVE, CHAVE_V13, CHAVE_V8, type StorageLike } from '../../src/store/persistencia';
import { numerosDe, progressoDe, faltamDe, telaAtual, proximaTela, recomendacoesDe, origemDe, camposRefinar, cabecalhoDe } from '../../src/store/selectors';
import { estadoInicial } from '../../src/store/migracoes';
import { CASOS, CASO_VAZIO } from '../../src/domain';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'tests', 'fixtures');
const S = () => useCaso.getState();
function memStorage(inicial: Record<string, string> = {}): StorageLike & { dados: Record<string, string> } {
  const dados = { ...inicial };
  return { dados, getItem: k => (k in dados ? dados[k] : null), setItem: (k, v) => { dados[k] = v; } };
}
beforeEach(() => { S().carregarExemplo('novo'); });

describe('estado inicial', () => {
  it('é o v14 em branco, no Essencial, capítulo 1', () => {
    const e = S().estado();
    expect(e.formato).toBe(14);
    expect(e.caso).toEqual(CASO_VAZIO);
    expect(e.modo).toBe('essencial');
    expect(e.capitulo).toEqual({ atual: 1, pergunta: 'nivel' });
    expect(e.origem).toEqual({});
    expect(S().recente).toBeNull();
  });
  it('estado() não traz as ações e não é a mesma referência', () => {
    const e: any = S().estado();
    expect(typeof e.responder).toBe('undefined');
    expect(e.caso).toBe(S().caso);   // cópia rasa: sem clone desnecessário
  });
});

describe('responder', () => {
  it('grava no lugar certo (ctx, caso, resp) com origem informado', () => {
    S().responder('nivel', 'municipal');
    S().responder('titulo', 'Tutor de matemática');
    S().responderGov('g-comite', 'nao');
    const e = S().estado();
    expect(e.ctx.nivel).toBe('municipal'); expect(e.origem.nivel).toBe('informado'); expect(e.respC.nivel).toBe(true);
    expect(e.caso.titulo).toBe('Tutor de matemática'); expect(e.origem.titulo).toBe('informado');
    expect(e.resp['g-comite']).toBe('nao'); expect(e.origem['g-comite']).toBe('informado'); expect(e.respC['g-comite']).toBeUndefined();
  });
  it('subcampo: piloto.escolas confirma o subcampo e o campo', () => {
    S().responder('piloto.escolas', 3);
    const e = S().estado();
    expect(e.caso.piloto.escolas).toBe(3);
    expect(e.origem['piloto.escolas']).toBe('informado');
    expect(e.respC['piloto.escolas']).toBe(true); expect(e.respC.piloto).toBe(true);
  });
  it('não muta o estado anterior (objeto novo a cada ação)', () => {
    const antes = S().estado();
    S().responder('titulo', 'x');
    expect(antes.caso.titulo).toBe('');
    expect(S().caso).not.toBe(antes.caso);
  });
  it('leva a tela atual para a pergunta respondida', () => {
    S().responder('tarefas', ['tutoria']);
    expect(S().capitulo).toEqual({ atual: 2, pergunta: 'tarefas' });
  });
  it('registra o que acabou de mudar, com os trechos do plano', () => {
    S().responder('etapas', { fund2: { on: true, escolas: 100, alunos: 20000, soTotal: true } });
    S().responder('testes', ['piloto']);
    const r = S().recente!;
    expect(r.campo).toBe('testes');
    expect(r.afetados).toContain('kpi.ano0'); expect(r.afetados).toContain('A1');
    expect(r.afetados).toContain('campo:piloto.escolas');   // a sugestão em cascata
  });
});

describe('sugestões em cascata', () => {
  it('2.0 = piloto sugere o tamanho do piloto, com origem sugerido e de onde veio', () => {
    S().responder('testes', ['piloto']);
    expect(S().caso.piloto.meses).toBe(4); expect(S().caso.piloto.escolas).toBe('');   // sem escolas na rede, sem sugestão
    S().responder('etapas', { fund2: { on: true, escolas: 100, alunos: 20000, soTotal: true } });
    const e = S().estado();
    expect(+e.caso.piloto.escolas).toBeGreaterThan(0);
    expect(e.origem['piloto.escolas']).toBe('sugerido');
    expect(e.sugestoes['piloto.escolas']).toBe('testes');
    expect(e.respC['piloto.escolas']).toBeUndefined();
  });
  it('tecnologia sugere pagamento e licença; usuários sugerem elegíveis', () => {
    S().responder('tipoTec', 'paga');
    expect(S().origem.pagamento).toBe('sugerido'); expect(S().sugestoes.pagamento).toBe('tipoTec');
    S().responder('etapas', { fund2: { on: true, escolas: 10, alunos: 2000, soTotal: true } });
    S().responder('usuarios', ['estudantes']);
    expect(S().origem.elegiveis).toBe('sugerido'); expect(+S().caso.elegiveis).toBeGreaterThan(0);
  });
  it('uma resposta informada nunca é substituída por sugestão', () => {
    S().responder('piloto.escolas', 7);
    S().responder('testes', ['piloto']);
    expect(S().caso.piloto.escolas).toBe(7);
    expect(S().origem['piloto.escolas']).toBe('informado');
  });
  it('sugerir() respeita o que foi informado e confirmar() promove a sugestão', () => {
    S().responder('testes', ['piloto']);
    const v = S().caso.piloto.escolas;
    S().sugerir('piloto.escolas', 99, 'teste');
    expect(S().caso.piloto.escolas).toBe(99);
    S().confirmar('piloto.escolas');
    expect(S().origem['piloto.escolas']).toBe('informado'); expect(S().respC['piloto.escolas']).toBe(true);
    S().sugerir('piloto.escolas', 1, 'teste');
    expect(S().caso.piloto.escolas).toBe(99);
    expect(v).not.toBe(99);
  });
  it('problemas marcados sugerem tarefas; tarefas sugerem usuários e afetados', () => {
    S().responder('prioridades', ['com']);
    S().responder('problemas', ['C2']);
    const e = S().estado();
    expect(e.caso.tarefas.length).toBeGreaterThan(0); expect(e.origem.tarefas).toBe('sugerido'); expect(e.sugestoes.tarefas).toBe('problemas');
    expect(e.caso.usuarios.length).toBeGreaterThan(0); expect(e.origem.usuarios).toBe('sugerido'); expect(e.sugestoes.usuarios).toBe('tarefas');
  });
  it('usuários já informados vão para revisar em vez de mudar', () => {
    S().responder('usuarios', ['professores']);
    S().responder('tarefas', ['tutoria']);
    expect(S().caso.usuarios).toEqual(['professores']);
    expect(S().revisar).toContain('usuarios');
    S().marcarRevisado('usuarios');
    expect(S().revisar).not.toContain('usuarios');
  });
});

describe('refinar e modo', () => {
  it('refinar grava com origem refinado e refaz o custo', () => {
    S().setCusto({ cfg: { x: 1 }, editado: true });
    S().refinar('horizonte', 5);
    const e = S().estado();
    expect(e.caso.horizonte).toBe(5); expect(e.origem.horizonte).toBe('refinado'); expect(e.respC.horizonte).toBe(true);
    expect(e.custo.editado).toBe(false); expect(e.custo.cfg).toBeNull();
  });
  it('modo e navegação', () => {
    S().setModo('refinar'); expect(S().modo).toBe('refinar');
    S().irPara(3); expect(S().capitulo).toEqual({ atual: 3, pergunta: 'implantacao' });
    S().irPara(2, 'piloto'); expect(S().capitulo.pergunta).toBe('piloto');
  });
  it('campos do Refinar por capítulo', () => {
    expect(camposRefinar(2)).toContain('licenca');
    expect(camposRefinar(2)).not.toContain('tarefas');
    expect(camposRefinar(4)).toContain('horizonte');
  });
});

describe('exemplos', () => {
  it('carrega o exemplo A com tudo informado e o caso marcado como exemplo', () => {
    S().carregarExemplo('A');
    const e = S().estado();
    expect(e.exemplo).toBe('A');
    expect(e.caso.titulo).toBe((CASOS as any).A.titulo);
    expect(e.origem.tarefas).toBe('informado'); expect(e.origem.usuarios).toBe('informado');
    expect(e.origem.local).toBe('informado');
    expect(Object.values(e.origem)).not.toContain('sugerido');
    expect(e.caso.arquitetura).not.toBe('');
    expect(+e.caso.formacaoHoras).toBeGreaterThan(0);
  });
  it('editar um exemplo marca o caso como editado; limpar volta ao branco', () => {
    S().carregarExemplo('B');
    S().responder('titulo', 'Outro');
    expect(S().exemplo).toBe('editado');
    S().limpar();
    expect(S().exemplo).toBe('novo'); expect(S().caso.titulo).toBe('');
  });
  it('os quatro exemplos têm números de custo', () => {
    ['A', 'B', 'C', 'D'].forEach(k => {
      S().carregarExemplo(k);
      const n = numerosDe(S().estado());
      expect(n.total, k).toBeGreaterThan(0); expect(n.ano0, k).toBeGreaterThan(0); expect(n.H).toBe(3);
      expect(Object.keys(n.camadas.total).length).toBe(7);
    });
  });
});

describe('importar e exportar', () => {
  it('ida e volta pelo JSON preserva origem e respostas', () => {
    S().responder('etapas', { fund2: { on: true, escolas: 100, alunos: 20000, soTotal: true } });
    S().responder('testes', ['piloto']);
    S().responder('titulo', 'Caso X');
    const json = S().exportar();
    expect(json.app).toBe('ai-education-procurement-tool'); expect(json.formato).toBe(14);
    S().limpar();
    S().importar(JSON.stringify(json));
    const e = S().estado();
    expect(e.caso.titulo).toBe('Caso X'); expect(e.origem.titulo).toBe('informado');
    expect(e.origem['piloto.escolas']).toBe('sugerido');
    expect(S().migradoDe).toBe('');
  });
  it('importa um caso do app anterior', () => {
    S().importar(fs.readFileSync(path.join(FIX, 'caso_v8_A.json'), 'utf8'));
    expect(S().caso.tarefas.length).toBeGreaterThan(0); expect(S().exemplo).toBe('editado');
  });
  it('um JSON inválido lança e não muda o estado', () => {
    S().responder('titulo', 'fica');
    expect(() => S().importar('{"app":"outro","caso":{}}')).toThrow();
    expect(S().caso.titulo).toBe('fica');
  });
});

describe('persistência', () => {
  it('salva na chave v14 e lê de volta', () => {
    const st = memStorage();
    S().responder('titulo', 'Guardado');
    expect(salvar(S().estado(), st)).toBe(true);
    expect(Object.keys(st.dados)).toEqual([CHAVE]);
    const c = carregar(st)!;
    expect(c.de).toBe('v14'); expect(c.estado.caso.titulo).toBe('Guardado'); expect(c.temRespostas).toBe(true);
  });
  it('sem caso v14, lê o da v13 e depois o da v8, sem apagar as chaves antigas', () => {
    const v13 = { ...estadoInicial(), versao: 13 } as any; delete v13.origem; delete v13.modo; v13.caso.titulo = 'Da v13'; v13.respC = { titulo: true };
    const st = memStorage({ [CHAVE_V13]: JSON.stringify(v13) });
    const c = carregar(st)!;
    expect(c.de).toBe('v13'); expect(c.estado.caso.titulo).toBe('Da v13'); expect(c.estado.origem.titulo).toBe('informado');
    const st8 = memStorage({ [CHAVE_V8]: fs.readFileSync(path.join(FIX, 'caso_v8_B.json'), 'utf8') });
    const c8 = carregar(st8)!;
    expect(c8.de).toBe('v8'); expect(c8.estado.caso.tarefas.length).toBeGreaterThan(0);
    expect(Object.keys(st8.dados)).toEqual([CHAVE_V8]);
  });
  it('ignora lixo e storage ausente', () => {
    expect(carregar(memStorage({ [CHAVE]: 'não é json' }))).toBeNull();
    expect(carregar(memStorage({ [CHAVE]: '{"x":1}' }))).toBeNull();
    expect(carregar(null)).toBeNull();
    expect(salvar(S().estado(), null)).toBe(false);
  });
  it('ligarPersistencia repõe o caso guardado e grava as mudanças', async () => {
    const st = memStorage();
    S().responder('titulo', 'Antes');
    salvar(S().estado(), st);
    S().limpar();
    const desligar = ligarPersistencia(st, 5);
    expect(S().caso.titulo).toBe('Antes'); expect(S().migradoDe).toBe('v14');
    S().responder('titulo', 'Depois');
    await new Promise(r => setTimeout(r, 30));
    expect(JSON.parse(st.dados[CHAVE]).caso.titulo).toBe('Depois');
    desligar();
  });
});

describe('seletores do plano', () => {
  it('progresso e telas que faltam', () => {
    expect(progressoDe(S().estado()).map(p => p.feitas)).toEqual([0, 0, 0, 0]);
    expect(faltamDe(S().estado()).length).toBe(25);
    S().responder('nivel', 'municipal');
    S().responder('internet', 'sim');
    const p = progressoDe(S().estado());
    expect(p[0].feitas).toBe(1); expect(p[1].feitas).toBe(1); expect(p[0].total).toBe(11);
    expect(faltamDe(S().estado()).length).toBe(23);
  });
  it('internet parcial só conta com as escolas informadas', () => {
    S().responder('internet', 'parcial');
    expect(progressoDe(S().estado())[1].feitas).toBe(0);
    S().responder('escolasInternet', 4);
    expect(progressoDe(S().estado())[1].feitas).toBe(1);
  });
  it('governança conta quando as seis estão respondidas', () => {
    ['g-comite', 'g-politica', 'g-legislacao', 'g-dados', 'g-etica', 'g-compras'].forEach(g => S().responderGov(g, 'nao'));
    expect(progressoDe(S().estado())[0].feitas).toBe(1);
    expect(faltamDe(S().estado()).some(t => t.id === 'governanca')).toBe(false);
  });
  it('tela atual e próxima', () => {
    expect(telaAtual(S().estado()).id).toBe('nivel');
    expect(proximaTela(S().estado())!.id).toBe('local');
    S().irPara(4, 'expansao');
    expect(proximaTela(S().estado())).toBeNull();
  });
  it('recomendações e KPIs mudam com as respostas; a origem padrão é lida sem respC', () => {
    const n0 = numerosDe(S().estado());
    expect(n0.H).toBe(3);
    S().responder('tarefas', ['tutoria']); S().responder('tipoTec', 'paga');
    S().responder('etapas', { fund2: { on: true, escolas: 10, alunos: 2000, soTotal: true } });
    S().responder('usuarios', ['estudantes']);
    const n1 = numerosDe(S().estado());
    expect(n1.total).not.toBe(n0.total);
    expect(recomendacoesDe(S().estado()).length).toBeGreaterThan(0);
    expect(origemDe(S().estado(), 'horizonte')).toBe('padrao');
    expect(cabecalhoDe(S().estado()).nivel).toBe('');
  });
});
