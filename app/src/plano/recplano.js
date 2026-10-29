// =====================================================================
// Recomendações no relatório (pacote R6 do sistema de recomendações: REC-38 a REC-45; design/redesign/
// 05-requisitos-recomendacoes.md, seções 4.4, 4.5, 5 e 9). Parte pura: monta, a partir da saída pública do motor
// (resultadoRecomendacoes, numerosRec, fichaAceiteTec), os dados JÁ TRADUZIDOS que a página do plano, o PDF e a síntese
// do capítulo 4 desenham, para que as três mostrem as mesmas frases:
//   planoRec(estado, d?) → { veredito, aviso, cuidado[3], cartoes[5], contadores, pend[], sequencia, teste, plano,
//                            exigir, premissas, normas, proximo, vazio }
//   proximoPasso(estado)  → o bloco "Seu próximo passo" (5.6) do fim do capítulo 4
// d: os números de rec_numeros.js:numerosRec(estado) já calculados (secoes.js passa os de relDados).
// O veredito (4.4) é o de trVeredito: a mesma string na capa, em "Em resumo", no PDF e na síntese (REC-21).
// Nada aqui mostra "Alta", "Média" nem "Normal" (REC-19): os níveis são os de rotuloNivel (Condição, Recomendada,
// Para acompanhar). Os números de convenção (limiares da ficha, efeito mínimo, alertas de consumo) saem sempre com
// "ilustrativo, ajuste" (decisão 8); as normas só no bloco recolhido "Exemplos de norma" (decisão 5).
// Os textos em português são as chaves de tradução (TEXTOS_REC_R6); {nome} são lugares de valores.
// =====================================================================
import {
  tr, grande, din, pct, fmtInt, OPC, PDS, CONTRATO, FORMAS_SUP, DIMENSOES, QUESTOES_G, AREAS_REC, MARCOS_REC, EXIGE_REC,
  resultadoRecomendacoes, recContexto, trRec, trCartao, trVeredito, trAviso, rotuloQuem, rotuloNivel, casoAtual,
} from '../domain/index.ts';
import { numerosRec, numero } from '../domain/rec_numeros.js';
import { fichaAceiteTec } from '../domain/regras/tec.js';
import { lacunasDe } from '../percurso/painel.ts';

