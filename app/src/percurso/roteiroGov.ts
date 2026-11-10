// v018: "Roteiro de implementação" do plano de governança (terceiro PDF). Documento formal, montado a partir do plano:
// sete etapas (decisão, base legal, recursos, equipe, participação, execução das medidas e monitoramento), cada uma com
// objetivo, justificativa, período de referência e ações no infinitivo; cada ação indica o responsável usual, o produto
// que comprova a conclusão, o prazo de referência, a ação de que depende, se depende do ordenamento do país e a fonte.
// A etapa de execução traz uma seção por tipo de medida escolhida, com custo, duração e equipe do plano. Prazos sem
// fonte são convenção da ferramenta (marcados com * no PDF).
import { orcamentoV16, raizOrcamento } from './orcamentoV016';
import { formatarMoedaEst } from './estimativasOrcamento';
import type { Estado14 } from '../store/tipos';
import { t } from './textos';
import { LOC } from '../domain';
import type { SalvoAdicionais } from './adicionaisGov';

export interface Fonte { titulo: string; url: string }
export interface Passo {
  id: string; oque: string; quem: string; pronto: string; prazo?: string; depende?: string[];
  /** depende do ordenamento jurídico ou orçamentário do país */
  adaptar?: boolean; fonte?: keyof typeof FONTES; nota?: string;
}
export interface Etapa { id: string; n: number; titulo: string; quando: string; objetivo: string; porque: string; passos: Passo[] }
export type TipoOpcao = 'norma' | 'diretriz' | 'sandbox' | 'risco' | 'supervisao' | 'dados' | 'infra' | 'independencia' | 'coordenacao' | 'pessoal' | 'formacao';

export const FONTES = {
  ocde_air: { titulo: 'OCDE, Regulatory Impact Assessment (2020): princípios e passos da análise de impacto', url: 'https://www.oecd.org/en/publications/regulatory-impact-assessment_7a9638cb-en/full-report/component-5.html' },
  ocde_reg: { titulo: 'OCDE, The Governance of Regulators (2014): os 7 princípios', url: 'https://www.oecd.org/en/publications/the-governance-of-regulators_9789264209015-en.html' },
  uk_sro: { titulo: 'Governo do Reino Unido: o papel do responsável sênior pelo projeto (SRO)', url: 'https://www.gov.uk/government/publications/the-role-of-the-senior-responsible-owner' },
  uk_ia: { titulo: 'Governo do Reino Unido: Guidelines for AI procurement', url: 'https://www.gov.uk/government/publications/guidelines-for-ai-procurement/guidelines-for-ai-procurement' },
  uk_consulta: { titulo: 'Governo do Reino Unido: Consultation Principles (2018)', url: 'https://www.gov.uk/government/publications/consultation-principles-guidance/consultation-principles-2018' },
  uk_nuvem: { titulo: 'Governo do Reino Unido: Cloud guide for the public sector', url: 'https://www.gov.uk/government/publications/cloud-guide-for-the-public-sector/cloud-guide-for-the-public-sector' },
  uk_aberto: { titulo: 'Governo do Reino Unido: Be open and use open source', url: 'https://www.gov.uk/guidance/be-open-and-use-open-source' },
  wef: { titulo: 'Fórum Econômico Mundial: AI Procurement in a Box (2020)', url: 'https://www3.weforum.org/docs/WEF_AI_Procurement_in_a_Box_Workbook_2020.pdf' },
  agu: { titulo: 'AGU (Brasil): guia de referência para sandbox regulatório', url: 'https://www.gov.br/agu/pt-br/regulatory-sandbox-reference-guide.pdf' },
  anpd: { titulo: 'ANPD (Brasil): edital do sandbox regulatório de IA e proteção de dados (2025)', url: 'https://www.gov.br/anpd/pt-br/assuntos/noticias/publicado-edital-para-participacao-em-sandbox-regulatorio-em-inteligencia-artificial' },
  noruega: { titulo: 'Datatilsynet (Noruega): o que acontece no sandbox de IA', url: 'https://www.datatilsynet.no/en/regulations-and-tools/sandbox-for-artificial-intelligence/framework-for-the-regulatory-sandbox/what-happens-in-the-sandbox/' },
  aiact57: { titulo: 'AI Act da União Europeia, art. 57: sandboxes regulatórios de IA', url: 'https://artificialintelligenceact.eu/article/57/' },
  aiact70: { titulo: 'AI Act da União Europeia, art. 70: autoridades nacionais competentes', url: 'https://artificialintelligenceact.eu/article/70/' },
  ram: { titulo: 'UNESCO: Readiness Assessment Methodology (RAM)', url: 'https://www.unesco.org/ethics-ai/en/ram' },
  unesco_prof: { titulo: 'UNESCO: AI competency framework for teachers (2024)', url: 'https://www.unesco.org/en/articles/ai-competency-framework-teachers' },
  bm_dados: { titulo: 'Banco Mundial: World Development Report 2021, Data for Better Lives', url: 'https://www.worldbank.org/en/publication/wdr2021' },
  dpi: { titulo: 'ONU e PNUD: Universal DPI Safeguards Framework', url: 'https://www.dpi-safeguards.org/framework' },
  unesco_etica: { titulo: 'UNESCO: Recomendação sobre a Ética da Inteligência Artificial (2021)', url: 'https://www.unesco.org/en/artificial-intelligence/recommendation-ethics' },
  unesco_genai: { titulo: 'UNESCO: Guidance for generative AI in education and research (2023)', url: 'https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research' },
  iso: { titulo: 'ISO: como as normas técnicas são desenvolvidas', url: 'https://www.iso.org/developing-standards.html' },
} satisfies Record<string, Fonte>;

