// v018: textos da página "Como o custo é calculado" (governança). O português é a chave de tradução (t(variável):
// traduzidos em en, es e fr; nos demais idiomas aparecem em inglês). Resume a nota técnica do modelo de custeio.
export const NOTA_PDF = { pt: 'arquivos/nota-tecnica-modelo-custeio-governanca-v018.pdf', en: 'arquivos/technical-note-governance-costing-model-v018.pdf' };
export const PLANILHA = { pt: 'arquivos/modelo-custeio-governanca-v018.xlsx', en: 'arquivos/governance-costing-model-v018.xlsx' };

/** Uma parcela do custo: a fórmula (símbolos) e o que cada termo significa. */
export interface Parcela { titulo: string; formula: string[]; termos: [string, string][]; nota?: string }

export const MET = {
  lead: 'O custo da governança é estimado opção por opção, com contas explícitas e parâmetros que você vê e pode ajustar. Os salários vêm de estatística oficial de cada país; os percentuais e o prêmio de especialista, de fontes públicas.',
  arquivos: 'A nota técnica traz as equações, todos os parâmetros, as fontes e um exemplo completo. A planilha refaz as contas para qualquer país.',
  figura: 'O custo total soma as opções e três percentuais sobre elas',
  hParcelas: 'Como cada parcela é calculada',
  parcelas: [
    { titulo: 'Custo total', formula: ['C = D + V + O + T'], termos: [
      ['D', 'custo direto: a soma das opções escolhidas que já têm valor'],
      ['V, O, T', 'viagens e atividades presenciais, overhead e taxa administrativa, calculados sobre D'],
    ] },
    { titulo: 'Custo direto', formula: ['D = Σ Cₒ'], termos: [
      ['Cₒ', 'custo de cada opção, calculado conforme o tipo (abaixo); opções sem valor ficam fora de D e aparecem como "falta valor"'],
    ] },
    { titulo: 'Opções com equipe de referência (25 opções)', formula: ['Cₒ = M × Σ (q × d × c)', 'c = w × I × (1 + e) × (1 + p × s)'], termos: [
      ['M', 'meses de trabalho: de 4 a 12 nas opções pontuais (uma norma, uma diretriz, um sandbox); a duração do plano nas contínuas (supervisão, comitês, gestão de dados)'],
      ['q, d', 'pessoas e dedicação de cada papel da equipe (100% = tempo integral)'],
      ['c', 'custo mensal de uma pessoa no papel'],
      ['w', 'salário médio mensal do país para o grande grupo ocupacional do papel (ILOSTAT, OIT, ISCO-08); sem dado do país, a mediana dos países da mesma região e do mesmo grupo de renda do Banco Mundial'],
      ['I', 'atualização do salário do ano do dado até 2026 pela inflação ao consumidor do país (FMI, World Economic Outlook)'],
      ['e', 'contribuição patronal obrigatória à seguridade social do país (SSA e ISSA)'],
      ['p, s', 'prêmio salarial de especialista (28%, Lightcast, 2025), aplicado só aos papéis que exigem competências de IA, dados ou segurança digital (s = 1); nos demais, s = 0'],
    ] },
    { titulo: 'Pessoal em tempo integral (3.1)', formula: ['Cₒ = n × c × H'], termos: [
      ['n', 'pessoas em tempo integral, informadas por você'],
      ['c', 'custo mensal do perfil de profissionais (ISCO-08, grupo 2), calculado como acima; com prêmio de especialista nas opções de IA, dados e TI'],
      ['H', 'duração do plano, em meses'],
    ] },
    { titulo: 'Formação (3.2)', formula: ['Cₒ = participantes × horas × custo da hora'], termos: [
      ['custo da hora', 'US$ 12 por hora-participante, convertido pelo câmbio; estimativa de referência, que você pode substituir pelo valor do seu contrato'],
    ] },
    { titulo: 'Infraestrutura e hospedagem (2.2)', formula: ['Cₒ = valor informado'], termos: [
      ['valor informado', 'total da cotação ou do contrato: o preço depende do fornecedor, do volume de dados e do modelo de contratação'],
    ] },
    { titulo: 'Viagens e atividades presenciais', formula: ['V = 25% × D'], termos: [
      ['25%', 'parcela de viagens, oficinas e reuniões técnicas nos orçamentos de programas do Fundo Global (24,7% a 28,2%); vale 0 se o plano não tiver atividades presenciais'],
    ] },
    { titulo: 'Overhead (custos indiretos)', formula: ['O = 15% × (D + V)'], termos: [
      ['15%', 'limite dos EUA para custos indiretos sem taxa negociada (2 CFR 200.414(f)); vale 0 se a instituição já cobre espaço, TI, RH e contabilidade'],
    ] },
    { titulo: 'Taxa administrativa', formula: ['T = 7% × (D + V)'], termos: [
      ['7%', 'taxa dos fundos conjuntos da ONU (política do UNSDG); vale 0 se o próprio órgão executa o recurso; com fundação de apoio, a taxa do contrato'],
    ] },
  ] as Parcela[],
  hDesembolso: 'Custo do plano e desembolso novo',
  desembolso: 'O custo do plano inclui o trabalho de todas as pessoas, mesmo as que já são servidoras. Em "Ajustar a equipe", marque os papéis ocupados por servidores que já existem: o resumo mostra também o desembolso novo, que é o custo do plano sem esses servidores.',
  hAjustes: 'Como o modelo trata as principais incertezas',
  ajustes: [
    'Especialistas em IA, dados e segurança digital ganham acima da média do seu grupo ocupacional: o modelo aplica o prêmio de 28% (Lightcast, 2025); a PwC (2025) encontrou até 56% para vagas que exigem competências de IA.',
    'Os salários do ILOSTAT são de anos diferentes, conforme o país: o modelo atualiza cada valor até 2026 pela inflação ao consumidor do país, segundo o FMI.',
    'Países sem dado próprio no ILOSTAT usam a mediana dos países da mesma região e do mesmo grupo de renda; sem estimativa regional, a mediana mundial.',
    'A composição das equipes, a dedicação e os meses foram definidos para cada tipo de trabalho e comparados com casos públicos (AI Act, sandbox da Noruega, órgão de proteção de dados do Quênia); os valores podem ter leve variação conforme o contexto e podem ser ajustados papel a papel.',
    'Se a mesma pessoa coordenar mais de uma opção, ajuste as pessoas ou a dedicação da coordenação em cada equipe.',
  ],
  hGraus: 'Graus de confiança',
  graus: 'A = estatística oficial (ILOSTAT, SSA e ISSA, FMI); B = estudo ou caso real com fonte (percentuais adicionais, prêmio de especialista, medianas regionais); C = estimativa da ferramenta, que pode variar conforme o contexto (composição das equipes, custo da hora de formação).',
  // rótulos da figura
  fTotal: 'Custo total', fDireto: 'Custo direto, D', fDireto2: 'soma das opções com valor', fViagens: 'Viagens, V', fOverhead: 'Overhead, O', fTaxa: 'Taxa administrativa, T',
  fEquipe: 'Equipe de referência', fEquipe2: '25 opções: M × Σ q × d × c', fPessoal: 'Pessoal integral', fForm: 'Formação', fForm2: '3.2: p × h × custo da hora',
  fInf: 'Valor informado', fInf2: '2.2: cotação ou contrato', fMeses: 'Meses, M', fMeses2: '4 a 12, ou H se contínua', fPessoas: 'Pessoas × dedicação',
  fPessoas2: 'por papel da equipe', fMensal: 'Custo mensal, c',
};
