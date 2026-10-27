Diálogo modal para confirmação, importação de caso e o visualizador de figura.

**Use** só quando a ação é irreversível ou precisa de um arquivo: começar em branco, importar JSON, ampliar a Figura 1. Nunca para informação que cabe num `Alert`.

**Anatomia**: `overlay` atrás; caixa de 440 px (figura: até 90% da tela) em `surface-1`, `radius-lg`, `shadow-md`, padding `space-5`; título em `heading-18`; texto em `body-14` `ink-2`; ações à direita, secundário antes do primário. `role="dialog"`, `aria-modal`, foco preso e devolvido ao botão de origem, `Esc` e clique no fundo fecham.

**Não** use mais de dois botões; não use diálogo para erro de campo; em 400 px o diálogo ocupa a largura menos `space-4` de cada lado.
