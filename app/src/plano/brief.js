import { estadoDoProjeto } from '../domain/escopo.js';
import { nomeContexto } from '../domain/pais.js';
// =====================================================================
// Policy brief (design/redesign/06-policy-brief.md, PB-01): dados do PDF principal e da tela "Em resumo", já
// traduzidos. Parte pura (sem DOM): lê as mesmas fontes do plano (secoesPlano → resumo e sumário; relDados; planoRec),
// para que a página 1 do brief, a tela e o anexo técnico mostrem os mesmos números e a mesma recomendação.
//   briefDados(estado, opts?) → {
//     vazio, titulo, subtitulo, data, selo,
//     recomendacao: { texto, porque, codigo },
//     frases: { contexto, teste, implantacao, expansao, custo }   cada uma { rotulo, texto, falta?: { n, pergunta, ir } }
//     numeros: [{ id: 'total'|'ano0'|'regime', rotulo, valor, nota }]   (a nota do total traz a faixa P10–P90)
//     etapas:  [{ id: 'teste'|'implantacao'|'expansao'|'rede', nome, anos, custo, custoTxt }]
//     paginas: { problema, desenho, custo, riscos, passos }   cada uma { secao, titulo (título-achado), abre, blocos[] }
//     acoes:   [{ n, id, oque, quem, quando }]   (os 5 cartões: só o quê, quem e quando)
//     rotulos: { ... }   (rótulos fixos já traduzidos: tela e PDF)
//   }
// Blocos das páginas 2–6 (o PDF e a tela desenham pelo tipo):
//   { tipo: 'texto', titulo?, texto }   { tipo: 'lista', titulo?, itens: string[] }
//   { tipo: 'tabela', titulo?, head: string[], rows: string[][], num?: number[] }   (no máximo 8 linhas, nenhuma com zero)
//   { tipo: 'numeros', titulo?, itens: [{ rotulo, valor, nota? }] }
//   { tipo: 'barras', titulo?, itens: [{ rotulo, sub, valor, txt, w }] }   (custo por fase; w de 0 a 1)
//   { tipo: 'etapas', titulo? }   (a linha do tempo de `etapas`)
// Frases do resumo: no máximo 35 palavras (em português); caso incompleto: "A definir: responda à pergunta n (…)".
// Textos novos: TXT_BRIEF (chaves de tradução em português; {0}, {1}… são lugares de valores). TEXTOS_BRIEF: a lista.
// =====================================================================
import { tr, LOC, grande, din, pct, fmtInt, OPC, MARCOS_REC, recContexto } from '../domain/index.ts';
import { lacunasDe } from '../percurso/painel.ts';
import { secoesPlano } from './secoes.js';
import { relDados, R as RR } from './relatorio.js';

