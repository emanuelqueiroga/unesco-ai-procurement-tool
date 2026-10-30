// =====================================================================
// Modelo do caso (v11), exemplos ilustrativos (A–D), migração de casos da v10
// e conversão do caso efetivo em premissas de custo (cfgDoCaso).
// =====================================================================
const CASO_VAZIO = {
  titulo: '', situacao: 'nova', problema: '', resultado: '', linhaBase: 'nao', alternativa: '',
  // v13 · 1.2.7 "Sim" ou "Em parte": para quais problemas (ids do 1.2.2 ou texto livre) e qual medida
  linhaBaseProblemas: [], linhaBaseMedida: '', linhaBaseProblemaTxt: '',
  impactos: [], impactoOutro: '',
  // 2.0 (múltipla): ⊂ {'poc','piloto'} ou ['recomendar']; casoEfetivo deriva teste ('poc'|'piloto'|'ambos'|'recomendar'|'')
  testes: [], tarefas: [], tarefaOutra: '',
  usuarios: [], afetados: [], consequencias: ['nenhuma'], frequencia: 'semanal',
  // 2.3 adoção: ferramentas (a primeira é a principal) e respostas da ferramenta principal
  nFerramentas: '', conheceFerramentas: '', ferramentas: [],
  tipoTec: '', pagamento: '', licenca: '', adaptacao: '',
  poc: { participantes: '', meses: '' }, piloto: { escolas: '', participantes: '', meses: '' },
  // 2.4 infraestrutura e dispositivos
  internet: '', escolasInternet: '', modeloDisp: '', dispExistem: '',
  // 2.5 formação
  formados: [], formacaoTipo: [], formacaoFormato: '', formacaoHoras: '', formacaoEstimativa: false, formacaoPaga: '',
  // 2.6 operação e suporte
  suporteQuem: '', suporteNivel: '', acompanhamento: '',
  // 3 implantação
  implantacao: { escolas: '', pessoas: '' }, arquitetura: '',
  // 4 expansão
  elegiveis: '', expansao: 'ano1', horizonte: 3,
  // v15: iniciativas com dimensionamento próprio (RF-005, RB-006)
  // Cada iniciativa: { prioridadeId, objetivo, beneficiarios, nivelModalidade, estrategia,
  //   dim: { professores, administrativos, beneficiarios, horasFormacao },
  //   custos: { impl, recorrente, total } }
  iniciativas: [],
  ajustes: {}, degrau: 2,
};
// Uma linha da lista de ferramentas (2.3.3). preco: US$ por usuário por mês (opcional).
const FERRAMENTA_VAZIA = { nome: '', tarefas: [], tipoTec: '', pagamento: '', preco: '' };

