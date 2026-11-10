import { contextoGovProjetado, definicoesPendentes } from './governancaPresets';
// Projeção institucional: a página, o painel e os dois PDFs leem este mesmo modelo.
// Os totais da rede são contexto; nenhuma conta deriva licenças ou participantes deles.
import { problemasMarcados } from '../domain/prioridades.js';
import { LOC } from '../domain/i18n.js';
import { nomePais, paisDoCaso } from '../domain/pais.js';
import { tamanhoRedeValido, projetoUsoDefinido } from '../domain/escopo.js';
import type { Estado14 } from '../store/tipos';
import { categoriaDaTelaGov, TELA_ADICIONAIS_GOV } from '../store/perguntas';
import { t } from './textos';
import { orcamentoV16, fasesSalvas, linhasFases, proximoV16, instituicaoV16 } from './orcamentoV016';
import { estimativaReferencia, itemEmReferencia, valorEstimado, totaisOrcamento, linhasTotais, notaEstimativas, textoEstimado } from './estimativasOrcamento';
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
 G21: 'Definir regulação, salvaguardas de direitos, sandboxes e padrões de IA na educação',
 G22: 'Garantir a governança dos dados, a infraestrutura e a independência tecnológica',
 G23: 'Formar equipes especializadas e estruturas de coordenação institucional',
};
export const preenchido = (v: unknown) => typeof v === 'string' && v.trim().length > 0 && !v.includes('__');
export function desafiosGovernanca(s: Pick<Estado14, 'ctx'>): { id: string; titulo: string }[] {
  const qs = problemasMarcados(s.ctx).filter((q: any) => /^G\d+$/.test(q.id)).map((q: any) => ({ id: q.id as string, titulo: t(q.t) }));
  if (preenchido(s.ctx.problemaOutro)) qs.push({ id: 'outro', titulo: String(s.ctx.problemaOutro).trim() });
  return qs;
}
export function temSandbox(s: Pick<Estado14, 'ctx'>): boolean { return desafiosGovernanca(s).some(q => q.id === 'G15'); }
/** Versão de teste: as ações são só as sugeridas automaticamente para cada desafio (sem pergunta); o que estava
 *  guardado em govAcoes continua no caso, fora do fluxo. */
