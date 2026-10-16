# v13 — contrato de execução (pacotes paralelos)

Requisitos: `plano/8_requisitos.md` (RQ-01 a RQ-21). Catálogo: `plano/9_catalogo_prioridades.md`.
Já prontos no `master` (não reescrever; pode acrescentar funções se precisar, avisando no relatório):
- `src/prioridades.js`: `PRIORIDADES` (4 × 10 problemas), `PROBLEMA_POR_ID`, `PRIORIDADE_DO_PROBLEMA`, `AVISO_SEM_FERRAMENTA`,
  `MIGRA_DOMINIO`, `MIGRA_COMPS`, `PROBLEMAS_EXEMPLO`, `problemasMarcados(ctx)`, `sugestoesProblemas(ctx, tr)` →
  `{ n, problemas, tarefas, impactos, olhando, resultado, problema, semFerramenta, formacao }`, `temLacuna(txt)`, `LACUNA = '__'`.
- `src/matriz.js`: `MATRIZ[camada][fase] = { t, q: [ids], na }`, `FASES_MATRIZ`, `CREDITO_MATRIZ`, `TIT_MATRIZ`, `NOTA_MATRIZ_CUSTO`,
  `MATRIZ_DESCE = { piloto: [...], poc: [...] }`, `modoCamada2(caso)` → 'poc'|'piloto'|'', `camposDescidos(caso)`, `numPergunta(id)`,
  `estadoCelula(cel)` → 'na'|'orientacao'|'ok'|'andamento'|'pendente', `custoMatriz(somaPorCamada)`, `matrizCaso()` →
  `{ celulas: {1..7: {fase: { t, q, n, na, estado, custo }}}, custo: bool }`.
- `src/framework.js`: impactos novos `letramento_ia`, `uso_responsavel`, `competencias`; tarefa nova `pratica_ia`.
- `build.sh`: ordem `i18n, custos, framework, prioridades, casos, custos_ui, fluxo_dados, matriz, plano_dados, formula, recomendacoes, fluxo, inicio (opcional), resumo, plano_pdf, app`; CSS = `fluxo.css` + `inicio.css` + `idiomas.css` (se existirem); dicionários `i18n/v13_*_<l>.json` mesclados por último.

## Estado novo (v13)
- `S.ctx.prioridades: string[]` (ids de PRIORIDADES), `S.ctx.problemas: string[]` (ids G1…F10), `S.ctx.subs: string[]` (ids G1a…), `S.ctx.problemaOutro: string`.
  Saem `S.ctx.dominio`, `S.ctx.comps`, `S.ctx.compOutro` (migrados: `MIGRA_DOMINIO`, `MIGRA_COMPS`; comp 'outro' → `problemaOutro = compOutro`).
- `S.caso.linhaBaseProblemas: string[]`, `S.caso.linhaBaseMedida: string`, `S.caso.linhaBaseProblemaTxt: string` (detalhe do 1.2.7).
- `S.respDet = { 'g-comite': { qual: '', falta: '' }, … }` (detalhe das 1.3.x; opcional; nunca bloqueia o passo).
- `S.respC` ganha confirmações de sugestão: `olhando`, `problema`, `resultado`, `impactos`, `tarefas`, `nFerramentas` (além das existentes).
- `S.versao = 13`; exportação `formato: 13` (importa 9, 11 e 13). `dadosCaso()` inclui `respDet`.

## Pacote B1 — Percurso (arquivos exclusivos)
`src/fluxo.js`, `src/fluxo_dados.js`, `src/fluxo.css`, `src/app.js`, `src/casos.js`, `tests/test_v9_fluxo.py`, `tests/test_v13_fluxo.py` (novo), `i18n/v13_b1_{en,es,fr}.json`.
1. **1.2 Prioridade e impacto** (RQ-04, RQ-05, RQ-07, RQ-08): passo `1b` passa a "Prioridade e impacto"; `FASES[0].sub` com "prioridade e impacto".
   - 1.2.1 `prioridades` (onde ctx, tipo novo `prior`): 4 cartões com caixa de marcar (várias), nome + `desc`, e ⓘ próprio (S.info['pr-<id>']) que abre os exemplos (`ex`). Texto: "Qual é a prioridade da sua rede para a IA na educação?", h "Marque uma ou mais."
   - 1.2.2 `problemas` (onde ctx, tipo novo `problemas`): para cada prioridade marcada, um grupo com título, contador "N de 10 marcados", botões "Marcar todos" e "Desmarcar todos"; cada problema = caixa + texto + objetivo em letra menor; marcado → subcategorias recolhidas (`<details>` "Subcategorias (opcional)") com caixas; no fim, campo "Outro problema" (texto livre). Sem prioridade marcada: dica "Marque antes uma ou mais prioridades na pergunta 1.2.1." Texto: "Quais problemas você quer resolver?", h "Marque um ou mais, ou todos de uma prioridade. Os objetivos já vêm escritos; você completa os números da sua rede."
   - Respondidas: prioridades ≥ 1; problemas: ≥ 1 em `problemasMarcados` ou `problemaOutro` preenchido. Desmarcar uma prioridade não apaga os problemas dela do estado (só deixam de contar).
   - Remover `DOMINIOS`, `opDominio`, `opComps`, tipos `dom` e `comps`.
