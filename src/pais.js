// =====================================================================
// v14 (BL1.1 a BL1.5, BL4.1, BL4.3): país, origem dos valores e premissas do caso.
// Lê data/paises.json (PAISES, injetado pelo build) e a base de referências (REFERENCIAS, custos.js).
// Cadeia de recuo de cada valor: dado do país → estimativa da região → valor ilustrativo global.
// O relatório lê premissasDoCaso(caso, cfg) e versaoReferencias().
// =====================================================================
const _CUSTOS = typeof refLinha === 'function' ? { refLinha, REF_DADOS, opcoes, salario } : require('./custos.js');
const PAISES_DADOS = typeof PAISES !== 'undefined' ? PAISES : require('../data/paises.json');

// Campos do perfil de país (BL1.2). tipo: int (contagem), pct100 (0 a 100), usd (US$ por ano), frac (fração por ano, mostrada em %), lista (códigos de idioma).
// ref: id da linha da base de referências que dá a estimativa da região ou o valor ilustrativo (quando houver).
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
const GRAU_NOME = { A: 'A: estatística oficial', B: 'B: estudo ou registro de compra', C: 'C: estimativa de especialista ou convenção da ferramenta' };
const ORIGEM_ROTULO = { pais: 'dos dados do país', usuario: 'editado por você', regiao: 'estimado pela região', ilustrativo: 'valor ilustrativo' };
const OUTRO_PAIS = 'outro';

// ---------------------------------------------------------------- país e escopos
function listaPaises() { return PAISES_DADOS.paises || []; }
function paisPorIso(iso) { return listaPaises().find(p => p.iso3 === iso) || null; }
function paisDoCaso(caso) { return caso && caso.pais && caso.pais !== OUTRO_PAIS ? paisPorIso(caso.pais) : null; }
function nomeRegiao(cod) { const r = (PAISES_DADOS.regioes || []).find(x => x.codigo === cod); return r ? r.nome : cod; }
// Cadeia de escopos do país (['BRA', 'LAC', 'global']); null sem país (país não listado ou não respondido): vale só o global, como na v13.
function escoposDeCaso(caso) { const p = paisDoCaso(caso); return p ? [p.iso3, p.regiao, 'global'] : null; }
function origemDaLinha(row) {
  if (!row || row.escopo === 'global') return 'ilustrativo';
  return (PAISES_DADOS.regioes || []).some(r => r.codigo === row.escopo) ? 'regiao' : 'pais';
}
function fonteDeLinha(row) { return row.fonte && row.fonte.titulo ? row.fonte.titulo : ''; }
// descrição de um valor (origem, fonte, ano, grau) no formato de premissasDoCaso
function infoDeLinha(row) {
  return { origem: origemDaLinha(row), fonte: fonteDeLinha(row), url: (row.fonte && row.fonte.url) || null, ano: row.anoPreco == null ? null : row.anoPreco, grau: row.grau };
}
function temFaixa(row) { return !!row && +row.alto > +row.baixo; }
function foraDaFaixaLinha(row, v) { return temFaixa(row) && Number.isFinite(+v) && (+v < row.baixo - 1e-12 || +v > row.alto + 1e-12); }

