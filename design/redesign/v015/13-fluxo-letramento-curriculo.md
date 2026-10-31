# v015 — Fluxo de letramento em IA e currículo

Implementação da proposta aprovada pelo usuário em 31/10/2026. Complementa a entrega 12, que havia alterado apenas as seis opções. Publicação exclusiva em docs/revisao/v015.

## Percurso

Contexto → Diagnóstico e desenho formativo → Implementação e recursos → Acompanhamento e revisão.

País e prioridades vêm antes dos desafios. Públicos e alcance vêm depois dos desafios. São dez telas básicas; selecionar currículo acrescenta uma tela. Validação pedagógica, recursos digitais e identificação de projeto de IA acrescentam telas somente quando escolhidos. Currículo não obriga piloto tecnológico.

Os públicos têm objetivos, avaliação, alcance e duração próprios. Equipes de políticas públicas não informam escolas ou séries. Estudantes recebem etapas e escolas atendidas; o total elegível de estudantes é informado uma vez. Ensino superior inclui graduação, pós-graduação e egressos, com números por subgrupo. O total de pessoas distintas é explícito, nunca a soma automática de grupos que podem se sobrepor. Participantes previstos não podem superar o público elegível; os totais distintos ficam entre o maior grupo e a soma dos grupos conhecidos.

Currículo registra situação, etapas abrangidas, competências e progressão, integração curricular, participação, instância competente de aprovação e apoio à implementação. As ações distinguem elaboração, consulta, aprovação e publicação/apoio. Formação registra também materiais, formadores, modalidades, apoio, salvaguardas e demonstração de competências. Acompanhamento distingue participação, conclusão e aprendizagem demonstrada.

## Entradas e pendências

Diagnóstico, objetivos, desenho, ações, prazos, responsáveis, evidências e revisão usam presets de IDs estáveis. “Adicionar mais informações +” mantém notas opcionais recolhidas. Números exatos e valores são digitados quando pertinentes. Informação a levantar pode ser registrada, mas permanece pendente no plano. Tipos de evidência selecionados não são apresentados como documentos verificados. Escolhas não preenchem automaticamente resultados reais do país.

## Orçamento e frentes

Categorias próprias: diagnóstico/avaliação, desenho pedagógico/curricular, materiais/tradução/acessibilidade, equipe/coordenação, apoio, formação de formadores e realização da formação/tempo das equipes. Currículo, recursos digitais e validação pedagógica acrescentam categorias condicionais. Recursos adicionais têm identificadores independentes; excluir um não reaproveita os valores em outro.

Valores desconhecidos não são zero. O subtotal inclui apenas valores informados; zero precisa ser declarado. A moeda permanece associada aos valores se o país mudar. Quantidades nacionais e participantes não viram licenças nem custos presumidos.

Governança + letramento oferece duas frentes com o contexto nacional compartilhado. A seleção das duas não exige um projeto de ferramenta. As ações de governança não incluem os desafios de letramento. Uma despesa de formação já custeada na governança referencia o item de origem, sem ser somada novamente; a origem e seu valor aparecem no plano. Referências a valores desconhecidos continuam pendentes.

Um projeto de uso de IA exige decisão explícita e identificação; tem frente própria de ferramenta, excluindo os desafios de governança e letramento. Selecionar letramento não abre o motor de contratação. Os demais percursos permanecem disponíveis conforme as prioridades e a identificação explícita do projeto.

## Relatórios e compatibilidade

Painel, página do plano e os dois PDFs usam planoLetramento. O resumo é uma seleção compacta dos mesmos dados; o plano completo inclui todos os blocos ativos. Não há autorização de PoC, licenças ou orçamento de ferramenta no plano formativo. Pendências de definição e de valores aparecem também nos PDFs.

IDs A1–A10, A11–A16, respostas antigas, notas, orçamento, posição e JSON são preservados. Campos inativos ficam guardados sem entrar na projeção atual. Links antigos e retomada são redirecionados a telas equivalentes. A versão 0.1.0-alpha.8, as chaves de armazenamento e o formato 14 não mudam. Seleções malformadas de importações ficam pendentes; caminhos perigosos não podem ser escritos.

Textos novos completos em português e inglês. Nos outros idiomas, traduções preexistentes são preservadas; entradas novas ainda sem tradução usam inglês explícito, com aviso no percurso. Não se declara revisão nativa desses textos.

## Validação

Suíte completa: 870 testes aprovados em 41 arquivos, 2 ignorados e 1 todo preexistentes. Verificação final dirigida: 55 testes em cinco arquivos, incluindo 20 testes do novo fluxo, catálogo, regressões de governança e idiomas. Build com tipos, lint de domínio e diff verificados.

Casos cobrem os seis objetivos isolados e combinados, currículo sem piloto, validação e digital condicionais, públicos e subgrupos, quantidades inválidas, pendências, JSON, mudança de público/idioma, preservação da posição, orçamento desconhecido/zero/informado, moeda, custos compartilhados, recursos adicionais e exportação dos dois PDFs.

Interface isolada: diagnóstico preenchido por seleção sem texto obrigatório; nota preservada após trocar situação e idioma; equipes públicas sem séries/escolas; orçamento com R$ 1.234,56 na pergunta e no painel, seis itens desconhecidos; troca entre governança e letramento com respostas preservadas. PDFs de caso sintético de formuladores de políticas e currículo: resumo de três páginas e plano de quatro páginas, texto/valores conferidos e todas as páginas renderizadas para revisão visual.
