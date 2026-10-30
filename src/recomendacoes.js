// =====================================================================
// Recomendações para você (v10, decisão C; v11): motor de regras que transforma as
// respostas DESTE caso numa lista curta e priorizada de ações.
// Cada item: { id, quando, tipo, prioridade, texto, porque: { n, pergunta, resposta, sugerido }, ir }
//   quando: 'antes_teste' | 'antes_contratar' | 'manter'
//   tipo: 'custo' (custo e compra) | 'politica' (política e governança)
//   prioridade: 'alta' | 'media'
//   ir: 'fase:passo:n' (n com hífens), o mesmo formato de data-ir do percurso.
// Mostradas no passo 4.3 (renderRecomendacoes, chamado por fluxo.js) e como
// primeira seção do plano de contratação (secaoRecomendacoes, em resumo.js).
// v11: sem fonte de recursos; regras novas para ferramentas, internet, dispositivos, formação,
// suporte, acompanhamento, prova de conceito e piloto juntos, implantação, arquitetura e expansão.
// Páginas citadas: Krueger e Jackson (2026), só as já usadas no plano (ver plano/2_tco_unesco.md).
// O texto em português é a chave de tradução (i18n/v10_r2_*.json e i18n/v11_s3_*.json).
// v13 (pacote B3, i18n/v13_b3_*.json): plano de formação, problemas sem tarefa de IA, metas com lacunas, linha de base
// sem medida e, nas 1.3.x "Em parte", a ação cita o "O que falta?" (S.respDet).
// =====================================================================

const QUANDO_REC = [['antes_teste', 'Antes do teste'], ['antes_contratar', 'Antes de contratar'], ['manter', 'Para manter e ampliar']];
const TIPO_REC = { custo: 'Custo e compra', politica: 'Política e governança' };
const PRIO_REC = { alta: 'Alta', media: 'Média' };
const TIT_REC = 'Recomendações para você';
const TXT_REC = {
  intro: 'Ações para este caso, geradas a partir das suas respostas. Comece pelas de prioridade alta. Cada ação mostra a pergunta e a resposta que a originou: se mudar a resposta, a lista muda.',
  introPlano: 'Ações geradas a partir das respostas deste caso, por momento e prioridade. As listas dos blocos A e B, a seguir, servem de referência completa.',
  vazio: 'Ainda não há respostas suficientes para recomendar ações. Responda às perguntas das fases 1 a 4.',
  negrito: 'Em negrito: prioridade alta.',
  ir: 'Ir à pergunta',
  porque: 'Por quê:',
};

// Ações que não dependem de texto novo vêm de plano_dados.js (já traduzidas)
const recTxt = id => ((typeof RECS !== 'undefined' ? RECS : []).find(r => r.id === id) || {}).texto || '';

