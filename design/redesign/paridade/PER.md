# PER — Percurso e perguntas: v13 (0.0.14) × v14 (0.1.0-alpha.3)

Legenda de status: `sim` = a v14 deixa responder/faz; `parcial`; `não`. "Ess" = tela do modo Essencial (`app/src/store/perguntas.ts` + `app/src/percurso/Controles.tsx`). "Refinar" = `PremissasCapitulo` (`app/src/screens/Percurso.tsx`), que só aparece na **síntese do capítulo** e só para campos de `TIPOS_SIMPLES` (`radio, chips, multi, texto, area, num, horas`) que não estão no Essencial (`camposRefinar`, `store/selectors.ts`).
Arquivos da v13 citados sem prefixo estão em `src/`. Verificado por leitura e por execução de testes descartáveis do store (Vitest, fora do repositório, nada alterado).

---

## 1. Inventário das perguntas (CAMPOS, 51 = 45 + 6 de QUESTOES_G)

Colunas: nº · id · controle v13 (`fluxo.js:controle`) · condicionais, "outro/qual", detalhes e sugestões · onde a v14 deixa responder.

### 1.1 Onde e para quem
| Nº | id | Controle v13 | Detalhes / condicionais | v14 |
|---|---|---|---|---|
| 1.1.1 | nivel | radio (cols) | "Outro" abre `nivelOutro` ("Qual nível?") | **sim** Ess (`Radio`, com outro) |
| 1.1.2 | local | texto | placeholder de exemplo | **sim** Ess |
| 1.1.3 | situacao | radio com subtexto | `padrao`: só conta depois de respondida | **sim** Ess |
| 1.1.4 | etapas | caixas por etapa (7 etapas) | — | **sim** Ess (`SchoolsGrid`) |
| 1.1.5 | grade | grade: escolas + estudantes **por ano/série** (infantil 2, fund1 5, fund2 4, médio 3) com total da etapa; "Informar só o total / Detalhar por ano" (`soTotal`) | exige escolas > 0 e estudantes > 0 em cada etapa marcada | **parcial** Ess: só escolas e total de estudantes por etapa; **detalhe por ano/série não existe em lugar nenhum** (`SchoolsGrid.detailHref` não é passado; `Etapas` grava sempre `soTotal = true`, o que apaga a soma por ano de um caso v13 importado ao editar). Telas "respondidas" mesmo com escolas/estudantes vazios |

### 1.2 Prioridade e impacto
| Nº | id | Controle v13 | Detalhes / condicionais | v14 |
|---|---|---|---|---|
| 1.2.1 | prioridades | 4 cartões (várias) + **ⓘ com 3–5 exemplos** por cartão (`opPrior`, `S.info['pr-<id>']`) | — | **parcial** Ess: cartões com nome e descrição; **ⓘ de exemplos (`p.ex`) não existe** |
| 1.2.2 | problemas | por prioridade marcada: título, "N de 10 marcados", **Marcar todos / Desmarcar todos**, caixa + texto + **objetivo** (`obj`) em letra menor; problema marcado → `<details>` **Subcategorias** (`subs`, 3–5 por problema, contador); no fim **"Outro problema"** (`problemaOutro`) (`opProblemas`) | respondida = ≥ 1 problema OU `problemaOutro` preenchido; desmarcar prioridade não apaga problemas | **parcial** Ess: grupos por prioridade, **máximo 3** problemas, contador "n de 3". **Não há**: Marcar todos (decisão: limite 3), objetivo sob cada problema, **subcategorias (`subs`)**, **"Outro problema"**. O spec (`01-modelo-de-ux.md`) manda subcategorias e "outro" para o Refinar, mas o Refinar não os implementa (campo `problemas` está no Essencial e não é `texto`) |
| 1.2.3 | olhando | texto, `sugDe: problemas` | vira título do caso | **sim** Refinar cap. 1 (só após a síntese do cap. 1) |
| 1.2.4 | problema | área, `sugDe: problemas` | modelo com lacunas `__`; texto com lacuna **não conta**; dica "Complete as lacunas…" | **parcial** Ess (`Texto` multiline). Sem dica de lacuna; "Aceitar a sugestão e continuar" confirma o texto com `__` e a tela conta como respondida (**verificado**) |
| 1.2.5 | impactos | chips, `sugDe: problemas` | "Outro" abre `impactoOutro` | **sim** Ess (`Chips` com outro; subtexto "Ex.: …" das opções não aparece) |
| 1.2.6 | resultado | área opcional, `sugDe: problemas` | objetivos com lacunas | **sim** Refinar cap. 1 (sem dica de lacuna) |
| 1.2.7 | linhaBase | radio sim/parcial/não | com Sim/Em parte: **"Para quais problemas?"** (caixas dos problemas marcados, ou texto livre `linhaBaseProblemaTxt` sem problemas) e **"Qual medida?"** (`linhaBaseMedida`, exemplo de avaliação); somem com "Não" e os dados ficam (`detalheLinhaBase`) | **parcial** Ess: só o radio. **`linhaBaseProblemas`, `linhaBaseProblemaTxt`, `linhaBaseMedida` não podem ser digitados em lugar nenhum** (nota do spec "detalhes em Refinar" não implementada). Consequência: a regra de recomendação "linha de base sem medida" dispara sempre com Sim/Em parte |
| 1.2.8 | alternativa | radio sim/ainda não | — | **sim** Ess |

