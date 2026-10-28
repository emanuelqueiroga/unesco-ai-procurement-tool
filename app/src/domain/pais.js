// =====================================================================
// País da rede, origem dos valores e faixa de referência de cada premissa de custo
// (porte de src/pais.js da 0.0.15-rc.1: BL1.1 a BL1.5, BL4.3). Puro: recebe o caso (ou a cfg) por parâmetro.
// Cadeia de recuo de cada valor: editado pela pessoa (caso.editados) → dado do país (paises.json) → linha do
// país ou da região na base de referências → linha global (valor ilustrativo). A lista das premissas do caso
// (premissasDoCaso) e a versão das bases ficam em referencias.js, o contrato com o relatório.
// =====================================================================
import { PAISES_DADOS, refLinha, temFaixa, foraDaFaixaLinha, origemDaLinha } from './referencias_base.js';
import { tr, LOC, getLang, lerNumero } from './i18n.js';

// Campos do perfil de país (BL1.2). tipo: int (contagem), pct100 (0 a 100), usd (US$ por ano), frac (fração por ano,
// mostrada em %), lista (códigos de idioma). ref: id da linha da base que dá a estimativa da região ou o valor ilustrativo.
const PAIS_CAMPOS = [
  { id: 'escolas', rotulo: 'Escolas', unidade: 'escolas', tipo: 'int' },
  { id: 'estudantes', rotulo: 'Estudantes', unidade: 'estudantes', tipo: 'int' },
  { id: 'professores', rotulo: 'Professores', unidade: 'professores', tipo: 'int' },
  { id: 'pctUrbano', rotulo: 'População urbana', unidade: '%', tipo: 'pct100' },
  { id: 'pctEscolasInternet', rotulo: 'Escolas com internet', unidade: '%', tipo: 'pct100' },
  { id: 'salarioProfessor', rotulo: 'Salário do professor (US$ por ano)', unidade: 'US$ por ano', tipo: 'usd' },
  { id: 'inflacao', rotulo: 'Inflação anual', unidade: '% por ano', tipo: 'frac', ref: 'macro.inflacao' },
  { id: 'taxaDesconto', rotulo: 'Taxa de desconto real', unidade: '% por ano', tipo: 'frac', ref: 'macro.taxaDesconto' },
  { id: 'idiomas', rotulo: 'Idiomas de ensino', unidade: '', tipo: 'lista' },
];
const PAIS_CAMPO_POR_ID = {}; PAIS_CAMPOS.forEach(c => { PAIS_CAMPO_POR_ID[c.id] = c; });
/** campos do perfil que o motor usa quando têm valor (cfgDoCaso, casos.js) */
const PAIS_CAMPOS_NO_CUSTO = ['inflacao', 'taxaDesconto', 'salarioProfessor', 'pctEscolasInternet', 'escolas'];
const GRAU_NOME = { A: 'A: estatística oficial', B: 'B: estudo ou registro de compra', C: 'C: estimativa de especialista ou convenção da ferramenta' };
const ORIGEM_ROTULO = { pais: 'dos dados do país', usuario: 'editado por você', regiao: 'estimado pela região', ilustrativo: 'valor ilustrativo' };
const RENDA_NOME = { baixa: 'renda baixa', 'media-baixa': 'renda média-baixa', 'media-alta': 'renda média-alta', alta: 'renda alta' };
const OUTRO_PAIS = 'outro';
/** horas de trabalho por pessoa por ano: converte o salário anual do professor em custo da hora de formação */
const ID_HORAS_ANO = 'conv.horasAno';
// ISO 3166-1 alfa-2 dos países da base, para o nome no idioma da tela (Intl.DisplayNames)
const ISO2 = { BRA: 'BR', MEX: 'MX', KEN: 'KE', MAR: 'MA', IDN: 'ID' };

