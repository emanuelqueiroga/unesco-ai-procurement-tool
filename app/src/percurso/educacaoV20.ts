// v020: modelo de custo de "Educating with and without AI" a partir da figura do projeto: desafios educacionais, quatro
// categorias compartilhadas aplicadas a cada desafio (escala e implementação, infraestrutura, formação docente,
// recursos), as quatro fases do ciclo (prova de conceito, piloto, implantação, expansão) e a comparação, sempre, entre a
// alternativa com IA e a sem IA. Cada parte é investimento (CapEx), operação (OpEx) ou uso.
// VALORES SIMULADOS (grau C): os custos unitários abaixo servem para validar o ciclo e o fluxo das telas; serão
// substituídos por valores com fonte. Serviços locais (equipes, formação, manutenção) são ajustados pelo nível de preços
// do país; bens comercializados internacionalmente (dispositivos, licenças, uso de IA) não.
import type { Estado14 } from '../store/tipos';
import { DESAFIOS_EDU_V016 } from '../domain/catalogo_v016.js';
import { nivelPrecos, matriculasMil } from './formacaoGov';
import { taxaV16 } from './orcamentoV016';
import { t } from './textos';

export type Classe = 'capex' | 'opex' | 'uso';
export type Alternativa = 'com' | 'sem';
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
export const MODALIDADES = [['presencial', 'Presencial'], ['hibrida', 'Híbrida'], ['offline', 'Offline']] as const;

export interface Fase { id: string; nome: string; meses: number; alcance: number }
/** Fases do ciclo; a prova de conceito alcança um número fixo de escolas, as demais uma parte do público. */
export const FASES_PADRAO: Fase[] = [
  { id: 'poc', nome: 'Prova de conceito', meses: 3, alcance: 0 },
  { id: 'piloto', nome: 'Piloto', meses: 6, alcance: 5 },
  { id: 'implantacao', nome: 'Implantação', meses: 12, alcance: 33 },
  { id: 'expansao', nome: 'Expansão', meses: 12, alcance: 100 },
];
export const ESCOLAS_POC = 5;

/** Parâmetros simulados (US$). */
export const SIM = {
  alunosPorEscola: 300, professoresPorEscola: 12,
  equipeMes: 3000, avaliacaoPiloto: 20000, implantadorPorEscolas: 50, implantadorMes: 2000, integracaoIA: 50000,
  coordenacaoPessoas: 2, avaliacaoImpacto: 40000, adaptacaoAmbiente: 15000,
  semEnergia: 0.3, solarEscola: 5000, solarManutAno: 300, energiaMes: 10,
  conexaoInstalacao: 3000, conexaoMes: 45,
  dispositivo: 300, vidaDispositivo: 60, alunosPorDispositivo: 3, acessibilidadeAluno: 100,
  hospedagemAlunoMesCom: 0.5, hospedagemAlunoMesSem: 0.05,
  horaFormacao: 15, horasIniciaisSem: 20, horasIniciaisCom: 30, cursoSem: 20000, cursoCom: 30000,
  horasContinuasAno: 10, escolasPorFormador: 20, formadorMes: 1500, reciclagemAno: 0.2,
  materialAluno: 3, vidaMaterial: 36, conteudoDigital: 40000, licencaUsuarioAnoCom: 10, licencaUsuarioAnoSem: 4,
  licencaIAAluno: 15, tokensEntradaMes: 50000, tokensSaidaMes: 10000, precoEntradaM: 0.10, precoSaidaM: 0.50,
  porLingua: 10000, pacoteOffline: 5000,
  viagens: 25, overhead: 15, taxa: 7,
};
/** Parte das matrículas (primário + secundário) que forma o público sugerido de cada desafio, e alunos por professor. */
const PUBLICO_SIM: Record<string, [number, number]> = {
  C31: [0.15, 15], C32: [0.25, 25], C33: [0.35, 20], C34: [0.1, 10], C35: [0.2, 25], C36: [0.08, 20], C37: [0.05, 25], C38: [0.5, 25],
};

export interface PublicoDesafio { estudantes: number; professores: number; ambiente: string; modalidade: string; linguas: number }
export interface SalvoEd { desafios?: string[]; publico?: Record<string, Partial<PublicoDesafio>>; fases?: Partial<Fase>[]; opcoes?: Record<string, string[]>; pV?: number; pO?: number; pT?: number; executor?: string }
export const lerEd = (s: Pick<Estado14, 'ctx'>): SalvoEd => (s.ctx?.edV20 || {}) as SalvoEd;

