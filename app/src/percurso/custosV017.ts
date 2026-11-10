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
import { SALARIOS_ILO, FONTES_ILO, REGIOES_WB, RENDA_WB, URL_ILOSTAT, LCU_NAO_LOCAL, REDENOMINACAO, type Grupo } from './salariosPais';
import { EQUIPES_GOV, pessoasDaEquipe, PAPEIS_ESPECIALISTA, OPCOES_ESPECIALISTA, PREMIO_ESPECIALISTA, premioEspecialista, type EquipeRef, type Papel } from './equipesGov';
import { fatorInflacao, ANO_REF_SALARIO, URL_FMI_INFLACAO } from './inflacaoPais';
import { paisPorIso, nomePais } from '../domain/pais.js';
import { formatarMoedaEst, parametro, PARAMETRO_EQUIPE, PARAMETRO_FORMACAO, PARAMETRO_LICENCA, PARAMETRO_CONECTIVIDADE, PARAMETRO_DISPOSITIVO, type FrenteEstimativa } from './estimativasOrcamento';

export type TipoCusto = 'formacao' | 'pessoa' | 'licenca' | 'escola_ano' | 'escola' | 'unidade' | 'equipe' | 'trabalho' | 'time' | 'percentual' | 'fechado' | 'comp';
/** v018.1: 'gov31' = pessoal especializado da 3.1 (2 por perfil); 'plano' = pessoas das equipes do plano (formação 3.2) */
export type Fonte = 'professores' | 'estudantes' | 'escolas' | 'gov31' | 'plano' | null;
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
  // v018 (governança): equipe de referência por papel (equipesGov.ts): soma de pessoas × dedicação × meses × custo mensal do perfil
  time: { rotulo: 'Equipe de referência', horas: true, horasRotulo: 'Meses de trabalho', unit: 'Custo mensal por pessoa', dist: 'direto' },
  // v018 (governança): custos adicionais (viagens, overhead, taxa administrativa) = percentual sobre os custos diretos
  percentual: { rotulo: 'Percentual', dist: 'direto' },
  fechado: { rotulo: 'Valor por fase', dist: 'direto' },
  // v018.1 (governança, desafio 2): soma de partes (consumo de nuvem, valores informados, modelo da nuvem soberana)
  comp: { rotulo: 'Partes da opção', dist: 'direto' },
};
export const ORDEM_TIPOS: TipoCusto[] = ['fechado', 'formacao', 'pessoa', 'licenca', 'equipe', 'escola_ano', 'escola', 'unidade'];

