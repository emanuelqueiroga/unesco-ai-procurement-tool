# Parecer do painel: pedagogia, gestão escolar e formação docente (PED)

Escopo: formação inicial e continuada, uso da IA em sala e no planejamento, apoio pedagógico nas escolas, papel do diretor e do coordenador, adoção real versus acesso, indicadores de uso e de aprendizagem, estudantes com dificuldades e pouca conectividade. A pergunta que guia o parecer: as recomendações ajudam a ferramenta a ser **usada**, e não só comprada?

Material lido: `regras.json` (66 regras, `RECS`, `ACOES_G`), `recomendacoes_exemplos.md`, `casos.json`, `plano_B_pdf.txt`, `app/src/domain/recomendacoes.js`, `framework.js` (OPC), `fluxo_dados.js` (CAMPOS), `casos.js` (premissas de formação), `custos.js` (curvas de adoção dos exemplos do guia) e `plano/relatorio.js` (`relAcoes`).

---

## 1. Diagnóstico

1. **A formação aparece como custo e não como condição de uso.** As sete regras de formação (`formacao-pagador`, `formacao-contrato`, `formacao-parceiro`, `formacao-horas`, `formacao-continua`, `formacao-papeis`, `formacao-dados`) tratam de quem paga, do contrato e de horas a confirmar. Nenhuma diz **como** formar para o uso pedagógico (prática com a própria turma, acompanhamento em ciclos, apoio na escola). `formacao-horas` só pede para "confirmar" a estimativa de 3 h (A), 2 h (B), 3 h (C) e 1,5 h (D). Para professores que vão mudar o planejamento (A) ou a aula de matemática (B), duas ou três horas ensinam a entrar na ferramenta, não a usá-la para ensinar. A estimativa vem dos exemplos do guia (`horasFormacaoPorArq`). O defeito é que a recomendação aceita esse valor como plano.

2. **Duas regras saem em todos os casos e não dizem nada específico.** `formacao-continua` ("Planejar formação contínua, e não única") aparece em A, B, C e D. Não diz cadência, formato nem responsável. `expansao-recorrente` também aparece nos quatro, porque basta `k.eleg > 0`. As duas ocupam espaço e ensinam o leitor a ignorar a lista.

3. **A escola não aparece como lugar de implantação.** `p-apoio` ("Organizar apoio pedagógico aos professores do piloto") existe, mas só na lista genérica "Capacidade mínima nos locais" (PDF B, p. 16) e nunca nas ações priorizadas. Nenhuma regra fala do diretor nem do coordenador pedagógico, que decidem horário, sala e dispositivos e acompanham o uso. As opções de `formados` (2.5.1) não incluem a coordenação pedagógica. `formacao-papeis` (A e B) pede para formar "as equipes técnicas e de gestão que vão governar e manter a IA", o que fala da secretaria e não da escola.

4. **A adoção real é um número do motor que não vira ação.** O motor supõe que só parte das pessoas com acesso usa de fato: em A, 35% no Ano 1 e 50% no Ano 3; em B, 45%, 35% e 40% (`custos.js`, exemplos do guia). O PDF B anuncia "Solução em uso por 60.000 pessoas no Ano 3 (40% das que têm acesso)" e coloca a "Taxa de adoção" entre os direcionadores do custo (tornado, p. 4). Mesmo assim, nenhuma recomendação define o que conta como uso de fato, mede esse uso por escola ou diz o que fazer quando ele cai. `lic-institucional` (A, C) só manda renegociar o preço. `p-adocao` e `s-adocao` são frases soltas.

5. **Nenhuma regra pergunta em que momento da rotina escolar o uso acontece.** Para A, a questão é se o professor tem tempo de planejamento na jornada para usar o copiloto. Para B, é em que aula ou turno o estudante pratica e por quantos minutos por semana. Em B, `modeloDisp = compartilhado` usa a premissa de 3 estudantes por dispositivo (`estudantesPorDispositivo: 3`), o que contradiz o objetivo de "prática individualizada" escrito em 1.2.4. A regra disparada (`disp-compartilhado`) trata só de logística: carregar, atualizar, separar contas.

6. **A supervisão humana não é proporcional à tarefa.** `supervisao` ("quem revisa cada saída antes de uma decisão sobre estudantes") dispara em B porque `consequencias` inclui `apoio_est`. Um tutor contínuo produz milhares de respostas por dia, e nenhum professor revisa cada uma. Uma regra impossível de cumprir vira letra morta na escola. Em B, o que cabe é revisar amostras e dar ao professor um painel da turma. Em C, revisar cada alerta antes de agir é correto, mas falta o principal (item 7).

7. **No exemplo C, o alerta não leva a nenhuma ação.** Das 23 recomendações de C, nenhuma define o que a escola faz quando um estudante é sinalizado: quem procura o estudante, em quantos dias, com que apoio e onde registra. Nenhuma verifica se as equipes conseguem atender o volume de alertas (80.000 estudantes do ensino médio em 300 escolas) nem trata do estigma, embora o resultado esperado diga "sem gerar estigmatização". `formacaoTipo` de C não inclui `pedagogico`, e nenhuma regra nota a falta. A literatura de sistemas de alerta precoce é clara: o indicador só funciona ligado a um protocolo de intervenção.

8. **No exemplo A, ninguém verifica a qualidade do material gerado nem o uso do tempo liberado.** Com `consequencias = nenhuma`, nada dispara sobre revisar o material antes de ele chegar às crianças (`afetados` inclui `criancas`). `i-geracao` ("Instalar filtros e revisão para o conteúdo gerado") fica só na lista genérica. O subproblema C4b ("Adaptação para estudantes com dificuldades") está marcado, mas nenhuma regra chama a educação especial para validar as adaptações. O resultado de A é "liberar tempo para acompanhamento individual", e nenhuma recomendação mede em que esse tempo foi usado. O custo de A já inclui uma "Amostragem pedagógica de qualidade" (0,2 de especialista, K5.3) que não aparece em nenhuma ação.

