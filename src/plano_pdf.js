// =====================================================================
// PDF do plano de contratação (jsPDF + autotable). Separado de resumo.js na v12.
// =====================================================================
// ----------------------------------------------------------- PDF (jsPDF + autotable, fonte Helvetica)
const PDF_TROCA = { '→': '->', '←': '<-', '≥': '>=', '≤': '<=', '✓': 'v', '✕': 'x', '−': '-', '≈': '~', 'ⓘ': '(i)', ' ': ' ', ' ': ' ', '‑': '-', '‐': '-', '«': '«', '»': '»' };
const CP1252_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
function pdfTxt(x) {
  return String(x == null ? '' : x).replace(/[^\x00-\xFF]/g, ch => PDF_TROCA[ch] != null ? PDF_TROCA[ch] : CP1252_EXTRA.includes(ch) ? ch : (ch.normalize('NFKD').replace(/[^\x00-\xFF]/g, '') || ''));
}
function gerarPDF() {
  const J = window.jspdf; if (!J || !J.jsPDF) throw new Error('jspdf');
  const doc = new J.jsPDF({ unit: 'pt', format: 'a4', compress: true });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 46;
  const AZUL = [12, 45, 77], MARCA = [0, 105, 180], CINZA = [88, 102, 116], TINTA = [23, 33, 43], FAIXA = [31, 111, 184], FUNDO = [238, 243, 248];
  let y = M;
  const novaPag = () => { doc.addPage(); y = M; };
  const cabe = h => { if (y + h > H - M - 20) novaPag(); };
  const RE_URL = /https?:\/\/\S+[^\s.,;)]/;
  const texto = (s, o = {}) => {
    const size = o.size || 10, lh = size * 1.38, ind = o.ind || 0;
    let str = String(s == null ? '' : s), url = '';
    const m = str.match(RE_URL);
    if (m) { url = m[0]; str = str.replace(url, '').replace(/\s{2,}/g, ' ').trim(); }
    doc.setFont('helvetica', o.b ? 'bold' : o.i ? 'italic' : 'normal'); doc.setFontSize(size); doc.setTextColor(...(o.cor || TINTA));
    const linhas = str ? doc.splitTextToSize(pdfTxt(str), (o.w || (W - 2 * M)) - ind) : [];
    // itens de lista curtos não se partem entre páginas (evita uma linha solta no topo da página seguinte)
    if (o.bullet && linhas.length > 1 && linhas.length <= 6) cabe(linhas.length * lh);
    linhas.forEach((l, i) => { cabe(lh); if (o.bullet && i === 0) doc.text('•', M + 2, y + size); doc.text(l, M + ind, y + size); y += lh; });
    if (url) {
      cabe(lh); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MARCA);
      if (o.bullet && !linhas.length) doc.text('•', M + 2, y + size);
      doc.textWithLink(url, M + ind, y + size, { url }); y += lh;
    }
    y += o.after == null ? 4 : o.after;
  };
  const faixa = (s, cor, corTxt, size, b) => {
    doc.setFont('helvetica', b ? 'bold' : 'normal'); doc.setFontSize(size);
    const linhas = doc.splitTextToSize(pdfTxt(s), W - 2 * M - 20);
    const h = linhas.length * size * 1.38 + 14;
    cabe(h + 8);
    doc.setFillColor(...cor); doc.rect(M, y, W - 2 * M, h, 'F');
    doc.setTextColor(...corTxt);
    linhas.forEach((l, i) => doc.text(l, M + 10, y + 7 + size + i * size * 1.38));
    y += h + 10;
  };
  // capa
  const imgs = [...document.querySelectorAll('.top .logo')].slice(0, 2);
  let x = M;
  imgs.forEach(im => { try { const r = im.naturalWidth / im.naturalHeight || 2; const h = 34; doc.addImage(im.src, 'PNG', x, y, h * r, h); x += h * r + 14; } catch (e) { } });
  y += imgs.length ? 50 : 0;
  texto(NOME_FERRAMENTA, { b: true, size: 20, cor: AZUL, after: 2 });
  texto(tr('Plano de contratação'), { size: 14, cor: MARCA, after: 10 });
  texto(S.caso.titulo || (S.ctx || {}).olhando || tr('Caso sem título'), { b: true, size: 14, cor: TINTA, after: 2 });
  texto([(S.ctx || {}).local, tr('Gerado em') + ' ' + new Date().toLocaleDateString(LOC())].filter(Boolean).join(' · '), { size: 10, cor: CINZA, after: 8 });
  faixa(tr(FAIXA_PLANO), FUNDO, AZUL, 10, false);
  const secs = secoesPlano().map(trSecao);
  const ALERTA = [tr('Resolver antes de contratar')].map(pdfTxt);
  const ATENCAO = [tr('Tratar no plano')].map(pdfTxt), MARCAR = [tr('Alta'), tr('Prioridade')].map(pdfTxt);
  const tabela = (head, rows, opts = {}, t = {}) => {
    cabe(head ? 56 : 30);
    if (t.grupo) rows = rows.map((r, i) => i && r[0] === rows[i - 1][0] ? [''].concat(r.slice(1)) : r);
    const cs = {};
    (t.larg || []).forEach((wd, i) => { if (wd) cs[i] = { cellWidth: wd }; });
    // colunas numéricas: largura mínima do maior número, para não quebrar "150 000"
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.6);
    (t.num || []).forEach(i => {
      const wmax = Math.max(0, ...rows.map(r => doc.getTextWidth(pdfTxt(r[i] == null ? '' : r[i]))));
      cs[i] = Object.assign(cs[i] || {}, { halign: 'right', minCellWidth: Math.ceil(wmax + 10) });
    });
    const hl = t.hl || [];
    doc.autoTable(Object.assign({ rowPageBreak: 'avoid', columnStyles: cs, startY: y,
      didParseCell: dd => {
        if (dd.section !== 'body') return; const v = String(dd.cell.raw || '');
        if (ALERTA.includes(v)) { dd.cell.styles.textColor = [176, 30, 30]; dd.cell.styles.fontStyle = 'bold'; }
        else if (ATENCAO.includes(v) || ((t.marca || []).includes(dd.column.index) && MARCAR.includes(v))) { dd.cell.styles.textColor = [138, 90, 0]; dd.cell.styles.fontStyle = 'bold'; }
        if (hl.includes(dd.row.index)) dd.cell.styles.fillColor = [229, 240, 250];
        if ((t.grupo || t.b0) && dd.column.index === 0) dd.cell.styles.fontStyle = 'bold';
        if ((t.negrito || []).includes(dd.row.index) && dd.column.index === 1) dd.cell.styles.fontStyle = 'bold';
      },
      margin: { left: M, right: M, bottom: M + 14 }, head: head ? [head.map(pdfTxt)] : undefined, body: rows.map(r => r.map(pdfTxt)),
      styles: { font: 'helvetica', fontSize: 8.6, cellPadding: 4, textColor: TINTA, lineColor: [221, 227, 233], lineWidth: 0.5, overflow: 'linebreak', valign: 'top' },
      headStyles: { fillColor: FUNDO, textColor: AZUL, fontStyle: 'bold' }, alternateRowStyles: { fillColor: [250, 251, 253] }, theme: 'grid',
    }, opts));
    y = doc.lastAutoTable.finalY + 10;
  };
  // Figura 1 numa página própria: largura total, proporção mantida, legenda e crédito abaixo
  const figura = s => {
    if (typeof FIG_TCO === 'undefined' || !FIG_TCO) return;
    let pr = { width: 900, height: 1225 };
    try { pr = doc.getImageProperties(FIG_TCO) || pr; } catch (e) { }
    novaPag();
    texto(s.h, { b: true, size: 11.5, cor: MARCA, after: 6 });
    doc.setFont('helvetica', 'italic'); doc.setFontSize(9);
    const leg = doc.splitTextToSize(pdfTxt((s.pos || [])[0] || ''), W - 2 * M);
    const hLeg = leg.length * 9 * 1.38 + 8;
    let w = W - 2 * M, h = w * pr.height / pr.width;
    const hMax = H - M - 20 - y - hLeg;
    if (h > hMax) { h = hMax; w = h * pr.width / pr.height; }
    const x0 = M + (W - 2 * M - w) / 2;
    try { doc.addImage(FIG_TCO, 'JPEG', x0, y, w, h); } catch (e) { console.warn(e); }
    doc.setDrawColor(221, 227, 233); doc.setLineWidth(0.5); doc.rect(x0, y, w, h);
    y += h + 8;
    texto((s.pos || [])[0] || '', { i: true, size: 9, cor: CINZA });
    novaPag();
  };
  secs.forEach(s => {
    if (s.soPagina) return;
    if (s.tipo === 'figura') { figura(s); return; }
    if (s.tipo === 'bloco') { cabe(120); y += 8; faixa(s.h, FAIXA, [255, 255, 255], 14, true); return; }
    if (!s.sub) { cabe(70); if (y > M + 40) y += 6; } else cabe(44);
    texto(s.h, { b: true, size: s.sub ? 11.5 : 14, cor: s.sub ? MARCA : AZUL, after: 4 });
    (s.pre || []).forEach(z => texto(z, { b: true, size: 10, cor: [138, 90, 0] }));
    if ((s.kv || []).length) tabela(null, s.kv.map(([k, v]) => [k, v || '—']), { theme: 'plain', columnStyles: { 0: { cellWidth: 180, fontStyle: 'bold', textColor: CINZA } } });
    (s.p || []).forEach(z => texto(z, { size: 10 }));
    if ((s.list || []).length) s.list.forEach(z => texto(z, { size: 10, ind: 12, after: 2, bullet: true }));
    if (s.table && (s.table.rows || []).length) tabela(s.table.head, s.table.rows, {}, s.table);
    (s.pos || []).forEach(z => texto(z, { i: true, size: 9, cor: CINZA }));
  });
  // rodapé em todas as páginas
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...CINZA);
    doc.text(pdfTxt(NOME_FERRAMENTA + ' · ' + tr('Plano de contratação')), M, H - 24);
    doc.text(pdfTxt(tr('página ' + i + ' / ' + n)), W - M, H - 24, { align: 'right' });
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

