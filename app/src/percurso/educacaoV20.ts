// v021: modelo paramétrico de "Educating with and without AI". Cada desafio escolhido tem o seu público, as suas fases e
// as suas categorias; cada opção de custo é um conjunto de componentes (linhas) com quantidade por fase × preço unitário,
// parâmetros editáveis, valor sugerido e a conta explicada. Toda linha diz se vale na alternativa com IA, na sem IA ou
// nas duas, e se é investimento (CapEx), operação (OpEx) ou consumo medido (Utility). A base de linhas é a mesma em
// todos os desafios; alguns desafios ligam itens próprios. A infraestrutura das escolas não se repete quando dois
// desafios atendem as mesmas escolas. VALORES SIMULADOS (grau C), para validar o ciclo e as telas; as referências de
// preço de IA, de salário (ILOSTAT) e de nível de preços (Banco Mundial) são as mesmas das outras partes da ferramenta.
import type { Estado14 } from '../store/tipos';
import { DESAFIOS_EDU_V016 } from '../domain/catalogo_v016.js';
import { nivelPrecos, matriculasMil } from './formacaoGov';
import { taxaV16 } from './orcamentoV016';
import { salarioDoPais, MEDIANA_MUNDIAL } from './custosV017';
import { fatorEncargos } from './encargosPais';
import type { Grupo } from './salariosPais';
import { t } from './textos';

export type Classe = 'capex' | 'opex' | 'uso';
export type Alternativa = 'com' | 'sem';
export type AltSel = 'ambos' | Alternativa;
export interface Opcao { id: string; nome: string; so?: Alternativa }
export interface Categoria { id: string; n: string; nome: string; opcoes: Opcao[] }

export const CATEGORIAS_ED: Categoria[] = [
  { id: 'e1', n: '1', nome: 'Escala e implementação', opcoes: [
    { id: 'e11', nome: 'Prova de conceito e piloto' }, { id: 'e12', nome: 'Implantação e expansão' },
    { id: 'e13', nome: 'Coordenação, monitoramento e avaliação' }, { id: 'e14', nome: 'Adaptação ao ambiente de implantação' }] },
  { id: 'e2', n: '2', nome: 'Infraestrutura', opcoes: [
    { id: 'e21', nome: 'Energia elétrica confiável' }, { id: 'e22', nome: 'Conectividade e banda' },
    { id: 'e23', nome: 'Dispositivos e equipamentos de acessibilidade' }, { id: 'e24', nome: 'Hospedagem, computação e armazenamento' }] },
  { id: 'e3', n: '3', nome: 'Formação docente', opcoes: [
    { id: 'e31', nome: 'Preparação pedagógica inicial' }, { id: 'e32', nome: 'Desenvolvimento profissional contínuo' },
    { id: 'e33', nome: 'Apoio técnico e pedagógico' }, { id: 'e34', nome: 'Reciclagem e coaching' }] },
  { id: 'e4', n: '4', nome: 'Recursos', opcoes: [
    { id: 'e41', nome: 'Conteúdos e materiais de aprendizagem' }, { id: 'e42', nome: 'Plataformas e licenças de software' },
    { id: 'e43', nome: 'Ferramentas de IA', so: 'com' }, { id: 'e44', nome: 'Recursos acessíveis, multilíngues e offline' }] },
];
export const OPCOES_ED: Record<string, Opcao & { cat: string }> = Object.fromEntries(CATEGORIAS_ED.flatMap(c => c.opcoes.map(o => [o.id, { ...o, cat: c.id }])));
export const DESAFIOS_ED = (DESAFIOS_EDU_V016 as any[]).map(d => ({ id: d.id as string, nome: d.t as string, desc: d.desc as string }));

export const AMBIENTES = [['escolas', 'Escolas'], ['centros', 'Centros comunitários'], ['profissional', 'Instituições de educação profissional'], ['casa', 'Ensino em casa']] as const;
export const MODALIDADES = [['presencial', 'Presencial'], ['hibrida', 'Híbrida'], ['online', 'Online'], ['offline', 'Offline']] as const;
/** Estudantes por local de aprendizagem, por ambiente (sugestão; no ensino em casa não há local). */
const ALUNOS_POR_LOCAL: Record<string, number> = { escolas: 300, centros: 60, profissional: 400, casa: 0 };

export interface Fase { id: string; nome: string; meses: number; alcance: number }
/** Fases do ciclo; a prova de conceito alcança um número de locais, as demais uma parte do público. */
export const FASES_PADRAO: Fase[] = [
  { id: 'poc', nome: 'Prova de conceito', meses: 3, alcance: 0 },
  { id: 'piloto', nome: 'Piloto', meses: 6, alcance: 5 },
  { id: 'implantacao', nome: 'Implantação', meses: 12, alcance: 33 },
  { id: 'expansao', nome: 'Expansão', meses: 12, alcance: 100 },
];
export const ESCOLAS_POC = 5;
/** Percentuais-padrão dos custos adicionais (como na governança). */
export const SIM = { viagens: 25, overhead: 15, taxa: 7 };

// ------------------------------------------------------------------ escolhas da ferramenta de IA (0.0.14, passo 2.3)
/** Tipo de tecnologia (pergunta 2.3.4 da 0.0.14), para a ferramenta de IA (4.3) e para a plataforma de aprendizagem (4.2). */
export const IA_TIPO = [['publica', 'Pública ou gratuita, oferecida por governo ou instituição pública'], ['aberta', 'Aberta (código ou modelo aberto), operada pela rede ou por empresa contratada'], ['paga', 'Produto ou serviço pago de uma empresa'], ['nao_sei', 'Ainda não sei']] as const;
export const IA_ARQ = [['saas', 'Produto pronto (SaaS) por licença'], ['api', 'Aplicação própria ou contratada usando modelo por API, com base de conhecimento (RAG)'], ['ow', 'Modelo de pesos abertos em infraestrutura contratada'], ['ow_api', 'Modelo aberto usado pela API de uma empresa'], ['preditivo', 'Modelo preditivo treinado com dados da rede']] as const;
export const IA_PAG = [['usuario', 'Licença por usuário'], ['institucional', 'Assinatura institucional (valor fixo para a rede)'], ['consumo', 'Por consumo (paga pelo uso)'], ['incluida', 'Incluída numa plataforma que a rede já paga'], ['gratuito', 'Doação ou piloto gratuito']] as const;
export const IA_LIC = [['assinatura', 'Licença de uso por prazo (assinatura)'], ['aberta', 'Licença aberta (pode usar, modificar e hospedar)'], ['termos', 'Termos de uso padrão, sem contrato negociado']] as const;
/** plat: tipo de tecnologia da plataforma de aprendizagem (4.2) */
export interface EscolhaIA { tipo: string; arq: string; pag: string; lic: string; plat: string }
export const IA_PADRAO: EscolhaIA = { tipo: 'nao_sei', arq: 'saas', pag: 'usuario', lic: 'assinatura', plat: 'nao_sei' };
/** Arquitetura, pagamento e licença sugeridos por tipo de tecnologia (como na 0.0.14); "Ainda não sei" usa a estimativa de produto pago. */
export const PADRAO_TIPO: Record<string, Pick<EscolhaIA, 'arq' | 'pag' | 'lic'>> = {
  publica: { arq: 'saas', pag: 'gratuito', lic: 'termos' }, aberta: { arq: 'ow', pag: 'consumo', lic: 'aberta' },
  paga: { arq: 'saas', pag: 'usuario', lic: 'assinatura' }, nao_sei: { arq: 'saas', pag: 'usuario', lic: 'assinatura' },
};
/** Tipo efetivo: "Ainda não sei" conta como produto pago (a estimativa mais conservadora). */
export const tipoEf = (v: string) => v === 'publica' || v === 'aberta' ? v : 'paga';

// ------------------------------------------------------------------ dados salvos (ctx.edV20)
export interface PublicoDesafio {
  estudantes: number; professores: number; escolas: number; ambiente: string; modalidade: string; linguas: number;
  semEnergia: number; semInternet: number; dispositivos: number; deficiencia: number; mesmas: string;
}
export interface SobreLinha { off?: boolean; on?: boolean; unit?: number | { com?: number; sem?: number }; p?: Record<string, number | { com?: number; sem?: number }>; papeis?: Record<string, { pessoas?: number; ded?: number; unit?: number }> }
export interface PapelExtraEd { id: string; papel: string; perfil: Grupo; pessoas: number; ded: number; alt: AltSel; unit?: number }
export interface SalvoEd {
  desafios?: string[]; publico?: Record<string, Partial<PublicoDesafio>>;
  /** v020: fases comuns a todos os desafios (sugestão para quem não ajustou as do desafio) */
  fases?: Partial<Fase>[];
  /** v021: fases de cada desafio e locais da prova de conceito */
  fasesD?: Record<string, Partial<Fase>[]>; poc?: Record<string, number>;
  categorias?: Record<string, string[]>; opcoes?: Record<string, string[]>;
  linhas?: Record<string, Record<string, SobreLinha>>; extras?: Record<string, Record<string, PapelExtraEd[]>>;
  ia?: Record<string, Partial<EscolhaIA>>; plat?: Record<string, string>;
  pV?: number; pO?: number; pT?: number;
}
export const lerEd = (s: Pick<Estado14, 'ctx'>): SalvoEd => (s.ctx?.edV20 || {}) as SalvoEd;

