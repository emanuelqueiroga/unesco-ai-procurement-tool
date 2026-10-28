Campo de texto ou número com rótulo acima e linha de origem abaixo.

**Use** para respostas curtas: nomes, quantidades, meses. Para texto longo use a mesma anatomia com `textarea` de 3 linhas mínimas.

**Anatomia**: rótulo em `caption-13` `muted`; campo de 44 px com borda `line-control`, raio `radius-md`, texto em 16 px (nunca menor, para o celular não dar zoom); abaixo, a linha de origem em `caption-13`: "informado", "padrão: …", "~ sugerido · <de onde>" ou a mensagem de erro.

**Valor sugerido**: fundo `accent-tint` e borda `accent` até a pessoa editar ou confirmar com "Aceitar a sugestão e continuar"; depois vira informado e perde o âmbar. A linha de origem sempre diz de qual resposta a sugestão veio.

**Erro**: borda `crit`, mensagem em `crit` dizendo o que fazer, nunca só "inválido". O campo nunca bloqueia o avanço; a pergunta fica listada em "respostas que faltam".

**Não** use placeholder como rótulo, não use máscara que esconda o que a pessoa digitou, não alinhe números à esquerda em tabelas.
