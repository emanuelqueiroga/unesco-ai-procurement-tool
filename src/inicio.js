// =====================================================================
// v13 · Página inicial (RQ-01) e matriz camadas × fases (RQ-03)
// paginaInicial(sv): página que substitui as boas-vindas (fluxo.js, boasVindas). sv = SALVO (app.js) ou null.
// renderMatrizTabela({ caso }): tabela da MATRIZ (matriz.js); com caso: true, estado e custo de cada célula (matrizCaso()).
// abrirMatriz(volta) / fecharMatriz(): visualizador modal da matriz, no padrão de abrirVisor (fluxo.js).
// eventoInicio(e): cliques em [data-inicio-fase], [data-inicio-card] e [data-act="ver-matriz"]; devolve true se tratou.
// Os textos são PT (chave de tradução): cada texto fica num nó próprio para o MutationObserver de i18n.js.
// =====================================================================
const INICIO = {
  titulo: 'Planeje a compra de IA para a sua rede de ensino',
  eyebrow: 'Planejamento de IA na educação',
  frase: 'Responda algumas perguntas sobre o contexto da sua rede e receba um plano com o custo estimado e as próximas etapas. Comece agora.',
  iniciar: 'Começar',
  mapaSub: 'Quatro fases, do contexto ao plano de contratação.',
  verMatriz: 'Ver a matriz de custo',
};
// O que a pessoa recebe ao fim de cada fase (RQ-01)
const RESULTADO_FASE = {
  contexto: 'Perfil da rede, prioridades, problemas e objetivos; diagnóstico de governança.',
  piloto: 'Tamanho e custo do teste (Ano 0) e o que ele exige em cada camada.',
  implantacao: 'Primeira etapa de uso real, arquitetura e custo do Ano 1.',
  expansao: 'Custo de todo o ciclo, recomendações para você e o plano de contratação em PDF.',
};
// Selos de estado das células na matriz do caso (estadoCelula, matriz.js)
const ESTADO_MATRIZ = { ok: 'Respondido', andamento: 'Em andamento', pendente: 'Pendente', orientacao: 'Orientação', na: 'Não se aplica' };
// Fase aberta na página inicial ('' = nenhuma). Só uma por vez.
let INICIO_ABERTA = '';

const escI = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
const ICO_SETA = '<svg class="ico" aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 20 20"><path d="M11.3 4.3 17 10l-5.7 5.7-1.4-1.4 3.3-3.3H3V9h10.2L9.9 5.7l1.4-1.4Z" fill="currentColor"/></svg>';
const ICO_CHEV = '<svg class="ini-chev" aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 20 20"><path d="M5.3 7.3 10 12l4.7-4.7 1.4 1.4L10 14.8 3.9 8.7l1.4-1.4Z" fill="currentColor"/></svg>';
const ICO_GRADE = '<svg class="ico" aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 20 20"><path d="M2 3h16v14H2V3Zm1.6 1.6v3h3.6v-3H3.6Zm5.2 0v3h3.6v-3H8.8Zm5.2 0v3h2.4v-3H14Zm-10.4 4.6v3h3.6v-3H3.6Zm5.2 0v3h3.6v-3H8.8Zm5.2 0v3h2.4v-3H14Zm-10.4 4.6v2.2h3.6v-2.2H3.6Zm5.2 0v2.2h3.6v-2.2H8.8Zm5.2 0v2.2h2.4v-2.2H14Z" fill="currentColor"/></svg>';

