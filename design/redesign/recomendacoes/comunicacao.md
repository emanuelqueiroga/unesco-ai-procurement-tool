# Parecer: comunicação das recomendações para gestores públicos

Especialidade: documentos de decisão e comunicação para gestores públicos (notas técnicas, relatórios executivos, linguagem simples, peças anexadas a processos administrativos).
Sigla dos requisitos: COM. Material lido: `regras.json` (66 regras, 59 `RECS`, 6 `ACOES_G`), `recomendacoes_exemplos.md` (A a D), `casos.json`, `plano_B_pdf.txt` (as 37 páginas, inteiro), `app/src/domain/recomendacoes.js`, `app/src/plano/relatorio.js` (`relAcoes`, `partesAcao`, textos `acPara*`, `acComo`, `acQuando*`), `app/src/percurso/sintese.ts` e `app/src/screens/Percurso.tsx` (síntese do capítulo 4), `design/redesign/04-requisitos-0015.md`.

Pergunta que orienta o parecer: depois de ler o plano, o gestor sabe **o que decidir, o que mandar fazer, quem faz, até quando e como vai saber que ficou pronto**? Hoje, não: o plano lista bem o que falta, mas ainda não funciona como peça de decisão.

---

## 1. Diagnóstico

**D1. Há prioridade demais, e por isso ela perde o sentido.** No B são 25 ações, 12 de prioridade "alta"; no C são 23, com 12 "alta". A capa do B anuncia "12 ações de prioridade alta" (PDF p. 1). Para quem decide, doze prioridades não ordenam nada. A ordenação de `recomendacoesCaso` usa só prioridade, depois momento, depois a ordem de declaração. Como as perguntas `QUESTOES_G` entram primeiro, `g-dados` fica em 1º no B e no C só por ter sido declarada antes. Nenhum critério de risco, dinheiro ou dependência entra na ordem.

**D2. "Comece por estas" repete a mesma ação e deixa de fora o que mais pesa.**
- No C, os cartões 2 (`teste-recomendado`), 3 (`teste-ambos`) e 4 (`tecnologia`) dizem a mesma coisa: "faça a prova de conceito antes do piloto". São três dos cinco espaços.
- No B, quatro dos cinco cartões tratam de dados (`g-dados`, `formacao-dados`, `dados-acordo`, `dados-base-legal`), e dois vêm da mesma resposta 2.1.1.
- No D, os cartões 1 e 2 saem da mesma resposta 2.3.5 (`gratis-adiados`, `gratis-fim`).
- No A, `etapas` fica fora dos cinco, embora seja o maior compromisso do caso: implantar em 800 escolas e 12.000 pessoas de uma vez. Em seu lugar aparecem `formacao-papeis` e `criancas` (média).

**D3. O "Por quê" quase nunca dá uma razão.** Em 15 dos 20 cartões dos quatro exemplos, o "Por quê" repete a resposta: "A resposta 'Em parte' à pergunta 1.3.4…". O próprio `04-requisitos-0015.md` registra isso como defeito a não portar. Quando há razão, ela sai de um corte no primeiro ":" (`partesAcao` + `RE_RAZAO`), e o corte erra:
- D, `termos`: O quê = "Termos de uso padrão não bastam" (um diagnóstico, sem verbo de ação) e Por quê = "Negocie um contrato…" (que é a ação).
- B, `teste-rever`: O quê = "Rever a escolha do piloto", que não diz para fazer o quê.
- Na lista completa (PDF p. 13–14), a coluna se chama "Por quê", mas mostra a origem ("1.3.4 … -> Em parte").

**D4. "Para quê", "Como" e "Quando" são textos fixos e por isso não informam.**
- "Para quê" tem 6 frases, uma por tipo e momento (`acParaPolT` etc.). Os cinco cartões do B dizem a mesma coisa: "Proteger estudantes e professores e garantir que o teste possa ser avaliado". No D, a mesma frase aparece para um caso que só afeta servidores (`disp-proprio`).
- "Como" é sempre "Revise a resposta X e siga o detalhe em 'O que fazer'". Isso manda o leitor de volta ao questionário. Não diz como fazer a ação, e a página indicada não traz um detalhe correspondente (por exemplo, `ferramentas-cotacao` no A).
- "Quando" tem só 3 rótulos genéricos e não diz o marco do processo (autorização do teste, termo de referência, assinatura).

**D5. "Quem?" aponta quem sabe responder, não quem age.** `quemSabe(pergunta)` devolve a área que conhece a pergunta de origem, e a nota do PDF admite isso (p. 3). O resultado é um erro de atribuição que vai para o processo. No B, "Assinar acordo de tratamento de dados" e "Confirmar a base legal" ficam com "Área pedagógica e professores", quando cabem à assessoria jurídica e ao encarregado de dados. No A, `g-comite` fica com "Gabinete, assessoria jurídica e proteção de dados", quando é ato do gabinete.

**D6. Falta o critério de pronto, e sem ele não há como fiscalizar.** Nenhuma das 66 regras diz qual documento ou fato comprova que a ação foi feita: ato publicado, cláusula no termo de referência, relatório aprovado, ata. Num processo administrativo, uma ação sem evidência não pode ser acompanhada, nem cobrada, nem dada como concluída.

