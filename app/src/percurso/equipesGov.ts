// v018: equipes de referência das opções de pessoal da governança (grau C: convenção da ferramenta, a calibrar).
// Pensadas como um líder de equipe montaria o time: quem lidera, os especialistas de cada área e o apoio, com a
// dedicação de cada papel e o que cada um faz. O perfil (grande grupo da ISCO-08) define o salário do país (ILOSTAT):
// 1 = diretores e gerentes; 2 = profissionais das ciências e intelectuais; 3 = técnicos de nível médio;
// 4 = apoio administrativo. Trabalho pontual tem `meses`; sem `meses`, é operação contínua durante todo o plano.
import type { Grupo } from './salariosPais';

export interface Papel { papel: string; perfil: Grupo; qtd: number; dedicacao: number; faz: string }
export interface EquipeRef { meses?: number; papeis: Papel[]; porque: string; base?: 'aiact' | 'noruega' | 'quenia' }

const COORD = (dedicacao: number, faz = 'Lidera o trabalho, articula com o ministério e as demais áreas e aprova as versões.'): Papel => ({ papel: 'Coordenação', perfil: 1, qtd: 1, dedicacao, faz });
const APOIO = (dedicacao: number): Papel => ({ papel: 'Apoio administrativo', perfil: 4, qtd: 1, dedicacao, faz: 'Agenda, atas, documentação e tramitação.' });
const CONSULTA = (dedicacao: number): Papel => ({ papel: 'Analista de consulta pública', perfil: 3, qtd: 1, dedicacao, faz: 'Organiza a consulta pública e sistematiza as contribuições.' });
const P = (papel: string, perfil: Grupo, qtd: number, dedicacao: number, faz: string): Papel => ({ papel, perfil, qtd, dedicacao, faz });

const POR_QUE_NORMA = 'Elaborar uma norma: estudo técnico, minuta, consulta pública e versão final.';
const POR_QUE_DIRETRIZ = 'Documento orientador, sem força de lei: estudo, redação, validação com escolas e redes e publicação.';

