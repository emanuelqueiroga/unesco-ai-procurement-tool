// Textos do percurso (v14): capítulos, a frase de abertura de cada pergunta e os rótulos dos trechos do plano.
// Português é a chave de tradução; `t()` traduz quando há dicionário (os textos novos entram nos
// dicionários em i18n/v14_<l>.json; até lá aparecem em português nos outros idiomas).
import { tr } from '../domain';
import type { Capitulo } from '../store';

export const t = (s: string, vars?: Record<string, string | number>): string => {
  let out = String(tr(s) ?? s);
  if (vars) Object.keys(vars).forEach((k) => { out = out.split('{' + k + '}').join(String(vars[k])); });
  return out;
};

export interface InfoCapitulo {
  n: Capitulo;
  titulo: string;
  guia: string;
  texto: string;
  minutos: number;
  /** o que o capítulo entrega, na página inicial */
  entrega: string;
  /** camadas de custo que o capítulo alimenta */
  alimenta: string;
}

export const CAPITULOS_INFO: Record<Capitulo, InfoCapitulo> = {
  1: {
    n: 1, titulo: 'Sua rede e o problema', minutos: 7,
    guia: 'Que problema da sua rede vale a pena resolver, e como saber se ele foi resolvido?',
    texto: 'Antes de falar de tecnologia, o plano precisa saber onde a decisão será tomada, quantas escolas e estudantes estão envolvidos e qual problema você quer resolver. No fim do capítulo, o plano já tem o perfil da rede e as primeiras recomendações de governança.',
    entrega: 'perfil da rede e problema definido',
    alimenta: 'governança, políticas e planejamento',
  },
  2: {
    n: 2, titulo: 'O teste', minutos: 8,
    guia: 'Como aprender o máximo sobre a ferramenta, com o menor risco e o menor custo?',
    texto: 'Antes de contratar para a rede inteira, vale testar em poucas escolas. Neste capítulo você diz o que a IA deve fazer, quem vai usar e de que tamanho será o teste. No fim, aparece o primeiro número do plano: quanto custa testar.',
    entrega: 'quanto custa testar',
    alimenta: 'aplicações, internet e dispositivos, formação, suporte',
  },
  3: {
    n: 3, titulo: 'A primeira etapa', minutos: 1,
    guia: 'Se o teste der certo, por onde começar de verdade?',
    texto: 'Depois do teste vem o primeiro ano de uso real, ainda sem a rede inteira. Uma pergunta só: quantas escolas e quantas pessoas começam. Você sai sabendo o custo do primeiro ano.',
    entrega: 'custo do primeiro ano',
    alimenta: 'operação e suporte, integração de dados',
  },
  4: {
    n: 4, titulo: 'Toda a rede', minutos: 2,
    guia: 'Quanto custa manter e ampliar a ferramenta ao longo dos anos?',
    texto: 'O último capítulo leva a estimativa à rede inteira: quantas pessoas usariam a ferramenta e em quanto tempo. Com isso o plano fica completo, com o custo total do ciclo de vida e tudo o que exigir na contratação.',
    entrega: 'o plano completo',
    alimenta: 'todas as camadas, ao longo do horizonte',
  },
};

