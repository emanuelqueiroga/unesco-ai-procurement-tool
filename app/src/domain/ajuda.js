// =====================================================================
// Ajuda das perguntas (0.0.15, BL2.2 e BL2.3), reescrita de "passo/fase" para "capítulo/pergunta".
// Módulo puro (sem DOM). Os textos são chaves de tradução em português: quem exibe passa por tr()/t().
// [[id]] e [[id|texto]] marcam termos do glossário (glossario.js); ui/Termo os transforma em termos sublinhados.
//
// O que a tela mostra dentro de "Por que perguntamos isso?" (fechado por padrão):
//   como  - "Como responder"
//   quem  - "Quem costuma saber" (setor da secretaria ou do ministério)
//   exemplo - "Exemplo"
// As três partes juntas ficam abaixo de 80 palavras (regra da 0.0.15). A frase que explica por que a pergunta importa
// é a abertura da tela (LEAD, em percurso/textos.ts), sempre visível.
//
// Os textos da 0.0.15 (PASSO_AJUDA, uma ajuda por passo) valem para as perguntas do passo; onde a pergunta pede mais
// precisão há um texto próprio. As dicas (uma linha por campo) vêm de CAMPOS[].dica da 0.0.15.
// =====================================================================

// ---------------------------------------------------------- ajuda por passo (0.0.15, PASSO_AJUDA), indexada por número
// serve, importa, como, quem, ex: como na 0.0.15; "passo 1.2" virou "capítulo 1" (AJU-17).
export const PASSO_AJUDA = {
  '1.1': { serve: 'Registra onde a decisão será tomada e quantas escolas e estudantes o caso atende.',
    importa: 'O número de escolas e de estudantes dimensiona licenças, formação, suporte e dispositivos, e portanto o custo.',
    como: 'Use o cadastro oficial de escolas e matrículas.', quem: 'planejamento ou estatística educacional',
    ex: 'Rede estadual; no 6º ano, 40.000 estudantes.' },
  '1.2': { serve: 'Diz que problema da rede você quer resolver, sem falar de tecnologia.',
    importa: 'O problema define o que a ferramenta faz e quem a usa. Uma [[linhabase|linha de base]] mostra depois se o gasto valeu a pena.',
    como: 'Escolha a prioridade e marque os problemas.', quem: 'área pedagógica e de avaliação',
    ex: 'Metade dos estudantes do 5º ano rural não lê com fluência.' },
  '1.3': { serve: 'Mostra o que a rede já tem de equipes e regras para o uso de IA na educação.',
    importa: 'Governança é a [[camada]] 1 do custo total: comitês, revisão jurídica e monitoramento ocupam tempo pago.',
    como: 'Responda sobre a rede toda.', quem: 'gabinete, assessoria jurídica e proteção de dados',
    ex: 'Há comitê, mas não política de dados: “Sim” para o comitê e “Não” para a política.' },
  '2.0': { serve: 'Escolhe como a rede testa a IA antes de comprar: [[poc|prova de conceito]], [[piloto]] ou os dois.',
    importa: 'O teste define o tamanho e a duração do Ano 0 e quanto se gasta antes de decidir comprar.',
    como: 'Marque as duas, ou peça uma recomendação.', quem: 'tecnologia e área pedagógica',
    ex: 'Prova de conceito de 2 meses e, depois, piloto em 20 escolas.' },
  '2.1': { serve: 'Descreve o que a IA fará no dia a dia da escola, e não o produto.',
    importa: 'A tarefa define quem usa e com que frequência, e isso muda licenças, formação e suporte.',
    como: 'Marque uma ou mais tarefas; as sugeridas vêm do problema do capítulo 1.', quem: 'área pedagógica e professores',
    ex: 'Planejar aulas e corrigir redações.' },
  '2.2': { serve: 'Diz quem usa a ferramenta, quem recebe o resultado e com que frequência.',
    importa: 'Mais pessoas e mais uso significam mais licenças, mais formação e, em ferramentas pagas por uso, mais custo.',
    como: 'Confirme ou ajuste as respostas sugeridas pelas tarefas.', quem: 'área pedagógica e coordenação das escolas',
    ex: 'Professores do 6º ao 9º ano usam; os estudantes recebem as atividades.' },
  '2.3': { serve: 'Registra as ferramentas, como se pagam, a licença e quanto adaptar.',
    importa: 'Preço, forma de pagamento e adaptação definem o custo do Ano 0 e o que se repete todo ano ([[recorrente|custo recorrente]]).',
    como: 'Se ainda não escolheu, responda “Ainda não sei”.', quem: 'compras e tecnologia',
    ex: 'Assinatura de [[saas|SaaS]] por professor por mês, com configuração de contas e turmas.' },
  '2.4': { serve: 'Diz se as escolas têm internet e dispositivos para usar a ferramenta.',
    importa: 'Conexão nova é [[recorrente|custo recorrente]]; dispositivos novos são uma compra, em geral do [[capital|orçamento de capital]].',
    como: 'Pergunte às escolas ou use o último levantamento de infraestrutura.', quem: 'tecnologia da informação e infraestrutura escolar',
    ex: 'Em 400 das 600 escolas a internet aguenta uma turma inteira.' },
  '2.5': { serve: 'Planeja quem será formado, em que formato e por quantas horas.',
    importa: 'A formação está entre os fatores que mais pesam no custo total: horas de cada pessoa, pagas ou tiradas do trabalho.',
    como: 'Sem as horas, use “Usar uma estimativa”.', quem: 'formação de professores e gestão de pessoas',
    ex: '4 horas de oficina e 4 de acompanhamento em sala: 8 horas por professor.' },
  '2.6': { serve: 'Diz quem atende as dúvidas e os problemas das escolas e como a rede acompanha o uso.',
    importa: 'Suporte e acompanhamento ocupam equipes todo ano; esse tempo é medido em [[eti|ETI]].',
    como: 'Escolha quem dá o suporte e o nível desejado.', quem: 'tecnologia e atendimento às escolas',
    ex: 'O fornecedor atende pelo chat; a equipe da rede cuida de acessos e contas.' },
  '3.1': { serve: 'Define quantas escolas e pessoas começam a usar logo depois do teste.',
    importa: 'É o Ano 1 da estimativa: licenças, formação, suporte e dispositivos crescem com o número de pessoas.',
    como: 'Use a sugestão ou informe o que a rede consegue atender.', quem: 'planejamento e tecnologia',
    ex: '200 escolas e 4.000 professores no primeiro ano.' },
  '3.2': { serve: 'Escolhe como a ferramenta funciona e se liga aos sistemas da rede: produto pronto ([[saas|SaaS]]), [[api|API]] ou [[pesos|pesos abertos]].',
    importa: 'O arranjo muda o custo de integração, de segurança e de saída do contrato.',
    como: 'Se não souber, use a arquitetura presumida.', quem: 'tecnologia e segurança da informação',
    ex: 'A rede assina um assistente pronto e o fornecedor opera tudo.' },
  '4.1': { serve: 'Define até onde o uso chega, em quanto tempo e por quantos anos estimar.',
    importa: 'É a base da estimativa: o custo anual cresce com as pessoas que usam.',
    como: 'Informe as pessoas da rede toda, mesmo que só parte comece agora.', quem: 'planejamento e orçamento',
    ex: '12.000 professores em 2 anos, custo estimado por 5 anos.' },
  '4.2': { serve: 'Mostra o custo total ([[tco|TCO]]) por ano e por [[camada]], e a [[dotacao|dotação]] por exercício.',
    importa: 'Separa o que se paga uma vez ([[capital|orçamento de capital]]) do que se repete ([[corrente|orçamento corrente]]).',
    como: 'Nada a responder: ajuste na calculadora a [[desconto|taxa de desconto]] e as faixas [[p10p90|P10–P90]].', quem: 'finanças e orçamento',
    ex: 'Dispositivos do Ano 0 vão ao orçamento de capital; a assinatura, ao corrente.' },
  '4.3': { serve: 'Lista as ações para este caso, por prioridade, a partir das suas respostas.',
    importa: 'Mostra o que fazer antes do teste e de contratar, com custo e compra separados de política.',
    como: 'Nada a responder: leia as de prioridade alta e use “Ir à pergunta”.', quem: 'quem coordena a compra e a assessoria jurídica',
    ex: 'Sem medida do problema, a lista pede medi-lo antes.' },
};

