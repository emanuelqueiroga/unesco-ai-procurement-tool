O plano em miniatura, à direita da pergunta, que se preenche a cada resposta. É o protagonista da narrativa.

**Use** em toda tela de pergunta a partir de 1100 px (coluna de 400 px). Entre 900 e 1100 px vira uma gaveta inferior com o resumo "Seu plano · 3 números, 2 recomendações" que a pessoa puxa; abaixo de 900 px, a gaveta ocupa a tela ao abrir.

**Anatomia**: zona `label-12` "Seu plano · escrevendo" (ou "em branco", "completo") com o link "Abrir inteiro"; o papel em `surface-plan` com borda `line` e `radius-lg`; capa com o kicker, o título do caso em serif 18 px e uma linha de fatos; as quatro páginas na ordem fixa Em resumo, Quanto custa, O que fazer, O que exigir, cada uma mostrando só o que já existe; páginas ainda vazias aparecem em `muted` com a dica de quando vão aparecer ("aparece no capítulo 4").

**Reação**: o item que uma resposta acabou de criar ou mudar ganha borda de 2 px `accent` e a legenda "atualizado agora" ou "Novo:" em `accent-ink`, por dois segundos ou até a próxima resposta; o papel rola sozinho até esse item. Só um item em âmbar por vez.

**Vazio**: na página inicial, o papel mostra lacunas em `line-control` ("Rede: ———", KPIs com "—") e a frase "A primeira resposta escreve a primeira linha."

**Não** coloque botões dentro do papel além de "Abrir inteiro" e "Baixar PDF" no pé; não mostre a mandala nem a matriz aqui; não renderize texto abaixo de 12 px (os rótulos dos KPIs compactos são 11 px só porque acompanham um número de 20 px no mesmo bloco, e ficam em `muted` a 4,5:1 sobre `surface-1`).
