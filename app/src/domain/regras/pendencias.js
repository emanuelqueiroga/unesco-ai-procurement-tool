// Pendências (3.3, item 4): respostas "não sei" e premissas que mudam custo ou cláusula. Elas não são ações: vão para
// o bloco "Antes de decidir, responda" e suspendem as regras que as `requer`em (REC-04). O pacote R3 (REC-24)
// acrescenta as sugeridas não confirmadas e o efeito no custo de cada uma.
// Formato: { id, campo, se(k), motivo (chave de tradução), substitui?: ids antigos }.
export const PENDENCIAS = [
  { id: 'P-tipoTec', campo: 'tipoTec', se: k => k.v('tipoTec') === 'nao_sei',
    motivo: 'A tecnologia ainda não foi escolhida; as regras de pagamento e de licença esperam esta resposta.' },
  { id: 'P-licenca', campo: 'licenca', se: k => k.v('licenca') === 'nao_sei', substitui: ['licenca-indefinida'],
    motivo: 'Definir o tipo de licença antes de contratar: quem pode usar, por quanto tempo e o que acontece com os dados.' },
  { id: 'P-arquitetura', campo: 'arquitetura', se: k => k.v('arquitetura') === 'nao_sei',
    motivo: 'A estimativa usa uma arquitetura presumida; as cláusulas que dependem dela são provisórias até a resposta 3.2.1.' },
  { id: 'P-nFerramentas', campo: 'nFerramentas', se: k => k.v('nFerramentas') === 'nao_sei', substitui: ['ferramentas-levantar'],
    motivo: 'Listar as ferramentas candidatas e as tarefas de cada uma antes do teste: o custo depende de quantas forem e de como são pagas.' },
];
