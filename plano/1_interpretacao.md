# Interpretação da avaliação da versão 8 (para o planejador)

Fontes lidas: `plano/contexto.md`, `plano/0_feedback_v9.md`, `src/fluxo_dados.js`, `src/fluxo.js`, `src/framework.js` (OPC, perfil, alertas), `src/resumo.js`, `src/app.js`, `src/casos.js` (cfgDoCaso), `src/custos.js` (ARVORE K1–K6), `i18n/en.json` (o usuário leu a interface em inglês e citou os textos em EN) e o texto do documento de Krueger & Jackson (2026), "The Layered TCO Framework" (sete camadas: governance; applications; infrastructure; data; cybersecurity; workforce capacity; ongoing operations; a camada 2 aparece no código como "AI applications, user experience and adoption").

---

## 1. Leitura da intenção geral

O usuário quer que a ferramenta deixe de ser um questionário de prontidão com vereditos a cada fase e passe a ser um **assistente de planejamento de compra centrado em custo e aquisição**, com linguagem de educação e não de IA, que no fim gera, com um clique, um **procurement plan** exportável. Durante o percurso, a pessoa só responde ao que descreve a sua situação e as escolhas do caso (onde, para quem, que impacto quer, o que quer que a IA faça em termos de tarefas educacionais, quem usa e como, se fará uma prova de conceito ou um piloto e como será a adoção: tecnologia pública ou paga, forma de pagamento, tipo de licença, nível de adaptação ao contexto, tamanho e duração), com perguntas diretas no formato "Você tem…? / Você já…?" acompanhadas de exemplo, numeradas e com ✓ quando respondidas. Tudo o que é prescritivo (regras do piloto, capacidade mínima, verificabilidade, contestação, perfil de risco, funções não terceirizáveis, ações recomendadas, impedimentos) sai do percurso e vai para o **fim**, como recomendações e diagnóstico no documento exportado, separando o que é **custo** do que é **política**. A prova de conceito e o piloto viram **uma única fase**, que começa perguntando "PoC ou piloto?" (com a opção "não sei, recomende"), e a camada 2 do TCO estrutura essa fase em três passos: **Applications** (o que a IA vai fazer), **User experience** (quem usa e como) e **Adoption** (o setup da PoC ou do piloto, que é custo). A camada 1 (Governança) continua no início, com ⓘ para o documento da UNESCO. A mandala passa a mostrar **progresso** (verde = feito), e não julgamento.

---

## 2. Tabela de todos os itens da avaliação

Legenda de onde está: arquivo e função ou id; passos no formato atual (1.1 = `1a`, 1.2 = `1b`, 1.3 = `1c`, 2.1 = `2a` … 2.6 = `2f`, 3.1 = `3a` …).

