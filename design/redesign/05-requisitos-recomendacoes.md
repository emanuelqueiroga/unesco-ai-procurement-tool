# Requisitos do sistema de recomendações (síntese do painel de sete especialistas)

28 de outubro de 2026. Coordenação central do painel que avaliou as recomendações da AI in Education Procurement Tool. Pareceres de origem em `design/redesign/recomendacoes/`: econometria (ECO), políticas públicas (POL), compras públicas (GOV), tecnologia (TEC), ética e governança (ETI), pedagogia (PED) e comunicação (COM). Nada foi implementado. Para decidir, leia as seções 1, 2, 4, 5 e 10 (cerca de 20 minutos). Quem for implementar usa as seções 3, 6, 8 e 9 como especificação.

Como conferi: li os sete pareceres, `recomendacoes.js`, `framework.js`, `casos.js`, `plano/relatorio.js`, `plano/secoes.js`, `recs/casos.json`, `recs/recomendacoes_exemplos.md` e o PDF do B, e rodei o motor nos quatro exemplos com um teste vitest descartável fora do repositório. Os pontos em que um parecer estava errado estão corrigidos na seção 2.4.

---

## 1. Resumo

Os sete especialistas chegam ao mesmo diagnóstico. O motor atual é uma lista de verificação rastreável, porque cada ação cita a pergunta e a resposta, mas ainda não é um plano. Ele tem três defeitos. Ordena pela posição no código, e por isso metade das ações sai como "alta" e os 5 cartões repetem a mesma coisa. Não usa o que a própria ferramenta já calcula (perfil de risco, arquitetura presumida, custos, adoção, custo de saída). Deixa de fora as decisões que mais pesam: o salto do teste para a rede inteira, a avaliação com comparação, o que acontece depois de um alerta e como a compra vai ao mercado. A proposta, bloco a bloco:

- **Correções já**: 13 defeitos de regra, texto e PDF que não dependem de nenhuma decisão (pacote R1).
- **Modelo da regra**: cada regra ganha id estável (R-nn), pacote, variantes por risco, arquitetura e tarefa, "quem age", marco do processo, critério de pronto, número do caso e cláusula ligada.
- **Prioridade**: uma pontuação auditável e três níveis ("Condição", "Recomendada", "Para acompanhar"). Os cartões começam pelo próximo marco, com um cartão por pacote e cobertura de três lentes.
- **Recomendação principal**: passa a ser o veredito da próxima decisão ("Pode avançar", "Pode avançar com condições", "Ainda não avance"), com até 3 ações que faltam.
- **Relatório**: nenhuma página nova. "Em resumo" ganha o veredito e o nível de cuidado. "O que fazer" abre com as pendências e a sequência de decisões com portões, e a seção A1 vira "Como testar e avaliar". "O que exigir" só mostra os requisitos do caso.
- **Catálogo**: as 176 propostas dos pareceres viram 86 regras novas ou reescritas (R-01 a R-87, menos a R-06, que é mantida). Das 66 entradas atuais, 26 continuam com novo id (R-06 e R-88 a R-112) e 40 saem ou são divididas em regras novas.
- **Perguntas**: nenhuma pergunta nova no Essencial. Treze vão para o Refinar, e três viram opções novas em perguntas que já existem.
- **Motor**: quatro mudanças alteram números. A maior é a verificabilidade, que no D vai de +8,5% a +75% conforme a opção. Elas ficam para decisão sua.

---

## 2. Diagnóstico consolidado

Legenda: ✓ = conferido no código ou na saída dos exemplos.

### 2.1 (a) Defeitos a corrigir já

| # | Defeito | Regra e exemplo | Quem apontou | Conferido |
|---|---|---|---|---|
| a1 | Regra dispara fora do contexto: fala de "soluções das famílias" num caso em que só servidores usam o celular próprio | `disp-proprio` no D (cartão 3, prioridade alta) | POL, TEC, ETI, PED, COM | ✓ (não há condição sobre usuários) |
| a2 | "Uso adequado à idade" num copiloto que só professores usam | `criancas` no A | POL, ETI, PED, COM | ✓ |
| a3 | Regra de pagamento dispara para uma ferramenta que ainda não foi escolhida | `lic-institucional` no C (`tipoTec = nao_sei`) | POL, COM | ✓ (ver 2.4, item 3) |
| a4 | Texto de consumo errado para pesos abertos: "cada uso é cobrado", enquanto o custo do B está em horas de GPU e "Consumo de IA" é US$ 0 | `consumo-limites` e `consumo-monitorar` no B | TEC, COM | ✓ (PDF, linha "Consumo de IA … US$ 0 mil") |
| a5 | Supervisão "de cada saída" num tutor que produz milhares de respostas por dia (a forma indicada pela ferramenta é "por exceção") | `supervisao` no B | ETI, PED | ✓ (`formaSupervisao`: B por exceção, C caso a caso) |
| a6 | Id duplicado: o segundo `aberta-operacao` (gatilho na arquitetura) é descartado pelo id, e a causa citada depende da ordem das regras | `REGRAS_REC` (66 entradas, 65 ids) | TEC, GOV | ✓ |
| a7 | "Quem" mostra quem sabe responder à pergunta, e não quem age: o acordo de dados e a base legal vão para "Área pedagógica e professores" | `relAcoes` → `quemSabe`. B, cartões 4 e 5; C, cartão 5 | POL, GOV, ETI, PED, COM | ✓ |
| a8 | O corte no ":" (`partesAcao` + `RE_RAZAO`) gera um "O quê" sem verbo e um "Por quê" que é a própria ação | `termos` (D): O quê = "Termos de uso padrão não bastam". `teste-rever` (B): "Rever a escolha do piloto" | GOV, COM | ✓ |
| a9 | "Como" circular ("Revise a resposta X e siga o detalhe em…") e "Para quê" com 6 frases fixas: a mesma frase em 4 dos 5 cartões do B | `acComo`, `acPara*` | POL, GOV, ETI, PED, COM | ✓ |
| a10 | PDF: os rótulos dos cartões se sobrepõem ("1 OPorquê? quê?"), "→" vira "->", o texto cita "blocos A e B" que não existem, e a prioridade aparece como "Alta/Média" numa tabela e "Normal" em outra | PDF do B, p. 3, 13 e 15 | COM | ✓ |
| a11 | Resumo e corpo se contradizem. A recomendação principal da capa vem da seção A1 (`recomendarTeste`) e não das ações (no B ela corresponde ao cartão 2). A saída aparece como US$ 126.482 (camada "Saída" do custo total) e como "US$ 112,9 mil" (custo de transição), sem rótulos. "26 requisitos" soma o checklist genérico (`nReq = linhasCl + destA5`). O "Por quê" mostra códigos crus ("→ nao_sei", "→ api") | `secoes.js:491`, `secoes.js:763`, PDF do B | POL, GOV, COM | ✓ |
| a12 | Erros jurídicos de texto. `dados-base-legal` oferece "ou obter consentimento" como alternativa equivalente. `gratis-fim` manda acordar o preço futuro com o fornecedor do teste, o que é compromisso prévio. `lic-institucional` supõe que dá para "renegociar" o contrato. `ferramentas-cotacao` leva a uma cotação única do interessado. `g-compras` pede uma política institucional "antes de contratar" este caso | A, B, C, D | ETI (base legal), GOV (as demais) | ✓ (textos) |
| a13 | Arquitetura presumida sem rótulo. `__arqPresumida` só fica verdadeiro com `tipoTec` vazio ou "não sei". Por isso A (SaaS presumido) e B (pesos abertos presumidos) não são marcados como presumidos, e o alerta diz "produto pago por licença" seja qual for a arquitetura presumida. `arquitetura-decidir` manda "decidir" uma arquitetura que o custo já usa | `framework.js:366` e `:825`. A, B, C | TEC, GOV, COM | ✓ |

### 2.2 (b) Lacunas de conteúdo

| # | Lacuna | Exemplos | Quem apontou |
|---|---|---|---|
| b1 | Salto de escala quase invisível: `etapas` exige 5.000 pessoas e `expansao-rapida` exige 50.000. A vai de 20 a 800 escolas (100%), e `etapas` sai como "média" em 10º lugar. C vai de 10 a 300 escolas e D vai de uma prova de conceito para 270 escolas, e nos dois nada dispara | A, C, D | POL, ECO, COM, PED |
| b2 | Sem contrafactual: nenhuma regra pede grupo de comparação, embora o custo do B já inclua "Avaliação de impacto com comparador" (US$ 60 mil por ano). A medida não combina com o teste: no B, a avaliação anual do 9º ano para um piloto de 4 meses do 6º ao 9º ano. As metas não têm número | B (e A) | ECO, POL, PED |
| b3 | Alerta precoce sem ação: falta protocolo depois do alerta, capacidade das equipes, comparação com uma regra simples, teste com dados passados, finalidade exclusiva e estigma | C | ECO, POL, TEC, ETI, PED, COM (os sete) |
| b4 | Sem aceite técnico: nenhuma das 78 ações dos exemplos pede um conjunto de teste da rede, critérios de aceite, teste de carga, controle de versão, residência dos dados ou testes de injeção de instruções | A–D | TEC (com ECO e PED) |
| b5 | O esqueleto da compra pública não existe: justificativa da necessidade, escolha do instrumento, preço de referência, julgamento pelo custo do ciclo de vida, prova de conceito no julgamento, matriz de riscos, gestor e fiscais, níveis de serviço do sistema (`suporte-sla` olha só o suporte ao usuário, e por isso não sai em nenhum exemplo) e como contratar o próprio teste | A, B, D | GOV |
| b6 | O risco não entra nas recomendações: só `acomp-reforcar` lê `k.alto`, e ela não dispara em nenhum exemplo. B e C recebem as mesmas 7 ações de risco com o mesmo texto. Faltam avaliação de impacto sobre direitos, aviso às famílias, contestação acessível, idade mínima e relatos de risco (B) | B, C | ETI |
| b7 | Uso nas escolas ausente: formação de 1,5 a 3 h aceita como plano, sem tempo na jornada, sem referência na escola nem papel da direção, sem dose por estudante (no B, 3 estudantes por dispositivo para um tutor individual), sem definição de uso de fato (o motor supõe 35% a 50% de adoção) e sem rotina do professor com os relatórios | A, B | PED (com POL e ECO) |
| b8 | Números calculados e não usados: dotação por exercício, parcela recorrente (75% no B), custo de saída, P50 e P90, direcionador principal, adoção de equilíbrio da licença (60% no A) e custo em regime por usuário ativo | A–D | ECO, GOV, POL, COM |
| b9 | Situação do caso ignorada: "proposta recebida" (A), "orçamento" (D) e "renovar" não disparam nada | A, D | GOV, POL |
| b10 | Equidade, participação, sustentabilidade entre mandatos e prestação de contas existem em `RECS` sem gatilho (`s-equidade`, `p-idiomas`, `r-parada`, `s-continuidade`, `g-avaliacao`, `i-finalidade`, `i-incidente`) | B, C | POL, ETI |

### 2.3 (c) Defeitos de desenho

| # | Defeito | Quem apontou |
|---|---|---|
| c1 | A ordem é prioridade fixa → momento → posição no array, com as ações de governança inseridas primeiro. B tem 12 de 25 ações "altas" e C tem 12 de 23. No C, 3 dos 5 cartões dizem "faça a prova de conceito". No B, 4 dos 5 tratam de dados (contando a formação em dados) | todos |
| c2 | Os cartões são os 5 primeiros da lista (`slice(0, 5)`), sem regra de diversidade | POL, TEC, ETI, COM |
| c3 | Dois sistemas paralelos que não se falam: `framework.js` (perfil, alertas, forma de supervisão, critérios dos pontos de decisão, contestação, métricas) e `recomendacoes.js` | ETI, TEC |
| c4 | Três momentos genéricos. "Antes de contratar" chega tarde: depois do edital, as cláusulas já não podem entrar. Nenhum momento marca a decisão depois do teste | GOV, COM |
| c5 | Não há critério de pronto nem ligação entre a ação e a cláusula. A tabela A5 do B tem a coluna "Neste caso" quase vazia | GOV, COM, TEC |
| c6 | Mais de 150 comandos no plano do B, sem separar as recomendações do caso do checklist do guia. Os pontos de decisão saem impressos na ordem 5, 6, 7, 1, 2, 3, 4, 8, 9 (✓) | COM, POL |
| c7 | A síntese do capítulo 4 diz "O plano está completo" e "Já apareceram 25 recomendações". Não mostra o próximo passo nem as pendências | COM, POL |

### 2.4 Correções do coordenador a afirmações dos pareceres

1. **ETI, item 5 do desenho:** o parecer diz que "C cai no modelo do produto pronto, com 0,1 pessoa de privacidade e nenhuma linha de revisão". Está errado. `governancaPorRisco` (`casos.js:274`) roda para todo caso. No C (elevado) entram K5.2 com 0,15 → 0,3 pessoa, K5.3 "Monitoramento e revisão de saídas" com 0,5 → 1,0 pessoa, K5.5 de US$ 60 mil nos Anos 1 e 2 e K5.4 de US$ 45 mil por ano a partir do Ano 1. O que falta de fato: (i) o teste local (K3.4, US$ 12 mil) só existe no ramo de risco **limitado**, e por isso A (moderado), B e C não o têm. (ii) K5.4 começa no Ano 1, depois do piloto com crianças. (iii) K5.3 não depende do volume de alertas a revisar.
2. **ECO, números do C:** o motor dá para o C um custo total central de **US$ 1,64 mi**, com P10/P50/P90 de 1,63/1,73/1,85 (P50 +5,3%). O parecer diz 1,26 mi. A, B e D conferem: A 4,75 mi com P50 5,14 (+8,2%), B 1,77 com P50 1,80 (+1,5%), D 0,57 com P50 0,59 (+4,0%). Os números derivados que o ECO dá para o C (regime de US$ 337,8 mil, US$ 12,07 por estudante, US$ 1.206 por abandono evitado) precisam ser recalculados antes de virar teste.
3. **POL-11 e COM-15 (C):** no C o pagamento **foi respondido** ("institucional"). O problema é que ele se refere a uma ferramenta de tipo "não sei". Regra adotada: as regras de pagamento e de licença ficam suspensas e vão para as pendências enquanto `tipoTec = nao_sei`.
4. **PED-06 (D):** o plano do D mostra **2 h** de formação ("estimativa"), e não 1,5 h. O caso tem 1,5 h digitadas, mas `formacaoEstimativa` está ligada. O teste deve usar o valor que o plano exibe.
5. **GOV, item 9:** a duplicata `aberta-operacao` some pela comparação de **id**, que vem antes da de texto. O efeito é o mesmo.
6. **COM, D10 × ECO:** US$ 12,77 (média do ciclo por usuário ativo) e US$ 8,94 (custo em regime por usuário ativo, Ano 2) são indicadores diferentes e os dois estão certos. A confusão de rótulo do US$ 12,77 já está registrada em `04-requisitos-0015.md`.
7. **TEC-06 (verificabilidade):** medi o efeito. Com "parcial" para api e pesos abertos, o D passa de limitado a **moderado** e o custo total vai de US$ 570,1 mil para US$ 618,4 mil (+8,5%). Com "não" para os termos de uso padrão, que é o que o TEC propõe para o D, o D passa a **elevado** e o custo vai a US$ 997,6 mil (+75%). A, B e C não mudam. Isso conflita com o ETI, que quer o D proporcional ("cuidado limitado"). Decisão 2.

Uma dúvida de dados que não trava o trabalho: o B marca "Decidir quais estudantes recebem apoio primeiro" (`apoio_est`) para um tutor, o que dispara supervisão e contestação de decisão (ETI, conflito 4). Confirme se é intencional. Se não for, a correção é no exemplo, e não nas regras.

---

## 3. Novo modelo de recomendação

### 3.1 Formato de uma regra

