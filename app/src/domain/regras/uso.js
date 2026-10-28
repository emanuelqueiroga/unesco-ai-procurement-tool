// Pacote USO: uso nas escolas, conexão e formação (lente "Pessoas e uso"). Formato: regras/index.js.
// R2: regras atuais migradas (R-45 reúne formacao-plano e formacao-horas; R-48 recebe `disp-compartilhado` quando a
// tarefa é tutoria, e R-99 fica com os demais casos).
// R4 (4d, REC-29): R-45 a R-54 do catálogo (6.1), a partir do parecer de pedagogia (PED-R01 a R26):
//   R-45 formação em ciclos (com o cenário de horas e custo) e, para quem não é professor, "confirmar as horas";
//   R-46 tempo na jornada; R-47 referência e direção na escola; R-48 dose por estudante (cita estudantes por dispositivo);
//   R-49 rotina do professor com os relatórios; R-50 orientação de uso da IA no primeiro dia; R-51 comunidade de prática e
//   formadores da expansão; R-52 acessibilidade e línguas; R-53 conexão fraca; R-54 curadoria da base de normas.
// A formação em ciclos é só um CENÁRIO (decisão 2): o custo central não muda; o cenário refaz a linha K4.4 numa cópia da cfg.
// Perguntas novas do Refinar (seção 7; pacote R8), lidas de forma defensiva: tempoJornada (R-46), apoioEscola (R-47) e
// publico (R-52, R-53; ids aceitos: deficiencia, lingua, rural). `k.subs` (subproblemas marcados, ex.: C4b) vem de recContexto.
import { PREMISSAS_V11, horasFormacaoEstimada } from '../casos.js';
import { avaliar, calcular, clone } from '../custos.js';
import { grande } from '../custos_ui.js';
import { fmtInt } from '../framework.js';
import { tr, LOC } from '../i18n.js';
import { numero, ILUSTRATIVO } from '../rec_numeros.js';

const tutoriaComEstudantes = k => k.classes.includes('tutoria') && k.usaEst;
const COMPARTILHADO = ['compartilhado', 'rotativo'];

// ----------------------------------------------------------- apoio das regras de formação (R-45, R-46)
/** Tarefas em que o professor muda o planejamento ou a aula (PED-R01). */
const TAREFAS_PEDAGOGICAS = ['planos_aula', 'materiais', 'tutoria', 'feedback_redacao', 'correcao', 'alerta_precoce'];
/** Abaixo destas horas por pessoa, a formação é "uma oficina" (R-45); o cenário em ciclos soma oficina e encontros. */
export const HORAS_MINIMAS_CICLOS = 8;
/** Cenário em ciclos: uma oficina de acesso e encontros de 1 a 2 horas (aqui, 4 de 1,5 h): 2 + 4 × 1,5 = 8 horas por pessoa. */
export const CICLOS = { oficina: 2, encontros: 4, horasEncontro: 1.5 };
export const HORAS_CICLOS = CICLOS.oficina + CICLOS.encontros * CICLOS.horasEncontro;
const nf = x => (+x || 0).toLocaleString(LOC(), { maximumFractionDigits: 1 });
const horasTxt = h => tr(+h === 1 ? '{0} hora por pessoa' : '{0} horas por pessoa').replace('{0}', nf(h));
const professoresFormados = k => k.arr('formados').includes('professores');
/** horas de formação por pessoa do caso: a resposta 2.5.4 ou, com "Usar uma estimativa", a do exemplo da arquitetura */
function horasDe(k) {
  let h = +k.c.formacaoHoras || 0;
  if (k.c.formacaoEstimativa) { try { h = +horasFormacaoEstimada(k.ce) || h; } catch (e) { /* mantém a resposta */ } }
  return h;
}
const ciclos = k => { const h = horasDe(k); return professoresFormados(k) && k.tarefas.some(t => TAREFAS_PEDAGOGICAS.includes(t)) && h > 0 && h < HORAS_MINIMAS_CICLOS; };
const comAlerta = k => k.tarefas.includes('alerta_precoce');

const CENARIOS = new WeakMap();
/**
 * Cenário de formação em ciclos (decisão 2: não muda a estimativa central): numa cópia da cfg, só a linha dos usuários
 * formados (K4.4, sem os outros papéis) passa de f.horas para HORAS_CICLOS. → { de, para, delta } (delta na unidade de
 * d.total) ou null sem números ou sem a linha de formação.
 */
export function cenarioCiclos(d) {
  if (!d || !d.cfg) return null;
  if (CENARIOS.has(d)) return CENARIOS.get(d);
  let out = null;
  try {
    const f0 = d.cfg.formacaoTempo;
    if (f0 && f0.ativo && +f0.horas > 0) {
      const custo = h => { const c = clone(d.cfg); c.formacaoTempo.extras = []; c.formacaoTempo.horas = h; return avaliar(calcular(c)).ctEco; };
      out = { de: +f0.horas, para: HORAS_CICLOS, delta: custo(HORAS_CICLOS) - custo(+f0.horas) };
    }
  } catch (e) { console.warn(e); }
  CENARIOS.set(d, out);
  return out;
}
const mais = x => (x < 0 ? '−' : '+') + grande(Math.abs(x));