// ----------------------------------------------------------- textos (chaves de tradução)
export const TXT_R6 = {
  // Em resumo (5.1)
  recPrincipal: 'Recomendação principal',
  porqueVer: 'Por quê: {0}',
  cuidadoT: 'Nível de cuidado deste caso',
  cuidLim: 'Cuidado limitado: as regras gerais bastam, porque um erro da ferramenta tende a ser percebido e corrigido antes de atingir pessoas.',
  cuidMod: 'Cuidado moderado: um erro da ferramenta pode atingir {quem} de forma indireta, mas tende a ser percebido e corrigido em tempo útil.',
  cuidElev: 'Cuidado elevado: um erro da ferramenta pode pesar em decisões sobre {quem}, e corrigi-lo é possível, mas custoso ou lento.',
  cuidCrit: 'Cuidado crítico: um erro da ferramenta pode decidir, na prática, algo difícil de reverter para {quem}.',
  cuidPesam: 'O que mais pesa: {0}.',
  cuidNaoImpLim: 'Isso não impede o projeto: a supervisão prevista ({forma}) e as cláusulas deste plano cobrem o risco.',
  cuidNaoImpAlto: 'Isso não impede o projeto se as salvaguardas vierem antes do uso: {forma}, um caminho para contestar as saídas e a proteção dos dados.',
  cuidProntas1: 'Antes de {marco}, precisa estar pronta 1 condição: {lista}.',
  cuidProntasN: 'Antes de {marco}, precisam estar prontas {n} condições, a começar por: {lista}.',
  cuidProntas0: 'Nenhuma condição está aberta antes de {marco}; as demais ações acompanham o projeto.',
  quemPessoas: 'as pessoas atendidas',
  // contadores
  contGov: 'Governança: {0} de {1}',
  contUso: 'Condições de uso nas escolas: {0} de 4',
  contFaltam1: 'Falta 1 resposta',
  contFaltamN: 'Faltam {0} respostas',
  contFaltam0: 'Todas as respostas do plano estão dadas',
  // cartões
  cOque: 'O quê', cPorque: 'Por quê', cParaque: 'Para quê', cComo: 'Como', cQuem: 'Quem age', cMarco: 'Marco',
  cJogo: 'O que está em jogo', cPronto: 'Pronto quando', cOrigem: 'Origem', cJunto: 'No mesmo pacote',
  // aviso de mais de 5 condições
  avisoVer: 'Ver as {0} condições',
  // pendências (5.3, bloco 1)
  pendT: 'Antes de decidir, responda',
  pendIntro: 'Estas respostas mudam o custo ou as cláusulas do plano. Enquanto faltarem, as ações que dependem delas ficam suspensas ou marcadas como provisórias.',
  pendNaoSei: 'Resposta “Não sei”',
  pendPremissa: 'Premissa que o custo já usa',
  pendSugerida: 'Resposta sugerida, a confirmar',
  pendSuspende: 'Ações suspensas até a resposta: {0}.',
  pendDependem: 'Ações que dependem dela: {0}.',
  pendEfeito: 'Custo total do caso em cada arquitetura',
  pendAtual: 'usada hoje',
  pendResponder: 'Responder',
  pendVazio: 'Nenhuma resposta pendente muda o custo ou as cláusulas deste plano.',
  // sequência de decisões (5.3, bloco 2; 4.5)
  seqT: 'Sequência de decisões',
  seqIntro: 'As decisões do caso em ordem, com o portão de cada uma: o que precisa estar pronto, com o valor deste caso e o estado de hoje.',
  seqDecisao: 'Decisão', seqQuem: 'Quem assina', seqQuando: 'Quando',
  seqCriterio: 'Critério', seqValor: 'Valor neste caso', seqEstado: 'Estado', seqVem: 'Vem de',
  estPronto: 'Pronto', estFalta: 'Falta', estPremissa: 'Premissa', estImpossivel: 'Impossível de medir com o desenho atual',
  aDefinir: 'a definir pela rede',
  pdT: 'Pontos de decisão do guia, em ordem',
  pdAcoes: 'Ações deste caso: {0}.',
  pdSemAcoes: 'Nenhuma ação deste caso; vale a lista do guia.',
  // portões
  g1: 'G1 · Autorizar o teste', g2: 'G2 · Da prova de conceito ao piloto', g3: 'G3 · Do piloto à implantação',
  gm: 'Pronto para ir ao mercado', g4: 'G4 · Da implantação à expansão',
  q1: 'Ano 0, antes de o teste começar', q2: 'Ao fim da prova de conceito ({0} meses)', q2s: 'Ao fim da prova de conceito',
  q3: 'Ao fim do piloto ({0} meses), antes da implantação', q3s: 'Ao fim do piloto, antes da implantação',
  qm: 'Ano 0, antes do termo de referência ou do edital', q4: 'Ano 1 em diante, antes de ampliar',
  d1: 'Autorizar o teste', d2: 'Passar da prova de conceito ao piloto', d3: 'Passar do piloto à implantação',
  dm: 'Levar a compra ao mercado', d4: 'Ampliar à rede toda',
  // critérios
  k1Meta: 'Problema e meta com número', k1Aceite: 'Conjunto de teste e critérios de aceite fixados antes',
  k1Base: 'Linha de base e comparação', k1Dados: 'Dados e pessoas', k1Uso: 'Condições de uso nas escolas',
  k2Aceite: 'Aceite técnico cumprido, com os limiares da ficha', k2Criancas: 'Nenhuma falha grave nos testes com crianças',
  k2Custo: 'Custo por participante dentro da premissa', k2Ata: 'Decisão registrada em ata',
  k3Adocao: 'Adoção igual ou acima da meta', k3Efeito: 'Efeito igual ou acima do limiar, com margem',
  k3Custo: 'Custo por usuário ativo em regime dentro do teto', k3Grupos: 'Nenhum grupo fica pior', k3Suporte: 'Suporte dentro do nível de serviço',
  kmNec: 'Necessidade e alternativa documentadas', kmEstr: 'Estratégia de compra escolhida', kmPreco: 'Preço de referência formado',
  kmDot: 'Dotação reservada', kmReq: 'Requisitos com valor e forma de verificar', kmDados: 'Dados no contrato',
  k4Crit: 'Critérios numéricos da primeira etapa fixados antes', k4Res: 'Resultado lido antes da decisão', k4Risco: 'Risco reavaliado',
  vFicha: 'Ficha de aceite em “Como testar e avaliar”', vCondicoes1: '1 condição aberta', vCondicoesN: '{0} condições abertas', vCondicoes0: 'nenhuma condição aberta',
  vAdocao: 'Adoção prevista de {0}; meta: a definir pela rede', vRegime: '{0} por usuário ativo por ano; teto: a definir pela rede',
  vMdes: 'Efeito mínimo detectável do piloto: {0}', vUso: '{0} de 4', vReq: '{0} requisitos em “O que exigir”', vNenhuma: 'nenhuma (ilustrativo, ajuste)',
  // como testar e avaliar (5.3, bloco 3)
  testeT: 'Como testar e avaliar',
  fichaT: 'Ficha de aceite do teste',
  fichaIntro: 'Critérios que a ferramenta precisa cumprir no teste, com o conjunto de casos da rede. Os números são ilustrativos: ajuste-os antes de publicar. Os critérios entram no termo de referência: o pagamento da etapa seguinte depende de cumpri-los.',
  fichaClasse: 'Tarefa avaliada: {0}',
  fichaCrit: 'Critério', fichaLimiar: 'Limiar',
  ilustrativo: 'ilustrativo, ajuste',
  fichaConjunto: 'Conjunto de teste', fichaConjuntoV: 'De 100 a 300 casos reais por tarefa, guardados pela rede e usados com todos os concorrentes e a cada nova versão',
  fichaVersao: 'Versão testada', fichaVersaoV: 'Versão do modelo, da base e da configuração registrada no relatório do teste',
  fichaExport: 'Teste de exportação', fichaExportV: 'Exportar dados e configurações em formato aberto durante o teste',
  avalT: 'Desenho de avaliação',
  avalPrem: 'Premissas (ilustrativas, a confirmar):',
  avalCusto: 'A avaliação já está no custo total: {0}.',
  grupoT: 'Quem pode ficar para trás',
  gConexao: 'Conexão', gDisp: 'Dispositivos', gDefic: 'Deficiência', gLinguas: 'Línguas', gAdocao: 'Adoção prevista', gPerfil: 'Perfil do piloto e da rede',
  naoInformado: 'não informado',
  gDeficSim: 'há estudantes com deficiência no público', gLinguasSim: 'há outras línguas ou variedades no público',
  gPerfilV: 'piloto com {0} de {1} escolas da rede', gPerfilFalta: 'publicar o perfil do piloto e o da rede (R-14)',
  // classes da ficha
  clGeracao: 'geração de materiais', clTutoria: 'tutoria com estudantes', clPrevisao: 'previsão e alerta', clDuvidas: 'respostas a dúvidas com base de normas',
  geracao1: 'Materiais com erro conceitual grave numa amostra de 100, em revisão às cegas por dois professores', geracao1v: 'nenhum',
  geracao2: 'Materiais alinhados ao currículo e adequados à idade (rubrica da rede)', geracao2v: 'pelo menos 90%',
  geracao3: 'Tempo de preparação poupado por professor', geracao3v: 'medido antes e no terceiro mês',
  tutoria1: 'Soluções e dicas corretas no banco de itens da rede, por habilidade e ano', tutoria1v: 'pelo menos 95%',
  tutoria2: 'Dicas que conduzem sem entregar a resposta', tutoria2v: 'pelo menos 90%',
  tutoria3: 'Pedidos que tentam contornar os limites recusados de forma adequada', tutoria3v: 'pelo menos 95%',
  previsao1: 'Validação com turmas de anos anteriores (treino até o ano t−1, teste no ano t)', previsao1v: 'feita antes do uso',
  previsao2: 'Acerto entre os estudantes que as equipes conseguem atender, comparado a uma regra simples de faltas', previsao2v: 'melhor que a regra simples',
  previsao3: 'Antecedência do alerta', previsao3v: 'pelo menos 8 semanas',
  duvidas1: 'Respostas corretas em pedidos históricos já respondidos', duvidas1v: 'pelo menos 90% de 200 pedidos',
  duvidas2: 'Respostas que citam a norma vigente e são fiéis a ela', duvidas2v: 'pelo menos 95%',
  duvidas3: 'Pedidos fora da base encaminhados a uma pessoa', duvidas3v: 'todos',
  // plano de ação (5.3, bloco 4)
  planoT: 'Plano de ação',
  planoIntro: 'As ações deste caso agrupadas por pacote. Cada passo tem o seu número (R-nn), quem age, o marco e a pergunta que o originou.',
  planoAcoes1: '1 ação', planoAcoesN: '{0} ações', planoCond: '{0} condições',
  baseT: 'Base comum (vale para qualquer caso)',
  refT: 'Lista de verificação do guia (referência)',
  refIntro: 'As listas completas do guia, para consulta. Os itens que já são ações deste plano citam o número da ação em vez de repetir o texto.',
  refVer: 'Ver {0} no plano de ação.',
  // O que exigir (5.4)
  exT: 'Requisitos deste caso',
  exIntro: 'Só as cláusulas que as ações deste caso pedem. Cada linha diz por que entra, o valor do caso, como verificar, onde entra no processo e de que ação vem.',
  exReq: 'Requisito ou cláusula', exPorque: 'Por que neste caso', exValor: 'Valor', exVerificar: 'Como verificar', exOnde: 'Onde entra', exVem: 'Vem de',
  exPadraoT: 'Cláusulas-padrão do guia (referência)',
  exPadraoIntro: 'O restante do checklist do Instrumento F do guia, para consulta. Não entra na contagem dos requisitos deste caso.',
  exMercado: 'Pronto para ir ao mercado? Veja o portão “Pronto para ir ao mercado” na Sequência de decisões, em “O que fazer”.',
  exPerfil: 'perfil de risco do caso',
  exProvisoria: '(provisória: depende da arquitetura presumida)',
  ondeNec: 'Estudo da necessidade e termo de referência', ondeTR: 'Termo de referência e contrato', ondeContrato: 'Contrato',
  ondeDados: 'Contrato e acordo de tratamento de dados', ondeFisc: 'Contrato e fiscalização', ondeEdital: 'Edital ou instrumento do teste',
  ondeTRTeste: 'Termo de referência do teste',
  verEscopo: 'Conferir o objeto e os limites no termo de referência antes de publicar',
  verDesemp: 'Medir no teste com o conjunto de casos da rede e na fiscalização mensal',
  verMudanca: 'Registro de versões e avisos recebidos, conferido pelo fiscal técnico',
  verDados: 'Relatório do fornecedor conferido pelo encarregado de dados',
  verVerif: 'Relatório de auditoria ou de incidentes conferido pelo fiscal técnico',
  verDireitos: 'Cláusula conferida pela assessoria jurídica antes de assinar',
  verCusto: 'Relatório mensal de consumo e de faturamento conferido pelo fiscal',
  verSaida: 'Teste real de exportação no primeiro ano de contrato',
  verGestao: 'Ato de designação publicado antes de assinar',
  verCompra: 'Instrumento publicado antes do início, com o preço fixado',
  verConsumo: 'Painel de consumo visível antes da fatura, com alertas a 70% e 90% do teto (ilustrativo, ajuste)',
  verAceite: 'Ficha de aceite aplicada ao conjunto de teste da rede; o pagamento da etapa seguinte depende de cumpri-la',
  valConsumo: 'Teto anual de {0} (estimativa do custo em regime)',
  valUnSaas: 'Licença por usuário ou institucional', valUnApi: 'Consumo por chamada ao modelo', valUnOw: 'Horas de servidor contratado',
  valTransicao: 'Desembolso de transição e saída: {0}', valSaida: 'Camada de saída do custo total: {0}',
  valAceite: 'Limiares da ficha de aceite (ilustrativo, ajuste)', valP50: 'Valor para orçar (P50): {0}', valAno0: 'Custo do Ano 0: {0}',
  valTreino: 'Proibido', valFiscais: 'Fiscal técnico e fiscal pedagógico',
  // premissas da ferramenta (REC-44) e exemplos de norma (decisão 5)
  premT: 'Premissas da ferramenta',
  premIntro: 'Valores que a ferramenta supõe enquanto a rede não responde. São premissas, não respostas: confirme-as.',
  premRotulo: 'premissa da ferramenta',
  premContest: 'Caminho para contestar as saídas: {0}',
  premTreino: 'Uso dos dados para treinar modelos: não informado; o plano pede a cláusula de proibição',
  premVuln: 'Pessoas em situação de vulnerabilidade: não marcadas',
  premVerif: 'Verificação das saídas: {0}',
  premArq: 'Arquitetura: {0} (presumida)',
  normT: 'Exemplos de norma',
  normIntro: 'Exemplos de normas ligadas às ações deste plano, só para orientar a conversa com a assessoria jurídica. Confirme com a assessoria jurídica antes de citar qualquer norma no processo.',
  normBR: 'Brasil', normUE: 'União Europeia',
  normSem: 'Não há exemplos de norma para o país deste caso. Confirme com a assessoria jurídica as normas aplicáveis.',
  // síntese do capítulo 4 (5.6)
  proxT: 'Seu próximo passo',
  proxAcoes: 'Comece por estas',
  proxCusto: 'Custo do Ano 0: {0}. Dotação do Ano 0: {1}.',
  proxCusto0: 'Custo do Ano 0: {0}.',
  proxFaltam1: 'Falta 1 resposta para fechar o plano',
  proxFaltamN: 'Faltam {0} respostas para fechar o plano',
  proxPdf: 'Baixar o policy brief (PDF)',
  quemMarco: '{quem} · {marco}',
};
const T = (k, v) => sub(tr(TXT_R6[k] != null ? TXT_R6[k] : k), v);
function sub(s, v) {
  if (!v) return String(s);
  const arr = Array.isArray(v) ? v : null;
  return String(s).replace(/\{([a-zA-Z0-9_]+)\}/g, (m, n) => {
    const x = arr ? arr[+n] : v[n];
    return x == null ? m : String(x);
  });
}
const semPonto = s => String(s || '').trim().replace(/[.;:]+$/, '');
const minusc = s => { s = String(s || ''); return s.charAt(0).toLocaleLowerCase() + s.slice(1); };
const cap = s => { s = String(s || ''); return s.charAt(0).toLocaleUpperCase() + s.slice(1); };
const juntar = L => (L.length <= 1 ? L.join('') : L.slice(0, -1).join(', ') + ' ' + tr('e') + ' ' + L[L.length - 1]);
const rotOpc = (lista, v) => { const o = ((OPC && OPC[lista]) || []).find(x => String(x[0]) === String(v)); return o ? String(tr(o[1])) : ''; };
const trPartes = s => String(s || '').split('; ').map(z => tr(z)).join('; ');
const NOME_MARCO = Object.fromEntries((MARCOS_REC || []).map(m => [m[0], m[1]]));
const marcoNome = m => String(tr(NOME_MARCO[m] || ''));
// estados dos critérios dos portões
const ESTADOS = { pronto: 'estPronto', falta: 'estFalta', premissa: 'estPremissa', impossivel: 'estImpossivel' };