9. **Os indicadores de aprendizagem não servem para o teste que foi desenhado.** O piloto de B dura 4 meses, e a linha de base é a avaliação de matemática do 9º ano, que é anual. Com esse desenho, o piloto não consegue mostrar efeito sobre a aprendizagem. Nenhuma regra pede indicadores intermediários (dose de uso, avaliação curta no início e no fim do piloto), um grupo de comparação ou dados separados para os estudantes com maior defasagem, que são o alvo declarado. As regras de linha de base (`linha-base*`) só verificam se ela existe.

10. **Os cartões "Comece por estas" não servem a quem implementa.**
    - "Quem?" sai de `quemSabe` da pergunta de origem. Por isso `dados-acordo` e `dados-base-legal` saem com "Área pedagógica e professores" (cartões B4, B5, C5), quando deveriam ser jurídico e proteção de dados.
    - "Como?" é sempre "Revise a resposta X e siga o detalhe em…", o que remete à resposta e não descreve uma ação.
    - "Para quê?" repete o mesmo texto em todos os cartões de política antes do teste.
    - Em B, um tutor para 150.000 estudantes, nenhum dos 5 cartões fala de professores, sala, tempo ou uso. Três dos cinco tratam de dados.
    - Em A, o primeiro cartão é "Pedir cotação".

    A ordenação (prioridade → momento → ordem de inserção, com `ACOES_G` inseridas primeiro) põe a governança na frente por construção.

11. **Algumas regras não se aplicam ao caso em que disparam.** Em D, os usuários são servidores e gestores, mas `disp-proprio` diz "depender de soluções das famílias pode ampliar desigualdades". Também em D, `criancas` corretamente não dispara, mas nada trata da adoção pelos servidores: a curadoria das normas (`i-base`) e o encaminhamento à equipe quando a resposta não basta ficam na lista genérica. Os servidores só passam a usar o assistente se confiarem nas respostas.

12. **O que está bom e deve ficar:**
    - O "por quê" que cita a pergunta e a resposta.
    - Os três momentos.
    - `internet-teste` (incluir no piloto escolas com internet fraca), a melhor regra de equidade do conjunto.
    - `disp-proprio`, quando o caso envolve estudantes.
    - `formacao-dados`, que acerta em B.
    - `formacao-pagador` em C.
    - `teste-ambos` e `teste-rever`.
    - `acomp-reforcar`.
    - `p-desplug`, que existe mas precisa sair da lista genérica (ver PED-R22).

---

## 2. Recomendações que faltam ou precisam mudar

Legenda dos gatilhos: `c.` é o caso (`caso` em `casos.json`); `k.` é o contexto já calculado em `recContexto`. "pergunta nova" marca campos que ainda não existem.

