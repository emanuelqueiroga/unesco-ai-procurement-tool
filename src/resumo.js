// =====================================================================
// Plano de contratação: página final e PDF, gerados por um único botão.
// Estrutura: respostas que faltam, resumo do caso, recomendações para você
// (v10, recomendacoes.js), bloco A (custo e compra), bloco B (política e governança) e referências.
// v11: sem fonte de recursos (a antiga A7 saiu; o dossiê passou a A7); resumo com ferramentas, internet,
// dispositivos, formação, suporte, acompanhamento, prova de conceito e piloto, implantação e expansão;
// Figura 1 de Krueger e Jackson (2026, p. 11) em A3 (página) e numa página própria do PDF.
// Conteúdo de contratação tirado do guia (caps. 11–16; Instrumento F) e do
// quadro de custo total em camadas de Krueger e Jackson (2026, p. 11).
// Textos fixos e recomendações: src/plano_dados.js.
// v13 (pacote B3): perfil com prioridades, problemas, subcategorias, objetivos (aviso de lacunas), linha de base com
// problemas e medida, governança com "Qual?" e "O que falta?"; seção "matriz" (camadas × fases, src/matriz.js) logo
// depois de "Em resumo" na página, no Markdown/HTML e no PDF.
// =====================================================================
const NOME_FERRAMENTA = 'AI in Education Procurement Tool';

// Arranjos de aquisição (guia, cap. 14, tabela "Arranjos de aquisição")
const ARRANJOS = [
  ['interno', 'Desenvolver internamente', 'A função é estratégica e específica; há equipe para manter; controle de arquitetura e dados é requisito central.', 'Sustentabilidade: manter, documentar, atualizar e operar no horizonte; dependência de poucas pessoas.', 'Produto, engenharia, arquitetura, segurança, operação.'],
  ['contratar', 'Contratar desenvolvimento', 'Necessidade específica sem capacidade interna para construir.', 'Propriedade dos ativos; quem mantém após a entrega; quem decide a arquitetura; transferência de conhecimento.', 'Gestão de produto, arquitetura, fiscalização.'],
  ['saas', 'SaaS', 'Necessidade padronizada; mercado maduro; prioridade de velocidade; atualização contínua desejável.', 'Customização limitada; mudanças do fornecedor podem invalidar testes; saída complexa se virar componente crítico.', 'Gestão de fornecedor, dados, configuração, monitoramento, saída.'],
  ['api', 'API de modelo ou serviço', 'Separar modelo e aplicação traz flexibilidade útil.', 'A integração e a governança passam para a instituição ou o integrador; consumo variável; versões e preços mudam.', 'Integração, segurança, controle de consumo, testes.'],
  ['parceria', 'Parceria', 'Solução inexistente no mercado; pesquisa; desenvolvimento conjunto.', 'O que cada parte contribui, leva e mantém ao final; propriedade intelectual; continuidade.', 'Governança, coordenação, propriedade de ativos.'],
  ['compartilhada', 'Solução compartilhada', 'Várias instituições com necessidades semelhantes; organizações pequenas.', 'Quem prioriza mudanças, financia a expansão, aceita riscos e arbitra divergências.', 'Governança interinstitucional, financiamento.'],
  ['modular', 'Contratação modular ou por lotes', 'Fronteiras técnicas naturais e mercado real por componente.', 'Quem integra; responsabilidade por falhas entre componentes; esforço de gerir vários contratos.', 'Integração, gestão de múltiplos fornecedores.'],
];
const NOTA_ARQ = {
  saas: 'SaaS introduz subprocessadores e concentra infraestrutura e manutenção na licença. Mudanças do fornecedor podem invalidar testes, e a saída fica complexa se a solução virar componente crítico.',
  api: 'Consumir um modelo por API reduz a quantidade de produto adquirido, mas aumenta a quantidade de solução que a instituição precisa integrar e governar. A API expõe a mudanças de versão e de preço e aumenta a variabilidade do custo.',
  ow: 'Código aberto e pesos abertos são características, e não estratégias: podem ser operados pela instituição, por uma empresa contratada ou estar embutidos em um produto comercial. Se toda a operação for contratada com um único integrador, o lock-in apenas muda de lugar.',
};
// Instrumentos de aprendizagem (guia, cap. 14)
const APRENDIZAGEM = [
  ['Prova de conceito', 'A ideia ou o componente é tecnicamente viável nas condições básicas?', 'Escopo mínimo, hipótese clara, critério de encerramento; sem usuários reais nem integrações que criem dependência.'],
  ['Ambiente controlado (sandbox)', 'Que comportamento e que riscos aparecem sem expor o processo real?', 'Dados sintéticos ou selecionados, ações restritas; validade externa limitada, que deve ser registrada.'],
  ['Piloto', 'O caso de uso funciona em condições próximas das reais?', 'População e período delimitados, desenho de avaliação, possibilidade real de não continuar.'],
];
// Grupos do Instrumento F por bloco do plano
const GRUPOS_COMPRA = ['Escopo', 'Desempenho', 'Mudança', 'Direitos', 'Custo', 'Saída', 'Gestão'];
const GRUPOS_DADOS = ['Dados', 'Verificação'];
const TAG_CONTRATO = { alto: 'risco elevado', pessoas: 'afeta pessoas', consumo: 'cobrança por consumo' };
const ROT_ALERTA = { bloqueio: 'Resolver antes de contratar', atencao: 'Tratar no plano', info: 'Nota' };
const PRESET_ARQ = { saas: 'Exemplo A do guia (cap. 12): produto pronto por licença', api: 'Exemplo B do guia (cap. 12): aplicação com modelo por API e base de conhecimento', ow: 'Exemplo C do guia (cap. 12): modelo de pesos abertos em infraestrutura contratada' };

// v12: áreas do perfil do caso (cartões da página; rótulos = as chaves PT de linhasResumo) e camada de cada área
const AREAS_PERFIL = [
  ['contexto', 'Contexto', '', ['Nível administrativo', 'Lugar ou rede', 'Situação']],
  // v13: "Problema e impacto" passou a "Prioridade e impacto" (RQ-04), com prioridades, problemas e subcategorias
  ['problema', 'Prioridade e impacto', '', ['Prioridades', 'Problemas marcados', 'Outro problema', 'Como a equipe descreve o problema', 'Situação atual', 'Impacto desejado', 'Resultado esperado e como medir', 'Linha de base', 'Alternativa sem IA comparada']],
  // v13: governança (1.3.x) com o detalhe "Qual?" e "O que falta?" (RQ-11)
  ['governanca', 'Governança de IA na educação', '1', ['Equipe ou instância responsável', 'Política ou estratégia de IA na educação', 'Regulamentação identificada', 'Política de dados educacionais', 'Orientações de uso responsável', 'Regras para a contratação de IA']],
  ['aplicacoes', 'Aplicações e experiência de uso', '2', ['Aplicações', 'Quem usa', 'Quem é afetado', 'O que se faz com a resposta', 'Frequência de uso']],
  ['adocao', 'Adoção e ferramentas', '2 4', ['Quantas ferramentas', 'Ferramentas já escolhidas', 'Tipo de tecnologia (ferramenta principal)', 'Pagamento (ferramenta principal)', 'Licença', 'Adaptação ao contexto', 'Arquitetura considerada']],
  ['infra', 'Infraestrutura e dispositivos', '3', ['Internet adequada nas escolas', 'Modelo de uso dos dispositivos', 'Os dispositivos já existem']],
  ['formacao', 'Formação', '6', ['Quem será formado', 'Tipo de formação', 'Formato da formação', 'Horas de formação por pessoa', 'Quem paga a formação']],
  ['operacao', 'Operação e suporte', '7', ['Quem dá suporte aos usuários', 'Nível de suporte', 'Nível de acompanhamento do uso']],
  ['implantacao', 'Implantação e expansão', '', ['Prova de conceito ou piloto', 'Prova de conceito: participantes e duração', 'Piloto: escolas, participantes e duração', 'Primeira etapa da implantação', 'Pessoas que usariam em toda a rede', 'Tempo para chegar a todos depois da implantação', 'Horizonte da estimativa']],
];
// Cores das camadas (Figura 1 de Krueger e Jackson, 2026, p. 11), na ordem 1–7; usadas na página e no PDF
const COR_CAMADA = ['#0C1D53', '#0666B3', '#096C72', '#547D1D', '#5E3C86', '#D9741A', '#1B2A55'];

// ----------------------------------------------------------- v13: prioridades, problemas, detalhes e matriz do caso
// Estado do passo 1.2 (S.ctx.prioridades, problemas, subs, problemaOutro), detalhe da linha de base (S.caso.linhaBase*)
// e das 1.3.x (S.respDet[id].qual|falta). Leitura defensiva: casos antigos não têm esses campos.
const ROT_GOV = { 'g-comite': 'Equipe ou instância responsável', 'g-politica': 'Política ou estratégia de IA na educação', 'g-legislacao': 'Regulamentação identificada',
  'g-dados': 'Política de dados educacionais', 'g-etica': 'Orientações de uso responsável', 'g-compras': 'Regras para a contratação de IA' };
const AVISO_LACUNA_P = 'Há lacunas (__) a completar com os dados da rede.';
const ROT_ESTADO = { ok: 'Respondido', andamento: 'Em andamento', pendente: 'Pendente', orientacao: 'Orientação', na: 'Não se aplica' };
const TXT_MATRIZ = {
  intro: 'O que cada camada do custo total exige em cada fase, com o estado das respostas deste caso e, quando a estimativa está completa, o custo de cada célula.',
  perguntas: 'Perguntas', soma: 'Soma das células de custo (igual ao custo total do ciclo):',
  semCusto: 'Sem custo por célula: a estimativa ainda depende de respostas pendentes (passo 4.2).',
  legenda: 'Estado das respostas', camada: 'Camada',
};
const semPontoP = s => String(s || '').trim().replace(/\.$/, '');
function prioridadesCaso(x) {
  const ids = (x || {}).prioridades || [];
  return typeof PRIORIDADES === 'undefined' ? [] : PRIORIDADES.filter(p => ids.includes(p.id));
}
function problemasCaso(x) { return typeof problemasMarcados === 'function' ? problemasMarcados(x || {}) : []; }
// "Problema (subcategoria; subcategoria)." por problema marcado, já traduzido
function problemasCasoTxt(x) {
  const subs = new Set((x || {}).subs || []);
  return problemasCaso(x).map(q => {
    const ss = (q.sub || []).filter(([id]) => subs.has(id)).map(([, t]) => tr(t));
    return semPontoP(tr(q.t)) + (ss.length ? ' (' + ss.join('; ') + ')' : '') + '.';
  });
}
function detalheGov(id) {
  const d = ((typeof S !== 'undefined' && S.respDet) || {})[id] || {};
  return { qual: String(d.qual || '').trim(), falta: String(d.falta || '').trim() };
}
// Resposta de uma 1.3.x com o detalhe ("Qual?" com Sim ou Em parte; "O que falta?" com Em parte), em linhas
function govValorP(id) {
  const v = (S.resp || {})[id];
  if (!v) return '—';
  const d = detalheGov(id), L = [tr(RESP_G_NOME[v] || v)];
  if (['sim', 'parcial'].includes(v) && d.qual) L.push(tr('Qual:') + ' ' + d.qual);
  if (v === 'parcial' && d.falta) L.push(tr('O que falta:') + ' ' + d.falta);
  return L.join('\n');
}
// Linha de base (1.2.7) com os problemas e a medida informados
function linhaBaseP(c, x) {
  const r = respP('linhaBase', tr(rotP(OPC.linhaBase, c.linhaBase)) || '—');
  if (r === '—' || !['sim', 'parcial'].includes(c.linhaBase)) return r;
  const ids = c.linhaBaseProblemas || [];
  const ps = problemasCaso(x).filter(q => ids.includes(q.id)).map(q => semPontoP(tr(q.t)));
  const para = ps.length ? ps.join('; ') : String(c.linhaBaseProblemaTxt || '').trim();
  const med = String(c.linhaBaseMedida || '').trim();
  return [r, para ? tr('Para quais problemas:') + ' ' + para : '', tr('Medida:') + ' ' + (med || tr('não informada'))].filter(Boolean).join('\n');
}
// Matriz do caso (RQ-03, RQ-20): camadas × fases com texto, perguntas, estado e custo; soma das células = total do ciclo
function secaoMatriz() {
  if (typeof matrizCaso !== 'function' || typeof FASES_MATRIZ === 'undefined') return null;
  let M = null;
  try { M = matrizCaso(); } catch (e) { console.warn(e); return null; }
  const fases = FASES_MATRIZ.map((f, i) => { const z = (typeof FASES !== 'undefined' ? FASES : []).find(y => y.id === f) || {}; return { id: f, n: z.n || i + 1, nome: z.nome || f }; });
  const linhas = [1, 2, 3, 4, 5, 6, 7].map(k => ({ n: k, nome: nomeCamada(k), cel: fases.map(f => Object.assign({ fase: f.id }, M.celulas[k][f.id])) }));
  const somas = fases.map(f => M.custo && f.id !== 'contexto' ? linhas.reduce((s, l) => s + (+l.cel.find(c => c.fase === f.id).custo || 0), 0) : null);
  const total = M.custo ? somas.reduce((s, v) => s + (v || 0), 0) : null;
  const celTxt = c => {
    if (c.na) return tr(c.t);
    const extra = [c.n.length ? tr(TXT_MATRIZ.perguntas) + ' ' + c.n.join(', ') : '', tr(ROT_ESTADO[c.estado] || c.estado), c.custo != null ? grande(c.custo) : ''].filter(Boolean);
    return tr(c.t) + ' (' + extra.join(' · ') + ')';
  };
  const rows = linhas.map(l => [rotuloCamada(l.n)].concat(l.cel.map(celTxt)));
  if (M.custo) rows.push([tr('Total')].concat(somas.map(v => v == null ? '—' : grande(v))));
  const pos = (M.custo ? [NOTA_MATRIZ_CUSTO, tr(TXT_MATRIZ.soma) + ' ' + grande(total) + '.'] : [TXT_MATRIZ.semCusto]).concat([CREDITO_MATRIZ]);
  return { id: 'matriz', h: TIT_MATRIZ, p: [TXT_MATRIZ.intro], intro: TXT_MATRIZ.intro,
    table: { head: [TXT_MATRIZ.camada].concat(fases.map(f => f.n + '. ' + tr(f.nome))), rows, b0: true },
    pos, mx: { fases, linhas, custo: !!M.custo, somas, total } };
}

