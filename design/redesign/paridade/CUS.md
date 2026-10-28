# CUS — Custos, calculadora e números (v13 × v14)

Método: leitura de `src/custos_ui.js`, `src/formula.js`, `src/fluxo.js` (passo4b), `src/app.js`, testes e `plano/5_v10.md`, `plano/6_v11.md`; v13 aberta em Playwright (`docs/index.html`, exemplo A, passo 4.2 e calculadora, modo avançado); v14 compilada (`vite build` para a pasta de trabalho, sem tocar no repositório) e percorrida (`#/plano/custa`, modo Refinar, sínteses dos capítulos 2, 3 e 4). Confirmado por grep em `app/src` quando digo "não existe".

## 0. Resumo do achado

- A v14 **não tem calculadora**. Não existe rota `#/refinar/...` (`app/src/percurso/rota.ts` só conhece início, capítulo, síntese, plano e galeria). O modo Refinar da v14 é só a lista "Premissas deste capítulo" no fim de cada síntese (`Percurso.tsx:PremissasCapitulo`), que mostra campos de CAMPOS dos tipos `radio|chips|multi|texto|area|num|horas`. Nenhum campo da `cfg` de custo (preços, quantidades por ano, itens, pessoas, multiplicadores, inflação, câmbio) é editável.
- A especificação previa três abas (Premissas por ano; Ferramentas e licenças; Cenários e sensibilidade) e "de onde vem?" com `Popover`. Nada disso foi construído: não há componente `Popover` em `app/src/ui/`; `SourceLink`/`SourceLine` existem mas só são usados em `Galeria.tsx` (demonstração); `Plano.tsx` mostra `SourceTag` sem link "de onde vem?".
- O motor está todo portado e é puro, mas `cenarios`, `tornado`, `sensibilidade`, `simular`, `compArquiteturas`, `comparar`, `equidade`, `lmdi`, `laspeyres`, `cae`, `orcamentoDeLinhas`, `direcionadores`, `PRESETS` e `csvCustos` **não são chamados por nenhuma tela ou módulo da v14** (grep em `app/src` fora de `domain/`). Só `calcular`, `avaliar`, `indicadores`, `orcamento`, `somaPorCamada` (via `numerosCusto`), `secaoFormula`, `compLicenca` (texto de alerta em A3) e `premissasUnitarias` chegam à tela, e só dentro do plano.
- **Moeda**: a v14 guarda `estado.moeda` (`{cod, taxa, taxaDe}`), sincroniza com o domínio (`percurso/ambiente.ts:sincronizar` → `setMoeda`) e `din`/`grande`/`mil` convertem, mas **não existe controle para trocar moeda ou taxa** (grep "moeda|setMoeda" em `.tsx`: nenhum uso). A moeda só muda se a pessoa importar um JSON da v13/v14 com outra moeda, e aí não consegue voltar. `MOEDAS` (fonte e data da taxa) é exportado em `ambiente.ts` e nunca exibido.
- **CSV**: na v13 o manipulador `data-act="dl-csv"` existe (`app.js:566`) mas **nenhum botão o dispara** (conferido na calculadora e na página do plano: sem `dl-csv`); só funciona pelo console. Na v14, `csvCustos(cfg)` está portada e testada (`dominio.test.js`), sem botão. A spec 02 diz que `csvCustos` "fica no Refinar". Portanto o CSV é uma funcionalidade nunca exposta: P2, não P1.
- Para o motor, o estado de edição existe (`custo: {base, cfg, editado}`, `cfgAtual(estado)`, store `setCusto(parcial)`), mas nada o usa.

## 1. Inventário da v13 e situação na v14

Legenda: sim / parcial / não. "Plano" = `#/plano/custa` (e Resumo) da v14.

### 1.1 Passo 4.2 (fluxo.js:passo4b) e fórmula (formula.js)

