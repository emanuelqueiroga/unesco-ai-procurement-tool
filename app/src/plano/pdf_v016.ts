// Versão de teste v016: PDFs das frentes e do plano completo.
// "Resumo para decisão": 1–2 páginas com o parágrafo "Em resumo", a tabela categoria × fase, riscos e o próximo passo.
// "Anexo técnico": o mesmo começo e, depois, todos os blocos do resumo da frente com a memória das estimativas.
import { fontesDasContas } from '../percurso/custosV017';
import type { Estado14 } from '../store/tipos';
import { getLang, setLang } from '../domain/i18n.js';
import { LOC } from '../domain';
import { t } from '../percurso/textos';
import { planoGovernanca } from '../percurso/governanca';
import { planoLetramento } from '../percurso/letramento';
import { planoEd } from '../percurso/pedagogico';
import { estadoDaFrente, type FrenteId } from '../percurso/frentes';
import { instituicaoV16, linhasMemoria, matrizFases, resumoProsa, riscosV16, totalConhecido, type orcamentoV16 } from '../percurso/orcamentoV016';
import { consolidadoV16 } from '../percurso/consolidadoV016';
import { formatarMoedaEst, type FrenteEstimativa } from '../percurso/estimativasOrcamento';
import { nomePais, paisDoCaso } from '../domain/pais.js';
import { carregarJsPDF, carregarFontesPDF, fontePDF, limparFontePDF, pdfTxt, PDF_COR, IDIOMAS_FONTE } from './pdf.js';

import { TESTE } from '../percurso/canal';
export const VERSAO_TESTE = TESTE || 'v016';
type Orc = ReturnType<typeof orcamentoV16>;
const curta = (v: number, cod: string) => { try { return new Intl.NumberFormat(String(LOC()), { style: 'currency', currency: cod, notation: 'compact', maximumFractionDigits: 2 }).format(v); } catch { return formatarMoedaEst(v, cod); } };
const slug = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const ROTULO_PDF = { brief: 'Resumo para decisão (PDF)', anexo: 'Anexo técnico (PDF)', plano: 'Resumo do plano completo (PDF)' };
/** Nome do arquivo no idioma da interface, com a versão: "resumo-para-decisao-governanca-v016.pdf". */
export function nomeArquivoV16(tipo: 'brief' | 'anexo' | 'plano', frente?: string): string {
  const base = slug(t(tipo === 'brief' ? 'Resumo para decisão' : tipo === 'anexo' ? 'Anexo técnico' : 'Resumo do plano completo'));
  return [base, frente ? slug(t(frente)) : '', VERSAO_TESTE].filter(Boolean).join('-') + '.pdf';
}

async function comDoc<T>(lang0: string | undefined, fontes0: any, corpo: (doc: any, fontes: any, lang: string) => T): Promise<T> {
  const antigo = getLang(), lang = lang0 || antigo || 'pt';
  const jsPDF = await carregarJsPDF();
  const fontes = fontes0 !== undefined ? fontes0 : IDIOMAS_FONTE.includes(lang) ? await carregarFontesPDF() : null;
  if (lang !== antigo) setLang(lang);
  try { const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true }); fontePDF(doc, fontes, lang); corpo(doc, fontes, lang); return doc as T; }
  finally { limparFontePDF(); if (lang !== antigo) setLang(antigo); }
}

