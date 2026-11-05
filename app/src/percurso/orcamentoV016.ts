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
import { formatarMoedaEst, parametro, taxaMoeda, totaisOrcamento, PARAMETRO_EQUIPE, PARAMETRO_FORMACAO, PARAMETRO_LICENCA,
  type Estimativa, type PendenciaEstimativa, type QuantidadeConta, type FrenteEstimativa } from './estimativasOrcamento';

type Estado = Pick<Estado14, 'ctx' | 'moeda'> & Partial<Pick<Estado14, 'caso'>>;
export type Base = 'formacao' | 'equipe' | 'licenca';
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

/** Quantidades de cada base (pessoas e horas de formação, pessoas da equipe, usuários de licença). */
function quantidadesBase(s: Estado, f: FrenteEstimativa, base: Base, categoria: string): { pessoas?: number | null; horas?: number | null; fte?: number | null; usuarios?: number | null; rotulos: string[]; tela: string; ancora: string[] } {
  if (base === 'equipe') return { fte: valNum(s.ctx.govOrcamento?.quantidades?.equipeFte), rotulos: [t('Pessoas na equipe (tempo integral)')], tela: 'gov-equipe', ancora: ['gov-govOrcamento-quantidades-equipeFte'] };
  if (base === 'licenca') return { usuarios: usuariosIAEd(s as any), rotulos: [t('Usuários da ferramenta')], tela: 'ed-intervencao', ancora: ['ed-orcamento-quantidades-usuarios'] };
  if (f === 'governanca') return { pessoas: valNum(s.ctx.govOrcamento?.quantidades?.servidores), horas: valNum(s.ctx.govOrcamento?.quantidades?.horasServidor), rotulos: [t('Servidores a formar'), t('Horas por servidor')], tela: 'gov-equipe', ancora: ['gov-govOrcamento-quantidades-servidores', 'gov-govOrcamento-quantidades-horasServidor'] };
  if (f === 'educacao') return { pessoas: valNum(lerEd(s, 'orcamento.quantidades.profissionais')), horas: valNum(lerEd(s, 'orcamento.quantidades.horasProfissional')), rotulos: [t('Profissionais a formar'), t('Horas por profissional')], tela: 'ed-intervencao', ancora: ['ed-orcamento-quantidades-profissionais', 'ed-orcamento-quantidades-horasProfissional'] };
  // letramento (1.1): professores (+ lideranças escolares, se incluídas) × horas por curso × cursos por pessoa
  void categoria;
  const prof = valNum(lerLit(s, 'publicos.A11.participantes'));
  const inclui = (lerLit(s, 'publicos.A11.incluiLiderancas')?.escolhas || []).includes('sim');
  const lid = inclui ? valNum(lerLit(s, 'publicos.A11.liderancas')) : 0;
  const h = valNum(lerLit(s, 'publicos.A11.horas')), c = valNum(lerLit(s, 'publicos.A11.cursos')) || 1;
  return { pessoas: prof === null || (inclui && lid === null) ? null : prof + (lid || 0), horas: h === null ? null : h * c,
    rotulos: [t('Professores') + (inclui ? ' + ' + t('lideranças escolares') : ''), t('Horas por curso') + ' × ' + t('cursos por pessoa')], tela: 'lit-participantes', ancora: ['lit-participantes'] };
}

