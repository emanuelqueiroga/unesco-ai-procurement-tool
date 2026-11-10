// v018.1 (governança): custo de formação de pessoas por componentes, usado na categoria 3.2 e na formação dos custos
// adicionais. A formação mescla aulas presenciais, levadas à região dos participantes (os instrutores vão até eles), e
// aulas online ao vivo.
//
//   Turmas      T = ⌈n ÷ 25⌉            Dias presenciais por turma  d = ⌈h × p ÷ 7⌉
//   Criação     (CapEx, uma vez) = (h × p × 38 + h × (1 − p) × 28) × hora do especialista
//   Instrutores (OpEx) = T × 2 instrutores × 2h (aula + preparação) × hora do especialista
//   Sala, coffee break e almoço (OpEx) = (n + 2T) × d × diária de evento do país
//   Deslocamento dos instrutores (OpEx) = T × 2 × (d × diária residencial do país + transporte do país)
//   Coordenação, materiais e certificação (OpEx) = 15% × (instrutores + sala + deslocamento)
//   Tempo dos participantes (fora do total) = n × h × hora do servidor
//
// n = pessoas, h = horas por pessoa, p = parte presencial. Hora = custo mensal × 12 ÷ 2.080 horas. Diárias de evento e
// residencial: médias do Reino Unido em 2025 (UKCAMS), ajustadas pelo nível de preços do país (Banco Mundial).
import type { Estado14 } from '../store/tipos';
import { t } from './textos';
import { LOC, getTabelaMoedas } from '../domain';
import { custoMensalPerfil, chaveOpcao, type CustoSalvo, type FaseCalc, type LinhaOpcao, type ParteConta, type FonteConta, type EntradaD2 } from './custosV017';
import { DADOS_SOBERANA } from './nuvemSoberanaDados';
import { DADOS_PAIS_EXTRA, NIVEL_PRECOS_MEDIANO, URL_PPC, URL_CAMBIO } from './paisExtraDados';

export const FORMACAO_GOV = {
  /** pessoas por turma e horas de aula por dia (estimativas de referência, grau C) */
  turma: 25, horasDia: 7,
  /** horas por pessoa e parte presencial padrão (grau C) */
  horasPadrao: 20, presencialPadrao: 50,
  /** instrutores por turma e horas de preparação por hora de aula (grau C) */
  instrutores: 2, preparo: 1,
  /** horas de desenvolvimento por hora de aula (ATD, 2017: presencial 38; online ao vivo 28) */
  devPresencial: 38, devOnline: 28,
  /** coordenação, materiais e certificação, sobre a aplicação (grau C) */
  coordenacao: 0.15,
  /** diária de evento (sala, coffee break, almoço e equipamento) e diária residencial (com pernoite), Reino Unido, 2025,
   *  em libras com impostos (UKCAMS 2026) */
  diariaGBP: 51, residencialGBP: 187,
  /** transporte de ida e volta de um instrutor até a região da turma, US$ a preços dos EUA (grau C) */
  transporteUSD: 100,
  /** horas de trabalho por ano */
  horasAno: 2080,
};
export const FONTES_FORMACAO: Record<string, FonteConta> = {
  atd: { titulo: 'ATD (2017), How Long to Develop One Hour of Training? Updated for 2017 (presencial: 38 horas; online ao vivo: 28 horas)', url: 'https://www.td.org/content/atd-blog/how-long-does-it-take-to-develop-one-hour-of-training-2017' },
  ukcams: { titulo: 'UKCAMS 2026 (UK Events): diária de evento média de £ 51 e diária residencial de £ 187 em 2025, com impostos', url: 'https://ukevents.org.uk/research-and-publications/research/industry-research/ukcams-2026' },
  ppc: { titulo: 'Banco Mundial: fator de PPC do consumo privado (PA.NUS.PRVT.PP) ÷ câmbio oficial (PA.NUS.FCRF)', url: URL_PPC },
  cambio: { titulo: 'Banco Mundial: câmbio oficial (PA.NUS.FCRF)', url: URL_CAMBIO },
  iapp: { titulo: 'IAPP: treinamento AIGP online, US$ 1.195 por 13 horas (referência de mercado)', url: 'https://store.iapp.org/ai-governance-professional-aigp-online-training/' },
};