/** Tipo padrão, de onde vem a quantidade sugerida e a referência de cada opção (pelo texto em português da opção). */
const PADROES: Record<string, [TipoCusto, Fonte, string | null]> = {
  // governança
  'Especialistas em TI (IA, dados, segurança, infraestrutura)': ['equipe', 'gov31', 'sal.eng_integracao'],
  'Profissionais jurídicos': ['equipe', 'gov31', PARAMETRO_EQUIPE],
  'Pessoal de governança de IA': ['equipe', 'gov31', PARAMETRO_EQUIPE],
  'Especialistas em IA e educação': ['equipe', 'gov31', PARAMETRO_EQUIPE],
  'Formação e desenvolvimento profissional': ['formacao', 'plano', PARAMETRO_FORMACAO],
  // v018: governança — equipe de referência por papel (equipesGov.ts, grau C) × salário do país por perfil
  'Classificação de segurança e risco de IA': ['time', null, PARAMETRO_EQUIPE],
  'Direitos e proteção de crianças': ['time', null, PARAMETRO_EQUIPE],
  'Proteção de dados pessoais e privacidade': ['time', null, PARAMETRO_EQUIPE],
  'Equidade algorítmica, não discriminação, transparência, explicabilidade e prestação de contas': ['time', null, PARAMETRO_EQUIPE],
  'Cibersegurança e notificação de incidentes': ['time', null, PARAMETRO_EQUIPE],
  'Propriedade intelectual e direitos autorais': ['time', null, PARAMETRO_EQUIPE],
  'Ambientes de teste controlados': ['time', null, PARAMETRO_EQUIPE],
  'Avaliações de risco': ['time', null, PARAMETRO_EQUIPE],
  'Diretrizes éticas de IA para a educação': ['time', null, PARAMETRO_EQUIPE],
  'Diretrizes de contratação de IA e avaliação de fornecedores': ['time', null, PARAMETRO_EQUIPE],
  'Diretrizes de uso de IA adequado à idade': ['time', null, PARAMETRO_EQUIPE],
  'Políticas de uso de IA por professores e estudantes': ['time', null, PARAMETRO_EQUIPE],
  'Padrões de gestão de riscos de IA': ['time', null, PARAMETRO_EQUIPE],
  'Padrões de transparência e documentação de IA': ['time', null, PARAMETRO_EQUIPE],
  'Padrões de governança e segurança de dados': ['time', null, PARAMETRO_EQUIPE],
  'Diretrizes de garantia de qualidade e avaliação de IA': ['time', null, PARAMETRO_EQUIPE],
  'Transferência de tecnologia': ['time', null, PARAMETRO_EQUIPE],
  'Customização local': ['time', null, PARAMETRO_EQUIPE],
  'Redução da dependência de fornecedores': ['time', null, PARAMETRO_EQUIPE],
  'Supervisão regulatória': ['time', null, PARAMETRO_EQUIPE],
  'Adoção e manutenção de código aberto': ['time', null, PARAMETRO_EQUIPE],
  'Comitês de governança': ['time', null, PARAMETRO_EQUIPE],
  'Coordenação interministerial': ['time', null, PARAMETRO_EQUIPE],
  'Estruturas institucionais de governança': ['time', null, PARAMETRO_EQUIPE],
  'Governança e proteção de dados e infraestrutura pública digital': ['time', null, PARAMETRO_EQUIPE],
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
/** v018: perfis ocupacionais (ISCO-08, grandes grupos) usados no custo de pessoal da governança. */
export const NOME_PERFIL: Record<Grupo, string> = { 1: 'diretores e gerentes (ISCO-08, grupo 1)', 2: 'profissionais das ciências e intelectuais (ISCO-08, grupo 2)', 3: 'técnicos e profissionais de nível médio (ISCO-08, grupo 3)', 4: 'trabalhadores de apoio administrativo (ISCO-08, grupo 4)' };
/** Nome do país no idioma da tela: o da base da ferramenta, ou o do navegador pelo código ISO de 2 letras. */
export function nomeDoPaisIso(iso: string): string {
  const p = paisPorIso(iso); if (p) return nomePais(p);
  const i2 = SALARIOS_ILO[iso]?.i2;
  try { return i2 ? new Intl.DisplayNames([String(LOC())], { type: 'region' }).of(i2) || iso : iso; } catch { return iso; }
}
/** Salário médio mensal do país para o perfil, na moeda do plano (moeda local quando o plano usa a moeda do país). */
export function salarioDoPais(iso: string | undefined, perfil: Grupo, moeda: string | undefined, taxa: number | null) {
  const e = iso ? SALARIOS_ILO[iso] : undefined, p = e ? e[('p' + perfil) as 'p1' | 'p2' | 'p3' | 'p4'] : null;
  if (!e || !p) return null;
  const [ano, lcu, usd, metodo, n] = p, moedaPais = paisPorIso(iso!)?.moeda;
  const viaLCU = metodo === 'd' && lcu !== null && !!moeda && moedaPais === moeda && !LCU_NAO_LOCAL.has(iso!);
  const red = REDENOMINACAO[iso!], lcuAj = lcu !== null && red && ano !== null && ano <= red.ate ? lcu / red.divisor : lcu;
  const base = viaLCU ? lcuAj as number : usd !== null && taxa !== null ? usd * taxa : null;
  if (base === null) return null;
  // v018: atualizado do ano do dado até o ano de referência pela inflação do FMI (do país, em moeda local; dos EUA, em US$)
  const inflacao = metodo === 'd' ? fatorInflacao(viaLCU ? iso : 'USA', ano) : null;
  const mensal = base * (inflacao ? inflacao.fator : 1);
  const grupo = metodo === 'r' ? t(REGIOES_WB[e.r!]) + ', ' + t(RENDA_WB[e.g!]) : t(RENDA_WB[e.g!] || '');
  return { mensal, base, inflacao, viaLCU, lcu: lcuAj, usd, ano, metodo, n: n || 0, perfil, pais: nomeDoPaisIso(iso!), fonte: e.f === null ? null : FONTES_ILO[e.f], grupo };
}
/** v018: mediana mundial do salário mensal em US$ por perfil (países com dado próprio no ILOSTAT), usada quando o país
 *  não tem dado nem estimativa regional. */
export const MEDIANA_MUNDIAL: Record<Grupo, number> = (() => {
  const med = (xs: number[]) => { const v = [...xs].sort((a, b) => a - b), m = v.length >> 1; return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; };
  const out = {} as Record<Grupo, number>;
  for (const g of [1, 2, 3, 4] as Grupo[]) out[g] = Math.round(med(Object.values(SALARIOS_ILO).map(e => e[('p' + g) as 'p1']).filter(p => p && p[3] === 'd' && typeof p[2] === 'number').map(p => p![2] as number)) * 100) / 100;
  return out;
})();
/** v018: textos da conta sobre a atualização pela inflação e o prêmio de especialista. */
export const textoInflacao = (sal: ReturnType<typeof salarioDoPais>, num: (v: number) => string) => sal && sal.inflacao
  ? t('atualizado de {de} para {ate} pela inflação ({onde}, FMI): × {f}', { de: sal.inflacao.de, ate: sal.inflacao.ate, onde: t(sal.viaLCU ? 'do país' : 'dos EUA, em US$'), f: num(Math.round(sal.inflacao.fator * 1000) / 1000) }) : '';
export const FONTE_INFLACAO: FonteConta = { titulo: 'FMI, World Economic Outlook: inflação anual ao consumidor (PCPIPCH)', url: URL_FMI_INFLACAO };
/** v018: fontes públicas citadas na explicação das contas da governança. */
export interface FonteConta { titulo: string; url: string | null }
export const FONTES_GOV: Record<'aiact' | 'noruega' | 'quenia', FonteConta> = {
  aiact: { titulo: 'Proposta do AI Act, COM(2021) 206, seção 4: de 1 a 25 servidores em tempo integral por país na supervisão', url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:52021PC0206' },
  noruega: { titulo: 'Sandbox de IA da Noruega: 4 projetos por ano, de 3 a 6 meses cada (Cambridge Forum on AI: Law and Governance)', url: 'https://www.cambridge.org/core/journals/cambridge-forum-on-ai-law-and-governance/article/from-watchdogs-to-partners-in-tech-innovation-navigating-regulatory-roles-in-norways-ai-sandbox/7E2FA0B1F75E6803B2DE4124EB0FC6CB' },
  quenia: { titulo: 'Orçamento do órgão de proteção de dados do Quênia, 2021–2025 (Open Budget Kenya)', url: 'https://openbudget.or.ke/project/1122002100_The_Office_of_the_Data_Protection_Commi/2024' },
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

/** v018.1: pessoas por perfil na 3.1 e horas por pessoa na formação 3.2 (estimativas de referência, grau C). */
export const PESSOAS_31 = 2, HORAS_FORMACAO_GOV = 20;
/** v018.1: sem equipes no plano, a formação 3.2 sugere uma turma de 20 pessoas (grau C). */
export const TURMA_FORMACAO = 20;
/** Quantidades sugeridas a partir do Contexto (e, no letramento, do número de professores e estudantes já informados). */
export function quantidadeSugerida(s: Pick<Estado14, 'ctx'>, fonte: Fonte): number | null {
  if (!fonte) return null;
  // v018.1 (governança): 3.1 com 2 pessoas por perfil; formação 3.2 com as pessoas das equipes do plano (grau C)
  if (fonte === 'gov31') return PESSOAS_31;
  if (fonte === 'plano') { const n = (s as any).__pessoasPlano; return typeof n === 'number' && n > 0 ? n : TURMA_FORMACAO; }
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
export interface CustoSalvo { tipo?: TipoCusto; qtd?: number; horas?: number; unit?: number; fases?: Record<string, number>;
  /** v018 (equipe de referência): pessoas e custo mensal informados por papel (chave = nome do papel) */
  papeis?: Record<string, { qtd?: number; unit?: number; existente?: boolean }>;
  /** v018.1: papéis que a pessoa acrescentou à equipe (entram na mesma conta dos papéis de referência) */
  papeisExtra?: PapelExtra[];
  /** v018.1 (desafio 2): quantidades e valores das partes que não são equipe (chave = id da parte) */
  q?: Record<string, number>;
  /** v018.1 (desafio 2): escolhas da opção (por exemplo, construir ou contratar a nuvem soberana) */
  escolha?: Record<string, string> }
/** v018.1: papel acrescentado pela pessoa a uma equipe. */
export interface PapelExtra { id: string; papel: string; perfil: Grupo; qtd: number; dedicacao: number; especialista?: boolean; existente?: boolean; unit?: number }
/** v018: um papel da equipe de referência, já com a quantidade, o custo mensal (com encargos) e o custo no plano. */
export interface PapelCalc extends Papel { qtdRef: number; qtdInformada: boolean; ref: number | null; unit: number | null; daRef: boolean; viaPais: boolean; salPais: boolean; custo: number | null;
  /** v018: papel com prêmio de especialista (IA, dados, segurança digital) */ especialista: boolean; /** v018: servidor que já existe (fora do desembolso novo) */ existente: boolean;
  /** v018.1: id do papel acrescentado pela pessoa (ausente nos papéis de referência) */ extra?: string }
export interface ParteConta { rotulo: string; valor: string; texto: string; fontes: FonteConta[]; /** link para a página de salários por país */ pagina?: string }
export interface ContaOpcao { formula: string; partes: ParteConta[] }
/** v018.1 (desafio 2): um campo da opção (número ou escolha), com o valor salvo e a sugestão. */
export interface EntradaD2 { id: string; rotulo: string; tipo: 'numero' | 'escolha'; valor: number | string | ''; sugestao?: string; dica?: string; opcoes?: [string, string][]; decimais?: boolean; obrigatoria?: boolean }
export interface LinhaOpcao {
  chave: string; rotulo: string; tipo: TipoCusto; tipoPadrao: TipoCusto; fonte: Fonte;
  qtd: number | null; qtdSugerida: boolean; horas: number | null; unit: number | null; unitRef: number | null; unitDaReferencia: boolean;
  valoresFase: Record<string, number | ''>;
  porFase: Record<string, number>; total: number | null;
  status: 'informado' | 'referencia' | 'falta'; falta: string[];
  /** v018: a linha usa o esforço de referência da governança (grau C) */
  esforcoC?: boolean;
  /** v018: custo sem os servidores que já existem (desembolso novo) */
  desembolso?: number | null;
  /** v018 (custos adicionais): a pessoa respondeu que este custo não se aplica */
  naoAplica?: boolean;
  /** v018: a equipe de referência da opção (governança), mesmo quando a pessoa já trocou os números */
  esforco?: EquipeRef;
  /** v018: os papéis da equipe com o custo de cada um; `continua` = operação durante todo o plano */
  time?: PapelCalc[]; continua?: boolean;
  /** v018: a referência do valor unitário é o salário do país (ILOSTAT) com encargos */
  refPais?: boolean;
  /** v018: a conta e de onde vem cada número (explicação "Como foi calculado") */
  conta?: ContaOpcao;
  /** v018.1: investimento (CapEx) e operação (OpEx) da linha; a soma dos dois é o total */
  capex?: number | null; opex?: number | null;
  /** v018.1: consumo medido de nuvem (custos de uso); total = capex + opex + uso */
  uso?: number | null;
  /** v018.1: horas por pessoa vindas da estimativa de referência */
  horasSugerida?: boolean;
  /** v018.1: parte do total que é trabalho de pessoas (base das viagens e do overhead) e a parte dela que é CapEx;
   *  ausente, vale o total inteiro */
  pessoas?: number | null; pessoasCapex?: number | null;
  /** v018.1 (desafio 2): campos da opção além da equipe (quantidades, valores e escolhas) */
  entradas?: EntradaD2[];
  memoria: string;
}
const positivo = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
/** v018.1: papéis acrescentados válidos (nome, perfil de 1 a 4, pessoas e dedicação maiores que zero). */
export function papeisExtra(salvo: CustoSalvo): PapelExtra[] {
  return (Array.isArray(salvo.papeisExtra) ? salvo.papeisExtra : []).filter(x => x && typeof x.papel === 'string' && x.papel.trim() && [1, 2, 3, 4].includes(x.perfil) && positivo(x.qtd) && positivo(x.dedicacao));
}
const naoNeg = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const centavos = (v: number) => Math.round(v * 100) / 100;
const novos = (n: number, x: FaseCalc, anterior: number) => Math.max(0, Math.round(n * x.alcance / 100) - Math.round(n * anterior / 100));

/** Custo de uma opção por fase. `taxa` = moeda do plano por US$ (4 casas), para a referência sugerida. */
export function calcularOpcao(s: Pick<Estado14, 'ctx'>, f: FrenteEstimativa, catId: string, rotulo: string, salvo: CustoSalvo, fases: FaseCalc[], taxa: number | null,
  fmt: (v: number) => string, num: (v: number) => string, moeda?: string): LinhaOpcao {
  // v018: na governança cada opção tem a forma de cálculo fixa (sem "Como calcular"); um tipo salvo antes fica guardado
  const pad = padraoOpcao(f, catId, rotulo), tipo: TipoCusto = f !== 'governanca' && salvo.tipo && TIPOS[salvo.tipo] ? salvo.tipo : pad.tipo, def = TIPOS[tipo];
  if (tipo === 'time' && EQUIPES_GOV[rotulo]) return calcularTime(s, rotulo, salvo, fases, taxa, fmt, num, moeda);
  const sug = def.qtd ? quantidadeSugerida(s, pad.fonte) : null;
  const qtd = positivo(salvo.qtd) ? salvo.qtd : (tipo === pad.tipo ? sug : null), qtdSugerida = !positivo(salvo.qtd) && qtd !== null;
  // v018.1: a formação da governança tem 20 horas por pessoa como estimativa de referência
  const horasSugerida = !positivo(salvo.horas) && f === 'governanca' && tipo === 'formacao' && pad.fonte === 'plano';
  const horas = positivo(salvo.horas) ? salvo.horas : horasSugerida ? HORAS_FORMACAO_GOV : null;
  // v018 (governança): custo de pessoal = salário médio mensal do país por ocupação (ILOSTAT) × encargos do país (SSA e
  // ISSA). Sem dado do país (ou país "outro"), vale a referência genérica, que já é custo carregado (sem encargos por cima).
  const pidRef = refDoTipo(tipo, pad), iso = (s as any).caso?.pais as string | undefined;
  // v018: na governança, todo o pessoal (inclusive "Especialistas em TI") usa o salário do país, atualizado pela inflação;
  // opções de IA, dados e segurança recebem o prêmio de especialista; sem dado do país, a mediana mundial do ILOSTAT
  const pessoalGov = f === 'governanca' && (tipo === 'equipe' || tipo === 'trabalho') && (pidRef === PARAMETRO_EQUIPE || pidRef === 'sal.eng_integracao');
  const sal = pessoalGov ? salarioDoPais(iso, 2, moeda, taxa) : null;
  const medMundial = pessoalGov && !sal && taxa !== null;
  const premio = pessoalGov && OPCOES_ESPECIALISTA.has(rotulo) ? premioEspecialista(s as any) : null;
  const fPremio = premio ? 1 + premio.pct / 100 : 1;
  const fator = sal ? fatorEncargos(iso) : 1;
  const refCarregada = !sal && !medMundial && !!pidRef && /carregado/i.test(parametro(pidRef).item);
  let unitRef: number | null;
  if (sal) unitRef = centavos(sal.mensal * fator * fPremio * (tipo === 'equipe' ? 12 : 1));
  else if (medMundial) unitRef = centavos(MEDIANA_MUNDIAL[2] * (taxa as number) * fPremio * (tipo === 'equipe' ? 12 : 1));
  else {
    const refBase = referenciaUSD(pidRef), refUSD = refBase === null ? null : (tipo === 'trabalho' ? refBase / 12 : refBase);
    unitRef = refUSD === null || taxa === null ? null : centavos(refUSD * taxa);
  }
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
        + (unitDaReferencia ? ' · ' + (sal ? t('salário do país (ILOSTAT)') : medMundial ? t('mediana mundial do ILOSTAT') : f === 'governanca' ? t('estimativa de referência, que pode variar conforme o contexto') : t('referência genérica, igual para todos os países')) : '')
        + (unitDaReferencia && premio ? ' · ' + t('com prêmio de especialista de {p}%', { p: num(premio.pct) }) : '')
        + (unitDaReferencia && fator !== 1 ? ' · ' + t('com encargos do país (× {f})', { f: num(Math.round(fator * 1000) / 1000) }) : '')
        + '';
  }
  // v018: de onde vem cada número da conta (governança)
  let conta: ContaOpcao | undefined;
  if (f === 'governanca') {
    const partes: ParteConta[] = [], voce = t('informado por você');
    if (tipo === 'fechado') partes.push({ rotulo: t('Valor total'), valor: total === null ? '—' : fmt(total), texto: total === null ? t('ainda sem valor') : voce, fontes: [] });
    else {
      if (qtd !== null) partes.push({ rotulo: t(def.qtd!), valor: num(qtd), fontes: [], texto: positivo(salvo.qtd) ? voce
        : pad.fonte === 'gov31' ? t('estimativa de referência (grau C): {n} pessoas por perfil, a dupla mínima para dar continuidade ao trabalho em férias e ausências', { n: PESSOAS_31 })
        : pad.fonte === 'plano' ? ((s as any).__pessoasPlano > 0 ? t('estimativa de referência (grau C): as pessoas das equipes de referência e do pessoal em tempo integral escolhidos no plano')
          : t('estimativa de referência (grau C): sem equipes escolhidas no plano, uma turma de {n} pessoas', { n: TURMA_FORMACAO }))
        : t('sugerido a partir do Contexto') });
      if (def.horas && horas !== null) partes.push({ rotulo: t(def.horasRotulo || 'Horas por pessoa'), valor: num(horas), fontes: [], texto: horasSugerida ? t('estimativa de referência (grau C): {n} horas por pessoa, uma formação curta', { n: HORAS_FORMACAO_GOV }) : voce });
      if (unit !== null) {
        if (!unitDaReferencia) partes.push({ rotulo: t(def.unit!), valor: fmt(unit), texto: voce, fontes: [] });
        else if (sal) {
          const usdF = (v: number) => formatarMoedaEst(v, 'USD');
          const tx = taxa === null ? '' : new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 4 }).format(taxa);
          const enc = encargosDoPais(iso), fontes: FonteConta[] = [{ titulo: t('ILOSTAT (OIT): salário médio mensal dos empregados por ocupação'), url: URL_ILOSTAT }];
          const perfil = t(NOME_PERFIL[sal.perfil]), v = sal.viaLCU ? fmt(sal.lcu as number) : usdF(sal.usd as number);
          const pedacos = [sal.metodo === 'd'
            ? t('Salário médio mensal de {perfil}, {pais}: {v} (ILOSTAT, {fonte}, {ano}; grau A)', { perfil, pais: sal.pais, v, fonte: sal.fonte || '', ano: sal.ano as number })
            : t('Salário médio mensal estimado de {perfil}: {v} (mediana de {n} países com dado no ILOSTAT: {grupo}; grau B)', { perfil, v, n: sal.n, grupo: sal.grupo })];
          if (!sal.viaLCU && tx && taxa !== 1) pedacos.push(t('× câmbio de {tx} por US$', { tx }));
          if (sal.inflacao) { pedacos.push(textoInflacao(sal, num)); fontes.push(FONTE_INFLACAO); }
          if (premio) { pedacos.push(t('× prêmio de especialista de {p}% (competências de IA, dados e segurança)', { p: num(premio.pct) })); if (!premio.informado) fontes.push(PREMIO_ESPECIALISTA.fonte); }
          if (tipo === 'equipe') pedacos.push(t('× 12 meses'));
          if (enc) { pedacos.push(t('× encargos do país {f} (contribuição patronal de {p}%, SSA e ISSA, {vol} {ano})', { f: num(Math.round(fator * 1000) / 1000), p: num(enc.taxa), vol: t(enc.volume), ano: enc.ano })); fontes.push({ titulo: t('Social Security Programs Throughout the World, SSA e ISSA ({vol} {ano}), tabela 4', { vol: t(enc.volume), ano: enc.ano }), url: enc.url }); }
          else pedacos.push(t('(sem dado de encargos para o país)'));
          partes.push({ rotulo: t(def.unit!), valor: fmt(unit), texto: pedacos.join(' '), fontes, pagina: '#/salarios/' + iso });
        } else if (medMundial) {
          const tx = taxa === null ? '' : new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 4 }).format(taxa);
          const pedacos = [t('Sem salário do país no ILOSTAT: mediana mundial do perfil 2 (países com dado próprio), {v} por mês', { v: formatarMoedaEst(MEDIANA_MUNDIAL[2], 'USD') })];
          if (tx && taxa !== 1) pedacos.push(t('× câmbio de {tx} por US$', { tx }));
          if (premio) pedacos.push(t('× prêmio de especialista de {p}% (competências de IA, dados e segurança)', { p: num(premio.pct) }));
          if (tipo === 'equipe') pedacos.push(t('× 12 meses'));
          partes.push({ rotulo: t(def.unit!), valor: fmt(unit), texto: pedacos.join(' '), fontes: [{ titulo: t('ILOSTAT (OIT): salário médio mensal dos empregados por ocupação'), url: URL_ILOSTAT }, ...(premio && !premio.informado ? [PREMIO_ESPECIALISTA.fonte] : [])] });
        } else if (f === 'governanca' && pidRef === PARAMETRO_FORMACAO) {
          const par = parametro(pidRef), tx = taxa === null ? '' : new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 4 }).format(taxa);
          partes.push({ rotulo: t(def.unit!), valor: fmt(unit), fontes: [],
            texto: t('Custo da hora de formação por participante: {v} (estimativa de referência, grau C, que pode variar conforme o contexto)', { v: formatarMoedaEst(par.valor, 'USD') }) + (tx && taxa !== 1 ? ' ' + t('× câmbio de {tx} por US$', { tx }) : '') });
        } else {
          const pid = pidRef!, par = parametro(pid), fontes: FonteConta[] = [];
          const usd = (v: number) => formatarMoedaEst(v, 'USD');
          const tx = taxa === null ? '' : new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 4 }).format(taxa);
          const pedacos = [t('{item}: {v} ({unidade}; {fonte}, grau {g})', { item: t(par.item), v: usd(par.valor), unidade: t(par.unidade), fonte: t(par.fonte), g: par.grau })];
          if (tipo === 'trabalho') pedacos.push(t('÷ 12 meses'));
          if (tx && taxa !== 1) pedacos.push(t('× câmbio de {tx} por US$', { tx }));
          if (refCarregada) pedacos.push(t('(o custo carregado já inclui os encargos)'));
          partes.push({ rotulo: t(def.unit!), valor: fmt(unit), texto: pedacos.join(' '), fontes, pagina: f === 'governanca' && pid === PARAMETRO_EQUIPE ? '#/salarios' + (iso && iso !== 'outro' ? '/' + iso : '') : undefined });
        }
      }
    }
    const formula = tipo === 'fechado' ? '' : partes.map((p, i) => i < partes.length - 1 ? p.valor + ' ' + p.rotulo.toLocaleLowerCase() : p.valor).join(' × ') + (total === null ? '' : ' = ' + fmt(total));
    conta = { formula, partes };
  }
  const status = falta.length ? 'falta' : tipo !== 'fechado' && unitDaReferencia ? 'referencia' : 'informado';
  return { refPais: !!sal, conta, chave: chaveOpcao(rotulo), rotulo, tipo, tipoPadrao: pad.tipo, fonte: pad.fonte, qtd, qtdSugerida, horas, horasSugerida, unit, unitRef, unitDaReferencia, valoresFase, porFase, total, status, falta, memoria };
}