```js
{
  id: 'R-26',                 // estável; nunca reaproveitado; citado em página, PDF e exportação
  versao: 1,
  pacote: 'DADOS',            // um dos 11 pacotes (3.3); define a lente
  tipo: 'politica',           // 'custo' | 'politica' | 'uso': mantém a separação O que fazer × O que exigir
  substitui: ['dados-acordo', 'dados-base-legal', 'dados-impacto', 'formacao-dados'],
  se: k => k.dadosEst,        // gatilho sobre recContexto ampliado (3.2)
  variantes: [                // a primeira cujo `quando(k)` é verdadeiro; a última sem `quando` é o padrão
    { quando: k => k.poc, oque: '…', porque: '…', como: ['…', '…'] },
    { oque: 'Concluir o pacote de proteção de dados dos estudantes antes do teste: base legal, acordo de tratamento que proíba treinar modelos, avaliação de impacto e prazos de guarda.',
      porque: 'Sem essas peças o teste não tem base legal e a rede perde o controle do destino dos dados de {nEst} estudantes, em sua maioria menores de idade.',
      como: ['Parecer do encarregado de dados: finalidade, base legal, dados mínimos, melhor interesse.', 'Acordo de tratamento anexo ao instrumento do teste.', 'Relatório de impacto aprovado.'] },
  ],
  paraque: 'O teste começa com base legal e com o destino dos dados sob controle da rede.',
  quem: ['protecao_dados', 'juridico'],   // códigos da tabela de áreas (3.4); nunca quemSabe
  marco: 'M1',                // M1..M5 (3.5); pode ser função de k
  pd: 3,                      // ponto de decisão do guia (1..9), para ligar à sequência de decisões
  condicao: k => true,        // verdadeiro = "Condição" para o marco; senão Recomendada (M1–M4) ou Para acompanhar (M5)
  pronto: 'Parecer, acordo assinado e relatório de impacto juntados ao processo.',
  depende: [],                // ids que precisam vir antes (pontuação e desempate)
  numero: (k, d) => ({ rotulo: 'Estudantes no teste', valor: k.c.piloto.participantes, fonte: '2.3.8', ilustrativo: false }),
  exige: ['DADOS_REQ.treino', 'DADOS_REQ.retencao', 'CONTRATO.subcontratados'],  // ids de CONTRATO e DADOS_REQ
  indicador: null,            // id do indicador de "Em resumo" que acompanha a ação
  base: ['guia.pd3'],         // ids de referências comuns
  exemplosNorma: { BR: ['LGPD arts. 7º, III, 14 e 23; Enunciado CD/ANPD 1/2023'], UE: ['RGPD art. 6(1)(e), art. 8, art. 35'] },
  origem: k => ({ campo: k.campoDados, vals: k.valsDados }),  // pergunta → resposta, como hoje (vai ao campo Origem)
  provisoria: k => false,     // verdadeiro quando o gatilho se apoia em valor sugerido ou presumido
  generica: false,            // true = "base comum": fora dos cartões e da contagem
}
```

Regras do formato, cobradas por um lint (REC-14):

- `oque` começa com verbo no infinitivo, tem até 25 palavras, não traz citação e não usa ":" para separar diagnóstico e ação.
- `porque` dá a razão e diz o risco de não fazer, com até 30 palavras. Leva um número do caso quando `numero` existe.
- `como` tem de 2 a 4 passos próprios da regra.
- `pronto` nunca fica vazio.
- Toda regra de `tipo: 'custo'` ou de contrato tem `exige`.
- Marcadores `{…}` são preenchidos por `numero`. Sem números (caso em branco), o texto diz "a calcular" e a ação perde 1 ponto.

### 3.2 Contexto ampliado (`recContexto`)

O contexto ganha estes campos: `nivel` (`perfil.agregado`), `determinantes`, `forma` (`formaSupervisao`), `alertas` (`alertas()`), `arqEf` (arquitetura escolhida ou presumida), `arqPresumida` (verdadeiro sempre que a 3.2.1 = "não sei"), `classes` (`ce.classes`), `escRede` (soma de `ctx.etapas[*].escolas`), `proxMarco` (3.5), `pend` (lista de pendências) e `d` (o mesmo seletor de `numerosCusto` que alimenta o plano: custo total, P10/P50/P90, dotação, custo em risco, saída, tornado, adoção, `compLicenca.aEq`, indicadores, `avaliabilidade()` e `limiar()`).

### 3.3 Regras de geração

1. **Arquitetura efetiva e "não sei".** As regras técnicas são avaliadas sobre `arqEf` e `classes`, e não sobre a resposta literal da 3.2.1. Uma arquitetura presumida dispara as regras dela com a etiqueta "(presumida: confirme na 3.2.1)", e as cláusulas que dependem dela saem como provisórias. O "não sei" deve gerar recomendações mais específicas, e não menos (TEC, GOV, COM).
2. **Coerência antes de tudo.** Combinações contraditórias (`tipoTec` aberta com pagamento por consumo, celular próprio com usuários que são só servidores) geram primeiro uma regra de esclarecimento e suspendem as regras que dependem da leitura ambígua (TEC).
3. **Perfil de risco como entrada.** Texto, prioridade e marco variam com `nivel` e `classes`. Exemplos: `criancas` vira R-34 (B), R-28 + R-37 (A) ou R-42 (C), e a supervisão segue `forma` (ETI, PED). A falta de resposta nunca baixa o nível de risco (ETI).
4. **Caso incompleto e pendências separadas.** As respostas "não sei", as sugeridas não confirmadas e as premissas que mudam custo ou cláusula vão para o bloco "Antes de decidir, responda", e não para a lista de ações. Cada uma mostra o efeito no custo quando o motor tem esse dado (por exemplo, o custo total em saas, api e pesos abertos). Há três tratamentos:
   - Regra que depende de uma pendência na mesma cadeia: fica suspensa (pagamento com `tipoTec` "não sei").
   - Regra que depende de uma premissa que o custo já usa (arquitetura presumida): aparece marcada como provisória.
   - Regra que depende de valor sugerido: só entra nos cartões se for "Condição", e sempre com "(a confirmar na pergunta n)".

   O caso em branco mostra "Ainda sem recomendações" e as 3 perguntas que mais liberam ações (2.0, 2.1.1 e 2.3.5).
5. **Fusão em pacotes.** Regras do mesmo pacote e do mesmo marco viram **um cartão**. O texto do cartão vem da regra de maior pontuação, e as demais entram como passos, cada uma com o seu R-nn e a sua origem. No "O que fazer", o nível de cima tem no máximo 12 itens (os 11 pacotes mais as pendências). Os 11 pacotes:

| Pacote | Lente | Conteúdo |
|---|---|---|
| PROB | Decisão e evidência | problema, meta, alternativa, proposta recebida |
| TESTE | Decisão e evidência | desenho do teste, aceite técnico, linha de base, comparação, uso de fato, custo-efetividade |
| ESCALA | Decisão e evidência | salto de escala, critérios de avanço, ondas, expansão |
| GOV | Decisão e evidência | equipe, governança 1.3, continuidade, prestação de contas, renovação |
| DADOS | Pessoas e uso | base legal, acordo, residência, dados digitados, dispositivos |
| PESSOAS | Pessoas e uso | supervisão, contestação, equidade, crianças, alerta, finalidade, direitos |
| USO | Pessoas e uso | formação, jornada, referência na escola, dose, conexão, curadoria |
| COMPRA | Custo e contrato | instrumento, teste, gratuidade, preço, julgamento |
| CONTRATO | Custo e contrato | serviço, versão, saída, propriedade, consumo, fiscalização |
| ORC | Custo e contrato | P50, dotação, premissa principal |
| TEC | Custo e contrato | arquitetura, operação, carga, segurança, integração, monitoramento |

6. **Separação custo × política.** A etiqueta `tipo` continua (custo, política e o novo uso), e a separação entre as páginas "O que fazer" e "O que exigir" também. A capa e a sequência de decisões são únicas (resolve o conflito 2 do POL).

### 3.4 "Quem age": vocabulário único e neutro quanto ao país

| Código | Rótulo |
|---|---|
| `gabinete` | Gabinete (dirigente da rede) |
| `pedagogica` | Área pedagógica e currículo |
| `escolas` | Gestão escolar (direção e coordenação) |
| `formacao` | Formação de professores |
| `inclusao` | Educação especial e inclusão |
| `avaliacao` | Avaliação e dados |
| `tecnologia` | Tecnologia e segurança da informação |
| `protecao_dados` | Proteção de dados (encarregado) |
| `juridico` | Assessoria jurídica |
| `compras` | Compras e contratação |
| `orcamento` | Planejamento e orçamento |
| `pessoas` | Gestão de pessoas |
| `fiscal` | Gestor e fiscais do contrato |
| `controle` | Controle interno e ouvidoria |
| `comunicacao` | Comunicação |

A tabela deve ser revista por uma pessoa da gestão pública (COM-05).

### 3.5 Marcos do processo (substituem os três momentos)

| Marco | Nome | Corresponde hoje a | Pontos de decisão do guia |
|---|---|---|---|
| M1 | Autorizar o teste | antes do teste | 1–4 |
| M2 | Decidir depois do teste (prova de conceito → piloto; piloto → implantação) | não existe | 4 |
| M3 | Levar ao mercado (termo de referência ou edital) | parte de "antes de contratar" | 5–7 |
| M4 | Assinar a implantação | parte de "antes de contratar" | 7 |
| M5 | Acompanhar, ampliar e renovar | para manter e ampliar | 8–9 |

`proxMarco` é o primeiro marco com Condições abertas. Sem nenhuma aberta, segue a situação do caso (1.1.3): "nova" ou "proposta" → M1, "orçamento" → M1 ou M3, "renovar" → M5.

---

## 4. Priorização e seleção

### 4.1 Pontuação

Cada ação recebe uma pontuação de 0 a 14, registrada na própria ação (`pontos`, `criterio`) para auditoria. Base: COM M2, com os critérios do ECO, POL, GOV, TEC, ETI e PED.

| Critério | Pontos | Como calcular |
|---|---|---|
| Bloqueio | 0 ou 4 | `condicao(k)` verdadeira |
| Pessoas e direitos | 0–3 | 3: risco elevado ou crítico e a regra é dos pacotes PESSOAS ou DADOS, ou toca crianças usuárias. 2: risco moderado ou crianças afetadas. 1: dados de adultos. +1 (até o teto) quando o impacto marcado é desigualdade ou inclusão e a regra trata grupos |
| Dinheiro em jogo | 0–3 | Fração do custo total ligada por `numero`: ≥ 10% → 3; 5–10% → 2; 1–5% → 1 |
| Urgência e irreversibilidade | 0–2 | 2: só pode ser feita antes do marco (sortear, medir a linha de base, cláusula antes do edital). 1: antes de M4 |
| Dependência | 0–2 | +1 por regra que esta destrava (`depende` das outras) |
| Especificidade | −1 | Regras genéricas (`generica: true`) |

O desempate segue o marco mais próximo e depois a ordem dos pacotes (PROB → TESTE → ESCALA → DADOS → PESSOAS → USO → COMPRA → CONTRATO → ORC → TEC → GOV). Nunca a posição no array: embaralhar `REGRAS_REC` não pode mudar a saída (GOV-08).

### 4.2 Níveis de prioridade

Os pareceres usavam cinco vocabulários: alta/média (hoje), "Bloqueia" (GOV e POL), "Condição para avançar" (ETI), "Condição/Recomendada/Acompanhar" (COM) e "Condição para contratar" (POL, que mistura nível com momento). Adoto um só, com o momento separado no campo `marco`:

| Nível | Quando | Rótulo na página |
|---|---|---|
| **Condição** | `condicao(k)` verdadeira: vem do "Se não" dos pontos de decisão, dos alertas de bloqueio do guia ou das condições de risco | "Condição para {marco}" |
| **Recomendada** | o resto, com marco de M1 a M4 | "Recomendada antes de {marco}" |
| **Para acompanhar** | marco M5 | "Para acompanhar" |

A palavra "bloqueio" sai do texto visível, como pede o ETI. "Alta", "Média" e "Normal" desaparecem de todas as tabelas.

### 4.3 Os 5 cartões de "Comece por estas"

Esta regra resolve num só desenho as cotas pedidas pelos pareceres: POL (1 por pacote), ETI (≥ 2 de pessoas com risco alto), PED (≥ 1 de uso), GOV (≥ 1 de compra), ECO (o plano de avaliação quando há piloto) e COM (1 por pacote e 1 por pergunta).

1. **Candidatos:** cartões-pacote (3.3, item 5). Cada pacote dá um cartão. PESSOAS pode dar **dois** quando o risco é elevado ou crítico.
2. **Primeiro, as Condições do próximo marco**, por pontuação, até 5.
3. **Se sobrar vaga**, garantir um cartão de cada lente que ainda não aparece e que tenha candidato Condição ou Recomendada até M3. As lentes são: Decisão e evidência, Pessoas e uso, Custo e contrato.
4. **Completar pela pontuação.** Em caso de empate, no máximo 1 cartão por pergunta de origem.
5. **Mais de 5 Condições no próximo marco:** os 5 cartões são as 5 de maior pontuação, e um aviso diz "Faltam {n} condições para {marco}" com a lista. O veredito passa a "Ainda não avance" ou "com condições" (4.4).

O ECO pedia o plano de avaliação como cartão quando há piloto. Isso fica atendido porque a avaliação está dentro do pacote TESTE. O PED pedia uso nas escolas. Isso fica atendido pela lente "Pessoas e uso" e pelo contador "Condições de uso nas escolas" em "Em resumo" (seção 5).

### 4.4 Recomendação principal = veredito da próxima decisão

O formato tem três partes: "Próxima decisão: {marco e objeto}. {Veredito}. Faltam: {até 3 ações, que são os cartões 1–3}." Exemplo do B: "Próxima decisão: autorizar o teste. Ainda não avance para o piloto: comece por uma prova de conceito do desenvolvimento sob medida. Faltam o pacote de dados, as regras para crianças usuárias e a separação entre o teste e a ida a 50.000 estudantes."

| Veredito | Quando (proposta; a decisão é sua, decisão 1) |
|---|---|
| Pode avançar | Nenhuma Condição aberta no próximo marco |
| Pode avançar com condições | Há de 1 a 5 Condições abertas que podem ser cumpridas antes do marco |
| Ainda não avance | Só nos gatilhos do POL e do ETI: (i) o problema está vazio ou descrito pela tecnologia (R-05); (ii) a pessoa escolheu um piloto quando a ferramenta indica prova de conceito antes (B); (iii) uma saída afeta pessoas e não há caminho de contestação (pergunta nova, R-32); (iv) mais de 5 Condições no próximo marco. Sempre com o que falta e o caminho |

A mesma frase aparece na capa, em "Em resumo", no PDF e na síntese do capítulo 4 (COM-03).

### 4.5 Portões entre as etapas

Os portões são a espinha da seção "Sequência de decisões" (5.3). Cada portão tem de 3 a 5 critérios, e cada critério tem um valor do caso (ou "a definir pela rede") e um estado: pronto, falta, premissa ou "impossível de medir com o desenho atual".

| Portão | Critérios mínimos (vêm das regras) |
|---|---|
| G1 Autorizar o teste (M1) | problema e meta com número (R-01); conjunto de teste e critérios de aceite (R-08); linha de base e comparação (R-11, R-13); dados e pessoas (R-26 e as Condições de PESSOAS); condições de uso nas escolas, quando professores ou estudantes usam (R-45 a R-48: tempo na jornada, referência na escola, dose ou rotina, medida de uso de fato) |
| G2 Prova de conceito → piloto (M2) | aceite técnico cumprido (R-08, com limiares); falhas graves = 0 nos testes com crianças; custo por sessão ≤ premissa; decisão em ata |
| G3 Piloto → implantação (M2) | adoção ≥ meta (R-15); efeito ≥ limiar, com margem (R-13, R-17); custo por usuário ativo em regime ≤ teto; nenhum grupo pior (R-33); suporte dentro do nível de serviço |
| G-mercado Pronto para ir ao mercado (M3) | pontos de decisão 5–7: necessidade e alternativa (R-03), estratégia (R-55), preço de referência (R-58), dotação (R-73), requisitos com valor e verificação (REC-49), dados no contrato (R-26) |
| G4 Implantação → expansão (M5) | critérios numéricos da 1ª etapa (R-21); resultado lido antes da decisão (R-22); risco reavaliado (R-25) |

