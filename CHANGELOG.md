# Changelog

All notable changes to the AI in Education Procurement Tool are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/). While the tool is a pre-MVP, releases are numbered `0.0.x`. Earlier labels "version 9" to "version 13" correspond to `0.0.9` to `0.0.13`.

## Pre-releases (review builds, not published as stable)

Published under `docs/revisao/` with a yellow banner. Not part of the stable line.

- **0.0.16-alpha.b3**: redesign proposal B3 (workspace layout, easier filling with explanations on every question, three switchable appearances). Branch `v15-proposta-b3`. URL: `/revisao/b3/`.
- **0.0.16-alpha.a / .b / .c**: redesign proposals A (guided assistant), B (workspace with cost panel), C (living document). Branches `v15-proposta-a`, `-b`, `-c`. URLs: `/revisao/a/`, `/revisao/b/`, `/revisao/c/`.
- **0.0.15-rc.1**: formerly "version 14 review". Step explanations, cost by phase and adoption curve, reference cost base and country profiles, procurement plan with executive summary and icebergs by phase. Branch `v14-revisao`. URL: `/revisao/`.

## [0.1.0-alpha.5] - 2026-10-28

Fifth pre-release of the redesign line (`develop` branch), published as the review build `/revisao/v014/`. It brings in what the 0.0.15-rc.1 review (`/revisao/`, branch `v14-revisao`) added on top of 0.0.14, mapped in `design/redesign/04-requisitos-0015.md` and `design/redesign/paridade-0015/` (70 requirements: AJU, MOT, REF, REL). The numbers of the examples and of every regression test are unchanged.

### Added
- Executive summary in "Em resumo": total life-cycle cost with the likely range (P10 to P90, 1,500 simulations with a fixed seed), the cost of Year 0, the steady-state annual cost and the cost per learner with access and per active user (each named by its denominator), "A proposta em seis respostas" (O quê, Por quê, Para quê, Como, Entregáveis, Indicadores), the five first actions as cards with O quê, Por quê, Para quê, Como, Quem and Quando, "O custo em resumo" with one iceberg per phase (the proposal price above the waterline, everything else below), and the three drivers that move the cost most. Same content in the PDF.
- "Quanto custa": cost by phase (proof of concept or pilot, deployment, expansion; one-off and recurring; people reached), total-cost indicators (nominal, equivalent annual cost, per learner and per teacher, recurring share, steady-state year), adoption, scenarios, all drivers and the uncertainty simulation. Each page opens with its decision question and a finding title written from the numbers.
- Appendix: "Premissas e fontes" (every assumption with value, origin, source, year, grade and reference range, out-of-range flagged, versions of the reference base) and "Glossário".
- Cost engine of 0.0.15 (phases, adoption curve, device replacement, training turnover, one-off × recurring, new indicators) and its four optional questions in Refinar (4.1.4 curve, 4.1.5 waves, 4.1.6 replacement, 4.1.7 turnover). Calculator: one-off/recurring tags, phase columns in the CSV, cost by phase by layer and component, replacement cycle and turnover fields.
- Versioned reference base (`data/referencias.json`, 70 rows) and five pilot country profiles (`data/paises.json`), checked at build time (`app/scripts/checar-referencias.mjs`). Optional country on the "Nome do lugar ou da rede" screen (currency follows the country while it is still US$), "Dados do país" in the calculator, source/year/grade and "seu valor · faixa de referência" on every premise, "fora da faixa" and "restaurar".
- Help: "Como responder", "Quem costuma saber" and "Exemplo" inside "Por que perguntamos isso?" (closed by default), tips on the Refinar questions, chapter openings that say what you leave with, the layers ⓘ on chapter 3, and a glossary of 15 terms underlined in the help texts (keyboard and screen-reader accessible).
- Every new text in the nine languages (`i18n/v15_*`); Arabic, Chinese, Bambara, isiZulu and Kiswahili remain preliminary.
- Tests: 445 unit tests (including the 0.0.15 engine test with its v13 baseline and the reference-base tests) and 225 end-to-end checks.

### Fixed
- The same cost per person was called "por estudante" on the page and "por usuário ativo" in the PDF; internal codes (A2., K3.3) no longer show in "Quanto custa"; the "Alimenta:" layers of chapters 2 and 3.