/** Estimativa de referência por fase de uma categoria com base de cálculo. */
export function estimativaV16(s: Estado, f: FrenteEstimativa, cat: CategoriaV16, moeda: string): Estimativa | null {
  if (!cat.base) return null;
  const fases = fasesAtivas(s, f), q = quantidadesBase(s, f, cat.base, cat.id), faltas: PendenciaEstimativa[] = [];
  const pid = cat.base === 'equipe' ? PARAMETRO_EQUIPE : cat.base === 'licenca' ? PARAMETRO_LICENCA : PARAMETRO_FORMACAO;
  const base0 = parametro(pid), proprio = raizOrcamento(s, f).premissas?.[chavePremissa(pid)];
  // premissa editável: a equipe pode substituir o valor de referência (custo por hora, custo anual por pessoa, licença)
  const item = cat.base === 'equipe' ? 'Custo anual de referência por pessoa em tempo integral' : cat.base === 'licenca' ? 'Preço de referência da licença por usuário por mês' : 'Custo de referência por hora de formação';
  const param = positivo(proprio) ? { ...base0, item, valor: proprio, fonte: t('Valor informado pela equipe'), grau: '' } : { ...base0, item };
  const conversao = taxaMoeda(moeda, s), quantidades: QuantidadeConta[] = [];
  const falta = (i: number) => faltas.push({ texto: q.rotulos[i], tela: q.tela, ancora: q.ancora[i] || q.ancora[0] });
  if (!fases.length) faltas.push({ texto: t('as fases do plano'), tela: f === 'governanca' ? 'gov-fases' : f === 'letramento' ? 'lit-fases' : 'ed-fases', ancora: 'fases' });
  if (cat.base === 'formacao') { if (q.pessoas == null) falta(0); if (q.horas == null) falta(1); }
  if (cat.base === 'equipe' && q.fte == null) falta(0);
  if (cat.base === 'licenca' && q.usuarios == null) falta(0);
  const formula = cat.base === 'formacao' ? t('Por fase: pessoas novas na fase (alcance da fase − alcance anterior) × horas × custo por hora de formação')
    : cat.base === 'equipe' ? t('Por fase: pessoas em tempo integral × (meses da fase ÷ 12) × custo anual por pessoa')
    : t('Por fase: usuários alcançados na fase × preço de referência por licença por mês × meses da fase');
  const nota = positivo(proprio) ? t('Valor de referência substituído pela equipe.') : t('Valor de referência genérico da ferramenta (grau C: convenção sem pesquisa de preços no país), em US$ e igual para todos os países. Substitua pelo valor da sua rede no campo abaixo da conta.');
  const meses = fases.reduce((n, x) => n + x.meses, 0);
  const conta = { formula, calculo: '', quantidades, parametros: [param], conversao, periodo: meses ? { meses, rotulo: t('{n} meses', { n: meses }) } : null, nota };
  if (q.pessoas != null) quantidades.push({ rotulo: q.rotulos[0], valor: q.pessoas, origem: '' });
  if (q.horas != null) quantidades.push({ rotulo: q.rotulos[1], valor: q.horas, origem: '' });
  if (q.fte != null) quantidades.push({ rotulo: q.rotulos[0], valor: q.fte, origem: '' });
  if (q.usuarios != null) quantidades.push({ rotulo: q.rotulos[0], valor: q.usuarios, origem: '' });
  if (faltas.length) return { valor: null, valorUSD: null, moeda, conta, falta: faltas.map(x => x.texto), pendencias: faltas,
    mensagem: t('Informe {lista} para ver uma estimativa.', { lista: faltas.map(x => x.texto).join(', ') }) };
  const taxa = moeda === 'USD' ? 1 : conversao?.taxa ?? null;
  let anterior = 0;
  const porFase = fases.map(x => {
    let usd = 0;
    if (cat.base === 'formacao') { const novos = Math.max(0, Math.round((q.pessoas as number) * x.alcance / 100) - Math.round((q.pessoas as number) * anterior / 100)); /* diferença dos acumulados arredondados: a soma das fases é o total */ usd = novos * (q.horas as number) * param.valor; quantidades.push({ rotulo: x.nome + ' (' + x.alcance + '%): ' + t('pessoas novas'), valor: novos, origem: '' }); }
    else if (cat.base === 'equipe') usd = (q.fte as number) * (x.meses / 12) * param.valor;
    else { const u = Math.round((q.usuarios as number) * x.alcance / 100); usd = u * param.valor * x.meses; quantidades.push({ rotulo: x.nome + ' (' + x.alcance + '%): ' + t('usuários alcançados'), valor: u, origem: '' }); }
    anterior = Math.max(anterior, x.alcance);
    return { id: x.id, nome: x.nome, usd: centavos(usd), valor: taxa === null ? null : centavos(usd * taxa) };
  });
  const usd = centavos(porFase.reduce((n, x) => n + x.usd, 0));
  conta.calculo = porFase.map(x => x.nome + ' ' + formatarMoedaEst(x.usd, 'USD')).join(' + ') + ' = ' + formatarMoedaEst(usd, 'USD');
  if (taxa === null) return { valor: null, valorUSD: usd, moeda, conta, falta: [], pendencias: [], fases: porFase,
    mensagem: t('Sem taxa de câmbio conhecida para {moeda}; a estimativa em US$ não é convertida para a moeda do orçamento.', { moeda }) } as Estimativa;
  const valor = centavos(porFase.reduce((n, x) => n + (x.valor as number), 0)); // soma das fases, para o total bater com o custo por fase
  if (moeda !== 'USD') conta.calculo += ' × ' + new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 4 }).format(taxa) + ' = ' + formatarMoedaEst(valor, moeda);
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
  return { itens, moeda, periodo: resumoFases(s, f), fonte: '', fases: porFase, subtotal: tot.informado, temSubtotal: tot.informados > 0, ...tot };
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
    o.faltam ? t('Custo conhecido até agora: {total} em {meses} meses ({inf} informado e {est} em estimativas de referência).', d) : t('Custo total: {total} em {meses} meses ({inf} informado e {est} em estimativas de referência).', d),
    o.fases.length ? t('Por fase: {fases}.', { fases }) : '',
    faltam.length ? t('Ainda sem valor ({n}): {lista}.', { n: faltam.length, lista: faltam.join('; ') }) : '',
  ].filter(Boolean).join(' ');
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
  const r = [t('As estimativas de referência são ilustrativas e iguais para todos os países: confirme-as com orçamentos reais antes de aprovar.')];
  if (o.faltam) r.push(t('{n} itens ainda não têm valor e não entram no custo conhecido.', { n: o.faltam }));
  if (f === 'governanca') r.push(t('Defina quem responde pela proteção de dados e pela supervisão antes de qualquer contratação.'), t('Preveja cláusulas de saída e portabilidade para não depender de um único fornecedor.'));
  if (f === 'letramento') r.push(t('Garanta horas de formação dentro da carga horária dos professores.'), t('Use materiais acessíveis, adequados à idade e em linguagem simples.'));
  if (f === 'educacao') r.push(t('Com IA: exija proteção dos dados dos estudantes, transparência e avaliação ao fim de cada fase.'), t('Só passe à expansão se o piloto mostrar resultados.'));
  return r;
}

/** Chave da premissa editável no caso (sem pontos, que separam o caminho). */
export const chavePremissa = (pid: string) => pid.replace(/\./g, '_');
/** Parâmetro de referência de cada base e o rótulo do campo para a equipe substituí-lo. */
export function premissaDaBase(base: Base): { pid: string; rotulo: string; padrao: number } {
  const pid = base === 'equipe' ? PARAMETRO_EQUIPE : base === 'licenca' ? PARAMETRO_LICENCA : PARAMETRO_FORMACAO;
  const rotulo = base === 'equipe' ? t('Custo anual por pessoa (US$)') : base === 'licenca' ? t('Preço da licença por usuário por mês (US$)') : t('Custo por hora de formação (US$)');
  return { pid, rotulo, padrao: parametro(pid).valor };
}