/** Pequeno motor de layout: texto com quebra, títulos, listas e tabela categoria × fase. */
function escritor(doc: any, cabecalho: string) {
  const W = 595.28, H = 841.89, M = 48, LIM = H - 64, C = PDF_COR;
  let y = 72;
  const fonte = (n: number, bold = false, cor: number[] = C.tinta) => { doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(n); doc.setTextColor(...cor); };
  const cab = () => { fonte(8, false, C.muted); doc.text(pdfTxt(cabecalho), M, 34); doc.setDrawColor(...C.linha); doc.line(M, 43, W - M, 43); };
  const nova = () => { doc.addPage(); y = 72; cab(); };
  const cabe = (h: number) => { if (y + h > LIM) nova(); };
  const texto = (s: string, n = 10, bold = false, cor?: number[], largura = W - M * 2, x = M) => {
    fonte(n, bold, cor); const linhas: string[] = doc.splitTextToSize(pdfTxt(s), largura);
    for (const l of linhas) { cabe(n * 1.4); fonte(n, bold, cor); doc.text(l, x, y); y += n * 1.4; }
  };
  const titulo = (s: string, n = 13) => { cabe(n * 3); y += 8; texto(s, n, true, C.titulo); y += 2; };
  const lista = (itens: string[]) => { for (const i of itens) { cabe(14); fonte(10); doc.text('•', M, y); const yy = y; texto(i, 10, false, undefined, W - M * 2 - 12, M + 12); if (y === yy) y += 14; } };
  const tabela = (o: Orc) => {
    const linhas = matrizFases(o), fases = o.fases.length === 1 && o.fases[0].id === 'total' ? [] : o.fases, colNome = 190, colW = (W - M * 2 - colNome) / (fases.length + 1);
    const linhaCab = () => { cabe(24); doc.setFillColor(...C.cab); doc.rect(M, y - 11, W - M * 2, 18, 'F'); fonte(8, true);
      doc.text(pdfTxt(t('Categoria')), M + 4, y); fases.forEach((f, i) => doc.text(pdfTxt(f.nome), M + colNome + colW * (i + 1) - 4, y, { align: 'right' }));
      doc.text(pdfTxt(t('Total')), W - M - 4, y, { align: 'right' }); y += 14; };
    linhaCab();
    let grupo = '';
    for (const l of linhas) {
      if (l.grupo && l.grupo !== grupo) { grupo = l.grupo; cabe(16); fonte(8, true, C.muted); doc.text(pdfTxt(grupo.toUpperCase()), M + 4, y); y += 12; }
      const recuo = l.nivel ? 10 : 0; fonte(l.nivel ? 8 : 8.5, !l.nivel, l.nivel ? C.muted : C.tinta); const nome: string[] = doc.splitTextToSize(pdfTxt((l.n ? l.n + ' ' : '') + l.nome), colNome - 8 - recuo);
      const h = Math.max(1, nome.length) * 11 + 4; if (y + h > LIM) { nova(); linhaCab(); }
      const est = l.tipo === 'estimado', val = (v: number | null) => v === null ? (l.tipo === 'a_levantar' ? t('falta valor') : '—') : curta(v, o.moeda) + (est ? '*' : '');
      nome.forEach((s, i) => doc.text(s, M + 4 + recuo, y + i * 11));
      fonte(8.5, false, est ? C.media : l.tipo === 'a_levantar' ? C.muted : C.tinta);
      fases.forEach((f, i) => doc.text(pdfTxt(val(l.porFase[f.id])), M + colNome + colW * (i + 1) - 4, y, { align: 'right' }));
      fonte(8.5, true, est ? C.media : C.tinta); doc.text(pdfTxt(val(l.total)), W - M - 4, y, { align: 'right' });
      y += h; doc.setDrawColor(...C.linha); doc.line(M, y - 8, W - M, y - 8);
    }
    cabe(18); fonte(8.5, true);
    doc.text(pdfTxt(t('Custo conhecido')), M + 4, y);
    fases.forEach((f, i) => doc.text(pdfTxt(curta(f.informado + f.estimado, o.moeda)), M + colNome + colW * (i + 1) - 4, y, { align: 'right' }));
    doc.text(pdfTxt(curta(totalConhecido(o), o.moeda)), W - M - 4, y, { align: 'right' }); y += 14;
    texto(fases.length ? t('* estimado (veja "O que está sendo custeado"). "falta valor": ainda sem valor, fora do custo conhecido. Meses e alcance acumulado: {fases}.', { fases: o.fases.map(f => f.nome + ' ' + t('{n} meses', { n: f.meses }) + ', ' + f.alcance + '%').join(' · ') }) : t('* estimado (veja "O que está sendo custeado"). "falta valor": ainda sem valor, fora do custo conhecido. Duração: {n} meses.', { n: o.fases[0]?.meses || 0 }), 7.5, false, C.muted);
  };
  const rodape = (rotulo: string, data: string) => { const N = doc.getNumberOfPages(); for (let n = 1; n <= N; n++) { doc.setPage(n); doc.setDrawColor(...C.linha); doc.line(M, H - 47, W - M, H - 47); fonte(8, false, C.muted); doc.text(pdfTxt(rotulo + ' · ' + VERSAO_TESTE + ' · ' + data), M, H - 30); doc.text(n + ' / ' + N, W - M, H - 30, { align: 'right' }); } };
  return { cab, texto, titulo, lista, tabela, rodape, avancar: (n: number) => { y += n; } };
}

const planoDe = (s: Estado14, f: FrenteEstimativa) => f === 'governanca' ? planoGovernanca(s) : f === 'letramento' ? planoLetramento(s) : planoEd(s);

