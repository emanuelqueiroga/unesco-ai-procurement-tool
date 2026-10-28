// =====================================================================
// PDF do plano de contratação (jsPDF 2.5.2 + jsPDF-AutoTable 3.8.4, Helvetica/WinAnsi). Porte de src/plano_pdf.js
// da v13 (gerarPDF, fontes embutidas, pdfTxt, quebra CJK, árabe e aviso de tradução), sem DOM nem globais:
//   gerarPDF(estado, opts) → documento jsPDF (não baixa nada); nomeArqPDF(estado) → 'procurement-plan-<slug>.pdf'.
// v14: o PDF segue as páginas do plano novo (PAGINAS_PLANO, secoes.js), com os títulos A1–A7 e B1–B9 dentro delas:
//   capa (faixa em gradiente das fases, logos, título, caso, recomendação principal, 4 KPIs, índice, isenção);
//   Em resumo (aviso de plano parcial, recomendação principal, KPIs, barras por camada, fatos);
//   Quanto custa (colunas da dotação por exercício; A2 com a fórmula, custo por camada, dotação e premissas; A3 e pontos de atenção);
//   O que fazer (recomendações: contagem, 5 cartões de prioridade alta e lista por momento; A1, B1–B4, B7–B9);
//   O que exigir (A4–A7, B5, B6);
//   Apêndice (perfil do caso em cartões, matriz camadas × fases em duas páginas, Figura 1 em página própria,
//   referências e respostas que faltam).
// As faixas dos blocos A e B da v13 saem (as seções foram redistribuídas pelas páginas); a cor de cada seção continua
// a do bloco: azul para A, roxo para B. Páginas internas com cabeçalho (fio + título corrido) e rodapé
// "Valores ilustrativos · v<versão>" e "n / N". Corpo 10 pt, tabelas 8,6 pt, 8 pt só em rodapé e legendas.
// Idiomas fora do WinAnsi (ar, zh, bm): fontes de src/plano/fontes_pdf.generated.js (scripts/fontes-pdf.mjs),
// importadas sob demanda; sem esse arquivo (ou com opts.fontes === null), Helvetica e troca de caracteres, como a
// v13 com SEM_FONTES=1.
// =====================================================================
import {
  tr, LOC, getLang, setLang, avisoTraducao, TXT_VINCULO, FAIXA_PLANO, TIT_PLANO,
  din, mil, grande, pct, unidMil, totaisCtx, etapasAtivas, numerosCusto, cfgAtual, somaPorCamada, fmtInt,
  TIPO_REC, QUANDO_REC, PRIO_REC, TIT_REC, TXT_REC, recPorqueTexto, recomendacoesCaso, NOTA_MATRIZ_CUSTO, CREDITO_MATRIZ,
} from '../domain/index.ts';
import { NOME_FERRAMENTA, TIT_PAGINAS, ROT_ESTADO, TXT_MATRIZ, secoesPlano, secoesDaPagina, trSecao, copiaEstado, slugPlano, nomeCamada } from './secoes.js';

// fontes geradas (opcional): import.meta.glob devolve {} quando o arquivo não existe
const FONTES_GERADAS = import.meta.glob('./fontes_pdf.generated.js', { import: 'default' });
// idiomas que pedem fonte embutida (as famílias de tools/subset_fonts.py)
const IDIOMAS_FONTE = ['ar', 'zh', 'bm'];

const PDF_TROCA = { '→': '->', '←': '<-', '≥': '>=', '≤': '<=', '✓': 'v', '✕': 'x', '−': '-', '≈': '~', 'ⓘ': '(i)', ' ': ' ', ' ': ' ', '‑': '-', '‐': '-', '«': '«', '»': '»', '☐': '', '·': '·' };
const CP1252_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
let PDF_FONTE = null;          // família ativa no PDF em geração (null = Helvetica)
function pdfTxt(x) {
  if (PDF_FONTE) return ajustarTextoPDF(x);   // v13: árabe, chinês e bambara (fonte embutida)
  return String(x == null ? '' : x).replace(/[^\x00-\xFF]/g, ch => PDF_TROCA[ch] != null ? PDF_TROCA[ch] : CP1252_EXTRA.includes(ch) ? ch : (ch.normalize('NFKD').replace(/[^\x00-\xFF]/g, '') || ''));
}
// Paleta do relatório (plano/7_relatorio_design.md)
// Cores do PDF: os tokens do design system Prumo (design/redesign/prumo/tokens.json, tema claro), as mesmas da
// interface: azul-petróleo como cor de marca, as quatro cores de fase e as sete cores de camada dos gráficos.
const PDF_COR = {
  tinta: [22, 38, 45], titulo: [10, 68, 83], marca: [14, 90, 107], fundo: [244, 246, 247], linha: [213, 220, 224], muted: [88, 106, 114],
  cab: [225, 239, 242], branco: [255, 255, 255], alta: [176, 46, 38], media: [138, 90, 0], roxo: [111, 95, 168],
  tintA: [225, 239, 242], tintB: [237, 234, 245], ambar: [251, 241, 222], ambarL: [200, 133, 29],
  fases: [[207, 230, 234], [142, 195, 205], [54, 127, 144], [14, 90, 107]],
  fasesS: [[160, 205, 213], [104, 170, 183], [38, 104, 119], [10, 68, 83]],
  // camadas 1–7: tokens layer-1…layer-7 do Prumo (as mesmas barras da página do plano)
  camadas: [null, [14, 90, 107], [59, 125, 179], [111, 95, 168], [138, 109, 47], [156, 79, 122], [63, 138, 90], [100, 118, 135]],
};
// Áreas do perfil do caso: chaves (em português) das linhas do resumo do caso em secoesPlano() (reserva dos cartões)
const PDF_AREAS = [
  ['Contexto', ['Nível administrativo', 'Lugar ou rede', 'Situação']],
  ['Prioridade e impacto', ['Prioridades', 'Problemas marcados', 'Outro problema', 'Como a equipe descreve o problema', 'Situação atual', 'Impacto desejado', 'Resultado esperado e como medir', 'Linha de base', 'Alternativa sem IA comparada']],
  ['Governança de IA na educação', ['Equipe ou instância responsável', 'Política ou estratégia de IA na educação', 'Regulamentação identificada', 'Política de dados educacionais', 'Orientações de uso responsável', 'Regras para a contratação de IA']],
  ['Aplicações e experiência de uso', ['Aplicações', 'Quem usa', 'Quem é afetado', 'O que se faz com a resposta', 'Frequência de uso']],
  ['Adoção e ferramentas', ['Quantas ferramentas', 'Ferramentas já escolhidas', 'Tipo de tecnologia (ferramenta principal)', 'Pagamento (ferramenta principal)', 'Licença', 'Adaptação ao contexto', 'Arquitetura considerada']],
  ['Infraestrutura e dispositivos', ['Internet adequada nas escolas', 'Modelo de uso dos dispositivos', 'Os dispositivos já existem']],
  ['Formação', ['Quem será formado', 'Tipo de formação', 'Formato da formação', 'Horas de formação por pessoa', 'Quem paga a formação']],
  ['Operação e suporte', ['Quem dá suporte aos usuários', 'Nível de suporte', 'Nível de acompanhamento do uso']],
  ['Implantação e expansão', ['Prova de conceito ou piloto', 'Prova de conceito: participantes e duração', 'Piloto: escolas, participantes e duração', 'Primeira etapa da implantação', 'Pessoas que usariam em toda a rede', 'Tempo para chegar a todos depois da implantação', 'Horizonte da estimativa']],
];
const PDF_TXT = {
  sub: 'Plano de contratação', resumo: 'Em resumo', perfil: 'Perfil do caso', recPrincipal: 'Recomendação principal',
  introResumo: 'Os números-chave da estimativa ilustrativa e os fatos que a definem.',
  introPerfil: 'As respostas deste caso, por área. Um traço indica uma pergunta ainda sem resposta.',
  barras: 'Custo por camada', barrasSub: 'Custo total do ciclo de vida por camada do quadro de Krueger e Jackson (2026), com a parte de cada uma.',
  colunas: 'Dotação por exercício', colunasSub: 'Dotação a solicitar em cada exercício',
  fatos: 'Fatos do caso', topRecs: 'Comece por estas', todas: 'Todas as recomendações, por momento',
  indice: 'Neste plano', semCusto: 'Não foi possível calcular a estimativa com as respostas atuais.',
  parcial1: 'Plano parcial: 1 resposta pendente.', parcialN: 'Plano parcial: {0} respostas pendentes.',
  verLista: 'Lista na página {0}.', verRecs: 'Detalhes na página {0}.',
  alta0: 'Nenhuma ação de prioridade alta', alta1: '1 ação de prioridade alta', altaN: '{0} ações de prioridade alta',
  nRecs: '{0} ações no total', ilustr: 'Valores ilustrativos.', gerado: 'Gerado em',
  fEtapas: 'Etapas e estudantes', fApl: 'Aplicações', fQuem: 'Quem usa', fTec: 'Tecnologia e pagamento', fTeste: 'Teste', fEscala: 'Escala',
  estudantes: '{0} estudantes', escolas: '{0} escolas', pessoas: '{0} pessoas na rede', horiz: 'horizonte de {0} anos',
  acao: 'Ação', prio: 'Prioridade',
};
const tP = k => tr(PDF_TXT[k]);
const tPn = (k, n) => tr(PDF_TXT[k].replace('{0}', String(n))).replace('{0}', String(n));

/** Nome do arquivo, como nomeArq('pdf') da v13: procurement-plan-<slug>.pdf */
function nomeArqPDF(estado) { return 'procurement-plan-' + slugPlano(estado) + '.pdf'; }

// ---------------------------------------------------------------- carregamento (sob demanda)
let FONTES_CACHE;   // undefined = ainda não carregado; null = sem fontes
async function carregarFontesPDF() {
  if (FONTES_CACHE !== undefined) return FONTES_CACHE;
  const f = FONTES_GERADAS['./fontes_pdf.generated.js'];
  try { FONTES_CACHE = f ? (await f()) || null : null; } catch (e) { console.warn('fontes do PDF', e); FONTES_CACHE = null; }
  return FONTES_CACHE;
}
let JSPDF = null;
async function carregarJsPDF() {
  if (JSPDF) return JSPDF;
  const [m, at] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const jsPDF = m.jsPDF || (m.default && m.default.jsPDF) || m.default;
  const applyPlugin = at.applyPlugin || (at.default && at.default.applyPlugin);
  if (typeof applyPlugin === 'function') applyPlugin(jsPDF);
  JSPDF = jsPDF;
  return jsPDF;
}
// formato da imagem pela data URI (o jsPDF também detecta pelo conteúdo)
const fmtImg = src => /^data:image\/jpe?g/i.test(String(src)) ? 'JPEG' : /^data:image\/png/i.test(String(src)) ? 'PNG' : undefined;

