// Proposta adicional: a mesma informação do plano, com seleção editorial explícita.
// Não infere aprovação, evidência, responsáveis ou valores ausentes.
import type { Estado14 } from '../store';
import { frenteAtual, type FrenteId } from '../percurso/frentes';
import { planoGovernanca, moedaGovernanca } from '../percurso/governanca';
import { textoEstimado } from '../percurso/estimativasOrcamento';
import { planoLetramento, camposLetramento, valorCampoLit, rotuloLit } from '../percurso/letramento';
import { planoEd, camposEd, valorEd, impactosPedagogicos } from '../percurso/pedagogico';
import { t } from '../percurso/textos';
import { LOC, etapasAtivas } from '../domain';
import { briefDados } from './brief.js';
export interface LinhaSimples { rotulo: string; valor: string }
export interface SecaoSimples { titulo: string; linhas: LinhaSimples[] }
export interface LeituraSimples { frente: FrenteId; titulo: string; pais: string; resumo: LinhaSimples[]; secoes: SecaoSimples[]; parcial: boolean; nota: string }
const linha=(rotulo:string,valor:unknown):LinhaSimples=>({rotulo:t(rotulo),valor:String(valor||t('A definir')).replace(/\s*\(P10\s*(?:a|–|-|to|à)\s*P90\)/g,'').replace(/\s*\(R-\d+\)/g,'')});
/** Corta somente a apresentação, nunca a resposta salva. Metas e valores usam linhas próprias. */
export function textoCurto(texto:string,max=38):string {
 const palavras=String(texto).trim().split(/\s+/);return palavras.length>max?palavras.slice(0,max).join(' ')+'…':String(texto);
}
export function leituraSimples(s:Estado14):LeituraSimples {
 const frente=frenteAtual(s);
 if(frente==='projeto') {
  const b=briefDados(s), paginas=b.paginas as any;
  return {frente,titulo:b.titulo,pais:b.subtitulo||'',parcial:b.vazio,nota:t('Estimativa para discussão. Confirme as respostas e as condições antes de decidir.'),
   resumo:[linha('O que melhorar',b.frases.contexto.texto),linha('Próxima decisão',b.recomendacao.texto),...b.numeros.slice(0,1).map((n:any)=>linha('Custo estimado',n.valor+' · '+n.nota))],
   secoes:[{titulo:t('O que queremos melhorar'),linhas:[linha('O que melhorar',b.frases.contexto.texto)]},{titulo:t('Recursos necessários'),linhas:b.numeros.map((n:any)=>linha(n.rotulo,n.valor+' · '+n.nota))},{titulo:t('Como começar'),linhas:b.acoes.map((a:any)=>linha(a.oque,[a.quem,a.quando].join(' · ')))},
    {titulo:t('Cuidados principais'),linhas:(paginas?.riscos?.blocos||[]).flatMap((x:any)=>x.itens?x.itens.map((v:string)=>linha('Cuidado',v)):x.texto?[linha(x.titulo,x.texto)]:[])}]};
 }
 const p=frente==='governanca'?planoGovernanca(s):frente==='letramento'?planoLetramento(s):planoEd(s),o=p.orcamento;
 const bloco=(titulo:string)=>p.blocos.find(b=>b.titulo===t(titulo))?.linhas||[];
 const selecionar=(titulo:string,rotulos:string[])=>bloco(titulo).filter(l=>rotulos.map(x=>t(x)).includes(l.rotulo));
 const contexto=bloco('Contexto');
 let foco:string[]=[],objetivos:LinhaSimples[]=[],alcance:LinhaSimples[]=[],acoes:LinhaSimples[]=[],cuidados:LinhaSimples[]=[],revisao:LinhaSimples[]=[];
 if(frente==='governanca') {
  const g=planoGovernanca(s);foco=g.desafios.map(q=>q.titulo);
  objetivos=[];
  alcance=selecionar('Contexto',['Total de escolas','Total de estudantes']);
  acoes=g.acoes.map(a=>linha(a.titulo,a.entrega));
  cuidados=selecionar('Capacidade institucional',['Supervisão e acompanhamento','Resposta a incidentes e reclamações']);
  revisao=selecionar('Acompanhamento e revisão',['Indicadores e metas institucionais','Responsável pelo acompanhamento','Periodicidade da revisão','Próxima revisão']);
 } else if(frente==='letramento') {
  foco=(contexto.find(l=>l.rotulo===t('Públicos selecionados'))?.valor||'').split('; ').filter((x:string)=>x&&x!==t('Não informado'));
  const fs=camposLetramento(s),pegar=(teste:(c:string)=>boolean)=>fs.filter(f=>teste(f.caminho)).map(f=>linha(rotuloLit(f.label),valorCampoLit(s,f)));
  objetivos=pegar(c=>c.endsWith('.objetivos')||c==='curriculo.progressao');
  alcance=pegar(c=>c.endsWith('.participantes')||c.endsWith('.horas'));
  acoes=pegar(c=>/^acoes\..*\.(responsavel|prazo)$/.test(c));
  cuidados=pegar(c=>c==='desenho.salvaguardas'||c==='validacao.criterios');
  revisao=pegar(c=>['revisao.indicadores','revisao.responsavel','revisao.periodicidade'].includes(c));
 } else {
  foco=planoEd(s).temas.map(q=>t(q.nome));
  const fs=camposEd(s),pegar=(teste:(c:string)=>boolean)=>fs.filter(f=>teste(f.caminho)).map(f=>linha((f.grupo?t(f.grupo)+' · ':'')+t(f.label),valorEd(s,f)));
  objetivos=impactosPedagogicos(s).map(i=>linha('Impacto esperado',t(i.texto)));
  alcance=contexto.filter(l=>(etapasAtivas(s.ctx) as any[]).some(et=>t(et[1])===l.rotulo));
  acoes=pegar(c=>c.endsWith('.acoes')||['execucao.responsavel','execucao.prazo'].includes(c));
  cuidados=pegar(c=>/salvaguardas/.test(c));
  revisao=pegar(c=>['revisao.responsavel','revisao.periodicidade','avaliacao.evidencias'].includes(c));
 }
 const informado=(l:LinhaSimples)=>l.valor!==t('Não informado')&&l.valor!==t('A definir');
 // Agrupa meta e unidade por tema; números não são somados nem suprimidos.
 if(frente==='educacao'){const grupos=new Map<string,string[]>();for(const l of objetivos.filter(informado)){const [tema,...resto]=l.rotulo.split(' · ');grupos.set(tema,[...(grupos.get(tema)||[]),resto.join(' · ').startsWith(t('Objetivo de aprendizagem'))?textoCurto(l.valor,18):resto.join(' · ').startsWith(t('Meta ou resultado esperado — valor'))?t('Meta')+': '+l.valor:l.valor]);}objetivos=[...grupos].map(([nome,vs])=>linha(nome,vs.join(' · ')));}
 if(frente==='letramento'){const grupos=new Map<string,string[]>();for(const l of acoes.filter(informado)){const partes=l.rotulo.split(' · '),nome=partes.pop()!;grupos.set(nome,[...(grupos.get(nome)||[]),partes.join(' · ')+': '+l.valor]);}acoes=[...grupos].map(([nome,vs])=>linha(nome,vs.join(' · ')));}
 const parcial=p.faltam.length>0||p.pendentes>0;
 const custo=o.informados?moedaGovernanca(o.subtotal,o.moeda,String(LOC())):t('A definir');
 // Informado, estimado pela ferramenta e ainda a levantar ficam separados; total só sem faltas.
 const est=(o as any).estimados||0,completo=est?(o as any).totalComEstimativas:o.total;
 const verba=linha('Valores já informados',custo);
 const estimado=linha('Estimado pela ferramenta',est?textoEstimado((o as any).estimado||0,o.moeda):t('Nenhum item'));
 const faltando=linha('Ainda a levantar',o.faltam===1?t('1 item'):t('{n} itens',{n:o.faltam}));
 const total=completo!==null&&completo!==undefined?[linha(est?'Total (inclui estimativas de referência)':'Total informado',moedaGovernanca(completo,o.moeda,String(LOC())))]:[];
 const focoCurto=foco.length>3?foco.slice(0,3).join('; ')+t(' e mais {n}',{n:foco.length-3}):foco.join('; ');
 const secao=(titulo:string,linhas:LinhaSimples[]):SecaoSimples=>({titulo:t(titulo),linhas:linhas.some(informado)?linhas.filter(informado):[linha('Situação','')]});
 return {frente,titulo:p.titulo,pais:p.pais,parcial,nota:t('As escolhas registradas descrevem o planejamento. Não comprovam execução, resultados ou aprovação.'),
  resumo:[linha('Foco do plano',focoCurto),linha('Situação do plano',parcial?t('Há informações a completar antes da aprovação.'):t('Pronto para revisão pelos responsáveis.')),linha('Resultado esperado',objetivos.length?textoCurto(objetivos[0].valor,28):''),...total,verba,...(est?[estimado]:[]),...(total.length?[]:[faltando]),linha('Próximo passo',p.proxima)],
  secoes:[secao('O que queremos melhorar',[...objetivos.filter(informado),...foco.filter(nome=>!objetivos.filter(informado).some(l=>l.rotulo===nome||l.rotulo.endsWith(' · '+nome))).map(x=>linha('Prioridade',x))]),secao('Quem será atendido',alcance),secao('O que fazer e quem cuida',acoes),
   secao('Recursos necessários',[...total,verba,estimado,faltando,linha('Período do orçamento',p.blocos.flatMap(b=>b.linhas).find(l=>l.rotulo===t('Período do orçamento'))?.valor),...(o.itens.some(i=>'compartilhado' in i&&i.compartilhado)?[linha('Custos compartilhados',t('Registrados na frente de origem; não somados novamente.'))]:[])]),
   secao('Cuidados e acompanhamento',[...cuidados,...revisao]),secao('O que falta decidir',[linha('Próximo passo',p.proxima),linha('Informações pendentes',t('{telas} telas a completar; {definicoes} definições e valores a confirmar.',{telas:p.faltam.length,definicoes:p.pendentes}))])]};
}
