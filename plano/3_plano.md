# Plano da versão 9 do AI in Education Procurement Tool

Autor: agente planejador. Entradas lidas: `contexto.md`, `0_feedback_v9.md`, `1_interpretacao.md`, `2_tco_unesco.md`, todo o código em `src/`, os testes (`tests/test_custos_v2.js`, `test_*.py`) e os capítulos 11, 12 e 13–16 do guia (`cap11_tco.tex`, `cap12_orcamento.tex`, `parte5.tex`).

Material auxiliar já gerado (não é fonte; só apoio aos testes):
- `plano/navegador_v8.html`: cópia do build da v8 antes de qualquer mudança.
- `plano/fixtures_v8/caso_v8_{A,B,C,D}.json`, `caso_v8_branco_parcial.json` (exportações `dadosCaso()` da v8) e `localStorage_v8_branco_parcial.json` (estado `S` salvo na chave `navegador-ia-educacao-v4`). O pacote P4 copia esses arquivos para `tests/fixtures/` e os usa no teste de migração.

Regra geral para quem implementa: tudo o que este plano escreve entre aspas em português é o texto final (chave de i18n). Onde houver "EN:", é a tradução de referência para o inglês (idioma inicial da interface); ES e FR seguem o glossário da seção F.1.

---

## 0. Decisões principais

1. Três fases, não quatro: **1 Contexto**, **2 Prova de conceito ou piloto**, **3 Custo do ciclo de vida**. As fases 3 (Implantação) e 4 (Sustentabilidade e expansão) da v8 viram uma só fase de custo; as perguntas de prontidão `i-*` e `s-*` vão para o plano final (justificativa em A.2).
2. A fase 2 abre com a pergunta **2.0 "Você vai começar por uma prova de conceito ou por um piloto?"** (PoC, piloto, "Não sei, recomende para mim") e tem três passos que reproduzem a camada 2 do TCO: **2.1 Aplicações**, **2.2 Experiência de uso**, **2.3 Adoção** (setup da PoC ou do piloto, com as perguntas de custo).
3. Durante o percurso só há perguntas sobre a situação e as escolhas do caso. Somem: cartões de resultado por fase, pílulas de veredito, alertas, perfil de risco, blocos de pontos de decisão, regras do piloto, capacidade mínima, funções não terceirizáveis, autonomia, dados, vulneráveis, idiomas, verificabilidade, contestação, reversibilidade, efeitos cumulativos, arquitetura como pergunta direta.
4. Autonomia, dados, classes técnicas, reversibilidade, efeito cumulativo, verificabilidade, contestação e arquitetura passam a ser **derivados** das tarefas educacionais escolhidas e das respostas de adoção (`casoEfetivo()`), para que `perfilFinal`, `alertas`, `formaSupervisao` e `cfgDoCaso` continuem funcionando.
5. Um único botão **"Gerar plano de contratação"** (EN "Generate procurement plan") monta a página final e o PDF, com dois blocos separados e nesta ordem: **A. Custo e compra** e **B. Política e governança**.
6. O nível de adaptação ao contexto (2.3.4) altera K3.1 e K3.2 por multiplicadores ilustrativos no motor (`cfg.adaptacao`), neutros por padrão; os exemplos do guia (presets A–C) continuam reproduzindo os números publicados.
7. Quatro pacotes de implementação paralelos com propriedade de arquivos exclusiva (seção G).

---

## A. Arquitetura de informação

### A.1 Fases e passos

Ids internos novos entre parênteses. Nenhum nome de seção usa gerúndio (nem em EN: por isso o passo 3.2 se chama "Fonte de recursos", e não "Funding").

| Fase (id) | Passo (id) | Nome PT | Nome EN | Propósito | Camada(s) do TCO | Apoio no documento de Krueger e Jackson (2026) |
|---|---|---|---|---|---|---|
| 1 Contexto (`contexto`) | 1.1 (`1a`) | Onde e para quem | Where and for whom | Nível, lugar, situação, etapas, escolas e estudantes por ano ou série (base da demanda) | Nenhuma diretamente (demanda: guia cap. 11, passo 1) | — |
| | 1.2 (`1b`) | Problema e impacto | Problem and impact | Tipo de problema, componentes, descrição, impacto desejado, linha de base, alternativa sem IA | Nenhuma | — |
| | 1.3 (`1c`) | Governança de IA na educação | AI governance in education | Seis perguntas sobre a situação da rede | 1 Governança, políticas e planejamento do ciclo de vida | p. 11 (camada 1); p. 12 (sugestão 2, áreas da governança); p. 3 (proteção de dados); p. 2–3 (uso aceitável, integridade, orientações por idade) |
| 2 Prova de conceito ou piloto (`piloto`) | 2.0 (`20`) | Prova de conceito ou piloto | Proof of concept or pilot | Escolha do instrumento de aprendizagem | 2 (adoção) | O documento não define PoC nem piloto (2_tco §2); a definição vem do guia, cap. 14, tabela "Instrumentos de aprendizagem". "Low-cost pilots" (p. 9) |
| | 2.1 (`2a`) | Aplicações | Applications | O que se quer que a IA faça, em tarefas educacionais | 2 Aplicações de IA, experiência de uso e adoção | p. 11 (camada 2: "instructional support, productivity tools, automation, and day-to-day workflows") |
| | 2.2 (`2b`) | Experiência de uso | User experience | Quem usa, quem é afetado, o que se faz com a resposta, frequência | 2 | p. 11 (camada 2: "user experiences most visible to educators, students, and administrators") |
| | 2.3 (`2c`) | Adoção | Adoption | Setup da PoC ou do piloto: tipo de tecnologia, pagamento, licença, adaptação, dispositivos e internet, tamanho e duração | 2, com premissas das camadas 3 e 4 | p. 11 (camada 2: "subscriptions"); p. 6 ("licensing structures", custos por uso); p. 7–8 e p. 13, pergunta 2 (gratuidade e custos adiados); p. 7 e p. 11 (camada 3, condições de base); p. 8 e p. 11 (camada 4, integração) |
| 3 Custo do ciclo de vida (`custo`) | 3.1 (`3a`) | Escala e horizonte | Scale and time horizon | Quantas pessoas usariam na rede, ritmo de expansão, anos de estimativa | 3 a 7 (dimensionamento) | p. 6 ("As AI use scales, these recurring costs should be monitored…"); p. 9 (dependência que cresce com a expansão) |
| | 3.2 (`3b`) | Fonte de recursos | Source of funds | Quem paga depois do teste; se há fonte de recursos | 1 e 7 (planejamento do ciclo de vida, sustentabilidade) | p. 9 ("pilot funding or short-term implementation budgets"); p. 12 (sugestão 6: pilotos que não escalam) |
| | 3.3 (`3c`) | Estimativa de custo | Cost estimate | Estimativa ilustrativa por camada e por exercício; calculadora completa | 1 a 7 | p. 11 (Figura 1); p. 2 e p. 8 (custo depois da aquisição) |
| Final | — | Plano de contratação | Procurement plan | Documento exportável gerado por um botão | 1 a 7 | p. 10 ("planning and assessment tool… anticipate costs that would otherwise remain hidden during procurement") |

Cor por fase: f1, f2, f3 (azul claro → escuro, tokens já existentes). O token `--f4` deixa de ser usado no percurso.

Texto de abertura de cada fase (aparece no corpo da fase, acima dos passos, substituindo os chips "Camadas nesta fase"):
- Fase 1: "Descreva a rede, o problema e a governança que já existe. Nada aqui é avaliado agora: o diagnóstico aparece só no plano de contratação."
- Fase 2: "Esta fase corresponde à camada 2 do custo total ⓘ: o que a IA vai fazer (2.1 Aplicações), quem a usa e como (2.2 Experiência de uso) e o que é preciso para que o uso aconteça de fato, incluindo licenças e pagamento (2.3 Adoção)."
- Fase 3: "Quanto o caso custa depois do teste, ao longo dos anos de uso, distribuído pelas sete camadas do custo total ⓘ. Os valores são ilustrativos."

### A.2 O que acontece com as fases 3 (Implantação) e 4 (Sustentabilidade e expansão)

Decisão: **fundir as duas numa fase única, "Custo do ciclo de vida"**, só com perguntas de custo e compra (3.1 e 3.2) e a estimativa (3.3). Todas as perguntas `i-*` e `s-*`, as listas de verificação (passo 3.2 da v8) e o ponto de decisão 9 vão para o plano de contratação (blocos A5–A6 e B6–B9).

Justificativa:
- Pelo critério do próprio usuário ("isso é recomendação e não pergunta", itens 36, 39 e 42 da interpretação), as 24 perguntas `i-*` e as 13 `s-*` são checagens de prontidão sobre o que deveria estar pronto; o que delas sobra como pergunta sobre a situação é só custo (escala, horizonte, fonte de recursos, quem paga).
- O foco pedido é "custo e compra" e "separar custo de policy". Uma fase só de custo, depois do teste, cumpre isso sem duplicar perguntas.
- O documento de Krueger e Jackson não define estágios de implantação e expansão (2_tco §2); o que ele afirma é que os custos atravessam todo o ciclo de vida e que o custo visível é o começo da obrigação (p. 2, p. 3–4, p. 8). Uma única fase com horizonte de anos representa isso melhor do que duas fases de checagem.
- Menos fases e menos passos melhoram a experiência de uso (o percurso passa de 4 fases e 15 passos para 3 fases, 9 passos e a pergunta 2.0).
- O mecanismo de "pular fase" (`PULAVEIS`, `S.pular`, botões "Não avaliar esta fase agora", "Pular as fases 3 e 4") é removido: o plano pode ser gerado a qualquer momento e lista o que falta.

### A.3 Correspondência entre a árvore de custos (K) e as sete camadas

Convenção editorial desta ferramenta (o documento não quantifica nem distribui custos por camada; 2_tco §1.6 e §9.1). Constante nova `CAMADA_DE_S` em `src/custos.js`:

| Subcomponente | Camada | Subcomponente | Camada |
|---|---|---|---|
| K1.1 Conectividade incremental | 3 | K4.1 Gestão, operação técnica e curadoria | 7 |
| K1.2 Dispositivos | 3 | K4.2 Suporte | 7 |
| K1.3 Identidade e acesso | 5 | K4.3 Programa de formação | 6 |
| K2.1 Licenças | 2 | K4.4 Tempo de formação dos usuários | 6 |
| K2.2 Consumo de modelos | 2 | K5.1 Gestão contratual | 7 |
| K2.3 Computação própria | 3 | K5.2 Privacidade e segurança | 5 |
| K2.4 Dados e RAG | 4 | K5.3 Supervisão e revisão de saídas | 7 |
| K2.5 Hospedagem e observabilidade | 3 | K5.4 Auditoria e testes adversariais | 5 |
| K3.1 Integração e desenvolvimento | 4 | K5.5 Avaliação de resultados | 7 |
| K3.2 Conteúdo e configuração iniciais | 2 | K6.1 Manutenção evolutiva | 7 |
| K3.3 Conformidade inicial | 1 | K6.2 Reavaliação por mudança material | 7 |
| K3.4 Testes de aceitação | 7 | K6.3 Transição e saída | 7 |

Apoio para os casos não óbvios: K1.3 e K5.2/K5.4 → camada 5 ("identity management, monitoring, third-party risk management, privacy protections, compliance", p. 11); K3.3 → camada 1 ("legal review", p. 11); K4.1, K5.1, K5.3, K5.5, K6.1 → camada 7 ("technical support, monitoring, vendor management, maintenance, operational oversight, evaluation", p. 11). A saída (K6.3) não consta no documento; fica na camada 7 por convenção e o plano diz isso. Nota obrigatória no plano e no ⓘ do passo 3.3: "A correspondência entre os componentes de custo da ferramenta (K1 a K6) e as sete camadas é uma convenção desta ferramenta."

---

## B. Perguntas e campos, passo a passo

### B.0 Convenções

- **Numeração**: `fase.passo.n` (1.1.1, 1.1.2…). A pergunta de abertura da fase 2 é numerada **2.0**. Campos opcionais levam o número e a etiqueta "opcional". O número fica num `<span class="qn">` próprio (só dígitos e pontos, para o `tr()` não tocar).
- **Tipos**: `radio` (uma opção), `chips` (várias), `seg` (Sim / Em parte / Não / Não sei, só na governança), `texto`, `area` (textarea), `num` (número formatado, seção D.3), `grade` (tabela de números por etapa e ano).
- **Respondido**: segue a regra atual `respondido(campo)` (num caso em branco, um valor padrão só conta depois que a pessoa responde, via `S.respC`). Campos pré-marcados por sugestão (2.2) aparecem marcados com a etiqueta "sugerido pela tarefa" e só contam como respondidos quando a pessoa altera o campo ou clica em "Continuar" no passo 2.2 (que grava `respC` dos quatro campos).
- **Exemplo**: cada pergunta tem uma linha "Exemplo: …" abaixo da dica, no mesmo tamanho da dica atual (`.hint`), nunca menor.
- **Formato da pergunta**: "Você tem…?", "Sua rede tem…?", "Você já…?" (EN "Do you have…?", "Does your network have…?", "Did you…?").
- Opções com id: o id é o valor gravado; o texto é a chave de i18n.

### B.1 Passo 1.1 Onde e para quem (`1a`)