/** Público sugerido do desafio: parte das matrículas do país (ou 1 milhão sem dado) e professores pela razão aluno/professor. */
export function publicoSugerido(s: Pick<Estado14, 'ctx'>, d: string): PublicoDesafio {
  const mil = matriculasMil((s as any).caso?.pais) ?? 1000, [parte, razao] = PUBLICO_SIM[d] || [0.1, 25];
  const estudantes = Math.max(1000, Math.round(mil * 1000 * parte / 1000) * 1000);
  return { estudantes, professores: Math.max(10, Math.round(estudantes / razao)), ambiente: d === 'C36' ? 'profissional' : d === 'C37' ? 'centros' : 'escolas', modalidade: 'presencial', linguas: d === 'C35' ? 3 : 1 };
}
export function publico(s: Pick<Estado14, 'ctx'>, d: string): PublicoDesafio {
  const sug = publicoSugerido(s, d), sv = lerEd(s).publico?.[d] || {};
  const pos = (v: unknown, p: number) => typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : p;
  return { estudantes: pos(sv.estudantes, sug.estudantes), professores: pos(sv.professores, sug.professores), ambiente: String(sv.ambiente || sug.ambiente), modalidade: String(sv.modalidade || sug.modalidade), linguas: pos(sv.linguas, sug.linguas) };
}
export function fases(s: Pick<Estado14, 'ctx'>): Fase[] {
  const sv = lerEd(s).fases || [];
  return FASES_PADRAO.map((f, i) => {
    const x = sv[i] || {}, m = Number(x.meses), a = Number(x.alcance);
    return { ...f, meses: m >= 0 && Number.isFinite(m) && x.meses !== undefined ? m : f.meses, alcance: f.id === 'poc' ? 0 : a >= 0 && a <= 100 && x.alcance !== undefined ? a : f.alcance };
  });
}
export const desafiosEscolhidos = (s: Pick<Estado14, 'ctx'>) => DESAFIOS_ED.map(d => d.id).filter(id => (lerEd(s).desafios || []).includes(id));
export const opcoesEscolhidas = (s: Pick<Estado14, 'ctx'>, d: string) => (lerEd(s).opcoes?.[d] || []).filter(id => OPCOES_ED[id]);

export interface Parte { k: number; x: number; u: number }
export interface Linha { desafio: string; opcao: string; cat: string; alt: Alternativa; total: number; k: number; x: number; u: number; porFase: Record<string, number>; pessoas: number; conta: string }
const zero = (): Parte => ({ k: 0, x: 0, u: 0 });

