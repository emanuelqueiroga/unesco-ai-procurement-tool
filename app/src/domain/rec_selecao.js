// =====================================================================
// Seleção das recomendações (pacote R3; design/redesign/05-requisitos-recomendacoes.md, seções 3.3, 4 e 5):
//   pontuação auditável de 4.1 (REC-18), os três níveis de 4.2 (REC-19), os 5 cartões de "Comece por estas" (4.3,
//   REC-20), o veredito da próxima decisão (4.4, REC-21), o aviso de mais de 5 Condições (REC-22), o "O que fazer"
//   agrupado por pacote (REC-23) e o caso incompleto ou em branco (3.3, item 4; REC-24).
// Puro (sem DOM). Recebe os itens já montados por recomendacoes.js (montarItem) e o contexto `k` (recContexto);
// nada aqui depende da posição da regra no catálogo: toda ordem usa pontos, marco, pacote e o número do R-nn.
// A saída pública chega às telas e ao PDF por resultadoRecomendacoes(estado) (recomendacoes.js):
//   { recs, pend, suspensas, proxMarco, …, cartoes, veredito, avisoCondicoes, grupos, baseComum, vazio }
// Textos em português (chaves de tradução); trVeredito(v) devolve a frase traduzida.
// =====================================================================
import { tr } from './i18n.js';
import {
  ORDEM_PACOTE, ORDEM_MARCO, LENTE_PACOTE, TITULO_PACOTE, LENTES, NOME_MARCO, NIVEIS, ORDEM_NIVEL, NOME_NIVEL, ROTULO_NIVEL, MARCO_FRASE,
  REC_IRREVERSIVEIS, REC_GRUPOS, IMPACTOS_GRUPOS, PACOTES_PESSOAS,
} from './regras/index.js';

const N_CARTOES = 5;
const MAX_CONDICOES = 5;
const ORDEM_LENTES = ['decisao', 'pessoas', 'custo'];

// ----------------------------------------------------------- textos (chaves de tradução)
const TXT_SEL = {
  proxima: 'Próxima decisão: {0}.',
  faltam: 'Faltam: {0}.',
  comece: 'Comece por: {0}.',
  pode: 'Pode avançar.',
  condicoes: 'Pode avançar com condições.',
  naoPiloto: 'Recomendação: começar por uma prova de conceito antes do piloto.',
  naoProblema: 'Recomendação: descrever primeiro o problema e a meta, sem partir da tecnologia.',
  naoContestacao: 'Recomendação: criar antes um caminho para contestar as saídas que afetam pessoas.',
  naoExcesso: 'Recomendação: preparar primeiro as {n} condições abertas para {marco}.',
  porquePode: 'Nenhuma condição aberta para {marco}.',
  porqueCond1: '1 condição aberta para {marco}.',
  porqueCondN: '{n} condições abertas para {marco}.',
  porqueProblema: 'O problema ainda não está descrito sem partir da tecnologia.',
  porquePiloto: 'As respostas indicam uma prova de conceito antes do piloto.',
  porqueContestacao: 'Uma saída afeta pessoas e ainda não há caminho para contestá-la.',
  porqueExcesso: 'Há {n} condições abertas para {marco}, mais do que dá para cumprir antes da decisão.',
  aviso: 'Faltam {n} condições para {marco}.',
  confirmar: '(a confirmar na pergunta {n})',
  vazio: 'Ainda sem recomendações',
  vazioTexto: 'Responda primeiro a estas perguntas: são as que mais liberam ações para o caso.',
  sugerida: 'Resposta sugerida pela ferramenta e ainda não confirmada; as ações que dependem dela ficam marcadas "a confirmar".',
  aCalcular: 'a calcular',
};
const ROTULO_VEREDITO = { pode: 'Pode avançar', condicoes: 'Pode avançar com condições', nao: 'Preparar antes de avançar', sem: 'Ainda sem recomendações' };
// objeto da próxima decisão (4.4: "Próxima decisão: {marco e objeto}")
const DECISAO = {
  teste: 'autorizar o teste',
  poc: 'autorizar a prova de conceito',
  pocGratis: 'autorizar a prova de conceito gratuita',
  piloto: 'autorizar o piloto',
  pilotoEsc: 'autorizar o piloto em {n} escolas',
  M2: 'decidir depois do teste',
  M3: 'levar a compra ao mercado',
  M4: 'assinar a implantação',
  M5: 'acompanhar, ampliar ou renovar',
};

