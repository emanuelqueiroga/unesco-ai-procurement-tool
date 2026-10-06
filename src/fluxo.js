// =====================================================================
// Fluxo em quatro fases: lógica, telas e eventos (dados em fluxo_dados.js)
// =====================================================================

// ----------------------------------------------------------- estado
function estadoFluxo() {
  S.ctx = Object.assign({ nivel: '', nivelOutro: '', local: '', etapas: {}, dominio: '', comps: [], compOutro: '', olhando: '' }, S.ctx || {});
  S.resp = S.resp || {};
  S.respC = S.respC || {};
  if (S.fase == null) S.fase = 'contexto';
  if (S.passo == null) S.passo = '1a';
  S.feitos = S.feitos || {};
  S.pular = S.pular || {};
  S.piloto = Object.assign({ escolas: '', participantes: '', meses: '' }, S.piloto || {});
  // caso em branco: enquanto a pessoa não informar, usa o total de estudantes do contexto
  if (S.exemplo === 'novo' && !S.respC.elegiveis && (S.caso.usuarios || []).includes('estudantes')) {
    const t = totaisCtx(); if (t.alunos > 0 && +S.caso.elegiveis !== t.alunos) { S.caso.elegiveis = t.alunos; S.custo.editado = false; }
  }
  return S.ctx;
}
// Num caso em branco, um campo com valor padrão só conta depois que a pessoa responde.
function respondido(campo) { return S.exemplo !== 'novo' || !!(S.respC || {})[campo]; }
function aplicarExemploFluxo(k) {
  S.ctx = clone(CTX_EX[k] || {}); S.resp = clone(RESP_EX[k] || {}); S.feitos = {}; S.respC = {}; S.pular = {}; S.vista = '';
  S.piloto = k === 'novo' ? {} : { escolas: 20, participantes: Math.round((+S.caso.elegiveis || 1000) * 0.04), meses: 4 };
  if (CTX_EX[k]) { S.ctx.local = tr(S.ctx.local); S.ctx.olhando = tr(S.ctx.olhando); if (S.ctx.compOutro) S.ctx.compOutro = tr(S.ctx.compOutro); }
  S.fase = 'contexto'; S.passo = '1a';
  estadoFluxo();
}

// ----------------------------------------------------------- cálculos
function etapasAtivas() { return ETAPAS_ENS.filter(e => ((S.ctx || {}).etapas[e[0]] || {}).on); }
function alunosEtapa(id) {
  const e = S.ctx.etapas[id] || {};
  if (e.porAno && Array.isArray(e.anos) && e.anos.some(x => +x > 0)) return e.anos.reduce((a, b) => a + (+b || 0), 0);
  return +e.alunos || 0;
}
function totaisCtx() {
  if (!S.ctx || !S.ctx.etapas) return { escolas: 0, alunos: 0, n: 0 };
  const at = etapasAtivas();
  return { escolas: at.reduce((a, e) => a + (+(S.ctx.etapas[e[0]] || {}).escolas || 0), 0), alunos: at.reduce((a, e) => a + alunosEtapa(e[0]), 0), n: at.length };
}
function questoes(fase, camada) {
  const c = S.caso, p = perfil();
  return QUESTOES.filter(q => q.fase === fase && (camada == null || q.c === camada) && (!q.quando || q.quando(c, p)));
}
function nota(qs) {
  const val = qs.filter(q => S.resp[q.id] && S.resp[q.id] !== 'na');
  const resp = qs.filter(q => S.resp[q.id]).length;
  if (!val.length) return resp ? { v: 1, resp, total: qs.length } : null;
  const s = val.reduce((a, q) => a + ({ sim: 1, parcial: 0.5 }[S.resp[q.id]] || 0), 0);
  return { v: s / val.length, resp, total: qs.length };
}
function qsPasso(id) {
  if (id === '1c') return questoes('contexto');
  if (id === '2d') return questoes('piloto').filter(q => q.g === 'regras');
  if (id === '2e') return questoes('piloto').filter(q => q.g !== 'regras');
  if (id === '3a') return questoes('implantacao');
  if (id === '4a') return questoes('escala');
  return null;
}
function passoDaQuestao(q) {
  if (q.fase === 'contexto') return '1c';
  if (q.fase === 'piloto') return q.g === 'regras' ? '2d' : '2e';
  return q.fase === 'implantacao' ? '3a' : '4a';
}
function rotulo(lista, v) { return (lista.find(o => String(o[0]) === String(v)) || ['', ''])[1]; }
// O que falta para concluir um passo (lista de rótulos)
function faltas(id) {
  const x = S.ctx, c = S.caso, F = [];
  const campo = (ok, nome) => { if (!ok) F.push(nome); };
  if (id === '1a') {
    campo(!!x.nivel, 'Nível administrativo'); campo(!!(x.local || '').trim(), 'Nome do lugar ou da rede');
    campo(respondido('situacao'), 'Em que ponto você está');
    campo(etapasAtivas().length > 0, 'Etapas de ensino'); campo(totaisCtx().alunos > 0, 'Número de estudantes');
  } else if (id === '1b') {
    campo(!!x.dominio, 'Tipo de problema'); campo((x.comps || []).length > 0, 'Componentes em jogo');
    campo(!!(c.problema || '').trim(), 'Descrição do problema');
  } else if (id === '2a') {
    campo((c.classes || []).length > 0, 'O que a IA faz'); campo(respondido('autonomia'), 'Grau de autonomia');
    campo(respondido('arquitetura') && c.arquitetura !== 'indefinida', 'Arquitetura');
  } else if (id === '2b') {
    campo((c.usuarios || []).length > 0, 'Quem usa o sistema'); campo((c.afetados || []).length > 0, 'Quem é afetado pelas saídas');
    campo(respondido('consequencias'), 'Em que entra a saída do sistema'); campo(respondido('dados'), 'Que dados são usados');
    if (dadosPessoais(c)) campo(respondido('treino'), 'Uso dos dados pelo fornecedor');
    ['frequencia', 'reversibilidade', 'verificabilidade', 'contestacao', 'cumulativo'].forEach(k => campo(respondido(k), (CAMPOS_RISCO.find(r => r[0] === k) || ['', k])[1]));
  } else if (id === '2c') {
    if (!riscoPronto()) F.push('Respostas dos passos 2.1 e 2.2');
  } else {
    const qs = qsPasso(id);
    if (qs) { const n = qs.filter(q => !S.resp[q.id]).length; if (n) F.push(n === 1 ? tr('1 pergunta sem resposta') : tr(n + ' perguntas sem resposta')); }
  }
  return F;
}
const PASSOS_COM_FALTAS = ['1a', '1b', '1c', '2a', '2b', '2c', '2d', '2e', '3a', '4a'];
function riscoPronto() { return !faltas('2a').length && !faltas('2b').length; }
function passoFeito(id) { return !faltas(id).length && (PASSOS_COM_FALTAS.includes(id) || !!S.feitos[id]); }
// Estado de um passo: ok, atencao, bloqueio ou aberto
function estadoPasso(id) {
  const qs = qsPasso(id);
  if (qs) {
    if (qs.some(q => S.resp[q.id] === 'nao' && ESSENCIAIS.has(q.id))) return 'bloqueio';
    if (qs.some(q => ['nao', 'parcial'].includes(S.resp[q.id]))) return 'atencao';
    return passoFeito(id) ? 'ok' : 'aberto';
  }
  if (id === '2c' && riscoPronto()) {
    const al = alertas(S.caso, perfil());
    if (al.some(a => a.nivel === 'bloqueio')) return 'bloqueio';
    if (al.some(a => a.nivel === 'atencao')) return 'atencao';
    return 'ok';
  }
  return passoFeito(id) ? 'ok' : 'aberto';
}
const MARCA = { ok: '✓', atencao: '!', bloqueio: '✕' };
function progressoFase(f) {
  const ps = PASSOS[f]; const feitos = ps.filter(([id]) => passoFeito(id)).length;
  return { feitos, total: ps.length, pct: feitos / ps.length };
}

