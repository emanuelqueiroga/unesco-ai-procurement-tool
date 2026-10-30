// Pacote P1 (perguntas no Refinar): resposta real na tela (PER-08), subcategorias, "Outro problema", detalhe da linha
// de base, detalhes da governança, lista de ferramentas, arquitetura, estudantes por ano, aviso "revisar", exclusividade de
// 2.2.3, limite de problemas, notas de premissa, ajuda das telas compostas e âncoras da síntese.
import { describe, it, expect, beforeEach } from 'vitest';
import { useCaso } from '../../src/store/caso';
import { ESSENCIAL, capituloDoCampo, extrasDoCapitulo, idDoFoco, comparaN, ajudaDaTela, EXTRAS_REFINAR } from '../../src/store/perguntas';
import { telaRespondida, respostaReal, comLacuna, camposRefinar, origemDe, numerosDe, recomendacoesDe } from '../../src/store/selectors';
import { totaisCtx, alunosEtapa, PRIORIDADES } from '../../src/domain';
import {
  alternarOpcao, problemasDoGrupo, ORDEM_PROBLEMAS, ORDEM_SUBS, etapaEditada, anosDaEtapa, respostaGov, pedeDetalhe, pendenciasRevisar, nomesDoValor,
  ferramentaAdicionada, ferramentaRemovida, ferramentaAlterada, ferramentaTarefa, arquiteturaPresumida, rotuloArquitetura, notasPremissa,
  erroNumero, inteiro, numeroDe, legendasOpc, sugeridaPeloImpacto,
} from '../../src/percurso/refinar';
import { href } from '../../src/percurso/rota';

const S = () => useCaso.getState();
const tela = (id: string) => ESSENCIAL.find((t) => t.id === id)!;
const respondida = (id: string) => telaRespondida(S().estado(), tela(id));
beforeEach(() => { S().carregarExemplo('novo'); S().setModo('essencial'); });

describe('PER-08: só conta resposta real', () => {
  it('lista vazia não conta (marcar e desmarcar tudo)', () => {
    S().responder('prioridades', ['com']);
    S().responder('problemas', ['C4']);
    expect(respondida('problemas')).toBe(true);
    S().responder('problemas', []);
    expect(respondida('problemas')).toBe(false);
    S().responder('impactos', []);
    expect(respondida('impactos')).toBe(false);
    S().responder('impactos', ['aprendizagem']);
    expect(respondida('impactos')).toBe(true);
  });
  it('"Outro problema" preenchido conta como respondida a tela 1.2.2 (PER-02)', () => {
    expect(respondida('problemas')).toBe(false);
    S().refinar('problemaOutro', 'Falta de internet nas escolas rurais');
    expect(respondida('problemas')).toBe(true);
    S().refinar('problemaOutro', '   ');
    expect(respondida('problemas')).toBe(false);
  });
  it('texto vazio e texto com lacuna não contam', () => {
    S().responder('local', '   ');
    expect(respondida('local')).toBe(false);
    S().responder('local', 'Ministério da Educação');
    expect(respondida('local')).toBe(false); // instituição opcional não substitui o país
    S().escolherPais('BRA');
    expect(respondida('local')).toBe(true);
    S().responder('problema', 'Na rede, hoje: lê mal. Quem é afetado: __. O que se sabe sobre as causas: __.');
    expect(comLacuna(S().estado(), 'problema')).toBe(true);
    expect(respondida('problema')).toBe(false);
    S().responder('problema', 'Na rede, hoje: lê mal. Quem é afetado: o 5º ano. As causas: turmas multisseriadas.');
    expect(comLacuna(S().estado(), 'problema')).toBe(false);
    expect(respondida('problema')).toBe(true);
  });
  it('etapas marcadas sem escolas ou estudantes não contam', () => {
    S().responder('etapas', { fund2: { on: true, escolas: '', alunos: '', soTotal: true } });
    S().confirmar('grade');
    expect(respondida('etapas')).toBe(false);
    S().responder('etapas', { fund2: { on: true, escolas: 10, alunos: '', soTotal: true } });
    expect(respondida('etapas')).toBe(false);
    S().responder('etapas', { fund2: { on: true, escolas: 10, alunos: 2000, soTotal: true } });
    expect(respondida('etapas')).toBe(true);
    S().responder('etapas', { fund2: { on: true, escolas: 10, alunos: 2000, soTotal: true }, medio: { on: true, escolas: '', alunos: '' } });
    expect(respondida('etapas')).toBe(false);
  });
  it('a soma por ano de uma etapa conta como estudantes', () => {
    S().responder('etapas', { fund2: { on: true, escolas: 4, anos: [100, 100, 100, 100], soTotal: false } });
    expect(respondida('etapas')).toBe(true);
    expect(respostaReal(S().estado(), 'etapas')).toBe(true);
  });
  it('número zero e tamanho do teste vazio não contam', () => {
    S().responder('elegiveis', 0);
    expect(respondida('elegiveis')).toBe(false);
    S().responder('elegiveis', 1200);
    expect(respondida('elegiveis')).toBe(true);
    S().responder('testes', ['piloto']);
    ['escolas', 'participantes', 'meses'].forEach((k) => S().responder('piloto.' + k, ''));
    expect(respondida('piloto')).toBe(false);
    S().responder('piloto.escolas', 5);
    expect(respondida('piloto')).toBe(true);
  });
  it('internet parcial exige escolas > 0', () => {
    S().responder('internet', 'parcial');
    S().responder('escolasInternet', 0);
    expect(respondida('internet')).toBe(false);
    S().responder('escolasInternet', 3);
    expect(respondida('internet')).toBe(true);
  });
});

