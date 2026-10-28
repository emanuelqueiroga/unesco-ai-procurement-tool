// Pacote ESCALA: etapas, critérios de avanço e expansão (lente "Decisão e evidência"). Formato: regras/index.js.
// R4 (4a): R-20 a R-24 com os gatilhos do catálogo (seção 6.1): salto de escala (R-20), números para avançar (R-21),
// expansão como opção (R-22), primeira etapa para medir (R-23) e queda de adoção e efeito na escala (R-24).
// Decisão 4: na entrada em ondas, quando todas as escolas recebem depois, o sorteio é o padrão (R-23); no piloto, a
// comparação pareada é o padrão e o sorteio é citado como a melhor opção (R-13, em teste.js). R-25 (risco reavaliado antes de
// cada ampliação, M5) entrou na integração do R4.
import { fmtInt } from '../framework.js';
import { tr } from '../i18n.js';
import { numero, varsRec } from '../rec_numeros.js';
import { grande } from '../custos_ui.js';

const pos = x => (+x > 0 ? +x : 0);
const piloto = k => k.c.piloto || {};
const implEscolas = k => pos((k.c.implantacao || {}).escolas);
const temImplantacao = k => k.implP > 0 || implEscolas(k) > 0;
const pessoasPoc = k => pos((k.c.poc || {}).participantes) || pos(piloto(k).participantes);

// R-20: a implantação chega a metade da rede, ou a 80% das pessoas, ou a 10 vezes as escolas do piloto, ou o teste é só uma
// prova de conceito e há implantação
const SALTO_ESCALA = k => {
  const ie = implEscolas(k), pe = pos(piloto(k).escolas);
  return (ie > 0 && k.escRede > 0 && ie >= 0.5 * k.escRede) || !!k.implTudo || (ie > 0 && pe > 0 && ie / pe >= 10) || (!!k.poc && temImplantacao(k));
};
const SO_POC = k => !!k.poc && temImplantacao(k);
// R-25: a primeira etapa passa de 10 vezes o teste (escolas da etapa ÷ escolas do piloto, ou pessoas ÷ pessoas do teste)
const SALTO_10X = k => {
  const ie = implEscolas(k), pe = pos(piloto(k).escolas), pp = pessoasPoc(k);
  return (ie > 0 && pe > 0 && ie > 10 * pe) || (k.implP > 0 && pp > 0 && k.implP > 10 * pp);
};
const OQUE_25 = 'Refazer a avaliação de risco antes de cada ampliação, sempre que mudarem a etapa, a população atendida, a finalidade ou a autonomia da ferramenta.';
const COMO_25 = ['Listar o que muda em cada ampliação: escolas, população atendida, finalidade, autonomia e dados.',
  'Refazer o perfil de risco com as respostas da nova etapa e rever as condições que dele decorrem.',
  'Decidir a ampliação só com a avaliação de risco atualizada e aprovada.'];