/** Custo de uma opção num desafio, por fase, na alternativa indicada (em US$). `pessoas` é a parte de trabalho de pessoas. */
function calcular(op: string, alt: Alternativa, p: PublicoDesafio, fs: Fase[], nivel: number, d: string) {
  const S = SIM, com = alt === 'com', L = nivel;
  const escolas = (alc: number, f: Fase) => f.id === 'poc' ? ESCOLAS_POC : Math.max(1, Math.ceil(p.estudantes * alc / 100 / S.alunosPorEscola));
  const alunos = (f: Fase) => f.id === 'poc' ? ESCOLAS_POC * S.alunosPorEscola : Math.round(p.estudantes * f.alcance / 100);
  const profs = (f: Fase) => f.id === 'poc' ? ESCOLAS_POC * S.professoresPorEscola : Math.round(p.professores * f.alcance / 100);
  const ativas = fs.filter(f => f.meses > 0);
  const totalMeses = ativas.reduce((n, f) => n + f.meses, 0);
  const porFase: Record<string, Parte> = Object.fromEntries(fs.map(f => [f.id, zero()]));
  let pessoas = 0, conta = '';
  let antE = 0, antA = 0, antP = 0;
  const offline = p.modalidade === 'offline';
  for (const f of ativas) {
    const E = escolas(f.alcance, f), A = alunos(f), P = profs(f), m = f.meses;
    const novasE = Math.max(0, E - antE), novosA = Math.max(0, A - antA), novosP = Math.max(0, P - antP);
    const r = porFase[f.id];
    switch (op) {
      case 'e11': if (f.id === 'poc' || f.id === 'piloto') { const v = 3 * S.equipeMes * L * m + S.avaliacaoPiloto * L / 2; r.x += v; pessoas += v; } conta = '3 pessoas × custo mensal × meses da prova de conceito e do piloto + avaliação'; break;
      case 'e12': if (f.id === 'implantacao' || f.id === 'expansao') { const v = Math.ceil(E / S.implantadorPorEscolas) * S.implantadorMes * L * m; r.x += v; pessoas += v; if (com && f.id === 'implantacao') r.k += S.integracaoIA; } conta = '1 implantador por 50 escolas × custo mensal × meses' + (com ? ' + integração com os sistemas da rede' : ''); break;
      case 'e13': { const v = S.coordenacaoPessoas * S.equipeMes * L * m + (f.id === 'expansao' ? S.avaliacaoImpacto * L : 0); r.x += v; pessoas += v; conta = '2 pessoas × custo mensal × meses do plano + avaliação de impacto'; break; }
      case 'e14': if (f === ativas[0] && p.ambiente !== 'escolas') { r.k += S.adaptacaoAmbiente * L; pessoas += S.adaptacaoAmbiente * L; } conta = p.ambiente === 'escolas' ? 'sem custo nas escolas' : 'adaptação ao ambiente escolhido'; break;
      case 'e21': { const sem = Math.ceil(novasE * S.semEnergia); r.k += sem * S.solarEscola; r.x += Math.ceil(E * S.semEnergia) * S.solarManutAno * L * m / 12; r.u += E * S.energiaMes * m; conta = '30% das escolas sem energia × sistema solar + manutenção + eletricidade'; break; }
      case 'e22': if (!offline) { r.k += novasE * S.conexaoInstalacao; r.u += E * S.conexaoMes * m; } conta = offline ? 'modalidade offline: sem conectividade' : 'instalação por escola + mensalidade'; break;
      case 'e23': { const disp = com ? Math.ceil(novosA / S.alunosPorDispositivo) + novosP : novosP; r.k += disp * S.dispositivo + (d === 'C34' ? novosA * S.acessibilidadeAluno : 0); conta = (com ? '1 dispositivo por 3 estudantes + 1 por professor' : '1 dispositivo por professor') + (d === 'C34' ? ' + equipamento de acessibilidade por estudante' : ''); break; }
      case 'e24': r.u += A * (com ? S.hospedagemAlunoMesCom : S.hospedagemAlunoMesSem) * m; conta = 'estudantes × custo mensal de hospedagem'; break;
      case 'e31': { const h = com ? S.horasIniciaisCom : S.horasIniciaisSem, v = novosP * h * S.horaFormacao * L; r.x += v; pessoas += v; if (f === ativas[0]) r.k += (com ? S.cursoCom : S.cursoSem) * L; conta = (com ? 'professores × 30 horas × custo por hora' : 'professores × 20 horas × custo por hora') + ' + criação do curso'; break; }
      case 'e32': { const v = P * S.horasContinuasAno * S.horaFormacao * L * m / 12; r.x += v; pessoas += v; conta = 'professores × 10 horas por ano × custo por hora'; break; }
      case 'e33': { const v = Math.ceil(E / S.escolasPorFormador) * S.formadorMes * L * m; r.x += v; pessoas += v; conta = '1 formador por 20 escolas × custo mensal × meses'; break; }
      case 'e34': { const h = com ? S.horasIniciaisCom : S.horasIniciaisSem, v = P * h * S.horaFormacao * L * S.reciclagemAno * m / 12; r.x += v; pessoas += v; conta = '20% da formação inicial por ano'; break; }
      case 'e41': if (com) { if (f === ativas[0]) { r.k += S.conteudoDigital * L; pessoas += S.conteudoDigital * L; } conta = 'adaptação de conteúdo digital'; } else { r.x += A * S.materialAluno * m / S.vidaMaterial + novosA * S.materialAluno; conta = 'material impresso por estudante, reposto a cada 3 anos'; } break;
      case 'e42': r.x += (A + P) * (com ? S.licencaUsuarioAnoCom : S.licencaUsuarioAnoSem) * m / 12; conta = 'usuários × licença por ano'; break;
      case 'e43': if (com) { r.x += A * S.licencaIAAluno * m / 12; r.u += A * m * (S.tokensEntradaMes / 1e6 * S.precoEntradaM + S.tokensSaidaMes / 1e6 * S.precoSaidaM); } conta = 'licença por estudante + consumo de IA (tokens)'; break;
      case 'e44': if (f === ativas[0]) { const v = p.linguas * S.porLingua * L + (offline || !com ? S.pacoteOffline * L : 0); r.k += v; pessoas += v; } conta = 'adaptação por língua + versão offline'; break;
    }
    antE = E; antA = A; antP = P;
  }
  // reposição de dispositivos quando o plano passa da vida útil
  if (op === 'e23' && totalMeses > S.vidaDispositivo) { const ult = ativas[ativas.length - 1]; const disp = com ? Math.ceil(alunos(ult) / S.alunosPorDispositivo) + profs(ult) : profs(ult); porFase[ult.id].k += disp * S.dispositivo; conta += ' + reposição pela vida útil (5 anos)'; }
  return { porFase, pessoas, conta };
}