describe('PER-01, PER-02: subcategorias e outro problema moram em ctx', () => {
  it('refinar grava subs e problemaOutro em ctx com origem refinado, não em caso', () => {
    S().refinar('subs', ['C4a', 'C4b']);
    S().refinar('problemaOutro', 'Outro assunto');
    expect(S().ctx.subs).toEqual(['C4a', 'C4b']);
    expect(S().ctx.problemaOutro).toBe('Outro assunto');
    expect((S().caso as any).subs).toBeUndefined();
    expect(origemDe(S().estado(), 'subs')).toBe('refinado');
    expect(origemDe(S().estado(), 'problemaOutro')).toBe('refinado');
  });
  it('o texto de "outro problema" entra na descrição sugerida do caso', () => {
    S().refinar('problemaOutro', 'Falta de internet nas escolas rurais');
    expect(S().ctx.olhando).toMatch(/Falta de internet/);
    expect(String(S().caso.problema)).toMatch(/Falta de internet/);
  });
  it('subcategorias alternam na ordem do catálogo', () => {
    let subs = alternarOpcao('subs', [], ORDEM_SUBS, 'C4b', true);
    subs = alternarOpcao('subs', subs, ORDEM_SUBS, 'C4a', true);
    expect(subs).toEqual(['C4a', 'C4b']);
    expect(alternarOpcao('subs', subs, ORDEM_SUBS, 'C4a', false)).toEqual(['C4b']);
  });
  it('as subcategorias vão para o plano (perfil do caso)', () => {
    S().responder('prioridades', ['com']);
    S().responder('problemas', ['C4']);
    S().refinar('subs', ['C4a']);
    expect(JSON.stringify(S().exportar())).toContain('C4a');
  });
});

