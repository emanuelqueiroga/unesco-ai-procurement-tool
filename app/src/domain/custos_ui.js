// =====================================================================
// Aba de custos — versão 2 (árvore de custos, duas contas, índices)
// Parte pura de src/custos_ui.js (reimplementação): formatação de moeda e números, opções padrão e CSV.
// A calculadora completa (renderCustos, gráficos, eventos) é redesenhada como a tela Refinar.
// A global MOEDAS (moedas.json injetado no build) virou estado de módulo (setTabelaMoedas);
// S.moeda é lido de getMoeda() (i18n.js); csvCustos recebe a cfg em vez de ler cfgAtual().
// =====================================================================
import { LOC, magnitudes, unidMilDe, tr, lerNumero, getMoeda } from './i18n.js';
import { OPC_PADRAO, calcular, avaliar } from './custos.js';

// ----------------------------------------------------------- moedas
// MOEDAS: taxas de referência por US$ (data/moedas.json), informadas pela aplicação com setTabelaMoedas
let MOEDAS = { fonte: '', data: '', taxas: { USD: 1 } };
function setTabelaMoedas(m) { MOEDAS = m && m.taxas ? m : { fonte: '', data: '', taxas: { USD: 1 } }; return MOEDAS; }
function getTabelaMoedas() { return MOEDAS; }
let NOMES_MOEDA = null;
function nomeMoeda(cod) {
  try { if (!NOMES_MOEDA) NOMES_MOEDA = new Intl.DisplayNames([LOC()], { type: 'currency' }); return NOMES_MOEDA.of(cod) || cod; } catch (e) { return cod; }
}
function moedaInfo() {
  const moeda = getMoeda();   // antes S.moeda (global)
  const cod = (moeda && moeda.cod) || 'USD';
  const ov = (moeda && moeda.taxaDe === cod) ? +lerNumero(moeda.taxa) : NaN;
  const f = ov > 0 ? ov : (MOEDAS.taxas[cod] || 1);
  let pre = cod;
  try { pre = new Intl.NumberFormat(LOC(), { style: 'currency', currency: cod, currencyDisplay: 'narrowSymbol' }).formatToParts(0).find(p => p.type === 'currency').value; } catch (e) { }
  if (cod === 'USD') pre = 'US$';
  return { cod, pre, f, ov: ov > 0 };
}
function din(x, dec) {
  const m = moedaInfo(); const v = x * m.f;
  if (dec == null) dec = Math.abs(v) >= 100 ? 0 : 2;
  if (Math.abs(v) > 0 && Math.abs(v) < 0.1 && dec < 3) dec = 3;
  return m.pre + ' ' + v.toLocaleString(LOC(), { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function mil(x, dec = 1) { const m = moedaInfo(); return (x * m.f / 1000).toLocaleString(LOC(), { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
// valor abreviado com a magnitude do idioma (MAGNITUDES, i18n.js): PT "US$ 162 mil", EN "US$ 162 k", ES "US$ 162 mil", FR "US$ 162 k"
function grande(x) {
  const m = moedaInfo(); const v = x * m.f;
  const [k, M, B] = typeof magnitudes === 'function' ? magnitudes() : ['mil', 'mi', 'bi'];
  const f = (d, n, u) => m.pre + ' ' + (v / d).toLocaleString(LOC(), { maximumFractionDigits: n }) + ' ' + u;
  if (Math.abs(v) >= 1e9) return f(1e9, 2, B);
  if (Math.abs(v) >= 1e6) return f(1e6, 2, M);
  return f(1e3, 1, k);
}
const pct = (x, d = 0) => (100 * (x || 0)).toLocaleString(LOC(), { maximumFractionDigits: d, minimumFractionDigits: d }) + '%';
// unidade das tabelas em milhares: PT "USD mil", EN "USD thousand", ES "miles de USD", FR "milliers de USD"
function unidMil() { const cod = moedaInfo().cod; return typeof unidMilDe === 'function' ? unidMilDe(cod) : cod + ' mil'; }

// ----------------------------------------------------------- estado
function estadoCusto(estado) {
  estado.custo = Object.assign({ base: 'caso', cfg: null, editado: false, conta: 'eco', avancado: false, abertos: {}, alts: [], lambda: '',
    estratos: [{ nome: 'Escolas urbanas com infraestrutura', part: 0.6, fK1: 1, fK4: 1 }, { nome: 'Escolas rurais', part: 0.3, fK1: 1.5, fK4: 1.4 }, { nome: 'Escolas de difícil acesso', part: 0.1, fK1: 2.5, fK4: 1.8 }] }, estado.custo || {});
  return estado.custo;
}
function garantirOpc(cfg) { cfg.opc = Object.assign({}, OPC_PADRAO, cfg.opc || {}); return cfg.opc; }

// ----------------------------------------------------------- CSV (cfg já montada; antes lia cfgAtual())
function csvCustos(cfg) {
  garantirOpc(cfg);
  const r = calcular(cfg), av = avaliar(r), T = r.anos;
  const q = s => '"' + String(tr(s)).replace(/"/g, '""') + '"';
  const nf = v => v.toFixed(2).replace('.', ',');
  const L = [['Componente', 'Subcomponente', 'Insumo', 'Natureza', 'Comportamento', 'Moeda', 'Classificação orçamentária', 'Unidade'].map(tr).join(';') + ';' + T.map(t => tr('Ano ' + t + ' (nominal US$)')).join(';') + ';' + tr('Total econômico (US$ constantes)')];
  av.linhas.forEach(l => L.push([l.k, l.s, q(l.nome), tr({ D: 'desembolso', C: 'capacidade', O: 'cedido' }[l.nat]), l.comp, l.moeda, l.orc, q(l.un), ...l.v.map(nf), nf(l.ecoVP)].join(';')));
  av.saida.forEach(x => L.push(['K6', 'K6.3', q(x.nome), tr({ D: 'desembolso', C: 'capacidade' }[x.nat] || x.nat), tr('contingente'), x.moeda, 'corrente', '', ...T.map((t, i) => i === T.length - 1 ? nf(x.valor) : ''), nf(x.ecoVP)].join(';')));
  return '﻿' + L.join('\n');
}

export { setTabelaMoedas, getTabelaMoedas, nomeMoeda, moedaInfo, din, mil, grande, pct, unidMil, estadoCusto, garantirOpc, csvCustos };
