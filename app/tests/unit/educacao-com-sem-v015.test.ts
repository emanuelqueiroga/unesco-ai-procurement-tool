import { beforeEach, describe, expect, it } from 'vitest';
import { useCaso, telasAtivas, telasDoCapitulo, faltamDe, progressoDe, telaDoCampo, telaRespondida, camposRefinar, extrasDoCapitulo } from '../../src/store';
import { PRIORIDADES, OPC, setLang, percursoEducacao, problemasMarcados } from '../../src/domain';
import { impactosEducacao } from '../../src/percurso/educacao';
import { destinoContinuar } from '../../src/screens/transversal';
const S=()=>useCaso.getState();
const grupo=()=>PRIORIDADES.find((p:any)=>p.id==='com')!;
function iniciar(ids=['C11']){S().escolherPais('BRA');S().responder('prioridades',['com']);S().responder('problemas',ids);}
beforeEach(()=>{setLang('pt');S().carregarExemplo('novo');});
describe('v015: Education with and without AI',()=>{
 it('mantém etapas e escolas e retira apenas as três telas solicitadas',()=>{
  iniciar();expect(percursoEducacao(S().ctx)).toBe(true);expect(telasAtivas(S())).toHaveLength(20);
  expect(telasDoCapitulo(1,S()).map(t=>t.id)).toEqual(['local','prioridades','etapas','problemas','impactos','governanca']);
  expect(telasAtivas(S()).some(t=>['problema','linhaBase','alternativa'].includes(t.id))).toBe(false);
  expect(progressoDe(S()).reduce((n,p)=>n+p.total,0)).toBe(20);
  expect(extrasDoCapitulo(1,S()).some(t=>t.id==='linhaBase')).toBe(false);
  expect(camposRefinar(1,S())).not.toContain('altCustoEfeito');
 });
 it('oferece onze temas novos sem reaproveitar os IDs antigos e aceita todos juntos',()=>{
  const novos=grupo().problemas.filter((q:any)=>q.educacao);expect(novos).toHaveLength(11);
  iniciar(novos.map((q:any)=>q.id));expect(problemasMarcados(S().ctx)).toHaveLength(11);
  expect(grupo().problemas.find((q:any)=>q.id==='C4')?.t).toContain('Professores dedicam');
  expect(novos.every((q:any)=>q.impactos.every((id:string)=>OPC.impactos.some((o:any)=>o[0]===id)))).toBe(true);
  expect(S().caso.tarefas).toEqual([]);
 });
 it.each(['C11','C12','C13','C14','C15','C16','C17','C18','C19','C20','C21'])('deriva todos os impactos de %s e atualiza a seleção sem pedir outra escolha',id=>{
  iniciar([id]);const esperado=grupo().problemas.find((q:any)=>q.id===id)!.impactos;
  expect(new Set(S().caso.impactos)).toEqual(new Set(esperado));expect(new Set(impactosEducacao(S()))).toEqual(new Set(esperado));
  expect(telaRespondida(S(),telaDoCampo('impactos')!)).toBe(true);
  S().responder('problemas',['C15']);expect(S().caso.impactos).toEqual(['desigualdade','inclusao']);
 });
 it('mantém a meta editada ao atualizar desafios e preserva os dados anteriores no JSON',()=>{
  S().responder('impactos',['tempo_docente']);iniciar();
  expect(S().ctx.impactosAnterioresEducacao.valores).toEqual(['tempo_docente']);
  S().responder('resultado','Atingir 80% em 12 meses para 200 estudantes.');
  S().responder('linhaBase','sim');S().refinar('linhaBaseMedida','Registro anterior');S().responder('alternativa','nao');
  S().responder('problemas',['C19','C20']);expect(S().caso.resultado).toContain('80%');
  S().importar(JSON.stringify(S().exportar()));expect(S().caso.resultado).toContain('80%');expect(S().caso.linhaBaseMedida).toBe('Registro anterior');
  expect(faltamDe(S()).some(t=>['problema','linhaBase','alternativa'].includes(t.id))).toBe(false);
  expect(S().caso.impactos).toContain('bem_estar');expect(S().caso.impactos).toContain('cidadania_global');
 });
 it('desmarcar todos os desafios também retira os impactos automáticos',()=>{
  iniciar(['C19']);S().responder('problemas',[]);expect(S().caso.impactos).toEqual([]);expect(impactosEducacao(S())).toEqual([]);expect(telaRespondida(S(),telaDoCampo('impactos')!)).toBe(false);
 });
 it('retoma links das telas removidas em impactos sem apagar a posição ou os dados salvos',()=>{
  iniciar();for(const id of ['problema','linhaBase','alternativa']){S().irPara(1,id);expect(destinoContinuar(S(),faltamDe(S())).href).toBe('#/capitulo/1/impactos');}
 });
 it('preserva os percursos de governança, letramento e a quarta prioridade',()=>{
  S().responder('prioridades',['governar']);expect(telasAtivas(S())).toHaveLength(11);
  S().responder('prioridades',['sobre']);expect(telasAtivas(S())).toHaveLength(10);
  S().responder('prioridades',['para']);expect(telasAtivas(S())).toHaveLength(23);
 });
});
