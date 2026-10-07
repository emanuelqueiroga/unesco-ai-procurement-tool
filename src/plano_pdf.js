// =====================================================================
// PDF do plano de contratação (jsPDF + autotable, Helvetica/WinAnsi). Separado de resumo.js na v11.
// v12 (pacote G2): relatório com design próprio, na mesma ordem da página:
//   capa (faixa em gradiente das fases, logos, título, caso, recomendação principal, 4 KPIs, isenção);
//   "Em resumo" (KPIs, barras por camada, colunas por exercício, fatos do caso);
//   "Recomendações para você" (5 cartões de prioridade alta e lista completa por momento);
//   "Perfil do caso" (cartões por área em duas colunas, etapas e ferramentas);
//   blocos A e B (faixa do bloco, faixa por seção, tabelas com tema único, fórmula como equação);
//   Figura 1 em página própria; referências; respostas pendentes no fim.
// Páginas internas com cabeçalho (fio + título corrido) e rodapé "n / N". Corpo 10 pt, tabelas 8,6 pt,
// 8 pt só em rodapé e legendas. Fonte de dados: secoesPlano(), numerosCusto(), recomendacoesCaso().
// =====================================================================
const PDF_TROCA = { '→': '->', '←': '<-', '≥': '>=', '≤': '<=', '✓': 'v', '✕': 'x', '−': '-', '≈': '~', 'ⓘ': '(i)', ' ': ' ', ' ': ' ', '‑': '-', '‐': '-', '«': '«', '»': '»', '☐': '', '·': '·' };
const CP1252_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
function pdfTxt(x) {
  return String(x == null ? '' : x).replace(/[^\x00-\xFF]/g, ch => PDF_TROCA[ch] != null ? PDF_TROCA[ch] : CP1252_EXTRA.includes(ch) ? ch : (ch.normalize('NFKD').replace(/[^\x00-\xFF]/g, '') || ''));
}
// Paleta do relatório (plano/7_relatorio_design.md)
const PDF_COR = {
  tinta: [23, 33, 43], titulo: [12, 45, 77], marca: [0, 105, 180], fundo: [245, 248, 251], linha: [221, 227, 233], muted: [88, 102, 116],
  cab: [238, 243, 248], branco: [255, 255, 255], alta: [179, 38, 30], media: [138, 90, 0], roxo: [94, 60, 134],
  tintA: [229, 240, 250], tintB: [238, 233, 245], ambar: [253, 246, 231], ambarL: [230, 200, 140],
  fases: [[169, 212, 245], [95, 168, 227], [31, 111, 184], [11, 60, 110]],
  fasesS: [[111, 178, 230], [62, 143, 208], [22, 90, 153], [7, 42, 79]],
  // camadas 1–7, cores da Figura 1 de Krueger e Jackson (2026)
  camadas: [null, [12, 29, 83], [6, 102, 179], [9, 108, 114], [84, 125, 29], [94, 60, 134], [217, 116, 26], [27, 42, 85]],
};
// Áreas do perfil do caso: chaves (em português) das linhas do resumo do caso em secoesPlano()
const PDF_AREAS = [
  ['Contexto', ['Nível administrativo', 'Lugar ou rede', 'Situação']],
  ['Problema e impacto', ['Como a equipe descreve o problema', 'Situação atual', 'Impacto desejado', 'Resultado esperado e como medir', 'Linha de base', 'Alternativa sem IA comparada']],
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

function gerarPDF() {
  const J = window.jspdf; if (!J || !J.jsPDF) throw new Error('jspdf');
  const doc = new J.jsPDF({ unit: 'pt', format: 'a4', compress: true });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 46;
  const TOP = 60, BASE = H - 54, LW = W - 2 * M;   // área útil das páginas internas
  const C = PDF_COR;
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
  const caso = S.caso || {}, ctx = S.ctx || {};
  const nomeCaso = caso.titulo || ctx.olhando || tr('Caso sem título');
  const raw = secoesPlano();
  const secs = raw.map(trSecao);
  let N = null;
  try { N = numerosCusto(); if (N && !N.camadas && typeof somaPorCamada === 'function') N.camadas = somaPorCamada(N.av); } catch (e) { console.warn(e); N = null; }
  let R = [];
  try { R = typeof recomendacoesCaso === 'function' ? recomendacoesCaso() || [] : []; } catch (e) { console.warn(e); R = []; }
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
  // título de seção de primeiro nível (resumo, recomendações, perfil, referências)
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
  const capa = () => {
    const BH = 128, n = 160;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1) * 3, k = Math.min(2, Math.floor(t));
      doc.setFillColor(...mix(C.fases[k], C.fases[k + 1], t - k));
      doc.rect(W * i / n, 0, W / n + 0.6, BH, 'F');
    }
    // logos sobre placa branca
    const vistos = new Set();
    const imgs = [...document.querySelectorAll('img.logo')].filter(im => im.src && !vistos.has(im.src) && vistos.add(im.src)).slice(0, 2);
    if (imgs.length) {
      const hL = 40, pad = 12, gap = 16;
      const ws = imgs.map(im => hL * ((im.naturalWidth / im.naturalHeight) || 2));
      const wPl = ws.reduce((a, b) => a + b, 0) + gap * (imgs.length - 1) + 2 * pad;
      doc.setFillColor(...C.branco); doc.roundedRect(M, 40, wPl, hL + 2 * 9, 8, 8, 'F');
      let x = M + pad;
      imgs.forEach((im, i) => {
        try { doc.addImage(im.src, 'PNG', x, 49, ws[i], hL); } catch (e) { }
        x += ws[i];
        if (i < imgs.length - 1) { doc.setDrawColor(...C.linha); doc.setLineWidth(0.7); doc.line(x + gap / 2, 52, x + gap / 2, 49 + hL - 3); x += gap; }
      });
    }
    fonte(9, 'bold', C.branco);
    doc.text(pdfTxt(tP('sub').toUpperCase()), W - M, 66, { align: 'right', charSpace: 0.6 });
    fonte(9, 'normal', C.branco);
    doc.text(pdfTxt(new Date().toLocaleDateString(LOC(), { year: 'numeric', month: 'long', day: 'numeric' })), W - M, 80, { align: 'right' });

    y = BH + 40;
    fonte(12, 'bold', C.marca); doc.text(pdfTxt(NOME_FERRAMENTA), M, y); y += 34;
    fonte(30, 'bold', C.titulo); doc.text(pdfTxt(tP('sub')), M, y); y += 18;
    doc.setFillColor(...C.marca); doc.rect(M, y, 46, 3.2, 'F'); y += 22;
    const LC = corta(quebra(nomeCaso, 20, LW, 'bold'), 3);
    fonte(20, 'bold', C.tinta); LC.forEach(l => { doc.text(l, M, y + 16); y += 25; });
    fonte(10.5, 'normal', C.muted);
    doc.text(pdfTxt([ctx.local, tP('gerado') + ' ' + new Date().toLocaleDateString(LOC())].filter(Boolean).join('  ·  ')), M, y + 10);
    y += 30;

    // recomendação principal: as frases de A1 (sem "Por quê:") e o número de ações de prioridade alta
    // frase principal de A1 (a1.principal, v12 resumo.js) primeiro; sem ela, as frases de A1
    const fr = (a1.p || []).filter(z => z && z !== tr('Por quê:'));
    const frases = a1.principal ? [a1.principal].concat(fr.filter(z => z !== a1.principal)).slice(0, 2) : fr.slice(0, 3);
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
      itens.forEach(([t, pg], i) => {
        const x = M + (i % 2) * (wI + g), yy = yI + 16 + Math.floor(i / 2) * hl;   // por linhas: a ordem de leitura segue a do plano
        fonte(9.6, 'normal', C.tinta);
        let tt = pdfTxt(t); while (doc.getTextWidth(tt) > wI - 30 && tt.length > 8) tt = tt.slice(0, -2);
        if (tt !== pdfTxt(t)) tt = tt.replace(/\s*\S?$/, '') + '…';
        doc.text(tt, x, yy + 10);
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
  let pagRecs = 0, pagFaltas = 0;
  const INDICE = [];   // [título, página] para o índice da capa

  // ---------------------------------------------------------------- Em resumo
  const emResumo = () => {
    novaPag(); INDICE.push([tP('resumo'), doc.getNumberOfPages()]);
    tituloSec(tP('resumo'), tP('introResumo'));
    if (faltas) {
      const s = faltas.list.length === 1 ? tP('parcial1') : tPn('parcialN', faltas.list.length);
      const h = 26;
      doc.setFillColor(...C.ambar); doc.setDrawColor(...C.ambarL); doc.setLineWidth(0.6); doc.roundedRect(M, y, LW, h, 5, 5, 'FD');
      fonte(9.6, 'bold', C.media); doc.text(pdfTxt(s), M + 12, y + 16.5);
      const w1 = doc.getTextWidth(pdfTxt(s)), y0 = y;
      tarde.push(() => {
        if (!pagFaltas) return;
        doc.setPage(2); fonte(9.6, 'normal', C.media);
        const t = pdfTxt(tPn('verLista', pagFaltas));
        doc.text(t, M + 18 + w1, y0 + 16.5); ehLink(M, y0, LW, h, pagFaltas);
      });
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
      // colunas por exercício (dotação a solicitar)
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
    }
    // fatos do caso
    const t = totaisCtx();
    const etN = (typeof etapasAtivas === 'function' ? etapasAtivas() : []).map(e => tr(e[1])).join('; ');
    const teste = [kvT('Prova de conceito ou piloto'), kvT('Prova de conceito: participantes e duração'), kvT('Piloto: escolas, participantes e duração')].filter(z => z && z !== '—').join(' · ');
    const eleg = +caso.elegiveis || 0, hz = +caso.horizonte || 0;
    // fatos do caso: os mesmos da página quando secoesPlano() os traz (resumo.fatos); senão, montados aqui
    const fatosPag = Array.isArray(resumoRaw.fatos) && resumoRaw.fatos.length ? resumoRaw.fatos.map(([k, v]) => [tr(k), tr(v)]) : null;
    const fatos = fatosPag || [
      [tP('fEtapas'), [etN, t.escolas ? tPn('escolas', fmtInt(t.escolas)) : '', t.alunos ? tPn('estudantes', fmtInt(t.alunos)) : ''].filter(Boolean).join(' · ')],
      [tP('fApl'), kvT('Aplicações')],
      [tP('fQuem'), kvT('Quem usa')],
      [tP('fTec'), [kvT('Tipo de tecnologia (ferramenta principal)'), kvT('Pagamento (ferramenta principal)')].filter(z => z && z !== '—').join(' · ')],
      [tP('fTeste'), teste],
      [tP('fEscala'), [eleg ? tPn('pessoas', fmtInt(eleg)) : '', hz ? tPn('horiz', hz) : ''].filter(Boolean).join(' · ')],
    ];
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

  // ---------------------------------------------------------------- Recomendações para você
  const recomendacoes = () => {
    const sR = secs.find(s => s.id === 'recs');
    novaPag(); pagRecs = doc.getNumberOfPages(); INDICE.push([sR ? sR.h : tr('Recomendações para você'), pagRecs]);
    tituloSec(sR ? sR.h : tr(typeof TIT_REC !== 'undefined' ? TIT_REC : 'Recomendações para você'), R.length ? tr(TXT_REC.introPlano) : tr(typeof TXT_REC !== 'undefined' ? TXT_REC.vazio : ''));
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

  // ---------------------------------------------------------------- Perfil do caso
  const perfil = () => {
    // depois de uma lista curta de recomendações, o perfil continua na mesma página
    if (y > TOP + 4 && y < BASE - 380) y += 26; else novaPag();
    INDICE.push([tP('perfil'), doc.getNumberOfPages()]);
    tituloSec(tP('perfil'), tP('introPerfil'));
    const usados = new Set();
    // áreas: as da página (resumo.cartoes, v12 resumo.js) quando existem; senão, PDF_AREAS
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
    // etapas e ferramentas: tabelas pequenas em cartões de largura total
    const iR = raw.findIndex(s => s.id === 'resumo'), iRec = raw.findIndex((s, i) => i > iR && !s.sub);
    secs.slice(iR + 1, iRec < 0 ? undefined : iRec).filter(s => s.sub && s.table && s.table.rows.length).reverse().forEach(s => {
      cabe(110);
      const y0 = y, p0 = doc.getNumberOfPages();
      y += 12; fonte(11, 'bold', C.titulo); doc.text(pdfTxt(s.h), M + 12, y + 10); y += 20;
      tabela(s.table.head, s.table.rows, Object.assign({}, s.table, { dx: 12 }));
      if (doc.getNumberOfPages() === p0) { doc.setDrawColor(...C.linha); doc.setLineWidth(0.7); doc.roundedRect(M, y0, LW, y - y0 + 2, 8, 8, 'S'); }
      y += 14;
    });
  };

  // ---------------------------------------------------------------- blocos A e B
  let corB = C.marca, tintB = C.tintA;
  const faixaBloco = s => {
    novaPag();
    const B = s.id === 'B'; corB = B ? C.roxo : C.marca; tintB = B ? C.tintB : C.tintA;
    const h = 64;
    INDICE.push([s.h, doc.getNumberOfPages()]);
    doc.setFillColor(...corB); doc.roundedRect(M, y, LW, h, 8, 8, 'F');
    fonte(9, 'bold', C.branco); doc.text(pdfTxt(tP('sub').toUpperCase()), M + 20, y + 22, { charSpace: 0.5 });
    fonte(20, 'bold', C.branco); doc.text(pdfTxt(s.h), M + 20, y + 47);
    y += h + 18;
  };
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
    if (typeof FIG_TCO === 'undefined' || !FIG_TCO) return;
    let pr = { width: 900, height: 1225 };
    try { pr = doc.getImageProperties(FIG_TCO) || pr; } catch (e) { }
    novaPag(); INDICE.push([s.h, doc.getNumberOfPages()]);
    fonte(12.5, 'bold', C.titulo); doc.text(pdfTxt(s.h), M, y + 12.5); y += 24;
    const leg = quebra((s.pos || [])[0] || '', 8.6, LW, 'italic');
    const hLeg = leg.length * LH(8.6) + 10;
    let w = LW, h = w * pr.height / pr.width;
    const hMax = BASE - y - hLeg;
    if (h > hMax) { h = hMax; w = h * pr.width / pr.height; }
    const x0 = M + (LW - w) / 2;
    try { doc.addImage(FIG_TCO, 'JPEG', x0, y, w, h); } catch (e) { console.warn(e); }
    doc.setDrawColor(...C.linha); doc.setLineWidth(0.5); doc.rect(x0, y, w, h);
    y += h + 8;
    texto((s.pos || [])[0] || '', { i: true, size: 8.6, cor: C.muted, x: x0, w });
    novaPag();
  };
  const totaisTabela = t => {
    // última linha "Total" e linhas de total por ano ("As contas de cada ano")
    const rows = t.rows || [], out = [];
    if (rows.length && rows[rows.length - 1][0] === tr('Total')) out.push(rows.length - 1);
    if (ehContas(t)) rows.forEach((r, i) => { if (i === rows.length - 1 || rows[i + 1][0] !== r[0]) out.push(i); });
    return out;
  };
  const fxTsafe = s => (typeof fxT === 'function' ? fxT(s) : tr(s));
  const ehContas = t => (t.head || [])[0] === tr('Ano') || (t.head || [])[0] === fxTsafe('Ano');
  const corpo = s => {
    (s.pre || []).forEach(z => {
      const L = quebra(z, 9.6, LW - 24, 'bold'), h = L.length * 13 + 14;
      cabe(h + 6);
      doc.setFillColor(...C.ambar); doc.setDrawColor(...C.ambarL); doc.setLineWidth(0.6); doc.roundedRect(M, y, LW, h, 5, 5, 'FD');
      fonte(9.6, 'bold', C.media); L.forEach((l, i) => doc.text(l, M + 12, y + 16 + i * 13));
      y += h + 10;
    });
    const eq = (s.kv || []).length && s.h === fxTsafe('Como o custo é calculado');
    if ((s.kv || []).length && s.kpis) kpisSecao(s.kv);
    (s.p || []).forEach((z, i) => texto(z, { size: 10, b: z === tr('Por quê:') }));
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
  const proxMin = altInicio;

  // ---------------------------------------------------------------- montagem
  doc.setProperties({ title: pdfTxt(NOME_FERRAMENTA + ' - ' + tP('sub') + ' - ' + nomeCaso), subject: pdfTxt(tP('sub')), creator: NOME_FERRAMENTA });
  capa();
  emResumo();
  recomendacoes();
  perfil();
  const i0 = secs.findIndex(s => s.tipo === 'bloco');
  secs.slice(i0 < 0 ? secs.length : i0).forEach(s => {
    if (s.soPagina || s.tipo === 'faltas') return;
    if (s.tipo === 'figura') { figura(s); return; }
    if (s.tipo === 'bloco') { faixaBloco(s); return; }
    if (s.id === 'refs') { corB = C.marca; tintB = C.tintA; cabe(220); y += 18; INDICE.push([s.h, doc.getNumberOfPages()]); tituloSec(s.h); corpo(s); return; }
    if (!s.sub) faixaSecao(s);
    else subtitulo(s.h, corB, proxMin(s));
    corpo(s);
  });
  // respostas pendentes, no fim
  if (faltas) {
    novaPag(); pagFaltas = doc.getNumberOfPages(); INDICE.push([faltas.h, pagFaltas]);
    tituloSec(faltas.h, (faltas.p || []).join(' '), C.media);
    faltas.list.forEach(z => texto(z, { size: 10, ind: 13, after: 3, bullet: true, corBullet: C.media }));
  }
  tarde.forEach(f => f());

  // cabeçalho e rodapé das páginas internas
  const n = doc.getNumberOfPages();
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
    doc.setDrawColor(...C.linha); doc.setLineWidth(0.6); doc.line(M, H - 36, W - M, H - 36);
    fonte(8, 'normal', C.muted);
    doc.text(pdfTxt(tP('ilustr')), M, H - 24);
    fonte(8, 'bold', C.titulo); doc.text(i + ' / ' + n, W - M, H - 24, { align: 'right' });
  }
  return doc;
}
async function baixarPDF() {
  let doc;
  try { doc = gerarPDF(); } catch (e) { console.warn(e); toast(tr('Não foi possível gerar o PDF.')); return; }
  const nome = 'procurement-plan-' + slugPlano() + '.pdf';
  const blob = doc.output('blob');
  if (CAP.downloads) {
    try { await CAP.downloads.save({ filename: nome, data: blob }); toast(tr('Arquivo enviado para download.')); }
    catch (e) { if (e && e.code !== 'declined') toast(tr('Não foi possível baixar agora.')); }
    return;
  }
  try { doc.save(nome); } catch (e) { toast(tr('Não foi possível baixar agora.')); }
}