**D7. Algumas regras disparam fora do contexto do caso.**
- `disp-proprio` (D, cartão 3, alta) fala de "soluções das famílias", mas os usuários do D são servidores administrativos e gestores.
- `criancas` (A) pede "uso adequado à idade" num copiloto que só professores usam (2.2.1 = professores; 2.2.2 inclui crianças apenas como afetadas).
- `consumo-monitorar` (B) diz "cada uso é cobrado", mas a estimativa do B põe "Consumo de IA (uso pago)" em US$ 0 nas três fases (p. 4). O custo de uso real é a hora de GPU (US$ 26,7 a 33,2 mil por ano, p. 6–7).
- `arquitetura-decidir` (B) pede para "decidir a arquitetura", enquanto "Em resumo" já afirma "Ponto de partida de arquitetura: Modelo de pesos abertos em infraestrutura contratada" (p. 2).
- Na saída dos exemplos, o "Por quê" mostra códigos crus ("→ nao_sei", "→ api").

**D8. Resumo e corpo se contradizem em pontos que alguém vai questionar no processo.**
- A "Recomendação principal" da capa vem da frase A1 do bloco de teste (`pdf.js`), não da lista de ações. No B ela corresponde ao cartão 2, não ao 1.
- O custo de saída aparece como US$ 126.482 (p. 5 e p. 8) e como "Sair do contrato custaria US$ 112,9 mil" (p. 23), sem explicar a diferença.
- Prioridade é "Alta/Média" na lista e "Alta/Normal/—" na tabela de governança (p. 15).
- O texto de abertura cita "as listas dos blocos A e B, a seguir", blocos que não existem no plano (p. 13).
- `g-dados` vai para "antes do teste" (`cedo`), mas "Entregáveis" fala em "condições de governança confirmadas antes de contratar".

**D9. Comandos demais, sem separar o que é deste caso do que é lista de referência.** Somei o que o plano do B manda fazer: 25 ações, mais 6 da tabela de governança (repetidas), 5 funções não terceirizáveis, 6 regras do piloto, 11 de capacidade mínima, 22 "antes de levar à rede", 13 "para manter", cerca de 60 critérios dos pontos de decisão, 23 cláusulas, 8 requisitos de dados e 6 elementos de contestação. Passa de 150 comandos. Várias ações aparecem duas ou três vezes com outras palavras:
- supervisão humana (p. 13, p. 17, p. 18);
- avaliação de impacto (p. 14, p. 17);
- base legal e acordo de dados (p. 13, p. 16);
- contestação (p. 13, p. 27);
- monitorar consumo (p. 14, p. 17, p. 19, p. 23);
- formação contínua (p. 14, p. 18).

O gestor não tem como saber quais itens são "as recomendações" e quais são checklist do guia.

**D10. Recomendações genéricas, que valem para qualquer caso.**
- `formacao-continua`, `expansao-recorrente` e `formacao-horas` saem nos 4 exemplos.
- `g-etica` sai nos 4.
- `g-comite` e `g-compras` saem em 3 dos 4.

Nenhuma delas traz um número do caso, embora o motor tenha esse número. No B, 75% do custo é recorrente, a camada 7 pesa 54% e o maior direcionador é o custo de pessoal (−US$ 84 mil a +US$ 125,9 mil). Nenhuma ação manda confirmar o pessoal (1 pessoa de engenharia de ML e 1 de monitoramento por ano), nem a adoção de 40%, que faz o custo por usuário ativo (US$ 12,77) ser 2,6 vezes o custo por aprendiz com acesso (US$ 4,97).

**D11. O fim do percurso não tem um próximo passo.** A síntese do capítulo 4 (`Sintese`, n = 4) diz "O plano está completo", mostra um parágrafo sobre a expansão, o custo total e "Já apareceram 25 recomendações, 12 de prioridade alta · ver no plano". Não mostra a decisão principal, nem as três primeiras ações, nem a dotação do Ano 0, nem as pendências (respostas "não sei", valores ilustrativos). Não há nada pronto para levar à reunião.

**D12. Defeitos de forma no PDF e no celular.** No PDF, os rótulos "O quê?" e "Por quê?" se sobrepõem em todos os cartões ("1 OPorquê? quê?", p. 3). A seta "→" vira "->" (p. 13–14). A lista completa em 3 colunas (Ação | Por quê | Prioridade) não cabe a 360 px. As citações "(Krueger e Jackson, 2026, p. 6)" ficam no meio da frase de ação e alongam o cartão.

**O que está bom e deve ficar:**
- Toda ação mostra a pergunta e a resposta que a originou, com link para a pergunta (`ir`). Isso dá rastreabilidade, que é rara e valiosa.
- Os três momentos (antes do teste, antes de contratar, para manter) correspondem bem aos marcos do processo.
- Quase todos os textos começam com verbo no infinitivo e não usam jargão.
- O formato de seis perguntas por cartão é certo, só precisa de conteúdo próprio.
- Os pontos de decisão trazem "Se não: …" (p. 19–22), um ótimo modelo de consequência.
- O aviso "Valores ilustrativos" e a nota sobre a UNESCO protegem quem anexa o plano ao processo.

---

## 2. Recomendações que faltam ou precisam mudar

Legenda de prioridade proposta (ver M2): **Condição**, sem a qual o marco não pode ocorrer; **Recomendada**, que melhora custo ou risco; **Acompanhar**, rotina depois do contrato. Marcos: **M1** autorização do teste; **M2** decisão sobre o resultado do teste; **M3** termo de referência ou edital; **M4** assinatura do contrato de implantação; **M5** revisão anual.