| # | Funcionalidade v13 (o que o usuário vê) | Onde na v13 | v14 | Onde / o que falta |
|---|---|---|---|---|
| 1 | Seletor de moeda de exibição (10 principais + ~160 por nome no idioma, `Intl.DisplayNames`) no topo do 4.2 | `fluxo.js:seletorMoeda`, `app.js` evento `data-moeda=cod` | não | Domínio ok (`setTabelaMoedas`, `nomeMoeda`, `moedaInfo`); store tem `setMoeda`; falta o controle |
| 2 | Cinco KPIs: custo do Ano 0, total do ciclo, dotação média por ano, por usuário ativo por ano, custo de sair (anos de custo recorrente) | `fluxo.js:passo4b` | parcial | Resumo: 4 KPIs (`painel.ts`: ano0, total, anual, porAluno) com `SourceTag`; "anos para sair" só como linha de A2 (`secoes.js` kv). Sem "de onde vem?" |
| 3 | Linha "Adaptação (K3.1 + K3.2), Ano 0" com o nível escolhido | `passo4b` (`adaptacaoAno0`) | não | `adaptacaoAno0` portada, sem uso. A2 traz só o texto de premissa "Nível de adaptação" |
| 4 | Bloco "Como o custo é calculado": equação total = teste + uso + saída − residual com valores e "Anos 1 a H = Ano 1 + Ano 2…" | `formula.js:renderFormula` | sim | `Secao.tsx:Equacao` a partir de `secaoFormula(cfg)`; idêntico em conteúdo |
| 5 | "As contas de cada ano": abas Ano 0…H e Saída, painel com linhas "quantidade × preço = valor", cabeçalho com cobertura de 90%, "Outros itens (N)" expansível, soma, valor presente | `renderFormula`/`fxPainel`/`fxLinhaHtml`, `S.formulaAno` | parcial | Plano: uma única tabela com todos os anos empilhados (≈150 linhas na página, 9.100 px de altura), sem abas, "Outros itens" fechado em uma linha só (sem lista dos itens). Falta abas por ano e expansão de "Outros" |
| 6 | "De onde vêm os números" (quantidades e preços de partida, caminho da demanda) e "Como ler a estimativa" (3 frases) | `explicacaoCusto().origem/leitura` | sim | Mesmas listas em A2 (`secaoFormula`) |
| 7 | Nota de valores ilustrativos; "Mude as premissas na calculadora completa" | `renderFormula` | parcial | Nota existe; o texto que manda ir à calculadora aponta para algo que não existe na v14 |
| 8 | "Custo por camada" (7 camadas, Ano 0, total, %) | `passo4b` | sim | `LayerBars` + tabela em `#/plano/custa` |
| 9 | "Dotação a solicitar por exercício" | `passo4b` | parcial | Linha única "Dotação a solicitar" em A2. Sem fixo, variável, reservas, contingência, capital/corrente (ver 2.10) |
| 10 | "Premissas desta estimativa" (lista) | `premissasUnitarias`, `prem` | sim | A2 "Assumptions of this estimate" |
| 11 | Matriz camada × fase com custo por célula (soma = custo total) | `matriz.js:matrizCaso/custoMatriz` | parcial | Tabela de texto no Apêndice (`secoes.js:secaoMatriz`); `custoMatriz` portada. A visão interativa da matriz é de outra área (início) |
| 12 | Aviso "enquanto faltarem respostas… usa premissas padrão" | `passo4b` | sim | Alert e etiqueta de origem do plano |

### 1.2 Calculadora completa (custos_ui.js:renderCustos / renderCustosResultados / renderAvancado)

