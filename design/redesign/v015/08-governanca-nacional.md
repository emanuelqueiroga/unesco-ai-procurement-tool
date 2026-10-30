# v015 — Governança de IA para toda a rede

## Fluxo e dados

- Corrigir a prioridade e a tela para “Governança de IA na educação” / “AI governance in education”.
- Somente `governar`: País → Prioridades → Desafios. A tela de etapas não aparece na navegação, pendências ou contadores. São 22 telas ativas, 8 em Contexto.
- Com qualquer outra prioridade: manter País → Prioridades → Etapas → Desafios (23 telas).
- Em Desafios, no caso de governança isolada, pedir o total nacional de escolas e estudantes, sem separar por etapa. Exigir inteiros positivos para avançar.
- Guardar os totais em `ctx.redeNacional`, separados de `ctx.etapas`; alternar prioridades preserva os dois conjuntos.
- Usar os totais nacionais nas derivações, na síntese e nas estimativas do caso ativo; não presumir que uma etapa antiga representa o país.
- Retomada e links antigos de etapas levam a Desafios quando a governança está isolada.

## Desafios e redação

Título: “Which challenges do you want to address?”. Manter até três escolhas no Essencial e o modo Refinar para mais escolhas.

1. Develop AI regulations and guidance for education.
2. Integrate AI into the national education strategy.
3. Strengthen data sovereignty and protection.
4. Build public-sector capacity to govern AI.
5. Create a sandbox for educational experimentation.
6. Protect children’s safety, rights and well-being.
7. Ensure equitable and inclusive access to AI.
8. Establish transparency, accountability and ongoing evaluation.

As duas últimas opções ampliam a lista proposta pelo usuário. Referências consultadas para essa avaliação editorial:

- UNESCO: https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research
- UNICEF: https://www.unicef.org/innocenti/reports/policy-guidance-ai-children

O sandbox é descrito como teste supervisionado com salvaguardas e critérios de avaliação. As opções não presumem aquisição de uma ferramenta nem atribuem automaticamente tarefas de IA. As metas continuam abertas para o usuário definir.

## Compatibilidade e validação

- Novos desafios: G11–G18. Preservar G1–G10, com acesso por “Desafios de versões anteriores”, e todas as respostas antigas.
- Não apagar escolas por etapa, totais nacionais ou desafios de prioridades temporariamente desmarcadas. O limite de seleção conta os desafios das prioridades ativas.
- Manter as traduções existentes; novas traduções nos oito dicionários, com fallback inglês explícito em Bamanankan e aviso preliminar preservado.
- Manter alpha.8 e a chave de armazenamento de revisão.
- Validar avanço/retorno, escolha combinada, retomada, números inválidos, exportação/importação, impacto nas estimativas e traduções.
- Publicar exclusivamente em `/revisao/v015/`; preservar a v014 e a ferramenta estável.
