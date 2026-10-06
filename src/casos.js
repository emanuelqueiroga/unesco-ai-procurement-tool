// =====================================================================
// Modelo do caso (v9), exemplos ilustrativos (A–D) e conversão do caso
// efetivo em premissas de custo (cfgDoCaso).
// =====================================================================
const CASO_VAZIO = {
  titulo: '', situacao: 'nova', problema: '', resultado: '', linhaBase: 'nao', alternativa: '',
  impactos: [], impactoOutro: '',
  teste: '', tarefas: [], tarefaOutra: '',
  usuarios: [], afetados: [], consequencias: ['nenhuma'], frequencia: 'semanal',
  tipoTec: '', pagamento: '', licenca: '', adaptacao: '', infra: '',
  piloto: { escolas: '', participantes: '', meses: '' }, arquiteturaManual: '',
  elegiveis: '', expansao: 'ano1', horizonte: 3, pagaDepois: '', fonte: '',
  ajustes: {}, degrau: 2,
};

const novoCaso = x => Object.assign(JSON.parse(JSON.stringify(CASO_VAZIO)), x);
const CASOS = {
  A: novoCaso({
    titulo: 'Copiloto para professores', situacao: 'proposta',
    problema: 'Professores do ensino fundamental relatam gastar parte relevante da semana preparando atividades e materiais adaptados, tempo que deixa de ir para o acompanhamento dos estudantes. A secretaria não sabe quanto tempo é gasto, em que tarefas, nem se a carga é igual entre escolas.',
    resultado: 'Reduzir o tempo de preparação de materiais sem perda de qualidade pedagógica, liberando tempo para acompanhamento individual.',
    impactos: ['tempo_docente'], linhaBase: 'parcial', alternativa: 'sim',
    teste: 'piloto', tarefas: ['planos_aula', 'materiais'],
    usuarios: ['professores'], afetados: ['professores', 'criancas'], consequencias: ['nenhuma'], frequencia: 'semanal',
    tipoTec: 'paga', pagamento: 'institucional', licenca: 'assinatura', adaptacao: 'integracao', infra: 'sim',
    piloto: { escolas: 20, participantes: 600, meses: 4 },
    elegiveis: 12000, expansao: 'ano1', horizonte: 3, pagaDepois: 'rede', fonte: 'parcial',
  }),
  B: novoCaso({
    titulo: 'Tutor de matemática para estudantes', situacao: 'nova',
    problema: 'Nos anos finais do ensino fundamental, a proporção de estudantes abaixo do nível adequado em matemática é alta e desigual entre escolas. Os professores não conseguem oferecer prática individualizada e retorno imediato a turmas numerosas.',
    resultado: 'Aumentar a proficiência em matemática dos estudantes com maior defasagem, reduzindo a diferença entre escolas.',
    impactos: ['aprendizagem', 'desigualdade'], linhaBase: 'sim', alternativa: 'sim',
    teste: 'piloto', tarefas: ['tutoria'],
    usuarios: ['estudantes', 'professores'], afetados: ['criancas', 'professores', 'familias'], consequencias: ['formativa', 'apoio_est'], frequencia: 'continua',
    tipoTec: 'aberta', pagamento: 'consumo', licenca: 'aberta', adaptacao: 'sob_medida', infra: 'sim',
    piloto: { escolas: 20, participantes: 6000, meses: 4 },
    elegiveis: 150000, expansao: 'ano2', horizonte: 3, pagaDepois: 'rede', fonte: 'nao',
  }),
  C: novoCaso({
    titulo: 'Alerta precoce de abandono escolar', situacao: 'nova',
    problema: 'A taxa de abandono no ensino médio está concentrada em algumas escolas e grupos. As equipes identificam estudantes em risco tarde, quando as faltas já se acumularam, e não há critério comum para priorizar o apoio.',
    resultado: 'Identificar mais cedo os estudantes que se beneficiariam de apoio e reduzir o abandono, sem gerar estigmatização.',
    impactos: ['permanencia'], linhaBase: 'sim', alternativa: 'nao',
    teste: 'recomendar', tarefas: ['alerta_precoce'],
    usuarios: ['gestores', 'professores'], afetados: ['criancas', 'familias'], consequencias: ['apoio_est', 'recursos'], frequencia: 'semanal',
    tipoTec: 'nao_sei', pagamento: 'institucional', licenca: 'nao_sei', adaptacao: 'integracao', infra: 'sim',
    piloto: { escolas: 10, participantes: 120, meses: 6 },
    elegiveis: 2500, expansao: 'ano1', horizonte: 3, pagaDepois: 'indefinido', fonte: 'parcial',
  }),
  D: novoCaso({
    titulo: 'Assistente para solicitações das escolas', situacao: 'orcamento',
    problema: 'As escolas enviam milhares de solicitações por mês à secretaria sobre normas, prazos e procedimentos. Respostas demoram, variam entre servidores e parte das dúvidas se repete.',
    resultado: 'Reduzir o tempo de resposta e a variação entre respostas, mantendo a correção normativa.',
    impactos: ['gestao'], linhaBase: 'parcial', alternativa: 'sim',
    teste: 'poc', tarefas: ['duvidas'],
    usuarios: ['administrativo', 'gestores'], afetados: ['servidores'], consequencias: ['organizacao'], frequencia: 'diaria',
    tipoTec: 'paga', pagamento: 'gratuito', licenca: 'termos', adaptacao: 'sob_medida', infra: 'sim',
    piloto: { escolas: '', participantes: 150, meses: 3 }, arquiteturaManual: 'api',
    elegiveis: 3000, expansao: 'ano1', horizonte: 3, pagaDepois: 'rede', fonte: 'sim',
  }),
};

