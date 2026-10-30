import { nomeContexto } from '../domain/pais.js';
// =====================================================================
// PDF do plano de contratação (jsPDF 2.5.2 + jsPDF-AutoTable 3.8.4, Helvetica/WinAnsi). Porte de src/plano_pdf.js
// da v13 (gerarPDF, fontes embutidas, pdfTxt, quebra CJK, árabe e aviso de tradução), sem DOM nem globais:
//   gerarPDF(estado, opts) → documento jsPDF (não baixa nada); nomeArqPDF(estado) → 'procurement-plan-<slug>.pdf'.
// v14: o PDF segue as páginas do plano novo (PAGINAS_PLANO, secoes.js), com os títulos A1–A7 e B1–B9 dentro delas:
//   capa (faixa em gradiente das fases, logos, título, caso, linha que remete ao policy brief, aviso de plano parcial,
//   índice, isenção);
//   Quanto custa (colunas da dotação por exercício; A2 com a fórmula, custo por camada, dotação e premissas; A3 e pontos de atenção);
//   O que fazer (R6: antes de decidir, responda; como testar e avaliar; plano de ação por pacote; listas do guia como
//   referência, B1–B4, B7–B9); R6: a sequência de decisões vem logo depois da capa;
//   O que exigir (A4–A7, B5, B6);
//   Apêndice (perfil do caso em cartões, matriz camadas × fases em duas páginas, Figura 1 em página própria,
//   referências e respostas que faltam).
// 0.0.15 (REL-01 a REL-08, REL-13 a REL-17, MOT-03, MOT-04): a capa traz o custo total e os indicadores com o nome de
// cada denominador; "Em resumo" é o sumário executivo (faixa P10–P90, indicadores, seis respostas, cinco ações em
// cartões, um iceberg por fase, três direcionadores, como ler); cada página abre com a pergunta de decisão, o
// título-achado e o parágrafo de abertura; os títulos não levam os códigos A1–A7 e B1–B9; "Quanto custa" ganha custo
// por fase, indicadores do custo total, adoção, cenários, direcionadores e simulação; o apêndice, premissas e fontes
// e glossário. Os dados vêm de plano/relatorio.js pela seção "resumo" (`sumario`), os mesmos da página.
// As faixas dos blocos A e B da v13 saem (as seções foram redistribuídas pelas páginas); a cor de cada seção continua
// a do bloco: azul para A, roxo para B. Páginas internas com cabeçalho (fio + título corrido) e rodapé
// "Valores ilustrativos · v<versão>" e "n / N". Corpo 10 pt, tabelas 8,6 pt, 8 pt só em rodapé e legendas.
// Idiomas fora do WinAnsi (ar, zh, bm): fontes de src/plano/fontes_pdf.generated.js (scripts/fontes-pdf.mjs),
// importadas sob demanda; sem esse arquivo (ou com opts.fontes === null), Helvetica e troca de caracteres, como a
// v13 com SEM_FONTES=1.
// PB-04 (policy brief): este PDF é o "Anexo técnico para a contratação", o segundo PDF do plano. Não repete o resumo
// executivo: "Em resumo" (veredito, cuidado, contadores, faixa, seis respostas, cinco cartões, como ler) saiu daqui e o
// resumo é a página 1 do policy brief (pdf_brief.js, o PDF principal); a capa traz um índice e remete ao brief.
// =====================================================================
import {
  tr, LOC, getLang, setLang, avisoTraducao, TXT_VINCULO, FAIXA_PLANO, TIT_PLANO,
  din, mil, grande, pct, unidMil, totaisCtx, etapasAtivas, numerosCusto, cfgAtual, somaPorCamada, fmtInt,
  NOTA_MATRIZ_CUSTO, CREDITO_MATRIZ,
} from '../domain/index.ts';
// mesmos critérios da página (percurso/painel.ts): números só com o tipo de tecnologia, origem dos KPIs e lacunas nas duas classes
import { painelDe, tituloParcial, textoLacunas, rotuloOrigem } from '../percurso/painel.ts';
import { NOME_FERRAMENTA, TIT_PAGINAS, ROT_ESTADO, TXT_MATRIZ, TXT_REF, secoesPlano, secoesDaPagina, trSecao, copiaEstado, slugPlano, nomeCamada } from './secoes.js';
// 0.0.15: textos do sumário executivo e das aberturas das páginas (os mesmos da página)
import { TXT_REL } from './relatorio.js';

// fontes geradas (opcional): import.meta.glob devolve {} quando o arquivo não existe
const FONTES_GERADAS = import.meta.glob('./fontes_pdf.generated.js', { import: 'default' });
// idiomas que pedem fonte embutida (as famílias de tools/subset_fonts.py)
const IDIOMAS_FONTE = ['ar', 'zh', 'bm'];

