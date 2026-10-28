# PLA — Plano de contratação, relatório e exportações (v13 × v14)

Método: li o código da v13 (`src/resumo.js`, `plano_pdf.js`, `recomendacoes.js`, `app.js`, `plano/7_relatorio_design.md`, os quatro testes) e o da v14 (`app/src/screens/{Plano,Secao,CasoDialog}.tsx`, `plano/{secoes,pdf}.js`, `export/json.ts`, `percurso/painel.ts`, `design/redesign/02-especificacao...`). Abri `docs/index.html` (v13) e o build de `app/` (v14, em `/tmp/v14b`) no Playwright, com o exemplo B nos dois, em 1360 e 400 px, em pt. Gerei o PDF nos dois e li com `pdftotext`. Testei o caso em branco e a importação de um JSON da v13 na v14. Capturas e scripts em `scratchpad/pla/`.

## 1. Inventário da v13 e situação na v14

Legenda: sim / parcial / não. Onde = arquivo:função.

### 1.1 Página do plano

| # | Funcionalidade da v13 (onde) | v14 | Onde na v14 / o que falta |
|---|---|---|---|
| 1 | Capa na página: logos, "Plano de contratação", nome do caso, lugar e data, caixa "Recomendação principal" com link "N ações de prioridade alta", faixa de isenção (`resumo.js:renderPlano`, `capa`) | parcial | `Plano.tsx:Resumo`: kicker, título (caso · rede), fatos em uma linha e callout "Recomendação principal". Sem logos na capa (estão no cabeçalho do app), sem data, sem contagem de ações de prioridade alta, sem link para as recomendações. A isenção está no `Rodape` de cada página. |
| 2 | "Em resumo": 4 KPIs, barras por camada, colunas "Dotação por exercício", fichas de "fatos do caso" (`htmlEmResumoP`, `grafCamadasP`, `grafExerciciosP`) | parcial | 4 `KpiTile` com `SourceTag` de origem (melhor que a v13) e `LayerBars` com frase de conclusão. Faltam as colunas de dotação por exercício (na página só existe como tabela de uma linha, em "Quanto custa", `secoes.js`: sub "Dotação a solicitar por exercício"; o PDF tem o gráfico, `pdf.js:colunasExercicio`). Os fatos do caso viraram uma linha de texto; os chips (aplicações, quem usa, tecnologia e pagamento, teste, escala) não estão na página. |
| 3 | Aviso "Plano parcial: N respostas pendentes" com link para a lista (`htmlEmResumoP`) | parcial | `Alert` com link "Ver o que falta". A contagem cobre só as 25 telas do Essencial (caso em branco: "25 perguntas essenciais"). O PDF diz "47 respostas pendentes" (todas as perguntas de `faltasTodas`). |
| 4 | Índice lateral com seção atual (IntersectionObserver), faixa de chips em tela estreita, blocos A/B com filhos A1–B9 (`montarPlano`, `rp-indice`) | parcial | `PlanIndex` lista só as 5 páginas e "Respostas que faltam"; vira faixa de chips a 400 px (testado, sem rolagem horizontal). Não há índice dentro da página (A1–B9) nem destaque da seção atual. "Quanto custa" tem 9,2 mil px, "O que fazer" 10,5 mil px (1360 px) e 19 mil px em 400 px. |
| 5 | Barra de ações: Baixar PDF, Voltar ao percurso, Copiar texto, Exportar caso, Importar caso (`renderPlano`, `rp-acoes`) | parcial | `Plano.tsx`: "Voltar às perguntas · n faltam" / "Rever as respostas", "Exportar caso", "Baixar o plano em PDF" (com "Gerando o PDF…" e mensagem de erro, melhor que a v13). "Copiar texto" não existe. "Importar caso" só no diálogo "Caso" do cabeçalho (`CasoDialog.tsx`). |
| 6 | Recomendações: até 5 cartões de prioridade alta, depois lista completa por momento; contagem (total, por tipo, altas); caixa de marcar visual (`htmlRecsP`, `recomendacoes.js:recContagem`) | parcial | "Comece por estas" (3 cartões) em Em resumo; "O que fazer" agrupa por momento com contagem por grupo (`Plano.tsx:Fazer`). Falta o resumo "N ações · N custo · N política · N de prioridade alta". Numeração de `Fazer` (1..25 por momento) não bate com a de "Comece por estas" (por prioridade). Sem caixa de marcar. |
| 7 | Filtros por momento, tipo, prioridade | não (nos dois) | A v13 também não tem filtros interativos na página (só agrupa por momento; `data-tipo`/`data-prio` só como atributos). O pedido do contexto ("filtros") não vem de requisito da v13. Na v14 também não há. Ver PLA-11. |
| 8 | "Ir à pergunta" em cada recomendação e "Responder" em cada lacuna, para qualquer das ~51 perguntas (`data-ir`, `recomendacoes.js:recIr`, `fluxo.js:abrirFase`) | parcial | `painel.ts:telaDoNumero` só acha perguntas do Essencial. No exemplo B, 4 de 25 recomendações não têm link (2.5.2 duas vezes, 2.3.7, 3.2.1: itens 3, 12, 21, 24). Nas demais o rótulo é "Rever a resposta". A lista "Respostas que faltam" da página só tem as telas do Essencial (`faltamDe`). |
| 9 | Perfil do caso: 9 cartões por área, tabelas de etapas e ferramentas dentro dos cartões, aviso de lacunas "__", valores em várias linhas (`htmlPerfilP`) | sim | `Secao.tsx:Cartoes` no Apêndice (9 cartões, linhas múltiplas, tabelas). Vai para o fim do documento; ver PLA-03 sobre o "Resumo do caso" de 45 linhas na primeira página. |
| 10 | Matriz camadas × fases com estado como pílula colorida, custo em negrito, linha Total, faixa de cor por fase, rolagem interna a 400 px (`htmlMatrizP`, `renderMatrizTabela`) | parcial | Mesma tabela 7×4 + Total, soma e crédito, em `DataTable` (Apêndice), sem pílulas de estado nem cor por fase: estado e custo viram texto entre parênteses, "(Perguntas 1.3.1, ... · Respondido · US$ 15 mil)". Posição mudou: de segunda seção para o Apêndice. Sem rolagem horizontal a 400 px (testado). |
| 11 | Seções A1–A7 e B1–B9 com faixa colorida dos blocos A e B, equação do custo, tabelas, listas longas em `details` (`secoesPlano`, `htmlCorpoP`) | parcial | Reorganizadas nas 4 páginas + apêndice (decisão de UX). Equação e tabelas OK. As faixas A/B foram removidas (decisão). Listas e tabelas longas (> 14 linhas) não são recolhidas: "As contas de cada ano" aparece inteira. `det` (arranjos, supervisão, pontos de decisão) continua em `details`. |
| 12 | Figura 1 em miniatura, legenda, crédito e visualizador ampliado (Esc, fundo, Fechar, foco preso) (`htmlFiguraP`, `figuraMini`, `abrirVisor`) | parcial | `Secao.tsx` (tipo figura): imagem de 638 px, legenda e crédito, no Apêndice. Sem "Ampliar a figura" nem visualizador (nenhum `Dialog` no plano). A especificação diz "Figura 1 com `Dialog`" (`02-especificacao...:166`). |
| 13 | Gráficos em SVG acessíveis (title/desc, valores em texto) | parcial | `LayerBars` (barras); sem gráfico de colunas. |
| 14 | Impressão: `@media print`, quebras de página, cores preservadas, `details` abertos (`CSS_PLANO_V13`, `beforeprint`) | não | `grep` em `app/src` não acha `@media print` nem `beforeprint`. Impressão do navegador na v14 sai com cabeçalho do app, barra de ações e navegação (confirmado com `emulateMedia print`: `.pc-plano-acoes` e `header` continuam visíveis). O PDF é o caminho de impressão. |
| 15 | Aviso de tradução preliminar no plano (`avisoTradHTML`) | não verificado aqui | `Idioma.tsx` tem o aviso do seletor; não achei no `Plano.tsx`. Área de i18n. |
| 16 | Plano que abre do percurso e volta (`abrirPlano`, `voltar-percurso`) | sim | Rota `#/plano`; botão de voltar. |