export const TXT_BRIEF = {
  // rótulos fixos
  selo: 'Estimativa ilustrativa',
  tipoDoc: 'Policy brief',
  resumoExec: 'Resumo executivo',
  recRot: 'Recomendação',
  casoSemTitulo: 'Caso sem título',
  rContexto: 'Contexto', rPoc: 'Prova de conceito', rPiloto: 'Piloto', rPocPiloto: 'Prova de conceito e piloto',
  rTeste: 'Prova de conceito ou piloto', rImpl: 'Implantação', rExp: 'Expansão', rCusto: 'Custo', rRede: 'Rede toda, em regime',
  etapasT: 'As quatro etapas e o custo de cada uma',
  numerosT: 'Os três números',
  acoesT: 'As cinco ações para começar',
  cOque: 'O quê', cQuem: 'Quem', cQuando: 'Quando', cN: 'Nº',
  anexoBotao: 'Anexo técnico para a contratação',
  isencao: 'Valores ilustrativos, em preços do Ano 0. A ferramenta não fala em nome da UNESCO ou de outra instituição.',
  // frases do resumo executivo
  falta: 'A definir: responda à pergunta {0} ({1}).',
  ctx: '{0}: {1} Linha de base: {2}.',
  ctxSemLocal: '{1} Linha de base: {2}.',
  ctxSemBase: '{0}: {1} Ainda sem linha de base medida.',
  ctxSemBaseSemLocal: '{1} Ainda sem linha de base medida.',
  tPoc: 'Prova de conceito com {0}', tPoc0: 'Prova de conceito',
  tPil: 'Piloto em {0}', tPil0: 'Piloto', tPilD: 'piloto em {0}', tPilD0: 'piloto',
  tJunta: '{0}; depois, {1}',
  tCrit: '{0}; critério para passar: {1}.',
  critPoc: 'aceite técnico cumprido nos critérios fixados antes',
  critPil: 'efeito e adoção iguais ou acima das metas fixadas antes',
  impl: 'Implantação no Ano {0} em {1}, depois que o teste cumprir os critérios.',
  impl0: 'Implantação em {1}, depois que o teste cumprir os critérios.',
  exp: 'Chega à rede toda no Ano {0}, com {1} pessoas ({2}).',
  exp0: 'Chega à rede toda no Ano {0}, com {1} pessoas.',
  expSemAno: 'Chega à rede toda, com {1} pessoas ({2}).',
  expNao: 'No horizonte de {0} anos, chega a {1} das {2} pessoas da rede; ampliar o horizonte mostra a rede toda.',
  custo: 'Custo total de {0} (faixa provável de {1} a {2}); Ano 0: {3}; em regime, {4} por ano.',
  semCusto: 'Não foi possível calcular a estimativa com as respostas atuais.',
  // números e etapas
  nTotal: 'Custo total do ciclo de vida',
  anosRegime: 'A partir do Ano {0}',
  porAno: '{0} por ano',
  semValor: 'Aparece quando a pergunta {0} for respondida.',
  // páginas 2–6
  sProblema: 'O problema', sDesenho: 'O desenho', sCusto: 'O custo', sRiscos: 'Riscos e salvaguardas', sPassos: 'Próximos passos',
  aProblema: 'A situação atual, quem é afetado, a linha de base, por que agir agora e a alternativa sem IA.',
  aDesenho: 'As etapas, o que precisa estar pronto para passar de uma à outra e quem usa a solução.',
  aCusto: 'Quanto custa o ciclo de vida, quanto reservar, quanto custa cada fase e cada pessoa, e o que mais pesa no total.',
  aRiscos: 'O que pode dar errado, para quem, e as salvaguardas essenciais antes do uso.',
  aPassos: 'As cinco ações para começar, quem age e quando, e a decisão seguinte.',
  tProblema0: 'O problema ainda precisa ser descrito',
  tDesenho: 'Do teste à rede toda no Ano {0}, em quatro etapas',
  tDesenho0: 'Do teste à rede toda, em quatro etapas',
  tCusto: 'Custo total de {0}, dos quais {1} se repetem todo ano',
  tCusto0: 'O custo aparece quando o tipo de tecnologia for informado',
  tRiscoLim: 'Cuidado limitado: as regras gerais bastam',
  tRiscoMod: 'Cuidado moderado: os erros tendem a ser percebidos e corrigidos a tempo',
  tRiscoElev: 'Cuidado elevado: as salvaguardas precisam vir antes do uso',
  tRiscoCrit: 'Cuidado crítico: as salvaguardas precisam vir antes de qualquer uso',
  tRisco0: 'As salvaguardas essenciais, antes do uso',
  tPassos: 'Próxima decisão: {0}',
  tPassos0: 'Próximos passos: completar as respostas do caso',
  bSituacao: 'Situação atual', bAfetados: 'Pessoas envolvidas', bBase: 'Linha de base', bAgora: 'Por que agir agora', bAlt: 'Alternativa sem IA',
  afetados: 'Quem é afetado: {0}. Quem usa: {1}.',
  base: '{0}: {1}.',
  agoraPri: 'É prioridade da rede: {0}.',
  agoraRes: 'Resultado esperado: {0}',
  altSim: 'A rede comparou uma alternativa sem IA.',
  altNao: 'A rede ainda não comparou uma alternativa sem IA; compare antes de contratar.',
  altCusto: 'Custo estimado da alternativa: {0} por pessoa por ano.',
  altCusto0: 'O custo da alternativa ainda não foi estimado (pergunta 1.2.9).',
  semResposta: 'Sem resposta.',
  bPortoes: 'O que precisa estar pronto para passar de uma etapa à outra',
  hPortao: 'Portão', hQuando: 'Quando', hPronto: 'Pronto hoje',
  prontos: '{0} de {1} critérios',
  bQuem: 'Quem usa e quem é afetado',
  quem: 'Quem usa: {0} ({1}). Quem recebe o efeito: {2}.',
  quem0: 'Quem usa: {0}. Quem recebe o efeito: {1}.',
  bNumeros: 'Quanto orçar',
  nCentral: 'Custo total, cenário-base',
  bFases: 'Custo por fase',
  bPessoa: 'Custo por pessoa',
  hIndicador: 'Indicador', hValor: 'Valor',
  bFatores: 'Os três fatores que mais pesam',
  bCuidado: 'Nível de cuidado',
  bSalv: 'Salvaguardas essenciais',
  sgDados: 'Dados: {0}', sgSup: 'Supervisão humana: {0}', sgCont: 'Contestação: {0}',
  sgDados0: 'Dados: tratar só os dados necessários, com acordo de tratamento, prazos de guarda e proibição de treinar modelos.',
  sgSup0: 'Supervisão humana: uma pessoa revê as saídas que pesam em decisões, com responsáveis nomeados.',
  sgCont0: 'Contestação: um caminho simples para contestar as saídas que afetam pessoas, com resposta em prazo definido.',
  bProxima: 'A próxima decisão',
  bAnexo: 'No anexo técnico',
  anexo: 'O plano de ação completo, a sequência de decisões, como testar e avaliar, as contas por ano, o que exigir na contratação e as listas do guia estão no anexo técnico para a contratação.',
  semAcoes: 'Ainda não há respostas suficientes para recomendar ações. Responda às perguntas das fases 1 a 4.',
  // quando (marcos)
  qM1: 'Antes de autorizar o teste (Ano 0)', qM2: 'Ao fim do teste, antes de decidir', qM3: 'Antes do edital (Ano 0)',
  qM4: 'Antes de assinar a implantação', qM5: 'Durante a implantação e a expansão',
};
/** Textos novos do policy brief (chaves de tradução para o orquestrador). */
export const TEXTOS_BRIEF = [...new Set(Object.values(TXT_BRIEF))];

