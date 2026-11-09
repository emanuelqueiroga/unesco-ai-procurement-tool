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
export const ROTULO_PDF = { brief: 'Resumo para decisão (PDF)', anexo: 'Anexo técnico (PDF)', plano: 'Resumo do plano completo (PDF)', roteiro: 'Roteiro de implementação (PDF)' };
/** Nome do arquivo no idioma da interface, com a versão: "resumo-para-decisao-governanca-v016.pdf". */
export function nomeArquivoV16(tipo: 'brief' | 'anexo' | 'plano' | 'roteiro', frente?: string): string {
  const base = slug(t(tipo === 'brief' ? 'Resumo para decisão' : tipo === 'anexo' ? 'Anexo técnico' : tipo === 'roteiro' ? 'Roteiro de implementação' : 'Resumo do plano completo'));
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
  /** v018 (roteiro): quadro-síntese com até quatro números, numa faixa cinza. */
  const sintese = (cels: [string, string][]) => {
    cabe(56); const lw = (W - M * 2) / cels.length; doc.setFillColor(...C.fundo); doc.rect(M, y, W - M * 2, 46, 'F');
    cels.forEach(([r, v], i) => { const x = M + 12 + i * lw; let fs = 7.5; fonte(fs, true, C.muted); while (doc.getTextWidth(pdfTxt(r.toUpperCase())) + r.length * 0.3 > lw - 18 && fs > 5.5) { fs -= 0.5; fonte(fs, true, C.muted); } doc.text(pdfTxt(r.toUpperCase()), x, y + 16, { charSpace: 0.3 }); fonte(12, true, C.titulo); doc.text(pdfTxt(v), x, y + 34); });
    y += 58;
  };
  /** v018 (roteiro): ficha da etapa (objetivo, justificativa, período), com barra de destaque à esquerda. */
  const ficha = (linhas: [string, string][]) => {
    const col = 108, larg = W - M * 2 - col - 22; fonte(9); const partes = linhas.map(([r, v]) => ({ r, l: doc.splitTextToSize(pdfTxt(v), larg) as string[] }));
    const h = partes.reduce((n, x) => n + x.l.length * 12.5 + 5, 0) + 12; cabe(h + 10);
    doc.setFillColor(...C.fundo); doc.rect(M, y, W - M * 2, h, 'F'); doc.setFillColor(...C.marca); doc.rect(M, y, 3, h, 'F');
    let yy = y + 17; for (const x of partes) { fonte(8.5, true, C.titulo); doc.text(pdfTxt(x.r), M + 12, yy); fonte(9); x.l.forEach((l, i) => doc.text(l, M + 12 + col, yy + i * 12.5)); yy += x.l.length * 12.5 + 5; }
    y += h + 12;
  };
  /** v018 (roteiro): uma ação numerada (1.2), com responsável, produto, prazo, dependência e fonte em cinza. */
  const acao = (num: string, oque: string, detalhes: string, nota?: string) => {
    fonte(9.5); const l1: string[] = doc.splitTextToSize(pdfTxt(oque), W - M * 2 - 34); cabe(l1.length * 13 + 26);
    fonte(9.5, true, C.titulo); doc.text(pdfTxt(num), M, y);
    texto(oque, 9.5, false, undefined, W - M * 2 - 34, M + 34);
    if (detalhes) texto(detalhes, 8, false, C.muted, W - M * 2 - 34, M + 34);
    if (nota) texto(nota, 8, false, C.muted, W - M * 2 - 34, M + 34);
    y += 7;
  };
  /** v018 (roteiro): fluxo das etapas — 1 no topo, as intermediárias lado a lado (em paralelo), a execução e o monitoramento. */
  const fluxo = (cx: { n: number; titulo: string; quando: string; sub?: string }[], legenda: string) => {
    const subLinhas = (sub: string, w: number): string[] => { fonte(7.2); return doc.splitTextToSize(pdfTxt(sub), w - 16); };
    const altura = (c: { sub?: string }) => c.sub ? 46 + subLinhas(c.sub, W - M * 2).length * 9 : 46;
    const L = W - M * 2, h = 46, gap = 26, topo = cx.filter(c => c.n === 1), meio = cx.filter(c => c.n > 1 && c.n < 6), baixo = cx.filter(c => c.n >= 6);
    const alturas = [h, meio.length ? h + 8 : 0, ...baixo.map(altura)].filter(Boolean);
    cabe(alturas.reduce((a, b) => a + b, 0) + gap * (alturas.length - 1) + 40); y += 4;
    const seta = (x: number, y1: number, y2: number) => { doc.setDrawColor(...C.marca); doc.setLineWidth(0.9); doc.line(x, y1, x, y2 - 4); doc.setFillColor(...C.marca); doc.triangle(x - 3.5, y2 - 5, x + 3.5, y2 - 5, x, y2, 'F'); doc.setLineWidth(0.2); };
    const caixa = (c: { n: number; titulo: string; quando: string; sub?: string }, x: number, yy: number, w: number, hh: number, forte = false) => {
      doc.setFillColor(...(forte ? C.fases[0] : C.tintA)); doc.setDrawColor(...C.marca); doc.setLineWidth(0.8); doc.roundedRect(x, yy, w, hh, 4, 4, 'FD'); doc.setLineWidth(0.2);
      fonte(6.8, true, C.marca); doc.text(pdfTxt(t('Etapa {n}', { n: c.n }).toUpperCase()), x + 8, yy + 11, { charSpace: 0.3 });
      fonte(8.6, true, C.tinta); const tl: string[] = doc.splitTextToSize(pdfTxt(c.titulo), w - 16); tl.slice(0, 2).forEach((l, i) => doc.text(l, x + 8, yy + 22 + i * 10));
      fonte(7.2, false, C.muted); doc.text(pdfTxt(c.quando), x + 8, yy + hh - 7);
      if (c.sub) { fonte(7.2, false, C.tinta); subLinhas(c.sub, w).forEach((l, i) => doc.text(l, x + 8, yy + 34 + i * 9)); }
    };
    let yy = y; const cx0 = M + L / 2;
    if (topo[0]) { caixa(topo[0], cx0 - 95, yy, 190, h); yy += h; }
    if (meio.length) {
      const wm = (L - (meio.length - 1) * 12) / meio.length, centros = meio.map((_, i) => M + i * (wm + 12) + wm / 2), bus = yy + gap / 2;
      doc.setDrawColor(...C.marca); doc.setLineWidth(0.9); doc.line(cx0, yy, cx0, bus); doc.line(centros[0], bus, centros[centros.length - 1], bus); doc.setLineWidth(0.2);
      centros.forEach(c => seta(c, bus, yy + gap)); yy += gap;
      meio.forEach((c, i) => caixa(c, M + i * (wm + 12), yy, wm, h + 8)); yy += h + 8;
      const bus2 = yy + gap / 2; doc.setDrawColor(...C.marca); doc.setLineWidth(0.9); centros.forEach(c => doc.line(c, yy, c, bus2)); doc.line(centros[0], bus2, centros[centros.length - 1], bus2); doc.setLineWidth(0.2);
      seta(cx0, bus2, yy + gap); yy += gap;
    } else if (topo[0]) { seta(cx0, yy, yy + gap); yy += gap; }
    baixo.forEach((c, i) => { const hh = altura(c); caixa(c, M, yy, L, hh, c.n === 6); yy += hh; if (i < baixo.length - 1) { seta(cx0, yy, yy + gap); yy += gap; } });
    y = yy + 14; texto(legenda, 8, false, C.muted);
  };
  /** v018 (roteiro): quadro de verificação (anexo) — caixinha, número, ação, responsável e data de conclusão. */
  const quadro = (linhas: { num: string; oque: string; quem: string }[]) => {
    const cols = [16, 32, 250, 128], xs = cols.reduce<number[]>((a, c, i) => [...a, (a[i] ?? M) + c], [M]), wData = W - M - xs[4];
    const cabQ = () => { cabe(26); doc.setFillColor(...C.cab); doc.rect(M, y - 11, W - M * 2, 18, 'F'); fonte(7.5, true);
      [['', 0], [t('Nº'), 1], [t('Ação'), 2], [t('Responsável'), 3], [t('Concluída em'), 4]].forEach(([r, i]) => doc.text(pdfTxt(r as string), xs[i as number] + 4, y)); y += 16; };
    cabQ();
    for (const l of linhas) {
      fonte(7.5); const a: string[] = doc.splitTextToSize(pdfTxt(l.oque), cols[2] - 8), q: string[] = doc.splitTextToSize(pdfTxt(l.quem), cols[3] - 8);
      const hh = Math.max(a.length, q.length) * 9.5 + 7; if (y + hh > LIM) { nova(); cabQ(); }
      doc.setDrawColor(...C.tinta); doc.setLineWidth(0.6); doc.rect(M + 4, y - 7, 7.5, 7.5); doc.setLineWidth(0.2);
      fonte(7.5, true, C.titulo); doc.text(pdfTxt(l.num), xs[1] + 4, y); fonte(7.5); a.forEach((s, i) => doc.text(s, xs[2] + 4, y + i * 9.5)); fonte(7.5, false, C.muted); q.forEach((s, i) => doc.text(s, xs[3] + 4, y + i * 9.5));
      doc.setDrawColor(...C.muted); doc.line(xs[4] + 6, y + 1, xs[4] + wData - 6, y + 1);
      y += hh; doc.setDrawColor(...C.linha); doc.line(M, y - 8, W - M, y - 8);
    }
  };
  /** v018 (roteiro): calendário em barras, mês a mês (contínua = até o fim do plano, com seta; além do plano = âmbar). */
  const calendario = (linhas: { rotulo: string; inicio: number; fim: number | null; continua: boolean; semPrazo: boolean; passa: boolean }[], duracao: number, legenda: string) => {
    const colNome = 200, x0 = M + colNome, larg = W - M - x0, meses = Math.max(duracao, ...linhas.map(l => l.fim || 0)), mx = larg / meses;
    const cabCal = () => { cabe(30); fonte(7.5, true, C.muted); for (let m = 1; m <= meses; m++) if (m === 1 || m % 3 === 0) doc.text(String(m), x0 + (m - 0.5) * mx, y, { align: 'center' });
      doc.setDrawColor(...C.linha); doc.line(x0, y + 4, x0 + larg, y + 4); y += 14; };
    fonte(7.5, false, C.muted); doc.text(pdfTxt(t('Mês')), M, y); cabCal();
    for (const l of linhas) {
      fonte(8); const nome: string[] = doc.splitTextToSize(pdfTxt(l.rotulo), colNome - 8); const h = nome.length * 10 + 6;
      if (y + h > LIM) { nova(); cabCal(); }
      fonte(8); nome.forEach((s, i) => doc.text(s, M, y + i * 10));
      if (l.semPrazo) { fonte(7.5, false, C.muted); doc.text(pdfTxt(t('sem prazo definido no plano')), x0 + (l.inicio - 1) * mx, y); }
      else {
        const fim = l.continua ? meses : (l.fim as number), dentro = Math.min(fim, duracao);
        doc.setFillColor(...C.marca); doc.rect(x0 + (l.inicio - 1) * mx, y - 7, Math.max(1, dentro - l.inicio + 1) * mx, 8, 'F');
        if (fim > duracao) { doc.setFillColor(...C.ambarL); doc.rect(x0 + duracao * mx, y - 7, (fim - duracao) * mx, 8, 'F'); }
        if (l.continua) { doc.setFillColor(...C.marca); doc.triangle(x0 + larg, y - 7, x0 + larg, y + 1, x0 + larg + 6, y - 3, 'F'); }
      }
      y += h; doc.setDrawColor(...C.linha); doc.line(M, y - 9, W - M, y - 9);
    }
    texto(legenda, 7.5, false, C.muted);
  };
  return { cab, texto, titulo, lista, tabela, rodape, sintese, ficha, acao, fluxo, quadro, calendario, pagina: nova, reservar: (h: number) => cabe(h), avancar: (n: number) => { y += n; } };
}

