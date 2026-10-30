# v015 — Nomenclatura e textos das quatro etapas

## RF-001-A — Identidade consistente das etapas

Complemento dos RF-001, RF-007 e RF-012 da especificação da v015. Escopo autorizado pelo proprietário em 2026-10-30: implementar a nomenclatura e revisar os textos das etapas na v015, mantendo a entrega da página inicial e a base React/Prumo da v014.

| ID estável | Português | Inglês |
|---|---|---|
| 1 | Contexto | Context |
| 2 | Prova de conceito ou piloto | Proof of concept or pilot |
| 3 | Implantação | Deployment |
| 4 | Expansão | Scale-up |

Os títulos, perguntas de orientação, apresentações e resultados esperados das aberturas são definidos em `app/src/percurso/textos.ts`. Navegação, barras de progresso, títulos das abas, referências às perguntas no plano e transições entre capítulos reutilizam essa definição. O detalhe “Como funciona” da página inicial apresenta as mesmas quatro etapas, na mesma ordem. As seções do plano já usavam os nomes pretendidos; não se altera seu conteúdo financeiro ou decisório nesta entrega.

## Critérios de aceite

1. Cada abertura e seus atalhos exibem o nome correspondente no idioma selecionado; em inglês, os quatro nomes devem coincidir exatamente com a tabela.
2. Guias, introduções e entregas explicam contexto, avaliação, implantação e expansão, identificando custos como estimativas. A prova de conceito não é descrita como um piloto em escolas.
3. A página inicial mantém seu desenho aprovado e mostra as quatro etapas no detalhe opcional “Como funciona”.
4. Os mesmos nomes aparecem no menu lateral, barra de capítulos, transições, título da aba e referências do plano; rotas e códigos originais permanecem válidos.
5. Mudar de idioma não altera respostas, cálculos nem a fase associada a uma pergunta. Português, inglês, espanhol, francês, árabe, chinês, isiZulu e kiswahili têm os novos textos; Bamanankan conserva seus nomes de etapa existentes e usa fallback inglês explícito para as novas introduções. Os avisos existentes de tradução preliminar são preservados. Não se declara revisão por falantes nativos.
6. Esta atualização mantém a versão interna alpha.8 e sua chave de persistência, para retomar os rascunhos já salvos na v015. A identificação desta entrega é o commit e o arquivo de proveniência.
7. Build e suíte de regressão devem passar. A publicação no main altera somente `docs/revisao/v015/`; v014 e versão estável permanecem idênticas.

## Limites da entrega

Não modifica perguntas, ramificação, cardinalidade de iniciativas, persistência, fórmulas, critérios de avaliação ou lógica dos relatórios. O comportamento condicional para políticas, governança e formação descrito no RF-012 depende de uma entrega posterior; mudar os nomes dos capítulos não o implementa.