// ----------------------------------------------------------- utilitários
const rotP = (lista, v) => ((lista || []).find(o => String(o[0]) === String(v)) || ['', ''])[1];
const nomesP = (lista, vals) => (vals || []).map(v => tr(rotP(lista, v) || v)).filter(Boolean).join('; ');
const capP = s => { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };
const numP = (x, d = 1) => (+x || 0).toLocaleString(LOC(), { maximumFractionDigits: Math.abs(+x || 0) < 1 && d > 0 ? 2 : d, minimumFractionDigits: 0 });
function respP(campo, v) { try { return respondido(campo) ? v : '—'; } catch (e) { return v; } }
function slugPlano() {
  const b = String(S.caso.titulo || (S.ctx || {}).olhando || 'case').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
  return b || 'case';
}
// 2.0 (v11, múltipla): 'poc' | 'piloto' | 'ambos' | 'recomendar' | ''
function testeEscolhido(c) { return typeof recTesteDe === 'function' ? recTesteDe(c) : (c.teste || ''); }
// teste que vem primeiro: com os dois marcados, a prova de conceito
function testeEfetivo(c, rec) { const t = testeEscolhido(c); const m = rec && rec.modo; return t === 'ambos' ? 'poc' : ['poc', 'piloto'].includes(t) ? t : m === 'ambos' ? 'poc' : m || 'piloto'; }
// rótulos das opções de um campo (OPC pelo nome do campo, v11)
const opcDe = id => (typeof OPC !== 'undefined' && (OPC[id] || (id === 'testes' ? OPC.teste : null))) || [];
const rotC = (id, v) => tr(rotP(opcDe(id), v)) || '';
const nomesC = (id, vals) => nomesP(opcDe(id), vals);
const plural = (n, um, varios) => tr((+n === 1 ? um : varios).replace('{0}', fmtInt(n)));
const tarefaNome = (c, k) => k === 'outra' && c.tarefaOutra ? c.tarefaOutra : tr(rotP(OPC.tarefas, k));
function ferramentasCaso(c) { return typeof recFerramentas === 'function' ? recFerramentas(c) : (c.ferramentas || []).filter(f => f && f.nome); }
// setup da prova de conceito e do piloto em texto ("20 escolas, 600 participantes, 4 meses")
function setupTxt(x, comEscolas) {
  x = x || {};
  const p = [];
  if (comEscolas && +x.escolas > 0) p.push(plural(x.escolas, '{0} escola', '{0} escolas'));
  if (+x.participantes > 0) p.push(plural(x.participantes, '{0} participante', '{0} participantes'));
  if (+x.meses > 0) p.push(plural(x.meses, '{0} mês', '{0} meses'));
  return p.join(', ') || '—';
}
function implantacaoTxt(c) {
  const im = c.implantacao || {};
  const p = [];
  if (+im.escolas > 0) p.push(plural(im.escolas, '{0} escola', '{0} escolas'));
  if (+im.pessoas > 0) p.push(plural(im.pessoas, '{0} pessoa', '{0} pessoas'));
  return p.join(', ');
}
function arranjosCaso(ce) {
  const s = [];
  if (ce.tipoTec === 'publica') s.push('compartilhada');
  ({ saas: ['saas'], api: ['api', 'contratar'], ow: ['interno', 'contratar'] }[ce.arquitetura] || []).forEach(k => s.push(k));
  if (ce.adaptacao === 'sob_medida') s.push('contratar');
  return [...new Set(s)].map(k => ARRANJOS.find(a => a[0] === k)).filter(Boolean);
}
function recsDe(grupo, d) {
  return RECS.filter(r => r.grupo === grupo && (!r.quando || r.quando(d.ce, d.p)) && (grupo !== 'local' || !d.poc || r.poc));
}
const textoRec = (r, d) => (d.poc && r.textoPoc) || r.texto;
function camadaDeS(s) { return (typeof CAMADA_DE_S !== 'undefined' ? CAMADA_DE_S : CAMADA_DE_S_PLANO)[s] || 7; }
function nomeCamada(n) {
  const L = typeof CAMADAS !== 'undefined' ? CAMADAS : [];
  const x = L.find(z => (Array.isArray(z) ? z[0] : z.n) === n);
  return x ? (Array.isArray(x) ? x[1] : x.nome) : '';
}
const rotuloCamada = n => n + '. ' + tr(nomeCamada(n));
function govQuestoes() {
  try { const q = questoesGov(); if (q && q.length) return q; } catch (e) { }
  return Object.keys(ACOES_G).map((id, i) => ({ id, n: '1.3.' + (i + 1), t: id }));
}

// Tudo o que o plano precisa, calculado uma vez
function dadosPlano() {
  const c = S.caso, x = S.ctx || {}, t = totaisCtx();
  const ce = casoAtual(), p = perfil();
  let rec = { modo: 'piloto', motivos: [] };
  try { rec = recomendarTeste(ce) || rec; } catch (e) { console.warn(e); }
  let custo = null;
  try { custo = numerosCusto(); if (custo && !custo.camadas) custo.camadas = somaPorCamada(custo.av); } catch (e) { console.warn(e); }
  const arq = ['saas', 'api', 'ow'].includes(ce.arquitetura) ? ce.arquitetura : 'saas';
  const modo = testeEfetivo(c, rec), teste = testeEscolhido(c);
  let faltas = [];
  try { faltas = faltasTodas() || []; } catch (e) { console.warn(e); }
  return { c, x, t, ce, p, rec, custo, arq, modo, teste, poc: modo === 'poc' && teste !== 'ambos' && !(['recomendar', ''].includes(teste) && rec.modo === 'ambos'),
    ambos: teste === 'ambos' || (['recomendar', ''].includes(teste) && rec.modo === 'ambos'), faltas,
    afeta: recAfeta(ce), dp: recDadosPessoais(ce), gratis: recGratuito(ce) };
}

