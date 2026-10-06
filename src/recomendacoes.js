// =====================================================================
// Recomendações do caso (v10, decisão C): motor de regras que transforma as
// respostas DESTE caso numa lista curta e priorizada de ações.
// Cada item: { id, quando, tipo, prioridade, texto, porque: { n, pergunta, resposta, sugerido }, ir }
//   quando: 'antes_teste' | 'antes_contratar' | 'manter'
//   tipo: 'custo' (custo e compra) | 'politica' (política e governança)
//   prioridade: 'alta' | 'media'
//   ir: 'fase:passo:n' (n com hífens), o mesmo formato de data-ir do percurso.
// Mostradas no passo 3.4 (renderRecomendacoes, chamado por fluxo.js) e como
// primeira seção do plano de contratação (secaoRecomendacoes, em resumo.js).
// Páginas citadas: Krueger e Jackson (2026), só as já usadas no plano.
// O texto em português é a chave de tradução (i18n/v10_r2_*.json).
// =====================================================================

const QUANDO_REC = [['antes_teste', 'Antes do teste'], ['antes_contratar', 'Antes de contratar'], ['manter', 'Para manter e ampliar']];
const TIPO_REC = { custo: 'Custo e compra', politica: 'Política e governança' };
const PRIO_REC = { alta: 'Alta', media: 'Média' };
const TIT_REC = 'Recomendações para o seu caso';
const TXT_REC = {
  intro: 'Ações para este caso, geradas a partir das suas respostas. Comece pelas de prioridade alta. Cada ação mostra a pergunta e a resposta que a originou: se mudar a resposta, a lista muda.',
  introPlano: 'Ações geradas a partir das respostas deste caso, por momento e prioridade. As listas dos blocos A e B, a seguir, servem de referência completa.',
  vazio: 'Ainda não há respostas suficientes para recomendar ações. Responda às perguntas das fases 1 a 3.',
  negrito: 'Em negrito: prioridade alta.',
  ir: 'Ir à pergunta',
  porque: 'Por quê:',
};

// Ações que não dependem de texto novo vêm de plano_dados.js (já traduzidas)
const recTxt = id => ((typeof RECS !== 'undefined' ? RECS : []).find(r => r.id === id) || {}).texto || '';