/** v018 (governança): custo da equipe de referência da opção. Cada papel custa pessoas × dedicação × meses × custo mensal
 *  do perfil; o custo mensal é o salário médio do país para o grande grupo da ISCO-08 (ILOSTAT) × encargos do país (SSA e
 *  ISSA). Sem dado do país, vale a referência genérica de custo carregado (já com encargos). Trabalho pontual ocupa as
 *  primeiras fases até somar os meses; operação contínua dura todo o plano. Pessoas e custo mensal podem ser trocados por papel. */
export function calcularTime(s: Pick<Estado14, 'ctx'>, rotulo: string, salvo: CustoSalvo, fases: FaseCalc[], taxa: number | null,
  fmt: (v: number) => string, num: (v: number) => string, moeda?: string): LinhaOpcao {
  const eq = EQUIPES_GOV[rotulo], iso = (s as any).caso?.pais as string | undefined, continua = !eq.meses;
  const duracao = fases.reduce((n, x) => n + x.meses, 0);
  const meses = continua ? (duracao || null) : positivo(salvo.horas) ? salvo.horas : eq.meses!;
  const fator = fatorEncargos(iso), premio = premioEspecialista(s as any), fPrem = 1 + premio.pct / 100;
  // sem salário do país: mediana mundial do ILOSTAT do perfil, em US$ × câmbio (sem encargos, que dependem do país)
  const refMundial = (g: Grupo) => taxa === null ? null : MEDIANA_MUNDIAL[g] * taxa;
  const sals = new Map<Grupo, ReturnType<typeof salarioDoPais>>();
  const salDe = (g: Grupo) => { if (!sals.has(g)) sals.set(g, salarioDoPais(iso, g, moeda, taxa)); return sals.get(g)!; };
  const time: PapelCalc[] = eq.papeis.map(p => {
    const sv = salvo.papeis?.[p.papel] || {}, qtdInformada = naoNeg(sv.qtd), qtd = qtdInformada ? sv.qtd as number : p.qtd;
    const sal = salDe(p.perfil), especialista = PAPEIS_ESPECIALISTA.has(p.papel), base = sal ? sal.mensal * fator : refMundial(p.perfil);
    const ref = base === null ? null : centavos(base * (especialista ? fPrem : 1));
    const unit = positivo(sv.unit) ? sv.unit : ref, daRef = !positivo(sv.unit) && ref !== null;
    const custo = unit === null || meses === null ? null : centavos(qtd * p.dedicacao * meses * unit);
    return { ...p, qtd, qtdRef: p.qtd, qtdInformada, ref, unit, daRef, viaPais: daRef && !!sal, salPais: !!sal, custo, especialista, existente: sv.existente === true };
  });
  // v018.1: papéis acrescentados pela pessoa, com a mesma conta (salário do país do perfil, encargos e prêmio, se marcado)
  for (const x of papeisExtra(salvo)) {
    const sal = salDe(x.perfil), especialista = x.especialista === true, base = sal ? sal.mensal * fator : refMundial(x.perfil);
    const ref = base === null ? null : centavos(base * (especialista ? fPrem : 1));
    const unit = positivo(x.unit) ? x.unit : ref, daRef = !positivo(x.unit) && ref !== null;
    const custo = unit === null || meses === null ? null : centavos(x.qtd * x.dedicacao * meses * unit);
    time.push({ papel: x.papel, perfil: x.perfil, qtd: x.qtd, dedicacao: x.dedicacao, faz: '', qtdRef: 0, qtdInformada: true, ref, unit, daRef, viaPais: daRef && !!sal, salPais: !!sal, custo, especialista, existente: x.existente === true, extra: x.id });
  }
  const falta: string[] = [];
  if (!fases.length) falta.push(t('as fases do plano'));
  if (meses === null) falta.push(t('meses de trabalho'));
  if (time.some(p => p.unit === null)) falta.push(t('custo mensal por pessoa'));
  const mensal = time.reduce((n, p) => n + (p.unit === null ? 0 : p.qtd * p.dedicacao * p.unit), 0);
  const porFase: Record<string, number> = {};
  let total: number | null = null, memoria = '';
  const pessoas = time.reduce((n, p) => n + p.qtd, 0), integral = Math.round(time.reduce((n, p) => n + p.qtd * p.dedicacao, 0) * 100) / 100;
  if (!falta.length) {
    let resta = meses as number;
    fases.forEach((x, i) => {
      const m = continua ? x.meses : i === fases.length - 1 ? resta : Math.min(resta, x.meses);
      if (!continua) resta = Math.max(0, resta - m);
      porFase[x.id] = centavos(mensal * m);
    });
    total = centavos(Object.values(porFase).reduce((a, b) => a + b, 0));
    memoria = t('equipe de {n} pessoas ({e} em tempo integral) × {m} meses', { n: num(pessoas), e: num(integral), m: num(meses as number) })
      + (time.some(p => p.viaPais) ? ' · ' + t('custo mensal de cada perfil: salário do país (ILOSTAT)') : time.some(p => p.daRef) ? ' · ' + t('mediana mundial do ILOSTAT') : '')
      + (time.some(p => p.especialista && p.daRef) ? ' · ' + t('com prêmio de especialista de {p}%', { p: num(premio.pct) }) : '')
      + (time.some(p => p.viaPais) && fator !== 1 ? ' · ' + t('com encargos do país (× {f})', { f: num(Math.round(fator * 1000) / 1000) }) : '')
      + ' · ' + t('equipe de referência (grau C)');
  }
  const esforcoC = (!continua && !positivo(salvo.horas)) || time.some(p => !p.qtdInformada);
  // a conta: meses, cada papel (com o que faz), o salário de cada perfil e os encargos
  const partes: ParteConta[] = [], voce = t('informado por você'), pagEsf = '#/esforcos/' + chaveOpcao(rotulo);
  const fonteEq = eq.base ? [FONTES_GOV[eq.base]] : [];
  if (meses !== null) partes.push({ rotulo: continua ? t('Duração do plano') : t('Meses de trabalho'), valor: num(meses), fontes: !continua && !positivo(salvo.horas) ? fonteEq : [],
    texto: continua ? t('operação contínua: a equipe trabalha durante todo o plano.') + ' ' + t(eq.porque) : positivo(salvo.horas) ? voce : t('equipe de referência (grau C): estimativa da ferramenta, que pode variar conforme o contexto.') + ' ' + t(eq.porque),
    pagina: pagEsf });
  if (continua && eq.base) partes[partes.length - 1].fontes = fonteEq;
  for (const p of time) {
    const pct = Math.round(p.dedicacao * 100);
    const quem = t(p.qtd === 1 ? '{q} pessoa, {d}% do tempo' : '{q} pessoas, {d}% do tempo cada', { q: num(p.qtd), d: pct }) + (p.qtdInformada && !p.extra ? ' (' + voce + ')' : '');
    const custoMes = p.unit === null ? '' : ' · ' + t('{v} por mês por pessoa', { v: fmt(p.unit) }) + (p.daRef ? '' : ' (' + voce + ')');
    partes.push({ rotulo: p.extra ? p.papel : t(p.papel), valor: p.custo === null ? '—' : fmt(p.custo), fontes: [],
      texto: quem + ' · ' + t(NOME_PERFIL[p.perfil]) + custoMes + (p.especialista && p.daRef ? ' · ' + t('com prêmio de especialista') : '') + (p.existente ? ' · ' + t('servidor que já existe') : '') + (p.extra ? ' · ' + t('papel acrescentado por você') : '') + '.' + (p.faz ? ' ' + t(p.faz) : '') });
  }
  const usdF = (v: number) => formatarMoedaEst(v, 'USD');
  const tx = taxa === null ? '' : new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 4 }).format(taxa);
  const perfis = [...new Set(time.filter(p => p.daRef).map(p => p.perfil))].sort();
  let usouGenerica = false;
  const comSal = perfis.filter(g => salDe(g));
  if (perfis.length > comSal.length) usouGenerica = true;
  comSal.forEach((g, i) => {
    const sal = salDe(g)!, perfil = t(NOME_PERFIL[g]);
    const txt = (sal.metodo === 'd'
      ? t('{pais}: ILOSTAT, {fonte}, {ano}; grau A', { pais: sal.pais, fonte: sal.fonte || '', ano: sal.ano as number })
      : t('estimado: mediana de {n} países com dado no ILOSTAT ({grupo}); grau B', { n: sal.n, grupo: sal.grupo }))
      + (!sal.viaLCU ? ' · ' + usdF(sal.usd as number) + (tx && taxa !== 1 ? ' ' + t('× câmbio de {tx} por US$', { tx }) : '') : '')
      + (sal.inflacao ? ' · ' + textoInflacao(sal, num) : '');
    partes.push({ rotulo: t('Salário mensal: {perfil}', { perfil }), valor: fmt(sal.mensal), texto: txt,
      fontes: i === 0 ? [{ titulo: t('ILOSTAT (OIT): salário médio mensal dos empregados por ocupação'), url: URL_ILOSTAT }, ...(comSal.some(g => salDe(g)!.inflacao) ? [FONTE_INFLACAO] : [])] : [], pagina: i === comSal.length - 1 ? '#/salarios/' + iso : undefined });
  });
  if (perfis.some(g => salDe(g))) {
    const enc = encargosDoPais(iso);
    partes.push(enc
      ? { rotulo: t('Encargos do país'), valor: '× ' + num(Math.round(fator * 1000) / 1000), texto: t('contribuição patronal de {p}% sobre o salário (SSA e ISSA, {vol} {ano})', { p: num(enc.taxa), vol: t(enc.volume), ano: enc.ano }),
          fontes: [{ titulo: t('Social Security Programs Throughout the World, SSA e ISSA ({vol} {ano}), tabela 4', { vol: t(enc.volume), ano: enc.ano }), url: enc.url }] }
      : { rotulo: t('Encargos do país'), valor: '—', texto: t('(sem dado de encargos para o país)'), fontes: [] });
  }
  if (usouGenerica && taxa !== null) {
    partes.push({ rotulo: t('Salário mensal sem dado do país'), valor: perfis.filter(g => !salDe(g)).map(g => 'G' + g + ' ' + fmt(refMundial(g) as number)).join(' · '),
      texto: t('mediana mundial do ILOSTAT por perfil (países com dado próprio), em US$') + (tx && taxa !== 1 ? ' ' + t('× câmbio de {tx} por US$', { tx }) : ''),
      fontes: [{ titulo: t('ILOSTAT (OIT): salário médio mensal dos empregados por ocupação'), url: URL_ILOSTAT }], pagina: '#/salarios' + (iso && iso !== 'outro' ? '/' + iso : '') });
  }
  if (time.some(p => p.especialista && p.daRef)) partes.push({ rotulo: t('Prêmio de especialista'), valor: '+' + num(premio.pct) + '%',
    texto: (premio.informado ? t('informado por você') + '. ' : '') + t('Aplicado aos papéis que exigem competências de IA, dados ou segurança digital, que o mercado paga acima da média do grupo ocupacional.'),
    fontes: premio.informado ? [] : [PREMIO_ESPECIALISTA.fonte, PREMIO_ESPECIALISTA.comparacao] });
  const formula = total === null ? '' : t('Soma dos papéis: pessoas × dedicação × {m} meses × custo mensal do perfil', { m: num(meses as number) }) + ' = ' + fmt(total);
  const unitDaReferencia = time.some(p => p.daRef);
  const status = falta.length ? 'falta' : unitDaReferencia ? 'referencia' : 'informado';
  const valoresFase: Record<string, number | ''> = {}; for (const x of fases) valoresFase[x.id] = '';
  const desembolso = total === null ? null : centavos(total - time.filter(p => p.existente).reduce((n, p) => n + (p.custo || 0), 0));
  return { desembolso, refPais: time.some(p => p.viaPais), esforco: eq, time, continua, conta: { formula, partes }, esforcoC, chave: chaveOpcao(rotulo), rotulo, tipo: 'time', tipoPadrao: 'time', fonte: null,
    qtd: pessoasDaEquipe({ ...eq, papeis: time }), qtdSugerida: false, horas: meses, unit: null, unitRef: null, unitDaReferencia, valoresFase, porFase, total, status, falta, memoria };
}

