# v015 — Revisão da navegação e da apresentação de letramento

## Implementado

- Voltar e Próximo percorrem as perguntas de forma contínua, inclusive entre etapas. Aberturas e sínteses antigas redirecionam para perguntas úteis, sem acrescentar entradas ao histórico do navegador.
- O link de cada etapa abre sua primeira resposta pendente; uma etapa respondida pode ser revisada desde a primeira pergunta.
- Condições de validação pedagógica, atividades digitais e projeto de IA ficam logo após a escolha da oferta, antes do planejamento das ações.
- Opções longas passam a usar cartões com rádio ou checkbox nativos, alinhados em duas colunas no computador e uma no celular.
- Públicos, objetivos e ações ficam agrupados por público. Grupos com vários públicos podem ser recolhidos e mostram quantas respostas têm.
- Campos numéricos relacionados usam colunas alinhadas; rótulos de graduação, pós-graduação e egressos continuam distintos.
- O painel do plano fica recolhido até 1439 px; em telas maiores usa 320 px. A área principal tem largura e espaçamentos constantes.
- Próximo aponta para campos pendentes, abre o grupo correspondente e leva o foco ao primeiro controle. Valores podem ser informados como a levantar, sem se tornarem zero. Informações adicionais continuam opcionais e recolhidas.
- O orçamento agrupa cada categoria com seu estado e valor. Recursos adicionais recebem tipo e detalhes no próprio item; a inclusão leva ao novo item. Corrigido o título numerado de recurso adicional nos idiomas.
- Professores e diretores podem informar etapas e escolas. Equipes públicas e ensino superior não exigem escolas da educação básica.
- Currículo isolado dispensa a tela de participantes. Suas condições de inclusão ficam no desenho curricular, mantendo a mesma chave de dados. Textos, navegação, retomada e relatório acompanham essa variação.
- O seletor Essencial/Refinar, sem efeito nesse percurso, foi retirado somente do letramento.

Não há migração destrutiva: mantidos IDs, respostas, valores, notas, formato 14 e armazenamento. PT/EN completos nas novas entradas; outros idiomas preservam traduções existentes e recebem fallback inglês explícito para textos novos.

## Verificação

901 testes aprovados em 43 arquivos, 2 ignorados e 1 pendente. Quatorze testes novos cobrem navegação entre etapas, condicionais, públicos escolares, separação de subgrupos, orçamento e retomada de currículo isolado. Build com tipos, lint de domínio e diff aprovados.

Interface: caso com cinco públicos e currículo, até 14 perguntas com as três condições abertas, concluído até o plano; caso de equipes públicas presencial com 10 perguntas; currículo isolado com 10 perguntas. Testados alertas e foco em grupo fechado, dados exatos, nota adicional, troca PT/EN, marcar/desmarcar informação a levantar, custo desconhecido/zero/valor informado e inclusão/remoção de recurso sintético. Subtotal R$ 1.234,56 preservado. Conferidos celular (390 px de viewport, 375 px úteis sem rolagem horizontal), tamanho padrão e tela ampla de 1600 px. Tamanho temporário restaurado.

## Avaliação dos demais percursos — proposta

Os três percursos abaixo foram avaliados por inspeção do modelo e das telas representativas. Esta entrega implementa a revisão do letramento; não declara concluído o redesenho integral dos outros percursos.

### Governança

Manter as quatro etapas institucionais e o alcance nacional. Manter sandbox apenas quando selecionado, sem transformar regulamentação em piloto de ferramenta. Aplicar navegação contínua, cartões alinhados, agrupamento por desafio, painel recolhível e mensagens precisas de pendência. Reduzir os controles Essencial/Refinar que não mudam o conteúdo institucional. Opções legadas só precisam reaparecer quando pertencem ao caso salvo. Separar claramente instrumentos existentes, evidências verificadas e ações planejadas.

### Educação com e sem IA

O contexto já foi ajustado na entrega 14. As etapas seguintes ainda pressupõem ferramenta: PoC, tarefas da IA, usuários, pagamento e licenças. Manter a proposta de Contexto → Intervenção e avaliação → Execução e recursos → Acompanhamento e expansão, com escolha explícita de intervenção sem IA, com IA, mista ou a definir. Presets por tema e orçamento educacional; recursos digitais e PoC somente quando pertinentes. Painel e PDFs devem acompanhar esse modelo.

### Educação para a era da IA

Os dez desafios F1–F10 continuam usando o percurso de 23 perguntas e atribuem sugestões de tarefas de ferramenta a necessidades curriculares. Propor ações de currículo, pensamento crítico, criatividade, cidadania e preparação para o trabalho; contratação de ferramenta deve ser um caminho condicional. Encurtar temas, substituir digitação obrigatória por seleções e manter meta editável. Definir a fronteira com os temas Future of work, Global citizenship, Soft skills e TVET da prioridade com e sem IA; objetivos compartilhados não devem duplicar ações, participantes ou custos.

### Seleção combinada e troca de prioridades

Na alternância observada de com e sem IA para era da IA, o painel ainda exibia impactos anteriores antes da seleção de novos desafios. Revisar o isolamento das sugestões e das respostas ativas por frente, mantendo os dados antigos disponíveis. Critério de aceitação: trocar ou combinar prioridades deve atualizar perguntas, metas sugeridas, tarefas, orçamento e recomendações sem apagar dados nem apresentar sugestões inativas como respostas atuais.

## Referências de inspeção da interface

- `app/src/screens/Letramento.tsx:20` — foco e abertura do primeiro grupo pendente corrigidos.
- `app/src/screens/Letramento.tsx:30` — grupos nomeados e opções com controles nativos.
- `app/src/screens/Governanca.tsx:214` — ainda há síntese e abertura intermediárias; proposta de navegação contínua.
- `app/src/screens/Governanca.tsx:231` — pendências de conteúdo não são identificadas pelo botão; propor orientação explícita.
- `app/src/screens/shell.css:12` — painel de 400 px ainda restringe outros percursos em telas médias.
- `app/src/domain/prioridades.js:99` — desafios curriculares F1–F10 ainda sugerem tarefas de ferramenta; revisão conceitual proposta.

Revisão de apresentação orientada pelas Web Interface Guidelines: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md.
