// =====================================================================
// v15 · proposta C: documento vivo. A tela principal é o próprio plano de contratação, que se escreve enquanto a
// pessoa responde. Cada resposta que cabe numa frase aparece como lacuna editável no texto; as que não cabem
// (grade de escolas, catálogo de problemas, governança, ferramentas, ondas) entram como blocos de formulário no
// ponto certo do documento. O estado (S), as perguntas (CAMPOS), o motor de custo e o PDF são os mesmos da v14.
// Depende de fluxo.js (controle, qOk, sugerido...), resumo.js e relatorio.js (seções do plano) e plano_pdf.js.
// =====================================================================

const DOC = {
  pop: null,          // lacuna em edição: { key, f, sub, snap, antes, el }
  fila: false,        // "Preencher em ordem" ligado
  alvo: '',           // bloco de formulário em destaque (id do campo)
  ult: null,          // última mudança de custo { rot, dT, dA }
  faixa: null,        // { chave, lo, hi }
  tFaixa: 0, tGer: 0, gaveta: false, menu: false, todas: false, io: null, ioNum: null,
};

// Nomes curtos das lacunas (texto entre colchetes quando falta a resposta, lista de pendências e leitores de tela)
const LAC_ROT = {
  nivel: 'nível administrativo', local: 'nome do lugar ou da rede', situacao: 'ponto de partida', etapas: 'etapas de ensino',
  grade: 'escolas e estudantes por etapa', prioridades: 'prioridades da rede', problemas: 'problemas a resolver',
  olhando: 'o problema em poucas palavras', problema: 'situação atual', impactos: 'impacto desejado', resultado: 'resultado esperado e como medir',
  linhaBase: 'linha de base', alternativa: 'alternativa sem IA', testes: 'prova de conceito ou piloto', tarefas: 'tarefas da IA',
  titulo: 'nome da aplicação', usuarios: 'quem usa', afetados: 'quem recebe o resultado', consequencias: 'uso da resposta da ferramenta',
  frequencia: 'frequência de uso', nFerramentas: 'número de ferramentas', conheceFerramentas: 'já sabe quais', ferramentas: 'lista de ferramentas',
  tipoTec: 'tipo de tecnologia', pagamento: 'forma de pagamento', licenca: 'tipo de licença', adaptacao: 'adaptação necessária',
  piloto: 'tamanho e duração do teste', 'piloto:escolas': 'escolas no piloto', 'piloto:participantes': 'participantes do piloto', 'piloto:meses': 'meses de piloto',
  'poc:participantes': 'pessoas na prova de conceito', 'poc:meses': 'meses de prova de conceito',
  internet: 'internet nas escolas', escolasInternet: 'escolas com internet adequada', modeloDisp: 'uso dos dispositivos', dispExistem: 'dispositivos existentes',
  formados: 'quem será formado', formacaoTipo: 'tipo de formação', formacaoFormato: 'formato da formação', formacaoHoras: 'horas de formação',
  formacaoPaga: 'quem paga a formação', suporteQuem: 'quem dá suporte', suporteNivel: 'nível de suporte', acompanhamento: 'acompanhamento do uso',
  implantacao: 'primeira etapa da implantação', 'implantacao:escolas': 'escolas na primeira etapa', 'implantacao:pessoas': 'pessoas na primeira etapa',
  arquitetura: 'arquitetura', elegiveis: 'pessoas que usariam', expansao: 'prazo para chegar a todos', horizonte: 'anos de uso',
  curva: 'crescimento do uso', ondas: 'ondas de adoção', reposicaoDisp: 'reposição dos dispositivos', rotacaoFormacao: 'saída anual de pessoas formadas',
};
// Perguntas dos subcampos (tamanho do teste e primeira etapa), uma lacuna cada
const SUB_T = {
  'piloto:escolas': 'Quantas escolas entram no piloto?', 'piloto:participantes': 'Quantas pessoas participam do piloto?', 'piloto:meses': 'Quantos meses dura o piloto?',
  'poc:participantes': 'Quantas pessoas testam a prova de conceito?', 'poc:meses': 'Quantos meses dura a prova de conceito?',
  'implantacao:escolas': 'Quantas escolas entram na primeira etapa da implantação?', 'implantacao:pessoas': 'Quantas pessoas usam a ferramenta na primeira etapa da implantação?',
};
const SUB_UN = { escolas: 'escolas', participantes: 'pessoas', pessoas: 'pessoas', meses: 'meses' };

// ----------------------------------------------------------- o documento: seções do plano, blocos e frases
// Cada frase é um modelo inteiro por idioma ({0}, {1}...), nunca pedaços concatenados. "~" no fim da lacuna:
// o rótulo da opção entra no meio da frase com a inicial minúscula (só em idiomas com caixa).
const DOC_SECOES = [
  { id: 'sintese', blocos: [{ itens: [
    { f: '{0} quer usar a IA na educação para enfrentar este problema: {1}.', l: ['local', 'olhando'] },
    { f: 'A proposta é começar por {0} e, se der certo, levar a ferramenta a {1} pessoas, com a estimativa de custo para {2} de uso.', l: ['testes~', 'elegiveis', 'horizonte'] },
  ] }] },
  { id: 's1', blocos: [
    { h: 'Onde e para quem', itens: [
      { f: 'Este plano é para {0}. A decisão será tomada no nível {1}.', l: ['local', 'nivel~'] },
      { f: 'Ponto de partida: {0}. Etapas de ensino atendidas: {1}.', l: ['situacao~', 'etapas~'] },
      { html: 'pais' },
      { bloco: 'grade' },
    ] },
    { h: 'O problema e o resultado esperado', itens: [
      { bloco: 'prioridades' }, { bloco: 'problemas' },
      { f: 'Em poucas palavras, o problema é este: {0}.', l: ['olhando'] },
      { texto: 'problema' },
      { f: 'Com a IA, a rede quer alcançar este impacto: {0}.', l: ['impactos~'] },
      { texto: 'resultado' },
      { f: 'Linha de base dos problemas marcados: {0}. Alternativa sem IA já comparada: {1}.', l: ['linhaBase~', 'alternativa~'] },
    ] },
    { h: 'O que a IA vai fazer e para quem', itens: [
      { f: 'A rede quer que a IA faça estas tarefas: {0}.', l: ['tarefas~'] },
      { f: 'A ferramenta será usada por {0}, e o que ela produz chega a {1}.', l: ['usuarios~', 'afetados~'] },
      { f: 'Com a resposta da ferramenta, as pessoas vão {0}. Frequência de uso por pessoa: {1}.', l: ['consequencias~', 'frequencia~'] },
    ] },
    { h: 'O teste antes da compra', itens: [
      { f: 'Antes de contratar, a rede vai fazer: {0}.', l: ['testes~'] },
      { f: 'A prova de conceito terá {0} pessoas testando, por {1} meses.', l: ['poc:participantes', 'poc:meses'], se: () => ['poc', 'ambos'].includes(modoTeste()) },
      { f: 'O piloto terá {0} escolas e {1} participantes, por {2} meses.', l: ['piloto:escolas', 'piloto:participantes', 'piloto:meses'], se: () => modoTeste() !== 'poc' },
    ] },
    { h: 'A ferramenta', itens: [
      { f: 'Número de ferramentas no teste: {0}. A rede já sabe quais vai usar? {1}.', l: ['nFerramentas~', 'conheceFerramentas'] },
      { bloco: 'ferramentas' },
      { f: 'Tipo de tecnologia da ferramenta principal: {0}. Forma de pagamento: {1}. Licença: {2}.', l: ['tipoTec~', 'pagamento~', 'licenca~'] },
      { f: 'Adaptação necessária: {0}.', l: ['adaptacao~'] },
    ] },
    { h: 'Implantação e escala', itens: [
      { f: 'Na primeira etapa da implantação (Ano 1), a ferramenta chega a {0} escolas e {1} pessoas.', l: ['implantacao:escolas', 'implantacao:pessoas'] },
      { f: 'Arquitetura considerada: {0}.', l: ['arquitetura~'] },
      { f: 'Se der certo, {0} pessoas usariam a ferramenta na rede, e o uso chega a todas elas {1}.', l: ['elegiveis', 'expansao~'] },
      { f: 'A estimativa cobre {0} de uso, além do Ano 0.', l: ['horizonte'] },
      { f: 'Premissas opcionais: crescimento do uso {0}; reposição dos dispositivos: {1}; pessoas formadas que saem da rede por ano: {2}%.', l: ['curva~', 'reposicaoDisp~', 'rotacaoFormacao'] },
      { bloco: 'ondas' },
    ] },
  ] },
  { id: 's2', blocos: [
    { h: 'O que entra no custo além da ferramenta', itens: [
      { f: 'Internet adequada nas escolas: {0}.', l: ['internet~'] },
      { f: 'Escolas da rede que já têm internet adequada: {0}.', l: ['escolasInternet'], se: () => visivel(CAMPO_POR_ID.escolasInternet) },
      { f: 'Uso dos dispositivos: {0}. Os dispositivos já existem? {1}.', l: ['modeloDisp~', 'dispExistem'] },
      { f: 'Serão formados {0}, com formação deste tipo: {1}.', l: ['formados~', 'formacaoTipo~'] },
      { f: 'Formato da formação: {0}, com {1} horas por pessoa. Quem paga: {2}.', l: ['formacaoFormato~', 'formacaoHoras', 'formacaoPaga~'] },
      { f: 'Suporte aos usuários: {0}, em nível {1}. Acompanhamento do uso: {2}.', l: ['suporteQuem~', 'suporteNivel~', 'acompanhamento~'] },
      { html: 'moeda' },
    ] },
  ] },
  { id: 's3', blocos: [] },
  { id: 's4', blocos: [] },
  { id: 's5', blocos: [{ h: 'A governança que a rede já tem', itens: [{ bloco: 'gov' }] }] },
];
const DOC_SEC_ROT = { sintese: 'Sumário executivo', s1: 'O que se compra', s2: 'O que custa e quando', s3: 'O que pode mudar o custo', s4: 'O que exigir na contratação', s5: 'Que governança é necessária', anexos: 'Anexos A a I' };
const GOV_IDS = () => QUESTOES_G.map(q => q.id);