// ----------------------------------------------------------- veredito por fase
const PERG_FASE = {
  contexto: 'O contexto está claro o bastante para planejar um piloto?',
  piloto: 'Pode começar o piloto?',
  implantacao: 'Pode implantar na rede?',
  escala: 'Pode manter e ampliar?',
};
const VEREDITOS = { sim: ['Sim', 'v-ok'], cond: ['Sim, com condições', 'v-warn'], nao: ['Ainda não', 'v-crit'], falta: ['Faltam respostas', 'v-muted'], pulada: ['Não avaliada', 'v-off'] };
const PULAVEIS = ['implantacao', 'escala'];
function pulada(fid) { return PULAVEIS.includes(fid) && !!(S.pular || {})[fid]; }
function fasesAvaliadas() { return FASES.filter(f => !pulada(f.id)); }
function veredito(fid) {
  if (pulada(fid)) return { st: 'pulada', bloq: [], cond: [], falt: 0 };
  const qs = questoes(fid);
  const bloq = [], cond = [];
  qs.forEach(q => {
    const v = S.resp[q.id];
    const item = { q, texto: ACOES[q.id] || q.t, ir: fid + ':' + passoDaQuestao(q) + ':' + q.id, resp: v };
    if (v === 'nao' && ESSENCIAIS.has(q.id)) bloq.push(item);
    else if (v === 'nao' || v === 'parcial') cond.push(item);
  });
  if (fid === 'piloto' && riscoPronto()) {
    alertas(S.caso, perfil()).forEach(a => {
      const item = { texto: a.texto, ir: 'piloto:2c', alerta: true };
      if (a.nivel === 'bloqueio') bloq.push(item); else if (a.nivel === 'atencao') cond.push(item);
    });
  }
  let falt = qs.filter(q => !S.resp[q.id]).length;
  const passosF = PASSOS[fid].map(p => p[0]).filter(id => !qsPasso(id) && id !== '2c');
  passosF.forEach(id => { falt += faltas(id).length; });
  const st = bloq.length ? 'nao' : falt ? 'falta' : cond.length ? 'cond' : 'sim';
  return { st, bloq, cond, falt };
}
function pillVeredito(st, curto) {
  const [t, cls] = VEREDITOS[st];
  return `<span class="vpill ${cls}">${curto && st === 'cond' ? esc('Com condições') : esc(t)}</span>`;
}
function itemAcao(it, tipo) {
  return `<li class="acao ${tipo}"><span class="acao-t">${esc(it.texto)}${it.resp === 'parcial' ? ' <span class="tag">em parte</span>' : ''}</span>
    <button type="button" class="ir" data-ir="${it.ir}">${esc(it.alerta ? 'Ver o perfil de risco' : 'Ir à pergunta')}</button></li>`;
}
function listaAcoes(arr, lim) {
  if (!arr.length) return '';
  const li = x => x.map(([it, t]) => itemAcao(it, t)).join('');
  return `<ul class="acoes">${li(arr.slice(0, lim))}</ul>${arr.length > lim ? `<details class="mais"><summary>${esc(tr('Ver mais ' + (arr.length - lim)))}</summary><ul class="acoes">${li(arr.slice(lim))}</ul></details>` : ''}`;
}
// Depois do resultado: seguir para a próxima fase ou, a partir do piloto, pular as fases restantes
function botoesSeguir(f) {
  const resto = FASES.slice(FASES.indexOf(f) + 1).filter(z => PULAVEIS.includes(z.id));
  const nf = FASES[FASES.indexOf(f) + 1];
  const resumo = `<button type="button" class="btn${nf ? '' : ' pri'}" data-act="ir-resumo">${esc(tr('Ver resumo e recomendações'))}</button>`;
  if (!nf) return resumo;
  const seguir = `<button type="button" class="btn pri" data-act="avaliar-fase" data-f2="${nf.id}">${esc(tr('Avaliar a fase ' + nf.n + ': ' + nf.nome))}</button>`;
  if (!resto.length || f.id === 'contexto') return seguir;
  const txt = resto.length === 2 ? tr('Pular as fases 3 e 4 e ver o resumo') : tr('Pular a fase 4 e ver o resumo');
  return `${seguir}<button type="button" class="btn" data-act="pular-resto" data-de="${f.id}">${esc(txt)}</button>`;
}
function cartaoResultado(fid) {
  const v = veredito(fid), f = FASES.find(z => z.id === fid);
  const resumoTxt = {
    nao: 'Há pontos essenciais sem resposta positiva. Resolva-os antes de avançar.',
    falta: 'Ainda há perguntas sem resposta nesta fase. O resultado muda conforme você responde.',
    cond: 'Pode avançar, desde que as condições abaixo entrem no plano de ação, com responsável e prazo.',
    sim: 'As respostas não indicam impedimentos nesta fase.',
  }[v.st];
  const lista = (arr, tipo) => listaAcoes(arr.map(it => [it, tipo]), 6);
  return `<div class="resultado ${VEREDITOS[v.st][1]}" id="res-${fid}">
    <div class="res-cab"><span class="eyebrow">Resultado da fase ${f.n}</span><b>${esc(PERG_FASE[fid])}</b>${pillVeredito(v.st)}</div>
    <p>${esc(resumoTxt)}</p>
    ${v.bloq.length ? `<div class="res-g"><span class="res-t crit">${esc(tr('Impedimentos (' + v.bloq.length + ')'))}</span>${lista(v.bloq, 'crit')}</div>` : ''}
    ${v.cond.length ? `<div class="res-g"><span class="res-t warn">${esc(tr('Condições (' + v.cond.length + ')'))}</span>${lista(v.cond, 'warn')}</div>` : ''}
    ${v.falt ? `<p class="res-t muted">${esc(v.falt === 1 ? tr('1 resposta pendente nesta fase') : tr(v.falt + ' respostas pendentes nesta fase'))}</p>` : ''}
    <div class="passo-pe res-pe">${botoesSeguir(f)}</div>
  </div>`;
}

// ----------------------------------------------------------- componentes
function segResp(q) {
  const v = S.resp[q.id];
  const ref = REFS[q.id];
  let refTxt = '';
  if (ref && respondido(ref[2])) { const val = ref[1](S.caso); if (val) refTxt = `<span class="ref">${esc(tr('Você respondeu no passo ' + ref[0] + ':'))} <b>${esc(val)}</b></span>`; }
  return `<div class="qc${v ? ' resp-' + v : ''}" id="q-${q.id}" data-q="${q.id}"><div class="qc-t"><span>${esc(q.t)}${ESSENCIAIS.has(q.id) ? ' <span class="tag ess">essencial</span>' : ''}${q.tag ? ` <span class="tag gold">${esc(q.tag)}</span>` : ''}</span>${q.h ? `<small>${esc(q.h)}</small>` : ''}${refTxt}</div>
    <div class="seg" role="group" aria-label="${esc(q.t)}">${RESP.map(([k, n]) => `<button type="button" data-resp="${q.id}" data-v="${k}" aria-pressed="${v === k}">${n}</button>`).join('')}</div></div>`;
}
function blocoCamadas(fase, filtro) {
  const cams = CAMADAS.filter(([n]) => CAMADAS_FASE[fase].includes(n));
  const fn = FASES.find(f => f.id === fase).n;
  return cams.map(([n, nome]) => {
    const qs = questoes(fase, n).filter(q => !filtro || filtro(q));
    if (!qs.length) return '';
    const nt = nota(qs);
    const dep = fase === 'implantacao' && (n === 4 || n === 5);
    return `<div class="camada" id="cam-${fase}-${n}"><div class="camada-cab"><span class="cn" style="--cc:var(--f${fn}s)">${n}</span><b>${esc(nome)}</b>
      ${dep ? '<span class="tag gold">depende da aplicação</span>' : ''}<span class="small muted num">${nt ? nt.resp + '/' + nt.total : '0/' + qs.length}</span></div>
      ${dep ? `<p class="small muted dep"><span>Para este caso:</span> <span>${esc(tiposAplicacao())}</span></p>` : ''}
      ${qs.map(segResp).join('')}</div>`;
  }).join('');
}
function tiposAplicacao() {
  const c = S.caso; const n = (c.classes || []).map(k => tr(rotulo(OPC.classes, k) || k));
  return n.length ? n.join('; ') : tr('tipo de aplicação ainda não informado');
}
function numIn(path, val, opts = {}) {
  return `<input type="number" min="0" step="${opts.step || 1}" id="${opts.id || 'n-' + path.replace(/\./g, '-')}" data-ctxn="${path}" value="${esc(val == null ? '' : val)}" aria-label="${esc(opts.label || '')}"${opts.ph ? ` placeholder="${esc(opts.ph)}"` : ''}>`;
}
function irBtn(alvo, txt) { return `<button type="button" class="link" data-ir="${alvo}">${esc(txt)}</button>`; }
function numerosCusto() {
  const cfg = cfgAtual(); garantirOpc(cfg);
  const av = avaliar(calcular(cfg)), ind = indicadores(cfg, av), orc = orcamento(cfg);
  const T = av.r.anos.filter(t => t > 0);
  const anual = T.length ? T.reduce((s, t) => s + (orc.dot[t] || 0), 0) / T.length : 0;
  return { av, ind, orc, H: av.r.H, piloto: orc.dot[0] || 0, anual, porAluno: ind.icu, total: av.ctEco };
}
function custoPronto() { return respondido('arquitetura') && S.caso.arquitetura !== 'indefinida'; }

