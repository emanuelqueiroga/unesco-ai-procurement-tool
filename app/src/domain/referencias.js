// =====================================================================
// Base de referências: contrato com o relatório e com a interface (0.0.15-rc.1, BL4.1 e BL4.4; pacote REF).
//   premissasDoCaso(estado[, cfg]) → [{ id, grupo, rotulo, valor, unidade, origem: 'pais'|'regiao'|'usuario'|'ilustrativo',
//                                       fonte, ano, grau: 'A'|'B'|'C'|null, baixo, alto, fora }]  (mais url, padrao e caminho)
//   versaoReferencias()               → { referencias, paises, data, atualizado, paisesAtualizado, linhas, nPaises, texto }
//   refFaixa(id[, escopos])           → { baixo, alto } | null
//   refValor(id[, escopos])           → número (erro quando o id não existe na base)
// Puro: recebe o estado do caso ({ caso, ctx, custo, … }) e não o altera.
// =====================================================================
import { REF_DADOS, PAISES_DADOS, refLinha, refValor, refFaixaMult, temFaixa, foraDaFaixaLinha, origemDaLinha } from './referencias_base.js';
import { clone, opcoes, salario, PAPEIS_SAL } from './custos.js';
import { cfgAtual } from './fluxo.js';
import { PAIS_CAMPOS, ID_HORAS_ANO, valorEfetivoCampo, escoposDeCaso, infoDeLinha } from './pais.js';

/** faixa de referência de uma linha da base, pela cadeia de escopos; null quando o id não existe */
function refFaixa(id, esc) {
  const r = refLinha(id, esc);
  return r ? { baixo: r.baixo, alto: r.alto } : null;
}

/** versão das duas bases (data/referencias.json e data/paises.json), para o rodapé e o anexo do relatório */
function versaoReferencias() {
  const R = REF_DADOS || {}, P = PAISES_DADOS || {};
  const datas = [R.atualizado, P.atualizado].filter(Boolean).sort();
  return {
    referencias: R.versao || '', paises: P.versao || '', data: datas.length ? datas[datas.length - 1] : '',
    atualizado: R.atualizado || '', paisesAtualizado: P.atualizado || '',
    linhas: (R.referencias || []).length, nPaises: (P.paises || []).length,
    texto: 'referências v' + (R.versao || '?') + ' (' + (R.atualizado || '?') + '), países v' + (P.versao || '?') + ' (' + (P.atualizado || '?') + ')',
  };
}

// Grupos das premissas, na ordem em que o relatório as lista (os nomes passam por tr() em quem exibe)
const GRUPOS_PREMISSA = [
  ['pais', 'Perfil do país e macroeconomia'],
  ['pessoal', 'Equipe (custo anual carregado)'],
  ['tecnologia', 'Tecnologia e uso'],
  ['condicoes', 'Condições de base'],
  ['implantacao', 'Implantação e adaptação'],
  ['formacao', 'Formação e suporte'],
  ['governanca', 'Governança e avaliação'],
  ['saida', 'Transição e saída'],
  ['convencao', 'Convenções'],
];
const NOME_GRUPO = Object.fromEntries(GRUPOS_PREMISSA);
/** grupo de uma premissa pelo id da linha da base (ou do campo do perfil do país) */
function grupoDoId(id) {
  const s = String(id || '');
  if (PAIS_CAMPOS.some(c => c.id === s) || /^macro\./.test(s)) return 'pais';
  if (/^sal\./.test(s)) return 'pessoal';
  if (/^k1\./.test(s)) return 'condicoes';
  if (/^gov\./.test(s)) return 'governanca';
  if (/^conv\./.test(s)) return 'convencao';
  if (/(^|\.)saida(\.|$)/.test(s)) return 'saida';
  if (/^formacao\.|\.formacao\.|^v11\.fornecedor\./.test(s)) return 'formacao';
  if (/\.implantacao$|\.manutPct$|^saas\.juridico$|^ow\.curricular$|^ow\.protecao$/.test(s)) return 'implantacao';
  return 'tecnologia';
}

const dif = (a, b) => Math.abs(a - b) > 1e-9 * Math.max(1, Math.abs(b));
const foraDe = (baixo, alto, v) => baixo != null && alto != null && +alto > +baixo && v !== '' && v != null && Number.isFinite(+v) && (+v < baixo - 1e-12 || +v > alto + 1e-12);

/** a cfg em uso no estado (a da calculadora, se editada), numa cópia: cfgAtual guarda a cfg em estado.custo */
function cfgDoEstado(estado) {
  const e = Object.assign({}, estado || {});
  if (e.custo) e.custo = Object.assign({}, e.custo, { cfg: e.custo.cfg ? clone(e.custo.cfg) : null });
  return cfgAtual(e);
}