### 4.6 Cartões esperados nos exemplos (teste de aceitação, conjunto sem ordem)

| Ex. | Próxima decisão e veredito | 5 cartões esperados | Fica no "O que fazer" com destaque |
|---|---|---|---|
| A | Autorizar o piloto em 20 escolas. Com condições | R-20 (separar o piloto da ida a 800 escolas, 100% da rede); TESTE (R-08 rubrica dos materiais + R-16 tempo de preparação + R-11 linha de base); R-04 (proposta recebida); R-56 (contratar o piloto sem direito de continuar); USO R-45 (formação em ciclos) ou DADOS R-28 | R-61 (adoção prevista de 35–50% contra 60% de equilíbrio), R-72 (P50 de US$ 5,14 mi), R-75 (SaaS presumido) |
| B | Autorizar o teste. Ainda não avance para o piloto | TESTE (R-07 prova de conceito antes + R-08 aceite do tutor + R-13 comparação); R-26 (dados); R-34 (crianças usuárias, filtros e relatos); R-20 (aprovar só o teste; os 50.000 estudantes do Ano 1 ficam para depois do relatório); PESSOAS-2: R-31 (supervisão por exceção) ou R-33 (equidade) | Aviso "Faltam 7 condições para autorizar o teste"; R-76 (GPU × consumo), R-48 (dose), R-73 (75% recorrente) |
| C | Autorizar a prova de conceito. Com condições (ou "Ainda não", se passar de 5 Condições) | TESTE (R-19 dados de anos anteriores + regra simples + consulta ao mercado); R-41 (protocolo e capacidade); R-42 (finalidade e sem rótulo); R-26 (dados); R-20 (10 → 300 escolas) | R-31 (revisão caso a caso com horas), R-32, R-43, R-44; nenhuma regra de licença enquanto `tipoTec` for "não sei" |
| D | Autorizar a prova de conceito gratuita. Com condições | R-57 (instrumento público, sem preferência; custos adiados); R-08 (aceite: a resposta cita a norma vigente); R-20 (piloto com servidores antes de 270 escolas); R-54 (curadoria da base de normas); R-65 (contrato acima dos termos de uso; versão) | R-29 (celular dos servidores); nenhuma ação sobre estudantes, sala ou famílias (PED-15) |

---

## 5. O que muda no relatório e no fim do percurso

Princípio: nenhuma página nova. As seis seções propostas pelos pareceres viram três blocos dentro de páginas que já existem, mais um contador.

| Proposta (parecer) | Onde fica |
|---|---|
| Avaliação e custo-efetividade (ECO) + ficha de aceite (TEC) + quem pode ficar para trás (POL) | A seção A1 de "O que fazer" vira **"Como testar e avaliar"** |
| Sequência de decisões (POL) + portões (ECO) + pronto para ir ao mercado (GOV) + condições de uso nas escolas (PED, como critérios de G1) | **"Sequência de decisões"**, na abertura de "O que fazer", no lugar da lista solta dos pontos de decisão |
| Nível de cuidado (ETI) | 3 frases em "Em resumo" |
| Página da reunião (COM) | O próprio "Em resumo" passa a caber em 1 a 2 páginas e a funcionar como essa peça |
| Decisões técnicas pendentes (TEC) + pendências (COM) + premissas (ETI) | Bloco **"Antes de decidir, responda"** |
| Página "Para as escolas do teste" (PED), anexo para o termo de referência (GOV), exportação em planilha (COM) | P3, fora desta versão (decisão 10) |

### 5.1 Em resumo (página e PDF)

- **Recomendação principal:** o veredito da seção 4.4, igual em todos os lugares.
- **Nível de cuidado deste caso**, em 3 frases: o que pode dar errado e para quem; por que isso não impede o projeto; quais condições precisam estar prontas e quando. O D diz "cuidado limitado: as regras gerais bastam" (ETI-13).
- **Números:**
  - Custo total central com a faixa P10–P90 e, conforme a decisão 3, o P50 rotulado "valor para orçar".
  - Custo e dotação do Ano 0.
  - Indicadores rotulados pela pergunta que respondem: média do ciclo por pessoa com acesso; custo em regime por usuário ativo; custo do teste por participante; custo por estudante beneficiário quando quem usa não é quem recebe o efeito (C).
  - Sai "sem passar de US$ 4,97", que usa a estimativa central como teto (ECO-10).
- **5 cartões:** O quê, Por quê (razão), Para quê, Como (passos), Quem age, Marco. Mais duas linhas novas: "O que está em jogo" (número) e "Pronto quando". A origem fica numa linha pequena.
- **Indicadores próprios da tarefa** (pelo menos 3: PED-11), a meta numérica e o limiar (ECO).
- **Contadores:** "Governança: x de 6" (já existe) e "Condições de uso nas escolas: x de 4" quando professores ou estudantes usam. Mais "Faltam n respostas" com link.

### 5.2 Quanto custa

- P50 e P90 rotulados ("valor para orçar", "teto prudente"). O central passa a se chamar "cenário-base", conforme a decisão 3.
- Aviso quando os itens "sem faixa" passam de 25% do custo total (B: plataforma de US$ 180 mil e avaliação de US$ 60 mil por ano).
- Uma frase explica por que o cenário de estresse pode passar do P90.
- Custo de saída com um só valor ou com dois rótulos ("camada de saída do custo total" × "custo de transição").
- Com arquitetura presumida, o custo total nas três arquiteturas (TEC-03).

### 5.3 O que fazer

A página tem cinco blocos, nesta ordem:

1. **Antes de decidir, responda:** as pendências, com o efeito no custo quando o motor tiver esse dado.
2. **Sequência de decisões:** linha do tempo M1–M5 com os portões da seção 4.5. Cada portão mostra a decisão, quem assina, os critérios com estado e a data prevista. Os pontos de decisão do guia passam à ordem 1–9 e citam os R-nn em vez de repetir o texto. No PDF, meia página logo depois de "Em resumo".
3. **Como testar e avaliar** (A1 ampliada, 1 página):
   - modalidade e motivo;
   - ficha de aceite pela classe da tarefa (métricas, limiares ilustrativos editáveis, carga, segurança, versão testada);
   - desenho de avaliação: medida e datas, comparação, tamanho mínimo de efeito detectável com as premissas, efeito por grupo;
   - "Quem pode ficar para trás": conexão, dispositivos, deficiência, línguas, adoção prevista e perfil do piloto × perfil da rede, com "não informado" quando faltar resposta;
   - limiar "vale o que custa";
   - custo da avaliação, que já está no custo total.
4. **Plano de ação:** até 12 pacotes em sanfona, por marco. No PDF, uma tabela com Nº (R-nn), Ação, Quem, Marco, Pronto quando e Origem.
5. **Listas de referência do guia** (capacidade mínima, "antes de levar à rede", "para manter"), com o rótulo "Lista de verificação do guia (referência)", citando os R-nn sem repetir o texto (COM-19).

### 5.4 O que exigir

- Só as linhas acionadas pelo caso, com as colunas "Por que neste caso", "Valor" (parâmetro do motor), "Como verificar", "Onde entra" (estudo da necessidade, termo de referência, edital, contrato, fiscalização) e "Vem de R-nn".
- As cláusulas-padrão ficam num bloco recolhido e não entram na contagem do resumo (GOV-07).
- Os critérios de aceite da ficha entram como cláusulas: o pagamento da etapa seguinte depende de cumpri-los.
- O bloco "Pronto para ir ao mercado?" é o portão G-mercado da sequência, citado e não repetido.

### 5.5 Apêndice e PDF

- **Apêndice:** "premissas da ferramenta" com rótulo (contestação presumida "formal", treino "não sei", vulneráveis "não", verificabilidade), "Exemplos de norma" por país (decisão 5) e referências.
- **PDF:** correções da seção 2.1, a10 e a11; ids estáveis iguais aos da página; rodapé com título do caso, data, versão e página; nada de códigos internos.
- **Celular:** a 360 px os rótulos dos cartões ficam acima do conteúdo, e a lista vira itens em vez de tabela (COM-22).

### 5.6 Síntese do capítulo 4: "Seu próximo passo"

O bloco "O plano está completo · Já apareceram N recomendações" é substituído por:

1. o veredito e o porquê numa linha;
2. as 3 primeiras ações, com quem age e o marco;
3. o custo e a dotação do Ano 0;
4. o nível de cuidado, numa frase;
5. "Faltam n respostas para fechar o plano", com link;
6. o botão "Baixar o plano (PDF)".

Opcional (P3): uma linha "o que mudaria o veredito ou o nível", por exemplo "se a primeira etapa for de 60 escolas, a condição R-20 sai".

---

## 6. Catálogo consolidado de recomendações

Legenda. Prioridade padrão: **C** = Condição, **R** = Recomendada, **A** = Para acompanhar. Quem age: códigos da seção 3.4. Gatilhos: `k.*` de `recContexto`, campos de `CAMPOS` e `QUESTOES_G`; "PN" marca uma pergunta nova (seção 7). Referências: abreviadas, com a lista completa na seção 11. A coluna "Origem / substitui" traz o id de origem nos pareceres e, em negrito, a regra atual que sai.

### 6.1 Regras novas ou reescritas

**PROB: problema, meta e alternativa**

| R | Gatilho | Ação | Razão | Quem | Marco | Prior. | Número | Ref. | Origem / substitui |
|---|---|---|---|---|---|---|---|---|---|
| R-01 | `resultado` sem dígito ou `k.metasLacuna` | Escrever a meta com número, prazo, população e o efeito mínimo que justifica o custo | Sem número não há critério de sucesso nem como calcular o tamanho do teste (nenhum dos exemplos A–D tem número) | pedagogica, avaliacao | M1 | C com piloto e impacto educacional; senão R | linha de base; limiar (R-17) | Kraft 2020 | ECO eco-meta-numero; **metas-lacunas** |
| R-02 | tarefa marcada e impacto em tempo docente, aprendizagem ou permanência | Escrever a cadeia do caso (problema → o que a ferramenta faz → o que muda na prática → resultado), com um indicador por elo | Sem a cadeia, o teste mede só o uso | pedagogica, avaliacao | M1 | R | — | Funnell e Rogers 2011; guia PD1 | POL pol-cadeia-resultado |
| R-03 | `alternativa` ∈ {não, não sei}, ou situação nova, proposta ou orçamento | Documentar no processo a necessidade, as alternativas comparadas (incluindo uma sem IA) e o motivo da escolha, antes do teste | Se a alternativa simples resolver, o teste e a compra não são necessários; é o primeiro ponto que o controle examina | pedagogica, orcamento | M1 | C se `alternativa` = não | custo do Ano 0 | guia PD2; OCDE 2015 | GOV cp-necessidade, COM alternativa, ECO; **alternativa** |
| R-04 | `situacao` = proposta | Tratar a proposta recebida como uma entre várias: fechar o problema e a meta antes de abri-la, consultar o mercado e especificar por desempenho | Uma proposta que vira especificação dirige a compra e reduz a competição | compras, juridico | M1 | C | — | guia PD2/PD6; ex. BR art. 21; UE art. 42 | POL pol-proposta-problema, GOV cp-proposta-recebida |
| R-05 | alerta "a descrição menciona tecnologia" ou 1.2.4 vazio | Reescrever o problema sem citar a tecnologia | Sem a palavra "IA", a proposta deixa de explicar o problema | pedagogica | M1 | C (veredito "Ainda não") | — | guia PD1 | POL-15 |
| R-06 | `sp.semFerramenta` | (texto atual) Resolver com regras e processos os problemas que não dependem de IA | — | pedagogica | M1 | R | — | — | mantém **sem-ferramenta** com campos novos |

**TESTE: teste e avaliação**

| R | Gatilho | Ação | Razão | Quem | Marco | Prior. | Número | Ref. | Origem / substitui |
|---|---|---|---|---|---|---|---|---|---|
| R-07 | `rec.modo` ∈ {poc, ambos} e o teste escolhido difere (piloto, recomendar) | Fazer a prova de conceito antes do piloto, sem estudantes e com critérios fixados antes. O piloto é outra decisão. Variante para tipo de tecnologia "não sei": consulta ao mercado como passo | {motivo de `MOTIVOS_TESTE`} (B: desenvolvimento sob medida); começar pelo piloto expõe {participantes} pessoas a algo não testado | gabinete, tecnologia, pedagogica | M1 | C | participantes; custo do Ano 0 | guia cap. 14 | COM teste-poc-antes e teste-unico, POL, ETI-R01; **teste-recomendado, teste-rever, teste-ambos, tecnologia, teste-piloto-possivel** (variante) |
| R-08 | há teste (`k.teste`) | Montar um conjunto de casos reais da rede e fixar os critérios de aceite antes do teste. Variantes por classe: geração (rubrica, revisão às cegas, A), tutoria (banco de itens, não entregar a resposta, tentativas de contornar os limites, B), dúvidas ou API (pedidos históricos, cita a norma vigente, encaminha o que não sabe, D) | Demonstrações do fornecedor não mostram o desempenho no currículo e na língua da rede; sem critério fixado antes, o resultado é lido a favor de continuar | tecnologia, pedagogica | M1 | C | K3.4 | NIST AI RMF; UNESCO 2023b; Bastani et al. 2025 | TEC tec-conjunto-teste e tec-aceite-geracao/tutoria/rag, ECO eco-portao-poc, PED-R09/R26, POL pol-curriculo, ETI-R16 |
| R-09 | há teste | Fixar antes os critérios para parar e o plano de encerramento (o que acontece com usuários e dados) | Sem critério de parada, o teste vira implantação por inércia | gabinete, pedagogica | M1 | C se risco elevado ou decisão sobre pessoas; senão R | — | guia cap. 14, PD4 | POL pol-parada (ativa `r-parada`) |
| R-10 | há piloto | Marcar o teste no calendário escolar: começar no início de um bimestre, evitar semanas de avaliação externa | Um piloto que coincide com provas mede o calendário, e não a ferramenta | pedagogica | M1 | R | `piloto.meses` | sem referência específica | PED-R21 |
| R-11 | `linhaBase` ∈ {não, parcial} ou medida não registrada | Variante "não": medir o problema antes do teste. Variante "parcial": completar nas escolas do teste **e nas de comparação**. Variante "sem medida": registrar instrumento, ano e turmas | Sem linha de base não há como saber se a IA ajudou | avaliacao | M1 | C se "não"; senão R | — | Glennerster e Takavarasha 2013 | ECO diag. 2; **linha-base, linha-base-parcial, linha-base-medida** |
| R-12 | `linhaBase` ∈ {sim, parcial} e (`piloto.meses` < 12 ou a medida não cobre as séries) | Medir com a mesma prova curta no início e no fim do teste, nas escolas do teste e nas de comparação, cobrindo as séries atendidas | B: a avaliação anual do 9º ano chega depois da decisão de um piloto de 4 meses do 6º ao 9º ano | avaliacao | M1 | C com impacto de aprendizagem | `piloto.meses` | Glennerster e Takavarasha 2013 | ECO eco-medida-calendario, PED-R17 |
| R-13 | piloto e impacto em aprendizagem, permanência ou tempo docente | Definir as escolas de comparação (sorteadas ou pareadas, conforme a decisão 4) e o tamanho do teste; se o tamanho mínimo de efeito detectável passar de 0,20 DP, declarar que o piloto mede viabilidade. Variante para dúvidas: sortear as solicitações | B: 20 + 20 escolas detectam só ≈ 0,23 DP, e efeitos típicos ficam perto de 0,10 DP | avaliacao, pedagogica | M1 | C | `avaliabilidade()` | Bloom 1995; Kraft 2020; Glennerster e Takavarasha 2013 | ECO eco-comparacao, eco-tamanho e eco-sorteio-solicitacoes, POL pol-desenho-avaliacao, PED-R17 |
| R-14 | há piloto | Escolher as escolas do piloto para representar a rede (pior resultado, rural, pouca conexão) e publicar o perfil do piloto × o da rede | Escolas mais preparadas inflam o resultado, que depois não se repete | avaliacao, gabinete | M1 | C com impacto de desigualdade; senão R | perfil | Al-Ubaydli et al. 2017; Coburn 2003 | ECO eco-selecao, POL pol-amostra-piloto; **internet-teste** |
| R-15 | piloto ou implantação | Definir o que é "uso de fato" e medi-lo todo mês por escola e turma; registrar a dose e estimar o efeito entre usuários a partir da comparação | A estimativa supõe {adoção Ano 1}% de adoção; abaixo disso, o custo por usuário sobe sem que ninguém perceba | pedagogica, avaliacao, tecnologia | M1 | R (alta: a adoção está entre os direcionadores do custo) | adoção; custo por usuário ativo | Krueger e Jackson 2026, p. 3; Angrist et al. 1996 | PED-R05, COM adocao-meta, ECO eco-dose, POL pol-adocao-desigual |
| R-16 | `impactos` inclui tempo docente ou gestão | Medir o tempo com registro (2 semanas antes e no 3º mês) e combinar com as escolas e a representação dos professores para que vai o tempo liberado | O resultado só acontece se o tempo virar acompanhamento; A precisa de ≈ 33 min por semana por professor ativo para empatar (ilustrativo) | avaliacao, pessoas | M1 | R (alta quando é o impacto principal) | `limiar()` | Levin et al. 2018; EEF 2024 (a verificar) | ECO eco-tempo-liberado, POL pol-tempo-liberado, PED-R11 |
| R-17 | `impactos` ∩ {aprendizagem, permanência, desigualdade, tempo docente, gestão} | Calcular o efeito mínimo que faz a IA valer o custo, comparado à alternativa; contar os recursos que a rede já tem (tempo de aula, dispositivos) | A decisão de compra depende de custo ÷ efeito, e o plano hoje não estima efeito | orcamento, avaliacao | M3 | R | `limiar()`; custo em regime | Levin et al. 2018; GEEAP 2020 | ECO eco-limiar, eco-ingredientes e eco-custo-beneficiario |
| R-18 | há piloto | Registrar o plano de avaliação antes de começar, contratar com o valor já orçado um avaliador que não seja o fornecedor e publicar o resultado, qualquer que seja | Fixar o plano antes impede escolher depois a medida que "deu certo" | avaliacao, compras | M1 | R | K5.5 (B: US$ 60 mil por ano) | AEA RCT Registry; guia PD4 | ECO eco-registro e eco-avaliador |
| R-19 | tarefa `alerta_precoce` ou classe previsão | Fazer a prova de conceito com dados de anos anteriores, sem alertar estudantes de hoje, e comparar com uma regra simples de faltas e notas (acertos, alertas falsos, antecedência, por grupo) | Uma regra simples pode acertar quase o mesmo e é mais barata, mais fácil de explicar e de contestar | avaliacao, tecnologia | M1 | C | — | Bowers et al. 2013; Perdomo et al. 2023 | ECO eco-alerta-retro, ETI-R01/R02, TEC tec-aceite-previsao, POL pol-regra-simples; **alternativa** (no C) |

