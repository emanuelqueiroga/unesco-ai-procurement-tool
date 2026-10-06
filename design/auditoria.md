# Auditoria visual — Navegador de decisão de IA na educação

Renderizado em 1360 px e 400 px, temas claro e escuro, abas O caso, Diagnóstico, Percurso,
Verificações, Custos (com modo avançado) e Relatório. Prioridade: P1 bloqueia o uso ou a marca,
P2 prejudica a leitura, P3 é acabamento.

## P1 — corrigir antes de publicar
1. **Logos sem estilo.** `.logos`, `.logo-*` e o rodapé não têm CSS: as PNGs aparecem com 80 px de
   altura, coladas uma na outra, com o fundo branco "cortando" a barra azul. A marca da Cátedra fica
   maior que o título da ferramenta.
2. **Cabeçalho fixo ocupa ~30% da tela no celular** (≈260 px de 860): logos, título, subtítulo e dois
   seletores em quatro linhas, sempre visíveis por cima do conteúdo.
3. **Rodapé sem desenho.** Texto corrido de borda a borda, sem margens, sem hierarquia entre vínculo,
   descrição e isenção da UNESCO; em abas curtas o rodapé "flutua" no meio da página.
4. **Gráficos ilegíveis no celular.** Os SVG com viewBox de 640–780 encolhem para 360 px: rótulos
   chegam a ~6 px. No desktop acontece o inverso: o texto do gráfico (≈17 px) fica maior que o da UI.
5. **Contraste insuficiente em marcadores de decisão.** Círculos PD em ouro `#C9962B` com número branco
   (2,6:1). Ouro também é a cor de "moderado" e de "atenção": o ponto de decisão se confunde com risco.

## P2 — leitura e hierarquia
6. **Cores semânticas e de marca misturadas.** Alerta "info" usa roxo; nível moderado, atenção e ponto
   de decisão usam o mesmo ouro. O novo roxo/amarelo do IA.EDU agravaria a confusão.
7. **Paleta K1–K6 sem relação com a marca** e sem variante escura; K1 roxo-escuro some no tema escuro;
   laranja do tornado (`#B4471B`) é idêntico ao nível "elevado".
8. **Aba Custos densa e plana.** Cartões, tabelas e gráficos têm o mesmo peso; h3 de seção e h3 dentro
   de cartões são iguais; o modo avançado não se distingue do resto; espaçamento uniforme de 18 px não
   separa blocos.
9. **KPIs**: valor e rótulo sem ritmo (rótulos de 1 a 3 linhas desalinham a grade), sem rótulo-guia.
10. **Tabelas**: cabeçalho em maiúsculas com tracking pesa mais que os dados; linha de total pouco
    destacada; `th` dentro de `tbody` (relatório) sem estilo; entradas numéricas sem alinhamento à direita.
11. **Seletores do cabeçalho** com rótulo e campo na mesma linha; "Carregar" sem contexto; seletor de
    caso cresce até a opção mais longa (quebra com traduções ~30% mais longas).
12. **Navegação lateral**: aba ativa só com sombra leve; sem indicador de estado claro. No celular,
    as abas rolam sem sinal de que há mais itens.

## P3 — acabamento
13. Títulos em serifa azul-marinho com fallback Georgia: aparência datada; h1/h2/h3 sem escala clara.
14. Bordas arredondadas e sombras inconsistentes (4, 6, 8, 15, 999 px).
15. Foco visível usa a mesma cor dos links; não há anel distinguível em botões preenchidos.
16. Toast cobre o conteúdo no centro da tela (desktop) sem sombra nem borda.
17. `.btn.pri:hover` usa `filter: brightness`, que no escuro clareia texto e fundo juntos.
18. Sem `prefers-reduced-motion` para `scroll-behavior` e sem `font-variant-numeric` em KPIs da lateral.

## Direção adotada
- Base neutra fria, azul UNESCO (`#0069B4`, amostrado do logo) como primária; títulos em azul-tinta.
- Acentos IA.EDU amostrados do logo (ciano `#13C9EE`, roxo `#7844C4`, verde `#32FC7F`,
  rosa `#EF557F`, amarelo `#F6CE01`) só em detalhes: filete do cabeçalho, indicador da aba, anel de
  foco (ciano escurecido), marcadores de ponto de decisão (roxo), paleta K1–K6.
- Verde e amarelo neon nunca carregam texto; variantes escuras com contraste AA para texto.
- Semântica de risco (verde-musgo, âmbar, laranja, vermelho) e "info" em ardósia, separadas da marca.
- Cabeçalho branco com placa branca para os logos (escuro: placa branca sobre barra escura).
