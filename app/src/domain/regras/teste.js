// Pacote TESTE: desenho do teste e avaliação (lente "Decisão e evidência"). Formato: regras/index.js (typedef Regra).
// R2: regras atuais migradas (R-07, R-11, R-14). R4 (4a): R-09, R-10, R-12, R-13, R-15 a R-18 e os gatilhos novos de R-11 e
// R-14 (decisão 4: no piloto, comparação pareada como padrão e o sorteio entre escolas parecidas citado como melhor
// opção). R-19 fica em pessoas.js (pacote 4b); R-08 (conjunto de teste e aceite, com a ficha de aceite) entra aqui na
// integração do R4. Os números vêm de rec_numeros.js (k.d): efeito mínimo detectável do piloto, adoção,
// limiar, custo da avaliação; números ilustrativos só em `numero` e em `vars`, com o rótulo "ilustrativo, a confirmar"
// (decisão 8), nunca na frase da ação.
import { fmtInt } from '../framework.js';
import { tr } from '../i18n.js';
import { numero, varsRec, ILUSTRATIVO } from '../rec_numeros.js';
import { grande } from '../custos_ui.js';

const pos = x => (+x > 0 ? +x : 0);
const piloto = k => k.c.piloto || {};
const GRUPOS_IMPACTO = ['desigualdade', 'inclusao'];
const IMPACTOS_EFEITO = ['aprendizagem', 'permanencia', 'tempo_docente'];
const IMPACTOS_LIMIAR = ['aprendizagem', 'permanencia', 'desigualdade', 'tempo_docente', 'gestao'];
const IMPACTOS_PROVA = ['aprendizagem', 'desigualdade'];
const T_ESCOLAS = '{0} escolas', T_PARTICIPANTES = '{0} participantes', T_MESES = '{0} meses';
const T_MIN_SEMANA = '{0} minutos por semana por usuário ativo', T_MIN_SOLIC = '{0} minutos por solicitação';
const T_ROT_LIMIAR = 'Tempo que empata o custo', T_SEM_VALOR = 'sem valor orçado', T_POR_ANO = 'por ano';
/** o piloto como resposta citada na origem ("20 escolas, 600 participantes, 4 meses"); vazio sem dados */
function valPiloto(k) {
  const p = piloto(k), L = [];
  if (pos(p.escolas)) L.push(tr(T_ESCOLAS).replace('{0}', fmtInt(pos(p.escolas))));
  if (pos(p.participantes)) L.push(tr(T_PARTICIPANTES).replace('{0}', fmtInt(pos(p.participantes))));
  if (pos(p.meses)) L.push(tr(T_MESES).replace('{0}', fmtInt(pos(p.meses))));
  return L.join(', ');
}
const origemPiloto = k => { const v = valPiloto(k); return v ? { campo: 'piloto', vals: [v] } : { campo: 'testes', vals: k.testes }; };
const varsPiloto = k => ({ meses: pos(piloto(k).meses) ? fmtInt(pos(piloto(k).meses)) : '', escolasPiloto: pos(piloto(k).escolas) ? fmtInt(pos(piloto(k).escolas)) : '' });
// o piloto só mede viabilidade quando o efeito mínimo detectável passa do limite de rec_numeros.js (avaliabilidade)
const MEDE_VIABILIDADE = k => !!(k.d && k.d.aval && k.d.aval.medeViabilidade);
const PILOTO_EM_VEZ_DE_POC = k => k.teste === 'piloto' && ['poc', 'ambos'].includes(k.rec.modo);
const PILOTO_POSSIVEL = k => k.teste === 'poc' && k.rec.modo === 'piloto';

