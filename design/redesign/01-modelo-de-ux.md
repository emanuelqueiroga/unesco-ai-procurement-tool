# Modelo de UX — AI in Education Procurement Tool

27 de outubro de 2026 · Emanuel Queiroga, com apoio do Claude. Versão viva em Claude Docs: https://claude.ai/artifact/5QvKB2ZSUokhgYtxSeXacE

## O básico de design, traduzido para quem programa

Design de interface é engenharia de decisões repetíveis: a tabela abaixo mapeia cada termo que vai aparecer neste documento para o conceito equivalente em computação e para o que ele significa nesta ferramenta.

| Termo | Equivalente em computação | Nesta ferramenta |
| --- | --- | --- |
| Modelo de UX | Especificação de requisitos + arquitetura do sistema | Quem usa, em que ordem, o que vê a cada momento e o que a ferramenta nunca faz |
| Arquitetura de informação | Modelo de dados e sua hierarquia | Como as 51 perguntas, as 7 camadas e as 18 seções do plano se agrupam e se escondem |
| Fluxo | Máquina de estados do usuário | Página inicial → percurso → plano; onde se pode pular, voltar e refinar |
| Storytelling | O loop principal do programa, com começo, meio e fim | A narrativa que dá sentido às perguntas: "descreva a rede, escolha um problema, desenhe um teste, saia com um plano" |
| Design system | Biblioteca padrão + guia de estilo de código | Tokens, componentes e diretrizes que toda tela consome |
| Token | Constante global com nome semântico (`COR_PRIMARIA`, não `#0069B4`) | Cores, tamanhos de texto, espaçamentos, raios, sombras, com variante clara e escura |
| Componente | Classe ou tipo com estados definidos | Botão, campo, cartão, tabela, stepper, alerta; cada um com normal, foco, erro, desabilitado |
| Diretriz | Convenção de código escrita | Tom de voz, como nomear seções (sem gerúndio), quando usar cada componente |
| Hierarquia visual | Ordem de precedência | O que o olho lê primeiro: um número grande pesa mais que um rótulo cinza pequeno |
| Divulgação progressiva | Lazy loading | Mostrar só o necessário agora; o detalhe aparece sob demanda (o modo Refinar) |
| Wireframe | Pseudocódigo de uma tela | Esboço em caixas cinza, sem cor, para decidir o que vai onde antes de embelezar |
| Mockup | A tela compilada | Tela com cores, tipografia e conteúdo real, pronta para virar código |
| Acessibilidade (AA) | Teste de conformidade | Contraste mínimo de 4,5:1 em texto, foco visível, uso por teclado, leitura a 400 px |

A regra que explica quase todos os problemas da versão atual é esta: quando tudo tem o mesmo peso, nada tem peso. Uma tela com 15 acordeões iguais, cartões, tabelas e gráficos na mesma cor e no mesmo tamanho obriga a pessoa a ler tudo para descobrir o que importa. Design é, em grande parte, decidir o que importa e deixar o resto quieto.

## O que a ferramenta é hoje (v13)

O conteúdo está certo e completo; o problema é que ele é todo apresentado com o mesmo peso. O mapa abaixo vem do código da v13 (pasta `src/`) e dos planos de versão em `plano/`.

| Dimensão | Hoje |
| --- | --- |
| Estrutura | Página inicial → 4 fases em acordeão (Contexto; Prova de conceito ou piloto; Implantação; Expansão) → Plano de contratação |
| Passos | 15 (1.1–1.3, 2.0–2.6, 3.1–3.2, 4.1–4.3) |
| Perguntas numeradas | 51, das quais só 2 são opcionais |
| Interações reais num caso completo | 70 a 90 (grade de escolas por ano, lista de ferramentas com 5 campos cada, 40 problemas e cerca de 140 subcategorias) |
| Respostas "sugeridas" a confirmar | Cerca de 17 |
| Mínimo para a estimativa de custo aparecer | 3 respostas (2.1.1 tarefa, 2.3.4 tecnologia, 4.1.1 escala) |
| Painel lateral | Progresso por fase, mandala de 3 anéis + 7 camadas, "Seu caso", estimativa, 5 botões |
| Calculadora completa | 7 KPIs, árvore K1–K6, cenários, tornado, Monte Carlo, dezenas de premissas |
| Plano final | Capa, Em resumo, matriz camada × fase, recomendações (66 regras), perfil em 9 cartões, bloco A (A1–A7), bloco B (B1–B9), referências, pendências; PDF e JSON |
| Idiomas | 9 (EN padrão; 5 preliminares) |
| Tela mínima exigida | 400 px sem rolagem horizontal |