// ----------------------------------------------------------- passos da fase 1
function passo1a() {
  const x = S.ctx, t = totaisCtx();
  const linhas = ETAPAS_ENS.map(([id, nome, sub, anos]) => {
    const e = x.etapas[id] || {};
    const sel = `<label class="check etapa-chk"><input type="checkbox" data-etapa="${id}" ${e.on ? 'checked' : ''}><span><b>${esc(nome)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span></label>`;
    if (!e.on) return `<div class="etapa">${sel}</div>`;
    const det = e.porAno && anos.length ? `<div class="anos">${anos.map((a, i) => `<label class="ano"><span>${esc(a)}</span>${numIn(`etapas.${id}.anos.${i}`, (e.anos || [])[i], { label: tr(nome) + ': ' + tr(a) })}</label>`).join('')}</div>` : '';
    return `<div class="etapa on">${sel}
      <div class="etapa-num">
        <label><span>Escolas</span>${numIn(`etapas.${id}.escolas`, e.escolas, { label: tr(nome) + ': ' + tr('Escolas') })}</label>
        <label><span>Estudantes</span>${e.porAno && anos.length ? `<output class="num" data-sum="${id}">${fmtInt(alunosEtapa(id))}</output>` : numIn(`etapas.${id}.alunos`, e.alunos, { label: tr(nome) + ': ' + tr('Estudantes') })}</label>
        ${anos.length ? `<label class="check small"><input type="checkbox" data-porano="${id}" ${e.porAno ? 'checked' : ''}><span>Detalhar por ano</span></label>` : ''}
      </div>${det}</div>`;
  }).join('');
  return `
    <div class="q"><span class="lbl">Qual é o nível administrativo da decisão?</span>
      <div class="opts cols">${NIVEIS_ADM.map(([k, n]) => `<label class="opt"><input type="radio" name="nivel" data-ctx="nivel" value="${k}" ${x.nivel === k ? 'checked' : ''}><span><b>${esc(n)}</b></span></label>`).join('')}</div></div>
    <div class="grid2">
      <div class="q"><label for="c-local">Nome do lugar ou da rede</label><input id="c-local" type="text" data-ctxt="local" value="${esc(x.local)}" placeholder="Ex.: Estado do Rio Grande do Sul, distrito escolar 3"></div>
      ${x.nivel === 'outro' ? `<div class="q"><label for="c-nivel-outro">Qual nível?</label><input id="c-nivel-outro" type="text" data-ctxt="nivelOutro" value="${esc(x.nivelOutro)}"></div>` : ''}
    </div>
    <div class="q"><span class="lbl">Em que ponto você está?</span>${radios('situacao', OPC.situacao, S.caso.situacao, true)}</div>
    <div class="q"><span class="lbl">Quais etapas de ensino a política atende?</span><div class="hint">Marque uma ou mais. Para cada etapa, informe escolas e estudantes; se puder, detalhe por ano.</div>
      <div class="etapas">${linhas}</div>
      <div class="totais"><span><span>Total:</span> <b class="num" data-tot="escolas">${fmtInt(t.escolas)}</b> <span>escolas</span></span><span><b class="num" data-tot="alunos">${fmtInt(t.alunos)}</b> <span>estudantes</span></span><span><b class="num">${t.n}</b> <span>etapas</span></span></div></div>`;
}
function passo1b() {
  const x = S.ctx, c = S.caso;
  const dom = DOMINIOS.map(d => `<label class="dom${d.ativo ? '' : ' off'}${x.dominio === d.id ? ' sel' : ''}">
      <input type="radio" name="dominio" data-ctx="dominio" value="${d.id}" ${x.dominio === d.id ? 'checked' : ''} ${d.ativo ? '' : 'disabled'}>
      <span class="dom-t"><b>${esc(d.nome)}</b><i>${esc(d.lema)}</i>${d.ativo ? '' : ' <span class="tag">em breve</span>'}</span>
      <span class="dom-d">${esc(d.desc)}</span>
      <span class="dom-ex"><span class="eyebrow">Exemplos</span><ul>${d.ex.map(e => `<li>${esc(e)}</li>`).join('')}</ul></span></label>`).join('');
  const d = DOMINIOS.find(z => z.id === x.dominio);
  const comps = d && d.comps ? `<div class="q"><span class="lbl">Quais componentes estão em jogo?</span>
      <div class="opts cols">${d.comps.map(([k, n, s]) => `<label class="opt"><input type="checkbox" data-comp="${k}" ${(x.comps || []).includes(k) ? 'checked' : ''}><span><b>${esc(n)}</b><small>${esc(s)}</small></span></label>`).join('')}</div>
      ${(x.comps || []).includes('outro') ? `<input type="text" data-ctxt="compOutro" value="${esc(x.compOutro)}" aria-label="Outro componente" placeholder="Qual componente?">` : ''}</div>` : '';
  return `
    <p class="muted">A ferramenta parte do problema, e não da tecnologia. Nesta versão, o foco é a qualificação; socialização e subjetivação entram nas próximas.</p>
    <div class="q"><span class="lbl">Que tipo de problema educacional você quer resolver?</span><div class="doms">${dom}</div></div>
    ${comps}
    <div class="q"><label for="c-olhando">Que problema você está olhando agora?</label><div class="hint">Em poucas palavras, do jeito que a equipe fala dele.</div>
      <input id="c-olhando" type="text" data-ctxt="olhando" value="${esc(x.olhando)}"></div>
    <div class="q"><label for="f-problema">Descreva o problema sem citar tecnologia</label>
      <div class="hint">Situação atual, quem é afetado e o que se sabe sobre as causas. Se, ao retirar a palavra "IA", o texto deixa de explicar o problema, reescreva.</div>
      <textarea id="f-problema" data-f="problema" rows="4">${esc(c.problema)}</textarea></div>
    <div class="q"><label for="f-resultado">Que resultado se espera?</label><textarea id="f-resultado" data-f="resultado" rows="2">${esc(c.resultado)}</textarea></div>
    <div class="grid2">
      <div class="q"><label for="f-pop">Quem é afetado</label><input id="f-pop" type="text" data-f="populacao" value="${esc(c.populacao)}"></div>
      <div class="q"><span class="lbl">Existe linha de base medida?</span>${radios('linhaBase', OPC.linhaBase, c.linhaBase)}</div>
    </div>
    <label class="check"><input type="checkbox" data-fb="alternativaSemIA" ${c.alternativaSemIA ? 'checked' : ''}><span>Já comparamos ao menos uma alternativa sem IA (redesenho de processo, software convencional ou não intervir).</span></label>
    ${CAP.sample ? `<div class="ai" id="ia-box"><div class="row" style="justify-content:space-between"><div><b>Estruturar a descrição com Claude</b><div class="small muted">Lê o problema e o resultado, sugere respostas para a fase do piloto e aponta lacunas. Você revisa antes de aplicar.</div></div>
      <button class="btn pri" type="button" data-act="ia" ${IA.estado === 'rodando' ? 'disabled' : ''}>${IA.estado === 'rodando' ? 'Analisando…' : 'Analisar descrição'}</button></div><div id="ia-out">${renderIA()}</div></div>` : ''}`;
}
function passo1c() {
  return `<p class="muted">A governança é a camada que atravessa todas as fases: quem decide, com que regras e com que recursos. Responda sobre a rede como um todo, e não só sobre este caso. As perguntas marcadas como essenciais impedem avançar quando a resposta é "Não".</p>
    <div class="camada">${questoes('contexto').map(segResp).join('')}</div>
    <div class="q"><span class="lbl">Quais funções que não podem ser terceirizadas já têm responsável interno?</span>${chips('capacidade', OPC.capacidade, S.caso.capacidade)}</div>`;
}