### 1.2 PDF

| # | v13 (`plano_pdf.js:gerarPDF`) | v14 | Observação |
|---|---|---|---|
| 17 | Capa com faixa de fases, logos, caso, data, recomendação principal, ações altas, 4 KPIs, índice com páginas, isenção | sim | `pdf.js`; ordem dos logos invertida (UNESCO antes de IA.EDU) e faixa em verde-azulado em vez do gradiente das fases. |
| 18 | "Em resumo": KPIs, barras por camada, colunas por exercício, fatos do caso em cartões | parcial | Barras e fatos sim. As colunas por exercício passaram para o topo de "Quanto custa". Cores das 7 barras diferentes das da Figura 1 (camada 6 verde, camada 7 cinza; v13 laranja e azul-marinho). |
| 19 | Recomendações: top 5 em cartões e tabela por momento | sim | "Comece por estas" + "Todas as recomendações, por momento". |
| 20 | Perfil, matriz (2 páginas), Figura 1 em página própria com crédito, referências, pendentes | sim | Tudo no Apêndice. 31 páginas (v13: 30). |
| 21 | Cabeçalho corrido, rodapé "n / N", fontes ≥ 8 pt, 9 idiomas, fontes Noto para ar/zh/bm | sim | Rodapé traz a versão `v0.1.0-alpha.3`. |
| 22 | Aviso de plano parcial no resumo; lista de pendentes no fim | parcial | Existe, mas conta 47 (todas as perguntas), enquanto a página conta 25 (Essencial). |
| 23 | Origem dos números (a especificação diz: "cada número leva a origem em texto; a capa diz 'Estimativa com N premissas padrão'", `02-especificacao:178`) | não | O PDF não tem `padrão`/`sugerido`/`informado` em nenhum KPI nem na capa. No caso em branco o PDF traz US$ 644,2 mil e US$ 584,83 por usuário sem rótulo, enquanto a página mostra "Ainda sem números". |

