// Estimativas de referência dos orçamentos de governança, letramento/currículo e intervenção educacional (v015).
// Função pura: lê as quantidades já respondidas e os parâmetros de data/referencias.json, converte de US$ pela taxa
// da ferramenta e devolve a conta inteira. Nada é gravado aqui; só o clique em "Usar esta estimativa" muda a situação
// do item para 'referencia'. Sem período, quantidade ou taxa conhecida, não estima e diz o que falta.
import moedas from '../../../data/moedas.json';
import { refLinha, lerNumero, LOC } from '../domain';
import { t } from './textos';
import { lerLit, publicosLetramento } from './letramento';
import { lerEd, usuariosIAEd } from './pedagogico';
import { presetGovernanca, selecoesGov } from './governancaPresets';
import { TITULOS_LIT } from './letramentoTitulos';
import { TITULOS_ED } from './pedagogicoTitulos';
import { categoriasV16, estimativaV16, mesesV16 } from './orcamentoV016';
import type { Estado14 } from '../store/tipos';

export type FrenteEstimativa = 'governanca' | 'letramento' | 'educacao';
type Base = 'formacao' | 'equipe' | 'avaliacao' | 'licenca';
type EstadoEst = Pick<Estado14, 'ctx' | 'moeda'> & Partial<Pick<Estado14, 'caso'>>;

export const PARAMETRO_FORMACAO = 'formacao.custoHora.programa';
export const PARAMETRO_EQUIPE = 'sal.especialista_pedagogico';
export const PARAMETRO_AVALIACAO = 'gov.avaliacaoExterna.ano1';
export const PARAMETRO_LICENCA = 'saas.preco';

/** Categorias com base de cálculo. As demais continuam sem estimativa: a ferramenta não inventa convenção. */
export const BASES_ESTIMATIVA: Record<FrenteEstimativa, Record<string, Base>> = {
  governanca: { equipe: 'equipe', formacao: 'formacao', avaliacao: 'avaliacao' },
  letramento: { equipe: 'equipe', oferta: 'formacao', diagnostico: 'avaliacao' },
  educacao: { equipe: 'equipe', formacao: 'formacao', avaliacao: 'avaliacao', ia: 'licenca' },
};
/** Campos opcionais desta entrega (IDs estáveis no ctx de cada percurso). */
export const QUANTIDADES_ESTIMATIVA = {
  governanca: { base: 'govOrcamento.quantidades', campos: ['equipeFte', 'servidores', 'horasServidor'] },
  letramento: { base: 'orcamento.quantidades', campos: ['equipeFte'] },
  educacao: { base: 'orcamento.quantidades', campos: ['equipeFte', 'profissionais', 'horasProfissional', 'usuarios'] },
} as const;

export interface QuantidadeConta { rotulo: string; valor: number; origem: string }
export interface ParametroConta { id: string; item: string; valor: number; unidade: string; moeda: string; fonte: string; grau: string; ano: number | null }
export interface ConversaoConta { de: string; para: string; taxa: number; fonte: string; data: string; manual: boolean }
export interface PendenciaEstimativa { texto: string; tela: string; ancora: string }
export interface Estimativa {
  /** valor na moeda do orçamento; null quando falta algo para a conta */
  valor: number | null;
  valorUSD: number | null;
  moeda: string;
  conta: { formula: string; calculo: string; quantidades: QuantidadeConta[]; parametros: ParametroConta[]; conversao: ConversaoConta | null; periodo: { meses: number; rotulo: string } | null; nota: string };
  falta?: string[];
  pendencias?: PendenciaEstimativa[];
  mensagem?: string;
  /** v016: valor por fase (Piloto, Implantação, Expansão) */
  fases?: { id: string; nome: string; usd: number; valor: number | null }[];
}

export const temBaseEstimativa = (frente: FrenteEstimativa, categoria: string) => Object.hasOwn(BASES_ESTIMATIVA[frente], categoria);
const positivo = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
const inteiroPositivo = (v: unknown): v is number => positivo(v) && Number.isSafeInteger(v);
const centavos = (v: number) => Math.round(v * 100) / 100;
const num = (v: number) => new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 2 }).format(v);
const numTaxa = (v: number) => new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 6 }).format(v);
export function formatarMoedaEst(v: number, cod: string): string {
  try { return new Intl.NumberFormat(String(LOC()), { style: 'currency', currency: cod }).format(v); }
  catch { return cod + ' ' + num(v); }
}
const listaTexto = (itens: string[]) => {
  try { return new (Intl as any).ListFormat(String(LOC()), { style: 'long', type: 'conjunction' }).format(itens) as string; }
  catch { return itens.join(', '); }
};