// Regras do caso. se(k): condição; campo: pergunta que originou a ação; vals(k): respostas a citar.
// quando, prioridade e texto podem ser funções de k.
const REGRAS_REC = [
  // 1.2 Problema e impacto
  { id: 'linha-base', campo: 'linhaBase', tipo: 'politica', quando: 'antes_teste', prioridade: 'alta', se: k => k.v('linhaBase') === 'nao',
    texto: 'Medir o problema antes do teste, por escola ou turma: sem linha de base, não há como saber se a IA ajudou.' },
  { id: 'linha-base-parcial', campo: 'linhaBase', tipo: 'politica', quando: 'antes_teste', prioridade: 'media', se: k => k.v('linhaBase') === 'parcial',
    texto: 'Completar a linha de base com dados medidos nas escolas do teste antes de começar.' },
  { id: 'alternativa', campo: 'alternativa', tipo: 'custo', quando: 'antes_contratar', prioridade: 'alta', se: k => k.v('alternativa') === 'nao',
    texto: 'Comparar ao menos uma alternativa sem IA, em custo e resultado esperado, antes de decidir a compra.' },
  // 2.0 Prova de conceito ou piloto (recomendarTeste, guia cap. 14)
  { id: 'teste-recomendado', campo: 'teste', tipo: 'politica', quando: 'antes_teste', prioridade: 'alta', se: k => k.v('teste') === 'recomendar',
    texto: k => k.rec.modo === 'poc' ? 'Começar por uma prova de conceito, como indicam as respostas, antes de envolver escolas e estudantes.'
      : 'Começar por um piloto em poucas escolas, com critérios de sucesso e de parada definidos antes.' },
  { id: 'teste-rever', campo: 'teste', tipo: 'politica', quando: 'antes_teste', prioridade: 'alta', se: k => k.v('teste') === 'piloto' && k.rec.modo === 'poc',
    texto: 'Rever a escolha do piloto: pelas respostas, uma prova de conceito deveria vir antes.' },
  { id: 'teste-piloto-possivel', campo: 'teste', tipo: 'politica', quando: 'antes_teste', prioridade: 'media', se: k => k.v('teste') === 'poc' && k.rec.modo === 'piloto',
    texto: 'As respostas já permitem um piloto: mantenha a prova de conceito só se houver uma dúvida técnica a resolver.' },
  // 2.3 Adoção: tecnologia, pagamento, licença, adaptação, infraestrutura
  { id: 'tecnologia', campo: 'tipoTec', tipo: 'custo', quando: 'antes_teste', prioridade: 'alta', se: k => k.v('tipoTec') === 'nao_sei',
    texto: 'Fazer uma consulta ao mercado e uma prova de conceito para escolher a tecnologia antes de qualquer piloto.' },
  { id: 'gratis-adiados', campo: k => k.v('pagamento') === 'gratuito' ? 'pagamento' : 'tipoTec', tipo: 'custo', quando: 'antes_teste', prioridade: 'alta', se: k => k.gratis,
    texto: 'Listar os custos que a gratuidade não cobre e apenas adia: formação, integração, proteção de dados e suporte (Krueger e Jackson, 2026, p. 7–8).' },
  { id: 'gratis-fim', campo: 'pagamento', tipo: 'custo', quando: 'antes_teste', prioridade: 'alta', se: k => k.v('pagamento') === 'gratuito',
    texto: 'Acordar por escrito o preço e as condições para quando o período gratuito terminar, antes de começar o teste.' },
  { id: 'gratis-ativos', campo: 'pagamento', tipo: 'politica', quando: 'antes_teste', prioridade: 'media', se: k => k.v('pagamento') === 'gratuito',
    texto: () => recTxt('r-ativos') || 'Acordar o destino dos dados e dos materiais se o fornecedor não for escolhido.' },
  { id: 'publica', campo: 'tipoTec', tipo: 'custo', quando: 'antes_contratar', prioridade: 'media', se: k => k.v('tipoTec') === 'publica',
    texto: 'Confirmar quem mantém a plataforma pública, por quanto tempo e o que fica a cargo da rede.' },
  { id: 'termos', campo: 'licenca', tipo: 'custo', quando: 'antes_contratar', prioridade: 'alta', se: k => k.v('licenca') === 'termos',
    texto: 'Termos de uso padrão não bastam: negocie um contrato em que termos online não alterem as condições materiais.' },
  { id: 'licenca-indefinida', campo: 'licenca', tipo: 'custo', quando: 'antes_contratar', prioridade: 'media', se: k => k.v('licenca') === 'nao_sei',
    texto: 'Definir o tipo de licença antes de contratar: quem pode usar, por quanto tempo e o que acontece com os dados.' },
  { id: 'lic-usuario', campo: 'pagamento', tipo: 'custo', quando: 'antes_contratar', prioridade: 'alta', se: k => k.v('pagamento') === 'usuario',
    texto: 'Comparar o custo por licença paga com o custo por pessoa que de fato usa: licenças não usadas são desperdício (Krueger e Jackson, 2026, p. 3).' },
  { id: 'lic-usuario-rever', campo: 'pagamento', tipo: 'custo', quando: 'manter', prioridade: 'media', se: k => k.v('pagamento') === 'usuario',
    texto: 'Rever a cada semestre as licenças sem uso e cancelar ou realocar as que sobram.' },
  { id: 'lic-institucional', campo: 'pagamento', tipo: 'custo', quando: 'manter', prioridade: 'media', se: k => k.v('pagamento') === 'institucional',
    texto: 'Acompanhar quantas pessoas usam de fato e renegociar o valor se a adoção ficar abaixo do previsto.' },
  { id: 'consumo-limites', campo: 'pagamento', tipo: 'custo', quando: 'antes_contratar', prioridade: 'alta', se: k => k.v('pagamento') === 'consumo',
    texto: 'Exigir no contrato limite de gasto, alertas e relatório mensal de consumo, visíveis antes da fatura.' },
  { id: 'consumo-monitorar', campo: 'pagamento', tipo: 'custo', quando: 'manter', prioridade: 'alta', se: k => k.v('pagamento') === 'consumo',
    texto: 'Monitorar o custo de uso todo mês: cada uso é cobrado e o valor cresce com a adoção (Krueger e Jackson, 2026, p. 6).' },
  { id: 'incluida', campo: 'pagamento', tipo: 'custo', quando: 'antes_contratar', prioridade: 'media', se: k => k.v('pagamento') === 'incluida',
    texto: 'Verificar se o preço da plataforma que a rede já paga muda com a IA e em que unidade passa a ser cobrado.' },
  { id: 'aberta-operacao', campo: 'tipoTec', tipo: 'custo', quando: 'antes_contratar', prioridade: 'media', se: k => k.v('tipoTec') === 'aberta',
    texto: 'Definir quem vai operar o modelo aberto: se um só integrador fizer tudo, a dependência apenas muda de lugar.' },
  { id: 'sob-medida', campo: 'adaptacao', tipo: 'custo', quando: 'antes_contratar', prioridade: 'alta', se: k => k.v('adaptacao') === 'sob_medida',
    texto: 'Garantir no contrato que código e configurações são da rede, com documentação e transferência de conhecimento à equipe.' },
  { id: 'integracao', campo: 'adaptacao', tipo: 'custo', quando: 'antes_contratar', prioridade: 'media', se: k => k.v('adaptacao') === 'integracao',
    texto: 'Exigir interoperabilidade com os sistemas da rede e exportação de dados e configurações em formato aberto.' },
  { id: 'infra-complementar', campo: 'infra', tipo: 'custo', quando: 'antes_teste', prioridade: 'alta', se: k => k.v('infra') === 'complementar',
    texto: 'Levantar dispositivos, internet e energia nas escolas do teste e incluir o complemento no orçamento (Krueger e Jackson, 2026, p. 7).' },
  { id: 'infra-levantar', campo: 'infra', tipo: 'custo', quando: 'antes_teste', prioridade: 'alta', se: k => k.v('infra') === 'nao_sei',
    texto: 'Fazer um levantamento de dispositivos, internet e energia nas escolas antes do teste: em muitas redes, é o primeiro custo.' },
  // 2.1 e 2.2: dados de estudantes, decisões sobre estudantes, crianças
  { id: 'dados-acordo', campo: k => k.campoDados, vals: k => k.valsDados, tipo: 'politica', quando: k => k.poc ? 'antes_contratar' : 'antes_teste', prioridade: 'alta', se: k => k.dadosEst,
    texto: () => recTxt('r-acordo') || 'Assinar acordo de tratamento de dados que proíba usar os dados para treinar modelos.' },
  { id: 'dados-base-legal', campo: k => k.campoDados, vals: k => k.valsDados, tipo: 'politica', quando: k => k.poc ? 'antes_contratar' : 'antes_teste', prioridade: 'alta', se: k => k.dadosEst,
    texto: () => recTxt('r-baselegal') || 'Confirmar a base legal ou obter consentimento para usar os dados.' },
  { id: 'dados-impacto', campo: k => k.campoDados, vals: k => k.valsDados, tipo: 'politica', quando: 'antes_contratar', prioridade: 'alta', se: k => k.dadosEst,
    texto: () => recTxt('i-dpia') || 'Concluir a avaliação de impacto sobre a proteção de dados.' },
  { id: 'supervisao', campo: 'consequencias', vals: k => k.consDecide, tipo: 'politica', quando: 'antes_teste', prioridade: 'alta', se: k => k.consDecide.length > 0,
    texto: 'Definir a supervisão humana: quem revisa cada saída antes de uma decisão sobre estudantes, com autoridade para mudá-la.' },
  { id: 'contestacao', campo: 'consequencias', vals: k => k.consDecide, tipo: 'politica', quando: 'antes_teste', prioridade: 'alta', se: k => k.consDecide.length > 0,
    texto: () => recTxt('i-contestacao') || 'Criar um caminho para contestar saídas e corrigir erros, com prazo e autoridade para rever.' },
  { id: 'criancas', campo: 'afetados', vals: () => ['criancas'], tipo: 'politica', quando: 'antes_teste', se: k => (k.ce.afetados || []).includes('criancas'),
    prioridade: k => (k.ce.usuarios || []).includes('estudantes') || k.pesoMax > 0 ? 'alta' : 'media',
    texto: 'Aplicar as regras de proteção de crianças e adolescentes: uso adequado à idade e famílias informadas antes do teste.' },
  // 3.1 Escala: chegar a toda a rede no primeiro ano com muitas pessoas
  { id: 'etapas', campo: 'expansao', tipo: 'custo', quando: 'antes_contratar', se: k => k.v('expansao') === 'ano1' && k.eleg >= 5000,
    prioridade: k => k.eleg >= 50000 ? 'alta' : 'media',
    texto: 'Contratar por etapas: ampliar por grupos de escolas, com critérios para avançar, em vez de toda a rede no primeiro ano.' },
  // 3.2 Fonte de recursos
  { id: 'paga-indefinido', campo: 'pagaDepois', tipo: 'custo', quando: 'antes_teste', prioridade: 'alta', se: k => k.v('pagaDepois') === 'indefinido',
    texto: () => (typeof TXT_A7 !== 'undefined' && TXT_A7.indefinido) || 'Defina quem vai pagar a tecnologia depois do teste antes de assumir qualquer compromisso com o fornecedor.' },
  { id: 'paga-parceiro', campo: 'pagaDepois', tipo: 'custo', quando: 'antes_contratar', prioridade: 'alta', se: k => k.v('pagaDepois') === 'parceiro',
    texto: () => (typeof TXT_A7 !== 'undefined' && TXT_A7.parceiro) || 'Defina o que acontece quando o financiamento do parceiro acabar (Krueger e Jackson, 2026, p. 8).' },
  { id: 'paga-governo', campo: 'pagaDepois', tipo: 'custo', quando: 'antes_contratar', prioridade: 'media', se: k => k.v('pagaDepois') === 'governo',
    texto: 'Formalizar por escrito o compromisso da outra esfera de governo: valor, prazo e o que acontece se acabar.' },
  { id: 'fonte-nao', campo: 'fonte', tipo: 'custo', quando: 'antes_contratar', prioridade: 'alta', se: k => k.v('fonte') === 'nao',
    texto: () => recTxt('g-orcamento') || 'Prever a fonte de recursos para operar e manter a solução depois do piloto.' },
  { id: 'fonte-parcial', campo: 'fonte', tipo: 'custo', quando: 'manter', prioridade: 'alta', se: k => k.v('fonte') === 'parcial',
    texto: () => recTxt('s-orcamento') || 'Garantir orçamento recorrente para os próximos exercícios.' },
];

