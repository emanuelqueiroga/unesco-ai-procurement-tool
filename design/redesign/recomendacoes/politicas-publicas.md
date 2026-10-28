# Parecer do painel: políticas públicas educacionais

Especialidade: teoria da mudança, ciclo de política, implementação e escala, equidade, coerência com currículo e política da rede, participação, sustentabilidade orçamentária e entre mandatos, monitoramento e avaliação, prestação de contas. Sigla dos requisitos: POL.

Material lido: `recomendacoes.js` (66 regras), `plano_dados.js` (RECS, ACOES_G, FUNCOES_INTERNAS), `fluxo_dados.js` (CAMPOS, QUESTOES_G), `prioridades.js`, `framework.js` (OPC, TAREFAS, `recomendarTeste`), `plano/relatorio.js:relAcoes`, `plano/secoes.js` (A1 e recomendação principal), `recomendacoes_exemplos.md`, `casos.json` e `plano_B_pdf.txt`.

Síntese em três frases. O motor de hoje é uma lista de verificação bem rastreada (cada ação cita pergunta e resposta), mas não é um plano de política: falta a decisão principal, a ordem das decisões e a ligação entre o problema, a meta e a escala. Nos quatro exemplos, o maior risco de política (passar de um teste pequeno para a rede inteira no Ano 1) quase não aparece, enquanto proteção de dados e governança ocupam os cartões. Equidade, participação, currículo, orçamento plurianual e prestação de contas existem no catálogo (`RECS`, problemas G8, C8, F10, `FUNCOES_INTERNAS`, os nove pontos de decisão do guia) mas não viram regras.

---

## 1. Diagnóstico

1. **A "recomendação principal" responde só à pergunta 2.0.** `secoes.js` (A1) gera a frase principal a partir de `recomendarTeste`. No A e no D ela vira uma não recomendação ("Você escolheu um piloto, como indicam as respostas"; "uma prova de conceito, como indicam as respostas"). No B diz "indicaria uma prova de conceito" sem o motivo, que existe (`MOTIVOS_TESTE.sob_medida`) mas só aparece na p. 15 do PDF. Um gestor precisa saber qual é a próxima decisão, se está pronto para tomá-la e o que falta. Hoje a capa não diz isso.

2. **O salto do teste para a rede inteira passa quase em branco.** Nos quatro exemplos, a primeira etapa da implantação (3.1.1) cobre quase toda a rede logo depois de um teste curto:
   - A: piloto de 20 escolas e 4 meses, depois 800 escolas e 12.000 pessoas, ou seja, 100% das escolas (420 + 380 em `ctx.etapas`). `etapas` dispara, mas com prioridade média e na 10ª posição, abaixo de "pedir cotação".
   - B: 20 escolas, depois 200 e as 600 no Ano 2 (`expansao: ano1`). `expansao-rapida` dispara, com prioridade média.
   - C: 10 escolas, depois 300 (100%). Nenhuma regra dispara, porque `etapas` exige `eleg >= 5000` pessoas, e o C tem 2.500 usuários (gestores e professores) que cobrem 300 escolas.
   - D: prova de conceito com 150 pessoas, depois 270 escolas (100%) sem piloto. Nenhuma regra dispara (`eleg` = 3.000).

   O limiar está em pessoas, quando deveria estar na fração de escolas e na distância entre o teste e a primeira etapa. É o erro clássico de escala (Banerjee et al., 2017), e é o que o ponto de decisão 4 do guia pede para impedir.

3. **`recomendarTeste` trata servidores como "usuários não reais".** `reais = professores || estudantes`. No D, servidores administrativos e gestores usam a ferramenta todo dia, e as respostas deles chegam às escolas e às famílias (problema C9). Por isso a ferramenta aprova a prova de conceito e não pede piloto antes de 270 escolas. O D é o caso mais exposto e recebe o conselho mais fraco sobre teste.

4. **"Problema primeiro, tecnologia depois" quase não é verificado.** Só `sem-ferramenta` (quando nenhum problema marcado tem tarefa de IA) e `alternativa` (1.2.8 = não) olham para isso. Não há regra para:
   - `situacao = 'proposta'` (A: a secretaria avalia uma proposta já recebida, o caso típico de solução à procura de problema);
   - `pagamento = 'gratuito'` vindo de fornecedor com `adaptacao = 'sob_medida'` (D), que cria vantagem e dependência antes de qualquer concorrência;
   - a falta de uma "ação útil depois da saída" (critério do ponto de decisão 2 do guia). No C, um alerta de abandono sem protocolo de resposta não reduz abandono (Faria et al., 2017).

5. **Não há teoria da mudança.** Nenhuma regra liga tarefa, mudança de prática e resultado. No A, o resultado declarado ("liberar tempo para acompanhamento individual") depende de uma decisão de gestão (para que serve o tempo liberado) que a ferramenta não pede. No B, tutoria de uso contínuo com dispositivos compartilhados na sala limita a dose por estudante, e nenhuma regra confronta a dose prevista com o tempo de equipamento disponível.

6. **Equidade quase ausente.** Só três regras tocam no tema (`disp-proprio`, `internet-teste`, `internet-parcial`). Os impactos `desigualdade` (B) e `inclusao` não disparam nenhuma regra. `p-idiomas`, `i-acessib`, `s-equidade` e `s-adocao` estão em `RECS` mas aparecem em listas fixas, sem condição. O percurso não pergunta se há escolas rurais, indígenas ou quilombolas, estudantes com deficiência ou falantes de outras línguas no público do caso. No B, o objetivo é reduzir a diferença entre escolas, mas nada pede que o piloto inclua as escolas de pior resultado ou que o uso seja acompanhado por escola, e a estimativa já prevê que 60% dos estudantes com acesso não vão usar no Ano 3 (p. 10 do PDF).

7. **Regras aplicadas fora do contexto.** No D, `disp-proprio` diz que "depender de soluções das famílias pode ampliar desigualdades", mas quem usa o celular próprio são servidores. O problema real é trabalhista e de segurança (quem paga os dados, o que fica no aparelho pessoal). No C, `lic-institucional` dispara com `tipoTec = nao_sei`, a partir de um pagamento que ainda não foi escolhido. No A, `criancas` entra nos 5 cartões para um copiloto de planejamento usado só por professores, desproporcional diante do salto de escala, que fica fora.

