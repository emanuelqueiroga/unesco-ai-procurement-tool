// =====================================================================
// v13 · Matriz camadas × fases (RQ-02, RQ-03)
// Linhas: as sete camadas do quadro de custo total de Krueger e Jackson (2026, Figura 1, p. 11).
// Colunas: as quatro fases desta ferramenta. O documento não associa camadas a fases: a distribuição por fase,
// o texto de cada célula e as perguntas ligadas a ela são elaboração desta ferramenta (CREDITO_MATRIZ).
// Fonte única para: a imagem da página inicial, a tabela da matriz (visualizador, ⓘ das camadas, plano e PDF)
// e a classificação da camada 2 no piloto (MATRIZ_DESCE).
// Célula: { t: o que é preciso decidir ou saber, q: ids de perguntas (CAMPOS.id ou QUESTOES_G.id), na: não se aplica }
// =====================================================================
const FASES_MATRIZ = ['contexto', 'piloto', 'implantacao', 'expansao'];
const CREDITO_MATRIZ = 'Camadas: Krueger e Jackson (2026, p. 11). Distribuição por fase: elaboração desta ferramenta.';
const TIT_MATRIZ = 'O que cada fase exige, por camada';
const NOTA_MATRIZ_CUSTO = 'Custo de cada célula, na conta econômica e em valores ilustrativos: fase 2 = Ano 0; fase 3 = Ano 1; fase 4 = Anos 2 em diante e saída. A fase 1 não tem custo estimado.';
const MATRIZ = {
  1: {
    contexto: { t: 'Saber quem decide, com que regras, normas e orçamento; definir a prioridade, os problemas e a linha de base.', q: ['g-comite', 'g-politica', 'g-legislacao', 'g-dados', 'g-etica', 'g-compras', 'prioridades', 'problemas', 'linhaBase', 'alternativa'] },
    piloto: { t: 'Escolher entre prova de conceito e piloto, com critérios de sucesso e de parada e aprovação da equipe responsável.', q: ['testes'] },
    implantacao: { t: 'Contratar com o custo do ciclo de vida, cláusulas de dados e de saída e um plano de avaliação.', q: [] },
    expansao: { t: 'Revisar a política, avaliar os resultados e decidir sobre continuidade, expansão ou saída.', q: ['expansao', 'horizonte'] },
  },
  2: {
    contexto: { t: 'Definir o impacto desejado e o resultado esperado, a partir dos problemas marcados.', q: ['impactos', 'resultado'] },
    piloto: { t: 'O que a IA faz, quem usa e o que se faz com a resposta; quais ferramentas, o tipo de tecnologia, o pagamento no teste e o tamanho do teste.', q: ['tarefas', 'titulo', 'usuarios', 'afetados', 'consequencias', 'nFerramentas', 'conheceFerramentas', 'ferramentas', 'tipoTec', 'pagamento', 'piloto'] },
    implantacao: { t: 'Licença, nível de adaptação, frequência de uso e quantas escolas e pessoas começam.', q: ['frequencia', 'licenca', 'adaptacao', 'implantacao'] },
    expansao: { t: 'Quantas pessoas usariam em toda a rede e em quanto tempo.', q: ['elegiveis', 'expansao'] },
  },
  3: {
    contexto: { t: 'Escolas e estudantes por etapa, a base para estimar conexão e dispositivos.', q: ['etapas', 'grade'] },
    piloto: { t: 'Internet e dispositivos para o uso previsto.', q: ['internet', 'escolasInternet', 'modeloDisp', 'dispExistem'] },
    implantacao: { t: 'Conexão e dispositivos para as escolas da primeira etapa.', q: ['implantacao'] },
    expansao: { t: 'Renovação de dispositivos e capacidade de conexão para todas as escolas.', q: ['horizonte'] },
  },
  4: {
    contexto: { t: 'Saber quais sistemas a rede já usa (matrícula, login, ambiente virtual).', q: [] },
    piloto: { t: 'Usar dados de teste e integrações mínimas, sem criar dependência.', q: [] },
    implantacao: { t: 'Adaptação ao contexto, arquitetura e integração com os sistemas da rede.', q: ['adaptacao', 'arquitetura'] },
    expansao: { t: 'Manter as integrações e garantir a portabilidade dos dados.', q: [] },
  },
  5: {
    contexto: { t: 'Política de dados educacionais e normas aplicáveis.', q: ['g-dados', 'g-legislacao'] },
    piloto: { t: 'Quem é afetado e o que se decide com a resposta da ferramenta (nível de risco).', q: ['afetados', 'consequencias'] },
    implantacao: { t: 'Análise de privacidade e de segurança da arquitetura escolhida; contas e permissões.', q: ['arquitetura'] },
    expansao: { t: 'Auditorias, gestão de incidentes e dos fornecedores terceiros.', q: [] },
  },
  6: {
    contexto: { t: 'Orientações de uso responsável que a formação vai transmitir.', q: ['g-etica'] },
    piloto: { t: 'Quem será formado, que tipo de formação, em que formato, por quantas horas e quem paga.', q: ['formados', 'formacaoTipo', 'formacaoFormato', 'formacaoHoras', 'formacaoPaga'] },
    implantacao: { t: 'Formação das escolas e das pessoas da primeira etapa.', q: ['implantacao'] },
    expansao: { t: 'Formação contínua, por função, e de quem chega à rede.', q: [] },
  },
  7: {
    contexto: { t: 'Não se aplica nesta fase.', q: [], na: true },
    piloto: { t: 'Suporte aos usuários e acompanhamento do uso para avaliar o teste.', q: ['suporteQuem', 'suporteNivel', 'acompanhamento'] },
    implantacao: { t: 'Suporte e acompanhamento na primeira etapa; gestão do fornecedor.', q: [] },
    expansao: { t: 'Sustentabilidade: orçamento recorrente, manutenção, avaliação e plano de saída.', q: ['horizonte', 'expansao'] },
  },
};
// Camada 2 no teste (RQ-13): perguntas que descem para a implantação (passo 3.1) quando a resposta 2.0 é
// prova de conceito, piloto ou os dois. Na prova de conceito, sem usuários reais, descem também 2.2.2 e 2.2.3.
const MATRIZ_DESCE = { piloto: ['frequencia', 'licenca', 'adaptacao'], poc: ['afetados', 'consequencias', 'frequencia', 'licenca', 'adaptacao'] };
// Modo do teste para a camada 2: 'poc' | 'piloto' ('ambos' segue o piloto) | '' (sem resposta ou "recomende")
function modoCamada2(c) {
  const m = typeof modoTeste === 'function' ? modoTeste(c) : '';
  return m === 'poc' ? 'poc' : (m === 'piloto' || m === 'ambos') ? 'piloto' : '';
}
// Perguntas da camada 2 que, neste caso, ficam para a implantação
function camposDescidos(c) { const m = modoCamada2(c); return m ? MATRIZ_DESCE[m].slice() : []; }

