// =====================================================================
// Interface do navegador
// =====================================================================
const CHAVE = 'navegador-ia-educacao-v4';
let S = {
  caso: clone(CASO_VAZIO), exemplo: 'novo', checks: {}, sub: 'dados', fase: '', passo: '1a', ctx: {}, resp: {}, respC: {}, piloto: {}, feitos: {}, boasVindas: true,
  custo: { base: 'caso', cfg: null, editado: false }, moeda: { cod: 'USD', taxa: '' }, lang: '',
};
let CAP = { sample: null, downloads: null };
let IA = { estado: '', resposta: null, erro: '' };

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pill = n => `<span class="pill n-${n}">${NIVEL_NOME[n]}</span>`;

function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch (e) { } }
function carregar() {
  try {
    const t = localStorage.getItem(CHAVE);
    if (t) { const o = JSON.parse(t); if (o && o.caso) S = Object.assign(S, o); S.caso = Object.assign(clone(CASO_VAZIO), S.caso); }
  } catch (e) { }
}
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 2600);
}

// ----------------------------------------------------------- derivados
function perfil() { return perfilFinal(S.caso); }
function cfgAtual() {
  if (S.custo.base !== 'caso') {
    if (!S.custo.cfg || S.custo.cfg.__base !== S.custo.base) { S.custo.cfg = clone(PRESETS[S.custo.base]); S.custo.cfg.__base = S.custo.base; S.custo.editado = false; }
    return S.custo.cfg;
  }
  if (!S.custo.cfg || S.custo.cfg.__base !== 'caso' || !S.custo.editado) {
    S.custo.cfg = cfgDoCaso(S.caso, perfil()); S.custo.cfg.__base = 'caso';
  }
  return S.custo.cfg;
}
function rota() { return ROTAS[S.caso.situacao] || ROTAS.nova; }
function pdsDaRota() { return [...new Set(rota().passos.filter(p => p.pd).map(p => p.pd))]; }
function progressoPD(n) {
  const pd = PDS.find(p => p.n === n);
  const itens = [...pd.criterios.map((_, i) => 'pd' + n + '-' + i), ...extrasPD(n, S.caso, perfil()).map((_, i) => 'pd' + n + '-x' + i)];
  const feitos = itens.filter(k => S.checks[k]).length;
  return { feitos, total: itens.length };
}

// ----------------------------------------------------------- 1. O CASO
function radios(nome, lista, val, cols) {
  return `<div class="opts${cols ? ' cols' : ''}">${lista.map(o => `
    <label class="opt"><input type="radio" name="${nome}" value="${o[0]}" data-f="${nome}" ${String(val) === String(o[0]) && respondido(nome) ? 'checked' : ''}>
    <span><b>${esc(o[1])}</b>${o[2] && typeof o[2] === 'string' && !NIVEIS.includes(o[2]) ? `<small>${esc(o[2])}</small>` : ''}</span></label>`).join('')}</div>`;
}
function chips(nome, lista, vals) {
  return `<div class="chips">${lista.map(o => `<label class="chip"><input type="checkbox" data-fm="${nome}" value="${o[0]}" ${(vals || []).includes(o[0]) && respondido(nome) ? 'checked' : ''}><span>${esc(o[1])}</span></label>`).join('')}</div>`;
}
function renderCaso() {
  const c = S.caso;
  const ia = CAP.sample ? `
    <div class="ai" id="ia-box">
      <div class="row" style="justify-content:space-between"><div><b>Estruturar a descrição com Claude</b><div class="small muted">Lê o problema e o resultado descritos acima, sugere respostas para as perguntas abaixo e aponta lacunas. Você revisa antes de aplicar.</div></div>
      <button class="btn pri" type="button" data-act="ia" ${IA.estado === 'rodando' ? 'disabled' : ''}>${IA.estado === 'rodando' ? 'Analisando…' : 'Analisar descrição'}</button></div>
      <div id="ia-out">${renderIA()}</div>
    </div>` : '';
  return `
  <div class="sec-head"><div><div class="eyebrow">Passo 1</div><h2>Descreva o caso</h2>
    <p>As respostas definem o perfil de risco, o percurso, as verificações e as premissas de custo. Comece pela situação e pelo problema, sem mencionar a tecnologia.</p></div>
    <button class="btn" type="button" data-act="limpar">Começar um caso em branco</button></div>

  ${['A', 'B', 'C', 'D'].includes(S.exemplo) ? `<div class="alert info"><span class="ic">Exemplo</span><span>Você está vendo um caso ilustrativo do guia (${esc(CASOS[S.exemplo].titulo.toLowerCase())}), com respostas fictícias. Edite as respostas ou comece um caso em branco.</span><span></span></div>` : ''}
  <section class="card blk"><header><span class="k">A</span><h3>Situação</h3></header>
    <div class="q"><label for="f-titulo">Nome do caso</label><input id="f-titulo" type="text" data-f="titulo" value="${esc(c.titulo)}" placeholder="Ex.: assistente para solicitações das escolas"></div>
    <div class="q"><span class="lbl">Em que ponto você está?</span>${radios('situacao', OPC.situacao, c.situacao, true)}</div>
  </section>

  <section class="card blk"><header><span class="k">B</span><h3>O problema</h3></header>
    <div class="q"><label for="f-problema">Qual é o problema público ou educacional?</label>
      <div class="hint">Descreva a situação atual, quem é afetado e o que se sabe sobre as causas. Se, ao retirar a palavra "IA", o texto deixa de explicar o problema, reescreva.</div>
      <textarea id="f-problema" data-f="problema" rows="4">${esc(c.problema)}</textarea></div>
    <div class="q"><label for="f-resultado">Que resultado se espera, sem citar tecnologia?</label><textarea id="f-resultado" data-f="resultado" rows="2">${esc(c.resultado)}</textarea></div>
    <div class="grid2">
      <div class="q"><label for="f-pop">População afetada</label><input id="f-pop" type="text" data-f="populacao" value="${esc(c.populacao)}"></div>
      <div class="q"><span class="lbl">Existe linha de base medida?</span>${radios('linhaBase', OPC.linhaBase, c.linhaBase)}</div>
    </div>
    <label class="check"><input type="checkbox" data-fb="alternativaSemIA" ${c.alternativaSemIA ? 'checked' : ''}><span>Já comparamos ao menos uma alternativa sem IA (redesenho de processo, software convencional ou não intervir).</span></label>
    <div class="q"><span class="lbl">Quais funções que não podem ser terceirizadas já têm responsável interno?</span>${chips('capacidade', OPC.capacidade, c.capacidade)}</div>
    ${ia}
  </section>

  <section class="card blk"><header><span class="k">C</span><h3>O caso de uso</h3></header>
    <div class="q"><span class="lbl">O que a IA faz? (uma ou mais classes)</span>${chips('classes', OPC.classes, c.classes)}</div>
    <div class="q"><span class="lbl">Grau de autonomia</span><div class="hint">Mais autonomia não significa mais maturidade.</div>${radios('autonomia', OPC.autonomia, c.autonomia, true)}</div>
    <div class="grid2">
      <div class="q"><span class="lbl">Quem usa o sistema</span>${chips('usuarios', OPC.usuarios, c.usuarios)}</div>
      <div class="q"><span class="lbl">Quem é afetado pelas saídas</span>${chips('afetados', OPC.afetados, c.afetados)}</div>
    </div>
    <label class="check"><input type="checkbox" data-fb="vulneraveis" ${c.vulneraveis ? 'checked' : ''}><span>Há pessoas com menor capacidade de perceber e contestar erros (deficiência, idioma, dependência do serviço).</span></label>
    <label class="check"><input type="checkbox" data-fb="idiomas" ${c.idiomas ? 'checked' : ''}><span>O sistema atende mais de um idioma ou variedade linguística.</span></label>
    <div class="q"><span class="lbl">Em que entra a saída do sistema?</span>${chips('consequencias', OPC.consequencias, c.consequencias)}</div>
  </section>

  <section class="card blk"><header><span class="k">D</span><h3>Dados</h3></header>
    <div class="q"><span class="lbl">Que dados são usados ou inferidos?</span>${chips('dados', OPC.dados, c.dados)}</div>
    <div class="q"><span class="lbl">O fornecedor pode usar os dados para treinar ou melhorar modelos?</span>${radios('treino', [['nao', 'Não, está vedado por contrato'], ['sim', 'Sim, ou depende de configuração'], ['nao_sei', 'Não sabemos']], c.treino, true)}</div>
  </section>

  <section class="card blk"><header><span class="k">E</span><h3>Escala, correção e contestação</h3></header>
    <div class="grid2">
      <div class="q"><label for="f-eleg">Pessoas elegíveis para usar o sistema</label><input id="f-eleg" type="number" min="1" step="1" data-f="elegiveis" value="${esc(c.elegiveis)}"><div class="hint">Base da estimativa de custo.</div></div>
      <div class="q"><label for="f-alc">Pessoas alcançadas pelas saídas, se diferente</label><input id="f-alc" type="number" min="0" step="1" data-f="alcance" value="${esc(c.alcance)}"><div class="hint">Ex.: estudantes classificados por um sistema usado só por gestores.</div></div>
    </div>
    <div class="q"><span class="lbl">Frequência de uso</span>${radios('frequencia', OPC.frequencia, c.frequencia, true)}</div>
    <div class="q"><span class="lbl">Se a saída estiver errada…</span>${radios('reversibilidade', OPC.reversibilidade, c.reversibilidade)}</div>
    <div class="grid2">
      <div class="q"><span class="lbl">A instituição consegue verificar como as saídas são produzidas?</span>${radios('verificabilidade', OPC.verificabilidade, c.verificabilidade)}</div>
      <div class="q"><span class="lbl">Quem é afetado pode contestar?</span>${radios('contestacao', OPC.contestacao, c.contestacao)}</div>
    </div>
    <div class="q"><span class="lbl">Os efeitos se acumulam sobre o mesmo grupo?</span>${radios('cumulativo', OPC.cumulativo, c.cumulativo, true)}</div>
  </section>

  <section class="card blk"><header><span class="k">F</span><h3>Solução e próximo passo</h3></header>
    <div class="q"><span class="lbl">Arquitetura pretendida ou proposta</span>${radios('arquitetura', OPC.arquitetura, c.arquitetura, true)}</div>
    <label class="check"><input type="checkbox" data-fb="pilotoGratuito" ${c.pilotoGratuito ? 'checked' : ''}><span>Há oferta de piloto ou período gratuito.</span></label>
    <div class="q"><label for="f-degrau">Que decisão se pretende tomar a seguir?</label>
      <select class="f" id="f-degrau" data-f="degrau">${OPC.degrau.map(d => `<option value="${d[0]}" ${+c.degrau === d[0] ? 'selected' : ''}>${d[0]}. ${d[1]}</option>`).join('')}</select></div>
  </section>
  <div class="row"><button class="btn pri" type="button" data-tab="diagnostico">Ver o diagnóstico</button></div>`;
}

