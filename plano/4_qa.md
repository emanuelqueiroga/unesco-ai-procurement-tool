# QA da versão 9 — revisão como usuária (EN e PT, 1400 px e 400 px)

Revisor: agente de QA. Nenhum arquivo de `src/`, `i18n/` ou `build.sh` foi alterado.
Build testado: `/home/claude/app/navegador.html` (6 out. 2026, 11:59).
Capturas, PDFs, textos extraídos e scripts: `/tmp/claude-0/qa9/` (scripts em `/tmp/claude-0/qa9/s/`).

## Como foi testado

- **Caso em branco percorrido com cliques reais** (`s/walk.py`), em `en` e `pt`, 1400 px e 400 px: 1.1 com os estudantes digitados por ano (fund2 e médio, 420/380 escolas, 41000…45000), 1.2 com o domínio, a disciplina, o problema, os impactos + "Outro" com texto, a linha de base e a alternativa; 1.3 com as seis respostas e o ⓘ aberto; 2.0 = "I don't know, recommend one for me"; 2.1 com aulas + tutoria + "Outra" com texto; 2.2 com as sugestões confirmadas; 2.3 com pago, por usuário, assinatura, adaptação, complementar e 20/1.200/4; 3.1 com o botão "Usar o total de estudantes", 2 anos e 5 anos; 3.2; 3.3; geração do plano; download do PDF (doc.save → download do Playwright); exportação pela área de transferência e importação numa página nova (`set_input_files`).
- **Exemplos A–D**: plano gerado em EN/PT (1400 e 400) e em ES/FR (1400); PDF baixado em EN/ES/FR (e PT para B), lido com `pdftotext` e renderizado com `pdftoppm` (`s/exemplos.py`).
- Verificações adicionais: efeito da adaptação no custo (`s/adapt.py`), stepper no celular em 4 idiomas (`s/stepper.py`), transbordamento de texto e rolagem horizontal em 4 idiomas (`s/overflow.py`), títulos com gerúndio (`s/heads.py`), sugestões depois de confirmadas (`s/sug.py`), ⓘ e textos removidos (`s/info.py`), salto de rolagem, perda de texto digitado, troca de idioma e colagem de números (`s/misc.py`).
- Testes existentes, todos verdes: `test_custos_v2.js` (125), `test_v9_motor.js` (313), `test_v9_fluxo.py`, `test_v9_plano.py`, `test_v9_numeros.py` (108), `test_idiomas.py` (0 restos). **Os testes verdes deixam passar os defeitos P1 abaixo**: `test_idiomas.py` não procura "mil"/"mi", e nenhum teste confere o stepper com 400 px nem o sentido do efeito da adaptação.
- Console: só os dois `ERR_TUNNEL_CONNECTION_FAILED` do Google Fonts (sem rede no sandbox). Nenhum `pageerror`.

---

## 1. Avaliação → resultado