/** Tipo de cada opção da governança (o texto em português da opção, como no catálogo). */
export const TIPO_OPCAO: Record<string, TipoOpcao> = {
  'Classificação de segurança e risco de IA': 'norma', 'Direitos e proteção de crianças': 'norma', 'Proteção de dados pessoais e privacidade': 'norma',
  'Equidade algorítmica, não discriminação, transparência, explicabilidade e prestação de contas': 'norma', 'Cibersegurança e notificação de incidentes': 'norma',
  'Propriedade intelectual e direitos autorais': 'norma',
  'Ambientes de teste controlados': 'sandbox', 'Avaliações de risco': 'risco', 'Supervisão regulatória': 'supervisao',
  'Diretrizes éticas de IA para a educação': 'diretriz', 'Diretrizes de contratação de IA e avaliação de fornecedores': 'diretriz', 'Diretrizes de uso de IA adequado à idade': 'diretriz',
  'Políticas de uso de IA por professores e estudantes': 'diretriz', 'Padrões de gestão de riscos de IA': 'diretriz', 'Padrões de transparência e documentação de IA': 'diretriz',
  'Padrões de governança e segurança de dados': 'diretriz', 'Diretrizes de garantia de qualidade e avaliação de IA': 'diretriz',
  'Governança e proteção de dados e infraestrutura pública digital': 'dados',
  'Serviços de nuvem soberana': 'infra', 'Hospedagem segura': 'infra', 'Armazenamento de dados': 'infra', 'Infraestrutura de computação': 'infra',
  // v018.1: opções do desafio 2 conforme a figura
  'Inventário e curadoria de dados': 'dados', 'Controles de acesso e regras de retenção': 'dados', 'Interoperabilidade e portabilidade de dados': 'dados', 'Infraestrutura pública de dados compartilhada': 'dados',
  'Nuvem soberana': 'infra', 'Hospedagem segura e armazenamento de dados': 'infra', 'Infraestrutura de computação e rede': 'infra', 'Backup e continuidade do serviço': 'infra',
  'Migração e saída': 'independencia',
  'Adoção e manutenção de código aberto': 'independencia', 'Transferência de tecnologia': 'independencia', 'Customização local': 'independencia', 'Redução da dependência de fornecedores': 'independencia',
  'Especialistas em TI (IA, dados, segurança, infraestrutura)': 'pessoal', 'Profissionais jurídicos': 'pessoal', 'Pessoal de governança de IA': 'pessoal', 'Especialistas em IA e educação': 'pessoal',
  'Formação e desenvolvimento profissional': 'formacao',
  'Comitês de governança': 'coordenacao', 'Coordenação interministerial': 'coordenacao', 'Estruturas institucionais de governança': 'coordenacao',
};

