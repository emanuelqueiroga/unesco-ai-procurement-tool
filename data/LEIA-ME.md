# Dados de referência da ferramenta

Dois arquivos alimentam os valores iniciais do simulador de custos: `referencias.json` (custos unitários e convenções) e `paises.json` (perfis de país). Ambos são embutidos em `navegador.html` na montagem (`build.sh`), então a ferramenta funciona sem rede.

## Cabeçalho de versão

Cada arquivo começa com dois campos:

- `versao`: três números (`1.0.0`). Suba o primeiro para mudança de formato, o segundo para novas linhas ou países, o terceiro para correções de valor.
- `atualizado`: data da última revisão (`AAAA-MM-DD`).

A função `versaoReferencias()` expõe essas informações (versão e data de cada arquivo, número de linhas e de países) para o relatório.

## referencias.json

Cada linha de `referencias` tem:

| Campo | Significado |
|---|---|
| `id` | Identificador estável (por exemplo `saas.preco`). O motor busca o valor por ele. |
| `item`, `unidade` | Descrição e unidade, em português. |
| `valor`, `baixo`, `alto` | Valor central e faixa de referência, com `baixo ≤ valor ≤ alto`. Se `baixo = alto`, não há faixa e nada é sinalizado. |
| `moeda`, `anoPreco` | Moeda da linha (`USD` no conjunto atual) e ano dos preços. |
| `escopo` | `global`, código de região (`LAC`, `SSA`...) ou ISO3 de um país. |
| `fonte` | `{titulo, url}`; `url` pode ser `null`. |
| `acesso` | Data em que a fonte foi consultada. |
| `grau` | A, B ou C (abaixo). |

Cadeia de recuo: país, depois região, depois linha global. Toda grandeza com linha de país ou região precisa de uma linha global (ids que começam por `pais.` são isentos). As linhas atuais são todas globais, grau C, com a fonte "Convenção da ferramenta (v13), ilustrativa": são valores didáticos, não estatísticas.

### Graus

- **A**: estatística oficial (órgão nacional ou multilateral).
- **B**: estudo publicado ou registro de contratação.
- **C**: estimativa de especialista ou convenção da ferramenta.

O grau aparece na dica de cada valor, para que quem lê saiba quanto confiar nele.

## paises.json

`regioes` lista os códigos de região e seus nomes. `paises` tem, por país: `iso3`, `nome` (português), `regiao`, `grupoRenda`, `moeda` (precisa existir em `moedas.json`) e os campos `escolas`, `estudantes`, `professores`, `pctUrbano`, `pctEscolasInternet`, `salarioProfessor` (US$ por ano), `inflacao` e `taxaDesconto` (fração por ano: 0,04 = 4%), `idiomas` (lista de códigos de idioma). `pctUrbano` e `pctEscolasInternet` vão de 0 a 100. Cada campo é `{valor, fonte, ano}` ou `null`. Campo `null` não preenche nada. Não estime: sem dado com fonte e ano, deixe `null`.

Os cinco países piloto (Brasil, México, Quênia, Marrocos, Indonésia) têm só moeda, região e grupo de renda (fonte "Banco Mundial, a verificar").

## Como adicionar um país

1. Inclua o objeto em `paises` de `paises.json`, com todos os campos (use `null` onde não houver dado).
2. Confira que `moeda` existe em `moedas.json` e que `regiao` está em `regioes`.
3. Acrescente o nome do país em `i18n/v14_pais_en.json`, `_es.json` e `_fr.json` (a chave é o nome em português).
4. Se houver custo local de referência, inclua linhas em `referencias.json` com `escopo` igual ao ISO3.
5. Atualize `atualizado` e `versao` e rode `python3 tools/checar_referencias.py`.

## Revisão anual

Uma vez por ano: reconsulte as fontes, atualize `valor`, `baixo`, `alto`, `anoPreco` e `acesso`, promova linhas de grau C a B ou A quando houver fonte, revise `paises.json` e suba `versao` e `atualizado`. Rode os testes (`tests/test_v14_referencias.js`) antes de publicar.

## Validação

`tools/checar_referencias.py` valida os dois arquivos: campos obrigatórios, pares `id`/`escopo` únicos, `baixo ≤ valor ≤ alto`, grau em A/B/C, códigos ISO e de região, moedas existentes, datas e URLs. `build.sh` o executa primeiro e para se houver erro.