| # | Funcionalidade v13 | Onde | v14 | Situação |
|---|---|---|---|---|
| 2.1 | Base de premissas: "Seu caso", Exemplo A (SaaS), B (API + RAG), C (pesos abertos) | `data-cbase`, `app.js:532` | não | `PRESETS`, `cfgAtual` (suporta `custo.base`) portados; sem UI |
| 2.2 | Texto de origem das premissas ("montadas a partir do seu caso: arquitetura…, N elegíveis, governança para perfil…") | `renderCustos` | não | |
| 2.3 | Botão "Refazer a partir das respostas" (descarta edições) | `data-act=recalc` | não | Descarte silencioso existe: `store/caso.ts:97,123,157` zera `custo.cfg` quando uma resposta de `CAMPOS_CUSTO` muda (igual à v13, `fluxo.js:197`), sem aviso |
| 2.4 | Taxa de câmbio substituível (campo "BRL por US$ 1" com taxa de referência como placeholder), texto sobre data e fonte da taxa | `data-moeda=taxa`, `MOEDAS.data/fonte` | não | `moedaInfo` honra `taxa`/`taxaDe`; sem campo, sem texto |
| 2.5 | Alternar conta Econômica × Orçamentária | `data-cconta` | não | |
| 2.6 | Modo avançado (liga bloco de conta econômica e as ferramentas de análise) | `data-cavanc` | não | |
| 2.7 | "Reproduzir os números da versão 1 do guia" (`OPC_COMPAT`) | `data-ccompat` | não | `OPC_COMPAT` exportado, sem UI (P3) |
| 2.8 | 7 KPIs: custo total (econômica), dotação total, índice de custo unitário, custo marginal por usuário adicional, % capacidade interna, % em moeda estrangeira, custo de sair | `renderCustosResultados` | parcial | 4 destes no Resumo/A2; faltam marginal, % capacidade, % USD |
| 2.9 | Índice de custo unitário por componente (gráfico, soma exata) + custo por elegível, por interação, razão marginal/médio | `graficoICU` | não | `indicadores(cfg, av)` devolve `icu, icuK, icuElegivel, custoInteracao, marginal, razaoMarginalMedio, pCapacidade, pUSD, anosParaSair, usuariosAno` |
| 2.10 | Visão orçamentária por exercício: contratos fixos, consumo variável, reserva para adoção acima do esperado, contingência, dotação, da qual capital/corrente, capacidade interna mobilizada, insumos cedidos, saída | `renderCustosResultados` | não | `orcamento(cfg)` devolve `fixo, var, reserva, cont, dot, capital, corrente, cap, doado, saida, contPct` |
| 2.11 | Árvore de custos K1–K6 → subcomponentes → insumos, expansível, com colunas por ano, total, por usuário-ano, % (duas contas); Abrir/Fechar tudo | `tabelaArvore`, `data-tog` | não | `ARVORE`, `NOME_S`, `av.linhas`, `av.porK/porS` disponíveis; v14 mostra só as 7 camadas |
| 2.12 | Gráfico de composição por ano e componente | `graficoComposicao` | não | `LayerBars` só do total |
| 2.13 | Cenários (Esperado, Alta adoção, Estresse) com usuários, custo total, desembolso, ICU, K1–K6; legenda de como cada cenário é montado | `cenarios(cfg)` | não | |
| 2.14 | "O que mais move o custo" (tornado) com faixas por direcionador | `graficoTornado2`, `tornado(cfg)` | não | |
| 2.15 | Licença institucional × nominal por ano e adoção de equilíbrio | `compLicenca(cfg)` | parcial | Só uma frase em A3 ("só compensa com adoção acima de X%") |
| 2.16 | A mesma função em outras arquiteturas (Ano 2) | `compArquiteturas(cfg)` | não | |
| 2.17 | Premissas de demanda por ano: elegíveis, adoção (%), meses de uso; sessões e interações | `anosC('demanda.*')` | não | Nem a grade por ano (`SchoolsGrid` grava `soTotal` e o link "detalhar por ano" não está ligado) |
| 2.18 | Premissas por arquitetura: SaaS (preço, reajuste, licenças por ano, meses cobrados, fração do preço cobrada, licença nominal); API+RAG (15 campos); pesos abertos (12 campos de GPU) | `arqBloco` | não | |
| 2.19 | Tempo, preços e câmbio: horizonte H (1–10), inflação, variação cambial, multiplicador cambial, de pessoal, de preço, contingência | `opc.*`, `mult.*` | parcial | Só `horizonte` 3 ou 5 como pergunta radio do capítulo 4 (Refinar). Sem os demais |
| 2.20 | Adaptação: multiplicadores K3.1 e K3.2 | `adaptacao.fK31/fK32` | parcial | Nível de adaptação (pergunta `adaptacao`, Refinar cap. 2) escolhe o fator; sem edição direta |
| 2.21 | Conta econômica (avançado): taxa de desconto, tendência de preço, preço-sombra da capacidade, prob. de saída, vida útil, fechamento do horizonte, valorar cedidos | `opc.r/delta/sigmaCap/pSaida/vidaUtil/fechamento/doados` | não | |
| 2.22 | Insumos editáveis: implantação e manutenção %, serviços mensais, itens por ano (nome, subcomponente, moeda local/US$, valor por ano), pessoas (atividade, subcomponente, natureza capacidade/desembolso, função, FTE por ano), salários por função, formação, saída (reconstrução, meses em paralelo, retreinamento, outros) | `renderCustos` tabelas; `add-item/add-base/add-pessoa/add-saida/rm` | não | |
| 2.23 | Faixas dos direcionadores (mín/máx) editáveis | `data-faixa`, `cfg.faixas` | não | |
| 2.24 | Monte Carlo (1.500 cenários, P10/P50/P90, custo em risco por exercício, semente) | `simular(cfg, N, seed)` | não | |
| 2.25 | Custo anual equivalente | `cae(valor, r, n)` | não | |
| 2.26 | Decomposição LMDI da variação entre dois anos (escala, uso, preço, câmbio) | `lmdi` | não | |
| 2.27 | Índice de preços Laspeyres | `laspeyres` | não | |
| 2.28 | Comparação de alternativas (status quo/sem IA) com efeito, razão custo-efetividade incremental, dominância, efeito mínimo para justificar | `comparar`, `cfgAlternativa`, `sc.alts`, `sc.lambda` | não | |
| 2.29 | Equidade: custo por estrato (urbana, rural, difícil acesso) com fatores sobre K1 e K4 | `equidade`, `sc.estratos` | não | |
| 2.30 | Campos numéricos com formato do idioma (`inputNum`): decimal, milhar, % guardado como fração, cursor preservado | `custos_ui.js:inp`, `test_v9_numeros.py` | não | `lerNumero`/`fmtEntrada` no domínio; `TextField type=number` não formata e `Controles.tsx:num` arredonda para inteiro (inviável para FTE 0,05, preço 0,05 US$, 2,5%) |
| 2.31 | Texto "Como ler e o que ainda depende de dados locais" (duas contas, índices, premissas ilustrativas, benefícios fora do custo) | rodapé de `renderCustos` | não | |
| 2.32 | Aviso de erro "Verifique campos vazios ou zerados" quando o cálculo falha | `renderCustosResultados` | parcial | `painel.ts`/`Plano.tsx` tratam falta de números com Alert genérico |
| 2.33 | CSV de custos (insumo × ano, nominal US$ + total econômico, ponto e vírgula, BOM) | `csvCustos()` / `dl-csv` | não | v13: sem botão. v14: `csvCustos(cfg)` portada, sem botão. Notas: separador decimal sempre vírgula, valores sempre em US$ nominais, ignora a moeda escolhida |
| 2.34 | Estado salvo no caso: `custo {base, cfg, editado, conta, avancado, abertos, alts, lambda, estratos, refAlt, efeitoCaso}`, `moeda` | `app.js` salvar/dadosCaso | parcial | JSON v14 grava `custo` e `moeda` (`export/json.ts`); migração aceita `base/cfg/editado` e descarta `conta, avancado, alts, lambda, estratos…` (`migracoes.ts:314`) |
| 2.35 | Recálculo imediato dos laterais (painel, KPIs) ao editar uma premissa | `renderCustosResultados` + `atualizarLaterais` | n/a | `PlanoVivo`/`painelDe` dependem de `s.custo` e `s.moeda`: reagirão a `setCusto` sem trabalho extra |
| 2.36 | Fio de ligação "de onde vem?" de cada número do plano até a premissa | spec 01 princ. 5; spec 02 §Refinar | não | `SourceLink`/`SourceLine` existem no Prumo, sem uso; falta `Popover` |