export function acoesGovernanca(s: Pick<Estado14, 'ctx'>) {
  return desafiosGovernanca(s).map(q => ({ ...q, entrega: ENTREGAS[q.id] ? t(ENTREGAS[q.id]) : t('Definir ação institucional para: {desafio}', { desafio: q.titulo }),
    sugerida: true, responsavel: '', prazo: '', marco: '', indicador: '' }));
}
function valorCusto(v: unknown): number | null { return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null; }
// v018: o progresso pergunta por cada página de categoria; a conta do orçamento é a mesma para o mesmo estado, então
// a última fica guardada (mesmo contexto, caso, moeda e idioma).
let ultimoOrc: { ctx: unknown; caso: unknown; moeda: unknown; lang: unknown; o: ReturnType<typeof orcamentoV16> } | null = null;
export function orcamentoGovernanca(s: Pick<Estado14, 'ctx' | 'moeda'>) {
  // v016: 3 desafios × 9 categorias, com fases (orcamentoV016)
  const caso = (s as Partial<Estado14>).caso, lang = (s as Partial<Estado14>).lang;
  if (ultimoOrc && ultimoOrc.ctx === s.ctx && ultimoOrc.caso === caso && ultimoOrc.moeda === s.moeda && ultimoOrc.lang === lang) return ultimoOrc.o;
  const o = orcamentoV16(s, 'governanca');
  ultimoOrc = { ctx: s.ctx, caso, moeda: s.moeda, lang, o };
  return o;
}
export function moedaGovernanca(v: number | null, cod: string, locale?: string): string {
  if (v === null) return t('Não informado');
  try { return new Intl.NumberFormat(locale || undefined, { style: 'currency', currency: cod }).format(v); }
  catch { return cod + ' ' + new Intl.NumberFormat(locale || undefined, { maximumFractionDigits: 2 }).format(v); }
}
/** Valor de um item no plano: informado, estimativa em uso (com o rótulo honesto) ou o que ainda falta. */
export function valorItemOrcamento(i: { valor: number | null; referencia?: boolean; estimado?: number | null; estimativa?: { mensagem?: string } | null }, moeda: string): string {
  if (i.valor !== null) return moedaGovernanca(i.valor, moeda, String(LOC()));
  if (i.referencia) return typeof i.estimado === 'number' ? textoEstimado(i.estimado, moeda) : t('Estimativa de referência indisponível') + (i.estimativa?.mensagem ? ': ' + i.estimativa.mensagem : '');
  return t('Não informado');
}
const QUANT_GOV = ['equipeFte', 'servidores', 'horasServidor'];
const numeroPositivo = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v > 0;
export function governancaRespondida(s: Estado14, id: string): boolean {
  const x = contextoGovProjetado(s);
  switch (id) {
    // Equipe e formação: tudo opcional; a tela conta como feita quando o período e as quantidades estão informados.
    case 'gov-fases': return fasesSalvas(s, 'governanca');
    case 'gov-equipe': return QUANT_GOV.every(k => numeroPositivo(s.ctx.govOrcamento?.quantidades?.[k]));
    case 'gov-recursos': { const o = orcamentoGovernanca(s); return o.itens.length > 0 && o.itens.every(i => i.respondido); }
    case 'gov-categorias': return orcamentoGovernanca(s).itens.length > 0;
    case 'gov-opcoes': { const o = orcamentoGovernanca(s); return o.itens.length > 0 && o.itens.every(i => i.marcadas.length > 0 && i.respondido); }
    // v018: custos adicionais e duração do plano têm padrão (percentuais de referência e 12 meses)
    case TELA_ADICIONAIS_GOV: return true;
    default: {
      // v018: página de uma categoria: pelo menos uma opção marcada e nada faltando
      const cat = categoriaDaTelaGov(id), i = cat ? orcamentoGovernanca(s).itens.find(x => x.id === cat) : undefined;
      return !!i && i.marcadas.length > 0 && i.respondido;
    }
  }
}
/** Telas opcionais: Próximo não é bloqueado nelas. */
export const TELAS_OPCIONAIS = ['gov-equipe', 'lit-escolas', 'lit-participantes', 'gov-fases', 'lit-fases', 'ed-fases'];
export interface BlocoGovernanca { titulo: string; linhas: { rotulo: string; valor: string }[] }
export function planoGovernanca(s: Estado14) {
  const x = contextoGovProjetado(s), qs = desafiosGovernanca(s), acoes = acoesGovernanca(s), orcamento = orcamentoGovernanca(s);
  const nao = t('Não informado'), valor = (v: any) => preenchido(v) ? String(v) : nao;
  const linha = (rotulo: string, v: any) => ({ rotulo: t(rotulo), valor: valor(v) });
  const num = (v: unknown) => numeroPositivo(v) ? new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 2 }).format(v as number) : '';
  const q = s.ctx.govOrcamento?.quantidades || {};
  const blocos: BlocoGovernanca[] = [
    { titulo: t('Contexto'), linhas: [linha('País', nomePais(paisDoCaso(s.caso))), linha('Instituição responsável', instituicaoV16(s)),
      ...qs.map(q => linha('Desafio', q.titulo))] },
    { titulo: t('Ações sugeridas'), linhas: acoes.map(a => ({ rotulo: a.titulo, valor: a.entrega })) },
    { titulo: t('Equipe e formação'), linhas: [linha('Fases', orcamento.periodo), linha('Pessoas na equipe (equivalente em tempo integral)', num(q.equipeFte)),
      linha('Servidores a formar', num(q.servidores)), linha('Horas por servidor', num(q.horasServidor))] },
    { titulo: t('Recursos e orçamento'), linhas: [linha('Moeda', orcamento.moeda),
      ...orcamento.itens.map(i => linha(i.nome, valorItemOrcamento(i, orcamento.moeda))),
      ...linhasTotais(orcamento).map(l => ({ rotulo: l.rotulo, valor: l.valor })), ...linhasFases(orcamento), ...notaEstimativas(orcamento)] },
  ];
  const faltam = ['gov-equipe', 'gov-opcoes'].filter(id => !governancaRespondida(s, id));
  if (!s.caso.pais) faltam.unshift('local'); // v018: o país vem da tela do lugar
  if (!qs.length || !(preenchido(x.problemaOutro) || s.respC.problemas)) faltam.unshift('problemas');
  const pendentes = orcamento.faltam;
  const proxima = !qs.length ? t('Selecione os desafios do plano.') : proximoV16(orcamento);
  return { pendentes, titulo: t('Plano de governança de IA na educação'), pais: nomePais(paisDoCaso(s.caso)), desafios: qs, acoes, orcamento, blocos, faltam, proxima,
    escopo: orcamento.estimados ? t('O orçamento separa os valores informados das estimativas de referência escolhidas, que são ilustrativas, e mostra o custo por fase.') : t('O orçamento usa apenas valores informados e mostra o custo por fase.'),
    projeto: null as string | null };
}