/** A ajuda do passo "N.M" (cinco partes da 0.0.15) ou null. Serve ao plano ("Quanto custa" e "O que fazer"). */
export function ajudaDoPasso(num) { return PASSO_AJUDA[String(num || '')] || null; }

// ---------------------------------------------------------- ajuda por pergunta
// Só entram as partes que a pergunta precisa dizer de próprio. O que falta cai no passo: `quem` sempre; `como` e `exemplo`
// não (um exemplo do passo inteiro pode não servir a uma pergunta só). Reuso literal dos textos da 0.0.15: o `h` das
// perguntas (CAMPOS[].h), o PASSO_AJUDA acima e as frases de CAMPOS[].ex sem o prefixo "Exemplo:".
const P = PASSO_AJUDA;
const GOV_COMO = P['1.3'].como, GOV_EX = P['1.3'].ex;
const PERGUNTAS = {
  // capítulo 1
  '1.1.1': { como: 'O nível que decide e paga.', quem: 'gabinete e planejamento', exemplo: 'Secretaria estadual de educação.' },
  '1.1.2': { como: 'O planejamento é sempre nacional. Escolha o país e, se quiser, informe a instituição responsável.', exemplo: 'Brasil', quem: 'Equipe de planejamento' },
  '1.1.2.1': { como: 'Escreva o nome como a equipe e os documentos oficiais o chamam.', exemplo: 'Ex.: Ministério da Educação', quem: 'Equipe de planejamento' },
  '1.1.3': { como: 'Marque a situação mais próxima da sua; o plano ajusta as recomendações.', quem: 'compras e planejamento',
    exemplo: 'Um fornecedor já mandou uma proposta: “Avaliar uma proposta já recebida”.' },
  '1.1.4': { como: P['1.1'].como, exemplo: P['1.1'].ex },
  '1.1.5': { como: P['1.1'].como, exemplo: P['1.1'].ex },
  '1.2.1': { como: 'Marque uma ou mais.' },
  '1.2.2': { como: 'Selecione todos os desafios que fazem parte do seu plano.', exemplo: P['1.2'].ex },
  '1.2.3': { como: 'Vira o título do caso se você não der outro nome.' },
  '1.2.4': { como: 'Situação atual, quem é afetado e o que se sabe sobre as causas. Se, ao retirar a palavra "IA", o texto deixa de explicar o problema, reescreva.',
    exemplo: P['1.2'].ex },
  '1.2.5': { como: 'Marque um ou mais. O impacto orienta as tarefas sugeridas no capítulo 2.' },
  '1.2.6': { exemplo: 'Reduzir de 50% para 35% os estudantes abaixo do nível adequado em leitura em dois anos.' },
  '1.2.7': { como: 'Diga se já existe uma medida do problema; sem ela, o plano pede para medi-la antes.',
    exemplo: 'Resultados da avaliação de leitura do ano passado, por escola.' },
  '1.2.8': { como: 'Compare com ao menos uma alternativa que não use IA.',
    exemplo: 'Reforço escolar no contraturno, redesenho do processo ou um software convencional de exercícios.' },
  '1.3.1': { como: GOV_COMO, exemplo: GOV_EX },
  '1.3.2': { quem: 'gabinete e assessoria jurídica' },
  '1.3.3': { quem: 'assessoria jurídica' },
  '1.3.4': { quem: 'proteção de dados e tecnologia' },
  '1.3.5': { quem: 'área pedagógica e assessoria jurídica' },
  '1.3.6': { quem: 'compras e assessoria jurídica' },
  // capítulo 2
  '2.0': { como: P['2.0'].como, exemplo: P['2.0'].ex },
  '2.1.1': { como: P['2.1'].como, exemplo: P['2.1'].ex },
  '2.1.2': { como: 'Um nome curto, que a equipe reconheça no plano.' },
  '2.2.1': { como: P['2.2'].como, exemplo: P['2.2'].ex },
  '2.2.2': { como: P['2.2'].como, exemplo: P['2.2'].ex },
  '2.2.3': { como: P['2.2'].como, exemplo: P['2.2'].ex },
  '2.2.4': { como: P['2.2'].como, exemplo: P['2.2'].ex },
  '2.3.1': { como: 'Conte as ferramentas de IA que as pessoas vão usar neste caso.',
    exemplo: 'Um assistente para planejar aulas e outra ferramenta para corrigir redações são duas ferramentas.' },
  '2.3.3': { como: 'A primeira da lista é a ferramenta principal: as perguntas 2.3.4 a 2.3.7 se referem a ela. O preço é opcional; sem ele, a estimativa usa um preço ilustrativo.' },
  '2.3.4': { como: P['2.3'].como, exemplo: P['2.3'].ex },
  '2.3.5': { como: 'Pense no período da prova de conceito ou do piloto.', exemplo: P['2.3'].ex },
  '2.3.6': { como: P['2.3'].como, quem: 'compras e assessoria jurídica',
    exemplo: 'Os termos aceitos ao criar uma conta gratuita são termos de uso padrão.' },
  '2.3.7': { como: 'Cada nível inclui os anteriores. Mais adaptação aumenta o custo de implantação e de manutenção.',
    exemplo: 'Traduzir para a língua local e alinhar as atividades ao currículo é adaptação de conteúdo e idioma.' },
  '2.3.8': { como: 'Participantes são as pessoas que usam a ferramenta.', quem: P['2.0'].quem, exemplo: '20 escolas, 600 professores, 4 meses.' },
  '2.4.1': { como: 'Adequada é a internet que aguenta uma turma inteira conectada ao mesmo tempo. Pergunte às escolas ou use o último levantamento de infraestrutura.',
    exemplo: P['2.4'].ex },
  '2.4.2': { como: P['2.4'].como, exemplo: P['2.4'].ex },
  '2.4.3': { como: P['2.4'].como, exemplo: 'Um carrinho com 30 tablets que circula entre as turmas da escola é uso rotativo.' },
  '2.4.4': { como: 'Considere se estão em condições de uso e se rodam a ferramenta.' },
  '2.5.2': { como: 'Marque um ou mais.' },
  '2.5.4': { como: P['2.5'].como, exemplo: P['2.5'].ex },
  '2.6.1': { como: P['2.6'].como, exemplo: P['2.6'].ex },
  '2.6.2': { como: P['2.6'].como, exemplo: P['2.6'].ex },
  '2.6.3': { como: 'Acompanhar o uso é verificar quem usa, como usa e com que resultado.' },
  // capítulos 3 e 4
  '3.1.1': { como: P['3.1'].como, exemplo: P['3.1'].ex },
  '3.2.1': { como: P['3.2'].como, exemplo: P['3.2'].ex },
  '4.1.1': { como: P['4.1'].como, exemplo: P['4.1'].ex },
  '4.1.2': { como: 'Pense no ritmo em que a rede consegue ampliar o uso depois da primeira etapa.', exemplo: P['4.1'].ex },
  '4.1.3': { como: 'Além do Ano 0, que é o da prova de conceito ou do piloto.' },
  // R8 (REC-52): perguntas novas do Refinar. Só o "Quem costuma saber"; a explicação de cada uma está em DICAS (abaixo do título no Refinar).
  '1.1.6': { quem: 'inclusão, educação especial e planejamento' },
  '1.2.9': { quem: 'planejamento e orçamento' },
  '1.2.10': { quem: 'planejamento e a área que opera o serviço' },
  '2.0.1': { quem: 'compras e assessoria jurídica' },
  '2.2.5': { quem: 'ouvidoria, assessoria jurídica e direção das escolas' },
  '2.2.6': { quem: P['2.2'].quem },
  '2.3.9': { quem: 'proteção de dados e assessoria jurídica' },
  '2.5.6': { quem: P['2.5'].quem },
  '2.6.4': { quem: 'coordenação pedagógica e direção das escolas' },
  '2.6.5': { quem: 'área pedagógica e equipe que acompanha os alertas' },
  '3.1.2': { quem: 'compras e assessoria jurídica' },
  '3.1.3': { quem: P['4.2'].quem },
  '3.2.2': { quem: P['3.2'].quem },
};
// Variantes do tamanho do teste (2.3.8) segundo o tipo de teste: 'poc' (prova de conceito) e 'ambos' (os dois)
const VARIANTES_TESTE = {
  poc: { como: 'Na prova de conceito testam a equipe e algumas pessoas convidadas, sem usuários reais.', exemplo: '15 pessoas, 2 meses.' },
  ambos: { como: 'Primeiro a prova de conceito, com a equipe e algumas pessoas convidadas; depois o piloto, com usuários reais em poucas escolas.',
    exemplo: 'Prova de conceito com 15 pessoas por 2 meses; piloto com 20 escolas, 600 professores, 4 meses.' },
};

