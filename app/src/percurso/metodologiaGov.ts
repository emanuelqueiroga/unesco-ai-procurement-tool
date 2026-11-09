// v018: textos da página "Como o custo é calculado" (governança), em duas partes: uma explicação em linguagem simples,
// com um exemplo fictício conta a conta, e o modelo técnico completo (notação, equações, parâmetros, regras de dados,
// equipes de referência, incertezas, graus e referências). O português é a chave de tradução (t(variável):
// traduzidos em en, es e fr; nos demais idiomas aparecem em inglês). As fórmulas ficam em tex(String.raw`…`) ou entre
// colchetes duplos no meio do texto ([[…]]) e são desenhadas em MathML (formulasMet.ts, gerado a partir destes textos).
export const NOTA_PDF = { pt: 'arquivos/nota-tecnica-modelo-custeio-governanca-v018.pdf', en: 'arquivos/technical-note-governance-costing-model-v018.pdf' };
export const PLANILHA = { pt: 'arquivos/modelo-custeio-governanca-v018.xlsx', en: 'arquivos/governance-costing-model-v018.xlsx' };

/** Marca uma fórmula em LaTeX (a chave do MathML em formulasMet.ts). */
const tex = (s: string) => s;

/** Exemplo fictício: um país hipotético, com valores redondos em US$ (sem câmbio). Os números saem destas contas. */
export const EXEMPLO = { w1: 3000, w2: 2000, w4: 1200, ano: 2024, pi: [0.04, 0.03], e: 0.2, p: 0.28, meses: 8, h: 12,
  nIntegral: 2, participantes: 200, horas: 20, hora: 12, cotacao: 60000, pV: 0.25, pO: 0.15, pT: 0.07 };
const cent = (v: number) => Math.round(v * 100) / 100;
export function contasExemplo() {
  const x = EXEMPLO, I = Math.round((1 + x.pi[0]) * (1 + x.pi[1]) * 10000) / 10000;
  const w2i = cent(x.w2 * I), c1 = cent(x.w1 * I * (1 + x.e)), c2 = cent(x.w2 * I * (1 + x.e)), c4 = cent(x.w4 * I * (1 + x.e));
  const c2e = cent(x.w2 * I * (1 + x.e) * (1 + x.p));
  const r1 = cent(1 * 0.5 * c1), r2 = cent(2 * 1 * c2e), r3 = cent(1 * 0.5 * c2), r4 = cent(1 * 0.5 * c4);
  const mensal = cent(r1 + r2 + r3 + r4), norma = cent(x.meses * mensal);
  const integral = cent(x.nIntegral * c2e * x.h), formacao = cent(x.participantes * x.horas * x.hora), D = cent(norma + integral + formacao + x.cotacao);
  const V = cent(x.pV * D), O = cent(x.pO * (D + V)), T = cent(x.pT * (D + V)), C = cent(D + V + O + T);
  const existente = cent(x.meses * 0.5 * c1), desembolso = cent(C - existente);
  return { I, w2i, c1, c2, c4, c2e, r1, r2, r3, r4, mensal, norma, integral, formacao, D, V, O, T, C, existente, desembolso };
}

export interface Passo { titulo: string; textos: string[]; exemplo: string[] }
export interface Equacao { titulo: string; tex: string[]; texto: string }