// ---------------------------------------------------------------- país e escopos
function listaPaises() { return PAISES_DADOS.paises || []; }
function paisPorIso(iso) { return listaPaises().find(p => p.iso3 === iso) || null; }
function paisDoCaso(caso) { return caso && caso.pais && caso.pais !== OUTRO_PAIS ? paisPorIso(caso.pais) : null; }
function nomeRegiao(cod) { const r = (PAISES_DADOS.regioes || []).find(x => x.codigo === cod); return r ? r.nome : cod; }
/** nome do país no idioma da tela: em português, o da base; nos outros, o do Intl (sem ele, a tradução do dicionário) */
function nomePais(p) {
  if (!p) return '';
  if (getLang() === 'pt') return p.nome;
  try {
    const i2 = ISO2[p.iso3];
    const n = i2 && typeof Intl !== 'undefined' && Intl.DisplayNames ? new Intl.DisplayNames([String(LOC())], { type: 'region' }).of(i2) : '';
    if (n && n !== i2) return n;
  } catch (e) { /* Intl sem nomes de região: vale o dicionário */ }
  return String(tr(p.nome));
}
/** países em ordem alfabética do nome exibido */
function paisesOrdenados() {
  const L = listaPaises().map(p => ({ iso3: p.iso3, nome: nomePais(p), moeda: p.moeda, regiao: p.regiao }));
  try { return L.sort((a, b) => a.nome.localeCompare(b.nome, String(LOC()))); } catch (e) { return L; }
}
/** cadeia de escopos do país (['BRA', 'LAC', 'global']); null sem país (não listado ou não respondido): vale só o global, como na v13 */
function escoposDeCaso(caso) { const p = paisDoCaso(caso); return p ? [p.iso3, p.regiao, 'global'] : null; }
function linhaDoCaso(id, caso) { return refLinha(id, escoposDeCaso(caso)); }
function fonteDeLinha(row) { return row.fonte && row.fonte.titulo ? row.fonte.titulo : ''; }
/** descrição de um valor (origem, fonte, url, ano, grau) a partir da linha da base */
function infoDeLinha(row) {
  return { origem: origemDaLinha(row), fonte: fonteDeLinha(row), url: (row.fonte && row.fonte.url) || null, ano: row.anoPreco == null ? null : row.anoPreco, grau: row.grau };
}
/** a nota do país escolhido: moeda, região e grupo de renda (com a fonte); null sem país */
function notaPais(caso) {
  const p = paisDoCaso(caso); if (!p) return null;
  const g = p.grupoRenda || null;
  return { iso3: p.iso3, nome: nomePais(p), moeda: p.moeda, regiao: p.regiao, nomeRegiao: nomeRegiao(p.regiao),
    renda: g && g.valor ? RENDA_NOME[g.valor] || g.valor : '', fonteRenda: g && g.fonte ? g.fonte : '', anoRenda: g && g.ano != null ? g.ano : null };
}