/** Redireciona URLs e posições salvas do fluxo antigo sem apagar suas respostas. */
export function telaGovernancaLegada(id: string): { n: 1 | 2 | 3 | 4; id: string } | null {
  const mapa: Record<string, [1 | 2 | 3 | 4, string]> = {
    etapas: [1, 'problemas'], problema: [2, 'gov-equipe'], impactos: [2, 'gov-equipe'], linhaBase: [2, 'gov-equipe'], alternativa: [2, 'gov-equipe'],
    governanca: [2, 'gov-equipe'], testes: [3, 'gov-opcoes'], tarefas: [3, 'gov-opcoes'], usuarios: [2, 'gov-equipe'], afetados: [2, 'gov-equipe'],
    tipoTec: [3, 'gov-opcoes'], pagamento: [3, 'gov-opcoes'], piloto: [3, 'gov-opcoes'], internet: [3, 'gov-opcoes'], modeloDisp: [3, 'gov-opcoes'],
    formados: [2, 'gov-equipe'], suporteNivel: [2, 'gov-equipe'], implantacao: [3, 'gov-opcoes'], elegiveis: [3, 'gov-opcoes'], expansao: [3, 'gov-opcoes'],
    'gov-projeto': [2, 'gov-equipe'], 'gov-diagnostico': [2, 'gov-equipe'], 'gov-instrumentos': [2, 'gov-equipe'], 'gov-solucoes': [2, 'gov-equipe'],
    'gov-atores': [2, 'gov-equipe'], 'gov-capacidade': [2, 'gov-equipe'], 'gov-acoes': [3, 'gov-opcoes'], 'gov-sandbox': [3, 'gov-opcoes'], 'gov-revisao': [3, 'gov-opcoes'],
  };
  return mapa[id] ? { n: mapa[id][0], id: mapa[id][1] } : null;
}

export function pendenciasGov(s:Estado14,id:string) {
 const x=contextoGovProjetado(s), out:{caminho:string;label:string}[]=[];
 const cat=categoriaDaTelaGov(id);
 if(id==='gov-recursos'||id==='gov-opcoes'||cat)for(const i of orcamentoGovernanca(s).itens){if(i.id==='adicionais'||(cat&&i.id!==cat))continue;const extra=i.id.startsWith('extra-'),p=extra?'govOrcamento.extras.'+i.id.slice(6):'govOrcamento.itens.'+i.id,item=p.split('.').reduce((o:any,k)=>o?.[k],x);if(i.valor===null&&item?.situacao!=='a_estimar'&&!i.referencia)out.push({caminho:p,label:i.nome});if(extra&&!preenchido(item?.nome))out.push({caminho:p+'.nome',label:'Recurso adicional'});}
 return out;
}
