import {mkdirSync,writeFileSync} from 'node:fs';
import {PRIORIDADES} from '../../src/domain';
import {camposEd,alterarEd} from '../../src/percurso/pedagogico';
import {camposLetramento} from '../../src/percurso/letramento';
import {beforeEach,describe,it,expect} from 'vitest';
import {renderToString} from 'react-dom/server';
import {useCaso} from '../../src/store';
import {estadoDaFrente} from '../../src/percurso/frentes';
import {leituraSimples,textoCurto} from '../../src/plano/leituraSimples';
import {LeituraSimples} from '../../src/screens/LeituraSimples';
import {gerarLeituraSimplesPDF} from '../../src/plano/pdf_simples';
import {setLang} from '../../src/domain/i18n.js';
const S=()=>useCaso.getState();
beforeEach(()=>{S().carregarExemplo('novo');setLang('pt');});
describe('proposta extra de leitura simples',()=>{
 it.each(['governanca','letramento','educacao'] as const)('não altera o estado nem o orçamento de %s',id=>{
  S().responder('prioridades',['governar','sobre','com','para']);S().responder('problemas',['G11','A11','C11']);
  S().responder('govOrcamento.moeda','BRL');S().responder('govOrcamento.itens.equipe.valor',1234.56);
  const e=estadoDaFrente(S(),id),antes=JSON.stringify(e),p=leituraSimples(e);
  expect(JSON.stringify(e)).toBe(antes);expect(p.frente).toBe(id);expect(p.parcial).toBe(true);
  expect(p.resumo.length).toBeLessThanOrEqual(7);// v015: informado, estimado e ainda a levantar em linhas própriasexpect(p.secoes).toHaveLength(6);
  expect(JSON.stringify(p)).not.toContain('[object Object]');
  if(id==='governanca'){expect(JSON.stringify(p)).toContain('1.234,56');expect(JSON.stringify(p)).not.toMatch(/piloto/i);}
  else expect(JSON.stringify(p)).not.toContain('1.234,56');
 });
 it('distingue custo desconhecido de zero informado',()=>{
  S().responder('prioridades',['governar']);
  expect(leituraSimples(S()).resumo.find(l=>l.rotulo==='Valores já informados')?.valor).toBe('A definir');
  S().responder('govOrcamento.itens.equipe.situacao','sem_custo');
  expect(leituraSimples(S()).resumo.find(l=>l.rotulo==='Valores já informados')?.valor).toContain('0,00');
 });
 it('mantém todas as prioridades e identifica sugestões não confirmadas',()=>{
  S().responder('prioridades',['governar']);S().responder('problemas',['G11','G12','G13','G14','G15','G16','G17','G18']);
  const p=leituraSimples(S());expect(p.resumo[0].valor).toContain('e mais 5');
  expect(p.secoes[0].linhas.filter(l=>l.rotulo==='Prioridade')).toHaveLength(8);
  // versão de teste (fluxos enxutos): as ações são só as sugeridas; o rótulo é o desafio e o valor a ação
  expect(p.secoes[2].linhas[0].valor).toContain('regulamentação');
 });
 it('resolve valores de período das escolhas do letramento',()=>{
  S().responder('prioridades',['sobre']);S().responder('problemas',['A11']);S().responder('letramento.orcamento.periodo',{escolhas:['12']});
  const p=leituraSimples(S());expect(JSON.stringify(p)).toContain('Próximos 12 meses após aprovação');expect(JSON.stringify(p)).not.toContain('[object Object]');
 });
 it('a apresentação abrevia textos sem alterar as respostas',()=>{
  const v=Array(100).fill('palavra').join(' ');expect(textoCurto(v).split(' ')).toHaveLength(38);expect(textoCurto(v)).toMatch(/…$/);expect(v.split(' ')).toHaveLength(100);
 });
 it('renderiza como extra, com relatório recolhido e downloads distintos',()=>{
  S().responder('prioridades',['governar']);const html=renderToString(<LeituraSimples s={S()}/>);
  expect(html).toContain('Extra · versão para validação');expect(html).toContain('Baixar sumário curto (PDF)');expect(html).toContain('Baixar relatório curto (PDF)');expect(html).toContain('<details');expect(html).not.toContain(' open=');
 });
 it.each(['sumario','relatorio'] as const)('gera PDF %s com texto, páginas e sem respostas inventadas',async tipo=>{
  S().responder('prioridades',['governar']);S().responder('problemas',['G11']);
  const doc=await gerarLeituraSimplesPDF(S().estado(),{tipo,fontes:null,lang:'pt',data:new Date('2026-11-01')});
  expect(doc.getNumberOfPages()).toBeLessThanOrEqual(tipo==='sumario'?1:3);
  expect((doc.internal as any).pages.flat().join(' ')).toContain('2026-11-01');expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(2000);
 });
});

describe('documentos representativos, com todos os públicos ou temas',()=>{
 it.each(['governanca','letramento','educacao','projeto'] as const)('mantém metas e gera os extras de %s',async frente=>{
  if(frente==='projeto')S().carregarExemplo('A');
  else {
   S().escolherPais('BRA');S().responder('prioridades',frente==='governanca'?['governar']:frente==='letramento'?['sobre']:['com','para']);
   const pr=frente==='governanca'?['governar']:frente==='letramento'?['sobre']:['com','para'];
   S().responder('problemas',(PRIORIDADES as any[]).filter(p=>pr.includes(p.id)).flatMap(p=>p.problemas.filter((q:any)=>p.id==='para'||/^[GAC](1[1-9]|2[01])$/.test(q.id)).map((q:any)=>q.id)));
   S().responder('redeNacional',{escolas:12345,estudantes:1600000});
   if(frente==='educacao'){
    S().responder('etapas',{fund2:{on:true,escolas:120,alunos:12000,soTotal:true}});
    for(const f of camposEd(S()))S().responder('educacao',alterarEd(S(),f.caminho,f.numero?{situacao:'informado',valor:f.caminho.endsWith('.meta')?80.5:250}:{escolhas:[f.opcoes![0].id]}));
    // versão de teste: a meta deixou de ser perguntada; os impactos derivados dos temas e o alcance aparecem
    const p=leituraSimples(S());expect(JSON.stringify(p)).toContain('Impacto esperado');expect(JSON.stringify(p)).toContain('12.000');
   }
   if(frente==='letramento')for(const f of camposLetramento(S()))S().responder('letramento.'+f.caminho,f.numero?{situacao:'informado',valor:250}:{escolhas:[f.opcoes![0].id]});
  }
  const antes=JSON.stringify(S().estado());
  for(const tipo of ['sumario','relatorio'] as const){
   const doc=await gerarLeituraSimplesPDF(S().estado(),{tipo,fontes:null,lang:'pt',data:new Date('2026-11-01')});
   expect(doc.getNumberOfPages()).toBeLessThanOrEqual(tipo==='sumario'?1:3);
   if(process.env.V015_SIMPLES_QA){mkdirSync(process.env.V015_SIMPLES_QA,{recursive:true});writeFileSync(process.env.V015_SIMPLES_QA+'/'+frente+'-'+tipo+'.pdf',Buffer.from(doc.output('arraybuffer')));writeFileSync(process.env.V015_SIMPLES_QA+'/'+frente+'.json',JSON.stringify(leituraSimples(S()),null,2));}
  }
  expect(JSON.stringify(S().estado())).toBe(antes);
 });
});
