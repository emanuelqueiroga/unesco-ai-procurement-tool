# Requisitos v13 — AI in Education Procurement Tool

Fonte: "Documento sem título 5.pdf" (16 out. 2026), com notas e uma captura de tela do passo 1.2 na v12. Cada requisito traz o trecho de origem, o que deve ser feito, os critérios de aceite, os módulos afetados e a prioridade. As dúvidas que mudam a execução estão na seção 9. Até que sejam respondidas, vale a interpretação proposta.

Prioridade: **P1** = indispensável na v13; **P2** = importante, pode vir em seguida; **P3** = depende de confirmação.

**Decisões do usuário (16 out. 2026), já incorporadas abaixo**

- As quatro categorias não recebem referência por enquanto.
- A pessoa pode marcar várias prioridades.
- O "mínimo no piloto" vale para a **camada 2** (passos 2.1, 2.2 e 2.3).
- O catálogo de problemas é redigido por mim: está no Anexo A, `catalogo_prioridades_v13.md`, e você revisa.
- Ainda não há revisão nativa das traduções. A própria plataforma avisa que a linguagem precisa ser revisada (RQ-18).

---

## 1. Página inicial

### RQ-01 · Nova página inicial com "Start procurement plan" — P1
- **Origem:** "pagina inicial - iniciar jornada, start procurement plan uma imagem com o que tem em cada para que a pessoa entenda como funcionam e o que tem em cada etapa."
- **Requisito:** substituir a tela de boas-vindas atual por uma página inicial com estes elementos:
  - nome da ferramenta e uma frase do que ela entrega (um plano de contratação com custo do ciclo de vida);
  - botão principal "Iniciar o plano de contratação" (EN "Start procurement plan");
  - imagem explicativa das 4 fases (Contexto; Prova de conceito ou piloto; Implantação; Expansão), com o que a pessoa responde e o que recebe em cada uma;
  - ações secundárias: "Continuar o caso salvo" (só se houver um), "Ver um exemplo preenchido" e "Importar caso".
- **Imagem:** feita em SVG/HTML dentro da ferramenta, e não como figura rasterizada, para ser traduzida nos 9 idiomas e legível a 400 px. Em cada fase:
  - número e nome da fase;
  - os passos (ex.: 2.1 Aplicações … 2.6 Operação e suporte);
  - as camadas que alimenta;
  - o resultado da fase (ex.: "tamanho e custo do teste").
  - Clicar numa fase abre um resumo dela na própria página, sem nova tela. A imagem é a versão resumida da matriz do RQ-03.
- **Aceite:**
  - a página abre por padrão, sem caso pré-carregado;
  - o botão principal leva ao 1.1;
  - a imagem cabe sem rolagem horizontal a 400 px;
  - todos os textos passam por `tr()` e `test_idiomas.py` termina com 0 restos.
- **Onde:** `fluxo.js` (`boasVindas`, ações), `fluxo.css`, `fluxo_dados.js` (dados da imagem), `i18n/v13_*`.

---

## 2. Matriz camadas × fases

### RQ-02 · Modelo matricial único no código — P1
- **Origem:** "pegar o beyond tco e fazer a quebra das camadas em etapas a partir de um modelo matricial."
- **Requisito:**
  - criar uma estrutura de dados `MATRIZ` com 7 camadas (Krueger e Jackson, 2026, Figura 1, p. 11) × 4 fases;
  - cada célula traz:
    - o que é preciso decidir ou saber;
    - as perguntas da ferramenta que a cobrem (números);
    - os itens de custo (K1–K6, via `CAMADA_DE_S`);
    - as ações recomendadas;
    - o estado "não se aplica nesta fase", quando for o caso;
  - a `MATRIZ` passa a ser a fonte única para:
    - a imagem da página inicial (RQ-01);
    - a tabela da matriz (RQ-03);
    - a seleção do mínimo do piloto (RQ-13);
    - a mandala (`CAMADA_PASSOS` passa a ser derivado dela).
