# Especificação de reimplementação — AI in Education Procurement Tool v14

27 de outubro de 2026 · Emanuel Queiroga, com apoio do Claude. Versão viva em Claude Docs: https://claude.ai/artifact/5ergYqbDmgVTQHNQWifUFf

## Resumo e decisões

A v14 reescreve a camada de interface da ferramenta em React com TypeScript e Vite, aplica o design system Prumo e a narrativa "o plano se escreve enquanto você responde", e reaproveita sem reescrever o motor de custos, as regras de recomendação, o perfil de risco, a matriz, os dicionários de idioma e o gerador de PDF.

| Decisão | Escolha | Por quê |
| --- | --- | --- |
| Framework | React 18 + TypeScript + Vite | Maior base de pessoas e de agentes que o conhecem; componentes de verdade para o Prumo; build estático que continua cabendo no GitHub Pages |
| Estado do caso | Um store único (Zustand) com seletores | O painel do plano precisa reagir a qualquer resposta; seletores evitam re-renderizar tudo |
| Domínio | Os módulos `custos.js`, `framework.js`, `casos.js`, `prioridades.js`, `recomendacoes.js` (parte pura), `matriz.js`, `plano_dados.js`, `formula.js` (parte pura) viram pacotes ES em `src/domain/`, com tipos adicionados aos poucos | São puros ou quase; os testes em Node continuam valendo |
| i18n | Mesmos dicionários JSON com o português como chave, chamados explicitamente por `t()` | Elimina o MutationObserver que traduz o DOM; cada texto passa a ser traduzido no ponto em que é escrito |
| PDF | jsPDF 2.5.2 e AutoTable 3.8.4 via npm, com `gerarPDF(dados)` recebendo os dados em vez de ler globais | Mantém o desenho atual do PDF e os subsets Noto |
| Hospedagem | `vite build` escreve em `docs/`; GitHub Pages continua servindo `docs/` | Nada muda para quem acessa |
| Dados | Formato 14 do JSON do caso, que importa 9, 11 e 13 pelas migrações existentes e acrescenta a origem de cada valor | Casos salvos continuam abrindo |
| Testes | Vitest para o domínio (porta dos testes Node), Playwright para o fluxo (porta dos testes Python) | Mesmas verificações, mesma linguagem do projeto |

O que muda para a pessoa que usa: 25 perguntas no modo Essencial (as outras 26 viram premissas com valor padrão declarado e ficam no modo Refinar), quatro capítulos com abertura e síntese, o plano visível desde a primeira resposta, quatro páginas de plano em linguagem de gestor e a etiqueta de origem em todo número. O que não muda: os números que o motor calcula para um mesmo caso, as 66 regras de recomendação, a matriz camada × fase, os nove idiomas, o PDF e o vínculo institucional.

Observação: o README fala em versão 13 e o código grava `versao: 13`, mas o último commit se chama "Revisão v15: proposta B3". Esta especificação chama a nova base de v14 por ser a próxima depois do formato de dados 13; se houver uma v15 em andamento em outro lugar, o número é só um rótulo.

## Arquitetura alvo

Cinco camadas, das quais só duas são novas: a interface e o store. O domínio é o código que já existe, movido para módulos ES e chamado como funções puras; a exportação e o i18n são adaptados para receber dados em vez de ler globais e o DOM.

1. Interface (React + Prumo), nova: telas Início, Abertura, Pergunta, Síntese, Plano (4 páginas), Refinar; componentes do Prumo.
2. Store do caso (Zustand), novo: `caso`, `ctx`, `resp`, `respC`, `origem`, `modo`; seletores `planoDerivado`, `faltas`, `progresso`. Ações: responder, confirmar, refinar.
3. i18n, dicionários reaproveitados: `t(textoPT)` com os JSON de `i18n/` mesclados; sem MutationObserver; RTL por atributo `dir`.
4. Domínio, reaproveitado como módulos ES puros: `casos.cfgDoCaso`, `framework.casoEfetivo/perfilFinal/alertas`, `custos.calcular/avaliar/indicadores`, `prioridades.sugestoesProblemas`, `recomendacoes` (regras), `matriz`, `plano_dados`, `formula.explicacaoCusto`. Recebe o caso, devolve cfg, números, recomendações e matriz.
5. Exportação, adaptada: `gerarPDF(dados)` com jsPDF + AutoTable; JSON formato 14 que importa 9, 11 e 13. Build e hospedagem: `vite build` → `docs/` → GitHub Pages; Vitest (domínio) e Playwright (fluxo).