| id proposto | Gatilho (campos existentes) | Texto da recomendação | Por quê | Como | Quem age | Quando | Prioridade e critério | Referência |
|---|---|---|---|---|---|---|---|---|
| `teste-poc-antes` (substitui `teste-rever`) | `testes`=['piloto'] e `rec.modo` ∈ {poc, ambos} | Fazer uma prova de conceito do {2.1.2 título}, sem estudantes e com dados de teste, antes do piloto em {2.3.8 escolas} escolas. | A solução será feita sob medida (2.3.7) e ainda não se sabe se funciona. Começar pelo piloto expõe {participantes} pessoas a algo não testado e compromete {custo de implantação do Ano 0} antes de saber. | 1) Escrever a hipótese técnica e de 2 a 4 critérios de aprovação. 2) Contratar a prova de conceito como objeto separado, sem obrigação de piloto. 3) Registrar em ata a decisão de avançar ou parar. | Gabinete decide; tecnologia e área pedagógica executam | Antes do teste (M1) | Condição: afeta crianças e é difícil reverter | Guia do projeto, cap. 14 (já citado no plano, p. 15) |
| `teste-unico` (une `teste-recomendado`, `teste-ambos`, `tecnologia` quando disparam juntas) | `testes`=['recomendar'] e `rec.modo`='ambos', ou `tipoTec`='nao_sei' | Escolher a tecnologia por consulta ao mercado e prova de conceito; fazer o piloto em poucas escolas só se a prova cumprir critérios fixados antes. | Hoje não se sabe o tipo de tecnologia (2.3.4) nem a licença (2.3.6). Sem isso, não há preço, cláusula nem arquitetura para contratar. | 1) Publicar uma consulta ao mercado. 2) Testar 2 ou 3 opções na prova de conceito. 3) Fixar os critérios do piloto. 4) Decidir em ata. | Compras e tecnologia | Antes do teste (M1) | Condição: bloqueia todas as ações de contrato | Guia, cap. 14; Lei 14.133/2021, art. 18 (estudo técnico preliminar), no Brasil |
| `dados-pacote` (une `g-dados`, `dados-acordo`, `dados-base-legal`, `dados-impacto`, `formacao-dados`) | `dadosEst` | Concluir o pacote de proteção de dados dos estudantes antes do teste: base legal, acordo de tratamento que proíba treinar modelos, avaliação de impacto e regras de guarda e exclusão. | O caso trata dados pessoais e inferências sensíveis de {n} estudantes, em sua maioria menores de idade. Sem essas peças, o teste não tem base legal e a rede perde o controle do destino dos dados. | Cada passo termina num documento: parecer jurídico; acordo assinado; relatório de impacto aprovado; política de dados com prazos de guarda; módulo de proteção de dados na formação. | Encarregado de proteção de dados e assessoria jurídica | Antes do teste (M1); relatório de impacto atualizado antes de M4 | Condição: obrigação legal com dados de menores | LGPD (Lei 13.709/2018), arts. 14 e 38; GDPR (Regulamento UE 2016/679), art. 35 |
| `criancas` (desdobrar) | (a) `afetados` inclui criancas e `usuarios` inclui estudantes; (b) `afetados` inclui criancas e `usuarios` não inclui estudantes | (a) Informar as famílias por escrito, em linguagem simples, antes do teste: o que a ferramenta faz, que dados usa e como pedir revisão; ajustar o uso à idade. (b) Garantir que o professor revise o que a ferramenta gera antes de usar com estudantes. | (a) Estudantes usam a ferramenta diretamente e por anos (efeito cumulativo elevado, p. 25). (b) Estudantes não usam o copiloto, mas recebem o que ele produz. | (a) Carta modelo às famílias, canal de dúvidas, idade mínima definida. (b) Regra de revisão no guia de uso e na formação. | (a) Área pedagógica e direção das escolas; (b) formação de professores | Antes do teste (M1) | (a) Condição; (b) Recomendada | UNESCO (2023), *Guidance for generative AI in education and research* (idade mínima e proteção de dados); ECA (Lei 8.069/1990), no Brasil |
| `disp-proprio` (condicionar) | `modeloDisp`='proprio' e `usuarios` inclui estudantes → texto atual; `modeloDisp`='proprio' e `usuarios` só servidores ou gestores → texto novo | (novo) Definir regras para o uso do celular pessoal dos servidores: acesso por conta institucional, nenhum dado guardado no aparelho e uma alternativa para quem não quiser usar o próprio aparelho. | No D, os usuários são servidores, não famílias. O risco está na segurança dos dados da rede e no custo que fica com o servidor. | 1) Norma interna de uso. 2) Configuração de acesso. 3) Computador da escola como alternativa. | Tecnologia e gestão de pessoas | Antes do teste (M1) | Recomendada | Referência a verificar (política de uso de dispositivo pessoal) |
| `alternativa` (mudar momento e texto) | `alternativa`='nao' | Comparar, antes da prova de conceito, a solução com IA e ao menos uma alternativa sem IA que a rede já pode usar (no C: um alerta por faltas e notas), em custo e resultado esperado. | Se a alternativa simples resolver, o teste e a compra não são necessários. Comparar depois do teste gasta o Ano 0 ({custo do Ano 0}) à toa. | 1) Descrever a alternativa. 2) Estimar o custo dela. 3) Registrar a comparação no estudo técnico. | Área pedagógica e planejamento | Antes do teste (M1), não "antes de contratar" | Condição: pode eliminar a compra (dependência) | Guia, ponto de decisão 2 (p. 21 do plano) |
| `acao-apos-saida` (nova) | `consequencias` inclui apoio_est ou recursos | Definir o que acontece depois de cada alerta ou priorização: quem procura o estudante, em quanto tempo e com que apoio, e reservar essa capacidade nas escolas. | Um alerta sem resposta não muda a trajetória do estudante e ainda gera trabalho. O custo dessa resposta não está na estimativa. | 1) Fluxo de atendimento com prazos. 2) Pessoas por escola. 3) Indicador "alertas atendidos no prazo". | Área pedagógica e direção das escolas | Antes do teste (M1) | Condição: sem ação depois da saída, não há valor público | Guia, ponto de decisão 2: "ação útil definida para depois da saída do sistema" (p. 21) |
| `grupos-teste` (nova) | `consequencias` inclui apoio_est ou recursos, e `afetados` inclui criancas | Verificar, antes do piloto e a cada trimestre, se a ferramenta erra mais para algum grupo de estudantes (escola, zona rural, deficiência, sexo, cor ou raça), e suspender o uso se a diferença passar do limite fixado. | A ferramenta decide quem recebe apoio primeiro, e o mesmo grupo é afetado por anos (p. 25). Um erro concentrado num grupo amplia a desigualdade que o caso quer reduzir (1.2.5). | 1) Fixar o limite. 2) Pedir ao fornecedor os dados por grupo. 3) Relatório trimestral. | Avaliação e proteção de dados | Antes do teste (M1); depois, Acompanhar | Condição | NIST (2023), *AI Risk Management Framework 1.0*; guia, ponto de decisão 3 (p. 21) |
| `contestacao` (texto para crianças) | `consDecide` e `afetados` inclui criancas | Criar um canal para estudantes e famílias pedirem revisão do que a ferramenta indicou, em linguagem adequada à idade, com prazo de resposta e uma pessoa com autoridade para corrigir. | O perfil de risco do caso diz que a contestação "existe apenas formalmente" (p. 25). | Os seis elementos da p. 27, cada um com responsável. | Área pedagógica e ouvidoria | Antes do teste (M1) | Condição | Guia, ponto de decisão 3 (p. 21) |
| `pessoal-confirmar` (nova, ligada a número) | O 1º direcionador do motor é "Custo carregado de pessoal", ou a soma de pessoas em tempo integral (ETI) > 1 | Confirmar com gestão de pessoas o custo anual e a disponibilidade das {ETI} pessoas que a estimativa prevê ({funções}). É o item que mais muda o total ({faixa em US$}). | Se essas pessoas não existirem na rede, o custo vira contrato com um integrador e a dependência muda de lugar. | 1) Lista de funções, com nome ou vaga. 2) Custo real carregado. 3) Atualizar a calculadora. | Gestão de pessoas e tecnologia | Antes de contratar (M3) | Recomendada; vira Condição se o efeito no total for > 5% | Krueger e Jackson (2026), camadas 6 e 7 (p. 11) |
| `consumo-limites` + `consumo-monitorar` (unir e corrigir) | `pagamento`='consumo'; texto conforme `arquitetura` (efetiva ou presumida) | (API) Exigir no contrato limite de gasto, alertas e relatório mensal de consumo antes da fatura. (pesos abertos) Exigir do provedor de nuvem limite, alerta e relatório mensal das horas de GPU. | No B, o custo de uso vem dos servidores ({horas de GPU} por ano, {US$}), não de cobrança por interação, e cresce com a adoção. | Cláusula no termo de referência (M3); acompanhamento mensal, com limite de alerta em % do orçamento. | Compras (cláusula); fiscal do contrato (acompanhamento) | M3 e Acompanhar | Recomendada | Krueger e Jackson (2026), p. 6 |
| `arquitetura-decidir` (mudar quando há presunção) | `arquitetura`='nao_sei' e a ferramenta presume uma arquitetura | Confirmar ou trocar a arquitetura presumida ({arquitetura presumida}) antes de contratar a implantação: a estimativa e as cláusulas deste plano partem dela. | Mudar a arquitetura muda quem integra, quem opera e quanto custa sair ({custo de saída}). | Responder 3.2.1 com a equipe técnica; refazer a estimativa. | Tecnologia | Antes de contratar (M3) | Recomendada | Guia, cap. 9 (mapa de arquitetura, D9) |
| `adocao-meta` (nova, ligada a número) | `elegiveis` > 0 e adoção do último ano < 50% | Fixar uma meta de uso por etapa e usar o custo por usuário ativo ({US$}) como critério para passar à expansão: a estimativa supõe que só {x}% das pessoas com acesso vão usar. | Abaixo da meta, cada usuário custa {razão} vezes o valor por pessoa com acesso. | Meta no plano de avaliação; indicador mensal; critério escrito em `implantacao-criterios`. | Área pedagógica e avaliação | Antes de contratar (M3) | Recomendada | Referência a verificar (Krueger e Jackson, 2026, página a confirmar) |
| `etapas` (texto com números) | `implTudo` e `eleg` ≥ 5000 | Implantar primeiro em parte das {3.1.1 escolas} escolas e avançar só se uso, resultado e custo cumprirem as metas: hoje a primeira etapa já cobre toda a rede. | Contratar tudo de uma vez compromete {custo do Ano 1} sem evidência de uso real em escala. | Dividir a implantação em lotes; critérios de avanço no contrato. | Gabinete e compras | Antes de contratar (M3) | Condição quando o Ano 1 > 50% do custo total; senão, Recomendada | Guia, cap. 14 ("contratar por etapas", p. 15 do plano) |
| `gratis-pacote` (une `gratis-adiados`, `gratis-fim`, `gratis-ativos`) | `gratis` | Antes de aceitar o teste gratuito, assinar um termo com o preço depois do período gratuito, o destino dos dados e dos materiais se o fornecedor não for escolhido e os custos que ficam com a rede (formação, integração, proteção de dados e suporte). | O gratuito adia custos e cria dependência antes da competição. No D, a rede paga {custo do Ano 0 fora da licença} mesmo sem licença. | Um termo com 3 cláusulas; anexar ao processo. | Compras e assessoria jurídica | Antes do teste (M1) | Condição | Krueger e Jackson (2026), p. 7–8 |
| `termos` (reescrever com verbo) | `licenca`='termos' | Negociar um contrato próprio, em vez de aceitar os termos de uso padrão, com cláusula de que termos publicados na internet não alteram o contrato. | Termos padrão podem mudar sem aviso: preço, uso de dados e funções ficam nas mãos do fornecedor. | Hierarquia documental no contrato (p. 23). | Compras e assessoria jurídica | Antes de contratar (M4) | Condição | Guia, cap. 16 (Instrumento F) |
| `saida-pacote` (une `sob-medida` e o custo de saída) | `adaptacao`='sob_medida' ou custo de saída ≥ 0,3 ano de custo recorrente | Garantir no contrato que código, configurações e dados são da rede, com o pacote de transição definido e um teste de exportação no primeiro ano. Sair custaria {US$} ({x} ano de custo recorrente). | Sem esses direitos, a saída depende de negociar depois com o próprio fornecedor. | Os 7 itens do pacote de transição (p. 24) como anexo do termo de referência; teste de exportação em M5. | Compras e tecnologia | Antes de contratar (M3) | Condição | Guia, caps. 10 e 16 |
| `g-comite` (critério de pronto) | `g-comite` ∈ {nao, parcial, nao_sei} | Designar por ato formal a equipe responsável por IA na educação, com nomes, horas dedicadas e representantes de pedagogia, tecnologia, jurídico, compras, proteção de dados e direção. | Alguém precisa aceitar riscos, interpretar evidências e decidir a continuidade: são funções que não podem ser terceirizadas (p. 16). | Minuta de ato; primeira reunião com pauta; registro em ata. | Gabinete do secretário | Antes do teste (M1) quando `dadosEst`; senão, M3 | Condição | Krueger e Jackson (2026), p. 12 |
| `copiloto-dados` (nova) | `usuarios` inclui professores, `dadosEst` falso e `tarefas` inclui planos_aula ou materiais | Orientar os professores a não inserir dados pessoais de estudantes no copiloto e exigir que a ferramenta não guarde nem use o que eles digitam para treinar modelos. | O caso foi classificado como sem dados de estudantes, mas na prática professores costumam colar nomes e notas. | Regra no guia de uso; módulo na formação; cláusula de não treinamento. | Formação de professores e tecnologia | Antes do teste (M1) | Recomendada | UNESCO (2023), *Guidance for generative AI in education and research* |
| `pendencias` (nova, caso incompleto) | Respostas "nao_sei", "sugerido" ou estimativa ilustrativa que mudam o custo ou uma cláusula | Responder as {n} perguntas em aberto ({lista com números}) antes de levar o plano à decisão: elas mudam o custo ou as cláusulas. | Uma decisão tomada sobre premissas presumidas tende a ser contestada no processo. | Link para cada pergunta; mostrar o efeito de cada uma no total, quando o motor o tiver. | Quem preenche o plano | Antes de levar à decisão | Fora da lista de ações; bloco próprio | Não se aplica |
| `custo-recorrente` (substitui `formacao-continua` + `expansao-recorrente` nos cartões) | `eleg` > 0 | Reservar no orçamento de cada exercício o custo recorrente previsto ({dotação dos Anos 1 a 3}) e revisá-lo a cada ano, junto com a formação de quem entra na rede. | {x}% do custo total se repete todo ano (p. 5). Se não estiver na lei orçamentária, o uso para no Ano 2. | Incluir na proposta orçamentária; revisão anual em M5. | Planejamento e orçamento | Antes de contratar (M4); depois, Acompanhar | Recomendada | Krueger e Jackson (2026), p. 6 |

