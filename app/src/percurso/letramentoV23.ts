// v022.1 (Educando sobre a IA, etapa 4): cada opção tem uma conta só, sem "Como calcular". A conta é a soma de parcelas;
// cada parcela é um produto de fatores com valor sugerido (que a pessoa pode trocar) e se distribui pelas fases de um
// jeito fixo:
//   inicio   tudo na primeira fase (criação, desenho, implantação)
//   novos    na proporção das pessoas ou escolas novas da fase (alcance da fase − alcance da fase anterior)
//   alcance  valor mensal no alcance total × alcance da fase × meses da fase (licenças, apoio, mentoria)
//   mes      valor mensal × meses da fase (equipes fixas)
//   ano      valor anual × meses da fase ÷ 12 (contratos e eventos por ano)
// A escala vem da 1.1 (professores, cursos, horas e reciclagem), que não tem custo próprio, e do Contexto (estudantes e
// escolas). Pessoas custam o salário do país (ILOSTAT) com encargos; serviços locais são preços de referência em US$ dos
// EUA × nível de preços do país (Banco Mundial); a formação usa o cálculo por componentes da governança (3.2).
import type { Estado14 } from '../store/tipos';
import { t } from './textos';
import { LOC } from '../domain';
import { lerLit } from './letramento';
import { custoMensalPerfil, quantidadeSugerida, chaveOpcao, type CustoSalvo, type FaseCalc, type LinhaOpcao, type ParteConta, type EntradaD2, type FonteConta } from './custosV017';
import { custoFormacao, nivelPrecos, matriculasMil, FONTES_FORMACAO, FORMACAO_GOV } from './formacaoGov';

// ---------------------------------------------------------------- público (Contexto, dados do país ou convenção)
/** Estudantes por escola e por professor quando a rede não informou (estimativas de referência, grau C). */
export const ESTUDANTES_POR_ESCOLA = 400, ESTUDANTES_POR_PROFESSOR = 25, ESTUDANTES_PADRAO = 1000000;
export function estudantesLit(s: Estado): { v: number; origem: string } {
  const informado = quantidadeSugerida(s, 'estudantes');
  if (informado) return { v: informado, origem: 'informado no Contexto' };
  const mil = matriculasMil((s as any).caso?.pais);
  return mil ? { v: Math.round(mil * 1000), origem: 'matrículas do país no ensino primário e secundário (Banco Mundial, grau A)' }
    : { v: ESTUDANTES_PADRAO, origem: 'sem dado do país: 1 milhão de estudantes (convenção, grau C)' };
}
export function escolasLit(s: Estado): { v: number; origem: string } {
  const informado = quantidadeSugerida(s, 'escolas');
  return informado ? { v: informado, origem: 'informado no Contexto' } : { v: Math.max(1, Math.round(estudantesLit(s).v / ESTUDANTES_POR_ESCOLA)), origem: 'estudantes ÷ 400 por escola (estimativa de referência, grau C)' };
}

type Estado = Pick<Estado14, 'ctx'>;
type Classe = 'capex' | 'opex' | 'uso';
type Dist = 'inicio' | 'novos' | 'alcance' | 'mes' | 'ano';