- **Restrição de autoria:**
  - o documento de Krueger e Jackson **não associa camadas a fases** (ver `plano/2_tco_unesco.md`, linhas 81 e 265);
  - a distribuição por fase é elaboração desta ferramenta e deve ser creditada assim: "Camadas: Krueger e Jackson (2026, p. 11). Distribuição por fase: elaboração desta ferramenta.";
  - nenhuma célula atribui ao documento algo que ele não diz.
- **Aceite:**
  - a mandala e o percurso continuam iguais aos da v12 quando se usa a `MATRIZ`;
  - existe um teste que confere que toda pergunta do percurso aparece em ao menos uma célula e que toda célula marcada como aplicável tem conteúdo.
- **Onde:** `fluxo_dados.js` (ou novo `src/matriz.js`, incluído no `build.sh` antes de `fluxo.js`), `custos_ui.js` (`CAMADA_DE_S`), testes.

### RQ-03 · Tabela "O que cada fase exige, por camada" — P1
- **Origem:** "etapa proof of concept and pilot… o que precisa pra cada etapa transformando para uma tabela."
- **Requisito:**
  - mostrar a `MATRIZ` como tabela, com as camadas nas linhas e as fases nas colunas;
  - a tabela fica em três lugares:
    - (a) na página inicial, num link "Ver a matriz completa", que abre sobre a página no mesmo padrão do visualizador da Figura 1;
    - (b) no ⓘ das sete camadas;
    - (c) no plano de contratação (página e PDF), como seção própria depois de "Em resumo";
  - na versão do caso (plano), cada célula mostra o estado: respondido, pendente ou não se aplica;
  - quando houver custo, a célula mostra também o valor da camada na fase:
    - fase 2 = Ano 0;
    - fase 3 = Ano 1;
    - fase 4 = Anos 2 a H e saída.
- **Aceite:**
  - a tabela é legível a 400 px, com rolagem horizontal só dentro da tabela, primeira coluna fixa ou layout em cartões por fase;
  - no PDF cabe em uma página A4 paisagem ou em duas retrato, sem corte de texto;
  - a soma das células de custo é igual ao total do ciclo (r = 0).
- **Onde:** `resumo.js` (`renderPlano`, `secoesPlano`), `plano_pdf.js`, `fluxo.js` (lightbox), `fluxo.css`.

---

## 3. Passo 1.2: de "problema" a "prioridade"

### RQ-04 · Renomear "problema" para "prioridade" — P1
- **Origem:** "1.2.1 muda o nome sai problem para priority."
- **Requisito:**
  - a pergunta 1.2.1 passa a ser "Qual é a prioridade da sua rede para a IA na educação?" (EN "What is your system's priority for AI in education?");
  - o passo 1.2 passa de "Problema e impacto" para "Prioridade e impacto";
  - a palavra "problema" continua nas perguntas seguintes, que tratam dos problemas dentro da prioridade (RQ-06).
- **Aceite:** os novos nomes aparecem no percurso, no stepper, na mandala, no plano, no PDF e nos 9 idiomas, sem gerúndio.
- **Onde:** `fluxo_dados.js` (`PASSOS`, `CAMPOS`), `resumo.js`, `plano_pdf.js`, i18n.

### RQ-05 · Quatro prioridades no lugar dos três domínios — P1
- **Origem:** "sai e entra Governing AI in Education / Educating about AI / Educating with AI / Educating for the Age of AI."
- **Requisito:**
  - substituir `DOMINIOS` (Qualificação, Socialização, Subjetivação, duas delas "em breve") por quatro prioridades, todas ativas:
    - Governar a IA na educação (Governing AI in Education);
    - Educar sobre a IA (Educating about AI);
    - Educar com a IA (Educating with AI);
    - Educar para a era da IA (Educating for the Age of AI);
  - cada cartão mostra o nome, uma descrição de uma linha e o botão ⓘ (RQ-07);
  - a pessoa pode marcar uma ou mais prioridades (caixas de marcar, não rádio). Os problemas aparecem agrupados por prioridade marcada.