// ----------------------------------------------------------- passos da fase 2
function passo2a() {
  const c = S.caso, t = totaisCtx(), pl = S.piloto;
  const pctRede = t.escolas && +pl.escolas ? Math.min(1, +pl.escolas / t.escolas) : 0;
  return `
    <p class="muted">Descreva o uso, e não o produto: o que a IA faz, com que autonomia e em que arquitetura.</p>
    <div class="q"><span class="lbl">O que a IA faz? (uma ou mais classes)</span>${chips('classes', OPC.classes, c.classes)}</div>
    <div class="q"><span class="lbl">Grau de autonomia</span><div class="hint">Mais autonomia não significa mais maturidade.</div>${radios('autonomia', OPC.autonomia, c.autonomia, true)}</div>
    <div class="q"><span class="lbl">Arquitetura pretendida ou proposta</span><div class="hint">Define as premissas de custo.</div>${radios('arquitetura', OPC.arquitetura, c.arquitetura, true)}</div>
    <label class="check"><input type="checkbox" data-fb="pilotoGratuito" ${c.pilotoGratuito ? 'checked' : ''}><span>Há oferta de piloto ou período gratuito.</span></label>
    <div class="q"><span class="lbl">Tamanho do piloto</span>
      <div class="grid3">
        <label class="q"><span>Escolas no piloto</span>${numIn('piloto.escolas', pl.escolas, { id: 'pl-escolas', label: 'Escolas no piloto' })}</label>
        <label class="q"><span>Participantes no piloto</span>${numIn('piloto.participantes', pl.participantes, { id: 'pl-part', label: 'Participantes no piloto' })}</label>
        <label class="q"><span>Duração do piloto (meses)</span>${numIn('piloto.meses', pl.meses, { id: 'pl-meses', label: 'Duração do piloto (meses)' })}</label>
      </div>
      ${pctRede ? `<div class="hint"><span>Escolas do piloto em relação à rede:</span> <b class="num">${pct(pctRede)}</b></div>` : ''}</div>`;
}
function passo2b() {
  const c = S.caso, t = totaisCtx();
  return `
    <p class="muted">Quem usa, quem é afetado, que dados entram e o que acontece quando a saída está errada. Estas respostas definem o perfil de risco do próximo passo.</p>
    <div class="grid2">
      <div class="q"><span class="lbl">Quem usa o sistema</span>${chips('usuarios', OPC.usuarios, c.usuarios)}</div>
      <div class="q"><span class="lbl">Quem é afetado pelas saídas</span>${chips('afetados', OPC.afetados, c.afetados)}</div>
    </div>
    <div class="q"><span class="lbl">Em que entra a saída do sistema?</span>${chips('consequencias', OPC.consequencias, c.consequencias)}</div>
    <div class="q"><span class="lbl">Que dados são usados ou inferidos?</span>${chips('dados', OPC.dados, c.dados)}</div>
    ${dadosPessoais(c) ? `<div class="q"><span class="lbl">O fornecedor pode usar os dados para treinar ou melhorar modelos?</span>${radios('treino', [['nao', 'Não, está vedado por contrato'], ['sim', 'Sim, ou depende de configuração'], ['nao_sei', 'Não sabemos']], c.treino, true)}</div>` : ''}
    <div class="grid2">
      <label class="check"><input type="checkbox" data-fb="vulneraveis" ${c.vulneraveis ? 'checked' : ''}><span>Há pessoas com menor capacidade de perceber e contestar erros (deficiência, idioma, dependência do serviço).</span></label>
      <label class="check"><input type="checkbox" data-fb="idiomas" ${c.idiomas ? 'checked' : ''}><span>O sistema atende mais de um idioma ou variedade linguística.</span></label>
    </div>
    <div class="q"><span class="lbl">Frequência de uso</span>${radios('frequencia', OPC.frequencia, c.frequencia, true)}</div>
    <div class="q"><span class="lbl">Se a saída estiver errada…</span>${radios('reversibilidade', OPC.reversibilidade, c.reversibilidade)}</div>
    <div class="grid2">
      <div class="q"><span class="lbl">A instituição consegue verificar como as saídas são produzidas?</span>${radios('verificabilidade', OPC.verificabilidade, c.verificabilidade)}</div>
      <div class="q"><span class="lbl">Quem é afetado pode contestar?</span>${radios('contestacao', OPC.contestacao, c.contestacao)}</div>
    </div>
    <div class="q"><span class="lbl">Os efeitos se acumulam sobre o mesmo grupo?</span>${radios('cumulativo', OPC.cumulativo, c.cumulativo, true)}</div>
    <div class="grid2">
      <div class="q"><label for="f-eleg">Pessoas que vão usar o sistema na rede</label><input id="f-eleg" type="number" min="1" step="1" data-f="elegiveis" value="${esc(c.elegiveis)}">
        <div class="hint">Base da estimativa de custo.${t.alunos && +c.elegiveis !== t.alunos ? ` <button type="button" class="link" data-act="usar-alunos">${esc(tr('Usar o total de estudantes do contexto (' + fmtInt(t.alunos) + ')'))}</button>` : ''}</div></div>
      <div class="q"><label for="f-alc">Pessoas alcançadas pelas saídas, se diferente</label><input id="f-alc" type="number" min="0" step="1" data-f="alcance" value="${esc(c.alcance)}"></div>
    </div>`;
}
function passo2c() {
  if (!riscoPronto()) {
    const fs = [...faltas('2a').map(x => ['2a', x]), ...faltas('2b').map(x => ['2b', x])];
    return `<div class="vazio"><b>O perfil de risco aparece quando os passos 2.1 e 2.2 estiverem respondidos.</b>
      <ul>${fs.map(([p, x]) => `<li><span>${esc(x)}</span> ${irBtn('piloto:' + p, tr('Responder no passo ' + (p === '2a' ? '2.1' : '2.2')))}</li>`).join('')}</ul></div>`;
  }
  const c = S.caso, p = perfil(), al = alertas(c, p);
  const dims = DIMENSOES.map(([k, nome, perg]) => {
    const aj = (c.ajustes || {})[k] || {};
    const det = p.determinantes.includes(k);
    return `<details class="dimx${det ? ' det' : ''}" data-dim="${k}" ${(S.dimAberta || {})[k] ? 'open' : ''}><summary><span class="dn">${esc(nome)}</span>${pill(p.P[k])}${det ? '<span class="tag">define o nível</span>' : ''}</summary>
      <div class="dimx-b"><p class="small muted">${esc(perg)}</p><p>${esc(p.J[k])}${p.origem[k] ? ' <span class="tag gold">ajuste manual</span>' : ''}</p>
        <div class="row"><label class="small" for="aj-${k}">Ajustar o nível</label><select class="f" id="aj-${k}" data-aj="${k}" style="width:auto">${NIVEIS.map(n => `<option value="${n}" ${p.P[k] === n ? 'selected' : ''}>${NIVEL_NOME[n]}</option>`).join('')}</select></div>
        ${p.P[k] !== p.auto[k] || aj.nivel ? `<input type="text" data-ajm="${k}" aria-label="Justificativa do ajuste" placeholder="${esc(tr('Justificativa do ajuste (sugestão automática: ' + NIVEL_NOME[p.auto[k]] + ')'))}" value="${esc(aj.motivo || '')}">` : ''}</div></details>`;
  }).join('');
  const forma = FORMAS_SUP[formaSupervisao(c, p)];
  return `
    <div class="nivel-card card"><div class="nivel-big n-${p.agregado}">${NIVEL_NOME[p.agregado]}</div>
      <div style="display:grid;gap:6px"><b>Nível de diligência do caso de uso</b><p>${esc(NIVEL_CRIT[p.agregado])}</p>
      <p class="small muted">Não há média: o nível é definido pela dimensão mais grave. Abra uma dimensão para ver os fatores e ajustar.</p></div></div>
    ${al.length ? `<div style="display:grid;gap:8px">${al.map(a => `<div class="alert ${a.nivel}"><span class="ic">${esc({ bloqueio: 'Bloqueio', atencao: 'Atenção', info: 'Nota' }[a.nivel])}</span><span>${esc(a.texto)}</span><span class="cap">${esc(tr('Cap. ' + a.cap))}</span></div>`).join('')}</div>` : ''}
    <div class="dimsx">${dims}</div>
    <p class="note"><b><span>Supervisão humana indicada:</span> <span>${esc(forma[0])}</span>.</b> <span>${esc(forma[1])}</span></p>`;
}
function passo2f() {
  if (!custoPronto()) return `<div class="vazio"><b>Para estimar o custo, informe a arquitetura no passo 2.1.</b> ${irBtn('piloto:2a', tr('Ir ao passo 2.1'))}</div>`;
  let av;
  try { av = avaliar(calcular(cfgAtual())); } catch (e) { return '<p class="muted">Não foi possível calcular com as premissas atuais.</p>'; }
  const k0 = ARVORE.map(([k, n]) => [k, n, av.linhas.filter(l => l.k === k).reduce((s, l) => s + l.eco[0], 0)]);
  const fin0 = av.finAno[0], tot0 = av.ecoAno[0];
  const ced = av.linhas.filter(l => l.nat === 'O').reduce((s, l) => s + l.eco[0], 0);
  const part = +S.piloto.participantes || 0;
  return `<p class="muted">Custo do Ano 0 (implantação e piloto), com as premissas da calculadora. Os valores são ilustrativos; ajuste as premissas no passo 3.3.</p>
    <div class="kpis kpis3"><div class="kpi"><span class="v">${grande(tot0)}</span><span class="l">Custo do piloto, com tempo das equipes</span></div>
      <div class="kpi"><span class="v">${grande(fin0)}</span><span class="l">Desembolso no piloto</span></div>
      ${part ? `<div class="kpi"><span class="v">${din(tot0 / part, 0)}</span><span class="l">Por participante do piloto</span></div>` : ced > 0 ? `<div class="kpi"><span class="v">${grande(ced)}</span><span class="l">Cedido sem custo pelo fornecedor</span></div>` : ''}</div>
    <div class="tw"><table><thead><tr><th>Componente</th><th class="n">${esc(unidMil())}</th><th class="n">%</th></tr></thead><tbody>
      ${k0.filter(r => r[2] > 0.5).map(([k, n, v]) => `<tr><td><i class="sw" style="background:${COR_K[k]}"></i>${k} <span>${esc(n)}</span></td><td class="n">${mil(v)}</td><td class="n">${pct(tot0 ? v / tot0 : 0)}</td></tr>`).join('')}
      <tr class="tot"><td>Total do Ano 0</td><td class="n">${mil(tot0)}</td><td class="n">100%</td></tr></tbody></table></div>`;
}