// Campos (CAMPOS) na ordem em que aparecem no documento, com a seção de cada um
function ordemDoc() {
  if (ordemDoc.c) return ordemDoc.c;
  const L = [], sec = {}, vistos = new Set();
  const pos = (id, s) => { if (!vistos.has(id) && CAMPO_POR_ID[id]) { vistos.add(id); L.push(id); sec[id] = s; } };
  // o sumário repete respostas das seções: a ordem (e "Preencher em ordem") segue as seções 1 a 5
  DOC_SECOES.filter(S0 => S0.id !== 'sintese').concat(DOC_SECOES.filter(S0 => S0.id === 'sintese')).forEach(S0 => S0.blocos.forEach(b => b.itens.forEach(it => {
    if (it.l) it.l.forEach(k => pos(k.replace('~', '').split(':')[0], S0.id));
    if (it.bloco === 'gov') GOV_IDS().forEach(id => pos(id, S0.id));
    else if (it.bloco) pos(it.bloco, S0.id);
    if (it.texto) pos(it.texto, S0.id);
  })));
  pos('titulo', 'capa');
  CAMPOS.forEach(f => pos(f.id, 's1'));   // nenhuma pergunta fica de fora
  ordemDoc.c = { L, sec };
  return ordemDoc.c;
}
const BLOCO_TIPOS = ['grade', 'prior', 'problemas', 'ferramentas', 'ondas', 'seg'];
const ehBloco = f => BLOCO_TIPOS.includes(f.tipo);

// ----------------------------------------------------------- valores das lacunas
const LATINO = () => ['pt', 'en', 'es', 'fr', 'bm', 'zu', 'sw'].includes(LANG);
function minus(s) {
  s = String(s || '');
  if (!LATINO() || s.length < 2) return s;
  const a = s.charAt(0), b = s.charAt(1);
  return a !== a.toLowerCase() && b === b.toLowerCase() ? a.toLowerCase() + s.slice(1) : s;
}
function listaTxt(arr) {
  arr = (arr || []).filter(Boolean);
  if (arr.length < 2) return arr[0] || '';
  try { return new Intl.ListFormat(LOC(), { style: 'long', type: 'conjunction' }).format(arr); } catch (e) { return arr.join(', '); }
}
const semPonto = s => String(s || '').trim().replace(/[.。]\s*$/, '');
function partesLac(key) { const k = key.replace('~', ''); const [id, sub] = k.split(':'); return { id, sub: sub || '', f: CAMPO_POR_ID[id], min: key.endsWith('~'), k }; }
function okSub(o, k) {
  const v = (S.caso[o] || {})[k];
  return +v > 0 && (S.exemplo !== 'novo' || !!S.respC[o + '.' + k]);
}
function rotOpcao(f, v) {
  const c = S.caso;
  if (f.id === 'tarefas') return tr(rotTarefa(v));
  if (f.outro && v === f.outro.v) { const t = String((f.onde === 'ctx' ? S.ctx : c)[f.outro.id] || '').trim(); if (t) return t; }
  return tr(rotulo(listaOpc(f), v));
}
// Texto da lacuna (já traduzido) ou '' quando não há valor
function valorLac(f, sub, min) {
  const c = S.caso, m = x => (min ? minus(x) : x);
  if (sub) { const v = (c[f.id] || {})[sub]; return vazio(v) || !(+v > 0) ? '' : fmtInt(v); }
  const v = valorCampo(f);
  switch (f.tipo) {
    case 'texto': case 'area': return semPonto(v);
    case 'num': return !(+v > 0) ? '' : f.casas ? (+v).toLocaleString(LOC(), { maximumFractionDigits: f.casas }) : fmtInt(v);
    case 'horas': return +v > 0 ? fmtInt(v) : '';
    case 'etapas': return listaTxt(etapasAtivas().map(e => m(tr(e[1]))));
    case 'testes': {
      const t = testesDe(); if (!t.length) return '';
      if (t.includes('recomendar')) return tr('o teste que o plano recomendar');
      return listaTxt(t.map(k => m(tr(rotulo(listaOpc(f), k)))));
    }
    case 'arq': {
      if (!v) return '';
      const arqs = (OPC.arquitetura || []);
      if (v === 'nao_sei') { const p = rotulo(arqs, arqPresumida()); return tr('ainda não definida') + (p ? ' (' + tr('a estimativa usa') + ': ' + minus(tr(p)) + ')' : ''); }
      return m(tr(rotulo(arqs, v)));
    }
    case 'seg': return v ? tr(rotulo(RESP_G, v)) : '';
    case 'chips': case 'multi': return listaTxt((Array.isArray(v) ? v : []).map(k => m(rotOpcao(f, k))));
    case 'radio': return vazio(v) ? '' : m(rotOpcao(f, v));
  }
  return '';
}
// 'ok' (resposta da pessoa) | 'ilus' (valor ilustrativo ou sugerido, ainda sem resposta) | 'vazio'
function estadoLac(f, sub) {
  if (sub) { if (okSub(f.id, sub)) return 'ok'; return valorLac(f, sub) ? 'ilus' : 'vazio'; }
  if (qOk(f)) return 'ok';
  return valorLac(f, '') ? 'ilus' : 'vazio';
}
const IC_ILUS = '<svg class="lac-ic" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="3 3" aria-hidden="true"><circle cx="12" cy="12" r="9"/></svg>';
const IC_OK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>';
const IC_GER = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>';
const IC_PEND = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3" aria-hidden="true"><circle cx="12" cy="12" r="9"/></svg>';
const IC_SETA = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>';
const IC_PDF = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/></svg>';
const IC_DESCE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
const IC_MENU = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg>';
const EST_LAC = { ok: 'Sua resposta', ilus: 'Valor ilustrativo, ainda sem resposta', vazio: 'Ainda sem resposta' };
function lacHTML(key, bloco) {
  const p = partesLac(key); if (!p.f) return '';
  const st = estadoLac(p.f, p.sub), rot = tr(LAC_ROT[p.k] || LAC_ROT[p.id] || p.id);
  let v = st === 'vazio' ? '' : valorLac(p.f, p.sub, p.min);
  const mostra = v ? esc(v).replace(/\n/g, '<br>') : '[' + esc(rot) + ']';
  const aria = rot + ': ' + (v || '—') + '. ' + tr(EST_LAC[st]) + '. ' + tr(st === 'ok' ? 'Editar' : 'Responder');
  // <span role="button">: um <button> não quebra linha no meio do texto (o navegador o trata como inline-block)
  return `<span role="button" tabindex="0" class="lac lac-${st}${bloco ? ' lac-bloco' : ''}${DOC.pop && DOC.pop.key === p.k ? ' lac-ed' : ''}" data-lac="${esc(p.k)}" data-min="${p.min ? 1 : ''}" aria-haspopup="dialog" aria-label="${esc(aria)}">${st !== 'ok' ? IC_ILUS : ''}<span class="lac-v">${mostra}</span></span>`;
}
// Frase com lacunas: o modelo inteiro é traduzido e só depois recebe as lacunas
function fraseHTML(it) {
  const t = tr(it.f);
  const partes = t.split(/\{(\d+)\}/);
  return `<p class="dv-f" data-notr>${partes.map((x, i) => i % 2 ? lacHTML(it.l[+x] || '') : esc(x)).join('')}</p>`;
}
function textoHTML(id) {
  const f = CAMPO_POR_ID[id]; if (!f) return '';
  return `<div class="dv-txt" data-notr><p class="dv-txt-r">${esc(tr(LAC_ROT[id]))}${f.opcional ? ` <span class="tag opc">${esc(tr('opcional'))}</span>` : ''}</p>${lacHTML(id, true)}</div>`;
}
function blocoHTML(id) {
  const fs = id === 'gov' ? GOV_IDS().map(k => CAMPO_POR_ID[k]) : [CAMPO_POR_ID[id]];
  if (!fs[0] || !fs.some(visivel)) return '';
  const vis = fs.filter(visivel);
  const nOk = vis.filter(f => qOk(f)).length;
  const st = nOk === vis.length ? 'ok' : 'pend';
  const alvo = vis.some(f => DOC.alvo === f.id);
  const tit = id === 'gov' ? tr('Governança de IA na educação (1.3)') : capP(tr(LAC_ROT[id]));
  const fila = DOC.fila && alvo ? `<div class="dv-fila-bar" role="group" aria-label="${esc(tr('Preencher em ordem'))}"><span>${esc(trN('Lacuna {0} de {1}', posFila(), pendentes().length))}</span><button type="button" class="btn pri" data-act="dv-prox">${esc(tr('Ir para a próxima lacuna'))} ${IC_SETA}</button><button type="button" class="btn" data-act="dv-fila-fim">${esc(tr('Parar'))}</button></div>` : '';
  return `<div class="dv-bloco${alvo ? ' dv-alvo' : ''}" id="bl-${id}" data-bloco="${id}">
    <div class="dv-bl-cab"><span class="dv-bl-t">${esc(tit)}</span><span class="dv-st dv-st-${st}">${st === 'ok' ? IC_OK + esc(tr('Completo')) : IC_PEND + esc(trN(vis.length > 1 ? '{0} de {1} respondidas' : 'A responder', nOk, vis.length))}</span></div>
    ${fila}${vis.map(f => renderQ(f)).join('')}</div>`;
}
function itemHTML(it) {
  if (it.se && !it.se()) return '';
  if (it.f) return fraseHTML(it);
  if (it.texto) return textoHTML(it.texto);
  if (it.bloco) return blocoHTML(it.bloco);
  if (it.html === 'pais') return typeof blocoPais === 'function' ? blocoPais() : '';
  if (it.html === 'moeda') return `<div class="dv-moeda">${seletorMoeda()}</div>`;
  return '';
}
function edHTML(secId) {
  const S0 = DOC_SECOES.find(x => x.id === secId); if (!S0 || !S0.blocos.length) return '';
  return `<div class="dv-ed" data-ed="${secId}">${S0.blocos.map(b => `${b.h ? `<h4 class="dv-h">${esc(tr(b.h))}</h4>` : ''}${b.itens.map(itemHTML).join('')}`).join('')}</div>`;
}