// ----------------------------------------------------------- IA (sample)
function renderIA() {
  if (IA.estado === 'erro') return `<p class="small" style="color:var(--crit)">${esc(IA.erro)}</p>`;
  if (!IA.resposta) return '';
  const r = IA.resposta;
  const lac = (r.lacunas || []).map(x => `<li>${esc(x)}</li>`).join('');
  return `<div class="grid2">
      <div class="q"><span class="lbl">Problema reescrito sem tecnologia</span><p>${esc(r.problemaReformulado || '')}</p></div>
      <div class="q"><span class="lbl">Resultado esperado</span><p>${esc(r.resultadoReformulado || '')}</p></div>
    </div>
    ${lac ? `<div class="q"><span class="lbl">Perguntas que a descrição ainda não responde</span><ul class="small" style="margin:0;padding-left:18px">${lac}</ul></div>` : ''}
    <div class="row"><button class="btn pri" type="button" data-act="ia-aplicar">Aplicar sugestões ao formulário</button><button class="btn" type="button" data-act="ia-texto">Usar só o texto reescrito</button>
    <span class="small muted">Sugestões de um modelo. Revise cada resposta antes de decidir.</span></div>`;
}
async function analisarIA() {
  const c = S.caso;
  if (!(c.problema || '').trim()) { toast('Descreva o problema antes de analisar.'); return; }
  IA = { estado: 'rodando', resposta: null, erro: '' };
  render();
  const listas = {
    situacao: OPC.situacao.map(x => x[0]), classes: OPC.classes.map(x => x[0]), autonomia: '1 a 6 (1 informação, 2 sugestão, 3 recomendação, 4 ação sujeita a aprovação, 5 execução dentro de limites, 6 execução encadeada)',
    usuarios: OPC.usuarios.map(x => x[0]), afetados: OPC.afetados.map(x => x[0]), consequencias: OPC.consequencias.map(x => x[0]),
    dados: OPC.dados.map(x => x[0]), frequencia: OPC.frequencia.map(x => x[0]), reversibilidade: OPC.reversibilidade.map(x => x[0]),
    contestacao: OPC.contestacao.map(x => x[0]), cumulativo: OPC.cumulativo.map(x => x[0]), arquitetura: OPC.arquitetura.map(x => x[0]),
  };
  const prompt = `Você apoia gestores públicos de educação a estruturar um caso de uso de inteligência artificial, seguindo um guia de decisão. O guia exige que o problema seja descrito sem mencionar tecnologia e que o risco seja analisado pelo uso, e não pelo produto.

Descrição fornecida pelo gestor:
- Nome do caso: ${c.titulo || '(não informado)'}
- Problema: ${c.problema}
- Resultado esperado: ${c.resultado || '(não informado)'}
- População afetada: ${c.populacao || '(não informada)'}

Responda APENAS com um objeto JSON, escrito em ${({ pt: 'português do Brasil', en: 'inglês', es: 'espanhol', fr: 'francês' })[LANG] || 'português do Brasil'} (os valores permitidos das sugestões ficam exatamente como estão), com estas chaves:
- "problemaReformulado": o problema reescrito sem nenhuma referência a tecnologia, IA, produto ou fornecedor (2 a 4 frases, sem inventar dados que não estejam na descrição);
- "resultadoReformulado": o resultado desejado, mensurável, sem citar tecnologia (1 frase);
- "lacunas": lista de 3 a 6 perguntas objetivas que a descrição ainda não responde e que o gestor precisa responder antes de avançar;
- "sugestoes": objeto com as respostas mais prováveis, usando SOMENTE estes valores permitidos: ${JSON.stringify(listas)}. Chaves: situacao (string), classes (lista), autonomia (número), usuarios (lista), afetados (lista), consequencias (lista), dados (lista), frequencia (string), reversibilidade (string), contestacao (string), cumulativo (string), arquitetura (string), elegiveis (número ou null). Omita uma chave quando a descrição não permitir inferir com razoável segurança.`;
  try {
    const r = await CAP.sample.json(prompt, { modelTier: 'default' });
    IA = { estado: 'ok', resposta: r || {}, erro: '' };
  } catch (e) {
    const msg = { rate_limited: 'Muitas consultas em pouco tempo. Tente novamente em alguns minutos.', not_granted: 'O uso do Claude não foi autorizado nesta página.', invalid_json: 'A resposta veio em formato inesperado. Tente novamente.', refused: 'O Claude não analisou esta descrição. Reformule o texto e tente de novo.' }[e && e.code] || 'Não foi possível analisar agora. Tente novamente.';
    IA = { estado: 'erro', resposta: null, erro: msg };
    if (e && ['not_granted', 'sampling_disabled', 'capability_disabled', 'capability_removed', 'not_declared'].includes(e.code)) CAP.sample = null;
  }
  render();
}
function aplicarIA(soTexto) {
  const r = IA.resposta || {};
  if (r.problemaReformulado) S.caso.problema = r.problemaReformulado;
  if (r.resultadoReformulado) S.caso.resultado = r.resultadoReformulado;
  if (!soTexto && r.sugestoes) {
    const s = r.sugestoes, c = S.caso;
    const okVal = (k, v) => (OPC[k] || []).some(o => String(o[0]) === String(v));
    ['situacao', 'frequencia', 'reversibilidade', 'contestacao', 'cumulativo', 'arquitetura'].forEach(k => { if (s[k] != null && okVal(k, s[k])) c[k] = s[k]; });
    ['classes', 'usuarios', 'afetados', 'consequencias', 'dados'].forEach(k => { if (Array.isArray(s[k])) { const v = s[k].filter(x => okVal(k, x)); if (v.length) c[k] = v; } });
    if (+s.autonomia >= 1 && +s.autonomia <= 6) c.autonomia = +s.autonomia;
    if (+s.elegiveis > 0) c.elegiveis = Math.round(+s.elegiveis);
  }
  S.custo.editado = false;
  toast(soTexto ? 'Texto reescrito aplicado.' : 'Sugestões aplicadas. Revise as respostas.');
  render();
}