/** Nível de preços do país (EUA = 1); sem dado, a mediana do grupo do FMI. */
export function nivelPrecos(iso: string | undefined): { v: number; ano: number | null; mediana: boolean } {
  const d = iso ? DADOS_PAIS_EXTRA[iso] : undefined;
  if (d && d[0] !== null) return { v: d[0], ano: d[1], mediana: false };
  const g = (iso && DADOS_SOBERANA[iso]?.[0]) || 'EM';
  return { v: NIVEL_PRECOS_MEDIANO[g], ano: null, mediana: true };
}
/** Matrículas no ensino primário e secundário (milhares), ou null. */
export function matriculasMil(iso: string | undefined): number | null { const d = iso ? DADOS_PAIS_EXTRA[iso] : undefined; return d && d[2] !== null ? d[2] : null; }

export interface ResultadoFormacao { total: number | null; capex: number | null; opex: number | null; porFase: Record<string, number>; falta: string[];
  partes: ParteConta[]; formula: string; memoria: string; tempo: number | null; textoTempo: string }

const cent = (v: number) => Math.round(v * 100) / 100;

/** Custo da formação de n pessoas, h horas cada, com a parte presencial p (0 a 1). */
export function custoFormacao(s: Pick<Estado14, 'ctx'>, n: number | null, h: number, p: number, fases: FaseCalc[], taxa: number | null, moeda: string | undefined,
  fmt: (v: number) => string, num: (v: number) => string): ResultadoFormacao {
  const F = FORMACAO_GOV, iso = (s as any).caso?.pais as string | undefined, falta: string[] = [];
  const n2 = (v: number) => new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 2 }).format(v);
  const pct = (v: number) => new Intl.NumberFormat(String(LOC()), { style: 'percent', maximumFractionDigits: 0 }).format(v);
  const esp = custoMensalPerfil(s, 2, true, taxa, moeda, num), serv = custoMensalPerfil(s, 2, false, taxa, moeda, num);
  const taxaGBP = (getTabelaMoedas() as any)?.taxas?.GBP as number | undefined;
  if (n === null) falta.push(t('pessoas a formar'));
  if (!esp || taxa === null || !(taxaGBP && taxaGBP > 0)) falta.push(t('câmbio ou salário de referência'));
  const zero: Record<string, number> = {}; for (const x of fases) zero[x.id] = 0;
  if (falta.length) return { total: null, capex: null, opex: null, porFase: zero, falta, partes: [], formula: '', memoria: '', tempo: null, textoTempo: '' };
  const pl = nivelPrecos(iso), plGBR = nivelPrecos('GBR').v, k = pl.v / plGBR;
  const gbp = (v: number) => v / (taxaGBP as number) * (taxa as number);
  const hora = cent((esp as { valor: number }).valor * 12 / F.horasAno), horaServ = cent((serv as { valor: number }).valor * 12 / F.horasAno);
  const pessoas = n as number, T = Math.max(1, Math.ceil(pessoas / F.turma)), hp = h * p, ho = h * (1 - p), d = hp > 0 ? Math.ceil(hp / F.horasDia) : 0;
  // valores unitários arredondados ao centavo, para que a conta mostrada feche
  const diaria = cent(gbp(F.diariaGBP * k)), residencial = cent(gbp(F.residencialGBP * k)), transporte = cent(F.transporteUSD * pl.v * (taxa as number));
  const criacao = cent((hp * F.devPresencial + ho * F.devOnline) * hora);
  const instrutores = cent(T * F.instrutores * h * (1 + F.preparo) * hora);
  const sala = cent((pessoas + F.instrutores * T) * d * diaria);
  const desloc = d > 0 ? cent(T * F.instrutores * (d * residencial + transporte)) : 0;
  const coord = cent(F.coordenacao * (instrutores + sala + desloc));
  const opex = cent(instrutores + sala + desloc + coord), total = cent(criacao + opex);
  const tempo = cent(pessoas * h * horaServ);
  // por fase: a criação no início (primeira fase); a aplicação, proporcional aos meses
  const H = fases.reduce((x, f) => x + f.meses, 0) || 1, porFase: Record<string, number> = {};
  let resto = opex; fases.forEach((f, i) => { const v = i === fases.length - 1 ? cent(resto) : cent(opex * f.meses / H); porFase[f.id] = v + (i === 0 ? criacao : 0); resto -= v; });
  if (!fases.length) porFase.total = total;
  const txtPl = t('nível de preços do país {v} ({o}), Reino Unido {r}', { v: n2(pl.v), o: pl.mediana ? t('mediana do grupo') : t('Banco Mundial, {a}', { a: String(pl.ano) }), r: n2(plGBR) });
  const partes: ParteConta[] = [
    { rotulo: t('Turmas e formato'), valor: n2(T), fontes: [],
      texto: t('{n} pessoas ÷ {t} por turma = {T} turmas; {h} horas por pessoa, {p} presenciais ({hp} h, {d} dias de {hd} h, na região dos participantes) e {o} online ao vivo ({ho} h)', { n: num(pessoas), t: F.turma, T: n2(T), h: n2(h), p: pct(p), hp: n2(hp), d: n2(d), hd: F.horasDia, o: pct(1 - p), ho: n2(ho) }) },
    { rotulo: t('Criação do curso') + ' (CapEx)', valor: fmt(criacao), fontes: [FONTES_FORMACAO.atd, ...(esp as any).fontes],
      texto: t('({hp} h × {a} + {ho} h × {b}) horas de desenvolvimento × hora do especialista de {v} (custo mensal × 12 ÷ 2.080)', { hp: n2(hp), a: F.devPresencial, ho: n2(ho), b: F.devOnline, v: fmt(hora) }) + ' · ' + (esp as any).texto },
    { rotulo: t('Instrutores') + ' (OpEx)', valor: fmt(instrutores), fontes: [],
      texto: t('{T} turmas × {i} instrutores × {h} h de aula × 2 (aula e preparação) × {v} por hora', { T: n2(T), i: F.instrutores, h: n2(h), v: fmt(hora) }) },
    { rotulo: t('Sala, coffee break e almoço') + ' (OpEx)', valor: fmt(sala), fontes: [FONTES_FORMACAO.ukcams, FONTES_FORMACAO.ppc],
      texto: d === 0 ? t('sem aulas presenciais') : t('({n} participantes + {i} instrutores por turma × {T}) × {d} dias × diária de evento de {v} (£ {g} × {txt})', { n: num(pessoas), i: F.instrutores, T: n2(T), d: n2(d), v: fmt(diaria), g: F.diariaGBP, txt: txtPl }) },
    { rotulo: t('Deslocamento dos instrutores') + ' (OpEx)', valor: fmt(desloc), fontes: [FONTES_FORMACAO.ukcams, FONTES_FORMACAO.ppc],
      texto: d === 0 ? t('sem aulas presenciais') : t('{T} turmas × {i} instrutores × ({d} diárias residenciais de {r} + transporte de {tr})', { T: n2(T), i: F.instrutores, d: n2(d), r: fmt(residencial), tr: fmt(transporte) })
        + ' · ' + t('diária residencial: £ {g} ajustada pelo nível de preços; transporte: US$ {u} × nível de preços (estimativa de referência, grau C)', { g: F.residencialGBP, u: F.transporteUSD }) },
    { rotulo: t('Coordenação, materiais e certificação') + ' (OpEx)', valor: fmt(coord), fontes: [],
      texto: t('{p}% de instrutores, sala e deslocamento (estimativa de referência, grau C)', { p: n2(F.coordenacao * 100) }) },
  ];
  const textoTempo = t('Tempo dos participantes, fora do total: {n} pessoas × {h} h × {v} por hora = {t}. Não é desembolso novo: são horas que os servidores deixam de dedicar ao trabalho.', { n: num(pessoas), h: n2(h), v: fmt(horaServ), t: fmt(tempo) });
  const formula = [fmt(criacao), fmt(instrutores), fmt(sala), fmt(desloc), fmt(coord)].join(' + ') + ' = ' + fmt(total);
  const memoria = t('{n} pessoas × {h} h ({p} presencial), {T} turmas', { n: num(pessoas), h: n2(h), p: pct(p), T: n2(T) });
  return { total, capex: criacao, opex, porFase, falta, partes, formula, memoria, tempo, textoTempo };
}