8. **Redundância e inflação da prioridade alta.** B: 12 de 25 ações são de prioridade alta; C: 12 de 23. Cinco ações do B tratam de dados (`g-dados`, `formacao-dados`, `dados-acordo`, `dados-base-legal`, `dados-impacto`), e três delas ocupam cartões. No C, `teste-recomendado`, `teste-ambos` e `tecnologia` dizem a mesma coisa (comece por uma prova de conceito) e ocupam três dos cinco cartões. Quando metade é "alta", nada é prioridade.

9. **Os cartões não respondem às seis perguntas.** Em `relAcoes`:
   - "Como" é circular ("Revise a resposta 2.1.1 e siga o detalhe em O que fazer");
   - "Para quê" tem só quatro textos genéricos, repetidos ("Proteger estudantes e professores e garantir que o teste possa ser avaliado" aparece em 4 dos 5 cartões do B);
   - "Quem" vem de `quemSabe(n)`, que diz quem sabe responder à pergunta, e não quem age. Por isso "Assinar acordo de tratamento de dados" vai para "Área pedagógica e professores" (B e C, cartões 4 e 5), quando é tarefa do jurídico e do encarregado de dados;
   - o "Por quê" repete a resposta, não a razão (B, cartão 2: "Pelas respostas, uma prova de conceito deveria vir antes").

10. **Nada de sustentabilidade entre exercícios e mandatos.** O motor calcula a dotação por exercício (B: US$ 300,4, 319,4, 336,7 e 279,8 mil) e a parte recorrente (75%), e nenhuma regra usa esses números. A fonte de recursos saiu na v11 (comentário em `recomendacoes.js`). Não há ação para inscrever a despesa no plano plurianual, dar ao programa um ato normativo e um responsável de carreira, nem marcar a revisão de continuidade fora do calendário eleitoral.

11. **Participação, comunicação e prestação de contas não aparecem.** A única menção a terceiros é "famílias informadas antes do teste" (`criancas`). Não há regra para ouvir professores e a representação deles (A muda a carga de trabalho docente), conselhos escolares e de educação, estudantes e famílias (B e C), nem para publicar o relatório do teste e a decisão tomada. `g-avaliacao`, `r-parada` e `s-continuidade` existem em `RECS` e não têm gatilho.

12. **O que está bom e deve ficar.**
    - A rastreabilidade: cada ação cita pergunta e resposta, com o link "Ir à pergunta", e a lista muda quando a resposta muda.
    - Os três momentos (antes do teste, antes de contratar, para manter), que são uma forma simples do ciclo de política.
    - Governança com "Em parte" que cita o "O que falta?" (v13, RQ-11).
    - As regras de gratuidade (`gratis-adiados`, `gratis-fim`, `gratis-ativos`), de consumo e de saída (`sob-medida`).
    - As páginas de Krueger e Jackson (2026) citadas só onde existem.
    - Os nove pontos de decisão do guia (p. 19–22 do PDF), com critérios e o "Se não". São a melhor espinha para a sequência de decisões, mas hoje aparecem no fim de "O que fazer", na ordem 5, 6, 7, 1, 2, 3, 4, 8, 9, desligados das recomendações.

---

## 2. Recomendações que faltam ou precisam mudar

Convenções. `k.*` são os valores que `recContexto` já calcula. `escRede` é a soma de `ctx.etapas[*].escolas`. `d.*` são números do motor de custos (`relDados`). "PD n" é o ponto de decisão n do guia do projeto (já impresso no plano). As referências legais brasileiras servem de exemplo para o Brasil e devem sair de `pais.js` em outros países.

