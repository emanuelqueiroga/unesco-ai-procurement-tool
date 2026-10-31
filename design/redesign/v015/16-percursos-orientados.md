# v015 — Governança e percursos educacionais orientados

## Entrega aprovada e implementada

A partir da revisão 15, implementar o mesmo padrão de navegação e apresentação na governança, na educação com e sem IA e na educação para a era da IA. Esta entrega altera somente a revisão v015.

### Governança

- Back/Next percorrem as perguntas continuamente, sem síntese e abertura intermediárias. Links antigos são remapeados sem aumentar o histórico.
- A navegação de etapa abre a primeira pendência; etapas completas podem ser revisadas desde a primeira pergunta.
- Rádios e checkboxes nativos substituem chips; instrumentos existentes, evidências e ações futuras permanecem distintos.
- Instrumentos e ações são agrupados por desafio e recolhíveis. Categorias de orçamento são recolhíveis, com situação e valor no resumo.
- O avanço identifica campos pendentes, abre seu grupo e dá foco ao primeiro controle. Desconhecido continua diferente de zero.
- A governança cobre a rede nacional. Só desafios G alimentam suas ações; temas educacionais não viram ações institucionais.
- Sandbox continua condicional a G15. Regulamentação não cria um piloto obrigatório.
- Desafios antigos só aparecem quando já pertencem ao caso salvo.

### Educação com e sem IA e educação para a era da IA

Etapas: Contexto → Intervenção e avaliação → Execução e recursos → Acompanhamento e expansão.

- Mantidas as etapas, escolas e estudantes e os 11 temas de educação com e sem IA. Os dez temas da era da IA recebem rótulos curtos, conservando F1–F10.
- Escolha explícita de intervenção sem IA, com IA, mista ou a definir.
- Objetivos, ações e indicadores são sugeridos por tema para selecionar. Impactos são derivados dos desafios; metas numéricas e unidades continuam editáveis. Não há situação atual, linha de base ou alternativa sem IA como perguntas obrigatórias.
- Avaliação durante a execução pode dispensar um teste prévio. Validação pedagógica, piloto e prova de conceito aparecem conforme a escolha; prova de conceito técnica só é oferecida com IA e não exige matricular escolas.
- Uso de IA, solução e salvaguardas só são perguntados quando há IA. Internet e dispositivos só aparecem para IA ou recursos digitais.
- Execução inclui participantes únicos, escolas, responsável, prazo e apoio aos profissionais. Acompanhamento inclui responsáveis, periodicidade, equidade e condições de continuidade/expansão.
- Orçamento educacional usa somente valores informados. Custos compartilhados com governança ou formação são referenciados sem somar novamente. Há presets de recursos adicionais e informações opcionais recolhidas.
- Página, painel e os dois PDFs usam a mesma projeção educacional; não aplicam silenciosamente o motor de licenças do percurso anterior.

### Seleções combinadas e preservação

- Temas equivalentes são reunidos: C17/F1/F8 (trabalho), C18/F5 (TVET), C20/F7 (cidadania), C21/F2 (competências), entre outros legados. Há uma meta e um conjunto de ações por tema, um alcance único e um orçamento educacional.
- Decisões gerais ficam em `ctx.educacao.percursos[chaveDeTemas]`; objetivos ficam em `ctx.educacao.temas[id]`. Trocar o conjunto de desafios não ativa decisões e custos de outro conjunto. Voltar ao conjunto original recupera seus dados.
- Notas adicionais ficam em sua própria frente e não criam desafios novos. `problemaOutro` legado continua preservado e legível.
- Frentes institucionais e intervenção podem ser alternadas mantendo seus dados e recursos. Os exemplos A–D continuam sendo projetos explícitos de ferramenta com estimativas ilustrativas próprias.
- Mantidos formato 14, chave de armazenamento, IDs antigos, valores, notas e importação/exportação. Links antigos de ferramenta ganham destinos educacionais válidos.

## Apresentação

Formulário e seletor de frentes alinhados em 760 px. Cartões em duas colunas no computador e uma no celular. Campos relacionados de alcance ficam alinhados. Painel em gaveta até 1439 px e lateral de 320 px em telas maiores. Back/Next têm posição e largura consistentes. Controles Essencial/Refinar sem efeito foram retirados dos percursos orientados e antes da seleção de prioridade.

Novos textos completos em PT/EN. Traduções existentes foram preservadas nos outros seis idiomas; entradas novas usam fallback inglês explícito. Sem revisão nativa dessas traduções.

## Verificação

925 testes aprovados em 44 arquivos, 2 ignorados e 1 pendente. Os 24 novos testes cobrem condicionais, temas sobrepostos, orçamento, desconhecidos/zero, preservação, troca de conjunto, retomada, frentes combinadas e os dois PDFs. Expectativas anteriores foram atualizadas somente para o comportamento aprovado; projetos explícitos de ferramenta e exemplos continuam cobertos.

Build com TypeScript e lint de domínio aprovados. No navegador: caminho educacional combinado de 12 perguntas sem IA e 15 com prova de conceito/piloto/digital; governança combinada com 12 perguntas até o plano; troca de frentes preservando R$ 500,00 na governança e R$ 1.234,56 na intervenção. Verificados alerta/foco em categoria fechada, tradução PT/EN e meta decimal 80,5. PDFs sem IA gerados e páginas renderizadas conferidas. Celular de 390 px: 375 px úteis e 375 px de conteúdo, sem rolagem horizontal.

## Referências da revisão visual

- `app/src/screens/Educacao.tsx` — controles nativos, grupos nomeados, meta numérica e resumo de orçamento.
- `app/src/screens/Governanca.tsx` — navegação contínua, grupos recolhíveis e pendências com foco.
- `app/src/screens/orientado.css` — alinhamento de formulário/frentes e botões consistentes no celular.
- `app/src/percurso/pedagogico.ts` — decisões condicionais e separação de respostas por conjunto de temas.

Orientação: Web Interface Guidelines, https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md.
