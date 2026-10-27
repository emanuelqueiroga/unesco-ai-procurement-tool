Prumo é o sistema de design da **AI in Education Procurement Tool**, a ferramenta que leva um sistema educacional do contexto ao plano de contratação de IA com custo do ciclo de vida. O nome vem do instrumento que garante o alinhamento de uma construção: a ferramenta ajuda gestores a decidir no prumo, com calma e com números de origem conhecida.

Use este sistema para qualquer tela, documento, PDF ou apresentação da ferramenta. Ele segue a narrativa adotada no modelo de UX: o plano de contratação se escreve enquanto a pessoa responde, em quatro capítulos com abertura e síntese.

## Princípios

1. **O plano é o protagonista.** Toda tela existe para encher o plano. O que não escreve nada no plano não merece destaque.
2. **Calma institucional, não entusiasmo tecnológico.** Nada de gradientes, néon, ícones de robô ou brilho de IA. A ferramenta fala com uma secretaria de educação, não com uma startup.
3. **Uma coisa em foco por vez.** Uma pergunta por tela, um número em destaque por cartão, um acento de cor por vista.
4. **Todo número tem origem.** Um valor sem o link "de onde vem?" está incompleto.
5. **Linguagem de educação na frente, termo técnico atrás.** "Internet e dispositivos" na tela; "Camada 3 · Infraestrutura e dispositivos (Krueger e Jackson, 2026)" no ⓘ e no plano.

## Conteúdo

- Escreva em frases curtas, na segunda pessoa ("você"), no presente. Explique por que pergunta antes de pedir a resposta: "Pergunto porque conexão e dispositivos costumam custar mais do que a ferramenta."
- Nomes de seção, capítulo e botão sem gerúndio: "Prova de conceito ou piloto", nunca "Escolhendo o piloto". Capitalização de frase, nunca Título Em Maiúsculas.
- Nunca fale em nome da UNESCO, da OCDE, do UNICEF ou de qualquer instituição. A frase de isenção acompanha a capa do plano e o rodapé: "Valores ilustrativos. A ferramenta não fala em nome da UNESCO ou de outra instituição."
- Cite só o guia do projeto e Krueger e Jackson (2026). Não invente referências.
- Rotule a origem de todo valor com uma destas quatro palavras, sempre as mesmas: **padrão** (premissa da ferramenta), **sugerido** (derivado de outra resposta, ainda não confirmado), **informado** (a pessoa respondeu), **refinado** (ajustado no modo Refinar).
- Sem emoji. Sem ponto de exclamação. Sem "incrível", "poderoso", "inteligente".
- Os nove idiomas compartilham a chave em português; o inglês é o padrão. Escreva textos 30% mais curtos do que o espaço permite, porque as traduções crescem.
- Os números de exemplo são ilustrativos e dizem isso perto de si. Nunca mostre um número calculado só com premissas padrão sem a etiqueta "estimativa com premissas padrão".

## Cor

- A base é neutra e fria: `surface-0` para a página, `surface-1` para cartões e campos, `surface-2` para preenchimentos quietos. O plano de contratação fica sobre `surface-plan`, um papel levemente quente, para o documento se distinguir do aplicativo.
- `primary` (azul-petróleo) é a única cor de marca da ferramenta. Use em botão primário, links, item ativo, barra de progresso e no capítulo 4. Hover e pressed em `primary-strong`; destaque leve em `primary-tint`.
- `accent` (âmbar) marca só o que acabou de mudar: o KPI que recebeu valor novo, a recomendação que acabou de surgir, o campo com valor sugerido. Depois de dois segundos, ou ao sair da tela, o destaque some. Como texto, use `accent-ink`. Uma vista nunca tem mais de um elemento em âmbar ao mesmo tempo.
- Os quatro capítulos têm uma cor cada, do claro ao escuro: `phase-1` a `phase-4`. Texto `ink` sobre as duas primeiras, `on-phase-dark` sobre as duas últimas. Use essas cores só em segmentos de progresso, na faixa da capa e nas células da matriz; nunca em botões.
- As sete camadas de custo usam `layer-1` a `layer-7`, só em gráficos e marcadores, com o rótulo sempre fora da barra em `ink`.
- Semântica de risco e estado em `ok`, `warn`, `high`, `crit` e `info`, cada uma com seu `-bg`. Nunca reutilize como cor de marca nem como acento. Cada pílula de risco carrega a palavra (Limitado, Moderado, Elevado, Crítico), nunca só a cor.
- Os logos da Cátedra UNESCO UNITWIN e do IA.EDU têm fundo branco: coloque-os sempre sobre uma placa `#ffffff` com borda `line`, nos dois temas. As cores dos logos (azul UNESCO, ciano, roxo, verde, rosa, amarelo do IA.EDU) não entram na interface.
- Tema escuro: todo token tem valor próprio; o primário clareia e por isso `on-primary` vira tinta escura. Nunca use branco literal sobre `primary`.

## Tipografia

