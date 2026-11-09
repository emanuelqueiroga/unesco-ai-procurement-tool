// v018 (governança): custos adicionais sobre as opções — viagens, overhead (custos indiretos) e taxa administrativa.
// Cada um é um percentual editável, com padrão de fonte pública (grau B):
//  - viagens: % dos custos das opções (UNESCO 2024: missões = 2,2% dos gastos totais);
//  - overhead: % dos custos diretos, opções + viagens (EUA, 2 CFR 200.414(f): até 15%);
//  - taxa administrativa: % dos custos diretos, opções + viagens (ONU, política do UNSDG: 7% dos custos de programa).
// O overhead e a taxa incidem sobre a mesma base, sem um entrar na base do outro. Entram como uma categoria a mais
// ("Custos adicionais") no orçamento, para somar no total, nas fases, no resumo e nos PDFs.
import { t } from './textos';
import type { LinhaOpcao, ParteConta, FonteConta, FaseCalc } from './custosV017';

export type ChaveAdicional = 'viagens' | 'overhead' | 'taxa';
export interface Adicional { chave: ChaveAdicional; rotulo: string; padrao: number; base: 'opcoes' | 'diretos'; fonte: FonteConta; nota: string }
export const ID_ADICIONAIS = 'adicionais';
export const ADICIONAIS: Adicional[] = [
  { chave: 'viagens', rotulo: 'Viagens (diárias e passagens)', padrao: 2.2, base: 'opcoes',
    fonte: { titulo: 'UNESCO, relatório financeiro e demonstrações financeiras auditadas de 2024 (222 EX/30.I), nota 20.2', url: 'https://www.un.org/sites/un2.un.org/files/unesco_auditors_report_and_audited_financial_statements_for_2024_-_sp.pdf' },
    nota: 'Em 2024, as missões do pessoal e de delegados da UNESCO (passagens e diárias) somaram 18,3 milhões de US$, 2,2% dos 848,7 milhões de gastos totais. Não inclui as viagens de consultores, que a UNESCO soma aos honorários: é um piso.' },
  { chave: 'overhead', rotulo: 'Overhead (custos indiretos)', padrao: 15, base: 'diretos',
    fonte: { titulo: 'EUA, 2 CFR 200.414(f): custos indiretos de até 15% dos custos diretos sem taxa negociada (revisão de 2024)', url: 'https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-E/subject-group-ECFRd93f2a98b1f6455/section-200.414' },
    nota: 'Cobre o que a instituição gasta para o trabalho existir e não dá para atribuir a uma opção: espaço, TI, RH, contabilidade, jurídico. Para comparar: a União Europeia usa 7% nas subvenções comuns e 25% no Horizon Europe.' },
  { chave: 'taxa', rotulo: 'Taxa administrativa', padrao: 7, base: 'diretos',
    fonte: { titulo: 'Política do UNSDG para fundos conjuntos da ONU: custos indiretos de 7% dos custos de programa (relatório financeiro do UN Energy MPTF, 2025)', url: 'https://mptf.undp.org/sites/default/files/documents/2026-05/2025_annual_financial_report-un_energy_mptf.pdf' },
    nota: 'Cobrada por quem administra o recurso (agência da ONU, fundação de apoio, fundo). Se não houver intermediário, use 0%. Para comparar: a UNESCO cobra em média 8%; fundações de apoio no Brasil podem cobrar até 15% (Decreto 9.283/2018).' },
];
const positivoOuZero = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const centavos = (v: number) => Math.round(v * 100) / 100;

/** As três linhas de custos adicionais, calculadas sobre o custo por fase das opções (só as que já têm valor). */
export function linhasAdicionais(diretoPorFase: Record<string, number>, salvo: Partial<Record<ChaveAdicional, number>>, fases: FaseCalc[],
  fmt: (v: number) => string, num: (v: number) => string): LinhaOpcao[] {
  const pct = (a: Adicional) => positivoOuZero(salvo[a.chave]) ? salvo[a.chave] as number : a.padrao;
  const viagem = ADICIONAIS[0], pv = pct(viagem);
  const viagensFase: Record<string, number> = {}; for (const x of fases) viagensFase[x.id] = centavos((diretoPorFase[x.id] || 0) * pv / 100);
  const soma = (r: Record<string, number>) => centavos(Object.values(r).reduce((a, b) => a + b, 0));
  const totOpcoes = soma(diretoPorFase), totViagens = soma(viagensFase);
  return ADICIONAIS.map(a => {
    const p = pct(a), informado = positivoOuZero(salvo[a.chave]);
    const porFase: Record<string, number> = {};
    for (const x of fases) porFase[x.id] = a.chave === 'viagens' ? viagensFase[x.id] : centavos(((diretoPorFase[x.id] || 0) + viagensFase[x.id]) * p / 100);
    const total = soma(porFase), base = a.base === 'opcoes' ? totOpcoes : centavos(totOpcoes + totViagens);
    const pctTxt = num(p) + '%';
    const baseTxt = a.base === 'opcoes' ? t('custos das opções') : t('custos diretos (opções + viagens)');
    const partes: ParteConta[] = [
      { rotulo: a.base === 'opcoes' ? t('Custos das opções') : t('Custos diretos (opções + viagens)'), valor: fmt(base), fontes: [],
        texto: a.base === 'opcoes' ? t('soma das opções que já têm valor') : t('soma das opções que já têm valor, mais as viagens; o overhead e a taxa administrativa não entram na base um do outro') },
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