| id | Gatilho | Texto da recomendação | Por quê | Como | Quem age | Quando | Prioridade (critério) | Referência |
|---|---|---|---|---|---|---|---|---|
| pol-escala-gate (substitui `etapas` e `expansao-rapida`) | `implantacao.escolas >= 0,5·escRede` ou `implantacao.pessoas >= 0,8·eleg`, com teste marcado; ou `implantacao.escolas / piloto.escolas >= 10` | Aprovar agora só o teste. A implantação vira uma segunda decisão, tomada com o relatório do teste e com critérios fixados antes. | A: de 20 para 800 escolas; C: de 10 para 300; D: de 150 pessoas para 270 escolas sem piloto. Um erro em escala custa mais e é mais difícil de desfazer. | 1) Separar no plano o ato do teste e o da implantação. 2) Fixar limiares de uso, resultado contra a linha de base, custo por usuário ativo e incidentes. 3) Pedir o Ano 1 como reserva condicionada. | Gabinete, com a área pedagógica e a de avaliação | Antes do teste | Alta, sempre (bloqueia PD 4). Sobe para a recomendação principal quando a primeira etapa cobre mais de 50% das escolas. | Banerjee et al. (2017), *From proof of concept to scalable policies*, J. of Economic Perspectives 31(4); guia, PD 4 |
| pol-teste-servidores (muda `recomendarTeste`) | `testes = ['poc']`, usuários só `administrativo`/`gestores` e `implantacao.escolas > 0` | Fazer um piloto com servidores reais em poucas escolas antes de implantar: a prova de conceito mostra se a ferramenta funciona, não se as respostas servem a quem atende. | D: 3.000 servidores usarão no Ano 1, e as respostas sobre normas chegam a escolas e famílias. | Piloto de 2 a 3 meses em 10 a 20 escolas, com revisão por amostra das respostas e um critério de acerto normativo. | Área normativa e gestão escolar | Antes de contratar | Alta (a escala do Ano 1 é a rede inteira) | Guia, cap. 14 e PD 4 |
| pol-proposta-problema | `situacao = 'proposta'` | Avaliar a proposta recebida contra o problema e a meta já escritos, e não o contrário; consultar ao menos outra solução antes de decidir. | Uma proposta pronta tende a definir o problema pelo que o produto faz. | 1) Fechar 1.2.4 e 1.2.6 antes de abrir a proposta. 2) Fazer uma consulta pública ao mercado. 3) Registrar por que a proposta atende à meta. | Área pedagógica e compras | Antes do teste | Alta se `alternativa = 'nao'`; senão média | Guia, PD 2 e PD 6 ("um fornecedor ofereceu piloto"); UNESCO (2023), *GEM Report 2023: Technology in education: A tool on whose terms?* |
| pol-gratuito-isonomia | `pagamento = 'gratuito'` e `tipoTec = 'paga'` | Formalizar o teste gratuito por instrumento público (doação ou acordo de cooperação), publicar o objeto e deixar escrito que o teste não dá preferência na contratação. | D: teste gratuito com desenvolvimento sob medida e termos de uso padrão cria dependência e vantagem antes da concorrência. | 1) Instrumento com objeto, prazo, dados e propriedade do que for desenvolvido. 2) Publicação. 3) Cláusula de não preferência. | Assessoria jurídica e compras | Antes do teste | Alta se `adaptacao = 'sob_medida'` ou `licenca = 'termos'` | Brasil: Lei 14.133/2021 (planejamento e isonomia, a citar por artigo depois de verificar); Krueger e Jackson (2026, p. 7–8); guia, PD 6 |
| pol-cadeia-resultado | Tarefa marcada e (`k.metasLacuna` ou resultado vazio ou impacto `tempo_docente`, `aprendizagem`, `permanencia`) | Escrever em uma página a cadeia do caso: problema → o que a ferramenta faz → o que muda na prática de quem usa → resultado, com um indicador e uma meta para cada elo. | Sem a cadeia, o teste mede só o uso e não mostra se o uso produz o resultado prometido. | Modelo de quatro caixas pré-preenchido com 1.2.2, 2.1.1, 2.2.1 e 1.2.6; a pessoa completa os indicadores intermediários. | Área pedagógica e de avaliação | Antes do teste | Alta (bloqueia PD 1 e PD 2) | Funnell e Rogers (2011), *Purposeful Program Theory*, Jossey-Bass; guia, PD 1 |
| pol-tempo-liberado | `impactos` inclui `tempo_docente` | Decidir com as escolas e com a representação dos professores para que vai o tempo liberado, e medir o tempo de planejamento antes e depois do piloto. | A: o resultado depende de o tempo virar acompanhamento dos estudantes; sem acordo, ele se dilui em outras tarefas. | 1) Levantamento de tempo numa amostra do piloto e de escolas de comparação. 2) Acordo escrito sobre o uso do tempo. 3) Indicador no relatório do piloto. | Área pedagógica e gestão de pessoas | Antes do teste | Média | Instrumento de referência: OCDE, TALIS 2018 (questionário de tempo de trabalho docente) |
| pol-acao-apos-alerta | `tarefas` inclui `alerta_precoce` ou `consequencias` inclui `apoio_est` | Definir antes do teste o que acontece com cada estudante sinalizado: quem procura a família, que apoio é oferecido, em que prazo e com que equipe. | C: um alerta sem resposta não reduz o abandono e só gera lista. | 1) Protocolo de resposta por nível de risco. 2) Conta da capacidade: alertas por semana × tempo de atendimento. 3) Registro do apoio dado, para avaliar. | Área pedagógica, coordenação das escolas e rede de proteção | Antes do teste | Alta (bloqueia PD 2) | Faria et al. (2017), avaliação do EWIMS, REL Midwest/IES; guia, PD 2 ("ação útil depois da saída") |
| pol-regra-simples (especializa `alternativa`) | `alerta_precoce` e `alternativa = 'nao'` | Comparar o modelo com uma regra simples de indicadores que as escolas já têm (faltas, notas, reprovação): só contratar se a IA identificar mais estudantes a tempo e com menos erro. | Indicadores simples de faltas e notas já preveem boa parte do abandono; a IA precisa provar um ganho que justifique custo e risco. | Na prova de conceito, rodar as duas sobre dados históricos e comparar acertos, falsos alarmes e antecedência. | Avaliação e tecnologia | Antes de contratar | Alta | Bowers, Sprott e Taff (2013), *The High School Journal* 96(2) |
| pol-estigma | `alerta_precoce` ou dados `sensiveis` com `consDecide` | Não usar a pontuação de risco como rótulo: definir quem vê o alerta, por quanto tempo fica guardado, e proibir o uso em matrícula, disciplina ou avaliação. | C: o resultado esperado é "sem gerar estigmatização"; um rótulo pode mudar como a escola trata o estudante. | 1) Perfis de acesso. 2) Prazo de guarda. 3) Proibição de usos secundários no acordo de dados. | Proteção de dados e área pedagógica | Antes do teste | Alta | Guia, PD 3 (inferências sensíveis); referência a verificar para o efeito de rótulo |
| pol-equidade-grupos | `k.consDecide.length > 0`, ou impacto `desigualdade`, ou tarefa `tutoria`/`correcao`/`alerta_precoce` | Verificar no teste se a ferramenta funciona igual para todos os grupos (rural e urbano, sexo, raça/cor, deficiência, língua) e definir antes o que fazer se não funcionar. | Um resultado médio pode esconder piora num grupo; no B, a meta é justamente reduzir a diferença. | 1) Lista de grupos e indicadores desagregados. 2) Limiar de diferença aceitável. 3) Ação prevista: ajustar, restringir ou parar. | Avaliação e proteção de dados | Antes do teste | Alta se houver decisão sobre estudantes; senão média | Baker e Hawn (2022), *Algorithmic bias in education*, IJAIED 32; guia, PD 3 |
| pol-amostra-piloto (generaliza `internet-teste`) | `piloto.escolas > 0` e (impacto `desigualdade` ou `internet` ≠ `sim` ou pergunta nova POL-Q1 ≠ nenhum) | Escolher as escolas do piloto de modo a representar a rede, incluindo as de pior resultado, as rurais e as com pouca conexão, e não só as mais preparadas. | Um piloto feito só nas escolas mais preparadas superestima o efeito e esconde o custo de chegar às demais. | Sorteio estratificado por resultado na linha de base e por localização; registrar os critérios no plano. | Avaliação e área pedagógica | Antes do teste | Alta no B (meta de equidade); média nos outros | Coburn (2003), *Rethinking scale*, Educational Researcher 32(6) |
| pol-desenho-avaliacao | `piloto.escolas > 0` e impacto `aprendizagem`/`permanencia` | Avaliar o piloto contra escolas de comparação (sorteadas ou pareadas) e com indicadores intermediários; com 4 meses, a avaliação anual pode não mostrar efeito. | B: 20 escolas por 4 meses, medidos pela avaliação anual do 9º ano; sem comparação, não se separa o efeito da ferramenta do resto. | 1) Definir o grupo de comparação. 2) Escolher indicadores de 4 meses (prática concluída, desempenho em itens). 3) Fixar a análise antes dos resultados. | Avaliação | Antes do teste | Alta (bloqueia PD 4) | Escueta, Nickow, Oreopoulos e Quan (2020), *Upgrading education with technology*, J. of Economic Literature 58(4); guia, PD 4 |
| pol-dose | `tutoria` e `frequencia` em `diaria`/`continua` e `modeloDisp` em `compartilhado`/`rotativo` | Calcular quantos minutos por semana cada estudante terá de equipamento e comparar com o uso previsto; ajustar a meta ou os dispositivos antes do piloto. | B: tutoria contínua com dispositivos compartilhados; com pouco tempo de uso, a ferramenta não chega a produzir efeito. | Conta simples: dispositivos × aulas ÷ estudantes; mostrar o resultado ao lado da frequência 2.2.4. | Tecnologia e área pedagógica | Antes do teste | Média | Muralidharan, Singh e Ganimian (2019), *Disrupting education?*, American Economic Review 109(4) |
| pol-adocao-desigual (usa `d.U`/`d.E`) | `UH/EH < 0,5` no horizonte, ou impacto `desigualdade` | Acompanhar o uso por escola e por grupo de estudantes e agir onde ele for baixo: a estimativa prevê que {x}% das pessoas com acesso não vão usar no Ano {H}. | B: 60% sem uso no Ano 3; se os que não usam forem os mais defasados, a diferença entre escolas aumenta. | 1) Painel de uso por escola. 2) Limiar de alerta. 3) Apoio às escolas abaixo do limiar. | Coordenação pedagógica | Antes de contratar (indicador); para manter (rotina) | Alta com impacto de equidade; senão média | Liga `s-adocao`; UNESCO (2023), *GEM Report 2023* |
| pol-curriculo | `tarefas` inclui `tutoria`, `planos_aula`, `materiais`, `feedback_redacao` ou `correcao` | Verificar se conteúdo e atividades seguem o currículo da rede e o material em uso, com revisão por especialistas da rede antes do teste. | Uma ferramenta desalinhada do currículo compete com o professor em vez de apoiá-lo. | Amostra de 30 a 50 saídas revisadas por especialistas, com critério de aceitação no termo de referência. | Área de currículo | Antes do teste | Alta se estudantes usam; senão média | UNESCO (2023), *Guidance for generative AI in education and research* |
| pol-acessibilidade-linguas | Pergunta nova POL-Q1 marca deficiência ou outras línguas; ou impacto `inclusao`; ou problemas C8, G8, F10 | Exigir e testar acessibilidade (leitor de tela, legendas, linguagem simples) e as línguas dos estudantes, com pessoas desses grupos entre os participantes do teste. | A rede responde pelo acesso de todos; uma ferramenta que não atende esses estudantes aumenta a exclusão. | 1) Requisito em "O que exigir". 2) Teste com usuários desses grupos. 3) Critério de aceitação. | Educação especial e tecnologia | Antes de contratar (requisito); antes do teste (teste) | Alta se estudantes usam | ONU, Convenção sobre os Direitos das Pessoas com Deficiência (2006), art. 9 e 24; Brasil: Lei 13.146/2015; UNESCO GEM (2016), policy paper 24, *If you don't understand, how can you learn?* |
| pol-sem-conexao | `internet` ≠ `sim` ou POL-Q1 marca escolas rurais/remotas, com estudantes usuários | Prever funcionamento com conexão fraca ou sem conexão, ou uma atividade desplugada equivalente, para que as escolas sem internet não fiquem de fora do resultado. | Sem isso, a expansão chega primeiro a quem já está melhor. | Requisito de modo sem conexão ou de baixa banda; atividade alternativa para as escolas sem acesso. | Tecnologia e área pedagógica | Antes de contratar | Alta | Krueger e Jackson (2026, p. 7); liga `p-desplug` |
| pol-participacao | Usuários incluem professores ou estudantes, ou `afetados` inclui `criancas`/`familias` | Apresentar o plano do teste ao conselho de educação ou aos conselhos escolares, à representação dos professores e às famílias antes de começar, e registrar as objeções e o que foi feito com elas. | Uma mudança na prática docente ou no uso de dados de estudantes sem escuta perde apoio nas escolas e é revertida na primeira crise. | 1) Reunião com pauta e ata. 2) Resposta escrita às objeções. 3) Repetir ao fim do teste. | Gabinete e comunicação | Antes do teste | Alta se `k.dadosEst` e estudantes usam; senão média | UNESCO (2021), *Recomendação sobre a Ética da Inteligência Artificial*; Fullan (2007), *The New Meaning of Educational Change*, 4ª ed. |
| pol-parada | Qualquer teste marcado (ativa `r-parada`) | Fixar antes do teste os critérios para parar e o que acontece com estudantes, professores e dados se parar. | Sem critério de parada, o teste vira implantação por inércia. | 1) Dois ou três limiares (incidente grave, uso abaixo de x, resultado pior que a comparação). 2) Plano de encerramento com devolução dos dados. | Gabinete e área pedagógica | Antes do teste | Alta se `k.alto` ou `k.consDecide`; senão média | Guia, cap. 14 e PD 4 |
| pol-orcamento-plurianual (usa `d.tco.pRecorrente` e dotação) | `horizonte >= 3` e `pRecorrente >= 0,5`, ou `situacao = 'orcamento'` | Inscrever a dotação dos anos seguintes no plano plurianual e na proposta orçamentária antes de assinar: {p}% do custo é recorrente ({faixa} por exercício). | B: 75% recorrente, de US$ 280 a 337 mil por ano; um contrato sem dotação futura vira corte no meio do ciclo. | 1) Tabela de dotação por exercício do plano. 2) Cenário de estresse como teto. 3) Liberação dos anos seguintes condicionada aos resultados. | Planejamento e finanças | Antes de contratar | Alta | Brasil: LC 101/2000 (LRF), art. 16 (impacto no exercício e nos dois seguintes); Krueger e Jackson (2026, p. 6) |
| pol-continuidade | `horizonte >= 3` | Dar ao programa um ato normativo, um responsável técnico de carreira e um relatório anual público, para que a decisão de continuar dependa de resultados e não de quem assinou. | Programas sem ato e sem dono técnico morrem ou se perpetuam na troca de gestão, sem avaliação. | 1) Portaria ou resolução com finalidade e responsáveis. 2) Revisão de continuidade com data fixa. 3) Relatório público. | Gabinete | Antes de contratar | Média | Guia, PD 9; referência a verificar para a literatura sobre descontinuidade |
| pol-funcoes-internas (ativa `FUNCOES_INTERNAS`) | `g-comite` ≠ `sim` e (`arquitetura` em `api`/`ow`, ou `adaptacao = 'sob_medida'`, ou `tipoTec = 'aberta'`) | Nomear servidores para as cinco funções que não se terceirizam (finalidade, risco, evidência, continuidade, prestação de contas) antes do teste. | B e D: com integrador ou modelo aberto, quem entende a solução pode ficar fora da rede. | Ato com nomes e tempo dedicado; ligar ao comitê (`g-comite`). | Gabinete | Antes do teste | Alta | Guia, cap. 2 |
| pol-prestacao-contas | Sempre que há teste; prioridade maior com `k.consDecide` | Publicar o registro do uso de IA (finalidade, dados, fornecedor, custo, resultado) e o relatório do teste, com a decisão tomada e o motivo. | Decisão pública sobre dados de estudantes e dinheiro público pede justificativa pública. | 1) Página do programa. 2) Relatório do teste em linguagem simples. 3) Canal de ouvidoria. | Gabinete, controle interno e ouvidoria | Para manter (o primeiro relatório sai ao fim do teste) | Alta se há decisão sobre estudantes; senão média | UNESCO (2021), *Recomendação sobre a Ética da IA*; guia, PD 9 |
| pol-criterios-alocacao | `consequencias` inclui `recursos` | Publicar os critérios de distribuição de recursos entre escolas que usam a saída da ferramenta, e manter a decisão final com a instância responsável. | C: distribuir recursos com base num modelo sem critério público abre disputa e perde legitimidade. | Critérios aprovados e publicados; registro de cada decisão e de quem a tomou. | Gabinete e planejamento | Antes de contratar | Alta | Guia, PD 3 |
| pol-curadoria-normas (ativa `i-base`) | `tarefas` inclui `duvidas` | Nomear a área dona da base de normas que a ferramenta consulta, com rotina de atualização e revisão de respostas por amostra; a resposta não substitui o ato oficial. | D: o objetivo é a correção normativa; norma desatualizada vira erro repetido em todas as escolas. | 1) Responsável e prazo de atualização. 2) Revisão mensal de amostra. 3) Aviso na resposta com o link do ato. | Área normativa ou jurídica da secretaria | Antes do teste | Alta | Liga `i-base`; referência a verificar |
| pol-celular-servidor (substitui `disp-proprio` quando não há estudantes nem famílias usuários) | `modeloDisp = 'proprio'` e usuários sem `estudantes`/`familias` | Definir se o uso no celular próprio é opcional, quem paga os dados móveis e como proteger as informações da rede nesses aparelhos; oferecer acesso em equipamento da escola. | D: o uso obrigatório em aparelho pessoal transfere custo e risco ao servidor. | Norma interna de uso; acesso alternativo na escola. | Gestão de pessoas e tecnologia | Antes do teste | Média | Referência a verificar |
| pol-renovar-evidencia | `situacao = 'renovar'` | Renovar só com o relatório do contrato atual: uso real, resultado contra a linha de base, custo por usuário ativo e as alternativas disponíveis hoje. | Renovar sem avaliação transforma o teste em gasto permanente. | Relatório com os indicadores de "Em resumo" e comparação com uma alternativa. | Gabinete, avaliação e compras | Antes de contratar | Alta (bloqueia PD 9) | Guia, PD 9 |