/** Parte das matrículas (primário + secundário) que forma o público sugerido de cada desafio, e alunos por professor. */
const PUBLICO_SIM: Record<string, [number, number]> = {
  C31: [0.15, 15], C32: [0.25, 25], C33: [0.35, 20], C34: [0.1, 10], C35: [0.2, 25], C36: [0.08, 20], C37: [0.05, 25], C38: [0.5, 25],
};
/** Público sugerido do desafio: parte das matrículas do país (ou 1 milhão sem dado), professores pela razão aluno/professor. */
export function publicoSugerido(s: Pick<Estado14, 'ctx'>, d: string, ambiente?: string): PublicoDesafio {
  const mil = matriculasMil((s as any).caso?.pais) ?? 1000, [parte, razao] = PUBLICO_SIM[d] || [0.1, 25];
  const estudantes = Math.max(1000, Math.round(mil * 1000 * parte / 1000) * 1000);
  const amb = ambiente || (d === 'C36' ? 'profissional' : d === 'C37' ? 'centros' : 'escolas'), apl = ALUNOS_POR_LOCAL[amb] || 0;
  return {
    estudantes, professores: Math.max(10, Math.round(estudantes / razao)), escolas: apl ? Math.max(1, Math.ceil(estudantes / apl)) : 0,
    ambiente: amb, modalidade: 'presencial', linguas: d === 'C35' ? 3 : 1,
    semEnergia: 30, semInternet: 40, dispositivos: 20, deficiencia: d === 'C34' ? 30 : 5, mesmas: '',
  };
}
export function publico(s: Pick<Estado14, 'ctx'>, d: string): PublicoDesafio {
  const sv = lerEd(s).publico?.[d] || {}, sug = publicoSugerido(s, d, sv.ambiente ? String(sv.ambiente) : undefined);
  const pos = (v: unknown, p: number) => typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : p;
  const pct = (v: unknown, p: number) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100 ? v : p;
  const ambiente = String(sv.ambiente || sug.ambiente);
  const estudantes = pos(sv.estudantes, sug.estudantes), apl = ALUNOS_POR_LOCAL[ambiente] || 0;
  const escolasSug = apl ? Math.max(1, Math.ceil(estudantes / apl)) : 0;
  const ds = desafiosEscolhidos(s), mesmas = typeof sv.mesmas === 'string' && ds.indexOf(sv.mesmas) >= 0 && ds.indexOf(sv.mesmas) < ds.indexOf(d) ? sv.mesmas : '';
  return {
    estudantes, professores: pos(sv.professores, sug.professores), escolas: apl ? pos(sv.escolas, escolasSug) : 0, ambiente,
    modalidade: String(sv.modalidade || sug.modalidade), linguas: pos(sv.linguas, sug.linguas),
    semEnergia: pct(sv.semEnergia, sug.semEnergia), semInternet: pct(sv.semInternet, sug.semInternet), dispositivos: pct(sv.dispositivos, sug.dispositivos),
    deficiencia: pct(sv.deficiencia, sug.deficiencia), mesmas,
  };
}
/** Fases de um desafio: as dele, ou as comuns (v020), ou as sugeridas. */
export function fases(s: Pick<Estado14, 'ctx'>, d?: string): Fase[] {
  const e = lerEd(s), sv = (d && e.fasesD?.[d]) || [], comum = e.fases || [];
  return FASES_PADRAO.map((f, i) => {
    const pega = (k: 'meses' | 'alcance') => { for (const x of [sv[i] || {}, comum[i] || {}]) { const v = Number((x as any)[k]); if ((x as any)[k] !== undefined && Number.isFinite(v) && v >= 0 && (k === 'meses' || v <= 100)) return v; } return f[k]; };
    return { ...f, meses: pega('meses'), alcance: f.id === 'poc' ? 0 : pega('alcance') };
  });
}
export const escolasPoc = (s: Pick<Estado14, 'ctx'>, d: string) => { const v = Number(lerEd(s).poc?.[d]); return v > 0 ? v : ESCOLAS_POC; };
export const desafiosEscolhidos = (s: Pick<Estado14, 'ctx'>) => DESAFIOS_ED.map(d => d.id).filter(id => (lerEd(s).desafios || []).includes(id));
/** Categorias escolhidas no desafio; sem escolha gravada (casos da v020), as das opções já marcadas. */
export function categoriasEscolhidas(s: Pick<Estado14, 'ctx'>, d: string): string[] {
  const e = lerEd(s), sel = e.categorias?.[d];
  const lista = Array.isArray(sel) ? sel : (e.opcoes?.[d] || []).map(o => OPCOES_ED[o]?.cat).filter(Boolean);
  return CATEGORIAS_ED.map(c => c.id).filter(id => lista.includes(id));
}
export const opcoesEscolhidas = (s: Pick<Estado14, 'ctx'>, d: string) => { const cats = categoriasEscolhidas(s, d); return (lerEd(s).opcoes?.[d] || []).filter(id => OPCOES_ED[id] && cats.includes(OPCOES_ED[id].cat)); };
export function escolhaIA(s: Pick<Estado14, 'ctx'>, d: string): EscolhaIA {
  const e = lerEd(s), sv = e.ia?.[d] || {}, tipo = String(sv.tipo || 'nao_sei'), base = PADRAO_TIPO[tipo] || PADRAO_TIPO.nao_sei;
  const pega = (k: 'arq' | 'pag' | 'lic') => typeof sv[k] === 'string' && sv[k] ? String(sv[k]) : base[k];
  return { tipo, arq: pega('arq'), pag: pega('pag'), lic: pega('lic'), plat: String(e.plat?.[d] || 'nao_sei') };
}

// ------------------------------------------------------------------ catálogo de componentes
/** Uma fase já com as quantidades do desafio. Ei/nEi: locais que contam para a infraestrutura (sem os já contados em
 *  outro desafio com as mesmas escolas). casa: estudantes que estudam em casa. */
export interface FaseCalc { id: string; nome: string; meses: number; i: number; inicio: number; E: number; A: number; P: number; nE: number; nA: number; nP: number; Ei: number; nEi: number; casa: number; ultima: boolean; primeira: boolean }
/** comum: o mesmo valor vale para todas as linhas da opção (editado uma vez, no topo da opção) */
export interface ParamDef { id: string; rotulo: string; padrao: number | { com: number; sem: number }; pct?: boolean; unidade?: string; comum?: boolean }
export interface PapelDef { papel: string; perfil: Grupo; pessoas?: number; porParam?: string; base?: 'E' | 'A' | 'P' | 'def'; ded: number; fases?: string[]; alt?: AltSel }
interface Ctx { d: string; p: PublicoDesafio; alt: Alternativa; P: (id: string) => number; ia: EscolhaIA; fs: FaseCalc[]; meses: number }
export interface CompDef {
  id: string; op: string; nome: string; alt: AltSel; classe: Classe;
  /** preço unitário em US$; local = serviço local (× nível de preços); perfil = custo da hora (hora) ou do mês de um perfil ILOSTAT */
  preco?: { padrao: number | { com: number; sem: number }; rotulo: string; local?: boolean; perfil?: Grupo; hora?: boolean; mult?: string; porArq?: Record<string, number> };
  params?: ParamDef[];
  /** unidades cobradas na fase */
  qtd?: (c: Ctx, f: FaseCalc) => number;
  /** equipe: papéis com pessoas × dedicação × custo mensal × meses */
  papeis?: PapelDef[];
  /** percentual de outras linhas: por ano do investimento acumulado (ano) ou do valor da fase (fase) */
  pctDe?: { ids: string[]; modo: 'ano' | 'fase'; param: string };
  formula: string; unidade?: string;
  /** vida útil em meses: a compra se repete quando a vida acaba dentro do plano */
  vida?: string;
  extra?: string[]; quando?: (c: Omit<Ctx, 'alt' | 'P'>) => boolean; ia?: (e: EscolhaIA) => boolean; informativo?: boolean; infra?: boolean;
  /** forma de oferta (tipo de tecnologia da ferramenta de IA e da plataforma), por alternativa */
  oferta?: (e: EscolhaIA, a: Alternativa) => boolean;
  nota?: string;
}
const HORAS_MES = 2080 / 12;
const anos = (f: FaseCalc) => f.meses / 12;
const fasesIniciais = ['poc', 'piloto'], fasesEscala = ['implantacao', 'expansao'];
const em = (f: FaseCalc, ids: string[]) => ids.includes(f.id);
const arqEf = (e: EscolhaIA) => e.arq;
const licPaga = (e: EscolhaIA) => tipoEf(e.tipo) !== 'publica' && e.pag !== 'incluida';
const naoPublica = (e: EscolhaIA) => tipoEf(e.tipo) !== 'publica';
/** a rede (ou a empresa que ela contrata) opera a aplicação de IA */
const appOperada = (e: EscolhaIA) => naoPublica(e) && (tipoEf(e.tipo) === 'aberta' || ['api', 'ow_api', 'ow', 'preditivo'].includes(e.arq));
const platEf = (e: EscolhaIA) => tipoEf(e.plat);
const turmas = (n: number, tam: number) => n > 0 ? Math.ceil(n / Math.max(1, tam)) : 0;

