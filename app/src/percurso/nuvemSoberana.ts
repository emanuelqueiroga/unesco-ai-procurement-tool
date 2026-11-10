// v018.1: modelo simplificado de custo da nuvem soberana, por 100 mil habitantes. Dois caminhos: o governo constrói a
// própria infraestrutura ou contrata um provedor de nuvem soberana. A unidade é o país inteiro; a educação responde pela
// sua parcela (gasto com educação em % do gasto do governo, Banco Mundial), que a pessoa pode trocar.
//
// Construir:  CapEx = F + k_g × N × m            OpEx anual = r × CapEx + 12 × c × (n0 + n1 × N × m)
// Contratar:  CapEx = implantação e migração (equipe de referência)
//             OpEx anual = (CapEx_construir ÷ vida útil + OpEx_construir) × (1 + prêmio da nuvem soberana)
// N = população ÷ 100 mil; m = 0,5 + 0,5 × CGSI (GTMI 2025); g = grupo do FMI; c = custo mensal de um profissional
// (grupo 2 da ISCO-08, salário do país com encargos e prêmio de especialista).
// Calibração preliminar (grau C) com os casos de CASOS_SOBERANA; os coeficientes devem ser recalibrados quando houver
// mais casos com fonte, sem presumir que países de menor renda têm custo tecnológico menor.
import { DADOS_SOBERANA, CGSI_MEDIANO, EDU_MUNDIAL, type GrupoFMI } from './nuvemSoberanaDados';

export const URL_GTMI = 'https://www.worldbank.org/en/programs/govtech/gtmi-2025-update';
export const URL_EDU_GASTO = 'https://data.worldbank.org/indicator/SE.XPD.TOTL.GB.ZS';
export const URL_FMI_GRUPOS = 'https://meetings.imf.org/en/-/media/files/publications/weo/2025/april/english/statsappendix.pdf';

export const NOME_GRUPO_FMI: Record<GrupoFMI, string> = {
  AE: 'economia avançada', EM: 'economia emergente e de renda média', LIDC: 'país em desenvolvimento de baixa renda',
};

/** Coeficientes (US$). */
export const COEF_SOBERANA = {
  /** F: investimento mínimo para uma infraestrutura soberana (Estônia e Moldávia, os menores casos) */
  piso: 9_000_000,
  /** k_g: investimento por 100 mil habitantes (média dos casos de cada grupo, descontado o piso; os grupos emergente e
   *  de baixa renda usam o mesmo valor, porque os casos não mostram custo menor nos países de menor renda) */
  porCemMil: { AE: 2_190_000, EM: 300_000, LIDC: 300_000 } as Record<GrupoFMI, number>,
  /** r: operação e manutenção das instalações, por ano, em fração do investimento (KPMG, 2026) */
  operacao: 0.026,
  /** n0 e n1: equipe de operação da plataforma (piso de 24 horas e pessoas por 100 mil habitantes; ODC-Noord) */
  equipeMinima: 20, equipePorCemMil: 1.1,
  /** vida útil para anualizar o investimento no caminho "contratar" */
  vidaUtil: 10,
  /** prêmio de preço da nuvem soberana sobre a nuvem comum (BCG, 2025: de 15% a 30%) */
  premio: 0.2,
};

export interface FonteSob { titulo: string; url: string }
export const FONTES_SOBERANA: Record<string, FonteSob> = {
  kpmg: { titulo: 'KPMG (2026), Benchmarking CapEx and OpEx in the Global Data Centre Market', url: 'https://kpmg.com/ie/en/insights/strategy/global-data-centre-cost-benchmarks.html' },
  bcg: { titulo: 'BCG (2025), Cloud Cover: Price, Sovereignty Demands, and Waste', url: 'https://www.bcg.com/publications/2025/cloud-cover-price-sovereignty-demands-waste' },
  odc: { titulo: 'ODC-Noord (2026): cerca de 200 profissionais na nuvem soberana do governo dos Países Baixos', url: 'https://www.futuregov.nl/wp-content/uploads/2026/09/Inzending-ODC-Noord-1.0-2.pdf' },
  gtmi: { titulo: 'Banco Mundial, GovTech Maturity Index 2025 (CGSI)', url: URL_GTMI },
  edu: { titulo: 'Banco Mundial: gasto do governo com educação, % do gasto total (SE.XPD.TOTL.GB.ZS)', url: URL_EDU_GASTO },
  fmi: { titulo: 'FMI, World Economic Outlook (abril de 2025): grupos de países', url: URL_FMI_GRUPOS },
};

