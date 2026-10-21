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
// v13 (pacote B3): matriz do caso em duas páginas retrato logo depois de "Em resumo"; perfil com governança.
// =====================================================================
const PDF_TROCA = { '→': '->', '←': '<-', '≥': '>=', '≤': '<=', '✓': 'v', '✕': 'x', '−': '-', '≈': '~', 'ⓘ': '(i)', ' ': ' ', ' ': ' ', '‑': '-', '‐': '-', '«': '«', '»': '»', '☐': '', '·': '·' };
const CP1252_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
function pdfTxt(x) {
  if (PDF_FONTE) return ajustarTextoPDF(x);   // v13: árabe, chinês e bambara (fonte embutida)
  return String(x == null ? '' : x).replace(/[^\x00-\xFF]/g, ch => PDF_TROCA[ch] != null ? PDF_TROCA[ch] : CP1252_EXTRA.includes(ch) ? ch : (ch.normalize('NFKD').replace(/[^\x00-\xFF]/g, '') || ''));
}
// Paleta do relatório (plano/7_relatorio_design.md)
const PDF_COR = {
  tinta: [23, 33, 43], titulo: [12, 45, 77], marca: [0, 105, 180], fundo: [245, 248, 251], linha: [221, 227, 233], muted: [88, 102, 116],
  cab: [238, 243, 248], branco: [255, 255, 255], alta: [179, 38, 30], media: [138, 90, 0], roxo: [94, 60, 134],
  tintA: [229, 240, 250], tintB: [238, 233, 245], ambar: [253, 246, 231], ambarL: [230, 200, 140],
  fases: [[169, 212, 245], [95, 168, 227], [31, 111, 184], [11, 60, 110]],
  fasesS: [[111, 178, 230], [62, 143, 208], [22, 90, 153], [7, 42, 79]],
  // camadas 1–7 (v15, A3): os mesmos sete matizes da página (COR_CAMADA, resumo.js), distintos entre si
  camadas: [null, [11, 92, 173], [34, 166, 200], [120, 68, 196], [47, 143, 91], [201, 151, 0], [217, 87, 127], [91, 103, 115]],
};
// Áreas do perfil do caso: chaves (em português) das linhas do resumo do caso em secoesPlano()
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