/** tr() com {0}, {1}… */
const B = (k, ...v) => String(tr(TXT_BRIEF[k])).replace(/\{(\d+)\}/g, (_, i) => (v[+i] != null ? String(v[+i]) : ''));
const VAZIO = v => v == null || String(v).trim() === '' || String(v).trim() === '—';
const semPonto = s => String(s || '').trim().replace(/[.。;:]+\s*$/, '');
const comPonto = s => { s = String(s || '').trim(); return !s ? '' : /[.!?。！？]$/.test(s) ? s : s + '.'; };
const minusc = s => { s = String(s || ''); return s.length > 1 && /\p{Ll}/u.test(s.charAt(1)) ? s.charAt(0).toLocaleLowerCase() + s.slice(1) : s; };
const cap = s => { s = String(s || ''); return s.charAt(0).toLocaleUpperCase() + s.slice(1); };
const rotOpc = (lista, v) => { const o = ((OPC && OPC[lista]) || []).find(x => String(x[0]) === String(v)); return o ? String(tr(o[1])) : ''; };
const palavras = s => String(s || '').trim().split(/\s+/).filter(Boolean);
/** no máximo n palavras (PB-03); acima disso, corta e fecha com reticências */
export function limitarPalavras(s, n = 35) {
  const L = palavras(s);
  return L.length <= n ? String(s || '').trim() : L.slice(0, n - 1).join(' ').replace(/[,;:]$/, '') + '…';
}
const zero = v => !(Math.abs(+v || 0) >= 0.5);

/**
 * Dados do policy brief, já traduzidos (idioma atual). opts.data: a data impressa (padrão: agora).
 * Nunca lança: com estado sem caso, devolve o brief vazio (vazio: true) com as frases "a definir".
 */