const novoCaso = x => Object.assign(JSON.parse(JSON.stringify(CASO_VAZIO)), x);
// Exemplos A–C: campos novos com valores neutros (internet e dispositivos existentes, formação presencial
// com as horas estimadas, suporte ampliado da própria rede, acompanhamento regular, primeira etapa da
// implantação igual à do exemplo do guia), para os números do guia continuarem iguais.
// Exemplo D: formação online (servidores administrativos), mais realista para o caso.
const CASOS = {
  A: novoCaso({
    titulo: 'Copiloto para professores', situacao: 'proposta',
    problema: 'Professores do ensino fundamental relatam gastar parte relevante da semana preparando atividades e materiais adaptados, tempo que deixa de ir para o acompanhamento dos estudantes. A secretaria não sabe quanto tempo é gasto, em que tarefas, nem se a carga é igual entre escolas.',
    resultado: 'Reduzir o tempo de preparação de materiais sem perda de qualidade pedagógica, liberando tempo para acompanhamento individual.',
    impactos: ['tempo_docente'], linhaBase: 'parcial', alternativa: 'sim',
    linhaBaseProblemas: ['C4'], linhaBaseMedida: 'Levantamento do tempo de planejamento numa amostra de escolas (exemplo)',
    testes: ['piloto'], tarefas: ['planos_aula', 'materiais'],
    usuarios: ['professores'], afetados: ['professores', 'criancas'], consequencias: ['nenhuma'], frequencia: 'semanal',
    nFerramentas: '1', conheceFerramentas: 'sim',
    ferramentas: [{ nome: 'Copiloto de planejamento (exemplo)', tarefas: ['planos_aula', 'materiais'], tipoTec: 'paga', pagamento: 'institucional', preco: '' }],
    tipoTec: 'paga', pagamento: 'institucional', licenca: 'assinatura', adaptacao: 'integracao',
    piloto: { escolas: 20, participantes: 600, meses: 4 },
    internet: 'sim', modeloDisp: 'por_professor', dispExistem: 'sim',
    formados: ['professores'], formacaoTipo: ['tecnologia', 'pedagogico'], formacaoFormato: 'presencial', formacaoEstimativa: true, formacaoPaga: 'rede',
    suporteQuem: 'rede', suporteNivel: 'ampliado', acompanhamento: 'regular',
    implantacao: { escolas: 800, pessoas: 12000 },
    elegiveis: 12000, expansao: 'ano1', horizonte: 3,
  }),
  B: novoCaso({
    titulo: 'Tutor de matemática para estudantes', situacao: 'nova',
    problema: 'Nos anos finais do ensino fundamental, a proporção de estudantes abaixo do nível adequado em matemática é alta e desigual entre escolas. Os professores não conseguem oferecer prática individualizada e retorno imediato a turmas numerosas.',
    resultado: 'Aumentar a proficiência em matemática dos estudantes com maior defasagem, reduzindo a diferença entre escolas.',
    impactos: ['aprendizagem', 'desigualdade'], linhaBase: 'sim', alternativa: 'sim',
    linhaBaseProblemas: ['C2'], linhaBaseMedida: 'Avaliação de matemática da rede no 9º ano (exemplo)',
    testes: ['piloto'], tarefas: ['tutoria'],
    usuarios: ['estudantes', 'professores'], afetados: ['criancas', 'professores', 'familias'], consequencias: ['formativa', 'apoio_est'], frequencia: 'continua',
    nFerramentas: '1', conheceFerramentas: 'sim',
    ferramentas: [{ nome: 'Tutor de matemática em modelo aberto (exemplo)', tarefas: ['tutoria'], tipoTec: 'aberta', pagamento: 'consumo', preco: '' }],
    tipoTec: 'aberta', pagamento: 'consumo', licenca: 'aberta', adaptacao: 'sob_medida',
    piloto: { escolas: 20, participantes: 6000, meses: 4 },
    internet: 'sim', modeloDisp: 'compartilhado', dispExistem: 'sim',
    formados: ['professores'], formacaoTipo: ['tecnologia', 'pedagogico', 'piloto'], formacaoFormato: 'presencial', formacaoEstimativa: true, formacaoPaga: 'rede',
    suporteQuem: 'rede', suporteNivel: 'ampliado', acompanhamento: 'regular',
    implantacao: { escolas: 200, pessoas: 50000 },
    elegiveis: 150000, expansao: 'ano1', horizonte: 3,
  }),
  C: novoCaso({
    titulo: 'Alerta precoce de abandono escolar', situacao: 'nova',
    problema: 'A taxa de abandono no ensino médio está concentrada em algumas escolas e grupos. As equipes identificam estudantes em risco tarde, quando as faltas já se acumularam, e não há critério comum para priorizar o apoio.',
    resultado: 'Identificar mais cedo os estudantes que se beneficiariam de apoio e reduzir o abandono, sem gerar estigmatização.',
    impactos: ['permanencia'], linhaBase: 'sim', alternativa: 'nao',
    linhaBaseProblemas: ['C7'], linhaBaseMedida: 'Taxa de abandono por escola no 1º ano do ensino médio (exemplo)',
    testes: ['recomendar'], tarefas: ['alerta_precoce'],
    usuarios: ['gestores', 'professores'], afetados: ['criancas', 'familias'], consequencias: ['apoio_est', 'recursos'], frequencia: 'semanal',
    nFerramentas: 'nao_sei', conheceFerramentas: 'nao', ferramentas: [],
    tipoTec: 'nao_sei', pagamento: 'institucional', licenca: 'nao_sei', adaptacao: 'integracao',
    piloto: { escolas: 10, participantes: 120, meses: 6 },
    internet: 'sim', modeloDisp: 'por_professor', dispExistem: 'sim',
    formados: ['gestores', 'professores'], formacaoTipo: ['tecnologia', 'dados_etica'], formacaoFormato: 'presencial', formacaoEstimativa: true, formacaoPaga: 'indefinido',
    suporteQuem: 'rede', suporteNivel: 'ampliado', acompanhamento: 'regular',
    implantacao: { escolas: 300, pessoas: 2500 },
    elegiveis: 2500, expansao: 'ano1', horizonte: 3,
  }),
  D: novoCaso({
    titulo: 'Assistente para solicitações das escolas', situacao: 'orcamento',
    problema: 'As escolas enviam milhares de solicitações por mês à secretaria sobre normas, prazos e procedimentos. Respostas demoram, variam entre servidores e parte das dúvidas se repete.',
    resultado: 'Reduzir o tempo de resposta e a variação entre respostas, mantendo a correção normativa.',
    impactos: ['gestao'], linhaBase: 'parcial', alternativa: 'sim',
    linhaBaseProblemas: ['C9'], linhaBaseMedida: 'Registro das solicitações das escolas e dos prazos de resposta (exemplo)',
    testes: ['poc'], tarefas: ['duvidas'],
    usuarios: ['administrativo', 'gestores'], afetados: ['servidores'], consequencias: ['organizacao'], frequencia: 'diaria',
    nFerramentas: '1', conheceFerramentas: 'sim',
    ferramentas: [{ nome: 'Assistente com base de normas (exemplo)', tarefas: ['duvidas'], tipoTec: 'paga', pagamento: 'gratuito', preco: '' }],
    tipoTec: 'paga', pagamento: 'gratuito', licenca: 'termos', adaptacao: 'sob_medida',
    poc: { participantes: 150, meses: 3 },
    internet: 'sim', modeloDisp: 'proprio', dispExistem: 'sim',
    formados: ['administrativo', 'gestores'], formacaoTipo: ['tecnologia', 'dados_etica'], formacaoFormato: 'online', formacaoEstimativa: true, formacaoPaga: 'rede',
    suporteQuem: 'rede', suporteNivel: 'basico', acompanhamento: 'regular',
    implantacao: { escolas: 270, pessoas: 3000 }, arquitetura: 'api',
    elegiveis: 3000, expansao: 'ano1', horizonte: 3,
  }),
};