/** Ações de cada tipo de medida, no infinitivo. */
export const PASSOS_TIPO: Record<TipoOpcao, { resumo: string; prazo: string; passos: Omit<Passo, 'id'>[] }> = {
  norma: { resumo: 'A edição de uma norma compreende estudo do problema, elaboração de minuta, consulta pública, revisão jurídica, aprovação e publicação oficial.', prazo: '9 a 24 meses (mais, se exigir lei)', passos: [
    { oque: 'Caracterizar o problema com base em dados e definir os objetivos da norma.', quem: 'Coordenação e especialistas da equipe', pronto: 'Nota técnica com o problema e os objetivos', fonte: 'ocde_air' },
    { oque: 'Comparar alternativas, inclusive as que não exigem norma (orientação, cláusula contratual, formação).', quem: 'Especialistas da equipe', pronto: 'Análise de impacto regulatório, ainda que simplificada', fonte: 'ocde_air' },
    { oque: 'Elaborar a minuta da norma.', quem: '{JUR}', pronto: 'Minuta revisada pela coordenação' },
    { oque: 'Submeter a minuta a consulta pública, em linguagem acessível, e publicar as respostas do governo às contribuições.', quem: '{CONSULTA}', pronto: 'Relatório da consulta publicado', prazo: '1 a 3 meses', fonte: 'uk_consulta' },
    { oque: 'Encaminhar a versão final para revisão jurídica.', quem: 'Consultoria jurídica do ministério', pronto: 'Parecer jurídico favorável', adaptar: true },
    { oque: 'Submeter a norma à autoridade competente e publicá-la no meio oficial.', quem: 'Gabinete', pronto: 'Norma publicada no diário oficial ou no meio oficial de publicação do país', adaptar: true },
    { oque: 'Publicar guia de aplicação e perguntas frequentes para escolas, redes de ensino e fornecedores.', quem: 'Equipe da opção', pronto: 'Guia publicado' },
    { oque: 'Programar a avaliação dos efeitos da norma para um a dois anos após a publicação.', quem: 'Coordenação', pronto: 'Data e indicadores da avaliação definidos', fonte: 'ocde_air' },
  ] },
  diretriz: { resumo: 'Uma diretriz não tem força de lei: parte de referências existentes, é validada com escolas e redes de ensino e é publicada em linguagem acessível.', prazo: '4 a 9 meses', passos: [
    { oque: 'Definir o escopo e o público da diretriz (gestores, professores, estudantes, fornecedores).', quem: 'Coordenação', pronto: 'Termo de abertura' },
    { oque: 'Partir de referências existentes, em vez de elaborar o texto do zero.', quem: 'Especialistas da equipe', pronto: 'Lista de referências adotadas', nota: 'Por exemplo: a Recomendação da UNESCO sobre a Ética da IA, as orientações da UNESCO sobre IA generativa na educação e, para contratações, o AI Procurement in a Box.' },
    { oque: 'Constituir grupo técnico com escolas, redes de ensino, academia e sociedade civil.', quem: 'Coordenação', pronto: 'Grupo designado e primeira reunião realizada', fonte: 'iso' },
    { oque: 'Elaborar a minuta da diretriz e abri-la a comentários.', quem: 'Especialistas e redator técnico', pronto: 'Minuta com comentários recebidos' },
    { oque: 'Ajustar o texto, aprovar e publicar a diretriz em linguagem acessível.', quem: 'Coordenação e gabinete', pronto: 'Diretriz publicada' },
    { oque: 'Definir a data da primeira revisão.', quem: 'Coordenação', pronto: 'Data de revisão publicada com a diretriz' },
  ] },
  sandbox: { resumo: 'Um sandbox regulatório permite testar soluções por tempo limitado, com regras próprias e acompanhamento do poder público, e termina com relatório de saída.', prazo: '6 a 12 meses para a implantação; 3 a 6 meses por projeto testado', passos: [
    { oque: 'Verificar a necessidade do sandbox: identificar a regra que impede o teste ou gera insegurança jurídica.', quem: 'Coordenação e jurídico', pronto: 'Nota de decisão', fonte: 'agu' },
    { oque: 'Realizar a análise jurídica e publicar o ato de criação do sandbox: regras, exceções admitidas, salvaguardas, supervisão e plano de saída.', quem: 'Especialista em regulação e consultoria jurídica', pronto: 'Ato do sandbox publicado', prazo: '3 a 6 meses, se for ato do próprio órgão', adaptar: true, fonte: 'agu' },
    { oque: 'Publicar edital com critérios de elegibilidade e seleção.', quem: 'Coordenação', pronto: 'Edital publicado', prazo: 'inscrições de cerca de 6 semanas, como no edital da ANPD', fonte: 'anpd' },
    { oque: 'Selecionar os projetos e pactuar plano de teste com cada participante.', quem: 'Coordenação e especialista em IA', pronto: 'Planos individuais assinados', fonte: 'aiact57' },
    { oque: 'Antes de qualquer teste com estudantes, avaliar o impacto sobre dados pessoais e direitos da criança e obter o consentimento das famílias, nos termos da legislação do país.', quem: 'Especialista em regulação e encarregado de proteção de dados', pronto: 'Avaliação de impacto aprovada e termos de consentimento assinados', adaptar: true },
    { oque: 'Acompanhar os testes nas escolas piloto e registrar as evidências.', quem: 'Articulador com as escolas e analista técnico', pronto: 'Relatórios de acompanhamento', prazo: '3 a 6 meses por projeto', fonte: 'noruega' },
    { oque: 'Elaborar relatório de saída por projeto e definir a regra aplicável após o teste.', quem: 'Coordenação', pronto: 'Relatórios de saída e decisão publicados', fonte: 'aiact57' },
  ] },
  risco: { resumo: 'Cada projeto testado é submetido a avaliação de risco antes e durante o teste.', prazo: 'cerca de 1,5 mês por projeto', passos: [
    { oque: 'Adotar modelo de avaliação de risco (impactos sobre estudantes, professores e dados).', quem: 'Especialista em avaliação de risco', pronto: 'Modelo aprovado pela coordenação', fonte: 'uk_ia' },
    { oque: 'Avaliar cada projeto antes do teste e definir medidas de mitigação.', quem: 'Especialista em avaliação de risco e cientista de dados', pronto: 'Avaliação assinada por projeto' },
    { oque: 'Revisar a avaliação nos pontos de decisão do teste.', quem: 'Equipe da opção', pronto: 'Avaliações atualizadas no relatório de saída', fonte: 'uk_ia' },
  ] },
  supervisao: { resumo: 'Uma unidade de supervisão requer funções definidas, independência, procedimentos e quadro permanente.', prazo: '6 a 18 meses até o pleno funcionamento', passos: [
    { oque: 'Criar a unidade por ato normativo, com funções que não conflitem com as de fomento.', quem: 'Gabinete e jurídico', pronto: 'Ato de criação publicado', adaptar: true, fonte: 'ocde_reg' },
    { oque: 'Definir o processo decisório, a prestação de contas e as salvaguardas contra influência indevida.', quem: 'Chefia da unidade', pronto: 'Regimento interno aprovado', fonte: 'ocde_reg' },
    { oque: 'Instituir canal de atendimento público para escolas, fornecedores e cidadãos.', quem: 'Chefia da unidade', pronto: 'Canal de atendimento divulgado', fonte: 'aiact70' },
    { oque: 'Assegurar quadro permanente com conhecimento técnico e jurídico e revisar o dimensionamento anualmente.', quem: 'Gabinete e RH', pronto: 'Equipe lotada e revisão anual programada', adaptar: true, fonte: 'aiact70' },
    { oque: 'Publicar relatório anual de atividades.', quem: 'Chefia da unidade', pronto: 'Primeiro relatório publicado' },
  ] },
  dados: { resumo: 'A governança de dados começa por diagnóstico e designação de responsável, e avança por etapas, com salvaguardas de direitos.', prazo: '12 a 36 meses, por etapas', passos: [
    { oque: 'Realizar diagnóstico da política, da legislação, das instituições e da infraestrutura de dados educacionais.', quem: 'Coordenação', pronto: 'Relatório de diagnóstico', fonte: 'bm_dados' },
    { oque: 'Designar responsável pela governança dos dados educacionais.', quem: 'Gabinete', pronto: 'Ato de designação' },
    { oque: 'Inventariar e classificar os dados (o que existe, onde está armazenado, quem tem acesso).', quem: 'Especialistas em governança de dados', pronto: 'Inventário de dados' },
    { oque: 'Definir regras de acesso, compartilhamento e interoperabilidade, com salvaguardas de direitos.', quem: 'Especialistas e jurídico', pronto: 'Regras aprovadas', fonte: 'dpi' },
    { oque: 'Implantar por etapas, a começar pelos dados de maior uso.', quem: 'Arquiteto de dados', pronto: 'Primeira etapa implantada', fonte: 'bm_dados' },
  ] },
  infra: { resumo: 'A contratação de infraestrutura requer estratégia de hospedagem, caso de negócio e contrato com cláusulas de dados e de saída.', prazo: '4 a 9 meses até a assinatura do contrato', passos: [
    { oque: 'Constituir equipe de contratação com as áreas de tecnologia, compras e segurança.', quem: 'Coordenação', pronto: 'Equipe designada', fonte: 'uk_nuvem' },
    { oque: 'Definir onde os dados podem ser armazenados e quem pode acessá-los.', quem: 'Segurança e jurídico', pronto: 'Decisão registrada', adaptar: true, fonte: 'uk_nuvem' },
    { oque: 'Incluir a hospedagem na proposta orçamentária e aprovar o caso de negócio.', quem: 'Equipe de contratação e orçamento', pronto: 'Caso de negócio aprovado', adaptar: true },
    { oque: 'Publicar edital que descreva o problema, com cláusulas de dados, de saída e de controle de custos variáveis.', quem: 'Compras', pronto: 'Edital publicado', adaptar: true, fonte: 'uk_ia' },
    { oque: 'Contratar e acompanhar mensalmente os gastos.', quem: 'Gestor do contrato', pronto: 'Contrato assinado e painel de gastos', fonte: 'uk_nuvem' },
  ] },
  independencia: { resumo: 'A independência tecnológica depende de política de software livre, de cláusulas contratuais e de equipe interna que conheça os sistemas.', prazo: '3 a 6 meses para a primeira política; depois, contínua', passos: [
    { oque: 'Considerar o software livre em condições de igualdade com o proprietário nas contratações.', quem: 'Líder técnico e compras', pronto: 'Regra incluída na política de contratações', fonte: 'uk_aberto' },
    { oque: 'Avaliar cada solução quanto a maturidade, suporte, segurança, licença e custo total, incluindo a saída.', quem: 'Líder técnico', pronto: 'Avaliação registrada', fonte: 'uk_aberto' },
    { oque: 'Exigir nos contratos licença de uso, acesso ao código e aos dados e plano de saída.', quem: 'Compras e jurídico', pronto: 'Cláusulas incluídas nos contratos', fonte: 'wef' },
    { oque: 'Planejar a transferência de conhecimento para a equipe interna e reservar orçamento de manutenção.', quem: 'Líder técnico', pronto: 'Plano de transferência aprovado' },
  ] },
  coordenacao: { resumo: 'Comitês e instâncias de coordenação entre órgãos requerem ato formal, regimento e calendário de reuniões.', prazo: '2 a 4 meses', passos: [
    { oque: 'Identificar os órgãos que devem integrar a instância.', quem: '{COORD}', pronto: 'Lista de órgãos e pontos focais' },
    { oque: 'Pactuar com cada órgão o respectivo papel.', quem: '{COORD}', pronto: 'Pontos focais indicados' },
    { oque: 'Formalizar a instância por resolução conjunta ou acordo de cooperação.', quem: 'Gabinete e jurídico', pronto: 'Ato publicado ou acordo assinado', adaptar: true },
    { oque: 'Aprovar o regimento: mandato, composição, quórum, secretaria e calendário.', quem: '{SEC}', pronto: 'Regimento aprovado' },
    { oque: 'Realizar a primeira reunião e aprovar o plano de trabalho anual.', quem: '{SEC}', pronto: 'Ata da primeira reunião' },
  ] },
  pessoal: { resumo: 'O provimento de pessoal especializado parte das competências já existentes no órgão e se completa por designação ou contratação.', prazo: '2 a 6 meses', passos: [
    { oque: 'Levantar as competências já existentes no órgão.', quem: 'RH e coordenação', pronto: 'Levantamento concluído', fonte: 'wef' },
    { oque: 'Definir, por perfil, a forma de provimento: designação, contratação ou cooperação.', quem: 'Coordenação', pronto: 'Quadro de pessoal definido' },
    { oque: 'Elaborar os termos de referência dos perfis a contratar e conduzir a seleção.', quem: 'RH e compras', pronto: 'Profissionais contratados', adaptar: true },
  ] },
  formacao: { resumo: 'A formação dos servidores parte das competências exigidas pelo plano e de um diagnóstico, e passa por piloto antes da ampliação.', prazo: '6 a 12 meses até a primeira turma em escala', passos: [
    { oque: 'Definir as competências exigidas dos servidores (regulação, contratações, dados, ética da IA).', quem: 'Coordenação e RH', pronto: 'Referencial de competências aprovado', nota: 'Referência possível: Recomendação da UNESCO sobre a Ética da IA.' },
    { oque: 'Diagnosticar as lacunas de competência por perfil.', quem: 'Equipe de formação', pronto: 'Diagnóstico concluído' },
    { oque: 'Desenhar trilhas por perfil e realizar turma piloto.', quem: 'Equipe de formação', pronto: 'Piloto concluído e avaliado' },
    { oque: 'Ampliar a oferta e avaliar a mudança na prática profissional.', quem: 'Equipe de formação', pronto: 'Relatório de avaliação' },
  ] },
};