export const COMPONENTES: CompDef[] = [
  // ---------------------------------------------------------------- 1.1 prova de conceito e piloto
  { id: 'e11-equipe', op: 'e11', nome: 'Equipe do projeto', alt: 'ambos', classe: 'opex', formula: 'pessoas × dedicação × custo mensal × meses da prova de conceito e do piloto',
    papeis: [{ papel: 'Coordenação do projeto', perfil: 1, pessoas: 1, ded: 0.5, fases: fasesIniciais }, { papel: 'Especialista pedagógico', perfil: 2, pessoas: 1, ded: 1, fases: fasesIniciais },
      { papel: 'Analista de avaliação e dados', perfil: 2, pessoas: 1, ded: 0.5, fases: fasesIniciais }, { papel: 'Especialista em IA', perfil: 2, pessoas: 1, ded: 0.5, fases: fasesIniciais, alt: 'com' }] },
  { id: 'e11-visitas', op: 'e11', nome: 'Visitas de acompanhamento', alt: 'ambos', classe: 'opex', unidade: 'visitas', formula: 'locais na fase × visitas por mês × meses × custo da visita',
    params: [{ id: 'porMes', rotulo: 'Visitas por local por mês', padrao: 1 }], preco: { padrao: 40, rotulo: 'Custo por visita', local: true },
    qtd: (c, f) => em(f, fasesIniciais) ? (f.E || f.A / 30) * c.P('porMes') * f.meses : 0 },
  { id: 'e11-avaliacao', op: 'e11', nome: 'Avaliação do piloto', alt: 'ambos', classe: 'opex', unidade: 'avaliações', formula: 'uma avaliação externa ao fim do piloto',
    preco: { padrao: 20000, rotulo: 'Custo da avaliação', local: true }, qtd: (_c, f) => f.id === 'piloto' && f.meses > 0 ? 1 : 0 },
  { id: 'e11-config', op: 'e11', nome: 'Configuração e testes da ferramenta de IA', alt: 'com', classe: 'capex', unidade: 'horas', formula: 'horas de configuração e testes × custo da hora (uma vez)',
    params: [{ id: 'horas', rotulo: 'Horas', padrao: 200 }], preco: { padrao: 0, rotulo: 'Custo da hora', perfil: 3, hora: true }, qtd: (c, f) => f.primeira ? c.P('horas') : 0 },
  { id: 'e11-riscos', op: 'e11', nome: 'Avaliação de riscos e de proteção de dados', alt: 'com', classe: 'opex', unidade: 'avaliações', formula: 'uma avaliação de impacto sobre direitos, segurança e dados antes do uso',
    preco: { padrao: 15000, rotulo: 'Custo da avaliação', local: true }, qtd: (_c, f) => f.primeira ? 1 : 0 },
  // ---------------------------------------------------------------- 1.2 implantação e expansão
  { id: 'e12-implantadores', op: 'e12', nome: 'Equipe de implantação', alt: 'ambos', classe: 'opex', formula: '1 implantador para cada grupo de locais × custo mensal × meses da implantação e da expansão',
    params: [{ id: 'locais', rotulo: 'Locais por implantador', padrao: 50 }],
    papeis: [{ papel: 'Implantador', perfil: 3, porParam: 'locais', base: 'E', ded: 1, fases: fasesEscala }] },
  { id: 'e12-integracao', op: 'e12', nome: 'Integração com os sistemas da rede', alt: 'com', classe: 'capex', unidade: 'horas', formula: 'horas de integração (login, matrícula, ambiente virtual) × custo da hora (uma vez)',
    params: [{ id: 'horas', rotulo: 'Horas', padrao: 400 }], preco: { padrao: 0, rotulo: 'Custo da hora', perfil: 2, hora: true }, qtd: (c, f) => f.id === 'implantacao' ? c.P('horas') : 0 },
  { id: 'e12-contas', op: 'e12', nome: 'Contas e acessos', alt: 'com', classe: 'opex', unidade: 'usuários', formula: 'novos estudantes e professores × custo por conta',
    preco: { padrao: 0.5, rotulo: 'Custo por conta' }, qtd: (_c, f) => f.nA + f.nP },
  { id: 'e12-entrega', op: 'e12', nome: 'Entrega e instalação nos locais', alt: 'ambos', classe: 'opex', unidade: 'locais', formula: 'novos locais × custo de entrega e instalação',
    preco: { padrao: { com: 120, sem: 40 }, rotulo: 'Custo por local', local: true }, qtd: (_c, f) => em(f, fasesEscala) ? f.nE : 0 },
  // ---------------------------------------------------------------- 1.3 coordenação, monitoramento e avaliação
  { id: 'e13-equipe', op: 'e13', nome: 'Coordenação do programa', alt: 'ambos', classe: 'opex', formula: 'pessoas × dedicação × custo mensal × meses do plano',
    papeis: [{ papel: 'Coordenação do programa', perfil: 1, pessoas: 1, ded: 0.5 }, { papel: 'Analista de monitoramento', perfil: 2, pessoas: 1, ded: 1 }] },
  { id: 'e13-painel', op: 'e13', nome: 'Painel de monitoramento', alt: 'ambos', classe: 'opex', unidade: 'meses', formula: 'meses × mensalidade do painel',
    preco: { padrao: 300, rotulo: 'Mensalidade' }, qtd: (_c, f) => f.meses },
  { id: 'e13-impacto', op: 'e13', nome: 'Avaliação de impacto', alt: 'ambos', classe: 'opex', unidade: 'avaliações', formula: 'uma avaliação com grupo de comparação ao fim da implantação',
    preco: { padrao: 40000, rotulo: 'Custo da avaliação', local: true }, qtd: (_c, f) => f.id === 'implantacao' && f.meses > 0 ? 1 : 0 },
  { id: 'e13-auditoria', op: 'e13', nome: 'Auditoria da IA (viés, segurança e qualidade)', alt: 'com', classe: 'opex', unidade: 'anos', formula: 'anos de uso × custo da auditoria anual',
    preco: { padrao: 15000, rotulo: 'Custo por ano' }, qtd: (_c, f) => em(f, fasesEscala) ? anos(f) : 0 },
  { id: 'e13-sensiveis', op: 'e13', nome: 'Protocolo de proteção de dados sensíveis', alt: 'com', classe: 'opex', unidade: 'protocolos', formula: 'um protocolo para dados de bem-estar e saúde emocional (uma vez)', extra: ['C38'],
    preco: { padrao: 10000, rotulo: 'Custo', local: true }, qtd: (_c, f) => f.primeira ? 1 : 0 },
  // ---------------------------------------------------------------- 1.4 adaptação ao ambiente
  { id: 'e14-espacos', op: 'e14', nome: 'Adequação dos espaços de aprendizagem', alt: 'ambos', classe: 'capex', unidade: 'locais', formula: 'novos locais × parte que precisa de adequação × custo por local',
    params: [{ id: 'parte', rotulo: 'Locais que precisam de adequação (%)', padrao: 50, pct: true }], preco: { padrao: 1500, rotulo: 'Custo por local', local: true },
    quando: c => c.p.ambiente === 'centros' || c.p.ambiente === 'profissional', qtd: (c, f) => f.nE * c.P('parte') / 100 },
  { id: 'e14-mediadores', op: 'e14', nome: 'Mediadores', alt: 'ambos', classe: 'opex', formula: '1 mediador para cada grupo de estudantes × custo mensal × meses',
    params: [{ id: 'estudantes', rotulo: 'Estudantes por mediador', padrao: 100 }], quando: c => c.p.ambiente === 'casa' || c.p.ambiente === 'centros',
    papeis: [{ papel: 'Mediador', perfil: 4, porParam: 'estudantes', base: 'A', ded: 1 }] },
  { id: 'e14-kits', op: 'e14', nome: 'Kits de estudo para as famílias', alt: 'ambos', classe: 'opex', unidade: 'kits', formula: 'novos estudantes que estudam em casa × custo do kit',
    preco: { padrao: 8, rotulo: 'Custo do kit', local: true }, quando: c => c.p.ambiente === 'casa' || c.p.modalidade === 'online' || c.p.modalidade === 'hibrida', qtd: (_c, f) => f.casa },
  { id: 'e14-noturno', op: 'e14', nome: 'Funcionamento noturno dos centros', alt: 'ambos', classe: 'opex', unidade: 'local-mês', formula: 'locais × meses × custo mensal (energia, limpeza e segurança)', extra: ['C37'],
    preco: { padrao: 150, rotulo: 'Custo por local por mês', local: true }, qtd: (_c, f) => f.E * f.meses },
  { id: 'e14-offline', op: 'e14', nome: 'Modo offline da ferramenta de IA', alt: 'com', classe: 'capex', unidade: 'projetos', formula: 'adaptação da ferramenta para funcionar sem internet (uma vez)',
    preco: { padrao: 25000, rotulo: 'Custo' }, quando: c => c.p.modalidade === 'offline' || c.p.semInternet >= 50, qtd: (_c, f) => f.primeira ? 1 : 0 },
  // ---------------------------------------------------------------- 2.1 energia
  { id: 'e21-sistemas', op: 'e21', nome: 'Sistemas de energia nos locais sem energia', alt: 'ambos', classe: 'capex', unidade: 'kW', infra: true, formula: 'novos locais sem energia × potência por local × custo por kW instalado',
    params: [{ id: 'kw', rotulo: 'Potência por local (kW)', padrao: { com: 2, sem: 0.5 } }, { id: 'vida', rotulo: 'Vida útil (meses)', padrao: 240 }], preco: { padrao: 2500, rotulo: 'Custo por kW' }, vida: 'vida',
    qtd: (c, f) => f.nEi * c.p.semEnergia / 100 * c.P('kw') },
  { id: 'e21-manutencao', op: 'e21', nome: 'Manutenção dos sistemas de energia', alt: 'ambos', classe: 'opex', infra: true, formula: 'percentual por ano do investimento em sistemas de energia',
    params: [{ id: 'pct', rotulo: 'Manutenção por ano (% do investimento)', padrao: 5, pct: true }], pctDe: { ids: ['e21-sistemas'], modo: 'ano', param: 'pct' } },
  { id: 'e21-eletricidade', op: 'e21', nome: 'Consumo de eletricidade', alt: 'ambos', classe: 'uso', unidade: 'kWh', formula: 'estudantes e professores na fase × kWh por pessoa por mês × meses × preço do kWh',
    params: [{ id: 'kwh', rotulo: 'kWh por pessoa por mês', padrao: { com: 1, sem: 0.2 } }], preco: { padrao: 0.15, rotulo: 'Preço do kWh' }, qtd: (c, f) => (f.A + f.P) * c.P('kwh') * f.meses },
  { id: 'e21-carga', op: 'e21', nome: 'Carregadores e baterias (carrinhos de carga)', alt: 'com', classe: 'capex', unidade: 'carrinhos', infra: true, formula: 'novos locais × carrinhos por local × preço',
    params: [{ id: 'porLocal', rotulo: 'Carrinhos por local', padrao: 1 }], preco: { padrao: 800, rotulo: 'Preço do carrinho' }, qtd: (c, f) => f.nEi * c.P('porLocal') },
  // ---------------------------------------------------------------- 2.2 conectividade
  { id: 'e22-instalacao', op: 'e22', nome: 'Instalação de internet nos locais sem conexão', alt: 'com', classe: 'capex', unidade: 'locais', infra: true, formula: 'novos locais sem internet × custo de instalação',
    preco: { padrao: 3000, rotulo: 'Custo por local' }, quando: c => c.p.modalidade !== 'offline', qtd: (c, f) => f.nEi * c.p.semInternet / 100 },
  { id: 'e22-mensalidade', op: 'e22', nome: 'Mensalidade de internet', alt: 'com', classe: 'uso', unidade: 'Mbps-mês', infra: true, formula: 'locais × banda por local (estudantes simultâneos × Mbps) × meses × preço por Mbps',
    params: [{ id: 'simult', rotulo: 'Estudantes conectados ao mesmo tempo (%)', padrao: 20, pct: true }, { id: 'mbps', rotulo: 'Mbps por estudante conectado', padrao: 0.5 }, { id: 'minimo', rotulo: 'Banda mínima por local (Mbps)', padrao: 10 }],
    preco: { padrao: 2, rotulo: 'Preço por Mbps por mês' }, quando: c => c.p.modalidade !== 'offline',
    qtd: (c, f) => f.Ei > 0 ? f.Ei * Math.max(c.P('minimo'), (f.A - f.casa) / Math.max(1, f.E) * c.P('simult') / 100 * c.P('mbps')) * f.meses : 0 },
  { id: 'e22-wifi', op: 'e22', nome: 'Rede sem fio nos locais', alt: 'com', classe: 'capex', unidade: 'pontos de acesso', infra: true, formula: 'novos locais × pontos de acesso por local × preço', vida: 'vida',
    params: [{ id: 'porLocal', rotulo: 'Pontos de acesso por local', padrao: 4 }, { id: 'vida', rotulo: 'Vida útil (meses)', padrao: 60 }], preco: { padrao: 250, rotulo: 'Preço do ponto de acesso' }, qtd: (c, f) => f.nEi * c.P('porLocal') },
  { id: 'e22-dados', op: 'e22', nome: 'Dados móveis para estudar em casa', alt: 'com', classe: 'uso', unidade: 'GB', formula: 'estudantes em casa × GB por mês × meses × preço do GB',
    params: [{ id: 'gb', rotulo: 'GB por estudante por mês', padrao: 3 }], preco: { padrao: 1, rotulo: 'Preço do GB' }, qtd: (c, f) => f.casa * c.P('gb') * f.meses },
  // ---------------------------------------------------------------- 2.3 dispositivos
  { id: 'e23-estudantes', op: 'e23', nome: 'Dispositivos para estudantes', alt: 'com', classe: 'capex', unidade: 'dispositivos', formula: 'novos estudantes sem dispositivo ÷ estudantes por dispositivo × preço com impostos e frete', vida: 'vida',
    params: [{ id: 'porDisp', rotulo: 'Estudantes por dispositivo', padrao: 3 }, { id: 'impostos', rotulo: 'Impostos e frete (%)', padrao: 20, pct: true }, { id: 'vida', rotulo: 'Vida útil (meses)', padrao: 60 }],
    preco: { padrao: 300, rotulo: 'Preço do dispositivo', mult: 'impostos' },
    qtd: (c, f) => Math.ceil(f.nA * (1 - c.p.dispositivos / 100) / Math.max(1, c.p.modalidade === 'online' || c.p.ambiente === 'casa' ? 1 : c.P('porDisp'))),
    nota: 'No ensino em casa e na modalidade online, um dispositivo por estudante.' },
  { id: 'e23-professores', op: 'e23', nome: 'Dispositivos para professores', alt: 'ambos', classe: 'capex', unidade: 'dispositivos', formula: 'novos professores sem dispositivo × preço com impostos e frete', vida: 'vida',
    params: [{ id: 'impostos', rotulo: 'Impostos e frete (%)', padrao: 20, pct: true }, { id: 'vida', rotulo: 'Vida útil (meses)', padrao: 60 }],
    preco: { padrao: 400, rotulo: 'Preço do dispositivo', mult: 'impostos' }, qtd: (c, f) => Math.ceil(f.nP * (1 - c.p.dispositivos / 100)) },
  { id: 'e23-gestao', op: 'e23', nome: 'Gestão de dispositivos e antivírus', alt: 'com', classe: 'opex', unidade: 'dispositivo-ano', formula: 'dispositivos em uso × anos × licença por dispositivo',
    preco: { padrao: 4, rotulo: 'Licença por dispositivo por ano' }, qtd: (c, f) => (f.A * (1 - c.p.dispositivos / 100) / Math.max(1, c.p.modalidade === 'online' ? 1 : 3) + f.P) * anos(f) },
  { id: 'e23-quebra', op: 'e23', nome: 'Reparo e reposição por quebra', alt: 'com', classe: 'opex', unidade: 'dispositivos', formula: 'dispositivos em uso × quebra por ano × anos × preço do dispositivo',
    params: [{ id: 'taxa', rotulo: 'Quebra por ano (%)', padrao: 8, pct: true }], preco: { padrao: 300, rotulo: 'Preço do dispositivo' },
    qtd: (c, f) => f.A * (1 - c.p.dispositivos / 100) / Math.max(1, c.p.modalidade === 'online' ? 1 : 3) * c.P('taxa') / 100 * anos(f) },
  { id: 'e23-assistivos', op: 'e23', nome: 'Equipamentos assistivos', alt: 'ambos', classe: 'capex', unidade: 'equipamentos', formula: 'novos estudantes com deficiência × preço do equipamento', vida: 'vida',
    params: [{ id: 'vida', rotulo: 'Vida útil (meses)', padrao: 60 }], preco: { padrao: 250, rotulo: 'Preço do equipamento' }, qtd: (c, f) => f.nA * c.p.deficiencia / 100 },
  { id: 'e23-oficinas', op: 'e23', nome: 'Equipamentos de oficina e laboratório', alt: 'ambos', classe: 'capex', unidade: 'locais', infra: true, formula: 'novos locais × conjunto de equipamentos por local', extra: ['C36'], vida: 'vida',
    params: [{ id: 'vida', rotulo: 'Vida útil (meses)', padrao: 96 }], preco: { padrao: 8000, rotulo: 'Custo por local' }, qtd: (_c, f) => f.nEi },
  { id: 'e23-insumos', op: 'e23', nome: 'Insumos de prática', alt: 'ambos', classe: 'opex', unidade: 'estudante-ano', formula: 'estudantes × anos × insumos por estudante por ano', extra: ['C36'],
    preco: { padrao: 40, rotulo: 'Custo por estudante por ano', local: true }, qtd: (_c, f) => f.A * anos(f) },
  // ---------------------------------------------------------------- 2.4 hospedagem
  { id: 'e24-nuvem', op: 'e24', nome: 'Hospedagem da plataforma de aprendizagem', alt: 'ambos', classe: 'uso', unidade: 'usuário-mês', formula: 'estudantes e professores na fase × meses × custo por usuário por mês',
    preco: { padrao: 0.05, rotulo: 'Custo por usuário por mês' }, quando: c => c.p.modalidade !== 'offline', qtd: (_c, f) => (f.A + f.P) * f.meses,
    oferta: e => platEf(e) === 'aberta', nota: 'Só quando a plataforma é aberta e operada pela rede; numa plataforma paga ou pública, a hospedagem vem com o serviço.' },
  { id: 'e24-ia', op: 'e24', nome: 'Hospedagem e computação da aplicação de IA', alt: 'com', classe: 'uso', unidade: 'usuário-mês', formula: 'estudantes e professores na fase × meses × custo por usuário por mês',
    preco: { padrao: 0.25, rotulo: 'Custo por usuário por mês' }, quando: c => c.p.modalidade !== 'offline', qtd: (_c, f) => (f.A + f.P) * f.meses,
    oferta: e => appOperada(e) && e.arq !== 'ow', nota: 'Só quando a rede opera a aplicação (aberta, API ou modelo próprio); num produto pago, a hospedagem vem no preço; com pesos abertos, entra nas GPUs.' },
  { id: 'e24-armazenamento', op: 'e24', nome: 'Armazenamento e cópias de segurança', alt: 'ambos', classe: 'uso', unidade: 'GB-mês', formula: 'usuários × GB por usuário × meses × preço do GB',
    params: [{ id: 'gb', rotulo: 'GB por usuário', padrao: { com: 0.5, sem: 0.2 } }], preco: { padrao: 0.02, rotulo: 'Preço do GB por mês' }, qtd: (c, f) => (f.A + f.P) * c.P('gb') * f.meses,
    oferta: (e, a) => platEf(e) === 'aberta' || (a === 'com' && appOperada(e)) },
  { id: 'e24-seguranca', op: 'e24', nome: 'Segurança e proteção de dados', alt: 'ambos', classe: 'opex', formula: 'percentual sobre a hospedagem e o armazenamento',
    params: [{ id: 'pct', rotulo: 'Percentual sobre a hospedagem (%)', padrao: 15, pct: true }], pctDe: { ids: ['e24-nuvem', 'e24-ia', 'e24-armazenamento'], modo: 'fase', param: 'pct' } },
  { id: 'e24-servidores', op: 'e24', nome: 'Servidores locais nos locais sem internet', alt: 'com', classe: 'capex', unidade: 'servidores', infra: true, formula: 'novos locais sem internet × preço do servidor', vida: 'vida',
    params: [{ id: 'vida', rotulo: 'Vida útil (meses)', padrao: 60 }], preco: { padrao: 1200, rotulo: 'Preço do servidor' },
    quando: c => c.p.modalidade === 'offline' || c.p.semInternet >= 50, qtd: (c, f) => f.nEi * (c.p.modalidade === 'offline' ? 1 : c.p.semInternet / 100) },
  // ---------------------------------------------------------------- 3.1 preparação inicial
  { id: 'e31-curso', op: 'e31', nome: 'Criação do curso', alt: 'ambos', classe: 'capex', unidade: 'horas', formula: 'horas de desenho instrucional × custo da hora (uma vez; o curso fica para a rede)',
    params: [{ id: 'desenho', rotulo: 'Horas de desenho', padrao: { com: 180, sem: 120 } }], preco: { padrao: 0, rotulo: 'Custo da hora', perfil: 2, hora: true }, qtd: (c, f) => f.primeira ? c.P('desenho') : 0 },
  { id: 'e31-formadores', op: 'e31', nome: 'Formadores', alt: 'ambos', classe: 'opex', unidade: 'horas', formula: 'turmas de novos professores × horas do curso × custo da hora do formador',
    params: [{ id: 'turma', rotulo: 'Professores por turma', padrao: 30, comum: true }, { id: 'horas', rotulo: 'Horas do curso', padrao: { com: 30, sem: 20 }, comum: true }],
    preco: { padrao: 0, rotulo: 'Custo da hora', perfil: 2, hora: true }, qtd: (c, f) => turmas(f.nP, c.P('turma')) * c.P('horas') },
  { id: 'e31-encontros', op: 'e31', nome: 'Encontros presenciais na região', alt: 'ambos', classe: 'opex', unidade: 'participante-dia', formula: 'novos professores × dias presenciais × custo por participante por dia (sala e alimentação)',
    params: [{ id: 'presencial', rotulo: 'Parte presencial (%)', padrao: 60, pct: true, comum: true }, { id: 'horas', rotulo: 'Horas do curso', padrao: { com: 30, sem: 20 }, comum: true }],
    preco: { padrao: 12, rotulo: 'Custo por participante por dia', local: true }, qtd: (c, f) => f.nP * Math.ceil(c.P('horas') * c.P('presencial') / 100 / 7) },
  { id: 'e31-deslocamento', op: 'e31', nome: 'Deslocamento dos participantes', alt: 'ambos', classe: 'opex', unidade: 'participante-dia', formula: 'novos professores × dias presenciais × custo por dia',
    params: [{ id: 'presencial', rotulo: 'Parte presencial (%)', padrao: 60, pct: true, comum: true }, { id: 'horas', rotulo: 'Horas do curso', padrao: { com: 30, sem: 20 }, comum: true }],
    preco: { padrao: 15, rotulo: 'Custo por dia', local: true }, qtd: (c, f) => f.nP * Math.ceil(c.P('horas') * c.P('presencial') / 100 / 7) },
  { id: 'e31-plataforma', op: 'e31', nome: 'Plataforma das sessões online', alt: 'ambos', classe: 'opex', unidade: 'turma-mês', formula: 'turmas × meses de curso × licença',
    params: [{ id: 'turma', rotulo: 'Professores por turma', padrao: 30, comum: true }, { id: 'meses', rotulo: 'Meses de curso', padrao: 2 }], preco: { padrao: 50, rotulo: 'Licença por turma por mês' },
    qtd: (c, f) => turmas(f.nP, c.P('turma')) * c.P('meses') },
  { id: 'e31-material', op: 'e31', nome: 'Material do curso', alt: 'ambos', classe: 'opex', unidade: 'professores', formula: 'novos professores × material por professor',
    preco: { padrao: 10, rotulo: 'Custo por professor', local: true }, qtd: (_c, f) => f.nP },
  { id: 'e31-ia', op: 'e31', nome: 'Módulo de uso responsável da IA e proteção de dados', alt: 'com', classe: 'opex', unidade: 'horas', formula: 'turmas × horas a mais × custo da hora do formador',
    params: [{ id: 'turma', rotulo: 'Professores por turma', padrao: 30, comum: true }, { id: 'horasIA', rotulo: 'Horas a mais', padrao: 6 }], preco: { padrao: 0, rotulo: 'Custo da hora', perfil: 2, hora: true },
    qtd: (c, f) => turmas(f.nP, c.P('turma')) * c.P('horasIA') },
  { id: 'e31-tempo', op: 'e31', nome: 'Tempo dos professores em formação', alt: 'ambos', classe: 'opex', unidade: 'horas', informativo: true, formula: 'novos professores × horas do curso × custo da hora do professor (fora do total)',
    params: [{ id: 'horas', rotulo: 'Horas do curso', padrao: { com: 30, sem: 20 }, comum: true }], preco: { padrao: 0, rotulo: 'Custo da hora', perfil: 2, hora: true }, qtd: (c, f) => f.nP * c.P('horas') },
  // ---------------------------------------------------------------- 3.2 desenvolvimento contínuo
  { id: 'e32-continuada', op: 'e32', nome: 'Formação continuada', alt: 'ambos', classe: 'opex', unidade: 'horas', formula: 'turmas de professores × horas por ano × anos × custo da hora do formador',
    params: [{ id: 'turma', rotulo: 'Professores por turma', padrao: 30, comum: true }, { id: 'horas', rotulo: 'Horas por ano', padrao: 10 }], preco: { padrao: 0, rotulo: 'Custo da hora', perfil: 2, hora: true },
    qtd: (c, f) => turmas(f.P, c.P('turma')) * c.P('horas') * anos(f) },
  { id: 'e32-comunidades', op: 'e32', nome: 'Comunidades de prática', alt: 'ambos', classe: 'opex', unidade: 'horas', formula: 'grupos de professores × horas de mediação por mês × meses × custo da hora',
    params: [{ id: 'grupo', rotulo: 'Professores por grupo', padrao: 20 }, { id: 'horas', rotulo: 'Horas por mês', padrao: 2 }], preco: { padrao: 0, rotulo: 'Custo da hora', perfil: 2, hora: true },
    qtd: (c, f) => turmas(f.P, c.P('grupo')) * c.P('horas') * f.meses },
  // ---------------------------------------------------------------- 3.3 apoio técnico e pedagógico
  { id: 'e33-pedagogico', op: 'e33', nome: 'Acompanhamento pedagógico nos locais', alt: 'ambos', classe: 'opex', formula: '1 formador para cada grupo de locais × custo mensal × meses',
    params: [{ id: 'locais', rotulo: 'Locais por formador', padrao: 20 }], papeis: [{ papel: 'Formador de acompanhamento', perfil: 2, porParam: 'locais', base: 'E', ded: 1 }] },
  { id: 'e33-tecnico', op: 'e33', nome: 'Suporte técnico', alt: 'com', classe: 'opex', formula: '1 técnico para cada grupo de locais × custo mensal × meses',
    params: [{ id: 'locais', rotulo: 'Locais por técnico', padrao: 40 }], papeis: [{ papel: 'Técnico de suporte', perfil: 3, porParam: 'locais', base: 'E', ded: 1 }] },
  { id: 'e33-central', op: 'e33', nome: 'Central de atendimento', alt: 'com', classe: 'opex', unidade: 'meses', formula: 'meses × licença da central', preco: { padrao: 200, rotulo: 'Licença por mês' }, qtd: (_c, f) => f.meses },
  { id: 'e33-apoio', op: 'e33', nome: 'Intérpretes e profissionais de apoio', alt: 'ambos', classe: 'opex', formula: '1 profissional para cada grupo de estudantes com deficiência × custo mensal × meses', extra: ['C34'],
    params: [{ id: 'estudantes', rotulo: 'Estudantes por profissional', padrao: 20 }], papeis: [{ papel: 'Profissional de apoio', perfil: 3, porParam: 'estudantes', base: 'def', ded: 1 }] },
  { id: 'e33-orientadores', op: 'e33', nome: 'Orientadores e psicólogos', alt: 'ambos', classe: 'opex', formula: '1 orientador para cada grupo de estudantes × custo mensal × meses', extra: ['C38'],
    params: [{ id: 'estudantes', rotulo: 'Estudantes por orientador', padrao: 500 }], papeis: [{ papel: 'Orientador ou psicólogo', perfil: 2, porParam: 'estudantes', base: 'A', ded: 1 }] },
  // ---------------------------------------------------------------- 3.4 reciclagem e coaching
  { id: 'e34-rotatividade', op: 'e34', nome: 'Formação de quem chega (rotatividade)', alt: 'ambos', classe: 'opex', unidade: 'horas', formula: 'professores × rotatividade por ano × anos ÷ professores por turma × horas do curso × custo da hora do formador',
    params: [{ id: 'rot', rotulo: 'Rotatividade por ano (%)', padrao: 10, pct: true }, { id: 'turma', rotulo: 'Professores por turma', padrao: 30, comum: true }, { id: 'horas', rotulo: 'Horas do curso', padrao: { com: 30, sem: 20 } }],
    preco: { padrao: 0, rotulo: 'Custo da hora', perfil: 2, hora: true }, qtd: (c, f) => f.P * c.P('rot') / 100 * anos(f) / Math.max(1, c.P('turma')) * c.P('horas') },
  { id: 'e34-coaching', op: 'e34', nome: 'Coaching individual', alt: 'ambos', classe: 'opex', unidade: 'sessões', formula: 'professores com coaching × sessões por ano × anos × custo da sessão (1 hora)',
    params: [{ id: 'parte', rotulo: 'Professores com coaching (%)', padrao: 20, pct: true }, { id: 'sessoes', rotulo: 'Sessões por ano', padrao: 4 }],
    preco: { padrao: 0, rotulo: 'Custo da hora', perfil: 2, hora: true }, qtd: (c, f) => f.P * c.P('parte') / 100 * c.P('sessoes') * anos(f) },
  { id: 'e34-versoes', op: 'e34', nome: 'Atualização nas novas versões da ferramenta', alt: 'com', classe: 'opex', unidade: 'horas', formula: 'turmas de professores × horas por ano × anos × custo da hora do formador',
    params: [{ id: 'turma', rotulo: 'Professores por turma', padrao: 30, comum: true }, { id: 'horas', rotulo: 'Horas por ano', padrao: 4 }], preco: { padrao: 0, rotulo: 'Custo da hora', perfil: 2, hora: true },
    qtd: (c, f) => turmas(f.P, c.P('turma')) * c.P('horas') * anos(f) },
  // ---------------------------------------------------------------- 4.1 conteúdos e materiais
  { id: 'e41-impresso', op: 'e41', nome: 'Material impresso do estudante', alt: 'sem', classe: 'opex', unidade: 'páginas', formula: '(novos estudantes e reposição anual dos que seguem) × páginas × preço por página',
    params: [{ id: 'paginas', rotulo: 'Páginas por estudante', padrao: 200 }, { id: 'repos', rotulo: 'Reposição por ano (%)', padrao: 30, pct: true }], preco: { padrao: 0.03, rotulo: 'Preço por página', local: true },
    qtd: (c, f) => (f.nA + (f.A - f.nA) * c.P('repos') / 100 * anos(f)) * c.P('paginas') },
  { id: 'e41-guia', op: 'e41', nome: 'Guia do professor', alt: 'ambos', classe: 'opex', unidade: 'professores', formula: 'novos professores × preço do guia', preco: { padrao: 15, rotulo: 'Preço do guia', local: true }, qtd: (_c, f) => f.nP },
  { id: 'e41-criacao', op: 'e41', nome: 'Criação de conteúdo próprio', alt: 'ambos', classe: 'capex', unidade: 'horas', formula: 'unidades didáticas × horas por unidade × custo da hora do especialista (uma vez; o conteúdo fica para a rede)',
    params: [{ id: 'unidades', rotulo: 'Unidades didáticas', padrao: 20, comum: true }, { id: 'horas', rotulo: 'Horas por unidade', padrao: { com: 20, sem: 40 } }], preco: { padrao: 0, rotulo: 'Custo da hora', perfil: 2, hora: true },
    qtd: (c, f) => f.primeira ? c.P('unidades') * c.P('horas') : 0 },
  { id: 'e41-atualizacao', op: 'e41', nome: 'Atualização e revisão do conteúdo', alt: 'ambos', classe: 'opex', formula: 'percentual por ano do investimento na criação do conteúdo',
    params: [{ id: 'pct', rotulo: 'Atualização por ano (% da criação)', padrao: 15, pct: true }], pctDe: { ids: ['e41-criacao'], modo: 'ano', param: 'pct' } },
  { id: 'e41-revisao', op: 'e41', nome: 'Revisão pedagógica e de viés', alt: 'ambos', classe: 'opex', unidade: 'horas', formula: 'unidades didáticas × horas de revisão × custo da hora (uma vez)',
    params: [{ id: 'unidades', rotulo: 'Unidades didáticas', padrao: 20, comum: true }, { id: 'horas', rotulo: 'Horas de revisão por unidade', padrao: { com: 8, sem: 4 } }], preco: { padrao: 0, rotulo: 'Custo da hora', perfil: 2, hora: true },
    qtd: (c, f) => f.primeira ? c.P('unidades') * c.P('horas') : 0 },
  { id: 'e41-distribuicao', op: 'e41', nome: 'Distribuição do material', alt: 'sem', classe: 'opex', unidade: 'locais', formula: 'locais × entregas por ano × anos × custo da entrega',
    params: [{ id: 'entregas', rotulo: 'Entregas por ano', padrao: 1 }], preco: { padrao: 40, rotulo: 'Custo por entrega', local: true }, qtd: (c, f) => (f.E || Math.ceil(f.A / 30)) * Math.max(1, Math.round(c.P('entregas') * anos(f))) },
  { id: 'e41-manipulaveis', op: 'e41', nome: 'Materiais manipuláveis e jogos', alt: 'ambos', classe: 'opex', unidade: 'estudantes', formula: 'novos estudantes × conjunto por estudante', extra: ['C31'],
    preco: { padrao: 12, rotulo: 'Custo por estudante', local: true }, qtd: (_c, f) => f.nA },
  // ---------------------------------------------------------------- 4.2 plataformas e licenças
  { id: 'e42-licenca', op: 'e42', nome: 'Plataforma de aprendizagem', alt: 'ambos', classe: 'opex', unidade: 'usuário-ano', formula: 'estudantes e professores × anos × licença por usuário por ano',
    preco: { padrao: { com: 8, sem: 3 }, rotulo: 'Licença por usuário por ano' }, qtd: (_c, f) => (f.A + f.P) * anos(f), oferta: e => platEf(e) === 'paga' },
  { id: 'e42-config', op: 'e42', nome: 'Configuração e personalização da plataforma', alt: 'ambos', classe: 'capex', unidade: 'horas', formula: 'horas × custo da hora (uma vez)',
    params: [{ id: 'horas', rotulo: 'Horas', padrao: 80 }], preco: { padrao: 0, rotulo: 'Custo da hora', perfil: 3, hora: true }, qtd: (c, f) => f.primeira ? c.P('horas') : 0 },
  { id: 'e42-suporte', op: 'e42', nome: 'Suporte e atualizações do fornecedor', alt: 'ambos', classe: 'opex', formula: 'percentual sobre a licença da plataforma',
    params: [{ id: 'pct', rotulo: 'Percentual sobre a licença (%)', padrao: 15, pct: true }], pctDe: { ids: ['e42-licenca'], modo: 'fase', param: 'pct' }, oferta: e => platEf(e) === 'paga' },
  { id: 'e42-manutencao', op: 'e42', nome: 'Manutenção e atualização da plataforma aberta', alt: 'ambos', classe: 'opex', unidade: 'horas', formula: 'horas por mês × meses × custo da hora',
    params: [{ id: 'horas', rotulo: 'Horas por mês', padrao: 20 }], preco: { padrao: 0, rotulo: 'Custo da hora', perfil: 3, hora: true }, qtd: (c, f) => c.P('horas') * f.meses,
    oferta: e => platEf(e) === 'aberta' },
  { id: 'e42-saida', op: 'e42', nome: 'Saída do contrato (exportação e migração dos dados)', alt: 'ambos', classe: 'opex', unidade: 'horas', formula: 'horas de exportação e migração × custo da hora, no fim do plano',
    params: [{ id: 'horas', rotulo: 'Horas', padrao: 120 }], preco: { padrao: 0, rotulo: 'Custo da hora', perfil: 3, hora: true }, qtd: (c, f) => f.ultima ? c.P('horas') : 0 },
  // ---------------------------------------------------------------- 4.3 ferramentas de IA (só com IA)
  { id: 'e43-licenca', op: 'e43', nome: 'Licenças da ferramenta para estudantes', alt: 'com', classe: 'opex', unidade: 'licença-mês', formula: 'estudantes com licença × meses × preço da licença',
    params: [{ id: 'parte', rotulo: 'Estudantes com licença (%)', padrao: 100, pct: true }], preco: { padrao: 2, rotulo: 'Licença por estudante por mês' },
    ia: e => naoPublica(e) && (e.arq === 'saas' || e.arq === 'preditivo') && e.pag === 'usuario', qtd: (c, f) => licPaga(c.ia) ? f.A * c.P('parte') / 100 * f.meses : 0,
    nota: 'Ferramenta pública ou incluída numa plataforma que a rede já paga: sem licença.' },
  { id: 'e43-licencaProf', op: 'e43', nome: 'Licenças da ferramenta para professores', alt: 'com', classe: 'opex', unidade: 'licença-mês', formula: 'professores × meses × preço da licença',
    preco: { padrao: 9, rotulo: 'Licença por professor por mês' }, ia: e => naoPublica(e) && (e.arq === 'saas' || e.arq === 'preditivo') && e.pag === 'usuario', qtd: (c, f) => licPaga(c.ia) ? f.P * f.meses : 0 },
  { id: 'e43-gratuito', op: 'e43', nome: 'Licenças depois do período gratuito', alt: 'com', classe: 'opex', unidade: 'licença-mês', formula: 'gratuita na prova de conceito e no piloto; depois, estudantes e professores × meses × preço médio da licença',
    preco: { padrao: 3, rotulo: 'Licença média por usuário por mês' }, ia: e => naoPublica(e) && e.pag === 'gratuito', qtd: (_c, f) => em(f, fasesEscala) ? (f.A + f.P) * f.meses : 0 },
  { id: 'e43-institucional', op: 'e43', nome: 'Assinatura institucional', alt: 'com', classe: 'opex', unidade: 'anos', formula: 'anos × valor anual da assinatura',
    preco: { padrao: 50000, rotulo: 'Valor por ano' }, ia: e => naoPublica(e) && e.pag === 'institucional', qtd: (c, f) => licPaga(c.ia) ? anos(f) : 0 },
  { id: 'e43-tokens', op: 'e43', nome: 'Consumo do modelo de IA (tokens)', alt: 'com', classe: 'uso', unidade: 'milhões de tokens', formula: 'usuários ativos × interações por mês × tokens por interação × meses × preço por milhão de tokens',
    params: [{ id: 'ativos', rotulo: 'Usuários ativos (%)', padrao: 60, pct: true }, { id: 'interacoes', rotulo: 'Interações por usuário por mês', padrao: 40 }, { id: 'tokens', rotulo: 'Tokens por interação (entrada e saída)', padrao: 3000 }],
    preco: { padrao: 4, rotulo: 'Preço por milhão de tokens' }, ia: e => naoPublica(e) && (e.arq === 'api' || e.arq === 'ow_api' || (e.pag === 'consumo' && e.arq !== 'ow' && e.arq !== 'preditivo')),
    qtd: (c, f) => (f.A + f.P) * c.P('ativos') / 100 * c.P('interacoes') * c.P('tokens') / 1e6 * f.meses,
    nota: 'Preço médio ponderado de um modelo intermediário: 2 US$ por milhão de tokens de entrada e 10 US$ de saída, com chamadas auxiliares (base de referências da ferramenta, grau C).' },
  { id: 'e43-rag', op: 'e43', nome: 'Base de conhecimento (RAG)', alt: 'com', classe: 'opex', unidade: 'meses', formula: 'meses × banco vetorial e indexação dos documentos',
    preco: { padrao: 200, rotulo: 'Custo por mês' }, ia: e => naoPublica(e) && (e.arq === 'api' || e.arq === 'ow_api'), qtd: (_c, f) => f.meses },
  { id: 'e43-desenvolvimento', op: 'e43', nome: 'Desenvolvimento da aplicação e integrações', alt: 'com', classe: 'capex', unidade: 'projetos', formula: 'um projeto de desenvolvimento (uma vez)',
    preco: { padrao: 110000, rotulo: 'Custo do projeto', porArq: { saas: 80000, api: 110000, ow_api: 110000, ow: 180000, preditivo: 60000 } }, ia: appOperada, qtd: (_c, f) => f.primeira ? 1 : 0,
    nota: 'Exemplo B do guia: US$ 110 mil (aplicação com API e RAG); exemplo C: US$ 180 mil (pesos abertos). Ajuste ao seu caso.' },
  { id: 'e43-manutencao', op: 'e43', nome: 'Manutenção evolutiva da aplicação', alt: 'com', classe: 'opex', formula: 'percentual por ano do desenvolvimento',
    params: [{ id: 'pct', rotulo: 'Manutenção por ano (% do desenvolvimento)', padrao: 20, pct: true }], pctDe: { ids: ['e43-desenvolvimento'], modo: 'ano', param: 'pct' },
    ia: appOperada },
  { id: 'e43-gpu', op: 'e43', nome: 'GPUs de inferência', alt: 'com', classe: 'uso', unidade: 'horas de GPU', formula: 'GPUs necessárias no pico × horas por mês × meses × preço da hora de GPU',
    params: [{ id: 'ativos', rotulo: 'Usuários ativos (%)', padrao: 60, pct: true }, { id: 'porGpu', rotulo: 'Usuários ativos por GPU', padrao: 2500 }, { id: 'minimo', rotulo: 'GPUs mínimas', padrao: 2 }],
    preco: { padrao: 1.32, rotulo: 'Preço da hora de GPU' }, ia: e => naoPublica(e) && e.arq === 'ow',
    qtd: (c, f) => Math.max(c.P('minimo'), Math.ceil((f.A + f.P) * c.P('ativos') / 100 / Math.max(1, c.P('porGpu')))) * 730 * f.meses },
  { id: 'e43-infra', op: 'e43', nome: 'Armazenamento, rede e registros do modelo', alt: 'com', classe: 'opex', unidade: 'meses', formula: 'meses × custo mensal',
    preco: { padrao: 1500, rotulo: 'Custo por mês' }, ia: e => naoPublica(e) && e.arq === 'ow', qtd: (_c, f) => f.meses },
  { id: 'e43-equipe', op: 'e43', nome: 'Engenharia de ML e operação do modelo', alt: 'com', classe: 'opex', formula: 'pessoas × dedicação × custo mensal × meses',
    ia: e => naoPublica(e) && (e.arq === 'ow' || e.arq === 'preditivo'), papeis: [{ papel: 'Engenheiro de ML', perfil: 2, pessoas: 1, ded: 1 }] },
  { id: 'e43-equipeAberta', op: 'e43', nome: 'Equipe técnica da solução aberta', alt: 'com', classe: 'opex', formula: 'pessoas × dedicação × custo mensal × meses',
    ia: e => tipoEf(e.tipo) === 'aberta' && e.arq !== 'ow' && e.arq !== 'preditivo', papeis: [{ papel: 'Desenvolvedor', perfil: 2, pessoas: 1, ded: 0.5 }] },
  { id: 'e43-treino', op: 'e43', nome: 'Preparação dos dados e treinamento do modelo', alt: 'com', classe: 'capex', unidade: 'projetos', formula: 'um treinamento inicial (uma vez); o retreino anual entra na manutenção',
    preco: { padrao: 40000, rotulo: 'Custo' }, ia: e => naoPublica(e) && e.arq === 'preditivo', qtd: (_c, f) => f.primeira ? 1 : 0 },
  { id: 'e43-moderacao', op: 'e43', nome: 'Filtros de conteúdo e moderação', alt: 'com', classe: 'opex', formula: 'percentual sobre a licença ou o consumo da ferramenta',
    params: [{ id: 'pct', rotulo: 'Percentual (%)', padrao: 10, pct: true }], pctDe: { ids: ['e43-licenca', 'e43-licencaProf', 'e43-gratuito', 'e43-institucional', 'e43-tokens', 'e43-gpu'], modo: 'fase', param: 'pct' } },
  { id: 'e43-qualidade', op: 'e43', nome: 'Avaliação da qualidade das respostas', alt: 'com', classe: 'opex', unidade: 'horas', formula: 'amostras por mês × minutos por amostra × meses × custo da hora',
    params: [{ id: 'amostras', rotulo: 'Amostras por mês', padrao: 100 }, { id: 'minutos', rotulo: 'Minutos por amostra', padrao: 5 }], preco: { padrao: 0, rotulo: 'Custo da hora', perfil: 2, hora: true },
    qtd: (c, f) => c.P('amostras') * c.P('minutos') / 60 * f.meses },
  { id: 'e43-juridico', op: 'e43', nome: 'Revisão jurídica do contrato e dos termos', alt: 'com', classe: 'opex', unidade: 'revisões', formula: 'uma revisão antes de contratar',
    preco: { padrao: 8000, rotulo: 'Custo da revisão', local: true }, ia: e => e.lic !== 'aberta', qtd: (_c, f) => f.primeira ? 1 : 0 },
  { id: 'e43-saida', op: 'e43', nome: 'Saída e troca de fornecedor', alt: 'com', classe: 'opex', unidade: 'saídas', formula: 'exportação dos dados, nova base de conhecimento, novos testes e desativação, no fim do plano',
    preco: { padrao: 18000, rotulo: 'Custo da saída', porArq: { saas: 18000, api: 27000, ow_api: 27000, ow: 55000, preditivo: 27000 } }, qtd: (_c, f) => f.ultima ? 1 : 0,
    nota: 'Exemplo A do guia: US$ 18 mil (produto por licença); B: US$ 27 mil (API e RAG); C: US$ 55 mil (pesos abertos).' },
  // ---------------------------------------------------------------- 4.4 acessíveis, multilíngues e offline
  { id: 'e44-traducao', op: 'e44', nome: 'Tradução para as línguas locais', alt: 'ambos', classe: 'capex', unidade: 'palavras', formula: '(línguas − 1) × palavras × parte revisada por pessoas × preço por palavra (uma vez)',
    params: [{ id: 'palavras', rotulo: 'Palavras do material', padrao: 60000 }, { id: 'revisao', rotulo: 'Parte traduzida ou revisada por pessoas (%)', padrao: { com: 30, sem: 100 }, pct: true }],
    preco: { padrao: 0.08, rotulo: 'Preço por palavra' }, qtd: (c, f) => f.primeira ? Math.max(0, c.p.linguas - 1) * c.P('palavras') * c.P('revisao') / 100 : 0 },
  { id: 'e44-revisores', op: 'e44', nome: 'Revisores linguísticos', alt: 'ambos', classe: 'opex', unidade: 'horas', formula: '(línguas − 1) × horas por língua × custo da hora', extra: ['C35'],
    params: [{ id: 'horas', rotulo: 'Horas por língua', padrao: 80 }], preco: { padrao: 0, rotulo: 'Custo da hora', perfil: 2, hora: true }, qtd: (c, f) => f.primeira ? Math.max(0, c.p.linguas - 1) * c.P('horas') : 0 },
  { id: 'e44-acessivel', op: 'e44', nome: 'Material acessível', alt: 'ambos', classe: 'opex', unidade: 'estudante-ano', formula: 'estudantes com deficiência × anos × custo por estudante (braille, áudio, língua de sinais)',
    preco: { padrao: 60, rotulo: 'Custo por estudante por ano', local: true }, qtd: (c, f) => f.A * c.p.deficiencia / 100 * anos(f) },
  { id: 'e44-offline', op: 'e44', nome: 'Pacote offline por local', alt: 'ambos', classe: 'capex', unidade: 'locais', infra: true, formula: 'novos locais sem internet × pacote de conteúdo offline', vida: 'vida',
    params: [{ id: 'vida', rotulo: 'Vida útil (meses)', padrao: 60 }], preco: { padrao: 350, rotulo: 'Custo por local' }, qtd: (c, f) => f.nEi * (c.p.modalidade === 'offline' ? 1 : c.p.semInternet / 100) },
  { id: 'e44-atualizacao', op: 'e44', nome: 'Atualização dos pacotes offline', alt: 'ambos', classe: 'opex', unidade: 'visitas', infra: true, formula: 'locais sem internet × visitas por ano × anos × custo da visita',
    params: [{ id: 'visitas', rotulo: 'Visitas por ano', padrao: 2 }], preco: { padrao: 30, rotulo: 'Custo por visita', local: true },
    qtd: (c, f) => f.Ei * (c.p.modalidade === 'offline' ? 1 : c.p.semInternet / 100) * c.P('visitas') * anos(f) },
];
export const COMP_POR_ID: Record<string, CompDef> = Object.fromEntries(COMPONENTES.map(c => [c.id, c]));
export const compsDaOpcao = (op: string) => COMPONENTES.filter(c => c.op === op);
export const vale = (c: { alt: AltSel }, a: Alternativa) => c.alt === 'ambos' || c.alt === a;

