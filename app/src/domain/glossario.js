// =====================================================================
// Glossário único (0.0.15, BL2.4): termos técnicos e orçamentários explicados em linguagem simples.
// Nos textos de ajuda (frase de abertura, "Por que perguntamos isso?", dicas, capítulos), um termo é marcado como
// [[id]] (usa o nome do glossário) ou [[id|texto na frase]]. O componente ui/Termo transforma a marca num termo
// sublinhado que abre a definição; o apêndice do plano imprime glossarioLista().
// Módulo puro (sem DOM): o balão, o foco e o teclado ficam em src/ui/Termo.
// O texto em português é a chave de tradução (i18n/v15_ajuda_<l>.json); quem exibe passa por tr().
// =====================================================================

/** id, termo (como aparece na lista), extenso (opcional, entre parênteses na lista) e def (definição curta) */
export const GLOSSARIO = [
  { id: 'tco', termo: 'TCO', extenso: 'custo total de propriedade',
    def: 'Custo de ter a ferramenta ao longo de toda a vida dela, e não só o preço de compra: inclui internet, dispositivos, formação, suporte e o tempo das equipes.' },
  { id: 'api', termo: 'API', extenso: 'interface de programação de aplicações',
    def: 'Meio pelo qual um programa usa outro pela internet. Aqui, uma aplicação usa o modelo de IA de uma empresa e a rede paga conforme o uso.' },
  { id: 'pesos', termo: 'Pesos abertos',
    def: 'Modelo de IA publicado para qualquer pessoa instalar e usar. A rede o roda em servidores próprios ou contratados e responde pela operação e pela segurança.' },
  { id: 'eti', termo: 'ETI/FTE', extenso: 'equivalente a tempo integral',
    def: 'Medida do tempo de trabalho: uma pessoa durante o ano inteiro vale 1; duas pessoas em meio período também valem 1. FTE é a sigla em inglês.' },
  { id: 'capital', termo: 'Orçamento de capital',
    def: 'Dinheiro para compras que duram vários anos, como dispositivos ou a ligação com sistemas. As regras mudam de país para país: confirme com a área de orçamento.' },
  { id: 'corrente', termo: 'Orçamento corrente',
    def: 'Dinheiro para as despesas que se repetem, como assinaturas, suporte, conexão e formação. A classificação depende da regra orçamentária de cada jurisdição.' },
  { id: 'desconto', termo: 'Taxa de desconto',
    def: 'Percentual usado para comparar valores pagos em anos diferentes: um valor pago mais tarde pesa menos no total. Zero significa sem desconto. Use a taxa oficial da sua jurisdição.' },
  { id: 'recorrente', termo: 'Custo recorrente',
    def: 'Custo que se repete todo ano enquanto a ferramenta é usada, como assinaturas, suporte e conexão. Não inclui o que se paga uma vez, como a compra de dispositivos.' },
  { id: 'saas', termo: 'SaaS', extenso: 'software como serviço',
    def: 'Produto pronto que a rede assina e usa pelo navegador ou por aplicativo. O fornecedor opera tudo.' },
  { id: 'poc', termo: 'Prova de conceito',
    def: 'Teste técnico, com a equipe e dados de teste, para ver se a solução funciona. Não há professores nem estudantes reais.' },
  { id: 'piloto', termo: 'Piloto',
    def: 'Teste de uso real: professores ou estudantes de poucas escolas usam a ferramenta por tempo limitado.' },
  { id: 'camada', termo: 'Camada',
    def: 'Cada uma das sete partes do custo total da IA na educação, no quadro de Krueger e Jackson (2026, p. 11): da governança à operação e à sustentabilidade.' },
  { id: 'p10p90', termo: 'P10–P90',
    def: 'Faixa de uma simulação de incerteza. Em 10% dos cenários o valor fica abaixo do P10 e em 10% acima do P90; nos 80% restantes, entre os dois.' },
  { id: 'linhabase', termo: 'Linha de base',
    def: 'Medida do problema antes de a IA entrar, por escola ou turma. É o ponto de partida para saber depois se algo melhorou.' },
  { id: 'dotacao', termo: 'Dotação',
    def: 'Valor que o orçamento reserva para pagar as despesas de um exercício. A estimativa mostra quanto solicitar por exercício, só com o desembolso da rede.' },
];

