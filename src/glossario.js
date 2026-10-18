// =====================================================================
// Glossário único (v14, BL2.4): termos técnicos e orçamentários explicados em linguagem simples.
// Nos textos dos painéis "Sobre esta etapa", das dicas das perguntas e das fases, um termo é marcado
// como [[id]] (usa o nome do glossário) ou [[id|texto na frase]]. glossarioTexto() o transforma num termo
// sublinhado que abre a definição (clique, toque, Enter ou Espaço; Esc fecha).
// glossarioLista(lang) devolve a lista traduzida e em ordem alfabética, para o relatório imprimir depois.
// O texto em português é a chave de tradução (i18n/v14_ajuda_<l>.json).
// =====================================================================
// id, termo (como aparece na lista), extenso (opcional, entre parênteses na lista) e def (definição curta)
const GLOSSARIO = [
  { id: 'tco', termo: 'TCO', extenso: 'custo total de propriedade',
    def: 'Custo de ter a ferramenta ao longo de toda a vida dela, e não só o preço de compra: inclui internet, dispositivos, formação, suporte e o tempo das equipes.' },
  { id: 'api', termo: 'API', extenso: 'interface de programação de aplicações',
    def: 'Meio pelo qual um programa usa outro pela internet. Aqui, uma aplicação usa o modelo de IA de uma empresa e a rede paga conforme o uso.' },
  { id: 'pesos', termo: 'Pesos abertos',
    def: 'Modelo de IA publicado para qualquer pessoa instalar e usar. A rede o roda em servidores próprios ou contratados e responde pela operação e pela segurança.' },
  { id: 'eti', termo: 'ETI/FTE', extenso: 'equivalente a tempo integral',
    def: 'Medida do tempo de trabalho: uma pessoa durante o ano inteiro vale 1; duas pessoas em meio período também valem 1. FTE é a sigla em inglês.' },
  { id: 'capital', termo: 'Orçamento de capital',
    def: 'Dinheiro para compras que duram vários anos, como dispositivos ou a ligação com sistemas. As regras mudam de país para país: confirme com a área de orçamento.' },
  { id: 'corrente', termo: 'Orçamento corrente',
    def: 'Dinheiro para as despesas que se repetem, como assinaturas, suporte, conexão e formação. A classificação depende da regra orçamentária de cada jurisdição.' },
  { id: 'desconto', termo: 'Taxa de desconto',
    def: 'Percentual usado para comparar valores pagos em anos diferentes: um valor pago mais tarde pesa menos no total. Zero significa sem desconto. Use a taxa oficial da sua jurisdição.' },
  { id: 'recorrente', termo: 'Custo recorrente',
    def: 'Custo que se repete todo ano enquanto a ferramenta é usada, como assinaturas, suporte e conexão. Não inclui o que se paga uma vez, como a compra de dispositivos.' },
  { id: 'saas', termo: 'SaaS', extenso: 'software como serviço',
    def: 'Produto pronto que a rede assina e usa pelo navegador ou por aplicativo. O fornecedor opera tudo.' },
  { id: 'poc', termo: 'Prova de conceito',
    def: 'Teste técnico, com a equipe e dados de teste, para ver se a solução funciona. Não há professores nem estudantes reais.' },
  { id: 'piloto', termo: 'Piloto',
    def: 'Teste de uso real: professores ou estudantes de poucas escolas usam a ferramenta por tempo limitado.' },
  { id: 'camada', termo: 'Camada',
    def: 'Cada uma das sete partes do custo total da IA na educação, no quadro de Krueger e Jackson (2026, p. 11): da governança à operação e à sustentabilidade.' },
  { id: 'p10p90', termo: 'P10–P90',
    def: 'Faixa de uma simulação de incerteza. Em 10% dos cenários o valor fica abaixo do P10 e em 10% acima do P90; nos 80% restantes, entre os dois.' },
  { id: 'linhabase', termo: 'Linha de base',
    def: 'Medida do problema antes de a IA entrar, por escola ou turma. É o ponto de partida para saber depois se algo melhorou.' },
  { id: 'dotacao', termo: 'Dotação',
    def: 'Valor que o orçamento reserva para pagar as despesas de um exercício. A estimativa mostra quanto solicitar por exercício, só com o desembolso da rede.' },
];
const GLOSSARIO_POR_ID = {};
GLOSSARIO.forEach(g => { GLOSSARIO_POR_ID[g.id] = g; });
const GLOSSARIO_ROT = { titulo: 'Glossário', fechar: 'Fechar', def: 'Definição de' };