describe('PER-15: marcar todos por prioridade (Refinar) sem limite', () => {
  const grupo = (PRIORIDADES as any[])[0];
  const ids: string[] = grupo.problemas.map((q: any) => q.id);
  it('marca e desmarca todos os problemas da prioridade, na ordem do catálogo', () => {
    const todos = problemasDoGrupo([], ORDEM_PROBLEMAS, ids, true);
    expect(todos).toEqual(ids);
    expect(todos.length).toBeGreaterThan(3);
    expect(problemasDoGrupo(todos, ORDEM_PROBLEMAS, ids, false)).toEqual([]);
  });
  it('desmarcar um grupo não mexe nos problemas de outro', () => {
    const outro = (PRIORIDADES as any[])[2].problemas[0].id;
    const r = problemasDoGrupo([...ids, outro], ORDEM_PROBLEMAS, ids, false);
    expect(r).toEqual([outro]);
  });
  it('o store aceita mais de três problemas', () => {
    S().responder('prioridades', ['governar']);
    S().responder('problemas', problemasDoGrupo([], ORDEM_PROBLEMAS, ids, true));
    expect(S().ctx.problemas.length).toBe(ids.length);
    expect(respondida('problemas')).toBe(true);
  });
});

describe('PER-03: detalhe da linha de base', () => {
  it('grava problemas e medida em caso, com origem refinado, e o plano deixa de pedir a medida', () => {
    S().responder('linhaBase', 'sim');
    const tem = () => recomendacoesDe(S().estado()).some((r: any) => r.id === 'R-11');   // R2: era linha-base-medida
    expect(tem()).toBe(true);
    S().refinar('linhaBaseMedida', 'Avaliação estadual de leitura do 5º ano, 2025');
    S().refinar('linhaBaseProblemas', ['C4']);
    expect(S().caso.linhaBaseMedida).toMatch(/Avaliação estadual/);
    expect(S().caso.linhaBaseProblemas).toEqual(['C4']);
    expect(origemDe(S().estado(), 'linhaBaseMedida')).toBe('refinado');
    expect(tem()).toBe(false);
  });
  it('com "Não" os dados ficam guardados', () => {
    S().responder('linhaBase', 'parcial');
    S().refinar('linhaBaseMedida', 'Medida X');
    S().responder('linhaBase', 'nao');
    expect(S().caso.linhaBaseMedida).toBe('Medida X');
  });
  it('texto livre quando não há problema marcado', () => {
    S().refinar('linhaBaseProblemaTxt', 'Leitura no 5º ano');
    expect(S().caso.linhaBaseProblemaTxt).toBe('Leitura no 5º ano');
  });
});

describe('PER-04, PER-28: detalhes da governança', () => {
  it('"Qual?" e "O que falta?" ficam em respDet; mudar para Não os conserva', () => {
    S().responderGov('g-comite', 'parcial');
    S().responderGov('g-comite', 'parcial', { qual: 'Comitê de IA' });
    S().responderGov('g-comite', 'parcial', { falta: 'Representante do jurídico' });
    expect(S().respDet['g-comite']).toEqual({ qual: 'Comitê de IA', falta: 'Representante do jurídico' });
    const r = respostaGov('parcial', 'nao', S().respDet['g-comite']);
    expect(r.valor).toBe('nao');
    S().responderGov('g-comite', r.valor, r.det);
    expect(S().resp['g-comite']).toBe('nao');
    expect(S().respDet['g-comite']!.qual).toBe('Comitê de IA');
    const volta = respostaGov('nao', 'parcial', S().respDet['g-comite']);
    S().responderGov('g-comite', volta.valor, volta.det);
    expect(S().respDet['g-comite']!.falta).toBe('Representante do jurídico');
  });
  it('sem texto digitado, trocar para Não apaga o detalhe vazio como antes', () => {
    S().responderGov('g-dados', 'sim');
    const r = respostaGov('sim', 'nao', S().respDet['g-dados']);
    expect(r.det).toBeUndefined();
    S().responderGov('g-dados', r.valor, r.det);
    expect(S().respDet['g-dados']).toBeUndefined();
  });
  it('clicar de novo na resposta marcada a limpa (PER-28) e a tela deixa de contar', () => {
    ['g-comite', 'g-politica', 'g-legislacao', 'g-dados', 'g-etica', 'g-compras'].forEach((g) => S().responderGov(g, 'sim'));
    expect(respondida('governanca')).toBe(true);
    const r = respostaGov('sim', 'sim');
    expect(r.valor).toBe('');
    S().responderGov('g-etica', r.valor, r.det);
    expect(respondida('governanca')).toBe(false);
  });
  it('só Sim e Em parte pedem detalhe', () => {
    expect(pedeDetalhe('sim')).toBe(true);
    expect(pedeDetalhe('parcial')).toBe(true);
    expect(pedeDetalhe('nao')).toBe(false);
    expect(pedeDetalhe(undefined)).toBe(false);
  });
});