// ----------------------------------------------------------- apoio das regras de escola (R-47, R-51)
const pilotoEscolas = k => +((k.c.piloto || {}).escolas) || 0;
const semReferencia = k => { const v = String(k.v('apoioEscola') || ''); return !v || /^(ninguem|nenhum|nao)/.test(v); };
const referenciaEscola = k => k.temPiloto && pilotoEscolas(k) >= 5 && semReferencia(k);
const professoresOuEstudantes = k => k.usuarios.includes('professores') || k.usaEst;
/** gatilho da R-50 (orientação curta no primeiro dia): a R-84 (gov.js) deixa de tratar a 1.3.5 quando ele vale */
export const orientacaoNoTeste = k => ['nao', 'parcial'].includes(k.resp('g-etica')) && professoresOuEstudantes(k);
const direcaoFora = k => professoresOuEstudantes(k) && !k.poc && !k.arr('formados').includes('gestores');
const expansaoGrande = k => k.c.expansao === 'ano1' && (+((k.c.implantacao || {}).escolas) || 0) >= 100;
const escolasTxt = n => tr('{0} escolas').replace('{0}', fmtInt(n));
const pilotoComunidade = k => k.temPiloto && pilotoEscolas(k) >= 5;
/** custo da curadoria da base de conhecimento no custo total (linhas K4.1 com "curadoria"), na unidade de d.total; 0 sem a linha */
function curadoria(d) {
  if (!d || !d.av || !d.av.linhas) return 0;
  return d.av.linhas.filter(l => l.s === 'K4.1' && /curadoria/i.test(String(l.nome))).reduce((a, l) => a + (+l.ecoVP || 0), 0);
}
// ----------------------------------------------------------- perguntas novas (seção 7), lidas se existirem
const publicoTem = (k, re) => k.arr('publico').some(v => re.test(String(v)));
const subsDe = k => (Array.isArray(k.subs) ? k.subs : []);
const acessibilidade = k => subsDe(k).includes('C4b') || k.impactos.includes('inclusao') || (k.probs || []).some(q => ['C8', 'G8', 'F10'].includes(q.id)) || publicoTem(k, /defici|lingu|idioma/i);
const internetFraca = k => ['parcial', 'nao'].includes(k.v('internet')) || publicoTem(k, /rural|remot/i);

/** Frases com marcadores que as regras montam em vars (chaves de tradução). */
export const TEXTOS_REC_R4D = ['{0} horas por pessoa', '{0} hora por pessoa', '{0} estudantes por dispositivo', '{0} dispositivos por escola', '{0} escolas', ILUSTRATIVO,
  'Completar o que falta nas orientações atuais.', 'Formação em ciclos: horas atuais, horas do cenário e diferença de custo', 'Curadoria da base de conhecimento'];

