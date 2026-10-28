// Calculadora do modo Refinar: funções puras sobre o motor de custos do domínio (sem React, sem DOM), para as
// três abas de #/refinar e os testes (tests/unit/refinar-custos.test.ts). Porte das partes de tela de
// src/custos_ui.js da v13 (renderCustosResultados, tabelaArvore, cfgAlternativa, seletor de moeda, CSV); o motor
// (calcular, avaliar, indicadores, orcamento, cenarios, tornado, simular…) não é reimplementado aqui.
import {
  ARVORE, NOME_K, NOME_S, MAPA_CAT, OPC_PADRAO, clone, opcoes, ano, arquitetura, calcular, avaliar, indicadores, orcamento,
  orcamentoDeLinhas, explicacaoCusto, getTabelaMoedas, nomeMoeda, moedaInfo, sepNum, tr, LOC,
} from '../../domain';
import type { AbaRefinar } from '../../percurso/rota';

export type Conta = 'eco' | 'fin';

/** todos os resultados que a tela usa a partir da cfg; `erro` quando campos vazios ou zerados quebram o cálculo */
export interface Resultados { ok: true; cfg: any; r: any; av: any; ind: any; orc: any; H: number; T: number[]; dotTotal: number }
export type ResultadosOuErro = Resultados | { ok: false; erro: string };

/** cfg com as opções padrão completas (garantirOpc da v13), sem mexer na original */
export function cfgPronta(cfg: any): any {
  const c = clone(cfg);
  c.opc = Object.assign({}, OPC_PADRAO, c.opc || {});
  return c;
}

export function resultados(cfg0: any): ResultadosOuErro {
  try {
    const cfg = cfgPronta(cfg0);
    const r = calcular(cfg), av = avaliar(r), ind = indicadores(cfg, av), orc = orcamento(cfg);
    const vals = [av.ctEco, ind.icu, ...orc.dot];
    if (vals.some((v: number) => !isFinite(v))) throw new Error('não finito');
    return { ok: true, cfg, r, av, ind, orc, H: r.H, T: r.anos, dotTotal: orc.dot.reduce((a: number, b: number) => a + b, 0) };
  } catch (e) {
    return { ok: false, erro: String((e as Error)?.message || e) };
  }
}

/** série de um campo por ano (Ano 0…H), repetindo o último valor como o motor (ano()) */
export function serieAnos(arr: any, H: number): number[] {
  return Array.from({ length: H + 1 }, (_, t) => { const v = ano(arr, t); return v === undefined || v === null || v === '' ? 0 : +v; });
}