// ---------------------------------------------------------------- campos do perfil: valor efetivo e marcador
// Ordem: valor editado pela pessoa (caso.editados) → dado do país (paises.json) → linha do país ou da região na base de
// referências → linha global (valor ilustrativo). Devolve null quando não há valor nenhum (nada é inventado).
function valorEfetivoCampo(caso, campo) {
  const def = PAIS_CAMPO_POR_ID[campo]; if (!def) return null;
  const base = { campo, rotulo: def.rotulo, unidade: def.unidade, tipo: def.tipo };
  const ed = caso && caso.editados ? caso.editados[campo] : undefined;
  const p = paisDoCaso(caso);
  const dado = p ? p[campo] : null;
  const esc = escoposDeCaso(caso);
  const row = def.ref ? _CUSTOS.refLinha(def.ref, esc) : (esc ? _CUSTOS.refLinha('pais.' + campo, esc) : null);
  const padrao = dado && dado.valor != null ? Object.assign({ valor: dado.valor, origem: 'pais', fonte: dado.fonte || '', url: null, ano: dado.ano == null ? null : dado.ano, grau: null, baixo: null, alto: null })
    : row ? Object.assign({ valor: row.valor, baixo: row.baixo, alto: row.alto }, infoDeLinha(row)) : null;
  if (ed !== undefined && ed !== null && ed !== '') {
    return Object.assign({}, base, { valor: ed, origem: 'usuario', fonte: 'Informado por você', url: null, ano: null, grau: null, baixo: padrao ? padrao.baixo : null, alto: padrao ? padrao.alto : null,
      padrao: padrao ? padrao.valor : null, origemPadrao: padrao ? padrao.origem : null });
  }
  return padrao ? Object.assign({}, base, padrao) : null;
}
// Escolhe o país: grava caso.pais e descarta as edições do perfil anterior. Devolve o perfil (ou null) para quem ajusta a moeda.
function escolherPais(caso, iso) {
  caso.pais = iso && (iso === OUTRO_PAIS || paisPorIso(iso)) ? iso : '';
  caso.editados = {};
  return paisDoCaso(caso);
}
// valor digitado (texto ou número, na unidade mostrada) → valor guardado (fração para 'frac')
function lerValorCampo(def, txt) {
  if (def.tipo === 'lista') { const L = String(txt == null ? '' : txt).split(/[\s,;]+/).map(s => s.trim().toLowerCase()).filter(Boolean); return L.length ? L : ''; }
  if (txt === '' || txt == null) return '';
  const n = typeof lerNumero === 'function' ? lerNumero(txt) : +String(txt).replace(',', '.');
  if (n === '' || !Number.isFinite(+n)) return '';
  const v = +n;
  if (def.tipo === 'frac') return v / 100;
  if (def.tipo === 'pct100') return Math.min(100, Math.max(0, v));
  return Math.max(0, v);
}
function editarCampoPais(caso, campo, valor) {
  caso.editados = caso.editados || {};
  if (valor === '' || valor == null) delete caso.editados[campo]; else caso.editados[campo] = valor;
}
function restaurarCampoPais(caso, campo) { if (caso.editados) delete caso.editados[campo]; }
// valor do campo como o controle o mostra: número (porcentagem em %, não em fração) ou, nas listas, texto separado por vírgula
function valorParaTexto(def, v) {
  if (v == null || v === '') return '';
  if (def.tipo === 'lista') return Array.isArray(v) ? v.join(', ') : String(v);
  const x = def.tipo === 'frac' ? +(+v * 100).toFixed(6) : +v;
  return Number.isFinite(x) ? x : '';
}
// dica do marcador: fonte, ano e grau
function dicaOrigem(info) {
  const t = typeof tr === 'function' ? tr : s => s;
  const partes = [];
  if (info.fonte) partes.push(t('Fonte:') + ' ' + t(info.fonte));
  partes.push(t('Ano') + ': ' + (info.ano == null ? t('não informado') : info.ano));
  partes.push(t('Grau') + ': ' + (info.grau ? t(GRAU_NOME[info.grau] || info.grau) : t('não se aplica')));
  return partes.join(' · ');
}