/**
 * Gera o PDF do plano. Não baixa nem toca o DOM: devolve o documento jsPDF (doc.output('blob' | 'arraybuffer')).
 * opts.versao  versão do app no rodapé (antes VERSAO_APP)
 * opts.logos   imagens dos logos da capa (data URI ou { src, w?, h? }), na ordem: Cátedra, IA.EDU
 * opts.figura  data URI da Figura 1 de Krueger e Jackson (2026); sem ela, a página da figura não sai
 * opts.lang    idioma do documento (os dicionários já devem estar carregados com setDicionarios); padrão: getLang()
 * opts.fontes  objeto FONTES_PDF a usar; null força Helvetica; omitido: o arquivo gerado, se existir
 * opts.data    data impressa na capa (padrão: agora)
 * opts.comprimir  false grava os fluxos sem compressão (testes: o texto fica legível no arquivo)
 */
async function gerarPDF(estado, opts) {
  opts = opts || {};
  const lang0 = getLang(), lang = opts.lang || lang0;
  const jsPDF = await carregarJsPDF();
  const fontes = opts.fontes !== undefined ? opts.fontes : IDIOMAS_FONTE.includes(lang) ? await carregarFontesPDF() : null;
  if (lang !== lang0) setLang(lang);
  try { return montarPDF(jsPDF, estado, opts, fontes, lang); }
  finally { PDF_FONTE = null; if (lang !== lang0) setLang(lang0); }
}