// ---------------------------------------------------------------- campos do perfil: valor efetivo e origem
// Ordem: valor editado pela pessoa (caso.editados) → dado do país (paises.json) → linha do país ou da região na
// base → linha global (valor ilustrativo). Devolve null quando não há valor nenhum (nada é inventado).
function valorEfetivoCampo(caso, campo) {
  const def = PAIS_CAMPO_POR_ID[campo]; if (!def) return null;
  const base = { campo, rotulo: def.rotulo, unidade: def.unidade, tipo: def.tipo };
  const ed = caso && caso.editados ? caso.editados[campo] : undefined;
  const p = paisDoCaso(caso);
  const dado = p ? p[campo] : null;
  const esc = escoposDeCaso(caso);
  const row = def.ref ? refLinha(def.ref, esc) : (esc ? refLinha('pais.' + campo, esc) : null);
  const padrao = dado && dado.valor != null ? { valor: dado.valor, origem: 'pais', fonte: dado.fonte || '', url: null, ano: dado.ano == null ? null : dado.ano, grau: null, baixo: null, alto: null }
    : row ? Object.assign({ valor: row.valor, baixo: row.baixo, alto: row.alto }, infoDeLinha(row)) : null;
  if (ed !== undefined && ed !== null && ed !== '') {
    return Object.assign({}, base, { valor: ed, origem: 'usuario', fonte: 'Informado por você', url: null, ano: null, grau: null, baixo: padrao ? padrao.baixo : null, alto: padrao ? padrao.alto : null,
      padrao: padrao ? padrao.valor : null, origemPadrao: padrao ? padrao.origem : null });
  }
  return padrao ? Object.assign({}, base, padrao) : null;
}
/** Escolhe o país num caso (muta o objeto): grava caso.pais e descarta as edições do perfil anterior. Devolve o perfil (ou null). */
function escolherPais(caso, iso) {
  caso.pais = iso && (iso === OUTRO_PAIS || paisPorIso(iso)) ? iso : '';
  caso.editados = {};
  return paisDoCaso(caso);
}
/** valor digitado (texto ou número, na unidade mostrada) → valor guardado (fração para 'frac'); '' quando vazio ou inválido */
function lerValorCampo(def, txt) {
  if (def.tipo === 'lista') {
    const L = (Array.isArray(txt) ? txt : String(txt == null ? '' : txt).split(/[\s,;]+/)).map(s => String(s).trim().toLowerCase()).filter(Boolean);
    return L.length ? L : '';
  }
  if (txt === '' || txt == null) return '';
  const n = typeof txt === 'number' ? txt : lerNumero(txt);
  if (n === '' || !Number.isFinite(+n)) return '';
  const v = +n;
  if (def.tipo === 'frac') return v / 100;
  if (def.tipo === 'pct100') return Math.min(100, Math.max(0, v));
  return Math.max(0, v);
}
/** grava (ou apaga, com '' ou null) o valor editado de um campo do perfil (muta o caso) */
function editarCampoPais(caso, campo, valor) {
  caso.editados = caso.editados && typeof caso.editados === 'object' ? caso.editados : {};
  if (valor === '' || valor == null || (Array.isArray(valor) && !valor.length)) delete caso.editados[campo]; else caso.editados[campo] = valor;
}
function restaurarCampoPais(caso, campo) { if (caso && caso.editados) delete caso.editados[campo]; }
/** valor do campo como o controle o mostra: número (porcentagem em %, não em fração) ou, nas listas, texto separado por vírgula */
function valorParaTexto(def, v) {
  if (v == null || v === '') return '';
  if (def.tipo === 'lista') return Array.isArray(v) ? v.join(', ') : String(v);
  const x = def.tipo === 'frac' ? +(+v * 100).toFixed(6) : +v;
  return Number.isFinite(x) ? x : '';
}
/** fonte, ano e grau de um valor, numa linha traduzida ("Fonte: … · Ano: 2026 · Grau: C: …") */
function dicaOrigem(info) {
  const partes = [];
  if (info.fonte) partes.push(tr('Fonte:') + ' ' + tr(info.fonte));
  partes.push(tr('Ano') + ': ' + (info.ano == null ? tr('não informado') : info.ano));
  partes.push(tr('Grau') + ': ' + (info.grau ? tr(GRAU_NOME[info.grau] || info.grau) : tr('não se aplica')));
  return partes.join(' · ');
}
/** perfil do país inteiro, campo a campo, para o bloco "Dados do país": { def, info (valorEfetivoCampo ou null), editado } */
function perfilDoPais(caso) {
  return PAIS_CAMPOS.map(def => {
    const info = valorEfetivoCampo(caso, def.id);
    const ed = caso && caso.editados ? caso.editados[def.id] : undefined;
    return { def, info, editado: ed !== undefined && ed !== null && ed !== '', noCusto: PAIS_CAMPOS_NO_CUSTO.includes(def.id) };
  });
}
/**
 * Moeda de exibição ao escolher um país: a do país, só se a moeda ainda for o dólar (decisão do Emanuel) ou se foi a
 * própria ferramenta que a trocou pelo país anterior (moeda.doPais); a escolha da pessoa não muda. Sem país (ou "outro"),
 * uma moeda posta pelo país volta ao dólar. Devolve a moeda nova ({ cod, taxa: '', taxaDe: '', doPais? }) ou null (fica).
 */
function moedaAoEscolherPais(moeda, iso) {
  const m = moeda || { cod: 'USD', taxa: '' };
  const cod = m.cod || 'USD';
  const anterior = m.doPais ? paisPorIso(m.doPais) : null;
  const automatica = !!anterior && anterior.moeda === cod;
  if (cod !== 'USD' && !automatica) return null;
  const p = iso && iso !== OUTRO_PAIS ? paisPorIso(iso) : null;
  if (p && p.moeda) return m.doPais === p.iso3 && cod === p.moeda ? null : { cod: p.moeda, taxa: '', taxaDe: '', doPais: p.iso3 };
  return automatica ? { cod: 'USD', taxa: '', taxaDe: '' } : null;
}

