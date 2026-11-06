// Versão de teste v016: orçamento por categoria de custo, com cost options marcáveis e custo por fase
// (Piloto, Implantação, Expansão). Mesma forma de retorno dos orçamentos da v015 (itens, informado, estimado, faltam,
// total…), para que o cartão de custo, o resumo, o panorama e os PDFs continuem lendo o mesmo modelo.
import { CATEGORIAS, DIMENSOES_EDU, FASES_V016 } from '../domain/catalogo_v016.js';
import { LOC } from '../domain';
import type { Estado14 } from '../store/tipos';
import { t } from './textos';
import { lerLit } from './letramento';
import { chaveEd, lerEd, usaIAEd, usuariosIAEd } from './pedagogico';
import { PROBLEMA_POR_ID } from '../domain/prioridades.js';
import { formatarMoedaEst, parametro, taxaMoeda, totaisOrcamento, PARAMETRO_EQUIPE, PARAMETRO_FORMACAO, PARAMETRO_LICENCA, PARAMETRO_CONECTIVIDADE, PARAMETRO_DISPOSITIVO,
  type Estimativa, type ParametroConta, type PendenciaEstimativa, type QuantidadeConta, type FrenteEstimativa } from './estimativasOrcamento';

type Estado = Pick<Estado14, 'ctx' | 'moeda'> & Partial<Pick<Estado14, 'caso'>>;
export type Base = 'formacao' | 'equipe' | 'licenca' | 'infra';
export interface CategoriaV16 { id: string; n: string; nome: string; grupo: string; opcoes: string[]; base?: Base }
export interface FaseV16 { id: string; nome: string; on: boolean; meses: number; alcance: number }

const positivo = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
const num = (v: number) => new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 2 }).format(v);
const centavos = (v: number) => Math.round(v * 100) / 100;
const valNum = (v: any): number | null => { const x = v && typeof v === 'object' ? (v.situacao === 'a_levantar' ? null : v.valor) : v; return positivo(x) ? x : null; };

/** Objeto do orçamento salvo de cada frente (fica onde já ficava na v015). */
export function raizOrcamento(s: Pick<Estado14, 'ctx'>, f: FrenteEstimativa): any {
  return f === 'governanca' ? s.ctx.govOrcamento || {} : f === 'letramento' ? lerLit(s, 'orcamento') || {} : lerEd(s, 'orcamento') || {};
}
/** Campo de topo e valor para gravar um caminho dentro do orçamento da frente (s.responder(campo, valor)). */
export function caminhoOrcamento(s: Pick<Estado14, 'ctx'>, f: FrenteEstimativa, caminho: string): { campo: string; sub: string } {
  if (f === 'governanca') return { campo: 'govOrcamento', sub: caminho };
  if (f === 'letramento') return { campo: 'letramento', sub: 'orcamento.' + caminho };
  return { campo: 'educacao', sub: 'percursos.' + chaveEd(s) + '.orcamento.' + caminho };
}

export function fasesV16(s: Pick<Estado14, 'ctx'>, f: FrenteEstimativa): FaseV16[] {
  const salvo = raizOrcamento(s, f).fases || {};
  return FASES_V016.map(p => {
    const x = salvo[p.id] || {};
    return { id: p.id, nome: t(p.nome), on: x.on !== false, meses: positivo(x.meses) ? x.meses : p.meses, alcance: positivo(x.alcance) ? Math.min(100, x.alcance) : p.alcance };
  });
}
/** As fases contam como respondidas só depois de gravadas (ao entrar na frente, o pré-preenchimento grava os padrões). */
export const fasesSalvas = (s: Pick<Estado14, 'ctx'>, f: FrenteEstimativa) => !!raizOrcamento(s, f).fases && fasesAtivas(s, f).length > 0;
export const fasesAtivas = (s: Pick<Estado14, 'ctx'>, f: FrenteEstimativa) => fasesV16(s, f).filter(x => x.on);
export function mesesV16(s: Pick<Estado14, 'ctx'>, f: FrenteEstimativa): number | null {
  const m = fasesAtivas(s, f).reduce((n, x) => n + x.meses, 0);
  return m > 0 ? m : null;
}
/** "Piloto 4 m · Implantação 12 m · Expansão 12 m" */
export function resumoFases(s: Pick<Estado14, 'ctx'>, f: FrenteEstimativa): string {
  const a = fasesAtivas(s, f);
  return a.length ? a.map(x => x.nome + ' ' + t('{n} meses', { n: x.meses })).join(' · ') : t('Nenhuma fase escolhida');
}

