// =====================================================================
// Modelo paramétrico de custo total (TCO) — Caps. 11 e 12 do guia
// Porta direta de tools/modelo_custos.py, generalizada por configuração.
// Anos: 0 = implantação/piloto; 1..3 = operação. Valores em US$.
// =====================================================================
const ANOS = [0, 1, 2, 3];
const SAL = {
  gestor_produto: 48000, eng_integracao: 45000, eng_ml: 60000, analista_privacidade: 42000,
  especialista_pedagogico: 36000, gestor_contrato: 36000, suporte_n1: 22000, analista_conteudo: 36000,
};
const SAL_NOME = {
  gestor_produto: 'Gestão de produto', eng_integracao: 'Engenharia de integração/infra', eng_ml: 'Engenharia de ML',
  analista_privacidade: 'Privacidade e segurança', especialista_pedagogico: 'Especialista pedagógico',
  gestor_contrato: 'Gestão contratual', suporte_n1: 'Suporte nível 1', analista_conteudo: 'Curadoria de conteúdo',
};

function clone(o) { return JSON.parse(JSON.stringify(o)); }
function custoChamada(Tin, Tout, Pin, Pout, h = 0, Pcache = null) {
  if (Pcache == null) Pcache = 0.1 * Pin;
  return (Tin * (1 - h) * Pin + Tin * h * Pcache + Tout * Pout) / 1e6;
}
function salario(cfg, chave) {
  if (typeof chave === 'number') return chave;
  const tab = (cfg.salarios || {});
  return tab[chave] != null ? tab[chave] : SAL[chave];
}