/** Mês de início de referência de cada tipo. Coordenação e pessoal primeiro; normas, diretrizes, dados e infraestrutura com o
 *  parecer jurídico em mãos (mês 3); sandbox, avaliação de risco e supervisão a partir do mês 4. Convenção da ferramenta. */
const INICIO_TIPO: Record<TipoOpcao, number> = { coordenacao: 1, pessoal: 1, dados: 3, norma: 3, diretriz: 3, infra: 3, independencia: 3, formacao: 4, sandbox: 4, risco: 4, supervisao: 4 };
/** Prazo mínimo habitual (meses) por tipo, para alertar quando o plano prevê menos. */
const MINIMO_TIPO: Partial<Record<TipoOpcao, number>> = { norma: 9, diretriz: 4 };
export const TITULO_TIPO: Record<TipoOpcao, string> = { norma: 'Normas', diretriz: 'Diretrizes e padrões', sandbox: 'Sandbox regulatório', risco: 'Avaliações de risco', supervisao: 'Unidade de supervisão',
  dados: 'Governança de dados', infra: 'Contratação de infraestrutura', independencia: 'Independência tecnológica', coordenacao: 'Coordenação e comitês', pessoal: 'Pessoal especializado', formacao: 'Formação dos servidores' };

export interface OpcaoInfo { rotulo: string; categoria: string; meses: number | null; continua: boolean; equipe: string; custo: string | null; inicio: number; fim: number | null; falta: string | null; alerta: string | null }
export interface GrupoRoteiro { tipo: TipoOpcao; titulo: string; resumo: string; prazoTipico: string; opcoes: OpcaoInfo[]; passos: Passo[] }
export interface Roteiro {
  titulo: string; duracao: number; totais: { opcoes: string; adicionais: string; total: string; semValor: string[]; medidas: number };
  /** etapas 1 a 7; a etapa 6 (execução das medidas) não tem ações próprias: as ações estão em `grupos` */
  etapas: Etapa[]; grupos: GrupoRoteiro[];
  calendario: { rotulo: string; inicio: number; fim: number | null; continua: boolean; semPrazo: boolean; passa: boolean }[];
  riscos: string[]; glossario: [string, string][];
}