| # | Linha da avaliação | Resultado | Evidência | Sugestão de correção (arquivo / função) |
|---|---|---|---|---|
| 2 | "clica em um botão e ele gera o procurement plan" | PASS | Botões visíveis no stepper, no painel, na chamada final, no rodapé da fase 3 e no 3.3; o clique abre `#plano` no topo (`plan_scroll = 0`). `en_d_24_plan_top.png` | — |
| 3 | "break down the number of students by grade" | PASS | Os campos por ano aparecem logo ao marcar a etapa; "Level total: 160,000"; "Enter only the level total" alterna e volta sem perder valores. `en_d_11_step11.png`, `en_m_11_step11_sheet.png` | — |
| 4 | "pontos e vírgulas nos valores de entrada" | PASS | Durante a digitação: EN "41,000", PT "41.000", FR "12 345 967"; inserir um dígito no meio mantém o cursor (posição 8); a troca de idioma reformata; colar "12,500" dá 12500. | — |
| 5 | "check quando respondido também dentro do valor" | PASS | `.qn::after` = " ✓" só quando respondida; `.ok-in` = `none` em campo vazio e `block` em campo preenchido; ✓ nos rádios, chips e no segmentado. `en_d_11_step11.png`, `en_d_14_step13.png` | Polimento: a opção marcada mostra o ponto do rádio e o ✓ ao mesmo tempo (redundante). |
| 6 | "pergunta did you?" | PASS | 1.3.1 "Does your network have…", 1.3.2 "Do you have…", 1.3.3 "Did you identify…", 1.3.5 "Did you publish…". `en_d_14_step13.png` | — |
| 7 | Bloco de legislação e política de dados | PASS | 1.3.3 e 1.3.4 no formato novo, com "Example:" e sem "essential". | — |
| 8 | "dar um exemplo… vc tem uma AI education policy?" | PASS | Todas as perguntas 1.3 têm exemplo; 1.3.2 = "Do you have an AI in education policy or strategy?". 11 perguntas fora de 1.3 não têm a linha "Example:" (1.1.3, 1.1.4, 1.2.1, 1.2.2, 1.2.5, 2.0, 2.1.1, 2.1.2, 2.2.4, 3.1.2, 3.1.3), mas as opções delas trazem subtexto com exemplos. | Opcional: acrescentar `ex` em `CAMPOS` (`fluxo_dados.js`) para 1.2.5 e 2.0. |
| 9 | "adicionar o número das perguntas" | PASS | Todas as perguntas têm número no padrão `n.n.n`, além de 2.0. | — |
| 10 | Unir departamento e instância | PASS | Pergunta única 1.3.1 "team or body … brings several areas together". | — |
| 11 | Não usar orçamento e monitoramento no início | PASS | O passo 1.3 tem 6 perguntas e nenhuma sobre orçamento ou M&A; a fonte de recursos está em 3.2.2; o monitoramento está em B8. | — |
| 12/27 | PoC antes do piloto; PoC e piloto num passo; perguntar no início | PASS | A fase 2 abre com a pergunta 2.0, com três opções. `en_d_15_phase2_top.png` | — |
| 13 | Destaque para "Learning to know and do" | PASS | O lema aparece em negrito com 17,6 px; "Qualification" vem abaixo, com 14,4 px (a dica tem 13,4 px). `en_d_13_step12.png` | — |
| 14 | Recomendações e diagnóstico só no fim | PASS | Os passos não mostram veredito, alertas, perfil de risco nem "Conditions"; tudo isso está em B1–B9. | — |
| 15 | Sem resultado parcial por fase | PASS | O rodapé da fase mostra só o progresso e o botão ("Phase 1 complete"). | — |
| 16 | Retirar as funções não terceirizáveis | PASS | Saíram do 1.3; aparecem em B2 do plano. | — |
| 17 | "tirar a parte de perguntas no final" | PASS | O plano não tem "Your answers"/"Suas respostas" (verificado por grep em todos os planos e PDFs). | — |
| 18 | Mandala verde no que foi feito | PASS | 1.1 fica `m-ok` logo ao completar; a camada 1 fica verde depois do 1.3; tudo fica verde no fim. `en_d_15_phase2_top.png`, `en_d_24_plan_top.png` | — |
| 20/21 | Orientado à educação; planos de aula…; "Outra" | PASS | 2.1 tem 10 tarefas educacionais, cada uma com exemplo; "Other" abre um campo e o texto é gravado. `en_d_17_step21.png` | — |
| 22 | Eliminar o grau de autonomia | PASS | Só aparece como premissa derivada em B5. | — |
| 23 | ⓘ com referência à UNESCO / documento | PASS | Os ⓘ de 1.3, da abertura da fase 2, de 2.1, 2.2, 2.3, 3.3 e da mandala abrem nota com link `https://unesdoc.unesco.org/ark:/48223/pf0000399348` (`target=_blank`). | — |
| 24 | Explicar a camada 2 | PASS | Há texto de abertura da fase 2 e ⓘ c2 ("This is what teachers, students and school leaders see and use…"). | — |
| 25 | Arquitetura e piloto gratuito cedo demais | PASS | A arquitetura fica só no `<details>` "For technical teams" do 2.3; "free" é uma opção de pagamento. | — |
| 26 | Impacto com opções e "Outro" escrito | PASS | Em 1.2.5, "Other" abre um campo e grava `impactoOutro`, que aparece no plano. | — |
| 28 | Opção "recomende para mim" | **PARTIAL** | A1 diz "Recommendation: start with a proof of concept… There is a task outside the list". Porém, no caso em branco (e no exemplo C), o resumo mostra **"Schools in the test: —"** apesar das 20 escolas digitadas, e B3/B4 dizem "without real users" para um teste configurado com 1.200 participantes. | Ver P1-4 e P2-6. |
| 29 | 2.2 já marcada com os perfis da tarefa | **PARTIAL** | Funciona antes da confirmação (`en_d_18_step22.png`). Depois de "Confirm and continue", trocar a tarefa de "lesson plans" para "tutoring" deixa 2.2 em "Teachers only / use as support" sem nenhum aviso. | Ver P1-3. |
| 30/31 | Nomes "User experience" e "Applications" | PASS | Passos 2.2 e 2.1. | — |
| 32–34 | Tirar dados, vulneráveis e idiomas | PASS | Nenhum desses controles aparece no percurso. | — |
| 35 | Nível de adaptação no custo | **FAIL** (sentido errado) | A dica do 2.3.4 diz "More adaptation increases deployment and maintenance costs", mas escolher "Custom development" troca a arquitetura derivada de SaaS para API e o custo total **cai** de 70 a 80 %: A 4,75 M → 0,82 M; C 1,64 M → 1,00 M; D 1,82 M (integration) → 0,58 M (custom); caso em branco 106 M → 31 M (`s/adapt.py`). Entre config e content, o total do painel não se mexe (4,68 M → 4,68 M). | Ver P1-1. |
| 36 | Verificabilidade e contestação viram recomendação | PASS | B6 traz "Require information to verify…" e os seis elementos da contestação. | — |
| 37/38 | Separar custo de policy; foco em custo e compra | PASS | Ordem do plano e do PDF: resumo, A (A1–A8), B (B1–B9), referências. | — |
| 39/42 | Regras do piloto e capacidade mínima viram recomendação | PASS | B3 e B4. | — |
| 40/41/43 | Etapa de adoção com tecnologia pública/paga, pagamento, licença e adaptação; setup do teste | PASS | Perguntas 2.3.1 a 2.3.6. `en_d_19_step23.png`, `en_m_19_step23_sheet.png` | — |
| 44 | Usar o TCO do documento para estruturar | PASS | Selos de camada, anel externo da mandala, A3 com as 7 camadas e páginas, referência no rodapé. | — |
| R | Sem restos de português em EN/ES/FR (interface e PDF) | **FAIL** | EN: "Year 0 (USD mil)", "Appropriation to request (USD mil)", "Estimated transition and exit cost: US$ 162 mil", "US$ 2.65 mi" (plano e PDF). FR: os mesmos "USD mil" e "US$ 112,9 mil". Em ES, "mil" é correto. Os PDFs em EN/FR também trazem "Cátedra UNESCO UNITWIN de Inteligência Artificial Desplugada na Educação". O passo 3.3 mostra "USD THOUSAND", ou seja, a mesma tabela tem unidades diferentes no passo e no plano. | Ver P1-2. |
| R | Nomes de seção sem gerúndio | **FAIL (EN)** | "B7 Before scaling to the school system and to sustain", "Before taking it to the school system", "Learn before committing", "B8 Monitoring and evaluation". PT, ES e FR estão OK. | Ver P2-1. |
| R | Sem erro de console | PASS | Só os 2 erros de fonte por falta de rede. | — |
| R | Sem rolagem horizontal | PASS | `scrollWidth` = largura da tela em todos os passos e no plano, nos 4 idiomas, com 1400 e 400 px. | — |
| R | Sem transbordamento ou sobreposição de texto | **FAIL (celular)** | Com ≤480 px, o rótulo do stepper fica por cima do círculo do número e da barra de progresso ("Proof of concept or pilot", "Life-cycle cost"), nos 4 idiomas. `en_m400_stepper.png`, `fr_m360_top_exB.png`, `en_m_24_plan_top.png`. Nos KPIs do plano em PT/ES, o valor "US$ 336,2 mil" passa da borda do cartão (162 > 147 px), `pt_d_planB_kpis.png`. | Ver P1-5 e P2-4. |
| R | Nada fala em nome da UNESCO | PASS | Faixa: "The views and recommendations are those of this tool and not of UNESCO"; a referência diz "Paper commissioned by UNESCO; the views are those of the authors"; há a isenção completa. | — |
| R | Notas de valores ilustrativos | PASS | Aparecem no painel, no 3.3, em A2, nas premissas de A2 ("illustrative convention of the tool") e na faixa da capa do PDF. | — |
| R | Números plausíveis | **PARTIAL** | Exemplos A–D batem com os presets. O caso em branco (rede estadual, 300 mil estudantes do 6º ao 12º ano, licença por usuário, 5 anos) dá **US$ 151 M** no ciclo e US$ 243 por usuário ativo por ano. A camada 2 sozinha soma 112 M, porque se aplica a cada estudante o preço nominal do copiloto para professores do Exemplo A (US$ 13/mês × 1,15). Além disso, antes de chegar a 3.1 o painel já mostra 106 M, porque `elegiveis` assume todos os estudantes. | Ver P1-6. |
| U | Ida e volta de exportação e importação | PASS (com ressalva) | Exportar pela área de transferência, salvar e importar reproduz `caso`, `ctx` e `resp` idênticos, com o toast "Case imported.". Fora do claude.ai, porém, "Export case" no painel só copia o JSON, e "Import case" só aceita arquivo. | Ver P2-5. |
| U | Salto de foco ou rolagem; perda do que foi digitado | PASS | Clicar em rádios no 2.3 com 400 px não move o elemento (367→367 px). "Continue to 1.2" leva o próximo passo para logo abaixo do cabeçalho. Texto digitado e não desfocado continua lá depois de clicar num chip. | — |

