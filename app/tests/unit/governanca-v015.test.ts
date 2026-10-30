import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { useCaso, telasAtivas, telasDoCapitulo, proximaTela, telaAnterior, faltamDe, telaRespondida, telaDoCampo, progressoDe, migrar, numerosDe } from '../../src/store';
import { somenteGovernanca, tamanhoRedeValido, totaisCtx, PRIORIDADES, sugestoesProblemas, setLang } from '../../src/domain';
import { dadosCaso } from '../../src/export/json';
import { destinoContinuar, tituloDaAba } from '../../src/screens/transversal';
import { painelDe } from '../../src/percurso/painel';
import { sinteseCapitulo } from '../../src/percurso/sintese';
const S = () => useCaso.getState();
const selecionar = () => S().responder('prioridades', ['governar']);
const rede = () => S().responder('redeNacional', { escolas: 12345, estudantes: 1600000 });
beforeEach(() => { setLang('pt'); S().carregarExemplo('novo'); });

describe('v015: governança nacional', () => {
  it('pula etapas só quando governança é a única prioridade; avanço, retorno e contadores concordam', () => {
    expect(telasAtivas(S())).toHaveLength(23);
    selecionar();
    S().irPara(1, 'prioridades');
    expect(somenteGovernanca(S().ctx)).toBe(true);
    expect(proximaTela(S())?.id).toBe('problemas');
    expect(telasAtivas(S())).toHaveLength(22);
    expect(telasDoCapitulo(1, S())).toHaveLength(8);
    expect(progressoDe(S())[0].total).toBe(8);
    S().irPara(1, 'problemas');
    expect(telaAnterior(S())?.id).toBe('prioridades');
    expect(tituloDaAba({ tipo: 'pergunta', n: 1, tela: 'problemas' }, S())).toMatch(/^Pergunta 3 de 22/);
    S().responder('prioridades', ['governar', 'com']);
    S().irPara(1, 'prioridades');
    expect(proximaTela(S())?.id).toBe('etapas');
    expect(telasAtivas(S())).toHaveLength(23);
    expect(somenteGovernanca({ prioridades: [] })).toBe(false);
  });
  it('retoma em desafios quando a posição salva era a tela de etapas agora pulada', () => {
    selecionar(); S().irPara(1, 'etapas');
    expect(destinoContinuar(S(), faltamDe(S())).href).toBe('#/capitulo/1/problemas');
    expect(faltamDe(S()).some(t => t.id === 'etapas')).toBe(false);
    expect(painelDe(S()).faltam).toBe(21); // prioridade respondida de 22 telas ativas
  });
  it('exige um desafio e os dois totais válidos; não toma uma etapa antiga como a rede nacional', () => {
    S().responder('etapas', { fund1: { on: true, escolas: 10, alunos: 3000, soTotal: true } });
    selecionar(); S().responder('problemas', ['G11']);
    const tela = telaDoCampo('problemas')!;
    expect(totaisCtx(S().ctx).alunos).toBe(0);
    expect(telaRespondida(S(), tela)).toBe(false);
    S().responder('redeNacional.escolas', 12345);
    expect(telaRespondida(S(), tela)).toBe(false);
    S().responder('redeNacional.estudantes', 0);
    expect(telaRespondida(S(), tela)).toBe(false);
    rede();
    expect(telaRespondida(S(), tela)).toBe(true);
    expect(tamanhoRedeValido({ redeNacional: { escolas: 1.5, estudantes: 3 } })).toBe(false);
    expect(tamanhoRedeValido({ redeNacional: { escolas: -1, estudantes: 3 } })).toBe(false);
    expect(tamanhoRedeValido({ redeNacional: { escolas: Infinity, estudantes: 3 } })).toBe(false);
  });
  it('usa os totais nacionais no plano e preserva as etapas ao alternar prioridades', () => {
    const etapas = { fund1: { on: true, escolas: 10, alunos: 3000, soTotal: true } };
    S().responder('etapas', etapas); selecionar(); rede();
    expect(totaisCtx(S().ctx)).toMatchObject({ escolas: 12345, alunos: 1600000, etapas: [] });
    expect(sinteseCapitulo(1, S()).paragrafos[0]).toContain('12.345 escolas e 1.600.000 estudantes');
    expect(S().ctx.etapas).toEqual(etapas);
    S().responder('prioridades', ['governar', 'com']);
    expect(totaisCtx(S().ctx).alunos).toBe(3000);
    expect(S().ctx.redeNacional.estudantes).toBe(1600000);
    selecionar();
    expect(totaisCtx(S().ctx).alunos).toBe(1600000);
  });
  it('exporta e importa os totais, novos desafios e escolhas legadas sem trocar seus ids', () => {
    selecionar(); rede(); S().responder('problemas', ['G1', 'G11', 'G16']);
    const r = migrar(JSON.stringify(dadosCaso(S())));
    expect(r.ctx.problemas).toEqual(['G1', 'G11', 'G16']);
    expect(r.ctx.redeNacional).toEqual({ escolas: 12345, estudantes: 1600000 });
    expect(telasAtivas(r)).toHaveLength(22);
    expect(totaisCtx(r.ctx).alunos).toBe(1600000);
  });
  it('oferece oito novos desafios sem gerar automaticamente uma tarefa ou números de metas', () => {
    const grupo: any = (PRIORIDADES as any[]).find(p => p.id === 'governar');
    const novos = grupo.problemas.filter((q: any) => q.v015);
    expect(novos).toHaveLength(8);
    expect(new Set(grupo.problemas.map((q: any) => q.id)).size).toBe(18);
    const s = sugestoesProblemas({ prioridades: ['governar'], problemas: novos.map((q: any) => q.id) });
    expect(s.semFerramenta).toBe(true);
    expect(s.tarefas).toEqual([]);
    expect(s.resultado).toContain('__');
    expect(s.problema).toMatch(/^Desafios selecionados:/);
  });
  it('mudanças do tamanho da rede atualizam a estimativa quando há um uso de IA definido', () => {
    selecionar(); rede(); S().responder('testes', ['piloto']); S().responder('tarefas', ['tutoria']);
    S().responder('usuarios', ['estudantes']); S().responder('tipoTec', 'paga');
    const antes = numerosDe(S()).total;
    S().responder('redeNacional.estudantes', 2000000);
    expect(numerosDe(S()).total).not.toBe(antes);
  });
  it('tem traduções para todos os rótulos dos novos desafios nos idiomas publicados', () => {
    const grupo: any = (PRIORIDADES as any[]).find(p => p.id === 'governar');
    const chaves = [grupo.nome, ...grupo.problemas.filter((q: any) => q.v015).flatMap((q: any) => [q.t, q.desc])];
    for (const lang of ['en', 'es', 'fr', 'ar', 'zh', 'bm', 'zu', 'sw']) {
      const d = JSON.parse(readFileSync(new URL(`../../src/i18n/${lang}.json`, import.meta.url), 'utf8'));
      chaves.forEach(k => expect(d[k], `${lang}: ${k}`).toBeTruthy());
    }
  });
});