O próprio histórico de versões registra os sintomas: "não tá fluido", "não achei as recomendações dado o caso", "a fórmula do cálculo não tá clara", "a parte do relatório tá muito feia", página do plano com 26 mil pixels de altura. A v9 chegou a reduzir para 3 fases e 9 passos por fluidez; a v11 voltou a 4 fases e 15 passos. Na v13, uma mesma pergunta pode aparecer em dois lugares (as que "descem" da camada 2 para o passo 3.1).

Três causas explicam quase tudo. A primeira é ausência de hierarquia: acordeões, cartões, tabelas e gráficos têm o mesmo peso visual, e a mandala exige aprender um diagrama para ler o progresso. A segunda é que o valor aparece tarde: a pessoa responde 50 perguntas antes de ver o plano, e as recomendações ficam enterradas em listas genéricas no fim. A terceira é vocabulário técnico exposto ao gestor (camada, K1–K6, dotação, conta econômica, arquitetura presumida, ponto de decisão), sem uma camada de linguagem para quem não é de compras nem de TI.

## Para quem desenhamos

Dois usuários, dois modos, um único caso: a gestora monta o caso no modo Essencial e o técnico refina o mesmo caso no modo Refinar, sem que nenhum dos dois precise ver a interface do outro.

| | Gestora de educação | Técnico de compras ou TI |
| --- | --- | --- |
| Quem é | Coordenadora ou diretora de uma secretaria estadual ou municipal; decide e paga | Monta o edital, o orçamento e a arquitetura; responde ao controle |
| O que quer | Saber se vale a pena, quanto custa em ordem de grandeza e o que exigir, para levar ao secretário | Premissas rastreáveis, números defensáveis, cláusulas e documentos do dossiê |
| Tempo disponível | 20 a 30 minutos, provavelmente em mais de uma sessão | Horas, em várias sessões, voltando a campos específicos |
| Vocabulário | Educação: escolas, etapas, professores, estudantes, problema, resultado | Compras e TI: dotação, exercício, SaaS, API, licença, cenário |
| Tolera | Perguntas curtas, valores padrão, um número com faixa | Tabelas, premissas editáveis por ano, gráficos de sensibilidade |
| Não tolera | Jargão de IA e de custo, 50 perguntas antes de ver algo, decidir arquitetura | Números sem origem, premissas invisíveis, não conseguir mudar um valor |
| Dispositivo provável | Notebook e celular | Notebook com tela grande |
| Modo | Essencial | Refinar |

O modo Essencial é a ferramenta inteira vista pela gestora: cerca de 20 a 25 perguntas em linguagem de educação, todas as demais respondidas por premissas padrão declaradas, e o plano completo no fim. O modo Refinar é a mesma ferramenta com as portas abertas: cada número do plano tem um link "de onde vem" que leva à premissa, e cada premissa pode ser editada, por ano, por ferramenta, por cenário. Refinar nunca é um pré-requisito: um caso só com o Essencial já gera um plano válido, marcado como estimativa com premissas padrão.

A passagem de um modo para o outro acontece no próprio caso, não numa configuração global. O técnico abre o caso que a gestora exportou (ou o mesmo navegador), e o plano passa a mostrar quais premissas foram refinadas e quais seguem padrão. Isso resolve a dúvida registrada no QA da v9, em que KPIs calculados só com padrões "pareciam dados reais".

