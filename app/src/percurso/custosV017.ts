// Versão de teste v017: o custo nasce das opções escolhidas.
// Prioridade → desafio → categorias escolhidas → opções escolhidas → valores de cada opção (quantidade × valor unitário,
// ou valor por fase). Cada opção tem um "tipo de custo" padrão, que a equipe pode trocar; só há valor unitário sugerido
// onde a base de referências tem um (formação, equipe, licença, conexão, dispositivo). Sem botões de situação: uma opção
// sem valor é uma pendência que diz o que falta.
import { ALUNOS_POR_PROF, totaisCtx, LOC } from '../domain';
import type { Estado14 } from '../store/tipos';
import { t } from './textos';
import { lerLit } from './letramento';
import { fatorEncargos, encargosDoPais } from './encargosPais';
import { formatarMoedaEst, parametro, PARAMETRO_EQUIPE, PARAMETRO_FORMACAO, PARAMETRO_LICENCA, PARAMETRO_CONECTIVIDADE, PARAMETRO_DISPOSITIVO, type FrenteEstimativa } from './estimativasOrcamento';

export type TipoCusto = 'formacao' | 'pessoa' | 'licenca' | 'escola_ano' | 'escola' | 'unidade' | 'equipe' | 'trabalho' | 'fechado';
export type Fonte = 'professores' | 'estudantes' | 'escolas' | null;
type Dist = 'novos' | 'acumulado_mes' | 'acumulado_ano' | 'tempo' | 'direto';

export const TIPOS: Record<TipoCusto, { rotulo: string; qtd?: string; horas?: boolean; horasRotulo?: string; unit?: string; dist: Dist }> = {
  formacao: { rotulo: 'Pessoas × horas × custo por hora', qtd: 'Pessoas', horas: true, unit: 'Custo por hora', dist: 'novos' },
  pessoa: { rotulo: 'Pessoas × custo por pessoa', qtd: 'Pessoas', unit: 'Custo por pessoa', dist: 'novos' },
  licenca: { rotulo: 'Usuários × preço por mês × meses', qtd: 'Usuários', unit: 'Preço por usuário por mês', dist: 'acumulado_mes' },
  escola_ano: { rotulo: 'Escolas × custo por ano', qtd: 'Escolas', unit: 'Custo por escola por ano', dist: 'acumulado_ano' },
  escola: { rotulo: 'Escolas × custo por escola', qtd: 'Escolas', unit: 'Custo por escola', dist: 'novos' },
  unidade: { rotulo: 'Unidades × preço por unidade', qtd: 'Unidades', unit: 'Preço por unidade', dist: 'novos' },
  equipe: { rotulo: 'Pessoas em tempo integral × custo anual', qtd: 'Pessoas em tempo integral', unit: 'Custo anual por pessoa', dist: 'tempo' },
  // v018 (governança): trabalho pontual = pessoas × meses × custo mensal por pessoa
  trabalho: { rotulo: 'Pessoas × meses × custo mensal', qtd: 'Pessoas', horas: true, horasRotulo: 'Meses de trabalho', unit: 'Custo mensal por pessoa', dist: 'novos' },
  fechado: { rotulo: 'Valor por fase', dist: 'direto' },
};
export const ORDEM_TIPOS: TipoCusto[] = ['fechado', 'formacao', 'pessoa', 'licenca', 'equipe', 'escola_ano', 'escola', 'unidade'];