describe('PER-05: lista de ferramentas', () => {
  it('2.3.2 = Sim cria as linhas e a lista é editável', () => {
    S().responder('nFerramentas', '2');
    S().responder('conheceFerramentas', 'sim');
    expect(S().caso.ferramentas.length).toBe(2);
    let lista = ferramentaAlterada(S().caso.ferramentas, 0, { nome: 'Copiloto', preco: 12.5 });
    S().refinar('ferramentas', lista);
    expect(S().caso.ferramentas[0].nome).toBe('Copiloto');
    expect(S().caso.ferramentas[0].preco).toBe(12.5);
    expect(origemDe(S().estado(), 'ferramentas')).toBe('refinado');
    lista = ferramentaAdicionada(S().caso.ferramentas, S().caso);
    expect(lista.length).toBe(3);
    expect(ferramentaRemovida(lista, 1).length).toBe(2);
  });
  it('a primeira da lista espelha o tipo e o pagamento de 2.3.4 e 2.3.5', () => {
    S().responder('conheceFerramentas', 'sim');
    S().refinar('tipoTec', 'paga');
    S().refinar('pagamento', 'usuario');
    expect(S().caso.ferramentas[0].tipoTec).toBe('paga');
    expect(S().caso.ferramentas[0].pagamento).toBe('usuario');
    const nova = ferramentaAdicionada([], { tipoTec: 'paga', pagamento: 'usuario' });
    expect(nova[0].tipoTec).toBe('paga');
    expect(nova[0].pagamento).toBe('usuario');
  });
  it('as tarefas da ferramenta seguem a ordem das tarefas marcadas', () => {
    let l = ferramentaAdicionada([], {});
    l = ferramentaTarefa(l, 0, 'materiais', true, ['tutoria', 'planos_aula', 'materiais']);
    l = ferramentaTarefa(l, 0, 'tutoria', true, ['tutoria', 'planos_aula', 'materiais']);
    expect(l[0].tarefas).toEqual(['tutoria', 'materiais']);
    l = ferramentaTarefa(l, 0, 'tutoria', false, ['tutoria', 'planos_aula', 'materiais']);
    expect(l[0].tarefas).toEqual(['materiais']);
  });
  it('o preço informado da ferramenta principal muda a estimativa', () => {
    S().responder('tarefas', ['tutoria']);
    S().responder('tipoTec', 'paga');
    S().responder('pagamento', 'usuario');
    S().responder('usuarios', ['estudantes']);
    S().responder('etapas', { fund2: { on: true, escolas: 10, alunos: 2000, soTotal: true } });
    S().responder('testes', ['piloto']);
    S().responder('conheceFerramentas', 'sim');
    S().refinar('ferramentas', ferramentaAlterada(S().caso.ferramentas, 0, { nome: 'Tutor', preco: 1 }));
    const barato = numerosDe(S().estado()).total;
    S().refinar('ferramentas', ferramentaAlterada(S().caso.ferramentas, 0, { preco: 40 }));
    const caro = numerosDe(S().estado()).total;
    expect(caro).toBeGreaterThan(barato);
    const cotacao = () => recomendacoesDe(S().estado()).some((r: any) => r.id === 'R-58');   // R2: era ferramentas-cotacao
    expect(cotacao()).toBe(false);
    S().refinar('ferramentas', ferramentaAlterada(S().caso.ferramentas, 0, { preco: '' }));
    expect(cotacao()).toBe(true);
  });
});

