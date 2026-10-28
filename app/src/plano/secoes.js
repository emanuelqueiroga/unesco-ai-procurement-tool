// =====================================================================
// Plano de contratação: seções (dados) da página e do PDF. Porte puro de src/resumo.js da v13 (dadosPlano,
// secoesPlano, painelPlano, secaoMatriz, trSecao e os utilitários de que dependem); a parte HTML (renderPlano,
// htmlTabelaP, gráficos em SVG, CSS) fica fora: a interface nova desenha as seções.
// Reimplementação: a global S virou o parâmetro `estado` ({ caso, ctx, resp, respC, respDet, custo, moeda, exemplo,
// feitos, ... }); o estado nunca é mutado (cfgAtual e matrizCaso recebem uma cópia com custo.cfg clonada).
// A Figura 1 (FIG_TCO na v13) entra por opts.figura: false a omite; uma data URI vai junto em `img`.
// Os textos em português são as chaves de tradução: ficam byte a byte iguais aos da v13 e passam por tr() como lá.
//
// Cada seção: { tipo: 'faltas' | 'bloco' | 'figura' | 'perfil', id, h, sub, kv, kpis, p, list, table, pos, det,
//   soPagina, irs, pre, graf, eq, principal, cartoes, fatos, mx, intro, alt, img, pagina }
//   table: { head, rows, num, grupo, b0, hl, marca, larg, negrito }
//
// v14 (páginas do plano novo): cada seção tem `pagina`, uma de PAGINAS_PLANO, nesta ordem:
//   resumo   Em resumo     resumo do caso, números-chave, recomendação principal (painelPlano)
//   custa    Quanto custa  estimativa, lista das sete camadas, dotação por exercício, fórmula e premissas
//   fazer    O que fazer   recomendações e ações, plano do teste, próximos passos
//   exigir   O que exigir  arranjo de aquisição, diligência, cláusulas, requisitos de dados, saída
//   apendice Apêndice      perfil do caso, matriz camadas × fases, Figura 1, referências, respostas que faltam
// As subseções (sub: true) seguem a página da seção acima delas, salvo as indicadas abaixo.
//
//   seção                                                    página     por quê
//   -------------------------------------------------------  ---------  -------------------------------------------
//   faltas    Respostas que faltam                           apendice   lista no fim (o aviso "Plano parcial" fica
//                                                                       no Em resumo, via painelPlano().faltas)
//   resumo    Resumo do caso (fatos, kv, cartões)            resumo     fatos do caso do Em resumo
//   perfil    Perfil do caso (v14, cartões por área)         apendice   perfil completo do caso
//     sub     Ferramentas; Etapas, escolas e estudantes      apendice   tabelas do perfil
//   matriz    O que cada fase exige, por camada              apendice   matriz camadas × fases
//   recs      Recomendações para você                        fazer      ações priorizadas
//   A         bloco "Custo e compra"                         custa      (faixa; o PDF novo não a desenha)
//   A1        Prova de conceito ou piloto (+ instrumentos)   fazer      plano do teste; a frase principal vai ao
//                                                                       Em resumo (painelPlano().principal)
//   A2        Custo estimado (+ fórmula, camadas, dotação,   custa      estimativa e premissas
//             premissas)
//   A3        Lista de verificação pelas sete camadas        custa      lista das sete camadas
//     sub     Pontos de atenção de custo neste caso          custa
//     figura  Quadro de custo total em camadas (fig-tco)     apendice   Figura 1 de Krueger e Jackson (2026)
//   A4        Arranjo de aquisição (+ todos os arranjos)     exigir     arranjo de aquisição
//   A5        Requisitos e cláusulas de custo e compra       exigir     cláusulas do contrato
//   A6        Dependência e saída (+ pacote de transição)    exigir     saída
//   A7        Documentos do dossiê a preparar                exigir     o que exigir no processo
//   B         bloco "Política e governança"                  fazer      (faixa; o PDF novo não a desenha)
//   B1        Governança da rede (camada 1)                  fazer      ações de governança ("O que fazer")
//   B2        Funções que não podem ser terceirizadas        fazer      nomear responsáveis
//   B3        Regras da prova de conceito ou do piloto       fazer      plano do teste
//   B4        Capacidade mínima nos locais                   fazer      plano do teste
//   B5        Perfil de risco e premissas (+ supervisão,     exigir     diligência proporcional ao risco
//             pontos de atenção, nota normativa)
//   B6        Dados, verificação e contestação (+ requisitos exigir     requisitos de dados e cláusulas de dados
//             e cláusulas de dados, contestação)
//   B7        Antes de levar à rede e para manter (+ listas) fazer      próximos passos
//   B8        Monitoramento e avaliação                      fazer      próximos passos
//   B9        Critérios dos pontos de decisão do guia        fazer      próximos passos (decisões)
//   premissas Premissas e fontes (+ premissas desta          apendice   0.0.15: anexo G (REL-13)
//             estimativa, como o modelo funciona hoje)
//   glossario Glossário                                      apendice   0.0.15: anexo H (REL-14)
//   refs      Referências                                    apendice   referências
// 0.0.15 (REL-01 a REL-12, MOT-03, MOT-04): A2 ganha "Custo por fase", "Indicadores do custo total", a adoção e o bloco
// "O que pode mudar o custo" (cenários, direcionadores, simulação); os títulos não levam mais os códigos A1–A7 e
// B1–B9 nem os subcomponentes K (só internos: o id da seção); a seção "resumo" leva o sumário executivo em `sumario`
// (dados de plano/relatorio.js, já traduzidos), lido pela página e pelo PDF.
// Dentro de uma página, a ordem é a do array (a da v13); no apêndice, "Respostas que faltam" vai para o fim.
// =====================================================================
import {
  TIT_PLANO, URL_TCO, REFS_PLANO, REF_CURTA, RECS, ACOES_G, PRIORIDADE_G, RESP_G_NOME, FUNCOES_INTERNAS, A3_CAMADAS, CAMADA_DE_S_PLANO,
  NOTA_CONVENCAO, NOTA_SAIDA, A3_ALERTAS, TXT_A1, TXT_A1_POC, TXT_A4, TXT_A5, FIG_LEGENDA, FIG_TITULO, FIG_ALT, TXT_B1_REF, TXT_B8_REF,
  recAfeta, recDadosPessoais, recGratuito,
  OPC, recomendarTeste, NIVEL_NOME, NIVEL_CRIT, DIMENSOES, FORMAS_SUP, formaSupervisao, alertas, anexoIII, CONTRATO, PACOTE, LOCKIN, DOSSIE,
  DADOS_REQ, CONTESTACAO, SUPERVISAO, MUDANCA, SEVERIDADE, METRICAS, PDS, extrasPD, fmtInt,
  clone, somaPorCamada, compLicenca, CAMADA_DE_S, NOME_S,
  fatoresAdaptacao, PRIORIDADES, problemasMarcados, temLacuna,
  FASES, CAMADAS, NIVEIS_ADM, QUESTOES_G,
  tr, LOC, TXT_VINCULO, TXT_ISENCAO,
  din, mil, grande, pct, unidMil,
  secaoFormula,
  respondido, etapasAtivas, alunosEtapa, totaisCtx, faltasTodas, numerosCusto, premissasUnitarias, casoAtual, perfil, cfgAtual,
  FASES_MATRIZ, CREDITO_MATRIZ, TIT_MATRIZ, NOTA_MATRIZ_CUSTO, matrizCaso,
  recTestes, recTesteDe, recFerramentas, recPagaFerr, recomendacoesCaso, secaoRecomendacoes,
} from '../domain/index.ts';
// critérios compartilhados com a página (P3): lacunas nas duas classes e "sem números" até dizer o tipo de tecnologia (2.3.4)
import { lacunasDe, temNumeros, tituloParcial, textoLacunas, rotuloResposta, campoDoNumero } from '../percurso/painel.ts';
// 0.0.15 (BL6): sumário executivo, tabelas novas de "Quanto custa", premissas e glossário (plano/relatorio.js)
import {
  R as R15, trN, TXT_REL, relDados, relFaixa, relIndicadores, relDirecionadores, relIcebergs, relTabelaFases, relIndicadoresTCO,
  relAdocao, relCenarios, relTornado, relSimulacao, relAchados, relExecutivo, relAcoes, relPremissas, relGlossario,
} from './relatorio.js';

