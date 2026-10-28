// Pacote PESSOAS: supervisão, contestação, crianças e direitos (lente "Pessoas e uso"). Formato: regras/index.js.
// R2: R-31 segue a forma de supervisão da ferramenta (REC-09); `criancas` se divide em R-34 (estudantes usuários),
// R-36 (famílias informadas) e R-37 (material revisado), e só R-34 fala em uso adequado à idade (REC-03).
// R4 (4b): R-33, R-35 e R-38 a R-44 entram aqui, com variantes por nível de risco (k.nivel), forma de supervisão
// (k.forma) e tipo de uso; R-19 (pacote TESTE, prova de conceito do alerta) fica neste arquivo por ser do mesmo tema.
// Regras de decisão sobre pessoas: sem consentimento como alternativa (na rede pública a base é a tarefa pública).
const MATERIAIS = ['planos_aula', 'materiais'];
const comMateriais = k => k.tarefas.some(t => MATERIAIS.includes(t));

/**
 * Pergunta 2.2.5 (criada pelo pacote R8): "Já existe um caminho para estudantes e famílias contestarem?". Até lá o campo não
 * existe e a contestação é DESCONHECIDA: só o valor 'nao' ("não existe") a dá como inexistente; vazio ou "não sei", nunca.
 */
export const CAMPO_CONTESTACAO = 'contestacaoExiste';
const SEM_CONTESTACAO = ['nao', 'nao_existe'];
export const contestacaoInexistente = k => SEM_CONTESTACAO.includes(String(k.v(CAMPO_CONTESTACAO)));

const IMPACTOS_GRUPOS_LOCAL = ['desigualdade', 'inclusao'];
const impactoGrupos = k => (k.impactos || []).some(i => IMPACTOS_GRUPOS_LOCAL.includes(i));
const TAREFAS_EQUIDADE = ['tutoria', 'correcao', 'alerta_precoce'];
const tarefaEquidade = k => k.tarefas.some(t => TAREFAS_EQUIDADE.includes(t));
const alertaPrecoce = k => k.tarefas.includes('alerta_precoce');
const geracaoOuTutoria = k => k.classes.some(c => ['geracao', 'tutoria'].includes(c));
const usoDiario = k => ['diaria', 'continua'].includes(String((k.ce || {}).frequencia || ''));
const consequencias = k => ((k.ce || {}).consequencias || []);
const dadosSensiveis = k => ((k.ce || {}).dados || []).includes('sensiveis');

