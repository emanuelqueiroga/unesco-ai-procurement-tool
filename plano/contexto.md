# Contexto para os agentes

## O que é a ferramenta
"AI in Education Procurement Tool" (nome próprio, sempre em inglês). Página HTML única publicada como Artifact no claude.ai.
Fontes em /home/claude/app/src; build com `bash /home/claude/app/build.sh` → /home/claude/app/navegador.html.
- src/fluxo_dados.js: FASES, CAMADAS (7 camadas do TCO), CAMADAS_FASE, NIVEIS_ADM, ETAPAS_ENS (etapas e anos), DOMINIOS (qualificação/socialização/subjetivação), QUESTOES (perguntas Sim/Em parte/Não/Não se aplica por fase e camada), PASSOS (passos por fase), ACOES (ação recomendada por pergunta), ESSENCIAIS, REFS, CTX_EX/RESP_EX (exemplos).
- src/fluxo.js: lógica das fases, passos, vereditos por fase, cartão de resultado, mandala, painel, eventos, relatório (secoesFluxo).
- src/resumo.js: página "Resumo e recomendações", modelo de contratação (arranjos do cap. 14 do guia, Instrumento F), geração de PDF (jsPDF).
- src/framework.js: OPC (opções do caso: classes de uso da IA, autonomia, usuários, afetados, consequências, dados, frequência, reversibilidade, verificabilidade, contestação, cumulativo, arquitetura...), DIMENSOES e perfil de risco, PDS (pontos de decisão do guia), CONTRATO, DADOS_REQ, PACOTE, LOCKIN, alertas().
- src/casos.js: CASO_VAZIO e exemplos A–D.
- src/custos.js: motor de custos v2 (árvore K1–K6, conta econômica e orçamentária, cenários); cfgDoCaso() monta premissas a partir do caso (arquitetura, elegíveis, perfil). Testes: node tests/test_custos_v2.js (125 verificações).
- src/custos_ui.js: calculadora completa.
- src/app.js: estado S, radios/chips, eventos, relatório md/html.
- src/i18n.js + i18n/{en,es,fr}.json + extra_*.json: o texto em português é a chave; EN é o idioma inicial.
- Estrutura atual das fases (v8):
  1 Contexto: 1.1 Onde e para quem (nível administrativo, lugar, situação, etapas com escolas/estudantes e opção por ano), 1.2 Que problema (domínio qualificação/socialização/subjetivação, componentes, problema, resultado, linha de base, alternativa sem IA), 1.3 Governança de IA na educação (9 perguntas g-*, camada 1) + funções não terceirizáveis.
  2 Piloto: 2.1 O que a solução faz (classes, autonomia, arquitetura, piloto gratuito, tamanho do piloto), 2.2 Pessoas, dados e consequências (usuários, afetados, consequências, dados, treino, vulneráveis, idiomas, frequência, reversibilidade, verificabilidade, contestação, cumulativo, elegíveis), 2.3 Perfil de risco, 2.4 Regras do piloto (r-*), 2.5 Capacidade mínima nos locais do piloto (p-*, camadas 2,3,5,6,7), 2.6 Custo do piloto.
  3 Implantação: 3.1 camadas (i-*), 3.2 listas de verificação, 3.3 custo total.
  4 Sustentabilidade e expansão: 4.1 camadas (s-*), 4.2 sustentabilidade financeira, 4.3 decisão de continuidade.
  Cada fase termina com um cartão de resultado (veredito Sim/Com condições/Ainda não/Faltam respostas e lista de ações). Fases 3 e 4 podem ser puladas. Há página final "Resumo e recomendações" com PDF.

## Restrições permanentes do usuário
- Não inventar referências. Citar só o que existe (o guia do projeto e o documento da UNESCO de Krueger & Jackson, 2026).
- A ferramenta e o guia NÃO falam em nome da UNESCO, OCDE, NIST, UNICEF ou outra instituição.
- Valores são ilustrativos.
- Não reduzir fonte para caber conteúdo.
- Nomes de seção sem gerúndio.
- Quatro idiomas (PT fonte, EN, ES, FR); textos em inglês por padrão na interface.
- Fundo branco, paleta IA.EDU sóbria, uma cor por fase (azul claro → escuro).
- Projeto vinculado à Cátedra UNESCO UNITWIN de Inteligência Artificial Desplugada na Educação e ao IA.EDU.

## Documento-base de TCO (pedido do usuário)
Krueger, K. and Jackson, F. for CoSN. 2026. Beyond the price tag: Rethinking total cost of ownership for AI in education systems. Paris, UNESCO. (unesdoc ark:/48223/pf0000399348)
PDF local: /root/.claude/uploads/34a0ebcf-e8c6-5650-85a4-28f1448afc68/bab76b44-399348eng_1.pdf  (usar pdftotext; não buscar na web)
Guia do projeto (LaTeX): /home/claude/guia/new/cap/*.tex (parte5.tex tem caps. 13–16 sobre requisitos, estratégia de aquisição, propostas e contratos; cap11_tco.tex e cap12_orcamento.tex sobre custos).