- **Aceite:**
  - não há mais a etiqueta "em breve";
  - a escolha alimenta o catálogo de problemas (RQ-06);
  - os casos salvos com `dominio` são migrados (RQ-19).
- **Onde:** `fluxo_dados.js` (`DOMINIOS` → `PRIORIDADES`), `fluxo.js` (render `dom`, validação, linha 243), `casos.js`, `recomendacoes.js`, `resumo.js`.
- **Crédito:** por decisão do usuário, nenhuma referência é escrita para as quatro categorias nesta versão, nem na ferramenta, nem no plano, nem no PDF.

### RQ-06 · Catálogo de problemas e objetivos pré-preenchidos — P1
- **Origem:** "para cada um tem que trazer uns 10 problemas e objetivos que venham preenchidos … cada problema pode ter subcategorias."
- **Requisito:**
  - para cada prioridade, uma lista de cerca de 10 problemas, cerca de 40 no total;
  - cada problema traz:
    - o texto do problema;
    - o objetivo correspondente, já redigido;
    - de 0 a N subcategorias;
    - as tarefas de IA sugeridas para o 2.1.1 (RQ-14);
    - os impactos sugeridos para o 1.2.5;
  - estrutura de dados: `PRIORIDADES[{ id, nome, desc, exemplos[], problemas[{ id, problema, objetivo, sub[{ id, t }], tarefas[], impactos[] }] }]`.
- **Conteúdo:**
  - a primeira versão está no **Anexo A** (`catalogo_prioridades_v13.md`): 4 prioridades × 10 problemas, com objetivo, subcategorias, tarefas e impactos;
  - os problemas de "Educar com a IA" absorvem os exemplos e componentes atuais (alfabetização, matemática, ciências);
  - o anexo propõe três impactos novos (`letramento_ia`, `uso_responsavel`, `competencias`) e uma tarefa nova (`pratica_ia`), que seguem as mesmas regras de tradução e de motor das existentes;
  - o anexo prevê também o aviso para problemas que não pedem ferramenta de IA.
- **Aceite:** 4 prioridades × aproximadamente 10 problemas, cada um com objetivo; subcategorias onde fizer sentido; tudo traduzido nos 9 idiomas.
- **Onde:** novo `src/prioridades.js` (dados), `build.sh`, i18n.

### RQ-07 · ⓘ com exemplos de cada prioridade — P1
- **Origem:** "tem que trazer um I onde mostre pra eles exemplos de cada."
- **Requisito:**
  - cada cartão de prioridade tem um botão ⓘ, no mesmo padrão das notas das camadas;
  - a nota mostra uma descrição curta e 3 a 5 exemplos concretos (problemas típicos e o tipo de uso de IA).
- **Aceite:**
  - o ⓘ abre e fecha sem mudar a seleção do cartão;
  - é acessível por teclado (`aria-expanded`);
  - funciona a 400 px.
- **Onde:** `fluxo.js` (`botaoInfo`, `notaInfo`), `prioridades.js`.

### RQ-08 · Seleção múltipla, "marcar todos" e subcategorias — P1
- **Origem:** "opção para ele marcar todos, opção para e selecionar multiplos problemas."
- **Requisito:**
  - depois de escolher a(s) prioridade(s), aparece a lista de problemas com caixas de marcar;
  - a lista tem as ações "Marcar todos" e "Desmarcar todos" por prioridade;
  - ao marcar um problema, as subcategorias aparecem abaixo dele, recolhidas por padrão, e podem ser marcadas;
  - há um campo "Outro problema", em texto livre;
  - um contador mostra quantos problemas estão marcados.
  - Esta lista substitui a pergunta 1.2.2 (componentes): as subcategorias cumprem esse papel (Q1).
