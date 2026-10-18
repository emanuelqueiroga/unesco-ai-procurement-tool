// =====================================================================
// Modelo de custo total do ciclo de vida — versão 2
// Árvore de custos (insumo → subcomponente → componente → total),
// duas contas (econômica e orçamentária), índices de custo unitário,
// cenários, tornado com faixas próprias, Monte Carlo, LMDI, Laspeyres
// e comparação de alternativas.
// Valores-base em US$ do Ano 0. Ano 0 = implantação e piloto.
// =====================================================================

// ---------------------------------------------------------------- árvore
const ARVORE = [
  ['K1', 'Condições de base', [['K1.1', 'Conectividade incremental'], ['K1.2', 'Dispositivos'], ['K1.3', 'Identidade e acesso']]],
  ['K2', 'Tecnologia e uso', [['K2.1', 'Licenças'], ['K2.2', 'Consumo de modelos'], ['K2.3', 'Computação própria'], ['K2.4', 'Dados e RAG'], ['K2.5', 'Hospedagem e observabilidade']]],
  ['K3', 'Implantação e adaptação', [['K3.1', 'Integração e desenvolvimento'], ['K3.2', 'Conteúdo e configuração iniciais'], ['K3.3', 'Conformidade inicial'], ['K3.4', 'Testes de aceitação']]],
  ['K4', 'Operação e pessoas', [['K4.1', 'Gestão, operação técnica e curadoria'], ['K4.2', 'Suporte'], ['K4.3', 'Programa de formação'], ['K4.4', 'Tempo de formação dos usuários']]],
  ['K5', 'Governança e salvaguardas', [['K5.1', 'Gestão contratual'], ['K5.2', 'Privacidade e segurança'], ['K5.3', 'Supervisão e revisão de saídas'], ['K5.4', 'Auditoria e testes adversariais'], ['K5.5', 'Avaliação de resultados']]],
  ['K6', 'Mudança e saída', [['K6.1', 'Manutenção evolutiva'], ['K6.2', 'Reavaliação por mudança material'], ['K6.3', 'Transição e saída']]],
];
const NOME_K = {}, NOME_S = {}, K_DE_S = {};
ARVORE.forEach(([k, n, ss]) => { NOME_K[k] = n; ss.forEach(([s, ns]) => { NOME_S[s] = ns; K_DE_S[s] = k; }); });
// mapeamento de categorias antigas, para itens criados sem subcomponente
const MAPA_CAT = {
  'Acesso comercial': 'K2.1', 'Consumo de IA': 'K2.2', 'Infraestrutura': 'K2.5', 'Dados e RAG': 'K2.4', 'Dados': 'K3.2',
  'Integração': 'K3.1', 'Privacidade e conformidade': 'K3.3', 'Pessoas': 'K4.1', 'Governança': 'K5.1', 'Monitoramento': 'K5.3',
  'Avaliação': 'K5.5', 'Formação e mudança': 'K4.3', 'Mudança tecnológica': 'K6.2', 'Saída': 'K6.3', 'Outros': 'K4.1',
  'Condições de base': 'K1.1',
};

const SAL = {
  gestor_produto: 48000, eng_integracao: 45000, eng_ml: 60000, analista_privacidade: 42000,
  especialista_pedagogico: 36000, gestor_contrato: 36000, suporte_n1: 22000, analista_conteudo: 36000,
};
const SAL_NOME = {
  gestor_produto: 'Gestão de produto', eng_integracao: 'Engenharia de integração/infra', eng_ml: 'Engenharia de ML',
  analista_privacidade: 'Privacidade e segurança', especialista_pedagogico: 'Especialista pedagógico',
  gestor_contrato: 'Gestão contratual', suporte_n1: 'Suporte nível 1', analista_conteudo: 'Curadoria de conteúdo',
};

// ---------------------------------------------------------------- opções
// Modo de compatibilidade: reproduz os números da versão 1 do guia.
const OPC_COMPAT = { H: 3, correcoes: false, pi: 0, dep: 0, r: 0, sigmaCap: 1, doados: false, pSaida: 1, fechamento: 'saida', vidaUtil: 5, contPct: 0.05, delta: 0 };
// Modo padrão da versão 2: correções do economista e inflação ilustrativa de 2,5% a.a.
const OPC_PADRAO = { H: 3, correcoes: true, pi: 0.025, dep: 0, r: 0, sigmaCap: 1, doados: true, pSaida: 1, fechamento: 'saida', vidaUtil: 5, contPct: 0.05, delta: 0 };

// ---------------------------------------------------------------- v14: fases (BL3.1)
// Regra de fronteira entre as fases, tirada da semântica dos passos 3.1 e 4.1:
//  - Ano 0 = Prova de conceito ou piloto (o teste antes da compra, passos 2.0 a 2.6);
//  - Ano 1 = Implantação: a primeira etapa de uso real depois do teste (passo 3.1: "é o primeiro ano de uso depois do teste");
//  - Ano 2 em diante = Expansão: os anos em que o uso cresce até toda a rede (passos 4.1.1, 4.1.2 e a curva de adoção)
//    e, depois, os anos de operação em escala plena. A fronteira é por calendário, e não pelo ano em que a rede chega
//    ao total, para que todo horizonte de 2 anos ou mais tenha Expansão e as fases somem sempre o total.
// cfg.fasesAno (opcional) = ids por ano substitui a regra. Os ids são os de FASES (fluxo_dados.js).
const FASES_MOTOR = [['piloto', 'Prova de conceito ou piloto'], ['implantacao', 'Implantação'], ['expansao', 'Expansão']];
function faseDoAno(t, cfg) {
  const x = cfg && cfg.fasesAno;
  if (Array.isArray(x) && x.length) return x[Math.min(t, x.length - 1)];
  return t <= 0 ? 'piloto' : t === 1 ? 'implantacao' : 'expansao';
}

// v14 (BL3.7): pagamento único (implantação) × recorrente. Convenção desta ferramenta, a partir das etiquetas que
// cada linha já tem (subcomponente s, natureza nat, tipo orçamentário orc, tag):
//  - ÚNICO: orc = 'capital' (implantação, processamento inicial de documentos, compra de dispositivos); toda a
//    implantação e adaptação (K3.1 a K3.4: integração, conteúdo e configuração iniciais, conformidade inicial,
//    testes de aceitação); a ingestão inicial da base de conhecimento (K2.4, só no Ano 0); a formação inicial
//    (K4.3 e K4.4) na parte das pessoas novas na rede em cada ano; e a saída (K6.3) e o valor residual, no ano H.
//  - RECORRENTE: tudo o mais, em todos os anos: licenças (K2.1), consumo, computação, hospedagem (K2.2 a K2.5),
//    conectividade (K1.1), identidade (K1.3), operação, suporte e pessoal (K4.1, K4.2), reciclagem e reposição de
//    quem sai da rede (parte "reposição" de K4.3 e K4.4), governança e avaliação (K5), manutenção e reavaliação (K6.1,
//    K6.2) e a reposição de dispositivos (BL3.5, que é compra de capital, mas repetida).
//  - A natureza (D desembolso, C capacidade interna, O cedido) e o tipo de componente (F fixo, V variável, E escalonado)
//    não decidem a divisão: a mesma regra vale para as três naturezas. x.parte ('unico' | 'recorrente') ou x.vu
//    (parte única por ano, nas mesmas unidades de x.v) substituem a regra numa linha.
function unicoPorPadrao(x) { return x.orc === 'capital' || x.tag === 'implantacao' || /^K3\./.test(x.s || ''); }

function clone(o) { return JSON.parse(JSON.stringify(o)); }
function opcoes(cfg) { return Object.assign({}, OPC_PADRAO, cfg.opc || {}); }
function ano(arr, t) { if (!Array.isArray(arr)) return arr; return arr.length ? arr[Math.min(t, arr.length - 1)] : 0; }
function custoChamada(Tin, Tout, Pin, Pout, h = 0, Pcache = null) {
  if (Pcache == null) Pcache = 0.1 * Pin;
  return (Tin * (1 - h) * Pin + Tin * h * Pcache + Tout * Pout) / 1e6;
}
function salario(cfg, chave) {
  if (typeof chave === 'number') return chave;
  const tab = (cfg.salarios || {});
  return tab[chave] != null ? tab[chave] : SAL[chave];
}
// v9: multiplicador de adaptação ao contexto (cfg.adaptacao = { fK31, fK32 }), neutro quando ausente.
// Escala K3.1 (integração e desenvolvimento) e K3.2 (conteúdo e configuração iniciais).
function fatorAdapt(cfg, s) {
  const a = cfg && cfg.adaptacao;
  if (!a) return 1;
  if (s === 'K3.1') return a.fK31 != null ? +a.fK31 : 1;
  if (s === 'K3.2') return a.fK32 != null ? +a.fK32 : 1;
  return 1;
}
function arquitetura(cfg) {
  if (cfg.ow && cfg.ow.ativo) return 'ow';
  if (cfg.api && cfg.api.ativo) return 'api';
  if (cfg.saas && cfg.saas.ativo) return 'saas';
  return 'outra';
}