/** Campos da formação (pessoas, horas por pessoa e parte presencial), no formato das entradas do desafio 2. */
export function entradasFormacao(q: Record<string, any>, sugPessoas: number | null, dicaPessoas: string): { entradas: EntradaD2[]; n: number | null; h: number; p: number; informado: boolean } {
  const F = FORMACAO_GOV, pos = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
  const pres = typeof q.presencial === 'number' && q.presencial >= 0 && q.presencial <= 100 ? q.presencial : null;
  const n = pos(q.pessoas) ? q.pessoas : sugPessoas, h = pos(q.horas) ? q.horas : F.horasPadrao, p = (pres ?? F.presencialPadrao) / 100;
  const entradas: EntradaD2[] = [
    { id: 'pessoas', rotulo: t('Pessoas a formar'), tipo: 'numero', valor: pos(q.pessoas) ? q.pessoas : '', sugestao: sugPessoas === null ? undefined : String(sugPessoas), dica: dicaPessoas, decimais: false },
    { id: 'horas', rotulo: t('Horas por pessoa'), tipo: 'numero', valor: pos(q.horas) ? q.horas : '', sugestao: String(F.horasPadrao), dica: t('Vazio = {n} horas (estimativa de referência, grau C).', { n: F.horasPadrao }), decimais: true },
    { id: 'presencial', rotulo: t('Parte presencial (%)'), tipo: 'numero', valor: pres ?? '', sugestao: String(F.presencialPadrao),
      dica: t('Vazio = {p}%. As aulas presenciais acontecem na região dos participantes; o restante é online ao vivo.', { p: F.presencialPadrao }), decimais: true },
  ];
  return { entradas, n, h, p, informado: pos(q.pessoas) && pos(q.horas) && pres !== null };
}