A regra de dependência é de cima para baixo: a interface só conhece o store e os componentes do Prumo; o store conhece o domínio; o domínio não conhece nada acima dele e nunca toca `document`, `window.S` ou `localStorage`. O único caminho de volta é o do domínio para o store, por valores de retorno. Essa separação é o que permite rodar o motor nos testes de Node sem navegador, exatamente como `tests/test_custos_v2.js` e `test_v9_motor.js` já fazem hoje.

Estrutura de pastas: `src/domain/` (os módulos reaproveitados, um arquivo por módulo atual, com `index.ts`), `src/store/`, `src/i18n/`, `src/ui/` (componentes do Prumo, um por pasta), `src/screens/` (uma pasta por tela), `src/export/` (PDF e JSON), `src/styles/tokens.css` (gerado de `design/redesign/prumo/tokens.json`), `public/` (logos, Figura 1, fontes Noto para o PDF), `tests/unit/` (Vitest) e `tests/e2e/` (Playwright). O `build.sh` e o `navegador.html` deixam de existir; `docs/index.html` passa a ser a saída do `vite build` com `base: './'`.

## Módulos reaproveitados

| Arquivo atual | Destino | Funções que a interface chama | Ajuste necessário |
| --- | --- | --- | --- |
| `custos.js` | `domain/custos.ts` | `calcular`, `resumo`, `avaliar`, `somaPorCamada`, `indicadores`, `orcamento`, `cenarios`, `tornado`, `simular`, `compLicenca`, `compArquiteturas`, `opcoes` | Nenhum: já é puro e tem `module.exports` |
| `casos.js` | `domain/casos.ts` | `cfgDoCaso(ce, perfil)`, `horasFormacaoEstimada`, `migrarCasoV10`, `CASO_VAZIO`, `CASOS`, `PREMISSAS_K1`, `PREMISSAS_V11` | Receber `derivarArquitetura`, `testeDe`, `papeisUsuarios`, `tarefasDe` por import em vez de globais |
| `framework.js` | `domain/framework.ts` | `casoEfetivo(c, tot)`, `perfisSugeridos`, `derivarArquitetura`, `testeDe`, `recomendarTeste`, `perfilFinal`, `alertas`, `OPC`, `DIMENSOES`, `PDS`, `DOSSIE`, `CONTRATO` | `fmtInt` deixa de usar a global `LOC()`: recebe o locale |
| `prioridades.js` | `domain/prioridades.ts` | `sugestoesProblemas`, `temLacuna`, `PRIORIDADES`, `PROBLEMA_POR_ID` | Nenhum |
| `matriz.js` | `domain/matriz.ts` | `matrizCaso`, `estadoCelula`, `camposDescidos`, `MATRIZ` | Hoje lê a global `S` e funções de `fluxo.js`; passa a receber `(caso, ctx, respC, numeros)` |
| `plano_dados.js` | `domain/plano_dados.ts` | `TIT_PLANO`, `RECS`, `ACOES_G`, `TXT_*`, `REFS_PLANO`, predicados `rec*` | Nenhum |
| `recomendacoes.js` | `domain/recomendacoes.ts` (regras) + `ui/Recommendation` | `recomendacoesCaso(caso, ctx, resp)` e `REGRAS_REC` | Separar `renderRecomendacoes`, `htmlRecs` e `cssRecs` (HTML) das regras; `recContexto` recebe o estado em vez de ler `S` |
| `formula.js` | `domain/formula.ts` + tela "Como o custo é calculado" | `explicacaoCusto(cfg)`, `secaoFormula` | Separar `renderFormula`, `fxTrocarAno`, `fxCss` |
| `resumo.js` | `domain/plano.ts` + telas do plano | `secoesPlano(estado)`, `dadosPlano`, `painelPlano`, `perfilCasoCartoes`, `secaoMatriz` | Separar `renderPlano`, `montarPlano`, `abrirPlano`; `secoesPlano` passa a receber o estado |
| `fluxo.js` (parte) | `domain/fluxo.ts` | `numerosCusto(cfg)`, `totaisCtx(ctx)`, `qOk`, `faltas`, `faltasTodas`, `padroesGerados`, `premissasUnitarias` | Extrair essas funções; o resto (acordeões, mandala, painel, eventos) é substituído |
| `fluxo_dados.js` | `domain/perguntas.ts` | `CAMPOS`, `PASSOS`, `FASES`, `CAMADAS`, `ETAPAS_ENS`, `NIVEIS_ADM` | Acrescentar a cada campo `essencial: true|false`, `capitulo`, `afeta: [ids de trechos do plano]` |
| `i18n.js` | `i18n/index.ts` | `tr` (vira `t`), `LOC`, `idiomaInfo`, `magnitudes`, `lerNumero`, `fmtEntrada`, `avisoTraducao`, `idiomaRevisado` | Remover `aplicarIdioma`, `traduzirArvore`, `observarIdioma`, `montarIdiomas` e tudo que toca o DOM |
| `plano_pdf.js` | `export/pdf.ts` | `gerarPDF(dados)`, `baixarPDF` | Recebe `{secoes, numeros, recs, caso, ctx, perfil, logos, lang}` em vez de ler `S` e o DOM |
| `custos_ui.js` | `screens/Refinar` + `domain/custos_ui.ts` | `moedaInfo`, `din`, `mil`, `grande`, `pct`, `unidMil`, `garantirOpc`, `csvCustos` (puras) | A calculadora completa é redesenhada como a tela Refinar; as funções de formatação ficam |
| `app.js` | `store/` + `export/json.ts` | `estadoInicial`, `dadosCaso`, `importarCaso`, `migrarEstadoV11`, `migrarEstadoV13`, `migrarV8`, `normalizarEstado`, `confirmarGerados` | As migrações viram funções puras `migrar(json) → estado`; os eventos de DOM somem |
| `inicio.js`, `shell.html`, `fluxo.css`, `inicio.css`, `idiomas.css`, `custos_v1.js` | Substituídos | `numerosCelula` e `camadasDaFase` (puras) vão para `domain/matriz.ts` | `custos_v1.js` já não entra no build |