// ---------------------------------------------------------------- escala (1.1)
/** Campos da 1.1: guardados em ctx.letramento; vazios, valem as sugestões. */
export interface ParametroLit { campo: string; rotulo: string; sug: (s: Estado) => number | null; dica: string; decimais?: boolean }
const posNum = (v: any): number | null => { const x = v && typeof v === 'object' ? v.valor : v; return typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : null; };
const naoNegNum = (v: any): number | null => { const x = v && typeof v === 'object' ? v.valor : v; return typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : null; };
export const PARAM_LIT = {
  professores: { campo: 'publicos.A11.participantes', rotulo: 'Professores a formar', sug: (s: Estado) => Math.max(1, Math.round(estudantesLit(s).v / ESTUDANTES_POR_PROFESSOR)), dica: 'Vazio = estudantes da rede ÷ 25 (estimativa de referência, grau C).' },
  cursos: { campo: 'publicos.A11.cursos', rotulo: 'Cursos por professor', sug: () => 1, dica: 'Vazio = 1 curso.' },
  horas: { campo: 'publicos.A11.horas', rotulo: 'Horas por curso', sug: () => 30, dica: 'Vazio = 30 horas (estimativa de referência, grau C).', decimais: true },
  reciclagem: { campo: 'orcamento.parametros.reciclagem', rotulo: 'Reciclagens por ano', sug: () => 1, dica: 'Vazio = 1 por ano.', decimais: true },
  horasReciclagem: { campo: 'orcamento.parametros.horasReciclagem', rotulo: 'Horas por reciclagem', sug: () => 8, dica: 'Vazio = 8 horas (estimativa de referência, grau C).', decimais: true },
} satisfies Record<string, ParametroLit>;
/** Opções da 1.1 e os campos que cada uma abre. */
export const OPCOES_ESCALA_LIT: Record<string, ParametroLit[]> = {
  'Número de professores e de cursos': [PARAM_LIT.professores, PARAM_LIT.cursos],
  'Horas, duração e calendário da formação': [PARAM_LIT.horas],
  'Frequência de oferta e de reciclagem': [PARAM_LIT.reciclagem, PARAM_LIT.horasReciclagem],
};
export const ehEscalaLit = (rotulo: string) => Object.hasOwn(OPCOES_ESCALA_LIT, rotulo);
/** Valor de um parâmetro da 1.1 (o informado ou a sugestão). */
export function valorParametroLit(s: Estado, p: ParametroLit): { v: number | null; informado: boolean } {
  const x = p === PARAM_LIT.reciclagem ? naoNegNum(lerLit(s, p.campo)) : posNum(lerLit(s, p.campo));
  return x !== null ? { v: x, informado: true } : { v: p.sug(s), informado: false };
}

// ---------------------------------------------------------------- definições das opções
interface Fator { id: string; rotulo: string; sug: number; dica?: string; decimais?: boolean; /** preço em US$ dos EUA, levado ao país */ usd?: boolean; /** custo mensal do perfil ILOSTAT */ salario?: 2 | 3 }
interface Escala { id: 'professores' | 'estudantes' | 'escolas' | 'turmasProf' | 'turmasEst' | 'formadores' | 'mentores' | 'anos' | 'cursosHoras' | 'reciclagemHoras'; rotulo: string }
interface Parcela { rotulo: string; classe: Classe; dist: Dist; escala?: Escala['id']; fatores: Fator[]; pessoas?: boolean; texto?: string }
interface DefLit { parcelas?: Parcela[]; formacao?: { pessoas: Escala['id']; horas: Escala['id'] | number; presencial: number } }

const F = {
  esp: (meses: number, pessoas: number, ded = 1): Fator[] => [
    { id: 'pessoas', rotulo: 'Pessoas', sug: pessoas, decimais: true }, { id: 'dedicacao', rotulo: 'Dedicação (%)', sug: ded * 100, decimais: true },
    { id: 'meses', rotulo: 'Meses de trabalho', sug: meses, decimais: true }, { id: 'custoMensal', rotulo: 'Custo mensal por pessoa', sug: 0, salario: 2 }],
  evento: (n: number, usd: number): Fator[] => [{ id: 'eventos', rotulo: 'Eventos', sug: n }, { id: 'custoEvento', rotulo: 'Custo por evento', sug: usd, usd: true, dica: 'preço de referência em US$ dos EUA × nível de preços do país (grau C)' }],
};
const equipe = (rotulo: string, meses: number, pessoas: number, ded = 1): Parcela => ({ rotulo, classe: 'opex', dist: 'inicio', fatores: F.esp(meses, pessoas, ded), pessoas: true });
const preco = (id: string, rotulo: string, usd: number): Fator => ({ id, rotulo, sug: usd, usd: true, decimais: true, dica: 'preço de referência em US$ dos EUA × nível de preços do país (grau C)' });