**ESCALA: etapas e expansão**

| R | Gatilho | Ação | Razão | Quem | Marco | Prior. | Número | Ref. | Origem / substitui |
|---|---|---|---|---|---|---|---|---|---|
| R-20 | `implantacao.escolas` ≥ 0,5 · `escRede`, ou `implP` ≥ 0,8 · `eleg`, ou `implantacao.escolas` / `piloto.escolas` ≥ 10, ou teste só com prova de conceito e implantação > 0 | Aprovar agora só o teste: a implantação é uma segunda decisão, tomada com o relatório. Variante "só prova de conceito": fazer antes um piloto com servidores reais em poucas escolas | A: de 20 para 800 escolas; C: de 10 para 300; D: de 150 pessoas para 270 escolas; um erro em escala custa mais e é difícil de desfazer | gabinete, pedagogica, avaliacao | M1 | C | salto (× escolas), custo do Ano 1 | Banerjee et al. 2017; guia PD4 | POL pol-escala-gate e pol-teste-servidores, COM etapas; **etapas, expansao-rapida** (gatilho) |
| R-21 | `implP` > 0 | Fixar antes os números para avançar: adoção, efeito com margem, custo por usuário ativo em regime e nenhum grupo pior, com uma tabela avançar / ajustar / parar | Sem número, a passagem vira opinião ou pressão do fornecedor | gabinete | M3 | C | B: custo por ativo ≤ US$ 8,94 × 1,2 (ilustrativo) | Krueger e Jackson 2026; guia PD4 | ECO eco-portao-escala, PED-R25; **implantacao-criterios** |
| R-22 | `expansao` = ano1, ou primeira etapa menor que a rede | Contratar a expansão como opção, por etapas, sem mínimo e com preço fixado; marcar a decisão para depois do resultado | A leva a rede toda no Ano 1; no B, o Ano 2 começa antes do resultado do Ano 1 | gabinete, compras | M3 | C se `eleg` ≥ 10.000; senão R | custo do Ano 1 e 2 | Muralidharan e Niehaus 2017; ex. UE art. 33, BR art. 82 | ECO eco-tempo-leitura, GOV cp-etapas-instrumento |
| R-23 | primeira etapa < rede, ou implantação total com 2 ou mais ondas possíveis | Usar a primeira etapa para medir: sortear quais escolas entram no Ano 1 e quais no Ano 2 (decisão 4) | É a única chance de evidência causal na escala; B: 200 de 600 escolas dá ≈ 0,06 DP | gabinete, avaliacao, compras | M3 | R | `avaliabilidade()` | Glennerster e Takavarasha 2013; Hussey e Hughes 2007 | ECO eco-entrada-sorteada |
| R-24 | `elegiveis` > `implP` ou expansão definida | Planejar a escala supondo adoção e efeito menores que no piloto, e dar ao piloto só o acompanhamento previsto para a escala | Atenção do fornecedor e novidade inflam o piloto | gabinete, avaliacao | M3 | R | adoção por ano | List 2022; Al-Ubaydli et al. 2017 | ECO eco-queda-escala |
| R-25 | risco elevado e (`expansao` = ano1 ou implantação > 10 × piloto) | Refazer a avaliação de risco antes de cada ampliação: nova etapa, população, finalidade ou autonomia | O que foi seguro em 10 escolas pode não ser em 300 | gabinete | M5 | A | — | guia cap. 6 | ETI-R23 |

**DADOS: dados pessoais e dispositivos**

| R | Gatilho | Ação | Razão | Quem | Marco | Prior. | Número | Ref. | Origem / substitui |
|---|---|---|---|---|---|---|---|---|---|
| R-26 | `k.dadosEst` | Concluir o pacote de dados dos estudantes antes do teste: base legal da política educacional (consentimento só se o uso for opcional e recusar não trouxer prejuízo), acordo de tratamento que proíba treinar modelos, avaliação de impacto, guarda e exclusão, módulo na formação | Na escola pública o consentimento raramente é livre; sem as peças, o teste não tem base legal | protecao_dados, juridico | M1 (avaliação de impacto atualizada antes de M4) | C | estudantes no teste | exemplos: LGPD; RGPD; Enunciado CD/ANPD 1/2023 | COM dados-pacote, GOV cp-dados-contrato, ETI-R08; **dados-acordo, dados-base-legal, dados-impacto, formacao-dados**; `g-dados` vira passo |
| R-27 | `ce.dados` com dados pessoais | Saber e registrar no contrato onde os dados são processados e guardados, por quanto tempo o fornecedor guarda o que é digitado, e a lista de subcontratados (incluindo o provedor do modelo), com aviso de troca | Entradas podem ir para outro país e ficar guardadas, o que exige base para transferência | protecao_dados, tecnologia | M1 com dados de estudantes; senão M3 | C com dados de estudantes; senão R | — | exemplos: LGPD arts. 33–36, Res. CD/ANPD 19/2024; ISO/IEC 27001 | TEC tec-residencia, GOV cp-diligencia |
| R-28 | adultos usuários e não `k.dadosEst` | Orientar a não digitar nomes, laudos ou notas de estudantes e exigir que o conteúdo digitado não treine modelos | Professores colam dados de estudantes mesmo quando a tarefa não pede | formacao, protecao_dados | M1 | R (alta com termos de uso padrão) | — | UNESCO 2023b | TEC tec-dados-entrada, ETI-R14, COM copiloto-dados; **criancas** (no A) |
| R-29 | `modeloDisp` = próprio e usuários sem estudantes nem famílias | Definir o uso no celular pessoal dos servidores: conta institucional, nenhum dado no aparelho, sessão que expira, uso opcional e alternativa na escola | O uso obrigatório em aparelho pessoal transfere custo e risco ao servidor | tecnologia, pessoas | M1 | R | — | referência a verificar | POL pol-celular-servidor, TEC tec-byod, ETI-R17, COM, PED; **disp-proprio** (com servidores) |
| R-30 | `modeloDisp` = próprio e estudantes ou famílias usuários | (texto atual de `disp-proprio`) Garantir acesso a quem não tem dispositivo próprio | Depender das famílias amplia desigualdades | tecnologia, pedagogica | M1 | R | — | Krueger e Jackson 2026, p. 12 | **disp-proprio** (com estudantes) |

**PESSOAS: proteção de pessoas e direitos**

| R | Gatilho | Ação | Razão | Quem | Marco | Prior. | Número | Ref. | Origem / substitui |
|---|---|---|---|---|---|---|---|---|---|
| R-31 | `consDecide` > 0; texto conforme `forma` | Caso a caso (C): cada alerta é revisto por alguém da escola antes de qualquer contato, com as horas estimadas. Exceção (B): definir quais saídas vão para revisão (baixa confiança, tema sensível, pedido de ajuda) e quem revê, com o painel da turma | A supervisão só protege se houver tempo, informação e autoridade no volume real | escolas, gabinete | M1 | C com risco elevado | horas por semana (K5.3) | AI Act arts. 14 e 26; UNESCO 2021 | ETI-R09, PED; **supervisao** |
| R-32 | `consDecide` > 0 e crianças ou famílias afetadas | Criar um canal de contestação que estudantes e famílias consigam usar: linguagem adequada à idade, prazo, alguém com autoridade para mudar; sem ele, a ferramenta não decide sobre pessoas | Quem é afetado nem sempre sabe que a IA participou | escolas, controle | M1 | R; C se a pergunta nova 2.2.5 = "não existe" | — | CDC art. 12; exemplos: LGPD art. 20, RGPD art. 22 | ETI-R10/R24, COM; **contestacao** |
| R-33 | risco elevado e (`consDecide` > 0 ou impacto de desigualdade), ou tarefa tutoria, correção ou alerta | Verificar antes e durante o teste se a ferramenta funciona igual para todos os grupos (escola, rural ou urbana, sexo, raça/cor, deficiência, língua), com limite de diferença que obriga a ajustar ou parar e amostra suficiente | Uma média positiva pode esconder piora no grupo-alvo; no B, o alvo é a defasagem | avaliacao, protecao_dados | M1 (definir), M5 (medir) | C no C; R (alta) no B | tamanho mínimo de efeito por grupo | Baker e Hawn 2022; UNESCO 2021 | ECO eco-grupos, POL pol-equidade-grupos, ETI-R06, COM grupos-teste, PED-R18 |
| R-34 | estudantes usuários, classe geração ou tutoria, etapas até o fund. 2 | Definir idade mínima e modo de uso (com professor ou sozinho), testar os filtros na língua e na faixa etária e avisar ao estudante que ele conversa com uma máquina | Crianças percebem menos um erro ou um conteúdo impróprio, e o uso dura anos | pedagogica, tecnologia | M1 | C | — | UNESCO 2023b; AI Act art. 50 | ETI-R12, COM criancas (a); **criancas** (com estudantes) |
| R-35 | mesmo gatilho de R-34, com uso diário ou contínuo | Definir o encaminhamento quando um estudante relata violência, automutilação ou outro risco na conversa: a quem, em que prazo, e o que o fornecedor guarda | Conversas abertas com crianças vão trazer esses relatos | pedagogica, protecao_dados | M1 | R (alta) | — | UNICEF 2021; CDC art. 19 | ETI-R13 |
| R-36 | crianças afetadas e (`k.dadosEst` ou `consDecide` > 0) | Informar famílias e estudantes antes do teste, em linguagem simples: para que serve, que dados usa, quem vê, por quanto tempo, como pedir correção ou não participar | Transparência é condição para contestar e para manter a confiança | comunicacao, pedagogica, protecao_dados | M1 | R (alta em B e C) | — | exemplos: LGPD art. 14 §6º, RGPD arts. 12–13 | ETI-R11, PED-R24, COM criancas (a) |
| R-37 | tarefas planos de aula ou materiais | Revisar todo material gerado antes de usá-lo com a turma (roteiro de 5 itens) e revisar uma amostra por mês, com o custo já orçado | O material chega às crianças mesmo quando a ferramenta não decide nada sobre elas | escolas, formacao | M1 e M5 | R | K5.3 (amostragem pedagógica) | UNESCO 2023b | PED-R10, ETI-R15, COM criancas (b); **criancas** (no A) |
| R-38 | professores ou estudantes usuários, ou crianças ou famílias afetadas | Apresentar o plano do teste ao conselho, à representação dos professores e às famílias; registrar as objeções e a resposta | Uma mudança sem escuta perde apoio e é revertida na primeira crise | gabinete, comunicacao | M1 | R | — | UNESCO 2021; CDC art. 12; Fullan 2007 | POL pol-participacao, ETI-R22 |
| R-39 | risco elevado | Nomear quem pode suspender o uso em até 24 h e em que situações (diferença entre grupos, vazamento, conteúdo impróprio) | Sem autoridade e critério, a suspensão demora e o dano se acumula | gabinete | M1 | R | — | AI Act art. 26; guia (severidade) | ETI-R21 (ativa `i-incidente`) |
| R-40 | `consequencias` inclui nota, acesso ou disciplina | Manter a nota, a matrícula e a disciplina com uma pessoa e vetar funções que inferem emoções ou atenção | São usos de alto risco ou vedados em várias jurisdições | pedagogica, compras, juridico | M1 | C | — | AI Act art. 5(1)(f), Anexo III | ETI-R19/R20 |
| R-41 | tarefa `alerta_precoce`, ou `consequencias` inclui apoio_est | Definir antes do primeiro alerta quem procura o estudante, em que prazo, com que apoio e onde registra; ajustar o limiar à capacidade das equipes | O alerta só reduz o abandono se virar ação; C: 80 mil estudantes em 300 escolas | pedagogica, escolas | M1 | C no C; R no B | casos por escola (`ctx.etapas`) | Faria et al. 2017; Bruce et al. 2011 | POL pol-acao-apos-alerta, ETI-R03, PED-R13/R14, COM acao-apos-saida, ECO eco-alerta-resposta |
| R-42 | tarefa `alerta_precoce`, ou (`consDecide` > 0 e dados sensíveis) | Proibir usar a pontuação para punir, transferir, negar matrícula ou avaliar escolas; mostrá-la só a quem age, sem rótulo, com prazo de guarda | O mesmo dado que ajuda a apoiar pode excluir; o caso pede "sem estigmatização" | protecao_dados, juridico, gabinete | M1 | C | — | exemplos: LGPD art. 6º, RGPD art. 5(1)(b); CG 25 (2021) | ETI-R04/R05, POL pol-estigma, PED-R15 |
| R-43 | `consequencias` inclui recursos | Publicar os critérios de distribuição de recursos entre escolas e comparar a distribuição com e sem a ferramenta | Uma pontuação opaca pode concentrar apoio onde o modelo erra menos | gabinete, orcamento | M3 | R (alta com risco elevado) | — | UNESCO 2021; guia PD3 | POL pol-criterios-alocacao, ETI-R18 |
| R-44 | risco elevado e `consDecide` > 0 | Fazer uma avaliação de impacto sobre direitos, e não só sobre dados: quem pode ser prejudicado, como, com que salvaguarda e risco residual | O relatório de proteção de dados não examina discriminação, estigma nem direito à educação | gabinete, protecao_dados, juridico | M1 (início), M4 (fim) | R (alta) | K5.4, K5.5 | UNESCO 2023c (avaliação de impacto ético); AI Act art. 27 | ETI-R07 |