// ---------------------------------------------------------------------
function calcular(cfg) {
  const m = Object.assign({ fx: 1, pessoas: 1, preco: 1 }, cfg.mult || {});
  const d = cfg.demanda;
  const L = [];
  const add = (cat, nome, nat, comp, fx, v, tag) =>
    L.push({ cat, nome, nat, comp, fx: !!fx, tag: tag || '', v: ANOS.map(t => +(v[t] || 0)) });

  const U = ANOS.map(t => d.E[t] * d.adocao[t]);
  const I = ANOS.map(t => U[t] * d.s * d.i * d.meses[t]);
  const extra = {};

  // --- SaaS
  if (cfg.saas && cfg.saas.ativo) {
    const s = cfg.saas;
    const preco = ANOS.map(t => t === 0 ? s.preco : s.preco * Math.pow(1 + s.reajuste, t - 1));
    const lic = ANOS.map(t => s.qtd[t] * preco[t] * s.fatorPreco[t] * s.mesesCobr[t] * m.fx);
    add('Acesso comercial', 'Licenças SaaS', 'EXT', 'F', true, lic, 'licenca');
    extra.precoLic = preco;
  }
  // --- API
  if (cfg.api && cfg.api.ativo) {
    const a = cfg.api, prm = m.preco;
    const cMain = a.k * custoChamada(a.Tin, a.Tout, a.Pin * prm, a.Pout * prm, a.h);
    const cGuard = a.auxAtivo ? custoChamada(a.TinAux, a.ToutAux, a.PinAux * prm, a.PoutAux * prm) : 0;
    const cEmb = (cfg.rag && cfg.rag.ativo) ? a.Tq * cfg.rag.Pemb / 1e6 : 0;
    const cRr = a.PrerankMil / 1000;
    add('Consumo de IA', 'Modelo principal (API)', 'EXT', 'V', true, ANOS.map(t => I[t] * cMain * m.fx), 'consulta');
    if (cGuard + cEmb + cRr > 0)
      add('Consumo de IA', 'Chamadas auxiliares (segurança, embeddings de consulta, reranking)', 'EXT', 'V', true,
        ANOS.map(t => I[t] * (cGuard + cEmb + cRr) * m.fx), 'consulta');
    extra.cMain = cMain; extra.cAux = cGuard + cEmb + cRr; extra.cInt = cMain + cGuard + cEmb + cRr;
  }
  // --- RAG
  if (cfg.rag && cfg.rag.ativo) {
    const r = cfg.rag;
    const corpus = r.docs * r.tokDoc;
    const emb = ANOS.map(t => t === 0 ? corpus * r.Pemb / 1e6 :
      (r.docsNovos * r.tokDoc + r.reindexAno * (corpus + t * r.docsNovos * r.tokDoc)) * r.Pemb / 1e6);
    add('Dados e RAG', 'Embeddings de ingestão e reindexação', 'EXT', 'V', true, emb.map(x => x * m.fx), 'ingestao');
    if (r.paginas > 0)
      add('Dados e RAG', 'Processamento de documentos (OCR, extração)', 'EXT', 'F', true, [r.paginas * r.Ppag * m.fx, 0, 0, 0]);
  }
  // --- Pesos abertos (GPU)
  if (cfg.ow && cfg.ow.ativo) {
    const o = cfg.ow, prm = m.preco;
    const G = [], horas = [], rpsA = [];
    ANOS.forEach(t => {
      const Hp = o.hPicoMes * d.meses[t];
      const rps = I[t] * o.fPico / (Hp * 3600) * o.phi;
      const tokS = rps * o.Tout;
      let g = Math.ceil(tokS / (o.theta * o.u)) + o.red;
      g = Math.max(g, o.minFora);
      const h = t === 0 ? g * d.meses[0] * 730 : g * Hp + o.minFora * (8760 - Hp);
      G.push(g); horas.push(h); rpsA.push(rps);
    });
    add('Infraestrutura', 'GPUs de inferência (horas × preço)', 'EXT', 'E', true, horas.map(h => h * o.Pgpu * prm * m.fx), 'gpu');
    if (o.nSeg > 0)
      add('Infraestrutura', 'Classificador de segurança (instâncias dedicadas)', 'EXT', 'F', true,
        ANOS.map(t => o.nSeg * (t === 0 ? d.meses[0] * 730 : 8760) * o.Pseg * prm * m.fx), 'plataforma_anual');
    extra.G = G; extra.horasGpu = horas; extra.rps = rpsA;
  }
  // --- Itens mensais (hospedagem, banco vetorial, observabilidade...)
  (cfg.mensais || []).forEach(x => {
    add(x.cat, x.nome, 'EXT', 'F', x.fx, ANOS.map(t => x.valor * (t === 0 ? x.mesesY0 : 12) * (x.fx ? m.fx : 1)), 'mensal');
  });
  // --- Implantação principal + manutenção
  (cfg.implantacao || []).forEach(x => {
    add(x.cat, x.nome, 'EXT', 'F', false, [x.valor, 0, 0, 0]);
    if (x.manutPct > 0) add(x.cat, x.nomeManut || ('Manutenção: ' + x.nome.toLowerCase()), 'EXT', 'F', false,
      [0, x.valor * x.manutPct, x.valor * x.manutPct, x.valor * x.manutPct]);
  });
  // --- Itens de valor por ano
  (cfg.itens || []).forEach(x => add(x.cat, x.nome, x.nat || 'EXT', x.comp || 'F', x.fx, x.v));
  // --- Pessoas (FTE × custo carregado)
  (cfg.pessoas || []).forEach(p => {
    const v = ANOS.map(t => p.partes.reduce((s, [sal, fte]) => s + salario(cfg, sal) * fte[t], 0) * m.pessoas);
    add(p.cat || 'Pessoas', p.nome, p.nat || 'CAP', p.comp || 'F', false, v, p.tag);
  });
  // --- Suporte escalonado pelo número de usuários ativos
  if (cfg.suporte && cfg.suporte.ativo) {
    const s = cfg.suporte;
    const fte = U.map(u => { for (const [lim, f] of s.faixas) if (u < lim) return f; return s.acima; });
    add('Pessoas', s.nome, s.nat || 'CAP', 'E', false,
      ANOS.map(t => s.anos.includes(t) ? fte[t] * salario(cfg, s.sal) * m.pessoas : 0));
  }
  // --- Tempo de formação
  if (cfg.formacaoTempo && cfg.formacaoTempo.ativo) {
    const f = cfg.formacaoTempo;
    let v;
    if (f.modo === 'razao') v = ANOS.map(t => d.E[t] / f.razao * f.horas * f.custoHora * m.pessoas);
    else {
      const novos = [U[0], U[1], Math.max(U[2] - U[1], 0) + f.rot * U[1], Math.max(U[3] - U[2], 0) + f.rot * U[2]];
      v = novos.map(n => n * f.horas * f.custoHora * m.pessoas);
    }
    add('Formação e mudança', f.nome, 'CAP', 'V', false, v);
  }

  // --- Saída (ao final do Ano 3)
  const S = [];
  const sa = cfg.saida || {};
  const addS = (nome, nat, fx, valor) => S.push({ cat: 'Saída', nome, nat, fx: !!fx, valor: +valor || 0 });
  (sa.itens || []).forEach(x => addS(x.nome, x.nat || 'EXT', x.fx, x.valor));
  const impl0 = (cfg.implantacao || [])[0];
  if (sa.reconstrucaoPct > 0 && impl0) addS('Reconstrução de integrações e aplicação (' + Math.round(sa.reconstrucaoPct * 100) + '% da implantação)', 'EXT', false, sa.reconstrucaoPct * impl0.valor);
  if (cfg.rag && cfg.rag.ativo && sa.reindexar) {
    const r = cfg.rag;
    addS('Reindexação e migração da base de conhecimento', 'EXT', true, (r.docs * r.tokDoc + 3 * r.docsNovos * r.tokDoc) * r.Pemb / 1e6 * m.fx + (sa.reindexFixo || 0));
  }
  if (sa.mesesParalelo > 0) {
    const y3 = tag => L.filter(l => l.tag === tag).reduce((s, l) => s + l.v[3], 0);
    const mensalPlat = (cfg.mensais || []).filter(x => x.plataforma !== false).reduce((s, x) => s + x.valor * (x.fx ? m.fx : 1), 0);
    const mensal = y3('licenca') / 12 + (d.meses[3] > 0 ? y3('consulta') / d.meses[3] : 0) + (y3('gpu') + y3('plataforma_anual')) / 12 + mensalPlat;
    addS('Operação paralela (' + sa.mesesParalelo + (sa.mesesParalelo > 1 ? ' meses' : ' mês') + ' do custo de plataforma)', 'EXT', true, sa.mesesParalelo * mensal);
  }
  if (sa.horasRetreino > 0) addS('Tempo de retreinamento dos usuários', 'CAP', false, U[3] * sa.horasRetreino * sa.custoHora * m.pessoas);
  if (sa.internos && sa.internos.length) addS('Tempo interno de coordenação e validação', 'CAP', false,
    sa.internos.reduce((s, [sal, fte]) => s + salario(cfg, sal) * fte, 0) * m.pessoas);

  return { cfg, U, I, linhas: L, saida: S, extra };
}

