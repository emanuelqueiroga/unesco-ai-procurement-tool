# app/ — reimplementação (0.1.x)

Nova implementação da AI in Education Procurement Tool em React 18, TypeScript e Vite, com o design system Prumo. Convive com a página legada (`../src/`, `../build.sh`, `../docs/index.html`, linha `0.0.x`) até a `0.1.0` a substituir. Especificação: `../design/redesign/02-especificacao-reimplementacao.md`.

## Comandos

```bash
npm install
npm run dev          # servidor de desenvolvimento (gera tokens e dicionários antes)
npm test             # Vitest: domínio, motor, fórmulas, store, migrações, Essencial
npm run lint:domain  # src/domain/ não pode tocar DOM, localStorage nem a global S
npm run build        # tsc --noEmit + vite build → ../docs/app/
```

## Pastas

| Pasta | O que é |
|---|---|
| `src/domain/` | Motor de custos, framework, regras de recomendação, catálogos, fórmulas, matriz e i18n da v13 como módulos ES puros; as funções recebem o `estado` do caso como parâmetro |
| `src/store/` | Estado do caso (Zustand) no formato 14: `caso.ts` (ações), `sugestoes.ts` (sugestões em cascata, puras), `migracoes.ts` (formatos 9, 11, 13, 14 e app anterior), `perguntas.ts` (as 25 do Essencial e resposta → trechos do plano), `selectors.ts` (KPIs, recomendações, progresso), `persistencia.ts` (chave `aiedu-procurement-v14`) |
| `src/export/` | Exportação do caso em JSON (formato 14) |
| `src/ui/` | Componentes Prumo (um por pasta, `.tsx` + `.css`), tema claro/escuro, ícones |
| `src/screens/` | Telas (por enquanto, a galeria de componentes em `#/galeria`) |
| `src/styles/` | `tokens.css` gerado de `../design/redesign/prumo/tokens.json` (versionado) e `base.css` |
| `src/i18n/` | `index.ts` (carga sob demanda) e os `<idioma>.json` gerados por `scripts/i18n.mjs` (não versionados) |
| `scripts/` | `tokens.mjs`, `i18n.mjs`, `check-domain.mjs` |
| `tests/unit/` | Testes do Vitest |

## Formato de dados 14

O formato 13 mais `origem` (de onde vem cada valor: `padrao`, `sugerido`, `informado`, `refinado`), `sugestoes` (que resposta gerou cada sugestão), `modo` (`essencial` ou `refinar`) e `capitulo`. `respC` continua sendo gravado (informado ou refinado = confirmado), para que a v13 leia o arquivo nas chaves que conhece. A importação aceita os formatos 9, 11, 13 e 14 e os casos do app anterior, e deriva `origem` dos estados antigos.

Valores ilustrativos. A ferramenta não fala em nome da UNESCO ou de outra instituição.
