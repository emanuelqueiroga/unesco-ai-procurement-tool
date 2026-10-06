// =====================================================================
// v10 (R3): "Como o custo é calculado" — a fórmula do custo em linguagem simples.
// explicacaoCusto() monta os dados a partir de cfgAtual(), calcular() e avaliar():
//   1. fórmula geral com os números do caso (teste + uso + saída = custo total, igual a ctEco);
//   2. por ano, as linhas que somam ao menos 90% do ano, cada uma como conta
//      "quantidade × preço = valor" (ou "valor fixo da premissa"), e o resto em "Outros itens";
//   3. de onde vêm as quantidades principais; 4. três frases de leitura.
// renderFormula() → bloco HTML do passo 3.3; secaoFormula() → seções do plano e do PDF (A2).
// Não altera o motor (custos.js): lê r.linhas (q, p, un, v), av.linhas (eco), av.saida e cfg.
// Os textos saem traduzidos (tr) e os números no formato do idioma (LOC).
// =====================================================================

const FX_LIMIAR = 0.9;   // as linhas mostradas somam ao menos 90% do custo do ano

// unidades do motor → palavras simples: [singular, plural] da quantidade e sufixo do preço
const FX_UNID = {
  'licença-mês': { q: ['licença-mês', 'licenças-mês'], p: 'por licença por mês' },
  'interação': { q: ['interação', 'interações'], p: 'por interação' },
  'milhão de tokens': { q: ['milhão de tokens', 'milhões de tokens'], p: 'por milhão de tokens' },
  'página': { q: ['página', 'páginas'], p: 'por página' },
  'hora de GPU': { q: ['hora de servidor com GPU', 'horas de servidor com GPU'], p: 'por hora' },
  'hora de instância': { q: ['hora de servidor', 'horas de servidor'], p: 'por hora' },
  'mês': { q: ['mês', 'meses'], p: 'por mês' },
  'FTE-ano': { q: ['pessoa em tempo integral no ano', 'pessoas em tempo integral no ano'], p: 'por pessoa por ano' },
  'pessoa formada': { q: ['pessoa formada', 'pessoas formadas'], p: 'por pessoa formada' },
  'pessoa': { q: ['pessoa', 'pessoas'], p: 'por pessoa' },
};
const FX_TIPO = { D: 'pagamento', C: 'tempo da equipe interna', O: 'cedido sem custo' };
const FX_FIXO = 'valor fixo da premissa:';

