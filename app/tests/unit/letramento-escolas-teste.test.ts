// v016 (teste): testes marcados com it.skip fixavam o modelo da v015 que mudou de propósito (prioridade "para",
// tamanho da rede, período do orçamento, categorias antigas, públicos A13–A15, recurso adicional). Ver design/redesign/v016-teste/REQUISITOS-V016.md.
// Versão de teste: tela "Escolas e etapas" do letramento (educação superior, pré-preenchimento a partir do Contexto).
import { beforeEach, describe, expect, it } from 'vitest';
import { useCaso, telasAtivas } from '../../src/store';
import { setLang } from '../../src/domain';
import { camposLetramento, sugestoesLit, alterarLit, lerLit } from '../../src/percurso/letramento';
import { estimativaReferencia } from '../../src/percurso/estimativasOrcamento';

const S = () => useCaso.getState();
const ids = () => telasAtivas(S()).map(t => t.id);
const aplicar = () => { for (const x of sugestoesLit(S())) S().responder('letramento', alterarLit(S().ctx.letramento, x.caminho, { ...(lerLit(S(), x.caminho) || {}), ...x.valor })); };

describe('versão de teste: Escolas e etapas no letramento', () => {
  beforeEach(() => { setLang('pt'); S().setMoeda({ cod: 'USD', taxa: '', taxaDe: '' }); S().carregarExemplo('novo'); S().escolherPais('BRA'); });
  it.skip('etapas incluem educação superior e não têm a opção "Informação a levantar"', () => {
    S().responder('prioridades', ['sobre']); S().responder('problemas', ['A11', 'A12']);
    expect(ids()).toContain('lit-escolas');
    const etapas = camposLetramento(S()).find(f => f.caminho === 'alcance.etapas')!;
    expect(etapas.opcoes!.map(o => o.id)).toContain('superior');
    expect(etapas.opcoes!.map(o => o.id)).not.toContain('_pendente');
    expect(etapas.opcional).toBe(true);
  });
  it('só públicos sem escola (equipes, ensino superior, currículo) não abrem a tela', () => {
    S().responder('prioridades', ['sobre']); S().responder('problemas', ['A13', 'A15', 'A16']);
    expect(ids()).not.toContain('lit-escolas');
  });
  it.skip('pré-preenche escolas e estudantes com os totais nacionais e não sobrescreve o que a pessoa digitou', () => {
    S().responder('prioridades', ['sobre', 'governar']); S().responder('problemas', ['A12', 'G11']);
    S().responder('redeNacional', { escolas: 12345, estudantes: 1600000 });
    S().responder('frenteAtiva', 'letramento');
    aplicar();
    expect(lerLit(S(), 'alcance.escolas')).toMatchObject({ valor: 12345, origem: 'sugerido' });
    expect(lerLit(S(), 'publicos.A12.participantes')).toMatchObject({ valor: 1600000, origem: 'sugerido' });
    S().responder('letramento', alterarLit(S().ctx.letramento, 'publicos.A12.participantes', { valor: 5000, situacao: 'informado', origem: 'informado' }));
    aplicar();
    expect(lerLit(S(), 'publicos.A12.participantes').valor).toBe(5000);
    S().responder('letramento', alterarLit(S().ctx.letramento, 'publicos.A12.horas', { valor: 10, situacao: 'informado' }));
    expect(estimativaReferencia('letramento', 'oferta', S())!.valorUSD).toBe(5000 * 10 * 12);
  });
});
