// Modelo nacional de formação/currículo. Seleções são intenções declaradas, nunca evidências presumidas.
import { PRIORIDADES, ETAPAS_ENS, LOC, nomePais, paisDoCaso, totaisCtx } from '../domain';
import { orcamentoGovernanca, moedaGovernanca, valorItemOrcamento } from './governanca';
import { estimativaReferencia, itemEmReferencia, valorEstimado, totaisOrcamento, linhasTotais, notaEstimativas } from './estimativasOrcamento';
import { t } from './textos';
import { orcamentoV16, fasesSalvas, linhasFases, proximoV16, instituicaoV16, categoriasEscolhidas } from './orcamentoV016';
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
 return idsTemas(s).filter(id => ['A11','A12'].includes(id)).map(id => ({ id, ...(TEMAS_LIT[id] || { nome: cat.find((q: any) => q.id === id)?.t || id, competencias:TEMAS_LIT.A12.competencias }) }));
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
 // v017: Públicos (quem e quantos) → categorias → opções → fases e valores
 return ['local','prioridades','problemas',...(pubs.length ? ['lit-participantes'] : []),'lit-categorias','lit-opcoes','lit-fases','lit-recursos'];
}
/** Campos do fluxo de teste. Os demais (diagnóstico, desenho, oferta, ações, revisão, público elegível, total distinto…)
 *  continuam guardados no caso, fora das telas, das pendências, do progresso e dos relatórios. */