// ------------------------------------------------------------------ quantidades por fase
/** Fases com estudantes, professores e locais; ref = fases de outro desafio com as mesmas escolas. */
export function fasesCalc(s: Pick<Estado14, 'ctx'>, d: string, ref?: FaseCalc[]): FaseCalc[] {
  const p = publico(s, d), fs = fases(s, d), poc = escolasPoc(s, d);
  const semLocal = p.ambiente === 'casa' || p.modalidade === 'online';
  const fracCasa = p.ambiente === 'casa' || p.modalidade === 'online' ? 1 : p.modalidade === 'hibrida' ? 0.5 : 0;
  const ativas = fs.filter(f => f.meses > 0);
  let antE = 0, antA = 0, antP = 0, antEi = 0, inicio = 0;
  return ativas.map((f, i) => {
    let E: number, A: number, P: number;
    if (f.id === 'poc') {
      E = p.escolas ? Math.min(p.escolas, poc) : 0;
      const parte = p.escolas ? E / p.escolas : Math.min(1, poc * 30 / Math.max(1, p.estudantes));
      A = Math.round(p.estudantes * parte); P = Math.max(1, Math.round(p.professores * parte));
    } else { E = Math.ceil(p.escolas * f.alcance / 100); A = Math.round(p.estudantes * f.alcance / 100); P = Math.round(p.professores * f.alcance / 100); }
    E = Math.max(E, antE); A = Math.max(A, antA); P = Math.max(P, antP);
    const r = ref?.find(x => x.id === f.id);
    const Ei = semLocal ? 0 : Math.max(0, E - (r ? r.E : 0)), nEi = Math.max(0, Ei - antEi);
    const fc: FaseCalc = { id: f.id, nome: f.nome, meses: f.meses, i, inicio, E, A, P, nE: Math.max(0, E - antE), nA: Math.max(0, A - antA), nP: Math.max(0, P - antP), Ei, nEi,
      casa: Math.round(A * fracCasa), primeira: i === 0, ultima: i === ativas.length - 1 };
    antE = E; antA = A; antP = P; antEi = Ei; inicio += f.meses;
    return fc;
  });
}