### 1.3 Governança (QUESTOES_G, camada 1)
Controle v13: `seg` (Sim / Em parte / Não / Não sei; clicar de novo limpa) + detalhe opcional `respDet[id].qual` e, com "Em parte", `.falta` ("O que falta?") (`detalheResp`). v14: uma tela (`Governanca`) com `Segmented` por linha, mostra `h` mas não `ex`; `store.responderGov(id, valor, det)` aceita `det`, mas **nenhum controle o chama com `det`** (e trocar para Não/Não sei apaga `respDet`).

| Nº | id | Rótulo do "Qual?" (v13) | v14 |
|---|---|---|---|
| 1.3.1 | g-comite | Qual equipe ou instância? Quem participa? | resposta **sim** Ess; "Qual?"/"O que falta?" **não** |
| 1.3.2 | g-politica | Qual documento? (nome, data ou link) | idem |
| 1.3.3 | g-legislacao | Quais normas já foram identificadas? | idem |
| 1.3.4 | g-dados | Qual política ou norma de dados? | idem |
| 1.3.5 | g-etica | Quais orientações? Para quem? | idem |
| 1.3.6 | g-compras | Quais regras ou modelos? | idem |

### 2.0 a 2.6
| Nº | id | Controle v13 | Detalhes / condicionais / sugestões | v14 |
|---|---|---|---|---|
| 2.0 | testes | múltipla (PoC, Piloto) + "recomende" exclusiva | muda títulos de 2.3.8 (`tPoc`, `tAmbos`) | **sim** Ess (`Testes`) |
| 2.1.1 | tarefas | cartões com exemplo, `sugDe: problemas` | "Outra" abre `tarefaOutra`; etiqueta "sugerida pelo impacto" (`IMPACTO_TAREFAS`); aviso `AVISO_SEM_FERRAMENTA` no topo do 2.1 | **parcial** Ess (`Multi`, com outra, sugestão dos problemas). **Sem** etiqueta "sugerida pelo impacto" e **sem** o aviso do 2.1 (só resta a recomendação no plano) |
| 2.1.2 | titulo | texto opcional; placeholder = 1ª tarefa | — | **sim** Refinar cap. 2 (sem o placeholder) |
| 2.2.1 | usuarios | chips, `sugere` (tarefas) | — | **sim** Ess |
| 2.2.2 | afetados | chips, `sugere` | — | **sim** Ess (tela 2.2.2+2.2.3) |
| 2.2.3 | consequencias | chips, `sugere`, `padrao` | "nenhuma" **exclusiva** (limpa as outras e vice-versa) | **parcial** Ess: **sem exclusividade** ("nenhuma" + "nota" ficam juntas, **verificado**) |
| 2.2.4 | frequencia | radio, `sugere`, `padrao` | — | **sim** Refinar cap. 2 |
| 2.3.1 | nFerramentas | radio (1, 2, 3+, não sei), sugerido "Uma" pelo 2.0 | nota "uma ferramenta por vez" | **sim** Refinar cap. 2 |
| 2.3.2 | conheceFerramentas | radio sim/ainda não | "Sim" cria tantas linhas quanto 2.3.1 | **parcial** Refinar cap. 2; o "Sim" cria linhas vazias (`store/caso.ts:efeitos`) que ninguém consegue preencher |
| 2.3.3 | ferramentas | lista: por linha **nome, tarefas que cobre, tipo de tecnologia, forma de pagamento, preço US$/usuário/mês**; adicionar/remover; a 1ª é a principal (tipo e pagamento = 2.3.4 e 2.3.5) (`opFerramentas`); `se: conheceFerramentas === 'sim'` | o preço da principal e as licenças das demais entram no custo (`casos.js` §4 e §11); alimenta 3 regras (`ferramentas-*`) | **não** (tipo `ferramentas` fora de `TIPOS_SIMPLES`; spec: "Refinar", mas não há tela) |
| 2.3.4 | tipoTec | radio com "Ainda não sei" | `sugDe` de 2.3.5/2.3.6 | **sim** Ess |
| 2.3.5 | pagamento | radio, sugerido por 2.3.4 | — | **sim** Ess |
| 2.3.6 | licenca | radio, sugerida por 2.3.4 | — | **sim** Refinar cap. 2 |
| 2.3.7 | adaptacao | radio (4 níveis cumulativos) | — | **sim** Refinar cap. 2 |
| 2.3.8 | piloto | tamanho: PoC (pessoas, meses), piloto (escolas, participantes, meses) ou os dois; título/ajuda/exemplo mudam (`tPoc`, `tAmbos`) | sugerido (5% das escolas, 3–30; 5% das pessoas; 4 meses; PoC 15 pessoas, 2 meses); % do piloto sobre a rede ao vivo | **sim** Ess (`Piloto`, 3 modos). Sem o "% da rede" ao vivo e a ajuda "Por que perguntamos" usa `h/ex` genéricos |
| 2.4.1 | internet | radio com subtexto | — | **sim** Ess |
| 2.4.2 | escolasInternet | num, `se: internet === 'parcial'` | mostra escolas da rede (1.1) | **sim** Ess (campo dentro da opção "Parcialmente", "de N") |
| 2.4.3 | modeloDisp | radio com subtexto | `sugDe` de 2.4.4 | **sim** Ess |
| 2.4.4 | dispExistem | radio, sugerido ("proprio" → sim) | nota explicativa | **sim** Refinar cap. 2 (sem a nota) |
| 2.5.1 | formados | chips | — | **sim** Ess |
| 2.5.2 | formacaoTipo | chips com subtexto (4 tipos) | — | **sim** Refinar cap. 2 (subtexto descritivo dos chips não aparece) |
| 2.5.3 | formacaoFormato | radio | — | **sim** Refinar cap. 2 |
| 2.5.4 | formacaoHoras | num + "Usar uma estimativa" (valor ilustrativo marcado como sugerido) | — | **sim** Ess (`Formacao`) |
| 2.5.5 | formacaoPaga | radio | — | **sim** Refinar cap. 2 |
| 2.6.1 | suporteQuem | radio | — | **sim** Refinar cap. 2 |
| 2.6.2 | suporteNivel | radio com subtexto | — | **sim** Ess |
| 2.6.3 | acompanhamento | radio com subtexto | — | **sim** Refinar cap. 2 |