/** Quantidades opcionais gravadas pela pessoa (número > 0); outra coisa vale como não informada. */
export function quantidadeEstimativa(frente: FrenteEstimativa, s: Pick<Estado14, 'ctx'>, campo: string): number | null {
  const v = frente === 'governanca' ? s.ctx.govOrcamento?.quantidades?.[campo] : frente === 'letramento' ? lerLit(s, 'orcamento.quantidades.' + campo) : lerEd(s, 'orcamento.quantidades.' + campo);
  if (['servidores', 'profissionais', 'usuarios'].includes(campo)) return inteiroPositivo(v) ? v : null;
  return positivo(v) ? v : null;
}

const MESES_GOV: Record<string, number> = { 'Próximos 12 meses': 12, 'Próximos 24 meses': 24, 'Próximos 36 meses': 36 };
const MESES_ED: Record<string, number> = { inicial: 12, anual: 12, trienal: 36 };
/** Meses do período do orçamento; null quando não definido (ou "a definir"). */
export function mesesPeriodo(frente: FrenteEstimativa, s: Pick<Estado14, 'ctx'>): number | null {
  if (frente === 'governanca') {
    const ids = selecoesGov(s, 'govOrcamento.periodo'), op = presetGovernanca(s, 'govOrcamento.periodo').opcoes.find(o => ids.includes(o.id));
    return op ? MESES_GOV[op.texto] ?? null : null;
  }
  const v = frente === 'letramento' ? lerLit(s, 'orcamento.periodo') : lerEd(s, 'orcamento.periodo');
  const ids: unknown[] = Array.isArray(v?.escolhas) ? v.escolhas : [];
  if (frente === 'letramento') { const id = ids.find(x => x === '12' || x === '24'); return id ? Number(id) : null; }
  const id = ids.find(x => typeof x === 'string' && Object.hasOwn(MESES_ED, x)) as string | undefined;
  return id ? MESES_ED[id] : null;
}

function moedaDoOrcamento(frente: FrenteEstimativa, s: EstadoEst): string {
  const salvo = frente === 'governanca' ? s.ctx.govOrcamento?.moeda : frente === 'letramento' ? s.ctx.letramento?.orcamento?.moeda : lerEd(s, 'orcamento.moeda');
  return String(salvo || s.moeda?.cod || 'USD');
}
/** Taxa por US$ que a ferramenta já usa: a taxa informada no caso para esta moeda, senão a tabela de data/moedas.json. */
export function taxaMoeda(cod: string, s: Pick<Estado14, 'moeda'>): ConversaoConta | null {
  if (cod === 'USD') return null;
  const m = s.moeda, manual = m?.cod === cod && m?.taxaDe === cod ? Number(lerNumero(m.taxa)) : NaN;
  if (manual > 0) return { de: 'USD', para: cod, taxa: manual, fonte: t('Taxa informada no caso'), data: '', manual: true };
  const tx = (moedas as { taxas: Record<string, number> }).taxas[cod];
  return typeof tx === 'number' && tx > 0 ? { de: 'USD', para: cod, taxa: tx, fonte: String((moedas as any).fonte || ''), data: String((moedas as any).data || ''), manual: false } : null;
}
export function parametro(id: string): ParametroConta {
  const r = refLinha(id, ['global']);
  if (!r) throw new Error('base de referências: falta a linha "' + id + '"');
  return { id, item: String(r.item), valor: Number(r.valor), unidade: String(r.unidade), moeda: String(r.moeda || 'USD'), fonte: String(r.fonte?.titulo || ''), grau: String(r.grau || ''), ano: typeof r.anoPreco === 'number' ? r.anoPreco : null };
}

interface Parcial { quantidades: QuantidadeConta[]; faltas: PendenciaEstimativa[]; usd: (p: number) => number; formula: string; calculo: (p: ParametroConta) => string; param: string }