// ------------------------------------------------------------------ cálculo
export interface ValorFase { fase: string; qtd: number; unit: number; valor: number }
export interface PapelCalc { papel: string; perfil: Grupo; pessoas: number; ded: number; unit: number; unitRef: number; extra?: string; alt: AltSel; valor: number }
export interface CompCalc {
  def: CompDef; alt: Alternativa; on: boolean; ligadoPadrao: boolean; motivo?: string;
  unit: number; unitRef: number; params: Record<string, number>; porFase: ValorFase[]; papeis: PapelCalc[];
  k: number; x: number; u: number; total: number; pessoas: number;
}
export interface OpcaoCalc { op: string; comps: CompCalc[]; com: { k: number; x: number; u: number; total: number }; sem: { k: number; x: number; u: number; total: number } }
export interface DesafioCalc { d: string; fases: FaseCalc[]; opcoes: OpcaoCalc[]; ref: string }

interface Precos { moeda: string; taxa: number; nivel: number; iso?: string }
/** Custo mensal de um perfil (ILOSTAT, com encargos) na moeda do plano. */
export function mensalPerfil(pr: Precos, perfil: Grupo): number {
  const sal = salarioDoPais(pr.iso, perfil, pr.moeda, pr.taxa);
  const base = sal ? sal.mensal : MEDIANA_MUNDIAL[perfil] * pr.taxa;
  return Math.round(base * fatorEncargos(pr.iso) * 100) / 100;
}
function precoRef(def: CompDef, a: Alternativa, pr: Precos, ia: EscolhaIA): number {
  const p = def.preco; if (!p) return 0;
  if (p.perfil) { const m = mensalPerfil(pr, p.perfil); return Math.round((p.hora ? m / HORAS_MES : m) * 100) / 100; }
  const usd = p.porArq && p.porArq[ia.arq] !== undefined ? p.porArq[ia.arq] : typeof p.padrao === 'number' ? p.padrao : p.padrao[a];
  return arredPreco(usd * (p.local ? pr.nivel : 1) * pr.taxa);
}
/** Centavos; preços menores que 1 (página, kWh, GB) com quatro casas. */
const arredPreco = (v: number) => v >= 1 ? Math.round(v * 100) / 100 : Math.round(v * 1e4) / 1e4;
const lerNum = (v: unknown, a: Alternativa): number | undefined => {
  const x = typeof v === 'object' && v !== null ? (v as any)[a] : v;
  return typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : undefined;
};
export const padraoParam = (pd: ParamDef, a: Alternativa) => typeof pd.padrao === 'number' ? pd.padrao : pd.padrao[a];
/** A linha vem ligada? Itens próprios só no desafio deles; itens que dependem do contexto ou da escolha de IA, quando se aplicam. */
export function ligadoPadrao(def: CompDef, d: string, p: PublicoDesafio, ia: EscolhaIA, a: Alternativa = 'com'): { on: boolean; motivo?: string } {
  if (def.extra && !def.extra.includes(d)) return { on: false, motivo: 'item próprio de outro desafio' };
  if ((def.ia && !def.ia(ia)) || (def.oferta && !def.oferta(ia, a))) return { on: false, motivo: 'não se aplica à forma de oferta escolhida' };
  if (def.quando && !def.quando({ d, p, ia, fs: [], meses: 0 })) return { on: false, motivo: 'não se aplica ao público e ambiente deste desafio' };
  return { on: true };
}