### Not included
- The per-step memory of the help panel (0.0.15), the "one-page summary" that ran to three pages, and the blank-case cost without a label (the "Ainda sem números" rule stays).

## [0.1.0-alpha.4] - 2026-10-28

Fourth pre-release of the redesign line (`develop` branch), published as the review build `/revisao/v014/`. Parity with 0.0.14: the published tool was reverse-engineered area by area and every capability it had and the redesign lacked became a requirement (`design/redesign/03-requisitos-paridade.md`, with the full inventories in `design/redesign/paridade/`: 109 requirements, PER, CUS, PLA and TRA). The rule is that the redesign may change the form but never let people do less than 0.0.14 did.

### Added
- Cost calculator back as the Refinar screen `#/refinar` in three tabs: "Premissas por ano" (demand, inputs, time and exchange rate, advanced economic account), "Ferramentas e licenças" (tools, licence × architecture, SaaS) and "Cenários e sensibilidade" (scenarios, tornado, Monte Carlo, equity strata, alternatives and cost-effectiveness, price index, LMDI). Currency and exchange rate for the page, the panel and the PDF; costs as CSV. Edits are kept when an answer changes: the calculator says so and offers to keep them or rebuild from the answers.
- "de onde vem?" on every number of the plan: origin, how it is calculated, the assumptions behind it, and links to adjust them in the calculator or go to the question.
- Refinar mode asks again what only 0.0.14 asked: the tool list with prices, architecture, problem subcategories, "other problem", baseline detail, "Qual?/O que falta?" for governance and students by year or grade. The three-problem limit stays in Essencial (with the reason on screen); Refinar has "Marcar todos".
- A warning when a new suggestion differs from an answer already confirmed, with "Manter a minha", which is remembered.
- Numbers formatted while typing in each language (1.600.000 / 1,600,000), decimals and percentages.
- Confirmation before erasing the case (start blank, open an example or import over an edited case), with "Exportar o caso antes"; short status messages.
- Layers × phases matrix and Figure 1 reachable from every screen ("Matriz" in the header, "Ver na matriz" on each chapter).
- Institutional footer with the disclaimer and the version on every screen; page title per screen; a warning when the browser cannot save.
- Plan: links "rever a resposta" that always lead to a place where the answer can be given; the same count of gaps on the page and in the PDF; case facts in "Em resumo"; appropriation by fiscal year on the page; enlargeable Figure 1; internal index on long pages; long tables collapsed; minimal print layout. The live plan lists what is missing for the first number.
- 235 new interface texts translated into the eight other languages (`i18n/v14_par_<lang>.json`).
- Tests: 303 unit tests and 225 end-to-end checks (new: calculator, "de onde vem?", matrix, confirmation, footer, Arabic on the calculator and the plan).

### Changed
- A question screen counts as answered only with a real answer (a suggested text with blanks to fill does not count).
- Minimum text size 13 px and logical CSS properties everywhere, so Arabic keeps values in place; back arrows point the right way in right-to-left.

### Not included (decisions)
- Markdown, HTML and "Copiar texto" exports of the plan, AI analysis of the description, the mandala and phase accordion of 0.0.14, and the button that reproduces the guide's version-1 numbers (still covered by regression tests).

## [0.1.0-alpha.3] - 2026-10-28

Third pre-release of the redesign line (`develop` branch), published as the review build `/revisao/v014/`. It brings back what the 0.0.14 tool already had at the end of the journey and in every language.