const nomeDesafio = (id: string) => t((PROBLEMA_POR_ID as any)[id]?.t || id);
/** Categorias da frente: só as dos desafios marcados (na educação, as três dimensões de custo). */
export function categoriasV16(s: Estado, f: FrenteEstimativa): CategoriaV16[] {
  const marcados: string[] = s.ctx.problemas || [];
  if (f === 'educacao') {
    const ds = marcados.filter(id => Object.hasOwn(DIMENSOES_EDU, id)), ia = usaIAEd(s as any);
    return (CATEGORIAS.educacao as any[]).map(c => {
      let opcoes: string[] = c.opcoes;
      if (c.id === 'e3') opcoes = ds.map(id => (DIMENSOES_EDU as any)[id][0]);
      if (c.id === 'e4') opcoes = [...ds.map(id => (DIMENSOES_EDU as any)[id][1]), 'Plataformas', ...(ia ? ['Ferramentas de IA'] : [])];
      return { id: c.id, n: '', nome: c.nome, grupo: '', opcoes, base: c.id === 'e4' && !ia ? undefined : c.base };
    });
  }
  return (CATEGORIAS[f] as any[]).filter(c => marcados.includes(c.desafio)).map(c => ({ id: c.id, n: c.n, nome: c.nome, grupo: nomeDesafio(c.desafio), opcoes: c.opcoes, base: c.base }));
}

/** Componentes da conta: cada um multiplica uma quantidade por fase (pessoas novas × horas, pessoas-ano, usuários × meses,
 *  escolas conectadas × anos, dispositivos novos) por um valor unitário (premissa). */
interface Componente { pid: string; fatorFase: (x: FaseV16, anterior: number) => { fator: number; rotulo?: string; valor?: number } }
interface Quantidades { comps: Componente[]; quantidades: QuantidadeConta[]; faltas: PendenciaEstimativa[]; formula: string; notas: string[] }

const telaFasesDe = (f: FrenteEstimativa) => f === 'governanca' ? 'gov-fases' : f === 'letramento' ? 'lit-fases' : 'ed-fases';
/** Pessoas novas na fase, pela diferença dos acumulados arredondados (a soma das fases é o total). */
const novos = (n: number, x: FaseV16, anterior: number) => Math.max(0, Math.round(n * x.alcance / 100) - Math.round(n * anterior / 100));

/** Professores do letramento (+ lideranças, se incluídas); null se falta número. */
function professoresLit(s: Estado): { n: number | null; rotulo: string } {
  const prof = valNum(lerLit(s, 'publicos.A11.participantes'));
  const inclui = (lerLit(s, 'publicos.A11.incluiLiderancas')?.escolhas || []).includes('sim');
  const lid = inclui ? valNum(lerLit(s, 'publicos.A11.liderancas')) : 0;
  return { n: prof === null || (inclui && lid === null) ? null : prof + (lid || 0), rotulo: t('Professores') + (inclui ? ' + ' + t('lideranças escolares') : '') };
}