| id | Gatilho | Texto (O quê) | Por quê | Como | Quem age | Quando | Prioridade (critério) | Referência |
|---|---|---|---|---|---|---|---|---|
| PED-R01 `formacao-ciclos` (substitui o uso atual de `formacao-horas` para professores) | `formados` ∋ professores **e** (`tarefas` ∩ {planos_aula, materiais, tutoria, feedback_redacao, correcao, alerta_precoce} ≠ ∅) **e** horas por pessoa < 8 | Planejar a formação dos professores em ciclos ao longo do teste, com prática na própria turma, e não só uma oficina inicial. | Uma oficina de 2 a 3 horas ensina a acessar a ferramenta, mas não a usá-la para ensinar, e o uso costuma cair depois das primeiras semanas. A formação com mais efeito é longa, ligada ao conteúdo, com prática e retorno. | 1) Uma oficina inicial curta de acesso. 2) Três a quatro encontros de 1 a 2 h, a cada 3 ou 4 semanas, com exemplos trazidos da turma. 3) Acompanhamento por coordenador ou formador entre os encontros. 4) Refazer a estimativa com as horas planejadas (mostrar a diferença de custo). | Formação de professores | Antes do teste | Alta se `usuarios` ∋ estudantes ou o impacto for aprendizagem; média nos outros casos | Darling-Hammond, Hyler e Gardner (2017), *Effective Teacher Professional Development*, Learning Policy Institute; Yoon et al. (2007), *Reviewing the evidence on how teacher professional development affects student achievement*, REL Southwest (IES) |
| PED-R02 `tempo-jornada` | pergunta nova `tempoJornada` (2.5.6: "A formação e o uso cabem na jornada paga dos professores?" sim / em parte / não); sem resposta e `formados` ∋ professores → dispara | Garantir que a formação e o primeiro uso aconteçam dentro da jornada paga dos professores e incluir esse tempo no orçamento. | A formação fora do horário tem pouca adesão e gera passivo trabalhista. O tempo do professor é custo da camada 6, mesmo quando não é gasto novo. | 1) Usar as horas de trabalho pedagógico coletivo da escola. 2) Calcular professores × horas × custo da hora. 3) Prever substituição se a formação cair em horário de aula. 4) Combinar o calendário com as direções. | Gestão de pessoas e formação | Antes do teste | Alta (sem tempo não há uso) | Brasil: Lei 11.738/2008, art. 2º, § 4º (no máximo 2/3 da jornada com estudantes); outros países: regra local (camada `pais.js`) |
| PED-R03 `referencia-escola` | pergunta nova `apoioEscola` (2.6.4: "Quem apoia os professores na escola no dia a dia?" coordenação pedagógica / formador da secretaria / professor de referência / ninguém definido); sem resposta ou "ninguém" e piloto com escolas | Nomear em cada escola do teste uma pessoa de referência, da coordenação pedagógica ou um professor, com horas para apoiar os colegas no uso. | O suporte técnico resolve acesso e senha. A dúvida "como uso isto na minha aula" precisa ser resolvida na escola, por alguém que conhece a turma. | 1) Uma referência por escola, com 2 a 4 h semanais. 2) Formação extra para as referências. 3) Reunião mensal entre as referências. 4) Somar esse tempo ao custo de acompanhamento (2.6.3). | Área pedagógica e direções | Antes do teste | Alta com 5 escolas ou mais no piloto | Kraft, Blazar e Hogan (2018), "The effect of teacher coaching on instruction and achievement: a meta-analysis of the causal evidence", *Review of Educational Research* 88(4) |
| PED-R04 `direcao-escola` | `formados` ∌ gestores **e** `usuarios` ∩ {professores, estudantes} ≠ ∅ **e** não é só prova de conceito | Envolver diretores e coordenadores das escolas do teste antes de começar: eles decidem horário, salas e dispositivos e acompanham o uso. | Sem a direção, a ferramenta concorre com as outras prioridades da escola e o uso depende da boa vontade de cada professor. | 1) Reunião com as direções: objetivo, critérios de sucesso e de parada. 2) Marcar "Gestores escolares" em 2.5.1. 3) Pedir a cada escola um plano de uso de uma página (turmas, horários, quem acompanha). | Gestão escolar e regionais | Antes do teste | Média; alta se `usuarios` ∋ estudantes | Leithwood, Louis, Anderson e Wahlstrom (2004), *How leadership influences student learning*, Wallace Foundation |
| PED-R05 `uso-ativo` | qualquer caso com piloto ou implantação (`!k.poc` ou `k.implP > 0`) | Definir antes do teste o que conta como "uso de fato" e medi-lo todo mês, por escola e por turma. | A estimativa supõe que só {adoção Ano 1}% das pessoas com acesso vão usar. Se o uso for menor, o custo por usuário sobe, e sem medição ninguém percebe. A taxa de adoção é um dos principais direcionadores do custo deste caso. | 1) Escrever a definição (exemplo para professor: usou em pelo menos 2 semanas do mês; para estudante: pelo menos 30 min por semana). 2) Exigir do fornecedor relatório mensal por escola e turma em formato aberto. 3) Meta igual à adoção da estimativa. 4) Visitar ou apoiar as escolas abaixo da meta. | Área pedagógica e avaliação; tecnologia para os dados | Antes do teste | Alta (liga-se ao direcionador "Taxa de adoção") | Krueger e Jackson (2026), p. 3 (licenças não usadas); as definições de uso ativo são a calibrar: referência a verificar |
| PED-R06 `dose-estudante` | `tarefas` ∋ tutoria (ou pratica_ia) **e** `usuarios` ∋ estudantes | Fixar quanto tempo por semana cada estudante vai usar o tutor, em que aula ou turno, e acompanhar se essa dose acontece. | O efeito da prática adaptativa depende de uso regular. Sem um horário na grade, a dose fica baixa e desigual entre turmas. | 1) Definir a dose (exemplo: 2 sessões de 30 min por semana). 2) Colocar o horário na grade de cada turma do piloto. 3) Registrar a dose por estudante. 4) Avisar o professor quando um estudante ficar abaixo da dose. | Coordenação pedagógica e escolas | Antes do teste | Alta | Muralidharan, Singh e Ganimian (2019), "Disrupting Education? Experimental Evidence on Technology-Aided Instruction in India", *American Economic Review* 109(4); Escueta, Nickow, Oreopoulos e Quan (2020), "Upgrading Education with Technology", *Journal of Economic Literature* 58(4) |
| PED-R07 `disp-tutor-individual` | `tarefas` ∋ tutoria **e** `modeloDisp` ∈ {compartilhado, rotativo} | Rever o uso compartilhado de dispositivos para um tutor individual: organizar o rodízio para que cada estudante tenha tempo próprio, ou orçar mais dispositivos. | A estimativa considera {3} estudantes por dispositivo. Um tutor adaptativo acompanha um estudante de cada vez, e dividir a tela reduz a dose e a personalização. | 1) Calcular minutos por estudante por semana com as turmas e os dispositivos atuais. 2) Organizar a aula em estações: um grupo no tutor, um com o professor, um em atividade sem tela. 3) Se a dose não fechar, comparar com o cenário de um dispositivo por estudante. | Área pedagógica e infraestrutura escolar | Antes do teste | Alta (contradiz o objetivo do caso) | Modelo de rotação por estações: referência a verificar |
| PED-R08 `professor-dados-tutor` | `tarefas` ∩ {tutoria, feedback_redacao, correcao} ≠ ∅ **e** `usuarios` ∋ estudantes | Definir o que o professor faz com os relatórios do tutor: o que olha, com que frequência e que decisão toma (reagrupar, retomar um conteúdo, chamar um estudante). | Sem essa rotina, o tutor vira uma atividade paralela e o que ele descobre sobre a defasagem não chega à aula. | 1) Rotina semanal de 15 a 20 min com o relatório da turma. 2) A formação usa os relatórios reais das turmas do piloto. 3) Exigir no contrato um painel por turma e por habilidade. | Área pedagógica e formação | Antes do teste | Alta | Black e Wiliam (1998), "Assessment and classroom learning", *Assessment in Education* 5(1) |
| PED-R09 `tutor-curriculo` | `tarefas` ∋ tutoria | Verificar com professores, antes de abrir o tutor aos estudantes, que ele segue o currículo da rede e não entrega a resposta pronta. | Um tutor sem limites pode dar a resposta: o estudante acerta mais na prática e aprende menos. Um tutor fora da sequência da rede confunde a turma. | 1) Separar 30 a 50 tarefas do currículo da rede. 2) Professores testam o tutor com uma rubrica (correção, não dá a resposta, linguagem para a idade). 3) Fixar um critério de aprovação. 4) Incluir o critério como requisito do contrato. | Currículo e professores | Antes do teste (na prova de conceito, se houver) | Alta | Bastani et al. (2025), "Generative AI without guardrails can harm learning: Evidence from high school mathematics", *PNAS* |
| PED-R10 `revisao-material` | `tarefas` ∩ {planos_aula, materiais} ≠ ∅ | Orientar o professor a revisar todo material gerado antes de usá-lo com a turma, com um roteiro curto de revisão. | O material chega às crianças mesmo quando a resposta da ferramenta não decide nada sobre elas. Erro de conteúdo, desalinhamento com o currículo ou texto inadequado à idade passam direto para a turma. | 1) Roteiro de 5 itens na formação: correção, currículo, idade, viés e fontes. 2) A coordenação revisa uma amostra por mês (já está no custo: "Amostragem pedagógica de qualidade"). 3) Canal para relatar erros. | Coordenação pedagógica | Antes do teste | Média; alta se `afetados` ∋ criancas | UNESCO (2023), *Guidance for generative AI in education and research* |
| PED-R11 `tempo-liberado` | `impactos` ∋ tempo_docente | Medir o tempo de preparação antes e durante o teste com o mesmo instrumento e registrar em que o tempo liberado foi usado. | O objetivo é liberar tempo para acompanhar os estudantes. Se o tempo liberado vira outra tarefa administrativa, o resultado não acontece. | 1) Registro de tempo por 2 semanas antes do teste e de novo no 3º mês. 2) Uma pergunta sobre o uso do tempo liberado. 3) Qualidade dos materiais avaliada numa amostra. 4) Meta escrita (minutos por semana). | Avaliação e coordenação | Antes do teste | Alta quando é o impacto principal | EEF (2024), ensaio *Teacher Choices* sobre ChatGPT na preparação de aulas: referência a verificar (título e números) |
| PED-R12 `adaptacao-inclusao` | `ctx.subs` ∋ C4b **ou** `impactos` ∋ inclusao **ou** `ctx.problemas` ∋ C8 | Chamar os professores de educação especial para validar os materiais adaptados para estudantes com dificuldades ou deficiência. | Uma adaptação genérica pode baixar a exigência ou ignorar o plano individual do estudante. | 1) Revisar uma amostra de adaptações com a educação especial. 2) Orientação específica na formação. 3) Testar a acessibilidade (leitor de tela, contraste, libras ou legenda quando couber). | Educação especial e inclusão | Antes do teste | Média | Referência a verificar (norma nacional de educação especial) |
| PED-R13 `alerta-protocolo` | `tarefas` ∋ alerta_precoce | Definir antes do teste o que a escola faz quando um estudante é sinalizado: quem procura o estudante, em quantos dias, com que apoio e onde registra. | O alerta só reduz o abandono se virar ação. Sem protocolo, a lista cresce e as equipes deixam de olhá-la. | 1) Protocolo de uma página por nível de alerta. 2) Uma pessoa responsável por escola (coordenação ou orientação). 3) Prazo para o primeiro contato. 4) Registrar a ação e o resultado na própria ferramenta. 5) Articular com a busca ativa e a assistência social. | Área pedagógica e gestão escolar | Antes do teste | Alta | Faria et al. (2017), *Getting students on track for graduation: Impacts of the Early Warning Intervention and Monitoring System after one year*, REL Midwest (IES); Bruce, Bridgeland, Fox e Balfanz (2011), *On Track for Success*, Civic Enterprises e Everyone Graduates Center |
| PED-R14 `alerta-capacidade` | `tarefas` ∋ alerta_precoce | Verificar se as equipes das escolas conseguem atender o número de alertas previsto e ajustar o limiar ao que elas podem atender. | Com {alunos da etapa} estudantes em {escolas} escolas, se 1 em cada 10 for sinalizado, cada escola recebe em média {n} casos para acompanhar. | 1) Estimar com dados históricos quantos estudantes seriam sinalizados. 2) Comparar com as horas da coordenação e da orientação. 3) Fixar o limiar e a ordem de atendimento. 4) Rever o limiar a cada bimestre. | Área pedagógica e planejamento | Antes do teste | Alta | Referência a verificar |
| PED-R15 `alerta-estigma` | `tarefas` ∋ alerta_precoce **ou** (`consequencias` ∋ apoio_est **e** `afetados` ∋ criancas) | Limitar quem vê a sinalização de risco, não mostrá-la a estudantes e colegas e formar as equipes para tratá-la como motivo para conversar, e não como rótulo. | O caso pede para identificar "sem gerar estigmatização". Listas de risco expostas podem baixar as expectativas sobre o estudante. | 1) Definir perfis de acesso. 2) No painel, escrever "precisa de contato" em vez de "alto risco". 3) Formação sobre como conduzir a conversa. 4) Acompanhar as sinalizações por grupo (equidade). | Área pedagógica e proteção de dados | Antes do teste | Alta | Referência a verificar |
| PED-R16 `formacao-pedagogica` | `formacaoTipo` ∌ pedagogico **e** `formados` ∋ professores ou gestores **e** `tarefas` ⊄ {duvidas, rotinas} | Incluir o uso pedagógico na formação: como a ferramenta entra no planejamento e na aula (ou, num sistema de alerta, como agir), e não só como acessá-la. | Saber operar a ferramenta não é saber ensinar com ela. Em C, a formação prevista cobre tecnologia e dados, mas não o que fazer com o estudante sinalizado. | 1) Casos com a turma ou a escola real. 2) Simular o protocolo (C) ou a aula (A, B). 3) Retomar o tema nos ciclos de PED-R01. | Formação de professores | Antes do teste | Alta | UNESCO (2024), *AI competency framework for teachers* |
| PED-R17 `aprendizagem-piloto` | `impactos` ∋ aprendizagem **e** piloto com `meses` ≤ 6 | Medir a aprendizagem no piloto com uma avaliação curta no início e no fim, nas escolas do piloto e em escolas parecidas sem a ferramenta. | A avaliação anual (B: 9º ano) não capta um piloto de {meses} meses. Sem grupo de comparação, uma melhora pode ser de toda a rede. | 1) Escolher um instrumento alinhado ao currículo (por exemplo, a avaliação diagnóstica da rede). 2) Formar o grupo de comparação com escolas parecidas. 3) Cruzar o resultado com a dose de uso (PED-R06). 4) Critérios de sucesso e de parada escritos antes do início. | Avaliação | Antes do teste | Alta | Escueta et al. (2020), *JEL* 58(4) (desenho das avaliações revisadas); desenho do grupo de comparação: referência a verificar |
| PED-R18 `equidade-uso` | `impactos` ∋ desigualdade **ou** `consequencias` ∋ apoio_est | Acompanhar o uso e o resultado separadamente para os estudantes e as escolas com maior defasagem, que são o alvo do caso. | Quando o uso se concentra em quem já vai bem, a diferença entre estudantes cresce em vez de diminuir. | 1) Separar por grupo no painel e nos relatórios. 2) Meta de dose mínima para o grupo-alvo. 3) Garantir horário na escola para quem não tem acesso em casa. | Avaliação e área pedagógica | Antes do teste e para manter | Alta | Referência a verificar |
| PED-R19 `comunidade-pratica` | piloto com 5 escolas ou mais | Reunir os professores do piloto todo mês para trocar exemplos de uso e preparar alguns deles para formar os colegas na expansão. | Professores aprendem a usar uma ferramenta nova sobretudo com outros professores, e quem viveu o piloto forma melhor e a menor custo. | 1) Encontro mensal de 1 h (pode ser online). 2) Banco de exemplos de aulas e materiais. 3) Escolher multiplicadores entre os professores do piloto. 4) Contar os multiplicadores no plano de formação da expansão. | Formação de professores | Antes do teste e para manter | Média | Vescio, Ross e Adams (2008), "A review of research on the impact of professional learning communities on teaching practice and student learning", *Teaching and Teacher Education* 24(1); Wenger (1998), *Communities of Practice* |
| PED-R20 `formadores-expansao` | `expansao` = ano1 **e** (`implantacao.escolas` ≥ 100 **ou** `elegiveis` ≥ 10.000) | Dimensionar formadores e referências para a expansão, com o número de escolas por formador e os meses da formação, antes de assinar a implantação. | Em A, são 800 escolas e 12.000 professores no Ano 1. Sem formadores suficientes, a formação vira um vídeo e a adoção cai. | 1) Escolas por formador e por polo. 2) Calendário compatível com o ano letivo. 3) Multiplicadores do piloto (PED-R19). 4) Somar ao custo da camada 6. | Formação e regionais | Antes de contratar | Alta se `expansao` = ano1 | Referência a verificar |
| PED-R21 `calendario-escolar` | piloto (`!k.poc`) | Marcar o teste no calendário escolar: começar no início de um bimestre, evitar as semanas de avaliação externa e durar ao menos um ciclo de avaliação da rede. | Um piloto que começa no meio do período ou coincide com provas mede o calendário, e não a ferramenta. | 1) Cruzar as datas do teste com o calendário da rede. 2) Ajustar `piloto.meses`. 3) Comunicar as datas às escolas com antecedência. | Área pedagógica e planejamento | Antes do teste | Média | Boa prática de gestão; sem referência específica |
| PED-R22 `conexao-plano-b` (promove `p-desplug`) | `internet` ∈ {parcial, nao} | Preparar, para cada atividade com a ferramenta, uma versão que funcione sem internet ou uma atividade desplugada, para que o professor não perca a aula quando a conexão falhar. | Quando a aula depende de uma conexão que cai, o professor desiste da ferramenta depois de duas ou três falhas. | 1) Exigir modo sem conexão ou sincronização posterior, se houver. 2) Incluir o plano B no roteiro de cada aula. 3) Registrar as aulas perdidas por falha de conexão como indicador. | Área pedagógica e tecnologia | Antes do teste | Alta | Linha de trabalho da Cátedra UNESCO de IA Desplugada (materiais próprios: referência a verificar) |
| PED-R23 `orientacao-sala` (muda `g-etica`) | `g-etica` ∈ {nao, parcial} **e** `usuarios` ∋ estudantes ou professores | Entregar aos professores do teste, antes de começar, uma orientação de 1 a 2 páginas: o que os estudantes podem fazer com a IA, como declarar o uso nas tarefas e o que fazer diante de erro ou conteúdo impróprio. | Hoje `g-etica` fica para "antes de contratar", mas o professor do piloto precisa da regra no primeiro dia de aula. | 1) Versão curta para o piloto, a partir das orientações existentes. 2) Apresentá-la na oficina inicial. 3) Revisá-la com o que o piloto ensinar. | Área pedagógica | Antes do teste | Alta se `usuarios` ∋ estudantes | UNESCO (2023), *Guidance for generative AI in education and research* |
| PED-R24 `familias` (detalha `criancas`) | `afetados` ∋ criancas **e** `usuarios` ∋ estudantes | Informar as famílias dos estudantes do teste, em linguagem simples, sobre o que a ferramenta faz, que dados usa e como pedir para não participar ou reclamar. | O texto atual de `criancas` ("famílias informadas") não diz como informar nem o que comunicar. | 1) Comunicado de 1 página. 2) Reunião na escola. 3) Canal de dúvidas e reclamações. 4) Atividade alternativa para quem não participar. | Direções e área pedagógica | Antes do teste | Alta | Brasil: Lei 13.709/2018 (LGPD), art. 14; outros países: regra local |
| PED-R25 `criterios-uso-expansao` (muda `implantacao-criterios`) | `k.implP > 0` | Incluir nos critérios para expandir um mínimo de uso de fato e a avaliação de professores e estudantes, além do resultado e do custo. | Expandir uma ferramenta que pouca gente usa multiplica licenças sem multiplicar o resultado. | 1) Meta de uso (PED-R05) como condição. 2) Questionário curto para professores e estudantes no fim do teste. 3) Decisão registrada pela instância de governança. | Área pedagógica e gabinete | Antes de contratar | Média | Krueger e Jackson (2026), p. 3 |
| PED-R26 `servidores-confianca` (exemplo D) | `tarefas` ∋ duvidas **e** `usuarios` ⊂ {administrativo, gestores} | Testar o assistente com as perguntas reais das escolas no último mês e medir quantas respostas os servidores aceitam sem precisar ligar para a secretaria. | Os servidores só passam a usar o assistente se confiarem nas respostas, e uma resposta errada sobre uma norma desfaz essa confiança. | 1) Separar uma amostra de perguntas reais. 2) Especialistas da secretaria corrigem as respostas. 3) Medir a proporção de respostas aceitas e o tempo de resposta. 4) Definir a quem a pergunta vai quando o assistente não sabe responder. | Área administrativa e curadoria das normas | Antes do teste | Média | Referência a verificar |

