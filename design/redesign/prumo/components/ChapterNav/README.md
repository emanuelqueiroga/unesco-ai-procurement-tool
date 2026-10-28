Lista vertical do percurso: os quatro capítulos e, no capítulo aberto, suas perguntas com estado.

**Use** na coluna esquerda da tela principal (260 px) em telas a partir de 900 px. Abaixo disso, substitua por `ChapterBar`.

**Anatomia**: rótulo de zona em `label-12` com o contador "11 de 24"; cada capítulo com um círculo de 18 px (concluído: fundo `primary` com ✓; atual: borda de 2 px `primary` com o número; pendente: borda `line-control` e número em `muted`) e o nome em peso 600; o capítulo ativo ganha fundo `surface-2`. Só o capítulo aberto mostra as perguntas, em `caption-13`, com as marcas de texto ✓ (respondida, `muted`), ● (atual, `ink` 600), ○ (pendente, `muted`) e ~ (sugerida a confirmar, `accent-ink`).

**Comportamento**: todo item é um link que abre a pergunta; o capítulo atual rola para ficar visível; a legenda das marcas fica no rodapé da coluna.

**Não** mostre todas as 24 perguntas de uma vez; não use ícones no lugar dos glifos de texto; não use a mandala.