/** Quantidades e componentes de cada base, por frente e categoria. */
function quantidadesBase(s: Estado, f: FrenteEstimativa, cat: CategoriaV16): Quantidades {
  const quantidades: QuantidadeConta[] = [], faltas: PendenciaEstimativa[] = [], notas: string[] = [], comps: Componente[] = [];
  const q = (rotulo: string, valor: number) => quantidades.push({ rotulo, valor, origem: '' });
  const falta = (texto: string, tela: string, ancora: string) => faltas.push({ texto, tela, ancora });
  const licenca = (usuarios: number | null, rotulo: string, tela: string, ancora: string) => {
    if (usuarios == null) falta(rotulo, tela, ancora); else q(rotulo, usuarios);
    if (usuarios != null) comps.push({ pid: PARAMETRO_LICENCA, fatorFase: x => { const u = Math.round(usuarios * x.alcance / 100); return { fator: u * x.meses, rotulo: x.nome + ' (' + x.alcance + '%): ' + t('usuários alcançados'), valor: u }; } });
    return t('Por fase: usuários alcançados na fase × preço de referência por licença por mês × meses da fase');
  };
  const formacao = (pessoas: number | null, horas: number | null, rotulos: [string, string], tela: string, ancoras: [string, string]) => {
    if (pessoas == null) falta(rotulos[0], tela, ancoras[0]); else q(rotulos[0], pessoas);
    if (horas == null) falta(rotulos[1], tela, ancoras[1]); else q(rotulos[1], horas);
    if (pessoas != null && horas != null) comps.push({ pid: PARAMETRO_FORMACAO, fatorFase: (x, ant) => { const n = novos(pessoas, x, ant); return { fator: n * horas, rotulo: x.nome + ' (' + x.alcance + '%): ' + t('pessoas novas'), valor: n }; } });
    return t('Por fase: pessoas novas na fase (alcance da fase − alcance anterior) × horas × custo por hora de formação');
  };
  let formula = '';
  if (cat.base === 'equipe') {
    const fte = valNum(s.ctx.govOrcamento?.quantidades?.equipeFte), r = t('Pessoas na equipe (tempo integral)');
    if (fte == null) falta(r, 'gov-equipe', 'gov-govOrcamento-quantidades-equipeFte');
    else { q(r, fte); comps.push({ pid: PARAMETRO_EQUIPE, fatorFase: x => ({ fator: fte * x.meses / 12 }) }); }
    formula = t('Por fase: pessoas em tempo integral × (meses da fase ÷ 12) × custo anual por pessoa');
  } else if (cat.base === 'licenca') {
    if (f === 'letramento' && cat.id === 'l13') { const p = professoresLit(s); formula = licenca(p.n, t('Professores com acesso à plataforma'), 'lit-participantes', 'lit-participantes'); }
    else if (f === 'letramento') formula = licenca(valNum(lerLit(s, 'publicos.A12.participantes')), t('Estudantes com acesso às ferramentas'), 'lit-participantes', 'lit-participantes');
    else formula = licenca(usuariosIAEd(s as any), t('Usuários da ferramenta'), 'ed-intervencao', 'ed-orcamento-quantidades-usuarios');
  } else if (cat.base === 'infra') {
    const conn = valNum(lerEd(s, 'orcamento.quantidades.escolasSemConexao')), disp = valNum(lerEd(s, 'orcamento.quantidades.dispositivos')), luz = valNum(lerEd(s, 'orcamento.quantidades.escolasSemEletricidade'));
    if (conn == null && disp == null) falta(t('escolas sem conexão adequada ou dispositivos necessários'), 'ed-intervencao', 'ed-orcamento-quantidades-escolasSemConexao');
    if (conn != null) { q(t('Escolas sem conexão adequada'), conn); comps.push({ pid: PARAMETRO_CONECTIVIDADE, fatorFase: x => { const e = Math.round(conn * x.alcance / 100); return { fator: e * x.meses / 12, rotulo: x.nome + ' (' + x.alcance + '%): ' + t('escolas conectadas'), valor: e }; } }); }
    if (disp != null) { q(t('Dispositivos necessários'), disp); comps.push({ pid: PARAMETRO_DISPOSITIVO, fatorFase: (x, ant) => { const n = novos(disp, x, ant); return { fator: n, rotulo: x.nome + ' (' + x.alcance + '%): ' + t('dispositivos novos'), valor: n }; } }); }
    if (luz != null) { q(t('Escolas sem eletricidade'), luz); notas.push(t('Eletricidade: {n} escolas sem energia; o custo não tem referência e fica a levantar.', { n: num(luz) })); }
    formula = t('Por fase: escolas conectadas × (meses da fase ÷ 12) × custo anual da conexão por escola + dispositivos novos × preço por dispositivo');
  } else if (f === 'governanca') {
    formula = formacao(valNum(s.ctx.govOrcamento?.quantidades?.servidores), valNum(s.ctx.govOrcamento?.quantidades?.horasServidor), [t('Servidores a formar'), t('Horas por servidor')], 'gov-equipe', ['gov-govOrcamento-quantidades-servidores', 'gov-govOrcamento-quantidades-horasServidor']);
  } else if (f === 'educacao') {
    formula = formacao(valNum(lerEd(s, 'orcamento.quantidades.profissionais')), valNum(lerEd(s, 'orcamento.quantidades.horasProfissional')), [t('Profissionais a formar'), t('Horas por profissional')], 'ed-intervencao', ['ed-orcamento-quantidades-profissionais', 'ed-orcamento-quantidades-horasProfissional']);
  } else {
    // letramento (1.1): professores (+ lideranças escolares, se incluídas) × horas por curso × cursos por pessoa
    const p = professoresLit(s), h = valNum(lerLit(s, 'publicos.A11.horas')), c = valNum(lerLit(s, 'publicos.A11.cursos')) || 1;
    formula = formacao(p.n, h === null ? null : h * c, [p.rotulo, t('Horas por curso') + ' × ' + t('cursos por pessoa')], 'lit-participantes', ['lit-participantes', 'lit-participantes']);
  }
  if (!fasesAtivas(s, f).length) falta(t('as fases do plano'), telaFasesDe(f), 'fases');
  return { comps, quantidades, faltas, formula, notas };
}

