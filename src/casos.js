// =====================================================================
// Casos ilustrativos do guia (A–D) e conversão do caso em premissas de custo
// =====================================================================
const CASO_VAZIO = {
  titulo: '', situacao: 'nova', problema: '', resultado: '', populacao: '', linhaBase: 'nao', alternativaSemIA: false,
  capacidade: [], classes: [], autonomia: 2, usuarios: [], afetados: [], vulneraveis: false, idiomas: false,
  consequencias: ['nenhuma'], dados: ['nenhum'], treino: 'nao_sei', elegiveis: 1000, alcance: '', frequencia: 'semanal',
  reversibilidade: 'tempo', verificabilidade: 'parcial', contestacao: 'na', cumulativo: 'nao',
  arquitetura: 'indefinida', pilotoGratuito: false, degrau: 2, ajustes: {},
};

const CASOS = {
  A: Object.assign({}, CASO_VAZIO, {
    titulo: 'Copiloto para professores', situacao: 'proposta',
    problema: 'Professores do ensino fundamental relatam gastar parte relevante da semana preparando atividades e materiais adaptados, tempo que deixa de ir para o acompanhamento dos estudantes. A secretaria não sabe quanto tempo é gasto, em que tarefas, nem se a carga é igual entre escolas.',
    resultado: 'Reduzir o tempo de preparação de materiais sem perda de qualidade pedagógica, liberando tempo para acompanhamento individual.',
    populacao: '12.000 professores do ensino fundamental da rede',
    linhaBase: 'parcial', alternativaSemIA: true, capacidade: ['finalidade', 'risco', 'contas'],
    classes: ['geracao'], autonomia: 2, usuarios: ['professores'], afetados: ['professores', 'criancas'],
    consequencias: ['nenhuma'], dados: ['pessoais_serv'], treino: 'nao_sei', elegiveis: 12000, frequencia: 'semanal',
    reversibilidade: 'antes', verificabilidade: 'parcial', contestacao: 'na', cumulativo: 'nao', arquitetura: 'saas', degrau: 2,
  }),
  B: Object.assign({}, CASO_VAZIO, {
    titulo: 'Tutor de matemática para estudantes', situacao: 'nova',
    problema: 'Nos anos finais do ensino fundamental, a proporção de estudantes abaixo do nível adequado em matemática é alta e desigual entre escolas. Os professores não conseguem oferecer prática individualizada e retorno imediato a turmas numerosas.',
    resultado: 'Aumentar a proficiência em matemática dos estudantes com maior defasagem, reduzindo a diferença entre escolas.',
    populacao: 'Estudantes dos anos finais do ensino fundamental, a partir de 20 escolas piloto',
    linhaBase: 'sim', alternativaSemIA: true, capacidade: ['finalidade', 'risco', 'evidencia', 'continuidade', 'contas'],
    classes: ['tutoria', 'geracao', 'recomendacao'], autonomia: 3, usuarios: ['estudantes', 'professores'], afetados: ['criancas', 'professores', 'familias'],
    vulneraveis: true, idiomas: true, consequencias: ['formativa', 'apoio_est'], dados: ['pessoais_est', 'sensiveis'], treino: 'nao',
    elegiveis: 150000, frequencia: 'continua', reversibilidade: 'lenta', verificabilidade: 'sim', contestacao: 'formal', cumulativo: 'sim',
    arquitetura: 'ow', degrau: 2,
  }),
  C: Object.assign({}, CASO_VAZIO, {
    titulo: 'Alerta precoce de abandono escolar', situacao: 'nova',
    problema: 'A taxa de abandono no ensino médio está concentrada em algumas escolas e grupos. As equipes identificam estudantes em risco tarde, quando as faltas já se acumularam, e não há critério comum para priorizar o apoio.',
    resultado: 'Identificar mais cedo os estudantes que se beneficiariam de apoio e reduzir o abandono, sem gerar estigmatização.',
    populacao: 'Estudantes do ensino médio da rede estadual',
    linhaBase: 'sim', alternativaSemIA: false, capacidade: ['finalidade', 'contas'],
    classes: ['previsao', 'apoio'], autonomia: 3, usuarios: ['gestores', 'professores'], afetados: ['criancas', 'familias'],
    vulneraveis: true, consequencias: ['apoio_est', 'recursos'], dados: ['pessoais_est', 'sensiveis'], treino: 'nao_sei',
    elegiveis: 2500, alcance: 80000, frequencia: 'semanal', reversibilidade: 'lenta', verificabilidade: 'parcial', contestacao: 'nao', cumulativo: 'sim',
    arquitetura: 'indefinida', degrau: 2,
  }),
  D: Object.assign({}, CASO_VAZIO, {
    titulo: 'Assistente para solicitações das escolas', situacao: 'orcamento',
    problema: 'As escolas enviam milhares de solicitações por mês à secretaria sobre normas, prazos e procedimentos. Respostas demoram, variam entre servidores e parte das dúvidas se repete.',
    resultado: 'Reduzir o tempo de resposta e a variação entre respostas, mantendo a correção normativa.',
    populacao: '3.000 servidores e gestores escolares',
    linhaBase: 'parcial', alternativaSemIA: true, capacidade: ['finalidade', 'risco', 'evidencia', 'continuidade', 'contas'],
    classes: ['classificacao', 'geracao'], autonomia: 2, usuarios: ['administrativo', 'gestores'], afetados: ['servidores'],
    consequencias: ['organizacao'], dados: ['pessoais_serv'], treino: 'nao', elegiveis: 3000, frequencia: 'diaria',
    reversibilidade: 'antes', verificabilidade: 'sim', contestacao: 'na', cumulativo: 'nao', arquitetura: 'api', pilotoGratuito: true, degrau: 2,
  }),
};