---

## 3. Mudanças no desenho do sistema

**M1. Três níveis de saída, cada um com teto, e as listas de referência separadas.**
- **Decisões** (no máximo 3, em "Em resumo" e na capa): o que só o dirigente decide, por exemplo "Autorizar a prova de conceito antes do piloto", "Designar a equipe por ato" e "Reservar US$ 300,4 mil no exercício do Ano 0".
- **Comece por estas** (5 cartões).
- **Plano de ação** (em "O que fazer"): de 8 a 12 *pacotes*, cada um com de 2 a 5 passos.
- Todo o resto (capacidade mínima, "antes de levar à rede", pontos de decisão, cláusulas) recebe o rótulo **"Lista de verificação do guia (referência)"** e passa a citar as ações pelo id, sem repetir o texto.

Assim o B cai de 25 ações soltas para cerca de 10 pacotes, com as mesmas 25 origens rastreáveis.

**M2. Prioridade por pontuação explícita, com rótulos que dizem a consequência.** A pontuação soma 5 critérios:

| Critério | Pontos |
|---|---|
| Bloqueio: impede o próximo marco | 0 ou 4 |
| Pessoas e direitos: crianças, decisões sobre pessoas, dados sensíveis; usa `perfil` | 0 a 3 |
| Dinheiro em jogo: efeito no total pela sensibilidade do motor, ou parte da camada | 0 a 3 |
| Irreversibilidade: contrato, saída, dados | 0 a 2 |
| Dependência: outras ações dependem desta (por exemplo `alternativa` e `teste-*` antes das de contrato) | 0 a 2 |

