// REC-53 (decisão 5): nenhuma frase principal das recomendações cita lei, artigo, diretiva ou regulamento;
// os exemplos de norma ficam em `exemplosNorma`, recolhidos no plano.
import { describe, it, expect } from 'vitest';
import { useCaso } from '../../src/store';
import { resultadoRecomendacoes } from '../../src/domain';

const NORMA = /\b(Lei|art\.|Diretiva|Regulamento|LGPD|RGPD|GDPR|AI Act)\b/;
describe('REC-53: sem normas no texto principal', () => {
  for (const ex of ['A', 'B', 'C', 'D']) {
    it(`exemplo ${ex}`, () => {
      useCaso.getState().carregarExemplo(ex);
      const r: any = resultadoRecomendacoes(useCaso.getState().estado());
      const ruins: string[] = [];
      for (const it of r.recs) {
        const textos = [it.oque, it.razao, it.paraque, it.pronto, ...(it.como || [])].map((x: any) => typeof x === 'string' ? x : x && x.texto).filter(Boolean);
        textos.forEach((t: string) => { if (NORMA.test(t)) ruins.push(`${it.id}: ${t}`); });
      }
      expect(ruins).toEqual([]);
    });
  }
});