/** Frase de abertura de cada tela do Essencial (tom explicativo: por que a pergunta importa para o plano). */
export const LEAD: Record<string, string> = {
  nivel: 'Quem decide e paga define as regras de compra, o orçamento e quem assina o contrato.',
  local: 'O nome aparece na capa do plano e nos documentos que você levar à equipe.',
  situacao: 'Uma proposta já recebida pede outras perguntas que uma iniciativa do zero. O plano ajusta as recomendações a esse ponto.',
  etapas: 'Escolas e estudantes são a base de quase todos os números: tamanho do teste, pessoas na rede e custo por estudante.',
  prioridades: 'A prioridade organiza os problemas que aparecem na próxima pergunta.',
  problemas: 'Escolha até três. Cada problema já traz uma descrição, impactos e tarefas que a IA pode apoiar; você ajusta depois.',
  problema: 'Um problema bem descrito, sem citar tecnologia, é o que permite comparar a IA com outras soluções.',
  impactos: 'O impacto vira o resultado esperado do teste e os indicadores do plano.',
  linhaBase: 'Sem uma medida de antes, não há como saber se o teste funcionou.',
  alternativa: 'Comparar com ao menos uma alternativa sem IA é o que justifica a compra perante a equipe e os órgãos de controle.',
  governanca: 'Nada aqui é avaliado agora. As respostas viram a seção de governança do plano e as primeiras recomendações.',
  testes: 'Testar antes de comprar reduz o risco. A escolha muda o tamanho e o custo do teste.',
  tarefas: 'A tarefa define que tipo de ferramenta procurar, quem a usa e que dados ela trata.',
  usuarios: 'Quem usa define quantas licenças, quanta formação e quantos dispositivos entram no custo.',
  afetados: 'Quanto mais a resposta da ferramenta pesa sobre crianças e adolescentes, mais salvaguardas o plano pede.',
  tipoTec: 'O tipo de tecnologia muda a forma de pagamento, as cláusulas do contrato e o custo de operação.',
  pagamento: 'A forma de pagamento muda o custo do teste e o risco de ficar preso a um fornecedor depois.',
  piloto: 'Um piloto pequeno ensina quase tanto quanto um grande e custa muito menos. Sugerimos cerca de 5% das escolas por 4 meses; mude se já tiver um plano.',
  internet: 'Conexão e dispositivos costumam custar mais do que a ferramenta. A resposta define o que entra no custo do teste.',
  modeloDisp: 'O modelo de uso define quantos dispositivos comprar ou manter.',
  formados: 'Formação é uma das maiores parcelas do custo, e a mais esquecida nos orçamentos.',
  suporteNivel: 'O suporte é custo de todos os anos, não só do teste.',
  implantacao: 'O primeiro ano de uso real costuma ser bem menor do que a rede inteira. Sugerimos um terço das pessoas; mude se já tiver um plano.',
  elegiveis: 'É a base da estimativa depois da implantação: licenças, formação e suporte crescem com esse número.',
  expansao: 'O ritmo de expansão distribui o custo pelos exercícios do orçamento.',
};

/** Rótulos dos trechos do plano que uma resposta pode mudar (afetadosPor, perguntas.ts). */
export function rotuloAfetado(id: string, H = 3): string | null {
  const R: Record<string, string> = {
    'kpi.ano0': 'custo do teste (Ano 0)',
    'kpi.anual': 'custo por ano de operação',
    'kpi.total': 'custo total em {H} anos',
    'kpi.porAluno': 'custo por estudante',
    A1: 'regras do teste e da implantação (A1)',
    A2: 'premissas da estimativa (A2)',
  };
  return R[id] ? t(R[id], { H }) : null;
}

/** "Esta resposta muda no plano: …" */
export function linhaAfeta(afetados: string[], H = 3): string {
  const partes = afetados.map((a) => rotuloAfetado(a, H)).filter(Boolean) as string[];
  const recs = afetados.filter((a) => a.startsWith('rec:')).length;
  if (recs) partes.push(recs === 1 ? t('1 recomendação possível') : t('{n} recomendações possíveis', { n: recs }));
  return partes.length ? partes.join(' · ') : t('perfil do caso');
}

export const NOME_TESTE: Record<string, string> = { poc: 'Prova de conceito', piloto: 'Piloto', ambos: 'Prova de conceito e piloto', recomendar: 'Teste a definir' };

/** Nome curto de cada tela, para a navegação lateral e a lista de pendências. */
export const CURTO: Record<string, string> = {
  nivel: 'Nível da decisão', local: 'Nome da rede', situacao: 'Em que ponto você está', etapas: 'Etapas, escolas e estudantes',
  prioridades: 'Prioridade', problemas: 'Problemas', problema: 'Situação atual', impactos: 'Impacto esperado', linhaBase: 'Linha de base',
  alternativa: 'Alternativa sem IA', governanca: 'Governança', testes: 'Tipo de teste', tarefas: 'O que a IA faz', usuarios: 'Quem usa',
  afetados: 'Quem é afetado', tipoTec: 'Tipo de tecnologia', pagamento: 'Pagamento', piloto: 'Tamanho do teste', internet: 'Internet',
  modeloDisp: 'Dispositivos', formados: 'Formação', suporteNivel: 'Suporte', implantacao: 'Primeira etapa', elegiveis: 'Pessoas na rede',
  expansao: 'Ritmo de expansão',
};

/** Título de cada tela: a pergunta da v13 (traduzida pelos dicionários existentes) ou um título próprio da tela composta. */
export const TITULO_TELA: Record<string, string> = {
  etapas: 'Quais etapas de ensino serão atendidas, com quantas escolas e estudantes?',
  governanca: 'Marque o que a sua rede já tem',
  afetados: 'Quem é afetado pelo que a ferramenta produz?',
  formados: 'Quem será formado, e por quantas horas?',
  internet: 'As escolas têm internet adequada para o uso previsto?',
};

/** "1 recomendação" / "7 recomendações": as duas formas são chaves de tradução. */
export const plural = (n: number, um: string, varios: string) => (n === 1 ? t(um, { n }) : t(varios, { n }));