// Regras do caso. se(k): condição; campo: pergunta que originou a ação; vals(k): respostas a citar.
// quando, prioridade e texto podem ser funções de k.
const REGRAS_REC = [
  // 1.2 Prioridade e impacto
  { id: 'linha-base', campo: 'linhaBase', tipo: 'politica', quando: 'antes_teste', prioridade: 'alta', se: k => k.v('linhaBase') === 'nao',
    texto: 'Medir o problema antes do teste, por escola ou turma: sem linha de base, não há como saber se a IA ajudou.' },
  { id: 'linha-base-parcial', campo: 'linhaBase', tipo: 'politica', quando: 'antes_teste', prioridade: 'media', se: k => k.v('linhaBase') === 'parcial',
    texto: 'Completar a linha de base com dados medidos nas escolas do teste antes de começar.' },
  { id: 'alternativa', campo: 'alternativa', tipo: 'custo', quando: 'antes_contratar', prioridade: 'alta', se: k => k.v('alternativa') === 'nao',
    texto: 'Comparar ao menos uma alternativa sem IA, em custo e resultado esperado, antes de decidir a compra.' },
  // v13: regras que nascem das prioridades, dos problemas e dos detalhes do passo 1.2 (RQ-09, RQ-10, RQ-20)
  { id: 'formacao-plano', campo: k => k.formacaoDe.campo, vals: k => k.formacaoDe.vals, tipo: 'politica', quando: 'antes_teste', prioridade: 'alta', se: k => !!(k.sp && k.sp.formacao),
    texto: 'Montar um plano de formação antes do teste, com público, conteúdo, horas e responsáveis: os problemas marcados dependem de formar pessoas (camada 6).' },
  { id: 'sem-ferramenta', campo: 'problemas', vals: k => k.probs.map(q => q.t), tipo: 'custo', quando: 'antes_contratar', prioridade: 'alta', se: k => !!(k.sp && k.sp.semFerramenta),
    texto: 'Considerar resolver os problemas marcados com regras e processos antes de comprar uma ferramenta de IA: eles não dependem de uma tarefa feita pela IA.' },
  { id: 'metas-lacunas', campo: 'resultado', vals: () => ['Com lacunas a completar'], tipo: 'politica', quando: 'antes_teste', prioridade: 'alta', se: k => k.metasLacuna,
    texto: 'Completar as metas com os números da rede (valores atuais, metas e prazos) antes do teste: sem eles, não há critério de sucesso.' },
  { id: 'linha-base-medida', campo: 'linhaBase', tipo: 'politica', quando: 'antes_teste', prioridade: 'media', se: k => ['sim', 'parcial'].includes(k.v('linhaBase')) && !k.medidaBase,
    texto: 'Registrar qual medida serve de linha de base (instrumento, ano e turmas): sem ela, não há como comparar o resultado do teste.' },
  // 2.0 Prova de conceito e/ou piloto (recomendarTeste, guia cap. 14)
  { id: 'teste-recomendado', campo: 'testes', vals: k => k.testes, tipo: 'politica', quando: 'antes_teste', prioridade: 'alta', se: k => k.teste === 'recomendar',
    texto: k => k.rec.modo === 'poc' ? 'Começar por uma prova de conceito, como indicam as respostas, antes de envolver escolas e estudantes.'
      : k.rec.modo === 'ambos' ? 'Começar por uma prova de conceito e, se ela cumprir os critérios de sucesso, fazer um piloto em poucas escolas.'
      : 'Começar por um piloto em poucas escolas, com critérios de sucesso e de parada definidos antes.' },
  { id: 'teste-rever', campo: 'testes', vals: k => k.testes, tipo: 'politica', quando: 'antes_teste', prioridade: 'alta', se: k => k.teste === 'piloto' && ['poc', 'ambos'].includes(k.rec.modo),
    texto: 'Rever a escolha do piloto: pelas respostas, uma prova de conceito deveria vir antes.' },
  { id: 'teste-piloto-possivel', campo: 'testes', vals: k => k.testes, tipo: 'politica', quando: 'antes_teste', prioridade: 'media', se: k => k.teste === 'poc' && k.rec.modo === 'piloto',
    texto: 'As respostas já permitem um piloto: mantenha a prova de conceito só se houver uma dúvida técnica a resolver.' },
  { id: 'teste-ambos', campo: 'testes', vals: k => k.testes, tipo: 'politica', quando: 'antes_teste', prioridade: 'alta', se: k => k.teste === 'ambos' || (k.teste === 'recomendar' && k.rec.modo === 'ambos'),
    texto: 'Tratar prova de conceito e piloto como decisões separadas, com critérios de sucesso próprios: o piloto só começa se a prova de conceito cumprir os seus.' },
  { id: 'teste-ambos-contrato', campo: 'testes', vals: k => k.testes, tipo: 'custo', quando: 'antes_teste', prioridade: 'media', se: k => k.teste === 'ambos',
    texto: 'Acordar com o fornecedor que a prova de conceito não obriga a fazer o piloto nem a comprar, e o preço de cada etapa.' },
  // 2.3 Adoção: ferramentas
  { id: 'ferramentas-levantar', campo: k => k.v('conheceFerramentas') === 'nao' ? 'conheceFerramentas' : 'nFerramentas', tipo: 'custo', quando: 'antes_teste', prioridade: 'media',
    se: k => k.v('conheceFerramentas') === 'nao' || k.v('nFerramentas') === 'nao_sei',
    texto: 'Listar as ferramentas candidatas e as tarefas de cada uma antes do teste: o custo depende de quantas forem e de como são pagas.' },
  { id: 'ferramentas-interop', campo: k => k.ferr.length > 1 ? 'ferramentas' : 'nFerramentas', vals: k => k.ferr.length > 1 ? k.ferr.map(f => f.nome) : [k.v('nFerramentas')],
    tipo: 'politica', quando: 'antes_contratar', prioridade: 'alta', se: k => k.variasFerr,
    texto: 'Exigir interoperabilidade entre as ferramentas e aplicar uma só política de dados a todas elas: acesso, guarda, exclusão e proibição de treinar modelos.' },
  { id: 'ferramentas-sobrepostas', campo: k => k.ferr.length > 1 ? 'ferramentas' : 'nFerramentas', vals: k => k.ferr.length > 1 ? k.ferr.map(f => f.nome) : [k.v('nFerramentas')],
    tipo: 'custo', quando: 'antes_contratar', prioridade: k => k.sobrepostas ? 'alta' : 'media', se: k => k.variasFerr,
    texto: 'Verificar se as ferramentas cobrem as mesmas tarefas e evitar pagar licenças sobrepostas.' },
  { id: 'ferramentas-cotacao', campo: 'ferramentas', vals: k => k.semPreco.map(f => f.nome), tipo: 'custo', quando: 'antes_contratar', prioridade: 'alta', se: k => k.semPreco.length > 0,
    texto: 'Pedir cotação por escrito das ferramentas pagas sem preço informado: até lá, a estimativa usa um preço de exemplo.' },
  // 2.3 Adoção: tecnologia, pagamento, licença e adaptação da ferramenta principal
  { id: 'tecnologia', campo: 'tipoTec', tipo: 'custo', quando: 'antes_teste', prioridade: 'alta', se: k => k.v('tipoTec') === 'nao_sei',
    texto: 'Fazer uma consulta ao mercado e uma prova de conceito para escolher a tecnologia antes de qualquer piloto.' },
  { id: 'gratis-adiados', campo: k => k.v('pagamento') === 'gratuito' ? 'pagamento' : 'tipoTec', tipo: 'custo', quando: 'antes_teste', prioridade: 'alta', se: k => k.gratis,
    texto: 'Listar os custos que a gratuidade não cobre e apenas adia: formação, integração, proteção de dados e suporte (Krueger e Jackson, 2026, p. 7–8).' },
  { id: 'gratis-fim', campo: 'pagamento', tipo: 'custo', quando: 'antes_teste', prioridade: 'alta', se: k => k.v('pagamento') === 'gratuito',
    texto: 'Acordar por escrito o preço e as condições para quando o período gratuito terminar, antes de começar o teste.' },
  { id: 'gratis-ativos', campo: 'pagamento', tipo: 'politica', quando: 'antes_teste', prioridade: 'media', se: k => k.v('pagamento') === 'gratuito',
    texto: () => recTxt('r-ativos') || 'Acordar o destino dos dados e dos materiais se o fornecedor não for escolhido.' },
  { id: 'publica', campo: 'tipoTec', tipo: 'custo', quando: 'antes_contratar', prioridade: 'media', se: k => k.v('tipoTec') === 'publica',
    texto: 'Confirmar quem mantém a plataforma pública, por quanto tempo e o que fica a cargo da rede.' },
  { id: 'termos', campo: 'licenca', tipo: 'custo', quando: 'antes_contratar', prioridade: 'alta', se: k => k.v('licenca') === 'termos',
    texto: 'Termos de uso padrão não bastam: negocie um contrato em que termos online não alterem as condições materiais.' },
  { id: 'licenca-indefinida', campo: 'licenca', tipo: 'custo', quando: 'antes_contratar', prioridade: 'media', se: k => k.v('licenca') === 'nao_sei',
    texto: 'Definir o tipo de licença antes de contratar: quem pode usar, por quanto tempo e o que acontece com os dados.' },
  { id: 'lic-usuario', campo: 'pagamento', tipo: 'custo', quando: 'antes_contratar', prioridade: 'alta', se: k => k.v('pagamento') === 'usuario',
    texto: 'Comparar o custo por licença paga com o custo por pessoa que de fato usa: licenças não usadas são desperdício (Krueger e Jackson, 2026, p. 3).' },
  { id: 'lic-usuario-rever', campo: 'pagamento', tipo: 'custo', quando: 'manter', prioridade: 'media', se: k => k.v('pagamento') === 'usuario',
    texto: 'Rever a cada semestre as licenças sem uso e cancelar ou realocar as que sobram.' },
  { id: 'lic-institucional', campo: 'pagamento', tipo: 'custo', quando: 'manter', prioridade: 'media', se: k => k.v('pagamento') === 'institucional',
    texto: 'Acompanhar quantas pessoas usam de fato e renegociar o valor se a adoção ficar abaixo do previsto.' },
  { id: 'consumo-limites', campo: 'pagamento', tipo: 'custo', quando: 'antes_contratar', prioridade: 'alta', se: k => k.v('pagamento') === 'consumo',
    texto: 'Exigir no contrato limite de gasto, alertas e relatório mensal de consumo, visíveis antes da fatura.' },
  { id: 'consumo-monitorar', campo: 'pagamento', tipo: 'custo', quando: 'manter', prioridade: 'alta', se: k => k.v('pagamento') === 'consumo',
    texto: 'Monitorar o custo de uso todo mês: cada uso é cobrado e o valor cresce com a adoção (Krueger e Jackson, 2026, p. 6).' },
  { id: 'incluida', campo: 'pagamento', tipo: 'custo', quando: 'antes_contratar', prioridade: 'media', se: k => k.v('pagamento') === 'incluida',
    texto: 'Verificar se o preço da plataforma que a rede já paga muda com a IA e em que unidade passa a ser cobrado.' },
  { id: 'aberta-operacao', campo: 'tipoTec', tipo: 'custo', quando: 'antes_contratar', prioridade: 'media', se: k => k.v('tipoTec') === 'aberta',
    texto: 'Definir quem vai operar o modelo aberto: se um só integrador fizer tudo, a dependência apenas muda de lugar.' },
  { id: 'sob-medida', campo: 'adaptacao', tipo: 'custo', quando: 'antes_contratar', prioridade: 'alta', se: k => k.v('adaptacao') === 'sob_medida',
    texto: 'Garantir no contrato que código e configurações são da rede, com documentação e transferência de conhecimento à equipe.' },
  { id: 'integracao', campo: 'adaptacao', tipo: 'custo', quando: 'antes_contratar', prioridade: 'media', se: k => k.v('adaptacao') === 'integracao',
    texto: 'Exigir interoperabilidade com os sistemas da rede e exportação de dados e configurações em formato aberto.' },
  // 2.4 Infraestrutura e dispositivos (camada 3). Condições de base: Krueger e Jackson (2026, p. 7)
  { id: 'internet-parcial', campo: 'internet', vals: k => k.valsInternet, tipo: 'custo', quando: 'antes_teste', prioridade: 'alta', se: k => k.v('internet') === 'parcial',
    texto: 'Levantar as escolas sem internet adequada e orçar a conexão antes do teste: as condições de base costumam ser o primeiro custo (Krueger e Jackson, 2026, p. 7).' },
  { id: 'internet-nao', campo: 'internet', tipo: 'custo', quando: 'antes_teste', prioridade: 'alta', se: k => k.v('internet') === 'nao',
    texto: 'Orçar a conexão das escolas antes do teste ou escolher uma ferramenta que funcione sem internet (Krueger e Jackson, 2026, p. 7).' },
  { id: 'internet-teste', campo: 'internet', vals: k => k.valsInternet, tipo: 'politica', quando: 'antes_teste', prioridade: 'media', se: k => ['parcial', 'nao'].includes(k.v('internet')) && !k.poc,
    texto: 'Escolher as escolas do piloto incluindo algumas com internet fraca, para que o resultado valha também para elas.' },
  { id: 'disp-nao', campo: 'dispExistem', tipo: 'custo', quando: 'antes_teste', prioridade: 'alta', se: k => k.v('dispExistem') === 'nao' && k.v('modeloDisp') !== 'proprio',
    texto: 'Orçar a compra dos dispositivos e planejar a reposição ao longo dos anos de uso: dispositivos têm vida útil e precisam de manutenção.' },
  { id: 'disp-parcial', campo: 'dispExistem', tipo: 'custo', quando: 'antes_teste', prioridade: 'alta', se: k => k.v('dispExistem') === 'parcial' && k.v('modeloDisp') !== 'proprio',
    texto: 'Levantar quantos dispositivos faltam em cada escola e incluir a compra e a reposição no orçamento.' },
  { id: 'disp-proprio', campo: 'modeloDisp', tipo: 'politica', quando: 'antes_teste', prioridade: 'alta', se: k => k.v('modeloDisp') === 'proprio',
    texto: 'Garantir acesso a quem não tem dispositivo próprio: depender de soluções das famílias pode ampliar desigualdades (Krueger e Jackson, 2026, p. 12).' },
  { id: 'disp-compartilhado', campo: 'modeloDisp', tipo: 'politica', quando: 'antes_teste', prioridade: 'media', se: k => ['compartilhado', 'rotativo'].includes(k.v('modeloDisp')),
    texto: 'Organizar a agenda de uso dos dispositivos compartilhados e definir quem os mantém carregados, atualizados e com contas separadas.' },
  { id: 'disp-renovar', campo: 'dispExistem', tipo: 'custo', quando: 'manter', prioridade: 'media', se: k => ['nao', 'parcial'].includes(k.v('dispExistem')) && k.v('modeloDisp') !== 'proprio',
    texto: () => recTxt('s-renovacao') || 'Planejar a renovação de dispositivos e infraestrutura.' },
  // 2.5 Formação e capacidade das equipes (camada 6)
  { id: 'formacao-pagador', campo: 'formacaoPaga', tipo: 'custo', quando: 'antes_contratar', prioridade: 'alta', se: k => k.v('formacaoPaga') === 'indefinido',
    texto: 'Definir quem paga a formação antes de contratar: sem isso, ela costuma ficar fora do orçamento.' },
  { id: 'formacao-contrato', campo: 'formacaoPaga', tipo: 'custo', quando: 'antes_contratar', prioridade: 'alta', se: k => k.v('formacaoPaga') === 'fornecedor',
    texto: 'Incluir a formação no contrato, com horas por pessoa, conteúdo, público e formato definidos, e a formação de quem entrar depois.' },
  { id: 'formacao-parceiro', campo: 'formacaoPaga', tipo: 'custo', quando: 'antes_contratar', prioridade: 'media', se: k => k.v('formacaoPaga') === 'parceiro',
    texto: 'Formalizar com o parceiro o que a formação cobre e quem a mantém quando o apoio terminar.' },
  { id: 'formacao-papeis', campo: 'formados', tipo: 'politica', quando: 'antes_teste', prioridade: 'media',
    se: k => { const f = k.arr('formados'); return f.length > 0 && !f.includes('gestores') && !f.includes('tecnica'); },
    texto: 'Formar também as equipes técnicas e de gestão que vão governar e manter a IA, e não só quem a usa (Krueger e Jackson, 2026, p. 3 e p. 12).' },
  { id: 'formacao-dados', campo: 'formacaoTipo', tipo: 'politica', quando: 'antes_teste', prioridade: 'alta',
    se: k => k.dadosEst && k.arr('formacaoTipo').length > 0 && !k.arr('formacaoTipo').includes('dados_etica'),
    texto: 'Incluir proteção de dados e uso responsável na formação: o caso trata dados de estudantes.' },
  { id: 'formacao-horas', campo: 'formacaoHoras', vals: k => [k.valHoras], tipo: 'custo', quando: 'antes_contratar', prioridade: 'media', se: k => !!k.c.formacaoEstimativa && !!k.valHoras,
    texto: 'Confirmar as horas de formação por pessoa com quem vai oferecer a formação: a estimativa usa um valor ilustrativo.' },
  { id: 'formacao-continua', campo: 'formacaoTipo', tipo: 'politica', quando: 'manter', prioridade: 'media', se: k => k.arr('formacaoTipo').length > 0,
    texto: 'Planejar formação contínua, e não única: as ferramentas mudam e as equipes se renovam (Krueger e Jackson, 2026, p. 6).' },
  // 2.6 Operação e suporte (camada 7)
  { id: 'suporte-sla', campo: 'suporteQuem', tipo: 'custo', quando: 'antes_contratar', prioridade: 'alta', se: k => k.v('suporteQuem') === 'fornecedor',
    texto: 'Fixar no contrato os níveis de serviço do suporte: horário, canais, prazos de resposta e de solução, e o que acontece se não forem cumpridos.' },
  { id: 'suporte-divisao', campo: 'suporteQuem', tipo: 'custo', quando: 'antes_contratar', prioridade: 'media', se: k => k.v('suporteQuem') === 'ambos',
    texto: 'Dividir por escrito o que o suporte do fornecedor e o da rede atendem, com prazos de resposta para cada um.' },
  { id: 'suporte-dedicado', campo: 'suporteNivel', tipo: 'custo', quando: 'antes_contratar', prioridade: 'media', se: k => k.v('suporteNivel') === 'dedicado' && k.v('suporteQuem') !== 'fornecedor',
    texto: 'Reservar o tempo da equipe que fará o suporte dedicado: a estimativa conta essas pessoas como custo, mesmo que já sejam da rede.' },
  { id: 'acomp-intensivo', campo: 'acompanhamento', tipo: 'custo', quando: 'antes_teste', prioridade: 'media', se: k => k.v('acompanhamento') === 'intensivo',
    texto: 'Nomear quem faz o acompanhamento intensivo do uso e reservar o tempo dessa equipe no orçamento.' },
  { id: 'acomp-reforcar', campo: 'acompanhamento', tipo: 'politica', quando: 'antes_teste', prioridade: 'alta', se: k => k.v('acompanhamento') === 'leve' && (k.alto || k.consDecide.length > 0),
    texto: 'Reforçar o acompanhamento do uso: com risco elevado ou decisões sobre estudantes, acompanhamento leve não basta.' },
  // 2.1 e 2.2: dados de estudantes, decisões sobre estudantes, crianças
  { id: 'dados-acordo', campo: k => k.campoDados, vals: k => k.valsDados, tipo: 'politica', quando: k => k.poc ? 'antes_contratar' : 'antes_teste', prioridade: 'alta', se: k => k.dadosEst,
    texto: () => recTxt('r-acordo') || 'Assinar acordo de tratamento de dados que proíba usar os dados para treinar modelos.' },
  { id: 'dados-base-legal', campo: k => k.campoDados, vals: k => k.valsDados, tipo: 'politica', quando: k => k.poc ? 'antes_contratar' : 'antes_teste', prioridade: 'alta', se: k => k.dadosEst,
    texto: () => recTxt('r-baselegal') || 'Confirmar a base legal ou obter consentimento para usar os dados.' },
  { id: 'dados-impacto', campo: k => k.campoDados, vals: k => k.valsDados, tipo: 'politica', quando: 'antes_contratar', prioridade: 'alta', se: k => k.dadosEst,
    texto: () => recTxt('i-dpia') || 'Concluir a avaliação de impacto sobre a proteção de dados.' },
  { id: 'supervisao', campo: 'consequencias', vals: k => k.consDecide, tipo: 'politica', quando: 'antes_teste', prioridade: 'alta', se: k => k.consDecide.length > 0,
    texto: 'Definir a supervisão humana: quem revisa cada saída antes de uma decisão sobre estudantes, com autoridade para mudá-la.' },
  { id: 'contestacao', campo: 'consequencias', vals: k => k.consDecide, tipo: 'politica', quando: 'antes_teste', prioridade: 'alta', se: k => k.consDecide.length > 0,
    texto: () => recTxt('i-contestacao') || 'Criar um caminho para contestar saídas e corrigir erros, com prazo e autoridade para rever.' },
  { id: 'criancas', campo: 'afetados', vals: () => ['criancas'], tipo: 'politica', quando: 'antes_teste', se: k => (k.ce.afetados || []).includes('criancas'),
    prioridade: k => (k.ce.usuarios || []).includes('estudantes') || k.pesoMax > 0 ? 'alta' : 'media',
    texto: 'Aplicar as regras de proteção de crianças e adolescentes: uso adequado à idade e famílias informadas antes do teste.' },
  // 3.1 Primeira etapa da implantação: começar por todo o sistema
  { id: 'etapas', campo: 'implantacao', vals: k => [k.valImpl], tipo: 'custo', quando: 'antes_contratar', se: k => k.implTudo && k.eleg >= 5000,
    prioridade: k => k.eleg >= 50000 ? 'alta' : 'media',
    texto: 'Contratar por etapas: começar a implantação por um grupo de escolas, com critérios para avançar, em vez de todo o sistema de uma vez.' },
  { id: 'implantacao-criterios', campo: 'implantacao', vals: k => [k.valImpl], tipo: 'politica', quando: 'antes_contratar', prioridade: 'media', se: k => k.implP > 0 && !k.implTudo,
    texto: 'Definir antes da implantação os critérios para passar da primeira etapa à expansão: uso, resultado, custo por usuário e suporte.' },
  // 3.2 Arquitetura e integração
  { id: 'arquitetura-decidir', campo: 'arquitetura', tipo: 'custo', quando: 'antes_contratar', prioridade: 'media', se: k => k.v('arquitetura') === 'nao_sei',
    texto: 'Decidir a arquitetura antes de contratar a implantação: ela muda quem integra, opera e paga cada parte.' },
  { id: 'arquitetura-saas', campo: 'arquitetura', tipo: 'custo', quando: 'antes_contratar', prioridade: 'media', se: k => k.v('arquitetura') === 'saas',
    texto: 'Exigir aviso prévio de mudanças do produto e direito de exportar dados e configurações ao final do contrato.' },
  { id: 'arquitetura-api', campo: 'arquitetura', tipo: 'custo', quando: 'antes_contratar', prioridade: 'media', se: k => k.v('arquitetura') === 'api',
    texto: 'Definir quem integra e governa a aplicação: com o modelo por API, essa parte fica com a rede ou com um integrador contratado.' },
  { id: 'aberta-operacao', campo: 'arquitetura', tipo: 'custo', quando: 'antes_contratar', prioridade: 'media', se: k => k.v('arquitetura') === 'ow',
    texto: 'Definir quem vai operar o modelo aberto: se um só integrador fizer tudo, a dependência apenas muda de lugar.' },
  // 4.1 Expansão
  { id: 'expansao-rapida', campo: 'expansao', tipo: 'politica', quando: 'antes_contratar', prioridade: 'media', se: k => k.v('expansao') === 'ano1' && k.eleg >= 50000,
    texto: 'Vincular a expansão aos resultados da primeira etapa: chegar a todos em um ano deixa pouco tempo para corrigir problemas.' },
  { id: 'expansao-recorrente', campo: 'elegiveis', vals: k => [k.valEleg], tipo: 'custo', quando: 'manter', prioridade: 'media', se: k => k.eleg > 0,
    texto: 'Prever e monitorar a cada ano o custo recorrente da expansão: licenças, suporte e formação crescem com o número de usuários (Krueger e Jackson, 2026, p. 6).' },
];

