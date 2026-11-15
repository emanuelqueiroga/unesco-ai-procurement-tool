// v022: valores sugeridos por país para "Educando com e sem IA". Cada função devolve o valor do país (grau A ou B), com
// ano e fonte, ou, sem dado, a mediana do grupo do FMI do país (grau B) ou null (vale a convenção da ferramenta, grau C).
// Os dados vêm de educacaoDados.ts (gerado por scripts/gerar_dados_ed.py); a metodologia explica cada uso.
import { ESCOLAS_UIS, RAZAO_UIS, KWH_PAIS, BANDA_UIT, MOVEL_UIT, PVOUT, DEFICIENCIA_UNICEF } from './educacaoDados';
import { DADOS_SOBERANA, type GrupoFMI } from './nuvemSoberanaDados';

export type Grau = 'A' | 'B' | 'C';
/** Um valor sugerido com a origem: fonte curta, ano (quando houver) e grau. mediana = valor do grupo do FMI, sem dado do país. */
export interface ValorPais { v: number; ano: number | null; fonte: string; grau: Grau; mediana?: boolean; niveis?: string[] }

export const FONTES_ED = {
  uisEscolas: { nome: 'UNESCO UIS, escolas com eletricidade e com internet para fins pedagógicos (SCHBSP)', url: 'https://databrowser.uis.unesco.org/', licenca: 'CC BY-SA 3.0 IGO' },
  uisRazao: { nome: 'UNESCO UIS, estudantes por professor (PTRHC)', url: 'https://databrowser.uis.unesco.org/', licenca: 'CC BY-SA 3.0 IGO' },
  kwh: { nome: 'Banco Mundial, Doing Business 2019, preço da eletricidade (IC.ELC.PRI.KH.DB1619), atualizado pelo IPC (FP.CPI.TOTL) e pelo câmbio (PA.NUS.FCRF)', url: 'https://data.worldbank.org/indicator/IC.ELC.PRI.KH.DB1619', licenca: 'CC BY 4.0' },
  banda: { nome: 'UIT, ICT Price Baskets 2024, cesta de banda larga fixa (5 GB)', url: 'https://www.itu.int/en/ITU-D/Statistics/Pages/ICTprices/default.aspx', licenca: 'uso livre com citação da UIT' },
  movel: { nome: 'UIT, ICT Price Baskets 2024, cesta de dados móveis (2 GB)', url: 'https://www.itu.int/en/ITU-D/Statistics/Pages/ICTprices/default.aspx', licenca: 'uso livre com citação da UIT' },
  pvout: { nome: 'Banco Mundial/ESMAP e Solargis, Global Photovoltaic Power Potential by Country (PVOUT nível 1)', url: 'https://datacatalog.worldbank.org/search/dataset/0038379', licenca: 'CC BY 4.0' },
  unicef: { nome: 'UNICEF, crianças de 2 a 17 anos com dificuldade funcional (FD_FUNC_DIFFICULTY, MICS); sem dado do país, a estimativa mundial do relatório "Seen, Counted, Included" (2021)', url: 'https://data.unicef.org/resources/children-with-disabilities-report-2021/', licenca: 'termos de uso do UNICEF (uso com citação)' },
} as const;
/** Estimativa mundial do UNICEF (2021): cerca de 240 milhões de crianças com deficiência, 1 em cada 10. */
export const DEFICIENCIA_MUNDO = 10.1;

const grupo = (iso?: string): GrupoFMI => (iso && DADOS_SOBERANA[iso]?.[0]) || 'EM';
const mediana = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2); return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : 0; };
const medGrupo = (tab: Record<string, number>): Record<GrupoFMI, number> => {
  const r: Record<string, number[]> = { AE: [], EM: [], LIDC: [] };
  for (const [iso, v] of Object.entries(tab)) r[grupo(iso)].push(v);
  return { AE: mediana(r.AE), EM: mediana(r.EM), LIDC: mediana(r.LIDC) };
};
const r4 = (v: number) => Math.round(v * 1e4) / 1e4;

/** Níveis CINE usados por desafio: escolas (1 primário, 2 secundário inferior, 3 superior) e razão (0 pré-escola …). */
export const NIVEIS_DESAFIO: Record<string, { escolas: ('1' | '2' | '3')[]; razao: ('0' | '1' | '2' | '3')[] }> = {
  C31: { escolas: ['1'], razao: ['0'] }, C32: { escolas: ['1'], razao: ['1'] }, C33: { escolas: ['2', '3'], razao: ['2', '3'] },
  C34: { escolas: ['1'], razao: ['1'] }, C35: { escolas: ['1'], razao: ['1'] }, C36: { escolas: ['3'], razao: ['3'] },
  C37: { escolas: ['2'], razao: ['2'] }, C38: { escolas: ['1', '2'], razao: ['1', '2'] },
};
const NOME_NIVEL: Record<string, string> = { '0': 'pré-escola', '1': 'primário', '2': 'secundário inferior', '3': 'secundário superior' };
export const nomesNiveis = (ns: string[], tr: (x: string) => string = x => x) => ns.map(n => tr(NOME_NIVEL[n])).join(tr(' e '));

