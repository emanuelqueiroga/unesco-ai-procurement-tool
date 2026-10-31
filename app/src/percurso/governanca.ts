import { contextoGovProjetado, definicoesPendentes } from './governancaPresets';
// Projeção institucional: a página, o painel e os dois PDFs leem este mesmo modelo.
// Os totais da rede são contexto; nenhuma conta deriva licenças ou participantes deles.
import { problemasMarcados } from '../domain/prioridades.js';
import { LOC } from '../domain/i18n.js';
import { nomePais, paisDoCaso } from '../domain/pais.js';
import { tamanhoRedeValido, projetoUsoDefinido } from '../domain/escopo.js';
import type { Estado14 } from '../store/tipos';
import { t } from './textos';
export const CUSTOS_GOV = [
  ['equipe', 'Equipe e coordenação'], ['estudos', 'Estudos e assessoria'], ['consulta', 'Consulta e participação'],
  ['formacao', 'Formação institucional'], ['comunicacao', 'Comunicação e orientação'],
  ['supervisao', 'Supervisão e resposta a incidentes'], ['avaliacao', 'Avaliação e revisão'],
] as const;
export const INSTRUMENTOS_GOV = ['Regulamentação', 'Orientações e normas de uso', 'Estratégia nacional de educação', 'Formação institucional', 'Coordenação entre instituições', 'Supervisão e prestação de contas'];
export const MARCOS_GOV = ['Elaboração', 'Consulta', 'Aprovação pela autoridade competente', 'Publicação', 'Comunicação', 'Aplicação', 'Supervisão', 'Avaliação'];
export const CAMPOS_SANDBOX = [
 ['objetivo', 'Objetivo da experimentação'], ['escopo', 'Escopo e participantes'], ['responsavel', 'Instituição responsável'],
 ['salvaguardas', 'Salvaguardas e supervisão'], ['avaliacao', 'Critérios de avaliação'], ['saida', 'Condições de encerramento ou continuidade'],
] as const;
const ENTREGAS: Record<string, string> = {
 G11: 'Elaborar regulamentação e orientações de IA na educação',
 G12: 'Incorporar a IA à estratégia nacional de educação',
 G13: 'Definir medidas de soberania e proteção de dados educacionais',
 G14: 'Desenvolver a capacidade institucional de governança de IA',
 G15: 'Definir um ambiente supervisionado de experimentação educacional',
 G16: 'Estabelecer salvaguardas para a segurança e os direitos das crianças',
 G17: 'Definir medidas de equidade, acessibilidade e inclusão',
 G18: 'Estabelecer transparência, prestação de contas e avaliação contínua',
};
export const preenchido = (v: unknown) => typeof v === 'string' && v.trim().length > 0 && !v.includes('__');
export function desafiosGovernanca(s: Pick<Estado14, 'ctx'>): { id: string; titulo: string }[] {
  const qs = problemasMarcados(s.ctx).map((q: any) => ({ id: q.id as string, titulo: t(q.t) }));
  if (preenchido(s.ctx.problemaOutro)) qs.push({ id: 'outro', titulo: String(s.ctx.problemaOutro).trim() });
  return qs;
}
export function temSandbox(s: Pick<Estado14, 'ctx'>): boolean { return desafiosGovernanca(s).some(q => q.id === 'G15'); }
export function acoesGovernanca(s: Pick<Estado14, 'ctx'>) {
  return desafiosGovernanca(s).map(q => {
    const a = contextoGovProjetado(s).govAcoes?.[q.id] || {};
    return { ...q, entrega: preenchido(a.entrega) ? a.entrega : ENTREGAS[q.id] ? t(ENTREGAS[q.id]) : t('Definir ação institucional para: {desafio}', { desafio: q.titulo }),
      sugerida: !preenchido(a.entrega), responsavel: String(a.responsavel || ''), prazo: String(a.prazo || ''),
      marco: String(a.marco || ''), indicador: String(a.indicador || '') };
  });
}
function valorCusto(v: unknown): number | null { return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null; }
export function orcamentoGovernanca(s: Pick<Estado14, 'ctx' | 'moeda'>) {
  const o = contextoGovProjetado(s).govOrcamento || {};
  const valorItem = (i: any) => i?.situacao === 'sem_custo' ? 0 : i?.situacao === 'a_estimar' ? null : valorCusto(i?.valor);
  const categorias: [string, string][] = CUSTOS_GOV.map(([id, nome]) => [id, nome]);
  if (temSandbox(s)) categorias.push(['sandbox', 'Experimentação supervisionada']);
  const extras = Array.isArray(o.extras) ? o.extras : [];
  const itens = categorias.map(([id, nome]) => ({ id, nome: t(nome), valor: valorItem(o.itens?.[id]), detalhe: String(o.itens?.[id]?.detalhe || '') }))
    .concat(extras.map((x: any, i: number) => ({ id: 'extra-' + i, nome: String(x.nome || t('Recurso adicional')), valor: valorItem(x), detalhe: String(x.detalhe || '') })));
  const informados = itens.filter(i => i.valor !== null);
  return { itens, moeda: String(o.moeda || s.moeda.cod || 'USD'), periodo: String(o.periodo || ''), fonte: String(o.fonte || ''),
    subtotal: informados.reduce((n, i) => n + i.valor!, 0), informados: informados.length,
    faltam: itens.length - informados.length, total: informados.length === itens.length && extras.every((e: any) => preenchido(e.nome)) ? informados.reduce((n, i) => n + i.valor!, 0) : null };
}
export function moedaGovernanca(v: number | null, cod: string, locale?: string): string {
  if (v === null) return t('Não informado');
  try { return new Intl.NumberFormat(locale || undefined, { style: 'currency', currency: cod }).format(v); }
  catch { return cod + ' ' + new Intl.NumberFormat(locale || undefined, { maximumFractionDigits: 2 }).format(v); }
}
export function governancaRespondida(s: Estado14, id: string): boolean {
  const x = contextoGovProjetado(s), qs = desafiosGovernanca(s), tem = (obj: any, keys: string[]) => keys.every(k => preenchido(obj?.[k]));
  switch (id) {
    case 'gov-projeto': return x.projetoIA?.incluir === 'nao' || projetoUsoDefinido(x);
    case 'gov-diagnostico': return tem(x.govDiagnostico, ['atual', 'resultado', 'linhaBase', 'fonte']);
    case 'gov-instrumentos': return qs.length > 0 && qs.every(q => { const d = x.govInstrumentos?.[q.id]; return d && ['existente', 'parcial', 'ausente', 'nao_sei'].includes(d.situacao)
      && tem(d, ['responsavel']) && (d.situacao === 'existente' ? tem(d, ['instrumento', 'evidencia']) : tem(d, ['lacuna'])); });
    case 'gov-solucoes': return Array.isArray(x.govSolucoes?.instrumentos) && x.govSolucoes.instrumentos.length > 0 && tem(x.govSolucoes, ['justificativa']);
    case 'gov-atores': return tem(x.govAtores, ['coordenacao', 'instituicoes', 'grupos', 'participacao']);
    case 'gov-acoes': return qs.length > 0 && acoesGovernanca(s).every(a => [a.responsavel, a.prazo, a.marco, a.indicador].every(preenchido));
    case 'gov-capacidade': return tem(x.govCapacidade, ['equipe', 'formacao', 'orientacao', 'supervisao', 'incidentes']);
    case 'gov-recursos': { const o = orcamentoGovernanca(s); const salvo = x.govOrcamento || {};
      const completo = o.itens.every(i => { const item = i.id.startsWith('extra-') ? salvo.extras?.[Number(i.id.slice(6))] : salvo.itens?.[i.id];
        return i.valor !== null || item?.situacao === 'a_estimar'; });
      return completo && (salvo.extras || []).every((e: any) => preenchido(e.nome)) && preenchido(o.periodo) && preenchido(o.fonte); }
    case 'gov-sandbox': return temSandbox(s) && tem(x.govSandbox, CAMPOS_SANDBOX.map(([k]) => k));
    case 'gov-revisao': return tem(x.govRevisao, ['indicadores', 'responsavel', 'periodicidade', 'data', 'alcance', 'progresso', 'canal']);
    default: return false;
  }
}
export interface BlocoGovernanca { titulo: string; linhas: { rotulo: string; valor: string }[] }
export function planoGovernanca(s: Estado14) {
  const x = contextoGovProjetado(s), qs = desafiosGovernanca(s), acoes = acoesGovernanca(s), orcamento = orcamentoGovernanca(s);
  const nao = t('Não informado'), valor = (v: any) => preenchido(v) ? String(v) : nao;
  const linha = (rotulo: string, v: any) => ({ rotulo: t(rotulo), valor: valor(v) });
  const campos = (obj: any, lista: [string, string][]) => lista.map(([k, nome]) => linha(nome, obj?.[k]));
  const blocos: BlocoGovernanca[] = [
    { titulo: t('Contexto'), linhas: [linha('País', nomePais(paisDoCaso(s.caso))), linha('Instituição responsável', x.olhando),
      linha('Total de escolas', Number.isSafeInteger(x.redeNacional?.escolas) && x.redeNacional.escolas > 0 ? new Intl.NumberFormat(String(LOC())).format(x.redeNacional.escolas) : ''), linha('Total de estudantes', Number.isSafeInteger(x.redeNacional?.estudantes) && x.redeNacional.estudantes > 0 ? new Intl.NumberFormat(String(LOC())).format(x.redeNacional.estudantes) : ''),
      ...qs.map(q => linha('Desafio', q.titulo))] },
    { titulo: t('Diagnóstico institucional'), linhas: campos(x.govDiagnostico, [['atual', 'Situação institucional atual'], ['resultado', 'Resultado esperado'], ['linhaBase', 'Linha de base institucional'], ['fonte', 'Fonte da informação']]) },
    ...qs.map(q => { const d = x.govInstrumentos?.[q.id]; const status: Record<string, string> = { existente: 'Existe', parcial: 'Em parte', ausente: 'Não existe', nao_sei: 'Não sei' };
      const dados = d && s.ctx.govSelecoes?.['govInstrumentos.' + q.id + '.evidencia']?.length ? {...d,evidencia: t('Tipo de evidência selecionado: {tipo}. Identificação do documento: a verificar.', {tipo:d.evidencia})} : d;
      const instrumentos: [string,string][] = d?.situacao === 'ausente' ? [] : [['instrumento','Instrumento existente'],['evidencia','Documento ou evidência']];
      return { titulo: q.titulo, linhas: [linha('Situação', d?.situacao ? t(status[d.situacao] || 'Não informado') : ''),
        ...campos(dados, [...instrumentos, ['responsavel','Instituição responsável'],['lacuna','Lacunas a resolver']])] }; }),
    { titulo: t('Soluções de política educacional'), linhas: [linha('Instrumentos de política', (x.govSolucoes?.instrumentos || []).map((v: string) => t(v)).join('; ')), linha('Justificativa', x.govSolucoes?.justificativa)] },
    { titulo: t('Instituições e grupos afetados'), linhas: campos(x.govAtores, [['coordenacao', 'Instituição coordenadora'], ['instituicoes', 'Instituições participantes'], ['grupos', 'Grupos afetados'], ['participacao', 'Como serão ouvidos e envolvidos']]) },
    ...acoes.map(a => ({ titulo: a.entrega, linhas: [linha('Desafio', a.titulo), linha('Origem da entrega', a.sugerida ? t('Sugestão a revisar') : t('informado')),
      linha('Responsável', a.responsavel), linha('Prazo', a.prazo), linha('Marcos de execução', a.marco), linha('Indicador de entrega', a.indicador)] })),
    { titulo: t('Capacidade institucional'), linhas: campos(x.govCapacidade, [['equipe', 'Equipe e competências necessárias'], ['formacao', 'Formação institucional'], ['orientacao', 'Orientação às instituições'], ['supervisao', 'Supervisão e acompanhamento'], ['incidentes', 'Resposta a incidentes e reclamações']]) },
    { titulo: t('Recursos e orçamento'), linhas: [linha('Período do orçamento', orcamento.periodo), linha('Moeda', orcamento.moeda), linha('Fonte dos valores', orcamento.fonte),
      ...orcamento.itens.flatMap(i => [linha(i.nome, moedaGovernanca(i.valor, orcamento.moeda, String(LOC()))), ...(i.detalhe ? [linha('Detalhamento', i.detalhe)] : [])]),
      linha(orcamento.total === null ? 'Subtotal informado' : 'Total informado', orcamento.informados ? moedaGovernanca(orcamento.subtotal, orcamento.moeda, String(LOC())) : nao),
      linha('Itens sem valor informado', String(orcamento.faltam))] },
  ];
  if (temSandbox(s)) blocos.push({ titulo: t('Experimentação supervisionada'), linhas: campos(x.govSandbox, CAMPOS_SANDBOX.map(([k, n]) => [k, n])) });
  blocos.push({ titulo: t('Acompanhamento e revisão'), linhas: campos(x.govRevisao, [['indicadores', 'Indicadores e metas institucionais'], ['responsavel', 'Responsável pelo acompanhamento'], ['periodicidade', 'Periodicidade da revisão'], ['data', 'Próxima revisão'], ['alcance', 'Alcance da política'], ['progresso', 'Progresso de implementação'], ['canal', 'Transparência e prestação de contas']]) });
  const faltam = ['gov-diagnostico', 'gov-instrumentos', 'gov-solucoes', 'gov-atores', 'gov-acoes', 'gov-capacidade', 'gov-recursos', ...(temSandbox(s) ? ['gov-sandbox'] : []), 'gov-revisao'].filter(id => !governancaRespondida(s, id));
  if (!s.caso.pais || !s.respC.pais) faltam.unshift('local');
  if (!tamanhoRedeValido(x) || !qs.length || !s.respC.redeNacional || !(preenchido(x.problemaOutro) || s.respC.problemas)) faltam.unshift('problemas');
  if (x.prioridades?.some((id: string) => id !== 'governar') && !governancaRespondida(s, 'gov-projeto')) faltam.push('gov-projeto');
  const pendentes = definicoesPendentes(s) + orcamento.faltam;
  const proxima = !qs.length ? t('Selecione os desafios do plano.') : faltam.length || pendentes ? t('Complete o diagnóstico, os responsáveis e os recursos antes de aprovar o plano de ação.') : t('Submeta o plano de ação à autoridade competente e acompanhe sua execução.');
  return { pendentes, titulo: t('Plano de governança de IA na educação'), pais: nomePais(paisDoCaso(s.caso)), desafios: qs, acoes, orcamento, blocos, faltam, proxima,
    escopo: t('Os totais da rede descrevem o alcance da política. O orçamento usa apenas valores informados.'),
    projeto: projetoUsoDefinido(x) ? String(x.projetoIA.descricao) : null };
}