describe('PER-06: arquitetura', () => {
  it('a presumida segue a tecnologia e o pagamento; a escolha grava e vira a arquitetura do caso', () => {
    expect(arquiteturaPresumida({ tipoTec: 'aberta' })).toBe('ow');
    expect(arquiteturaPresumida({ pagamento: 'consumo' })).toBe('api');
    expect(arquiteturaPresumida({ tipoTec: 'paga', pagamento: 'usuario' })).toBe('saas');
    expect(arquiteturaPresumida({ tipoTec: 'paga', arquitetura: 'ow' })).toBe('saas');
    expect(rotuloArquitetura('api')).toMatch(/API/);
    S().refinar('arquitetura', 'api');
    expect(S().caso.arquitetura).toBe('api');
    expect(origemDe(S().estado(), 'arquitetura')).toBe('refinado');
    S().refinar('arquitetura', 'nao_sei');
    expect(S().caso.arquitetura).toBe('nao_sei');
  });
  it('a arquitetura aparece nas premissas do capítulo 3 (que antes ficava vazio)', () => {
    expect(camposRefinar(3)).toContain('arquitetura');
  });
});

describe('PER-14: estudantes por ano ou série', () => {
  it('somar os anos dá o total da etapa e o total da rede', () => {
    let et = etapaEditada({}, 'fund2', { on: true, escolas: 4 }, 4);
    [100, 200, 300, 400].forEach((v, i) => { et = etapaEditada(et, 'fund2', { ano: { i, v } }, 4); });
    S().refinar('etapas', et);
    expect(alunosEtapa(S().ctx, 'fund2')).toBe(1000);
    expect(totaisCtx(S().ctx).alunos).toBe(1000);
    expect(et.fund2.soTotal).toBe(false);
  });
  it('mexer nas escolas não troca o modo nem apaga a soma por ano de um caso importado', () => {
    const v13 = { fund1: { on: true, escolas: 3, anos: [10, 10, 10, 10, 10], soTotal: false } };
    const et = etapaEditada(v13, 'fund1', { escolas: 5 }, 5);
    expect(et.fund1.soTotal).toBe(false);
    expect(et.fund1.anos).toEqual([10, 10, 10, 10, 10]);
    expect(et.fund1.escolas).toBe(5);
  });
  it('informar só o total guarda os anos; voltar a detalhar recupera a soma', () => {
    let et: any = { medio: { on: true, escolas: 2, anos: [50, 50, 50], soTotal: false } };
    et = etapaEditada(et, 'medio', { soTotal: true }, 3);
    expect(et.medio.alunos).toBe(150);
    et = etapaEditada(et, 'medio', { alunos: 400 }, 3);
    expect(et.medio.soTotal).toBe(true);
    expect(et.medio.anos).toEqual([50, 50, 50]);
    et = etapaEditada(et, 'medio', { soTotal: false }, 3);
    S().refinar('etapas', et);
    expect(alunosEtapa(S().ctx, 'medio')).toBe(150);
  });
  it('as etapas sem anos só aceitam total', () => {
    expect(anosDaEtapa('superior')).toEqual([]);
    expect(anosDaEtapa('fund2').length).toBe(4);
    expect(anosDaEtapa('medio').length).toBe(3);
  });
});