// ----------------------------------------------------------- 2. DIAGNÓSTICO
function renderDiag() {
  const c = S.caso, p = perfil();
  const al = alertas(c, p);
  const ax = anexoIII(c);
  const forma = FORMAS_SUP[formaSupervisao(c, p)];
  const dims = DIMENSOES.map(([k, nome, perg]) => {
    const det = p.determinantes.includes(k);
    const aj = (c.ajustes || {})[k] || {};
    return `<div class="dim${det ? ' det' : ''}">
      <div class="nm"><b>${nome}</b><small>${esc(perg)}</small></div>
      <div><select class="f" data-aj="${k}" aria-label="Nível de ${nome}">${NIVEIS.map(n => `<option value="${n}" ${p.P[k] === n ? 'selected' : ''}>${NIVEL_NOME[n]}</option>`).join('')}</select>
        <div style="margin-top:6px">${pill(p.P[k])}</div></div>
      <div class="why">${esc(p.J[k])}${p.origem[k] ? ` <span class="tag gold">ajuste manual</span>` : ''}
        ${p.P[k] !== p.auto[k] || aj.nivel ? `<input type="text" data-ajm="${k}" placeholder="Justificativa do ajuste (sugestão automática: ${NIVEL_NOME[p.auto[k]]})" value="${esc(aj.motivo || '')}">` : ''}</div>
    </div>`;
  }).join('');
  const det = p.determinantes.map(k => DIMENSOES.find(d => d[0] === k)[1].toLowerCase()).join(', ');
  return `
  <div class="sec-head"><div><div class="eyebrow">Passo 2 · Caps. 5 e 6</div><h2>Diagnóstico do caso</h2>
    <p>O perfil tem dez dimensões, cada uma classificada e justificada. Não há média: o nível de diligência é definido pela dimensão mais grave, salvo justificativa documentada.</p></div></div>

  <section class="card nivel-card">
    <div class="nivel-big n-${p.agregado}">${NIVEL_NOME[p.agregado]}</div>
    <div style="display:grid;gap:6px">
      <b>Nível de diligência do caso de uso</b>
      <p>${esc(NIVEL_CRIT[p.agregado])}</p>
      <p class="small muted">Determinado por: ${esc(det)}. ${p.alto ? 'As etapas seguintes usam a coluna "elevado ou crítico" da tabela de diligência.' : 'As etapas seguintes usam a coluna "limitado ou moderado" da tabela de diligência.'}</p>
    </div>
  </section>

  ${al.length ? `<section class="card" style="display:grid;gap:8px"><h3>Sinais de alerta</h3>${al.map(a => `<div class="alert ${a.nivel}"><span class="ic">${{ bloqueio: 'Bloqueio', atencao: 'Atenção', info: 'Nota' }[a.nivel]}</span><span>${esc(a.texto)}</span><span class="cap">Cap. ${a.cap}</span></div>`).join('')}</section>` : ''}

  ${ax.length ? `<div class="alert info"><span class="ic">Norma</span><span>O uso descrito corresponde a categorias que o Regulamento Europeu de IA classifica como de alto risco na educação (Anexo III, ponto 3): ${esc(ax.join('; '))}. Com a alteração de 2026, essas obrigações se aplicam a partir de dezembro de 2027. A classificação deste navegador é um instrumento de governança, não uma classificação jurídica: verifique a legislação da sua jurisdição.</span><span class="cap">Cap. 5</span></div>` : ''}

  <section class="card"><h3 style="margin-bottom:6px">Perfil de risco por dimensão</h3>
    <p class="small muted" style="margin-bottom:8px">Sugestão automática a partir das respostas. Ajuste qualquer dimensão e registre o motivo: discordâncias entre as áreas técnica, pedagógica e jurídica devem ficar visíveis.</p>
    <div class="dims">${dims}</div></section>

  <section style="display:grid;gap:8px"><h3>Como o perfil modula as etapas seguintes</h3>
    <div class="tw"><table><thead><tr><th>Etapa</th><th>Limitado ou moderado</th><th>Elevado ou crítico</th></tr></thead><tbody>
    ${DILIGENCIA.map(d => `<tr><td><b>${d[0]}</b><br><span class="small muted">${d[1]}</span></td><td class="${p.alto ? '' : 'hl'}">${esc(d[2])}</td><td class="${p.alto ? 'hl' : ''}">${esc(d[3])}</td></tr>`).join('')}
    </tbody></table></div></section>

  <section class="card" style="display:grid;gap:8px"><h3>Supervisão humana indicada</h3>
    <p><b>${forma[0]}.</b> ${esc(forma[1])}</p>
    <p class="note">A supervisão só é significativa quando informação, competência, tempo, autoridade, independência prática e capacidade de intervir estão presentes ao mesmo tempo, testadas no volume real (Cap. 17).</p>
  </section>
  <div class="row"><button class="btn pri" type="button" data-tab="percurso">Ver o percurso</button></div>`;
}

