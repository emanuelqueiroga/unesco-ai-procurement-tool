// =====================================================================
// Resumo e recomendações: decisão, plano de ação e modelo de contratação
// Conteúdo de contratação tirado do guia (caps. 13, 14 e 16; Instrumento F).
// =====================================================================
const NOME_FERRAMENTA = 'AI in Education Procurement Tool';

// Arranjos de aquisição (guia, cap. 14, tabela "Arranjos de aquisição")
const ARRANJOS = [
  ['interno', 'Desenvolver internamente', 'A função é estratégica e específica; há equipe para manter; controle de arquitetura e dados é requisito central.', 'Sustentabilidade: manter, documentar, atualizar e operar no horizonte; dependência de poucas pessoas.', 'Produto, engenharia, arquitetura, segurança, operação.'],
  ['contratar', 'Contratar desenvolvimento', 'Necessidade específica sem capacidade interna para construir.', 'Propriedade dos ativos; quem mantém após a entrega; quem decide a arquitetura; transferência de conhecimento.', 'Gestão de produto, arquitetura, fiscalização.'],
  ['saas', 'SaaS', 'Necessidade padronizada; mercado maduro; prioridade de velocidade; atualização contínua desejável.', 'Customização limitada; mudanças do fornecedor podem invalidar testes; saída complexa se virar componente crítico.', 'Gestão de fornecedor, dados, configuração, monitoramento, saída.'],
  ['api', 'API de modelo ou serviço', 'Separar modelo e aplicação traz flexibilidade útil.', 'A integração e a governança passam para a instituição ou o integrador; consumo variável; versões e preços mudam.', 'Integração, segurança, controle de consumo, testes.'],
  ['parceria', 'Parceria', 'Solução inexistente no mercado; pesquisa; desenvolvimento conjunto.', 'O que cada parte contribui, leva e mantém ao final; propriedade intelectual; continuidade.', 'Governança, coordenação, propriedade de ativos.'],
  ['compartilhada', 'Solução compartilhada', 'Várias instituições com necessidades semelhantes; organizações pequenas.', 'Quem prioriza mudanças, financia a expansão, aceita riscos e arbitra divergências.', 'Governança interinstitucional, financiamento.'],
  ['modular', 'Contratação modular ou por lotes', 'Fronteiras técnicas naturais e mercado real por componente.', 'Quem integra; responsabilidade por falhas entre componentes; esforço de gerir vários contratos.', 'Integração, gestão de múltiplos fornecedores.'],
];
const ARRANJO_ARQ = { saas: ['saas'], api: ['api'], ow: ['interno', 'contratar'] };
const NOTA_ARQ = {
  saas: 'SaaS introduz subprocessadores e concentra infraestrutura e manutenção na licença. Mudanças do fornecedor podem invalidar testes, e a saída fica complexa se a solução virar componente crítico.',
  api: 'Consumir um modelo por API reduz a quantidade de produto adquirido, mas aumenta a quantidade de solução que a instituição precisa integrar e governar. A API expõe a mudanças de versão e de preço e aumenta a variabilidade do custo.',
  ow: 'Código aberto e pesos abertos são características, e não estratégias: podem ser operados pela instituição, por uma empresa contratada ou estar embutidos em um produto comercial. Se toda a operação for contratada com um único integrador, o lock-in apenas muda de lugar.',
};
// Instrumentos de aprendizagem (guia, cap. 14)
const APRENDIZAGEM = [
  ['Prova de conceito', 'A ideia ou o componente é tecnicamente viável nas condições básicas?', 'Escopo mínimo, hipótese clara, critério de encerramento; sem usuários reais nem integrações que criem dependência.'],
  ['Ambiente controlado (sandbox)', 'Que comportamento e que riscos aparecem sem expor o processo real?', 'Dados sintéticos ou selecionados, ações restritas; validade externa limitada, que deve ser registrada.'],
  ['Piloto', 'O caso de uso funciona em condições próximas das reais?', 'População e período delimitados, desenho de avaliação, possibilidade real de não continuar.'],
];
// Perguntas do navegador que alimentam cada grupo de cláusulas (Instrumento F)
const CAT_Q = {
  Escopo: ['p-problema', 'i-supervisao', 'i-acessib', 'p-idiomas'],
  Desempenho: ['r-sucesso', 'i-evidencia', 's-evidencia', 'i-pico', 'p-adocao', 'i-adocao'],
  Mudança: ['s-mudanca', 'i-geracao'],
  Dados: ['g-dados', 'r-baselegal', 'r-acordo', 'p-protecao', 'i-finalidade', 'i-dpia', 'i-base', 's-qualidade'],
  Verificação: ['p-incidente', 'i-incidente', 'i-adversarial', 'i-rastreio', 'i-contestacao', 'i-identidade', 'p-acessos', 's-revisao', 'i-monitor'],
  Direitos: ['i-fornecedor', 'r-ativos'],
  Custo: ['r-gratuito', 'g-orcamento', 's-orcamento'],
  Saída: ['r-parada', 'i-portab', 's-saida', 's-interop'],
  Gestão: ['i-contrato', 'i-gestao', 'g-compras', 'p-suporte', 'i-suporte'],
};
const CATS = ['Escopo', 'Desempenho', 'Mudança', 'Dados', 'Verificação', 'Direitos', 'Custo', 'Saída', 'Gestão'];
// Documentos do dossiê por fase
const DOSSIE_FASE = { contexto: ['D1', 'D2', 'D3', 'D4'], piloto: ['D5', 'D6', 'D7', 'D8'], implantacao: ['D9', 'D10', 'D11', 'D12', 'D13', 'D14', 'D15', 'D16', 'D17'], escala: ['D18'] };