Correções de texto em regras existentes:
- `disp-proprio`: quando `usuarios` ∩ {estudantes, familias} = ∅, o texto passa a ser "Garantir dispositivo de trabalho a quem não tem um adequado: o uso não deve depender do celular pessoal do servidor."
- `supervisao` com `tarefas` ∋ tutoria: o texto passa a ser "Definir quem revisa amostras das respostas do tutor e acompanha o painel da turma, com autoridade para corrigir o conteúdo ou suspender o uso."
- `formacao-papeis`: renomear para governança da secretaria e deixar a escola para PED-R04.

---

## 3. Mudanças no desenho do sistema

1. **Criar um terceiro tipo de recomendação, "Uso e pedagogia", ao lado de "Custo e compra" e "Política e governança".** Hoje as poucas ações pedagógicas saem rotuladas como "Política e governança" e levam ao "O que fazer" genérico. Quando `usuarios` inclui professores ou estudantes, os 5 cartões devem ter pelo menos uma ação desse tipo (cota por tipo).

2. **Priorizar por pontuação, e não por prioridade, momento e ordem de inserção.** Proposta de pontos:
   - bloqueia o teste ou o uso: 3 (exemplos: protocolo do alerta, tempo na jornada, base legal);
   - pode prejudicar estudantes: 2;
   - liga-se a um dos 3 principais direcionadores do tornado: 2 (por exemplo, a taxa de adoção);
   - é difícil de reverter depois de contratar: 1;
   - se aplica só a este caso, e não a todos: 1.

   O desempate usa a dependência: uma ação que outras pressupõem vem primeiro (PED-R05 antes de PED-R25).