function montarPDF(jsPDF, estado, opts, fontes, lang) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: opts.comprimir !== false });
  fontePDF(doc, fontes, lang);   // v13: fonte embutida nos idiomas fora do WinAnsi (sem efeito em PT/EN/ES/FR)
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 46;
  const TOP = 60, BASE = H - 54, LW = W - 2 * M;   // área útil das páginas internas
  const C = PDF_COR;
  const agora = opts.data instanceof Date ? opts.data : new Date();
  let y = TOP;
  const novaPag = () => { doc.addPage(); y = TOP; };
  const cabe = h => { if (y + h > BASE) { novaPag(); return false; } return true; };
  const fonte = (size, st, cor) => { doc.setFont('helvetica', st || 'normal'); doc.setFontSize(size); if (cor) doc.setTextColor(...cor); };
  const quebra = (s, size, w, st) => { fonte(size, st); return s ? doc.splitTextToSize(pdfTxt(s), w) : []; };
  const LH = size => size * 1.38;
  const RE_URL = /https?:\/\/\S+[^\s.,;)]/;
  // linhas cortadas com reticências (cartões de tamanho fixo)
  const corta = (L, n) => L.length <= n ? L : L.slice(0, n - 1).concat([String(L[n - 1]).replace(/\s*\S*$/, '') + '…']);

  // ---------------------------------------------------------------- dados
  const caso = estado.caso || {}, ctx = estado.ctx || {};
  const nomeCaso = caso.titulo || ctx.olhando || tr('Caso sem título');
  const raw = secoesPlano(estado, { figura: opts.figura || false });
  const secs = raw.map(trSecao);
  let N = null;
  try { N = numerosCusto(cfgAtual(copiaEstado(estado))); if (N && !N.camadas) N.camadas = somaPorCamada(N.av); } catch (e) { console.warn(e); N = null; }
  let R = [];
  try { R = recomendacoesCaso(copiaEstado(estado)) || []; } catch (e) { console.warn(e); R = []; }
  const altas = R.filter(r => r.prioridade === 'alta');
  const resumoRaw = raw.find(s => s.id === 'resumo') || { kv: [] };
  const KV = {}; (resumoRaw.kv || []).forEach(([k, v]) => { KV[k] = v; });
  const kvT = k => { const v = KV[k]; return v == null || v === '' ? '' : tr(v); };
  const faltas = secs.find(s => s.tipo === 'faltas');
  const a1 = secs.find(s => s.id === 'A1') || { p: [] };
  const KPIS = N ? [
    [grande(N.ano0), tr('Custo do Ano 0 (prova de conceito ou piloto)')],
    [grande(N.total), tr('Custo total do ciclo de vida')],
    [grande(N.anual), tr('Dotação média por ano de operação')],
    [din(N.porAluno, 2), tr('Por usuário ativo por ano')],
  ] : [];
  const tarde = [];   // desenhos que dependem de números de página (feitos no fim)

  // ---------------------------------------------------------------- primitivas
  const texto = (s, o = {}) => {
    const size = o.size || 10, lh = LH(size), ind = o.ind || 0, x0 = (o.x != null ? o.x : M);
    let str = String(s == null ? '' : s), url = '';
    const m = str.match(RE_URL);
    if (m) { url = m[0]; str = str.replace(url, '').replace(/\s{2,}/g, ' ').trim(); }
    const linhas = quebra(str, size, (o.w || LW) - ind, o.b ? 'bold' : o.i ? 'italic' : 'normal');
    // itens curtos não se partem entre páginas
    if (linhas.length > 1 && linhas.length <= 6) cabe(linhas.length * lh);
    linhas.forEach((l, i) => {
      cabe(lh);
      fonte(size, o.b ? 'bold' : o.i ? 'italic' : 'normal', o.cor || C.tinta);
      if (o.bullet && i === 0) { doc.setFillColor(...(o.corBullet || C.marca)); doc.rect(x0 + 2, y + size * 0.42, 3.2, 3.2, 'F'); }
      doc.text(l, x0 + ind, y + size); y += lh;
    });
    if (url) {
      cabe(lh); fonte(size, 'normal', C.marca);
      if (o.bullet && !linhas.length) { doc.setFillColor(...(o.corBullet || C.marca)); doc.rect(x0 + 2, y + size * 0.42, 3.2, 3.2, 'F'); }
      doc.textWithLink(url, x0 + ind, y + size, { url }); y += lh;
    }
    y += o.after == null ? 4 : o.after;
  };
  const altTexto = (s, size, w, st) => quebra(s, size, w, st).length * LH(size);
  // título de primeiro nível (Em resumo, recomendações, perfil, matriz, referências, respostas que faltam)
  const tituloSec = (h, intro, cor) => {
    fonte(20, 'bold');
    const L = quebra(h, 20, LW, 'bold');
    cabe(L.length * 26 + 70);
    doc.setFillColor(...(cor || C.marca)); doc.rect(M, y, 34, 3.2, 'F');
    y += 12;
    fonte(20, 'bold', C.titulo); L.forEach(l => { doc.text(l, M, y + 18); y += 26; });
    y += 2;
    if (intro) texto(intro, { size: 10.5, cor: C.muted, after: 10 });
    else y += 8;
  };
  const subtitulo = (h, cor, prox) => {
    const L = quebra(h, 11.5, LW, 'bold');
    cabe(L.length * 15.5 + (prox || 44));
    y += 4;
    fonte(11.5, 'bold', cor || C.marca); L.forEach(l => { doc.text(l, M, y + 11.5); y += 15.5; });
    y += 3;
  };
  const cartaoKPI = (x, yy, w, h, v, l, cor, sizeV) => {
    doc.setDrawColor(...C.linha); doc.setLineWidth(0.7); doc.setFillColor(...C.branco);
    doc.roundedRect(x, yy, w, h, 6, 6, 'FD');
    doc.setFillColor(...cor); doc.rect(x + 12, yy, 28, 3, 'F');
    fonte(sizeV, 'bold', C.titulo); doc.text(pdfTxt(v), x + 12, yy + 14 + sizeV);
    const L = corta(quebra(l, 8.6, w - 24), 3);
    fonte(8.6, 'normal', C.muted); L.forEach((z, i) => doc.text(z, x + 12, yy + 24 + sizeV + 2 + i * 11.4));
  };
  const etiqueta = (x, yy, s, fundo, cor, size = 8.2) => {
    fonte(size, 'bold'); const t = pdfTxt(s), w = doc.getTextWidth(t) + 10;
    doc.setFillColor(...fundo); doc.roundedRect(x, yy, w, size + 6, 3, 3, 'F');
    doc.setTextColor(...cor); doc.text(t, x + 5, yy + size + 1.6);
    return w;
  };
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const ehLink = (x, yy, w, h, pag) => doc.link(x, yy, w, h, { pageNumber: pag });

  // ---------------------------------------------------------------- tabelas (tema único)
  const ALERTA = [tr('Resolver antes de contratar')].map(pdfTxt);
  const ATENCAO = [tr('Tratar no plano')].map(pdfTxt), MARCAR = [tr('Alta'), tr('Prioridade')].map(pdfTxt);
  const RE_CAM = /^([1-7])\.\s/;
  // altura aproximada da tabela (para não partir tabelas curtas entre páginas)
  const altTabela = (head, rows, t) => {
    const nc = (head || rows[0] || []).length, larg = t.larg || [];
    const fixo = larg.reduce((a, b) => a + (b || 0), 0), livres = nc - larg.filter(Boolean).length;
    const wc = i => larg[i] || Math.max(40, (LW - 2 * (t.dx || 0) - fixo) / Math.max(1, livres));
    const lin = r => Math.max(1, ...r.map((z, i) => quebra(String(z == null ? '' : z), 8.6, wc(i) - 10).length));
    return (head ? 10 + lin(head) * 10.3 + 2 : 0) + rows.reduce((s, r) => s + 10 + lin(r) * 10.3, 0);
  };
  const tabela = (head, rows, t = {}, cor) => {
    const hT = altTabela(head, rows, t);
    // tabela curta fica inteira; longa começa com pelo menos o cabeçalho e duas linhas
    if (y + hT > BASE) cabe(hT < 260 ? hT + 4 : head ? 70 : 34);
    if (t.grupo) rows = rows.map((r, i) => i && r[0] === rows[i - 1][0] ? [''].concat(r.slice(1)) : r);
    const cs = {};
    (t.larg || []).forEach((wd, i) => { if (wd) cs[i] = { cellWidth: wd }; });
    fonte(8.6, 'normal');
    (t.num || []).forEach(i => {
      const wmax = Math.max(0, ...rows.map(r => doc.getTextWidth(pdfTxt(r[i] == null ? '' : r[i]))));
      cs[i] = Object.assign(cs[i] || {}, { halign: 'right', minCellWidth: Math.ceil(wmax + 12) });
    });
    const hl = t.hl || [], tot = t.tot || [], camadas = !!(head && head[0] === tr('Camada'));
    if (camadas) cs[0] = Object.assign(cs[0] || {}, { cellPadding: { top: 5, bottom: 5, left: 15, right: 5 } });
    doc.autoTable({
      startY: y, rowPageBreak: 'avoid', columnStyles: cs, theme: 'plain',
      margin: { left: M + (t.dx || 0), right: M + (t.dx || 0), top: TOP, bottom: H - BASE },
      head: head ? [head.map(pdfTxt)] : undefined, body: rows.map(r => r.map(pdfTxt)),
      styles: { font: 'helvetica', fontSize: 8.6, cellPadding: 5, textColor: C.tinta, lineColor: C.linha, lineWidth: { bottom: 0.5 }, overflow: 'linebreak', valign: 'top' },
      headStyles: { fillColor: C.cab, textColor: C.titulo, fontStyle: 'bold', lineWidth: { bottom: 0.9 }, lineColor: cor || C.marca },
      didParseCell: dd => {
        if (dd.section !== 'body') return; const v = String(dd.cell.raw || '');
        if (ALERTA.includes(v)) { dd.cell.styles.textColor = C.alta; dd.cell.styles.fontStyle = 'bold'; }
        else if (ATENCAO.includes(v) || ((t.marca || []).includes(dd.column.index) && MARCAR.includes(v))) { dd.cell.styles.textColor = C.media; dd.cell.styles.fontStyle = 'bold'; }
        if (hl.includes(dd.row.index)) dd.cell.styles.fillColor = C.tintA;
        if (tot.includes(dd.row.index)) { dd.cell.styles.fontStyle = 'bold'; dd.cell.styles.fillColor = C.fundo; dd.cell.styles.textColor = C.titulo; }
        if ((t.grupo || t.b0) && dd.column.index === 0) { dd.cell.styles.fontStyle = 'bold'; dd.cell.styles.textColor = C.titulo; }
      },
      didDrawCell: dd => {
        if (!camadas || dd.section !== 'body' || dd.column.index !== 0) return;
        const m = String(dd.cell.raw || '').match(RE_CAM); if (!m) return;
        doc.setFillColor(...C.camadas[+m[1]]); doc.roundedRect(dd.cell.x + 4, dd.cell.y + 6, 7, 7, 1.5, 1.5, 'F');
      },
    });
    y = doc.lastAutoTable.finalY + 10;
  };

  // ---------------------------------------------------------------- capa
  let pagRecs = 0, pagFaltas = 0, pagResumo = 0;
  const INDICE = [];   // [título, página] para o índice da capa
  // recomendação principal: a frase principal de A1 primeiro; sem ela, as frases de A1 (sem "Por quê:")
  const frasesPrincipais = n => {
    const fr = (a1.p || []).filter(z => z && z !== tr('Por quê:'));
    return a1.principal ? [a1.principal].concat(fr.filter(z => z !== a1.principal)).slice(0, n) : fr.slice(0, n + 1);
  };
  const capa = () => {
    const BH = 128, n = 160;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1) * 3, k = Math.min(2, Math.floor(t));
      doc.setFillColor(...mix(C.fases[k], C.fases[k + 1], t - k));
      doc.rect(W * i / n, 0, W / n + 0.6, BH, 'F');
    }
    // logos sobre placa branca (opts.logos; na v13, as <img class="logo"> da página)
    const vistos = new Set();
    const imgs = (opts.logos || []).map(z => (typeof z === 'string' ? { src: z } : z || {})).filter(im => im.src && !vistos.has(im.src) && vistos.add(im.src)).slice(0, 2);
    if (imgs.length) {
      const hL = 40, pad = 12, gap = 16;
      const ws = imgs.map(im => {
        let r = +im.w > 0 && +im.h > 0 ? im.w / im.h : 0;
        if (!r) { try { const pr = doc.getImageProperties(im.src); r = pr.width / pr.height; } catch (e) { r = 2; } }
        return hL * (r || 2);
      });
      const wPl = ws.reduce((a, b) => a + b, 0) + gap * (imgs.length - 1) + 2 * pad;
      doc.setFillColor(...C.branco); doc.roundedRect(M, 40, wPl, hL + 2 * 9, 8, 8, 'F');
      let x = M + pad;
      imgs.forEach((im, i) => {
        try { doc.addImage(im.src, fmtImg(im.src) || 'PNG', x, 49, ws[i], hL); } catch (e) { console.warn(e); }
        x += ws[i];
        if (i < imgs.length - 1) { doc.setDrawColor(...C.linha); doc.setLineWidth(0.7); doc.line(x + gap / 2, 52, x + gap / 2, 49 + hL - 3); x += gap; }
      });
    }
    fonte(9, 'bold', C.branco);
    doc.text(pdfTxt(tP('sub').toUpperCase()), W - M, 66, { align: 'right', charSpace: 0.6 });
    fonte(9, 'normal', C.branco);
    doc.text(pdfTxt(agora.toLocaleDateString(LOC(), { year: 'numeric', month: 'long', day: 'numeric' })), W - M, 80, { align: 'right' });

    y = BH + 40;
    fonte(12, 'bold', C.marca); doc.text(pdfTxt(NOME_FERRAMENTA), M, y); y += 34;
    fonte(30, 'bold', C.titulo); doc.text(pdfTxt(tP('sub')), M, y); y += 18;
    doc.setFillColor(...C.marca); doc.rect(M, y, 46, 3.2, 'F'); y += 22;
    const LC = corta(quebra(nomeCaso, 20, LW, 'bold'), 3);
    fonte(20, 'bold', C.tinta); LC.forEach(l => { doc.text(l, M, y + 16); y += 25; });
    fonte(10.5, 'normal', C.muted);
    doc.text(pdfTxt([ctx.local, tP('gerado') + ' ' + agora.toLocaleDateString(LOC())].filter(Boolean).join('  ·  ')), M, y + 10);
    y += 30;

    // recomendação principal: as frases de A1 e o número de ações de prioridade alta
    const frases = frasesPrincipais(2);
    const Lr = frases.map((f, i) => i === 0 ? quebra(f, 11.5, LW - 36, 'bold') : quebra(f, 10.5, LW - 36));
    const nA = altas.length;
    const linhaA = nA === 0 ? tP('alta0') : nA === 1 ? tP('alta1') : tPn('altaN', nA);
    const hBox = 34 + Lr.reduce((s, L) => s + L.length * 15.5 + 4, 0) + 26;
    doc.setFillColor(...C.fundo); doc.roundedRect(M, y, LW, hBox, 8, 8, 'F');
    doc.setFillColor(...C.marca); doc.rect(M, y + 8, 4, hBox - 16, 'F');
    fonte(8.6, 'bold', C.marca); doc.text(pdfTxt(tP('recPrincipal').toUpperCase()), M + 20, y + 22, { charSpace: 0.5 });
    let yy = y + 34;
    Lr.forEach((L, i) => { fonte(i === 0 ? 11.5 : 10.5, i === 0 ? 'bold' : 'normal', i === 0 ? C.titulo : C.tinta); L.forEach(l => { doc.text(l, M + 20, yy + 11); yy += 15.5; }); yy += 4; });
    // linha das ações de prioridade alta (com o número da página das recomendações, no fim)
    const yA = yy + 6;
    doc.setFillColor(...(nA ? C.alta : C.muted)); doc.circle(M + 24, yA + 4.5, 3.4, 'F');
    fonte(10, 'bold', nA ? C.alta : C.muted); doc.text(pdfTxt(linhaA), M + 33, yA + 8);
    const wA = doc.getTextWidth(pdfTxt(linhaA));
    tarde.push(() => {
      if (!pagRecs) return;
      doc.setPage(1); fonte(10, 'normal', C.muted);
      const s = pdfTxt(tPn('verRecs', pagRecs));
      doc.text(s, M + 39 + wA, yA + 8); ehLink(M + 20, yA - 4, wA + 30 + doc.getTextWidth(s), 16, pagRecs);
    });
    y += hBox + 18;

    // KPIs 2×2
    if (KPIS.length) {
      const g = 12, w = (LW - g) / 2, h = 68;
      KPIS.forEach(([v, l], i) => cartaoKPI(M + (i % 2) * (w + g), y + Math.floor(i / 2) * (h + g), w, h, v, l, C.fasesS[i], 20));
      y += 2 * h + g;
      fonte(8, 'italic', C.muted); doc.text(pdfTxt(tP('ilustr')), M, y + 14);
      y += 22;
    }
    // "Neste plano": índice com páginas e links (preenchido no fim, quando as páginas são conhecidas)
    const yI = y + 14, hIsen = quebra(tr(FAIXA_PLANO), 8.6, LW - 24).length * 11.8 + 16, limI = H - 40 - hIsen - 22;
    tarde.push(() => {
      const itens = INDICE.filter(z => z[1]);
      if (!itens.length) return;
      doc.setPage(1);
      const lin = Math.ceil(itens.length / 2), g = 24, wI = (LW - g) / 2;
      const hl = Math.min(17, (limI - yI - 16) / lin);
      if (hl < 14) return;
      fonte(8.6, 'bold', C.marca); doc.text(pdfTxt(tP('indice').toUpperCase()), M, yI + 8, { charSpace: 0.5 });
      itens.forEach(([t, pg, nivel], i) => {
        const x = M + (i % 2) * (wI + g), yy = yI + 16 + Math.floor(i / 2) * hl;   // por linhas: a ordem de leitura segue a do plano
        fonte(9.6, nivel ? 'normal' : 'bold', nivel ? C.tinta : C.titulo);
        const pre = nivel ? '   ' : '';
        let tt = pdfTxt(t); while (doc.getTextWidth(pre + tt) > wI - 30 && tt.length > 8) tt = tt.slice(0, -2);
        if (tt !== pdfTxt(t)) tt = tt.replace(/\s*\S?$/, '') + '…';
        doc.text(pre + tt, x, yy + 10);
        fonte(9.6, 'bold', C.titulo); doc.text(String(pg), x + wI, yy + 10, { align: 'right' });
        doc.setDrawColor(...C.linha); doc.setLineWidth(0.5); doc.line(x, yy + hl - 2.5, x + wI, yy + hl - 2.5);
        ehLink(x, yy, wI, hl, pg);
      });
    });
    // isenção no pé
    const Lf = quebra(tr(FAIXA_PLANO), 8.6, LW - 24);
    const hf = Lf.length * 11.8 + 16, yf = H - 40 - hf;
    doc.setDrawColor(...C.linha); doc.setLineWidth(0.7); doc.line(M, yf - 12, W - M, yf - 12);
    fonte(8.6, 'normal', C.muted); Lf.forEach((l, i) => doc.text(l, M, yf + 9 + i * 11.8));
    fonte(8, 'normal', C.muted); quebra(tr(TXT_VINCULO), 8, LW).forEach((l, i) => doc.text(l, M, H - 32 + i * 10));
  };

  // ---------------------------------------------------------------- abertura das páginas do plano (v14)
  let corB = C.marca, tintB = C.tintA;
  const COR_PAG = { custa: C.marca, fazer: C.fasesS[2], exigir: C.roxo, apendice: C.titulo };
  const aberturaPagina = pg => {
    novaPag();
    const h = 64, cor = COR_PAG[pg] || C.marca, tit = tr(TIT_PAGINAS[pg]);
    INDICE.push([tit, doc.getNumberOfPages(), 0]);
    doc.setFillColor(...cor); doc.roundedRect(M, y, LW, h, 8, 8, 'F');
    fonte(9, 'bold', C.branco); doc.text(pdfTxt(tP('sub').toUpperCase()), M + 20, y + 22, { charSpace: 0.5 });
    fonte(20, 'bold', C.branco); doc.text(pdfTxt(tit), M + 20, y + 47);
    y += h + 18;
  };

  // ---------------------------------------------------------------- Em resumo
  const emResumo = () => {
    novaPag(); pagResumo = doc.getNumberOfPages(); INDICE.push([tP('resumo'), pagResumo, 0]);
    tituloSec(tP('resumo'), tP('introResumo'));
    if (faltas) {
      const s = faltas.list.length === 1 ? tP('parcial1') : tPn('parcialN', faltas.list.length);
      const h = 26;
      doc.setFillColor(...C.ambar); doc.setDrawColor(...C.ambarL); doc.setLineWidth(0.6); doc.roundedRect(M, y, LW, h, 5, 5, 'FD');
      fonte(9.6, 'bold', C.media); doc.text(pdfTxt(s), M + 12, y + 16.5);
      const w1 = doc.getTextWidth(pdfTxt(s)), y0 = y, p0 = pagResumo;
      tarde.push(() => {
        if (!pagFaltas) return;
        doc.setPage(p0); fonte(9.6, 'normal', C.media);
        const t = pdfTxt(tPn('verLista', pagFaltas));
        doc.text(t, M + 18 + w1, y0 + 16.5); ehLink(M, y0, LW, h, pagFaltas);
      });
      y += h + 14;
    }
    // v14: recomendação principal (frase de A1) no alto do Em resumo
    const fr = frasesPrincipais(1)[0];
    if (fr) {
      const L = quebra(fr, 10.5, LW - 36, 'bold'), h = 30 + L.length * 14 + 8;
      doc.setFillColor(...C.fundo); doc.roundedRect(M, y, LW, h, 7, 7, 'F');
      doc.setFillColor(...C.marca); doc.rect(M, y + 7, 4, h - 14, 'F');
      fonte(8.2, 'bold', C.marca); doc.text(pdfTxt(tP('recPrincipal').toUpperCase()), M + 18, y + 17, { charSpace: 0.5 });
      fonte(10.5, 'bold', C.titulo); L.forEach((l, i) => doc.text(l, M + 18, y + 33 + i * 14));
      y += h + 14;
    }
    if (!N) { texto(tP('semCusto'), { cor: C.muted }); }
    else {
      // 4 KPIs
      const g = 10, w = (LW - 3 * g) / 4, h = 68;
      KPIS.forEach(([v, l], i) => cartaoKPI(M + i * (w + g), y, w, h, v, l, C.fasesS[i], 14.5));
      y += h + 18;
      // barras por camada (custo total do ciclo)
      const cam = N.camadas || { total: {} };
      const vals = [1, 2, 3, 4, 5, 6, 7].map(n => cam.total[n] || 0);
      const tot = vals.reduce((a, b) => a + b, 0);
      cabe(17 + 30 + 7 * 21 + 22);
      fonte(12, 'bold', C.titulo); doc.text(pdfTxt(tP('barras')), M, y + 11); y += 17;
      texto(tP('barrasSub'), { size: 8.6, cor: C.muted, after: 5 });
      const wRot = 204, wVal = 100, x0 = M + wRot + 8, wBar = LW - wRot - 8 - wVal, max = Math.max(1, ...vals);
      [1, 2, 3, 4, 5, 6, 7].forEach((n, i) => {
        const L = corta(quebra(n + '. ' + tr(nomeCamada(n)), 8.6, wRot), 2);
        const hRow = Math.max(19, L.length * 10.6 + 7);
        fonte(8.6, 'normal', C.tinta); L.forEach((l, j) => doc.text(l, M, y + 9 + j * 10.6 + (L.length === 1 ? 4 : 0)));
        doc.setFillColor(...C.fundo); doc.rect(x0, y + 3, wBar, 12, 'F');
        const bw = Math.max(0, vals[i]) / max * wBar;
        doc.setFillColor(...C.camadas[n]); if (bw > 0) doc.rect(x0, y + 3, Math.max(1.5, bw), 12, 'F');
        fonte(8.6, 'bold', C.titulo); doc.text(pdfTxt(grande(vals[i])), x0 + wBar + 8, y + 12.5);
        fonte(8.6, 'normal', C.muted); doc.text(pdfTxt(pct(tot ? vals[i] / tot : 0)), W - M, y + 12.5, { align: 'right' });
        y += hRow;
      });
      fonte(8.6, 'bold', C.titulo); doc.text(pdfTxt(tr('Total')), M, y + 10);
      doc.text(pdfTxt(grande(tot)), x0 + wBar + 8, y + 10); fonte(8.6, 'normal', C.muted); doc.text('100%', W - M, y + 10, { align: 'right' });
      y += 22;
    }
    // fatos do caso: os mesmos da página (resumo.fatos); senão, montados aqui
    const t = totaisCtx(ctx);
    const etN = etapasAtivas(ctx).map(e => tr(e[1])).join('; ');
    const teste = [kvT('Prova de conceito ou piloto'), kvT('Prova de conceito: participantes e duração'), kvT('Piloto: escolas, participantes e duração')].filter(z => z && z !== '—').join(' · ');
    const eleg = +caso.elegiveis || 0, hz = +caso.horizonte || 0;
    const fatosPag = Array.isArray(resumoRaw.fatos) && resumoRaw.fatos.length ? resumoRaw.fatos.map(([k, v]) => [tr(k), tr(v)]) : null;
    const fatos = fatosPag || [
      [tP('fEtapas'), [etN, t.escolas ? tPn('escolas', fmtInt(t.escolas)) : '', t.alunos ? tPn('estudantes', fmtInt(t.alunos)) : ''].filter(Boolean).join(' · ')],
      [tP('fApl'), kvT('Aplicações')],
      [tP('fQuem'), kvT('Quem usa')],
      [tP('fTec'), [kvT('Tipo de tecnologia (ferramenta principal)'), kvT('Pagamento (ferramenta principal)')].filter(z => z && z !== '—').join(' · ')],
      [tP('fTeste'), teste],
      [tP('fEscala'), [eleg ? tPn('pessoas', fmtInt(eleg)) : '', hz ? tPn('horiz', hz) : ''].filter(Boolean).join(' · ')],
    ];
    if (!fatos.length) return;
    const g = 10, w = (LW - 2 * g) / 3;
    const altF = fatos.map(([, v]) => corta(quebra(v || '—', 9, w - 20), 3).length);
    const hF = Math.max(...altF) * 12 + 30;
    const nL = Math.ceil(fatos.length / 3);
    cabe(18 + nL * (hF + g) + 4);
    fonte(12, 'bold', C.titulo); doc.text(pdfTxt(tP('fatos')), M, y + 11); y += 19;
    fatos.forEach(([k, v], i) => {
      const x = M + (i % 3) * (w + g), yy = y + Math.floor(i / 3) * (hF + g);
      doc.setFillColor(...C.fundo); doc.roundedRect(x, yy, w, hF, 7, 7, 'F');
      fonte(8, 'bold', C.marca); doc.text(pdfTxt(k.toUpperCase()), x + 10, yy + 16, { charSpace: 0.3 });
      const L = corta(quebra(v || '—', 9, w - 20), 3);
      fonte(9, 'normal', v ? C.tinta : C.muted); L.forEach((l, j) => doc.text(l, x + 10, yy + 29 + j * 12));
    });
    y += nL * (hF + g) - g + 6;
  };

  // colunas por exercício (dotação a solicitar): v14, no alto de "Quanto custa" (na v13, no Em resumo)
  const colunasExercicio = () => {
    if (!N) return;
    const anos = N.av.r.anos, dot = anos.map(a => (N.orc.dot || {})[a] || 0);
    cabe(150);
    fonte(12, 'bold', C.titulo); doc.text(pdfTxt(tP('colunas')), M, y + 11); y += 17;
    texto(tr(PDF_TXT.colunasSub) + ' (' + unidMil() + ').', { size: 8.6, cor: C.muted, after: 2 });
    const hCh = 72, yB = y + 16 + hCh, mx = Math.max(1, ...dot);
    const passo = LW / anos.length, wc = Math.min(54, passo * 0.56);
    doc.setDrawColor(...C.linha); doc.setLineWidth(0.5);
    [0.5, 1].forEach(f => doc.line(M, yB - hCh * f, W - M, yB - hCh * f));
    anos.forEach((a, i) => {
      const hc = Math.max(0, dot[i]) / mx * hCh, cx = M + passo * i + (passo - wc) / 2;
      const cor = a === 0 ? C.fases[1] : a === 1 ? C.fases[2] : C.fases[3];
      doc.setFillColor(...cor); if (hc > 0) doc.rect(cx, yB - hc, wc, Math.max(1, hc), 'F');
      fonte(8.6, 'bold', C.titulo); doc.text(pdfTxt(mil(dot[i])), cx + wc / 2, yB - hc - 5, { align: 'center' });
      fonte(8.6, 'normal', C.muted); doc.text(pdfTxt(tr('Ano ' + a)), cx + wc / 2, yB + 13, { align: 'center' });
    });
    doc.setDrawColor(...C.muted); doc.setLineWidth(0.8); doc.line(M, yB, W - M, yB);
    y = yB + 26;
  };

  // ---------------------------------------------------------------- Matriz do caso (v13, RQ-03 e RQ-20)
  // Duas páginas retrato (fases 1 e 2; fases 3 e 4), sem corte de texto: cada célula traz o texto, os números das
  // perguntas, o estado das respostas e, com a estimativa completa, o custo (soma das células = total do ciclo).
  const ESTADO_COR = { ok: [[232, 244, 236], [30, 107, 58]], andamento: [C.ambar, C.media], pendente: [[251, 236, 235], C.alta], orientacao: [C.cab, C.titulo], na: [C.fundo, C.muted] };
  const matriz = () => {
    const sM = raw.find(s => s.id === 'matriz' && !s.sub);
    if (!sM || !sM.mx) return;
    const m = sM.mx, TM = TXT_MATRIZ, ROT = ROT_ESTADO;
    const FS = 8.6, FQ = 8, LT = 10.6, LQ = 9.8, HB = 14, pad = 5.5, lhA = FS * 1.15;
    const w0 = 112, wF = (LW - w0) / 2;
    const layout = c => {
      const iw = wF - 2 * pad;
      const Lt = quebra(tr(c.t), FS, iw, c.na ? 'italic' : 'normal');
      const Lq = !c.na && c.n.length ? quebra(tr(TM.perguntas) + ' ' + c.n.join(', '), FQ, iw) : [];
      const badge = !c.na;
      return { Lt, Lq, badge, h: Lt.length * LT + (Lq.length ? 3 + Lq.length * LQ : 0) + (badge ? 5 + HB : 0) };
    };
    const legenda = () => {
      fonte(8.6, 'bold', C.muted);
      const t0 = pdfTxt(tr(TM.legenda) + ':'); doc.text(t0, M, y + 10.5);
      let x = M + doc.getTextWidth(t0) + 8;
      ['ok', 'andamento', 'pendente', 'orientacao', 'na'].forEach(k => { x += etiqueta(x, y, tr(ROT[k] || k), ESTADO_COR[k][0], ESTADO_COR[k][1], 8) + 5; });
      y += 24;
    };
    [[0, 1], [2, 3]].forEach((par, gi) => {
      novaPag();
      if (!gi) INDICE.push([tr(sM.h), doc.getNumberOfPages(), 1]);
      tituloSec(tr(sM.h) + (gi ? ' (' + tr('continuação') + ')' : ''), gi ? '' : tr(sM.intro || ''), C.titulo);
      legenda();
      const fases = par.map(i => Object.assign({ i }, m.fases[i]));
      const head = [[tr(TM.camada)].concat(fases.map(f => f.n + '. ' + tr(f.nome)))].map(r => r.map(pdfTxt));
      const body = m.linhas.map(l => [{ content: pdfTxt(l.n + '. ' + tr(l.nome)), camada: l.n }].concat(par.map(i => {
        const c = l.cel[i], L = layout(c);
        return { content: '', styles: { minCellHeight: Math.ceil(L.h + 2 * pad) }, mx: c, L };
      })));
      if (m.custo) body.push([pdfTxt(tr('Total'))].concat(par.map(i => pdfTxt(m.somas[i] == null ? '—' : grande(m.somas[i])))));
      // notas ao pé; se a tabela e as notas não couberem juntas, as notas vêm antes da tabela (nenhuma página quase vazia)
      const notas = (gi ? [m.custo ? tr(NOTA_MATRIZ_CUSTO) : tr(TM.semCusto)] : []).concat([tr(CREDITO_MATRIZ)]);
      const soma = gi && m.custo;
      const hNotas = (soma ? 22 : 0) + notas.reduce((a, z) => a + altTexto(z, 8.6, LW, 'italic') + 2, 0) + 12;
      const hTab = 9 + 6 + 2 * LH(9.4) + body.reduce((a, r) => a + 2 * pad + Math.max(...r.map((z, j) => {
        if (z && z.L) return Math.ceil(z.L.h + 2 * pad) - 2 * pad;
        return quebra(typeof z === 'object' ? z.content : z, j ? FS : 9.4, (j ? wF : w0) - (j ? 2 * pad : pad + 14), 'bold').length * lhA;
      })), 0);
      const notasAntes = y + hTab + hNotas > BASE && y + hTab <= BASE;
      const fazNotas = () => {
        if (soma) {
          const t1 = pdfTxt(tr(TM.soma)), t2 = pdfTxt(grande(m.total));
          cabe(20); fonte(10, 'normal', C.tinta); doc.text(t1, M, y + 10);
          const w1 = doc.getTextWidth(t1);
          fonte(10, 'bold', C.titulo); doc.text(t2, M + w1 + 4, y + 10);
          y += 22;
        }
        notas.forEach(z => texto(z, { i: true, size: 8.6, cor: C.muted, after: 2 }));
      };
      if (notasAntes) { fazNotas(); y += 6; }
      doc.autoTable({
        startY: y, rowPageBreak: 'avoid', theme: 'plain', margin: { left: M, right: M, top: TOP, bottom: H - BASE },
        head, body,
        styles: { font: 'helvetica', fontSize: FS, cellPadding: pad, textColor: C.tinta, lineColor: C.linha, lineWidth: { bottom: 0.5 }, overflow: 'linebreak', valign: 'top' },
        headStyles: { fillColor: C.cab, textColor: C.titulo, fontStyle: 'bold', fontSize: 9.4, cellPadding: { top: 9, bottom: 6, left: pad, right: pad }, lineWidth: { bottom: 0.9 }, lineColor: C.marca },
        columnStyles: { 0: { cellWidth: w0, fontStyle: 'bold', textColor: C.titulo, cellPadding: { top: pad, bottom: pad, left: 14, right: pad } }, 1: { cellWidth: wF }, 2: { cellWidth: wF } },
        didParseCell: dd => {
          const r = dd.cell.raw;
          if (dd.section === 'body' && r && r.mx && r.mx.na) dd.cell.styles.fillColor = C.fundo;
          if (dd.section === 'body' && m.custo && dd.row.index === body.length - 1) { dd.cell.styles.fontStyle = 'bold'; dd.cell.styles.fillColor = C.fundo; dd.cell.styles.textColor = C.titulo; dd.cell.styles.fontSize = 9.4; }
        },
        didDrawCell: dd => {
          const r = dd.cell.raw, x = dd.cell.x, yy = dd.cell.y;
          if (dd.section === 'head' && dd.column.index > 0) { doc.setFillColor(...C.fasesS[fases[dd.column.index - 1].i]); doc.rect(x, yy, dd.cell.width - 3, 3, 'F'); return; }
          if (dd.section !== 'body' || !r || typeof r !== 'object') return;
          if (r.camada) { doc.setFillColor(...C.camadas[r.camada]); doc.rect(x, yy + 0.5, 4.5, dd.cell.height - 1, 'F'); return; }
          if (!r.mx) return;
          const c = r.mx, L = r.L, x0 = x + pad, iw = dd.cell.width - 2 * pad;
          if (dd.column.index > 1) { doc.setDrawColor(...C.linha); doc.setLineWidth(0.5); doc.line(x, yy, x, yy + dd.cell.height); }
          let z = yy + pad;
          fonte(FS, c.na ? 'italic' : 'normal', c.na ? C.muted : C.tinta);
          L.Lt.forEach(l => { doc.text(l, x0, z + FS); z += LT; });
          if (L.Lq.length) { z += 3; fonte(FQ, 'normal', C.muted); L.Lq.forEach(l => { doc.text(l, x0, z + FQ); z += LQ; }); }
          if (L.badge) {
            z += 5;
            const [bg, fg] = ESTADO_COR[c.estado] || ESTADO_COR.orientacao;
            etiqueta(x0, z, tr(ROT[c.estado] || c.estado), bg, fg, 8);
            if (c.custo != null) { fonte(9.4, 'bold', C.titulo); doc.text(pdfTxt(grande(c.custo)), x0 + iw, z + 10.5, { align: 'right' }); }
          }
        },
      });
      y = doc.lastAutoTable.finalY + 12;
      if (!notasAntes) fazNotas();
    });
  };

  // ---------------------------------------------------------------- Recomendações para você (abre "O que fazer")
  const recomendacoes = () => {
    const sR = secs.find(s => s.id === 'recs');
    pagRecs = doc.getNumberOfPages(); INDICE.push([sR ? sR.h : tr(TIT_REC), pagRecs, 1]);
    tituloSec(sR ? sR.h : tr(TIT_REC), R.length ? tr(TXT_REC.introPlano) : tr(TXT_REC.vazio), COR_PAG.fazer);
    if (!R.length) return;
    // contagem
    const nC = R.filter(r => r.tipo === 'custo').length, nP = R.length - nC;
    let x = M;
    x += etiqueta(x, y, tPn('nRecs', R.length), C.cab, C.titulo, 8.6) + 6;
    if (altas.length) x += etiqueta(x, y, altas.length === 1 ? tP('alta1') : tPn('altaN', altas.length), [250, 232, 230], C.alta, 8.6) + 6;
    x += etiqueta(x, y, nC + ' · ' + tr(TIPO_REC.custo), C.tintA, C.marca, 8.6) + 6;
    etiqueta(x, y, nP + ' · ' + tr(TIPO_REC.politica), C.tintB, C.roxo, 8.6);
    y += 30;
    // cartões das 5 primeiras de prioridade alta
    const top = altas.slice(0, 5);
    if (top.length) {
      subtitulo(tP('topRecs'), C.alta, 90);
      const xT = M + 46, wT = LW - 46 - 14;
      top.forEach((r, i) => {
        const La = quebra(tr(r.texto), 10.5, wT, 'bold');
        const pq = recPorqueTexto(r);
        const Lp = pq ? quebra(tr(TXT_REC.porque) + ' ' + pq, 8.6, wT) : [];
        const h = 14 + 16 + La.length * 14 + (Lp.length ? 4 + Lp.length * 11.4 : 0) + 12;
        cabe(h + 10);
        doc.setDrawColor(...C.linha); doc.setLineWidth(0.7); doc.setFillColor(...C.branco); doc.roundedRect(M, y, LW, h, 7, 7, 'FD');
        doc.setFillColor(...C.alta); doc.rect(M, y + 1, 4.5, h - 2, 'F');
        fonte(22, 'bold', C.alta); doc.text(String(i + 1), M + 26, y + 32, { align: 'center' });
        let xe = xT;
        xe += etiqueta(xe, y + 11, tr(TIPO_REC[r.tipo] || r.tipo), r.tipo === 'custo' ? C.tintA : C.tintB, r.tipo === 'custo' ? C.marca : C.roxo) + 5;
        etiqueta(xe, y + 11, tr((QUANDO_REC.find(q => q[0] === r.quando) || [, r.quando])[1]), C.fundo, C.muted);
        let yy = y + 30;
        fonte(10.5, 'bold', C.titulo); La.forEach(l => { doc.text(l, xT, yy + 10.5); yy += 14; });
        if (Lp.length) { yy += 4; fonte(8.6, 'normal', C.muted); Lp.forEach(l => { doc.text(l, xT, yy + 8.6); yy += 11.4; }); }
        y += h + 9;
      });
      y += 6;
    }
    // lista completa por momento, com caixinha de marcar
    subtitulo(tP('todas'), C.titulo, 90);
    const body = [];
    QUANDO_REC.forEach(([q, nome], gi) => {
      const L = R.filter(r => r.quando === q); if (!L.length) return;
      body.push([{ content: pdfTxt(tr(nome) + '  (' + L.length + ')'), colSpan: 4, styles: { fillColor: mix(C.fases[gi], [255, 255, 255], 0.72), textColor: C.titulo, fontStyle: 'bold', fontSize: 9.4 } }]);
      L.forEach(r => body.push(['', pdfTxt(tr(r.texto)), pdfTxt(recPorqueTexto(r)), pdfTxt(tr(PRIO_REC[r.prioridade] || r.prioridade))]));
    });
    cabe(80);
    doc.autoTable({
      startY: y, rowPageBreak: 'avoid', theme: 'plain', margin: { left: M, right: M, top: TOP, bottom: H - BASE },
      head: [['', tP('acao'), tr(TXT_REC.porque).replace(/\s*:$/, ''), tP('prio')].map(pdfTxt)], body,
      styles: { font: 'helvetica', fontSize: 8.6, cellPadding: 5, textColor: C.tinta, lineColor: C.linha, lineWidth: { bottom: 0.5 }, valign: 'top' },
      headStyles: { fillColor: C.cab, textColor: C.titulo, fontStyle: 'bold', lineWidth: { bottom: 0.9 }, lineColor: C.marca },
      columnStyles: { 0: { cellWidth: 20 }, 2: { cellWidth: 170, textColor: C.muted }, 3: { cellWidth: 52 } },
      didParseCell: dd => {
        if (dd.section !== 'body' || dd.cell.colSpan > 1) return;
        const alta = dd.row.raw[3] === pdfTxt(tr(PRIO_REC.alta));
        if (alta && dd.column.index === 1) dd.cell.styles.fontStyle = 'bold';
        if (dd.column.index === 3) { dd.cell.styles.fontStyle = 'bold'; dd.cell.styles.textColor = alta ? C.alta : C.media; }
      },
      didDrawCell: dd => {
        if (dd.section !== 'body' || dd.column.index !== 0 || dd.cell.colSpan > 1) return;
        doc.setDrawColor(...C.muted); doc.setLineWidth(0.8); doc.roundedRect(dd.cell.x + 6, dd.cell.y + 5.5, 8, 8, 1.2, 1.2, 'S');
      },
    });
    y = doc.lastAutoTable.finalY + 12;
  };

  // ---------------------------------------------------------------- Perfil do caso (abre o apêndice)
  const perfil = () => {
    INDICE.push([tP('perfil'), doc.getNumberOfPages(), 1]);
    tituloSec(tP('perfil'), tP('introPerfil'), C.titulo);
    const usados = new Set();
    // áreas: as da página (resumo.cartoes) quando existem; senão, PDF_AREAS
    const areas = Array.isArray(resumoRaw.cartoes) && resumoRaw.cartoes.length && resumoRaw.cartoes.every(z => z && z.h && Array.isArray(z.kv))
      ? resumoRaw.cartoes.map(z => [z.h, z.kv.map(([k]) => k)]) : PDF_AREAS;
    const cards = areas.map(([area, ks], i) => {
      const pares = ks.filter(k => k in KV).map(k => { usados.add(k); return [tr(k), kvT(k) || '—']; });
      return { t: tr(area), pares, cor: C.fasesS[Math.min(3, Math.floor(i / 2))] };
    }).filter(c => c.pares.length);
    const resto = Object.keys(KV).filter(k => !usados.has(k));
    if (resto.length) cards.push({ t: tr('Outros'), pares: resto.map(k => [tr(k), kvT(k) || '—']), cor: C.fasesS[3] });
    const g = 12, w = (LW - g) / 2, iw = w - 24;
    const medir = c => 32 + c.pares.reduce((s, [k, v]) => s + quebra(k, 8.2, iw - (v === '—' ? 20 : 0), 'bold').length * 10.2 + (v === '—' ? 2 : quebra(v, 9.6, iw).length * 12.4) + 5, 0) + 6;
    const desenhar = (c, x, yy, h) => {
      doc.setDrawColor(...C.linha); doc.setLineWidth(0.7); doc.setFillColor(...C.branco); doc.roundedRect(x, yy, w, h, 8, 8, 'FD');
      doc.setFillColor(...c.cor); doc.rect(x + 12, yy, 30, 3.2, 'F');
      fonte(11, 'bold', C.titulo); doc.text(pdfTxt(c.t), x + 12, yy + 22);
      let z = yy + 32;
      c.pares.forEach(([k, v]) => {
        // sem resposta: rótulo e traço na mesma linha
        const vazio = v === '—';
        if (vazio) { fonte(9.6, 'normal', C.muted); doc.text(pdfTxt('—'), x + w - 14, z + 8.4, { align: 'right' }); }
        fonte(8.2, 'bold', C.muted); quebra(k, 8.2, iw - (vazio ? 20 : 0), 'bold').forEach(l => { doc.text(l, x + 12, z + 8); z += 10.2; });
        if (vazio) z += 2;
        else { fonte(9.6, 'normal', C.tinta); quebra(v, 9.6, iw).forEach(l => { doc.text(l, x + 12, z + 9.6); z += 12.4; }); }
        z += 5;
      });
    };
    // duas colunas: cada cartão vai para a coluna mais curta; se não couber, página nova
    let yc = [y, y];
    cards.forEach(c => {
      const h = medir(c);
      let col = yc[0] <= yc[1] ? 0 : 1;
      if (yc[col] + h > BASE) { const o = 1 - col; if (yc[o] + h <= BASE) col = o; else { novaPag(); yc = [y, y]; col = 0; } }
      desenhar(c, M + col * (w + g), yc[col], h);
      yc[col] += h + g;
    });
    y = Math.max(...yc) + 6;
    // etapas e ferramentas (subseções logo depois de "perfil"): tabelas pequenas em cartões de largura total
    const iP = secs.findIndex(s => s.id === 'perfil' && !s.sub), iFim = secs.findIndex((s, i) => i > iP && !s.sub);
    secs.slice(iP + 1, iFim < 0 ? undefined : iFim).filter(s => s.sub && s.table && s.table.rows.length).reverse().forEach(s => {
      cabe(110);
      const y0 = y, p0 = doc.getNumberOfPages();
      y += 12; fonte(11, 'bold', C.titulo); doc.text(pdfTxt(s.h), M + 12, y + 10); y += 20;
      tabela(s.table.head, s.table.rows, Object.assign({}, s.table, { dx: 12 }));
      if (doc.getNumberOfPages() === p0) { doc.setDrawColor(...C.linha); doc.setLineWidth(0.7); doc.roundedRect(M, y0, LW, y - y0 + 2, 8, 8, 'S'); }
      y += 14;
    });
  };

  // ---------------------------------------------------------------- seções A e B
  const corDe = s => { const B = /^B/.test(String(s.id || '')); corB = B ? C.roxo : C.marca; tintB = B ? C.tintB : C.tintA; };
  const faixaSecao = s => {
    const m = String(s.h).match(/^([AB]\d+\.)\s*(.*)$/);
    const num = m ? m[1] : '', tit = m ? m[2] : s.h;
    fonte(12.5, 'bold'); const wn = num ? doc.getTextWidth(num + ' ') : 0;
    const L = quebra(tit, 12.5, LW - 28 - wn, 'bold');
    const h = L.length * 16 + 14;
    // a faixa fica com pelo menos três linhas do que vem depois
    cabe(h + 18 + altInicio(s)); if (y > TOP + 4) y += 8;
    doc.setFillColor(...tintB); doc.rect(M, y, LW, h, 'F');
    doc.setFillColor(...corB); doc.rect(M, y, 4.5, h, 'F');
    fonte(12.5, 'bold', corB); if (num) doc.text(num, M + 16, y + 19);
    fonte(12.5, 'bold', C.titulo); L.forEach((l, i) => doc.text(l, M + 16 + wn, y + 19 + i * 16));
    y += h + 10;
  };
  // fórmula: "Custo total = termo + termo + ..." em caixas, como a equação do passo 4.2
  const equacao = kv => {
    const tot = kv[kv.length - 1], termos = kv.slice(0, -1);
    const caixa = (k, v, cor, fundo, x, yy, w, h) => {
      const mm = String(k).match(/^(.*)\s\(([^()]*)\)$/);
      doc.setFillColor(...fundo); doc.setDrawColor(...(fundo === C.branco ? C.linha : fundo)); doc.setLineWidth(0.7); doc.roundedRect(x, yy, w, h, 6, 6, 'FD');
      fonte(10.5, 'bold', cor); doc.text(pdfTxt(String(v).replace(/^−\s*/, '')), x + 8, yy + 19);
      const L = corta(quebra(mm ? mm[1] : k, 8.2, w - 16, 'bold'), 2);
      fonte(8.2, 'bold', cor === C.branco ? C.branco : C.titulo); L.forEach((l, i) => doc.text(l, x + 8, yy + 33 + i * 10));
      if (mm) { fonte(8, 'normal', cor === C.branco ? C.branco : C.muted); doc.text(pdfTxt(mm[2]), x + 8, yy + 35 + L.length * 10); }
    };
    const n = termos.length + 1, op = 16, h = 60;
    const porLinha = Math.min(n, Math.max(2, Math.floor((LW + op) / (96 + op))));
    const w = (LW - (porLinha - 1) * op) / porLinha;
    const linhas = Math.ceil(n / porLinha);
    cabe(linhas * (h + 10) + 4);
    const itens = [[tot[0], tot[1], true]].concat(termos.map(t => [t[0], t[1], false]));
    itens.forEach(([k, v, ehTot], i) => {
      const col = i % porLinha, lin = Math.floor(i / porLinha);
      const x = M + col * (w + op), yy = y + lin * (h + 10);
      caixa(k, v, ehTot ? C.branco : C.titulo, ehTot ? corB : C.branco, x, yy, w, h);
      if (i < itens.length - 1 && col < porLinha - 1) {
        const prox = itens[i + 1][1];
        fonte(14, 'bold', C.muted); doc.text(i === 0 ? '=' : /^−/.test(String(prox)) ? '-' : '+', x + w + op / 2, yy + h / 2 + 5, { align: 'center' });
      }
    });
    y += linhas * (h + 10) + 6;
  };
  const kpisSecao = kv => {
    const g = 10, por = 3, w = (LW - (por - 1) * g) / por, h = 62;
    const lin = Math.ceil(kv.length / por);
    cabe(lin * (h + g) + 26);   // com a legenda que vem logo depois
    kv.forEach(([k, v], i) => cartaoKPI(M + (i % por) * (w + g), y + Math.floor(i / por) * (h + g), w, h, v, k, corB, 13));
    y += lin * (h + g) + 4;
  };
  // Figura 1 numa página própria: largura total, proporção mantida, legenda e crédito abaixo
  const figura = s => {
    const src = opts.figura;
    if (!src || typeof src !== 'string') return;
    let pr = { width: 900, height: 1225 };
    try { pr = doc.getImageProperties(src) || pr; } catch (e) { }
    novaPag(); INDICE.push([s.h, doc.getNumberOfPages(), 1]);
    fonte(12.5, 'bold', C.titulo); doc.text(pdfTxt(s.h), M, y + 12.5); y += 24;
    const leg = quebra((s.pos || [])[0] || '', 8.6, LW, 'italic');
    const hLeg = leg.length * LH(8.6) + 10;
    let w = LW, h = w * pr.height / pr.width;
    const hMax = BASE - y - hLeg;
    if (h > hMax) { h = hMax; w = h * pr.width / pr.height; }
    const x0 = M + (LW - w) / 2;
    try { doc.addImage(src, fmtImg(src) || 'JPEG', x0, y, w, h); } catch (e) { console.warn(e); }
    doc.setDrawColor(...C.linha); doc.setLineWidth(0.5); doc.rect(x0, y, w, h);
    y += h + 8;
    texto((s.pos || [])[0] || '', { i: true, size: 8.6, cor: C.muted, x: x0, w });
    y = BASE + 1;   // o que vem depois começa noutra página
  };
  const totaisTabela = t => {
    // última linha "Total" e linhas de total por ano ("As contas de cada ano")
    const rows = t.rows || [], out = [];
    if (rows.length && rows[rows.length - 1][0] === tr('Total')) out.push(rows.length - 1);
    if (ehContas(t)) rows.forEach((r, i) => { if (i === rows.length - 1 || rows[i + 1][0] !== r[0]) out.push(i); });
    return out;
  };
  const ehContas = t => (t.head || [])[0] === tr('Ano');
  const corpo = s => {
    (s.pre || []).forEach(z => {
      const L = quebra(z, 9.6, LW - 24, 'bold'), h = L.length * 13 + 14;
      cabe(h + 6);
      doc.setFillColor(...C.ambar); doc.setDrawColor(...C.ambarL); doc.setLineWidth(0.6); doc.roundedRect(M, y, LW, h, 5, 5, 'FD');
      fonte(9.6, 'bold', C.media); L.forEach((l, i) => doc.text(l, M + 12, y + 16 + i * 13));
      y += h + 10;
    });
    const eq = (s.kv || []).length && (s.eq || s.h === tr('Como o custo é calculado'));
    if ((s.kv || []).length && s.kpis) kpisSecao(s.kv);
    (s.p || []).forEach(z => texto(z, { size: 10, b: z === tr('Por quê:') }));
    if (eq) equacao(s.kv);
    else if ((s.kv || []).length && !s.kpis) tabela(null, s.kv.map(([k, v]) => [k, v || '—']), { larg: [190], b0: true }, corB);
    (s.list || []).forEach(z => texto(z, { size: 10, ind: 13, after: 3, bullet: true, corBullet: corB }));
    if (s.table && (s.table.rows || []).length) tabela(s.table.head, s.table.rows, Object.assign({ tot: totaisTabela(s.table), grupo: s.table.grupo || ehContas(s.table) }, s.table, ehContas(s.table) ? { grupo: true } : {}), corB);
    (s.pos || []).forEach(z => texto(z, { i: true, size: 8.6, cor: C.muted }));
  };
  // altura do início do conteúdo de uma seção: o título fica na mesma página que ele (sem título órfão)
  const altInicio = s => {
    let h = (s.pre || []).length * 34;
    (s.p || []).forEach(z => { h += altTexto(z, 10, LW) + 4; });
    if ((s.kv || []).length) h += s.kpis ? Math.ceil(s.kv.length / 3) * 72 + 26 : 80;
    if ((s.list || []).length) h += Math.min(3 * LH(10), altTexto(s.list[0], 10, LW - 13) + 3);
    else if (s.table && (s.table.rows || []).length) { const hT = altTabela(s.table.head, s.table.rows, s.table); h += hT < 260 ? hT : 70; }
    if (!(s.list || []).length && !(s.p || []).length && !(s.kv || []).length && !s.table) h += 3 * LH(10);
    return Math.min(340, Math.max(3 * LH(10), h));
  };
  // seção comum (A1–A7, B1–B9 e as suas subseções)
  const secao = s => {
    if (s.soPagina || s.tipo === 'bloco' || s.tipo === 'faltas') return;
    if (s.tipo === 'figura') { figura(s); return; }
    if (!s.sub) { corDe(s); faixaSecao(s); }
    else subtitulo(s.h, corB, altInicio(s));
    corpo(s);
  };

  // ---------------------------------------------------------------- montagem
  doc.setProperties({ title: pdfTxt(NOME_FERRAMENTA + ' - ' + tP('sub') + ' - ' + nomeCaso), subject: pdfTxt(tP('sub')), creator: NOME_FERRAMENTA });
  capa();
  // Em resumo
  emResumo();
  // Quanto custa (A2, A3)
  aberturaPagina('custa');
  colunasExercicio();
  secoesDaPagina(secs, 'custa').forEach(secao);
  // O que fazer (recomendações, A1, B1–B4, B7–B9)
  aberturaPagina('fazer');
  secoesDaPagina(secs, 'fazer').forEach(s => { if (s.id === 'recs' && !s.sub) recomendacoes(); else secao(s); });
  // O que exigir (A4–A7, B5, B6)
  aberturaPagina('exigir');
  secoesDaPagina(secs, 'exigir').forEach(secao);
  // Apêndice: perfil, matriz, figura, referências, respostas que faltam
  aberturaPagina('apendice');
  const iP = secs.findIndex(z => z.id === 'perfil' && !z.sub), iFimP = secs.findIndex((z, i) => i > iP && !z.sub);
  const doPerfil = new Set(iP < 0 ? [] : secs.slice(iP + 1, iFimP < 0 ? undefined : iFimP));
  secoesDaPagina(secs, 'apendice').forEach(s => {
    if (doPerfil.has(s)) return;   // tabelas do perfil: desenhadas por perfil()
    if (s.id === 'perfil' && !s.sub) { perfil(); return; }
    if (s.id === 'matriz' && !s.sub) { matriz(); return; }
    if (s.id === 'refs' && !s.sub) { corB = C.marca; tintB = C.tintA; cabe(220); if (y > TOP + 4) y += 18; INDICE.push([s.h, doc.getNumberOfPages(), 1]); tituloSec(s.h, '', C.titulo); corpo(s); return; }
    if (s.tipo === 'faltas') {
      novaPag(); pagFaltas = doc.getNumberOfPages(); INDICE.push([s.h, pagFaltas, 1]);
      tituloSec(s.h, (s.p || []).join(' '), C.media);
      s.list.forEach(z => texto(z, { size: 10, ind: 13, after: 3, bullet: true, corBullet: C.media }));
      return;
    }
    secao(s);
  });
  tarde.forEach(f => f());

  // cabeçalho e rodapé das páginas internas
  const n = doc.getNumberOfPages();
  const pe = avisoTraducao() ? 12 : 0;   // v13: rodapé sobe para o aviso de tradução
  const versao = opts.versao ? String(opts.versao).replace(/^v/, '') : '';
  for (let i = 2; i <= n; i++) {
    doc.setPage(i);
    {
      fonte(8, 'normal', C.muted);
      let run = pdfTxt(NOME_FERRAMENTA + '  ·  ' + tP('sub') + '  ·  ' + nomeCaso);
      while (doc.getTextWidth(run) > LW && run.length > 20) run = run.slice(0, -2);
      if (run.length < pdfTxt(NOME_FERRAMENTA + '  ·  ' + tP('sub') + '  ·  ' + nomeCaso).length) run = run.replace(/\s*\S?$/, '') + '…';
      doc.text(run, M, 30);
      doc.setDrawColor(...C.linha); doc.setLineWidth(0.6); doc.line(M, 38, W - M, 38);
      doc.setFillColor(...C.marca); doc.rect(M, 37.2, 34, 1.6, 'F');
    }
    doc.setDrawColor(...C.linha); doc.setLineWidth(0.6); doc.line(M, H - 36 - pe, W - M, H - 36 - pe);
    fonte(8, 'normal', C.muted);
    doc.text(pdfTxt(tP('ilustr') + (versao ? '  ·  v' + versao : '')), M, H - 24 - pe);
    fonte(8, 'bold', C.titulo); doc.text(i + ' / ' + n, W - M, H - 24 - pe, { align: 'right' });
  }
  avisoTradPDF(doc, { W, H, M, LW });   // v13: aviso de tradução preliminar (capa e rodapé), só nos idiomas novos
  return doc;
}

