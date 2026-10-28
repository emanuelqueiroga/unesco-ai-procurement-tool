# Changelog

All notable changes to the AI in Education Procurement Tool are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/). While the tool is a pre-MVP, releases are numbered `0.0.x`. Earlier labels "version 9" to "version 13" correspond to `0.0.9` to `0.0.13`.

## Pre-releases (review builds, not published as stable)

Published under `docs/revisao/` with a yellow banner. Not part of the stable line.

- **0.0.16-alpha.b3**: redesign proposal B3 (workspace layout, easier filling with explanations on every question, three switchable appearances). Branch `v15-proposta-b3`. URL: `/revisao/b3/`.
- **0.0.16-alpha.a / .b / .c**: redesign proposals A (guided assistant), B (workspace with cost panel), C (living document). Branches `v15-proposta-a`, `-b`, `-c`. URLs: `/revisao/a/`, `/revisao/b/`, `/revisao/c/`.
- **0.0.15-rc.1**: formerly "version 14 review". Step explanations, cost by phase and adoption curve, reference cost base and country profiles, procurement plan with executive summary and icebergs by phase. Branch `v14-revisao`. URL: `/revisao/`.

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