// ----------------------------------------------------------- passos das fases 3 e 4
function passo3a() {
  return `<p class="muted">Na implantação entram todas as camadas. A integração de dados (4) e a cibersegurança e privacidade (5) dependem do tipo de aplicação: as perguntas mudam conforme o que a IA faz.</p>${blocoCamadas('implantacao')}`;
}
function passo3c() {
  if (!custoPronto()) return `<div class="vazio"><b>Para estimar o custo, informe a arquitetura no passo 2.1.</b> ${irBtn('piloto:2a', tr('Ir ao passo 2.1'))}</div>`;
  let n;
  try { n = numerosCusto(); } catch (e) { return '<p class="muted">Não foi possível calcular com as premissas atuais.</p>'; }
  const T = n.av.r.anos;
  return `<div class="kpis kpis4">
      <div class="kpi"><span class="v">${grande(n.total)}</span><span class="l">Custo total do ciclo de vida</span></div>
      <div class="kpi"><span class="v">${grande(n.anual)}</span><span class="l">Dotação média por ano de operação</span></div>
      <div class="kpi"><span class="v">${din(n.porAluno, 2)}</span><span class="l">Por usuário ativo por ano</span></div>
      <div class="kpi"><span class="v">${n.ind.anosParaSair.toLocaleString(LOC(), { maximumFractionDigits: 1 })}</span><span class="l">Custo de sair, em anos de custo recorrente</span></div></div>
    <p class="small muted"><span>${esc(tr('Horizonte: Ano 0 (piloto e implantação) e ' + n.H + ' anos de operação.'))}</span> <span>Custo total em preços constantes, com tempo das equipes; dotação em preços correntes, só desembolso. Valores ilustrativos.</span></p>
    <div class="tw"><table><thead><tr><th>Exercício</th>${T.map(x => `<th class="n">${esc(tr('Ano ' + x))}</th>`).join('')}</tr></thead><tbody>
      <tr><td><span>Dotação a solicitar</span> (${esc(unidMil())})</td>${T.map(x => `<td class="n">${mil(n.orc.dot[x])}</td>`).join('')}</tr></tbody></table></div>
    <details class="calc" data-calc ${S.calcAberta ? 'open' : ''}><summary>Ajustar premissas, itens e cenários na calculadora completa</summary>
      <div id="custos-box" class="embutido">${S.calcAberta ? renderCustos() : ''}</div></details>`;
}
function passo4a() { return `<p class="muted">Para sustentar e ampliar, todas as camadas precisam funcionar sem as condições especiais do piloto.</p>${blocoCamadas('escala')}`; }
function passo4b() {
  if (!custoPronto()) return `<div class="vazio"><b>Para estimar o custo, informe a arquitetura no passo 2.1.</b> ${irBtn('piloto:2a', tr('Ir ao passo 2.1'))}</div>`;
  let n, cs;
  try { n = numerosCusto(); cs = cenarios(cfgAtual()); } catch (e) { return '<p class="muted">Não foi possível calcular com as premissas atuais.</p>'; }
  const ind = n.ind;
  const ca = Object.keys(cs).map(k => [k, avaliar(cs[k]).ctEco]);
  const t = totaisCtx();
  return `<div class="kpis">
      <div class="kpi"><span class="v">${grande(ind.recorrenteFin)}</span><span class="l">Custo recorrente por ano de operação</span></div>
      <div class="kpi"><span class="v">${din(ind.icu, 2)}</span><span class="l">Por usuário ativo por ano</span></div>
      ${t.escolas ? `<div class="kpi"><span class="v">${grande(ind.recorrenteFin / t.escolas)}</span><span class="l">Custo recorrente por escola por ano</span></div>` : ''}</div>
    <div class="tw"><table><thead><tr><th>Cenário</th><th class="n">Custo total do ciclo de vida</th></tr></thead><tbody>${ca.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="n">${grande(v)}</td></tr>`).join('')}</tbody></table></div>
    <p class="small muted">Valores ilustrativos da calculadora. A expansão é sustentável quando o custo recorrente cabe no orçamento sem condições promocionais, inclusive nas escolas com menos infraestrutura.</p>`;
}

// ----------------------------------------------------------- render
function corpoPasso(id) {
  switch (id) {
    case '1a': return passo1a();
    case '1b': return passo1b();
    case '1c': return passo1c();
    case '2a': return passo2a();
    case '2b': return passo2b();
    case '2c': return passo2c();
    case '2d': return `<p class="muted">Antes de começar, confirme que o piloto segue as regras da rede e da legislação.</p><div class="camada">${qsPasso('2d').map(segResp).join('')}</div>`;
    case '2e': return `<p class="muted">No piloto, as camadas 2 e 3 precisam estar prontas, e as camadas 5, 6 e 7 em capacidade mínima, só nos locais do piloto.</p>${blocoCamadas('piloto', q => q.g !== 'regras')}`;
    case '2f': return passo2f();
    case '3a': return passo3a();
    case '3b': return `<div class="embutido">${renderListas()}</div>`;
    case '3c': return passo3c();
    case '4a': return passo4a();
    case '4b': return passo4b();
    case '4c': return `<p class="muted">Renovar é uma nova decisão pública: volte à hipótese de valor, compare com a linha de base e com as alternativas disponíveis hoje e recalcule o custo para o novo horizonte.</p>${cardPD(9, true)}`;
  }
  return '';
}
function resumoPasso(id) {
  const x = S.ctx;
  const fs = faltas(id);
  if (id === '1a' && !fs.length) { const t = totaisCtx(); return [tr(rotulo(NIVEIS_ADM, x.nivel)), x.local, fmtInt(t.alunos) + ' ' + tr('estudantes')].filter(Boolean).join(' · '); }
  if (id === '1b' && !fs.length) { const d = DOMINIOS.find(z => z.id === x.dominio); return [d ? tr(d.nome) : '', x.olhando].filter(Boolean).join(' · '); }
  if (id === '2c' && riscoPronto()) return tr('Perfil de risco') + ': ' + tr(NIVEL_NOME[perfil().agregado]);
  const qs = qsPasso(id);
  if (qs) {
    const r = qs.filter(q => S.resp[q.id]).length, b = qs.filter(q => S.resp[q.id] === 'nao' && ESSENCIAIS.has(q.id)).length;
    return tr(r + ' de ' + qs.length + ' respondidas') + (b ? ' · ' + tr(b === 1 ? '1 impedimento' : b + ' impedimentos') : '');
  }
  if (fs.length) return tr('Falta:') + ' ' + fs.map(tr).join(', ');
  return '';
}
// Rodapé do passo aberto: lista o que falta ou mostra o botão de continuar. Recalculado a cada resposta.
function rodapePasso(fid, id) {
  const f = FASES.find(z => z.id === fid), ps = PASSOS[fid], i = ps.findIndex(p => p[0] === id);
  const nf = FASES[FASES.indexOf(f) + 1];
  const prox = i === ps.length - 1 ? (nf ? tr('Ver o resultado da fase ' + f.n) : tr('Ver o resumo do caso')) : tr('Continuar para ' + numPasso(fid, i + 1));
  const fs = faltas(id);
  return `<div class="pe" id="pe-${id}">${fs.length
    ? `<div class="aviso"><b>${esc(tr('Ainda falta responder neste passo:'))}</b><ul>${fs.map(x => `<li>${esc(tr(x))}</li>`).join('')}</ul>
        <div class="row"><button type="button" class="btn" data-act="continuar-forcar">${esc(tr('Continuar mesmo assim'))}</button><span class="small muted">${esc(tr('Você pode voltar depois. O resultado da fase considera o que faltar.'))}</span></div></div>`
    : `<div class="passo-pe"><span class="ok-msg">${esc(tr('Passo completo.'))}</span><button type="button" class="btn pri" data-act="continuar">${esc(prox)}</button></div>`}</div>`;
}
function numPasso(fid, i) { return FASES.find(f => f.id === fid).n + '.' + (i + 1); }
function renderFase(f) {
  const aberta = S.fase === f.id;
  const v = veredito(f.id);
  const cab = `<button type="button" class="fase-cab" data-fase="${f.id}" aria-expanded="${aberta}">
      <span class="fase-n">${f.n}</span><span class="fase-t"><b>${esc(f.nome)}</b><small>${esc(f.sub)}</small></span>
      <span class="fase-v">${pillVeredito(v.st, true)}</span><span class="chev" aria-hidden="true"></span></button>`;
  if (!aberta) return `<section class="fase f${f.n}${pulada(f.id) ? ' pulada' : ''}" id="fase-${f.id}">${cab}</section>`;
  if (pulada(f.id)) return `<section class="fase f${f.n} aberta pulada" id="fase-${f.id}">${cab}
    <div class="fase-corpo"><div class="vazio"><b>${esc(tr('Você optou por não avaliar esta fase agora.'))}</b>
      <span>${esc(tr('O resumo e as recomendações consideram só as fases avaliadas. Você pode avaliá-la a qualquer momento.'))}</span>
      <div class="row"><button type="button" class="btn pri" data-act="avaliar-fase" data-f2="${f.id}">${esc(tr('Avaliar esta fase'))}</button></div></div></div></section>`;
  const cams = CAMADAS_FASE[f.id];
  const passos = PASSOS[f.id].map(([id, nome], i) => {
    const ab = S.passo === id, st = estadoPasso(id);
    const pe = ab ? rodapePasso(f.id, id) : '';
    return `<div class="passo st-${st}${ab ? ' aberto' : ''}" id="passo-${id}">
      <button type="button" class="passo-cab" data-passo="${id}" aria-expanded="${ab}"><span class="pn">${MARCA[st] ? `<span aria-hidden="true">${MARCA[st]}</span><span class="sr">${numPasso(f.id, i)}</span>` : numPasso(f.id, i)}</span><span class="pt"><b>${esc(nome)}</b>${!ab ? `<small>${esc(resumoPasso(id))}</small>` : ''}</span><span class="chev" aria-hidden="true"></span></button>
      ${ab ? `<div class="passo-corpo">${corpoPasso(id)}${pe}</div>` : ''}</div>`;
  }).join('');
  return `<section class="fase f${f.n} aberta" id="fase-${f.id}">${cab}
    <div class="fase-corpo">
      <div class="fase-camadas"><span class="small muted">Camadas nesta fase</span>${CAMADAS.map(([n, nome]) => `<span class="cam-chip${cams.includes(n) ? '' : ' fora'}" title="${esc(tr(nome))}">${n}</span>`).join('')}</div>
      ${PULAVEIS.includes(f.id) ? `<div class="pular-linha"><span class="small muted">${esc(tr('Ainda não vai decidir sobre esta fase?'))}</span><button type="button" class="link" data-act="pular-fase" data-f2="${f.id}">${esc(tr('Não avaliar esta fase agora'))}</button></div>` : ''}
      ${passos}
      ${cartaoResultado(f.id)}
      ${f.id !== 'escala' ? `<details class="pds-fase"><summary>Pontos de decisão do guia nesta fase</summary><div class="pds-in">${f.pds.map(n => cardPD(n, false)).join('')}</div></details>` : ''}
    </div></section>`;
}
function renderStepper() {
  const el = $('#stepper'); if (!el) return;
  el.innerHTML = FASES.map(f => { const pr = progressoFase(f.id); const v = veredito(f.id); return `<button type="button" class="step-f f${f.n}${S.fase === f.id ? ' at' : ''}" data-fase="${f.id}" aria-current="${S.fase === f.id}">
    <span class="sf-n">${f.n}</span><span class="sf-t">${esc(f.nome)}</span><span class="sf-v ${VEREDITOS[v.st][1]}" title="${esc(tr(VEREDITOS[v.st][0]))}"></span><span class="sf-bar"><i style="width:${Math.round(100 * pr.pct)}%"></i></span></button>`; }).join('')
    + `<button type="button" class="step-r${S.vista === 'resumo' ? ' at' : ''}" data-act="ir-resumo" aria-current="${S.vista === 'resumo'}"><span class="sf-t">${esc(tr('Resumo'))}</span></button>`;
}
function boasVindas() {
  return `<section class="boas card" id="boas">
    <div class="eyebrow">Como funciona</div>
    <h2>Do contexto à expansão, em quatro fases</h2>
    <p>Você descreve a sua rede e o problema, responde perguntas curtas por camada e recebe, ao fim de cada fase, um resultado: pode avançar, pode avançar com condições ou ainda não. O custo é estimado com base nas suas respostas.</p>
    <ol class="boas-fases">${FASES.map(f => `<li class="f${f.n}"><span class="fase-n">${f.n}</span><span><b>${esc(f.nome)}</b><small>${esc(f.sub)}</small></span></li>`).join('')}</ol>
    <div class="row"><button type="button" class="btn pri grande" data-act="comecar">Começar um caso em branco</button><button type="button" class="btn grande" data-act="ver-exemplo">Ver um exemplo preenchido</button></div>
    <p class="small muted">As respostas ficam salvas só neste navegador. Você pode exportar o caso a qualquer momento.</p>
  </section>`;
}
function planoAcao() {
  const ps = [];
  fasesAvaliadas().forEach(f => { const v = veredito(f.id); if (v.bloq.length || v.cond.length) ps.push([f, v]); });
  return ps;
}
function chamadaResumo() {
  return `<section class="cta-resumo card" id="fase-final"><div><div class="eyebrow">Ao terminar</div><h2>Resumo e recomendações</h2>
    <p class="muted">Resultado de cada fase, o que fazer antes da próxima decisão e o que precisa entrar no modelo de contratação. Exporte em PDF.</p></div>
    <button type="button" class="btn pri grande" data-act="ir-resumo">Ver resumo e recomendações</button></section>`;
}
function abrirResumo() { S.vista = 'resumo'; S.boasVindas = false; render(); window.scrollTo({ top: 0, behavior: 'instant' }); }
function mandala() {
  const W = 300, cx = 150, cy = 146, R = [0, 40, 70, 100, 128];
  const ang = i => -Math.PI / 2 + i * 2 * Math.PI / 7;
  const pt = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const setor = (r0, r1, a0, a1) => { const g = 0.012; const [x0, y0] = pt(r1, a0 + g), [x1, y1] = pt(r1, a1 - g), [x2, y2] = pt(r0, a1 - g), [x3, y3] = pt(r0, a0 + g);
    return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r1},${r1} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} A${r0},${r0} 0 0 0 ${x3.toFixed(1)},${y3.toFixed(1)}Z`; };
  let s = `<svg class="mandala" viewBox="0 0 ${W} 292" role="img" aria-label="${esc(tr('Mandala: fases e camadas'))}">`;
  const nc = nota(questoes('contexto'));
  const temNao = qs => qs.some(q => S.resp[q.id] === 'nao');
  s += `<a href="#" data-ir="contexto:1c" class="m-cel"><circle cx="${cx}" cy="${cy}" r="${R[1] - 2}" style="fill:var(--f1);fill-opacity:${nc ? (0.2 + 0.8 * nc.v).toFixed(2) : 0.12};stroke:${temNao(questoes('contexto')) ? 'var(--crit)' : 'var(--f1s)'};stroke-width:${temNao(questoes('contexto')) ? 2 : 1}"><title>${esc(tr('Fase 1:') + ' ' + tr('Contexto') + ' · ' + tr('Governança') + ' ' + (nc ? Math.round(100 * nc.v) + '%' : '–'))}</title></circle>`;
  s += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" class="m-c">${esc(tr('Contexto'))}</text></a>`;
  ['piloto', 'implantacao', 'escala'].forEach((fid, j) => {
    const f = FASES.find(z => z.id === fid);
    CAMADAS.forEach(([n, nome], i) => {
      const r0 = R[j + 1] + 1, r1 = R[j + 2] - 1, a0 = ang(i), a1 = ang(i + 1);
      const aplic = CAMADAS_FASE[fid].includes(n) && !pulada(fid);
      const qs = aplic ? questoes(fid, n) : [];
      const nt = aplic ? nota(qs) : null;
      const tit = esc(tr('Fase ' + f.n + ': ' + f.nome) + ' · ' + n + '. ' + tr(nome) + ' · ' + (aplic ? (nt && nt.resp ? Math.round(100 * nt.v) + '%' : tr('sem respostas')) : pulada(fid) ? tr('não avaliada') : tr('fora desta fase')));
      if (!aplic) { s += `<path d="${setor(r0, r1, a0, a1)}" class="m-fora"><title>${tit}</title></path>`; return; }
      const q0 = qs[0]; const alvo = q0 ? fid + ':' + passoDaQuestao(q0) + ':' + q0.id : fid + ':' + PASSOS[fid][0][0];
      const nao = temNao(qs);
      s += `<a href="#" data-ir="${alvo}" class="m-cel"><path d="${setor(r0, r1, a0, a1)}" style="fill:var(--f${f.n});fill-opacity:${nt && nt.resp ? (0.15 + 0.85 * nt.v).toFixed(2) : 0.07};stroke:${nao ? 'var(--crit)' : 'var(--f' + f.n + 's)'};stroke-width:${nao ? 2 : 1}"><title>${tit}</title></path></a>`;
    });
  });
  CAMADAS.forEach(([n], i) => { const [x, y] = pt(R[4] + 10, (ang(i) + ang(i + 1)) / 2); s += `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" class="m-l">${n}</text>`; });
  return s + '</svg>';
}
function renderPainel() {
  const el = $('#painel'); if (!el) return;
  const t = totaisCtx();
  let custo = ''; if (custoPronto()) { try { const n = numerosCusto(); custo = grande(n.total); custo += ` <small>(${esc(tr(n.H + ' anos'))})</small>`; } catch (e) { } }
  el.innerHTML = `<div class="card painel-in">
    <div class="eyebrow">Resultado por fase</div>
    <ul class="vlist">${FASES.map(f => { const v = veredito(f.id); return `<li><button type="button" data-fase="${f.id}"><span class="fase-n f${f.n}">${f.n}</span><span class="vl-t">${esc(f.nome)}</span>${pillVeredito(v.st, true)}</button></li>`; }).join('')}</ul>
    ${mandala()}
    <p class="small muted">Centro: contexto e governança. Anéis, de dentro para fora: piloto, implantação, sustentabilidade e expansão. Fatias: as sete camadas. Quanto mais forte a cor, mais respostas "sim"; contorno vermelho indica alguma resposta "não". Clique para ir às perguntas.</p>
    <ol class="leg">${CAMADAS.map(([n, nome]) => `<li><span class="cn">${n}</span>${esc(nome)}</li>`).join('')}</ol>
    <div class="fatos">
      <div class="linha"><span>Caso</span><span>${esc(S.caso.titulo || S.ctx.olhando || tr('Caso sem título'))}</span></div>
      ${S.ctx.local ? `<div class="linha"><span>Lugar</span><span>${esc(S.ctx.local)}</span></div>` : ''}
      <div class="linha"><span>Estudantes</span><span class="num">${t.alunos ? fmtInt(t.alunos) : '—'}</span></div>
      <div class="linha"><span>Perfil de risco</span><span>${riscoPronto() ? pill(perfil().agregado) : '—'}</span></div>
      <div class="linha"><span>Custo total</span><span class="num">${custo || '—'}</span></div>
    </div>
    <div class="row painel-acoes"><button class="btn" type="button" data-act="ir-resumo">Resumo e recomendações</button><span class="small muted">Salvo neste navegador</span></div>
  </div>`;
}
function render() {
  estadoFluxo();
  const y = window.scrollY, foco = document.activeElement && document.activeElement.id;
  $('#main').innerHTML = `${S.boasVindas !== false ? '' : '<nav class="stepper" id="stepper" aria-label="Fases"></nav>'}
    ${S.boasVindas !== false ? boasVindas() : ''}
    ${['A', 'B', 'C', 'D', 'editado'].includes(S.exemplo) && S.boasVindas === false ? `<div class="alert info"><span class="ic">Exemplo</span><span>${['A', 'B', 'C', 'D'].includes(S.exemplo) ? esc(tr('Você está vendo um caso ilustrativo do guia, com respostas fictícias:')) + ' <b>' + esc(tr(CASOS[S.exemplo].titulo)) + '</b>. ' : ''}<span>Edite as respostas ou comece um caso em branco.</span></span><button class="btn" type="button" data-act="limpar">Começar um caso em branco</button></div>` : ''}
    ${S.vista === 'resumo' ? renderResumo() : FASES.map(renderFase).join('') + chamadaResumo()}`;
  renderStepper(); renderPainel();
  if (document.getElementById('cres')) renderCustosResultados();
  if (foco) { const f = document.getElementById(foco); if (f) try { f.focus({ preventScroll: true }); } catch (e) { } }
  window.scrollTo(0, y);
  salvar();
}
function atualizarLaterais() { renderStepper(); renderPainel(); atualizarFaseViva(); salvar(); }
// atualiza o cabeçalho e o resultado da fase aberta sem redesenhar a página
function atualizarFaseViva() {
  const fid = S.fase; if (!fid) return;
  const sec = document.getElementById('fase-' + fid); if (!sec) return;
  const v = veredito(fid);
  const pv = sec.querySelector('.fase-v'); if (pv) pv.innerHTML = pillVeredito(v.st, true);
  const res = document.getElementById('res-' + fid); if (res) res.outerHTML = cartaoResultado(fid);
  PASSOS[fid].forEach(([id], i) => {
    const p = document.getElementById('passo-' + id); if (!p) return;
    const st = estadoPasso(id);
    p.className = 'passo st-' + st + (S.passo === id ? ' aberto' : '');
    const pn = p.querySelector('.pn'); if (pn) pn.innerHTML = MARCA[st] ? `<span aria-hidden="true">${MARCA[st]}</span><span class="sr">${numPasso(fid, i)}</span>` : numPasso(fid, i);
    const sm = p.querySelector('.pt small'); if (sm) sm.textContent = resumoPasso(id);
  });
  // rodapé do passo aberto (o que falta / continuar), sem perder o foco do campo em edição
  const pe = S.passo && document.getElementById('pe-' + S.passo);
  if (pe) { const novo = rodapePasso(fid, S.passo); if (pe.outerHTML !== novo) pe.outerHTML = novo; }
}
function irPara(id) {
  const el = document.getElementById(id); if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - (document.querySelector('.top') || { offsetHeight: 0 }).offsetHeight - 12;
  window.scrollTo({ top, behavior: 'smooth' });
  if (el.classList.contains('qc')) { el.classList.add('pisca'); setTimeout(() => el.classList.remove('pisca'), 1600); }
}
function abrirFase(fid, passo, alvo) {
  S.fase = fid; S.passo = passo || PASSOS[fid][0][0]; S.boasVindas = false; S.vista = ''; render();
  requestAnimationFrame(() => irPara(alvo ? 'q-' + alvo : 'passo-' + S.passo));
}
function continuar(forcar) {
  if (!forcar && faltas(S.passo).length) { render(); return; }
  S.feitos[S.passo] = true;
  const f = FASES.find(z => z.id === S.fase); const ps = PASSOS[f.id]; const i = ps.findIndex(p => p[0] === S.passo);
  if (i < ps.length - 1) { S.passo = ps[i + 1][0]; render(); requestAnimationFrame(() => irPara('passo-' + S.passo)); return; }
  // último passo: fecha os passos e mostra o resultado da fase
  S.passo = ''; render(); requestAnimationFrame(() => irPara('res-' + f.id));
}