## Princípios de interação

Sete regras decidem qualquer dúvida de tela daqui em diante; quando duas telas são possíveis, vence a que respeita mais regras.

1. O plano aparece cedo e cresce. Depois de 3 respostas já existe um número; depois de 10, um plano parcial legível. Ninguém responde 50 perguntas no escuro.
2. Uma pergunta por vez na tela, um passo por vez no mapa. O olho tem um foco; o progresso tem um lugar fixo e simples (barra ou lista), não um diagrama a aprender.
3. Linguagem de educação na frente, vocabulário técnico atrás de um clique. "Camada 3" vira "Internet e dispositivos"; "dotação por exercício" vira "quanto pedir no orçamento de cada ano". O termo técnico aparece entre parênteses ou no modo Refinar.
4. Toda sugestão vem rotulada e pode ser aceita em um clique. Valor padrão, valor sugerido por outra resposta e valor informado têm três aparências distintas, sempre as mesmas.
5. Todo número tem origem. Cada KPI e cada célula de custo responde a "de onde vem?" com um link para a premissa, e a premissa diz se é padrão ou refinada.
6. Nada bloqueia, tudo registra. Pular é permitido em qualquer ponto; o plano lista o que falta, com link direto para responder.
7. Uma pergunta existe em um só lugar. Se uma resposta serve a duas fases, ela é feita uma vez e referenciada na outra, nunca duplicada.

E três coisas que a ferramenta nunca faz: não dá veredito no meio do percurso (diagnóstico e recomendação pertencem ao plano), não fala em nome da UNESCO ou de outra instituição, e não reduz fonte nem esconde colunas com rolagem horizontal para caber conteúdo em 400 px.

## Arquitetura de informação simplificada

O caminho Essencial fica com 24 perguntas (contra 51), as quatro fases continuam existindo porque a matriz camada × fase e o guia dependem delas, e tudo o que sai vai para Refinar com um valor padrão declarado.

| Passo atual | Fica no Essencial | Vai para Refinar | Como fica |
| --- | --- | --- | --- |
| 1.1 Onde e para quem | Nível administrativo; nome da rede; em que ponto está; etapas atendidas com total de escolas e estudantes por etapa | Detalhe por ano ou série | 4 perguntas; a grade por ano vira um link "detalhar por ano" |
| 1.2 Prioridade e impacto | Prioridade; até 3 problemas do catálogo; situação atual (texto); impacto desejado; linha de base (sim/em parte/não) | Subcategorias; "outro problema"; resultado esperado e medição; alternativa sem IA; detalhes da linha de base | 5 perguntas; o título curto do problema (1.2.3) é gerado da escolha, editável |
| 1.3 Governança | Uma tela única: "Marque o que a sua rede já tem" com os 6 itens em Sim / Em parte / Não | Os 12 campos "Qual?" e "O que falta?" | 1 tela; as respostas alimentam B1 e as recomendações exatamente como hoje |
| 2.0 Prova de conceito ou piloto | A escolha, com "recomende para mim" | | 1 pergunta; deixa de reorganizar outras perguntas, porque as que "desciam" vão para Refinar |
| 2.1 Aplicações | O que a IA faz (sugerido pelos problemas) | Nome da aplicação | 1 pergunta |
| 2.2 Experiência de uso | Quem usa; quem é afetado e o que fazem com a resposta (uma tela) | Frequência de uso | 2 telas; alimenta o perfil de risco sem a pessoa saber que existe um |
| 2.3 Adoção | Tipo de tecnologia (com "não sei"); forma de pagamento (sugerida); tamanho e duração do teste (sugeridos) | Quantas ferramentas, quais, licença, nível de adaptação | 3 perguntas; a lista de ferramentas com 5 campos cada é um recurso do técnico |
| 2.4 Infraestrutura | Internet adequada (e quantas escolas, se parcial); como os dispositivos serão usados | Se os dispositivos já existem (sugerido) | 2 perguntas |
| 2.5 Formação | Quem será formado e quantas horas (uma tela, com estimativa) | Tipo, formato e quem paga | 1 tela |
| 2.6 Operação e suporte | Nível de suporte | Quem dá suporte; nível de acompanhamento | 1 pergunta |
| 3.1 Primeira etapa | Quantas escolas e pessoas começam (sugerido) | As perguntas que "desciam" da camada 2 | 1 pergunta |
| 3.2 Arquitetura | | Arquitetura da ferramenta (usa a presumida) | 0 perguntas no Essencial; o gestor não decide arquitetura |
| 4.1 Escala e horizonte | Quantas pessoas em toda a rede; em quanto tempo | Horizonte de anos (padrão 5) | 2 perguntas |
| 4.2 Estimativa | Não é pergunta: vira a página "Quanto custa" do plano | Calculadora completa, cenários, tornado, Monte Carlo | Deixa de ser um passo |
| 4.3 Recomendações | Não é pergunta: vira a página "O que fazer" do plano | | Deixa de ser um passo |