### 1.3 Testes da v13 e cobertura na v14

| Teste v13 | Cobre | Na v14 |
|---|---|---|
| `tests/test_custos_v2.js` | compat v1, identidades contábeis, Monte Carlo, LMDI, comparar, equidade | portado: `app/tests/unit/custos.test.js`, `motor.test.js` |
| `tests/test_v10_formula.js` | fórmula, contas por ano, SSR, EN/ES/FR, HTML (`renderFormula`, abas) | portado em `formula.test.js` (sem a parte de HTML/abas, que não existe) |
| `tests/test_v9_numeros.py` | `inputNum`: formato por idioma, cursor, % como fração, troca de idioma reformata | sem equivalente (não há campo numérico formatado) |

## 2. Requisitos para a v14

Prioridade: P1 = sem isso a v14 é pior que a v13 para quem usa; P2 = importante; P3 = desejável.

| ID | Requisito (verificável pelo usuário) | Prio. | Decisão de UX |
|---|---|---|---|
| CUS-01 | Existe a tela Refinar em `#/refinar/:aba` com três abas (Premissas por ano; Ferramentas e licenças; Cenários e sensibilidade), acessível pelo botão "Refinar" do cabeçalho, pelo plano e por "de onde vem?" | P1 | adaptar: spec 02 §Refinar, "sem mockup; segue o Prumo" |
| CUS-02 | Cada KPI e cada linha de custo do plano tem "de onde vem?" que abre um popover com a premissa (valor, origem padrão/sugerido/informado/refinado), "Ajustar premissas" (vai à aba e foca o campo) e "Ir à pergunta" | P1 | adaptar: spec 01 princ. 5, spec 02 |
| CUS-03 | Dá para editar, por ano, elegíveis, adoção (%) e meses de uso, e os parâmetros da arquitetura do caso (SaaS, API+RAG ou pesos abertos) com os mesmos rótulos da v13 | P1 | — |
| CUS-04 | Dá para editar implantação e manutenção %, serviços mensais, itens por ano, pessoas (FTE por ano, função, natureza), salários por função, formação e saída, e adicionar e remover linhas (item, item de base K1, atividade, custo de saída) | P1 | — |
| CUS-05 | Dá para editar horizonte (1–10 anos), inflação, variação cambial, multiplicadores (câmbio, pessoal, preço) e contingência | P1 | — |
| CUS-06 | Os números do plano, do painel lateral e do PDF mudam ao editar uma premissa, e a etiqueta de origem do número passa a "refinado" | P1 | — |
| CUS-07 | A pessoa troca a moeda de exibição (lista com as principais no topo e as demais por nome no idioma) e todo valor da página, do painel e do PDF muda | P1 | — |
| CUS-08 | A pessoa substitui a taxa de câmbio (campo "XXX por US$ 1" com a taxa de referência como sugestão) e vê a data e a fonte da taxa; trocar de moeda zera a taxa informada | P1 | — |
| CUS-09 | Campos numéricos da calculadora aceitam decimais e separadores do idioma ("0,05", "160.000", "2,5%"), mostram o valor formatado, guardam número puro (% guardado como fração) e reformatam ao trocar de idioma | P1 | adaptar: novo componente de campo numérico sobre `lerNumero`/`fmtEntrada` |
| CUS-10 | Editar uma resposta que alimenta o custo não descarta em silêncio as edições da calculadora: aparece aviso com "Manter edições" e "Refazer a partir das respostas", e "Refazer" existe sempre na aba Premissas | P1 | adaptar (hoje `caso.ts` zera `custo.cfg`) |
| CUS-11 | Escolher a base de premissas: "Seu caso" ou Exemplo A, B, C do guia, com o texto de origem ("montadas a partir do seu caso: arquitetura, elegíveis, perfil de governança; os demais valores vêm do Exemplo X e precisam ser substituídos por cotações locais") | P2 | — |
| CUS-12 | Árvore de custos K1–K6 → subcomponente → insumo, expansível, por ano, com total, por usuário-ano e %, com "Abrir tudo / Fechar tudo", nas duas contas (econômica e orçamentária) | P2 | adaptar: dentro da aba Premissas, sem jargão "conta econômica" no Essencial (`Alert` explica) |
| CUS-13 | Visão orçamentária por exercício completa: contratos fixos, consumo variável, reserva de adoção, contingência, dotação, capital × corrente, capacidade interna (declarar), insumos cedidos (registrar), saída | P2 | — |
| CUS-14 | Cenários Esperado, Alta adoção e Estresse lado a lado (usuários, custo total, desembolso, índice unitário, K1–K6) com a descrição do que muda em cada um | P2 | — |
| CUS-15 | Gráfico de sensibilidade (tornado) por direcionador, com a faixa de cada um e o custo base | P2 | — |
| CUS-16 | Faixas mín/máx dos direcionadores editáveis (cfg.faixas) | P3 | — |
| CUS-17 | Simulação de Monte Carlo (1.500 cenários) com P10/P50/P90 do custo total e da dotação por exercício e o custo em risco, com aviso de que as faixas são convenções | P2 | — |
| CUS-18 | Painel de indicadores: 7 KPIs (custo total, dotação total, índice unitário, marginal, % capacidade interna, % em moeda estrangeira, anos para sair) e gráfico do índice por componente | P2 | adaptar: os 4 KPIs do Essencial ficam no plano; os 7 na aba Cenários |
| CUS-19 | Em "As contas de cada ano" o usuário escolhe o ano (abas Ano 0…H e Saída), vê só as linhas desse ano e expande "Outros itens (N)" | P2 | adaptar: reduz a página de custo de ~9.100 px |
| CUS-20 | Licença institucional × nominal por ano e a adoção de equilíbrio, e "a mesma função em outras arquiteturas" (Ano 2), na aba Ferramentas e licenças | P2 | — |
| CUS-21 | Aba Ferramentas e licenças: lista das ferramentas do caso (`caso.ferramentas`) com preço por usuário, e a escolha da arquitetura (3.2) hoje inalcançável no Refinar | P1 | adaptar: spec diz que `ferramentas`, `testes`, `arq` ficam em Refinar |
| CUS-22 | CSV de custos para baixar, com botão visível, valores na moeda escolhida (ou colunas US$ e moeda), separador do idioma | P2 | adaptar: spec 02 "csvCustos fica no Refinar"; a v13 nunca teve botão |
| CUS-23 | Linha "Adaptação (K3.1 + K3.2), Ano 0" com o nível escolhido junto aos KPIs de custo | P3 | — |
| CUS-24 | Comparação de alternativas (status quo/sem IA) com efeito, custo-efetividade incremental, dominância e efeito mínimo; equidade por estrato | P3 | adaptar: seção "Avançado" da aba Cenários |
| CUS-25 | Custo anual equivalente, LMDI, Laspeyres e conta econômica avançada (desconto, preço-sombra, vida útil, fechamento, cedidos) | P3 | adaptar: bloco "Avançado" recolhido |
| CUS-26 | "Reproduzir os números da versão 1 do guia" | P3 | fora (proposta): serve a teste de regressão, não ao usuário final; manter só em `?debug` ou remover |
| CUS-27 | Estado do Refinar (edições, base, conta, alternativas, λ, estratos, faixas) persiste no localStorage e no JSON exportado e reimportado; a migração aceita `conta/avancado/alts/lambda/estratos` do v13 | P2 | — |
| CUS-28 | Texto "Como ler e o que ainda depende de dados locais" visível na calculadora; mensagem de erro clara quando campos vazios/zerados quebram o cálculo | P2 | — |
| CUS-29 | Texto da fórmula/A2 "Mude as premissas na calculadora completa" aponta para a aba Refinar (link), não para algo inexistente | P2 | adaptar |
| CUS-30 | "Detalhar por ano" no passo Escolas e estudantes leva à edição da demanda por ano na aba Premissas | P2 | adaptar (link já previsto em `SchoolsGrid`/`Galeria`: `#/refinar/rede`) |
| CUS-31 | Teste de números da v13 (`test_v9_numeros.py`) portado para o novo campo numérico; teste de aba/ano da fórmula (`renderFormula`) portado para a nova tela | P2 | — |

