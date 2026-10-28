// Catálogo de regras (pacote R2): ids únicos (REC-01), destino das 66 regras da v13 (REC-15), ids estáveis e saída
// independente da ordem do catálogo (seção 4.1, GOV-08), vista de compatibilidade e textos para a tradução.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { useCaso } from '../../src/store/caso';
import {
  setLang, setMoeda, setTabelaMoedas, REGRAS, REGRA_POR_ID, REGRAS_REC, mapaLegado, resultadoRecomendacoes, recomendacoesCaso, textosRegras,
  TEXTOS_REC_R2, PENDENCIAS_REC,
} from '../../src/domain';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
setTabelaMoedas(JSON.parse(fs.readFileSync(path.join(RAIZ, 'data', 'moedas.json'), 'utf8')));
function exemplo(k: string): any {
  setLang('pt');
  useCaso.getState().carregarExemplo(k);
  const e: any = useCaso.getState().estado();
  setMoeda(e.moeda);
  return e;
}

// as 66 entradas de REGRAS_REC da 0.1.0-alpha.5 (65 ids: `aberta-operacao` aparecia duas vezes)
const ANTIGAS = ['linha-base', 'linha-base-parcial', 'alternativa', 'formacao-plano', 'sem-ferramenta', 'metas-lacunas', 'linha-base-medida',
  'teste-recomendado', 'teste-rever', 'teste-piloto-possivel', 'teste-ambos', 'teste-ambos-contrato', 'ferramentas-levantar', 'ferramentas-interop',
  'ferramentas-sobrepostas', 'ferramentas-cotacao', 'tecnologia', 'gratis-adiados', 'gratis-fim', 'gratis-ativos', 'publica', 'termos',
  'licenca-indefinida', 'lic-usuario', 'lic-usuario-rever', 'lic-institucional', 'consumo-limites', 'consumo-monitorar', 'incluida', 'aberta-operacao',
  'sob-medida', 'integracao', 'internet-parcial', 'internet-nao', 'internet-teste', 'disp-nao', 'disp-parcial', 'disp-proprio', 'disp-compartilhado',
  'disp-renovar', 'formacao-pagador', 'formacao-contrato', 'formacao-parceiro', 'formacao-papeis', 'formacao-dados', 'formacao-horas',
  'formacao-continua', 'suporte-sla', 'suporte-divisao', 'suporte-dedicado', 'acomp-intensivo', 'acomp-reforcar', 'dados-acordo', 'dados-base-legal',
  'dados-impacto', 'supervisao', 'contestacao', 'criancas', 'etapas', 'implantacao-criterios', 'arquitetura-decidir', 'arquitetura-saas',
  'arquitetura-api', 'aberta-operacao', 'expansao-rapida', 'expansao-recorrente'];
const GOVERNANCA = ['g-comite', 'g-politica', 'g-legislacao', 'g-dados', 'g-etica', 'g-compras'];