const NOME_FERRAMENTA = 'AI in Education Procurement Tool';
// REL-08: o multiplicador do nível de adaptação, sem os códigos K3.1 e K3.2
const TXT_MULT = 'Multiplicadores do nível de adaptação: {0} na integração e no desenvolvimento; {1} no conteúdo e na configuração iniciais (convenção ilustrativa da ferramenta).';

// ----------------------------------------------------------- páginas do plano (v14)
const PAGINAS_PLANO = ['resumo', 'custa', 'fazer', 'exigir', 'apendice'];
// títulos das páginas (chaves de tradução; as mesmas da interface)
const TIT_PAGINAS = { resumo: 'Em resumo', custa: 'Quanto custa', fazer: 'O que fazer', exigir: 'O que exigir', apendice: 'Apêndice' };
// página de cada seção de primeiro nível (tabela no cabeçalho do arquivo)
const PAGINA_SECAO = {
  faltas: 'apendice', resumo: 'resumo', perfil: 'apendice', matriz: 'apendice', recs: 'fazer',
  A: 'custa', A1: 'fazer', A2: 'custa', A3: 'custa', A4: 'exigir', A5: 'exigir', A6: 'exigir', A7: 'exigir',
  B: 'fazer', B1: 'fazer', B2: 'fazer', B3: 'fazer', B4: 'fazer', B5: 'exigir', B6: 'exigir', B7: 'fazer', B8: 'fazer', B9: 'fazer',
  premissas: 'apendice', glossario: 'apendice', refs: 'apendice',
};
// seções de uma página, na ordem do plano; no apêndice, as respostas que faltam ficam no fim
function secoesDaPagina(secs, pagina) {
  const L = (secs || []).filter(s => s && s.pagina === pagina);
  return pagina === 'apendice' ? L.filter(s => s.tipo !== 'faltas').concat(L.filter(s => s.tipo === 'faltas')) : L;
}

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
// v14: introdução da seção "Perfil do caso" (o mesmo texto do PDF da v12)
const TIT_PERFIL = 'Perfil do caso';
const INTRO_PERFIL = 'As respostas deste caso, por área. Um traço indica uma pergunta ainda sem resposta.';

