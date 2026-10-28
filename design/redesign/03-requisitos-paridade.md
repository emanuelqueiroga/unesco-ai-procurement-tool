# Requisitos de paridade: 0.0.14 (v13) × 0.1.x (v14)

28 de outubro de 2026. Resultado da engenharia reversa da versão publicada (0.0.14), feita área por área e comparada com a 0.1.0-alpha.3. Os inventários completos, com arquivo e função de cada item, estão em `paridade/PER.md` (percurso e perguntas), `paridade/CUS.md` (custos e calculadora), `paridade/PLA.md` (plano e exportações) e `paridade/TRA.md` (transversal). Este documento consolida os 109 requisitos levantados, registra as decisões e divide o trabalho em pacotes.

Regra geral: a v14 não pode deixar a pessoa fazer menos do que a v13 fazia. A forma muda (modo Essencial e modo Refinar, capítulos, plano ao lado), a capacidade não. P1 = sem isso a v14 é pior que a v13; P2 = importante; P3 = desejável.

## Decisões

| Tema | Decisão |
|---|---|
| Perguntas fora do Essencial (lista de ferramentas, arquitetura, subcategorias, "outro problema", detalhe da linha de base, "Qual?/O que falta?" da governança, estudantes por ano) | Entram no modo Refinar, dentro do capítulo, como a especificação já previa. No Essencial nada muda. |
| Limite de 3 problemas no Essencial (PER-15) | Mantido no Essencial, com o motivo dito na tela. No Refinar o limite sai e volta o "Marcar todos" por prioridade, como na v13 e no pedido original. |
| Calculadora (CUS-01 a CUS-31) | Volta como a tela Refinar `#/refinar/:aba` em três abas (Premissas por ano; Ferramentas e licenças; Cenários e sensibilidade), com "de onde vem?" nos números do plano. |
| Moeda e taxa de câmbio | Voltam na calculadora e na caixa Caso; valem para a página, o painel e o PDF. |
| Cores das camadas (PLA-13) | Ficam as do Prumo nas telas e no PDF (identidade nova); a legenda continua citando Krueger e Jackson (2026). |
| Exportações Markdown, HTML e "Copiar texto" (PLA-14) | Fora, como decidido na especificação. CSV de custos volta com botão na calculadora (CUS-22). |
| Análise por IA da descrição (PER-30) | Fora da 0.1.x, como na especificação. |
| Mandala, acordeão de fases, stepper, "Para a implantação" (PER-31) | Fora: substituídos pelos capítulos. |
| "Reproduzir os números da versão 1 do guia" (CUS-26) | Fora da interface; continua coberto pelos testes de regressão. |
| Impressão (PLA-07, TRA-16) | `@media print` mínimo; o caminho principal continua sendo o PDF. |

## Pacotes de trabalho

Cada pacote tem arquivos próprios, para os agentes trabalharem ao mesmo tempo sem se atropelar. Modelo escolhido pela complexidade: o Refinar mexe no motor de custos e no estado (agente de maior capacidade); os demais são telas com especificação fechada (agente mais barato), com revisão do orquestrador.

| Pacote | Requisitos | Arquivos | Agente |
|---|---|---|---|
| F — Fundação | TRA-02, CUS-09 (campo numérico por idioma), CUS-02 (Popover), TRA-01/PER-09/TRA-13 (confirmação), TRA-20 (aviso de status) | `ui/NumeroField`, `ui/Popover`, `screens/Confirmar.tsx`, `screens/Avisos.tsx` | orquestrador |
| P1 — Perguntas no Refinar | PER-01 a PER-08, PER-11, PER-14 a PER-16, PER-18, PER-20, PER-21, PER-24 a PER-26, PER-28, TRA-26 | `percurso/Controles.tsx`, `percurso/controles.css`, `screens/Percurso.tsx`, `store/selectors.ts` | Sonnet |
| P2 — Calculadora Refinar | CUS-01, CUS-03 a CUS-25, CUS-27 a CUS-31 | `screens/Refinar*.tsx`, `screens/refinar.css`, `store/caso.ts`, `percurso/rota.ts`, `App.tsx` | Opus |
| P3 — Plano | PLA-01 a PLA-12, PLA-15 a PLA-20, CUS-02 (no plano), PER-19, PER-27, PER-29 | `screens/Plano.tsx`, `screens/Secao.tsx`, `screens/plano.css`, `plano/secoes.js`, `plano/pdf.js`, `percurso/painel.ts` | Sonnet |
| P4 — Transversal | TRA-01, TRA-03 a TRA-11, TRA-13 a TRA-18, TRA-20 a TRA-26, PER-09, PER-10, PER-12, PER-13, PER-17, PER-22, PER-23, PLA-10 | `screens/Shell.tsx`, `Inicio.tsx`, `CasoDialog.tsx`, `Idioma.tsx`, `main.tsx`, `i18n/index.ts`, `ui/*` (contraste e tamanhos), `screens/shell.css`, `index.html`, `vite.config.ts` | Sonnet |
| T — Traduções | textos novos dos pacotes nos 8 idiomas | `i18n/v14_*` | Sonnet |

## Requisitos por área

Os textos completos de cada requisito, com critério de verificação e decisão de UX, estão nos arquivos de `paridade/`. Resumo do que muda para quem usa:

- **Percurso (PER, 31):** voltar a deixar responder as perguntas que só existiam na v13 (ferramentas com preço, arquitetura, subcategorias, outro problema, detalhe da linha de base, detalhes da governança, estudantes por ano); aviso quando uma sugestão nova difere de uma resposta já confirmada; contar como respondida só a tela com resposta real; ⓘ de exemplos das prioridades; matriz camadas × fases e Figura 1 acessíveis fora do plano.
- **Custos (CUS, 31):** calculadora completa no Refinar, "de onde vem?" em todo número, moeda e taxa, campos decimais por idioma, aviso antes de descartar edições, cenários, sensibilidade, Monte Carlo, licença × arquitetura, CSV.
- **Plano (PLA, 21):** links "rever a resposta" que sempre levam a um lugar respondível; contagem de lacunas igual na página e no PDF; fatos do caso no lugar da tabela longa no Em resumo; gráfico de dotação por exercício na página; Figura 1 ampliável; índice interno nas páginas longas; impressão; testes de interface do plano.
- **Transversal (TRA, 26):** confirmação antes de apagar o caso; números formatados enquanto se digita; rodapé institucional com isenção e versão em todas as telas; acessibilidade (contraste, 13 px mínimo, foco); idioma consistente ao importar e nos exemplos; árabe com valores no lugar; título da aba por tela; aviso quando o navegador não salva.
