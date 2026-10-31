import { planoLetramento } from '../percurso/letramento';
// PDF institucional: usa a mesma projeção da página e do painel, sem motor de contratação.
import type { Estado14 } from '../store/tipos';
import { getLang, setLang } from '../domain/i18n.js';
import { planoGovernanca, type BlocoGovernanca } from '../percurso/governanca';
import { t } from '../percurso/textos';
import { carregarJsPDF, carregarFontesPDF, fontePDF, limparFontePDF, pdfTxt, PDF_COR, IDIOMAS_FONTE } from './pdf.js';
export async function gerarGovernancaPDF(s: Estado14, opts: { tipo?: 'brief' | 'anexo'; modelo?: 'letramento'; data?: Date; fontes?: any; lang?: string } = {}) {
  const antigo = getLang(), lang = opts.lang || antigo || s.lang || 'pt';
  const jsPDF = await carregarJsPDF();
  const fontes = opts.fontes !== undefined ? opts.fontes : IDIOMAS_FONTE.includes(lang) ? await carregarFontesPDF() : null;
  if (lang !== antigo) setLang(lang);
  try {
    const lit = opts.modelo === 'letramento';
    const p = lit ? planoLetramento(s) : planoGovernanca(s), anexo = opts.tipo === 'anexo';
    const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
    fontePDF(doc, fontes, lang);
    const W = 595.28, H = 841.89, M = 52, LIM = H - 64, C = PDF_COR;
    const tipo = lit ? t(anexo ? 'Plano de formação e currículo' : 'Resumo do programa') : t(anexo ? 'Anexo de governança' : 'Policy brief de governança');
    let y = 72;
    const fonte = (n: number, bold = false) => { doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(n); doc.setTextColor(...C.tinta); };
    const cab = () => { fonte(8); doc.setTextColor(...C.muted); doc.text(pdfTxt((lit ? p.titulo : t('Governança de IA na educação')) + ' · v015'), M, 34); doc.setDrawColor(...C.linha); doc.line(M, 43, W - M, 43); };
    const nova = () => { doc.addPage(); y = 72; cab(); };
    const cabe = (h: number) => { if (y + h > LIM) nova(); };
    const texto = (s: string, n = 10, bold = false) => {
      fonte(n, bold);
      const linhas: string[] = doc.splitTextToSize(pdfTxt(s), W - M * 2);
      for (const l of linhas) { cabe(n * 1.45); fonte(n, bold); doc.text(l, M, y); y += n * 1.45; }
      y += 5;
    };
    const bloco = (b: BlocoGovernanca) => {
      cabe(lit ? 108 : 58); y += 10; texto(b.titulo, 14, true);
      for (const l of b.linhas) { cabe(40); texto(l.rotulo, 9, true); texto(l.valor, 10); }
    };
    cab(); texto(tipo, 11, true); texto(p.titulo, 22, true); texto(p.pais || t('País: ———'), 13);
    texto(p.proxima, 12, true); texto(p.escopo);
    texto(t('Plano parcial: {n} perguntas pendentes.', { n: p.faltam.length }));
    if (lit) texto(t('{n} definições e valores a levantar', { n: p.pendentes }));
    if (p.projeto) { texto(t('Governança e projeto de uso de IA têm ações e orçamentos separados.')); texto(t('Projeto identificado: {nome}', { nome: p.projeto })); }
    const blocos = anexo ? p.blocos : lit ? p.blocos.filter(b => ![t('Condições para atividades digitais'),t('Projeto concreto de uso de IA')].includes(b.titulo)).map(b => ({...b,linhas: [t('Contexto'),t('Públicos e alcance'),t('Ações, responsáveis e prazos'),t('Recursos para formação e currículo'),t('Desenho do currículo nacional')].includes(b.titulo) ? b.linhas : b.titulo === t('Competências e objetivos de aprendizagem') ? b.linhas.filter(l=>l.rotulo.startsWith(t('Objetivos de aprendizagem'))) : b.linhas.slice(0,2)})) : p.blocos.filter((b, i) => i < 2 || [t('Recursos e orçamento'), t('Acompanhamento e revisão'), t('Experimentação supervisionada')].includes(b.titulo)
      || p.acoes.some(a => a.entrega === b.titulo));
    for (const b of blocos) bloco(b);
    const N = doc.getNumberOfPages(), data = (opts.data || new Date()).toISOString().slice(0, 10);
    for (let n = 1; n <= N; n++) { doc.setPage(n); doc.setDrawColor(...C.linha); doc.line(M, H - 47, W - M, H - 47); fonte(8); doc.setTextColor(...C.muted); doc.text(pdfTxt(tipo + ' · v015 · ' + data), M, H - 30); doc.text(n + ' / ' + N, W - M, H - 30, { align: 'right' }); }
    return doc;
  } finally { limparFontePDF(); if (lang !== antigo) setLang(antigo); }
}