export const OPCOES_LIT: Record<string, DefLit> = {
  // 1.2 entrega e implementação
  'Formação presencial, online ou híbrida': { formacao: { pessoas: 'professores', horas: 'cursosHoras', presencial: 50 } },
  'Formação de formadores': { formacao: { pessoas: 'formadores', horas: 40, presencial: 50 } },
  'Aprendizagem profissional na escola': { parcelas: [{ rotulo: 'Coordenação na escola', classe: 'opex', dist: 'alcance', escala: 'escolas', pessoas: true,
    fatores: [{ id: 'horasMes', rotulo: 'Horas de coordenação por escola por mês', sug: 4, decimais: true }, { id: 'custoHora', rotulo: 'Custo por hora do coordenador', sug: 0, salario: 2 }] }] },
  // 1.3 recursos e plataformas
  'Plataformas digitais de formação': { parcelas: [
    { rotulo: 'Implantação da plataforma', classe: 'capex', dist: 'inicio', fatores: [preco('custoImplantacao', 'Custo de implantação', 50000)] },
    { rotulo: 'Licenças', classe: 'opex', dist: 'alcance', escala: 'professores', fatores: [preco('custoLicenca', 'Preço por professor por mês', 2)] }] },
  'Ferramentas e licenças de IA para a formação': { parcelas: [
    { rotulo: 'Licenças de IA', classe: 'opex', dist: 'novos', escala: 'professores', fatores: [preco('custoLicenca', 'Preço por professor por mês', 10), { id: 'meses', rotulo: 'Meses de acesso por professor', sug: 3, decimais: true }] },
    { rotulo: 'Uso medido de IA', classe: 'uso', dist: 'novos', escala: 'professores', fatores: [preco('custoUso', 'Uso de IA por professor por mês', 1), { id: 'mesesUso', rotulo: 'Meses de uso por professor', sug: 3, decimais: true }] }] },
  'Materiais e ambientes práticos de IA': { parcelas: [{ rotulo: 'Kits por turma', classe: 'capex', dist: 'novos', escala: 'turmasProf', fatores: [preco('custoKit', 'Custo do kit por turma', 300)] }] },
  // 1.4 avaliação e certificação
  'Avaliações de competências em IA': { parcelas: [equipe('Desenho do instrumento', 3, 2),
    { rotulo: 'Aplicação', classe: 'opex', dist: 'novos', escala: 'professores', fatores: [preco('custoAplicacao', 'Custo por professor avaliado', 5)] }] },
  'Certificação profissional': { parcelas: [{ rotulo: 'Certificação', classe: 'opex', dist: 'novos', escala: 'professores', fatores: [preco('custoCertificado', 'Custo por professor certificado', 20)] }] },
  'Credenciais digitais': { parcelas: [{ rotulo: 'Credenciais', classe: 'opex', dist: 'novos', escala: 'professores', fatores: [preco('custoCredencial', 'Custo por credencial', 2)] }] },
  // 1.5 desenvolvimento contínuo
  'Cursos de reciclagem e comunidades de aprendizagem': { formacao: { pessoas: 'professores', horas: 'reciclagemHoras', presencial: 0 } },
  'Mentoria e coaching': { parcelas: [{ rotulo: 'Mentores', classe: 'opex', dist: 'alcance', escala: 'mentores', pessoas: true,
    fatores: [{ id: 'dedicacao', rotulo: 'Dedicação do mentor (%)', sug: 25, decimais: true }, { id: 'custoMensal', rotulo: 'Custo mensal por pessoa', sug: 0, salario: 2 }] }] },
  'Apoio técnico e pedagógico': { parcelas: [{ rotulo: 'Equipe de apoio', classe: 'opex', dist: 'alcance', escala: 'escolas', pessoas: true,
    fatores: [{ id: 'fte', rotulo: 'Pessoas de apoio por 100 escolas', sug: 1, decimais: true, dica: 'estimativa de referência (grau C)' }, { id: 'custoMensal', rotulo: 'Custo mensal por pessoa', sug: 0, salario: 3 }], texto: 'escolas ÷ 100' }] },
  // 2.1 recursos de aprendizagem
  'Materiais adequados à idade': { parcelas: [{ rotulo: 'Desenvolvimento', classe: 'opex', dist: 'inicio', pessoas: true, fatores: [
    { id: 'series', rotulo: 'Séries atendidas', sug: 9 }, { id: 'horasSerie', rotulo: 'Horas de atividade por série', sug: 10, decimais: true },
    { id: 'horasDev', rotulo: 'Horas de desenvolvimento por hora de atividade', sug: 28, decimais: true, dica: 'ATD (2017): 28 horas por hora de conteúdo online' }, { id: 'custoHora', rotulo: 'Custo por hora do especialista', sug: 0, salario: 2 }] }] },
  'Atividades interativas de aprendizagem de IA': { parcelas: [{ rotulo: 'Desenvolvimento', classe: 'opex', dist: 'inicio', pessoas: true, fatores: [
    { id: 'atividades', rotulo: 'Atividades', sug: 20 }, { id: 'horasAtividade', rotulo: 'Horas de desenvolvimento por atividade', sug: 40, decimais: true }, { id: 'custoHora', rotulo: 'Custo por hora do especialista', sug: 0, salario: 2 }] }] },
  'Recursos educacionais abertos': { parcelas: [{ rotulo: 'Seleção e adaptação', classe: 'opex', dist: 'inicio', pessoas: true, fatores: [
    { id: 'recursos', rotulo: 'Recursos adaptados', sug: 20 }, { id: 'horasRecurso', rotulo: 'Horas por recurso', sug: 8, decimais: true }, { id: 'custoHora', rotulo: 'Custo por hora do especialista', sug: 0, salario: 2 }] }] },
  'Materiais multilíngues e acessíveis': { parcelas: [{ rotulo: 'Tradução e versão acessível', classe: 'opex', dist: 'inicio', pessoas: true, fatores: [
    { id: 'linguas', rotulo: 'Línguas ou versões adicionais', sug: 1 }, { id: 'series', rotulo: 'Séries atendidas', sug: 9 }, { id: 'horasSerie', rotulo: 'Horas por série e língua', sug: 40, decimais: true },
    { id: 'custoHora', rotulo: 'Custo por hora do especialista', sug: 0, salario: 2 }] }] },
  // 2.2 ferramentas e ambientes
  'Plataformas de aprendizagem de IA': { parcelas: [
    { rotulo: 'Implantação da plataforma', classe: 'capex', dist: 'inicio', fatores: [preco('custoImplantacao', 'Custo de implantação', 50000)] },
    { rotulo: 'Licenças', classe: 'opex', dist: 'alcance', escala: 'estudantes', fatores: [{ id: 'pct13', rotulo: 'Estudantes com 13 anos ou mais (%)', sug: 40, decimais: true, dica: 'abaixo de 13 anos, sem licença' }, preco('custoLicenca', 'Preço por estudante por mês', 0.5)] }] },
  'Softwares e licenças educacionais de IA': { parcelas: [
    { rotulo: 'Licenças de IA', classe: 'opex', dist: 'alcance', escala: 'estudantes', fatores: [{ id: 'pct13', rotulo: 'Estudantes com 13 anos ou mais (%)', sug: 40, decimais: true, dica: 'abaixo de 13 anos, sem licença' }, preco('custoLicenca', 'Preço por estudante por mês', 2)] },
    { rotulo: 'Uso medido de IA', classe: 'uso', dist: 'alcance', escala: 'estudantes', fatores: [{ id: 'pct13', rotulo: 'Estudantes com 13 anos ou mais (%)', sug: 40, decimais: true }, preco('custoUso', 'Uso de IA por estudante por mês', 0.3)] }] },
  'Ferramentas de experimentação prática': { parcelas: [{ rotulo: 'Kits por escola', classe: 'capex', dist: 'novos', escala: 'escolas', fatores: [preco('custoKit', 'Custo do kit por escola', 500)] }] },
  'Recursos offline e desplugados': { parcelas: [{ rotulo: 'Kits desplugados por turma', classe: 'capex', dist: 'novos', escala: 'turmasEst', fatores: [preco('custoKit', 'Custo do kit por turma', 20)] }] },
  // 2.3 engajamento e avaliação
  'Campanhas de conscientização sobre IA': { parcelas: [{ rotulo: 'Contrato da campanha', classe: 'opex', dist: 'ano', fatores: [preco('custoAno', 'Custo da campanha por ano', 100000)] }] },
  'Clubes de IA e atividades extracurriculares': { parcelas: [{ rotulo: 'Facilitadores dos clubes', classe: 'opex', dist: 'alcance', escala: 'escolas', pessoas: true, fatores: [
    { id: 'pctEscolas', rotulo: 'Escolas com clube (%)', sug: 20, decimais: true }, { id: 'horasMes', rotulo: 'Horas do facilitador por mês', sug: 8, decimais: true }, { id: 'custoHora', rotulo: 'Custo por hora do facilitador', sug: 0, salario: 2 }] }] },
  'Oficinas e competições': { parcelas: [{ rotulo: 'Eventos', classe: 'opex', dist: 'ano', fatores: [{ id: 'eventosAno', rotulo: 'Eventos por ano', sug: 4, decimais: true }, preco('custoEvento', 'Custo por evento', 10000)] }] },
  'Avaliações de letramento em IA': { parcelas: [equipe('Desenho da avaliação', 3, 2),
    { rotulo: 'Aplicação', classe: 'opex', dist: 'novos', escala: 'estudantes', fatores: [preco('custoAplicacao', 'Custo por estudante avaliado', 1)] }] },
  // 3.1 desenho curricular (equipes, como as normas da governança)
  'Marcos nacionais de currículo de IA': { parcelas: [equipe('Equipe de redação', 6, 3)] },
  'Objetivos de aprendizagem por série': { parcelas: [equipe('Equipe de redação', 4, 2)] },
  'Modelos de progressão de competências': { parcelas: [equipe('Equipe de redação', 3, 2)] },
  'Integração entre disciplinas': { parcelas: [equipe('Equipe de redação', 3, 2)] },
  'Consultas às partes interessadas': { parcelas: [equipe('Coordenação das consultas', 3, 1), { rotulo: 'Encontros regionais', classe: 'opex', dist: 'inicio', fatores: F.evento(5, 5000) }] },
  // 3.2 conteúdo e materiais
  'Livros didáticos e guias do professor': { parcelas: [
    { rotulo: 'Produção dos títulos', classe: 'opex', dist: 'inicio', fatores: [{ id: 'titulos', rotulo: 'Títulos (um por série)', sug: 9 }, preco('custoTitulo', 'Custo de produção por título', 20000)] },
    { rotulo: 'Impressão', classe: 'capex', dist: 'novos', escala: 'estudantes', fatores: [preco('custoExemplar', 'Custo por exemplar impresso', 3)] }] },
  'Recursos curriculares digitais': { parcelas: [{ rotulo: 'Desenvolvimento', classe: 'opex', dist: 'inicio', pessoas: true, fatores: [
    { id: 'titulos', rotulo: 'Títulos (um por série)', sug: 9 }, { id: 'horasTitulo', rotulo: 'Horas de desenvolvimento por título', sug: 200, decimais: true }, { id: 'custoHora', rotulo: 'Custo por hora do especialista', sug: 0, salario: 2 }] }] },
  'Contextualização e localização': { parcelas: [{ rotulo: 'Adaptação local', classe: 'opex', dist: 'inicio', pessoas: true, fatores: [
    { id: 'versoes', rotulo: 'Versões regionais ou línguas', sug: 2 }, { id: 'titulos', rotulo: 'Títulos (um por série)', sug: 9 }, { id: 'horasTitulo', rotulo: 'Horas por título e versão', sug: 40, decimais: true },
    { id: 'custoHora', rotulo: 'Custo por hora do especialista', sug: 0, salario: 2 }] }] },
  // 3.3 implementação, expansão e manutenção
  'Pilotos do currículo': { parcelas: [
    { rotulo: 'Escolas piloto', classe: 'opex', dist: 'inicio', fatores: [{ id: 'escolasPiloto', rotulo: 'Escolas piloto', sug: 20 }, preco('custoEscola', 'Custo por escola piloto', 2000)] },
    equipe('Avaliação do piloto', 6, 1)] },
  'Implementação nacional em etapas': { parcelas: [{ rotulo: 'Equipe central', classe: 'opex', dist: 'mes', pessoas: true, fatores: [
    { id: 'pessoas', rotulo: 'Pessoas', sug: 3, decimais: true }, { id: 'custoMensal', rotulo: 'Custo mensal por pessoa', sug: 0, salario: 2 }] }] },
  'Apoio à implementação nas escolas': { parcelas: [{ rotulo: 'Apoio nas escolas', classe: 'opex', dist: 'alcance', escala: 'escolas', pessoas: true, fatores: [
    { id: 'horasMes', rotulo: 'Horas de apoio por escola por mês', sug: 2, decimais: true }, { id: 'custoHora', rotulo: 'Custo por hora do técnico', sug: 0, salario: 3 }] }] },
  'Disseminação do currículo': { parcelas: [{ rotulo: 'Eventos de disseminação', classe: 'opex', dist: 'novos', fatores: F.evento(10, 5000) }] },
  'Frequência de atualização do currículo': { parcelas: [{ rotulo: 'Revisões', classe: 'opex', dist: 'mes', pessoas: true, fatores: [
    { id: 'cicloAnos', rotulo: 'Uma revisão a cada (anos)', sug: 3, decimais: true }, { id: 'pessoas', rotulo: 'Pessoas por revisão', sug: 2, decimais: true },
    { id: 'meses', rotulo: 'Meses por revisão', sug: 2, decimais: true }, { id: 'custoMensal', rotulo: 'Custo mensal por pessoa', sug: 0, salario: 2 }] }] },
};
/** A mesma opção existe em 2.1 e 3.2 ("Recursos educacionais abertos"): a conta é a mesma. */
export const temContaLit = (rotulo: string) => Object.hasOwn(OPCOES_LIT, rotulo);