**USO: uso nas escolas e formação**

| R | Gatilho | Ação | Razão | Quem | Marco | Prior. | Número | Ref. | Origem / substitui |
|---|---|---|---|---|---|---|---|---|---|
| R-45 | professores formados para uso pedagógico e horas < 8, ou `sp.formacao` | Planejar a formação em ciclos ao longo do teste, com prática na própria turma e uso pedagógico (ou o protocolo, no C), e não uma oficina única; mostrar o custo do cenário em ciclos | 2 a 3 h ensinam a acessar a ferramenta, não a ensinar com ela | formacao | M1 | R (alta com estudantes ou aprendizagem) | horas atuais × propostas e diferença de custo | Darling-Hammond et al. 2017; Yoon et al. 2007; UNESCO 2024 | PED-R01/R16; **formacao-plano, formacao-horas** (para professores) |
| R-46 | professores formados (PN `tempoJornada`) | Garantir que formação e primeiro uso caibam na jornada paga e somar esse tempo ao custo | Formação fora do horário tem pouca adesão | pessoas, formacao | M1 | R; C se PN = "não" | professores × horas × custo-hora | regra local (ex. BR: Lei 11.738/2008) | PED-R02 |
| R-47 | piloto com 5 escolas ou mais (PN `apoioEscola`); gestores fora de `formados` | Nomear em cada escola do teste uma referência com horas e envolver a direção (horário, salas, dispositivos, plano de uso de uma página) | A dúvida "como uso isto na minha aula" se resolve na escola | pedagogica, escolas | M1 | R (alta com estudantes) | horas de acompanhamento | Kraft, Blazar e Hogan 2018; Leithwood et al. 2004 | PED-R03/R04 |
| R-48 | tutoria e estudantes usuários | Fixar a dose semanal por estudante, pôr o horário na grade e, com dispositivo compartilhado, calcular os minutos por estudante e organizar estações ou orçar mais dispositivos | B: 3 estudantes por dispositivo contradizem a "prática individualizada" | pedagogica, escolas | M1 | R (alta) | estudantes por dispositivo; minutos por semana | Muralidharan et al. 2019; Escueta et al. 2020 | PED-R06/R07, POL pol-dose; **disp-compartilhado** (com tutoria) |
| R-49 | tutoria, correção ou feedback, com estudantes | Definir a rotina do professor com os relatórios do tutor (o que olha, quando, que decisão toma) e exigir um painel por turma | Sem a rotina, o tutor vira uma atividade paralela | pedagogica, formacao | M1 | R | — | Black e Wiliam 1998 | PED-R08 |
| R-50 | `g-etica` ∈ {não, parcial} e professores ou estudantes usuários | Entregar aos professores do teste, no primeiro dia, uma orientação de 1 a 2 páginas sobre o uso da IA em sala | A orientação institucional chega tarde para o piloto | pedagogica | M1 | R (alta com estudantes) | — | UNESCO 2023b | PED-R23 (muda o marco de `g-etica`) |
| R-51 | piloto com 5 escolas ou mais; expansão no Ano 1 com 100 escolas ou mais | Reunir os professores do piloto todo mês, escolher multiplicadores e dimensionar os formadores da expansão antes de assinar | A 12.000 professores no Ano 1 (A), a formação vira vídeo e a adoção cai | formacao | M1 e M4 | R | escolas por formador | Vescio et al. 2008; Wenger 1998 | PED-R19/R20 |
| R-52 | subproblema C4b, ou impacto inclusão, ou problemas C8, G8, F10, ou PN `publico` | Exigir e testar acessibilidade e as línguas dos estudantes, com a educação especial validando as adaptações | A rede responde pelo acesso de todos | inclusao, tecnologia | M1 (teste), M3 (requisito) | R (alta com estudantes) | — | CDPD art. 9 e 24; UNESCO 2016 | PED-R12, POL pol-acessibilidade-linguas |
| R-53 | `internet` ∈ {parcial, não} ou PN `publico` = rural | Medir a banda por sessão e o funcionamento com conexão fraca; exigir um modo de baixo consumo ou sem conexão, ou uma atividade desplugada equivalente | Uma ferramenta que só funciona com boa conexão aumenta a diferença entre escolas | tecnologia, pedagogica | M1 | R (alta com estudantes) | — | Krueger e Jackson 2026, p. 7 | TEC tec-conexao-fraca, PED-R22, POL pol-sem-conexao (ativa `p-desplug`) |
| R-54 | tarefa `duvidas` | Nomear a área dona da base de normas, com inventário, vigência, rotina de atualização e retirada, e revisão de respostas por amostra | Uma norma desatualizada vira erro repetido em todas as escolas | pedagogica (área normativa), juridico | M1 | R (alta) | K2.4, K4.1 | — | POL pol-curadoria-normas, TEC tec-base-curadoria (ativa `i-base`) |

**COMPRA: estratégia de compra e preço**

| R | Gatilho | Ação | Razão | Quem | Marco | Prior. | Número | Ref. | Origem / substitui |
|---|---|---|---|---|---|---|---|---|---|
| R-55 | `tipoTec` = não sei, adaptação sob medida, `conheceFerramentas` = não, ou PN `estrategiaCompra` = não sei | Escolher o instrumento pela maturidade (produto, configuração ou desenvolvimento) e fazer a consulta ao mercado com perguntas iguais para todos (onde roda, que modelo e versão, que dados, como foi avaliado, como sai) | O instrumento errado obriga a especificar o que ainda não se sabe | compras, juridico, tecnologia | M3 (consulta em M1 se a tecnologia for "não sei") | R (alta) | — | exemplos: UE arts. 30–31; BR art. 32, Lei 10.973 art. 20, LC 182 | GOV cp-estrategia, TEC tec-mercado; **tecnologia** (consulta) |
| R-56 | piloto pago com `eleg` ≥ 5.000, ou PN `instrumentoTeste` = não sei | Contratar o teste de modo que a escala ainda possa ser competida: uma etapa com aceite dentro de um contrato já competido, ou um contrato pequeno sem direito de continuar; a prova de conceito não obriga ao piloto nem à compra | Um piloto contratado direto e seguido de expansão com o mesmo fornecedor é o caminho mais comum de dependência | compras, juridico | M1 | C | preço de cada etapa | ex. BR art. 75 II; COM(2007) 799 | GOV cp-teste-instrumento; **teste-ambos-contrato** (vira passo) |
| R-57 | `pagamento` = gratuito | Formalizar o teste gratuito por instrumento publicado (cooperação ou doação), com escopo, prazo, dados, propriedade do que for configurado, exclusão ao final e cláusula de não preferência; registrar o preço público de tabela só como referência e calcular a custo-efetividade com o preço depois da gratuidade | O teste gratuito cria vantagem de informação; no D, o Ano 0 custa US$ 162 mil na conta econômica mesmo sem licença | juridico, compras | M1 | C | custo do Ano 0 fora da licença; custo em regime | Krueger e Jackson 2026, p. 7–8 | GOV cp-gratis-instrumento, POL pol-gratuito-isonomia, COM gratis-pacote, ECO eco-preco-regime; **gratis-fim, gratis-ativos** |
| R-58 | `semPreco` > 0 ou ferramenta paga sem preço | Formar o preço de referência com pelo menos 3 fontes (contratos de outras redes, preços públicos, cotações), e não com a cotação do interessado | Cotação única não sustenta o preço estimado | compras | M3 | R (alta) | preço ilustrativo em uso | ex. BR art. 23, IN 65/2021 | GOV cp-preco-referencia; **ferramentas-cotacao** |
| R-59 | há números e situação ≠ renovar | Julgar as propostas pelo custo do ciclo de vida no horizonte do plano, com planilha padronizada pelas linhas da árvore de custos | {pAbaixo}% do custo está abaixo da linha d'água (B: 87–94%) | compras, orcamento | M3 | R (alta se ≥ 60%) | parcela abaixo da linha d'água | ex. UE arts. 67–68; BR arts. 11 e 34 | GOV cp-julgamento-tco |
| R-60 | `tipoTec` ≠ não sei e (risco elevado ou decisão sobre pessoas ou modo poc/ambos) | Prever no edital uma demonstração do licitante provisoriamente vencedor, com roteiro, dados e critérios publicados antes (usar o conjunto de R-08) | Separa o que se promete do que se entrega | compras, tecnologia, pedagogica | M3 | R (alta com risco elevado) | — | ex. BR art. 17 §3º | GOV cp-poc-julgamento |
| R-61 | `pagamento` ∈ {usuário, institucional, consumo} e horizonte ≥ 2, com `tipoTec` ≠ não sei | Pedir na proposta o preço de todos os anos, o reajuste e o preço por faixa de usuários ativos; fixar antes a adoção mínima para continuar (abaixo de {aEq}%, a licença por usuário sai mais barata) | A: adoção prevista de 35–50% contra equilíbrio de 60%; no Ano 2, US$ 1,01 mi (nominal) contra US$ 1,35 mi (institucional) | compras, orcamento | M3 | R (alta se adoção < aEq) | `compLicenca.aEq` | Krueger e Jackson 2026, p. 3; ex. BR art. 25 §7º | GOV cp-precos-horizonte, ECO eco-adocao-minima; **lic-institucional** |
| R-62 | município, distrito ou rede com `eleg` < 10.000, ou `g-compras` = não | Verificar se há compra centralizada, ata, acordo-quadro ou consórcio com as cláusulas deste plano | Rede pequena tem pouco poder de negociação e pouca equipe para fiscalizar | compras | M3 | R | — | ex. UE arts. 37–39; BR art. 181 (a verificar) | GOV cp-compra-conjunta |
| R-63 | `g-compras` ∈ {não, parcial, não sei} | Usar o checklist "O que exigir" deste plano como orientação de compras do caso e juntá-lo ao processo | A política geral da rede não cabe no prazo deste caso | compras | M3 | R | — | WEF 2020; UK Office for AI 2020 | GOV; **g-compras** (texto) |

**CONTRATO: contrato, serviço e saída**

| R | Gatilho | Ação | Razão | Quem | Marco | Prior. | Número | Ref. | Origem / substitui |
|---|---|---|---|---|---|---|---|---|---|
| R-64 | ferramenta externa (`tipoTec` ∈ {paga, aberta} ou `arqEf` ∈ {saas, api, ow}), qualquer que seja o suporte | Fixar níveis de serviço do sistema (disponibilidade no horário escolar, tempo de resposta, prazo de correção) medidos pela rede, com desconto na fatura | Nenhum exemplo recebe níveis de serviço porque a regra atual só olha o suporte ao usuário | tecnologia, fiscal | M3 | R (alta com uso contínuo ou `eleg` ≥ 5.000) | — | ex. BR art. 144, IN 5/2017 | GOV cp-nivel-servico |
| R-65 | `arqEf` ∈ {saas, api} ou licença ∈ {termos, assinatura} | Negociar um contrato que prevaleça sobre os termos online, com a versão do modelo identificada, aviso prévio de troca ou descontinuação, direito de testar a nova versão e de rescindir sem multa | O mesmo nome de modelo muda de comportamento, e o teste vale só para a versão testada | juridico, tecnologia | M3 | C com termos de uso padrão; senão R | prazo de aviso (ilustrativo) | Chen et al. 2024; ex. UE art. 72; guia cap. 16 | TEC tec-versao, GOV cp-mudanca-unilateral, COM termos; **termos, arquitetura-saas** |
| R-66 | `anosParaSair` > 0 | Exigir na proposta o preço da transição, o pacote de saída no contrato e um teste real de exportação no 1º ano; com API, uma camada que permita trocar de modelo e exportar a base | Uma saída negociada no fim fica nas mãos do fornecedor; B: sair custaria US$ 112,9 mil (0,47 ano) | tecnologia, juridico | M3 | R (alta se ≥ 0,25 ano) | custo de saída; K6.3 | ex. Data Act cap. VI; guia caps. 10 e 16 | GOV cp-saida-preco, TEC tec-teste-exportacao e tec-portab-rag, COM saida-pacote |
| R-67 | adaptação sob medida, ou classe previsão | Garantir que código, configurações e o modelo treinado com dados da rede (com dados, variáveis e documentação) são da rede, que pode retreinar sem o fornecedor | O ativo mais valioso do alerta é o modelo ajustado à rede | juridico, tecnologia | M3 | R (alta) | — | Mitchell et al. 2019 | TEC tec-modelo-proprio; **sob-medida** |
| R-68 | `pagamento` = consumo ou `arqEf` ∈ {api, ow}; texto por arquitetura (api: chamadas; ow: horas de servidor) | Fixar um teto anual de consumo (central + margem de risco), com alertas a 70% e 90%, painel acessível e aprovação para passar do teto | Sem teto, a despesa ultrapassa a dotação sem que ninguém decida | tecnologia, fiscal | M3 e M5 | R (alta) | `consumoAno[t]` + `custoEmRisco[t]` | Krueger e Jackson 2026, p. 6 | GOV cp-teto-consumo, COM; **consumo-limites, consumo-monitorar** |
| R-69 | risco elevado, ou `eleg` ≥ 50.000, ou câmbio entre os 3 maiores direcionadores | Incluir no contrato uma matriz de riscos: preço do modelo ou da nuvem, câmbio, falha de terceiro, incidente de dados | Sem alocação, o risco volta todo para a rede | compras, orcamento, juridico | M3 | R | direcionador de câmbio | ex. BR arts. 6º XXVII e 22 | GOV cp-matriz-riscos |
| R-70 | há contrato (`tipoTec` ≠ pública ou formação paga ao fornecedor) | Designar o gestor e os fiscais (técnico e pedagógico) antes de assinar, com horas e painel mensal | Uma cláusula sem ninguém para usá-la não protege a rede | gabinete | M4 | R (alta se `eleg` ≥ 5.000) | custo de gestão (K5.1) | ex. BR arts. 7º e 117 | GOV cp-gestao-fiscal |
| R-71 | `consDecide` > 0 ou risco elevado | Registrar em cada saída que afeta um estudante a versão do modelo, da base e da configuração, com prazo de guarda | Sem registro não dá para contestar nem investigar | tecnologia, protecao_dados | M3 | R (alta) | — | AI Act art. 12 | TEC tec-registros |

**ORC: orçamento e sustentabilidade**

