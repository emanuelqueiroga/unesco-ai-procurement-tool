# v12 — design do relatório (plano de contratação) e figura por padrão

## Pedido (literal)
"acho que tá ficando legal, mas a parte do relt ainda tá mto feia. tem como deixar o relt bonito? criar um design pra ele? Outra coisa, aqui já tem que vir a figura por default e tem que ter um botão de abrir ela na tela, algo como clicar e abrir a figura, mas sem abrir uma nova tela." (o "aqui" é a nota ⓘ das sete camadas, texto `c37`: "As sete camadas do quadro de Krueger e Jackson (2026, p. 11)…", com a referência e o botão que hoje abre/fecha a figura).

## Diagnóstico do relatório atual (página `renderPlano` e PDF `gerarPDF`)
- Página de 26 mil px: o resumo do caso é uma tabela chave-valor gigante; recomendações e blocos A/B são listas e tabelas em sequência, sem hierarquia visual, sem números-chave em destaque, sem gráfico; o painel lateral (mandala) continua ocupando espaço, o que não combina com um documento.
- PDF: tabelas autotable em sequência, títulos simples; nenhuma capa, nenhum gráfico, nenhum destaque.

## Linguagem visual comum (página e PDF)
- Paleta: tinta #17212B; títulos #0C2D4D; marca #0069B4; fundo de seção #F5F8FB; linhas #DDE3E9; muted #586674; fases --f1..--f4 já existentes. Camadas (cores da Figura 1 de Krueger e Jackson): 1 #0C1D53, 2 #0666B3, 3 #096C72, 4 #547D1D, 5 #5E3C86, 6 #D9741A (texto sobre ela: usar #FFFFFF só em tamanho ≥ 14 px bold; em barras finas sem texto), 7 #1B2A55. Prioridade alta: #B3261E (ícone/barra lateral), média: #8A5A00. Custo e compra: azul marca; Política e governança: #5E3C86.
- Tipografia: títulos em serif (a mesma da interface, `--f-head`), corpo na sans da interface; números grandes em tabular-nums. Nada abaixo de .86rem na página; no PDF, corpo 10 pt, tabelas 8,6 pt, mínimo 8 pt só em rodapé e legendas.
- Ritmo: seções com número grande à esquerda, título, uma frase de abertura; muito espaço em branco; cartões com borda fina e cantos 10 px; sem sombras pesadas.

## Estrutura do relatório (mesma ordem na página e no PDF)
0. **Capa**: faixa superior com o gradiente das fases (f1→f4), logos, "AI in Education Procurement Tool", "Plano de contratação", nome do caso em destaque, lugar e data; caixa "Recomendação principal" (a frase de A1 sobre prova de conceito/piloto + número de ações de prioridade alta); faixa de isenção (FAIXA_PLANO) discreta.
1. **Em resumo** (visão de painel): 4 KPIs grandes (custo do teste — Ano 0; custo total do ciclo; dotação média por ano de operação; custo por usuário ativo por ano); gráfico de barras horizontais "Custo por camada" (7 barras nas cores das camadas, valor e %); gráfico de colunas "Dotação por exercício" (Ano 0…H); linha de "fatos do caso" em chips (etapas e estudantes; aplicações; quem usa; tecnologia e pagamento; teste; escala). Se faltarem respostas, aviso discreto "Plano parcial: N respostas pendentes" com link para a lista no fim.
2. **Recomendações para você**: as 5 primeiras de prioridade alta como cartões numerados grandes (ação em destaque, "Por quê" abaixo, etiqueta custo/política, quando); depois a lista completa agrupada por "Antes do teste / Antes de contratar / Para manter e ampliar", em linhas compactas com caixinha de marcar visual (☐), ação, por quê e link "Ir à pergunta" (só página).
3. **Perfil do caso**: grade de cartões por área (Contexto; Problema e impacto; Aplicações e experiência de uso; Adoção e ferramentas; Infraestrutura e dispositivos; Formação; Operação e suporte; Implantação e expansão), cada um com 3–8 pares rótulo/valor curtos; a tabela de etapas e anos e a de ferramentas como tabelas pequenas dentro dos cartões correspondentes.
4. **A. Custo e compra** (faixa azul) — A1 a A7, com a fórmula (secaoFormula) em A2 com o mesmo visual da equação do passo 4.2; tabelas com cabeçalho #EEF3F8, linhas finas, números à direita; listas longas em `details` na página.
5. **B. Política e governança** (faixa roxa) — B1 a B9.
6. **Referências e créditos** + Figura 1 (A3 mantém a figura; no PDF página própria) + respostas pendentes (se houver) + isenção.