3. **Ligar cada ação a um número da estimativa.** Exemplos:
   - PED-R05 cita a adoção do Ano 1 e o custo por usuário ativo;
   - PED-R01 mostra as horas atuais, as horas propostas e a diferença de custo;
   - PED-R07 mostra estudantes por dispositivo e minutos por estudante;
   - PED-R14 mostra casos por escola, calculados a partir de `ctx.etapas`.

   Os marcadores `{…}` da tabela indicam onde entra o número.

4. **Consolidar famílias de regras.** As 7 regras `formacao-*` mais PED-R01, PED-R02 e PED-R16 viram um cartão "Plano de formação" com subitens (quem, quanto, quando na jornada, como, quem paga, continuidade). As regras que valem para qualquer caso (`formacao-continua`, `expansao-recorrente`) saem da contagem e vão para uma "base comum" no fim de "O que fazer".

5. **Escrever cada campo do cartão a partir da própria regra.** Cada regra passa a ter:
   - `quem`, área que age, que é diferente da área que sabe responder à pergunta;
   - `como`, com 2 a 4 passos;
   - `paraque`, específico da regra;
   - `feito`, a evidência de conclusão: "Como saber que foi feito" (exemplo: "protocolo aprovado e entregue às 10 escolas").

   `quemSabe` fica só como alternativa quando a regra não traz `quem`.