/** Taxa por US$ usada nas contas, com 4 casas: a mesma que aparece na tela, para a conta fechar à mão. */
export function taxaV16(moeda: string, s: Pick<Estado14, 'moeda'>): number | null {
  if (moeda === 'USD') return 1;
  const c = taxaMoeda(moeda, s);
  return c ? Math.round(c.taxa * 10000) / 10000 : null;
}

export interface PremissaV16 { pid: string; item: string; unidade: string; rotulo: string; referenciaUSD: number; equipe: boolean;
  /** valor unitário usado, na moeda em que foi informado (US$ na referência) */ valor: number; moedaValor: string; valorUSD: number | null; valorLocal: number | null }
const ITENS_PREMISSA: Record<string, [string, string]> = {
  [PARAMETRO_FORMACAO]: ['Custo por hora de formação', 'por hora-participante'],
  [PARAMETRO_EQUIPE]: ['Custo anual por pessoa em tempo integral', 'por pessoa por ano'],
  [PARAMETRO_LICENCA]: ['Preço da licença por usuário por mês', 'por usuário por mês'],
  [PARAMETRO_CONECTIVIDADE]: ['Custo anual da conexão por escola', 'por escola por ano'],
  [PARAMETRO_DISPOSITIVO]: ['Preço por dispositivo', 'por dispositivo'],
};
/** Premissa editável da frente: valor da equipe (na moeda do plano ou em US$, casos antigos) ou referência genérica. */
export function premissaV16(s: Pick<Estado14, 'ctx' | 'moeda'>, f: FrenteEstimativa, pid: string, moeda: string): PremissaV16 {
  const ref = parametro(pid), taxa = taxaV16(moeda, s), salvo = raizOrcamento(s, f).premissas?.[chavePremissa(pid)];
  const [item, unidade] = ITENS_PREMISSA[pid] || [ref.item, ref.unidade];
  const base = { pid, item: t(item), unidade: t(unidade), rotulo: t(item) + ' (' + moeda + ')', referenciaUSD: ref.valor };
  // casos antigos guardavam só o número (em US$); os novos guardam { valor, moeda }
  const v = positivo(salvo) ? { valor: salvo, moeda: 'USD' } : salvo && typeof salvo === 'object' && positivo(salvo.valor) ? { valor: salvo.valor as number, moeda: String(salvo.moeda || 'USD') } : null;
  if (v && v.moeda === moeda) return { ...base, equipe: true, valor: v.valor, moedaValor: moeda, valorLocal: v.valor, valorUSD: moeda === 'USD' ? v.valor : taxa ? v.valor / taxa : null };
  const usd = v && v.moeda === 'USD' ? v.valor : ref.valor;
  return { ...base, equipe: !!v, valor: usd, moedaValor: 'USD', valorUSD: usd, valorLocal: taxa === null ? null : moeda === 'USD' ? usd : usd * taxa };
}
/** "R$ 60,00 por hora-participante (valor da equipe)" */
export function textoPremissa(p: PremissaV16): string {
  return formatarMoedaEst(p.valor, p.moedaValor) + ' ' + p.unidade + ' (' + (p.equipe ? t('valor da equipe') : t('referência genérica, igual para todos os países')) + ')';
}