Pergunta nova POL-Q1 (passo 1.1, opcional no Essencial, chips com "nenhum" e "não sei"): "No público deste caso há: escolas rurais ou remotas; escolas indígenas, quilombolas ou de outras comunidades tradicionais; estudantes com deficiência; estudantes que falam outra língua em casa?" Quatro chips, sem números. Ela alimenta `pol-amostra-piloto`, `pol-acessibilidade-linguas` e `pol-sem-conexao`. Sem resposta, o plano mostra "não informado" no quadro de equidade, nunca "sem risco".

---

## 3. Mudanças no desenho do sistema

1. **Uma recomendação principal, como veredito da próxima decisão.** Escolher a próxima decisão pela situação (1.1.3) e pelo teste (2.0): nova → aprovar o teste (PD 1 a 4); proposta → PD 2; orçamento → PD 5; renovar → PD 9. Mostrar na capa: "Próxima decisão: …"; "Pronto? Sim / Sim, com condições / Ainda não"; "Faltam: até 3 ações (ids)"; e "Depois: …" (a decisão seguinte, com a data). Exemplo B: "Ainda não pronto para o piloto: faltam a política de dados, uma prova de conceito do desenvolvimento sob medida e o desenho de avaliação; a ida a 50.000 estudantes fica para depois do relatório do piloto." A frase de `recomendarTeste` passa a ser um dos motivos, e não a principal.