// ----------------------------------------------------------- respostas
// Valor respondido de um campo ('' se não respondido). Campos com valor padrão só contam depois que a pessoa responde.
function recValor(id) {
  const f = (typeof CAMPO_POR_ID !== 'undefined' && CAMPO_POR_ID[id]) || null;
  const onde = f ? f.onde : 'caso';
  const v = onde === 'resp' ? (S.resp || {})[id] : onde === 'ctx' ? (S.ctx || {})[id] : (S.caso || {})[id];
  if (v == null || v === '' || (Array.isArray(v) && !v.length)) return '';
  if (f && f.padrao && typeof respondido === 'function' && !respondido(id)) return '';
  return v;
}
function recCampo(id) { return (typeof CAMPO_POR_ID !== 'undefined' && CAMPO_POR_ID[id]) || (typeof CAMPOS !== 'undefined' ? CAMPOS.find(f => f.id === id) : null); }
function recOpcoes(f) {
  if (!f) return [];
  if (typeof listaOpc === 'function') return listaOpc(f);
  return typeof f.opc === 'string' ? ((typeof OPC !== 'undefined' && OPC[f.opc]) || []) : (f.opc || []);
}
// Rótulo (PT) de cada valor da resposta
function recRotulos(id, vals) {
  const f = recCampo(id), L = recOpcoes(f);
  const c = S.caso || {};
  return [].concat(vals == null ? [] : vals).map(v => {
    if (id === 'tarefas' && v === 'outra' && c.tarefaOutra) return c.tarefaOutra;
    const o = L.find(x => String(x[0]) === String(v));
    return o ? o[1] : String(v);
  }).filter(Boolean);
}
function recIr(f) {
  if (!f) return '';
  const fase = typeof fasePasso === 'function' ? fasePasso(f.passo) : '';
  return fase ? fase + ':' + f.passo + ':' + String(f.n).replace(/\./g, '-') : '';
}
function recPorque(id, vals) {
  const f = recCampo(id);
  if (!f) return { n: '', pergunta: '', resposta: '' };
  const pergunta = typeof textoCampo === 'function' ? textoCampo(f) : f.t;
  // resposta ainda sugerida (pré-marcada pela ferramenta e não confirmada pela pessoa)
  let sug = false;
  try { sug = typeof sugerido === 'function' && !!sugerido(f); } catch (e) { }
  return { n: f.n, pergunta, resposta: recRotulos(id, vals).join('; '), sugerido: sug };
}