/** v018.1: custo mensal de uma pessoa do perfil (salário do país atualizado, encargos e, se pedido, prêmio de especialista),
 *  na moeda do plano; sem dado do país, a mediana mundial do ILOSTAT. Usado nas partes do desafio 2 que contam pessoas. */
export function custoMensalPerfil(s: Pick<Estado14, 'ctx'>, perfil: Grupo, especialista: boolean, taxa: number | null, moeda: string | undefined,
  num: (v: number) => string): { valor: number; texto: string; fontes: FonteConta[] } | null {
  const iso = (s as any).caso?.pais as string | undefined, sal = salarioDoPais(iso, perfil, moeda, taxa), fator = fatorEncargos(iso);
  const premio = premioEspecialista(s as any), fP = especialista ? 1 + premio.pct / 100 : 1;
  const fontes: FonteConta[] = [{ titulo: t('ILOSTAT (OIT): salário médio mensal dos empregados por ocupação'), url: URL_ILOSTAT }];
  if (especialista) fontes.push(PREMIO_ESPECIALISTA.fonte);
  if (sal) {
    const enc = encargosDoPais(iso);
    if (sal.inflacao) fontes.push(FONTE_INFLACAO);
    const txt = t(NOME_PERFIL[perfil]) + ', ' + sal.pais + (sal.inflacao ? ' · ' + textoInflacao(sal, num) : '')
      + (enc ? ' · ' + t('× encargos do país {f}', { f: num(Math.round(fator * 1000) / 1000) }) : '') + (especialista ? ' · ' + t('com prêmio de especialista') : '');
    return { valor: centavos(sal.mensal * fator * fP), texto: txt, fontes };
  }
  if (taxa === null) return null;
  return { valor: centavos(MEDIANA_MUNDIAL[perfil] * taxa * fP), texto: t(NOME_PERFIL[perfil]) + ' · ' + t('mediana mundial do ILOSTAT') + (especialista ? ' · ' + t('com prêmio de especialista') : ''), fontes };
}

/** v018: as fontes públicas usadas nas contas de um orçamento, sem repetição (resumo e PDF). */
export function fontesDasContas(linhas: { conta?: ContaOpcao }[]): FonteConta[] {
  const vistas = new Map<string, FonteConta>();
  for (const l of linhas) for (const p of l.conta?.partes || []) for (const f of p.fontes) if (f.url && !vistas.has(f.url)) vistas.set(f.url, f);
  return [...vistas.values()];
}