2. **Organizar as recomendações pelos nove pontos de decisão, na ordem do ciclo.** Cada regra ganha `pd: 1..9`. O momento atual (`quando`) passa a ser derivado: PD 1 a 4 = antes do teste; PD 4 a 7 = antes de contratar; PD 8 e 9 = para manter e ampliar. Os critérios do guia ficam como "o que verificar" dentro de cada ponto, em vez de seção solta. Corrigir a ordem impressa (hoje 5, 6, 7, 1, 2, 3, 4, 8, 9) para 1 a 9.

3. **Prioridade calculada, em três níveis com nome de ação.** Os níveis "alta" e "média" dão lugar a: "Bloqueia a próxima decisão", "Condição para contratar" e "Para manter". A pontuação usa, nesta ordem:
   - (a) bloqueio de um ponto de decisão;
   - (b) irreversibilidade (escala do salto, contrato sem saída, dados de crianças);
   - (c) risco do perfil (`k.alto`, `k.consDecide`);
   - (d) equidade (grupos vulneráveis afetados, adoção desigual);
   - (e) dinheiro exposto (US$ da camada ou da saída).

   Teto: no máximo 5 ações no primeiro nível. Com mais, só entram as dos dois primeiros critérios, e o restante desce de nível.

4. **Pacotes em vez de itens soltos.** Agrupar por tema, com um texto-mãe e passos:
   - Dados: `g-dados`, `dados-acordo`, `dados-base-legal`, `dados-impacto`, `formacao-dados`.
   - Teste: `teste-recomendado`, `teste-ambos`, `tecnologia`.
   - Formação: `formacao-plano`, `formacao-papeis`, `formacao-continua`, `formacao-horas`.
   - Governança: os seis `g-*`.

   Nos 5 cartões entra no máximo um cartão por pacote. Assim o B passa de 3 cartões de dados para 1, e o C de 3 cartões de teste para 1.

