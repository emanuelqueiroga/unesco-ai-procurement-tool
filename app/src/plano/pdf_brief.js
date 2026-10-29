// =====================================================================
// PDF do policy brief (design/redesign/06-policy-brief.md, PB-02): o PDF principal do plano, com no máximo 6 páginas.
//   gerarBrief(estado, opts) → documento jsPDF (não baixa nada); nomeArqBrief(estado) → 'policy-brief-<slug>.pdf'.
// Página 1: resumo executivo em uma página exata (título do caso, data, selo, recomendação, cinco frases rotuladas,
// três números e a linha do tempo das quatro etapas). Páginas 2–6: o problema, o desenho, o custo, riscos e
// salvaguardas, próximos passos; cada uma abre com o título-achado e cabe numa página (o corpo encolhe até caber).
// Os dados vêm de brief.js (briefDados), os mesmos da tela "Em resumo". Fontes embutidas (ar, zh, bm), RTL e paleta:
// as de pdf.js (fontePDF, pdfTxt, PDF_COR). Rodapé de cada página: versão, data e isenção curta.
// opts: { versao, lang, fontes, data, comprimir } como em gerarPDF.
// =====================================================================
import { getLang, setLang, avisoTraducao } from '../domain/index.ts';
import { carregarJsPDF, carregarFontesPDF, fontePDF, limparFontePDF, pdfTxt, PDF_COR, IDIOMAS_FONTE } from './pdf.js';
import { briefDados } from './brief.js';
import { NOME_FERRAMENTA, slugPlano } from './secoes.js';

/** Nome do arquivo do brief: policy-brief-<slug>.pdf */
export function nomeArqBrief(estado) { return 'policy-brief-' + slugPlano(estado) + '.pdf'; }

/** Gera o PDF do policy brief (no máximo 6 páginas; o resumo executivo numa só). */
export async function gerarBrief(estado, opts) {
  opts = opts || {};
  const lang0 = getLang(), lang = opts.lang || lang0;
  const jsPDF = await carregarJsPDF();
  const fontes = opts.fontes !== undefined ? opts.fontes : IDIOMAS_FONTE.includes(lang) ? await carregarFontesPDF() : null;
  if (lang !== lang0) setLang(lang);
  try { return montarBrief(jsPDF, estado, opts, fontes, lang); }
  finally { limparFontePDF(); if (lang !== lang0) setLang(lang0); }
}