export function camposLetramento(s: Estado): CampoLit[] {
 // v016: só públicos (professores, estudantes), número de pessoas, níveis, lideranças, entrega e duração. Todos opcionais.
 const campos: CampoLit[] = [];
 const n = (caminho:string,label:string,numero:'inteiro'|'decimal'='inteiro') => campos.push({tela:'lit-participantes',caminho,label,numero,opcional:true});
 const pubs = publicosLetramento(s).map(p => p.id);
 if (pubs.includes('A11')) {
  n('publicos.A11.participantes',L('Professores','Teachers'));
  campos.push({tela:'lit-participantes',caminho:'publicos.A11.incluiLiderancas',label:L('Inclui diretores e coordenadores?','Include principals and coordinators?'),opcoes:[o('sim','Sim','Yes'),o('nao','Não','No')],opcional:true});
  if (selecoesLit(s,'publicos.A11.incluiLiderancas').includes('sim')) n('publicos.A11.liderancas',L('Diretores e coordenadores','Principals and coordinators'));
  // v017: horas e forma de entrega ficam nas opções da 1.2 (presencial, online, híbrida…), na tela Valores
 }
 if (pubs.includes('A12')) {
  campos.push({tela:'lit-participantes',caminho:'publicos.A12.niveis',label:L('Níveis','Levels'),opcoes:(ETAPAS_ENS as any[]).filter(([id]:string[])=>['fund1','fund2','medio','superior','profissional','eja'].includes(id)).map(([id,nome]:string[])=>({id,texto:nome})),multipla:true,opcional:true});
  n('publicos.A12.participantes',L('Estudantes','Students'));
 }
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
 // v016: 3 desafios × 11 categorias, com fases (orcamentoV016)
 return orcamentoV16(s,'letramento');
}
export function letramentoRespondido(s:Estado14,id:string):boolean {
 if(id==='lit-fases')return fasesSalvas(s,'letramento');
 if(id==='lit-categorias')return categoriasEscolhidas(s,'letramento').length>0;
 if(id==='lit-opcoes'){const it=orcamentoLetramento(s).itens;return it.length>0&&it.every(i=>i.marcadas.length>0);}
 if(id==='lit-recursos'){const it=orcamentoLetramento(s).itens;return it.length>0&&it.every(i=>i.respondido);}
 const campos=camposLetramento(s).filter(f=>f.tela===id);
 if(!campos.length)return id==='lit-participantes';
 return campos.every(f=>campoLitRespondido(s,f)) && (id!=='lit-recursos'||orcamentoLetramento(s).itens.every(i=>i.respondido));
}
export function planoLetramento(s:Estado14) {
 const campos=camposLetramento(s),o=orcamentoLetramento(s), qs=idsTemas(s),pubs=publicosLetramento(s);
 const faltam=telasLetramento(s).filter(id=>id.startsWith('lit-')&&!letramentoRespondido(s,id));
 if(!s.respC.pais||!s.caso.pais)faltam.unshift('local');if(!qs.length||!s.respC.problemas)faltam.unshift('problemas');
 const indefinidos=campos.filter(f=>{const v=lerLit(s,f.caminho);return v?.situacao==='a_levantar'||selecoesLit(s,f.caminho).includes('_pendente');}).length;
 const blocos=[{titulo:t('Contexto'),linhas:[{rotulo:t('País'),valor:nomePais(paisDoCaso(s.caso))},{rotulo:t('Instituição responsável'),valor:instituicaoV16(s)||t('Não informado')},...(textoValido(lerLit(s,'contexto.detalhe'))?[{rotulo:t('Informações adicionais'),valor:lerLit(s,'contexto.detalhe')}]:[]),...(textoValido(s.ctx.problemaOutro)?[{rotulo:t('Informações adicionais'),valor:s.ctx.problemaOutro}]:[]),{rotulo:t(L('Públicos selecionados','Selected audiences')),valor:[...pubs.map(p=>t(p.nome)),...(curriculo(s)?[t(L('Currículo nacional de IA','National AI curriculum'))]:[])].join('; ')||t('Não informado')}]},...telasLetramento(s).filter(id=>id.startsWith('lit-')&&id!=='lit-fases').map(id=>({titulo:t(tituloDaTelaLit(s,id)),linhas:campos.filter(f=>f.tela===id).map(f=>({rotulo:rotuloLit(f.label),valor:valorCampoLit(s,f)}))}))];
 const recursos=blocos.find(b=>b.titulo===t(TITULOS_LIT['lit-recursos']))!;
 recursos.linhas.push({rotulo:t('Fases'),valor:String(o.periodo)},...o.itens.map(i=>({rotulo:i.nome,valor:i.compartilhado?t(L('Custeado na governança: {item} — {valor}. Não somado novamente.','Funded under governance: {item} — {valor}. Not counted again.'),{item:i.origem?.nome||t('Não informado'),valor:i.origem?valorItemOrcamento(i.origem,orcamentoGovernanca(s).moeda):t('Não informado')}):valorItemOrcamento(i,o.moeda)})),...linhasTotais(o).map(l=>({rotulo:l.rotulo,valor:l.valor})),...linhasFases(o),...notaEstimativas(o),...(o.itens.some(i=>i.compartilhado)?[{rotulo:t('Custos compartilhados'),valor:t('Registrados na frente de origem; não somados novamente.')}]:[]));
 return {titulo:t(L('Plano de letramento em IA e currículo','AI literacy and curriculum plan')),pais:nomePais(paisDoCaso(s.caso)),blocos,faltam,pendentes:indefinidos+o.faltam,orcamento:o,projeto:null,acoes:[],escopo:o.estimados?t('O orçamento separa os valores informados das estimativas de referência escolhidas, que são ilustrativas, e mostra o custo por fase.'):t('O orçamento usa apenas valores informados e mostra o custo por fase.'),proxima:proximoV16(o)};
}
export function telaLetramentoLegada(id:string):string {
 const mapa:Record<string,string>={etapas:'lit-alcance',problema:'lit-diagnostico',impactos:'lit-desenho',linhaBase:'lit-diagnostico',alternativa:'lit-desenho',governanca:'lit-diagnostico',testes:'lit-oferta',tarefas:'lit-desenho',usuarios:'lit-alcance',afetados:'lit-alcance',tipoTec:'lit-oferta',pagamento:'lit-recursos',piloto:'lit-validacao',internet:'lit-digital',modeloDisp:'lit-digital',formados:'lit-oferta',suporteNivel:'lit-oferta',implantacao:'lit-acoes',elegiveis:'lit-alcance',expansao:'lit-revisao'};
 return mapa[id]||id;
}