- **Aceite:**
  - marcar ou desmarcar todos não apaga o texto de "Outro";
  - a validação considera o passo respondido com ao menos um problema ou um "Outro" preenchido;
  - a seleção fica no estado e no export.
- **Onde:** `fluxo.js`, `fluxo_dados.js` (`CAMPOS`, novo tipo `problemas`), `fluxo.css`.

### RQ-09 · A pessoa só preenche os dados da rede — P1
- **Origem:** "ai ele só preenche os dados da rede dele."
- **Requisito:** ao marcar problemas, os campos de texto do 1.2 vêm preenchidos como "sugerido", reaproveitando o mecanismo `sugDe` e `S.respC`:
  - 1.2.3 (descrição curta): junção dos problemas marcados;
  - 1.2.5 (impactos): os impactos sugeridos pelos problemas;
  - 1.2.6 (resultado esperado): os objetivos dos problemas, com lacunas para os números da rede (ex.: "reduzir de __% para __%").
  - O 1.2.4 (situação atual) continua aberto, porque descreve a rede. Recebe um modelo com lacunas ("Na rede, __ estudantes…").
  - Mudar a seleção recalcula só as sugestões ainda não confirmadas.
- **Aceite:**
  - com um problema marcado, o 1.2 pode ser concluído preenchendo só as lacunas numéricas e a situação atual;
  - as sugestões mostram a etiqueta "sugerido" até a pessoa confirmar ou editar.
- **Onde:** `fluxo.js` (`padroesGerados`), `fluxo_dados.js`.

---

## 4. Respostas "Sim" e "Em parte" pedem o detalhe

### RQ-10 · 1.2.7 linha de base: qual problema e qual medida — P1
- **Origem:** "1.2.7 se marcar que sim ele adicionar qual problema tbm, pode ser textual tbm."
- **Requisito:**
  - quando a resposta for "Sim, medida" ou "Em parte ou estimada", aparecem dois campos:
    - (a) "Para quais problemas?": caixas com os problemas marcados no 1.2;
    - (b) "Qual medida?": texto livre, com exemplo do tipo "avaliação estadual de leitura do 5º ano, 2025";
  - o campo (a) aceita também texto livre quando não houver problemas marcados.
- **Aceite:**
  - os campos somem quando a resposta for "Não", e os dados ficam guardados caso a pessoa volte;
  - os detalhes aparecem no perfil do caso no plano e no PDF.
- **Onde:** `fluxo_dados.js` (`CAMPOS`, nova propriedade `detalhe`), `fluxo.js`, `resumo.js`, `plano_pdf.js`.

### RQ-11 · 1.3.1 a 1.3.6: "Qual?" sempre que for Sim ou Em parte — P1
- **Origem:** "1.3.1 a mesma coisa sempre que for sim ou partial, em todos dessa 1.3.X que tem de marcar é isso."
- **Requisito:**
  - em todas as perguntas de governança (`QUESTOES_G`), "Sim" ou "Em parte" abre um campo de detalhe com rótulo próprio:
    - 1.3.1 "Qual equipe ou instância? Quem participa?";
    - 1.3.2 "Qual documento? (nome, data ou link)";
    - 1.3.3 "Quais normas já foram identificadas?";
    - 1.3.4 "Qual política ou norma de dados?";
    - 1.3.5 "Quais orientações? Para quem?";
    - 1.3.6 "Quais regras ou modelos?";
  - quando for "Em parte", o campo pergunta também "O que falta?";
  - o mecanismo é genérico (propriedade `detalhe` na pergunta), para reaproveitar em outras perguntas.
- **Aceite:**
  - os detalhes entram no perfil do caso, no bloco B do plano e nas recomendações:
    - ex.: com "Em parte" e o que falta descrito, a recomendação cita o que falta;
  - o campo é opcional e não bloqueia a conclusão do passo.
