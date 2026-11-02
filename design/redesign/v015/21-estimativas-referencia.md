# v015 — Estimativas de referência nos orçamentos dos percursos novos

Implementação da proposta aprovada em 02/11/2026 (observação 7.7: verificar o que pode ser calculado automaticamente e o que precisa ser informado). Publicação exclusiva em docs/revisao/v015.

## Comportamento

- Nos orçamentos de governança, letramento/currículo e intervenção educacional, cada item com base de cálculo mostra "Estimativa de referência: valor na moeda do orçamento · Ver a conta · Usar esta estimativa". Sem quantidade, período ou taxa, a linha diz o que falta, com link para o campo (na mesma tela ou na tela de origem, como participantes e horas do letramento).
- Nada é preenchido automaticamente. Só "Usar esta estimativa", ou "Usar a estimativa em todos os itens sem valor" no fim do orçamento, grava a quarta situação `referencia`. Esse botão só alcança itens vazios ou em "Custo ainda a levantar" que tenham a conta completa. Escolher outra situação desfaz a escolha. O valor digitado prevalece e os valores anteriores continuam guardados.
- O item em `referencia` é calculado ao vivo: se as quantidades mudam, o valor muda. Se a conta deixa de fechar, o item volta a contar como ainda a levantar. "Ver a conta" (popover; folha acima da barra de ações no celular) mostra a fórmula, a conta com números, as quantidades com a pergunta de origem, o período, o parâmetro com unidade, fonte, grau e ano, a convenção e a conversão de moeda.
- Todo valor estimado vem acompanhado de "estimativa de referência, ilustrativa".
- Tela, painel, página do plano, panorama `#/plano-nacional`, os dois PDFs de cada frente e a leitura simples separam Informado, Estimado pela ferramenta e Ainda a levantar (N itens). O total só aparece sem faltas. Com estimativas, aparece como "Total (inclui estimativas de referência)". Com estimativas em uso, o plano e os PDFs também trazem a nota da convenção, a conversão e as contas.
- Custos compartilhados continuam referenciados na frente de origem e não são somados de novo, inclusive quando a origem está em `referencia`. Não há soma entre moedas, períodos ou frentes.

## O que se estima

| Frente / item | Conta | Quantidades | Parâmetro |
|---|---|---|---|
| Letramento: realização da formação (`oferta`) | Soma por público (participantes × horas) × custo por hora. Com total distinto declarado menor que a soma: participantes distintos × média ponderada de horas × custo | `publicos.<id>.participantes`, `publicos.<id>.horas`, `alcance.totalUnico` | `formacao.custoHora.programa` (novo, US$ 12) |
| Educação: formação e apoio pedagógico | profissionais × horas × custo por hora | `orcamento.quantidades.profissionais`, `.horasProfissional` (novos, opcionais) | `formacao.custoHora.programa` |
| Governança: formação institucional | servidores × horas × custo por hora | `govOrcamento.quantidades.servidores`, `.horasServidor` (novos, opcionais) | `formacao.custoHora.programa` |
| Equipe e coordenação (três frentes) | pessoas em tempo integral × (meses ÷ 12) × custo anual | `…quantidades.equipeFte` (novo, opcional, decimal) e período | `sal.especialista_pedagogico` (US$ 36.000/ano) |
| Avaliação: governança (avaliação e revisão), educação (avaliação e acompanhamento), letramento (diagnóstico e avaliação de competências) | uma avaliação externa a cada 12 meses ou fração × valor | período | `gov.avaliacaoExterna.ano1` (US$ 25.000) |

Estudos, consulta, comunicação, supervisão, materiais, desenho, apoio, participação, digital, validação, sandbox, recursos adicionais e formação de formadores continuam sem estimativa. Para formação de formadores falta a quantidade de formadores, e a ferramenta não cria convenção para isso.

Os períodos são 12, 24 ou 36 meses na governança e 12 ou 24 no letramento. Na educação, "um ano" vale 12 meses, "três anos" vale 36 e "preparação e primeiro ano" é tratado como 12 meses. "A definir" ou texto livre não estimam.

Todos os parâmetros são "Convenção da ferramenta (v13), ilustrativa, grau C", em US$ e iguais para todos os países. A conversão usa a taxa já usada pela ferramenta: a taxa informada no caso para a mesma moeda ou, sem ela, a de data/moedas.json. Se a moeda do orçamento não tiver taxa, a linha mostra o valor em US$ na conta e explica por que não converte.

## Implementação e compatibilidade

- Função pura `estimativaReferencia(frente, categoria, estado)` em `app/src/percurso/estimativasOrcamento.ts`. Ela devolve `{ valor, valorUSD, moeda, conta, falta?, pendencias?, mensagem? }` ou `null` sem base. `totaisOrcamento`, `linhasTotais` e `notaEstimativas` são compartilhadas pelas três frentes.
- `orcamentoGovernanca`, `orcamentoLetramento` e `orcamentoEd` mantêm `subtotal` (só informados), `informados`, `faltam` e `total` (só sem faltas e sem estimativas). Eles acrescentam `informado`, `estimado`, `estimados` e `totalComEstimativas`. Cada item ganha `estimativa` e `estimado`.
- `referencia` só vale em categoria com base. Em outra categoria, ou importada com lixo, fica desconhecida e pendente. Valores negativos, infinitos e strings continuam rejeitados. Os campos novos ficam no `ctx` de cada percurso, são preservados em exportar/importar e não entram nas pendências.
- Formato 14, chaves de armazenamento e versão 0.1.0-alpha.8 não mudam. Uma linha nova em data/referencias.json (71 linhas, checagem aprovada).
- Textos completos em PT e EN. Nos demais seis idiomas, as entradas novas usam inglês explícito (`i18n/v15_zzzzzzzzzzz_estimativas_<l>.json`), sem sobrescrever traduções existentes.

## Validação

- `tests/unit/estimativas-referencia-v015.test.ts`, com 13 testes: categorias com e sem base; contas nas três frentes; conversão BRL e taxa informada; nada preenchido sem clique; recálculo ao vivo; valor digitado prevalece; falta de período, quantidade ou taxa; total só sem faltas e marcado; custo compartilhado não somado com origem em referência; importação com `referencia` e com lixo; três subtotais no plano, nos PDFs e na leitura simples (sumário em uma página); inglês.
- Atualizados só onde o comportamento aprovado mudou: leitura simples (até 7 linhas no resumo) e verificação de uso das linhas da base (inclui o novo módulo).
- Navegador (build de revisão, 1440×900 e 390×844, PT e EN): letramento com dois públicos (R$ 2.005.376,26 para 1.000 × 30 h + 200 × 10 h; R$ 2.945.396,38 após 1.500 professores); valor digitado por cima; "usar em todos"; governança com 2,5 pessoas em 24 meses (R$ 940.020,12) e 80 servidores × 16 h (R$ 80.215,05); educação com IA (120 × 24 h = R$ 180.483,86); panorama com três frentes; PDFs baixados, extraídos e uma página renderizada. Sem rolagem horizontal a 390 px.