O desempate é pelo marco mais próximo. "Condição" vale para pontuação ≥ 7 com bloqueio, "Recomendada" para o resto antes de M4, "Acompanhar" para depois de M4. Os pontos de cada ação ficam registrados na própria ação (`pontos`, `criterio`), para que o desenvolvedor possa auditar a ordem.

**M3. Escolher os cinco cartões com regra de diversidade.** Os 5 cartões são as 5 maiores pontuações, com três restrições:
- no máximo 1 cartão por pacote;
- no máximo 1 por pergunta de origem;
- pelo menos 1 de custo ou contrato quando houver.

A "Recomendação principal" da capa passa a ser o cartão 1 (uma só fonte), e não mais a frase A1.

**M4. Esquema da recomendação com campos próprios, sem cortar texto no ":".** Campos de cada ação:

| Campo | O que guarda |
|---|---|
| `oque` | Frase de ação: verbo no infinitivo + objeto, até 25 palavras, sem citação |
| `porque` | A razão, com o risco de não fazer, até 30 palavras, com número do caso quando houver |
| `paraque` | O estado de sucesso, específico da ação |
| `como` | De 2 a 4 passos |
| `quem` | Área que age, definida pela regra, e não por `quemSabe` |
| `marco` | M1 a M5 |
| `pronto` | Evidência de conclusão: documento ou fato |
| `exige` | Ids de cláusulas em "O que exigir" |
| `numero` | Função que lê o motor de custos |
| `base` | Referência |
| `origem` | Pergunta → resposta, como já existe |
| `pacote` | Pacote ao qual a ação pertence |