describe('PER-07: aviso "revisar"', () => {
  const montar = () => {
    S().responder('usuarios', ['professores']);
    S().responder('afetados', ['estudantes']);
    S().responder('tarefas', ['tutoria']);
  };
  it('mudar as tarefas depois de confirmar o 2.2 gera pendências, sem trocar a resposta', () => {
    montar();
    const e = S().estado();
    expect(e.revisar.length).toBeGreaterThan(0);
    expect(e.caso.usuarios).toEqual(['professores']);
    const p = pendenciasRevisar(e);
    expect(p.length).toBeGreaterThan(0);
    expect(p.map((x) => x.campo)).toEqual(expect.arrayContaining(['usuarios']));
    expect(nomesDoValor('usuarios', p.find((x) => x.campo === 'usuarios')!.valor)).toMatch(/Professores|Estudantes/);
  });
  it('aceitar a nova sugestão grava o valor novo e o aviso some', () => {
    montar();
    const p = pendenciasRevisar(S().estado()).find((x) => x.campo === 'usuarios')!;
    S().responder('usuarios', p.valor);
    expect(S().caso.usuarios).toEqual(p.valor);
    expect(pendenciasRevisar(S().estado()).some((x) => x.campo === 'usuarios')).toBe(false);
    expect(S().revisar).not.toContain('usuarios');
  });
  it('manter a resposta tira o campo da lista', () => {
    montar();
    S().marcarRevisado('afetados');
    expect(S().revisar).not.toContain('afetados');
    expect(pendenciasRevisar(S().estado()).some((x) => x.campo === 'afetados')).toBe(false);
  });
  it('sem tarefas mudadas não há aviso', () => {
    expect(pendenciasRevisar(S().estado())).toEqual([]);
  });
});

describe('PER-21: "nenhuma" é exclusiva em 2.2.3', () => {
  const ordem = ['nenhuma', 'nota', 'decide'];
  it('marcar "nenhuma" limpa as outras e marcar outra limpa "nenhuma"', () => {
    let v = alternarOpcao('consequencias', ['nota', 'decide'], ordem, 'nenhuma', true);
    expect(v).toEqual(['nenhuma']);
    v = alternarOpcao('consequencias', v, ordem, 'nota', true);
    expect(v).toEqual(['nota']);
    v = alternarOpcao('consequencias', v, ordem, 'decide', true);
    expect(v).toEqual(['nota', 'decide']);
  });
  it('outros campos continuam aceitando várias opções', () => {
    expect(alternarOpcao('usuarios', ['professores'], ['professores', 'gestores'], 'gestores', true)).toEqual(['professores', 'gestores']);
  });
});

describe('PER-20, PER-24, PER-25, PER-26: premissas, ajuda, etiquetas', () => {
  it('declara a premissa de 1 professor para cada 25 estudantes quando só professores usam', () => {
    S().responder('etapas', { fund2: { on: true, escolas: 10, alunos: 2500, soTotal: true } });
    S().responder('usuarios', ['professores']);
    const notas = notasPremissa(S().estado(), 'elegiveis');
    expect(origemDe(S().estado(), 'elegiveis')).toBe('sugerido');
    expect(notas.join(' ')).toMatch(/1 professor para cada 25 estudantes/);
    S().responder('usuarios', ['estudantes']);
    expect(notasPremissa(S().estado(), 'elegiveis').join(' ')).not.toMatch(/professor/);
  });
  it('declara a premissa de uma ferramenta por vez e a de dispositivos próprios', () => {
    S().responder('testes', ['piloto']);
    expect(notasPremissa(S().estado(), 'nFerramentas').join(' ')).toMatch(/uma ferramenta por vez/);
    S().responder('modeloDisp', 'proprio');
    expect(notasPremissa(S().estado(), 'dispExistem').join(' ')).toMatch(/dispositivos próprios/);
    S().responder('dispExistem', 'nao');
    expect(notasPremissa(S().estado(), 'dispExistem')).toEqual([]);
  });
  it('a ajuda das telas compostas junta os campos e o teste usa as variantes', () => {
    const a = ajudaDaTela(S().caso, tela('afetados'));
    expect(a.length).toBeGreaterThan(0);
    const e1 = ajudaDaTela(S().caso, tela('etapas')).join(' ');
    expect(e1).toMatch(/Marque uma ou mais/);
    expect(e1).toMatch(/cada ano ou série/);
    expect(ajudaDaTela(S().caso, tela('governanca'))).toEqual([]);
    S().responder('testes', ['poc']);
    expect(ajudaDaTela(S().caso, tela('piloto')).join(' ')).toMatch(/prova de conceito/);
    S().responder('testes', ['poc', 'piloto']);
    expect(ajudaDaTela(S().caso, tela('piloto')).join(' ')).toMatch(/Primeiro a prova de conceito/);
  });
  it('legendas dos chips vêm do subtexto das opções', () => {
    const imp = legendasOpc([['a', 'A', ''], ['b', 'B', 'Ex.: x'], ['outro', 'Outro', 'Descreva']]);
    expect(imp).toEqual([['B', 'Ex.: x']]);
  });
  it('tarefa ligada ao impacto marcado leva a etiqueta', () => {
    expect(sugeridaPeloImpacto(['aprendizagem'], 'tutoria')).toBe(true);
    expect(sugeridaPeloImpacto(['aprendizagem'], 'duvidas')).toBe(false);
    expect(sugeridaPeloImpacto([], 'tutoria')).toBe(false);
  });
});