// Números das perguntas de uma célula, em ordem e com intervalos ("1.3.1–1.3.6 · 1.2.7")
function numerosCelula(ids) {
  const ns = [...new Set((ids || []).map(id => (typeof numPergunta === 'function' ? numPergunta(id) : '')).filter(Boolean))];
  const ch = n => n.split('.').map(x => +x || 0);
  ns.sort((a, b) => { const x = ch(a), y = ch(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; });
  const out = []; let ini = null, ant = null;
  const fecha = () => { if (ini) out.push(ini === ant ? ini : ini + '–' + ant); };
  ns.forEach(n => {
    const p = ch(n), q = ant ? ch(ant) : null;
    const seguido = q && p.length === q.length && p.slice(0, -1).join('.') === q.slice(0, -1).join('.') && p[p.length - 1] === q[q.length - 1] + 1;
    if (seguido) ant = n; else { fecha(); ini = ant = n; }
  });
  fecha();
  return out;
}
const listaNums = ns => ns.map(n => `<span class="nq">${escI(n)}</span>`).join(' · ');
// Camadas que a fase alimenta: células da MATRIZ com perguntas nessa fase
function camadasDaFase(fid) {
  if (typeof MATRIZ === 'undefined') return [];
  return CAMADAS.filter(([k]) => MATRIZ[k] && MATRIZ[k][fid] && !MATRIZ[k][fid].na && (MATRIZ[k][fid].q || []).length).map(([k]) => k);
}
const reduzMov = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

// ----------------------------------------------------------- página inicial
function paginaInicial(sv) {
  const nome = sv ? (sv.nome || (sv.exemplo ? tr(sv.exemplo) : '')) : '';
  const salvo = sv ? `<div class="salvo ini-salvo" role="group" aria-labelledby="salvo-t">
      <h2 id="salvo-t">Há um caso salvo neste navegador</h2>
      <p class="salvo-caso">${nome ? `<b data-notr>${escI(nome)}</b>` : '<b>Caso sem nome</b>'}${sv.lugar ? ` <span class="muted">·</span> <span data-notr>${escI(sv.lugar)}</span>` : ''}${sv.exemplo && !sv.nome ? ' <span class="tag">exemplo</span>' : ''}</p>
      ${sv.migrou ? '<p class="small muted">Convertido da versão anterior da ferramenta. Revise as respostas de adoção.</p>' : ''}
      <div class="row"><button type="button" class="btn pri grande" data-act="continuar-salvo">Continuar o caso salvo</button><button type="button" class="btn grande" data-act="comecar">Começar em branco</button></div>
      <p class="small muted">Começar em branco ou abrir um exemplo apaga o caso salvo. Para guardá-lo, continue o caso e use "Exportar caso" no painel.</p>
    </div>` : '';
  const recebe = ['Custo do teste e de todo o ciclo de vida, por camada', 'Recomendações para você, em ordem de prioridade', 'Diagnóstico de política e governança', 'Plano de contratação em PDF para compartilhar'];
  const barras = [92, 70, 48, 38, 30, 56, 64];
  return `<section class="ini${sv ? ' com-salvo' : ''}" id="inicio" aria-labelledby="ini-t">
    ${salvo}
    <div class="ini-hero">
      <div class="ini-hero-txt">
        <p class="ini-eyebrow"><span>${escI(INICIO.eyebrow)}</span></p>
        <h1 id="ini-t">${escI(INICIO.titulo)}</h1>
        <p class="ini-lead">${escI(INICIO.frase)}</p>
        <div class="ini-acoes">
          <button type="button" class="btn pri ini-cta" data-act="comecar"><span>${escI(INICIO.iniciar)}</span>${ICO_SETA}</button>
        </div>
      </div>
      <aside class="ini-doc" aria-labelledby="ini-doc-t">
        <div class="ini-doc-in">
          <p class="ini-doc-e" id="ini-doc-t">Você recebe</p>
          <ul class="ini-doc-l"><li><span>Plano de contratação com o custo estimado, camada por camada</span></li><li><span>Recomendações de próximos passos, por ordem de prioridade</span></li><li><span>PDF para compartilhar com a sua equipe</span></li></ul>
        </div>
      </aside>
    </div>
    ${mapaFases()}
  </section>`;
}
// Mapa simplificado das quatro fases: título, passos e o que a fase entrega
function mapaFases() {
  const cards = FASES.map(f => {
    const aberta = INICIO_ABERTA === f.id;
    const passos = (PASSOS[f.id] || []).map(([id, nome]) => `<li><span class="ini-pn">${escI((PASSO_INFO[id] || {}).num || '')}</span><span class="ini-pt">${escI(nome)}</span></li>`).join('');
    return `<article class="ini-f f${f.n}${aberta ? ' aberta' : ''}" data-inicio-card="${f.id}">
        <h3 class="ini-f-h"><button type="button" class="ini-f-b" data-inicio-fase="${f.id}" id="ini-b-${f.id}" aria-expanded="${aberta}" aria-controls="ini-p-${f.id}">
          <span class="ini-f-n" aria-hidden="true">${f.n}</span><span class="ini-f-tt"><span class="ini-f-fase">${escI('Fase ' + f.n)}</span><span class="ini-f-nome">${escI(f.nome)}</span></span>${ICO_CHEV}</button></h3>
        <div class="ini-f-corpo">
          <div class="ini-f-bl"><p class="ini-f-l">Passos</p><ol class="ini-passos">${passos}</ol></div>
          <div class="ini-f-res"><p>${escI(f.abertura || '')}</p></div>
        </div>
      </article>
      ${painelFase(f, aberta)}`;
  }).join('');
  return `<section class="ini-mapa" aria-labelledby="ini-mapa-t">
      <div class="ini-mapa-cab">
        <h2 id="ini-mapa-t">${escI(INICIO.mapaSub)}</h2>
      </div>
      <div class="ini-fases">${cards}</div>
      <div class="ini-mapa-pe">
        <button type="button" class="btn ini-vm" data-act="ver-matriz" aria-haspopup="dialog">${ICO_GRADE}<span>${escI(INICIO.verMatriz)}</span></button>
      </div>
    </section>`;
}
// Resumo de uma fase: abertura e a coluna da matriz (texto de cada camada)
function painelFase(f, aberta) {
  const cels = CAMADAS.map(([k, nome]) => {
    const cel = typeof MATRIZ !== 'undefined' && MATRIZ[k] ? MATRIZ[k][f.id] : null;
    if (!cel) return '';
    const ns = numerosCelula(cel.q);
    return `<li class="ini-cel cam-${k}${cel.na ? ' na' : ''}"><span class="ini-cn" aria-hidden="true">${k}</span>
        <div class="ini-cel-c"><p class="ini-cel-n"><span class="sr">${escI('Camada ' + k + ':')} </span><span>${escI(nome)}</span></p>
        <p class="ini-cel-t">${escI(cel.t)}</p>
        ${ns.length ? `<p class="ini-q"><span class="ini-q-l">Perguntas</span> <span class="ini-q-n">${listaNums(ns)}</span></p>` : ''}</div></li>`;
  }).join('');
  return `<div class="ini-p f${f.n}" id="ini-p-${f.id}" role="region" aria-labelledby="ini-pt-${f.id}"${aberta ? '' : ' hidden'}>
      <div class="ini-p-cab">
        <span class="ini-f-n" aria-hidden="true">${f.n}</span>
        <div class="ini-p-tt"><p class="ini-p-e"><span>${escI('Fase ' + f.n)}</span></p><h3 id="ini-pt-${f.id}">${escI(f.nome)}</h3></div>
        <button type="button" class="btn ini-p-x" data-inicio-fase="${f.id}" aria-controls="ini-p-${f.id}" aria-expanded="true"><span aria-hidden="true">✕</span> <span>Fechar o resumo</span></button>
      </div>
      <p class="ini-p-ab">${escI(f.abertura || '')}</p>
    </div>`;
}
// Abre ou fecha uma fase na própria página, sem redesenhar (o foco fica onde está)
function alternarFaseInicio(fid, foco) {
  INICIO_ABERTA = INICIO_ABERTA === fid ? '' : fid;
  document.querySelectorAll('[data-inicio-card]').forEach(c => {
    const id = c.dataset.inicioCard, ab = id === INICIO_ABERTA;
    c.classList.toggle('aberta', ab);
    const b = c.querySelector('.ini-f-b'); if (b) b.setAttribute('aria-expanded', String(ab));
    const m = c.querySelector('.ini-f-mais span'); if (m) m.textContent = ab ? 'Fechar o resumo' : 'Ver o resumo da fase';
    const p = document.getElementById('ini-p-' + id); if (p) p.hidden = !ab;
  });
  const p = INICIO_ABERTA && document.getElementById('ini-p-' + INICIO_ABERTA);
  if (p) {
    const r = p.getBoundingClientRect();
    if (r.top > window.innerHeight - 120 || r.top < 0) {
      const top = r.top + window.scrollY - ((document.querySelector('.top') || { offsetHeight: 0 }).offsetHeight) - 16;
      window.scrollTo({ top, behavior: reduzMov() ? 'auto' : 'smooth' });
    }
  } else if (foco) { const b = document.getElementById('ini-b-' + fid); if (b) b.focus({ preventScroll: false }); }
}

// ----------------------------------------------------------- tabela da matriz (RQ-03)
function renderMatrizTabela(o = {}) {
  if (typeof MATRIZ === 'undefined') return '';
  const caso = !!o.caso;
  let mc = null;
  if (caso && typeof matrizCaso === 'function') { try { mc = matrizCaso(); } catch (e) { mc = null; } }
  const id = o.id || ('mt-' + (caso ? 'caso' : 'geral'));
  const fases = FASES_MATRIZ.map(fid => FASES.find(f => f.id === fid)).filter(Boolean);
  const cab = fases.map(f => `<th scope="col" class="mt-fh f${f.n}"><span class="mt-fn" aria-hidden="true">${f.n}</span><span class="mt-ft"><span class="mt-fe">${escI('Fase ' + f.n)}</span><span class="mt-fnome">${escI(f.nome)}</span></span></th>`).join('');
  const linhas = CAMADAS.map(([k, nome]) => {
    const tds = fases.map(f => {
      const cel = mc ? mc.celulas[k][f.id] : MATRIZ[k][f.id];
      if (!cel) return '<td></td>';
      const est = mc ? cel.estado : (cel.na ? 'na' : '');
      if (cel.na) return `<td class="mt-td na">${caso ? `<p class="mt-st"><span class="mt-selo est-na">${escI(ESTADO_MATRIZ.na)}</span></p>` : `<p class="mt-t">${escI(cel.t)}</p>`}</td>`;
      const ns = numerosCelula(cel.q);
      const custo = mc && mc.custo && cel.custo != null && typeof grande === 'function'
        ? `<span class="mt-v"><span class="mt-vl">Custo</span> <b class="num">${escI(grande(cel.custo))}</b></span>` : '';
      return `<td class="mt-td${est ? ' est-' + est : ''}">
          ${caso ? `<p class="mt-st"><span class="mt-selo est-${est}">${escI(ESTADO_MATRIZ[est] || '')}</span>${custo}</p>` : ''}
          <p class="mt-t">${escI(cel.t)}</p>
          ${ns.length ? `<p class="mt-q"><span class="mt-q-l">Perguntas</span> <span class="mt-q-n">${listaNums(ns)}</span></p>` : ''}</td>`;
    }).join('');
    return `<tr class="cam-${k}"><th scope="row" class="mt-c0"><span class="mt-cn" aria-hidden="true">${k}</span><span class="mt-ct"><span class="mt-ce">${escI('Camada ' + k)}</span><span class="mt-cnome">${escI(nome)}</span></span></th>${tds}</tr>`;
  }).join('');
  const nota = caso ? `<p class="mt-nota">${escI(NOTA_MATRIZ_CUSTO)}</p>` : '';
  return `<div class="mt${caso ? ' mt-caso' : ''}" id="${id}">
    <div class="mt-rol" tabindex="0" role="region" aria-labelledby="${id}-cap">
      <table class="mt-tab"><caption id="${id}-cap"${o.capOculta ? ' class="sr"' : ''}>${escI(TIT_MATRIZ)}</caption>
        <thead><tr><th scope="col" class="mt-c0 mt-cc"><span>Camada</span></th>${cab}</tr></thead>
        <tbody>${linhas}</tbody></table>
    </div>
    <div class="mt-pe">${nota}<p class="mt-cred">${escI(CREDITO_MATRIZ)}</p></div>
  </div>`;
}

// ----------------------------------------------------------- visualizador da matriz
// Mesmo padrão de abrirVisor (fluxo.js): <dialog> modal, Esc, clique no fundo, "Fechar", foco preso e devolvido.
let MATRIZ_VOLTA = null;
function abrirMatriz(volta) {
  let d = document.getElementById('visor-matriz');
  if (!d) {
    d = document.createElement('dialog'); d.id = 'visor-matriz'; d.className = 'visor visor-mat';
    d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'visor-mat-t');
    d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-matriz-fechar]')) { e.stopPropagation(); fecharMatriz(); } });
    d.addEventListener('cancel', e => { e.preventDefault(); fecharMatriz(); });
    d.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); fecharMatriz(); return; }
      if (e.key !== 'Tab') return;
      const f = [...d.querySelectorAll('button, a[href], [tabindex="0"]')].filter(x => !x.disabled && x.offsetParent !== null);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
    });
    document.body.appendChild(d);
  }
  MATRIZ_VOLTA = volta || document.activeElement;
  const caso = typeof S !== 'undefined' && S.boasVindas === false;
  d.innerHTML = `<div class="visor-in">
    <div class="visor-cab"><div class="vm-tt"><h2 id="visor-mat-t">${escI(TIT_MATRIZ)}</h2>
        <p class="vm-sub">${escI(caso ? 'Estado das respostas do seu caso em cada célula e, quando houver estimativa, o custo da camada na fase.' : 'As sete camadas do custo total nas linhas e as quatro fases do percurso nas colunas.')}</p></div>
      <button type="button" class="btn visor-x" data-matriz-fechar><span aria-hidden="true">✕</span> <span>Fechar</span></button></div>
    <div class="visor-corpo vm-corpo">${renderMatrizTabela({ caso, capOculta: true, id: 'mt-visor' })}</div></div>`;
  document.documentElement.classList.add('visor-aberto');
  try { d.showModal(); } catch (e) { d.setAttribute('open', ''); }
  const x = d.querySelector('[data-matriz-fechar]'); if (x) x.focus();
}
function fecharMatriz() {
  const d = document.getElementById('visor-matriz'); if (!d) return;
  try { d.close(); } catch (e) { d.removeAttribute('open'); }
  document.documentElement.classList.remove('visor-aberto');
  const v = MATRIZ_VOLTA; MATRIZ_VOLTA = null;
  if (v && v.isConnected) { try { v.focus({ preventScroll: true }); } catch (e) { } }
}

// ----------------------------------------------------------- eventos
function eventoInicio(e) {
  if (!e || e.type !== 'click' || !e.target || !e.target.closest) return false;
  const el = e.target;
  const vm = el.closest('[data-act="ver-matriz"]');
  if (vm) { e.preventDefault(); abrirMatriz(vm); return true; }
  const b = el.closest('[data-inicio-fase]');
  if (b) { alternarFaseInicio(b.dataset.inicioFase, b.classList.contains('ini-p-x')); return true; }
  // clique em qualquer ponto do cartão da fase (fora de links e botões) faz o mesmo que o botão
  const c = el.closest('[data-inicio-card]');
  if (c && !el.closest('a, button, input, select, textarea, label')) {
    const sel = window.getSelection && String(window.getSelection());
    if (sel) return false;
    alternarFaseInicio(c.dataset.inicioCard, false); return true;
  }
  return false;
}

if (typeof module !== 'undefined') module.exports = { paginaInicial, renderMatrizTabela, abrirMatriz, fecharMatriz, eventoInicio, numerosCelula, RESULTADO_FASE, ESTADO_MATRIZ };