| N | Campo (onde grava) | Pergunta (PT) / EN | Dica | Exemplo | Tipo e opções |
|---|---|---|---|---|---|
| 1.1.1 | `ctx.nivel` (+ `ctx.nivelOutro`) | "Em que nível administrativo a decisão será tomada?" / "At what administrative level will the decision be made?" | "O nível que decide e paga." | "Exemplo: secretaria estadual de educação." | radio `NIVEIS_ADM` (sem mudança: pais, estado, municipio, distrito, rede, outro). Se `outro`: texto "Qual nível?" |
| 1.1.2 | `ctx.local` | "Qual é o nome do lugar ou da rede?" / "What is the name of the place or school network?" | — | placeholder "Ex.: Rede estadual do Rio Grande do Sul, distrito escolar 3" | texto |
| 1.1.3 | `caso.situacao` | "Em que ponto você está?" / "Where are you now?" | "Isso ajusta o plano de contratação." | — | radio `OPC.situacao`, agora só: `nova` "Iniciar uma nova iniciativa" (Ainda não há solução escolhida nem fornecedor.); `proposta` "Avaliar uma proposta já recebida" (Um fornecedor, parceiro ou área interna já apresentou uma solução.); `renovar` "Renovar ou ampliar um contrato" (A solução está em uso e o contrato vence ou vai crescer.); `orcamento` "Estimar o orçamento" (É preciso saber quanto custará e quanto pedir por exercício.). Saem `testar` (agora é a pergunta 2.0) e `incidente` (fora do foco de compra) |
| 1.1.4 | `ctx.etapas[id].on` | "Quais etapas de ensino serão atendidas?" / "Which levels of education will be served?" | "Marque uma ou mais." | — | chips de `ETAPAS_ENS` (sem mudança) |
| 1.1.5 | `ctx.etapas[id].escolas`, `.anos[i]`, `.alunos`, `.soTotal` | "Quantas escolas e quantos estudantes há em cada etapa, por ano ou série?" / "How many schools and students are there in each level, by grade?" | "Informe os estudantes de cada ano ou série; o total da etapa é calculado." | "Exemplo: 6º ano 40.000; 7º ano 38.000." | `grade` (seção D.4). Respondido quando toda etapa marcada tem escolas > 0 e estudantes > 0 |

### B.2 Passo 1.2 Problema e impacto (`1b`)

| N | Campo | Pergunta / EN | Dica | Exemplo | Tipo e opções |
|---|---|---|---|---|---|
| 1.2.1 | `ctx.dominio` | "Que tipo de problema educacional você quer resolver?" / "What kind of educational problem do you want to solve?" | — | (cada cartão já traz exemplos) | cartões `DOMINIOS`. **Destaque invertido**: título em negrito = lema ("Aprender a conhecer e a fazer"; "Aprender a pertencer e a conviver"; "Aprender a ser"); rótulo secundário = nome ("Qualificação"…), na mesma escala de `.hint`, nunca menor. Socialização e subjetivação continuam "em breve" |
| 1.2.2 | `ctx.comps`, `ctx.compOutro` | "Quais componentes estão em jogo?" / "Which subjects or areas are involved?" | — | — | chips dos componentes do domínio (sem mudança), "Outro componente" abre texto "Qual componente?" |
| 1.2.3 | `ctx.olhando` | "Como a equipe descreve o problema, em poucas palavras?" / "How does your team describe the problem, in a few words?" | "Vira o título do caso se você não der outro nome." | placeholder "Ex.: estudantes chegam ao 9º ano abaixo do esperado em matemática" | texto |
| 1.2.4 | `caso.problema` | "Descreva a situação atual sem citar tecnologia" / "Describe the current situation without mentioning technology" | "Situação atual, quem é afetado e o que se sabe sobre as causas. Se, ao retirar a palavra "IA", o texto deixa de explicar o problema, reescreva." | "Exemplo: nas escolas da zona rural, metade dos estudantes do 5º ano não lê com fluência; as turmas são multisseriadas e não há reforço no contraturno." | área |
| 1.2.5 | `caso.impactos`, `caso.impactoOutro` | "Que impacto você quer alcançar?" / "What impact do you want to achieve?" | "Marque um ou mais. O impacto orienta as tarefas sugeridas no passo 2.1." | — | chips `OPC.impactos` (lista abaixo). "Outro" abre texto "Qual impacto?" |
| 1.2.6 (opcional) | `caso.resultado` | "Se quiser, detalhe o resultado esperado e como vai medi-lo" / "If you wish, detail the expected result and how you will measure it" | — | "Exemplo: reduzir de 50% para 35% os estudantes abaixo do nível adequado em leitura em dois anos." | área |
| 1.2.7 | `caso.linhaBase` | "Você tem uma medida atual do problema (linha de base)?" / "Do you have a current measure of the problem (baseline)?" | — | "Exemplo: resultados da avaliação de leitura do ano passado, por escola." | radio `OPC.linhaBase`: `sim` "Sim, medida"; `parcial` "Em parte ou estimada"; `nao` "Não" |
| 1.2.8 | `caso.alternativa` | "Você já comparou ao menos uma alternativa sem IA?" / "Did you compare at least one option without AI?" | — | "Exemplo: reforço escolar no contraturno, redesenho do processo ou um software convencional de exercícios." | radio `OPC.simNao`: `sim` "Sim"; `nao` "Ainda não" |

`OPC.impactos` (novo, `framework.js`), com tarefas sugeridas (`IMPACTO_TAREFAS`, usadas só para marcar "sugerida pelo impacto" no 2.1, sem pré-marcar):

| id | Texto | Subtexto | Tarefas sugeridas |
|---|---|---|---|
| `aprendizagem` | Melhorar a aprendizagem dos estudantes | Ex.: proficiência em leitura ou em matemática | tutoria, feedback_redacao, materiais |
| `desigualdade` | Reduzir diferenças de aprendizagem entre escolas ou grupos | — | tutoria, alerta_precoce, materiais |
| `tempo_docente` | Liberar tempo dos professores para os estudantes | — | planos_aula, materiais, correcao |
| `feedback` | Dar retorno mais rápido aos estudantes | — | feedback_redacao, correcao |
| `permanencia` | Reduzir o abandono e melhorar a permanência | — | alerta_precoce |
| `inclusao` | Ampliar o acesso e a inclusão | Ex.: outros idiomas, deficiência | acessibilidade, materiais |
| `gestao` | Responder mais rápido às escolas e às famílias | — | duvidas, rotinas |
| `outro` | Outro | Descreva no campo abaixo | — |

A caixa "Estruturar a descrição com Claude" (`CAP.sample`) continua no fim do passo 1.2; o pacote P4 troca o prompt para sugerir `impactos`, `tarefas`, `usuarios`, `afetados`, `consequencias`, `frequencia` (nunca autonomia, dados ou arquitetura).

Removido do 1.2: `populacao` ("Quem é afetado").

### B.3 Passo 1.3 Governança de IA na educação (`1c`)

Título do passo: "Governança de IA na educação" seguido do selo "Camada 1 do custo total" e do botão ⓘ (D.5).
Texto de abertura (substitui o atual): "A governança é a camada que atravessa todas as fases: quem decide, com que regras e com que recursos. Responda sobre a rede como um todo, e não só sobre este caso." (a frase sobre perguntas essenciais que impedem avançar é removida).

Respostas (`RESP_G`): `sim` "Sim"; `parcial` "Em parte"; `nao` "Não"; `nao_sei` "Não sei". Sem etiqueta "essencial" no percurso. Ids mantidos; `g-equipe` é fundida em `g-comite`; `g-orcamento` e `g-avaliacao` saem do passo.

| N | Id | Pergunta PT | EN | Dica | Exemplo |
|---|---|---|---|---|---|
| 1.3.1 | `g-comite` | "Sua rede tem uma equipe ou instância responsável por IA na educação, que reúna várias áreas?" | "Does your network have a team or body responsible for AI in education that brings several areas together?" | "Uma equipe nomeada que decide e acompanha o uso de IA, com tempo dedicado." | "Exemplo: um comitê com pedagogia, tecnologia, jurídico, compras, proteção de dados e direção, que se reúne todo mês e tem uma pessoa responsável." |
| 1.3.2 | `g-politica` | "Você tem uma política ou estratégia de IA na educação?" | "Do you have an AI in education policy or strategy?" | "Documento aprovado que diz para que a IA pode ser usada, por quem e com que responsabilidades." | "Exemplo: uma resolução da secretaria que lista os usos permitidos para professores e estudantes e quem responde por eles." |
| 1.3.3 | `g-legislacao` | "Você já identificou as leis que se aplicam ao uso de IA nas escolas?" | "Did you identify the laws that apply to AI use in schools?" | "Proteção de dados, regras sobre IA, direitos de crianças e adolescentes e compras públicas." | "Exemplo: uma nota da assessoria jurídica que lista as leis aplicáveis e o que cada uma exige." |
| 1.3.4 | `g-dados` | "Sua rede tem uma política de dados educacionais?" | "Does your network have an education data policy?" | "Quem pode acessar, compartilhar, guardar e excluir dados de estudantes e servidores." | "Exemplo: regras escritas que dizem por quanto tempo notas e frequência são guardadas e com quem podem ser compartilhadas." |
| 1.3.5 | `g-etica` | "Você já publicou orientações de uso responsável de IA para professores, estudantes e gestores?" | "Did you publish guidance on responsible AI use for teachers, students and school leaders?" | "O que é permitido, o que é proibido e o que fazer em caso de dúvida." | "Exemplo: um guia curto para professores sobre uso de IA em tarefas e avaliações, com regras de integridade acadêmica." |
| 1.3.6 | `g-compras` | "Sua rede tem regras ou orientações para comprar tecnologia com IA?" | "Does your network have rules or guidance for buying AI technology?" | "Custo do ciclo de vida, análise do fornecedor e cláusulas de dados e de saída." | "Exemplo: um modelo de termo de referência que exige o custo de uso por vários anos e a devolução dos dados ao final do contrato." |

Removido do 1.3: a pergunta de funções não terceirizáveis (`capacidade`), que vira recomendação fixa (C, B2).

### B.4 Abertura da fase 2: pergunta 2.0 (`20`)

Bloco sempre visível no topo do corpo da fase 2, antes de 2.1, com o mesmo visual de um passo aberto e rodapé "Continuar para 2.1".

| N | Campo | Pergunta / EN | Dica | Tipo e opções |
|---|---|---|---|---|
| 2.0 | `caso.teste` | "Você vai começar por uma prova de conceito ou por um piloto?" / "Will you start with a proof of concept or a pilot?" | "As duas servem para aprender antes de comprar. A diferença é com quem e em que condições se testa." | radio `OPC.teste`: `poc` "Prova de conceito" (sub: "Testa se a solução funciona tecnicamente, com a equipe e dados de teste, sem usuários reais."); `piloto` "Piloto" (sub: "Testa o uso com professores ou estudantes reais, em poucas escolas e por tempo limitado."); `recomendar` "Não sei, recomende para mim" (sub: "Responda às próximas perguntas como se fosse um piloto. O plano de contratação recomenda prova de conceito ou piloto e explica por quê.") |

Fonte das descrições: guia, cap. 14, tabela "Instrumentos de aprendizagem" (`APRENDIZAGEM` em `resumo.js`). A escolha muda textos do 2.3 (seção B.7) e as regras do bloco B3 do plano.

### B.5 Passo 2.1 Aplicações (`2a`)

Título com selo "Camada 2" e ⓘ. Texto de abertura: "Descreva o que você quer que a IA faça no dia a dia da escola ou da rede, e não o produto."

| N | Campo | Pergunta / EN | Dica | Exemplo | Tipo |
|---|---|---|---|---|---|
| 2.1.1 | `caso.tarefas`, `caso.tarefaOutra` | "O que você quer que a IA faça?" / "What do you want the AI to do?" | "Escolha uma ou mais tarefas. Cada tarefa já sugere quem usa e quem é afetado no passo 2.2." | (cada opção tem o seu exemplo, abaixo) | chips `OPC.tarefas` com subtexto; "Outra" abre texto "Qual tarefa?". Tarefas ligadas ao impacto escolhido em 1.2.5 recebem a etiqueta "sugerida pelo impacto" (sem pré-marcar) |
| 2.1.2 (opcional) | `caso.titulo` | "Como você vai chamar esta aplicação?" / "What will you call this application?" | "Aparece no plano de contratação." | placeholder = texto da primeira tarefa marcada (ex.: "Preparar planos de aula") | texto |

Tabela `TAREFAS` (nova, `framework.js`; `OPC.tarefas` é a projeção `[id, texto, exemplo]`). Colunas de derivação usadas por `perfisSugeridos()` e `casoEfetivo()` (B.6):

| id | Texto PT | Exemplo (subtexto) | classes (OPC.classes) | autonomia | usuarios sugeridos | afetados sugeridos | consequencias | dados da tarefa | reversib. | cumulativo | frequência |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `planos_aula` | Preparar planos de aula | Ex.: uma sequência de aulas de frações para o 5º ano | geracao | 2 | professores | professores, criancas | nenhuma | nenhum | antes | nao | semanal |
| `materiais` | Criar ou adaptar materiais e atividades | Ex.: adaptar um texto para estudantes com dificuldade de leitura | geracao | 2 | professores | professores, criancas | nenhuma | nenhum | antes | nao | semanal |
| `feedback_redacao` | Dar retorno sobre redações e textos dos estudantes | Ex.: comentários sobre coesão em textos do 9º ano, revisados pelo professor | avaliacao, geracao | 2 | professores | criancas, professores | formativa | pessoais_est | tempo | possivel | semanal |
| `correcao` | Corrigir ou pontuar tarefas e provas | Ex.: pontuar questões abertas de uma avaliação bimestral | avaliacao, classificacao | 3 | professores | criancas, familias | nota | pessoais_est, sensiveis | lenta | sim | semanal |
| `tutoria` | Oferecer prática individual e tutoria aos estudantes | Ex.: exercícios de matemática com dicas passo a passo | tutoria, geracao, recomendacao | 3 | estudantes, professores | criancas, professores, familias | formativa | pessoais_est, sensiveis | tempo | sim | continua |
| `alerta_precoce` | Identificar estudantes que precisam de apoio | Ex.: sinalizar risco de abandono a partir de faltas e notas | previsao, apoio | 3 | gestores, professores | criancas, familias | apoio_est | pessoais_est, sensiveis | lenta | sim | semanal |
| `duvidas` | Responder dúvidas de escolas, servidores ou famílias | Ex.: perguntas sobre normas de matrícula e prazos | geracao, classificacao | 2 | administrativo, gestores | servidores | organizacao | pessoais_serv | antes | nao | diaria |
| `rotinas` | Apoiar rotinas administrativas | Ex.: organizar horários, convocações e comunicados | automacao, geracao | 4 | administrativo, gestores | servidores, professores | organizacao | pessoais_serv | antes | nao | diaria |
| `acessibilidade` | Traduzir conteúdos ou torná-los acessíveis | Ex.: legendas, leitura em voz alta, versão na língua local | geracao | 2 | professores, estudantes | criancas, familias | nenhuma | nenhum | antes | nao | semanal |
| `outra` | Outra | Descreva no campo abaixo | geracao | 2 | (nenhum) | (nenhum) | nenhuma | nenhum | tempo | possivel | semanal |

