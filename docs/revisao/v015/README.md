# v015 — primeira entrega: página inicial

Prévia para validação do proprietário, em 30/10/2026. Base: `main` em `37dafe28eef351a30db0be548e1c7f4ccce5e232`, que já continha uma v015 na implementação JavaScript original. Esta entrega não substitui essa base pelo React do ramo `develop`.

Endereço: https://emanuelqueiroga.github.io/unesco-ai-procurement-tool/revisao/v015/

## Alterações

- Título e explicação mais curtos, começando pelo contexto educacional.
- Uma ação principal: Começar; com caso salvo, Continuar o caso salvo.
- Exemplo e importação como ações secundárias; explicação e matriz em Como funciona.
- Sem atalhos redundantes no cabeçalho da página inicial. Eles reaparecem no percurso.
- Caso salvo identificado, opção de copiar/exportar e aviso antes de começar outro plano.
- Estilos específicos da abertura, viewport móvel e identificação v015.
- Novos textos em inglês, espanhol, francês, árabe, chinês, suaíli e zulu. Bambara mantém o fallback inglês já previsto na aplicação; avisos de tradução preliminar preservados. Não houve revisão por falantes nativos.

## Correções necessárias para abrir a prévia

O bundle anterior consultava `const PAISES` antes da declaração, interrompendo a inicialização. O acesso em `OPC` agora é adiado até a consulta do formulário. A regressão foi reproduzida e recebeu teste específico.

O build usava a opção GNU `base64 -w0`, incompatível com macOS, deixando os logos e a figura sem conteúdo na v015 anterior. A codificação agora funciona com GNU/BSD. O build aceita destino e versão de prévia sem mudar `VERSION` da versão estável.

## Reprodução

```sh
OUT=docs/revisao/v015/index.html CANAL=revisao VERSAO_BUILD=0.0.15-preview.1 SEM_FONTES=1 bash build.sh
node tests/test_v015_inicio_boot.js
node tests/test_v15_fases.js
node tests/test_custos_v2.js
```

`SEM_FONTES=1` preserva a condição do bundle v015 recebido, que já tinha `FONTES_PDF = null`. Esta entrega não certifica PDFs nos nove idiomas nem inclui a evolução de relatórios. O gerador completo de fontes depende das fontes Noto nos caminhos previstos pelo projeto.

A chave local da prévia usa `0.0.15-preview.1`, separada das versões anteriores. Casos antigos permanecem em suas chaves; a aplicação oferece importação. O formato de dados continua o da base existente, sem migração nova nesta etapa.

## Validação realizada

- Sintaxe da fonte e do bundle gerado; imagens incorporadas; viewport e canal de revisão.
- Três verificações da inicialização, dez cenários existentes v015 e 125 verificações existentes do motor: aprovados.
- Navegador real: Começar abre o contexto, Home retorna ao início, caso fictício é preservado/retomado após recarga, importação abre, matriz abre e fecha com Escape.
- Abertura em português e inglês; árabe com direção RTL; ausência de rolagem horizontal nas larguras de 360/390 pixels amostradas; logos carregados.
- `docs/index.html` e `docs/revisao/v014/` sem alterações.

Escopo de aceite: página inicial. Não foi feita nova auditoria completa das modificações de fluxo/custo que já estavam em `main`. As próximas entregas aguardam aprovação desta abertura.
