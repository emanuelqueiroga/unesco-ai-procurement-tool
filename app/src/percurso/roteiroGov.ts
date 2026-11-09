// v018: "Roteiro para pôr o plano em prática" da governança (terceiro PDF, só para imprimir). Um checklist em linguagem simples, montado
// a partir do que a pessoa escolheu: primeiro os passos que valem para qualquer plano (decidir, base legal, recursos,
// equipe, ouvir e medir), depois os passos de cada opção escolhida, com a equipe, os meses e o custo que o plano já
// calculou, e um calendário sugerido. Cada passo diz o que fazer, quem costuma fazer, como saber que terminou, o prazo
// típico, do que depende, se depende das regras do país e a fonte. Prazos sem fonte são convenção da ferramenta.
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
export interface Etapa { id: string; titulo: string; quando: string; porque: string; passos: Passo[] }
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
  'Adoção e manutenção de código aberto': 'independencia', 'Transferência de tecnologia': 'independencia', 'Customização local': 'independencia', 'Redução da dependência de fornecedores': 'independencia',
  'Especialistas em TI (IA, dados, segurança, infraestrutura)': 'pessoal', 'Profissionais jurídicos': 'pessoal', 'Pessoal de governança de IA': 'pessoal', 'Especialistas em IA e educação': 'pessoal',
  'Formação e desenvolvimento profissional': 'formacao',
  'Comitês de governança': 'coordenacao', 'Coordenação interministerial': 'coordenacao', 'Estruturas institucionais de governança': 'coordenacao',
};

