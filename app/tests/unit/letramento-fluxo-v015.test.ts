import { beforeEach, describe, expect, it } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { useCaso, telasAtivas, faltamDe, progressoDe, numerosDe } from '../../src/store';
import { setLang, percursoGovernanca, percursoLetramento, projetoUsoDefinido, estadoDoProjeto } from '../../src/domain';
import { camposLetramento, alterarLit, lerLit, telasLetramento, planoLetramento, orcamentoLetramento, custosLetramento, errosAlcance, publicosLetramento, letramentoRespondido, campoLitRespondido } from '../../src/percurso/letramento';
import { planoGovernanca, orcamentoGovernanca } from '../../src/percurso/governanca';
import { gerarBrief } from '../../src/plano/pdf_brief.js';
import { gerarPDF } from '../../src/plano/pdf.js';
import { destinoContinuar } from '../../src/screens/transversal';
const S=()=>useCaso.getState();
const g=(p:string,v:any)=>S().responder('letramento',alterarLit(S().ctx.letramento,p,v));
const escolher=(p:string,ids:string[])=>g(p,{escolhas:ids});
function iniciar(ids=['A13']) {S().escolherPais('BRA');S().responder('prioridades',['sobre']);S().responder('problemas',ids);}
function preencher() {
 // Recalcular campos depois de cada seleção: modalidade, validação e subgrupos são condicionais.
 for(let ciclo=0;ciclo<3;ciclo++) for(const f of camposLetramento(S())) if(!campoLitRespondido(S(),f)) {
  if(f.numero)g(f.caminho,{valor:f.caminho.endsWith('elegiveis')?100:f.caminho.endsWith('horas')?2:20,situacao:'informado'});
  else escolher(f.caminho,[f.opcoes!.find(o=>o.id!=='_pendente')!.id]);
 }
 for(const [id] of custosLetramento(S()))g('orcamento.itens.'+id,{situacao:'sem_custo'});
}
beforeEach(()=>{setLang('pt');S().carregarExemplo('novo');});
describe('v015: fluxo nacional de letramento e currículo',()=>{
 it.each(['A11','A12','A13','A14','A15','A16'])('completa %s sem licença, PoC ou contratação e conserva o JSON',id=>{
  iniciar([id]);preencher();expect(percursoLetramento(S().ctx)).toBe(true);
  expect(telasAtivas(S()).some(t=>['etapas','testes','pagamento','tipoTec','piloto'].includes(t.id))).toBe(false);
  expect(faltamDe(S())).toEqual([]);expect(planoLetramento(S()).faltam).toEqual([]);
  const texto=JSON.stringify(planoLetramento(S()));expect(texto).not.toMatch(/autorizar|licenças|custo do teste|NaN/i);
  const antes=planoLetramento(S());S().irPara(4,'lit-revisao');S().importar(JSON.stringify(S().exportar()));
  expect(planoLetramento(S())).toEqual(antes);expect(S().capitulo.pergunta).toBe('lit-revisao');
  expect(()=>numerosDe(S())).toThrow(/institucional/);
 });
 it('equipes públicas não exigem etapas, escolas nem estudantes',()=>{
  iniciar();const fs=camposLetramento(S());expect(fs.some(f=>/alcance\.(etapas|escolas|estudantes)/.test(f.caminho))).toBe(false);
  preencher();expect(faltamDe(S())).toEqual([]);
 });
 it('ensino superior inclui graduação, pós e egressos, com total distinto e validação dos subgrupos',()=>{
  iniciar(['A15']);escolher('alcance.superior',['graduacao','pos','egressos']);
  expect(camposLetramento(S()).filter(f=>f.caminho.includes('subgrupos.'))).toHaveLength(3);
  g('publicos.A15.participantes',{valor:100});for(const id of ['graduacao','pos','egressos'])g('publicos.A15.subgrupos.'+id,{valor:20});
  expect(errosAlcance(S())).not.toEqual([]);g('publicos.A15.participantes',{valor:40});expect(errosAlcance(S())).toEqual([]);
 });
 it('currículo tem elaboração e aprovação e só mostra validação pedagógica quando escolhida',()=>{
  iniciar(['A16']);expect(telasAtivas(S()).map(t=>t.id)).toContain('lit-curriculo');
  expect(telasLetramento(S())).not.toContain('lit-validacao');escolher('oferta.validacao',['sim']);expect(telasLetramento(S())).toContain('lit-validacao');
  g('validacao.participantes',{valor:31});escolher('oferta.validacao',['nao']);
  expect(planoLetramento(S()).blocos.some(b=>b.titulo==='Validação pedagógica')).toBe(false);expect(lerLit(S(),'validacao.participantes').valor).toBe(31);
  expect(custosLetramento(S()).some(([id])=>id==='validacao')).toBe(false);
 });
 it('recursos digitais e o projeto de ferramenta dependem de escolhas explícitas',()=>{
  iniciar();escolher('oferta.modalidade',['presencial']);escolher('oferta.recursos',['nenhum']);expect(telasLetramento(S())).not.toContain('lit-digital');
  escolher('oferta.modalidade',['online']);expect(telasLetramento(S())).toContain('lit-digital');expect(telasLetramento(S())).not.toContain('lit-projeto');
  escolher('oferta.recursos',['ia']);expect(telasLetramento(S())).toContain('lit-projeto');expect(projetoUsoDefinido(S().ctx)).toBe(false);
  S().responder('projetoIA',{incluir:'sim',descricao:'Apoio à elaboração de materiais'});expect(percursoLetramento(S().ctx)).toBe(true);
  S().responder('frenteAtiva','projeto');expect(percursoLetramento(S().ctx)).toBe(false);
  const e=estadoDoProjeto(S());expect(e.ctx.prioridades).toEqual(['com']);expect(e.ctx.problemas).toEqual([]);
 });
 it('as seis opções não duplicam participantes nem inferem licenças ou valores',()=>{
  iniciar(['A11','A12','A13','A14','A15','A16']);expect(publicosLetramento(S())).toHaveLength(5);
  for(const p of publicosLetramento(S())) {g(`publicos.${p.id}.elegiveis`,{valor:100});g(`publicos.${p.id}.participantes`,{valor:40});}
  g('alcance.totalUnico',{valor:201});expect(errosAlcance(S())).not.toEqual([]);
  g('alcance.totalUnico',{valor:150});expect(errosAlcance(S())).toEqual([]);
  expect(orcamentoLetramento(S()).subtotal).toBe(0);expect(orcamentoLetramento(S()).total).toBeNull();
  expect(S().caso.usuarios).toEqual([]);expect(S().caso.tarefas).toEqual([]);
 });
 it('informações a levantar permitem responder, mantendo pendências e plano parcial',()=>{
  iniciar();for(const f of camposLetramento(S()))g(f.caminho,f.numero?{situacao:'a_levantar'}:{escolhas:['_pendente']});
  for(const [id] of custosLetramento(S()))g('orcamento.itens.'+id,{situacao:'a_estimar'});
  expect(faltamDe(S())).toEqual([]);expect(planoLetramento(S()).pendentes).toBeGreaterThan(0);
  expect(planoLetramento(S()).proxima).toMatch(/pendências/);expect(orcamentoLetramento(S()).total).toBeNull();
 });
 it('orçamento distingue desconhecido, zero e inválido e mantém a moeda dos valores',()=>{
  iniciar();g('orcamento.moeda','BRL');g('orcamento.itens.equipe',{situacao:'informado',valor:1234.56});g('orcamento.itens.apoio',{situacao:'sem_custo'});
  expect(orcamentoLetramento(S())).toMatchObject({subtotal:1234.56,informados:2,total:null});
  S().escolherPais('CAN');expect(orcamentoLetramento(S()).moeda).toBe('BRL');
  for(const valor of [-2,Infinity,'100']){g('orcamento.itens.equipe',{situacao:'informado',valor});expect(orcamentoLetramento(S()).itens.find(i=>i.id==='equipe')?.valor).toBeNull();}
 });
 it('governança e letramento têm frentes acessíveis, ações isoladas e custo compartilhado contado na origem',()=>{
  iniciar(['G11','A13','A16']);S().responder('prioridades',['governar','sobre']);expect(percursoGovernanca(S().ctx)).toBe(true);
  expect(telasAtivas(S()).some(t=>t.id==='gov-projeto')).toBe(false);
  expect(planoGovernanca(S()).acoes.map(a=>a.id)).toEqual(['G11']);
  S().responder('govOrcamento.itens.equipe',{situacao:'informado',valor:500});S().responder('frenteAtiva','letramento');
  g('orcamento.itens.equipe',{situacao:'compartilhado',referencia:'equipe'});
  expect(orcamentoLetramento(S()).subtotal).toBe(0);expect(orcamentoGovernanca(S()).subtotal).toBe(500);
  const item=orcamentoLetramento(S()).itens.find(i=>i.id==='equipe')!;expect(item.compartilhado).toBe(true);expect(item.origem?.valor).toBe(500);
  expect(planoLetramento(S()).blocos.flatMap(b=>b.linhas).some(l=>l.valor.includes('Não somado novamente'))).toBe(true);
  S().responder('frenteAtiva','governanca');expect(orcamentoGovernanca(S()).subtotal).toBe(500);
 });
 it('alterar público, modalidade e currículo preserva dados inativos sem mostrá-los no plano',()=>{
  iniciar(['A11','A16']);escolher('publicos.A11.objetivos',['fundamentos']);g('publicos.A11.objetivos',{escolhas:['fundamentos'],detalhe:'Nota preservada'});
  S().responder('problemas',['A13']);expect(JSON.stringify(planoLetramento(S()))).not.toContain('Nota preservada');
  expect(telasAtivas(S()).some(t=>t.id==='lit-curriculo')).toBe(false);
  S().responder('problemas',['A11','A16']);expect(JSON.stringify(planoLetramento(S()))).toContain('Nota preservada');
 });
 it('valida inteiros exatos, limites de públicos e protege caminhos de escrita',()=>{
  iniciar(['A13']);g('publicos.A13.elegiveis',{valor:10});g('publicos.A13.participantes',{valor:11});expect(errosAlcance(S())).not.toEqual([]);
  for(const valor of [-1,1.5,Infinity,'10']){g('publicos.A13.participantes',{valor});expect(letramentoRespondido(S(),'lit-alcance')).toBe(false);}
  expect(()=>alterarLit({},'__proto__.poluido',true)).toThrow();expect(({} as any).poluido).toBeUndefined();
 });
 it('mantém a posição ao responder e retoma links antigos em tela equivalente',()=>{
  iniciar();S().irPara(3,'lit-oferta');escolher('oferta.modalidade',['presencial']);expect(S().capitulo).toEqual({atual:3,pergunta:'lit-oferta'});
  S().irPara(2,'formados');expect(destinoContinuar(S(),faltamDe(S())).href).toBe('#/capitulo/3/lit-oferta');
  const p=progressoDe(S());expect(p.reduce((n,p)=>n+p.total,0)).toBe(telasAtivas(S()).length);
 });
 it('recursos adicionais usam IDs independentes e não entram quando removidos',()=>{
  iniciar();g('orcamento.adicionais.adicional-1.nome',{escolhas:['outro'],detalhe:'Transporte específico'});g('orcamento.itens.adicional-1',{situacao:'informado',valor:81});
  expect(orcamentoLetramento(S()).subtotal).toBe(81);g('orcamento.adicionais',{});expect(orcamentoLetramento(S()).subtotal).toBe(0);
  g('orcamento.adicionais.adicional-2.nome',{escolhas:['outro']});expect(orcamentoLetramento(S()).itens.find(i=>i.id==='adicional-2')?.valor).toBeNull();
 });
 it('importações com seleções malformadas permanecem pendentes sem quebrar o plano',()=>{
  iniciar();g('diagnostico.situacao',{escolhas:{id:'isoladas'}});g('diagnostico.evidencias',{escolhas:'questionario'});g('orcamento.adicionais',{'constructor':{nome:'invalido'},'recurso.arbitrario':{}});
  expect(()=>planoLetramento(S())).not.toThrow();expect(letramentoRespondido(S(),'lit-diagnostico')).toBe(false);expect(custosLetramento(S()).some(([id])=>id==='constructor'||id==='recurso.arbitrario')).toBe(false);
 });
 it('exporta os dois PDFs pelo modelo de formação, com os números e as notas do plano',async()=>{
  iniciar(['A13','A16']);preencher();g('diagnostico.situacao',{escolhas:['isoladas'],detalhe:'Nota sintética para conferir a exportação.'});g('orcamento.itens.equipe',{situacao:'informado',valor:1234.56});
  const docs=[await gerarBrief(S().estado(),{lang:'pt',fontes:null,data:new Date('2026-10-31T12:00:00Z')}),await gerarPDF(S().estado(),{lang:'pt',fontes:null,data:new Date('2026-10-31T12:00:00Z')})];
  for(const [i,doc] of docs.entries()){expect(doc.getNumberOfPages()).toBeGreaterThan(0);const bytes=Buffer.from(doc.output('arraybuffer'));expect(bytes.subarray(0,4).toString()).toBe('%PDF');if(process.env.V015_LIT_QA){mkdirSync(process.env.V015_LIT_QA,{recursive:true});writeFileSync(process.env.V015_LIT_QA+'/'+(i?'plano':'resumo')+'.pdf',bytes);}}
 });
});