// embaralhamento determinístico (Mulberry32)
function embaralhar<T>(L: T[], semente: number): T[] {
  let s = semente >>> 0;
  const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const out = L.slice();
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

describe('catálogo R-nn (REC-01, REC-15)', () => {
  it('REC-01: nenhum id repetido no catálogo', () => {
    const ids = (REGRAS as any[]).map(r => r.id);
    expect(ids.length).toBeGreaterThan(50);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach(id => expect(id).toMatch(/^R-\d{2,3}$/));
  });
  it('REC-15: as 66 regras da v13 e as 6 ações de governança têm destino (6.2 ou 6.3)', () => {
    expect(ANTIGAS.length).toBe(66);
    const m = mapaLegado() as Record<string, string[]>;
    const semDestino = ANTIGAS.concat(GOVERNANCA).filter(id => !(m[id] && m[id].length));
    expect(semDestino).toEqual([]);
    Object.values(m).flat().forEach(dest => {
      if (dest.startsWith('pendencia:')) expect((PENDENCIAS_REC as any[]).some(p => 'pendencia:' + p.id === dest)).toBe(true);
      else expect(REGRA_POR_ID[dest], dest).toBeTruthy();
    });
  });
  it('REC-15: destinos da seção 6 (amostra)', () => {
    const m = mapaLegado() as Record<string, string[]>;
    expect(m['gratis-fim']).toEqual(['R-57']);
    expect(m['gratis-ativos']).toEqual(['R-57']);
    expect(m['termos']).toEqual(['R-65']);
    expect(m['arquitetura-saas']).toEqual(['R-65']);
    expect(m['supervisao']).toEqual(['R-31']);
    expect(m['contestacao']).toEqual(['R-32']);
    expect(m['aberta-operacao']).toEqual(['R-77']);
    expect(m['lic-institucional']).toEqual(['R-61']);
    expect(m['ferramentas-cotacao']).toEqual(['R-58']);
    expect(m['licenca-indefinida']).toEqual(['pendencia:P-licenca']);
    expect(m['disp-proprio'].sort()).toEqual(['R-29', 'R-30']);
    expect(m['criancas'].sort()).toEqual(['R-28', 'R-34', 'R-36', 'R-37']);   // R-28: crianças afetadas e adultos usuários (o A)
    expect(m['dados-base-legal']).toEqual(['R-26']);
    expect(m['formacao-continua']).toEqual(['R-112']);
    expect(REGRA_POR_ID['R-112'].generica).toBe(true);
    // 6.2: as que continuam ficam com R-88 a R-112 (e R-06)
    ['R-06', 'R-88', 'R-89', 'R-90', 'R-91', 'R-92', 'R-93', 'R-94', 'R-95', 'R-96', 'R-97', 'R-98', 'R-99', 'R-100', 'R-101', 'R-102', 'R-103',
      'R-104', 'R-105', 'R-106', 'R-107', 'R-108', 'R-109', 'R-110', 'R-111', 'R-112'].forEach(id => expect(REGRA_POR_ID[id], id).toBeTruthy());
  });
  it('REC-15: gerar o B duas vezes dá os mesmos ids, e só ids R-nn', () => {
    const a = recomendacoesCaso(exemplo('B')).map((r: any) => r.id);
    const b = recomendacoesCaso(exemplo('B')).map((r: any) => r.id);
    expect(a).toEqual(b);
    a.forEach((id: string) => expect(id).toMatch(/^R-\d+$/));
  });
  it('embaralhar o catálogo não muda a saída (4.1, GOV-08)', () => {
    for (const k of ['A', 'B', 'C', 'D']) {
      const e = exemplo(k);
      const base = resultadoRecomendacoes(e).recs.map((r: any) => r.id + ':' + r.variante);
      [1, 7, 42].forEach(s => {
        const outra = resultadoRecomendacoes(e, embaralhar(REGRAS as any[], s)).recs.map((r: any) => r.id + ':' + r.variante);
        expect(outra, k + ' semente ' + s).toEqual(base);
      });
    }
  });
});

describe('compatibilidade e textos', () => {
  it('REGRAS_REC (store) tem uma entrada por campo de origem, sempre de uma regra do catálogo', () => {
    (REGRAS_REC as any[]).forEach(r => {
      expect(typeof r.campo).toBe('string');
      expect(REGRA_POR_ID[r.id]).toBeTruthy();
      expect(REGRA_POR_ID[r.id].campos).toContain(r.campo);
    });
  });
  it('a saída mantém os campos que as telas e o PDF usam', () => {
    const r: any = recomendacoesCaso(exemplo('B'))[0];
    ['id', 'quando', 'tipo', 'prioridade', 'texto', 'porque', 'ir'].forEach(c => expect(r[c], c).toBeDefined());
    expect(['antes_teste', 'antes_contratar', 'manter']).toContain(r.quando);
    expect(['alta', 'media']).toContain(r.prioridade);
    expect(r.porque).toHaveProperty('n');
    ['oque', 'razao', 'como', 'paraque', 'pronto', 'quem', 'marco', 'nivel', 'pacote', 'lente', 'origem', 'chaves', 'rotuloNivel', 'pontos', 'criterio']
      .forEach(c => expect(r[c], c).toBeDefined());
    expect(r.texto).toBe(r.oque);
  });
  it('textos do catálogo para a tradução (TEXTOS_REC_R2)', () => {
    const T = textosRegras();
    expect(T.length).toBeGreaterThan(200);
    expect(TEXTOS_REC_R2).toContain('(presumida: confirme na 3.2.1)');
    expect(TEXTOS_REC_R2).toContain('Proteção de dados (encarregado)');
  });
});