Critério de separação: `grep -l "document\.\|innerHTML\|localStorage\|window\." src/domain/` precisa devolver vazio. Os três testes de Node atuais (`test_custos_v2.js`, `test_v9_motor.js`, `test_v10_formula.js`) são portados para Vitest na primeira etapa e têm de passar contra `src/domain/` antes de qualquer tela existir; `test_custos_v2.js` reproduz `numeros_v1.json` com 125 verificações e é a garantia de que os números não mudaram.

## Modelo de dados do caso

O formato 14 é o formato 13 mais três chaves novas (`origem`, `modo`, `capitulo`), de modo que `dadosCaso()` continua sendo o contrato de exportação e um caso v13 abre sem migração de conteúdo.

| Chave | Forma hoje (v13) | Na v14 |
| --- | --- | --- |
| `app`, `formato`, `versao`, `salvo` | `'ai-education-procurement-tool'`, 13, 13, ISO | `formato: 14`, `versao: 14` |
| `caso` | A forma de `CASO_VAZIO` (casos.js) | Igual |
| `ctx` | `nivel`, `nivelOutro`, `local`, `etapas{id:{on,escolas,anos[],alunos,soTotal}}`, `prioridades`, `problemas`, `subs`, `problemaOutro`, `olhando` | Igual |
| `resp`, `respDet` | `g-comite` … `g-compras` em sim/parcial/nao/nao_sei; detalhes `{qual, falta}` | Igual |
| `respC` | `{campo: true}` e `'piloto.escolas': true` para subcampos: a confirmação | Mantido por compatibilidade, mas derivado de `origem` |
| `revisar`, `feitos`, `custo`, `moeda`, `lang` | Campos do 2.2 a rever; passos abertos; `{base, cfg, editado}`; `{cod, taxa}`; idioma | `feitos` vira derivado; os demais iguais |
| `origem` (novo) | — | `{campo: 'padrao' | 'sugerido' | 'informado' | 'refinado'}` para todo campo e subcampo |
| `modo` (novo) | — | `'essencial' | 'refinar'` |
| `capitulo` (novo) | — | `{atual: 1..4, pergunta: id}`: substitui `fase` e `passo` |

Derivação de `origem` na importação de um caso v13: se `respC[campo]` é verdadeiro, `informado`; se o valor difere de `CASO_VAZIO` e não está confirmado, `sugerido` (os valores que `aplicarPadroes`, `aplicarProblemas` e `aplicarSugestoes` gravam hoje); caso contrário, `padrao`. `refinado` só nasce no modo Refinar. A importação de 9 e 11 passa por `migrarEstadoV11` e `migrarEstadoV13`, depois pela derivação; a v8 passa por `migrarV8`. A chave do `localStorage` passa de `aiedu-procurement-v9` para `aiedu-procurement-v14`, lendo a antiga uma vez e migrando.

