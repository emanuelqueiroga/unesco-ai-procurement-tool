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
    ['Como a equipe descreve o problema', x.olhando || '—'],
    ['Situação atual', c.problema || '—'],
    ['Impacto desejado', impactos || '—'],
    ['Resultado esperado e como medir', c.resultado || '—'],
    ['Linha de base', respP('linhaBase', tr(rotP(OPC.linhaBase, c.linhaBase)) || '—')],
    ['Alternativa sem IA comparada', tr(rotP(OPC.simNao, c.alternativa)) || '—'],
    ['Aplicações', tarefas || '—'],
    ['Quem usa', nomesP(OPC.usuarios, c.usuarios) || '—'],
    ['Quem é afetado', nomesP(OPC.afetados, c.afetados) || '—'],
    ['O que se faz com a resposta', respP('consequencias', nomesP(OPC.consequencias, c.consequencias) || '—')],
    ['Frequência de uso', respP('frequencia', tr(rotP(OPC.frequencia, c.frequencia)) || '—')],
    ['Prova de conceito ou piloto', nomesC('testes', testes) || '—'],
  ];
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
  sec({ id: 'resumo', h: TIT_PLANO.resumo, kv: linhasResumo });
  // ferramentas (2.3.3): a primeira da lista é a principal
  if (ferr.length) {
    const preco = f => f.pagamento === 'consumo' ? '—' : +f.preco > 0 ? din(+f.preco, 2) : (typeof recPagaFerr === 'function' && recPagaFerr(f) ? tr('sem preço informado') : '—');
    sec({ sub: true, h: 'Ferramentas', table: { head: ['Ferramenta', 'Tarefas', 'Tipo de tecnologia', 'Pagamento', 'Preço por usuário por mês'],
      rows: ferr.map((f, i) => [f.nome + (i === 0 ? ' (' + tr('principal') + ')' : ''), (f.tarefas || []).map(k => tarefaNome(c, k)).filter(Boolean).join('; ') || '—',
        tr(rotP(OPC.tipoTec, f.tipoTec)) || '—', tr(rotP(OPC.pagamento, f.pagamento)) || '—', preco(f)]), b0: true, num: [4] } });
  }
  if (linhasEt.length) sec({ sub: true, h: 'Etapas, escolas e estudantes', table: { head: ['Etapa de ensino', 'Escolas', 'Estudantes por ano ou série', 'Estudantes'], rows: linhasEt, num: [1, 3] } });

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
  sec({ id: 'A1', h: tituloSec('A1'), p: a1p.concat((rec.motivos || []).length ? ['Por quê:'] : []), list: (rec.motivos || []).map(m => capP(tr(m)) + '.'),
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
    sec({ id: 'A2', h: tituloSec('A2'), pre: padrao ? ['Estimativa baseada em premissas padrão: ' + d.faltas.length + ' perguntas ainda sem resposta.'] : null, kv, kpis: true, pos: ['Valores ilustrativos. Substitua por cotações e dados locais.'] });
    formula.forEach(f => sec(Object.assign({}, f, { sub: true, id: undefined })));
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
    const fazer = ['nao', 'parcial', 'nao_sei'].includes(v) ? ACOES_G[q.id] || '' : v === 'sim' ? 'Manter e revisar periodicamente.' : 'Responder no passo 1.3.';
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
    const extra = [tr('Linha de base informada:') + ' ' + (tr(rotP(OPC.linhaBase, c.linhaBase)) || '—') + '.'];
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
  return S_;
}

// Tradução só dos campos de conteúdo (ids, tipos e alvos de navegação ficam como estão)
function trSecao(s) {
  const o = Object.assign({}, s);
  ['h', 'det', 'alt'].forEach(k => { if (o[k]) o[k] = tr(o[k]); });
  ['pre', 'p', 'list', 'pos'].forEach(k => { if (o[k]) o[k] = o[k].map(z => tr(z)); });
  if (o.kv) o.kv = o.kv.map(([k, v]) => [tr(k), tr(v)]);
  if (o.table) o.table = Object.assign({}, o.table, { head: o.table.head.map(z => tr(z)), rows: o.table.rows.map(r => r.map(z => tr(z))) });
  return o;
}

// ----------------------------------------------------------- página
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
  return `<div class="tw"><table class="pilha"><thead><tr>${t.head.map((h, j) => `<th${num.includes(j) ? ' class="n"' : ''}>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) =>
    `<tr${(t.hl || []).includes(i) ? ' class="hl"' : ''}>${r.map((v, j) => `<td${num.includes(j) ? ' class="n"' : ''}${v === '' || v == null ? ' data-vazio' : ''} data-th="${esc(t.head[j] || '')}">${(t.b0 || t.grupo) && j === 0 && v ? `<b>${celP(v)}</b>` : celP(v, (t.marca || []).includes(j))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function htmlCorpoP(s) {
  let h = '';
  (s.pre || []).forEach(x => { h += `<p class="kpi-nota">${linkP(x)}</p>`; });
  if ((s.kv || []).length) {
    h += s.kpis ? `<div class="kpis kpis3">${s.kv.map(([k, v]) => `<div class="kpi"><span class="v">${esc(v)}</span><span class="l">${esc(k)}</span></div>`).join('')}</div>`
      : `<div class="tw"><table><tbody>${s.kv.map(([k, v]) => `<tr><th style="width:32%">${esc(k)}</th><td>${linkP(v)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  (s.p || []).forEach(x => { h += `<p>${linkP(x)}</p>`; });
  if ((s.list || []).length) h += `<ul class="req">${s.list.map(x => `<li>${linkP(x)}</li>`).join('')}</ul>`;
  h += htmlTabelaP(s.table);
  (s.pos || []).forEach(x => { h += `<p class="note">${linkP(x)}</p>`; });
  return h;
}
// Figura 1 (p. 11) de Krueger e Jackson (2026), reproduzida sem alterações; legenda e crédito abaixo
function htmlFiguraP(s) {
  if (typeof FIG_TCO === 'undefined' || !FIG_TCO) return '';
  return `<figure class="fig-tco" id="plano-fig-tco" data-fig="tco" style="margin:16px 0 8px;max-width:720px">
    <h4 style="margin:0 0 8px">${esc(s.h)}</h4>
    <img src="${FIG_TCO}" alt="${esc(s.alt || '')}" width="900" height="1225" decoding="async" style="display:block;width:100%;height:auto;border:1px solid var(--line,#DDE3E9);background:#fff">
    <figcaption class="note" style="margin-top:8px">${linkP((s.pos || [])[0] || '')}</figcaption>
  </figure>`;
}
function renderPlano() {
  const secs = secoesPlano().map(trSecao);
  const c = S.caso, data = new Date().toLocaleDateString(LOC());
  let out = '', aberta = false;
  const fecha = () => { if (aberta) { out += '</section>'; aberta = false; } };
  secs.forEach(s => {
    if (s.tipo === 'faltas') {
      out += `<div class="parcial" id="plano-faltas"><p><b>${esc(s.p[0])}</b> ${esc(s.p[1] || '')}</p><ul class="req">${s.list.map((x, i) => `<li><span>${esc(x)}</span> ${s.irs[i] ? `<button type="button" class="link" data-ir="${esc(s.irs[i])}">${esc(tr('Responder'))}</button>` : ''}</li>`).join('')}</ul></div>`;
      return;
    }
    if (s.tipo === 'bloco') { fecha(); out += `<div class="bloco-faixa" data-bloco="${s.id}" role="heading" aria-level="2">${esc(s.h)}</div>`; return; }
    if (s.tipo === 'figura') { out += htmlFiguraP(s); return; }
    if (s.sub) {
      if (s.det) out += `<details class="mais"><summary>${esc(s.det)}</summary>${htmlCorpoP(s)}</details>`;
      else out += `<h4>${esc(s.h)}</h4>${htmlCorpoP(s)}`;
      return;
    }
    fecha(); aberta = true;
    if (s.id === 'recs' && typeof htmlRecs === 'function' && typeof recomendacoesCaso === 'function') {
      // na página, a lista com "Ir à pergunta" (a tabela da seção serve ao PDF e às exportações)
      let R = null;
      try { R = recomendacoesCaso(); } catch (e) { console.warn(e); }
      if (R) { out += `<section class="res-sec" id="plano-recs" data-sec="recs"><h3><span>${esc(s.h)}</span></h3>${htmlRecs(R, { intro: R.length ? TXT_REC.introPlano : '' })}`; return; }
    }
    const num = /^[AB]\d$/.test(s.id) ? s.id : '';
    const tit = num ? s.h.replace(/^[AB]\d\.\s*/, '') : s.h;
    out += `<section class="res-sec" id="plano-${s.id}" data-sec="${s.id}"><h3>${num ? `<span class="sn">${num}</span>` : ''}<span>${esc(tit)}</span></h3>${htmlCorpoP(s)}`;
  });
  fecha();
  const exp = CAP.downloads ? `<button class="btn" type="button" data-act="exp-json">Exportar caso (.json)</button>` : `<button class="btn" type="button" data-act="copiar-json">Copiar dados do caso</button>`;
  return `<section class="resumo plano" id="plano">
    <div class="res-topo">
      <div><div class="eyebrow">Plano de contratação</div><h2>${esc(c.titulo || (S.ctx || {}).olhando || tr('Caso sem título'))}</h2>
        <p class="muted">${[(S.ctx || {}).local, data].filter(Boolean).map(esc).join(' · ')}</p></div>
      <div class="row"><button type="button" class="btn pri grande" data-act="pdf">Baixar PDF</button><button type="button" class="btn" data-act="voltar-percurso">Voltar ao percurso</button>
        ${exp}<button class="btn" type="button" data-act="copiar">Copiar texto</button>
        <button class="btn" type="button" data-act="imp-json">Importar caso</button></div>
    </div>
    <p class="note faixa-plano">${esc(FAIXA_PLANO)}</p>
    ${out}
  </section>`;
}
function abrirPlano() {
  S.vista = 'plano'; S.boasVindas = false;
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
}
// importar caso: os botões do plano e do painel abrem o mesmo diálogo (arquivo ou dados colados; app.js)
