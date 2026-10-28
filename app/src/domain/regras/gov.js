// Pacote GOV: equipe, governança 1.3, continuidade e prestação de contas (lente "Decisão e evidência").
// Formato: regras/index.js. R2: as ações de governança (respostas Não, Em parte ou Não sei na 1.3) viram regras do
// catálogo: R-83 (equipe, 1.3.1) e R-84 (política, legislação e orientações num só cartão, com as faltas como passos).
// A 1.3.4 (dados) é passo de R-26 e a 1.3.6 (compras) é a R-63.
// R4 (4c, REC-28): R-83 também dispara com modelo por API, pesos abertos ou desenvolvimento sob medida, mesmo com a equipe
// existente (as funções que não se terceirizam); R-85 (ato, responsável de carreira e revisão de continuidade), R-86 (ficha
// pública do sistema e relatório do teste) e R-87 (renovar só com evidência). Decisão 5: sem norma no texto principal.
import { ACOES_G } from '../plano_dados.js';
import { numero, varsRec } from '../rec_numeros.js';
import { orientacaoNoTeste } from './uso.js';

const FALTA_RESP = ['nao', 'parcial', 'nao_sei'];
// 1.3.5 (orientações de uso): quando a R-50 dispara (orientação curta no primeiro dia do teste), a falta já é ação dela e
// sai da R-84 (nem passo nem texto principal), para a mesma falta não aparecer duas vezes
const falta = (k, id) => FALTA_RESP.includes(k.resp(id)) && !(id === 'g-etica' && orientacaoNoTeste(k));
const LEGISLACAO = 'Mapear a legislação aplicável ao caso, como proteção de dados, regras de IA, direitos de crianças e compras públicas.';
const cedo = k => k.dadosEst && !k.poc;
const horizonte = k => (k.d && k.d.H) || +k.v('horizonte') || 0;
// R-83: o caso exige que a rede opere partes do sistema (API, pesos abertos, sob medida)
const operaSistema = k => k.arqEf !== 'saas' || k.v('adaptacao') === 'sob_medida' || k.v('tipoTec') === 'aberta';
// passo com o "O que falta?" da resposta "Em parte" (texto da pessoa, sem tradução)
const passo = (k, id, texto) => ({ texto, falta: k.resp(id) === 'parcial' ? k.falta(id) : '' });