export const OPCAO_FORMACAO_32 = 'Formação e desenvolvimento profissional';
/** Linha da categoria 3.2: as pessoas sugeridas são as do plano (equipes das opções escolhidas e a 3.1), ou uma turma. */
export function linhaFormacao32(s: Pick<Estado14, 'ctx'>, salvo: CustoSalvo, fases: FaseCalc[], taxa: number | null, fmt: (v: number) => string, num: (v: number) => string, moeda?: string): LinhaOpcao {
  const plano = (s as any).__pessoasPlano as number | undefined, sug = typeof plano === 'number' && plano > 0 ? Math.ceil(plano) : FORMACAO_GOV.turma;
  const dica = typeof plano === 'number' && plano > 0 ? t('Vazio = {n} pessoas: as equipes das opções escolhidas e a 3.1 (o número muda quando o plano muda).', { n: sug }) : t('Vazio = uma turma de {n} pessoas (estimativa de referência, grau C).', { n: FORMACAO_GOV.turma });
  const e = entradasFormacao((salvo as any).q || {}, sug, dica), r = custoFormacao(s, e.n, e.h, e.p, fases, taxa, moeda, fmt, num);
  return { chave: chaveOpcao(OPCAO_FORMACAO_32), rotulo: OPCAO_FORMACAO_32, tipo: 'comp', tipoPadrao: 'comp', fonte: null, qtd: e.n, qtdSugerida: false, horas: e.h, unit: null, unitRef: null, unitDaReferencia: false,
    valoresFase: {}, porFase: r.porFase, total: r.total, status: r.falta.length ? 'falta' : e.informado ? 'referencia' : 'referencia', falta: r.falta,
    capex: r.capex, opex: r.opex, uso: r.total === null ? null : 0, pessoas: r.total === null ? null : 0, pessoasCapex: 0, entradas: e.entradas,
    conta: r.total === null ? undefined : { formula: r.formula, partes: r.partes }, nota: r.textoTempo || undefined, memoria: r.memoria } as LinhaOpcao;
}