// Exemplos ilustrativos de contexto (coerentes com os casos A–D); estudantes por ano ou série.
const CTX_EX = {
  A: { nivel: 'estado', local: 'Rede estadual (exemplo)', etapas: {
    fund2: { on: true, escolas: 420, anos: [41000, 40000, 40000, 39000], alunos: 160000, soTotal: false },
    medio: { on: true, escolas: 380, anos: [48000, 47000, 45000], alunos: 140000, soTotal: false } },
    dominio: 'qualificacao', comps: ['alfabetizacao', 'matematica', 'ciencias'], olhando: 'Professores dedicam muitas horas ao planejamento de aulas e à adaptação de materiais.' },
  B: { nivel: 'estado', local: 'Rede estadual (exemplo)', etapas: {
    fund2: { on: true, escolas: 600, anos: [40000, 38000, 37000, 35000], alunos: 150000, soTotal: false } },
    dominio: 'qualificacao', comps: ['matematica'], olhando: 'Estudantes chegam ao 9º ano com proficiência em matemática abaixo do esperado.' },
  C: { nivel: 'estado', local: 'Rede estadual (exemplo)', etapas: {
    medio: { on: true, escolas: 300, anos: [28000, 27000, 25000], alunos: 80000, soTotal: false } },
    dominio: 'qualificacao', comps: ['outro'], compOutro: 'Permanência e conclusão do ensino médio', olhando: 'Alta taxa de abandono no 1º ano do ensino médio.' },
  D: { nivel: 'municipio', local: 'Secretaria municipal (exemplo)', etapas: {
    infantil: { on: true, escolas: 120, anos: [12000, 18000], alunos: 30000, soTotal: false },
    fund1: { on: true, escolas: 150, anos: [9000, 9000, 9000, 9000, 9000], alunos: 45000, soTotal: false } },
    dominio: 'qualificacao', comps: ['outro'], compOutro: 'Gestão escolar: normas, prazos e procedimentos', olhando: 'Servidores das escolas esperam dias por respostas sobre normas e procedimentos.' },
};
// Respostas de governança (1.3) dos exemplos
const RESP_EX = {
  A: { 'g-comite': 'parcial', 'g-politica': 'sim', 'g-legislacao': 'sim', 'g-dados': 'sim', 'g-etica': 'parcial', 'g-compras': 'parcial' },
  B: { 'g-comite': 'parcial', 'g-politica': 'nao', 'g-legislacao': 'sim', 'g-dados': 'parcial', 'g-etica': 'nao', 'g-compras': 'parcial' },
  C: { 'g-comite': 'sim', 'g-politica': 'parcial', 'g-legislacao': 'sim', 'g-dados': 'parcial', 'g-etica': 'nao', 'g-compras': 'nao' },
  D: { 'g-comite': 'nao', 'g-politica': 'nao', 'g-legislacao': 'parcial', 'g-dados': 'sim', 'g-etica': 'nao', 'g-compras': 'parcial' },
};

