# v015 — percurso institucional de governança

Substitui o restante do percurso de ferramenta para os casos que incluem governança, conforme o mapeamento aprovado. Não modifica a v014 nem a página estável.

## Percurso e condições

- Governança: Contexto → Diagnóstico institucional → Plano de ação e recursos → Acompanhamento e revisão.
- Contexto mantém país, prioridades, desafios e totais nacionais. Não pergunta etapas de ensino.
- Não há limite de desafios em nenhuma prioridade, em nenhum modo. Todos os desafios ativos geram uma ação institucional revisável, inclusive escolhas legadas e outro desafio descrito.
- Diagnóstico registra situação, resultado, linha de base e fonte. O checklist corresponde aos desafios selecionados e registra instrumento, situação, responsável, evidência e lacuna.
- A execução registra instituições, grupos afetados, participação, entregas, responsáveis, prazos, marcos e indicadores. Os marcos sugeridos abrangem elaboração, consulta, aprovação competente, publicação, comunicação, aplicação, supervisão e avaliação.
- Capacidade institucional reúne equipe, formação, orientação, supervisão e incidentes.
- Revisão registra indicadores e metas, responsável, periodicidade, próxima revisão, alcance da política, progresso e prestação de contas.
- Sandbox aparece somente com G15. Exige objetivo, escopo, responsável, salvaguardas, avaliação e condições de encerramento ou continuidade. Regulamentação não ativa esse percurso.
- Governança isolada: 11 perguntas; com sandbox: 12. Uma seleção combinada acrescenta a identificação explícita de um projeto, sem obrigar a criar um.

## Orçamento institucional

Sete categorias: equipe, estudos, consulta, formação institucional, comunicação, supervisão/incidentes e avaliação. Sandbox acrescenta sua categoria quando ativo; recursos adicionais são informados explicitamente. Cada valor corresponde ao total no período e na moeda indicados.

Ausência de valor é desconhecida, não zero. Subtotal e número de itens desconhecidos aparecem juntos; o total completo só aparece com todos os valores. Zero é aceito explicitamente. Valores negativos, infinitos e strings importadas não viram custos válidos. Período e fonte fazem parte das pendências. A moeda fica associada aos valores e não é reinterpretada automaticamente se o país mudar. A rede nacional é contexto, sem conversão em usuários, licenças, participantes, equipamentos ou orçamento.

## Prioridades combinadas

Outro tema selecionado não ativa um piloto. É preciso escolher incluir um projeto e descrevê-lo. Há duas frentes acessíveis, com ações e orçamentos separados. A vista da ferramenta exclui os desafios de governança e usa o nome do projeto identificado; o orçamento de governança não alimenta a estimativa de ferramenta. As etapas de ensino só são solicitadas na frente do projeto. Sem governança selecionada, permanece o percurso de ferramenta anterior, com desafios sem limite.

## Consistência e compatibilidade

Página do plano, painel e PDFs institucionais usam a projeção `planoGovernanca`. As entradas públicas dos dois PDFs também reconhecem o percurso institucional. O brief contém contexto, diagnóstico, ações, orçamento e revisão; o anexo acrescenta evidências, instrumentos, instituições e capacidade. Não há parecer de autorização de PoC nem anexo de contratação no plano institucional.

Campos novos ficam em ctx. IDs antigos, respostas da ferramenta, etapas, custos editados e respostas g-* são preservados, inclusive na exportação/importação. Links e posições antigas são remapeados para perguntas institucionais equivalentes. A versão 0.1.0-alpha.8 e as chaves de armazenamento não mudam.

Textos novos em PT, EN, ES e FR. Nos cinco idiomas com aviso de tradução preliminar, textos já existentes são preservados e as novas entradas ainda sem revisão usam inglês explicitamente; não se declara tradução nativa revisada.

## Validação

38 arquivos de teste; 837 testes aprovados, 2 ignorados e 1 todo preexistentes. Casos cobrem múltiplos desafios, dados legados, sandbox condicional, validação de rede, diagnóstico, orçamento parcial/zero/total, combinação de prioridades, isolamento do projeto e exportação dos dois PDFs. Build de revisão, tipos, lint de domínio e diff verificados. PDFs de teste extraídos e renderizados para revisão visual; conferência do percurso em navegador com dados sintéticos e origem local isolada.