// ----------------------------------------------------------- v13: prioridades, problemas, detalhes e matriz do caso
// Estado do passo 1.2 (estado.ctx.prioridades, problemas, subs, problemaOutro), detalhe da linha de base
// (estado.caso.linhaBase*) e das 1.3.x (estado.respDet[id].qual|falta). Leitura defensiva: casos antigos não têm esses campos.
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
  return PRIORIDADES.filter(p => ids.includes(p.id));
}
function problemasCaso(x) { return problemasMarcados(x || {}); }
// "Problema (subcategoria; subcategoria)." por problema marcado, já traduzido
function problemasCasoTxt(x) {
  const subs = new Set((x || {}).subs || []);
  return problemasCaso(x).map(q => {
    const ss = (q.sub || []).filter(([id]) => subs.has(id)).map(([, t]) => tr(t));
    return semPontoP(tr(q.t)) + (ss.length ? ' (' + ss.join('; ') + ')' : '') + '.';
  });
}
function detalheGov(id, estado) {
  const d = ((estado && estado.respDet) || {})[id] || {};
  return { qual: String(d.qual || '').trim(), falta: String(d.falta || '').trim() };
}
// Resposta de uma 1.3.x com o detalhe ("Qual?" com Sim ou Em parte; "O que falta?" com Em parte), em linhas
function govValorP(id, estado) {
  const v = (estado.resp || {})[id];
  if (!v) return '—';
  const d = detalheGov(id, estado), L = [tr(RESP_G_NOME[v] || v)];
  if (['sim', 'parcial'].includes(v) && d.qual) L.push(tr('Qual:') + ' ' + d.qual);
  if (v === 'parcial' && d.falta) L.push(tr('O que falta:') + ' ' + d.falta);
  return L.join('\n');
}
// Linha de base (1.2.7) com os problemas e a medida informados
function linhaBaseP(c, x, estado) {
  const r = respP('linhaBase', tr(rotP(OPC.linhaBase, c.linhaBase)) || '—', estado);
  if (r === '—' || !['sim', 'parcial'].includes(c.linhaBase)) return r;
  const ids = c.linhaBaseProblemas || [];
  const ps = problemasCaso(x).filter(q => ids.includes(q.id)).map(q => semPontoP(tr(q.t)));
  const para = ps.length ? ps.join('; ') : String(c.linhaBaseProblemaTxt || '').trim();
  const med = String(c.linhaBaseMedida || '').trim();
  return [r, para ? tr('Para quais problemas:') + ' ' + para : '', tr('Medida:') + ' ' + (med || tr('não informada'))].filter(Boolean).join('\n');
}
// Matriz do caso (RQ-03, RQ-20): camadas × fases com texto, perguntas, estado e custo; soma das células = total do ciclo
function secaoMatriz(estado) {
  let M = null;
  try { M = matrizCaso(copiaEstado(estado)); } catch (e) { console.warn(e); return null; }
  const fases = FASES_MATRIZ.map((f, i) => { const z = FASES.find(y => y.id === f) || {}; return { id: f, n: z.n || i + 1, nome: z.nome || f }; });
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
// cópia rasa do estado com custo.cfg clonada: cfgAtual e matrizCaso gravam a cfg em estado.custo (como no legado)
function copiaEstado(estado) {
  const e = Object.assign({}, estado || {});
  if (e.custo) e.custo = Object.assign({}, e.custo, { cfg: e.custo.cfg ? clone(e.custo.cfg) : null });
  return e;
}
const rotP = (lista, v) => ((lista || []).find(o => String(o[0]) === String(v)) || ['', ''])[1];
const nomesP = (lista, vals) => (vals || []).map(v => tr(rotP(lista, v) || v)).filter(Boolean).join('; ');
const capP = s => { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };
const numP = (x, d = 1) => (+x || 0).toLocaleString(LOC(), { maximumFractionDigits: Math.abs(+x || 0) < 1 && d > 0 ? 2 : d, minimumFractionDigits: 0 });
function respP(campo, v, estado) { try { return respondido(campo, estado) ? v : '—'; } catch (e) { return v; } }
function slugPlano(estado) {
  const c = (estado && estado.caso) || {};
  const b = String(c.titulo || ((estado && estado.ctx) || {}).olhando || 'case').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
  return b || 'case';
}
// 2.0 (v11, múltipla): 'poc' | 'piloto' | 'ambos' | 'recomendar' | ''
function testeEscolhido(c) { return recTesteDe(c); }
// teste que vem primeiro: com os dois marcados, a prova de conceito
function testeEfetivo(c, rec) { const t = testeEscolhido(c); const m = rec && rec.modo; return t === 'ambos' ? 'poc' : ['poc', 'piloto'].includes(t) ? t : m === 'ambos' ? 'poc' : m || 'piloto'; }
// rótulos das opções de um campo (OPC pelo nome do campo, v11)
const opcDe = id => OPC[id] || (id === 'testes' ? OPC.teste : null) || [];
const rotC = (id, v) => tr(rotP(opcDe(id), v)) || '';
const nomesC = (id, vals) => nomesP(opcDe(id), vals);
const plural = (n, um, varios) => tr((+n === 1 ? um : varios).replace('{0}', fmtInt(n)));
const tarefaNome = (c, k) => k === 'outra' && c.tarefaOutra ? c.tarefaOutra : tr(rotP(OPC.tarefas, k));
function ferramentasCaso(c) { return recFerramentas(c); }
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
function camadaDeS(s) { return (CAMADA_DE_S || CAMADA_DE_S_PLANO)[s] || 7; }
function nomeCamada(n) {
  const x = (CAMADAS || []).find(z => (Array.isArray(z) ? z[0] : z.n) === n);
  return x ? (Array.isArray(x) ? x[1] : x.nome) : '';
}
const rotuloCamada = n => n + '. ' + tr(nomeCamada(n));
function govQuestoes() {
  if (QUESTOES_G && QUESTOES_G.length) return QUESTOES_G;
  return Object.keys(ACOES_G).map((id, i) => ({ id, n: '1.3.' + (i + 1), t: id }));
}

// Tudo o que o plano precisa, calculado uma vez. `E` é a cópia do estado usada nas funções que gravam a cfg.
function dadosPlano(estado) {
  const E = copiaEstado(estado);
  const c = E.caso || {}, x = E.ctx || {}, t = totaisCtx(E.ctx);
  const ce = casoAtual(E), p = perfil(E);
  let rec = { modo: 'piloto', motivos: [] };
  try { rec = recomendarTeste(ce) || rec; } catch (e) { console.warn(e); }
  let cfg = null, custo = null;
  try { cfg = cfgAtual(E); } catch (e) { console.warn(e); }
  try { if (cfg) { custo = numerosCusto(cfg); if (custo && !custo.camadas) custo.camadas = somaPorCamada(custo.av); } } catch (e) { console.warn(e); custo = null; }
  // v14: sem o tipo de tecnologia (2.3.4) não há números, como na página ("Ainda sem números")
  let semNumeros = false;
  try { semNumeros = !temNumeros(estado); } catch (e) { console.warn(e); }
  if (semNumeros) custo = null;
  const arq = ['saas', 'api', 'ow'].includes(ce.arquitetura) ? ce.arquitetura : 'saas';
  const modo = testeEfetivo(c, rec), teste = testeEscolhido(c);
  let faltas = [];
  try { faltas = faltasTodas(E) || []; } catch (e) { console.warn(e); }
  let lacunas = { essencial: 0, refino: 0, total: 0, itens: [] };
  try { lacunas = lacunasDe(estado); } catch (e) { console.warn(e); }
  let recs = [];
  try { recs = recomendacoesCaso(E) || []; } catch (e) { console.warn(e); }
  // PLA-19: "nao_sei" e outros valores crus nunca chegam ao "Por quê"
  recs = recs.map(r => { const pq = r.porque; if (!pq || !pq.resposta) return r; const campo = campoDoNumero(pq.n); return Object.assign({}, r, { porque: Object.assign({}, pq, { resposta: String(pq.resposta).split('; ').map(z => rotuloResposta(campo, z)).join('; ') }) }); });
  return { E, c, x, t, ce, p, rec, cfg, custo, arq, modo, teste, recs, poc: modo === 'poc' && teste !== 'ambos' && !(['recomendar', ''].includes(teste) && rec.modo === 'ambos'),
    ambos: teste === 'ambos' || (['recomendar', ''].includes(teste) && rec.modo === 'ambos'), faltas, lacunas, semNumeros,
    afeta: recAfeta(ce), dp: recDadosPessoais(ce), gratis: recGratuito(ce) };
}

// ----------------------------------------------------------- seções (PDF e página)
// opts: { figura?: false | string (data URI da Figura 1) }
function secoesPlano(estado, opts) {
  opts = opts || {};
  const d = dadosPlano(estado);
  const { E, c, x, t, ce, p, rec, custo, arq, cfg } = d;
  const S_ = [];
  let pagAtual = 'resumo';
  // página: a da tabela PAGINA_SECAO para seções de primeiro nível; subseções herdam a da seção acima
  const sec = o => {
    if (!o.pagina) o.pagina = o.sub ? pagAtual : (PAGINA_SECAO[o.id] || pagAtual);
    if (!o.sub) pagAtual = o.pagina;
    S_.push(o); return o;
  };
  // REL-08: sem os códigos A1–A7 e B1–B9 no título (o código fica só no id da seção)
  const tituloSec = id => TIT_PLANO[id];

  // Respostas que faltam: as lacunas do Essencial (uma por tela) e as de refinamento, a mesma contagem da página
  if (d.lacunas.total) {
    sec({ tipo: 'faltas', id: 'faltas', h: TIT_PLANO.faltas, nEss: d.lacunas.essencial, nRef: d.lacunas.refino,
      p: [tituloParcial(d.lacunas), textoLacunas(d.lacunas), 'O plano já pode ser usado; as seções que dependem dessas respostas usam premissas e dizem isso.'],
      list: d.lacunas.itens.map(f => (f.n ? f.n + ' ' : '') + f.texto), irs: d.lacunas.itens.map(f => f.href) });
  }

  // 0. Resumo do caso
  const etapas = etapasAtivas(x);
  const linhasEt = etapas.map(e => {
    const et = (x.etapas || {})[e[0]] || {};
    const anos = (e[3] || []).length && !et.soTotal ? e[3].map((a, i) => tr(a) + ': ' + fmtInt((et.anos || [])[i] || 0)).join('; ') : '—';
    return [tr(e[1]), et.escolas ? fmtInt(et.escolas) : '—', anos, fmtInt(alunosEtapa(x, e[0]))];
  });
  if (linhasEt.length > 1) linhasEt.push([tr('Total'), fmtInt(t.escolas), '', fmtInt(t.alunos)]);
  const nivel = x.nivel === 'outro' ? (x.nivelOutro || tr('Outro')) : tr(rotP(NIVEIS_ADM, x.nivel));
  const tarefas = (c.tarefas || []).map(k => k === 'outra' && c.tarefaOutra ? c.tarefaOutra : tr(rotP(OPC.tarefas, k))).filter(Boolean).join('; ');
  const impactos = (c.impactos || []).map(k => k === 'outro' && c.impactoOutro ? c.impactoOutro : tr(rotP(OPC.impactos, k))).filter(Boolean).join('; ');
  const pl = c.piloto || {}, pc = c.poc || {};
  const arqTxt = tr(rotP(OPC.arquitetura, arq)) + (ce.__arqPresumida ? ' (' + tr('deduzida das respostas') + ')' : '');
  const testes = recTestes(c);
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
    ['Situação', respP('situacao', tr(rotP(OPC.situacao, c.situacao)) || '—', E)],
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
    ['Resultado esperado e como medir', c.resultado ? c.resultado + (temLacuna(c.resultado) ? '\n(' + tr(AVISO_LACUNA_P) + ')' : '') : '—'],
    ['Linha de base', linhaBaseP(c, x, E)],
    ['Alternativa sem IA comparada', tr(rotP(OPC.simNao, c.alternativa)) || '—'],
  );
  govQuestoes().forEach(q => { if (ROT_GOV[q.id]) linhasResumo.push([ROT_GOV[q.id], govValorP(q.id, E)]); });
  linhasResumo.push(
    ['Aplicações', tarefas || '—'],
    ['Quem usa', nomesP(OPC.usuarios, c.usuarios) || '—'],
    ['Quem é afetado', nomesP(OPC.afetados, c.afetados) || '—'],
    ['O que se faz com a resposta', respP('consequencias', nomesP(OPC.consequencias, c.consequencias) || '—', E)],
    ['Frequência de uso', respP('frequencia', tr(rotP(OPC.frequencia, c.frequencia)) || '—', E)],
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
    ['Tempo para chegar a todos depois da implantação', respP('expansao', rotC('expansao', c.expansao) || '—', E)],
    ['Horizonte da estimativa', respP('horizonte', tr(rotP(OPC.horizonte, c.horizonte)) || '—', E)],
  );
  // ferramentas (2.3.3): a primeira da lista é a principal
  let tabFerr = null, tabEt = null;
  if (ferr.length) {
    const preco = f => f.pagamento === 'consumo' ? '—' : +f.preco > 0 ? din(+f.preco, 2) : (recPagaFerr(f) ? tr('sem preço informado') : '—');
    tabFerr = { head: ['Ferramenta', 'Tarefas', 'Tipo de tecnologia', 'Pagamento', 'Preço por usuário por mês'],
      rows: ferr.map((f, i) => [f.nome + (i === 0 ? ' (' + tr('principal') + ')' : ''), (f.tarefas || []).map(k => tarefaNome(c, k)).filter(Boolean).join('; ') || '—',
        tr(rotP(OPC.tipoTec, f.tipoTec)) || '—', tr(rotP(OPC.pagamento, f.pagamento)) || '—', preco(f)]), b0: true, num: [4] };
  }
  if (linhasEt.length) tabEt = { head: ['Etapa de ensino', 'Escolas', 'Estudantes por ano ou série', 'Estudantes'], rows: linhasEt, num: [1, 3] };
  // v12: os mesmos pares agrupados por área (cartões do perfil do caso) e os fatos do caso (fichas do "Em resumo").
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
    ['Escala', [+c.elegiveis > 0 ? plural(c.elegiveis, '{0} pessoa', '{0} pessoas') : '', respP('expansao', rotC('expansao', c.expansao) || '', E)].filter(z => z && z !== '—').join(' · ')],
  ].filter(([, v]) => v);
  sec({ id: 'resumo', h: TIT_PLANO.resumo, kv: linhasResumo, cartoes, fatos });
  // v14: o perfil do caso (cartões por área) como seção própria do apêndice; o kv continua em "resumo"
  sec({ tipo: 'perfil', id: 'perfil', h: TIT_PERFIL, p: [INTRO_PERFIL], cartoes });
  if (tabFerr) sec({ sub: true, h: 'Ferramentas', table: tabFerr });
  if (tabEt) sec({ sub: true, h: 'Etapas, escolas e estudantes', table: tabEt });

  // v13: matriz do caso (camadas × fases), logo depois de "Em resumo" (RQ-03, RQ-20)
  const sMx = secaoMatriz(E);
  if (sMx) sec(sMx);

  // Recomendações para o seu caso (v10, recomendacoes.js): primeira seção depois do resumo, antes dos blocos A e B
  try { sec(secaoRecomendacoes(d.recs, E)); } catch (e) { console.warn(e); }

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
  let premLista = [], rel = null;
  if (custo) {
    rel = relDados(estado, { cfg, custo });
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
    try { const f = secaoFormula(cfg); formula = (Array.isArray(f) ? f : f ? [f] : []).filter(Boolean); } catch (e) { console.warn(e); formula = []; }
    let unit = [];
    if (!formula.length) {
      try { unit = premissasUnitarias(E, cfg); } catch (e) { console.warn(e); }
      if (unit.length) unit.forEach(z => prem.push(z)); else prem.push(tr('Premissas de partida:') + ' ' + tr(PRESET_ARQ[arq]) + '.');
    }
    if (c.adaptacao) {
      let f = { fK31: 1, fK32: 1 };
      try { f = fatoresAdaptacao(c.adaptacao, { saas: 'A', api: 'B', ow: 'C' }[arq]) || f; } catch (e) { }
      prem.push(tr('Nível de adaptação:') + ' ' + tr(rotP(OPC.adaptacao, c.adaptacao)) + '. ' + trN(TXT_MULT, numP(f.fK31, 2), numP(f.fK32, 2)));
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
    const padrao = d.lacunas.total > 8;
    // v12: números para os KPIs e os gráficos do "Em resumo" (página e PDF)
    const graf = { tot0, total: custo.total, anual: custo.anual, porUsuario: custo.porAluno, totCamadas: tot, H,
      camadas: { ano0: [1, 2, 3, 4, 5, 6, 7].map(n => cam.ano0[n] || 0), total: [1, 2, 3, 4, 5, 6, 7].map(n => cam.total[n] || 0) },
      anos: anos.slice(), dot: anos.map(a => custo.orc.dot[a] || 0) };
    sec({ id: 'A2', h: tituloSec('A2'), pre: padrao ? ['Estimativa baseada em premissas padrão: ' + d.lacunas.total + ' perguntas ainda sem resposta.'] : null, kv, kpis: true, graf, pos: ['Valores ilustrativos. Substitua por cotações e dados locais.'] });
    // a primeira parte da fórmula ("Como o custo é calculado") tem kv = termos + total: na página vira a equação do passo 4.2
    formula.forEach((f, i) => sec(Object.assign({}, f, { sub: true, id: undefined }, i === 0 && (f.kv || []).length > 1 ? { eq: true } : {})));
    // REL-12: na página, as tabelas que repetem um gráfico ao lado (barras por camada, colunas da dotação) ficam
    // recolhidas (recolher); no PDF ficam abertas
    sec({ sub: true, h: 'Custo por camada', recolher: true, table: { head: ['Camada', tr('Ano 0') + ' (' + unidMil() + ')', tr('Total do ciclo') + ' (' + unidMil() + ')', '%'],
      rows: [1, 2, 3, 4, 5, 6, 7].map(n => [rotuloCamada(n), mil(cam.ano0[n] || 0), mil(cam.total[n] || 0), pct(tot ? (cam.total[n] || 0) / tot : 0)])
        .concat([[tr('Total'), mil(tot0), mil(tot), pct(1)]]), num: [1, 2, 3] },
      pos: [NOTA_CONVENCAO] });
    if (rel) {
      // MOT-03: custo por fase (pagamento único × recorrente, pessoas); MOT-04: indicadores do custo total
      sec({ sub: true, pronto: true, h: R15('sFases'), table: relTabelaFases(rel), pos: [R15('fNotaMotor'), R15('fNota')] });
      sec({ sub: true, pronto: true, h: R15('sInd'), kv: relIndicadoresTCO(rel) });
      const ad = relAdocao(rel);
      sec({ sub: true, pronto: true, h: R15('gAdocaoT'), p: [ad.leitura], table: ad.table });
    }
    sec({ sub: true, h: 'Dotação a solicitar por exercício', recolher: true, table: { head: ['Exercício'].concat(anos.map(a => tr('Ano ' + a))),
      rows: [[tr('Dotação a solicitar') + ' (' + unidMil() + ')'].concat(anos.map(a => mil(custo.orc.dot[a] || 0)))], num: anos.map((a, i) => i + 1) } });
    if (rel) {
      // REL-10, REL-11: o que pode mudar o custo (cenários, direcionadores, simulação), em versão de leitura
      const ce3 = relCenarios(rel), to = relTornado(rel), si = relSimulacao(rel);
      sec({ sub: true, pronto: true, incerteza: true, h: R15('q3'), achado: R15('h3', grande(rel.lo), grande(rel.hi)), p: [R15('i3')] });
      sec({ sub: true, pronto: true, h: R15('sCenarios'), p: [ce3.leitura], table: ce3.table });
      sec({ sub: true, pronto: true, h: R15('sDirec'), p: [to.leitura], table: to.table, pos: [to.sub] });
      sec({ sub: true, pronto: true, h: R15('sSimula'), table: si.table, pos: [si.nota] });
    }
    // REL-13: a lista "Premissas desta estimativa" vai para o apêndice, com "Premissas e fontes"
    premLista = prem;
  } else {
    sec({ id: 'A2', h: tituloSec('A2'), semNumeros: d.semNumeros,
      p: [d.semNumeros ? 'Os números do plano aparecem quando você disser o tipo de tecnologia da ferramenta (pergunta 2.3.4).' : 'Não foi possível calcular a estimativa com as respostas atuais. Responda ao passo 2.3 (Adoção) e às fases 3 e 4.'] });
  }

  // A3
  const subsDe = n => Object.keys(CAMADA_DE_S || CAMADA_DE_S_PLANO).filter(s => camadaDeS(s) === n)
    .map(s => tr((NOME_S && NOME_S[s]) || s)).join('; ');   // REL-08: o nome do subcomponente, sem o código K
  const resp = E.resp || {};
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
    let cl = null; if (c.pagamento === 'institucional' && cfg) try { cl = compLicenca(clone(cfg)); } catch (e) { }
    a3alertas.push(tr(A3_ALERTAS.licencas) + (cl && cl.aEq ? ' ' + tr('Com as premissas atuais, a licença institucional só compensa com adoção acima de ' + pct(cl.aEq) + ' das pessoas elegíveis.') : ''));
  }
  sec({ id: 'A3', h: tituloSec('A3'), p: ['As sete camadas do quadro de Krueger e Jackson (2026, p. 11) e onde cada uma aparece na estimativa deste caso. As páginas citadas são do documento.'],
    table: { head: ['Camada', 'O que considerar', 'Onde está na estimativa', 'Neste caso'], rows: A3_CAMADAS.map(r => [rotuloCamada(r.n), r.considerar, subsDe(r.n) || '—', neste[r.n]]), b0: true, larg: [92, 150, 120] },
    pos: [NOTA_CONVENCAO, tr(REF_CURTA) + ' ' + URL_TCO] });
  if (['parcial', 'nao'].includes(c.internet) || ['parcial', 'nao'].includes(c.dispExistem)) a3alertas.push(A3_ALERTAS.base || 'Condições de base: em sistemas com poucos recursos, conectividade, dispositivos e energia podem ser o primeiro e maior custo (p. 7).');
  if (a3alertas.length) sec({ sub: true, h: 'Pontos de atenção de custo neste caso', list: a3alertas });
  // Figura 1 (p. 11): na v13, dentro de A3 (página) e numa página própria do PDF; na v14, no apêndice
  if (opts.figura !== false) sec({ tipo: 'figura', id: 'fig-tco', sub: true, h: FIG_TITULO, alt: FIG_ALT, pos: [FIG_LEGENDA], pagina: 'apendice',
    img: typeof opts.figura === 'string' ? opts.figura : undefined });

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
    const dg = detalheGov(q.id, E);
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

  // 0.0.15 (REL-13, REL-14): premissas e fontes, como o modelo funciona hoje e glossário, no apêndice
  const pr = relPremissas(estado);
  if (pr.table || premLista.length) {
    sec({ id: 'premissas', pronto: true, h: R15('aG'), p: pr.table ? [R15('pIntro')] : [], table: pr.table, pos: pr.table ? pr.pos : [] });
    if (premLista.length) sec({ sub: true, h: TXT_REL.pLista, list: premLista });
    sec({ sub: true, pronto: true, h: R15('metodos'), list: pr.metodos, pos: pr.versao ? [pr.versao] : [] });
  }
  const gl = relGlossario();
  if (gl) sec({ id: 'glossario', pronto: true, h: R15('aH'), p: [R15('gIntro')], table: gl });

  // 0.0.15 (REL-01 a REL-06, REL-08): sumário executivo de "Em resumo", na seção "resumo" (página e PDF)
  const nReq = linhasCl.length + destA5.length;
  const ex = { nReq, nSim, nG: gq.length };
  const ordemQ = q => { const i = ['antes_teste', 'antes_contratar', 'manter'].indexOf(q); return i < 0 ? 9 : i; };
  // a mesma ordem de "O que fazer" (percurso/painel.ts:recsPlano): prioridade alta primeiro, depois o momento
  const recsOrd = d.recs.slice().sort((a, b) => (a.prioridade === b.prioridade ? 0 : a.prioridade === 'alta' ? -1 : 1) || ordemQ(a.quando) - ordemQ(b.quando));
  const sRes = S_.find(z => z.id === 'resumo' && !z.sub);
  if (sRes) sRes.sumario = {
    numeros: !!rel, faixa: relFaixa(rel), indicadores: relIndicadores(rel), exec: relExecutivo(linhasResumo, rel, ex),
    acoes: relAcoes(d.recs.length ? recsOrd : [], 5), nRecs: d.recs.length, ice: relIcebergs(rel), drivers: relDirecionadores(rel, 3),
    achados: relAchados(rel, ex),
  };

  // Referências
  sec({ id: 'refs', h: TIT_PLANO.refs, list: [REFS_PLANO[0], tr(REFS_PLANO[1]) + ' ' + URL_TCO + ' ' + tr(REFS_PLANO[2])], pos: [TXT_VINCULO, TXT_ISENCAO] });
  return S_;
}