// ----------------------------------------------------------- R-08: conjunto de teste e critérios de aceite
// Variantes por classe da tarefa (catálogo 6.1): tutoria (B), dúvidas com base de normas (D), modelo por API sem dúvidas,
// geração (A) e a padrão. A previsão (C) não tem variante aqui: o aceite da previsão é a R-19 (pessoas.js), que absorve
// tec-aceite-previsao; sem nenhuma outra classe, a R-08 não dispara (evita dois cartões de aceite para a mesma coisa).
const CLASSES_SEM_08 = ['previsao', 'apoio'];
const tutoria08 = k => k.classes.includes('tutoria');
const duvidas08 = k => k.tarefas.includes('duvidas');
// o mesmo rótulo de ROTULO_ILUSTRATIVO (tec.js), repetido aqui para não criar import circular (tec.js lê esta ficha)
const ROT_ILUS_08 = 'ilustrativo, ajuste';
const FICHAS_08 = {
  tutoria: ['Critérios de aceite do tutor',
    ['Itens do banco de teste, do currículo da rede', '200 itens, por série e habilidade'],
    ['Itens em que o tutor orienta corretamente', 'pelo menos 90%'],
    ['Respostas que entregam a solução em vez de orientar', 'até 5%'],
    ['Tentativas de contornar os limites que dão certo', 'nenhuma grave']],
  duvidas: ['Critérios de aceite das respostas sobre normas',
    ['Pedidos históricos no conjunto de teste', '200 pedidos, com a norma correta de cada um'],
    ['Respostas que citam a norma vigente correta', 'pelo menos 90%'],
    ['Respostas que citam norma revogada', 'nenhuma'],
    ['Perguntas fora da base encaminhadas a uma pessoa', 'pelo menos 95%']],
  api: ['Critérios de aceite das respostas com a base da rede',
    ['Pedidos reais no conjunto de teste', '200 pedidos, com a fonte correta de cada um'],
    ['Respostas que citam a fonte certa da base', 'pelo menos 90%'],
    ['Perguntas fora da base encaminhadas a uma pessoa', 'pelo menos 95%']],
  geracao: ['Critérios de aceite dos materiais gerados',
    ['Pedidos reais de professores no conjunto de teste', '50 pedidos, por série e componente'],
    ['Nota média na rubrica, em revisão às cegas', 'pelo menos 4 de 5'],
    ['Materiais com erro de conteúdo grave', 'nenhum']],
  padrao: ['Critérios de aceite do conjunto de teste',
    ['Casos reais no conjunto de teste', '200 casos, com a resposta correta definida por especialistas'],
    ['Acertos no conjunto de teste', 'pelo menos 90%'],
    ['Erros graves', 'nenhum']],
};
const tipoFicha08 = k => (tutoria08(k) ? 'tutoria' : duvidas08(k) ? 'duvidas' : k.arqEf === 'api' ? 'api' : k.classes.includes('geracao') ? 'geracao' : 'padrao');
const ficha08 = k => {
  const [titulo, ...L] = FICHAS_08[tipoFicha08(k)];
  return { titulo, linhas: L.map(([criterio, valor]) => ({ criterio, valor, ilustrativo: true, rotulo: ROT_ILUS_08 })) };
};
const PRONTO_08 = 'O conjunto de casos, os critérios de aceite e a forma de registrar o resultado estão aprovados antes do início do teste.';