function resumo(r) {
  const soma = f => ANOS.map(t => r.linhas.filter(f).reduce((s, l) => s + l.v[t], 0));
  const tot = soma(() => true), ext = soma(l => l.nat === 'EXT'), cap = soma(l => l.nat === 'CAP'), fx = soma(l => l.fx);
  const saida = r.saida.reduce((s, l) => s + l.valor, 0);
  const saidaExt = r.saida.filter(l => l.nat === 'EXT').reduce((s, l) => s + l.valor, 0);
  const semSaida = tot.reduce((a, b) => a + b, 0);
  const porCat = {};
  r.linhas.forEach(l => { porCat[l.cat] = (porCat[l.cat] || 0) + l.v.reduce((a, b) => a + b, 0); });
  return { tot, ext, cap, fx, saida, saidaExt, semSaida, tco: semSaida + saida, porCat };
}

// ---------------------------------------------------------------------
// Cenários (Cap. 12): esperado, alta adoção, estresse
// ---------------------------------------------------------------------
function arquitetura(cfg) {
  if (cfg.ow && cfg.ow.ativo) return 'ow';
  if (cfg.api && cfg.api.ativo) return 'api';
  return 'saas';
}
function cfgAltaAdocao(cfg) {
  const c = clone(cfg);
  c.demanda.adocao = c.demanda.adocao.map((a, t) => t === 0 ? a : Math.min(0.9, a * 1.5));
  if (arquitetura(cfg) !== 'saas') c.demanda.s = c.demanda.s * 1.2;
  return c;
}
function cfgEstresse(cfg) {
  const c = cfgAltaAdocao(cfg);
  const arq = arquitetura(cfg);
  c.mult = Object.assign({ fx: 1, pessoas: 1, preco: 1 }, c.mult || {});
  c.mult.fx *= 1.25;
  if (arq === 'saas') {
    if (c.saas) c.saas.reajuste = Math.max(c.saas.reajuste, 0.10);
    if (c.formacaoTempo) c.formacaoTempo.horas = c.formacaoTempo.horas * 4 / 3;
  } else {
    c.mult.preco *= 1.25;
    if (arq === 'api') { c.api.Tin *= 1.5; c.api.Tout *= 1.5; c.api.k *= 1.5; }
    if (arq === 'ow') { c.ow.Tout *= 1.5; c.ow.theta *= 0.75; }
  }
  return c;
}
function cenarios(cfg) {
  return {
    'Esperado': calcular(cfg),
    'Alta adoção': calcular(cfgAltaAdocao(cfg)),
    'Estresse': calcular(cfgEstresse(cfg)),
  };
}