function calcComp(def: CompDef, a: Alternativa, d: string, p: PublicoDesafio, fs: FaseCalc[], ia: EscolhaIA, pr: Precos, sob: SobreLinha, extras: PapelExtraEd[], prontos: Record<string, CompCalc>, sobOp: SobreLinha = {}): CompCalc {
  const lp = ligadoPadrao(def, d, p, ia, a), on = sob.off ? false : sob.on ? true : lp.on;
  const params: Record<string, number> = {};
  for (const pd of def.params || []) params[pd.id] = lerNum((pd.comum ? sobOp : sob).p?.[pd.id], a) ?? padraoParam(pd, a);
  const mult = def.preco?.mult ? 1 + (params[def.preco.mult] || 0) / 100 : 1;
  const unitRef = arredPreco(precoRef(def, a, pr, ia) * mult), unit = lerNum(sob.unit, a) ?? unitRef;
  const meses = fs.reduce((n, f) => n + f.meses, 0);
  const c: Ctx = { d, p, alt: a, P: (id: string) => params[id] ?? 0, ia, fs, meses };
  let porFase: ValorFase[] = fs.map(f => ({ fase: f.id, qtd: 0, unit, valor: 0 }));
  const papeis: PapelCalc[] = [];
  if (def.papeis) {
    const lista = [...def.papeis.map(x => ({ ...x, extra: undefined as string | undefined })), ...extras.map(x => ({ papel: x.papel || t('Novo papel'), perfil: x.perfil, pessoas: x.pessoas, ded: x.ded, alt: x.alt, extra: x.id, fases: undefined as string[] | undefined, porParam: undefined as string | undefined, base: undefined as any }))];
    for (const r of lista) {
      if (r.alt && r.alt !== 'ambos' && r.alt !== a) continue;
      const so = r.extra ? {} : (sob.papeis?.[r.papel] || {});
      const ref = mensalPerfil(pr, r.perfil), u = r.extra ? (lerNum(extras.find(x => x.id === r.extra)?.unit, a) ?? ref) : (lerNum(so.unit, a) ?? ref);
      const ded = lerNum(so.ded, a) ?? r.ded;
      let total = 0, pessoasMax = 0;
      porFase = porFase.map((v, i) => {
        const f = fs[i]; if (r.fases && !r.fases.includes(f.id)) return v;
        const baseN = r.base === 'E' ? (f.E || Math.ceil(f.A / 30)) : r.base === 'A' ? f.A : r.base === 'P' ? f.P : r.base === 'def' ? f.A * p.deficiencia / 100 : 0;
        const n = lerNum(so.pessoas, a) ?? (r.porParam ? Math.ceil(baseN / Math.max(1, c.P(r.porParam))) : r.pessoas || 0);
        pessoasMax = Math.max(pessoasMax, n);
        const val = n * ded * u * f.meses; total += val;
        return { ...v, qtd: v.qtd + n * ded * f.meses, valor: v.valor + val };
      });
      papeis.push({ papel: r.papel, perfil: r.perfil, pessoas: pessoasMax, ded, unit: u, unitRef: ref, extra: r.extra, alt: r.alt || 'ambos', valor: total });
    }
  } else if (def.pctDe) {
    const pct = c.P(def.pctDe.param) / 100;
    const bases = def.pctDe.ids.map(id => prontos[id + ':' + a]).filter(Boolean);
    if (def.pctDe.modo === 'fase') porFase = porFase.map((v, i) => { const b = bases.reduce((n, x) => n + (x.on ? x.porFase[i].valor : 0), 0); return { ...v, qtd: b, unit: pct, valor: b * pct }; });
    else { let acum = 0; porFase = porFase.map((v, i) => { acum += bases.reduce((n, x) => n + (x.on ? x.porFase[i].valor : 0), 0); const b = acum * anos(fs[i]); return { ...v, qtd: b, unit: pct, valor: b * pct }; }); }
  } else if (def.qtd) {
    const q = fs.map(f => Math.max(0, def.qtd!(c, f) || 0));
    // reposição: o que foi comprado numa fase volta a ser comprado quando a vida útil acaba dentro do plano
    if (def.vida && params[def.vida] > 0) {
      const vida = params[def.vida], compras = [...q];
      for (let j = 0; j < fs.length; j++) for (let tt = fs[j].inicio + vida; tt < meses; tt += vida) {
        const k = fs.findIndex(f => tt >= f.inicio && tt < f.inicio + f.meses); if (k >= 0) q[k] += compras[j];
      }
    }
    porFase = porFase.map((v, i) => ({ ...v, qtd: q[i], valor: q[i] * unit }));
  }
  porFase = porFase.map(v => ({ ...v, valor: Math.round(v.valor * 100) / 100 }));
  const total = on ? porFase.reduce((n, v) => n + v.valor, 0) : 0;
  const k = def.classe === 'capex' ? total : 0, x = def.classe === 'opex' ? total : 0, u = def.classe === 'uso' ? total : 0;
  return { def, alt: a, on, ligadoPadrao: lp.on, motivo: lp.motivo, unit, unitRef, params, porFase, papeis, k, x, u, total, pessoas: def.papeis || def.preco?.perfil ? total : 0 };
}