const numId = id => +String(id).replace(/\D/g, '') || 0;
const seguro = (f, ...a) => { try { return f(...a); } catch (e) { console.warn(e); return undefined; } };
const sub = (s, vars) => String(s).replace(/\{([a-zA-Z0-9_]+)\}/g, (m, n) => (vars && vars[n] != null ? String(vars[n]) : m));
const semPonto = s => String(s || '').trim().replace(/[.;]+$/, '');

// ----------------------------------------------------------- níveis (4.2)
/** Rótulo curto do nível: 'Condição' | 'Recomendada' | 'Para acompanhar' (traduzido com `trad`). */
function rotuloNivelCurto(nivel, trad) {
  const s = NOME_NIVEL[nivel] || NOME_NIVEL.recomendada;
  return trad ? tr(s) : s;
}
/**
 * Rótulo do nível com o marco (4.2): "Condição para autorizar o teste", "Recomendada antes de levar ao mercado",
 * "Para acompanhar". Aceita um item (usa item.nivel e item.marco) ou (nivel, marco).
 */
function rotuloNivel(item, marco, trad) {
  let nivel = item;
  if (item && typeof item === 'object') { nivel = item.nivel; trad = marco; marco = item.marco; }
  const T = x => (trad ? tr(x) : x);
  const m = MARCO_FRASE[marco] || MARCO_FRASE.M1;
  return T(ROTULO_NIVEL[nivel] || ROTULO_NIVEL.recomendada).replace('{marco}', T(m));
}

// ----------------------------------------------------------- pontuação (4.1)
// chaves de numero(chave, d) (rec_numeros.js) cujo valor bruto é dinheiro do caso
const CHAVES_DINHEIRO = ['central', 'p10', 'p50', 'p90', 'reserva', 'ano0', 'dotAno0', 'regime', 'saida', 'saidaEco', 'estresse'];
/**
 * Dinheiro ligado à ação (mesma unidade de d.total): `numero.emJogo` quando a regra o dá; senão o valor bruto de um
 * número de dinheiro de rec_numeros.js (chaves de CHAVES_DINHEIRO, ou 'sub:Kx.y' com o custo do subcomponente).
 */
function emJogoDe(n) {
  if (!n || typeof n !== 'object') return 0;
  if (Number.isFinite(+n.emJogo) && +n.emJogo > 0) return +n.emJogo;
  const id = String(n.id || '');
  if (/^sub:/.test(id) && n.bruto && Number.isFinite(+n.bruto.total)) return +n.bruto.total;
  if (CHAVES_DINHEIRO.includes(id) && Number.isFinite(+n.bruto)) return +n.bruto;
  return 0;
}
const flag = (x, k) => (typeof x === 'function' ? !!seguro(x, k) : !!x);
/**
 * Grava em cada item `pontos` (0–14) e `criterio` { bloqueio, pessoas, dinheiro, urgencia, dependencia, especificidade,
 * semNumero } (as parcelas somam `pontos`, com o piso 0). `regraDe(id)` devolve a regra do catálogo (flags opcionais).
 */