/** @type {import('./index.js').Regra[]} */
export const REGRAS_TESTE = [
  {
    // Pontuação (4.1): `irreversivel` porque o critério só protege se for fixado antes do teste (depois, ele é lido a favor de
    // continuar); `depende: ['R-54']` porque "cita a norma vigente" (D) só pode ser conferido com o inventário de normas e a
    // vigência de cada uma, que a R-54 cria (quando a R-54 não dispara, o `depende` não conta). A R-60 (demonstração no
    // edital) usa este mesmo conjunto e por isso depende desta regra.
    id: 'R-08', versao: 1, pacote: 'TESTE', tipo: 'politica', substitui: [], campos: ['testes', 'tarefas'],
    se: k => !!k.teste && k.classes.some(c => !CLASSES_SEM_08.includes(c)),
    origem: k => ({ campo: 'testes', vals: k.testes }),
    variantes: [
      { quando: tutoria08,
        oque: 'Montar um banco de itens do currículo da rede e fixar antes do teste os critérios de aceite do tutor, incluindo não entregar a resposta.',
        porque: 'Demonstrações do fornecedor não mostram o desempenho no currículo da rede, e sem critério fixado antes o resultado favorece continuar; custo previsto no plano: {k34}.',
        como: ['Montar o banco com itens reais do currículo da rede, por série e habilidade, com as respostas esperadas.',
          'Conferir se o tutor orienta sem entregar a resposta e se resiste às tentativas de contornar os limites.',
          'Fixar os critérios de aceite antes do teste e registrar o resultado de cada item.'] },
      { quando: duvidas08,
        oque: 'Testar com pedidos históricos da rede, fixando antes os critérios de aceite, se a resposta cita a norma vigente e encaminha o que não sabe.',
        porque: 'Uma resposta com norma revogada vira erro repetido em todas as escolas, e sem critério fixado antes o resultado favorece continuar; custo previsto no plano: {k34}.',
        como: ['Reunir pedidos já respondidos pela rede, com a norma correta de cada um, incluindo casos que o assistente não deve responder.',
          'Conferir se cada resposta cita a norma vigente e se encaminha a uma pessoa o que está fora da base.',
          'Fixar os critérios de aceite antes do teste e registrar o resultado de cada pedido.'] },
      { quando: k => k.arqEf === 'api',
        oque: 'Testar com pedidos da rede, fixando antes os critérios de aceite, se a resposta cita a fonte da base e encaminha o que não sabe.',
        porque: 'Demonstrações do fornecedor não mostram o desempenho com os documentos da rede, e sem critério fixado antes o resultado favorece continuar; custo previsto no plano: {k34}.',
        como: ['Reunir pedidos reais da rede, com a resposta e a fonte corretas, incluindo casos fora da base.',
          'Conferir se cada resposta cita a fonte certa e encaminha a uma pessoa o que não sabe.',
          'Fixar os critérios de aceite antes do teste e registrar o resultado de cada caso.'] },
      { quando: k => k.classes.includes('geracao'),
        oque: 'Montar um conjunto de pedidos reais da rede e fixar antes do teste uma rubrica de aceite dos materiais, com revisão às cegas.',
        porque: 'Demonstrações do fornecedor não mostram a qualidade no currículo da rede, e sem rubrica fixada antes o resultado favorece continuar; custo previsto no plano: {k34}.',
        como: ['Reunir pedidos reais de professores da rede, por série e componente, e gerar os materiais com a ferramenta.',
          'Pedir a especialistas da rede que pontuem os materiais pela rubrica, sem saber quais vieram da ferramenta.',
          'Fixar a nota mínima de aceite antes do teste e registrar o resultado de cada caso.'] },
      { oque: 'Montar um conjunto de casos reais da rede e fixar os critérios de aceite antes do teste.',
        porque: 'Demonstrações do fornecedor não mostram o desempenho no currículo da rede, e sem critério fixado antes o resultado favorece continuar; custo previsto no plano: {k34}.',
        como: ['Reunir casos reais da rede, com a resposta correta de cada um definida por especialistas.',
          'Fixar os critérios de aceite e os erros que reprovam antes de começar.',
          'Registrar o resultado de cada caso e juntá-lo ao relatório do teste.'] },
    ],
    vars: (k, d) => { const n = numero('sub:K3.4', d); return n.falta ? {} : { k34: n.valor }; },
    numero: (k, d) => numero('sub:K3.4', d),
    // ficha de aceite (decisão 8: números ilustrativos só aqui); fichaAceiteTec (tec.js) a junta às fichas técnicas
    ficha: ficha08,
    textosExtras: Object.values(FICHAS_08).flatMap(F => [F[0]].concat(F.slice(1).flat())).concat([ROT_ILUS_08]),
    paraque: 'O teste é julgado por critérios fixados antes, com casos da própria rede, e não pela demonstração do fornecedor.',
    quem: ['tecnologia', 'pedagogica'], marco: 'M1', pd: 4, curto: 'o conjunto de teste e os critérios de aceite',
    condicao: () => true, irreversivel: true, depende: ['R-54'],
    exige: ['CONTRATO.desempenho-aceite'],
    pronto: PRONTO_08,
  },
  {
    id: 'R-07', versao: 1, pacote: 'TESTE', tipo: 'politica',
    substitui: ['teste-recomendado', 'teste-rever', 'teste-ambos', 'teste-piloto-possivel', 'tecnologia'], campos: ['testes'],
    se: k => k.teste === 'recomendar' || k.teste === 'ambos' || PILOTO_EM_VEZ_DE_POC(k) || PILOTO_POSSIVEL(k),
    origem: k => ({ campo: 'testes', vals: k.testes }),
    variantes: [
      { quando: PILOTO_EM_VEZ_DE_POC,
        oque: 'Fazer a prova de conceito antes do piloto, sem estudantes e com critérios de sucesso fixados antes; o piloto é outra decisão.',
        porque: 'Pelas respostas, uma prova de conceito deveria vir antes; começar pelo piloto expõe os participantes a algo ainda não testado.',
        como: ['Definir o que a prova de conceito precisa demonstrar e com quais dados de teste.', 'Fixar os critérios de sucesso antes de começar.', 'Decidir o piloto só com o relatório da prova de conceito.'] },
      { quando: k => k.teste === 'recomendar' && k.rec.modo === 'poc',
        oque: 'Começar por uma prova de conceito, como indicam as respostas, antes de envolver escolas e estudantes.',
        porque: 'As respostas indicam dúvidas que uma prova de conceito resolve com menos custo e sem expor pessoas.',
        como: ['Definir o que a prova de conceito precisa demonstrar e com quais dados de teste.', 'Fixar os critérios de sucesso antes de começar.'] },
      { quando: k => k.teste === 'ambos',
        oque: 'Tratar a prova de conceito e o piloto como decisões separadas, cada uma com critérios de sucesso próprios.',
        porque: 'O piloto só deve começar se a prova de conceito cumprir os seus critérios; juntar as duas decisões aprova o piloto antes da hora.',
        como: ['Fixar os critérios de sucesso de cada etapa antes de começar.', 'Registrar em ata a decisão de passar ao piloto.'] },
      { quando: k => k.teste === 'recomendar' && k.rec.modo === 'ambos',
        oque: 'Começar por uma prova de conceito e, se ela cumprir os critérios de sucesso, fazer um piloto em poucas escolas.',
        porque: 'As respostas indicam dúvidas técnicas e uso por pessoas reais; cada etapa responde a uma dessas perguntas.',
        como: ['Tratar a prova de conceito e o piloto como decisões separadas, cada uma com critérios de sucesso próprios.', 'Registrar em ata a decisão de passar ao piloto.'] },
      { quando: k => k.teste === 'recomendar',
        oque: 'Começar por um piloto em poucas escolas, com critérios de sucesso e de parada definidos antes.',
        porque: 'As respostas já permitem testar o uso com pessoas reais; os critérios fixados antes impedem que o piloto vire implantação por inércia.',
        como: ['Escolher poucas escolas e um prazo limitado para o piloto.', 'Fixar os critérios de sucesso e de parada antes de começar.'] },
      { oque: 'Manter a prova de conceito só se houver uma dúvida técnica a resolver.',
        porque: 'As respostas já permitem um piloto; uma prova de conceito sem dúvida técnica atrasa a decisão sem trazer informação nova.',
        como: ['Escrever a dúvida técnica que a prova de conceito resolve.', 'Sem dúvida técnica, passar direto ao piloto com critérios de sucesso.'] },
    ],
    // tecnologia ainda não escolhida: a consulta ao mercado entra como passo (a regra própria é a R-55)
    passos: k => (k.v('tipoTec') === 'nao_sei' ? ['Fazer uma consulta ao mercado para conhecer as opções antes da prova de conceito.'] : []),
    textosExtras: ['Fazer uma consulta ao mercado para conhecer as opções antes da prova de conceito.'],
    paraque: 'Cada etapa do teste responde à sua pergunta antes da próxima decisão.',
    quem: ['gabinete', 'tecnologia', 'pedagogica'], marco: 'M1', pd: 4,
    condicao: k => !PILOTO_POSSIVEL(k) && !(k.teste === 'recomendar' && k.rec.modo === 'piloto'),
    pronto: 'Modalidade do teste e critérios de sucesso aprovados e registrados antes do início.',
  },
  {
    id: 'R-11', versao: 2, pacote: 'TESTE', tipo: 'politica', substitui: ['linha-base', 'linha-base-parcial', 'linha-base-medida'], campos: ['linhaBase'],
    se: k => k.v('linhaBase') === 'nao' || k.v('linhaBase') === 'parcial' || (k.v('linhaBase') === 'sim' && !k.medidaBase),
    variantes: [
      { quando: k => k.v('linhaBase') === 'nao',
        oque: 'Medir o problema antes do teste, por escola ou turma.',
        porque: 'Sem linha de base, não há como saber se a IA ajudou, e o sucesso tende a ser redefinido depois.',
        como: ['Escolher a medida do problema e o instrumento.', 'Medir antes de começar, nas escolas do teste e nas de comparação.', 'Registrar a medida, o ano e as turmas.'] },
      { quando: k => k.v('linhaBase') === 'parcial',
        oque: 'Completar a linha de base com dados medidos nas escolas do teste e nas de comparação antes de começar.',
        porque: 'Uma linha de base parcial ou estimada não separa o efeito da ferramenta das diferenças entre escolas.',
        como: ['Identificar o que falta medir e em quais escolas, as do teste e as de comparação.', 'Medir antes do início do teste, com o mesmo instrumento.'] },
      { oque: 'Registrar qual medida serve de linha de base, com instrumento, ano e turmas.',
        porque: 'Sem a medida registrada, não há como comparar o resultado do teste com o ponto de partida.',
        como: ['Indicar o instrumento, o ano e as turmas da medida.', 'Juntar o registro ao plano do teste.'] },
    ],
    passos: k => (k.v('linhaBase') === 'parcial' && !k.medidaBase ? ['Registrar qual medida serve de linha de base, com instrumento, ano e turmas.'] : []),
    paraque: 'O resultado do teste pode ser comparado com o ponto de partida.',
    quem: ['avaliacao'], marco: 'M1', pd: 1,
    condicao: k => k.v('linhaBase') === 'nao',
    pronto: 'A medida de partida está registrada por escola ou turma antes do início do teste.',
  },
  {
    id: 'R-09', versao: 1, pacote: 'TESTE', tipo: 'politica', substitui: [], campos: ['testes'],
    se: k => !!k.teste,
    origem: k => ({ campo: 'testes', vals: k.testes }),
    variantes: [{
      oque: 'Fixar antes do teste os critérios para parar e o que acontece com as pessoas e os dados se ele parar.',
      porque: 'Sem critério de parada, o teste vira implantação por inércia, e quem já usa a ferramenta fica sem saída combinada.',
      como: ['Fixar dois ou três limites que obrigam a parar: incidente grave, uso abaixo do mínimo, resultado pior que a comparação.', 'Escrever o plano de encerramento: o que acontece com os usuários, com os dados e com os acessos.', 'Registrar quem decide parar e em quanto tempo.'],
    }],
    paraque: 'O teste pode ser encerrado sem prejuízo para quem participa, em vez de continuar por inércia.',
    quem: ['gabinete', 'pedagogica'], marco: 'M1', pd: 4, curto: 'os critérios para parar o teste',
    condicao: k => !!k.alto || k.consDecide.length > 0,
    pronto: 'Os critérios de parada e o plano de encerramento estão aprovados e juntados ao plano do teste.',
  },
  {
    id: 'R-10', versao: 1, pacote: 'TESTE', tipo: 'politica', substitui: [], campos: ['piloto', 'testes'],
    se: k => k.temPiloto,
    origem: origemPiloto,
    variantes: [
      { quando: k => pos(piloto(k).meses) > 0,
        oque: 'Marcar o piloto no calendário escolar, começando no início de um período letivo e evitando semanas de avaliação externa.',
        porque: 'Um piloto de {meses} meses que coincide com semanas de prova mede o calendário, e não a ferramenta.',
        como: ['Levantar o calendário das escolas do piloto, com provas externas, recessos e semanas de avaliação.', 'Escolher a data de início para que o piloto fique inteiro dentro de períodos letivos regulares.'] },
      { oque: 'Marcar o piloto no calendário escolar, começando no início de um período letivo e evitando semanas de avaliação externa.',
        porque: 'Um piloto que coincide com semanas de prova mede o calendário, e não a ferramenta.',
        como: ['Levantar o calendário das escolas do piloto, com provas externas, recessos e semanas de avaliação.', 'Escolher a data de início para que o piloto fique inteiro dentro de períodos letivos regulares.'] },
    ],
    vars: k => varsPiloto(k),
    textosExtras: [T_MESES],
    paraque: 'O resultado do piloto reflete o uso da ferramenta, e não o calendário da rede.',
    quem: ['pedagogica'], marco: 'M1', pd: 4,
    pronto: 'A data de início e de fim do piloto está no calendário das escolas, fora das semanas de avaliação externa.',
  },
  {
    id: 'R-12', versao: 1, pacote: 'TESTE', tipo: 'politica', substitui: [], campos: ['linhaBase', 'piloto'],
    se: k => k.temPiloto && ['sim', 'parcial'].includes(k.v('linhaBase')) && pos(piloto(k).meses) > 0 && pos(piloto(k).meses) < 12,
    origem: k => ({ campo: 'linhaBase', vals: [k.v('linhaBase')] }),
    variantes: [
      { quando: k => k.impactos.some(z => IMPACTOS_PROVA.includes(z)),
        oque: 'Medir com a mesma prova curta no início e no fim, nas escolas do piloto e nas de comparação, cobrindo as séries atendidas.',
        porque: 'Uma avaliação anual chega depois da decisão de um piloto de {meses} meses; sem medir no início e no fim, o piloto não mostra mudança.',
        como: ['Montar uma prova curta, com itens alinhados à avaliação da rede, para todas as séries atendidas.', 'Aplicar na primeira e na última semana do piloto, nas escolas do piloto e nas de comparação.', 'Registrar quem aplicou e quantos faltaram.'] },
      { oque: 'Medir o resultado com o mesmo instrumento no início e no fim do piloto, nas escolas do piloto e nas de comparação.',
        porque: 'Um piloto de {meses} meses não alcança a medida anual da rede; sem medir no início e no fim, ele não mostra mudança.',
        como: ['Escolher uma medida que o piloto consiga alterar no prazo, com o mesmo instrumento nas duas pontas.', 'Medir nas escolas do piloto e nas de comparação, nas mesmas datas.', 'Registrar quem mediu e o que ficou de fora.'] },
    ],
    vars: k => varsPiloto(k),
    paraque: 'O resultado do piloto chega a tempo da decisão e cobre quem foi atendido.',
    quem: ['avaliacao'], marco: 'M1', pd: 4, curto: 'a medida no início e no fim do piloto',
    condicao: k => k.impactos.includes('aprendizagem'),
    pronto: 'A medida do início e do fim, as datas e as séries cobertas estão definidas, iguais para as escolas do piloto e as de comparação.',
  },
  {
    id: 'R-13', versao: 1, pacote: 'TESTE', tipo: 'politica', substitui: [], campos: ['piloto', 'impactos'],
    se: k => k.temPiloto && k.impactos.some(z => IMPACTOS_EFEITO.includes(z)),
    origem: origemPiloto,
    variantes: [
      { quando: k => k.tarefas.includes('duvidas'),
        oque: 'Sortear quais solicitações o assistente responde e comparar com as que seguem o fluxo atual, medindo prazo, retrabalho e acerto.',
        porque: 'O volume de solicitações é alto, e sortear as respondidas pelo assistente separa o efeito da ferramenta da tendência da rede; escolas no piloto: {escolasPiloto}.',
        como: ['Alternar a resposta pelo último dígito do protocolo, com registro do sorteio.', 'Auditar uma amostra da correção normativa nos dois grupos.', 'Comparar prazo e retrabalho com o registro que a rede já tem.'] },
      { quando: MEDE_VIABILIDADE,
        oque: 'Definir as escolas de comparação, pareadas às do piloto, e declarar que o piloto mede viabilidade, e não efeito, se o tamanho não aumentar.',
        porque: 'Com efeito mínimo detectável de {mdesPiloto}, o piloto só vê efeitos grandes, e os efeitos típicos são menores; o teste tende a mostrar sem efeito.',
        como: ['Declarar no plano que o piloto mede viabilidade (uso, custo e suporte), e não o efeito, ou aumentar o número de escolas.', 'Se a rede não puder aumentar o piloto, passar a pergunta de efeito para a primeira etapa da implantação.', 'Definir as escolas de comparação, pareadas por resultado, internet e porte.'] },
      { oque: 'Definir escolas de comparação pareadas às do piloto e o tamanho do teste, preferindo sortear entre escolas parecidas quando for possível.',
        porque: 'Sem escolas de comparação, uma melhora pode vir da tendência da rede ou de escolas escolhidas por estarem mais preparadas, e não da IA; efeito mínimo detectável do piloto: {mdesPiloto}.',
        como: ['Listar as escolas elegíveis que aceitam participar e agrupá-las por resultado na linha de base, internet e porte.', 'Parear cada escola do piloto com uma parecida que não receberá a ferramenta; se a rede aceitar, sortear em ato registrado dentro de cada par.', 'Medir os dois grupos com o mesmo instrumento e nas mesmas datas.'] },
    ],
    vars: (k, d) => Object.assign(varsPiloto(k), d ? varsDe(d, ['mdesPiloto']) : {}),
    numero: (k, d) => numero('mdesPiloto', d),
    textosExtras: [T_ESCOLAS, T_PARTICIPANTES, T_MESES],
    paraque: 'O resultado do piloto pode ser atribuído à ferramenta, e não à tendência da rede.',
    quem: ['avaliacao', 'pedagogica'], marco: 'M1', pd: 4, curto: 'as escolas de comparação e o tamanho do teste',
    condicao: () => true, irreversivel: true,
    pronto: 'As escolas de comparação, o método de pareamento ou sorteio e o tamanho do teste estão definidos antes do início.',
  },
  {
    id: 'R-14', versao: 2, pacote: 'TESTE', tipo: 'politica', substitui: ['internet-teste'], campos: ['internet', 'testes'],
    se: k => k.temPiloto,
    origem: origemPiloto,
    variantes: [
      { quando: k => ['parcial', 'nao'].includes(k.v('internet')),
        origem: k => ({ campo: 'internet', vals: k.valsInternet }),
        oque: 'Escolher as escolas do piloto incluindo algumas com internet fraca, para que o resultado valha também para elas.',
        porque: 'Escolas mais bem conectadas inflam o resultado do piloto, que depois não se repete nas escolas com internet fraca.',
        como: ['Comparar o perfil das escolas do piloto com o da rede.', 'Incluir escolas com conexão parcial ou ruim.', 'Publicar o perfil do piloto e o da rede lado a lado.'] },
      { oque: 'Escolher as escolas do piloto para representar a rede, incluindo as de pior resultado, e publicar o perfil do piloto e o da rede.',
        porque: 'Escolas mais preparadas inflam o resultado do piloto, que depois não se repete nas demais escolas da rede.',
        como: ['Comparar o perfil das escolas candidatas com o da rede: resultado, zona rural ou urbana, conexão e porte.', 'Escolher as escolas do piloto por sorteio dentro de grupos de perfil parecido, e não por voluntariado.', 'Publicar a tabela com o perfil do piloto e o da rede.'] },
    ],
    paraque: 'O resultado do piloto vale para a rede como ela é.',
    quem: ['avaliacao', 'gabinete'], marco: 'M1', pd: 4, curto: 'a escolha de escolas que represente a rede',
    condicao: k => k.impactos.some(z => GRUPOS_IMPACTO.includes(z)), grupos: true,
    pronto: 'A lista de escolas do piloto inclui escolas de pior resultado e com pouca conexão, e o perfil do piloto e o da rede estão publicados.',
  },
  {
    id: 'R-15', versao: 1, pacote: 'TESTE', tipo: 'politica', substitui: [], campos: ['piloto', 'implantacao'],
    se: k => k.temPiloto || k.implP > 0 || pos((k.c.implantacao || {}).escolas) > 0,
    origem: k => (k.temPiloto ? origemPiloto(k) : { campo: 'implantacao', vals: k.valImpl ? [k.valImpl] : [] }),
    variantes: [{
      oque: 'Definir o que conta como uso de fato e medi-lo todo mês, por escola e grupo de usuários, registrando a dose.',
      porque: 'Abaixo da adoção que a estimativa supõe ({adocao}), o custo por usuário ativo sobe sem que ninguém perceba.',
      como: ['Combinar com o fornecedor registros de uso por pessoa, com mês e escola, exportáveis para a rede.', 'Registrar quanto cada pessoa usou (a dose) e acompanhar a adoção de cada mês contra a meta.', 'Estimar o efeito entre quem usa a partir da comparação, e não entre quem usou muito e quem usou pouco.'],
    }],
    vars: (k, d) => (d ? varsDe(d, ['adocao']) : {}),
    numero: (k, d) => numero('adocao', d),
    textosExtras: [T_ESCOLAS, T_PARTICIPANTES, T_MESES],
    paraque: 'A rede sabe quanto a ferramenta é usada de fato e o custo por usuário ativo deixa de ser uma surpresa.',
    quem: ['pedagogica', 'avaliacao', 'tecnologia'], marco: 'M1', pd: 4,
    alta: () => true,
    exige: ['CONTRATO.dados-registros', 'CONTRATO.desempenho-metrica'],
    pronto: 'A definição de uso de fato, a medida mensal por escola e os registros exportáveis estão combinados e no plano do teste.',
  },
  {
    id: 'R-16', versao: 1, pacote: 'TESTE', tipo: 'politica', substitui: [], campos: ['impactos'],
    se: k => k.impactos.some(z => ['tempo_docente', 'gestao'].includes(z)),
    origem: k => ({ campo: 'impactos', vals: k.impactos }),
    variantes: [
      { quando: k => k.usuarios.includes('professores'),
        oque: 'Medir o tempo com registro, antes e no terceiro mês, e combinar com as escolas e os professores para onde vai o tempo liberado.',
        porque: 'O resultado só acontece se o tempo liberado virar acompanhamento; ponto de empate do custo: {limiarTempo}.',
        como: ['Registrar o tempo gasto por duas semanas antes do teste e de novo no terceiro mês, nos dois grupos.', 'Combinar com as escolas e com a representação dos professores para onde vai o tempo liberado.', 'Classificar o ganho como capacidade liberada ou economia real.'] },
      { oque: 'Medir o tempo por tarefa com registro, antes e no terceiro mês, e combinar com a gestão o destino do tempo liberado.',
        porque: 'O ganho só aparece se o tempo liberado tiver destino combinado; ponto de empate do custo: {limiarTempo}.',
        como: ['Registrar o tempo gasto por duas semanas antes do teste e de novo no terceiro mês.', 'Combinar com a gestão e com a representação dos servidores para onde vai o tempo liberado.', 'Classificar o ganho como capacidade liberada ou economia real.'] },
    ],
    vars: (k, d) => { const t = limiarTempo(d); return t ? { limiarTempo: t } : {}; },
    numero: (k, d) => { const t = limiarTempo(d); return t ? { id: 'limiarTempo', rotulo: tr(T_ROT_LIMIAR), valor: t, bruto: d.limiar.valor, fonte: 'Como testar e avaliar', ilustrativo: true, falta: false } : numero('limiar', d); },
    textosExtras: [T_MIN_SEMANA, T_MIN_SOLIC, T_ROT_LIMIAR, ILUSTRATIVO],
    paraque: 'O tempo liberado vira acompanhamento ou economia que a rede consegue medir.',
    quem: ['avaliacao', 'pessoas'], marco: 'M1', pd: 4,
    alta: k => k.impactos.includes('tempo_docente'),
    pronto: 'O registro de tempo nos dois momentos e o combinado sobre o destino do tempo liberado estão aprovados.',
  },
  {
    id: 'R-17', versao: 1, pacote: 'TESTE', tipo: 'politica', substitui: [], campos: ['impactos'],
    se: k => k.impactos.some(z => IMPACTOS_LIMIAR.includes(z)),
    origem: k => ({ campo: 'impactos', vals: k.impactos }),
    variantes: [{
      oque: 'Calcular o efeito mínimo que faz a IA valer o custo, comparado à alternativa, contando os recursos que a rede já tem.',
      porque: 'A decisão de compra depende de custo dividido por efeito, e o plano ainda não estima o efeito; custo anual em regime: {regime}.',
      como: ['Calcular o custo em regime por usuário ativo e, com o custo e o efeito da alternativa sem IA, o efeito de empate.', 'Somar ao custo os recursos que a rede já tem e vai usar: dispositivos existentes e horas de professores e de coordenação.', 'Registrar o limiar no processo de compra.'],
    }],
    vars: (k, d) => (d ? varsDe(d, ['regime']) : {}),
    numero: (k, d) => { const n = numero('regime', d); return Object.assign(n, { id: 'regimeAnual' }); },
    paraque: 'A compra se justifica pelo que a IA entrega por real gasto, e não só pelo uso.',
    quem: ['orcamento', 'avaliacao'], marco: 'M3', pd: 5,
    pronto: 'O efeito mínimo que justifica o custo está calculado e registrado no processo de compra.',
  },
  {
    id: 'R-18', versao: 1, pacote: 'TESTE', tipo: 'politica', substitui: [], campos: ['testes'],
    se: k => k.temPiloto,
    origem: k => ({ campo: 'testes', vals: k.testes }),
    variantes: [{
      oque: 'Registrar o plano de avaliação antes de começar, com avaliador que não seja o fornecedor, e publicar o resultado, qualquer que seja.',
      porque: 'Fixar o plano antes impede escolher depois a medida que deu certo; valor orçado para avaliação com comparador: {avaliacao}.',
      como: ['Escrever em duas páginas a pergunta, a medida, a comparação, o tamanho, a análise e a regra de decisão, e registrá-las antes do início.', 'Usar o valor já orçado para contratar um avaliador que não seja o fornecedor, com acesso aos registros de uso.', 'Combinar a publicação do resultado, qualquer que seja.'],
    }],
    vars: (k, d) => {
      const n = numeroAvaliacao(d);
      return { avaliacao: n ? n.valor : tr(T_SEM_VALOR) };
    },
    numero: (k, d) => numeroAvaliacao(d),
    textosExtras: [T_SEM_VALOR, T_POR_ANO],
    paraque: 'O resultado do teste é lido contra critérios fixados antes, por quem não vende a ferramenta.',
    quem: ['avaliacao', 'compras'], marco: 'M1', pd: 4,
    exige: ['CONTRATO.verificacao-auditoria'],
    pronto: 'O plano de avaliação está registrado antes do início e o avaliador independente está definido.',
  },
];