const REC = {
  contexto: { sim: 'O contexto está claro: siga para o desenho do piloto.', cond: 'O contexto permite planejar o piloto; trate as condições de governança em paralelo.', nao: 'Antes de planejar o piloto, resolva os impedimentos de governança.', falta: 'Complete o contexto para obter uma recomendação.' },
  piloto: { sim: 'Pode iniciar o piloto nas condições descritas.', cond: 'Pode iniciar o piloto se as condições abaixo entrarem no plano, com responsável e prazo.', nao: 'Não inicie o piloto ainda: resolva os impedimentos abaixo.', falta: 'Complete a fase do piloto para obter uma recomendação.' },
  implantacao: { sim: 'Pode levar a solução à rede e preparar a contratação.', cond: 'Pode preparar a implantação e a contratação, desde que as condições abaixo entrem no termo de referência e no contrato.', nao: 'Não implante nem contrate ainda: resolva os impedimentos abaixo.', falta: 'Complete a fase de implantação para obter uma recomendação.' },
  escala: { sim: 'Pode manter e ampliar nas condições atuais.', cond: 'Pode manter e ampliar, desde que as condições abaixo entrem no plano.', nao: 'Não amplie nem renove ainda: resolva os impedimentos abaixo.', falta: 'Complete a fase de sustentabilidade e expansão para obter uma recomendação.' },
};
// A recomendação principal vem da primeira fase avaliada que ainda não está pronta; se todas estiverem, da última.
function recomendacao() {
  const av = fasesAvaliadas();
  let alvo = av.find(f => ['nao', 'falta'].includes(veredito(f.id).st)) || av[av.length - 1];
  const v = veredito(alvo.id);
  const pul = FASES.filter(f => pulada(f.id));
  let nota = '';
  if (pul.length === 2) nota = 'As fases 3 e 4 não foram avaliadas. A recomendação vale até o piloto; antes de implantar na rede e contratar em escala, avalie a fase 3.';
  else if (pul.length === 1) nota = 'A fase 4 não foi avaliada. Antes de renovar ou ampliar, avalie a sustentabilidade e a expansão.';
  return { fase: alvo, st: v.st, texto: REC[alvo.id][v.st], nota };
}
function lacunasCat(cat) {
  const ids = CAT_Q[cat] || [];
  const out = [];
  fasesAvaliadas().forEach(f => questoes(f.id).forEach(q => {
    if (!ids.includes(q.id)) return;
    const v = S.resp[q.id];
    if (v === 'nao' || v === 'parcial') out.push([{ q, texto: ACOES[q.id] || q.t, ir: f.id + ':' + passoDaQuestao(q) + ':' + q.id, resp: v }, v === 'nao' && ESSENCIAIS.has(q.id) ? 'crit' : 'warn']);
  }));
  return out;
}
function clausulasCaso() {
  const c = S.caso, p = perfil(), afeta = (c.consequencias || []).some(k => k !== 'nenhuma');
  return CONTRATO.filter(x => !x[2] || (x[2] === 'alto' && p.alto) || (x[2] === 'pessoas' && afeta) || (x[2] === 'consumo' && c.arquitetura !== 'saas'));
}
function dadosReqCaso() {
  const c = S.caso;
  return DADOS_REQ.filter(d => d[0] !== 'rag' || c.arquitetura === 'api').map(d => ({ h: d[1], t: d[2], prio: d[0] === 'treino' && c.treino !== 'nao' }));
}
function dossieCaso() { return fasesAvaliadas().flatMap(f => DOSSIE_FASE[f.id]).map(k => DOSSIE.find(d => d[0] === k)); }

