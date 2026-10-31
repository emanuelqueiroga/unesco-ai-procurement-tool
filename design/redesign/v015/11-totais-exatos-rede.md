# v015 — Totais exatos da rede

Na pergunta “Quais desafios você quer enfrentar?”, a seção “Tamanho total da rede” passa a mostrar diretamente dois campos numéricos: Total de escolas e Total de estudantes.

- A pessoa informa os números exatos; as faixas de tamanho saem da interface.
- Os dois totais devem ser inteiros positivos para avançar. A apresentação usa os separadores do idioma escolhido.
- As faixas já salvas são preservadas nos dados antigos, mas não substituem os totais obrigatórios.
- Painel, plano e PDFs compartilham os totais informados, sem estimá-los a partir das faixas nem transformá-los em custos.
- As demais perguntas mantêm os presets e a opção “Adicionar mais informações +”.

Validação: 41 testes em três arquivos passaram; build com verificação de tipos, verificação do domínio e diff sem erros. Na interface de teste, os campos vazios bloquearam Próximo; 12345 escolas e 1600000 estudantes foram exibidos como 12.345 e 1.600.000 e liberaram o avanço. Publicação restrita a docs/revisao/v015.