Presente na página e ausente no PDF: etiquetas de origem dos KPIs, links para as perguntas, avisos "Ainda sem números", `details` recolhidos, barra de ações. Presente no PDF e ausente na página: gráfico de colunas de dotação, capa com logos e data, índice com números de página, cabeçalho/rodapé com "n / N", "Estimativa baseada em premissas padrão: N perguntas".

### 1.3 Exportações, importação e mensagens

| # | v13 (`app.js`) | v14 | Observação |
|---|---|---|---|
| 24 | Exportar caso (JSON, `dadosCaso`, formato 13), nome `ai-education-case-<slug>.json` | sim | `export/json.ts`, formato 14 (acrescenta `origem`, `sugestoes`, `modo`, `capitulo`). Mesmo nome de arquivo. |
| 25 | v13 lê o arquivo exportado pela v14 | não | A v13 só aceita formatos 9, 11 e 13 (`importarCaso`): testei, devolve `false`. O README da v14 afirma que a v13 "lê o arquivo nas chaves que conhece"; isso só vale com `formato` reescrito. |
| 26 | Importar caso (arquivo ou colar dados), formatos 9/11/13 e v8 | parcial | `CasoDialog.tsx` só tem "escolher arquivo"; sem colar dados (a v13 oferecia a textarea para quem não tem download). Importei um JSON da v13 do exemplo B: mesmos 4 KPIs (US$ 336,2 mil; 1,77 mi; 311,9 mil; 12,77). Erros mostrados em `Alert`. |
| 27 | `CAP.downloads.save` no artefato; sem download, "Copiar dados do caso" | parcial | `baixarArquivo()` usa só `<a download>`. `grep downloads|claude.use` em `app/src` não acha nada. A especificação previa `CAP.downloads.save` no artefato; num artefato isolado o `<a download>` pode não baixar e não há alternativa de copiar. |
| 28 | PDF: `CAP.downloads` ou `doc.save` | parcial | Só `baixarArquivo`. Nome `procurement-plan-<slug>.pdf` igual. |
| 29 | Copiar texto do plano (`relMD`) | não | Botão removido junto com o Markdown. A especificação só cita a remoção de `dl-md` e `dl-html`; "Copiar texto" não é mencionado. |
| 30 | Markdown e HTML do plano (`dl-md`, `dl-html`) | fora (decisão) | Confirmado em `02-especificacao:181`: "`dl-md` e `dl-html` são removidos". Na v13 já nem havia botão na interface (só o tratador em `app.js:564-565`); só "Copiar texto" usava `relMD`. |
| 31 | CSV de custos (`dl-csv`, `csvCustos`) | fora (decisão) / sem acesso | `02-especificacao:181`: "`csvCustos` fica no Refinar". Na v13 o tratador existe (`app.js:566`) mas nenhum botão o chama (verifiquei `docs/index.html`: uma única ocorrência de `dl-csv`, o tratador). Na v14, `domain/custos_ui.js:csvCustos(cfg)` existe e não tem nenhuma chamada na interface; a tela Refinar ainda não existe (só o alternador de modo). |
| 32 | Toasts: "Arquivo enviado para download", "Não foi possível baixar agora", "Dados do caso copiados", "Caso importado", "Plano copiado" (`app.js:toast`) | parcial | O componente `Toast` existe e só é usado na galeria. "Exportar caso" na página do plano não dá nenhum retorno (testei: nenhum `role=status`). No diálogo, `Alert` "Caso exportado." e "Caso importado.". PDF: botão em "Gerando o PDF…" e erro em `role=alert`. |