`partesAcao` e `RE_RAZAO` saem. "Quem" por pergunta continua como alternativa de reserva, com a nota atual.

**M5. Ligar cada ação a um número.** Quando a regra tem `numero`, o cartão mostra a linha "O que está em jogo", por exemplo:
- "US$ 112,9 mil para sair";
- "o item que mais muda o total: −US$ 84 mil a +US$ 125,9 mil";
- "6.000 estudantes no piloto".

O número vem do mesmo seletor de `numerosCusto` que alimenta o resto do plano, para não haver dois valores. Isso resolve também a divergência US$ 126.482 × US$ 112,9 mil: escolher uma das duas contas, ou rotular cada uma ("custo econômico de saída" × "desembolso de saída").

**M6. Ligar cada ação a uma cláusula.** Toda ação de custo ou contrato tem `exige`. Em "O que exigir", a coluna "Neste caso" passa a mostrar o id da ação ("R-09"), e o "Como" do cartão leva à âncora da cláusula. Uma ação de contrato sem cláusula correspondente é erro de teste.

**M7. Caso incompleto: pendências fora da lista de ações.**
- Respostas "não sei", sugeridas ou estimadas viram o bloco **"Antes de decidir, responda"** (`pendencias`), com o efeito de cada uma no custo quando o motor tiver esse dado.
- Uma ação cuja premissa está pendente sai da lista enquanto a pendência existir. Exemplo: no C, `lic-institucional` (acompanhar a adoção de uma assinatura) quando o tipo de tecnologia ainda é "não sei".
- No caso em branco, o plano mostra "Ainda sem recomendações" e as 3 perguntas que mais liberam ações (2.0, 2.1.1, 2.3.5).

**M8. O que muda na página e no PDF.**
- **Em resumo**: Recomendação principal = cartão 1; quadro "Para levar à reunião" (M9); cartões com "O que está em jogo" e "Pronto quando".
- **O que fazer**: pacotes em sanfona na página e tabela no PDF com Nº | Ação | Quem | Até (marco) | Pronto quando | Origem. Os ids ficam estáveis (R-01, R-02…) e são os mesmos na página, no PDF e na exportação, para que o processo possa citá-los.
- **Exportação**: o "Plano de ação" sai em planilha (CSV/XLSX), com a coluna "Situação" vazia, para acompanhamento.
- **PDF**: corrigir a sobreposição dos rótulos (p. 3), "->", "blocos A e B", "Normal/Média" e "Alta" duplicada.
- **Celular**: em telas estreitas, os rótulos dos cartões ficam acima do conteúdo, e a lista completa vira itens, não tabela.
- **Identificação**: o rodapé de cada página leva identificação suficiente para anexar ao processo: título do caso, data, versão e o número da página.

**M9. O que o gestor leva para a reunião.** Uma página (página web e 1ª página do PDF depois da capa) com:
1. a decisão pedida, em uma frase;
2. o custo do Ano 0 e a dotação do exercício;
3. as 5 ações com quem faz e até quando;
4. as 3 exigências de contrato que não podem faltar;
5. as pendências, com o seu número.

Ela pode ser impressa sozinha. É a peça que vai para o despacho e precisa ficar coerente com o resto do plano (COM-03).

**M10. Fim do percurso (síntese do capítulo 4).** O bloco "Já apareceram N recomendações" dá lugar a "Seu próximo passo":
- a recomendação principal, com o porquê numa linha;
- as 3 primeiras ações, com quem faz e o marco;
- a dotação do Ano 0;
- "Faltam {n} respostas para fechar o plano", com link.

Botões: "Baixar a página da reunião" e "Baixar o plano completo (PDF)". O custo total continua como número do capítulo.

**Modelos de texto por tipo de recomendação** (para os autores das regras e para a tradução):