Regra de etapa para afetados sugeridos: se nenhuma etapa marcada em 1.1.4 é `infantil`, `fund1`, `fund2` ou `medio` (só `superior`, `eja`, `profissional`), troca `criancas` por `adultos_est`.

Removidos do 2.1: `classes` (agora interno), `autonomia`, `arquitetura`, `pilotoGratuito`, tamanho do piloto (vai para 2.3).

### B.6 Passo 2.2 Experiência de uso (`2b`)

Título com selo "Camada 2" e ⓘ. Texto de abertura: "Como as pessoas vão usar a ferramenta no dia a dia. As respostas vêm sugeridas pelas tarefas do passo 2.1; ajuste o que for diferente na sua rede."

| N | Campo | Pergunta / EN | Exemplo | Tipo e opções |
|---|---|---|---|---|
| 2.2.1 | `caso.usuarios` | "Quem vai usar a ferramenta?" / "Who will use the tool?" | "Exemplo: professores do 6º ao 9º ano." | chips `OPC.usuarios` (sem mudança) |
| 2.2.2 | `caso.afetados` | "Quem recebe ou é afetado pelo que a ferramenta produz?" / "Who receives or is affected by what the tool produces?" | "Exemplo: os estudantes que recebem as atividades preparadas pelo professor." | chips `OPC.afetados` (sem mudança) |
| 2.2.3 | `caso.consequencias` | "O que as pessoas vão fazer com a resposta da ferramenta?" / "What will people do with the tool's output?" | "Exemplo: o professor revisa o plano de aula e decide o que usar." | chips `OPC.consequencias`, ids mantidos, textos em linguagem de uso: `nenhuma` "Usar como apoio na própria tarefa, sem decidir sobre pessoas"; `organizacao` "Organizar filas, comunicados ou rotinas"; `formativa` "Dar retorno formativo aos estudantes"; `apoio_est` "Decidir quais estudantes recebem apoio primeiro"; `nota` "Atribuir notas ou conceitos"; `acesso` "Decidir acesso, matrícula ou nível de ensino"; `disciplina` "Acompanhar comportamento ou provas"; `recursos` "Distribuir recursos entre escolas ou pessoas". `nenhuma` continua exclusiva |
| 2.2.4 | `caso.frequencia` | "Com que frequência cada pessoa vai usar?" / "How often will each person use it?" | — | radio `OPC.frequencia` (sem mudança) |

Pré-marcação: ao mudar `tarefas`, o gancho `aoMudarCampo('tarefas')` (P2) aplica `perfisSugeridos(tarefas, etapas)` (P1) a cada um dos quatro campos que ainda não têm `respC`: `usuarios` e `afetados` = união das sugestões; `consequencias` = união, sem `nenhuma` se houver outras; `frequencia` = a mais intensa (eventual < semanal < diaria < continua). Desmarcar uma tarefa recalcula as sugestões dos campos não confirmados.

Removidos do 2.2 (passam a derivados, B.8): `dados`, `treino`, `vulneraveis`, `idiomas`, `reversibilidade`, `verificabilidade`, `contestacao`, `cumulativo`, `alcance`. `elegiveis` vai para 3.1.1.

### B.7 Passo 2.3 Adoção (`2c`)

Título "Adoção" com selo "Camadas 2, 3 e 4" e ⓘ. Texto de abertura: "O setup da prova de conceito ou do piloto: que tecnologia, como se paga, que licença, quanto adaptar e de que tamanho. Estas respostas definem as premissas de custo."

| N | Campo | Pergunta / EN | Dica | Exemplo | Tipo e opções (`OPC`, novos em `framework.js`) |
|---|---|---|---|---|---|
| 2.3.1 | `caso.tipoTec` | "Que tipo de tecnologia você pretende usar?" / "What type of technology do you plan to use?" | — | "Exemplo: uma plataforma do ministério (pública), um modelo aberto instalado numa nuvem contratada (aberta), a assinatura de um assistente para professores (paga)." | radio `tipoTec`: `publica` "Pública ou gratuita, oferecida por governo ou instituição pública"; `aberta` "Aberta (código ou modelo aberto), operada pela rede ou por empresa contratada"; `paga` "Produto ou serviço pago de uma empresa"; `nao_sei` "Ainda não sei" |
| 2.3.2 | `caso.pagamento` | "Como vai ser o pagamento?" / "How will you pay?" | "Pense no período da prova de conceito ou do piloto." | "Exemplo: um valor por professor por mês (por usuário); um valor anual fixo para todas as escolas (institucional)." | radio `pagamento`: `usuario` "Licença por usuário"; `institucional` "Assinatura institucional (valor fixo para a rede)"; `consumo` "Por consumo (paga pelo uso)"; `incluida` "Incluída numa plataforma que a rede já paga"; `gratuito` "Doação ou piloto gratuito" |
| 2.3.3 | `caso.licenca` | "Que tipo de licença?" / "What type of licence?" | — | "Exemplo: os termos aceitos ao criar uma conta gratuita são termos de uso padrão." | radio `licenca`: `assinatura` "Licença de uso por prazo (assinatura)"; `aberta` "Licença aberta (pode usar, modificar e hospedar)"; `termos` "Termos de uso padrão, sem contrato negociado"; `nao_sei` "Ainda não sei" |
| 2.3.4 | `caso.adaptacao` | "Quanto a ferramenta precisa ser adaptada ao seu contexto?" / "How much does the tool need to be adapted to your context?" | "Cada nível inclui os anteriores. Mais adaptação aumenta o custo de implantação e de manutenção." | "Exemplo: traduzir para a língua local e alinhar as atividades ao currículo é adaptação de conteúdo e idioma." | radio `adaptacao`: `config` "Nenhuma ou só configuração (contas, turmas, permissões)"; `conteudo` "Adaptação de conteúdo e idioma (currículo, exemplos locais, língua)"; `integracao` "Integração com sistemas da rede (login, matrícula, ambiente virtual)"; `sob_medida` "Desenvolvimento sob medida (novas funções, aplicação própria)" |
| 2.3.5 | `caso.infra` | "As escolas da prova de conceito ou do piloto já têm os dispositivos e a internet que o uso exige?" / "Do the proof-of-concept or pilot schools already have the devices and internet access the use requires?" | — | "Exemplo: um computador ou tablet por estudante durante a aula e internet que aguente uma turma inteira conectada." | radio `infra`: `sim` "Sim"; `complementar` "Em parte: será preciso complementar"; `nao_sei` "Não sei" |
| 2.3.6 | `caso.piloto.escolas`, `.participantes`, `.meses` | Piloto ou recomendar: "De que tamanho e por quanto tempo será o piloto?" / "How large and how long will the pilot be?". PoC: "Quantas pessoas vão testar e por quanto tempo?" / "How many people will test it, and for how long?" | Piloto: "Participantes são as pessoas que usam a ferramenta." PoC: "Na prova de conceito testam a equipe e algumas pessoas convidadas, sem usuários reais." | Piloto: "Exemplo: 20 escolas, 600 professores, 4 meses." PoC: "Exemplo: 15 pessoas, 2 meses." | três `num` inteiros: "Escolas" (oculto na PoC), "Participantes" (PoC: "Pessoas que vão testar"), "Duração (meses)". Respondido quando participantes > 0 e meses > 0 (e escolas > 0 no piloto). Mostra abaixo "Escolas do piloto em relação à rede: X%" (como hoje) |
| — (sem número) | `caso.arquiteturaManual` | `<details>` "Para equipes técnicas: arquitetura presumida" | "A ferramenta deduz a arquitetura das respostas acima para estimar o custo. Mude só se souber que é outra." | — | linha "Arquitetura presumida: <rótulo>" + radio: `''` "Usar a arquitetura presumida" e as três de `OPC.arquitetura` (saas, api, ow). Não conta para o progresso |

### B.8 Valores derivados (`casoEfetivo(c, tot)`, P1, `framework.js`)

`casoEfetivo(c, tot)` devolve uma cópia de `c` com os campos legados preenchidos, sem gravar nada em `S.caso`. `tot = { alunos, escolas, etapas: [ids] }` vem de `totaisCtx()`. Todas as funções de risco, alerta, supervisão, cláusulas e custo passam a receber o caso efetivo: `perfil() = perfilFinal(casoAtual())` e `cfgDoCaso(casoAtual(), perfil())`, com `casoAtual() = casoEfetivo(S.caso, totaisCtx())` (P4, `app.js`).

| Campo legado | Regra de derivação |
|---|---|
| `classes` | União das `classes` das tarefas marcadas; vazio se não houver tarefa |
| `autonomia` | Máximo da `autonomia` das tarefas; 2 se não houver tarefa |
| `consequencias` | Valor de `c.consequencias` (pergunta 2.2.3) |
| `dados` | União dos "dados da tarefa" + regras: `usuarios` inclui `estudantes` → `pessoais_est`; `usuarios` inclui `professores`, `gestores` ou `administrativo` → `pessoais_serv`; `afetados` inclui `criancas` e `consequencias` inclui `nota`, `apoio_est`, `acesso` ou `disciplina` → `sensiveis`. Tira `nenhum` se houver outro; `['nenhum']` se ficar vazio |
| `treino` | `'nao_sei'` (premissa; o plano pede a cláusula de proibição) |
| `reversibilidade` | A pior entre as tarefas (antes < tempo < lenta < dificil); `tempo` se não houver tarefa |
| `cumulativo` | O pior entre as tarefas (nao < possivel < sim); `possivel` se não houver tarefa |
| `verificabilidade` | arquitetura `api` ou `ow` → `sim`; senão `licenca === 'termos'` → `nao`; senão `parcial` |
| `contestacao` | Peso máximo das `consequencias` (coluna 3 de `OPC.consequencias`) = 0 → `na`; senão `formal` |
| `vulneraveis` | `false` (o contato direto de crianças já eleva a dimensão "pessoas" em `perfilAutomatico`) |
| `idiomas` | Tarefas incluem `acessibilidade` ou `adaptacao` ∈ {`conteudo`, `integracao`, `sob_medida`} → `true` |
| `elegiveis` | `c.elegiveis` se > 0; senão `tot.alunos` se `usuarios` inclui `estudantes` e `tot.alunos` > 0; senão 1000. Flag `c.__elegPadrao = true` quando veio da regra (o plano diz "premissa padrão") |
| `alcance` | `afetados` inclui `criancas` ou `adultos_est` → `tot.alunos`; senão `''` |
| `arquitetura` | `derivarArquitetura(c)`: `arquiteturaManual` se preenchida; senão `tipoTec === 'aberta'` ou `licenca === 'aberta'` → `ow`; senão `pagamento === 'consumo'` ou `adaptacao === 'sob_medida'` → `api`; senão `saas`. Flag `__arqPresumida = !arquiteturaManual && (tipoTec in ['', 'nao_sei'])` |
| `pilotoGratuito` | `pagamento === 'gratuito'` |
| `alternativaSemIA` | `c.alternativa === 'sim'` |
| `capacidade` | Não é mais usado |
| `escolasRede` | `tot.escolas` |

Conferência com os exemplos (valores esperados que o teste P1 deve verificar): A → nível agregado **moderado**; B → **elevado**; C → **elevado**; D → **limitado** (mesmos níveis dos presets A, C, C e B do guia).

Mudanças em `alertas()` (P1): remover o bloco de `capacidade`; o alerta de treino "não sabemos" só quando `dados` inclui dado pessoal; trocar o alerta de arquitetura indefinida por: quando `__arqPresumida` e `situacao` ∈ {proposta, renovar, orcamento}: "A tecnologia ainda não foi escolhida. A estimativa usa um produto pago por licença como premissa; o custo e a dependência mudam muito entre as opções." Os demais alertas ficam como estão (agora só aparecem no plano).

`recomendarTeste(ce)` (P1, `framework.js`), base no guia cap. 14:
- Motivos para PoC (cada um gera uma frase): `tipoTec` vazio ou `nao_sei` → "a tecnologia ainda não foi escolhida"; `adaptacao === 'sob_medida'` → "a solução exige desenvolvimento sob medida, cuja viabilidade técnica ainda não foi demonstrada"; tarefas incluem `outra` → "há uma tarefa fora da lista, sem referência de uso"; `linhaBase === 'nao'` → "sem linha de base, um piloto ainda não conseguiria medir mudança".
- Com qualquer motivo: `{ modo: 'poc', motivos }`. Sem motivo: `{ modo: 'piloto', motivos: ["a tecnologia está escolhida", "a adaptação se limita a " + rótulo do nível, "há linha de base " + ("medida" | "parcial")] }`.

### B.9 Fase 3: passos 3.1 a 3.3

**3.1 Escala e horizonte (`3a`)** — selo "Camadas 3 a 7".

| N | Campo | Pergunta / EN | Dica | Exemplo | Tipo |
|---|---|---|---|---|---|
| 3.1.1 | `caso.elegiveis` | "Se der certo, quantas pessoas usariam a ferramenta em toda a rede?" / "If it works, how many people would use the tool across the network?" | "Base da estimativa de custo depois do teste." + botão "Usar o total de estudantes do contexto (N)" quando `usuarios` inclui estudantes | "Exemplo: 12.000 professores ou 150.000 estudantes." | num inteiro |
| 3.1.2 | `caso.expansao` | "Em quanto tempo você pretende chegar a todas essas pessoas?" / "How long will it take to reach all of them?" | — | — | radio `expansao`: `ano1` "No primeiro ano depois do teste"; `ano2` "Em dois anos"; `ano3` "Em três anos" |
| 3.1.3 | `caso.horizonte` | "Por quantos anos de uso você quer estimar o custo?" / "For how many years of use do you want to estimate the cost?" | "Além do Ano 0, que é o da prova de conceito ou do piloto." | — | radio `horizonte`: `3` "3 anos"; `5` "5 anos" (gravado como número) |

**3.2 Fonte de recursos (`3b`)**