5. **Cada regra traz seus próprios "Para quê", "Como" (até 3 passos), "Quem age" e "Por quê" (a razão).** São campos da regra, e não textos genéricos. "Quem age" é uma tabela de ação → área, separada de `quemSabe`. O "Por quê" diz a razão; a pergunta e a resposta vão para "Origem". É obrigatório para as regras que podem chegar aos cartões.

6. **Ligar recomendação a número e a requisito.** Campos opcionais na regra:
   - `numero(d)`, para citar o valor do caso: salto de escala (x vezes), % recorrente, dotação, adoção, custo de saída, P90 − P50;
   - `req`, para o id do requisito em "O que exigir";
   - `indicador`, para a linha de "Indicadores" que acompanha a ação.

   Uma ação de custo sem requisito, ou de política sem indicador, não entra nos cartões.

7. **Proporcionalidade pelo perfil de risco.** Regras de governança pesada (`criancas`, `supervisao`, `pol-participacao` com prioridade alta) sobem só quando estudantes usam, há decisão sobre pessoas ou há dados sensíveis. Para A e D (sem decisão sobre estudantes), a lista fica menor e a escala domina. Meta de tamanho: de 8 a 15 ações por caso, contra 14 a 25 hoje.

8. **Caso incompleto.** Antes de recomendar, testar a porta de PD 1: se 1.2.4 estiver vazio ou citar tecnologia (lista de termos como "IA", "plataforma", "app" e "chatbot", traduzida), a recomendação principal é reescrever o problema, e as ações de compra não aparecem. Uma regra que depende de valor padrão ou sugerido não confirmado leva a marca "(sugerido)" e não entra nos cartões. Com menos de 80% das perguntas essenciais respondidas, mostrar "Decisões que ainda não dá para recomendar", com a pergunta que falta para cada uma.

9. **Relatório (página e PDF).** Ordem proposta:
   1. capa com a recomendação principal (item 1);
   2. "Comece por estas" (5 cartões, um por pacote);
   3. "A sequência de decisões", uma linha do tempo com Agora, Ao fim do teste, Antes de assinar, Ao ampliar e Todo ano, e para cada uma a decisão, quem assina, os critérios e a data prevista;
   4. "Quem pode ficar para trás", um quadro curto com conexão, dispositivos, deficiência, línguas, adoção prevista e escolas do piloto, preenchido pelas respostas e por POL-Q1, com "não informado" quando faltar resposta;
   5. o restante por ponto de decisão.

   No PDF, a linha do tempo cabe em meia página logo depois de "Em resumo".

10. **Fim do percurso (4.3).** Trocar a lista completa por: a recomendação principal, as até 5 ações que bloqueiam a próxima decisão e um botão "Ver a sequência de decisões". Mostrar o efeito de mudar uma resposta, por exemplo "se a primeira etapa for de 100 escolas, a ação X sai da lista", para que a pessoa veja que o plano reage às escolhas de política, e não só às de compra.

---

## 4. Requisitos