function montarBrief(jsPDF, estado, opts, fontes, lang) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: opts.comprimir !== false });
  fontePDF(doc, fontes, lang);
  const C = PDF_COR;
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 54, LW = W - 2 * M;
  const agora = opts.data instanceof Date ? opts.data : new Date();
  const D = briefDados(estado, { data: agora });
  const versao = opts.versao ? String(opts.versao).replace(/^v/, '') : '';
  const av = avisoTraducao();
  const AV = av ? [av.local].concat(av.en && av.en !== av.local ? [av.en] : []) : [];
  const PE = 46 + AV.length * 9.5;           // altura do rodapé (acima da borda da página)
  const BASE = H - PE - 10;                   // fim da área útil
  const TOTAL = 6;

  // ---------------------------------------------------------------- primitivas (dry = só mede)
  const fonte = (size, st, cor) => { doc.setFont('helvetica', st || 'normal'); doc.setFontSize(size); if (cor) doc.setTextColor(...cor); };
  const quebra = (s, size, w, st) => { fonte(size, st); return s ? doc.splitTextToSize(pdfTxt(s), w) : []; };
  const corta = (L, n) => (L.length <= n ? L : L.slice(0, n - 1).concat([String(L[n - 1]).replace(/\s*\S*$/, '') + '…']));
  const larg = (s, size, st) => { fonte(size, st); return doc.getTextWidth(pdfTxt(s)); };
  // parágrafo a partir de y (topo); devolve a altura
  const par = (dry, s, x, y, w, size, o = {}) => {
    const lh = size * (o.lh || 1.42), st = o.st || 'normal';
    let L = quebra(s, size, w, st);
    if (o.max) L = corta(L, o.max);
    if (!dry) { fonte(size, st, o.cor || C.tinta); L.forEach((l, i) => doc.text(l, x, y + size + i * lh, o.align ? { align: o.align } : undefined)); }
    return L.length * lh;
  };
  const sobre = (s, x, y, cor, size = 8) => { fonte(size, 'bold', cor || C.marca); doc.text(pdfTxt(String(s).toUpperCase()), x, y, { charSpace: 0.6 }); };

  // ---------------------------------------------------------------- moldura das páginas
  const rodape = n => {
    doc.setDrawColor(...C.linha); doc.setLineWidth(0.6); doc.line(M, H - PE, W - M, H - PE);
    fonte(7.6, 'normal', C.muted);
    const esq = [D.rotulos.tipoDoc, versao ? 'v' + versao : '', D.data].filter(Boolean).join('  ·  ');
    doc.text(pdfTxt(esq), M, H - PE + 13);
    fonte(7.6, 'bold', C.titulo); doc.text(n + ' / ' + TOTAL, W - M, H - PE + 13, { align: 'right' });
    let yy = H - PE + 24;
    fonte(7.4, 'normal', C.muted);
    corta(quebra(D.rotulos.isencao, 7.4, LW), 1).forEach(l => { doc.text(l, M, yy); yy += 9.5; });
    AV.forEach(z => { fonte(7.4, 'normal', C.muted); doc.text(corta(quebra(z, 7.4, LW), 1)[0] || '', M, yy); yy += 9.5; });
  };
  const cabecalho = () => {
    fonte(7.8, 'normal', C.muted);
    let run = pdfTxt(D.rotulos.tipoDoc + '  ·  ' + D.titulo);
    const cheio = run;
    while (doc.getTextWidth(run) > LW && run.length > 20) run = run.slice(0, -2);
    if (run.length < cheio.length) run = run.replace(/\s*\S?$/, '') + '…';
    doc.text(run, M, 36);
    doc.setDrawColor(...C.linha); doc.setLineWidth(0.6); doc.line(M, 44, W - M, 44);
    doc.setFillColor(...C.marca); doc.rect(M, 43.2, 34, 1.6, 'F');
  };

  // ---------------------------------------------------------------- linha do tempo das quatro etapas
  const etapasH = (dry, y, s) => {
    const n = D.etapas.length, wC = LW / n, wT = wC - 10;
    const cores = [C.fasesS[0], C.fasesS[1], C.fasesS[2], C.fasesS[3]];
    const yN = y + 8;
    const hNome = Math.max(...D.etapas.map(e => corta(quebra(e.nome, 9 * s, wT, 'bold'), 2).length)) * 9 * s * 1.3;
    if (!dry) {
      doc.setDrawColor(...C.linha); doc.setLineWidth(2); doc.line(M + wC / 2, yN, M + LW - wC / 2, yN);
      D.etapas.forEach((e, i) => {
        const cx = M + wC * (i + 0.5);
        doc.setFillColor(...C.branco); doc.circle(cx, yN, 8, 'F');
        doc.setFillColor(...cores[i % 4]); doc.circle(cx, yN, 6, 'F');
        let yy = yN + 16;
        fonte(9 * s, 'bold', C.titulo);
        corta(quebra(e.nome, 9 * s, wT, 'bold'), 2).forEach(l => { doc.text(l, cx, yy + 9 * s, { align: 'center' }); yy += 9 * s * 1.3; });
        yy = yN + 16 + hNome;
        fonte(8 * s, 'normal', C.muted); doc.text(pdfTxt(e.anos), cx, yy + 8 * s + 1, { align: 'center' });
        yy += 8 * s * 1.5 + 2;
        let ct = pdfTxt(e.custoTxt), fs = 11 * s;
        fonte(fs, 'bold'); while (doc.getTextWidth(ct) > wT && fs > 7) { fs -= 0.5; fonte(fs, 'bold'); }
        fonte(fs, 'bold', C.marca); doc.text(ct, cx, yy + fs, { align: 'center' });
      });
    }
    return 8 + 16 + hNome + 8 * s * 1.5 + 2 + 11 * s + 4;
  };
  // três números em cartões
  const numerosH = (dry, y, itens, s) => {
    const g = 12, n = itens.length, w = (LW - (n - 1) * g) / n, iw = w - 24;
    const hs = itens.map(it => {
      const lr = corta(quebra(it.rotulo, 8.2 * s, iw, 'bold'), 2).length, ln = it.nota ? corta(quebra(it.nota, 7.8 * s, iw), 3).length : 0;
      return 14 + 20 * s + 8 + lr * 8.2 * s * 1.3 + (ln ? 4 + ln * 7.8 * s * 1.35 : 0) + 12;
    });
    const h = Math.max(...hs);
    if (!dry) {
      itens.forEach((it, i) => {
        const x = M + i * (w + g);
        doc.setFillColor(...C.fundo); doc.roundedRect(x, y, w, h, 6, 6, 'F');
        doc.setFillColor(...C.fasesS[(i + 1) % 4]); doc.rect(x + 12, y, 26, 3, 'F');
        let fs = 20 * s, v = pdfTxt(it.valor);
        fonte(fs, 'bold'); while (doc.getTextWidth(v) > iw && fs > 10) { fs -= 0.5; fonte(fs, 'bold'); }
        fonte(fs, 'bold', C.titulo); doc.text(v, x + 12, y + 14 + 20 * s);
        let yy = y + 14 + 20 * s + 8;
        fonte(8.2 * s, 'bold', C.titulo);
        corta(quebra(it.rotulo, 8.2 * s, iw, 'bold'), 2).forEach(l => { doc.text(l, x + 12, yy + 8.2 * s); yy += 8.2 * s * 1.3; });
        if (it.nota) { yy += 4; fonte(7.8 * s, 'normal', C.muted); corta(quebra(it.nota, 7.8 * s, iw), 3).forEach(l => { doc.text(l, x + 12, yy + 7.8 * s); yy += 7.8 * s * 1.35; }); }
      });
    }
    return h;
  };

  // ---------------------------------------------------------------- página 1: resumo executivo
  const pagina1 = (dry, s) => {
    let y = 0;
    if (!dry) { doc.setFillColor(...C.marca); doc.rect(0, 0, W, 6, 'F'); }
    y = 44;
    if (!dry) {
      sobre(D.rotulos.tipoDoc + '  ·  ' + D.rotulos.resumoExec, M, y, C.marca, 8.4);
      fonte(8.4, 'normal', C.muted); doc.text(pdfTxt(D.data), W - M, y, { align: 'right' });
    }
    y += 14;
    y += par(dry, D.titulo, M, y, LW, 22 * s, { st: 'bold', cor: C.titulo, max: 2, lh: 1.22 });
    y += 4;
    // local e selo "estimativa ilustrativa" na mesma linha
    const selo = pdfTxt(D.selo.toUpperCase());
    fonte(7.6, 'bold'); const wS = doc.getTextWidth(selo) + 0.3 * selo.length + 14;
    const hSub = D.subtitulo ? par(dry, D.subtitulo, M, y, LW - wS - 12, 10.5 * s, { cor: C.muted, max: 1 }) : 10.5 * s * 1.42;
    if (!dry) {
      const xs = D.subtitulo ? W - M - wS : M;
      doc.setFillColor(...C.ambar); doc.roundedRect(xs, y + 1, wS, 15, 7.5, 7.5, 'F');
      fonte(7.6, 'bold', C.media); doc.text(selo, xs + 7, y + 11.2, { charSpace: 0.3 });
    }
    y += Math.max(hSub, 17);
    y += 18 * s;
    // recomendação
    {
      const pad = 16, iw = LW - 2 * pad - 6;
      const hT = par(true, D.recomendacao.texto, 0, 0, iw, 12.5 * s, { st: 'bold', lh: 1.3 });
      const hP = D.recomendacao.porque ? par(true, D.recomendacao.porque, 0, 0, iw, 9.4 * s) : 0;
      const h = pad + 10 + 8 + hT + (hP ? 5 + hP : 0) + pad - 2;
      if (!dry) {
        doc.setFillColor(...C.tintA); doc.roundedRect(M, y, LW, h, 7, 7, 'F');
        doc.setFillColor(...C.marca); doc.rect(M, y + 10, 4, h - 20, 'F');
        sobre(D.rotulos.recomendacao, M + pad + 6, y + pad + 7, C.marca, 8);
        let yy = y + pad + 18;
        yy += par(false, D.recomendacao.texto, M + pad + 6, yy, iw, 12.5 * s, { st: 'bold', cor: C.titulo, lh: 1.3 });
        if (hP) par(false, D.recomendacao.porque, M + pad + 6, yy + 5, iw, 9.4 * s, { cor: C.tinta });
      }
      y += h + 20 * s;
    }
    // cinco frases rotuladas
    {
      const F = D.frases, ordem = ['contexto', 'teste', 'implantacao', 'expansao', 'custo'];
      const wL = 112, xT = M + wL + 12, wT = LW - wL - 12;
      ordem.forEach((id, i) => {
        const f = F[id];
        const pad = 8 * s;
        const hR = Math.max(par(true, f.rotulo, 0, 0, wL, 8.4 * s, { st: 'bold', lh: 1.3 }), par(true, f.texto, 0, 0, wT, 10.2 * s));
        if (!dry) {
          if (i) { doc.setDrawColor(...C.linha); doc.setLineWidth(0.5); doc.line(M, y, W - M, y); }
          par(false, f.rotulo, M, y + pad + 1, wL, 8.4 * s, { st: 'bold', cor: C.marca, lh: 1.3 });
          par(false, f.texto, xT, y + pad, wT, 10.2 * s, { cor: f.falta ? C.media : C.tinta, st: f.falta ? 'italic' : 'normal' });
        }
        y += hR + 2 * pad;
      });
    }
    y += 16 * s;
    y += numerosH(dry, y, D.numeros, s);
    y += 22 * s;
    if (!dry) sobre(D.rotulos.etapas, M, y + 8, C.muted, 7.8);
    y += 18;
    y += etapasH(dry, y, s);
    return y;
  };

  // ---------------------------------------------------------------- páginas 2–6: blocos
  const tituloBloco = (dry, t, y, s) => (t ? par(dry, t, M, y, LW, 10.5 * s, { st: 'bold', cor: C.titulo, lh: 1.3 }) + 5 : 0);
  const tabelaH = (dry, b, y, s) => {
    const nc = b.head.length;
    // larguras: a coluna mais longa fica com o resto
    const fixas = nc === 4 ? [22, 0, 122, 104] : nc === 3 ? [150, 0, 92] : [0, 120];
    const livre = LW - fixas.reduce((a, z) => a + z, 0);
    const ws = fixas.map(z => z || livre);
    const pad = 5, fsH = 8.2 * s, fs = 8.8 * s, lh = fs * 1.36;
    const linhasDe = (r, size, st) => r.map((z, j) => quebra(String(z == null ? '' : z), size, ws[j] - 2 * pad, st));
    const hHead = Math.max(...linhasDe(b.head, fsH, 'bold').map(L => L.length)) * fsH * 1.3 + 2 * pad;
    const rows = b.rows.slice(0, 8);
    const hs = rows.map(r => Math.max(...linhasDe(r, fs, 'normal').map(L => L.length)) * lh + 2 * pad);
    if (!dry) {
      let x = M;
      doc.setFillColor(...C.cab); doc.rect(M, y, LW, hHead, 'F');
      linhasDe(b.head, fsH, 'bold').forEach((L, j) => {
        fonte(fsH, 'bold', C.titulo);
        const dir = (b.num || []).includes(j);
        L.forEach((l, i) => doc.text(l, dir ? x + ws[j] - pad : x + pad, y + pad + fsH + i * fsH * 1.3, dir ? { align: 'right' } : undefined));
        x += ws[j];
      });
      doc.setDrawColor(...C.marca); doc.setLineWidth(0.9); doc.line(M, y + hHead, W - M, y + hHead);
      let yy = y + hHead;
      rows.forEach((r, k) => {
        let xx = M;
        linhasDe(r, fs, 'normal').forEach((L, j) => {
          const dir = (b.num || []).includes(j), b0 = j === 0 && nc !== 4;
          fonte(fs, b0 ? 'bold' : 'normal', b0 ? C.titulo : C.tinta);
          if (nc === 4 && j === 0) fonte(fs, 'bold', C.marca);
          L.forEach((l, i) => doc.text(l, dir ? xx + ws[j] - pad : xx + pad, yy + pad + fs + i * lh, dir ? { align: 'right' } : undefined));
          xx += ws[j];
        });
        yy += hs[k];
        doc.setDrawColor(...C.linha); doc.setLineWidth(0.5); doc.line(M, yy, W - M, yy);
      });
    }
    return hHead + hs.reduce((a, z) => a + z, 0);
  };
  const barrasH = (dry, b, y, s) => {
    const wR = 170, wV = 86, xB = M + wR + 8, wB = LW - wR - wV - 16, fs = 9 * s;
    let h = 0;
    b.itens.forEach(it => {
      const hl = Math.max(fs * 1.36 + 8 * s * 1.3, 18) + 8;
      if (!dry) {
        const yy = y + h;
        fonte(fs, 'bold', C.titulo); doc.text(corta(quebra(it.rotulo, fs, wR, 'bold'), 1)[0] || '', M, yy + fs);
        fonte(8 * s, 'normal', C.muted); doc.text(pdfTxt(it.sub), M, yy + fs + 8 * s * 1.3 + 1);
        doc.setFillColor(...C.cab); doc.roundedRect(xB, yy + 3, wB, 9, 4.5, 4.5, 'F');
        doc.setFillColor(...C.marca); doc.roundedRect(xB, yy + 3, Math.max(4, wB * it.w), 9, 4.5, 4.5, 'F');
        fonte(fs, 'bold', C.titulo); doc.text(pdfTxt(it.txt), M + LW, yy + fs + 1, { align: 'right' });
      }
      h += hl;
    });
    return h;
  };
  const listaH = (dry, itens, y, s) => {
    let h = 0;
    const fs = 9.8 * s;
    itens.forEach(z => {
      if (!dry) { doc.setFillColor(...C.marca); doc.rect(M + 2, y + h + fs * 0.45, 3.4, 3.4, 'F'); }
      h += par(dry, z, M + 14, y + h, LW - 14, fs) + 5 * s;
    });
    return h;
  };
  const bloco = (dry, b, y, s) => {
    let h = tituloBloco(dry, b.titulo, y, s);
    const y1 = y + h;
    if (b.tipo === 'texto') h += par(dry, b.texto, M, y1, LW, 10 * s, { lh: 1.45 });
    else if (b.tipo === 'lista') h += listaH(dry, b.itens, y1, s);
    else if (b.tipo === 'tabela') h += tabelaH(dry, b, y1, s);
    else if (b.tipo === 'numeros') h += numerosH(dry, y1, b.itens, s);
    else if (b.tipo === 'barras') h += barrasH(dry, b, y1, s);
    else if (b.tipo === 'etapas') h += 4 + etapasH(dry, y1 + 4, s);
    return h;
  };
  const ORDEM = ['problema', 'desenho', 'custo', 'riscos', 'passos'];
  const paginaN = (dry, id, n, s) => {
    const P = D.paginas[id];
    let y = 74;
    if (!dry) sobre(n + '  ·  ' + P.secao, M, y, C.marca, 8.6);
    y += 12;
    y += par(dry, P.titulo, M, y, LW, 18 * s, { st: 'bold', cor: C.titulo, lh: 1.24, max: 3 });
    y += 6;
    y += par(dry, P.abre, M, y, LW, 10 * s, { cor: C.muted });
    y += 12 * s;
    if (!dry) { doc.setDrawColor(...C.linha); doc.setLineWidth(0.5); doc.line(M, y, W - M, y); }
    y += 16 * s;
    P.blocos.forEach((b, i) => { y += bloco(dry, b, y, s) + (i < P.blocos.length - 1 ? 18 * s : 0); });
    return y;
  };
  // escala que faz a página caber (1 = desenho cheio; até 0,62)
  const escala = medir => { let s = 1; while (s > 0.62 && medir(s) > BASE) s -= 0.04; return Math.max(0.62, s); };

  // ---------------------------------------------------------------- montagem
  doc.setProperties({ title: pdfTxt(D.rotulos.tipoDoc + ' - ' + D.titulo), subject: pdfTxt(D.rotulos.tipoDoc), creator: NOME_FERRAMENTA });
  // briefInfo (testes, PB-02): a escala e a altura usada de cada página; altura <= base = nada transborda
  const info = { base: BASE, paginas: [] };
  const s1 = escala(s => pagina1(true, s));
  info.paginas.push({ id: 'resumo', escala: s1, altura: pagina1(false, s1) });
  rodape(1);
  ORDEM.forEach((id, i) => {
    doc.addPage();
    const s = escala(z => paginaN(true, id, i + 2, z));
    cabecalho();
    info.paginas.push({ id, escala: s, altura: paginaN(false, id, i + 2, s) });
    rodape(i + 2);
  });
  doc.briefInfo = info;
  return doc;
}
