// Modelo nacional de formação/currículo. Seleções são intenções declaradas, nunca evidências presumidas.
import { PRIORIDADES, ETAPAS_ENS, LOC, nomePais, paisDoCaso, totaisCtx } from '../domain';
import { orcamentoGovernanca, moedaGovernanca, valorItemOrcamento } from './governanca';
import { estimativaReferencia, itemEmReferencia, valorEstimado, totaisOrcamento, linhasTotais, notaEstimativas } from './estimativasOrcamento';
import { t } from './textos';
import type { Estado14 } from '../store/tipos';
type Estado = Pick<Estado14, 'ctx'>;
export interface OpcaoLit { id: string; texto: string }
export interface CampoLit { caminho: string; tela: string; label: string; opcoes?: OpcaoLit[]; multipla?: boolean; numero?: 'inteiro'|'decimal'; evidencia?: boolean; /** número opcional: só alimenta a estimativa, não bloqueia nem conta como pendência */ opcional?: boolean }
export const L = (pt: string, _en: string) => pt;
const o = (id: string, pt: string, _en: string): OpcaoLit => ({ id, texto: pt });
const PENDENTE = o('_pendente', 'Informação a levantar', 'Information to collect');
const DONOS = [o('ministerio','Ministério da Educação','Ministry of Education'),o('curriculo','Autoridade curricular','Curriculum authority'),o('formacao','Área de formação','Training department'),o('superior','Instituições de ensino superior','Higher education institutions'),o('escolas','Equipes escolares','School teams'),o('parceiros','Instituições parceiras','Partner institutions')];
export { TITULOS_LIT } from './letramentoTitulos';
import { TITULOS_LIT } from './letramentoTitulos';
export const TEMAS_LIT: Record<string, { nome: string; competencias: OpcaoLit[] }> = {
 A11: { nome:L('Professores','Teachers'), competencias:[o('fundamentos','Explicar fundamentos e limites da IA','Explain AI foundations and limitations'),o('ensinar','Planejar o ensino sobre IA','Plan teaching about AI'),o('avaliar','Avaliar criticamente materiais e respostas de IA','Critically assess AI materials and outputs')] },
 A12: { nome:L('Estudantes','Students'), competencias:[o('fundamentos','Compreender como a IA funciona e erra','Understand how AI works and makes mistakes'),o('critica','Analisar criticamente informações e vieses','Critically analyse information and bias'),o('criar','Criar e explicar projetos sobre IA','Create and explain projects about AI')] },
 A13: { nome:L('Formuladores de políticas e equipes técnicas','Policy makers and staff'), competencias:[o('evidencias','Avaliar evidências e propostas sobre IA','Assess AI evidence and proposals'),o('decisoes','Tomar decisões públicas informadas sobre IA','Make informed public decisions about AI'),o('direitos','Reconhecer limites, direitos e riscos da IA','Recognise AI limitations, rights and risks')] },
 A14: { nome:L('Diretores escolares','School principals'), competencias:[o('liderar','Liderar o uso responsável de IA na escola','Lead responsible AI use at school'),o('apoiar','Apoiar professores e comunicar com famílias','Support teachers and communicate with families'),o('avaliar','Avaliar propostas e riscos no contexto escolar','Assess proposals and risks in the school context')] },
 A15: { nome:L('Estudantes e egressos do ensino superior','Higher education students and graduates'), competencias:[o('critica','Analisar aplicações e impactos da IA na área de estudo','Analyse AI applications and impacts in the field of study'),o('pesquisa','Avaliar evidências, autoria e integridade acadêmica','Assess evidence, authorship and academic integrity'),o('continuada','Aplicar conhecimentos de IA na formação continuada','Apply AI knowledge in lifelong learning')] },
};
const curriculo = (s: Estado) => idsTemas(s).some(id => ['A16','A3'].includes(id));
const idsTemas = (s: Estado): string[] => { const permitidos = new Set((PRIORIDADES as any[]).find(p=>p.id==='sobre').problemas.map((q:any)=>q.id)); return [...new Set<string>((s.ctx.problemas || []).filter((id:string)=>permitidos.has(id)))]; };
export function publicosLetramento(s: Estado) {
 const cat = (PRIORIDADES as any[]).find(p => p.id === 'sobre').problemas;
 return idsTemas(s).filter(id => !['A16','A3'].includes(id)).map(id => ({ id, ...(TEMAS_LIT[id] || { nome: cat.find((q: any) => q.id === id)?.t || id, competencias:TEMAS_LIT.A12.competencias }) }));
}
export function somenteCurriculoLit(s: Estado) { return curriculo(s) && !publicosLetramento(s).length; }
export function tituloDaTelaLit(s: Estado, id: string) {
 return somenteCurriculoLit(s) && id === 'lit-desenho' ? 'Abordagens e salvaguardas do currículo' : TITULOS_LIT[id];
}
export function lerLit(s: Estado, caminho: string): any { return caminho.split('.').reduce((v,k) => v?.[k], s.ctx.letramento); }
export function alterarLit(base: any, caminho: string, valor: any): any {
 const ks = caminho.split('.'); if (ks.some(k => !k || ['__proto__','prototype','constructor'].includes(k))) throw new Error('Campo inválido');
 const raiz = { ...(base || {}) }; let alvo = raiz, origem = base;
 ks.forEach((k,i) => { if (i === ks.length - 1) alvo[k] = valor; else { alvo[k] = { ...(origem?.[k] || {}) }; alvo = alvo[k]; origem = origem?.[k]; } });
 return raiz;
}
export const selecoesLit = (s:Estado,caminho:string):string[] => { const v=lerLit(s,caminho)?.escolhas; return Array.isArray(v)?v.filter(id=>typeof id==='string'):[]; };
const inclui = (s: Estado, caminho: string, valor: string) => selecoesLit(s,caminho).includes(valor);
const adicionaisAtivos = (s:Estado) => Object.keys(lerLit(s,'orcamento.adicionais')||{}).filter(id=>/^adicional-[1-9]\d*$/.test(id));
export const digitalLit = (s: Estado) => ['online','hibrida'].some(id => inclui(s,'oferta.modalidade',id)) || ['materiais','plataforma','ia'].some(id => inclui(s,'oferta.recursos',id));
/** Versão de teste: Participantes (com públicos) · Orçamento. Currículo não tem tela: vira uma linha do orçamento. */
export function telasLetramento(s: Estado): string[] {
 const pubs = publicosLetramento(s).map(p => p.id);
 const escolas = pubs.some(id => ['A11','A12','A14'].includes(id));
 return ['local','prioridades','problemas',...(escolas ? ['lit-escolas'] : []),...(pubs.length ? ['lit-participantes'] : []),'lit-recursos'];
}
/** Campos do fluxo de teste. Os demais (diagnóstico, desenho, oferta, ações, revisão, público elegível, total distinto…)
 *  continuam guardados no caso, fora das telas, das pendências, do progresso e dos relatórios. */
