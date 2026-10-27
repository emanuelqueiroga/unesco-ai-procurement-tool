Botão de ação em três pesos: primário (uma por tela), secundário e link.

**Use** o primário para a única ação que avança a história: "Continuar", "Aceitar a sugestão e continuar", "Baixar o plano". O secundário para sair sem avançar ("Pular por agora", "Voltar"). O link para abrir contexto sem sair da tela ("Por que perguntamos isso?", "de onde vem?").

**Tokens**: fundo `primary`, hover `primary-strong`, texto `on-primary`; secundário com borda `line-control` sobre `surface-1`; link em `primary` sublinhado. Altura 44 px, padding horizontal `space-5`, raio `radius-md`, peso 600 em 15 px.

**Estados**: hover, foco (anel `focus` de 2 px afastado 2 px), pressed (mesma cor do hover, sem deslocamento), desabilitado (opacidade 0,5 e cursor `not-allowed`; mantenha o rótulo dizendo por que, como "Baixar PDF · 12 lacunas").

**Não** coloque dois primários na mesma vista, não use ícone sem texto, não use verbo no gerúndio. Em celular o primário ocupa a largura toda e vem antes do secundário na ordem de leitura.