// ---------------------------------------------------------------------
// Adaptação ao contexto (2.3.4) → multiplicadores de K3.1 e K3.2.
// CONVENÇÃO EDITORIAL ILUSTRATIVA DESTA FERRAMENTA, NÃO EVIDÊNCIA: os índices só ordenam
// os níveis de adaptação em relação ao nível que cada exemplo do guia (cap. 12) já representa.
// Nível de referência: preset A (SaaS com integração SSO, diretório e AVA) = integracao;
// preset B (aplicação própria com API e RAG) e preset C (tutor em pesos abertos) = sob_medida.
// ---------------------------------------------------------------------
const ADAPTACAO = {
  indices: {
    config: { K31: 0.2, K32: 1.0 },
    conteudo: { K31: 0.2, K32: 2.0 },
    integracao: { K31: 1.0, K32: 2.0 },
    sob_medida: { K31: 2.5, K32: 2.5 },
  },
  referencia: { A: 'integracao', B: 'sob_medida', C: 'sob_medida' },
};
function fatoresAdaptacao(nivel, base) {
  const I = ADAPTACAO.indices;
  const b = ({ saas: 'A', api: 'B', ow: 'C' })[base] || base;
  const ref = I[ADAPTACAO.referencia[b] || 'integracao'];
  if (!nivel || !I[nivel]) return { fK31: 1, fK32: 1 };
  return { fK31: I[nivel].K31 / ref.K31, fK32: I[nivel].K32 / ref.K32 };
}

// Condições de base (K1) quando as escolas precisam de complemento de dispositivos e internet (2.3.5).
// CONVENÇÃO EDITORIAL ILUSTRATIVA, NÃO EVIDÊNCIA: fração de usuários sem dispositivo, preço de
// referência de um dispositivo (moeda local, valores em US$ do Ano 0) e conectividade incremental
// por escola e por ano. Substitua por dados locais.
const PREMISSAS_K1 = { fracaoSemDispositivo: 0.25, precoDispositivo: 300, conectEscolaAno: 600 };

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