// ---------------------------------------------------------------------
// Sensibilidade ±20% no custo anual do Ano 2
// ---------------------------------------------------------------------
function variaveisSens(cfg) {
  const arq = arquitetura(cfg);
  const V = [];
  const mult = (k) => (c, f) => { c.mult = Object.assign({ fx: 1, pessoas: 1, preco: 1 }, c.mult || {}); c.mult[k] *= f; };
  const adoc = (c, f) => { c.demanda.adocao = c.demanda.adocao.map((a, t) => t === 0 ? a : Math.min(0.95, a * f)); };
  V.push(['Custo carregado de pessoal', mult('pessoas')]);
  V.push(['Câmbio (itens em moeda estrangeira)', mult('fx')]);
  V.push(['Taxa de adoção', adoc]);
  if (arq === 'saas') {
    V.push(['Preço da licença', (c, f) => { c.saas.preco *= f; }]);
    if (cfg.formacaoTempo && cfg.formacaoTempo.ativo) V.push(['Horas de formação por usuário', (c, f) => { c.formacaoTempo.horas *= f; }]);
  }
  if (arq === 'api') {
    if ((cfg.implantacao || []).length) V.push(['Manutenção evolutiva (% da implantação)', (c, f) => { c.implantacao[0].manutPct *= f; }]);
    V.push(['Sessões por usuário', (c, f) => { c.demanda.s *= f; }]);
    V.push(['Tokens de entrada por chamada', (c, f) => { c.api.Tin *= f; }]);
    V.push(['Chamadas por interação', (c, f) => { c.api.k *= f; }]);
    V.push(['Preço por token', mult('preco')]);
  }
  if (arq === 'ow') {
    V.push(['Sessões por usuário', (c, f) => { c.demanda.s *= f; }]);
    V.push(['Vazão por GPU (tokens/s)', (c, f) => { c.ow.theta *= f; }]);
    V.push(['Preço da hora de GPU', mult('preco')]);
    V.push(['Tokens de saída por interação', (c, f) => { c.ow.Tout *= f; }]);
  }
  return V;
}
function sensibilidade(cfg) {
  const base = resumo(calcular(cfg)).tot[2];
  const rows = variaveisSens(cfg).map(([nome, fn]) => {
    const lo = clone(cfg); fn(lo, 0.8);
    const hi = clone(cfg); fn(hi, 1.2);
    return { nome, lo: resumo(calcular(lo)).tot[2] - base, hi: resumo(calcular(hi)).tot[2] - base };
  });
  rows.sort((a, b) => Math.max(Math.abs(b.lo), Math.abs(b.hi)) - Math.max(Math.abs(a.lo), Math.abs(a.hi)));
  return { base, rows };
}