---

## 2. Defeitos por prioridade

Não há defeito P0: nada quebrou, o plano e o PDF são gerados em todos os casos.

### P1 — claramente errado em relação à avaliação ou às restrições

**P1-1. Escolher mais adaptação deixa o custo bem mais barato.**
Reprodução: carregar o exemplo A → 2.3.4 → escolher "Custom development". O total do painel cai de US$ 4.75 M para 0.82 M. No caso em branco (pago + por usuário), passa de 106 M ("config") para 31 M ("custom").
Causa: `derivarArquitetura()` em `src/framework.js` muda a arquitetura para `api` quando `adaptacao === 'sob_medida'`. Com isso, `cfgDoCaso()` em `src/casos.js` troca o preset A (SaaS) pelo preset B (API). A troca de preset domina, e os multiplicadores de K3 ficam irrelevantes.
Correção: em `derivarArquitetura`, não derivar `api` a partir de `adaptacao` (usar só `tipoTec`, `licenca` e `pagamento === 'consumo'`), ou derivar `api` só quando `tipoTec` estiver vazio ou for `nao_sei`. Depois, acrescentar em `tests/test_v9_motor.js` um teste de que, com `tipoTec` e `pagamento` fixos, o total é não decrescente de `config` a `sob_medida`.
Ajuste secundário: com `config` → `conteudo` o total muda só 0,1 % (5,6 k em 4,68 M) e o painel não mostra diferença. Mostrar a linha "Adaptation (K3.1 + K3.2), Year 0" no painel ou no 3.3 (`renderPainel` / `passo3c` em `src/fluxo.js`) para que o efeito fique visível.