- **Onde:** `fluxo_dados.js`, `fluxo.js`, `recomendacoes.js`, `resumo.js`, `plano_pdf.js`.

### RQ-12 · Estender o padrão a outras perguntas Sim/Não — P3
- **Origem:** inferido de "a mesma coisa sempre que for sim".
- **Requisito:** aplicar o mesmo campo de detalhe em:
  - 1.2.8 ("Qual alternativa sem IA foi comparada?");
  - 2.3.2 (já existe a lista de ferramentas).
- **Aceite:** só se confirmado (Q2).

---

## 5. Camada 2 enxuta no piloto

### RQ-13 · No piloto, só o mínimo da camada 2 — P1
- **Origem:** "quando for pilot tem que vir só o minimo na cama[da] 2 … nem tudo que esta ali é de pilot." Por decisão do usuário, trata-se da **camada 2**: aplicações de IA, experiência de uso e adoção, ou seja, os passos 2.1, 2.2 e 2.3.
- **Requisito:**
  - quando o 2.0 for "Piloto", "Prova de conceito" ou os dois, os passos 2.1–2.3 mostram só as perguntas necessárias para o teste;
  - as demais perguntas da camada 2 descem para a implantação (fase 3), onde são decididas;
  - no fim de cada passo, uma linha recolhida avisa "Para a implantação (pode responder agora ou depois)" e abre essas perguntas;
  - no passo 3.1 aparece um cartão "Perguntas da camada 2 que ficaram para a implantação", com link para cada uma;
  - os passos 2.4, 2.5 e 2.6 (camadas 3, 6 e 7) não mudam neste requisito.
- **Classificação** (derivada da `MATRIZ`, RQ-02):

| Passo (camada 2) | Fica no piloto | Desce para a implantação | Na prova de conceito |
|---|---|---|---|
| 2.1 Aplicações | 2.1.1 tarefas; 2.1.2 título (opcional) | — | igual ao piloto |
| 2.2 Experiência de uso | 2.2.1 quem usa; 2.2.2 quem é afetado; 2.2.3 o que fazem com a resposta | 2.2.4 frequência (o custo do teste usa a sugestão) | só 2.2.1 (quem testa); 2.2.2–2.2.4 descem |
| 2.3 Adoção | 2.3.1–2.3.3 quantas e quais ferramentas; 2.3.4 tecnologia; 2.3.5 pagamento no teste; 2.3.8 tamanho do teste | 2.3.6 licença; 2.3.7 adaptação | igual ao piloto |

- **Aceite:**
  - com "Piloto", a camada 2 passa de 14 para 11 perguntas visíveis;
  - com "Prova de conceito", passa para 9;
  - a estimativa de custo continua completa, usando as sugestões para o que desceu;
  - a mandala, o contador e a validação contam só as perguntas visíveis em cada fase;
  - nenhuma resposta já dada se perde ao trocar o 2.0;
  - sem resposta no 2.0, todas as perguntas aparecem, como na v12.
- **Onde:** `MATRIZ` (RQ-02), `fluxo_dados.js` (condição `se`, nova propriedade `fasePiloto`), `fluxo.js` (contagem, validação, mandala, cartão no 3.1), `custos_ui.js` (`cfgDoCaso`, valores padrão), testes.