// ---------------------------------------------------------------- valores de custo da base de referências
// Cada campo de custo do motor liga-se a uma linha da base por um id: os exemplos guardam ref, refs, refP etc. nos objetos (custos.js,
// casos.js) e as exceções por caminho estão aqui. Devolve o id da linha para um caminho de cfg (o mesmo de data-cfg), ou ''.
const REF_CAMINHOS = {
  'saas.precoNominal': 'saas.precoNominal', 'api.Pin': 'api.modelo_intermediario.Pin', 'api.Pout': 'api.modelo_intermediario.Pout',
  'api.PinAux': 'api.modelo_pequeno.Pin', 'api.PoutAux': 'api.modelo_pequeno.Pout', 'api.PrerankMil': 'api.rerank', 'rag.Pemb': 'rag.embeddings', 'rag.Ppag': 'rag.ocr',
  'ow.Pgpu': 'ow.gpu.hora', 'ow.Pseg': 'ow.seg.hora', 'opc.pi': 'macro.inflacao', 'opc.r': 'macro.taxaDesconto',
};
function idRefDoCaminho(cfg, caminho) {
  if (!cfg || !caminho) return '';
  const p = String(caminho).split('.');
  if (REF_CAMINHOS[caminho]) return REF_CAMINHOS[caminho];
  if (p[0] === 'salarios' && p[1]) return 'sal.' + p[1];
  if (caminho === 'saas.preco') return (cfg.saas && cfg.saas.refPreco) || 'saas.preco';
  if (caminho === 'formacaoTempo.horas') return (cfg.formacaoTempo || {}).refHoras || '';
  if (caminho === 'formacaoTempo.custoHora') return (cfg.formacaoTempo || {}).refCustoHora || '';
  if (caminho === 'saida.custoHora') return (cfg.saida || {}).refCustoHora || '';
  if (caminho === 'saida.horasRetreino') return (cfg.saida || {}).refHorasRetreino || '';
  if (caminho === 'saida.reindexFixo') return (cfg.saida || {}).refReindex || '';
  if (p[0] === 'implantacao') { const x = (cfg.implantacao || [])[+p[1]]; return x ? (p[2] === 'valor' ? x.ref : p[2] === 'manutPct' ? x.refManut : '') || '' : ''; }
  if (p[0] === 'mensais' && p[2] === 'valor') { const x = (cfg.mensais || [])[+p[1]]; return (x && x.ref) || ''; }
  if (p[0] === 'saida' && p[1] === 'itens' && p[3] === 'valor') { const x = ((cfg.saida || {}).itens || [])[+p[2]]; return (x && x.ref) || ''; }
  if (p[0] === 'itens' && p[2] === 'v') { const x = (cfg.itens || [])[+p[1]]; return (x && x.refs && x.refs[Math.min(+p[3], x.refs.length - 1)]) || ''; }
  return '';
}
// Item de K4.3 (programa de formação) é multiplicado pelo fator do formato em cfgDoCaso; o valor de referência compara-se ao valor sem o fator.
function escalaDoCaminho(cfg, caminho) {
  const p = String(caminho).split('.');
  if (p[0] === 'itens') { const x = (cfg.itens || [])[+p[1]]; const f = cfg.v11 && cfg.v11.formacao ? +cfg.v11.formacao.fatorFormato : 1; if (x && x.s === 'K4.3' && f > 0) return f; }
  return 1;
}
function linhaDoCaso(id, caso) { return _CUSTOS.refLinha(id, escoposDeCaso(caso)); }
// faixa de referência de um campo do painel de custos (BL4.3). valor = o que a pessoa vê no controle (já em %, se for o caso).
// Devolve null se o campo não tem linha na base; senão { id, linha, valor, baixo, alto, fora, semFaixa, grau, origem, fonte, ano }.
function faixaDoCampo(cfg, caminho, caso, valorBruto) {
  const id = idRefDoCaminho(cfg, caminho); if (!id) return null;
  const row = linhaDoCaso(id, caso); if (!row) return null;
  const v = valorBruto === undefined ? lerCaminho(cfg, caminho) : valorBruto;
  const esc = escalaDoCaminho(cfg, caminho);
  const vv = Number.isFinite(+v) ? +v / esc : NaN;
  return Object.assign({ id, linha: row, valor: vv, baixo: row.baixo, alto: row.alto, fora: foraDaFaixaLinha(row, vv), semFaixa: !temFaixa(row) }, infoDeLinha(row));
}
function lerCaminho(obj, caminho) { return String(caminho).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj); }