**P1-2. Abreviações em português nas unidades de valor (EN e FR, página e PDF).**
Reprodução: EN → exemplo A → Generate procurement plan → A2 "Cost by layer" mostra "YEAR 0 (USD MIL)" e A6 mostra "Estimated transition and exit cost: US$ 162 mil". O caso em branco mostra "US$ 2.65 mi". Em inglês, "162 mil" se lê como 162 milhões, ou seja, é um erro de mil vezes para o leitor.
Causa: `grande()` e `unidMil()` em `src/custos_ui.js` (linhas 27 e 29) usam os sufixos fixos 'mil', 'mi' e 'bi'. Na página, o tradutor do DOM corrige parte disso (o 3.3 mostra "USD THOUSAND", o painel mostra "k"), mas `secoesPlano()` em `src/resumo.js` (linhas 205, 210 e A6) monta as strings já concatenadas, que não passam pelo dicionário.
Correção: tornar `grande()` e `unidMil()` dependentes do idioma (EN k/M/bn e "USD thousand"; FR k/M/Md e "milliers USD"; ES mil/M/mil M; PT mil/mi/bi) em `src/custos_ui.js` ou `src/i18n.js`, e acrescentar `\b(mil|mi|bi)\b` à regex de `test_idiomas.py` para EN e FR.
No mesmo item: a linha `TXT_VINCULO` (`src/i18n.js`, linha 235) sai em EN e FR como "Project linked to the Cátedra UNESCO UNITWIN de Inteligência Artificial Desplugada na Educação". Se o nome oficial tiver forma em inglês, usá-la; senão, pôr o nome entre aspas como nome próprio e manter a explicação no idioma do leitor.