// ----------------------------------------------------------- seções (PDF, Markdown, HTML e página)
// Cada item: { tipo: 'faltas' | 'bloco', id, h, sub, kv, kpis, p, list, table, pos, det, soPagina, irs }
// table: { head, rows, num, grupo, b0, hl, marca, larg, negrito (linhas em negrito na coluna 2, PDF) }
function secoesPlano() {
  const d = dadosPlano();
  const { c, x, t, ce, p, rec, custo, arq } = d;
  const S_ = [];
  const sec = o => { S_.push(o); return o; };
  const tituloSec = id => id + '. ' + tr(TIT_PLANO[id]);

  // Respostas que faltam
  if (d.faltas.length) {
    sec({ tipo: 'faltas', id: 'faltas', h: TIT_PLANO.faltas,
      p: [d.faltas.length === 1 ? 'Plano parcial: 1 pergunta sem resposta.' : tr('Plano parcial: ' + d.faltas.length + ' perguntas sem resposta.'), 'O plano já pode ser usado; as seções que dependem dessas respostas usam premissas e dizem isso.'],
      list: d.faltas.map(f => (f.n ? f.n + ' ' : '') + tr(f.texto)), irs: d.faltas.map(f => f.ir || '') });
  }

  // 0. Resumo do caso
  const etapas = (typeof etapasAtivas === 'function' ? etapasAtivas() : []);
  const linhasEt = etapas.map(e => {
    const et = (x.etapas || {})[e[0]] || {};
    const anos = (e[3] || []).length && !et.soTotal ? e[3].map((a, i) => tr(a) + ': ' + fmtInt((et.anos || [])[i] || 0)).join('; ') : '—';
    return [tr(e[1]), et.escolas ? fmtInt(et.escolas) : '—', anos, fmtInt(alunosEtapa(e[0]))];
  });
  if (linhasEt.length > 1) linhasEt.push([tr('Total'), fmtInt(t.escolas), '', fmtInt(t.alunos)]);
  const nivel = x.nivel === 'outro' ? (x.nivelOutro || tr('Outro')) : tr(rotP(typeof NIVEIS_ADM !== 'undefined' ? NIVEIS_ADM : [], x.nivel));
  const tarefas = (c.tarefas || []).map(k => k === 'outra' && c.tarefaOutra ? c.tarefaOutra : tr(rotP(OPC.tarefas, k))).filter(Boolean).join('; ');
  const impactos = (c.impactos || []).map(k => k === 'outro' && c.impactoOutro ? c.impactoOutro : tr(rotP(OPC.impactos, k))).filter(Boolean).join('; ');
  const pl = c.piloto || {}, pc = c.poc || {};
  const arqTxt = tr(rotP(OPC.arquitetura, arq)) + (ce.__arqPresumida ? ' (' + tr('deduzida das respostas') + ')' : '');
  const testes = typeof recTestes === 'function' ? recTestes(c) : (c.teste ? [c.teste] : []);
  // setup: PoC e piloto com campos próprios quando os dois forem marcados; com "recomende", o setup preenchido
  // com "recomende para mim", só os setups preenchidos
  const recomendar = ['recomendar', ''].includes(d.teste);
  const temPoc = d.teste === 'poc' || d.teste === 'ambos' || (recomendar && setupTxt(pc) !== '—');
  const temPil = d.teste === 'piloto' || d.teste === 'ambos' || (recomendar && setupTxt(pl, true) !== '—');
  const pocDados = setupTxt(pc) !== '—' ? pc : (d.teste === 'poc' ? pl : pc);   // compatibilidade: PoC salva em "piloto" (v10)
  const ferr = ferramentasCaso(c);
  const escI = +c.escolasInternet || 0;
  const horas = +c.formacaoHoras || 0;
  const linhasResumo = [
    ['Nível administrativo', nivel || '—'],
    ['Lugar ou rede', x.local || '—'],
    ['Situação', respP('situacao', tr(rotP(OPC.situacao, c.situacao)) || '—')],
    // v13: prioridades, problemas marcados (com subcategorias) e "Outro problema" (passo 1.2)
    ['Prioridades', prioridadesCaso(x).map(z => tr(z.nome)).join('; ') || '—'],
    ['Problemas marcados', problemasCasoTxt(x).join('\n') || '—'],
  ];
  if (String(x.problemaOutro || '').trim()) linhasResumo.push(['Outro problema', String(x.problemaOutro).trim()]);
  linhasResumo.push(
    ['Como a equipe descreve o problema', x.olhando || '—'],
    ['Situação atual', c.problema || '—'],
    ['Impacto desejado', impactos || '—'],
    // objetivos sugeridos pelos problemas podem ter lacunas "__": aviso discreto
    ['Resultado esperado e como medir', c.resultado ? c.resultado + (typeof temLacuna === 'function' && temLacuna(c.resultado) ? '\n(' + tr(AVISO_LACUNA_P) + ')' : '') : '—'],
    ['Linha de base', linhaBaseP(c, x)],
    ['Alternativa sem IA comparada', tr(rotP(OPC.simNao, c.alternativa)) || '—'],
  );
  govQuestoes().forEach(q => { if (ROT_GOV[q.id]) linhasResumo.push([ROT_GOV[q.id], govValorP(q.id)]); });
  linhasResumo.push(
    ['Aplicações', tarefas || '—'],
    ['Quem usa', nomesP(OPC.usuarios, c.usuarios) || '—'],
    ['Quem é afetado', nomesP(OPC.afetados, c.afetados) || '—'],
    ['O que se faz com a resposta', respP('consequencias', nomesP(OPC.consequencias, c.consequencias) || '—')],
    ['Frequência de uso', respP('frequencia', tr(rotP(OPC.frequencia, c.frequencia)) || '—')],
    ['Prova de conceito ou piloto', nomesC('testes', testes) || '—'],
  );
  if (temPoc) linhasResumo.push(['Prova de conceito: participantes e duração', setupTxt(pocDados)]);
  if (temPil) linhasResumo.push(['Piloto: escolas, participantes e duração', setupTxt(pl, true)]);
  linhasResumo.push(
    ['Quantas ferramentas', rotC('nFerramentas', c.nFerramentas) || '—'],
    ['Ferramentas já escolhidas', ferr.length ? ferr.map(f => f.nome).join('; ') : (rotC('conheceFerramentas', c.conheceFerramentas) || '—')],
    ['Tipo de tecnologia (ferramenta principal)', tr(rotP(OPC.tipoTec, c.tipoTec)) || '—'],
    ['Pagamento (ferramenta principal)', tr(rotP(OPC.pagamento, c.pagamento)) || '—'],
    ['Licença', tr(rotP(OPC.licenca, c.licenca)) || '—'],
    ['Adaptação ao contexto', tr(rotP(OPC.adaptacao, c.adaptacao)) || '—'],
    ['Internet adequada nas escolas', (rotC('internet', c.internet) || '—') + (c.internet === 'parcial' && escI > 0 ? ' (' + plural(escI, '{0} escola com internet adequada', '{0} escolas com internet adequada') + ')' : '')],
    ['Modelo de uso dos dispositivos', rotC('modeloDisp', c.modeloDisp) || '—'],
    ['Os dispositivos já existem', rotC('dispExistem', c.dispExistem) || '—'],
    ['Quem será formado', nomesC('formados', c.formados) || '—'],
    ['Tipo de formação', nomesC('formacaoTipo', c.formacaoTipo) || '—'],
    ['Formato da formação', rotC('formacaoFormato', c.formacaoFormato) || '—'],
    ['Horas de formação por pessoa', horas ? plural(horas, '{0} hora', '{0} horas') + (c.formacaoEstimativa ? ' (' + tr('estimativa ilustrativa') + ')' : '') : '—'],
    ['Quem paga a formação', rotC('formacaoPaga', c.formacaoPaga) || '—'],
    ['Quem dá suporte aos usuários', rotC('suporteQuem', c.suporteQuem) || '—'],
    ['Nível de suporte', rotC('suporteNivel', c.suporteNivel) || '—'],
    ['Nível de acompanhamento do uso', rotC('acompanhamento', c.acompanhamento) || '—'],
    ['Primeira etapa da implantação', implantacaoTxt(c) || '—'],
    ['Arquitetura considerada', arqTxt],
    ['Pessoas que usariam em toda a rede', +c.elegiveis > 0 ? fmtInt(c.elegiveis) : '—'],
    ['Tempo para chegar a todos depois da implantação', respP('expansao', rotC('expansao', c.expansao) || '—')],
    ['Horizonte da estimativa', respP('horizonte', tr(rotP(OPC.horizonte, c.horizonte)) || '—')],
  );
  // ferramentas (2.3.3): a primeira da lista é a principal
  let tabFerr = null, tabEt = null;
  if (ferr.length) {
    const preco = f => f.pagamento === 'consumo' ? '—' : +f.preco > 0 ? din(+f.preco, 2) : (typeof recPagaFerr === 'function' && recPagaFerr(f) ? tr('sem preço informado') : '—');
    tabFerr = { head: ['Ferramenta', 'Tarefas', 'Tipo de tecnologia', 'Pagamento', 'Preço por usuário por mês'],
      rows: ferr.map((f, i) => [f.nome + (i === 0 ? ' (' + tr('principal') + ')' : ''), (f.tarefas || []).map(k => tarefaNome(c, k)).filter(Boolean).join('; ') || '—',
        tr(rotP(OPC.tipoTec, f.tipoTec)) || '—', tr(rotP(OPC.pagamento, f.pagamento)) || '—', preco(f)]), b0: true, num: [4] };
  }
  if (linhasEt.length) tabEt = { head: ['Etapa de ensino', 'Escolas', 'Estudantes por ano ou série', 'Estudantes'], rows: linhasEt, num: [1, 3] };
  // v12: os mesmos pares agrupados por área (cartões do perfil do caso na página; o PDF pode usar perfilCasoCartoes())
  // e os fatos do caso (fichas do "Em resumo"). kv continua igual para o Markdown, o HTML e o PDF.
  const cartoes = AREAS_PERFIL.map(([id, h, camada, rotulos]) => {
    const kv = linhasResumo.filter(([k]) => rotulos.includes(k));
    const table = id === 'contexto' ? tabEt : id === 'adocao' ? tabFerr : null;
    return { id, h, camada, kv, table, hTable: table ? (id === 'contexto' ? 'Etapas, escolas e estudantes' : 'Ferramentas') : '' };
  }).filter(z => z.kv.length || z.table);
  const nomesEt = etapas.map(e => tr(e[1])).join('; ');
  const testeTxt = nomesC('testes', testes);
  const setupT = temPil ? setupTxt(pl, true) : temPoc ? setupTxt(pocDados) : '—';
  const fatos = [
    ['Etapas e estudantes', [nomesEt, t.alunos ? plural(t.alunos, '{0} estudante', '{0} estudantes') : ''].filter(Boolean).join(' · ')],
    ['Aplicações', tarefas],
    ['Quem usa', nomesP(OPC.usuarios, c.usuarios)],
    ['Tecnologia e pagamento', [tr(rotP(OPC.tipoTec, c.tipoTec)), tr(rotP(OPC.pagamento, c.pagamento))].filter(Boolean).join(' · ')],
    ['Teste', [testeTxt, setupT !== '—' ? setupT : ''].filter(Boolean).join(' · ')],
    ['Escala', [+c.elegiveis > 0 ? plural(c.elegiveis, '{0} pessoa', '{0} pessoas') : '', respP('expansao', rotC('expansao', c.expansao) || '')].filter(z => z && z !== '—').join(' · ')],
  ].filter(([, v]) => v);
  sec({ id: 'resumo', h: TIT_PLANO.resumo, kv: linhasResumo, cartoes, fatos });
  if (tabFerr) sec({ sub: true, h: 'Ferramentas', table: tabFerr });
  if (tabEt) sec({ sub: true, h: 'Etapas, escolas e estudantes', table: tabEt });

  // v13: matriz do caso (camadas × fases), logo depois de "Em resumo" (RQ-03, RQ-20)
  const sMx = secaoMatriz();
  if (sMx) sec(sMx);

  // Recomendações para o seu caso (v10, recomendacoes.js): primeira seção depois do resumo, antes dos blocos A e B
  if (typeof secaoRecomendacoes === 'function') {
    try { sec(secaoRecomendacoes()); } catch (e) { console.warn(e); }
  }

  // ================= Bloco A
  sec({ tipo: 'bloco', id: 'A', h: 'A. ' + tr(TIT_PLANO.A) });

  // A1
  const a1p = [];
  const tE = d.teste;
  if (tE === 'recomendar' || !tE) {
    if (!tE) a1p.push('Você ainda não escolheu entre prova de conceito e piloto.');
    a1p.push(rec.modo === 'poc' ? 'Recomendação: começar por uma prova de conceito.' : rec.modo === 'ambos' ? 'Recomendação: começar por uma prova de conceito e, se ela der certo, fazer um piloto.' : 'Recomendação: começar por um piloto.');
    if (rec.modo === 'ambos') a1p.push('São duas decisões separadas, cada uma com critérios de sucesso próprios: o piloto só começa se a prova de conceito cumprir os seus.');
  } else if (tE === 'ambos') {
    a1p.push(['poc', 'ambos'].includes(rec.modo) ? 'Você escolheu uma prova de conceito seguida de um piloto, como indicam as respostas.'
      : 'Você escolheu uma prova de conceito seguida de um piloto. Pelas respostas, seria possível começar direto pelo piloto; mantenha a prova de conceito se houver uma dúvida técnica a resolver.');
    a1p.push('São duas decisões separadas, cada uma com critérios de sucesso próprios: o piloto só começa se a prova de conceito cumprir os seus.');
  } else if (tE !== rec.modo && !(tE === 'piloto' && rec.modo === 'piloto')) {
    a1p.push(rec.modo === 'ambos' ? (tE === 'poc' ? 'Você escolheu uma prova de conceito. Pelas respostas, a ferramenta indicaria fazer depois um piloto, antes de implantar.' : 'Você escolheu um piloto. Pelas respostas, a ferramenta indicaria uma prova de conceito antes dele.') : tE === 'poc' ? 'Você escolheu uma prova de conceito. Pelas respostas, a ferramenta indicaria um piloto.' : 'Você escolheu um piloto. Pelas respostas, a ferramenta indicaria uma prova de conceito.');
  } else {
    a1p.push(tE === 'poc' ? 'Você escolheu uma prova de conceito, como indicam as respostas.' : 'Você escolheu um piloto, como indicam as respostas.');
  }
  const plEsc = tE !== 'poc' ? +pl.escolas || 0 : 0, plPart = +pl.participantes || 0;
  if (d.poc && tE !== 'poc' && (plEsc > 0 || plPart > 30)) {
    const partes = [];
    if (plEsc > 0) partes.push(fmtInt(plEsc) + ' ' + (plEsc === 1 ? 'escola' : 'escolas'));
    if (plPart > 0) partes.push(fmtInt(plPart) + ' ' + (plPart === 1 ? 'participante' : 'participantes'));
    a1p.push(tr('O setup informado (' + partes.join(', ') + ') descreve um piloto.') + ' ' + tr('Para uma prova de conceito, reduza-o à equipe e a algumas pessoas convidadas (passo 2.3.8).'));
  }
  // v12: frase principal de A1 (capa da página e do PDF)
  const principal = a1p.find(z => z !== 'Você ainda não escolheu entre prova de conceito e piloto.') || '';
  sec({ id: 'A1', h: tituloSec('A1'), principal, p: a1p.concat((rec.motivos || []).length ? ['Por quê:'] : []), list: (rec.motivos || []).map(m => capP(tr(m)) + '.'),
    pos: ['Base: guia do projeto, cap. 14 (instrumentos de aprendizagem). O documento de Krueger e Jackson (2026) não define prova de conceito nem piloto.'] });
  sec({ sub: true, h: 'Aprender antes de se comprometer', table: { head: ['Instrumento', 'Pergunta que responde', 'Condições'], rows: APRENDIZAGEM, hl: d.ambos ? [0, 2] : [d.modo === 'poc' ? 0 : 2], b0: true },
    list: TXT_A1.concat(d.poc ? [TXT_A1_POC] : []) });

  // A2
  if (custo) {
    const cam = custo.camadas, H = custo.H;
    const tot = [1, 2, 3, 4, 5, 6, 7].reduce((s, n) => s + (cam.total[n] || 0), 0);
    const tot0 = [1, 2, 3, 4, 5, 6, 7].reduce((s, n) => s + (cam.ano0[n] || 0), 0);
    const E0 = (custo.av.r.E || [])[0] || 0;
    const ind = custo.ind || {};
    const kv = [
      ['Custo do Ano 0 (prova de conceito ou piloto)', grande(tot0)],
      ['Custo total do ciclo de vida', grande(custo.total)],
      ['Dotação média por ano de operação', grande(custo.anual)],
      ['Por usuário ativo por ano', din(custo.porAluno, 2)],
      ['Custo do Ano 0 por participante do teste', E0 ? din(tot0 / E0, 0) : '—'],
      ['Custo de sair, em anos de custo recorrente', ind.anosParaSair ? numP(ind.anosParaSair, 1) : '—'],
    ];
    const anos = custo.av.r.anos;
    const prem = [];
    prem.push(tr('Arquitetura considerada:') + ' ' + tr(rotP(OPC.arquitetura, arq)) + (ce.__arqPresumida ? ' (' + tr('deduzida das respostas; mude no passo 3.2 se souber que é outra') + ')' : '') + '.');
    // v10: "Como o custo é calculado" (formula.js, R3). Com a fórmula, quantidades e preços unitários ficam em
    // "De onde vêm os números" e saem desta lista de premissas (eram redundantes).
    let formula = [];
    if (typeof secaoFormula === 'function') {
      try { const f = secaoFormula(); formula = (Array.isArray(f) ? f : f ? [f] : []).filter(Boolean); } catch (e) { console.warn(e); formula = []; }
    }
    let unit = [];
    if (!formula.length) {
      try { unit = premissasUnitarias(); } catch (e) { console.warn(e); }
      if (unit.length) unit.forEach(z => prem.push(z)); else prem.push(tr('Premissas de partida:') + ' ' + tr(PRESET_ARQ[arq]) + '.');
    }
    if (c.adaptacao) {
      let f = { fK31: 1, fK32: 1 };
      try { f = fatoresAdaptacao(c.adaptacao, { saas: 'A', api: 'B', ow: 'C' }[arq]) || f; } catch (e) { }
      prem.push(tr('Nível de adaptação:') + ' ' + tr(rotP(OPC.adaptacao, c.adaptacao)) + '. ' + tr('Multiplicador de K3.1: ' + numP(f.fK31, 2) + '; de K3.2: ' + numP(f.fK32, 2) + ' (convenção ilustrativa da ferramenta).'));
    } else prem.push('Nível de adaptação não informado: a estimativa usa o nível do exemplo do guia.');
    if (c.pagamento) prem.push(tr('Pagamento no teste:') + ' ' + tr(rotP(OPC.pagamento, c.pagamento)) + '.');
    const doado = (custo.av.fac || {}).doado || 0;
    if (d.gratis || doado > 0) {
      prem.push('Gratuito para a rede não quer dizer sem custo: o valor de referência aparece como cedido na conta econômica. Krueger e Jackson (2026, p. 7–8) mostram que a aquisição gratuita não elimina os custos do ciclo de vida.');
      if (doado > 0) prem.push(tr('Valor cedido sem custo na conta econômica:') + ' ' + grande(doado) + '.');
    }
    // v11: internet e dispositivos separados (passo 2.4)
    prem.push(['parcial', 'nao'].includes(c.internet) ? 'Conexão das escolas sem internet adequada estimada por escola e por ano, por convenção ilustrativa da ferramenta (passo 2.4).' : 'Internet adequada considerada existente nas escolas: premissa a verificar.');
    if (c.modeloDisp === 'proprio') prem.push('Dispositivos próprios das pessoas: a estimativa não inclui compra de dispositivos. Verifique quem fica sem acesso.');
    else prem.push(['parcial', 'nao'].includes(c.dispExistem) ? 'Dispositivos que faltam estimados pelo modelo de uso e por um preço ilustrativo por dispositivo (passo 2.4), só para os novos usuários de cada ano.' : 'Dispositivos considerados existentes: premissa a verificar.');
    if (['fornecedor', 'parceiro'].includes(c.formacaoPaga)) prem.push('Formação paga pelo fornecedor ou por um parceiro: o valor aparece como cedido na conta econômica e não entra na dotação da rede.');
    if (c.formacaoEstimativa) prem.push('Horas de formação por pessoa: estimativa ilustrativa (passo 2.5). Substitua pelas horas do programa de formação.');
    if (ce.__elegPadrao && !unit.length) prem.push(tr('O número de pessoas que usariam na rede não foi informado: a estimativa usa ' + fmtInt(ce.elegiveis) + ' pessoas como premissa padrão.'));
    prem.push(tr('Horizonte da estimativa:') + ' ' + tr('Ano 0') + ' + ' + tr(rotP(OPC.horizonte, H) || (H + ' anos')) + '. ' + tr('Tempo para chegar a todos depois da implantação:') + ' ' + (rotC('expansao', c.expansao || 'ano1') || '—') + '.');
    prem.push('Todas as premissas são ilustrativas e podem ser ajustadas na calculadora completa (passo 4.2).');
    const padrao = d.faltas.length > 8;
    // v12: números para os KPIs e os gráficos do "Em resumo" (página e PDF)
    const graf = { tot0, total: custo.total, anual: custo.anual, porUsuario: custo.porAluno, totCamadas: tot, H,
      camadas: { ano0: [1, 2, 3, 4, 5, 6, 7].map(n => cam.ano0[n] || 0), total: [1, 2, 3, 4, 5, 6, 7].map(n => cam.total[n] || 0) },
      anos: anos.slice(), dot: anos.map(a => custo.orc.dot[a] || 0) };
    sec({ id: 'A2', h: tituloSec('A2'), pre: padrao ? ['Estimativa baseada em premissas padrão: ' + d.faltas.length + ' perguntas ainda sem resposta.'] : null, kv, kpis: true, graf, pos: ['Valores ilustrativos. Substitua por cotações e dados locais.'] });
    // a primeira parte da fórmula ("Como o custo é calculado") tem kv = termos + total: na página vira a equação do passo 4.2
    formula.forEach((f, i) => sec(Object.assign({}, f, { sub: true, id: undefined }, i === 0 && (f.kv || []).length > 1 ? { eq: true } : {})));
    sec({ sub: true, h: 'Custo por camada', table: { head: ['Camada', tr('Ano 0') + ' (' + unidMil() + ')', tr('Total do ciclo') + ' (' + unidMil() + ')', '%'],
      rows: [1, 2, 3, 4, 5, 6, 7].map(n => [rotuloCamada(n), mil(cam.ano0[n] || 0), mil(cam.total[n] || 0), pct(tot ? (cam.total[n] || 0) / tot : 0)])
        .concat([[tr('Total'), mil(tot0), mil(tot), pct(1)]]), num: [1, 2, 3] },
      pos: [NOTA_CONVENCAO] });
    sec({ sub: true, h: 'Dotação a solicitar por exercício', table: { head: ['Exercício'].concat(anos.map(a => tr('Ano ' + a))),
      rows: [[tr('Dotação a solicitar') + ' (' + unidMil() + ')'].concat(anos.map(a => mil(custo.orc.dot[a] || 0)))], num: anos.map((a, i) => i + 1) } });
    sec({ sub: true, h: 'Premissas desta estimativa', list: prem });
  } else {
    sec({ id: 'A2', h: tituloSec('A2'), p: ['Não foi possível calcular a estimativa com as respostas atuais. Responda ao passo 2.3 (Adoção) e às fases 3 e 4.'] });
  }

  // A3
  const subsDe = n => Object.keys(typeof CAMADA_DE_S !== 'undefined' ? CAMADA_DE_S : CAMADA_DE_S_PLANO).filter(s => camadaDeS(s) === n)
    .map(s => s + ' ' + tr((typeof NOME_S !== 'undefined' && NOME_S[s]) || '')).join('; ');
  const resp = S.resp || {};
  const gq = govQuestoes();
  const nSim = gq.filter(q => resp[q.id] === 'sim').length;
  const neste = {
    1: tr((nSim === 0 ? 'Nenhuma de ' : nSim === 1 ? 'Uma de ' : nSim + ' de ') + gq.length + ' perguntas de governança com resposta Sim (passo 1.3).'),
    2: [tarefas ? tr('Aplicações:') + ' ' + tarefas + '.' : '', ferr.length > 1 ? tr('Ferramentas:') + ' ' + ferr.map(f => f.nome).join('; ') + '.' : '',
      c.pagamento ? tr('Pagamento:') + ' ' + tr(rotP(OPC.pagamento, c.pagamento)) + '.' : '', c.licenca ? tr('Licença:') + ' ' + tr(rotP(OPC.licenca, c.licenca)) + '.' : ''].filter(Boolean).join(' ') || '—',
    3: [tr('Internet adequada:') + ' ' + (rotC('internet', c.internet) || tr('premissa a verificar')) + '.',
      tr('Dispositivos:') + ' ' + [rotC('modeloDisp', c.modeloDisp), c.dispExistem ? tr('já existem:') + ' ' + rotC('dispExistem', c.dispExistem).toLowerCase() : ''].filter(Boolean).join('; ') + (c.modeloDisp || c.dispExistem ? '.' : ' ' + tr('premissa a verificar') + '.')].join(' '),
    4: [c.adaptacao ? tr('Adaptação:') + ' ' + tr(rotP(OPC.adaptacao, c.adaptacao)) + '.' : '', c.arquitetura && c.arquitetura !== 'nao_sei' ? tr('Arquitetura:') + ' ' + tr(rotP(OPC.arquitetura, arq)) + '.' : ''].filter(Boolean).join(' ') || '—',
    5: tr('Dados derivados das tarefas:') + ' ' + nomesP(OPC.dados, ce.dados) + '.',
    6: (c.formados || []).length ? [tr('Quem será formado:') + ' ' + nomesC('formados', c.formados) + '.', c.formacaoFormato ? tr('Formato:') + ' ' + rotC('formacaoFormato', c.formacaoFormato) + '.' : '',
      c.formacaoPaga ? tr('Quem paga:') + ' ' + rotC('formacaoPaga', c.formacaoPaga) + '.' : ''].filter(Boolean).join(' ')
      : (c.usuarios || []).length ? tr('Quem precisa de formação:') + ' ' + nomesP(OPC.usuarios, c.usuarios) + '.' : '—',
    7: [c.suporteQuem ? tr('Suporte:') + ' ' + [rotC('suporteQuem', c.suporteQuem), rotC('suporteNivel', c.suporteNivel)].filter(Boolean).join('; ') + '.' : '',
      c.acompanhamento ? tr('Acompanhamento do uso:') + ' ' + rotC('acompanhamento', c.acompanhamento) + '.' : '',
      custo && (custo.ind || {}).anosParaSair ? tr('Custo de sair estimado em ' + numP(custo.ind.anosParaSair, 1) + ' anos de custo recorrente.') + ' ' + tr(NOTA_SAIDA) : tr(NOTA_SAIDA)].filter(Boolean).join(' '),
  };
  const a3alertas = [];
  if (d.gratis) a3alertas.push(A3_ALERTAS.gratuito);
  if (['api', 'ow'].includes(arq) || c.pagamento === 'consumo') a3alertas.push(A3_ALERTAS.consumo);
  if (arq === 'saas' && ['usuario', 'institucional'].includes(c.pagamento)) {
    let cl = null; if (c.pagamento === 'institucional') try { cl = compLicenca(cfgAtual()); } catch (e) { }
    a3alertas.push(tr(A3_ALERTAS.licencas) + (cl && cl.aEq ? ' ' + tr('Com as premissas atuais, a licença institucional só compensa com adoção acima de ' + pct(cl.aEq) + ' das pessoas elegíveis.') : ''));
  }
  sec({ id: 'A3', h: tituloSec('A3'), p: ['As sete camadas do quadro de Krueger e Jackson (2026, p. 11) e onde cada uma aparece na estimativa deste caso. As páginas citadas são do documento.'],
    table: { head: ['Camada', 'O que considerar', 'Onde está na estimativa', 'Neste caso'], rows: A3_CAMADAS.map(r => [rotuloCamada(r.n), r.considerar, subsDe(r.n) || '—', neste[r.n]]), b0: true, larg: [92, 150, 120] },
    pos: [NOTA_CONVENCAO, tr(REF_CURTA) + ' ' + URL_TCO] });
  if (['parcial', 'nao'].includes(c.internet) || ['parcial', 'nao'].includes(c.dispExistem)) a3alertas.push(A3_ALERTAS.base || 'Condições de base: em sistemas com poucos recursos, conectividade, dispositivos e energia podem ser o primeiro e maior custo (p. 7).');
  if (a3alertas.length) sec({ sub: true, h: 'Pontos de atenção de custo neste caso', list: a3alertas });
  // Figura 1 (p. 11): na página, dentro de A3; no PDF, numa página própria logo depois de A3
  if (typeof FIG_TCO !== 'undefined' && FIG_TCO) sec({ tipo: 'figura', id: 'fig-tco', sub: true, h: FIG_TITULO, alt: FIG_ALT, pos: [FIG_LEGENDA] });

  // A4
  const arr = arranjosCaso(ce);
  const headArr = ['Arranjo', 'Tende a ser adequado quando', 'Exige atenção a', 'Capacidade pública crítica'];
  sec({ id: 'A4', h: tituloSec('A4'), p: [tr('Arranjos mais próximos da arquitetura considerada') + ' (' + tr(rotP(OPC.arquitetura, arq)) + '):'],
    table: { head: headArr, rows: arr.map(a => a.slice(1)), b0: true }, pos: [NOTA_ARQ[arq], TXT_A4] });
  sec({ sub: true, soPagina: true, det: 'Ver todos os arranjos', h: 'Ver todos os arranjos', table: { head: headArr, rows: ARRANJOS.map(a => a.slice(1)), b0: true } });

  // A5
  const filtroTag = xx => !xx[2] || (xx[2] === 'alto' && p.alto) || (xx[2] === 'pessoas' && d.afeta) || (xx[2] === 'consumo' && arq !== 'saas');
  const clausulas = grupos => CONTRATO.filter(xx => grupos.includes(xx[0]) && filtroTag(xx));
  const destaque = xx => (c.licenca === 'termos' && /^Hierarquia documental/.test(xx[1])) || (c.pagamento === 'consumo' && xx[2] === 'consumo');
  const linhasCl = clausulas(GRUPOS_COMPRA).sort((a, b) => GRUPOS_COMPRA.indexOf(a[0]) - GRUPOS_COMPRA.indexOf(b[0]));
  const destA5 = [];
  if (d.gratis) RECS.filter(r => ['r-gratuito', 'r-ativos'].includes(r.id)).forEach(r => destA5.push(textoRec(r, d)));
  if (c.licenca === 'termos') destA5.push('Termos de uso padrão não bastam: negocie um contrato em que termos online não alterem as condições materiais.');
  if (c.pagamento === 'incluida') destA5.push(TXT_A5.incluida);
  if (c.pagamento === 'consumo') destA5.push('Cobrança por consumo: exija consumo visível antes da fatura, com alertas e limites.');
  if (c.suporteQuem === 'fornecedor' || c.suporteQuem === 'ambos') destA5.push('Suporte do fornecedor: inclua no contrato os níveis de serviço (horário, canais, prazos de resposta e de solução).');
  if (c.formacaoPaga === 'fornecedor') destA5.push('Formação a cargo do fornecedor: inclua no contrato as horas por pessoa, o conteúdo, o público e o formato.');
  if (ferr.length > 1) destA5.push('Várias ferramentas: exija interoperabilidade e as mesmas cláusulas de dados em todos os contratos, e evite licenças sobrepostas.');
  destA5.push(TXT_A5.sempre);
  sec({ id: 'A5', h: tituloSec('A5'), p: ['Checklist do Instrumento F do guia (cap. 16), filtrado pelas respostas deste caso. Inclua no termo de referência e no contrato.'],
    list: destA5,
    table: { head: ['Grupo', 'Requisito ou cláusula', 'Neste caso'], rows: linhasCl.map(xx => [xx[0], xx[1], destaque(xx) ? 'Prioridade' : (xx[2] ? TAG_CONTRATO[xx[2]] : '')]), grupo: true, larg: [80, 300], marca: [2],
      hl: linhasCl.map((xx, i) => destaque(xx) ? i : -1).filter(i => i >= 0) } });

  // A6
  const pacote = PACOTE.filter(xx => !xx[2] || (xx[2] === 'rag' && arq === 'api'));
  const a6p = [];
  if (custo && custo.orc) a6p.push(tr('Custo estimado de transição e saída:') + ' ' + grande(custo.orc.saida || 0) + '.' + ((custo.ind || {}).anosParaSair ? ' ' + tr('Equivale a ' + numP(custo.ind.anosParaSair, 1) + ' anos de custo recorrente.') : ''));
  sec({ id: 'A6', h: tituloSec('A6'), p: a6p.concat(['Formas de dependência mais comuns na arquitetura considerada:']), list: LOCKIN[arq] || [],
    pos: ['A saída não consta no documento de Krueger e Jackson (2026); entra na estimativa por convenção desta ferramenta (guia, caps. 10 e 11). O documento trata a dependência como custo do ciclo de vida (p. 8).'] });
  sec({ sub: true, h: 'Pacote de transição a definir no contrato', p: ['A saída se prepara na entrada. Defina no contrato o pacote de transição:'], list: pacote.map(xx => tr(xx[0]) + ': ' + tr(xx[1])) });

  // A7 (v11: era A8; a seção de fonte de recursos saiu)
  const dossie = ['D9', 'D10', 'D11', 'D12', 'D13', 'D14', 'D15'].map(k => DOSSIE.find(z => z[0] === k)).filter(Boolean);
  sec({ id: 'A7', h: tituloSec('A7'), table: { head: ['Doc.', 'Conteúdo', 'Capítulo do guia', 'Instrumento'], rows: dossie.map(z => [z[0], z[1], tr('Cap. ' + z[2]), z[3] ? tr('Instrumento ' + z[3]) : '—']), b0: true } });

  // ================= Bloco B
  sec({ tipo: 'bloco', id: 'B', h: 'B. ' + tr(TIT_PLANO.B) });

  // B1
  const rowsG = gq.map(q => {
    const v = resp[q.id];
    let fazer = ['nao', 'parcial', 'nao_sei'].includes(v) ? ACOES_G[q.id] || '' : v === 'sim' ? 'Manter e revisar periodicamente.' : 'Responder no passo 1.3.';
    // v13: o detalhe "Qual?" / "O que falta?" (RQ-11) entra junto da ação, já traduzido
    const dg = detalheGov(q.id);
    const det = [['sim', 'parcial'].includes(v) && dg.qual ? tr('Qual:') + ' ' + semPontoP(dg.qual) + '.' : '', v === 'parcial' && dg.falta ? tr('O que falta:') + ' ' + semPontoP(dg.falta) + '.' : ''].filter(Boolean);
    if (det.length) fazer = [tr(fazer)].concat(det).join(' ');
    const prio = v === 'sim' ? '—' : PRIORIDADE_G[q.id] === 'alta' ? 'Alta' : 'Normal';
    return [q.n || '', q.t, v ? RESP_G_NOME[v] || v : '—', fazer, prio];
  });
  sec({ id: 'B1', h: tituloSec('B1'), table: { head: ['N.', 'Pergunta', 'Resposta', 'O que fazer', 'Prioridade'], rows: rowsG, larg: [34, 150, 54, 0, 54], marca: [4] }, pos: [TXT_B1_REF] });

  // B2
  sec({ id: 'B2', h: tituloSec('B2'), p: ['Nomeie responsáveis internos para as funções que não podem ser terceirizadas (guia, cap. 2):'], list: FUNCOES_INTERNAS });

  // B3
  const b3 = recsDe('regras', d).map(r => (d.poc && r.dadosReais ? tr('Se usar dados reais:') + ' ' + tr(textoRec(r, d)) : textoRec(r, d)));
  const iSuc = recsDe('regras', d).findIndex(r => r.id === 'r-sucesso');
  if (iSuc >= 0) {
    const med = ['sim', 'parcial'].includes(c.linhaBase) ? String(c.linhaBaseMedida || '').trim() : '';
    const extra = [tr('Linha de base informada:') + ' ' + (tr(rotP(OPC.linhaBase, c.linhaBase)) || '—') + (med ? ' (' + med + ')' : '') + '.'];
    if (impactos) extra.push(tr('Impacto desejado:') + ' ' + impactos + '.');
    b3[iSuc] = tr(b3[iSuc]) + ' ' + extra.join(' ');
  }
  sec({ id: 'B3', h: tituloSec('B3'), p: [d.poc ? 'Regras para a prova de conceito, antes de começar:' : 'Regras para o piloto, antes de começar:'], list: b3 });

  // B4
  const b4 = recsDe('local', d);
  sec({ id: 'B4', h: tituloSec('B4'), p: [d.poc ? 'Na prova de conceito, só o essencial: o teste é feito pela equipe, sem usuários reais.' : 'O que precisa estar pronto nas escolas do piloto, por camada:'],
    table: { head: ['Camada', 'O que fazer'], rows: b4.map(r => [rotuloCamada(r.camada), textoRec(r, d)]), grupo: true, larg: [150] } });

  // B5
  const forma = FORMAS_SUP[formaSupervisao(ce, p)];
  const al = alertas(ce, p) || [];
  const premB5 = [
    tr('Autonomia') + ': ' + ce.autonomia + '. ' + tr(rotP(OPC.autonomia, ce.autonomia)),
    tr('Dados') + ': ' + nomesP(OPC.dados, ce.dados),
    tr('Reversibilidade') + ': ' + tr(rotP(OPC.reversibilidade, ce.reversibilidade)),
    tr('Efeito cumulativo') + ': ' + tr(rotP(OPC.cumulativo, ce.cumulativo)),
    tr('Verificação das saídas') + ': ' + tr(rotP(OPC.verificabilidade, ce.verificabilidade)),
    tr('Contestação') + ': ' + tr(rotP(OPC.contestacao, ce.contestacao)),
  ];
  sec({ id: 'B5', h: tituloSec('B5'), p: [tr('Nível de diligência:') + ' ' + tr(NIVEL_NOME[p.agregado]) + '. ' + tr(NIVEL_CRIT[p.agregado])],
    table: { head: ['Dimensão', 'Nível', 'Justificativa'], rows: DIMENSOES.map(([k, n]) => [n, NIVEL_NOME[p.P[k]], p.J[k]]), b0: true } });
  sec({ sub: true, h: 'Premissas deduzidas das tarefas escolhidas', list: premB5 });
  if (forma) sec({ sub: true, h: 'Forma de supervisão indicada', p: [tr(forma[0]) + '. ' + tr(forma[1])] });
  if (al.length) sec({ sub: true, h: 'Pontos de atenção', table: { head: ['O que fazer', 'Ponto', 'Guia'], rows: al.map(a => [ROT_ALERTA[a.nivel] || a.nivel, a.texto, a.cap ? tr('Cap. ' + a.cap) : '—']), larg: [100, 0, 50] } });
  const ax = anexoIII(ce);
  if (ax.length) sec({ sub: true, h: 'Nota normativa', p: ['O uso descrito corresponde a categorias que o Regulamento Europeu de IA classifica como de alto risco na educação (Anexo III, ponto 3):', ax.map(tr).join('; ') + '.', 'Obrigações aplicáveis a partir de dezembro de 2027. Verifique a legislação da jurisdição aplicável.'] });

  // B6
  const b6 = recsDe('dados', d).filter(r => r.id !== 'i-contestacao').map(r => r.texto);
  if (ce.verificabilidade === 'nao') b6.push('Prioridade: com termos de uso padrão, a solução tende a ser opaca para a instituição. Peça registro de versões, fontes e configurações.');
  sec({ id: 'B6', h: tituloSec('B6'), list: b6 });
  sec({ sub: true, h: 'Requisitos de dados', list: DADOS_REQ.filter(z => z[0] !== 'rag' || arq === 'api').map(z => tr(z[1]) + ': ' + tr(z[2]) + (z[0] === 'treino' && ce.treino !== 'nao' ? ' (' + tr('prioridade') + ')' : '')) });
  const clD = clausulas(GRUPOS_DADOS);
  sec({ sub: true, h: 'Cláusulas de dados e de verificação', table: { head: ['Grupo', 'Requisito ou cláusula', 'Neste caso'], rows: clD.map(xx => [xx[0], xx[1], xx[2] ? TAG_CONTRATO[xx[2]] : '']), grupo: true, larg: [80, 300] } });
  if (d.afeta) {
    const rc = RECS.find(r => r.id === 'i-contestacao');
    sec({ sub: true, h: 'Contestação', p: [rc.texto, 'Um mecanismo efetivo reúne seis elementos:'], list: CONTESTACAO.map(z => tr(z[0]) + ': ' + tr(z[1])) });
  }

  // B7
  const tabRecs = g => recsDe(g, d).map(r => [rotuloCamada(r.camada), r.texto]);
  sec({ id: 'B7', h: tituloSec('B7'), p: ['Recomendações para levar a solução a toda a rede e mantê-la, por camada do custo total.'] });
  sec({ sub: true, h: 'Antes de levar à rede', table: { head: ['Camada', 'O que fazer'], rows: tabRecs('rede'), grupo: true, larg: [150] } });
  sec({ sub: true, h: 'Para manter e ampliar', table: { head: ['Camada', 'O que fazer'], rows: tabRecs('manter'), grupo: true, larg: [150] } });
  sec({ sub: true, det: 'Lista de verificação da supervisão humana', h: 'Lista de verificação da supervisão humana', table: { head: ['Condição', 'Pergunta'], rows: SUPERVISAO, b0: true, larg: [110] } });
  sec({ sub: true, det: 'Níveis de governança da mudança', h: 'Níveis de governança da mudança', table: { head: ['Nível', 'Quando', 'Exemplo'], rows: MUDANCA, b0: true, larg: [100] } });
  sec({ sub: true, det: 'Severidade de incidentes', h: 'Severidade de incidentes', table: { head: ['Severidade', 'Descrição', 'Resposta'], rows: SEVERIDADE, b0: true, larg: [70] } });

  // B8
  const iM = p.alto ? 3 : 2;
  sec({ id: 'B8', h: tituloSec('B8'), list: recsDe('aval', d).map(r => r.texto),
    table: { head: ['Tipo', 'O que medir', p.alto ? 'Frequência (risco elevado ou crítico)' : 'Frequência (risco limitado ou moderado)'], rows: METRICAS.map(m => [m[0], m[1], m[iM]]), b0: true, larg: [80, 0, 120] },
    pos: [TXT_B8_REF] });

  // B9
  sec({ id: 'B9', h: tituloSec('B9'), p: ['Critérios do guia para cada ponto de decisão, com os itens adicionais deste caso.'] });
  [['Para a compra', [5, 6, 7]], ['Para a política', [1, 2, 3, 4, 8, 9]]].forEach(([grupo, ns]) => {
    sec({ sub: true, h: grupo });
    ns.forEach(n => {
      const pd = PDS.find(z => z.n === n); if (!pd) return;
      let ex = []; try { ex = extrasPD(n, ce, p) || []; } catch (e) { }
      sec({ sub: true, det: tr('Ponto de decisão ' + n) + '. ' + tr(pd.titulo), h: tr('Ponto de decisão ' + n) + '. ' + tr(pd.titulo), p: [pd.pergunta],
        list: pd.criterios.concat(ex.map(z => tr(z) + ' (' + tr('para este caso') + ')')), pos: [tr('Se não:') + ' ' + tr(pd.seNao)] });
    });
  });

  // Referências
  sec({ id: 'refs', h: TIT_PLANO.refs, list: [REFS_PLANO[0], tr(REFS_PLANO[1]) + ' ' + URL_TCO + ' ' + tr(REFS_PLANO[2])], pos: [TXT_VINCULO, TXT_ISENCAO] });
  // v14 (BL6): ordem de decisão — resumo, corpo em cinco seções e anexos (relatorio.js)
  return typeof relComporPlano === 'function' ? relComporPlano(S_, d) : S_;
}

