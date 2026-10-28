// Valida data/referencias.json e data/paises.json (porte para Node de tools/checar_referencias.py da 0.0.15-rc.1, BL4.5).
// Campos obrigatórios, par id + escopo único, baixo ≤ valor ≤ alto, grau A/B/C, ISO3 e códigos de região, moeda existente
// em moedas.json, datas e URLs, "convenção da ferramenta só pode ter grau C" e, para toda linha de país ou de região, a
// linha global correspondente (cadeia de recuo). Roda no prebuild (package.json): sai com código 1 e lista cada problema.
// Uso: node scripts/checar-referencias.mjs [--refs ARQ] [--paises ARQ] [--moedas ARQ]
// Também exporta checar(refs, paises, moedas) → lista de problemas (vazia = tudo certo), usada pelos testes.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
// ISO 3166-1 alfa-3 (249 códigos)
const ISO3 = new Set(`ABW AFG AGO AIA ALA ALB AND ARE ARG ARM ASM ATA ATF ATG AUS AUT AZE BDI BEL BEN BES BFA BGD BGR BHR BHS BIH BLM BLR BLZ BMU BOL BRA BRB BRN BTN BVT BWA CAF CAN CCK CHE CHL CHN CIV CMR COD COG COK COL COM CPV CRI CUB CUW CXR CYM CYP CZE DEU DJI DMA DNK DOM DZA ECU EGY ERI ESH ESP EST ETH FIN FJI FLK FRA FRO FSM GAB GBR GEO GGY GHA GIB GIN GLP GMB GNB GNQ GRC GRD GRL GTM GUF GUM GUY HKG HMD HND HRV HTI HUN IDN IMN IND IOT IRL IRN IRQ ISL ISR ITA JAM JEY JOR JPN KAZ KEN KGZ KHM KIR KNA KOR KWT LAO LBN LBR LBY LCA LIE LKA LSO LTU LUX LVA MAC MAF MAR MCO MDA MDG MDV MEX MHL MKD MLI MLT MMR MNE MNG MNP MOZ MRT MSR MTQ MUS MWI MYS MYT NAM NCL NER NFK NGA NIC NIU NLD NOR NPL NRU NZL OMN PAK PAN PCN PER PHL PLW PNG POL PRI PRK PRT PRY PSE PYF QAT REU ROU RUS RWA SAU SDN SEN SGP SGS SHN SJM SLB SLE SLV SMR SOM SPM SRB SSD STP SUR SVK SVN SWE SWZ SXM SYC SYR TCA TCD TGO THA TJK TKL TKM TLS TON TTO TUN TUR TUV TWN TZA UGA UKR UMI URY USA UZB VAT VCT VEN VGB VIR VNM VUT WLF WSM YEM ZAF ZMB ZWE`.split(/\s+/));
const GRAUS = new Set(['A', 'B', 'C']);
const GRUPOS_RENDA = ['alta', 'baixa', 'media-alta', 'media-baixa'];
const CAMPOS_PAIS = ['escolas', 'estudantes', 'professores', 'pctUrbano', 'pctEscolasInternet', 'salarioProfessor', 'inflacao', 'taxaDesconto', 'idiomas'];
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const VERSAO = /^\d+\.\d+\.\d+$/;
const CODIGO_REGIAO = /^[A-Z]{2,5}$/;

const num = (x) => typeof x === 'number' && Number.isFinite(x);
const obj = (x) => x != null && typeof x === 'object' && !Array.isArray(x);
const str = (x) => typeof x === 'string';
const cheio = (x) => str(x) && x.trim() !== '';
const anoInt = (x) => Number.isInteger(x) && x >= 1950 && x <= 2100;
const rep = (x) => (x === undefined ? 'undefined' : JSON.stringify(x));