Fluxo: Início → Essencial (1 · Sua rede e o problema; 2 · O teste; 3 · Primeira etapa; 4 · Toda a rede) → Plano de contratação (Em resumo; Quanto custa; O que fazer; O que exigir). O plano existe desde a terceira resposta. Refinar (técnico: premissas por ano, ferramentas, cenários) é uma porta lateral a partir do plano, pelo link "de onde vem?", que recalcula o plano; não é uma etapa. A gestora percorre o Essencial e chega ao plano; o técnico entra no plano por qualquer número. Nenhum dos dois passa pela tela do outro.

O plano final também muda de forma sem mudar de conteúdo. Ele passa a ter quatro páginas com nomes de gestor, e as 18 seções atuais ficam dentro delas: "Em resumo" (capa, KPIs, fatos do caso), "Quanto custa" (A2, matriz, custo por camada, dotação por ano), "O que fazer" (recomendações, A1, B3, B4, B7) e "O que exigir" (A4–A7, B1, B2, B5, B6, B8, B9). O perfil do caso e as referências ficam num apêndice. O PDF segue a mesma ordem.

Um último corte é de vocabulário, não de perguntas: as sete camadas ganham nomes curtos de interface (Governança; Aplicações; Internet e dispositivos; Dados e sistemas; Segurança e privacidade; Formação; Operação e suporte), com o nome completo de Krueger e Jackson no ⓘ e no plano.

## Proposta A — O plano se escreve enquanto você responde

O documento final é o protagonista desde o primeiro segundo: a tela se divide em perguntas à esquerda e o plano à direita, e cada resposta escreve uma frase, um número ou uma recomendação no plano, na hora.

A história que a pessoa vive é a de um documento que ela não precisa redigir. Na página inicial, o plano aparece como uma folha com os quatro títulos e lacunas ("Rede: —", "Custo do teste: —"). Ao responder "Qual é o nome da rede?", a capa ganha o nome. Ao escolher o problema, a frase de abertura do plano se escreve. Na terceira resposta do capítulo 2, o primeiro número aparece com uma animação curta e a etiqueta "estimativa com premissas padrão". Quando uma resposta dispara uma recomendação, ela surge na página "O que fazer" com um destaque breve. O clímax é discreto e inevitável: a última lacuna se fecha e o botão "Baixar o plano" acende.

A tela principal tem três zonas. À esquerda, uma lista vertical de capítulos e perguntas, com marcas de respondido, sugerido e pendente. No centro, uma pergunta por vez, com a explicação curta e o campo. À direita, o plano em miniatura rolando sozinho até a parte que acabou de mudar, com a parte alterada realçada por dois segundos. Em celular, o plano vira uma aba inferior ("Seu plano · 3 números, 2 recomendações") que a pessoa puxa para cima.

O modo Refinar nasce naturalmente desta narrativa: o técnico clica num número do plano e a pergunta ou premissa correspondente abre à esquerda. O plano é o índice do caso.