### 3.x e 4.x
| Nº | id | Controle v13 | Detalhes | v14 |
|---|---|---|---|---|
| 3.1.1 | implantacao | escolas + pessoas, sugeridos (1/3) | mostra escolas da rede (1.1); origem 4.1.1 ou etapas | **sim** Ess (`Implantacao`; sem a linha "escolas da rede segundo 1.1") |
| 3.2.1 | arquitetura | 3 arranjos com descrição (saas, api, ow) + "Ainda não sei (usar a presumida: X)" | decide o custo (KPIs_TODOS) e 4 regras `arquitetura-*`, `aberta-operacao` | **não** (tipo `arq` fora de `TIPOS_SIMPLES`; o capítulo 3 não tem premissas; `arquitetura` só vem de exemplos ou importação) |
| 4.1.1 | elegiveis | num, sugerido; botão "Usar o total de estudantes do contexto" | nota de premissa "1 professor para cada 25 estudantes" quando só professores usam | **sim** Ess; sem o botão e **sem a nota da premissa 1:25** |
| 4.1.2 | expansao | radio, `padrao` | — | **sim** Ess |
| 4.1.3 | horizonte | radio 3/5 anos, `padrao` | — | **sim** Refinar cap. 4 |

### 1.1 Perguntas que a v14 NÃO deixa responder em lugar nenhum
| # | O quê (v13) | Por quê é lacuna | Efeito |
|---|---|---|---|
| N1 | **2.3.3 lista de ferramentas** (nome, tarefas, tipo, pagamento, preço) | sem tela | preço da ferramenta principal e licenças das demais não entram no custo (estimativa fica no preço ilustrativo US$ 9/13); regras `ferramentas-cotacao/interop/sobrepostas` nunca disparam com dado real |
| N2 | **3.2.1 arquitetura** (SaaS / API+RAG / modelo aberto / presumida) | sem tela | arquitetura sempre a presumida de 2.3.4/2.3.5/2.3.6; `arquitetura-decidir/saas/api`, `aberta-operacao` sem como serem respondidas |
| N3 | **1.2.2 subcategorias** (`ctx.subs`) | sem controle | perfil do caso no plano sem subcategorias |
| N4 | **1.2.2 "Outro problema"** (`ctx.problemaOutro`) | sem controle | quem tem problema fora do catálogo não consegue descrevê-lo nem concluir a tela sem escolher um problema de catálogo; `sugestoesProblemas` não usa o texto |
| N5 | **1.2.7 detalhe da linha de base** (para quais problemas; qual medida) | sem controle | plano mostra "Medida: não informada"; recomendação "pedir a medida" sempre ativa |
| N6 | **1.3.x "Qual?" e "O que falta?"** (12 campos `respDet`) | sem controle (o store aceita, a tela não envia) | bloco B1 e recomendações "o que falta" ficam vazios |
| N7 | **1.1.5 estudantes por ano/série** | sem controle ("detalhar por ano" ausente) | só total por etapa |
| N8 | **1.2.1 ⓘ exemplos** das 4 prioridades | `p.ex` não é exibido | a pessoa não vê exemplos para escolher a prioridade |

