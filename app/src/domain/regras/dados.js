// Pacote DADOS: dados pessoais, residência e dispositivos (lente "Pessoas e uso"). Formato: regras/index.js.
// R2: R-26 reúne as quatro regras de dados de estudantes (com o texto da base legal corrigido, REC-07) e a política
// de dados da governança (1.3.4) como passo; R-29/R-30 dividem `disp-proprio` (REC-02); R-97, R-98 e R-100 seguem
// com o texto atual. R4 (4b): R-27 (onde os dados ficam e quem os subcontrata) e R-28 (o que os adultos não devem digitar).
import { ACOES_G } from '../plano_dados.js';

const FALTA_RESP = ['nao', 'parcial', 'nao_sei'];
const PROPRIO_SERVIDORES = k => k.v('modeloDisp') === 'proprio' && !k.usaEst && !k.usuarios.includes('familias');
const BASE_LEGAL = 'Confirmar a base legal no exercício da política educacional; o consentimento só cabe se o uso for opcional e recusar não trouxer prejuízo.';
const FORMACAO_DADOS = 'Incluir proteção de dados e uso responsável na formação.';

/** @type {import('./index.js').Regra[]} */
export const REGRAS_DADOS = [
  {
    id: 'R-26', versao: 2, pacote: 'DADOS', tipo: 'politica',
    substitui: ['dados-acordo', 'dados-base-legal', 'dados-impacto', 'formacao-dados', 'g-dados'], campos: ['tarefas', 'usuarios', 'formacaoTipo', 'g-dados'],
    se: k => k.dadosEst,
    origem: k => ({ campo: k.campoDados, vals: k.valsDados }),
    variantes: [
      { quando: k => k.poc,
        oque: 'Concluir a base legal, o acordo de tratamento e a avaliação de impacto antes de usar dados reais de estudantes na prova de conceito.',
        porque: 'Na escola pública o consentimento raramente é livre; sem essas peças, a prova de conceito não pode usar dados reais.',
        como: [BASE_LEGAL, 'Assinar um acordo de tratamento de dados que proíba usar os dados para treinar modelos.', 'Usar dados fictícios ou anonimizados enquanto as peças não estiverem prontas.'] },
      { oque: 'Concluir o pacote de proteção de dados dos estudantes antes do teste, com base legal, acordo de tratamento, avaliação de impacto e prazos de guarda.',
        porque: 'Na escola pública o consentimento raramente é livre; sem essas peças, o teste não tem base legal e a rede perde o controle dos dados.',
        como: [BASE_LEGAL, 'Assinar um acordo de tratamento de dados que proíba usar os dados para treinar modelos.', 'Concluir a avaliação de impacto sobre a proteção de dados e fixar os prazos de guarda e exclusão.'] },
    ],
    passos: k => {
      const P = [];
      const ft = k.arr('formacaoTipo');
      if (ft.length && !ft.includes('dados_etica')) P.push(FORMACAO_DADOS);
      // passo com o "O que falta?" da 1.3.4: { texto (chave), falta (texto da pessoa, sem tradução) }
      if (FALTA_RESP.includes(k.resp('g-dados'))) P.push({ texto: ACOES_G['g-dados'], falta: k.falta('g-dados') });
      return P;
    },
    textosExtras: [FORMACAO_DADOS],
    paraque: 'O teste começa com base legal e com o destino dos dados sob controle da rede.',
    quem: ['protecao_dados', 'juridico'], marco: 'M1', pd: 3, curto: 'o pacote de dados',
    exemplosNorma: { BR: ['LGPD arts. 7º, III, 14 e 23; Enunciado CD/ANPD 1/2023'], UE: ['RGPD art. 6(1)(e), art. 8, art. 35'] },
    condicao: () => true,
    exige: ['DADOS_REQ.treino', 'DADOS_REQ.retencao', 'DADOS_REQ.exclusao', 'DADOS_REQ.sub'],
    pronto: 'Parecer do encarregado, acordo assinado e relatório de impacto juntados ao processo.',
  },
  {
    id: 'R-27', versao: 1, pacote: 'DADOS', tipo: 'politica', substitui: [], campos: ['tarefas', 'usuarios'],
    se: k => ((k.ce || {}).dados || []).some(d => d && d !== 'nenhum'),
    origem: k => ({ campo: k.campoDados, vals: k.valsDados }),
    variantes: [
      { quando: k => k.dadosEst,
        oque: 'Registrar no contrato onde os dados são processados e guardados, por quanto tempo o fornecedor guarda o que é digitado e quem são os subcontratados.',
        porque: 'As entradas podem ir para outro país e ficar guardadas, o que exige base legal para a transferência; com dados de estudantes, o risco é maior.',
        como: ['Pedir ao fornecedor os países e as regiões onde os dados são processados e guardados.', 'Fixar no contrato o prazo de guarda do que é digitado e a exclusão ao fim.', 'Listar os subcontratados, incluindo o provedor do modelo, com aviso prévio de troca.'] },
      { oque: 'Registrar no contrato onde os dados são processados e guardados, por quanto tempo o fornecedor guarda o que é digitado e quem são os subcontratados.',
        porque: 'As entradas podem ir para outro país e ficar guardadas, o que exige base legal para a transferência.',
        como: ['Pedir ao fornecedor os países e as regiões onde os dados são processados e guardados.', 'Fixar no contrato o prazo de guarda do que é digitado e a exclusão ao fim.', 'Listar os subcontratados, incluindo o provedor do modelo, com aviso prévio de troca.'] },
    ],
    paraque: 'A rede sabe para onde vão os dados e por quanto tempo ficam guardados.',
    quem: ['protecao_dados', 'tecnologia'], curto: 'o registro de onde os dados ficam',
    // M1 com dados de estudantes (Condição); com dados só de adultos, antes de levar ao mercado (Recomendada)
    marco: k => (k.dadosEst ? 'M1' : 'M3'), pd: 3,
    condicao: k => k.dadosEst,
    exige: ['DADOS_REQ.local', 'DADOS_REQ.retencao', 'DADOS_REQ.sub'],
    exemplosNorma: { BR: ['LGPD arts. 33 a 36; Res. CD/ANPD 19/2024'] },
    pronto: 'O contrato ou o termo de referência traz os locais de processamento, o prazo de guarda e a lista de subcontratados.',
  },
  {
    id: 'R-28', versao: 1, pacote: 'DADOS', tipo: 'politica', substitui: ['criancas'], campos: ['afetados', 'usuarios'],
    // adultos usam e há crianças afetadas, mas a tarefa não traz dados de estudantes: o risco é o que a pessoa digita
    se: k => k.criancas && !k.usaEst && !k.dadosEst && k.usuarios.length > 0,
    origem: () => ({ campo: 'afetados', vals: ['criancas'] }),
    variantes: [{
      oque: 'Orientar quem usa a ferramenta a não digitar nomes, laudos ou notas de estudantes e exigir que o conteúdo digitado não treine modelos.',
      porque: 'Professores colam dados de estudantes mesmo quando a tarefa não pede, e o que é digitado pode ficar guardado ou treinar modelos.',
      como: ['Escrever uma regra de três linhas: não digitar nomes, laudos, notas nem outros dados de estudantes.', 'Mostrar a regra na formação e como aviso na tela.', 'Exigir no contrato, e configurar na conta institucional, que o conteúdo digitado não seja usado para treinar modelos.'],
    }],
    paraque: 'Dados de estudantes não entram na ferramenta por descuido.',
    quem: ['formacao', 'protecao_dados'], marco: 'M1', pd: 3, curto: 'a orientação sobre o que não digitar',
    alta: () => true,
    exige: ['DADOS_REQ.treino'],
    pronto: 'A regra de três linhas está na formação e na tela, e a cláusula de não treino consta do contrato ou da conta institucional.',
  },
  {
    id: 'R-29', versao: 1, pacote: 'DADOS', tipo: 'politica', substitui: ['disp-proprio'], campos: ['modeloDisp'],
    se: PROPRIO_SERVIDORES,
    variantes: [{
      oque: 'Definir o uso no celular pessoal dos servidores, com conta institucional, nenhum dado no aparelho, sessão que expira, uso opcional e alternativa na escola.',
      porque: 'O uso obrigatório em aparelho pessoal transfere custo e risco ao servidor e deixa dados da rede fora do controle dela.',
      como: ['Exigir conta institucional e sessão que expira, sem dados guardados no aparelho.', 'Oferecer um equipamento no local de trabalho para quem não quiser usar o próprio.'],
    }],
    paraque: 'O uso no aparelho pessoal é seguro e opcional para quem trabalha na rede.',
    quem: ['tecnologia', 'pessoas'], marco: 'M1',
    pronto: 'A regra de uso no aparelho pessoal está publicada e a alternativa no local de trabalho existe.',
  },
  {
    id: 'R-30', versao: 1, pacote: 'DADOS', tipo: 'politica', substitui: ['disp-proprio'], campos: ['modeloDisp'],
    se: k => k.v('modeloDisp') === 'proprio' && !PROPRIO_SERVIDORES(k),
    variantes: [{
      oque: 'Garantir acesso a quem não tem dispositivo próprio, com equipamentos da escola ou empréstimo.',
      porque: 'Depender de soluções das famílias pode ampliar desigualdades entre estudantes.',
      como: ['Levantar quantos estudantes não têm dispositivo adequado.', 'Orçar equipamentos da escola ou um sistema de empréstimo.'],
    }],
    paraque: 'Ninguém fica de fora do uso por não ter dispositivo próprio.',
    quem: ['tecnologia', 'pedagogica'], marco: 'M1',
    alta: () => true,
    pronto: 'Cada escola sabe quem não tem dispositivo e como essas pessoas terão acesso.',
  },
  {
    id: 'R-97', versao: 1, pacote: 'DADOS', tipo: 'custo', substitui: ['disp-nao'], campos: ['dispExistem'],
    se: k => k.v('dispExistem') === 'nao' && k.v('modeloDisp') !== 'proprio',
    variantes: [{
      oque: 'Orçar a compra dos dispositivos e planejar a reposição ao longo dos anos de uso.',
      porque: 'Dispositivos têm vida útil e precisam de manutenção; sem reposição orçada, o uso cai nos anos seguintes.',
      como: ['Calcular quantos dispositivos faltam por escola.', 'Incluir a compra, a manutenção e a reposição no orçamento de cada ano.'],
    }],
    paraque: 'As escolas têm os dispositivos de que precisam durante todo o uso.',
    quem: ['tecnologia', 'orcamento'], marco: 'M1',
    alta: () => true, semExige: 'Compra de dispositivos orçada pela rede, fora do contrato da ferramenta.',
    pronto: 'A compra e a reposição dos dispositivos estão no orçamento de cada ano.',
  },
  {
    id: 'R-98', versao: 1, pacote: 'DADOS', tipo: 'custo', substitui: ['disp-parcial'], campos: ['dispExistem'],
    se: k => k.v('dispExistem') === 'parcial' && k.v('modeloDisp') !== 'proprio',
    variantes: [{
      oque: 'Levantar quantos dispositivos faltam em cada escola e incluir a compra e a reposição no orçamento.',
      porque: 'Sem o levantamento por escola, o teste e a implantação começam com turmas sem equipamento.',
      como: ['Levantar, escola por escola, os dispositivos que existem e os que faltam.', 'Incluir a compra e a reposição no orçamento.'],
    }],
    paraque: 'O teste e a implantação começam com o equipamento necessário.',
    quem: ['tecnologia', 'escolas'], marco: 'M1',
    alta: () => true, semExige: 'Levantamento e compra orçados pela rede, fora do contrato da ferramenta.',
    pronto: 'O levantamento por escola está pronto e a compra está orçada.',
  },
  {
    id: 'R-100', versao: 1, pacote: 'DADOS', tipo: 'custo', substitui: ['disp-renovar'], campos: ['dispExistem'],
    se: k => ['nao', 'parcial'].includes(k.v('dispExistem')) && k.v('modeloDisp') !== 'proprio',
    variantes: [{
      oque: 'Planejar a renovação de dispositivos e infraestrutura.',
      porque: 'Equipamentos comprados para o teste envelhecem durante o contrato; sem plano, a renovação vira corte no meio do uso.',
      como: ['Definir o ciclo de reposição dos dispositivos.', 'Reservar a renovação no plano plurianual.'],
    }],
    paraque: 'O uso continua quando os equipamentos envelhecem.',
    quem: ['tecnologia', 'orcamento'], marco: 'M5',
    semExige: 'Renovação de equipamentos orçada pela rede.',
    pronto: 'O ciclo de reposição está definido e reservado no plano plurianual.',
  },
];
