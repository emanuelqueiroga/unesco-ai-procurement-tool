// =====================================================================
// Aba de custos — versão 2 (árvore de custos, duas contas, índices)
// =====================================================================

// ----------------------------------------------------------- moedas
// MOEDAS é injetado no build a partir de moedas.json (taxas de referência por US$)
let NOMES_MOEDA = null;
function nomeMoeda(cod) {
  try { if (!NOMES_MOEDA) NOMES_MOEDA = new Intl.DisplayNames([LOC()], { type: 'currency' }); return NOMES_MOEDA.of(cod) || cod; } catch (e) { return cod; }
}
function moedaInfo() {
  const cod = (S.moeda && S.moeda.cod) || 'USD';
  const ov = (S.moeda && S.moeda.taxaDe === cod) ? +lerNumero(S.moeda.taxa) : NaN;
  const f = ov > 0 ? ov : (MOEDAS.taxas[cod] || 1);
  let pre = cod;
  try { pre = new Intl.NumberFormat(LOC(), { style: 'currency', currency: cod, currencyDisplay: 'narrowSymbol' }).formatToParts(0).find(p => p.type === 'currency').value; } catch (e) { }
  if (cod === 'USD') pre = 'US$';
  return { cod, pre, f, ov: ov > 0 };
}
function din(x, dec) {
  const m = moedaInfo(); const v = x * m.f;
  if (dec == null) dec = Math.abs(v) >= 100 ? 0 : 2;
  if (Math.abs(v) > 0 && Math.abs(v) < 0.1 && dec < 3) dec = 3;
  return m.pre + ' ' + v.toLocaleString(LOC(), { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function mil(x, dec = 1) { const m = moedaInfo(); return (x * m.f / 1000).toLocaleString(LOC(), { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
// valor abreviado com a magnitude do idioma (MAGNITUDES, i18n.js): PT "US$ 162 mil", EN "US$ 162 k", ES "US$ 162 mil", FR "US$ 162 k"
function grande(x) {
  const m = moedaInfo(); const v = x * m.f;
  const [k, M, B] = typeof magnitudes === 'function' ? magnitudes() : ['mil', 'mi', 'bi'];
  const f = (d, n, u) => m.pre + ' ' + (v / d).toLocaleString(LOC(), { maximumFractionDigits: n }) + ' ' + u;
  if (Math.abs(v) >= 1e9) return f(1e9, 2, B);
  if (Math.abs(v) >= 1e6) return f(1e6, 2, M);
  return f(1e3, 1, k);
}
const pct = (x, d = 0) => (100 * (x || 0)).toLocaleString(LOC(), { maximumFractionDigits: d, minimumFractionDigits: d }) + '%';
// unidade das tabelas em milhares: PT "USD mil", EN "USD thousand", ES "miles de USD", FR "milliers de USD"
function unidMil() { const cod = moedaInfo().cod; return typeof unidMilDe === 'function' ? unidMilDe(cod) : cod + ' mil'; }

// ----------------------------------------------------------- estado
function estadoCusto() {
  S.custo = Object.assign({ base: 'caso', cfg: null, editado: false, conta: 'eco', avancado: false, abertos: {}, alts: [], lambda: '',
    estratos: [{ nome: 'Escolas urbanas com infraestrutura', part: 0.6, fK1: 1, fK4: 1 }, { nome: 'Escolas rurais', part: 0.3, fK1: 1.5, fK4: 1.4 }, { nome: 'Escolas de difícil acesso', part: 0.1, fK1: 2.5, fK4: 1.8 }] }, S.custo || {});
  return S.custo;
}
let SIM = null;      // resultado do Monte Carlo (não persiste)
function garantirOpc(cfg) { cfg.opc = Object.assign({}, OPC_PADRAO, cfg.opc || {}); return cfg.opc; }

// ----------------------------------------------------------- campos
// campos numéricos da calculadora: formatados no idioma (inputNum, i18n.js), sem o ✓ dentro do valor
const CASAS_CALC = 6;
function inp(path, val, opts = {}) {
  const v = opts.pct ? +(+val * 100).toFixed(4) : val;
  return inputNum({ valor: v === '' || v == null || isNaN(+v) ? '' : +v, casas: CASAS_CALC, cls: opts.cls, rotulo: opts.label || path, ok: false,
    attrs: `data-cfg="${esc(path)}"${opts.pct ? ' data-pct="1"' : ''}` });
}
function campo(label, path, val, opts = {}) {
  if (opts.pct) label += ' (%)';
  return `<div class="q"><label>${esc(label)}</label>${inp(path, val, Object.assign({ label }, opts))}${opts.hint ? `<div class="hint">${esc(opts.hint)}</div>` : ''}</div>`;
}
function anosC(label, path, arr, H, opts = {}) {
  if (opts.pct) label += ' (%)';
  const vals = Array.from({ length: H + 1 }, (_, t) => ano(arr, t));
  return `<div class="q" style="grid-column:1/-1"><label>${esc(label)}</label><div class="yr" style="grid-template-columns:repeat(${Math.min(H + 1, 6)},minmax(0,1fr))">${vals.map((v, t) => `<div><div class="small muted">Ano ${t}</div>${inp(path + '.' + t, v, Object.assign({ label: label + ' ano ' + t }, opts))}</div>`).join('')}</div>${opts.hint ? `<div class="hint">${esc(opts.hint)}</div>` : ''}</div>`;
}
function selS(path, val) {
  return `<select data-cfgs="${path}" aria-label="Subcomponente">${ARVORE.map(([k, n, ss]) => `<optgroup label="${k} ${esc(n)}">${ss.map(([s, ns]) => `<option value="${s}" ${s === val ? 'selected' : ''}>${s} ${esc(ns)}</option>`).join('')}</optgroup>`).join('')}</select>`;
}

// ----------------------------------------------------------- render principal
function renderCustos() {
  const sc = estadoCusto();
  const cfg = cfgAtual(); const o = garantirOpc(cfg); const H = o.H;
  const arq = arquitetura(cfg); const d = cfg.demanda;
  const mi = moedaInfo();
  const compat = !o.correcoes;
  const sp = t => '<span>' + esc(t) + '</span>';
  const ce = sc.base === 'caso' ? casoAtual() : null;
  const origem = sc.base === 'caso' ? [sp(tr('Premissas montadas a partir do seu caso:')), sp(tr('arquitetura') + ' ' + tr(({ saas: 'SaaS', api: 'API + RAG', ow: 'pesos abertos' })[arq] || arq) + ','),
      sp(tr(fmtInt(ce.elegiveis) + ' elegíveis') + ','), sp(tr('governança para perfil') + ' ' + tr(NIVEL_NOME[perfilFinal(ce).agregado]).toLowerCase() + '.'),
      sp(tr('Os demais valores vêm do Exemplo ' + cfg.origem + ' do guia e precisam ser substituídos por cotações e dados locais.')),
      ce.__arqPresumida ? sp(tr('Como a arquitetura não foi definida, o modelo usa SaaS como ponto de partida.')) : ''].join(' ') :
    sp(tr('Exemplo do Capítulo 12 do guia.')) + (compat ? ' ' + sp(tr('Modo de compatibilidade: reproduz os números da versão 1 do guia.')) : '');
  const codigos = Object.keys(MOEDAS.taxas).sort((a, b) => nomeMoeda(a).localeCompare(nomeMoeda(b), LOC()));
  const optsMoeda = ['USD', 'EUR', 'BRL', 'GBP', 'JPY', 'CNY', 'INR', 'MXN', 'ARS', 'ZAR'].map(c => `<option value="${c}" ${mi.cod === c ? 'selected' : ''}>${c} · ${esc(nomeMoeda(c))}</option>`).join('') +
    `<option disabled>──────────</option>` + codigos.map(c => `<option value="${c}" ${mi.cod === c ? 'selected' : ''}>${c} · ${esc(nomeMoeda(c))}</option>`).join('');

  const salarios = Object.keys(SAL).map(k => `<tr><td>${esc(SAL_NOME[k])}</td><td class="n">${inp('salarios.' + k, salario(cfg, k), { cls: 'w-m', label: SAL_NOME[k] })}</td></tr>`).join('');
  const optsSal = k => Object.keys(SAL).map(s => `<option value="${s}" ${s === k ? 'selected' : ''}>${esc(SAL_NOME[s])}</option>`).join('');
  const yrHead = Array.from({ length: H + 1 }, (_, t) => `<th class="n">Ano ${t}</th>`).join('');
  const pessoas = (cfg.pessoas || []).map((pp, i) => pp.partes.map((pt, j) => `<tr>
      <td>${j === 0 ? `<input type="text" class="w-l" data-cfgs="pessoas.${i}.nome" value="${esc(pp.nome)}" aria-label="Atividade">` : '<span class="small muted">+ outra função</span>'}</td>
      <td>${j === 0 ? selS(`pessoas.${i}.s`, pp.s || MAPA_CAT[pp.cat] || 'K4.1') : ''}</td>
      <td>${j === 0 ? `<select data-cfgs="pessoas.${i}.nat" aria-label="Natureza"><option value="C" ${pp.nat !== 'D' ? 'selected' : ''}>Capacidade interna</option><option value="D" ${pp.nat === 'D' ? 'selected' : ''}>Desembolso novo</option></select>` : ''}</td>
      <td><select data-cfgs="pessoas.${i}.partes.${j}.0" aria-label="Função">${optsSal(pt[0])}</select></td>
      ${Array.from({ length: H + 1 }, (_, t) => `<td class="n">${inp(`pessoas.${i}.partes.${j}.1.${t}`, ano(pt[1], t), { cls: 'w-s', step: '0.05', label: 'FTE ano ' + t })}</td>`).join('')}
      <td>${j === 0 ? `<button class="btn" type="button" data-act="rm" data-arr="pessoas" data-i="${i}" aria-label="Remover">×</button>` : ''}</td></tr>`).join('')).join('');
  const itens = (cfg.itens || []).map((x, i) => `<tr><td><input type="text" class="w-l" data-cfgs="itens.${i}.nome" value="${esc(x.nome)}" aria-label="Item">${x.aEstimar ? ' <span class="tag gold">a estimar</span>' : ''}</td>
      <td>${selS(`itens.${i}.s`, x.s || MAPA_CAT[x.cat] || 'K4.1')}</td>
      <td><select data-cfgs="itens.${i}.moeda" aria-label="Moeda"><option value="LOC" ${x.moeda !== 'USD' ? 'selected' : ''}>Local</option><option value="USD" ${x.moeda === 'USD' ? 'selected' : ''}>US$</option></select></td>
      ${Array.from({ length: H + 1 }, (_, t) => `<td class="n">${inp(`itens.${i}.v.${t}`, ano(x.v, t), { cls: 'w-m', step: '1000', label: 'Ano ' + t })}</td>`).join('')}
      <td><button class="btn" type="button" data-act="rm" data-arr="itens" data-i="${i}" aria-label="Remover">×</button></td></tr>`).join('');
  const impl = (cfg.implantacao || []).map((x, i) => `<tr><td><input type="text" class="w-l" data-cfgs="implantacao.${i}.nome" value="${esc(x.nome)}" aria-label="Implantação"></td>
      <td class="n">${inp(`implantacao.${i}.valor`, x.valor, { cls: 'w-m', step: '1000', label: 'Valor' })}</td><td class="n">${inp(`implantacao.${i}.manutPct`, x.manutPct, { cls: 'w-s', pct: true, label: 'Manutenção %' })}</td></tr>`).join('');
  const mensais = (cfg.mensais || []).map((x, i) => `<tr><td><input type="text" class="w-l" data-cfgs="mensais.${i}.nome" value="${esc(x.nome)}" aria-label="Item mensal"></td><td>${selS(`mensais.${i}.s`, x.s || MAPA_CAT[x.cat] || 'K2.5')}</td>
      <td class="n">${inp(`mensais.${i}.valor`, x.valor, { cls: 'w-m', label: 'Valor mensal' })}</td><td class="n">${inp(`mensais.${i}.mesesY0`, x.mesesY0, { cls: 'w-s', label: 'Meses no ano 0' })}</td>
      <td><button class="btn" type="button" data-act="rm" data-arr="mensais" data-i="${i}" aria-label="Remover">×</button></td></tr>`).join('');
  const saidaItens = ((cfg.saida || {}).itens || []).map((x, i) => `<tr><td><input type="text" class="w-l" data-cfgs="saida.itens.${i}.nome" value="${esc(x.nome)}" aria-label="Item de saída"></td><td class="n">${inp(`saida.itens.${i}.valor`, x.valor, { cls: 'w-m', step: '1000', label: 'Valor' })}</td>
      <td><button class="btn" type="button" data-act="rm" data-arr="saida.itens" data-i="${i}" aria-label="Remover">×</button></td></tr>`).join('');

  let arqBloco = '';
  if (arq === 'saas') arqBloco = `<div class="prem">
      ${campo('Preço por licença por mês (US$)', 'saas.preco', cfg.saas.preco)}
      ${campo('Reajuste contratual anual', 'saas.reajuste', cfg.saas.reajuste, { pct: true, hint: 'Nominal, a partir do Ano 2' })}
      ${anosC('Licenças contratadas', 'saas.qtd', cfg.saas.qtd, H, { step: '1' })}
      ${anosC('Meses cobrados', 'saas.mesesCobr', cfg.saas.mesesCobr, H, { step: '1' })}
      ${anosC('Fração do preço cobrada', 'saas.fatorPreco', cfg.saas.fatorPreco, H, { step: '0.1', hint: '0 = cedido sem custo (o valor de mercado entra na conta econômica como insumo doado)' })}
      ${campo('Preço da licença nominal (US$/mês)', 'saas.precoNominal', cfg.saas.precoNominal)}
      ${campo('Licenças nominais por usuário ativo', 'saas.fatorNominal', cfg.saas.fatorNominal, { step: '0.05' })}</div>`;
  if (arq === 'api') arqBloco = `<div class="prem">
      ${campo('Chamadas ao modelo por interação (k)', 'api.k', cfg.api.k, { step: '0.1' })}
      ${campo('Tokens de entrada por chamada', 'api.Tin', cfg.api.Tin, { step: '100' })}
      ${campo('Tokens de saída por chamada', 'api.Tout', cfg.api.Tout, { step: '50' })}
      ${campo('Fração da entrada em cache', 'api.h', cfg.api.h, { pct: true })}
      ${campo('Preço de entrada (US$/milhão)', 'api.Pin', cfg.api.Pin, { step: '0.05' })}
      ${campo('Preço de saída (US$/milhão)', 'api.Pout', cfg.api.Pout, { step: '0.05' })}
      ${campo('Chamada auxiliar: tokens de entrada', 'api.TinAux', cfg.api.TinAux, { step: '50' })}
      ${campo('Chamada auxiliar: preço de entrada', 'api.PinAux', cfg.api.PinAux, { step: '0.05' })}
      ${campo('Reranking (US$ por mil consultas)', 'api.PrerankMil', cfg.api.PrerankMil, { step: '0.1' })}
      ${campo('Documentos na base', 'rag.docs', cfg.rag.docs, { step: '1000' })}
      ${campo('Tokens por documento', 'rag.tokDoc', cfg.rag.tokDoc, { step: '100' })}
      ${campo('Documentos novos por ano', 'rag.docsNovos', cfg.rag.docsNovos, { step: '100' })}
      ${campo('Reindexações completas por ano', 'rag.reindexAno', cfg.rag.reindexAno, { step: '1' })}
      ${campo('Preço de embeddings (US$/milhão)', 'rag.Pemb', cfg.rag.Pemb, { step: '0.01' })}
      ${campo('Páginas para OCR na implantação', 'rag.paginas', cfg.rag.paginas, { step: '1000' })}</div>`;
  if (arq === 'ow') arqBloco = `<div class="prem">
      ${campo('Tokens de entrada por interação', 'ow.Tin', cfg.ow.Tin, { step: '100' })}
      ${campo('Tokens de saída por interação', 'ow.Tout', cfg.ow.Tout, { step: '25' })}
      ${campo('Fração do uso no pico', 'ow.fPico', cfg.ow.fPico, { pct: true })}
      ${campo('Horas de pico por mês ativo', 'ow.hPicoMes', +cfg.ow.hPicoMes.toFixed(2), { step: '1' })}
      ${campo('Fator de rajada no pico (φ)', 'ow.phi', cfg.ow.phi, { step: '0.1' })}
      ${campo('Vazão por GPU (tokens/s)', 'ow.theta', cfg.ow.theta, { step: '25' })}
      ${campo('Utilização-alvo da GPU', 'ow.u', cfg.ow.u, { pct: true })}
      ${campo('GPUs de redundância', 'ow.red', cfg.ow.red, { step: '1' })}
      ${campo('GPUs mínimas fora do pico', 'ow.minFora', cfg.ow.minFora, { step: '1' })}
      ${campo('Preço da hora de GPU (US$)', 'ow.Pgpu', cfg.ow.Pgpu, { step: '0.01' })}
      ${campo('Instâncias do classificador de segurança', 'ow.nSeg', cfg.ow.nSeg, { step: '1' })}
      ${campo('Preço da hora da instância de segurança', 'ow.Pseg', cfg.ow.Pseg, { step: '0.01' })}</div>`;
  const fmt = cfg.formacaoTempo || {}; const sa = cfg.saida || {};

  return `
  <div class="sec-head"><div><div class="eyebrow">Passo 5 · Caps. 11 e 12 · Instrumento G</div><h2>Custo total e orçamento</h2>
    <p>O custo é montado como uma árvore: insumos (quantidade × preço) somam subcomponentes, que somam seis componentes, que somam o custo total do ciclo de vida. A mesma árvore gera duas contas: a econômica, que mostra quanto a decisão consome de recursos, e a orçamentária, que mostra quanto pedir em cada exercício.</p></div></div>
  <section class="card" style="display:grid;gap:12px">
    <div class="row">
      <span style="font-weight:600">Base de premissas</span>
      <div class="subtabs" role="group" aria-label="Base de premissas">
        ${[['caso', 'Seu caso'], ['A', 'Exemplo A · SaaS'], ['B', 'Exemplo B · API + RAG'], ['C', 'Exemplo C · pesos abertos']].map(([k, n]) => `<button type="button" data-cbase="${k}" aria-pressed="${sc.base === k}">${n}</button>`).join('')}
      </div>
      ${sc.base === 'caso' && sc.editado ? '<button class="btn" type="button" data-act="recalc">Refazer a partir das respostas</button>' : ''}
    </div>
    <p class="small muted">${origem}</p>
    <div class="row small" style="align-items:flex-end">
      <div class="q" style="min-width:min(100%,300px)"><label for="moeda">Moeda de exibição</label><select class="f" id="moeda" data-moeda="cod">${optsMoeda}</select></div>
      ${mi.cod !== 'USD' ? `<div class="q"><label for="taxa">${esc(mi.cod)} por US$ 1</label>${inputNum({ id: 'taxa', valor: lerNumero(S.moeda.taxa), casas: CASAS_CALC, ok: false, style: 'width:140px', ph: fmtEntrada(MOEDAS.taxas[mi.cod] || '', 4) || ' ', attrs: `data-moeda="taxa" data-mcod="${esc(mi.cod)}"` })}</div>` : ''}
      <div class="q"><span class="lbl">Conta exibida na árvore</span><div class="subtabs">${[['eco', 'Econômica'], ['fin', 'Orçamentária']].map(([k, n]) => `<button type="button" data-cconta="${k}" aria-pressed="${sc.conta === k}">${n}</button>`).join('')}</div></div>
      <label class="check" style="margin-left:auto"><input type="checkbox" data-cavanc ${sc.avancado ? 'checked' : ''}><span>Modo avançado</span></label>
    </div>
    <p class="small muted">O modelo calcula em dólares (US$) e converte para a moeda escolhida pela taxa de referência de ${new Date(MOEDAS.data + 'T12:00:00').toLocaleDateString(LOC())} (${esc(MOEDAS.fonte)}), que você pode substituir. A conversão é de exibição. O risco de variação cambial sobre os itens cotados em dólar está nas premissas (trajetória do câmbio) e nos cenários.</p>
    <div class="row"><button class="btn" type="button" data-act="ir-prem">Editar premissas</button><button class="btn" type="button" data-act="ir-linhas">Editar insumos</button>
      <label class="check small"><input type="checkbox" data-ccompat ${compat ? 'checked' : ''}><span>Reproduzir os números da versão 1 do guia</span></label></div>
  </section>

  <div id="cres" style="display:grid;gap:18px;grid-template-columns:minmax(0,1fr)"></div>

  <details class="box" ${sc.abrirPrem ? 'open' : ''} data-det="prem"><summary>Premissas de demanda, arquitetura e tempo</summary><div class="in">
    <div class="prem">
      ${anosC('Pessoas elegíveis', 'demanda.E', d.E, H, { step: '1', hint: 'Ano 0 = população do piloto. Além do último ano informado, o valor se repete.' })}
      ${anosC('Taxa de adoção (usuários ativos ÷ elegíveis)', 'demanda.adocao', d.adocao, H, { pct: true })}
      ${anosC('Meses de uso no ano', 'demanda.meses', d.meses, H, { step: '1' })}
      ${arq !== 'saas' ? campo('Sessões por usuário ativo por mês (s)', 'demanda.s', d.s, { step: '1' }) + campo('Interações por sessão (i)', 'demanda.i', d.i, { step: '1' }) : ''}
    </div>
    <h3>${({ saas: 'Licenciamento SaaS', api: 'Consumo de modelo e base de conhecimento (RAG)', ow: 'Dimensionamento de GPU para pesos abertos' })[arq] || 'Tecnologia'}</h3>
    ${arqBloco}
    <h3>Tempo, preços e câmbio</h3>
    <div class="prem">
      ${campo('Horizonte de operação (anos)', 'opc.H', o.H, { step: '1', hint: 'Anos de operação depois do Ano 0. Muda o número de colunas.' })}
      ${campo('Inflação na moeda do orçamento', 'opc.pi', o.pi, { pct: true, hint: 'Corrige itens locais nos preços correntes e deflaciona a conta econômica. Premissa ilustrativa: use a meta ou projeção oficial.' })}
      ${campo('Variação anual do câmbio sobre itens em US$', 'opc.dep', o.dep, { pct: true, hint: 'Relevante quando o orçamento é em moeda local. 0 = câmbio estável.' })}
      ${campo('Multiplicador cambial (choque)', 'mult.fx', (cfg.mult || {}).fx || 1, { step: '0.05', hint: '1,25 = depreciação de 25% sobre todos os itens em US$' })}
      ${campo('Multiplicador do custo de pessoal', 'mult.pessoas', (cfg.mult || {}).pessoas || 1, { step: '0.05' })}
      ${arq !== 'saas' ? campo('Multiplicador de preço de modelo ou GPU', 'mult.preco', (cfg.mult || {}).preco || 1, { step: '0.05' }) : ''}
      ${campo('Reserva de contingência', 'opc.contPct', o.contPct, { pct: true })}
    </div>
    ${cfg.adaptacao ? `<h3>Adaptação ao contexto</h3>
    <div class="prem">
      ${campo('Adaptação: multiplicador de K3.1', 'adaptacao.fK31', cfg.adaptacao.fK31 == null ? 1 : cfg.adaptacao.fK31, { hint: 'Integração e desenvolvimento. 1 = nível de referência do exemplo do guia. Convenção ilustrativa da ferramenta.' })}
      ${campo('Adaptação: multiplicador de K3.2', 'adaptacao.fK32', cfg.adaptacao.fK32 == null ? 1 : cfg.adaptacao.fK32, { hint: 'Conteúdo e configuração iniciais. 1 = nível de referência do exemplo do guia. Convenção ilustrativa da ferramenta.' })}
    </div>` : ''}
    ${sc.avancado ? `<h3>Conta econômica (modo avançado)</h3>
    <div class="prem">
      ${campo('Taxa de desconto real', 'opc.r', o.r, { pct: true, hint: 'Use a taxa social oficial da jurisdição. 0 = sem desconto.' })}
      ${campo('Tendência anual de preço de modelos e GPU', 'opc.delta', o.delta, { pct: true, hint: 'Queda anual esperada. Use só na conta econômica e na sensibilidade, nunca para reduzir a dotação.' })}
      ${campo('Preço-sombra da capacidade interna', 'opc.sigmaCap', o.sigmaCap, { step: '0.05', hint: '1 = custo carregado de mercado; 0 = tempo sem uso alternativo' })}
      ${campo('Probabilidade de saída ao fim do horizonte', 'opc.pSaida', o.pSaida, { pct: true })}
      ${campo('Vida útil da implantação (anos)', 'opc.vidaUtil', o.vidaUtil, { step: '1', hint: 'Usada no valor residual e no custo anual equivalente' })}
      <div class="q"><label for="fech">Fechamento do horizonte</label><select class="f" id="fech" data-copt="fechamento"><option value="saida" ${o.fechamento === 'saida' ? 'selected' : ''}>Ciclo com saída (padrão)</option><option value="continuidade" ${o.fechamento === 'continuidade' ? 'selected' : ''}>Continuidade com valor residual</option></select><div class="hint">Convenções exclusivas: usar as duas contaria o mesmo ativo duas vezes.</div></div>
      <label class="check"><input type="checkbox" data-copt="doados" ${o.doados ? 'checked' : ''}><span>Valorar insumos cedidos sem custo a preço de mercado</span></label>
    </div>` : ''}
  </div></details>

  <details class="box" data-det="linhas"><summary>Insumos editáveis: implantação, itens, pessoas e saída</summary><div class="in">
    <h3>Implantação e manutenção anual</h3>
    <div class="tw"><table><thead><tr><th>Implantação (Ano 0, despesa de capital)</th><th class="n">Valor (US$)</th><th class="n">Manutenção % a.a.</th></tr></thead><tbody>${impl}</tbody></table></div>
    ${mensais ? `<h3>Serviços mensais em US$</h3><div class="tw"><table><thead><tr><th>Serviço</th><th>Subcomponente</th><th class="n">US$/mês</th><th class="n">Meses no Ano 0</th><th></th></tr></thead><tbody>${mensais}</tbody></table></div>` : ''}
    <h3>Itens por ano (desembolso)</h3>
    <div class="tw"><table><thead><tr><th>Item</th><th>Subcomponente</th><th>Moeda</th>${yrHead}<th></th></tr></thead><tbody>${itens}</tbody></table></div>
    <div class="row"><button class="btn" type="button" data-act="add-item">Adicionar item</button><button class="btn" type="button" data-act="add-base">Adicionar custo de condições de base (K1)</button></div>
    <h3>Pessoas (FTE por ano)</h3>
    <p class="small muted">Capacidade interna é tempo de equipes existentes: tem custo econômico, mas não pede dotação nova. Desembolso novo é contratação ou serviço.</p>
    <div class="tw"><table><thead><tr><th>Atividade</th><th>Subcomponente</th><th>Natureza</th><th>Função</th>${yrHead}<th></th></tr></thead><tbody>${pessoas}</tbody></table></div>
    <div class="row"><button class="btn" type="button" data-act="add-pessoa">Adicionar atividade</button></div>
    <div class="grid2">
      <div><h3>Custo anual carregado por função (US$)</h3><div class="tw"><table><tbody>${salarios}</tbody></table></div></div>
      <div style="display:grid;gap:10px;align-content:start"><h3>Formação</h3>
        <div class="prem">${fmt.ativo ? campo('Horas de formação por pessoa', 'formacaoTempo.horas', fmt.horas, { step: '0.5' }) + campo('Custo-hora de quem é formado (US$)', 'formacaoTempo.custoHora', fmt.custoHora, { step: '1' }) + (fmt.modo === 'razao' ? campo('Estudantes por professor formado', 'formacaoTempo.razao', fmt.razao, { step: '1' }) : campo('Rotatividade anual', 'formacaoTempo.rot', fmt.rot, { pct: true })) : '<p class="small muted">Sem tempo de formação modelado.</p>'}</div>
        <h3>Saída ao final do horizonte</h3>
        <div class="prem">${campo('Reconstrução (% da implantação)', 'saida.reconstrucaoPct', sa.reconstrucaoPct || 0, { pct: true })}${campo('Meses de operação paralela', 'saida.mesesParalelo', sa.mesesParalelo || 0, { step: '1' })}${campo('Horas de retreinamento por usuário ativo', 'saida.horasRetreino', sa.horasRetreino || 0, { step: '0.5' })}</div>
        <div class="tw"><table><thead><tr><th>Outros custos de saída</th><th class="n">US$</th><th></th></tr></thead><tbody>${saidaItens}</tbody></table></div>
        <div class="row"><button class="btn" type="button" data-act="add-saida">Adicionar custo de saída</button></div>
      </div>
    </div>
  </div></details>

  <section class="disc"><h3>Como ler e o que ainda depende de dados locais</h3><ul class="small">
    <li><b>Duas contas.</b> A econômica soma desembolso, capacidade interna e insumos cedidos, em preços constantes do Ano 0. A orçamentária soma só o desembolso, em preços correntes de cada exercício, com reservas. A identidade custo econômico = desembolso + capacidade + cedidos é verificada pelo modelo.</li>
    <li><b>Índices.</b> O índice de custo unitário (custo por usuário ativo por ano) se decompõe exatamente nos índices dos componentes e subcomponentes, porque todos usam o mesmo denominador. Razões com denominadores diferentes (% em moeda estrangeira, anos para sair) não se somam.</li>
    <li><b>Premissas ilustrativas.</b> Salários, custo-hora, inflação, valores de implantação, faixas de incerteza e governança por nível de risco são convenções do guia. Substitua por dados e cotações locais.</li>
    <li><b>Benefícios fora do custo.</b> Capacidade liberada tem valor, mas não reduz o orçamento. Compare alternativas pela razão custo-efetividade ou pelo efeito mínimo (modo avançado).</li>
  </ul></section>`;
}

// ----------------------------------------------------------- gráficos
const COR_K = { K1: 'var(--k1)', K2: 'var(--k2)', K3: 'var(--k3)', K4: 'var(--k4)', K5: 'var(--k5)', K6: 'var(--k6)' };
function eixoBom(raw, n = 4) { const mag = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1e-9) / n))); const step = [1, 2, 2.5, 5, 10].map(k => k * mag).find(st => st * n >= raw) || 10 * mag; return { step, ticks: Math.max(1, Math.ceil(raw / step)) }; }
function graficoComposicao(av, conta) {
  const T = av.r.anos;
  const valK = (k, t) => av.linhas.filter(l => l.k === k).reduce((s, l) => s + (conta === 'fin' ? l.fin[t] : l.eco[t]), 0);
  const tot = T.map(t => ARVORE.reduce((s, [k]) => s + valK(k, t), 0));
  const raw = Math.max(...tot) * moedaInfo().f / 1000 || 1; const { step, ticks } = eixoBom(raw); const mx = step * ticks;
  const W = 640, Hh = 240, padL = 56, padB = 26, padT = 22;
  const n = T.length, slot = (W - padL - 20) / n, bw = Math.min(70, slot * 0.62);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Custo por componente e ano">`;
  for (let i = 0; i <= ticks; i++) { const v = step * i, y = Hh - padB - (Hh - padB - padT) * v / mx; s += `<line x1="${padL}" x2="${W - 10}" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="${padL - 6}" y="${y + 4}" text-anchor="end">${v.toLocaleString(LOC())}</text>`; }
  T.forEach(t => {
    const x = padL + slot * t + (slot - bw) / 2; let y0 = Hh - padB;
    ARVORE.forEach(([k, nk]) => { const v = valK(k, t) * moedaInfo().f / 1000; const h = (Hh - padB - padT) * v / mx; if (h > 0.4) { s += `<rect x="${x}" y="${y0 - h}" width="${bw}" height="${Math.max(h - 1, 0.5)}" style="fill:${COR_K[k]}"><title>${k} ${esc(nk)}: ${mil(valK(k, t))} ${unidMil()}</title></rect>`; y0 -= h; } });
    s += `<text class="lab" x="${x + bw / 2}" y="${Hh - 8}" text-anchor="middle">Ano ${t}</text><text class="lab" x="${x + bw / 2}" y="${y0 - 4}" text-anchor="middle">${mil(tot[t], 0)}</text>`;
  });
  return s + '</svg>' + `<div class="legend">${ARVORE.map(([k, nk]) => `<span><i style="background:${COR_K[k]}"></i>${k} ${esc(nk)}</span>`).join('')}</div>`;
}
function graficoICU(ind) {
  const ks = ARVORE.map(([k, n]) => [k, n, ind.icuK[k] || 0]);
  const tot = ind.icu, mx = Math.max(...ks.map(x => Math.abs(x[2])), 1e-9);
  const W = 640, rowH = 26, padL = 210, Hh = ks.length * rowH + 36;
  let s = `<svg class="chart" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Índice de custo unitário por componente">`;
  ks.forEach(([k, n, v], i) => {
    const y = 6 + i * rowH, w = (W - padL - 110) * Math.max(v, 0) / mx;
    s += `<text class="lab" x="${padL - 8}" y="${y + 13}" text-anchor="end">${k} ${esc(n)}</text><rect x="${padL}" y="${y + 2}" width="${Math.max(w, 0.5)}" height="${rowH - 10}" style="fill:${COR_K[k]}"><title>${din(v, 2)}</title></rect>
      <text class="lab" x="${padL + w + 6}" y="${y + 13}">${din(v, 2)} (${pct(tot ? v / tot : 0)})</text>`;
  });
  s += `<line x1="${padL}" x2="${W - 10}" y1="${Hh - 26}" y2="${Hh - 26}" stroke="var(--line)"/><text class="lab" x="${padL - 8}" y="${Hh - 9}" text-anchor="end" font-weight="700">Índice total</text><text class="lab" x="${padL}" y="${Hh - 9}" font-weight="700">${din(tot, 2)} por usuário ativo por ano = soma dos componentes</text>`;
  return s + '</svg>';
}
function graficoTornado2(tor) {
  const rows = tor.rows, W = 780, rowH = 26, padL = 340, Hh = rows.length * rowH + 30;
  const mx = Math.max(...rows.map(r => Math.max(Math.abs(r.lo), Math.abs(r.hi))), 1e-9);
  const cx = padL + (W - padL - 20) / 2, sc = (W - padL - 40) / 2 / mx;
  let s = `<svg class="chart" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Sensibilidade do custo total">`;
  s += `<line x1="${cx}" x2="${cx}" y1="4" y2="${Hh - 22}" stroke="var(--muted)"/>`;
  rows.forEach((r, i) => {
    const y = 8 + i * rowH;
    const bar = (v, cor) => { const w = Math.abs(v) * sc; const x = v < 0 ? cx - w : cx; return `<rect x="${x}" y="${y}" width="${Math.max(w, 0.5)}" height="${rowH - 10}" style="fill:${cor}"><title>${din(v)}</title></rect>`; };
    s += `<text class="lab" x="${padL - 8}" y="${y + 12}" text-anchor="end">${esc(r.nome)} (×${r.min.toLocaleString(LOC())} a ×${r.max.toLocaleString(LOC())})</text>` + bar(r.lo, 'var(--tor-lo)') + bar(r.hi, 'var(--tor-hi)');
  });
  s += `<text x="${cx}" y="${Hh - 6}" text-anchor="middle">custo econômico total: ${din(tor.base)}</text></svg>`;
  return s + `<div class="legend"><span><i style="background:var(--tor-lo)"></i>direcionador no mínimo da faixa</span><span><i style="background:var(--tor-hi)"></i>no máximo da faixa</span></div>`;
}

// ----------------------------------------------------------- árvore (tabela expansível)
function tabelaArvore(av, ind, conta) {
  const sc = S.custo, T = av.r.anos;
  const serieLinha = l => conta === 'fin' ? l.fin : l.eco;
  const totL = l => conta === 'fin' ? l.fin.reduce((a, b) => a + b, 0) : l.ecoVP;
  const serieS = s => T.map(t => av.linhas.filter(l => l.s === s).reduce((a, l) => a + serieLinha(l)[t], 0));
  const saidaS = s => s === 'K6.3' ? (conta === 'fin' ? av.saidaFin : av.saida.reduce((a, x) => a + x.ecoVP, 0) - av.vr) : 0;
  const totS = s => av.linhas.filter(l => l.s === s).reduce((a, l) => a + totL(l), 0) + saidaS(s);
  const total = ARVORE.reduce((a, [k, , ss]) => a + ss.reduce((b, [s]) => b + totS(s), 0), 0);
  const den = ind.usuariosAno;
  const cel = v => `<td class="n">${Math.abs(v) > 0.5 ? mil(v) : '–'}</td>`;
  let rows = '';
  ARVORE.forEach(([k, nk, ss]) => {
    const sk = T.map(t => ss.reduce((a, [s]) => a + serieS(s)[t], 0));
    const tk = ss.reduce((a, [s]) => a + totS(s), 0);
    const ab = sc.abertos[k];
    rows += `<tr class="kr"><td><button class="tg" type="button" data-tog="${k}" aria-expanded="${!!ab}">${ab ? '▾' : '▸'}</button> <i class="sw" style="background:${COR_K[k]}"></i><b>${k} ${esc(nk)}</b></td>${sk.map(cel).join('')}<td class="n"><b>${mil(tk)}</b></td><td class="n">${den ? din(tk / den, 2) : '–'}</td><td class="n">${pct(total ? tk / total : 0)}</td></tr>`;
    if (!ab) return;
    ss.forEach(([s, ns]) => {
      const vs = serieS(s), ts = totS(s);
      const abS = sc.abertos[s];
      const ls = av.linhas.filter(l => l.s === s);
      const temS = ls.length || (s === 'K6.3' && av.saida.length);
      rows += `<tr class="sr"><td style="padding-left:28px">${temS ? `<button class="tg" type="button" data-tog="${s}" aria-expanded="${!!abS}">${abS ? '▾' : '▸'}</button>` : '<span class="tg"></span>'} ${s} ${esc(ns)}</td>${vs.map(cel).join('')}<td class="n">${mil(ts)}</td><td class="n">${den ? din(ts / den, 2) : '–'}</td><td class="n">${pct(total ? ts / total : 0)}</td></tr>`;
      if (!abS) return;
      ls.forEach(l => {
        const tags = `<span class="tag ${l.nat === 'C' ? 'gold' : ''}" title="Natureza">${{ D: 'desembolso', C: 'capacidade', O: 'cedido' }[l.nat]}</span>${l.moeda === 'USD' ? ' <span class="tag" title="Cotado em dólar">US$</span>' : ''}${l.orc === 'capital' ? ' <span class="tag" title="Despesa de capital">capital</span>' : ''}${l.comp === 'V' || l.tag === 'gpu' ? ' <span class="tag" title="Varia com o uso">variável</span>' : ''}`;
        rows += `<tr class="ir"><td style="padding-left:56px">${esc(l.nome)} ${tags}${l.un ? `<div class="small muted">unidade: ${esc(l.un)}</div>` : ''}</td>${serieLinha(l).map(cel).join('')}<td class="n">${mil(totL(l))}</td><td class="n">${den ? din(totL(l) / den, 2) : '–'}</td><td></td></tr>`;
      });
      if (s === 'K6.3') av.saida.forEach(x => {
        const v = conta === 'fin' ? (x.nat === 'D' ? x.valor : 0) : x.ecoVP;
        rows += `<tr class="ir"><td style="padding-left:56px">${esc(x.nome)} <span class="tag">fim do horizonte</span></td>${T.map((t, i) => i === T.length - 1 ? cel(v) : '<td class="n">–</td>').join('')}<td class="n">${mil(v)}</td><td class="n">${den ? din(v / den, 2) : '–'}</td><td></td></tr>`;
      });
    });
  });
  const totAno = T.map(t => ARVORE.reduce((a, [, , ss]) => a + ss.reduce((b, [s]) => b + serieS(s)[t], 0), 0));
  return `<div class="tw"><table class="arv"><thead><tr><th>Componente, subcomponente e insumo</th>${T.map(t => `<th class="n">Ano ${t}</th>`).join('')}<th class="n">Total</th><th class="n">Por usuário-ano</th><th class="n">%</th></tr></thead><tbody>
    ${rows}<tr class="tot"><td>${conta === 'fin' ? 'Desembolso total (sem reservas)' : 'Custo total do ciclo de vida'}</td>${totAno.map(cel).join('')}<td class="n">${mil(total)}</td><td class="n">${den ? din(total / den, 2) : '–'}</td><td class="n">100%</td></tr></tbody></table></div>
    <div class="row small"><button class="btn" type="button" data-act="abrir-tudo">Abrir tudo</button><button class="btn" type="button" data-act="fechar-tudo">Fechar tudo</button>
    <span class="muted">${conta === 'fin' ? 'Conta orçamentária: preços correntes, só desembolso; a saída aparece no fim do horizonte e só entra no orçamento se for decidida.' : 'Conta econômica: preços constantes do Ano 0' + (av.r.opc.r ? ', descontados à taxa real de ' + pct(av.r.opc.r, 1) : '') + '; inclui capacidade interna e insumos cedidos.'}</span></div>`;
}

// ----------------------------------------------------------- resultados
function renderCustosResultados() {
  const el = $('#cres'); if (!el) return;
  const sc = estadoCusto(); const cfg = cfgAtual(); garantirOpc(cfg);
  let r, av, ind, cs, tor, orc;
  try { r = calcular(cfg); av = avaliar(r); ind = indicadores(cfg, av); cs = cenarios(cfg); tor = tornado(cfg); orc = orcamento(cfg); }
  catch (e) { console.error(e); el.innerHTML = `<div class="alert bloqueio"><span class="ic">Erro</span><span>Não foi possível calcular com estas premissas. Verifique campos vazios ou zerados.</span><span></span></div>`; return; }
  const T = r.anos, H = r.H, mp = moedaInfo().pre;
  const dotTot = orc.dot.reduce((a, b) => a + b, 0);
  const kpis = [
    [grande(av.ctEco), 'Custo total do ciclo de vida (conta econômica)'],
    [grande(dotTot), 'Dotação total nos ' + (H + 1) + ' exercícios (conta orçamentária)'],
    [din(ind.icu, 2), 'Índice de custo unitário: por usuário ativo por ano'],
    [din(ind.marginal, 2), 'Custo marginal por usuário ativo adicional'],
    [pct(ind.pCapacidade), 'Capacidade interna (sem dotação nova)'],
    [pct(ind.pUSD), 'Cotado em moeda estrangeira'],
    [ind.anosParaSair.toLocaleString(LOC(), { maximumFractionDigits: 1 }) + ' ano(s)', 'Custo de sair, em anos de custo recorrente'],
  ];
  const cen = Object.keys(cs).map(k => { const a = avaliar(cs[k]); const o = orcamentoDeLinhas(a, cfg); return [k, cs[k], a, o]; });
  const ocapK = ARVORE.map(([k]) => k);
  const cl = compLicenca(cfg), ca = compArquiteturas(cfg);
  const yrs = v => T.map(t => `<td class="n">${v[t] > 0.5 ? mil(v[t]) : '–'}</td>`).join('') + `<td class="n">${mil(v.reduce((a, b) => a + b, 0))}</td>`;
  const yrHead = T.map(t => `<th class="n">Ano ${t}</th>`).join('');
  let html = `
  <div class="kpis">${kpis.map(k => `<div class="kpi"><span class="v">${k[0]}</span><span class="l">${esc(k[1])}</span></div>`).join('')}</div>
  <section class="card" style="display:grid;gap:8px"><h3>Índice de custo unitário e seus componentes</h3>
    <p class="small muted">O índice total é a soma exata dos índices dos componentes, porque todos dividem pelo mesmo denominador: ${fmtInt(ind.usuariosAno)} usuários ativos-ano no horizonte. Custo por elegível por ano: ${din(ind.icuElegivel, 2)}.${ind.custoInteracao ? ' Custo por interação: ' + din(ind.custoInteracao, 3) + '.' : ''} Custo marginal ÷ médio: ${ind.razaoMarginalMedio.toLocaleString(LOC(), { maximumFractionDigits: 2 })} (abaixo de 1 indica custos fixos diluídos com a escala).</p>
    ${graficoICU(ind)}</section>
  <section style="display:grid;gap:8px"><h3>Árvore de custos (${unidMil()})</h3>${tabelaArvore(av, ind, sc.conta)}</section>
  <section class="card" style="display:grid;gap:8px"><h3>Composição por ano, conta ${sc.conta === 'fin' ? 'orçamentária' : 'econômica'} (${unidMil()})</h3>${graficoComposicao(av, sc.conta)}</section>
  <section style="display:grid;gap:8px"><h3>Visão orçamentária por exercício (${unidMil()}, preços correntes)</h3>
    <div class="tw"><table><thead><tr><th>Componente</th>${yrHead}<th class="n">Total</th></tr></thead><tbody>
      <tr><td>Contratos e serviços de valor fixo</td>${yrs(orc.fixo)}</tr>
      <tr><td>Consumo variável (cenário esperado)</td>${yrs(orc.var)}</tr>
      <tr><td>Reserva para adoção acima do esperado</td>${yrs(orc.reserva)}</tr>
      <tr><td>Reserva de contingência (${pct(orc.contPct)})</td>${yrs(orc.cont)}</tr>
      <tr class="tot"><td>Dotação a solicitar</td>${yrs(orc.dot)}</tr>
      <tr class="sub"><td>da qual despesa de capital (implantação)</td>${yrs(orc.capital)}</tr>
      <tr class="sub"><td>da qual despesa corrente</td>${yrs(orc.corrente)}</tr>
      <tr><td>Capacidade interna mobilizada (declarar, não solicitar)</td>${yrs(orc.cap)}</tr>
      ${orc.doado.some(x => x > 0) ? `<tr><td>Insumos cedidos sem custo, a preço de mercado (registrar)</td>${yrs(orc.doado)}</tr>` : ''}
      <tr><td>Desembolso estimado de saída (orçar se a saída for decidida)</td>${T.map((t, i) => `<td class="n">${i === T.length - 1 ? mil(orc.saida) : '–'}</td>`).join('')}<td class="n">${mil(orc.saida)}</td></tr>
    </tbody></table></div>
    <p class="small muted">A classificação entre despesa de capital e corrente é uma sugestão: confirme com a regra orçamentária da sua jurisdição.</p></section>
  <section style="display:grid;gap:8px"><h3>Cenários</h3>
    <div class="tw"><table><thead><tr><th>Indicador</th>${cen.map(c => `<th class="n">${c[0]}</th>`).join('')}</tr></thead><tbody>
      <tr><td>Usuários ativos no último ano</td>${cen.map(c => `<td class="n">${fmtInt(c[1].U[H])}</td>`).join('')}</tr>
      <tr><td>Custo total do ciclo de vida (${unidMil()})</td>${cen.map(c => `<td class="n">${mil(c[2].ctEco)}</td>`).join('')}</tr>
      <tr><td>Desembolso com contingência, sem reserva de adoção (${unidMil()})</td>${cen.map(c => `<td class="n">${mil(c[3].dot.reduce((a, b) => a + b, 0))}</td>`).join('')}</tr>
      <tr><td>Índice de custo unitário</td>${cen.map(c => `<td class="n">${din(indicadores(c[1].cfg, c[2]).icu, 2)}</td>`).join('')}</tr>
      ${ocapK.map(k => `<tr class="sub"><td>${k} ${esc(NOME_K[k])}</td>${cen.map(c => `<td class="n">${mil(c[2].porK[k])}</td>`).join('')}</tr>`).join('')}
    </tbody></table></div>
    <p class="small muted">Alta adoção: adoção ×1,5 (até 90%)${arquitetura(cfg) !== 'saas' ? ' e 20% mais sessões' : ''}. Estresse: alta adoção com ${arquitetura(cfg) === 'saas' ? 'reajuste de 10% a.a., câmbio 25% mais caro e mais horas de formação' : arquitetura(cfg) === 'api' ? 'contexto e saída 50% maiores, mais chamadas por interação, preços e câmbio 25% maiores' : 'respostas 50% mais longas, vazão 25% menor, preços e câmbio 25% maiores'}.</p></section>
  <section class="card" style="display:grid;gap:8px"><h3>O que mais move o custo</h3>
    <p class="small muted">Cada direcionador varia na sua própria faixa plausível, mantidos os demais no valor provável. As faixas são convenções editoriais do guia${sc.avancado ? ' e podem ser editadas abaixo' : ''}.</p>${graficoTornado2(tor)}</section>`;
  if (cl) html += `<section style="display:grid;gap:8px"><h3>Licença institucional ou licenças nominais</h3>
    <div class="tw"><table><thead><tr><th>Indicador</th>${cl.rows.map(x => `<th class="n">Ano ${x.t}</th>`).join('')}</tr></thead><tbody>
      <tr><td>Usuários ativos</td>${cl.rows.map(x => `<td class="n">${fmtInt(x.U)}</td>`).join('')}</tr>
      <tr><td>Institucional: licenças por ano (${unidMil()})</td>${cl.rows.map(x => `<td class="n">${mil(x.inst)}</td>`).join('')}</tr>
      <tr><td>Institucional: por usuário ativo por mês</td>${cl.rows.map(x => `<td class="n">${din(x.instAtivo, 2)}</td>`).join('')}</tr>
      <tr><td>Nominal: licenças por ano (${unidMil()})</td>${cl.rows.map(x => `<td class="n">${mil(x.nom)}</td>`).join('')}</tr>
      <tr><td>Nominal: por usuário ativo por mês</td>${cl.rows.map(x => `<td class="n">${din(x.nomAtivo, 2)}</td>`).join('')}</tr>
    </tbody></table></div><p>A licença institucional só compensa com adoção acima de <b>${pct(cl.aEq)}</b> dos elegíveis.</p></section>`;
  if (ca) html += `<section style="display:grid;gap:8px"><h3>A mesma função em outras arquiteturas (Ano 2, ${unidMil()})</h3>
    <div class="tw"><table><thead><tr><th>Arquitetura</th><th class="n">Computação ou consumo</th><th class="n">Engenharia de operação</th><th class="n">Demais custos</th><th class="n">Total</th></tr></thead><tbody>
    ${ca.rows.map(x => `<tr><td>${esc(x.nome)}</td><td class="n">${mil(x.comp)}</td><td class="n">${mil(x.pes)}</td><td class="n">${mil(ca.resto)}</td><td class="n"><b>${mil(x.tot)}</b></td></tr>`).join('')}</tbody></table></div></section>`;
  if (sc.avancado) html += renderAvancado(cfg, r, av, ind);
  el.innerHTML = html;
}

// ----------------------------------------------------------- modo avançado
function renderAvancado(cfg, r, av, ind) {
  const sc = S.custo, T = r.anos, H = r.H;
  const dirs = direcionadores(cfg);
  const faixas = `<div class="tw"><table><thead><tr><th>Direcionador</th><th class="n">Mínimo (×)</th><th class="n">Máximo (×)</th></tr></thead><tbody>
    ${dirs.map((d, i) => `<tr><td>${esc(d.nome)}</td><td class="n">${inputNum({ valor: d.min, casas: CASAS_CALC, cls: 'w-s', ok: false, rotulo: 'Mínimo ' + d.nome, attrs: `data-faixa="${d.id}" data-lado="min"` })}</td><td class="n">${inputNum({ valor: d.max, casas: CASAS_CALC, cls: 'w-s', ok: false, rotulo: 'Máximo ' + d.nome, attrs: `data-faixa="${d.id}" data-lado="max"` })}</td></tr>`).join('')}</tbody></table></div>`;
  const sim = SIM && SIM.chave === JSON.stringify(cfg) ? SIM.res : null;
  const simHtml = sim ? `<div class="tw"><table><thead><tr><th>Saída</th><th class="n">P10</th><th class="n">P50</th><th class="n">P90</th><th class="n">Custo em risco (P90 − P50)</th></tr></thead><tbody>
      <tr><td>Custo total do ciclo de vida (${unidMil()})</td><td class="n">${mil(sim.ct.p10)}</td><td class="n">${mil(sim.ct.p50)}</td><td class="n">${mil(sim.ct.p90)}</td><td class="n">${mil(sim.ct.p90 - sim.ct.p50)}</td></tr>
      ${sim.dot.map((q, t) => `<tr><td>Dotação do Ano ${t}</td><td class="n">${mil(q.p10)}</td><td class="n">${mil(q.p50)}</td><td class="n">${mil(q.p90)}</td><td class="n">${mil(sim.custoEmRisco[t])}</td></tr>`).join('')}
    </tbody></table></div><p class="small muted">${fmtInt(sim.N)} cenários, distribuição triangular em cada direcionador (moda no valor provável), choques comuns de adoção e câmbio, semente ${sim.seed}. As faixas são convenções; P10 e P90 não são probabilidades medidas.</p>` : '<p class="small muted">Ainda não simulado para estas premissas.</p>';
  // LMDI
  let lm = null; const t0 = Math.min(sc.lmdi0 != null ? sc.lmdi0 : 1, H), t1 = Math.min(sc.lmdi1 != null ? sc.lmdi1 : 2, H);
  try { lm = lmdi(cfg, t0, cfg, t1); } catch (e) { lm = null; }
  const lmHtml = lm ? `<div class="row small"><label>De</label><select class="f" data-lmdi="0" style="width:auto">${T.map(t => `<option value="${t}" ${t === t0 ? 'selected' : ''}>Ano ${t}</option>`).join('')}</select><label>para</label><select class="f" data-lmdi="1" style="width:auto">${T.map(t => `<option value="${t}" ${t === t1 ? 'selected' : ''}>Ano ${t}</option>`).join('')}</select></div>
    <div class="tw"><table><thead><tr><th>Fator</th><th class="n">Ano ${t0}</th><th class="n">Ano ${t1}</th><th class="n">Efeito (${unidMil()})</th></tr></thead><tbody>
    ${lm.contrib.map(c => `<tr><td>${esc(c.fator)}</td><td class="n">${c.v0.toLocaleString(LOC(), { maximumFractionDigits: 4 })}</td><td class="n">${c.v1.toLocaleString(LOC(), { maximumFractionDigits: 4 })}</td><td class="n">${mil(c.efeito)}</td></tr>`).join('')}
    <tr class="tot"><td>${arquitetura(cfg) === 'saas' ? 'Variação total do custo de licenças' : 'Variação total do consumo de modelos'}</td><td class="n">${mil(lm.C0)}</td><td class="n">${mil(lm.C1)}</td><td class="n">${mil(lm.delta)}</td></tr></tbody></table></div>
    <p class="small muted">Decomposição logarítmica (LMDI): os efeitos somam exatamente a variação. Mostra quanto veio de escala, intensidade de uso, preço e câmbio.</p>` : '<p class="small muted">Disponível para soluções por licença ou por consumo de API.</p>';
  const las = laspeyres(cfg);
  const lasHtml = `<div class="tw"><table><thead><tr><th>Índice</th>${T.map(t => `<th class="n">Ano ${t}</th>`).join('')}</tr></thead><tbody><tr><td>Preços dos insumos do caso (Ano 1 = 100)</td>${las.map(x => `<td class="n">${x == null ? '–' : x.toLocaleString(LOC(), { maximumFractionDigits: 1 })}</td>`).join('')}</tr></tbody></table></div>
    <p class="small muted">Laspeyres com a cesta de insumos do Ano 1. Use para comparar com o índice de reajuste do contrato e para separar, na execução, efeito preço de efeito quantidade.</p>`;
  // alternativas
  const alts = sc.alts || [];
  const lista = [{ nome: sc.base === 'caso' ? 'Seu caso' : 'Exemplo ' + sc.base, cfg, efeito: sc.efeitoCaso }].concat(alts.map(a => ({ nome: a.nome, cfg: cfgAlternativa(a, cfg), efeito: a.efeito })));
  let comp = null; try { if (alts.length) comp = comparar([lista[lista.length > 1 && sc.refAlt != null ? Math.min(sc.refAlt + 1, lista.length - 1) : 0]].concat(lista.filter((_, i) => i !== (sc.refAlt != null ? Math.min(sc.refAlt + 1, lista.length - 1) : 0)))); } catch (e) { comp = null; }
  const lam = +lerNumero(sc.lambda);
  const altsHtml = `<p class="small muted">Monte alternativas na mesma árvore, inclusive o status quo ou uma solução sem IA, e informe o efeito de cada uma, se houver estimativa, na mesma unidade (por exemplo, desvio-padrão em aprendizagem ou horas liberadas por usuário). A primeira linha da tabela é a referência.</p>
    <div class="tw"><table><thead><tr><th>Alternativa</th><th class="n">Implantação (US$)</th><th class="n">Custo anual (US$)</th><th class="n">FTE internos/ano</th><th class="n">Efeito</th><th>Referência</th><th></th></tr></thead><tbody>
      <tr><td>${esc(lista[0].nome)} <span class="small muted">(premissas acima)</span></td><td></td><td></td><td></td><td class="n">${inputNum({ valor: lerNumero(sc.efeitoCaso), casas: CASAS_CALC, cls: 'w-s', ok: false, rotulo: 'Efeito do caso', attrs: 'data-alt="caso" data-campo="efeito"' })}</td><td><input type="radio" name="refalt" data-refalt="-1" ${sc.refAlt == null ? 'checked' : ''} aria-label="Usar como referência"></td><td></td></tr>
      ${alts.map((a, i) => `<tr><td><input type="text" class="w-l" data-alt="${i}" data-campo="nome" value="${esc(a.nome)}" aria-label="Nome"></td><td class="n">${inputNum({ valor: lerNumero(a.impl), casas: CASAS_CALC, cls: 'w-m', ok: false, rotulo: 'Implantação', attrs: `data-alt="${i}" data-campo="impl"` })}</td><td class="n">${inputNum({ valor: lerNumero(a.anual), casas: CASAS_CALC, cls: 'w-m', ok: false, rotulo: 'Custo anual', attrs: `data-alt="${i}" data-campo="anual"` })}</td><td class="n">${inputNum({ valor: lerNumero(a.fte), casas: CASAS_CALC, cls: 'w-s', ok: false, rotulo: 'FTE', attrs: `data-alt="${i}" data-campo="fte"` })}</td><td class="n">${inputNum({ valor: lerNumero(a.efeito), casas: CASAS_CALC, cls: 'w-s', ok: false, rotulo: 'Efeito', attrs: `data-alt="${i}" data-campo="efeito"` })}</td><td><input type="radio" name="refalt" data-refalt="${i}" ${sc.refAlt === i ? 'checked' : ''} aria-label="Usar como referência"></td><td><button class="btn" type="button" data-act="rm-alt" data-i="${i}" aria-label="Remover">×</button></td></tr>`).join('')}
    </tbody></table></div>
    <div class="row"><button class="btn" type="button" data-act="add-alt">Adicionar alternativa sem IA ou status quo</button>
      <label class="small" for="lambda">Quanto a rede aceita pagar por unidade de efeito (US$)</label>${inputNum({ id: 'lambda', valor: lerNumero(sc.lambda), casas: CASAS_CALC, ok: false, style: 'width:140px', attrs: 'data-clambda' })}</div>
    ${comp ? `<div class="tw"><table><thead><tr><th>Alternativa</th><th class="n">Custo total (${unidMil()})</th><th class="n">Diferença para a referência</th><th class="n">Efeito</th><th class="n">Razão custo-efetividade incremental</th><th>Situação</th><th class="n">Efeito mínimo para justificar</th></tr></thead><tbody>
      ${comp.map((x, i) => `<tr><td>${esc(x.nome)}${i === 0 ? ' <span class="tag">referência</span>' : ''}</td><td class="n">${mil(x.ct)}</td><td class="n">${i === 0 ? '–' : mil(x.dC)}</td><td class="n">${x.efeito == null ? '–' : x.efeito.toLocaleString(LOC())}</td><td class="n">${x.rcei != null ? din(x.rcei, 0) + ' por unidade' : '–'}</td><td>${x.dominada ? '<span class="pill n-elevado plain">dominada</span>' : (x.efeito != null ? 'não dominada' : 'sem efeito informado')}</td><td class="n">${i > 0 && lam > 0 ? (x.dC / lam).toLocaleString(LOC(), { maximumFractionDigits: 3 }) + (comp[0].efeito != null ? ' acima da referência' : '') : '–'}</td></tr>`).join('')}
    </tbody></table></div><p class="small muted">Dominada: mais cara e não mais efetiva que outra. A razão incremental compara cada alternativa não dominada com a anterior, ordenadas por custo. O efeito mínimo é a diferença de custo dividida pelo valor que a rede aceita pagar por unidade de efeito.</p>` : ''}`;
  // equidade
  const eq = equidade(cfg, sc.estratos, av);
  const eqHtml = `<div class="tw"><table><thead><tr><th>Estrato</th><th class="n">Participação dos usuários (%)</th><th class="n">Fator sobre K1 (base)</th><th class="n">Fator sobre K4 (operação e formação)</th><th class="n">Custo por usuário-ano</th><th class="n">Diferença para a média</th></tr></thead><tbody>
    ${eq.map((z, i) => `<tr><td><input type="text" class="w-l" data-estr="${i}" data-campo="nome" value="${esc(z.nome)}" aria-label="Estrato"></td><td class="n">${inputNum({ valor: +(sc.estratos[i].part * 100).toFixed(2), casas: CASAS_CALC, cls: 'w-s', ok: false, rotulo: 'Participação', attrs: `data-estr="${i}" data-campo="part" data-pct="1"` })}</td><td class="n">${inputNum({ valor: sc.estratos[i].fK1, casas: CASAS_CALC, cls: 'w-s', ok: false, rotulo: 'Fator K1', attrs: `data-estr="${i}" data-campo="fK1"` })}</td><td class="n">${inputNum({ valor: sc.estratos[i].fK4, casas: CASAS_CALC, cls: 'w-s', ok: false, rotulo: 'Fator K4', attrs: `data-estr="${i}" data-campo="fK4"` })}</td><td class="n">${din(z.icu, 2)}</td><td class="n">${din(z.delta, 2)}</td></tr>`).join('')}
  </tbody></table></div><p class="small muted">Os estratos e fatores são exemplos editáveis, não dados. Mostram quanto custa garantir uso onde há menos condições: mais suporte, formação e infraestrutura por usuário.${(ind.icuK.K1 || 0) === 0 ? ' Como não há custos de base (K1) nas premissas, só o fator sobre K4 tem efeito.' : ''}</p>`;
  const caeImpl = (cfg.implantacao || []).reduce((s, x) => s + x.valor, 0);
  return `<section class="box" style="border:1px solid var(--line);border-radius:8px;background:var(--surface);padding:16px;display:grid;gap:14px">
    <h3>Modo avançado</h3>
    <div class="grid2">
      <div><h3>Faixas dos direcionadores</h3>${faixas}</div>
      <div><h3>Simulação de Monte Carlo</h3><div class="row"><button class="btn pri" type="button" data-act="simular">Rodar 1.500 cenários</button></div>${simHtml}</div>
    </div>
    <div><h3>Custo anual equivalente</h3><p class="small">Implantação de ${din(caeImpl)} com vida útil de ${r.opc.vidaUtil} anos equivale a <b>${din(cae(caeImpl, r.opc.r, r.opc.vidaUtil))}</b> por ano${r.opc.r ? ' à taxa de ' + pct(r.opc.r, 1) : ' sem desconto'}. Custo econômico do ciclo inteiro por ano: <b>${din(cae(av.ctEco, r.opc.r, H + 1))}</b>.</p></div>
    <div><h3>Decomposição da variação (LMDI)</h3>${lmHtml}</div>
    <div><h3>Índice de preços do caso</h3>${lasHtml}</div>
    <div><h3>Comparação de alternativas e custo-efetividade</h3>${altsHtml}</div>
    <div><h3>Equidade: custo por estrato</h3>${eqHtml}</div>
  </section>`;
}
function cfgAlternativa(a, base) {
  const H = opcoes(base).H;
  return {
    nome: a.nome, demanda: clone(base.demanda), opc: Object.assign({}, base.opc || {}),
    implantacao: +a.impl ? [{ nome: 'Implantação da alternativa', valor: +a.impl, manutPct: 0, s: 'K3.1' }] : [],
    itens: [{ nome: 'Custo anual da alternativa', s: 'K4.1', v: Array.from({ length: H + 1 }, (_, t) => t === 0 ? 0 : +a.anual || 0) }],
    pessoas: +a.fte ? [{ nome: 'Equipe interna da alternativa', s: 'K4.1', nat: 'C', partes: [['gestor_produto', Array.from({ length: H + 1 }, (_, t) => t === 0 ? 0 : +a.fte)]] }] : [],
    saida: {},
  };
}

// ----------------------------------------------------------- eventos da aba de custos
function custosEvento(e) {
  if (!document.getElementById('cres') || !(e.target.closest && e.target.closest('#custos-box'))) return false;
  const el = e.target; const sc = estadoCusto();
  if (e.type === 'click') {
    const cc = el.closest('[data-cconta]'); if (cc) { sc.conta = cc.dataset.cconta; renderCustosResultados(); salvar(); document.querySelectorAll('[data-cconta]').forEach(b => b.setAttribute('aria-pressed', b.dataset.cconta === sc.conta)); return true; }
    const tg = el.closest('[data-tog]'); if (tg) { sc.abertos[tg.dataset.tog] = !sc.abertos[tg.dataset.tog]; renderCustosResultados(); salvar(); return true; }
    const a = el.closest('[data-act]'); if (!a) return false;
    const act = a.dataset.act, cfg = cfgAtual();
    if (act === 'abrir-tudo') { ARVORE.forEach(([k, , ss]) => { sc.abertos[k] = true; ss.forEach(([s]) => { sc.abertos[s] = true; }); }); renderCustosResultados(); return true; }
    if (act === 'fechar-tudo') { sc.abertos = {}; renderCustosResultados(); return true; }
    if (act === 'simular') { a.disabled = true; a.textContent = 'Simulando…'; setTimeout(() => { SIM = { chave: JSON.stringify(cfg), res: simular(cfg, 1500) }; renderCustosResultados(); }, 30); return true; }
    if (act === 'add-alt') { (sc.alts = sc.alts || []).push({ nome: 'Status quo (sem IA)', impl: 0, anual: 0, fte: 0, efeito: '' }); renderCustosResultados(); salvar(); return true; }
    if (act === 'rm-alt') { sc.alts.splice(+a.dataset.i, 1); if (sc.refAlt != null && sc.refAlt >= sc.alts.length) sc.refAlt = null; renderCustosResultados(); salvar(); return true; }
    if (act === 'add-base') { const H = opcoes(cfg).H; (cfg.itens = cfg.itens || []).push({ cat: 'Condições de base', s: 'K1.1', nome: 'Ampliação de conectividade atribuível ao caso', moeda: 'LOC', v: Array.from({ length: H + 1 }, () => 0) }); editarCfg(); render(); return true; }
    if (act === 'add-item') { const H = opcoes(cfg).H; (cfg.itens = cfg.itens || []).push({ cat: 'Outros', s: 'K4.1', nome: 'Novo item', nat: 'D', moeda: 'LOC', v: Array.from({ length: H + 1 }, () => 0) }); editarCfg(); render(); return true; }
    if (act === 'add-pessoa') { const H = opcoes(cfg).H; (cfg.pessoas = cfg.pessoas || []).push({ cat: 'Pessoas', s: 'K4.1', nome: 'Nova atividade', nat: 'C', partes: [['gestor_produto', Array.from({ length: H + 1 }, (_, t) => t ? 0.1 : 0)]] }); editarCfg(); render(); return true; }
    return false;
  }
  if (e.type === 'change' || e.type === 'input') {
    if (el.dataset.cavanc != null && e.type === 'change') { sc.avancado = el.checked; render(); return true; }
    if (el.dataset.ccompat != null && e.type === 'change') { const cfg = cfgAtual(); cfg.opc = Object.assign({}, el.checked ? OPC_COMPAT : OPC_PADRAO, { H: opcoes(cfg).H }); editarCfg(); render(); return true; }
    if (el.dataset.copt && e.type === 'change') { const cfg = cfgAtual(); garantirOpc(cfg)[el.dataset.copt] = el.type === 'checkbox' ? el.checked : el.value; editarCfg(); renderCustosResultados(); atualizarLaterais(); return true; }
    if (el.dataset.faixa && e.type === 'change') { const cfg = cfgAtual(); cfg.faixas = cfg.faixas || []; let f = cfg.faixas.find(x => x.id === el.dataset.faixa); if (!f) { const d = direcionadores(cfg).find(x => x.id === el.dataset.faixa); f = { id: d.id, min: d.min, max: d.max }; cfg.faixas.push(f); } f[el.dataset.lado] = +lerNumero(el.value) || 1; editarCfg(); renderCustosResultados(); return true; }
    if (el.dataset.lmdi && e.type === 'change') { sc['lmdi' + el.dataset.lmdi] = +el.value; renderCustosResultados(); return true; }
    if (el.dataset.refalt && e.type === 'change') { const v = +el.dataset.refalt; sc.refAlt = v < 0 ? null : v; renderCustosResultados(); salvar(); return true; }
    if (el.dataset.clambda != null && e.type === 'change') { sc.lambda = lerNumero(el.value); renderCustosResultados(); salvar(); return true; }
    if (el.dataset.alt && e.type === 'change') {
      const v = el.dataset.campo === 'nome' ? el.value : lerNumero(el.value);
      if (el.dataset.alt === 'caso') sc.efeitoCaso = v; else sc.alts[+el.dataset.alt][el.dataset.campo] = v;
      renderCustosResultados(); salvar(); return true;
    }
    if (el.dataset.estr && e.type === 'change') { let v = el.value; if (el.dataset.campo !== 'nome') { v = +lerNumero(v) || 0; if (el.dataset.pct) v /= 100; } sc.estratos[+el.dataset.estr][el.dataset.campo] = v; renderCustosResultados(); salvar(); return true; }
    if (el.dataset.cfg === 'opc.H' && e.type === 'change') { const cfg = cfgAtual(); garantirOpc(cfg).H = Math.max(1, Math.min(10, Math.round(+lerNumero(el.value) || 3))); editarCfg(); render(); return true; }
  }
  return false;
}

// ----------------------------------------------------------- relatório e CSV
function secaoCustoRelatorio() {
  const cfg = cfgAtual(); garantirOpc(cfg);
  const r = calcular(cfg), av = avaliar(r), ind = indicadores(cfg, av), orc = orcamento(cfg), T = r.anos;
  const mp = unidMil();
  return { h: tr('Custo total e orçamento') + ' (' + mp + ', ' + tr('ilustrativo') + ')', p: [S.custo.base === 'caso' ? 'Premissas montadas a partir das respostas e dos exemplos do guia; substituir por cotações e dados locais.' : tr('Premissas do Exemplo ' + S.custo.base + ' do guia.'),
    [tr('Custo total do ciclo de vida (conta econômica):') + ' ' + grande(av.ctEco) + '.', tr('Índice de custo unitário:') + ' ' + din(ind.icu, 2) + ' ' + tr('por usuário ativo por ano') + '.', tr('Custo marginal por usuário adicional:') + ' ' + din(ind.marginal, 2) + '.', tr('Capacidade interna:') + ' ' + pct(ind.pCapacidade) + ';', tr('cotado em moeda estrangeira:') + ' ' + pct(ind.pUSD) + '.'].join(' ')],
    table: { head: ['Componente'].concat(['Índice por usuário-ano', 'Total no ciclo']), rows: ARVORE.map(([k, n]) => [k + ' ' + tr(n), din(ind.icuK[k], 2), mil(av.porK[k])]).concat([['Total', din(ind.icu, 2), mil(av.ctEco)]]) },
    pos: [tr('Dotação a solicitar por exercício') + ' (' + mp + '): ' + orc.dot.map((v, t) => tr('Ano ' + t) + ' ' + mil(v)).join('; ') + '. ' + tr('Saída estimada:') + ' ' + mil(orc.saida) + '.'] };
}
function csvCustos() {
  const cfg = cfgAtual(); garantirOpc(cfg);
  const r = calcular(cfg), av = avaliar(r), T = r.anos;
  const q = s => '"' + String(tr(s)).replace(/"/g, '""') + '"';
  const nf = v => v.toFixed(2).replace('.', ',');
  const L = [['Componente', 'Subcomponente', 'Insumo', 'Natureza', 'Comportamento', 'Moeda', 'Classificação orçamentária', 'Unidade'].map(tr).join(';') + ';' + T.map(t => tr('Ano ' + t + ' (nominal US$)')).join(';') + ';' + tr('Total econômico (US$ constantes)')];
  av.linhas.forEach(l => L.push([l.k, l.s, q(l.nome), tr({ D: 'desembolso', C: 'capacidade', O: 'cedido' }[l.nat]), l.comp, l.moeda, l.orc, q(l.un), ...l.v.map(nf), nf(l.ecoVP)].join(';')));
  av.saida.forEach(x => L.push(['K6', 'K6.3', q(x.nome), tr({ D: 'desembolso', C: 'capacidade' }[x.nat] || x.nat), tr('contingente'), x.moeda, 'corrente', '', ...T.map((t, i) => i === T.length - 1 ? nf(x.valor) : ''), nf(x.ecoVP)].join(';')));
  return '﻿' + L.join('\n');
}