---

## 2. Comportamentos do percurso (v13 → v14)

| # | Comportamento | v13 (arquivo:função) | v14 | Status e o que falta |
|---|---|---|---|---|
| C1 | Sugestões em cascata (problemas → 1.2.3–1.2.6 e 2.1.1; 2.1.1 → 2.2; 2.0 → 2.3.1, 2.3.8; 2.3.4 → 2.3.5/2.3.6; 2.4.3 → 2.4.4; 2.2.1 → 4.1.1; 4.1.1/etapas → 3.1.1; estimativa de horas) | `fluxo.js:padroesGerados, aplicarProblemas, aplicarSugestoes, aplicarPadroes` | `store/sugestoes.ts:aplicarSugestoes`, `store/caso.ts:propagar` (até 5 voltas), `sugerir/confirmar` | **sim** (lógica portada; origem `sugerido` com `SourceTag` "~ sugerido pelo …", `Controles.tsx:textoSugestao`) |
| C2 | Confirmar sugestão: digitar/marcar confirma; "Confirmar e continuar" | `fluxo.js:continuar('confirmar'), confirmarSugestao` | `Percurso.tsx` botão "Aceitar a sugestão e continuar" (confirma todos os campos sugeridos da tela) | **sim**. Efeito colateral: confirma também texto com lacuna `__` |
| C3 | Notas de por quê da sugestão (5% das escolas, 1 prof. para 25 estudantes, 1/3 na implantação, estimativa ilustrativa, "uma ferramenta por vez", dispositivos próprios) | `fluxo.js:notaSugerido` | só `hint` curto ("~ sugerido · cerca de 5% de N", "um terço das escolas", "estimativa ilustrativa") | **parcial**: faltam a nota da premissa 1:25 (4.1.1 e participantes do piloto), de "uma ferramenta por vez" e de dispositivos próprios |
| C4 | **Aviso "revisar"**: ao mudar as tarefas, as respostas confirmadas do 2.2 recebem a união com a sugestão nova e voltam a "sugerido"; aviso no topo do 2.1 e no 2.2 com lista de links por pergunta | `fluxo.js:aplicarSugestoes, juntarSugestao, camposRevisar, avisoRevisar` | `store/sugestoes.ts` grava só `estado.revisar` (não altera a resposta); **nenhum componente lê `revisar`** (`marcarRevisado` sem uso) | **não** (verificado: tarefas mudadas após confirmar 2.2.1/2.2.2 → `revisar = [consequencias, afetados, usuarios]`, sem aviso, sem mudar o valor). Perfil de risco pode ficar desatualizado em silêncio |
| C5 | Aviso `AVISO_SEM_FERRAMENTA` no 2.1 quando todos os problemas se resolvem sem IA | `fluxo.js:corpoPadrao` | só a recomendação "antes de contratar" no plano | **parcial** |
| C6 | Texto com lacuna `__` não conta como respondido; dica "Complete as lacunas…" | `fluxo.js:qOk, temLac, renderQ` | `store/selectors.ts:telaRespondida` não olha lacuna; plano mostra aviso discreto | **não** na tela (verificado) |
| C7 | Resposta vazia não conta (lista vazia, texto vazio, etapas sem números) | `fluxo.js:qOk` | `telaRespondida` usa a origem `informado`; marcar e desmarcar tudo deixa a tela "respondida" | **não** (verificado com `problemas = []`); afeta progresso, "Respostas que faltam" e rótulo "completo" |
| C8 | Condicionais `se` (2.3.3, 2.4.2) | `fluxo.js:visivel` | `escolasInternet` embutida no cartão "Parcialmente"; 2.3.3 inexistente | parcial (ver N1) |
| C9 | "Outro/qual" (nivel, impacto, tarefa) | `fluxo.js:campoOutro` | `Radio`, `Chips`, `Multi` | **sim** (exceto `problemaOutro`, N4) |
| C10 | Passos descidos para a implantação (`camposDescidos`, `MATRIZ_DESCE`; `<details>` "Para a implantação"; contagem 14→11→9) | `matriz.js:camposDescidos`, `fluxo.js:camposPasso, descidos` | não existe | **fora (decisão)** — spec: as 3 perguntas vão para Refinar e `afetados/consequencias` ficam no Essencial; `camposDescidos` não é usado em `app/src` fora de `domain/` |
| C11 | "Pular" / "Continuar mesmo assim" / lista "Ainda falta responder neste passo" | `fluxo.js:rodapePasso, rodapeFase` | "Pular por agora" e "Continuar" sempre liberados; pendências em `#/plano/faltam` | **sim (adaptar)** |
| C12 | Navegação: acordeão de fases, stepper, mandala (3 anéis + 7 camadas), progresso "n de m passos" por fase | `fluxo.js:renderFase, renderStepper, mandala` | `ChapterNav`/`ChapterBar` com estados feito/sugerido/pendente por pergunta e progresso por capítulo; abertura e síntese de capítulo; voltar/anterior | **fora (decisão)** para mandala/acordeão; progresso por fase **sim (adaptar)** |
| C13 | Painel lateral: progresso por fase, mandala, "Seu caso", estimativa (ou lista das 3 respostas que faltam, com links), Gerar plano, Exportar/Importar/Começar em branco (confirmação inline) | `fluxo.js:renderPainel, confLimpar` | `PlanoVivo.tsx`/`painel.ts` (KPIs com origem, recomendações, seções, gaveta no celular); exportar/importar/limpar na caixa "Caso" | **sim (adaptar)**. Faltam: confirmação ao apagar (C16) e a lista de respostas que faltam para o 1º número |
| C14 | **ⓘ das camadas** (c1, c2, c24, c3, c6, c7, c45, c37) em fases e passos, com texto de Krueger e Jackson, referência UNESDOC e **Figura 1** em miniatura + "Ampliar a figura" (visualizador modal) ; selos "Camada n" nos passos | `fluxo_dados.js:CAMADAS_INFO, REF_TCO, FIG_INFO, PASSO_INFO`, `fluxo.js:botaoInfo, notaInfo, figuraMini, abrirVisor` | nenhum ⓘ nem selo de camada no percurso; a Figura 1 só aparece como imagem estática no Apêndice do plano (`Secao.tsx`, `loading=lazy`), sem ampliar (`Dialog size="figure"` existe e não é usado) | **não** no percurso; **parcial** no plano |
| C15 | **Matriz camadas × fases**: botão no cabeçalho em qualquer tela (modal, Esc, foco), na página inicial, no ⓘ das sete camadas; geral (sem caso) e do caso (selos Respondido/Em andamento/Pendente/Orientação/N.A. e custo por célula) | `inicio.js:renderMatrizTabela, abrirMatriz, eventoInicio`, `shell.html` botão `ver-matriz`, `matriz.js:matrizCaso` | só a tabela do caso como seção do Apêndice do plano (`plano/secoes.js:secaoMatriz`, células em texto "… (Perguntas · estado · custo)"); sem modal, sem versão geral, sem acesso fora do plano | **parcial** |
| C16 | Início e caso salvo: boas-vindas, "Continuar o caso salvo" / "Começar em branco" com aviso de que apaga; "Início" no cabeçalho volta sem apagar | `inicio.js:paginaInicial`, `app.js:carregar, irInicio, continuarSalvo` | `Inicio.tsx`: alerta com "Continuar de onde parei" (primeira pendente do Essencial, não a última tela vista) e "Começar em branco" (`s.limpar()` **sem confirmação**); logo/nome do cabeçalho leva a `#/`; "Ver um plano de exemplo" e os exemplos da caixa Caso **substituem o caso atual sem aviso** | **parcial**; risco de perda de dados |
| C17 | Página inicial: título, frase, botão "Iniciar o plano de contratação", exemplo, importar; **imagem das 4 fases** (passos, camadas que alimenta, o que recebe), clique abre resumo da fase com a coluna da matriz; "Ver a matriz completa" | `inicio.js:paginaInicial, mapaFases, painelFase` | `Inicio.tsx`: promessa, 4 cartões de capítulo (nome, nº de perguntas, entrega), botão Começar, exemplo, importar, nota de 20 min | **parcial (adaptar)**: sem camadas por capítulo, sem resumo ao clicar, sem matriz |
| C18 | Exemplos A–D: "Carregar" no cabeçalho em qualquer tela; todas as respostas confirmadas; faixa "Você está vendo um caso ilustrativo do guia… Começar um caso em branco" | `app.js:carregarExemplo`, `fluxo.js:render` (alerta) , `casos.js` | `store/caso.ts:carregarExemplo` (tudo `informado`), caixa Caso lista A–D e vai para o plano; "exemplo ilustrativo" só na capa do plano | **parcial**: sem faixa de exemplo no percurso; "Ver exemplo" leva ao plano, não à pergunta 1.1 |
| C19 | **Análise por IA** da descrição (passo 1.2): botão só se `window.claude.use('sample')` existir | `app.js:analisarIA, aplicarIA, renderIA, CAP.sample` (linhas 17, 307–375, 638) | não existe | **fora (decisão)** (spec: "Fora da v14: integração com Claude para estruturar a descrição"); ver §3 para o que a v13 faz |
| C20 | Exportar: `CAP.downloads.save` no artefato, senão copiar JSON; importar por arquivo **ou colar** | `app.js:baixar, abrirImportar, copiarTexto` | `<a download>` por Blob e importar só por arquivo (`CasoDialog.tsx`); nenhuma referência a `window.claude` | **parcial**: não usa a capacidade `downloads`; sem "copiar/colar dados" (verificar em artefato) |
| C21 | Modo Refinar | (não existia; calculadora em 4.2) | chave Essencial/Refinar no cabeçalho e na caixa Caso; só altera a **síntese do capítulo** (premissas do capítulo; cap. 3 sem nenhuma); grava origem `informado` (a ação `refinar()` não é chamada) | **parcial**; a rota `#/refinar/*` do spec não existe |
| C22 | Recomendação → "Rever a resposta" | `recomendacoes.js` (`ir`) | `painel.ts:telaDoNumero`: só telas do Essencial | **parcial**: 22 das 66 regras têm `campo` fora do Essencial (licenca, adaptacao, dispExistem, formacaoPaga/Tipo, suporteQuem, acompanhamento, arquitetura, ferramentas, resultado): sem link de volta |
| C23 | Persistência e retomada | `app.js:salvar, carregar` (chave `aiedu-procurement-v9`) | `store/persistencia.ts` (chave v14; lê v13 e v8) | **sim** |
| C24 | Ajuda por pergunta: `h` e `ex` sempre visíveis | `fluxo.js:renderQ` | frase `LEAD` + "Por que perguntamos isso?" (só `h`/`ex` do primeiro campo da tela) | **sim (adaptar)**; telas compostas perdem a ajuda do 2º campo; variantes PoC/ambos (`hPoc, exPoc, hAmbos…`) e `ex` das seis 1.3.x não aparecem |