// ----------------------------------------------------------- veredito, aviso e nível de cuidado
function vereditoRel(res) {
  const v = trVeredito(res.veredito) || { texto: '', frase: '', porque: '', decisao: '', rotulo: '', faltam: [] };
  return Object.assign({ codigo: res.veredito ? res.veredito.codigo : 'sem' }, v);
}
function avisoRel(res) {
  const a = res.avisoCondicoes;
  if (!a) return null;
  return { texto: trAviso(a), n: a.n, ver: T('avisoVer', [a.n]), lista: a.lista.map(x => ({ id: x.id, oque: trRec(x.item, 'oque'), titulo: String(tr(x.titulo)) })) };
}
/** quem é atingido, em palavras: crianças, estudantes, professores, servidores */
function quemAtingido(ce) {
  const af = ce.afetados || [], us = ce.usuarios || [];
  const L = [];
  if (af.includes('criancas')) L.push(rotOpc('afetados', 'criancas'));
  else if (us.includes('estudantes') || af.includes('adultos_est')) L.push(rotOpc('usuarios', 'estudantes'));
  if (af.includes('professores') || us.includes('professores')) L.push(rotOpc('usuarios', 'professores'));
  if (af.includes('servidores') || us.includes('administrativo')) L.push(rotOpc('afetados', 'servidores'));
  if (af.includes('familias')) L.push(rotOpc('afetados', 'familias'));
  const out = L.filter(Boolean).map(minusc);
  return out.length ? juntar(out) : T('quemPessoas');
}
/** Nível de cuidado em 3 frases (5.1; ETI-13): o que pode dar errado e para quem; por que não impede; o que fica pronto e quando. */
function cuidadoRel(res, k, cartoes) {
  if (!k || !k.nivel) return [];
  const ce = k.ce || {};
  const nivel = k.nivel;
  const quem = quemAtingido(ce);
  const dims = (k.determinantes || []).map(d => { const x = (DIMENSOES || []).find(z => z[0] === d); return x ? minusc(tr(x[1])) : ''; }).filter(Boolean);
  let s1 = nivel === 'limitado' ? T('cuidLim') : nivel === 'moderado' ? T('cuidMod', { quem }) : nivel === 'critico' ? T('cuidCrit', { quem }) : T('cuidElev', { quem });
  if (nivel !== 'limitado' && dims.length) s1 += ' ' + T('cuidPesam', [juntar(dims.slice(0, 3))]);
  const forma = k.forma && FORMAS_SUP[k.forma] ? minusc(tr(FORMAS_SUP[k.forma][0])) : '';
  const s2 = k.alto ? T('cuidNaoImpAlto', { forma: forma || minusc(tr('Revisão por exceção')) }) : T('cuidNaoImpLim', { forma: forma || minusc(tr('Revisão por amostragem')) });
  const prox = res.proxMarco || 'M1';
  const marco = String(tr((res.veredito && res.veredito.chaves && res.veredito.chaves.vars && res.veredito.chaves.vars.marco) || NOME_MARCO[prox] || ''));
  const nCond = (res.condicoes || []).length;
  const lista = (res.veredito && res.veredito.faltam ? trVeredito(res.veredito).faltam : []).slice(0, 3);
  const s3 = !nCond ? T('cuidProntas0', { marco }) : nCond === 1 ? T('cuidProntas1', { marco, lista: lista.join('; ') || (cartoes[0] ? semPonto(minusc(cartoes[0].oque)) : '') })
    : T('cuidProntasN', { marco, n: nCond, lista: lista.join('; ') });
  return [s1, s2, s3];
}

