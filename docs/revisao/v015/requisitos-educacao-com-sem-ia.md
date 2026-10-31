# v015 — Educação com e sem IA: opções e contexto

## Escopo autorizado e implementado

Esta entrega implementa as alterações expressamente pedidas pelo usuário. A reestruturação das etapas seguintes permanece em proposta para aprovação, como nas revisões anteriores.

- A prioridade passa a se chamar **Education with and without AI** / **Educação com e sem IA**.
- Mantém a navegação por país, prioridades, níveis de ensino/escolas/estudantes, desafios, impacto e governança.
- Onze temas novos, nesta ordem: Foundational literacy and numeracy; STEM education; Learning recovery and remediation; Youth and adult education (second-chance learning); Students with disabilities; Multilingual education; Future of work; Technical and vocational education and training (TVET); Social and emotional well-being; Global citizenship; Soft skills.
- Todos podem ser selecionados juntos, sem limite. Informações adicionais ficam em “Adicionar mais informações +”.
- Retira as telas de Situação atual, Linha de base e Alternativa sem IA desse percurso, inclusive seus detalhes no Refinar. Links antigos e a retomada nessas telas levam ao impacto esperado.
- Impactos derivados dos temas selecionados, sem nova seleção manual. A meta/resultado esperado continua editável, conforme esclarecimento do usuário. A edição da meta sobrevive à troca de desafios.
- Não associa automaticamente tarefas de ferramentas de IA aos novos temas educacionais.

O termo de interface para EJA combina o uso de “youth and adult education” na descrição do programa brasileiro pelo UNESCO UIL com “second-chance” para explicitar a retomada dos estudos. É uma escolha editorial para a interface, não uma equivalência oficial universal.

Referências: https://www.uil.unesco.org/en/litbase/literate-brazil-programme-brazil e https://www.unesco.org/en/legal-affairs/recommendation-adult-learning-and-education.

## Compatibilidade e idiomas

IDs C11–C21 novos; C1–C10 conservam seus significados. Escolhas antigas salvas aparecem separadamente. Impactos informados antes da derivação automática ficam preservados no contexto exportável. Respostas antigas de linha de base, situação e alternativa permanecem nos dados; deixar de exibi-las não as apaga.

Novas entradas completas em PT/EN; outros seis dicionários têm fallback inglês explícito onde falta tradução, preservando traduções existentes. Não se declara revisão nativa dessas traduções. Mantidos formato 14, armazenamento local e versão alpha.8.

## Validação

42 arquivos de testes aprovados: 887 testes passaram, 2 ignorados e 1 pendente. Inclui 17 testes novos para o percurso educacional. Build com verificação de tipos, lint de domínio (42 arquivos) e diff sem erros.

Na interface isolada: onze temas selecionáveis simultaneamente; navegação por níveis/escolas/estudantes mantida; 20 perguntas ativas, seis no contexto; impactos atualizados ao desmarcar temas; meta personalizada preservada; link antigo de linha de base redirecionado ao impacto. Governança, letramento e quarta prioridade mantêm seus percursos.

## Avaliação do fluxo restante — proposta pendente

O contexto está ajustado, mas as etapas seguintes ainda pressupõem contratação de tecnologia. São 20 telas atuais: seis no contexto, onze na etapa de prova de conceito/piloto, uma em implantação e duas em expansão. O painel e os relatórios ainda usam esse modelo de contratação. Foi observado no painel um veredito de autorização de prova de conceito com apenas desafios e meta preenchidos; ele não demonstra que uma intervenção educacional esteja pronta.

Proposta para aprovação: Contexto → Intervenção e avaliação → Execução e recursos → Acompanhamento e expansão. Escolher explicitamente intervenção sem IA, com IA, mista ou ainda a definir. Oferecer estratégias pedagógicas predefinidas por tema, adaptar participantes/beneficiários, apresentar tecnologia/licenças/PoC somente quando pertinentes, integrar evidências ao acompanhamento sem recriar uma tela separada de linha de base, e adaptar orçamento, recomendações, painel e PDFs ao mesmo modelo educacional. Uma mesma pessoa ou despesa compartilhada entre frentes não deve ser somada novamente.

Essas mudanças do restante do fluxo, do cálculo de custos e dos relatórios **não integram esta implementação** e aguardam aprovação do usuário.