| N | Campo | Pergunta / EN | Exemplo | Tipo |
|---|---|---|---|---|
| 3.2.1 | `caso.pagaDepois` | "Quem vai pagar a tecnologia depois da prova de conceito ou do piloto?" / "Who will pay for the technology after the proof of concept or pilot?" | "Exemplo: a própria secretaria, com recursos do tesouro estadual." | radio `pagaDepois`: `rede` "A própria rede"; `governo` "Outra esfera de governo ou programa público"; `parceiro` "Parceiro privado ou doador"; `indefinido` "Ainda não definido" |
| 3.2.2 | `caso.fonte` | "Você já tem fonte de recursos para manter a ferramenta nos próximos anos?" / "Do you already have a source of funds to keep the tool running in the coming years?" | "Exemplo: uma linha no orçamento plurianual para tecnologia educacional." | radio `fonte`: `sim` "Sim, prevista no orçamento"; `parcial` "Em parte ou só para o primeiro ano"; `nao` "Não" (fusão de `g-orcamento` e `s-orcamento`) |

**3.3 Estimativa de custo (`3c`)** — sem perguntas; concluído quando aberto uma vez (`S.feitos['3c']`). Conteúdo: seletor de moeda (já existente), KPIs (Custo do Ano 0 — PoC ou piloto; Custo total do ciclo de vida; Dotação média por ano de operação; Por usuário ativo por ano; Custo de sair, em anos de custo recorrente), tabela "Custo por camada" (camadas 1–7 × Ano 0 e total do ciclo, via `somaPorCamada`), tabela de dotação por exercício e o `<details>` "Ajustar premissas, itens e cenários na calculadora completa" (como hoje no 3.3 da v8). Nota fixa: "Valores ilustrativos. Substitua por cotações e dados locais." + ⓘ com a nota de convenção de A.3.

### B.10 Adoção e fase 3 → motor de custo (mapeamento exato)

**Onde**: `cfgDoCaso(ce, perfil)` em `src/casos.js` (P1), recebendo o caso efetivo. Parâmetros novos do motor em `src/custos.js` (P1), todos neutros quando ausentes.

1. **Arquitetura e preset**: `arq = ce.arquitetura` (B.8); `base = { saas: 'A', api: 'B', ow: 'C' }[arq]`; `cfg = clone(PRESETS[base])`.
2. **Horizonte**: `cfg.opc = { H: +ce.horizonte || 3 }`.
3. **Demanda** (`H1 = H + 1` posições):
   - `E = ce.elegiveis`. `E0 = +ce.piloto.participantes > 0 ? +participantes : (teste === 'poc' ? 15 : max(50, round(0.05 × E)))`, limitado a `E`.
   - `m0 = +ce.piloto.meses > 0 ? min(12, meses) : (teste === 'poc' ? 2 : 4)`.
   - `E_t` (t ≥ 1): `ano1` → E; `ano2` → t = 1: round(E/3), t ≥ 2: E; `ano3` → t = 1: round(E/3), t = 2: round(2E/3), t ≥ 3: E.
   - `cfg.demanda.E = [E0, E_1 … E_H]`; `cfg.demanda.meses[0] = m0` (demais anos do preset).
4. **SaaS (`saas`)**: `saas.mesesCobr[0] = m0`.
   - `pagamento === 'usuario'`: `saas.preco = saas.precoNominal`; `saas.qtd[t] = ceil(E_t × ano(adocao, t) × saas.fatorNominal)`.
   - Outros pagamentos: `saas.qtd[t] = E_t` (licença institucional do preset).
   - `pagamento === 'incluida'`: `saas.preco = 0` (sem preço marginal; o plano pede verificar o preço da plataforma, p. 6 "embedded and distributed costs").
   - `saas.fatorPreco[0] = (pagamento === 'gratuito' || tipoTec === 'publica') ? 0 : 1`; `saas.fatorPreco[t ≥ 1] = (pagaDepois ∈ {'parceiro', 'governo'} || tipoTec === 'publica') ? 0 : 1`. A parte não paga já vira linha `O` ("Licenças cedidas sem custo (valor de mercado)") pelo motor atual.
5. **API e pesos abertos (`api`, `ow`)**: novo `cfg.cedidoUso = [c0, c1 … cH]` com `c0 = (pagamento === 'gratuito' || tipoTec === 'publica') ? 1 : 0` e `c_t = (pagaDepois ∈ {'parceiro','governo'} || tipoTec === 'publica') ? 1 : 0`; `mensais[i].mesesY0 = min(12, m0 + 2)`.
6. **Adaptação**: `cfg.adaptacao = fatoresAdaptacao(ce.adaptacao, base)` (tabela abaixo).
7. **Condições de base (K1)**, só com `infra === 'complementar'` (com `sim` ou `nao_sei`, K1 = 0 e o plano registra "premissa a verificar", como diz o guia, cap. 11, passo 2):
   - `{ cat: 'Condições de base', s: 'K1.2', nome: 'Dispositivos complementares (ilustrativo)', nat: 'D', orc: 'capital', moeda: 'LOC', v_t = 0,25 × novos_t × 300 }`, com `novos_0 = E0`, `novos_t = max(E_t − E_{t−1}, 0)`.
   - `{ cat: 'Condições de base', s: 'K1.1', nome: 'Conectividade incremental nas escolas (ilustrativo)', nat: 'D', moeda: 'LOC', v_t = 600 × escolas_t }`, com `escolas_0 = +piloto.escolas || 1` e `escolas_t = round(escolasRede × E_t / E)` (se `escolasRede` = 0: `ceil(E_t / 400)`).
   - Constantes em `casos.js`: `PREMISSAS_K1 = { fracaoSemDispositivo: 0.25, precoDispositivo: 300, conectEscolaAno: 600 }`, comentadas como "convenção editorial ilustrativa, não evidência".
8. **Governança**: `governancaPorRisco(cfg, perfil.agregado)` (sem mudança).
9. **Campos sem efeito no motor** (só no plano): `licenca` (exceto pela derivação de arquitetura e de verificabilidade), `fonte`, `infra = nao_sei`, `teste` (exceto E0 e m0 padrão).

Tabela de adaptação (constante `ADAPTACAO` em `casos.js`), **convenção editorial ilustrativa**. Índices por nível e nível de referência de cada preset (o nível que o exemplo do guia já representa):

| Nível | Índice K3.1 (integração e desenvolvimento) | Índice K3.2 (conteúdo e configuração) |
|---|---|---|
| `config` | 0,2 | 1,0 |
| `conteudo` | 0,2 | 2,0 |
| `integracao` | 1,0 | 2,0 |
| `sob_medida` | 2,5 | 2,5 |

Referências: preset A (SaaS, integração SSO, diretório e AVA) = `integracao`; preset B (API e RAG, desenvolvimento da aplicação) = `sob_medida`; preset C (tutor em pesos abertos, plataforma própria) = `sob_medida`. `fatoresAdaptacao(nivel, base) = { fK31: I31[nivel] / I31[ref], fK32: I32[nivel] / I32[ref] }`; sem nível → `{ fK31: 1, fK32: 1 }`.

Resultado conferido com o motor atual (conta econômica, modo padrão, preset puro):

| Preset | config | conteudo | integracao | sob_medida |
|---|---|---|---|---|
| A: K3 / total | 21.625 / 4.678.721 | 27.250 / 4.684.346 | **59.250 / 4.749.946** (neutro) | 122.063 / 4.875.758 |
| B: K3 / total | 21.100 / 392.977 | 21.100 / 392.977 | 56.300 / 459.857 | **122.300 / 585.257** (neutro) |
| C: K3 / total | 37.400 / 1.470.013 | 45.400 / 1.478.013 | 103.000 / 1.575.933 | **215.000 / 1.763.533** (neutro) |

**Mudanças no motor (`src/custos.js`, P1)**:
- `fatorAdapt(cfg, s)`: `s === 'K3.1'` → `cfg.adaptacao.fK31`; `s === 'K3.2'` → `fK32`; senão 1 (e 1 se `cfg.adaptacao` ausente).
- Em `calcular`: criar `impl = (cfg.implantacao || []).map(x => ({ ...x, valor: x.valor × fatorAdapt(cfg, x.s || 'K3.1') }))` e usar `impl` no laço de implantação (o que escala também a manutenção K6.1) e em `impl0` da saída (reconstrução); devolver `impl` no resultado (`r.impl`). Em `avaliar`, o valor residual passa a usar `r.impl` em vez de `r.cfg.implantacao`.
- Laço de `itens`: `v_t × fatorAdapt(cfg, x.s)`. Laço de `pessoas`: FTE de cada parte × `fatorAdapt(cfg, pp.s)`. A linha de processamento inicial de documentos do RAG (K3.2 gerada em `cfg.rag`) não é escalada (depende do acervo, não da adaptação).
- `cedidoUso`: depois de montar todas as linhas e antes do bloco de saída, para cada linha com `s` ∈ {K2.2, K2.3, K2.4, K2.5} e `nat === 'D'`, separar `vo_t = v_t × clamp(ano(cedidoUso, t), 0, 1)`; a linha fica com `v_t − vo_t`; se `o.doados`, criar linha `{ nome: 'Uso cedido sem custo (valor de mercado)', s: mesmo s, nat: 'O', pagador: 'terceiro', tag: 'doado', q: null, p: null, v: vo }`.
- `CAMADA_DE_S` (A.3) e `somaPorCamada(av)` → `{ ano0: {1..7}, total: {1..7}, fin0: {1..7} }` (conta econômica para `ano0` e `total` em VP; saída somada à camada 7 em `total`; `fin0` = desembolso do Ano 0). Exportar os dois em `API_CUSTOS`.
- `direcionadores()`: nada muda. Opcional não exigido: nenhum.

**Testes que devem continuar verdes**: `node tests/test_custos_v2.js` (125 verificações, sem editar o arquivo). Os presets não têm `adaptacao` nem `cedidoUso`, então os números publicados do guia (modo de compatibilidade, cenários, sensibilidade, dotação, saída, adoção de equilíbrio, comparação de arquiteturas) e as identidades do modo padrão para A–C permanecem iguais. Teste novo `tests/test_v9_motor.js` (P1) na seção F.2.

---

## C. O plano de contratação

### C.1 Geração

- Botão `data-act="gerar-plano"` com o texto "Gerar plano de contratação" (EN "Generate procurement plan") em quatro lugares: painel lateral (sempre visível, primário), último item do stepper, rodapé da fase 3 e chamada final abaixo das fases (substitui `chamadaResumo`). Sempre habilitado.
- Clique → `abrirPlano()` (P3): `S.vista = 'plano'`, `render()`, rolar ao topo. A página tem `id="plano"`. Topo: título do caso, lugar, data; botões "Baixar PDF" (`data-act="pdf"`), "Voltar ao percurso" (`data-act="voltar-percurso"`), "Exportar caso (.json)" ou "Copiar dados do caso", "Copiar texto", "Importar caso".
- Faixa fixa logo abaixo do título: "Documento de trabalho baseado no guia do projeto e no quadro de custo total em camadas de Krueger e Jackson (2026). Valores ilustrativos. As opiniões e recomendações são desta ferramenta e não da UNESCO."
- Se houver perguntas sem resposta: aviso "Plano parcial: N perguntas sem resposta." com a lista (número, texto, botão "Responder" que leva à pergunta, via `faltasTodas()` de P2). O PDF traz a mesma lista como primeira seção.
- Não existe mais a seção "Suas respostas" nem a lista longa de Sim/Não.

### C.2 Estrutura (página e PDF, mesma ordem; `secoesPlano()` alimenta PDF, Markdown e HTML)

0. **Resumo do caso** (tabela chave-valor, sem diagnóstico): nível e lugar; situação; etapas com escolas e estudantes (tabela etapa × ano, com totais); problema (1.2.3 e 1.2.4); impacto desejado; linha de base; alternativa sem IA; aplicações (tarefas + "Outra"); quem usa; quem é afetado; o que se faz com a resposta; frequência; prova de conceito ou piloto (escolha); setup (escolas, participantes, meses); tecnologia, pagamento, licença, adaptação, dispositivos e internet; arquitetura presumida (com a frase "deduzida das respostas" quando `__arqPresumida`); pessoas na rede, expansão, horizonte; quem paga depois; fonte de recursos.

**Bloco A. Custo e compra** (faixa de título com o nome do bloco)