### Added
- The complete procurement plan in five pages: "Em resumo", "Quanto custa", "O que fazer", "O que exigir" and "Apêndice" (case profile, layers × phases matrix, Figure 1, references, missing answers). All sections A1–A7 and B1–B9 of the 0.0.14 plan are there, ported from `src/resumo.js` to `app/src/plano/secoes.js` as pure functions with a page assigned to each section.
- The plan as a PDF report ("Baixar o plano em PDF" on every plan page and at the end of chapter 4): port of `src/plano_pdf.js` to `app/src/plano/pdf.js` with jsPDF 2.5.2 and AutoTable 3.8.4 from npm, loaded on demand. The PDF follows the new page order, uses the Prumo colours, and keeps the 0.0.14 features: Arabic shaping and right-to-left lines, Chinese line wrapping, embedded font subsets for Arabic, Chinese and Bambara (`npm run fontes-pdf`), the preliminary-translation notice and the version in the footer.
- Language selector in the header with the nine languages of 0.0.14 (English, Português, Español, Français, العربية, 中文, Bamanankan, isiZulu, Kiswahili). All 334 new interface texts are translated (`i18n/v14_ui_<lang>.json`, `i18n/v14_ui2_<lang>.json`); Arabic, Chinese, Bambara, isiZulu and Kiswahili remain preliminary translations, with the notice in the language and in English. Arabic switches the whole layout to right-to-left; the language fonts load without blocking the page.
- `app/scripts/chaves-v14.mjs` lists the interface keys and the ones missing per language; `tests/unit/idiomas.test.ts` fails if any language misses a key or a placeholder.
- Tests: 171 unit tests (19 for the plan and the PDF) and 151 end-to-end checks, now including the nine languages, right-to-left without horizontal scrolling and the language switch on the plan.

### Changed
- The tool opens in English when no language was chosen before (the 0.0.14 team decision); the first screen waits for the dictionary, so it never flashes Portuguese.
- Recommendations and the answers they quote are translated (they were shown in Portuguese in other languages).
- Labels inserted in sentences keep acronyms (AI, IA) when lowercased.

## [0.1.0-alpha.2] - 2026-10-28

Second pre-release of the redesign line (`develop` branch): the question journey of the new interface works end to end. Still not published; the stable `0.0.14` is untouched.

### Added
- The journey of narrative A with the chapter rhythm of B: start page, chapter openings, the 25 Essencial questions (one screen each, with the controls of the Prumo design system), chapter summaries written from the answers, and a plan that writes itself next to the questions. Routes by hash (`#/capitulo/2/piloto`), so the page works from GitHub Pages or a local file.
- "Seu plano" panel (≥ 1100 px) and bottom drawer (phones): title, facts, four KPIs with their origin, the first recommendations. The first number appears when the type of technology (2.3.4) is answered; only one item is highlighted in amber after each answer (the first KPI that changed, otherwise the first new recommendation).
- Suggestions are shown as such ("~ sugerido pelas tarefas da IA (2.1.1)") and "Aceitar a sugestão e continuar" turns them into answers; "Pular por agora" never blocks.
- Plan pages "Em resumo" (cover, main recommendation, KPIs with origin tags, cost by layer, top three actions), "O que fazer" (all recommendations by moment, each linking back to the question that produced it) and "Respostas que faltam".
- Refinar mode: the same screens, plus the non-Essencial questions of each chapter at the end of the chapter summary, with the default premise open for editing.
- "Caso" dialog: export and import the case (JSON, format 14), the four illustrative examples, start blank, mode, language and appearance.
- Tests: `tests/unit/percurso.test.ts` (routes, plan projection, chapter summaries; 145 unit tests in total) and `tests/e2e/percurso.mjs` (`npm run e2e`), which answers the 25 questions through the interface at 1360 px and 400 px and checks the first number, the summaries, the final plan, the saved origins, JSON export, reload and the absence of horizontal scrolling (118 checks).

### Changed
- The browser save is flushed when the tab is hidden or closed, so the last answer is never lost.
- Examples mark every filled value as answered, so an example opens with all 25 Essencial questions complete.
- Prumo components: long labels wrap inside option cards and chips (no horizontal scrolling at 400 px); KPI values and layer-bar values never wrap.
- The interface starts in Portuguese unless the case has another language: the new texts of this line exist only in Portuguese until the `v14_<lang>.json` dictionaries are written, and starting from the browser language would mix two languages on the same screen.

### Not yet
- "Quanto custa" (table by layer and year with "de onde vem?"), "O que exigir", the appendix, the Refinar calculator and the PDF come in `0.1.0-alpha.3`.

## [0.1.0-alpha.1] - 2026-10-28

First pre-release of the redesign line (`develop` branch). It is not published and not usable as a tool yet: it contains the engine, the state model and the component library of the new implementation, without the question screens. The stable `0.0.14` is untouched.