/** Redireciona URLs e posições salvas do fluxo antigo sem apagar suas respostas. */
export function telaGovernancaLegada(id: string): { n: 1 | 2 | 3 | 4; id: string } | null {
  const mapa: Record<string, [1 | 2 | 3 | 4, string]> = {
    etapas: [1, 'problemas'], problema: [2, 'gov-diagnostico'], impactos: [2, 'gov-diagnostico'], linhaBase: [2, 'gov-diagnostico'],
    alternativa: [2, 'gov-solucoes'], governanca: [2, 'gov-instrumentos'], testes: [3, 'gov-acoes'], tarefas: [3, 'gov-acoes'],
    usuarios: [3, 'gov-atores'], afetados: [3, 'gov-atores'], tipoTec: [3, 'gov-recursos'], pagamento: [3, 'gov-recursos'],
    piloto: [3, 'gov-acoes'], internet: [3, 'gov-recursos'], modeloDisp: [3, 'gov-recursos'], formados: [3, 'gov-capacidade'],
    suporteNivel: [3, 'gov-capacidade'], implantacao: [3, 'gov-acoes'], elegiveis: [4, 'gov-revisao'], expansao: [4, 'gov-revisao'],
  };
  return mapa[id] ? { n: mapa[id][0], id: mapa[id][1] } : null;
}
