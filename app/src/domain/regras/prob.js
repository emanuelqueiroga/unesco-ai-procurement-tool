// Pacote PROB: problema, meta e alternativa (lente "Decisão e evidência"). Formato: regras/index.js (typedef Regra).
// R2: regras atuais migradas com o novo id (seções 6.1 a 6.3); R4 (4a): R-02, R-04 e R-05.
// A tecnologia aparece na descrição do problema quando o alerta de framework.js:alertas() diz que "a descrição menciona
// tecnologia" (a mesma leitura do perfil de risco); 1.2.4 vazio só conta quando o caso já começou (tarefa ou teste
// respondidos), para que o caso em branco continue sem recomendações.
const MENCIONA_TECNOLOGIA = k => (k.alertas || []).some(a => /menciona tecnologia/.test(String(a.texto || '')));
const PROBLEMA_VAZIO = k => !String(k.c.problema || '').trim() && (k.tarefas.length > 0 || !!k.teste);
const IMPACTOS_CADEIA = ['tempo_docente', 'aprendizagem', 'permanencia'];

const metaSemNumero = k => { const t = String(k.v('resultado') || '').trim(); return !!t && !/\d/.test(t); };

/** @type {import('./index.js').Regra[]} */
export const REGRAS_PROB = [
  {
    id: 'R-01', versao: 1, pacote: 'PROB', tipo: 'politica', substitui: ['metas-lacunas'], campos: ['resultado'],
    // gatilho do catálogo: meta com lacunas (__) OU meta escrita sem nenhum número
    se: k => !!k.metasLacuna || metaSemNumero(k),
    origem: k => ({ campo: 'resultado', vals: [k.metasLacuna ? 'Com lacunas a completar' : 'Sem número'] }),
    variantes: [{
      quando: k => !k.metasLacuna,
      oque: 'Escrever a meta com número, prazo e população, e o efeito mínimo que justifica o custo.',
      porque: 'Sem número não há critério de sucesso nem como calcular o tamanho do teste.',
      como: ['Escrever o valor atual, a meta e o prazo, para quem.', 'Registrar o efeito mínimo que justifica o custo, com o cálculo de "Vale o que custa?".'],
      curto: 'a meta com número',
    }, {
      oque: 'Completar as metas com os números da rede (valores atuais, metas e prazos) antes do teste.',
      porque: 'Sem os números não há critério de sucesso nem como dizer, depois do teste, se a IA ajudou.',
      como: ['Preencher, para cada meta, o valor atual, a meta e o prazo.', 'Indicar a fonte de cada número: sistema, avaliação ou registro da rede.'],
    }],
    paraque: 'O teste começa com um critério de sucesso que todos conhecem.',
    quem: ['pedagogica', 'avaliacao'], marco: 'M1', pd: 1,
    // Condição só com lacunas (__) na meta; meta escrita sem número fica Recomendada (alta), para não travar o veredito
    // dos casos que já descreveram o resultado (calibração do orquestrador; os quatro exemplos não têm número na meta)
    condicao: k => !!k.metasLacuna && k.temPiloto && k.impactoEducacional, alta: () => true,
    pronto: 'Cada meta tem valor atual, meta, prazo e fonte registrados no plano.',
  },
  {
    id: 'R-03', versao: 1, pacote: 'PROB', tipo: 'politica', substitui: ['alternativa'], campos: ['alternativa'],
    se: k => k.v('alternativa') === 'nao',
    variantes: [{
      oque: 'Comparar ao menos uma alternativa sem IA, em custo e resultado esperado, antes de decidir a compra.',
      porque: 'Se uma alternativa simples resolver o problema, o teste e a compra deixam de ser necessários; é o primeiro ponto que o controle examina.',
      como: ['Listar as alternativas, inclusive uma sem IA, com custo por pessoa e resultado esperado.', 'Registrar no processo o motivo da escolha.'],
    }],
    paraque: 'A decisão de testar a IA fica justificada diante de uma opção mais simples.',
    quem: ['pedagogica', 'orcamento'], marco: 'M1', pd: 2,
    condicao: () => true,
    pronto: 'A comparação e o motivo da escolha estão juntados ao processo.',
  },
  {
    id: 'R-06', versao: 1, pacote: 'PROB', tipo: 'politica', substitui: ['sem-ferramenta'], campos: ['problemas'],
    se: k => !!(k.sp && k.sp.semFerramenta),
    origem: k => ({ campo: 'problemas', vals: k.probs.map(q => q.t) }),
    variantes: [{
      oque: 'Resolver com regras e processos os problemas marcados que não dependem de uma tarefa feita pela IA, antes de comprar.',
      porque: 'Esses problemas não dependem de IA; comprar uma ferramenta para eles gasta recursos sem mudar o resultado.',
      como: ['Separar, na lista de problemas, os que pedem só regra, processo ou formação.', 'Definir para cada um a ação sem IA e o responsável.'],
    }],
    paraque: 'A compra fica restrita ao que de fato depende de IA.',
    quem: ['pedagogica'], marco: 'M1', pd: 2,
    alta: () => true,
    pronto: 'Os problemas sem tarefa de IA têm ação e responsável definidos fora da compra.',
  },
  {
    id: 'R-02', versao: 1, pacote: 'PROB', tipo: 'politica', substitui: [], campos: ['impactos', 'tarefas'],
    se: k => k.tarefas.length > 0 && k.impactos.some(z => IMPACTOS_CADEIA.includes(z)),
    origem: k => ({ campo: 'impactos', vals: k.impactos }),
    variantes: [{
      oque: 'Escrever a cadeia do caso, do problema ao resultado, com um indicador para cada elo.',
      porque: 'Sem a cadeia, o teste mede só o uso e não mostra se o uso produz o resultado prometido.',
      como: ['Escrever os quatro elos: o problema, o que a ferramenta faz, o que muda na prática de quem usa e o resultado.', 'Definir um indicador e uma meta para cada elo, a começar pelos intermediários.', 'Juntar a cadeia ao plano do teste.'],
    }],
    paraque: 'O teste mostra em que elo a cadeia se rompe, e não só se a ferramenta foi usada.',
    quem: ['pedagogica', 'avaliacao'], marco: 'M1', pd: 1,
    pronto: 'A cadeia de quatro elos, com indicador e meta por elo, está juntada ao plano do teste.',
  },
  {
    id: 'R-04', versao: 1, pacote: 'PROB', tipo: 'politica', substitui: [], campos: ['situacao'],
    se: k => k.situacao === 'proposta',
    variantes: [{
      oque: 'Tratar a proposta recebida como uma entre várias, fechando antes o problema e a meta e especificando por desempenho.',
      porque: 'Uma proposta que vira especificação dirige a compra e reduz a competição entre fornecedores.',
      como: ['Fechar o problema e a meta antes de abrir a proposta.', 'Fazer uma consulta ao mercado para conhecer outras soluções para o mesmo problema.', 'Escrever os requisitos por desempenho, sem copiar a descrição do produto proposto.', 'Registrar por que a proposta atende à meta.'],
    }],
    paraque: 'A compra parte do problema da rede, e não do que o produto oferecido faz.',
    quem: ['compras', 'juridico'], marco: 'M1', pd: 2, curto: 'a proposta recebida tratada como uma entre várias',
    condicao: () => true, irreversivel: true,
    exemplosNorma: { BR: ['Lei 14.133/2021, art. 21 (consulta e audiência públicas antes do edital)'], UE: ['Diretiva 2014/24/UE, art. 42 (especificações técnicas por desempenho)'] },
    pronto: 'O problema e a meta estão fechados, a consulta ao mercado foi feita e os requisitos estão escritos por desempenho.',
  },
  {
    id: 'R-05', versao: 1, pacote: 'PROB', tipo: 'politica', substitui: [], campos: ['problema'],
    se: k => MENCIONA_TECNOLOGIA(k) || PROBLEMA_VAZIO(k),
    origem: k => ({ campo: 'problema', vals: k.c.problema ? [String(k.c.problema).trim().slice(0, 140)] : [] }),
    variantes: [
      { quando: k => PROBLEMA_VAZIO(k),
        oque: 'Descrever o problema da rede, sem citar a tecnologia, antes de seguir adiante.',
        porque: 'Sem a descrição do problema, nada permite dizer depois se a ferramenta ajudou.',
        como: ['Descrever a situação atual, quem é afetado e o que se sabe sobre as causas.', 'Conferir se o texto continua explicando o problema quando se tira a palavra IA.'] },
      { oque: 'Reescrever o problema sem citar a tecnologia, de modo que a descrição se sustente sem a palavra IA.',
        porque: 'Se, sem a palavra IA, a proposta deixa de explicar o problema, a definição parte da solução e não da necessidade da rede.',
        como: ['Retirar da descrição os nomes de ferramentas e de tecnologias.', 'Descrever a situação atual, quem é afetado e o que se sabe sobre as causas.', 'Conferir se o texto ainda explica o problema.'] },
    ],
    paraque: 'A decisão parte de um problema da rede e pode ser comparada com outras soluções.',
    quem: ['pedagogica'], marco: 'M1', pd: 1, curto: 'a descrição do problema sem citar a tecnologia',
    condicao: () => true,
    pronto: 'A descrição do problema está escrita sem citar a tecnologia e continua clara sem a palavra IA.',
  },
];