// ----------------------------------------------------------- progresso e pendências
function camposAplicaveis() { return ordemDoc().L.map(id => CAMPO_POR_ID[id]).filter(f => f && visivel(f)); }
function pendentes() { return camposAplicaveis().filter(f => !f.opcional && !qOk(f)); }
function progressoDoc() {
  const A = camposAplicaveis().filter(f => !f.opcional);
  return { n: A.filter(f => qOk(f)).length, N: A.length };
}
// Lacuna (chave) a abrir para um campo pendente: o primeiro subcampo sem resposta, o próprio campo, ou '' (bloco)
function chaveDe(f) {
  if (ehBloco(f)) return '';
  if (f.tipo === 'setup' || f.tipo === 'implant') { const s = subcampos(f).find(([o, k]) => !okSub(o, k)) || subcampos(f)[0]; return s ? s[0] + ':' + s[1] : f.id; }
  return f.id;
}
function posFila() { const p = pendentes(); const cur = DOC.pop ? DOC.pop.f.id : DOC.alvo; const i = p.findIndex(f => f.id === cur); return i < 0 ? 1 : i + 1; }
function secDe(id) { return ordemDoc().sec[id] || 's1'; }
function rotCampo(f) { return tr(LAC_ROT[f.id] || f.id); }

// ----------------------------------------------------------- números (sempre de numerosCusto)
function numerosDoc() {
  let n = null; try { n = numerosCusto(); } catch (e) { console.warn(e); return null; }
  const tco = (n.av && n.av.tco) || {}, an = tco.anual || {};
  const por = tco.custoPorAprendizAno != null ? [tco.custoPorAprendizAno, 'Por estudante, por ano'] : tco.custoPorProfessorAno != null ? [tco.custoPorProfessorAno, 'Por professor, por ano'] : [n.ind.icu, 'Por usuário ativo, por ano'];
  return { n, total: n.total, ano0: n.ano0, regime: an.eco != null ? an.eco : n.anual, anoRegime: an.ano, por, H: n.H };
}
// Faixa provável (P10 a P90): vem da simulação do relatório (relPesado), calculada depois da resposta, sem travar a tela
function faixaDoc(total) {
  let chave = '';
  try { const cfg = cfgAtual(); garantirOpc(cfg); chave = JSON.stringify(cfg); } catch (e) { return null; }
  if (typeof REL_CACHE !== 'undefined' && REL_CACHE && REL_CACHE.chave === chave) {
    const ct = REL_CACHE.sim.ct; DOC.faixa = { chave, lo: Math.min(ct.p10, total), hi: Math.max(ct.p90, total) };
  }
  if (DOC.faixa && DOC.faixa.chave === chave) return DOC.faixa;
  clearTimeout(DOC.tFaixa);
  DOC.tFaixa = setTimeout(() => { try { const cfg = cfgAtual(); garantirOpc(cfg); relPesado(cfg); atualizarNumeros(); } catch (e) { console.warn(e); } }, 250);
  return null;
}
const sinalDin = x => (Math.abs(x) < 0.5 ? grande(0) : (x < 0 ? '−' : '+') + grande(Math.abs(x)));
function numerosHTML(mini) {
  const d = numerosDoc(); if (!d) return '';
  const fx = faixaDoc(d.total);
  const ilus = `<span class="dv-ilus">${IC_ILUS}${esc(tr('Ilustrativo'))}</span>`;
  const por = `${esc(tr(d.por[1]))}`;
  const kpis = [
    ['ano0', tr('Ano 0 (o teste)'), grande(d.ano0), ''],
    ['regime', d.anoRegime ? trN('Custo anual em regime (Ano {0})', d.anoRegime) : tr('Custo anual em regime'), grande(d.regime), ''],
    ['por', por, din(d.por[0], 2), ''],
  ];
  if (mini) return `<div class="dv-mini-in"><span class="dv-mk" data-k="tco"><span>${esc(tr('TCO'))}</span> <b class="num">${esc(grande(d.total))}</b></span>${kpis.slice(0, 2).map(k => `<span class="dv-mk" data-k="${k[0]}"><span>${esc(k[1])}</span> <b class="num">${esc(k[2])}</b></span>`).join('')}${ilus}</div>`;
  let barra = '';
  if (fx) {
    const w = Math.max(fx.hi - fx.lo, d.total * 0.02), a = fx.lo - 0.5 * w, b = fx.hi + 0.5 * w, pos = v => (100 * (v - a) / (b - a)).toFixed(2);
    barra = `<div class="dv-faixa" aria-hidden="true"><i style="inset-inline-start:${pos(fx.lo)}%;width:${(pos(fx.hi) - pos(fx.lo)).toFixed(2)}%"></i><b style="inset-inline-start:${pos(d.total)}%"></b></div>
      <span class="dv-fx-t">${esc(tr('Faixa provável (P10 a P90)'))}: <span class="num">${esc(trN('{0} a {1}', grande(fx.lo), grande(fx.hi)))}</span><br>${esc(tr('8 em cada 10 cenários simulados caem aqui'))}</span>`;
  } else barra = `<span class="dv-fx-t">${esc(tr('Calculando a faixa provável…'))}</span>`;
  const fe = faltasEstimativa();
  const falta = fe.length ? `<p class="dv-num-falta">${IC_PEND}<span>${esc(tr('A estimativa ainda usa valores ilustrativos para:'))}</span> ${fe.map(f => `<button type="button" class="link" data-ir-lac="${esc(f.id)}">${esc(rotCampo(f))}</button>`).join(', ')}</p>` : '';
  const ult = DOC.ult ? `<p class="dv-ult"><span>${esc(tr('Última mudança'))}:</span> <b class="num">${esc(trN('TCO {0}', sinalDin(DOC.ult.dT)))}</b> · <span class="num">${esc(trN('Ano 0 {0}', sinalDin(DOC.ult.dA)))}</span> <span class="muted">(${esc(DOC.ult.rot)})</span></p>` : '';
  return `<div class="dv-num-cab"><h2 class="dv-num-t" id="dv-num-t">${esc(tr('Em números'))}</h2>${ilus}<span class="dv-num-m">${esc(trN('Preços do Ano 0 · horizonte de {0} anos · muda a cada resposta', d.H))}</span></div>
    <div class="dv-num-g">
      <div class="dv-tco" data-k="tco"><span class="dv-l">${esc(tr('Custo total do ciclo de vida (TCO)'))}</span><span class="dv-v num">${esc(grande(d.total))}</span>${barra}</div>
      <ul class="dv-kpis" aria-label="${esc(tr('Números do plano'))}">${kpis.map(k => `<li data-k="${k[0]}"><span class="dv-l">${esc(k[1])}</span><span class="dv-v2 num">${esc(k[2])}</span></li>`).join('')}</ul>
    </div>${ult}${falta}
    <p class="dv-num-pe"><button type="button" class="link" data-act="dv-premissas">${esc(tr('Ajustar premissas'))}</button> · <a href="#plano-s2">${esc(tr('Ver o detalhamento do custo'))}</a></p>`;
}
function atualizarNumeros() {
  const b = document.getElementById('dv-num'); if (b) { const h = numerosHTML(false); if (b.dataset.h !== h) { b.innerHTML = h; b.dataset.h = h; } }
  const m = document.getElementById('dv-mini'); if (m) { const h = numerosHTML(true); if (m.dataset.h !== h) { m.innerHTML = h; m.dataset.h = h; } }
  const fab = document.getElementById('dv-num-cel'); if (fab) fab.innerHTML = numerosCel();
}
// Celular: os números numa faixa rolável logo abaixo do título
function numerosCel() { return ''; }

