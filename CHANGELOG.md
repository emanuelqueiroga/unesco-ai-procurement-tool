# Changelog

All notable changes to the AI in Education Procurement Tool are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/). While the tool is a pre-MVP, releases are numbered `0.0.x`. Earlier labels "version 9" to "version 13" correspond to `0.0.9` to `0.0.13`.

## Pre-releases (review builds, not published as stable)

Published under `docs/revisao/` with a yellow banner. Not part of the stable line.

- **0.1.0-alpha.3**: redesign with the Prumo design system, reimplemented in React (branch `develop`, tag `v0.1.0-alpha.3`): the 25 Essencial questions in four chapters, chapter summaries, a plan that writes itself next to the questions, the full plan in five pages (Em resumo, Quanto custa, O que fazer, O que exigir, Apêndice), the PDF report and the nine languages of 0.0.14. Replaces 0.1.0-alpha.2 at the same address. Built with `VITE_CANAL=revisao` (yellow banner, noindex, its own browser key). URL: `/revisao/v014/`.
- **0.0.16-alpha.b3**: redesign proposal B3 (workspace layout, easier filling with explanations on every question, three switchable appearances). Branch `v15-proposta-b3`. URL: `/revisao/b3/`.
- **0.0.16-alpha.a / .b / .c**: redesign proposals A (guided assistant), B (workspace with cost panel), C (living document). Branches `v15-proposta-a`, `-b`, `-c`. URLs: `/revisao/a/`, `/revisao/b/`, `/revisao/c/`.
- **0.0.15-rc.1**: formerly "version 14 review". Step explanations, cost by phase and adoption curve, reference cost base and country profiles, procurement plan with executive summary and icebergs by phase. Branch `v14-revisao`. URL: `/revisao/`.

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
