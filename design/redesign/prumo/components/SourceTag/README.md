Etiqueta de origem de um valor, com quatro estados fixos: padrão, sugerido, informado, refinado.

**Use** ao lado de todo número do plano, de toda premissa no modo Refinar e na linha de origem dos campos. É o componente que cumpre o princípio "todo número tem origem".

**Estados e tokens**: `padrão` (borda `line-control`, texto `muted`): premissa da ferramenta. `~ sugerido` (fundo `accent-tint`, texto `accent-ink`): derivado de outra resposta, não confirmado. `informado` (fundo `primary-tint`, texto `primary`): a pessoa respondeu. `refinado` (fundo `ink`, texto `surface-1`): ajustado pelo técnico no modo Refinar.

**Companheiro obrigatório**: o link "de onde vem?" em `caption-13` `primary`, que abre a premissa ou leva à pergunta. A etiqueta e o link sempre ficam na mesma linha, abaixo ou ao lado do número.

**Não** invente um quinto estado; não traduza as quatro palavras de forma diferente em telas diferentes (são chaves de i18n únicas); não use a etiqueta sem o link.
