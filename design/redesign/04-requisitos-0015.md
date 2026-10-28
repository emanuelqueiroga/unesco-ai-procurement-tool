# Requisitos da 0.0.15-rc.1 para a 0.1.x (mapeamento, sem implementação)

28 de outubro de 2026. A 0.0.15-rc.1 (branch `v14-revisao`, publicada em `/revisao/`) é a evolução da 0.0.14 que nunca virou estável. O documento `03-requisitos-paridade.md` comparou a 0.1.0-alpha.4 só com a 0.0.14; este faz o mesmo para o que a 0.0.15 acrescentou. Os inventários completos, com arquivo e função de cada item, números de referência e capturas, estão em `paridade-0015/AJU.md` (ajuda e glossário), `MOT.md` (motor de custos), `REF.md` (base de referências e países) e `REL.md` (plano, relatório e icebergs). Nada foi implementado ainda.

## O que a 0.0.15 acrescentou (blocos do histórico)

| Bloco | O que é | Na 0.1.0-alpha.4 |
|---|---|---|
| BL2 (AJU) | Abertura das fases (o que decide, o que entrega, tempo), painel "Sobre esta etapa" com "Como responder", "Quem costuma saber" e exemplo, 23 dicas, glossário de 15 termos sublinhados nos textos, ⓘ das camadas no 3.1 | parcial: a frase de cada tela e "Por que perguntamos isso?" cobrem parte; não há glossário, "Quem costuma saber" nem ⓘ das camadas |
| BL3 e BL5.4 (MOT) | Custo por fase (prova de conceito ou piloto, implantação, expansão; pago uma vez × recorrente; pessoas por fase), curva de adoção (linear, em S, em ondas), reposição de dispositivos, rotatividade da formação, indicadores do custo total (nominal, custo anual equivalente, por estudante e por professor, parte recorrente, custo anual em regime) | não |
| BL4 e BL1 (REF) | Base de referências versionada (`data/referencias.json`, 70 linhas, todas grau C) e perfis de 5 países piloto (`data/paises.json`), seletor de país com moeda e câmbio, fonte, ano e grau de cada premissa, "seu valor · faixa de referência" e "fora da faixa" | não (só o seletor de moeda) |
| BL6, BL5.3 e revisão (REL) | Sumário executivo: faixa P10–P90 do custo total, a proposta em seis respostas, as cinco ações em cartões (O quê, Por quê, Para quê, Como, Quem, Quando), "O custo em resumo" com um iceberg por fase, direcionadores; parágrafo de abertura em cada seção; títulos que dizem o achado; simulação de incerteza; anexos de premissas e fontes e de glossário | não (os icebergs e o sumário executivo não existem) |
| Revisão final (dc35f48) | Versão no rodapé e no PDF, Início e Matriz no cabeçalho, chave própria do canal de revisão | sim (já veio com a paridade da 0.0.14) |

## Achados que valem para qualquer decisão

- **Nenhum número muda.** Os agentes compararam o motor da 0.0.14 e o da 0.0.15 em Node: 31 cenários, 4.250 valores, 0 diferenças (exemplos A–D com expansão e horizonte, presets). O patch do BL3 aplicado a uma cópia de `app/src/domain/` passa nos 303 testes da alpha.4 sem mudar nenhum. Os números só mudam quando a pessoa responde as perguntas novas, que são opcionais (curva em ondas no B: −3,6%; reposição de dispositivos no A com compra de dispositivos: +32%). Os icebergs do B somam exatamente os custos de cada fase (336.234, 416.803 e 1.017.095).
- **Ordem obrigatória:** motor (MOT) → base e países (REF, que mexe nos mesmos trechos de `custos.js`) → relatório (REL, que consome `av.fases`, `premissasDoCaso` e o glossário). A ajuda (AJU) é independente, exceto o glossário, que o relatório usa no anexo.
- **Base ainda ilustrativa.** As 70 linhas da base são todas grau C (convenção da ferramenta) e 7 dos 9 campos dos perfis de país estão vazios nos 5 países. Hoje escolher o país muda a moeda e os textos, não o custo em US$.
- **Traduções.** A 0.0.15 só traduziu os textos novos para inglês, espanhol e francês (cerca de 500 chaves somando as áreas). Árabe, chinês, bambara, zulu e suaíli ficariam em inglês nesses textos, a menos que se traduza.
- **Dois defeitos da alpha.4 encontrados no caminho** (corrigir independentemente): o mesmo US$ 12,77 aparece como "Por estudante por ano" na página e como "Por usuário ativo por ano" no PDF e em "Quanto custa" (é o custo dividido pelos usuários ativos); "Quanto custa" ainda mostra códigos internos ("A2.", "A3.", "K3.3").
- **Defeitos da 0.0.15 para não portar:** o "resumo de uma página" ocupa 3 páginas no B; o "Por quê" de algumas ações só repete a resposta ("A resposta X à pergunta 2.1.1"); o caso em branco mostra um custo total sem rótulo, contra a regra "Ainda sem números" da nova versão; "sem dado" sai sem tradução.