// ----------------------------------------------------------- formatos
function fxT(s) { return typeof tr === 'function' ? tr(s) : s; }
function fxLoc() { return typeof LOC === 'function' ? LOC() : 'pt-BR'; }
function fxNum(x, max) { return (+x || 0).toLocaleString(fxLoc(), { maximumFractionDigits: max == null ? 2 : max }); }
// quantidade: inteiro quando é inteiro ou grande; até 3 casas para frações (0,3 pessoa)
function fxQtd(x) {
  const a = Math.abs(x);
  if (Math.abs(x - Math.round(x)) < 1e-6) return fxNum(Math.round(x), 0);
  if (a >= 100) return fxNum(x, 1);
  return fxNum(x, a < 10 ? 3 : 1);
}
// preço unitário na moeda de exibição, com casas suficientes para a conta fechar (US$ 9,36; US$ 0,0137)
function fxPreco(x) {
  if (typeof moedaInfo !== 'function') return 'US$ ' + fxNum(x, 4);
  const m = moedaInfo(), v = x * m.f, a = Math.abs(v);
  let min = 2, max;
  if (a >= 1000) { min = 0; max = 0; }
  else if (a >= 100) { const inteiro = Math.abs(v - Math.round(v)) < 1e-9; min = inteiro ? 0 : 2; max = 2; }
  else if (a === 0) max = 2;
  else max = Math.min(6, Math.max(2, 4 - Math.floor(Math.log10(a))));
  return m.pre + ' ' + v.toLocaleString(fxLoc(), { minimumFractionDigits: min, maximumFractionDigits: max });
}
function fxDin(x) { return typeof din === 'function' ? din(x, 0) : 'US$ ' + fxNum(x, 0); }
function fxGrande(x) { return typeof grande === 'function' ? grande(x) : fxDin(x); }
function fxPct(x, d) { return (100 * (x || 0)).toLocaleString(fxLoc(), { maximumFractionDigits: d == null ? 1 : d }) + '%'; }
function fxFator(x) { return fxNum(x, 4); }
function fxEsc(s) { return typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function fxAno(arr, t) { return typeof ano === 'function' ? ano(arr, t) : (Array.isArray(arr) ? arr[Math.min(t, arr.length - 1)] : arr); }
// valor na moeda de exibição, arredondado à unidade (para que as parcelas mostradas somem o total mostrado)
function fxFatorMoeda() { return typeof moedaInfo === 'function' ? moedaInfo().f : 1; }
// Arredonda parcelas para que somem o total arredondado (maior resto vai para a maior parcela). Devolve valores em US$.
function fxFechar(partes, total) {
  const f = fxFatorMoeda();
  const alvo = Math.round(total * f);
  const bruto = partes.map(x => x * f);
  const pr = bruto.map(x => Math.round(x));
  let dif = alvo - pr.reduce((a, b) => a + b, 0);
  if (dif && pr.length) {
    // a diferença de arredondamento vai para as parcelas com maior resto (nunca para contas exatas, se houver outra)
    const ordem = pr.map((_, i) => i).sort((a, b) => dif > 0 ? (bruto[b] - pr[b]) - (bruto[a] - pr[a]) : (bruto[a] - pr[a]) - (bruto[b] - pr[b]));
    let k = 0;
    while (dif !== 0 && k < 10 * pr.length) { const i = ordem[k % ordem.length]; const d = dif > 0 ? 1 : -1; pr[i] += d; dif -= d; k++; }
  }
  return { partes: pr.map(x => x / f), total: alvo / f };
}
function fxUnid(un, q) {
  const u = FX_UNID[un];
  if (!u) return { q: un || '', p: '' };
  const sing = Math.abs(q) <= 1 + 1e-9 || (un === 'FTE-ano' && Math.abs(q) < 2);
  return { q: u.q[sing ? 0 : 1], p: u.p };
}

// ----------------------------------------------------------- linhas de um ano
// Monta a conta de uma linha do motor no ano t. e = valor na conta econômica (preços do Ano 0).
// Itens cotados em dólar (moeda USD) mostram o preço de contrato do ano e "÷ (1 + inflação)^t".
function fxContaLinha(l, t, ctx) {
  const e = l.eco[t];
  const defl = ctx.defl[t];
  const out = { nome: fxT(l.nome), id: l.id, s: l.s, k: l.k, tipo: l.nat, tipoTxt: fxT(FX_TIPO[l.nat] || FX_TIPO.D), valor: e, qtd: null, unid: '', preco: null, divisor: 1, base: null, fator: null, fixo: false };
  // fonte das quantidades: a própria linha ou, para o que é cedido sem custo, a linha de origem
  let src = l;
  if (!(l.q && l.q[t] > 0)) {
    if (l.tag === 'doado' && l.s === 'K2.1') src = ctx.linhas.find(x => x.tag === 'licenca') || l;
    else if (String(l.id || '').startsWith('cedido: ')) src = ctx.linhas.find(x => x.id === String(l.id).slice(8)) || l;
  }
  const q = src.q ? src.q[t] : 0;
  if (src !== l && l.tag === 'doado' && l.s !== 'K2.1') out.nome = fxT('Uso cedido sem custo') + ': ' + fxT(src.nome);
  if (q > 0) {
    out.qtd = q; out.unid = l.un || src.un;
    if (l.moeda === 'USD' && Math.abs(defl - 1) > 1e-12) { out.preco = e * defl / q; out.divisor = defl; }
    else out.preco = e / q;
    return out;
  }
  // manutenção: percentual da implantação
  if (l.tag === 'manutencao') {
    const im = (ctx.r.impl || []).find(x => (x.nomeManut || ('Manutenção: ' + String(x.nome).toLowerCase())) === l.nome);
    if (im && im.manutPct > 0) { out.base = e / im.manutPct; out.fator = im.manutPct; out.fatorTxt = 'da implantação'; out.pctFator = true; return out; }
  }
  // implantação e itens escalados pelo nível de adaptação (passo 2.3.4)
  const fa = typeof fatorAdapt === 'function' ? fatorAdapt(ctx.cfg, l.s) : 1;
  const prob = l.prob != null ? +l.prob : 1;
  const sig = l.nat === 'C' ? (ctx.o.sigmaCap != null ? ctx.o.sigmaCap : 1) : 1;
  if ((l.tag === 'implantacao' || ['K3.1', 'K3.2'].includes(l.s)) && Math.abs(fa - 1) > 1e-9 && fa > 0) {
    out.base = e / fa; out.fator = fa; out.fatorTxt = 'nível de adaptação, passo 2.3.4'; return out;
  }
  if (Math.abs(prob - 1) > 1e-9 && prob > 0) { out.base = e / prob; out.fator = prob; out.fatorTxt = 'probabilidade'; out.pctFator = true; return out; }
  if (l.moeda === 'USD' && Math.abs(defl - 1) > 1e-12) { out.base = e * defl; out.divisor = defl; out.fixo = true; return out; }
  out.fixo = true; out.base = e;
  return out;
}
// texto "quantidade × preço = valor" (valor já arredondado para fechar a soma)
function fxTexto(x, valorMostrado) {
  const v = fxDin(valorMostrado != null ? valorMostrado : x.valor);
  const div = x.divisor && Math.abs(x.divisor - 1) > 1e-12 ? ' ÷ ' + fxFator(x.divisor) : '';
  if (x.qtd != null) {
    const u = fxUnid(x.unid, x.qtd);
    return fxQtd(x.qtd) + ' ' + fxT(u.q) + ' × ' + fxPreco(x.preco) + (u.p ? ' ' + fxT(u.p) : '') + div + ' = ' + v;
  }
  if (x.fator != null) {
    const f = x.pctFator ? fxPct(x.fator) : fxFator(x.fator);
    return fxDin(x.base) + ' × ' + f + ' (' + fxT(x.fatorTxt) + ')' + div + ' = ' + v;
  }
  if (div) return fxT(FX_FIXO) + ' ' + fxDin(x.base) + div + ' = ' + v;
  return fxT(FX_FIXO) + ' ' + v;
}
// parte da conta antes do "=" (a coluna de valor mostra o resultado); valor fixo: só a etiqueta
function fxConta(x) {
  if (x.fixo && !(x.divisor && Math.abs(x.divisor - 1) > 1e-12)) return fxT(FX_FIXO).replace(/\s*:$/, '');
  const t = fxTexto(x, x.mostrado); const i = t.lastIndexOf(' = ');
  return i > 0 ? t.slice(0, i) : t;
}

// Seleciona as maiores linhas até cobrir 90% e agrupa o resto
function fxSelecionar(itens, total) {
  const pos = itens.filter(x => Math.abs(x.valor) > 1e-9).sort((a, b) => b.valor - a.valor);
  const mostrar = []; let acc = 0;
  for (const x of pos) {
    if (total > 0 && acc >= FX_LIMIAR * total - 1e-9) break;
    mostrar.push(x); acc += x.valor;
  }
  let resto = pos.slice(mostrar.length);
  if (resto.length === 1) { mostrar.push(resto[0]); resto = []; }
  return { mostrar, resto };
}

// ----------------------------------------------------------- saída
function fxContaSaida(x, ctx) {
  const o = ctx.o, H = ctx.H, defl = ctx.defl[H];
  const sig = x.nat === 'C' ? (o.sigmaCap != null ? o.sigmaCap : 1) : 1;
  const e = x.valor / defl * sig;                    // preços do Ano 0, antes da probabilidade de saída e do desconto
  const out = { nome: fxT(x.nome), s: x.s, k: x.k, tipo: x.nat, tipoTxt: fxT(FX_TIPO[x.nat] || FX_TIPO.D), valor: e, qtd: null, unid: '', preco: null, divisor: 1, base: null, fator: null, fixo: false };
  const sa = ctx.cfg.saida || {};
  const usd = x.moeda === 'USD' && Math.abs(defl - 1) > 1e-12;
  if (/^Reconstrução/.test(x.nome) && ctx.r.impl && ctx.r.impl[0] && sa.reconstrucaoPct > 0) {
    out.base = e / sa.reconstrucaoPct; out.fator = sa.reconstrucaoPct; out.fatorTxt = 'da implantação'; out.pctFator = true; return out;
  }
  if (/^Operação paralela/.test(x.nome) && sa.mesesParalelo > 0) {
    out.qtd = sa.mesesParalelo; out.unid = 'mês';
    if (usd) { out.preco = x.valor * sig / out.qtd; out.divisor = defl; } else out.preco = e / out.qtd;
    return out;
  }
  if (/^Tempo de retreinamento/.test(x.nome) && ctx.r.U[H] > 0) { out.qtd = ctx.r.U[H]; out.unid = 'pessoa'; out.preco = e / out.qtd; return out; }
  if (/^Tempo interno/.test(x.nome) && (sa.internos || []).length) {
    const fte = sa.internos.reduce((s, [, f]) => s + (+f || 0), 0);
    if (fte > 0) { out.qtd = fte; out.unid = 'FTE-ano'; out.preco = e / fte; return out; }
  }
  if (usd) { out.base = x.valor * sig; out.divisor = defl; out.fixo = true; return out; }
  out.fixo = true; out.base = e;
  return out;
}

// ----------------------------------------------------------- dados
function explicacaoCusto(cfgIn) {
  const cfg = cfgIn || (typeof cfgAtual === 'function' ? cfgAtual() : null);
  if (!cfg) return null;
  if (typeof garantirOpc === 'function' && !cfgIn) garantirOpc(cfg);
  const r = calcular(cfg), av = avaliar(r), o = r.opc, H = r.H, T = r.anos;
  const disc = av.disc, defl = av.defl;
  const ctx = { cfg, r, av, o, H, defl, linhas: r.linhas };
  const comDesconto = T.some(t => Math.abs(disc[t] - 1) > 1e-12);
  const arq = typeof arquitetura === 'function' ? arquitetura(cfg) : 'outra';

  // 1. fórmula geral
  const anoVP = T.map(t => av.ecoAno[t] * disc[t]);
  const teste = anoVP[0];
  const usoAnos = T.slice(1).map(t => anoVP[t]);
  const uso = usoAnos.reduce((a, b) => a + b, 0);
  const saida = av.saidaEco;
  const residual = av.vr || 0;
  const total = av.ctEco;
  const termos = [
    { id: 'teste', rotulo: fxT('Custo do teste'), quando: fxT('Ano 0'), valor: teste },
    { id: 'uso', rotulo: fxT('Custo de uso'), quando: fxT(H === 1 ? 'Ano 1' : 'Anos 1 a ' + H), valor: uso, anos: T.slice(1).map(t => ({ t, rotulo: fxT('Ano ' + t), valor: anoVP[t] })) },
    { id: 'saida', rotulo: fxT('Custo de saída'), quando: fxT('fim do Ano ' + H), valor: saida },
  ];
  if (residual > 1e-9) termos.push({ id: 'residual', sinal: -1, rotulo: fxT('Valor que ainda resta da implantação'), quando: fxT('fim do Ano ' + H), valor: residual });
  const fech = fxFechar(termos.map(x => (x.sinal || 1) * x.valor), total);
  termos.forEach((x, i) => { x.mostrado = Math.abs(fech.partes[i]); });
  const usoT = termos[1];
  if (usoT.anos.length) { const fu = fxFechar(usoT.anos.map(a => a.valor), usoT.mostrado); usoT.anos.forEach((a, i) => { a.mostrado = fu.partes[i]; }); }
  const sinal = x => (x.sinal === -1 ? ' − ' : ' + ');
  const formula = {
    total, totalMostrado: fech.total, termos, comDesconto, taxa: o.r,
    texto: fxT('Custo total do ciclo de vida') + ' = ' + termos.map((x, i) => (i ? sinal(x) : '') + x.rotulo.toLowerCase() + ' (' + x.quando + ')').join(''),
    numeros: fxDin(fech.total) + ' = ' + termos.map((x, i) => (i ? sinal(x) : '') + fxDin(x.mostrado)).join(''),
    usoTexto: usoT.anos.length > 1 ? usoT.rotulo + ' = ' + usoT.anos.map(a => a.rotulo + ' ' + fxDin(a.mostrado)).join(' + ') : '',
    notaVP: comDesconto ? fxT('Valores trazidos a valor presente, com taxa de desconto de ' + fxPct(o.r) + ' ao ano: cada ano é dividido por (1 + taxa) elevado ao número do ano.') : '',
  };

  // 2. linhas por ano
  const anos = T.map(t => {
    const itens = av.linhas.map(l => fxContaLinha(l, t, ctx)).filter(x => Math.abs(x.valor) > 1e-9);
    const soma = av.ecoAno[t];
    const { mostrar, resto } = fxSelecionar(itens, soma);
    const outrosV = resto.reduce((s, x) => s + x.valor, 0);
    const partes = mostrar.map(x => x.valor).concat(resto.length ? [outrosV] : []);
    const fA = fxFechar(partes, soma);
    mostrar.forEach((x, i) => { x.mostrado = fA.partes[i]; x.texto = fxTexto(x, x.mostrado); x.conta = fxConta(x); });
    const fR = fxFechar(resto.map(x => x.valor), resto.length ? fA.partes[fA.partes.length - 1] : 0);
    resto.forEach((x, i) => { x.mostrado = fR.partes[i]; x.texto = fxTexto(x, x.mostrado); x.conta = fxConta(x); });
    const outros = resto.length ? { n: resto.length, rotulo: fxT('Outros itens (' + resto.length + ')'), valor: outrosV, mostrado: fA.partes[fA.partes.length - 1], itens: resto } : null;
    return {
      t, id: String(t), rotulo: fxT('Ano ' + t), sub: fxT(t === 0 ? 'teste' : 'uso'), linhas: mostrar, outros, soma, somaMostrada: fA.total,
      fatorVP: disc[t], total: soma * disc[t], totalMostrado: t === 0 ? termos[0].mostrado : usoT.anos[t - 1].mostrado,
      cobertura: soma ? mostrar.reduce((s, x) => s + x.valor, 0) / soma : 1,
    };
  });
  // saída
  const sItens = r.saida.map(x => fxContaSaida(x, ctx)).filter(x => Math.abs(x.valor) > 1e-9);
  const fechou = o.fechamento === 'continuidade';
  const sSoma = fechou ? 0 : sItens.reduce((s, x) => s + x.valor, 0);
  const pS = fechou ? 1 : (o.pSaida != null ? o.pSaida : 1);
  const sSel = fechou ? { mostrar: [], resto: [] } : fxSelecionar(sItens, sSoma);
  const sOutV = sSel.resto.reduce((s, x) => s + x.valor, 0);
  const sF = fxFechar(sSel.mostrar.map(x => x.valor).concat(sSel.resto.length ? [sOutV] : []), sSoma);
  sSel.mostrar.forEach((x, i) => { x.mostrado = sF.partes[i]; x.texto = fxTexto(x, x.mostrado); x.conta = fxConta(x); });
  const sR = fxFechar(sSel.resto.map(x => x.valor), sSel.resto.length ? sF.partes[sF.partes.length - 1] : 0);
  sSel.resto.forEach((x, i) => { x.mostrado = sR.partes[i]; x.texto = fxTexto(x, x.mostrado); x.conta = fxConta(x); });
  anos.push({
    t: 'saida', id: 'saida', rotulo: fxT('Saída'), sub: fxT('fim do Ano ' + H), linhas: sSel.mostrar,
    outros: sSel.resto.length ? { n: sSel.resto.length, rotulo: fxT('Outros itens (' + sSel.resto.length + ')'), valor: sOutV, mostrado: sF.partes[sF.partes.length - 1], itens: sSel.resto } : null,
    soma: sSoma, somaMostrada: sF.total, pSaida: pS, fatorVP: disc[H], total: saida, totalMostrado: termos[2].mostrado, continuidade: fechou, residual,
  });

  // 3. de onde vêm os números
  const origem = fxOrigem(ctx, arq);
  // 4. leitura
  const leitura = fxLeitura(ctx, av, arq);
  return { H, arq, formula, anos, origem, leitura, nota: fxT('Valores ilustrativos. Mude as premissas na calculadora completa.'), defl, disc };
}

// ----------------------------------------------------------- de onde vêm os números
function fxOrigem(ctx, arq) {
  const { cfg, r, av, o, H } = ctx;
  const d = cfg.demanda || {}, L = [];
  const t1 = Math.min(1, H);
  const E = r.E, U = r.U;
  // pessoas e adoção
  const iguais = E.slice(1).every(x => x === E[1]);
  if (iguais) L.push(fxT('Pessoas que poderiam usar: ' + fxQtd(E[0]) + ' no teste (Ano 0) e ' + fxQtd(E[1]) + ' a partir do Ano 1.'));
  else L.push(fxT('Pessoas que poderiam usar:') + ' ' + [fxT(fxQtd(E[0]) + ' no teste (Ano 0)')].concat(r.anos.slice(1).map(t => fxT('Ano ' + t + ': ' + fxQtd(E[t])))).join('; ') + '.');
  L.push(fxT('Nem todas usam. Adoção (parte que de fato usa):') + ' ' + r.anos.map(t => fxT('Ano ' + t + ': ' + fxPct(fxAno(d.adocao, t)))).join('; ') + '.');
  L.push(fxT('Usuários ativos no Ano ' + t1 + ': ' + fxQtd(E[t1]) + ' pessoas × ' + fxPct(fxAno(d.adocao, t1)) + ' = ' + fxQtd(U[t1]) + '.'));
  // licenças
  if (arq === 'saas' && cfg.saas && cfg.saas.ativo) {
    const s = cfg.saas, q = fxAno(s.qtd, t1), m = fxAno(s.mesesCobr, t1);
    L.push(fxT('Licenças no Ano ' + t1 + ': ' + fxQtd(q) + ' licenças × ' + fxQtd(m) + ' meses = ' + fxQtd(q * m) + ' licenças-mês (uma licença-mês é uma licença paga durante um mês).'));
    if (Math.abs(q - E[t1]) < 0.5 && U[t1] < E[t1]) L.push(fxT('A licença institucional é paga para todas as pessoas que poderiam usar, não só para as que usam.'));
    else if (s.fatorNominal && Math.abs(q - Math.ceil(U[t1] * s.fatorNominal)) < 0.5) L.push(fxT('Licenças por usuário: usuários ativos + ' + fxPct(s.fatorNominal - 1, 0) + ' de folga.'));
    if (+s.preco > 0) L.push(fxT('Preço da licença:') + ' ' + fxPreco(s.preco) + ' ' + fxT('por licença por mês no Ano 1, com reajuste de ' + fxPct(s.reajuste) + ' ao ano.'));
    else L.push(fxT('Licença incluída em contrato existente, sem preço adicional.'));
    if (fxAno(s.fatorPreco, 0) === 0 && +s.preco > 0) L.push(fxT('No Ano 0 as licenças são cedidas sem custo: entram pelo valor de mercado, como cedidas.'));
  }
  // consumo do modelo
  if ((arq === 'api' || arq === 'ow') && +d.s > 0) {
    const m = fxAno(d.meses, t1);
    L.push(fxT('Interações no Ano ' + t1 + ': ' + fxQtd(U[t1]) + ' usuários ativos × ' + fxNum(d.s) + ' sessões por mês × ' + fxNum(d.i) + ' interações por sessão × ' + fxQtd(m) + ' meses = ' + fxQtd(r.I[t1]) + '.'));
  }
  if (arq === 'api' && cfg.api && r.extra.cMain != null) {
    const a = cfg.api;
    L.push(fxT('Custo de uma interação com o modelo:') + ' ' + fxPreco(r.extra.cMain) + ' (' + fxT(fxNum(a.k) + ' chamadas por interação, com ' + fxQtd(a.Tin) + ' tokens de entrada e ' + fxQtd(a.Tout) + ' de saída por chamada') + '; ' + fxT('preço por milhão de tokens de entrada e de saída:') + ' ' + fxPreco(a.Pin) + ' / ' + fxPreco(a.Pout) + ').');
    L.push(fxT('Tokens são os pedaços de texto que o modelo lê e escreve; o fornecedor cobra por milhão de tokens.'));
  }
  if (arq === 'ow' && cfg.ow && r.extra.G) {
    const ow = cfg.ow;
    L.push(fxT('Servidores com GPU no Ano ' + t1 + ': ' + fxQtd(r.extra.G[t1]) + ' nas horas de pico e ' + fxQtd(ow.minFora) + ' no resto do tempo = ' + fxQtd(r.extra.horasGpu[t1]) + ' horas.') + ' ' + fxT('Preço da hora de GPU:') + ' ' + fxPreco(ow.Pgpu) + '.');
  }
  // tempo das equipes
  const fte = av.linhas.filter(l => l.un === 'FTE-ano' && l.q && l.q[t1] > 0 && l.eco[t1] > 0).sort((a, b) => b.eco[t1] - a.eco[t1])[0];
  if (fte) {
    const q = fte.q[t1], p = fte.eco[t1] / q;
    L.push(fxT('Tempo das equipes: cada função é uma fração de uma pessoa em tempo integral × o custo anual dessa pessoa.') + ' ' + fxT('Exemplo:') + ' ' + fxT(fte.nome) + ', ' + fxQtd(q) + ' ' + fxT(fxUnid('FTE-ano', q).q) + ' (' + fxT(fxPct(q, 0) + ' do tempo de uma pessoa') + ') × ' + fxPreco(p) + ' = ' + fxDin(q * p) + '.');
  }
  if (av.linhas.some(l => l.nat === 'C' && l.ecoVP > 0)) L.push(fxT('Tempo da equipe interna: pessoas que a rede já paga. Não é gasto novo, mas entra no custo, porque esse tempo deixa de ir para outras tarefas.'));
  // formação
  if (cfg.formacaoTempo && cfg.formacaoTempo.ativo) {
    const f = cfg.formacaoTempo, cp = f.horas * f.custoHora;
    if (f.modo === 'razao') L.push(fxT('Pessoas formadas: 1 para cada ' + fxQtd(f.razao) + ' pessoas que poderiam usar.'));
    else L.push(fxT('Pessoas formadas a cada ano: os novos usuários ativos, mais ' + fxPct(f.rot, 0) + ' dos já formados (quem sai e é substituído).'));
    L.push(fxT('Custo por pessoa formada:') + ' ' + fxT(fxNum(f.horas) + ' horas') + ' × ' + fxPreco(f.custoHora) + ' ' + fxT('por hora') + ' = ' + fxPreco(cp) + '.');
  }
  // suporte
  if (cfg.suporte && cfg.suporte.ativo && (cfg.suporte.faixas || []).length) {
    const s = cfg.suporte, fx0 = s.faixas[0];
    L.push(fxT('Suporte: ' + fxQtd(fx0[1]) + ' pessoa em tempo integral até ' + fxQtd(fx0[0]) + ' usuários ativos; ' + fxQtd(s.acima) + ' acima disso.'));
  }
  // implantação e adaptação
  const im = (cfg.implantacao || [])[0];
  if (im) {
    const fa = typeof fatorAdapt === 'function' ? fatorAdapt(cfg, im.s || 'K3.1') : 1;
    L.push(fxT('Implantação (Ano 0):') + ' ' + fxDin(im.valor) + ' ' + fxT('no exemplo do guia') + ' × ' + fxFator(fa) + ' (' + fxT('nível de adaptação, passo 2.3.4') + ') = ' + fxDin(im.valor * fa) + '.' + (im.manutPct > 0 ? ' ' + fxT('Manutenção: ' + fxPct(im.manutPct, 0) + ' desse valor por ano.') : ''));
  }
  // serviços mensais
  (cfg.mensais || []).slice(0, 3).forEach(x => L.push(fxT(x.nome) + ': ' + fxPreco(x.valor) + ' ' + fxT('por mês') + '.'));
  // preços do Ano 0 e desconto
  if (o.correcoes && o.pi > 0) {
    const temUSD = av.linhas.some(l => l.moeda === 'USD' && r.anos.some(t => t > 0 && Math.abs(l.eco[t]) > 1e-9));
    L.push(fxT('Todos os valores estão em preços do Ano 0: a ferramenta retira a inflação ilustrativa de ' + fxPct(o.pi) + ' ao ano.') +
      (temUSD ? ' ' + fxT('Itens pagos em dólar (licenças, uso do modelo, nuvem) usam o preço de contrato de cada ano, dividido pela inflação acumulada:') + ' ' +
        r.anos.slice(1, 3).map(t => fxT('÷ ' + fxFator(ctx.defl[t]) + ' no Ano ' + t)).join(', ') + '.' : ''));
  }
  if (o.r > 0) L.push(fxT('Taxa de desconto de ' + fxPct(o.r) + ' ao ano: um valor pago mais tarde pesa menos no total (valor presente).'));
  if ((av.fac || {}).doado > 0) L.push(fxT('O que é cedido sem custo (doação, piloto gratuito) entra pelo valor de mercado: gratuito para a rede não quer dizer sem custo.'));
  // origem dos preços
  const orig = ({ A: 'saas', B: 'api', C: 'ow' })[cfg.origem] || arq;
  const FX_ORIG = { saas: 'Exemplo A do guia (cap. 12): produto pronto por licença', api: 'Exemplo B do guia (cap. 12): aplicação com modelo por API e base de conhecimento', ow: 'Exemplo C do guia (cap. 12): modelo de pesos abertos em infraestrutura contratada' };
  const origPT = (typeof PRESET_ARQ !== 'undefined' && PRESET_ARQ[orig]) || FX_ORIG[orig];
  const origTxt = origPT ? fxT(origPT) : '';
  L.push(fxT('Preços e quantidades de partida:') + ' ' + (origTxt ? origTxt + ', ' : '') + fxT('ajustados às suas respostas. São ilustrativos.'));
  return L;
}

// ----------------------------------------------------------- leitura
function fxLeitura(ctx, av, arq) {
  const { cfg } = ctx;
  const L = [];
  const total = av.ctEco;
  // 1. o que mais pesa
  let pesa = '';
  try {
    if (typeof somaPorCamada === 'function' && typeof CAMADAS !== 'undefined') {
      const cam = somaPorCamada(av);
      const [k, nome] = CAMADAS.slice().sort((a, b) => (cam.total[b[0]] || 0) - (cam.total[a[0]] || 0))[0];
      pesa = fxT('O que mais pesa: a camada ' + k + ',') + ' ' + fxT(nome) + ' (' + fxT(fxPct(total ? cam.total[k] / total : 0, 0) + ' do custo total') + ').';
    }
  } catch (e) { pesa = ''; }
  const porNome = {};
  av.linhas.forEach(l => { if (l.ecoVP > 0) porNome[l.nome] = (porNome[l.nome] || 0) + l.ecoVP; });
  const maior = Object.keys(porNome).sort((a, b) => porNome[b] - porNome[a])[0];
  if (maior) pesa = (pesa ? pesa + ' ' + fxT('A maior linha é') : fxT('O que mais pesa: a maior linha é')) + ' ' + fxT(maior) + ': ' + fxGrande(porNome[maior]) + ' ' + fxT('no ciclo') + ' (' + fxPct(total ? porNome[maior] / total : 0, 0) + ').';
  if (pesa) L.push(pesa);
  // 2. o que mais muda o custo: +10% em cada direcionador
  const dr = fxDirecionadores(cfg, arq, total);
  if (dr.length) L.push(fxT('O que mais muda o custo, com 10% a mais em cada premissa:') + ' ' + dr.map(x => fxT(x.nome) + ' +' + fxGrande(x.delta) + ' (+' + fxPct(total ? x.delta / total : 0) + ')').join('; ') + '. ' + fxT('O nível de adaptação (passo 2.3.4) muda sobretudo o custo do Ano 0.'));
  // 3. onde editar
  L.push(fxT('Para mudar uma premissa (preço, quantidade, equipe ou item), abra a calculadora completa, logo abaixo. As respostas dos passos 2.3 e 3.1 também mudam estes números.'));
  return L;
}
function fxDirecionadores(cfg, arq, base) {
  if (typeof clone !== 'function') return [];
  const H = (typeof opcoes === 'function' ? opcoes(cfg) : cfg.opc || {}).H || 3;
  const tot = c => { try { return avaliar(calcular(c)).ctEco; } catch (e) { return base; } };
  const out = [];
  const add = (nome, f) => { const c = clone(cfg); f(c); const d = tot(c) - base; if (Number.isFinite(d) && Math.abs(d) > 1e-6) out.push({ nome, delta: d }); };
  const anos = Array.from({ length: H + 1 }, (_, t) => t);
  add('número de pessoas que poderiam usar (passo 3.1.1)', c => {
    c.demanda.E = anos.map(t => t === 0 ? fxAno(cfg.demanda.E, 0) : fxAno(cfg.demanda.E, t) * 1.1);
    if (c.saas && c.saas.ativo) c.saas.qtd = anos.map(t => t === 0 ? fxAno(cfg.saas.qtd, 0) : fxAno(cfg.saas.qtd, t) * 1.1);
  });
  add('adoção', c => {
    c.demanda.adocao = anos.map(t => t === 0 ? fxAno(cfg.demanda.adocao, 0) : Math.min(1, fxAno(cfg.demanda.adocao, t) * 1.1));
    if (c.saas && c.saas.ativo && cfg.saas.fatorNominal && anos.slice(1).every(t => Math.abs(fxAno(cfg.saas.qtd, t) - Math.ceil(fxAno(cfg.demanda.E, t) * fxAno(cfg.demanda.adocao, t) * cfg.saas.fatorNominal)) < 0.5))
      c.saas.qtd = anos.map(t => t === 0 ? fxAno(cfg.saas.qtd, 0) : Math.ceil(fxAno(cfg.demanda.E, t) * Math.min(1, fxAno(cfg.demanda.adocao, t) * 1.1) * cfg.saas.fatorNominal));
  });
  if (arq === 'saas' && cfg.saas && +cfg.saas.preco > 0) add('preço da licença', c => { c.saas.preco *= 1.1; });
  if (arq === 'api') add('preço por token', c => { c.mult = Object.assign({ fx: 1, pessoas: 1, preco: 1 }, c.mult || {}); c.mult.preco *= 1.1; });
  if (arq === 'ow') add('preço da hora de GPU', c => { c.mult = Object.assign({ fx: 1, pessoas: 1, preco: 1 }, c.mult || {}); c.mult.preco *= 1.1; });
  add('custo das equipes (salários)', c => { c.mult = Object.assign({ fx: 1, pessoas: 1, preco: 1 }, c.mult || {}); c.mult.pessoas *= 1.1; });
  out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return out.slice(0, 3);
}

// ----------------------------------------------------------- HTML (passo 3.3)
const CSS_FORMULA = `
.fx{background:#fff;border:1px solid var(--line,#DDE3E9);border-radius:6px;padding:18px 20px;margin:4px 0 18px;min-width:0}
.fx h3.fx-h{margin:0 0 4px;font-size:1.25rem;color:var(--head,#0C2D4D)}
.fx .fx-intro{margin:0 0 14px;color:var(--ink-2,#36424E);font-size:1rem}
.fx-eq{display:flex;flex-wrap:wrap;align-items:stretch;gap:8px;margin:0 0 6px}
.fx-t{flex:1 1 150px;min-width:0;border:1px solid var(--line,#DDE3E9);border-top:5px solid var(--f2,#5FA8E3);border-radius:6px;padding:10px 12px;background:#fff;display:flex;flex-direction:column;gap:2px}
.fx-t.fx-total{border-top-color:var(--head,#0C2D4D);background:var(--f3-tint,#E3EDF7)}
.fx-t.fx-teste{border-top-color:var(--f1,#A9D4F5)}
.fx-t.fx-uso{border-top-color:var(--f2,#5FA8E3)}
.fx-t.fx-saida,.fx-t.fx-residual{border-top-color:var(--f3,#1F6FB8)}
.fx-t .fx-v{font-size:1.5rem;font-weight:700;color:var(--head,#0C2D4D);line-height:1.15;overflow-wrap:anywhere}
.fx-t .fx-l{font-weight:700;font-size:.95rem;color:var(--ink,#17212B)}
.fx-t .fx-q{font-size:.88rem;color:var(--muted,#586674)}
.fx-t .fx-x{font-size:.88rem;color:var(--ink-2,#36424E);font-variant-numeric:tabular-nums}
.fx-op{align-self:center;font-size:1.6rem;font-weight:700;color:var(--muted,#586674);padding:0 2px}
.fx .fx-uso-anos,.fx .fx-vp{font-size:.92rem;color:var(--ink-2,#36424E);margin:4px 0 0}
.fx h4{font-size:1.05rem;margin:18px 0 8px;color:var(--head,#0C2D4D)}
.fx-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}
.fx-tabs button{font:inherit;font-size:.95rem;border:1px solid var(--line-2,#C3CDD7);background:#fff;color:var(--ink,#17212B);border-radius:4px;padding:6px 12px;cursor:pointer;min-height:36px}
.fx-tabs button small{font-size:.86rem;color:var(--muted,#586674);margin-left:4px}
.fx-tabs button[aria-selected="true"]{background:var(--f3,#1F6FB8);border-color:var(--f3,#1F6FB8);color:#fff}
.fx-tabs button[aria-selected="true"] small{color:#fff}
.fx-tabs button:focus-visible{outline:2px solid var(--focus,#0A7EA3);outline-offset:2px}
.fx-painel{border:1px solid var(--line,#DDE3E9);border-radius:6px;padding:4px 0;background:#fff}
.fx-painel .fx-cab{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 12px;padding:8px 14px;border-bottom:1px solid var(--line,#DDE3E9);font-size:.92rem;color:var(--muted,#586674)}
.fx-li{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1.9fr) auto;gap:4px 16px;align-items:baseline;padding:9px 14px;border-bottom:1px solid var(--line,#DDE3E9);font-size:.95rem}
.fx-li .fx-n{font-weight:600;color:var(--ink,#17212B);overflow-wrap:anywhere}
.fx-li .fx-tp{display:inline-block;font-size:.86rem;font-weight:400;color:var(--muted,#586674);margin-left:6px}
.fx-li .fx-c{color:var(--ink-2,#36424E);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.fx-li .fx-r{font-weight:700;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums;color:var(--ink,#17212B)}
.fx-li.fx-sub .fx-n,.fx-li.fx-sub .fx-r{font-weight:600;color:var(--ink-2,#36424E)}
.fx-li.fx-tot{border-bottom:0;background:var(--f3-tint,#E3EDF7)}
.fx-li.fx-tot .fx-n,.fx-li.fx-tot .fx-r{font-weight:700;color:var(--head,#0C2D4D)}
.fx-outros>summary{list-style:none;cursor:pointer}
.fx-outros>summary:focus-visible{outline:2px solid var(--focus,#0A7EA3);outline-offset:-2px}
.fx-outros>summary::-webkit-details-marker{display:none}
.fx-outros>summary .fx-n::before{content:"▸ ";color:var(--muted,#586674)}
.fx-outros[open]>summary .fx-n::before{content:"▾ "}
.fx-outros>.fx-li{background:var(--surface-3,#F7F9FB);padding-left:28px}
.fx small{font-size:.86rem}
.fx-origem ul{margin:0;padding-left:20px;column-count:2;column-gap:32px}
.fx-origem li{margin:0 0 6px;font-size:.95rem;line-height:1.45;break-inside:avoid}
.fx-leitura{margin:16px 0 0;border:1px solid var(--line,#DDE3E9);border-left:5px solid var(--f3,#1F6FB8);border-radius:6px;padding:4px 16px 10px;background:var(--f3-tint,#E3EDF7)}
.fx-leitura h4{margin-top:10px}
.fx-leitura ul{margin:0;padding-left:20px}
.fx-leitura li{margin:0 0 6px;font-size:.95rem;line-height:1.45}
.fx .fx-nota{font-size:.9rem;color:var(--muted,#586674);margin:12px 0 0}
@media (max-width:760px){.fx-origem ul{column-count:1}}
@media (max-width:640px){
 .fx{padding:14px 12px}
 .fx-eq{flex-direction:column;gap:4px}
 .fx-t{flex:1 1 auto;padding:8px 10px}
 .fx-t .fx-v{font-size:1.3rem}
 .fx-op{align-self:flex-start;padding-left:12px;font-size:1.3rem;line-height:1}
 .fx-li{grid-template-columns:minmax(0,1fr);gap:2px;padding:9px 12px}
 .fx-li .fx-r{text-align:left;white-space:normal}
 .fx-outros>.fx-li{padding-left:20px}
}`;
function fxCss() {
  if (typeof document === 'undefined' || document.getElementById('css-formula')) return;
  const st = document.createElement('style'); st.id = 'css-formula'; st.textContent = CSS_FORMULA; document.head.appendChild(st);
}
function fxAnoSel(ex) {
  const ids = ex.anos.map(a => a.id);
  const s = typeof S !== 'undefined' && S && S.formulaAno != null ? String(S.formulaAno) : '';
  if (ids.includes(s)) return s;
  return ex.H >= 1 ? '1' : '0';
}
function fxLinhaHtml(x, cls, tag) {
  tag = tag || 'div';
  const div = x.divisor && Math.abs(x.divisor - 1) > 1e-12;
  return `<${tag} class="fx-li${cls ? ' ' + cls : ''}"><span class="fx-n">${fxEsc(x.nome)}${x.tipoTxt ? `<span class="fx-tp">· ${fxEsc(x.tipoTxt)}</span>` : ''}</span><span class="fx-c">${fxEsc(x.conta)}${div ? ` <small>(${fxEsc(fxT('preços do Ano 0'))})</small>` : ''}</span><span class="fx-r">${x.fixo && !div ? '' : '= '}${fxEsc(fxDin(x.mostrado))}</span></${tag}>`;
}
function fxPainel(a, ex) {
  const H = ex.H;
  const linhas = a.linhas.map(x => fxLinhaHtml(x)).join('');
  const outros = a.outros ? `<details class="fx-outros">${fxLinhaHtml({ nome: a.outros.rotulo, tipoTxt: fxT('clique para ver'), conta: fxT('itens menores, somados'), mostrado: a.outros.mostrado, fixo: false }, '', 'summary')}${a.outros.itens.map(x => fxLinhaHtml(x)).join('')}</details>` : '';
  let pe = '';
  if (a.id === 'saida') {
    if (a.continuidade) {
      pe = `<div class="fx-li fx-tot"><span class="fx-n">${fxEsc(fxT('A estimativa supõe que a rede continua com a solução: não há custo de saída.'))}</span><span class="fx-c">${a.residual > 0 ? fxEsc(fxT('Desconta-se o valor que ainda resta da implantação:')) + ' − ' + fxEsc(fxDin(a.residual)) : ''}</span><span class="fx-r">${fxEsc(fxDin(0))}</span></div>`;
    } else {
      const ajustes = [];
      if (Math.abs(a.pSaida - 1) > 1e-9) ajustes.push('× ' + fxPct(a.pSaida, 0) + ' (' + fxT('probabilidade de trocar de solução') + ')');
      if (Math.abs(a.fatorVP - 1) > 1e-12) ajustes.push('÷ ' + fxFator(1 / a.fatorVP) + ' (' + fxT('valor presente') + ')');
      if (ajustes.length) pe += `<div class="fx-li fx-sub"><span class="fx-n">${fxEsc(fxT('Soma das contas'))}</span><span class="fx-c">${fxEsc(ajustes.join(' '))}</span><span class="fx-r">${fxEsc(fxDin(a.somaMostrada))}</span></div>`;
      pe += `<div class="fx-li fx-tot"><span class="fx-n">${fxEsc(fxT('Custo de saída'))}</span><span class="fx-c">${fxEsc(fxT('fim do Ano ' + H))}</span><span class="fx-r">= ${fxEsc(fxDin(a.totalMostrado))}</span></div>`;
    }
  } else {
    if (Math.abs(a.fatorVP - 1) > 1e-12) pe += `<div class="fx-li fx-sub"><span class="fx-n">${fxEsc(fxT('Soma das contas'))}</span><span class="fx-c">÷ ${fxEsc(fxFator(1 / a.fatorVP))} (${fxEsc(fxT('valor presente'))})</span><span class="fx-r">${fxEsc(fxDin(a.somaMostrada))}</span></div>`;
    pe += `<div class="fx-li fx-tot"><span class="fx-n">${fxEsc(fxT('Total do ' + (a.t === 0 ? 'Ano 0' : 'Ano ' + a.t)))}</span><span class="fx-c">${fxEsc(a.t === 0 ? fxT('custo do teste') : fxT('parte do custo de uso'))}</span><span class="fx-r">= ${fxEsc(fxDin(a.totalMostrado))}</span></div>`;
  }
  const cab = a.linhas.length || a.outros
    ? `<div class="fx-cab"><span>${fxEsc(fxT('Quantidade × preço = valor'))}</span><span>${fxEsc(a.outros ? fxT('Maiores itens: ' + fxPct(a.cobertura != null ? a.cobertura : (a.soma ? a.linhas.reduce((s, x) => s + x.valor, 0) / a.soma : 1), 0) + ' do ano') : fxT(a.id === 'saida' ? 'Todos os itens da saída' : 'Todos os itens do ano'))}</span></div>` : '';
  return `<div class="fx-painel" role="tabpanel" id="fx-painel" aria-labelledby="fx-tab-${a.id}">${cab}${linhas}${outros}${pe}</div>`;
}
function renderFormula() {
  fxCss();
  let ex;
  try { ex = explicacaoCusto(); } catch (e) { console.warn(e); return ''; }
  if (!ex) return '';
  const f = ex.formula, sel = fxAnoSel(ex);
  const a = ex.anos.find(x => x.id === sel) || ex.anos[0];
  const cls = { teste: 'fx-teste', uso: 'fx-uso', saida: 'fx-saida', residual: 'fx-residual' };
  const termo = (x, i) => `${i ? `<span class="fx-op" aria-hidden="true">${x.sinal === -1 ? '−' : '+'}</span>` : ''}<div class="fx-t ${cls[x.id] || ''}"><span class="fx-v">${fxEsc(fxGrande(x.mostrado))}</span><span class="fx-l">${fxEsc(x.rotulo)}</span><span class="fx-q">${fxEsc(x.quando)}</span><span class="fx-x">${fxEsc(fxDin(x.mostrado))}</span></div>`;
  const tabs = ex.anos.map(y => `<button type="button" role="tab" id="fx-tab-${y.id}" data-formula-ano="${y.id}" aria-selected="${y.id === a.id}" aria-controls="fx-painel" tabindex="${y.id === a.id ? 0 : -1}">${fxEsc(y.rotulo)}<small>· ${fxEsc(y.sub)}</small></button>`).join('');
  return `<section class="fx" id="formula-box" aria-labelledby="fx-h" data-notr>
  <h3 class="fx-h" id="fx-h">${fxEsc(fxT('Como o custo é calculado'))}</h3>
  <p class="fx-intro">${fxEsc(fxT('Cada custo é uma conta simples: quantidade × preço. As contas somam o custo de cada ano, e os anos somam o custo total.'))}</p>
  <div class="fx-eq" role="group" aria-label="${fxEsc(f.texto)}">
    <div class="fx-t fx-total"><span class="fx-v">${fxEsc(fxGrande(f.totalMostrado))}</span><span class="fx-l">${fxEsc(fxT('Custo total do ciclo de vida'))}</span><span class="fx-q">${fxEsc(fxT('Anos 0 a ' + ex.H))}</span><span class="fx-x">${fxEsc(fxDin(f.totalMostrado))}</span></div>
    <span class="fx-op" aria-hidden="true">=</span>
    ${f.termos.map(termo).join('')}
  </div>
  ${f.usoTexto ? `<p class="fx-uso-anos">${fxEsc(f.usoTexto)}</p>` : ''}
  ${f.notaVP ? `<p class="fx-vp">${fxEsc(f.notaVP)}</p>` : ''}
  <h4>${fxEsc(fxT('As contas de cada ano'))}</h4>
  <div class="fx-tabs" role="tablist" aria-label="${fxEsc(fxT('As contas de cada ano'))}">${tabs}</div>
  ${fxPainel(a, ex)}
  <div class="fx-origem"><h4>${fxEsc(fxT('De onde vêm os números'))}</h4><ul>${ex.origem.map(x => `<li>${fxEsc(x)}</li>`).join('')}</ul></div>
  <div class="fx-leitura"><h4>${fxEsc(fxT('Como ler a estimativa'))}</h4><ul>${ex.leitura.map(x => `<li>${fxEsc(x)}</li>`).join('')}</ul></div>
  <p class="fx-nota">${fxEsc(ex.nota)}</p>
</section>`;
}
// Seletor de ano: um único ouvinte delegado no documento; redesenha só o bloco e guarda o ano em S.formulaAno.
function fxTrocarAno(id, foco) {
  if (typeof S !== 'undefined' && S) S.formulaAno = id;
  try { if (typeof salvar === 'function') salvar(); } catch (e) { }
  const box = typeof document !== 'undefined' && document.getElementById('formula-box');
  if (!box) return;
  const tmp = document.createElement('div'); tmp.innerHTML = renderFormula();
  const novo = tmp.firstElementChild; if (!novo) return;
  const abertos = !!box.querySelector('.fx-outros[open]');
  box.replaceWith(novo);
  if (abertos) { const d = novo.querySelector('.fx-outros'); if (d) d.open = true; }
  if (foco) { const b = novo.querySelector(`[data-formula-ano="${id}"]`); if (b) b.focus(); }
}
if (typeof document !== 'undefined' && !window.__fxOuvinte) {
  window.__fxOuvinte = true;
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest && e.target.closest('[data-formula-ano]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    fxTrocarAno(b.dataset.formulaAno, true);
  }, true);
  document.addEventListener('keydown', e => {
    const b = e.target && e.target.closest && e.target.closest('[data-formula-ano]');
    if (!b || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const todos = [...b.parentElement.querySelectorAll('[data-formula-ano]')];
    let i = todos.indexOf(b);
    i = e.key === 'Home' ? 0 : e.key === 'End' ? todos.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + todos.length) % todos.length;
    e.preventDefault();
    fxTrocarAno(todos[i].dataset.formulaAno, true);
  });
}