/** "2.3.4" → "2.3"; "2.0" → "2.0"; "4.2" → "4.2"; o que não é número de pergunta → "" */
export function passoDaPergunta(n) {
  const m = /^(\d)\.(\d+)(?:\.\d+)?$/.exec(String(n == null ? '' : n).trim());
  return m ? m[1] + '.' + m[2] : '';
}

/**
 * A ajuda de uma pergunta pelo número ('2.3.4'): { como, quem, exemplo } (cada parte string ou null), ou null se não há nada.
 * `quem` cai no passo da pergunta quando ela não tem um próprio. Aceita também o número do passo ('2.3'), que devolve a ajuda
 * do passo inteiro. Textos em português (chaves de tradução, com marcas [[id]] do glossário). opcoes.modo ('poc' | 'ambos')
 * escolhe a variante do tamanho do teste (2.3.8).
 */
export function ajudaDaPergunta(n, opcoes) {
  const num = String(n == null ? '' : n).trim();
  let base = PERGUNTAS[num] || null;
  if (!base && PASSO_AJUDA[num]) base = { como: PASSO_AJUDA[num].como, quem: PASSO_AJUDA[num].quem, exemplo: PASSO_AJUDA[num].ex };
  const passo = PASSO_AJUDA[passoDaPergunta(num)];
  if (!base && !passo) return null;
  const v = num === '2.3.8' && opcoes && VARIANTES_TESTE[opcoes.modo] ? VARIANTES_TESTE[opcoes.modo] : null;
  const como = (v && v.como) || (base && base.como) || null;
  const exemplo = (v && v.exemplo) || (base && base.exemplo) || null;
  const quem = (base && base.quem) || (passo ? passo.quem : null) || null;
  if (!como && !exemplo && !quem) return null;
  return { como, quem, exemplo };
}