### RQ-14 · Recomendações já marcadas na camada 2 do piloto — P1
- **Origem:** "e trazer marcado as recomendações."
- **Requisito:**
  - quando o 2.0 for respondido, as perguntas da camada 2 que ficam no teste vêm com a resposta recomendada marcada como "sugerido";
  - cada sugestão mostra uma linha "Por que esta sugestão", com a regra em linguagem simples;
  - as sugestões são:
    - 2.2.1, quem usa: vem das tarefas, como já ocorre; na prova de conceito, "equipe da rede";
    - 2.3.1, quantas ferramentas: "uma" no teste, porque testar uma ferramenta por vez permite saber o que funcionou;
    - 2.3.4, tecnologia: não é sugerida, pois depende do mercado;
    - 2.3.5, pagamento no teste: "Doação ou piloto gratuito" quando a tecnologia é paga, com a recomendação de prever em contrato o preço depois do teste;
    - 2.3.8, tamanho do teste: os padrões da v10 (prova de conceito com 15 pessoas e 2 meses; piloto com cerca de 5% das escolas e 4 meses);
    - as perguntas que desceram para a implantação também recebem sugestão, usada no custo até a pessoa responder.
  - Mantém a regra da v10: nada vem marcado antes de a pessoa responder a pergunta de origem.
- **Aceite:**
  - num caso em branco nada vem marcado;
  - depois do 2.0, os campos da camada 2 que ficam no teste aparecem como "sugerido", menos a tecnologia;
  - ao confirmar ou editar, a etiqueta some;
  - trocar o 2.0 recalcula só o que não foi confirmado.
- **Onde:** `fluxo.js` (`padroesGerados`), `fluxo_dados.js` (`sugDe`), `custos_ui.js`.

### RQ-15 · O que a fase 1 já responde — P1
- **Origem:** "entender o que do 1 já ajuda a responder isso."
- **Requisito:** mapear e implementar as sugestões que nascem da fase 1:

| Origem (fase 1) | Sugere |
|---|---|
| 1.2 problemas marcados | 2.1.1 tarefas (RQ-16), 1.2.5 impactos |
| 1.1.4–1.1.5 etapas e estudantes | 2.2.2 afetados; tamanho do piloto (2.3.8); 4.1.1 pessoas na rede |
| Prioridade "Governar a IA" | tarefas de gestão; usuários = gestores e equipes técnicas |
| Prioridade "Educar sobre a IA" e "Educar para a era da IA" | formação (2.5) como componente principal; usuários = professores e estudantes |
| 1.3.x com "Não" ou "Não sei" | recomendações "Antes do teste", já ligadas no plano |
| 1.2.7 linha de base "Não" | 2.6.3 acompanhamento intensivo e recomendação de medir antes do teste |

- A tabela final fica em `plano/8_mapa_sugestoes.md` e vira teste.
- **Aceite:** cada linha da tabela tem um teste que marca a origem e confere a sugestão no destino.
- **Onde:** `fluxo.js`, `fluxo_dados.js`, `recomendacoes.js`, testes.

### RQ-16 · 2.1.1 já vem marcado — P1
- **Origem:** "2.1.1 quando marcar já traz."
- **Requisito:**
  - ao marcar problemas no 1.2, as tarefas do 2.1.1 vêm marcadas como "sugerido", a partir de `problemas[].tarefas`;
  - ao marcar as tarefas, o 2.2 continua sugerido, como já é hoje.
- **Aceite:**
  - num caso com problemas marcados, o 2.1.1 abre com as tarefas sugeridas;
  - sem problemas marcados, nada vem marcado.
- **Onde:** `prioridades.js`, `fluxo.js`.

### RQ-17 · 2.3 com o mesmo comportamento — P1
- **Origem:** "2.3 a mesma coisa dos anteriores."
- **Requisito:** no passo 2.3 (Adoção) valem as três regras anteriores:
  - (a) mínimo no piloto (RQ-13);
  - (b) sugestões marcadas a partir das respostas anteriores (RQ-14 e RQ-15):
    - número de ferramentas a partir das tarefas;
    - tecnologia, pagamento e licença a partir do tipo de teste;
  - (c) campo de detalhe quando "Sim" (RQ-11): o 2.3.2 "Você já sabe quais?" com "Sim" abre a lista de ferramentas, como já faz.
- **Aceite:** num caso com 1.2, 2.0 e 2.1 respondidos, o 2.3 abre com sugestões em todos os campos que ficam no piloto.