function formacao(frente: FrenteEstimativa, s: EstadoEst): Parcial {
  const quantidades: QuantidadeConta[] = [], faltas: PendenciaEstimativa[] = [];
  if (frente === 'letramento') {
    const pubs = publicosLetramento(s), origem = t(TITULOS_LIT['lit-participantes']);
    let somaPH = 0, faltaP = false, faltaH = false;
    for (const p of pubs) {
      const a = lerLit(s, `publicos.${p.id}.participantes`), h = lerLit(s, `publicos.${p.id}.horas`);
      const vp = a?.situacao !== 'a_levantar' && inteiroPositivo(a?.valor) ? a.valor : null, vh = h?.situacao !== 'a_levantar' && positivo(h?.valor) ? h.valor : null;
      if (vp === null) faltaP = true; else quantidades.push({ rotulo: t('Participantes previstos') + ' · ' + t(p.nome), valor: vp, origem });
      if (vh === null) faltaH = true; else quantidades.push({ rotulo: t('Horas previstas por participante') + ' · ' + t(p.nome), valor: vh, origem });
      if (vp !== null && vh !== null) somaPH += vp * vh;
    }
    if (!pubs.length || faltaP) faltas.push({ texto: t('o número de participantes previstos'), tela: 'lit-participantes', ancora: 'lit-participantes' });
    if (!pubs.length || faltaH) faltas.push({ texto: t('as horas previstas por participante'), tela: 'lit-participantes', ancora: 'lit-participantes' });
    return { quantidades, faltas, param: PARAMETRO_FORMACAO, usd: c => somaPH * c,
      formula: pubs.length > 1 ? t('Soma por público (participantes previstos × horas por participante) × custo por hora de formação') : t('Participantes previstos × horas por participante × custo por hora de formação'),
      calculo: p => `${num(somaPH)} ${t('horas-participante')} × ${formatarMoedaEst(p.valor, p.moeda)}` };
  }
  const gov = frente === 'governanca', [cP, cH] = gov ? ['servidores', 'horasServidor'] : ['profissionais', 'horasProfissional'];
  const tela = gov ? 'gov-equipe' : 'ed-intervencao', origem = gov ? t('Equipe e formação') : t(TITULOS_ED['ed-intervencao']);
  const anc = (c: string) => (gov ? 'gov-govOrcamento-quantidades-' : 'ed-orcamento-quantidades-') + c;
  const p = quantidadeEstimativa(frente, s, cP), h = quantidadeEstimativa(frente, s, cH);
  if (p === null) faltas.push({ texto: gov ? t('os servidores a formar') : t('os profissionais a formar'), tela, ancora: anc(cP) });
  else quantidades.push({ rotulo: gov ? t('Servidores a formar') : t('Profissionais a formar'), valor: p, origem });
  if (h === null) faltas.push({ texto: gov ? t('as horas por servidor') : t('as horas por profissional'), tela, ancora: anc(cH) });
  else quantidades.push({ rotulo: gov ? t('Horas por servidor') : t('Horas por profissional'), valor: h, origem });
  return { quantidades, faltas, param: PARAMETRO_FORMACAO, usd: c => (p || 0) * (h || 0) * c,
    formula: gov ? t('Servidores a formar × horas por servidor × custo por hora de formação') : t('Profissionais a formar × horas por profissional × custo por hora de formação'),
    calculo: x => `${num(p || 0)} × ${num(h || 0)} h × ${formatarMoedaEst(x.valor, x.moeda)}` };
}
const telaRecursos = (f: FrenteEstimativa) => f === 'governanca' ? 'gov-equipe' : f === 'letramento' ? 'lit-recursos' : 'ed-recursos';
const ancoraPeriodo = (f: FrenteEstimativa) => f === 'governanca' ? 'gov-govOrcamento-periodo' : f === 'letramento' ? 'lit-orcamento-periodo' : 'ed-orcamento-periodo';

/**
 * Estimativa de referência de uma categoria do orçamento; null quando a categoria não tem base de cálculo.
 * Com base mas sem uma quantidade, período ou taxa, devolve valor null e o que falta.
 */