// ---------------------------------------------------------------------
// Caso efetivo (casoEfetivo) → premissas do motor de custo (plano v9, B.10)
// ---------------------------------------------------------------------
function cfgDoCaso(ce, perfil) {
  ce = ce || {};
  let arq = ce.arquitetura;
  if (!['saas', 'api', 'ow'].includes(arq)) arq = (arq === 'indefinida' || typeof derivarArquitetura !== 'function') ? 'saas' : derivarArquitetura(ce);
  const base = { saas: 'A', api: 'B', ow: 'C' }[arq];
  const cfg = clone(PRESETS[base]);
  const agregado = (perfil && perfil.agregado) || cfg.risco;
  cfg.nome = 'Seu caso' + (ce.titulo ? ': ' + ce.titulo : '');
  cfg.origem = base;
  cfg.risco = agregado;
  cfg.unidade = 'usuário'; cfg.unidadePl = 'usuários';
  // 2. horizonte
  const H = Math.max(1, Math.round(+ce.horizonte || 3));
  cfg.opc = { H };
  const T = Array.from({ length: H + 1 }, (_, t) => t);
  // 3. demanda
  const pil = ce.piloto || {};
  const poc = ce.teste === 'poc';
  const E = Math.max(1, Math.round(+ce.elegiveis || 1));
  const E0 = Math.max(1, Math.min(E, +pil.participantes > 0 ? Math.round(+pil.participantes) : (poc ? 15 : Math.max(50, Math.round(0.05 * E)))));
  const m0 = +pil.meses > 0 ? Math.min(12, +pil.meses) : (poc ? 2 : 4);
  const Et = T.map(t => {
    if (t === 0) return E0;
    if (ce.expansao === 'ano2') return t === 1 ? Math.round(E / 3) : E;
    if (ce.expansao === 'ano3') return t === 1 ? Math.round(E / 3) : t === 2 ? Math.round(2 * E / 3) : E;
    return E;
  });
  cfg.demanda.E = Et.slice();
  cfg.demanda.meses = T.map(t => t === 0 ? m0 : ano(cfg.demanda.meses, t));
  // quem paga: Ano 0 (teste) e anos seguintes
  const pub = ce.tipoTec === 'publica';
  const cedido0 = ce.pagamento === 'gratuito' || pub;
  const cedidoT = ['parceiro', 'governo'].includes(ce.pagaDepois) || pub;
  // 4. SaaS
  if (cfg.saas && cfg.saas.ativo) {
    const s = cfg.saas;
    s.mesesCobr = T.map(t => t === 0 ? m0 : ano(s.mesesCobr, t));
    if (ce.pagamento === 'usuario') {
      s.preco = s.precoNominal;
      s.qtd = T.map(t => Math.ceil(Et[t] * ano(cfg.demanda.adocao, t) * s.fatorNominal));
    } else s.qtd = Et.slice();
    if (ce.pagamento === 'incluida') s.preco = 0;
    s.fatorPreco = T.map(t => (t === 0 ? cedido0 : cedidoT) ? 0 : 1);
  }
  // 5. API e pesos abertos
  if (arq === 'api' || arq === 'ow') {
    cfg.cedidoUso = T.map(t => (t === 0 ? cedido0 : cedidoT) ? 1 : 0);
    (cfg.mensais || []).forEach(x => { x.mesesY0 = Math.min(12, m0 + 2); });
  }
  // 6. adaptação ao contexto (convenção ilustrativa, ver ADAPTACAO)
  cfg.adaptacao = fatoresAdaptacao(ce.adaptacao, base);
  // 7. condições de base (K1), só quando é preciso complementar dispositivos e internet
  if (ce.infra === 'complementar') {
    const K = PREMISSAS_K1;
    const novos = T.map(t => t === 0 ? Et[0] : Math.max(Et[t] - Et[t - 1], 0));
    const escRede = +ce.escolasRede || 0;
    const esc = T.map(t => t === 0 ? (+pil.escolas || 1) : (escRede > 0 ? Math.round(escRede * Et[t] / E) : Math.ceil(Et[t] / 400)));
    cfg.itens = cfg.itens || [];
    cfg.itens.push({ cat: 'Condições de base', s: 'K1.2', nome: 'Dispositivos complementares (ilustrativo)', nat: 'D', orc: 'capital', moeda: 'LOC',
      v: novos.map(n => K.fracaoSemDispositivo * n * K.precoDispositivo) });
    cfg.itens.push({ cat: 'Condições de base', s: 'K1.1', nome: 'Conectividade incremental nas escolas (ilustrativo)', nat: 'D', moeda: 'LOC',
      v: esc.map(n => K.conectEscolaAno * n) });
  }
  // 8. governança proporcional ao risco
  governancaPorRisco(cfg, agregado);
  return cfg;
}

if (typeof module !== 'undefined') module.exports = { CASO_VAZIO, CASOS, CTX_EX, RESP_EX, ADAPTACAO, fatoresAdaptacao, PREMISSAS_K1, cfgDoCaso, governancaPorRisco };