// Tradução só dos campos de conteúdo (ids, tipos e alvos de navegação ficam como estão)
function trSecao(s) {
  if (s.pronto) return s;   // v14: itens de relatorio.js já saem traduzidos (traduzir de novo estraga valores como "US$ 4.68 M")
  const o = Object.assign({}, s);
  ['h', 'det', 'alt', 'rotulo'].forEach(k => { if (o[k]) o[k] = tr(o[k]); });
  ['pre', 'p', 'list', 'pos'].forEach(k => { if (o[k]) o[k] = o[k].map(z => tr(z)); });
  if (o.kv) o.kv = o.kv.map(([k, v]) => [tr(k), tr(v)]);
  if (o.fatos) o.fatos = o.fatos.map(([k, v]) => [tr(k), tr(v)]);
  if (o.principal) o.principal = tr(o.principal);
  if (o.cartoes) o.cartoes = o.cartoes.map(z => Object.assign({}, z, { h: tr(z.h), hTable: z.hTable ? tr(z.hTable) : '', kv: z.kv.map(([k, v]) => [tr(k), tr(v)]),
    table: z.table ? Object.assign({}, z.table, { head: z.table.head.map(x => tr(x)), rows: z.table.rows.map(r => r.map(x => tr(x))) }) : null }));
  if (o.table) o.table = Object.assign({}, o.table, { head: o.table.head.map(z => tr(z)), rows: o.table.rows.map(r => r.map(z => tr(z))) });
  return o;
}