## 3. Proposta de tela Refinar/calculadora para a v14

### 3.1 Arquitetura

- **Rota**: acrescentar em `app/src/percurso/rota.ts` `{tipo:'refinar', aba:'premissas'|'ferramentas'|'cenarios', foco?:string}`, `#/refinar/:aba[?foco=<caminho da cfg>]`; `href.refinar(aba, foco?)`.
- **Moldura**: `Shell` com `nav={false}`, `plano` (painel "Seu plano" à direita, para ver o número mudar a cada edição: `usePainel`/`painelDe` já dependem de `s.custo` e `s.moeda`).
- **Cabeçalho da tela** (comum às abas): `Segmented` Essencial/Refinar já existe; linha com moeda (CUS-07/08), base de premissas (CUS-11), botão "Refazer a partir das respostas" (CUS-10), "Baixar CSV" (CUS-22) e uma `Alert` quando `s.exemplo !== 'novo'` ou `origemKpi` é `padrao` ("estimativa com N premissas padrão").
- **KPIs fixos no topo** (`KpiTile` + `SourceTag`): custo total, dotação total, custo por usuário ativo por ano, anos para sair; eles mudam a cada edição.
- **Popover "de onde vem?"** (componente novo `Popover` em `app/src/ui/`, sobre `focusTrap.ts`): usado no plano (`Secao.tsx`, `Plano.tsx`, `KpiTile`) e nas abas. Conteúdo: `premissasDe(s)` filtrado pelo número, linha de `fxContaLinha`, origem (`SourceTag`), botões "Ajustar premissas" (`href.refinar(aba, foco)`) e "Ir à pergunta" (`href.tela(id)`).