// ---------------------------------------------------------------------
// Visão orçamentária por exercício (Cap. 12)
// ---------------------------------------------------------------------
function orcamento(cfg, contPct = 0.05) {
  const cs = cenarios(cfg);
  const ex = cs['Esperado'], alta = cs['Alta adoção'];
  const isVar = l => l.nat === 'EXT' && (l.comp === 'V' || l.tag === 'gpu');
  const soma = (r, f) => ANOS.map(t => r.linhas.filter(f).reduce((s, l) => s + l.v[t], 0));
  const fixo = soma(ex, l => l.nat === 'EXT' && !isVar(l));
  const varr = soma(ex, isVar);
  const fixoA = soma(alta, l => l.nat === 'EXT' && !isVar(l));
  const varA = soma(alta, isVar);
  const reserva = ANOS.map(t => Math.max(0, (varA[t] + fixoA[t]) - (varr[t] + fixo[t])));
  const cont = ANOS.map(t => contPct * (fixo[t] + varr[t]));
  const dot = ANOS.map(t => fixo[t] + varr[t] + reserva[t] + cont[t]);
  const cap = soma(ex, l => l.nat === 'CAP');
  const saida = resumo(ex).saidaExt;
  return { fixo, var: varr, reserva, cont, dot, cap, saida, contPct };
}

// ---------------------------------------------------------------------
// Comparações específicas
// ---------------------------------------------------------------------
function compLicenca(cfg) {          // SaaS: institucional x nominal
  if (!(cfg.saas && cfg.saas.ativo)) return null;
  const r = calcular(cfg), s = cfg.saas;
  const lic = r.linhas.find(l => l.tag === 'licenca');
  const rows = [1, 2, 3].map(t => {
    const inst = lic.v[t];
    const Lnom = Math.ceil(r.U[t] * s.fatorNominal);
    const nom = Lnom * s.precoNominal * Math.pow(1 + s.reajuste, t - 1) * 12 * ((cfg.mult && cfg.mult.fx) || 1);
    return { t, U: r.U[t], inst, instAtivo: inst / r.U[t] / 12, instLic: inst / s.qtd[t] / 12, Lnom, nom, nomAtivo: nom / r.U[t] / 12 };
  });
  const aEq = s.preco / (s.fatorNominal * s.precoNominal);
  return { rows, aEq };
}
function compArquiteturas(cfg) {     // pesos abertos x API no Ano 2
  if (!(cfg.ow && cfg.ow.ativo)) return null;
  const r = calcular(cfg), res = resumo(r), o = cfg.ow, c = cfg.comparaAPI;
  const infra = r.linhas.filter(l => l.cat === 'Infraestrutura').reduce((s, l) => s + l.v[2], 0);
  const pessoasOp = r.linhas.filter(l => l.tag === 'opmodelo').reduce((s, l) => s + l.v[2], 0);
  const resto = res.tot[2] - infra - pessoasOp;
  const I2 = r.I[2];
  const mod = custoChamada(300, 10, 0.20, 1.20);
  const apiCusto = (Pin, Pout) => I2 * (custoChamada(o.Tin, o.Tout, Pin, Pout) + mod) + c.armazenamento;
  const pApi = c.pessoasAPI.reduce((s, [sal, fte]) => s + salario(cfg, sal) * fte, 0);
  return {
    I2, resto, rows: [
      { nome: 'Pesos abertos em GPU gerenciada', comp: infra, pes: pessoasOp, tot: infra + pessoasOp + resto },
      ...c.opcoes.map(op => { const a = apiCusto(op.Pin, op.Pout); return { nome: op.nome, comp: a, pes: pApi, tot: a + pApi + resto }; }),
    ]
  };
}