function precosDoCaso(s: Pick<Estado14, 'ctx' | 'moeda'>): Precos {
  const moeda = String(s.moeda?.cod || 'USD'), iso = (s as any).caso?.pais as string | undefined;
  return { moeda, taxa: taxaV16(moeda, s) ?? 1, nivel: nivelPrecos(iso).v, iso };
}
/** Todas as linhas de um desafio, nas duas alternativas. */
export function calcularDesafio(s: Pick<Estado14, 'ctx' | 'moeda'>, d: string, cache: Record<string, FaseCalc[]> = {}): DesafioCalc {
  const pr = precosDoCaso(s), p = publico(s, d), ia = escolhaIA(s, d), e = lerEd(s);
  const ref = p.mesmas ? (cache[p.mesmas] || fasesCalc(s, p.mesmas)) : undefined;
  const fs = fasesCalc(s, d, ref); cache[d] = fs;
  const opcoes: OpcaoCalc[] = [];
  for (const op of opcoesEscolhidas(s, d)) {
    const prontos: Record<string, CompCalc> = {}, comps: CompCalc[] = [];
    for (const def of compsDaOpcao(op)) for (const a of ['com', 'sem'] as Alternativa[]) {
      if (!vale(def, a)) continue;
      const cc = calcComp(def, a, d, p, fs, ia, pr, e.linhas?.[d]?.[def.id] || {}, (e.extras?.[d]?.[def.id] || []), prontos, e.linhas?.[d]?.[op] || {});
      prontos[def.id + ':' + a] = cc; comps.push(cc);
    }
    const soma = (a: Alternativa) => { const cs = comps.filter(c => c.alt === a && !c.def.informativo); const r2 = (v: number) => Math.round(v * 100) / 100;
      return { k: r2(cs.reduce((n, c) => n + c.k, 0)), x: r2(cs.reduce((n, c) => n + c.x, 0)), u: r2(cs.reduce((n, c) => n + c.u, 0)), total: r2(cs.reduce((n, c) => n + c.total, 0)) }; };
    opcoes.push({ op, comps, com: soma('com'), sem: soma('sem') });
  }
  return { d, fases: fs, opcoes, ref: p.mesmas };
}