describe('TRA-26: erro curto no campo numérico', () => {
  it('zero onde não cabe e valor acima do total da rede', () => {
    expect(erroNumero(0)).toBeTruthy();
    expect(erroNumero(0, { permiteZero: true })).toBeUndefined();
    expect(erroNumero(5)).toBeUndefined();
    expect(erroNumero('')).toBeUndefined();
    expect(erroNumero(50, { max: 40 })).toMatch(/40/);
    expect(erroNumero(40, { max: 40 })).toBeUndefined();
    expect(erroNumero(10, { max: 0 })).toBeUndefined();
  });
  it('inteiro e numeroDe normalizam o que vem do campo', () => {
    expect(inteiro(12.6)).toBe(13);
    expect(inteiro(-3)).toBe(0);
    expect(inteiro('')).toBe('');
    expect(numeroDe('15')).toBe(15);
    expect(numeroDe('')).toBe('');
    expect(numeroDe(undefined)).toBe('');
    expect(numeroDe('abc')).toBe('');
  });
});

describe('âncoras da síntese (#/capitulo/:n/sintese/:campo)', () => {
  it('os detalhes do Refinar são do capítulo 1 e têm id estável', () => {
    expect(extrasDoCapitulo(1).map((x) => x.id)).toEqual(['grade', 'subs', 'problemaOutro', 'linhaBase', 'governanca']);
    expect(extrasDoCapitulo(2)).toEqual([]);
    expect(EXTRAS_REFINAR.every((x) => /^[a-zA-Z]+$/.test(x.id))).toBe(true);
  });
  it('campos de detalhe apontam para o bloco e para o capítulo certos', () => {
    expect(idDoFoco('linhaBaseMedida')).toBe('linhaBase');
    expect(idDoFoco('g-comite')).toBe('governanca');
    expect(idDoFoco('ferramentas')).toBe('ferramentas');
    expect(capituloDoCampo('subs')).toBe(1);
    expect(capituloDoCampo('problemaOutro')).toBe(1);
    expect(capituloDoCampo('linhaBaseMedida')).toBe(1);
    expect(capituloDoCampo('arquitetura')).toBe(3);
    expect(href.campo('subs')).toBe('#/capitulo/1/sintese/subs');
    expect(href.campo('arquitetura')).toBe('#/capitulo/3/sintese/arquitetura');
    expect(href.campo('ferramentas')).toBe('#/capitulo/2/sintese/ferramentas');
  });
  it('compara números de pergunta por partes', () => {
    expect(comparaN('1.2.7', '1.3')).toBeLessThan(0);
    expect(comparaN('1.2.10', '1.2.9')).toBeGreaterThan(0);
    expect(comparaN('2.0', '2.0')).toBe(0);
    expect(['2.3.3', '1.3', '1.2.2', '2.0'].sort(comparaN)).toEqual(['1.2.2', '1.3', '2.0', '2.3.3']);
  });
});