// ----------------------------------------------------------- respostas
// Valor respondido de um campo ('' se não respondido). Campos com valor padrão só contam depois que a pessoa responde.
function recValor(id) {
  const f = (typeof CAMPO_POR_ID !== 'undefined' && CAMPO_POR_ID[id]) || null;
  const onde = f ? f.onde : 'caso';
  const v = onde === 'resp' ? (S.resp || {})[id] : onde === 'ctx' ? (S.ctx || {})[id] : (S.caso || {})[id];
  if (v == null || v === '' || (Array.isArray(v) && !v.length)) return '';
  if (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).some(k => v[k] !== '' && v[k] != null)) return '';
  if (f && f.padrao && typeof respondido === 'function' && !respondido(id)) return '';
  return v;
}
// v13: perguntas 1.2.1 e 1.2.2 (criadas no percurso pelo pacote B1); enquanto não estiverem em CAMPOS, estes dados bastam
const REC_CAMPO_V13 = {
  prioridades: { passo: '1b', n: '1.2.1', id: 'prioridades', onde: 'ctx', t: 'Qual é a prioridade da sua rede para a IA na educação?' },
  problemas: { passo: '1b', n: '1.2.2', id: 'problemas', onde: 'ctx', t: 'Quais problemas você quer resolver?' },
};
function recCampo(id) {
  const ach = x => (typeof CAMPO_POR_ID !== 'undefined' && CAMPO_POR_ID[x]) || (typeof CAMPOS !== 'undefined' ? CAMPOS.find(f => f.id === x) : null);
  return ach(id) || (id === 'testes' ? ach('teste') : null) || REC_CAMPO_V13[id] || null;
}
function recOpcoes(f, id) {
  if (!f) return (typeof OPC !== 'undefined' && id && OPC[id]) || [];
  if (typeof listaOpc === 'function') return listaOpc(f);
  return typeof f.opc === 'string' ? ((typeof OPC !== 'undefined' && OPC[f.opc]) || []) : (f.opc || []);
}
// Rótulo (PT) de cada valor da resposta
function recRotulos(id, vals) {
  const f = recCampo(id); let L = recOpcoes(f, id);
  if (!L.length && id === 'testes' && typeof OPC !== 'undefined') L = OPC.teste || [];
  const c = S.caso || {};
  return [].concat(vals == null ? [] : vals).map(v => {
    if (id === 'tarefas' && v === 'outra' && c.tarefaOutra) return c.tarefaOutra;
    const o = L.find(x => String(x[0]) === String(v));
    return o ? o[1] : String(v);
  }).filter(Boolean);
}
function recIr(f) {
  if (!f) return '';
  const fase = typeof fasePasso === 'function' ? fasePasso(f.passo) : '';
  return fase ? fase + ':' + f.passo + ':' + String(f.n).replace(/\./g, '-') : '';
}
function recPorque(id, vals) {
  const f = recCampo(id);
  if (!f) return { n: '', pergunta: '', resposta: '' };
  const pergunta = typeof textoCampo === 'function' ? textoCampo(f) : f.t;
  // resposta ainda sugerida (pré-marcada pela ferramenta e não confirmada pela pessoa)
  let sug = false;
  try { sug = typeof sugerido === 'function' && !!sugerido(f); } catch (e) { }
  return { n: f.n, pergunta, resposta: recRotulos(id, vals).join('; '), sugerido: sug };
}