// ----------------------------------------------------------- cartões (5.1)
function cartoesRel(res) {
  return (res.cartoes || []).map(c => {
    const x = trCartao(c) || {};
    const nu = c.numero && !c.numero.falta ? { rotulo: String(tr(c.numero.rotulo || '')), valor: String(tr(c.numero.valor || '')) } : null;
    return {
      n: c.n, id: c.id, ids: c.ids.slice(), pacote: c.pacote, titulo: x.titulo, nivel: c.nivel, rotuloNivel: x.rotuloNivel,
      oque: x.oque, razao: x.razao, paraque: x.paraque, como: x.como || [], quem: cap(juntar(x.quem || [])), marco: marcoNome(c.marco),
      emJogo: nu, pronto: x.pronto, origem: x.origem, etiqueta: x.etiqueta || '', passos: x.passos || [], ir: c.lider && c.lider.ir ? c.lider.ir : '',
      campo: c.origem && c.origem.campo,
    };
  });
}

// ----------------------------------------------------------- contadores (5.1)
const IDS_USO = ['R-46', 'R-47', 'R-48', 'R-15'];
function usoNasEscolas(res, k) {
  if (!k) return null;
  const us = k.usuarios || [];
  if (!us.includes('professores') && !us.includes('estudantes')) return null;
  const ids = new Set((res.recs || []).map(r => r.id));
  const abertas = IDS_USO.filter(id => ids.has(id));
  return { prontas: 4 - abertas.length, total: 4, abertas };
}
function contadoresRel(estado, res, k) {
  const resp = estado.resp || {};
  const gq = QUESTOES_G || [];
  const sim = gq.filter(q => resp[q.id] === 'sim').length;
  let faltam = 0;
  try { faltam = lacunasDe(estado).total; } catch (e) { console.warn(e); }
  const uso = usoNasEscolas(res, k);
  return {
    gov: { sim, n: gq.length, texto: T('contGov', [sim, gq.length]) },
    uso: uso ? Object.assign(uso, { texto: T('contUso', [uso.prontas]) }) : null,
    faltam: { n: faltam, texto: faltam === 0 ? T('contFaltam0') : faltam === 1 ? T('contFaltam1') : T('contFaltamN', [faltam]) },
  };
}

// ----------------------------------------------------------- pendências (5.3, bloco 1)
function pendRel(res) {
  return (res.pend || []).map(p => {
    let ef = null;
    try { ef = p.efeito || null; } catch (e) { ef = null; }
    // tipo: 'naoSei' (resposta "Não sei"), 'premissa' ou 'sugerida' (o código do motor 'nao_sei' não sai daqui)
    const tipo = p.tipo === 'premissa' || p.tipo === 'sugerida' ? p.tipo : 'naoSei';
    return {
      id: p.id, tipo, rotuloTipo: T(tipo === 'premissa' ? 'pendPremissa' : tipo === 'sugerida' ? 'pendSugerida' : 'pendNaoSei'),
      n: p.n, campo: p.campo, pergunta: String(tr(p.pergunta || '')), resposta: trPartes(p.resposta), motivo: String(tr(p.motivo || '')),
      suspende: (p.suspende || []).slice(), dependem: (p.dependem || []).slice(),
      linhaIds: (p.suspende || []).length ? T('pendSuspende', [p.suspende.join(', ')]) : (p.dependem || []).length ? T('pendDependem', [p.dependem.join(', ')]) : '',
      efeito: ef && ef.valores ? { rotulo: T('pendEfeito'), valores: ef.valores.map(v => ({ arq: v.arq, rotulo: String(tr(v.rotulo)), total: grande(v.total), atual: v.arq === res.arqEf })) } : null,
    };
  });
}

