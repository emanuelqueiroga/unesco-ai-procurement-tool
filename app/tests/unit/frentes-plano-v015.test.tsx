// v016 (teste): testes marcados com it.skip fixavam o modelo da v015 que mudou de propósito (prioridade "para",
// tamanho da rede, período do orçamento, categorias antigas, públicos A13–A15, recurso adicional). Ver design/redesign/v016-teste/REQUISITOS-V016.md.
import {beforeEach,describe,it,expect} from 'vitest';
import {useCaso,telasAtivas,telaRespondida} from '../../src/store';
import {confirmarPrioridades} from '../../src/percurso/confirmarPrioridades';
import {abrirFrente,frentesDoPlano,frenteAtual} from '../../src/percurso/frentes';
import {vizinhos} from '../../src/percurso/navegacaoOrientada';
import {vizinhosLit} from '../../src/percurso/letramentoInterface';
import {lerRota} from '../../src/percurso/rota';
import {renderToString} from 'react-dom/server';
import {ControlesTela} from '../../src/percurso/Controles';
const S=()=>useCaso.getState();
beforeEach(()=>S().carregarExemplo('novo'));
describe('v015: prioridades combinadas e escolha de frente',()=>{
 const ids=['governar','sobre','com','para'];
 const combinacoes=Array.from({length:15},(_,i)=>ids.filter((_,j)=>(i+1)&(1<<j)));
 it.each(combinacoes.filter(p=>!p.includes('para')).map(p=>[p.join('+'),p] as const))('%s oferece apenas suas frentes, sem duplicar a intervenção',(_,p)=>{
  const destino=confirmarPrioridades([...p]);
  expect(destino).toBe(p.length>1?'#/frentes':p[0]==='com'||p[0]==='para'?'#/capitulo/1/etapas':'#/capitulo/1/problemas');
  const frentes=frentesDoPlano(S()).map(f=>f.id);
  expect(frentes).toEqual([...(p.includes('governar')?['governanca']:[]),...(p.includes('sobre')?['letramento']:[]),...(p.some(id=>['com','para'].includes(id))?['educacao']:[])]);
  for(const f of frentesDoPlano(S())){
   const rota=lerRota(abrirFrente(f.id)!);
   expect(frenteAtual(S())).toBe(f.id);
   expect(rota).toEqual({tipo:'pergunta',n:1,tela:f.id==='educacao'?'etapas':'problemas'});
  }
 });
 it('volta das primeiras perguntas para a visão das frentes',()=>{
  confirmarPrioridades(ids);
  for(const f of frentesDoPlano(S())){
   const rota=lerRota(abrirFrente(f.id)!);
   if(rota.tipo!=='pergunta')throw Error('Pergunta esperada');
   expect((f.id==='letramento'?vizinhosLit:vizinhos)(S(),rota.tela).anterior).toBe('#/frentes');
  }
 });
 it.skip('mostra a união com e para em um só cartão e não altera o caso ao exibir a tela',()=>{
  confirmarPrioridades(['com','para']);const antes=JSON.stringify(S().estado());
  const frentes=frentesDoPlano(S());
  expect(frentes).toHaveLength(1);expect(frentes[0].descricao).toContain('Reúna a educação com e sem IA');
  expect(JSON.stringify(S().estado())).toBe(antes);
 });
 it('conserva respostas e valores ao alternar, remover e reativar uma frente',()=>{
  confirmarPrioridades(ids);
  S().responder('govOrcamento.itens.equipe.valor',500);
  S().responder('letramento.contexto.detalhe','Nota do programa');
  S().responder('educacao.contexto.detalhe','Nota educacional');
  abrirFrente('educacao');abrirFrente('letramento');abrirFrente('governanca');
  confirmarPrioridades(['com']);expect(abrirFrente('governanca')).toBeNull();
  confirmarPrioridades(ids);abrirFrente('governanca');
  expect(S().ctx.govOrcamento.itens.equipe.valor).toBe(500);
  expect(S().ctx.letramento.contexto.detalhe).toBe('Nota do programa');
  expect(S().ctx.educacao.contexto.detalhe).toBe('Nota educacional');
 });
 it('retoma a primeira pendência sem obrigar a repetir o contexto nacional',()=>{
  confirmarPrioridades(ids);S().responder('problemas',['G11']);
  const destino=abrirFrente('governanca');
  const primeira=telasAtivas(S()).find(q=>!['local','prioridades'].includes(q.id)&&!telaRespondida(S(),q));
  expect(destino).toBe(primeira?`#/capitulo/${primeira.capitulo}/${primeira.id}`:'#/plano');
  expect(destino).not.toBe('#/capitulo/1/local');
 });
 it('inclui projeto apenas quando explicitamente identificado e não cria projeto ao combinar prioridades',()=>{
  confirmarPrioridades(ids);expect(frentesDoPlano(S()).map(f=>f.id)).not.toContain('projeto');
  S().responder('projetoIA.incluir','sim');S().responder('projetoIA.descricao','Apoio à leitura');
  expect(frentesDoPlano(S()).map(f=>f.id)).toEqual(['governanca','letramento','educacao','projeto']);
  expect(abrirFrente('projeto')).toBeTruthy();expect(frenteAtual(S())).toBe('projeto');
 });
 it('reabre a página pela URL e rejeita frente que não pertence ao plano',()=>{
  expect(lerRota('#/frentes')).toEqual({tipo:'frentes'});
  confirmarPrioridades(['sobre']);const antes=JSON.stringify(S().estado());
  expect(abrirFrente('educacao')).toBeNull();expect(JSON.stringify(S().estado())).toBe(antes);
 });
 it.skip('cada frente mostra apenas seu catálogo e preserva as seleções das demais',()=>{
  confirmarPrioridades(ids);S().responder('problemas',['G11','A11','C11','F1']);
  for(const [frente,visiveis,ocultos] of [
   ['governanca',['G11'],['A11','C11','F1']],
   ['letramento',['A11'],['G11','C11','F1']],
   ['educacao',['C11','F1'],['G11','A11']],
  ] as const){
   abrirFrente(frente);const tela=telasAtivas(S()).find(q=>q.id==='problemas')!;
   const html=renderToString(<ControlesTela e={S()} tela={tela}/>);
   for(const id of visiveis)expect(html).toContain(`value="${id}"`);
   for(const id of ocultos)expect(html).not.toContain(`value="${id}"`);
   expect(html.includes('gov-rede-escolas')).toBe(frente==='governanca');
   expect(S().ctx.problemas).toEqual(['G11','A11','C11','F1']);
  }
 });
 it('desafios de outra frente não contam como resposta nem fazem pular sua primeira pergunta',()=>{
  confirmarPrioridades(ids);S().responder('problemas',['C11']);
  expect(abrirFrente('letramento')).toBe('#/capitulo/1/problemas');
  const q=telasAtivas(S()).find(q=>q.id==='problemas')!;expect(telaRespondida(S(),q)).toBe(false);
  S().responder('problemas',['C11','A11']);expect(telaRespondida(S(),q)).toBe(true);
 });
});
