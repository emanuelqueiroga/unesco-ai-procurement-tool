// Pacote COMPRA: instrumento, teste, gratuidade, preço e julgamento (lente "Custo e contrato"). Formato: regras/index.js.
// R2: regras atuais migradas, com os textos jurídicos corrigidos (REC-07: sem "acordar por escrito o preço" no
// gratuito, sem cotação única, sem "renegociar o valor", g-compras do caso) e as de pagamento e licença suspensas
// enquanto a tecnologia for "não sei" (REC-04, `requer: ['tipoTec']`).
// R4 (4c, REC-28): R-55 a R-63 do catálogo (seção 6.1). R-55 escolhe o instrumento pela maturidade; R-56 contrata o teste
// sem criar direito de continuar; R-57 formaliza o gratuito; R-59 e R-60 tratam do julgamento (custo do ciclo de vida e
// demonstração); R-61 pede o preço de todos os anos; R-62 olha a compra conjunta. Decisão 5: o texto principal não cita
// norma; os exemplos (só Brasil e UE) ficam em `exemplosNorma`. Números só por varsRec(d, [chaves]) e numero().
import { numero, varsRec } from '../rec_numeros.js';
import { pct } from '../custos_ui.js';
import { tr } from '../i18n.js';
import { REGRAS_CONTRATO } from './contrato.js';
import { REGRAS_ORC } from './orc.js';
import { REGRAS_GOV } from './gov.js';

const FALTA_RESP = ['nao', 'parcial', 'nao_sei'];
/** horizonte do plano: o do motor (k.d.H) ou o respondido; 0 sem números nem resposta */
export const horizonteRec = k => (k.d && k.d.H) || +k.v('horizonte') || 0;

// "linha d'água" (relatório, relIcebergs): o preço da proposta fica acima; o resto do custo total, abaixo
const ACIMA = ['K1.2', 'K2.1', 'K2.2', 'K2.3', 'K2.5'];
const ABAIXO = ['K1.1', 'K1.3', 'K2.4', 'K3.1', 'K3.2', 'K3.3', 'K3.4', 'K4.1', 'K4.2', 'K4.3', 'K4.4', 'K5.1', 'K5.2', 'K5.3', 'K5.4', 'K5.5', 'K6.1', 'K6.2', 'K6.3'];
/** parte do custo total (conta econômica, valor presente) que fica abaixo da linha d'água; null sem números */
export function parcelaAbaixo(d) {
  if (!d || !d.av || !Array.isArray(d.av.linhas)) return null;
  let a = 0, b = 0;
  const soma = l => { if (ACIMA.includes(l.s)) a += +l.ecoVP || 0; else if (ABAIXO.includes(l.s)) b += +l.ecoVP || 0; };
  d.av.linhas.forEach(soma);
  (d.av.saida || []).forEach(soma);
  a = Math.max(0, a); b = Math.max(0, b);
  return a + b > 0 ? b / (a + b) : null;
}