6. **Separar o público.** O plano de hoje fala só à secretaria. Proponho uma página "Para as escolas do teste" (no plano e no PDF), escrita para o diretor e o coordenador. Ela teria horário e turmas, pessoa de referência, dispositivos, orientação de uso, protocolo (C), indicadores que a escola vai acompanhar e a quem recorrer. É o documento que de fato chega à escola.

7. **Indicadores por tarefa, com sentido para a escola.** A seção "Indicadores / Como verificar se deu certo?" (PDF B, p. 3) hoje lista resultado, linha de base, custo e uma adoção genérica. Proponho um conjunto fixo por tarefa:
   - Copiloto (A): professores com uso de fato; minutos de preparação por semana; uso do tempo liberado; qualidade de uma amostra de materiais.
   - Tutor (B): dose semanal por estudante; parte do grupo-alvo com a dose mínima; avaliação curta no início e no fim; uso do painel pelo professor.
   - Alerta (C): alertas com primeiro contato no prazo; estudantes que voltaram a frequentar; casos que a equipe avaliou como sinalização indevida; sinalizações por grupo.
   - Assistente (D): respostas aceitas sem encaminhamento à equipe; tempo de resposta; respostas corrigidas pela curadoria.

8. **Mostrar o caso incompleto como lacuna.** Uma estimativa de horas de formação aparece como "formação ainda não planejada", com aviso, em vez de um "confirme" discreto. Uma pergunta nova sem resposta (`tempoJornada`, `apoioEscola`, `momentoUso`) dispara a recomendação em alta, com o texto "Decidir…", até ser respondida.

9. **Supervisão e contestação proporcionais à tarefa.** O texto de `supervisao` e `contestacao` passa a depender da tarefa:
   - tutor: amostra de respostas e painel da turma;
   - alerta: revisão de cada caso antes da ação;
   - copiloto: revisão pelo professor antes do uso.

   Assim a escola recebe uma regra que consegue cumprir.

