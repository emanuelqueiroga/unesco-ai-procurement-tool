Barra de quatro segmentos com o progresso de cada capítulo, na cor da sua fase.

**Use** no topo das telas de abertura e síntese de capítulo e, abaixo de 900 px, no lugar de `ChapterNav`.

**Anatomia**: quatro trilhos de 6 px em `line` com raio `radius-pill`; o preenchimento usa `phase-1` a `phase-4` e cresce com a proporção de perguntas respondidas; rótulo em 12 px abaixo, `muted`, o capítulo atual em `ink` 600 e o concluído com ✓.

**Comportamento**: cada segmento é um link para a abertura do capítulo; em 400 px os rótulos viram só os números.

**Não** anime o preenchimento além de 200 ms; não use a barra como único indicador em desktop (a `ChapterNav` traz as perguntas).