- **A1. Prova de conceito ou piloto.** Se `teste === 'recomendar'`: "Recomendação: começar por uma prova de conceito / um piloto, porque " + motivos de `recomendarTeste`. Se a escolha da pessoa difere da regra: "Você escolheu X. Pelas respostas, a ferramenta indicaria Y, porque …". Tabela `APRENDIZAGEM` (guia cap. 14) com a linha escolhida destacada e os três itens fixos atuais ("Mantenha separadas duas decisões…", "O desenho do teste deve explicitar…", "Contratar por etapas…"). PoC acrescenta: "Use dados de teste ou selecionados, sem usuários reais nem integrações que criem dependência." (guia cap. 14, condições da PoC).
- **A2. Custo estimado (ilustrativo).** KPIs: Ano 0 (PoC ou piloto), custo total do ciclo, dotação média por ano, por usuário ativo por ano, por participante do piloto, custo de sair em anos. Tabela "Custo por camada" (camadas 1–7 × Ano 0, total do ciclo, %), via `somaPorCamada`. Tabela "Dotação a solicitar por exercício" (Ano 0 … Ano H). Lista "Premissas desta estimativa": arquitetura presumida e preset de origem (Exemplo A/B/C do guia, cap. 12); nível de adaptação e multiplicadores aplicados a K3.1 e K3.2 ("convenção ilustrativa da ferramenta"); pagamento e quem paga; valor cedido sem custo (quando houver: "Gratuito para a rede não quer dizer sem custo: o valor de referência aparece como cedido na conta econômica. Krueger e Jackson (2026, p. 7–8) mostram que a aquisição gratuita não elimina os custos do ciclo de vida."); K1 ("Dispositivos e internet considerados existentes: premissa a verificar." quando `infra` ≠ complementar); elegíveis padrão quando `__elegPadrao`; horizonte e expansão.
- **A3. Lista de verificação de custos pelas sete camadas.** Tabela com colunas: Camada | O que considerar | Onde está na estimativa | Neste caso. Linhas fixas (texto em `plano_dados.js`, P3, parafraseando a Figura 1, p. 11):
  1. Governança, políticas e planejamento do ciclo de vida — "Estruturas de governança, política, revisão ética, orientação de compras, rotinas de monitoramento, revisão jurídica e planejamento do ciclo de vida (p. 11)." — K3.3 — "N de 6 perguntas de governança com resposta Sim (passo 1.3)."
  2. Aplicações de IA, experiência de uso e adoção — "Ferramentas, aplicações, assinaturas e experiências de uso mais visíveis para professores, estudantes e gestores (p. 11)." — K2.1, K2.2, K3.2 — tarefas, pagamento, licença.
  3. Infraestrutura e dispositivos — "Infraestrutura, banda, nuvem e dispositivos (p. 11). Em sistemas com poucos recursos, conectividade, dispositivos e energia podem ser o primeiro e maior custo (p. 7)." — K1.1, K1.2, K2.3, K2.5 — resposta 2.3.5 ou "premissa a verificar".
  4. Integração de dados e sistemas — "Interoperabilidade, matrícula, identidade, plataformas de aprendizagem e sistemas de informação de estudantes; acervo de conhecimento institucional (p. 11)." — K2.4, K3.1 — nível de adaptação.
  5. Cibersegurança, privacidade e conformidade — "Gestão de identidade, monitoramento, risco de terceiros, privacidade e conformidade (p. 11)." — K1.3, K5.2, K5.4 — dados pessoais derivados.
  6. Formação e capacidade das equipes — "Formação contínua por função: professores e equipes técnicas, administrativas e de liderança (p. 6, p. 11)." — K4.3, K4.4.
  7. Operação, suporte e sustentabilidade — "Suporte técnico, monitoramento, gestão de fornecedores, manutenção, avaliação e planejamento da sustentabilidade (p. 11)." — K3.4, K4.1, K4.2, K5.1, K5.3, K5.5, K6.1–K6.3 ("a saída não consta no documento; convenção da ferramenta").
  Linhas condicionais: "Custos adiados pela gratuidade (p. 7–8; p. 13, pergunta 2)" quando `pagamento === 'gratuito'` ou `tipoTec === 'publica'`; "Custo variável por uso, a monitorar à medida que o uso cresce (p. 6)" quando arquitetura `api` ou `ow` ou `pagamento === 'consumo'`; "Licenças pagas e não usadas são desperdício (p. 3): compare custo por usuário licenciado e por usuário ativo" quando arquitetura `saas` e pagamento `usuario` ou `institucional` (com o ponto de equilíbrio de `compLicenca` quando houver).
  Referência ao pé da tabela com o link do documento.
- **A4. Arranjo de aquisição.** `ARRANJOS` (guia cap. 14) filtrados por `arranjosCaso(ce)`: `tipoTec === 'publica'` → `compartilhada`; arquitetura `saas` → `saas`; `api` → `api`, `contratar`; `ow` → `interno`, `contratar`; `adaptacao === 'sob_medida'` acrescenta `contratar`. Nota `NOTA_ARQ[arq]`; frase "Os arranjos são combináveis…"; `<details>` "Ver todos os arranjos" (só na página).
- **A5. Requisitos e cláusulas de custo e compra.** `CONTRATO` (Instrumento F) dos grupos Escopo, Desempenho, Mudança, Direitos, Custo, Saída, Gestão, filtrados pelas etiquetas (`alto` se perfil alto, `pessoas` se afeta pessoas, `consumo` se arquitetura ≠ saas). Itens do caso, com destaque: gratuito → ações de `r-gratuito` e `r-ativos`; `licenca === 'termos'` → destacar a linha existente "Hierarquia documental; termos online não alteram condições materiais"; `pagamento === 'incluida'` → "Verifique se o preço da plataforma que a rede já paga mudou com a IA e em que unidade é cobrado (Krueger e Jackson, 2026, p. 6, custos embutidos e distribuídos)."; `pagamento === 'consumo'` → linhas `consumo`.
- **A6. Dependência e saída.** `LOCKIN[arq]` + `PACOTE` (com itens `rag` só em `api`); custo de saída estimado (`orcamento().saida`) e "anos de custo recorrente para sair".
- **A7. Fonte de recursos.** Respostas 3.2.1 e 3.2.2. Se `fonte` ≠ `sim`: "Prever a fonte de recursos para operar e manter a solução depois do piloto." (texto de `g-orcamento`) e "Garantir orçamento recorrente para os próximos exercícios." (`s-orcamento`). Sempre: "Teste o orçamento sem condições promocionais e compare as propostas no mesmo horizonte, incluindo mudança e saída." Se `pagaDepois === 'parceiro'`: "Defina o que acontece quando o financiamento do parceiro acabar." (apoio: p. 8, Cazaquistão).
- **A8. Documentos do dossiê a preparar (custo e compra).** `DOSSIE` D9 a D15.

**Bloco B. Política e governança**

- **B1. Governança da rede (camada 1).** Tabela: N | Pergunta | Resposta | O que fazer (texto de `ACOES` para `nao`, `parcial`, `nao_sei`) | Prioridade ("alta" para `g-legislacao` e `g-dados`, "normal" para as demais). Referência p. 11–12.
- **B2. Funções que não podem ser terceirizadas.** Texto fixo: "Nomeie responsáveis internos para as funções que não podem ser terceirizadas:" + lista `OPC.capacidade` (definir a finalidade; aceitar riscos; interpretar evidências; decidir sobre continuidade; prestar contas).
- **B3. Regras da prova de conceito ou do piloto.** As ações de `r-autorizacao`, `r-baselegal` e `r-acordo` (se dados pessoais derivados), `r-sucesso` (com a linha de base e os impactos escolhidos citados), `r-parada`, `r-ativos`, `r-gratuito` (se gratuito). Na PoC, `r-baselegal` e `r-acordo` aparecem como "se usar dados reais".
- **B4. Capacidade mínima nos locais.** Ações de `p-*` agrupadas por camada (2, 3, 5, 6, 7), com as condições atuais (`p-idiomas` se `idiomas` derivado; `p-protecao` se dados pessoais). Na PoC, só `p-problema`, `p-usuarios`, `p-acessos`, `p-incidente`, `p-acomp`.
- **B5. Perfil de risco e premissas.** Nível de diligência (`NIVEL_NOME`, `NIVEL_CRIT`), tabela de dimensões com justificativa, nota "Premissas deduzidas das tarefas escolhidas: autonomia N (rótulo), dados …, reversibilidade …, efeitos cumulativos …, verificabilidade …, contestação …"; forma de supervisão indicada (`FORMAS_SUP`); "Pontos de atenção" = `alertas()` ("Resolver antes de contratar" para bloqueio; "Tratar no plano" para atenção; "Nota" para info), com o capítulo do guia; nota normativa do Anexo III quando houver (texto atual).
- **B6. Dados, verificação e contestação.** `DADOS_REQ` (com `treino` em prioridade); `CONTRATO` grupos Dados e Verificação; recomendações que eram perguntas: "Registre e torne rastreáveis as saídas que classificam ou preveem." (se classes incluem classificacao ou previsao); "Exija informação para verificar e registrar como cada saída foi produzida." (sempre; mais forte se verificabilidade derivada = nao); contestação: se a saída afeta pessoas, "Crie um caminho para contestar saídas e corrigir erros, com prazo e autoridade para rever." + os seis elementos de `CONTESTACAO`.
- **B7. Antes de levar à rede e para manter.** Ações das `i-*` (antes de levar à rede) e `s-*` (para manter e ampliar), agrupadas por camada, com as condições atuais (`quando`) aplicadas ao caso efetivo; listas de verificação de supervisão (`SUPERVISAO`), mudança (`MUDANCA`) e incidentes (`SEVERIDADE`) em `<details>` na página e em tabela no PDF.
- **B8. Monitoramento e avaliação.** "Defina indicadores, responsáveis e rotina de monitoramento e avaliação." (ex-`g-avaliacao`) + tabela `METRICAS` (coluna conforme perfil alto ou não). Apoio: p. 13, sugestão 7.
- **B9. Critérios dos pontos de decisão do guia.** PD 5, 6 e 7 sob o título "Para a compra" e PD 1, 2, 3, 4, 8 e 9 sob "Para a política", cada um com pergunta, critérios e `extrasPD` do caso, em lista simples (sem caixas de marcar).

**Anexos**: "Referências" — "Guia do projeto: caps. 11 (custo do ciclo de vida), 12 (orçamento), 13 (requisitos), 14 (estratégia de aquisição), 15 (propostas) e 16 (contratos)." e "Krueger, K. e Jackson, F. para CoSN (2026). Beyond the price tag: Rethinking total cost of ownership for AI in education systems. Paris: UNESCO. https://unesdoc.unesco.org/ark:/48223/pf0000399348 — documento encomendado pela UNESCO; as opiniões são dos autores." Depois, `TXT_VINCULO` e `TXT_ISENCAO`.

### C.3 Página x PDF

- Página: blocos A e B com faixa de título; seções A1–A8 e B1–B9 como `<section class="res-sec">` com número; tabelas com `.tw`; listas longas (A4 todos os arranjos, B7 listas de verificação) em `<details>`.
- PDF (`gerarPDF`, jsPDF + autotable): capa com logos, "AI in Education Procurement Tool", subtítulo "Plano de contratação", título do caso, lugar e data, faixa de valores ilustrativos e de não falar pela UNESCO; "Respostas que faltam" (se houver); seção 0; bloco A com cabeçalho em faixa azul; bloco B; anexos. URL do documento com `doc.textWithLink`. Mesmos tamanhos de fonte da v8 (texto 10, tabela 8,6, títulos 14/11,5), nunca menores. Rodapé "AI in Education Procurement Tool · Plano de contratação · página n / N". Nome do arquivo: `procurement-plan-<slug>.pdf`.

---

## D. Detalhes de experiência de uso

### D.1 O que sai da tela durante o percurso

`cartaoResultado`, `veredito` (no percurso), `pillVeredito`, `.fase-v`, ponto colorido do stepper (`sf-v`), lista "Resultado por fase" do painel, perfil de risco no painel, passos 2.3–2.6 e 3.1–4.3 da v8, bloco `details.pds-fase` "Pontos de decisão do guia nesta fase", `cardPD` no percurso, chips "Camadas nesta fase", linhas "Não avaliar esta fase agora", botões "Pular as fases 3 e 4", contorno vermelho e intensidade por "sim" na mandala, marcas `!` e `✕` nos passos, etiquetas "essencial". Funções a apagar em `fluxo.js`: `veredito`, `pillVeredito`, `itemAcao`, `listaAcoes`, `botoesSeguir`, `cartaoResultado`, `blocoCamadas`, `tiposAplicacao`, `planoAcao`, `chamadaResumo`, `pulada`, `fasesAvaliadas`, `passo2c`, `passo2f`, `passo3a`, `passo3c` (reescrito como 3.3), `passo4a`, `passo4b`, `secoesFluxo`, `dadosCaso`, `importarCaso` (vão para `app.js`), constantes `PERG_FASE`, `VEREDITOS`, `PULAVEIS`. Em `fluxo_dados.js`: `QUESTOES` não-governança, `ACOES`, `ESSENCIAIS`, `REFS`, `CAMPOS_RISCO`, `CTX_EX`, `RESP_EX` (os dois últimos vão para `casos.js`).

### D.2 Numeração e ✓

- Cada pergunta é um `<div class="q" id="q-<n com hífens>" data-n="1.3.2">` com `<span class="qn">1.3.2</span>` antes do texto. Quando respondida: classe `ok` e `.qn::after { content: " ✓" }` na cor `--ok`, mais `<span class="sr">respondida</span>` para leitores de tela. Campo sugerido não confirmado: etiqueta "sugerido pela tarefa" no lugar do ✓.
- Dentro dos valores: (a) `input` de texto e de número dentro de `<span class="campo">` com `<span class="ok-in" aria-hidden="true">✓</span>` posicionado à direita, visível com `input:not(:placeholder-shown) ~ .ok-in` (todo input recebe `placeholder`, no mínimo `" "`), com `padding-right` no input para o ✓ não cobrir o texto; (b) textarea igual, canto superior direito; (c) opção marcada: radio `.opt input:checked + span b::before { content: "✓ " }` e chip `.chip input:checked + span::before { content: "✓ " }`; (d) segmentado da governança: botão com `aria-pressed="true"` ganha `::before { content: "✓ " }`.
- Passos: número do passo vira ✓ verde quando completo (classe `st-ok`), número com fundo da fase quando em andamento (`st-andamento`), só número quando não iniciado. Sem `!` e sem `✕`.
- Rodapé do passo: mantém "Ainda falta responder neste passo:" com os números ("1.1.3 Em que ponto você está?") e "Continuar mesmo assim"; quando completo, "Passo completo." + "Continuar para 1.2". No último passo de cada fase, o botão é "Continuar para a fase 2: Prova de conceito ou piloto" / "Continuar para a fase 3: Custo do ciclo de vida" / "Gerar plano de contratação".
- Rodapé de fase (substitui o cartão): "Fase 1 completa ✓" ou "Faltam N respostas nesta fase. Você pode continuar e voltar depois." + o mesmo botão de seguir. Neutro, sem cores de alerta.

### D.3 Números formatados enquanto se digita (P4, `i18n.js` e `app.js`)

