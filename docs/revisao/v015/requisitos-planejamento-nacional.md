# v015 — Planejamento no nível de país

Decisão do proprietário: o planejamento desta ferramenta é sempre no nível de país. Esta decisão explícita substitui a alternativa anterior de escolher jurisdição no RF-003/D-04. Entrega limitada à v015.

## Comportamento

- Retirar Decision level do Essencial, Refinar, progresso e atalhos. O estado ativo usa `ctx.nivel = 'pais'`; esta configuração não conta como resposta da pessoa.
- O endereço antigo da pergunta de nível abre a escolha do país. O Essencial passa a ter 24 telas e o capítulo Contexto passa a ter 10.
- Na antiga página School system name, perguntar primeiro qual é o país. Disponibilizar busca e os 249 países/territórios do catálogo ISO 3166-1. Guardar o código ISO alfa-3 e localizar nomes no navegador, sem requisição externa durante o uso.
- A instituição responsável é opcional. Seu nome não substitui a resposta sobre o país. Permitir declarar país não informado e manter a navegação de rascunho.
- O país selecionado identifica o plano, suas sínteses, o resumo e o PDF. O contexto do relatório mostra país e instituição opcional, sem pedir nível de decisão.
- Separar o catálogo de identidade dos cinco perfis com referências locais. Um país sem perfil mantém a cadeia de referências globais, sem inventar contagens, moeda, região ou preços nacionais. Mostrar essa limitação junto ao seletor.
- Ao abrir um plano antigo, conservar instituição, demais respostas, cálculos editados e escopo anterior em metadados legados. Aplicar o escopo de país ao estado ativo; não inferir o país por texto livre.
- Manter a versão interna alpha.8 e a chave de armazenamento da v015 para preservar os rascunhos existentes. A migração é idempotente e ocorre também na importação.

## Catálogo

`data/paises-catalogo.json` é um recorte dos códigos e nomes ISO 3166-1 do projeto pycountry, derivado de iso-codes. A fonte e o SHA-256 do original estão no arquivo. A licença LGPL-2.1 acompanha o catálogo em `data/paises-catalogo-LICENSE.txt`. A lista não indica que existem dados de custo para todos os países e territórios.

## Aceite e validação

A suíte de regressão inclui a abertura sem respostas falsas, país primeiro, ausência de nível no Refinar, preservação do legado e da calculadora, importação/exportação de um país fora dos cinco perfis, nomes por idioma, ausência de dados nacionais inventados e compatibilidade do endereço antigo. A conferência no navegador verifica seleção, busca, retorno e identificação do país no plano. A publicação deve alterar somente `docs/revisao/v015/`, preservando v014 e a página estável.