function gerarPDF() {
  const J = window.jspdf; if (!J || !J.jsPDF) throw new Error('jspdf');
  const doc = new J.jsPDF({ unit: 'pt', format: 'a4', compress: true });
  fontePDF(doc);   // v13: fonte embutida nos idiomas fora do WinAnsi (sem efeito em PT/EN/ES/FR)
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 46;
  const TOP = 60, BASE = H - 54, LW = W - 2 * M;   // área útil das páginas internas
  const C = PDF_COR;
  let y = TOP;
  const novaPag = () => { doc.addPage(); y = TOP; };
  const cabe = h => { if (y + h > BASE) { novaPag(); return false; } return true; };
  const fonte = (size, st, cor) => { doc.setFont('helvetica', st || 'normal'); doc.setFontSize(size); if (cor) doc.setTextColor(...cor); };
  const quebra = (s, size, w, st) => { fonte(size, st); return s ? doc.splitTextToSize(pdfTxt(s), w) : []; };
  let LHK = 1.38;   // espaçamento entre linhas (1,3 nos anexos)
  const LH = size => size * LHK;
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
  const resumoRaw = raw.find(s => s.tipo === 'perfil') || { kv: [] };
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
  let TFS = 8.6, TPAD = 5;   // tabelas: 8,6 pt no corpo; 8,2 pt, margem menor nos anexos
  const altTabela = (head, rows, t) => {
    const nc = (head || rows[0] || []).length, larg = t.larg || [];
    const fixo = larg.reduce((a, b) => a + (b || 0), 0), livres = nc - larg.filter(Boolean).length;
    const wc = i => larg[i] || Math.max(40, (LW - 2 * (t.dx || 0) - fixo) / Math.max(1, livres));
    const lin = r => Math.max(1, ...r.map((z, i) => quebra(String(z == null ? '' : z), TFS, wc(i) - 2 * TPAD).length));
    return (head ? 2 * TPAD + lin(head) * TFS * 1.2 + 2 : 0) + rows.reduce((s, r) => s + 2 * TPAD + lin(r) * TFS * 1.2, 0);
  };
  const tabela = (head, rows, t = {}, cor) => {
    const hT = altTabela(head, rows, t);
    // tabela curta fica inteira; longa começa com pelo menos o cabeçalho e duas linhas
    if (y + hT > BASE) cabe(hT < 260 ? hT + 4 : head ? 70 : 34);
    if (t.grupo) rows = rows.map((r, i) => i && r[0] === rows[i - 1][0] ? [''].concat(r.slice(1)) : r);
    const cs = {};
    (t.larg || []).forEach((wd, i) => { if (wd) cs[i] = { cellWidth: wd }; });
    fonte(TFS, 'normal');
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
      styles: { font: 'helvetica', fontSize: TFS, cellPadding: TPAD, textColor: C.tinta, lineColor: C.linha, lineWidth: { bottom: 0.5 }, overflow: 'linebreak', valign: 'top' },
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

  // ---------------------------------------------------------------- página 1: capa e resumo (v14, BL6.1)
  const sinteseS = secs.find(s => s.tipo === 'sintese') || { recs: [] };
  const paginaUm = () => {
    const BH = 62, n = 160;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1) * 3, k = Math.min(2, Math.floor(t));
      doc.setFillColor(...mix(C.fases[k], C.fases[k + 1], t - k));
      doc.rect(W * i / n, 0, W / n + 0.6, BH, 'F');
    }
    const vistos = new Set();
    const imgs = [...document.querySelectorAll('img.logo')].filter(im => im.src && !vistos.has(im.src) && vistos.add(im.src)).slice(0, 2);
    if (imgs.length) {
      const hL = 28, pad = 8, gap = 12;
      const ws = imgs.map(im => hL * ((im.naturalWidth / im.naturalHeight) || 2));
      const wPl = ws.reduce((a, b) => a + b, 0) + gap * (imgs.length - 1) + 2 * pad;
      doc.setFillColor(...C.branco); doc.roundedRect(M, 12, wPl, hL + 2 * 6, 6, 6, 'F');
      let x = M + pad;
      imgs.forEach((im, i) => {
        try { doc.addImage(im.src, 'PNG', x, 18, ws[i], hL); } catch (e) { }
        x += ws[i];
        if (i < imgs.length - 1) { doc.setDrawColor(...C.linha); doc.setLineWidth(0.7); doc.line(x + gap / 2, 20, x + gap / 2, 18 + hL - 2); x += gap; }
      });
    }
    fonte(8.6, 'bold', C.branco);
    doc.text(pdfTxt(tP('sub').toUpperCase()), W - M, 30, { align: 'right', charSpace: 0.6 });
    fonte(8.6, 'normal', C.branco);
    doc.text(pdfTxt(new Date().toLocaleDateString(LOC(), { year: 'numeric', month: 'long', day: 'numeric' })), W - M, 43, { align: 'right' });

    y = BH + 18;
    fonte(9.6, 'bold', C.marca); doc.text(pdfTxt(NOME_FERRAMENTA), M, y + 8); y += 15;
    const LC = corta(quebra(nomeCaso, 19, LW, 'bold'), 2);
    fonte(19, 'bold', C.titulo); LC.forEach(l => { doc.text(l, M, y + 16); y += 23; });
    fonte(9.6, 'normal', C.muted);
    doc.text(pdfTxt([ctx.local, tP('gerado') + ' ' + new Date().toLocaleDateString(LOC())].filter(Boolean).join('  ·  ')), M, y + 9); y += 18;
    // recomendação principal (A1)
    if (sinteseS.principal) {
      const Lp = corta(quebra(sinteseS.principal, 9.6, LW - 16, 'bold'), 2);
      const hp = 22 + Lp.length * 12.4;
      doc.setFillColor(...C.fundo); doc.roundedRect(M, y, LW, hp, 5, 5, 'F'); doc.setFillColor(...C.marca); doc.rect(M, y + 4, 3.4, hp - 8, 'F');
      fonte(8, 'bold', C.marca); doc.text(pdfTxt(tP('recPrincipal').toUpperCase()), M + 12, y + 12, { charSpace: 0.4 });
      fonte(9.6, 'bold', C.titulo); Lp.forEach((l, i) => doc.text(l, M + 12, y + 24 + i * 12.4));
      y += hp + 10;
    } else y += 2;
    // isenção no pé da página 1 (desenhada antes, para o conteúdo seguir fluindo)
    const Lf = quebra(tr(FAIXA_PLANO), 8, LW);
    fonte(8, 'normal', C.muted); Lf.forEach((l, i) => doc.text(l, M, H - 44 + i * 9.4));
    fonte(8, 'normal', C.muted); quebra(tr(TXT_VINCULO), 8, LW).slice(0, 1).forEach((l, i) => doc.text(l, M, H - 44 + (Lf.length + i) * 9.4));
    const dd = sinteseS.d;
    if (!dd) { texto(sinteseS.semCusto || tP('semCusto'), { cor: C.muted }); }
    else {
      // TCO com a faixa P10 a P90
      const hT = 86;
      doc.setDrawColor(...C.linha); doc.setLineWidth(0.7); doc.setFillColor(...C.branco); doc.roundedRect(M, y, LW, hT, 7, 7, 'FD');
      doc.setFillColor(...C.marca); doc.rect(M + 14, y, 36, 3.6, 'F');
      fonte(8, 'bold', C.muted); doc.text(pdfTxt(tr(TXT_REL.kTco).toUpperCase()), M + 14, y + 15, { charSpace: 0.35 });
      fonte(24, 'bold', C.titulo); doc.text(pdfTxt(dd.centralTxt), M + 14, y + 41);
      const wV = doc.getTextWidth(pdfTxt(dd.centralTxt));
      fonte(9.6, 'bold', C.titulo); doc.text(pdfTxt(dd.faixaTxt), M + 14, y + 56);
      const xT = Math.max(M + 14 + wV + 20, M + 250), wT = M + LW - 14 - xT;
      const w = Math.max(dd.hi - dd.lo, dd.central * 0.02), a = dd.lo - 0.5 * w, b = dd.hi + 0.5 * w, px = v => xT + wT * (v - a) / (b - a);
      doc.setFillColor(...C.cab); doc.roundedRect(xT, y + 28, wT, 9, 4.5, 4.5, 'F');
      doc.setFillColor(...C.fases[0]); doc.roundedRect(px(dd.lo), y + 28, Math.max(3, px(dd.hi) - px(dd.lo)), 9, 4.5, 4.5, 'F');
      doc.setFillColor(...C.titulo); doc.rect(px(dd.central) - 1.5, y + 25, 3, 15, 'F');
      fonte(8, 'normal', C.muted);
      const LN = corta(quebra(dd.nota, 8, LW - 28), 2); LN.forEach((l, i) => doc.text(l, M + 14, y + 70 + i * 9.6));
      y += hT + 8;
      const g = 10, wk = (LW - 2 * g) / 3, hk = 54;
      dd.kpis.forEach((k, i) => cartaoKPI(M + i * (wk + g), y, wk, hk, k.v, k.l, C.fasesS[i], 13));
      y += hk + 10;
    }
    // a proposta em seis respostas (O quê, Por quê, Para quê, Como, Entregáveis, Indicadores)
    const ex = sinteseS.exec || [];
    if (ex.length) {
      fonte(11.5, 'bold', C.titulo); doc.text(pdfTxt(tr(TXT_REL.exT)), M, y + 11); y += 17;
      const LB = H - 44 - 8;   // a página 1 termina acima da isenção
      const wR = 112, wA = LW - wR - 12;
      ex.forEach(x => {
        const fr = x.frases.length ? x.frases : [x.falta];
        const LL = fr.map(f => quebra(f, 8.8, wA - (fr.length > 1 ? 10 : 0)));
        const hA = LL.reduce((a2, L) => a2 + L.length * 11.2 + 2, 0);
        const hR = 8 + Math.max(hA, 26) + 4;
        if (y + hR > (doc.getNumberOfPages() === 1 ? LB : BASE)) novaPag();
        doc.setDrawColor(...C.linha); doc.setLineWidth(0.5); doc.line(M, y + hR, M + LW, y + hR);
        fonte(9.6, 'bold', C.marca); doc.text(pdfTxt(x.rot), M, y + 13);
        fonte(8, 'normal', C.muted); corta(quebra(x.perg, 8, wR - 6), 2).forEach((l, i) => doc.text(l, M, y + 24 + i * 9.4));
        let yy = y + 8;
        LL.forEach(L => {
          if (fr.length > 1) { doc.setFillColor(...C.marca); doc.rect(M + wR + 12, yy + 3.6, 3, 3, 'F'); }
          fonte(8.8, 'normal', x.frases.length ? C.tinta : C.muted);
          L.forEach(l => { doc.text(l, M + wR + 12 + (fr.length > 1 ? 10 : 0), yy + 8.6); yy += 11.2; }); yy += 2;
        });
        y += hR + 2;
      });
    }
    // as cinco ações, cada uma com O quê, Por quê, Para quê, Como, Quem e Quando (seguem logo após as seis respostas)
    cabe(300); y += 10;
    const recs5 = sinteseS.recs || [];
    tituloSec(tr(TXT_REL.acoes5), recs5.length ? tr(TXT_REL.acoesAbre) : '', C.alta);
    if (!recs5.length) texto(tr(TXT_REL.semAcoes), { cor: C.muted, size: 9.6 });
    else {
      fonte(8.2, 'bold'); const wL = Math.max(62, ...['exOque', 'exPorque', 'exParaque', 'exComo', 'exQuem', 'exQuando'].map(k => doc.getTextWidth(pdfTxt(tr(TXT_REL[k]))) + 8)), xT = M + 30, wV = LW - 30 - wL - 14;
      const campos = r => [['exOque', r.oque, 'bold'], ['exPorque', r.porque], ['exParaque', r.paraque], ['exComo', r.como], ['exQuem', r.quemTxt], ['exQuando', r.quandoTxt]].filter(z => z[1]);
      recs5.forEach(r => {
        const F = campos(r).map(([k, v, st]) => [tr(TXT_REL[k]), quebra(v, 8.6, wV, st || 'normal'), st]);
        const h = 9 + F.reduce((a2, f) => a2 + f[1].length * 10.3 + 2.4, 0) + 5;
        cabe(h + 4);
        doc.setDrawColor(...C.linha); doc.setLineWidth(0.7); doc.setFillColor(...C.branco); doc.roundedRect(M, y, LW, h, 6, 6, 'FD');
        doc.setFillColor(...C.alta); doc.rect(M, y + 1, 4, h - 2, 'F');
        fonte(16, 'bold', C.alta); doc.text(String(r.n), M + 17, y + 22, { align: 'center' });
        let yy = y + 10;
        F.forEach(([rot, L, st]) => {
          fonte(8.2, 'bold', C.marca); doc.text(pdfTxt(rot), xT, yy + 8);
          fonte(8.6, st || 'normal', st ? C.titulo : C.tinta); L.forEach(l => { doc.text(l, xT + wL, yy + 8.4); yy += 10.3; }); yy += 2.4;
        });
        y += h + 5;
      });
    }
    // o custo em resumo: fases (uma vez, recorrente) e o que mais move o custo
    if (dd) {
      cabe(160);
      y += 6;
      fonte(13, 'bold', C.titulo); doc.text(pdfTxt(tr(TXT_REL.custoT)), M, y + 13); y += 20;
      const I = sinteseS.ice;
      if (I && I.fases.length) {
        const nF = I.fases.length, g = 10, wC = (LW - g * (nF - 1)) / nF, pd = 8, wI = wC - 2 * pd;
        const hCab = 30, hPico = 30, hLin = 18, hA = 16 + 4 * hLin + 4, hB = 24 + 6 * hLin + 2, hPe = 54;
        const hTot = hCab + hPico + hA - 4 + hB + 4 + hPe;
        fonte(10.5, 'bold', C.titulo); const LT = quebra(I.h, 10.5, LW, 'bold');
        cabe(hTot + 30 + LT.length * 13);
        LT.forEach(l => { doc.text(l, M, y + 10); y += 13; }); y += 2;
        texto(I.abre, { size: 8.4, cor: C.muted, after: 6 });
        cabe(hTot + 24);
        const agua = [11, 79, 124], agua2 = [16, 92, 140], ceu = [236, 246, 253], gelo = [185, 221, 246], gelo2 = [125, 184, 230], borda = [78, 155, 211], barF = [227, 236, 244], barA = [169, 220, 248], cinza = [139, 152, 165], azulO = [11, 90, 140];
        const TINT = { piloto: [251, 228, 216], implantacao: [220, 235, 250], expansao: [220, 243, 230] };
        const poli = (pts, estilo) => { const [x0_, y0_] = pts[0]; doc.lines(pts.slice(1).map((p_, k) => [p_[0] - pts[k][0], p_[1] - pts[k][1]]), x0_, y0_, [1, 1], estilo, true); };
        const linha = (x, yy, z, escuro) => {
          const zero = z.ano < 0.5;
          fonte(8, zero ? 'normal' : 'normal', zero ? (escuro ? [143, 182, 211] : cinza) : (escuro ? C.branco : C.tinta)); doc.text(corta(quebra(z.nome, 8, wI - 48), 1)[0] || '', x, yy + 8);
          fonte(8, 'bold', zero ? (escuro ? [143, 182, 211] : cinza) : (escuro ? C.branco : C.titulo)); doc.text(pdfTxt(z.txt), x + wI, yy + 8, { align: 'right' });
          doc.setFillColor(...(escuro ? [40, 104, 146] : barF)); doc.roundedRect(x, yy + 12, wI, 2.2, 1.1, 1.1, 'F');
          if (z.w > 0) { doc.setFillColor(...(escuro ? barA : C.marca)); doc.roundedRect(x, yy + 12, Math.max(1.5, wI * z.w), 2.2, 1.1, 1.1, 'F'); }
        };
        I.fases.forEach((f, i) => {
          const x0 = M + i * (wC + g); let yy = y; const tint = TINT[f.id] || TINT.implantacao;
          // cabeçalho colorido da fase
          doc.setFillColor(...tint); doc.roundedRect(x0, yy, wC, hCab + 6, 6, 6, 'F'); doc.rect(x0, yy + hCab - 4, wC, 10, 'F');
          fonte(9.4, 'bold', C.titulo); doc.text(corta(quebra(f.nome, 9.4, wI, 'bold'), 1)[0] || '', x0 + pd, yy + 13);
          fonte(8, 'normal', C.muted); doc.text(pdfTxt(f.anosTxt), x0 + pd, yy + 24); yy += hCab;
          // céu com o pico do iceberg (duas faces, contorno e reflexos)
          doc.setFillColor(...ceu); doc.rect(x0, yy, wC, hPico + hA - 8, 'F');
          const L = x0 + wC * 0.1, R = x0 + wC * 0.9, b = yy + hPico + 10, top = yy + 3, cx = x0 + wC * 0.52, ww = R - L;
          const P = [[L, b], [L + ww * 0.22, yy + hPico * 0.45], [L + ww * 0.3, yy + hPico * 0.6], [cx, top], [L + ww * 0.62, yy + hPico * 0.42], [L + ww * 0.72, yy + hPico * 0.3], [R, b]];
          doc.setFillColor(...gelo); poli(P, 'F');
          doc.setFillColor(...gelo2); poli([[cx, top], [L + ww * 0.62, yy + hPico * 0.42], [L + ww * 0.72, yy + hPico * 0.3], [R, b], [cx + ww * 0.04, b], [cx - ww * 0.04, yy + hPico * 0.5]], 'F');
          doc.setDrawColor(...borda); doc.setLineWidth(0.8); poli(P, 'S');
          doc.setDrawColor(...C.branco); doc.setLineWidth(1.3); doc.line(cx, top, cx - 4, top + 13); doc.line(cx, top, cx + 6, top + 15);
          yy += hPico;
          // caixa branca: o preço da proposta
          doc.setFillColor(214, 226, 236); doc.roundedRect(x0 + pd - 3 + 0.6, yy + 0.9, wC - 2 * pd + 6, hA, 5, 5, 'F');
          doc.setFillColor(...C.branco); doc.roundedRect(x0 + pd - 3, yy, wC - 2 * pd + 6, hA, 5, 5, 'F');
          fonte(8, 'bold', C.muted); doc.text(pdfTxt(I.acima.toUpperCase()), x0 + pd, yy + 11, { charSpace: 0.3 });
          f.acima.forEach((z, k) => linha(x0 + pd, yy + 15 + k * hLin, z, false));
          yy += hA - 4;
          // água funda com o gelo submerso, mais largo quanto maior a parcela escondida
          doc.setFillColor(46, 155, 216); doc.rect(x0, yy, wC, 3.5, 'F');
          doc.setFillColor(...agua); doc.rect(x0, yy + 3.5, wC, hB + 4 - 3.5, 'F');
          const pw = 0.62 + 0.36 * Math.max(0, Math.min(1, f.pOculto)), l = x0 + wC * (0.5 - pw / 2), r = x0 + wC * (0.5 + pw / 2), yb = yy + hB + 4;
          doc.setFillColor(...agua2);
          poli([[x0 + wC * 0.2, yy + 3.5], [x0 + wC * 0.8, yy + 3.5], [r - 2, yy + (yb - yy) * 0.3], [r, yy + (yb - yy) * 0.62], [r - 8, yy + (yb - yy) * 0.92], [x0 + wC * 0.58, yb], [x0 + wC * 0.36, yb - 2], [l + 6, yy + (yb - yy) * 0.84], [l, yy + (yb - yy) * 0.52], [l + 4, yy + (yb - yy) * 0.24]], 'F');
          fonte(8, 'bold', [191, 227, 250]); doc.text(pdfTxt(I.abaixo.toUpperCase()), x0 + pd, yy + 18, { charSpace: 0.3 });
          f.abaixo.forEach((z, k) => linha(x0 + pd, yy + 23 + k * hLin, z, true));
          yy += hB + 4;
          // pé colorido: média por ano, total e parcela escondida
          doc.setFillColor(...tint); doc.rect(x0, yy, wC, hPe - 6, 'F'); doc.roundedRect(x0, yy, wC, hPe, 6, 6, 'F');
          fonte(8, 'normal', C.muted); doc.text(pdfTxt(I.mediaRot), x0 + wC / 2, yy + 11, { align: 'center' });
          fonte(14, 'bold', C.titulo); doc.text(pdfTxt(f.mediaTxt), x0 + wC / 2, yy + 27, { align: 'center' });
          fonte(8, 'normal', C.muted); doc.text(corta(quebra(f.totalTxt, 8, wI), 1)[0] || '', x0 + wC / 2, yy + 38, { align: 'center' });
          fonte(8, 'bold', azulO); doc.text(corta(quebra(f.ocultoTxt, 8, wI, 'bold'), 1)[0] || '', x0 + wC / 2, yy + 49, { align: 'center' });
          doc.setDrawColor(211, 222, 232); doc.setLineWidth(0.6); doc.roundedRect(x0, y, wC, hTot, 6, 6, 'S');
        });
        y += hTot + 6;
        texto(I.nota, { size: 8, cor: C.muted, i: true, after: 8 });
      }
      cabe(24 + dd.drivers.length * 21);
      fonte(10.5, 'bold', C.titulo); doc.text(pdfTxt(tr(TXT_REL.direcionadores)), M, y + 10); y += 15;
      const xB = M + 250, wB = LW - 250;
      dd.drivers.forEach((z, i) => {
        fonte(8.8, 'bold', C.titulo); doc.text(corta(quebra((i + 1) + '. ' + z.nome, 8.8, 240, 'bold'), 1)[0] || '', M, y + 9);
        fonte(8, 'normal', C.muted); doc.text(pdfTxt(z.faixa), M + 14, y + 18);
        doc.setFillColor(...C.cab); doc.rect(xB, y + 2, wB, 6, 'F');
        doc.setFillColor(...C.alta); doc.rect(xB, y + 2, Math.max(2, wB * z.w), 6, 'F');
        fonte(8, 'normal', C.tinta); doc.text(pdfTxt(z.loTxt + '  a  ' + z.hiTxt), xB, y + 17);
        y += 21;
      });
    }
  };
  let pagFaltas = 0, pagAnexoA = 0, boxFaltas = null;
  const INDICE = [];   // [título, página] para o índice

  // ---------------------------------------------------------------- "Como ler", faltas e índice (página 2)
  let yIndice = 0, hIndice = 0, pagComoLer = 2;
  const comoLer = () => {
    novaPag(); pagComoLer = doc.getNumberOfPages();
    const sC = secs.find(s => s.tipo === 'caixa');
    if (sC) {
      const itens = sC.list.map(z => quebra(z, 9.4, LW - 44));
      const h = 42 + itens.reduce((a, L) => a + L.length * 12.4 + 4, 0);
      doc.setFillColor(...C.fundo); doc.roundedRect(M, y, LW, h, 8, 8, 'F'); doc.setFillColor(...C.marca); doc.rect(M, y + 8, 4, h - 16, 'F');
      fonte(12, 'bold', C.titulo); doc.text(pdfTxt(sC.h), M + 18, y + 22);
      let yy = y + 36;
      itens.forEach(L => { doc.setFillColor(...C.marca); doc.rect(M + 20, yy + 3.4, 3, 3, 'F'); fonte(9.4, 'normal', C.tinta); L.forEach(l => { doc.text(l, M + 32, yy + 9); yy += 12.4; }); yy += 4; });
      y += h + 14;
    }
    const sF = secs.find(s => s.tipo === 'faltas' && s.curta);
    if (sF) {
      const nT = sF.total || sF.list.length;
      const Lh = quebra(sF.p[0] + ' ' + (sF.p[1] || ''), 9.4, LW - 24, 'bold');
      const Li = sF.list.map(z => corta(quebra(z, 9, LW - 40), 2));
      const h = 16 + Lh.length * 12.4 + Li.reduce((a, L) => a + L.length * 11.6 + 3, 0) + 6;
      doc.setFillColor(...C.ambar); doc.setDrawColor(...C.ambarL); doc.setLineWidth(0.6); doc.roundedRect(M, y, LW, h, 5, 5, 'FD');
      fonte(9.4, 'bold', C.media); let yy = y + 8; Lh.forEach(l => { doc.text(l, M + 12, yy + 9); yy += 12.4; }); yy += 4;
      Li.forEach(L => { doc.setFillColor(...C.media); doc.rect(M + 14, yy + 3.2, 3, 3, 'F'); fonte(9, 'normal', C.tinta); L.forEach(l => { doc.text(l, M + 24, yy + 8.5); yy += 11.6; }); yy += 3; });
      boxFaltas = { y, h }; y += h + 12;
    }
    // espaço do índice (preenchido no fim, quando as páginas são conhecidas)
    yIndice = y; hIndice = 24 + 8 * 16; y += hIndice + 6;
  };
  const desenharIndice = () => {
    const itens = INDICE.filter(z => z[1]);
    if (!itens.length) return;
    doc.setPage(pagComoLer);
    const lin = Math.ceil(itens.length / 2), g = 24, wI = (LW - g) / 2, hl = Math.min(16, (hIndice - 20) / lin);
    fonte(8.6, 'bold', C.marca); doc.text(pdfTxt(tP('indice').toUpperCase()), M, yIndice + 8, { charSpace: 0.5 });
    itens.forEach(([t, pg], i) => {
      const x = M + Math.floor(i / lin) * (wI + g), yy = yIndice + 16 + (i % lin) * hl;
      fonte(9.2, 'normal', C.tinta);
      let tt = pdfTxt(t); while (doc.getTextWidth(tt) > wI - 30 && tt.length > 8) tt = tt.slice(0, -2);
      if (tt !== pdfTxt(t)) tt = tt.replace(/\s*\S?$/, '') + '…';
      doc.text(tt, x, yy + 10);
      fonte(9.2, 'bold', C.titulo); doc.text(String(pg), x + wI, yy + 10, { align: 'right' });
      doc.setDrawColor(...C.linha); doc.setLineWidth(0.5); doc.line(x, yy + hl - 2.5, x + wI, yy + hl - 2.5);
      ehLink(x, yy, wI, hl, pg);
    });
  };

  // ---------------------------------------------------------------- gráficos (v14, BL5.3): mesmos dados e leitura da página
  const grafCab = (g, alt) => {
    const Lt = quebra(g.h, 11.5, LW, 'bold'), Ls = g.sub ? quebra(g.sub, 8.6, LW) : [];
    cabe(Lt.length * 15 + Ls.length * 11.4 + alt + 30);
    y += 6;
    fonte(11.5, 'bold', C.titulo); Lt.forEach(l => { doc.text(l, M, y + 11.5); y += 15; });
    fonte(8.6, 'normal', C.muted); Ls.forEach(l => { doc.text(l, M, y + 8.6); y += 11.4; });
    y += 6;
  };
  const grafFim = g => { if (g.leitura) texto(g.leitura, { size: 9.6, after: 8 }); else y += 6; };
  const legenda = (itens, cores) => {
    let x = M, yy = y;
    itens.forEach((t, i) => {
      fonte(8, 'normal', C.tinta); const w = doc.getTextWidth(pdfTxt(t)) + 22;
      if (x + w > M + LW) { x = M; yy += 12; }
      doc.setFillColor(...cores[i]); doc.rect(x, yy + 1, 7, 7, 'F'); doc.text(pdfTxt(t), x + 11, yy + 7.6); x += w;
    });
    y = yy + 16;
  };
  const FASE_COR = { piloto: C.fases[1], implantacao: C.fases[2], expansao: C.fases[3] };
  const grafFases = g => {
    grafCab(g, 170);
    legenda(g.camadas.map(c => c.n + '. ' + c.nome), g.camadas.map(c => C.camadas[c.n]));
    const hCh = 96, yB = y + 12 + hCh, mx = Math.max(1, ...g.anos.map(a => a.total)), n = g.anos.length, passo = LW / n, wc = Math.min(46, passo * 0.56);
    doc.setDrawColor(...C.linha); doc.setLineWidth(0.5); [0.5, 1].forEach(f => doc.line(M, yB - hCh * f, W - M, yB - hCh * f));
    g.anos.forEach((a, i) => {
      const cx = M + passo * i + (passo - wc) / 2; let acc = 0;
      a.v.forEach((v, k) => { const hh = Math.max(0, v) / mx * hCh; if (hh > 0) { doc.setFillColor(...C.camadas[k + 1]); doc.rect(cx, yB - acc - hh, wc, Math.max(0.6, hh), 'F'); acc += hh; } });
      fonte(8, 'bold', C.titulo); doc.text(pdfTxt(a.totTxt), cx + wc / 2, yB - acc - 4, { align: 'center' });
      fonte(8.6, 'normal', C.muted); doc.text(pdfTxt(a.rot), cx + wc / 2, yB + 12, { align: 'center' });
      doc.setDrawColor(...(FASE_COR[a.fase] || C.fases[1])); doc.setLineWidth(2.4); doc.line(M + passo * i + 2, yB + 17, M + passo * (i + 1) - 2, yB + 17);
      fonte(8, 'normal', C.muted); const lf = corta(quebra(a.faseNome, 8, passo - 4), 2); lf.forEach((l, j) => doc.text(l, cx + wc / 2, yB + 27 + j * 9, { align: 'center' }));
    });
    doc.setDrawColor(...C.muted); doc.setLineWidth(0.8); doc.line(M, yB, W - M, yB);
    y = yB + 40; grafFim(g);
  };
  const grafCamadas = g => {
    grafCab(g, 7 * 19 + 24);
    const wRot = 204, wVal = 100, x0 = M + wRot + 8, wBar = LW - wRot - 8 - wVal, max = Math.max(1e-9, ...g.vals);
    g.camadas.forEach((c, i) => {
      const n = c.n, L = corta(quebra(n + '. ' + c.nome, 8.6, wRot), 2), hRow = Math.max(19, L.length * 10.6 + 7);
      fonte(8.6, 'normal', C.tinta); L.forEach((l, j) => doc.text(l, M, y + 9 + j * 10.6 + (L.length === 1 ? 4 : 0)));
      doc.setFillColor(...C.fundo); doc.rect(x0, y + 3, wBar, 12, 'F');
      const bw = Math.max(0, g.vals[i]) / max * wBar;
      doc.setFillColor(...C.camadas[n]); if (bw > 0) doc.rect(x0, y + 3, Math.max(1.5, bw), 12, 'F');
      fonte(8.6, 'bold', C.titulo); doc.text(pdfTxt(g.valsTxt[i]), x0 + wBar + 8, y + 12.5);
      fonte(8.6, 'normal', C.muted); doc.text(pdfTxt(g.pcts[i]), W - M, y + 12.5, { align: 'right' });
      y += hRow;
    });
    fonte(8.6, 'bold', C.titulo); doc.text(pdfTxt(tr('Total')), M, y + 10); doc.text(pdfTxt(g.totTxt), x0 + wBar + 8, y + 10);
    fonte(8.6, 'normal', C.muted); doc.text('100%', W - M, y + 10, { align: 'right' });
    y += 22; grafFim(g);
  };
  const grafAdocao = g => {
    grafCab(g, 150);
    legenda(g.leg, [C.fases[0], C.fases[2]]);
    const hCh = 80, yB = y + 14 + hCh, mx = Math.max(1, ...g.anos.map(a => a.E)), n = g.anos.length, passo = LW / n, wc = Math.min(46, passo * 0.56);
    doc.setDrawColor(...C.linha); doc.setLineWidth(0.5); [0.5, 1].forEach(f => doc.line(M, yB - hCh * f, W - M, yB - hCh * f));
    g.anos.forEach((a, i) => {
      const cx = M + passo * i + (passo - wc) / 2, hE = Math.max(0, a.E) / mx * hCh, hU = hE * (a.ad || 0);
      doc.setFillColor(...C.fases[0]); if (hE > 0) doc.rect(cx, yB - hE, wc, Math.max(1, hE), 'F');
      doc.setFillColor(...C.fases[2]); if (hU > 0) doc.rect(cx, yB - hU, wc, Math.max(0.6, hU), 'F');
      fonte(8, 'bold', C.titulo); doc.text(pdfTxt(a.eTxt), cx + wc / 2, yB - hE - 4, { align: 'center' });
      fonte(8.6, 'normal', C.muted); doc.text(pdfTxt(a.rot), cx + wc / 2, yB + 12, { align: 'center' });
      fonte(8, 'normal', C.muted); doc.text(pdfTxt(a.uTxt + ' · ' + a.adTxt), cx + wc / 2, yB + 22, { align: 'center' });
    });
    doc.setDrawColor(...C.muted); doc.setLineWidth(0.8); doc.line(M, yB, W - M, yB);
    y = yB + 32; grafFim(g);
  };
  const grafCenarios = g => {
    grafCab(g, 3 * 44 + 20);
    legenda(g.leg, [C.fases[1], C.fases[3]]);
    const mx = Math.max(1e-9, ...g.itens.map(c => c.total)), wMax = LW - 4;
    g.itens.forEach(c => {
      cabe(44);
      fonte(9.4, 'bold', C.titulo); doc.text(pdfTxt(c.nome), M, y + 9);
      const wn = doc.getTextWidth(pdfTxt(c.nome)); fonte(8.2, 'normal', C.muted); doc.text(corta(quebra(c.desc, 8.2, LW - wn - 12), 1)[0] || '', M + wn + 8, y + 9);
      const wt = wMax * c.total / mx, wu = c.total > 0 ? wt * Math.max(0, c.unico) / c.total : 0;
      doc.setFillColor(...C.fases[1]); doc.rect(M, y + 14, Math.max(0.6, wu), 12, 'F'); doc.setFillColor(...C.fases[3]); doc.rect(M + wu, y + 14, Math.max(0.6, wt - wu), 12, 'F');
      fonte(9, 'bold', C.titulo); doc.text(pdfTxt(c.totTxt), M, y + 38);
      const wv = doc.getTextWidth(pdfTxt(c.totTxt)); fonte(8.2, 'normal', C.muted); doc.text(pdfTxt(g.leg[0] + ' ' + c.unicoTxt + '  ·  ' + g.leg[1] + ' ' + c.recTxt), M + wv + 8, y + 38);
      y += 46;
    });
    y += 2; grafFim(g);
  };
  const grafTornado = g => {
    grafCab(g, g.linhas.length * 26 + 36);
    legenda(g.leg, [C.fases[1], C.alta]);
    fonte(8, 'normal', C.muted); doc.text(pdfTxt(g.baseTxt), M, y + 6); y += 12;
    const wL = 168, xc = M + wL + (LW - wL) / 2, wH = (LW - wL) / 2 - 78, mx = g.max;
    doc.setDrawColor(...C.titulo); doc.setLineWidth(1);
    const y0 = y;
    g.linhas.forEach(r => {
      cabe(26);
      fonte(8.8, 'bold', C.titulo); const Ln = corta(quebra(r.nome, 8.8, wL - 6, 'bold'), 2); Ln.forEach((l, i) => doc.text(l, M, y + 9 + i * 10));
      fonte(8, 'normal', C.muted); doc.text(pdfTxt(r.faixa), M, y + 9 + Ln.length * 10);
      const bar = (v, cor) => { const w = Math.abs(v) / mx * wH; doc.setFillColor(...cor); doc.rect(v < 0 ? xc - w : xc, y + 3, Math.max(1, w), 11, 'F'); return w; };
      const wl = bar(r.lo, C.fases[1]), wh = bar(r.hi, C.alta);
      fonte(8, 'normal', C.tinta);
      doc.text(pdfTxt(r.loTxt), r.lo < 0 ? xc - wl - 4 : xc - 4, y + 11.5, { align: 'right' });
      doc.text(pdfTxt(r.hiTxt), r.hi < 0 ? xc + 4 : xc + wh + 4, y + 11.5);
      y += 26;
    });
    doc.setDrawColor(...C.titulo); doc.setLineWidth(1); doc.line(xc, y0 - 2, xc, y - 4);
    y += 4; grafFim(g);
  };

  // ---------------------------------------------------------------- cabeçalhos do corpo e dos anexos (v14, BL6.2)
  const fatosGrade = fatos => {
    const g = 10, w = (LW - 2 * g) / 3;
    const altF = fatos.map(([, v]) => corta(quebra(v || '—', 9, w - 20), 3).length);
    const hF = Math.max(...altF) * 12 + 30;
    const nL = Math.ceil(fatos.length / 3);
    cabe(nL * (hF + g) + 4);
    fatos.forEach(([k, v], i) => {
      const x = M + (i % 3) * (w + g), yy = y + Math.floor(i / 3) * (hF + g);
      doc.setFillColor(...C.fundo); doc.roundedRect(x, yy, w, hF, 7, 7, 'F');
      fonte(8, 'bold', C.marca); doc.text(pdfTxt(k.toUpperCase()), x + 10, yy + 16, { charSpace: 0.3 });
      const L = corta(quebra(v || '—', 9, w - 20), 3);
      fonte(9, 'normal', v ? C.tinta : C.muted); L.forEach((l, j) => doc.text(l, x + 10, yy + 29 + j * 12));
    });
    y += nL * (hF + g) - g + 8;
  };
  // seção do corpo: número, pergunta (em maiúsculas pequenas) e o achado como título
  const tituloPrinc = s => {
    const wH = LW - 44, Lh = quebra(s.h, 14.5, wH, 'bold');
    const h = Math.max(36, Lh.length * 18.5 + 18);
    cabe(h + 100);
    if (y > TOP + 4) y += 12;
    INDICE.push([s.num + '. ' + s.rotulo, doc.getNumberOfPages()]);
    doc.setFillColor(...C.marca); doc.circle(M + 15, y + 17, 15, 'F');
    fonte(15, 'bold', C.branco); doc.text(String(s.num), M + 15, y + 22.4, { align: 'center' });
    fonte(8.2, 'bold', C.marca); doc.text(pdfTxt(String(s.rotulo || '').toUpperCase()), M + 44, y + 9, { charSpace: 0.4 });
    fonte(14.5, 'bold', C.titulo); Lh.forEach((l, i) => doc.text(l, M + 44, y + 26 + i * 18.5));
    doc.setDrawColor(...C.linha); doc.setLineWidth(0.7); doc.line(M, y + h + 2, W - M, y + h + 2);
    y += h + 12;
    if (s.intro) texto(s.intro, { size: 9.8, cor: C.muted, i: true, after: 8 });
  };
  const faixaAnexos = s => {
    novaPag();
    INDICE.push([s.h, doc.getNumberOfPages()]);
    ZT = 9; TFS = 8.2; TPAD = 3.6; LHK = 1.3;
    const L = quebra((s.p || []).join(' '), 9.6, LW - 40);
    const h = 52 + L.length * 12.6;
    doc.setFillColor(...C.titulo); doc.roundedRect(M, y, LW, h, 8, 8, 'F');
    fonte(20, 'bold', C.branco); doc.text(pdfTxt(s.h), M + 20, y + 33);
    fonte(9.6, 'normal', C.branco); L.forEach((l, i) => doc.text(l, M + 20, y + 52 + i * 12.6));
    y += h + 18;
  };
  let primeiroAnexo = true;
  let ZT = 10;   // corpo de texto: 10 pt no corpo do plano, 9,2 pt nos anexos
  const faixaAnexo = s => {
    // os anexos correm em sequência; só a matriz (anexo B, duas páginas inteiras) começa em página nova
    if (primeiroAnexo) primeiroAnexo = false; else if (s.letra === 'B') novaPag(); else { cabe(150); if (y > TOP + 4) y += 10; }
    const rot = tr('Anexo {0}').replace('{0}', s.letra);
    INDICE.push([rot + '. ' + s.h, doc.getNumberOfPages()]);
    const L = quebra(s.h, 14.5, LW - 60, 'bold'), h = Math.max(46, L.length * 18.5 + 26);
    doc.setFillColor(...C.tintA); doc.rect(M, y, LW, h, 'F'); doc.setFillColor(...C.marca); doc.rect(M, y, 4.5, h, 'F');
    fonte(17, 'bold', C.marca); doc.text(pdfTxt(s.letra), M + 24, y + h / 2 + 6, { align: 'center' });
    fonte(8, 'bold', C.muted); doc.text(pdfTxt(rot.toUpperCase()), M + 44, y + 12.5, { charSpace: 0.4 });
    fonte(14.5, 'bold', C.titulo); L.forEach((l, i) => doc.text(l, M + 44, y + 31 + i * 18.5));
    y += h + 12;
    if (s.letra === 'A') pagAnexoA = doc.getNumberOfPages();
  };

  // ---------------------------------------------------------------- Matriz do caso (v13, RQ-03 e RQ-20)
  // Duas páginas retrato (fases 1 e 2; fases 3 e 4), sem corte de texto: cada célula traz o texto, os números das
  // perguntas, o estado das respostas e, com a estimativa completa, o custo (soma das células = total do ciclo).
  // Corpo 8,6 pt; números das perguntas 8 pt. Crédito e nota de custo ao pé das páginas.
  const ESTADO_COR = { ok: [[232, 244, 236], [30, 107, 58]], andamento: [C.ambar, C.media], pendente: [[251, 236, 235], C.alta], orientacao: [C.cab, C.titulo], na: [C.fundo, C.muted] };
  const matriz = () => {
    const sM = raw.find(s => s.tipo === 'matriz');
    if (!sM || !sM.mx) return;
    const m = sM.mx, TM = typeof TXT_MATRIZ !== 'undefined' ? TXT_MATRIZ : { perguntas: 'Perguntas', camada: 'Camada', legenda: 'Estado das respostas', soma: '', semCusto: '' };
    const ROT = typeof ROT_ESTADO !== 'undefined' ? ROT_ESTADO : {};
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
      if (gi) { novaPag(); subtitulo(tr(sM.h) + ' (' + tr('continuação') + ')', C.titulo, 60); }
      else if (sM.intro) texto(tr(sM.intro), { size: 10, cor: C.muted, after: 8 });
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

  // ---------------------------------------------------------------- Anexo C: todas as recomendações, por momento
  const recomendacoes = s => {
    if (!R.length) { texto(tr(TXT_REC.vazio), { cor: C.muted }); return; }
    if (s && (s.p || [])[0]) texto(s.p[0], { size: 10, cor: C.muted, after: 6 });
    // contagem
    const nC = R.filter(r => r.tipo === 'custo').length, nP = R.length - nC;
    let x = M;
    x += etiqueta(x, y, tPn('nRecs', R.length), C.cab, C.titulo, 8.6) + 6;
    if (altas.length) x += etiqueta(x, y, altas.length === 1 ? tP('alta1') : tPn('altaN', altas.length), [250, 232, 230], C.alta, 8.6) + 6;
    x += etiqueta(x, y, nC + ' · ' + tr(TIPO_REC.custo), C.tintA, C.marca, 8.6) + 6;
    etiqueta(x, y, nP + ' · ' + tr(TIPO_REC.politica), C.tintB, C.roxo, 8.6);
    y += 30;
    const body = [], resto = R.slice(5);
    if (!resto.length) return;
    QUANDO_REC.forEach(([q, nome], gi) => {
      const L = resto.filter(r => r.quando === q); if (!L.length) return;
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
    texto(tP('introPerfil'), { size: 10, cor: C.muted, after: 8 });
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
    const sPerfil = secs.find(z => z.tipo === 'perfil') || { cartoes: [] };
    (sPerfil.cartoes || []).filter(z => z.table && z.table.rows.length).map(z => ({ h: z.hTable || z.h, table: z.table })).forEach(s => {
      cabe(110);
      const y0 = y, p0 = doc.getNumberOfPages();
      y += 12; fonte(11, 'bold', C.titulo); doc.text(pdfTxt(s.h), M + 12, y + 10); y += 20;
      tabela(s.table.head, s.table.rows, Object.assign({}, s.table, { dx: 12 }));
      if (doc.getNumberOfPages() === p0) { doc.setDrawColor(...C.linha); doc.setLineWidth(0.7); doc.roundedRect(M, y0, LW, y - y0 + 2, 8, 8, 'S'); }
      y += 14;
    });
  };

  let corB = C.marca, tintB = C.tintA;
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
    novaPag();
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
    y = BASE;   // a figura ocupa a página; o que vem depois começa na seguinte
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
    (s.p || []).forEach((z, i) => texto(z, { size: ZT, b: z === tr('Por quê:') }));
    if (eq) equacao(s.kv);
    else if ((s.kv || []).length && !s.kpis) tabela(null, s.kv.map(([k, v]) => [k, v || '—']), { larg: [190], b0: true }, corB);
    (s.list || []).forEach(z => texto(z, { size: ZT, ind: 13, after: 2, bullet: true, corBullet: corB }));
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
  paginaUm();
  comoLer();
  const GRAF = { fases: grafFases, camadas: grafCamadas, adocao: grafAdocao, cenarios: grafCenarios, tornado: grafTornado };
  secs.forEach(s => {
    if (s.tipo === 'sintese' || s.tipo === 'caixa' || (s.tipo === 'faltas' && s.curta)) return;
    if (s.tipo === 'princ') { corB = C.marca; tintB = C.tintA; tituloPrinc(s); return; }
    if (s.tipo === 'anexos') { faixaAnexos(s); return; }
    if (s.tipo === 'anexo') { faixaAnexo(s); return; }
    if (s.tipo === 'figura') { figura(s); return; }
    if (s.tipo === 'matriz') { matriz(); return; }
    if (s.tipo === 'recs') { recomendacoes(s); return; }
    if (s.tipo === 'perfil') { subtitulo(tP('perfil'), C.marca, 80); perfil(); return; }
    if (GRAF[s.tipo]) { GRAF[s.tipo](s); return; }
    if (s.tipo === 'fatos') { subtitulo(s.h, C.marca, 80); fatosGrade(s.fatos); return; }
    if (s.tipo === 'nota') { (s.p || []).forEach(z => texto(z, { size: 9.6, cor: C.muted, after: 6 })); return; }
    if (s.tipo === 'faltas') {
      subtitulo(s.h, C.media, 60);
      (s.p || []).forEach(z => texto(z, { size: ZT }));
      s.list.forEach(z => texto(z, { size: ZT, ind: 13, after: 2, bullet: true, corBullet: C.media }));
      return;
    }
    if (s.h) subtitulo(s.h, corB, proxMin(s));
    corpo(s);
  });
  // a caixa de respostas pendentes da página 2 leva à lista completa (Anexo A); o índice é desenhado no fim
  tarde.push(() => { if (boxFaltas && pagAnexoA) { doc.setPage(pagComoLer); ehLink(M, boxFaltas.y, LW, boxFaltas.h, pagAnexoA); } });
  tarde.push(desenharIndice);
  tarde.forEach(f => f());

  // cabeçalho e rodapé das páginas internas
  const n = doc.getNumberOfPages();
  const pe = typeof avisoTraducao === 'function' && avisoTraducao() ? 12 : 0;   // v13: rodapé sobe para o aviso de tradução
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
    doc.text(pdfTxt(tP('ilustr')), M, H - 24 - pe);
    fonte(8, 'bold', C.titulo); doc.text(i + ' / ' + n, W - M, H - 24 - pe, { align: 'right' });
  }
  avisoTradPDF(doc, { W, H, M, LW });   // v13: aviso de tradução preliminar (capa e rodapé), só nos idiomas novos
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

// =====================================================================
// v13 (RQ-18, pacote L): fontes embutidas para árabe, chinês e bambara, que não cabem no WinAnsi da Helvetica.
// FONTES_PDF (injetado no build por tools/subset_fonts.py) traz subconjuntos TrueType comprimidos (deflate) em
// base64, só com os caracteres dos dicionários do idioma, do inglês, ASCII e Latin-1.
//   fontePDF(doc)      registra a fonte do idioma e faz 'helvetica' apontar para ela (texto e autotable);
//                      itálico vira regular; sem peso bold (chinês), o negrito é simulado com contorno.
//   ajustarTextoPDF(s) substitui pdfTxt nesses idiomas: mantém tudo o que a fonte cobre e só troca o resto.
//   avisoTradPDF(...)  aviso de tradução preliminar na capa e no rodapé (idiomas novos não revisados).
// Árabe: o jsPDF liga as letras (processArabic: formas de apresentação) e reordena cada linha (motor bidi);
// números e "US$" ficam da esquerda para a direita dentro da linha.
// PT/EN/ES/FR (e zu/sw, que cabem no WinAnsi) continuam com Helvetica e pdfTxt, sem nenhuma mudança.
// =====================================================================
let PDF_FONTE = null;          // família ativa no PDF em geração (null = Helvetica)
const PDF_FONTE_BIN = {};      // arquivo → TTF (string binária), descomprimido uma vez por sessão
const PDF_FONTE_COBRE = {};    // família → Set dos caracteres cobertos
function familiaPDF(l) {
  if (typeof FONTES_PDF === 'undefined' || !FONTES_PDF) return null;
  for (const k in FONTES_PDF) if ((FONTES_PDF[k].idiomas || []).includes(l) && FONTES_PDF[k].regular) return Object.assign({ chave: k }, FONTES_PDF[k]);
  return null;
}
// DEFLATE bruto (RFC 1951), síncrono: gerarPDF() é síncrono e o navegador só descomprime de forma assíncrona
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
function fontePDF(doc) {
  PDF_FONTE = null;
  const F = familiaPDF(typeof LANG === 'undefined' ? 'pt' : LANG);
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
    const RE_AR = /[\u0600-\u06ff\u0750-\u077f\ufb50-\ufdff\ufe70-\ufeff]/;
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
const RE_CJK = /[\u2e80-\u9fff\uf900-\ufaff\ufe30-\ufe4f\uff00-\uffef\u3000-\u303f]/;
const CJK_FECHA = '，。、：；？！）》」』】〉’”…·%,.;:!?)]}';
function quebrarCJK(s, w, larg) {
  const out = [];
  s.split(/\r?\n/).forEach(par => {
    const tk = par.match(/[\u2e80-\u9fff\uf900-\ufaff\ufe30-\ufe4f\uff00-\uffef\u3000-\u303f]|\s+|[^\s\u2e80-\u9fff\uf900-\ufaff\ufe30-\ufe4f\uff00-\uffef\u3000-\u303f]+/g) || [''];
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
  if (LANG === 'ar' && /[\u0600-\u06FF]/.test(s)) s = s.replace(/\(([^()]*[\u0600-\u06FF][^()]*)\)/g, ')$1(');
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
  if (typeof avisoTraducao !== 'function') return;
  const av = avisoTraducao();
  if (!av) return;
  const { W, H, M, LW } = o, n = doc.getNumberOfPages();
  const lin = s => doc.splitTextToSize(pdfTxt(s), LW - 16);
  // página 1: faixa de aviso ao pé, acima da isenção
  doc.setPage(1);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  const L = lin(av.local).concat(av.en && av.en !== av.local ? lin(av.en) : []);
  const h = L.length * 10.4 + 8, y0 = H - 44 - 16 - h;   // v14: acima da isenção, ao pé da página 1
  doc.setFillColor(12, 45, 77); doc.roundedRect(M, y0, LW, h, 4, 4, 'F');
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