// ----------------------------------------------------------- contexto das regras
const fmtR = x => (typeof fmtInt === 'function' ? fmtInt(x) : String(Math.round(+x || 0)));
// 2.0: lista de testes marcados (v11) → 'poc' | 'piloto' | 'ambos' | 'recomendar' | ''
function recTestes(c) {
  c = c || {};
  if (Array.isArray(c.testes) && c.testes.length) return c.testes.slice();
  return c.teste && c.teste !== 'ambos' ? [c.teste] : c.teste === 'ambos' ? ['poc', 'piloto'] : [];
}
function recTesteDe(c) {
  const T = recTestes(c);
  if (T.includes('recomendar')) return 'recomendar';
  if (T.includes('poc') && T.includes('piloto')) return 'ambos';
  return T[0] || '';
}
// ferramentas com nome (2.3.3), só quando a pessoa disse que já sabe quais são
const recPagaFerr = f => ['usuario', 'institucional', 'consumo'].includes(f.pagamento) || (f.tipoTec === 'paga' && !['gratuito', 'incluida'].includes(f.pagamento));
function recFerramentas(c) {
  return (Array.isArray(c.ferramentas) ? c.ferramentas : []).filter(f => f && String(f.nome || '').trim())
    .map(f => Object.assign({}, f, { nome: String(f.nome).trim() }));
}
function recContexto() {
  const c = S.caso || {};
  let ce = c;
  try { ce = casoAtual(); } catch (e) { console.warn(e); }
  let rec = { modo: 'piloto' };
  try { rec = recomendarTeste(ce) || rec; } catch (e) { }
  let p = null;
  try { p = typeof perfil === 'function' ? perfil() : null; } catch (e) { }
  const v = recValor;
  const arr = id => { const x = v(id); return Array.isArray(x) ? x : x ? [x] : []; };
  const testes = v('testes') ? recTestes(c) : (v('teste') ? recTestes({ teste: c.teste }) : []);
  const teste = testes.length ? recTesteDe({ testes }) : '';
  const modo = rec.modo === 'nenhum' ? 'nenhum' : (teste === 'poc' ? 'poc' : (teste === 'recomendar' || !teste) && rec.modo === 'poc' ? 'poc' : 'piloto');
  const peso = k => ((typeof OPC !== 'undefined' ? OPC.consequencias : []).find(x => x[0] === k) || [0, 0, 0])[2];
  const cons = ce.consequencias || [];
  const consDecide = cons.filter(k => peso(k) >= 2);
  const pesoMax = Math.max(0, ...cons.map(peso));
  // dados pessoais de estudantes: vêm das tarefas (2.1.1) ou de estudantes como usuários (2.2.1)
  const dadosEst = (ce.dados || []).some(d => d === 'pessoais_est' || d === 'sensiveis');
  const T = typeof tarefasDe === 'function' ? tarefasDe(c.tarefas) : [];
  const tDados = T.filter(t => (t.dados || []).some(d => d === 'pessoais_est' || d === 'sensiveis')).map(t => t.id);
  const usaEst = (ce.usuarios || []).includes('estudantes');
  const campoDados = tDados.length || !usaEst ? 'tarefas' : 'usuarios';
  const valsDados = campoDados === 'usuarios' ? ['estudantes'] : (tDados.length ? tDados : c.tarefas || []);
  const eleg = +v('elegiveis') || 0;
  // ferramentas
  const ferr = v('conheceFerramentas') === 'sim' ? recFerramentas(c) : [];
  // a primeira ferramenta é a principal: tecnologia e pagamento vêm das perguntas 2.3.4 e 2.3.5
  if (ferr[0]) { if (c.tipoTec) ferr[0].tipoTec = c.tipoTec; if (c.pagamento) ferr[0].pagamento = c.pagamento; }
  const variasFerr = ferr.length > 1 || ['2', '3mais'].includes(v('nFerramentas'));
  const vistas = {}; let sobrepostas = false;
  ferr.forEach(f => (f.tarefas || []).forEach(t => { if (vistas[t]) sobrepostas = true; vistas[t] = true; }));
  // preço por usuário por mês: só faz sentido para licença por usuário ou assinatura institucional
  const semPreco = ferr.filter(f => recPagaFerr(f) && f.pagamento !== 'consumo' && !(+f.preco > 0));
  // internet: com "Parcialmente", cita também quantas escolas já têm internet adequada
  const escI = +c.escolasInternet || 0;
  const valsInternet = [v('internet')].concat(v('internet') === 'parcial' && escI > 0 ? [tr('{0} escolas com internet adequada'.replace('{0}', fmtR(escI)))] : []).filter(Boolean);
  // horas de formação
  let h = +c.formacaoHoras || 0;
  if (c.formacaoEstimativa) { try { h = typeof horasFormacaoEstimada === 'function' ? horasFormacaoEstimada(ce) : h; } catch (e) { } }
  const valHoras = h ? tr((c.formacaoEstimativa ? '{0} horas por pessoa (estimativa)' : '{0} horas por pessoa').replace('{0}', fmtR(h))) : '';
  // primeira etapa da implantação (3.1)
  const im = c.implantacao || {};
  const implP = +im.pessoas || 0, implE = +im.escolas || 0;
  const valImpl = implE ? tr('{0} escolas e {1} pessoas'.replace('{0}', fmtR(implE)).replace('{1}', fmtR(implP))) : implP ? tr('{0} pessoas'.replace('{0}', fmtR(implP))) : '';
  const implTudo = implP > 0 && eleg > 0 && implP >= 0.8 * eleg;
  const valEleg = eleg ? tr('{0} pessoas'.replace('{0}', fmtR(eleg))) : '';
  // v13: prioridades e problemas do passo 1.2 (S.ctx.prioridades, S.ctx.problemas; leitura defensiva)
  const x = S.ctx || {};
  const probs = typeof problemasMarcados === 'function' ? problemasMarcados(x) : [];
  let sp = null;
  try { sp = typeof sugestoesProblemas === 'function' ? sugestoesProblemas(x) : null; } catch (e) { console.warn(e); }
  // formação: vem dos problemas marcados que a pedem ou de uma prioridade marcada que a pede
  const pForm = probs.filter(q => q.formacao);
  const prForm = typeof PRIORIDADES !== 'undefined' ? PRIORIDADES.filter(z => z.formacao && (x.prioridades || []).includes(z.id)) : [];
  const formacaoDe = pForm.length ? { campo: 'problemas', vals: pForm.map(q => q.t) } : { campo: 'prioridades', vals: prForm.map(z => z.nome) };
  const metasLacuna = typeof temLacuna === 'function' && temLacuna(c.resultado);
  const medidaBase = String(c.linhaBaseMedida || '').trim();
  return { c, ce, rec, v, arr, p, alto: !!(p && p.alto), testes, teste, poc: modo === 'poc',
    gratis: v('pagamento') === 'gratuito' || v('tipoTec') === 'publica',
    consDecide, pesoMax, dadosEst, campoDados, valsDados, eleg, ferr, variasFerr, sobrepostas, semPreco,
    valsInternet, valHoras, implP, implTudo, valImpl, valEleg, probs, sp, formacaoDe, metasLacuna, medidaBase };
}
const recF = (x, k) => (typeof x === 'function' ? x(k) : x);
const ORD_PRIO = { alta: 0, media: 1 };
const ordQuando = q => QUANDO_REC.findIndex(z => z[0] === q);