export const EQUIPES_GOV: Record<string, EquipeRef> = {
  // 1.1 Regulação e salvaguardas de direitos humanos
  'Classificação de segurança e risco de IA': { meses: 8, porque: POR_QUE_NORMA, papeis: [
    COORD(0.5),
    P('Especialista em direito digital e regulação', 2, 2, 1, 'Redige a minuta e a compatibiliza com as leis do país.'),
    P('Especialista em IA e avaliação de risco', 2, 1, 1, 'Define as categorias de risco e os critérios técnicos de cada uma.'),
    P('Especialista em políticas educacionais', 2, 1, 0.5, 'Traz os usos de IA na educação e avalia os impactos nas escolas.'),
    CONSULTA(1), APOIO(0.5)] },
  'Direitos e proteção de crianças': { meses: 6, porque: 'Norma específica que se apoia nas leis de proteção da infância já existentes.', papeis: [
    COORD(0.5),
    P('Especialista em direitos da criança', 2, 1, 1, 'Redige as regras de consentimento, limites de uso e uso dos dados de crianças.'),
    P('Especialista em desenvolvimento infantil e educação', 2, 1, 0.5, 'Define o que é adequado para cada faixa etária.'),
    P('Especialista em IA', 2, 1, 0.5, 'Avalia como as regras se aplicam às ferramentas de IA.'),
    CONSULTA(0.5), APOIO(0.5)] },
  'Proteção de dados pessoais e privacidade': { meses: 8, base: 'quenia', porque: 'Adapta a lei de proteção de dados do país ao uso de IA na educação. O caso do Quênia mostra o custo de manter um órgão próprio, para comparar.', papeis: [
    COORD(0.5),
    P('Especialista em direito de proteção de dados', 2, 2, 1, 'Redige as regras de coleta, uso, guarda e compartilhamento de dados.'),
    P('Especialista em dados educacionais', 2, 1, 1, 'Mapeia os dados que as ferramentas de IA usam e os fluxos entre sistemas.'),
    P('Encarregado de proteção de dados', 2, 1, 0.5, 'Traz a prática de proteção de dados e define os procedimentos.'),
    CONSULTA(1), APOIO(0.5)] },
  'Equidade algorítmica, não discriminação, transparência, explicabilidade e prestação de contas': { meses: 9, porque: 'Exige métodos técnicos de teste de viés e de explicabilidade, além da redação jurídica: análise mais longa que a de outras normas.', papeis: [
    COORD(0.5),
    P('Especialista em ética e equidade de IA', 2, 1, 1, 'Define os princípios e os critérios de não discriminação.'),
    P('Cientista de dados', 2, 1, 1, 'Define os testes de viés e as métricas de equidade.'),
    P('Especialista em explicabilidade de IA', 2, 1, 1, 'Define o que cada sistema deve explicar e como.'),
    P('Especialista em direitos fundamentais', 2, 1, 1, 'Redige as obrigações de transparência e de prestação de contas.'),
    P('Especialista em educação inclusiva', 2, 1, 0.5, 'Avalia os efeitos sobre estudantes de grupos vulneráveis.'),
    P('Analista técnico', 3, 1, 1, 'Apoia os testes e organiza as evidências.'),
    APOIO(0.5)] },
  'Cibersegurança e notificação de incidentes': { meses: 6, porque: 'Parte das normas de cibersegurança que o país já tem e acrescenta o que é próprio da IA.', papeis: [
    COORD(0.5),
    P('Especialista em segurança da informação', 2, 2, 1, 'Define os requisitos de segurança dos sistemas de IA.'),
    P('Especialista em direito digital', 2, 1, 0.5, 'Redige a obrigação de notificar incidentes e os prazos.'),
    P('Analista de resposta a incidentes', 3, 1, 1, 'Desenha o fluxo de notificação e de resposta.'),
    APOIO(0.5)] },
  'Propriedade intelectual e direitos autorais': { meses: 5, porque: 'Ajusta as regras de direitos autorais a conteúdos gerados por IA e a materiais didáticos.', papeis: [
    COORD(0.25),
    P('Especialista em propriedade intelectual', 2, 1, 1, 'Redige as regras de autoria e de uso de conteúdos.'),
    P('Especialista em recursos educacionais', 2, 1, 0.5, 'Traz os casos de materiais didáticos e trabalhos escolares.'),
    P('Especialista em IA generativa', 2, 1, 0.25, 'Explica como os modelos usam e geram conteúdos.'),
    APOIO(0.5)] },
  // 1.2 Sandboxes regulatórios
  'Ambientes de teste controlados': { meses: 12, base: 'noruega', porque: 'Um ano de sandbox regulatório com 4 projetos, como no caso da Noruega (de 3 a 6 meses cada). Sem infraestrutura própria: os fornecedores testam com a infraestrutura deles; um ambiente técnico do governo entra na 2.2.', papeis: [
    COORD(1, 'Conduz o sandbox, seleciona os projetos e decide a saída de cada um.'),
    P('Especialista em IA', 2, 1, 1, 'Acompanha os testes técnicos de cada projeto.'),
    P('Especialista em regulação', 2, 1, 1, 'Define as regras do sandbox e as exceções permitidas.'),
    P('Especialista em avaliação educacional', 2, 1, 0.5, 'Avalia os resultados na aprendizagem e nas escolas.'),
    P('Especialista em infraestrutura e segurança de TI', 2, 1, 0.5, 'Avalia a infraestrutura de cada projeto (onde os dados ficam, segurança, integração com as redes das escolas) e orienta fornecedores e escolas.'),
    P('Articulador com as escolas piloto', 3, 1, 1, 'Acompanha as escolas piloto, orienta os professores e coleta os dados de uso e de aprendizagem.'),
    P('Analista técnico', 3, 1, 1, 'Organiza os dados e os relatórios dos projetos.'),
    APOIO(0.5)] },
  'Supervisão regulatória': { base: 'aiact', porque: 'Unidade de supervisão dedicada à educação, na parte baixa da faixa estimada para o AI Act (de 1 a 25 servidores por país).', papeis: [
    COORD(1, 'Chefia a unidade de supervisão e responde pelas decisões.'),
    P('Especialista em supervisão de IA', 2, 3, 1, 'Analisa os sistemas, os relatórios e as reclamações.'),
    P('Especialista em direito administrativo', 2, 1, 1, 'Instrui os processos e as sanções.'),
    P('Analista técnico', 3, 1, 1, 'Mantém os registros e acompanha os prazos.'),
    APOIO(1)] },
  'Avaliações de risco': { meses: 6, base: 'noruega', porque: '1 mês e meio por projeto testado, para os 4 projetos por ano do caso da Noruega.', papeis: [
    P('Especialista em avaliação de risco de IA', 2, 1, 1, 'Conduz a avaliação de risco de cada projeto.'),
    P('Cientista de dados', 2, 1, 0.5, 'Testa o desempenho e o viés dos sistemas.'),
    P('Especialista em proteção de dados', 2, 1, 0.25, 'Avalia os riscos para os dados pessoais.'),
    P('Analista técnico', 3, 1, 0.5, 'Organiza as evidências e redige os relatórios.')] },
  // 1.3 Diretrizes e padrões
  'Diretrizes éticas de IA para a educação': { meses: 5, porque: POR_QUE_DIRETRIZ, papeis: [
    COORD(0.25), P('Especialista em ética de IA', 2, 1, 1, 'Redige os princípios e como aplicá-los.'),
    P('Especialista em educação', 2, 1, 1, 'Traz os casos de sala de aula e de gestão escolar.'),
    P('Redator técnico', 3, 1, 0.5, 'Revisa a linguagem para professores e gestores.'), APOIO(0.25)] },
  'Diretrizes de contratação de IA e avaliação de fornecedores': { meses: 5, porque: POR_QUE_DIRETRIZ, papeis: [
    COORD(0.25), P('Especialista em contratações públicas', 2, 1, 1, 'Redige os requisitos, os critérios de avaliação e as cláusulas.'),
    P('Especialista em IA', 2, 1, 1, 'Define os requisitos técnicos e os testes de fornecedores.'),
    P('Especialista jurídico', 2, 1, 0.5, 'Revisa as cláusulas contratuais.'),
    P('Analista técnico', 3, 1, 0.5, 'Monta os modelos de documentos.'), APOIO(0.25)] },
  'Diretrizes de uso de IA adequado à idade': { meses: 4, porque: POR_QUE_DIRETRIZ, papeis: [
    COORD(0.25), P('Especialista em desenvolvimento infantil', 2, 1, 1, 'Define limites e recomendações por faixa etária.'),
    P('Especialista em educação', 2, 1, 0.5, 'Traz as etapas de ensino e os usos em sala.'),
    P('Especialista em IA', 2, 1, 0.5, 'Avalia o que cada tipo de ferramenta permite.'), APOIO(0.25)] },
  'Políticas de uso de IA por professores e estudantes': { meses: 4, porque: POR_QUE_DIRETRIZ, papeis: [
    COORD(0.25), P('Especialista em educação', 2, 1, 1, 'Redige o que é permitido, proibido e o que deve ser declarado.'),
    P('Especialista em avaliação e integridade acadêmica', 2, 1, 0.5, 'Define as regras para tarefas e avaliações.'),
    P('Especialista jurídico', 2, 1, 0.25, 'Revisa a coerência com as normas do país.'),
    P('Analista técnico', 3, 1, 0.5, 'Prepara os materiais para as escolas.'), APOIO(0.25)] },
  'Padrões de gestão de riscos de IA': { meses: 5, porque: 'Padrão técnico de referência, adaptado de padrões internacionais.', papeis: [
    COORD(0.25), P('Especialista em gestão de riscos', 2, 1, 1, 'Adapta o padrão e define os procedimentos.'),
    P('Especialista em IA', 2, 1, 1, 'Define os riscos técnicos e os controles.'),
    P('Analista técnico', 3, 1, 0.5, 'Monta os modelos e as listas de verificação.'), APOIO(0.25)] },
  'Padrões de transparência e documentação de IA': { meses: 4, porque: 'Padrão técnico de referência, adaptado de padrões internacionais.', papeis: [
    COORD(0.25), P('Especialista em IA', 2, 1, 1, 'Define o que documentar sobre cada sistema.'),
    P('Especialista jurídico', 2, 1, 0.5, 'Define o que deve ser divulgado ao público.'),
    P('Analista técnico', 3, 1, 0.5, 'Monta os modelos de documentação.'), APOIO(0.25)] },
  'Padrões de governança e segurança de dados': { meses: 5, porque: 'Padrão técnico de referência, adaptado de padrões internacionais.', papeis: [
    COORD(0.25), P('Especialista em governança de dados', 2, 1, 1, 'Define papéis, regras de acesso e de compartilhamento.'),
    P('Especialista em segurança da informação', 2, 1, 1, 'Define os controles de segurança.'),
    P('Analista técnico', 3, 1, 0.5, 'Monta os modelos e os procedimentos.'), APOIO(0.25)] },
  'Diretrizes de garantia de qualidade e avaliação de IA': { meses: 5, porque: POR_QUE_DIRETRIZ, papeis: [
    COORD(0.25), P('Especialista em avaliação educacional', 2, 1, 1, 'Define como medir os resultados esperados.'),
    P('Especialista em IA', 2, 1, 1, 'Define os testes de desempenho e de qualidade.'),
    P('Analista de dados', 3, 1, 0.5, 'Prepara os indicadores e os painéis.'), APOIO(0.25)] },
  // 2.1 Governança e proteção de dados e infraestrutura pública digital (categoria sem opções)
  'Governança e proteção de dados e infraestrutura pública digital': { base: 'quenia', porque: 'Equipe permanente de gestão dos dados educacionais. O caso do Quênia mostra o custo de um órgão de proteção de dados, para comparar.', papeis: [
    COORD(1, 'Gerencia os dados educacionais e responde por eles.'),
    P('Especialista em governança de dados', 2, 2, 1, 'Define e aplica as regras de uso e de compartilhamento.'),
    P('Arquiteto de dados e interoperabilidade', 2, 1, 1, 'Integra os sistemas e mantém os padrões de dados.'),
    P('Analista de dados', 3, 2, 1, 'Mantém a qualidade e os registros dos dados.'),
    APOIO(0.5)] },
  // 2.3 Independência tecnológica
  'Adoção e manutenção de código aberto': { porque: 'Manutenção, atualização e suporte contínuos das soluções de código aberto.', papeis: [
    P('Líder técnico', 1, 1, 0.5, 'Define as prioridades e revisa as entregas.'),
    P('Desenvolvedor', 2, 2, 1, 'Mantém, corrige e atualiza o código.'),
    P('Técnico de suporte', 3, 1, 1, 'Atende as escolas e as redes que usam as soluções.')] },
  'Transferência de tecnologia': { meses: 8, porque: 'Acordos com fornecedores e capacitação das equipes do governo.', papeis: [
    COORD(0.5), P('Especialista em TI', 2, 2, 1, 'Absorve o conhecimento técnico das soluções.'),
    P('Gestor de contratos', 2, 1, 0.5, 'Negocia e acompanha os acordos.'),
    P('Instrutor técnico', 3, 1, 0.5, 'Capacita as equipes internas.'), APOIO(0.25)] },
  'Customização local': { meses: 8, porque: 'Adaptação das soluções à língua e ao currículo do país.', papeis: [
    COORD(0.5), P('Desenvolvedor', 2, 2, 1, 'Adapta o código e as interfaces.'),
    P('Especialista em currículo', 2, 1, 1, 'Alinha os conteúdos ao currículo do país.'),
    P('Especialista em língua e tradução', 2, 1, 0.5, 'Adapta os textos às línguas de ensino.'),
    P('Testador', 3, 1, 1, 'Testa as versões com usuários.')] },
  'Redução da dependência de fornecedores': { meses: 4, porque: 'Revisão de contratos, padrões abertos e cláusulas de saída.', papeis: [
    COORD(0.25), P('Especialista em contratações públicas', 2, 1, 1, 'Revisa os contratos e redige as cláusulas de saída.'),
    P('Arquiteto de TI', 2, 1, 0.5, 'Define os padrões abertos e a portabilidade dos dados.'),
    P('Especialista jurídico', 2, 1, 0.5, 'Revisa os aspectos jurídicos.')] },
  // 3.3 Governança institucional e coordenação
  'Comitês de governança': { porque: 'Só a secretaria do comitê; o tempo dos membros fica de fora.', papeis: [
    P('Secretário executivo', 2, 1, 0.5, 'Prepara as pautas, os estudos e acompanha as decisões.'),
    APOIO(0.5)] },
  'Coordenação interministerial': { porque: 'Ponto focal permanente entre os ministérios.', papeis: [
    COORD(1, 'Representa a educação e coordena o trabalho com os outros ministérios.'),
    P('Analista de políticas públicas', 2, 1, 1, 'Prepara as posições e acompanha os acordos.'),
    APOIO(0.5)] },
  'Estruturas institucionais de governança': { base: 'quenia', porque: 'Unidade dedicada à IA na educação. O caso do Quênia mostra o custo de um órgão novo inteiro, para comparar.', papeis: [
    COORD(1, 'Dirige a unidade e responde pela política de IA na educação.'),
    P('Especialista em IA', 2, 1, 1, 'Acompanha as soluções e os riscos técnicos.'),
    P('Especialista em dados', 2, 1, 1, 'Cuida dos dados e da interoperabilidade.'),
    P('Especialista jurídico', 2, 1, 1, 'Cuida das normas e dos contratos.'),
    P('Especialista em educação', 2, 1, 1, 'Liga a política às escolas e às redes.'),
    P('Analista técnico', 3, 2, 1, 'Apoia os projetos e os relatórios.'),
    APOIO(1)] },
};