// v14: pessoas formadas por ano (K4.4) e, destas, as novas na rede (formação inicial, pagamento único); o resto é
// reciclagem e reposição de quem sai (recorrente). Os números de pessoas formadas são os da v13.
//  - modo 'razao': as pessoas formadas são E ÷ razão a cada ano (v13); novas = aumento do estoque.
//    f.rotEstoque (v14, só quando a pessoa informa a rotatividade no passo 4.1) passa a contar o estoque como
//    nas demais: novas + rotatividade × estoque do ano anterior.
//  - modo 'ativos': novas = aumento dos usuários ativos; a reposição é f.rot × usuários do ano anterior (v13).
function formacaoPessoas(cfg, o, U, d, T) {
  const f = cfg.formacaoTempo;
  if (!f || !f.ativo) return null;
  let pessoas, novos;
  if (f.modo === 'razao') {
    const St = T.map(t => ano(d.E, t) / f.razao);
    novos = St.map((n, t) => t === 0 ? n : Math.max(n - St[t - 1], 0));
    pessoas = f.rotEstoque != null ? St.map((n, t) => t === 0 ? n : novos[t] + f.rotEstoque * St[t - 1]) : St;
  } else {
    pessoas = T.map(t => {
      if (t === 0) return U[0];
      if (t === 1 && !o.correcoes) return U[1];                     // versão 1: reconta o piloto
      return Math.max(U[t] - U[t - 1], 0) + f.rot * U[t - 1];       // versão 2: estoque formado
    });
    novos = T.map(t => t === 0 ? U[0] : (t === 1 && !o.correcoes) ? U[1] : Math.max(U[t] - U[t - 1], 0));
  }
  // v11: fator sobre as pessoas formadas (papéis marcados na 2.5.1), neutro quando ausente
  if (f.fator != null) { pessoas = pessoas.map(n => n * (+f.fator)); novos = novos.map(n => n * (+f.fator)); }
  return { pessoas, novos };
}