/** Estimativa por fase de uma categoria com base de cálculo. */
export function estimativaV16(s: Estado, f: FrenteEstimativa, cat: CategoriaV16, moeda: string): Estimativa | null {
  if (!cat.base) return null;
  const fases = fasesAtivas(s, f), Q = quantidadesBase(s, f, cat), quantidades = Q.quantidades;
  const pids = cat.base === 'infra' ? [PARAMETRO_CONECTIVIDADE, PARAMETRO_DISPOSITIVO] : [cat.base === 'equipe' ? PARAMETRO_EQUIPE : cat.base === 'licenca' ? PARAMETRO_LICENCA : PARAMETRO_FORMACAO];
  const premissas = pids.map(pid => premissaV16(s as any, f, pid, moeda));
  const parametros: ParametroConta[] = (Q.comps.length ? premissas.filter(p => Q.comps.some(c => c.pid === p.pid)) : premissas).map(p => ({ ...parametro(p.pid), item: p.item, valor: p.valor, moeda: p.moedaValor, unidade: p.unidade,
    ...(p.equipe ? { fonte: t('Valor informado pela equipe'), grau: '', ano: null } : {}) }));
  const taxa = taxaV16(moeda, s), conv = taxaMoeda(moeda, s), conversao = conv && taxa !== null ? { ...conv, taxa } : null;
  const usadas = premissas.filter(p => Q.comps.some(c => c.pid === p.pid)), todasEquipe = usadas.length > 0 && usadas.every(p => p.equipe), algumaEquipe = usadas.some(p => p.equipe);
  const nota = [todasEquipe ? t('Valor unitário informado pela equipe.') : algumaEquipe ? t('Parte dos valores unitários foi informada pela equipe; os demais são referências genéricas.')
    : t('Valor de referência genérico da ferramenta (convenção ilustrativa, sem pesquisa de preços no país), igual para todos os países. Substitua pelo valor da sua rede no campo abaixo da conta.'), ...Q.notas].join(' ');
  const meses = fases.reduce((n, x) => n + x.meses, 0);
  const conta = { formula: Q.formula, calculo: '', quantidades, parametros, conversao, periodo: meses ? { meses, rotulo: t('{n} meses', { n: meses }) } : null, nota };
  if (Q.faltas.length || !Q.comps.length) { const fs = Q.faltas.length ? Q.faltas : [{ texto: t('as quantidades da conta'), tela: telaFasesDe(f), ancora: 'fases' }];
    return { valor: null, valorUSD: null, moeda, conta, falta: fs.map(x => x.texto), pendencias: fs, mensagem: t('Informe {lista} para ver uma estimativa.', { lista: fs.map(x => x.texto).join(', ') }) }; }
  // Conta por fase. Premissa na moeda do plano: soma direto na moeda local. Premissa em US$: soma em US$ e converte os
  // acumulados (diferença dos acumulados convertidos), para o total ser exatamente US$ total × taxa exibida.
  let anterior = 0;
  const brutos = fases.map(x => {
    let usd = 0, local = 0, semUSD = false, semLocal = false;
    for (const c of Q.comps) {
      const p = premissas.find(z => z.pid === c.pid)!, r = c.fatorFase(x, anterior);
      if (r.rotulo) quantidades.push({ rotulo: r.rotulo, valor: r.valor as number, origem: '' });
      if (p.moedaValor === moeda && moeda !== 'USD') { local += r.fator * p.valor; if (p.valorUSD === null) semUSD = true; else usd += r.fator * p.valorUSD; }
      else { usd += r.fator * p.valor; if (taxa === null) semLocal = true; }
    }
    anterior = Math.max(anterior, x.alcance);
    return { x, usd: semUSD ? null : usd, localDireto: local, semLocal };
  });
  let acumUSD = 0, acumConv = 0;
  const porFase = brutos.map(b => {
    const usdLoc = (b.usd ?? 0) - (b.localDireto && taxa ? b.localDireto / taxa : 0); // parte em US$ que precisa de conversão
    const precisa = moeda === 'USD' || Math.abs(usdLoc) > 1e-9;
    acumUSD += moeda === 'USD' ? (b.usd ?? 0) : usdLoc;
    const conv = !precisa ? 0 : taxa === null ? null : centavos(centavos(acumUSD * taxa) - acumConv); if (conv !== null) acumConv = centavos(acumConv + conv);
    const valor = b.semLocal || conv === null ? null : centavos((moeda === 'USD' ? 0 : b.localDireto) + conv);
    return { id: b.x.id, nome: b.x.nome, usd: b.usd === null ? 0 : centavos(b.usd), valor };
  });
  const usd = centavos(porFase.reduce((n, x) => n + x.usd, 0));
  const local = premissas.some(p => p.moedaValor === moeda && moeda !== 'USD' && Q.comps.some(c => c.pid === p.pid));
  if (porFase.some(x => x.valor === null)) {
    conta.calculo = porFase.map(x => x.nome + ' ' + formatarMoedaEst(x.usd, 'USD')).join(' + ') + ' = ' + formatarMoedaEst(usd, 'USD');
    return { valor: null, valorUSD: usd, moeda, conta, falta: [], pendencias: [], fases: porFase,
      mensagem: t('Sem taxa de câmbio conhecida para {moeda}; a estimativa em US$ não é convertida para a moeda do orçamento.', { moeda }) } as Estimativa;
  }
  const valor = centavos(porFase.reduce((n, x) => n + (x.valor as number), 0));
  const txt = new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 4 }).format(taxa as number);
  if (moeda === 'USD' || local) conta.calculo = porFase.map(x => x.nome + ' ' + formatarMoedaEst(x.valor as number, moeda)).join(' + ') + ' = ' + formatarMoedaEst(valor, moeda);
  else conta.calculo = porFase.map(x => x.nome + ' ' + formatarMoedaEst(x.usd, 'USD')).join(' + ') + ' = ' + formatarMoedaEst(usd, 'USD') + ' × ' + txt + ' = ' + formatarMoedaEst(valor, moeda);
  return { valor, valorUSD: usd, moeda, conta, fases: porFase } as Estimativa;
}

