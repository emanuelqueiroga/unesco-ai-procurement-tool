// v018 (governança): custos adicionais sobre as opções — viagens, overhead (custos indiretos) e taxa administrativa.
// Cada um é um percentual editável, com padrão de fonte pública (grau B):
//  - viagens e atividades presenciais: % do trabalho de pessoas (Fundo Global, ciclos 5 a 7: 24,7% a 28,2% dos orçamentos sem produtos de saúde);
//  - overhead: % do trabalho de pessoas + viagens (EUA, 2 CFR 200.414(f): até 15% da base que exclui equipamentos e despesas de capital);
//  - taxa administrativa: % dos custos diretos, opções + viagens (ONU, política do UNSDG: 7% dos custos de programa).
// v018.1: o trabalho de pessoas é o custo das opções sem infraestrutura, equipamentos, licenças e serviços de nuvem
// (as partes de compra do desafio 2); nas demais opções, é o custo inteiro, e o resultado não muda.
// Uma pergunta por custo diz se ele se aplica (viagens? a instituição já cobre os indiretos? quem executa o recurso?);
// sem resposta, entra o padrão. O overhead e a taxa incidem sobre a mesma base, sem um entrar na base do outro. Entram como uma categoria a mais
// ("Custos adicionais") no orçamento, para somar no total, nas fases, no resumo e nos PDFs.
import { t } from './textos';
import type { LinhaOpcao, ParteConta, FonteConta, FaseCalc } from './custosV017';

export type ChaveAdicional = 'viagens' | 'overhead' | 'taxa';
export interface Adicional { chave: ChaveAdicional; rotulo: string; padrao: number; base: 'pessoas' | 'pessoasViagens' | 'diretos'; fonte: FonteConta; nota: string }
export const ID_ADICIONAIS = 'adicionais';
/** O que fica gravado em govOrcamento.adicionais: os percentuais e as três perguntas (se se aplica). */
export interface SalvoAdicionais extends Partial<Record<ChaveAdicional, number>> { temViagens?: 'sim' | 'nao'; overheadCoberto?: 'sim' | 'nao'; executor?: 'proprio' | 'onu' | 'fundacao' }
export interface PerguntaAdicional { campo: 'temViagens' | 'overheadCoberto' | 'executor'; pergunta: string; opcoes: [string, string][]; naoAplica: string; motivo: string }
/** v018: uma pergunta por custo adicional, para saber se ele se aplica (sem resposta, entra com o padrão). */
export const PERGUNTAS_ADICIONAIS: Record<ChaveAdicional, PerguntaAdicional> = {
  viagens: { campo: 'temViagens', pergunta: 'O plano terá reuniões técnicas, oficinas ou viagens?', opcoes: [['sim', 'Sim'], ['nao', 'Não']], naoAplica: 'nao',
    motivo: 'Não se aplica: o plano não terá reuniões técnicas, oficinas nem viagens.' },
  overhead: { campo: 'overheadCoberto', pergunta: 'A instituição já cobre os custos indiretos (espaço, TI, RH, contabilidade)?', opcoes: [['sim', 'Sim, já cobre (não somar)'], ['nao', 'Não, somar ao plano']], naoAplica: 'sim',
    motivo: 'Não se aplica: a instituição já cobre os custos indiretos.' },
  taxa: { campo: 'executor', pergunta: 'Quem vai executar o recurso?', opcoes: [['proprio', 'O próprio órgão (sem taxa)'], ['onu', 'Agência da ONU ou organismo internacional'], ['fundacao', 'Fundação de apoio ou outra entidade']], naoAplica: 'proprio',
    motivo: 'Não se aplica: o próprio órgão executa o recurso, sem taxa de intermediário.' },
};
/** O custo adicional não se aplica, pela resposta da pergunta dele. */
export const naoSeAplica = (chave: ChaveAdicional, salvo: SalvoAdicionais) => { const q = PERGUNTAS_ADICIONAIS[chave]; return salvo[q.campo] === q.naoAplica; };
export const ADICIONAIS: Adicional[] = [
  { chave: 'viagens', rotulo: 'Viagens e atividades presenciais', padrao: 25, base: 'pessoas',
    fonte: { titulo: 'Fundo Global, Data Explorer: orçamentos por categoria de custo, ciclos 5 a 7 (custos relacionados a viagens, TRC)', url: 'https://data.theglobalfund.org/financial-insights' },
    nota: 'No Fundo Global, os custos de viagem e de atividades presenciais (passagens, diárias, transporte, oficinas, reuniões técnicas, capacitações e supervisão) somam 24,7% do orçamento dos programas, sem contar a compra de produtos de saúde e a cadeia de suprimentos, no ciclo 7 (27,6% no ciclo 6 e 28,2% no ciclo 5). O padrão arredonda para 25%.' },
  { chave: 'overhead', rotulo: 'Overhead (custos indiretos)', padrao: 15, base: 'pessoasViagens',
    fonte: { titulo: 'EUA, 2 CFR 200.414(f): custos indiretos de até 15% dos custos diretos sem taxa negociada (revisão de 2024)', url: 'https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-E/subject-group-ECFRd93f2a98b1f6455/section-200.414' },
    nota: 'Cobre o que a instituição gasta para o trabalho existir e não dá para atribuir a uma opção: espaço, TI, RH, contabilidade, jurídico. Para comparar: a União Europeia usa 7% nas subvenções comuns e 25% no Horizon Europe.' },
  { chave: 'taxa', rotulo: 'Taxa administrativa', padrao: 7, base: 'diretos',
    fonte: { titulo: 'Política do UNSDG para fundos conjuntos da ONU: custos indiretos de 7% dos custos de programa (relatório financeiro do UN Energy MPTF, 2025)', url: 'https://mptf.undp.org/sites/default/files/documents/2026-05/2025_annual_financial_report-un_energy_mptf.pdf' },
    nota: 'Cobrada por quem administra o recurso (agência da ONU, fundação de apoio, fundo). Se não houver intermediário, use 0%. Para comparar: a UNESCO cobra em média 8%; fundações de apoio no Brasil podem cobrar até 15% (Decreto 9.283/2018).' },
];
const positivoOuZero = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const centavos = (v: number) => Math.round(v * 100) / 100;

