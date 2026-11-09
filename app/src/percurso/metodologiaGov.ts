// v018: textos da página "Como o custo é calculado" (governança). O português é a chave de tradução (t(variável):
// traduzidos em en, es e fr; nos demais idiomas aparecem em inglês). Resume a nota técnica do modelo de custeio.
export const NOTA_PDF = { pt: 'arquivos/nota-tecnica-modelo-custeio-governanca-v018.pdf', en: 'arquivos/technical-note-governance-costing-model-v018.pdf' };
export const PLANILHA = { pt: 'arquivos/modelo-custeio-governanca-v018.xlsx', en: 'arquivos/governance-costing-model-v018.xlsx' };

export const MET = {
  lead: 'O custo da governança vem de um modelo de custeio paramétrico: cada opção é uma conta explícita, com parâmetros que você vê e pode trocar. Nenhum valor é estimado por regressão.',
  arquivos: 'A nota técnica traz as equações, todos os parâmetros, as fontes e um exemplo completo. A planilha refaz as contas para qualquer país.',
  figura: 'O custo total soma as opções e três percentuais sobre elas',
  hGeral: 'Equação geral',
  geral: 'O custo total C é o custo direto D (a soma das opções que já têm valor) mais viagens V, overhead O e taxa administrativa T. Opções sem valor ficam fora de D e aparecem como "falta valor".',
  hEquipe: 'Opções com equipe de referência',
  equipe: 'Em 25 opções, o custo é a equipe de referência: para cada papel, pessoas × dedicação × custo mensal do perfil, vezes os meses de trabalho.',
  equipeItens: [
    'Meses: de 4 a 12 nas opções pontuais (uma norma, uma diretriz, um sandbox); nas contínuas (supervisão, comitês, gestão de dados), toda a duração do plano.',
    'Custo mensal do perfil: salário médio mensal do país para o grande grupo da ISCO-08 (ILOSTAT, OIT), vezes 1 + a contribuição patronal do país (SSA e ISSA).',
    'País sem dado no ILOSTAT: mediana dos países da mesma região e do mesmo grupo de renda do Banco Mundial (grau B).',
    'A composição das equipes, a dedicação e os meses são convenção da ferramenta (grau C), comparada com casos públicos (AI Act, sandbox da Noruega, órgão de dados do Quênia).',
  ],
  hDemais: 'Demais opções',
  demais: [
    ['Pessoal em tempo integral (3.1)', 'pessoas × salário do perfil 2 × encargos × meses do plano; em "Especialistas em TI", US$ 45.000 por ano (grau C)'],
    ['Formação (3.2)', 'participantes × horas × US$ 12 por hora (grau C)'],
    ['Infraestrutura e hospedagem (2.2)', 'valor informado por você, de cotação ou contrato; sem referência de preço'],
  ] as [string, string][],
  hAdic: 'Custos adicionais',
  adic: 'Viagens incidem sobre D; overhead e taxa administrativa, sobre D + V. Cada um tem uma pergunta que diz se ele se aplica e um padrão com fonte pública (grau B).',
  adicItens: [
    ['Viagens e atividades presenciais', '25% × D', 'Fundo Global: custos de viagem são 24,7% a 28,2% dos orçamentos dos programas'],
    ['Overhead (custos indiretos)', '15% × (D + V)', 'EUA, 2 CFR 200.414(f): até 15% dos custos diretos'],
    ['Taxa administrativa', '7% × (D + V)', 'Política do UNSDG para fundos conjuntos da ONU: 7%'],
  ] as [string, string, string][],
  hTotais: 'Duração, câmbio e totais',
  totais: 'A governança tem um período só, de 12 meses por padrão. Salários em moeda local, quando o plano usa a moeda do país; nos outros casos, US$ × câmbio (ExchangeRate-API ou o informado no caso). Cada linha é "informado", "estimado" (usa alguma referência) ou "falta valor"; o custo conhecido soma as duas primeiras.',
  hLimites: 'Limites do modelo',
  limites: [
    'O salário médio do ILOSTAT cobre todo o grupo ocupacional; especialistas em IA, direito digital e dados costumam ganhar mais, e o custo tende a ficar abaixo do real.',
    'Os salários vão de 2015 a 2025, conforme o país, sem correção pela inflação.',
    'Os encargos não incluem benefícios pagos diretamente pelo empregador (13º, férias, plano de saúde).',
    'Uma pessoa no mesmo papel em mais de uma opção é contada em cada uma.',
    'Servidores que já existem entram como custo: o plano mostra o custo do trabalho, não o desembolso novo.',
  ],
  // rótulos da figura
  fTotal: 'Custo total', fDireto: 'Custo direto, D', fDireto2: 'soma das opções com valor', fViagens: 'Viagens, V', fOverhead: 'Overhead, O', fTaxa: 'Taxa administrativa, T',
  fEquipe: 'Equipe de referência', fEquipe2: '25 opções: M × Σ q × d × c', fPessoal: 'Pessoal integral', fForm: 'Formação', fForm2: '3.2: p × h × US$ 12 × x',
  fInf: 'Valor informado', fInf2: '2.2: cotação ou contrato', fMeses: 'Meses, M', fMeses2: '4 a 12, ou H se contínua', fPessoas: 'Pessoas × dedicação',
  fPessoas2: 'por papel (grau C)', fMensal: 'Custo mensal, c',
};