/** @type {import('./index.js').Regra[]} */
export const REGRAS_USO = [
  {
    id: 'R-45', versao: 2, pacote: 'USO', tipo: 'politica', substitui: ['formacao-plano', 'formacao-horas'], campos: ['formacaoHoras', 'formados', 'problemas', 'prioridades'],
    se: k => ciclos(k) || !!(k.sp && k.sp.formacao) || (!!k.c.formacaoEstimativa && !!k.valHoras),
    origem: k => ({ campo: 'formacaoHoras', vals: [k.valHoras] }),
    variantes: [
      { quando: k => ciclos(k) && comAlerta(k),
        oque: 'Planejar a formação em ciclos durante o teste, com prática na escola e simulação do protocolo para o estudante sinalizado, e não uma oficina única.',
        porque: 'Uma oficina de {horas} ensina a acessar a ferramenta, mas não a agir com ela, e o uso costuma cair depois das primeiras semanas.',
        como: ['Planejar uma oficina inicial curta e encontros de 1 a 2 horas, a cada 3 ou 4 semanas, em que as equipes simulam o protocolo com casos da própria escola.',
          'Prever acompanhamento por coordenador ou formador entre os encontros.',
          'Refazer a estimativa com as horas planejadas: o cenário em ciclos, de {horasCiclos}, soma {difCiclos} ao custo, e o valor central não muda.'] },
      { quando: ciclos,
        oque: 'Planejar a formação dos professores em ciclos ao longo do teste, com prática na própria turma, e não uma oficina única.',
        porque: 'Uma oficina de {horas} ensina a acessar a ferramenta, mas não a usá-la para ensinar, e o uso costuma cair depois das primeiras semanas.',
        como: ['Planejar uma oficina inicial curta, só de acesso, e três a quatro encontros de 1 a 2 horas, a cada 3 ou 4 semanas, com exemplos trazidos da própria turma.',
          'Prever acompanhamento por coordenador ou formador entre os encontros.',
          'Refazer a estimativa com as horas planejadas: o cenário em ciclos, de {horasCiclos}, soma {difCiclos} ao custo, e o valor central não muda.'] },
      { quando: k => !!(k.sp && k.sp.formacao),
        oque: 'Montar um plano de formação antes do teste, com público, conteúdo, horas e responsáveis.',
        porque: 'Os problemas marcados dependem de formar pessoas; sem plano, a formação, hoje estimada em {horas}, fica fora do orçamento e do calendário.',
        como: ['Definir quem será formado, com que conteúdo e quantas horas.', 'Distribuir a formação ao longo do teste, com prática no trabalho.'],
        origem: k => ({ campo: k.formacaoDe.campo, vals: k.formacaoDe.vals }), pronto: 'O plano de formação, com horas e responsáveis, está aprovado.' },
      { oque: 'Confirmar as horas de formação por pessoa com quem vai oferecer a formação.',
        porque: 'A estimativa usa {horas}, um valor ilustrativo; o custo e o efeito da formação dependem desse número.',
        como: ['Pedir a quem oferece a formação as horas por pessoa e o formato.', 'Atualizar a resposta 2.5.4 com o valor confirmado.'],
        marco: 'M3', pronto: 'As horas de formação por pessoa estão confirmadas com quem vai oferecer a formação.' },
    ],
    vars: (k, d) => {
      const o = {}, h = horasDe(k);
      if (h > 0) o.horas = horasTxt(h);
      o.horasCiclos = horasTxt(HORAS_CICLOS);
      const c = ciclos(k) ? cenarioCiclos(d) : null;
      if (c) o.difCiclos = mais(c.delta) + ' (' + tr(ILUSTRATIVO) + ')';
      return o;
    },
    numero: (k, d) => {
      const c = ciclos(k) ? cenarioCiclos(d) : null;
      if (!c) return null;
      return { id: 'formacaoCiclos', rotulo: tr('Formação em ciclos: horas atuais, horas do cenário e diferença de custo'),
        valor: horasTxt(c.de) + ' → ' + horasTxt(c.para) + '; ' + mais(c.delta), fonte: '2.5.4', ilustrativo: true, emJogo: c.delta > 0 ? c.delta : 0 };
    },
    paraque: 'As pessoas aprendem a usar a ferramenta no trabalho, e não só a acessá-la.',
    quem: ['formacao'], marco: 'M1', pd: 4,
    alta: k => !!(k.sp && k.sp.formacao) || (ciclos(k) && (k.usaEst || k.impactos.includes('aprendizagem'))),
    pronto: 'O plano de formação, com horas, ciclos e responsáveis, está aprovado.',
  },
  {
    id: 'R-46', versao: 1, pacote: 'USO', tipo: 'politica', substitui: [], campos: ['tempoJornada', 'formados'],
    se: k => professoresFormados(k) && k.v('tempoJornada') !== 'sim',
    origem: k => (k.v('tempoJornada') ? { campo: 'tempoJornada', vals: [k.v('tempoJornada')] } : { campo: 'formados', vals: ['professores'] }),
    variantes: [{
      oque: 'Garantir que a formação e o primeiro uso caibam na jornada paga dos professores e somar esse tempo ao custo.',
      porque: 'Formação fora do horário tem pouca adesão, e o tempo em formação já pesa {custoFormacao} no custo total, mesmo quando não é gasto novo.',
      como: ['Usar as horas de trabalho pedagógico coletivo da escola para a formação e o primeiro uso.',
        'Calcular professores × horas × custo da hora e somar ao orçamento, mesmo que não seja gasto novo.',
        'Prever substituição se a formação cair em horário de aula.',
        'Combinar o calendário com as direções.'],
    }],
    vars: (k, d) => { const n = numero('sub:K4.4', d); return n.falta ? {} : { custoFormacao: n.valor }; },
    numero: (k, d) => { const n = numero('sub:K4.4', d); return n.falta ? null : { id: 'formacaoTempo', rotulo: n.rotulo, valor: n.valor, fonte: '2.5.4', ilustrativo: false, emJogo: 0 }; },
    paraque: 'A formação e o primeiro uso acontecem dentro da jornada paga, e o tempo das pessoas está no orçamento.',
    quem: ['pessoas', 'formacao'], marco: 'M1', pd: 4,
    condicao: k => k.v('tempoJornada') === 'nao',
    exemplosNorma: { BR: ['Lei 11.738/2008, art. 2º, § 4º (no máximo 2/3 da jornada com estudantes)'] },
    pronto: 'O calendário da formação usa a jornada paga e o tempo das pessoas está somado ao orçamento.',
  },
  {
    id: 'R-47', versao: 1, pacote: 'USO', tipo: 'politica', substitui: [], campos: ['apoioEscola', 'piloto', 'formados'],
    se: k => referenciaEscola(k) || direcaoFora(k),
    origem: k => (referenciaEscola(k) ? { campo: 'piloto', vals: [escolasTxt(pilotoEscolas(k))] } : { campo: 'formados', vals: k.arr('formados') }),
    variantes: [
      { quando: referenciaEscola,
        oque: 'Nomear em cada escola do teste uma pessoa de referência, com horas para apoiar os colegas, e envolver a direção no plano de uso.',
        porque: 'O suporte resolve acesso e senha, mas a dúvida sobre como usar na aula se resolve na escola, por alguém que conheça a turma, nas {escolasPiloto} do piloto.',
        como: ['Nomear uma pessoa de referência por escola, da coordenação pedagógica ou um professor, com horas semanais reservadas na jornada, e formá-la para apoiar os colegas.',
          'Reunir as direções, que decidem horário, salas e dispositivos: objetivo, critérios de sucesso e de parada; incluir a direção entre as pessoas formadas na pergunta 2.5.1.',
          'Pedir a cada escola um plano de uso de uma página, com turmas, horários e quem acompanha.',
          'Somar o tempo das referências ao custo de acompanhamento.'] },
      { oque: 'Envolver a direção das escolas do teste antes de começar, pois ela decide horário, salas e dispositivos e acompanha o uso.',
        porque: 'Sem a direção, a ferramenta concorre com as outras prioridades da escola e o uso depende da boa vontade de cada professor.',
        como: ['Reunir as direções: objetivo, critérios de sucesso e de parada.', 'Incluir a direção entre as pessoas formadas na pergunta 2.5.1.',
          'Pedir a cada escola um plano de uso de uma página, com turmas, horários e quem acompanha.'] },
    ],
    vars: k => (pilotoEscolas(k) > 0 ? { escolasPiloto: tr('{0} escolas').replace('{0}', fmtInt(pilotoEscolas(k))) } : {}),
    paraque: 'Os professores têm apoio no dia a dia da escola, e a direção sabe o que o teste exige dela.',
    quem: ['pedagogica', 'escolas'], marco: 'M1', pd: 4,
    alta: k => k.usaEst,
    pronto: 'Cada escola do teste tem uma pessoa de referência com horas, a direção está envolvida e há um plano de uso de uma página.',
  },
  {
    id: 'R-48', versao: 2, pacote: 'USO', tipo: 'uso', substitui: ['disp-compartilhado'], campos: ['modeloDisp', 'tarefas'],
    se: k => tutoriaComEstudantes(k),
    origem: k => (COMPARTILHADO.includes(k.v('modeloDisp')) ? { campo: 'modeloDisp', vals: [k.v('modeloDisp')] } : { campo: 'tarefas', vals: k.tarefas }),
    variantes: [
      { quando: k => k.v('modeloDisp') === 'compartilhado',
        oque: 'Fixar a dose semanal por estudante, pôr o horário na grade e organizar estações ou orçar mais dispositivos para cobrir essa dose.',
        porque: 'A estimativa considera {estPorDisp}, mas um tutor individual dividido entre estudantes reduz a prática individualizada que o caso promete.',
        como: ['Definir os minutos por semana por estudante e o horário na grade de cada turma do teste.',
          'Calcular os minutos por estudante com as turmas e os dispositivos atuais; se a dose não fechar, comparar com o cenário de um dispositivo por estudante.',
          'Organizar a aula em estações: um grupo no tutor, um com o professor e um em atividade sem tela.',
          'Definir quem mantém os dispositivos carregados, atualizados e com contas separadas.'] },
      { quando: k => k.v('modeloDisp') === 'rotativo',
        oque: 'Fixar a dose semanal por estudante, pôr o horário na grade e combinar o rodízio do carrinho ou orçar mais dispositivos para cobrir essa dose.',
        porque: 'A estimativa considera {dispPorEscola}, que circulam entre as turmas; um tutor individual precisa de tempo próprio para cada estudante.',
        como: ['Definir os minutos por semana por estudante e o horário na grade de cada turma do teste.',
          'Montar a agenda do carrinho por turma e calcular os minutos por estudante que ela permite.',
          'Se a dose não fechar, comparar com o cenário de mais dispositivos por escola.',
          'Definir quem mantém os dispositivos carregados, atualizados e com contas separadas.'] },
      { oque: 'Fixar a dose semanal por estudante, pôr o horário na grade e acompanhar se a dose acontece em cada turma.',
        porque: 'O efeito da prática adaptativa depende de uso regular; sem horário na grade, a dose fica baixa e desigual entre as turmas.',
        como: ['Definir a dose, em minutos por semana por estudante, e o horário na grade de cada turma do teste.',
          'Registrar a dose por estudante.', 'Avisar o professor quando um estudante ficar abaixo da dose.'] },
    ],
    vars: () => {
      const o = {}, P = PREMISSAS_V11 || {};
      if (+P.estudantesPorDispositivo > 0) o.estPorDisp = tr('{0} estudantes por dispositivo').replace('{0}', nf(P.estudantesPorDispositivo));
      if (+P.dispositivosPorEscolaRotativo > 0) o.dispPorEscola = tr('{0} dispositivos por escola').replace('{0}', nf(P.dispositivosPorEscolaRotativo));
      return o;
    },
    paraque: 'Cada estudante recebe a prática que o teste supõe.',
    quem: ['pedagogica', 'escolas'], marco: 'M1', pd: 4,
    alta: () => true,
    pronto: 'A dose semanal, o horário na grade e a organização dos dispositivos estão definidos por escola.',
  },
  {
    id: 'R-49', versao: 1, pacote: 'USO', tipo: 'uso', substitui: [], campos: ['tarefas', 'usuarios'],
    se: k => k.usaEst && k.tarefas.some(t => ['tutoria', 'feedback_redacao', 'correcao'].includes(t)),
    origem: k => ({ campo: 'tarefas', vals: k.tarefas.filter(t => ['tutoria', 'feedback_redacao', 'correcao'].includes(t)) }),
    variantes: [{
      oque: 'Definir a rotina do professor com os relatórios da ferramenta (o que olha, quando e que decisão toma) e exigir um painel por turma.',
      porque: 'Sem a rotina, a ferramenta vira uma atividade paralela e o que ela descobre sobre a defasagem dos estudantes não chega à aula.',
      como: ['Definir uma rotina semanal de 15 a 20 minutos com o relatório da turma: reagrupar, retomar um conteúdo ou chamar um estudante.',
        'Usar na formação os relatórios reais das turmas do teste.',
        'Exigir do fornecedor um painel por turma e por habilidade.'],
    }],
    paraque: 'O que a ferramenta descobre sobre cada estudante chega ao planejamento e à aula do professor.',
    quem: ['pedagogica', 'formacao'], marco: 'M1', pd: 4,
    alta: () => true,
    pronto: 'A rotina do professor com os relatórios está escrita e o painel por turma é requisito da compra.',
  },
  {
    id: 'R-50', versao: 1, pacote: 'USO', tipo: 'politica', substitui: [], campos: ['g-etica', 'usuarios'],
    se: orientacaoNoTeste,
    origem: k => ({ campo: 'g-etica', vals: [k.resp('g-etica')] }),
    variantes: [{
      oque: 'Entregar aos professores do teste, no primeiro dia, uma orientação de 1 a 2 páginas sobre o uso da IA em sala.',
      porque: 'A orientação institucional da rede chega tarde para o teste, e o professor precisa da regra no primeiro dia de uso.',
      como: ['Escrever uma versão curta para o teste, a partir das orientações que a rede já tem: o que se pode fazer, como declarar o uso e o que fazer diante de erro ou conteúdo impróprio.',
        'Apresentá-la na oficina inicial e revisá-la com o que o teste ensinar.'],
    }],
    passos: k => (k.resp('g-etica') === 'parcial' && k.falta('g-etica') ? [{ texto: 'Completar o que falta nas orientações atuais.', falta: k.falta('g-etica') }] : []),
    textosExtras: ['Completar o que falta nas orientações atuais.'],
    paraque: 'Os professores do teste começam com uma regra clara sobre o uso da IA.',
    quem: ['pedagogica'], marco: 'M1', pd: 4,
    alta: k => k.usaEst,
    pronto: 'A orientação de 1 a 2 páginas foi entregue a todos os professores do teste antes do primeiro uso.',
  },
  {
    id: 'R-51', versao: 1, pacote: 'USO', tipo: 'politica', substitui: [], campos: ['piloto', 'implantacao'],
    se: k => pilotoComunidade(k) || (expansaoGrande(k) && (k.usuarios.includes('professores') || professoresFormados(k))),
    origem: k => (pilotoComunidade(k) ? { campo: 'piloto', vals: [escolasTxt(pilotoEscolas(k))] } : { campo: 'implantacao', vals: k.valImpl ? [k.valImpl] : [] }),
    variantes: [
      { quando: k => pilotoComunidade(k) && expansaoGrande(k),
        oque: 'Reunir os professores do piloto todo mês, escolher multiplicadores entre eles e dimensionar os formadores da expansão antes de assinar a implantação.',
        porque: 'Com {valImpl} no primeiro ano, a formação pode virar vídeo e a adoção cair; quem viveu o piloto forma melhor os colegas.',
        como: ['Marcar um encontro mensal de 1 hora com os professores do piloto, que pode ser online, e montar um banco de exemplos de aulas e materiais.',
          'Escolher multiplicadores entre os professores do piloto e contá-los no plano de formação da expansão.',
          'Calcular as escolas por formador e por polo e o calendário compatível com o ano letivo.',
          'Somar os formadores ao custo de formação antes de assinar a implantação.'] },
      { quando: pilotoComunidade,
        oque: 'Reunir os professores do piloto todo mês para trocar exemplos de uso e escolher multiplicadores para a expansão.',
        porque: 'Professores aprendem a usar uma ferramenta nova sobretudo com outros professores, e quem viveu o piloto forma melhor e a menor custo.',
        como: ['Marcar um encontro mensal de 1 hora com os professores do piloto, que pode ser online.',
          'Montar um banco de exemplos de aulas e materiais.', 'Escolher multiplicadores entre os professores do piloto.'] },
      { marco: 'M4',
        oque: 'Dimensionar os formadores e as referências da expansão, com escolas por formador e calendário compatível, antes de assinar a implantação.',
        porque: 'Com {valImpl} no primeiro ano, sem formadores suficientes a formação vira um vídeo e a adoção cai.',
        como: ['Calcular as escolas por formador e por polo.', 'Montar o calendário de formação compatível com o ano letivo.',
          'Somar os formadores e as referências ao custo de formação.'] },
    ],
    vars: k => (k.valImpl ? { valImpl: k.valImpl } : {}),
    paraque: 'A formação da expansão tem quem a faça, e os professores do piloto viram referência para os colegas.',
    quem: ['formacao'], marco: 'M1', pd: 4,
    pronto: 'Os encontros mensais estão marcados, os multiplicadores escolhidos e os formadores da expansão dimensionados.',
  },
  {
    id: 'R-52', versao: 1, pacote: 'USO', tipo: 'uso', substitui: [], campos: ['impactos', 'problemas', 'publico'],
    se: k => acessibilidade(k),
    origem: k => (k.impactos.includes('inclusao') ? { campo: 'impactos', vals: ['inclusao'] } : publicoTem(k, /defici|lingu|idioma/i) ? { campo: 'publico', vals: k.arr('publico') } : { campo: 'problemas', vals: (k.probs || []).map(q => q.t) }),
    variantes: [{
      oque: 'Exigir e testar a acessibilidade e as línguas dos estudantes, com a educação especial validando as adaptações antes do uso.',
      porque: 'A rede responde pelo acesso de todos; uma adaptação genérica pode baixar a exigência ou ignorar o plano individual do estudante.',
      como: ['Revisar uma amostra das adaptações com os professores de educação especial.',
        'Testar a acessibilidade (leitor de tela, contraste, legenda ou libras, quando couber) e as línguas dos estudantes.',
        'Incluir os requisitos de acessibilidade e de línguas no termo de referência.'],
    }],
    paraque: 'Estudantes com deficiência ou de outras línguas conseguem usar a ferramenta e seus materiais.',
    quem: ['inclusao', 'tecnologia'], marco: 'M1', pd: 4, grupos: true,
    alta: k => k.usaEst, exige: ['CONTRATO.escopo-requisitos'],
    pronto: 'A educação especial validou uma amostra das adaptações e os requisitos de acessibilidade e línguas estão no termo de referência.',
  },
  {
    id: 'R-53', versao: 1, pacote: 'USO', tipo: 'uso', substitui: [], campos: ['internet', 'publico'],
    se: k => internetFraca(k),
    origem: k => (['parcial', 'nao'].includes(k.v('internet')) ? { campo: 'internet', vals: k.valsInternet } : { campo: 'publico', vals: k.arr('publico') }),
    variantes: [{
      oque: 'Medir a banda por sessão e o uso com conexão fraca, e exigir modo de baixo consumo, modo sem conexão ou atividade desplugada equivalente.',
      porque: 'Uma ferramenta que só funciona com boa conexão aumenta a diferença entre as escolas, e o professor desiste depois de duas ou três falhas.',
      como: ['Medir a banda usada por sessão e testar a ferramenta com conexão fraca em escolas do teste.',
        'Exigir modo de baixo consumo, funcionamento sem conexão ou sincronização posterior.',
        'Preparar, para cada atividade, uma versão desplugada que o professor use quando a conexão falhar.',
        'Registrar as aulas perdidas por falha de conexão como indicador.'],
    }],
    paraque: 'A aula continua quando a conexão falha, e as escolas com pouca banda não ficam para trás.',
    quem: ['tecnologia', 'pedagogica'], marco: 'M1', pd: 4, grupos: true,
    alta: k => k.usaEst, exige: ['CONTRATO.escopo-requisitos'],
    pronto: 'A banda por sessão foi medida, o modo de baixo consumo ou sem conexão é requisito e há uma atividade desplugada por atividade.',
  },
  {
    id: 'R-54', versao: 1, pacote: 'USO', tipo: 'politica', substitui: [], campos: ['tarefas'],
    se: k => k.tarefas.includes('duvidas'),
    origem: () => ({ campo: 'tarefas', vals: ['duvidas'] }),
    variantes: [{
      oque: 'Nomear a área dona da base de normas, com inventário, vigência, rotina de atualização e retirada, e revisão de respostas por amostra.',
      porque: 'Uma norma desatualizada vira erro repetido em todas as escolas, e a curadoria da base pesa {custoCuradoria} no custo total.',
      como: ['Nomear a área dona da base de normas e quem a atualiza.',
        'Fazer o inventário das normas, com a vigência de cada uma.',
        'Definir a rotina de atualização e de retirada das normas revogadas.',
        'Revisar uma amostra das respostas com especialistas da área.'],
    }],
    vars: (k, d) => { const c = curadoria(d); return c ? { custoCuradoria: grande(c) } : {}; },
    numero: (k, d) => { const c = curadoria(d); return c ? { id: 'sub:K4.1', rotulo: tr('Curadoria da base de conhecimento'), valor: grande(c), bruto: { total: c }, fonte: 'Quanto custa', ilustrativo: false, emJogo: c } : null; },
    paraque: 'As respostas do assistente seguem as normas em vigor, e há uma área responsável por mantê-las.',
    quem: ['pedagogica', 'juridico'], marco: 'M1', pd: 4,
    alta: () => true,
    pronto: 'A área dona da base está nomeada, com inventário, vigência, rotina de atualização e revisão por amostra registrados.',
  },
  {
    id: 'R-95', versao: 1, pacote: 'USO', tipo: 'custo', substitui: ['internet-parcial'], campos: ['internet'],
    se: k => k.v('internet') === 'parcial',
    origem: k => ({ campo: 'internet', vals: k.valsInternet }),
    variantes: [{
      oque: 'Levantar as escolas sem internet adequada e orçar a conexão antes do teste.',
      porque: 'As condições de base costumam ser o primeiro custo, e sem conexão a ferramenta não funciona nessas escolas.',
      como: ['Listar as escolas sem conexão adequada.', 'Orçar a conexão dessas escolas para todos os anos de uso.'],
    }],
    paraque: 'As escolas do teste conseguem usar a ferramenta.',
    quem: ['tecnologia', 'orcamento'], marco: 'M1',
    alta: () => true, semExige: 'Conexão das escolas orçada pela rede, fora do contrato da ferramenta.',
    pronto: 'A lista de escolas sem conexão adequada e o orçamento da conexão estão prontos.',
  },
  {
    id: 'R-96', versao: 1, pacote: 'USO', tipo: 'custo', substitui: ['internet-nao'], campos: ['internet'],
    se: k => k.v('internet') === 'nao',
    variantes: [{
      oque: 'Orçar a conexão das escolas antes do teste ou escolher uma ferramenta que funcione sem internet.',
      porque: 'Sem conexão, o teste mede a falta de internet e não a ferramenta.',
      como: ['Orçar a conexão das escolas do teste e da implantação.', 'Perguntar ao mercado por modos de uso sem conexão ou com pouca banda.'],
    }],
    paraque: 'A ferramenta funciona nas escolas onde vai ser usada.',
    quem: ['tecnologia', 'orcamento'], marco: 'M1',
    alta: () => true, semExige: 'Conexão das escolas orçada pela rede, fora do contrato da ferramenta.',
    pronto: 'A conexão está orçada ou a ferramenta escolhida funciona sem internet.',
  },
  {
    id: 'R-99', versao: 1, pacote: 'USO', tipo: 'politica', substitui: ['disp-compartilhado'], campos: ['modeloDisp'],
    se: k => COMPARTILHADO.includes(k.v('modeloDisp')) && !tutoriaComEstudantes(k),
    variantes: [{
      oque: 'Organizar a agenda de uso dos dispositivos compartilhados e definir quem os mantém carregados, atualizados e com contas separadas.',
      porque: 'Sem agenda e sem manutenção, o dispositivo compartilhado fica indisponível justamente na hora da aula.',
      como: ['Montar a agenda de uso por turma.', 'Nomear quem cuida da carga, das atualizações e das contas.'],
    }],
    paraque: 'Os dispositivos estão prontos quando a turma precisa deles.',
    quem: ['escolas', 'tecnologia'], marco: 'M1',
    pronto: 'A agenda de uso e o responsável pelos dispositivos estão definidos em cada escola.',
  },
  {
    id: 'R-101', versao: 1, pacote: 'USO', tipo: 'custo', substitui: ['formacao-pagador'], campos: ['formacaoPaga'],
    se: k => k.v('formacaoPaga') === 'indefinido',
    variantes: [{
      oque: 'Definir quem paga a formação antes de contratar.',
      porque: 'Sem um responsável pelo pagamento, a formação costuma ficar fora do orçamento.',
      como: ['Decidir se a formação fica no contrato, com a rede ou com um parceiro.', 'Registrar o valor no orçamento de cada ano.'],
    }],
    paraque: 'A formação tem quem pague por ela durante todo o uso.',
    quem: ['orcamento', 'formacao'], marco: 'M3',
    alta: () => true, semExige: 'Decisão de orçamento da rede, que define depois a cláusula (R-102).',
    pronto: 'Quem paga a formação está decidido e o valor está no orçamento.',
  },
  {
    id: 'R-102', versao: 1, pacote: 'USO', tipo: 'custo', substitui: ['formacao-contrato'], campos: ['formacaoPaga'],
    se: k => k.v('formacaoPaga') === 'fornecedor',
    variantes: [{
      oque: 'Incluir a formação no contrato, com horas por pessoa, conteúdo, público e formato definidos, e a formação de quem entrar depois.',
      porque: 'Formação sem escopo no contrato tende a encolher para uma apresentação inicial da ferramenta.',
      como: ['Escrever no termo de referência as horas, o conteúdo, o público e o formato.', 'Prever a formação de quem entrar na rede durante o contrato.'],
    }],
    paraque: 'A formação contratada é a que as pessoas precisam, durante todo o contrato.',
    quem: ['compras', 'formacao'], marco: 'M3',
    alta: () => true, exige: ['CONTRATO.escopo-requisitos'],
    pronto: 'O termo de referência descreve a formação com horas, conteúdo, público e formato.',
  },
  {
    id: 'R-103', versao: 1, pacote: 'USO', tipo: 'custo', substitui: ['formacao-parceiro'], campos: ['formacaoPaga'],
    se: k => k.v('formacaoPaga') === 'parceiro',
    variantes: [{
      oque: 'Formalizar com o parceiro o que a formação cobre e quem a mantém quando o apoio terminar.',
      porque: 'Apoio de parceiro tem prazo; sem acordo escrito, a formação de quem entrar depois fica sem responsável.',
      como: ['Assinar com o parceiro o escopo, o prazo e o público da formação.', 'Definir quem assume a formação quando o apoio terminar.'],
    }],
    paraque: 'A formação continua quando o apoio do parceiro acabar.',
    quem: ['formacao', 'juridico'], marco: 'M3',
    semExige: 'Acordo com o parceiro, fora do contrato da ferramenta.',
    pronto: 'O acordo com o parceiro está assinado e a continuidade da formação tem responsável.',
  },
  {
    id: 'R-104', versao: 1, pacote: 'USO', tipo: 'politica', substitui: ['formacao-papeis'], campos: ['formados'],
    se: k => { const f = k.arr('formados'); return f.length > 0 && !f.includes('gestores') && !f.includes('tecnica'); },
    variantes: [{
      oque: 'Formar também as equipes técnicas e de gestão da secretaria que vão governar e manter a IA, e não só quem a usa.',
      porque: 'Quem governa e mantém a IA precisa saber avaliar riscos, custos e contratos, e não só usar a ferramenta.',
      como: ['Incluir a equipe técnica e a gestão no plano de formação.', 'Prever conteúdo de risco, custo do ciclo de vida e fiscalização do contrato.'],
    }],
    paraque: 'A rede tem quem governe e mantenha a IA, além de quem a usa.',
    quem: ['formacao', 'pessoas'], marco: 'M1',
    pronto: 'O plano de formação inclui as equipes técnicas e de gestão da secretaria.',
  },
  {
    id: 'R-107', versao: 1, pacote: 'USO', tipo: 'custo', substitui: ['suporte-dedicado'], campos: ['suporteNivel'],
    se: k => k.v('suporteNivel') === 'dedicado' && k.v('suporteQuem') !== 'fornecedor',
    variantes: [{
      oque: 'Reservar o tempo da equipe que fará o suporte dedicado.',
      porque: 'A estimativa conta essas pessoas como custo, mesmo que já sejam da rede; sem reserva, o suporte compete com outras tarefas.',
      como: ['Nomear as pessoas do suporte dedicado.', 'Reservar as horas delas no plano de trabalho da equipe.'],
    }],
    paraque: 'O suporte dedicado existe de fato, com pessoas e horas reservadas.',
    quem: ['tecnologia', 'pessoas'], marco: 'M3',
    semExige: 'Tempo de equipe da própria rede.',
    pronto: 'As pessoas e as horas do suporte dedicado estão reservadas.',
  },
  {
    id: 'R-108', versao: 1, pacote: 'USO', tipo: 'custo', substitui: ['acomp-intensivo'], campos: ['acompanhamento'],
    se: k => k.v('acompanhamento') === 'intensivo',
    variantes: [{
      oque: 'Nomear quem faz o acompanhamento intensivo do uso e reservar o tempo dessa equipe no orçamento.',
      porque: 'Acompanhamento intensivo exige horas de pessoas da rede; sem nome e tempo reservado, ele não acontece.',
      como: ['Nomear a equipe de acompanhamento.', 'Reservar as horas dessa equipe no orçamento do teste.'],
    }],
    paraque: 'O acompanhamento previsto acontece no ritmo combinado.',
    quem: ['avaliacao', 'pessoas'], marco: 'M1',
    semExige: 'Tempo de equipe da própria rede.',
    pronto: 'A equipe de acompanhamento está nomeada e as horas estão reservadas.',
  },
  {
    id: 'R-112', versao: 1, pacote: 'USO', tipo: 'politica', substitui: ['formacao-continua'], campos: ['formacaoTipo'], generica: true,
    se: k => k.arr('formacaoTipo').length > 0,
    variantes: [{
      oque: 'Planejar formação contínua, e não única.',
      porque: 'As ferramentas mudam e as equipes se renovam; uma formação única perde efeito em poucos meses.',
      como: ['Prever encontros de formação ao longo de cada ano de uso.', 'Formar quem entra na rede depois do início.'],
    }],
    paraque: 'As equipes continuam sabendo usar a ferramenta quando ela muda.',
    quem: ['formacao'], marco: 'M5',
    pronto: 'O calendário de formação contínua está no plano de cada ano.',
  },
];