// ---------------------------------------------------------------- cálculo das linhas
function calcular(cfg) {
  const o = opcoes(cfg);
  const H = o.H, T = Array.from({ length: H + 1 }, (_, t) => t);
  const m = Object.assign({ fx: 1, pessoas: 1, preco: 1 }, cfg.mult || {});
  const d = cfg.demanda;
  const fxT = T.map(t => m.fx * Math.pow(1 + o.dep, t));          // trajetória cambial dos itens em US$
  const infl = T.map(t => o.correcoes ? Math.pow(1 + o.pi, t) : 1); // preços correntes de itens locais
  const tend = T.map(t => Math.pow(1 - o.delta, t));               // tendência de preço de modelos/computação
  const L = [];
  const add = (x) => {
    const moeda = x.moeda || 'LOC';
    const fator = T.map(t => (moeda === 'USD' ? fxT[t] : infl[t]));
    const base = T.map(t => +(x.v[t] || 0));
    const v = T.map(t => base[t] * fator[t]);
    const q = x.q ? T.map(t => +(x.q[t] || 0)) : null;
    const p = (x.p && q) ? T.map(t => (q[t] ? v[t] / q[t] : (+(x.p[t] || 0)) * fator[t])) : null;
    const vu = x.vu ? T.map(t => (+x.vu[t] || 0) * fator[t]) : ((x.parte ? x.parte === 'unico' : unicoPorPadrao(x)) ? v.slice() : T.map(() => 0));
    L.push({ vu, id: x.id || x.nome, nome: x.nome, s: x.s, k: K_DE_S[x.s], cat: x.cat || NOME_K[K_DE_S[x.s]], nat: x.nat || 'D', comp: x.comp || 'F', moeda,
      orc: x.orc || 'corrente', pagador: x.pagador || 'inst', fonte: x.fonte || 'ilustrativo', un: x.un || '', tag: x.tag || '', q, p, v, fx: moeda === 'USD' });
  };
  const U = T.map(t => ano(d.E, t) * ano(d.adocao, t));
  const I = T.map(t => U[t] * d.s * d.i * ano(d.meses, t));
  const extra = {};
  // v14: formação inicial × reposição. Parte das pessoas novas em cada ano; o programa de formação (K4.3) usa a mesma
  // proporção do ano e, sem o tempo de formação (K4.4), só o Ano 0 é inicial.
  const fm = formacaoPessoas(cfg, o, U, d, T);
  const fracNovos = T.map(t => fm ? (fm.pessoas[t] > 0 ? Math.min(1, fm.novos[t] / fm.pessoas[t]) : (t === 0 ? 1 : 0)) : (t === 0 ? 1 : 0));

  // ---- K2.1 licenças
  if (cfg.saas && cfg.saas.ativo) {
    const s = cfg.saas;
    const preco = T.map(t => t === 0 ? s.preco : s.preco * Math.pow(1 + s.reajuste, t - 1));
    const qtdMes = T.map(t => ano(s.qtd, t) * ano(s.mesesCobr, t));
    add({ nome: 'Licenças SaaS', s: 'K2.1', cat: 'Acesso comercial', moeda: 'USD', comp: 'F', tag: 'licenca', un: 'licença-mês',
      q: qtdMes, p: preco, v: T.map(t => qtdMes[t] * preco[t] * ano(s.fatorPreco, t)) });
    if (o.doados) {
      const doado = T.map(t => qtdMes[t] * preco[t] * (1 - ano(s.fatorPreco, t)));
      if (doado.some(x => x > 0)) add({ nome: 'Licenças cedidas sem custo (valor de mercado)', s: 'K2.1', cat: 'Acesso comercial', moeda: 'USD', nat: 'O', pagador: 'fornecedor', tag: 'doado', un: 'licença-mês', v: doado });
    }
    extra.precoLic = preco;
  }
  // ---- K2.2 consumo de modelos
  if (cfg.api && cfg.api.ativo) {
    const a = cfg.api, prm = m.preco;
    const cMain = a.k * custoChamada(a.Tin, a.Tout, a.Pin * prm, a.Pout * prm, a.h);
    const cGuard = a.auxAtivo ? custoChamada(a.TinAux, a.ToutAux, a.PinAux * prm, a.PoutAux * prm) : 0;
    const cEmb = (cfg.rag && cfg.rag.ativo) ? a.Tq * cfg.rag.Pemb / 1e6 : 0;
    const cRr = a.PrerankMil / 1000;
    add({ nome: 'Modelo principal (API)', s: 'K2.2', cat: 'Consumo de IA', moeda: 'USD', comp: 'V', tag: 'consulta', un: 'interação',
      q: I, p: T.map(() => cMain), v: T.map(t => I[t] * cMain * tend[t]) });
    if (cGuard + cEmb + cRr > 0)
      add({ nome: 'Chamadas auxiliares (segurança, embeddings de consulta, reranking)', s: 'K2.2', cat: 'Consumo de IA', moeda: 'USD', comp: 'V', tag: 'consulta', un: 'interação',
        q: I, p: T.map(() => cGuard + cEmb + cRr), v: T.map(t => I[t] * (cGuard + cEmb + cRr) * tend[t]) });
    extra.cMain = cMain; extra.cAux = cGuard + cEmb + cRr; extra.cInt = cMain + cGuard + cEmb + cRr;
  }
  // ---- K2.4 dados e RAG
  if (cfg.rag && cfg.rag.ativo) {
    const r = cfg.rag;
    const corpus = r.docs * r.tokDoc;
    const tok = T.map(t => t === 0 ? corpus : (r.docsNovos * r.tokDoc + r.reindexAno * (corpus + t * r.docsNovos * r.tokDoc)));
    add({ nome: 'Embeddings de ingestão e reindexação', s: 'K2.4', cat: 'Dados e RAG', moeda: 'USD', comp: 'V', tag: 'ingestao', un: 'milhão de tokens',
      q: tok.map(x => x / 1e6), p: T.map(() => r.Pemb), v: tok.map((x, t) => x * r.Pemb / 1e6 * tend[t]),
      vu: tok.map((x, t) => t === 0 ? x * r.Pemb / 1e6 * tend[t] : 0) });   // v14: o corpus inicial é único; a reindexação é recorrente
    if (r.paginas > 0)
      add({ nome: 'Processamento inicial de documentos (OCR, extração)', s: 'K3.2', cat: 'Dados e RAG', moeda: 'USD', comp: 'F', orc: 'capital', un: 'página',
        q: T.map(t => t === 0 ? r.paginas : 0), p: T.map(() => r.Ppag), v: T.map(t => t === 0 ? r.paginas * r.Ppag : 0) });
  }
  // ---- K2.3 computação própria (pesos abertos)
  if (cfg.ow && cfg.ow.ativo) {
    const ow = cfg.ow, prm = m.preco;
    const G = [], horas = [], rpsA = [];
    T.forEach(t => {
      const Hp = ow.hPicoMes * ano(d.meses, t);
      const rps = Hp > 0 ? I[t] * ow.fPico / (Hp * 3600) * ow.phi : 0;
      let g = Math.ceil(rps * ow.Tout / (ow.theta * ow.u)) + ow.red;
      g = Math.max(g, ow.minFora);
      const h = t === 0 ? g * ano(d.meses, 0) * 730 : g * Hp + ow.minFora * (8760 - Hp);
      G.push(g); horas.push(h); rpsA.push(rps);
    });
    add({ nome: 'GPUs de inferência (horas × preço)', s: 'K2.3', cat: 'Infraestrutura', moeda: 'USD', comp: 'E', tag: 'gpu', un: 'hora de GPU',
      q: horas, p: T.map(() => ow.Pgpu * prm), v: horas.map((h, t) => h * ow.Pgpu * prm * tend[t]) });
    if (ow.nSeg > 0) {
      const hs = T.map(t => ow.nSeg * (t === 0 ? ano(d.meses, 0) * 730 : 8760));
      add({ nome: 'Classificador de segurança (instâncias dedicadas)', s: 'K2.3', cat: 'Infraestrutura', moeda: 'USD', comp: 'F', tag: 'plataforma_anual', un: 'hora de instância',
        q: hs, p: T.map(() => ow.Pseg * prm), v: hs.map((h, t) => h * ow.Pseg * prm * tend[t]) });
    }
    extra.G = G; extra.horasGpu = horas; extra.rps = rpsA;
  }
  // ---- serviços mensais
  (cfg.mensais || []).forEach(x => {
    const meses = T.map(t => t === 0 ? x.mesesY0 : 12);
    add({ nome: x.nome, s: x.s || MAPA_CAT[x.cat] || 'K2.5', cat: x.cat, moeda: x.fx === false ? 'LOC' : 'USD', comp: 'F', tag: 'mensal', un: 'mês',
      q: meses, p: T.map(() => x.valor), v: meses.map(mm => mm * x.valor) });
  });
  // ---- implantação e manutenção (com o fator de adaptação; a manutenção acompanha a implantação)
  const impl = (cfg.implantacao || []).map(x => Object.assign({}, x, { valor: x.valor * fatorAdapt(cfg, x.s || 'K3.1') }));
  impl.forEach(x => {
    add({ nome: x.nome, s: x.s || 'K3.1', cat: x.cat, moeda: x.moeda || 'LOC', orc: 'capital', comp: 'F', tag: 'implantacao', v: T.map(t => t === 0 ? x.valor : 0) });
    if (x.manutPct > 0) add({ nome: x.nomeManut || ('Manutenção: ' + x.nome.toLowerCase()), s: x.sManut || 'K6.1', cat: x.cat, moeda: x.moeda || 'LOC', comp: 'F', tag: 'manutencao',
      v: T.map(t => t === 0 ? 0 : x.valor * x.manutPct) });
  });
  // ---- itens por ano
  (cfg.itens || []).forEach(x => {
    const s = x.s || MAPA_CAT[x.cat] || 'K4.1', fa = fatorAdapt(cfg, s);
    // v11: itens podem trazer quantidade (q), preço (p), unidade (un), etiqueta (tag) e pagador; neutro quando ausentes
    add({ nome: x.nome, s, cat: x.cat, nat: x.nat || 'D', comp: x.comp || 'F', moeda: x.moeda || 'LOC', orc: x.orc || 'corrente',
      prob: x.prob, v: T.map(t => ano(x.v, t) * fa), q: x.q ? T.map(t => ano(x.q, t)) : undefined, p: x.p ? T.map(t => ano(x.p, t)) : undefined,
      un: x.un, tag: x.tag, pagador: x.pagador, parte: x.parte,
      vu: s === 'K4.3' && !x.parte ? T.map(t => ano(x.v, t) * fa * fracNovos[t]) : undefined });
    // v14 (BL3.5): reposição dos dispositivos comprados neste caso a cada n anos (cfg.reposicao.ciclo = 3, 4 ou 5; ausente = sem reposição,
    // como na v13). Um lote comprado no ano s é recomprado em s+n, s+2n… até o horizonte, à quantidade e ao preço unitário do lote.
    // É compra de capital, mas repetida: conta como recorrente.
    const ciclo = Math.round(+((cfg.reposicao || {}).ciclo) || 0);
    if (ciclo >= 1 && x.tag === 'dispositivo' && x.q && x.p) {
      const q0 = T.map(t => ano(x.q, t));
      const qr = T.map(t => { let n = 0; for (let k = t - ciclo; k >= 0; k -= ciclo) n += q0[k]; return n; });
      if (qr.some(n => n > 0))
        add({ nome: 'Reposição de dispositivos (a cada ' + ciclo + ' anos)', s, cat: x.cat, nat: x.nat || 'D', comp: 'F', moeda: x.moeda || 'LOC', orc: 'capital',
          q: qr, p: T.map(t => ano(x.p, t)), un: x.un, tag: 'reposicao_dispositivo', parte: 'recorrente', v: qr.map((n, t) => n * ano(x.p, t)) });
    }
  });
  // ---- pessoas
  (cfg.pessoas || []).forEach(pp => {
    const sp = pp.s || MAPA_CAT[pp.cat] || 'K4.1', fa = fatorAdapt(cfg, sp);
    const fte = T.map(t => pp.partes.reduce((s, [sal, f]) => s + ano(f, t) * fa, 0));
    const custo = T.map(t => pp.partes.reduce((s, [sal, f]) => s + salario(cfg, sal) * ano(f, t) * fa, 0) * m.pessoas);
    add({ nome: pp.nome, s: sp, cat: pp.cat || 'Pessoas', nat: pp.nat || 'C', comp: 'F', moeda: 'LOC', tag: pp.tag, un: 'FTE-ano',
      q: fte, p: T.map(t => fte[t] ? custo[t] / fte[t] : 0), v: custo });
  });
  // ---- suporte escalonado
  if (cfg.suporte && cfg.suporte.ativo) {
    const s = cfg.suporte;
    const fte = U.map((u, t) => { if (!(s.anos || [1, 2, 3]).includes(t) && !(t > 3 && (s.anos || []).includes(3))) return 0; for (const [lim, f] of s.faixas) if (u < lim) return f; return s.acima; });
    add({ nome: s.nome, s: 'K4.2', cat: 'Pessoas', nat: s.nat || 'C', comp: 'E', moeda: 'LOC', un: 'FTE-ano', q: fte, p: T.map(() => salario(cfg, s.sal) * m.pessoas),
      v: fte.map(f => f * salario(cfg, s.sal) * m.pessoas) });
  }
  // ---- tempo de formação (estoque de formados)
  if (cfg.formacaoTempo && cfg.formacaoTempo.ativo) {
    const f = cfg.formacaoTempo;
    const pessoas = fm.pessoas;
    if (pessoas.some(n => n > 0) || !(f.extras || []).length)
      add({ nome: f.nome, s: 'K4.4', cat: 'Formação e mudança', nat: 'C', comp: 'V', moeda: 'LOC', un: 'pessoa formada',
        q: pessoas, p: T.map(() => f.horas * f.custoHora * m.pessoas), v: pessoas.map(n => n * f.horas * f.custoHora * m.pessoas),
        vu: fm.novos.map(n => n * f.horas * f.custoHora * m.pessoas) });
    // v11: outros papéis formados (gestores, equipe técnica...), com as mesmas horas e o mesmo custo-hora
    (f.extras || []).forEach(x => {
      const q = T.map(t => +ano(x.q, t) || 0);
      // v14: x.novos (pessoas novas por ano, vindas de cfgDoCaso) dá a parte inicial; sem ele, só o Ano 0 é inicial
      const nov = x.novos ? T.map(t => +ano(x.novos, t) || 0) : q.map((n, t) => t === 0 ? n : 0);
      add({ nome: x.nome, s: 'K4.4', cat: 'Formação e mudança', nat: 'C', comp: 'V', moeda: 'LOC', un: 'pessoa formada', tag: 'formacao_papel',
        q, p: T.map(() => f.horas * f.custoHora * m.pessoas), v: q.map(n => n * f.horas * f.custoHora * m.pessoas),
        vu: nov.map(n => n * f.horas * f.custoHora * m.pessoas) });
    });
  }

  // ---- saída ao final do horizonte
  const S = [];
  const sa = cfg.saida || {};
  const addS = (nome, nat, moeda, valor) => S.push({ nome, s: 'K6.3', k: 'K6', cat: 'Saída', nat, moeda, fx: moeda === 'USD', valor: (+valor || 0) * (moeda === 'USD' ? 1 : infl[H]) });
  (sa.itens || []).forEach(x => addS(x.nome, x.nat || 'D', x.moeda || 'LOC', x.valor));
  const impl0 = impl[0];
  if (sa.reconstrucaoPct > 0 && impl0) addS('Reconstrução de integrações e aplicação (' + Math.round(sa.reconstrucaoPct * 100) + '% da implantação)', 'D', 'LOC', sa.reconstrucaoPct * impl0.valor);
  if (cfg.rag && cfg.rag.ativo && sa.reindexar) {
    const r = cfg.rag;
    S.push({ nome: 'Reindexação e migração da base de conhecimento', s: 'K6.3', k: 'K6', cat: 'Saída', nat: 'D', moeda: 'USD', fx: true,
      valor: (r.docs * r.tokDoc + H * r.docsNovos * r.tokDoc) * r.Pemb / 1e6 * fxT[H] + (sa.reindexFixo || 0) * infl[H] });
  }
  if (sa.mesesParalelo > 0) {
    const yH = tag => L.filter(l => l.tag === tag && l.nat !== 'O').reduce((s, l) => s + l.v[H], 0);
    const mensalPlat = (cfg.mensais || []).filter(x => x.plataforma !== false).reduce((s, x) => s + x.valor * (x.fx === false ? infl[H] : fxT[H]), 0);
    const mH = ano(d.meses, H);
    const mensal = yH('licenca') / 12 + (mH > 0 ? yH('consulta') / mH : 0) + (yH('gpu') + yH('plataforma_anual')) / 12 + mensalPlat;
    S.push({ nome: 'Operação paralela (' + sa.mesesParalelo + (sa.mesesParalelo > 1 ? ' meses' : ' mês') + ' do custo de plataforma)', s: 'K6.3', k: 'K6', cat: 'Saída', nat: 'D', moeda: 'USD', fx: true, valor: sa.mesesParalelo * mensal });
  }
  if (sa.horasRetreino > 0) addS('Tempo de retreinamento dos usuários', 'C', 'LOC', U[H] * sa.horasRetreino * sa.custoHora * m.pessoas);
  if (sa.internos && sa.internos.length) addS('Tempo interno de coordenação e validação', 'C', 'LOC', sa.internos.reduce((s, [sal, fte]) => s + salario(cfg, sal) * fte, 0) * m.pessoas);

  // ---- v9: uso cedido sem custo (API e pesos abertos): parte do consumo, computação, dados e hospedagem
  // paga por terceiro (doação, piloto gratuito, tecnologia pública ou outra esfera de governo).
  // cfg.cedidoUso = [c0, c1 … cH], fração de 0 a 1 por ano. A parte cedida sai do desembolso e,
  // no modo com doados, entra na conta econômica como linha "O" a valor de mercado.
  // Aplicado depois da saída: a operação paralela na saída é valorada pelo custo integral da plataforma.
  if (Array.isArray(cfg.cedidoUso) && cfg.cedidoUso.length) {
    const fr = T.map(t => Math.min(1, Math.max(0, +ano(cfg.cedidoUso, t) || 0)));
    const novas = [];
    L.forEach(l => {
      if (!['K2.2', 'K2.3', 'K2.4', 'K2.5'].includes(l.s) || l.nat !== 'D') return;
      const vo = T.map(t => l.v[t] * fr[t]);
      if (!vo.some(x => x > 0)) return;
      const shU = T.map(t => l.v[t] ? Math.min(1, l.vu[t] / l.v[t]) : 0);   // v14: a parte única acompanha a proporção
      l.v = T.map(t => l.v[t] - vo[t]);
      l.vu = T.map(t => l.v[t] * shU[t]);
      if (o.doados) novas.push({ id: 'cedido: ' + l.id, nome: 'Uso cedido sem custo (valor de mercado)', s: l.s, k: l.k, cat: l.cat, nat: 'O', comp: l.comp, moeda: l.moeda,
        orc: l.orc, pagador: 'terceiro', fonte: l.fonte, un: l.un, tag: 'doado', q: null, p: null, v: vo, vu: vo.map((x, t) => x * shU[t]), fx: l.fx });
    });
    novas.forEach(x => L.push(x));
  }

  return { cfg, opc: o, H, anos: T, fases: T.map(t => faseDoAno(t, cfg)), U, I, E: T.map(t => ano(d.E, t)), linhas: L, saida: S, extra, fxT, infl, impl };
}