2. **Sugestões que nascem dos problemas** (RQ-09, RQ-15, RQ-16), com o mecanismo existente ("sugerido", `S.respC`, recalcula só o que não foi confirmado):
   - 1.2.3 `olhando` ← `sug.olhando`; 1.2.4 `problema` ← `sug.problema` (modelo com lacunas); 1.2.5 `impactos` ← `sug.impactos`; 1.2.6 `resultado` ← `sug.resultado` (objetivos com lacunas); 2.1.1 `tarefas` ← `sug.tarefas` (e, por consequência, o 2.2 via `aplicarSugestoes`).
   - Etiqueta: "sugerido pelos problemas do passo 1.2". Digitar ou marcar confirma (como hoje).
   - Texto com lacuna (`temLacuna`) não conta como respondido; abaixo do campo, dica "Complete as lacunas marcadas com __ com os dados da sua rede."
   - 2.1: se `sug.semFerramenta`, aviso `AVISO_SEM_FERRAMENTA` no topo do passo.
   - Exemplos A–D: todas as respostas ficam confirmadas (nenhuma sugestão substitui valores dos exemplos). `test_v9_numeros.py` não pode mudar.
3. **Detalhe de "Sim" e "Em parte"** (RQ-10, RQ-11):
   - 1.2.7 `linhaBase` em 'sim' ou 'parcial': caixas "Para quais problemas?" com `problemasMarcados` (`data-fm="linhaBaseProblemas"`) ou, sem problemas marcados, texto livre (`linhaBaseProblemaTxt`); e "Qual medida?" (`linhaBaseMedida`, exemplo "avaliação estadual de leitura do 5º ano, 2025"). Escondidos com 'nao'; os dados ficam guardados.
   - 1.3.1–1.3.6 (`QUESTOES_G`) em 'sim' ou 'parcial': campo "Qual?" com rótulo próprio (RQ-11: equipe ou instância e quem participa; documento (nome, data ou link); normas identificadas; política ou norma de dados; orientações e para quem; regras ou modelos); em 'parcial', também "O que falta?". Grava em `S.respDet[id].qual|falta`. Opcional.
4. **Camada 2 enxuta no teste** (RQ-13, RQ-14, RQ-17): com `modoCamada2(S.caso)` não vazio, `camposDescidos(S.caso)` saem dos passos 2.2/2.3 e entram no passo `3a` (depois das perguntas dele, sob o subtítulo "Da camada 2: decisões que ficaram para a implantação"); em 2.2/2.3, no fim do passo, um `<details>` recolhido "Para a implantação (pode responder agora ou depois)" com essas perguntas e a nota "Estas perguntas também aparecem no passo 3.1." Contagem, validação, mandala, `faltasTodas` e o painel seguem a nova distribuição. Sem resposta 2.0 ou com "recomende", tudo como na v12.
   - Sugestão nova: 2.3.1 `nFerramentas` = '1' (sugDe 'testes'), nota "Testar uma ferramenta por vez permite saber o que funcionou. Confirme ou escolha outra opção."
   - Cada sugestão mostra a linha de "por quê" (`notaSugerido`), inclusive as dos problemas ("Sugestão a partir dos problemas marcados no passo 1.2. Confirme ou ajuste.").
   - Pagamento, licença e adaptação: manter as regras atuais (não mudar números).
5. **Ganchos para o pacote B2** (página inicial e matriz):
   - `boasVindas()`: `if (typeof paginaInicial === 'function') return paginaInicial(sv);` (sv = SALVO) — o restante fica como reserva.
   - Início de `eventoFluxo(e)`: `if (typeof eventoInicio === 'function' && eventoInicio(e)) return true;`.
   - `notaInfo('c37', …)`: acrescentar `<button type="button" class="btn" data-act="ver-matriz">Ver a matriz camadas × fases</button>` (B2 trata o clique).
