# Redesign v14 — material de UX e design

Material produzido em 27 de outubro de 2026 para o redesenho da AI in Education Procurement Tool, na ordem em que foi decidido.

| Pasta ou arquivo | O que é | Versão viva |
| --- | --- | --- |
| `01-modelo-de-ux.md` | Modelo de UX: usuários e modos (Essencial e Refinar), princípios, arquitetura de informação de 51 para 24 perguntas, três propostas de narrativa e a decisão (A + ritmo da B) | https://claude.ai/artifact/5QvKB2ZSUokhgYtxSeXacE |
| `wireframes/` | Protótipos navegáveis em cinza das três narrativas (13 telas, formato `.dc.html` do canvas Design) | https://claude.ai/artifact/LgArTmVLpymbT4QjnHkdRa |
| `prumo/` | Design system Prumo: `README.md` (brand book), `tokens.json` (cores claro/escuro, tipografia, espaçamento, raios, sombras), `components/<Nome>/README.md` e `preview.html` (19 componentes), `assets/Logos/` | https://claude.ai/artifact/FW24XMHdnTvMRNq78bqgdY |
| `mockups/` | Mockups com o Prumo aplicado: 12 telas de desktop (1360 px), 4 de celular (400 px) e as partes reutilizadas; `prumo.css` é a compilação dos tokens em variáveis CSS | https://claude.ai/artifact/W5XfuSdxyb4VBTvitiGNn9 |

## Como usar os arquivos

Os `.dc.html` são páginas HTML completas: abrem em qualquer navegador. Os mockups carregam `prumo.css` por caminho relativo e as fontes IBM Plex pelo Google Fonts; as partes importadas (`PartHeader`, `PartNav*`, `PartPlan*`) só renderizam dentro do canvas, mas os arquivos de tela têm o conteúdo próprio inteiro. Os logos aparecem nos canvases por `/_blob/…`; nos arquivos locais, substitua por `prumo/assets/Logos/*.png`.

Para implementar, a fonte de verdade é `prumo/tokens.json` (nunca os hex espalhados pelos mockups) e as diretrizes em `prumo/README.md` e `prumo/components/*/README.md`. `mockups/prumo.css` mostra como os tokens viram `:root` e `[data-theme="dark"]`.

## Decisões registradas

- Narrativa: o plano se escreve enquanto a pessoa responde (A), com abertura e síntese de capítulo (B) e o tom de voz explicativo (C).
- Dois usuários: gestora de educação (modo Essencial, 25 perguntas) e técnico de compras ou TI (modo Refinar, mesmas telas com as premissas abertas).
- Identidade própria (Prumo): azul-petróleo como única cor de marca, âmbar só para o que acabou de mudar, uma cor por capítulo, cores das sete camadas só em gráficos, IBM Plex Sans e Serif. Os logos da Cátedra UNESCO UNITWIN e do IA.EDU aparecem sobre placa branca e não ditam as cores.
- Reimplementação em React + TypeScript + Vite, reaproveitando motor de custos, regras de recomendação e i18n como módulos (especificação em `02-especificacao-reimplementacao.md`).
- Decisões de 28/10/2026: horizonte padrão de 3 anos (como no código); a alternativa sem IA (1.2.8) fica no Essencial.

Valores nas telas são ilustrativos. A ferramenta não fala em nome da UNESCO ou de outra instituição.