| R | Gatilho | Ação | Razão | Quem | Marco | Prior. | Número | Ref. | Origem / substitui |
|---|---|---|---|---|---|---|---|---|---|
| R-72 | há simulação | Orçar pelo P50 da simulação e reservar até o P90, e não pelo valor central (decisão 3) | A: central US$ 4,75 mi, P50 US$ 5,14 mi, P90 US$ 5,73 mi; orçar pelo central quase garante que vai faltar | orcamento | M3 | R (alta se P50 − central > 5%: A e C) | P10, P50, P90, central | HM Treasury 2022 | ECO eco-orcar-p50 |
| R-73 | horizonte ≥ 1 e (parcela recorrente ≥ 50% ou situação = orçamento), reforçada por PN `dotacao` | Reservar a dotação de cada exercício e inscrevê-la no plano plurianual antes de levar ao mercado: {p}% do custo é recorrente | B: 75% recorrente, de US$ 280 a 337 mil por ano; um contrato sem dotação futura vira corte no meio do ciclo | orcamento | M3 | C se o contrato passa de um exercício e PN `dotacao` ≠ sim; senão R | dotação por exercício; custo em risco | Krueger e Jackson 2026, p. 6; ex. LRF art. 16 | POL pol-orcamento-plurianual, GOV cp-dotacao, COM custo-recorrente; **expansao-recorrente** |
| R-74 | 1ª linha do tornado > 5% do custo total, ou item "sem faixa" > 10% | Confirmar primeiro a premissa que mais move o custo: {nome} (de −X a +Y); se for pessoal, confirmar com gestão de pessoas quem existe e quanto custa | B: custo carregado de pessoal (−US$ 84 mil a +US$ 126 mil); A: câmbio | compras, orcamento, pessoas | M3 | R (alta se > 10%) | tornado | método desta ferramenta | ECO eco-premissa-chave, COM pessoal-confirmar |

**TEC: arquitetura e operação técnica**

| R | Gatilho | Ação | Razão | Quem | Marco | Prior. | Número | Ref. | Origem / substitui |
|---|---|---|---|---|---|---|---|---|---|
| R-75 | 3.2.1 = não sei | Confirmar ou mudar a arquitetura que o plano supõe ({arqEf}, porque {motivo}), ou comparar duas na prova de conceito com o mesmo conjunto de teste | Custo, integração e saída já foram calculados com ela; as cláusulas que dependem dela são provisórias | tecnologia | M1 se há prova de conceito; senão M3 | R (alta em proposta ou orçamento, `eleg` ≥ 10.000 ou sob medida) | custo total em saas, api e ow | guia cap. 9 | TEC tec-arq-presumida, GOV cp-arquitetura-presumida, COM; **arquitetura-decidir** |
| R-76 | (`tipoTec` = aberta ou `arqEf` = ow) e `pagamento` = consumo | Esclarecer se o modelo roda em servidores contratados (pagos por hora) ou pela API de uma empresa (paga por uso); suspende R-68 até a resposta | B: o custo cobra horas de GPU e o contrato trata como cobrança por uso | tecnologia | M1 | C para M3 | horas de GPU × US$/h | coerência interna | TEC tec-arq-coerencia |
| R-77 | `arqEf` ∈ {api, ow}, ou sob medida, ou classe previsão, sem equipe técnica em `formados` | Nomear a equipe técnica da rede que acompanha o fornecedor e quem opera o modelo (a pessoa já orçada), com manual, infraestrutura reprodutível e transferência medida | Pesos abertos só dão controle se alguém usa esse controle; senão a dependência muda de lugar | tecnologia, pessoas | M1 | R (alta com ow) | B: 1 pessoa, US$ 60 mil por ano (K4.1) | Sculley et al. 2015; Krueger e Jackson 2026 (camada 6) | TEC tec-ow-operacao e tec-capacidade-interna; **aberta-operacao** (as duas) |
| R-78 | `arqEf` = ow, ou licença ou `tipoTec` aberta | Verificar a licença exata dos pesos: uso por governo, uso aceitável, redistribuição | "Aberto" cobre licenças muito diferentes | juridico, tecnologia | M3 | R | — | referência a verificar | TEC tec-ow-licenca |
| R-79 | estudantes usuários e `eleg` ≥ 10.000, ou uso diário ou contínuo com `eleg` ≥ 5.000 | Medir no teste o uso simultâneo no horário de aula e o tempo de resposta com turmas inteiras, e confirmar a capacidade contratada | Se trava em aula, a aula se perde e o piloto deixa de valer | tecnologia | M1 | R (alta se a capacidade sai do cenário de estresse) | servidores no pico ou limite de taxa (K2.3) | NIST AI RMF | TEC tec-carga-pico (ativa `i-pico`) |
| R-80 | `arqEf` ∈ {api, ow}, ou geração ou tutoria com estudantes | Testar injeção de instruções e quebra de limites antes do teste com pessoas e repetir antes de ampliar | Estudantes vão testar os limites, e documentos da base podem trazer instruções escondidas | tecnologia | M1 | C com crianças em contato direto; senão R | K5.4 | OWASP LLM Top 10 2025 | TEC tec-seguranca-ia (antecipa `i-adversarial`) |
| R-81 | adaptação ∈ {integração, sob medida} | Integrar o login ao sistema de identidade da rede e trocar turmas e matrículas por padrão aberto ou API documentada, com acesso mínimo por perfil | Integração sem padrão prende a rede ao fornecedor | tecnologia | M3 | R (alta com sob medida) | K1 integração | 1EdTech OneRoster e LTI 1.3 | TEC tec-identidade; **integracao** |
| R-82 | sempre no M5; variante previsão | Repetir todo mês, numa amostra de uso real, a avaliação do teste, com limiar de alerta e de suspensão, e reexecutar o conjunto a cada nova versão. Variante previsão: revalidar e recalibrar a cada ano letivo, por grupo | A qualidade muda com a versão, a base e o uso | avaliacao, tecnologia | M5 | A (alta com risco elevado) | K5.3, K6.2 | NIST AI RMF; Baker e Hawn 2022 | TEC tec-monitor e tec-deriva |

**GOV: governança e continuidade**

| R | Gatilho | Ação | Razão | Quem | Marco | Prior. | Número | Ref. | Origem / substitui |
|---|---|---|---|---|---|---|---|---|---|
| R-83 | `g-comite` ≠ sim, ou (`arqEf` ∈ {api, ow} ou sob medida ou `tipoTec` aberta) | Designar por ato a equipe responsável por IA, com nomes, horas e as funções que não se terceirizam (finalidade, risco, evidência, continuidade, prestação de contas) | Alguém precisa aceitar riscos e decidir a continuidade | gabinete | M1 com dados de estudantes; senão M3 | R (alta) | — | Krueger e Jackson 2026, p. 12; guia cap. 2 | COM g-comite, POL pol-funcoes-internas; **g-comite** (texto) |
| R-84 | respostas "não", "parcial" ou "não sei" em 1.3.2, 1.3.3 e 1.3.5 | Um cartão de governança da rede com as faltas como passos (política, legislação, orientações) | Hoje cada resposta vira uma ação solta | gabinete | M3 | R (alta para `g-legislacao`) | — | — | GOV-17; **g-politica, g-legislacao, g-etica** (agrupados) |
| R-85 | horizonte ≥ 3 | Dar ao programa um ato normativo, um responsável de carreira e uma revisão de continuidade com data fixa, fora do calendário eleitoral | Programas sem ato e sem dono técnico morrem ou se perpetuam sem avaliação | gabinete | M4 | R | — | guia PD9 | POL pol-continuidade (ativa `s-continuidade`) |
| R-86 | há teste; reforçada com `consDecide` | Publicar a ficha do sistema (finalidade, dados, fornecedor, custo, quem decide, como contestar) e o relatório do teste, com a decisão e o motivo | Decisões sobre estudantes e dinheiro público pedem justificativa pública | gabinete, controle | M2 e M5 | R (alta com decisão sobre estudantes) | — | UNESCO 2021; UK ATRS (versão a verificar) | POL pol-prestacao-contas, GOV cp-transparencia (ativa `g-avaliacao`) |
| R-87 | `situacao` = renovar | Renovar só com o relatório do contrato atual (uso real, resultado, custo por usuário ativo), comparação com o mercado e teste de exportação | A renovação automática perpetua a dependência e o preço | fiscal, compras, gabinete | M4 | C | custo dos próximos anos | ex. BR art. 107; guia PD9 | GOV cp-renovar, POL pol-renovar-evidencia |

### 6.2 Regras atuais que continuam (novo id; texto atual; recebem quem, como, pronto e marco)

| R | Atual | Ajuste |
|---|---|---|
| R-88 | `ferramentas-levantar` | marco M1; vai para as pendências quando `nFerramentas` = não sei |
| R-89 | `ferramentas-interop` | M3; passo de R-81 quando os dois disparam |
| R-90 | `ferramentas-sobrepostas` | M3 |
| R-91 | `publica` | M3 |
| R-92 | `incluida` | M3 |
| R-93 | `lic-usuario` | M3; número: licenças pagas × usuários ativos |
| R-94 | `lic-usuario-rever` | M5 |
| R-95 | `internet-parcial` | M1; número: escolas sem internet adequada |
| R-96 | `internet-nao` | M1 |
| R-97 | `disp-nao` | M1 |
| R-98 | `disp-parcial` | M1 |
| R-99 | `disp-compartilhado` | só sem tutoria (com tutoria vira R-48) |
| R-100 | `disp-renovar` | M5 |
| R-101 | `formacao-pagador` | M3 |
| R-102 | `formacao-contrato` | M3 |
| R-103 | `formacao-parceiro` | M3 |
| R-104 | `formacao-papeis` | texto restrito à secretaria; a escola fica em R-47 |
| R-105 | `suporte-sla` | M3; é o suporte ao usuário (o sistema fica em R-64) |
| R-106 | `suporte-divisao` | M3 |
| R-107 | `suporte-dedicado` | M3 |
| R-108 | `acomp-intensivo` | M1 |
| R-109 | `acomp-reforcar` | M1; passa a ler `k.nivel` |
| R-110 | `arquitetura-api` | M3 |
| R-111 | `gratis-adiados` | M1; número: custo do Ano 0 fora da licença; funde com R-57 no cartão |
| R-112 | `formacao-continua` | base comum (`generica: true`): fora dos cartões e da contagem |

### 6.3 Regras atuais que saem ou se dividem (40 entradas, contando as duas `aberta-operacao`) e para onde vão

`linha-base`, `linha-base-parcial`, `linha-base-medida` → R-11 · `metas-lacunas` → R-01 · `alternativa` → R-03 e R-19 · `teste-recomendado`, `teste-rever`, `teste-ambos`, `teste-piloto-possivel`, `tecnologia` → R-07 e R-55 · `teste-ambos-contrato` → R-56 · `ferramentas-cotacao` → R-58 · `gratis-fim`, `gratis-ativos` → R-57 · `termos`, `arquitetura-saas` → R-65 · `licenca-indefinida` → pendência · `lic-institucional` → R-61 · `consumo-limites`, `consumo-monitorar` → R-68 · `aberta-operacao` (×2) → R-77 · `sob-medida` → R-67 · `integracao` → R-81 · `internet-teste` → R-14 · `disp-proprio` → R-29 ou R-30 · `formacao-plano`, `formacao-horas` (para professores) → R-45 · `formacao-dados`, `dados-acordo`, `dados-base-legal`, `dados-impacto` → R-26 · `supervisao` → R-31 · `contestacao` → R-32 · `criancas` → R-34, R-36, R-37 ou R-28, conforme o caso · `etapas`, `expansao-rapida` → R-20 e R-22 · `implantacao-criterios` → R-21 · `arquitetura-decidir` → R-75 · `expansao-recorrente` → R-73. Duas se dividem em vez de sair: `disp-proprio` continua como R-30 quando estudantes ou famílias usam, e `formacao-horas` continua para quem não é professor (D), como R-45 na variante "confirmar horas".

Ficam de fora do catálogo como regras: `eco-desconto` (vira uma exibição em P3, REC-63) e as perguntas de `ETI 2.2.8` (vira passo de R-42).

---

## 7. Perguntas novas propostas

O Essencial tem 25 perguntas. Recomendação do coordenador: **nenhuma pergunta nova no Essencial**. Toda pergunta nova vai para o Refinar. Sem resposta, a regra correspondente dispara com o texto "Decidir…" e o quadro mostra "não informado", nunca "sem risco".

| Pergunta (junta as equivalentes) | Onde | Origem | Por quê |
|---|---|---|---|
| `publico` (1.1): "No público há escolas rurais ou remotas; comunidades tradicionais (indígenas, quilombolas); estudantes com deficiência; outra língua em casa; crianças em acolhimento?" Chips com "nenhum" e "não sei" | Refinar (**único candidato ao Essencial**: decisão 7) | POL-Q1 + ETI 2.2.7 + PED-R12 | Alimenta R-14, R-33, R-52, R-53 e `ce.vulneraveis` (hoje fixo em falso). São chips e não pedem números |
| `contestacaoExiste` (2.2.x): efetiva / só formal / não existe | Refinar | ETI 2.2.5 | Troca a premissa "formal" e liga o alerta de bloqueio |
| `treino` (2.2.x): o fornecedor pode usar os dados para treinar? | Refinar | ETI 2.2.6 | Troca a premissa "não sei" |
| `verificacao` (3.2.x): o contrato garante registro de versão e registros de uso? | Refinar | TEC-06 | Necessária se a decisão 2 tirar a verificabilidade da arquitetura |
| `instrumentoTeste` (2.0.1) | Refinar | GOV | Na falta, inferido de `testes`, `pagamento` e `situacao` |
| `estrategiaCompra` (3.3.1) | Refinar | GOV | Na falta, inferido de `tipoTec` e `adaptacao` |
| `dotacao` (3.3.2): a despesa dos próximos exercícios está prevista? | Refinar | GOV | Faz de R-73 uma Condição |
| `tempoJornada` (2.5.x) | Refinar | PED | R-46 |
| `apoioEscola` (2.6.x) | Refinar | PED | R-47 |
| `momentoUso` (2.2.x): aula regular / contraturno / casa / planejamento | Refinar | PED | R-48 |
| `altCustoEfeito` (1.2.8b): custo por pessoa por ano e efeito esperado da alternativa, em faixa | Refinar | ECO | R-17 |
| `volumeResultado` (1.2.9): unidade de resultado e volume (por exemplo, solicitações por mês) | Refinar | ECO | Custo por solicitação (D) |
| `capacidadeAlerta` (só com alerta precoce): quantos estudantes por mês a equipe consegue acompanhar? | Refinar | ECO + PED-R14 | R-41 e horas de R-31 |
| Opções novas na 3.2.1: "Modelo preditivo treinado com dados da rede" e "Modelo aberto usado pela API de uma empresa" | opção, não pergunta (decisão 10) | TEC | Mudam o motor de custos do C e do B |
| Opção nova na 2.5.1: "Coordenação pedagógica" | opção, não pergunta | PED-12 | R-47 |
| Fonte de recursos (volta da v11) | não volta | POL | `dotacao` cobre o risco de interrupção com menos esforço |

Atenção à numeração: PED e ETI propuseram "2.2.5" para perguntas diferentes. A numeração final sai da revisão do fluxo, e não destes pareceres.

---

## 8. Mudanças no motor