6. **Migração e exportação** (RQ-19): `normalizarEstado` leva qualquer estado à versão 13 (ctx dominio/comps → prioridades/problemas; `respDet` = {}; campos novos do caso com valores vazios); `CTX_EX` dos exemplos com `prioridades: ['com']` e `problemas: PROBLEMAS_EXEMPLO[k]` (C e D tinham comps 'outro': usar os problemas do mapa e manter o texto antigo em `problemaOutro` só se fizer sentido — preferir não); `temRespostas` usa os campos novos; `dadosCaso` com `formato: 13, versao: 13, respDet`; importação aceita 9, 11 e 13.
7. **Testes**: corrigir `tests/test_v9_fluxo.py` (está quebrado desde a v12: espera `[data-fig]` na nota ⓘ) e criar `tests/test_v13_fluxo.py` cobrindo: seleção de prioridades/problemas/"marcar todos"/subcategorias; sugestões (1.2.3–1.2.6, 2.1.1) e confirmação; lacunas; detalhe 1.2.7 e 1.3.x; contagem da camada 2 (14 → 11 no piloto; 9 na PoC; tudo sem 2.0); perguntas descidas no 3.1; migração de um estado v12 (dominio 'qualificacao', comps ['matematica']) e importação formato 11; exemplos A–D sem regressão; 400 px sem rolagem horizontal; EN sem restos de português nas telas novas.

## Pacote B2 — Página inicial e matriz (arquivos exclusivos)
`src/inicio.js` (novo), `src/inicio.css` (novo), `tests/test_v13_inicio.py` (novo), `i18n/v13_b2_{en,es,fr}.json`.
1. `paginaInicial(sv)` → HTML da página inicial (RQ-01), que substitui o conteúdo de `boasVindas()`:
   - Bloco do caso salvo, se `sv` (mesmos botões de hoje: `data-act="continuar-salvo"` "Continuar o caso salvo" e `data-act="comecar"` "Começar em branco", mesmos textos de aviso).
   - Abertura: nome da ferramenta (já no cabeçalho: não repetir como h1), título "Monte o plano de contratação de IA da sua rede" e a frase do que entrega (plano de contratação com o custo de todo o ciclo de vida; valores ilustrativos).
   - Botão principal `data-act="comecar"` "Iniciar o plano de contratação" (EN "Start procurement plan"); secundários `data-act="ver-exemplo"` "Ver um exemplo preenchido" e `data-act="imp-json"` "Importar caso".
   - Imagem explicativa das 4 fases (SVG ou HTML/CSS, traduzível, sem raster): por fase, número e nome (`FASES`), os passos (`PASSOS`, `PASSO_INFO.num`), as camadas que alimenta (células de `MATRIZ` daquela fase com perguntas) e o resultado da fase:
     1 "Perfil da rede, prioridades, problemas e objetivos; diagnóstico de governança."; 2 "Tamanho e custo do teste (Ano 0) e o que ele exige em cada camada."; 3 "Primeira etapa de uso real, arquitetura e custo do Ano 1."; 4 "Custo de todo o ciclo, recomendações para você e o plano de contratação em PDF."
   - Clicar numa fase (`data-inicio-fase`, `aria-expanded`) abre, na própria página, o resumo dela: a abertura da fase (`FASES[i].abertura`) e a coluna da matriz daquela fase (texto de cada camada). Só uma aberta por vez.
   - Link "Ver a matriz completa" (`data-act="ver-matriz"`).
   - 400 px: fases empilhadas, sem rolagem horizontal; cores das fases `--f1..--f4` e das camadas como em `plano/7_relatorio_design.md`.
2. `renderMatrizTabela({ caso: bool })` → HTML da tabela (RQ-03): `<table>` com `<caption>` `TIT_MATRIZ`; colunas = fases (número e nome), linhas = camadas (número com a cor da camada + nome de `CAMADAS`); célula = texto + números das perguntas (pequenos); 'na' em cinza "Não se aplica nesta fase". Com `caso: true` usa `matrizCaso()`: selo de estado (Respondido / Em andamento / Pendente / Orientação / Não se aplica) e, se `custo`, o valor com `grande()`; rodapé com `NOTA_MATRIZ_CUSTO`. Sempre o crédito `CREDITO_MATRIZ`. Telas estreitas: rolagem horizontal só dentro da tabela, com a primeira coluna fixa (ou cartões por fase).
3. `abrirMatriz(volta)` → visualizador sobre a página, no mesmo padrão de `abrirVisor` (fluxo.js): `<dialog>` modal, `role="dialog" aria-modal="true"`, Esc / clique no fundo / "Fechar", foco preso e devolvido. Na página inicial mostra a matriz geral; dentro do percurso (`S.boasVindas === false`) mostra a matriz do caso.
4. `eventoInicio(e)` → trata cliques em `[data-inicio-fase]` e `[data-act="ver-matriz"]`; devolve true se tratou (B1 chama no início de `eventoFluxo`).
5. Teste `tests/test_v13_inicio.py` (playwright, molde de `tests/test_v12_pdf.py`): página abre sem caso; "Iniciar" leva ao 1.1; fase abre/fecha; matriz 7 × 4 com crédito; visualizador abre, Esc fecha e devolve o foco; 400 px sem rolagem horizontal; EN sem restos de português (regex de `test_idiomas.py`). Enquanto o B1 não liga os ganchos, o teste pode ligar à mão (`boasVindas = () => paginaInicial(SALVO)` etc.) — deixe o teste funcionar nos dois casos.