// ----------------------------------------------------------- contexto das regras
function recContexto() {
  const c = S.caso || {};
  let ce = c;
  try { ce = casoAtual(); } catch (e) { console.warn(e); }
  let rec = { modo: 'piloto' };
  try { rec = recomendarTeste(ce) || rec; } catch (e) { }
  const v = recValor;
  const modo = ['poc', 'piloto'].includes(c.teste) ? c.teste : rec.modo;
  const peso = k => ((typeof OPC !== 'undefined' ? OPC.consequencias : []).find(x => x[0] === k) || [0, 0, 0])[2];
  const cons = ce.consequencias || [];
  const consDecide = cons.filter(k => peso(k) >= 2);
  const pesoMax = Math.max(0, ...cons.map(peso));
  // dados pessoais de estudantes: vêm das tarefas (2.1.1) ou de estudantes como usuários (2.2.1)
  const dadosEst = (ce.dados || []).some(d => d === 'pessoais_est' || d === 'sensiveis');
  const T = typeof tarefasDe === 'function' ? tarefasDe(c.tarefas) : [];
  const tDados = T.filter(t => (t.dados || []).some(d => d === 'pessoais_est' || d === 'sensiveis')).map(t => t.id);
  const usaEst = (ce.usuarios || []).includes('estudantes');
  const campoDados = tDados.length || !usaEst ? 'tarefas' : 'usuarios';
  const valsDados = campoDados === 'usuarios' ? ['estudantes'] : (tDados.length ? tDados : c.tarefas || []);
  const eleg = +v('elegiveis') || 0;
  return { c, ce, rec, v, poc: modo === 'poc', gratis: v('pagamento') === 'gratuito' || v('tipoTec') === 'publica',
    consDecide, pesoMax, dadosEst, campoDados, valsDados, eleg };
}
const recF = (x, k) => (typeof x === 'function' ? x(k) : x);
const ORD_PRIO = { alta: 0, media: 1 };
const ordQuando = q => QUANDO_REC.findIndex(z => z[0] === q);