// ----------------------------------------------------------- árvore K1–K6 → subcomponente → insumo (CUS-12)
export interface LinhaArvore {
  id: string;
  nivel: 0 | 1 | 2;
  rotulo: string;
  k: string;
  serie: number[];
  total: number;
  porUsuario: number | null;
  pct: number | null;
  /** tem filhos (componente com subcomponentes; subcomponente com insumos) */
  expansivel: boolean;
  aberto: boolean;
  /** insumo: natureza, moeda, capital, variável, fim do horizonte */
  tags?: string[];
  unidade?: string;
}
/** linhas visíveis da árvore (porte de tabelaArvore, custos_ui.js), mais a linha de total no fim */
export function linhasArvore(av: any, ind: any, conta: Conta, abertos: Record<string, boolean>): { linhas: LinhaArvore[]; total: LinhaArvore } {
  const T: number[] = av.r.anos;
  const serieLinha = (l: any): number[] => (conta === 'fin' ? l.fin : l.eco);
  const totL = (l: any): number => (conta === 'fin' ? l.fin.reduce((a: number, b: number) => a + b, 0) : l.ecoVP);
  const serieS = (s: string) => T.map((t) => av.linhas.filter((l: any) => l.s === s).reduce((a: number, l: any) => a + serieLinha(l)[t], 0));
  const saidaS = (s: string) => (s === 'K6.3' ? (conta === 'fin' ? av.saidaFin : av.saida.reduce((a: number, x: any) => a + x.ecoVP, 0) - av.vr) : 0);
  const totS = (s: string) => av.linhas.filter((l: any) => l.s === s).reduce((a: number, l: any) => a + totL(l), 0) + saidaS(s);
  const total = (ARVORE as any[]).reduce((a, [, , ss]) => a + ss.reduce((b: number, [s]: [string]) => b + totS(s), 0), 0);
  const den = ind.usuariosAno;
  const pu = (v: number) => (den ? v / den : null);
  const pc = (v: number) => (total ? v / total : 0);
  const out: LinhaArvore[] = [];
  (ARVORE as any[]).forEach(([k, nk, ss]) => {
    const sk = T.map((t) => ss.reduce((a: number, [s]: [string]) => a + serieS(s)[t], 0));
    const tk = ss.reduce((a: number, [s]: [string]) => a + totS(s), 0);
    const ab = !!abertos[k];
    out.push({ id: k, nivel: 0, rotulo: k + ' ' + tr(nk), k, serie: sk, total: tk, porUsuario: pu(tk), pct: pc(tk), expansivel: true, aberto: ab });
    if (!ab) return;
    ss.forEach(([s, ns]: [string, string]) => {
      const ls = av.linhas.filter((l: any) => l.s === s);
      const temS = ls.length > 0 || (s === 'K6.3' && av.saida.length > 0);
      const abS = !!abertos[s];
      const ts = totS(s);
      out.push({ id: s, nivel: 1, rotulo: s + ' ' + tr(ns), k, serie: serieS(s), total: ts, porUsuario: pu(ts), pct: pc(ts), expansivel: temS, aberto: abS && temS });
      if (!abS || !temS) return;
      ls.forEach((l: any, i: number) => {
        const tags = [tr(({ D: 'desembolso', C: 'capacidade', O: 'cedido' } as Record<string, string>)[l.nat] || 'desembolso')];
        if (l.moeda === 'USD') tags.push('US$');
        if (l.orc === 'capital') tags.push(tr('capital'));
        if (l.comp === 'V' || l.tag === 'gpu') tags.push(tr('variável'));
        const v = totL(l);
        out.push({ id: s + ':' + i, nivel: 2, rotulo: tr(l.nome), k, serie: serieLinha(l), total: v, porUsuario: pu(v), pct: null, expansivel: false, aberto: false, tags, unidade: l.un ? tr(l.un) : '' });
      });
      if (s === 'K6.3') av.saida.forEach((x: any, i: number) => {
        const v = conta === 'fin' ? (x.nat === 'D' ? x.valor : 0) : x.ecoVP;
        out.push({ id: 'saida:' + i, nivel: 2, rotulo: tr(x.nome), k, serie: T.map((_, j) => (j === T.length - 1 ? v : 0)), total: v, porUsuario: pu(v), pct: null, expansivel: false, aberto: false, tags: [tr('fim do horizonte')] });
      });
    });
  });
  const totAno = T.map((t) => (ARVORE as any[]).reduce((a, [, , ss]) => a + ss.reduce((b: number, [s]: [string]) => b + serieS(s)[t], 0), 0));
  return { linhas: out, total: { id: 'total', nivel: 0, rotulo: '', k: '', serie: totAno, total, porUsuario: pu(total), pct: 1, expansivel: false, aberto: false } };
}
/** abrir tudo: todos os componentes e subcomponentes */
export function todosAbertos(): Record<string, boolean> {
  const o: Record<string, boolean> = {};
  (ARVORE as any[]).forEach(([k, , ss]) => { o[k] = true; ss.forEach(([s]: [string]) => { o[s] = true; }); });
  return o;
}

// ----------------------------------------------------------- as contas de cada ano (CUS-19)
/** abas Ano 0…H e Saída de explicacaoCusto(cfg); cada aba traz as linhas que cobrem 90% do ano e "Outros itens (N)" */
export function contasPorAno(cfg: any): { abas: { id: string; rotulo: string }[]; anos: any[]; formula: any } | null {
  const ex: any = explicacaoCusto(cfgPronta(cfg));
  if (!ex) return null;
  return { abas: ex.anos.map((a: any) => ({ id: String(a.id), rotulo: a.rotulo })), anos: ex.anos, formula: ex.formula };
}

// ----------------------------------------------------------- cenários (CUS-14)
export function cenariosTabela(cs: Record<string, any>, cfg: any) {
  return Object.keys(cs).map((k) => {
    const a = avaliar(cs[k]);
    const o = orcamentoDeLinhas(a, cfg);
    return { nome: k, r: cs[k], av: a, orc: o, ind: indicadores(cs[k].cfg, a) };
  });
}
export function legendaCenarios(cfg: any): string {
  const arq = arquitetura(cfg);
  const alta = tr('Alta adoção: adoção ×1,5 (até 90%)') + (arq !== 'saas' ? ' ' + tr('e 20% mais sessões') : '') + '.';
  const est = arq === 'saas' ? tr('reajuste de 10% a.a., câmbio 25% mais caro e mais horas de formação')
    : arq === 'api' ? tr('contexto e saída 50% maiores, mais chamadas por interação, preços e câmbio 25% maiores')
      : tr('respostas 50% mais longas, vazão 25% menor, preços e câmbio 25% maiores');
  return alta + ' ' + tr('Estresse: alta adoção com') + ' ' + est + '.';
}