Pontos fortes: o valor aparece desde a primeira resposta (princípio 1); a pessoa nunca pergunta "para que serve isso?", porque vê o efeito; a transição para o plano final não existe, ele já estava ali; o Refinar é a mesma tela. Pontos fracos: exige disciplina de layout em três colunas, que em 400 px vira duas camadas; o plano parcial pode parecer pobre nas primeiras respostas se o design da lacuna não for bonito; a implementação precisa de um vínculo fino entre cada resposta e o trecho do plano que ela altera (o código atual já tem isso em `secoesPlano()` e nas regras de recomendação, o que ajuda).

## Proposta B — Uma jornada em quatro capítulos

A experiência é um guia de viagem com quatro capítulos, cada um com uma pergunta-guia, uma abertura, um conjunto curto de perguntas e um fechamento que diz o que a pessoa já sabe agora; o plano é o destino, visto só no fim.

A história é a de uma expedição. A página inicial é um mapa linear com quatro estações e uma frase por estação: "Sua rede e o problema", "O teste", "A primeira etapa", "Toda a rede". Cada capítulo abre em tela cheia com um título grande, uma pergunta-guia ("O que a sua rede precisa resolver?") e um parágrafo de duas linhas sobre por que este capítulo existe. As perguntas vêm em sequência, uma por tela, com uma barra fina de progresso do capítulo. O fechamento de cada capítulo é o momento narrativo: uma tela de síntese, sem veredito, que diz "Até aqui: rede municipal de 48 escolas, problema de alfabetização nos anos iniciais, governança parcial" e mostra o próximo capítulo. No fim do capítulo 2, essa síntese traz o primeiro número (custo do teste). O clímax é a chegada: o plano se abre como uma página nova, com capa.

A tela principal é simples: uma coluna central de leitura, a barra de capítulos no topo (quatro segmentos, o atual preenchido) e um rodapé com "Voltar" e "Continuar". Não há painel lateral. O caso salvo aparece na página inicial como "Você parou no capítulo 2, pergunta 4".

O modo Refinar é um quinto capítulo opcional, "Ajustar premissas", que só aparece no mapa depois que o plano existe, mais os links "de onde vem?" dentro do plano. A separação entre gestora e técnico fica clara: são capítulos diferentes.

Pontos fortes: é a estrutura mais fácil de implementar e de traduzir para 9 idiomas, porque cada tela tem um elemento só; funciona muito bem em celular; o ritmo capítulo-síntese dá sensação de avanço sem precisar de veredito; combina com o guia impresso, que também tem capítulos. Pontos fracos: o plano só aparece no fim, o que enfraquece o princípio 1 (a síntese de capítulo compensa em parte); voltar a uma pergunta específica exige navegar pelo mapa; o técnico que quer mexer em uma premissa precisa de um caminho próprio, menos integrado que na proposta A.

## Proposta C — Uma conversa com um consultor

A ferramenta fala em primeira pessoa, uma pergunta por vez, em tela cheia, como um consultor experiente que já ajudou outras redes a comprar IA e que resume o que entendeu antes de seguir.

A história é a de uma reunião de trabalho. A página inicial é um convite curto: "Vou fazer cerca de 25 perguntas sobre a sua rede e o que você quer resolver. No fim, você sai com um plano de contratação e uma estimativa de custo. Leva uns 20 minutos, e dá para parar e voltar." Cada pergunta vem com o tom de quem explica por que pergunta ("Pergunto sobre internet porque o custo de dispositivos e conexão costuma superar o da ferramenta em si"). A cada três ou quatro respostas, o consultor devolve um resumo em prosa: "Entendi: uma rede municipal com 48 escolas, que quer reduzir a defasagem em matemática nos anos finais e ainda não tem uma política de IA. Vamos falar do teste." Os números entram na conversa como frases ("Um piloto desse tamanho custaria algo entre X e Y no primeiro ano"). O clímax é a entrega: "Preparei o seu plano", seguida do documento.