// Lista de recomendações do caso, sem duplicatas, por prioridade e depois por momento
function recomendacoesCaso() {
  if (typeof S === 'undefined' || !S || !S.caso) return [];
  const k = recContexto();
  const out = [], vistos = new Set();
  const add = r => {
    if (!r.texto || vistos.has(r.id) || vistos.has('t:' + r.texto)) return;
    vistos.add(r.id); vistos.add('t:' + r.texto); out.push(r);
  };
  // 1.3 Governança: cada resposta Não, Em parte ou Não sei vira uma ação (textos de ACOES_G)
  const gq = typeof QUESTOES_G !== 'undefined' ? QUESTOES_G : [];
  gq.forEach(q => {
    const resp = (S.resp || {})[q.id];
    if (!['nao', 'parcial', 'nao_sei'].includes(resp) || !(typeof ACOES_G !== 'undefined' && ACOES_G[q.id])) return;
    const alta = typeof PRIORIDADE_G !== 'undefined' && PRIORIDADE_G[q.id] === 'alta';
    const cedo = ['g-legislacao', 'g-dados'].includes(q.id) && k.dadosEst && !k.poc;
    add({ id: q.id, quando: cedo ? 'antes_teste' : 'antes_contratar', tipo: q.id === 'g-compras' ? 'custo' : 'politica', prioridade: alta ? 'alta' : 'media',
      texto: ACOES_G[q.id], porque: recPorque(q.id, [resp]), ir: recIr(recCampo(q.id)) });
  });
  REGRAS_REC.forEach(r => {
    let ok = false;
    try { ok = !!r.se(k); } catch (e) { console.warn(e); }
    if (!ok) return;
    const campo = recF(r.campo, k);
    const vals = r.vals ? r.vals(k) : k.v(campo);
    add({ id: r.id, quando: recF(r.quando, k), tipo: r.tipo, prioridade: recF(r.prioridade, k), texto: recF(r.texto, k),
      porque: recPorque(campo, vals), ir: recIr(recCampo(campo)) });
  });
  return out.map((r, i) => [r, i])
    .sort((a, b) => (ORD_PRIO[a[0].prioridade] - ORD_PRIO[b[0].prioridade]) || (ordQuando(a[0].quando) - ordQuando(b[0].quando)) || (a[1] - b[1]))
    .map(z => z[0]);
}