## 2. Defeitos encontrados na v14 (além das lacunas acima)

- `/plano/faltam` repete o título "Respostas que faltam" (h1 do `Plano` e h2 de `Faltam`).
- Em Em resumo, o `Secao` do `resumo` é montado com `cartoes: undefined` e imprime todas as 45 linhas de `linhasResumo` em tabela (print `v14_resumo.png`), repetindo o perfil do Apêndice. No caso em branco são 45 linhas de "—".
- `Por quê: você respondeu "nao_sei" à pergunta 3.2.1` (valor cru em vez de rótulo). A v13 tem o mesmo defeito (`recRotulos` sem opções para 3.2.1), herdado.
- Os "Por quê" citam perguntas que o usuário do Essencial nunca viu (2.5.2, 2.3.7, 3.2.1), sem link.
- Em Em resumo, "Comece por estas" mostra 3 itens mesmo quando nenhum é de prioridade alta (usa `recs.slice(0, 3)`).
- Sem teste automatizado da página do plano na v14: `tests/unit/plano.test.ts` cobre seções e PDF; `e2e/percurso.mjs` só o percurso. O aceite da etapa 5 da especificação (portar `test_v9_plano.py`, `test_v10_recs.py`, `test_v13_plano.py`) não tem equivalente de interface (cartões, links, figura, 400 px).

## 3. Requisitos para a v14