- Todos os `type="number"` viram `<input type="text" inputmode="numeric|decimal" data-num="int|dec" autocomplete="off">` gerados por `inputNum(o)` (P4). Vale para: escolas e estudantes por ano (1.1.5), setup (2.3.6), elegíveis (3.1.1), e todos os campos `data-cfg`, `data-faixa`, `data-alt`, `data-estr`, `taxa`, `lambda` da calculadora (`custos_ui.js`).
- Separadores do idioma via `Intl.NumberFormat(LOC()).formatToParts(12345.6)`: PT e ES "160.000" e "0,5"; EN "160,000" e "0.5"; FR "160 000" (espaço fino) e "0,5".
- No evento `input` (capturado em `document`, antes dos demais): contar dígitos (e separador decimal em `dec`) antes do cursor; limpar (em `int` só dígitos; em `dec` dígitos e o primeiro separador decimal do idioma, ignorando os separadores de grupo); formatar a parte inteira com agrupamento, manter a parte decimal como digitada; recolocar o cursor depois do mesmo número de dígitos. Não formatar durante composição (IME). Em `change`, normalizar com `fmtEntrada(lerNumero(v), casas)`.
- `lerNumero(s)`: remove separadores de grupo (inclui espaço, U+00A0, U+202F e o separador de grupo do idioma), troca o decimal do idioma por ".", devolve número ou `''`. O estado guarda sempre número puro (ou `''`).
- Mudanças de idioma re-renderizam e reformatam os valores.
- Os manipuladores passam a ler com `lerNumero(el.value)`: `data-ctxn` (P2, `fluxo.js`), `data-fn` (novo, P4: caminho dentro de `S.caso`, ex.: `piloto.escolas`, `elegiveis`), `data-cfg`, `data-faixa`, `data-alt`, `data-estr`, `data-moeda="taxa"`, `data-clambda` (P4).
- Campos numéricos do percurso não chamam `render()` no evento `input` (só atualizam totais e laterais); `render()` só no `change`, preservando foco (já existe por `id`).

### D.4 Estudantes por ano ou série como padrão

- Ao marcar uma etapa com anos (`infantil`, `fund1`, `fund2`, `medio`), aparecem logo os campos "Escolas" e um campo por ano ou série; o total da etapa é calculado e mostrado como `<output>` ("Total da etapa: 150.000"). Botão discreto "Informar só o total da etapa" troca para um campo único "Estudantes" (`soTotal = true`); no modo total, botão "Detalhar por ano ou série" volta.
- Etapas sem anos (`superior`, `eja`, `profissional`): "Escolas" e "Estudantes".
- Linha de totais do passo (como hoje): "Total: N escolas · N estudantes · N etapas".
- `alunosEtapa(id)`: `soTotal` ou etapa sem anos → `alunos`; senão soma de `anos`.

### D.5 Referências ⓘ e explicação das camadas

- Botão `<button type="button" class="info" data-info="cN" aria-expanded="false" aria-label="Sobre a camada N">ⓘ</button>` ao lado dos títulos: 1.3 (`c1`), abertura da fase 2 e passos 2.1 e 2.2 (`c2`), 2.3 (`c234`), abertura da fase 3 e 3.3 (`c37`), legenda da mandala (`c37`). O clique abre logo abaixo um `<div class="info-nota">` com o texto e a referência; novo clique fecha.
- Textos (`CAMADAS_INFO` em `fluxo_dados.js`, P2):
  - `c1`: "Camada 1 · Governança, políticas e planejamento do ciclo de vida. No quadro de custo total em camadas de Krueger e Jackson (2026, p. 11), esta camada reúne estruturas de governança, política, revisão ética, orientação de compras, rotinas de monitoramento, revisão jurídica e planejamento do ciclo de vida. Os autores observam que a governança passa a fazer parte da estrutura de custo da operação."
  - `c2`: "Camada 2 · Aplicações de IA, experiência de uso e adoção. É o que professores, estudantes e gestores veem e usam: as ferramentas e aplicações (o que a IA faz), a experiência de uso (quem usa e como) e a adoção (as condições para o uso acontecer, incluindo assinaturas e licenças). Segundo Krueger e Jackson (2026, p. 11), é a parte mais visível do investimento, mas só uma parte do custo do ciclo de vida."
  - `c234`: "As respostas sobre tecnologia, pagamento e licença alimentam a camada 2; as de dispositivos e internet, a camada 3 (infraestrutura e dispositivos); e o nível de adaptação, a camada 4 (integração de dados e sistemas). Krueger e Jackson (2026, p. 7–8) lembram que uma ferramenta gratuita ou doada não elimina os custos do ciclo de vida."
  - `c37`: "As sete camadas do quadro de Krueger e Jackson (2026, p. 11): 1 governança; 2 aplicações, experiência de uso e adoção; 3 infraestrutura e dispositivos; 4 integração de dados e sistemas; 5 cibersegurança, privacidade e conformidade; 6 formação e capacidade das equipes; 7 operação, suporte e sustentabilidade. A correspondência entre os componentes de custo da ferramenta (K1 a K6) e as camadas é uma convenção desta ferramenta."
- Referência comum (`REF_TCO`): texto "Krueger, K. e Jackson, F. para CoSN (2026). Beyond the price tag: Rethinking total cost of ownership for AI in education systems. Paris: UNESCO." + link "Abrir o documento na UNESDOC" para `https://unesdoc.unesco.org/ark:/48223/pf0000399348` (`target="_blank" rel="noopener"`) + "Documento encomendado pela UNESCO; as opiniões são dos autores."
- O título do documento fica em inglês em todos os idiomas (`<cite data-notr>`).

### D.6 Mandala

SVG `viewBox="0 0 300 300"`, centro (150, 150):
- Fase 1: disco de raio 0–48 em 3 setores (1.1, 1.2, 1.3).
- Fase 2: anel 52–86 em 4 setores (2.0, 2.1, 2.2, 2.3).
- Fase 3: anel 90–118 em 3 setores (3.1, 3.2, 3.3).
- Anel externo 124–138 em 7 setores (camadas 1–7), rótulos 1–7 em r = 147.
- Estados de cada setor de passo (`data-setor="<id do passo>"`): concluído → classe `m-ok`, preenchimento `var(--ok)` com opacidade 0,85; em andamento → `m-and`, cor da fase com opacidade 0,35; não iniciado → `m-vazio`, sem preenchimento e contorno da cor da fase. Passo aberto: contorno `var(--focus)` 2,5 px. Nenhum vermelho.
- Setor de camada fica `m-ok` quando os passos que a alimentam estão concluídos: 1 ← 1.3; 2 ← 2.1, 2.2, 2.3; 3 ← 2.3, 3.1; 4 ← 2.3, 3.1; 5 ← 3.3; 6 ← 3.3; 7 ← 3.2, 3.3. Caso contrário, `m-vazio`.
- Cada setor é `<a href="#" data-ir="fase:passo">` com `<title>` ("1.3 Governança de IA na educação · concluído").
- Legenda abaixo: "Verde: concluído. Cor clara: em andamento. Contorno: ainda não iniciado. Centro: fase 1; anéis: fases 2 e 3; anel externo: as sete camadas do custo total ⓘ."
- Stepper: cada fase ganha classe `feita` (fundo `--ok-bg`, número ✓) quando todos os seus passos estão concluídos; barra de progresso verde.

### D.7 Painel lateral

De cima para baixo:
1. "Seu progresso": as três fases, cada uma com "n de m passos" e ✓ verde quando completa (botões que abrem a fase).
2. Mandala e legenda.
3. "Seu caso": Lugar; Estudantes (total); Aplicações (rótulos das tarefas, até 3, "+N"); Teste (PoC, piloto ou "a recomendar"); Tecnologia (rótulo de `tipoTec`).
4. "Estimativa ilustrativa" (só quando `tarefas` e `tipoTec` estão respondidos): "Ano 0 (prova de conceito ou piloto)" e "Custo total do ciclo (H anos)", em `grande()`, com "Valores ilustrativos".
5. Botão primário "Gerar plano de contratação"; abaixo, "Salvo neste navegador" e os links "Exportar caso" / "Importar caso".
Removidos: "Resultado por fase", perfil de risco, texto da legenda antiga.

### D.8 Boas-vindas e cabeçalho

- `boasVindas()`: eyebrow "Como funciona"; título "Do contexto ao plano de contratação, em três fases"; texto "Você descreve a sua rede, o problema e o que quer que a IA faça, escolhe entre prova de conceito e piloto e define como vai adotar e pagar a tecnologia. No fim, um clique gera o plano de contratação, com custo, compra e recomendações de política. Os valores são ilustrativos."; lista das três fases; botões atuais.
- `shell.html`: subtítulo da marca "Do contexto ao plano de contratação: aplicações, adoção e custo do seu caso".

---

## E. Modelo de dados, migração e exemplos

### E.1 Estado `S` (v9)

```
S = {
  versao: 9,
  caso: CASO_VAZIO (abaixo),
  ctx: { nivel, nivelOutro, local, etapas: { <id>: { on, escolas, anos: [], alunos, soTotal } }, dominio, comps: [], compOutro, olhando },
  resp: { 'g-comite'|'g-politica'|'g-legislacao'|'g-dados'|'g-etica'|'g-compras': 'sim'|'parcial'|'nao'|'nao_sei' },
  respC: { <campo>: true },
  feitos: { '3c': true, ... },
  exemplo: 'novo'|'A'|'B'|'C'|'D'|'editado',
  fase: 'contexto'|'piloto'|'custo'|'', passo: '1a'…'3c'|'', vista: ''|'plano', boasVindas,
  info: { c1: bool, ... },            // ⓘ abertos (não exportado)
  custo: { base, cfg, editado, conta, avancado, abertos, alts, lambda, estratos },
  moeda: { cod, taxa }, lang,
}
```
Removidos: `S.piloto` (vai para `caso.piloto`), `S.pular`, `S.checks`, `S.sub`, `S.tab`, `S.dimAberta`, `S.pdAberto`.

`CASO_VAZIO` (P1, `casos.js`):
```
{ titulo: '', situacao: 'nova', problema: '', resultado: '', linhaBase: 'nao', alternativa: '',
  impactos: [], impactoOutro: '',
  teste: '', tarefas: [], tarefaOutra: '',
  usuarios: [], afetados: [], consequencias: ['nenhuma'], frequencia: 'semanal',
  tipoTec: '', pagamento: '', licenca: '', adaptacao: '', infra: '',
  piloto: { escolas: '', participantes: '', meses: '' }, arquiteturaManual: '',
  elegiveis: '', expansao: 'ano1', horizonte: 3, pagaDepois: '', fonte: '',
  ajustes: {}, degrau: 2 }
```

### E.2 Chave e migração

- `CHAVE = 'aiedu-procurement-v9'`. `carregar()` (P4): lê a chave v9; se não houver e existir `navegador-ia-educacao-v4`, aplica `migrarV8(o)` e grava na v9 (não apaga a antiga). Depois de carregar, `S.caso = Object.assign(clone(CASO_VAZIO), S.caso)`.
- Exportação JSON: `{ app: 'ai-education-procurement-tool', formato: 9, salvo, exemplo, caso, ctx, resp, respC, feitos, custo, moeda, lang }`. Importação aceita `formato: 9` e `app: 'navegador-ia-educacao'` (`versao` 4) com `migrarV8`. Outro formato: toast "Este arquivo não é um caso exportado pela ferramenta."
- `migrarV8(o)` (P4, `app.js`), regra por regra:
  - `ctx.etapas[id]`: `porAno === true` → `soTotal = false` (mantém `anos`); `porAno` falso e `alunos > 0` → `soTotal = true`; apaga `porAno`.
  - `resp`: `g-comite` fica; se ausente, recebe `g-equipe`; apaga `g-equipe`. `g-orcamento` → `caso.fonte` (`sim`→`sim`, `parcial`→`parcial`, `nao`→`nao`); se ausente, `s-orcamento` com o mesmo mapa. Apaga `g-orcamento`, `g-avaliacao` e todo `r-*`, `p-*`, `i-*`, `s-*`. Valor `na` → `nao_sei`.
  - `caso.classes` → `tarefas`: `tutoria` ou `recomendacao` → `tutoria`; `previsao` ou `apoio` → `alerta_precoce`; `avaliacao` → `feedback_redacao`; `automacao` ou `agentes` → `rotinas`; `classificacao` com `usuarios` incluindo `administrativo` → `duvidas`; `geracao` (se nada acima) → `materiais`. Sem respC se o resultado for vazio.
  - `arquitetura` ≠ `indefinida` → `arquiteturaManual = arquitetura`; `tipoTec`: saas/api → `paga`, ow → `aberta`; `adaptacao`: saas → `integracao`, api/ow → `sob_medida` (níveis de referência: o custo migrado fica neutro); `pagamento`: `pilotoGratuito` → `gratuito`; senão saas → `institucional`, api/ow → `consumo`. `licenca` fica `''`.
  - `S.piloto` → `caso.piloto`. `teste` = `situacao === 'testar'` → `recomendar`, senão `piloto`. `situacao`: `testar` → `nova`; `incidente` → `renovar`.
  - `alternativaSemIA` → `alternativa` (`true` → `sim`, `false` → `nao`).
  - `horizonte` = `S.custo.cfg.opc.H` se existir, senão 3. `expansao = 'ano1'`.
  - Apaga: `populacao`, `capacidade`, `classes`, `autonomia`, `dados`, `treino`, `vulneraveis`, `idiomas`, `verificabilidade`, `contestacao`, `reversibilidade`, `cumulativo`, `alcance`, `arquitetura`, `pilotoGratuito`.
  - `respC`: mantém as chaves de campos que continuam; marca `tarefas`, `tipoTec`, `pagamento`, `adaptacao`, `teste`, `fonte` quando vieram de valores respondidos na v8.
  - `S.custo = { base: 'caso', cfg: null, editado: false }` (premissas editadas na calculadora da v8 são descartadas; toast "Caso da versão anterior convertido. Revise as respostas de adoção.").
  - `feitos = {}`, `fase = 'contexto'`, `passo = '1a'`, `vista = ''`; apaga `pular`, `checks`.

### E.3 Exemplos A–D (P1, `casos.js`; `CTX_EX` e `RESP_EX` passam para `casos.js`)

Textos `titulo`, `problema`, `resultado` e `CTX_EX.local/olhando/compOutro` ficam como na v8.