// =====================================================================
// v13 (RQ-18, pacote L): fontes embutidas para árabe, chinês e bambara, que não cabem no WinAnsi da Helvetica.
// FONTES_PDF (src/plano/fontes_pdf.generated.js, de tools/subset_fonts.py) traz subconjuntos TrueType comprimidos
// (deflate) em base64, só com os caracteres dos dicionários do idioma, do inglês, ASCII e Latin-1.
//   fontePDF(doc, F, l) registra a fonte do idioma e faz 'helvetica' apontar para ela (texto e autotable);
//                       itálico vira regular; sem peso bold (chinês), o negrito é simulado com contorno.
//   ajustarTextoPDF(s)  substitui pdfTxt nesses idiomas: mantém tudo o que a fonte cobre e só troca o resto.
//   avisoTradPDF(...)   aviso de tradução preliminar na capa e no rodapé (idiomas novos não revisados).
// Árabe: o jsPDF liga as letras (processArabic: formas de apresentação) e reordena cada linha (motor bidi);
// números e "US$" ficam da esquerda para a direita dentro da linha.
// PT/EN/ES/FR (e zu/sw, que cabem no WinAnsi) continuam com Helvetica e pdfTxt, sem nenhuma mudança.
// =====================================================================
const PDF_FONTE_BIN = {};      // arquivo → TTF (string binária), descomprimido uma vez por sessão
const PDF_FONTE_COBRE = {};    // família → Set dos caracteres cobertos
function familiaPDF(l, FONTES) {
  if (!FONTES) return null;
  for (const k in FONTES) if ((FONTES[k].idiomas || []).includes(l) && FONTES[k].regular) return Object.assign({ chave: k }, FONTES[k]);
  return null;
}
// DEFLATE bruto (RFC 1951), síncrono
function inflarPDF(src) {
  let pos = 0, buf = 0, cnt = 0, out = new Uint8Array(src.length * 3 + 1024), n = 0;
  const cabe = k => { if (n + k > out.length) { const o = new Uint8Array(Math.max(out.length * 2, n + k)); o.set(out.subarray(0, n)); out = o; } };
  const bits = k => { while (cnt < k) { if (pos >= src.length) throw new Error('inflar: fim dos dados'); buf |= src[pos++] << cnt; cnt += 8; } const v = buf & ((1 << k) - 1); buf >>>= k; cnt -= k; return v; };
  const tabela = (lens, m) => {
    const count = new Uint16Array(16), offs = new Uint16Array(16), sym = new Uint16Array(m);
    for (let i = 0; i < m; i++) count[lens[i]]++;
    count[0] = 0;
    for (let i = 1; i < 16; i++) offs[i] = offs[i - 1] + count[i - 1];
    for (let i = 0; i < m; i++) if (lens[i]) sym[offs[lens[i]]++] = i;
    return { count, sym };
  };
  const decod = h => {
    let code = 0, first = 0, index = 0;
    for (let len = 1; len < 16; len++) {
      code |= bits(1);
      const c = h.count[len];
      if (code - c < first) return h.sym[index + (code - first)];
      index += c; first += c; first <<= 1; code <<= 1;
    }
    throw new Error('inflar: código inválido');
  };
  const LB = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
  const LE = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
  const DB = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
  const DE = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
  const ORD = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
  let fixL = null, fixD = null, fim = 0;
  while (!fim) {
    fim = bits(1);
    const tipo = bits(2);
    if (tipo === 0) {
      buf = 0; cnt = 0;
      if (pos + 4 > src.length) throw new Error('inflar: bloco curto');
      const len = src[pos] | (src[pos + 1] << 8); pos += 4;
      cabe(len); out.set(src.subarray(pos, pos + len), n); n += len; pos += len;
      continue;
    }
    let hl, hd;
    if (tipo === 1) {
      if (!fixL) {
        const l = new Uint8Array(288); l.fill(8, 0, 144); l.fill(9, 144, 256); l.fill(7, 256, 280); l.fill(8, 280, 288);
        fixL = tabela(l, 288); fixD = tabela(new Uint8Array(30).fill(5), 30);
      }
      hl = fixL; hd = fixD;
    } else if (tipo === 2) {
      const nl = bits(5) + 257, nd = bits(5) + 1, nc = bits(4) + 4;
      const cl = new Uint8Array(19);
      for (let i = 0; i < nc; i++) cl[ORD[i]] = bits(3);
      const hc = tabela(cl, 19), lens = new Uint8Array(nl + nd);
      for (let i = 0; i < nl + nd;) {
        const s = decod(hc);
        if (s < 16) lens[i++] = s;
        else {
          let rep = 0, v = 0;
          if (s === 16) { if (!i) throw new Error('inflar: repetição sem valor'); v = lens[i - 1]; rep = 3 + bits(2); }
          else if (s === 17) rep = 3 + bits(3);
          else rep = 11 + bits(7);
          while (rep--) lens[i++] = v;
        }
      }
      hl = tabela(lens.subarray(0, nl), nl); hd = tabela(lens.subarray(nl), nd);
    } else throw new Error('inflar: bloco inválido');
    for (;;) {
      const s = decod(hl);
      if (s < 256) { cabe(1); out[n++] = s; }
      else if (s === 256) break;
      else {
        const li = s - 257, len = LB[li] + bits(LE[li]);
        const di = decod(hd), d = DB[di] + bits(DE[di]);
        if (d > n) throw new Error('inflar: distância');
        cabe(len);
        for (let k = 0; k < len; k++, n++) out[n] = out[n - d];
      }
    }
  }
  return out.subarray(0, n);
}
function binFontePDF(b64) {
  const z = atob(b64), u = new Uint8Array(z.length);
  for (let i = 0; i < z.length; i++) u[i] = z.charCodeAt(i);
  const b = inflarPDF(u);
  let s = '';
  for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192));
  return s;
}
// Registra a fonte do idioma no documento (no começo de gerarPDF). Sem fonte para o idioma: Helvetica, como antes.
function fontePDF(doc, FONTES, lang) {
  PDF_FONTE = null;
  const F = familiaPDF(lang || 'pt', FONTES);
  if (!F || !doc || typeof doc.addFont !== 'function') return null;
  const pesos = {};
  try {
    ['regular', 'bold'].forEach(p => {
      if (!F[p]) return;
      const arq = F.nome + '-' + p + '.ttf';
      if (!PDF_FONTE_BIN[arq]) PDF_FONTE_BIN[arq] = binFontePDF(F[p]);
      doc.addFileToVFS(arq, PDF_FONTE_BIN[arq]);
      doc.addFont(arq, F.nome, p === 'bold' ? 'bold' : 'normal');
      pesos[p] = true;
    });
  } catch (e) { console.warn('fonte do PDF', e); return null; }
  if (!PDF_FONTE_COBRE[F.chave]) PDF_FONTE_COBRE[F.chave] = new Set(Array.from(F.cobre || ''));
  const info = { nome: F.nome, chave: F.chave, negrito: !!pesos.bold, cobre: PDF_FONTE_COBRE[F.chave], rtl: F.chave === 'ar' };
  const setFont0 = doc.setFont, text0 = doc.text;
  let falso = false;   // negrito simulado no próximo texto
  doc.setFont = function (nome, estilo, peso) {
    if (String(nome || '').toLowerCase() === 'helvetica' || nome === info.nome) {
      const b = /bold/i.test(String(estilo || '')) || peso === 700 || peso === 'bold';
      falso = b && !info.negrito;
      return setFont0.call(this, info.nome, b && info.negrito ? 'bold' : 'normal');
    }
    falso = false;
    return setFont0.apply(this, arguments);
  };
  if (!info.negrito) {
    // negrito sem arquivo próprio: preenchimento + contorno fino na cor do texto
    doc.text = function (t, x, y, o) {
      if (!falso) return text0.apply(this, arguments);
      const lw = this.getLineWidth(), dc = this.getDrawColor();
      this.setLineWidth(Math.max(0.25, this.getFontSize() * 0.032)); this.setDrawColor(this.getTextColor());
      const op = Object.assign({}, o && typeof o === 'object' && !Array.isArray(o) ? o : {}, { renderingMode: 'fillThenStroke' });
      try { return text0.call(this, t, x, y, op); } finally { this.setLineWidth(lw); this.setDrawColor(dc); }
    };
  }
  // chinês: quebra de linha por caractere (o splitTextToSize do jsPDF só quebra em espaços); palavras latinas
  // ficam inteiras; pontuação de fechamento não começa linha
  const split0 = doc.splitTextToSize;
  if (info.chave === 'zh') {
    doc.splitTextToSize = function (t, w, o) {
      if (Array.isArray(t)) return [].concat(...t.map(z => this.splitTextToSize(z, w, o)));
      const fs = (o && o.fontSize) || this.getFontSize(), k = this.internal.scaleFactor;
      const larg = s => this.getStringUnitWidth(s) * fs / k;
      return quebrarCJK(String(t == null ? '' : t), w, larg);
    };
  }
  // árabe: as linhas quebradas por splitTextToSize (parágrafos, cartões, células) ficam alinhadas à direita da
  // caixa em que foram quebradas (x + largura); o jsPDF liga as letras e põe cada linha na ordem visual
  if (info.rtl) {
    const RE_AR = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
    const larguras = new Map();
    doc.splitTextToSize = function (t, w, o) {
      const r = split0.apply(this, arguments);
      (Array.isArray(r) ? r : [r]).forEach(l => { if (typeof l === 'string' && RE_AR.test(l)) larguras.set(l, w); });
      return r;
    };
    // texto posicionado à mão (largura medida antes de desenhar: índice, etiquetas) fica onde o código o pôs
    const largura0 = doc.getTextWidth;
    doc.getTextWidth = function (s) { if (typeof s === 'string') larguras.delete(s); return largura0.apply(this, arguments); };
    const textoBase = doc.text;
    doc.text = function (t, x, y, o) {
      const op = o && typeof o === 'object' && !Array.isArray(o) ? o : null;
      const L = Array.isArray(t) ? t : [t];
      if ((!op || !op.align || op.align === 'left') && L.length && L.every(l => typeof l === 'string' && larguras.has(l))) {
        const w = Math.max(...L.map(l => larguras.get(l)));
        return textoBase.call(this, t, x + w, y, Object.assign({}, op || {}, { align: 'right' }));
      }
      return textoBase.apply(this, arguments);
    };
  }
  doc.setFont('helvetica', 'normal');
  PDF_FONTE = info;
  return info;
}
// Quebra de linha para chinês: cada ideograma é um ponto de quebra; sequências latinas ficam inteiras
// (e só se partem se não couberem numa linha); pontuação de fechamento fica no fim da linha anterior.
const RE_CJK = /[⺀-鿿豈-﫿︰-﹏＀-￯　-〿]/;
const CJK_FECHA = '，。、：；？！）》」』】〉’”…·%,.;:!?)]}';
function quebrarCJK(s, w, larg) {
  const out = [];
  s.split(/\r?\n/).forEach(par => {
    const tk = par.match(/[⺀-鿿豈-﫿︰-﹏＀-￯　-〿]|\s+|[^\s⺀-鿿豈-﫿︰-﹏＀-￯　-〿]+/g) || [''];
    let lin = '';
    const fecha = () => { out.push(lin.replace(/\s+$/, '')); lin = ''; };
    tk.forEach(z => {
      if (/^\s+$/.test(z)) { if (lin) lin += ' '; return; }
      if (larg(lin + z) <= w || !lin.trim()) {
        if (larg(z) > w && !RE_CJK.test(z)) {
          // palavra latina maior que a linha: parte por caractere
          for (const ch of z) { if (lin && larg(lin + ch) > w) fecha(); lin += ch; }
        } else lin += z;
        return;
      }
      // não começa linha com pontuação de fechamento: ela fica (pendurada) no fim desta linha
      if (z.length === 1 && CJK_FECHA.includes(z)) { lin += z; return; }
      fecha();
      if (larg(z) > w && !RE_CJK.test(z)) { for (const ch of z) { if (lin && larg(lin + ch) > w) fecha(); lin += ch; } }
      else lin = z;
    });
    out.push(lin.replace(/\s+$/, ''));
  });
  return out;
}
// Texto para a fonte embutida: marcas bidi invisíveis saem; o que a fonte não cobre passa pela troca de pdfTxt
// (setas, ✓, ≥…); o resto fica como está (sem "?").
const RE_MARCAS_BIDI = /[​‎‏؜‪-‮⁦-⁩﻿]/g;
function ajustarTextoPDF(x) {
  const F = PDF_FONTE;
  let s = String(x == null ? '' : x).replace(RE_MARCAS_BIDI, '');
  if (!F) return s;
  // árabe: o motor bidi do jsPDF não espelha parênteses; num par cujo conteúdo é árabe, troca-se a abertura pelo fechamento
  if (F.rtl && /[؀-ۿ]/.test(s)) s = s.replace(/\(([^()]*[؀-ۿ][^()]*)\)/g, ')$1(');
  return s.replace(/[^\x00-\x7e]/gu, ch => {
    if (F.cobre.has(ch)) return ch;
    if (PDF_TROCA[ch] != null) return PDF_TROCA[ch];
    const d = ch.normalize('NFKD');
    if (d !== ch && Array.from(d).every(c => c < '\x7f' || F.cobre.has(c))) return d;
    return ch;
  });
}
// Aviso de tradução preliminar (idioma do PDF + inglês): faixa escura no pé da capa colorida e duas linhas
// a mais no rodapé das páginas internas (o rodapé sobe 12 pt; o corpo termina 6 pt acima do fio).
function avisoTradPDF(doc, o) {
  const av = avisoTraducao();
  if (!av) return;
  const { W, H, M, LW } = o, n = doc.getNumberOfPages();
  const lin = s => doc.splitTextToSize(pdfTxt(s), LW - 16);
  // capa: faixa sobre a base da faixa colorida (abaixo dos logos)
  doc.setPage(1);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  const L = lin(av.local).concat(av.en && av.en !== av.local ? lin(av.en) : []);
  const h = L.length * 10.4 + 8, y0 = Math.max(100, 128 - 4 - h);
  doc.setFillColor(...PDF_COR.titulo); doc.roundedRect(M, y0, LW, h, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  L.forEach((l, i) => doc.text(l, M + 8, y0 + 12.6 + i * 10.4));
  // rodapé das páginas internas: aviso no idioma e em inglês, abaixo de "Valores ilustrativos"
  doc.setFontSize(8);
  for (let i = 2; i <= n; i++) {
    doc.setPage(i);
    doc.setTextColor(88, 102, 116);
    const a = doc.splitTextToSize(pdfTxt(av.local), LW)[0], b = av.en && av.en !== av.local ? doc.splitTextToSize(pdfTxt(av.en), LW)[0] : '';
    doc.text(a, M, H - 25.5);
    if (b) doc.text(b, M, H - 15);
  }
}

/** Figura 1 e logos para o PDF no navegador, como data URIs (os arquivos vêm do Vite com `?url` e são lidos com fetch).
 *  Carregados sob demanda: chame antes de gerarPDF e passe { figura, logos }. */
async function recursosPDF() {
  const [fig, cat, ia] = await Promise.all([
    import('../../../assets/fig1_tco.jpg?url'),
    import('../assets/logos/catedra-unesco-unitwin.png?url'),
    import('../assets/logos/iaedu.png?url'),
  ]);
  const [figura, l1, l2] = await Promise.all([fig.default, cat.default, ia.default].map(paraDataURI));
  return { figura, logos: [l1, l2].filter(Boolean) };
}
async function paraDataURI(url) {
  if (!url || /^data:/.test(url)) return url || '';
  try {
    const r = await fetch(url);
    if (!r.ok) return '';
    const b = new Uint8Array(await r.arrayBuffer());
    let s = '';
    for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192));
    const mime = (r.headers.get('content-type') || '').split(';')[0] || (/\.png(\?|$)/i.test(url) ? 'image/png' : 'image/jpeg');
    return 'data:' + mime + ';base64,' + btoa(s);
  } catch (e) { console.warn('recursos do PDF', e); return ''; }
}

export { gerarPDF, nomeArqPDF, recursosPDF, carregarFontesPDF, pdfTxt, quebrarCJK, inflarPDF, PDF_COR, PDF_TXT, PDF_AREAS, IDIOMAS_FONTE };