export interface ItemV16 {
  id: string; n: string; nome: string; grupo: string; opcoes: string[]; marcadas: string[]; base?: Base;
  valor: number | null; valores: Record<string, number | ''>; situacao: string; detalhe: string;
  estimativa: Estimativa | null; referencia: boolean; emReferencia: boolean; estimado: number | null; respondido: boolean;
  compartilhado: boolean; origem: any;
}
/** Orçamento da frente no modelo v016. */
export function orcamentoV16(s: Estado, f: FrenteEstimativa) {
  const o = raizOrcamento(s, f), moeda = String(o.moeda || s.moeda?.cod || 'USD'), fases = fasesAtivas(s, f);
  const itens: ItemV16[] = categoriasV16(s, f).map(c => {
    const x = o.itens?.[c.id] || {}, valores: Record<string, number | ''> = x.valores && typeof x.valores === 'object' ? x.valores : {};
    const nums = fases.map(p => valores[p.id]).filter(positivoOuZero);
    const valor = x.situacao === 'sem_custo' ? 0 : x.situacao === 'informado' ? (nums.length ? centavos(nums.reduce((a, b) => a + (b as number), 0)) : positivoOuZero(x.valor) ? x.valor : null) : null;
    const estimativa = estimativaV16(s, f, c, moeda), emRef = x.situacao === 'referencia' && !!c.base;
    const estimado = emRef && typeof estimativa?.valor === 'number' ? estimativa.valor : null;
    const marcadas = Array.isArray(x.opcoes) ? x.opcoes.filter((v: string) => c.opcoes.includes(v)) : [];
    return { ...c, nome: t(c.nome), grupo: c.grupo, marcadas, valor, valores, situacao: String(x.situacao || ''), detalhe: String(x.detalhe || ''), estimativa, referencia: emRef, emReferencia: emRef, estimado,
      respondido: ['a_estimar', 'sem_custo'].includes(x.situacao) || emRef || valor !== null, compartilhado: false, origem: null as any };
  });
  const tot = totaisOrcamento(itens, itens.every(i => i.respondido));
  const porFase = fases.map(p => ({ id: p.id, nome: p.nome, meses: p.meses, alcance: p.alcance,
    informado: centavos(itens.reduce((n, i) => n + (i.situacao === 'informado' && positivoOuZero(i.valores[p.id]) ? i.valores[p.id] as number : 0), 0)),
    estimado: centavos(itens.reduce((n, i) => n + (i.estimado !== null ? (i.estimativa as any)?.fases?.find((z: any) => z.id === p.id)?.valor || 0 : 0), 0)) }));
  // memória do que está sendo custeado: quantidades e valores unitários de cada linha estimada
  const memoria = itens.filter(i => i.estimado !== null && i.base).map(i => ({ id: i.id, n: i.n, nome: i.nome, quantidades: (i.estimativa as Estimativa).conta.quantidades,
    premissas: pidsDaBase(i.base as Base).map(pid => premissaV16(s as any, f, pid, moeda)).filter(p => (i.estimativa as Estimativa).conta.parametros.some(z => z.id === p.pid)) }));
  const usadas = memoria.flatMap(m => m.premissas), premissasEquipe = usadas.filter(p => p.equipe).filter((p, k, a) => a.findIndex(z => z.pid === p.pid) === k);
  const eletricidade = f === 'educacao' ? valNum(lerEd(s, 'orcamento.quantidades.escolasSemEletricidade')) : null;
  return { itens, moeda, periodo: resumoFases(s, f), fonte: '', fases: porFase, subtotal: tot.informado, temSubtotal: tot.informados > 0, memoria, premissasEquipe, todasEquipe: usadas.length > 0 && usadas.every(p => p.equipe), eletricidade, ...tot };
}
function positivoOuZero(v: unknown): v is number { return typeof v === 'number' && Number.isFinite(v) && v >= 0; }