// ---------------------------------------------------------------- resumo (compatível com a versão 1)
function resumo(r) {
  const T = r.anos;
  const LL = r.linhas.filter(l => l.nat !== 'O');
  const soma = f => T.map(t => LL.filter(f).reduce((s, l) => s + l.v[t], 0));
  const tot = soma(() => true), ext = soma(l => l.nat === 'D'), cap = soma(l => l.nat === 'C'), fx = soma(l => l.fx);
  const saida = r.saida.reduce((s, l) => s + l.valor, 0);
  const saidaExt = r.saida.filter(l => l.nat === 'D').reduce((s, l) => s + l.valor, 0);
  const semSaida = tot.reduce((a, b) => a + b, 0);
  const porCat = {};
  LL.forEach(l => { porCat[l.cat] = (porCat[l.cat] || 0) + l.v.reduce((a, b) => a + b, 0); });
  return { tot, ext, cap, fx, saida, saidaExt, semSaida, tco: semSaida + saida, porCat };
}

// ---------------------------------------------------------------- avaliação em duas contas
// Conta econômica: preços constantes do Ano 0 (deflacionados por π), inclui capacidade interna (×σ) e doados,
// saída ponderada pela probabilidade, descontada à taxa real r.
// Conta orçamentária: preços correntes, só desembolso (D); saída registrada à parte.
function avaliar(r) {
  const o = r.opc, T = r.anos, H = r.H;
  const defl = T.map(t => o.correcoes ? Math.pow(1 + o.pi, t) : 1);
  const disc = T.map(t => Math.pow(1 + o.r, -t));
  const eco = l => T.map(t => l.v[t] / defl[t] * (l.nat === 'C' ? o.sigmaCap : 1) * (l.prob != null ? l.prob : 1));
  const linhas = r.linhas.map(l => {
    const e = eco(l);
    return Object.assign({}, l, { eco: e, ecoVP: e.reduce((s, x, t) => s + x * disc[t], 0), fin: l.nat === 'D' ? l.v.slice() : T.map(() => 0) });
  });
  const vr = (o.fechamento === 'continuidade') ? (r.impl || r.cfg.implantacao || []).reduce((s, x) => s + x.valor * Math.max(0, (o.vidaUtil - H) / o.vidaUtil), 0) : 0;
  const saida = r.saida.map(s => Object.assign({}, s, {
    eco: o.fechamento === 'continuidade' ? 0 : s.valor / defl[H] * (s.nat === 'C' ? o.sigmaCap : 1) * o.pSaida,
    ecoVP: o.fechamento === 'continuidade' ? 0 : s.valor / defl[H] * (s.nat === 'C' ? o.sigmaCap : 1) * o.pSaida * disc[H],
  }));
  const ecoAno = T.map(t => linhas.reduce((s, l) => s + l.eco[t], 0));
  const finAno = T.map(t => linhas.reduce((s, l) => s + l.fin[t], 0));
  const saidaEco = saida.reduce((s, x) => s + x.ecoVP, 0);
  const vrVP = vr * disc[H];
  const ctEco = linhas.reduce((s, l) => s + l.ecoVP, 0) + saidaEco - vrVP;
  // agregação por componente e subcomponente (conta econômica, VP)
  const porS = {}, porK = {};
  ARVORE.forEach(([k, , ss]) => { porK[k] = 0; ss.forEach(([s]) => { porS[s] = 0; }); });
  linhas.forEach(l => { porS[l.s] += l.ecoVP; porK[l.k] += l.ecoVP; });
  saida.forEach(x => { porS[x.s] += x.ecoVP; porK[x.k] += x.ecoVP; });
  if (vrVP) { porS['K6.3'] -= vrVP; porK['K6'] -= vrVP; }
  const porSano = {};
  ARVORE.forEach(([k, , ss]) => ss.forEach(([s]) => { porSano[s] = T.map(t => linhas.filter(l => l.s === s).reduce((a, l) => a + l.eco[t], 0)); }));
  // facetas (conta econômica, VP)
  const faceta = f => linhas.filter(f).reduce((s, l) => s + l.ecoVP, 0);
  const fac = {
    desembolso: faceta(l => l.nat === 'D') + saida.filter(x => x.nat === 'D').reduce((s, x) => s + x.ecoVP, 0),
    capacidade: faceta(l => l.nat === 'C') + saida.filter(x => x.nat === 'C').reduce((s, x) => s + x.ecoVP, 0),
    doado: faceta(l => l.nat === 'O'),
    usd: faceta(l => l.moeda === 'USD') + saida.filter(x => x.moeda === 'USD').reduce((s, x) => s + x.ecoVP, 0),
    variavel: faceta(l => l.comp === 'V' || l.tag === 'gpu'),
    capital: faceta(l => l.orc === 'capital'),
  };
  const av = { r, defl, disc, linhas, saida, ecoAno, finAno, ctEco, saidaEco, vr: vrVP, porS, porK, porSano, fac,
    saidaFin: r.saida.filter(x => x.nat === 'D').reduce((s, x) => s + x.valor, 0), saidaTotalNominal: r.saida.reduce((s, x) => s + x.valor, 0) };
  av.fases = decomporFases(av);      // v14 (BL3.1, BL3.7): custo e pessoas por fase, único × recorrente
  av.tco = indicadoresTCO(av);       // v14 (BL5.4): indicadores do custo total
  return av;
}

// ---------------------------------------------------------------- v14: custo por fase (BL3.1) e único × recorrente (BL3.7)
// Resultado de avaliar(): av.fases = {
//   ids: ['piloto','implantacao','expansao'], faseAno: [id por ano], total (= ctEco), unico, recorrente (valor presente, conta econômica),
//   unicoAno[t], recorrenteAno[t] (conta econômica, preços constantes, sem desconto),
//   porFase: { <id>: { id, nome, anos: [t…], total, nominal, unico, recorrente, porCamada: {1..7}, porK: {K1..K6},
//     pessoas (máx. de pessoas que usariam: E), usuarios (máx. de usuários ativos: U), anosPessoa (Σ E), anosUsuario (Σ U),
//     aprendizes, professores (máx. alcançados no ano), anosAprendiz, anosProfessor (Σ) } } }
// Valores em valor presente na conta econômica (os mesmos de ctEco); a soma das fases é exatamente ctEco.
// A saída (K6.3) e o valor residual caem na fase do ano H e são pagamento único.
function papeisDe(r) {
  const d = r.cfg.demanda || {}, un = r.cfg.unidade;
  let fA = d.fAprendiz, fP = d.fProfessor;
  if (fA == null && fP == null) { fA = un === 'estudante' ? 1 : null; fP = un === 'professor' ? 1 : null; }
  return { fA: fA == null ? null : +fA, fP: fP == null ? null : +fP };
}
function decomporFases(av) {
  const r = av.r, T = r.anos, H = r.H;
  const z7 = () => { const z = {}; for (let i = 1; i <= 7; i++) z[i] = 0; return z; };
  const zK = () => { const z = {}; ARVORE.forEach(([k]) => { z[k] = 0; }); return z; };
  const faseAno = T.map(t => faseDoAno(t, r.cfg));
  const { fA, fP } = papeisDe(r);
  const P = {};
  FASES_MOTOR.forEach(([id, nome]) => {
    const anos = T.filter(t => faseAno[t] === id);
    const sum = f => anos.reduce((s, t) => s + f(t), 0), max = f => Math.max(0, ...anos.map(f));
    P[id] = { id, nome, anos, total: 0, nominal: 0, unico: 0, recorrente: 0, porCamada: z7(), porK: zK(),
      pessoas: max(t => r.E[t]), usuarios: max(t => r.U[t]), anosPessoa: sum(t => r.E[t]), anosUsuario: sum(t => r.U[t]),
      aprendizes: fA == null ? null : max(t => r.E[t] * fA), anosAprendiz: fA == null ? null : sum(t => r.E[t] * fA),
      professores: fP == null ? null : max(t => r.E[t] * fP), anosProfessor: fP == null ? null : sum(t => r.E[t] * fP) };
  });
  const unicoAno = T.map(() => 0), recAno = T.map(() => 0);
  av.linhas.forEach(l => {
    const c = CAMADA_DE_S[l.s] || 7;
    T.forEach(t => {
      if (!l.eco[t]) return;
      const sh = l.v[t] ? Math.min(1, Math.max(0, (l.vu ? l.vu[t] : 0) / l.v[t])) : 0;
      const pv = l.eco[t] * av.disc[t], f = P[faseAno[t]];
      f.total += pv; f.unico += pv * sh; f.recorrente += pv * (1 - sh);
      f.nominal += l.eco[t] * av.defl[t]; f.porCamada[c] += pv; f.porK[l.k] += pv;
      unicoAno[t] += l.eco[t] * sh; recAno[t] += l.eco[t] * (1 - sh);
    });
  });
  const fH = P[faseAno[H]];
  av.saida.forEach(x => {
    const c = CAMADA_DE_S[x.s] || 7;
    fH.total += x.ecoVP; fH.unico += x.ecoVP; fH.nominal += x.eco * av.defl[H]; fH.porCamada[c] += x.ecoVP; fH.porK[x.k] += x.ecoVP;
    unicoAno[H] += x.eco;
  });
  if (av.vr) {   // valor residual (fechamento "continuidade"): abate K6.3 no ano H
    fH.total -= av.vr; fH.unico -= av.vr; fH.nominal -= av.vr / av.disc[H] * av.defl[H]; fH.porCamada[CAMADA_DE_S['K6.3']] -= av.vr; fH.porK.K6 -= av.vr;
    unicoAno[H] -= av.vr / av.disc[H];
  }
  const ids = FASES_MOTOR.map(x => x[0]);
  const soma = k => ids.reduce((s, id) => s + P[id][k], 0);
  return { ids, faseAno, porFase: P, total: soma('total'), nominal: soma('nominal'), unico: soma('unico'), recorrente: soma('recorrente'), unicoAno, recorrenteAno: recAno };
}