| # | Mudança | Origem | Muda números dos exemplos? |
|---|---|---|---|
| E1 | **Verificabilidade** deixa de vir da arquitetura (`framework.js:367` dá "sim" para api e ow) | TEC-06 | **Sim, no D.** Opção "parcial": D limitado → moderado, US$ 570,1 mil → 618,4 mil (+8,5%). Opção "não" para termos de uso padrão: D → elevado, US$ 997,6 mil (+75%). A, B e C não mudam (medido). Decisão 2 |
| E2 | **Teste local (K3.4) no Ano 0 em todos os níveis de risco**, com valor maior no elevado. Hoje só existe no ramo limitado (`casos.js:295`) | TEC-07 | **Sim:** A, B e C sobem pelo menos US$ 12 mil (convenção `gov.testeLocal`); D não muda |
| E3 | **Testes adversariais (K5.4) a partir do Ano 0** com crianças em contato direto | TEC-08 | **Sim, no B:** cerca de +US$ 45 mil (um ano a mais de `gov.testesAdversariais`) |
| E4 | **Revisão proporcional ao volume (K5.3)**: horas = alertas por semana × minutos ÷ revisores. A governança **já** acompanha o risco (`governancaPorRisco`); o que falta é ligar a revisão ao volume | ETI-11 (corrigido na 2.4) | **Sim, no C**, com a premissa da taxa de alerta (a definir) |
| E5 | **Arquitetura preditiva** (opção nova da 3.2.1): o C deixa de usar licenças SaaS como premissa | TEC-13 | **Sim, no C**, só se a pessoa escolher a opção nova. Decisão 10 |
| E6 | `__arqPresumida` verdadeiro sempre que 3.2.1 = não sei, e o alerta cita a arquitetura presumida | TEC, GOV, COM | Não |
| E7 | **Contestação presumida**: "formal" continua como premissa, rotulada; com `contestacaoExiste` = não, o alerta de bloqueio dispara | ETI-07/08 | Não sem resposta; com "não", o risco sobe |
| E8 | `recomendarTeste` trata servidores e gestores como usuários reais quando há implantação em escolas (D → "ambos") | POL-04 | Não (o custo usa o teste escolhido; `recomendarTeste` não é chamado em `casos.js` nem em `custos.js`) |
| E9 | **Valor central × P50**: rótulos e manchete | ECO-06 | Só a exibição: manchete A 4,75 → 5,14 mi; B 1,77 → 1,80; C 1,64 → 1,73; D 0,57 → 0,59. Decisão 3 |
| E10 | Funções puras novas: `avaliabilidade(ce, ctx)` (tamanho mínimo de efeito no piloto e na 1ª etapa, escolas necessárias para 0,10/0,15/0,20 DP; coeficiente de correlação intraclasse e R² de uma tabela de convenções grau C) e `limiar()` (efeito de empate, custo por 0,1 DP, por abandono evitado ou por hora liberada) | ECO | Não (não entram no custo total) |
| E11 | Indicadores: custo em regime por usuário ativo, custo por beneficiário e custo do teste por participante, com rótulo | ECO-09 | Não (exibição) |
| E12 | Parcela "sem faixa" > 25% → aviso; nota sobre o estresse acima do P90 | ECO-17 | Não |
| E13 | Nota normativa cobre perfilamento; a data de aplicação do AI Act vira uma constante com fonte e data de verificação | ETI-14 | Não |
| E14 | Teste de ids únicos e de independência da ordem | TEC-18, GOV-08 | Não |

Formação em ciclos (PED) não muda a estimativa central: ela aparece como cenário dentro de R-45 (decisão 2).

---

## 9. Requisitos

Formato: REC-nn · requisito · prioridade · verificação nos exemplos A–D · origem. Os pacotes seguem a ordem de implementação.

### Pacote R1: correções imediatas (P, sem dependências, não espera decisão)

| Id | Requisito | P | Verificação | Origem |
|---|---|---|---|---|
| REC-01 | Não há ids repetidos nas regras | P1 | Teste unitário sobre os ids; hoje falha (`aberta-operacao`) | TEC-18 |
| REC-02 | `disp-proprio` só usa o texto sobre famílias com estudantes ou famílias usuários; com servidores, sai o texto de R-29 | P1 | D não contém "famílias" | POL-10, TEC-11, ETI-06, PED-07, COM-13 |
| REC-03 | `criancas` não emite "uso adequado à idade" sem estudantes usuários | P1 | A não contém o texto; B contém | ETI-06, COM-13 |
| REC-04 | Regras de pagamento e licença ficam suspensas enquanto `tipoTec` = não sei e aparecem como pendência | P1 | C sem `lic-institucional` | POL-11 (corrigido), COM-15 |
| REC-05 | "Quem" vem de um mapa regra → área (3.4); `quemSabe` só como reserva | P1 | B e C: os cartões de dados dizem "Proteção de dados" e "Assessoria jurídica" | POL-06, GOV-09, ETI-09, PED-02, COM-05 |
| REC-06 | Sem corte no ":"; `termos` e `teste-rever` reescritos com verbo de ação | P1 | O cartão de termos do D começa por "Negociar" | GOV-10, COM-01 |
| REC-07 | Textos jurídicos corrigidos: sem "ou obter consentimento", sem "acordar por escrito o preço", sem "renegociar o valor", sem cotação única, `g-compras` do caso | P1 | Busca nas saídas de A–D: zero ocorrências | ETI-04, GOV-03 |
| REC-08 | O texto de consumo segue a arquitetura efetiva (pesos abertos → horas de servidor) | P1 | B cita GPU e não diz "cada uso é cobrado" | COM-14, TEC-04 |
| REC-09 | O texto de supervisão segue `formaSupervisao` | P1 | B sem "cada saída" e com "amostra" ou "exceção"; C caso a caso | ETI-02, PED-08 |
| REC-10 | O "Por quê" não mostra códigos crus nem repete a resposta; a pergunta e a resposta vão para "Origem" | P1 | Nenhum `porque` de A–D casa com `/^A resposta/` nem contém "nao_sei" | COM-02, POL-20 |
| REC-11 | PDF sem sobreposição de rótulos, com "→", sem "blocos A e B" e sem "Normal" | P1 | O texto extraído do PDF do B não contém "OPorquê", "->" nem "blocos A e B" | COM-20, COM-21 |
| REC-12 | Custo de saída com um valor ou dois rótulos; contagem de requisitos só do caso | P1 | B: o mesmo valor em "Quanto custa" e "O que exigir"; o resumo não diz "26 requisitos" | COM-11, GOV-07 |
| REC-13 | Arquitetura presumida marcada sempre que 3.2.1 = não sei; o alerta cita a arquitetura presumida | P1 | A e B mostram "(presumida)"; o B cita "pesos abertos" | TEC-02, TEC-19, GOV-12 |

### Pacote R2: esquema e catálogo base (M, depois de R1)

| Id | Requisito | P | Verificação | Origem |
|---|---|---|---|---|
| REC-14 | Toda regra segue o formato de 3.1 e passa no lint (campos obrigatórios, `oque` ≤ 25 palavras e com verbo, `como` com 2 a 4 passos, `pronto` não vazio, `exige` em regras de custo e contrato) | P1 | Lint no `npm test` | COM-01/06, PED-09/14 |
| REC-15 | Todas as 66 regras atuais têm destino (6.2 ou 6.3) e os R-nn são estáveis entre execuções | P1 | Teste de mapa; gerar o B duas vezes dá os mesmos ids | COM-18 |
| REC-16 | Testes de referência por exemplo: ids esperados e proibidos (4.6 e 6.3) | P1 | A suíte falha se `gratis-fim` voltar ou se o D mostrar ação sobre estudantes | GOV-16, PED-15 |
| REC-17 | `recContexto` expõe `nivel`, `determinantes`, `forma`, `alertas`, `arqEf`, `arqPresumida`, `classes`, `escRede`, `proxMarco`, `pend` e `d`, e as regras usam variantes por esses campos | P1 | `recContexto(C).nivel` = "elevado" e `forma` = "caso"; B e C têm textos diferentes de supervisão | ETI-01/02, TEC-05 |

### Pacote R3: prioridade, seleção e veredito (M, depois de R2)

| Id | Requisito | P | Verificação | Origem |
|---|---|---|---|---|
| REC-18 | Pontuação de 4.1 com `pontos` e `criterio` gravados; embaralhar as regras não muda a saída | P1 | Teste com as regras embaralhadas, nos 4 exemplos | GOV-08, COM-10, ECO-14 |
| REC-19 | Três níveis (Condição, Recomendada, Para acompanhar), iguais na página e no PDF | P1 | Busca: nenhum "Alta", "Média" ou "Normal" | COM-20 |
| REC-20 | Seleção dos 5 cartões conforme 4.3 | P1 | Conjuntos de 4.6; B com no máximo 1 cartão de dados; C com 1 só cartão de teste | POL-05, TEC-17, ETI-03, COM-04 |
| REC-21 | Recomendação principal = veredito de 4.4, idêntica na capa, em "Em resumo", no PDF e na síntese | P1 | Comparar as strings nos 4 exemplos; o B diz "Ainda não avance para o piloto" | POL-01, COM-03 |
| REC-22 | Com mais de 5 Condições no próximo marco, aparece o aviso com a lista | P2 | B e C mostram o aviso | COM-09 |
| REC-23 | "O que fazer" agrupa por pacote (no máximo 12 no nível de cima), com passos que mostram R-nn e origem; as regras genéricas ficam na base comum | P2 | B: no máximo 12 itens, com as 25 origens presentes | COM-08, ECO-15, PED-10 |
| REC-24 | Caso incompleto conforme 3.3, item 4 | P1 | C: pendências citam `tipoTec`, `licenca`, `arquitetura` e `nFerramentas`; o caso em branco diz "Ainda sem recomendações" | COM-15, TEC-20, ETI-15, POL-14 |

### Pacote R4: regras novas (G, depois de R2 e R3; quatro agentes em paralelo)

| Id | Requisito | P | Verificação | Origem |
|---|---|---|---|---|
| REC-25 | 4a Escala e avaliação: R-20 a R-24 e R-11 a R-18 com os gatilhos do catálogo | P1 | R-20 dispara em A, B, C e D e não dispara num caso com piloto de 20 e etapa de 60 escolas numa rede de 600; R-13 sai em A e B e não sai no D | POL-02/03, ECO-01/03/04/18 |
| REC-26 | `recomendarTeste` trata servidores como usuários reais quando há implantação em escolas | P1 | D: modo "ambos" | POL-04 |
| REC-27 | 4b Pessoas e dados: R-19, R-26 a R-44 com variantes por risco | P1 | C contém R-19, R-41, R-42, R-31 (caso a caso) e R-33; B contém R-34, R-35, R-31 (exceção) e R-33; A e D não contêm R-44 | ETI-02/05, PED-03, POL-09 |
| REC-28 | 4c Compra e contrato: R-55 a R-71 e R-87 | P1 | A: R-04 e R-56 entre os 5; D: R-57 e não `gratis-fim`; A, B e D: R-64 | GOV-02/04/05 |
| REC-29 | 4d Uso: R-45 a R-54 | P1 | B: R-48 cita "3 estudantes por dispositivo"; A: R-45 com 3 h e o cenário em ciclos; D sem R-45 na variante para professores | PED-04/05/06 |
| REC-30 | 4e Técnica: R-75 a R-82; a incoerência do B gera R-76 e suspende R-68 | P1 | B: R-76 presente e R-68 ausente; com 3.2.1 = api, R-68 volta | TEC-01/04/05 |
| REC-31 | Com impacto de desigualdade ou inclusão, pelo menos uma ação de equidade de nível Recomendada ou maior | P1 | B: R-14 e R-33 | POL-08 |

### Pacote R5: números nas recomendações (M, depois de R2; em paralelo com R3)

| Id | Requisito | P | Verificação | Origem |
|---|---|---|---|---|
| REC-32 | `numero(k, d)` lê o mesmo seletor de `numerosCusto`; sem números, "a calcular" | P1 | B: saída "US$ 112,9 mil" e "0,47"; dotação com 4 valores; caso em branco sem valores | GOV-06, COM-11, TEC-14 |
| REC-33 | `avaliabilidade()` com premissas visíveis e rótulo "ilustrativo, a confirmar" | P1 | B: piloto 20 + 20 entre 0,20 e 0,26 DP; 1ª etapa 200/600 entre 0,05 e 0,08 DP (valores do ECO, a reproduzir) | ECO-02/19 |
| REC-34 | `limiar()` e o bloco "Vale o que custa?" (fórmula com o custo do caso quando falta resposta) | P2 | A: "≈ 33 min por semana por professor ativo"; D sem volume: fórmula e "a completar" | ECO-12 |
| REC-35 | Indicadores rotulados (4 no B: 4,97 / 3,13 / 8,94 / 56); some "sem passar de US$ 4,97" | P1 | Teste de snapshot da página e do PDF do B | ECO-09/10 |
| REC-36 | P50 e P90 conforme a decisão 3; R-72 cita P10, P50, P90 e central | P1 | A: 4,68 / 5,14 / 5,73 e 4,75; C recalculado: 1,63 / 1,73 / 1,85 e 1,64 | ECO-06 |
| REC-37 | Aviso de parcela "sem faixa" > 25% e nota sobre o estresse | P2 | B mostra o aviso | ECO-17 |

### Pacote R6: relatório, PDF e fim do percurso (G, depois de R3 e R5)

| Id | Requisito | P | Verificação | Origem |
|---|---|---|---|---|
| REC-38 | "Em resumo" conforme 5.1, incluindo o nível de cuidado e os contadores | P1 | D diz "cuidado limitado"; B mostra "Condições de uso nas escolas: 0 de 4" | ETI-13, PED-11/18 |
| REC-39 | "Sequência de decisões" com os portões de 4.5, estado por critério e pontos de decisão em ordem 1–9 ligados aos R-nn | P1 | PDF do B: ordem 1…9; G3 lista adoção, efeito, custo por ativo e grupos | ECO-13, POL-13/18, GOV-14 |
| REC-40 | A1 vira "Como testar e avaliar" (5.3, item 3) | P2 | Os 4 exemplos geram fichas diferentes (geração, tutoria, previsão, dúvidas), de até 1 página no PDF | TEC-16, POL-16 |
| REC-41 | "O que exigir" só com as linhas do caso e 5 colunas; cláusulas-padrão recolhidas; cada linha cita o R-nn de origem | P1 | B: a linha de consumo mostra o teto em US$, "alertas a 70% e 90%" e "termo de referência" | GOV-07, TEC-15, ETI-12, COM-12 |
| REC-42 | Síntese do capítulo 4 "Seu próximo passo" (5.6) | P1 | Teste da tela de síntese no capítulo 4 com o B | COM-16 |
| REC-43 | As listas do guia têm o rótulo "referência" e citam R-nn sem repetir o texto | P2 | B: "Definir a supervisão humana" aparece uma vez como ação | COM-19 |
| REC-44 | Premissas da ferramenta rotuladas como premissas | P1 | B: a contestação na B5 traz "premissa da ferramenta" | ETI-07 |
| REC-45 | A 360 px não há rolagem horizontal | P2 | Playwright 360 × 740 no plano do B | COM-22 |

### Pacote R7: motor (M, só depois das decisões 2 e 3)

| Id | Requisito | P | Verificação | Origem |
|---|---|---|---|---|
| REC-46 | Verificabilidade conforme a decisão 2 | P1* | D: nível e custo total iguais aos da opção escolhida (moderado e US$ 618,4 mil na recomendação do painel) | TEC-06 |
| REC-47 | K3.4 no Ano 0 em todos os níveis de risco | P1* | A, B e C com K3.4 > 0 no Ano 0 | TEC-07 |
| REC-48 | K5.4 no Ano 0 com crianças em contato direto | P2* | B: K5.4 > 0 no Ano 0 | TEC-08 |
| REC-49 | K5.3 ligado ao volume de revisão | P2* | C: mudar a taxa de alerta muda K5.3 | ETI-11 |
| REC-50 | Nota normativa cobre perfilamento, com a data numa constante verificada | P2 | C mostra a nota | ETI-14 |
| REC-51 | Os snapshots numéricos de A–D são atualizados e cada diferença fica registrada no CHANGELOG com a causa | P1 | Diferenças só onde a seção 8 prevê | 04-requisitos-0015 ("nenhum número muda") |

(*) A prioridade vale se a decisão correspondente for aprovada.

### Pacote R8: perguntas no Refinar (M, depois de R4)

| Id | Requisito | P | Verificação | Origem |
|---|---|---|---|---|
| REC-52 | As perguntas da seção 7 existem no Refinar, com "Quem costuma saber"; sem resposta, "não informado" e a regra na variante "Decidir…"; o Essencial continua com 25 | P2 | Caso novo: 25 perguntas no Essencial; quadro de equidade com "não informado" | ETI-16, POL-16, PED-12/17, GOV |

### Pacote R9: línguas, normas por país e extras (M, por último)