// ----------------------------------------------------------- alternativas (CUS-24)
/** porte de cfgAlternativa (custos_ui.js): a alternativa sem IA montada na mesma árvore, com a demanda do caso */
export function cfgAlternativa(a: { nome: string; impl: any; anual: any; fte: any }, base: any): any {
  const H = opcoes(base).H;
  return {
    nome: a.nome, demanda: clone(base.demanda), opc: Object.assign({}, base.opc || {}),
    implantacao: +a.impl ? [{ nome: 'Implantação da alternativa', valor: +a.impl, manutPct: 0, s: 'K3.1' }] : [],
    itens: [{ nome: 'Custo anual da alternativa', s: 'K4.1', v: Array.from({ length: H + 1 }, (_, t) => (t === 0 ? 0 : +a.anual || 0)) }],
    pessoas: +a.fte ? [{ nome: 'Equipe interna da alternativa', s: 'K4.1', nat: 'C', partes: [['gestor_produto', Array.from({ length: H + 1 }, (_, t) => (t === 0 ? 0 : +a.fte))]] }] : [],
    saida: {},
  };
}
/** lista para comparar(): o caso (ou o exemplo) e as alternativas, com a referência escolhida na frente */
export function listaComparacao(nomeCaso: string, cfg: any, alts: any[], efeitoCaso: any, refAlt: number | null) {
  const lista = [{ nome: nomeCaso, cfg, efeito: efeitoCaso }].concat(alts.map((a) => ({ nome: a.nome, cfg: cfgAlternativa(a, cfg), efeito: a.efeito })));
  const iRef = lista.length > 1 && refAlt != null ? Math.min(refAlt + 1, lista.length - 1) : 0;
  return [lista[iRef]].concat(lista.filter((_, i) => i !== iRef));
}

// ----------------------------------------------------------- linhas novas (CUS-04)
const zeros = (H: number, f: (t: number) => number = () => 0) => Array.from({ length: H + 1 }, (_, t) => f(t));
export const novaLinha = {
  item: (H: number) => ({ cat: 'Outros', s: 'K4.1', nome: tr('Novo item'), nat: 'D', moeda: 'LOC', v: zeros(H) }),
  base: (H: number) => ({ cat: 'Condições de base', s: 'K1.1', nome: tr('Ampliação de conectividade atribuível ao caso'), moeda: 'LOC', v: zeros(H) }),
  pessoa: (H: number) => ({ cat: 'Pessoas', s: 'K4.1', nome: tr('Nova atividade'), nat: 'C', partes: [['gestor_produto', zeros(H, (t) => (t ? 0.1 : 0))]] }),
  saida: () => ({ nome: tr('Novo custo de saída'), valor: 0 }),
  mensal: () => ({ cat: 'Infraestrutura', s: 'K2.5', nome: tr('Novo serviço mensal'), valor: 0, mesesY0: 0, fx: true }),
  alternativa: () => ({ nome: tr('Status quo (sem IA)'), impl: 0, anual: 0, fte: 0, efeito: '' as const }),
};
export const subDe = (x: any, padrao: string) => x.s || (MAPA_CAT as any)[x.cat] || padrao;

/** opções do seletor de subcomponente: grupos K1…K6 */
export function gruposSub(): { k: string; nome: string; subs: { s: string; nome: string }[] }[] {
  return (ARVORE as any[]).map(([k, n, ss]) => ({ k, nome: k + ' ' + tr(n), subs: ss.map(([s, ns]: [string, string]) => ({ s, nome: s + ' ' + tr(ns) })) }));
}
export const nomeK = (k: string) => k + ' ' + tr((NOME_K as any)[k] || '');
export const nomeS = (s: string) => s + ' ' + tr((NOME_S as any)[s] || '');