// Tradução só dos campos de conteúdo (ids, tipos, páginas e alvos de navegação ficam como estão)
function trSecao(s) {
  const o = Object.assign({}, s);
  // 0.0.15: seções montadas por plano/relatorio.js já vêm traduzidas e formatadas (não traduzir de novo "US$ 4.68 M")
  if (o.pronto) return o;
  ['h', 'det', 'alt'].forEach(k => { if (o[k]) o[k] = tr(o[k]); });
  ['pre', 'p', 'list', 'pos'].forEach(k => { if (o[k]) o[k] = o[k].map(z => tr(z)); });
  if (o.kv) o.kv = o.kv.map(([k, v]) => [tr(k), tr(v)]);
  if (o.fatos) o.fatos = o.fatos.map(([k, v]) => [tr(k), tr(v)]);
  if (o.principal) o.principal = tr(o.principal);
  if (o.cartoes) o.cartoes = o.cartoes.map(z => Object.assign({}, z, { h: tr(z.h), hTable: z.hTable ? tr(z.hTable) : '', kv: z.kv.map(([k, v]) => [tr(k), tr(v)]),
    table: z.table ? Object.assign({}, z.table, { head: z.table.head.map(x => tr(x)), rows: z.table.rows.map(r => r.map(x => tr(x))) }) : null }));
  if (o.table && !o.table.pronto) o.table = Object.assign({}, o.table, { head: o.table.head.map(z => tr(z)), rows: o.table.rows.map(r => r.map(z => tr(z))) });
  return o;
}

