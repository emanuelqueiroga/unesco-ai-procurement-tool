import { beforeEach, describe, expect, it } from 'vitest';
import { useCaso, telasAtivas, proximaTela } from '../../src/store';
import { PRIORIDADES, problemasMarcados, sugestoesProblemas, setLang } from '../../src/domain';
const S = () => useCaso.getState();
beforeEach(() => { setLang('pt'); S().carregarExemplo('novo'); });
describe('v015: opções de educar sobre a IA, catálogo de letramento', () => {
  it('aceita as seis opções juntas e preserva seleção, notas e posição no JSON', () => {
    const sobre: any = PRIORIDADES.find((p: any) => p.id === 'sobre');
    const ids = sobre.problemas.filter((q: any) => q.v015).map((q: any) => q.id);
    S().escolherPais('BRA'); S().responder('prioridades', ['sobre']);
    S().responder('problemas', ids); S().refinar('problemaOutro', 'Informação adicional do caso');
    S().irPara(1, 'problemas');
    const json = JSON.stringify(S().exportar()); S().carregarExemplo('novo'); S().importar(json);
    expect(ids).toHaveLength(6); expect(S().ctx.problemas).toEqual(ids);
    expect(problemasMarcados(S().ctx).map((q: any) => q.id)).toEqual(ids);
    expect(S().ctx.problemaOutro).toBe('Informação adicional do caso');
    expect(S().capitulo.pergunta).toBe('problemas');
    expect(S().caso.tarefas).toEqual([]);
    expect(sugestoesProblemas(S().ctx).formacao).toBe(true);
  });
  it('não reinterpreta desafios antigos como os novos públicos', () => {
    S().responder('prioridades', ['sobre']); S().responder('problemas', ['A1', 'A7', 'A10']);
    const antes = problemasMarcados(S().ctx).map((q: any) => [q.id, q.t]);
    S().importar(JSON.stringify(S().exportar()));
    expect(problemasMarcados(S().ctx).map((q: any) => [q.id, q.t])).toEqual(antes);
    expect(antes[0][1]).toContain('Estudantes usam ferramentas');
    expect(antes.every(([id]: string[]) => ['A1', 'A7', 'A10'].includes(id))).toBe(true);
  });
  it('usa o novo percurso de letramento e mantém governança como frente inicial na combinação', () => {
    S().responder('prioridades', ['sobre']); S().irPara(1, 'prioridades');
    expect(telasAtivas(S())).toHaveLength(10); expect(proximaTela(S())?.id).toBe('problemas');
    S().responder('problemas', ['A11', 'A16']);
    S().responder('prioridades', ['governar', 'sobre']); S().responder('problemas', ['A11', 'A16', 'G11']);
    expect(telasAtivas(S()).some(t => t.id === 'gov-projeto')).toBe(false);
    expect(problemasMarcados(S().ctx).map((q: any) => q.id)).toEqual(['G11', 'A11', 'A16']);
    S().responder('prioridades', ['sobre']);
    expect(problemasMarcados(S().ctx).map((q: any) => q.id)).toEqual(['A11', 'A16']);
  });
});