/** "Quem costuma saber" da pergunta (ou do passo, se o número for do passo): texto em português ou null. */
export function quemSabe(n) {
  const a = ajudaDaPergunta(n);
  return a ? a.quem : null;
}

/**
 * Ajuda de uma tela que reúne várias perguntas (1.1.4 + 1.1.5, 2.4.1 + 2.4.2…): para cada parte vale a primeira pergunta,
 * na ordem dada, que a tem. Devolve { como, quem, exemplo } ou null.
 */
export function ajudaDeTela(numeros, opcoes) {
  const L = (numeros || []).map((n) => ajudaDaPergunta(n, opcoes)).filter(Boolean);
  if (!L.length) return null;
  const parte = (k) => { const x = L.find((a) => a[k]); return x ? x[k] : null; };
  const r = { como: parte('como'), quem: parte('quem'), exemplo: parte('exemplo') };
  return r.como || r.quem || r.exemplo ? r : null;
}

// ---------------------------------------------------------- dicas (CAMPOS[].dica da 0.0.15), uma linha por campo
// Até 170 caracteres. No Refinar a dica aparece sob o título da pergunta. No Essencial a frase de abertura já diz o
// essencial, e só entram na tela as dicas marcadas em DICA_NA_TELA, porque dizem algo que a abertura não diz.
export const DICAS = {
  grade: 'Estes números dimensionam licenças, formação e suporte. O cadastro de escolas e matrículas da rede serve.',
  linhaBase: 'Sem uma [[linhabase|linha de base]], não dá para saber depois se a IA ajudou.',
  testes: 'Na [[poc|prova de conceito]] testa-se a tecnologia; no [[piloto]], o uso real.',
  tarefas: 'Cada tarefa muda quem usa a ferramenta e quanto a usa, e isso muda o custo.',
  frequencia: 'Em ferramentas pagas por uso, mais uso significa mais custo.',
  nFerramentas: 'Cada ferramenta tem a sua licença, adaptação e suporte, e soma ao custo.',
  ferramentas: 'O preço é por licença por mês. Uma cotação do fornecedor dá o valor mais próximo da realidade.',
  tipoTec: 'Gratuita não é o mesmo que sem custo: formação, suporte e integração continuam a ser pagos.',
  pagamento: 'Por usuário ou por consumo, o custo cresce com o uso; o valor institucional é fixo e se repete todo ano ([[recorrente|custo recorrente]]).',
  licenca: 'A licença diz o que a rede pode fazer com a ferramenta, por quanto tempo e o que acontece ao sair.',
  adaptacao: 'Ajustar contas e turmas é simples; ligar a sistemas da rede ou programar exige equipe técnica, medida em [[eti|ETI]].',
  piloto: 'Participantes e meses definem as licenças e o suporte do Ano 0.',
  internet: 'Conexão nova é [[recorrente|custo recorrente]]: uma mensalidade por escola, todo ano.',
  modeloDisp: 'O modelo de uso define quantos dispositivos a rede precisa comprar.',
  dispExistem: 'Dispositivos novos são uma compra, em geral do [[capital|orçamento de capital]].',
  formacaoHoras: 'O custo é horas por pessoa × pessoas formadas × custo da hora.',
  formacaoPaga: 'Se o fornecedor ou um parceiro paga, o custo aparece no total, mas não na [[dotacao|dotação]] da rede.',
  suporteNivel: 'Mais suporte significa mais tempo de equipe, medido em [[eti|ETI]].',
  acompanhamento: 'Acompanhar mais exige mais tempo de gestão e de monitoramento da equipe.',
  implantacao: 'Estas pessoas entram no Ano 1 da estimativa e definem licenças, formação e suporte desse ano.',
  arquitetura: 'Produto pronto ([[saas|SaaS]]), aplicação que usa uma [[api|API]] ou modelo de [[pesos|pesos abertos]]: cada um tem custos diferentes.',
  elegiveis: 'Todas as pessoas que usariam a ferramenta: o [[recorrente|custo recorrente]] anual cresce com este número.',
  horizonte: 'Um horizonte maior mostra o custo de manter a ferramenta, e não só o de começar.',
  // R8 (REC-52): perguntas novas do Refinar
  publico: 'Estes grupos pedem acessibilidade, línguas e conexão adequadas. Sem resposta, o quadro de equidade mostra "não informado", e não "sem risco".',
  altCustoEfeito: 'Custo por pessoa por ano, em US$, e ganho de aprendizagem em desvios-padrão, em faixa. Sem isso, o plano mostra só a fórmula do efeito de empate.',
  volumeResultado: 'Com o volume por mês ou por ano, o plano calcula o custo por solicitação ou por estudante atendido.',
  instrumentoTeste: 'O instrumento define se o teste cria direito de continuar com o fornecedor. Sem resposta, é deduzido do teste, do pagamento e da situação.',
  contestacaoExiste: 'Sem resposta, o plano presume um caminho só no papel. Se não existe e a saída afeta pessoas, o plano recomenda criar antes esse caminho.',
  momentoUso: 'O momento diz de onde sai o tempo de uso: da grade, do contraturno, de casa ou do planejamento do professor.',
  treino: 'Sem resposta, o plano presume que não se sabe e pede a cláusula de proibição. "Sim" gera um alerta de bloqueio.',
  tempoJornada: 'Formação fora do horário pago tem pouca adesão. O tempo do professor é custo da [[camada]] 6, mesmo quando não é gasto novo.',
  apoioEscola: 'O suporte técnico resolve acesso e senha; a dúvida de como usar na aula precisa de alguém na escola. "Ninguém definido" pede a recomendação.',
  revisao: 'A taxa de estudantes sinalizados por mês e os minutos por alerta dão as horas de revisão. Sem os dois, a estimativa não inclui essa linha.',
  estrategiaCompra: 'O instrumento certo depende da maturidade da solução. Sem resposta, é deduzido do tipo de tecnologia e da adaptação.',
  dotacao: 'Sem [[dotacao|dotação]] prevista, um contrato de vários anos pode ser cortado no meio. "Não", "Em parte" e "Não sei" tornam a reserva uma condição.',
  verificacao: 'Registro de versão e registros de uso permitem refazer testes e explicar saídas. Sem eles a verificabilidade cai e o risco sobe.',
};
/** campos cuja dica aparece também na tela do Essencial (trazem o que a frase de abertura não traz) */
export const DICA_NA_TELA = ['testes', 'tipoTec', 'pagamento', 'internet', 'formacaoHoras', 'suporteNivel'];