| id | Requisito verificável | Prioridade | Como verificar |
|---|---|---|---|
| POL-01 | A recomendação principal nomeia a próxima decisão, um veredito (Sim / Sim, com condições / Ainda não) e até 3 ações que faltam, nunca só a modalidade do teste. | P1 | Nos 4 exemplos, a capa não contém "como indicam as respostas" como frase principal; o B mostra "Ainda não" com 3 ids. |
| POL-02 | Uma regra de escala dispara quando a primeira etapa cobre ≥ 50% das escolas da rede ou ≥ 10 vezes as escolas do teste, para qualquer número de usuários. | P1 | Dispara no A, no C e no D (100% das escolas) e no B (10 vezes); não dispara num caso com piloto de 20 e etapa de 60 escolas numa rede de 600. |
| POL-03 | Nos exemplos A, C e D, a ação de escala está entre os 5 cartões e no nível "Bloqueia a próxima decisão". | P1 | Teste de snapshot dos cartões dos 4 exemplos. |
| POL-04 | `recomendarTeste` trata servidores administrativos e gestores como usuários reais quando há implantação em escolas. | P1 | O D passa a receber "prova de conceito e depois piloto" (`modo: 'ambos'`). |
| POL-05 | Nenhum par de cartões vem do mesmo pacote (dados, teste, formação, governança). | P1 | No B, no máximo 1 cartão de dados; no C, no máximo 1 cartão de teste. |
| POL-06 | O campo "Quem" do cartão vem de uma tabela ação → área e não de `quemSabe`. | P1 | "Assinar acordo de tratamento de dados" mostra jurídico e proteção de dados (B, C). |
| POL-07 | Todo cartão tem um "Como" com 1 a 3 passos próprios da regra; o texto "Revise a resposta … e siga o detalhe" não aparece nos cartões. | P1 | Busca pelo texto `acComo` nos 4 exemplos = 0. |
| POL-08 | Com o impacto `desigualdade` ou `inclusao` marcado, o plano tem ao menos uma ação de equidade (amostra do piloto, desagregação ou acessibilidade) no primeiro ou no segundo nível. | P1 | O B passa a mostrar `pol-amostra-piloto` e `pol-equidade-grupos`. |
| POL-09 | Com tarefa `alerta_precoce`, o plano exige um protocolo de resposta ao alerta antes do teste. | P1 | O C mostra `pol-acao-apos-alerta` como bloqueante. |
| POL-10 | `disp-proprio` só usa o texto sobre famílias quando estudantes ou famílias são usuários; com servidores, usa `pol-celular-servidor`. | P2 | O D deixa de citar "soluções das famílias". |
| POL-11 | Regras de pagamento não disparam quando `tipoTec = 'nao_sei'` e o pagamento não foi respondido pela pessoa. | P2 | O C deixa de mostrar `lic-institucional`. |
| POL-12 | Com `horizonte >= 3` e parte recorrente ≥ 50%, o plano recomenda inscrever a dotação plurianual e cita o % e a faixa por exercício calculados pelo motor. | P1 | O B mostra "75%" e "US$ 280 a 337 mil" (ou os valores do motor na versão em uso). |
| POL-13 | Cada regra tem `pd` (1 a 9) e a página "O que fazer" agrupa as ações pelos pontos de decisão, em ordem crescente. | P2 | A ordem impressa no PDF do B é 1, 2, …, 9. |
| POL-14 | Os cartões só mostram ações com valor de origem confirmado pela pessoa (não sugerido e não padrão). | P2 | Num caso com 2.2.3 apenas sugerido, nenhum cartão cita 2.2.3. |
| POL-15 | Se 1.2.4 estiver vazio ou citar tecnologia, a recomendação principal pede para reescrever o problema e as ações de compra ficam ocultas. | P2 | Caso de teste: "Queremos um chatbot para as escolas" em 1.2.4 → principal = PD 1. |
| POL-16 | A pergunta POL-Q1 existe no passo 1.1, é opcional e, sem resposta, o quadro de equidade mostra "não informado". | P2 | Caso em branco: o quadro mostra "não informado" nas quatro linhas. |
| POL-17 | Cada caso tem entre 8 e 15 ações, e no máximo 5 no primeiro nível. | P2 | Contagem nos 4 exemplos. |
| POL-18 | O relatório tem a seção "A sequência de decisões", com ao menos 3 decisões datadas (Ano 0, fim do teste, Ano 1) e quem assina cada uma. | P2 | Presente na página e no PDF dos 4 exemplos. |
| POL-19 | Com `situacao = 'proposta'` ou teste gratuito de fornecedor pago, o plano recomenda avaliar a proposta contra o problema ou formalizar o teste com cláusula de não preferência. | P2 | O D mostra `pol-gratuito-isonomia`; uma variante do A com `alternativa = 'nao'` mostra `pol-proposta-problema` com prioridade alta. |
| POL-20 | O "Por quê" do cartão diz a razão e nunca repete só a resposta; a resposta vai para "Origem". | P1 | No B, o cartão do teste traz o motivo de `MOTIVOS_TESTE` (desenvolvimento sob medida). |
| POL-21 | As referências legais nacionais saem do perfil do país (`pais.js`); sem país, o texto fica genérico ("a lei de compras públicas do país"). | P3 | Caso com país diferente do Brasil não cita "Lei 14.133". |
| POL-22 | Com tarefa `tutoria`, frequência diária ou contínua e dispositivos compartilhados, o plano mostra os minutos por estudante por semana estimados. | P3 | O B mostra o número ao lado de `pol-dose`. |

---

## 5. Conflitos e dúvidas para o coordenador

1. **Rigor × simplicidade.** Desenho com grupo de comparação, desagregação por grupo e a pergunta nova POL-Q1 aumentam o esforço de quem responde e de quem executa. Minha proposta mantém POL-Q1 opcional e sem números e põe a avaliação comparativa como ação, sem nova pergunta. Se o painel de UX quiser zero perguntas novas, o quadro de equidade fica limitado ao que já se pergunta (conexão, dispositivos, impacto). O Emanuel decide se POL-Q1 entra no Essencial ou só no Refinar.

2. **Custo separado de política.** Uma decisão registrada do projeto é separar custo de política. A recomendação principal como veredito do ponto de decisão (item 3.1) e os pacotes (3.4) misturam os dois tipos de propósito. Proponho manter a etiqueta `tipo` em cada ação e a separação nas páginas "O que fazer" e "O que exigir", mas a capa e a linha do tempo precisam ser únicas. É preciso confirmar se isso é aceitável.

3. **Fonte de recursos.** A v11 retirou a fonte de recursos. `pol-orcamento-plurianual` e `pol-continuidade` ficam mais fortes se a ferramenta souber de onde vem o dinheiro (tesouro, fundo, empréstimo, doação), porque cada fonte tem um risco diferente de interrupção. Só o Emanuel pode decidir se volta como pergunta opcional.

4. **Participação de sindicatos e conselhos.** A recomendação de ouvir a representação dos professores e os conselhos é central na minha área, mas é sensível em alguns países e redes. Proponho o termo neutro "representação dos professores" e prioridade alta só quando há dados de estudantes ou mudança na carga docente. O tom deve ser decidido pelo coordenador, também à luz do aviso de que as recomendações não são da UNESCO.

5. **"Ainda não" na capa.** Um veredito negativo protege o interesse público, mas pode afastar o gestor que já tem decisão política tomada, e o painel de comunicação pode preferir "Sim, com condições" como piso. Minha posição: "Ainda não" só quando um ponto de decisão bloqueante falha (problema indefinido, salto de escala sem critério ou alerta sem protocolo de resposta), sempre com o que falta e quanto tempo leva.

---

## Anexo: como ficariam a recomendação principal e os 5 cartões nos 4 exemplos

Esboço para conferir a proposta, não texto final. Entre parênteses, o id da regra (existente ou proposta) e o ponto de decisão.

### A. Copiloto para professores (situação: proposta recebida)

Recomendação principal: "Próxima decisão: aprovar o piloto em 20 escolas. Sim, com condições. A implantação em 800 escolas (toda a rede) fica para depois do relatório do piloto, com critérios fixados antes."

1. Separar a decisão do piloto da decisão de implantar (`pol-escala-gate`, PD 4).
2. Escrever a cadeia do caso e decidir o uso do tempo liberado (`pol-cadeia-resultado` + `pol-tempo-liberado`, PD 1–2).
3. Avaliar a proposta contra o problema e consultar outra solução (`pol-proposta-problema`, PD 2).
4. Completar a linha de base de tempo docente nas escolas do piloto e nas de comparação (`linha-base-parcial`, PD 1).
5. Pedir cotação por escrito e exigir interoperabilidade (pacote de compra: `ferramentas-cotacao` + `integracao`, PD 6).