export const MET = {
  lead: 'O custo da governança é estimado opção por opção, com contas explícitas e parâmetros públicos. Esta página explica o cálculo em duas partes: primeiro em linguagem simples, com um exemplo fictício conta a conta; depois o modelo técnico completo, com a notação, as equações, os parâmetros e as fontes.',
  arquivos: 'A nota técnica traz o mesmo modelo, com um caso completo. A planilha refaz as contas para qualquer país.',
  indice: 'Nesta página',
  hSimples: 'Em linguagem simples',
  simples: [
    'Quase todo o custo da governança é trabalho de pessoas: quem redige uma norma, quem supervisiona o uso de IA, quem coordena um comitê. Por isso, a conta parte de uma pergunta simples, que é quanto custa, por mês, ter cada pessoa necessária trabalhando no tema, e de quantos meses de trabalho cada opção precisa.',
    'Cada opção escolhida no plano tem a sua conta. A soma das opções é o custo direto, e sobre ele entram três custos que todo projeto público tem: viagens e atividades presenciais, custos indiretos da instituição e taxa de quem administra o recurso. A figura mostra esse caminho, do total até os dados de origem.',
  ],
  figura: 'O custo total soma as opções e três percentuais sobre elas',
  exemploIntro: 'Para mostrar cada conta, usamos um exemplo fictício: um país hipotético que planeja em dólares, com valores redondos escolhidos só para facilitar a leitura. Num plano real, a ferramenta usa os dados oficiais do país escolhido e a cotação do dia.',
  rotExemplo: 'Exemplo fictício',
  passos: [
    { titulo: '1. Quanto ganha, por mês, quem faz o trabalho',
      textos: [
        'O ponto de partida é o salário médio mensal no país para o tipo de ocupação de cada papel. A ferramenta usa quatro grandes grupos da classificação internacional de ocupações: diretores e gerentes, profissionais de nível superior, técnicos de nível médio e apoio administrativo. Uma coordenação está no primeiro grupo; um especialista em direito digital, no segundo.',
        'Os salários vêm do ILOSTAT, a base de estatísticas do trabalho da Organização Internacional do Trabalho, que reúne as pesquisas oficiais de emprego de cada país. Quando o país não tem dado próprio, usa-se a mediana de países parecidos, da mesma região e do mesmo grupo de renda do Banco Mundial, e, na falta dela, a mediana mundial.',
      ],
      exemplo: ['No país fictício, o salário médio dos profissionais de nível superior é de {w2} por mês, em dado de {ano}. O de diretores e gerentes é de {w1}, e o de apoio administrativo, de {w4}.'] },
    { titulo: '2. Trazer o salário para valores de hoje',
      textos: ['As pesquisas salariais são de anos diferentes, conforme o país. Para que todos os valores fiquem em preços de 2026, o salário é corrigido pela inflação de cada ano entre o dado e 2026, segundo o Fundo Monetário Internacional. É a mesma correção que se faz ao atualizar um aluguel ou um contrato.'],
      exemplo: ['Com inflação de {pi1} em 2025 e de {pi2} em 2026, o fator de correção é {f1} × {f2} = {I}, e o salário de {w2} passa a {w2i}.'] },
    { titulo: '3. Somar o que o empregador paga além do salário',
      textos: ['Contratar uma pessoa custa mais do que o salário, porque o empregador paga contribuições obrigatórias à seguridade social. A ferramenta acrescenta a contribuição patronal de cada país, segundo o levantamento internacional da Administração da Seguridade Social dos Estados Unidos com a Associação Internacional de Seguridade Social. O resultado é o custo mensal de uma pessoa naquele grupo.'],
      exemplo: ['Com contribuição patronal de {e}, o custo mensal de um profissional de nível superior é {w2i} × {fe} = {c2}. Pela mesma conta, uma pessoa de coordenação custa {c1} por mês, e uma de apoio administrativo, {c4}.'] },
    { titulo: '4. Especialistas ganham mais que a média',
      textos: ['O salário médio de um grupo inclui profissionais de muitas áreas, e quem tem competências de IA, dados ou segurança digital costuma ganhar mais. Por isso, nos papéis que exigem essas competências, a ferramenta acrescenta 28%, que é a diferença salarial medida em 1,3 bilhão de anúncios de emprego entre vagas que pedem e que não pedem competências de IA (Lightcast, 2025). É um valor prudente: outro estudo, da PwC (2025), encontrou até 56%.'],
      exemplo: ['O custo mensal de um especialista em direito digital é {c2} × {fp} = {c2e}.'] },
    { titulo: '5. Montar a equipe e contar os meses',
      textos: [
        'Para cada opção de trabalho, a ferramenta tem uma equipe de referência, montada como um coordenador montaria o time: quem lidera, os especialistas de cada área e o apoio, com o número de pessoas e a parcela do tempo de cada uma (100% é tempo integral). O custo mensal da equipe é a soma, papel a papel, de pessoas × parcela do tempo × custo mensal.',
        'O custo da opção é o custo mensal da equipe vezes os meses de trabalho. Opções pontuais, como uma norma ou uma diretriz, têm de 4 a 12 meses; opções contínuas, como a supervisão ou um comitê, duram todo o plano. As equipes e os meses foram comparados com casos públicos, como o AI Act europeu e o sandbox de IA da Noruega, e podem ser ajustados papel a papel.',
      ],
      exemplo: [
        'Uma norma fictícia, com {meses} meses de trabalho, tem coordenação a 50% ({r1}), dois especialistas em direito digital em tempo integral ({r2}), um especialista em políticas educacionais a 50% ({r3}) e apoio administrativo a 50% ({r4}).',
        'O custo mensal da equipe é {mensal}, e o custo da opção é {meses} × {mensal} = {norma}.',
      ] },
    { titulo: '6. Opções que não usam equipe de referência',
      textos: ['Três tipos de opção têm contas mais diretas, nas quais a quantidade é informada por quem faz o plano. O pessoal em tempo integral é o número de pessoas vezes o custo mensal vezes a duração do plano. A formação é o número de participantes vezes as horas vezes o custo da hora, estimado em US$ 12 por hora-participante e substituível pelo valor do contrato. A infraestrutura e a hospedagem entram pelo valor da cotação ou do contrato, porque o preço depende do fornecedor e do volume de dados.'],
      exemplo: [
        'Dois especialistas de TI em tempo integral por {h} meses: 2 × {c2e} × {h} = {integral}.',
        'Formação de {participantes} servidores por {horas} horas: {participantes} × {horas} × US$ 12 = {formacao}. Hospedagem cotada em {cotacao}.',
      ] },
    { titulo: '7. Somar as opções e acrescentar os custos de todo projeto',
      textos: [
        'A soma das opções é o custo direto. Sobre ele entram viagens e atividades presenciais (25%, a parcela média nos orçamentos de programas do Fundo Global), custos indiretos da instituição, como espaço, TI, RH e contabilidade (15%, o limite usado pelo governo dos Estados Unidos), e a taxa de quem administra o recurso (7%, a taxa dos fundos conjuntos da ONU).',
        'Os custos indiretos e a taxa incidem sobre o custo direto mais as viagens. Cada um tem uma pergunta no plano: se não houver atividades presenciais, se a instituição já cobrir os custos indiretos ou se o próprio órgão executar o recurso, o percentual correspondente vale zero.',
      ],
      exemplo: [
        'Custo direto: {norma} + {integral} + {formacao} + {cotacao} = {D}.',
        'Viagens e atividades presenciais: 25% × {D} = {V}.',
        'Custos indiretos: 15% × ({D} + {V}) = {O}.',
        'Taxa administrativa: 7% × ({D} + {V}) = {T}.',
        'Custo total: {D} + {V} + {O} + {T} = {C}.',
      ] },
    { titulo: '8. Custo do plano e dinheiro novo',
      textos: ['O custo do plano mede todo o trabalho necessário, inclusive o de pessoas que já são servidoras. Para saber quanto dinheiro novo será preciso, quem faz o plano marca, em cada equipe, os papéis já ocupados por servidores. A ferramenta mostra então o desembolso novo, que é o custo do plano sem o trabalho desses servidores.'],
      exemplo: ['Se a coordenação da norma for feita por uma servidora que já existe, o desembolso novo é {C} − {meses} × 50% × {c1} = {desembolso}.'] },
  ] as Passo[],

  hTecnico: 'Modelo técnico',
  tecnico: 'O modelo é determinístico e paramétrico: cada linha de custo é o produto de quantidades, definidas pela equipe de referência ou informadas no plano, por preços unitários obtidos de estatística oficial ou de fonte pública, e os custos adicionais são percentuais sobre a soma das linhas. Todos os valores são arredondados ao centavo em cada linha. A seguir, a notação, as equações, os parâmetros com valor, fonte e grau de confiança, as regras de tratamento dos dados e as equipes de referência.',
  hNotacao: 'Notação',
  cabNotacao: ['Símbolo', 'Significado', 'Unidade'],
  notacao: [
    [tex(String.raw`C`), 'Custo total do plano de governança', 'moeda do plano'],
    [tex(String.raw`D`), 'Custo direto: soma das opções que já têm valor', 'moeda do plano'],
    [tex(String.raw`C_o`), 'Custo da opção o', 'moeda do plano'],
    [tex(String.raw`V,\ O,\ T`), 'Viagens e atividades presenciais, custos indiretos (overhead) e taxa administrativa', 'moeda do plano'],
    [tex(String.raw`H`), 'Duração do plano (padrão de 12 meses)', 'meses'],
    [tex(String.raw`M_o`), 'Meses de trabalho da opção o', 'meses'],
    [tex(String.raw`R_o`), 'Papéis da equipe de referência da opção o', '—'],
    [tex(String.raw`q_r,\ d_r`), 'Pessoas e dedicação do papel r', 'pessoas; fração do tempo'],
    [tex(String.raw`g(r)`), 'Grande grupo ocupacional do papel r (ISCO-08: 1 a 4)', '—'],
    [tex(String.raw`c_r`), 'Custo mensal de uma pessoa no papel r', 'moeda do plano por mês'],
    [tex(String.raw`w_g`), 'Salário médio mensal do grupo g no país, no ano do dado', 'moeda do plano por mês'],
    [tex(String.raw`I`), 'Fator de atualização pela inflação, do ano do dado até 2026', 'índice'],
    [tex(String.raw`\pi_t`), 'Inflação anual ao consumidor no ano t', 'fração'],
    [tex(String.raw`e`), 'Contribuição patronal obrigatória sobre a folha', 'fração'],
    [tex(String.raw`p,\ s_r`), 'Prêmio de especialista e indicador do papel especializado', 'fração; 0 ou 1'],
    [tex(String.raw`x`), 'Câmbio: unidades da moeda do plano por US$', 'moeda por US$'],
    [tex(String.raw`p_V,\ p_O,\ p_T`), 'Percentuais de viagens, overhead e taxa administrativa', 'fração'],
    [tex(String.raw`\delta_V,\ \delta_O,\ \delta_T`), 'Indicadores de que cada custo adicional se aplica ao plano', '0 ou 1'],
  ] as [string, string, string][],
  hEquacoes: 'Equações',
  equacoes: [
    { titulo: 'Custo total e custo direto', tex: [tex(String.raw`C = D + V + O + T`), tex(String.raw`D = \sum_{o \in \mathcal{O}^{*}} C_o`)],
      texto: 'O conjunto [[\\mathcal{O}^{*}]] reúne as opções escolhidas que já têm valor. Uma opção sem quantidade, preço ou meses fica fora de [[D]] e aparece como pendência ("falta valor"); valores em moedas diferentes nunca são somados.' },
    { titulo: 'Opções com equipe de referência (25 opções)', tex: [tex(String.raw`C_o = M_o \sum_{r \in R_o} q_r \, d_r \, c_r`), tex(String.raw`M_o = \begin{cases} m_o, & o \in \mathcal{P} \\ H, & o \in \mathcal{K} \end{cases}`)],
      texto: 'As opções pontuais ([[\\mathcal{P}]]) têm meses de referência [[m_o]] de 4 a 12 e entram com todos eles, mesmo que ultrapassem [[H]]; as contínuas ([[\\mathcal{K}]]) duram o plano inteiro. Pessoas, dedicação, meses e custo mensal de cada papel podem ser substituídos por valores informados.' },
    { titulo: 'Custo mensal de um papel', tex: [tex(String.raw`c_r = w_{g(r)} \cdot I \cdot (1 + e) \cdot (1 + p \, s_r)`)],
      texto: 'O indicador [[s_r]] vale 1 nos 26 papéis que exigem competências de IA, dados ou segurança digital (marcados com asterisco na tabela das equipes) e 0 nos demais. O custo mensal é arredondado ao centavo antes de multiplicar pelas quantidades.' },
    { titulo: 'Salário do país', tex: [tex(String.raw`w_g = \begin{cases} w_g^{\mathrm{LCU}}, & \text{(a)} \\ x \cdot w_g^{\mathrm{USD}}, & \text{(b)} \\ x \cdot \tilde{w}_{g}, & \text{(c)} \end{cases}`)],
      texto: '(a) O país tem dado próprio e o plano usa a moeda do país: vale o valor em moeda local (LCU). (b) O país tem dado próprio e o plano usa outra moeda: vale o valor em US$ publicado pela própria OIT para o ano do dado, convertido pelo câmbio. (c) O país não tem dado próprio: vale a mediana em US$ dos países com dado da mesma região e do mesmo grupo de renda (no mínimo três países), ou só do mesmo grupo de renda; sem país ou fora da base, a mediana mundial do grupo, sem encargos.' },
    { titulo: 'Atualização pela inflação', tex: [tex(String.raw`I = \prod_{t = a + 1}^{2026} \left(1 + \pi_t\right)`)],
      texto: 'O ano [[a]] é o do dado salarial. No caso (a), usa-se a inflação do país; no caso (b), a dos Estados Unidos, porque o valor está em US$. As medianas do caso (c) não são atualizadas ([[I = 1]]). Anos sem dado no FMI contam inflação zero.' },
    { titulo: 'Pessoal em tempo integral (categoria 3.1)', tex: [tex(String.raw`C_o = n_o \cdot w_2 \cdot I \cdot (1 + e) \cdot (1 + p \, s_o) \cdot H`)],
      texto: 'O número de pessoas [[n_o]] é informado no plano. O perfil é o grupo 2 (profissionais); [[s_o]] vale 1 nas opções de IA, dados e TI.' },
    { titulo: 'Formação (categoria 3.2) e valor informado (categoria 2.2)', tex: [tex(String.raw`C_o = P_o \cdot h_o \cdot k \cdot x`), tex(String.raw`C_o = Q_o`)],
      texto: 'Na formação, [[P_o]] é o número de participantes, [[h_o]] as horas por participante e [[k]] o custo da hora-participante em dólares. Na infraestrutura e hospedagem, [[Q_o]] é o valor total da cotação ou do contrato, informado no plano.' },
    { titulo: 'Custos adicionais', tex: [tex(String.raw`V = \delta_V \, p_V \, D`), tex(String.raw`O = \delta_O \, p_O \,(D + V)`), tex(String.raw`T = \delta_T \, p_T \,(D + V)`)],
      texto: 'O overhead e a taxa incidem sobre [[D + V]], sem que um entre na base do outro. Cada indicador vale 0 quando a resposta à pergunta correspondente exclui o custo: plano sem atividades presenciais, instituição que já cobre os custos indiretos e recurso executado pelo próprio órgão. Com fundação de apoio, [[p_T]] é a taxa do contrato.' },
    { titulo: 'Desembolso novo', tex: [tex(String.raw`E = C - \sum_{o} \sum_{r \in R_o^{\mathrm{ex}}} M_o \, q_r \, d_r \, c_r`)],
      texto: 'O conjunto [[R_o^{\\mathrm{ex}}]] reúne os papéis que a pessoa marcou como ocupados por servidores que já existem. O custo do plano [[C]] mede o custo econômico de todo o trabalho, e [[E]], o recurso novo a programar.' },
  ] as Equacao[],
  hParametros: 'Parâmetros',
  cabParametros: ['Símbolo', 'Parâmetro', 'Valor', 'Fonte', 'Grau'],
  parametros: [
    [tex(String.raw`w_g`), 'Salário médio mensal dos empregados por grupo ocupacional, ambos os sexos', 'por país e grupo; último ano desde 2015', 'ILOSTAT (OIT), indicador DF_EAR_EMTA_SEX_OCU_CUR_NB', 'A'],
    [tex(String.raw`\tilde{w}_g`), 'Mediana mundial do salário mensal, países com dado próprio', 'G1 {m1}; G2 {m2}; G3 {m3}; G4 {m4}', 'ILOSTAT (OIT), cálculo da ferramenta', 'B'],
    [tex(String.raw`\pi_t`), 'Inflação anual ao consumidor, média do ano', 'por país, 2016 a 2026 (2025 estimado, 2026 projetado)', 'FMI, World Economic Outlook (PCPIPCH)', 'A'],
    [tex(String.raw`e`), 'Contribuição patronal obrigatória à seguridade social', 'por país, em % da folha', 'SSA e ISSA, Social Security Programs Throughout the World, tabela 4', 'A'],
    [tex(String.raw`p`), 'Prêmio salarial de competências de IA, dados e segurança digital', '28%', 'Lightcast (2025); comparação: PwC (2025), 56%', 'B'],
    [tex(String.raw`x`), 'Câmbio por US$', 'cotação do dia, ou a informada no caso', 'ExchangeRate-API; reserva: currency-api', 'A'],
    [tex(String.raw`H`), 'Duração do plano', '12 meses (editável)', 'Padrão da ferramenta', '—'],
    [tex(String.raw`m_o,\ q_r,\ d_r`), 'Meses, pessoas e dedicação das equipes de referência', 'ver a tabela das equipes', 'Estimativa da ferramenta, comparada com casos públicos', 'C'],
    [tex(String.raw`k`), 'Custo da hora-participante de formação', 'US$ 12', 'Estimativa de referência, substituível pelo contrato', 'C'],
    [tex(String.raw`p_V`), 'Viagens e atividades presenciais', '25% de D', 'Fundo Global: 24,7% a 28,2% dos orçamentos de programa, ciclos 5 a 7', 'B'],
    [tex(String.raw`p_O`), 'Custos indiretos (overhead)', '15% de D + V', 'EUA, 2 CFR 200.414(f), revisão de 2024', 'B'],
    [tex(String.raw`p_T`), 'Taxa administrativa', '7% de D + V', 'Política do UNSDG para fundos conjuntos da ONU', 'B'],
  ] as [string, string, string, string, string][],
  hDados: 'Regras de tratamento dos dados',
  dados: [
    'Valores do ILOSTAT abaixo de US$ 30 por mês são descartados como erro de registro, e as medianas regionais exigem pelo menos três países com dado.',
    'Em dez países, o valor que o ILOSTAT publica como moeda local está em outra moeda (em euro, nas pesquisas europeias da Suécia, Noruega, Dinamarca, Polônia, Hungria, Tchéquia, Romênia, Sérvia e Islândia; em dólar, na Libéria); em Madagascar, a escala não é comparável. Nesses casos, a conta usa o valor em US$ ou, sem ele, a mediana mundial.',
    'Quando a moeda foi redenominada depois do ano do dado, o valor em moeda local é convertido para a moeda atual (Serra Leoa: 1 leone novo, de 2022, vale 1.000 leones antigos).',
    'A moeda de cada país é a de curso legal em 2026 (a Bulgária, por exemplo, usa o euro desde janeiro de 2026), e o país sem taxa de câmbio disponível é calculado em dólares.',
    'A cotação do dia é obtida quando a ferramenta é aberta e guardada no navegador até o fim do dia; sem resposta das fontes, vale a última guardada, sempre com a data indicada na tela.',
  ],
  hEquipes: 'Equipes de referência',
  equipes: 'As 25 equipes têm de 2 a 8 pessoas; as opções pontuais duram de 4 a 12 meses e as contínuas, todo o plano. Cada papel aparece com o grupo ocupacional (G1 a G4) e com pessoas × dedicação; o asterisco indica prêmio de especialista. A unidade de supervisão fica na parte baixa da faixa estimada pela Comissão Europeia para o AI Act (de 1 a 25 servidores em tempo integral por país), e o sandbox segue o ritmo do sandbox norueguês (quatro projetos por ano, de três a seis meses cada).',
  cabEquipes: ['Opção', 'Meses', 'Pessoas', 'Tempo integral equivalente', 'Papéis'],
  continua: 'contínua',
  hIncertezas: 'Como o modelo trata as principais incertezas',
  incertezas: [
    'A diferença entre o salário médio do grupo ocupacional e o de especialistas é tratada pelo prêmio de especialista. No caso de teste da nota técnica (Brasil, 12 meses), o custo varia −11,6% sem prêmio e +11,6% com o prêmio de 56% da PwC.',
    'A defasagem dos dados salariais é tratada pela atualização pela inflação até 2026, e a ausência de dado nacional, pelas medianas regionais, do grupo de renda e mundial, sempre com a origem indicada na conta de cada linha.',
    'A composição das equipes, a dedicação e os meses são estimativas que podem ter leve variação conforme o contexto. Foram definidas para cada tipo de trabalho, comparadas com casos públicos e podem ser ajustadas papel a papel; se a mesma pessoa coordena mais de uma opção, basta ajustar a coordenação em cada equipe.',
  ],
  hGraus: 'Graus de confiança',
  graus: 'A = estatística oficial (ILOSTAT, FMI, SSA e ISSA, câmbio do dia); B = estudo ou caso real com fonte (percentuais adicionais, prêmio de especialista, medianas); C = estimativa da ferramenta, que pode variar conforme o contexto (composição das equipes, custo da hora de formação).',
  hRefs: 'Referências',
  refs: [
    ['OIT, ILOSTAT. Average monthly earnings of employees by sex, occupation and currency.', 'https://ilostat.ilo.org/data/'],
    ['FMI. World Economic Outlook: inflação anual ao consumidor (PCPIPCH).', 'https://www.imf.org/external/datamapper/PCPIPCH@WEO'],
    ['SSA e ISSA. Social Security Programs Throughout the World, tabela 4.', 'https://www.ssa.gov/policy/docs/progdesc/ssptw/'],
    ['Lightcast. Beyond the Buzz: Developing the AI Skills Employers Actually Need, 2025.', 'https://lightcast.io/resources/research/beyond-the-buzz-developing-the-ai-skills-employers-actually-need'],
    ['PwC. 2025 Global AI Jobs Barometer.', 'https://www.pwc.com/gx/en/news-room/press-releases/2025/ai-linked-to-a-fourfold-increase-in-productivity-growth.html'],
    ['Banco Mundial. Classificação de países por região e grupo de renda.', 'https://datahelpdesk.worldbank.org/knowledgebase/articles/906519'],
    ['ExchangeRate-API. Taxas de câmbio do dia com base em USD.', 'https://open.er-api.com/v6/latest/USD'],
    ['Fawaz Ahmed. currency-api: taxas de câmbio do dia com base em USD.', 'https://github.com/fawazahmed0/exchange-api'],
    ['Fundo Global. Data Explorer: orçamentos por categoria de custo.', 'https://data.theglobalfund.org/financial-insights'],
    ['Estados Unidos. 2 CFR 200.414, custos indiretos.', 'https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-E/subject-group-ECFRd93f2a98b1f6455/section-200.414'],
    ['UN Energy MPTF. Relatório financeiro anual de 2025 (custos indiretos de 7%, política do UNSDG).', 'https://mptf.undp.org/sites/default/files/documents/2026-05/2025_annual_financial_report-un_energy_mptf.pdf'],
    ['Comissão Europeia. Proposta do AI Act, COM(2021) 206.', 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:52021PC0206'],
  ] as [string, string][],
  // rótulos da figura
  fTotal: 'Custo total', fDireto: 'Custo direto, D', fDireto2: 'soma das opções com valor', fViagens: 'Viagens, V', fOverhead: 'Overhead, O', fTaxa: 'Taxa administrativa, T',
  fEquipe: 'Equipe de referência', fEquipe2: '25 opções: M × Σ q × d × c', fPessoal: 'Pessoal integral', fForm: 'Formação', fForm2: '3.2: p × h × custo da hora',
  fInf: 'Valor informado', fInf2: '2.2: cotação ou contrato', fMeses: 'Meses, M', fMeses2: '4 a 12, ou H se contínua', fPessoas: 'Pessoas × dedicação',
  fPessoas2: 'por papel da equipe', fMensal: 'Custo mensal, c',
};