// ---------------------------------------------------------------- v14 (BL5.4): indicadores do custo total
// av.tco = { tcoDescontado (= ctEco), tcoNominal (preços correntes, sem desconto), r, n, cae (custo anual equivalente),
//   anosAprendiz, anosProfessor (pessoas-ano alcançadas, sem desconto), custoPorAprendizAno, custoPorProfessorAno (null se o
//   caso não tem esse papel), pRecorrente (parte recorrente do custo total), anual: custo anual em regime }.
// Convenções:
//  - TCO descontado = ctEco (preços constantes do Ano 0, descontado à taxa real r; sem desconto quando r = 0). TCO nominal =
//    a mesma conta em preços correntes (reinflada por π) e sem desconto, com a saída pela mesma ponderação.
//  - Custo anual equivalente (CAE): VP·r/(1−(1+r)^−n), com n = H + 1 anos de custo (Ano 0 a H); com r = 0, VP/n (função cae()).
//  - Custo por aprendiz (professor) por ano: custo total ÷ pessoas-ano alcançadas, contando as que usariam em cada ano (E, e não
//    só as ativas) e o ano inteiro, também no Ano 0. Como o custo total é valor presente, o denominador é descontado com o mesmo
//    fator (custo nivelado, como o índice de custo unitário); com r = 0 é a divisão simples.
//    Aprendizes = estudantes; professores = os professores das turmas (E ÷ 25) ou os servidores professores do caso.
//  - Parte recorrente = recorrente ÷ total (a saída entra como pagamento único).
//  - Custo anual em regime: o primeiro ano da Expansão em que o uso chega ao patamar final (primeiro t ≥ 2 com E[t] = E[H]); se a
//    rede não chega à escala plena no horizonte (cfg.demanda.Ealvo maior que E[H]), é o último ano (H), e isso é sinalizado.
//    Se o caso tem financiamento externo (linhas de uso cedido, nat 'O') que ainda vale nesse ano, vale o primeiro ano depois que
//    ele acaba (rótulo 'depois_do_financiamento'); se ele dura até o fim do horizonte, vale o ano em regime com o aviso
//    'financiamento_ate_o_fim'. Em cada ano: custo econômico (preços constantes e correntes) e desembolso da rede (conta
//    orçamentária, preços correntes).
function anosCedidos(av) {
  const r = av.r, T = r.anos, c = r.cfg;
  const viaLinhas = T.map(t => av.linhas.some(l => l.nat === 'O' && l.v[t] > 0));
  if (viaLinhas.some(Boolean)) return viaLinhas;
  // modo sem os doados na conta (opc.doados = false): lê da configuração
  return T.map(t => (Array.isArray(c.cedidoUso) && +ano(c.cedidoUso, t) > 0) || (c.saas && c.saas.ativo && Array.isArray(c.saas.fatorPreco) && +ano(c.saas.fatorPreco, t) < 1 && ano(c.saas.qtd, t) > 0));
}
function indicadoresTCO(av) {
  const r = av.r, o = r.opc, H = r.H, T = r.anos, f = av.fases, n = H + 1;
  const { fA, fP } = papeisDe(r);
  const den = (fx) => T.reduce((s, t) => s + r.E[t] * fx * av.disc[t], 0);
  const anosAprend = fA == null ? null : T.reduce((s, t) => s + r.E[t] * fA, 0), anosProf = fP == null ? null : T.reduce((s, t) => s + r.E[t] * fP, 0);
  // ano em regime
  const Efinal = r.E[H];
  let base = H;
  for (let t = Math.min(2, H); t <= H; t++) if (r.E[t] >= Efinal) { base = t; break; }
  const Ealvo = r.cfg.demanda && r.cfg.demanda.Ealvo != null ? +r.cfg.demanda.Ealvo : Efinal;
  const escalaPlena = Efinal >= Ealvo - 1e-9;
  if (!escalaPlena) base = H;
  const ced = anosCedidos(av);
  let ultimoCedido = -1; ced.forEach((c, t) => { if (c) ultimoCedido = t; });
  let ano = base, rotulo = escalaPlena ? 'primeiro_ano_em_escala_plena' : 'ultimo_ano_do_horizonte', externo = null;
  if (ultimoCedido >= base) {
    if (ultimoCedido + 1 <= H) { ano = ultimoCedido + 1; rotulo = 'depois_do_financiamento'; externo = { encerraEm: ultimoCedido }; }
    else { rotulo = 'financiamento_ate_o_fim'; externo = { encerraEm: null }; }
  }
  const unicoEco = f.unicoAno[ano];
  const anual = { ano, fase: f.faseAno[ano], rotulo, financiamentoExterno: externo, escalaPlenaNoHorizonte: escalaPlena,
    eco: av.ecoAno[ano], nominal: av.ecoAno[ano] * av.defl[ano], desembolso: av.finAno[ano], unico: unicoEco, recorrente: av.ecoAno[ano] - unicoEco };
  return { tcoDescontado: av.ctEco, tcoNominal: f.nominal, r: o.r, n, cae: cae(av.ctEco, o.r, n),
    anosAprendiz: anosAprend, anosProfessor: anosProf,
    custoPorAprendizAno: fA == null || !den(fA) ? null : av.ctEco / den(fA),
    custoPorProfessorAno: fP == null || !den(fP) ? null : av.ctEco / den(fP),
    pRecorrente: av.ctEco ? f.recorrente / av.ctEco : 0, anual };
}

// ---------------------------------------------------------------- v9: componentes de custo × sete camadas
// Correspondência entre os subcomponentes da árvore (K1 a K6) e as sete camadas do quadro de custo total
// em camadas de Krueger e Jackson (2026, p. 11). O documento não quantifica nem distribui custos por camada:
// esta correspondência é uma convenção desta ferramenta (a saída, K6.3, não consta no documento).
const CAMADA_DE_S = {
  'K1.1': 3, 'K1.2': 3, 'K1.3': 5,
  'K2.1': 2, 'K2.2': 2, 'K2.3': 3, 'K2.4': 4, 'K2.5': 3,
  'K3.1': 4, 'K3.2': 2, 'K3.3': 1, 'K3.4': 7,
  'K4.1': 7, 'K4.2': 7, 'K4.3': 6, 'K4.4': 6,
  'K5.1': 7, 'K5.2': 5, 'K5.3': 7, 'K5.4': 5, 'K5.5': 7,
  'K6.1': 7, 'K6.2': 7, 'K6.3': 7,
};
// Soma por camada a partir de avaliar(): ano0 e total na conta econômica (total em valor presente,
// com a saída e o valor residual na camada 7); fin0 = desembolso do Ano 0; porAno = conta econômica por ano.
function somaPorCamada(av) {
  const zero = () => { const z = {}; for (let i = 1; i <= 7; i++) z[i] = 0; return z; };
  const T = av.r.anos;
  const ano0 = zero(), total = zero(), fin0 = zero(), porAno = {};
  for (let i = 1; i <= 7; i++) porAno[i] = T.map(() => 0);
  av.linhas.forEach(l => {
    const c = CAMADA_DE_S[l.s] || 7;
    ano0[c] += l.eco[0]; total[c] += l.ecoVP; fin0[c] += l.fin[0];
    T.forEach(t => { porAno[c][t] += l.eco[t]; });
  });
  av.saida.forEach(x => { total[CAMADA_DE_S[x.s] || 7] += x.ecoVP; });
  if (av.vr) total[7] -= av.vr;
  return { ano0, total, fin0, porAno };
}

// ---------------------------------------------------------------- índices de custo unitário e indicadores
function anosUsuario(r, disc) { return r.anos.reduce((s, t) => s + r.U[t] * (disc ? disc[t] : 1), 0); }
function indicadores(cfg, av) {
  av = av || avaliar(calcular(cfg));
  const r = av.r, o = r.opc, T = r.anos, H = r.H;
  const den = anosUsuario(r, av.disc);
  const denE = r.anos.reduce((s, t) => s + r.E[t] * av.disc[t], 0);
  const icuK = {}, icuS = {};
  Object.keys(av.porK).forEach(k => { icuK[k] = den ? av.porK[k] / den : 0; });
  Object.keys(av.porS).forEach(s => { icuS[s] = den ? av.porS[s] / den : 0; });
  const icu = den ? av.ctEco / den : 0;
  const icuAno = T.map(t => r.U[t] ? av.ecoAno[t] / r.U[t] : 0);
  const interacoes = T.reduce((s, t) => s + r.I[t] * av.disc[t], 0);
  // custo marginal: +10% de elegíveis nos anos de operação
  const c2 = clone(cfg); c2.demanda.E = T.map(t => t === 0 ? ano(cfg.demanda.E, 0) : ano(cfg.demanda.E, t) * 1.1);
  if (c2.saas) c2.saas.qtd = T.map(t => t === 0 ? ano(cfg.saas.qtd, 0) : ano(cfg.saas.qtd, t) * 1.1);
  const av2 = avaliar(calcular(c2));
  const dU = anosUsuario(av2.r, av2.disc) - den;
  const marginal = dU ? (av2.ctEco - av.ctEco) / dU : 0;
  const recorrente = T.slice(1).reduce((s, t) => s + av.finAno[t], 0) / Math.max(1, H);
  return {
    icu, icuK, icuS, icuAno, icuElegivel: denE ? av.ctEco / denE : 0, custoInteracao: interacoes ? av.ctEco / interacoes : 0,
    marginal, razaoMarginalMedio: icu ? marginal / icu : 0,
    pCapacidade: av.fac.capacidade / av.ctEco, pUSD: av.fac.usd / av.ctEco, pVariavel: av.fac.variavel / av.ctEco, pDoado: av.fac.doado / av.ctEco,
    pCapital: av.fac.capital / av.ctEco,
    anosParaSair: recorrente ? av.saidaTotalNominal / recorrente : 0, recorrenteFin: recorrente,
    usuariosAno: den,
    tco: av.tco, fases: av.fases,   // v14: indicadores do custo total e custo por fase (ver indicadoresTCO e decomporFases)
  };
}