// ----------------------------------------------------------- sequência de decisões (4.5; 5.3, bloco 2)
function sequenciaRel(estado, res, k, d, nReq) {
  const c = estado.caso || {};
  const recs = res.recs || [];
  const porId = new Map(recs.map(r => [r.id, r]));
  const tem = ids => ids.filter(id => porId.has(id));
  const A = d ? d.aval : null;
  const impossivel = !!(A && A.medeViabilidade);
  const crit = (rot, ids, valor, estado_) => {
    const presentes = [...new Set(tem(ids))];
    const e = estado_ || (presentes.length ? 'falta' : 'pronto');
    return { criterio: T(rot), ids: presentes, valor: valor || T('aDefinir'), estado: e, rotuloEstado: T(ESTADOS[e]) };
  };
  const nCond = L => (L.length === 0 ? T('vCondicoes0') : L.length === 1 ? T('vCondicoes1') : T('vCondicoesN', [L.length]));
  const ind = id => { const x = d && (d.indicadores || []).find(z => z.id === id); return x ? x.valor : ''; };
  const pv = n => (n && !n.falta ? n.valor : '');
  const usaProfEst = (k.usuarios || []).some(u => ['professores', 'estudantes'].includes(u));
  const uso = usoNasEscolas(res, k);
  const pocPrimeiro = k.poc || k.teste === 'ambos' || ['poc', 'ambos'].includes(k.rec && k.rec.modo);
  const temPiloto = !!k.temPiloto;
  const condM1 = recs.filter(r => r.nivel === 'condicao' && r.marco === 'M1' && ['DADOS', 'PESSOAS'].includes(r.pacote));
  const quem = cods => juntar(rotuloQuem(cods));
  const portoes = [];
  // G1
  const linhaBase = rotOpc('linhaBase', c.linhaBase);
  const mdesP = d ? pv(numero('mdesPiloto', d)) : '';
  portoes.push({ id: 'G1', marco: 'M1', titulo: T('g1'), decisao: res.proxMarco === 'M1' && res.veredito && res.veredito.decisao ? cap(trVeredito(res.veredito).decisao) : T('d1'),
    quem: quem(['gabinete']), quando: T('q1'), criterios: [
      crit('k1Meta', ['R-01', 'R-05', 'R-02'], String(c.resultado || '').trim().slice(0, 140) || '', porId.has('R-01') || porId.has('R-05') ? 'falta' : String(c.resultado || '').trim() ? 'pronto' : 'falta'),
      crit('k1Aceite', ['R-08', 'R-19', 'R-79', 'R-80'], T('vFicha'), 'falta'),
      crit('k1Base', ['R-11', 'R-12', 'R-13'], [linhaBase, mdesP ? T('vMdes', [mdesP]) : ''].filter(Boolean).join('; '), impossivel ? 'impossivel' : undefined),
      crit('k1Dados', ['R-26', 'R-27', 'R-28'].concat(condM1.map(r => r.id)), nCond(condM1), condM1.length || tem(['R-26', 'R-27', 'R-28']).length ? 'falta' : 'pronto'),
    ].concat(usaProfEst && uso ? [crit('k1Uso', ['R-45', 'R-46', 'R-47', 'R-48', 'R-15'], T('vUso', [uso.prontas]), uso.prontas === 4 ? 'pronto' : 'falta')] : []) });
  // G2
  if (pocPrimeiro) {
    const m = +((c.poc || {}).meses) || 0;
    portoes.push({ id: 'G2', marco: 'M2', titulo: T('g2'), decisao: T('d2'), quem: quem(['gabinete', 'tecnologia']), quando: m ? T('q2', [m]) : T('q2s'), criterios: [
      crit('k2Aceite', ['R-08', 'R-79', 'R-80'], T('vFicha'), 'falta'),
    ].concat(k.criancas ? [crit('k2Criancas', ['R-80', 'R-34'], T('vNenhuma'), 'falta')] : []).concat([
      crit('k2Custo', ['R-79', 'R-76'], ind('teste'), 'premissa'),
      crit('k2Ata', ['R-20', 'R-86'], '', 'falta'),
    ]) });
  }
  // G3
  if (temPiloto) {
    const m = +((c.piloto || {}).meses) || 0;
    const ad = d ? pv(numero('adocao', d)) : '';
    const reg = ind('regimeAtivo');
    portoes.push({ id: 'G3', marco: 'M2', titulo: T('g3'), decisao: T('d3'), quem: quem(['gabinete']), quando: m ? T('q3', [m]) : T('q3s'), criterios: [
      crit('k3Adocao', ['R-15', 'R-21'], ad ? T('vAdocao', [ad]) : '', tem(['R-15', 'R-21']).length ? 'falta' : 'premissa'),
      crit('k3Efeito', ['R-13', 'R-17'], mdesP ? T('vMdes', [mdesP]) : '', impossivel ? 'impossivel' : undefined),
      crit('k3Custo', ['R-21', 'R-72'], reg ? T('vRegime', [reg]) : '', 'premissa'),
    ].concat(tem(['R-33', 'R-14']).length ? [crit('k3Grupos', ['R-33', 'R-14'], '', 'falta')] : []).concat([
      crit('k3Suporte', ['R-64', 'R-105'], rotOpc('suporteNivel', c.suporteNivel)),
    ]) });
  }
  // pronto para ir ao mercado
  const dotF = d ? pv(numero('dotFaixa', d)) : '';
  portoes.push({ id: 'GM', marco: 'M3', titulo: T('gm'), decisao: T('dm'), quem: quem(['compras', 'juridico']), quando: T('qm'), criterios: [
    crit('kmNec', ['R-03', 'R-04', 'R-06'], rotOpc('simNao', c.alternativa)),
    crit('kmEstr', ['R-55', 'R-56', 'R-57', 'R-62']),
    crit('kmPreco', ['R-58', 'R-61']),
    crit('kmDot', ['R-73', 'R-72'], dotF),
    crit('kmReq', ['R-63'], nReq ? T('vReq', [nReq]) : ''),
    crit('kmDados', ['R-26', 'R-27']),
  ] });
  // G4
  portoes.push({ id: 'G4', marco: 'M5', titulo: T('g4'), decisao: T('d4'), quem: quem(['gabinete']), quando: T('q4'), criterios: [
    crit('k4Crit', ['R-21']), crit('k4Res', ['R-22', 'R-23']), crit('k4Risco', ['R-25', 'R-44', 'R-82']),
  ] });
  // pontos de decisão do guia, em ordem 1–9, com os R-nn deste caso
  const pds = (PDS || []).slice().sort((a, b) => a.n - b.n).map(p => {
    const ids = recs.filter(r => +r.pd === p.n).map(r => r.id);
    return { n: p.n, titulo: String(tr(p.titulo)), pergunta: String(tr(p.pergunta)), ids, acoes: ids.length ? T('pdAcoes', [ids.join(', ')]) : T('pdSemAcoes') };
  });
  return { titulo: T('seqT'), intro: T('seqIntro'), portoes, pds, pdTitulo: T('pdT'),
    rotulos: { decisao: T('seqDecisao'), quem: T('seqQuem'), quando: T('seqQuando'), criterio: T('seqCriterio'), valor: T('seqValor'), estado: T('seqEstado'), vem: T('seqVem') } };
}

