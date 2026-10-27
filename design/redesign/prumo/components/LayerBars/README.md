Gráfico de barras horizontais do custo por camada, com rótulo e valor fora da barra.

**Use** em "Em resumo" e em "Quanto custa". É o único gráfico do caminho Essencial; os demais (dotação por exercício, tornado, cenários) ficam no modo Refinar e seguem as mesmas regras.

**Anatomia**: título em 16 px 600 dizendo o que se mede; uma linha por camada com nome (170 px), barra de 14 px em `layer-N` com `radius-sm`, valor à direita em `tabular-nums`; ordem decrescente de valor, nunca a ordem das camadas; legenda em `caption-13` com a fonte e "valores ilustrativos".

**Acessibilidade**: o contêiner leva `role="img"` e `aria-label` com a conclusão ("Aplicações e internet somam 71%"); os valores estão em texto, então nada depende da cor. No SVG do PDF, a mesma ordem e as mesmas cores.

**Não** use eixos, grades ou rótulos dentro da barra; não use gráfico de pizza; não use legenda de cores separada (o nome está na linha).
