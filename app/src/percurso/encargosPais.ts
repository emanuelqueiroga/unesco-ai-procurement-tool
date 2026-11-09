// v018: contribuição patronal à seguridade social, em % da folha (fator de encargos = 1 + taxa/100), por país (ISO 3166
// alfa-3), com o volume da fonte. Fonte: Social Security Programs Throughout the World (SSA e ISSA), tabela 4 — África e
// Américas 2019, Europa e Ásia e Pacífico 2018. Taxas com teto ou em que o empregador também paga benefícios diretamente
// subestimam o encargo.
type Volume = 'africa' | 'americas' | 'europe' | 'asia';
export const CONTRIBUICAO_PATRONAL: Record<string, [number, Volume]> = {
  DZA: [25, 'africa'], // Algeria, 2019
  AGO: [8, 'africa'], // Angola, 2019
  BEN: [16.4, 'africa'], // Benin, 2019
  BWA: [0, 'africa'], // Botswana, 2019
  BFA: [16, 'africa'], // Burkina Faso, 2019
  BDI: [9, 'africa'], // Burundi, 2019
  CPV: [17, 'africa'], // Cabo Verde, 2019
  CMR: [12.95, 'africa'], // Cameroon, 2019
  CAF: [19, 'africa'], // Central African Republic, 2019
  TCD: [16.5, 'africa'], // Chad, 2019
  COD: [13, 'africa'], // Congo, Democratic Republic of the, 2019
  COG: [20.28, 'africa'], // Congo, Republic of the, 2019
  CIV: [15.45, 'africa'], // Côte d'Ivoire, 2019
  DJI: [10.7, 'africa'], // Djibouti, 2019
  EGY: [26, 'africa'], // Egypt, 2019
  GNQ: [21.5, 'africa'], // Equatorial Guinea, 2019
  SWZ: [5, 'africa'], // Eswatini (Swaziland), 2019
  ETH: [11, 'africa'], // Ethiopia, 2019
  GAB: [16, 'africa'], // Gabon, 2019
  GMB: [11, 'africa'], // Gambia, 2019
  GHA: [13, 'africa'], // Ghana, 2019
  GIN: [18, 'africa'], // Guinea, 2019
  GNB: [16, 'africa'], // Guinea-Bissau, 2019
  KEN: [5, 'africa'], // Kenya, 2019
  LSO: [0, 'africa'], // Lesotho, 2019
  LBR: [6, 'africa'], // Liberia, 2019
  LBY: [10.5, 'africa'], // Libya, 2019
  MDG: [13, 'africa'], // Madagascar, 2019
  MWI: [10, 'africa'], // Malawi, 2019
  MLI: [14.4, 'africa'], // Mali, 2019
  MRT: [13, 'africa'], // Mauritania, 2019
  MUS: [8.5, 'africa'], // Mauritius, 2019
  MAR: [15.38, 'africa'], // Morocco, 2019
  MOZ: [4, 'africa'], // Mozambique, 2019
  NAM: [0.9, 'africa'], // Namibia, 2019
  NER: [16.4, 'africa'], // Niger, 2019
  NGA: [11, 'africa'], // Nigeria, 2019
  RWA: [5.3, 'africa'], // Rwanda, 2019
  STP: [6, 'africa'], // São Tomé and Príncipe, 2019
  SEN: [16.4, 'africa'], // Senegal, 2019
  SYC: [3, 'africa'], // Seychelles, 2019
  SLE: [10, 'africa'], // Sierra Leone, 2019
  ZAF: [1, 'africa'], // South Africa, 2019
  SDN: [17, 'africa'], // Sudan, 2019
  TZA: [11, 'africa'], // Tanzania, 2019
  TGO: [17.5, 'africa'], // Togo, 2019
  TUN: [15.7389, 'africa'], // Tunisia, 2019
  UGA: [10, 'africa'], // Uganda, 2019
  ZMB: [5, 'africa'], // Zambia, 2019
  ZWE: [3.5, 'africa'], // Zimbabwe, 2019
  ATG: [7.5, 'americas'], // Antigua and Barbuda, 2019
  ARG: [16.23, 'americas'], // Argentina, 2019
  ABW: [16.95, 'americas'], // Aruba, 2019
  BHS: [5.9, 'americas'], // Bahamas, 2019
  BRB: [11.75, 'americas'], // Barbados, 2019
  BMU: [5, 'americas'], // Bermuda, 2019
  BOL: [27.71, 'americas'], // Bolivia, 2019
  BRA: [21, 'americas'], // Brazil, 2019
  VGB: [4.5, 'americas'], // British Virgin Islands, 2019
  CAN: [7.368, 'americas'], // Canada, 2019
  CHL: [4.86, 'americas'], // Chile, 2019
  COL: [24.848, 'americas'], // Colombia, 2019
  CRI: [24.08, 'americas'], // Costa Rica, 2019
  CUB: [14.5, 'americas'], // Cuba, 2019
  DMA: [6.75, 'americas'], // Dominica, 2019
  DOM: [15.39, 'americas'], // Dominican Republic, 2019
  ECU: [12.42, 'americas'], // Ecuador, 2019
  SLV: [15.25, 'americas'], // El Salvador, 2019
  GRD: [5, 'americas'], // Grenada, 2019
  GTM: [10.67, 'americas'], // Guatemala, 2019
  GUY: [8.4, 'americas'], // Guyana, 2019
  HTI: [11, 'americas'], // Haiti, 2019
  HND: [10.48, 'americas'], // Honduras, 2019
  JAM: [2.75, 'americas'], // Jamaica, 2019
  MEX: [9.1, 'americas'], // Mexico, 2019
  NIC: [21.5, 'americas'], // Nicaragua, 2019
  PAN: [4.25, 'americas'], // Panama, 2019
  PRY: [16.5, 'americas'], // Paraguay, 2019
  PER: [9.63, 'americas'], // Peru, 2019
  KNA: [6, 'americas'], // Saint Kitts and Nevis, 2019
  LCA: [5, 'americas'], // Saint Lucia, 2019
  VCT: [5.5, 'americas'], // Saint Vincent and the Grenadines, 2019
  SUR: [6.5, 'americas'], // Suriname, 2019
  TTO: [8.8, 'americas'], // Trinidad and Tobago, 2019
  USA: [8.1, 'americas'], // United States, 2019
  URY: [7.5, 'americas'], // Uruguay, 2019
  VEN: [11.75, 'americas'], // Venezuela, 2019
  ALB: [15.01, 'europe'], // Albania, 2018
  AND: [15.5, 'europe'], // Andorra, 2018
  AUT: [24.62, 'europe'], // Austria, 2018
  BLR: [34.3, 'europe'], // Belarus, 2018
  BEL: [14, 'europe'], // Belgium, 2018
  BGR: [14.12, 'europe'], // Bulgaria, 2018
  HRV: [17.2, 'europe'], // Croatia, 2018
  CYP: [7.8, 'europe'], // Cyprus, 2018
  CZE: [25.28, 'europe'], // Czech Republic, 2018
  DNK: [0, 'europe'], // Denmark, 2018
  EST: [33.8, 'europe'], // Estonia, 2018
  FIN: [19.36, 'europe'], // Finland, 2018
  FRA: [36.05, 'europe'], // France, 2018
  DEU: [20.555, 'europe'], // Germany, 2018
  GRC: [21.05, 'europe'], // Greece, 2018
  GGY: [6.6, 'europe'], // Guernsey, 2018
  HUN: [19.5, 'europe'], // Hungary, 2018
  ISL: [15.35, 'europe'], // Iceland, 2018
  IRL: [8.6, 'europe'], // Ireland, 2018
  IMN: [12.8, 'europe'], // Isle of Man, 2018
  ITA: [29.47, 'europe'], // Italy, 2018
  JEY: [6.5, 'europe'], // Jersey, 2018
  LVA: [24.09, 'europe'], // Latvia, 2018
  LIE: [15.3, 'europe'], // Liechtenstein, 2018
  LTU: [27.48, 'europe'], // Lithuania, 2018
  LUX: [9.15, 'europe'], // Luxembourg, 2018
  MLT: [10, 'europe'], // Malta, 2018
  MDA: [23, 'europe'], // Moldova, 2018
  MCO: [23.17, 'europe'], // Monaco, 2018
  NLD: [10.49, 'europe'], // Netherlands, 2018
  NOR: [16.1, 'europe'], // Norway, 2018
  POL: [19.11, 'europe'], // Poland, 2018
  PRT: [23.75, 'europe'], // Portugal, 2018
  ROU: [2.25, 'europe'], // Romania, 2018
  RUS: [25.1, 'europe'], // Russia, 2018
  SMR: [34.8, 'europe'], // San Marino, 2018
  SRB: [17.9, 'europe'], // Serbia, 2018
  SVK: [20.2, 'europe'], // Slovakia, 2018
  SVN: [16.1, 'europe'], // Slovenia, 2018
  ESP: [31.08, 'europe'], // Spain, 2018
  SWE: [20.97, 'europe'], // Sweden, 2018
  CHE: [9.82, 'europe'], // Switzerland, 2018
  TUR: [15, 'europe'], // Turkey, 2018
  UKR: [22, 'europe'], // Ukraine, 2018
  GBR: [15.7, 'europe'], // United Kingdom, 2018
  ARM: [0, 'asia'], // Armenia, 2018
  AUS: [9.5, 'asia'], // Australia, 2018
  AZE: [22.5, 'asia'], // Azerbaijan, 2018
  BHR: [13, 'asia'], // Bahrain, 2018
  BGD: [0, 'asia'], // Bangladesh, 2018
  BTN: [5, 'asia'], // Bhutan, 2018
  BRN: [8.5, 'asia'], // Brunei, 2018
  MMR: [3, 'asia'], // Burma (Myanmar), 2018
  KHM: [3.4, 'asia'], // Cambodia, 2018
  CHN: [23.75, 'asia'], // China, 2018
  FJI: [10, 'asia'], // Fiji, 2018
  GEO: [2, 'asia'], // Georgia, 2018
  HKG: [5, 'asia'], // Hong Kong (China), 2018
  IND: [20.75, 'asia'], // India, 2018
  IDN: [6.24, 'asia'], // Indonesia, 2018
  IRN: [17, 'asia'], // Iran, 2018
  ISR: [3.43, 'asia'], // Israel, 2018
  JPN: [15.29, 'asia'], // Japan, 2018
  JOR: [14.25, 'asia'], // Jordan, 2018
  KAZ: [3.5, 'asia'], // Kazakhstan, 2018
  KIR: [7.5, 'asia'], // Kiribati, 2018
  KWT: [10.5, 'asia'], // Kuwait, 2018
  KGZ: [15.25, 'asia'], // Kyrgyzstan, 2018
  LAO: [5.25, 'asia'], // Laos, 2018
  LBN: [14.5, 'asia'], // Lebanon, 2018
  MYS: [14.95, 'asia'], // Malaysia, 2018
  MHL: [8, 'asia'], // Marshall Islands, 2018
  FSM: [7.5, 'asia'], // Micronesia, 2018
  NPL: [10, 'asia'], // Nepal, 2018
  NZL: [0, 'asia'], // New Zealand, 2018
  OMN: [11.5, 'asia'], // Oman, 2018
  PAK: [11, 'asia'], // Pakistan, 2018
  PLW: [7, 'asia'], // Palau, 2018
  PNG: [8.4, 'asia'], // Papua New Guinea, 2018
  PHL: [0, 'asia'], // Philippines, 2018
  QAT: [10, 'asia'], // Qatar, 2018
  WSM: [7, 'asia'], // Samoa, 2018
  SAU: [12, 'asia'], // Saudi Arabia, 2018
  SGP: [17, 'asia'], // Singapore, 2018
  SLB: [7.5, 'asia'], // Solomon Islands, 2018
  KOR: [6.1, 'asia'], // South Korea, 2018
  LKA: [15, 'asia'], // Sri Lanka, 2018
  SYR: [17.1, 'asia'], // Syria, 2018
  TWN: [13.57, 'asia'], // Taiwan (China), 2018
  TJK: [25, 'asia'], // Tajikistan, 2018
  THA: [5.2, 'asia'], // Thailand, 2018
  TKM: [22, 'asia'], // Turkmenistan, 2018
  UZB: [25, 'asia'], // Uzbekistan, 2018
  VUT: [4, 'asia'], // Vanuatu, 2018
  VNM: [18.5, 'asia'], // Vietnam, 2018
  YEM: [10, 'asia'], // Yemen, 2018
};
const VOLUME: Record<Volume, { nome: string; ano: number }> = {
  africa: { nome: 'África', ano: 2019 }, americas: { nome: 'Américas', ano: 2019 }, europe: { nome: 'Europa', ano: 2018 }, asia: { nome: 'Ásia e Pacífico', ano: 2018 },
};

/** Fator de encargos do país (1 + contribuição patronal); 1 quando o país não está na tabela. */
export function fatorEncargos(iso3: string | null | undefined): number {
  const v = iso3 ? CONTRIBUICAO_PATRONAL[iso3] : undefined;
  return v ? 1 + v[0] / 100 : 1;
}
/** Taxa e fonte dos encargos do país, para a explicação da conta. */
export function encargosDoPais(iso3: string | null | undefined): { taxa: number; ano: number; volume: string; url: string } | null {
  const v = iso3 ? CONTRIBUICAO_PATRONAL[iso3] : undefined;
  if (!v) return null;
  const vol = VOLUME[v[1]];
  return { taxa: v[0], ano: vol.ano, volume: vol.nome, url: `https://www.ssa.gov/policy/docs/progdesc/ssptw/2018-2019/${v[1]}/guide.html` };
}
