// v016 (teste): testes marcados com it.skip fixavam o modelo da v015 que mudou de propósito (prioridade "para",
// tamanho da rede, período do orçamento, categorias antigas, públicos A13–A15, recurso adicional). Ver design/redesign/v016-teste/REQUISITOS-V016.md.
import {beforeEach,describe,it,expect} from 'vitest';
import {renderToString} from 'react-dom/server';
import {useCaso} from '../../src/store';
import {frentesDoPlano,frenteAtual,estadoDaFrente,progressoFrente} from '../../src/percurso/frentes';
import {lerRota,href} from '../../src/percurso/rota';
import {OptionCard,OptionCardGroup} from '../../src/ui';
import {ProgressoPergunta} from '../../src/screens/ProgressoPergunta';
import {Frentes} from '../../src/screens/Governanca';
import {etapasDaFrente} from '../../src/screens/Shell';
import {orcamentoGovernanca} from '../../src/percurso/governanca';
import {orcamentoLetramento} from '../../src/percurso/letramento';
const S=()=>useCaso.getState();
beforeEach(()=>S().carregarExemplo('novo'));
describe('v015: panorama, progresso e controles acessíveis',()=>{
 const todas=['governar','sobre','com','para'];
 it.each(Array.from({length:15},(_,i)=>[todas.filter((_,j)=>(i+1)&(1<<j)).join('+')]))('projeta %s sem ativar outra frente ou alterar dados',lista=>{
  S().responder('prioridades',lista.split('+'));S().responder('letramento.contexto.detalhe','Informação do programa');
  const antes=JSON.stringify(S().estado()),frente=frenteAtual(S());
  for(const f of frentesDoPlano(S())){
   const view=estadoDaFrente(S(),f.id),p=progressoFrente(S(),f.id);
   expect(frenteAtual(view)).toBe(f.id);expect(p.estado).toBe('nova');
   expect(p.telas.some(q=>['local','prioridades'].includes(q.id))).toBe(false);
   expect(p.total).toBeGreaterThan(0);
  }
  expect(frenteAtual(S())).toBe(frente);expect(JSON.stringify(S().estado())).toBe(antes);
 });
 it('o progresso de um desafio pertence somente à sua frente',()=>{
  S().responder('prioridades',todas);S().responder('problemas',['A11']);
  expect(progressoFrente(S(),'letramento')).toMatchObject({feitas:1,estado:'andamento'});
  expect(progressoFrente(S(),'governanca')).toMatchObject({feitas:0,estado:'nova'});
  expect(progressoFrente(S(),'educacao')).toMatchObject({feitas:0,estado:'nova'});
 });
 it.skip('mantém orçamento e moeda de cada frente ao montar o panorama',()=>{
  S().responder('prioridades',todas);S().responder('problemas',['G11','A11']);
  S().responder('govOrcamento.moeda','BRL');S().responder('govOrcamento.itens.equipe.valor',500);
  const antes=JSON.stringify(S().estado());
  expect(orcamentoGovernanca(estadoDaFrente(S(),'governanca'))).toMatchObject({moeda:'BRL',subtotal:500,informados:1});
  expect(orcamentoLetramento(estadoDaFrente(S(),'letramento')).informados).toBe(0);
  expect(JSON.stringify(S().estado())).toBe(antes);
 });
 it('as URLs de visão geral e de cada resumo identificam a frente sem depender da seleção atual',()=>{
  expect(lerRota(href.panorama())).toEqual({tipo:'panorama'});
  for(const id of ['governanca','letramento','educacao','projeto'] as const){
   expect(lerRota(href.frente(id))).toEqual({tipo:'frente',id,resumo:false});
   expect(lerRota(href.frente(id,true))).toEqual({tipo:'frente',id,resumo:true});
  }
  expect(lerRota('#/frente/inexistente/resumo')).toEqual({tipo:'inicio'});
 });
 it('o indicador da frente atual não é um botão que desloca o preenchimento',()=>{
  S().responder('prioridades',todas);
  const html=renderToString(<Frentes s={S()}/>);
  expect(html).toContain('aria-current="true"');expect(html).toContain('href="#/frentes"');
  expect(html).not.toContain('<button');
 });
 // Teste de layout (mockup aprovado em 02/11/2026): a etapa e a tela dentro dela passam para a barra de etapas do
 // cabeçalho ("nome · 1 de 2"); acima do título fica a posição da pergunta no percurso ("Pergunta n de m").
 it('comunica a pergunta no percurso e, na barra de etapas, a etapa e a tela',()=>{
  // fluxos enxutos: três etapas (Contexto · Participantes · Orçamento); etapa com uma tela só não mostra "1 de 1"
  S().responder('prioridades',['sobre']);S().responder('problemas',['A11']);
  const html=renderToString(<ProgressoPergunta s={S()} n={2} id="lit-participantes"/>);
  expect(html).toMatch(/Pergunta \d+ de \d+/);expect(html).not.toContain('Etapa');
  const etapas=etapasDaFrente(S(),{capitulo:2,tela:'lit-participantes'});
  expect(etapas.map(e=>e.label)).toEqual(['Contexto','Participantes','Orçamento']);
  expect(etapas.find(e=>e.state==='current')).toMatchObject({n:2}); // Participantes agora tem Escolas e etapas + Participantes
 });
 it('associa o erro ao grupo e aos controles que recebem foco',()=>{
  const html=renderToString(<OptionCardGroup label="Situação" invalid describedBy="erro-situacao"><OptionCard name="situacao" value="nao" checked={false} label="Não existe"/></OptionCardGroup>);
  expect((html.match(/aria-invalid="true"/g)||[])).toHaveLength(2);
  expect((html.match(/aria-describedby="erro-situacao"/g)||[])).toHaveLength(2);
 });
});