/** Traduz os textos de um passo (o português é a chave). */
const traduzir = (p: Passo): Passo => ({ ...p, oque: t(p.oque), quem: t(p.quem), pronto: t(p.pronto), prazo: p.prazo ? t(p.prazo) : undefined, nota: p.nota ? t(p.nota) : undefined });
const minus1 = (x: string) => /^.[A-Z]/.test(x) ? x : x.charAt(0).toLowerCase() + x.slice(1);
/** Troca os marcadores de responsável pelo papel que a equipe da opção tem (ou pela área que costuma fazer). */
function resolverQuem(quem: string, papeis: string[]): string {
  const tem = (re: RegExp) => papeis.find(p => re.test(p));
  return quem
    .replace('{JUR}', tem(/jur|direito/i) ? t('{papel} da equipe', { papel: t(tem(/jur|direito/i)!) }) : t('Consultoria jurídica do ministério (a equipe não tem jurista)'))
    .replace('{CONSULTA}', tem(/consulta/i) ? t('Analista de consulta pública da equipe') : t('Coordenação, com apoio da comunicação (a equipe não tem analista de consulta)'))
    .replace('{COORD}', tem(/^Coordena/i) ? t('Coordenação') : tem(/Secret/i) ? t(tem(/Secret/i)!) : t('Coordenação do plano'))
    .replace('{SEC}', tem(/Secret/i) ? t(tem(/Secret/i)!) : tem(/^Coordena/i) ? t('Coordenação') : t('Coordenação do plano'));
}