// ----------------------------------------------------------- barra superior, índice e pendências
function nomeCaso() {
  const ex = ['A', 'B', 'C', 'D'].includes(S.exemplo) && typeof CASOS !== 'undefined' && CASOS[S.exemplo];
  return S.caso.titulo || (S.ctx && S.ctx.olhando) || (ex ? tr(CASOS[S.exemplo].titulo) : tr('Caso sem título'));
}
function topoHTML() {
  const pr = progressoDoc(), k = pr.N - pr.n;
  return `<div class="tp-prog" role="status" aria-live="polite"><span class="tp-n"><b class="num">${esc(trN('{0} de {1}', pr.n, pr.N))}</b> <span>${esc(tr('respostas'))}</span></span>
      <span class="tp-bar" aria-hidden="true"><i style="width:${pr.N ? (100 * pr.n / pr.N).toFixed(1) : 0}%"></i></span>
      ${k ? `<span class="tp-lac">${esc(trN(k === 1 ? '1 lacuna' : '{0} lacunas', k))}</span>` : `<span class="tp-ok">${IC_OK}${esc(tr('Tudo respondido'))}</span>`}</div>
    ${k ? `<button type="button" class="btn pri tp-fila" data-act="dv-fila">${esc(tr('Preencher em ordem'))} ${IC_SETA}</button>` : ''}
    <button type="button" class="btn${k ? '' : ' pri'} tp-pdf" data-act="pdf">${IC_PDF}<span>${esc(tr('Baixar PDF'))}</span></button>`;
}
function renderTopo() {
  const on = S.boasVindas === false;
  document.body.classList.toggle('doc-on', on);
  const t = document.getElementById('top-doc'); if (t) { t.hidden = !on; if (on) { const h = topoHTML(); if (t.dataset.h !== h) { t.innerHTML = h; t.dataset.h = h; } } }
  const g = document.getElementById('btn-gaveta'); if (g) { g.hidden = !on; g.setAttribute('aria-expanded', String(!!DOC.gaveta)); }
  const cn = document.getElementById('caso-nome'); if (cn) cn.textContent = on || !SALVO ? nomeCaso() : (SALVO.nome || tr('Caso salvo'));
  const ct = document.getElementById('caso-tag'); if (ct) { const ex = ['A', 'B', 'C', 'D'].includes(S.exemplo); ct.hidden = !ex; ct.textContent = tr('Exemplo'); }
  const fab = document.getElementById('dv-fab'); if (fab) { const k = pendentes().length; fab.hidden = !on || !k || !!DOC.pop; fab.innerHTML = `${esc(tr('Preencher em ordem'))} <span class="dv-fab-n" aria-label="${esc(trN('{0} lacunas', k))}">${k}</span>`; }
}
function estadoSecao(sid) {
  if (sid === 'anexos' || sid === 's3' || sid === 's4') return { st: 'ger', k: 0 };
  const ids = camposAplicaveis().filter(f => !f.opcional && secDe(f.id) === sid);
  if (!ids.length) return { st: 'ger', k: 0 };
  const k = ids.filter(f => !qOk(f)).length;
  return { st: k ? 'pend' : 'ok', k };
}
function indiceHTML() {
  const secs = ['sintese', 's1', 's2', 's3', 's4', 's5', 'anexos'];
  const num = { s1: '1', s2: '2', s3: '3', s4: '4', s5: '5' };
  const est = e => e.st === 'ok' ? `<span class="dv-st dv-st-ok">${IC_OK}${esc(tr('Completo'))}</span>` : e.st === 'pend' ? `<span class="dv-st dv-st-pend">${IC_PEND}${esc(trN(e.k === 1 ? '1 lacuna' : '{0} lacunas', e.k))}</span>` : `<span class="dv-st dv-st-ger">${IC_GER}${esc(tr('Gerado'))}</span>`;
  const P = pendentes(), K = 6, vis = DOC.todas ? P : P.slice(0, K);
  const cur = DOC.pop ? DOC.pop.f.id : DOC.alvo;
  const pend = P.length ? `<section class="dv-pend" aria-labelledby="dv-pend-t">
      <h2 id="dv-pend-t">${esc(tr('Lacunas pendentes'))} <span>· ${P.length}</span></h2>
      <p class="dv-pend-p">${esc(tr('Até você responder, o plano usa um valor ilustrativo.'))}</p>
      <ul>${vis.map(f => `<li><button type="button" class="dv-pl" data-ir-lac="${esc(f.id)}"${cur === f.id ? ' aria-current="true"' : ''}><span>${esc(capP(rotCampo(f)))}</span><small>${esc(trN('{0} · pergunta {1}', secRot(secDe(f.id)), f.n))}</small></button></li>`).join('')}</ul>
      ${P.length > K ? `<button type="button" class="link dv-mais" data-act="dv-todas" aria-expanded="${!!DOC.todas}">${esc(DOC.todas ? tr('Mostrar menos') : trN('Ver as outras {0}', P.length - K))}</button>` : ''}
      <button type="button" class="btn pri dv-fila-b" data-act="dv-fila">${esc(tr('Preencher em ordem'))} ${IC_SETA}</button></section>`
    : `<section class="dv-pend dv-pend-ok"><p>${IC_OK} ${esc(tr('Todas as respostas foram dadas. Revise o texto e baixe o PDF.'))}</p></section>`;
  let logos = '';
  try { logos = [...document.querySelectorAll('.rodape-logos .logo')].map(i => `<img src="${i.getAttribute('src')}" alt="${esc(i.getAttribute('alt') || '')}" height="28">`).join(''); } catch (e) { }
  return `<div class="dv-ind-in"><nav class="dv-toc" aria-label="${esc(tr('Neste plano'))}"><p class="dv-ind-t">${esc(tr('Neste plano'))}</p>
    <ol>${secs.map(s => `<li${s === 'anexos' ? ' class="dv-ax"' : ''}><a href="#plano-${s}" data-toc-l="${s}">${num[s] ? `<span class="dv-in">${num[s]}</span>` : ''}<span class="dv-il">${esc(tr(DOC_SEC_ROT[s]))}</span>${est(estadoSecao(s))}</a>${s === 'anexos' && DOC.anexos ? `<ol class="dv-ax-l">${DOC.anexos.map(a => `<li><a href="#plano-${a.s.id}" data-toc-l="${a.s.id}"><span class="dv-in">${esc(a.s.letra)}</span><span class="dv-il">${esc(a.s.h)}</span></a></li>`).join('')}</ol>` : ''}</li>`).join('')}</ol></nav>
    ${pend}
    <div class="dv-vinc"><p>${esc(tr('Vinculado à Cátedra UNESCO UNITWIN de IA Desplugada na Educação e ao IA.EDU'))}</p><div class="dv-logos">${logos}</div></div></div>`;
}
function secRot(sid) { return sid === 'capa' ? tr('Título') : sid === 'sintese' ? tr('Sumário executivo') : trN('Seção {0}', sid.slice(1)); }

// ----------------------------------------------------------- plano gerado (seções da v14, sem marcas de edição)
// Grupos: sintese, s1..s5 e anexos; cada um recebe os itens do plano que vêm depois do seu cabeçalho.
function gruposPlano() {
  const secs = secoesPlano().map(trSecao);
  const P = painelPlano(secs);
  const G = { cab: {}, itens: { sintese: [], s1: [], s2: [], s3: [], s4: [], s5: [], anexos: [] }, sin: null, anexos: [] };
  let cur = 'sintese', anexo = null;
  secs.forEach(s => {
    if (s.tipo === 'sintese') { G.sin = s; G.cab.sintese = s; cur = 'sintese'; return; }
    if (s.tipo === 'caixa') { G.comoler = s; return; }
    if (s.tipo === 'faltas' && s.curta) { G.faltas = s; return; }
    if (s.tipo === 'fatos') return;
    if (s.tipo === 'princ') { G.cab[s.id] = s; cur = s.id; anexo = null; return; }
    if (s.tipo === 'anexos') { G.cab.anexos = s; cur = 'anexos'; return; }
    if (s.tipo === 'anexo') { anexo = { s, itens: [] }; G.anexos.push(anexo); return; }
    if (anexo) anexo.itens.push(s); else (G.itens[cur] = G.itens[cur] || []).push(s);
  });
  return { G, P };
}
const itensHTML = (L, P) => L.map(s => htmlCorpoPlano([s], P).out).join('');
function sinteseHTML(s, P) {
  if (!s) return '';
  let h = '';
  if (P.principal || s.principal) h += `<div class="rp-princ dv-princ"><p class="rp-princ-e">${esc(tr('Recomendação principal'))}</p><p class="rp-princ-t">${esc(P.principal || s.principal)}</p></div>`;
  // ações (cartões da v14) e, recolhida, a proposta em seis respostas
  const s2 = Object.assign({}, s, { exec: [], d: null, semCusto: '', ice: null });
  const acoes = htmlSinteseP(s2).replace(/<p class="rp-vazio">\s*<\/p>/, '');
  h += acoes;
  if (s.exec && s.exec.length) h += `<details class="mais dv-exec"><summary>${esc(tr(TXT_REL.exT))}</summary><div class="mais-in">${htmlSinteseP(Object.assign({}, s, { d: null, recs: [], semCusto: '' })).split(`<h4 class="rp-sub">${esc(tr(TXT_REL.acoes5))}</h4>`)[0]}</div></details>`;
  return h;
}
function geradoHTML(sid, G, P) {
  let h = '';
  if (sid === 'sintese') return sinteseHTML(G.sin, P) + (G.faltas ? `<div class="rp-item dv-faltas" id="plano-faltas" data-sec="faltas">${htmlFaltasP(G.faltas)}</div>` : '');
  if (sid === 'comoler') return G.comoler ? `<h3 id="plano-comoler-t">${esc(G.comoler.h)}</h3><ul>${G.comoler.list.map(z => `<li>${esc(z)}</li>`).join('')}</ul>` : '';
  if (sid === 's2' && G.sin && G.sin.ice) h += `<div class="rp-item dv-ice">${htmlIcebergsP(G.sin.ice)}</div>`;
  if (sid === 's3' && G.sin && G.sin.d && G.sin.d.drivers) h += `<div class="rp-item"><h4>${esc(tr(TXT_REL.direcionadores))}</h4><ol class="rs-dir" data-k="direcionadores">${G.sin.d.drivers.map(x => `<li><b>${esc(x.nome)}</b> <span>${esc(x.faixa)}</span><span class="rs-d-b" style="width:${Math.max(2, 100 * x.w).toFixed(1)}%" aria-hidden="true"></span><span>${esc(x.txt)}</span></li>`).join('')}</ol></div>`;
  h += itensHTML(G.itens[sid] || [], P);
  if (sid === 'anexos') h += G.anexos.map(a => `<section class="rp-sec rp-anexo" id="plano-${a.s.id}" data-sec="${a.s.id}" data-toc="${a.s.id}" data-pai="anexos" aria-labelledby="plano-${a.s.id}-t"><header class="rp-cab"><span class="rp-num" aria-hidden="true">${esc(a.s.letra)}</span><div class="rp-cab-t"><p class="rp-rot">${esc(tr('Anexo {0}').replace('{0}', a.s.letra))}</p><h3 id="plano-${a.s.id}-t">${esc(a.s.h)}</h3></div></header>${itensHTML(a.itens, P)}</section>`).join('');
  return h;
}
function cabSecao(sid, G) {
  const s = G.cab[sid];
  const num = { s1: '1', s2: '2', s3: '3', s4: '4', s5: '5' }[sid] || '';
  if (!s) return cabP(num, tr(DOC_SEC_ROT[sid]), '', 'plano-' + sid);
  if (sid === 'sintese') return cabP('', s.h, '', 'plano-sintese');
  if (sid === 'anexos') return `<header class="rp-cab"><div class="rp-cab-t"><h3 id="plano-anexos-t">${esc(s.h)}</h3><p class="rp-abre">${esc((s.p || [])[0] || '')}</p></div></header>`;
  return cabP(s.num, s.h, s.intro || '', 'plano-' + s.id, s.rotulo);
}
function calcHTML() {
  return `<details class="calc dv-calc" id="dv-calc" data-calc ${S.calcAberta ? 'open' : ''}><summary>${esc(tr('Ajustar premissas, itens e cenários na calculadora completa'))}</summary>
    ${S.calcAberta && typeof renderCustos === 'function' ? `<div id="custos-box" class="embutido">${renderCustos()}</div>` : ''}</details>`;
}