**P1-3. Trocar a tarefa depois de confirmar o 2.2 não atualiza nem avisa.**
Reprodução: caso em branco → 2.1 marcar "Prepare lesson plans" → 2.2 "Confirm and continue" → voltar a 2.1, marcar "Offer students individual practice and tutoring" e desmarcar "lesson plans". O 2.2 continua com "Teachers" e "Use it as support… without deciding about people", sem estudantes. O perfil de risco e o custo passam a tratar um tutor de estudantes como ferramenta só de professores.
Causa: `aplicarSugestoes()` em `src/fluxo.js` pula os campos com `S.respC[k]`.
Correção: em `aoMudarCampo('tarefas')`, quando as sugestões novas diferirem das respostas confirmadas, (a) acrescentar sem remover as sugestões novas e marcar o campo como "sugerido" de novo (apagar `respC`), ou (b) mostrar no 2.2 o aviso "Your tasks changed. Review these answers.", com o rodapé voltando a "Confirm and continue".

**P1-4. Com "recomende para mim", o resumo apaga as escolas digitadas.**
Reprodução: caso em branco → 2.0 "I don't know, recommend one for me" → 2.3.6 com 20 escolas, 1.200 participantes e 4 meses → plano. O "Case summary" mostra "Schools in the test: —". O mesmo acontece no exemplo C (10 escolas). Isso vale para a página e para o PDF.
Causa: `secoesPlano()` em `src/resumo.js`, linha 135: `d.poc ? '—' : …` usa o teste efetivo (a recomendação), não a resposta da pessoa.
Correção: trocar por `c.teste === 'poc' ? '—' : …`. O resumo deve mostrar o que foi respondido; a recomendação fica em A1.

**P1-5. Stepper sobreposto no celular (≤480 px), nos 4 idiomas.**
Reprodução: largura de 400 px, qualquer caso aberto, topo da página. O texto da fase fica por cima do círculo do número e da barra verde, e a última linha é cortada ("Life-cycle cost" e "Preuve de concept ou pilote"). Capturas: `en_m400_stepper.png`, `fr_m360_top_exB.png`, `en_m_24_plan_top.png`.
Causa: `src/fluxo.css`, `@media (max-width: 480px)` muda `.step-f` para uma coluna, mas `grid-template-rows: auto 6px` continua com duas linhas. O rótulo cai na linha de 6 px.
Correção: dentro desse media query, `.step-f { grid-template-columns: minmax(0,1fr); grid-template-rows: auto auto 6px; }`. Opcionalmente, reduzir `.sf-t` para `.86rem` (o mínimo permitido).

**P1-6. Custo do caso em branco implausível por premissas invisíveis.**
Reprodução: caso em branco com 300 mil estudantes, tarefas aulas + tutoria, pago + por usuário. Já no 2.3, o painel mostra "Total cycle cost (3 years) US$ 106.19 M", antes de a pessoa responder quantas pessoas usariam (3.1). No fim, o total é US$ 151 M e US$ 243 por usuário ativo por ano.
Causas: (a) `casoEfetivo()` em `src/framework.js` define `elegiveis = tot.alunos` (300 mil) assim que "Students" entra em 2.2.1; (b) `cfgDoCaso()` em `src/casos.js` aplica a cada estudante o `saas.precoNominal` = US$ 13/mês do Exemplo A, que é um copiloto para professores; (c) `PREMISSAS_K1` acrescenta US$ 22,5 M em dispositivos (25 % × 300 mil × US$ 300). Nenhuma dessas premissas aparece nos passos, e o preço unitário não aparece em A2.
Correção: em A2, nas "Assumptions of this estimate" (`secoesPlano`, `src/resumo.js`), e no 3.3 (`passo3c`, `src/fluxo.js`), mostrar o preço por licença por mês, a fração de dispositivos e o preço por dispositivo. No painel (`renderPainel`), mostrar a estimativa só depois de 3.1.1 respondido ou com o rótulo "assumes all N students use it". Considerar um preço por estudante distinto do preço por professor quando `usuarios` incluir estudantes (constante ilustrativa em `casos.js`).

### P2 — polimento