function pontuar(itens, k, regraDe) {
  const R = id => (regraDe && regraDe(id)) || {};
  const impactos = (k && k.impactos) || [];
  const impactoGrupos = impactos.some(x => IMPACTOS_GRUPOS.includes(x));
  const criancasUsuarias = !!(k && k.criancas && k.usaEst);
  // dinheiro em jogo: fração do custo total (só lê os números do caso se alguma ação traz o valor)
  const algumDinheiro = itens.some(it => emJogoDe(it.numero) > 0);
  const total = algumDinheiro && k && k.d ? +k.d.total || 0 : 0;
  // dependência: quantas ações disparadas dependem desta
  const destrava = {};
  itens.forEach(it => (it.depende || []).forEach(d => { destrava[d] = (destrava[d] || 0) + 1; }));
  itens.forEach(it => {
    const r = R(it.id);
    const c = {};
    c.bloqueio = it.condicao ? 4 : 0;
    // pessoas e direitos
    const tocaPessoas = PACOTES_PESSOAS.includes(it.pacote) || !!r.tocaPessoas;
    const usoComCriancas = criancasUsuarias && it.tipo === 'uso';
    let p = 0;
    if ((tocaPessoas && (k.alto || criancasUsuarias)) || usoComCriancas) p = 3;
    else if (tocaPessoas && (k.nivel === 'moderado' || k.criancas)) p = 2;
    else if (tocaPessoas) p = 1;
    const grupos = r.grupos != null ? !!r.grupos : REC_GRUPOS.includes(it.id);
    if (impactoGrupos && grupos) p = Math.min(3, p + 1);
    c.pessoas = p;
    // dinheiro em jogo
    const f = total > 0 ? emJogoDe(it.numero) / total : 0;
    c.dinheiro = f >= 0.10 ? 3 : f >= 0.05 ? 2 : f >= 0.01 ? 1 : 0;
    // urgência e irreversibilidade: 2 só antes do marco (sortear, linha de base, cláusula antes do edital); 1 antes de M4
    const om = ORDEM_MARCO[it.marco] == null ? 0 : ORDEM_MARCO[it.marco];
    const irrev = r.irreversivel != null ? flag(r.irreversivel, k) : REC_IRREVERSIVEIS.includes(it.id);
    const clausula = (it.exige || []).length > 0 && om <= ORDEM_MARCO.M3;
    c.urgencia = (irrev && om <= ORDEM_MARCO.M3) || clausula ? 2 : om < ORDEM_MARCO.M4 ? 1 : 0;
    c.dependencia = Math.min(2, destrava[it.id] || 0);
    c.especificidade = it.generica ? -1 : 0;
    c.semNumero = it.semNumero ? -1 : 0;
    const soma = c.bloqueio + c.pessoas + c.dinheiro + c.urgencia + c.dependencia + c.especificidade + c.semNumero;
    it.pontos = Math.max(0, Math.min(14, soma));
    it.criterio = c;
  });
  return itens;
}