| Campo | A Copiloto para professores | B Tutor de matemática | C Alerta precoce de abandono | D Assistente para solicitações |
|---|---|---|---|---|
| etapas (escolas; anos) | fund2 420; [41.000, 40.000, 40.000, 39.000] · medio 380; [48.000, 47.000, 45.000] | fund2 600; [40.000, 38.000, 37.000, 35.000] | medio 300; [28.000, 27.000, 25.000] | infantil 120; [12.000, 18.000] · fund1 150; [9.000 × 5] |
| situacao | proposta | nova | nova | orcamento |
| impactos | tempo_docente | aprendizagem, desigualdade | permanencia | gestao |
| linhaBase / alternativa | parcial / sim | sim / sim | sim / nao | parcial / sim |
| teste | piloto | piloto | recomendar | poc |
| tarefas | planos_aula, materiais | tutoria | alerta_precoce | duvidas |
| usuarios / afetados | professores / professores, criancas | estudantes, professores / criancas, professores, familias | gestores, professores / criancas, familias | administrativo, gestores / servidores |
| consequencias / frequencia | nenhuma / semanal | formativa, apoio_est / continua | apoio_est, recursos / semanal | organizacao / diaria |
| tipoTec / pagamento / licenca | paga / institucional / assinatura | aberta / consumo / aberta | nao_sei / institucional / nao_sei | paga / gratuito / termos |
| adaptacao / infra | integracao / sim | sob_medida / complementar | integracao / sim | sob_medida / sim |
| arquitetura derivada | saas (preset A, K3 neutro) | ow (preset C, K3 neutro) | saas (presumida) | api (preset B, K3 neutro) |
| piloto (escolas, participantes, meses) | 20, 600, 4 | 20, 6.000, 4 | 10, 120, 6 | —, 150, 3 |
| elegiveis / expansao / horizonte | 12.000 / ano1 / 3 | 150.000 / ano2 / 3 | 2.500 / ano1 / 3 | 3.000 / ano1 / 3 |
| pagaDepois / fonte | rede / parcial | rede / nao | indefinido / parcial | rede / sim |
| resp g-comite, politica, legislacao, dados, etica, compras | parcial, sim, sim, sim, parcial, parcial | parcial, nao, sim, parcial, nao, parcial | sim, parcial, sim, parcial, nao, nao | nao, nao, parcial, sim, nao, parcial |
| nível de risco esperado | moderado | elevado | elevado | limitado |

Observações conferidas: A reproduz E0 = 600 e 4 meses do preset A; B reproduz `demanda.E = [6.000, 50.000, 150.000, 150.000]` e 4 meses do preset C; D reproduz E0 = 150 e 3 meses do preset B.

---

## F. i18n, testes e PDF

### F.1 i18n

- O texto PT continua sendo a chave. Cada pacote cria os seus arquivos `i18n/v9_<pacote>_{en,es,fr}.json` (P1: `v9_p1`, P2: `v9_p2`, P3: `v9_p3`, P4: `v9_p4`), só com as chaves novas ou alteradas que ele introduz. O `build.sh` (P4) passa a mesclar, nesta ordem: `<l>.json`, `extra_<l>.json`, `v9_*_<l>.json` (ordem alfabética). Nenhum pacote edita `en.json`, `es.json`, `fr.json` ou `extra_*.json`.
- Glossário fixo (todos os pacotes):

| PT | EN | ES | FR |
|---|---|---|---|
| Prova de conceito | Proof of concept | Prueba de concepto | Preuve de concept |
| Piloto | Pilot | Piloto | Pilote |
| Prova de conceito ou piloto | Proof of concept or pilot | Prueba de concepto o piloto | Preuve de concept ou pilote |
| Aplicações | Applications | Aplicaciones | Applications |
| Experiência de uso | User experience | Experiencia de uso | Expérience d'utilisation |
| Adoção | Adoption | Adopción | Adoption |
| Custo do ciclo de vida | Life-cycle cost | Costo del ciclo de vida | Coût du cycle de vie |
| Escala e horizonte | Scale and time horizon | Escala y horizonte | Échelle et horizon |
| Fonte de recursos | Source of funds | Fuente de recursos | Source de financement |
| Estimativa de custo | Cost estimate | Estimación de costos | Estimation des coûts |
| Plano de contratação | Procurement plan | Plan de contratación | Plan d'achat |
| Gerar plano de contratação | Generate procurement plan | Generar el plan de contratación | Générer le plan d'achat |
| Custo e compra | Cost and procurement | Costo y compra | Coût et achat |
| Política e governança | Policy and governance | Política y gobernanza | Politique et gouvernance |
| Camada | Layer | Capa | Couche |
| Problema e impacto | Problem and impact | Problema e impacto | Problème et impact |
| Onde e para quem | Where and for whom | Dónde y para quién | Où et pour qui |

- Ordem de grandeza das chaves novas: P1 ≈ 90 (opções `OPC` novas, tarefas, impactos, alertas e motivos), P2 ≈ 140 (perguntas, dicas, exemplos, aberturas, ⓘ, mandala, painel, rodapés), P3 ≈ 110 (títulos e textos do plano, A3, B1–B9), P4 ≈ 25 (toasts, migração, rótulos de números). Frases com números usam o marcador `{0}` como hoje (`tr()` normaliza).
- Strings compostas por concatenação devem ser evitadas; quando inevitáveis, cada parte é uma chave própria (como já é feito).

### F.2 Testes

| Teste | Dono | O que verifica |
|---|---|---|
| `tests/test_custos_v2.js` | P1 (não editar) | 125 verificações verdes, sem mudança |
| `tests/test_v9_motor.js` (novo, node) | P1 | (1) neutralidade: presets com `adaptacao = { fK31: 1, fK32: 1 }` e `cedidoUso = [0,0,0,0]` dão o mesmo `ctEco`, `tot` e `orcamento().dot` que sem os campos; (2) `fatoresAdaptacao` reproduz a tabela de B.10 (K3 e total de cada preset em cada nível, tolerância 1e-6) e K3 é não decrescente de `config` a `sob_medida`, estritamente maior em `sob_medida` que em `config`; K6.1 acompanha K3.1; (3) `cedidoUso = [1,0,0,0]` no preset B: `dot[0]` cai, `ctEco` não muda (modo padrão com doados), `fac.doado > 0`; (4) `somaPorCamada`: soma das 7 camadas = `ctEco` e Σ `ano0` = `ecoAno[0]`; (5) `derivarArquitetura` para as combinações de B.8; (6) `casoEfetivo` de cada tarefa isolada reproduz classes e autonomia da tabela `TAREFAS`; (7) exemplos A–D: arquitetura derivada, nível de risco esperado (E.3), E0 e meses do Ano 0; A e D com K3 iguais aos presets A e B; (8) `perfisSugeridos(['tutoria'], ['fund2'])` = usuarios estudantes+professores; troca `criancas` → `adultos_est` com etapas só `superior`; (9) `recomendarTeste`: C → `poc` (tecnologia não escolhida); A → `piloto`; (10) `alertas` de um caso em branco não tem bloqueio de capacidade. O teste define `global.LOC = () => 'pt-BR'` e carrega `custos.js`, `framework.js` e `casos.js` como globais |
| `tests/test_v9_fluxo.py` (novo, playwright) | P2 | percurso em `pt` e `en`, desktop 1400 e celular 400: sem erro de console e sem rolagem horizontal; numeração única e completa (todo `.q` tem `.qn` com padrão `\d\.\d(\.\d+)?`); ausência de `.vpill`, `.resultado`, `.pds-fase`, `[name=autonomia]`, `[data-fm=dados]`, `[data-fb=vulneraveis]`, `[data-fb=idiomas]`, `[name=verificabilidade]`, `[name=contestacao]`, `[data-fm=capacidade]`; 2.0 é o primeiro item da fase 2; marcar `tutoria` pré-marca `estudantes` em 2.2 com etiqueta "sugerido"; mandala `[data-setor="1a"]` vira `m-ok` ao completar 1.1 e nenhum elemento usa a cor `--crit`; ⓘ do 1.3 abre nota com link para a URL da UNESDOC; cartão de domínio mostra o lema em `<b>`; capturas em `/tmp/claude-0/v9_fx_*.png` |
| `tests/test_v9_plano.py` (novo, playwright) | P3 | carregar A, B, C, D e um caso em branco; clicar `[data-act="gerar-plano"]`; `#plano` tem os blocos "Custo e compra" e "Política e governança" nessa ordem, as seções A1–A8 e B1–B9, nenhuma seção "Suas respostas"; C mostra a recomendação "prova de conceito" com motivo; caso em branco mostra "Plano parcial" com a lista numerada; A3 tem 7 linhas de camada e o link da UNESDOC; baixar o PDF em `en` e conferir pelo texto (pdftotext) "Procurement plan", "Cost and procurement", "Policy and governance", a URL e nenhuma palavra em português da lista do `test_idiomas.py` |
| `tests/test_v9_numeros.py` (novo, playwright) | P4 | digitar `160000` em 1.1.5 em `pt`, `en`, `fr` → "160.000", "160,000", "160 000"; estado = 160000; cursor no fim; inserir dígito no meio mantém o cursor depois do dígito; campo `dec` da calculadora aceita "0,5" em PT e "0.5" em EN; ✓ visível (`.ok-in` com `display` ≠ `none`) só quando preenchido; migração: importar cada `tests/fixtures/caso_v8_*.json` e carregar `localStorage_v8_branco_parcial.json` na chave antiga → sem erro, `S.versao === 9`, `caso.tarefas` e `caso.fonte` conforme E.2, `ctx.etapas.fund1.soTotal === true`, `resp` sem `g-equipe`, exportar e reimportar dá o mesmo `caso` |
| `test_idiomas.py` (atualizar) | P4 | percorre fases `contexto`, `piloto`, `custo` e passos novos, abre todos os ⓘ e `details`, abre o plano e `trFundo(secoesPlano())`; meta: 0 restos em EN, ES e FR |
| `test_fluxo.py`, `test_resumo.py`, `test_fn.py`, `test_fn2.py`, `test_ui.py`, `tests_custos_vs_python.js` | P4 | mover para `tests/obsoletos/` (dependem de vereditos, abas e da v1 do motor) |

### F.3 PDF

Mudanças descritas em C.3. Impactos técnicos (P3): `secoesResumo` vira `secoesPlano`; `ALERTA` e `ATENCAO` passam a colorir "Resolver antes de contratar" e "Tratar no plano"; nova função `faixaBloco(titulo)` desenha a faixa dos blocos A e B; `doc.textWithLink` para a URL; nome do arquivo `procurement-plan-<slug>.pdf`; `PDF_TROCA` acrescenta `ⓘ` → `(i)` (o ✓ já vira `v`; nas tabelas do plano não se usa ✓).

---

## G. Pacotes de trabalho, propriedade de arquivos e integração

### G.1 Pacotes (executáveis em paralelo)

**P1 — Modelo do caso e motor de custo** (só lógica, testável em node)
- Arquivos exclusivos: `src/custos.js`, `src/casos.js`, `src/framework.js`, `tests/test_v9_motor.js`, `i18n/v9_p1_*.json`. `tests/test_custos_v2.js` e `tests/numeros_v1.json` não podem ser editados.
- Tarefas: B.10 (motor, `CAMADA_DE_S`, `somaPorCamada`); `framework.js`: `OPC` novos (`impactos`, `teste`, `tarefas`, `tipoTec`, `pagamento`, `licenca`, `adaptacao`, `infra`, `expansao`, `horizonte`, `pagaDepois`, `fonte`, `simNao`), `OPC.situacao` sem `testar` e `incidente`, `OPC.consequencias` e `OPC.linhaBase` com os novos textos (ids iguais), `TAREFAS`, `IMPACTO_TAREFAS`, `perfisSugeridos`, `casoEfetivo`, `derivarArquitetura`, `recomendarTeste`, ajustes de `alertas`; `casos.js`: `CASO_VAZIO`, `CASOS`, `CTX_EX`, `RESP_EX`, `ADAPTACAO`, `fatoresAdaptacao`, `PREMISSAS_K1`, `cfgDoCaso` v9. Exportar tudo em `module.exports` (o build retira as linhas `if (typeof module…`).

**P2 — Percurso** (interface das fases)
- Arquivos exclusivos: `src/fluxo_dados.js`, `src/fluxo.js`, `src/fluxo.css`, `src/shell.html`, `tests/test_v9_fluxo.py`, `i18n/v9_p2_*.json`.
- Tarefas: A.1 (FASES, PASSOS, aberturas), B.1–B.9 (renderização de todas as perguntas a partir de um registro declarativo `CAMPOS` em `fluxo_dados.js`: `{ n, id, onde: 'ctx'|'caso'|'resp', tipo, opc, t, h, ex, opcional }`), `QUESTOES_G`, `RESP_G`, `CAMADAS_INFO`, `REF_TCO`, D.1, D.2, D.4–D.8, eventos `data-ctx*`, `data-etapa`, `data-comp`, `data-resp`, `data-info`, `gerar-plano`, `voltar-percurso`, `pdf`, CSS de `.q`, `.qn`, `.campo`, `.ok-in`, `.info`, `.info-nota`, mandala, stepper, painel e rodapés. Apagar o que D.1 lista.

**P3 — Plano de contratação e PDF**
- Arquivos exclusivos: `src/resumo.js` (reescrito), `src/plano_dados.js` (novo: textos de recomendação `RECS` com as ações de `r-*`, `p-*`, `i-*`, `s-*`, `g-orcamento`, `g-avaliacao` e `ACOES_G`, cada uma com `{ id, camada, texto, quando(ce, p) }`; linhas da tabela A3; títulos de blocos e seções), `tests/test_v9_plano.py`, `i18n/v9_p3_*.json`.
- Tarefas: C inteiro, F.3. CSS do plano: P3 não edita `fluxo.css`; as classes usadas no plano são as já existentes (`.res-sec`, `.res-topo`, `.tw`, `.req`, `.cat`, `.kpis`, `.note`, `.vazio`, `.mais`) mais duas novas que P2 cria em `fluxo.css` a pedido deste plano: `.bloco-faixa` (faixa de título dos blocos A e B: fundo `--f3`, texto branco, mesmo tamanho de `h3`) e `.parcial` (aviso de plano parcial: borda `--warn`, fundo `--warn-bg`).

