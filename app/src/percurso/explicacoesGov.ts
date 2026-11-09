// v018: o que é cada item do fluxo da governança (desafios, categorias, opções e a duração do plano), para o "i".
// Chave: o texto em português do item, como no catálogo (domain/catalogo_v016.js). O texto é traduzido por t().
export const EXPLICACOES_GOV: Record<string, string> = {
  // desafios
  'Direitos e inovação responsável': 'Normas e salvaguardas para que o uso de IA na educação proteja os direitos de estudantes, professores e famílias e permita inovar com segurança.',
  'Soberania': 'Capacidade do país de controlar os dados educacionais, a infraestrutura em que a IA funciona e as suas escolhas tecnológicas, sem depender de um único fornecedor.',
  'Capacidade do setor público': 'Pessoas, competências e estruturas de que o governo precisa para planejar, contratar, supervisionar e avaliar a IA na educação.',
  // categorias
  'Regulação e salvaguardas de direitos humanos': 'Leis, decretos e normas que definem obrigações e proteções no uso de IA na educação. Os custos típicos são estudos técnicos, apoio jurídico e consultas públicas.',
  'Sandboxes regulatórios': 'Ambientes em que soluções de IA são testadas por tempo limitado, com regras próprias e acompanhamento do regulador, antes de um uso mais amplo.',
  'Diretrizes e padrões': 'Orientações e requisitos técnicos sobre como escolher, contratar, usar e avaliar a IA nas redes e nas escolas.',
  'Governança e proteção de dados e infraestrutura pública digital': 'Regras, papéis e sistemas para gerir os dados educacionais e a infraestrutura pública digital (identificação, interoperabilidade, registros) em que a IA se apoia.',
  'Infraestrutura digital e hospedagem': 'Onde os sistemas e os dados ficam e funcionam: nuvem, data centers, servidores e armazenamento, com a segurança e o controle exigidos.',
  'Independência tecnológica': 'Ações para reduzir a dependência de fornecedores e de tecnologias externas.',
  'Recursos humanos especializados': 'Profissionais que a administração precisa ter, contratar ou designar para conduzir a política de IA na educação.',
  'Formação e desenvolvimento profissional': 'Cursos e capacitação para os servidores que vão planejar, contratar, supervisionar ou usar a IA na gestão educacional.',
  'Governança institucional e coordenação': 'Instâncias e mecanismos que decidem e coordenam a política de IA na educação entre órgãos e níveis de governo.',
  // 1.1
  'Classificação de segurança e risco de IA': 'Definir níveis de risco para os sistemas de IA usados na educação e o que se exige em cada nível, incluindo os usos proibidos.',
  'Direitos e proteção de crianças': 'Regras específicas para proteger crianças e adolescentes: consentimento, limites de uso, conteúdo adequado e uso dos seus dados.',
  'Proteção de dados pessoais e privacidade': 'Regras sobre coleta, uso, guarda e compartilhamento de dados de estudantes e profissionais por sistemas de IA, alinhadas à lei de proteção de dados do país.',
  'Equidade algorítmica, não discriminação, transparência, explicabilidade e prestação de contas': 'Exigências para que os sistemas não discriminem grupos, expliquem como chegam aos resultados e tenham responsáveis identificados pelas decisões.',
  'Cibersegurança e notificação de incidentes': 'Requisitos de segurança dos sistemas e a obrigação de comunicar vazamentos, falhas e outros incidentes às autoridades e às pessoas afetadas.',
  'Propriedade intelectual e direitos autorais': 'Regras sobre a autoria e o uso de conteúdos gerados por IA ou usados para treiná-la, incluindo materiais didáticos e trabalhos de estudantes e professores.',
  // 1.2
  'Ambientes de teste controlados': 'Estrutura para testar soluções de IA em poucas escolas ou redes, por tempo limitado, com critérios de entrada, de saída e de avaliação. É um sandbox regulatório: os fornecedores testam com a infraestrutura deles. Se o governo quiser oferecer um ambiente técnico próprio, marque também a 2.2.',
  'Supervisão regulatória': 'Equipe e procedimentos do órgão regulador para acompanhar os testes, receber relatórios e decidir se a solução pode avançar.',
  'Avaliações de risco': 'Análise dos riscos da solução para estudantes, professores e dados, antes e durante o teste, com medidas para reduzi-los.',
  // 1.3
  'Diretrizes éticas de IA para a educação': 'Princípios para o uso de IA nas redes e nas escolas, como centralidade humana, inclusão e transparência, e como aplicá-los no dia a dia.',
  'Diretrizes de contratação de IA e avaliação de fornecedores': 'Orientações para comprar soluções de IA: requisitos mínimos, critérios de avaliação das propostas, cláusulas de contrato e verificação dos fornecedores.',
  'Diretrizes de uso de IA adequado à idade': 'Limites e recomendações de uso de IA para cada faixa etária e etapa de ensino.',
  'Políticas de uso de IA por professores e estudantes': 'Regras sobre o que é permitido, o que é proibido e o que deve ser declarado no uso de IA em aulas, tarefas e avaliações.',
  'Padrões de gestão de riscos de IA': 'Procedimentos comuns para identificar, avaliar, monitorar e tratar os riscos ao longo da vida de um sistema de IA.',
  'Padrões de transparência e documentação de IA': 'O que fornecedores e redes devem registrar e divulgar sobre cada sistema: finalidade, dados usados, limitações e responsáveis.',
  'Padrões de governança e segurança de dados': 'Requisitos técnicos e de gestão para guardar, acessar e compartilhar dados educacionais com segurança.',
  'Diretrizes de garantia de qualidade e avaliação de IA': 'Como verificar se um sistema de IA funciona como prometido e produz os resultados esperados, antes e depois da adoção.',
  // 2.2
  'Serviços de nuvem soberana': 'Nuvem contratada que mantém os dados sob a jurisdição e o controle do país.',
  'Data centers locais': 'Construção, ampliação ou uso de centros de dados próprios ou instalados no país.',
  'Hospedagem segura': 'Hospedagem dos sistemas com requisitos de segurança, disponibilidade e cópias de segurança.',
  'Armazenamento de dados': 'Capacidade para guardar os dados educacionais e os registros dos sistemas pelo tempo exigido.',
  'Infraestrutura de computação': 'Servidores e capacidade de processamento para executar ou ajustar modelos de IA.',
  // 2.3
  'Adoção e manutenção de código aberto': 'Uso de soluções de código aberto e o custo de mantê-las, atualizá-las e dar suporte a elas.',
  'Transferência de tecnologia': 'Acordos para que o conhecimento técnico das soluções passe para equipes do governo ou instituições do país.',
  'Customização local': 'Adaptação das soluções à língua, ao currículo e à realidade do país.',
  'Redução da dependência de fornecedores': 'Medidas como padrões abertos, portabilidade de dados e cláusulas de saída, que permitem trocar de fornecedor.',
  // 3.1
  'Especialistas em TI (IA, dados, segurança, infraestrutura)': 'Profissionais de tecnologia para especificar, integrar, operar e proteger os sistemas e os dados.',
  'Profissionais jurídicos': 'Especialistas em direito digital, proteção de dados e contratações públicas.',
  'Pessoal de governança de IA': 'Equipe que coordena a política, acompanha os riscos e verifica o cumprimento das regras.',
  'Especialistas em IA e educação': 'Profissionais que reúnem conhecimento pedagógico e de IA para avaliar usos, conteúdos e efeitos na aprendizagem.',
  // 3.3
  'Comitês de governança': 'Instância com representantes das áreas e dos grupos envolvidos, que decide e acompanha a política de IA na educação.',
  'Coordenação interministerial': 'Trabalho conjunto da educação com outras áreas do governo, como tecnologia, justiça, fazenda e ciência.',
  'Estruturas institucionais de governança': 'Unidade, cargo ou setor formal responsável pela IA na educação, com atribuições e orçamento definidos.',
  // tela de opções
  'Duração do plano (meses)': 'Período coberto pelo orçamento. Os custos mensais e anuais são calculados para esse período.',
  // v018: custos adicionais (percentual sobre as opções)
  'Viagens (diárias e passagens)': 'Passagens e diárias das viagens de trabalho (consultas, visitas às escolas, supervisão), como percentual dos custos das opções.',
  'Overhead (custos indiretos)': 'Custos da instituição que não dá para atribuir a uma opção (espaço, TI, RH, contabilidade, jurídico), como percentual dos custos diretos.',
  'Taxa administrativa': 'Valor cobrado por quem administra o recurso (agência da ONU, fundação de apoio, fundo), como percentual dos custos diretos. Sem intermediário, use 0%.',
};

export function explicacaoGov(chave: string): string | undefined { return EXPLICACOES_GOV[chave]; }