// Dados do painel ("Em resumo", capa e perfil), tirados das seções já traduzidas
// secs: opcional; sem ele, secoesPlano(estado).map(trSecao)
function painelPlano(estado, secs) {
  secs = secs || secoesPlano(estado).map(trSecao);
  const by = id => secs.find(z => z.id === id && !z.sub) || {};
  const res = by('resumo'), a1 = by('A1'), a2 = by('A2');
  let R = [];
  try { R = recomendacoesCaso(copiaEstado(estado)) || []; } catch (e) { console.warn(e); }
  return { kpis: a2.graf ? (a2.kv || []).slice(0, 4) : [], graf: a2.graf || null, semCusto: !a2.graf ? (a2.p || [])[0] || '' : '',
    fatos: res.fatos || [], cartoes: res.cartoes || [], principal: a1.principal || '', recs: R, nAlta: R.filter(r => r.prioridade === 'alta').length,
    faltas: by('faltas').tipo ? by('faltas') : null, semNumeros: !a2.graf && !!a2.semNumeros };
}
function perfilCasoCartoes(estado) { return painelPlano(estado).cartoes; }
const corCamada = n => COR_CAMADA[(+n || 1) - 1] || COR_CAMADA[0];

export {
  NOME_FERRAMENTA, PAGINAS_PLANO, TIT_PAGINAS, PAGINA_SECAO, secoesDaPagina,
  ARRANJOS, NOTA_ARQ, APRENDIZAGEM, GRUPOS_COMPRA, GRUPOS_DADOS, TAG_CONTRATO, ROT_ALERTA, AREAS_PERFIL, COR_CAMADA, corCamada,
  ROT_GOV, ROT_ESTADO, TXT_MATRIZ, TIT_PERFIL, INTRO_PERFIL,
  copiaEstado, slugPlano, nomeCamada, rotuloCamada, dadosPlano, secaoMatriz, secoesPlano, trSecao, painelPlano, perfilCasoCartoes,
};