// ---------------------------------------------------------------------
// Governança proporcional ao risco (Tab. 11.x) em linhas de custo
// ---------------------------------------------------------------------
function governancaPorRisco(cfg, nivel) {
  const alto = nivel === 'elevado' || nivel === 'critico';
  const mod = nivel === 'moderado';
  // remove as linhas de governança (K5), testes de aceitação (K3.4) e reavaliação (K6.2) do exemplo de origem
  const gov = s => /^K5\./.test(s || '') || s === 'K3.4' || s === 'K6.2';
  const govCat = c => ['Governança', 'Monitoramento', 'Avaliação', 'Mudança tecnológica'].includes(c);
  cfg.pessoas = (cfg.pessoas || []).filter(p => !(p.s ? gov(p.s) : govCat(p.cat)));
  cfg.itens = (cfg.itens || []).filter(x => !(x.s ? gov(x.s) : govCat(x.cat)));
  const fte = (y0, y) => [y0, y, y, y];
  cfg.pessoas.push({ cat: 'Governança', s: 'K5.1', nome: 'Gestão contratual e de fornecedor', nat: 'C', partes: [['gestor_contrato', fte(0, alto ? 0.15 : mod ? 0.1 : 0.05)]] });
  cfg.pessoas.push({ cat: 'Governança', s: 'K5.2', nome: 'Privacidade, segurança e conformidade', nat: 'C', partes: [['analista_privacidade', fte(alto ? 0.15 : 0.05, alto ? 0.3 : mod ? 0.1 : 0.05)]] });
  if (alto || mod) cfg.pessoas.push({ cat: 'Monitoramento', s: 'K5.3', nome: 'Monitoramento e revisão de saídas', nat: 'C', partes: [['especialista_pedagogico', fte(alto ? 0.5 : 0, alto ? 1.0 : 0.2)]] });
  if (alto) {
    cfg.itens.push({ cat: 'Avaliação', s: 'K5.5', nome: 'Avaliação de impacto com comparador', nat: 'D', v: [0, 60000, 60000, 0] });
    cfg.itens.push({ cat: 'Governança', s: 'K5.4', nome: 'Testes adversariais externos e auditoria anual', nat: 'D', v: [0, 45000, 45000, 45000] });
    cfg.itens.push({ cat: 'Mudança tecnológica', s: 'K6.2', nome: 'Reavaliação por mudança material, com testes por grupo', nat: 'D', v: [0, 10000, 10000, 10000] });
  } else if (mod) {
    cfg.itens.push({ cat: 'Avaliação', s: 'K5.5', nome: 'Avaliação externa na expansão', nat: 'D', v: [0, 25000, 0, 20000] });
    cfg.itens.push({ cat: 'Governança', s: 'K5.4', nome: 'Auditoria pontual (valor a estimar)', nat: 'D', v: [0, 0, 0, 0], aEstimar: true });
  } else {
    cfg.itens.push({ cat: 'Avaliação', s: 'K3.4', nome: 'Teste local e conjunto de avaliação', nat: 'D', v: [12000, 0, 0, 0] });
    cfg.itens.push({ cat: 'Mudança tecnológica', s: 'K6.2', nome: 'Reexecução dos testes a cada versão', nat: 'D', v: [0, 6000, 6000, 6000] });
  }
  return cfg;
}

function cfgDoCaso(c, perfil) {
  const arq = c.arquitetura === 'indefinida' ? 'saas' : c.arquitetura;
  const base = { saas: 'A', api: 'B', ow: 'C' }[arq];
  const cfg = clone(PRESETS[base]);
  const E = Math.max(1, Math.round(+c.elegiveis || 1));
  const E0 = Math.min(E, Math.max(50, Math.round(E * 0.05)));
  cfg.nome = 'Seu caso' + (c.titulo ? ': ' + c.titulo : '');
  cfg.origem = base;
  cfg.risco = perfil.agregado;
  cfg.unidade = 'usuário'; cfg.unidadePl = 'usuários';
  cfg.demanda.E = [E0, E, E, E];
  if (cfg.saas) cfg.saas.qtd = [E0, E, E, E];
  governancaPorRisco(cfg, perfil.agregado);
  return cfg;
}

if (typeof module !== 'undefined') module.exports = { CASO_VAZIO, CASOS, cfgDoCaso, governancaPorRisco };
