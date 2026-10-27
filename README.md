# AI in Education Procurement Tool

A single-page web tool that helps education systems plan the procurement of artificial intelligence: from context to proof of concept or pilot, deployment and scale-up. It estimates the life-cycle cost by layer and ends with a procurement plan (page and PDF) and recommendations for the case.

Version 0.0.14 (October 2026; see [CHANGELOG.md](CHANGELOG.md)). Values are illustrative. The tool does not speak on behalf of UNESCO or any other institution.

## Versioning

The tool follows [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`). While it is a pre-MVP, it stays at `0.0.x`: every published release increases the last number. The `VERSION` file holds the current number; the build injects it into the page footer and the PDF footer.

- **Stable**: the `main` branch and `docs/index.html` (GitHub Pages). Each stable release has a Git tag `v0.0.x` and a GitHub release.
- **Review builds**: pre-release versions such as `0.0.15-rc.1` or `0.0.16-alpha.b3`, published under `docs/revisao/` with a yellow banner and `noindex`. They are built with `CANAL=revisao bash build.sh` and keep their saved case under their own browser key, so they never change the case saved by the stable version.
- Earlier labels ("version 9" to "version 13") correspond to `0.0.9` to `0.0.13`.
- Release notes are kept in `CHANGELOG.md` (Keep a Changelog format).

## Use

- Open `docs/index.html` in a browser, or publish the `docs/` folder with GitHub Pages (Settings → Pages → Branch `main`, folder `/docs`).
- Answers are saved only in the browser. Cases can be exported and imported as JSON.
- Languages: English (default), Português, Español, Français, العربية, 中文, Bamanankan, isiZulu, Kiswahili. The last five are preliminary translations that still need review by native speakers; the tool shows a notice when they are selected.

## Structure

| Path | Content |
|---|---|
| `src/` | Scripts and styles (flow, cost engine, recommendations, plan and PDF, start page and layer × phase matrix) |
| `i18n/` | Dictionaries. The Portuguese text is the key; `i18n/<lang>.json` plus the `v9_`…`v13_` files are merged at build time |
| `data/moedas.json` | Reference exchange rates used for display |
| `assets/` | Logos, Figure 1 of Krueger and Jackson (2026) and the font licence |
| `vendor/` | jsPDF and jsPDF-AutoTable (MIT licences included) |
| `tools/subset_fonts.py` | Subsets Noto fonts for the PDF in Arabic, Chinese and Bambara |
| `tests/`, `test_idiomas.py` | Node and Playwright tests (`tests/test_v0014.py` covers the 0.0.14 fix) |
| `plano/` | Requirements and design notes for each version (in Portuguese) |
| `navegador.html` | Build output (page body, as published) |
| `VERSION`, `CHANGELOG.md` | Current version and release notes |
| `docs/index.html` | Standalone page, identical to the published version |

## Build

```bash
bash build.sh            # writes navegador.html
SEM_FONTES=1 bash build.sh   # build without embedded PDF fonts
```

Requirements: bash, Python 3 with `fonttools`, Node.js for the engine tests, and the Noto fonts installed under `/usr/share/fonts` (Noto Sans, Noto Sans Arabic, Noto Sans CJK) for the PDF font subsets. After a build, copy the page into `docs/index.html` wrapped in a minimal document (`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>` … `</body></html>`).

## Tests

```bash
node tests/test_custos_v2.js && node tests/test_v9_motor.js && node tests/test_v10_formula.js
python3 tests/test_v9_numeros.py
python3 tests/test_v9_fluxo.py && python3 tests/test_v13_fluxo.py && python3 tests/test_v13_inicio.py
python3 tests/test_v9_plano.py && python3 tests/test_v10_recs.py && python3 tests/test_v12_pdf.py && python3 tests/test_v13_plano.py
python3 tests/test_v13_idiomas.py && python3 test_idiomas.py
```

## Credits and licences

- Layered total cost of ownership framework and Figure 1: Krueger, K. and Jackson, F. for CoSN (2026). *Beyond the price tag: Rethinking total cost of ownership for AI in education systems*. Paris: UNESCO. https://unesdoc.unesco.org/ark:/48223/pf0000399348. Figure reproduced without changes under CC BY-SA 3.0 IGO.
- The distribution of the seven layers across the four phases, the priorities catalogue and the cost conventions are elaborations of this tool.
- Project linked to the Cátedra UNESCO UNITWIN de Inteligência Artificial Desplugada na Educação and to IA.EDU.
- Fonts: Noto (SIL Open Font License, `assets/fontes/OFL.txt`). jsPDF and jsPDF-AutoTable: MIT (`vendor/`).
- No licence has been chosen yet for the code of this repository.