export function camposLetramento(s: Estado): CampoLit[] {
 const campos: CampoLit[] = [];
 const f = (tela: string,caminho: string,label: string,opcoes: OpcaoLit[],multipla=false,evidencia=false) => campos.push({tela,caminho,label,opcoes:[...opcoes,PENDENTE],multipla,evidencia});
 const n = (tela:string,caminho:string,label:string,numero:'inteiro'|'decimal'='inteiro') => campos.push({tela,caminho,label,numero,opcional:true});
 if (telasLetramento(s).includes('lit-escolas')) {
  campos.push({tela:'lit-escolas',caminho:'alcance.etapas',label:L('Etapas atendidas','Education levels served'),opcoes:(ETAPAS_ENS as any[]).map(([id,nome]:string[])=>({id,texto:nome})),multipla:true,opcional:true});
  n('lit-escolas','alcance.escolas',L('Total de escolas atendidas','Number of schools served'));
 }
 for (const p of publicosLetramento(s)) {
  n('lit-participantes',`publicos.${p.id}.participantes`,L('Participantes previstos','Planned participants')+' · '+t(p.nome));
  n('lit-participantes',`publicos.${p.id}.horas`,L('Horas previstas por participante','Planned hours per participant')+' · '+t(p.nome),'decimal');
 }
 f('lit-recursos','orcamento.periodo',L('Período do orçamento','Budget period'),[o('12','Próximos 12 meses após aprovação','Next 12 months after approval'),o('24','Próximos 24 meses após aprovação','Next 24 months after approval')]);
 for (const id of adicionaisAtivos(s)) f('lit-recursos',`orcamento.adicionais.${id}.nome`,L('Tipo do recurso adicional','Additional resource type'),[o('transporte','Transporte e participação','Travel and participation'),o('certificacao','Certificação','Certification'),o('outro','Recurso adicional','Additional resource')]);
 return campos;
}
/** Versão de teste: valores sugeridos a partir do Contexto (totais da rede, etapas, público de estudantes) para campos ainda vazios. */
export function sugestoesLit(s: Estado): { caminho: string; valor: any }[] {
 const r = (s.ctx as any).redeNacional || {}, tot = totaisCtx(s.ctx), pubs = publicosLetramento(s).map(p => p.id), out: { caminho: string; valor: any }[] = [];
 const vazioNum = (c: string) => { const v = lerLit(s, c); return !v || (v.valor === '' || v.valor == null) && v.situacao !== 'a_levantar'; };
 const escolas = +r.escolas || tot.escolas, estudantes = +r.estudantes || tot.alunos;
 if (telasLetramento(s).includes('lit-escolas')) {
  if (vazioNum('alcance.escolas') && escolas > 0) out.push({ caminho: 'alcance.escolas', valor: { valor: escolas, origem: 'sugerido' } });
  const etapas = [...tot.etapas, ...(pubs.includes('A15') ? ['superior'] : [])].filter((x, i, a) => a.indexOf(x) === i);
  if (!selecoesLit(s, 'alcance.etapas').length && etapas.length) out.push({ caminho: 'alcance.etapas', valor: { escolhas: etapas, origem: 'sugerido' } });
 }
 if (pubs.includes('A12') && vazioNum('publicos.A12.participantes') && estudantes > 0) out.push({ caminho: 'publicos.A12.participantes', valor: { valor: estudantes, origem: 'sugerido' } });
 return out;
}
export const rotuloLit = (label:string) => label.split(' · ').map(parte=>t(parte)).join(' · ');
const textoValido = (v:any) => typeof v==='string' && v.trim().length>0 && !v.includes('__');
export function campoLitRespondido(s:Estado,f:CampoLit):boolean {
 const v=lerLit(s,f.caminho);
 if(f.numero) return v?.situacao==='a_levantar' || typeof v?.valor==='number' && Number.isFinite(v.valor) && v.valor>0 && (f.numero==='decimal'||Number.isSafeInteger(v.valor));
 return textoValido(v?.detalhe) || Array.isArray(v?.escolhas) && v.escolhas.length>0 && v.escolhas.every((id:string)=>f.opcoes?.some(o=>o.id===id));
}
export function valorCampoLit(s:Estado,f:CampoLit):string {
 const v=lerLit(s,f.caminho); let principal='';
 if(f.numero) principal=v?.situacao==='a_levantar'?t(PENDENTE.texto):campoLitRespondido(s,f)&&typeof v?.valor==='number'&&Number.isFinite(v.valor)&&v.valor>0?new Intl.NumberFormat(String(LOC())).format(v.valor):'';
 else principal=(f.opcoes||[]).filter(o=>selecoesLit(s,f.caminho).includes(o.id)).map(o=>t(o.texto)).join('; ');
 if(f.evidencia&&principal) principal=t('Tipo de evidência selecionado: {tipo}. Identificação do documento: a verificar.',{tipo:principal});
 return [principal,textoValido(v?.detalhe)?v.detalhe:''].filter(Boolean).join('\n') || t('Não informado');
}
/** Público elegível e total distinto saíram do fluxo de teste: não há mais conferência entre eles. */
export function errosAlcance(_s:Estado):string[] { return []; }
export function custosLetramento(s:Estado):[string,string][] {
 const itens:[string,string][]=[['diagnostico',L('Diagnóstico e avaliação de competências','Assessment and competency evaluation')],['desenho',L('Desenho pedagógico e curricular','Pedagogical and curriculum design')],['materiais',L('Materiais, tradução e acessibilidade','Materials, translation and accessibility')],['equipe',L('Equipe e coordenação do programa','Programme staff and coordination')],['apoio',L('Apoio e acompanhamento pedagógico','Pedagogical support and monitoring')]];
 if(publicosLetramento(s).length) itens.push(['formadores',L('Formação de formadores','Training of trainers')],['oferta',L('Realização da formação e tempo das equipes','Training delivery and staff time')]);
 if(curriculo(s)) itens.push(['curriculo',L('Desenho curricular','Curriculum design')]);
 for(const id of adicionaisAtivos(s)) itens.push([id, t('Recurso adicional {n}', { n: id.split('-').pop() || '' })]);
 return itens;
}
export function orcamentoLetramento(s:Pick<Estado14,'ctx'|'moeda'>) {
 const o=s.ctx.letramento?.orcamento||{}, gov=orcamentoGovernanca(s);
 const itens=custosLetramento(s).map(([id,nome])=>{
  const x=o.itens?.[id]||{}, compartilhado=x.situacao==='compartilhado'&&s.ctx.prioridades?.includes('governar');
  const origem=compartilhado?gov.itens.find(i=>i.id===x.referencia):null;
  const estimativa=estimativaReferencia('letramento',id,s), emRef=!compartilhado&&itemEmReferencia('letramento',id,x);
  const valor=compartilhado||x.situacao==='referencia'?null:x.situacao==='sem_custo'?0:x.situacao==='informado'&&typeof x.valor==='number'&&Number.isFinite(x.valor)&&x.valor>=0?x.valor:null;
  return {id,nome:t(nome),valor,compartilhado,origem,detalhe:String(x.detalhe||''),situacao:String(x.situacao||''),estimativa,referencia:emRef,estimado:valorEstimado(estimativa,emRef),respondido:compartilhado?!!origem:['a_estimar','sem_custo'].includes(x.situacao)||emRef||valor!==null};
 });
 // Custo compartilhado: conhecido quando a origem tem valor informado ou estimado; nunca é somado de novo nesta frente.
 const tot=totaisOrcamento(itens.map(i=>i.compartilhado?{valor:null,estimado:null,conta:false,falta:!i.origem||i.origem.valor===null&&i.origem.estimado===null}:i));
 const propios=itens.filter(i=>!i.compartilhado&&i.valor!==null);
 return {itens,moeda:String(o.moeda||s.moeda.cod||'USD'),periodo:o.periodo,fonte:o.fonte,subtotal:tot.informado,temSubtotal:propios.length>0||itens.some(i=>i.compartilhado&&i.origem?.valor!=null),...tot};
}
export function letramentoRespondido(s:Estado14,id:string):boolean {
 const campos=camposLetramento(s).filter(f=>f.tela===id);
 if(!campos.length)return false;
 return campos.every(f=>campoLitRespondido(s,f)) && (id!=='lit-recursos'||orcamentoLetramento(s).itens.every(i=>i.respondido));
}
export function planoLetramento(s:Estado14) {
 const campos=camposLetramento(s),o=orcamentoLetramento(s), qs=idsTemas(s),pubs=publicosLetramento(s);
 const faltam=telasLetramento(s).filter(id=>id.startsWith('lit-')&&!letramentoRespondido(s,id));
 if(!s.respC.pais||!s.caso.pais)faltam.unshift('local');if(!qs.length||!s.respC.problemas)faltam.unshift('problemas');
 const indefinidos=campos.filter(f=>{const v=lerLit(s,f.caminho);return v?.situacao==='a_levantar'||selecoesLit(s,f.caminho).includes('_pendente');}).length;
 const blocos=[{titulo:t('Contexto'),linhas:[{rotulo:t('País'),valor:nomePais(paisDoCaso(s.caso))},{rotulo:t('Instituição responsável'),valor:String(s.ctx.local||t('Não informado'))},...(textoValido(lerLit(s,'contexto.detalhe'))?[{rotulo:t('Informações adicionais'),valor:lerLit(s,'contexto.detalhe')}]:[]),...(textoValido(s.ctx.problemaOutro)?[{rotulo:t('Informações adicionais'),valor:s.ctx.problemaOutro}]:[]),{rotulo:t(L('Públicos selecionados','Selected audiences')),valor:[...pubs.map(p=>t(p.nome)),...(curriculo(s)?[t(L('Currículo nacional de IA','National AI curriculum'))]:[])].join('; ')||t('Não informado')}]},...telasLetramento(s).filter(id=>id.startsWith('lit-')).map(id=>({titulo:t(tituloDaTelaLit(s,id)),linhas:campos.filter(f=>f.tela===id).map(f=>({rotulo:rotuloLit(f.label),valor:valorCampoLit(s,f)}))}))];
 const recursos=blocos.find(b=>b.titulo===t(TITULOS_LIT['lit-recursos']))!;
 recursos.linhas.push(...o.itens.map(i=>({rotulo:i.nome,valor:i.compartilhado?t(L('Custeado na governança: {item} — {valor}. Não somado novamente.','Funded under governance: {item} — {valor}. Not counted again.'),{item:i.origem?.nome||t('Não informado'),valor:i.origem?valorItemOrcamento(i.origem,orcamentoGovernanca(s).moeda):t('Não informado')}):valorItemOrcamento(i,o.moeda)})),...linhasTotais(o).map(l=>({rotulo:l.rotulo,valor:l.valor})),...notaEstimativas(o),...(o.itens.some(i=>i.compartilhado)?[{rotulo:t('Custos compartilhados'),valor:t('Registrados na frente de origem; não somados novamente.')}]:[]));
 return {titulo:t(L('Plano nacional de letramento em IA e currículo','National AI literacy and curriculum plan')),pais:nomePais(paisDoCaso(s.caso)),blocos,faltam,pendentes:indefinidos+o.faltam,orcamento:o,projeto:null,acoes:[],escopo:t(L('Participantes, horas e recursos de formação e currículo. Valores desconhecidos permanecem pendentes.','Participants, hours and resources for training and curriculum. Unknown amounts remain pending.')),proxima:t(faltam.length||indefinidos||o.faltam?L('Complete as informações e resolva as pendências antes de aprovar o programa.','Complete the information and resolve pending items before approving the programme.'):L('Revise o plano com os responsáveis e acompanhe a execução e os resultados.','Review the plan with its owners and monitor delivery and outcomes.'))};
}
export function telaLetramentoLegada(id:string):string {
 const mapa:Record<string,string>={etapas:'lit-alcance',problema:'lit-diagnostico',impactos:'lit-desenho',linhaBase:'lit-diagnostico',alternativa:'lit-desenho',governanca:'lit-diagnostico',testes:'lit-oferta',tarefas:'lit-desenho',usuarios:'lit-alcance',afetados:'lit-alcance',tipoTec:'lit-oferta',pagamento:'lit-recursos',piloto:'lit-validacao',internet:'lit-digital',modeloDisp:'lit-digital',formados:'lit-oferta',suporteNivel:'lit-oferta',implantacao:'lit-acoes',elegiveis:'lit-alcance',expansao:'lit-revisao'};
 return mapa[id]||id;
}