export function briefDados(estado, opts) {
  estado = estadoDoProjeto(estado);
  opts = opts || {};
  estado = estado || {};
  const c = estado.caso || {}, x = estado.ctx || {};
  let secs = [];
  try { secs = estado.caso ? secoesPlano(estado, { figura: false }) : []; } catch (e) { console.warn(e); secs = []; }
  const res = secs.find(s => s.id === 'resumo' && !s.sub) || { kv: [] };
  const SUM = res.sumario || {};
  const REC = SUM.rec || null;
  const KV = {}; (res.kv || []).forEach(([k, v]) => { KV[k] = v; });
  const kv = k => (VAZIO(KV[k]) ? '' : String(tr(KV[k])).trim());
  let d = null;
  if (SUM.numeros) { try { d = relDados(estado); } catch (e) { console.warn(e); d = null; } }
  let lac = { itens: [] };
  try { lac = estado.caso ? lacunasDe(estado) : lac; } catch (e) { console.warn(e); }
  let k = null;
  try { k = estado.caso ? recContexto(estado) : null; } catch (e) { k = null; }

  // pergunta que falta (a primeira da lista de campos que ainda está aberta)
  const lacuna = campos => {
    for (const cp of campos) {
      const l = (lac.itens || []).find(z => z.campo === cp || String(z.href || '').endsWith('/' + cp));
      if (l) return { n: String(l.n), pergunta: String(l.texto), ir: String(l.href || '') };
    }
    return null;
  };
  const frase = (rotulo, texto, faltaCampos, semTexto) => {
    if (texto) return { rotulo, texto: limitarPalavras(texto, 35) };
    const f = lacuna(faltaCampos);
    if (f) return { rotulo, texto: limitarPalavras(B('falta', f.n, f.pergunta), 35), falta: f };
    return { rotulo, texto: semTexto || B('semResposta') };
  };

  // ---------------------------------------------------------------- recomendação
  const V = REC ? REC.veredito : null;
  const recTexto = V ? (V.codigo === 'sem' ? V.texto : [String(tr('Próxima decisão: {0}.')).replace('{0}', V.decisao), V.frase].filter(Boolean).join(' ')) : '';
  const recomendacao = { texto: recTexto || B('semAcoes'), porque: REC ? REC.porque || '' : '', codigo: V ? V.codigo : 'sem' };

  // ---------------------------------------------------------------- etapas do teste (pelos portões da sequência)
  const portoes = REC && REC.sequencia ? REC.sequencia.portoes : [];
  const temG = id => portoes.some(g => g.id === id);
  const testes = [].concat(c.testes || []).filter(Boolean);
  const comTeste = testes.length > 0 || !!c.teste;
  const pocPrimeiro = comTeste && temG('G2'), comPiloto = comTeste && temG('G3');
  const rotTeste = pocPrimeiro && comPiloto ? B('rPocPiloto') : pocPrimeiro ? B('rPoc') : comPiloto ? B('rPiloto') : B('rTeste');

  // ---------------------------------------------------------------- frases do resumo executivo
  const local = nomeContexto(estado).trim();
  const problema = String(x.olhando || '').trim() || kv('Problemas marcados').split('\n')[0] || String(c.problema || '').trim();
  const medida = String(c.linhaBaseMedida || '').trim();
  let tCtx = '';
  if (problema) {
    const p = comPonto(local ? minusc(problema) : problema);
    const comBase = c.linhaBase === 'sim' || c.linhaBase === 'parcial';
    const base = medida ? minusc(semPonto(medida)) : minusc(semPonto(rotOpc('linhaBase', c.linhaBase)));
    tCtx = comBase && base ? B(local ? 'ctx' : 'ctxSemLocal', local, p, base) : B(local ? 'ctxSemBase' : 'ctxSemBaseSemLocal', local, p);
  }
  const fContexto = frase(B('rContexto'), tCtx, local ? ['problemas', 'olhando'] : ['local', 'problemas', 'olhando']);

  const setupPoc = kv('Prova de conceito: participantes e duração'), setupPil = kv('Piloto: escolas, participantes e duração');
  let tTeste = '';
  if (pocPrimeiro || comPiloto) {
    const poc = pocPrimeiro ? (setupPoc ? B('tPoc', setupPoc) : B('tPoc0')) : '';
    const pil = comPiloto ? (poc ? (setupPil ? B('tPilD', setupPil) : B('tPilD0')) : (setupPil ? B('tPil', setupPil) : B('tPil0'))) : '';
    const corpo = poc && pil ? B('tJunta', poc, pil) : poc || pil;
    tTeste = B('tCrit', corpo, B(comPiloto ? 'critPil' : 'critPoc'));
  }
  const fTeste = frase(rotTeste, tTeste, ['testes', 'piloto']);

  const im = c.implantacao || {};
  const implTxt = kv('Primeira etapa da implantação');
  const fasesD = d ? d.fases : [];
  const faseD = id => fasesD.find(f => f.id === id) || null;
  const anoImpl = faseD('implantacao') && faseD('implantacao').anos.length ? faseD('implantacao').anos[0] : null;
  const tImpl = (+im.escolas > 0 || +im.pessoas > 0) && implTxt ? (anoImpl != null ? B('impl', anoImpl, implTxt) : B('impl0', '', implTxt)) : '';
  const fImpl = frase(B('rImpl'), tImpl, ['implantacao']);

  const eleg = +c.elegiveis || 0;
  const expTxt = rotOpc('expansao', c.expansao);
  let anoRede = null, chegaRede = true;
  if (d && eleg > 0) {
    const E = d.E || [], T = d.T || [];
    const mx = Math.max(0, ...T.map(t => +E[t] || 0));
    chegaRede = mx >= 0.95 * eleg;
    const t0 = T.find(t => (+E[t] || 0) >= 0.98 * mx);
    anoRede = chegaRede && t0 != null ? t0 : null;
    if (!chegaRede) anoRede = null;
  }
  let tExp = '';
  if (eleg > 0) {
    const pess = kv('Pessoas que usariam em toda a rede') || String(eleg);
    if (d && !chegaRede) {
      const E = d.E || [], mx = Math.max(0, ...(d.T || []).map(t => +E[t] || 0));
      tExp = B('expNao', d.H, fmtInt(Math.round(mx)), pess);
    } else if (anoRede != null) tExp = expTxt && !(anoImpl != null && anoRede <= anoImpl) ? B('exp', anoRede, pess, minusc(expTxt)) : B('exp0', anoRede, pess);
    else tExp = expTxt ? B('expSemAno', '', pess, minusc(expTxt)) : B('expSemAno', '', pess, '').replace(/\s*\(\)/, '');
  }
  const fExp = frase(B('rExp'), tExp, ['elegiveis', 'expansao']);

  const F = SUM.faixa || null;
  const IND = SUM.indicadores || [];
  const ind = id => IND.find(z => z.id === id) || null;
  const ano0 = ind('ano0');
  const anual = d ? d.anual : null;
  const tCusto = F && ano0 && anual ? B('custo', F.centralTxt, F.loTxt, F.hiTxt, ano0.valor, grande(anual.eco)) : '';
  const fCusto = frase(B('rCusto'), tCusto, ['tipoTec'], B('semCusto'));

  // ---------------------------------------------------------------- três números
  const semValor = fCusto.falta ? B('semValor', fCusto.falta.n) : B('semCusto');
  const numeros = [
    { id: 'total', rotulo: B('nTotal'), valor: F ? F.centralTxt : '—', nota: F ? F.faixaTxt + '.' : semValor },
    { id: 'ano0', rotulo: RR('kAno0'), valor: ano0 ? ano0.valor : '—', nota: ano0 ? ano0.nota || '' : semValor },
    { id: 'regime', rotulo: anual ? RR('kRegime', anual.ano) : String(tr('Custo anual em regime')), valor: anual ? grande(anual.eco) : '—',
      nota: anual ? RR('regimeDesemb', grande(anual.desembolso)) : semValor },
  ];

  // ---------------------------------------------------------------- quatro etapas
  const anosTxt = f => (!f || !f.anos.length ? '—' : f.anos.length === 1 ? RR('icAnos', f.anos[0]) : RR('icAnosAte', f.anos[0], f.anos[f.anos.length - 1]));
  const etapa = (id, nome, f) => ({ id, nome, anos: anosTxt(f), custo: f ? f.total : 0, custoTxt: f && f.anos.length ? grande(f.total) : '—' });
  const etapas = [
    etapa('teste', rotTeste, faseD('piloto')),
    etapa('implantacao', B('rImpl'), faseD('implantacao')),
    etapa('expansao', B('rExp'), faseD('expansao')),
    { id: 'rede', nome: B('rRede'), anos: anual ? B('anosRegime', anual.ano) : '—', custo: anual ? anual.eco : 0, custoTxt: anual ? B('porAno', grande(anual.eco)) : '—' },
  ];

  // ---------------------------------------------------------------- cinco ações
  const codMarco = {};
  (MARCOS_REC || []).forEach(m => { codMarco[String(tr(m[1]))] = m[0]; });
  const acoes = (REC ? REC.cartoes : []).slice(0, 5).map((a, i) => {
    const cod = codMarco[a.marco] || 'M1';
    return { n: a.n || i + 1, id: a.id, oque: a.oque, quem: a.quem, quando: B('q' + cod) };
  });

  // ---------------------------------------------------------------- páginas 2–6
  const paginas = {};
  // 2. O problema
  {
    const bl = [];
    const sit = kv('Situação atual');
    if (sit) bl.push({ tipo: 'texto', titulo: B('bSituacao'), texto: limitarPalavras(sit, 80) });
    const afe = kv('Quem é afetado'), usa = kv('Quem usa');
    if (afe || usa) bl.push({ tipo: 'texto', titulo: B('bAfetados'), texto: B('afetados', afe || '—', usa || '—') });
    const st = rotOpc('linhaBase', c.linhaBase);
    if (st || medida) bl.push({ tipo: 'texto', titulo: B('bBase'), texto: medida ? B('base', semPonto(st), minusc(semPonto(medida))) : comPonto(st) });
    const pri = kv('Prioridades'), resu = String(c.resultado || '').trim();
    const agora = [pri ? B('agoraPri', semPonto(pri)) : '', resu ? B('agoraRes', comPonto(resu)) : ''].filter(Boolean).join(' ');
    if (agora) bl.push({ tipo: 'texto', titulo: B('bAgora'), texto: limitarPalavras(agora, 60) });
    const altC = c.altCustoEfeito && c.altCustoEfeito.custo ? (typeof c.altCustoEfeito.custo === 'object' ? +c.altCustoEfeito.custo.provavel : +c.altCustoEfeito.custo) : 0;
    if (c.alternativa) bl.push({ tipo: 'texto', titulo: B('bAlt'), texto: [c.alternativa === 'sim' ? B('altSim') : B('altNao'), altC > 0 ? B('altCusto', din(altC, 2)) : B('altCusto0')].join(' ') });
    paginas.problema = { secao: B('sProblema'), titulo: problema ? semPonto(problema) : B('tProblema0'), abre: B('aProblema'), blocos: bl };
  }
  // 3. O desenho
  {
    const bl = [{ tipo: 'etapas', titulo: B('etapasT') }];
    if (portoes.length) {
      bl.push({ tipo: 'tabela', titulo: B('bPortoes'), head: [B('hPortao'), B('hQuando'), B('hPronto')],
        rows: portoes.slice(0, 8).map(g => [g.titulo, g.quando, B('prontos', g.criterios.filter(z => z.estado === 'pronto').length, g.criterios.length)]) });
    }
    const usa = kv('Quem usa'), freq = kv('Frequência de uso'), afe = kv('Quem é afetado');
    if (usa || afe) bl.push({ tipo: 'texto', titulo: B('bQuem'), texto: freq ? B('quem', usa || '—', minusc(freq), afe || '—') : B('quem0', usa || '—', afe || '—') });
    paginas.desenho = { secao: B('sDesenho'), titulo: anoRede != null ? B('tDesenho', anoRede) : B('tDesenho0'), abre: B('aDesenho'), blocos: bl };
  }
  // 4. O custo
  {
    const bl = [];
    if (F) {
      bl.push({ tipo: 'numeros', titulo: B('bNumeros'), itens: [
        { rotulo: B('nCentral'), valor: F.centralTxt, nota: F.faixaTxt },
        { rotulo: RR('simP50'), valor: F.p50Txt },
        { rotulo: RR('simP90'), valor: F.p90Txt },
      ] });
      const fs = fasesD.filter(f => !zero(f.total));
      const mx = Math.max(1e-9, ...fs.map(f => Math.abs(f.total)));
      const nomeF = { piloto: rotTeste, implantacao: B('rImpl'), expansao: B('rExp') };
      if (fs.length) bl.push({ tipo: 'barras', titulo: B('bFases'), itens: fs.map(f => ({ rotulo: nomeF[f.id] || f.id, sub: anosTxt(f), valor: f.total, txt: grande(f.total), w: Math.max(0, f.total) / mx })) });
      const rows = IND.filter(z => z.id !== 'ano0' && !zero(z.bruto) && !VAZIO(z.valor)).slice(0, 8).map(z => [z.rotulo, z.valor]);
      if (rows.length) bl.push({ tipo: 'tabela', titulo: B('bPessoa'), head: [B('hIndicador'), B('hValor')], rows, num: [1] });
      const D = (SUM.drivers || []).slice(0, 3);
      if (D.length) bl.push({ tipo: 'lista', titulo: B('bFatores'), itens: D.map(z => z.nome + ': ' + z.txt + '.') });
    } else bl.push({ tipo: 'texto', titulo: B('bNumeros'), texto: fCusto.texto });
    const pRec = d && d.tco ? pct(d.tco.pRecorrente) : '';
    paginas.custo = { secao: B('sCusto'), titulo: F && pRec ? B('tCusto', F.centralTxt, pRec) : B('tCusto0'), abre: B('aCusto'), blocos: bl };
  }
  // 5. Riscos e salvaguardas
  {
    const bl = [];
    if (REC && REC.cuidado && REC.cuidado.length) bl.push({ tipo: 'texto', titulo: B('bCuidado'), texto: REC.cuidado.join(' ') });
    const itens = REC && REC.plano ? REC.plano.grupos.flatMap(g => g.marcos.flatMap(m => m.itens)) : [];
    const acao = ids => { for (const id of ids) { const it = itens.find(z => z.id === id); if (it) return it; } return null; };
    const aD = acao(['R-26', 'R-27', 'R-28']), aS = acao(['R-31', 'R-30']), aC = acao(['R-32']);
    bl.push({ tipo: 'lista', titulo: B('bSalv'), itens: [
      aD ? B('sgDados', aD.oque + ' (' + aD.id + ')') : B('sgDados0'),
      aS ? B('sgSup', aS.oque + ' (' + aS.id + ')') : B('sgSup0'),
      aC ? B('sgCont', aC.oque + ' (' + aC.id + ')') : B('sgCont0'),
    ] });
    const nv = k && k.nivel;
    const tit = nv === 'limitado' ? B('tRiscoLim') : nv === 'moderado' ? B('tRiscoMod') : nv === 'elevado' ? B('tRiscoElev') : nv === 'critico' ? B('tRiscoCrit') : B('tRisco0');
    paginas.riscos = { secao: B('sRiscos'), titulo: tit, abre: B('aRiscos'), blocos: bl };
  }
  // 6. Próximos passos
  {
    const bl = [];
    if (acoes.length) bl.push({ tipo: 'tabela', titulo: B('acoesT'), head: [B('cN'), B('cOque'), B('cQuem'), B('cQuando')], rows: acoes.map(a => [String(a.n), a.oque, a.quem, a.quando]) });
    else bl.push({ tipo: 'texto', titulo: B('acoesT'), texto: REC && REC.vazioInfo ? REC.vazioInfo.texto + '. ' + REC.vazioInfo.explicacao : B('semAcoes') });
    bl.push({ tipo: 'texto', titulo: B('bProxima'), texto: [recomendacao.texto, recomendacao.porque].filter(Boolean).join(' ') });
    bl.push({ tipo: 'texto', titulo: B('bAnexo'), texto: B('anexo') });
    const dec = V && V.codigo !== 'sem' && V.decisao ? V.decisao : '';
    paginas.passos = { secao: B('sPassos'), titulo: dec ? B('tPassos', dec) : B('tPassos0'), abre: B('aPassos'), blocos: bl };
  }

  const agora = opts.data instanceof Date ? opts.data : new Date();
  return {
    vazio: !REC || (REC.veredito.codigo === 'sem' && !F),
    titulo: String(c.titulo || '').trim() || problema || B('casoSemTitulo'),
    subtitulo: local,
    data: agora.toLocaleDateString(LOC(), { year: 'numeric', month: 'long', day: 'numeric' }),
    selo: B('selo'),
    recomendacao,
    frases: { contexto: fContexto, teste: fTeste, implantacao: fImpl, expansao: fExp, custo: fCusto },
    numeros, etapas, paginas, acoes,
    rotulos: {
      tipoDoc: B('tipoDoc'), resumoExec: B('resumoExec'), recomendacao: B('recRot'), etapas: B('etapasT'), numeros: B('numerosT'),
      acoes: B('acoesT'), oque: B('cOque'), quem: B('cQuem'), quando: B('cQuando'), n: B('cN'), anexo: B('anexoBotao'), isencao: B('isencao'),
    },
  };
}