| ID | Requisito (do ponto de vista do usuário) | Prio | Decisão de UX |
|---|---|---|---|
| PLA-01 | Toda recomendação, e todo item de "Respostas que faltam", tem um link que leva a um lugar onde a pergunta pode ser respondida, inclusive perguntas fora do Essencial (2.5.2, 2.3.7, 3.2.1…): no modo Refinar abre a tela da pergunta; no Essencial, abre o capítulo com a pergunta exposta ou alterna para Refinar com aviso. Nenhuma recomendação do exemplo B fica sem link. | P1 | adaptar: o link é "Rever a resposta"; a v13 usava "Ir à pergunta" (`painel.ts:telaDoNumero`) |
| PLA-02 | A contagem de lacunas é a mesma na página, no botão do PDF e no PDF (hoje: 25 na página, 47 no PDF), com a definição dita ao usuário ("N perguntas do Essencial; M de refinamento"). A lista "Respostas que faltam" mostra as duas classes ou diz onde ver as outras. | P1 | adaptar |
| PLA-03 | "Em resumo" não traz a tabela de 45 linhas do caso: mostra os fatos do caso (etapas e estudantes, aplicações, quem usa, tecnologia e pagamento, teste, escala) como fichas, e o perfil completo fica só no Apêndice. | P1 | adaptar: a v14 manda o perfil para o Apêndice (`02-especificacao:166`); a tabela inteira em Em resumo é erro de montagem em `Plano.tsx:Resumo` |
| PLA-04 | Todo número do PDF diz sua origem (padrão, sugerido, informado, refinado) e a capa traz "Estimativa com N premissas padrão" quando houver; no caso sem `tipoTec` o PDF não mostra KPIs de custo como se fossem resultado (ou rotula como premissa padrão), coerente com a página ("Ainda sem números"). | P1 | `02-especificacao:178` já exige |
| PLA-05 | O gráfico de colunas "Dotação a solicitar por exercício" existe na página, em "Quanto custa" (e opcionalmente em Em resumo), com valores em texto e acessível, igual ao do PDF. | P2 | adaptar: mover do Em resumo para "Quanto custa", como já fez o PDF |
| PLA-06 | A Figura 1 tem "Ampliar a figura" que abre um visualizador sobre a página (`Dialog`): Esc e clique no fundo fecham, botão Fechar, foco preso e devolvido, legenda e crédito, funciona a 400 px. | P2 | `02-especificacao:166` prevê `Dialog` |
| PLA-07 | Imprimir a página do plano pelo navegador (Ctrl+P) sai como documento: sem cabeçalho do app, índice nem botões; quebras antes de cada página do plano; cores preservadas; `details` abertos. | P2 | adaptar: o PDF continua sendo o caminho principal; `@media print` mínimo |
| PLA-08 | As páginas longas ("Quanto custa", "O que fazer") têm índice interno (A2, A3; A1, B1–B4, B7–B9) com destaque da seção atual, ou as seções longas começam recolhidas. | P2 | adaptar: `PlanIndex` cobre as páginas; falta nível de seção |
| PLA-09 | Em "O que fazer", o topo mostra "N ações: N custo e compra, N política e governança, N de prioridade alta", como na v13, e a numeração dos cartões é a mesma de "Comece por estas". | P2 | adaptar |
| PLA-10 | Exportar caso e baixar o PDF funcionam em artefato isolado: usam `CAP.downloads.save` quando existir; sem download, oferecem "Copiar dados do caso" e importar colando o texto. Todas as ações mostram retorno (toast "Caso exportado", "Arquivo enviado para download", "Não foi possível baixar agora"). | P2 | `02-especificacao:181` prevê `CAP.downloads.save` |
| PLA-11 | A lista de "O que fazer" pode ser filtrada por momento, tipo (custo e compra / política e governança) e prioridade, mostrando a contagem do filtro. | P3 | novo (a v13 também não tem; só agrupamento por momento) |
| PLA-12 | A matriz do Apêndice mostra o estado de cada célula como pílula (Respondido, Em andamento, Pendente, Orientação) e o custo em destaque, com a cor da fase no cabeçalho; a soma das células continua igual ao total do ciclo. | P3 | adaptar com tokens do Prumo |
| PLA-13 | Cores das 7 barras e das camadas no plano e no PDF seguem a Figura 1 de Krueger e Jackson (2026, p. 11) ou o plano mostra a legenda de cor usada. | P3 | adaptar: a identidade nova trocou a paleta; decidir e documentar |
| PLA-14 | "Copiar texto do plano" (texto simples da página para a área de transferência). | P3 | fora (decisão) para Markdown/HTML; manter ou abandonar "Copiar texto" por decisão explícita |
| PLA-15 | Tabelas e listas com mais de 14 linhas ou 10 itens ("As contas de cada ano", cláusulas) começam recolhidas na página e abertas no PDF. | P3 | adaptar |
| PLA-16 | Importar caso aceita colar o texto do JSON (além do arquivo) e aceita os formatos 9, 11, 13 e 14; o README deixa de dizer que a v13 lê o arquivo da v14, ou a v14 grava `formato: 13` com campos extras. | P3 | adaptar |
| PLA-17 | A capa na página mostra data e logos (ou o cabeçalho do app cobre isso por decisão explícita) e a contagem "N ações de prioridade alta" com link para "O que fazer". | P3 | adaptar |
| PLA-18 | `/plano/faltam` mostra um só título; "Em resumo" só mostra "Comece por estas" com ações de prioridade alta (ou muda o título quando não houver). | P3 | corrigir |
| PLA-19 | O "Por quê" mostra o rótulo da resposta (não `nao_sei`) e cita só perguntas que o usuário consegue abrir (ver PLA-01). | P2 | corrigir (defeito herdado da v13, `recomendacoes.js:recRotulos`) |
| PLA-20 | Existem testes de interface da página do plano (cartões do perfil, links "Rever a resposta", figura ampliada, 400 px sem rolagem horizontal, impressão), portados de `test_v9_plano.py`, `test_v10_recs.py`, `test_v13_plano.py`. | P2 | exigido por `02-especificacao:189` |
| PLA-21 | Decisão registrada sobre CSV: `csvCustos` ganha botão na tela Refinar ("Baixar custos em CSV") quando Refinar existir; até lá, a ausência é conhecida (não há botão hoje na v13 nem na v14). | P3 | `02-especificacao:181`: "fica no Refinar" |

## 4. As 5 lacunas mais graves

1. Links para a pergunta falham fora do Essencial: 4 de 25 recomendações do exemplo B sem link e "Respostas que faltam" só lista as 25 telas essenciais (PLA-01, PLA-19).
2. Página e PDF discordam: 25 lacunas na página contra 47 no PDF, e o PDF mostra custo sem origem (nem "premissa padrão") no caso em branco, que a página esconde (PLA-02, PLA-04).
3. "Em resumo" abre com uma tabela de 45 linhas do caso e perdeu os fatos em fichas, a contagem de ações de prioridade alta e as colunas de dotação por exercício (PLA-03, PLA-05, PLA-09).
4. A página não tem impressão, ampliar a figura (a especificação pede `Dialog`) nem índice dentro das páginas de 10 a 19 mil px (PLA-06, PLA-07, PLA-08).
5. Exportação sem `CAP.downloads`, sem alternativa de copiar, sem retorno ao usuário no botão "Exportar caso", e sem testes de interface do plano (PLA-10, PLA-20).