---

## 6. Idiomas

### RQ-18 · Árabe, mandarim, bambara, zulu e suaíli — P2
- **Origem:** "ferramenta: Árabe, Mandarim, Bambara, Zulu, Swahili."
- **Requisito:** adicionar cinco idiomas aos atuais EN, PT, ES e FR:

| Idioma | Código | Escrita | Observações |
|---|---|---|---|
| العربية (árabe) | `ar` | árabe, da direita para a esquerda | layout espelhado; fonte com formas ligadas |
| 中文 (mandarim) | `zh-Hans` | chinês simplificado | fonte CJK em subconjunto |
| Bamanankan (bambara) | `bm` | latina com ɛ ɔ ɲ ŋ | fora do WinAnsi; precisa de fonte embutida no PDF |
| isiZulu (zulu) | `zu` | latina | — |
| Kiswahili (suaíli) | `sw` | latina | — |

- **Requisitos derivados:**
  - **Direção RTL:**
    - `dir="rtl"` e `lang` no `<html>`;
    - CSS com propriedades lógicas (margin-inline etc.);
    - stepper, cartões, tabelas, setas e lightbox espelhados;
    - números e valores monetários mantidos da esquerda para a direita;
    - a mandala não é espelhada.
  - **Fontes:**
    - Noto Sans Arabic, Noto Sans SC (em subconjunto só com os caracteres usados) e uma fonte latina estendida para o bambara;
    - fontes embutidas na página e no PDF (jsPDF com `addFont`; no árabe, as formas ligadas e a ordem RTL);
    - limite do artifact: 16 MB. Hoje ele tem 2,6 MB. Uma fonte CJK completa tem de 8 a 16 MB, por isso o subconjunto é obrigatório.
  - **Números e moeda:**
    - formatação por idioma com `Intl.NumberFormat`;
    - sufixos de grandeza (`grande`/`unidMil`) definidos para cada idioma.
  - **Seletor:** nomes de cada idioma na própria escrita.
- **Qualidade da tradução e aviso na plataforma:**
  - eu produzo as traduções a partir do EN, com um glossário fixo (camadas, fases, "system", "procurement plan", "proof of concept", "pilot");
  - ainda não há revisão por falantes nativos;
  - nos cinco idiomas novos, a plataforma mostra um aviso fixo, escrito no próprio idioma e repetido em inglês: "A linguagem desta versão é uma tradução preliminar e ainda precisa ser revisada por falantes nativos.";
  - o aviso aparece em quatro lugares:
    - (a) logo abaixo do seletor de idioma, ao escolher o idioma;
    - (b) numa faixa discreta no topo da página;
    - (c) no rodapé do plano de contratação;
    - (d) na capa e no rodapé do PDF;
  - o aviso sai por idioma, com uma marca `revisado: true` no dicionário, sem mexer no código.
- **Aceite:**
  - `test_idiomas.py` com 0 restos nos 9 idiomas;
  - o aviso de tradução preliminar aparece nos cinco idiomas novos, em todos os lugares listados, e não aparece em PT, EN, ES e FR;
  - o PDF gerado em `ar` e `zh-Hans` não tem caracteres trocados por "?" e o árabe sai ligado e na ordem certa;
  - a página a 400 px em `ar` não tem rolagem horizontal.
- **Onde:** `i18n.js`, `build.sh`, `i18n/v13_*_{ar,zh,bm,zu,sw}.json`, `fluxo.css`, `plano_pdf.js`, `custos_ui.js` (formatação), `shell.html`.
- **Ordem:** este requisito é executado por último, depois que os textos da v13 estiverem estáveis, para não traduzir duas vezes.

---

## 7. Itens transversais

### RQ-19 · Migração de casos salvos (v12 → v13) — P1
- **Requisito:**
  - `dominio: 'qualificacao'` → prioridade "Educar com a IA";
  - `comps` → subcategorias equivalentes;
  - `olhando` é mantido;
  - os exemplos A–D de `casos.js` são reescritos com problemas do catálogo;
  - o formato de exportação passa a 12, e os formatos 9 a 11 continuam importáveis.