const glEsc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Tradução de um texto para o idioma l (sem depender do idioma exibido): PT é a chave; nos idiomas novos o que falta vem do inglês
function glTrad(s, l) {
  l = l || (typeof LANG !== 'undefined' ? LANG : 'pt');
  if (l === 'pt' || s == null) return s;
  const d = typeof dicionario === 'function' ? dicionario(l) : {};
  return d[s] != null ? d[s] : s;
}
// Lista do glossário no idioma l, em ordem alfabética do termo traduzido: [{ id, termo, extenso, definicao }]
function glossarioLista(l) {
  l = l || (typeof LANG !== 'undefined' ? LANG : 'pt');
  const loc = typeof idiomaInfo === 'function' ? idiomaInfo(l).loc : 'pt-BR';
  const L = GLOSSARIO.map(g => ({ id: g.id, termo: glTrad(g.termo, l), extenso: g.extenso ? glTrad(g.extenso, l) : '', definicao: glTrad(g.def, l) }));
  try { L.sort((a, b) => a.termo.localeCompare(b.termo, loc, { sensitivity: 'base' })); } catch (e) { L.sort((a, b) => (a.termo < b.termo ? -1 : 1)); }
  return L;
}
// Todos os textos novos do glossário (para os testes de tradução)
function glossarioTextos() {
  const o = [GLOSSARIO_ROT.titulo, GLOSSARIO_ROT.fechar, GLOSSARIO_ROT.def];
  GLOSSARIO.forEach(g => { o.push(g.termo, g.def); if (g.extenso) o.push(g.extenso); });
  return o;
}
// Texto com termos marcados → HTML seguro. O texto é traduzido antes (a tradução mantém as marcas [[id|…]]).
const RE_GL = /\[\[([a-z0-9]+)(?:\|([^\]]*))?\]\]/g;
function glossarioTexto(s) {
  const t = typeof tr === 'function' ? tr(s) : s;
  let out = '', i = 0, m;
  RE_GL.lastIndex = 0;
  while ((m = RE_GL.exec(t))) {
    out += glEsc(t.slice(i, m.index));
    const g = GLOSSARIO_POR_ID[m[1]];
    const rot = m[2] != null && m[2] !== '' ? m[2] : (g ? (typeof tr === 'function' ? tr(g.termo) : g.termo) : m[1]);
    out += g ? `<span class="gl" role="button" tabindex="0" data-gl="${g.id}" aria-expanded="false" aria-haspopup="dialog">${glEsc(rot)}</span>` : glEsc(rot);
    i = m.index + m[0].length;
  }
  return out + glEsc(t.slice(i));
}
// Texto simples (sem marcas) para o relatório e para os testes
function glossarioSemMarcas(s) { return String(s).replace(RE_GL, (_, id, rot) => rot || (GLOSSARIO_POR_ID[id] || {}).termo || id); }

// ---------------------------------------------------------- definição aberta (um só balão por vez)
let GL_ABERTO = null;
function glossarioFechar(voltarFoco) {
  const p = document.getElementById('gl-pop');
  if (p) p.remove();
  const b = GL_ABERTO; GL_ABERTO = null;
  if (b) {
    b.setAttribute('aria-expanded', 'false'); b.removeAttribute('aria-describedby');
    if (voltarFoco && b.isConnected) { try { b.focus({ preventScroll: true }); } catch (e) { } }
  }
}
function glossarioPosicionar(p, b) {
  const margem = 16, larg = Math.min(340, document.documentElement.clientWidth - 2 * margem);
  p.style.width = larg + 'px';
  const r = b.getBoundingClientRect(), x0 = window.scrollX, y0 = window.scrollY;
  const vw = document.documentElement.clientWidth;
  let left = r.left + x0;
  left = Math.min(left, x0 + vw - margem - larg); left = Math.max(left, x0 + margem);
  p.style.left = left + 'px';
  p.style.top = (r.bottom + y0 + 6) + 'px';
}
function glossarioAbrir(b) {
  const g = GLOSSARIO_POR_ID[b.dataset.gl]; if (!g) return;
  glossarioFechar(false);
  const termo = tr(g.termo), ext = g.extenso ? tr(g.extenso) : '';
  const p = document.createElement('div');
  p.id = 'gl-pop'; p.className = 'gl-pop'; p.setAttribute('role', 'dialog');
  p.setAttribute('aria-label', tr(GLOSSARIO_ROT.def) + ' ' + termo);
  p.innerHTML = `<div class="gl-cab"><b class="gl-t">${glEsc(termo)}</b>${ext ? ` <span class="gl-ext">${glEsc(ext)}</span>` : ''}
    <button type="button" class="gl-x" data-gl-fechar aria-label="${glEsc(tr(GLOSSARIO_ROT.fechar))}">✕</button></div>
    <p class="gl-d">${glEsc(tr(g.def))}</p>`;
  document.body.appendChild(p);
  glossarioPosicionar(p, b);
  b.setAttribute('aria-expanded', 'true'); b.setAttribute('aria-describedby', 'gl-pop');
  GL_ABERTO = b;
}
function ligarGlossario() {
  if (typeof document === 'undefined' || ligarGlossario.feito) return;
  ligarGlossario.feito = true;
  document.addEventListener('click', e => {
    const t = e.target; if (!t || !t.closest) return;
    if (t.closest('[data-gl-fechar]')) { glossarioFechar(true); return; }
    const b = t.closest('[data-gl]');
    if (b) { e.preventDefault(); if (GL_ABERTO === b) glossarioFechar(false); else glossarioAbrir(b); }
  });
  // fora do balão e do termo: fecha (pointerdown também vale para toque)
  document.addEventListener('pointerdown', e => {
    if (!GL_ABERTO) return;
    const t = e.target;
    if (t && t.closest && (t.closest('#gl-pop') || t.closest('[data-gl]'))) return;
    glossarioFechar(false);
  }, true);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && GL_ABERTO) { e.stopPropagation(); glossarioFechar(true); return; }
    const b = e.target && e.target.closest && e.target.closest('[data-gl]');
    if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); if (GL_ABERTO === b) glossarioFechar(false); else glossarioAbrir(b); }
  }, true);
  window.addEventListener('resize', () => { if (GL_ABERTO) glossarioFechar(false); });
}
ligarGlossario();