Sai dos cartões: `criancas` (não há estudantes usuários nem decisão sobre eles), que fica em "O que fazer".

### B. Tutor de matemática (situação: nova)

Recomendação principal: "Próxima decisão: aprovar o teste. Ainda não. Faltam a política de dados, uma prova de conceito do desenvolvimento sob medida e o desenho de avaliação com escolas de comparação. A ida a 50.000 estudantes no Ano 1 e a 150.000 no Ano 2 depende do relatório do piloto."

1. Fazer uma prova de conceito do desenvolvimento sob medida antes do piloto (pacote teste: `teste-rever`, com o motivo, PD 4).
2. Pacote de dados de estudantes: política de dados, acordo, base legal, avaliação de impacto (`g-dados` + `dados-*`, PD 3).
3. Piloto representativo, com escolas de pior resultado, e avaliação com comparação (`pol-amostra-piloto` + `pol-desenho-avaliacao`, PD 4).
4. Separar a decisão do piloto da decisão de implantar e expandir (`pol-escala-gate`, PD 4).
5. Inscrever a dotação plurianual: 75% do custo é recorrente (`pol-orcamento-plurianual`, PD 5).

Em "O que fazer", no segundo nível: `pol-equidade-grupos`, `pol-adocao-desigual` (60% sem uso no Ano 3), `pol-dose`, `pol-curriculo`, `pol-participacao`, `consumo-limites`, `pol-funcoes-internas`.

### C. Alerta precoce de abandono (situação: nova)

Recomendação principal: "Próxima decisão: aprovar a prova de conceito. Sim, com condições: compare o modelo com uma regra simples de faltas e notas e defina o que a escola faz com cada alerta. Piloto em 10 escolas só se a prova de conceito mostrar ganho; a implantação em 300 escolas, só com o relatório do piloto."

1. Começar por uma prova de conceito, que inclui a consulta ao mercado (pacote teste: `teste-recomendado` + `teste-ambos` + `tecnologia`, PD 4).
2. Comparar com uma regra simples de indicadores (`pol-regra-simples`, PD 2).
3. Definir o protocolo de resposta ao alerta e a capacidade de atendimento (`pol-acao-apos-alerta`, PD 2).
4. Pacote de dados e de não estigmatização: acordo, base legal, avaliação de impacto, acesso e proibição de usos secundários (`dados-*` + `pol-estigma`, PD 3).
5. Verificar diferenças entre grupos e publicar os critérios de distribuição de recursos (`pol-equidade-grupos` + `pol-criterios-alocacao`, PD 3).

Sai da lista: `lic-institucional` (pagamento não escolhido).

### D. Assistente para solicitações das escolas (situação: orçamento)

Recomendação principal: "Próxima decisão: aprovar a prova de conceito gratuita. Sim, com condições: formalize o teste por instrumento público, sem preferência na contratação, e acerte o preço depois do período gratuito. Antes de 270 escolas, faça um piloto com servidores."

1. Formalizar o teste gratuito e acordar o preço depois dele (`pol-gratuito-isonomia` + `gratis-fim`, PD 6).
2. Listar os custos que a gratuidade adia e pedir a dotação dos anos seguintes (`gratis-adiados` + `pol-orcamento-plurianual`, PD 5).
3. Fazer um piloto com servidores reais antes de implantar (`pol-teste-servidores`, PD 4).
4. Nomear a área dona da base de normas (`pol-curadoria-normas`, PD 8).
5. Negociar um contrato com propriedade do código, documentação e saída, em vez de termos de uso padrão (pacote contrato: `termos` + `sob-medida`, PD 7).

Muda de texto: `disp-proprio` → `pol-celular-servidor`. O pacote de governança (`g-comite`, `g-politica`, `g-etica`, `g-legislacao`) fica num cartão só em "O que fazer", com `g-legislacao` como condição para contratar.

---

## Referências citadas neste parecer

Só as que tenho certeza de que existem; os artigos de lei devem ser conferidos antes de entrar no texto da ferramenta.

- Baker, R. S. e Hawn, A. (2022). Algorithmic bias in education. *International Journal of Artificial Intelligence in Education*, 32, 1052–1092.
- Banerjee, A. et al. (2017). From proof of concept to scalable policies: challenges and solutions, with an application. *Journal of Economic Perspectives*, 31(4), 73–102.
- Bowers, A. J., Sprott, R. e Taff, S. A. (2013). Do we know who will drop out? A review of the predictors of dropping out of high school: precision, sensitivity, and specificity. *The High School Journal*, 96(2), 77–100.
- Coburn, C. E. (2003). Rethinking scale: moving beyond numbers to deep and lasting change. *Educational Researcher*, 32(6), 3–12.
- Escueta, M., Nickow, A. J., Oreopoulos, P. e Quan, V. (2020). Upgrading education with technology: insights from experimental research. *Journal of Economic Literature*, 58(4), 897–996.
- Faria, A.-M. et al. (2017). *Getting students on track for graduation: impacts of the Early Warning Intervention and Monitoring System after one year* (REL 2017-272). Washington, DC: IES, REL Midwest.
- Fullan, M. (2007). *The new meaning of educational change* (4ª ed.). Teachers College Press.
- Funnell, S. C. e Rogers, P. J. (2011). *Purposeful program theory*. Jossey-Bass.
- Krueger, K. e Jackson, F. para CoSN (2026). *Beyond the price tag*. Paris: UNESCO.
- Muralidharan, K., Singh, A. e Ganimian, A. J. (2019). Disrupting education? Experimental evidence on technology-aided instruction in India. *American Economic Review*, 109(4), 1426–1460.
- OCDE (2019). *TALIS 2018 Results (Volume I)*. Paris: OECD Publishing.
- ONU (2006). Convenção sobre os Direitos das Pessoas com Deficiência.
- UNESCO (2016). *If you don't understand, how can you learn?* GEM Report, Policy Paper 24.
- UNESCO (2021). *Recomendação sobre a Ética da Inteligência Artificial*.
- UNESCO (2023). *Global Education Monitoring Report 2023: Technology in education: A tool on whose terms?*
- UNESCO (2023). *Guidance for generative AI in education and research*.
- Brasil: Lei Complementar 101/2000 (LRF), art. 16; Lei 13.146/2015 (LBI); Lei 14.133/2021 (licitações e contratos).