## Página (renderPlano)
- Na vista do plano, esconder o painel lateral e usar a largura toda: índice fixo à esquerda (≥ 1100 px: coluna de 220 px, `position: sticky`, links para as seções com destaque da seção atual via IntersectionObserver) e conteúdo com largura de leitura (máx. ~880 px). Em telas menores, o índice vira uma faixa de chips com rolagem horizontal no topo.
- Barra de ações fixa no topo do relatório: Baixar PDF (primário), Voltar ao percurso, Copiar texto, Exportar/Importar caso.
- Gráficos em SVG inline (sem bibliotecas), acessíveis (title/desc, valores em texto), legíveis a 400 px.
- `@media print`: esconde cabeçalho do app, índice, botões; quebra de página antes das seções 2, 4, 5, 6; cores preservadas (`print-color-adjust: exact`).
- Continua usando `secoesPlano()` como fonte de conteúdo (MD/HTML e PDF dependem dela); a página pode ter renderizações próprias para capa, resumo, recomendações e perfil, mas o texto vem das mesmas funções (sem duplicar regras).

## PDF (gerarPDF em `src/plano_pdf.js`)
- A4 retrato, margens 46 pt. Capa em página própria: faixa superior em gradiente (retângulos das 4 cores das fases), logos, título, subtítulo, caso, lugar, data, caixa da recomendação principal, KPIs em 2×2 cartões, isenção no pé.
- Página "Em resumo": KPIs, barras horizontais por camada (retângulos coloridos + rótulos), colunas por exercício, chips de fatos.
- Recomendações: cartões com barra lateral colorida pela prioridade (top 5), depois tabela agrupada por quando.
- Perfil do caso: cartões em duas colunas (caixa com título da área e pares rótulo/valor).
- Blocos A e B: cada seção começa com faixa colorida do bloco + número; tabelas autotable com tema único (cabeçalho #EEF3F8, texto #0C2D4D, linhas #DDE3E9 0,5 pt, sem zebra forte); quebras de página que evitam título órfão.
- Cabeçalho nas páginas internas (fio fino + "AI in Education Procurement Tool · Plano de contratação · <caso>") e rodapé com número da página "n / N".
- Helvetica (WinAnsi) com `pdfTxt` para caracteres fora do conjunto; figura em página própria (já existe).

## Figura por padrão no ⓘ das camadas
- Ao abrir a nota ⓘ das camadas (e nas notas c1, c2, c234, c37 e onde mais a figura for oferecida), a figura aparece logo, em miniatura (largura até ~460 px, proporção mantida), com a legenda e o crédito.
- Botão "Ampliar a figura" (e clique na própria miniatura) abre um visualizador sobre a página (lightbox), sem abrir nova janela: fundo escurecido, imagem ajustada à tela com rolagem se necessário, botão "Fechar" visível, `Esc` fecha, clique no fundo fecha, foco preso no visualizador e devolvido ao botão ao fechar, `role="dialog" aria-modal="true"`, legenda e crédito embaixo. Funciona a 400 px. Mesmo visualizador para a figura do plano (A3).
- Remover o botão antigo "Ver a figura das sete camadas"/"Fechar a figura".

## Pacotes paralelos
- **G1 — Página do relatório e figura**: `src/resumo.js`, `src/fluxo.js` (só o necessário: nota ⓘ com figura por padrão, visualizador, esconder painel na vista do plano), `src/fluxo.css`, `tests/test_v9_plano.py`, `i18n/v12_g1_{en,es,fr}.json`.
- **G2 — PDF do relatório**: `src/plano_pdf.js`, `tests/test_v12_pdf.py` (novo), `i18n/v12_g2_{en,es,fr}.json`. Usa as funções existentes como fonte de dados: `secoesPlano()`, `numerosCusto()` (inclui `camadas`), `recomendacoesCaso()`, `recomendarTeste`, `casoAtual()`, `totaisCtx()`, `secaoFormula()`, `FAIXA_PLANO`, `TXT_VINCULO`, `TXT_ISENCAO`, `FIG_TCO`, `NOME_FERRAMENTA`. Se G1 criar uma função compartilhada útil (ex.: `perfilCasoCartoes()`), G2 pode usá-la guardando com `typeof`, mas não depende dela.
- O `build.sh` já inclui `src/plano_pdf.js` depois de `src/resumo.js` e mescla `i18n/v12_*`? — G2 verifica e, se faltar, avisa (não edita build.sh: o integrador ajusta).

## Regras comuns
PT é a chave de tradução; EN/ES/FR para strings novas; EN usa "system"/"education system"; sem gerúndio em títulos; não falar pela UNESCO; valores ilustrativos marcados; só citar o guia e Krueger e Jackson (2026). Testes verdes: `node tests/test_custos_v2.js`, `tests/test_v9_motor.js`, `tests/test_v10_formula.js`, `python3 tests/test_v9_fluxo.py`, `tests/test_v9_plano.py`, `tests/test_v10_recs.py`, `tests/test_v9_numeros.py`, `test_idiomas.py` (0 restos).