// ----------------------------------------------------------- página
function renderResumo() {
  const c = S.caso, t = totaisCtx(), rec = recomendacao(), pl = planoAcao();
  const arq = c.arquitetura;
  let custo = null; if (custoPronto()) { try { custo = numerosCusto(); } catch (e) { } }
  const data = new Date().toLocaleDateString(LOC());
  const arr = (ARRANJO_ARQ[arq] || []).map(k => ARRANJOS.find(a => a[0] === k));
  const tabArr = rows => `<div class="tw"><table><thead><tr><th>Arranjo</th><th>Tende a ser adequado quando</th><th>Exige atenção a</th><th>Capacidade pública crítica</th></tr></thead><tbody>${rows.map(a => `<tr><td><b>${esc(a[1])}</b></td><td>${esc(a[2])}</td><td>${esc(a[3])}</td><td>${esc(a[4])}</td></tr>`).join('')}</tbody></table></div>`;
  const cats = CATS.map(cat => {
    const cl = clausulasCaso().filter(x => x[0] === cat);
    const lac = lacunasCat(cat);
    const extra = cat === 'Dados' ? dadosReqCaso() : [];
    if (!cl.length && !lac.length && !extra.length) return '';
    return `<details class="cat${lac.length ? ' com-lacuna' : ''}" ${lac.length ? 'open' : ''}><summary><b>${esc(cat)}</b>${lac.length ? `<span class="tag ess">${esc(tr(lac.length === 1 ? '1 lacuna nas suas respostas' : lac.length + ' lacunas nas suas respostas'))}</span>` : '<span class="tag">sem lacunas nas respostas</span>'}<span class="small muted">${esc(tr((cl.length + extra.length) + ' requisitos'))}</span></summary>
      <div class="cat-b">
        ${lac.length ? `<div class="res-g"><span class="res-t ${lac.some(x => x[1] === 'crit') ? 'crit' : 'warn'}">Resolva antes de publicar o edital</span>${listaAcoes(lac, 8)}</div>` : ''}
        <div><span class="res-t muted">Inclua no termo de referência e no contrato</span>
        <ul class="req">${cl.map(x => `<li>${esc(x[1])}${x[2] ? ` <span class="tag gold">${esc({ alto: 'risco elevado', pessoas: 'afeta pessoas', consumo: 'cobrança por consumo' }[x[2]])}</span>` : ''}</li>`).join('')}
        ${extra.map(d => `<li><b>${esc(d.h)}.</b> ${esc(d.t)}${d.prio ? ' <span class="tag ess">prioridade</span>' : ''}</li>`).join('')}</ul></div></div></details>`;
  }).join('');
  const p = perfil();
  const forma = riscoPronto() ? FORMAS_SUP[formaSupervisao(c, p)] : null;
  const afeta = (c.consequencias || []).some(k => k !== 'nenhuma');
  const pacote = PACOTE.filter(x => !x[2] || (x[2] === 'rag' && arq === 'api'));
  return `<section class="resumo" id="resumo">
    <div class="res-topo">
      <div><div class="eyebrow">Resumo e recomendações</div><h2>${esc(c.titulo || S.ctx.olhando || tr('Caso sem título'))}</h2>
        <p class="muted">${[S.ctx.local, data].filter(Boolean).map(esc).join(' · ')}</p></div>
      <div class="row"><button type="button" class="btn pri grande" data-act="pdf">Baixar PDF</button><button type="button" class="btn" data-act="voltar-fases">Voltar às fases</button></div>
    </div>

    <div class="rec v-${rec.st} ${VEREDITOS[rec.st][1]}">
      <span class="eyebrow">${esc(tr('Recomendação'))}</span>
      <p class="rec-t">${esc(rec.texto)}</p>
      ${rec.nota ? `<p class="small">${esc(rec.nota)}</p>` : ''}
      <div class="vered">${FASES.map(f => { const v = veredito(f.id); return `<button type="button" class="vered-i" data-${pulada(f.id) ? 'act="avaliar-fase" data-f2' : 'fase'}="${f.id}"><span class="fase-n f${f.n}">${f.n}</span><span><small>${esc(PERG_FASE[f.id])}</small>${pillVeredito(v.st)}</span></button>`; }).join('')}</div>
    </div>

    <div class="kpis kpis4">
      <div class="kpi"><span class="v">${t.alunos ? fmtInt(t.alunos) : '—'}</span><span class="l">Estudantes nas etapas atendidas</span></div>
      <div class="kpi"><span class="v">${riscoPronto() ? esc(NIVEL_NOME[p.agregado]) : '—'}</span><span class="l">Perfil de risco</span></div>
      <div class="kpi"><span class="v">${custo ? grande(custo.piloto) : '—'}</span><span class="l">Dotação do Ano 0 (piloto e implantação)</span></div>
      <div class="kpi"><span class="v">${custo ? grande(custo.total) : '—'}</span><span class="l">Custo total do ciclo de vida</span></div></div>

    <section class="res-sec"><h3><span class="sn">1</span>O que fazer antes da próxima decisão</h3>
      ${pl.length ? pl.map(([f, v]) => `<div class="plano-f"><b>${esc(tr('Fase ' + f.n + ':') + ' ' + tr(f.nome))}</b>
        ${listaAcoes([...v.bloq.map(it => [it, 'crit']), ...v.cond.map(it => [it, 'warn'])], 6)}</div>`).join('')
        : `<p class="muted">Nenhuma ação pendente nas respostas dadas até agora.</p>`}
    </section>

    <section class="res-sec"><h3><span class="sn">2</span>Modelo de contratação</h3>
      <p class="muted">O que a sua rede precisa definir para levar a necessidade ao mercado sem perder os controles: arranjo de aquisição, forma de aprender antes de se comprometer, requisitos e cláusulas, supervisão, saída e orçamento. O procedimento de contratação segue as regras jurídicas da sua jurisdição.</p>

      <h4>2.1 Arranjo de aquisição</h4>
      ${arr.length ? `<p>${esc(tr('Para a arquitetura informada'))} (<b>${esc(rotulo(OPC.arquitetura, arq))}</b>), ${esc(tr('o arranjo mais próximo é:'))}</p>${tabArr(arr)}<p class="note">${esc(NOTA_ARQ[arq])}</p>`
        : `<div class="vazio"><b>A arquitetura ainda não foi definida.</b> ${irBtn('piloto:2a', tr('Responder no passo 2.1'))}</div>`}
      <p class="small muted">Os arranjos são combináveis: uma aplicação própria pode usar um modelo por API e uma base de conhecimento compartilhada. O que importa é a clareza sobre quem controla cada componente e por quê.</p>
      <details class="mais"><summary>Ver todos os arranjos</summary>${tabArr(ARRANJOS)}</details>

      <h4>2.2 Aprender antes de se comprometer</h4>
      <div class="tw"><table><thead><tr><th>Instrumento</th><th>Pergunta que responde</th><th>Condições</th></tr></thead><tbody>${APRENDIZAGEM.map(a => `<tr${a[0] === 'Piloto' ? ' class="hl"' : ''}><td><b>${esc(a[0])}</b></td><td>${esc(a[1])}</td><td>${esc(a[2])}</td></tr>`).join('')}</tbody></table></div>
      <ul class="req">
        <li>Mantenha separadas duas decisões: se vale a pena aprender sobre uma solução e se a evidência justifica a aquisição ou a expansão.</li>
        <li>O desenho do teste deve explicitar que sucesso técnico não gera direito nem decisão automática de continuidade.</li>
        <li>Contratar por etapas limita o compromisso inicial e permite avançar à medida que as hipóteses se confirmam: viabilidade, população restrita, expansão por critérios definidos previamente.</li>
        ${c.pilotoGratuito ? '<li><b>Piloto gratuito:</b> registre antes os ativos que o piloto produzirá e o destino deles se o fornecedor não for escolhido.</li>' : ''}
      </ul>

      <h4>2.3 Requisitos do termo de referência e cláusulas do contrato</h4>
      <p class="small muted">Checklist do Instrumento F do guia, filtrado pelas respostas deste caso. Grupos com lacunas aparecem abertos.</p>
      <div class="cats">${cats}</div>

      <h4>2.4 Supervisão humana e contestação</h4>
      ${forma ? `<p><b><span>Forma indicada:</span> <span>${esc(forma[0])}</span>.</b> <span>${esc(forma[1])}</span></p>` : `<div class="vazio"><b>Responda os passos 2.1 e 2.2 para definir a forma de supervisão.</b> ${irBtn('piloto:2b', tr('Ir ao passo 2.2'))}</div>`}
      ${afeta ? `<p class="small muted">Como a saída afeta pessoas, o contrato deve garantir registros e cooperação para a contestação. Um mecanismo efetivo reúne seis elementos:</p><ul class="req">${CONTESTACAO.map(x => `<li><b>${esc(x[0])}.</b> ${esc(x[1])}</li>`).join('')}</ul>` : ''}

      <h4>2.5 Dependência e saída</h4>
      ${LOCKIN[arq] ? `<ul class="req">${LOCKIN[arq].map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      <p class="small muted">A saída se prepara na entrada. Defina no contrato o pacote de transição:</p>
      <ul class="req">${pacote.map(x => `<li><b>${esc(x[0])}.</b> ${esc(x[1])}</li>`).join('')}</ul>

      <h4>2.6 Custo e orçamento para a contratação</h4>
      ${custo ? `<div class="tw"><table><thead><tr><th>Exercício</th>${custo.av.r.anos.map(x => `<th class="n">${esc(tr('Ano ' + x))}</th>`).join('')}</tr></thead><tbody>
        <tr><td><span>Dotação a solicitar</span> (${esc(unidMil())})</td>${custo.av.r.anos.map(x => `<td class="n">${mil(custo.orc.dot[x])}</td>`).join('')}</tr></tbody></table></div>
        <p class="small muted"><span>${esc(tr('Por usuário ativo por ano:'))}</span> <b>${din(custo.porAluno, 2)}</b>. <span>Teste o orçamento sem condições promocionais e compare as propostas no mesmo horizonte, incluindo mudança e saída. Valores ilustrativos.</span></p>`
        : `<div class="vazio"><b>Para estimar o custo, informe a arquitetura no passo 2.1.</b> ${irBtn('piloto:2a', tr('Ir ao passo 2.1'))}</div>`}

      <h4>2.7 Documentos do dossiê a preparar</h4>
      <div class="tw"><table><thead><tr><th>Doc.</th><th>Conteúdo</th><th>Instr.</th></tr></thead><tbody>${dossieCaso().map(d => `<tr><td><b>${d[0]}</b></td><td>${esc(d[1])}</td><td>${d[3] ? esc(tr('Instrumento ' + d[3])) : '—'}</td></tr>`).join('')}</tbody></table></div>
    </section>

    <section class="res-sec"><h3><span class="sn">3</span>Suas respostas</h3>
      <details class="rel" data-resp-rel><summary>Ver todas as respostas</summary><div class="report">${relHTML(secoesFluxo().slice(1), false)}</div></details>
    </section>

    <section class="res-sec export"><h3><span class="sn">4</span>Exportar</h3>
      <p class="small muted">O PDF reúne a recomendação, o plano de ação, o modelo de contratação e todas as respostas. As respostas também ficam salvas neste navegador.</p>
      <div class="row">
        <button class="btn pri" type="button" data-act="pdf">Baixar PDF</button>
        ${CAP.downloads ? `<button class="btn" type="button" data-act="exp-json">Exportar caso (.json)</button><button class="btn" type="button" data-act="dl-csv">Custos (.csv)</button>` : `<button class="btn" type="button" data-act="copiar-json">Copiar dados do caso</button>`}
        <button class="btn" type="button" data-act="copiar">Copiar relatório</button>
        <label class="btn" for="imp-json">Importar caso</label><input id="imp-json" type="file" accept="application/json,.json" hidden>
      </div></section>
  </section>`;
}

// ----------------------------------------------------------- conteúdo do PDF
function secoesResumo() {
  const c = S.caso, t = totaisCtx(), rec = recomendacao(), p = perfil();
  const arq = c.arquitetura;
  let custo = null; if (custoPronto()) { try { custo = numerosCusto(); } catch (e) { } }
  const secs = [];
  secs.push({ h: 'Recomendação', p: [tr(rec.texto)].concat(rec.nota ? [tr(rec.nota)] : []),
    table: { head: ['Fase', 'Pergunta', 'Resultado'], rows: FASES.map(f => [f.n + '. ' + tr(f.nome), tr(PERG_FASE[f.id]), tr(VEREDITOS[veredito(f.id).st][0])]) } });
  secs.push({ h: 'Caso', kv: [['Nome', c.titulo || tr('Caso sem título')], ['Lugar ou rede', S.ctx.local || '—'], ['Estudantes nas etapas atendidas', t.alunos ? fmtInt(t.alunos) : '—'],
    ['Perfil de risco', riscoPronto() ? tr(NIVEL_NOME[p.agregado]) : '—'], ['Arquitetura', rotulo(OPC.arquitetura, arq) || '—'],
    ['Custo total do ciclo de vida', custo ? grande(custo.total) : '—'], ['Dotação do Ano 0 (piloto e implantação)', custo ? grande(custo.piloto) : '—']] });
  const acoes = [];
  planoAcao().forEach(([f, v]) => {
    v.bloq.forEach(it => acoes.push([f.n + '. ' + tr(f.nome), tr('Impedimento'), tr(it.texto)]));
    v.cond.forEach(it => acoes.push([f.n + '. ' + tr(f.nome), tr('Condição') + (it.resp === 'parcial' ? ' (' + tr('em parte') + ')' : ''), tr(it.texto)]));
  });
  secs.push({ h: '1. O que fazer antes da próxima decisão', p: acoes.length ? [] : ['Nenhuma ação pendente nas respostas dadas até agora.'], table: acoes.length ? { head: ['Fase', 'Tipo', 'Ação'], rows: acoes, grupo: true, larg: [92, 82] } : null });
  // modelo de contratação
  const arr = (ARRANJO_ARQ[arq] || []).map(k => ARRANJOS.find(a => a[0] === k));
  secs.push({ h: '2. Modelo de contratação', p: ['O que a sua rede precisa definir para levar a necessidade ao mercado sem perder os controles: arranjo de aquisição, forma de aprender antes de se comprometer, requisitos e cláusulas, supervisão, saída e orçamento. O procedimento de contratação segue as regras jurídicas da sua jurisdição.'] });
  secs.push({ h: '2.1 Arranjo de aquisição', sub: true, p: arr.length ? [tr('Para a arquitetura informada') + ' (' + tr(rotulo(OPC.arquitetura, arq)) + '), ' + tr('o arranjo mais próximo é:')] : ['A arquitetura ainda não foi definida.'],
    table: arr.length ? { head: ['Arranjo', 'Tende a ser adequado quando', 'Exige atenção a', 'Capacidade pública crítica'], rows: arr.map(a => a.slice(1)) } : null,
    pos: (arr.length ? [NOTA_ARQ[arq]] : []).concat(['Os arranjos são combináveis: uma aplicação própria pode usar um modelo por API e uma base de conhecimento compartilhada. O que importa é a clareza sobre quem controla cada componente e por quê.']) });
  secs.push({ h: '2.2 Aprender antes de se comprometer', sub: true, table: { head: ['Instrumento', 'Pergunta que responde', 'Condições'], rows: APRENDIZAGEM },
    list: ['Mantenha separadas duas decisões: se vale a pena aprender sobre uma solução e se a evidência justifica a aquisição ou a expansão.', 'O desenho do teste deve explicitar que sucesso técnico não gera direito nem decisão automática de continuidade.', 'Contratar por etapas limita o compromisso inicial e permite avançar à medida que as hipóteses se confirmam: viabilidade, população restrita, expansão por critérios definidos previamente.']
      .concat(c.pilotoGratuito ? [tr('Piloto gratuito:') + ' ' + tr('registre antes os ativos que o piloto produzirá e o destino deles se o fornecedor não for escolhido.')] : []) });
  const rows = [];
  CATS.forEach(cat => {
    lacunasCat(cat).forEach(([it, tipo]) => rows.push([tr(cat), tr(tipo === 'crit' ? 'Resolver antes do edital (impedimento)' : 'Resolver antes do edital'), tr(it.texto)]));
    clausulasCaso().filter(x => x[0] === cat).forEach(x => rows.push([tr(cat), tr('Incluir no contrato'), tr(x[1]) + (x[2] ? ' (' + tr({ alto: 'risco elevado', pessoas: 'afeta pessoas', consumo: 'cobrança por consumo' }[x[2]]) + ')' : '')]));
    if (cat === 'Dados') dadosReqCaso().forEach(d => rows.push([tr(cat), tr('Incluir no contrato'), tr(d.h) + ': ' + tr(d.t) + (d.prio ? ' (' + tr('prioridade') + ')' : '')]));
  });
  secs.push({ h: '2.3 Requisitos do termo de referência e cláusulas do contrato', sub: true, p: ['Checklist do Instrumento F do guia, filtrado pelas respostas deste caso.'], table: { head: ['Grupo', 'O que fazer', 'Requisito ou cláusula'], rows, grupo: true, larg: [74, 92] } });
  const forma = riscoPronto() ? FORMAS_SUP[formaSupervisao(c, p)] : null;
  const afeta = (c.consequencias || []).some(k => k !== 'nenhuma');
  secs.push({ h: '2.4 Supervisão humana e contestação', sub: true, p: forma ? [tr('Forma indicada:') + ' ' + tr(forma[0]) + '. ' + tr(forma[1])] : ['Responda os passos 2.1 e 2.2 para definir a forma de supervisão.'],
    list: afeta ? CONTESTACAO.map(x => tr(x[0]) + ': ' + tr(x[1])) : [] });
  secs.push({ h: '2.5 Dependência e saída', sub: true, list: (LOCKIN[arq] || []).concat(PACOTE.filter(x => !x[2] || (x[2] === 'rag' && arq === 'api')).map(x => tr(x[0]) + ': ' + tr(x[1]))) });
  if (custo) secs.push({ h: '2.6 Custo e orçamento para a contratação', sub: true,
    table: { head: ['Exercício'].concat(custo.av.r.anos.map(x => tr('Ano ' + x))), rows: [[tr('Dotação a solicitar') + ' (' + unidMil() + ')'].concat(custo.av.r.anos.map(x => mil(custo.orc.dot[x])))] },
    pos: [tr('Por usuário ativo por ano:') + ' ' + din(custo.porAluno, 2) + '. ' + tr('Teste o orçamento sem condições promocionais e compare as propostas no mesmo horizonte, incluindo mudança e saída. Valores ilustrativos.')] });
  secs.push({ h: '2.7 Documentos do dossiê a preparar', sub: true, table: { head: ['Doc.', 'Conteúdo', 'Instr.'], rows: dossieCaso().map(d => [d[0], tr(d[1]), d[3] ? tr('Instrumento ' + d[3]) : '—']) } });
  secs.push({ h: '3. Suas respostas' });
  const fl = secoesFluxo().slice(1);
  const nomes = (k, vs) => (vs || []).map(v => tr(rotulo(OPC[k], v) || v)).join('; ') || '—';
  const r = (k, v) => respondido(k) ? tr(rotulo(OPC[k], v)) || '—' : '—';
  fl.splice(2, 0, { h: 'Descrição do problema', kv: [['Problema', c.problema || '—'], ['Resultado esperado', c.resultado || '—'], ['Quem é afetado', c.populacao || '—'],
    ['Existe linha de base medida?', r('linhaBase', c.linhaBase)], ['Alternativa sem IA comparada', c.alternativaSemIA ? tr('Sim') : tr('Não')]] });
  fl.splice(4, 0, { h: 'Caso de uso (passos 2.1 e 2.2)', kv: [['O que a IA faz', nomes('classes', c.classes)], ['Grau de autonomia', r('autonomia', c.autonomia)], ['Arquitetura', r('arquitetura', c.arquitetura)],
    ['Há oferta de piloto ou período gratuito', c.pilotoGratuito ? tr('Sim') : tr('Não')], ['Tamanho do piloto', [S.piloto.escolas ? tr(S.piloto.escolas + ' escolas') : '', S.piloto.participantes ? tr(fmtInt(S.piloto.participantes) + ' participantes') : '', S.piloto.meses ? tr(S.piloto.meses + ' meses') : ''].filter(Boolean).join(', ') || '—'],
    ['Quem usa o sistema', nomes('usuarios', c.usuarios)], ['Quem é afetado pelas saídas', nomes('afetados', c.afetados)], ['Em que entra a saída do sistema', respondido('consequencias') ? nomes('consequencias', c.consequencias) : '—'],
    ['Que dados são usados', respondido('dados') ? nomes('dados', c.dados) : '—'], ['Frequência de uso', r('frequencia', c.frequencia)], ['Se a saída estiver errada', r('reversibilidade', c.reversibilidade)],
    ['Verificação das saídas', r('verificabilidade', c.verificabilidade)], ['Contestação', r('contestacao', c.contestacao)], ['Efeitos cumulativos', r('cumulativo', c.cumulativo)],
    ['Pessoas que vão usar o sistema na rede', fmtInt(c.elegiveis)]] });
  fl.forEach(x => secs.push(Object.assign({ sub: true }, x)));
  if (riscoPronto()) secs.push({ h: 'Perfil de risco', sub: true, p: [tr('Nível de diligência:') + ' ' + tr(NIVEL_NOME[p.agregado]) + '. ' + tr(NIVEL_CRIT[p.agregado])],
    table: { head: ['Dimensão', 'Nível', 'Justificativa'], rows: DIMENSOES.map(([k, n]) => [n, tr(NIVEL_NOME[p.P[k]]), p.J[k]]) } });
  return secs;
}

// ----------------------------------------------------------- PDF (jsPDF + autotable, fonte Helvetica)
const PDF_TROCA = { '→': '->', '←': '<-', '≥': '>=', '≤': '<=', '✓': 'v', '✕': 'x', '−': '-', '≈': '~', ' ': ' ', ' ': ' ', '‑': '-', '‐': '-', '«': '«', '»': '»' };
const CP1252_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
function pdfTxt(x) {
  let s = String(x == null ? '' : x).replace(/[^\x00-\xFF]/g, ch => PDF_TROCA[ch] != null ? PDF_TROCA[ch] : CP1252_EXTRA.includes(ch) ? ch : (ch.normalize('NFKD').replace(/[^\x00-\xFF]/g, '') || ''));
  return s;
}
function gerarPDF() {
  const J = window.jspdf; if (!J || !J.jsPDF) throw new Error('jspdf');
  const doc = new J.jsPDF({ unit: 'pt', format: 'a4', compress: true });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 46;
  const AZUL = [12, 45, 77], MARCA = [0, 105, 180], CINZA = [88, 102, 116], TINTA = [23, 33, 43];
  let y = M;
  const novaPag = () => { doc.addPage(); y = M; };
  const cabe = h => { if (y + h > H - M - 20) novaPag(); };
  const texto = (s, o = {}) => {
    doc.setFont('helvetica', o.b ? 'bold' : o.i ? 'italic' : 'normal'); doc.setFontSize(o.size || 10); doc.setTextColor(...(o.cor || TINTA));
    const linhas = doc.splitTextToSize(pdfTxt(s), (o.w || (W - 2 * M)) - (o.ind || 0));
    const lh = (o.size || 10) * 1.38;
    linhas.forEach((l, i) => { cabe(lh); if (o.bullet && i === 0) doc.text('•', M + 2, y + (o.size || 10)); doc.text(l, M + (o.ind || 0), y + (o.size || 10)); y += lh; });
    y += o.after == null ? 4 : o.after;
  };
  // capa / cabeçalho
  const imgs = [...document.querySelectorAll('.top .logo')].slice(0, 2);
  let x = M;
  imgs.forEach(im => { try { const r = im.naturalWidth / im.naturalHeight || 2; const h = 34; doc.addImage(im.src, 'PNG', x, y, h * r, h); x += h * r + 14; } catch (e) { } });
  y += 50;
  texto(NOME_FERRAMENTA, { b: true, size: 20, cor: AZUL, after: 2 });
  texto(tr('Resumo e recomendações'), { size: 13, cor: MARCA, after: 10 });
  texto(S.caso.titulo || S.ctx.olhando || tr('Caso sem título'), { b: true, size: 14, cor: TINTA, after: 2 });
  texto([S.ctx.local, tr('Gerado em') + ' ' + new Date().toLocaleDateString(LOC())].filter(Boolean).join(' · '), { size: 10, cor: CINZA, after: 8 });
  texto(tr('Documento de trabalho baseado no guia; valores ilustrativos.') + ' ' + tr(TXT_VINCULO), { size: 8.5, cor: CINZA, after: 10 });
  doc.setDrawColor(...MARCA); doc.setLineWidth(1.2); doc.line(M, y, W - M, y); y += 14;
  const secs = trFundo(secoesResumo());
  const ALERTA = [tr('Impedimento'), tr('Resolver antes do edital (impedimento)')].map(pdfTxt);
  const ATENCAO = [tr('Resolver antes do edital')].map(pdfTxt);
  const tabela = (head, rows, opts = {}, t = {}) => {
    cabe(head ? 56 : 30);
    if (t.grupo) rows = rows.map((r, i) => i && r[0] === rows[i - 1][0] ? [''].concat(r.slice(1)) : r);
    const cs = {}; (t.larg || []).forEach((wd, i) => { cs[i] = { cellWidth: wd }; });
    doc.autoTable(Object.assign({ rowPageBreak: 'avoid', columnStyles: cs, startY: y,
      didParseCell: d => { if (d.section !== 'body') return; const v = String(d.cell.raw || '');
        if (ALERTA.includes(v)) { d.cell.styles.textColor = [176, 30, 30]; d.cell.styles.fontStyle = 'bold'; }
        else if (ATENCAO.includes(v) || v.startsWith(pdfTxt(tr('Condição')))) { d.cell.styles.textColor = [138, 90, 0]; }
        if (t.grupo && d.column.index === 0) d.cell.styles.fontStyle = 'bold'; },
      startY: y, margin: { left: M, right: M, bottom: M + 14 }, head: head ? [head.map(pdfTxt)] : undefined, body: rows.map(r => r.map(pdfTxt)),
      styles: { font: 'helvetica', fontSize: 8.6, cellPadding: 4, textColor: TINTA, lineColor: [221, 227, 233], lineWidth: 0.5, overflow: 'linebreak', valign: 'top' },
      headStyles: { fillColor: [238, 243, 248], textColor: AZUL, fontStyle: 'bold' }, alternateRowStyles: { fillColor: [250, 251, 253] }, theme: 'grid',
    }, opts));
    y = doc.lastAutoTable.finalY + 10;
  };
  secs.forEach(s => {
    if (!s.sub) { cabe(60); if (y > M + 40) y += 6; } else cabe(40);
    texto(s.h, { b: true, size: s.sub ? 11.5 : 14, cor: s.sub ? MARCA : AZUL, after: 4 });
    if ((s.kv || []).length) tabela(null, s.kv.map(([k, v]) => [k, v || '—']), { theme: 'plain', columnStyles: { 0: { cellWidth: 170, fontStyle: 'bold', textColor: CINZA } } });
    (s.p || []).forEach(t => texto(t, { size: 10 }));
    if ((s.list || []).length) s.list.forEach(t => texto(t, { size: 10, ind: 12, after: 2, bullet: true }));
    if (s.table && s.table.rows.length) tabela(s.table.head, s.table.rows, {}, s.table);
    (s.pos || []).forEach(t => texto(t, { i: true, size: 9, cor: CINZA }));
  });
  cabe(70); y += 6;
  texto(tr(TXT_ISENCAO), { size: 8, cor: CINZA });
  // rodapé em todas as páginas
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...CINZA);
    doc.text(pdfTxt(NOME_FERRAMENTA + ' · ' + tr('Resumo e recomendações')), M, H - 24);
    doc.text(pdfTxt(i + ' / ' + n), W - M, H - 24, { align: 'right' });
  }
  return doc;
}
async function baixarPDF() {
  let doc;
  try { doc = gerarPDF(); } catch (e) { console.warn(e); toast(tr('Não foi possível gerar o PDF.')); return; }
  const nome = nomeArq('pdf').replace('relatorio', 'resumo');
  const blob = doc.output('blob');
  if (CAP.downloads) {
    try { await CAP.downloads.save({ filename: nome, data: blob }); toast(tr('Arquivo enviado para download.')); }
    catch (e) { if (e && e.code !== 'declined') toast(tr('Não foi possível baixar agora.')); }
    return;
  }
  try { doc.save(nome); } catch (e) { toast(tr('Não foi possível baixar agora.')); }
}