## Requisitos (70)

| Área | Total | P1 | P2 | P3 | Marcados `fora?` |
|---|---|---|---|---|---|
| AJU — ajuda e glossário | 17 | 1 (já atendido: AJU-15) | 10 | 6 | AJU-07 (painel que abre sozinho e lembra o estado) |
| MOT — motor de custos | 15 | 8 | 4 | 3 | MOT-04 em parte (grade de 7 indicadores no percurso), MOT-14 (fronteira de fases à mão) |
| REF — referências e países | 18 | 7 | 7 | 4 | — |
| REL — plano e relatório | 20 | 6 | 12 | 2 | REL-15 (custo do caso em branco; proposta: manter a regra da nova versão) |

P1 (o que a 0.0.15 tinha de central e a nova não tem): MOT-01 a MOT-08 (porte do motor, as quatro perguntas novas no Refinar do capítulo 4, custo por fase e indicadores no plano e no PDF, um só seletor de números, texto da fórmula, traduções, teste do motor); REF-01, 02, 05, 06, 07, 11, 17 (padrões vindos da base sem mudar centavo, fonte/ano/grau em cada premissa, lista de premissas, país opcional com moeda, importação de arquivos da 0.0.15, testes); REL-01 a REL-05 (faixa P10–P90, três indicadores, as seis respostas, as cinco ações em cartões, os icebergs).

## Pacotes propostos (para quando você liberar)

| Pacote | Requisitos | Tamanho | Agente sugerido |
|---|---|---|---|
| A — Motor | MOT-01, 05, 06, 08, 15 (porte do BL3/BL5.4; patches já prontos em `scratchpad/x_mot/`) | P | Sonnet (patch mecânico com teste de igualdade) |
| B — Perguntas e calculadora do motor | MOT-02, 09, 10, 11, 12, 13 | M | Sonnet |
| C — Base e países | REF-01 a REF-18 | G | Opus (mexe no motor, na origem dos números e nas migrações) |
| D — Relatório | REL-01 a REL-20, MOT-03, 04 | G | Opus para o sumário e os icebergs (página e PDF); Sonnet para seções e anexos |
| E — Ajuda e glossário | AJU-01 a AJU-17 | M | Sonnet (texto) e Sonnet para o componente do termo |
| F — Traduções | textos novos em ar, zh, bm, zu, sw (e revisão do que mudar de "passo/fase" para "capítulo/pergunta") | M | Sonnet |

A ordem seria A → (B, C, E em paralelo) → D → F.

## Decisões que dependem de você

As perguntas dos quatro relatórios, juntas e sem repetição, na ordem em que travam o trabalho:

1. **Onde o custo por fase, os indicadores, a simulação P10–P90 e os cenários aparecem.** Proposta: custo por fase e faixa P10–P90 em "Em resumo" e "Quanto custa" (página e PDF), também no Essencial; tornado e cenários completos só em "Quanto custa" e no Refinar. Alternativa: tudo isso só no Refinar, para não crescer o plano.
2. **Estrutura do plano.** Proposta: manter as 5 páginas e usar as cinco perguntas de decisão da 0.0.15 como abertura de cada página, com o sumário executivo (seis respostas, cinco ações, icebergs) dentro de "Em resumo". Alternativa: voltar à ordem própria da 0.0.15.
3. **Denominador do indicador principal:** custo por aprendiz com acesso (US$ 4,97 no B), por usuário ativo (US$ 12,77) ou os dois, com o nome dizendo qual.
4. **País.** Proposta: controle opcional na tela "Nome do lugar ou da rede" (as 25 perguntas continuam 25), moeda trocada só se ainda estiver em US$, "Dados do país" só no Refinar. E vale mostrar "Dados do país" agora, com quase tudo "sem dado", ou portar só a base, as fontes e a verificação e deixar os dados do país para quando houver números?
5. **Origem dos números.** Proposta: manter os quatro estados atuais (padrão, sugerido, informado, refinado) e levar fonte, ano e grau ao texto do "de onde vem?", com a contagem de premissas que ainda são convenção.
6. **Ajuda.** O painel em cinco partes ("Como responder", "Quem costuma saber", exemplo) entra dentro do "Por que perguntamos isso?", fechado por padrão, ou fica só a frase atual? E o glossário fica só como termos sublinhados e anexo do plano, ou ganha também uma página própria?
7. **Tempos dos capítulos:** manter os da nova versão (7, 8, 1 e 2 minutos, perto dos "uns 20 minutos" do Início) ou trazer as faixas da 0.0.15 (15–25, 20–30, 5–10 e 5–10)?
8. **Rotatividade da formação em branco** no exemplo B: manter o comportamento da 0.0.15 (em branco reproduz a 0.0.14; digitar 10 baixa o custo em 8,4%) ou alinhar "em branco" com 10?
9. **Traduções** dos textos novos em árabe, chinês, bambara, zulu e suaíli agora, ou aceitar o inglês nesses cinco até a 0.1.0 estável?