// ----------------------------------------------------------- matriz do caso
// Número de uma pergunta para exibir na célula
function numPergunta(id) {
  if (typeof CAMPO_POR_ID !== 'undefined' && CAMPO_POR_ID[id]) return CAMPO_POR_ID[id].n;
  const g = typeof QUESTOES_G !== 'undefined' ? QUESTOES_G.find(x => x.id === id) : null;
  return g ? g.n : '';
}
// Respondida? Perguntas de governança: S.resp; demais: qOk (fluxo.js); invisíveis não contam.
function perguntaRespondida(id) {
  if (/^g-/.test(id)) return !!((typeof S !== 'undefined' && S.resp) || {})[id];
  const f = typeof CAMPO_POR_ID !== 'undefined' ? CAMPO_POR_ID[id] : null;
  if (!f) return null;
  if (typeof visivel === 'function' && !visivel(f)) return null;
  return typeof qOk === 'function' ? !!qOk(f) : null;
}
// Estado de uma célula: 'na' | 'orientacao' (sem perguntas) | 'ok' | 'andamento' | 'pendente'
function estadoCelula(cel) {
  if (cel.na) return 'na';
  const rs = (cel.q || []).map(perguntaRespondida).filter(v => v !== null);
  if (!rs.length) return 'orientacao';
  if (rs.every(Boolean)) return 'ok';
  return rs.some(Boolean) ? 'andamento' : 'pendente';
}
// Custo por camada e fase a partir de somaPorCamada (custos.js): fase 2 = Ano 0; fase 3 = Ano 1;
// fase 4 = total do ciclo − Anos 0 e 1 (Anos 2 a H, saída e valor residual). Soma das células = total do ciclo.
function custoMatriz(sc) {
  if (!sc || !sc.porAno || !sc.total) return null;
  const out = {};
  for (let k = 1; k <= 7; k++) {
    const pa = sc.porAno[k] || [], a0 = +pa[0] || 0, a1 = +pa[1] || 0;
    out[k] = { contexto: null, piloto: a0, implantacao: a1, expansao: (+sc.total[k] || 0) - a0 - a1 };
  }
  return out;
}
// { celulas: {camada: {fase: {t, q, n: [números], estado, custo}}}, custo: bool }
function matrizCaso() {
  let custo = null;
  try {
    if (typeof faltasEstimativa === 'function' && !faltasEstimativa().length && typeof numerosCusto === 'function') {
      const n = numerosCusto(); custo = custoMatriz(n.camadas || (typeof somaPorCamada === 'function' ? somaPorCamada(n.av) : null));
    }
  } catch (e) { custo = null; }
  const celulas = {};
  for (let k = 1; k <= 7; k++) {
    celulas[k] = {};
    FASES_MATRIZ.forEach(f => {
      const cel = MATRIZ[k][f];
      celulas[k][f] = { t: cel.t, q: cel.q.slice(), n: cel.q.map(numPergunta).filter(Boolean), na: !!cel.na,
        estado: estadoCelula(cel), custo: custo && f !== 'contexto' ? custo[k][f] : null };
    });
  }
  return { celulas, custo: !!custo };
}

if (typeof module !== 'undefined') module.exports = { FASES_MATRIZ, CREDITO_MATRIZ, TIT_MATRIZ, NOTA_MATRIZ_CUSTO, MATRIZ, MATRIZ_DESCE, modoCamada2, camposDescidos, numPergunta, estadoCelula, custoMatriz, matrizCaso };
