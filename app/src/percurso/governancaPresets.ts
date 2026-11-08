// Opções editoriais, nunca fatos preenchidos automaticamente. Seleções têm IDs estáveis.
import { PRIORIDADES } from '../domain/prioridades.js';
import { t } from './textos';
export interface OpcaoGov { id: string; texto: string }
export interface PresetGov { opcoes: OpcaoGov[]; multipla: boolean; evidencia?: boolean }
type Estado = { ctx: Record<string, any> };
const DONOS = ['Ministério da Educação', 'Equipe de IA e tecnologia educacional', 'Autoridade de proteção de dados', 'Comitê interinstitucional'];
const GRUPOS = ['Estudantes', 'Professores', 'Gestores escolares', 'Famílias', 'Instituições de pesquisa', 'Sociedade civil'];
const ATUAL = ['Ainda não há instrumentos definidos', 'Há iniciativas isoladas', 'Há instrumentos que precisam ser revisados', 'Há instrumentos consolidados'];
const BASE = ['Ainda não há levantamento', 'Há um inventário parcial', 'Há um inventário consolidado'];
const FONTES = ['Documentos oficiais', 'Levantamento institucional', 'Consulta às equipes responsáveis'];
const MARCOS = ['Elaboração', 'Consulta', 'Aprovação pela autoridade competente', 'Publicação', 'Comunicação', 'Aplicação', 'Supervisão', 'Avaliação'];
export const TEMAS_GOV: Record<string, { entrega: string; instrumento: string; lacuna: string; indicador: string }> = {
 G11: { entrega: 'Elaborar regulamentação e orientações de IA na educação', instrumento: 'Regulamentação ou orientação de IA na educação', lacuna: 'Definir regras de uso e responsabilidades', indicador: 'Regulamentação ou orientação publicada' },
 G12: { entrega: 'Incorporar a IA à estratégia nacional de educação', instrumento: 'Estratégia nacional de educação', lacuna: 'Integrar objetivos, recursos e responsabilidades para IA', indicador: 'Estratégia nacional atualizada' },
 G13: { entrega: 'Definir medidas de soberania e proteção de dados educacionais', instrumento: 'Política de proteção e governança de dados', lacuna: 'Definir controle, acesso e compartilhamento dos dados', indicador: 'Regras de proteção de dados estabelecidas' },
 G14: { entrega: 'Desenvolver a capacidade institucional de governança de IA', instrumento: 'Plano de capacidade institucional', lacuna: 'Definir equipe, competências e formação', indicador: 'Equipe responsável designada e formada' },
 G15: { entrega: 'Definir um ambiente supervisionado de experimentação educacional', instrumento: 'Protocolo de experimentação supervisionada', lacuna: 'Definir supervisão, salvaguardas e critérios de avaliação', indicador: 'Protocolo de experimentação aprovado' },
 G16: { entrega: 'Estabelecer salvaguardas para a segurança e os direitos das crianças', instrumento: 'Protocolo de proteção de crianças e adolescentes', lacuna: 'Definir salvaguardas, reclamações e resposta a incidentes', indicador: 'Salvaguardas e canal de reclamações estabelecidos' },
 G17: { entrega: 'Definir medidas de equidade, acessibilidade e inclusão', instrumento: 'Plano de equidade e acessibilidade', lacuna: 'Identificar barreiras de acesso e grupos menos atendidos', indicador: 'Medidas de equidade e acessibilidade definidas' },
 G18: { entrega: 'Estabelecer transparência, prestação de contas e avaliação contínua', instrumento: 'Plano de transparência e avaliação', lacuna: 'Definir indicadores, prestação de contas e revisão', indicador: 'Relatórios de acompanhamento publicados' },
};
const LEGADOS: Record<string, string> = { G1:'G11', G2:'G14', G3:'G13', G4:'G18', G5:'G13', G6:'G11', G7:'G18', G8:'G17', G9:'G14', G10:'G13' };
const catalogo = (PRIORIDADES as any[]).flatMap(p => p.problemas);
export function temasDoCaso(s: Estado) {
 const ids: string[] = s.ctx.problemas || [];
 return ids.filter(id => /^G\d+$/.test(id)).map(id => ({ id, ...(TEMAS_GOV[id] || TEMAS_GOV[LEGADOS[id]] || TEMAS_GOV.G18) }));
}
const idTexto = (texto: string) => { let h=2166136261; for (const c of texto) h=Math.imul(h ^ c.charCodeAt(0),16777619); return 'op-' + (h >>> 0).toString(36); };
const lista = (textos: readonly string[], multipla = true, pendencia = 'A definir'): PresetGov => ({
 opcoes: [...new Set(textos)].map(texto => ({ id: idTexto(texto), texto })).concat([{ id: 'a_definir', texto: pendencia }]), multipla,
});
// IDs baseados no desafio, para que alterar a seleção nunca reaproveite uma resposta de outro tema.
const porTema = (s: Estado, campo: 'entrega'|'instrumento'|'lacuna'|'indicador', extras: string[] = []): PresetGov => ({
 opcoes: [...temasDoCaso(s).map(q => ({ id: q.id, texto: q[campo] })), ...extras.map((texto, i) => ({ id: 'extra-' + i, texto })), { id:'a_definir',texto:'A definir' }], multipla:true,
});
export function presetGovernanca(s: Estado, caminho: string): PresetGov {
 const [base, parte, sub] = caminho.split('.');
 const tema = TEMAS_GOV[parte] || TEMAS_GOV[LEGADOS[parte]];
 if (base === 'govDiagnostico') {
  if (parte === 'atual') return lista(ATUAL, false, 'Situação ainda não verificada');
  if (parte === 'resultado') return porTema(s, 'entrega', ['Definir ações institucionais para os desafios selecionados']);
  if (parte === 'linhaBase') return lista(BASE, false, 'Linha de base ainda não verificada');
  return lista(FONTES, true, 'Fonte ainda a verificar');
 }
 if (base === 'govInstrumentos') {
  if (sub === 'instrumento') return lista(tema ? [tema.instrumento, 'Normas gerais já existentes', 'Orientações setoriais'] : ['Normas gerais já existentes','Orientações setoriais'],true,'Instrumento ainda a verificar');
  if (sub === 'responsavel') return lista(DONOS, false);
  if (sub === 'evidencia') return { ...lista(['Documento oficial publicado','Relatório ou inventário institucional','Ata ou registro de decisão','Minuta em elaboração'],true,'Evidência ainda a verificar'), evidencia:true };
  return lista(tema ? [tema.lacuna,'Revisar os instrumentos existentes','Verificar a aplicação nas instituições'] : ['Revisar os instrumentos existentes','Definir responsabilidades','Verificar a aplicação nas instituições']);
 }
 if (base === 'govAcoes') {
  if (sub === 'entrega') return lista(tema ? [tema.entrega, 'Revisar e atualizar os instrumentos existentes'] : ['Definir ação institucional para o desafio','Revisar e atualizar os instrumentos existentes']);
  if (sub === 'responsavel') return lista(DONOS,false);
  if (sub === 'prazo') return lista(['Até 3 meses','Até 6 meses','Até 12 meses','Até 24 meses'],false);
  if (sub === 'marco') return lista(MARCOS);
  return lista(tema ? [tema.indicador,'Consulta concluída','Responsabilidades formalizadas'] : ['Entrega institucional concluída','Consulta concluída','Responsabilidades formalizadas']);
 }
 if (base === 'govSolucoes') return lista(['Estabelecer regras claras','Organizar a coordenação institucional','Desenvolver competências','Proteger direitos e reduzir riscos','Acompanhar resultados e prestar contas']);
 if (base === 'govAtores') {
  if (parte === 'coordenacao') return lista(DONOS,false);
  if (parte === 'instituicoes') return lista([...DONOS,'Redes e instituições de ensino','Instituições de pesquisa']);
  if (parte === 'grupos') return lista(GRUPOS);
  return lista(['Consulta pública','Grupos de trabalho','Escuta de escolas e famílias','Participação de estudantes com salvaguardas','Consulta a especialistas']);
 }
 if (base === 'govCapacidade') {
  if (parte === 'equipe') return lista(['Equipe existente com atribuições formalizadas','Equipe interinstitucional','Apoio técnico especializado']);
  if (parte === 'formacao') return lista(['Fundamentos de IA e uso responsável','Avaliação de riscos e impactos',...(temasDoCaso(s).some(q=>['G13','G16'].includes(q.id)) ? ['Proteção de dados e direitos das crianças'] : []),...(temasDoCaso(s).some(q=>['G11','G12'].includes(q.id)) ? ['Elaboração de políticas e regulamentação de IA'] : []),'Supervisão e avaliação de políticas públicas']);
  if (parte === 'orientacao') return lista(['Guias de orientação','Perguntas frequentes','Encontros com as instituições','Canal de atendimento institucional']);
  if (parte === 'supervisao') return lista(['Revisão periódica de conformidade','Acompanhamento por comitê','Relatórios das instituições']);
  return lista(['Canal de incidentes e reclamações','Responsáveis e prazos de resposta','Procedimento de encaminhamento e correção']);
 }
 if (base === 'govOrcamento') {
  if (parte === 'periodo') return lista(['Próximos 12 meses','Próximos 24 meses','Próximos 36 meses'],false);
  if (parte === 'fonte') return lista(['Orçamento institucional','Custos levantados pela equipe','Estimativas de fornecedores ou especialistas'],true,'Valores ainda a levantar');
  if (caminho.endsWith('.nome')) return lista(['Equipamentos para a equipe','Conectividade para a equipe','Assessoria especializada','Pesquisa e avaliação','Apoio à participação social']);
  return lista(['Equipe existente','Serviço a contratar','Atividade interna','Recurso já disponível'],true,'Detalhamento ainda a definir');
 }
 if (base === 'projetoIA') {
  const qs = catalogo.filter((q: any) => ((s.ctx.problemas || []).includes(q.id) || (s.ctx.govSelecoes?.[caminho] || []).includes(q.id)) && !/^G\d+$/.test(q.id) && q.tarefas?.length);
  return { opcoes:[...qs.map((q: any) => ({ id:q.id,texto:t(q.obj).replace(/__/g,t('a definir')) })),
   {id:'planos_aula',texto:'Apoio de IA ao planejamento de aulas por professores'},
   {id:'feedback',texto:'Apoio de IA à devolutiva de atividades de estudantes'},
   {id:'atendimento',texto:'Atendimento assistido por IA a escolas e famílias'}],multipla:false };
 }
 if (base === 'govSandbox') {
  if (parte === 'objetivo') return lista(['Avaliar usos educacionais em ambiente supervisionado','Verificar salvaguardas antes de ampliar o uso','Produzir evidências para decisões públicas']);
  if (parte === 'escopo') return lista(['Ambiente controlado com dados fictícios','Instituições participantes voluntárias','Equipe técnica e educadores','Participação de estudantes condicionada às salvaguardas']);
  if (parte === 'responsavel') return lista(DONOS,false);
  if (parte === 'salvaguardas') return lista(['Supervisão humana','Proteção de dados','Proteção de crianças e adolescentes','Canal de incidentes','Interrupção em caso de risco']);
  if (parte === 'avaliacao') return lista(['Cumprimento das salvaguardas','Resultados educacionais','Efeitos sobre equidade e inclusão','Relatório de avaliação independente']);
  return lista(['Encerrar se houver risco não controlado','Revisar as salvaguardas antes de continuar','Continuar somente após avaliação e aprovação competente']);
 }
 if (base === 'govRevisao') {
  if (parte === 'indicadores') return porTema(s,'indicador',['Prazos de execução cumpridos','Participação dos grupos afetados','Incidentes e medidas corretivas']);
  if (parte === 'responsavel') return lista(DONOS,false);
  if (parte === 'periodicidade') return lista(['Trimestral','Semestral','Anual'],false);
  if (parte === 'data') return lista(['Em 3 meses','Em 6 meses','Em 12 meses','Após a publicação do instrumento'],false);
  if (parte === 'alcance') return lista(['Toda a rede nacional','Instituições responsáveis pela aplicação','Grupos afetados pela política']);
  if (parte === 'progresso') return lista(['Não iniciado','Em elaboração','Em consulta','Em aprovação','Em aplicação','Em revisão'],false);
  return lista(['Relatório público periódico','Painel público de acompanhamento','Consulta e devolutiva à sociedade','Canal de prestação de contas']);
 }
 return lista(['Definir no plano de ação']);
}
export function selecoesGov(s: Estado,campo: string): string[] { return Array.isArray(s.ctx.govSelecoes?.[campo]) ? s.ctx.govSelecoes[campo] : []; }
export function detalheGov(s: Estado,campo: string): string {
 if (Object.hasOwn(s.ctx.govDetalhes || {},campo)) return String(s.ctx.govDetalhes[campo] || '');
 if (Object.hasOwn(s.ctx.govSelecoes || {},campo)) return '';
 return String(campo.split('.').reduce((o: any,k) => o?.[k],s.ctx) || '');
}
export function valorGov(s: Estado,campo: string): string {
 const ids=selecoesGov(s,campo), def=presetGovernanca(s,campo);
 const opcoes=def.opcoes.filter(o=>ids.includes(o.id));
 const texto=opcoes.map(o=>t(o.texto)).join('; '), detalhe=detalheGov(s,campo);
 return [texto,detalhe].filter(Boolean).join('\n');
}
export function textoSelecaoGov(s: Estado,campo: string,ids: string[],detalhe: string): string {
 return [...presetGovernanca(s,campo).opcoes.filter(o=>ids.includes(o.id)).map(o=>o.texto),detalhe].filter(Boolean).join('\n');
}
export function definicoesPendentes(s: Estado): number {
 return Object.entries(s.ctx.govSelecoes || {}).filter(([path,ids]) =>
   Array.isArray(ids) && ids.includes('a_definir') && (!path.startsWith('govSandbox.') || (s.ctx.problemas || []).includes('G15')) && (!path.startsWith('govInstrumentos.') && !path.startsWith('govAcoes.') || (s.ctx.problemas || []).includes(path.split('.')[1]))
 ).length;
}
/** Tradução das seleções por ID; os textos livres anteriores continuam intactos. */
export function contextoGovProjetado(s: Estado): Record<string, any> {
 const x = { ...s.ctx };
 for (const caminho of Object.keys(s.ctx.govSelecoes || {})) {
  if (!/^(govDiagnostico|govInstrumentos|govSolucoes|govAtores|govAcoes|govCapacidade|govOrcamento|govSandbox|govRevisao|projetoIA)\.[a-zA-Z0-9.-]+$/.test(caminho)) continue;
  const ks=caminho.split('.'); if (ks.some(k=>['__proto__','prototype','constructor'].includes(k))) continue;
  let obj=x;
  for (const k of ks.slice(0,-1)) { obj[k]=Array.isArray(obj[k]) ? [...obj[k]] : {...obj[k]}; obj=obj[k]; }
  obj[ks[ks.length-1]]=valorGov(s,caminho);
 }
 return x;
}