/** Linhas "Custo por fase" para o resumo, o panorama e os PDFs (informado + estimado de cada fase). */
export function linhasFases(o: { fases?: { nome: string; meses: number; informado: number; estimado: number }[]; moeda: string }): { rotulo: string; valor: string }[] {
  return (o.fases || []).map(f => ({ rotulo: t('Custo por fase') + ' · ' + f.nome + ' (' + t('{n} meses', { n: f.meses }) + ')',
    valor: f.informado + f.estimado ? formatarMoedaEst(f.informado + f.estimado, o.moeda) + (f.estimado ? ' (' + t('inclui estimativas de referência') + ')' : '') : t('Não informado') }));
}

/** Instituição responsável (campo da tela País; a governança antiga guardava em "olhando"). */
export function instituicaoV16(s: Pick<Estado14, 'ctx'>): string { return String(s.ctx.local || s.ctx.olhando || '').trim(); }

export interface LinhaMatriz { id: string; n: string; nome: string; grupo: string; tipo: 'informado' | 'estimado' | 'sem_custo' | 'a_levantar'; porFase: Record<string, number | null>; total: number | null }
/** Categoria × fase: o valor de cada fase (informado ou estimado), o total e a situação. */
export function matrizFases(o: ReturnType<typeof orcamentoV16>): LinhaMatriz[] {
  return o.itens.map(i => {
    const tipo: LinhaMatriz['tipo'] = i.situacao === 'sem_custo' ? 'sem_custo' : i.valor !== null && i.situacao === 'informado' ? 'informado' : i.estimado !== null ? 'estimado' : 'a_levantar';
    const porFase: Record<string, number | null> = {};
    for (const f of o.fases) porFase[f.id] = tipo === 'informado' ? (typeof i.valores[f.id] === 'number' ? i.valores[f.id] as number : null)
      : tipo === 'estimado' ? ((i.estimativa as any)?.fases?.find((z: any) => z.id === f.id)?.valor ?? null) : tipo === 'sem_custo' ? 0 : null;
    return { id: i.id, n: i.n, nome: i.nome, grupo: i.grupo, tipo, porFase, total: tipo === 'informado' ? i.valor : tipo === 'estimado' ? i.estimado : tipo === 'sem_custo' ? 0 : null };
  });
}
/** Total conhecido (informado + estimado), mesmo com itens a levantar. */
export const totalConhecido = (o: { informado: number; estimado: number }) => centavos(o.informado + o.estimado);
/** Parágrafo "Em resumo" para a tela, o resumo e os PDFs. */
export function resumoProsa(o: ReturnType<typeof orcamentoV16>): string {
  const total = totalConhecido(o), meses = o.fases.reduce((n, f) => n + f.meses, 0), d = { total: formatarMoedaEst(total, o.moeda), meses, inf: formatarMoedaEst(o.informado, o.moeda), est: formatarMoedaEst(o.estimado, o.moeda) };
  const fases = o.fases.map(f => f.nome + ' ' + formatarMoedaEst(centavos(f.informado + f.estimado), o.moeda)).join('; ');
  const faltam = o.itens.filter(i => !i.respondido || i.situacao === 'a_estimar').map(i => i.nome);
  return [
    o.faltam ? t('Custo conhecido até agora: {total} em {meses} meses ({inf} informado e {est} estimado).', d) : t('Custo total: {total} em {meses} meses ({inf} informado e {est} estimado).', d),
    o.fases.length ? t('Por fase: {fases}.', { fases }) : '',
    faltam.length ? t('Ainda sem valor ({n}): {lista}.', { n: faltam.length, lista: faltam.join('; ') }) : '',
  ].filter(Boolean).join(' ');
}
/** "O que está sendo custeado": uma linha por categoria estimada, com quantidades, alcance por fase e valores unitários. */
export function linhasMemoria(o: ReturnType<typeof orcamentoV16>): string[] {
  return o.memoria.map(m => (m.n ? m.n + ' ' : '') + m.nome + ': ' + m.quantidades.map(q => q.rotulo + ' ' + num(q.valor)).join(' · ')
    + '. ' + m.premissas.map(p => p.item + ': ' + textoPremissa(p)).join('; ') + '.');
}
/** Próximo passo específico: o que falta levantar, ou confirmar estimativas, ou aprovar. */
export function proximoV16(o: ReturnType<typeof orcamentoV16>): string {
  const faltam = o.itens.filter(i => !i.respondido || i.situacao === 'a_estimar').map(i => i.nome);
  if (faltam.length) return t('Próximo passo: levantar o valor de {lista}.', { lista: faltam.slice(0, 3).join('; ') + (faltam.length > 3 ? ' ' + t('e mais {n}', { n: faltam.length - 3 }) : '') });
  if (o.estimados) return t('Próximo passo: confirmar as estimativas de referência com orçamentos reais e submeter o plano à aprovação.');
  return t('Próximo passo: submeter o plano à aprovação e acompanhar a execução por fase.');
}
/** Riscos e condições para quem decide (curtos, por frente). */
export function riscosV16(f: FrenteEstimativa, o: ReturnType<typeof orcamentoV16>): string[] {
  const r: string[] = [];
  if (o.estimados) r.push(o.todasEquipe ? t('As estimativas usam valores unitários informados pela equipe: confirme-os com orçamentos reais antes de aprovar.')
    : o.premissasEquipe.length ? t('Parte das estimativas usa valores da equipe ({lista}); as demais usam referências ilustrativas, iguais para todos os países: confirme-as com orçamentos reais antes de aprovar.', { lista: o.premissasEquipe.map(p => p.item.toLowerCase()).join('; ') })
    : t('As estimativas de referência são ilustrativas e iguais para todos os países: confirme-as com orçamentos reais antes de aprovar.'));
  if (o.eletricidade) r.push(t('{n} escolas sem eletricidade: conectividade e dispositivos dependem dela, e esse custo ainda está a levantar.', { n: num(o.eletricidade) }));
  if (o.faltam) r.push(o.faltam === 1 ? t('1 item ainda não tem valor e não entra no custo conhecido.') : t('{n} itens ainda não têm valor e não entram no custo conhecido.', { n: o.faltam }));
  if (f === 'governanca') r.push(t('Defina quem responde pela proteção de dados e pela supervisão antes de qualquer contratação.'), t('Preveja cláusulas de saída e portabilidade para não depender de um único fornecedor.'));
  if (f === 'letramento') r.push(t('Garanta horas de formação dentro da carga horária dos professores.'), t('Use materiais acessíveis, adequados à idade e em linguagem simples.'));
  if (f === 'educacao') r.push(t('Com IA: exija proteção dos dados dos estudantes, transparência e avaliação ao fim de cada fase.'), t('Só passe à expansão se o piloto mostrar resultados.'));
  return r;
}

/** Chave da premissa editável no caso (sem pontos, que separam o caminho). */
export const chavePremissa = (pid: string) => pid.replace(/\./g, '_');
/** Premissas (valores unitários) que cada base usa: o campo editável aparece dentro da linha. */
export function pidsDaBase(base: Base): string[] {
  return base === 'infra' ? [PARAMETRO_CONECTIVIDADE, PARAMETRO_DISPOSITIVO] : [base === 'equipe' ? PARAMETRO_EQUIPE : base === 'licenca' ? PARAMETRO_LICENCA : PARAMETRO_FORMACAO];
}