| # | Trecho do usuário | Onde está hoje na ferramenta | Interpretação concreta (o que mudar) | Confiança | Alternativa se a interpretação estiver errada |
|---|---|---|---|---|---|
| 1 | "vou mandar uma avaliacao atualizada. pense bem antes de fazer e executar, use um agente para interpretar…, outro pra planejar… use multiplos agentes" | Processo, não UI | Instrução de processo: interpretar, depois planejar, depois executar com vários agentes, e revisar antes de entregar. Nada a mudar no código. | alta | — |
| 2 | "clica em um botao e ele gera o procurement plan" | `resumo.js` `renderResumo()` ("Resumo e recomendações", botão "Baixar PDF"); `fluxo.js` `chamadaResumo()`, `renderPainel()` (botão "Resumo e recomendações"), `renderStepper()` (item "Resumo") | Um botão claro e sempre visível (painel lateral, stepper e fim do percurso) **"Generate procurement plan"** que monta o documento final e oferece o PDF. A página final e o PDF passam a se chamar **Procurement plan** (PT "Plano de contratação"/"Plano de aquisição"; o nome do produto continua em inglês). O plano reúne: caso e contexto; impacto desejado; aplicação (tarefas); experiência de uso; PoC ou piloto e setup (adoção); custo (piloto e ciclo de vida, por camada do TCO); arranjo de aquisição, requisitos e cláusulas; recomendações e diagnóstico (política separada de custo). | alta | Manter a página de resumo como está e só acrescentar um botão "Gerar procurement plan" que baixa o PDF direto, sem página intermediária. |
| 3 | "break down the number of students by grade" | `fluxo.js` `passo1a()`: por etapa, campo "Estudantes" único e checkbox opcional "Detalhar por ano" (EN "Break down by grade", `data-porano`); `ETAPAS_ENS` tem anos para infantil, fund1, fund2, médio; superior, EJA e profissional não têm anos | Tornar o detalhamento por ano/série **o padrão**: ao marcar a etapa, aparecem direto os campos por ano, e o total da etapa é a soma (somente leitura). Retirar o checkbox ou invertê-lo ("Informar só o total da etapa"). Etapas sem anos (superior, EJA, profissional) continuam com campo único. Rótulo em EN: "Number of students by grade". | média | O usuário só quis que o rótulo do checkbox fosse mais claro ("Break down the number of students by grade"), mantendo-o opcional. |
| 4 | "colocar os pontos e virgulas nos valores de entrada dos valores" | Todos os `<input type="number">`: `numIn()` em `fluxo.js` (escolas, estudantes, anos, piloto), `f-eleg`/`f-alc` em `passo2b()`, entradas `data-cfg`, `data-alt`, `data-faixa`, `taxa` em `custos_ui.js`. `type=number` não mostra separador de milhar | Formatar os números **enquanto se digita**, com separador de milhar e decimal do idioma (PT/ES/FR: 160.000 e 0,5; EN: 160,000 e 0.5). Exige trocar para `type="text" inputmode="numeric|decimal"` com formatação e leitura tolerante ao locale; o estado continua guardando número puro. Vale para quantidades e para valores monetários da calculadora. | alta | Mostrar o valor formatado só fora do campo (ao lado ou ao sair do campo), mantendo `type=number`. |
| 5 | "colocar um check quando respondido tbm dentro do valor" | Hoje só o passo recebe ✓ (`MARCA` em `fluxo.js`, `.passo.st-ok`); a pergunta Sim/Em parte/Não (`segResp`) só pinta o botão; campos numéricos e textuais não indicam nada | Pôr um **✓ em cada pergunta ou campo respondido** (ao lado do número/título da pergunta) **e também dentro do campo de valor** (ícone ✓ no canto direito do input numérico ou de texto quando preenchido; e ✓ no botão escolhido do segmentado). "tbm" = além do ✓ que já existe no passo. | média | "Dentro do valor" = só dentro do botão de resposta escolhido (Yes/Partly/No), sem mexer nos inputs. |
| 6 | "pergunta did you?" | `QUESTOES` g-* (`fluxo_dados.js`), EN impessoal: "Has the applicable legislation been identified?", "Is there an education data policy?" | Reescrever as perguntas que ficam **na segunda pessoa e no formato direto**: "Did you identify…?", "Do you have…?" (PT "Você já identificou…?", "Vocês têm…?"). Vale para todas as perguntas mantidas, não só para as duas citadas. | alta | Usar só "Do you have…?" (sem "Did you"), mantendo a forma impessoal onde soar melhor. |
| 7 | Bloco colado: "Has the applicable legislation been identified? essential / Data protection, AI rules…" e "Is there an education data policy? essential / Who can access…" | `g-legislacao`, `g-dados` (ambas em `ESSENCIAIS`), passo 1.3 | São os exemplos do item 6 e do item 8: mostram o formato atual que deve mudar (pergunta impessoal + dica abstrata + etiqueta "essential"). A etiqueta "essential" pode continuar como marca de prioridade, mas sem bloquear o avanço (ver itens 14–15). | alta | — |
| 8 | "mudar perguntas, dar um exemplo, p[erguntar algo como vc tem uma ai education policy? e mostrar exemplo" | Campo `h` (dica) de cada questão; `segResp()` | Cada pergunta mantida ganha (a) texto direto ("Do you have an AI in education policy?") e (b) um **exemplo concreto do que conta como "sim"**, visível sob a pergunta ("Example: a document approved by the education secretariat that says which AI uses are allowed for teachers and students, who is responsible and how use is reviewed."). Exemplos genéricos e jurisdição-neutros, sem citar documentos inexistentes (restrição do usuário: não inventar referências). | alta | "Mostrar exemplo" = link para um exemplo real de política. Só fazer se houver fonte verificável no guia; senão, manter o exemplo descritivo. |
| 9 | "adicionar o numero das perguntas" | Perguntas sem número; passos numerados (1.1, 1.2…); há contagem "n/total" por camada e "r de n respondidas" no resumo do passo | **Numerar cada pergunta e campo** dentro do passo (1.3.1, 1.3.2… ou Q1, Q2…), também nos campos de 1.1, 1.2 e da fase PoC/piloto. O número aparece no PDF e nos links "ir à pergunta". | média | Mostrar quantas perguntas há no passo ("6 questions") e o progresso, sem numerar uma a uma. |
| 10 | "Is there a department or a designated team…? / Is there a governance body that brings together several areas? unir em uma, talvez deixar a segunda só seja mais adequado" | `g-equipe` e `g-comite`, passo 1.3 | **Fundir em uma pergunta**, partindo da segunda: "Do you have a team or a governance body for AI in education that brings together several areas?" Exemplo: "technology, pedagogy, legal, procurement, data protection and management meet regularly and have a named lead." Remover `g-equipe` de `QUESTOES`, `ACOES`, `RESP_EX`. | alta | Manter só `g-comite` com o texto atual (sem fundir), apagando `g-equipe`. |
| 11 | "nao usar essas duas abaixo no inicio: Does budget planning go beyond the pilot? … Are there monitoring and evaluation mechanisms?" | `g-orcamento`, `g-avaliacao`, passo 1.3 | Tirar as duas da fase 1. `g-orcamento` vai para a parte de custo depois do piloto (sustentabilidade financeira, junto de `s-orcamento`: "Do you have a funding source to keep paying after the pilot?"). `g-avaliacao` vira recomendação final (indicadores, responsáveis, rotina) e alimenta o setup da PoC/piloto como "como vai medir o resultado". | alta | Apagar as duas sem realocar. |
| 12 | "adicionar uma etapa de prove of concept antes do piloto" | Não existe PoC; `OPC.situacao` tem "Testar antes de decidir (Prova de conceito, ambiente controlado ou piloto)"; `APRENDIZAGEM` em `resumo.js` descreve PoC, sandbox e piloto | **Substituído pelo item 27** (o próprio usuário depois pede juntar PoC e piloto numa só fase). Não criar fase separada. | alta | Criar fase "Proof of concept" antes do "Pilot" (só se o usuário recusar a fusão). |
| 13 | "mudar dar o destaque para o learning… Qualification / Learning to know and do" | `DOMINIOS` (`nome` em negrito, `lema` em itálico), `passo1b()` | Inverter o destaque nos três cartões: **"Learning to know and to do"** como título principal, "Qualification" como rótulo secundário (pequeno). Idem "Learning to belong and live together" / "Socialization" e "Learning to be" / "Subjectification". Ajustar também o relatório (`secoesFluxo`, "Tipo de problema"). | alta | Mostrar só o lema e esconder o termo técnico. |
| 14 | "guardar recomendacoes e diagnosticos para o fim que vai ser exportado" | Recomendações e diagnóstico aparecem durante o fluxo: `cartaoResultado()` (veredito e ações por fase), pílula de veredito no cabeçalho da fase (`fase-v`), bolinha no stepper (`sf-v`), lista "Resultado por fase" no painel, `passo2c()` (perfil de risco e alertas), contorno vermelho na mandala, `estadoPasso` (✕ e ! nos passos) | Durante o percurso, **nenhum veredito, ação recomendada, alerta ou impedimento**. O percurso só mostra progresso (respondido/completo). Todo o diagnóstico (vereditos, impedimentos, condições, perfil de risco, alertas, forma de supervisão) e as recomendações aparecem só no procurement plan final e no PDF. Os passos mostram ✓ quando completos, sem ✕/!. | alta | Manter um indicador discreto de "faltam respostas" por fase, ainda sem veredito. |
| 15 | "sem resultado parcial igual Phase 1 result … Conditions (6) … Go to the question" | `cartaoResultado(fid)` em `renderFase()`, `atualizarFaseViva()` | Remover o cartão de resultado ao fim de cada fase. No lugar, um rodapé simples de fase: "Phase complete ✓ → Continue to phase X" (ou "Generate procurement plan" na última). A navegação que hoje mora no cartão (`botoesSeguir`: avaliar próxima fase, pular fases) precisa ser preservada nesse rodapé. | alta | Manter o cartão só com "fase completa / incompleta", sem lista de ações. |
| 16 | "retirar isso aqui, isso é diagnostico: Quais funções que não podem ser terceirizadas já têm responsável interno? Definir a finalidade / …" | `passo1c()` chips `capacidade` (`OPC.capacidade`); usado em `alertas()` (bloqueio se faltam ≥3) | Remover a pergunta do passo 1.3. O conteúdo vira **recomendação fixa** no plano final ("Assign internal owners for the functions that cannot be outsourced: define purpose, accept risks, interpret evidence, decide on continuity, be accountable"). Ajustar `alertas()` para não gerar bloqueio por `capacidade` vazia (hoje um caso em branco nasce com bloqueio). | alta | Mover a pergunta para o fim, como checklist marcável no plano. |
| 17 | "tirar a parte de perguntas no final" | Três candidatos: (a) bloco "Pontos de decisão do guia nesta fase" ao fim de cada fase (`renderFase` → `cardPD`), que traz a pergunta do PD e critérios marcáveis; (b) seção "3 Suas respostas" da página final (`renderResumo`) e "3. Suas respostas" no PDF (`secoesResumo`); (c) a pergunta-veredito do cartão ("Is the context clear enough to plan a pilot?") | Ler na ordem do texto: o comentário vem logo depois do cartão de resultado da fase 1, e o que aparece abaixo dele é o bloco **"Pontos de decisão do guia nesta fase"**, cheio de perguntas e caixas de marcar. Remover esse bloco de todas as fases (e a pergunta do 4.3 `cardPD(9)`); seus critérios entram no plano final como recomendações. Remover também **"Suas respostas"** da página final (lista longa de Sim/Não, que não é recomendação nem diagnóstico); no PDF, trocar por uma tabela curta "Dados do caso" (contexto, tarefas, usuários, setup), sem a lista de respostas. A (c) já sai pelo item 15. | média | Se o usuário só quis (b): manter os PDs no fluxo, recolhidos. Se só quis (a): manter "Suas respostas" no fim. |
| 18 | "fechou uma etapa a mandala tem que ficar verde para o que já foi feito" | `mandala()` em `fluxo.js`: centro = Contexto, anéis = piloto, implantação, escala; fatias = 7 camadas; cor = intensidade de "sim" (`nota`); contorno vermelho se há "não" | A mandala passa a mostrar **progresso**: setor ou centro fica **verde** (`--ok`) quando o passo ou camada correspondente está concluído; em andamento, cor da fase clara; não iniciado, contorno. Sem vermelho (diagnóstico vai para o fim). A geometria precisa refletir a nova estrutura de fases (ver item 27) e a legenda do painel deve ser reescrita. O stepper também pode ficar verde por fase concluída. | alta | Verde só por fase inteira concluída (não por passo). |
| 19 | "pilot" | Linha solta, entre o comentário da mandala e "orientado a educação" | **Cabeçalho**: indica que os comentários seguintes (itens 20–41) são sobre a fase 2 (Pilot). Nada a mudar por si só. | média | Pedido para o nome da fase 2 ser "Pilot" (já é "Pilot" em EN) ou para a mandala marcar o piloto. |
| 20 | "orientado a educacao e nao a ia" | `OPC.classes` (classes técnicas), textos de 2.1 ("Descreva o uso, e não o produto: o que a IA faz, com que autonomia e em que arquitetura.") | Princípio geral para a fase 2: perguntar em **termos de tarefas e situações educacionais**, não em categorias técnicas de IA. As classes técnicas continuam existindo só internamente (para risco, custo e cláusulas). | alta | — |
| 21 | "O que a IA faz? (uma ou mais classes) Geração de conteúdo / … tem que ser o que a gente quer que a ia faça. adicionar lessiona plans, … outras coisas" | `passo2a()` chips `classes` com `OPC.classes`; usado em `temClasse` (`i-rastreio`, `i-geracao`), `alertas()`, `tiposAplicacao()`, relatório | Trocar a pergunta por **"What do you want the AI to do?"** com uma lista de **tarefas educacionais** (multi-seleção) + "Other" com campo de texto. Proposta de lista (a validar com o usuário): Prepare lesson plans; Create or adapt teaching materials and activities; Give feedback on students' writing; Mark or assess assignments; Offer students individual practice and tutoring; Identify students who need support (early warning); Answer questions from staff or families; Support administrative routines (scheduling, communications); Translate or make content accessible; Other. Cada tarefa tem um **mapeamento interno** para classes técnicas (ex.: lesson plans → `geracao`; feedback on writing → `avaliacao`+`geracao`; tutoring → `tutoria`; early warning → `previsao`+`apoio`; answer questions → `geracao`/`automacao`), mais autonomia, dados e consequências padrão. | alta | Manter as classes técnicas e só acrescentar exemplos educacionais em cada uma. |
| 22 | "eliminar Grau de autonomia / Mais autonomia não significa mais maturidade. / Informação / Sugestão / …" | `passo2a()` radios `autonomia`; `faltas('2a')`; `CAMPOS_RISCO`; usado em `perfilAutomatico` (peso, autonomia), `alertas()` (≥5, =6), `formaSupervisao()`, IA (`app.js` l.188), relatório | Remover o campo da tela. A autonomia passa a ser **derivada da tarefa escolhida** (padrão por tarefa, ex.: 2 Sugestão para lesson plans; 3 Recomendação para early warning) e aparece só no diagnóstico final como premissa. | alta | Manter a autonomia como ajuste avançado no plano final. |
| 23 | "Governança de IA na educação layer 1 - TCO…. adicionar um u com a referencia que direcione para o documento da unesco / A governança é a camada que atravessa…" | Passo 1.3 (`PASSOS.contexto` '1c', `passo1c()`), texto introdutório; `CAMADAS[0]` | No título do passo 1.3, indicar **"Layer 1 · Governance"** do TCO e pôr um **ícone ⓘ** ("u" é erro de digitação de "i", tecla vizinha) que abre uma nota curta e o link para Krueger, K. and Jackson, F. for CoSN (2026), *Beyond the price tag*, UNESCO (https://unesdoc.unesco.org/ark:/48223/pf0000399348). Reescrever o parágrafo: tirar "As perguntas marcadas como essenciais impedem avançar quando a resposta é 'Não'" (contradiz o item 14). Padrão ⓘ + referência para toda camada citada (2 a 7). | alta | Link textual "(Krueger & Jackson, 2026)" em vez de ícone. |
| 24 | "2.1 - layer 2… explicar o que é" | Passo 2.1 (`2a`, "O que a solução faz"); a camada 2 só aparece como chip numerado com `title` em "Camadas nesta fase" | No topo da fase PoC/piloto (ou de 2.1), dizer que os passos 2.1–2.3 correspondem à **Layer 2 do TCO: AI applications, user experience and adoption**, com uma frase que explique (o que a IA faz na sala de aula ou na gestão, como as pessoas a usam e o que é preciso para que a usem de fato) e ⓘ com a referência. Mesmo tratamento nos chips "Layers in this phase" (texto visível, não só `title`). | alta | Só um tooltip. |
| 25 | "essas coisas ainda nao sao onde estao, tao mto cedo. no piloto precisa saber o que a ferramenta vai fazer. Intended or proposed architecture … A pilot or free period is on offer." | `passo2a()`: radios `arquitetura` (`OPC.arquitetura`) e checkbox `pilotoGratuito`; `custoPronto()` exige arquitetura ≠ indefinida | Tirar arquitetura e piloto gratuito do 2.1. O 2.1 fica só com **o que a ferramenta vai fazer** (tarefas). A arquitetura vira, no passo **Adoption**, perguntas de compra em linguagem leiga (tecnologia pública ou paga, forma de pagamento, licença), e o código deriva `saas/api/ow` dessas respostas. "Piloto gratuito" vira uma opção de pagamento no Adoption. O custo não pode mais depender de `arquitetura` como pergunta direta. | alta | Manter a arquitetura no 2.1, mas como pergunta opcional ao fim. |
| 26 | "no ionicio, onde tem o problema, tem que trazer que impacto ela quer, tem que selecionar a solucao e ter opçao de outra e ela poder escrever a outra" | Passo 1.2 (`passo1b()`): `dominio`, `comps` (já tem "Outro componente" + texto), `olhando` (texto), `problema` (textarea), `resultado` (textarea "Que resultado se espera?"), `populacao`, `linhaBase`, `alternativaSemIA` | No 1.2, depois do domínio e dos componentes: **"What impact do you want?"** com opções selecionáveis, ligadas ao domínio/componente (ex.: improve reading proficiency; improve maths proficiency; reduce learning gaps between schools; free teacher time for students; faster answers to schools; reduce dropout), mais **"Other" com campo para escrever**, no mesmo padrão de "Outro componente". Substitui (ou precede) a textarea "resultado". "Selecionar a solução" = escolher numa lista, com "Other" escrito; pelo contexto ("no piloto precisa saber o que a ferramenta vai fazer"), a lista de tarefas do item 21 fica no 2.1 com o mesmo padrão "Other + texto". | média | Levar também a escolha da tarefa/solução para o 1.2, logo depois do impacto (ver ambiguidade 6). |
| 27 | "juntar prova de conceito e piloto em uma unica etapa, no inicio perguntar se que fazer uma poc ou um piloto," | Fase 2 "Piloto" (`FASES[1]`, `PASSOS.piloto`); `APRENDIZAGEM` (resumo) já define PoC, sandbox e piloto | Fase 2 vira **"Proof of concept or pilot"** (EN; PT "Prova de conceito ou piloto"). Primeira pergunta da fase: **"Do you want to run a proof of concept or a pilot?"** com opções: Proof of concept (testa se funciona tecnicamente, sem usuários reais); Pilot (testa com usuários reais, em poucas escolas, por tempo limitado); Not sure, suggest one (item 28). A escolha ajusta textos e campos do setup (PoC: sem participantes reais, escopo e prazo curtos; piloto: escolas, participantes, meses). | alta | Perguntar PoC/piloto no 1.1 ("Em que ponto você está"). |
| 28 | "ter uma opçao de sugerir que ele coloca uma recomendacao" | Não existe | Terceira opção: **"Not sure — recommend for me"**. A ferramenta segue com o setup completo (campos de piloto) e o **plano final traz a recomendação** PoC ou piloto, com o motivo (regra simples a partir das respostas: tarefa nova ou não testada, sem linha de base, tecnologia ainda não escolhida → PoC; solução escolhida, linha de base e escolas definidas → piloto). | média | Mostrar a sugestão na hora, ao lado da opção (única exceção à regra "recomendações só no fim"). |
| 29 | "What does the AI do? … para cada uma dessas opçoes ja vem a 2.2 marcada com os perfis recomendados" | `passo2b()` chips `usuarios` e `afetados` (`OPC.usuarios`, `OPC.afetados`), hoje vazios | Cada tarefa do 2.1 tem **usuários e afetados recomendados**, que vêm **pré-marcados** no 2.2 (editáveis). Ex.: lesson plans → usa: Teachers; afeta: Teachers, Children; tutoring → usa: Students, Teachers; afeta: Children, Families; early warning → usa: School managers, Teachers; afeta: Children, Families; answer questions → usa: Administrative staff, Families. Pré-marcar também as consequências e a frequência padrão da tarefa. Pré-marcação não conta como "respondido" até a pessoa confirmar ou passar pelo passo (decidir com `respC`). | alta | Pré-marcar só usuários (não afetados). |
| 30 | "2.2 user experience o nome" | `PASSOS.piloto` '2b' "Pessoas, dados e consequências" (EN "People, data and consequences") | Renomear o passo 2.2 para **"User experience"** (PT "Experiência de uso"). O conteúdo do passo passa a ser sobre como as pessoas usam: quem usa, quem é afetado, com que frequência, o que fazem com a resposta. | alta | — |
| 31 | "2.1 acha um nome como aplications" | `PASSOS.piloto` '2a' "O que a solução faz" | Renomear 2.1 para **"Applications"** (PT "Aplicações"; ou "AI applications"). Juntos, 2.1 Applications, 2.2 User experience e 2.3 Adoption reproduzem a Layer 2 do TCO. | alta | "What the AI will do" como título, com "Applications" de rótulo. |
| 32 | "tirar: What data is used or inferred? No personal data / … Sensitive data…" | `passo2b()` chips `dados`; `faltas('2b')`; `dadosPessoais(c)` controla `r-baselegal`, `r-acordo`, `p-protecao`, `i-finalidade`, `i-dpia` e a pergunta `treino`; `perfilAutomatico` (P.dados) | Remover o campo. Dados passam a ser **inferidos** da tarefa e dos usuários (estudantes usando ou afetados → dados pessoais de estudantes; early warning → dados sensíveis/desempenho detalhado) e aparecem só no diagnóstico e nas cláusulas de dados do plano final. A pergunta `treino` sai do percurso e vira cláusula ("proibir uso dos dados para treinar modelos"). | alta | Manter a pergunta sobre dados no fim, como confirmação no plano. |
| 33 | "tirar: Some people have less ability to notice and challenge errors (disability, language, dependence on the service)." | `passo2b()` checkbox `vulneraveis`; usado em `perfilAutomatico` (P.pessoas) | Remover. No risco, tratar crianças como afetadas = pessoas elevado (já é assim quando estudantes usam e crianças são afetadas). Vira recomendação geral de acessibilidade e contestação no plano. | alta | — |
| 34 | "tirar: The system serves more than one language or language variety." | `passo2b()` checkbox `idiomas`; condiciona `p-idiomas` | Remover. Idioma vira recomendação no plano ("teste nos idiomas e variedades dos usuários") e pode entrar como fator do **nível de adaptação** no custo (item 35). | alta | — |
| 35 | "tem que ter no custo o nivel de adaptacao da ferramenta para o contexto." | Custo: `custos.js` K3 "Implantação e adaptação" (K3.1 integração e desenvolvimento, K3.2 conteúdo e configuração iniciais); `cfgDoCaso()` só usa arquitetura, elegíveis e perfil | No Adoption (ou no custo do PoC/piloto), pergunta **"How much will the tool need to be adapted to your context?"**: Use as it is; Configure (settings, accounts, school data); Adapt content and language (curriculum, local language, examples); Custom development (new features, integrations). A resposta escala os itens K3.1/K3.2 (e manutenção K6.1) em `cfgDoCaso`. | alta | Campo numérico de "custo de adaptação" direto na calculadora. |
| 36 | "isso aqui é recomendacao e nao pergunta de agora veja daqui tudo que é recomendacao e nao pergunta em si. lembre que o foco aqui é user experience — Can the institution verify how outputs are produced? … Can those affected appeal?" | `passo2b()` radios `verificabilidade` e `contestacao`; usados em `perfilAutomatico`, `alertas()`, `REFS['i-contestacao']` | Tirar as duas do 2.2; viram recomendações/cláusulas no plano (registro e rastreabilidade das saídas; caminho de contestação com prazo e autoridade). "Veja daqui tudo que é recomendação" = revisar **todo o resto do 2.2 e das fases seguintes** com esse critério (ver seção 3): no 2.2 fica só o que descreve a experiência de uso. | alta | — |
| 37 | "separar o que é custo do que é policy" | Hoje governança, regras, capacidade e custo se misturam em passos e no veredito; no resumo, "Custo" é uma categoria de cláusula entre outras | No percurso e no plano final, **dois blocos distintos**: (1) Cost and procurement (setup, pagamento, licença, adaptação, custo do PoC/piloto, custo do ciclo de vida, arranjo de aquisição, cláusulas de custo e saída); (2) Policy (governança, dados, ética, supervisão, contestação, regras do piloto, capacidade). Perguntas de política não alteram o custo, a não ser pelo componente de governança proporcional ao risco que já existe (`governancaPorRisco`). | alta | Separar só no plano final. |
| 38 | "focar é custo e compra" | Escopo geral | Prioridade da ferramenta: o que é perguntado durante o percurso deve servir para **estimar custo ou montar a compra**; o resto vira recomendação. Critério para a seção 3. | alta | — |
| 39 | "2.4. pilot rules é recomendacao e nao pergunta" | Passo 2.4 `2d`, `QUESTOES` `r-*` (`g: 'regras'`) | Remover o passo 2.4. As regras `r-*` (autorização, base legal, acordo de dados, critérios de sucesso, parada, destino dos ativos, custos adiados pela gratuidade) viram **lista de recomendações "Pilot rules"** no plano, ajustada ao caso (PoC ou piloto; dados pessoais inferidos; pagamento gratuito). | alta | — |
| 40 | "tem que ter uma etapa adoption" | Não existe (há `p-adocao`, `i-adocao`, `s-adocao` como perguntas) | Novo passo **2.3 Adoption** na fase PoC/piloto (Layer 2 do TCO: "…and adoption"). | alta | Adoption como fase separada entre piloto e implantação. |
| 41 | "na adoption tem que ter perguntas se é tecnologia publica, paga, como vai ser o pagamento, tipo de licença, coisas assim…. é custo" | — | Perguntas do Adoption (todas alimentam o custo): **Type of technology** (public or free, offered by a government or public body; open source or open weights; commercial product; developed in-house or under contract); **How will you pay?** (free during the PoC/pilot; per user licence; institutional subscription; pay per use/consumption; one-off purchase plus maintenance; donated or sponsored); **Licence type** (per user; per school; network-wide; open licence); **Level of adaptation** (item 35); **Setup** (item 42); opcional: who provides devices and connectivity (school, network, families). O código deriva `arquitetura` (saas/api/ow), `pilotoGratuito`, preço e itens cedidos (`nat: 'O'`) dessas respostas. | alta | Manter "arquitetura" como pergunta técnica dentro do Adoption, com texto leigo. |
| 42 | "ro 2.5 é a mesma coisa, é recomendacao e nao pergunta" | Passo 2.5 `2e`, `QUESTOES` `p-*` | "ro" = "e o". Remover o passo 2.5; `p-*` viram recomendações "Minimum capacity at PoC/pilot sites" no plano. As que têm custo (conectividade, dispositivos, formação, suporte) entram no Adoption como **premissas de custo**, perguntadas em forma de compra ("Will you need to buy devices for the pilot?"), não como checagem de prontidão. | alta | — |
| 43 | "o adoption é o setup do pilot ou da poc" | `passo2a()` "Tamanho do piloto" (`S.piloto.escolas`, `participantes`, `meses`); hoje `cfgDoCaso` ignora o tamanho do piloto (usa 5% dos elegíveis no Ano 0) | O Adoption contém o **setup**: escolas, participantes e duração (piloto) ou escopo e prazo (PoC), mais pagamento, licença e adaptação. O tamanho do PoC/piloto deve **alimentar o custo do Ano 0** (substituir o 5% fixo de `cfgDoCaso`). O passo de custo do PoC/piloto (atual 2.6) vem logo depois. | alta | — |
| 44 | "use o tco do outro documento (https://unesdoc.unesco.org/ark:/48223/pf0000399348) como base para ajudar a estruturar." | `CAMADAS`, `CAMADAS_FASE`, mandala, chips de camada | Estruturar fases, passos e o plano final pelas **sete camadas** do Layered TCO Framework: Layer 1 = governança (1.3); Layer 2 = Applications, User experience, Adoption (2.1–2.3); Layers 3–7 = blocos de custo (infraestrutura e dispositivos; dados e integração; cibersegurança e privacidade; formação; operação e suporte) no custo do PoC/piloto, no custo do ciclo de vida e nas recomendações do plano. Citar só esse documento e o guia. | alta | — |

---

## 3. Classificação de cada pergunta e campo atual

Códigos: **(a)** manter como pergunta agora (com texto direto, exemplo e número); **(b)** levar para a recomendação ou o diagnóstico final (exportado); **(c)** remover; **(d)** levar para outra fase ou passo. Coluna "custo" indica quando o tema deve reaparecer como premissa de custo (árvore K de `custos.js`).

Critério aplicado, a partir das falas do usuário: pergunta **sobre a situação atual da rede ou escolha do caso** que a pessoa sabe responder agora → (a); pergunta sobre **algo que deveria ser preparado** (regra, controle, cláusula, capacidade) → "isso é recomendação e não pergunta" → (b); o que serve a custo e compra fica; política sai do percurso ("separar custo de policy, focar em custo e compra"); no 2.2 "o foco é user experience".

### 3.1 Passo 1.1 (Onde e para quem)

| Campo | Classe | Justificativa |
|---|---|---|
| `nivel` (+ `nivelOutro`) | a | Contexto da decisão; resposta factual. |
| `local` | a | Identifica o caso no plano. |
| `situacao` "Em que ponto você está" | a | Factual; ajuda a sugerir PoC/piloto (item 28). Avaliar se a opção "Testar antes de decidir" fica redundante com a nova pergunta PoC/piloto. |
| `etapas` (on, escolas, alunos) | a | Base de custo (elegíveis, escolas). Com formatação de milhar (item 4). |
| `porAno` / `anos` | a | Passa a ser o padrão (item 3). |

### 3.2 Passo 1.2 (Que problema)

| Campo | Classe | Justificativa |
|---|---|---|
| `dominio` | a | Mantido, com o lema em destaque (item 13). |
| `comps` (+ `compOutro`) | a | Mantido; já tem o padrão "Outro + texto" que o usuário quer replicar. |
| `olhando` "Que problema você está olhando agora?" | a | Curto, linguagem da equipe; vira título do caso. Pode fundir com `problema` (ver nota). |
| `problema` (textarea) | a | Necessário ao plano; manter a dica "sem citar tecnologia". |
| `resultado` (textarea) | a (modificado) | Vira **"What impact do you want?"** com opções + "Other" escrito (item 26); a textarea fica opcional para detalhar. |
| `populacao` "Quem é afetado" (texto) | c | Redundante com as etapas (1.1) e com `afetados` (2.2, pré-marcado pela tarefa). |
| `linhaBase` | a | Pergunta sobre a situação atual ("Do you have a measured baseline? Example: last year's reading test results by school"); alimenta a sugestão PoC/piloto e as recomendações. |
| `alternativaSemIA` | a | Reescrever como "Did you compare at least one option without AI?" com exemplo; é fato passado (formato "did you?"). A consequência (recomendação) vai para o fim. Confiança média: se o usuário considerar diagnóstico, passa a (b). |
| Caixa "Estruturar a descrição com Claude" (`CAP.sample`) | a (ajustar) | Continua, mas deve sugerir os novos campos (impacto, tarefas), não classes/autonomia/arquitetura. |

### 3.3 Passo 1.3 (Governança, Layer 1)

| Id ou campo | Classe | Justificativa |
|---|---|---|
| `g-equipe` | c (fundida) | Fundida em `g-comite` (item 10). |
| `g-comite` | a | Mantida como pergunta única: "Do you have a team or governance body for AI in education…?" + exemplo. |
| `g-politica` | a | Exemplo citado pelo próprio usuário ("vc tem uma AI education policy?"). |
| `g-legislacao` | a | Citada pelo usuário com o formato a mudar: "Did you identify the applicable laws? Example: data protection, AI rules, children's rights, public procurement." |
| `g-dados` | a | Citada pelo usuário: "Do you have an education data policy? Example: rules on who can access, share, keep and delete student data." |
| `g-etica` | a | Situação atual da rede; "Do you have guidance on responsible AI use for teachers and students?" + exemplo. |
| `g-compras` | a | Central ao foco em compra: "Do you have rules or guidance for buying AI?" + exemplo (custo do ciclo de vida, cláusulas de dados e saída). |
| `g-orcamento` | d | "Não usar no início" (item 11); vai para a parte de custo de sustentabilidade, fundida com `s-orcamento`. Custo: fonte de recursos. |
| `g-avaliacao` | b | "Não usar no início"; vira recomendação (indicadores, responsáveis, rotina) e entra no setup como "como vai medir o resultado". |
| `capacidade` (chips) | c / b | Removida do percurso (item 16); conteúdo vira recomendação fixa no plano; retirar o bloqueio em `alertas()`. |

### 3.4 Passo 2.1 atual (O que a solução faz) → "Applications"

| Campo | Classe | Justificativa |
|---|---|---|
| `classes` | a (substituída) | Vira "What do you want the AI to do?" com tarefas educacionais + "Other" (item 21); `classes` técnicas passam a ser derivadas. |
| `autonomia` | c | "Eliminar" (item 22); derivada da tarefa; aparece só como premissa no diagnóstico. |
| `arquitetura` | d | Vai para o Adoption, reformulada como tipo de tecnologia, pagamento e licença (itens 25, 41); `saas/api/ow` derivado. Custo: K2. |
| `pilotoGratuito` | d | Vai para o Adoption como opção de pagamento ("free during the pilot"); `r-gratuito` vira recomendação. Custo: itens cedidos (`nat: 'O'`). |
| Tamanho do piloto (`S.piloto.escolas`, `participantes`, `meses`) | d | Vai para o Adoption (setup, item 43) e deve alimentar o custo do Ano 0. |

### 3.5 Passo 2.2 atual (Pessoas, dados e consequências) → "User experience"

| Campo | Classe | Justificativa |
|---|---|---|
| `usuarios` | a | Núcleo da experiência de uso; pré-marcado pela tarefa (item 29). |
| `afetados` | a | Pré-marcado pela tarefa; editável. |
| `consequencias` "Em que entra a saída do sistema" | a (reformulada) | Mantida como pergunta de uso: "What will people do with the AI's answer?" (opções atuais em linguagem de uso), pré-marcada pela tarefa. Confiança média: se o usuário a vir como risco, passa a (b) com valor derivado da tarefa. |
| `dados` | c | "Tirar" (item 32); inferido de tarefa e usuários; vai para diagnóstico e cláusulas. |
| `treino` (condicional a dados pessoais) | b | É cláusula contratual ("proibir treino com os dados"), não pergunta de uso. |
| `vulneraveis` | c | "Tirar" (item 33). |
| `idiomas` | c | "Tirar" (item 34); vira recomendação e fator de adaptação no custo. |
| `frequencia` | a | É experiência de uso ("How often will people use it?") e direcionador de custo (consumo). |
| `reversibilidade` "Se a saída estiver errada…" | b | Avaliação de risco, não experiência de uso; derivada da tarefa e da consequência; aparece no diagnóstico. |
| `verificabilidade` | b | Dito explicitamente pelo usuário (item 36). |
| `contestacao` | b | Dito explicitamente pelo usuário (item 36). |
| `cumulativo` | b | Avaliação de risco; derivada da tarefa (ex.: tutoria contínua, alerta de abandono → possível/sim). |
| `elegiveis` "Pessoas que vão usar o sistema na rede" | d | Base de custo da escala; levar para a parte de custo do ciclo de vida (ou Adoption), pré-preenchido pelo total de 1.1 conforme usuários. Custo: demanda E. |
| `alcance` "Pessoas alcançadas…, se diferente" | c | Campo de risco secundário; derivar de etapas e afetados. |

### 3.6 Passo 2.3 atual (Perfil de risco)

| Elemento | Classe | Justificativa |
|---|---|---|
| Nível de diligência, dimensões, ajustes manuais, alertas, forma de supervisão | b | Diagnóstico puro; vai inteiro para o plano final, calculado com valores derivados das tarefas, com as premissas explicitadas. Ajuste manual, se mantido, só no plano final. |

### 3.7 Passo 2.4 atual (Regras do piloto) — todo (b)

| Id | Classe | Justificativa |
|---|---|---|
| `r-autorizacao` | b | Regra a cumprir antes do piloto (item 39). |
| `r-baselegal` | b | Regra; condicionada a dados pessoais inferidos. |
| `r-acordo` | b | Cláusula de dados (proibir treino). |
| `r-sucesso` | b | Regra; liga-se à `linhaBase` e ao impacto escolhido. |
| `r-parada` | b | Regra de encerramento. |
| `r-ativos` | b | Cláusula de saída do piloto. |
| `r-gratuito` | b | Recomendação disparada pela opção de pagamento "free during the pilot". Custo: registrar custos adiados. |

### 3.8 Passo 2.5 atual (Capacidade mínima nos locais do piloto) — (b), algumas com premissa de custo no Adoption

| Id | Classe | Justificativa | Custo |
|---|---|---|---|
| `p-problema` | b | Checagem de processo. | — |
| `p-usuarios` | b | Recomendação (envolver professores e estudantes). | — |
| `p-adocao` | b | Recomendação (medidas de uso e adoção). | — |
| `p-idiomas` | b | Recomendação (testar idiomas). | K3.2 adaptação |
| `p-conect` | b | Recomendação; no Adoption, premissa "need to improve connectivity at pilot schools?". | K1.1 |
| `p-disp` | b | Recomendação; no Adoption, premissa "need to buy devices?". | K1.2 |
| `p-desplug` | b | Recomendação (alternativa desplugada). | — |
| `p-protecao` | b | Recomendação de dados. | K5.2 |
| `p-acessos` | b | Recomendação de segurança. | K1.3 |
| `p-incidente` | b | Recomendação. | — |
| `p-formacao` | b | Recomendação; premissa de custo de formação (horas por usuário). | K4.3/K4.4 |
| `p-apoio` | b | Recomendação. | K4.3 |
| `p-suporte` | b | Recomendação; premissa de suporte. | K4.2 |
| `p-acomp` | b | Recomendação (responsável por acompanhar). | K5.5 |

### 3.9 Passo 2.6 atual (Custo do piloto)

| Elemento | Classe | Justificativa |
|---|---|---|
| KPIs e tabela do Ano 0 | a | Custo é foco; passa a depender do Adoption (tamanho, pagamento, licença, adaptação), não de `arquitetura`. Organizar por camadas 3–7 do TCO (item 44). |

### 3.10 Fase 3 (Implantação)

O usuário não comentou a fase 3 diretamente; aplicam-se os princípios "isso é recomendação", "focar custo e compra" e "separar custo de policy". As perguntas `i-*` são checagens de prontidão para a rede inteira → (b) no plano final (requisitos, cláusulas, ações), e as que têm componente de custo devem virar premissas de custo da escala.

| Id | Classe | Custo (premissa a perguntar na parte de custo, se o planejador mantiver a fase) |
|---|---|---|
| `i-evidencia` | b | — |
| `i-contrato` | b | K5.1 gestão contratual |
| `i-supervisao` | b | K5.3 |
| `i-adocao` | b | — |
| `i-contestacao` | b | — |
| `i-acessib` | b | K3.2 |
| `i-infra` | b | K1.1/K1.2 dispositivos e conectividade na rede |
| `i-pico` | b | K2.2/K2.3 |
| `i-integra` | b | K3.1 integração |
| `i-base` | b | K4.1 curadoria |
| `i-finalidade` | b | — |
| `i-rastreio` | b | — |
| `i-portab` | b | K6.3 saída |
| `i-dpia` | b | K3.3 conformidade inicial |
| `i-identidade` | b | K1.3 |
| `i-adversarial` | b | K5.4 |
| `i-geracao` | b | — |
| `i-fornecedor` | b | — |
| `i-incidente` | b | — |
| `i-formacao` | b | K4.3 |
| `i-rotatividade` | b | K4.4 |
| `i-suporte` | b | K4.2 |
| `i-monitor` | b | K5.5 |
| `i-gestao` | b | K4.1/K5.1 |
| 3.2 Listas de verificação (`renderListas`) | b | Checklists = recomendações no plano. |
| 3.3 Custo total e orçamento | a | Custo do ciclo de vida: foco. |

### 3.11 Fase 4 (Sustentabilidade e expansão)

| Id ou passo | Classe | Justificativa |
|---|---|---|
| `s-continuidade` | b | Recomendação de revisão periódica. |
| `s-politica` | b | Política. |
| `s-evidencia` | b | Recomendação. |
| `s-adocao` | b | Recomendação. |
| `s-renovacao` | b | Recomendação; custo K1 renovação de dispositivos. |
| `s-interop` | b | Cláusula de saída. |
| `s-qualidade` | b | Recomendação. |
| `s-revisao` | b | Recomendação. |
| `s-mudanca` | b | Cláusula de mudança; custo K6.2. |
| `s-formacao` | b | Recomendação; custo K4.3. |
| `s-orcamento` | a | Pergunta de custo sobre a situação: "Do you have a funding source for the coming years?" (fundida com `g-orcamento`). |
| `s-saida` | b | Recomendação; o custo de saída já é calculado (K6.3, `anosParaSair`). |
| `s-equidade` | b | Recomendação. |
| 4.2 Sustentabilidade financeira | a | Custo: foco. |
| 4.3 Decisão de continuidade (`cardPD(9)`) | b | Pontos de decisão vão para o plano (item 17). |
| Blocos "Pontos de decisão do guia nesta fase" (PD 1–8) | b | Critérios viram recomendações no plano (item 17). |

### 3.12 Dependências no código que o plano precisa tratar

- `autonomia`: `perfilAutomatico` (peso, autonomia), `alertas()` (≥5 e =6), `formaSupervisao()`, `CAMPOS_RISCO`, `faltas('2a')`, IA (`app.js` l.188), relatório (`app.js` l.352, `resumo.js` l.236). Precisa de valor derivado da tarefa.
- `dados` / `dadosPessoais(c)`: condicionam `r-baselegal`, `r-acordo`, `p-protecao`, `i-finalidade`, `i-dpia`, a pergunta `treino` e P.dados. Precisa de valor inferido.
- `capacidade`: `alertas()` gera **bloqueio** com ≥3 funções faltando (caso em branco nasce bloqueado).
- `arquitetura`: `custoPronto()` (barra 2.6, 3.3, 4.2 e o painel), `cfgDoCaso`, `i-pico`, `i-base`, `ARRANJO_ARQ`, `NOTA_ARQ`, `LOCKIN`, `clausulasCaso`, `dadosReqCaso`, `PACOTE`. Precisa ser derivada do Adoption.
- `S.piloto`: hoje não entra no motor de custo (`cfgDoCaso` usa `E0 = 5% de E`); só no KPI "por participante".
- `classes`: `temClasse` (`i-rastreio`, `i-geracao`), `alertas()`, `tiposAplicacao()`, relatório. Precisa vir do mapeamento tarefa → classe.
- `veredito()`/`cartaoResultado()`/`pillVeredito()`/`estadoPasso()`: usados no cabeçalho de fase, stepper, painel, mandala, resumo e PDF. No percurso, trocar por progresso; manter no plano final.
- Exemplos A–D (`CASOS`, `CTX_EX`, `RESP_EX`) e testes (`tests/test_custos_v2.js`, `test_*.py`) precisam de atualização para os novos campos.
- i18n: todo texto novo em PT (chave) com EN, ES e FR.

---

## 4. Ambiguidades (com o padrão recomendado)

1. **"Tirar a parte de perguntas no final" (item 17).** Pode ser o bloco "Pontos de decisão do guia nesta fase" no fim de cada fase, a seção "Suas respostas" da página final, ou as duas coisas. **Padrão:** remover as duas da tela; critérios dos PDs viram recomendações no plano; o PDF troca "Suas respostas" por uma tabela curta "Dados do caso". Motivo: a frase vem logo depois do cartão de resultado da fase 1, onde o que vem em seguida é o bloco de PDs; e "Suas respostas" não é recomendação nem diagnóstico, que é o que o usuário quer no fim.

2. **Destino das fases 3 e 4.** O usuário não falou delas, mas pelos princípios quase todas as perguntas viram recomendação. **Padrão:** manter as fases 3 e 4 como fases opcionais **só de custo** (escala: elegíveis, horizonte, premissas de custo por camada 3–7; sustentabilidade: fonte de recursos, custo recorrente, cenários, custo de saída), sem perguntas de prontidão; `i-*`/`s-*` vão para o plano. Alternativa: fundir 3 e 4 numa única fase "Scale-up cost".

3. **Onde e como se escolhe PoC ou piloto, e o que faz "recomende para mim" (itens 27–28).** **Padrão:** primeira pergunta da fase 2 (não no 1.1), com três opções; "Not sure" mostra o setup completo de piloto e a recomendação PoC/piloto, com motivo, aparece só no plano final (coerente com "recomendações no fim").

4. **Como o risco funciona sem autonomia, dados, vulneráveis, idiomas, verificabilidade, contestação, reversibilidade e cumulativo.** **Padrão:** cada tarefa educacional tem um perfil padrão (classes técnicas, autonomia, dados, consequência, reversibilidade, cumulativo); o perfil de risco é calculado com esses padrões, usuários e afetados, e aparece só no plano final, com as premissas escritas ("assumed from the selected task"). Sem seção "avançado" no percurso.

5. **"Check quando respondido também dentro do valor" (item 5).** **Padrão:** ✓ ao lado do número de cada pergunta ou campo respondido **e** ✓ dentro dos inputs numéricos e de texto preenchidos; no segmentado Yes/Partly/No, o botão escolhido mostra ✓. Alternativa: só no botão escolhido.

6. **"Selecionar a solução" no início (item 26).** Pode significar levar a escolha das tarefas da IA para o 1.2 ou só transformar o resultado esperado em escolha com "Other". **Padrão:** no 1.2, "What impact do you want?" com opções + "Other" escrito; a escolha da solução (tarefas + "Other" escrito) fica no 2.1 Applications, para não perguntar duas vezes e porque o usuário disse "no piloto precisa saber o que a ferramenta vai fazer". Alternativa: pôr as tarefas no 1.2 e deixar o 2.1 só para confirmar e detalhar.

---

## 5. Estrutura resultante sugerida (resumo para o planejador)

- **Fase 1 Context:** 1.1 Where and for whom (anos por padrão, números formatados); 1.2 What problem (domínio com lema em destaque, componentes, problema, **impacto com opções + Other**, linha de base, alternativa sem IA); 1.3 **Layer 1 · Governance ⓘ** (6 perguntas "Do you have / Did you…?", numeradas, com exemplo: comitê/equipe, política, legislação, dados, ética, compras).
- **Fase 2 Proof of concept or pilot** (Layer 2 ⓘ, com explicação): pergunta inicial PoC / Pilot / Not sure; 2.1 **Applications** (tarefas educacionais + Other); 2.2 **User experience** (usuários e afetados pré-marcados, frequência, o que as pessoas fazem com a resposta); 2.3 **Adoption** (setup: tamanho e duração; tipo de tecnologia; pagamento; licença; nível de adaptação; necessidade de dispositivos, conectividade, formação e suporte); 2.4 **PoC/pilot cost** (Ano 0 por camadas 3–7).
- **Fases 3 e 4 (opcionais), só custo:** custo do ciclo de vida na escala; sustentabilidade financeira (fonte de recursos).
- **Botão "Generate procurement plan"** sempre visível → página e PDF com: caso; impacto; aplicação e experiência de uso; PoC ou piloto (com recomendação se "Not sure"); custo e compra (setup, licença, pagamento, custo, arranjo, requisitos e cláusulas, saída); política e recomendações (governança, regras do PoC/piloto, capacidade mínima, dados, supervisão, contestação, PDs); diagnóstico (perfil de risco e premissas).
- **Durante o percurso:** sem vereditos, sem alertas, sem listas de ações; perguntas numeradas, ✓ por pergunta e no campo, mandala verde para o que foi concluído.