// ----------------------------------------------------------- 3. PERCURSO
function cardPD(n, aberto) {
  const pd = PDS.find(p => p.n === n), c = S.caso, p = perfil();
  const extras = extrasPD(n, c, p);
  const pr = progressoPD(n);
  const instr = pd.instr ? pd.instr.split(', ').map(x => `<span class="tag">Instr. ${x}</span> ${esc(INSTRUMENTOS[x])}`).join(' · ') : '';
  const ab = (S.pdAberto || {})[n]; const open = ab == null ? aberto : ab;
  return `<details class="pdcard" data-pd="${n}" ${open ? 'open' : ''}>
    <summary><span class="pdnum">${n}</span><span class="pdt"><b>${esc(pd.titulo)}</b><small>Ponto de decisão ${n} · Cap. ${pd.cap}</small></span><span class="pdprog num">${pr.feitos}/${pr.total}<div class="bar" style="margin-top:4px"><i style="width:${100 * pr.feitos / pr.total}%"></i></div></span></summary>
    <div class="pdbody">
      <p class="perg">${esc(pd.pergunta)}</p>
      <div><div class="eyebrow" style="margin-bottom:6px">Avance quando houver</div>
      <ul class="clist">${pd.criterios.map((t, i) => `<li><label><input type="checkbox" data-chk="pd${n}-${i}" ${S.checks['pd' + n + '-' + i] ? 'checked' : ''}><span>${esc(t)}</span></label></li>`).join('')}
      ${extras.map((t, i) => `<li class="extra"><label><input type="checkbox" data-chk="pd${n}-x${i}" ${S.checks['pd' + n + '-x' + i] ? 'checked' : ''}><span>${esc(t)}<span class="tag gold">para este caso</span></span></label></li>`).join('')}</ul></div>
      <div class="senao"><b>Se não.</b> ${esc(pd.seNao)}</div>
      <div class="meta"><span>Produz: ${pd.docs.map(d => `<span class="tag">${d}</span>`).join(' ')}</span>${instr ? `<span>Use: ${instr}</span>` : ''}</div>
    </div></details>`;
}
function renderPercurso() {
  const r = rota(), c = S.caso;
  const pds = pdsDaRota();
  const anteriores = PDS.filter(pd => pd.n < Math.min(...pds) && !pds.includes(pd.n));
  const instrs = instrumentosCaso(c, perfil());
  const passos = r.passos.map(st => `
    <div class="step${st.pd ? ' pd' : ''}"><div class="dot">${st.pd ? 'PD' + st.pd : st.cap}</div>
      <div class="body"><b>${st.pd ? 'Cap. ' + st.cap + ' · ' : 'Cap. ' + st.cap + ' · '}${esc(CAPITULOS[st.cap])}</b><span>${esc(st.nota)}</span>
      <span class="meta">${st.pd ? `<span>Ponto de decisão ${st.pd}</span>` : ''}${st.instr ? `<span>Instrumento ${st.instr}: ${esc(INSTRUMENTOS[st.instr])}</span>` : ''}${st.docs ? `<span>Produz ${st.docs.join(', ')}</span>` : ''}</span></div></div>`).join('');
  return `
  <div class="sec-head"><div><div class="eyebrow">Passo 3 · ${esc((OPC.situacao.find(s => s[0] === c.situacao) || ['', ''])[1])}</div><h2>O percurso para este caso</h2>
    <p>${esc(r.resumo)}</p></div></div>
  <section class="card"><div class="steps">${passos}</div></section>
  ${anteriores.length ? `<section class="card" style="display:grid;gap:8px"><h3>Condições das etapas anteriores</h3>
    <p class="small muted">Uma contratação ou operação em curso não dispensa a revisão do problema, do risco, dos dados, da evidência ou da capacidade. Confira estas perguntas antes de seguir.</p>
    <ul class="clist">${anteriores.map(pd => `<li><label><input type="checkbox" data-chk="ret${pd.n}" ${S.checks['ret' + pd.n] ? 'checked' : ''}><span><b>Ponto ${pd.n}.</b> ${esc(pd.pergunta)}</span></label></li>`).join('')}</ul></section>` : ''}
  <section style="display:grid;gap:10px"><h3>Pontos de decisão deste percurso</h3>
    ${pds.map((n, i) => cardPD(n, i === 0)).join('')}</section>
  <section class="card" style="display:grid;gap:8px"><h3>Instrumentos a preencher agora</h3>
    <div class="opts cols">${instrs.map(x => `<div class="opt" style="cursor:default"><span class="tag">${x}</span><span><b>${esc(INSTRUMENTOS[x])}</b><small>Guia completo, Instrumento ${x}</small></span></div>`).join('')}</div></section>
  <section style="display:grid;gap:8px"><h3>Dossiê de decisão</h3>
    <div class="tw"><table><thead><tr><th>Doc.</th><th>Conteúdo</th><th>Cap.</th><th>Instr.</th><th>Pronto</th></tr></thead><tbody>
    ${DOSSIE.map(d => `<tr><td><b>${d[0]}</b></td><td>${esc(d[1])}</td><td class="num">${d[2]}</td><td>${d[3]}</td><td><input type="checkbox" aria-label="${d[0]} pronto" data-chk="dos-${d[0]}" ${S.checks['dos-' + d[0]] ? 'checked' : ''}></td></tr>`).join('')}
    </tbody></table></div></section>`;
}