As sugestões continuam gravadas no estado antes de confirmadas e entram no motor (é o que faz o plano reagir cedo); `origem` marca o valor como `sugerido`, a `SourceTag` mostra, e `recValor` e `respP` (que hoje tratam o valor não confirmado como vazio) passam a usar o critério único `origem[campo] !== 'padrao'` em vez de `respC`.

## Mapa das 51 perguntas para as 24 do Essencial

Destino: Essencial (E), Refinar (R) ou deixa de ser pergunta (—). A premissa padrão é o que o motor já assume hoje quando a pergunta não é respondida, com a função de origem; a v14 não inventa padrões novos, só os declara na interface.

| Nº | Pergunta (chave no estado) | Destino | Cap. | Premissa padrão quando não respondida (origem no código) |
| --- | --- | --- | --- | --- |
| 1.1.1 | Nível administrativo (`ctx.nivel`) | E | 1 | — |
| 1.1.2 | Nome da rede (`ctx.local`) | E | 1 | — |
| 1.1.3 | Em que ponto está (`caso.situacao`) | E | 1 | `'nova'` (`CASO_VAZIO`), usado por `alertas` e `instrumentosCaso` |
| 1.1.4 | Etapas atendidas (`ctx.etapas[id].on`) | E | 1 | — |
| 1.1.5 | Escolas e estudantes por etapa | E, só totais | 1 | Detalhe por ano vai para R. Sem números: elegíveis 1000 e escolas = ceil(n/400) (`casoEfetivo`, `PREMISSAS_V11.pessoasPorEscola`) |
| 1.2.1 | Prioridade (`ctx.prioridades`) | E | 1 | — |
| 1.2.2 | Problemas (`ctx.problemas`) | E, até 3 | 1 | Subcategorias e "outro problema" vão para R; sem problemas nada é sugerido (`sugestoesProblemas`) |
| 1.2.3 | Título curto (`ctx.olhando`) | — (gerado) | 1 | Sugerido do 1º problema (`aplicarProblemas`); editável na capa |
| 1.2.4 | Situação atual (`caso.problema`) | E | 1 | Modelo com lacunas `__`; texto com lacuna não conta (`temLacuna`) |
| 1.2.5 | Impacto desejado (`caso.impactos`) | E | 1 | Sugerido pela união dos impactos dos problemas |
| 1.2.6 | Resultado esperado (`caso.resultado`) | R | — | Sugerido dos objetivos; dispara `metas-lacunas` |
| 1.2.7 | Linha de base (`caso.linhaBase`) | E | 1 | `'nao'` (`CASO_VAZIO`); detalhes vão para R |
| 1.2.8 | Alternativa sem IA (`caso.alternativa`) | E | 1 | Vazio → `alternativaSemIA=false` → alerta de atenção (`alertas`); a regra `alternativa` só dispara com 'nao'. Fica no Essencial (decisão de 28/10/2026) |
| 1.3.1–1.3.6 | Governança (`resp['g-*']`) | E, uma tela | 1 | Sem padrão: `undefined` não gera ação (`ACOES_G`). Os 12 detalhes `respDet` vão para R |
| 2.0 | Prova de conceito ou piloto (`caso.testes`) | E | 2 | `[]` → ramo do piloto: E0 = max(50, 5% de E), 4 meses (`cfgDoCaso`) |
| 2.1.1 | O que a IA faz (`caso.tarefas`) | E | 2 | Sugerido pelos problemas; uma das 3 de `faltasEstimativa` |
| 2.1.2 | Nome da aplicação (`caso.titulo`) | R | — | `'Seu caso'`; título do plano cai para `olhando` |
| 2.2.1 | Quem usa (`caso.usuarios`) | E | 2 | `perfisSugeridos`; sem usuários: elegíveis 1000 e `modeloDisp='um_por_usuario'` |
| 2.2.2 | Quem é afetado (`caso.afetados`) | E, com 2.2.3 | 2 | Sugerido pelas tarefas; perfil 'pessoas' limitado |
| 2.2.3 | O que fazem com a resposta (`caso.consequencias`) | E | 2 | `['nenhuma']` (`CASO_VAZIO`) |
| 2.2.4 | Frequência (`caso.frequencia`) | R | — | `'semanal'` (`CASO_VAZIO`, `perfilAutomatico`) |
| 2.3.1 | Quantas ferramentas (`caso.nFerramentas`) | R | — | `'1'` sugerido quando o 2.0 tem resposta (`padroesGerados`) |
| 2.3.2 | Já sabe quais (`caso.conheceFerramentas`) | R | — | `''`; só controla o 2.3.3 |
| 2.3.3 | Lista de ferramentas (`caso.ferramentas[]`) | R | — | Sem preço: SaaS a US$ 9,00/usuário/mês (`PRESETS.A.saas.preco`) ou 13,00 por usuário (`cfgDoCaso` §4) |
| 2.3.4 | Tipo de tecnologia (`caso.tipoTec`) | E, com "não sei" | 2 | `''` → arquitetura presumida (`derivarArquitetura`, SaaS); uma das 3 de `faltasEstimativa` |
| 2.3.5 | Pagamento (`caso.pagamento`) | E, sugerido | 2 | `PAG_LIC[tipoTec][0]`; vazio no SaaS: preço 9,00 e quantidade = E |
| 2.3.6 | Licença (`caso.licenca`) | R | — | `PAG_LIC[tipoTec][1]`; vazio: verificabilidade 'parcial' no SaaS |
| 2.3.7 | Adaptação (`caso.adaptacao`) | R | — | `''` → `fatoresAdaptacao` neutro {1, 1}, nível do preset |
| 2.3.8 | Tamanho e duração do teste (`caso.poc`, `caso.piloto`) | E, sugerido | 2 | PoC {15, 2}; piloto escolas = min(esc, max(3, min(30, 5% esc))), 5% da base, 4 meses (`padroesGerados`); vazio no motor: E0 = max(50, 5% E), m0 = 4 |
| 2.4.1 | Internet (`caso.internet`) | E | 2 | `''` tratado como 'sim' no custo (`cfgDoCaso` §7), mas `RECS` p-conect disparam com `!=='sim'`: corrigir (vazio = 'sim' nos dois) |
| 2.4.2 | Escolas com internet (`caso.escolasInternet`) | E, condicional | 2 | `''` → 50% sem internet (`PREMISSAS_V11.semInternetParcial`); US$ 600/escola/ano (`PREMISSAS_K1.conectEscolaAno`) |
| 2.4.3 | Dispositivos (`caso.modeloDisp`) | E | 2 | `''` → 'compartilhado' se estudantes usam, senão 'um_por_usuario' (§8); 3 estudantes por dispositivo; 30 por escola no rotativo |
| 2.4.4 | Dispositivos existem (`caso.dispExistem`) | R | — | Sugerido 'sim' se `proprio`; vazio → lacuna 0; `precoDispositivo=300` |
| 2.5.1 | Quem será formado (`caso.formados`) | E, com 2.5.4 | 2 | `[]` → bloco pulado e K4.4 do preset integral; com papéis: 20 professores, 2 gestores, 1 administrativo por escola, técnica max(3, ceil(esc/50)), rotação 10% |
| 2.5.2 | Tipo de formação (`caso.formacaoTipo`) | R | — | `[]`; só regras e plano |
| 2.5.3 | Formato (`caso.formacaoFormato`) | R | — | `''` → fator 1 (presencial); híbrida 0,8; online 0,5 |
| 2.5.4 | Horas (`caso.formacaoHoras`) | E, com estimativa | 2 | `''` → horas do preset (A 3, B 1,5, C 2; `horasFormacaoPorArq`); custo/hora A 12, B 10, C 12 |
| 2.5.5 | Quem paga (`caso.formacaoPaga`) | R | — | `''` → desembolso da rede; fornecedor ou parceiro viram insumo cedido |
| 2.6.1 | Quem dá suporte (`caso.suporteQuem`) | R | — | `''` → como 'rede' (§10); fornecedor: ×0,25 + taxa (básico 0, ampliado 2, dedicado 5) |
| 2.6.2 | Nível de suporte (`caso.suporteNivel`) | E | 2 | `''` → 'ampliado' (fator 1); básico 0,5; dedicado 2 |
| 2.6.3 | Acompanhamento (`caso.acompanhamento`) | R | — | `''` → 'regular' (fator 1); leve 0,5; intensivo 1,5 |
| 3.1.1 | Primeira etapa (`caso.implantacao`) | E, sugerido | 3 | 1/3 dos elegíveis e das escolas (`padroesGerados`, `implantacaoFracao`) |
| 3.2.1 | Arquitetura (`caso.arquitetura`) | R | — | `''` → `derivarArquitetura` (aberta → ow; consumo → api; senão saas), `__arqPresumida` |
| 4.1.1 | Pessoas em toda a rede (`caso.elegiveis`) | E, sugerido | 4 | Estudantes das etapas, ou estudantes/25, ou 1000 (`casoEfetivo`, `__elegPadrao`); uma das 3 de `faltasEstimativa` |
| 4.1.2 | Em quanto tempo (`caso.expansao`) | E | 4 | `'ano1'` (`CASO_VAZIO`) |
| 4.1.3 | Horizonte (`caso.horizonte`) | R | — | 3 anos (`CASO_VAZIO`), mantido na v14 (decisão de 28/10/2026); mockups e previews que diziam "5 anos" passam a dizer "3 anos" |
| 4.2 | Estimativa | — | Quanto custa | Calculadora, cenários, tornado e Monte Carlo em Refinar |
| 4.3 | Recomendações | — | O que fazer | `recomendacoesCaso` igual |