export interface Linha { desafio: string; opcao: string; cat: string; alt: Alternativa; total: number; k: number; x: number; u: number; porFase: Record<string, number>; pessoas: number; conta: string }
export interface ResultadoAlt { linhas: Linha[]; k: number; x: number; u: number; direto: number; P: number; V: number; O: number; T: number; total: number; porFase: Record<string, number>; porDesafio: Record<string, number>; porCategoria: Record<string, number>; estudantes: number; porEstudante: number | null }
export interface ResultadoEd { moeda: string; taxa: number; nivel: number; fases: Fase[]; meses: number; com: ResultadoAlt; sem: ResultadoAlt; desafios: string[]; porDesafio: Record<string, DesafioCalc> }

/** Calcula o plano nas duas alternativas, na moeda do caso. */
export function orcamentoEducacao(s: Pick<Estado14, 'ctx' | 'moeda'>): ResultadoEd {
  const pr = precosDoCaso(s), ds = desafiosEscolhidos(s), sv = lerEd(s);
  const pV = (sv.pV ?? SIM.viagens) / 100, pO = (sv.pO ?? SIM.overhead) / 100, pT = (sv.pT ?? SIM.taxa) / 100;
  const cache: Record<string, FaseCalc[]> = {}, porD: Record<string, DesafioCalc> = {};
  for (const d of ds) porD[d] = calcularDesafio(s, d, cache);
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const alt = (a: Alternativa): ResultadoAlt => {
    const linhas: Linha[] = [];
    for (const d of ds) for (const o of porD[d].opcoes) {
      if (OPCOES_ED[o.op].so && OPCOES_ED[o.op].so !== a) continue;
      const cs = o.comps.filter(c => c.alt === a && !c.def.informativo);
      const pf: Record<string, number> = {};
      porD[d].fases.forEach((f, i) => { pf[f.id] = r2(cs.reduce((n, c) => n + (c.on ? c.porFase[i].valor : 0), 0)); });
      linhas.push({ desafio: d, opcao: o.op, cat: OPCOES_ED[o.op].cat, alt: a, k: o[a].k, x: o[a].x, u: o[a].u, total: o[a].total, porFase: pf, pessoas: r2(cs.reduce((n, c) => n + c.pessoas, 0)), conta: '' });
    }
    const soma = (f: (l: Linha) => number) => r2(linhas.reduce((n, l) => n + f(l), 0));
    const direto = soma(l => l.total), P = soma(l => l.pessoas);
    const V = r2(pV * P), O = r2(pO * (P + V)), T = r2(pT * (direto + V));
    const adic = V + O + T, fatorAd = direto ? adic / direto : 0;
    const k = soma(l => l.k), u = soma(l => l.u), total = r2(direto + adic);
    const porFase = Object.fromEntries(FASES_PADRAO.map(f => [f.id, r2(soma(l => l.porFase[f.id] || 0) * (1 + fatorAd))]));
    const porDesafio = Object.fromEntries(ds.map(d => [d, r2(linhas.filter(l => l.desafio === d).reduce((n, l) => n + l.total, 0) * (1 + fatorAd))]));
    const porCategoria = Object.fromEntries(CATEGORIAS_ED.map(c => [c.id, r2(linhas.filter(l => l.cat === c.id).reduce((n, l) => n + l.total, 0))]));
    const estudantes = ds.reduce((n, d) => n + publico(s, d).estudantes, 0);
    return { linhas, k, x: r2(total - k - u), u, direto, P, V, O, T, total, porFase, porDesafio, porCategoria, estudantes, porEstudante: estudantes ? r2(total / estudantes) : null };
  };
  const meses = ds.length ? Math.max(...ds.map(d => fases(s, d).reduce((n, f) => n + f.meses, 0))) : fases(s).reduce((n, f) => n + f.meses, 0);
  // fases para os quadros: as do primeiro desafio (cada desafio pode ter as suas)
  return { moeda: pr.moeda, taxa: pr.taxa, nivel: pr.nivel, fases: fases(s, ds[0]), meses, com: alt('com'), sem: alt('sem'), desafios: ds, porDesafio: porD };
}

/** Nome traduzido de um desafio. */
export const nomeDesafio = (id: string) => t(DESAFIOS_ED.find(d => d.id === id)?.nome || id);
