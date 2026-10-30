# v015 — Back / Next e nomes das etapas

Solicitação do proprietário: substituir Continue / Skip por Back / Next no percurso e retirar Chapter / Capítulo dos nomes e referências às etapas.

## Comportamento

- Todas as 24 perguntas exibem Voltar e Próximo em português e Back e Next em inglês. Não exibem Continue, Skip, Pular por agora ou o antigo link duplicado de retorno.
- Voltar retorna à pergunta anterior; na primeira pergunta de uma etapa, retorna à sua abertura. Os dados já digitados permanecem no caso.
- Próximo mantém o comportamento anterior de Continuar, incluindo confirmação das sugestões válidas exibidas. Quando houver tais sugestões, uma nota explica sua aceitação ao avançar. Campos em branco continuam permitindo um plano preliminar.
- As quatro aberturas usam o mesmo par de ações. Voltar leva ao início ou ao resumo da etapa anterior; Próximo abre a primeira pergunta da etapa.
- Os quatro resumos usam o mesmo par. Voltar retorna à última pergunta da etapa, e Próximo abre a etapa seguinte ou o plano após Expansão.
- Cabeçalhos, títulos de abas, apresentações, resumos, títulos de premissas, navegação e rótulos de acessibilidade deixam de usar Chapter / Capítulo para identificar as etapas. As quatro etapas continuam Context, Proof of concept or pilot, Deployment e Scale-up, traduzidas no idioma selecionado.
- As contagens das perguntas são mantidas. Referências bibliográficas a capítulos do guia conservam sua identificação. Tipos, classes e URLs internas anteriores permanecem compatíveis.
- Perguntas, país, escopo nacional fixo, respostas salvas, fórmulas e relatórios financeiros não mudam.

## Idiomas e validação

As novas chaves de interface estão nos oito dicionários de tradução, com português como origem. Novos textos de Bamanankan usam fallback inglês, preservando traduções existentes de ações quando disponíveis e o aviso de tradução preliminar.

O navegador conferiu o par Back / Next e a ausência de Continue / Skip e de prefixos Chapter nas 24 perguntas, nas quatro aberturas e nos quatro resumos. Conferiu também a preservação da escolha do país ao avançar e voltar e os destinos de retorno dos resumos. A suíte de regressão e o build são executados antes da publicação, que altera somente docs/revisao/v015/.