Contagem: 25 no Essencial (1.1.1, 1.1.2, 1.1.3, 1.1.4+1.1.5, 1.2.1, 1.2.2, 1.2.4, 1.2.5, 1.2.7, 1.2.8, governança, 2.0, 2.1.1, 2.2.1, 2.2.2+2.2.3, 2.3.4, 2.3.5, 2.3.8, 2.4.1+2.4.2, 2.4.3, 2.5.1+2.5.4, 2.6.2, 3.1.1, 4.1.1, 4.1.2). Três respostas continuam sendo o mínimo para o primeiro número (`faltasEstimativa`: tarefas, tipo de tecnologia e elegíveis), todas no Essencial; como `elegiveis` é sugerido, o primeiro número aparece ao confirmar 2.3.4.

As perguntas que hoje "descem" para o passo 3.1 (`camposDescidos`: `frequencia`, `licenca`, `adaptacao`, e na PoC `afetados` e `consequencias`) deixam de mudar de lugar: as três primeiras estão em Refinar e as duas últimas ficam sempre no capítulo 2, porque alimentam o perfil de risco em qualquer modo de teste.

## Comportamentos que fazem a narrativa

O plano reage a cada resposta. `PlanPanel` é uma projeção do store: o seletor `planoDerivado` recalcula `secoesPlano`, `numerosCusto`, `recomendacoesCaso` e `painelPlano` a cada mudança, com memoização por campo. O vínculo resposta → trecho vem de `REGRAS_REC[].campo`/`ir` e de `secoesPlano`; a v14 declara isso em `CAMPOS[id].afeta = ['kpi.ano0', 'A1', 'rec:internet-parcial', …]`. Ao gravar uma resposta, o store compara o plano anterior e o novo e marca em `recente` os trechos que mudaram; o painel realça o primeiro com `accent` por dois segundos (`prefers-reduced-motion`: só a borda) e rola até ele. Só um item em âmbar por vez: KPI antes de recomendação.