---

## 3. A "análise por IA" da v13 (para decidir se volta)
- Onde: passo 1.2, bloco "Estruturar a descrição com Claude", só se `CAP.sample` (capacidade `sample` do artefato, `window.claude.use('sample')`); fora de artefato (GitHub Pages) o bloco nunca aparece. Exige `caso.problema` preenchido.
- O que faz (`analisarIA`): envia `olhando`, título, situação atual, resultado e as listas OPC; pede JSON no idioma da interface com `problemaReformulado` (sem tecnologia, 2–4 frases), `resultadoReformulado` (1 frase mensurável), `lacunas` (3–6 perguntas) e `sugestoes` (impactos, tarefas, usuarios, afetados, consequencias, frequencia, só ids válidos). Trata erros (`rate_limited, not_granted, invalid_json, refused`) e desliga a capacidade se negada.
- Aplicar (`aplicarIA`): "Aplicar sugestões" grava problema/resultado reescritos, confirma as listas (`marcarCampo`) e dispara o gancho das tarefas; "Usar só o texto reescrito" grava apenas os textos. Aviso "Sugestões de um modelo. Revise cada resposta".

---

## 4. Requisitos para a v14

Prioridade: P1 = sem isso a v14 é pior que a v13 para quem usa; P2 = importante; P3 = desejável. "Decisão de UX" = o que o modelo de UX/spec já decidiu.

