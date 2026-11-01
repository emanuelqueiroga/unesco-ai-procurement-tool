import {beforeEach,describe,it,expect} from 'vitest';
import {renderToString} from 'react-dom/server';
import {useCaso,telasAtivas} from '../../src/store';
import {OpcoesPrioridades} from '../../src/percurso/Controles';
import {confirmarPrioridades} from '../../src/percurso/confirmarPrioridades';
import {capitulosNav} from '../../src/screens/Shell';
const S=()=>useCaso.getState();
beforeEach(()=>S().carregarExemplo('novo'));
describe('v015: prioridades só alteram o percurso ao confirmar',()=>{
 it('renderiza seleções locais sem alterar o caso, navegação ou progresso',()=>{
  const antes=JSON.stringify(S().estado()),nav=JSON.stringify(capitulosNav(S(),{capitulo:1,tela:'prioridades'}));
  for(const ids of [['governar'],['sobre'],['com'],['para'],['governar','sobre','com','para'],[]]){
   const html=renderToString(<OpcoesPrioridades atual={ids} onChange={()=>{}}/>);
   expect((html.match(/checked=""/g)||[]).length).toBe(ids.length);
   expect(JSON.stringify(S().estado())).toBe(antes);expect(JSON.stringify(capitulosNav(S(),{capitulo:1,tela:'prioridades'}))).toBe(nav);
  }
 });
 it.each([['governar','problemas'],['sobre','problemas'],['com','etapas'],['para','etapas']])('ao confirmar %s, ativa o percurso e segue para %s',(id,prox)=>{
  expect(confirmarPrioridades([id])).toBe('#/capitulo/1/'+prox);expect(S().ctx.prioridades).toEqual([id]);expect(telasAtivas(S()).some(q=>q.id===prox)).toBe(true);
 });
 it('confirma a combinação de uma vez e conserva respostas de outras frentes',()=>{
  S().responder('govOrcamento.itens.equipe.valor',500);S().responder('letramento.contexto.detalhe','Nota anterior');
  expect(confirmarPrioridades(['com','governar','sobre'])).toBe('#/frentes');expect(S().ctx.prioridades).toEqual(['governar','sobre','com']);expect(S().ctx.govOrcamento.itens.equipe.valor).toBe(500);expect(S().ctx.letramento.contexto.detalhe).toBe('Nota anterior');
 });
 it('não confirma uma seleção vazia ou desconhecida e mantém o percurso anterior',()=>{
  S().responder('prioridades',['governar']);const antes=JSON.stringify(S().estado());expect(confirmarPrioridades([])).toBeNull();expect(confirmarPrioridades(['inexistente'])).toBeNull();expect(JSON.stringify(S().estado())).toBe(antes);
 });
});