// Lista de recomendações do caso, sem duplicatas, por prioridade e depois por momento
function recomendacoesCaso() {
  if (typeof S === 'undefined' || !S || !S.caso) return [];
  const k = recContexto();
  const out = [], vistos = new Set();
  const add = r => {
    if (!r.texto || vistos.has(r.id) || vistos.has('t:' + r.texto)) return;
    vistos.add(r.id); vistos.add('t:' + r.texto); out.push(r);
  };
  // 1.3 Governança: cada resposta Não, Em parte ou Não sei vira uma ação (textos de ACOES_G)
  const gq = typeof QUESTOES_G !== 'undefined' ? QUESTOES_G : [];
  gq.forEach(q => {
    const resp = (S.resp || {})[q.id];
    if (!['nao', 'parcial', 'nao_sei'].includes(resp) || !(typeof ACOES_G !== 'undefined' && ACOES_G[q.id])) return;
    const alta = typeof PRIORIDADE_G !== 'undefined' && PRIORIDADE_G[q.id] === 'alta';
    const cedo = ['g-legislacao', 'g-dados'].includes(q.id) && k.dadosEst && !k.poc;
    // v13 (RQ-11): com "Em parte" e o "O que falta?" preenchido, a ação cita o que falta (texto já traduzido)
    const falta = resp === 'parcial' ? String((((S.respDet || {})[q.id]) || {}).falta || '').trim().replace(/\.$/, '') : '';
    add({ id: q.id, quando: cedo ? 'antes_teste' : 'antes_contratar', tipo: q.id === 'g-compras' ? 'custo' : 'politica', prioridade: alta ? 'alta' : 'media',
      texto: falta ? tr(ACOES_G[q.id]) + ' ' + tr('O que falta:') + ' ' + falta + '.' : ACOES_G[q.id], porque: recPorque(q.id, [resp]), ir: recIr(recCampo(q.id)) });
  });
  REGRAS_REC.forEach(r => {
    let ok = false;
    try { ok = !!r.se(k); } catch (e) { console.warn(e); }
    if (!ok) return;
    const campo = recF(r.campo, k);
    const vals = r.vals ? r.vals(k) : k.v(campo);
    add({ id: r.id, quando: recF(r.quando, k), tipo: r.tipo, prioridade: recF(r.prioridade, k), texto: recF(r.texto, k),
      porque: recPorque(campo, vals), ir: recIr(recCampo(campo)) });
  });
  return out.map((r, i) => [r, i])
    .sort((a, b) => (ORD_PRIO[a[0].prioridade] - ORD_PRIO[b[0].prioridade]) || (ordQuando(a[0].quando) - ordQuando(b[0].quando)) || (a[1] - b[1]))
    .map(z => z[0]);
}