/** Média simples dos níveis do desafio que têm dado; o ano é o mais antigo dos usados. */
function mediaNiveis(tab: Partial<Record<string, [number, number]>> | undefined, niveis: string[]): { v: number; ano: number } | null {
  const xs = niveis.map(n => tab?.[n]).filter(Boolean) as [number, number][];
  if (!xs.length) return null;
  return { v: xs.reduce((n, x) => n + x[0], 0) / xs.length, ano: Math.min(...xs.map(x => x[1])) };
}
/** Locais sem energia (%) = 100 − escolas com eletricidade, nos níveis do desafio. */
export function semEnergiaPais(iso: string | undefined, d: string): ValorPais | null {
  const n = NIVEIS_DESAFIO[d]?.escolas || ['1'], t = iso ? ESCOLAS_UIS[iso] : undefined;
  const m = mediaNiveis(t && { '1': t.el1, '2': t.el2, '3': t.el3 }, n);
  return m ? { v: Math.round((100 - m.v) * 10) / 10, ano: m.ano, fonte: 'UIS', niveis: n, grau: 'A' } : null;
}
/** Locais sem internet (%) = 100 − escolas com internet para fins pedagógicos, nos níveis do desafio. */
export function semInternetPais(iso: string | undefined, d: string): ValorPais | null {
  const n = NIVEIS_DESAFIO[d]?.escolas || ['1'], t = iso ? ESCOLAS_UIS[iso] : undefined;
  const m = mediaNiveis(t && { '1': t.in1, '2': t.in2, '3': t.in3 }, n);
  return m ? { v: Math.round((100 - m.v) * 10) / 10, ano: m.ano, fonte: 'UIS', niveis: n, grau: 'A' } : null;
}
/** Estudantes por professor nos níveis do desafio (C37, jovens e adultos, usa o secundário inferior como aproximação). */
export function razaoPais(iso: string | undefined, d: string): ValorPais | null {
  const n = NIVEIS_DESAFIO[d]?.razao || ['1'], m = mediaNiveis(iso ? RAZAO_UIS[iso] as any : undefined, n);
  return m ? { v: Math.round(m.v * 10) / 10, ano: m.ano, fonte: 'UIS', niveis: n, grau: d === 'C37' || d === 'C31' ? 'B' : 'A' } : null;
}
/** Estudantes com deficiência (%): país (UNICEF/MICS) ou estimativa mundial. */
export function deficienciaPais(iso: string | undefined): ValorPais {
  const x = iso ? DEFICIENCIA_UNICEF[iso] : undefined;
  return x ? { v: x[0], ano: x[1], fonte: 'UNICEF, MICS, 2 a 17 anos', grau: 'A' } : { v: DEFICIENCIA_MUNDO, ano: 2021, fonte: 'UNICEF, estimativa mundial', grau: 'B', mediana: true };
}

const KWH_MED = medGrupo(Object.fromEntries(Object.entries(KWH_PAIS).map(([k, v]) => [k, v[0]])));
const MBPS_MED = medGrupo(Object.fromEntries(Object.entries(BANDA_UIT).map(([k, v]) => [k, v[0] / v[1]])));
const VEL_MED = medGrupo(Object.fromEntries(Object.entries(BANDA_UIT).map(([k, v]) => [k, v[1]])));
const GB_MED = medGrupo(Object.fromEntries(Object.entries(MOVEL_UIT).map(([k, v]) => [k, v[0] / v[1]])));
const PV_MED = medGrupo(PVOUT);

/** Preço de referência por país, em US$ (não se aplica o nível de preços: o dado já é do país). */
export function precoPais(chave: string, iso: string | undefined): ValorPais | null {
  const g = grupo(iso);
  if (chave === 'kwh') { const x = iso ? KWH_PAIS[iso] : undefined;
    return x ? { v: x[0], ano: x[1], fonte: 'Doing Business 2019 atualizado pelo IPC', grau: 'B' } : { v: r4(KWH_MED[g]), ano: null, fonte: 'mediana do grupo do país', grau: 'B', mediana: true }; }
  if (chave === 'mbps') { const x = iso ? BANDA_UIT[iso] : undefined;
    return x ? { v: r4(x[0] / x[1]), ano: 2024, fonte: 'UIT, cesta de banda fixa', grau: 'B' } : { v: r4(MBPS_MED[g]), ano: 2024, fonte: 'mediana do grupo do país', grau: 'B', mediana: true }; }
  if (chave === 'gb') { const x = iso ? MOVEL_UIT[iso] : undefined;
    return x ? { v: r4(x[0] / x[1]), ano: 2024, fonte: 'UIT, cesta de dados móveis', grau: 'A' } : { v: r4(GB_MED[g]), ano: 2024, fonte: 'mediana do grupo do país', grau: 'B', mediana: true }; }
  return null;
}
/** Parâmetro sugerido por país. */
export function paramPais(chave: string, iso: string | undefined): ValorPais | null {
  const g = grupo(iso);
  if (chave === 'pvout') { const x = iso ? PVOUT[iso] : undefined;
    return x ? { v: x, ano: null, fonte: 'Banco Mundial/ESMAP, PVOUT', grau: 'A' } : { v: Math.round(PV_MED[g] * 100) / 100, ano: null, fonte: 'mediana do grupo do país', grau: 'B', mediana: true }; }
  if (chave === 'velBanda') { const x = iso ? BANDA_UIT[iso] : undefined;
    return x ? { v: x[1], ano: 2024, fonte: 'UIT, velocidade da cesta de banda fixa', grau: 'B' } : { v: VEL_MED[g], ano: 2024, fonte: 'mediana do grupo do país', grau: 'B', mediana: true }; }
  return null;
}
/** Texto curto da origem de um valor: "UIS, primário, 2024 · grau A". */
export const origemTexto = (x: ValorPais | null, tr: (x: string) => string = x => x) =>
  x ? `${tr(x.fonte)}${x.niveis ? ', ' + nomesNiveis(x.niveis, tr) : ''}${x.ano ? ', ' + x.ano : ''} · ${tr('grau')} ${x.grau}` : '';