// ---------------------------------------------------------------- valores de custo ligados à base
// Cada campo de custo do motor liga-se a uma linha da base por um id: os exemplos guardam ref, refs, refP etc. nos
// objetos (custos.js, casos.js) e as exceções por caminho estão aqui. Devolve o id da linha para um caminho da cfg
// (o mesmo caminho de editarCfg na calculadora), ou ''.
const REF_CAMINHOS = {
  'saas.precoNominal': 'saas.precoNominal', 'api.Pin': 'api.modelo_intermediario.Pin', 'api.Pout': 'api.modelo_intermediario.Pout',
  'api.PinAux': 'api.modelo_pequeno.Pin', 'api.PoutAux': 'api.modelo_pequeno.Pout', 'api.PrerankMil': 'api.rerank', 'rag.Pemb': 'rag.embeddings', 'rag.Ppag': 'rag.ocr',
  'ow.Pgpu': 'ow.gpu.hora', 'ow.Pseg': 'ow.seg.hora', 'opc.pi': 'macro.inflacao', 'opc.r': 'macro.taxaDesconto',
};
function idRefDoCaminho(cfg, caminho) {
  if (!cfg || !caminho) return '';
  const p = String(caminho).split('.');
  if (REF_CAMINHOS[caminho]) return REF_CAMINHOS[caminho];
  if (p[0] === 'salarios' && p[1] && p.length === 2) return 'sal.' + p[1];
  if (caminho === 'saas.preco') return (cfg.saas && cfg.saas.refPreco) || 'saas.preco';
  if (caminho === 'formacaoTempo.horas') return (cfg.formacaoTempo || {}).refHoras || '';
  if (caminho === 'formacaoTempo.custoHora') return (cfg.formacaoTempo || {}).refCustoHora || '';
  if (caminho === 'saida.custoHora') return (cfg.saida || {}).refCustoHora || '';
  if (caminho === 'saida.horasRetreino') return (cfg.saida || {}).refHorasRetreino || '';
  if (caminho === 'saida.reindexFixo') return (cfg.saida || {}).refReindex || '';
  if (p[0] === 'implantacao') { const x = (cfg.implantacao || [])[+p[1]]; return x ? (p[2] === 'valor' ? x.ref : p[2] === 'manutPct' ? x.refManut : '') || '' : ''; }
  if (p[0] === 'mensais' && p[2] === 'valor') { const x = (cfg.mensais || [])[+p[1]]; return (x && x.ref) || ''; }
  if (p[0] === 'saida' && p[1] === 'itens' && p[3] === 'valor') { const x = ((cfg.saida || {}).itens || [])[+p[2]]; return (x && x.ref) || ''; }
  if (p[0] === 'itens' && p[2] === 'v' && p[3] != null) { const x = (cfg.itens || [])[+p[1]]; return (x && x.refs && x.refs[Math.min(+p[3], x.refs.length - 1)]) || ''; }
  return '';
}
// Item de K4.3 (programa de formação) é multiplicado pelo fator do formato em cfgDoCaso; o valor de referência
// compara-se ao valor sem o fator.
function escalaDoCaminho(cfg, caminho) {
  const p = String(caminho).split('.');
  if (p[0] === 'itens') { const x = ((cfg && cfg.itens) || [])[+p[1]]; const f = cfg.v11 && cfg.v11.formacao ? +cfg.v11.formacao.fatorFormato : 1; if (x && x.s === 'K4.3' && f > 0) return f; }
  return 1;
}
function lerCaminho(obj, caminho) { return String(caminho).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj); }
/**
 * Faixa de referência de um campo da calculadora (BL4.3). valorBruto: o valor na unidade da cfg (fração, não %); sem
 * ele, o da cfg. Devolve null se o campo não tem linha na base; senão
 * { id, linha, valor, baixo, alto, padrao, fora, semFaixa, grau, origem, fonte, url, ano, unidade, item }.
 */
function faixaDoCampo(cfg, caminho, caso, valorBruto) {
  const id = idRefDoCaminho(cfg, caminho); if (!id) return null;
  const row = linhaDoCaso(id, caso); if (!row) return null;
  const v = valorBruto === undefined ? lerCaminho(cfg, caminho) : valorBruto;
  const esc = escalaDoCaminho(cfg, caminho);
  const vv = v !== '' && v != null && Number.isFinite(+v) ? +v / esc : NaN;
  return Object.assign({ id, linha: row, valor: vv, baixo: row.baixo, alto: row.alto, padrao: row.valor, escala: esc, fora: foraDaFaixaLinha(row, vv), semFaixa: !temFaixa(row),
    unidade: row.unidade, item: row.item }, infoDeLinha(row));
}

export { PAIS_CAMPOS, PAIS_CAMPO_POR_ID, PAIS_CAMPOS_NO_CUSTO, ORIGEM_ROTULO, GRAU_NOME, RENDA_NOME, OUTRO_PAIS, ID_HORAS_ANO, REF_CAMINHOS,
  listaPaises, paisPorIso, paisDoCaso, nomeRegiao, nomePais, paisesOrdenados, escoposDeCaso, linhaDoCaso, infoDeLinha, notaPais,
  valorEfetivoCampo, escolherPais, lerValorCampo, editarCampoPais, restaurarCampoPais, valorParaTexto, dicaOrigem, perfilDoPais, moedaAoEscolherPais,
  idRefDoCaminho, escalaDoCaminho, faixaDoCampo };