/** Casos usados na calibração (investimento em infraestrutura de nuvem ou data center de governo). */
/** investimento = valor na moeda original (moeda, ISO 4217); usd = valor em US$ usado na calibração */
export interface CasoSob { iso: string; pais: string; grupo: GrupoFMI; populacao: number; moeda: string; investimento: number; usd: number; nota: string; fonte: FonteSob; usado: boolean }
export const CASOS_SOBERANA: CasoSob[] = [
  { iso: 'EST', pais: 'Estônia', grupo: 'AE', populacao: 1.37, moeda: 'EUR', investimento: 11.09e6, usd: 12.2e6, nota: 'criação da nuvem de governo', usado: true,
    fonte: { titulo: 'Riigikontroll (tribunal de contas da Estônia): auditoria dos gastos de TI do governo', url: 'https://repository.ach.gov.ru/show/8966/?lang=en' } },
  { iso: 'CHE', pais: 'Suíça', grupo: 'AE', populacao: 8.87, moeda: 'CHF', investimento: 319.4e6, usd: 376.6e6, nota: 'Swiss Government Cloud, 2025 a 2032', usado: true,
    fonte: { titulo: 'Escritório Federal de Informática (FOITT): Swiss Government Cloud', url: 'https://www.bit.admin.ch/en/sgc-en' } },
  { iso: 'IDN', pais: 'Indonésia', grupo: 'EM', populacao: 281.19, moeda: 'EUR', investimento: 164.7e6, usd: 173e6, nota: 'primeiro de quatro data centers nacionais (PDN Cikarang)', usado: true,
    fonte: { titulo: 'InfoPublik (governo da Indonésia): Pusat Data Nasional em Cikarang', url: 'https://www.infopublik.id/kategori/nasional-sosial-budaya/684060/index.html' } },
  { iso: 'LKA', pais: 'Sri Lanka', grupo: 'EM', populacao: 22.97, moeda: 'LKR', investimento: 751.8e6, usd: 4.2e6, nota: 'Lanka Government Cloud 2.0, fase 1 (usa data centers existentes)', usado: false,
    fonte: { titulo: 'ICTA Sri Lanka: projetos concluídos de 2017 a 2021', url: 'https://www.icta.lk/icta-assets/uploads/2023/04/2.-Report-on-the-ICTA-Completed-projects-2017-2021-2022-10-10.pdf' } },
  { iso: 'MDA', pais: 'Moldávia', grupo: 'LIDC', populacao: 3.07, moeda: 'USD', investimento: 6.5e6, usd: 6.5e6, nota: 'MCloud, fase 2, financiada pelo Banco Mundial', usado: true,
    fonte: { titulo: 'Banco Mundial: Moldova Governance e-Transformation (MCloud)', url: 'https://documents1.worldbank.org/curated/en/251111468122958774/pdf/Moldova000Gove0Report000Sequence009.pdf' } },
  { iso: 'SEN', pais: 'Senegal', grupo: 'LIDC', populacao: 18.08, moeda: 'XOF', investimento: 46e9, usd: 83e6, nota: 'data center nacional de Diamniadio', usado: true,
    fonte: { titulo: 'DCD: Senegal migra os dados do governo para o novo data center nacional', url: 'https://www.datacenterdynamics.com/en/news/senegal-to-migrate-all-government-data-and-applications-to-new-government-data-center/' } },
  { iso: 'KEN', pais: 'Quênia', grupo: 'LIDC', populacao: 55.34, moeda: 'CNY', investimento: 1.225e9, usd: 177e6, nota: 'data center de Konza e cidade inteligente (valor máximo)', usado: true,
    fonte: { titulo: 'AidData: empréstimo do China Eximbank para o data center de Konza', url: 'https://china.aiddata.org/projects/59366/' } },
  { iso: 'BGD', pais: 'Bangladesh', grupo: 'LIDC', populacao: 171.47, moeda: 'BDT', investimento: 15.169e9, usd: 193e6, nota: 'data center nacional Tier IV, 20 MW', usado: true,
    fonte: { titulo: 'ECNEC aprova o data center nacional Tier IV', url: 'https://albd.org/articles/news/28157/ECNEC-approves-setting-up-Tier-IV-National-Data-Centre' } },
  { iso: 'ZMB', pais: 'Zâmbia', grupo: 'LIDC', populacao: 20.72, moeda: 'USD', investimento: 75e6, usd: 75e6, nota: 'data center nacional (Smart Zambia)', usado: true,
    fonte: { titulo: 'DCD: o data center de US$ 75 milhões da Zâmbia', url: 'https://www.datacenterdynamics.com/en/news/huaweis-75m-zambian-data-center-readies-for-launch/' } },
];

export interface PaisSob { grupo: GrupoFMI; cgsi: number; cgsiEstimado: boolean; populacaoMil: number | null; edu: number; eduAno: number | null; eduEstimado: boolean; N: number | null; m: number }
/** Dados do país para o modelo (sem país, valem o grupo emergente, o CGSI mediano e a média mundial da educação). */
export function paisSoberana(iso: string | undefined, populacaoInformada?: number | null): PaisSob {
  const d = iso ? DADOS_SOBERANA[iso] : undefined, grupo: GrupoFMI = d ? d[0] : 'EM';
  const cgsiEstimado = !d || d[1] === null, cgsi = cgsiEstimado ? CGSI_MEDIANO[grupo] : d![1] as number;
  const populacaoMil = typeof populacaoInformada === 'number' && populacaoInformada > 0 ? populacaoInformada : d && d[2] ? d[2] : null;
  const eduEstimado = !d || d[3] === null, edu = eduEstimado ? EDU_MUNDIAL : d![3] as number;
  return { grupo, cgsi, cgsiEstimado, populacaoMil, edu, eduAno: eduEstimado ? 2023 : d![4], eduEstimado, N: populacaoMil === null ? null : populacaoMil / 100, m: 0.5 + 0.5 * cgsi };
}
/** Investimento nacional (US$) e pessoas na operação, no caminho "construir". */
export function soberanaNacional(p: PaisSob): { capexUSD: number; operacaoUSD: number; pessoas: number } | null {
  if (p.N === null) return null;
  const c = COEF_SOBERANA, capexUSD = c.piso + c.porCemMil[p.grupo] * p.N * p.m;
  return { capexUSD, operacaoUSD: c.operacao * capexUSD, pessoas: c.equipeMinima + c.equipePorCemMil * p.N * p.m };
}