// ----------------------------------------------------------- exportar e importar
function dadosCaso() { return { app: 'navegador-ia-educacao', versao: 4, salvo: new Date().toISOString(), exemplo: S.exemplo, caso: S.caso, ctx: S.ctx, resp: S.resp, respC: S.respC, pular: S.pular, piloto: S.piloto, feitos: S.feitos, checks: S.checks, custo: S.custo, moeda: S.moeda, lang: S.lang }; }
function importarCaso(txt) {
  try {
    const o = JSON.parse(txt);
    if (!o || o.app !== 'navegador-ia-educacao' || !o.caso) throw new Error('formato');
    S.caso = Object.assign(clone(CASO_VAZIO), o.caso); S.ctx = o.ctx || {}; S.resp = o.resp || {}; S.piloto = o.piloto || {}; S.checks = o.checks || {};
    S.respC = o.respC || {}; S.feitos = o.feitos || {}; S.pular = o.pular || {}; S.vista = '';
    if (o.custo) S.custo = o.custo; if (o.moeda) S.moeda = o.moeda;
    S.exemplo = o.exemplo === 'novo' ? 'novo' : 'editado'; S.fase = 'contexto'; S.passo = '1a'; S.boasVindas = false;
    render(); window.scrollTo(0, 0); toast('Caso importado.');
  } catch (e) { toast('Este arquivo não é um caso exportado pelo navegador.'); }
}