// v15: pontuação auditável para recomendações (RF-018, RB-014)
// Score = peso da prioridade (alta=3, media=2) + risco (alto=2, medio=1) + impacto na decisão (alto=2, medio=1)
// Score máximo = 7. Usado para desempate e diversificação.
function scoreRec(r, k) {
  let s = 0;
  if (r.prioridade === 'alta') s += 3; else if (r.prioridade === 'media') s += 2;
  if (k.alto) s += 2; else if (k.pesoMax >= 1) s += 1;
  if (r.tipo === 'custo' && k.eleg > 0) s += 2; else if (r.tipo === 'custo') s += 1;
  return s;
}

// v15: diversificação das 5 primeiras recomendações (não mais de 1 por tipo e pacote)
// garante que as 5 primeiras cubram áreas diferentes (custo, política, governança, tecnologia, dados)
function diversificar(recs, k, n = 5) {
  const usadosTipo = new Set(); const usadosPacote = new Set(); const out = [];
  const restante = [];
  recs.forEach((r, i) => {
    const pacote = (r.id.split('-')[0] || r.id);
    const chaveTipo = r.tipo;
    if (out.length < n && !usadosTipo.has(chaveTipo) && !usadosPacote.has(pacote)) {
      out.push(r); usadosTipo.add(chaveTipo); usadosPacote.add(pacote);
    } else {
      restante.push(r);
    }
  });
  // preenche o restante com as recomendações sobrando, respeitando o score
  restante.forEach(r => { if (out.length < n) out.push(r); });
  return out;
}