export function estimativaReferencia(frente: FrenteEstimativa, categoria: string, s: EstadoEst): Estimativa | null {
  const v16 = categoriasV16(s, frente).find(c => c.id === categoria);
  if (v16) return estimativaV16(s, frente, v16, moedaDoOrcamento(frente, s));
  if (!temBaseEstimativa(frente, categoria)) return null;
  const base = BASES_ESTIMATIVA[frente][categoria], moeda = moedaDoOrcamento(frente, s), meses = mesesPeriodo(frente, s);
  const tela = telaRecursos(frente), origemOrc = frente === 'governanca' ? t('Equipe e formação') : t(frente === 'letramento' ? TITULOS_LIT['lit-recursos'] : TITULOS_ED['ed-recursos']);
  const faltaPeriodo: PendenciaEstimativa = { texto: t('o período do orçamento'), tela, ancora: ancoraPeriodo(frente) };
  const periodo = meses === null ? null : { meses, rotulo: t('{n} meses', { n: meses }) };
  let parcial: Parcial;
  if (base === 'formacao') parcial = formacao(frente, s);
  else if (base === 'equipe') {
    const fte = quantidadeEstimativa(frente, s, 'equipeFte'), faltas: PendenciaEstimativa[] = [], quantidades: QuantidadeConta[] = [];
    if (fte === null) faltas.push({ texto: t('as pessoas na equipe (equivalente em tempo integral)'), tela, ancora: (frente === 'governanca' ? 'gov-govOrcamento' : frente === 'letramento' ? 'lit-orcamento' : 'ed-orcamento') + '-quantidades-equipeFte' });
    else quantidades.push({ rotulo: t('Pessoas na equipe (equivalente em tempo integral)'), valor: fte, origem: origemOrc });
    if (meses === null) faltas.push(faltaPeriodo); else quantidades.push({ rotulo: t('Meses do período do orçamento'), valor: meses, origem: t('Período do orçamento') });
    parcial = { quantidades, faltas, param: PARAMETRO_EQUIPE, usd: c => (fte || 0) * ((meses || 0) / 12) * c,
      formula: t('Pessoas em tempo integral × (meses do período ÷ 12) × custo anual de referência por pessoa'),
      calculo: p => `${num(fte || 0)} × (${num(meses || 0)} ÷ 12) × ${formatarMoedaEst(p.valor, p.moeda)}` };
  } else if (base === 'licenca') {
    const u = frente === 'educacao' ? usuariosIAEd(s as any) : null, faltas: PendenciaEstimativa[] = [], quantidades: QuantidadeConta[] = [];
    if (u === null) faltas.push({ texto: t('o número de usuários da ferramenta'), tela: 'ed-tecnologia', ancora: 'ed-orcamento-quantidades-usuarios' });
    else quantidades.push({ rotulo: t('Usuários da ferramenta'), valor: u, origem: t(TITULOS_ED['ed-tecnologia']) + (lerEd(s, 'orcamento.quantidades.usuarios') ? '' : ' · ' + t('total do Contexto')) });
    if (meses === null) faltas.push(faltaPeriodo); else quantidades.push({ rotulo: t('Meses do período do orçamento'), valor: meses, origem: t('Período do orçamento') });
    parcial = { quantidades, faltas, param: PARAMETRO_LICENCA, usd: c => (u || 0) * (meses || 0) * c,
      formula: t('Usuários × preço de referência por licença por mês × meses do período'),
      calculo: p => `${num(u || 0)} × ${formatarMoedaEst(p.valor, p.moeda)} × ${num(meses || 0)}` };
  } else {
    const n = meses === null ? 0 : Math.ceil(meses / 12), quantidades: QuantidadeConta[] = [];
    if (meses !== null) quantidades.push({ rotulo: t('Avaliações externas no período (uma a cada 12 meses ou fração)'), valor: n, origem: t('Período do orçamento') });
    parcial = { quantidades, faltas: meses === null ? [faltaPeriodo] : [], param: PARAMETRO_AVALIACAO, usd: c => n * c,
      formula: t('Avaliações externas (uma por período de até 12 meses) × valor de referência por avaliação'),
      calculo: p => `${num(n)} × ${formatarMoedaEst(p.valor, p.moeda)}` };
  }
  const param = parametro(parcial.param), conversao = taxaMoeda(moeda, s), semTaxa = moeda !== 'USD' && !conversao;
  const nota = t('Convenção da ferramenta (v13), ilustrativa, grau C: valores em US$, iguais para todos os países.');
  const conta = { formula: parcial.formula, calculo: '', quantidades: parcial.quantidades, parametros: [param], conversao, periodo, nota };
  if (parcial.faltas.length) return { valor: null, valorUSD: null, moeda, conta, falta: parcial.faltas.map(f => f.texto), pendencias: parcial.faltas,
    mensagem: t('Informe {lista} para ver uma estimativa.', { lista: listaTexto(parcial.faltas.map(f => f.texto)) }) };
  const usd = centavos(parcial.usd(param.valor));
  conta.calculo = parcial.calculo(param) + ' = ' + formatarMoedaEst(usd, 'USD');
  if (semTaxa) return { valor: null, valorUSD: usd, moeda, conta, falta: [], pendencias: [],
    mensagem: t('Sem taxa de câmbio conhecida para {moeda}; a estimativa em US$ não é convertida para a moeda do orçamento.', { moeda }) };
  const valor = conversao ? centavos(usd * conversao.taxa) : usd;
  if (conversao) conta.calculo += ' × ' + numTaxa(conversao.taxa) + ' = ' + formatarMoedaEst(valor, moeda);
  return { valor, valorUSD: usd, moeda, conta };
}

