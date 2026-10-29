# Policy brief e plano mais limpo (requisitos)

28 de outubro de 2026. Origem: feedback de revisor externo ao Emanuel ("torná-lo o mais clean possível", "mais alto nível", "repensa o PDF na lógica de um policy brief: em uma página, um resumo executivo com uma frase para contexto, piloto, deploy, scale-up e custo; depois um policy brief de cinco páginas: qual o problema, qual é o desenho e qual é o custo"). Situação na 0.1.0-alpha.6: o PDF tem 46 a 50 páginas nos exemplos A–D e o "Em resumo" ocupa 3 páginas. Decisões do Emanuel: adotar as sugestões abaixo.

## Decisões
1. O PDF principal passa a ser o **policy brief** (no máximo 6 páginas). O conteúdo atual vira o **"Anexo técnico para a contratação"**, um segundo PDF em botão separado. Nada do que existe hoje é perdido.
2. A recomendação principal usa redação construtiva em todos os lugares (capa, brief, "Em resumo", fim do percurso): em vez de "Ainda não avance", "Recomendação: começar por uma prova de conceito antes do piloto" (e equivalentes para os outros gatilhos). O código interno do veredito continua.
3. As cinco ações entram no brief, cada uma só com o quê, quem e quando.
4. A tela "Em resumo" espelha a página 1 do brief; o resto fica em "ver detalhes".

## O brief (PDF principal)
| Página | Conteúdo | Regras |
|---|---|---|
| 1. Resumo executivo | Título do caso (rede e problema), data, selo "estimativa ilustrativa"; a recomendação em uma frase; cinco frases: **contexto** (rede, problema, linha de base), **prova de conceito ou piloto** (o que, onde, quanto tempo, critério para passar), **implantação** (primeira etapa: escolas, pessoas, ano), **expansão** (quando chega à rede toda, quantas pessoas), **custo** (custo total com faixa provável, custo do Ano 0 e custo anual em regime); linha do tempo das quatro etapas com o custo de cada uma | Uma página exata nos 4 exemplos e nos 9 idiomas; cada frase ≤ 35 palavras (≈ 220 caracteres em pt); sem tabela; caso incompleto: frase "a definir" com a pergunta que falta |
| 2. O problema | Situação atual e quem é afetado, linha de base, por que agora, alternativa sem IA e o que ela custaria | Título-achado; até ~250 palavras |
| 3. O desenho | As etapas como linha do tempo; o que precisa estar pronto para passar de uma à outra (portões G1–G4 em uma linha cada); quem usa e quem é afetado | Título-achado; tabela ≤ 8 linhas |
| 4. O custo | Custo total, P50 ("valor para orçar") e P90; custo por fase (icebergs compactos ou barras); custo por aprendiz e por usuário ativo; os 3 fatores que mais pesam | Título-achado; tabela ≤ 8 linhas; sem linhas com valor zero |
| 5. Riscos e salvaguardas | Nível de cuidado em três frases; as salvaguardas essenciais (dados, supervisão, contestação) | Título-achado |
| 6. Próximos passos | As cinco ações (o quê · quem · quando) e a próxima decisão | Remete ao anexo técnico |

Rodapé de cada página: versão, data, isenção curta. Mesmas fontes embutidas e RTL do PDF atual.

## Anexo técnico (segundo PDF)
O PDF atual, com título "Anexo técnico para a contratação", sem repetir o resumo executivo (abre com um índice e remete ao brief), mantendo: plano de ação completo, sequência de decisões, como testar e avaliar, quanto custa (contas por ano, cenários, simulação), o que exigir, listas do guia, apêndice (perfil, matriz, premissas e fontes, glossário, exemplos de norma, referências).

## Tela mais limpa
- "Em resumo": a recomendação, as cinco frases, três números (custo total com faixa, Ano 0, custo anual em regime) e a linha do tempo; depois os cinco cartões só com o quê, quem e quando (o resto abre ao clicar). Contadores, etiquetas de origem, indicadores extras, seis respostas, icebergs e direcionadores vão para "ver detalhes" (recolhidos) ou para "Quanto custa".
- Botões: "Baixar o policy brief (PDF)" como ação principal; "Anexo técnico (PDF)" como secundária, nas páginas do plano e no fim do percurso.
- Nada novo no percurso.

## Requisitos
| Id | Requisito | P | Verificação |
|---|---|---|---|
| PB-01 | `briefDados(estado)` puro em `app/src/plano/brief.js` devolve título, recomendação, as cinco frases, três números, etapas com custo e o conteúdo das páginas 2–6 | P1 | Teste nos exemplos A–D e no caso em branco |
| PB-02 | `gerarBrief(estado)` gera o PDF do brief com no máximo 6 páginas e o resumo em exatamente 1 | P1 | Teste nos 4 exemplos × 9 idiomas (contagem de páginas e posição do fim do resumo) |
| PB-03 | Cada frase do resumo ≤ 35 palavras; nenhuma tabela do brief > 8 linhas; nenhuma linha com valor zero | P1 | Teste |
| PB-04 | O PDF atual vira "Anexo técnico para a contratação", sem o resumo executivo repetido | P1 | Título e ausência de "Em resumo" no texto extraído |
| PB-05 | Redação construtiva da recomendação em todos os lugares; nenhum "Ainda não avance" visível | P1 | Busca nas saídas de A–D (página, PDFs, síntese) |
| PB-06 | "Em resumo" mostra a mesma recomendação, as mesmas cinco frases e os mesmos três números da página 1 do brief | P1 | Comparação de strings na página e no PDF |
| PB-07 | Cartões com o quê, quem e quando visíveis; demais campos recolhidos e acessíveis por teclado | P2 | Teste de tela (e2e) |
| PB-08 | Dois botões de download com o brief como principal, nas páginas do plano e no fim do percurso | P1 | e2e: os dois PDFs baixam |
| PB-09 | Textos novos nos 9 idiomas | P2 | `idiomas.test.ts` |
| PB-10 | Sem rolagem horizontal a 360 px; árabe correto | P2 | e2e |