/** As três linhas de custos adicionais, calculadas sobre o custo por fase das opções (só as que já têm valor):
 *  viagens sobre o trabalho de pessoas, overhead sobre o trabalho de pessoas + viagens, taxa sobre as opções + viagens. */
export function linhasAdicionais(diretoPorFase: Record<string, number>, salvo: SalvoAdicionais, fases: FaseCalc[],
  fmt: (v: number) => string, num: (v: number) => string, pessoasPorFase: Record<string, number> = diretoPorFase): LinhaOpcao[] {
  const pct = (a: Adicional) => naoSeAplica(a.chave, salvo) ? 0 : positivoOuZero(salvo[a.chave]) ? salvo[a.chave] as number : a.padrao;
  const viagem = ADICIONAIS[0], pv = pct(viagem);
  const viagensFase: Record<string, number> = {}; for (const x of fases) viagensFase[x.id] = centavos((pessoasPorFase[x.id] || 0) * pv / 100);
  const soma = (r: Record<string, number>) => centavos(Object.values(r).reduce((a, b) => a + b, 0));
  const totOpcoes = soma(diretoPorFase), totPessoas = soma(pessoasPorFase), totViagens = soma(viagensFase);
  const semViagens = naoSeAplica('viagens', salvo), soPessoas = totPessoas < totOpcoes;
  const baseFase = (a: Adicional, id: string) => a.base === 'pessoas' ? (pessoasPorFase[id] || 0) : (a.base === 'pessoasViagens' ? (pessoasPorFase[id] || 0) : (diretoPorFase[id] || 0)) + viagensFase[id];
  return ADICIONAIS.map(a => {
    if (naoSeAplica(a.chave, salvo)) {
      const porFase: Record<string, number> = {}; for (const x of fases) porFase[x.id] = 0;
      return { chave: a.chave, rotulo: a.rotulo, tipo: 'percentual', tipoPadrao: 'percentual', fonte: null, qtd: 0, qtdSugerida: false, horas: null, unit: null, unitRef: a.padrao,
        unitDaReferencia: false, valoresFase: {}, porFase, total: 0, status: 'informado', falta: [], naoAplica: true, memoria: t(PERGUNTAS_ADICIONAIS[a.chave].motivo) } as LinhaOpcao;
    }
    const p = pct(a), informado = positivoOuZero(salvo[a.chave]);
    const porFase: Record<string, number> = {};
    for (const x of fases) porFase[x.id] = a.chave === 'viagens' ? viagensFase[x.id] : centavos(baseFase(a, x.id) * p / 100);
    const total = soma(porFase), base = a.base === 'pessoas' ? totPessoas : centavos((a.base === 'pessoasViagens' ? totPessoas : totOpcoes) + totViagens);
    const pctTxt = num(p) + '%';
    // sem partes de compra (infraestrutura, equipamentos, nuvem), o trabalho de pessoas é o custo das opções: valem os textos da v018
    const [rot, baseTxt, texto] = a.base === 'diretos'
      ? (semViagens ? [t('Custos das opções'), t('custos das opções'), t('soma das opções que já têm valor (sem viagens); o overhead e a taxa administrativa não entram na base um do outro')]
        : [t('Custos diretos (opções + viagens)'), t('custos diretos (opções + viagens)'), t('soma das opções que já têm valor, mais as viagens; o overhead e a taxa administrativa não entram na base um do outro')])
      : !soPessoas
        ? (a.base === 'pessoas' ? [t('Custos das opções'), t('custos das opções'), t('soma das opções que já têm valor')]
          : semViagens ? [t('Custos das opções'), t('custos das opções'), t('soma das opções que já têm valor (sem viagens); o overhead e a taxa administrativa não entram na base um do outro')]
          : [t('Custos diretos (opções + viagens)'), t('custos diretos (opções + viagens)'), t('soma das opções que já têm valor, mais as viagens; o overhead e a taxa administrativa não entram na base um do outro')])
        : (a.base === 'pessoas' || semViagens ? [t('Trabalho de pessoas'), t('custos do trabalho de pessoas'), t('equipes e pessoal das opções que já têm valor, sem infraestrutura, equipamentos, licenças e serviços de nuvem')]
          : [t('Trabalho de pessoas + viagens'), t('custos do trabalho de pessoas e das viagens'), t('equipes e pessoal das opções que já têm valor, mais as viagens, sem infraestrutura, equipamentos, licenças e serviços de nuvem; o overhead e a taxa administrativa não entram na base um do outro')]);
    const partes: ParteConta[] = [
      { rotulo: rot, valor: fmt(base), fontes: [], texto },
      { rotulo: t('Percentual'), valor: pctTxt, fontes: informado ? [] : [a.fonte],
        texto: informado ? t('informado por você') : t('referência (grau B)') + '. ' + t(a.nota) },
    ];
    const status: LinhaOpcao['status'] = fases.length ? (informado ? 'informado' : 'referencia') : 'falta';
    return {
      chave: a.chave, rotulo: a.rotulo, tipo: 'percentual', tipoPadrao: 'percentual', fonte: null,
      qtd: p, qtdSugerida: !informado, horas: null, unit: null, unitRef: a.padrao, unitDaReferencia: !informado,
      valoresFase: {}, porFase, total: fases.length ? total : null, status, falta: fases.length ? [] : [t('as fases do plano')],
      conta: { formula: pctTxt + ' × ' + fmt(base) + ' = ' + fmt(total), partes },
      memoria: t('{p} dos {base}', { p: pctTxt, base: baseTxt }) + ' (' + fmt(base) + ')' + (informado ? '' : ' · ' + t('referência (grau B)')),
    };
  });
}