const POR_ID = {};
GLOSSARIO.forEach((g) => { POR_ID[g.id] = g; });

/** Rótulos da interface do glossário (chaves de tradução). */
export const GLOSSARIO_ROT = { titulo: 'Glossário', fechar: 'Fechar', def: 'Definição de' };

/** O verbete de um id ({ id, termo, extenso?, def }) ou null. */
export function termoDe(id) { return POR_ID[id] || null; }

/**
 * Lista do glossário em ordem alfabética do termo: [{ id, termo, extenso, def }], em português.
 * Com `traduzir` (por exemplo `tr`), devolve os textos traduzidos e ordena pelo termo traduzido, no `locale` dado.
 * Sem argumentos, é a lista em português que o apêndice do plano passa por tr().
 */
export function glossarioLista(traduzir, locale) {
  const tt = typeof traduzir === 'function' ? traduzir : (x) => x;
  const L = GLOSSARIO.map((g) => ({
    id: g.id,
    termo: String(tt(g.termo)),
    extenso: g.extenso ? String(tt(g.extenso)) : '',
    def: String(tt(g.def)),
  }));
  const loc = locale || 'pt-BR';
  try { L.sort((a, b) => a.termo.localeCompare(b.termo, loc, { sensitivity: 'base' })); } catch (e) { L.sort((a, b) => (a.termo < b.termo ? -1 : 1)); }
  return L;
}

/** Todos os textos do glossário em português (para os testes de tradução e o levantamento de chaves). */
export function glossarioTextos() {
  const o = [GLOSSARIO_ROT.titulo, GLOSSARIO_ROT.fechar, GLOSSARIO_ROT.def];
  GLOSSARIO.forEach((g) => { o.push(g.termo, g.def); if (g.extenso) o.push(g.extenso); });
  return o;
}

// Marca [[id]] ou [[id|texto]]. O regex nasce a cada chamada: um /g compartilhado guarda lastIndex entre chamadas.
const reMarca = () => /\[\[([a-z0-9]+)(?:\|([^\]]*))?\]\]/g;

/**
 * Parte um texto com marcas em trechos: { texto } para o texto comum e { id, rotulo } para um termo do glossário.
 * Uma marca com id desconhecido vira texto comum (o rótulo, ou o id). O texto deve vir já traduzido (a tradução
 * mantém as marcas).
 */
export function glossarioPartes(s) {
  const t = String(s == null ? '' : s);
  const partes = [];
  let i = 0, m;
  const re = reMarca();
  const push = (x) => { if (x) partes.push({ texto: x }); };
  while ((m = re.exec(t))) {
    push(t.slice(i, m.index));
    const g = POR_ID[m[1]];
    const rotulo = m[2] != null && m[2] !== '' ? m[2] : (g ? g.termo : m[1]);
    if (g) partes.push({ id: g.id, rotulo, termoPadrao: m[2] == null || m[2] === '' });
    else push(rotulo);
    i = m.index + m[0].length;
  }
  push(t.slice(i));
  return partes;
}

/** Texto simples, sem marcas, para o relatório e para os testes: [[id|texto]] vira texto; [[id]] vira o termo. */
export function glossarioSemMarcas(s) {
  return String(s == null ? '' : s).replace(reMarca(), (_, id, rot) => rot || (POR_ID[id] || {}).termo || id);
}

/** Ids marcados num texto, na ordem em que aparecem (para os testes: toda marca existe no glossário). */
export function glossarioMarcas(s) {
  const out = [];
  const re = reMarca();
  let m;
  const t = String(s == null ? '' : s);
  while ((m = re.exec(t))) out.push(m[1]);
  return out;
}