## Pacote B3 — Plano de contratação e PDF (arquivos exclusivos)
`src/resumo.js`, `src/plano_pdf.js`, `src/recomendacoes.js`, `src/plano_dados.js`, `tests/test_v9_plano.py`, `tests/test_v10_recs.py`, `tests/test_v12_pdf.py`, `tests/test_v13_plano.py` (novo), `i18n/v13_b3_{en,es,fr}.json`.
1. Perfil do caso (página, `secoesPlano()`, PDF): prioridades; problemas marcados com as subcategorias e o "Outro"; objetivos/resultado (com aviso discreto se houver lacunas `__`); linha de base com os problemas e a medida; nas 1.3.x, o "Qual?" e o "O que falta?". O rótulo "Problema e impacto" vira "Prioridade e impacto"; "Como a equipe descreve o problema" continua.
2. Matriz do caso (RQ-03, RQ-20): seção própria logo depois de "Em resumo" — página: `renderMatrizTabela({ caso: true })` (guardar com `typeof`); `secoesPlano()`: tabela (camada × fase, texto curto + estado + custo) para MD/HTML; PDF: tabela desenhada a partir de `matrizCaso()` (paisagem ou duas páginas retrato, sem corte de texto), com `CREDITO_MATRIZ` e `NOTA_MATRIZ_CUSTO`. Soma das células de custo = total do ciclo (r = 0).
3. Recomendações (`recomendacoesCaso`): (a) 1.3.x 'parcial' com "O que falta?" preenchido → o texto da recomendação cita o que falta; (b) `sugestoesProblemas(S.ctx).formacao` → recomendação "Antes do teste" sobre plano de formação (camada 6); (c) `semFerramenta` → "Antes de contratar": considerar resolver com regras e processos antes de comprar uma ferramenta; (d) objetivos com lacunas → "Antes do teste": completar as metas com números da rede; (e) linha de base 'sim'/'parcial' sem medida informada → média, pedir a medida. Mesmo formato `{ id, quando, tipo, prioridade, texto, porque { n, pergunta, resposta }, ir }`.
4. Testes de plano, recomendações e PDF atualizados e verdes; `tests/test_v13_plano.py` novo: perfil com prioridades/problemas/detalhes; matriz no plano e no PDF (texto extraído com pypdf ou pdftotext); as cinco recomendações novas; soma da matriz = total.

## Regras comuns (todos os pacotes)
- PT é a chave de tradução (`tr`); números viram `{0}` (ver `normalizar` em `src/i18n.js`). Cada pacote escreve EN, ES e FR das suas strings novas em `i18n/v13_<pacote>_{en,es,fr}.json`. EN usa "system"/"education system" (nunca "network"), "procurement plan", "proof of concept", "pilot", "Scale-up". Sem gerúndio em títulos de seção.
- Não inventar referências; só o guia e Krueger e Jackson (2026) nas páginas já usadas. Nenhuma referência para as quatro prioridades. Não falar em nome da UNESCO. Valores sempre ilustrativos. Não reduzir fontes (nada abaixo de .86rem na página).
- Trabalhe no seu worktree (`/home/claude/wt/<pacote>`, ramo `v13-<pacote>`), rode `bash build.sh` lá, e os testes do seu pacote. Não rode `test_idiomas.py` nem testes de outros pacotes que escrevem nos mesmos arquivos temporários (exceção: B1 roda `tests/test_v9_numeros.py`). Use pastas temporárias próprias: `/tmp/claude-0/v13_<pacote>/`.
- Commits no seu ramo com mensagem em português; não inclua `navegador.html` no commit (`git checkout navegador.html` antes).