// REC-11: "→" não existe na Helvetica (WinAnsi); "»" é o substituto que lê como seta (antes saía "->")
const PDF_TROCA = { '→': '»', '←': '<-', '≥': '>=', '≤': '<=', '✓': 'v', '✕': 'x', '−': '-', '≈': '~', 'ⓘ': '(i)', ' ': ' ', ' ': ' ', '‑': '-', '‐': '-', '«': '«', '»': '»', '☐': '', '·': '·' };
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
  // R6 (REC-19): sem "prioridade alta"; a capa diz quantas condições estão abertas para a próxima decisão
  verSeq: 'Sequência de decisões na página {0}.', cuidado: 'Nível de cuidado', proxima: 'Próxima decisão',
  nRecs: '{0} ações no total', ilustr: 'Valores ilustrativos.', gerado: 'Gerado em',
  fEtapas: 'Etapas e estudantes', fApl: 'Aplicações', fQuem: 'Quem usa', fTec: 'Tecnologia e pagamento', fTeste: 'Teste', fEscala: 'Escala',
  estudantes: '{0} estudantes', escolas: '{0} escolas', pessoas: '{0} pessoas na rede', horiz: 'horizonte de {0} anos',
  acao: 'Ação', prio: 'Prioridade', origem: 'Origem',
  semNumeros: 'Ainda sem números', semNumerosDet: 'Os números do plano aparecem quando você disser o tipo de tecnologia da ferramenta (pergunta 2.3.4).',
  premissas1: 'Estimativa com 1 resposta a confirmar (premissa padrão ou sugestão).', premissasN: 'Estimativa com {0} respostas a confirmar (premissa padrão ou sugestão).',
  faltasEss: 'Perguntas do Essencial', faltasRef: 'Perguntas de refinamento',
  // PB-04: o PDF de sempre vira o anexo técnico; o resumo executivo está no policy brief (pdf_brief.js)
  anexo: 'Anexo técnico para a contratação', anexoCurto: 'Anexo técnico', policyBrief: 'Policy brief', indiceAnexo: 'Neste anexo',
  remeteBrief: 'Este anexo acompanha o policy brief deste caso, que traz em seis páginas a recomendação, o desenho, o custo, os riscos e os próximos passos. Aqui estão os detalhes para a contratação.',
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
  // P: o painel da página (mesma fonte): números só com o tipo de tecnologia, origem de cada KPI, lacunas e ações
  const P = painelDe(estado);
  let N = null;
  if (P.temNumeros) { try { N = numerosCusto(cfgAtual(copiaEstado(estado))); if (N && !N.camadas) N.camadas = somaPorCamada(N.av); } catch (e) { console.warn(e); N = null; } }
  const resumoRaw = raw.find(s => s.id === 'resumo') || { kv: [] };
  const KV = {}; (resumoRaw.kv || []).forEach(([k, v]) => { KV[k] = v; });
  const kvT = k => { const v = KV[k]; return v == null || v === '' ? '' : tr(v); };
  const faltas = secs.find(s => s.tipo === 'faltas');
  // valores e origens do painel da página (mesma formatação); [valor, rótulo, origem em texto]
  const ROT_KPI = [tr('Custo do Ano 0 (prova de conceito ou piloto)'), tr('Custo total do ciclo de vida'), tr('Dotação média por ano de operação'), tr('Por usuário ativo por ano')];
  const KPIS = N ? P.kpis.map((k, i) => [k.value || '—', ROT_KPI[i], rotuloOrigem(k.origem)]) : [];
  const ORIG_A2 = [0, 1, 2, 3, 0, 1].map(i => (KPIS[i] || [])[2]);   // os 6 cartões de A2: os quatro KPIs, o Ano 0 por participante e a saída
  // 0.0.15: sumário executivo (plano/relatorio.js, pela seção "resumo"): os mesmos números e nomes da página
  const SUM = resumoRaw.sumario || null;
  // R6: recomendações no relatório (plano/recplano.js:planoRec), já traduzidas: as mesmas frases da página
  const REC = (SUM && SUM.rec) || null;
  const comSum = !!(N && SUM && SUM.numeros && SUM.faixa);
  // capa: o custo total e os indicadores com o nome de cada denominador (decisão 3), sem o custo em regime
  const ACH = (SUM && SUM.achados) || {};
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
  const cartaoKPI = (x, yy, w, h, v, l, cor, sizeV, orig) => {
    doc.setDrawColor(...C.linha); doc.setLineWidth(0.7); doc.setFillColor(...C.branco);
    doc.roundedRect(x, yy, w, h, 6, 6, 'FD');
    doc.setFillColor(...cor); doc.rect(x + 12, yy, 28, 3, 'F');
    // origem do número (padrão, sugerido, informado, refinado), em texto, no canto do cartão
    if (orig) { fonte(8, 'bold', C.marca); doc.text(pdfTxt(orig), x + w - 8, yy + 13, { align: 'right' }); }
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
  const ATENCAO = [tr('Tratar no plano')].map(pdfTxt), MARCAR = [tr('Condição'), tr('Prioridade')].map(pdfTxt);   // REC-19: sem "Alta"
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
  // PB-04: o PDF é o "Anexo técnico para a contratação"; a capa não repete o resumo executivo (está no policy brief):
  // título, caso, a linha que remete ao brief, o aviso de plano parcial e o índice com páginas e links
  let pagRecs = 0, pagFaltas = 0, pagSeq = 0;
  const INDICE = [];   // [título, página] para o índice da capa
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
    doc.text(pdfTxt(tP('anexoCurto').toUpperCase()), W - M, 66, { align: 'right', charSpace: 0.6 });
    fonte(9, 'normal', C.branco);
    doc.text(pdfTxt(agora.toLocaleDateString(LOC(), { year: 'numeric', month: 'long', day: 'numeric' })), W - M, 80, { align: 'right' });

    y = BH + 40;
    fonte(12, 'bold', C.marca); doc.text(pdfTxt(NOME_FERRAMENTA), M, y); y += 30;
    const LT = corta(quebra(tP('anexo'), 28, LW, 'bold'), 2);
    fonte(28, 'bold', C.titulo); LT.forEach(l => { doc.text(l, M, y); y += 33; });
    y -= 15;
    doc.setFillColor(...C.marca); doc.rect(M, y, 46, 3.2, 'F'); y += 22;
    const LC = corta(quebra(nomeCaso, 20, LW, 'bold'), 3);
    fonte(20, 'bold', C.tinta); LC.forEach(l => { doc.text(l, M, y + 16); y += 25; });
    fonte(10.5, 'normal', C.muted);
    doc.text(pdfTxt([nomeContexto(estado), tP('gerado') + ' ' + agora.toLocaleDateString(LOC())].filter(Boolean).join('  ·  ')), M, y + 10);
    y += 30;

    // a linha que remete ao policy brief (o resumo executivo, a recomendação e os números principais ficam lá)
    {
      const Lb = quebra(tP('remeteBrief'), 10.5, LW - 36);
      const hBox = 34 + Lb.length * 15 + 12;
      doc.setFillColor(...C.fundo); doc.roundedRect(M, y, LW, hBox, 8, 8, 'F');
      doc.setFillColor(...C.marca); doc.rect(M, y + 8, 4, hBox - 16, 'F');
      fonte(8.6, 'bold', C.marca); doc.text(pdfTxt(tP('policyBrief').toUpperCase()), M + 20, y + 22, { charSpace: 0.5 });
      fonte(10.5, 'normal', C.tinta); Lb.forEach((l, i) => doc.text(l, M + 20, y + 38 + i * 15));
      y += hBox + 14;
    }
    // plano parcial: o aviso (antes em "Em resumo"), com a página da lista no fim
    if (faltas) {
      const h = 40, L = P.lacunas, s = tituloParcial(L), y0 = y;
      doc.setFillColor(...C.ambar); doc.setDrawColor(...C.ambarL); doc.setLineWidth(0.6); doc.roundedRect(M, y, LW, h, 5, 5, 'FD');
      fonte(9.6, 'bold', C.media); doc.text(pdfTxt(s), M + 12, y + 16.5);
      fonte(8.6, 'normal', C.media); doc.text(pdfTxt(textoLacunas(L)), M + 12, y + 31);
      fonte(9.6, 'bold', C.media);
      const w1b = doc.getTextWidth(pdfTxt(s));
      tarde.push(() => {
        if (!pagFaltas) return;
        doc.setPage(1); fonte(9.6, 'normal', C.media);
        doc.text(pdfTxt(tPn('verLista', pagFaltas)), M + 18 + w1b, y0 + 16.5); ehLink(M, y0, LW, h, pagFaltas);
      });
      y += h + 14;
    }
    if (!N) {
      // sem o tipo de tecnologia (2.3.4) não há números: o PDF diz isso, como a página
      const h = 60;
      doc.setFillColor(...C.fundo); doc.roundedRect(M, y, LW, h, 8, 8, 'F');
      fonte(11, 'bold', C.titulo); doc.text(pdfTxt(tP('semNumeros')), M + 16, y + 22);
      fonte(9.2, 'normal', C.muted); quebra(P.temNumeros ? tP('semCusto') : tP('semNumerosDet'), 9.2, LW - 32).forEach((l, i) => doc.text(l, M + 16, y + 37 + i * 12));
      y += h + 12;
    }
    // índice com páginas e links (preenchido no fim, quando as páginas são conhecidas)
    const yI = y + 14, hIsen = quebra(tr(FAIXA_PLANO), 8.6, LW - 24).length * 11.8 + 16, limI = H - 40 - hIsen - 22;
    tarde.push(() => {
      const itens = INDICE.filter(z => z[1]);
      if (!itens.length) return;
      doc.setPage(1);
      const lin = Math.ceil(itens.length / 2), g = 24, wI = (LW - g) / 2;
      const hl = Math.min(19, (limI - yI - 16) / lin);
      if (hl < 14) return;
      fonte(8.6, 'bold', C.marca); doc.text(pdfTxt(tP('indiceAnexo').toUpperCase()), M, yI + 8, { charSpace: 0.5 });
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
  // REL-07, REL-08: a pergunta de decisão (no alto da faixa), o título-achado e o parágrafo de abertura (os da página)
  const ABERTURA = {
    custa: [TXT_REL.q2, N ? ACH.custa : '', TXT_REL.i2],
    fazer: [TXT_REL.q5, ACH.fazer, 'A próxima decisão, o que responder antes, os portões entre as etapas, como testar e avaliar e as ações deste caso por pacote. Cada ação tem o seu número (R-nn) e a pergunta que a originou: se mudar a resposta, a lista muda.'],
    exigir: [TXT_REL.q4, ACH.exigir, 'O que pedir na contratação: o arranjo de aquisição, as cláusulas de custo, dados e saída, a diligência proporcional ao risco e os documentos do dossiê.'],
    apendice: ['', '', TXT_REL.anexosAbre],
  };
  const aberturaPagina = pg => {
    novaPag();
    const h = 64, cor = COR_PAG[pg] || C.marca, tit = tr(TIT_PAGINAS[pg]);
    const [perg, achado, intro] = ABERTURA[pg] || [];
    INDICE.push([tit, doc.getNumberOfPages(), 0]);
    doc.setFillColor(...cor); doc.roundedRect(M, y, LW, h, 8, 8, 'F');
    fonte(9, 'bold', C.branco); doc.text(pdfTxt((perg ? tr(perg) : tP('anexoCurto')).toUpperCase()), M + 20, y + 22, { charSpace: 0.5 });
    fonte(20, 'bold', C.branco); doc.text(pdfTxt(tit), M + 20, y + 47);
    y += h + 14;
    if (achado) texto(achado, { size: 12.5, b: true, cor: C.titulo, after: 4 });
    if (intro) texto(tr(intro), { size: 10, cor: C.muted, after: 10 });
  };

  // PB-04: "Em resumo" (veredito, nível de cuidado, contadores, faixa, seis respostas, cinco cartões, como ler) saiu do
  // anexo técnico: o resumo executivo é a página 1 do policy brief (pdf_brief.js), com a mesma recomendação e os mesmos
  // números; o nível de cuidado e as cinco ações estão nas páginas 5 e 6 do brief.
  // tabela simples com cores no estado (sequência de decisões)
  const COR_ESTADO = { pronto: [30, 107, 58], falta: C.alta, premissa: C.media, impossivel: C.alta };
  const sequenciaPDF = () => {
    if (!REC || !REC.nRecs) return;
    const SQ = REC.sequencia, r = SQ.rotulos;
    novaPag(); pagSeq = doc.getNumberOfPages(); INDICE.push([SQ.titulo, pagSeq, 0]);   // PB-04: primeiro item do índice (sem "Em resumo")
    tituloSec(SQ.titulo, SQ.intro, C.fasesS[2]);
    // REC-22: o aviso de mais de 5 condições, com a lista (os R-nn; o texto de cada uma está no plano de ação)
    if (REC.aviso) texto(REC.aviso.texto + ' ' + REC.aviso.lista.map(x => x.id).join(', ') + '.', { size: 9.2, b: true, cor: C.alta, after: 6 });
    SQ.portoes.forEach(g => {
      const rows = g.criterios.map(k => [k.criterio, k.valor, k.rotuloEstado, k.ids.join(', ') || '—']);
      const est = g.criterios.map(k => k.estado);
      const hT = altTabela([r.criterio], rows, { larg: [150, 0, 88, 64] });
      // o título do portão fica na mesma página que a tabela
      subtitulo(g.titulo, C.titulo, Math.min(hT, 260) + 34);
      texto([r.decisao + ': ' + g.decisao, r.quem + ': ' + g.quem, r.quando + ': ' + g.quando].join('   ·   '), { size: 8.4, cor: C.muted, after: 3 });
      if (y + hT > BASE) cabe(hT < 260 ? hT + 4 : 70);
      doc.autoTable({
        startY: y, rowPageBreak: 'avoid', theme: 'plain', margin: { left: M, right: M, top: TOP, bottom: H - BASE },
        head: [[r.criterio, r.valor, r.estado, r.vem].map(pdfTxt)], body: rows.map(z => z.map(pdfTxt)),
        styles: { font: 'helvetica', fontSize: 8.4, cellPadding: 4, textColor: C.tinta, lineColor: C.linha, lineWidth: { bottom: 0.5 }, valign: 'top' },
        headStyles: { fillColor: C.cab, textColor: C.titulo, fontStyle: 'bold', lineWidth: { bottom: 0.9 }, lineColor: C.marca },
        columnStyles: { 0: { cellWidth: 150 }, 2: { cellWidth: 88 }, 3: { cellWidth: 64 } },
        didParseCell: dd => { if (dd.section === 'body' && dd.column.index === 2) { dd.cell.styles.fontStyle = 'bold'; dd.cell.styles.textColor = COR_ESTADO[est[dd.row.index]] || C.tinta; } },
      });
      y = doc.lastAutoTable.finalY + 8;
    });
    subtitulo(SQ.pdTitulo, C.titulo, 60);
    SQ.pds.forEach(pd => texto(pd.n + '. ' + pd.titulo + ' · ' + pd.acoes, { size: 8.6, after: 2 }));
  };
  // "Antes de decidir, responda" (5.3, bloco 1)
  const pendPDF = () => {
    if (!REC) return;
    const Rt = REC.rotulos;
    subtitulo(Rt.pendT, C.titulo, 60);
    if (!REC.pend.length) { texto(Rt.pendVazio, { size: 9, cor: C.muted }); return; }
    texto(Rt.pendIntro, { size: 8.6, cor: C.muted, after: 4 });
    REC.pend.forEach(pd => {
      texto(pd.n + ' ' + pd.pergunta + ' — ' + pd.resposta + ' (' + pd.rotuloTipo + ')', { size: 9.2, b: true, cor: C.titulo, after: 1 });
      texto(pd.motivo + (pd.linhaIds ? ' ' + pd.linhaIds : ''), { size: 8.6, after: 2 });
      if (pd.efeito) tabela([pd.efeito.rotulo, ''], pd.efeito.valores.map(v => [v.rotulo + (v.atual ? ' (' + Rt.pendAtual + ')' : ''), v.total]), { num: [1], hl: pd.efeito.valores.map((v, i) => (v.atual ? i : -1)).filter(i => i >= 0) });
    });
    if (pagSeq) texto(tPn('verSeq', pagSeq), { size: 8.6, i: true, cor: C.muted });
  };
  // "Como testar e avaliar" (5.3, bloco 3): ficha de aceite, desenho de avaliação, quem pode ficar para trás
  const testePDF = X => {
    if (!X) return;
    const F = X.ficha;
    subtitulo(F.titulo, corB, 80);
    texto(F.intro, { size: 8.6, cor: C.muted, after: 3 });
    texto(F.classeTxt, { size: 9.2, b: true, after: 3 });
    const linhas = L => L.map(l => [l.criterio, l.valor + ' (' + l.rotulo + ')']);
    if (F.linhas.length) tabela([F.rotulos.criterio, F.rotulos.limiar], linhas(F.linhas), { larg: [0, 170] }, corB);
    F.blocos.forEach(b => { texto(b.titulo + ' (' + b.id + ')', { size: 9, b: true, cor: C.titulo, after: 1 }); tabela([F.rotulos.criterio, F.rotulos.limiar], linhas(b.linhas), { larg: [0, 170] }, corB); });
    tabela(null, F.fixos, { larg: [130], b0: true }, corB);
    if (X.aval) {
      subtitulo(X.aval.titulo + ' (' + X.aval.rotulo + ')', corB, 50);
      X.aval.linhas.forEach(z => texto(z, { size: 9, ind: 13, after: 2, bullet: true, corBullet: corB }));
      if (X.aval.premissas.length) { texto(X.aval.rotuloPrem, { size: 8.4, cor: C.muted, after: 1 }); X.aval.premissas.forEach(z => texto(z, { size: 8.2, ind: 13, after: 1, cor: C.muted })); }
      if (X.custoAval) texto(X.custoAval, { size: 8.6, i: true, cor: C.muted });
    }
    subtitulo(X.grupos.titulo, corB, 50);
    tabela(null, X.grupos.linhas, { larg: [150], b0: true }, corB);
    if (X.vale) {
      subtitulo(X.vale.titulo + ' (' + X.vale.rotulo + ')', corB, 40);
      texto(X.vale.frase, { size: 9 });
      X.vale.premissas.forEach(z => texto(z, { size: 8.2, ind: 13, after: 1, cor: C.muted }));
    }
  };
  // "Plano de ação" (5.3, bloco 4): tabela Nº (R-nn), Ação, Quem, Marco, Pronto quando e Origem, por pacote
  const planoAcaoPDF = () => {
    if (!REC || !REC.plano.grupos.length) return;
    const A = REC.plano, r = A.rotulos;
    novaPag(); pagRecs = doc.getNumberOfPages(); INDICE.push([A.titulo, pagRecs, 1]);
    tituloSec(A.titulo, A.intro, COR_PAG.fazer);
    const body = [];
    A.grupos.forEach((g, gi) => {
      body.push([{ content: pdfTxt(g.titulo + '  ·  ' + g.rotuloNivel + '  ·  ' + g.contagem), colSpan: 6, styles: { fillColor: mix(C.fases[gi % 4], [255, 255, 255], 0.72), textColor: C.titulo, fontStyle: 'bold', fontSize: 9 } }]);
      g.marcos.forEach(m => m.itens.forEach(it => body.push([it.id, it.oque + (it.etiqueta ? ' ' + it.etiqueta : ''), it.quem, m.nome, it.pronto, it.origem].map(pdfTxt).concat([]))));
    });
    cabe(80);
    doc.autoTable({
      startY: y, rowPageBreak: 'avoid', theme: 'plain', margin: { left: M, right: M, top: TOP, bottom: H - BASE },
      head: [[r.n, r.acao, r.quem, r.marco, r.pronto, r.origem].map(pdfTxt)], body,
      styles: { font: 'helvetica', fontSize: 7.8, cellPadding: 3.5, textColor: C.tinta, lineColor: C.linha, lineWidth: { bottom: 0.5 }, valign: 'top' },
      headStyles: { fillColor: C.cab, textColor: C.titulo, fontStyle: 'bold', lineWidth: { bottom: 0.9 }, lineColor: C.marca, fontSize: 8.2 },
      columnStyles: { 0: { cellWidth: 34, fontStyle: 'bold', textColor: C.titulo }, 2: { cellWidth: 70 }, 3: { cellWidth: 56 }, 4: { cellWidth: 100 }, 5: { cellWidth: 84, textColor: C.muted } },
    });
    y = doc.lastAutoTable.finalY + 8;
    if (A.base.length) texto(A.baseTitulo + ': ' + A.base.map(b => b.id + ' · ' + b.oque).join(' '), { size: 8.4, cor: C.muted });
  };
  // abertura das listas do guia (referência)
  const refPDF = () => {
    cabe(80); y += 8;
    fonte(12.5, 'bold', C.titulo); quebra(tr(TXT_REF), 12.5, LW, 'bold').forEach(l => { doc.text(l, M, y + 12.5); y += 16; });
    y += 2;
    if (REC) texto(REC.rotulos.refIntro, { size: 8.6, cor: C.muted, after: 6 });
  };

  // Icebergs por fase (porte do bloco I.fases de plano_pdf.js da 0.0.15), com a paleta PDF_COR; os nomes das linhas
  // quebram em até duas linhas (na 0.0.15, "Computação e hospedagem" saía cortada como "Computação…")
  const icebergs = I => {
    const nF = I.fases.length, g = 10, wC = (LW - g * (nF - 1)) / nF, pd = 8, wI = wC - 2 * pd;
    fonte(8, 'bold');
    const wVal = Math.max(36, ...I.fases.flatMap(f => f.acima.concat(f.abaixo).map(z => doc.getTextWidth(pdfTxt(z.txt))))) + 6;
    // altura de cada linha pelo maior número de linhas do nome na mesma posição das três fases
    const nl = (L, k) => Math.max(1, ...I.fases.map(f => Math.min(2, quebra(L(f)[k].nome, 8, wI - wVal).length)));
    const hLA = I.fases[0].acima.map((_, k) => 9.4 * nl(f => f.acima, k) + 6.6), hLB = I.fases[0].abaixo.map((_, k) => 9.4 * nl(f => f.abaixo, k) + 6.6);
    const hCab = 30, hPico = 26, hA = 16 + hLA.reduce((a, b) => a + b, 0) + 2, hB = 24 + hLB.reduce((a, b) => a + b, 0), hPe = 52;
    const hTot = hCab + hPico + hA - 4 + hB + 4 + hPe;
    const LT = quebra(I.h, 10.5, LW, 'bold');
    cabe(hTot + 40 + LT.length * 13);
    fonte(10.5, 'bold', C.titulo); LT.forEach(l => { doc.text(l, M, y + 10); y += 13; }); y += 2;
    texto(I.abre, { size: 8.4, cor: C.muted, after: 6 });
    cabe(hTot + 24);
    const branco = C.branco, agua = C.titulo, agua2 = C.marca, ceu = C.cab, gelo = C.fases[0], gelo2 = C.fases[1], borda = C.fases[2];
    const barF = C.linha, barA = C.fases[0], cinza = C.muted, cinzaA = mix(C.fases[0], C.titulo, 0.35);
    const TINT = { piloto: mix(C.fases[1], branco, 0.55), implantacao: mix(C.fases[2], branco, 0.7), expansao: mix(C.fases[3], branco, 0.75) };
    const poli = (pts, estilo) => { const [x0_, y0_] = pts[0]; doc.lines(pts.slice(1).map((p_, k) => [p_[0] - pts[k][0], p_[1] - pts[k][1]]), x0_, y0_, [1, 1], estilo, true); };
    const linha = (x, yy, z, escuro, hL) => {
      const zero = !!z.zero;
      const corN = zero ? (escuro ? cinzaA : cinza) : (escuro ? branco : C.tinta);
      fonte(8, 'normal', corN);
      const L = corta(quebra(z.nome, 8, wI - wVal), 2);
      L.forEach((l, j) => doc.text(l, x, yy + 8 + j * 9.4));
      fonte(8, 'bold', zero ? (escuro ? cinzaA : cinza) : (escuro ? branco : C.titulo)); doc.text(pdfTxt(z.txt), x + wI, yy + 8, { align: 'right' });
      const yb = yy + hL - 4.2;
      doc.setFillColor(...(escuro ? mix(agua, branco, 0.25) : barF)); doc.roundedRect(x, yb, wI, 2.2, 1.1, 1.1, 'F');
      if (z.w > 0) { doc.setFillColor(...(escuro ? barA : C.marca)); doc.roundedRect(x, yb, Math.max(1.5, wI * z.w), 2.2, 1.1, 1.1, 'F'); }
    };
    I.fases.forEach((f, i) => {
      const x0 = M + i * (wC + g); let yy = y; const tint = TINT[f.id] || TINT.implantacao;
      doc.setFillColor(...tint); doc.roundedRect(x0, yy, wC, hCab + 6, 6, 6, 'F'); doc.rect(x0, yy + hCab - 4, wC, 10, 'F');
      fonte(9.4, 'bold', C.titulo); doc.text(corta(quebra(f.nome, 9.4, wI, 'bold'), 1)[0] || '', x0 + pd, yy + 13);
      fonte(8, 'normal', C.muted); doc.text(pdfTxt(f.anosTxt), x0 + pd, yy + 24); yy += hCab;
      doc.setFillColor(...ceu); doc.rect(x0, yy, wC, hPico + hA - 8, 'F');
      const L = x0 + wC * 0.1, R_ = x0 + wC * 0.9, b = yy + hPico + 10, top = yy + 3, cx = x0 + wC * 0.52, ww = R_ - L;
      const Pp = [[L, b], [L + ww * 0.22, yy + hPico * 0.45], [L + ww * 0.3, yy + hPico * 0.6], [cx, top], [L + ww * 0.62, yy + hPico * 0.42], [L + ww * 0.72, yy + hPico * 0.3], [R_, b]];
      doc.setFillColor(...gelo); poli(Pp, 'F');
      doc.setFillColor(...gelo2); poli([[cx, top], [L + ww * 0.62, yy + hPico * 0.42], [L + ww * 0.72, yy + hPico * 0.3], [R_, b], [cx + ww * 0.04, b], [cx - ww * 0.04, yy + hPico * 0.5]], 'F');
      doc.setDrawColor(...borda); doc.setLineWidth(0.8); poli(Pp, 'S');
      doc.setDrawColor(...branco); doc.setLineWidth(1.3); doc.line(cx, top, cx - 4, top + 13); doc.line(cx, top, cx + 6, top + 15);
      yy += hPico;
      doc.setFillColor(...C.linha); doc.roundedRect(x0 + pd - 3 + 0.6, yy + 0.9, wC - 2 * pd + 6, hA, 5, 5, 'F');
      doc.setFillColor(...branco); doc.roundedRect(x0 + pd - 3, yy, wC - 2 * pd + 6, hA, 5, 5, 'F');
      fonte(8, 'bold', C.muted); doc.text(pdfTxt(String(I.acima).toUpperCase()), x0 + pd, yy + 11, { charSpace: 0.3 });
      let yl = yy + 15;
      f.acima.forEach((z, k) => { linha(x0 + pd, yl, z, false, hLA[k]); yl += hLA[k]; });
      yy += hA - 4;
      doc.setFillColor(...C.fases[2]); doc.rect(x0, yy, wC, 3.5, 'F');
      doc.setFillColor(...agua); doc.rect(x0, yy + 3.5, wC, hB + 4 - 3.5, 'F');
      const pw = 0.62 + 0.36 * Math.max(0, Math.min(1, f.pOculto)), l = x0 + wC * (0.5 - pw / 2), r = x0 + wC * (0.5 + pw / 2), yb = yy + hB + 4;
      doc.setFillColor(...agua2);
      poli([[x0 + wC * 0.2, yy + 3.5], [x0 + wC * 0.8, yy + 3.5], [r - 2, yy + (yb - yy) * 0.3], [r, yy + (yb - yy) * 0.62], [r - 8, yy + (yb - yy) * 0.92], [x0 + wC * 0.58, yb], [x0 + wC * 0.36, yb - 2], [l + 6, yy + (yb - yy) * 0.84], [l, yy + (yb - yy) * 0.52], [l + 4, yy + (yb - yy) * 0.24]], 'F');
      fonte(8, 'bold', C.fases[0]); doc.text(pdfTxt(String(I.abaixo).toUpperCase()), x0 + pd, yy + 18, { charSpace: 0.3 });
      yl = yy + 23;
      f.abaixo.forEach((z, k) => { linha(x0 + pd, yl, z, true, hLB[k]); yl += hLB[k]; });
      yy += hB + 4;
      doc.setFillColor(...tint); doc.rect(x0, yy, wC, hPe - 6, 'F'); doc.roundedRect(x0, yy, wC, hPe, 6, 6, 'F');
      fonte(8, 'normal', C.muted); doc.text(pdfTxt(I.mediaRot), x0 + wC / 2, yy + 11, { align: 'center' });
      fonte(14, 'bold', C.titulo); doc.text(pdfTxt(f.mediaTxt), x0 + wC / 2, yy + 27, { align: 'center' });
      fonte(8, 'normal', C.muted); doc.text(corta(quebra(f.totalTxt, 8, wI), 1)[0] || '', x0 + wC / 2, yy + 38, { align: 'center' });
      fonte(8, 'bold', C.marca); doc.text(corta(quebra(f.ocultoTxt, 8, wI, 'bold'), 1)[0] || '', x0 + wC / 2, yy + 49, { align: 'center' });
      doc.setDrawColor(...C.linha); doc.setLineWidth(0.6); doc.roundedRect(x0, y, wC, hTot, 6, 6, 'S');
    });
    y += hTot + 6;
    texto(I.nota, { size: 8, cor: C.muted, i: true, after: 8 });
  };
  const direcionadores = D => {
    if (!D.length) return;
    cabe(20 + D.length * 22);
    fonte(10.5, 'bold', C.titulo); doc.text(pdfTxt(tr(TXT_REL.direcionadores)), M, y + 10); y += 16;
    const xB = M + 270, wB = LW - 270;
    D.forEach((z, i) => {
      fonte(8.8, 'bold', C.titulo); doc.text(corta(quebra((i + 1) + '. ' + z.nome, 8.8, 200, 'bold'), 1)[0] || '', M, y + 9);
      fonte(8, 'normal', C.muted); doc.text(pdfTxt(z.faixa), M + 205, y + 9);
      doc.setFillColor(...C.cab); doc.rect(xB, y + 2, wB, 6, 'F');
      doc.setFillColor(...C.alta); doc.rect(xB, y + 2, Math.max(2, wB * z.w), 6, 'F');
      fonte(8, 'normal', C.tinta); doc.text(pdfTxt(z.loTxt + '  a  ' + z.hiTxt), xB, y + 18);
      y += 22;
    });
    y += 6;
  };

  // R6: o custo em resumo (icebergs por fase e os três maiores direcionadores), no alto de "Quanto custa"
  const custoResumoPDF = () => {
    if (!(comSum && SUM.ice && SUM.ice.fases.length)) return;
    cabe(200);
    fonte(13, 'bold', C.titulo); doc.text(pdfTxt(tr(TXT_REL.custoT)), M, y + 13); y += 20;
    texto(tr(TXT_REL.custoAbre), { size: 8.6, cor: C.muted, after: 4 });
    icebergs(SUM.ice);
    direcionadores(SUM.drivers || []);
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
    cabe(h + 18 + altInicio(s) + (s.ref ? 14 : 0)); if (y > TOP + 4) y += 8;
    // R6 (REC-43): as listas do guia levam o rótulo "referência"
    if (s.ref) { fonte(8, 'bold', C.muted); doc.text(pdfTxt(tr(TXT_REF).toUpperCase()), M, y + 8, { charSpace: 0.3 }); y += 13; }
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
    kv.forEach(([k, v], i) => cartaoKPI(M + (i % por) * (w + g), y + Math.floor(i / por) * (h + g), w, h, v, k, corB, 13, ORIG_A2[i]));
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
    if (s.achado) texto(s.achado, { size: 11, b: true, cor: C.titulo, after: 4 });
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
  doc.setProperties({ title: pdfTxt(NOME_FERRAMENTA + ' - ' + tP('anexo') + ' - ' + nomeCaso), subject: pdfTxt(tP('anexo')), creator: NOME_FERRAMENTA });
  capa();
  // a sequência de decisões logo depois da capa (R6, 5.3; PB-04: sem "Em resumo", que está no policy brief)
  sequenciaPDF();
  // Quanto custa (A2, A3)
  aberturaPagina('custa');
  custoResumoPDF();
  colunasExercicio();
  secoesDaPagina(secs, 'custa').forEach(secao);
  // O que fazer (recomendações, A1, B1–B4, B7–B9)
  aberturaPagina('fazer');
  // R6 (5.3): antes de decidir, responda; como testar e avaliar (A1 ampliada); plano de ação por pacote; listas do guia
  // como referência (o bloco B abre a parte de referência)
  secoesDaPagina(secs, 'fazer').forEach(s => {
    if (s.id === 'recs' && !s.sub) { pendPDF(); return; }
    if (s.id === 'B' && !s.sub) { if (REC) { planoAcaoPDF(); refPDF(); } return; }
    secao(s);
    if (s.id === 'A1' && !s.sub && s.avaliacao) testePDF(s.avaliacao);
  });
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
      // as duas classes: perguntas do Essencial e de refinamento (a mesma contagem do aviso do Em resumo)
      const nE = s.nEss == null ? s.list.length : s.nEss;
      const grupo = (tit, itens) => { if (!itens.length) return; if (s.nEss != null) subtitulo(tit + ' (' + itens.length + ')', C.media, 40); itens.forEach(z => texto(z, { size: 10, ind: 13, after: 3, bullet: true, corBullet: C.media })); };
      grupo(tP('faltasEss'), s.list.slice(0, nE));
      grupo(tP('faltasRef'), s.list.slice(nE));
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
      let run = pdfTxt(NOME_FERRAMENTA + '  ·  ' + tP('anexo') + '  ·  ' + nomeCaso);
      while (doc.getTextWidth(run) > LW && run.length > 20) run = run.slice(0, -2);
      if (run.length < pdfTxt(NOME_FERRAMENTA + '  ·  ' + tP('anexo') + '  ·  ' + nomeCaso).length) run = run.replace(/\s*\S?$/, '') + '…';
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

// PB-02: o policy brief (pdf_brief.js) usa as mesmas fontes, o mesmo RTL e a mesma paleta: fontePDF registra a fonte
// do idioma, limparFontePDF volta à Helvetica no fim (como o finally de gerarPDF) e carregarJsPDF carrega o jsPDF.
function limparFontePDF() { PDF_FONTE = null; }
export { gerarPDF, nomeArqPDF, recursosPDF, carregarFontesPDF, carregarJsPDF, fontePDF, limparFontePDF, pdfTxt, quebrarCJK, inflarPDF, PDF_COR, PDF_TXT, PDF_AREAS, IDIOMAS_FONTE };