/** A dica de um campo (id de CAMPOS) ou null. */
export function dicaDoCampo(id) { return DICAS[String(id)] || null; }
/** A dica que aparece na tela do Essencial que responde a `campos` (a do primeiro campo marcado) ou null. */
export function dicaDaTela(campos) {
  const c = (campos || []).find((x) => DICA_NA_TELA.includes(x));
  return c ? DICAS[c] : null;
}

// ---------------------------------------------------------- ⓘ das camadas 2, 3 e 6 (capítulo 3)
// CAMADAS_INFO.c236 da 0.0.15, com a última frase reescrita: os passos 2.1, 2.4 e 2.5 não existem mais como telas.
export const INFO_C236 = 'Camadas 2, 3 e 6 · Aplicações de IA, experiência de uso e adoção (camada 2); infraestrutura e dispositivos (camada 3); formação e capacidade das equipes (camada 6). Nesta primeira etapa as três crescem juntas, porque dependem do número de escolas e de pessoas que passam a usar a ferramenta. A matriz de camadas traz o que Krueger e Jackson (2026, p. 11) dizem de cada uma.';

/** Todos os textos de ajuda em português (para os testes de tradução e o levantamento de chaves). */
export function ajudaTextos() {
  const o = new Set();
  Object.values(PASSO_AJUDA).forEach((a) => Object.values(a).forEach((x) => o.add(x)));
  Object.values(PERGUNTAS).forEach((a) => Object.values(a).forEach((x) => o.add(x)));
  Object.values(VARIANTES_TESTE).forEach((a) => Object.values(a).forEach((x) => o.add(x)));
  Object.values(DICAS).forEach((x) => o.add(x));
  o.add(INFO_C236);
  return [...o];
}