/** Monta o roteiro a partir do orçamento da governança do caso. */
export function montarRoteiro(s: Pick<Estado14, 'ctx' | 'moeda'>): Roteiro {
  const o = orcamentoV16(s as any, 'governanca');
  const redondo = (v: number) => formatarMoedaEst(Math.round(v / 1000) * 1000, o.moeda).replace(/[,.]00(?=\D*$)/, '');
  const duracao = o.fases.reduce((n, f) => n + f.meses, 0) || 12;
  const itensOp = o.itens.filter(i => i.id !== 'adicionais'), adic = o.itens.find(i => i.id === 'adicionais');
  const linhas = itensOp.flatMap(i => i.linhas.map(l => ({ i, l })));
  const somaOp = itensOp.reduce((n, i) => n + (i.valor || 0), 0), somaAd = adic?.valor || 0;
  const semValor = linhas.filter(({ l }) => l.total === null).map(({ l }) => l.rotulo);
  const continuas = linhas.filter(({ l }) => l.continua && l.total !== null);
  const normas = linhas.filter(({ l }) => ['norma', 'sandbox', 'supervisao'].includes(TIPO_OPCAO[l.rotulo])).map(({ l }) => l.rotulo);
  const postos = linhas.reduce((n, { l }) => n + (l.time ? l.time.reduce((a, p) => a + p.qtd, 0) : 0), 0);
  const eti = Math.round(linhas.reduce((n, { l }) => n + (l.time ? l.time.reduce((a, p) => a + p.qtd * p.dedicacao, 0) : 0), 0) * 10) / 10;
  const taxa = adic?.linhas.find(l => l.chave === 'taxa');
  const temComite = linhas.some(({ l }) => TIPO_OPCAO[l.rotulo] === 'coordenacao');
  const num = (v: number) => new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 1 }).format(v);
  const executor = ((raizOrcamento(s as any, 'governanca').adicionais || {}) as SalvoAdicionais).executor;
  const QUEM_EXECUTA = { proprio: 'o próprio órgão', onu: 'agência das Nações Unidas ou organismo internacional', fundacao: 'fundação de apoio ou outra entidade' };

  const r2: Passo = { id: 'r2', oque: executor === 'proprio' ? t('Confirmar a execução dos recursos pelo próprio órgão, sem incidência de taxa administrativa.')
      : executor ? t('Formalizar a execução dos recursos por {quem}, com taxa administrativa de {p}%: negociar as condições e celebrar o acordo.', { quem: t(QUEM_EXECUTA[executor]), p: num(taxa?.qtd ?? 0) })
      : taxa && taxa.qtd !== null ? t('Definir a instância executora dos recursos (o próprio órgão, agência das Nações Unidas ou fundação de apoio), considerando o efeito sobre a taxa administrativa (atualmente {p}% no plano) e sobre o custo total.', { p: num(taxa.qtd) })
      : t('Definir a instância executora dos recursos (o próprio órgão, agência das Nações Unidas ou fundação de apoio), considerando o efeito sobre a taxa administrativa e sobre o custo total.'),
    quem: 'Gabinete e planejamento', pronto: executor === 'proprio' ? 'Decisão registrada' : 'Decisão registrada e, se houver intermediário, acordo assinado', prazo: executor === 'proprio' ? undefined : '3 a 6 meses para o acordo', adaptar: true, depende: ['d1'] };

  const etapas: Etapa[] = ([
    { id: 'decisao', n: 1, titulo: 'Decisão e governança do plano', quando: 'Meses 1 e 2',
      objetivo: 'Assegurar a aprovação formal do plano e definir quem responde por sua execução.',
      porque: 'Sem respaldo formal e sem responsáveis designados, as demais etapas não avançam: contratações, normas e orçamento dependem de decisões da autoridade máxima.', passos: [
      { id: 'd4', oque: 'Elaborar nota conceitual de até uma página com o problema a ser enfrentado e o resultado esperado, a partir dos desafios selecionados no plano.', quem: 'Coordenação do plano', pronto: 'Nota conceitual', prazo: '1 semana', fonte: 'uk_ia' },
      { id: 'd1', oque: 'Submeter o resumo para decisão à autoridade máxima e obter a aprovação formal do plano.', quem: 'Gabinete do ministro ou secretário', pronto: 'Despacho ou nota de aprovação', prazo: '2 a 4 semanas', depende: ['d4'] },
      { id: 'd2', oque: 'Designar o patrocinador do plano: dirigente de alto nível responsável pelos resultados e pela resolução de impasses.', quem: 'Autoridade máxima', pronto: 'Ato de designação publicado', adaptar: true, fonte: 'uk_sro', depende: ['d1'] },
      { id: 'd3', oque: 'Designar a coordenação executiva, com dedicação de tempo definida.', quem: 'Patrocinador', pronto: 'Ato de designação com a dedicação prevista', depende: ['d2'] },
      { id: 'e3', oque: temComite ? 'Instituir o comitê do plano por meio da medida “Comitês de governança” (ver etapa 6).' : 'Instituir o comitê do plano, com mandato, composição e calendário de reuniões.', quem: 'Patrocinador', pronto: 'Ato publicado e ata da primeira reunião', depende: ['d2'] },
    ] },
    { id: 'legal', n: 2, titulo: 'Base legal', quando: 'Meses 1 a 3',
      objetivo: 'Confirmar a competência do órgão e o instrumento jurídico adequado a cada medida do plano.',
      porque: 'Normas, sandbox e unidades de supervisão exigem base legal; identificar cedo o instrumento necessário (lei, decreto ou portaria) evita retrabalho e atrasos.', passos: [
      { id: 'l1', oque: normas.length ? t('Solicitar à consultoria jurídica parecer sobre a competência e o instrumento normativo (lei, decreto ou portaria) de cada medida: {medidas}.', { medidas: normas.map(x => t(x)).join('; ') }) : 'Solicitar à consultoria jurídica parecer sobre a competência do órgão e o instrumento normativo de cada medida do plano.',
        quem: 'Consultoria jurídica do ministério', pronto: 'Parecer jurídico', prazo: '4 a 8 semanas', adaptar: true, depende: ['d1'] },
      { id: 'l2', oque: 'Identificar os demais órgãos com competência no tema (como as autoridades de proteção de dados e de cibersegurança) e pactuar a forma de atuação conjunta.', quem: 'Coordenação', pronto: 'Matriz de competências ou acordo de cooperação', fonte: 'aiact57' },
    ] },
    { id: 'recursos', n: 3, titulo: 'Recursos orçamentários', quando: 'Meses 1 a 6',
      objetivo: 'Assegurar os recursos do plano no orçamento do exercício e nos exercícios seguintes.',
      porque: 'O orçamento estimado nesta ferramenta precisa entrar no ciclo orçamentário do país; os custos que continuam após o primeiro ano devem constar do planejamento plurianual.', passos: [
      r2,
      { id: 'r1', oque: o.capex > 0
          // v018.1: com investimento no plano, a proposta separa investimento (CapEx) e operação (OpEx)
          ? t('Incluir o orçamento do plano (cerca de {total} em {meses} meses, dos quais {k} de investimento e {x} de operação) na proposta orçamentária, discriminado por exercício e por natureza de despesa (investimento, pessoal, serviços, viagens).', { total: redondo(somaOp + somaAd), meses: duracao, k: redondo(o.capex), x: redondo(o.opex) })
          : t('Incluir o orçamento do plano (cerca de {total} em {meses} meses) na proposta orçamentária, discriminado por exercício e por natureza de despesa (pessoal, serviços, viagens).', { total: redondo(somaOp + somaAd), meses: duracao }),
        quem: 'Unidade de planejamento e orçamento', pronto: 'Recursos previstos na lei orçamentária', prazo: 'conforme o calendário orçamentário do país (até um ano)', adaptar: true, depende: ['r2'] },
      ...(continuas.length ? [{ id: 'r3', oque: t('Prever nos orçamentos dos exercícios seguintes os custos continuados: {lista}.', { lista: continuas.map(({ l }) => t('{opcao} (cerca de {valor} por ano)', { opcao: t(l.rotulo), valor: redondo((l.total as number) / duracao * 12) })).join('; ') }),
        quem: 'Planejamento e orçamento', pronto: 'Custos continuados no plano plurianual', adaptar: true, depende: ['r1'] }] : []),
      ...(semValor.length ? [{ id: 'r4', oque: t('Levantar o custo dos itens ainda sem valor no plano: {lista}.', { lista: semValor.map(x => t(x)).join('; ') }), quem: 'Coordenação e área de compras', pronto: 'Valores registrados na ferramenta' }] : []),
    ] },
    { id: 'equipe', n: 4, titulo: 'Equipe', quando: 'Meses 1 a 6',
      objetivo: 'Compor a equipe necessária à execução das medidas do plano.',
      porque: 'As equipes de referência da ferramenta indicam os papéis e a dedicação de cada medida; cabe definir quais serão supridos por servidores do órgão, por contratação ou por cooperação.', passos: [
      { id: 'e1', oque: t('Definir, para cada papel das equipes de referência, a forma de provimento: designação de servidor, contratação ou cooperação. O plano soma {postos} postos ({eti} em tempo integral); um mesmo profissional pode exercer o mesmo papel em mais de uma medida, como a coordenação.', { postos: num(postos), eti: num(eti) }),
        quem: 'Coordenação e RH', pronto: 'Quadro de provimento por papel', depende: ['d3'] },
      { id: 'e2', oque: 'Elaborar os termos de referência dos papéis a contratar (produtos, prazos e qualificações) e conduzir a seleção.', quem: 'RH e compras', pronto: 'Profissionais contratados ou designados', prazo: '4 a 12 semanas até a contratação', adaptar: true, depende: ['e1', 'r1'] },
    ] },
    { id: 'participacao', n: 5, titulo: 'Participação e indicadores', quando: 'Meses 2 a 5',
      objetivo: 'Envolver as partes interessadas e definir como os resultados do plano serão medidos.',
      porque: 'Consulta pública e indicadores definidos desde o início conferem legitimidade ao plano e permitem demonstrar resultados.', passos: [
      { id: 'o1', oque: 'Mapear as partes interessadas: escolas, professores, estudantes e famílias, fornecedores e sociedade civil.', quem: 'Coordenação', pronto: 'Mapa de partes interessadas' },
      { id: 'o2', oque: 'Planejar a consulta pública: calendário, meios, linguagem acessível e forma de publicação das contribuições e das respostas.', quem: 'Coordenação', pronto: 'Plano de consulta aprovado', fonte: 'uk_consulta', depende: ['o1'] },
      { id: 'o3', oque: 'Definir os indicadores de cada desafio, a linha de base e os responsáveis pela coleta.', quem: 'Coordenação', pronto: 'Matriz de indicadores com linha de base', fonte: 'ocde_air' },
    ] },
    { id: 'execucao', n: 6, titulo: 'Execução das medidas do plano', quando: 'Conforme o calendário de referência',
      objetivo: 'Implementar as medidas selecionadas no plano, conforme o rito próprio de cada tipo.',
      porque: 'Cada tipo de medida segue um rito próprio: uma norma exige consulta pública e publicação oficial; um sandbox exige ato de criação e relatório de saída; uma unidade de supervisão exige estrutura permanente.', passos: [] },
    { id: 'acompanhamento', n: 7, titulo: 'Monitoramento e prestação de contas', quando: 'Durante toda a execução',
      objetivo: 'Acompanhar a execução, corrigir o rumo e prestar contas dos resultados.',
      porque: 'A revisão periódica dos marcos permite identificar atrasos cedo; a publicação de resultados sustenta o apoio institucional ao plano.', passos: [
      { id: 'a1', oque: 'Realizar reuniões mensais do comitê para revisar este roteiro e os marcos de cada medida.', quem: 'Coordenação', pronto: 'Atas mensais', depende: ['e3'] },
      { id: 'a2', oque: 'Publicar relatório anual de execução, com as ações realizadas, os custos e os indicadores.', quem: 'Coordenação', pronto: 'Relatório anual publicado', depende: ['o3'] },
      { id: 'a3', oque: 'Avaliar os resultados ao final do plano e decidir sobre a continuidade, o ajuste ou o encerramento de cada medida.', quem: 'Patrocinador e comitê', pronto: 'Relatório de avaliação e decisão', fonte: 'ocde_air' },
    ] },
  ] as Etapa[]).filter(e => e.id !== 'execucao' || linhas.length)
    .map(e => ({ ...e, titulo: t(e.titulo), quando: t(e.quando), objetivo: t(e.objetivo), porque: t(e.porque), passos: e.passos.map(traduzir) }));

  // uma seção por tipo de medida: as ações aparecem uma vez, com as medidas que elas cobrem
  const porTipo = new Map<TipoOpcao, OpcaoInfo[]>(); const papeisTipo = new Map<TipoOpcao, string[]>();
  for (const { i, l } of linhas) {
    const tipo = TIPO_OPCAO[l.rotulo] || 'diretriz', ini = INICIO_TIPO[tipo];
    const papeis = l.time ? l.time.filter(p => p.qtd > 0) : [];
    const equipe = papeis.map(p => (p.qtd === 1 ? '' : num(p.qtd) + ' × ') + minus1(t(p.papel))).join(', ');
    const meses = l.tipo === 'time' && !l.continua ? l.horas : null;
    const min = MINIMO_TIPO[tipo];
    const info: OpcaoInfo = { rotulo: l.rotulo, categoria: (i.n ? i.n + ' ' : '') + i.nome, meses, continua: !!l.continua, equipe, custo: l.total === null ? null : redondo(l.total), inicio: ini,
      fim: l.continua ? null : meses ? ini + meses - 1 : null,
      falta: l.total === null ? t('Item ainda sem custo no plano: informar o valor na etapa de opções.') : null,
      alerta: meses && min && meses < min ? t('O plano prevê {n} meses; {tipo} costumam exigir {prazo}.', { n: meses, tipo: minus1(t(TITULO_TIPO[tipo])), prazo: t(PASSOS_TIPO[tipo].prazo) }) : null };
    porTipo.set(tipo, [...(porTipo.get(tipo) || []), info]);
    papeisTipo.set(tipo, [...(papeisTipo.get(tipo) || []), ...papeis.map(p => p.papel)]);
  }
  const grupos: GrupoRoteiro[] = [...porTipo.entries()].sort((a, b) => INICIO_TIPO[a[0]] - INICIO_TIPO[b[0]]).map(([tipo, ops]) => {
    const mod = PASSOS_TIPO[tipo], papeis = papeisTipo.get(tipo) || [];
    return { tipo, titulo: t(TITULO_TIPO[tipo]), resumo: t(mod.resumo), prazoTipico: t(mod.prazo), opcoes: ops,
      passos: mod.passos.map((p, k) => ({ ...traduzir(p as Passo), id: tipo + '-' + (k + 1), quem: resolverQuem(t(p.quem), papeis) })) };
  });

  const calendario = grupos.flatMap(g => g.opcoes.map(x => ({ rotulo: x.rotulo, inicio: x.inicio, fim: x.fim, continua: x.continua, semPrazo: !x.continua && x.fim === null, passa: x.fim !== null && x.fim > duracao })));
  const riscos = [
    'Iniciar a execução sem patrocínio formal e sem coordenação com dedicação definida.',
    'Contratar tecnologia antes de conhecer os dados disponíveis e seus responsáveis.',
    'Descrever a solução no edital, em vez do problema, o que restringe a concorrência e gera dependência de um único fornecedor.',
    'Orçar apenas o primeiro ano e omitir os custos continuados (supervisão, manutenção, nuvem, pessoal).',
    'Realizar a consulta pública tardiamente ou não publicar as respostas às contribuições.',
    'Utilizar o sandbox para contornar a legislação: o instrumento requer base legal, salvaguardas e plano de saída.',
  ];
  const glossario: [string, string][] = [
    ['Patrocinador', 'Dirigente de alto nível responsável pelos resultados do plano e pela resolução de impasses; não precisa atuar na execução cotidiana.'],
    ['Parecer jurídico', 'Manifestação da consultoria jurídica sobre a competência do órgão e o instrumento adequado a cada medida.'],
    ['Termo de referência', 'Documento que descreve os produtos, os prazos e as qualificações exigidos do profissional ou da empresa a contratar.'],
    ['Linha de base', 'Valor de um indicador antes do início do plano, usado como referência de comparação.'],
    ['Consulta pública', 'Período em que qualquer interessado pode se manifestar sobre uma proposta antes de sua aprovação.'],
    ['Sandbox regulatório', 'Ambiente de teste de soluções por tempo limitado, com regras próprias e acompanhamento do poder público.'],
    ['Análise de impacto regulatório', 'Estudo que compara alternativas antes da edição de uma norma: problema, opções, custos e benefícios.'],
    ['Tempo integral equivalente', 'Soma da dedicação dos profissionais: dois profissionais com dedicação de 50% equivalem a um em tempo integral.'],
  ];
  return { titulo: t('Roteiro de implementação do plano de governança'), duracao,
    totais: { opcoes: redondo(somaOp), adicionais: redondo(somaAd), total: redondo(somaOp + somaAd), semValor, medidas: linhas.length },
    etapas, grupos, calendario, riscos: riscos.map(x => t(x)), glossario: glossario.map(([a, b]) => [t(a), t(b)] as [string, string]) };
}