/** @type {import('./index.js').Regra[]} */
export const REGRAS_COMPRA = [
  {
    id: 'R-55', versao: 2, pacote: 'COMPRA', tipo: 'custo', substitui: ['tecnologia'], campos: ['tipoTec', 'adaptacao', 'conheceFerramentas'],
    se: k => k.v('tipoTec') === 'nao_sei' || k.v('adaptacao') === 'sob_medida' || k.v('conheceFerramentas') === 'nao' || k.v('estrategiaCompra') === 'nao_sei',
    variantes: [
      { quando: k => k.v('tipoTec') === 'nao_sei', marco: 'M1', origem: () => ({ campo: 'tipoTec' }),
        oque: 'Fazer uma consulta ao mercado e uma prova de conceito para escolher a tecnologia antes de qualquer piloto.',
        porque: 'Sem saber que tipo de solução existe, o termo de referência especifica o que ainda não se conhece e o custo pode mudar muito.',
        como: ['Fazer a consulta com perguntas iguais para todos: onde roda, que modelo, que dados usa, como foi avaliado e como se sai.', 'Comparar as respostas antes de escolher o instrumento de compra.'] },
      { quando: k => k.v('adaptacao') === 'sob_medida', origem: () => ({ campo: 'adaptacao' }),
        oque: 'Escolher o instrumento de compra tratando o desenvolvimento sob medida como encomenda, e não produto pronto, e consultar o mercado com perguntas iguais para todos.',
        porque: 'O desenvolvimento sob medida comprado como produto pronto obriga a especificar o que ainda não se sabe e deixa a rede sem direito sobre o que foi feito.',
        como: ['Classificar a maturidade da solução (produto, configuração ou desenvolvimento) e registrar a escolha no estudo da necessidade.', 'Fazer a consulta ao mercado com as mesmas perguntas para todos: onde roda, que modelo e versão, que dados usa, como foi avaliado e como se sai.', 'Confirmar com a assessoria jurídica os instrumentos de compra que a rede pode usar.'] },
      { origem: k => ({ campo: k.v('conheceFerramentas') === 'nao' ? 'conheceFerramentas' : 'estrategiaCompra' }),
        oque: 'Escolher o instrumento de compra pela maturidade da solução e fazer a consulta ao mercado com perguntas iguais para todos.',
        porque: 'O instrumento errado obriga a especificar o que ainda não se sabe; sem saber que ferramentas existem, a rede pode comprar como produto o que precisaria desenvolver.',
        como: ['Classificar a maturidade da solução (produto, configuração ou desenvolvimento) e registrar a escolha no estudo da necessidade.', 'Fazer a consulta ao mercado com as mesmas perguntas para todos: onde roda, que modelo e versão, que dados usa, como foi avaliado e como se sai.', 'Confirmar com a assessoria jurídica os instrumentos de compra que a rede pode usar.'] },
    ],
    paraque: 'A rede escolhe a tecnologia e o instrumento de compra sabendo o que o mercado oferece.',
    quem: ['compras', 'juridico', 'tecnologia'], marco: 'M3', pd: 5,
    alta: () => true, exige: ['CONTRATO.escopo-objeto'],
    exemplosNorma: {
      BR: ['Lei 14.133/2021, art. 32 (diálogo competitivo)', 'Lei 10.973/2004, art. 20 (encomenda tecnológica)', 'Lei Complementar 182/2021, cap. VI (contrato público de solução inovadora)'],
      UE: ['Diretiva 2014/24/UE, arts. 30 e 31 (diálogo concorrencial e parceria para inovação)'],
    },
    pronto: 'O relatório da consulta ao mercado e a escolha justificada do instrumento estão juntados ao processo.',
  },
  {
    id: 'R-56', versao: 2, pacote: 'COMPRA', tipo: 'custo', substitui: ['teste-ambos-contrato'], campos: ['testes', 'pagamento'],
    se: k => k.teste === 'ambos' || k.v('instrumentoTeste') === 'nao_sei' || (k.testes.length > 0 && k.temPiloto && !k.gratis && k.eleg >= 5000),
    origem: k => (k.teste === 'ambos' ? { campo: 'testes', vals: k.testes } : { campo: 'pagamento' }),
    variantes: [
      { quando: k => k.teste === 'ambos',
        oque: 'Contratar o teste em etapas, sem que a prova de conceito obrigue ao piloto nem à compra, com o preço de cada etapa.',
        porque: 'Uma prova de conceito que obriga ao piloto ou à compra transforma o teste em contratação antecipada do fornecedor.',
        como: ['Escrever no instrumento do teste que cada etapa é uma decisão separada.', 'Fixar o preço de cada etapa antes de começar.', 'Prever o encerramento sem multa ao fim de cada etapa.'] },
      { oque: 'Contratar o teste sem criar direito de continuar, com contrato pequeno ou como etapa de um contrato já competido para a escala.',
        porque: 'Um piloto contratado direto e seguido de expansão com o mesmo fornecedor é o caminho mais comum de dependência e de questionamento pelo controle.',
        como: ['Fixar a quantidade estimada sem mínimo e pagar só pelo que for executado.', 'Prever o encerramento sem multa ao fim do teste.', 'Usar o resultado do teste como critério da compra, e nunca como preferência por quem testou.'] },
    ],
    paraque: 'A rede pode parar depois de cada etapa sem custo nem obrigação, e a escala ainda pode ser competida.',
    quem: ['compras', 'juridico'], marco: 'M1', pd: 5, curto: 'a contratação do teste sem direito de continuar',
    condicao: () => true, exige: ['CONTRATO.escopo-requisitos', 'CONTRATO.custo-unidades', 'CONTRATO.etapa-sem-obrigacao'],
    exemplosNorma: { BR: ['Lei 14.133/2021, art. 75, II (dispensa por valor, como exemplo de contrato pequeno)'], UE: ['Comunicação COM(2007) 799 (compras pré-comerciais)'] },
    pronto: 'O instrumento do teste diz que nenhuma etapa obriga à seguinte, nem à compra, e traz o preço de cada uma.',
  },
  {
    id: 'R-57', versao: 2, pacote: 'COMPRA', tipo: 'custo', substitui: ['gratis-fim', 'gratis-ativos'], campos: ['pagamento'],
    se: k => k.v('pagamento') === 'gratuito',
    variantes: [{
      oque: 'Formalizar o teste gratuito por instrumento publicado, com escopo, prazo, dados, propriedade do que for configurado e cláusula de não preferência.',
      porque: 'O teste gratuito dá ao fornecedor vantagem de informação, e a rede ainda gasta {ano0} no Ano 0 sem licença; sem instrumento público, a gratuidade vira preferência.',
      como: ['Usar cooperação ou doação publicada, com escopo, prazo e exclusão dos dados ao final.', 'Acordar o destino dos dados e dos materiais se o fornecedor não for escolhido.', 'Registrar o preço público de tabela só como referência e calcular a custo-efetividade com o preço depois da gratuidade.'],
    }],
    paraque: 'O teste gratuito não dá vantagem a ninguém na compra que vier depois.',
    quem: ['juridico', 'compras'], marco: 'M1', pd: 5, curto: 'o instrumento público do teste gratuito',
    condicao: () => true, alta: () => true,
    numero: (k, d) => numero('ano0', d), vars: (k, d) => varsRec(d, ['ano0']),
    exige: ['CONTRATO.direitos-ativos', 'CONTRATO.saida-exclusao', 'DADOS_REQ.exclusao', 'CONTRATO.nao-preferencia'],
    pronto: 'O instrumento publicado do teste gratuito traz escopo, prazo, dados, propriedade e não preferência.',
  },
  {
    id: 'R-58', versao: 2, pacote: 'COMPRA', tipo: 'custo', substitui: ['ferramentas-cotacao'], campos: ['ferramentas'],
    se: k => k.semPreco.length > 0,
    origem: k => ({ campo: 'ferramentas', vals: k.semPreco.map(f => f.nome) }),
    variantes: [{
      oque: 'Formar o preço de referência das ferramentas pagas sem preço com pelo menos três fontes, como contratos de outras redes, preços públicos e cotações.',
      porque: 'Um só orçamento, sobretudo o do interessado, não sustenta o preço estimado; até lá, a estimativa usa um preço de exemplo.',
      como: ['Reunir contratos de outras redes, preços públicos de tabela e cotações de mais de um fornecedor.', 'Registrar no processo como o preço de referência foi calculado.'],
    }],
    paraque: 'O preço estimado se sustenta diante do controle e do mercado.',
    quem: ['compras'], marco: 'M3', pd: 5,
    alta: () => true, exige: ['CONTRATO.custo-unidades', 'CONTRATO.custo-reajuste'],
    exemplosNorma: { BR: ['Lei 14.133/2021, art. 23 (valor estimado)', 'IN SEGES/ME 65/2021 (pesquisa de preços)'] },
    pronto: 'A planilha do preço de referência, com ao menos três fontes, está juntada ao processo.',
  },
  {
    id: 'R-59', versao: 1, pacote: 'COMPRA', tipo: 'custo', substitui: [], campos: ['pagamento', 'horizonte'],
    se: k => !!k.d && k.situacao !== 'renovar',
    origem: k => ({ campo: k.v('pagamento') ? 'pagamento' : 'tipoTec' }),
    variantes: [
      { quando: k => (parcelaAbaixo(k.d) || 0) >= 0.5,
        oque: 'Julgar as propostas pelo custo do ciclo de vida no horizonte do plano, com planilha padronizada, e não pelo preço da licença.',
        porque: '{pAbaixo} do custo total está abaixo da linha d’água: a proposta de licença mais barata pode ser a de maior custo total.',
        como: ['Exigir uma planilha de preços padronizada com as linhas da árvore de custos: licença, integração, formação, operação e saída.', 'Comparar as propostas no cenário esperado e no de estresse.', 'Pontuar só o que a proposta puder demonstrar.'] },
      { oque: 'Julgar as propostas pelo custo do ciclo de vida no horizonte do plano, com planilha padronizada, e não pelo preço da licença.',
        porque: 'Mesmo com {pAbaixo} do custo total abaixo da linha d’água, julgar só pela licença deixa de fora integração, formação, operação e saída.',
        como: ['Exigir uma planilha de preços padronizada com as linhas da árvore de custos: licença, integração, formação, operação e saída.', 'Comparar as propostas no cenário esperado e no de estresse.', 'Pontuar só o que a proposta puder demonstrar.'] },
    ],
    paraque: 'A compra escolhe a proposta de menor custo total, e não a de menor preço de licença.',
    quem: ['compras', 'orcamento'], marco: 'M3', pd: 6,
    alta: k => (parcelaAbaixo(k.d) || 0) >= 0.6,
    numero: (k, d) => {
      const p = parcelaAbaixo(d);
      return p == null ? null : { id: 'pAbaixo', rotulo: tr('Parte do custo total abaixo da linha d’água'), valor: pct(p), fonte: 'Quanto custa', emJogo: p * (+d.total || 0) };
    },
    vars: (k, d) => { const p = parcelaAbaixo(d); return p == null ? {} : { pAbaixo: pct(p) }; },
    exige: ['CONTRATO.planilha-precos'],
    exemplosNorma: { BR: ['Lei 14.133/2021, arts. 11 e 34 (julgamento e custo do ciclo de vida)'], UE: ['Diretiva 2014/24/UE, arts. 67 e 68 (proposta mais vantajosa e custo do ciclo de vida)'] },
    pronto: 'A planilha padronizada de preços, com as linhas do custo do ciclo de vida, faz parte do edital.',
  },
  {
    id: 'R-60', versao: 1, pacote: 'COMPRA', tipo: 'custo', substitui: [], campos: ['tipoTec', 'testes'], requer: ['tipoTec'],
    se: k => !!k.v('tipoTec') && (k.alto || k.consDecide.length > 0 || k.poc || k.teste === 'ambos' || ['poc', 'ambos'].includes((k.rec || {}).modo)),
    origem: () => ({ campo: 'tipoTec' }),
    variantes: [{
      oque: 'Prever no edital uma demonstração do licitante provisoriamente vencedor, com roteiro, dados e critérios de aprovação publicados antes.',
      porque: 'A demonstração separa o que o fornecedor promete do que entrega, e evita contratar quem só preencheu bem a proposta.',
      como: ['Montar o roteiro com as tarefas do caso e o mesmo conjunto de teste usado na avaliação.', 'Fixar prazo, banca e ata, com os critérios de aprovação publicados antes.', 'Se o licitante for reprovado, chamar o próximo colocado.'],
    }],
    paraque: 'A rede contrata quem demonstra o que prometeu, com critérios conhecidos de todos.',
    quem: ['compras', 'tecnologia', 'pedagogica'], marco: 'M3', pd: 6,
    // o roteiro da demonstração usa o conjunto de teste da R-08: ela vem antes (+1 de dependência para a R-08, 4.1)
    depende: ['R-08'],
    alta: k => k.alto, exige: ['CONTRATO.demonstracao', 'CONTRATO.desempenho-aceite'],
    exemplosNorma: { BR: ['Lei 14.133/2021, art. 17, § 3º (prova de conceito do licitante provisoriamente vencedor)'] },
    pronto: 'O edital traz a demonstração do licitante provisoriamente vencedor, com roteiro, dados e critérios.',
  },
  {
    id: 'R-61', versao: 2, pacote: 'COMPRA', tipo: 'custo', substitui: ['lic-institucional'], campos: ['pagamento'], requer: ['tipoTec'],
    se: k => ['usuario', 'institucional', 'consumo'].includes(k.v('pagamento')) && horizonteRec(k) >= 2,
    variantes: [
      { quando: k => k.v('pagamento') === 'institucional' && !!k.d && k.d.aEq != null && k.d.adocaoMin < k.d.aEq,
        oque: 'Pedir na proposta o preço de todos os anos e por faixa de usuários ativos, e fixar antes a adoção mínima para continuar.',
        porque: 'A adoção prevista é de {adocao}, abaixo dos {aEq} de equilíbrio: nesse ponto a licença por usuário sai mais barata que a assinatura institucional.',
        como: ['Pedir o preço de cada ano do horizonte, com o índice e a data do reajuste.', 'Pedir o preço por faixa de usuários ativos e proibir mínimo garantido acima da adoção prevista.', 'Acompanhar quantas pessoas usam de fato e comparar com a adoção mínima fixada.'] },
      { quando: k => k.v('pagamento') === 'institucional',
        oque: 'Pedir na proposta o preço de todos os anos e por faixa de usuários ativos, e fixar antes a adoção mínima para continuar.',
        porque: 'A adoção prevista é de {adocao}; o preço por faixa e a adoção mínima protegem a rede se o uso ficar abaixo do previsto.',
        como: ['Pedir o preço de cada ano do horizonte, com o índice e a data do reajuste.', 'Pedir o preço por faixa de usuários ativos e proibir mínimo garantido acima da adoção prevista.', 'Acompanhar quantas pessoas usam de fato e comparar com a adoção mínima fixada.'] },
      { oque: 'Pedir na proposta o preço de todos os anos, o índice de reajuste e o preço por faixa de usuários ativos.',
        porque: 'A adoção prevista é de {adocao}; sem o preço de cada ano e por faixa, a renovação depende de nova negociação, e o desconto inicial acaba.',
        como: ['Pedir o preço de cada ano do horizonte, com o índice e a data do reajuste.', 'Pedir o preço por faixa de usuários ativos, e pagar pela faixa medida.'] },
    ],
    paraque: 'A rede paga um preço previsível e proporcional ao uso real.',
    quem: ['compras', 'orcamento'], marco: 'M3', pd: 6,
    alta: k => !!k.d && k.d.aEq != null && k.d.adocaoMin < k.d.aEq,
    numero: (k, d) => (k.v('pagamento') === 'institucional' && d && d.aEq != null ? numero('aEq', d) : numero('adocao', d)),
    vars: (k, d) => varsRec(d, ['aEq', 'adocao']),
    exige: ['CONTRATO.custo-reajuste', 'CONTRATO.custo-unidades', 'CONTRATO.preco-faixa'],
    exemplosNorma: { BR: ['Lei 14.133/2021, art. 25, § 7º (índice de reajuste no edital)'] },
    pronto: 'A proposta traz o preço de cada ano e por faixa de usuários ativos, e a adoção mínima está fixada.',
  },
  {
    id: 'R-62', versao: 1, pacote: 'COMPRA', tipo: 'custo', substitui: [], campos: ['nivel', 'elegiveis', 'g-compras'],
    se: k => (['municipio', 'distrito', 'rede'].includes(k.v('nivel')) && k.eleg > 0 && k.eleg < 10000) || k.resp('g-compras') === 'nao',
    origem: k => (k.resp('g-compras') === 'nao' && !(k.eleg > 0 && k.eleg < 10000) ? { campo: 'g-compras', vals: ['nao'] } : { campo: 'elegiveis', vals: [k.valEleg] }),
    variantes: [{
      oque: 'Verificar se há compra centralizada, ata, acordo-quadro ou consórcio com outras redes que já traga as cláusulas deste plano.',
      porque: 'Uma rede pequena tem pouco poder de negociação e pouca equipe para fiscalizar sozinha um contrato de IA; comprar junto reduz o preço e o custo de gerir.',
      como: ['Consultar a central de compras e os consórcios de que a rede participa.', 'Conferir as cláusulas da ata ou do acordo contra a lista “O que exigir” deste plano.', 'Registrar o resultado no estudo da necessidade.'],
    }],
    paraque: 'A rede compra com o poder de negociação e a equipe de fiscalização que sozinha não teria.',
    quem: ['compras'], marco: 'M3', pd: 5,
    semExige: 'Verificação de uma compra conjunta que já traga as cláusulas; não cria cláusula nova.',
    exemplosNorma: { UE: ['Diretiva 2014/24/UE, arts. 37 a 39 (compras centralizadas e conjuntas)'] },
    pronto: 'O estudo da necessidade registra se existe compra conjunta com as cláusulas deste plano e o motivo da escolha.',
  },
  {
    id: 'R-63', versao: 1, pacote: 'COMPRA', tipo: 'custo', substitui: ['g-compras'], campos: ['g-compras'],
    se: k => FALTA_RESP.includes(k.resp('g-compras')),
    origem: k => ({ campo: 'g-compras', vals: [k.resp('g-compras')] }),
    variantes: [{
      oque: 'Usar o checklist “O que exigir” deste plano como orientação de compras do caso e juntá-lo ao processo.',
      porque: 'A política geral de compras de IA da rede não cabe no prazo deste caso; o checklist cobre o que este contrato precisa.',
      como: ['Revisar o checklist com compras e com a assessoria jurídica.', 'Juntar o checklist revisado ao processo de contratação.'],
    }],
    passos: k => (k.falta('g-compras') ? [{ texto: 'Registrar o que falta na orientação de compras da rede.', falta: k.falta('g-compras') }] : []),
    textosExtras: ['Registrar o que falta na orientação de compras da rede.'],
    paraque: 'A contratação deste caso segue critérios de compra de IA desde já.',
    quem: ['compras'], marco: 'M3', pd: 5,
    exige: ['CONTRATO.gestao-responsavel'],
    pronto: 'O checklist revisado está juntado ao processo de contratação.',
  },
  {
    id: 'R-88', versao: 1, pacote: 'COMPRA', tipo: 'custo', substitui: ['ferramentas-levantar'], campos: ['conheceFerramentas', 'nFerramentas'],
    se: k => k.v('conheceFerramentas') === 'nao',
    variantes: [{
      oque: 'Listar as ferramentas candidatas e as tarefas de cada uma antes do teste.',
      porque: 'O custo depende de quantas ferramentas forem e de como são pagas; sem a lista, a estimativa supõe uma só.',
      como: ['Listar as ferramentas candidatas, com as tarefas e a forma de pagamento de cada uma.', 'Responder às perguntas 2.3.2 e 2.3.3 com a lista.'],
    }],
    paraque: 'A estimativa e a compra consideram todas as ferramentas que vão ser usadas.',
    quem: ['tecnologia', 'pedagogica'], marco: 'M1',
    exige: ['CONTRATO.escopo-objeto'],
    pronto: 'A lista de ferramentas candidatas está registrada no caso.',
  },
  {
    id: 'R-90', versao: 1, pacote: 'COMPRA', tipo: 'custo', substitui: ['ferramentas-sobrepostas'], campos: ['ferramentas', 'nFerramentas'],
    se: k => k.variasFerr,
    origem: k => (k.ferr.length > 1 ? { campo: 'ferramentas', vals: k.ferr.map(f => f.nome) } : { campo: 'nFerramentas', vals: [k.v('nFerramentas')] }),
    variantes: [{
      oque: 'Verificar se as ferramentas cobrem as mesmas tarefas e evitar pagar licenças sobrepostas.',
      porque: 'Duas ferramentas para a mesma tarefa dobram o custo de licença, formação e suporte sem dobrar o resultado.',
      como: ['Cruzar as tarefas de cada ferramenta.', 'Escolher uma ferramenta por tarefa antes de contratar.'],
    }],
    paraque: 'A rede não paga duas vezes pela mesma tarefa.',
    quem: ['compras', 'tecnologia'], marco: 'M3',
    alta: k => !!k.sobrepostas, exige: ['CONTRATO.escopo-objeto'],
    pronto: 'Cada tarefa tem uma só ferramenta no plano de compra.',
  },
  {
    id: 'R-91', versao: 1, pacote: 'COMPRA', tipo: 'custo', substitui: ['publica'], campos: ['tipoTec'],
    se: k => k.v('tipoTec') === 'publica',
    variantes: [{
      oque: 'Confirmar quem mantém a plataforma pública, por quanto tempo e o que fica a cargo da rede.',
      porque: 'Uma plataforma pública sem responsável e prazo definidos pode deixar de ser mantida no meio do uso.',
      como: ['Pedir ao órgão responsável o prazo de manutenção e o que ele cobre.', 'Registrar o que fica a cargo da rede: suporte, formação e dados.'],
    }],
    paraque: 'O uso não depende de uma manutenção que ninguém garantiu.',
    quem: ['compras', 'tecnologia'], marco: 'M3',
    exige: ['CONTRATO.saida-continuidade', 'CONTRATO.direitos-matriz'],
    pronto: 'O termo com o órgão responsável traz o prazo de manutenção e a divisão de responsabilidades.',
  },
  {
    id: 'R-92', versao: 1, pacote: 'COMPRA', tipo: 'custo', substitui: ['incluida'], campos: ['pagamento'], requer: ['tipoTec'],
    se: k => k.v('pagamento') === 'incluida',
    variantes: [{
      oque: 'Verificar se o preço da plataforma que a rede já paga muda com a IA e em que unidade passa a ser cobrado.',
      porque: 'Custos embutidos numa plataforma existente costumam aparecer só na renovação, quando a rede já depende da ferramenta.',
      como: ['Pedir ao fornecedor a unidade de cobrança da IA e o preço na renovação.', 'Registrar no processo o que muda no contrato atual.'],
    }],
    paraque: 'O custo da IA aparece antes da renovação, e não depois.',
    quem: ['compras', 'orcamento'], marco: 'M3',
    exige: ['CONTRATO.custo-unidades', 'CONTRATO.custo-reajuste'],
    pronto: 'A unidade de cobrança e o preço da IA na plataforma atual estão registrados.',
  },
  {
    id: 'R-93', versao: 1, pacote: 'COMPRA', tipo: 'custo', substitui: ['lic-usuario'], campos: ['pagamento'], requer: ['tipoTec'],
    se: k => k.v('pagamento') === 'usuario',
    variantes: [{
      oque: 'Comparar o custo por licença paga com o custo por pessoa que de fato usa.',
      porque: 'Licenças compradas e não usadas são desperdício; o custo por usuário ativo mostra quanto a rede paga por quem usa.',
      como: ['Estimar quantas licenças serão de fato usadas em cada ano.', 'Pedir na proposta o preço por faixa de usuários ativos.'],
    }],
    paraque: 'A rede compra licenças na medida do uso.',
    quem: ['orcamento', 'compras'], marco: 'M3',
    alta: () => true, exige: ['CONTRATO.custo-unidades'],
    pronto: 'A comparação entre licenças pagas e usuários ativos está no processo.',
  },
  {
    id: 'R-111', versao: 1, pacote: 'COMPRA', tipo: 'custo', substitui: ['gratis-adiados'], campos: ['pagamento', 'tipoTec'],
    se: k => k.gratis,
    origem: k => ({ campo: k.v('pagamento') === 'gratuito' ? 'pagamento' : 'tipoTec' }),
    variantes: [{
      oque: 'Listar os custos que a gratuidade não cobre e apenas adia, como formação, integração, proteção de dados e suporte.',
      porque: 'A gratuidade cobre a licença, mas não o resto; o que fica adiado volta como despesa quando o uso cresce.',
      como: ['Listar, ano a ano, os custos que a rede paga mesmo sem licença.', 'Incluir esses custos no orçamento e na comparação com outras opções.'],
    }],
    paraque: 'A decisão considera o custo real, e não só o preço zero da licença.',
    quem: ['orcamento', 'compras'], marco: 'M1', pd: 5,
    alta: () => true, exige: ['CONTRATO.custo-unidades'],
    pronto: 'A lista dos custos adiados, com valores por ano, está no processo.',
  },
];