// ----------------------------------------------------------- como testar e avaliar (5.3, bloco 3; REC-40)
// classe da tarefa avaliada (TEC-05): tutoria > previsão > dúvidas (ou API) > geração
function classeFicha(k) {
  const t = k.tarefas || [], cl = k.classes || [];
  if (t.includes('tutoria') || t.includes('pratica_ia')) return 'tutoria';
  if (cl.includes('previsao')) return 'previsao';
  if (t.includes('duvidas') || (k.arqEf === 'api' && !k.arqPresumida)) return 'duvidas';
  return 'geracao';
}
const FICHA_CLASSE = {
  geracao: ['clGeracao', [['geracao1', 'geracao1v'], ['geracao2', 'geracao2v'], ['geracao3', 'geracao3v']]],
  tutoria: ['clTutoria', [['tutoria1', 'tutoria1v'], ['tutoria2', 'tutoria2v'], ['tutoria3', 'tutoria3v']]],
  previsao: ['clPrevisao', [['previsao1', 'previsao1v'], ['previsao2', 'previsao2v'], ['previsao3', 'previsao3v']]],
  duvidas: ['clDuvidas', [['duvidas1', 'duvidas1v'], ['duvidas2', 'duvidas2v'], ['duvidas3', 'duvidas3v']]],
};
function fichaRel(k) {
  const classe = classeFicha(k);
  const [rot, L] = FICHA_CLASSE[classe];
  const il = T('ilustrativo');
  const linhas = L.map(([a, b]) => ({ criterio: T(a), valor: T(b), rotulo: il }));
  // carga, segurança e monitoramento: as fichas das regras TEC que disparam (tec.js:fichaAceiteTec)
  let tec = [];
  try { tec = fichaAceiteTec(k) || []; } catch (e) { console.warn(e); }
  const blocos = tec.map(f => ({ id: f.id, titulo: String(tr(f.titulo)), linhas: f.linhas.map(l => ({ criterio: String(tr(l.criterio)), valor: String(tr(l.valor)), rotulo: String(tr(l.rotulo || TXT_R6.ilustrativo)) })) }));
  const fixos = [[T('fichaConjunto'), T('fichaConjuntoV')], [T('fichaVersao'), T('fichaVersaoV')], [T('fichaExport'), T('fichaExportV')]];
  // a ficha da classe vem da R-08 quando o catálogo a traz; as linhas daqui são a reserva (TEC-05)
  const temR08 = blocos.some(b => b.id === 'R-08');
  return { titulo: T('fichaT'), intro: T('fichaIntro'), classe, classeTxt: T('fichaClasse', [T(rot)]), linhas: temR08 ? [] : linhas, blocos, fixos,
    rotulos: { criterio: T('fichaCrit'), limiar: T('fichaLimiar') } };
}
function gruposRel(estado, k, d, recs) {
  const c = estado.caso || {};
  const ni = T('naoInformado');
  const ids = new Set((recs || []).map(r => r.id));
  const internet = c.internet ? rotOpc('internet', c.internet) + (c.internet === 'parcial' && +c.escolasInternet > 0 ? ' (' + fmtInt(+c.escolasInternet) + ')' : '') : ni;
  const disp = [c.modeloDisp ? rotOpc('modeloDisp', c.modeloDisp) : '', c.dispExistem ? rotOpc('dispExistem', c.dispExistem) : ''].filter(Boolean).join('; ') || ni;
  const pub = [].concat(c.publico || []).map(String);
  const defic = pub.some(v => /defici|especial|inclus/.test(v)) ? T('gDeficSim') : ni;
  const linguas = (k.ce && k.ce.idiomas) || pub.some(v => /lingu|idiom|indig/.test(v)) ? T('gLinguasSim') : ni;
  const ad = d ? numero('adocao', d) : null;
  const pe = +((c.piloto || {}).escolas) || 0;
  const perfilTxt = ids.has('R-14') ? T('gPerfilFalta') : pe && k.escRede ? T('gPerfilV', [fmtInt(pe), fmtInt(k.escRede)]) : ni;
  return [[T('gConexao'), internet], [T('gDisp'), disp], [T('gDefic'), defic], [T('gLinguas'), linguas],
    [T('gAdocao'), ad && !ad.falta ? ad.valor : ni], [T('gPerfil'), perfilTxt]];
}
function testeRel(estado, res, k, d) {
  const aval = d && d.aval ? d.aval : null;
  const vale = d && d.limiar ? d.limiar : null;
  let custoAval = '';
  if (d) { const n = numero('sub:K5.5', d); if (!n.falta) custoAval = T('avalCusto', [n.valor]); }
  return {
    titulo: T('testeT'), ficha: fichaRel(k),
    aval: aval ? { titulo: T('avalT'), linhas: aval.linhas.slice(), premissas: aval.premissas.slice(), rotuloPrem: T('avalPrem'), rotulo: aval.rotulo } : null,
    grupos: { titulo: T('grupoT'), linhas: gruposRel(estado, k, d, res.recs) },
    vale: vale ? { titulo: String(tr('Vale o que custa?')), frase: vale.frase, completo: !!vale.completo, premissas: vale.premissas.slice(),
      rotulo: vale.completo ? T('ilustrativo') : String(tr('a completar')) } : null,
    custoAval,
  };
}

// ----------------------------------------------------------- plano de ação por pacote (5.3, bloco 4; REC-23)
function itemRel(r) {
  return {
    id: r.id, oque: trRec(r, 'oque'), razao: trRec(r, 'razao'), pronto: trRec(r, 'pronto'), como: trRec(r, 'como'),
    quem: cap(juntar(rotuloQuem(r.quem))), marco: marcoNome(r.marco), nivel: r.nivel, rotuloNivel: rotuloNivel(r.nivel, r.marco, true),
    origem: origemTexto(r), etiqueta: [r.etiqueta ? trEtq(r.etiqueta) : '', r.confirmar ? trEtq(r.confirmar) : ''].filter(Boolean).join(' '), ir: r.ir || '', campo: r.origem && r.origem.campo,
  };
}
function trEtq(s) {
  const m = String(s).match(/^\(a confirmar na pergunta (.+)\)$/);
  return m ? String(tr('(a confirmar na pergunta {n})')).replace('{n}', m[1]) : String(tr(s));
}
function origemTexto(r) {
  const p = r.origem || {};
  if (!p.n && !p.pergunta) return '';
  return [p.n, tr(p.pergunta || '')].filter(Boolean).join(' ') + (p.resposta ? ' — ' + trPartes(p.resposta) : '') + (p.sugerido ? ' (' + tr('sugerido') + ')' : '');
}
function planoRel(res) {
  const grupos = (res.grupos || []).map(g => ({
    pacote: g.pacote, titulo: String(tr(g.titulo)), lente: String(tr(g.lenteNome || '')), rotuloNivel: rotuloNivel(g.nivel, g.itens[0] ? g.itens[0].marco : 'M1', true), nivel: g.nivel,
    n: g.itens.length, contagem: (g.itens.length === 1 ? T('planoAcoes1') : T('planoAcoesN', [g.itens.length])) + (g.nCondicoes ? ' · ' + T('planoCond', [g.nCondicoes]) : ''),
    marcos: g.marcos.map(m => ({ marco: m.marco, nome: marcoNome(m.marco), itens: m.itens.map(itemRel) })),
  }));
  return { titulo: T('planoT'), intro: T('planoIntro'), grupos, base: (res.baseComum || []).map(itemRel), baseTitulo: T('baseT'),
    rotulos: { n: 'R-nn', acao: String(tr('Ação')), quem: T('cQuem'), marco: T('cMarco'), pronto: T('cPronto'), origem: T('cOrigem') } };
}

// ----------------------------------------------------------- O que exigir (5.4; REC-41)
const SLUG_TAG = { alto: ['verificacao-auditoria', 'verificacao-suspensao', 'saida-transicao'], pessoas: ['verificacao-contestacao'], consumo: ['custo-consumo'] };
const FONTE_TAG = { alto: ['R-18', 'R-39', 'R-66', 'R-44'], pessoas: ['R-32', 'R-71'], consumo: ['R-68', 'R-76', 'R-75'] };
const ONDE_GRUPO = { Escopo: 'ondeNec', Desempenho: 'ondeTR', 'Mudança': 'ondeContrato', Dados: 'ondeDados', 'Verificação': 'ondeFisc', Direitos: 'ondeContrato',
  Custo: 'ondeTR', 'Saída': 'ondeContrato', 'Gestão': 'ondeFisc', Compra: 'ondeEdital' };