// Exemplos ilustrativos de contexto (coerentes com os casos A–D); estudantes por ano ou série.
// v13: prioridade "Educar com a IA" e os problemas de PROBLEMAS_EXEMPLO (prioridades.js), com subcategorias; sem domínio
// nem componentes. Os ids ficam escritos aqui porque casos.js também é carregado sem prioridades.js (testes do motor).
const CTX_EX = {
  A: { nivel: 'estado', local: 'Rede estadual (exemplo)', etapas: {
    fund2: { on: true, escolas: 420, anos: [41000, 40000, 40000, 39000], alunos: 160000, soTotal: false },
    medio: { on: true, escolas: 380, anos: [48000, 47000, 45000], alunos: 140000, soTotal: false } },
    prioridades: ['com'], problemas: ['C4'], subs: ['C4a', 'C4b'], problemaOutro: '', olhando: 'Professores dedicam muitas horas ao planejamento de aulas e à adaptação de materiais.' },
  B: { nivel: 'estado', local: 'Rede estadual (exemplo)', etapas: {
    fund2: { on: true, escolas: 600, anos: [40000, 38000, 37000, 35000], alunos: 150000, soTotal: false } },
    prioridades: ['com'], problemas: ['C2'], subs: ['C2b'], problemaOutro: '', olhando: 'Estudantes chegam ao 9º ano com proficiência em matemática abaixo do esperado.' },
  C: { nivel: 'estado', local: 'Rede estadual (exemplo)', etapas: {
    medio: { on: true, escolas: 300, anos: [28000, 27000, 25000], alunos: 80000, soTotal: false } },
    prioridades: ['com'], problemas: ['C7'], subs: ['C7a', 'C7c'], problemaOutro: '', olhando: 'Alta taxa de abandono no 1º ano do ensino médio.' },
  D: { nivel: 'municipio', local: 'Secretaria municipal (exemplo)', etapas: {
    infantil: { on: true, escolas: 120, anos: [12000, 18000], alunos: 30000, soTotal: false },
    fund1: { on: true, escolas: 150, anos: [9000, 9000, 9000, 9000, 9000], alunos: 45000, soTotal: false } },
    prioridades: ['com'], problemas: ['C9'], subs: ['C9a'], problemaOutro: '', olhando: 'Servidores das escolas esperam dias por respostas sobre normas e procedimentos.' },
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

// Condições de base (K1): preço de referência de um dispositivo (moeda local, valores em US$ do Ano 0) e
// custo anual de conexão adequada por escola. CONVENÇÃO EDITORIAL ILUSTRATIVA, NÃO EVIDÊNCIA: substitua
// por dados locais. (fracaoSemDispositivo ficou da v9–v10 e não é mais usada pelo cálculo.)
const PREMISSAS_K1 = { fracaoSemDispositivo: 0.25, precoDispositivo: 300, conectEscolaAno: 600 };

// v11: premissas das perguntas novas (2.0, 2.4, 2.5, 2.6, 3.1). TODAS SÃO CONVENÇÕES EDITORIAIS ILUSTRATIVAS
// DESTA FERRAMENTA, NÃO EVIDÊNCIA nem valores do guia ou de Krueger e Jackson (2026): só ordenam as respostas
// e dão uma ordem de grandeza editável. Cada uma é neutra quando o campo está vazio: o caso volta ao
// exemplo do guia (cap. 12) de que parte a estimativa.
const PREMISSAS_V11 = {
  // demanda (2.0 e 3.1): padrões do teste e da primeira etapa da implantação
  pocParticipantes: 15, pocMeses: 2,              // prova de conceito sem tamanho informado
  pilotoFracao: 0.05, pilotoMin: 50, pilotoMeses: 4, // piloto sem tamanho informado
  mesesAno0Max: 12,                               // PoC + piloto no Ano 0, no máximo 12 meses
  implantacaoFracao: 1 / 3,                       // primeira etapa = 1/3 das pessoas que usariam
  pessoasPorEscola: 400,                          // escolas no escopo quando a rede não informou escolas
  // K1.1 internet (2.4.1–2.4.2)
  semInternetParcial: 0.5,                        // "Parcialmente" sem número de escolas: metade sem conexão
  // K1.2 dispositivos (2.4.3–2.4.4)
  estudantesPorDispositivo: 3,                    // compartilhado na sala
  dispositivosPorEscolaRotativo: 30,              // carrinho ou laboratório
  lacunaDisp: { sim: 0, parcial: 0.5, nao: 1 },   // parte dos dispositivos necessários que falta
  // K4.4 e K4.3 formação (2.5)
  horasFormacao: 3,                               // estimativa de horas por pessoa quando a arquitetura é desconhecida (exemplo A do guia)
  horasFormacaoPorArq: { saas: 3, api: 1.5, ow: 2 }, // horas dos exemplos A, B e C do guia (cap. 12)
  formadosPorEscola: { gestores: 2, administrativo: 1, professores: 20 }, // papéis que não são usuários
  equipeTecnicaMin: 3, escolasPorTecnico: 50,     // equipe técnica: no mínimo 3, mais 1 a cada 50 escolas
  rotacaoFormacao: 0.10,                          // reposição anual de pessoas formadas
  fatorFormato: { presencial: 1, hibrida: 0.8, online: 0.5 }, // programa de formação (K4.3)
  // K4.2 suporte (2.6.1–2.6.2)
  fatorSuporte: { basico: 0.5, ampliado: 1, dedicado: 2 },  // × pessoas em tempo integral do exemplo
  internoComFornecedor: 0.25, internoComAmbos: 0.6,        // parte interna quando o fornecedor atende
  taxaFornecedor: { basico: 0, ampliado: 2, dedicado: 5 },  // US$ por usuário ativo por ano
  fracaoTaxaAmbos: 0.5,
  // K4.1 e K5.3 acompanhamento (2.6.3)
  fatorAcompanhamento: { leve: 0.5, regular: 1, intensivo: 1.5 },
};
// Horas de formação por pessoa estimadas (botão "Usar uma estimativa"): as do exemplo do guia da arquitetura.
// Aceita um caso (efetivo ou não) ou uma arquitetura ('saas' | 'api' | 'ow').
function horasFormacaoEstimada(x) {
  let arq = typeof x === 'string' ? x : '';
  if (x && typeof x === 'object') arq = ['saas', 'api', 'ow'].includes(x.arquitetura) ? x.arquitetura : (typeof derivarArquitetura === 'function' ? derivarArquitetura(x) : 'saas');
  return PREMISSAS_V11.horasFormacaoPorArq[arq] || PREMISSAS_V11.horasFormacao;
}

// ---------------------------------------------------------------------
// v11: migração de um caso da v10 (ou anterior) para o modelo v11. Devolve um caso novo (não altera c):
// teste → testes; setup da PoC em piloto → poc; infra sim → internet sim + dispositivos sim; complementar →
// parcial + parcial; arquiteturaManual → arquitetura; expansão (antes contada a partir do teste) → primeira
// etapa da implantação + anos depois dela, preservando a demanda; remove pagaDepois, fonte, infra e
// arquiteturaManual. Um caso já v11 (com testes) só perde os campos removidos.
// ---------------------------------------------------------------------
function migrarCasoV10(c) {
  const x = JSON.parse(JSON.stringify(c || {}));
  const ja11 = Array.isArray(x.testes);
  if (!ja11) {
    const t = x.teste;
    x.testes = t === 'ambos' ? ['poc', 'piloto'] : ['poc', 'piloto', 'recomendar'].includes(t) ? [t] : [];
    const pil = x.piloto || {};
    if (t === 'poc' && !x.poc && (+pil.participantes > 0 || +pil.meses > 0)) {
      x.poc = { participantes: pil.participantes || '', meses: pil.meses || '' };
      x.piloto = { escolas: '', participantes: '', meses: '' };
    }
    if (x.infra === 'sim') { if (!x.internet) x.internet = 'sim'; if (!x.dispExistem) x.dispExistem = 'sim'; }
    else if (x.infra === 'complementar') { if (!x.internet) x.internet = 'parcial'; if (!x.dispExistem) x.dispExistem = 'parcial'; }
    if (!x.implantacao) {
      // v10: ano1 = todos no Ano 1; ano2 = 1/3 no Ano 1 e todos no Ano 2; ano3 = 1/3, 2/3 e todos
      const e = x.expansao || 'ano1';
      if (e === 'ano1') x.implantacao = { escolas: '', pessoas: +x.elegiveis > 0 ? +x.elegiveis : '' };
      else x.implantacao = { escolas: '', pessoas: '' };
      x.expansao = e === 'ano3' ? 'ano2' : 'ano1';
    }
  }
  if (!['saas', 'api', 'ow', 'nao_sei'].includes(x.arquitetura) && ['saas', 'api', 'ow'].includes(x.arquiteturaManual)) x.arquitetura = x.arquiteturaManual;
  ['teste', 'pagaDepois', 'fonte', 'infra', 'arquiteturaManual'].forEach(k => { delete x[k]; });
  const out = Object.assign(JSON.parse(JSON.stringify(CASO_VAZIO)), x);
  out.poc = Object.assign({ participantes: '', meses: '' }, out.poc || {});
  out.piloto = Object.assign({ escolas: '', participantes: '', meses: '' }, out.piloto || {});
  out.implantacao = Object.assign({ escolas: '', pessoas: '' }, out.implantacao || {});
  if (!['saas', 'api', 'ow', 'nao_sei'].includes(out.arquitetura)) out.arquitetura = '';
  // v15: validação e clamp para robustez de importação (RF-019, RB-015)
  // clamp de horizonte (1-10)
  if (out.horizonte != null) { const h = Math.round(+out.horizonte || 3); out.horizonte = Math.max(1, Math.min(10, isNaN(h) ? 3 : h)); }
  // normalizar arrays que podem ter vido como string ou número inválido
  ['prioridades', 'problemas', 'subs', 'testes', 'tarefas', 'impactos', 'usuarios', 'afetados', 'consequencias', 'formados', 'formacaoTipo', 'linhaBaseProblemas', 'ferramentas'].forEach(k => {
    if (!Array.isArray(out[k])) out[k] = [];
  });
  // normalizar objetos aninhados
  if (!out.poc || typeof out.poc !== 'object') out.poc = { participantes: '', meses: '' };
  if (!out.piloto || typeof out.piloto !== 'object') out.piloto = { escolas: '', participantes: '', meses: '' };
  if (!out.implantacao || typeof out.implantacao !== 'object') out.implantacao = { escolas: '', pessoas: '' };
  return out;
}

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
// Caso efetivo (casoEfetivo) → premissas do motor de custo (plano v9, B.10; v11, "Custo")
// ---------------------------------------------------------------------
// Pessoas formadas a partir de um estoque: Ano 0 = todos; depois, os novos do ano + reposição do estoque anterior
const formadosDoEstoque = (C, rot) => C.map((n, t) => t === 0 ? n : Math.max(n - C[t - 1], 0) + rot * C[t - 1]);
const ROTULO_PAPEL = { professores: 'professores', gestores: 'gestores escolares', tecnica: 'equipe técnica', administrativo: 'equipe administrativa' };

function cfgDoCaso(ce, perfil) {
  ce = ce || {};
  const P = PREMISSAS_V11;
  let arq = ce.arquitetura;
  if (!['saas', 'api', 'ow'].includes(arq)) arq = (arq === 'indefinida' || typeof derivarArquitetura !== 'function') ? 'saas' : derivarArquitetura(ce);
  const base = { saas: 'A', api: 'B', ow: 'C' }[arq];
  const cfg = clone(PRESETS[base]);
  const agregado = (perfil && perfil.agregado) || cfg.risco;
  cfg.nome = 'Seu caso' + (ce.titulo ? ': ' + ce.titulo : '');
  cfg.origem = base;
  cfg.risco = agregado;
  cfg.unidade = 'usuário'; cfg.unidadePl = 'usuários';
  const meta = cfg.v11 = {};
  // 2. horizonte
  const H = Math.max(1, Math.round(+ce.horizonte || 3));
  cfg.opc = { H };
  const T = Array.from({ length: H + 1 }, (_, t) => t);
  // 3. demanda. Ano 0 = teste (PoC, piloto ou os dois); Ano 1 = primeira etapa da implantação (3.1);
  //    depois, chega a todas as pessoas (E) em 'expansao' anos, em passos iguais.
  const teste = (typeof testeDe === 'function') ? testeDe(ce) : (ce.teste || '');
  const soPoc = teste === 'poc', ambos = teste === 'ambos';
  const pil = ce.piloto || {}, pc = ce.poc || {};
  const E = Math.max(1, Math.round(+ce.elegiveis || 1));
  let E0, m0;
  if (soPoc) {
    E0 = +pc.participantes > 0 ? +pc.participantes : (+pil.participantes > 0 ? +pil.participantes : P.pocParticipantes);
    m0 = +pc.meses > 0 ? +pc.meses : (+pil.meses > 0 ? +pil.meses : P.pocMeses);
  } else {
    E0 = +pil.participantes > 0 ? +pil.participantes : Math.max(P.pilotoMin, Math.round(P.pilotoFracao * E));
    const mPil = +pil.meses > 0 ? +pil.meses : P.pilotoMeses;
    m0 = ambos ? (+pc.meses > 0 ? +pc.meses : P.pocMeses) + mPil : mPil;
  }
  E0 = Math.max(1, Math.min(E, Math.round(E0)));
  m0 = Math.min(P.mesesAno0Max, m0);
  const imp = ce.implantacao || {};
  const P1 = +imp.pessoas > 0 ? Math.min(E, Math.round(+imp.pessoas)) : Math.max(1, Math.round(E * P.implantacaoFracao));
  const nExp = ({ ano1: 1, ano2: 2, ano3: 3 })[ce.expansao] || 1;
  const Et = T.map(t => {
    if (t === 0) return E0;
    const k = t - 1;
    return k >= nExp ? E : Math.round(P1 + (E - P1) * k / nExp);
  });
  cfg.demanda.E = Et.slice();
  cfg.demanda.meses = T.map(t => t === 0 ? m0 : ano(cfg.demanda.meses, t));
  const adoc = T.map(t => ano(cfg.demanda.adocao, t));
  const U = T.map(t => Et[t] * adoc[t]);
  Object.assign(meta, { teste, E, E0, m0, implantacao: P1, implantacaoPadrao: !(+imp.pessoas > 0), anosExpansao: nExp });
  // escolas no escopo de cada ano: teste (escolas do piloto; PoC sem escolas), Ano 1 (3.1) e proporcionais depois
  const escRede = +ce.escolasRede || 0;
  const escDe = n => escRede > 0 ? Math.min(escRede, Math.max(1, Math.round(escRede * n / E))) : Math.max(1, Math.ceil(n / P.pessoasPorEscola));
  const esc = T.map(t => {
    if (t === 0) return soPoc ? 0 : (+pil.escolas > 0 ? Math.round(+pil.escolas) : escDe(E0));
    if (t === 1 && +imp.escolas > 0) return Math.round(+imp.escolas);
    return escDe(Et[t]);
  });
  meta.escolas = esc.slice();
  // papéis entre as pessoas que usariam (convenção de 1 professor para cada 25 estudantes)
  const pap = T.map(t => (typeof papeisUsuarios === 'function') ? papeisUsuarios(ce, Et[t]) : { usaEst: false, estudantes: 0, professores: 0, equipe: [] });
  const usaEst = pap[0].usaEst;
  // quem paga: Ano 0 (teste) e anos seguintes
  const pub = ce.tipoTec === 'publica';
  const cedido0 = ce.pagamento === 'gratuito' || pub;
  const cedidoT = pub;
  // 4. SaaS
  const f0 = (ce.ferramentas || [])[0] || {};
  if (cfg.saas && cfg.saas.ativo) {
    const s = cfg.saas;
    s.mesesCobr = T.map(t => t === 0 ? m0 : ano(s.mesesCobr, t));
    if (ce.pagamento === 'usuario') {
      s.preco = s.precoNominal;
      s.qtd = T.map(t => Math.ceil(Et[t] * adoc[t] * s.fatorNominal));
    } else s.qtd = Et.slice();
    // v11: preço informado para a ferramenta principal (US$ por usuário por mês)
    if (+f0.preco > 0) { s.preco = +f0.preco; if (ce.pagamento === 'usuario') s.precoNominal = +f0.preco; }
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
  cfg.itens = cfg.itens || [];
  // 7. K1.1 internet: escolas do escopo sem internet adequada × custo anual por escola
  {
    const K = PREMISSAS_K1;
    let sem = 0;
    if (ce.internet === 'nao') sem = 1;
    else if (ce.internet === 'parcial') {
      const comNet = ce.escolasInternet === '' || ce.escolasInternet == null ? NaN : +ce.escolasInternet;
      sem = (escRede > 0 && Number.isFinite(comNet) && comNet >= 0) ? Math.min(1, Math.max(0, 1 - comNet / escRede)) : P.semInternetParcial;
    }
    const q = esc.map(n => Math.round(n * sem));
    meta.internet = { resposta: ce.internet || '', fracaoSem: sem, escolasSemInternet: q.slice(), conectEscolaAno: K.conectEscolaAno };
    if (q.some(n => n > 0))
      cfg.itens.push({ cat: 'Condições de base', s: 'K1.1', nome: 'Conexão das escolas sem internet adequada (ilustrativo)', nat: 'D', moeda: 'LOC',
        q, p: T.map(() => K.conectEscolaAno), un: 'escola', v: q.map(n => n * K.conectEscolaAno) });
  }
  // 8. K1.2 dispositivos: necessários pelo modelo de uso × lacuna, só os novos de cada ano, × preço
  {
    const K = PREMISSAS_K1;
    const lac = P.lacunaDisp[ce.dispExistem] || 0;
    const modelo = ce.modeloDisp || (usaEst ? 'compartilhado' : 'um_por_usuario');
    const nec = T.map(t => {
      const p = pap[t], est = usaEst ? p.estudantes : Et[t];
      switch (modelo) {
        case 'um_por_aluno': return est;
        case 'compartilhado': return Math.ceil(est / P.estudantesPorDispositivo);
        case 'rotativo': return P.dispositivosPorEscolaRotativo * esc[t];
        case 'por_professor': return usaEst ? Math.round(p.estudantes / RAZAO_EST_PROF) : (p.professores > 0 ? p.professores : Et[t]);
        case 'proprio': return 0;
        default: return Et[t]; // um por pessoa que usa (servidores), quando o modelo não foi informado
      }
    });
    const novos = nec.map((n, t) => t === 0 ? n : Math.max(n - nec[t - 1], 0));
    const q = novos.map(n => Math.round(n * lac));
    meta.dispositivos = { modelo, resposta: ce.modeloDisp || '', existem: ce.dispExistem || '', lacuna: lac, necessarios: nec, comprados: q.slice(), precoDisp: K.precoDispositivo };
    if (q.some(n => n > 0))
      cfg.itens.push({ cat: 'Condições de base', s: 'K1.2', nome: 'Dispositivos a comprar (ilustrativo)', nat: 'D', orc: 'capital', moeda: 'LOC',
        q, p: T.map(() => K.precoDispositivo), un: 'dispositivo', v: q.map(n => n * K.precoDispositivo) });
  }
  // 9. formação. K4.4: pessoas formadas pelos papéis marcados × horas × custo-hora; K4.3: programa × formato
  {
    const f = cfg.formacaoTempo;
    const horasEst = f ? f.horas : PREMISSAS_V11.horasFormacao;
    const horas = ce.formacaoEstimativa ? horasEst : (+ce.formacaoHoras > 0 ? +ce.formacaoHoras : horasEst);
    const formados = (ce.formados || []).filter(r => ROTULO_PAPEL[r]);
    const fForm = P.fatorFormato[ce.formacaoFormato] || 1;
    const cedida = ['fornecedor', 'parceiro'].includes(ce.formacaoPaga);
    meta.formacao = { papeis: formados.slice(), horas, horasEstimadas: horasEst, custoHora: f ? f.custoHora : 0, fatorFormato: fForm, formato: ce.formacaoFormato || '', cedida, paga: ce.formacaoPaga || '' };
    if (f) {
      f.horas = horas;
      if (formados.length) {
        const rot = f.rot > 0 ? f.rot : P.rotacaoFormacao;
        let cobertos;
        if (usaEst) {
          // as pessoas que usariam são estudantes: a linha do exemplo conta os professores
          cobertos = formados.includes('professores') ? ['professores'] : [];
          if (f.modo !== 'razao') { f.modo = 'razao'; f.razao = RAZAO_EST_PROF; }
          f.fator = cobertos.length ? 1 : 0;
        } else {
          const eq = pap[0].equipe;
          cobertos = formados.filter(r => eq.includes(r));
          f.fator = eq.length ? cobertos.length / eq.length : 0;
          if (f.modo === 'razao') { f.modo = 'ativos'; f.rot = rot; }
        }
        f.extras = formados.filter(r => !cobertos.includes(r)).map(r => {
          const C = T.map(t => r === 'tecnica' ? (t === 0 && soPoc ? P.equipeTecnicaMin : Math.max(P.equipeTecnicaMin, Math.ceil(esc[t] / P.escolasPorTecnico)))
            : (P.formadosPorEscola[r] || 1) * esc[t]);
          return { papel: r, nome: 'Tempo de formação: ' + ROTULO_PAPEL[r], q: formadosDoEstoque(C, rot) };
        });
        meta.formacao.fatorUsuarios = f.fator;
        meta.formacao.extras = f.extras.map(x => ({ papel: x.papel, q: x.q.slice() }));
      }
    }
    cfg.itens.forEach(x => {
      if (x.s !== 'K4.3') return;
      x.v = T.map(t => ano(x.v, t) * fForm);
      if (cedida) { x.nat = 'O'; x.tag = 'doado'; x.pagador = ce.formacaoPaga === 'fornecedor' ? 'fornecedor' : 'terceiro'; }
    });
  }
  // 10. K4.2 suporte: pessoas em tempo integral do exemplo × nível; com o fornecedor, parte interna menor
  //     e uma linha "Suporte do fornecedor" por usuário ativo por ano
  {
    const nivel = P.fatorSuporte[ce.suporteNivel] != null ? ce.suporteNivel : 'ampliado';
    const fN = P.fatorSuporte[nivel];
    let fInt = fN, taxa = 0;
    if (ce.suporteQuem === 'fornecedor') { fInt = fN * P.internoComFornecedor; taxa = P.taxaFornecedor[nivel]; }
    else if (ce.suporteQuem === 'ambos') { fInt = fN * P.internoComAmbos; taxa = P.taxaFornecedor[nivel] * P.fracaoTaxaAmbos; }
    if (cfg.suporte && cfg.suporte.ativo && fInt !== 1) {
      cfg.suporte.faixas = cfg.suporte.faixas.map(([lim, f]) => [lim, f * fInt]);
      cfg.suporte.acima = cfg.suporte.acima * fInt;
    }
    meta.suporte = { quem: ce.suporteQuem || '', nivel: ce.suporteNivel || '', fatorNivel: fN, fatorInterno: fInt, taxaFornecedor: taxa };
    if (taxa > 0) {
      const q = U.map(u => Math.round(u));
      cfg.itens.push({ cat: 'Pessoas', s: 'K4.2', nome: 'Suporte do fornecedor', nat: 'D', moeda: 'USD', comp: 'V', un: 'usuário ativo por ano',
        q, p: T.map(() => taxa), v: q.map((n, t) => n * taxa * (t === 0 ? m0 / 12 : 1)) });
    }
  }
  // 11. ferramentas adicionais pagas (2.3.3, a partir da segunda): licenças em K2.1 com o nome da ferramenta
  {
    const sp = PRESETS.A.saas;
    meta.ferramentas = [];
    (ce.ferramentas || []).slice(1).forEach((fe, i) => {
      if (!fe || ['publica', 'aberta'].includes(fe.tipoTec) || !['usuario', 'institucional'].includes(fe.pagamento)) return;
      const porUsuario = fe.pagamento === 'usuario';
      const preco = +fe.preco > 0 ? +fe.preco : (porUsuario ? sp.precoNominal : sp.preco);
      const tt = (typeof tarefasDe === 'function') ? tarefasDe(fe.tarefas) : [];
      const paraEst = !tt.length || tt.some(x => (x.usuarios || []).includes('estudantes'));
      const pessoas = T.map(t => usaEst && !paraEst ? Math.round(Et[t] / RAZAO_EST_PROF) : Et[t]);
      const lic = pessoas.map((n, t) => porUsuario ? Math.ceil(n * adoc[t]) : n);
      const q = lic.map((n, t) => n * (t === 0 ? m0 : 12));
      const nome = 'Licenças: ' + ((fe.nome || '').trim() || ('ferramenta ' + (i + 2)));
      meta.ferramentas.push({ nome, preco, precoInformado: +fe.preco > 0, porUsuario, licencas: lic });
      cfg.itens.push({ cat: 'Acesso comercial', s: 'K2.1', nome, nat: 'D', moeda: 'USD', tag: 'licenca_extra', un: 'licença-mês',
        q, p: T.map(() => preco), v: q.map(n => n * preco) });
    });
  }
  // 12. governança proporcional ao risco
  governancaPorRisco(cfg, agregado);
  // 13. K4.1 e K5.3 (gestão e monitoramento) × nível de acompanhamento; a operação técnica do modelo não muda
  {
    const fA = P.fatorAcompanhamento[ce.acompanhamento] || 1;
    meta.acompanhamento = { nivel: ce.acompanhamento || '', fator: fA };
    if (fA !== 1) (cfg.pessoas || []).forEach(pp => {
      if (!['K4.1', 'K5.3'].includes(pp.s) || pp.tag === 'opmodelo') return;
      pp.partes = pp.partes.map(([sal, f]) => [sal, Array.isArray(f) ? f.map(x => x * fA) : f * fA]);
    });
  }
  return cfg;
}

if (typeof module !== 'undefined') module.exports = { CASO_VAZIO, FERRAMENTA_VAZIA, CASOS, CTX_EX, RESP_EX, ADAPTACAO, fatoresAdaptacao, PREMISSAS_K1, PREMISSAS_V11, horasFormacaoEstimada, migrarCasoV10, cfgDoCaso, governancaPorRisco };