/** @type {import('./index.js').Regra[]} */
export const REGRAS_GOV = [
  {
    id: 'R-83', versao: 2, pacote: 'GOV', tipo: 'politica', substitui: ['g-comite'], campos: ['g-comite', 'adaptacao', 'tipoTec'],
    se: k => falta(k, 'g-comite') || operaSistema(k),
    origem: k => (falta(k, 'g-comite') ? { campo: 'g-comite', vals: [k.resp('g-comite')] }
      : { campo: k.v('adaptacao') === 'sob_medida' ? 'adaptacao' : 'tipoTec' }),
    variantes: [
      { quando: k => falta(k, 'g-comite'),
        oque: ACOES_G['g-comite'],
        porque: 'Alguém precisa aceitar riscos e decidir a continuidade; sem equipe nomeada, as decisões do caso ficam sem dono.',
        como: ['Designar a equipe por ato, com nomes e horas.', 'Atribuir à equipe as funções que não se terceirizam: finalidade, risco, evidência, continuidade e prestação de contas.'] },
      { oque: 'Atribuir à equipe responsável por IA as funções que não se terceirizam e reservar horas para acompanhar o modelo, a nuvem e a integração.',
        porque: 'Com modelo por API, pesos abertos ou desenvolvimento sob medida, a rede opera partes do sistema; sem funções claras, ninguém decide quando o fornecedor muda ou falha.',
        como: ['Confirmar que a equipe tem nomes e horas para finalidade, risco, evidência, continuidade e prestação de contas.', 'Designar quem acompanha o modelo, a nuvem e a integração e decide quando algo muda ou falha.'] },
    ],
    passos: k => (k.resp('g-comite') === 'parcial' && k.falta('g-comite') ? [passo(k, 'g-comite', 'Completar o que falta na equipe responsável.')] : []),
    textosExtras: ['Completar o que falta na equipe responsável.'],
    paraque: 'As decisões do caso têm uma equipe responsável, com tempo para elas.',
    quem: ['gabinete'], marco: k => (cedo(k) ? 'M1' : 'M3'), pd: 1,
    alta: () => true,
    pronto: 'O ato que designa a equipe, com nomes e horas, está publicado.',
  },
  {
    id: 'R-84', versao: 1, pacote: 'GOV', tipo: 'politica', substitui: ['g-politica', 'g-legislacao', 'g-etica'], campos: ['g-legislacao', 'g-politica', 'g-etica'],
    se: k => falta(k, 'g-politica') || falta(k, 'g-legislacao') || falta(k, 'g-etica'),
    origem: k => { const id = ['g-legislacao', 'g-politica', 'g-etica'].find(x => falta(k, x)); return { campo: id, vals: [k.resp(id)] }; },
    variantes: [
      { quando: k => falta(k, 'g-legislacao'), oque: LEGISLACAO,
        porque: 'Sem saber que normas se aplicam, o teste e o contrato podem deixar de fora uma exigência legal.',
        como: ['Pedir à assessoria jurídica uma nota com as normas aplicáveis e o que cada uma exige.', 'Registrar no processo o que já existe e o que falta.'],
        quem: ['juridico', 'gabinete'] },
      { quando: k => falta(k, 'g-politica'), oque: ACOES_G['g-politica'],
        porque: 'Sem política aprovada, cada caso decide sozinho para que a IA pode ser usada e quem responde por ela.',
        como: ['Escrever as finalidades, os usos permitidos e as responsabilidades.', 'Registrar no processo o que já existe e o que falta.'] },
      { oque: ACOES_G['g-etica'],
        porque: 'Sem orientações publicadas, professores, estudantes e gestores usam a IA cada um com a sua regra.',
        como: ['Escrever o que é permitido, o que é proibido e o que fazer em caso de dúvida.', 'Publicar as orientações antes do teste.'] },
    ],
    // as outras faltas da 1.3 entram como passos do mesmo cartão (GOV-17)
    passos: k => {
      const ids = ['g-legislacao', 'g-politica', 'g-etica'].filter(x => falta(k, x));
      const L = { 'g-legislacao': LEGISLACAO, 'g-politica': ACOES_G['g-politica'], 'g-etica': ACOES_G['g-etica'] };
      return ids.map((id, i) => (i === 0 ? (k.resp(id) === 'parcial' && k.falta(id) ? passo(k, id, 'Completar o que falta neste item.') : null) : passo(k, id, L[id]))).filter(Boolean);
    },
    textosExtras: ['Completar o que falta neste item.'],
    paraque: 'O caso se apoia em regras da rede conhecidas por todos.',
    quem: ['gabinete'], marco: k => (falta(k, 'g-legislacao') && cedo(k) ? 'M1' : 'M3'), pd: 1,
    alta: k => falta(k, 'g-legislacao'),
    pronto: 'Cada item que faltava tem documento aprovado ou responsável e prazo registrados.',
  },
  {
    id: 'R-85', versao: 1, pacote: 'GOV', tipo: 'politica', substitui: [], campos: ['horizonte'],
    se: k => horizonte(k) >= 3,
    origem: () => ({ campo: 'horizonte' }),
    variantes: [{
      oque: 'Dar ao programa um ato normativo, um responsável de carreira e uma revisão de continuidade com data fixa, fora do calendário eleitoral.',
      porque: 'Um programa de vários anos sem ato e sem responsável técnico morre com a troca de gestão ou se perpetua sem avaliação.',
      como: ['Publicar o ato que cria o programa, com finalidade, responsáveis e regras de revisão.', 'Designar um responsável técnico de carreira, e não só de cargo de confiança.', 'Marcar a revisão de continuidade com data fixa, fora do calendário eleitoral.'],
    }],
    paraque: 'O programa sobrevive à troca de gestão e é revisto com evidência.',
    quem: ['gabinete'], marco: 'M4', pd: 9,
    pronto: 'O ato, o responsável técnico e a data da revisão de continuidade estão publicados.',
  },
  {
    id: 'R-86', versao: 1, pacote: 'GOV', tipo: 'politica', substitui: [], campos: ['testes'],
    se: k => k.testes.length > 0,
    origem: k => ({ campo: 'testes', vals: k.testes }),
    variantes: [
      { quando: k => k.consDecide.length > 0,
        oque: 'Publicar a ficha do sistema e o relatório do teste, com a decisão e o motivo, e dizer como contestar uma decisão que afete pessoas.',
        porque: 'Decisões que afetam pessoas e usam dinheiro público pedem justificativa pública; publicar antes reduz o conflito e mostra como a decisão foi tomada.',
        como: ['Escrever a ficha de uma página: finalidade, dados, fornecedor, custo, quem decide e como contestar.', 'Publicar o relatório do teste, com a decisão tomada e o motivo.', 'Manter o dossiê do processo pronto para o controle externo.'] },
      { oque: 'Publicar a ficha do sistema (finalidade, dados, fornecedor, custo, quem decide) e o relatório do teste, com a decisão e o motivo.',
        porque: 'Decisões sobre dinheiro público pedem justificativa pública; publicar antes reduz o conflito e mostra como a decisão foi tomada.',
        como: ['Escrever a ficha de uma página: finalidade, dados, fornecedor, custo e quem decide.', 'Publicar o relatório do teste, com a decisão tomada e o motivo.'] },
    ],
    paraque: 'A rede presta contas da decisão e do dinheiro, e o controle encontra o dossiê pronto.',
    quem: ['gabinete', 'controle'], marco: 'M2', pd: 4,
    alta: k => k.consDecide.length > 0,
    pronto: 'A ficha do sistema e o relatório do teste, com a decisão e o motivo, estão publicados.',
  },
  {
    id: 'R-87', versao: 1, pacote: 'GOV', tipo: 'custo', substitui: [], campos: ['situacao'],
    se: k => k.situacao === 'renovar',
    origem: () => ({ campo: 'situacao' }),
    variantes: [{
      oque: 'Renovar só com o relatório do contrato atual (uso real, resultado, custo por usuário ativo), comparação com o mercado e teste de exportação.',
      porque: 'A renovação automática perpetua a dependência e o preço; o custo anual em regime é de {regime}, e é antes de renovar que a rede ainda decide.',
      como: ['Reunir o relatório de uso por escola, o resultado e o custo por usuário ativo do contrato atual.', 'Fazer a consulta ou a pesquisa de preços e recalcular o custo dos próximos anos.', 'Fazer o teste de exportação dos dados, com aceite assinado.', 'Registrar a decisão de renovar na instância responsável.'],
    }],
    paraque: 'A renovação se apoia em evidência de uso e de resultado, e a rede mantém a saída aberta.',
    quem: ['fiscal', 'compras', 'gabinete'], marco: 'M4', pd: 9, curto: 'o relatório do contrato atual',
    condicao: () => true,
    numero: (k, d) => numero('regime', d), vars: (k, d) => varsRec(d, ['regime']),
    exige: ['CONTRATO.saida-exportacao', 'CONTRATO.custo-reajuste'],
    exemplosNorma: { BR: ['Lei 14.133/2021, art. 107 (prorrogação condicionada à vantagem para a administração)'] },
    pronto: 'O relatório do contrato atual, a comparação com o mercado e o teste de exportação estão no processo da renovação.',
  },
];