### Added
- `app/`: a new implementation in React 18, TypeScript and Vite, built from scratch next to the legacy page (`src/`, `build.sh`), with `npm test` (Vitest, 128 tests), `npm run lint:domain` and `npm run build` (output in `docs/app/`, not committed yet).
- `app/src/domain/`: the v13 cost engine, framework, recommendation rules (66), priorities catalogue, question catalogue, formulas, matrix and i18n as pure ES modules. Functions that read the legacy global `S` now take the case state as a parameter; `scripts/check-domain.mjs` fails the build if any domain file touches the DOM, `localStorage` or `S`.
- `app/src/store/`: the case state as a Zustand store in **data format 14** = format 13 plus `origem` (`padrao` | `sugerido` | `informado` | `refinado` for every answer), `sugestoes` (which answer produced each suggestion), `modo` (`essencial` | `refinar`) and `capitulo`. Suggestions cascade as pure functions and never overwrite an answer the person gave. `migrar()` accepts exported cases in formats 9, 11, 13 and 14, the browser state saved by 0.0.9–0.0.14 and the cases of the earlier "Navegador de IA na Educação" app, and derives `origem`. The browser key is `aiedu-procurement-v14`; the keys of the stable version and of the earlier app are read but never changed.
- `app/src/store/perguntas.ts`: the 25 questions of the Essencial mode (24 from the specification plus 1.2.8, kept by decision of 28/10/2026) in four chapters, and the map from each answer to the plan excerpts it can change.
- `app/src/ui/`: the Prumo design system as React components (25 components, light and dark themes, tokens compiled from `design/redesign/prumo/tokens.json` by `scripts/tokens.mjs`), with a gallery at `#/galeria`.
- `app/src/i18n/`: dictionaries built from `i18n/*.json` by `scripts/i18n.mjs` with the same precedence as `build.sh`, loaded on demand.
- `design/redesign/`: UX model, reimplementation specification, wireframes, Prumo brand book and mockups (from branch `redesign-v14`).

### Changed
- Versioning: the redesign uses the `0.1.x` line (`0.1.0-alpha.1` engine and components, `0.1.0-alpha.2` screens, `0.1.0` publication). The `0.0.x` line remains the stable tool until `0.1.0` replaces it.

## [0.0.14] - 2026-10-27

### Added
- "Home" button in the header, available on every screen; it returns to the start page without deleting the saved case and offers to continue it.
- "Layers × phases matrix" button in the header, so the matrix opens from any screen, not only from the start page.
- Version number and build date in the page footer and in the PDF footer, read from the new `VERSION` file.
- `CHANGELOG.md`, `VERSION` and a versioning section in the README.

### Fixed
- When a blank case was saved in the browser (for example, by a review build at the same address), the tool opened straight into step 1.1 with no way back to the start page, so the matrix could not be reached.

### Changed
- Review builds (`CANAL=revisao`) keep their saved case under their own browser key. The stable version keeps the same key as before, so saved cases are not lost.
- No change to the cost engine, the figures or the procurement plan.

## [0.0.13] - 2026-10-16

Previously "version 13". Start page with the four phases and the layers × phases matrix; priorities and problems in step 1.2; case matrix in the plan; preliminary translations into Arabic, Chinese, Bambara, isiZulu and Kiswahili; public repository with the page in `docs/`.

## [0.0.12] - 2026-10-07

Previously "version 12". Redesigned report (page and PDF), Figure 1 by default and figure viewer.

## [0.0.11] - 2026-10-07

Previously "version 11". Four phases, adoption with tools, infrastructure, training, support; PDF generation in its own module.

## [0.0.10] - 2026-10-06

Previously "version 10". Defaults when an option is chosen, recommendations for the case and a clearer cost formula.

## [0.0.9] - 2026-10-06

Previously "version 9". First version with the current state format.

[0.0.14]: https://github.com/emanuelqueiroga/unesco-ai-procurement-tool/compare/v0.0.13...v0.0.14
[0.0.13]: https://github.com/emanuelqueiroga/unesco-ai-procurement-tool/releases/tag/v0.0.13
[0.0.12]: https://github.com/emanuelqueiroga/unesco-ai-procurement-tool/releases/tag/v0.0.12
[0.0.11]: https://github.com/emanuelqueiroga/unesco-ai-procurement-tool/releases/tag/v0.0.11
[0.0.10]: https://github.com/emanuelqueiroga/unesco-ai-procurement-tool/releases/tag/v0.0.10
[0.0.9]: https://github.com/emanuelqueiroga/unesco-ai-procurement-tool/releases/tag/v0.0.9