### 3.2 Aba 1 — Premissas por ano

Mostra e edita (campos numéricos com o novo componente `NumeroField`, ver 3.4):

1. **Demanda** (`cfg.demanda`): `E` (elegíveis por ano), `adocao` (% por ano), `meses` (por ano), `s` e `i` (sessões e interações, quando a arquitetura não é SaaS). Rótulos e dicas de `renderCustos` (`anosC`). Tabela com colunas Ano 0…H (`DataTable` editável).
2. **Tempo, preços e câmbio**: `opc.H`, `opc.pi`, `opc.dep`, `mult.fx`, `mult.pessoas`, `mult.preco`, `opc.contPct`; adaptação `adaptacao.fK31/fK32` se existir.
3. **Insumos**: tabelas editáveis de `implantacao`, `mensais`, `itens` (com `Select` de subcomponente por `ARVORE`), `pessoas` (FTE por ano, função de `SAL`/`SAL_NOME`, natureza), `salarios`, `formacaoTempo`, `saida` (+ botões adicionar/remover).
4. **Resultado ao lado**: árvore K1–K6 expansível (CUS-12) com seletor Econômica/Orçamentária (`Segmented`), visão orçamentária por exercício (CUS-13) e "As contas de cada ano" com abas de ano (CUS-19).
5. **Avançado** (recolhido, `details`): conta econômica `opc.r/delta/sigmaCap/pSaida/vidaUtil/fechamento/doados`.

Funções do domínio (`app/src/domain/*.js`):