const VER_GRUPO = { Escopo: 'verEscopo', Desempenho: 'verDesemp', 'Mudança': 'verMudanca', Dados: 'verDados', 'Verificação': 'verVerif', Direitos: 'verDireitos',
  Custo: 'verCusto', 'Saída': 'verSaida', 'Gestão': 'verGestao', Compra: 'verCompra' };
function slugDe(id) { return String(id).replace(/^CONTRATO\./, ''); }
function grupoDe(id) { const x = EXIGE_REC[id]; return id.startsWith('DADOS_REQ.') ? 'Dados' : x ? x.grupo : ''; }
function valorExigir(id, k, d, r) {
  const s = slugDe(id), g = (n, ch) => { const x = d ? numero(ch, d) : null; return x && !x.falta ? T(n, [x.valor]) : ''; };
  if (s === 'custo-consumo') {
    if (!d || !d.av) return '';
    const T_ = d.av.r.anos.filter(t => t > 0);
    const L = d.av.linhas.filter(l => ['K2.2', 'K2.3', 'K2.5'].includes(l.s));
    const porAno = T_.length ? T_.reduce((a, t) => a + L.reduce((b, l) => b + (l.eco[t] || 0), 0), 0) / T_.length : 0;
    return porAno > 0 ? T('valConsumo', [grande(porAno)]) : '';
  }
  if (s === 'custo-unidades') return T(k.arqEf === 'api' ? 'valUnApi' : k.arqEf === 'ow' ? 'valUnOw' : 'valUnSaas');
  if (s === 'saida-transicao') return g('valTransicao', 'saida');
  if (s === 'saida-exportacao') return g('valSaida', 'saidaEco');
  if (s === 'desempenho-aceite') return T('valAceite');
  if (s === 'preco-faixa' || s === 'planilha-precos') return g('valP50', 'p50');
  if (s === 'etapa-sem-obrigacao' || s === 'nao-preferencia') return g('valAno0', 'ano0');
  if (s === 'gestor-fiscais') return T('valFiscais');
  if (id === 'DADOS_REQ.treino' || s === 'dados-treino') return T('valTreino');
  return '';
}
function exigirRel(estado, res, k, d) {
  const recs = res.recs || [];
  const porId = new Map(recs.map(r => [r.id, r]));
  const linhas = new Map();
  const add = (id, fontes) => {
    if (!EXIGE_REC[id]) return;
    if (!linhas.has(id)) linhas.set(id, { id, fontes: [] });
    const l = linhas.get(id);
    fontes.forEach(f => { if (!l.fontes.includes(f)) l.fontes.push(f); });
  };
  recs.forEach(r => (r.exige || []).forEach(id => add(id, [r.id])));
  // cláusulas que o perfil do caso pede (alto risco, saídas sobre pessoas, consumo), com a ação do caso que as trata
  const ce = k.ce || {};
  const afeta = (k.pesoMax || 0) > 0;
  const tags = [k.alto ? 'alto' : '', afeta ? 'pessoas' : '', k.arqEf !== 'saas' || (estado.caso || {}).pagamento === 'consumo' ? 'consumo' : ''].filter(Boolean);
  const semFonte = new Set();
  tags.forEach(tg => SLUG_TAG[tg].forEach(s => { const f = FONTE_TAG[tg].filter(id => porId.has(id)); add('CONTRATO.' + s, f); if (!f.length) semFonte.add('CONTRATO.' + s); }));
  // os critérios de aceite da ficha entram como cláusula (5.4)
  if (k.teste || k.temPiloto || k.poc) add('CONTRATO.desempenho-aceite', ['R-79', 'R-80', 'R-60', 'R-19'].filter(id => porId.has(id)));
  const ordem = [...linhas.values()];
  const rows = ordem.map(l => {
    const r = l.fontes.map(id => porId.get(id)).find(Boolean);
    const grupo = grupoDe(l.id);
    const s = slugDe(l.id);
    const onde = s === 'desempenho-aceite' ? T('ondeTRTeste') : s === 'custo-consumo' ? T('ondeTR') : T(ONDE_GRUPO[grupo] || 'ondeContrato');
    const ver = s === 'custo-consumo' ? T('verConsumo') : s === 'desempenho-aceite' ? T('verAceite') : T(VER_GRUPO[grupo] || 'verDireitos');
    const prov = l.fontes.some(id => porId.get(id) && porId.get(id).provisoria) && k.arqPresumida;
    return {
      id: l.id, grupo: String(tr(EXIGE_REC[l.id].grupo)),
      texto: (l.id.startsWith('DADOS_REQ.') ? String(tr(EXIGE_REC[l.id].grupo)) + ': ' : '') + String(tr(EXIGE_REC[l.id].texto)) + (prov ? ' ' + T('exProvisoria') : ''),
      porque: r ? trRec(r, 'razao') : cap(T('exPerfil')), valor: valorExigir(l.id, k, d, r) || '—', verificar: ver, onde,
      vem: l.fontes.length ? l.fontes.join(', ') : cap(T('exPerfil')), fontes: l.fontes.slice(),
    };
  });
  // cláusulas-padrão (recolhidas; fora da contagem): o resto do checklist do Instrumento F
  const usados = new Set(rows.map(x => String(tr(EXIGE_REC[x.id].texto))));
  const padrao = (CONTRATO || []).filter(x => !usados.has(String(tr(x[1])))).map(x => [String(tr(x[0])), String(tr(x[1]))]);
  return { titulo: T('exT'), intro: T('exIntro'), linhas: rows, n: rows.length, padrao, padraoTitulo: T('exPadraoT'), padraoIntro: T('exPadraoIntro'), mercado: T('exMercado'),
    head: [T('exReq'), T('exPorque'), T('exValor'), T('exVerificar'), T('exOnde'), T('exVem')] };
}

// ----------------------------------------------------------- premissas da ferramenta (REC-44) e exemplos de norma
function premissasRel(k) {
  const ce = k.ce || {};
  const L = [];
  if (ce.contestacao && ce.contestacao !== 'na') L.push(T('premContest', [rotOpc('contestacao', ce.contestacao) || ce.contestacao]));
  if (!ce.treino || ce.treino === 'nao_sei') L.push(T('premTreino'));
  if (!ce.vulneraveis) L.push(T('premVuln'));
  if (ce.verificabilidade) L.push(T('premVerif', [rotOpc('verificabilidade', ce.verificabilidade) || ce.verificabilidade]));
  if (k.arqPresumida) L.push(T('premArq', [rotOpc('arquitetura', k.arqEf)]));
  return { titulo: T('premT'), intro: T('premIntro'), rotulo: T('premRotulo'), lista: L.map(x => x + ' (' + T('premRotulo') + ')') };
}
const UE_ISO3 = ['AUT', 'BEL', 'BGR', 'HRV', 'CYP', 'CZE', 'DNK', 'EST', 'FIN', 'FRA', 'DEU', 'GRC', 'HUN', 'IRL', 'ITA', 'LVA', 'LTU', 'LUX', 'MLT', 'NLD', 'POL', 'PRT', 'ROU', 'SVK', 'SVN', 'ESP', 'SWE'];
function normasRel(estado, res) {
  const pais = String(((estado || {}).caso || {}).pais || '');
  const chaves = pais === 'BRA' ? ['BR'] : UE_ISO3.includes(pais) ? ['UE'] : pais && pais !== 'outro' ? [] : ['BR', 'UE'];
  const rot = { BR: T('normBR'), UE: T('normUE') };
  const itens = [];
  (res.recs || []).forEach(r => {
    const ex = r.exemplosNorma;
    if (!ex) return;
    const partes = chaves.filter(c => (ex[c] || []).length).map(c => rot[c] + ': ' + ex[c].join('; '));
    if (partes.length) itens.push({ id: r.id, oque: trRec(r, 'oque'), normas: partes });
  });
  return { titulo: T('normT'), intro: T('normIntro'), itens, vazio: itens.length ? '' : T('normSem') };
}