// ----------------------------------------------------------- plano e PDF (formato de secoesPlano)
function secaoFormula() {
  let ex;
  try { ex = explicacaoCusto(); } catch (e) { console.warn(e); return []; }
  if (!ex) return [];
  const f = ex.formula;
  const kv = f.termos.map(x => [x.rotulo + ' (' + x.quando + ')', (x.sinal === -1 ? '− ' : '') + fxDin(x.mostrado)]).concat([[fxT('Custo total do ciclo de vida'), fxDin(f.totalMostrado)]]);
  const rows = [];
  ex.anos.forEach(a => {
    const col = a.id === 'saida' ? a.rotulo : fxNum(a.t, 0);   // coluna estreita: só o número do ano
    a.linhas.forEach(x => rows.push([col, x.nome, x.conta, fxDin(x.mostrado)]));
    if (a.outros) rows.push([col, a.outros.rotulo, fxT('itens menores, somados'), fxDin(a.outros.mostrado)]);
    if (a.id === 'saida' && a.continuidade) rows.push([col, fxT('A estimativa supõe que a rede continua com a solução: não há custo de saída.'), '', fxDin(0)]);
    else {
      const aj = [];
      if (a.id === 'saida' && Math.abs(a.pSaida - 1) > 1e-9) aj.push('× ' + fxPct(a.pSaida, 0) + ' (' + fxT('probabilidade de trocar de solução') + ')');
      if (Math.abs(a.fatorVP - 1) > 1e-12) aj.push('÷ ' + fxFator(1 / a.fatorVP) + ' (' + fxT('valor presente') + ')');
      rows.push([col, a.id === 'saida' ? fxT('Custo de saída') : fxT('Total do ' + (a.t === 0 ? 'Ano 0' : 'Ano ' + a.t)), aj.join(' '), fxDin(a.totalMostrado)]);
    }
  });
  return [
    { sub: true, h: fxT('Como o custo é calculado'), p: [fxT('Cada custo é uma conta simples: quantidade × preço. As contas somam o custo de cada ano, e os anos somam o custo total.'), f.texto + '.', f.numeros + '.'].concat(f.usoTexto ? [f.usoTexto + '.'] : []).concat(f.notaVP ? [f.notaVP] : []), kv },
    { sub: true, h: fxT('As contas de cada ano'), table: { head: [fxT('Ano'), fxT('Item'), fxT('Cálculo'), fxT('Valor')], rows, num: [3] },
      pos: [fxT('Em cada ano aparecem os itens que somam ao menos 90% do custo do ano; os demais estão somados em "Outros itens".')] },
    { sub: true, h: fxT('De onde vêm os números'), list: ex.origem.slice() },
    { sub: true, h: fxT('Como ler a estimativa'), list: ex.leitura.slice(), pos: [ex.nota] },
  ];
}

if (typeof module !== 'undefined') module.exports = { explicacaoCusto, renderFormula, secaoFormula, fxTexto, fxSelecionar, fxFechar, FX_UNID, FX_FIXO, CSS_FORMULA };