// ----------------------------------------------------------- textos traduzidos
const recTrPartes = s => String(s || '').split('; ').map(z => tr(z)).join('; ');
// "1.3.2 Pergunta? → Resposta" já traduzido
function recPorqueTexto(r) {
  const p = r.porque || {};
  return [p.n, tr(p.pergunta)].filter(Boolean).join(' ') + (p.resposta ? ' → ' + recTrPartes(p.resposta) : '') + (p.sugerido ? ' (' + tr('sugerido') + ')' : '');
}
function recContagem(recs) {
  const n = { custo: 0, politica: 0 };
  recs.forEach(r => { n[r.tipo] = (n[r.tipo] || 0) + 1; });
  return n;
}

// ----------------------------------------------------------- HTML (passo 3.4 e página do plano)
const CSS_RECS = `
.rc { display: grid; gap: 14px; }
.rc p { margin: 0; }
.rc .tag { font-size: .86rem; font-weight: 600; letter-spacing: 0; padding: 1px 8px; }
.rc-cont { display: flex; flex-wrap: wrap; gap: 6px 16px; align-items: center; font-size: .95rem; }
.rc-cont b { font-family: var(--f-ui); }
.rc-grupo { display: grid; gap: 8px; }
.rc-gt { display: flex; align-items: center; gap: 10px; margin: 4px 0 0; font-size: 1.05rem; color: var(--head); }
.rc-gt::before { content: ""; width: 14px; height: 14px; border-radius: 4px; background: var(--f1); flex: none; }
.rc-grupo[data-quando="antes_contratar"] .rc-gt::before { background: var(--f2); }
.rc-grupo[data-quando="manter"] .rc-gt::before { background: var(--f3); }
.rc-gt .rc-n { font: 600 .86rem var(--f-ui); color: var(--muted); }
.rc-lista { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.rc-item { display: grid; gap: 5px; padding: 10px 14px; border: 1px solid var(--line); border-left: 4px solid var(--f1s); border-radius: 8px; background: var(--surface); }
.rc-grupo[data-quando="antes_contratar"] .rc-item { border-left-color: var(--f2s); }
.rc-grupo[data-quando="manter"] .rc-item { border-left-color: var(--f3s); }
.rc-top { display: flex; flex-wrap: wrap; gap: 6px; }
.rc-txt { font-size: 1rem; line-height: 1.45; }
.rc-alta .rc-txt { font-weight: 600; }
.rc-pq { font-size: .9rem; line-height: 1.4; }
.rc-pq .qn-l { font-family: var(--f-ui); font-weight: 600; }
.rc-pe { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 16px; }
.rc-ir { font-size: .9rem; flex: none; }
.rc-fim { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
`;
function cssRecs() {
  try {
    if (typeof document === 'undefined' || document.getElementById('css-recs')) return;
    const st = document.createElement('style'); st.id = 'css-recs'; st.textContent = CSS_RECS;
    (document.head || document.documentElement).appendChild(st);
  } catch (e) { }
}
const escR = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
function htmlItemRec(r) {
  const p = r.porque || {};
  const alta = r.prioridade === 'alta';
  return `<li class="rc-item${alta ? ' rc-alta' : ''}" data-rec="${escR(r.id)}" data-tipo="${escR(r.tipo)}" data-prio="${escR(r.prioridade)}">
    <div class="rc-top"><span class="tag${alta ? ' gold' : ''}">${escR(tr('Prioridade'))}: ${escR(tr(PRIO_REC[r.prioridade] || r.prioridade))}</span> <span class="tag">${escR(tr(TIPO_REC[r.tipo] || r.tipo))}</span></div>
    <p class="rc-txt">${escR(tr(r.texto))}</p>
    <div class="rc-pe">${p.n ? `<p class="rc-pq muted"><span>${escR(tr(TXT_REC.porque))}</span> <span class="qn-l">${escR(p.n)}</span> <span>${escR(tr(p.pergunta))}</span> <span aria-hidden="true">→</span> <span>${escR(recTrPartes(p.resposta))}</span>${p.sugerido ? ` <span class="rc-sug">(${escR(tr('sugerido'))})</span>` : ''}</p>` : ''}
    ${r.ir ? `<button type="button" class="link rc-ir" data-ir="${escR(r.ir)}">${escR(tr(TXT_REC.ir))}</button>` : ''}</div>
  </li>`;
}
// Grupos por momento, contagem por tipo; sem botão (página do plano) ou com o botão do plano (passo 3.4)
function htmlRecs(recs, o = {}) {
  cssRecs();
  if (!recs.length) return `<div class="rc"><div class="vazio"><p>${escR(tr(TXT_REC.vazio))}</p></div>${o.botao ? htmlFimRecs() : ''}</div>`;
  const n = recContagem(recs);
  const cont = `<p class="rc-cont"><span><b>${n.custo}</b> <span>${escR(tr(TIPO_REC.custo))}</span></span><span><b>${n.politica}</b> <span>${escR(tr(TIPO_REC.politica))}</span></span></p>`;
  const grupos = QUANDO_REC.map(([q, nome]) => {
    const L = recs.filter(r => r.quando === q);
    if (!L.length) return '';
    return `<div class="rc-grupo" data-quando="${q}"><h4 class="rc-gt"><span>${escR(tr(nome))}</span> <span class="rc-n">${L.length}</span></h4>
      <ul class="rc-lista">${L.map(htmlItemRec).join('')}</ul></div>`;
  }).join('');
  return `<div class="rc">${o.intro ? `<p>${escR(tr(o.intro))}</p>` : ''}${cont}${grupos}${o.botao ? htmlFimRecs() : ''}</div>`;
}
function htmlFimRecs() {
  return `<div class="rc-fim"><button type="button" class="btn pri" data-act="gerar-plano">${escR(tr('Gerar plano de contratação'))}</button></div>`;
}
// Corpo do passo 3.4 "Recomendações para o seu caso" (chamado por fluxo.js)
function renderRecomendacoes() {
  let recs = [];
  try { recs = recomendacoesCaso(); } catch (e) { console.warn(e); }
  let nf = 0;
  try { nf = (faltasTodas() || []).length; } catch (e) { }
  const nota = nf && recs.length ? `<p class="note">${escR(tr(nf === 1 ? 'Falta 1 resposta: a lista pode mudar quando você responder.' : 'Faltam ' + nf + ' respostas: a lista pode mudar quando você responder.'))}</p>` : '';
  // o rodapé do passo 3.4 (fluxo.js) já traz "Gerar plano de contratação"; sem ele, o botão fica aqui
  const rodape = typeof PASSOS_VER !== 'undefined' && PASSOS_VER.includes('3d');
  return htmlRecs(recs, { intro: TXT_REC.intro, botao: !rodape }).replace('<div class="rc">', '<div class="rc" id="recs-caso">' + nota);
}

