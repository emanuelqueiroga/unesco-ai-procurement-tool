// v018: contribuição patronal à seguridade social, em % da folha (fator de encargos = 1 + taxa/100), por país (ISO 3166
// alfa-3). Fonte: Social Security Programs Throughout the World (SSA e ISSA), tabela 4, África e Américas 2019, Europa
// e Ásia e Pacífico 2018. Taxas com teto ou em que o empregador também paga benefícios diretamente subestimam o encargo.
export const CONTRIBUICAO_PATRONAL: Record<string, number> = {
  DZA: 25, // Algeria, 2019
  AGO: 8, // Angola, 2019
  BEN: 16.4, // Benin, 2019
  BWA: 0, // Botswana, 2019
  BFA: 16, // Burkina Faso, 2019
  BDI: 9, // Burundi, 2019
  CPV: 17, // Cabo Verde, 2019
  CMR: 12.95, // Cameroon, 2019
  CAF: 19, // Central African Republic, 2019
  TCD: 16.5, // Chad, 2019
  COD: 13, // Congo, Democratic Republic of the, 2019
  COG: 20.28, // Congo, Republic of the, 2019
  CIV: 15.45, // Côte d'Ivoire, 2019
  DJI: 10.7, // Djibouti, 2019
  EGY: 26, // Egypt, 2019
  GNQ: 21.5, // Equatorial Guinea, 2019
  SWZ: 5, // Eswatini (Swaziland), 2019
  ETH: 11, // Ethiopia, 2019
  GAB: 16, // Gabon, 2019
  GMB: 11, // Gambia, 2019
  GHA: 13, // Ghana, 2019
  GIN: 18, // Guinea, 2019
  GNB: 16, // Guinea-Bissau, 2019
  KEN: 5, // Kenya, 2019
  LSO: 0, // Lesotho, 2019
  LBR: 6, // Liberia, 2019
  LBY: 10.5, // Libya, 2019
  MDG: 13, // Madagascar, 2019
  MWI: 10, // Malawi, 2019
  MLI: 14.4, // Mali, 2019
  MRT: 13, // Mauritania, 2019
  MUS: 8.5, // Mauritius, 2019
  MAR: 15.38, // Morocco, 2019
  MOZ: 4, // Mozambique, 2019
  NAM: 0.9, // Namibia, 2019
  NER: 16.4, // Niger, 2019
  NGA: 11, // Nigeria, 2019
  RWA: 5.3, // Rwanda, 2019
  STP: 6, // São Tomé and Príncipe, 2019
  SEN: 16.4, // Senegal, 2019
  SYC: 3, // Seychelles, 2019
  SLE: 10, // Sierra Leone, 2019
  ZAF: 1, // South Africa, 2019
  SDN: 17, // Sudan, 2019
  TZA: 11, // Tanzania, 2019
  TGO: 17.5, // Togo, 2019
  TUN: 15.7389, // Tunisia, 2019
  UGA: 10, // Uganda, 2019
  ZMB: 5, // Zambia, 2019
  ZWE: 3.5, // Zimbabwe, 2019
  ATG: 7.5, // Antigua and Barbuda, 2019
  ARG: 16.23, // Argentina, 2019
  ABW: 16.95, // Aruba, 2019
  BHS: 5.9, // Bahamas, 2019
  BRB: 11.75, // Barbados, 2019
  BMU: 5, // Bermuda, 2019
  BOL: 27.71, // Bolivia, 2019
  BRA: 21, // Brazil, 2019
  VGB: 4.5, // British Virgin Islands, 2019
  CAN: 7.368, // Canada, 2019
  CHL: 4.86, // Chile, 2019
  COL: 24.848, // Colombia, 2019
  CRI: 24.08, // Costa Rica, 2019
  CUB: 14.5, // Cuba, 2019
  DMA: 6.75, // Dominica, 2019
  DOM: 15.39, // Dominican Republic, 2019
  ECU: 12.42, // Ecuador, 2019
  SLV: 15.25, // El Salvador, 2019
  GRD: 5, // Grenada, 2019
  GTM: 10.67, // Guatemala, 2019
  GUY: 8.4, // Guyana, 2019
  HTI: 11, // Haiti, 2019
  HND: 10.48, // Honduras, 2019
  JAM: 2.75, // Jamaica, 2019
  MEX: 9.1, // Mexico, 2019
  NIC: 21.5, // Nicaragua, 2019
  PAN: 4.25, // Panama, 2019
  PRY: 16.5, // Paraguay, 2019
  PER: 9.63, // Peru, 2019
  KNA: 6, // Saint Kitts and Nevis, 2019
  LCA: 5, // Saint Lucia, 2019
  VCT: 5.5, // Saint Vincent and the Grenadines, 2019
  SUR: 6.5, // Suriname, 2019
  TTO: 8.8, // Trinidad and Tobago, 2019
  USA: 8.1, // United States, 2019
  URY: 7.5, // Uruguay, 2019
  VEN: 11.75, // Venezuela, 2019
  ALB: 15.01, // Albania, 2018
  AND: 15.5, // Andorra, 2018
  AUT: 24.62, // Austria, 2018
  BLR: 34.3, // Belarus, 2018
  BEL: 14, // Belgium, 2018
  BGR: 14.12, // Bulgaria, 2018
  HRV: 17.2, // Croatia, 2018
  CYP: 7.8, // Cyprus, 2018
  CZE: 25.28, // Czech Republic, 2018
  DNK: 0, // Denmark, 2018
  EST: 33.8, // Estonia, 2018
  FIN: 19.36, // Finland, 2018
  FRA: 36.05, // France, 2018
  DEU: 20.555, // Germany, 2018
  GRC: 21.05, // Greece, 2018
  GGY: 6.6, // Guernsey, 2018
  HUN: 19.5, // Hungary, 2018
  ISL: 15.35, // Iceland, 2018
  IRL: 8.6, // Ireland, 2018
  IMN: 12.8, // Isle of Man, 2018
  ITA: 29.47, // Italy, 2018
  JEY: 6.5, // Jersey, 2018
  LVA: 24.09, // Latvia, 2018
  LIE: 15.3, // Liechtenstein, 2018
  LTU: 27.48, // Lithuania, 2018
  LUX: 9.15, // Luxembourg, 2018
  MLT: 10, // Malta, 2018
  MDA: 23, // Moldova, 2018
  MCO: 23.17, // Monaco, 2018
  NLD: 10.49, // Netherlands, 2018
  NOR: 16.1, // Norway, 2018
  POL: 19.11, // Poland, 2018
  PRT: 23.75, // Portugal, 2018
  ROU: 2.25, // Romania, 2018
  RUS: 25.1, // Russia, 2018
  SMR: 34.8, // San Marino, 2018
  SRB: 17.9, // Serbia, 2018
  SVK: 20.2, // Slovakia, 2018
  SVN: 16.1, // Slovenia, 2018
  ESP: 31.08, // Spain, 2018
  SWE: 20.97, // Sweden, 2018
  CHE: 9.82, // Switzerland, 2018
  TUR: 15, // Turkey, 2018
  UKR: 22, // Ukraine, 2018
  GBR: 15.7, // United Kingdom, 2018
  ARM: 0, // Armenia, 2018
  AUS: 9.5, // Australia, 2018
  AZE: 22.5, // Azerbaijan, 2018
  BHR: 13, // Bahrain, 2018
  BGD: 0, // Bangladesh, 2018
  BTN: 5, // Bhutan, 2018
  BRN: 8.5, // Brunei, 2018
  MMR: 3, // Burma (Myanmar), 2018
  KHM: 3.4, // Cambodia, 2018
  CHN: 23.75, // China, 2018
  FJI: 10, // Fiji, 2018
  GEO: 2, // Georgia, 2018
  HKG: 5, // Hong Kong (China), 2018
  IND: 20.75, // India, 2018
  IDN: 6.24, // Indonesia, 2018
  IRN: 17, // Iran, 2018
  ISR: 3.43, // Israel, 2018
  JPN: 15.29, // Japan, 2018
  JOR: 14.25, // Jordan, 2018
  KAZ: 3.5, // Kazakhstan, 2018
  KIR: 7.5, // Kiribati, 2018
  KWT: 10.5, // Kuwait, 2018
  KGZ: 15.25, // Kyrgyzstan, 2018
  LAO: 5.25, // Laos, 2018
  LBN: 14.5, // Lebanon, 2018
  MYS: 14.95, // Malaysia, 2018
  MHL: 8, // Marshall Islands, 2018
  FSM: 7.5, // Micronesia, 2018
  NPL: 10, // Nepal, 2018
  NZL: 0, // New Zealand, 2018
  OMN: 11.5, // Oman, 2018
  PAK: 11, // Pakistan, 2018
  PLW: 7, // Palau, 2018
  PNG: 8.4, // Papua New Guinea, 2018
  PHL: 0, // Philippines, 2018
  QAT: 10, // Qatar, 2018
  WSM: 7, // Samoa, 2018
  SAU: 12, // Saudi Arabia, 2018
  SGP: 17, // Singapore, 2018
  SLB: 7.5, // Solomon Islands, 2018
  KOR: 6.1, // South Korea, 2018
  LKA: 15, // Sri Lanka, 2018
  SYR: 17.1, // Syria, 2018
  TWN: 13.57, // Taiwan (China), 2018
  TJK: 25, // Tajikistan, 2018
  THA: 5.2, // Thailand, 2018
  TKM: 22, // Turkmenistan, 2018
  UZB: 25, // Uzbekistan, 2018
  VUT: 4, // Vanuatu, 2018
  VNM: 18.5, // Vietnam, 2018
  YEM: 10, // Yemen, 2018
};

/** Fator de encargos do país (1 + contribuição patronal); 1 quando o país não está na tabela. */
export function fatorEncargos(iso3: string | null | undefined): number {
  const v = iso3 ? CONTRIBUICAO_PATRONAL[iso3] : undefined;
  return typeof v === 'number' ? 1 + v / 100 : 1;
}