// ---------------------------------------------------------------------
// Predefinições: os três exemplos do Cap. 12
// ---------------------------------------------------------------------
const PRESETS = {
  A: {
    nome: 'Exemplo A. Copiloto SaaS para professores', arq: 'saas', risco: 'moderado',
    unidade: 'professor', unidadePl: 'professores',
    demanda: { E: [600, 12000, 12000, 12000], adocao: [0.70, 0.35, 0.45, 0.50], s: 0, i: 0, meses: [4, 12, 12, 12] },
    saas: { ativo: true, qtd: [600, 12000, 12000, 12000], preco: 9.00, reajuste: 0.04, mesesCobr: [4, 12, 12, 12], fatorPreco: [0, 1, 1, 1], precoNominal: 13.00, fatorNominal: 1.15 },
    implantacao: [{ cat: 'Integração', nome: 'Integração SSO, diretório e AVA (implantação)', valor: 40000, manutPct: 0.15, nomeManut: 'Manutenção de integrações' }],
    itens: [
      { cat: 'Privacidade e conformidade', nome: 'Revisão jurídica e de proteção de dados', nat: 'EXT', v: [8000, 0, 0, 0] },
      { cat: 'Avaliação', nome: 'Avaliação independente', nat: 'EXT', v: [0, 25000, 0, 20000] },
      { cat: 'Formação e mudança', nome: 'Programa de formação (formadores, materiais)', nat: 'EXT', v: [20000, 12000, 12000, 12000] },
    ],
    pessoas: [
      { cat: 'Pessoas', nome: 'Configuração e políticas (TI)', nat: 'CAP', partes: [['eng_integracao', [0.25, 0, 0, 0]]] },
      { cat: 'Pessoas', nome: 'Gestão do produto', nat: 'CAP', partes: [['gestor_produto', [0.15, 0.3, 0.3, 0.3]]] },
      { cat: 'Governança', nome: 'Gestão contratual', nat: 'CAP', partes: [['gestor_contrato', [0, 0.1, 0.1, 0.1]]] },
      { cat: 'Governança', nome: 'Privacidade e dados', nat: 'CAP', partes: [['analista_privacidade', [0.1, 0.1, 0.1, 0.1]]] },
      { cat: 'Monitoramento', nome: 'Amostragem pedagógica de qualidade', nat: 'CAP', partes: [['especialista_pedagogico', [0, 0.2, 0.2, 0.2]]] },
    ],
    suporte: { ativo: true, nome: 'Suporte aos usuários (escalonado)', sal: 'suporte_n1', faixas: [[5000, 0.5]], acima: 1.0, anos: [1, 2, 3] },
    formacaoTempo: { ativo: true, nome: 'Tempo docente em formação', modo: 'ativos', horas: 3, custoHora: 12, rot: 0.10 },
    saida: {
      itens: [
        { nome: 'Exportação e transformação de materiais', valor: 8000 },
        { nome: 'Formadores para a nova solução', valor: 8000 },
        { nome: 'Desativação, exclusão e evidência', valor: 2000 },
      ], reconstrucaoPct: 0.6, mesesParalelo: 1, horasRetreino: 2, custoHora: 12, internos: [],
    },
  },
  B: {
    nome: 'Exemplo B. Assistente administrativo com API e RAG', arq: 'api', risco: 'limitado',
    unidade: 'servidor', unidadePl: 'servidores',
    demanda: { E: [150, 3000, 3000, 3000], adocao: [0.70, 0.40, 0.55, 0.60], s: 12, i: 3, meses: [3, 11, 11, 11] },
    api: { ativo: true, k: 1.3, Tin: 5000, Tout: 400, h: 0.20, Pin: 2.00, Pout: 10.00, auxAtivo: true, TinAux: 600, ToutAux: 10, PinAux: 0.20, PoutAux: 1.20, Tq: 50, PrerankMil: 1.00 },
    rag: { ativo: true, docs: 20000, tokDoc: 2500, docsNovos: 4000, reindexAno: 1, paginas: 200000, Ppag: 0.0015, Pemb: 0.10 },
    mensais: [
      { cat: 'Dados e RAG', nome: 'Banco vetorial gerenciado', valor: 200, mesesY0: 6, fx: true },
      { cat: 'Infraestrutura', nome: 'Hospedagem da aplicação', valor: 900, mesesY0: 6, fx: true },
      { cat: 'Monitoramento', nome: 'Ferramenta de observabilidade', valor: 250, mesesY0: 6, fx: true },
    ],
    implantacao: [{ cat: 'Integração', nome: 'Desenvolvimento da aplicação, RAG e integrações', valor: 110000, manutPct: 0.20, nomeManut: 'Manutenção evolutiva e adaptação a mudanças de API' }],
    itens: [
      { cat: 'Avaliação', nome: 'Conjunto de avaliação e testes (implantação e reexecução)', nat: 'EXT', v: [12000, 6000, 6000, 6000] },
      { cat: 'Formação e mudança', nome: 'Formação (materiais e oficinas)', nat: 'EXT', v: [3000, 4000, 4000, 4000] },
    ],
    pessoas: [
      { cat: 'Pessoas', nome: 'Curadoria da base de conhecimento', nat: 'CAP', partes: [['analista_conteudo', [0.25, 0.5, 0.5, 0.5]]] },
      { cat: 'Pessoas', nome: 'Responsável pelo produto', nat: 'CAP', partes: [['gestor_produto', [0.25, 0.3, 0.3, 0.3]]] },
      { cat: 'Pessoas', nome: 'TI interna', nat: 'CAP', partes: [['eng_integracao', [0.15, 0.2, 0.2, 0.2]]] },
      { cat: 'Governança', nome: 'Privacidade, segurança e gestão contratual', nat: 'CAP', partes: [['analista_privacidade', [0.05, 0.1, 0.1, 0.1]], ['gestor_contrato', [0, 0.05, 0.05, 0.05]]] },
    ],
    formacaoTempo: { ativo: true, nome: 'Tempo dos servidores em formação', modo: 'ativos', horas: 1.5, custoHora: 10, rot: 0.10 },
    saida: {
      itens: [
        { nome: 'Documentação e transferência de conhecimento', valor: 15000 },
        { nome: 'Novo teste com o conjunto de avaliação', valor: 10000 },
      ], reconstrucaoPct: 0.30, reindexar: true, reindexFixo: 2000, mesesParalelo: 2, horasRetreino: 0, custoHora: 10,
      internos: [['gestor_produto', 0.125], ['eng_integracao', 0.125]],
    },
  },
  C: {
    nome: 'Exemplo C. Tutor com modelo de pesos abertos', arq: 'ow', risco: 'elevado',
    unidade: 'estudante', unidadePl: 'estudantes',
    demanda: { E: [6000, 50000, 150000, 150000], adocao: [0.60, 0.45, 0.35, 0.40], s: 8, i: 10, meses: [4, 9, 9, 9] },
    ow: { ativo: true, Tin: 1800, Tout: 250, fPico: 0.70, hPicoMes: 1600 / 9, phi: 2.0, theta: 600, u: 0.70, red: 1, minFora: 2, Pgpu: 1.32, Pseg: 0.53, nSeg: 2 },
    mensais: [{ cat: 'Infraestrutura', nome: 'Armazenamento, rede, registros e balanceamento', valor: 1500, mesesY0: 4, fx: true }],
    implantacao: [{ cat: 'Integração', nome: 'Plataforma do tutor e integrações (implantação)', valor: 180000, manutPct: 0.15, nomeManut: 'Manutenção da plataforma e integrações' }],
    itens: [
      { cat: 'Dados', nome: 'Alinhamento curricular, instruções e conjuntos de teste', nat: 'EXT', v: [20000, 0, 0, 0] },
      { cat: 'Privacidade e conformidade', nome: 'Avaliação de impacto e proteção de crianças', nat: 'EXT', v: [15000, 0, 0, 0] },
      { cat: 'Governança', nome: 'Testes adversariais externos e auditoria', nat: 'EXT', v: [0, 45000, 45000, 45000] },
      { cat: 'Avaliação', nome: 'Avaliação de impacto (desenho comparativo)', nat: 'EXT', v: [0, 60000, 60000, 0] },
      { cat: 'Mudança tecnológica', nome: 'Reavaliação por troca de versão do modelo', nat: 'EXT', v: [0, 10000, 10000, 10000] },
      { cat: 'Formação e mudança', nome: 'Formação de professores', nat: 'EXT', v: [10000, 15000, 15000, 15000] },
    ],
    pessoas: [
      { cat: 'Pessoas', nome: 'Engenharia de ML e operação do modelo', nat: 'EXT', tag: 'opmodelo', partes: [['eng_ml', [0.5, 1, 1, 1]]] },
      { cat: 'Pessoas', nome: 'Infraestrutura e confiabilidade', nat: 'EXT', tag: 'opmodelo', partes: [['eng_integracao', [0.25, 0.5, 0.5, 0.5]]] },
      { cat: 'Pessoas', nome: 'Gestão do produto', nat: 'CAP', partes: [['gestor_produto', [0.25, 0.5, 0.5, 0.5]]] },
      { cat: 'Monitoramento', nome: 'Equipe pedagógica: curadoria e revisão de respostas', nat: 'CAP', partes: [['especialista_pedagogico', [0.5, 1, 1, 1]]] },
      { cat: 'Governança', nome: 'Privacidade, proteção de crianças e contrato', nat: 'CAP', partes: [['analista_privacidade', [0.15, 0.3, 0.3, 0.3]], ['gestor_contrato', [0.05, 0.1, 0.1, 0.1]]] },
    ],
    suporte: { ativo: true, nome: 'Suporte às escolas (escalonado)', sal: 'suporte_n1', faixas: [[20000, 0.5], [60000, 1.0]], acima: 1.5, anos: [0, 1, 2, 3] },
    formacaoTempo: { ativo: true, nome: 'Tempo docente em formação', modo: 'razao', razao: 50, horas: 2, custoHora: 12, rot: 0 },
    comparaAPI: {
      armazenamento: 18000, pessoasAPI: [['eng_ml', 0.3], ['eng_integracao', 0.1]],
      opcoes: [{ nome: 'API, modelo pequeno (US$ 0,20 / 1,20 por milhão de tokens)', Pin: 0.20, Pout: 1.20 }, { nome: 'API, modelo intermediário (US$ 2,00 / 10,00)', Pin: 2.00, Pout: 10.00 }],
    },
    saida: {
      itens: [
        { nome: 'Transferência de conhecimento e documentação', valor: 25000 },
        { nome: 'Novo ciclo de testes e de segurança', valor: 30000 },
      ], reconstrucaoPct: 0.25, mesesParalelo: 1, horasRetreino: 0, custoHora: 12,
      internos: [['gestor_produto', 0.3], ['especialista_pedagogico', 0.2]],
    },
  },
};

if (typeof module !== 'undefined') module.exports = { ANOS, SAL, SAL_NOME, calcular, resumo, cenarios, sensibilidade, orcamento, compLicenca, compArquiteturas, PRESETS, clone, custoChamada, arquitetura };