/** Total de pessoas da equipe de referência (soma das quantidades). */
export const pessoasDaEquipe = (e: EquipeRef) => e.papeis.reduce((n, p) => n + p.qtd, 0);

/** v018: papéis que exigem competências de IA, dados ou segurança digital: o mercado paga acima da média do grupo
 *  ocupacional, e a ferramenta aplica o prêmio salarial de especialista sobre o salário do país. */
export const PAPEIS_ESPECIALISTA = new Set([
  'Arquiteto de TI', 'Arquiteto de dados e interoperabilidade', 'Cientista de dados', 'Desenvolvedor', 'Encarregado de proteção de dados',
  'Especialista em IA', 'Especialista em IA e avaliação de risco', 'Especialista em IA generativa', 'Especialista em TI', 'Especialista em avaliação de risco de IA',
  'Especialista em dados', 'Especialista em dados educacionais', 'Especialista em direito de proteção de dados', 'Especialista em direito digital',
  'Especialista em direito digital e regulação', 'Especialista em explicabilidade de IA', 'Especialista em governança de dados',
  'Especialista em infraestrutura e segurança de TI', 'Especialista em proteção de dados', 'Especialista em segurança da informação',
  'Especialista em supervisão de IA', 'Especialista em ética de IA', 'Especialista em ética e equidade de IA', 'Líder técnico',
  'Analista de dados', 'Analista de resposta a incidentes',
]);
/** Opções de pessoal em tempo integral (3.1) que recebem o prêmio de especialista. */
export const OPCOES_ESPECIALISTA = new Set(['Especialistas em TI (IA, dados, segurança, infraestrutura)', 'Pessoal de governança de IA', 'Especialistas em IA e educação']);
/** Prêmio salarial de especialista (%): padrão com fonte (grau B); a pessoa pode trocar na tela. */
export const PREMIO_ESPECIALISTA = {
  padrao: 28,
  fonte: { titulo: 'Lightcast, Beyond the Buzz (2025): vagas que pedem competências de IA pagam 28% a mais (1,3 bilhão de anúncios)', url: 'https://lightcast.io/resources/research/beyond-the-buzz-developing-the-ai-skills-employers-actually-need' },
  comparacao: { titulo: 'PwC, 2025 Global AI Jobs Barometer: prêmio médio de 56% para vagas que exigem competências de IA, frente a 25% no ano anterior', url: 'https://www.pwc.com/gx/en/news-room/press-releases/2025/ai-linked-to-a-fourfold-increase-in-productivity-growth.html' },
};
/** Prêmio em uso (fração): o informado em govOrcamento.premioEspecialista ou o padrão. */
export function premioEspecialista(s: { ctx?: any }): { pct: number; informado: boolean } {
  const v = s?.ctx?.govOrcamento?.premioEspecialista;
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? { pct: v, informado: true } : { pct: PREMIO_ESPECIALISTA.padrao, informado: false };
}