// ---------------------------------------------------------------- cenários
function cfgAltaAdocao(cfg) {
  const c = clone(cfg); const H = opcoes(cfg).H;
  c.demanda.adocao = Array.from({ length: H + 1 }, (_, t) => t === 0 ? ano(cfg.demanda.adocao, 0) : Math.min(0.9, ano(cfg.demanda.adocao, t) * 1.5));
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
  return { 'Esperado': calcular(cfg), 'Alta adoção': calcular(cfgAltaAdocao(cfg)), 'Estresse': calcular(cfgEstresse(cfg)) };
}

// ---------------------------------------------------------------- direcionadores e faixas próprias
// Faixas (mín, máx) como multiplicadores do valor provável. Convenções editoriais do guia, não evidência.
function direcionadores(cfg) {
  const arq = arquitetura(cfg), H = opcoes(cfg).H;
  const D = [];
  const mult = k => (c, f) => { c.mult = Object.assign({ fx: 1, pessoas: 1, preco: 1 }, c.mult || {}); c.mult[k] *= f; };
  const adoc = (c, f) => { c.demanda.adocao = Array.from({ length: H + 1 }, (_, t) => t === 0 ? ano(cfg.demanda.adocao, 0) : Math.min(0.95, ano(cfg.demanda.adocao, t) * f)); };
  D.push({ id: 'adocao', nome: 'Taxa de adoção', min: 0.6, max: 1.4, ap: adoc, comum: 'adocao' });
  D.push({ id: 'pessoas', nome: 'Custo carregado de pessoal', min: 0.9, max: 1.15, ap: mult('pessoas') });
  D.push({ id: 'fx', nome: 'Câmbio (itens em moeda estrangeira)', min: 0.9, max: 1.3, ap: mult('fx'), comum: 'fx' });
  if (arq === 'saas') {
    D.push({ id: 'precoLic', nome: 'Preço da licença', min: 0.95, max: 1.15, ap: (c, f) => { c.saas.preco *= f; } });
    if (cfg.formacaoTempo && cfg.formacaoTempo.ativo) D.push({ id: 'horasForm', nome: 'Horas de formação por usuário', min: 0.7, max: 1.5, ap: (c, f) => { c.formacaoTempo.horas *= f; } });
  }
  if (arq === 'api') {
    if ((cfg.implantacao || []).length) D.push({ id: 'manut', nome: 'Manutenção evolutiva (% da implantação)', min: 0.8, max: 1.5, ap: (c, f) => { c.implantacao[0].manutPct *= f; } });
    D.push({ id: 's', nome: 'Sessões por usuário', min: 0.7, max: 1.5, ap: (c, f) => { c.demanda.s *= f; }, comum: 'adocao' });
    D.push({ id: 'Tin', nome: 'Tokens de entrada por chamada', min: 0.7, max: 1.5, ap: (c, f) => { c.api.Tin *= f; } });
    D.push({ id: 'k', nome: 'Chamadas por interação', min: 0.8, max: 1.5, ap: (c, f) => { c.api.k *= f; } });
    D.push({ id: 'preco', nome: 'Preço por token', min: 0.8, max: 1.25, ap: mult('preco') });
  }
  if (arq === 'ow') {
    D.push({ id: 's', nome: 'Sessões por usuário', min: 0.7, max: 1.5, ap: (c, f) => { c.demanda.s *= f; }, comum: 'adocao' });
    D.push({ id: 'theta', nome: 'Vazão por GPU (tokens/s)', min: 0.75, max: 1.2, ap: (c, f) => { c.ow.theta *= f; } });
    D.push({ id: 'preco', nome: 'Preço da hora de GPU', min: 0.8, max: 1.25, ap: mult('preco') });
    D.push({ id: 'Tout', nome: 'Tokens de saída por interação', min: 0.7, max: 1.5, ap: (c, f) => { c.ow.Tout *= f; } });
  }
  (cfg.faixas || []).forEach(fx => { const d = D.find(x => x.id === fx.id); if (d) { d.min = fx.min; d.max = fx.max; } });
  return D;
}
// Tornado com faixas próprias: efeito sobre o custo econômico total e sobre a dotação do Ano 2
function tornado(cfg) {
  const base = avaliar(calcular(cfg));
  const dot2 = c => orcamento(c).dot[Math.min(2, opcoes(c).H)];
  const d0 = dot2(cfg);
  const rows = direcionadores(cfg).map(d => {
    const lo = clone(cfg); d.ap(lo, d.min); const hi = clone(cfg); d.ap(hi, d.max);
    const aLo = avaliar(calcular(lo)), aHi = avaliar(calcular(hi));
    return { id: d.id, nome: d.nome, min: d.min, max: d.max, lo: aLo.ctEco - base.ctEco, hi: aHi.ctEco - base.ctEco, dotLo: dot2(lo) - d0, dotHi: dot2(hi) - d0 };
  });
  rows.sort((a, b) => Math.max(Math.abs(b.lo), Math.abs(b.hi)) - Math.max(Math.abs(a.lo), Math.abs(a.hi)));
  return { base: base.ctEco, dot2: d0, rows };
}
// Compatibilidade: sensibilidade ±20% sobre o custo anual do Ano 2 (versão 1)
function sensibilidade(cfg) {
  const base = resumo(calcular(cfg)).tot[2];
  const nomes = { saas: ['Custo carregado de pessoal', 'Câmbio (itens em moeda estrangeira)', 'Taxa de adoção', 'Preço da licença', 'Horas de formação por usuário'] };
  const rows = direcionadores(cfg).map(d => {
    const lo = clone(cfg); d.ap(lo, 0.8); const hi = clone(cfg); d.ap(hi, 1.2);
    return { nome: d.nome, lo: resumo(calcular(lo)).tot[2] - base, hi: resumo(calcular(hi)).tot[2] - base };
  });
  rows.sort((a, b) => Math.max(Math.abs(b.lo), Math.abs(b.hi)) - Math.max(Math.abs(a.lo), Math.abs(a.hi)));
  return { base, rows };
}

// ---------------------------------------------------------------- Monte Carlo (triangular, choques comuns)
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function triang(u, a, c, b) { // mín a, moda c, máx b
  if (b <= a) return c; const F = (c - a) / (b - a);
  return u < F ? a + Math.sqrt(u * (b - a) * (c - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - c));
}
function quantil(arr, q) { const s = arr.slice().sort((a, b) => a - b); const i = (s.length - 1) * q; const lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); }
function simular(cfg, N = 1500, seed = 20261003) {
  const rnd = mulberry32(seed), D = direcionadores(cfg), H = opcoes(cfg).H;
  const ct = [], dot = Array.from({ length: H + 1 }, () => []), dotTot = [];
  for (let n = 0; n < N; n++) {
    const c = clone(cfg); const comum = {};
    D.forEach(d => {
      let u;
      if (d.comum) { if (comum[d.comum] == null) comum[d.comum] = rnd(); u = comum[d.comum]; } else u = rnd();
      d.ap(c, triang(u, d.min, 1, d.max));
    });
    const av = avaliar(calcular(c)); ct.push(av.ctEco);
    const ob = orcamentoDeLinhas(av, c);
    ob.dot.forEach((v, t) => dot[t].push(v)); dotTot.push(ob.dot.reduce((a, b) => a + b, 0));
  }
  const q = a => ({ p10: quantil(a, 0.1), p50: quantil(a, 0.5), p90: quantil(a, 0.9), media: a.reduce((x, y) => x + y, 0) / a.length });
  return { N, seed, ct: q(ct), dot: dot.map(q), dotTot: q(dotTot), custoEmRisco: dot.map(a => quantil(a, 0.9) - quantil(a, 0.5)) };
}

// ---------------------------------------------------------------- orçamento por exercício (conta orçamentária)
function orcamentoDeLinhas(av, cfg, avAlta) {
  const o = av.r.opc, T = av.r.anos;
  const isVar = l => l.nat === 'D' && (l.comp === 'V' || l.tag === 'gpu');
  const soma = (a, f) => T.map(t => a.linhas.filter(f).reduce((s, l) => s + l.v[t], 0));
  const fixo = soma(av, l => l.nat === 'D' && !isVar(l));
  const varr = soma(av, isVar);
  let reserva = T.map(() => 0);
  if (avAlta) {
    const fA = soma(avAlta, l => l.nat === 'D' && !isVar(l)), vA = soma(avAlta, isVar);
    reserva = T.map(t => Math.max(0, (vA[t] + fA[t]) - (varr[t] + fixo[t])));
  }
  const cont = T.map(t => o.contPct * (fixo[t] + varr[t]));
  const dot = T.map(t => fixo[t] + varr[t] + reserva[t] + cont[t]);
  const capital = soma(av, l => l.nat === 'D' && l.orc === 'capital');
  const corrente = T.map(t => fixo[t] + varr[t] - capital[t]);
  const cap = soma(av, l => l.nat === 'C');
  const doado = soma(av, l => l.nat === 'O');
  return { fixo, var: varr, reserva, cont, dot, capital, corrente, cap, doado, saida: av.saidaFin, contPct: o.contPct, anos: T };
}
function orcamento(cfg) {
  const av = avaliar(calcular(cfg)), avA = avaliar(calcular(cfgAltaAdocao(cfg)));
  return orcamentoDeLinhas(av, cfg, avA);
}