**P4 — Estado, entradas numéricas, idiomas e integração**
- Arquivos exclusivos: `src/app.js`, `src/i18n.js`, `src/custos_ui.js`, `build.sh`, `test_idiomas.py`, `tests/test_v9_numeros.py`, `tests/fixtures/*` (copiados de `plano/fixtures_v8/`), `tests/obsoletos/*`, `i18n/v9_p4_*.json`.
- Tarefas: E.1, E.2, D.3; `inputNum`, `fmtEntrada`, `lerNumero` em `i18n.js`; formatador global e manipuladores `data-f`, `data-fm`, `data-fb`, `data-fn`, `data-cfg` etc. em `app.js` (com conversão numérica de `horizonte`), chamando o gancho `aoMudarCampo(campo)` de P2 depois de gravar; `casoAtual()`, `perfil()`, `cfgAtual()` com o caso efetivo; `dadosCaso`/`importarCaso` e eventos `exp-json`, `copiar-json`, `imp-json`, `copiar`, `dl-*`; `dadosRelatorio = () => secoesPlano()`; prompt do Claude (B.2); apagar funções mortas da era das abas (`renderCaso`, `renderDiag`, `renderPercurso`, `renderListas`, `renderRelatorio`, `cardPD`, `lista`, `progressoPD`, `rota`, `pdsDaRota`) depois de conferir por `grep` que nada mais as usa; calculadora com `inputNum` e, na seção de premissas, dois campos "Adaptação: multiplicador de K3.1" e "…de K3.2" (`data-cfg="adaptacao.fK31"`, `…fK32"`) quando `cfg.adaptacao` existir; `build.sh` com `src/plano_dados.js` (depois de `fluxo_dados.js`) e a mescla dos `v9_*`; F.2 da sua parte.

### G.2 Contratos entre pacotes (nomes e assinaturas que cada um pode usar sem esperar o outro)

| Fornece | Nome | Assinatura / forma | Usado por |
|---|---|---|---|
| P1 | `CASO_VAZIO`, `CASOS`, `CTX_EX`, `RESP_EX` | E.1, E.3 | P2, P4 |
| P1 | `OPC.*` novos | listas `[id, texto, subtexto?]` | P2, P3 |
| P1 | `TAREFAS`, `IMPACTO_TAREFAS` | B.5, B.2 | P2, P3 |
| P1 | `perfisSugeridos(tarefas, etapasIds)` | → `{ usuarios, afetados, consequencias, frequencia }` | P2 |
| P1 | `casoEfetivo(c, tot)` | → caso com campos legados (B.8) | P4 (`casoAtual`), P3 |
| P1 | `derivarArquitetura(c)`, `recomendarTeste(ce)` | B.8 | P2 (2.3 details), P3 |
| P1 | `cfgDoCaso(ce, perfil)`, `fatoresAdaptacao(nivel, base)` | B.10 | P4 (`cfgAtual`), P3 (premissas) |
| P1 | `CAMADA_DE_S`, `somaPorCamada(av)` | A.3, B.10 | P2 (3.3), P3 (A2, A3) |
| P2 | `totaisCtx()`, `etapasAtivas()`, `alunosEtapa(id)` | como hoje; `totaisCtx` devolve também `etapas: [ids]` | P3, P4 |
| P2 | `respondido(campo)`, `passoFeito(id)`, `faltasTodas()` | `faltasTodas()` → `[{ n, texto, ir: 'fase:passo:campo' }]` | P3 |
| P2 | `questoesGov()` | → `QUESTOES_G` `[{ id, n, t, h, ex }]` | P3 |
| P2 | `CAMADAS`, `CAMADAS_INFO`, `REF_TCO`, `FASES`, `PASSOS`, `CAMPOS` | D.5, A.1, B | P3, P4 |
| P2 | `numerosCusto()` | `{ av, ind, orc, H, piloto, anual, porAluno, total, camadas: somaPorCamada(av) }` | P3 |
| P2 | `aoMudarCampo(campo)` | chamado por P4 após gravar `S.caso[campo]`; devolve `true` se já redesenhou | P4 |
| P2 | `render()`, `atualizarLaterais()`, `abrirFase(f, p, alvo)`, `irPara(id)`, `aplicarExemploFluxo(k)` | como hoje; `render()` chama `renderPlano()` quando `S.vista === 'plano'` | P3, P4 |
| P3 | `renderPlano()`, `secoesPlano()`, `abrirPlano()`, `baixarPDF()`, `NOME_FERRAMENTA` | C | P2 (botões), P4 (`dadosRelatorio`, `copiar`) |
| P4 | `inputNum({ id, attrs, valor, casas, rotulo, ph })` | → `<span class="campo"><input type="text" inputmode … data-num …><span class="ok-in" aria-hidden="true">✓</span></span>` | P2, P4 |
| P4 | `fmtEntrada(x, casas)`, `lerNumero(s)` | D.3 | P2 |
| P4 | `casoAtual()`, `perfil()`, `cfgAtual()`, `salvar()`, `toast()`, `esc()`, `radios()`, `chips()` | `radios`/`chips` passam a emitir o ✓ por CSS (sem mudar assinatura) | P2, P3 |
| P4 | `renderCustos()`, `renderCustosResultados()`, `grande()`, `din()`, `mil()`, `pct()`, `unidMil()`, `COR_K`, `garantirOpc()` | como hoje (`custos_ui.js`) | P2 (3.3, painel), P3 (A2) |
| P1 | `fmtInt()`, `NIVEL_NOME`, `NIVEL_CRIT`, `DIMENSOES`, `FORMAS_SUP`, `CONTESTACAO`, `SUPERVISAO`, `MUDANCA`, `SEVERIDADE`, `METRICAS`, `CONTRATO`, `DADOS_REQ`, `PACOTE`, `LOCKIN`, `PDS`, `DOSSIE`, `extrasPD()`, `alertas()`, `formaSupervisao()`, `anexoIII()` | como hoje (`framework.js`), recebendo o caso efetivo | P3 |

Arquivo compartilhado por natureza: nenhum. Se P2 precisar de um utilitário de P4 que ainda não existe, codifica contra a assinatura acima.

### G.3 Ordem de integração

1. P1 (rodar `node tests/test_custos_v2.js` e `node tests/test_v9_motor.js`).
2. P4 (build com o novo `build.sh`; ainda pode falhar em tempo de execução até P2 chegar).
3. P2 (conferir que `CTX_EX`/`RESP_EX` saíram de `fluxo_dados.js` para não haver `const` duplicada).
4. P3.
5. `bash build.sh` → "syntax ok"; rodar todos os testes da F.2 em `/home/claude/app`; corrigir só as costuras entre contratos; revisão visual das capturas em desktop, celular e tema escuro.

### G.4 Lista de verificação: cada linha da avaliação → critério testável

| # | Linha da avaliação | Critério de aceitação (teste) |
|---|---|---|
| 1 | "use múltiplos agentes" | Processo; quatro pacotes paralelos (G.1) |
| 2 | "clica em um botao e ele gera o procurement plan" | `[data-act=gerar-plano]` no painel, stepper, rodapé da fase 3 e chamada final; clique mostra `#plano`; PDF em EN contém "Procurement plan" (`test_v9_plano`) |
| 3 | "break down the number of students by grade" | Marcar `fund2` mostra 4 campos por ano sem checkbox; total = soma; "Informar só o total da etapa" alterna (`test_v9_fluxo`) |
| 4 | "pontos e vírgulas nos valores de entrada" | 160000 → "160.000" (pt), "160,000" (en), "160 000" (fr); estado numérico; cursor estável; calculadora formatada (`test_v9_numeros`) |
| 5 | "check quando respondido também dentro do valor" | `.ok-in` visível só em campo preenchido; `.q.ok .qn` com ✓; botão escolhido do segmentado com ✓ (`test_v9_numeros`, `test_v9_fluxo`) |
| 6 | "pergunta did you?" | Textos EN das seis perguntas 1.3 começam com "Does your network have", "Do you have" ou "Did you" (`test_v9_fluxo`, em `en`) |
| 7 | bloco colado de legislação e política de dados | `g-legislacao` e `g-dados` no novo formato, com "Example:" e sem etiqueta "essential" |
| 8 | "dar um exemplo… vc tem uma ai education policy?" | Toda pergunta 1.3 tem linha de exemplo; `g-politica` EN = "Do you have an AI in education policy or strategy?" |
| 9 | "adicionar o número das perguntas" | Todo `.q` tem `.qn` com número único no padrão `fase.passo.n` ou 2.0 |
| 10 | unir departamento e instância | `QUESTOES_G` sem `g-equipe`; `g-comite` com "equipe ou instância" |
| 11 | não usar orçamento e monitoramento no início | 1.3 sem `g-orcamento` e `g-avaliacao`; `fonte` em 3.2.2; monitoramento em B8 do plano |
| 12 | "etapa de prova de conceito antes do piloto" | Fase 2 "Prova de conceito ou piloto"; 2.0 com três opções, antes de 2.1 |
| 13 | destaque para "Learning to know and do" | Cartão de domínio com o lema em `<b>` e o nome como rótulo secundário, sem fonte menor que `.hint` |
| 14 | recomendações e diagnósticos para o fim exportado | No percurso: nenhum `.vpill`, `.alert.bloqueio`, `.alert.atencao`, `.nivel-card`; no plano: B5 com perfil e pontos de atenção |
| 15 | sem resultado parcial por fase | Nenhum `#res-contexto`, `#res-piloto`, `#res-custo`; rodapé de fase só com progresso e botão |
| 16 | retirar funções não terceirizáveis | Sem `[data-fm=capacidade]`; `alertas(casoEfetivo(CASO_VAZIO))` sem bloqueio de capacidade; B2 do plano lista as cinco funções |
| 17 | "tirar a parte de perguntas no final" | Sem `details.pds-fase`; plano sem "Suas respostas"; critérios de PD em B9 como lista |
| 18 | mandala verde para o que foi feito | Concluir 1.1 → `[data-setor="1a"]` com classe `m-ok`; nenhum `stroke` `--crit` na mandala; camada 1 verde quando 1.3 completo |
| 19 | "pilot" | Cabeçalho (sem critério próprio; coberto por 12) |
| 20 | "orientado a educação e não a IA" | 2.1 mostra tarefas educacionais; textos de `OPC.classes` não aparecem no DOM do percurso |
| 21 | lista com planos de aula e outras + Outra | `OPC.tarefas` com as 10 opções de B.5; "Outra" abre texto gravado em `tarefaOutra` |
| 22 | eliminar grau de autonomia | Sem `[name=autonomia]`; `casoEfetivo` deriva autonomia (teste P1) |
| 23 | ⓘ da camada 1 com referência ao documento | 1.3 com selo "Camada 1" e ⓘ; nota com link `https://unesdoc.unesco.org/ark:/48223/pf0000399348`; abertura sem a frase sobre essenciais |
| 24 | explicar o que é a camada 2 | Abertura da fase 2 com o texto de A.1 e ⓘ `c2` |
| 25 | arquitetura e piloto gratuito cedo demais | 2.1 só com tarefas e nome; arquitetura só no `<details>` do 2.3, derivada; gratuito é opção de pagamento |
| 26 | impacto com opções e "Outro" escrito | 1.2.5 com `OPC.impactos`; "Outro" abre texto `impactoOutro` |
| 27 | PoC e piloto numa etapa, perguntar no início | 2.0 é o primeiro elemento do corpo da fase 2 |
| 28 | opção de sugerir/recomendar | `teste = recomendar`; plano A1 com "Recomendação" e motivos de `recomendarTeste` (C → prova de conceito) |
| 29 | 2.2 já marcada com perfis recomendados | Marcar `tutoria` → 2.2 com `estudantes` e `professores` marcados e etiqueta "sugerido pela tarefa"; desmarcar a tarefa limpa as sugestões não confirmadas |
| 30 | nome "user experience" | Passo 2.2 "Experiência de uso" / EN "User experience" |
| 31 | nome "applications" | Passo 2.1 "Aplicações" / EN "Applications" |
| 32 | tirar "que dados são usados" | Sem `[data-fm=dados]`; dados derivados aparecem em B5 e B6 |
| 33 | tirar pessoas com menor capacidade | Sem `[data-fb=vulneraveis]` |
| 34 | tirar mais de um idioma | Sem `[data-fb=idiomas]`; recomendação de idiomas em B4 quando `idiomas` derivado |
| 35 | nível de adaptação no custo | 2.3.4 existe; `config` → `sob_medida` aumenta `porK.K3` e o Ano 0 do painel; valores de B.10 no teste P1 |
| 36 | verificabilidade e contestação são recomendação | Sem `[name=verificabilidade]` e `[name=contestacao]`; B6 com os seis elementos de contestação quando a saída afeta pessoas |
| 37 | separar custo de policy | Plano com bloco A "Custo e compra" antes do bloco B "Política e governança", na página e no PDF |
| 38 | focar em custo e compra | Bloco A primeiro; estimativa no painel; fase 3 só de custo |
| 39 | regras do piloto são recomendação | Sem passo de regras; B3 no plano |
| 40 | etapa adoption | Passo 2.3 "Adoção" / EN "Adoption" |
| 41 | pública, paga, pagamento, licença… é custo | 2.3.1–2.3.3; teste P1: `paga + institucional → saas`, `consumo → api`, `aberta → ow`, `gratuito` zera o desembolso do Ano 0 e cria linha cedida |
| 42 | 2.5 é recomendação | Sem passo de capacidade mínima; B4 no plano |
| 43 | adoption é o setup do piloto ou da PoC | 2.3.6 com escolas, participantes e meses; `cfgDoCaso` usa E0 = participantes e meses do Ano 0 (teste P1) |
| 44 | usar o TCO do documento para estruturar | Fases e passos com camadas (A.1); A3 com as sete camadas e páginas; anel externo da mandala; ⓘ com o link |

Restrições permanentes (verificar na integração):
- Nenhuma referência nova além do guia do projeto e de Krueger e Jackson (2026); `grep -i "segundo a UNESCO\|a UNESCO recomenda\|UNESCO recommends"` vazio em `src/` e `i18n/`.
- Faixa e anexos dizem que as opiniões não são da UNESCO; nenhum texto fala em nome da UNESCO, OCDE, NIST, UNICEF ou outra instituição.
- Toda estimativa e premissa nova marcada como ilustrativa (painel, 3.3, A2, constantes `ADAPTACAO` e `PREMISSAS_K1` comentadas).
- Nomes de fase, passo e seção sem gerúndio em PT, EN, ES e FR (o lema "Learning to know and to do" não é nome de seção).
- `test_idiomas.py` com 0 restos de português em EN, ES e FR; EN continua idioma inicial.
- Nenhum `font-size` novo abaixo de `.86rem` no CSS e nenhuma redução das fontes do PDF.
- Fundo branco, paleta atual, uma cor por fase (f1–f3).