// ----------------------------------------------------------- moeda (CUS-07/08)
export const MOEDAS_PRINCIPAIS = ['USD', 'EUR', 'BRL', 'GBP', 'JPY', 'CNY', 'INR', 'MXN', 'ARS', 'ZAR'];
/** as principais no topo e as demais por nome no idioma (Intl.DisplayNames) */
export function listaMoedas(): { principais: string[]; demais: string[] } {
  const tab = getTabelaMoedas();
  const todos = Object.keys((tab.taxas || {}) as Record<string, number>);
  const loc = String(LOC());
  const demais = todos.filter((c) => !MOEDAS_PRINCIPAIS.includes(c)).sort((a, b) => String(nomeMoeda(a)).localeCompare(String(nomeMoeda(b)), loc));
  return { principais: MOEDAS_PRINCIPAIS.filter((c) => c === 'USD' || todos.includes(c)), demais };
}
export function taxaReferencia(cod: string): number | null {
  const v = ((getTabelaMoedas().taxas || {}) as Record<string, number>)[cod];
  return typeof v === 'number' && v > 0 ? v : null;
}

// ----------------------------------------------------------- CSV de custos (CUS-22)
// Insumo × ano (nominal) e total econômico, na moeda escolhida, com o separador decimal do idioma e ";" entre
// campos; BOM para o Excel. Porte de csvCustos (custos_ui.js), que só exportava US$ com vírgula.
export function csvCustosMoeda(cfg0: any): string {
  const cfg = cfgPronta(cfg0);
  const r = calcular(cfg), av = avaliar(r), T: number[] = r.anos;
  const m = moedaInfo();
  const dec = sepNum().decimal || '.';
  const q = (s: any) => '"' + String(tr(s ?? '')).replace(/"/g, '""') + '"';
  const nf = (v: number) => (v * m.f).toFixed(2).replace('.', dec);
  const cab = ['Componente', 'Subcomponente', 'Insumo', 'Natureza', 'Comportamento', 'Moeda', 'Classificação orçamentária', 'Unidade'].map((x) => q(x))
    .concat(T.map((t) => q(tr('Ano ' + t) + ' (' + tr('nominal') + ', ' + m.cod + ')')))
    .concat([q(tr('Total econômico') + ' (' + m.cod + ', ' + tr('preços constantes do Ano 0') + ')')]);
  const L = [cab.join(';')];
  const nat = (n: string) => tr(({ D: 'desembolso', C: 'capacidade', O: 'cedido' } as Record<string, string>)[n] || n);
  av.linhas.forEach((l: any) => L.push([l.k, l.s, q(l.nome), q(nat(l.nat)), l.comp, l.moeda, l.orc, q(l.un), ...l.v.map(nf), nf(l.ecoVP)].join(';')));
  av.saida.forEach((x: any) => L.push(['K6', 'K6.3', q(x.nome), q(nat(x.nat)), q(tr('contingente')), x.moeda, 'corrente', '', ...T.map((_, i) => (i === T.length - 1 ? nf(x.valor) : '')), nf(x.ecoVP)].join(';')));
  return '﻿' + L.join('\n');
}

// ----------------------------------------------------------- foco ("de onde vem?" → Ajustar premissas)
// O foco é o caminho de um campo da cfg ('demanda.adocao', 'saas.preco', 'opc.pi', 'itens.2') ou o id de uma
// seção ('demanda', 'tempo', 'insumos', 'arvore', 'orcamento', 'contas', 'arquitetura', 'licenca', 'cenarios',
// 'tornado', 'montecarlo', 'indicadores') ou de um KPI do plano ('kpi.total'…).
const FOCO_KPI: Record<string, string> = { 'kpi.ano0': 'contas', 'kpi.anual': 'orcamento', 'kpi.total': 'contas', 'kpi.porAluno': 'indicadores' };
export function focoNormal(foco?: string): string | undefined {
  if (!foco) return undefined;
  const f = decodeURIComponent(foco);
  return FOCO_KPI[f] || f;
}
export function abaDoFoco(foco?: string): AbaRefinar | null {
  const f = focoNormal(foco);
  if (!f) return null;
  const raiz = f.split('.')[0];
  if (['saas', 'api', 'rag', 'ow', 'ferramentas', 'arquitetura', 'licenca', 'arquiteturas', 'comparaAPI'].includes(raiz)) return 'ferramentas';
  if (['cenarios', 'tornado', 'faixas', 'montecarlo', 'indicadores', 'alternativas', 'equidade', 'avancado-analises'].includes(raiz)) return 'cenarios';
  return 'premissas';
}
/** ids candidatos para rolar até o foco: o caminho inteiro e os prefixos ('demanda.adocao.1' → 'demanda.adocao' → 'demanda') */
export function candidatosFoco(foco?: string): string[] {
  const f = focoNormal(foco);
  if (!f) return [];
  const ks = f.split('.');
  return ks.map((_, i) => 'rf-' + ks.slice(0, ks.length - i).join('.'));
}
