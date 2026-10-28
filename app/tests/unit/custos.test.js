// Testes do motor de custos v2 (porte de tests/test_custos_v2.js para o Vitest).
// 1) modo de compatibilidade reproduz os números publicados (v1, numeros_v1.json); 2) identidades contábeis; 3) propriedades.
// As 125 verificações do teste original estão mantidas, uma a uma (eq/chk → expect); o último teste confere a contagem.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as C from '../../src/domain/custos.js';

const N = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'numeros_v1.json'), 'utf8'));
let verificacoes = 0;
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= Math.max(1, Math.abs(b) * tol);
const eq = (n, a, b, tol) => { verificacoes++; expect(near(a, b, tol), `${n}: ${a} ≠ ${b}`).toBe(true); };
const chk = (n, c) => { verificacoes++; expect(!!c, n).toBe(true); };
const P = k => { const c = C.clone(C.PRESETS[k]); c.opc = C.OPC_COMPAT; return c; };

describe('1. compatibilidade com a versão publicada (modo compat)', () => {
  for (const k of ['A', 'B', 'C']) {
    it(`exemplo ${k}: TCO, totais por ano, cenários, sensibilidade, orçamento e conta econômica`, () => {
      const r = C.calcular(P(k)), s = C.resumo(r);
      eq(k + ' TCO v1', s.tco, N[k + '_tco']); [0, 1, 2, 3].forEach(t => eq(k + ' total ano ' + t, s.tot[t], N[k + '_tot'][t]));
      const cen = C.cenarios(P(k));
      for (const c of Object.keys(N.CEN[k])) { const rs = C.resumo(cen[c]); eq(k + ' ' + c + ' TCO', rs.tco, N.CEN[k][c].tco); eq(k + ' ' + c + ' ano 2', rs.tot[2], N.CEN[k][c].t2); }
      const sv = C.sensibilidade(P(k));
      for (const [nome, , hi] of N.SENS[k][1]) {
        const row = sv.rows.find(x => x.nome.slice(0, 12) === nome.replace('\\', '').slice(0, 12));
        expect(row, 'sens ausente ' + k + ' ' + nome).toBeTruthy();
        eq(k + ' sens ' + nome, row.hi, hi);
      }
      const o = C.orcamento(P(k)); [0, 1, 2, 3].forEach(t => eq(k + ' dotação ' + t, o.dot[t], N.ORC[k].dot[t])); eq(k + ' saída', o.saida, N.ORC[k].saida);
      eq(k + ' conta econômica = TCO (compat)', C.avaliar(r).ctEco, s.tco);
    });
  }
  it('saída detalhada de A, adoção de equilíbrio e comparação de arquiteturas de C', () => {
    eq('A saída detalhada', C.resumo(C.calcular(P('A'))).saida, N.A_saida);
    eq('adoção de equilíbrio', C.compLicenca(P('A')).aEq * 1000, N.a_eq * 1000);
    C.compArquiteturas(P('C')).rows.forEach((r, i) => eq('arquitetura ' + i, r.tot, N.ARQ[i][3]));
  });
});