// ---------------------------------------------------------------- cálculo
const cent = (v: number) => Math.round(v * 100) / 100;
const pos = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
const ROT_ESCALA: Record<Escala['id'], string> = {
  professores: 'professores a formar (1.1)', estudantes: 'estudantes', escolas: 'escolas', turmasProf: 'turmas de professores (professores ÷ 25)',
  turmasEst: 'turmas de estudantes (estudantes ÷ 30)', formadores: 'formadores (professores ÷ 250)', mentores: 'mentores (professores ÷ 30)', anos: 'anos do plano',
  cursosHoras: 'horas por professor (cursos × horas por curso, 1.1)', reciclagemHoras: 'horas de reciclagem por professor (por ano × horas × anos do plano, 1.1)',
};
export function escalaLit(s: Estado, id: Escala['id'], fases: FaseCalc[]): number | null {
  const v = (k: keyof typeof PARAM_LIT) => valorParametroLit(s, PARAM_LIT[k]).v;
  const prof = v('professores'), est = estudantesLit(s).v, esc = escolasLit(s).v, anos = fases.reduce((n, f) => n + f.meses, 0) / 12;
  switch (id) {
    case 'professores': return prof;
    case 'estudantes': return est;
    case 'escolas': return esc;
    case 'turmasProf': return prof === null ? null : Math.ceil(prof / 25);
    case 'turmasEst': return Math.ceil(est / 30);
    case 'formadores': return prof === null ? null : Math.max(1, Math.ceil(prof / 250));
    case 'mentores': return prof === null ? null : Math.max(1, Math.ceil(prof / 30));
    case 'anos': return anos;
    case 'cursosHoras': { const c = v('cursos'), h = v('horas'); return c === null || h === null ? null : c * h; }
    case 'reciclagemHoras': { const r = v('reciclagem'), h = v('horasReciclagem'); return r === null || h === null ? null : r * h * anos; }
  }
}