| ID | Requisito (verificável pelo usuário) | Prio | Decisão de UX |
|---|---|---|---|
| PER-01 | Depois de marcar um problema (1.2.2), a pessoa consegue marcar subcategorias dele (3–5 por problema) e vê o contador; a escolha vai para o plano (perfil) e para o JSON | P1 | spec: Refinar; implementar no Refinar do cap. 1 (ou recolhido sob o problema) |
| PER-02 | Existe "Outro problema" (texto livre); preenchido, a tela 1.2.2 conta como respondida, o texto entra em `olhando`/situação sugerida e no plano | P1 | spec: Refinar |
| PER-03 | Com 1.2.7 = Sim ou Em parte, a pessoa informa para quais problemas (caixas dos marcados, ou texto se não houver) e qual medida; com "Não" os campos somem sem apagar dados; o plano mostra a medida e a recomendação "pedir a medida" desaparece | P1 | spec: Refinar |
| PER-04 | Em cada 1.3.x com Sim ou Em parte, campo opcional "Qual?" (rótulo próprio de cada pergunta) e, com Em parte, "O que falta?"; trocar para Não/Não sei não apaga sem aviso; o texto aparece no plano, no PDF e na recomendação | P1 | spec: Refinar (12 campos) |
| PER-05 | Lista de ferramentas (2.3.3): adicionar/remover linhas; por linha nome, tarefas (das marcadas em 2.1.1), tipo de tecnologia, pagamento e preço US$/usuário/mês; a primeira é a principal e espelha 2.3.4/2.3.5; o preço informado muda a estimativa e some a recomendação de cotação; aparece quando 2.3.2 = Sim, com tantas linhas quanto 2.3.1 | P1 | spec: Refinar (hoje sem tela) |
| PER-06 | Pergunta de arquitetura (3.2.1) com os três arranjos descritos em linguagem simples e "Ainda não sei (usar a presumida: X)"; a escolha muda o custo e as regras `arquitetura-*` | P1 | spec: Refinar; o gestor não decide arquitetura, mas o técnico precisa poder |
| PER-07 | Quando uma mudança nas tarefas altera a sugestão do 2.2 (usuários, afetados, consequências, frequência) de um campo já confirmado, a pessoa vê um aviso no 2.1 e no 2.2 com a lista de perguntas a revisar (links), e a resposta confirmada não é trocada em silêncio; o aviso some ao confirmar ou ajustar | P1 | adaptar: `estado.revisar` já é gravado; faltam UI e a ação "aceitar a união / manter a minha" |
| PER-08 | Uma tela só conta como respondida com resposta real: lista vazia, texto vazio e etapas marcadas sem escolas/estudantes não contam; texto com lacuna `__` não conta e mostra "Complete as lacunas…" (inclui "Aceitar a sugestão") | P1 (vazios) / P2 (lacuna) | — |
| PER-09 | "Começar em branco", "Ver um plano de exemplo" e os exemplos da caixa Caso, quando há caso com respostas, pedem confirmação dizendo que apagam o caso atual e oferecem exportá-lo antes | P1 | adaptar `confLimpar` |
| PER-10 | Matriz camadas × fases (7 × 4) acessível por botão no cabeçalho em qualquer tela (modal: Esc fecha, foco devolvido, crédito de Krueger e Jackson), pela página inicial e pelo ⓘ das camadas; geral sem caso, com selos de estado e custo por célula quando há caso | P1 | spec mantém a matriz no plano/apêndice; falta o acesso fora do plano (a v13 0.0.14 foi corrigida justamente para ter o botão no cabeçalho, `test_v0014.py`) |
| PER-11 | Cada cartão de prioridade (1.2.1) tem ⓘ que abre/fecha 3–5 exemplos (`PRIORIDADES[].ex`) sem mudar a seleção, por teclado e a 400 px | P1 | — (pedido original do usuário, RQ-07) |
| PER-12 | A página inicial mostra, por capítulo/fase, os passos, as camadas que alimenta e o que a pessoa recebe; clicar abre o resumo com a coluna da matriz; link "Ver a matriz completa" | P2 | adaptar: os 4 capítulos substituem as 4 fases; manter a imagem explicativa (RQ-01) |
| PER-13 | ⓘ das camadas no percurso (nome curto + nome completo, texto de Krueger e Jackson, referência UNESDOC) e Figura 1 com "Ampliar a figura" em diálogo; no Apêndice do plano a Figura 1 também amplia (`Dialog size="figure"`) | P2 | spec: "nome completo no ⓘ e no plano"; nada implementado no percurso |
| PER-14 | Detalhar estudantes por ano/série (1.1.5) com total da etapa calculado e "informar só o total"; não sobrescrever a soma por ano de um caso importado ao editar | P2 | spec: link "detalhar por ano" (Refinar) |
| PER-15 | Limite de 3 problemas (1.2.2): confirmar com o autor, porque o pedido original era "marcar todos" e a v13 aceitava até 10 por prioridade; se mantido, mostrar o motivo e permitir "Marcar todos" no Refinar | P2 | decisão de UX (limite 3) conflita com RQ-08 |
| PER-16 | No 2.1.1 aparece o aviso quando todos os problemas marcados se resolvem sem ferramenta de IA | P2 | — |
| PER-17 | Faixa "Você está vendo um caso ilustrativo… Começar em branco" em todas as telas do percurso quando `exemplo` é A–D; "Ver um exemplo" abre no 1.1 (percurso) além do plano | P2 | adaptar |
| PER-18 | O modo Refinar é compreensível: ao ligá-lo, as premissas do capítulo aparecem também nas telas de pergunta ou há link claro; os valores gravados ficam com origem `refinado` (usar `refinar()`); capítulo 3 deixa de ficar sem nada (arquitetura, PER-06) | P2 | spec: rota `#/refinar/:aba` não existe |
| PER-19 | Toda recomendação com `campo` fora do Essencial (22 regras) leva, em "Rever a resposta", à pergunta no Refinar do capítulo certo | P2 | — |
| PER-20 | As sugestões declaram suas premissas ilustrativas: "1 professor para cada 25 estudantes" (4.1.1 e participantes do piloto), "uma ferramenta por vez", "dispositivos próprios não exigem compra" | P2 | spec: declarar premissas na interface |
| PER-21 | 2.2.3: "Usar como apoio… sem decidir sobre pessoas" (`nenhuma`) é exclusiva das demais opções | P2 | — |
| PER-22 | Exportar usa a capacidade `downloads` quando existe (artefato) e, sem ela, oferece copiar os dados; importar aceita arquivo e dados colados | P2 | verificar no ambiente de artefato |
| PER-23 | "Continuar de onde parei" volta à última pergunta vista (`s.capitulo`), não à primeira pendente | P3 | — |
| PER-24 | Subtexto das opções de chips (impactos, tipos de formação) e `ex` das 1.3.x e das telas compostas aparecem na ajuda; variantes de teste (PoC/ambos) usam `hPoc/exPoc/hAmbos/exAmbos` | P3 | — |
| PER-25 | Etiqueta "sugerida pelo impacto" nas tarefas do 2.1.1 (`IMPACTO_TAREFAS`); objetivo (`obj`) em letra menor sob cada problema (1.2.2) | P3 | — |
| PER-26 | % do piloto sobre a rede ao vivo (2.3.8); escolas da rede no 3.1.1 e no 2.4.2 (já há "de N" no 2.4.2) | P3 | — |
| PER-27 | Painel/gaveta lista, com links, as respostas que faltam para o primeiro número (hoje só texto) | P3 | — |
| PER-28 | 1.3.x: clicar de novo na resposta marcada a limpa | P3 | — |
| PER-29 | Título do caso editável na capa do plano (spec: "editável na capa"); hoje só em Refinar (1.2.3 e 2.1.2) | P3 | — |
| PER-30 | Análise por IA da descrição: se voltar, só com capacidade `sample`, revisão antes de aplicar, nunca confirmar sugestões sozinha | P3 | fora (decisão): "Fora da v14" |
| PER-31 | Mandala, acordeão de fases, stepper, "Continuar mesmo assim", `camposDescidos`/`<details>` "Para a implantação" | — | fora (decisão) |