// ----------------------------------------------------------- números (k.d) para vars e numero
// varsRec sempre com a lista de chaves: sem ela a simulação de custo rodaria a cada resposta
function varsDe(d, chaves) { return varsRec(d, chaves); }
/** limiar de "vale o que custa" para tempo (min por semana por usuário ativo) ou solicitações (min por solicitação); '' sem valor */
function limiarTempo(d) {
  const L = d && d.limiar && d.limiar.completo ? d.limiar : null;
  if (!L || !L.valor) return '';
  const v = L.valor;
  let t = '';
  if (L.tipo === 'tempo' && v.minSemana > 0) t = tr(T_MIN_SEMANA).replace('{0}', fmtInt(Math.round(v.minSemana)));
  else if (L.tipo === 'solicitacoes' && v.min > 0) t = tr(T_MIN_SOLIC).replace('{0}', fmtInt(Math.round(v.min)));
  return t ? t + ' (' + tr(ILUSTRATIVO) + ')' : '';
}
/**
 * Custo da linha K5.5 "Avaliação de impacto com comparador" (só risco elevado; em risco menor a K5.5 é a avaliação externa
 * da expansão, que não é esta): { id, rotulo, valor ("US$ 60 mil por ano"), bruto { total, porAno, ano0 }, fonte }; null sem a linha.
 */
function numeroAvaliacao(d) {
  const L = d && d.av && Array.isArray(d.av.linhas) ? d.av.linhas.filter(l => l.s === 'K5.5' && /comparador/i.test(String(l.nome))) : [];
  if (!L.length) return null;
  const T = d.av.r.anos.filter(t => t > 0);
  const porAno = Math.max(0, ...T.map(t => L.reduce((a, l) => a + (l.eco[t] || 0), 0)));
  if (!(porAno > 0)) return null;
  const total = L.reduce((a, l) => a + l.ecoVP, 0), ano0 = L.reduce((a, l) => a + (l.eco[0] || 0), 0);
  return { id: 'sub:K5.5', rotulo: tr(L[0].nome), valor: grande(porAno) + ' ' + tr(T_POR_ANO), bruto: { total, porAno, ano0 }, fonte: 'Quanto custa', ilustrativo: false, falta: false };
}