/** Situação do item com a quarta opção: 'referencia' só vale onde há base; em outro item é tratada como desconhecida. */
export function itemEmReferencia(frente: FrenteEstimativa, categoria: string, salvo: any): boolean {
  return salvo?.situacao === 'referencia' && temBaseEstimativa(frente, categoria);
}
/** Valor estimado em uso (null quando o item não está em 'referencia' ou a conta não fecha). */
export function valorEstimado(est: Estimativa | null, emReferencia: boolean): number | null {
  return emReferencia && est && typeof est.valor === 'number' ? est.valor : null;
}

export interface TotaisOrcamento { informado: number; informados: number; estimado: number; estimados: number; faltam: number; total: number | null; totalComEstimativas: number | null }
/** Informado, estimado e faltam são separados; o total só existe sem faltas e sinaliza se inclui estimativas. */
export function totaisOrcamento(itens: { valor: number | null; estimado?: number | null; conta?: boolean; falta?: boolean }[], completo = true): TotaisOrcamento {
  const proprios = itens.filter(i => i.conta !== false);
  const inf = proprios.filter(i => i.valor !== null), est = proprios.filter(i => i.valor === null && typeof i.estimado === 'number');
  const faltam = itens.filter(i => i.falta ?? (i.valor === null && typeof i.estimado !== 'number')).length;
  const informado = centavos(inf.reduce((n, i) => n + (i.valor as number), 0)), estimado = centavos(est.reduce((n, i) => n + (i.estimado as number), 0));
  return { informado, informados: inf.length, estimado, estimados: est.length, faltam,
    total: completo && !faltam && !est.length ? informado : null, totalComEstimativas: completo && !faltam ? centavos(informado + estimado) : null };
}

export const ROTULO_ESTIMATIVA = 'estimativa de referência, ilustrativa';
/** Valor estimado sempre acompanhado do rótulo honesto. */
export const textoEstimado = (v: number, moeda: string) => formatarMoedaEst(v, moeda) + ' (' + t('estimativa de referência, ilustrativa') + ')';

/** Linhas de totais para a tela, o painel, a página do plano, o panorama, os PDFs e a leitura simples. */
export function linhasTotais(o: { informado?: number; subtotal: number; informados: number; estimado?: number; estimados?: number; faltam: number; total: number | null; totalComEstimativas?: number | null; moeda: string }): { rotulo: string; valor: string; destaque?: boolean }[] {
  const est = o.estimados || 0, informado = o.informado ?? o.subtotal;
  const linhas: { rotulo: string; valor: string; destaque?: boolean }[] = [];
  const completo = est ? o.totalComEstimativas ?? null : o.total;
  if (completo !== null && completo !== undefined) linhas.push({ rotulo: est ? t('Total (inclui estimativas de referência)') : t('Total'), valor: formatarMoedaEst(completo, o.moeda), destaque: true });
  linhas.push({ rotulo: t('Informado'), valor: o.informados ? formatarMoedaEst(informado, o.moeda) : t('Não informado') });
  linhas.push({ rotulo: t('Estimado pela ferramenta'), valor: est ? textoEstimado(o.estimado || 0, o.moeda) : t('Nenhum item') });
  linhas.push({ rotulo: t('Ainda a levantar'), valor: o.faltam === 1 ? t('1 item') : t('{n} itens', { n: o.faltam }) });
  return linhas;
}
/** Uma frase só, para painéis e cartões. */
export function resumoTotais(o: Parameters<typeof linhasTotais>[0]): string {
  return linhasTotais(o).map(l => l.rotulo + ': ' + l.valor).join(' · ');
}
/** Nota do plano e dos PDFs quando há estimativas em uso: convenção, grau e conversão de moeda. */
export function notaEstimativas(o: { itens: { estimado?: number | null; estimativa?: Estimativa | null }[]; estimados?: number }): { rotulo: string; valor: string }[] {
  if (!o.estimados) return [];
  const usados = o.itens.filter(i => typeof i.estimado === 'number' && i.estimativa), conv = usados.find(i => i.estimativa?.conta.conversao)?.estimativa?.conta.conversao;
  const contas = usados.map(i => i.estimativa!.conta.formula + (i.estimativa!.conta.calculo ? ': ' + i.estimativa!.conta.calculo : '')).join('\n');
  return [{ rotulo: t('Estimativas de referência'), valor: [t('Valor de referência genérico da ferramenta (grau C: convenção sem pesquisa de preços no país), em US$ e igual para todos os países. Substitua pelo valor da sua rede no campo abaixo da conta.'),
    conv ? t('Conversão: 1 US$ = {taxa} {moeda} ({fonte}{data}).', { taxa: numTaxa(conv.taxa), moeda: conv.para, fonte: conv.fonte, data: conv.data ? ', ' + conv.data : '' }) : '', contas].filter(Boolean).join('\n') }];
}