// ----------------------------------------------------------- textos com números do caso (vars e numero)
const T_ESC = '{0} escolas', T_PES = '{0} pessoas', T_ESC_PES = '{0} escolas e {1} pessoas', T_DE_PARA = 'de {0} para {1}', T_PARA = 'para {0}';
const T_VEZES_ESC = '{0} vezes as escolas do piloto', T_VEZES_PES = '{0} vezes as pessoas do teste', T_ROT_SALTO = 'Salto de escala';
const T_ROT_DOT = 'Dotação dos Anos 1 e 2', T_ANO1 = 'Ano 1', T_ANO2 = 'Ano 2';
const sub = (t, ...v) => v.reduce((s, x, i) => s.replace('{' + i + '}', x), tr(t));
/** "de 20 escolas para 800 escolas e 12.000 pessoas": o salto do teste para a primeira etapa ('' sem implantação) */
function textoSalto(k) {
  const ie = implEscolas(k), pe = pos(piloto(k).escolas), pp = pessoasPoc(k);
  const para = ie > 0 ? (k.implP > 0 ? sub(T_ESC_PES, fmtInt(ie), fmtInt(k.implP)) : sub(T_ESC, fmtInt(ie))) : k.implP > 0 ? sub(T_PES, fmtInt(k.implP)) : '';
  if (!para) return '';
  const de = k.poc && pp > 0 ? sub(T_PES, fmtInt(pp)) : pe > 0 ? sub(T_ESC, fmtInt(pe)) : pp > 0 ? sub(T_PES, fmtInt(pp)) : '';
  return de ? sub(T_DE_PARA, de, para) : sub(T_PARA, para);
}
/** o salto como múltiplo (escolas da etapa ÷ escolas do piloto, ou pessoas da etapa ÷ pessoas do teste); null sem base */
function multiploSalto(k) {
  const ie = implEscolas(k), pe = pos(piloto(k).escolas), pp = pessoasPoc(k);
  if (ie > 0 && pe > 0 && !k.poc) return { v: ie / pe, t: T_VEZES_ESC };
  if (k.implP > 0 && pp > 0) return { v: k.implP / pp, t: T_VEZES_PES };
  if (ie > 0 && pe > 0) return { v: ie / pe, t: T_VEZES_ESC };
  return null;
}
const varsDe = (d, chaves) => (d ? varsRec(d, chaves) : {});
/** dotação dos Anos 1 e 2 (d.dot por ano; índice 0 = Ano 0); null sem números */
function dotacaoAnos(d) {
  const D = d && Array.isArray(d.dot) ? d.dot : null;
  if (!D || !(D[1] > 0)) return null;
  const txt = tr(T_ANO1) + ': ' + grande(D[1]) + (D[2] > 0 ? '; ' + tr(T_ANO2) + ': ' + grande(D[2]) : '');
  return { txt, soma: D[1] + (D[2] > 0 ? D[2] : 0) };
}