/** Linha de uma opção do letramento. */
export function calcularLit(s: Estado, rotulo: string, salvo: CustoSalvo, fases: FaseCalc[], taxa: number | null,
  fmt: (v: number) => string, num: (v: number) => string, moeda?: string): LinhaOpcao {
  const def = OPCOES_LIT[rotulo], q: Record<string, any> = (salvo as any).q || {}, iso = (s as any).caso?.pais as string | undefined;
  const n2 = (v: number) => new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 2 }).format(v);
  const base = { chave: chaveOpcao(rotulo), rotulo, tipo: 'comp' as const, tipoPadrao: 'comp' as const, fonte: null, qtd: null, qtdSugerida: false, horas: null, unit: null, unitRef: null, unitDaReferencia: false, valoresFase: {} };
  const zero: Record<string, number> = {}; for (const x of fases) zero[x.id] = 0;
  // formação por componentes (governança 3.2): criação no início; a aplicação na proporção dos professores novos
  if (def.formacao) {
    const fo = def.formacao, nSug = escalaLit(s, fo.pessoas, fases), hSug = typeof fo.horas === 'number' ? fo.horas : escalaLit(s, fo.horas, fases);
    const n = pos(q.pessoas) ? q.pessoas : nSug, h = pos(q.horas) ? q.horas : hSug, pres = typeof q.presencial === 'number' && q.presencial >= 0 && q.presencial <= 100 ? q.presencial : fo.presencial;
    const entradas: EntradaD2[] = [
      { id: 'pessoas', rotulo: t('Pessoas a formar'), tipo: 'numero', valor: pos(q.pessoas) ? q.pessoas : '', sugestao: nSug === null ? undefined : String(nSug), dica: t('Vazio = {x}.', { x: t(ROT_ESCALA[fo.pessoas]) }) },
      { id: 'horas', rotulo: t('Horas por pessoa'), tipo: 'numero', valor: pos(q.horas) ? q.horas : '', sugestao: hSug === null ? undefined : n2(hSug), decimais: true,
        dica: typeof fo.horas === 'number' ? t('Vazio = {n} horas (estimativa de referência, grau C).', { n: fo.horas }) : t('Vazio = {x}.', { x: t(ROT_ESCALA[fo.horas]) }) },
      { id: 'presencial', rotulo: t('Parte presencial (%)'), tipo: 'numero', valor: typeof q.presencial === 'number' ? q.presencial : '', sugestao: String(fo.presencial), decimais: true,
        dica: t('Vazio = {p}%. As aulas presenciais acontecem na região dos participantes; o restante é online ao vivo.', { p: fo.presencial }) },
    ];
    if (h === null || h <= 0) return { ...base, porFase: zero, total: 0, status: 'referencia', falta: [], capex: 0, opex: 0, uso: 0, pessoas: 0, pessoasCapex: 0, entradas, memoria: t('sem horas de formação') } as LinhaOpcao;
    const r = custoFormacao(s, n, h, pres / 100, fases, taxa, moeda, fmt, num);
    if (r.total === null) return { ...base, porFase: zero, total: null, status: 'falta', falta: r.falta, entradas, memoria: '' } as LinhaOpcao;
    const porFase: Record<string, number> = {}; let ant = 0, resto = r.opex as number;
    fases.forEach((x, i) => { const parte = i === fases.length - 1 ? cent(resto) : cent((r.opex as number) * Math.max(0, x.alcance - ant) / 100); resto -= parte; porFase[x.id] = parte + (i === 0 ? r.capex as number : 0); ant = Math.max(ant, x.alcance); });
    const informado = pos(q.pessoas) || pos(q.horas) || typeof q.presencial === 'number';
    return { ...base, porFase, total: r.total, status: informado ? 'informado' : 'referencia', falta: [], capex: r.capex, opex: r.opex, uso: 0, pessoas: r.total, pessoasCapex: r.capex,
      entradas, conta: { formula: r.formula, partes: [...r.partes, { rotulo: t('Por fase'), valor: '', fontes: [], texto: t('a criação do curso entra na primeira fase; a aplicação, na proporção das pessoas novas de cada fase') }] },
      nota: r.textoTempo || undefined, memoria: r.memoria } as LinhaOpcao;
  }
  // soma de parcelas
  const pl = nivelPrecos(iso), entradas: EntradaD2[] = [], vistos = new Set<string>(), partes: ParteConta[] = [], falta: string[] = [];
  const porFase: Record<string, number> = { ...zero }; let capex = 0, opex = 0, uso = 0, pessoasV = 0, informado = false;
  const fontesSal: FonteConta[] = [];
  for (const p of def.parcelas || []) {
    const vals: number[] = [], textos: string[] = [];
    for (const f of p.fatores) {
      // referência do fator: salário do país (por mês ou por hora), preço em US$ × nível de preços, ou o número sugerido
      let sug: number | null = f.sug, origem = '';
      if (f.salario) {
        const c = custoMensalPerfil(s, f.salario, false, taxa, moeda, num);
        if (!c) { sug = null; } else { sug = /Hora/.test(f.id) ? cent(c.valor * 12 / FORMACAO_GOV.horasAno) : c.valor; origem = c.texto + (/Hora/.test(f.id) ? ' · ' + t('custo mensal × 12 ÷ 2.080 horas') : ''); for (const x of c.fontes) if (!fontesSal.some(y => y.titulo === x.titulo)) fontesSal.push(x); }
      } else if (f.usd) {
        sug = taxa === null ? null : cent(f.sug * pl.v * taxa);
        origem = t('US$ {u} × nível de preços do país {v} ({o}) × câmbio (estimativa de referência, grau C)', { u: n2(f.sug), v: n2(pl.v), o: pl.mediana ? t('mediana do grupo') : t('Banco Mundial, {a}', { a: String(pl.ano) }) });
      } else origem = f.dica ? t(f.dica) : t('estimativa de referência (grau C)');
      const salvoV = q[f.id], tem = typeof salvoV === 'number' && Number.isFinite(salvoV) && salvoV >= 0;
      const v = tem ? salvoV : sug;
      if (tem) informado = true;
      if (!vistos.has(f.id)) {
        vistos.add(f.id);
        entradas.push({ id: f.id, rotulo: t(f.rotulo), tipo: 'numero', valor: tem ? salvoV : '', sugestao: sug === null ? undefined : n2(sug), decimais: f.decimais || f.usd || !!f.salario,
          dica: sug === null ? undefined : t('Vazio = {v}', { v: f.usd || f.salario ? fmt(sug) : n2(sug) }) + (origem ? ' · ' + origem : '') });
      }
      if (v === null) { falta.push(t(f.rotulo).toLowerCase()); continue; }
      vals.push(/\(%\)/.test(f.rotulo) ? v / 100 : v);
      textos.push((f.usd || f.salario ? fmt(v) : /\(%\)/.test(f.rotulo) ? n2(v) + '%' : n2(v)) + ' ' + t(f.rotulo).toLowerCase().replace(/ \(%\)$/, ''));
    }
    let esc: number | null = 1;
    if (p.escala) { esc = escalaLit(s, p.escala, fases); if (esc === null) falta.push(t(ROT_ESCALA[p.escala])); else textos.unshift(n2(p.escala === 'escolas' && p.texto ? esc / 100 : esc) + ' ' + (p.texto ? t(p.texto) : t(ROT_ESCALA[p.escala]))); if (esc !== null && p.texto) esc = esc / 100; }
    if (vals.length < p.fatores.length || esc === null) continue;
    // revisões do currículo: (meses do plano ÷ 12 ÷ ciclo) revisões, em valor mensal
    let unit = vals.reduce((a, b) => a * b, 1) * esc;
    if (p.fatores.some(f => f.id === 'cicloAnos')) { const ciclo = vals[0]; unit = ciclo > 0 ? vals.slice(1).reduce((a, b) => a * b, 1) / (ciclo * 12) : 0; }
    let tot = 0, ant = 0;
    for (const x of fases) {
      const v = p.dist === 'inicio' ? (x === fases[0] ? unit : 0) : p.dist === 'novos' ? unit * Math.max(0, x.alcance - ant) / 100
        : p.dist === 'alcance' ? unit * x.alcance / 100 * x.meses : p.dist === 'ano' ? unit * x.meses / 12 : unit * x.meses;
      ant = Math.max(ant, x.alcance);
      porFase[x.id] = cent(porFase[x.id] + v); tot += v;
    }
    tot = cent(tot);
    if (p.classe === 'capex') capex += tot; else if (p.classe === 'uso') uso += tot; else opex += tot;
    if (p.pessoas) pessoasV += tot;
    const distTxt = p.dist === 'inicio' ? t('na primeira fase') : p.dist === 'novos' ? t('na proporção dos novos de cada fase') : p.dist === 'alcance' ? t('por mês, no alcance de cada fase × meses da fase') : p.dist === 'ano' ? t('por ano × meses do plano ÷ 12') : t('por mês × meses do plano');
    partes.push({ rotulo: t(p.rotulo) + ' (' + (p.classe === 'capex' ? 'CapEx' : p.classe === 'uso' ? t('Custo de utilidades') : 'OpEx') + ')', valor: fmt(tot), fontes: [], texto: textos.join(' × ') + ' · ' + distTxt });
  }
  if (fontesSal.length && partes.length) partes[partes.length - 1].fontes.push(...fontesSal);
  const escalas = new Set((def.parcelas || []).map(p => p.escala).filter(Boolean));
  if (escalas.has('estudantes') || escalas.has('turmasEst')) partes.push({ rotulo: t('Estudantes'), valor: n2(estudantesLit(s).v), texto: t(estudantesLit(s).origem), fontes: [] });
  if (escalas.has('escolas')) partes.push({ rotulo: t('Escolas'), valor: n2(escolasLit(s).v), texto: t(escolasLit(s).origem), fontes: [] });
  if (partes.some(p => /× nível de preços/.test(p.texto)) || entradas.some(e => /nível de preços/.test(e.dica || ''))) partes.push({ rotulo: t('Preços de referência'), valor: '', texto: t('preços de serviços em US$ dos EUA levados ao país pelo nível de preços (grau C)'), fontes: [FONTES_FORMACAO.ppc] });
  if (falta.length) return { ...base, porFase: zero, total: null, status: 'falta', falta: [...new Set(falta)], entradas, memoria: '' } as LinhaOpcao;
  const total = cent(capex + opex + uso);
  return { ...base, porFase, total, status: informado ? 'informado' : 'referencia', falta: [], capex: cent(capex), opex: cent(opex), uso: cent(uso), pessoas: cent(pessoasV), pessoasCapex: 0,
    entradas, conta: { formula: partes.filter(p => p.valor).map(p => p.valor).join(' + ') + ' = ' + fmt(total), partes }, memoria: partes.map(p => p.rotulo + ' ' + p.valor).join(' · ') } as LinhaOpcao;
}