- `opcoes(cfg) → opc`; `ano(arr, t)`; `garantirOpc(cfg)`; `clone(o)` (`custos.js`, `custos_ui.js`)
- `calcular(cfg) → r`; `avaliar(r) → av` (`av.linhas, av.porK, av.porS, av.ctEco, av.saida, av.vr, av.ecoAno, av.disc, av.defl`)
- `indicadores(cfg, av)` (`icu, icuK, marginal, pCapacidade, pUSD, anosParaSair, usuariosAno, icuElegivel, custoInteracao, razaoMarginalMedio`)
- `orcamento(cfg)` e `orcamentoDeLinhas(av, cfg, avAlta)` (`fixo, var, reserva, cont, dot, capital, corrente, cap, doado, saida, contPct, anos`)
- `ARVORE`, `NOME_K`, `NOME_S`, `K_DE_S`, `SAL`, `SAL_NOME`, `MAPA_CAT`, `OPC_PADRAO`
- `explicacaoCusto(cfg)` (`.formula, .anos[], .origem, .leitura, .nota`) para as contas por ano com abas; `fxContaLinha`, `fxSelecionar`, `fxConta` se for preciso reformatar; `secaoFormula(cfg)` continua para o plano e o PDF
- Moeda e formato: `moedaInfo()`, `din(x, dec)`, `mil(x, dec)`, `grande(x)`, `pct(x, d)`, `unidMil()`, `lerNumero(s)`, `fmtEntrada(x, casas)`

### 3.3 Aba 2 — Ferramentas e licenças

- **Ferramentas do caso** (`estado.caso.ferramentas`: nome, tarefas, tipoTec, pagamento, preço): lista editável com adicionar/remover (porte de `novaFerramenta`, hoje só no legado `fluxo.js`), e as perguntas hoje inalcançáveis: `nFerramentas`, `conheceFerramentas`, `licenca`, `pagamento` da principal (usar `ControleCampo` para os de tipo simples).
- **Arquitetura** (3.2, `caso.arquitetura`, tipo `arq`, sem controle na v14): escolha SaaS / API+RAG / pesos abertos / "não sei" com a arquitetura presumida (`casoAtual(s).__arqPresumida`, `PRESET_ARQ`) via `responder` (grava `origem`).
- **Blocos por arquitetura** (de `renderCustos`): `saas.*` (preço, reajuste, `qtd`, `mesesCobr`, `fatorPreco`, nominal), `api.*` e `rag.*`, `ow.*`.
- **Resultados**: `compLicenca(cfg)` (`rows[{t,U,inst,instAtivo,nom,nomAtivo}]`, `aEq`) e `compArquiteturas(cfg)` (`rows[{nome,comp,pes,tot}]`, `resto`).

Funções: `arquitetura(cfg)`, `compLicenca(cfg)`, `compArquiteturas(cfg)`, `PRESET_ARQ`, `PRESETS`, `fatoresAdaptacao(nivel, 'A'|'B'|'C')`, `casoAtual(estado)`, `horasEstimativa(caso)`, `CAMPO_POR_ID`, `listaOpc(campo)`.

### 3.4 Aba 3 — Cenários e sensibilidade

1. **Cenários**: tabela Esperado / Alta adoção / Estresse (`cenarios(cfg)` → `{Esperado, 'Alta adoção', Estresse}` de `calcular`; `avaliar` + `orcamentoDeLinhas` + `indicadores` por cenário, como em `renderCustosResultados`), com a legenda de `cfgAltaAdocao(cfg)` e `cfgEstresse(cfg)`.
2. **Tornado**: `tornado(cfg) → {base, dot2, rows[{id,nome,min,max,lo,hi,dotLo,dotHi}]}` em SVG acessível (tabela equivalente).
3. **Faixas** editáveis: `direcionadores(cfg)` (`id, nome, min, max`) gravadas em `cfg.faixas[{id,min,max}]`.
4. **Monte Carlo**: `simular(cfg, N=1500, seed=20261003) → {ct:{p10,p50,p90}, dot:[{p10,p50,p90}], custoEmRisco[], N, seed}`; executar sob demanda (botão), fora do render (o resultado não persiste; guardar em estado local da tela com chave `JSON.stringify(cfg)`, como `SIM` na v13).
5. **Painel de 7 KPIs e gráfico do índice por componente**: `indicadores`.
6. **Avançado** (recolhido): `cae(valor, r, n)`, `lmdi(cfg0, t0, cfg1, t1)`, `laspeyres(cfgBase, cfgAtual)`, `comparar(lista)` com `cfgAlternativa` (porte de `custos_ui.js`, hoje fora do domínio), `equidade(cfg, estratos, av)`.