/** @type {import('./index.js').Regra[]} */
export const REGRAS_ESCALA = [
  {
    id: 'R-20', versao: 2, pacote: 'ESCALA', tipo: 'politica', substitui: ['etapas', 'expansao-rapida'], campos: ['implantacao', 'testes'],
    se: SALTO_ESCALA,
    origem: k => ({ campo: 'implantacao', vals: k.valImpl ? [k.valImpl] : [] }),
    variantes: [
      { quando: SO_POC,
        origem: k => ({ campo: 'testes', vals: k.testes }),
        curto: 'um piloto com usuários reais antes da implantação',
        oque: 'Aprovar agora só a prova de conceito e fazer, antes da implantação, um piloto com usuários reais em poucas escolas.',
        porque: 'A prova de conceito mostra se a ferramenta funciona, não se serve a quem usa; a implantação iria {salto}.',
        como: ['Aprovar agora só a prova de conceito, com critérios de sucesso fixados antes.', 'Planejar um piloto de poucos meses em poucas escolas, com usuários reais e revisão por amostra das respostas.', 'Decidir a implantação só com o relatório do piloto.'] },
      { curto: 'a separação entre o teste e a implantação',
        oque: 'Aprovar agora só o teste, deixando a implantação como segunda decisão, tomada com o relatório e com critérios fixados antes.',
        porque: 'A implantação iria {salto}; um erro em escala custa mais e é difícil de desfazer.',
        como: ['Separar no plano a aprovação do teste e a da implantação.', 'Fixar antes os limiares de uso, resultado contra a linha de base, custo por usuário ativo e incidentes.', 'Pedir o Ano 1 como reserva condicionada ao relatório do teste.'] },
    ],
    vars: k => ({ salto: textoSalto(k) }),
    // sem `emJogo` de propósito: com a dotação do Ano 1 como dinheiro em jogo (+3) R-20 e R-22 empatariam com as Condições de
    // dados e passariam à frente delas nos grupos e no "Faltam"; para ligar o critério, acrescente { emJogo: d.dot[1] } aqui
    numero: k => {
      const m = multiploSalto(k);
      return m ? { id: 'salto', rotulo: tr(T_ROT_SALTO), valor: sub(m.t, fmtInt(Math.round(m.v))), bruto: m.v, fonte: 'Como testar e avaliar', ilustrativo: false, falta: false } : null;
    },
    textosExtras: [T_ESC, T_PES, T_ESC_PES, T_DE_PARA, T_PARA, T_VEZES_ESC, T_VEZES_PES, T_ROT_SALTO],
    paraque: 'A rede só se compromete com a escala depois de ver o teste funcionar.',
    quem: ['gabinete', 'pedagogica', 'avaliacao'], marco: 'M1', pd: 4,
    condicao: () => true, alta: k => k.eleg >= 50000,
    pronto: 'A aprovação cobre só o teste; a implantação, os critérios para avançar e a data da decisão seguinte estão registrados.',
  },
  {
    id: 'R-21', versao: 2, pacote: 'ESCALA', tipo: 'politica', substitui: ['implantacao-criterios'], campos: ['implantacao'],
    se: k => k.implP > 0,
    origem: k => ({ campo: 'implantacao', vals: k.valImpl ? [k.valImpl] : [] }),
    variantes: [{
      oque: 'Fixar antes os números para avançar (adoção, efeito com margem, custo por usuário ativo, nenhum grupo pior) numa tabela avançar, ajustar ou parar.',
      porque: 'Sem número fixado antes, a passagem à expansão vira opinião ou pressão do fornecedor; custo estimado por usuário ativo em regime: {regimeAtivo}.',
      como: ['Fixar um valor para cada critério: adoção, efeito com margem, custo por usuário ativo em regime e nenhum grupo pior.', 'Escrever o que acontece em cada caso: avançar, ajustar ou parar.', 'Juntar a tabela ao processo antes de começar a primeira etapa.'],
    }],
    vars: (k, d) => varsDe(d, ['regimeAtivo']),
    numero: (k, d) => numero('regimeAtivo', d),
    paraque: 'A decisão de expandir segue critérios conhecidos antes do resultado.',
    quem: ['gabinete'], marco: 'M3', pd: 4, curto: 'os números para avançar à expansão',
    condicao: () => true,
    pronto: 'A tabela avançar, ajustar ou parar, com um valor por critério, está aprovada e juntada ao processo.',
  },
  {
    id: 'R-22', versao: 2, pacote: 'ESCALA', tipo: 'politica', substitui: ['expansao-rapida'], campos: ['expansao'],
    se: k => k.v('expansao') === 'ano1' || (implEscolas(k) > 0 && k.escRede > implEscolas(k)) || (k.implP > 0 && k.eleg > k.implP),
    variantes: [{
      oque: 'Contratar a expansão como opção, por etapas, sem compromisso mínimo e com preço fixado, e marcar a decisão para depois do resultado.',
      porque: 'Com a rede toda no Ano 1, o Ano 2 começa antes do resultado do Ano 1; dotação prevista: {dotacaoAnos}.',
      como: ['Marcar a data da decisão de expansão para depois do relatório da primeira etapa.', 'Contratar a expansão como opção, sem compromisso mínimo.', 'Fixar no contrato o preço de cada etapa e as regras de reajuste.'],
    }],
    vars: (k, d) => { const x = dotacaoAnos(d); return x ? { dotacaoAnos: x.txt } : {}; },
    numero: (k, d) => { const x = dotacaoAnos(d); return x ? { id: 'dotacaoAnos', rotulo: tr(T_ROT_DOT), valor: x.txt, bruto: x.soma, fonte: 'Quanto custa', ilustrativo: false, falta: false } : numero('dotacao', d); },
    textosExtras: [T_ROT_DOT, T_ANO1, T_ANO2],
    paraque: 'A expansão acontece com o resultado da primeira etapa em mãos.',
    quem: ['gabinete', 'compras'], marco: 'M3', pd: 8, curto: 'a expansão contratada como opção, depois do resultado',
    condicao: k => k.eleg >= 10000,
    exige: ['CONTRATO.custo-reajuste'],
    exemplosNorma: { BR: ['Lei 14.133/2021, art. 82 (registro de preços)'], UE: ['Diretiva 2014/24/UE, art. 33 (acordos-quadro)'] },
    pronto: 'O cronograma mostra a decisão de expansão depois do resultado da primeira etapa, e o contrato traz a expansão como opção, sem mínimo.',
  },
  {
    id: 'R-23', versao: 1, pacote: 'ESCALA', tipo: 'politica', substitui: [], campos: ['implantacao', 'expansao'],
    se: k => (implEscolas(k) > 0 && k.escRede > implEscolas(k)) || (!!k.implTudo && Math.max(implEscolas(k), k.escRede) >= 2),
    origem: k => ({ campo: 'implantacao', vals: k.valImpl ? [k.valImpl] : [] }),
    variantes: [{
      oque: 'Sortear quais escolas entram no Ano 1 e quais esperam o Ano 2, e medir os dois grupos nas mesmas datas.',
      porque: 'É a única chance de ter evidência causal na escala; efeito mínimo detectável da primeira etapa: {mdesEtapa}.',
      como: ['Prever no contrato as ondas de entrada, sem multa para quem espera.', 'Fazer um sorteio público das escolas, em grupos de perfil parecido, e registrar o resultado.', 'Aplicar a mesma medida nas duas ondas e decidir a segunda só depois do resultado.', 'Se alguma escola não vier a receber a ferramenta, usar escolas parecidas como comparação.'],
    }],
    vars: (k, d) => varsDe(d, ['mdesEtapa']),
    numero: (k, d) => numero('mdesEtapa', d),
    paraque: 'A primeira etapa mostra o efeito da ferramenta na escala, e não só o uso.',
    quem: ['gabinete', 'avaliacao', 'compras'], marco: 'M3', pd: 4,
    irreversivel: true, exige: ['CONTRATO.custo-reajuste'],
    pronto: 'O sorteio das escolas e as ondas de entrada estão previstos no plano e no contrato, com a mesma medida nas duas ondas.',
  },
  {
    id: 'R-24', versao: 1, pacote: 'ESCALA', tipo: 'politica', substitui: [], campos: ['expansao', 'elegiveis'],
    se: k => (k.implP > 0 && k.eleg > k.implP) || !!k.v('expansao'),
    origem: k => (k.v('expansao') ? { campo: 'expansao', vals: [k.v('expansao')] } : { campo: 'elegiveis', vals: k.valEleg ? [k.valEleg] : [] }),
    variantes: [{
      oque: 'Planejar a escala supondo adoção e efeito menores que no teste, e dar ao teste só o acompanhamento previsto para a escala.',
      porque: 'Atenção do fornecedor e novidade inflam o piloto; adoção prevista na escala: {adocao}, e o efeito também tende a cair.',
      como: ['Dar ao teste o mesmo acompanhamento previsto para a escala.', 'Usar nas contas de escala adoção e efeito menores que os do teste, como premissa escrita.', 'Medir de novo na primeira etapa e comparar com o teste.'],
    }],
    vars: (k, d) => varsDe(d, ['adocao']),
    numero: (k, d) => numero('adocao', d),
    paraque: 'A escala é planejada com adoção e efeito realistas, e não com os do piloto.',
    quem: ['gabinete', 'avaliacao'], marco: 'M3', pd: 4,
    pronto: 'As premissas de adoção e efeito da escala estão escritas e a primeira etapa vai medi-las de novo.',
  },
  {
    // R-25 (ETI-R23; integração do R4): risco elevado ou crítico com expansão no Ano 1 ou implantação mais de 10 vezes maior
    // que o teste. Marco M5 e nível "Para acompanhar" (catálogo 6.1): é o critério "risco reavaliado" do portão G4 (4.5).
    id: 'R-25', versao: 1, pacote: 'ESCALA', tipo: 'politica', substitui: [], campos: ['expansao', 'implantacao'],
    se: k => !!k.alto && (k.v('expansao') === 'ano1' || SALTO_10X(k)),
    origem: k => (k.v('expansao') === 'ano1' ? { campo: 'expansao', vals: ['ano1'] } : { campo: 'implantacao', vals: k.valImpl ? [k.valImpl] : [] }),
    variantes: [
      { quando: k => !!textoSalto(k),
        oque: OQUE_25,
        porque: 'O que foi seguro no teste pode não ser na escala, que traz pessoas e contextos novos; a ampliação iria {salto}.',
        como: COMO_25 },
      { oque: OQUE_25,
        porque: 'O que foi seguro no teste pode não ser na escala, com mais pessoas e contextos que o teste não cobriu.',
        como: COMO_25 },
    ],
    vars: k => ({ salto: textoSalto(k) }),
    paraque: 'Cada ampliação começa com os riscos da nova escala conhecidos e tratados.',
    quem: ['gabinete'], marco: 'M5', pd: 8, curto: 'a avaliação de risco refeita antes de cada ampliação',
    pronto: 'A avaliação de risco refeita para a nova etapa está aprovada e juntada ao processo de cada ampliação.',
  },
];