/** @type {import('./index.js').Regra[]} */
export const REGRAS_PESSOAS = [
  {
    id: 'R-31', versao: 2, pacote: 'PESSOAS', tipo: 'politica', substitui: ['supervisao'], campos: ['consequencias'],
    se: k => k.consDecide.length > 0,
    origem: k => ({ campo: 'consequencias', vals: k.consDecide }),
    variantes: [
      { quando: k => k.forma === 'caso',
        oque: 'Revisar caso a caso cada saída que afete um estudante antes de qualquer consequência, com alguém da escola com tempo e autoridade para mudá-la.',
        porque: 'A supervisão só protege se houver tempo, informação e autoridade no volume real de casos.',
        como: ['Estimar as horas por semana (alertas por semana vezes minutos por revisão, dividido pelo número de revisores) e reservá-las em cada escola.', 'Nomear quem revisa e dar a essa pessoa os dados que geraram cada saída.', 'Registrar cada revisão e o que foi decidido.', 'Testar no piloto se há tempo para revisar no volume previsto.'] },
      { quando: k => k.forma === 'critica',
        oque: 'Exigir a aprovação de uma pessoa antes de cada ação crítica sobre estudantes, com autoridade para mudá-la.',
        porque: 'Quando o sistema executa etapas sozinho, a ação crítica é o último ponto em que uma pessoa pode evitar o dano.',
        como: ['Listar as ações que exigem aprovação.', 'Nomear quem aprova e em que prazo.'] },
      { quando: k => k.forma === 'excecao',
        oque: 'Organizar a revisão humana por exceção, definindo que saídas vão para revisão (baixa confiança, tema sensível, pedido de ajuda) e quem as revê.',
        porque: 'Revisar tudo não cabe no volume de uso; sem critérios de exceção, os casos que pedem uma pessoa passam despercebidos.',
        como: ['Definir os critérios que mandam uma saída para revisão.', 'Nomear quem revê e com que prazo, com um painel por turma.', 'Revisar também uma amostra das demais saídas.'] },
      { quando: k => k.forma === 'amostra',
        oque: 'Revisar todo mês uma amostra das saídas para detectar erros recorrentes, com alguém que possa suspender o uso.',
        porque: 'Com muitas saídas de baixa consequência, a amostra é o que mostra os erros que se repetem.',
        como: ['Definir o tamanho da amostra e quem a revisa.', 'Registrar os erros encontrados e o que foi corrigido.'] },
      { oque: 'Acompanhar os indicadores, os padrões de erro e os incidentes do sistema, com uma equipe responsável por agir.',
        porque: 'Sem acompanhamento do sistema, erros que se repetem só aparecem quando alguém reclama.',
        como: ['Definir os indicadores e a frequência da revisão.', 'Nomear a equipe que acompanha e o que ela pode suspender.'] },
    ],
    paraque: 'Uma pessoa com autoridade pode corrigir a saída antes que ela afete um estudante.',
    quem: ['escolas', 'gabinete'], marco: 'M1', pd: 6, curto: 'a revisão humana das saídas',
    exemplosNorma: { UE: ['AI Act arts. 14 e 26'] },
    condicao: k => k.alto, alta: () => true,
    pronto: 'Quem revisa, quando e com que horas está definido e registrado por escola.',
  },
  {
    id: 'R-32', versao: 2, pacote: 'PESSOAS', tipo: 'politica', substitui: ['contestacao'], campos: ['consequencias'],
    se: k => k.consDecide.length > 0,
    origem: k => ({ campo: 'consequencias', vals: k.consDecide }),
    variantes: [
      { quando: contestacaoInexistente,
        oque: 'Criar o caminho de contestação antes de usar a ferramenta com estudantes, porque sem ele ela não deve decidir nem priorizar sobre pessoas.',
        porque: 'Quando não há como corrigir uma consequência grave, o risco aceitável diminui e a ferramenta não deve decidir nem priorizar pessoas.',
        como: ['Definir o canal, o prazo de resposta e quem pode mudar a decisão.', 'Divulgar o canal às pessoas afetadas antes do início do teste.', 'Enquanto o canal não existir, limitar a ferramenta a informação sem efeito sobre estudantes.'] },
      { quando: k => k.criancas || k.afetados.includes('familias'),
        oque: 'Criar um canal de contestação que estudantes e famílias consigam usar, com linguagem adequada à idade, prazo e alguém com autoridade para mudar a decisão.',
        porque: 'Quem é afetado nem sempre sabe que a IA participou; sem um canal fácil de usar, o erro não chega a quem pode corrigi-lo.',
        como: ['Definir o canal na escola e por telefone, não só digital, com prazo de resposta (por exemplo, 10 dias).', 'Nomear quem pode mudar a decisão e registrar cada contestação.', 'Explicar às famílias e aos estudantes, em linguagem simples, que o canal existe e como usá-lo.'] },
      { oque: 'Criar um caminho para contestar saídas e corrigir erros, com prazo e alguém com autoridade para rever a decisão.',
        porque: 'Quem é afetado nem sempre sabe que a IA participou; sem um canal acessível, um erro vira decisão definitiva.',
        como: ['Definir o canal, o prazo de resposta e quem pode mudar a decisão.', 'Informar às pessoas afetadas que o canal existe e como usá-lo.'] },
    ],
    paraque: 'Quem é afetado por uma saída consegue pedir revisão e obter correção.',
    quem: ['escolas', 'controle'], marco: 'M1', pd: 6, curto: 'o caminho de contestação',
    // Condição só quando a pergunta 2.2.5 diz que o caminho NÃO existe (R8); sem a pergunta, ou sem resposta, é Recomendada
    condicao: contestacaoInexistente, alta: () => true,
    exige: ['CONTRATO.verificacao-contestacao'],
    exemplosNorma: { BR: ['LGPD art. 20'], UE: ['RGPD art. 22'] },
    pronto: 'O canal de contestação existe, tem prazo e responsável, e está divulgado.',
  },
  {
    id: 'R-34', versao: 2, pacote: 'PESSOAS', tipo: 'politica', substitui: ['criancas'], campos: ['afetados', 'usuarios'],
    se: k => k.criancas && k.usaEst,
    origem: () => ({ campo: 'afetados', vals: ['criancas'] }),
    variantes: [
      { quando: geracaoOuTutoria,
        oque: 'Definir uso adequado à idade e modo de uso, testar os filtros de conteúdo e avisar ao estudante que conversa com uma máquina.',
        porque: 'Crianças percebem menos um erro ou um conteúdo impróprio, e o uso pode durar anos.',
        como: ['Definir a idade mínima e o modo de uso, com o professor ou sozinho.', 'Testar os filtros de conteúdo na língua e na faixa etária dos estudantes, com perguntas difíceis.', 'Mostrar na tela o aviso de que o estudante conversa com uma máquina.', 'Informar as famílias antes do início do teste.'],
        pronto: 'Idade mínima, modo de uso, teste dos filtros e aviso na tela registrados; famílias informadas antes do início.' },
      { oque: 'Aplicar as regras de proteção de crianças e adolescentes, com uso adequado à idade e famílias informadas antes do teste.',
        porque: 'Crianças percebem menos um erro ou um conteúdo impróprio, e o uso pode durar anos.',
        como: ['Definir a idade mínima e o modo de uso, com o professor ou sozinho.', 'Testar os filtros de conteúdo na língua e na faixa etária dos estudantes.', 'Informar as famílias antes do início do teste.'] },
    ],
    paraque: 'Os estudantes usam a ferramenta com proteção adequada à idade.',
    quem: ['pedagogica', 'tecnologia'], marco: 'M1', pd: 6, curto: 'as regras para crianças usuárias',
    exemplosNorma: { UE: ['AI Act art. 50'] },
    condicao: () => true,
    pronto: 'Idade mínima, modo de uso e teste dos filtros registrados; famílias informadas antes do início.',
  },
  {
    id: 'R-35', versao: 1, pacote: 'PESSOAS', tipo: 'politica', substitui: [], campos: ['usuarios', 'afetados'],
    se: k => k.criancas && k.usaEst && usoDiario(k),
    origem: () => ({ campo: 'usuarios', vals: ['estudantes'] }),
    variantes: [{
      oque: 'Definir a quem a ferramenta encaminha e em que prazo quando um estudante relata violência, automutilação ou outro risco, e o que o fornecedor guarda.',
      porque: 'Conversas abertas com crianças vão trazer esses relatos, e a ferramenta não pode ser a última a saber.',
      como: ['Listar os temas que geram encaminhamento e o responsável em cada escola.', 'Definir o prazo de resposta e testar o fluxo no piloto.', 'Fixar no contrato o que o fornecedor pode guardar dessas conversas.'],
    }],
    paraque: 'Um relato de risco feito na conversa chega rápido a quem pode proteger o estudante.',
    quem: ['pedagogica', 'protecao_dados'], marco: 'M1', pd: 6, curto: 'o encaminhamento de relatos de risco',
    alta: () => true,
    pronto: 'Os temas, o responsável por escola, o prazo e o que o fornecedor guarda estão definidos e foram testados.',
  },
  {
    id: 'R-36', versao: 1, pacote: 'PESSOAS', tipo: 'politica', substitui: ['criancas'], campos: ['afetados'],
    se: k => k.criancas && !k.usaEst && (k.dadosEst || k.consDecide.length > 0 || !comMateriais(k)),
    origem: () => ({ campo: 'afetados', vals: ['criancas'] }),
    variantes: [{
      oque: 'Informar as famílias e os estudantes antes do teste, em linguagem simples, sobre para que serve, que dados usa e como pedir correção.',
      porque: 'Transparência é condição para contestar e para manter a confiança das famílias.',
      como: ['Escrever um aviso curto: finalidade, dados usados, quem vê, por quanto tempo e como pedir correção.', 'Entregar o aviso antes do início e registrar a entrega.'],
    }],
    paraque: 'Famílias e estudantes sabem o que a ferramenta faz e como pedir correção.',
    quem: ['comunicacao', 'pedagogica', 'protecao_dados'], marco: 'M1', pd: 6, curto: 'o aviso às famílias e aos estudantes',
    exemplosNorma: { BR: ['LGPD art. 14, § 6º'], UE: ['RGPD arts. 12 e 13'] },
    alta: k => k.pesoMax > 0,
    pronto: 'O aviso às famílias foi aprovado e entregue antes do início do teste.',
  },
  {
    id: 'R-37', versao: 1, pacote: 'PESSOAS', tipo: 'politica', substitui: ['criancas'], campos: ['afetados', 'tarefas'],
    se: k => k.criancas && !k.usaEst && comMateriais(k),
    origem: () => ({ campo: 'afetados', vals: ['criancas'] }),
    variantes: [{
      oque: 'Revisar todo material gerado antes de usá-lo com a turma e revisar uma amostra por mês.',
      porque: 'O material chega às crianças mesmo quando a ferramenta não decide nada sobre elas.',
      como: ['Dar aos professores um roteiro curto de revisão do material gerado.', 'Revisar todo mês uma amostra do material usado nas turmas.'],
    }],
    paraque: 'O material gerado chega às turmas revisado por um professor.',
    quem: ['escolas', 'formacao'], marco: 'M1', pd: 6, curto: 'a revisão do material gerado',
    pronto: 'O roteiro de revisão está entregue aos professores e a amostra mensal tem responsável.',
  },
  {
    // Pacote TESTE (ECO eco-alerta-retro); fica neste arquivo por ser do mesmo tema que R-41 e R-42. Absorve `alternativa` no caso do alerta.
    id: 'R-19', versao: 1, pacote: 'TESTE', tipo: 'politica', substitui: ['alternativa'], campos: ['tarefas'],
    se: k => alertaPrecoce(k) || k.classes.includes('previsao'),
    origem: k => ({ campo: 'tarefas', vals: alertaPrecoce(k) ? ['alerta_precoce'] : k.tarefas }),
    variantes: [{
      oque: 'Fazer a prova de conceito com dados de anos anteriores, sem alertar estudantes de hoje, e comparar com uma regra simples de faltas e notas.',
      porque: 'Uma regra simples pode acertar quase o mesmo e é mais barata, mais fácil de explicar e de contestar.',
      como: ['Reunir os dados de anos anteriores e separar quem abandonou.', 'Montar a regra simples de faltas e notas como ponto de comparação.', 'Comparar acertos, alertas falsos e antecedência do alerta, por grupo de estudantes.'],
    }],
    paraque: 'A rede só contrata a previsão se ela superar uma regra simples, medida com dados que já existem.',
    quem: ['avaliacao', 'tecnologia'], marco: 'M1', pd: 3, curto: 'a prova de conceito com dados de anos anteriores',
    // Pontuação (4.1): embora do pacote TESTE, a regra protege pessoas (nenhum estudante de hoje é alertado por um modelo
    // não validado) e compara os erros por grupo; por isso conta em "Pessoas e direitos" (tocaPessoas) e trata grupos.
    // Efeito: no C ela lidera o cartão de teste, à frente da R-13 (comparação do piloto que só vem depois desta prova).
    tocaPessoas: true, grupos: true,
    condicao: () => true,
    pronto: 'Os resultados da previsão e da regra simples, por grupo, estão registrados antes de qualquer alerta a estudantes.',
  },
  {
    id: 'R-33', versao: 1, pacote: 'PESSOAS', tipo: 'politica', substitui: [], campos: ['impactos', 'tarefas', 'consequencias'],
    // risco elevado com decisão sobre pessoas, tutoria, correção ou alerta, e (REC-31) qualquer caso com impacto de desigualdade ou inclusão
    se: k => tarefaEquidade(k) || impactoGrupos(k) || (k.alto && k.consDecide.length > 0),
    origem: k => {
      if (impactoGrupos(k)) return { campo: 'impactos', vals: k.impactos.filter(i => IMPACTOS_GRUPOS_LOCAL.includes(i)) };
      const t = k.tarefas.filter(x => TAREFAS_EQUIDADE.includes(x));
      return t.length ? { campo: 'tarefas', vals: t } : { campo: 'consequencias', vals: k.consDecide };
    },
    variantes: [
      { quando: k => k.alto,
        oque: 'Verificar antes e durante o teste se a ferramenta funciona igual para todos os grupos, com limite de diferença que obriga a ajustar ou parar.',
        porque: 'Uma média positiva pode esconder piora justamente no grupo que se quer ajudar; essa diferença precisa ser procurada, não esperada.',
        como: ['Listar os grupos a comparar (escola, zona rural ou urbana, sexo, raça ou cor, deficiência, língua) e conferir se a amostra de cada um é grande o bastante.', 'Fixar antes do teste a diferença máxima aceita e o que acontece se ela for passada.', 'Medir todo mês durante o teste e registrar os resultados por grupo.'] },
      { oque: 'Comparar os resultados do teste entre os grupos que a rede quer alcançar, para ver se a diferença diminui e não aumenta.',
        porque: 'Se a meta é reduzir diferenças, medir só a média não mostra se ela foi alcançada.',
        como: ['Escolher os grupos que importam para a meta (escola, zona, deficiência, língua).', 'Registrar o resultado de cada grupo no fim do teste e comparar com o da rede.'],
        quem: ['avaliacao', 'inclusao'] },
    ],
    paraque: 'A rede sabe se a ferramenta ajuda todos os grupos ou só alguns.',
    quem: ['avaliacao', 'protecao_dados'], marco: 'M1', pd: 6, curto: 'a medida de equidade entre grupos',
    // Condição quando a saída é previsão ou classificação de pessoas em risco elevado (C); Recomendada (alta) nos demais (B)
    condicao: k => k.alto && k.classes.some(c => ['previsao', 'classificacao'].includes(c)), alta: k => k.alto,
    pronto: 'Os grupos, o limite de diferença e a amostra mínima estão definidos antes do teste; o resultado por grupo será lido antes da decisão.',
  },
  {
    id: 'R-38', versao: 1, pacote: 'PESSOAS', tipo: 'politica', substitui: [], campos: ['usuarios', 'afetados'],
    se: k => k.usaEst || k.usuarios.includes('professores') || k.criancas || k.afetados.includes('familias'),
    origem: k => (k.usaEst || k.usuarios.includes('professores')
      ? { campo: 'usuarios', vals: k.usuarios.filter(u => ['professores', 'estudantes'].includes(u)) }
      : { campo: 'afetados', vals: k.afetados.filter(a => ['criancas', 'familias'].includes(a)) }),
    variantes: [{
      oque: 'Apresentar o plano do teste ao conselho, à representação dos professores e às famílias, e registrar as objeções e a resposta.',
      porque: 'Uma mudança sem escuta perde apoio e costuma ser revertida na primeira crise.',
      como: ['Marcar a apresentação para antes do início do teste, com tempo para perguntas.', 'Registrar as objeções e o que a rede respondeu ou mudou no plano.'],
    }],
    paraque: 'O teste começa com a escuta de quem vai usar a ferramenta ou ser afetado por ela.',
    quem: ['gabinete', 'comunicacao'], marco: 'M1', pd: 6, curto: 'a escuta do conselho, dos professores e das famílias',
    pronto: 'A apresentação foi feita e as objeções e as respostas estão registradas.',
  },
  {
    id: 'R-39', versao: 1, pacote: 'PESSOAS', tipo: 'politica', substitui: [], campos: ['tarefas'],
    se: k => k.alto,
    origem: k => ({ campo: 'tarefas', vals: k.tarefas }),
    variantes: [{
      oque: 'Nomear quem pode suspender o uso em até 24 horas e em que situações, como diferença entre grupos, vazamento ou conteúdo impróprio.',
      porque: 'Sem autoridade e critério definidos, a suspensão demora e o dano se acumula.',
      como: ['Nomear quem decide a suspensão e um substituto, com contato direto no fornecedor.', 'Listar as situações que levam à suspensão e ligá-las aos indicadores acompanhados.', 'Prever no contrato a suspensão de uma funcionalidade sem rescindir o contrato.'],
    }],
    paraque: 'Um problema grave para o uso em horas, e não em semanas.',
    quem: ['gabinete'], marco: 'M1', pd: 6, curto: 'quem pode suspender o uso',
    exige: ['CONTRATO.verificacao-suspensao'],
    exemplosNorma: { UE: ['AI Act art. 26'] },
    pronto: 'Quem pode suspender, em quais situações e em que prazo está definido e consta do contrato.',
  },
  {
    id: 'R-40', versao: 1, pacote: 'PESSOAS', tipo: 'politica', substitui: [], campos: ['consequencias'],
    se: k => consequencias(k).some(c => ['nota', 'acesso', 'disciplina'].includes(c)),
    origem: k => ({ campo: 'consequencias', vals: consequencias(k).filter(c => ['nota', 'acesso', 'disciplina'].includes(c)) }),
    variantes: [
      { quando: k => consequencias(k).includes('disciplina'),
        oque: 'Vetar funções que inferem emoções ou atenção dos estudantes e manter com uma pessoa a nota, a matrícula e a disciplina.',
        porque: 'Inferir emoções na escola é proibido em várias jurisdições e é desproporcional em qualquer lugar; nota e disciplina são usos de alto risco.',
        como: ['Listar no edital e no contrato as funções vedadas, desabilitadas por configuração.', 'Em provas, usar detecção só com revisão humana e aviso prévio aos estudantes.', 'Registrar quem decidiu cada nota, matrícula ou medida disciplinar.'] },
      { oque: 'Manter a nota, a matrícula e o nível de ensino com uma pessoa, deixando a ferramenta só sugerir e o estudante livre para pedir revisão.',
        porque: 'Atribuir nota e decidir acesso são usos de alto risco em várias jurisdições, e a decisão final precisa de alguém que responda por ela.',
        como: ['Configurar a ferramenta sem decisão automática e registrar quem decidiu.', 'Abrir um canal para o estudante pedir revisão da nota ou da decisão.'] },
    ],
    paraque: 'Nenhuma nota, matrícula ou medida disciplinar é decidida só pela máquina.',
    quem: ['pedagogica', 'compras', 'juridico'], marco: 'M1', pd: 6, curto: 'a decisão humana sobre nota e matrícula',
    exige: ['CONTRATO.escopo-limites'],
    exemplosNorma: { UE: ['AI Act art. 5(1)(f) e Anexo III'] },
    condicao: () => true,
    pronto: 'As funções vedadas constam do edital e do contrato, e o registro de quem decidiu está configurado.',
  },
  {
    id: 'R-41', versao: 1, pacote: 'PESSOAS', tipo: 'politica', substitui: [], campos: ['tarefas', 'consequencias'],
    se: k => alertaPrecoce(k) || consequencias(k).includes('apoio_est'),
    origem: k => (alertaPrecoce(k) ? { campo: 'tarefas', vals: ['alerta_precoce'] } : { campo: 'consequencias', vals: ['apoio_est'] }),
    variantes: [
      { quando: alertaPrecoce,
        oque: 'Definir antes do primeiro alerta quem procura o estudante, em que prazo, com que apoio e onde registra, ajustando o limiar à capacidade das equipes.',
        porque: 'O alerta só reduz o abandono se virar ação; um limiar que gera mais alertas do que as equipes acompanham produz só uma lista.',
        como: ['Escolher quem procura cada estudante sinalizado, em que prazo e com que apoio.', 'Definir onde a ação é registrada e quem acompanha o resultado.', 'Calcular quantos alertas por escola as equipes conseguem acompanhar e ajustar o limiar a esse número.'] },
      { oque: 'Definir quem procura o estudante quando a ferramenta indicar que ele precisa de apoio, em que prazo e com que apoio.',
        porque: 'Indicar quem precisa de apoio não ajuda se ninguém age; sem protocolo, a indicação vira lista sem consequência.',
        como: ['Escolher quem procura o estudante em cada escola, em que prazo e com que apoio.', 'Definir onde a ação é registrada e quem acompanha o resultado.'] },
    ],
    paraque: 'Cada indicação de apoio vira uma ação com responsável e prazo.',
    quem: ['pedagogica', 'escolas'], marco: 'M1', pd: 6, curto: 'o protocolo do que fazer depois do alerta',
    // só se pode fazer antes do primeiro alerta; Condição no alerta precoce, Recomendada quando a indicação de apoio vem de outra tarefa
    irreversivel: alertaPrecoce, condicao: alertaPrecoce,
    pronto: 'O responsável, o prazo, o apoio e o registro da ação depois de cada indicação estão definidos por escola.',
  },
  {
    id: 'R-42', versao: 1, pacote: 'PESSOAS', tipo: 'politica', substitui: [], campos: ['tarefas', 'consequencias'],
    se: k => alertaPrecoce(k) || (k.consDecide.length > 0 && dadosSensiveis(k)),
    origem: k => (alertaPrecoce(k) ? { campo: 'tarefas', vals: ['alerta_precoce'] } : { campo: 'consequencias', vals: k.consDecide }),
    variantes: [
      { quando: alertaPrecoce,
        oque: 'Proibir usar o alerta ou a pontuação para punir, transferir, negar matrícula ou avaliar escolas, e mostrá-los só a quem age, sem rótulo visível.',
        porque: 'O mesmo dado que ajuda a apoiar pode ser usado para excluir; um rótulo de risco que acompanha o estudante por anos causa o dano que se quer evitar.',
        como: ['Escrever a norma interna que veda punir, transferir, negar matrícula ou avaliar escolas e professores com a pontuação, e levar a mesma vedação ao contrato.', 'Listar quem vê o quê sobre cada estudante e impedir a exibição em sala ou em listas abertas.', 'Fixar o prazo de guarda das pontuações (por exemplo, o fim do ano letivo) e a exclusão verificável, também no fornecedor.'] },
      { oque: 'Proibir usar as saídas da ferramenta sobre estudantes para punir, transferir, negar matrícula ou avaliar escolas, e mostrá-las só a quem age.',
        porque: 'O mesmo dado que ajuda a apoiar pode ser usado para excluir, e dados sensíveis tornam esse desvio mais grave.',
        como: ['Escrever a norma interna que lista os usos vedados e levar a mesma vedação ao contrato.', 'Listar quem vê o quê sobre cada estudante e fixar o prazo de guarda.'] },
    ],
    paraque: 'O que a ferramenta mostra sobre um estudante só é usado para apoiá-lo.',
    quem: ['protecao_dados', 'juridico', 'gabinete'], marco: 'M1', pd: 6, curto: 'a regra de uso exclusivo para apoio',
    exemplosNorma: { BR: ['LGPD art. 6º'], UE: ['RGPD art. 5(1)(b)'] },
    irreversivel: alertaPrecoce, condicao: () => true,
    pronto: 'A vedação de outros usos está em norma interna e no contrato, com a lista de quem vê o quê e o prazo de guarda.',
  },
  {
    id: 'R-43', versao: 1, pacote: 'PESSOAS', tipo: 'politica', substitui: [], campos: ['consequencias'],
    se: k => consequencias(k).includes('recursos'),
    origem: () => ({ campo: 'consequencias', vals: ['recursos'] }),
    variantes: [{
      oque: 'Publicar os critérios de distribuição de recursos entre escolas e comparar a distribuição com e sem a ferramenta.',
      porque: 'Uma pontuação opaca pode concentrar o apoio onde o modelo erra menos, e não onde há mais necessidade.',
      como: ['Publicar os critérios de distribuição antes de usar a ferramenta.', 'Comparar a distribuição de recursos com e sem a ferramenta nas mesmas escolas.', 'Manter a decisão final com a instância responsável.'],
    }],
    paraque: 'A distribuição de recursos segue critérios conhecidos, e não uma pontuação que ninguém consegue explicar.',
    quem: ['gabinete', 'orcamento'], marco: 'M3', pd: 6, curto: 'os critérios de distribuição de recursos',
    alta: k => k.alto,
    pronto: 'Os critérios estão publicados e a comparação da distribuição com e sem a ferramenta está registrada.',
  },
  {
    id: 'R-44', versao: 1, pacote: 'PESSOAS', tipo: 'politica', substitui: [], campos: ['consequencias'],
    se: k => k.alto && k.consDecide.length > 0,
    origem: k => ({ campo: 'consequencias', vals: k.consDecide }),
    variantes: [{
      oque: 'Fazer uma avaliação de impacto sobre direitos, e não só sobre dados, com quem pode ser prejudicado, como, com que salvaguarda e risco residual.',
      porque: 'O relatório de proteção de dados não examina discriminação, estigma nem o direito à educação.',
      como: ['Partir do perfil de risco do caso e dos cenários de dano para listar quem pode ser prejudicado e como.', 'Registrar para cada risco a salvaguarda, o responsável e o risco que sobra.', 'Começar antes do teste e concluir antes de assinar a implantação, com aprovação da instância de IA da rede.'],
    }],
    paraque: 'A rede conhece os danos possíveis aos direitos dos estudantes e decide com as salvaguardas à vista.',
    quem: ['gabinete', 'protecao_dados', 'juridico'], marco: 'M1', pd: 6, curto: 'a avaliação de impacto sobre direitos',
    exemplosNorma: { UE: ['AI Act art. 27'] },
    alta: () => true,
    pronto: 'A avaliação de impacto sobre direitos está aprovada, com salvaguardas e risco residual registrados.',
  },
  {
    id: 'R-109', versao: 1, pacote: 'PESSOAS', tipo: 'politica', substitui: ['acomp-reforcar'], campos: ['acompanhamento'],
    se: k => k.v('acompanhamento') === 'leve' && (k.alto || k.consDecide.length > 0),
    variantes: [{
      oque: 'Reforçar o acompanhamento do uso, com indicadores mensais e revisão de amostras das respostas.',
      porque: 'Com risco elevado ou decisões sobre estudantes, acompanhamento leve não detecta erros a tempo.',
      como: ['Passar o acompanhamento para regular ou intensivo.', 'Definir os indicadores mensais e quem revisa as amostras.'],
    }],
    paraque: 'Os erros que afetam estudantes aparecem enquanto ainda dá para corrigir.',
    quem: ['avaliacao', 'escolas'], marco: 'M1',
    alta: () => true,
    pronto: 'O nível de acompanhamento, os indicadores e os responsáveis estão definidos.',
  },
];