| Tipo | Modelo | Exemplo (caso) |
|---|---|---|
| Ato de governança | [Verbo] por [instrumento] [objeto], com [elementos mínimos], antes de [marco]. *Pronto quando:* [ato publicado ou assinado]. | Designar por ato formal a equipe de IA na educação, com nomes e horas dedicadas, antes de autorizar o piloto. *Pronto quando:* ato publicado. (B) |
| Exigência de contrato | Exigir no [termo de referência ou contrato] [obrigação verificável], com [prazo, medida ou sanção]. *Pronto quando:* cláusula nº __ no termo de referência e aceita na proposta. | Exigir do provedor de nuvem limite de gasto, alerta e relatório mensal das horas de GPU. (B) |
| Confirmar premissa de custo | Confirmar [premissa] com [fonte]: a estimativa usa [valor ilustrativo], e o total pode variar [faixa]. *Pronto quando:* valor substituído na calculadora, com a fonte. | Confirmar o custo e a disponibilidade das cerca de 4 pessoas em tempo integral previstas (engenharia de ML, monitoramento, produto, infraestrutura, suporte): o total varia de −US$ 84 mil a +US$ 126 mil. (B) |
| Desenho do teste ou de etapa | Fazer [teste] de [escopo e duração] antes de [etapa]; avançar só se [critérios]. *Pronto quando:* relatório do teste com a decisão em ata. | Fazer uma prova de conceito sem estudantes antes do piloto em 20 escolas. (B) |
| Proteção de pessoas | Antes de [marco], [verbo] [salvaguarda] para [grupo afetado], em [forma acessível]. *Pronto quando:* [documento aprovado ou comunicado enviado]. | Informar as famílias por escrito, em linguagem simples, antes do teste. (B) |
| Acompanhamento | Acompanhar [indicador] a cada [frequência]; se passar de [limite], [ação] por [responsável]. *Pronto quando:* relatório com o limite em uso. | Acompanhar o custo por usuário ativo todo mês; acima de US$ 15, rever a meta de adoção. (B) |
| Coerência ou pendência | Rever a resposta [n] ([valor]): ela conflita com [n2] ([valor]) e muda [custo ou cláusula]. | Confirmar a arquitetura presumida (pesos abertos) antes de contratar. (B) |

---

## 4. Requisitos

| Id | Requisito (verificável) | Prior. | Como verificar |
|---|---|---|---|
| COM-01 | Toda ação tem `oque` começando com verbo no infinitivo, com até 25 palavras, sem citação bibliográfica e sem ":" que separe diagnóstico e ação. | P1 | Teste de lint sobre as 66 regras e os textos de RECS e ACOES_G; `termos` e `teste-piloto-possivel` devem passar depois de reescritas. |
| COM-02 | O "Por quê" de cada cartão é uma razão diferente da origem; o texto "A resposta X à pergunta n" só aparece no campo Origem. | P1 | Nos 20 cartões de A a D, nenhum `porque` casa com `/^A resposta/`. |
| COM-03 | A recomendação principal da capa e de "Em resumo" é o cartão 1 de "Comece por estas" e o item 1 da página da reunião. | P1 | Nos 4 exemplos, comparar as três strings: devem ser idênticas. |
| COM-04 | Os 5 cartões têm no máximo 1 por pacote e 1 por pergunta de origem. | P1 | C não pode ter 2 de {teste-*, tecnologia}; B não pode ter 2 do pacote de dados; D não pode ter 2 de 2.3.5. |
| COM-05 | Cada ação tem `quem` definido pela regra (área que age); a tabela de áreas é revista por pessoa da gestão pública. | P1 | `dados-pacote` no B mostra "Encarregado de proteção de dados e assessoria jurídica", e não "Área pedagógica". |
| COM-06 | Cada ação tem `marco` (M1 a M5) e `pronto` (evidência). Nenhum cartão sai sem os dois. | P1 | Teste: todas as ações dos 4 exemplos com `marco` e `pronto` não vazios. |
| COM-07 | "Para quê" é próprio da ação; no máximo 2 cartões do mesmo caso podem ter o mesmo texto. | P2 | Contar os `paraque` distintos nos 5 cartões de cada exemplo: ≥ 4. |
| COM-08 | No máximo 3 decisões e 5 cartões; o plano de ação tem no máximo 12 pacotes no nível de cima. | P1 | B: ≤ 12 pacotes, com as 25 origens ainda presentes como passos. |
| COM-09 | As ações "Condição" são no máximo 6 por caso; acima disso, o plano avisa que o caso não está pronto para o marco seguinte. | P2 | B e C com ≤ 6 "Condição" ou com o aviso visível. |
| COM-10 | A ordem segue a pontuação de M2, e a pontuação de cada ação pode ser consultada (modo desenvolvedor ou dados de teste). | P2 | No A, `etapas` fica entre os 5 cartões (implantação de 800 escolas = 100% da rede). |
| COM-11 | Ações com `numero` mostram "O que está em jogo" com o mesmo valor que aparece no resto do plano. | P1 | No B, o custo de saída citado no cartão é igual ao de "O que exigir" e ao de "Quanto custa", ou cada um tem rótulo distinto. |
| COM-12 | Toda ação de custo ou contrato tem ao menos 1 cláusula em `exige`, e a cláusula mostra o id da ação. | P1 | Teste cruzado entre regras e Instrumento F nos 4 exemplos. |
| COM-13 | Uma regra não dispara para uma população ausente do caso. | P1 | D não mostra "famílias" (`disp-proprio`); A não mostra "uso adequado à idade". |
| COM-14 | O texto de consumo segue a arquitetura: com pesos abertos, fala em horas de servidor, e não em "cada uso é cobrado". | P1 | B: o texto cita GPU; a linha "Consumo de IA" de US$ 0 não contradiz o cartão. |
| COM-15 | Respostas "não sei" e sugeridas aparecem em "Antes de decidir, responda", fora da lista de ações; as ações que dependem delas saem até a resposta. | P2 | C: `lic-institucional` não aparece enquanto `tipoTec`='nao_sei'; B: arquitetura aparece como "confirmar a presumida". |
| COM-16 | A síntese do capítulo 4 mostra a recomendação principal, 3 ações com quem e marco, a dotação do Ano 0 e o número de pendências, com botão para a página da reunião. | P1 | Teste da tela `Sintese` n = 4 com o exemplo B. |
| COM-17 | Existe a página da reunião (1 página A4 no PDF, imprimível sozinha) com a decisão, o custo do Ano 0, as 5 ações, as 3 exigências e as pendências. | P1 | PDF do B: a página cabe em 1 folha; o texto é coerente com COM-03. |
| COM-18 | Ids estáveis (R-nn) iguais na página, no PDF e na exportação; o plano de ação sai em planilha com a coluna Situação. | P2 | Gerar o B duas vezes sem mudar respostas: mesmos ids; o CSV abre com as colunas Nº, Ação, Quem, Até, Pronto quando, Origem, Situação. |
| COM-19 | Listas que não são ações do caso trazem o rótulo "Lista de verificação do guia (referência)" e citam a ação pelo id, sem repetir o texto. | P2 | B: "Definir a supervisão humana" aparece uma vez como ação; nas listas de referência aparece só "ver R-nn". |
| COM-20 | Vocabulário único de prioridade (Condição, Recomendada, Acompanhar) em todas as tabelas, sem "Normal" nem "—". | P2 | Busca no PDF dos 4 exemplos. |
| COM-21 | O PDF não sobrepõe rótulos dos cartões, usa "→", e não cita blocos inexistentes. | P1 | Extrair o texto do PDF do B: não pode conter "OPorquê", "->" nem "blocos A e B". |
| COM-22 | A 360 px, cartões e lista de ações não exigem rolagem horizontal; os rótulos ficam acima do conteúdo. | P2 | Playwright a 360 × 740 na página do plano do B: `scrollWidth` ≤ `clientWidth`. |
| COM-23 | Os textos das ações passam em linguagem simples (frases ≤ 25 palavras, sem sigla sem explicação na primeira ocorrência) nas 9 línguas. | P3 | Lint de comprimento por língua; revisão humana de uma amostra por língua. |
| COM-24 | Os nomes de instrumentos que dependem do país (ato, termo de referência, relatório de impacto) vêm do perfil de país, com termo genérico quando não houver perfil. | P3 | Com país = Brasil, `dados-pacote` cita "relatório de impacto à proteção de dados pessoais"; sem país, "avaliação de impacto sobre a proteção de dados". |