// ---------------------------------------------------------------- LMDI: decomposição exata da variação do consumo
function Lmed(a, b) { return (a === b) ? a : (a - b) / (Math.log(a) - Math.log(b)); }
function fatoresConsumo(r, t) {
  const cfg = r.cfg, d = cfg.demanda, arq = arquitetura(cfg);
  if (arq === 'api') return { 'Elegíveis': ano(d.E, t), 'Adoção': ano(d.adocao, t), 'Sessões': d.s, 'Interações por sessão': d.i, 'Meses de uso': ano(d.meses, t), 'Custo por interação': r.extra.cInt, 'Câmbio': r.fxT[t] };
  if (arq === 'saas') return { 'Licenças contratadas': ano(cfg.saas.qtd, t), 'Meses cobrados': ano(cfg.saas.mesesCobr, t), 'Preço da licença': r.extra.precoLic[t] * ano(cfg.saas.fatorPreco, t), 'Câmbio': r.fxT[t] };
  return null;
}
function lmdi(cfg0, t0, cfg1, t1) {
  const r0 = calcular(cfg0), r1 = calcular(cfg1);
  const f0 = fatoresConsumo(r0, t0), f1 = fatoresConsumo(r1, t1);
  if (!f0 || !f1) return null;
  const C = f => Object.values(f).reduce((a, b) => a * b, 1);
  const C0 = C(f0), C1 = C(f1);
  if (!(C0 > 0 && C1 > 0)) return null;
  const Lw = Lmed(C1, C0);
  const contrib = Object.keys(f0).map(k => ({ fator: k, v0: f0[k], v1: f1[k], efeito: (f0[k] > 0 && f1[k] > 0) ? Lw * Math.log(f1[k] / f0[k]) : 0 }));
  return { C0, C1, delta: C1 - C0, contrib };
}

// ---------------------------------------------------------------- índice de preços de Laspeyres do caso (base: Ano 1)
function laspeyres(cfgBase, cfgAtual) {
  const r0 = calcular(cfgBase), r1 = calcular(cfgAtual || cfgBase);
  const b = 1, out = [];
  r1.anos.forEach(t => {
    if (t < b) { out.push(null); return; }
    let num = 0, den = 0;
    r0.linhas.forEach(l0 => {
      if (!l0.q || !l0.p || l0.nat === 'O') return;
      const l1 = r1.linhas.find(x => x.nome === l0.nome);
      if (!l1 || !l1.p) return;
      const q0 = l0.q[b]; if (!(q0 > 0)) return;
      num += l1.p[t] * q0; den += l0.p[b] * q0;
    });
    out.push(den ? 100 * num / den : null);
  });
  return out;
}

// ---------------------------------------------------------------- custo anual equivalente
function cae(valor, r, n) { if (!n) return 0; return r ? valor * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) : valor / n; }

// ---------------------------------------------------------------- comparação de alternativas
// lista: [{nome, cfg, efeito?}] — a primeira é a referência (status quo ou alternativa sem IA)
function comparar(lista) {
  const res = lista.map(a => {
    const av = avaliar(calcular(a.cfg)); const ind = indicadores(a.cfg, av);
    return { nome: a.nome, ct: av.ctEco, porK: av.porK, efeito: (a.efeito === '' || a.efeito == null) ? null : +a.efeito, usuarios: ind.usuariosAno, icu: ind.icu };
  });
  const ref = res[0];
  res.forEach(x => { x.dC = x.ct - ref.ct; x.dE = (x.efeito != null && ref.efeito != null) ? x.efeito - ref.efeito : null; x.dK = {}; Object.keys(x.porK).forEach(k => { x.dK[k] = x.porK[k] - ref.porK[k]; }); });
  // dominância e razão incremental, entre as que têm efeito
  const comE = res.filter(x => x.efeito != null).sort((a, b) => a.ct - b.ct);
  comE.forEach(x => { x.dominada = comE.some(y => y !== x && y.ct <= x.ct && y.efeito >= x.efeito && (y.ct < x.ct || y.efeito > x.efeito)); });
  const nd = comE.filter(x => !x.dominada);
  nd.forEach((x, i) => { if (i > 0) { const p = nd[i - 1]; x.rcei = (x.efeito - p.efeito) ? (x.ct - p.ct) / (x.efeito - p.efeito) : null; x.rceiContra = p.nome; } });
  return res;
}

// ---------------------------------------------------------------- equidade por estrato (modo avançado)
// estratos: [{nome, part (fração dos usuários), fK1, fK4}] — multiplicadores do custo por usuário em K1 e K4
function equidade(cfg, estratos, av) {
  av = av || avaliar(calcular(cfg)); const ind = indicadores(cfg, av);
  return estratos.map(z => {
    const extra = (ind.icuK.K1 || 0) * (z.fK1 - 1) + (ind.icuK.K4 || 0) * (z.fK4 - 1);
    return { nome: z.nome, part: z.part, icu: ind.icu + extra, delta: extra };
  });
}

// ---------------------------------------------------------------- comparações específicas (mantidas)
function compLicenca(cfg) {
  if (!(cfg.saas && cfg.saas.ativo)) return null;
  const r = calcular(cfg), s = cfg.saas;
  const lic = r.linhas.find(l => l.tag === 'licenca');
  const rows = r.anos.slice(1).map(t => {
    const inst = lic.v[t];
    const Lnom = Math.ceil(r.U[t] * s.fatorNominal);
    const nom = Lnom * s.precoNominal * Math.pow(1 + s.reajuste, t - 1) * 12 * r.fxT[t];
    return { t, U: r.U[t], inst, instAtivo: inst / r.U[t] / 12, instLic: inst / ano(s.qtd, t) / 12, Lnom, nom, nomAtivo: nom / r.U[t] / 12 };
  });
  return { rows, aEq: s.preco / (s.fatorNominal * s.precoNominal) };
}
function compArquiteturas(cfg) {
  if (!(cfg.ow && cfg.ow.ativo)) return null;
  const r = calcular(cfg), res = resumo(r), ow = cfg.ow, c = cfg.comparaAPI;
  const t2 = Math.min(2, r.H);
  const infra = r.linhas.filter(l => l.s === 'K2.3' || (l.s === 'K2.5' && l.tag === 'mensal')).reduce((s, l) => s + l.v[t2], 0);
  const pessoasOp = r.linhas.filter(l => l.tag === 'opmodelo').reduce((s, l) => s + l.v[t2], 0);
  const resto = res.tot[t2] - infra - pessoasOp;
  const I2 = r.I[t2];
  const mod = custoChamada(300, 10, 0.20, 1.20);
  const apiCusto = (Pin, Pout) => I2 * (custoChamada(ow.Tin, ow.Tout, Pin, Pout) + mod) + c.armazenamento;
  const pApi = c.pessoasAPI.reduce((s, [sal, fte]) => s + salario(cfg, sal) * fte, 0);
  return { I2, resto, rows: [
    { nome: 'Pesos abertos em GPU gerenciada', comp: infra, pes: pessoasOp, tot: infra + pessoasOp + resto },
    ...c.opcoes.map(op => { const a = apiCusto(op.Pin, op.Pout); return { nome: op.nome, comp: a, pes: pApi, tot: a + pApi + resto }; }),
  ] };
}