// ----------------------------------------------------------- 4. VERIFICAÇÕES
function lista(prefixo, itens) {
  return `<ul class="clist">${itens.map((t, i) => `<li${t.extra ? ' class="extra"' : ''}><label><input type="checkbox" data-chk="${prefixo}-${t.k || i}" ${S.checks[prefixo + '-' + (t.k || i)] ? 'checked' : ''}><span>${t.h ? `<b>${esc(t.h)}.</b> ` : ''}${esc(t.t)}${t.tag ? ` <span class="tag gold">${esc(t.tag)}</span>` : ''}</span></label></li>`).join('')}</ul>`;
}
function renderListas() {
  const c = S.caso, p = perfil();
  const usaRag = c.arquitetura === 'api';
  const afetaPessoas = (c.consequencias || []).some(k => k !== 'nenhuma');
  const subs = [['dados', 'Dados'], ['contrato', 'Contrato'], ['mudanca', 'Mudança'], ['supervisao', 'Supervisão'], ['contestacao', 'Contestação'], ['monitoramento', 'Monitoramento'], ['incidentes', 'Incidentes'], ['saida', 'Saída']];
  if (!subs.some(s => s[0] === S.sub)) S.sub = 'dados';
  let corpo = '';
  if (S.sub === 'dados') {
    const it = DADOS_REQ.map(d => ({ k: d[0], h: d[1], t: d[2], tag: (d[0] === 'treino' && c.treino !== 'nao') ? 'prioridade' : (d[0] === 'rag' && usaRag) ? 'RAG neste caso' : '' }));
    corpo = `<p class="muted">O mapa de fluxo de dados só cumpre sua função quando vira requisito técnico e contratual. Identifique estas questões antes da integração (Cap. 7, D7).</p>${lista('dad', it)}`;
  } else if (S.sub === 'contrato') {
    const it = CONTRATO.filter(x => !x[2] || (x[2] === 'alto' && p.alto) || (x[2] === 'pessoas' && afetaPessoas) || (x[2] === 'consumo' && c.arquitetura !== 'saas'))
      .map((x, i) => ({ k: 'c' + CONTRATO.indexOf(x), h: x[0], t: x[1], tag: x[2] === 'alto' ? 'risco elevado' : x[2] === 'consumo' ? 'cobrança por consumo' : x[2] === 'pessoas' ? 'afeta pessoas' : '' }));
    corpo = `<p class="muted">Checklist do Instrumento F. Itens marcados com etiqueta foram incluídos por causa das respostas deste caso (Cap. 16).</p>${lista('ctr', it)}`;
  } else if (S.sub === 'mudanca') {
    corpo = `<p class="muted">O sistema muda depois da assinatura. A evidência pertence à configuração avaliada, e o contrato gradua a mudança em cinco níveis. Notificar não é aprovar (Caps. 9 e 16).</p>
      <div class="tw"><table><thead><tr><th>Nível</th><th>Quando se aplica</th><th>Exemplo</th></tr></thead><tbody>${MUDANCA.map(m => `<tr><td><b>${m[0]}</b></td><td>${esc(m[1])}</td><td>${esc(m[2])}</td></tr>`).join('')}</tbody></table></div>
      <h3>Gatilhos de reavaliação</h3>${lista('gat', ['Troca de modelo ou de versão do modelo', 'Mudança na base de conhecimento', 'Nova população ou idioma', 'Aumento relevante de escala', 'Mais autonomia', 'Nova finalidade', 'Incidentes que contradizem a evidência anterior'].map(t => ({ t })))}`;
  } else if (S.sub === 'supervisao') {
    const f = FORMAS_SUP[formaSupervisao(c, p)];
    corpo = `<p class="muted">A ausência de qualquer condição transforma a supervisão em formalidade. Teste as condições na implementação, no volume previsto após a expansão (Cap. 17).</p>
      ${lista('sup', SUPERVISAO.map(s => ({ h: s[0], t: s[1] })))}
      <div class="note"><b>Forma indicada para este caso:</b> ${esc(f[0])}. ${esc(f[1])}</div>`;
  } else if (S.sub === 'contestacao') {
    corpo = `${afetaPessoas ? '' : '<div class="alert info"><span class="ic">Nota</span><span>As respostas indicam que a saída não decide sobre pessoas. Confirme: uma saída formalmente opcional pode pesar na decisão.</span><span></span></div>'}
      <p class="muted">Um mecanismo efetivo reúne seis elementos. Corrigir o sistema não é reparar a consequência: remediar pode exigir corrigir registros, repetir avaliações e comunicar as pessoas afetadas (Cap. 6).</p>${lista('con', CONTESTACAO.map(s => ({ h: s[0], t: s[1] })))}`;
  } else if (S.sub === 'monitoramento') {
    corpo = `<p class="muted">Cada métrica material tem condição observada, medida, responsável, gatilho e resposta. Uma métrica sem gatilho não é controle só por estar em um painel (Cap. 18). Ritmo ajustado ao perfil ${NIVEL_NOME[p.agregado].toLowerCase()}.</p>
      <div class="tw"><table><thead><tr><th>Família</th><th>O que observar</th><th>Ritmo</th><th>Responsável e gatilho definidos</th></tr></thead><tbody>
      ${METRICAS.map((m, i) => `<tr><td><b>${m[0]}</b></td><td>${esc(m[1])}</td><td>${esc(p.alto ? m[3] : m[2])}</td><td><input type="checkbox" aria-label="${m[0]} definido" data-chk="mon-${i}" ${S.checks['mon-' + i] ? 'checked' : ''}></td></tr>`).join('')}</tbody></table></div>`;
  } else if (S.sub === 'incidentes') {
    corpo = `<p class="muted">Quem pode restringir, quem pode suspender e quem autoriza a retomada devem estar definidos antes da crise (Cap. 18).</p>
      <div class="tw"><table><thead><tr><th>Nível</th><th>Critério</th><th>Resposta e prazo de referência</th></tr></thead><tbody>${SEVERIDADE.map(s => `<tr><td><b>${s[0]}</b></td><td>${esc(s[1])}</td><td>${esc(s[2])}</td></tr>`).join('')}</tbody></table></div>
      <h3>Autoridade definida</h3>${lista('inc', [{ t: 'Quem pode restringir população, função ou autonomia' }, { t: 'Quem pode suspender o caso de uso' }, { t: 'Quem autoriza a retomada' }, { t: 'Processo alternativo durante a suspensão' }, { t: 'Canal de comunicação às pessoas afetadas' }])}`;
  } else if (S.sub === 'saida') {
    const it = PACOTE.filter(x => !x[2] || (x[2] === 'rag' && usaRag)).map(x => ({ h: x[0], t: x[1] }));
    corpo = `<p class="muted">A saída se prepara na entrada. Classifique cada ativo como necessário, conveniente ou reconstruível, teste a exportação durante a vigência e produza a transferência de conhecimento ao longo da operação (Cap. 10, Instr. I).</p>
      ${lista('sai', it)}
      <h3>Formas de lock-in a observar nesta arquitetura</h3><ul style="margin:0;padding-left:18px">${(LOCKIN[c.arquitetura] || LOCKIN.indefinida).map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
  }
  return `
  <div class="sec-head"><div><div class="eyebrow">Passo 4</div><h2>Verificações para este caso</h2>
    <p>Listas do guia filtradas pelas respostas. Marque o que já está resolvido; o progresso fica salvo neste navegador.</p></div></div>
  <div class="subtabs" role="group" aria-label="Listas">${subs.map(s => `<button type="button" data-sub="${s[0]}" aria-pressed="${S.sub === s[0]}">${s[1]}</button>`).join('')}</div>
  <section class="card" style="display:grid;gap:12px">${corpo}</section>`;
}

// ----------------------------------------------------------- 6. RELATÓRIO
function dadosRelatorio() {
  const c = S.caso, p = perfil(), al = alertas(c, p), r = rota();
  const sit = (OPC.situacao.find(s => s[0] === c.situacao) || ['', ''])[1];
  const nomes = (k, vs) => (vs || []).map(v => tr((OPC[k].find(o => o[0] === v) || [v, v])[1])).join('; ') || tr('não informado');
  const secs = [];
  const fl = secoesFluxo();
  secs.push(fl.shift());
  secs.push({ h: 'Caso', kv: [['Nome', c.titulo || tr('Caso sem título')], ['Situação', sit], ['Problema', c.problema], ['Resultado esperado', c.resultado], ['População afetada', c.populacao],
    ['Linha de base', (OPC.linhaBase.find(x => x[0] === c.linhaBase) || ['', ''])[1]], ['Classes de uso', nomes('classes', c.classes)],
    ['Autonomia', c.autonomia + '. ' + tr((OPC.autonomia.find(a => a[0] === c.autonomia) || ['', ''])[1])], ['Usuários', nomes('usuarios', c.usuarios)], ['Afetados', nomes('afetados', c.afetados)],
    ['A saída entra em', nomes('consequencias', c.consequencias)], ['Dados', nomes('dados', c.dados)], ['Pessoas elegíveis', fmtInt(c.elegiveis)], ['Pessoas alcançadas', fmtInt(Math.max(+c.elegiveis || 0, +c.alcance || 0))],
    ['Arquitetura', (OPC.arquitetura.find(x => x[0] === c.arquitetura) || ['', ''])[1]]] });
  secs.push(...fl);
  secs.push({ h: 'Perfil de risco', p: [tr('Nível de diligência:') + ' ' + tr(NIVEL_NOME[p.agregado]) + '. ' + tr(NIVEL_CRIT[p.agregado]), 'Regra de agregação: a dimensão mais grave define o nível, sem médias.'],
    table: { head: ['Dimensão', 'Nível', 'Justificativa'], rows: DIMENSOES.map(([k, n]) => [n, tr(NIVEL_NOME[p.P[k]]) + (p.origem[k] ? ' (' + tr('ajuste manual') + ')' : ''), p.J[k]]) } });
  if (anexoIII(c).length) secs.push({ h: 'Nota normativa', p: ['O uso descrito corresponde a categorias que o Regulamento Europeu de IA classifica como de alto risco na educação (Anexo III, ponto 3):', anexoIII(c).map(tr).join('; ') + '.', 'Obrigações aplicáveis a partir de dezembro de 2027. Verifique a legislação da jurisdição aplicável.'] });
  const ROT_AL = { bloqueio: 'Bloqueio', atencao: 'Atenção', info: 'Nota' };
  if (al.length) secs.push({ h: 'Sinais de alerta', list: al.map(a => tr(ROT_AL[a.nivel]) + ': ' + tr(a.texto) + ' (' + tr('Cap. ' + a.cap) + ')') });
  secs.push({ h: 'Percurso recomendado', p: [r.resumo], list: r.passos.map(st => tr('Cap. ' + st.cap) + ', ' + tr(CAPITULOS[st.cap]) + (st.pd ? ' · ' + tr('Ponto de decisão ' + st.pd) : '') + (st.instr ? ' · ' + tr('Instrumento ' + st.instr) : '') + '. ' + tr(st.nota)) });
  pdsDaRota().forEach(n => {
    const pd = PDS.find(x => x.n === n); const ex = extrasPD(n, c, p);
    secs.push({ h: tr('Ponto de decisão ' + n) + '. ' + tr(pd.titulo), p: [pd.pergunta],
      list: [...pd.criterios.map((t, i) => (S.checks['pd' + n + '-' + i] ? '[x] ' : '[ ] ') + t), ...ex.map((t, i) => (S.checks['pd' + n + '-x' + i] ? '[x] ' : '[ ] ') + tr(t) + ' (' + tr('para este caso') + ')')],
      pos: [tr('Se não:') + ' ' + tr(pd.seNao)] });
  });
  secs.push({ h: 'Diligência proporcional', table: { head: ['Etapa', p.alto ? 'Elevado ou crítico' : 'Limitado ou moderado'], rows: DILIGENCIA.map(d => [d[0], p.alto ? d[3] : d[2]]) } });
  secs.push({ h: 'Instrumentos a preencher', list: instrumentosCaso(c, p).map(x => tr('Instrumento ' + x) + ': ' + tr(INSTRUMENTOS[x])) });
  secs.push(secaoCustoRelatorio());
  return secs;
}
function relHTML(secs, completo) {
  secs = trFundo(secs);
  const e = esc;
  const body = secs.map(s => `<h3>${e(s.h)}</h3>
    ${(s.kv || []).length ? `<div class="tw"><table><tbody>${s.kv.map(([k, v]) => `<tr><th style="width:28%">${e(k)}</th><td>${e(v)}</td></tr>`).join('')}</tbody></table></div>` : ''}
    ${(s.p || []).map(x => `<p>${e(x)}</p>`).join('')}
    ${(s.list || []).length ? `<ul>${s.list.map(x => `<li>${e(x)}</li>`).join('')}</ul>` : ''}
    ${s.table ? `<div class="tw"><table><thead><tr>${s.table.head.map(h => `<th>${e(h)}</th>`).join('')}</tr></thead><tbody>${s.table.rows.map(r => `<tr>${r.map(x => `<td>${e(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}
    ${(s.pos || []).map(x => `<p class="note">${e(x)}</p>`).join('')}`).join('');
  if (!completo) return body;
  return `<!doctype html><html lang="${LOC()}"><head><meta charset="utf-8"><title>${e(S.caso.titulo || tr('Relatório do caso'))}</title>
  <style>body{font:15px/1.5 Georgia,serif;max-width:860px;margin:32px auto;padding:0 20px;color:#17212B}h1,h3{color:#0C2D4D;font-family:Arial,sans-serif}table{border-collapse:collapse;width:100%;font:13px Arial,sans-serif;margin:6px 0}th,td{border:1px solid #DDE3E9;padding:5px 8px;text-align:left;vertical-align:top}th{background:#EEF3F8}.note{color:#586674;border-left:3px solid #C3CDD7;padding-left:10px}</style></head>
  <body><h1>${e(S.caso.titulo || tr('Relatório do caso'))}</h1><p>${e(NOME_FERRAMENTA + ' · ' + tr('Gerado em') + ' ' + new Date().toLocaleDateString(LOC()) + '. ' + tr('Documento de trabalho baseado no guia; valores ilustrativos.'))}</p><p>${e(tr(TXT_VINCULO))}</p><p><small>${e(tr(TXT_ISENCAO))}</small></p>${body}</body></html>`;
}
function relMD(secs) {
  secs = trFundo(secs);
  const L = ['# ' + (S.caso.titulo || tr('Relatório do caso')), '', '_' + NOME_FERRAMENTA + ' · ' + tr('Gerado em') + ' ' + new Date().toLocaleDateString(LOC()) + '. ' + tr('Documento de trabalho baseado no guia; valores ilustrativos.') + '_', '', tr(TXT_VINCULO), '', '_' + tr(TXT_ISENCAO) + '_', ''];
  secs.forEach(s => {
    L.push('## ' + s.h, '');
    (s.kv || []).forEach(([k, v]) => L.push('- **' + k + ':** ' + (v || '')));
    if ((s.kv || []).length) L.push('');
    (s.p || []).forEach(x => L.push(x, ''));
    (s.list || []).forEach(x => L.push('- ' + x.replace(/^\[x\] /, '[x] ').replace(/^\[ \] /, '[ ] ')));
    if ((s.list || []).length) L.push('');
    if (s.table) { L.push('| ' + s.table.head.join(' | ') + ' |', '|' + s.table.head.map(() => '---').join('|') + '|'); s.table.rows.forEach(r => L.push('| ' + r.map(x => String(x).replace(/\|/g, '/')).join(' | ') + ' |')); L.push(''); }
    (s.pos || []).forEach(x => L.push('> ' + x, ''));
  });
  return L.join('\n');
}
function renderRelatorio() {
  const secs = dadosRelatorio();
  const dl = CAP.downloads ? `<button class="btn pri" type="button" data-act="dl-md">Baixar .md</button><button class="btn" type="button" data-act="dl-html">Baixar .html</button><button class="btn" type="button" data-act="dl-csv">Baixar custos .csv</button>` : '';
  return `<div class="sec-head"><div><div class="eyebrow">Passo 6</div><h2>Relatório do caso</h2>
    <p>Resumo para levar à equipe ou anexar ao dossiê: perfil de risco, alertas, percurso com o estado de cada critério, diligência e custo.</p></div>
    <div class="row">${dl}<button class="btn" type="button" data-act="copiar">Copiar texto</button></div></div>
  <section class="card report">${relHTML(secs, false)}</section>`;
}
async function baixar(nome, dados) {
  if (!CAP.downloads) return;
  try { await CAP.downloads.save({ filename: nome, data: dados }); toast('Arquivo enviado para download.'); }
  catch (e) { if (e && e.code !== 'declined') toast('Não foi possível baixar agora.'); }
}

// ----------------------------------------------------------- caminhos e eventos
function setPath(obj, path, val) {
  const ks = path.split('.'); let o = obj;
  for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null) o[ks[i]] = {}; o = o[ks[i]]; }
  o[ks[ks.length - 1]] = val;
}
function editarCfg() {
  if (S.custo.base === 'caso') S.custo.editado = true;
}
function textosExemplo() {
  const k = S.exemplo; if (!CASOS[k]) return;
  ['titulo', 'problema', 'resultado', 'populacao'].forEach(f => { if (CASOS[k][f]) S.caso[f] = tr(CASOS[k][f]); });
  const cx = CTX_EX[k]; if (cx && S.ctx) ['local', 'olhando', 'compOutro'].forEach(f => { if (cx[f]) S.ctx[f] = tr(cx[f]); });
}
function carregarExemplo(k) {
  if (k === 'novo') { S.caso = clone(CASO_VAZIO); S.exemplo = 'novo'; }
  else { S.caso = clone(CASOS[k]); S.exemplo = k; textosExemplo(); }
  aplicarExemploFluxo(k);
  S.checks = {}; S.custo = { base: 'caso', cfg: null, editado: false }; IA = { estado: '', resposta: null, erro: '' };
  render(); window.scrollTo(0, 0);
  toast(k === 'novo' ? 'Caso em branco.' : 'Exemplo carregado. As respostas são ilustrativas.');
}

function ligar() {
  document.addEventListener('click', e => {
    if (custosEvento(e)) return;
    if (eventoFluxo(e)) return;
    const sb = e.target.closest('[data-sub]'); if (sb) { S.sub = sb.dataset.sub; render(); return; }
    const cb = e.target.closest('[data-cbase]');
    if (cb) { S.custo.base = cb.dataset.cbase; S.custo.cfg = null; S.custo.editado = false; render(); return; }
    const a = e.target.closest('[data-act]'); if (!a) return;
    const act = a.dataset.act;
    const cfg = cfgAtual();
    if (act === 'limpar') carregarExemplo('novo');
    else if (act === 'ia') analisarIA();
    else if (act === 'ia-aplicar') aplicarIA(false);
    else if (act === 'ia-texto') aplicarIA(true);
    else if (act === 'ir-prem' || act === 'ir-linhas') { const d = document.querySelector(`details[data-det="${act === 'ir-prem' ? 'prem' : 'linhas'}"]`); if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
    else if (act === 'recalc') { S.custo.editado = false; S.custo.cfg = null; render(); }
    else if (act === 'rm') { const arr = a.dataset.arr.split('.').reduce((o, k) => o[k], cfg); arr.splice(+a.dataset.i, 1); editarCfg(); render(); }
    else if (act === 'add-item') { (cfg.itens = cfg.itens || []).push({ cat: 'Outros', nome: 'Novo item', nat: 'EXT', v: [0, 0, 0, 0] }); editarCfg(); render(); }
    else if (act === 'add-pessoa') { (cfg.pessoas = cfg.pessoas || []).push({ cat: 'Pessoas', nome: 'Nova atividade', nat: 'CAP', partes: [['gestor_produto', [0, 0.1, 0.1, 0.1]]] }); editarCfg(); render(); }
    else if (act === 'add-saida') { cfg.saida = cfg.saida || {}; (cfg.saida.itens = cfg.saida.itens || []).push({ nome: 'Novo custo de saída', valor: 0 }); editarCfg(); render(); }
    else if (act === 'copiar') {
      const txt = relMD(dadosRelatorio());
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => toast('Relatório copiado.'), () => selecionarTexto());
      else selecionarTexto();
    }
    else if (act === 'dl-md') baixar(nomeArq('md'), relMD(dadosRelatorio()));
    else if (act === 'dl-html') baixar(nomeArq('html'), relHTML(dadosRelatorio(), true));
    else if (act === 'dl-csv') baixar(nomeArq('csv').replace('relatorio', 'custos'), csvCustos());
  });
  document.addEventListener('toggle', e => {
    eventoFluxo(e);
    const rl = e.target; if (rl.dataset && rl.dataset.rel != null && rl.open) { const b = rl.querySelector('.report'); if (b && !b.innerHTML) b.innerHTML = relHTML(dadosRelatorio(), false); }
    const d = e.target; if (d.dataset && d.dataset.det === 'prem') S.custo.abrirPrem = d.open;
    if (d.dataset && d.dataset.pd) { S.pdAberto = S.pdAberto || {}; S.pdAberto[d.dataset.pd] = d.open; salvar(); }
  }, true);
  document.addEventListener('input', e => {
    if (eventoFluxo(e)) return;
    const el = e.target;
    if (el.dataset.f && (el.tagName === 'TEXTAREA' || el.type === 'text')) { S.caso[el.dataset.f] = el.value; S.respC[el.dataset.f] = true; if (S.exemplo !== 'novo') S.exemplo = 'editado'; atualizarLaterais(); }
    if (el.dataset.ajm) { S.caso.ajustes = S.caso.ajustes || {}; S.caso.ajustes[el.dataset.ajm] = Object.assign(S.caso.ajustes[el.dataset.ajm] || {}, { motivo: el.value }); salvar(); }
    if (el.dataset.cfgs) { setPath(cfgAtual(), el.dataset.cfgs, el.value); editarCfg(); salvar(); }
  });
  document.addEventListener('change', e => {
    if (custosEvento(e)) return;
    if (eventoFluxo(e)) return;
    const el = e.target;
    if (el.id === 'sel-lang') { S.lang = el.value; NOMES_MOEDA = null; aplicarIdioma(S.lang); textosExemplo(); render(); return; }
    if (el.id === 'sel-exemplo') { if (el.value) carregarExemplo(el.value); el.value = ''; return; }
    if (el.dataset.f && el.type !== 'text' && el.tagName !== 'TEXTAREA') {
      let v = el.value; if (['autonomia', 'degrau', 'elegiveis'].includes(el.dataset.f)) v = +v; if (el.dataset.f === 'alcance') v = v === '' ? '' : +v;
      S.caso[el.dataset.f] = v; S.respC[el.dataset.f] = true; if (S.exemplo !== 'novo') S.exemplo = 'editado'; S.custo.editado = S.custo.editado && el.dataset.f !== 'elegiveis' && el.dataset.f !== 'arquitetura';
      if (['arquitetura', 'treino'].includes(el.dataset.f) || ['2a', '2b'].includes(S.passo)) { render(); return; }
      atualizarLaterais(); return;
    }
    if (el.dataset.fm) {
      const k = el.dataset.fm; const s = new Set(S.caso[k] || []); el.checked ? s.add(el.value) : s.delete(el.value);
      // "nenhuma"/"nenhum" exclui as demais opções, e vice-versa
      const nada = { consequencias: 'nenhuma', dados: 'nenhum' }[k];
      if (nada && el.checked) { if (el.value === nada) s.clear(), s.add(nada); else s.delete(nada); }
      S.caso[k] = [...s]; S.respC[k] = true; if (S.exemplo !== 'novo') S.exemplo = 'editado';
      if (k === 'dados' || k === 'usuarios') { estadoFluxo(); render(); return; }
      if (nada) { document.querySelectorAll(`[data-fm="${k}"]`).forEach(x => { x.checked = S.caso[k].includes(x.value); }); }
      atualizarLaterais(); return;
    }
    if (el.dataset.fb) { S.caso[el.dataset.fb] = el.checked; S.respC[el.dataset.fb] = true; atualizarLaterais(); return; }
    if (el.dataset.chk) { S.checks[el.dataset.chk] = el.checked; render(); return; }
    if (el.dataset.aj) {
      const k = el.dataset.aj; S.caso.ajustes = S.caso.ajustes || {};
      const auto = perfilAutomatico(S.caso).P[k];
      if (el.value === auto) delete S.caso.ajustes[k]; else S.caso.ajustes[k] = Object.assign(S.caso.ajustes[k] || {}, { nivel: el.value });
      render(); return;
    }
    if (el.dataset.cfg) {
      let v = parseFloat(String(el.value).replace(',', '.')); if (isNaN(v)) v = 0;
      if (el.dataset.pct) v = v / 100;
      setPath(cfgAtual(), el.dataset.cfg, v); editarCfg(); renderCustosResultados(); atualizarLaterais(); return;
    }
    if (el.dataset.cfgs) { setPath(cfgAtual(), el.dataset.cfgs, el.value); editarCfg(); renderCustosResultados(); atualizarLaterais(); return; }
    if (el.dataset.moeda) { if (el.dataset.moeda === 'taxa' && el.dataset.mcod !== S.moeda.cod) return; S.moeda[el.dataset.moeda] = el.value; if (el.dataset.moeda === 'cod') { S.moeda.taxa = ''; render(); } else { S.moeda.taxaDe = S.moeda.cod; renderCustosResultados(); atualizarLaterais(); } return; }
  });
}
function nomeArq(ext) {
  const base = (S.caso.titulo || 'caso').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'caso';
  return 'relatorio-' + base + '.' + ext;
}
function selecionarTexto() {
  const r = document.querySelector('.report'); if (!r) return;
  const sel = window.getSelection(), rg = document.createRange(); rg.selectNodeContents(r); sel.removeAllRanges(); sel.addRange(rg);
  toast('Texto selecionado. Use Ctrl+C para copiar.');
}

// ----------------------------------------------------------- início
carregar();
if (!S.lang) S.lang = idiomaInicial();
aplicarIdioma(S.lang);
textosExemplo();
observarIdioma();
montarIdiomas();
ligar();
render();
(async () => {
  if (!window.claude || !window.claude.use) return;
  try { CAP.sample = await window.claude.use('sample'); } catch (e) { CAP.sample = null; }
  try { CAP.downloads = await window.claude.use('downloads'); } catch (e) { CAP.downloads = null; }
  render();
})();