/** Passos de cada tipo de opção. `{opcao}` é trocado pelo nome da opção. */
export const PASSOS_TIPO: Record<TipoOpcao, { resumo: string; prazo: string; passos: Omit<Passo, 'id'>[] }> = {
  norma: { resumo: 'Uma norma passa por estudo, minuta, consulta pública, revisão jurídica, aprovação e publicação.', prazo: '9 a 24 meses (mais, se precisar de lei)', passos: [
    { oque: 'Descreva o problema com dados e diga o que a norma precisa mudar.', quem: 'Coordenação e especialistas da equipe', pronto: 'Nota técnica com o problema e os objetivos', fonte: 'ocde_air' },
    { oque: 'Compare alternativas, inclusive as que não exigem norma (orientação, contrato, formação).', quem: 'Especialistas da equipe', pronto: 'Análise de impacto regulatório, mesmo que simples', fonte: 'ocde_air' },
    { oque: 'Redija a minuta da norma.', quem: '{JUR}', pronto: 'Minuta revisada pela coordenação' },
    { oque: 'Faça consulta pública da minuta, em linguagem simples, e publique as respostas do governo.', quem: '{CONSULTA}', pronto: 'Relatório da consulta publicado', prazo: '1 a 3 meses', fonte: 'uk_consulta' },
    { oque: 'Envie a versão final para revisão jurídica.', quem: 'Consultoria jurídica do ministério', pronto: 'Parecer jurídico favorável', adaptar: true },
    { oque: 'Leve a norma à autoridade que pode aprová-la e publique-a no diário oficial.', quem: 'Gabinete', pronto: 'Norma publicada no diário oficial ou no meio oficial de publicação do país', adaptar: true },
    { oque: 'Publique um guia de aplicação e perguntas frequentes para escolas, redes e fornecedores.', quem: 'Equipe da opção', pronto: 'Guia publicado' },
    { oque: 'Marque a avaliação dos efeitos da norma, de 1 a 2 anos depois.', quem: 'Coordenação', pronto: 'Data e indicadores da avaliação definidos', fonte: 'ocde_air' },
  ] },
  diretriz: { resumo: 'Uma diretriz não tem força de lei: parte de referências que já existem, é validada com escolas e redes e é publicada em linguagem simples.', prazo: '4 a 9 meses', passos: [
    { oque: 'Defina o escopo e para quem é a diretriz (gestores, professores, estudantes, fornecedores).', quem: 'Coordenação', pronto: 'Termo de abertura de uma página' },
    { oque: 'Parta de referências existentes em vez de começar do zero.', quem: 'Especialistas da equipe', pronto: 'Lista de referências usadas', nota: 'Exemplos: a Recomendação da UNESCO sobre a Ética da IA, as orientações da UNESCO sobre IA generativa na educação e, para compras, o AI Procurement in a Box.' },
    { oque: 'Forme um grupo técnico com escolas, redes, academia e sociedade civil.', quem: 'Coordenação', pronto: 'Grupo nomeado e primeira reunião feita', fonte: 'iso' },
    { oque: 'Redija a diretriz e abra para comentários.', quem: 'Especialistas e redator técnico', pronto: 'Minuta com comentários recebidos' },
    { oque: 'Ajuste o texto, aprove e publique em linguagem simples.', quem: 'Coordenação e gabinete', pronto: 'Diretriz publicada' },
    { oque: 'Defina a data da primeira revisão.', quem: 'Coordenação', pronto: 'Data de revisão publicada junto com a diretriz' },
  ] },
  sandbox: { resumo: 'Um sandbox regulatório permite testar soluções por tempo limitado, com regras próprias e acompanhamento, e termina com um relatório de saída.', prazo: '6 a 12 meses para montar; 3 a 6 meses por projeto testado', passos: [
    { oque: 'Confirme que um sandbox é necessário: há uma regra que impede ou deixa dúvida sobre o teste?', quem: 'Coordenação e jurídico', pronto: 'Nota de decisão', fonte: 'agu' },
    { oque: 'Faça a análise legal e publique o ato que cria o sandbox: regras, exceções permitidas, salvaguardas, supervisão e plano de saída.', quem: 'Especialista em regulação e consultoria jurídica', pronto: 'Ato do sandbox publicado', prazo: '3 a 6 meses, se for ato do próprio órgão', adaptar: true, fonte: 'agu' },
    { oque: 'Publique o edital com os critérios de elegibilidade e seleção.', quem: 'Coordenação', pronto: 'Edital publicado', prazo: 'inscrições de cerca de 6 semanas, como no edital da ANPD', fonte: 'anpd' },
    { oque: 'Selecione os projetos e acorde um plano de teste com cada participante.', quem: 'Coordenação e especialista em IA', pronto: 'Planos individuais assinados', fonte: 'aiact57' },
    { oque: 'Antes de qualquer teste com estudantes, avalie o impacto sobre dados pessoais e direitos da criança e obtenha o consentimento das famílias, como a lei do país exigir.', quem: 'Especialista em regulação e encarregado de proteção de dados', pronto: 'Avaliação de impacto aprovada e termos de consentimento assinados', adaptar: true },
    { oque: 'Acompanhe os testes nas escolas piloto e registre as evidências.', quem: 'Articulador com as escolas e analista técnico', pronto: 'Relatórios de acompanhamento', prazo: '3 a 6 meses por projeto', fonte: 'noruega' },
    { oque: 'Entregue um relatório de saída por projeto e decida a regra que vale depois do teste.', quem: 'Coordenação', pronto: 'Relatórios de saída e decisão publicados', fonte: 'aiact57' },
  ] },
  risco: { resumo: 'Cada projeto testado passa por uma avaliação de risco antes e durante o teste.', prazo: 'cerca de 1,5 mês por projeto', passos: [
    { oque: 'Adote um modelo de avaliação de risco (impacto em estudantes, professores e dados).', quem: 'Especialista em avaliação de risco', pronto: 'Modelo aprovado pela coordenação', fonte: 'uk_ia' },
    { oque: 'Avalie cada projeto antes do teste e defina medidas para reduzir os riscos.', quem: 'Especialista em avaliação de risco e cientista de dados', pronto: 'Avaliação assinada por projeto' },
    { oque: 'Revise a avaliação nos pontos de decisão do teste.', quem: 'Equipe da opção', pronto: 'Avaliações atualizadas no relatório de saída', fonte: 'uk_ia' },
  ] },
  supervisao: { resumo: 'Uma unidade de supervisão precisa de funções claras, independência, procedimentos e pessoal permanente.', prazo: '6 a 18 meses para estar funcionando', passos: [
    { oque: 'Crie a unidade por ato normativo, com funções que não conflitem com as de fomento.', quem: 'Gabinete e jurídico', pronto: 'Ato de criação publicado', adaptar: true, fonte: 'ocde_reg' },
    { oque: 'Defina como a unidade decide, presta contas e evita influência indevida.', quem: 'Chefia da unidade', pronto: 'Regimento interno aprovado', fonte: 'ocde_reg' },
    { oque: 'Abra um ponto de contato público para escolas, fornecedores e cidadãos.', quem: 'Chefia da unidade', pronto: 'Ponto de contato divulgado', fonte: 'aiact70' },
    { oque: 'Garanta pessoal permanente com conhecimento técnico e jurídico, e revise a equipe todo ano.', quem: 'Gabinete e RH', pronto: 'Equipe lotada e revisão anual marcada', adaptar: true, fonte: 'aiact70' },
    { oque: 'Publique um relatório anual de atividades.', quem: 'Chefia da unidade', pronto: 'Primeiro relatório publicado' },
  ] },
  dados: { resumo: 'Governança de dados começa por um diagnóstico e um responsável, e avança por etapas, com salvaguardas de direitos.', prazo: '12 a 36 meses, por etapas', passos: [
    { oque: 'Faça um diagnóstico: política, leis, instituições e infraestrutura de dados da educação.', quem: 'Coordenação', pronto: 'Relatório de diagnóstico', fonte: 'bm_dados' },
    { oque: 'Nomeie um responsável pela governança dos dados educacionais.', quem: 'Gabinete', pronto: 'Ato de nomeação' },
    { oque: 'Faça o inventário e a classificação dos dados (o que existe, onde, quem acessa).', quem: 'Especialistas em governança de dados', pronto: 'Inventário publicado internamente' },
    { oque: 'Defina regras de acesso, compartilhamento e interoperabilidade, com salvaguardas de direitos.', quem: 'Especialistas e jurídico', pronto: 'Regras aprovadas', fonte: 'dpi' },
    { oque: 'Implante por etapas, começando pelos dados mais usados.', quem: 'Arquiteto de dados', pronto: 'Primeira etapa em uso', fonte: 'bm_dados' },
  ] },
  infra: { resumo: 'Contratar infraestrutura pede uma estratégia de hospedagem, um caso de negócio e um contrato com cláusulas de dados e de saída.', prazo: '4 a 9 meses até o contrato', passos: [
    { oque: 'Junte tecnologia, compras e segurança numa equipe de contratação.', quem: 'Coordenação', pronto: 'Equipe designada', fonte: 'uk_nuvem' },
    { oque: 'Defina onde os dados podem ficar e quem pode acessá-los.', quem: 'Segurança e jurídico', pronto: 'Decisão registrada', adaptar: true, fonte: 'uk_nuvem' },
    { oque: 'Inclua a hospedagem na proposta orçamentária do plano e aprove o caso de negócio.', quem: 'Equipe de contratação e orçamento', pronto: 'Caso de negócio aprovado', adaptar: true },
    { oque: 'Publique o edital descrevendo o problema, com cláusulas de dados, saída e controle de custos variáveis.', quem: 'Compras', pronto: 'Edital publicado', adaptar: true, fonte: 'uk_ia' },
    { oque: 'Contrate e acompanhe o gasto todo mês.', quem: 'Gestor do contrato', pronto: 'Contrato assinado e painel de gastos', fonte: 'uk_nuvem' },
  ] },
  independencia: { resumo: 'Independência tecnológica se faz com política de software livre, cláusulas nos contratos e equipe interna que entende o sistema.', prazo: '3 a 6 meses para a primeira política; depois, contínuo', passos: [
    { oque: 'Considere software livre em pé de igualdade com o proprietário nas compras.', quem: 'Líder técnico e compras', pronto: 'Regra escrita na política de compras', fonte: 'uk_aberto' },
    { oque: 'Avalie cada solução por maturidade, suporte, segurança, licença e custo total, incluindo a saída.', quem: 'Líder técnico', pronto: 'Avaliação registrada', fonte: 'uk_aberto' },
    { oque: 'Exija nos contratos licença de uso, acesso ao código e aos dados e um plano de saída.', quem: 'Compras e jurídico', pronto: 'Cláusulas nos contratos', fonte: 'wef' },
    { oque: 'Planeje a transferência de conhecimento para a equipe interna e reserve orçamento de manutenção.', quem: 'Líder técnico', pronto: 'Plano de transferência aprovado' },
  ] },
  coordenacao: { resumo: 'Comitês e coordenação entre órgãos precisam de ato formal, regimento e um calendário de reuniões.', prazo: '2 a 4 meses', passos: [
    { oque: 'Liste os órgãos que precisam estar na mesa.', quem: '{COORD}', pronto: 'Lista de órgãos e pontos focais' },
    { oque: 'Converse com cada órgão e combine o papel de cada um.', quem: '{COORD}', pronto: 'Pontos focais indicados' },
    { oque: 'Formalize por resolução conjunta ou acordo de cooperação.', quem: 'Gabinete e jurídico', pronto: 'Ato publicado ou acordo assinado', adaptar: true },
    { oque: 'Aprove o regimento: mandato, membros, quórum, secretaria e calendário.', quem: '{SEC}', pronto: 'Regimento aprovado' },
    { oque: 'Faça a primeira reunião e aprove o plano de trabalho do ano.', quem: '{SEC}', pronto: 'Ata da primeira reunião' },
  ] },
  pessoal: { resumo: 'Antes de contratar, veja quem já existe na casa; depois, designe ou contrate com termos de referência.', prazo: '2 a 6 meses', passos: [
    { oque: 'Levante as competências que já existem no ministério.', quem: 'RH e coordenação', pronto: 'Levantamento feito', fonte: 'wef' },
    { oque: 'Decida, perfil por perfil, entre designar, contratar ou buscar cooperação.', quem: 'Coordenação', pronto: 'Quadro de pessoal definido' },
    { oque: 'Escreva os termos de referência dos perfis a contratar e conduza a seleção.', quem: 'RH e compras', pronto: 'Pessoas contratadas', adaptar: true },
  ] },
  formacao: { resumo: 'A formação dos servidores da governança começa pelas competências que o plano exige e por um diagnóstico, e passa por um piloto antes de escalar.', prazo: '6 a 12 meses até a primeira turma em escala', passos: [
    { oque: 'Defina as competências que os servidores da governança precisam (regulação, compras, dados, ética de IA).', quem: 'Coordenação e RH', pronto: 'Referencial de competências aprovado', nota: 'Pode partir da Recomendação da UNESCO sobre a Ética da IA.' },
    { oque: 'Faça o diagnóstico das lacunas por perfil.', quem: 'Equipe de formação', pronto: 'Diagnóstico publicado' },
    { oque: 'Desenhe trilhas por perfil e faça uma turma piloto.', quem: 'Equipe de formação', pronto: 'Piloto concluído e avaliado' },
    { oque: 'Escale e avalie a mudança na prática.', quem: 'Equipe de formação', pronto: 'Relatório de avaliação' },
  ] },
};