// ---------------------------------------------------------------- exemplos do guia (Cap. 12)
const PRESETS = {
  A: {
    nome: 'Exemplo A. Copiloto SaaS para professores', arq: 'saas', risco: 'moderado', unidade: 'professor', unidadePl: 'professores',
    demanda: { E: [600, 12000, 12000, 12000], adocao: [0.70, 0.35, 0.45, 0.50], s: 0, i: 0, meses: [4, 12, 12, 12] },
    saas: { ativo: true, qtd: [600, 12000, 12000, 12000], preco: 9.00, reajuste: 0.04, mesesCobr: [4, 12, 12, 12], fatorPreco: [0, 1, 1, 1], precoNominal: 13.00, fatorNominal: 1.15 },
    implantacao: [{ cat: 'Integração', nome: 'Integração SSO, diretório e AVA (implantação)', valor: 40000, manutPct: 0.15, nomeManut: 'Manutenção de integrações', s: 'K3.1', sManut: 'K6.1' }],
    itens: [
      { cat: 'Privacidade e conformidade', s: 'K3.3', nome: 'Revisão jurídica e de proteção de dados', nat: 'D', v: [8000, 0, 0, 0] },
      { cat: 'Avaliação', s: 'K5.5', nome: 'Avaliação independente', nat: 'D', v: [0, 25000, 0, 20000] },
      { cat: 'Formação e mudança', s: 'K4.3', nome: 'Programa de formação (formadores, materiais)', nat: 'D', v: [20000, 12000, 12000, 12000] },
    ],
    pessoas: [
      { cat: 'Pessoas', s: 'K3.2', nome: 'Configuração e políticas (TI)', nat: 'C', partes: [['eng_integracao', [0.25, 0, 0, 0]]] },
      { cat: 'Pessoas', s: 'K4.1', nome: 'Gestão do produto', nat: 'C', partes: [['gestor_produto', [0.15, 0.3, 0.3, 0.3]]] },
      { cat: 'Governança', s: 'K5.1', nome: 'Gestão contratual', nat: 'C', partes: [['gestor_contrato', [0, 0.1, 0.1, 0.1]]] },
      { cat: 'Governança', s: 'K5.2', nome: 'Privacidade e dados', nat: 'C', partes: [['analista_privacidade', [0.1, 0.1, 0.1, 0.1]]] },
      { cat: 'Monitoramento', s: 'K5.3', nome: 'Amostragem pedagógica de qualidade', nat: 'C', partes: [['especialista_pedagogico', [0, 0.2, 0.2, 0.2]]] },
    ],
    suporte: { ativo: true, nome: 'Suporte aos usuários (escalonado)', sal: 'suporte_n1', faixas: [[5000, 0.5]], acima: 1.0, anos: [1, 2, 3] },
    formacaoTempo: { ativo: true, nome: 'Tempo docente em formação', modo: 'ativos', horas: 3, custoHora: 12, rot: 0.10 },
    saida: {
      itens: [{ nome: 'Exportação e transformação de materiais', valor: 8000 }, { nome: 'Formadores para a nova solução', valor: 8000 }, { nome: 'Desativação, exclusão e evidência', valor: 2000 }],
      reconstrucaoPct: 0.6, mesesParalelo: 1, horasRetreino: 2, custoHora: 12, internos: [],
    },
  },
  B: {
    nome: 'Exemplo B. Assistente administrativo com API e RAG', arq: 'api', risco: 'limitado', unidade: 'servidor', unidadePl: 'servidores',
    demanda: { E: [150, 3000, 3000, 3000], adocao: [0.70, 0.40, 0.55, 0.60], s: 12, i: 3, meses: [3, 11, 11, 11] },
    api: { ativo: true, k: 1.3, Tin: 5000, Tout: 400, h: 0.20, Pin: 2.00, Pout: 10.00, auxAtivo: true, TinAux: 600, ToutAux: 10, PinAux: 0.20, PoutAux: 1.20, Tq: 50, PrerankMil: 1.00 },
    rag: { ativo: true, docs: 20000, tokDoc: 2500, docsNovos: 4000, reindexAno: 1, paginas: 200000, Ppag: 0.0015, Pemb: 0.10 },
    mensais: [
      { cat: 'Dados e RAG', s: 'K2.4', nome: 'Banco vetorial gerenciado', valor: 200, mesesY0: 6, fx: true },
      { cat: 'Infraestrutura', s: 'K2.5', nome: 'Hospedagem da aplicação', valor: 900, mesesY0: 6, fx: true },
      { cat: 'Monitoramento', s: 'K2.5', nome: 'Ferramenta de observabilidade', valor: 250, mesesY0: 6, fx: true },
    ],
    implantacao: [{ cat: 'Integração', nome: 'Desenvolvimento da aplicação, RAG e integrações', valor: 110000, manutPct: 0.20, nomeManut: 'Manutenção evolutiva e adaptação a mudanças de API', s: 'K3.1', sManut: 'K6.1' }],
    itens: [
      { cat: 'Avaliação', s: 'K3.4', nome: 'Conjunto de avaliação e testes de aceitação', nat: 'D', v: [12000, 0, 0, 0] },
      { cat: 'Avaliação', s: 'K6.2', nome: 'Reexecução dos testes a cada mudança', nat: 'D', v: [0, 6000, 6000, 6000] },
      { cat: 'Formação e mudança', s: 'K4.3', nome: 'Formação (materiais e oficinas)', nat: 'D', v: [3000, 4000, 4000, 4000] },
    ],
    pessoas: [
      { cat: 'Pessoas', s: 'K4.1', nome: 'Curadoria da base de conhecimento', nat: 'C', partes: [['analista_conteudo', [0.25, 0.5, 0.5, 0.5]]] },
      { cat: 'Pessoas', s: 'K4.1', nome: 'Responsável pelo produto', nat: 'C', partes: [['gestor_produto', [0.25, 0.3, 0.3, 0.3]]] },
      { cat: 'Pessoas', s: 'K4.1', nome: 'TI interna', nat: 'C', partes: [['eng_integracao', [0.15, 0.2, 0.2, 0.2]]] },
      { cat: 'Governança', s: 'K5.2', nome: 'Privacidade e segurança', nat: 'C', partes: [['analista_privacidade', [0.05, 0.1, 0.1, 0.1]]] },
      { cat: 'Governança', s: 'K5.1', nome: 'Gestão contratual', nat: 'C', partes: [['gestor_contrato', [0, 0.05, 0.05, 0.05]]] },
    ],
    formacaoTempo: { ativo: true, nome: 'Tempo dos servidores em formação', modo: 'ativos', horas: 1.5, custoHora: 10, rot: 0.10 },
    saida: {
      itens: [{ nome: 'Documentação e transferência de conhecimento', valor: 15000 }, { nome: 'Novo teste com o conjunto de avaliação', valor: 10000 }],
      reconstrucaoPct: 0.30, reindexar: true, reindexFixo: 2000, mesesParalelo: 2, horasRetreino: 0, custoHora: 10,
      internos: [['gestor_produto', 0.125], ['eng_integracao', 0.125]],
    },
  },
  C: {
    nome: 'Exemplo C. Tutor com modelo de pesos abertos', arq: 'ow', risco: 'elevado', unidade: 'estudante', unidadePl: 'estudantes',
    demanda: { E: [6000, 50000, 150000, 150000], adocao: [0.60, 0.45, 0.35, 0.40], s: 8, i: 10, meses: [4, 9, 9, 9] },
    ow: { ativo: true, Tin: 1800, Tout: 250, fPico: 0.70, hPicoMes: 1600 / 9, phi: 2.0, theta: 600, u: 0.70, red: 1, minFora: 2, Pgpu: 1.32, Pseg: 0.53, nSeg: 2 },
    mensais: [{ cat: 'Infraestrutura', s: 'K2.5', nome: 'Armazenamento, rede, registros e balanceamento', valor: 1500, mesesY0: 4, fx: true }],
    implantacao: [{ cat: 'Integração', nome: 'Plataforma do tutor e integrações (implantação)', valor: 180000, manutPct: 0.15, nomeManut: 'Manutenção da plataforma e integrações', s: 'K3.1', sManut: 'K6.1' }],
    itens: [
      { cat: 'Dados', s: 'K3.2', nome: 'Alinhamento curricular, instruções e conjuntos de teste', nat: 'D', v: [20000, 0, 0, 0] },
      { cat: 'Privacidade e conformidade', s: 'K3.3', nome: 'Avaliação de impacto e proteção de crianças', nat: 'D', v: [15000, 0, 0, 0] },
      { cat: 'Governança', s: 'K5.4', nome: 'Testes adversariais externos e auditoria', nat: 'D', v: [0, 45000, 45000, 45000] },
      { cat: 'Avaliação', s: 'K5.5', nome: 'Avaliação de impacto (desenho comparativo)', nat: 'D', v: [0, 60000, 60000, 0] },
      { cat: 'Mudança tecnológica', s: 'K6.2', nome: 'Reavaliação por troca de versão do modelo', nat: 'D', v: [0, 10000, 10000, 10000] },
      { cat: 'Formação e mudança', s: 'K4.3', nome: 'Formação de professores', nat: 'D', v: [10000, 15000, 15000, 15000] },
    ],
    pessoas: [
      { cat: 'Pessoas', s: 'K4.1', nome: 'Engenharia de ML e operação do modelo', nat: 'D', tag: 'opmodelo', partes: [['eng_ml', [0.5, 1, 1, 1]]] },
      { cat: 'Pessoas', s: 'K4.1', nome: 'Infraestrutura e confiabilidade', nat: 'D', tag: 'opmodelo', partes: [['eng_integracao', [0.25, 0.5, 0.5, 0.5]]] },
      { cat: 'Pessoas', s: 'K4.1', nome: 'Gestão do produto', nat: 'C', partes: [['gestor_produto', [0.25, 0.5, 0.5, 0.5]]] },
      { cat: 'Monitoramento', s: 'K5.3', nome: 'Equipe pedagógica: curadoria e revisão de respostas', nat: 'C', partes: [['especialista_pedagogico', [0.5, 1, 1, 1]]] },
      { cat: 'Governança', s: 'K5.2', nome: 'Privacidade e proteção de crianças', nat: 'C', partes: [['analista_privacidade', [0.15, 0.3, 0.3, 0.3]]] },
      { cat: 'Governança', s: 'K5.1', nome: 'Gestão contratual', nat: 'C', partes: [['gestor_contrato', [0.05, 0.1, 0.1, 0.1]]] },
    ],
    suporte: { ativo: true, nome: 'Suporte às escolas (escalonado)', sal: 'suporte_n1', faixas: [[20000, 0.5], [60000, 1.0]], acima: 1.5, anos: [0, 1, 2, 3] },
    formacaoTempo: { ativo: true, nome: 'Tempo docente em formação', modo: 'razao', razao: 50, horas: 2, custoHora: 12, rot: 0 },
    comparaAPI: {
      armazenamento: 18000, pessoasAPI: [['eng_ml', 0.3], ['eng_integracao', 0.1]],
      opcoes: [{ nome: 'API, modelo pequeno (US$ 0,20 / 1,20 por milhão de tokens)', Pin: 0.20, Pout: 1.20 }, { nome: 'API, modelo intermediário (US$ 2,00 / 10,00)', Pin: 2.00, Pout: 10.00 }],
    },
    saida: {
      itens: [{ nome: 'Transferência de conhecimento e documentação', valor: 25000 }, { nome: 'Novo ciclo de testes e de segurança', valor: 30000 }],
      reconstrucaoPct: 0.25, mesesParalelo: 1, horasRetreino: 0, custoHora: 12,
      internos: [['gestor_produto', 0.3], ['especialista_pedagogico', 0.2]],
    },
  },
};
// moeda dos itens: implantação e itens locais (LOC) por padrão; serviços mensais e licenças em US$

const API_CUSTOS = { ARVORE, NOME_K, NOME_S, K_DE_S, MAPA_CAT, SAL, SAL_NOME, OPC_COMPAT, OPC_PADRAO, clone, opcoes, ano, custoChamada, salario, arquitetura,
  calcular, resumo, avaliar, indicadores, cfgAltaAdocao, cfgEstresse, cenarios, direcionadores, tornado, sensibilidade, simular, orcamento, orcamentoDeLinhas,
  lmdi, laspeyres, cae, comparar, equidade, compLicenca, compArquiteturas, PRESETS, quantil, fatorAdapt, CAMADA_DE_S, somaPorCamada,
  FASES_MOTOR, faseDoAno, decomporFases, indicadoresTCO, papeisDe };
if (typeof module !== 'undefined') module.exports = API_CUSTOS;
