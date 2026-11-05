# Versão de teste v016: requisitos (revisão de 03–04/11/2026)

Base: ramo `teste/layout-v015` (27a44ae, fluxos enxutos pré-preenchidos). Novo ramo `teste/v016`, publicado em
`docs/teste/v016/`, chave de armazenamento própria (`VITE_TESTE=v016`). A v015 e a layout-v015 não mudam.

## Decisões do Emanuel (04/11)
- Nova versão de teste, separada da layout-v015.
- "Educação com e sem IA": adotar 8 desafios × 4 dimensões.
- Fases: a pessoa marca as fases e a duração de cada uma; o orçamento mostra custo por fase e o total.
- Orçamento: uma linha por categoria; as cost options são itens a marcar dentro da linha.

## Requisitos
R1 Prioridades — três cartões quadrados com ícone, títulos no gerúndio: "Governando a IA na educação",
   "Educando sobre a IA", "Educando com e sem IA" (EN: Governing AI in education, Educating about AI, Educating with and
   without AI). "Educar para a era da IA" sai da escolha; casos salvos com ela guardam os dados, fora do fluxo.
R2 Desafios — sem o bloco "Tamanho total do sistema" (escolas/estudantes) na governança; ele deixa de ser exigido.
R3 Governança — 3 desafios: Direitos e inovação responsável; Soberania; Capacidade do setor público. 9 categorias
   (1.1 Regulação e salvaguardas de direitos humanos; 1.2 Sandboxes regulatórios; 1.3 Diretrizes e padrões; 2.1 Governança,
   proteção de dados e infraestrutura pública digital; 2.2 Infraestrutura digital e hospedagem; 2.3 Independência
   tecnológica; 3.1 Recursos humanos especializados; 3.2 Formação e desenvolvimento profissional; 3.3 Governança
   institucional e coordenação), com as cost options da tabela da revisão. Só as categorias dos desafios marcados entram.
R4 Letramento ("Educando sobre a IA") — 3 desafios: Letramento para professores; Letramento para estudantes; Currículo de
   IA. Saem formuladores/equipes, diretores e ensino superior como desafios separados. 11 categorias (1.1–1.5, 2.1–2.3,
   3.1–3.3) com as cost options da tabela.
R5 Pessoas do letramento — só o público e o número de pessoas (sem "exato" × "planejado", sem "informação a levantar").
   Estudantes: perguntar os níveis (incluindo ensino médio e superior). Professores: perguntar se a formação inclui
   diretores e coordenadores (lideranças escolares) e quantos. Perguntar a forma de entrega (presencial, híbrida, online)
   e a duração (horas por curso e cursos por pessoa).
R6 Educação ("Educando com e sem IA") — 8 desafios: Educação infantil; Alfabetização e numeracia; STEAM; Educação inclusiva
   e especial; Educação multilíngue; Educação profissional e futuro do trabalho (TVET); Educação de jovens e adultos;
   Bem-estar e aprendizagem socioemocional. 4 dimensões: Escala e implementação (= fases), Infraestrutura (eletricidade,
   conectividade, banda, dispositivos), Formação docente (os educadores de cada desafio), Recursos (conteúdo de cada
   desafio, plataformas, ferramentas de IA). C11–C21 ficam guardados nos casos antigos.
R7 Fases — Piloto, Implantação, Expansão substituem o "período do orçamento" nas três frentes. Para cada fase: incluída,
   meses e alcance acumulado (% das pessoas). Padrões da v14: piloto 4 meses e 5%; implantação 12 meses e 1/3; expansão
   12 meses e 100%. Estimativas por fase: formação = pessoas novas na fase × horas × custo/hora; equipe = pessoas em tempo
   integral × meses ÷ 12 × salário; licenças = usuários alcançados × preço/mês × meses. Valor informado: um campo por fase.
R8 Textos — sem frases explicativas nas telas de pergunta ("Os números alimentam…", "O número de usuários alimenta…").
R9 Diagrama de referência — figura no estilo da arquitetura enviada (blocos numerados com ícones): Prioridades →
   Dimensões/categorias → Fases → Custo (informado, estimado, a levantar), disponível na página inicial da versão de teste.

## Mantém
Layout da versão de teste (dois quadros, botões abaixo da pergunta, rodapé), pré-preenchimento, estimativas de referência
(grau C), sem rolagem horizontal a 360 px, árabe, tema escuro, testes verdes. Nada salvo é apagado.