describe('2. identidades e 3. propriedades, no modo padrão', () => {
  for (const k of ['A', 'B', 'C']) {
    it(`exemplo ${k}: identidades, horizonte, desconto, câmbio, Monte Carlo, LMDI e Laspeyres`, () => {
      const cfg = C.clone(C.PRESETS[k]), r = C.calcular(cfg), av = C.avaliar(r), ind = C.indicadores(cfg, av);
      eq(k + ' Σ componentes = total', Object.values(av.porK).reduce((a, b) => a + b, 0), av.ctEco);
      eq(k + ' Σ subcomponentes = total', Object.values(av.porS).reduce((a, b) => a + b, 0), av.ctEco);
      eq(k + ' econômico = desembolso + capacidade + cedido', av.fac.desembolso + av.fac.capacidade + av.fac.doado, av.ctEco);
      eq(k + ' Σ ICU dos componentes = ICU', Object.values(ind.icuK).reduce((a, b) => a + b, 0), ind.icu);
      const o = C.orcamento(cfg);
      chk(k + ' dotação = fixo + variável + reservas', o.dot.every((d, t) => near(d, o.fixo[t] + o.var[t] + o.reserva[t] + o.cont[t])));
      chk(k + ' capital + corrente = fixo + variável', o.fixo.every((f, t) => near(f + o.var[t], o.capital[t] + o.corrente[t])));
      const c5 = C.clone(cfg); c5.opc = { H: 5 }; chk(k + ' horizonte maior custa mais', C.avaliar(C.calcular(c5)).ctEco > av.ctEco);
      const cr = C.clone(cfg); cr.opc = { r: 0.035 }; chk(k + ' desconto reduz valor presente', C.avaliar(C.calcular(cr)).ctEco < av.ctEco);
      const cf = C.clone(cfg); cf.mult = { fx: 1.2 }; chk(k + ' câmbio mais caro não reduz custo', C.avaliar(C.calcular(cf)).ctEco >= av.ctEco);
      const cd = C.clone(cfg); cd.faixas = C.direcionadores(cfg).map(d => ({ id: d.id, min: 1, max: 1 }));
      const sd = C.simular(cd, 50, 1); chk(k + ' Monte Carlo degenerado = determinístico', near(sd.ct.p10, av.ctEco) && near(sd.ct.p90, av.ctEco));
      const s1 = C.simular(cfg, 300, 7), s2 = C.simular(cfg, 300, 7); chk(k + ' Monte Carlo reprodutível pela semente', s1.ct.p50 === s2.ct.p50);
      chk(k + ' P10 ≤ P50 ≤ P90', s1.ct.p10 <= s1.ct.p50 && s1.ct.p50 <= s1.ct.p90);
      const L = C.lmdi(cfg, 1, cfg, 2); if (L) eq(k + ' LMDI soma a variação', L.contrib.reduce((a, b) => a + b.efeito, 0), L.delta, 1e-9);
      const las = C.laspeyres(cfg); chk(k + ' Laspeyres base 100 no Ano 1', Math.abs(las[1] - 100) < 1e-9);
    });
  }
  it('custo-efetividade: B (mais barata), C (intermediária, mais efetiva), A (mais cara, menos efetiva que C) → A dominada por C', () => {
    const res = C.comparar([{ nome: 'B', cfg: C.PRESETS.B, efeito: 0.10 }, { nome: 'C', cfg: C.PRESETS.C, efeito: 0.20 }, { nome: 'A', cfg: C.PRESETS.A, efeito: 0.15 }]);
    const g = n => res.find(x => x.nome === n);
    chk('A dominada por C', g('A').dominada === true);
    chk('B e C não dominadas', g('B').dominada === false && g('C').dominada === false);
    eq('RCEI de C contra B', g('C').rcei, (g('C').ct - g('B').ct) / 0.10);
    chk('referência com diferença zero', g('B').dC === 0);
  });
  it('custo anual equivalente e equidade por estrato', () => {
    eq('custo anual equivalente sem desconto', C.cae(100, 0, 5), 20);
    chk('custo anual equivalente com desconto > sem desconto', C.cae(100, 0.035, 5) > 20);
    // equidade: estrato com fator 1 tem o mesmo ICU
    const eqd = C.equidade(C.PRESETS.B, [{ nome: 'x', part: 1, fK1: 1, fK4: 1 }, { nome: 'y', part: 0, fK1: 2, fK4: 2 }]);
    chk('equidade neutra', near(eqd[0].delta, 0)); chk('equidade com fatores > 1 custa mais', eqd[1].icu > eqd[0].icu);
  });
});

describe('contagem', () => {
  it('mantém as 125 verificações de tests/test_custos_v2.js', () => {
    expect(verificacoes).toBe(125);
  });
});