// ----------------------------------------------------------- tudo junto
/** Contexto das regras (recContexto) sem quebrar: o mesmo que o motor usa para a ficha de aceite e as condições. */
function contexto(estado) {
  try { return recContexto(estado); } catch (e) { console.warn(e); return null; }
}
/**
 * Dados das recomendações para a página, o PDF e a síntese (já traduzidos). d (opcional): numerosRec(estado).
 * Caso sem caso (estado vazio): { vazio: true, veredito }.
 */
export function planoRec(estado, d, pre) {
  if (!estado || !estado.caso) return null;
  let res = pre && pre.res;
  if (!res) { try { res = resultadoRecomendacoes(estado); } catch (e) { console.warn(e); return null; } }
  const k = contexto(estado) || { usuarios: [], ce: {} };
  if (d === undefined) { try { d = numerosRec(estado); } catch (e) { d = null; } }
  const veredito = vereditoRel(res);
  const cartoes = cartoesRel(res);
  const exigir = exigirRel(estado, res, k, d);
  const out = {
    vazio: !(res.recs || []).length, vazioInfo: res.vazio ? { texto: String(tr(res.vazio.texto)), explicacao: String(tr(res.vazio.explicacao)), perguntas: (res.vazio.perguntas || []).map(p => ({ campo: p.campo, n: p.n, pergunta: String(tr(p.pergunta || '')) })) } : null,
    rotulos: { principal: T('recPrincipal'), cuidado: T('cuidadoT'), oque: T('cOque'), porque: T('cPorque'), paraque: T('cParaque'), como: T('cComo'), quem: T('cQuem'),
      marco: T('cMarco'), jogo: T('cJogo'), pronto: T('cPronto'), origem: T('cOrigem'), junto: T('cJunto'), pendT: T('pendT'), pendIntro: T('pendIntro'), pendVazio: T('pendVazio'),
      pendResponder: T('pendResponder'), pendAtual: T('pendAtual'), refT: T('refT'), refIntro: T('refIntro') },
    veredito, porque: veredito.porque ? T('porqueVer', [minusc(semPonto(veredito.porque)) + '.']) : '',
    aviso: avisoRel(res), cuidado: cuidadoRel(res, k, cartoes), cartoes, contadores: contadoresRel(estado, res, k), pend: pendRel(res),
    sequencia: sequenciaRel(estado, res, k, d, exigir.n), teste: testeRel(estado, res, k, d), plano: planoRel(res), exigir,
    premissas: premissasRel(k), normas: normasRel(estado, res), nRecs: (res.recs || []).length, nCondicoes: (res.condicoes || []).length,
    idsAcao: (res.recs || []).map(r => r.id),
  };
  out.proximo = proximoDe(out, d);
  return out;
}
function proximoDe(P, d) {
  const ano0 = d ? numero('ano0', d) : null, dot0 = d ? numero('dotAno0', d) : null;
  const custo = ano0 && !ano0.falta ? (dot0 && !dot0.falta ? T('proxCusto', [ano0.valor, dot0.valor]) : T('proxCusto0', [ano0.valor])) : '';
  const f = P.contadores.faltam.n;
  return {
    titulo: T('proxT'), veredito: P.veredito.texto, porque: P.porque,
    acoesTitulo: T('proxAcoes'), acoes: P.cartoes.slice(0, 3).map(c => ({ id: c.id, oque: c.oque, quem: c.quem, marco: c.marco, linha: T('quemMarco', { quem: c.quem, marco: c.marco }) })),
    custo, cuidado: P.cuidado[0] || '', faltam: f, faltamTxt: f ? (f === 1 ? T('proxFaltam1') : T('proxFaltamN', [f])) : '', pdf: T('proxPdf'),
  };
}
/** O bloco "Seu próximo passo" do fim do capítulo 4 (5.6, REC-42). */
export function proximoPasso(estado) {
  const P = planoRec(estado);
  return P ? P.proximo : null;
}

// ----------------------------------------------------------- listas do guia (REC-43)
// Itens das listas de referência do guia (plano_dados.js:RECS) que correspondem a ações do catálogo: quando a ação
// dispara no caso, a lista cita o R-nn em vez de repetir o texto (COM-19).
export const GUIA_R = {
  'r-baselegal': ['R-26'], 'r-acordo': ['R-26'], 'r-sucesso': ['R-11', 'R-01'], 'r-parada': ['R-09'], 'r-ativos': ['R-57', 'R-67'], 'r-gratuito': ['R-57', 'R-111'],
  'p-adocao': ['R-15'], 'p-formacao': ['R-45'], 'p-apoio': ['R-47'], 'p-protecao': ['R-26', 'R-28'], 'p-disp': ['R-48', 'R-29', 'R-30'], 'p-conect': ['R-95', 'R-96', 'R-53'],
  'p-desplug': ['R-53'], 'p-idiomas': ['R-52'],
  'i-evidencia': ['R-20', 'R-22'], 'i-contrato': ['R-64', 'R-65', 'R-66'], 'i-supervisao': ['R-31'], 'i-adocao': ['R-21'], 'i-acessib': ['R-52'], 'i-pico': ['R-79'],
  'i-integra': ['R-81'], 'i-base': ['R-54'], 'i-finalidade': ['R-42'], 'i-portab': ['R-66', 'R-65'], 'i-dpia': ['R-26'], 'i-adversarial': ['R-80'], 'i-formacao': ['R-45'],
  'i-monitor': ['R-82'], 'i-gestao': ['R-70'], 'i-contestacao': ['R-32'], 'i-rastreio': ['R-71'],
  's-continuidade': ['R-85'], 's-saida': ['R-66'], 's-equidade': ['R-33'], 's-formacao': ['R-112'], 's-adocao': ['R-15'], 's-renovacao': ['R-100'],
  'g-avaliacao': ['R-18'],
};
/** Texto de um item da lista do guia: o próprio texto ou "Ver R-31 no plano de ação." quando a ação dispara no caso. */
export function itemGuia(idGuia, texto, idsCaso) {
  const ids = (GUIA_R[idGuia] || []).filter(id => idsCaso && idsCaso.includes(id));
  return ids.length ? T('refVer', [ids.join(', ')]) : texto;
}

/** Textos novos do pacote R6 (chaves de tradução para o orquestrador). */
export const TEXTOS_REC_R6 = Object.values(TXT_R6);