/** Mês de início sugerido de cada tipo. Coordenação e pessoal primeiro; normas, diretrizes, dados e infraestrutura com o
 *  parecer jurídico em mãos (mês 3); sandbox, avaliação de risco e supervisão juntos, a partir do mês 4. */
const INICIO_TIPO: Record<TipoOpcao, number> = { coordenacao: 1, pessoal: 1, dados: 3, norma: 3, diretriz: 3, infra: 3, independencia: 3, formacao: 4, sandbox: 4, risco: 4, supervisao: 4 };
/** Prazo mínimo habitual (meses) por tipo, para avisar quando o plano prevê menos. */
const MINIMO_TIPO: Partial<Record<TipoOpcao, number>> = { norma: 9, diretriz: 4 };
const TITULO_TIPO: Record<TipoOpcao, string> = { norma: 'Normas', diretriz: 'Diretrizes e padrões', sandbox: 'Sandbox regulatório', risco: 'Avaliações de risco', supervisao: 'Unidade de supervisão',
  dados: 'Governança de dados', infra: 'Contratação de infraestrutura', independencia: 'Independência tecnológica', coordenacao: 'Coordenação e comitês', pessoal: 'Pessoal especializado', formacao: 'Formação dos servidores' };

export interface OpcaoInfo { rotulo: string; categoria: string; meses: number | null; continua: boolean; equipe: string; custo: string | null; inicio: number; fim: number | null; falta: string | null; alerta: string | null }
export interface GrupoRoteiro { tipo: TipoOpcao; titulo: string; resumo: string; prazoTipico: string; opcoes: OpcaoInfo[]; passos: Passo[] }
export interface Roteiro {
  titulo: string; duracao: number; totais: { opcoes: string; adicionais: string; total: string; semValor: string[] };
  primeiras: Passo[]; etapas: Etapa[]; grupos: GrupoRoteiro[];
  calendario: { rotulo: string; inicio: number; fim: number | null; continua: boolean; semPrazo: boolean; passa: boolean }[];
  armadilhas: string[]; glossario: [string, string][];
}

