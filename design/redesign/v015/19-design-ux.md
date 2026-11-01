# v015 — Implementação da revisão de design e UX

Pedido: implementar a avaliação de interface aprovada, preservando os percursos, as perguntas e os dados da v015.

## Comportamento entregue

- Identificação compacta da frente atual e link Trocar. A frente ativa deixa de ser um botão que desloca a pessoa para outra pergunta.
- Faixa de revisão recolhível, com o aviso completo e acesso à página estável.
- Barra fixa com Voltar, Próximo e, quando aplicável, Resumo. O painel lateral continua disponível em telas amplas; uma única gaveta atende ao resumo nas telas menores.
- Etapa atual com nome visível também no celular. Contador de tela dentro da etapa, sem misturar o total geral de perguntas.
- Progresso por frente calculado pela mesma função no panorama, na retomada da abertura e nos painéis. País e prioridades são contexto compartilhado, separado das telas específicas da frente.
- Panorama em `#/plano-nacional`: contexto compartilhado, estado de cada frente, preenchimento, subtotal informado, moeda, itens sem valor e links para continuar ou abrir o resumo específico.
- Resumos com URL própria `#/frente/{id}/resumo`, compatíveis com recarregamento e retorno pelo navegador. A URL antiga `#/plano` continua abrindo a frente ativa. A entrada de continuação substitui a rota transitória, para não prender o botão Voltar.
- Blocos nativos recolhíveis, com estado de preenchimento e agrupamento exclusivo entre irmãos. As escolhas ficam guardadas quando um bloco fecha; o primeiro erro abre e foca o bloco correspondente.
- Mesma largura de 760 px e alinhamento nos formulários e resultados de governança, letramento e educação. Detalhes opcionais continuam disponíveis por campo, com peso visual menor.
- Contraste dos links de detalhes corrigido com o token de texto secundário do tema.
- Gaveta com semântica de diálogo, fundo inerte, rolagem isolada, Escape e retorno de foco. O foco não reinicia por mudanças da função de fechamento a cada renderização.
- Erros vinculados aos grupos e controles nativos. Textos principais de gestão, importação e exportação usam plano. Formato JSON e nomes internos permanecem os mesmos; a identidade oficial do produto e os logos são mantidos.

## Regras preservadas

Prioridades e escolha de frente continuam locais até Próximo, com orientação explícita. A seleção não muda o layout enquanto é editada. As quatro prioridades continuam formando até três frentes; um projeto de uso de IA só aparece quando identificado explicitamente.

Os presets, totais exatos de escolas e estudantes, metas numéricas, detalhes opcionais e respostas inativas são preservados. O panorama mostra valores por frente e não cria um total que some moedas, períodos ou referências compartilhadas indevidamente. Não foi criado um PDF consolidado; cada resumo conserva seus arquivos próprios e identifica o respectivo escopo.

## Validação

- 21 novas verificações automatizadas: todas as 15 combinações de prioridades, projeção sem mutação, progresso isolado, preservação de moeda e valores, rotas de resumo e continuação, frente ativa sem navegação involuntária, contadores e associação de erros.
- Suite completa: 47 arquivos, 976 testes aprovados; 2 ignorados e 1 pendente já existentes.
- TypeScript, build e verificação de domínio aprovados.
- Navegador: abertura e país, seleção estável antes de confirmar, governança com totais exatos de 12.345 escolas e 1.600.000 estudantes, diagnóstico completo por presets, troca e retomada de frentes, resumos por URL, recarregamento e histórico.
- Caso sintético com três frentes: meta 80,5 e recurso USD 1.234,56 preservados ao trocar português/inglês; panorama mostra o subtotal da frente correta.
- Celular 390 × 844: largura útil e de rolagem de 375 px, barra de ações com 72 px, identificação da frente com 45 px; título de diagnóstico em y=334 px. Erro abre o grupo correto e o controle focado fica acima da barra.
- Tela ampla 1600 × 1000: conteúdo e identificação da frente com 760 px e mesmo eixo x; panorama sem rolagem horizontal. Overrides temporários restaurados e sessão móvel encerrada.
- Contraste de texto adicional no escuro: rgb(147,163,171) sobre rgb(22,35,42), aproximadamente 6,17:1.
- Português/inglês completos para os textos novos. Traduções existentes dos outros seis idiomas preservadas; novas chaves usam inglês explícito até revisão nativa.

A validação de teclado e semântica no navegador não é uma certificação completa com leitores de tela ou dispositivos físicos. Publicar somente o build de docs/revisao/v015 e conservar os assets anteriores para abas já abertas. A v014 e docs/index.html permanecem intactos.