export interface ResultadoAlt { linhas: Linha[]; k: number; x: number; u: number; direto: number; P: number; V: number; O: number; T: number; total: number; porFase: Record<string, number>; porDesafio: Record<string, number>; porCategoria: Record<string, number>; estudantes: number; porEstudante: number | null }
export interface ResultadoEd { moeda: string; taxa: number; nivel: number; fases: Fase[]; com: ResultadoAlt; sem: ResultadoAlt; desafios: string[] }

/** Calcula o plano nas duas alternativas, na moeda do caso. */
export function orcamentoEducacao(s: Pick<Estado14, 'ctx' | 'moeda'>): ResultadoEd {
  const moeda = String(s.moeda?.cod || 'USD'), taxa = taxaV16(moeda, s) ?? 1, nivel = nivelPrecos((s as any).caso?.pais).v;
  const fs = fases(s), ds = desafiosEscolhidos(s), sv = lerEd(s);
  const pV = (sv.pV ?? SIM.viagens) / 100, pO = (sv.pO ?? SIM.overhead) / 100, pT = (sv.pT ?? SIM.taxa) / 100;
  const cent = (v: number) => Math.round(v * taxa * 100) / 100;
  const alt = (a: Alternativa): ResultadoAlt => {
    const linhas: Linha[] = [];
    for (const d of ds) {
      const p = publico(s, d);
      for (const op of opcoesEscolhidas(s, d)) {
        if (OPCOES_ED[op].so && OPCOES_ED[op].so !== a) continue;
        const c = calcular(op, a, p, fs, nivel, d);
        const k = Object.values(c.porFase).reduce((n, x) => n + x.k, 0), x = Object.values(c.porFase).reduce((n, y) => n + y.x, 0), u = Object.values(c.porFase).reduce((n, y) => n + y.u, 0);
        linhas.push({ desafio: d, opcao: op, cat: OPCOES_ED[op].cat, alt: a, k: cent(k), x: cent(x), u: cent(u), total: cent(k + x + u), pessoas: cent(c.pessoas),
          porFase: Object.fromEntries(Object.entries(c.porFase).map(([id, y]) => [id, cent(y.k + y.x + y.u)])), conta: c.conta });
      }
    }
    const soma = (f: (l: Linha) => number) => Math.round(linhas.reduce((n, l) => n + f(l), 0) * 100) / 100;
    const direto = soma(l => l.total), P = soma(l => l.pessoas);
    const V = Math.round(pV * P * 100) / 100, O = Math.round(pO * (P + V) * 100) / 100, T = Math.round(pT * (direto + V) * 100) / 100;
    const adic = V + O + T, fatorAd = direto ? adic / direto : 0;
    const k = soma(l => l.k), u = soma(l => l.u), total = Math.round((direto + adic) * 100) / 100;
    const kAd = k; // os custos adicionais entram como operação
    const porFase = Object.fromEntries(fs.map(f => [f.id, Math.round(soma(l => l.porFase[f.id] || 0) * (1 + fatorAd) * 100) / 100]));
    const porDesafio = Object.fromEntries(ds.map(d => [d, Math.round(linhas.filter(l => l.desafio === d).reduce((n, l) => n + l.total, 0) * (1 + fatorAd) * 100) / 100]));
    const porCategoria = Object.fromEntries(CATEGORIAS_ED.map(c => [c.id, Math.round(linhas.filter(l => l.cat === c.id).reduce((n, l) => n + l.total, 0) * 100) / 100]));
    const estudantes = ds.reduce((n, d) => n + publico(s, d).estudantes, 0);
    return { linhas, k: kAd, x: Math.round((total - kAd - u) * 100) / 100, u, direto, P, V, O, T, total, porFase, porDesafio, porCategoria, estudantes, porEstudante: estudantes ? Math.round(total / estudantes * 100) / 100 : null };
  };
  return { moeda, taxa, nivel, fases: fs, com: alt('com'), sem: alt('sem'), desafios: ds };
}

/** Nome traduzido de um desafio. */
export const nomeDesafio = (id: string) => t(DESAFIOS_ED.find(d => d.id === id)?.nome || id);