10. **Fim do percurso (capítulo 4) e resumo executivo.** Ao lado de "Governança: condições confirmadas (1 de 6)", mostrar "Condições de uso nas escolas: x de 4" (tempo na jornada, referência na escola, dose ou rotina de uso definida, medida de uso de fato). Essas quatro condições são o portão pedagógico do teste, assim como as 6 de governança são o portão da contratação.

---

## 4. Requisitos

| id | Requisito (verificável) | Prior. | Como verificar |
|---|---|---|---|
| PED-01 | Quando `usuarios` inclui professores ou estudantes, os 5 cartões de `relAcoes` incluem pelo menos uma ação do tipo "Uso e pedagogia". | P1 | Casos A, B e C: pelo menos 1 dos 5 cartões tem `tipo = 'uso'`; em B, PED-R06 ou PED-R08 está entre os 5. |
| PED-02 | O campo "Quem?" vem da regra. `dados-acordo` e `dados-base-legal` nunca saem com área pedagógica. | P1 | B (cartões 4 e 5) e C (cartão 5): `quem` contém "jurídic" ou "proteção de dados". |
| PED-03 | Em casos com `tarefas` ∋ alerta_precoce, saem PED-R13, R14 e R15, de prioridade alta e antes do teste. | P1 | Caso C: os três ids estão presentes e PED-R13 está entre os 5 cartões. |
| PED-04 | Com tutoria e dispositivo compartilhado ou rotativo, sai PED-R07 com o número de estudantes por dispositivo da premissa. | P1 | Caso B: o texto contém "3 estudantes por dispositivo". Com `modeloDisp = um_por_aluno`, a regra não sai. |
| PED-05 | Em casos com piloto ou implantação, sai PED-R05 com a adoção do Ano 1 da estimativa. | P1 | A: cita 35%; B: cita 45%; D (só prova de conceito, mas com implantação de 3.000 pessoas): sai com `quando = antes_contratar` e cita 40%. |
| PED-06 | Com professores formados para uso pedagógico e menos de 8 h por pessoa, sai PED-R01 no lugar do "confirme as horas". Para servidores com tarefa de dúvidas, não sai. | P1 | A (3 h) e B (2 h): sai PED-R01. D (1,5 h, administrativo, `duvidas`): sai só `formacao-horas`. |
| PED-07 | `disp-proprio` não menciona famílias quando os usuários são só servidores ou gestores. | P1 | Caso D: o texto não contém "famílias". |
| PED-08 | Em tutoria, o texto de `supervisao` não pede revisão de "cada saída". | P2 | Caso B: o texto não contém "cada saída" e contém "amostra". Caso C: mantém a revisão de cada caso. |
| PED-09 | Toda regra traz `quem`, `como` (de 2 a 4 passos), `paraque` e `feito`. Nenhum cartão diz "Revise a resposta…" como "Como?". | P2 | Teste de lint sobre `REGRAS_REC`; nos cartões dos 4 casos, `como` não começa por "Revise a resposta". |
| PED-10 | `formacao-continua` e `expansao-recorrente` não entram nos 5 cartões nem na contagem de ações, e aparecem na "base comum". | P2 | Nenhum dos 4 casos tem esses ids em `relAcoes`; a contagem de A cai de 14 para 12 antes das regras novas. |
| PED-11 | A seção de indicadores do resumo traz pelo menos 3 indicadores próprios da tarefa do caso. | P2 | A traz "minutos de preparação"; B, "dose semanal"; C, "primeiro contato no prazo"; D, "respostas aceitas sem encaminhamento". |
| PED-12 | 2.5.1 tem a opção "Coordenação pedagógica" e existe a pergunta `apoioEscola`. Sem resposta, PED-R03 sai em alta. | P2 | Caso B sem `apoioEscola`: PED-R03 presente, prioridade alta. |
| PED-13 | Quando há piloto, o plano e o PDF trazem a página "Para as escolas do teste". | P2 | A, B e C têm a página. D (só prova de conceito) não tem. |
| PED-14 | O texto de "O quê" tem no máximo 30 palavras, começa por verbo no infinitivo e não contém siglas sem explicação (DPIA, RAG, SLA, PoC). | P2 | Teste por expressão regular sobre os textos das regras e sobre os cartões dos 4 casos. |
| PED-15 | Não há falso positivo pedagógico: em casos sem estudantes entre usuários e afetados, não saem PED-R06 a R09, R15, R17, R18 nem R24. | P2 | Caso D: nenhum desses ids presente. |
| PED-16 | Com estudantes entre os usuários, `g-etica` passa para "antes do teste", na forma de PED-R23. | P3 | Caso B: `g-etica` ou PED-R23 com `quando = antes_teste`. |
| PED-17 | A pergunta nova `momentoUso` (2.2.5: aula regular / contraturno / casa / tempo de planejamento do professor) alimenta PED-R06. Sem resposta, PED-R06 diz "Decidir em que aula ou turno…". | P3 | Caso B sem resposta: o texto começa por "Decidir". Com "aula regular": cita a grade. |
| PED-18 | O fim do percurso e o resumo executivo mostram "Condições de uso nas escolas: x de 4". | P3 | Os 4 casos mostram a contagem. B hoje dá 0 de 4. |

---

## 5. Conflitos e dúvidas para o coordenador

1. **Rigor contra simplicidade nas perguntas.** PED-R02, R03 e R06 pedem três perguntas novas (`tempoJornada`, `apoioEscola`, `momentoUso`). Proposta: elas ficam no Refinar, e o Essencial só dispara a recomendação "Decidir…". Cabe ao Emanuel decidir se alguma sobe para o Essencial.