Sugestões e origem. `padroesGerados`, `aplicarProblemas` e `aplicarSugestoes` continuam gravando no estado por uma única função `sugerir(campo, valor, deQuem)`, que grava o valor e `origem[campo] = 'sugerido'`. "Aceitar a sugestão e continuar" marca `informado` sem mudar o valor; editar marca `informado`; Refinar marca `refinado`. Um valor sugerido que a pessoa nunca vê fica `sugerido` e aparece assim no plano.

Abertura e síntese de capítulo. `ChapterOpening` e `ChapterSummary` fora da sequência de perguntas. A síntese é gerada por `sinteseCapitulo(n, estado) → {paragrafos[], kpi?, nRecs}`, pura, a partir dos "fatos do caso" de `painelPlano`, com uma frase-modelo por fato e por idioma. Sem veredito: o capítulo 2 mostra o KPI do Ano 0, o 3 o do Ano 1, o 4 o total; o 1 não mostra número.

Modos Essencial e Refinar. Um único store, um campo `modo`. No Essencial as telas percorrem `CAMPOS.filter(c => c.essencial)`; as demais perguntas ficam `padrao`. No Refinar, todo número tem "de onde vem?", que abre um `Popover` com as premissas (`premissasUnitarias`, `explicacaoCusto`) e os botões "Ajustar premissas" e "Ir à pergunta". A tela Refinar é a calculadora atual em três abas (Premissas por ano; Ferramentas e licenças; Cenários e sensibilidade), consumindo `opcoes`, `cenarios`, `tornado` e `simular` sem mudança. Trocar de modo não apaga nada.

Nada bloqueia. Toda pergunta tem "Pular por agora"; `faltasTodas` produz as pendências; "Baixar PDF" fica habilitado desde o início com o número de lacunas no rótulo.

Celular. Abaixo de 1100 px o `PlanPanel` vira `PlanDrawer` (resumo "Seu plano · 1 número novo · 2 recomendações · 13 lacunas" e o KPI mais recente); abaixo de 900 px a `ChapterNav` vira `ChapterBar`. A gaveta prende o foco e fecha com Esc. `DataTable` vira cartões empilhados abaixo de 640 px; nada rola horizontalmente.

