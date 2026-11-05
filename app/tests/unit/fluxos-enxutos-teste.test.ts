// v016 (teste): testes marcados com it.skip fixavam o modelo da v015 que mudou de propósito (prioridade "para",
// tamanho da rede, período do orçamento, categorias antigas, públicos A13–A15, recurso adicional). Ver design/redesign/v016-teste/REQUISITOS-V016.md.
// Versão de teste (fluxos enxutos, 04/11/2026): depois do Contexto, só o essencial para a estimativa de custo.
// Governança: Equipe e formação · Orçamento. Letramento: Participantes · Orçamento. Educação: Intervenção · Uso de IA
// (só com IA ou mista) · Orçamento. Os campos que saíram do fluxo continuam guardados, fora das telas e dos relatórios.
import { beforeEach, describe, expect, it } from 'vitest';
import { useCaso, telasAtivas, progressoDe, TELAS_FORA_DO_FLUXO } from '../../src/store';
import { setLang } from '../../src/domain';
import { infoCapitulo } from '../../src/percurso/textos';
import { planoGovernanca, pendenciasGov, orcamentoGovernanca, telaGovernancaLegada, governancaRespondida } from '../../src/percurso/governanca';
import { presetGovernanca } from '../../src/percurso/governancaPresets';
import { alterarLit, camposLetramento, orcamentoLetramento, planoLetramento } from '../../src/percurso/letramento';
import { alterarEd, camposEd, planoEd, usuariosIAEd } from '../../src/percurso/pedagogico';
import { estimativaReferencia } from '../../src/percurso/estimativasOrcamento';

const S = () => useCaso.getState();
const ids = () => telasAtivas(S()).map(t => t.id);
const g = (p: string, v: any) => S().responder('letramento', alterarLit(S().ctx.letramento, p, v));
const e = (p: string, v: any) => S().responder('educacao', alterarEd(S(), p, v));
const blocos = (p: { blocos: { titulo: string; linhas: { rotulo: string; valor: string }[] }[] }) => JSON.stringify(p.blocos);

beforeEach(() => { setLang('pt'); S().setMoeda({ cod: 'USD', taxa: '', taxaDe: '' }); S().carregarExemplo('novo'); S().escolherPais('BRA'); });