---

## 5. Conflitos e dúvidas para o coordenador

1. **Agrupar × rastrear.** Pacotes reduzem o volume (25 para cerca de 10), mas um pacote tem várias perguntas de origem, e a área jurídica ou de risco pode preferir cada obrigação como item próprio. Proposta: o pacote mostra cada passo com a sua origem. Cabe a você decidir se o pacote ou o passo recebe o id R-nn citável no processo.
2. **Teto de "Condição" × rigor.** Os especialistas em proteção de dados e em risco tendem a marcar tudo o que envolve dados de crianças como obrigatório. Limitar a 6 (COM-09) pode parecer afrouxar. Alternativa: sem teto, e o aviso "o caso não está pronto para o teste" quando o número passar de 6.
3. **Linguagem jurídica de um país × uso internacional.** "Ato", "termo de referência", "estudo técnico preliminar", "relatório de impacto" e "encarregado" funcionam no Brasil, mas não em 9 línguas e em todos os sistemas. Decidir se o perfil de país passa a fornecer esses nomes (COM-24) ou se a ferramenta fica só com termos genéricos.
4. **A ferramenta pede "decisões" ao dirigente?** A página da reunião com "Decisão pedida" aproxima o plano de uma nota técnica com recomendação formal. Isso exige cuidado com a nota "as opiniões são desta ferramenta e não da UNESCO" e com a responsabilidade de quem assina. Decidir o tom: "decisão sugerida" ou "decisão a tomar".
5. **Exportação editável.** Para anexar ao processo e acompanhar, o gestor precisa de uma planilha ou de um documento editável do plano de ação (COM-18). Isso cria mais um formato para manter nas 9 línguas. Decidir se entra nesta versão ou se basta o PDF com ids estáveis.

---

### Referências citadas neste parecer
- Krueger, K. e Jackson, F. para CoSN (2026). *Beyond the price tag: Rethinking total cost of ownership for AI in education systems*. Paris: UNESCO.
- UNESCO (2023). *Guidance for generative AI in education and research*. Paris: UNESCO.
- NIST (2023). *Artificial Intelligence Risk Management Framework (AI RMF 1.0)*. NIST AI 100-1.
- Brasil. Lei nº 13.709/2018 (LGPD), arts. 14 e 38. Lei nº 14.133/2021 (licitações e contratos), art. 18. Lei nº 8.069/1990 (ECA).
- União Europeia. Regulamento (UE) 2016/679 (GDPR), art. 35.
- ISO 24495-1:2023. *Plain language — Part 1: Governing principles and guidelines* (base para COM-01 e COM-23).
- W3C (2023). *Web Content Accessibility Guidelines (WCAG) 2.2* (base para COM-22).
- Guia do projeto (caps. 2, 5, 9, 10, 14, 16; pontos de decisão 1 a 9), como citado no próprio plano.
- Lei brasileira de linguagem simples (Política Nacional de Linguagem Simples, 2025): referência a verificar.