| Id | Requisito | P | Verificação | Origem |
|---|---|---|---|---|
| REC-53 | Nenhuma frase principal cita lei, artigo ou diretiva; `exemplosNorma` fica recolhido e filtrado pelo país, com "confirme com a assessoria jurídica" (decisão 5) | P2 | Busca por "Lei", "art.", "Diretiva" e "Regulamento" nos textos principais em pt, en e es: zero | GOV-13, POL-21, COM-24 |
| REC-54 | Textos novos nas 9 línguas; lint de tamanho por língua | P2 | `test_idiomas.py` | COM-23, TEC-22, ETI-17 |
| REC-55 | Extras P3: anexo "Requisitos para o termo de referência", exportação do plano de ação em planilha, página "Para as escolas do teste", custo total com taxa de desconto nacional | P3 | Conforme a decisão 10 | GOV-15, COM-18, PED-13, ECO-20 |

### Ordem e tamanho

| Pacote | Tamanho | Depende de | Observação |
|---|---|---|---|
| R1 correções | P | — | pode começar já |
| R2 esquema e catálogo base | M | R1 | migra as 66 regras sem mudar conteúdo |
| R3 seleção e veredito | M | R2 | em paralelo com R5 |
| R5 números | M | R2 | |
| R4 regras novas (4a–4e) | G | R2, R3 | cinco agentes, um por subpacote |
| R6 relatório | G | R3, R5 (e R4 para o conteúdo) | página e PDF juntos |
| R7 motor | M | decisões 2 e 3 | atualiza snapshots |
| R8 perguntas | M | R4 | |
| R9 línguas e normas | M | tudo | |

Ordem: R1 → R2 → (R3 ∥ R5) → R4 → R6 → R7 → R8 → R9.

---

## 10. Decisões para o Emanuel

| # | Decisão | Opções | Recomendação do painel | Efeito |
|---|---|---|---|---|
| 1 | **A ferramenta pode dizer "Ainda não avance"?** | (a) Não: o piso é "com condições". (b) Sim, só nos 4 gatilhos de 4.4, sempre com o que falta. (c) Sim, sempre que houver Condição aberta | **(b)** | (a) protege a relação com o gestor que já decidiu, mas o B sai "com condições" para um piloto que a própria ferramenta desaconselha. (b) o B e talvez o C dizem "Ainda não". (c) os quatro exemplos diriam "Ainda não", e o veredito perde força |
| 2 | **Mudanças no motor que alteram números** (E1–E5) | (a) Nenhuma neste ciclo, só rótulos. (b) Verificabilidade "parcial" para api e pesos abertos, K3.4 no Ano 0 em todos os níveis, K5.4 no Ano 0 com crianças; K5.3 por volume e arquitetura preditiva depois. (c) Tudo, com termos de uso padrão → "não" | **(b)**, com formação em ciclos só como cenário (sem mudar a estimativa central) | (a) mantém "nenhum número muda", mas o plano continua testando menos quando o risco é maior. (b) D +8,5% (vira moderado); A, B e C +US$ 12 mil; B +US$ 45 mil. (c) D +75% (vira elevado), o que contraria a proporcionalidade |
| 3 | **Central ou P50 na manchete** | (a) Central, como hoje. (b) Central na manchete e P50 ao lado como "valor para orçar", com R-72. (c) P50 na manchete e central como "cenário-base" | **(b)** agora; (c) a reavaliar com a equipe de custos | (a) A orçado em 4,75 mi com P50 de 5,14 mi. (b) duas cifras, menos ruptura. (c) todas as manchetes mudam: A +8%, C +5%, D +4%, B +1,5% |
| 4 | **Sortear escolas** (piloto e entrada em ondas) | (a) Sorteio como padrão. (b) Comparação pareada como padrão, e o sorteio citado como melhor opção. (c) Só antes e depois | **(b)** no piloto e **(a)** para a entrada em ondas quando todas as escolas recebem depois | (a) evidência causal barata (B: ≈ 0,06 DP), com custo político de "negar" a ferramenta por um ano. (b) mais aceitável, mas mais fraca. (c) o piloto não separa o efeito da IA da tendência |
| 5 | **Normas por país × texto genérico nas 9 línguas** | (a) Texto genérico, sem normas. (b) Texto genérico e "Exemplos de norma" recolhidos, só Brasil e UE na 1ª versão, filtrados pelo país. (c) Normas no texto principal | **(b)**, com validação jurídica antes de publicar | (a) perde utilidade no Brasil. (b) exige curadoria e revisão. (c) erra fora do Brasil e cria responsabilidade |
| 6 | **Teto de recomendações** | (a) Sem teto. (b) 5 cartões, no máximo 12 pacotes, Condições sem teto mas com aviso acima de 5. (c) Teto rígido de 6 Condições | **(b)** | (b) B cai de 25 itens soltos para cerca de 10 pacotes, sem perder as origens. (c) pode esconder uma obrigação legal |
| 7 | **Perguntas novas no Essencial** | (a) Nenhuma; todas no Refinar. (b) Só `publico` (chips de grupos) no Essencial. (c) Também `dotacao` e `contestacaoExiste` | **(a)**; (b) é o único caso defensável | (a) o Essencial continua com 25, e o quadro de equidade fica "não informado" para quem não refina. (b) 26 perguntas, com equidade visível desde o Essencial |
| 8 | **Números ilustrativos nas ações** (tamanho de efeito, limiares de aceite, prazo de aviso, custo-hora) | (a) Mostrar com o rótulo "ilustrativo, ajuste" só na ficha e na avaliação, nunca na frase de ação. (b) Só fórmulas e campos em branco. (c) Mostrar sempre | **(a)** | (a) dá a ordem de grandeza sem parecer norma da UNESCO. (b) poucos gestores vão usar. (c) passa falsa precisão |
| 9 | **Agrupar × citar**: o id citável no processo é o do pacote ou o do passo? | (a) R-nn no passo (regra), com o pacote só como título. (b) Id no pacote | **(a)** | (a) cada obrigação continua rastreável e citável, como querem as áreas jurídica e de risco. (b) ids mais curtos, mas um pacote mistura várias perguntas de origem |
| 10 | **Escopo desta versão** | (a) R1–R7 agora; perguntas (R8) e línguas (R9) logo depois; os P3 (anexo para o termo de referência, planilha, página para as escolas, opções novas da 3.2.1) ficam para depois. (b) Incluir agora o anexo para o termo de referência e a arquitetura preditiva | **(a)** | (b) antecipa duas peças muito pedidas (GOV e TEC), mas o anexo cria responsabilidade sobre o texto e a arquitetura preditiva exige um exemplo de partida novo no motor |

Decidi como coordenador, sem levar a você:

- `gratis-fim` adota a versão de compras: o preço público de tabela fica só como referência e a custo-efetividade é calculada com o preço depois da gratuidade.
- O vocabulário é "representação dos professores", com R-38 como Recomendada.
- A separação custo × política é mantida pela etiqueta `tipo`.
- A fonte de recursos não volta.
- A lente "Pessoas e uso" substitui as cotas fixas por área.

---

## 11. Referências

Lista única das referências citadas nos pareceres. **[a verificar]** marca o que precisa de conferência antes de entrar no texto da ferramenta. Nas normas, o artigo exato deve ser conferido em todos os casos, e por isso as normas aparecem como "exemplos".

**Base do projeto**
- Krueger, K. e Jackson, F. para CoSN (2026). *Beyond the price tag: Rethinking total cost of ownership for AI in education systems*. Paris: UNESCO. Páginas conforme `plano/2_tco_unesco.md`; a página do "uso ativo" é [a verificar].
- Guia do projeto: capítulos 2, 4, 6, 9, 10, 13–16 e pontos de decisão 1–9 (interno).
- Sistema de Alerta Preventivo / SPTE: uso como caso para calibrar R-19 e R-41/R-42 só se houver documentação pública citável [a verificar, decisão sua].

**Avaliação, economia e escala**
- Al-Ubaydli, O., List, J. A. e Suskind, D. (2017). What can we learn from experiments? Understanding the threats to the scalability of experimental results. *American Economic Review: Papers & Proceedings*, 107(5).
- Angrist, J., Imbens, G. e Rubin, D. (1996). Identification of causal effects using instrumental variables. *JASA*, 91(434).
- Banerjee, A. et al. (2017). From proof of concept to scalable policies. *Journal of Economic Perspectives*, 31(4).
- Bloom, H. S. (1995). Minimum detectable effects. *Evaluation Review*, 19(5).
- Duflo, E., Glennerster, R. e Kremer, M. (2007). Using randomization in development economics research: a toolkit.
- GEEAP (2020). *Cost-effective approaches to improve global learning*.
- Glennerster, R. e Takavarasha, K. (2013). *Running Randomized Evaluations*. Princeton University Press.
- Hedges, L. e Hedberg, E. (2007). Intraclass correlation values for planning group-randomized trials in education. *EEPA*, 29(1). (Os valores nacionais de correlação intraclasse a usar são [a verificar].)
- HM Treasury (2022). *The Green Book*.
- Hussey, M. e Hughes, J. (2007). Design and analysis of stepped wedge cluster randomized trials. *Contemporary Clinical Trials*, 28(2).
- Kraft, M. A. (2020). Interpreting effect sizes of education interventions. *Educational Researcher*, 49(4).
- Levin, H., McEwan, P., Belfield, C., Bowden, A. B. e Shand, R. (2018). *Economic Evaluation in Education*, 3ª ed. SAGE.
- List, J. A. (2022). *The Voltage Effect*.
- Muralidharan, K. e Niehaus, P. (2017). Experimentation at scale. *Journal of Economic Perspectives*, 31(4).
- American Economic Association. *AEA RCT Registry*.
- Taxa social de desconto nacional [a verificar por país].

**Política educacional, pedagogia e alerta precoce**
- Baker, R. S. e Hawn, A. (2022). Algorithmic bias in education. *IJAIED*, 32.
- Bastani, H. et al. (2025). Generative AI without guardrails can harm learning: evidence from high school mathematics. *PNAS* [volume e páginas a verificar].
- Black, P. e Wiliam, D. (1998). Assessment and classroom learning. *Assessment in Education*, 5(1).
- Bowers, A. J., Sprott, R. e Taff, S. A. (2013). Do we know who will drop out? *The High School Journal*, 96(2).
- Bruce, M., Bridgeland, J., Fox, J. e Balfanz, R. (2011). *On Track for Success*. Civic Enterprises e Everyone Graduates Center.
- Coburn, C. E. (2003). Rethinking scale. *Educational Researcher*, 32(6).
- Darling-Hammond, L., Hyler, M. E. e Gardner, M. (2017). *Effective Teacher Professional Development*. Learning Policy Institute.
- EEF (2024). Ensaio sobre o uso do ChatGPT na preparação de aulas [título e números a verificar].
- Escueta, M., Nickow, A. J., Oreopoulos, P. e Quan, V. (2020). Upgrading education with technology. *Journal of Economic Literature*, 58(4).
- Faria, A.-M. et al. (2017). *Getting students on track for graduation: impacts of the Early Warning Intervention and Monitoring System after one year* (REL 2017-272). IES.
- Fullan, M. (2007). *The New Meaning of Educational Change*, 4ª ed.
- Funnell, S. C. e Rogers, P. J. (2011). *Purposeful Program Theory*. Jossey-Bass.
- Kraft, M. A., Blazar, D. e Hogan, D. (2018). The effect of teacher coaching on instruction and achievement. *Review of Educational Research*, 88(4).
- Leithwood, K., Louis, K. S., Anderson, S. e Wahlstrom, K. (2004). *How leadership influences student learning*. Wallace Foundation.
- Muralidharan, K., Singh, A. e Ganimian, A. J. (2019). Disrupting education? *American Economic Review*, 109(4).
- OCDE (2019). *TALIS 2018 Results (Volume I)*.
- Perdomo, J. C. et al. (2023). Difficult lessons on social prediction from Wisconsin public schools. arXiv [versão a verificar].
- Vescio, V., Ross, D. e Adams, A. (2008). A review of research on the impact of professional learning communities. *Teaching and Teacher Education*, 24(1).
- Wenger, E. (1998). *Communities of Practice*.
- Yoon, K. S. et al. (2007). *Reviewing the evidence on how teacher professional development affects student achievement*. REL Southwest.
- Modelo de rotação por estações; limiares de uso ativo; capacidade de atendimento de alertas; efeito de rótulo; descontinuidade entre mandatos [referências a verificar].

**UNESCO, ONU e direitos**
- ONU (1989). Convenção sobre os Direitos da Criança (arts. 12 e 19); Comitê dos Direitos da Criança (2021), Comentário Geral nº 25.
- ONU (2006). Convenção sobre os Direitos das Pessoas com Deficiência (arts. 9 e 24).
- UNESCO (2016). *If you don't understand, how can you learn?* GEM Policy Paper 24.
- UNESCO (2021). *Recomendação sobre a Ética da Inteligência Artificial*.
- UNESCO (2023a). *GEM Report 2023: Technology in education: A tool on whose terms?*
- UNESCO (2023b). *Guidance for generative AI in education and research*.
- UNESCO (2023c). *Ethical Impact Assessment* (ferramenta da Recomendação de 2021).
- UNESCO (2024). *AI competency framework for teachers*.
- UNICEF (2021). *Policy guidance on AI for children* (2.0).

**Tecnologia e segurança**
- 1EdTech. Especificações OneRoster e LTI 1.3. e-PING (Brasil).
- Chen, L., Zaharia, M. e Zou, J. (2024). How is ChatGPT's behavior changing over time? *Harvard Data Science Review*.
- ISO/IEC 27001:2022. ISO 24495-1:2023 (linguagem simples). W3C (2023), WCAG 2.2.
- Mitchell, M. et al. (2019). Model cards for model reporting. FAT*.
- NIST (2023). AI RMF 1.0 (NIST AI 100-1). NIST (2024). NIST AI 600-1.
- OWASP (2025). *Top 10 for LLM Applications*.
- Sculley, D. et al. (2015). Hidden technical debt in machine learning systems. NeurIPS.
- Licenças de pesos abertos; política de dispositivo pessoal; guia nacional de segurança da informação [a verificar].

**Compras públicas (exemplos de norma, artigos a conferir)**
- OCDE (2015). *Recommendation of the Council on Public Procurement*.
- Fórum Econômico Mundial (2020). *AI Procurement in a Box*. Reino Unido, Office for AI (2020). *Guidelines for AI procurement*. Reino Unido, *Algorithmic Transparency Recording Standard* [versão a verificar].
- Comissão Europeia (2007). COM(2007) 799 (compras pré-comerciais).
- UE: Diretiva 2014/24/UE (arts. 30, 31, 33, 37–39, 40–42, 67–68, 72); Regulamento (UE) 2023/2854 (Data Act), cap. VI.
- Brasil: Lei 14.133/2021 (arts. 6º XXVII, 7º, 11, 12 VII, 17 §3º, 18, 21, 22, 23, 25 §7º, 32, 34, 75 II, 82, 105, 107, 117, 124–125, 144, 174; art. 181 [a verificar]); IN SEGES/ME 65/2021; IN SEGES/MP 5/2017; Lei 10.973/2004, art. 20; LC 182/2021, cap. VI; LC 101/2000 (LRF), art. 16.

**Dados, IA e direitos (exemplos de norma)**
- UE: Regulamento (UE) 2016/679 (RGPD: arts. 5, 6, 8, 12–13, 22, 28, 35; considerando 43). Regulamento (UE) 2024/1689 (AI Act: arts. 5(1)(f), 6(3), 10, 12, 14, 26, 27, 50; Anexo III, ponto 3). Data de aplicação das obrigações de alto risco após o pacote de simplificação (Digital Omnibus) [a verificar].
- Brasil: Lei 13.709/2018 (LGPD: arts. 6º, 7º, 11, 14, 20, 23, 33–36, 38, 46); Resolução CD/ANPD nº 19/2024; Enunciado CD/ANPD nº 1/2023; Lei 8.069/1990 (ECA, art. 56); Lei 13.146/2015; Lei 11.738/2008, art. 2º §4º. Lei 15.211/2025 (ECA Digital), PL 2338/2023 e a lei de linguagem simples de 2025 [aplicabilidade e números a verificar].