/**
 * Tudo o que o cálculo usou: os campos do perfil do país que têm valor (e a inflação e a taxa de desconto, que o motor
 * usa sempre) e cada custo unitário ligado à base de referências. valor está na unidade da base: US$ para custos (o
 * motor calcula em dólares), fração por ano para inflação e taxa de desconto. origem 'usuario' = valor diferente do da
 * base (digitado no perfil do país ou na calculadora), derivado por diferença e não por marca. fora só vale quando a
 * linha tem faixa (baixo < alto): sem faixa conhecida nada é sinalizado. cfg é opcional (padrão: a cfg do estado).
 */
function premissasDoCaso(estado, cfgIn) {
  const st = estado || {};
  const caso = st.caso || {};
  let cfg = cfgIn || null;
  if (!cfg) { try { cfg = cfgDoEstado(st); } catch (e) { cfg = null; } }
  const out = [], vistos = new Set();
  const push = (o) => { if (vistos.has(o.id)) return; vistos.add(o.id); out.push(o); };
  const opc = cfg ? opcoes(cfg) : null;
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
    const baixo = row.baixo == null ? null : row.baixo, alto = row.alto == null ? null : row.alto;
    push({ id: def.id, grupo: 'pais', rotulo: def.rotulo, valor: usado, unidade: def.unidade, origem, fonte, ano, grau, baixo, alto,
      fora: def.tipo !== 'lista' && foraDe(baixo, alto, usado), url: row.url || null, padrao: e && e.origem === 'usuario' ? e.padrao : (e ? e.valor : null), caminho: '' });
  });
  if (!cfg) return out;
  // 2. custos unitários da base usados pela cfg
  const chain = Array.isArray(cfg.escopos) ? cfg.escopos : (cfg.__base && cfg.__base !== 'caso' ? null : escoposDeCaso(caso));
  const usos = [];
  const uso = (id, valor, caminho) => { if (id && valor !== '' && valor != null && Number.isFinite(+valor)) usos.push({ id, valor: +valor, caminho }); };
  const pap = new Set();
  (cfg.pessoas || []).forEach(pp => (pp.partes || []).forEach(pt => { if (typeof pt[0] === 'string') pap.add(pt[0]); }));
  if (cfg.suporte && cfg.suporte.ativo && typeof cfg.suporte.sal === 'string') pap.add(cfg.suporte.sal);
  ((cfg.saida || {}).internos || []).forEach(x => { if (typeof x[0] === 'string') pap.add(x[0]); });
  PAPEIS_SAL.forEach(k => { if (pap.has(k)) uso('sal.' + k, salario(cfg, k), 'salarios.' + k); });
  if (cfg.saas && cfg.saas.ativo) uso((cfg.saas.refPreco) || 'saas.preco', cfg.saas.preco, 'saas.preco');
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
  if (cfg.v11 && cfg.v11.salarioProfessor) { const h = refLinha(ID_HORAS_ANO, chain); if (h) uso(ID_HORAS_ANO, h.valor, ''); }
  // um id pode aparecer em vários caminhos (a formação anual em três anos): vale o primeiro valor que difere do da base, senão o primeiro
  const porId = new Map();
  usos.forEach(u => {
    const row = refLinha(u.id, chain); if (!row) return;
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
    push({ id: u.id, grupo: grupoDoId(u.id), rotulo: row.item, valor: u.valor, unidade: row.unidade, origem, fonte, ano, grau, baixo: row.baixo, alto: row.alto,
      fora: foraDaFaixaLinha(row, u.valor), url: info.url, padrao: row.valor, caminho: u.caminho });
  });
  const ordem = GRUPOS_PREMISSA.map(g => g[0]);
  return out.map((x, i) => [x, i]).sort((a, b) => ordem.indexOf(a[0].grupo) - ordem.indexOf(b[0].grupo) || a[1] - b[1]).map(x => x[0]);
}

/**
 * Contagem das premissas para o "de onde vem?" e o anexo: total, quantas ainda são convenção da ferramenta (grau C,
 * valor da base), quantas vêm de dado do país ou da região, quantas a pessoa alterou e quantas estão fora da faixa.
 */
function resumoPremissas(lista) {
  const L = Array.isArray(lista) ? lista : [];
  return {
    total: L.length,
    convencao: L.filter(x => x.grau === 'C' && x.origem === 'ilustrativo').length,
    pais: L.filter(x => x.origem === 'pais').length,
    regiao: L.filter(x => x.origem === 'regiao').length,
    usuario: L.filter(x => x.origem === 'usuario').length,
    fora: L.filter(x => x.fora).length,
  };
}

export { premissasDoCaso, resumoPremissas, versaoReferencias, refFaixa, refValor, refLinha, refFaixaMult, temFaixa, foraDaFaixaLinha, origemDaLinha,
  REF_DADOS, PAISES_DADOS, GRUPOS_PREMISSA, NOME_GRUPO, grupoDoId };