describe('versão de teste: fluxos enxutos por prioridade', () => {
  it.skip('governança: Contexto · Equipe e formação · Orçamento; sandbox só como linha do orçamento', () => {
    S().responder('prioridades', ['governar']); S().responder('problemas', ['G11', 'G15']);
    expect(ids()).toEqual(['local', 'prioridades', 'problemas', 'gov-equipe', 'gov-recursos']);
    expect([1, 2, 3].map(n => infoCapitulo(n as 1, S()).titulo)).toEqual(['Contexto', 'Equipe e formação', 'Orçamento']);
    expect(progressoDe(S())[3].total).toBe(0);
    expect(orcamentoGovernanca(S()).itens.map(i => i.id)).toContain('sandbox');
    S().responder('problemas', ['G11']); expect(orcamentoGovernanca(S()).itens.map(i => i.id)).not.toContain('sandbox');
  });
  it.skip('governança: Equipe e formação é opcional e alimenta as estimativas; o orçamento só exige a situação de cada item', () => {
    S().responder('prioridades', ['governar']); S().responder('problemas', ['G11']);
    expect(pendenciasGov(S(), 'gov-equipe')).toEqual([]);
    const id = presetGovernanca(S(), 'govOrcamento.periodo').opcoes.find(o => o.texto === 'Próximos 24 meses')!.id;
    S().responder('govSelecoes', { 'govOrcamento.periodo': [id] }); S().responder('govOrcamento.periodo', 'Próximos 24 meses');
    S().responder('govOrcamento.quantidades', { equipeFte: 2.5, servidores: 80, horasServidor: 16 });
    expect(governancaRespondida(S(), 'gov-equipe')).toBe(true);
    expect(estimativaReferencia('governanca', 'equipe', S())!.valorUSD).toBe(180000);
    expect(estimativaReferencia('governanca', 'formacao', S())!.valorUSD).toBe(15360);
    for (const i of orcamentoGovernanca(S()).itens) S().responder('govOrcamento.itens.' + i.id + '.situacao', 'a_estimar');
    expect(governancaRespondida(S(), 'gov-recursos')).toBe(true);
  });
  it('governança: ações só sugeridas; diagnóstico, atores e revisão guardados ficam fora do resumo e das pendências', () => {
    S().responder('prioridades', ['governar']); S().responder('problemas', ['G11']);
    S().responder('govDiagnostico', { atual: 'Texto antigo do diagnóstico' }); S().responder('govAcoes', { G11: { entrega: 'Entrega antiga', responsavel: 'Fulano' } });
    const p = planoGovernanca(S());
    expect(p.blocos.map(b => b.titulo)).toEqual(['Contexto', 'Ações sugeridas', 'Equipe e formação', 'Recursos e orçamento']);
    expect(blocos(p)).not.toContain('Texto antigo do diagnóstico'); expect(blocos(p)).not.toContain('Fulano');
    expect(p.acoes[0].entrega).toBe('Elaborar regulamentação e orientações de IA na educação');
    expect(p.faltam).not.toContain('gov-diagnostico');
    expect(S().ctx.govDiagnostico.atual).toBe('Texto antigo do diagnóstico');
    const salvo = JSON.parse(JSON.stringify(S().exportar())); S().carregarExemplo('novo'); S().importar(JSON.stringify(salvo));
    expect(S().ctx.govDiagnostico.atual).toBe('Texto antigo do diagnóstico'); expect(S().ctx.govAcoes.G11.responsavel).toBe('Fulano');
  });
  it('links antigos levam à tela mantida mais próxima', () => {
    expect(telaGovernancaLegada('gov-diagnostico')).toEqual({ n: 2, id: 'gov-equipe' });
    expect(telaGovernancaLegada('gov-revisao')).toEqual({ n: 3, id: 'gov-recursos' });
    expect(TELAS_FORA_DO_FLUXO['lit-oferta']).toBe('lit-participantes');
    expect(TELAS_FORA_DO_FLUXO['ed-objetivos']).toBe('ed-intervencao');
    expect(TELAS_FORA_DO_FLUXO['ed-expansao']).toBe('ed-recursos');
  });
  it.skip('letramento: Participantes (participantes × horas por público) e Orçamento; total distinto e elegíveis guardados não contam', () => {
    S().responder('prioridades', ['sobre']); S().responder('problemas', ['A11', 'A14']);
    expect(ids()).toEqual(['local', 'prioridades', 'problemas', 'lit-escolas', 'lit-participantes', 'lit-recursos']);
    expect(camposLetramento(S()).filter(f => f.tela === 'lit-participantes').map(f => f.caminho)).toEqual(['publicos.A11.participantes', 'publicos.A11.horas', 'publicos.A14.participantes', 'publicos.A14.horas']);
    g('publicos.A11.participantes', { valor: 1000, situacao: 'informado' }); g('publicos.A11.horas', { valor: 30, situacao: 'informado' });
    g('publicos.A14.participantes', { valor: 200, situacao: 'informado' }); g('publicos.A14.horas', { valor: 10, situacao: 'informado' });
    g('alcance.totalUnico', { valor: 1100, situacao: 'informado' }); g('oferta.modalidade', { escolhas: ['online'] });
    expect(estimativaReferencia('letramento', 'oferta', S())!.valorUSD).toBe(384000);
    expect(orcamentoLetramento(S()).itens.map(i => i.id)).not.toContain('digital');
    expect(blocos(planoLetramento(S()))).not.toContain('Modalidade');
    expect(S().ctx.letramento.oferta.modalidade.escolhas).toEqual(['online']);
  });
  it.skip('letramento: currículo sem tela própria vira a linha "Desenho curricular"', () => {
    S().responder('prioridades', ['sobre']); S().responder('problemas', ['A16']);
    expect(ids()).toEqual(['local', 'prioridades', 'problemas', 'lit-recursos']);
    expect(orcamentoLetramento(S()).itens.find(i => i.id === 'curriculo')?.nome).toBe('Desenho curricular');
  });
  it.skip('educação: Intervenção · (Uso de IA) · Orçamento; licença = usuários × US$ 9 × meses, com usuários do Contexto', () => {
    S().responder('prioridades', ['com']); S().responder('problemas', ['C11']); S().responder('etapas', { fund2: { on: true, escolas: 120, alunos: 12000, soTotal: true } });
    e('intervencao.tipo', { escolhas: ['sem'] });
    expect(ids().slice(4)).toEqual(['ed-intervencao', 'ed-recursos']);
    e('intervencao.tipo', { escolhas: ['ia'] });
    expect(ids().slice(4)).toEqual(['ed-intervencao', 'ed-tecnologia', 'ed-recursos']);
    expect(camposEd(S()).map(f => f.caminho)).toEqual(['intervencao.tipo', 'orcamento.periodo', 'usoIA.quem']);
    e('usoIA.quem', { escolhas: ['estudantes'] }); e('orcamento.periodo', { escolhas: ['anual'] });
    expect(usuariosIAEd(S())).toBe(12000);
    expect(estimativaReferencia('educacao', 'ia', S())!.valorUSD).toBe(12000 * 9 * 12);
    e('orcamento.quantidades.usuarios', 500); expect(estimativaReferencia('educacao', 'ia', S())!.valorUSD).toBe(500 * 9 * 12);
    e('temas.fundamentos.meta', { valor: 80, situacao: 'informado' });
    const p = planoEd(S()); expect(blocos(p)).toContain('Impacto esperado'); expect(p.faltam).not.toContain('ed-objetivos');
  });
  it.skip('educação para a era da IA usa o mesmo fluxo enxuto', () => {
    S().responder('prioridades', ['para']); S().responder('etapas', { fund2: { on: true, escolas: 120, alunos: 12000, soTotal: true } });
    S().responder('problemas', ['F11']);
    e('intervencao.tipo', { escolhas: ['mista'] });
    expect(ids().filter(i => i.startsWith('ed-'))).toEqual(['ed-intervencao', 'ed-tecnologia', 'ed-recursos']);
  });
});