/** Tipo padrão, de onde vem a quantidade sugerida e a referência de cada opção (pelo texto em português da opção). */
const PADROES: Record<string, [TipoCusto, Fonte, string | null]> = {
  // governança
  'Especialistas em TI (IA, dados, segurança, infraestrutura)': ['equipe', null, 'sal.eng_integracao'],
  'Profissionais jurídicos': ['equipe', null, null],
  'Pessoal de governança de IA': ['equipe', null, null],
  'Especialistas em IA e educação': ['equipe', null, PARAMETRO_EQUIPE],
  'Formação e desenvolvimento profissional': ['formacao', null, PARAMETRO_FORMACAO],
  // v018: governança — esforço de referência (docs "Referências de custo da governança", grau C) × custo local
  'Classificação de segurança e risco de IA': ['trabalho', null, PARAMETRO_EQUIPE],
  'Direitos e proteção de crianças': ['trabalho', null, PARAMETRO_EQUIPE],
  'Proteção de dados pessoais e privacidade': ['trabalho', null, PARAMETRO_EQUIPE],
  'Equidade algorítmica, não discriminação, transparência, explicabilidade e prestação de contas': ['trabalho', null, PARAMETRO_EQUIPE],
  'Cibersegurança e notificação de incidentes': ['trabalho', null, PARAMETRO_EQUIPE],
  'Propriedade intelectual e direitos autorais': ['trabalho', null, PARAMETRO_EQUIPE],
  'Ambientes de teste controlados': ['trabalho', null, PARAMETRO_EQUIPE],
  'Avaliações de risco': ['trabalho', null, PARAMETRO_EQUIPE],
  'Diretrizes éticas de IA para a educação': ['trabalho', null, PARAMETRO_EQUIPE],
  'Diretrizes de contratação de IA e avaliação de fornecedores': ['trabalho', null, PARAMETRO_EQUIPE],
  'Diretrizes de uso de IA adequado à idade': ['trabalho', null, PARAMETRO_EQUIPE],
  'Políticas de uso de IA por professores e estudantes': ['trabalho', null, PARAMETRO_EQUIPE],
  'Padrões de gestão de riscos de IA': ['trabalho', null, PARAMETRO_EQUIPE],
  'Padrões de transparência e documentação de IA': ['trabalho', null, PARAMETRO_EQUIPE],
  'Padrões de governança e segurança de dados': ['trabalho', null, PARAMETRO_EQUIPE],
  'Diretrizes de garantia de qualidade e avaliação de IA': ['trabalho', null, PARAMETRO_EQUIPE],
  'Transferência de tecnologia': ['trabalho', null, PARAMETRO_EQUIPE],
  'Customização local': ['trabalho', null, PARAMETRO_EQUIPE],
  'Redução da dependência de fornecedores': ['trabalho', null, PARAMETRO_EQUIPE],
  'Supervisão regulatória': ['equipe', null, PARAMETRO_EQUIPE],
  'Adoção e manutenção de código aberto': ['equipe', null, PARAMETRO_EQUIPE],
  'Comitês de governança': ['equipe', null, PARAMETRO_EQUIPE],
  'Coordenação interministerial': ['equipe', null, PARAMETRO_EQUIPE],
  'Estruturas institucionais de governança': ['equipe', null, PARAMETRO_EQUIPE],
  'Governança e proteção de dados e infraestrutura pública digital': ['equipe', null, PARAMETRO_EQUIPE],
  // letramento: professores
  'Formação presencial': ['formacao', 'professores', PARAMETRO_FORMACAO],
  'Formação online': ['formacao', 'professores', PARAMETRO_FORMACAO],
  'Formação híbrida': ['formacao', 'professores', PARAMETRO_FORMACAO],
  'Formação de formadores': ['formacao', null, PARAMETRO_FORMACAO],
  'Formação na escola': ['formacao', 'professores', PARAMETRO_FORMACAO],
  'Plataformas digitais de formação': ['licenca', 'professores', PARAMETRO_LICENCA],
  'Ferramentas e licenças de IA para a formação': ['licenca', 'professores', PARAMETRO_LICENCA],
  'Avaliações de competências em IA': ['pessoa', 'professores', null],
  'Certificação profissional': ['pessoa', 'professores', null],
  'Credenciais digitais': ['pessoa', 'professores', null],
  'Cursos de reciclagem': ['formacao', 'professores', PARAMETRO_FORMACAO],
  'Mentoria e coaching': ['equipe', null, PARAMETRO_EQUIPE],
  'Apoio técnico e pedagógico': ['equipe', null, PARAMETRO_EQUIPE],
  // letramento: estudantes
  'Plataformas de aprendizagem de IA': ['licenca', 'estudantes', PARAMETRO_LICENCA],
  'Softwares e licenças educacionais de IA': ['licenca', 'estudantes', PARAMETRO_LICENCA],
  'Avaliações de letramento em IA': ['pessoa', 'estudantes', null],
  'Oficinas para estudantes': ['pessoa', 'estudantes', null],
  // educação
  'Eletricidade': ['escola', 'escolas', null],
  'Conectividade': ['escola_ano', 'escolas', PARAMETRO_CONECTIVIDADE],
  'Largura de banda': ['escola_ano', 'escolas', null],
  'Dispositivos': ['unidade', null, PARAMETRO_DISPOSITIVO],
  'Plataformas': ['licenca', 'estudantes', PARAMETRO_LICENCA],
  'Ferramentas de IA': ['licenca', 'professores', PARAMETRO_LICENCA],
};
/** v018: esforço de referência das opções da governança (grau C: convenção, a calibrar): pessoas e, no trabalho pontual, meses. */
/** v018: fontes públicas citadas na explicação das contas da governança. */
export interface FonteConta { titulo: string; url: string | null }
export const FONTES_GOV: Record<'aiact' | 'noruega' | 'quenia', FonteConta> = {
  aiact: { titulo: 'Proposta do AI Act, COM(2021) 206, seção 4: de 1 a 25 servidores em tempo integral por país na supervisão', url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:52021PC0206' },
  noruega: { titulo: 'Sandbox de IA da Noruega: 4 projetos por ano, de 3 a 6 meses cada (Cambridge Forum on AI: Law and Governance)', url: 'https://www.cambridge.org/core/journals/cambridge-forum-on-ai-law-and-governance/article/from-watchdogs-to-partners-in-tech-innovation-navigating-regulatory-roles-in-norways-ai-sandbox/7E2FA0B1F75E6803B2DE4124EB0FC6CB' },
  quenia: { titulo: 'Orçamento do órgão de proteção de dados do Quênia, 2021–2025 (Open Budget Kenya)', url: 'https://openbudget.or.ke/project/1122002100_The_Office_of_the_Data_Protection_Commi/2024' },
};
export const ESFORCO_GOV: Record<string, { qtd: number; meses?: number; base?: keyof typeof FONTES_GOV }> = {
  'Classificação de segurança e risco de IA': { qtd: 3, meses: 6 },
  'Direitos e proteção de crianças': { qtd: 2, meses: 4 },
  'Proteção de dados pessoais e privacidade': { qtd: 3, meses: 6, base: 'quenia' },
  'Equidade algorítmica, não discriminação, transparência, explicabilidade e prestação de contas': { qtd: 2, meses: 6 },
  'Cibersegurança e notificação de incidentes': { qtd: 2, meses: 4 },
  'Propriedade intelectual e direitos autorais': { qtd: 2, meses: 4 },
  'Ambientes de teste controlados': { qtd: 3, meses: 6, base: 'noruega' },
  'Avaliações de risco': { qtd: 1, meses: 4 },
  'Diretrizes éticas de IA para a educação': { qtd: 2, meses: 3 },
  'Diretrizes de contratação de IA e avaliação de fornecedores': { qtd: 2, meses: 3 },
  'Diretrizes de uso de IA adequado à idade': { qtd: 2, meses: 3 },
  'Políticas de uso de IA por professores e estudantes': { qtd: 2, meses: 3 },
  'Padrões de gestão de riscos de IA': { qtd: 2, meses: 3 },
  'Padrões de transparência e documentação de IA': { qtd: 2, meses: 3 },
  'Padrões de governança e segurança de dados': { qtd: 2, meses: 3 },
  'Diretrizes de garantia de qualidade e avaliação de IA': { qtd: 2, meses: 3 },
  'Transferência de tecnologia': { qtd: 2, meses: 6 },
  'Customização local': { qtd: 3, meses: 6 },
  'Redução da dependência de fornecedores': { qtd: 1, meses: 3 },
  'Supervisão regulatória': { qtd: 2, base: 'aiact' },
  'Adoção e manutenção de código aberto': { qtd: 2 },
  'Comitês de governança': { qtd: 0.5 },
  'Coordenação interministerial': { qtd: 1 },
  'Estruturas institucionais de governança': { qtd: 4, base: 'quenia' },
  'Governança e proteção de dados e infraestrutura pública digital': { qtd: 3, base: 'quenia' },
};
/** Itens da 1.1 são parâmetros da formação (não viram linha de custo): ao marcar, abrem um campo, gravado nos campos de
 *  professores do letramento que já existiam (os mesmos da tela Públicos). */
export interface Parametro { campo: string; rotulo: string; decimais?: boolean; liderancas?: boolean }
export const PARAMETROS: Record<string, Parametro> = {
  'Número de professores a formar': { campo: 'publicos.A11.participantes', rotulo: 'Número de professores', liderancas: true },
  'Horas por curso': { campo: 'publicos.A11.horas', rotulo: 'Horas por curso', decimais: true },
  'Número de cursos por professor': { campo: 'publicos.A11.cursos', rotulo: 'Cursos por professor' },
  'Frequência da formação': { campo: 'orcamento.parametros.frequencia', rotulo: 'Vezes por ano' },
  'Duração e calendário': { campo: 'orcamento.parametros.duracao', rotulo: 'Duração (meses)' },
  'Frequência de reciclagem': { campo: 'orcamento.parametros.reciclagem', rotulo: 'Reciclagens por ano' },
};
export const ehParametro = (f: FrenteEstimativa, catId: string, rotulo: string) => f === 'letramento' && catId === 'l11' && Object.hasOwn(PARAMETROS, rotulo);

/** Opções de formação docente da educação (um tipo de profissional por desafio). */
const FORMACAO_ED = /^(Educadores|Professores|Instrutores)/;

export function padraoOpcao(f: FrenteEstimativa, catId: string, rotulo: string): { tipo: TipoCusto; fonte: Fonte; ref: string | null } {
  const p = PADROES[rotulo];
  if (p) return { tipo: p[0], fonte: p[1], ref: p[2] };
  if (f === 'educacao' && catId === 'e3' && (FORMACAO_ED.test(rotulo) || rotulo === 'Formação docente')) return { tipo: 'formacao', fonte: 'professores', ref: PARAMETRO_FORMACAO };
  if (f === 'governanca' && catId === 'g32') return { tipo: 'formacao', fonte: null, ref: PARAMETRO_FORMACAO };
  return { tipo: 'fechado', fonte: null, ref: null };
}
/** Referência para um tipo trocado pela equipe: só onde a base tem um valor do mesmo tipo. */
export function refDoTipo(tipo: TipoCusto, padrao: { tipo: TipoCusto; ref: string | null }): string | null {
  if (tipo === padrao.tipo) return padrao.ref;
  return tipo === 'formacao' ? PARAMETRO_FORMACAO : tipo === 'licenca' ? PARAMETRO_LICENCA : null;
}
/** Valor de referência em US$ (base de referências da ferramenta). */
export const referenciaUSD = (pid: string | null) => pid ? parametro(pid).valor : null;

/** Quantidades sugeridas a partir do Contexto (e, no letramento, do número de professores e estudantes já informados). */
export function quantidadeSugerida(s: Pick<Estado14, 'ctx'>, fonte: Fonte): number | null {
  if (!fonte) return null;
  const r = (s.ctx as any).redeNacional || {}, tot = totaisCtx(s.ctx);
  const alunos = +r.estudantes || tot.alunos || 0, escolas = +r.escolas || tot.escolas || 0;
  const num = (v: any) => { const x = v && typeof v === 'object' ? v.valor : v; return typeof x === 'number' && x > 0 ? x : null; };
  if (fonte === 'estudantes') return num(lerLit(s, 'publicos.A12.participantes')) ?? (alunos || null);
  if (fonte === 'escolas') return escolas || null;
  const prof = num(lerLit(s, 'publicos.A11.participantes')) ?? (alunos ? Math.max(1, Math.round(alunos / ALUNOS_POR_PROF)) : null);
  // professores: soma diretores e coordenadores quando a formação os inclui (tela Públicos do letramento)
  const lider = (lerLit(s, 'publicos.A11.incluiLiderancas')?.escolhas || []).includes('sim') ? num(lerLit(s, 'publicos.A11.liderancas')) || 0 : 0;
  return prof === null ? null : prof + lider;
}

/** Chave estável de uma opção (o texto em português, sem acentos nem pontuação). */
export const chaveOpcao = (rotulo: string) => rotulo.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '_';

export interface FaseCalc { id: string; nome: string; meses: number; alcance: number }
export interface CustoSalvo { tipo?: TipoCusto; qtd?: number; horas?: number; unit?: number; fases?: Record<string, number> }
export interface ParteConta { rotulo: string; valor: string; texto: string; fontes: FonteConta[] }
export interface ContaOpcao { formula: string; partes: ParteConta[] }
export interface LinhaOpcao {
  chave: string; rotulo: string; tipo: TipoCusto; tipoPadrao: TipoCusto; fonte: Fonte;
  qtd: number | null; qtdSugerida: boolean; horas: number | null; unit: number | null; unitRef: number | null; unitDaReferencia: boolean;
  valoresFase: Record<string, number | ''>;
  porFase: Record<string, number>; total: number | null;
  status: 'informado' | 'referencia' | 'falta'; falta: string[];
  /** v018: a linha usa o esforço de referência da governança (grau C) */
  esforcoC?: boolean;
  /** v018: a conta e de onde vem cada número (explicação "Como foi calculado") */
  conta?: ContaOpcao;
  memoria: string;
}
const positivo = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
const naoNeg = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const centavos = (v: number) => Math.round(v * 100) / 100;
const novos = (n: number, x: FaseCalc, anterior: number) => Math.max(0, Math.round(n * x.alcance / 100) - Math.round(n * anterior / 100));

/** Custo de uma opção por fase. `taxa` = moeda do plano por US$ (4 casas), para a referência sugerida. */
export function calcularOpcao(s: Pick<Estado14, 'ctx'>, f: FrenteEstimativa, catId: string, rotulo: string, salvo: CustoSalvo, fases: FaseCalc[], taxa: number | null,
  fmt: (v: number) => string, num: (v: number) => string): LinhaOpcao {
  // v018: na governança cada opção tem a forma de cálculo fixa (sem "Como calcular"); um tipo salvo antes fica guardado
  const pad = padraoOpcao(f, catId, rotulo), tipo: TipoCusto = f !== 'governanca' && salvo.tipo && TIPOS[salvo.tipo] ? salvo.tipo : pad.tipo, def = TIPOS[tipo];
  const esf = f === 'governanca' && tipo === pad.tipo ? ESFORCO_GOV[rotulo] : undefined;
  const sug = def.qtd ? quantidadeSugerida(s, pad.fonte) ?? esf?.qtd ?? null : null;
  const qtd = positivo(salvo.qtd) ? salvo.qtd : (tipo === pad.tipo ? sug : null), qtdSugerida = !positivo(salvo.qtd) && qtd !== null;
  const horas = positivo(salvo.horas) ? salvo.horas : (esf?.meses ?? null);
  // v018: esforço de referência em uso (grau C) e, na governança, encargos do país sobre o custo de pessoal
  const esforcoC = !!esf && ((!positivo(salvo.qtd) && qtd === esf.qtd) || (!!esf.meses && !positivo(salvo.horas)));
  // encargos do país só sobre salário bruto: a referência atual já é "custo carregado" (inclui encargos), então não se aplica
  const pidRef = refDoTipo(tipo, pad), refCarregada = !!pidRef && /carregado/i.test(parametro(pidRef).item);
  const fator = f === 'governanca' && (tipo === 'equipe' || tipo === 'trabalho') && !refCarregada ? fatorEncargos((s as any).caso?.pais) : 1;
  const refBase = referenciaUSD(refDoTipo(tipo, pad)), refUSD = refBase === null ? null : (tipo === 'trabalho' ? refBase / 12 : refBase) * fator;
  const unitRef = refUSD === null || taxa === null ? null : centavos(refUSD * taxa);
  const unit = naoNeg(salvo.unit) ? salvo.unit : unitRef, unitDaReferencia = !naoNeg(salvo.unit) && unitRef !== null;
  const valoresFase: Record<string, number | ''> = {}; for (const x of fases) valoresFase[x.id] = naoNeg(salvo.fases?.[x.id]) ? salvo.fases![x.id] : '';
  const falta: string[] = [];
  if (!fases.length) falta.push(t('as fases do plano'));
  if (tipo === 'fechado') { if (!fases.some(x => valoresFase[x.id] !== '')) falta.push(fases.length === 1 && fases[0].id === 'total' ? t('o valor total') : t('o valor de pelo menos uma fase')); }
  else {
    if (qtd === null) falta.push(t(def.qtd!).toLowerCase());
    if (def.horas && horas === null) falta.push(t(def.horasRotulo || 'Horas por pessoa').toLowerCase());
    if (unit === null) falta.push(t(def.unit!).toLowerCase());
  }
  const porFase: Record<string, number> = {};
  let total: number | null = null, memoria = '';
  if (!falta.length) {
    let anterior = 0;
    for (const x of fases) {
      let v = 0;
      if (tipo === 'fechado') v = valoresFase[x.id] === '' ? 0 : valoresFase[x.id] as number;
      else {
        const q = qtd as number, u = unit as number;
        if (def.dist === 'novos') v = novos(q, x, anterior) * (def.horas ? horas as number : 1) * u;
        else if (def.dist === 'acumulado_mes') v = Math.round(q * x.alcance / 100) * u * x.meses;
        else if (def.dist === 'acumulado_ano') v = Math.round(q * x.alcance / 100) * u * x.meses / 12;
        else v = q * u * x.meses / 12;
      }
      anterior = Math.max(anterior, x.alcance);
      porFase[x.id] = centavos(v);
    }
    total = centavos(Object.values(porFase).reduce((a, b) => a + b, 0));
    memoria = tipo === 'fechado' ? fases.map(x => x.nome + ' ' + fmt(porFase[x.id])).join(' · ')
      : [num(qtd as number) + ' ' + t(def.qtd!).toLowerCase(), def.horas ? (tipo === 'trabalho' ? num(horas as number) + ' ' + t('meses') : num(horas as number) + ' h') : '', fmt(unit as number) + ' (' + t(def.unit!).toLowerCase() + ')'].filter(Boolean).join(' × ')
        + (unitDaReferencia ? ' · ' + t('referência genérica, igual para todos os países') : '')
        + (unitDaReferencia && fator !== 1 ? ' · ' + t('com encargos do país (× {f})', { f: num(Math.round(fator * 1000) / 1000) }) : '')
        + (esforcoC ? ' · ' + t('esforço de referência (grau C)') : '');
  }
  // v018: de onde vem cada número da conta (governança)
  let conta: ContaOpcao | undefined;
  if (f === 'governanca') {
    const partes: ParteConta[] = [], voce = t('informado por você');
    const fonteEsf = esf?.base ? [FONTES_GOV[esf.base]] : [];
    const txtEsf = t('esforço de referência (grau C): convenção da ferramenta, a calibrar') + (esf?.base ? '; ' + t('ordem de grandeza conferida em caso real') : '');
    if (tipo === 'fechado') partes.push({ rotulo: t('Valor total'), valor: total === null ? '—' : fmt(total), texto: total === null ? t('ainda sem valor') : voce, fontes: [] });
    else {
      if (qtd !== null) partes.push({ rotulo: t(def.qtd!), valor: num(qtd), fontes: positivo(salvo.qtd) ? [] : esf && qtd === esf.qtd ? fonteEsf : [],
        texto: positivo(salvo.qtd) ? voce : esf && qtd === esf.qtd ? txtEsf : t('sugerido a partir do Contexto') });
      if (def.horas && horas !== null) partes.push({ rotulo: t(def.horasRotulo || 'Horas por pessoa'), valor: num(horas), fontes: positivo(salvo.horas) ? [] : esf?.meses ? fonteEsf : [],
        texto: positivo(salvo.horas) ? voce : esf?.meses ? txtEsf : '' });
      if (unit !== null) {
        if (!unitDaReferencia) partes.push({ rotulo: t(def.unit!), valor: fmt(unit), texto: voce, fontes: [] });
        else {
          const pid = refDoTipo(tipo, pad)!, par = parametro(pid), fontes: FonteConta[] = [];
          const usd = (v: number) => formatarMoedaEst(v, 'USD');
          const tx = taxa === null ? '' : new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 4 }).format(taxa);
          const enc = fator !== 1 ? encargosDoPais((s as any).caso?.pais) : null;
          const pedacos = [t('{item}: {v} ({unidade}; {fonte}, grau {g})', { item: t(par.item), v: usd(par.valor), unidade: t(par.unidade), fonte: t(par.fonte), g: par.grau })];
          if (tipo === 'trabalho') pedacos.push(t('÷ 12 meses'));
          if (tx && taxa !== 1) pedacos.push(t('× câmbio de {tx} por US$', { tx }));
          if (refCarregada) pedacos.push(t('(o custo carregado já inclui os encargos)'));
          if (enc) { pedacos.push(t('× encargos do país {f} (contribuição patronal de {p}%, SSA e ISSA, {vol} {ano})', { f: num(Math.round(fator * 1000) / 1000), p: num(enc.taxa), vol: t(enc.volume), ano: enc.ano })); fontes.push({ titulo: t('Social Security Programs Throughout the World, SSA e ISSA ({vol} {ano}), tabela 4', { vol: t(enc.volume), ano: enc.ano }), url: enc.url }); }
          partes.push({ rotulo: t(def.unit!), valor: fmt(unit), texto: pedacos.join(' '), fontes });
        }
      }
    }
    const formula = tipo === 'fechado' ? '' : partes.map((p, i) => i < partes.length - 1 ? p.valor + ' ' + p.rotulo.toLocaleLowerCase() : p.valor).join(' × ') + (total === null ? '' : ' = ' + fmt(total));
    conta = { formula, partes };
  }
  const status = falta.length ? 'falta' : tipo !== 'fechado' && unitDaReferencia ? 'referencia' : 'informado';
  return { conta, esforcoC, chave: chaveOpcao(rotulo), rotulo, tipo, tipoPadrao: pad.tipo, fonte: pad.fonte, qtd, qtdSugerida, horas, unit, unitRef, unitDaReferencia, valoresFase, porFase, total, status, falta, memoria };
}

/** v018: as fontes públicas usadas nas contas de um orçamento, sem repetição (resumo e PDF). */
export function fontesDasContas(linhas: { conta?: ContaOpcao }[]): FonteConta[] {
  const vistas = new Map<string, FonteConta>();
  for (const l of linhas) for (const p of l.conta?.partes || []) for (const f of p.fontes) if (f.url && !vistas.has(f.url)) vistas.set(f.url, f);
  return [...vistas.values()];
}