// ----------------------------------------------------------- documento inteiro
function capaHTML() {
  let data = '';
  try { data = new Date().toLocaleDateString(LOC(), { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { data = ''; }
  const x = S.ctx || {}, H = (numerosDoc() || {}).H;
  const ex = ['A', 'B', 'C', 'D', 'editado'].includes(S.exemplo);
  const tituloEx = ['A', 'B', 'C', 'D'].includes(S.exemplo) && typeof CASOS !== 'undefined' && CASOS[S.exemplo] ? tr(CASOS[S.exemplo].titulo) : '';
  const st = estadoLac(CAMPO_POR_ID.titulo, '');
  const tit = st === 'vazio' ? `<span class="dv-tit-ph">${esc(nomeCaso())}</span>` : '';
  return `${ex ? `<div class="dv-ex" role="note"><span class="dv-ex-t">${esc(tr('Exemplo'))}</span><span>${tituloEx ? esc(tr('Caso ilustrativo do guia, com respostas fictícias:')) + ' <b>' + esc(tituloEx) + '</b>. ' : ''}${esc(tr('Edite qualquer trecho ou comece um caso em branco pelo menu Caso.'))}</span></div>` : ''}
    <header class="dv-capa">
      <p class="dv-eb">${esc(tr('Plano de contratação · documento de trabalho'))}</p>
      <h1 class="dv-h1" data-notr>${st === 'vazio' ? `${tit} ${lacHTML('titulo')}` : lacHTML('titulo')}</h1>
      <p class="dv-meta">${[x.local, H ? trN('Ano 0 a Ano {0}', H) : '', data ? trN('atualizado em {0}', data) : ''].filter(Boolean).map(esc).join(' · ')}</p>
    </header>`;
}
function legendaHTML() {
  return `<p class="dv-leg" data-notr><span class="dv-leg-i"><span class="lac lac-ok lac-amostra">${esc(tr('professores'))}</span> ${esc(tr('sua resposta'))}</span>
    <span class="dv-leg-i"><span class="lac lac-ilus lac-amostra">${IC_ILUS}<span class="lac-v">20</span></span> ${esc(tr('valor ilustrativo, ainda sem resposta'))}</span>
    <span>${esc(tr('Clique em qualquer trecho sublinhado para mudar.'))}</span></p>`;
}
function docHTML() {
  const { G, P } = gruposPlano();
  DOC.P = P; DOC.anexos = G.anexos;
  const sec = sid => {
    const cls = sid === 'sintese' ? 'rp-sintese' : sid === 'anexos' ? 'rp-anexos' : 'rp-princ-sec';
    const tag = sid === 'anexos' ? 'div' : 'section';
    return `<${tag} class="rp-sec ${cls} dv-sec" id="plano-${sid}" data-sec="${sid}" data-toc="${sid}" aria-labelledby="plano-${sid}-t">
      <div class="dv-cab" data-cab="${sid}">${cabSecao(sid, G)}</div>
      ${sid === 's1' ? legendaHTML() : ''}${edHTML(sid)}
      <div class="dv-ger" data-ger="${sid}">${geradoHTML(sid, G, P)}</div>${sid === 's2' ? calcHTML() : ''}</${tag}>`;
  };
  return `<section class="resumo plano rp dv" id="plano">
    <div class="dv-grade">
      <aside class="dv-ind" id="dv-ind" aria-label="${esc(tr('Índice e lacunas'))}" data-notr>${indiceHTML()}</aside>
      <article class="dv-doc" id="dv-doc">
        <div class="dv-mini" id="dv-mini" aria-hidden="true" data-notr></div>
        ${capaHTML()}
        <section class="dv-num" id="dv-num" aria-labelledby="dv-num-t" data-notr></section>
        ${sec('sintese')}
        <aside class="rp-comoler dv-comoler" id="plano-comoler" data-sec="comoler" aria-labelledby="plano-comoler-t"><div class="dv-ger" data-ger="comoler">${geradoHTML('comoler', G, P)}</div></aside>
        ${['s1', 's2', 's3', 's4', 's5', 'anexos'].map(sec).join('')}
        <p class="rp-isencao faixa-plano dv-isen">${esc(tr(FAIXA_PLANO))}</p>
        ${typeof avisoTradHTML === 'function' ? avisoTradHTML('rp-aviso-trad') : ''}
      </article>
    </div>
    <div class="dv-sr" aria-live="polite" id="dv-anuncio"></div>
  </section>`;
}

// Redesenho completo (chamado por render() de fluxo.js quando o documento está aberto)
function renderDocumento() {
  if (typeof fxCss === 'function') fxCss();
  cssPlanoV13(); if (typeof cssRelatorio === 'function') cssRelatorio();
  document.body.classList.remove('vista-plano');
  renderTopo();
  // com uma lacuna em edição, só o popover e os números mudam (o documento é refeito ao fechar)
  if (DOC.pop && document.getElementById('lac-pop')) { atualizarPop(); atualizarDoc(true); return; }
  const y = window.scrollY, foco = chaveFoco(document.activeElement);
  const main = $('#main');
  main.innerHTML = docHTML();
  const p = $('#painel'); if (p) p.innerHTML = '';
  atualizarNumeros();
  if (S.calcAberta && document.getElementById('cres') && typeof renderCustosResultados === 'function') renderCustosResultados();
  montarDoc();
  restaurarFoco(foco);
  window.scrollTo(0, y);
}
// Atualização leve: barra, índice, números e lacunas, sem refazer o plano gerado (que é refeito em seguida, sem pressa)
function atualizarDoc(semGerado) {
  renderTopo();
  const ind = document.getElementById('dv-ind');
  if (ind) { const h = indiceHTML(); if (ind.dataset.h !== h) { const f = chaveFoco(document.activeElement); ind.innerHTML = h; ind.dataset.h = h; if (f && ind.contains(document.activeElement) === false && f.dentro === 'dv-ind') restaurarFoco(f); } }
  document.querySelectorAll('#dv-doc [data-lac]').forEach(b => {
    if (b.closest('.dv-leg')) return;
    const min = b.dataset.min ? '~' : '';
    const t = document.createElement('div'); t.innerHTML = lacHTML(b.dataset.lac + min, b.classList.contains('lac-bloco'));
    const n = t.firstElementChild; if (n && n.outerHTML !== b.outerHTML) { n.dataset.min = b.dataset.min; b.replaceWith(n); }
  });
  document.querySelectorAll('#dv-doc .dv-bloco[data-bloco]').forEach(bl => {
    const id = bl.dataset.bloco, fs = id === 'gov' ? GOV_IDS().map(k => CAMPO_POR_ID[k]) : [CAMPO_POR_ID[id]];
    const vis = fs.filter(f => f && visivel(f)), nOk = vis.filter(f => qOk(f)).length, st = bl.querySelector('.dv-bl-cab .dv-st');
    if (st) { const ok = nOk === vis.length; st.className = 'dv-st dv-st-' + (ok ? 'ok' : 'pend'); st.innerHTML = ok ? IC_OK + esc(tr('Completo')) : IC_PEND + esc(trN(vis.length > 1 ? '{0} de {1} respondidas' : 'A responder', nOk, vis.length)); }
    vis.forEach(f => { const q = document.getElementById(idQ(f.n)); if (q) { q.classList.toggle('ok', qOk(f)); q.classList.toggle('sug', sugerido(f) && !vazio(valorCampo(f))); } });
  });
  atualizarNumeros();
  if (!semGerado) agendarGerado();
}
function agendarGerado() {
  clearTimeout(DOC.tGer);
  DOC.tGer = setTimeout(refazerGerado, 700);
}
// Refaz só as partes geradas do plano (cabeçalhos e itens), mantendo formulários, foco e rolagem
function refazerGerado() {
  if (S.boasVindas !== false || DOC.pop || !document.getElementById('dv-doc')) return;
  let r; try { r = gruposPlano(); } catch (e) { console.warn(e); return; }
  const { G, P } = r; DOC.P = P; DOC.anexos = G.anexos;
  document.querySelectorAll('#dv-doc [data-ger]').forEach(el => { const h = geradoHTML(el.dataset.ger, G, P); if (el.dataset.h !== h) { el.innerHTML = h; el.dataset.h = h; } });
  document.querySelectorAll('#dv-doc [data-cab]').forEach(el => { const h = cabSecao(el.dataset.cab, G); if (el.innerHTML !== h) el.innerHTML = h; });
  if (typeof aplicarIdioma === 'function' && typeof traduzirArvore === 'function') { try { traduzirArvore(document.getElementById('dv-doc')); } catch (e) { } }
}
function chaveFoco(el) {
  if (!el || el === document.body || !el.closest) return null;
  const dentro = el.closest('#dv-ind') ? 'dv-ind' : el.closest('#lac-pop') ? 'lac-pop' : '';
  if (el.id) return { id: el.id, dentro };
  const ks = ['lac', 'f', 'fm', 'ctx', 'resp', 'irLac', 'act', 'prior', 'prob', 'etapa'];
  for (const k of ks) if (el.dataset && el.dataset[k] != null) return { k, v: el.dataset[k], val: el.value || el.dataset.v || '', dentro };
  return null;
}
function restaurarFoco(c) {
  if (!c) return;
  let el = c.id ? document.getElementById(c.id) : null;
  if (!el && c.k) {
    const at = c.k.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
    el = [...document.querySelectorAll(`[data-${at}]`)].find(x => x.dataset[c.k] === c.v && (!c.val || (x.value || x.dataset.v || '') === c.val));
  }
  if (el) try { el.focus({ preventScroll: true }); } catch (e) { }
}

// Depois do redesenho: seção atual no índice, faixa de números compacta e posição das barras fixas
function montarDoc() {
  const top = document.querySelector('.top');
  document.documentElement.style.setProperty('--dv-hdr', (top ? top.offsetHeight : 56) + 'px');
  const alvos = [...document.querySelectorAll('#dv-doc [data-toc]')];
  if (DOC.io) try { DOC.io.disconnect(); } catch (e) { }
  if (DOC.ioNum) try { DOC.ioNum.disconnect(); } catch (e) { }
  if (!('IntersectionObserver' in window)) return;
  const marcar = id => document.querySelectorAll('#dv-ind [data-toc-l]').forEach(l => { if (l.dataset.tocL === id) l.setAttribute('aria-current', 'location'); else l.removeAttribute('aria-current'); });
  DOC.io = new IntersectionObserver(es => {
    const vis = alvos.filter(a => { const r = a.getBoundingClientRect(); return r.top < window.innerHeight * 0.4 && r.bottom > 80; });
    const at = vis.length ? vis[vis.length - 1] : null;
    if (at) { DOC.secAtual = at.dataset.toc; marcar(at.dataset.toc); }
  }, { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.01, 1] });
  alvos.forEach(a => DOC.io.observe(a));
  if (DOC.secAtual) marcar(DOC.secAtual);
  const num = document.getElementById('dv-num'), mini = document.getElementById('dv-mini');
  if (num && mini) {
    DOC.ioNum = new IntersectionObserver(es => es.forEach(e => { const v = !e.isIntersecting && e.boundingClientRect.top < 0; mini.classList.toggle('on', v); mini.setAttribute('aria-hidden', String(!v)); }), { rootMargin: `-${(top ? top.offsetHeight : 56)}px 0px 0px 0px` });
    DOC.ioNum.observe(num);
  }
}

// ----------------------------------------------------------- popover da lacuna
function fotoEstado() { return JSON.stringify({ caso: S.caso, ctx: S.ctx, resp: S.resp, respC: S.respC, respDet: S.respDet || {}, revisar: S.revisar || [], exemplo: S.exemplo, editado: S.custo.editado }); }
function voltarFoto(t) {
  const o = JSON.parse(t);
  S.caso = o.caso; S.ctx = o.ctx; S.resp = o.resp; S.respC = o.respC; S.respDet = o.respDet; S.revisar = o.revisar; S.exemplo = o.exemplo; S.custo.editado = o.editado;
  if (!o.editado) S.custo.cfg = null;
}
function custoAgora() { const d = numerosDoc(); return d ? { total: d.total, ano0: d.ano0 } : { total: 0, ano0: 0 }; }
function popCorpo() {
  const { f, sub, key } = DOC.pop;
  const m = modoTeste();
  const t = sub ? tr(SUB_T[key] || LAC_ROT[key]) : tr(textoCampo(f));
  const ajuda = sub ? (f.dica ? glossarioTexto(f.dica) : esc(tr(f.h || ''))) : f.dica ? glossarioTexto(f.dica) : f.h ? esc(tr((m === 'poc' && f.hPoc) || f.h)) : '';
  let ctl;
  if (sub) {
    const v = (S.caso[f.id] || {})[sub];
    ctl = `<div class="lp-num">${nCampo({ id: 'lp-in', attrs: `data-fn="${f.id}.${sub}" aria-describedby="lp-ef"`, valor: v, casas: 0, rotulo: t, ph: ' ' })}<span class="lp-un">${esc(tr(SUB_UN[sub] || ''))}</span></div>`;
  } else {
    ctl = controle(f) + (f.detalhe ? detalheCampo(f) : '') + (sugerido(f) ? notaSugerido(f) : '');
    if (f.id === 'elegiveis') { const tt = totaisCtx(); if ((S.caso.usuarios || []).includes('estudantes') && tt.alunos > 0 && +S.caso.elegiveis !== tt.alunos) ctl += `<div class="hint"><button type="button" class="link" data-act="usar-alunos">${esc(tr('Usar o total de estudantes do contexto (' + fmtInt(tt.alunos) + ')'))}</button></div>`; }
    if (f.sugDe === 'problemas' && ['texto', 'area'].includes(f.tipo) && temLac(valorCampo(f))) ctl += `<div class="hint lacuna-dica">${esc(tr('Complete as lacunas marcadas com __ com os dados da sua rede.'))}</div>`;
  }
  const rotTag = sub || ['texto', 'area', 'num', 'horas'].includes(f.tipo) ? `label for="${sub ? 'lp-in' : 'f-' + f.id}"` : 'span';
  const fila = DOC.fila ? `<span class="lp-fila">${esc(trN('Lacuna {0} de {1}', posFila(), pendentes().length))}</span>` : '';
  return `<div class="lp-cab" data-notr><div class="lp-cab-t"><p class="lp-n">${esc(trN('Pergunta {0}', f.n))} · ${esc(secRot(secDe(f.id)))}${f.opcional ? ' · ' + esc(tr('opcional')) : ''}</p>
      <h3 class="lp-t" id="lp-t"><${rotTag} id="qt-${esc(f.id)}">${esc(t)}</${rotTag.split(' ')[0]}></h3></div>
      <button type="button" class="lp-x" data-lp="fechar" aria-label="${esc(tr('Fechar sem mudar'))}">×</button></div>
    ${ajuda ? `<p class="lp-h">${ajuda}</p>` : ''}
    <div class="lp-ctl q${sub ? '' : ' lp-' + f.tipo}" id="${idQ(f.n)}" data-campo="${esc(f.id)}">${ctl}</div>
    <div class="lp-ef" id="lp-ef" data-notr aria-live="polite">${efeitoHTML()}</div>
    <p class="lp-erro" id="lp-erro" role="alert" hidden></p>
    <div class="lp-pe" data-notr><button type="button" class="btn pri" data-lp="ok">${esc(tr('Confirmar'))}</button><button type="button" class="btn" data-lp="ilus">${esc(tr('Usar valor ilustrativo'))}</button>${DOC.fila ? `<button type="button" class="link" data-lp="pular">${esc(tr('Pular'))}</button>` : ''}<span class="lp-k">${fila}<span>${esc(tr('Enter confirma · Esc fecha'))}</span></span></div>
    ${ajudaPop(f)}`;
}
// "Por que perguntamos isso?": a ajuda do passo da v14 (para que serve, por que importa, como responder, quem sabe,
// exemplo), recolhida por padrão (auditoria C1); fica aberta para quem a abriu antes (mesmo registro da v14)
function ajudaPop(f) {
  const id = passoDe(f), a = PASSO_AJUDA[id]; if (!a) return '';
  const E = ajudaLer(), aberto = E[id] === true && !AJUDA_AUTO[id];
  const R = AJUDA_ROT, g = typeof glossarioTexto === 'function' ? glossarioTexto : (x => esc(tr(x)));
  const parte = (t, c, extra) => `<div class="aj-p"><dt>${esc(tr(t))}</dt><dd>${c}${extra || ''}</dd></div>`;
  return `<details class="ajuda lp-aj" id="ajuda-${id}" data-ajuda="${id}" ${aberto ? 'open' : ''}><summary>${esc(tr('Por que perguntamos isso?'))}</summary>
    <dl class="aj-corpo">${parte(R.serve, g(a.serve))}${parte(R.importa, g(a.importa))}${parte(R.como, g(a.como), ` <span class="aj-quem"><b>${esc(tr(R.quem))}</b> ${esc(tr(a.quem))}.</span>`)}${parte(R.ex, g(a.ex))}</dl></details>`;
}
function efeitoHTML() {
  if (!DOC.pop) return '';
  const a = DOC.pop.antes, n = custoAgora(), dT = n.total - a.total, dA = n.ano0 - a.ano0;
  const sem = Math.abs(dT) < 0.5 && Math.abs(dA) < 0.5;
  return `<span class="lp-ef-l">${esc(tr('Efeito no custo'))}</span>${sem ? `<span class="lp-ef-0">${esc(tr(DOC.pop.mudou ? 'Esta resposta não muda o custo estimado.' : 'Mude a resposta para ver o efeito no custo.'))}</span>`
    : `<span class="lp-ef-v"><b class="num">${esc(trN('TCO {0}', sinalDin(dT)))}</b> <span class="num">(${esc(trN('{0} → {1}', grande(a.total), grande(n.total)))})</span></span><span class="lp-ef-v num">${esc(trN('Ano 0 {0}', sinalDin(dA)))}</span>`}`;
}
function atualizarPop() {
  const el = document.getElementById('lac-pop'); if (!el || !DOC.pop) return;
  DOC.pop.mudou = fotoEstado() !== DOC.pop.snap;
  const foco = chaveFoco(document.activeElement);
  const h = popCorpo();
  if (el.dataset.h !== h) { el.innerHTML = h; el.dataset.h = h; restaurarFoco(foco); }
  posicionarPop();
}
function atualizarEfeito() { const e = document.getElementById('lp-ef'); if (e && DOC.pop) { DOC.pop.mudou = fotoEstado() !== DOC.pop.snap; e.innerHTML = efeitoHTML(); } }
function botaoLac(key) {
  const L = [...document.querySelectorAll(`#dv-doc [data-lac="${CSS.escape(key)}"]`)].filter(b => !b.closest('.dv-leg'));
  if (DOC.pop && DOC.pop.btn && L.includes(DOC.pop.btn)) return DOC.pop.btn;
  return L.find(b => !b.closest('#plano-sintese')) || L[0] || null;
}
function abrirLacuna(key, opts = {}) {
  const p = partesLac(key); if (!p.f) return;
  if (DOC.pop) fecharPop('manter');
  if (ehBloco(p.f)) { irBloco(p.f); return; }
  const btn = opts.btn || botaoLac(p.k);
  if (!btn) return;
  DOC.alvo = '';
  DOC.pop = { key: p.k, f: p.f, sub: p.sub, snap: fotoEstado(), antes: custoAgora(), mudou: false, idx: [...document.querySelectorAll('#dv-doc [data-lac]')].indexOf(btn) };
  btn.classList.add('lac-ed'); btn.setAttribute('aria-expanded', 'true');
  let el = document.getElementById('lac-pop');
  if (!el) { el = document.createElement('div'); el.id = 'lac-pop'; el.className = 'lp'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-labelledby', 'lp-t'); document.getElementById('dv-doc').appendChild(el); }
  btn.setAttribute('aria-controls', 'lac-pop');
  el.dataset.h = '';
  atualizarPop();
  renderTopo();
  const r = btn.getBoundingClientRect();
  if (!opts.semRolar && (r.top < 120 || r.bottom > window.innerHeight * 0.55)) window.scrollTo({ top: window.scrollY + r.top - Math.min(200, window.innerHeight * 0.25), behavior: 'instant' });
  posicionarPop();
  // o popover inteiro (até Confirmar) cabe na tela: rola o documento sem esconder a lacuna sob as barras
  if (!opts.semRolar && !el.classList.contains('lp-folha')) {
    const pr = el.getBoundingClientRect(), rb = btn.getBoundingClientRect();
    const topo = (document.querySelector('.top') || { offsetHeight: 56 }).offsetHeight + 64;
    const falta = pr.bottom - window.innerHeight + 16;
    if (falta > 0) window.scrollBy({ top: Math.min(falta, Math.max(0, rb.top - topo)), behavior: 'instant' });
  }
  requestAnimationFrame(() => {
    const alvo = el.querySelector('.lp-ctl input:checked, .lp-ctl input:not([type=hidden]), .lp-ctl textarea, .lp-ctl select, .lp-ctl button');
    if (alvo) alvo.focus({ preventScroll: true });
  });
}
function posicionarPop() {
  const el = document.getElementById('lac-pop'), d = document.getElementById('dv-doc'); if (!el || !DOC.pop || !d) return;
  const todos = [...document.querySelectorAll('#dv-doc [data-lac]')];
  const btn = todos[DOC.pop.idx] && todos[DOC.pop.idx].dataset.lac === DOC.pop.key ? todos[DOC.pop.idx] : botaoLac(DOC.pop.key);
  const cel = window.matchMedia('(max-width: 720px)').matches;
  el.classList.toggle('lp-folha', cel);
  if (cel || !btn) { el.style.top = ''; el.style.left = ''; el.style.right = ''; return; }
  const rd = d.getBoundingClientRect(), rb = btn.getBoundingClientRect();
  const w = Math.min(520, rd.width - 32);
  el.style.width = w + 'px';
  const rtl = document.documentElement.dir === 'rtl';
  let x = rtl ? rb.right - rd.left - w : rb.left - rd.left;
  x = Math.max(16, Math.min(x, rd.width - w - 16));
  el.style.left = x + 'px'; el.style.right = 'auto';
  el.style.top = (rb.bottom - rd.top + 8) + 'px';
}
// Fecha a lacuna sem redesenhar (troca de caso ou de idioma redesenham em seguida); manter=true guarda o que mudou
function descartarPop(manter) {
  if (!DOC.pop) return;
  if (!manter) { /* o caso vai ser substituído: nada a desfazer */ }
  DOC.pop = null; DOC.fila = false; DOC.alvo = '';
  const el = document.getElementById('lac-pop'); if (el) el.remove();
}
// modo: 'cancelar' (Esc, ×: desfaz), 'manter' (clique fora: guarda o que mudou), 'ok' (Confirmar), 'ilus' (valor ilustrativo)
function fecharPop(modo, proxima) {
  if (!DOC.pop) return;
  const { key, f, sub, snap, antes, idx } = DOC.pop;
  if (modo === 'cancelar') voltarFoto(snap);
  if (modo === 'ilus') { voltarFoto(snap); limparCampo(f, sub); }
  if (modo === 'ok') {
    if (sub) { S.respC[f.id + '.' + sub] = true; if (subcampos(f).every(([o, k]) => S.respC[o + '.' + k])) S.respC[f.id] = true; }
    else if (f.onde === 'caso') confirmarSugestao(f);
    else if (f.onde === 'ctx' && CAMPOS_PROB.includes(f.id)) S.respC[f.id] = true;
    S.revisar = (S.revisar || []).filter(k => !S.respC[k]);
    if (CAMPOS_CUSTO.includes(f.id)) S.custo.editado = false;
    if (S.exemplo !== 'novo' && fotoEstado() !== snap) S.exemplo = 'editado';
    const ok = sub ? okSub(f.id, sub) : (f.opcional && vazio(valorCampo(f))) || qOk(f);
    if (!ok) { voltarFoto(JSON.stringify(Object.assign(JSON.parse(fotoEstado()), { respC: JSON.parse(snap).respC }))); mostrarErro(f, sub); return; }
  }
  const depois = custoAgora(), dT = depois.total - antes.total, dA = depois.ano0 - antes.ano0;
  if (modo !== 'cancelar' && (Math.abs(dT) >= 0.5 || Math.abs(dA) >= 0.5)) {
    DOC.ult = { rot: capP(tr(LAC_ROT[key] || LAC_ROT[f.id])), dT, dA };
    const an = document.getElementById('dv-anuncio'); if (an) an.textContent = trN('Custo atualizado: TCO {0}', grande(depois.total));
  }
  DOC.pop = null;
  const el = document.getElementById('lac-pop'); if (el) el.remove();
  aplicarPadroes();
  render();
  if (proxima && DOC.fila) { proximaLacuna(f.id); return; }
  if (!proxima) DOC.fila = DOC.fila && modo !== 'cancelar';
  requestAnimationFrame(() => { const T = [...document.querySelectorAll('#dv-doc [data-lac]')]; const b = T[idx] && T[idx].dataset.lac === key ? T[idx] : botaoLac(key); if (b) b.focus({ preventScroll: true }); });
}
function mostrarErro(f, sub) {
  const e = document.getElementById('lp-erro'); if (!e) return;
  const tipo = sub || ['num', 'horas'].includes(f.tipo) ? 'Informe um número maior que zero ou use o valor ilustrativo.'
    : ['texto', 'area'].includes(f.tipo) ? (temLac(valorCampo(f)) ? 'Complete as lacunas marcadas com __ ou use o valor ilustrativo.' : 'Escreva a resposta ou use o valor ilustrativo.')
      : 'Escolha uma opção ou use o valor ilustrativo.';
  e.textContent = tr(tipo); e.hidden = false;
  const i = document.querySelector('#lac-pop .lp-ctl input, #lac-pop .lp-ctl textarea'); if (i) i.focus();
}
// "Usar valor ilustrativo": a resposta sai e volta o valor padrão (ou sugerido) da ferramenta
function limparCampo(f, sub) {
  const c = S.caso;
  if (sub) { delete S.respC[f.id + '.' + sub]; delete S.respC[f.id]; if (c[f.id]) c[f.id][sub] = ''; }
  else if (f.onde === 'resp') { delete S.resp[f.id]; if (S.respDet) delete S.respDet[f.id]; }
  else if (f.onde === 'ctx') { const v = S.ctx[f.id]; S.ctx[f.id] = Array.isArray(v) ? [] : ''; delete S.respC[f.id]; }
  else {
    if (f.tipo === 'horas') { c.formacaoHoras = horasEstimativa(); c.formacaoEstimativa = true; }
    else if (f.tipo === 'testes') c.testes = [];
    else c[f.id] = clone(CASO_VAZIO[f.id] != null ? CASO_VAZIO[f.id] : '');
    delete S.respC[f.id]; subcampos(f).forEach(([o, k]) => { delete S.respC[o + '.' + k]; if (c[o]) c[o][k] = ''; });
    if (f.id === 'tarefas') aplicarSugestoes();
  }
  if (S.exemplo !== 'novo') S.exemplo = 'editado';
  if (S.custo) S.custo.editado = false;
}

// ----------------------------------------------------------- preencher em ordem e blocos
function proximaLacuna(depoisDe) {
  const P = pendentes();
  if (!P.length) { DOC.fila = false; DOC.alvo = ''; render(); toast(tr('Todas as lacunas foram preenchidas. Revise o texto e baixe o PDF.')); return; }
  const L = ordemDoc().L, i0 = depoisDe ? L.indexOf(depoisDe) : -1;
  const f = P.find(x => L.indexOf(x.id) > i0) || P[0];
  abrirCampo(f);
}
function abrirCampo(f) {
  if (!f) return;
  if (ehBloco(f)) { irBloco(f); return; }
  abrirLacuna(chaveDe(f));
}
function irBloco(f) {
  if (DOC.pop) fecharPop('manter');
  const id = QUESTOES_G.some(q => q.id === f.id) ? f.id : f.id;
  DOC.alvo = id; render();
  const q = document.getElementById(idQ(f.n)) || document.getElementById('bl-' + f.id);
  if (!q) return;
  const top = q.getBoundingClientRect().top + window.scrollY - (document.querySelector('.top') || { offsetHeight: 0 }).offsetHeight - 72;
  window.scrollTo({ top, behavior: 'instant' });
  q.classList.add('pisca'); setTimeout(() => q.classList.remove('pisca'), 1600);
  const i = q.querySelector('input:not([type=hidden]), select, textarea, button:not(.info)'); if (i) i.focus({ preventScroll: true });
}
// Destino dos links "Responder" e "Ir à pergunta" do plano (fase:passo:número) e do início
function irDocumento(fid, passo, alvo) {
  if (DOC.pop) fecharPop('manter');
  S.boasVindas = false; S.vista = '';
  if (fid && passo) { S.fase = fid; S.passo = passo; }
  const f = alvo ? (CAMPO_POR_ID[alvo] || CAMPOS.find(x => x.n.replace(/\./g, '-') === alvo || x.n === alvo)) : null;
  render();
  if (f && visivel(f)) { abrirCampo(f); return; }
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// ----------------------------------------------------------- menu Caso e confirmação antes de substituir
function menuCasoHTML() {
  const ex = ['A', 'B', 'C', 'D'].map(k => `<button type="button" role="menuitem" data-act="dv-ex" data-k="${k}">${esc(tr(CASOS[k].titulo))}</button>`).join('');
  return `<button type="button" role="menuitem" data-act="dv-novo">${esc(tr('Novo caso em branco'))}</button>
    <p class="mc-g" role="presentation">${esc(tr('Abrir um exemplo'))}</p>${ex}
    <hr role="separator">
    <button type="button" role="menuitem" data-act="dv-importar">${esc(tr('Importar caso (.json)'))}</button>
    <button type="button" role="menuitem" data-act="copiar">${esc(tr('Copiar o texto do plano'))}</button>
    <button type="button" role="menuitem" data-act="exp-json">${esc(tr(CAP.downloads ? 'Exportar caso (.json)' : 'Copiar dados do caso'))}</button>
    ${S.boasVindas === false ? `<button type="button" role="menuitem" data-act="dv-inicio">${esc(tr('Voltar à página inicial'))}</button>` : ''}`;
}
function abrirMenuCaso(abre) {
  const m = document.getElementById('menu-caso'), b = document.getElementById('btn-caso'); if (!m || !b) return;
  DOC.menu = abre; m.hidden = !abre; b.setAttribute('aria-expanded', String(abre));
  if (abre) { m.innerHTML = menuCasoHTML(); traduzirArvoreSe(m); const i = m.querySelector('[role=menuitem]'); if (i) i.focus(); }
}
function traduzirArvoreSe(el) { if (typeof traduzirArvore === 'function') try { traduzirArvore(el); } catch (e) { } }
function precisaConfirmar() { return temRespostas(S) && !(['A', 'B', 'C', 'D'].includes(S.exemplo)); }
// Diálogo nomeado: "Substituir X por Y?" com Exportar antes / Substituir / Cancelar, e Desfazer no aviso
function confirmarTroca(novo, fazer) {
  if (!precisaConfirmar()) { fazer(); return; }
  let dlg = document.getElementById('dlg-troca');
  if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'dlg-troca'; dlg.className = 'dlg-imp dlg-troca'; dlg.setAttribute('aria-labelledby', 'dlg-troca-t'); document.body.appendChild(dlg); }
  const atual = nomeCaso();
  dlg.innerHTML = `<div class="dlg-in"><h2 id="dlg-troca-t">${esc(trN('Substituir “{0}”?', atual))}</h2>
    <p>${esc(trN('Você vai abrir: {0}. As respostas atuais serão apagadas deste navegador. Para guardá-las, exporte o caso antes.', novo))}</p>
    <div class="row dlg-pe"><button type="button" class="btn" data-troca="exp">${esc(tr(CAP.downloads ? 'Exportar antes' : 'Copiar os dados antes'))}</button><button type="button" class="btn pri" data-troca="ok">${esc(tr('Substituir'))}</button><button type="button" class="btn" data-troca="nao">${esc(tr('Cancelar'))}</button></div></div>`;
  dlg.onclick = e => {
    const b = e.target.closest('[data-troca]'); if (!b) return;
    if (b.dataset.troca === 'exp') { const t = JSON.stringify(dadosCaso(), null, 1); if (CAP.downloads) baixar(nomeArqCaso(), t); else copiarTexto(JSON.stringify(dadosCaso()), 'Dados do caso copiados.'); return; }
    try { dlg.close(); } catch (er) { dlg.removeAttribute('open'); }
    if (b.dataset.troca === 'ok') {
      const antes = JSON.stringify(dadosCaso());
      fazer();
      toastDesfazer(tr('Caso substituído. As respostas anteriores foram apagadas.'), () => importarCaso(antes));
    }
  };
  try { dlg.showModal(); } catch (e) { dlg.setAttribute('open', ''); }
  const ok = dlg.querySelector('[data-troca="nao"]'); if (ok) ok.focus();
}
function toastDesfazer(msg, fn) {
  const t = $('#toast'); if (!t) return;
  t.innerHTML = `<span>${esc(msg)}</span> <button type="button" class="link" id="toast-desf">${esc(tr('Desfazer'))}</button>`; t.hidden = false;
  t.querySelector('#toast-desf').onclick = () => { t.hidden = true; fn(); };
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 10000);
}
function abrirExemploDoc(k) {
  confirmarTroca(k === 'novo' ? tr('um caso em branco') : tr(CASOS[k].titulo), () => {
    S.boasVindas = false; DOC.fila = false; DOC.alvo = ''; DOC.ult = null; DOC.faixa = null;
    carregarExemplo(k); S.boasVindas = false; irDocumento();
  });
}

// ----------------------------------------------------------- eventos (fase de captura: antes de app.js e fluxo.js)
function ligarDocumento() {
  document.addEventListener('click', e => {
    const el = e.target;
    // menu Caso
    const bc = el.closest('#btn-caso');
    if (bc) { abrirMenuCaso(!DOC.menu); e.stopPropagation(); return; }
    if (DOC.menu && !el.closest('#menu-caso')) abrirMenuCaso(false);
    const a = el.closest('[data-act]'), act = a && a.dataset.act;
    if (act === 'dv-novo') { e.stopPropagation(); abrirMenuCaso(false); abrirExemploDoc('novo'); return; }
    if (act === 'dv-ex') { e.stopPropagation(); abrirMenuCaso(false); abrirExemploDoc(a.dataset.k); return; }
    if (act === 'dv-importar') { e.stopPropagation(); abrirMenuCaso(false); abrirImportar(); return; }
    if (act === 'dv-inicio') { e.stopPropagation(); abrirMenuCaso(false); if (DOC.pop) fecharPop('manter'); S.boasVindas = true; SALVO = temRespostas(S) ? { nome: S.caso.titulo || (S.ctx && S.ctx.olhando) || '', exemplo: '', lugar: (S.ctx && S.ctx.local) || '', migrou: false } : null; render(); window.scrollTo(0, 0); return; }
    if ((act === 'exp-json' || act === 'copiar') && el.closest('#menu-caso')) abrirMenuCaso(false);
    // página inicial: começar em branco ou abrir o exemplo substitui o caso salvo; pede confirmação
    if ((act === 'comecar' || act === 'ver-exemplo') && S.boasVindas !== false && precisaConfirmar()) {
      e.stopPropagation();
      abrirExemploDoc(act === 'comecar' ? 'novo' : 'B');
      return;
    }
    if (act === 'limpar' && S.boasVindas === false) { e.stopPropagation(); abrirExemploDoc('novo'); return; }
    if (S.boasVindas !== false) return;
    // gaveta do índice (celular)
    if (el.closest('#btn-gaveta')) { DOC.gaveta = !DOC.gaveta; document.body.classList.toggle('dv-gaveta', DOC.gaveta); renderTopo(); if (DOC.gaveta) { const i = document.querySelector('#dv-ind a, #dv-ind button'); if (i) i.focus(); } e.stopPropagation(); return; }
    if (DOC.gaveta && (el.closest('#dv-ind a') || el.closest('[data-ir-lac]') || el.closest('[data-act="dv-fila"]') || (!el.closest('#dv-ind') && !el.closest('#lac-pop')))) { DOC.gaveta = false; document.body.classList.remove('dv-gaveta'); renderTopo(); }
    // popover
    const lp = el.closest('[data-lp]');
    if (lp && DOC.pop) {
      e.stopPropagation();
      const k = lp.dataset.lp;
      if (k === 'fechar') fecharPop('cancelar');
      else if (k === 'ok') fecharPop('ok', DOC.fila);
      else if (k === 'ilus') fecharPop('ilus', DOC.fila);
      else if (k === 'pular') { const id = DOC.pop.f.id; fecharPop('cancelar', true); if (DOC.fila && !DOC.pop) proximaLacuna(id); }
      return;
    }
    const lac = el.closest('[data-lac]');
    if (lac && !lac.closest('.dv-leg')) { e.stopPropagation(); e.preventDefault(); if (DOC.pop && DOC.pop.key === lac.dataset.lac) return; abrirLacuna(lac.dataset.lac, { btn: lac }); return; }
    const ir = el.closest('[data-ir-lac]');
    if (ir) { e.stopPropagation(); const f = CAMPO_POR_ID[ir.dataset.irLac]; if (DOC.pop) fecharPop('manter'); abrirCampo(f); return; }
    if (act === 'dv-fila') { e.stopPropagation(); DOC.fila = true; if (DOC.pop) { fecharPop('manter'); } proximaLacuna(); return; }
    if (act === 'dv-prox') { e.stopPropagation(); const id = DOC.alvo; DOC.alvo = ''; proximaLacuna(id); return; }
    if (act === 'dv-fila-fim') { e.stopPropagation(); DOC.fila = false; DOC.alvo = ''; render(); return; }
    if (act === 'dv-todas') { e.stopPropagation(); DOC.todas = !DOC.todas; atualizarDoc(true); return; }
    if (act === 'dv-premissas') { e.stopPropagation(); S.calcAberta = true; render(); const d = document.getElementById('dv-calc'); if (d) { d.open = true; d.scrollIntoView({ block: 'start' }); const s = d.querySelector('summary'); if (s) s.focus({ preventScroll: true }); } return; }
    const tl = el.closest('#dv-ind a[href^="#plano-"]');
    if (tl) { e.preventDefault(); const t = document.querySelector(tl.getAttribute('href')); if (t) { const y = t.getBoundingClientRect().top + window.scrollY - (document.querySelector('.top') || { offsetHeight: 0 }).offsetHeight - 12; window.scrollTo({ top: y, behavior: 'instant' }); const h = t.querySelector('h3'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } } return; }
  }, true);
  // clique fora do popover: guarda o que mudou e fecha
  document.addEventListener('mousedown', e => {
    if (!DOC.pop) return;
    const el = e.target;
    if (el.closest('#lac-pop') || el.closest('[data-lac]') || el.closest('#gl-pop, dialog, #toast')) return;
    fecharPop(DOC.pop.mudou || fotoEstado() !== DOC.pop.snap ? 'manter' : 'cancelar');
  }, true);
  document.addEventListener('keydown', e => {
    // lacunas são <span role="button">: Enter e espaço abrem
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-lac][role=button]') && !e.target.closest('.dv-leg')) {
      e.preventDefault(); e.stopPropagation(); if (!(DOC.pop && DOC.pop.key === e.target.dataset.lac)) abrirLacuna(e.target.dataset.lac, { btn: e.target }); return;
    }
    if (e.key === 'Escape' && DOC.menu) { abrirMenuCaso(false); const b = document.getElementById('btn-caso'); if (b) b.focus(); e.preventDefault(); return; }
    if (DOC.menu && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      const its = [...document.querySelectorAll('#menu-caso [role=menuitem]')], i = its.indexOf(document.activeElement);
      const n = its[(i + (e.key === 'ArrowDown' ? 1 : -1) + its.length) % its.length]; if (n) n.focus(); e.preventDefault(); return;
    }
    if (e.key === 'Escape' && DOC.gaveta) { DOC.gaveta = false; document.body.classList.remove('dv-gaveta'); renderTopo(); const g = document.getElementById('btn-gaveta'); if (g) g.focus(); return; }
    if (!DOC.pop) { if (e.key === 'Escape' && DOC.fila) { DOC.fila = false; DOC.alvo = ''; render(); } return; }
    const dentro = e.target.closest && e.target.closest('#lac-pop');
    if (e.key === 'Escape' && document.getElementById('gl-pop')) return;   // a definição do glossário fecha primeiro
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); DOC.fila = false; fecharPop('cancelar'); return; }
    if (e.key === 'Enter' && dentro && !e.shiftKey && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SELECT') {
      e.preventDefault(); e.stopPropagation();
      // o valor digitado é gravado antes de confirmar (o 'change' do campo ainda não disparou)
      if (e.target.tagName === 'INPUT' && (e.target.type === 'text' || e.target.type === 'number')) e.target.dispatchEvent(new Event('change', { bubbles: true }));
      if (DOC.pop) fecharPop('ok', DOC.fila);
      return;
    }
    // Tab fica dentro do popover
    if (e.key === 'Tab' && dentro) {
      const fs = [...document.querySelectorAll('#lac-pop button, #lac-pop input, #lac-pop select, #lac-pop textarea, #lac-pop [tabindex="0"]')].filter(x => !x.disabled && x.offsetParent);
      if (!fs.length) return;
      const i = fs.indexOf(document.activeElement);
      if (e.shiftKey && i === 0) { e.preventDefault(); fs[fs.length - 1].focus(); }
      else if (!e.shiftKey && i === fs.length - 1) { e.preventDefault(); fs[0].focus(); }
    }
  }, true);
  // calculadora completa: só existe na página quando está aberta (abrir e fechar redesenham o documento)
  document.addEventListener('toggle', e => {
    const d = e.target; if (!d || d.id !== 'dv-calc') return;
    if (d.open !== !!document.getElementById('custos-box')) { S.calcAberta = d.open; setTimeout(render, 0); }
  }, true);
  // números digitados no popover: o efeito no custo acompanha a digitação
  document.addEventListener('input', () => { if (DOC.pop) requestAnimationFrame(atualizarEfeito); });
  document.addEventListener('change', () => { if (DOC.pop) requestAnimationFrame(atualizarEfeito); });
  let t = 0;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { if (DOC.pop) posicionarPop(); if (S.boasVindas === false) montarDoc(); }, 100); });
}
if (typeof document !== 'undefined') ligarDocumento();