const planoDe = (s: Estado14, f: FrenteEstimativa) => f === 'governanca' ? planoGovernanca(s) : f === 'letramento' ? planoLetramento(s) : planoEd(s);

export async function gerarPDFFrenteV16(s: Estado14, opts: { frente: FrenteEstimativa; tipo: 'brief' | 'anexo'; data?: Date; fontes?: any; lang?: string }) {
  return comDoc(opts.lang || s.lang, opts.fontes, doc => {
    const v = estadoDaFrente(s, opts.frente as FrenteId), p: any = planoDe(v, opts.frente), o: Orc = p.orcamento;
    const rotulo = t(opts.tipo === 'brief' ? 'Resumo para decisão' : 'Anexo técnico'), w = escritor(doc, p.titulo);
    const inst = instituicaoV16(v), pais = nomePais(paisDoCaso(v.caso));
    w.cab(); w.texto(rotulo, 10, true, PDF_COR.muted); w.avancar(14); w.texto(p.titulo, 20, true); w.texto([inst, pais].filter(Boolean).join(' · ') || t('País a definir'), 12); w.avancar(6);
    w.titulo(t('Em resumo')); w.texto(resumoProsa(o), 10.5);
    if (opts.frente === 'governanca' && o.existentes > 0) w.texto(t('Desembolso novo: {v}. O custo conhecido inclui {e} de servidores que já existem, marcados em "Ajustar a equipe".', { v: formatarMoedaEst(totalConhecido(o) - o.existentes, o.moeda), e: formatarMoedaEst(o.existentes, o.moeda) }), 10);
    w.titulo(t('Custo por categoria e fase')); w.tabela(o);
    if (o.memoria.length) { w.titulo(t('O que está sendo custeado')); w.lista(linhasMemoria(o)); }
    // v018: fontes públicas dos valores (governança)
    if (opts.frente === 'governanca') { const fs = fontesDasContas(o.itens.flatMap((i: any) => i.linhas)); const conv = o.itens.some((i: any) => i.linhas.some((l: any) => l.esforcoC));
      if (fs.length || conv) { w.titulo(t('Fontes dos valores')); w.lista([...fs.map(f => f.titulo + ': ' + f.url), ...(conv ? [t('Equipes de referência (papéis, pessoas, dedicação e meses): estimativas da ferramenta (grau C), que podem variar conforme o contexto.')] : [])]); } }
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

/** v018 (governança): "Roteiro de implementação" — documento formal: quadro-síntese, apresentação, fluxo das etapas,
 *  etapas com objetivo, justificativa e ações numeradas, calendário de referência, riscos, glossário, referências e, no
 *  anexo, o quadro de verificação para marcar à mão. Prazos sem fonte ficam marcados com *. */
export async function gerarPDFRoteiroGov(s: Estado14, opts: { data?: Date; fontes?: any; lang?: string } = {}) {
  const { montarRoteiro, FONTES } = await import('../percurso/roteiroGov');
  return comDoc(opts.lang || s.lang, opts.fontes, doc => {
    const v = estadoDaFrente(s, 'governanca' as FrenteId), r = montarRoteiro(v as any), rotulo = t('Roteiro de implementação'), w = escritor(doc, r.titulo);
    const inst = instituicaoV16(v), pais = nomePais(paisDoCaso(v.caso)), data = opts.data || new Date();
    type P = (typeof r.etapas)[number]['passos'][number];
    // numeração das ações: 1.1 … (etapas) e 6.1.1 … (cada tipo de medida da etapa 6)
    const numero = new Map<string, string>(); const todos: P[] = [];
    for (const e of r.etapas) e.passos.forEach((p, k) => { numero.set(p.id, e.n + '.' + (k + 1)); todos.push(p); });
    r.grupos.forEach((g, j) => g.passos.forEach((p, k) => { numero.set(p.id, '6.' + (j + 1) + '.' + (k + 1)); todos.push(p); }));
    const ordem = (a: string, b: string) => a.split('.').map(Number).reduce((d, x, i) => d || x - (Number(b.split('.')[i]) || 0), 0);
    const fontes: string[] = [], ref = (k: string) => { const i = fontes.indexOf(k); if (i >= 0) return i + 1; fontes.push(k); return fontes.length; };
    const detalhes = (p: P) => [
      t('Responsável') + ': ' + p.quem, t('Produto') + ': ' + p.pronto,
      p.prazo ? t('Prazo de referência') + ': ' + p.prazo + (p.fonte ? '' : '*') : '',
      p.depende?.length ? t('Depende de') + ': ' + p.depende.map(d => numero.get(d)).filter(Boolean).join(', ') : '',
      p.adaptar ? t('Depende do ordenamento do país') : '',
      p.fonte ? t('Fonte') + ': [' + ref(p.fonte) + ']' : '',
    ].filter(Boolean).join('  |  ');
    const acoes = (ps: P[]) => { for (const p of ps) w.acao(numero.get(p.id) as string, p.oque, detalhes(p), p.nota); };

    w.cab(); w.texto(rotulo.toUpperCase(), 8.5, true, PDF_COR.marca); w.avancar(10); w.texto(r.titulo, 18, true);
    w.texto([inst, pais, data.toLocaleDateString(String(LOC()), { year: 'numeric', month: 'long', day: 'numeric' })].filter(Boolean).join(' · '), 10.5, false, PDF_COR.muted); w.avancar(10);
    w.sintese([[t('Duração do plano'), t('{n} meses', { n: r.duracao })], [t('Custo estimado'), r.totais.total], [t('Medidas do plano'), String(r.totais.medidas)], [t('Itens sem valor'), String(r.totais.semValor.length)]]);
    w.texto(t('Custo estimado: medidas {op} e custos adicionais (viagens, overhead e taxa administrativa) {ad}; valores arredondados.', { op: r.totais.opcoes, ad: r.totais.adicionais })
      + (r.totais.semValor.length ? ' ' + t('Itens sem valor: {lista}.', { lista: r.totais.semValor.map(x => t(x)).join('; ') }) : ''), 8.5, false, PDF_COR.muted);

    w.titulo(t('1. Apresentação'));
    w.texto(t('Este roteiro organiza as ações necessárias para executar o plano de governança elaborado na ferramenta. As ações estão agrupadas em etapas, apresentadas no fluxo da seção 2 e detalhadas na seção 3. Para cada etapa, indicam-se o objetivo, a justificativa e o período de referência; para cada ação, o responsável usual, o produto que comprova sua conclusão, o prazo de referência, as ações de que depende e, quando houver, a fonte. O quadro de verificação, no anexo, reúne todas as ações para o acompanhamento da execução.'), 9.5);
    w.avancar(4);
    w.texto(t('Convenções: prazos marcados com * são referências desta ferramenta, sem fonte publicada, e devem ser ajustados à realidade do país. A indicação "Depende do ordenamento do país" assinala ações cujo instrumento ou rito deve ser confirmado com a consultoria jurídica ou a área de planejamento.'), 9.5);

    w.reservar(200); w.titulo(t('2. Fluxo de implementação'));
    w.fluxo(r.etapas.map(e => ({ n: e.n, titulo: e.titulo, quando: e.quando, sub: e.id === 'execucao' ? r.grupos.map(g => g.titulo).join(' · ') : undefined })),
      t('Figura 1. Fluxo de implementação. Aprovado o plano (etapa 1), as etapas intermediárias ocorrem em paralelo e preparam a execução das medidas; o monitoramento acompanha toda a execução.'));

    w.reservar(200); w.titulo(t('3. Etapas e ações'));
    for (const e of r.etapas) {
      w.reservar(170); w.texto(t('Etapa {n}. {titulo}', { n: e.n, titulo: e.titulo }), 12, true, PDF_COR.titulo); w.avancar(4);
      w.ficha([[t('Objetivo'), e.objetivo], [t('Justificativa'), e.porque], [t('Período de referência'), e.quando]]);
      if (e.id === 'execucao') r.grupos.forEach((g, j) => {
        w.avancar(2); w.reservar(130); w.texto('6.' + (j + 1) + '. ' + g.titulo, 10.5, true, PDF_COR.tinta);
        w.texto(g.resumo + ' ' + t('Prazo típico') + ': ' + g.prazoTipico + '*.', 9, false, PDF_COR.muted); w.avancar(2);
        w.lista(g.opcoes.map(x => [t(x.rotulo), x.custo, x.continua ? t('contínua') : x.meses ? t('{n} meses', { n: x.meses }) : '', x.equipe ? t('equipe de referência') + ': ' + x.equipe : ''].filter(Boolean).join(' · ')
          + (x.alerta ? '. ' + x.alerta : '') + (x.falta ? '. ' + x.falta : '')));
        w.avancar(6); acoes(g.passos);
      });
      else acoes(e.passos);
      w.avancar(6);
    }
    if (r.calendario.length) {
      w.reservar(200); w.titulo(t('4. Calendário de referência'));
      w.calendario(r.calendario.map(c => ({ ...c, rotulo: t(c.rotulo) })), r.duracao, t('Figura 2. Meses de execução de cada medida, a partir do início de referência (convenção da ferramenta). Seta: medida contínua, que prossegue após o plano. Âmbar: período que excede a duração do plano ({n} meses).', { n: r.duracao }));
    }
    w.titulo(t('5. Riscos de implementação')); w.lista(r.riscos);
    w.titulo(t('6. Glossário')); w.lista(r.glossario.map(([a, b]) => a + ': ' + b));
    if (fontes.length) { w.titulo(t('7. Referências')); w.lista(fontes.map((k, i) => { const f = (FONTES as Record<string, { titulo: string; url: string }>)[k]; return '[' + (i + 1) + '] ' + t(f.titulo) + '. ' + f.url; })); }
    w.avancar(4); w.texto(t('* Prazo de referência da ferramenta, sem fonte publicada. As ações e os prazos são ponto de partida e devem ser adaptados à legislação, ao orçamento e à estrutura administrativa do país.'), 8, false, PDF_COR.muted);

    w.pagina(); w.titulo(t('Anexo. Quadro de verificação'));
    w.texto(t('Registrar a data de conclusão de cada ação. A numeração remete à seção 3.'), 9, false, PDF_COR.muted); w.avancar(8);
    w.quadro([...todos].sort((a, b) => ordem(numero.get(a.id) as string, numero.get(b.id) as string)).map(p => ({ num: numero.get(p.id) as string, oque: p.oque, quem: p.quem })));
    w.rodape(rotulo, data.toISOString().slice(0, 10));
  });
}