// ----------------------------------------------------------- eventos do fluxo
function eventoFluxo(e) {
  const el = e.target;
  if (e.type === 'click') {
    const iz = el.closest('[data-ir]');
    if (iz) { e.preventDefault(); const [f, p, q] = iz.dataset.ir.split(':'); abrirFase(f, p, q); return true; }
    const fz = el.closest('[data-fase]');
    if (fz) { const id = fz.dataset.fase; if (S.fase === id && fz.classList.contains('fase-cab')) { S.fase = ''; render(); } else abrirFase(id, S.fase === id ? S.passo : ''); return true; }
    const pz = el.closest('[data-passo]');
    if (pz) { const id = pz.dataset.passo; S.passo = S.passo === id ? '' : id; render(); if (S.passo) requestAnimationFrame(() => irPara('passo-' + id)); return true; }
    const rz = el.closest('[data-resp]');
    if (rz) {
      const id = rz.dataset.resp, v = rz.dataset.v;
      if (S.resp[id] === v) delete S.resp[id]; else S.resp[id] = v;
      if (S.exemplo !== 'novo') S.exemplo = 'editado';
      const row = rz.closest('.qc');
      row.className = 'qc' + (S.resp[id] ? ' resp-' + S.resp[id] : '');
      row.querySelectorAll('[data-resp]').forEach(b => b.setAttribute('aria-pressed', S.resp[id] === b.dataset.v));
      const cab = row.closest('.camada'); const num = cab && cab.querySelector('.camada-cab .num');
      if (num) { const ids = [...cab.querySelectorAll('.qc')].map(x => x.dataset.q); num.textContent = ids.filter(k => S.resp[k]).length + '/' + ids.length; }
      atualizarLaterais(); return true;
    }
    const a = el.closest('[data-act]'); if (!a) return false;
    const act = a.dataset.act;
    if (act === 'continuar') { continuar(false); return true; }
    if (act === 'continuar-forcar') { continuar(true); return true; }
    if (act === 'comecar') { S.boasVindas = false; carregarExemplo('novo'); S.boasVindas = false; abrirFase('contexto', '1a'); return true; }
    if (act === 'ver-exemplo') { carregarExemplo('B'); S.boasVindas = false; abrirFase('contexto', '1a'); return true; }
    if (act === 'ir-final' || act === 'ir-resumo') { abrirResumo(); return true; }
    if (act === 'voltar-fases') { S.vista = ''; render(); window.scrollTo({ top: 0, behavior: 'instant' }); return true; }
    if (act === 'avaliar-fase') { const id = a.dataset.f2; S.pular[id] = false; S.vista = ''; abrirFase(id, PASSOS[id][0][0]); return true; }
    if (act === 'pular-fase') { S.pular[a.dataset.f2] = true; if (a.dataset.f2 === 'implantacao') S.pular.escala = true; S.passo = ''; render(); toast(tr('Fase marcada como não avaliada.')); return true; }
    if (act === 'pular-resto') { const i = FASES.findIndex(z => z.id === a.dataset.de); FASES.slice(i + 1).forEach(z => { if (PULAVEIS.includes(z.id)) S.pular[z.id] = true; }); abrirResumo(); return true; }
    if (act === 'pdf') { baixarPDF(); return true; }
    if (act === 'usar-alunos') { S.caso.elegiveis = totaisCtx().alunos; S.respC.elegiveis = true; S.custo.editado = false; render(); toast('Total de estudantes aplicado.'); return true; }
    if (act === 'exp-json') { baixar(nomeArq('json').replace('relatorio', 'caso'), JSON.stringify(dadosCaso(), null, 1)); return true; }
    if (act === 'copiar-json') { const t = JSON.stringify(dadosCaso()); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(() => toast('Dados do caso copiados.'), () => toast('Não foi possível copiar.')); return true; }
    return false;
  }
  if (e.type === 'change') {
    if (el.id === 'imp-json' && el.files && el.files[0]) { const r = new FileReader(); r.onload = () => importarCaso(String(r.result)); r.readAsText(el.files[0]); el.value = ''; return true; }
    if (el.dataset.ctx) { S.ctx[el.dataset.ctx] = el.value; if (S.exemplo !== 'novo') S.exemplo = 'editado'; if (el.dataset.ctx === 'dominio') S.ctx.comps = []; render(); return true; }
    if (el.dataset.etapa) { const id = el.dataset.etapa; S.ctx.etapas[id] = Object.assign(S.ctx.etapas[id] || {}, { on: el.checked }); render(); return true; }
    if (el.dataset.porano) { const id = el.dataset.porano; S.ctx.etapas[id].porAno = el.checked; render(); return true; }
    if (el.dataset.comp) { const s = new Set(S.ctx.comps || []); el.checked ? s.add(el.dataset.comp) : s.delete(el.dataset.comp); S.ctx.comps = [...s]; render(); return true; }
    if (el.dataset.ctxn) {
      const v = el.value === '' ? '' : Math.max(0, +el.value || 0);
      const path = el.dataset.ctxn;
      if (path.startsWith('piloto.')) setPath(S, path, v); else {
        const ks = path.split('.'); // etapas.id.campo[.i]
        const et = S.ctx.etapas[ks[1]] = S.ctx.etapas[ks[1]] || {};
        if (ks[2] === 'anos') { et.anos = et.anos || []; et.anos[+ks[3]] = v; } else et[ks[2]] = v;
        const s = document.querySelector(`[data-sum="${ks[1]}"]`); if (s) s.textContent = fmtInt(alunosEtapa(ks[1]));
        const t = totaisCtx(); const te = document.querySelector('[data-tot="escolas"]'), ta = document.querySelector('[data-tot="alunos"]');
        if (te) te.textContent = fmtInt(t.escolas); if (ta) ta.textContent = fmtInt(t.alunos);
      }
      estadoFluxo(); atualizarLaterais(); return true;
    }
  }
  if (e.type === 'input') {
    if (el.dataset.ctxt) { S.ctx[el.dataset.ctxt] = el.value; atualizarLaterais(); return true; }
  }
  if (e.type === 'toggle' && el.dataset) {
    if (el.dataset.dim) { S.dimAberta = S.dimAberta || {}; S.dimAberta[el.dataset.dim] = el.open; return false; }
    if (el.dataset.calc != null) {
      S.calcAberta = el.open;
      const box = document.getElementById('custos-box');
      if (el.open && box && !box.innerHTML) { box.innerHTML = renderCustos(); renderCustosResultados(); }
      salvar(); return false;
    }
  }
  return false;
}