---

## 5. Verificações por execução (testes descartáveis, repositório intacto)
- `responder('problemas', [])` → `telaRespondida(problemas) = true`.
- `confirmar('problema')` com o modelo sugerido ("Quem é afetado: __…") → tela respondida.
- `responder('consequencias', ['nenhuma','nota'])` → fica `["nenhuma","nota"]`.
- tarefas mudadas após confirmar usuários/afetados → `revisar = ["consequencias","afetados","usuarios"]`, valores inalterados, sem componente que mostre.
- 22 de 66 `REGRAS_REC` têm `campo` fora de `CAMPOS_ESSENCIAIS`.

## 6. As cinco lacunas mais graves
1. Quatro respostas que mudam custo e plano não têm tela: lista de ferramentas com preço (2.3.3), arquitetura (3.2.1), detalhe da linha de base (1.2.7) e "Qual?/O que falta?" da governança (1.3.x). O spec mandou para o Refinar, mas o Refinar só renderiza campos simples.
2. "Outro problema" e subcategorias do 1.2.2 (e o ⓘ de exemplos das prioridades) sumiram, embora tenham sido pedidos pelo próprio usuário; o limite de 3 problemas conflita com o "marcar todos" pedido.
3. O aviso "revisar" não existe: a v14 grava `revisar` e ninguém o mostra; mudar as tarefas deixa o perfil de risco do 2.2 desatualizado em silêncio.
4. Completude falsa: seleção vazia, etapas sem números e texto com lacunas `__` contam como respondidos, o que infla o progresso e esconde pendências do plano.
5. Perda de dados e de orientação: "Começar em branco" e exemplos apagam o caso sem confirmação, e a matriz camadas × fases, a Figura 1 ampliável e os ⓘ das camadas não são alcançáveis fora do Apêndice do plano.
