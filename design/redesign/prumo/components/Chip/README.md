Chip de seleção múltipla para listas de itens curtos: impactos desejados, tarefas da IA, etapas de ensino.

**Anatomia**: botão com `aria-pressed`, 36 px de altura, `radius-pill`, borda `line-control`. Selecionado: fundo `primary`, texto `on-primary`. Sugerido e ainda não confirmado: fundo `accent-tint`, borda `accent`, texto `accent-ink`, prefixo "~".

**Comportamento**: a ordem é a do catálogo, nunca reordena ao selecionar. Um contador "3 de 10 marcados" fica acima do grupo em `caption-13`. O chip "Outro…" abre um `TextField` logo abaixo do grupo.

**Não** use chips para escolha única (use `OptionCard` ou `Segmented`), não quebre o texto do chip em duas linhas (encurte o rótulo), não passe de 12 chips visíveis sem agrupar.
