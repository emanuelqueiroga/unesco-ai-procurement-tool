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
  /** v018 (roteiro): um passo com a caixinha vazia para marcar à mão, o número, o texto e os detalhes em cinza. */
  const passo = (n: number, oque: string, detalhes: string, nota?: string) => {
    fonte(10); const l1: string[] = doc.splitTextToSize(pdfTxt(n + '. ' + oque), W - M * 2 - 18); cabe(l1.length * 14 + 22);
    doc.setDrawColor(...C.tinta); doc.setLineWidth(0.8); doc.rect(M, y - 8.5, 9, 9); doc.setLineWidth(0.2);
    texto(n + '. ' + oque, 10, false, undefined, W - M * 2 - 18, M + 18);
    if (detalhes) texto(detalhes, 8.5, false, C.muted, W - M * 2 - 18, M + 18);
    if (nota) texto(nota, 8.5, false, C.muted, W - M * 2 - 18, M + 18);
    y += 6;
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
  return { cab, texto, titulo, lista, tabela, rodape, passo, calendario, avancar: (n: number) => { y += n; } };
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
      if (fs.length || conv) { w.titulo(t('Fontes dos valores')); w.lista([...fs.map(f => f.titulo + ': ' + f.url), ...(conv ? [t('Equipes de referência (papéis, pessoas, dedicação e meses): convenção da ferramenta (grau C), a calibrar.')] : [])]); } }
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

/** v018 (governança): "Roteiro de implementação" — checklist para imprimir, com as 10 primeiras ações, os passos de
 *  cada opção escolhida, o calendário sugerido, cuidados, glossário e fontes. Prazos sem fonte ficam marcados com *. */
export async function gerarPDFRoteiroGov(s: Estado14, opts: { data?: Date; fontes?: any; lang?: string } = {}) {
  const { montarRoteiro, FONTES } = await import('../percurso/roteiroGov');
  return comDoc(opts.lang || s.lang, opts.fontes, doc => {
    const v = estadoDaFrente(s, 'governanca' as FrenteId), r = montarRoteiro(v as any), rotulo = t('Roteiro de implementação'), w = escritor(doc, r.titulo);
    const inst = instituicaoV16(v), pais = nomePais(paisDoCaso(v.caso));
    // números dos passos (para "depois do passo N") e das fontes (na ordem em que aparecem)
    const todos = [...r.primeiras, ...r.etapas.flatMap(e => e.passos), ...r.grupos.flatMap(g => g.passos)];
    const numero = new Map(todos.map((p, i) => [p.id, i + 1]));
    const fontes: string[] = [], ref = (k?: string) => { if (!k) return 0; const i = fontes.indexOf(k); if (i >= 0) return i + 1; fontes.push(k); return fontes.length; };
    const detalhes = (p: typeof todos[number]) => [
      t('Quem') + ': ' + p.quem, t('Pronto quando') + ': ' + p.pronto,
      p.prazo ? t('Prazo') + ': ' + p.prazo + (p.fonte ? '' : ' *') : '',
      p.depende?.length ? t('Depois do passo {n}', { n: p.depende.map(d => numero.get(d)).filter(Boolean).join(', ') }) : '',
      p.adaptar ? t('Depende das regras do país') : '',
      p.fonte ? t('Fonte') + ' [' + ref(p.fonte) + ']' : '',
    ].filter(Boolean).join(' · ');
    const passos = (ps: typeof todos) => { for (const p of ps) w.passo(numero.get(p.id) as number, p.oque, detalhes(p), p.nota); };

    w.cab(); w.texto(rotulo, 10, true, PDF_COR.muted); w.avancar(14); w.texto(r.titulo, 20, true); w.texto([inst, pais].filter(Boolean).join(' · ') || t('País a definir'), 12); w.avancar(4);
    w.texto(t('Duração do plano: {n} meses · Custo estimado: {total} (opções {op} + custos adicionais {ad}), arredondado.', { n: r.duracao, total: r.totais.total, op: r.totais.opcoes, ad: r.totais.adicionais }), 10);
    if (r.totais.semValor.length) w.texto(t('Ainda sem valor: {lista}.', { lista: r.totais.semValor.map(x => t(x)).join('; ') }), 9.5, false, PDF_COR.media);
    w.titulo(t('Como usar este roteiro'), 11);
    w.texto(t('Marque cada caixinha quando o passo estiver pronto. "Quem" é quem costuma fazer o passo; "Pronto quando" diz como saber que ele terminou. "Depende das regras do país": confirme com a consultoria jurídica ou o planejamento. Prazos com * são referência da ferramenta, sem fonte publicada: ajuste à realidade do seu país.'), 9.5);
    w.titulo(t('Comece por aqui: as 10 primeiras ações')); passos(r.primeiras);
    w.titulo(t('Depois: o que vale para todo o plano'));
    for (const e of r.etapas) { w.texto(e.titulo + ' · ' + e.quando, 11, true, PDF_COR.titulo); w.texto(e.porque, 9, false, PDF_COR.muted); w.avancar(4); passos(e.passos); }
    if (r.grupos.length) {
      w.titulo(t('Os passos de cada opção do plano'));
      for (const g of r.grupos) {
        w.avancar(4); w.texto(g.titulo, 11.5, true, PDF_COR.titulo); w.texto(g.resumo + ' ' + t('Prazo típico') + ': ' + g.prazoTipico + ' *', 9, false, PDF_COR.muted); w.avancar(2);
        w.lista(g.opcoes.map(x => [t(x.rotulo), x.custo, x.continua ? t('contínua') : x.meses ? t('{n} meses', { n: x.meses }) : '', x.equipe ? t('equipe') + ': ' + x.equipe : ''].filter(Boolean).join(' · ')
          + (x.alerta ? ' — ' + x.alerta : '') + (x.falta ? ' — ' + x.falta : '')));
        w.avancar(4); passos(g.passos);
      }
    }
    if (r.calendario.length) {
      w.titulo(t('Calendário sugerido'));
      w.calendario(r.calendario.map(c => ({ ...c, rotulo: t(c.rotulo) })), r.duracao, t('Barras: meses de cada opção, a partir do início sugerido (convenção da ferramenta). Seta no fim: contínua, segue depois do plano. Âmbar: passa da duração do plano ({n} meses).', { n: r.duracao }));
    }
    w.titulo(t('Cuidados')); w.lista(r.armadilhas);
    w.titulo(t('Glossário')); w.lista(r.glossario.map(([a, b]) => a + ': ' + b));
    if (fontes.length) { w.titulo(t('Fontes')); w.lista(fontes.map((k, i) => { const f = (FONTES as Record<string, { titulo: string; url: string }>)[k]; return '[' + (i + 1) + '] ' + t(f.titulo) + ': ' + f.url; })); }
    w.texto(t('* Prazo de referência da ferramenta, sem fonte publicada. Os passos e as fontes são um ponto de partida: adapte-os às leis, ao orçamento e à estrutura do seu país.'), 8, false, PDF_COR.muted);
    w.rodape(rotulo, (opts.data || new Date()).toISOString().slice(0, 10));
  });
}