2. **Horas de formação: guia ou evidência?** As 1,5 a 3 h vêm dos exemplos de Krueger e Jackson. Elevar o padrão para 12 a 20 h em uso pedagógico aumenta muito a camada 6 em A (12.000 professores) e em B, e pode conflitar com a área de custos, que preza a fidelidade ao guia. Minha proposta: manter o número do guia na estimativa central e mostrar PED-R01 com um cenário "formação em ciclos". A decisão é do Emanuel.

3. **Cota pedagógica nos 5 cartões contra a prioridade jurídica.** As áreas de dados e jurídico tendem a querer base legal e acordo de dados em primeiro lugar. Proposta de composição: 1 ação bloqueante legal, 1 de uso e pedagogia, 1 de custo e 2 pela pontuação. É uma decisão editorial que precisa ser única para os 9 idiomas.

4. **Referências e normas nacionais numa ferramenta internacional.** A hora-atividade (Lei 11.738/2008), o AEE e a LGPD são do Brasil. Proposta: o texto da regra fica neutro, e o "Como" cita a norma do país pela camada `pais.js`. Isso pede curadoria por país, que hoje não existe para normas educacionais.

5. **Até onde a ferramenta deve contrariar o caso.** PED-R07 diz, em essência, que o desenho de B (tutor individual em dispositivo compartilhado) contradiz o próprio objetivo. PED-R11 diz que A mede o objetivo errado. Falta decidir se a ferramenta deve escrever recomendações que contestam o desenho do caso, como já faz `teste-rever`, ou só alertar. Minha posição é contestar, com o número que mostra a contradição.

---

## Anexo: os 5 cartões que eu esperaria em cada exemplo

Este anexo é o teste de aceitação editorial das mudanças acima, com a composição proposta no conflito 3. A ordem é a da pontuação da seção 3, item 2.

**A. Copiloto para professores** (hoje os cartões são: cotação, linha de base parcial, formar gestão, crianças, comitê)

| # | Ação | Tipo | Por que entra |
|---|---|---|---|
| 1 | PED-R11 Medir o tempo de preparação antes e durante e registrar o uso do tempo liberado | Uso e pedagogia | É o próprio objetivo do caso; absorve `linha-base-parcial` |
| 2 | PED-R01 + R02 Plano de formação em ciclos, dentro da jornada | Uso e pedagogia | 3 h para 12.000 professores não sustentam o uso |
| 3 | PED-R05 Definir uso de fato e medir por escola (adoção de 35% no Ano 1) | Uso e pedagogia | Direcionador do custo; assinatura institucional |
| 4 | `etapas` Implantar por grupos de escolas (800 escolas no Ano 1) | Custo e compra | Difícil de reverter |
| 5 | `ferramentas-cotacao` Pedir cotação por escrito | Custo e compra | O preço é de exemplo |

Ficam fora dos 5, mas em "O que fazer" com prioridade média: PED-R10 (revisão do material) e PED-R12 (educação especial), por C4b.

**B. Tutor de matemática para estudantes** (hoje: política de dados, rever piloto, formação em dados, acordo de dados, base legal)

| # | Ação | Tipo | Por que entra |
|---|---|---|---|
| 1 | `teste-rever` Fazer a prova de conceito antes, incluindo PED-R09 (currículo e resposta pronta) | Política e governança | Bloqueia o teste |
| 2 | `dados-base-legal` + `dados-acordo` (um cartão), com quem = jurídico e proteção de dados | Política e governança | Bloqueia o teste; dados de crianças |
| 3 | PED-R06 + R07 Dose semanal por estudante e rodízio dos dispositivos compartilhados | Uso e pedagogia | Contradiz o objetivo; 3 estudantes por dispositivo |
| 4 | PED-R08 Rotina do professor com o painel do tutor | Uso e pedagogia | Sem ela, o tutor não chega à aula |
| 5 | PED-R17 + R18 Avaliação curta no início e no fim, com comparação e dados por grupo | Uso e pedagogia | O piloto de 4 meses não é medido pela avaliação anual |

**C. Alerta precoce de abandono escolar** (hoje: política de dados, PoC e piloto, separar decisões, consulta ao mercado, acordo de dados)

| # | Ação | Tipo | Por que entra |
|---|---|---|---|
| 1 | PED-R13 Protocolo de ação quando um estudante é sinalizado | Uso e pedagogia | Sem ele o alerta não reduz o abandono |
| 2 | `alternativa` Comparar com uma alternativa sem IA (por exemplo, monitoramento de frequência com protocolo) | Custo e compra | Ainda não comparado |
| 3 | `teste-recomendado` + `teste-ambos` (um cartão) | Política e governança | Bloqueia o teste |
| 4 | PED-R14 + R15 Capacidade das equipes e estigma | Uso e pedagogia | Volume de casos por escola; resultado declarado |
| 5 | `dados-base-legal` + `dados-acordo` + `g-dados` (um cartão) | Política e governança | Dados de crianças |

**D. Assistente para solicitações das escolas** (hoje: custos da gratuidade, preço depois, dispositivo próprio, legislação, termos de uso)

| # | Ação | Tipo | Por que entra |
|---|---|---|---|
| 1 | `gratis-adiados` + `gratis-fim` (um cartão) | Custo e compra | Difícil de reverter |
| 2 | `termos` Negociar contrato em vez de termos de uso | Custo e compra | Difícil de reverter |
| 3 | PED-R26 Testar com perguntas reais e medir as respostas aceitas | Uso e pedagogia | Sem confiança dos servidores, ninguém usa |
| 4 | `i-base` Nomear responsável e rotina de curadoria das normas (promovida da lista genérica) | Uso e pedagogia | As respostas dependem das normas atualizadas |
| 5 | `g-legislacao` Mapear a legislação aplicável | Política e governança | Pré-requisito do contrato |

Em D não deve sair nenhuma ação sobre estudantes, sala de aula ou famílias (PED-15). O `disp-proprio` corrigido fica fora dos 5.
