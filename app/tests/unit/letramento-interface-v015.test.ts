import { beforeEach, describe, expect, it } from 'vitest';
import { useCaso, telasAtivas, faltamDe } from '../../src/store';
import { setLang } from '../../src/domain';
import { alterarLit, camposLetramento, campoLitRespondido, custosLetramento, lerLit, planoLetramento } from '../../src/percurso/letramento';
import { destinoContinuar, tituloDaAba } from '../../src/screens/transversal';
import { entradaEtapaLit, vizinhosLit, selecionarLit, gruposCamposLit, pendenciasCamposLit, pendenciasCustosLit, rotuloVisivelLit } from '../../src/percurso/letramentoInterface';
const S = () => useCaso.getState();
const g = (caminho: string, v: any) => S().responder('letramento', alterarLit(S().ctx.letramento, caminho, v));
function iniciar(ids = ['A13']) { S().escolherPais('BRA'); S().responder('prioridades', ['sobre']); S().responder('problemas', ids); }
beforeEach(() => { setLang('pt'); S().carregarExemplo('novo'); });

describe('v015: navegação e organização de Educar sobre a IA', () => {
  /* versão de teste (fluxos enxutos, 04/11/2026): fixa telas/campos que saíram do fluxo; coberto por fluxos-enxutos-teste.test.ts */ it.skip('avança e volta entre as quatro etapas sem exigir aberturas ou sínteses intermediárias', () => {
    iniciar();
    expect(vizinhosLit(S(), 'lit-alcance')).toEqual({ anterior: '#/capitulo/1/problemas', proxima: '#/capitulo/2/lit-diagnostico' });
    expect(vizinhosLit(S(), 'lit-desenho').proxima).toBe('#/capitulo/3/lit-oferta');
    expect(vizinhosLit(S(), 'lit-recursos').proxima).toBe('#/capitulo/4/lit-revisao');
    expect(vizinhosLit(S(), 'lit-revisao')).toEqual({ anterior: '#/capitulo/3/lit-recursos', proxima: '#/plano' });
  });
  /* versão de teste (fluxos enxutos, 04/11/2026): fixa telas/campos que saíram do fluxo; coberto por fluxos-enxutos-teste.test.ts */ it.skip('recalcula vizinhos quando recursos digitais, validação, projeto e currículo entram ou saem', () => {
    iniciar(['A13','A16']); g('oferta.validacao', { escolhas: ['sim'] }); g('oferta.recursos', { escolhas: ['ia'] });
    expect(telasAtivas(S()).filter(t => t.capitulo === 3).map(t => t.id)).toEqual(['lit-oferta','lit-validacao','lit-digital','lit-projeto','lit-acoes','lit-recursos']);
    expect(vizinhosLit(S(),'lit-desenho').proxima).toBe('#/capitulo/2/lit-curriculo');
    expect(vizinhosLit(S(),'lit-oferta').proxima).toBe('#/capitulo/3/lit-validacao');
    g('oferta.validacao',{ escolhas: ['nao'] }); g('oferta.recursos',{ escolhas: ['nenhum'] });
    expect(vizinhosLit(S(),'lit-acoes').anterior).toBe('#/capitulo/3/lit-oferta');
  });
  /* versão de teste (fluxos enxutos, 04/11/2026): fixa telas/campos que saíram do fluxo; coberto por fluxos-enxutos-teste.test.ts */ it.skip('o link da etapa retoma a primeira resposta que falta e permite revisar uma etapa respondida', () => {
    iniciar(); expect(entradaEtapaLit(S(),2)).toBe('#/capitulo/2/lit-diagnostico');
    for (const f of camposLetramento(S()).filter(f=>f.tela==='lit-diagnostico')) g(f.caminho,{ escolhas: ['_pendente'] });
    expect(entradaEtapaLit(S(),2)).toBe('#/capitulo/2/lit-desenho');
    for (const f of camposLetramento(S()).filter(f=>f.tela==='lit-desenho')) g(f.caminho,{ escolhas: ['_pendente'] });
    expect(entradaEtapaLit(S(),2)).toBe('#/capitulo/2/lit-diagnostico');
  });
  /* versão de teste (fluxos enxutos, 04/11/2026): fixa telas/campos que saíram do fluxo; coberto por fluxos-enxutos-teste.test.ts */ it.skip.each(['A11','A12','A14'])('o público escolar %s pode informar etapas e escolas sem criar licenças', id => {
    iniciar([id]); expect(camposLetramento(S()).filter(f=>f.tela==='lit-alcance').map(f=>f.caminho)).toEqual(expect.arrayContaining(['alcance.etapas','alcance.escolas']));
    expect(S().caso.usuarios).toEqual([]);
  });
  it('equipes públicas, ensino superior e currículo isolados não exigem escolas de educação básica', () => {
    for (const id of ['A13','A15','A16']) { iniciar([id]); expect(camposLetramento(S()).some(f=>f.caminho==='alcance.escolas')).toBe(false); }
  });
  /* versão de teste (fluxos enxutos, 04/11/2026): fixa telas/campos que saíram do fluxo; coberto por fluxos-enxutos-teste.test.ts */ it.skip('agrupa todos os campos dos cinco públicos sem repetição nem perda de subgrupos do ensino superior', () => {
    iniciar(['A11','A12','A13','A14','A15','A16']); g('alcance.superior',{ escolhas: ['graduacao','pos','egressos'] });
    for (const tela of ['lit-alcance','lit-desenho','lit-oferta','lit-acoes']) {
      const grupos=gruposCamposLit(S(),tela), caminhos=grupos.flatMap(g=>g.campos.map(f=>f.caminho));
      expect(new Set(caminhos).size).toBe(caminhos.length);
      expect(new Set(caminhos)).toEqual(new Set(camposLetramento(S()).filter(f=>f.tela===tela).map(f=>f.caminho)));
    }
    const superior=gruposCamposLit(S(),'lit-alcance').find(g=>g.id==='A15')!;
    expect(superior.campos.filter(f=>f.caminho.includes('subgrupos.'))).toHaveLength(3);
    expect(superior.campos.some(f=>f.caminho==='alcance.superior')).toBe(true);
  });
  it('escolhas únicas e alternativas excludentes não acumulam estados incompatíveis', () => {
    expect(selecionarLit(['nenhum'],'materiais',true,true)).toEqual(['materiais']);
    expect(selecionarLit(['fundamentos','critica'],'_pendente',true,true)).toEqual(['_pendente']);
    expect(selecionarLit(['_pendente'],'fundamentos',true,true)).toEqual(['fundamentos']);
    expect(selecionarLit(['presencial'],'online',true)).toEqual(['online']);
    expect(selecionarLit(['fundamentos','critica'],'critica',false,true)).toEqual(['fundamentos']);
  });
  /* versão de teste (fluxos enxutos, 04/11/2026): fixa telas/campos que saíram do fluxo; coberto por fluxos-enxutos-teste.test.ts */ it.skip('encurta o rótulo do público sem apagar a distinção entre graduação, pós e egressos', () => {
    iniciar(['A15']); g('alcance.superior',{ escolhas:['graduacao','pos','egressos'] });
    const grupo=gruposCamposLit(S(),'lit-alcance').find(g=>g.id==='A15')!;
    expect(rotuloVisivelLit(grupo.campos.find(f=>f.caminho.endsWith('.elegiveis'))!,grupo.titulo)).toBe('Público elegível');
    for(const [id,nome] of [['graduacao','Graduação'],['pos','Pós-graduação'],['egressos','Egressos']]) {
      expect(rotuloVisivelLit(grupo.campos.find(f=>f.caminho.endsWith('.subgrupos.'+id))!,grupo.titulo)).toContain(nome);
    }
  });
  /* versão de teste (fluxos enxutos, 04/11/2026): fixa telas/campos que saíram do fluxo; coberto por fluxos-enxutos-teste.test.ts */ it.skip('as pendências identificam campos e custos precisos sem apagar notas nem números ao marcar a levantar', () => {
    iniciar(); g('publicos.A13.elegiveis',{ valor:100, detalhe:'Nota preservada' });
    expect(pendenciasCamposLit(S(),'lit-alcance').map(f=>f.caminho)).toContain('publicos.A13.participantes');
    const anterior=lerLit(S(),'publicos.A13.elegiveis'); g('publicos.A13.elegiveis',{...anterior,situacao:'a_levantar'});
    expect(lerLit(S(),'publicos.A13.elegiveis')).toMatchObject({valor:100,detalhe:'Nota preservada'});
    expect(campoLitRespondido(S(),camposLetramento(S()).find(f=>f.caminho==='publicos.A13.elegiveis')!)).toBe(true);
    expect(pendenciasCustosLit(S(),'lit-recursos')).toHaveLength(custosLetramento(S()).length);
    g('orcamento.itens.equipe',{ situacao:'sem_custo' }); expect(pendenciasCustosLit(S(),'lit-recursos').some(i=>i.id==='equipe')).toBe(false);
    g('orcamento.itens.equipe',{ situacao:'informado',valor:-1 }); expect(pendenciasCustosLit(S(),'lit-recursos').some(i=>i.id==='equipe')).toBe(true);
  });
  it('o tipo de recurso adicional permanece junto de seu item de orçamento e conserva os dados', () => {
    iniciar(); g('orcamento.adicionais.adicional-1.nome',{ escolhas:['transporte'] }); g('orcamento.itens.adicional-1',{ situacao:'informado',valor:250 });
    expect(gruposCamposLit(S(),'lit-recursos').flatMap(g=>g.campos).some(f=>f.caminho.startsWith('orcamento.adicionais.'))).toBe(false);
    expect(camposLetramento(S()).find(f=>f.caminho==='orcamento.adicionais.adicional-1.nome')).toBeDefined();
    expect(pendenciasCustosLit(S(),'lit-recursos').some(i=>i.id==='adicional-1')).toBe(false);
  });
  /* versão de teste (fluxos enxutos, 04/11/2026): fixa telas/campos que saíram do fluxo; coberto por fluxos-enxutos-teste.test.ts */ it.skip('currículo isolado reúne inclusão no desenho curricular, sem uma tela vazia de participantes', () => {
    iniciar(['A13','A16']); g('alcance.inclusao',{escolhas:['acessibilidade'],detalhe:'Condição preservada'});
    S().responder('problemas',['A16']);
    expect(telasAtivas(S())).toHaveLength(10); expect(telasAtivas(S()).some(t=>t.id==='lit-alcance')).toBe(false);
    expect(camposLetramento(S()).find(f=>f.caminho==='alcance.inclusao')?.tela).toBe('lit-curriculo');
    expect(JSON.stringify(planoLetramento(S()))).toContain('Condição preservada');
    expect(tituloDaAba({tipo:'pergunta',n:2,tela:'lit-desenho'},S())).toContain('Abordagens e salvaguardas do currículo');
    expect(planoLetramento(S()).blocos.some(b=>b.titulo==='Abordagens e salvaguardas do currículo')).toBe(true);
  });
  /* versão de teste (fluxos enxutos, 04/11/2026): fixa telas/campos que saíram do fluxo; coberto por fluxos-enxutos-teste.test.ts */ it.skip('retoma o alcance salvo de um currículo na tela equivalente e restaura públicos sem apagar quantidades', () => {
    iniciar(['A13','A16']); g('publicos.A13.elegiveis',{valor:150});
    S().responder('problemas',['A16']); S().irPara(1,'lit-alcance'); expect(destinoContinuar(S(),faltamDe(S())).href).toBe('#/capitulo/2/lit-curriculo');
    S().responder('problemas',['A13','A16']); expect(telasAtivas(S()).some(t=>t.id==='lit-alcance')).toBe(true);
    expect(lerLit(S(),'publicos.A13.elegiveis').valor).toBe(150);
    expect(camposLetramento(S()).find(f=>f.caminho==='alcance.inclusao')?.tela).toBe('lit-alcance');
  });
});