// distância do marco ao próximo marco (desempate: "o marco mais próximo")
const distMarco = (m, prox) => {
  const a = ORDEM_MARCO[m] == null ? 9 : ORDEM_MARCO[m], b = ORDEM_MARCO[prox] == null ? 0 : ORDEM_MARCO[prox];
  return [Math.abs(a - b), a];
};
/** Ordem das ações (4.1): pontos, marco mais próximo, ordem dos pacotes e número do R-nn; nunca a posição no catálogo. */
function compararPontos(a, b, prox) {
  if ((b.pontos || 0) !== (a.pontos || 0)) return (b.pontos || 0) - (a.pontos || 0);
  const da = distMarco(a.marco, prox), db = distMarco(b.marco, prox);
  if (da[0] !== db[0]) return da[0] - db[0];
  if (da[1] !== db[1]) return da[1] - db[1];
  const pa = ORDEM_PACOTE[a.pacote] == null ? 99 : ORDEM_PACOTE[a.pacote], pb = ORDEM_PACOTE[b.pacote] == null ? 99 : ORDEM_PACOTE[b.pacote];
  if (pa !== pb) return pa - pb;
  if (numId(a.id) !== numId(b.id)) return numId(a.id) - numId(b.id);
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
// dentro de um cartão-pacote: Condição primeiro, depois a pontuação (o texto do cartão vem da primeira)
const compararMembros = prox => (a, b) => (ORDEM_NIVEL[a.nivel] - ORDEM_NIVEL[b.nivel]) || compararPontos(a, b, prox);

// ----------------------------------------------------------- cartões-pacote (3.3, item 5) e seleção (4.3)
// uma ação apoiada em resposta sugerida só lidera um cartão se for Condição (3.3, item 4)
const podeLiderar = it => !(it.origem && it.origem.sugerido) || it.nivel === 'condicao';

/** Candidatos: um cartão por pacote e marco; PESSOAS dá dois com risco elevado ou crítico. */
function candidatosCartoes(itens, k) {
  const prox = k.proxMarco;
  const porChave = new Map();
  itens.filter(it => !it.generica).forEach(it => {
    const ch = it.pacote + ':' + it.marco;
    if (!porChave.has(ch)) porChave.set(ch, []);
    porChave.get(ch).push(it);
  });
  const C = [];
  [...porChave.keys()].sort().forEach(ch => {
    const membros = porChave.get(ch).slice().sort(compararMembros(prox));
    const lideres = membros.filter(podeLiderar);
    if (!lideres.length) return;
    const [pacote, marco] = ch.split(':');
    if (pacote === 'PESSOAS' && k.alto && lideres.length >= 2) {
      const l2 = lideres[1];
      C.push({ pacote, marco, parte: 1, lider: lideres[0], membros: membros.filter(x => x !== l2) });
      C.push({ pacote, marco, parte: 2, lider: l2, membros: [l2] });
    } else C.push({ pacote, marco, parte: 1, lider: lideres[0], membros });
  });
  return C;
}
const compararCartoes = prox => (a, b) => compararPontos(a.lider, b.lider, prox) || a.parte - b.parte;

function montarCartao(c, n, motivo) {
  const L = c.lider;
  const outros = c.membros.filter(x => x !== L);
  const confirmar = L.origem && L.origem.sugerido ? sub(TXT_SEL.confirmar, { n: L.origem.n }) : '';
  return {
    n, chave: c.pacote + ':' + c.marco + (c.parte > 1 ? ':' + c.parte : ''), pacote: c.pacote, parte: c.parte,
    titulo: TITULO_PACOTE[c.pacote] || '', lente: LENTE_PACOTE[c.pacote] || '', lenteNome: LENTES[LENTE_PACOTE[c.pacote]] || '',
    marco: c.marco, marcoNome: NOME_MARCO[c.marco] || '', nivel: L.nivel, rotuloNivel: rotuloNivel(L.nivel, c.marco),
    pontos: L.pontos, criterio: L.criterio, motivo,
    id: L.id, ids: [L.id].concat(outros.map(x => x.id)), lider: L,
    oque: L.oque, razao: L.razao, paraque: L.paraque, como: L.como.slice(), quem: L.quem.slice(), quemRot: L.quemRot.slice(),
    pronto: L.pronto, numero: L.numero, origem: L.origem,
    etiqueta: [L.etiqueta, confirmar].filter(Boolean).join(' '),
    // as outras ações do mesmo pacote e marco entram como passos, cada uma com o seu R-nn e a sua origem
    passos: outros.map(x => ({ id: x.id, oque: x.oque, nivel: x.nivel, origem: x.origem, item: x })),
  };
}

/**
 * Os 5 cartões de "Comece por estas" (4.3): (2) as Condições do próximo marco, por pontuação; (3) uma vaga para cada
 * lente ausente com candidato Condição ou Recomendada até M3; (4) o resto pela pontuação, preferindo, no empate,
 * uma pergunta de origem ainda não usada. No máximo 1 cartão por pacote (2 para PESSOAS com risco alto).
 */
function selecionarCartoes(itens, k) {
  const prox = k.proxMarco;
  const ord = compararCartoes(prox);
  const C = candidatosCartoes(itens, k).sort(ord);
  const escolhidos = [], motivos = new Map(), porPacote = {}, campos = new Set();
  const maxPacote = p => (p === 'PESSOAS' && k.alto ? 2 : 1);
  const pode = c => !motivos.has(c) && (porPacote[c.pacote] || 0) < maxPacote(c.pacote);
  const tomar = (c, motivo) => {
    escolhidos.push(c); motivos.set(c, motivo);
    porPacote[c.pacote] = (porPacote[c.pacote] || 0) + 1;
    campos.add(c.lider.origem && c.lider.origem.campo);
  };
  // 2. Condições do próximo marco
  C.filter(c => c.lider.nivel === 'condicao' && c.marco === prox).forEach(c => { if (escolhidos.length < N_CARTOES && pode(c)) tomar(c, 'condicao'); });
  // 3. uma de cada lente que ainda não aparece (a de maior pontuação primeiro, quando sobra só uma vaga)
  for (;;) {
    if (escolhidos.length >= N_CARTOES) break;
    const faltam = ORDEM_LENTES.filter(l => !escolhidos.some(c => LENTE_PACOTE[c.pacote] === l));
    const melhores = faltam.map(l => C.find(c => LENTE_PACOTE[c.pacote] === l && pode(c) && ['condicao', 'recomendada'].includes(c.lider.nivel)
      && ORDEM_MARCO[c.marco] <= ORDEM_MARCO.M3)).filter(Boolean).sort(ord);
    if (!melhores.length) break;
    tomar(melhores[0], 'lente');
  }
  // 4. completar pela pontuação; no empate, no máximo 1 cartão por pergunta de origem
  for (;;) {
    if (escolhidos.length >= N_CARTOES) break;
    const livres = C.filter(pode);
    if (!livres.length) break;
    const topo = livres[0].lider.pontos;
    const empatados = livres.filter(c => c.lider.pontos === topo);
    tomar(empatados.find(c => !campos.has(c.lider.origem && c.lider.origem.campo)) || empatados[0], 'pontuacao');
  }
  // ordem de exibição: as Condições do próximo marco primeiro, depois a pontuação
  const cond = c => (c.lider.nivel === 'condicao' && c.marco === prox ? 0 : 1);
  return escolhidos.slice().sort((a, b) => cond(a) - cond(b) || ord(a, b)).map((c, i) => montarCartao(c, i + 1, motivos.get(c)));
}

// ----------------------------------------------------------- condições, aviso e veredito (4.3, item 5; 4.4)
/** Condições abertas do próximo marco (ações de nível Condição com esse marco, fora da base comum), por pontuação. */
function condicoesDoMarco(itens, prox) {
  return itens.filter(it => it.nivel === 'condicao' && it.marco === prox && !it.generica).sort((a, b) => compararPontos(a, b, prox));
}
/** Aviso de mais de 5 Condições no próximo marco (REC-22) ou null. */
function avisoCondicoes(itens, prox) {
  const L = condicoesDoMarco(itens, prox);
  if (L.length <= MAX_CONDICOES) return null;
  const vars = { n: L.length, marco: MARCO_FRASE[prox] || '' };
  return {
    n: L.length, marco: prox, marcoNome: NOME_MARCO[prox] || '', texto: sub(TXT_SEL.aviso, vars), chave: TXT_SEL.aviso, vars,
    lista: L.map(it => ({ id: it.id, oque: it.oque, pacote: it.pacote, titulo: TITULO_PACOTE[it.pacote] || '', item: it })),
  };
}

// o teste efetivo começa pela prova de conceito?
const pilotoEmVezDePoc = k => k.teste === 'piloto' && ['poc', 'ambos'].includes(k.rec && k.rec.modo);
function decisaoDe(k, prox, gatilhos) {
  if (prox !== 'M1') return { chave: DECISAO[prox] || DECISAO.M3, vars: {} };
  if (gatilhos.includes('piloto')) return { chave: DECISAO.teste, vars: {} };
  const modo = k.rec && k.rec.modo;
  const pocPrimeiro = k.poc || k.teste === 'ambos' || (k.teste === 'recomendar' && modo === 'ambos');
  if (pocPrimeiro) return { chave: k.gratis ? DECISAO.pocGratis : DECISAO.poc, vars: {} };
  if (k.temPiloto && k.teste) {
    const esc = +((k.c && k.c.piloto) || {}).escolas || 0;
    return esc > 0 ? { chave: DECISAO.pilotoEsc, vars: { n: esc } } : { chave: DECISAO.piloto, vars: {} };
  }
  return { chave: DECISAO.teste, vars: {} };
}

/**
 * Veredito da próxima decisão (4.4), o mesmo objeto para a capa, "Em resumo", o PDF e a síntese do capítulo 4:
 * "Próxima decisão: {objeto}. {Veredito}. Faltam: {cartões 1–3}." O código 'nao' (redação construtiva, decisão 2 do
 * policy brief: "Recomendação: começar por…", nunca "Ainda não avance") só nos 4 gatilhos:
 * 'problema' (R-05 disparada), 'piloto' (piloto escolhido quando a ferramenta indica prova de conceito antes),
 * 'contestacao' (R-32 como Condição: saída que afeta pessoas sem caminho de contestação) e 'excesso' (> 5 Condições).
 */
function veredito(itens, cartoes, k) {
  const prox = k.proxMarco;
  const cond = condicoesDoMarco(itens, prox);
  const gatilhos = [];
  if (itens.some(it => it.id === 'R-05')) gatilhos.push('problema');
  if (prox === 'M1' && pilotoEmVezDePoc(k)) gatilhos.push('piloto');
  if (itens.some(it => it.id === 'R-32' && it.condicao)) gatilhos.push('contestacao');
  if (cond.length > MAX_CONDICOES) gatilhos.push('excesso');
  const codigo = gatilhos.length ? 'nao' : cond.length ? 'condicoes' : 'pode';
  const vars = { n: cond.length, marco: MARCO_FRASE[prox] || '' };
  const g = gatilhos[0];
  const frase = codigo === 'pode' ? TXT_SEL.pode : codigo === 'condicoes' ? TXT_SEL.condicoes
    : g === 'problema' ? TXT_SEL.naoProblema : g === 'piloto' ? TXT_SEL.naoPiloto : g === 'contestacao' ? TXT_SEL.naoContestacao : TXT_SEL.naoExcesso;
  const porque = codigo === 'pode' ? TXT_SEL.porquePode : codigo === 'condicoes' ? (cond.length === 1 ? TXT_SEL.porqueCond1 : TXT_SEL.porqueCondN)
    : g === 'problema' ? TXT_SEL.porqueProblema : g === 'piloto' ? TXT_SEL.porquePiloto : g === 'contestacao' ? TXT_SEL.porqueContestacao : TXT_SEL.porqueExcesso;
  const dec = decisaoDe(k, prox, gatilhos);
  const faltam = cartoes.slice(0, 3).map(c => {
    const L = c.lider, ch = L.chaves || {};
    const curto = L.curto || '';
    return { id: L.id, n: c.n, pacote: c.pacote, texto: semPonto(curto || L.oque), chave: curto ? (ch.curto || curto) : (ch.oque || L.oque), vars: ch.vars || {} };
  });
  const lista = codigo === 'pode' ? TXT_SEL.comece : TXT_SEL.faltam;
  const partes = [sub(TXT_SEL.proxima, { 0: sub(dec.chave, dec.vars) }), sub(frase, vars)];
  if (faltam.length) partes.push(sub(lista, { 0: faltam.map(f => f.texto).join('; ') }));
  return {
    codigo, rotulo: ROTULO_VEREDITO[codigo], gatilhos, marco: prox, marcoNome: NOME_MARCO[prox] || '',
    decisao: sub(dec.chave, dec.vars), frase: sub(frase, vars), porque: sub(porque, vars), nCondicoes: cond.length,
    faltam, texto: partes.join(' '),
    chaves: { decisao: dec.chave, decisaoVars: dec.vars, frase, porque, vars, lista },
  };
}

/** Veredito do caso em branco ou sem ações (3.3, item 4). */
function vereditoVazio(prox) {
  return {
    codigo: 'sem', rotulo: ROTULO_VEREDITO.sem, gatilhos: [], marco: prox || 'M1', marcoNome: NOME_MARCO[prox || 'M1'] || '',
    decisao: '', frase: TXT_SEL.vazio, porque: TXT_SEL.vazioTexto, nCondicoes: 0, faltam: [], texto: TXT_SEL.vazio,
    chaves: { decisao: '', decisaoVars: {}, frase: TXT_SEL.vazio, porque: TXT_SEL.vazioTexto, vars: {}, lista: '' },
  };
}

// {x} → vars[x]; sem valor, "a calcular" (como em recomendacoes.js)
const preencherTr = (s, vars) => String(tr(s || '')).replace(/\{([a-zA-Z0-9_]+)\}/g, (m, n) => (vars && vars[n] != null && vars[n] !== '' ? String(vars[n]) : tr(TXT_SEL.aCalcular)));
/** O veredito traduzido: { texto, frase, porque, decisao, rotulo, faltam: [texto] } (`texto` é a frase inteira). */
function trVeredito(v) {
  if (!v) return null;
  const ch = v.chaves || {};
  const vars = Object.assign({}, ch.vars, ch.vars && ch.vars.marco ? { marco: tr(ch.vars.marco) } : {});
  const frase = sub(tr(ch.frase || ''), vars);
  const porque = sub(tr(ch.porque || ''), vars);
  if (v.codigo === 'sem') return { texto: tr(ch.frase), frase, porque, decisao: '', rotulo: tr(v.rotulo), faltam: [] };
  const decisao = sub(tr(ch.decisao || ''), ch.decisaoVars || {});
  const faltam = (v.faltam || []).map(f => semPonto(preencherTr(f.chave, f.vars)));
  const partes = [tr(TXT_SEL.proxima).replace('{0}', decisao), frase];
  if (faltam.length) partes.push(tr(ch.lista || TXT_SEL.faltam).replace('{0}', faltam.join('; ')));
  return { texto: partes.join(' '), frase, porque, decisao, rotulo: tr(v.rotulo), faltam };
}
/** O aviso de mais de 5 Condições traduzido (texto). */
function trAviso(a) {
  if (!a) return '';
  return sub(tr(a.chave), Object.assign({}, a.vars, { marco: tr(a.vars.marco) }));
}

// ----------------------------------------------------------- "O que fazer" por pacote (REC-23)
/**
 * Agrupa as ações por pacote (no máximo 11 grupos; com as pendências, 12 no nível de cima). Cada grupo traz todas as
 * ações do pacote (cada uma com o seu R-nn e a sua origem) e a divisão por marco. A base comum (genéricas) fica fora.
 * Ordem dos grupos: a da melhor ação de cada um (4.1).
 */
function agruparPorPacote(itens, prox) {
  const ord = (a, b) => compararPontos(a, b, prox);
  const porPacote = new Map();
  itens.filter(it => !it.generica).forEach(it => {
    if (!porPacote.has(it.pacote)) porPacote.set(it.pacote, []);
    porPacote.get(it.pacote).push(it);
  });
  const G = [...porPacote.entries()].map(([pacote, L]) => {
    const membros = L.slice().sort(compararMembros(prox));
    const marcos = [...new Set(membros.map(x => x.marco))].sort((a, b) => ORDEM_MARCO[a] - ORDEM_MARCO[b])
      .map(m => ({ marco: m, marcoNome: NOME_MARCO[m] || '', itens: membros.filter(x => x.marco === m) }));
    const topo = L.slice().sort(ord)[0];
    const melhor = membros[0];
    return {
      pacote, titulo: TITULO_PACOTE[pacote] || '', lente: LENTE_PACOTE[pacote] || '', lenteNome: LENTES[LENTE_PACOTE[pacote]] || '',
      nivel: melhor.nivel, rotuloNivel: rotuloNivel(melhor.nivel, melhor.marco), pontos: topo.pontos,
      nCondicoes: L.filter(x => x.nivel === 'condicao').length, ids: membros.map(x => x.id), itens: membros, marcos, _topo: topo,
    };
  });
  return G.sort((a, b) => ord(a._topo, b._topo)).map(g => { delete g._topo; return g; });
}

// ----------------------------------------------------------- pendências das respostas sugeridas (3.3, item 4)
/** Uma pendência por pergunta sugerida (não confirmada) que dispara ações; as ações ficam com `confirmar`. */
function pendenciasSugeridas(itens) {
  const porCampo = new Map();
  itens.forEach(it => {
    const o = it.origem || {};
    if (!o.sugerido || !o.campo) return;
    it.confirmar = sub(TXT_SEL.confirmar, { n: o.n });
    if (!porCampo.has(o.campo)) {
      porCampo.set(o.campo, { id: 'S-' + o.campo, tipo: 'sugerida', campo: o.campo, n: o.n, pergunta: o.pergunta, resposta: o.resposta,
        motivo: TXT_SEL.sugerida, suspende: [], dependem: [], ir: it.ir || '' });
    }
    const p = porCampo.get(o.campo);
    if (!p.dependem.includes(it.id)) p.dependem.push(it.id);
  });
  return [...porCampo.values()].sort((a, b) => String(a.n).localeCompare(String(b.n), 'pt', { numeric: true }));
}

/**
 * Seleção completa sobre os itens pontuados e ordenados: { cartoes, veredito, avisoCondicoes, grupos, baseComum,
 * condicoes (ids das Condições do próximo marco), vazio }. `vazio` (as 3 perguntas que mais liberam ações) só no
 * caso sem ações; nesse caso o veredito é "Ainda sem recomendações".
 */
function selecao(itens, k, vazio) {
  const prox = k.proxMarco;
  const acoes = itens.filter(it => !it.generica);
  const baseComum = itens.filter(it => it.generica);
  if (!acoes.length) {
    return { cartoes: [], veredito: vereditoVazio(prox), avisoCondicoes: null, grupos: [], baseComum, condicoes: [],
      vazio: Object.assign({ texto: TXT_SEL.vazio, explicacao: TXT_SEL.vazioTexto, perguntas: [] }, vazio || {}) };
  }
  const cartoes = selecionarCartoes(itens, k);
  return {
    cartoes, veredito: veredito(itens, cartoes, k), avisoCondicoes: avisoCondicoes(itens, prox), grupos: agruparPorPacote(itens, prox),
    baseComum, condicoes: condicoesDoMarco(itens, prox).map(it => it.id), vazio: null,
  };
}

// Textos novos do pacote R3 (chaves de tradução para o orquestrador)
const TEXTOS_REC_R3 = [...new Set([].concat(Object.values(TXT_SEL), Object.values(ROTULO_VEREDITO), Object.values(DECISAO),
  NIVEIS.flatMap(n => [n[1], n[2]]), Object.values(MARCO_FRASE)))];

export {
  TXT_SEL, ROTULO_VEREDITO, DECISAO, N_CARTOES, MAX_CONDICOES, TEXTOS_REC_R3, CHAVES_DINHEIRO,
  emJogoDe, rotuloNivel, rotuloNivelCurto, pontuar, compararPontos, candidatosCartoes, selecionarCartoes, condicoesDoMarco, avisoCondicoes,
  veredito, vereditoVazio, trVeredito, trAviso, agruparPorPacote, pendenciasSugeridas, selecao,
};