### 3.5 Funções e ações novas necessárias (fora de `domain/`)

| Peça | Detalhe |
|---|---|
| `store/caso.ts` | `editarCfg(caminho: string, valor: any)`: semeia `custo.cfg` com `cfgDe(s)` (clone, `__base`), grava por caminho (porte de `setPath`), `custo.editado = true`; `adicionarLinha(arr, linha)`, `removerLinha(arr, i)`; `setBase(k: 'caso'|'A'|'B'|'C')` (`custo.base`, `cfg=null`, `editado=false`); `refazerCfg()` (`custo.cfg=null`, `editado=false`); `setMoeda({cod, taxa, taxaDe})` e `setCusto(parcial)` já existem |
| `store/caso.ts` (CUS-10) | Em `efeitos`/`propagar` (linhas 97, 123, 157), quando `custo.editado` for verdadeiro, não zerar `cfg`: marcar `custo.defasado = true` e mostrar aviso com as duas saídas |
| `store/tipos.ts` | `Estado14.custo` ganha `conta`, `avancado`, `abertos`, `alts`, `lambda`, `estratos`, `refAlt`, `efeitoCaso`, `defasado`; `migracoes.ts:314` passa a preservá-los |
| `store/selectors.ts` | `cfgDe(s)` já devolve a cfg (clone); acrescentar `cenariosDe(s)`, `tornadoDe(s)`, `arvoreDe(s)` memoizados por `s.custo`, `s.caso`, `s.moeda` |
| `domain/custos_ui.js` | Levar para o domínio, como funções puras, `cfgAlternativa(a, base)` e `setPath(obj, caminho, valor)`; `csvCustos(cfg)` passar a receber a moeda (`moedaInfo`) e o separador decimal do idioma |
| `ui/` | `Popover`, `NumeroField` (decimal e %, sobre `lerNumero`/`fmtEntrada`/`LOC`), `Tabs` (abas), `SelectMoeda` (com `nomeMoeda` e `getTabelaMoedas().taxas`), gráficos SVG de tornado, composição e ICU (portar `graficoTornado2`, `graficoComposicao`, `graficoICU` com tokens Prumo) |
| `percurso/rota.ts`, `Shell.tsx` | Rota `refinar`; o `Segmented` Essencial/Refinar do cabeçalho passa a levar a `#/refinar/premissas` quando o plano tem números |
| i18n | Chaves novas para os rótulos de `renderCustos` (já traduzidos no dicionário legado em nove idiomas: reaproveitar o PT como chave) |

### 3.6 Critérios de aceite sugeridos

1. Mudar `demanda.adocao` do Ano 1 de 35% para 50% altera custo total, dotação e KPIs do painel sem recarregar, e `origemKpi` mostra "refinado".
2. Trocar para BRL mostra "R$" em plano, painel e PDF; informar taxa 5,00 muda os valores; voltar a USD limpa a taxa.
3. Para os exemplos A–D, `numerosCusto` com a cfg editada e restaurada igual ao original produz os mesmos números da v13 (regressão `numeros_v1.json`).
4. Editar uma resposta que alimenta o custo depois de editar uma premissa mostra o aviso e preserva a edição se a pessoa escolher "Manter".
5. `csvCustos` baixa um arquivo cujo total econômico por insumo soma `av.ctEco` na moeda escolhida.

## 4. As 5 lacunas mais graves

1. Não há calculadora nem rota Refinar: nenhuma premissa de custo (preços, quantidades por ano, itens, pessoas, inflação, câmbio, contingência) é editável na v14; só a lista de perguntas do capítulo, em tipos simples.
2. Sem "de onde vem?" funcional nem `Popover`: os números do plano mostram só a etiqueta de origem, sem caminho até a premissa (spec 01 princípio 5 e spec 02 não cumpridos).
3. Sem troca de moeda nem de taxa de câmbio (e sem mostrar data e fonte da taxa): o estado e o domínio existem, não há controle; quem importa um caso em BRL não volta a USD.
4. Cenários, tornado, Monte Carlo, árvore K1–K6, visão orçamentária completa, licença × nominal e outras arquiteturas portados no domínio mas sem nenhuma tela; ferramentas por preço e arquitetura (3.2) ficaram inalcançáveis em Refinar.
5. Edições da calculadora seriam perdidas em silêncio (`caso.ts` zera `custo.cfg` ao mudar uma resposta) e não há campo numérico formatado por idioma com decimais (`Controles.tsx` arredonda para inteiro); o CSV de custos nunca teve botão (v13 e v14).