## Árvore de componentes por tela

| Tela | Rota | Componentes | Mockup |
| --- | --- | --- | --- |
| Início | `/` | `Header` · hero com `Button` · quatro cartões de capítulo · `PlanPanel` vazio · `Alert` de caso salvo | D1, M1 |
| Abertura de capítulo | `/capitulo/:n` | `Header` · `ChapterBar` · `ChapterOpening` · `Button` | D2 |
| Pergunta | `/capitulo/:n/:pergunta` | `Header` · `ChapterNav` (≥ 900 px) ou `ChapterBar` · `QuestionFrame` · um controle (`TextField`, `OptionCard`, `Chip`, `Segmented`, `SchoolsGrid`, `PilotSize`) · `Button` · `PlanPanel` (≥ 1100 px) ou `PlanDrawer` | D3–D6, M2, M3 |
| Síntese de capítulo | `/capitulo/:n/sintese` | `Header` · `ChapterBar` · `ChapterSummary` com `KpiTile` · `Button` | D7 |
| Plano · Em resumo | `/plano` | `Header` (Voltar, Modo, Exportar, Baixar PDF) · `PlanIndex` · capa · `Callout` · 4 `KpiTile` com `SourceTag` · `LayerBars` · 3 `Recommendation` | D8, M4 |
| Plano · Quanto custa | `/plano/custa` | `PlanIndex` · fórmula · `Alert` no Refinar · `DataTable` por camada e ano com `SourceTag` · `Popover` "de onde vem?" · `LayerBars` · dotação por exercício | D10 |
| Plano · O que fazer | `/plano/fazer` | `PlanIndex` · 5 `Recommendation` · listas por momento com `RiskPill` | D9 |
| Plano · O que exigir | `/plano/exigir` | `PlanIndex` · arranjo de aquisição · `RiskPill` de diligência · cláusulas | D11 |
| Apêndice | `/plano/apendice` | `PlanIndex` · perfil do caso (`perfilCasoCartoes`) · matriz · Figura 1 com `Dialog` · referências · respostas que faltam | sem mockup |
| Refinar | `/refinar/:aba` | `Header` · abas · `DataTable` editáveis · gráficos · `Toast` | sem mockup; segue o Prumo |

Componentes de estrutura a escrever: `QuestionFrame`, `PlanDrawer`, `PlanIndex`, `SchoolsGrid`, `PilotSize`. Mapeamento por `CAMPOS[id].tipo`: `radio` → `OptionCard`; `chips`, `multi` → `Chip`; `seg` → `Segmented`; `texto`, `area`, `num`, `horas` → `TextField`; `etapas`, `grade` → `SchoolsGrid`; `setup`, `implant` → `PilotSize`; `prior`, `problemas` → `OptionCard` com subtexto e `Chip` em grupos; `ferramentas`, `testes`, `arq` ficam em Refinar.

## Tokens e tema

A fonte de verdade é `design/redesign/prumo/tokens.json`; `scripts/tokens.ts` (no `prebuild`) o compila para `src/styles/tokens.css`, idêntico a `design/redesign/mockups/prumo.css`. Nenhum hex em componente: todo valor é `var(--nome)`. O tema escuro é `data-theme="dark"` no `<html>`, escolhido por `prefers-color-scheme` e guardado em `localStorage`; os logos ficam sempre sobre placa `#ffffff` (a única exceção aos tokens). Fontes IBM Plex Sans (400, 500, 600) e Serif (500, 600) pelo Google Fonts; Noto por idioma para árabe, chinês e bamanankan por `<link>` condicional. Nunca abaixo de 13 px. Pontos de quebra: 1100 (painel vira gaveta), 900 (navegação vira barra), 640 (tabelas viram cartões), 400 (largura mínima, sem rolagem horizontal nem fonte menor).

## Idiomas, PDF e exportação

i18n: português como chave, inglês inicial. A mesclagem do `build.sh` vira `scripts/i18n.ts` que gera `src/i18n/<l>.json`, carregado sob demanda. `tr` vira `t(textoPT, vars?)` com as mesmas cinco tentativas de correspondência; MutationObserver, `traduzirArvore` e `observarIdioma` somem. Textos novos em `i18n/v14_<l>.json` para en, es, fr; os cinco preliminares caem para o inglês com o aviso mantido. `test_idiomas.py` continua rodando sobre o build. RTL por `dir="rtl"` e propriedades lógicas.