// Textos novos do pacote R4c que `textosRegras()` não alcança (cláusulas novas de EXIGE, rótulos de números, exemplos de norma
// e a nota que acompanha os exemplos), para a extração das traduções pelo orquestrador.
export const NOTA_EXEMPLOS_NORMA = 'Exemplos de norma: confirme com a assessoria jurídica.';
const TEXTOS_FIXOS_R4C = [
  NOTA_EXEMPLOS_NORMA, 'Parte do custo total abaixo da linha d’água',
  'Cada etapa do teste é uma decisão separada: nenhuma obriga à seguinte nem à compra, e cada uma tem o preço fixado antes de começar',
  'Cláusula de não preferência: o teste gratuito não cria obrigação nem vantagem na compra que vier depois',
  'Planilha de preços padronizada, com as linhas do custo do ciclo de vida no horizonte do plano',
  'Demonstração do licitante provisoriamente vencedor, com roteiro, dados e critérios de aprovação publicados antes',
  'Preço de todos os anos e por faixa de usuários ativos, com a adoção mínima para continuar',
  'Desconto na fatura quando os níveis de serviço do sistema não forem cumpridos, com teto e rescisão após falhas repetidas',
  'O que o fornecedor desenvolve ou ajusta com dados da rede (código, configurações, modelo, variáveis e documentação) é da rede, que pode refazê-lo sem o fornecedor',
  'Matriz de riscos: quem arca com o preço do modelo ou da nuvem, o câmbio, a falha de terceiro e o incidente de dados',
  'Gestor e fiscais (técnico e pedagógico) designados antes de assinar, com horas reservadas e painel mensal',
];
export const TEXTOS_REC_R4C = [...new Set(TEXTOS_FIXOS_R4C.concat([].concat(REGRAS_COMPRA, REGRAS_CONTRATO, REGRAS_ORC, REGRAS_GOV)
  .flatMap(r => Object.values(r.exemplosNorma || {}).flat())))];