- **Aceite:**
  - os exemplos A–D e um caso v12 exportado abrem sem perda;
  - os números de custo dos exemplos não mudam (`test_v9_numeros.py`).

### RQ-20 · Plano de contratação e PDF — P1
- **Requisito:**
  - o perfil do caso mostra prioridade(s), problemas, subcategorias, objetivos e os detalhes de "Qual?";
  - a matriz do caso entra como seção (RQ-03);
  - as recomendações usam os detalhes;
  - o rótulo "Problema e impacto" passa a "Prioridade e impacto".
- **Aceite:**
  - `test_v9_plano.py`, `test_v10_recs.py` e `test_v12_pdf.py` atualizados e verdes;
  - o PDF de exemplo é regerado.

### RQ-21 · Testes e regras de sempre — P1
- **Requisito:** continuam verdes:
  - `node tests/test_custos_v2.js`;
  - `node tests/test_v9_motor.js`;
  - `node tests/test_v10_formula.js`;
  - `python3 tests/test_v9_fluxo.py`;
  - `python3 tests/test_v9_plano.py`;
  - `python3 tests/test_v10_recs.py`;
  - `python3 tests/test_v12_pdf.py`;
  - `python3 tests/test_v9_numeros.py`;
  - `python3 test_idiomas.py`.
- **Testes novos:**
  - `test_v13_matriz`;
  - `test_v13_prioridades`, com seleção, "marcar todos" e sugestões;
  - `test_v13_piloto`, com a contagem de perguntas e as sugestões;
  - `test_v13_rtl`.
- **Regras que se mantêm:**
  - não inventar referências;
  - não falar em nome da UNESCO nem de outra instituição;
  - valores sempre marcados como ilustrativos;
  - não reduzir fontes;
  - sem gerúndio em nomes de seção;
  - EN com "system" e "education system";
  - PT é a chave de tradução.

---

## 8. Ordem de execução proposta

1. **Conteúdo:** sua revisão do catálogo (Anexo A) e da classificação da camada 2 no piloto (RQ-13).
2. **Modelo:**
   - `MATRIZ` (RQ-02);
   - `PRIORIDADES` (RQ-05 e RQ-06);
   - mapa de sugestões (RQ-15);
   - migração (RQ-19).
3. **Percurso:**
   - 1.2 novo (RQ-04 e RQ-07 a RQ-09);
   - campos de detalhe (RQ-10 e RQ-11);
   - piloto enxuto e sugestões (RQ-13, RQ-14, RQ-16 e RQ-17).
4. **Telas:** página inicial (RQ-01); tabela da matriz (RQ-03).
5. **Plano e PDF** (RQ-20).
6. **Idiomas** (RQ-18).
7. **QA:**
   - todos os testes;
   - leitura do caminho completo nos 9 idiomas;
   - 400 px;
   - publicação como v13.

As etapas 2 a 5 podem ser divididas em pacotes paralelos com arquivos exclusivos, como nas v9–v12. A etapa 6 depende das anteriores.

---

## 9. Perguntas em aberto

As decisões de 16 out. estão no início do documento. Restam estas, e enquanto não houver resposta vale a proposta:

| # | Pergunta | Proposta |
|---|---|---|
| Q1 | A antiga pergunta 1.2.2 (componentes) sai e as subcategorias tomam o lugar dela? | Sim. |
| Q2 | O padrão "Qual?" vale também para o 1.2.8 (alternativa sem IA)? | Só 1.2.7 e 1.3.x. |
| Q3 | A página inicial mantém os logos da v12? | Sim. |
| Q4 | Os itens novos do catálogo (três impactos e a tarefa `pratica_ia`) podem entrar? | Sim. |