// ----------------------------------------------------------- página (v12: relatório com capa, painel, índice e barra de ações)
const linkP = s => esc(s).replace(/https?:\/\/[^\s<]+[^\s<.,;)]/g, u => `<a href="${u}" target="_blank" rel="noopener" style="overflow-wrap:anywhere">${u}</a>`);
function celP(x, marca) {
  const v = String(x == null ? '' : x);
  if (v === tr('Resolver antes de contratar')) return `<span class="tag ess">${esc(v)}</span>`;
  if (v === tr('Tratar no plano') || (marca && (v === tr('Alta') || v === tr('Prioridade')))) return `<span class="tag gold">${esc(v)}</span>`;
  return linkP(v);
}
function htmlTabelaP(t) {
  if (!t || !(t.rows || []).length) return '';
  const num = t.num || [];
  const rows = t.grupo ? t.rows.map((r, i) => i && r[0] === t.rows[i - 1][0] ? [''].concat(r.slice(1)) : r) : t.rows;
  // larguras do PDF (pt, sobre ~503 pt úteis) viram proporções das colunas na página; 0 = o que sobra
  const lg = j => +((t.larg || [])[j] || 0);
  const fixa = t.head.some((h, j) => lg(j) > 0);
  const cols = fixa ? `<colgroup>${t.head.map((h, j) => `<col${lg(j) > 0 ? ` style="width:${(100 * lg(j) / 503).toFixed(1)}%"` : ''}>`).join('')}</colgroup>` : '';
  const tot = tr('Total');
  return `<div class="tw"><table class="pilha${fixa ? ' fixa' : ''}">${cols}<thead><tr>${t.head.map((h, j) => `<th${num.includes(j) ? ' class="n"' : ''}>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) =>
    `<tr${(t.hl || []).includes(i) ? ' class="hl"' : r[0] === tot && i === rows.length - 1 ? ' class="tot"' : ''}>${r.map((v, j) => `<td${num.includes(j) ? ' class="n"' : ''}${v === '' || v == null ? ' data-vazio' : ''} data-th="${esc(t.head[j] || '')}">${(t.b0 || t.grupo) && j === 0 && v ? `<b>${celP(v)}</b>` : celP(v, (t.marca || []).includes(j))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
// "Como o custo é calculado": kv = termos ("Rótulo (quando)", valor) + total, com o visual da equação do passo 4.2 (formula.js)
function htmlEqP(kv) {
  const total = kv[kv.length - 1], termos = kv.slice(0, -1);
  const parte = k => { const m = String(k).match(/^(.*) \(([^()]*)\)$/); return m ? [m[1], m[2]] : [k, '']; };
  const caixa = ([k, v], cls) => { const [l, q] = parte(k); return `<div class="fx-t ${cls}"><span class="fx-v">${esc(String(v).replace(/^− /, ''))}</span><span class="fx-l">${esc(l)}</span>${q ? `<span class="fx-q">${esc(q)}</span>` : ''}</div>`; };
  return `<div class="fx-eq rp-eq" role="group" aria-label="${esc(kv.map(([k, v]) => k + ': ' + v).join('; '))}">${caixa(total, 'fx-total')}<span class="fx-op" aria-hidden="true">=</span>${termos.map((z, i) =>
    `${i ? `<span class="fx-op" aria-hidden="true">${/^− /.test(z[1]) ? '−' : '+'}</span>` : ''}${caixa(z, ['fx-teste', 'fx-uso', 'fx-saida', 'fx-residual'][Math.min(i, 3)])}`).join('')}</div>`;
}
function htmlCorpoP(s) {
  let h = '';
  (s.pre || []).forEach(x => { h += `<p class="kpi-nota">${linkP(x)}</p>`; });
  if ((s.kv || []).length) {
    h += s.eq ? htmlEqP(s.kv) : s.kpis ? `<div class="kpis kpis3">${s.kv.map(([k, v]) => `<div class="kpi"><span class="v">${valorKpiP(v)}</span><span class="l">${esc(k)}</span></div>`).join('')}</div>`
      : `<div class="tw"><table><tbody>${s.kv.map(([k, v]) => `<tr><th style="width:32%">${esc(k)}</th><td>${linkP(v)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  (s.p || []).forEach(x => { h += `<p>${linkP(x)}</p>`; });
  if ((s.list || []).length) h += `<ul class="req">${s.list.map(x => `<li>${linkP(x)}</li>`).join('')}</ul>`;
  h += htmlTabelaP(s.table);
  (s.pos || []).forEach(x => { h += `<p class="note">${linkP(x)}</p>`; });
  return h;
}
// Figura 1 (p. 11) de Krueger e Jackson (2026), reproduzida sem alterações: miniatura com legenda e crédito,
// e o mesmo visualizador das notas ⓘ (fluxo.js) para ampliar sem sair da página
function htmlFiguraP(s) {
  if (typeof FIG_TCO === 'undefined' || !FIG_TCO) return '';
  if (typeof figuraMini === 'function') return figuraMini({ id: 'plano-fig-tco', titulo: s.h, alt: s.alt || '', legenda: (s.pos || [])[0] || '' });
  return `<figure class="fig-tco fig-mini" id="plano-fig-tco"><h4>${esc(s.h)}</h4><img src="${FIG_TCO}" alt="${esc(s.alt || '')}" width="900" height="1225" decoding="async"><figcaption>${linkP((s.pos || [])[0] || '')}</figcaption></figure>`;
}

// Dados do painel (capa e perfil), tirados das seções já traduzidas
function painelPlano(secs) {
  secs = secs || secoesPlano().map(trSecao);
  const by = id => secs.find(z => z.id === id);
  const res = by('resumo') || {}, sin = by('sintese') || {};
  let R = [];
  try { R = typeof recomendacoesCaso === 'function' ? recomendacoesCaso() : []; } catch (e) { console.warn(e); }
  return { fatos: res.fatos || [], cartoes: res.cartoes || [], principal: sin.principal || '', recs: R, nAlta: R.filter(r => r.prioridade === 'alta').length,
    faltas: (by('faltas') || {}).tipo ? by('faltas') : null };
}
function perfilCasoCartoes() { return painelPlano().cartoes; }

const corCamada = n => COR_CAMADA[(+n || 1) - 1] || COR_CAMADA[0];
// Valor de KPI com moeda e magnitude menores ("US$ 336,2 mil" → US$ | 336,2 | mil), sem quebrar o número
function valorKpiP(v) {
  const m = String(v).match(/^(\D*?)\s*([-−]?\d[\d.,\s\u00a0\u202f]*\d|\d)\s*(\D*)$/);
  if (!m) return esc(v);
  return `${m[1] ? `<span class="u">${esc(m[1].trim())}</span> ` : ''}<span class="n">${esc(m[2])}</span>${m[3] ? ` <span class="u">${esc(m[3].trim())}</span>` : ''}`;
}
// Cabeçalho das seções principais: número grande, pergunta, título (o achado) e frase de abertura
const cabP = (num, h, abre, id, rot) => `<header class="rp-cab">${num ? `<span class="rp-num" aria-hidden="true">${esc(num)}</span>` : ''}<div class="rp-cab-t">${rot ? `<p class="rp-rot">${esc(rot)}</p>` : ''}<h3 id="${id}-t">${esc(h)}</h3>${abre ? `<p class="rp-abre">${esc(abre)}</p>` : ''}</div></header>`;
// Recomendações: as 5 primeiras de prioridade alta em cartões; depois a lista completa por momento, como checklist
function htmlRecsP(R, o = {}) {
  if (!(o.todas || R).length) return `<p class="rp-vazio">${esc(tr(TXT_REC.vazio))}</p>`;
  const top = R.filter(r => r.prioridade === 'alta').slice(0, 5);
  const nTop = new Map(top.map((r, i) => [r, i + 1]));
  const quandoNome = q => tr((QUANDO_REC.find(z => z[0] === q) || ['', q])[1]);
  const tags = r => `<span class="rp-tag" data-tipo="${esc(r.tipo)}">${esc(tr(TIPO_REC[r.tipo] || r.tipo))}</span>`;
  const pq = r => { const t = recPorqueTexto(r); return t ? `<p class="rp-pq"><span class="rp-pq-l">${esc(tr(TXT_REC.porque))}</span> ${esc(t)}</p>` : ''; };
  const pqIn = r => { const t = recPorqueTexto(r); return t ? `<span class="rp-pq"><span class="rp-pq-l">${esc(tr(TXT_REC.porque))}</span> ${esc(t)}</span>` : ''; };
  const n = recContagem(o.todas || R), nT = (o.todas || R).length;
  let h = `<p class="rp-cont"><span><b>${nT}</b> ${esc(tr('ações no total'))}</span><span><b>${n.custo || 0}</b> ${esc(tr(TIPO_REC.custo))}</span><span><b>${n.politica || 0}</b> ${esc(tr(TIPO_REC.politica))}</span><span class="rp-cont-a"><b>${(o.todas || R).filter(r => r.prioridade === 'alta').length}</b> ${esc(tr('de prioridade alta'))}</span></p>`;
  if (top.length && !o.semTop) {
    h += `<h4 class="rp-sub">${esc(tr('Comece por estas'))}</h4><ol class="rp-top">${top.map((r, i) => `<li class="rp-tc"><span class="rp-tn" aria-hidden="true">${i + 1}</span><div class="rp-tc-c">
      <p class="rp-tc-a">${esc(tr(r.texto))}</p>${pq(r)}<p class="rp-tags">${tags(r)}<span class="rp-tag rp-q">${esc(quandoNome(r.quando))}</span></p></div></li>`).join('')}</ol>`;
  }
  if (!R.length) return h;
  if (!o.semTop) h += `<h4 class="rp-sub">${esc(tr('Todas as recomendações, por momento'))}</h4>`;
  h += QUANDO_REC.map(([q, nome]) => {
    const L = R.filter(r => r.quando === q);
    if (!L.length) return '';
    return `<div class="rp-grupo" data-quando="${q}"><h5 class="rp-gt"><span>${esc(tr(nome))}</span> <span class="rp-gn">${L.length}</span></h5>
      <ul class="rp-lista">${L.map(r => {
        const alta = r.prioridade === 'alta', k = o.semTop ? 0 : nTop.get(r);
        return `<li class="rc-item rp-li${alta ? ' alta' : ''}" data-rec="${esc(r.id)}" data-tipo="${esc(r.tipo)}" data-prio="${esc(r.prioridade)}"><span class="rp-box" aria-hidden="true"></span>
          <div class="rp-li-c"><p class="rp-li-a">${k ? `<span class="rp-ref" title="${esc(tr('Comece por estas'))}">${k}</span> ` : ''}${esc(tr(r.texto))}</p>
          <p class="rp-meta"><span class="rp-tag rp-prio${alta ? ' alta' : ''}">${esc(tr('Prioridade'))}: ${esc(tr(PRIO_REC[r.prioridade] || r.prioridade))}</span>${tags(r)}${pqIn(r)}</p></div>
          ${r.ir ? `<button type="button" class="link rc-ir" data-ir="${esc(r.ir)}">${esc(tr(TXT_REC.ir))}</button>` : ''}</li>`;
      }).join('')}</ul></div>`;
  }).join('');
  return h;
}
// Perfil do caso: cartões por área com pares rótulo/valor; etapas e ferramentas como tabelas pequenas
function htmlPerfilP(cartoes) {
  const cor = z => z.camada ? corCamada(z.camada.split(' ')[0]) : z.id === 'implantacao' ? 'var(--f4)' : '#0C2D4D';
  const cam = z => !z.camada ? '' : z.camada.includes(' ') ? tr('Camadas ' + z.camada.split(' ').join(' e ')) : tr('Camada ' + z.camada);
  // v13: valores em várias linhas (problemas, linha de base, detalhes das 1.3.x); o aviso de lacunas fica discreto
  const aviso = '(' + tr(AVISO_LACUNA_P) + ')';
  const val = v => String(v).split('\n').map(l => l === aviso ? `<span class="rp-lac">${esc(l)}</span>` : `<span class="rp-ln">${linkP(l)}</span>`).join('');
  return `<div class="rp-perfil">${cartoes.map(z => `<article class="rp-card${z.table || ['problema', 'governanca', 'implantacao'].includes(z.id) ? ' largo' : ''}" data-area="${z.id}" style="--cor:${cor(z)}" aria-labelledby="rp-a-${z.id}">
    <h4 id="rp-a-${z.id}"><span>${esc(z.h)}</span>${z.camada ? `<span class="rp-cam">${esc(cam(z))}</span>` : ''}</h4>
    <dl class="rp-dl">${z.kv.map(([k, v]) => `<div class="rp-kv"><dt>${esc(k)}</dt><dd${v === '—' ? ' class="sem"' : ''}>${String(v).includes('\n') ? val(v) : linkP(v)}</dd></div>`).join('')}</dl>
    ${z.table ? `<p class="rp-tt">${esc(z.hTable)}</p>${htmlTabelaP(z.table)}` : ''}</article>`).join('')}</div>`;
}
// v13: matriz do caso na página. Com o pacote B2, a tabela é renderMatrizTabela({ caso: true }) (traz a nota de custo
// e o crédito); sem ela, uma tabela equivalente desenhada aqui a partir de matrizCaso() (secaoMatriz().mx).
function htmlMatrizP(s) {
  if (!s) return '';
  let h = '';
  if (typeof renderMatrizTabela === 'function') { try { h = renderMatrizTabela({ caso: true }) || ''; } catch (e) { console.warn(e); h = ''; } }
  if (h) {
    const m = s.mx || {};
    return h + (m.custo ? `<p class="rp-mx-soma">${esc(tr(TXT_MATRIZ.soma))} <b>${esc(grande(m.total))}</b></p>` : `<p class="note">${esc(tr(TXT_MATRIZ.semCusto))}</p>`);
  }
  return htmlMatrizTabelaP(s) + (s.pos || []).map(z => `<p class="note">${linkP(z)}</p>`).join('');
}
function htmlMatrizTabelaP(s) {
  const m = s.mx;
  if (!m) return htmlTabelaP(s.table);
  const fc = i => 'f' + (i + 1);
  const cel = c => c.na ? `<td class="rp-mx-na">${esc(tr(c.t))}</td>`
    : `<td><p class="rp-mx-t">${esc(tr(c.t))}</p>${c.n.length ? `<p class="rp-mx-q">${esc(tr(TXT_MATRIZ.perguntas))} ${c.n.map(esc).join(' · ')}</p>` : ''}<p class="rp-mx-pe"><span class="rp-mx-st" data-st="${esc(c.estado)}">${esc(tr(ROT_ESTADO[c.estado] || c.estado))}</span>${c.custo != null ? `<b class="rp-mx-v">${esc(grande(c.custo))}</b>` : ''}</p></td>`;
  const head = `<thead><tr><th scope="col" class="rp-mx-c0">${esc(tr(TXT_MATRIZ.camada))}</th>${m.fases.map((f, i) => `<th scope="col" style="--fc:var(--${fc(i)}s)"><span class="rp-mx-fn" style="background:var(--${fc(i)});color:var(--${fc(i)}-ink)">${esc(f.n)}</span> ${esc(tr(f.nome))}</th>`).join('')}</tr></thead>`;
  const body = `<tbody>${m.linhas.map(l => `<tr><th scope="row" class="rp-mx-c0" style="--cor:${corCamada(l.n)}"><span class="rp-mx-cn" aria-hidden="true">${l.n}</span><span><span class="sr">${esc(tr('Camada ' + l.n))}: </span>${esc(tr(l.nome))}</span></th>${l.cel.map(cel).join('')}</tr>`).join('')}</tbody>`;
  const pe = m.custo ? `<tfoot><tr><th scope="row" class="rp-mx-c0">${esc(tr('Total'))}</th>${m.somas.map(v => `<td>${v == null ? '—' : `<b class="rp-mx-v">${esc(grande(v))}</b>`}</td>`).join('')}</tr></tfoot>` : '';
  return `<div class="rp-mx-w" role="region" tabindex="0" aria-label="${esc(tr(s.h))}"><table class="rp-mx"><caption class="sr">${esc(tr(s.h))}</caption>${head}${body}${pe}</table></div>`;
}
const CSS_PLANO_V13 = `
.rp-mx-w { overflow-x: auto; border: 1px solid var(--rp-line); border-radius: 10px; background: #fff; }
.rp-mx-w:focus-visible { outline: 3px solid var(--rp-brand); outline-offset: 2px; }
.rp-mx { width: 100%; min-width: 820px; border-collapse: separate; border-spacing: 0; font-size: .9rem; line-height: 1.4; color: var(--rp-ink); }
.rp-mx th, .rp-mx td { padding: 10px 12px; text-align: left; vertical-align: top; border-bottom: 1px solid var(--rp-line); }
.rp-mx td + td, .rp-mx th + td { border-left: 1px solid var(--rp-line); }
.rp-mx thead th { background: var(--rp-th); color: var(--rp-head); font-weight: 700; border-top: 4px solid var(--fc, var(--rp-head)); white-space: nowrap; }
.rp-mx thead th.rp-mx-c0 { border-top-color: var(--rp-head); }
.rp-mx-fn { display: inline-grid; place-items: center; width: 1.6em; height: 1.6em; margin-right: 4px; border-radius: 50%; font-variant-numeric: tabular-nums; }
.rp-mx .rp-mx-c0 { position: sticky; left: 0; z-index: 1; width: 180px; min-width: 150px; background: #fff; }
.rp-mx thead .rp-mx-c0 { background: var(--rp-th); z-index: 2; }
.rp-mx tbody th { display: table-cell; color: var(--rp-head); font-weight: 700; box-shadow: inset 4px 0 0 var(--cor); padding-left: 14px; }
.rp-mx tbody th > span:last-child { display: block; }
.rp-mx-cn { display: inline-grid; place-items: center; width: 1.6em; height: 1.6em; margin-bottom: 4px; border-radius: 5px; background: var(--cor); color: #fff; font-variant-numeric: tabular-nums; }
.rp-mx p { margin: 0; }
.rp-mx-t { color: var(--rp-ink); }
.rp-mx-q { margin-top: 4px !important; font-size: .86rem; color: var(--rp-muted); font-variant-numeric: tabular-nums; }
.rp-mx-pe { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 10px; margin-top: 8px !important; }
.rp-mx-st { display: inline-block; font-size: .86rem; font-weight: 600; line-height: 1.4; padding: 1px 9px; border-radius: 999px; border: 1px solid; }
.rp-mx-st[data-st="ok"] { background: #E8F4EC; border-color: #BBDCC6; color: #1E6B3A; }
.rp-mx-st[data-st="andamento"] { background: #FFF6E5; border-color: #F0D9A8; color: var(--rp-media); }
.rp-mx-st[data-st="pendente"] { background: #FBECEB; border-color: #EFC6C3; color: var(--rp-alta); }
.rp-mx-st[data-st="orientacao"] { background: var(--rp-th); border-color: var(--rp-line); color: var(--rp-head); }
.rp-mx-v { color: var(--rp-head); font-variant-numeric: tabular-nums; white-space: nowrap; }
.rp-mx td.rp-mx-na { background: var(--rp-bg); color: var(--rp-muted); font-style: italic; }
.rp-mx tfoot th, .rp-mx tfoot td { background: var(--rp-bg); border-bottom: 0; }
.rp-mx tfoot .rp-mx-c0 { background: var(--rp-bg); }
.rp-mx-soma { margin: 0; color: var(--rp-head); }
.rp-kv dd .rp-ln { display: block; }
.rp-kv dd .rp-ln + .rp-ln { margin-top: 4px; }
.rp-kv dd .rp-lac { display: block; margin-top: 4px; font-size: .86rem; color: var(--rp-media); }
@media (max-width: 640px) {
  .rp-mx { min-width: 0; width: max-content; }
  .rp-mx .rp-mx-c0 { width: 132px; min-width: 132px; max-width: 132px; overflow-wrap: anywhere; hyphens: auto; }
  .rp-mx td, .rp-mx thead th:not(.rp-mx-c0) { width: 210px; min-width: 210px; }
  .rp-mx thead th { white-space: normal; }
}
@media print { .rp-mx-w { overflow: visible; } .rp-mx { min-width: 0; } .rp-mx .rp-mx-c0 { position: static; } }
`;
function cssPlanoV13() {
  try {
    if (typeof document === 'undefined' || document.getElementById('css-plano-v13')) return;
    const st = document.createElement('style'); st.id = 'css-plano-v13'; st.textContent = CSS_PLANO_V13;
    (document.head || document.documentElement).appendChild(st);
  } catch (e) { }
}
// Resumo da primeira página: TCO com a faixa P10 a P90, três indicadores, os três maiores direcionadores e as cinco ações
function htmlSinteseP(s) {
  const d = s.d;
  let h = '';
  // v14 (revisão): a proposta em seis respostas
  if (s.exec && s.exec.length) {
    h += `<h4 class="rp-sub">${esc(tr(TXT_REL.exT))}</h4><table class="rs-exec" data-k="exec"><thead><tr><th scope="col">${esc(tr(TXT_REL.exDim))}</th><th scope="col">${esc(tr(TXT_REL.exResp))}</th></tr></thead><tbody>${s.exec.map(x =>
      `<tr data-dim="${esc(x.id)}"><th scope="row"><b>${esc(x.rot)}</b><span>${esc(x.perg)}</span></th><td>${x.frases.length ? (x.frases.length > 1 ? `<ul>${x.frases.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : `<p>${esc(x.frases[0])}</p>`) : `<p class="muted">${esc(x.falta)}</p>`}</td></tr>`).join('')}</tbody></table>`;
  }
  if (!d) h += `<p class="rp-vazio">${esc(s.semCusto)}</p>`;
  else {
    const w = Math.max(d.hi - d.lo, d.central * 0.02), a = d.lo - 0.5 * w, b = d.hi + 0.5 * w;
    const pos = v => (100 * (v - a) / (b - a)).toFixed(2);
    h += `<h4 class="rp-sub">${esc(tr(TXT_REL.numT))}</h4><div class="rs-topo"><div class="rs-tco" data-k="tco"><span class="rs-tco-l">${esc(tr(TXT_REL.kTco))}</span><span class="rs-tco-v">${valorKpiP(d.centralTxt)}</span>
      <span class="rs-tco-f">${esc(d.faixaTxt)}</span>
      <div class="rs-faixa" role="img" aria-label="${esc(d.faixaTxt + '; ' + tr(TXT_REL.kCentral) + ': ' + d.centralTxt)}"><i style="left:${pos(d.lo)}%;width:${(pos(d.hi) - pos(d.lo)).toFixed(2)}%"></i><b style="left:${pos(d.central)}%"></b></div>
      <p class="rs-nota">${esc(d.nota)}</p></div>
      <div class="rs-kpis">${d.kpis.map(k => `<div class="rp-kpi" data-k="${k.id}"><span class="rp-kpi-v">${valorKpiP(k.v)}</span><span class="rp-kpi-l">${esc(k.l)}</span>${k.nota ? `<span class="rp-kpi-n">${esc(k.nota)}</span>` : ''}</div>`).join('')}</div></div>`;
  }
  h += `<h4 class="rp-sub">${esc(tr(TXT_REL.acoes5))}</h4>`;
  if (!s.recs.length) h += `<p class="rp-vazio">${esc(tr(TXT_REL.semAcoes))}</p>`;
  else {
    const lin = (k, v) => v ? `<div class="rs-ac-l" data-c="${k}"><dt>${esc(tr(TXT_REL[k]))}</dt><dd>${esc(v)}</dd></div>` : '';
    h += `<p class="rs-abre muted">${esc(tr(TXT_REL.acoesAbre))}</p><ol class="rp-top" data-k="acoes">${s.recs.map(r => `<li class="rp-tc" data-rec="${esc(r.id)}"><span class="rp-tn" aria-hidden="true">${r.n}</span><div class="rp-tc-c">
    <dl class="rs-ac">${lin('exOque', r.oque)}${lin('exPorque', r.porque)}${lin('exParaque', r.paraque)}${lin('exComo', r.como)}${lin('exQuem', r.quemTxt)}${lin('exQuando', r.quandoTxt)}</dl>
    <p class="rp-tags"><span class="rp-tag" data-tipo="${esc(r.tipo)}">${esc(r.tipo)}</span><span class="rp-tag rp-q">${esc(r.quando)}</span></p></div>${r.ir ? `<button type="button" class="link rc-ir" data-ir="${esc(r.ir)}">${esc(tr(TXT_REC.ir))}</button>` : ''}</li>`).join('')}</ol>`;
  }
  if (d) {
    h += `<h4 class="rp-sub">${esc(tr(TXT_REL.custoT))}</h4><p class="rs-abre muted">${esc(tr(TXT_REL.custoAbre))}</p>`;
    if (s.ice) h += htmlIcebergsP(s.ice);
    h += `<h5 class="rp-sub">${esc(tr(TXT_REL.direcionadores))}</h5><ol class="rs-dir" data-k="direcionadores">${d.drivers.map(x => `<li><b>${esc(x.nome)}</b> <span>${esc(x.faixa)}</span><span class="rs-d-b" style="width:${Math.max(2, 100 * x.w).toFixed(1)}%" aria-hidden="true"></span><span>${esc(x.txt)}</span></li>`).join('')}</ol>`;
  }
  return h;
}
// Iceberg: céu com o pico (o preço da proposta) e água funda com o gelo submerso, mais largo quanto maior a parcela escondida
const IC_PICO = '<svg viewBox="0 0 200 64" aria-hidden="true"><path d="M18 64 L62 30 L76 40 L104 4 L124 32 L140 22 L182 64 Z" fill="#B9DDF6"/><path d="M104 4 L124 32 L140 22 L182 64 L112 64 L98 30 Z" fill="#7DB8E6"/><path d="M18 64 L62 30 L76 40 L104 4 L124 32 L140 22 L182 64 Z" fill="none" stroke="#4E9BD3" stroke-width="1.4" stroke-linejoin="round"/><path d="M104 4 L96 26 M104 4 L114 30 M62 30 L58 42" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>';
function icSubmerso(p) {
  const w = 0.62 + 0.36 * Math.max(0, Math.min(1, p)), l = 50 - 50 * w, r = 50 + 50 * w;
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M20 0 L80 0 L${(r - 2).toFixed(1)} 30 L${r.toFixed(1)} 62 L${(r - 8).toFixed(1)} 92 L58 100 L36 97 L${(l + 6).toFixed(1)} 84 L${l.toFixed(1)} 52 L${(l + 4).toFixed(1)} 24 Z" fill="#6CBDEE" fill-opacity=".22"/><path d="M50 0 L56 46 L48 100" stroke="#A9DCF8" stroke-opacity=".12" stroke-width="1.2" fill="none" vector-effect="non-scaling-stroke"/></svg>`;
}
function htmlIcebergsP(I) {
  const lin = x => `<div class="ic-l" data-g="${x.k}"${x.ano < 0.5 ? ' data-zero' : ''}><span>${esc(x.nome)}</span><b>${esc(x.txt)}</b><i style="--w:${(100 * x.w).toFixed(1)}%" aria-hidden="true"></i></div>`;
  return `<h5 class="rp-sub">${esc(I.h)}</h5><p class="rs-abre muted">${esc(I.abre)}</p><div class="rs-ice" data-k="icebergs">${I.fases.map(f => `<article class="ic" data-fase="${f.id}">
    <div class="ic-cab"><b>${esc(f.nome)}</b><span>${esc(f.anosTxt)}</span></div>
    <div class="ic-ceu">${IC_PICO}<div class="ic-box"><span class="ic-rot">${esc(I.acima)}</span>${f.acima.map(lin).join('')}</div></div>
    <div class="ic-agua">${icSubmerso(f.pOculto)}<span class="ic-rot">${esc(I.abaixo)}</span>${f.abaixo.map(lin).join('')}</div>
    <div class="ic-pe"><span class="ic-m">${esc(I.mediaRot)}</span><span class="ic-v">${esc(f.mediaTxt)}</span><span class="ic-m">${esc(f.totalTxt)}</span><span class="ic-o">${esc(f.ocultoTxt)}</span></div></article>`).join('')}</div><p class="ic-nota muted">${esc(I.nota)}</p>`;
}
// Respostas que faltam: lista curta perto do topo (curta) ou completa no anexo A
function htmlFaltasP(s) {
  const n = s.total || (s.list || []).length;
  return `<div class="parcial" id="plano-faltas-lista"><p><b>${esc(s.p[0])}</b> ${esc(s.p[1] || '')}</p><ul class="req">${s.list.map((z, i) => `<li><span>${esc(z)}</span> ${s.irs[i] ? `<button type="button" class="link" data-ir="${esc(s.irs[i])}">${esc(tr('Responder'))}</button>` : ''}</li>`).join('')}</ul>${s.curta && n > s.list.length ? `<p><a href="#plano-anexo-a">${esc(tr(TXT_REL.faltasLink))}</a></p>` : ''}</div>`;
}
// v15 (proposta C): corpo do plano (seções e anexos) separado da capa, da barra e do índice, para que o documento vivo
// (documento.js) use as mesmas seções. o.pular(s) omite um item; o.apos(s) devolve HTML posto logo depois do cabeçalho
// de uma seção (sumário, 1 a 5, anexos); o.sintese(s) substitui o corpo do sumário executivo.
function htmlCorpoPlano(secs, P, o = {}) {
  let out = '';
  const toc = [];   // [id da seção, rótulo, número, bloco-pai]
  const apos = x => (o.apos ? o.apos(x) || '' : '');
  const itemP = s => {
    const idA = s.id ? ` id="plano-${s.id}" data-sec="${s.id}"` : '';
    const wrap = body => `<div class="rp-item"${idA}>${body}</div>`;
    if (s.tipo === 'figura') return htmlFiguraP(s);
    if (['fases', 'camadas', 'adocao', 'cenarios', 'tornado'].includes(s.tipo)) return htmlGrafP(s);
    if (s.tipo === 'fatos') return wrap(`<h4>${esc(s.h)}</h4><ul class="rp-fatos">${s.fatos.map(([k, v]) => `<li><span class="rp-fl">${esc(k)}</span><span class="rp-fv">${esc(v)}</span></li>`).join('')}</ul>`);
    if (s.tipo === 'nota') return wrap((s.p || []).map(z => `<p class="note">${linkP(z)}</p>`).join(''));
    if (s.tipo === 'perfil') return wrap(`<h4>${esc(s.h)}</h4>${htmlPerfilP(s.cartoes)}`);
    if (s.tipo === 'faltas') return wrap(`<h4>${esc(s.h)}</h4>${htmlFaltasP(s)}`);
    if (s.tipo === 'matriz') return wrap(`<h4>${esc(s.h)}</h4>${(s.p || []).map(z => `<p>${esc(z)}</p>`).join('')}${htmlMatrizP(s)}`);
    if (s.tipo === 'recs') return wrap(`<h4>${esc(s.h)}</h4><p>${esc((s.p || [])[0] || '')}</p>${htmlRecsP(P.recs.slice(s.resto || 0), { semTop: true, todas: P.recs })}`);
    if (s.tipo === 'refs') {
      const cred = typeof FIG_LEGENDA !== 'undefined' && typeof FIG_TCO !== 'undefined' && FIG_TCO ? `<p class="rp-cred"><b>${esc(tr('Figura'))}:</b> ${esc(tr(FIG_LEGENDA))}</p>` : '';
      return wrap(`${htmlCorpoP(Object.assign({}, s, { pos: null }))}${cred}${(s.pos || []).map(z => `<p class="note">${linkP(z)}</p>`).join('')}`);
    }
    // na página, tabelas e listas longas ficam recolhidas (o PDF e as exportações mostram tudo); premissas e glossário ficam abertos
    const longa = !s.det && !s.eq && !s.aberto && (((s.table || {}).rows || []).length > 14 || (s.list || []).length > 10);
    if (s.det || longa) return wrap(`<details class="mais"><summary>${esc(s.det || s.h)}${longa ? ` <span class="rp-n">${(((s.table || {}).rows || []).length || (s.list || []).length)}</span>` : ''}</summary><div class="mais-in">${htmlCorpoP(s)}</div></details>`);
    return wrap(`${s.h ? `<h4>${esc(s.h)}</h4>` : ''}${htmlCorpoP(s)}`);
  };
  let aberta = false, anexos = false;
  const fecha = () => { if (aberta) { out += '</section>'; aberta = false; } };
  secs.forEach(s => {
    if (o.pular && o.pular(s)) return;
    if (s.tipo === 'sintese') {
      toc.push(['sintese', s.h, '', '']);
      out += `<section class="rp-sec rp-sintese" id="plano-sintese" data-sec="sintese" data-toc="sintese" aria-labelledby="plano-sintese-t">${cabP('', s.h, (s.p || [])[0], 'plano-sintese')}${apos(s)}${o.sintese ? o.sintese(s) : htmlSinteseP(s)}</section>`;
    } else if (s.tipo === 'caixa') {
      out += `<aside class="rp-comoler" id="plano-comoler" data-sec="comoler" aria-labelledby="plano-comoler-t"><h3 id="plano-comoler-t">${esc(s.h)}</h3><ul>${s.list.map(z => `<li>${esc(z)}</li>`).join('')}</ul></aside>`;
    } else if (s.tipo === 'faltas' && s.curta) {
      out += `<div class="rp-item" id="plano-faltas" data-sec="faltas" data-toc="faltas">${htmlFaltasP(s)}</div>`;
    } else if (s.tipo === 'princ') {
      fecha(); toc.push([s.id, s.rotulo, s.num, '']);
      out += `<section class="rp-sec rp-princ-sec" id="plano-${s.id}" data-sec="${s.id}" data-toc="${s.id}" aria-labelledby="plano-${s.id}-t">${cabP(s.num, s.h, s.intro || '', 'plano-' + s.id, s.rotulo)}${apos(s)}`; aberta = true;
    } else if (s.tipo === 'anexos') {
      fecha(); anexos = true; toc.push(['anexos', s.h, '', '']);
      out += `<div class="rp-anexos" id="plano-anexos" data-sec="anexos" data-toc="anexos"><header class="rp-cab"><div class="rp-cab-t"><h3 id="plano-anexos-t">${esc(s.h)}</h3><p class="rp-abre">${esc((s.p || [])[0] || '')}</p></div></header>${apos(s)}`;
    } else if (s.tipo === 'anexo') {
      fecha(); toc.push([s.id, s.h, s.letra, 'anexos']);
      out += `<section class="rp-sec rp-anexo" id="plano-${s.id}" data-sec="${s.id}" data-toc="${s.id}" data-pai="anexos" aria-labelledby="plano-${s.id}-t"><header class="rp-cab"><span class="rp-num" aria-hidden="true">${esc(s.letra)}</span><div class="rp-cab-t"><p class="rp-rot">${esc(tr('Anexo {0}').replace('{0}', s.letra))}</p><h3 id="plano-${s.id}-t">${esc(s.h)}</h3></div></header>${apos(s)}`; aberta = true;
    } else out += itemP(s);
  });
  fecha();
  if (anexos) out += '</div>';

  return { out, toc };
}
function renderPlano() {
  if (typeof fxCss === 'function') fxCss();
  cssPlanoV13();
  if (typeof cssRelatorio === 'function') cssRelatorio();
  const secs = secoesPlano().map(trSecao);
  const P = painelPlano(secs);
  const c = S.caso, x = S.ctx || {};
  let data = '';
  try { data = new Date().toLocaleDateString(LOC(), { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { data = new Date().toLocaleDateString(); }
  const titulo = c.titulo || x.olhando || tr('Caso sem título');
  const toc = [];   // [id da seção, rótulo, número, bloco-pai]
  const secP = (id, num, h, abre, corpo, cls) => { toc.push([id, h, num, '']); return `<section class="rp-sec${cls ? ' ' + cls : ''}" id="plano-${id}" data-sec="${id}" data-toc="${id}" aria-labelledby="plano-${id}-t">${cabP(num, h, abre, 'plano-' + id)}${corpo}</section>`; };

  // capa
  let logos = '';
  try { logos = [...document.querySelectorAll('.top .logo')].map(i => `<img class="rp-logo" src="${i.getAttribute('src')}" alt="${esc(i.getAttribute('alt') || '')}" width="${i.getAttribute('width') || ''}" height="${i.getAttribute('height') || ''}">`).join(''); } catch (e) { }
  const acaoAlta = P.nAlta ? `<a href="#plano-sintese">${esc(tr(P.nAlta === 1 ? '1 ação de prioridade alta' : P.nAlta + ' ações de prioridade alta'))}</a>`
    : P.recs.length ? `<a href="#plano-sintese">${esc(tr('Ver as recomendações'))}</a>` : '';
  const capa = `<header class="rp-capa" id="plano-capa">
    <div class="rp-capa-faixa" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
    <div class="rp-capa-in">
      <div class="rp-capa-topo">${logos ? `<span class="rp-logos">${logos}</span>` : ''}<span class="rp-marca" data-notr>${esc(NOME_FERRAMENTA)}</span></div>
      <p class="rp-capa-e">${esc(tr('Plano de contratação'))}</p>
      <h2 class="rp-capa-h">${esc(titulo)}</h2>
      <p class="rp-capa-m">${[x.local, data].filter(Boolean).map(esc).join(' · ')}</p>
      ${P.principal ? `<div class="rp-princ"><p class="rp-princ-e">${esc(tr('Recomendação principal'))}</p><p class="rp-princ-t">${esc(P.principal)}</p>${acaoAlta ? `<p class="rp-princ-a">${acaoAlta}</p>` : ''}</div>` : ''}
      <p class="rp-isencao faixa-plano">${esc(tr(FAIXA_PLANO))}</p>
    </div></header>`;

  const { out, toc: toc2 } = htmlCorpoPlano(secs, P);
  toc.push(...toc2);

  // índice (coluna fixa a partir de 1100 px; faixa de fichas em telas menores)
  const tops = toc.filter(z => !z[3]);
  const indice = `<nav class="rp-indice" aria-label="${esc(tr('Seções do plano'))}"><p class="rp-ind-t">${esc(tr('Neste plano'))}</p><ol>${tops.map(([id, h, num]) => {
    const filhos = toc.filter(z => z[3] && z[3] === id);
    return `<li data-toc-li="${id}"><a href="#plano-${id}" data-toc-l="${id}">${num ? `<span class="rp-in">${esc(num)}</span>` : ''}<span class="rp-il">${esc(h)}</span></a>${filhos.length ? `<ol>${filhos.map(([fid, fh, fn]) => `<li><a href="#plano-${fid}" data-toc-l="${fid}"><span class="rp-in">${esc(fn)}</span><span class="rp-il">${esc(fh)}</span></a></li>`).join('')}</ol>` : ''}</li>`;
  }).join('')}</ol></nav>`;

  const exp = CAP.downloads ? `<button class="btn" type="button" data-act="exp-json">Exportar caso (.json)</button>` : `<button class="btn" type="button" data-act="copiar-json">Copiar dados do caso</button>`;
  return `<section class="resumo plano rp" id="plano">
    <div class="rp-barra res-topo">
      <div class="rp-barra-t"><span class="rp-be">${esc(tr('Plano de contratação'))}</span><span class="rp-bc">${esc(titulo)}</span></div>
      <div class="rp-acoes"><button type="button" class="btn pri" data-act="pdf"><span aria-hidden="true" class="rp-ic">↓</span> Baixar PDF</button><button type="button" class="btn" data-act="voltar-percurso"><span aria-hidden="true" class="rp-ic">←</span> Voltar ao percurso</button><button class="btn" type="button" data-act="copiar">Copiar texto</button>${exp}<button class="btn" type="button" data-act="imp-json">Importar caso</button></div>
    </div>
    <div class="rp-grade">${indice}<div class="rp-corpo">${capa}${out}${typeof avisoTradHTML === 'function' ? avisoTradHTML('rp-aviso-trad') : ''}</div></div>
  </section>`;
}
// Depois de cada render da vista do plano (fluxo.js): alturas das barras fixas e seção atual no índice
function montarPlano() {
  const P = document.getElementById('plano'); if (!P) return;
  const medir = () => {
    const top = document.querySelector('.top'), bar = P.querySelector('.rp-barra'), ind = P.querySelector('.rp-indice');
    const fixo = el => el && getComputedStyle(el).position === 'sticky' ? el.offsetHeight : 0;
    const estreito = window.matchMedia && window.matchMedia('(max-width: 1099px)').matches;
    P.style.setProperty('--rp-hdr', (top ? top.offsetHeight : 80) + 'px');
    P.style.setProperty('--rp-bar', fixo(bar) + 'px');
    P.style.setProperty('--rp-chips', (estreito ? fixo(ind) : 0) + 'px');
  };
  medir();
  const alvos = [...P.querySelectorAll('[data-toc]')];
  const links = [...P.querySelectorAll('[data-toc-l]')];
  const atual = () => {
    if (!P.isConnected) return;
    const lim = (parseFloat(getComputedStyle(P).getPropertyValue('--rp-hdr')) || 80) + (parseFloat(getComputedStyle(P).getPropertyValue('--rp-bar')) || 0) + (parseFloat(getComputedStyle(P).getPropertyValue('--rp-chips')) || 0) + 40;
    let id = alvos.length ? alvos[0].dataset.toc : '';
    alvos.forEach(a => { if (a.getBoundingClientRect().top <= lim) id = a.dataset.toc; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4 && alvos.length) {
      const ult = alvos[alvos.length - 1]; if (ult.getBoundingClientRect().top < window.innerHeight) id = ult.dataset.toc;
    }
    if (atual.id === id) return;
    atual.id = id;
    const elAtual = alvos.find(a => a.dataset.toc === id);
    const pai = (elAtual && elAtual.dataset.pai) || id;
    links.forEach(l => { const on = l.dataset.tocL === id || l.dataset.tocL === pai; l.classList.toggle('on', on); if (l.dataset.tocL === id) l.setAttribute('aria-current', 'location'); else l.removeAttribute('aria-current'); });
    P.querySelectorAll('[data-toc-li]').forEach(li => li.classList.toggle('aberto', li.dataset.tocLi === pai));
    // faixa de fichas: mantém a ficha atual visível sem mexer na rolagem vertical
    const ol = P.querySelector('.rp-indice > ol'), ch = P.querySelector(`.rp-indice > ol > li > a[data-toc-l="${pai}"]`);
    if (ol && ch && ol.scrollWidth > ol.clientWidth + 2) {
      const l = ch.offsetLeft - ol.offsetLeft;
      if (l < ol.scrollLeft || l + ch.offsetWidth > ol.scrollLeft + ol.clientWidth) ol.scrollTo({ left: Math.max(0, l - 16), behavior: 'smooth' });
    }
  };
  if (window.__rpIO) { try { window.__rpIO.disconnect(); } catch (e) { } }
  if ('IntersectionObserver' in window) {
    window.__rpIO = new IntersectionObserver(() => atual(), { rootMargin: '-15% 0px -55% 0px', threshold: [0, 1] });
    alvos.forEach(a => window.__rpIO.observe(a));
  }
  if (!window.__rpOuvintes) {
    window.__rpOuvintes = true;
    let t = 0;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { if (document.getElementById('plano') && typeof montarPlano === 'function') montarPlano(); }, 120); });
    window.addEventListener('scroll', () => { if (window.__rpAtual) requestAnimationFrame(window.__rpAtual); }, { passive: true });
    // impressão: abre as listas recolhidas do plano
    window.addEventListener('beforeprint', () => { const p = document.getElementById('plano'); if (p) p.querySelectorAll('details').forEach(d => { if (!d.open) { d.open = true; d.dataset.impressao = '1'; } }); });
    window.addEventListener('afterprint', () => document.querySelectorAll('#plano details[data-impressao]').forEach(d => { d.open = false; delete d.dataset.impressao; }));
  }
  window.__rpAtual = atual;
  atual.id = null;
  atual();
}
function abrirPlano() {
  S.vista = 'plano'; S.boasVindas = false;
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
}
// importar caso: os botões do plano e do painel abrem o mesmo diálogo (arquivo ou dados colados; app.js)