// ----------------------------------------------------------- relatório
function secoesFluxo() {
  const x = S.ctx || {}, t = totaisCtx();
  const nv = rotulo(NIVEIS_ADM, x.nivel);
  const rot = v => (RESP.find(r => r[0] === v) || ['', 'Sem resposta'])[1];
  const secs = [];
  // resumo executivo: veredito de cada fase e plano de ação
  const res = FASES.map(f => { const v = veredito(f.id); return [tr('Fase ' + f.n + ':') + ' ' + tr(f.nome), tr(PERG_FASE[f.id]) + ' ' + tr(VEREDITOS[v.st][0]) + '.']; });
  const acoes = [];
  planoAcao().forEach(([f, v]) => {
    v.bloq.forEach(it => acoes.push(tr('Fase ' + f.n + ':') + ' ' + tr('Impedimento') + '. ' + tr(it.texto)));
    v.cond.forEach(it => acoes.push(tr('Fase ' + f.n + ':') + ' ' + tr('Condição') + '. ' + tr(it.texto)));
  });
  secs.push({ h: 'Resumo executivo', kv: res, p: acoes.length ? ['Plano de ação, em ordem de prioridade:'] : ['Nenhuma ação pendente nas respostas dadas até agora.'], list: acoes });
  secs.push({ h: 'Contexto', kv: [['Nível administrativo', x.nivel === 'outro' ? (x.nivelOutro || nv) : nv], ['Lugar ou rede', x.local || ''], ['Escolas', fmtInt(t.escolas)], ['Estudantes', fmtInt(t.alunos)]],
    table: t.n ? { head: ['Etapa de ensino', 'Escolas', 'Estudantes'], rows: etapasAtivas().map(([id, nome]) => [nome, fmtInt(+(x.etapas[id] || {}).escolas || 0), fmtInt(alunosEtapa(id))]) } : null });
  const d = DOMINIOS.find(z => z.id === x.dominio);
  secs.push({ h: 'Problema', kv: [['Tipo de problema', d ? tr(d.nome) + ' (' + tr(d.lema) + ')' : ''], ['Componentes', (x.comps || []).map(k => k === 'outro' ? (x.compOutro || tr('Outro componente')) : tr(((d && d.comps || []).find(cp => cp[0] === k) || [k, k])[1])).join('; ')], ['Problema que a equipe está olhando', x.olhando || '']] });
  secs.push({ h: 'Governança de IA na educação', table: { head: ['Pergunta', 'Resposta'], rows: questoes('contexto').map(q => [q.t, rot(S.resp[q.id])]) } });
  ['piloto', 'implantacao', 'escala'].forEach(fid => {
    const f = FASES.find(z => z.id === fid);
    if (pulada(fid)) { secs.push({ h: tr('Fase ' + f.n + ':') + ' ' + tr(f.nome), p: [tr('Você optou por não avaliar esta fase agora.')] }); return; }
    secs.push({ h: tr('Fase ' + f.n + ':') + ' ' + tr(f.nome), table: { head: ['Camada', 'Pergunta', 'Resposta'], rows: questoes(fid).map(q => [q.g === 'regras' ? tr('Regras do piloto') : q.c + '. ' + tr(CAMADAS[q.c - 1][1]), q.t, rot(S.resp[q.id])]) } });
  });
  return secs;
}