/** Traduz os textos de um passo (o português é a chave). */
const traduzir = (p: Passo): Passo => ({ ...p, oque: t(p.oque), quem: t(p.quem), pronto: t(p.pronto), prazo: p.prazo ? t(p.prazo) : undefined, nota: p.nota ? t(p.nota) : undefined });
const minus1 = (x: string) => /^.[A-Z]/.test(x) ? x : x.charAt(0).toLowerCase() + x.slice(1);
/** Troca os marcadores de "Quem" pelo papel que a equipe da opção tem (ou pelo setor que costuma fazer). */
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
  const QUEM_EXECUTA = { proprio: 'o próprio órgão', onu: 'uma agência da ONU ou organismo internacional', fundacao: 'uma fundação de apoio ou outra entidade' };

  const P: Record<string, Passo> = {
    d4: { id: 'd4', oque: 'Escreva em uma página o problema que o plano resolve e o resultado esperado, a partir dos desafios escolhidos.', quem: 'Quem vai coordenar o plano', pronto: 'Nota conceitual de uma página', prazo: '1 semana', fonte: 'uk_ia' },
    d1: { id: 'd1', oque: 'Apresente o resumo para decisão deste plano à autoridade máxima e peça a aprovação formal.', quem: 'Gabinete do ministro ou secretário', pronto: 'Despacho ou nota de aprovação', prazo: '2 a 4 semanas' },
    d2: { id: 'd2', oque: 'Nomeie um patrocinador: uma pessoa de alto nível que responde pelo resultado do plano e destrava decisões.', quem: 'Autoridade máxima', pronto: 'Ato de nomeação publicado', adaptar: true, fonte: 'uk_sro' },
    d3: { id: 'd3', oque: 'Nomeie a coordenação executiva, com tempo dedicado ao plano.', quem: 'Patrocinador', pronto: 'Ato com o nome e o tempo dedicado', depende: ['d2'] },
    r2: { id: 'r2', oque: executor ? (executor === 'proprio' ? t('O plano considera que o próprio órgão executa o recurso, sem taxa administrativa. Confirme essa decisão com o gabinete e o planejamento.')
        : t('O plano considera que o recurso será executado por {quem}, com taxa administrativa de {p}%. Confirme a decisão, negocie a taxa e assine o acordo.', { quem: t(QUEM_EXECUTA[executor]), p: num(taxa?.qtd ?? 0) }))
        : taxa && taxa.qtd !== null ? t('Decida quem vai executar o recurso: o próprio ministério, uma agência da ONU ou uma fundação de apoio. Isso muda a taxa administrativa (o plano usa {p}% hoje) e o total.', { p: num(taxa.qtd) })
        : t('Decida quem vai executar o recurso: o próprio ministério, uma agência da ONU ou uma fundação de apoio. Isso muda a taxa administrativa e o total.'),
      quem: 'Gabinete e planejamento', pronto: executor === 'proprio' ? 'Decisão registrada' : 'Decisão registrada e, se houver intermediário, acordo assinado', prazo: executor === 'proprio' ? undefined : '3 a 6 meses para o acordo', adaptar: true },
    l1: { id: 'l1', oque: normas.length ? t('Peça à consultoria jurídica um parecer sobre quem pode editar cada medida e por qual instrumento (lei, decreto, portaria): {medidas}.', { medidas: normas.map(x => t(x)).join('; ') }) : 'Peça à consultoria jurídica um parecer sobre a competência do ministério para cada medida do plano e o instrumento de cada uma.',
      quem: 'Consultoria jurídica do ministério', pronto: 'Parecer jurídico', prazo: '4 a 8 semanas', adaptar: true },
    r1: { id: 'r1', oque: t('Leve o orçamento deste plano (cerca de {total} em {meses} meses) à proposta orçamentária, dividido por ano e por tipo de gasto (pessoal, serviços, viagens).', { total: redondo(somaOp + somaAd), meses: duracao }), quem: 'Unidade de planejamento e orçamento', pronto: 'Recurso previsto no orçamento do ano', prazo: 'conforme o calendário do orçamento; pode levar um ano', adaptar: true, depende: ['r2'] },
    e1: { id: 'e1', oque: t('Para cada papel das equipes de referência, decida: designar um servidor, contratar ou buscar cooperação. Somando as opções, são {postos} postos ({eti} em tempo integral); uma mesma pessoa pode ocupar o mesmo papel em mais de uma opção, como a coordenação.', { postos: num(postos), eti: num(eti) }), quem: 'Coordenação e RH', pronto: 'Quadro com o nome ou a forma de contratação de cada papel', depende: ['d3'] },
    e3: { id: 'e3', oque: temComite ? 'Constitua o comitê do plano (é a opção "Comitês de governança" do seu plano; veja os passos dela, abaixo).' : 'Constitua um comitê do plano, com mandato, membros e calendário de reuniões.', quem: 'Patrocinador', pronto: 'Ato publicado e ata da primeira reunião', depende: ['d2'] },
    o1: { id: 'o1', oque: 'Liste quem é afetado pelo plano: escolas, professores, estudantes e famílias, fornecedores, sociedade civil.', quem: 'Coordenação', pronto: 'Lista de partes interessadas' },
  };
  const primeiras = ['d4', 'd1', 'd2', 'd3', 'r2', 'l1', 'r1', 'e1', 'e3', 'o1'].map(k => traduzir(P[k]));

  const etapas = ([
    { id: 'legal', titulo: 'Base legal', quando: 'Meses 1 a 3', porque: 'Além do parecer, os órgãos que dividem o tema precisam combinar como trabalham juntos.', passos: [
      { id: 'l2', oque: 'Identifique os órgãos que também têm competência no tema (autoridade de proteção de dados, de cibersegurança) e combine como trabalhar juntos.', quem: 'Coordenação', pronto: 'Matriz de competências ou acordo de cooperação', fonte: 'aiact57' },
    ] },
    { id: 'recursos', titulo: 'Recursos para os anos seguintes', quando: 'Meses 1 a 6', porque: 'Parte do plano continua depois do primeiro ano e precisa estar no orçamento plurianual.', passos: [
      ...(continuas.length ? [{ id: 'r3', oque: t('Preveja nos orçamentos dos anos seguintes os custos que continuam: {lista}.', { lista: continuas.map(({ l }) => t('{opcao} (cerca de {valor} por ano)', { opcao: t(l.rotulo), valor: redondo((l.total as number) / duracao * 12) })).join('; ') }), quem: 'Planejamento e orçamento', pronto: 'Custos recorrentes no plano plurianual', adaptar: true }] : []),
      ...(semValor.length ? [{ id: 'r4', oque: t('Levante o valor do que ainda está sem custo no plano: {lista}.', { lista: semValor.map(x => t(x)).join('; ') }), quem: 'Coordenação e compras', pronto: 'Valores informados na ferramenta' }] : []),
    ] },
    { id: 'equipe', titulo: 'Equipe', quando: 'Meses 1 a 6', porque: 'Depois de decidir quem é designado e quem é contratado, as contratações seguem as regras do país.', passos: [
      { id: 'e2', oque: 'Escreva os termos de referência dos papéis a contratar (produtos, prazos, qualificações) e conduza a seleção.', quem: 'RH e compras', pronto: 'Pessoas contratadas ou designadas', prazo: '4 a 12 semanas até a contratação', adaptar: true, depende: ['e1', 'r1'] },
    ] },
    { id: 'ouvir', titulo: 'Ouvir e medir', quando: 'Meses 2 a 5', porque: 'Consulta e indicadores definidos no início evitam retrabalho e permitem mostrar resultados.', passos: [
      { id: 'o2', oque: 'Planeje a consulta pública: quando, como, em linguagem simples, e como as respostas serão publicadas.', quem: 'Coordenação', pronto: 'Plano de consulta aprovado', fonte: 'uk_consulta' },
      { id: 'o3', oque: 'Defina os indicadores de cada desafio, o ponto de partida (linha de base) e quem coleta os dados.', quem: 'Coordenação', pronto: 'Quadro de indicadores com linha de base', fonte: 'ocde_air' },
    ] },
    { id: 'acompanhar', titulo: 'Acompanhar e prestar contas', quando: 'Durante todo o plano', porque: 'Revisar os marcos todo mês e publicar resultados mantém o apoio e mostra quando corrigir o rumo.', passos: [
      { id: 'a1', oque: 'Reúna o comitê todo mês para revisar este roteiro e os marcos de cada opção.', quem: 'Coordenação', pronto: 'Atas mensais', depende: ['e3'] },
      { id: 'a2', oque: 'Publique um relatório anual com o que foi feito, o que custou e os indicadores.', quem: 'Coordenação', pronto: 'Relatório anual publicado' },
      { id: 'a3', oque: 'Ao fim do plano, avalie os resultados e decida o que continua, o que muda e o que termina.', quem: 'Patrocinador e comitê', pronto: 'Relatório de avaliação e decisão', fonte: 'ocde_air' },
    ] },
  ] as Etapa[]).filter(e => e.passos.length).map(e => ({ ...e, titulo: t(e.titulo), quando: t(e.quando), porque: t(e.porque), passos: e.passos.map(traduzir) }));

  // uma ficha por tipo de opção: os passos aparecem uma vez, com as opções que eles cobrem
  const porTipo = new Map<TipoOpcao, OpcaoInfo[]>(); const papeisTipo = new Map<TipoOpcao, string[]>();
  for (const { i, l } of linhas) {
    const tipo = TIPO_OPCAO[l.rotulo] || 'diretriz', ini = INICIO_TIPO[tipo];
    const papeis = l.time ? l.time.filter(p => p.qtd > 0) : [];
    const equipe = papeis.map(p => (p.qtd === 1 ? '' : num(p.qtd) + ' × ') + minus1(t(p.papel))).join(', ');
    const meses = l.tipo === 'time' && !l.continua ? l.horas : null;
    const min = MINIMO_TIPO[tipo];
    const info: OpcaoInfo = { rotulo: l.rotulo, categoria: (i.n ? i.n + ' ' : '') + i.nome, meses, continua: !!l.continua, equipe, custo: l.total === null ? null : redondo(l.total), inicio: ini,
      fim: l.continua ? null : meses ? ini + meses - 1 : null,
      falta: l.total === null ? t('Ainda sem valor no plano: volte às opções e informe o custo.') : null,
      alerta: meses && min && meses < min ? t('O plano prevê {n} meses; {tipo} costumam levar {prazo}.', { n: meses, tipo: minus1(t(TITULO_TIPO[tipo])), prazo: t(PASSOS_TIPO[tipo].prazo) }) : null };
    porTipo.set(tipo, [...(porTipo.get(tipo) || []), info]);
    papeisTipo.set(tipo, [...(papeisTipo.get(tipo) || []), ...papeis.map(p => p.papel)]);
  }
  const grupos: GrupoRoteiro[] = [...porTipo.entries()].sort((a, b) => INICIO_TIPO[a[0]] - INICIO_TIPO[b[0]]).map(([tipo, ops]) => {
    const mod = PASSOS_TIPO[tipo], papeis = papeisTipo.get(tipo) || [];
    return { tipo, titulo: t(TITULO_TIPO[tipo]), resumo: t(mod.resumo), prazoTipico: t(mod.prazo), opcoes: ops,
      passos: mod.passos.map((p, k) => ({ ...traduzir(p as Passo), id: tipo + '-' + (k + 1), quem: resolverQuem(t(p.quem), papeis) })) };
  });

  const calendario = grupos.flatMap(g => g.opcoes.map(x => ({ rotulo: x.rotulo, inicio: x.inicio, fim: x.fim, continua: x.continua, semPrazo: !x.continua && x.fim === null, passa: x.fim !== null && x.fim > duracao })));
  const armadilhas = [
    'Começar sem patrocínio formal e sem coordenação com tempo dedicado.',
    'Contratar tecnologia antes de saber quais dados existem e quem responde por eles.',
    'Descrever a solução no edital em vez do problema: isso afasta fornecedores e prende o governo a um só.',
    'Orçar só o primeiro ano e esquecer os custos que continuam (supervisão, manutenção, nuvem, pessoal).',
    'Fazer a consulta pública tarde demais, ou não publicar as respostas.',
    'Usar o sandbox para driblar a lei: ele precisa de base legal, salvaguardas e plano de saída.',
  ];
  const glossario: [string, string][] = [
    ['Patrocinador', 'Pessoa de alto nível que responde pelo plano e destrava decisões; não precisa trabalhar nele todo dia.'],
    ['Parecer jurídico', 'Documento da consultoria jurídica que diz se o órgão pode fazer a medida e com que instrumento.'],
    ['Termo de referência', 'Documento que descreve o que uma pessoa ou empresa contratada vai entregar, em que prazo e com que qualificação.'],
    ['Linha de base', 'O valor de um indicador antes do plano começar, para comparar depois.'],
    ['Consulta pública', 'Período em que qualquer pessoa pode comentar uma proposta antes de ela ser aprovada.'],
    ['Sandbox regulatório', 'Teste de soluções por tempo limitado, com regras próprias e acompanhamento do governo.'],
    ['Análise de impacto regulatório', 'Estudo que compara alternativas antes de criar uma norma: o problema, as opções, custos e benefícios.'],
    ['Tempo integral equivalente', 'Soma do tempo das pessoas: duas pessoas com metade do tempo valem uma em tempo integral.'],
  ];
  return { titulo: t('Roteiro para pôr o plano em prática'), duracao, totais: { opcoes: redondo(somaOp), adicionais: redondo(somaAd), total: redondo(somaOp + somaAd), semValor },
    primeiras, etapas, grupos, calendario, armadilhas: armadilhas.map(x => t(x)), glossario: glossario.map(([a, b]) => [t(a), t(b)] as [string, string]) };
}