- Interface em IBM Plex Sans (`sans`), títulos do plano em IBM Plex Serif (`serif`). A família Plex cobre latino, árabe e vietnamita com o mesmo desenho e tem versões Noto como reserva para chinês, isiZulu, kiswahili e bamanankan.
- A pergunta atual usa `question-26`; a explicação, `body-16`; metadados e origem, `caption-13`. Nunca abaixo de 13 px na interface e de 10 pt no PDF.
- Títulos de página do plano e sínteses de capítulo em `title-32`; o título do caso na capa em `display-48`; seções do plano em `title-24`.
- KPIs em `kpi-32` (página) ou `kpi-20` (painel), sempre com `font-variant-numeric: tabular-nums` e o rótulo em `caption-13` acima do número, nunca abaixo.
- `label-12` em maiúsculas com espaçamento só para rótulos de zona ("Seu plano · escrevendo"), sempre em `muted`, nunca para conteúdo.
- Carregue as fontes pelo Google Fonts: IBM Plex Sans 400, 500, 600 e IBM Plex Serif 500, 600. Para o PDF, use os subsets Noto já existentes no projeto.

## Espaço, forma e profundidade

- Escala de 4 px: `space-1` a `space-8`. Entre blocos dentro de uma seção, `space-5`; entre seções, `space-6`; margens de capa, `space-8`.
- Raios: `radius-md` em botões, campos e chips; `radius-lg` em cartões, painel e diálogos; `radius-sm` em etiquetas e barras; `radius-pill` em pílulas. Nada fora desses quatro valores.
- Bordas antes de sombras. Cartões usam borda `line`; `shadow-sm` só em cartão de opção em hover e em KPI; `shadow-md` só em painel aberto, diálogo e toast.
- Controles têm borda `line-control` (3:1), altura mínima de 44 px e área de toque de 44 × 44.
- Foco: contorno sólido de 2 px em `focus`, afastado 2 px, em todo controle, nos dois temas. Nunca remova o foco visível.
- Layout: a tela principal tem três zonas (percurso 260 px, pergunta fluida com máximo de 640 px de leitura, plano 400 px). Abaixo de 1100 px, o plano vira uma gaveta inferior; abaixo de 900 px, o percurso vira uma barra de capítulos no topo. A 400 px nada rola horizontalmente e nenhuma fonte diminui: tabelas largas viram cartões empilhados.
- Movimento: só três transições, todas de 200 ms com `ease-out`: o realce âmbar do que mudou, a abertura do painel e a troca de pergunta. Respeite `prefers-reduced-motion` desligando todas.

## Iconografia

- Ícones de traço, 1,5 px, 20 × 20, em `ink` ou `muted`, do conjunto Lucide (MIT). Sem ícones preenchidos, sem emoji, sem ícone de robô ou cérebro.
- Ícones só acompanham texto; um botão só com ícone leva `aria-label`.
- Marcas de estado no percurso: ✓ respondido, ● atual, ○ pendente, ~ sugerido. São glifos de texto, não ícones, para sobreviverem a qualquer idioma e ao PDF.

## Marcas e vínculo

- O vínculo institucional aparece no cabeçalho (placa branca com os dois logos, 40 px de altura em desktop, 28 px em celular) e na capa do plano. Texto do vínculo: "Projeto vinculado à Cátedra UNESCO UNITWIN de Inteligência Artificial Desplugada na Educação e ao IA.EDU."
- O nome da ferramenta é sempre "AI in Education Procurement Tool", em inglês, em `heading-18` no cabeçalho. Nunca traduza, nunca abrevie.
- Os logos estão em `assets/Logos/`; use os arquivos, nunca redesenhe.

## Componentes

Cada componente tem um preview e uma diretriz própria. Os que carregam a narrativa são `PlanPanel` (o plano que se escreve), `ChapterNav` e `ChapterBar` (o percurso), `ChapterOpening` e `ChapterSummary` (abertura e síntese), `KpiTile` e `SourceTag` (todo número tem origem) e `Recommendation` (o que fazer). Os de formulário são `Button`, `TextField`, `OptionCard`, `Chip` e `Segmented`. Os de leitura são `RiskPill`, `Alert`, `DataTable` e `LayerBars`. `Header`, `Dialog` e `Toast` completam o conjunto.

## Acessibilidade

- Texto a 4,5:1 ou mais sobre o fundo que a nota do token nomeia, nos dois temas; 3:1 para texto a partir de 24 px, bordas de controle, anel de foco e marcas de gráfico.
- Toda cor de estado vem com palavra. Verde e vermelho de risco diferem em luminosidade, não só em matiz.
- Tudo opera por teclado na ordem de leitura; diálogos prendem o foco e devolvem ao botão de origem; `Esc` fecha.
- Gráficos SVG levam `role="img"`, `aria-label` com a conclusão e os valores também em texto.
- Idiomas da direita para a esquerda (árabe) espelham o layout: o painel do plano vai para a esquerda.