export async function gerarPDFFrenteV16(s: Estado14, opts: { frente: FrenteEstimativa; tipo: 'brief' | 'anexo'; data?: Date; fontes?: any; lang?: string }) {
  return comDoc(opts.lang || s.lang, opts.fontes, doc => {
    const v = estadoDaFrente(s, opts.frente as FrenteId), p: any = planoDe(v, opts.frente), o: Orc = p.orcamento;
    const rotulo = t(opts.tipo === 'brief' ? 'Resumo para decisão' : 'Anexo técnico'), w = escritor(doc, p.titulo);
    const inst = instituicaoV16(v), pais = nomePais(paisDoCaso(v.caso));
    w.cab(); w.texto(rotulo, 10, true, PDF_COR.muted); w.avancar(14); w.texto(p.titulo, 20, true); w.texto([inst, pais].filter(Boolean).join(' · ') || t('País a definir'), 12); w.avancar(6);
    w.titulo(t('Em resumo')); w.texto(resumoProsa(o), 10.5);
    w.titulo(t('Custo por categoria e fase')); w.tabela(o);
    if (o.memoria.length) { w.titulo(t('O que está sendo custeado')); w.lista(linhasMemoria(o)); }
    // v018: fontes públicas dos valores (governança)
    if (opts.frente === 'governanca') { const fs = fontesDasContas(o.itens.flatMap((i: any) => i.linhas)); const conv = o.itens.some((i: any) => i.linhas.some((l: any) => l.esforcoC));
      if (fs.length || conv) { w.titulo(t('Fontes dos valores')); w.lista([...fs.map(f => f.titulo + ': ' + f.url), ...(conv ? [t('Esforços de referência e salário de referência: convenções da ferramenta (grau C), iguais para todos os países, a calibrar.')] : [])]); } }
    w.titulo(t('Riscos e condições')); w.lista(riscosV16(opts.frente, o));
    w.titulo(t('Próximo passo')); w.texto(p.proxima, 10.5, true);
    if (opts.tipo === 'anexo') for (const b of p.blocos) { w.titulo(b.titulo, 12); for (const l of b.linhas) { w.texto(l.rotulo, 9, true); w.texto(l.valor, 9.5); w.avancar(3); } }
    w.rodape(rotulo, (opts.data || new Date()).toISOString().slice(0, 10));
  });
}

export async function gerarPDFPlanoV16(s: Estado14, opts: { data?: Date; fontes?: any; lang?: string } = {}) {
  return comDoc(opts.lang || s.lang, opts.fontes, doc => {
    const c = consolidadoV16(s), rotulo = t('Resumo do plano completo'), w = escritor(doc, t('Plano de IA na educação'));
    const inst = instituicaoV16(s), pais = nomePais(paisDoCaso(s.caso));
    w.cab(); w.texto(rotulo, 10, true, PDF_COR.muted); w.avancar(14); w.texto(t('Plano de IA na educação'), 20, true); w.texto([inst, pais].filter(Boolean).join(' · ') || t('País a definir'), 12); w.avancar(6);
    w.titulo(t('Em resumo'));
    if (c.mesmaMoeda) {
      w.texto(t(c.faltam === 1 ? 'Custo conhecido do plano: {total} ({inf} informado e {est} estimado). 1 item ainda sem valor.' : c.faltam ? 'Custo conhecido do plano: {total} ({inf} informado e {est} estimado). {n} itens ainda sem valor.' : 'Custo do plano: {total} ({inf} informado e {est} estimado).', { total: formatarMoedaEst(c.conhecido, c.moeda), inf: formatarMoedaEst(c.informado, c.moeda), est: formatarMoedaEst(c.estimado, c.moeda), n: c.faltam }), 10.5);
      w.texto(t('Por fase: {fases}.', { fases: c.fases.map(f => f.nome + ' ' + formatarMoedaEst(f.valor, c.moeda)).join('; ') }) + (c.frentes.some(f => f.id === 'governanca') ? ' ' + t('A governança não tem fases: entra só no total.') : ''), 10.5);
    } else w.texto(t('As frentes usam moedas diferentes ({moedas}); os valores não são somados.', { moedas: c.moedas.join(', ') }), 10.5);
    w.lista(c.frentes.map(f => f.titulo + ': ' + formatarMoedaEst(totalConhecido(f.o), f.o.moeda) + (f.o.faltam ? ' · ' + (f.o.faltam === 1 ? t('1 item sem valor') : t('{n} itens sem valor', { n: f.o.faltam })) : '')));
    for (const f of c.frentes) { w.titulo(f.titulo); w.texto(resumoProsa(f.o), 9.5); w.avancar(4); w.tabela(f.o); if (f.o.memoria?.length) { w.texto(t('O que está sendo custeado'), 9.5, true); w.lista(linhasMemoria(f.o)); } }
    w.titulo(t('Riscos e condições')); w.lista([...new Set(c.frentes.flatMap(f => riscosV16(f.id as FrenteEstimativa, f.o)))]);
    w.rodape(rotulo, (opts.data || new Date()).toISOString().slice(0, 10));
  });
}