// Lista de recomendações do caso, com pontuação e diversificação das 5 primeiras
function recomendacoesCasoDiversificadas(k) {
  if (!k) {
    try { k = recContexto(); } catch (e) { k = { alto: false, pesoMax: 0, eleg: 0 }; }
  }
  const base = recomendacoesCaso();
  // adiciona score a cada recomendação
  const comScore = base.map(r => ({ r, score: scoreRec(r, k) }));
  // ordena por score desc, depois por prioridade e momento
  comScore.sort((a, b) => b.score - a.score || (ORD_PRIO[a.r.prioridade] - ORD_PRIO[b.r.prioridade]) || 0);
  const ordenados = comScore.map(z => z.r);
  // diversifica as 5 primeiras
  return diversificar(ordenados, k, 5);
}

// ----------------------------------------------------------- textos traduzidos
const recTrPartes = s => String(s || '').split('; ').map(z => tr(z)).join('; ');
// "1.3.2 Pergunta? → Resposta" já traduzido
function recPorqueTexto(r) {
  const p = r.porque || {};
  return [p.n, tr(p.pergunta)].filter(Boolean).join(' ') + (p.resposta ? ' → ' + recTrPartes(p.resposta) : '') + (p.sugerido ? ' (' + tr('sugerido') + ')' : '');
}
function recContagem(recs) {
  const n = { custo: 0, politica: 0 };
  recs.forEach(r => { n[r.tipo] = (n[r.tipo] || 0) + 1; });
  return n;
}