// ----------------------------------------------------------- seção do plano (página, PDF, Markdown e HTML)
// Tabela "Quando | Ação | Por quê" agrupada por momento; negrito = prioridade alta (PDF).
function secaoRecomendacoes(recs) {
  if (!recs) { try { recs = recomendacoesCaso(); } catch (e) { console.warn(e); recs = []; } }
  const rows = [], negrito = [];
  QUANDO_REC.forEach(([q, nome]) => recs.filter(r => r.quando === q).forEach(r => {
    if (r.prioridade === 'alta') negrito.push(rows.length);
    rows.push([tr(nome), tr(r.texto), recPorqueTexto(r)]);
  }));
  // só textos (sem códigos internos), para a tradução profunda e as exportações; a página refaz a lista (renderPlano)
  return { id: 'recs', h: TIT_REC, p: [recs.length ? TXT_REC.introPlano : TXT_REC.vazio],
    table: rows.length ? { head: ['Quando', 'Ação', 'Por quê'], rows, grupo: true, negrito, larg: [86, 0, 170] } : null,
    pos: rows.length ? [TXT_REC.negrito] : null };
}

if (typeof module !== 'undefined') module.exports = { QUANDO_REC, TIPO_REC, PRIO_REC, TIT_REC, TXT_REC, REGRAS_REC, recomendacoesCaso, renderRecomendacoes, secaoRecomendacoes };