/** Devolve a lista de problemas (vazia = tudo certo). */
export function checar(refs, paises, moedas) {
  const E = [];
  const taxas = (moedas && moedas.taxas) || {};
  // --- cabeçalhos de versão
  for (const [nome, d] of [['referencias.json', refs], ['paises.json', paises]]) {
    if (!obj(d)) { E.push(`${nome}: a raiz deve ser um objeto`); continue; }
    if (!str(d.versao) || !VERSAO.test(d.versao)) E.push(`${nome}: "versao" ausente ou fora do formato 1.0.0`);
    if (!str(d.atualizado) || !DATA.test(d.atualizado)) E.push(`${nome}: "atualizado" ausente ou fora do formato AAAA-MM-DD`);
  }
  if (!obj(refs) || !obj(paises)) return E;
  // --- regiões e países
  const regioes = paises.regioes;
  const codsRegiao = new Set();
  if (!Array.isArray(regioes) || !regioes.length) E.push('paises.json: "regioes" deve ser uma lista não vazia');
  else regioes.forEach((r, i) => {
    const c = obj(r) ? r.codigo : null;
    if (!str(c) || !CODIGO_REGIAO.test(c)) { E.push(`paises.json: regioes[${i}] sem código válido`); return; }
    if (ISO3.has(c)) E.push(`paises.json: o código de região ${c} coincide com um código ISO de país`);
    if (codsRegiao.has(c)) E.push(`paises.json: região ${c} repetida`);
    if (!cheio(r.nome)) E.push(`paises.json: região ${c} sem nome`);
    codsRegiao.add(c);
  });
  let lista = paises.paises;
  const isoVistos = new Set();
  if (!Array.isArray(lista) || !lista.length) { E.push('paises.json: "paises" deve ser uma lista não vazia'); lista = []; }
  lista.forEach((p, i) => {
    if (!obj(p)) { E.push(`paises[${i}]: deve ser um objeto`); return; }
    const iso = p.iso3, rot = `paises[${iso || i}]`;
    if (!ISO3.has(iso)) E.push(`${rot}: iso3 inválido (${rep(iso)})`);
    else if (isoVistos.has(iso)) E.push(`${rot}: iso3 repetido`);
    isoVistos.add(iso);
    ['nome', 'regiao', 'grupoRenda', 'moeda', ...CAMPOS_PAIS].forEach((k) => { if (!(k in p)) E.push(`${rot}: campo "${k}" ausente`); });
    if (!cheio(p.nome)) E.push(`${rot}: "nome" vazio`);
    if (!codsRegiao.has(p.regiao)) E.push(`${rot}: região ${rep(p.regiao)} não existe em "regioes"`);
    if (!(p.moeda in taxas)) E.push(`${rot}: moeda ${rep(p.moeda)} não existe em moedas.json`);
    ['grupoRenda', ...CAMPOS_PAIS].forEach((k) => {
      const v = p[k];
      if (v == null) { if (k === 'grupoRenda') E.push(`${rot}: "grupoRenda" não pode ser nulo`); return; }
      if (!obj(v) || !['valor', 'fonte', 'ano'].every((c) => c in v)) { E.push(`${rot}.${k}: deve ser null ou {valor, fonte, ano}`); return; }
      if (!cheio(v.fonte)) E.push(`${rot}.${k}: "fonte" vazia`);
      if (v.ano !== null && !anoInt(v.ano)) E.push(`${rot}.${k}: "ano" deve ser inteiro de 1950 a 2100 ou null`);
      const x = v.valor;
      if (k === 'grupoRenda') { if (!GRUPOS_RENDA.includes(x)) E.push(`${rot}.grupoRenda: valor deve ser um de ${JSON.stringify(GRUPOS_RENDA)}`); }
      else if (k === 'idiomas') { if (!Array.isArray(x) || !x.length || !x.every((s) => str(s) && /^[a-z]{2,3}$/.test(s))) E.push(`${rot}.idiomas: lista de códigos ISO 639 (ex.: ["pt"])`); }
      else if (!num(x)) E.push(`${rot}.${k}: valor deve ser número`);
      else if ((k === 'pctUrbano' || k === 'pctEscolasInternet') && !(x >= 0 && x <= 100)) E.push(`${rot}.${k}: porcentagem de 0 a 100`);
      else if ((k === 'inflacao' || k === 'taxaDesconto') && !(x >= -0.5 && x <= 5)) E.push(`${rot}.${k}: fração por ano (0,05 = 5%), entre -0,5 e 5`);
      else if (['escolas', 'estudantes', 'professores', 'salarioProfessor'].includes(k) && x < 0) E.push(`${rot}.${k}: não pode ser negativo`);
    });
  });
  // --- referências
  let itens = refs.referencias;
  if (!Array.isArray(itens) || !itens.length) { E.push('referencias.json: "referencias" deve ser uma lista não vazia'); itens = []; }
  const chaves = new Map();   // "id\u0000escopo" → [id, escopo]
  itens.forEach((r, i) => {
    if (!obj(r)) { E.push(`referencias[${i}]: deve ser um objeto`); return; }
    const rid = r.id, rot = `referencias[${rid || i}]`;
    ['id', 'item', 'unidade', 'valor', 'baixo', 'alto', 'moeda', 'anoPreco', 'escopo', 'fonte', 'acesso', 'grau'].forEach((k) => { if (!(k in r)) E.push(`${rot}: campo "${k}" ausente`); });
    if (!cheio(rid)) E.push(`${rot}: "id" vazio`);
    // a mesma grandeza pode ter uma linha por escopo; o par (id, escopo) é a chave
    const chave = rid + '\u0000' + r.escopo;
    if (chaves.has(chave)) E.push(`${rot}: par id e escopo repetido (${rep(r.escopo)})`);
    chaves.set(chave, [rid, r.escopo]);
    ['item', 'unidade'].forEach((k) => { if (!cheio(r[k])) E.push(`${rot}: "${k}" vazio`); });
    const v = r.valor, lo = r.baixo, hi = r.alto;
    if (!(num(v) && num(lo) && num(hi))) E.push(`${rot}: valor, baixo e alto devem ser números`);
    else if (!(lo <= v && v <= hi)) E.push(`${rot}: precisa valer baixo <= valor <= alto (${lo} <= ${v} <= ${hi})`);
    if (!GRAUS.has(r.grau)) E.push(`${rot}: grau deve ser A, B ou C (${rep(r.grau)})`);
    const esc = r.escopo;
    if (!(esc === 'global' || codsRegiao.has(esc) || ISO3.has(esc))) E.push(`${rot}: escopo ${rep(esc)} deve ser "global", um código de região de paises.json ou um ISO3`);
    const m = r.moeda;
    if (m != null && !(m in taxas)) E.push(`${rot}: moeda ${rep(m)} não existe em moedas.json`);
    const ap = r.anoPreco;
    if (m != null && !anoInt(ap)) E.push(`${rot}: anoPreco deve ser um ano inteiro quando há moeda`);
    if (m == null && ap != null && !Number.isInteger(ap)) E.push(`${rot}: anoPreco deve ser inteiro ou null`);
    const f = r.fonte;
    if (!obj(f) || !cheio(f.titulo) || !('url' in f)) E.push(`${rot}: "fonte" deve ser {titulo, url} com título não vazio`);
    else if (f.url !== null && !(str(f.url) && /^https?:\/\/\S+$/.test(f.url))) E.push(`${rot}: fonte.url deve ser null ou um endereço http(s)`);
    if (!str(r.acesso) || !DATA.test(r.acesso)) E.push(`${rot}: "acesso" deve estar no formato AAAA-MM-DD`);
    if ((r.grau === 'A' || r.grau === 'B') && obj(f) && f.url == null && String(f.titulo).includes('Convenção da ferramenta')) E.push(`${rot}: uma convenção da ferramenta só pode ter grau C`);
  });
  // toda grandeza com linha por país ou região precisa da linha global (cadeia de recuo); ids 'pais.*' ficam isentos
  const pares = [...chaves.values()];
  const globais = new Set(pares.filter(([, e]) => e === 'global').map(([id]) => id));
  pares.filter(([id, e]) => e !== 'global' && id != null).sort((a, b) => String(a[0]).localeCompare(String(b[0])) || String(a[1]).localeCompare(String(b[1])))
    .forEach(([id, e]) => { if (!globais.has(id) && !String(id).startsWith('pais.')) E.push(`referencias[${id}]: há linha de escopo ${e} sem a linha global correspondente`); });
  return E;
}

function lerJson(arq) { return JSON.parse(readFileSync(arq, 'utf8')); }

export function main(argv = process.argv.slice(2)) {
  const opc = { refs: resolve(RAIZ, 'data', 'referencias.json'), paises: resolve(RAIZ, 'data', 'paises.json'), moedas: resolve(RAIZ, 'data', 'moedas.json') };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i].replace(/^--/, '');
    if (k in opc && argv[i + 1]) { opc[k] = resolve(argv[i + 1]); i++; }
  }
  const dados = [];
  for (const arq of [opc.refs, opc.paises, opc.moedas]) {
    try { dados.push(lerJson(arq)); } catch (e) { console.error(`erro: não consegui ler ${arq}: ${e.message}`); return 1; }
  }
  const erros = checar(dados[0], dados[1], dados[2]);
  if (erros.length) {
    console.error(`${erros.length} problema(s) em data/:`);
    erros.forEach((e) => console.error('  - ' + e));
    return 1;
  }
  console.log(`referências ok: ${dados[0].referencias.length} linhas (v${dados[0].versao}), ${dados[1].paises.length} países (v${dados[1].versao})`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main());