A tela é a mais simples das três: uma coluna estreita centrada, a pergunta em tamanho grande, o campo logo abaixo, uma linha discreta de contexto ("Capítulo 2 · O teste · pergunta 6 de 11") e os botões "Continuar" e "Pular por agora". O histórico da conversa fica acessível por um painel lateral que abre sob demanda, com cada pergunta e resposta, editável.

O modo Refinar é uma segunda conversa, com outro tom, oferecida no fim: "Se quiser, posso detalhar as premissas com a sua equipe técnica". Na prática, vira um formulário de premissas, porque diálogo não é o formato certo para editar 40 números.

Pontos fortes: é o formato mais acolhedor para quem não é da área e o que melhor ensina enquanto pergunta; a linguagem de educação fica natural; os resumos em prosa são um storytelling forte e fácil de traduzir; funciona perfeitamente em celular. Pontos fracos: é o percurso mais longo em tempo, porque cada tela tem uma coisa só; revisar e comparar respostas é mais difícil; o técnico tende a se irritar com o tom; o risco de parecer um chatbot é real, e a ferramenta não é um (as perguntas são fixas), então o tom precisa ser de formulário bem escrito, não de bate-papo.

## Comparação e decisão

Decisão tomada em 27 de outubro de 2026: Proposta A com o ritmo de capítulos da B. O plano visível desde o início é o que mais ataca os problemas registrados (valor tardio, recomendações enterradas, números sem origem), e as aberturas e sínteses de capítulo dão a narrativa que a A sozinha não tem.

| Critério | A · Plano que se escreve | B · Quatro capítulos | C · Conversa |
| --- | --- | --- | --- |
| Valor visível cedo (princípio 1) | Desde a primeira resposta | No fim de cada capítulo | Em frases, a cada 3 ou 4 respostas |
| Simplicidade da tela | Média: três zonas | Alta: uma coluna | Muito alta: uma pergunta |
| Celular (400 px) | Boa, com o plano como aba inferior | Muito boa | Muito boa |
| Revisar e voltar a uma resposta | Clique no plano ou na lista | Pelo mapa de capítulos | Pelo histórico lateral |
| Modo Refinar para o técnico | Integrado: o plano é o índice | Capítulo à parte | Formulário à parte, tom destoante |
| Força da narrativa | Ver o documento nascer | Ritmo de estações e sínteses | Resumos em prosa |
| Esforço de implementação | Maior: vínculo resposta → trecho do plano | Menor | Médio: textos de resumo por combinação |
| Tradução para 9 idiomas | Média | Fácil | Mais texto a traduzir |
| Risco principal | Plano parcial parecer pobre no começo | Plano só no fim | Parecer chatbot |

A combinação adotada: a tela principal da A (lista de capítulos à esquerda, pergunta no centro, plano à direita), cada capítulo abrindo com a tela de título e pergunta-guia da B, e o fechamento de capítulo como uma síntese curta em prosa, tomada da C, escrita no próprio plano. O "consultor" da C sobrevive como tom de voz das explicações curtas sob cada pergunta, nunca como diálogo.

## Próximos passos

1. Narrativa escolhida: A com ritmo da B (feito).
2. Lista de 24 perguntas do Essencial e nomes das quatro páginas do plano: aprovados neste documento, com três pontos ainda em aberto (arquitetura fora do Essencial; nomes das páginas; limite de três problemas).
3. Design system Prumo: feito (`design/redesign/prumo/`).
4. Mockups das telas principais em 1360 px e 400 px: feitos (`design/redesign/mockups/`).
5. Especificação para reimplementação em framework: mapa das 51 perguntas atuais para as 24 do Essencial e as premissas padrão de cada uma, para que o motor de custos e as 66 regras de recomendação continuem valendo sem mudança.

O que não muda em nenhum cenário: o motor de custos, as regras de recomendação, a matriz camada × fase, os 9 idiomas com PT como chave, a exportação em JSON e PDF, e o vínculo com a Cátedra UNESCO UNITWIN de Inteligência Artificial Desplugada na Educação e com o IA.EDU.
