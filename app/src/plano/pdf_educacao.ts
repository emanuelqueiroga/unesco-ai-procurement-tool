import type { Estado14 } from "../store/tipos";
import { getLang, setLang } from "../domain/i18n.js";
import { planoEd, E } from "../percurso/pedagogico";
import { t } from "../percurso/textos";
import {
  carregarJsPDF,
  carregarFontesPDF,
  fontePDF,
  limparFontePDF,
  pdfTxt,
  PDF_COR,
  IDIOMAS_FONTE,
} from "./pdf.js";
export async function gerarEducacaoPDF(
  s: Estado14,
  opts: {
    tipo?: "brief" | "anexo";
    data?: Date;
    fontes?: any;
    lang?: string;
  } = {},
) {
  const antigo = getLang(),
    lang = opts.lang || antigo || s.lang || "pt",
    jsPDF = await carregarJsPDF(),
    fontes =
      opts.fontes !== undefined
        ? opts.fontes
        : IDIOMAS_FONTE.includes(lang)
          ? await carregarFontesPDF()
          : null;
  if (lang !== antigo) setLang(lang);
  try {
    const p = planoEd(s),
      doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
    fontePDF(doc, fontes, lang);
    const W = 595.28,
      H = 841.89,
      M = 52,
      LIM = H - 64,
      C = PDF_COR;
    let y = 72;
    const fonte = (n: number, bold = false) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(n);
      doc.setTextColor(...C.tinta);
    };
    const cab = () => {
      fonte(8);
      doc.setTextColor(...C.muted);
      doc.text(pdfTxt(p.titulo + " · v015"), M, 34);
      doc.setDrawColor(...C.linha);
      doc.line(M, 43, W - M, 43);
    };
    const cabe = (h: number) => {
      if (y + h > LIM) {
        doc.addPage();
        y = 72;
        cab();
      }
    };
    const texto = (s: string, n = 10, bold = false) => {
      fonte(n, bold);
      for (const l of doc.splitTextToSize(pdfTxt(s), W - M * 2)) {
        cabe(n * 1.45);
        fonte(n, bold);
        doc.text(l, M, y);
        y += n * 1.45;
      }
      y += 5;
    };
    cab();
    texto(p.titulo, 22, true);
    texto(p.pais || t("Não informado"), 13);
    texto(p.proxima, 12, true);
    texto(p.escopo);
    if (p.pendentes)
      texto(t("{n} definições e valores a levantar", { n: p.pendentes }));
    if (p.faltam.length)
      texto(
        t("Plano parcial: {n} perguntas pendentes.", { n: p.faltam.length }),
      );
    for (const b of p.blocos) {
      cabe(80);
      y += 10;
      texto(b.titulo, 14, true);
      const linhas =
        opts.tipo === "brief" &&
        ![
          "Contexto",
          "Objetivos e resultados esperados",
          "Recursos da intervenção",
        ]
          .map((x) => t(x))
          .includes(b.titulo)
          ? b.linhas.slice(0, 3)
          : b.linhas;
      for (const l of linhas) {
        cabe(40);
        texto(l.rotulo, 9, true);
        texto(l.valor);
      }
    }
    const N = doc.getNumberOfPages(),
      data = (opts.data || new Date()).toISOString().slice(0, 10);
    for (let n = 1; n <= N; n++) {
      doc.setPage(n);
      fonte(8);
      doc.text(
        pdfTxt(
          t(E("Plano educacional", "Educational plan")) + " · v015 · " + data,
        ),
        M,
        H - 30,
      );
      doc.text(n + " / " + N, W - M, H - 30, { align: "right" });
    }
    return doc;
  } finally {
    limparFontePDF();
    if (lang !== antigo) setLang(antigo);
  }
}