PDF: `gerarPDF({secoes, numeros, recs, caso, ctx, perfil, lang, logos})` sem ler `S`, `window.jspdf` ou o DOM; jsPDF 2.5.2 e AutoTable 3.8.4 do npm; subsets Noto (`tools/subset_fonts.py`) gerados no build. Ordem: capa, Em resumo, Quanto custa, O que fazer, O que exigir, apêndice; A1–A7 e B1–B9 continuam dentro das páginas com os títulos de `TIT_PLANO`. Cada número leva a origem em texto; a capa diz "Estimativa com N premissas padrão". `test_v12_pdf.py` e `test_v13_plano.py` portados com a nova ordem.

JSON: `dadosCaso()` grava `formato: 14` com `origem`, `modo`, `capitulo`; `importarCaso` aceita 9, 11, 13, 14 e v8. Download por `CAP.downloads.save` no artefato e `<a download>` no Pages. `csvCustos` fica no Refinar; `dl-md` e `dl-html` são removidos.

## Plano de migração

1. Base e domínio: projeto Vite com TypeScript na branch `redesign-v14`; módulos puros em `src/domain/`; porta de `test_custos_v2.js`, `test_v9_motor.js` e `test_v10_formula.js` para Vitest. Aceite: os três passam; `numeros_v1.json` reproduzido com 125 verificações; `grep` de DOM em `src/domain/` vazio.
2. Store, origem e migrações: `sugerir`, `responder`, `confirmar`, `refinar`; seletores; porta das migrações e derivação de `origem`. Aceite: os exemplos A–D e as fixtures importam com `numerosCusto` idênticos aos da v13 (regressão gerada a partir do `navegador.html` atual).
3. Prumo e componentes: tokens em CSS, 19 componentes com os previews como fixture, mais `QuestionFrame`, `PlanPanel`, `PlanDrawer`, `PlanIndex`, `SchoolsGrid`, `PilotSize`. Aceite: galeria com todos os estados; axe sem violações; contraste nos dois temas.
4. Telas do percurso: início, abertura, 24 perguntas, sínteses, painel reagindo. Aceite: porta de `test_v9_fluxo.py` e `test_v13_fluxo.py`; primeiro número ao confirmar 2.3.4.
5. Plano, Refinar e PDF. Aceite: porta de `test_v9_plano.py`, `test_v10_recs.py`, `test_v12_pdf.py`, `test_v13_plano.py`, `test_v13_idiomas.py`; soma das células da matriz igual ao total; PDF em nove idiomas.
6. Publicação: `vite build` para `docs/`; v13 em `docs/v13/` por um ciclo; README e `plano/11_v14.md`; tag `v14.0`. Aceite: `test_idiomas.py` limpo; Lighthouse de acessibilidade acima de 95; um caso v13 abre na v14 com os mesmos números.

Etapas 3 e 4 podem andar em paralelo com a 2. Fora da v14: guia impresso, revisão das traduções preliminares, mudanças no motor ou nas 66 regras, integração com Claude para estruturar a descrição.

## Riscos e pontos em aberto

| Risco | Efeito | Mitigação |
| --- | --- | --- |
| Módulos "puros" leem globais escondidas (`S`, `LOC()`, `esc`, `cfgAtual`, `moedaInfo`) | Falha silenciosa ao mover para ES modules | `test_v10_formula.js` lista os stubs; cada global vira parâmetro ou import; a etapa 1 só fecha com o `grep` vazio |
| `t()` explícito deixa escapar textos | Português em EN/ES/FR | `test_idiomas.py` em cada build; lint proíbe string literal em JSX fora de `t()` |
| Sugestões no estado mudam o custo sem a pessoa perceber | Número "aparece do nada" | Comportamento desejado; `SourceTag` junto de todo número; teste de fluxo verifica a etiqueta |
| `internet` vazio é 'sim' no custo e "não sim" nas recomendações | Recomendação sem custo correspondente | Padronizar vazio = 'sim'; registrar em `plano/11_v14.md` |
| jsPDF e subsets Noto no bundle | Build pesado, PDF lento no celular | Import dinâmico de `export/pdf.ts` e das fontes ao clicar em Baixar PDF |

Decisões em aberto: arquitetura fora do Essencial e limite de três problemas (comentários no modelo de UX). Decididos em 28/10/2026: React mantido; horizonte padrão 3 anos; alternativa sem IA (1.2.8) fica no Essencial, o que leva o caminho a 25 perguntas.

Referências: `design/redesign/` na branch `redesign-v14`; código analisado da `main` em 27 de outubro de 2026 (commit "Revisão v15: proposta B3").