// ---------------------------------------------------------------- premissasDoCaso (relatório)
// Lista tudo o que o cálculo usou: os campos do perfil de país que têm valor e cada custo unitário ligado à base de referências.
//   { campo, rotulo, valor, unidade, origem: 'pais' | 'regiao' | 'usuario' | 'ilustrativo', fonte, ano, grau, foraDaFaixa }
// (mais url, baixo, alto e padrao, para quem quiser mostrar a faixa). valor está na unidade do campo: US$ para custos (o motor calcula em
// dólares), fração por ano para inflação e taxa de desconto. origem 'usuario' = valor diferente do da base (digitado no percurso ou no
// painel de custos). foraDaFaixa só vale quando a linha tem faixa (baixo < alto): sem faixa conhecida nada é sinalizado.
// cfg: as premissas de custo do caso (cfgAtual()); sem ele, são refeitas a partir de caso quando casoEfetivo e cfgDoCaso existem.
function premissasDoCaso(caso, cfg) {
  caso = caso || {};
  if (!cfg && typeof cfgDoCaso === 'function' && typeof casoEfetivo === 'function') {
    try { const ce = casoEfetivo(caso, typeof totaisCtx === 'function' ? totaisCtx() : {}); cfg = cfgDoCaso(ce, typeof perfilFinal === 'function' ? perfilFinal(ce) : undefined); } catch (e) { cfg = null; }
  }
  const out = [], vistos = new Set();
  const dif = (a, b) => Math.abs(a - b) > 1e-9 * Math.max(1, Math.abs(b));
  const push = (o) => { const k = o.campo; if (vistos.has(k)) return; vistos.add(k); out.push(o); };
  const opc = cfg ? _CUSTOS.opcoes(cfg) : null;
  // 1. perfil do país (e inflação e taxa de desconto, que o motor usa)
  PAIS_CAMPOS.forEach(def => {
    const e = valorEfetivoCampo(caso, def.id);
    let usado = e ? e.valor : undefined, origem = e ? e.origem : null, fonte = e ? e.fonte : '', ano = e ? e.ano : null, grau = e ? e.grau : null;
    if (opc && (def.id === 'inflacao' || def.id === 'taxaDesconto')) {
      const v = def.id === 'inflacao' ? opc.pi : opc.r;
      if (e == null || dif(v, +e.valor)) { usado = v; if (e == null || e.origem !== 'usuario') { origem = 'usuario'; fonte = 'Informado por você'; ano = null; grau = null; } }
    }
    if (usado === undefined || usado === null || usado === '') return;
    const row = e || {};
    push({ campo: def.id, rotulo: def.rotulo, valor: usado, unidade: def.unidade, origem, fonte, ano, grau, url: row.url || null,
      foraDaFaixa: def.tipo !== 'lista' && row.baixo != null && row.alto != null && +row.alto > +row.baixo && Number.isFinite(+usado) && (+usado < row.baixo - 1e-12 || +usado > row.alto + 1e-12) });
  });
  if (!cfg) return out;
  // 2. custos unitários da base de referências usados pelo cfg
  const chain = escoposDeCaso(caso);
  const usos = [];
  const uso = (id, valor, caminho) => { if (id && Number.isFinite(+valor)) usos.push({ id, valor: +valor, caminho }); };
  const pap = new Set();
  (cfg.pessoas || []).forEach(pp => (pp.partes || []).forEach(pt => { if (typeof pt[0] === 'string') pap.add(pt[0]); }));
  if (cfg.suporte && cfg.suporte.ativo && typeof cfg.suporte.sal === 'string') pap.add(cfg.suporte.sal);
  ((cfg.saida || {}).internos || []).forEach(x => { if (typeof x[0] === 'string') pap.add(x[0]); });
  PAPEIS_SAL.forEach(k => { if (pap.has(k)) uso('sal.' + k, _CUSTOS.salario(cfg, k), 'salarios.' + k); });
  if (cfg.saas && cfg.saas.ativo) uso(idRefDoCaminho(cfg, 'saas.preco'), cfg.saas.preco, 'saas.preco');
  if (cfg.api && cfg.api.ativo) {
    uso('api.modelo_intermediario.Pin', cfg.api.Pin, 'api.Pin'); uso('api.modelo_intermediario.Pout', cfg.api.Pout, 'api.Pout');
    if (cfg.api.auxAtivo) { uso('api.modelo_pequeno.Pin', cfg.api.PinAux, 'api.PinAux'); uso('api.modelo_pequeno.Pout', cfg.api.PoutAux, 'api.PoutAux'); }
    if (+cfg.api.PrerankMil > 0) uso('api.rerank', cfg.api.PrerankMil, 'api.PrerankMil');
  }
  if (cfg.rag && cfg.rag.ativo) { uso('rag.embeddings', cfg.rag.Pemb, 'rag.Pemb'); if (+cfg.rag.paginas > 0) uso('rag.ocr', cfg.rag.Ppag, 'rag.Ppag'); }
  if (cfg.ow && cfg.ow.ativo) { uso('ow.gpu.hora', cfg.ow.Pgpu, 'ow.Pgpu'); if (+cfg.ow.nSeg > 0) uso('ow.seg.hora', cfg.ow.Pseg, 'ow.Pseg'); }
  (cfg.mensais || []).forEach((x, i) => uso(x.ref, x.valor, 'mensais.' + i + '.valor'));
  (cfg.implantacao || []).forEach((x, i) => { uso(x.ref, x.valor, 'implantacao.' + i + '.valor'); if (+x.manutPct > 0) uso(x.refManut, x.manutPct, 'implantacao.' + i + '.manutPct'); });
  const fForm = cfg.v11 && cfg.v11.formacao && +cfg.v11.formacao.fatorFormato > 0 ? +cfg.v11.formacao.fatorFormato : 1;
  (cfg.itens || []).forEach((x, i) => {
    if (x.refs) x.refs.forEach((id, t) => { if (id) uso(id, (Array.isArray(x.v) ? x.v[Math.min(t, x.v.length - 1)] : x.v) / (x.s === 'K4.3' ? fForm : 1), 'itens.' + i + '.v.' + t); });
    if (x.refP && x.p) { const p0 = (Array.isArray(x.p) ? x.p : [x.p]).find(z => +z > 0); if (p0 != null) uso(x.refP, +p0 / (+x.refEscala > 0 ? +x.refEscala : 1), 'itens.' + i + '.p'); }
  });
  const ft = cfg.formacaoTempo;
  if (ft && ft.ativo) { uso(ft.refHoras, ft.horas, 'formacaoTempo.horas'); uso(ft.refCustoHora, ft.custoHora, 'formacaoTempo.custoHora'); }
  const sa = cfg.saida || {};
  if (+sa.horasRetreino > 0) { uso(sa.refHorasRetreino, sa.horasRetreino, 'saida.horasRetreino'); uso(sa.refCustoHora, sa.custoHora, 'saida.custoHora'); }
  if (cfg.rag && cfg.rag.ativo && sa.reindexar) uso(sa.refReindex, sa.reindexFixo, 'saida.reindexFixo');
  (sa.itens || []).forEach((x, i) => uso(x.ref, x.valor, 'saida.itens.' + i + '.valor'));
  if (cfg.v11 && cfg.v11.salarioProfessor) uso('conv.horasAno', _CUSTOS.refLinha('conv.horasAno', chain).valor, 'conv.horasAno');
  // um id pode aparecer em vários caminhos (a formação anual em três anos): vale o primeiro valor que difere do da base, senão o primeiro
  const porId = new Map();
  usos.forEach(u => {
    const row = _CUSTOS.refLinha(u.id, chain); if (!row) return;
    const cur = porId.get(u.id);
    if (!cur) porId.set(u.id, Object.assign({ row }, u));
    else if (!dif(cur.valor, row.valor) && dif(u.valor, row.valor)) porId.set(u.id, Object.assign({ row }, u));
  });
  porId.forEach(u => {
    const row = u.row, info = infoDeLinha(row);
    let origem = info.origem, fonte = info.fonte, ano = info.ano, grau = info.grau;
    if (dif(u.valor, row.valor)) {
      // custo da hora derivado do salário do professor do país: a origem é a do salário
      const ps = cfg.v11 && cfg.v11.salarioProfessor;
      const sal = ps && /^formacao\.custoHora\./.test(u.id) && !dif(u.valor, ps.custoHora) ? valorEfetivoCampo(caso, 'salarioProfessor') : null;
      if (sal) { origem = sal.origem; fonte = sal.fonte; ano = sal.ano; grau = sal.grau; }
      else { origem = 'usuario'; fonte = 'Informado por você'; ano = null; grau = null; }
    }
    push({ campo: u.id, rotulo: row.item, valor: u.valor, unidade: row.unidade, origem, fonte, ano, grau, url: info.url, baixo: row.baixo, alto: row.alto, padrao: row.valor,
      foraDaFaixa: foraDaFaixaLinha(row, u.valor) });
  });
  return out;
}

// ---------------------------------------------------------------- versão da base
function versaoReferencias() {
  const R = _CUSTOS.REF_DADOS || {};
  return { referencias: R.versao || '', atualizado: R.atualizado || '', linhas: (R.referencias || []).length,
    paises: PAISES_DADOS.versao || '', paisesAtualizado: PAISES_DADOS.atualizado || '', nPaises: listaPaises().length,
    texto: 'referências v' + (R.versao || '?') + ' (' + (R.atualizado || '?') + '), países v' + (PAISES_DADOS.versao || '?') + ' (' + (PAISES_DADOS.atualizado || '?') + ')' };
}

if (typeof module !== 'undefined') module.exports = { PAIS_CAMPOS, PAIS_CAMPO_POR_ID, ORIGEM_ROTULO, GRAU_NOME, OUTRO_PAIS, listaPaises, paisPorIso, paisDoCaso, nomeRegiao, escoposDeCaso, origemDaLinha, valorEfetivoCampo,
  escolherPais, lerValorCampo, editarCampoPais, restaurarCampoPais, valorParaTexto, dicaOrigem, idRefDoCaminho, faixaDoCampo, foraDaFaixaLinha, temFaixa, premissasDoCaso, versaoReferencias };