// ----------------------------------------------------------- HTML (passo 4.3 e página do plano)
const CSS_RECS = `
.rc { display: grid; gap: 14px; }
.rc p { margin: 0; }
.rc .tag { font-size: .86rem; font-weight: 600; letter-spacing: 0; padding: 1px 8px; }
.rc-cont { display: flex; flex-wrap: wrap; gap: 6px 16px; align-items: center; font-size: .95rem; }
.rc-cont b { font-family: var(--f-ui); }
.rc-grupo { display: grid; gap: 8px; }
.rc-gt { display: flex; align-items: center; gap: 10px; margin: 4px 0 0; font-size: 1.05rem; color: var(--head); }
.rc-gt::before { content: ""; width: 14px; height: 14px; border-radius: 4px; background: var(--f1); flex: none; }
.rc-grupo[data-quando="antes_contratar"] .rc-gt::before { background: var(--f2); }
.rc-grupo[data-quando="manter"] .rc-gt::before { background: var(--f3); }
.rc-gt .rc-n { font: 600 .86rem var(--f-ui); color: var(--muted); }
.rc-lista { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.rc-item { display: grid; gap: 5px; padding: 10px 14px; border: 1px solid var(--line); border-left: 4px solid var(--f1s); border-radius: 8px; background: var(--surface); }
.rc-grupo[data-quando="antes_contratar"] .rc-item { border-left-color: var(--f2s); }
.rc-grupo[data-quando="manter"] .rc-item { border-left-color: var(--f3s); }
.rc-top { display: flex; flex-wrap: wrap; gap: 6px; }
.rc-txt { font-size: 1rem; line-height: 1.45; }
.rc-alta .rc-txt { font-weight: 600; }
.rc-pq { font-size: .9rem; line-height: 1.4; }
.rc-pq .qn-l { font-family: var(--f-ui); font-weight: 600; }
.rc-pe { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 16px; }
.rc-ir { font-size: .9rem; flex: none; }
.rc-fim { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
`;
function cssRecs() {
  try {
    if (typeof document === 'undefined' || document.getElementById('css-recs')) return;
    const st = document.createElement('style'); st.id = 'css-recs'; st.textContent = CSS_RECS;
    (document.head || document.documentElement).appendChild(st);
  } catch (e) { }
}
const escR = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
function htmlItemRec(r) {
  const p = r.porque || {};
  const alta = r.prioridade === 'alta';
  return `<li class="rc-item${alta ? ' rc-alta' : ''}" data-rec="${escR(r.id)}" data-tipo="${escR(r.tipo)}" data-prio="${escR(r.prioridade)}">
    <div class="rc-top"><span class="tag${alta ? ' gold' : ''}">${escR(tr('Prioridade'))}: ${escR(tr(PRIO_REC[r.prioridade] || r.prioridade))}</span> <span class="tag">${escR(tr(TIPO_REC[r.tipo] || r.tipo))}</span></div>
    <p class="rc-txt">${escR(tr(r.texto))}</p>
    <div class="rc-pe">${p.n ? `<p class="rc-pq muted"><span>${escR(tr(TXT_REC.porque))}</span> <span class="qn-l">${escR(p.n)}</span> <span>${escR(tr(p.pergunta))}</span> <span aria-hidden="true">→</span> <span>${escR(recTrPartes(p.resposta))}</span>${p.sugerido ? ` <span class="rc-sug">(${escR(tr('sugerido'))})</span>` : ''}</p>` : ''}
    ${r.ir ? `<button type="button" class="link rc-ir" data-ir="${escR(r.ir)}">${escR(tr(TXT_REC.ir))}</button>` : ''}</div>
  </li>`;
}
// Grupos por momento, contagem por tipo; sem botão (página do plano) ou com o botão do plano (passo 4.3)
function htmlRecs(recs, o = {}) {
  cssRecs();
  if (!recs.length) return `<div class="rc"><div class="vazio"><p>${escR(tr(TXT_REC.vazio))}</p></div>${o.botao ? htmlFimRecs() : ''}</div>`;
  const n = recContagem(recs);
  const cont = `<p class="rc-cont"><span><b>${n.custo}</b> <span>${escR(tr(TIPO_REC.custo))}</span></span><span><b>${n.politica}</b> <span>${escR(tr(TIPO_REC.politica))}</span></span></p>`;
  const grupos = QUANDO_REC.map(([q, nome]) => {
    const L = recs.filter(r => r.quando === q);
    if (!L.length) return '';
    return `<div class="rc-grupo" data-quando="${q}"><h4 class="rc-gt"><span>${escR(tr(nome))}</span> <span class="rc-n">${L.length}</span></h4>
      <ul class="rc-lista">${L.map(htmlItemRec).join('')}</ul></div>`;
  }).join('');
  return `<div class="rc">${o.intro ? `<p>${escR(tr(o.intro))}</p>` : ''}${cont}${grupos}${o.botao ? htmlFimRecs() : ''}</div>`;
}
function htmlFimRecs() {
  return `<div class="rc-fim"><button type="button" class="btn pri" data-act="gerar-plano">${escR(tr('Gerar plano de contratação'))}</button></div>`;
}
// Corpo do passo 4.3 "Recomendações para você" (chamado por fluxo.js)
function renderRecomendacoes() {
  let recs = [];
  try { recs = recomendacoesCaso(); } catch (e) { console.warn(e); }
  let nf = 0;
  try { nf = (faltasTodas() || []).length; } catch (e) { }
  const nota = nf && recs.length ? `<p class="note">${escR(tr(nf === 1 ? 'Falta 1 resposta: a lista pode mudar quando você responder.' : 'Faltam ' + nf + ' respostas: a lista pode mudar quando você responder.'))}</p>` : '';
  // o rodapé do passo 4.3 (fluxo.js) já traz "Gerar plano de contratação"; sem ele, o botão fica aqui
  const rodape = typeof PASSOS_VER !== 'undefined' && (PASSOS_VER.includes('4c') || PASSOS_VER.includes('3d'));
  return htmlRecs(recs, { intro: TXT_REC.intro, botao: !rodape }).replace('<div class="rc">', '<div class="rc" id="recs-caso">' + nota);
}

// ----------------------------------------------------------- seção do plano (página, PDF, Markdown e HTML)
// Tabela "Quando | Ação | Por quê" agrupada por momento; negrito = prioridade alta (PDF).
function secaoRecomendacoes(recs) {
  if (!recs) { try { recs = recomendacoesCaso(); } catch (e) { console.warn(e); recs = []; } }
  const rows = [], negrito = [];
  QUANDO_REC.forEach(([q, nome]) => recs.filter(r => r.quando === q).forEach(r => {
    if (r.prioridade === 'alta') negrito.push(rows.length);
    rows.push([tr(nome), tr(r.texto), recPorqueTexto(r)]);
  }));
  // só textos (sem códigos internos), para a tradução profunda e as exportações; a página refaz a lista (renderPlano)
  return { id: 'recs', h: TIT_REC, p: [recs.length ? TXT_REC.introPlano : TXT_REC.vazio],
    table: rows.length ? { head: ['Quando', 'Ação', 'Por quê'], rows, grupo: true, negrito, larg: [86, 0, 170] } : null,
    pos: rows.length ? [TXT_REC.negrito] : null };
}

if (typeof module !== 'undefined') module.exports = { QUANDO_REC, TIPO_REC, PRIO_REC, TIT_REC, TXT_REC, REGRAS_REC, recTestes, recTesteDe, recFerramentas, recPagaFerr, recomendacoesCaso, renderRecomendacoes, secaoRecomendacoes };