1. **Gerúndios nos títulos em EN** (`src/plano_dados.js` / `i18n/v9_p3_en.json`): "Before scaling to the school system and to sustain" → "Before scale-up across the school system, and for sustainability"; "Before taking it to the school system" → "Before scale-up across the school system"; "Learn before committing" → "Learn before you commit"; "B8 Monitoring and evaluation" → "B8 Indicators and evaluation".
2. **Alerta de licença incoerente com a resposta.** Com o pagamento "Per-user license", A3 diz "the institutional license only pays off with adoption above 87%". Em `secoesPlano()` (`src/resumo.js`, linha 236), acrescentar a frase do ponto de equilíbrio só quando `c.pagamento === 'institucional'`.
3. **Tabelas do plano no celular.** Com 400 px, A2 "Cost by layer", A3, A4, B1 e B8 ficam em rolagem horizontal interna (por exemplo, A3 com 654/332 px), e as colunas "Life-cycle total" e "In this case" ficam fora da tela, sem indicação. Capturas `en_m_plan_A3_top.png`, `en_m_plan_A2_mid.png`, `en_m_22_step33_sheet.png`. Em `src/fluxo.css`, empilhar as células em `@media (max-width:480px)` (`td::before{content:attr(data-th)}`) ou mostrar uma sombra ou seta de rolagem nas `.tw`.
4. **KPIs do plano em PT/ES.** "US$ 336,2 mil" passa da borda do cartão (`pt_d_planB_kpis.png`). Em `src/fluxo.css`, `.kpis` com `minmax(170px,1fr)` ou `font-size: clamp(...)` no valor.
5. **Rótulo "Export case" no painel** (`renderPainel`, `src/fluxo.js`): fora do claude.ai, o botão só copia para a área de transferência, e "Import case" só aceita arquivo. A volta só funciona se a pessoa colar o texto num arquivo .json. Rotular "Copy case data" quando `!CAP.downloads` (como o plano já faz) e aceitar colar o JSON na importação (`escolherArquivoCaso`/`importarCaso`, `src/app.js`).
6. **"Recomende para mim" com PoC recomendada e setup de piloto.** B3 e B4 dizem "without real users" e "the team runs the test", enquanto o custo usa 1.200 participantes em 20 escolas. Em A1 (`secoesPlano`), acrescentar uma frase como "Your setup (20 schools, 1,200 participants) describes a pilot; for a proof of concept, reduce it to the team and a few invited people (step 2.3.6)."
7. **Exemplo D gera "Partial plan"** porque 1.2.1 (tipo de problema) está vazio no exemplo. Preencher `ctx.dominio` em `CTX_EX.D` (`src/casos.js`) ou explicar no exemplo por que fica vazio.
8. **Grafia inconsistente**: "Governance, policy and lifecycle planning" (camada) ao lado de "Life-cycle cost" (fase) e "life-cycle planning" (ⓘ). Uniformizar para "life-cycle" em `i18n/*_en.json`. Em FR, "1 questions de gouvernance sur 6" deveria estar no singular. Na tabela "Levels, schools and students" do PDF em FR, "150 000" quebra em duas linhas (largura da coluna "Élèves" em `gerarPDF`, `src/resumo.js`).
9. **Etapa sem faixa de séries no nome**: "Lower secondary education (grades 6–9)" contra "Upper secondary education", sem anos (`ETAPAS_ENS`, `src/fluxo_dados.js` / i18n EN).
10. **Plano gerado sem nenhuma resposta** mostra KPIs (US$ 715 k, "US$ 1,832 per test participant") calculados só com padrões. As premissas dizem isso, mas os KPIs no topo de A2 parecem dados reais. Em `secoesPlano`, A2 poderia trazer "Estimate based on default assumptions" quando `faltasTodas().length` for alto.

---

## 3. Capturas e artefatos (`/tmp/claude-0/qa9/`)

- Percurso em branco: `{en,pt}_{d,m}_11_step11.png` … `_22_step33.png`, `_23_panel.png`, `_24_plan_top.png`, `_25_plan_full.png`, `_26_after_import.png`; observações em `{en,pt}_{d,m}_obs.json` e `log_*.txt`.
- PDF do caso em branco: `en_d_blank.pdf`, `en_d_blank.txt`, páginas em `pdf_en_blank_sheet1..4.png` (sem sobreposição de layout: tabelas quebram limpas entre páginas, cabeçalhos repetidos, rodapé "page n / 14").
- Exemplos: `plan_{lang}_{d,m}_{A..D}.txt`, `plan_{en,es,fr}_d_{A..D}.pdf` + `_pdf.txt`, `pp_plan_fr_d_B_sheet.png`, `pp_plan_en_d_D_sheet.png`, `en_d_planC_A1.png`, `en_d_planC_A2.png`, `exemplos.json`.
- Defeitos: `en_m400_stepper.png`, `fr_m360_top_exB.png`, `pt_d_planB_kpis.png`, `en_m_plan_A3_top.png`, `en_m_plan_A2_mid.png`, `en_m_22_step33_sheet.png`.
