import { beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { useCaso } from '../../src/store';
import { setLang, setDicionarios, getDicionarios } from '../../src/domain';
import { readFileSync } from 'node:fs';
import moedas from '../../../data/moedas.json';
import { orcamentoGovernanca, planoGovernanca, governancaRespondida, pendenciasGov } from '../../src/percurso/governanca';
import { presetGovernanca } from '../../src/percurso/governancaPresets';
import { alterarLit, orcamentoLetramento, planoLetramento } from '../../src/percurso/letramento';
import { alterarEd, orcamentoEd, planoEd, lerEd } from '../../src/percurso/pedagogico';
import { estimativaReferencia, linhasTotais, temBaseEstimativa, mesesPeriodo, taxaMoeda } from '../../src/percurso/estimativasOrcamento';
import { leituraSimples } from '../../src/plano/leituraSimples';
import { gerarGovernancaPDF } from '../../src/plano/pdf_governanca';
import { gerarEducacaoPDF } from '../../src/plano/pdf_educacao';
import { gerarLeituraSimplesPDF } from '../../src/plano/pdf_simples';

const S = () => useCaso.getState();
const BRL = (moedas as any).taxas.BRL as number;
const c = (v: number) => Math.round(v * 100) / 100;
const textoPDF = (doc: any) => (doc.internal as any).pages.flat().join(' ');
const salvarPDF = (nome: string, doc: any) => { const d = process.env.V015_EST_QA; if (d) { mkdirSync(d, { recursive: true }); writeFileSync(d + '/' + nome, Buffer.from(doc.output('arraybuffer'))); } };

// Governança
const periodoGov = (texto: string) => { const id = presetGovernanca(S(), 'govOrcamento.periodo').opcoes.find(o => o.texto === texto)!.id; S().responder('govSelecoes', { ...S().ctx.govSelecoes, 'govOrcamento.periodo': [id] }); S().responder('govOrcamento.periodo', texto); };
function governanca() { S().escolherPais('BRA'); S().responder('prioridades', ['governar']); S().responder('redeNacional', { escolas: 12345, estudantes: 1600000 }); S().responder('problemas', ['G11', 'G14']); }
// Letramento
const g = (p: string, v: any) => S().responder('letramento', alterarLit(S().ctx.letramento, p, v));
function letramento() { S().escolherPais('BRA'); S().responder('prioridades', ['sobre']); S().responder('problemas', ['A11', 'A14']); }
const publico = (id: string, participantes: number, horas: number) => { g(`publicos.${id}.participantes`, { valor: participantes, situacao: 'informado' }); g(`publicos.${id}.horas`, { valor: horas, situacao: 'informado' }); };
// Educação
const e = (p: string, v: any) => S().responder('educacao', alterarEd(S(), p, v));
function educacao() { S().escolherPais('BRA'); S().responder('prioridades', ['com']); S().responder('problemas', ['C11']); S().responder('etapas', { fund2: { on: true, escolas: 120, alunos: 12000, soTotal: true } }); e('intervencao.tipo', { escolhas: ['ia'] }); }

beforeEach(() => { setLang('pt'); S().setMoeda({ cod: 'USD', taxa: '', taxaDe: '' }); S().carregarExemplo('novo'); });

describe('v015: estimativas de referência nos orçamentos', () => {
  it('só as categorias com quantidade e parâmetro têm base; as demais continuam sem estimativa', () => {
    expect(['equipe', 'formacao', 'avaliacao'].every(id => temBaseEstimativa('governanca', id))).toBe(true);
    expect(['estudos', 'consulta', 'comunicacao', 'supervisao', 'sandbox'].some(id => temBaseEstimativa('governanca', id))).toBe(false);
    expect(['equipe', 'oferta', 'diagnostico'].every(id => temBaseEstimativa('letramento', id))).toBe(true);
    expect(['materiais', 'desenho', 'apoio', 'formadores', 'consulta', 'digital', 'validacao', 'adicional-1'].some(id => temBaseEstimativa('letramento', id))).toBe(false);
    expect(['materiais', 'participacao', 'digital', 'ia'].some(id => temBaseEstimativa('educacao', id))).toBe(false);
    governanca(); expect(estimativaReferencia('governanca', 'estudos', S())).toBeNull();
  });

  it('governança: equipe, formação institucional e avaliação com a conta completa e conversão de US$ para BRL', () => {
    governanca(); periodoGov('Próximos 24 meses');
    S().responder('govOrcamento.quantidades', { equipeFte: 2, servidores: 50, horasServidor: 20 });
    expect(mesesPeriodo('governanca', S())).toBe(24);
    const equipe = estimativaReferencia('governanca', 'equipe', S())!, formacao = estimativaReferencia('governanca', 'formacao', S())!, avaliacao = estimativaReferencia('governanca', 'avaliacao', S())!;
    expect(equipe.moeda).toBe('BRL');
    expect(equipe.valorUSD).toBe(144000); expect(equipe.valor).toBe(c(144000 * BRL));
    expect(formacao.valorUSD).toBe(12000); expect(formacao.valor).toBe(c(12000 * BRL));
    expect(avaliacao.valorUSD).toBe(50000); expect(avaliacao.valor).toBe(c(50000 * BRL));
    expect(equipe.conta.parametros[0]).toMatchObject({ id: 'sal.especialista_pedagogico', valor: 36000, grau: 'C', fonte: 'Convenção da ferramenta (v13), ilustrativa' });
    expect(formacao.conta.parametros[0]).toMatchObject({ id: 'formacao.custoHora.programa', valor: 12, moeda: 'USD', grau: 'C' });
    expect(avaliacao.conta.parametros[0]).toMatchObject({ id: 'gov.avaliacaoExterna.ano1', valor: 25000 });
    expect(equipe.conta.conversao).toMatchObject({ de: 'USD', para: 'BRL', taxa: BRL, manual: false });
    expect(equipe.conta.quantidades.map(q => q.valor)).toEqual([2, 24]);
    expect(equipe.conta.nota).toMatch(/grau C/);
    periodoGov('Próximos 12 meses'); expect(estimativaReferencia('governanca', 'avaliacao', S())!.valorUSD).toBe(25000);
  });

  it('nada é preenchido sem o clique; "referencia" recalcula ao vivo e o valor digitado prevalece', () => {
    governanca(); periodoGov('Próximos 12 meses'); S().responder('govOrcamento.quantidades.equipeFte', 1);
    let o = orcamentoGovernanca(S());
    expect(o.itens.find(i => i.id === 'equipe')!.estimativa!.valor).toBe(c(36000 * BRL));
    expect(o).toMatchObject({ informados: 0, estimados: 0, estimado: 0, subtotal: 0 });
    expect(governancaRespondida(S(), 'gov-recursos')).toBe(false);
    // "Usar esta estimativa": quarta situação
    S().responder('govOrcamento.itens.equipe', { situacao: 'informado', valor: 1000 });
    S().responder('govOrcamento.itens.equipe.situacao', 'referencia');
    o = orcamentoGovernanca(S());
    expect(o).toMatchObject({ informados: 0, estimados: 1, estimado: c(36000 * BRL), subtotal: 0 });
    expect(pendenciasGov(S(), 'gov-recursos').some(p => p.caminho === 'govOrcamento.itens.equipe')).toBe(false);
    S().responder('govOrcamento.quantidades.equipeFte', 3);
    expect(orcamentoGovernanca(S()).estimado).toBe(c(108000 * BRL));
    // Escolher outra situação desfaz; o valor digitado antes continua guardado e volta a valer.
    S().responder('govOrcamento.itens.equipe.situacao', 'informado');
    expect(orcamentoGovernanca(S())).toMatchObject({ informado: 1000, estimados: 0 });
    S().responder('govOrcamento.itens.equipe.situacao', 'a_estimar');
    expect(orcamentoGovernanca(S())).toMatchObject({ informados: 0, estimados: 0 });
  });

  it('sem período, quantidade ou taxa conhecida não estima e diz o que falta', () => {
    governanca();
    const sem = estimativaReferencia('governanca', 'equipe', S())!;
    expect(sem.valor).toBeNull(); expect(sem.falta).toEqual(['as pessoas na equipe (equivalente em tempo integral)', 'o período do orçamento']);
    expect(sem.mensagem).toBe('Informe as pessoas na equipe (equivalente em tempo integral) e o período do orçamento para ver uma estimativa.');
    expect(sem.pendencias!.map(p => p.ancora)).toEqual(['gov-govOrcamento-quantidades-equipeFte', 'gov-govOrcamento-periodo']);
    expect(estimativaReferencia('governanca', 'avaliacao', S())!.falta).toEqual(['o período do orçamento']);
    const id = presetGovernanca(S(), 'govOrcamento.periodo').opcoes.find(o => o.id === 'a_definir')!.id;
    S().responder('govSelecoes', { 'govOrcamento.periodo': [id] }); expect(mesesPeriodo('governanca', S())).toBeNull();
    periodoGov('Próximos 12 meses'); S().responder('govOrcamento.quantidades', { equipeFte: 1, servidores: 0, horasServidor: -4 });
    expect(estimativaReferencia('governanca', 'formacao', S())!.falta).toEqual(['os servidores a formar', 'as horas por servidor']);
    // item em referência sem conta fechada continua faltando
    S().responder('govOrcamento.itens.formacao', { situacao: 'referencia' });
    expect(orcamentoGovernanca(S())).toMatchObject({ estimados: 0, total: null, totalComEstimativas: null });
    expect(orcamentoGovernanca(S()).faltam).toBe(7);
    // moeda sem taxa conhecida
    S().responder('govOrcamento.moeda', 'XYZ');
    const x = estimativaReferencia('governanca', 'equipe', S())!;
    expect(x.valor).toBeNull(); expect(x.valorUSD).toBe(36000); expect(x.mensagem).toMatch(/Sem taxa de câmbio conhecida para XYZ/);
  });

  it('usa a taxa informada no caso para a mesma moeda e não estima moeda desconhecida', () => {
    governanca(); periodoGov('Próximos 12 meses'); S().responder('govOrcamento.quantidades.equipeFte', 1);
    S().setMoeda({ cod: 'BRL', taxa: '5', taxaDe: 'BRL' });
    expect(estimativaReferencia('governanca', 'equipe', S())!.valor).toBe(180000);
    expect(taxaMoeda('USD', S())).toBeNull();
    expect(taxaMoeda('EUR', S())!.taxa).toBe((moedas as any).taxas.EUR);
  });

  it('total só sem itens faltando, marcado quando inclui estimativas', () => {
    governanca(); periodoGov('Próximos 12 meses'); S().responder('govOrcamento.quantidades', { equipeFte: 1, servidores: 10, horasServidor: 10 });
    for (const id of ['estudos', 'consulta', 'comunicacao', 'supervisao']) S().responder('govOrcamento.itens.' + id, { situacao: 'informado', valor: 100 });
    S().responder('govOrcamento.itens.formacao', { situacao: 'informado', valor: 50 });
    S().responder('govOrcamento.itens.equipe', { situacao: 'referencia' });
    let o = orcamentoGovernanca(S());
    expect(o).toMatchObject({ faltam: 1, total: null, totalComEstimativas: null, informado: 450 });
    expect(linhasTotais(o).map(l => l.rotulo)).toEqual(['Informado', 'Estimado pela ferramenta', 'Ainda a levantar']);
    S().responder('govOrcamento.itens.avaliacao', { situacao: 'sem_custo' });
    o = orcamentoGovernanca(S());
    expect(o.total).toBeNull(); expect(o.totalComEstimativas).toBe(c(450 + 36000 * BRL));
    expect(linhasTotais(o)[0]).toMatchObject({ rotulo: 'Total (inclui estimativas de referência)', destaque: true });
    expect(linhasTotais(o)[2].valor).toContain('estimativa de referência, ilustrativa');
    S().responder('govOrcamento.itens.equipe', { situacao: 'informado', valor: 10 });
    o = orcamentoGovernanca(S()); expect(o.total).toBe(460); expect(linhasTotais(o)[0].rotulo).toBe('Total');
  });

  it('letramento: soma por público, sem contar duas vezes quem está em dois públicos', () => {
    letramento(); publico('A11', 1000, 30); publico('A14', 200, 10);
    let est = estimativaReferencia('letramento', 'oferta', S())!;
    expect(est.valorUSD).toBe(384000); expect(est.valor).toBe(c(384000 * BRL));
    expect(est.conta.formula).toMatch(/^Soma por público/);
    expect(est.conta.quantidades).toHaveLength(4);
    g('alcance.totalUnico', { valor: 1100, situacao: 'informado' });
    est = estimativaReferencia('letramento', 'oferta', S())!;
    expect(est.valorUSD).toBe(352000); expect(est.conta.formula).toMatch(/^Participantes distintos/);
    // equipe e avaliação dependem do período e da equipe
    expect(estimativaReferencia('letramento', 'equipe', S())!.falta).toContain('o período do orçamento');
    g('orcamento.periodo', { escolhas: ['24'] }); g('orcamento.quantidades.equipeFte', 1.5);
    expect(estimativaReferencia('letramento', 'equipe', S())!.valorUSD).toBe(108000);
    expect(estimativaReferencia('letramento', 'diagnostico', S())!.valorUSD).toBe(50000);
    expect(estimativaReferencia('letramento', 'formadores', S())).toBeNull();
  });

  it('letramento: falta de participantes ou horas aponta o campo; troca de participantes recalcula o item em uso', () => {
    letramento(); publico('A11', 1000, 30);
    const falta = estimativaReferencia('letramento', 'oferta', S())!;
    expect(falta.valor).toBeNull(); expect(falta.falta).toEqual(['o número de participantes previstos', 'as horas previstas por participante']);
    expect(falta.pendencias!.map(p => p.tela)).toEqual(['lit-alcance', 'lit-oferta']);
    expect(falta.mensagem).toBe('Informe o número de participantes previstos e as horas previstas por participante para ver uma estimativa.');
    publico('A14', 200, 10); g('orcamento.itens.oferta', { situacao: 'referencia' });
    expect(orcamentoLetramento(S())).toMatchObject({ estimados: 1, estimado: c(384000 * BRL), informados: 0 });
    g('publicos.A14.participantes', { valor: 400, situacao: 'informado' });
    expect(orcamentoLetramento(S()).estimado).toBe(c(408000 * BRL));
    g('publicos.A14.participantes', { situacao: 'a_levantar' });
    expect(orcamentoLetramento(S())).toMatchObject({ estimados: 0 });
    expect(orcamentoLetramento(S()).itens.find(i => i.id === 'oferta')!.respondido).toBe(true);
    // valor digitado prevalece
    g('orcamento.itens.oferta', { situacao: 'informado', valor: 999 });
    expect(orcamentoLetramento(S())).toMatchObject({ informado: 999, estimados: 0 });
  });

  it('custo compartilhado com a governança não é somado de novo, mesmo com a origem em referência', () => {
    S().escolherPais('BRA'); S().responder('prioridades', ['governar', 'sobre']); S().responder('redeNacional', { escolas: 10, estudantes: 1000 }); S().responder('problemas', ['G11', 'A11']);
    periodoGov('Próximos 12 meses'); S().responder('govOrcamento.quantidades.equipeFte', 1); S().responder('govOrcamento.itens.equipe', { situacao: 'referencia' });
    g('orcamento.itens.equipe', { situacao: 'compartilhado', referencia: 'equipe' });
    const lit = orcamentoLetramento(S()), item = lit.itens.find(i => i.id === 'equipe')!;
    expect(item.compartilhado).toBe(true); expect(item.origem!.estimado).toBe(c(36000 * BRL));
    expect(lit).toMatchObject({ estimado: 0, estimados: 0, informado: 0 });
    expect(lit.faltam).toBe(lit.itens.length - 1);
    const linha = planoLetramento(S()).blocos.flatMap(b => b.linhas).find(l => l.rotulo === item.nome)!;
    expect(linha.valor).toMatch(/Custeado na governança.*estimativa de referência, ilustrativa.*Não somado novamente/s);
    S().responder('frenteAtiva', 'governanca'); expect(orcamentoGovernanca(S()).estimado).toBe(c(36000 * BRL));
  });

  it('educação: profissionais × horas e equipe pelo período, com campos opcionais fora das pendências', () => {
    educacao();
    expect(estimativaReferencia('educacao', 'formacao', S())!.falta).toEqual(['os profissionais a formar', 'as horas por profissional']);
    e('orcamento.quantidades', { profissionais: 100, horasProfissional: 40, equipeFte: 1 });
    e('orcamento.periodo', { escolhas: ['trienal'] });
    expect(estimativaReferencia('educacao', 'formacao', S())!.valorUSD).toBe(48000);
    expect(estimativaReferencia('educacao', 'equipe', S())!.valorUSD).toBe(108000);
    expect(estimativaReferencia('educacao', 'avaliacao', S())!.valorUSD).toBe(75000);
    expect(lerEd(S(), 'orcamento.quantidades.profissionais')).toBe(100);
    e('orcamento.itens.formacao', { situacao: 'referencia' });
    const o = orcamentoEd(S());
    expect(o).toMatchObject({ estimados: 1, estimado: c(48000 * BRL), informados: 0 });
    expect(o.itens.find(i => i.id === 'formacao')!.respondido).toBe(true);
    // referência em categoria sem base é inválida: fica desconhecida e pendente
    e('orcamento.itens.materiais', { situacao: 'referencia', valor: 300 });
    expect(orcamentoEd(S()).itens.find(i => i.id === 'materiais')).toMatchObject({ valor: null, estimado: null, respondido: false });
    const linhas = planoEd(S()).blocos.flatMap(b => b.linhas);
    expect(linhas.find(l => l.rotulo === 'Estimado pela ferramenta')!.valor).toContain('estimativa de referência, ilustrativa');
    expect(linhas.find(l => l.rotulo === 'Estimativas de referência')!.valor).toMatch(/grau C/);
  });

  it('exportar e importar preserva "referencia" e as quantidades; lixo importado não vira custo', () => {
    governanca(); periodoGov('Próximos 12 meses');
    S().responder('govOrcamento.quantidades', { equipeFte: 2, servidores: 'muitos', horasServidor: Infinity });
    S().responder('govOrcamento.itens.equipe', { situacao: 'referencia', valor: 7 });
    S().responder('govOrcamento.itens.formacao', { situacao: 'referencia' });
    S().responder('govOrcamento.itens.estudos', { situacao: 'referencia', valor: 50 });
    S().responder('govOrcamento.itens.consulta', { situacao: 'qualquer', valor: '100' });
    const antes = orcamentoGovernanca(S());
    S().importar(JSON.stringify(S().exportar()));
    const depois = orcamentoGovernanca(S());
    expect(S().ctx.govOrcamento.itens.equipe).toEqual({ situacao: 'referencia', valor: 7 });
    expect(S().ctx.govOrcamento.quantidades.equipeFte).toBe(2);
    expect(depois.estimado).toBe(antes.estimado); expect(depois.estimado).toBe(c(72000 * BRL));
    expect(depois.itens.find(i => i.id === 'formacao')).toMatchObject({ estimado: null, referencia: true });
    expect(depois.itens.find(i => i.id === 'estudos')).toMatchObject({ valor: null, estimado: null, referencia: false });
    expect(depois.itens.find(i => i.id === 'consulta')!.valor).toBeNull();
    expect(governancaRespondida(S(), 'gov-recursos')).toBe(false);
    expect(JSON.stringify(depois)).not.toMatch(/NaN|Infinity/);
  });

  it('PDFs, plano e leitura simples mostram Informado, Estimado pela ferramenta e Ainda a levantar', async () => {
    governanca(); periodoGov('Próximos 12 meses'); S().responder('govOrcamento.quantidades.equipeFte', 1);
    S().responder('govOrcamento.itens.equipe', { situacao: 'referencia' }); S().responder('govOrcamento.itens.estudos', { situacao: 'informado', valor: 1234.56 });
    const rotulos = planoGovernanca(S()).blocos.find(b => b.titulo === 'Recursos e orçamento')!.linhas.map(l => l.rotulo);
    expect(rotulos).toEqual(expect.arrayContaining(['Informado', 'Estimado pela ferramenta', 'Ainda a levantar', 'Estimativas de referência']));
    expect(rotulos).not.toContain('Total');
    for (const tipo of ['brief', 'anexo'] as const) {
      const doc = await gerarGovernancaPDF(S().estado(), { tipo, lang: 'pt', fontes: null, data: new Date('2026-11-02T12:00:00Z') });
      const txt = textoPDF(doc); salvarPDF('gov-' + tipo + '.pdf', doc);
      for (const r of ['Informado', 'Estimado pela ferramenta', 'Ainda a levantar']) expect(txt).toContain(r);
    }
    const ls = leituraSimples(S());
    expect(ls.resumo.map(l => l.rotulo)).toEqual(expect.arrayContaining(['Valores já informados', 'Estimado pela ferramenta', 'Ainda a levantar']));
    const sumario = await gerarLeituraSimplesPDF(S().estado(), { tipo: 'sumario', lang: 'pt', fontes: null });
    expect(sumario.getNumberOfPages()).toBe(1); expect(textoPDF(sumario)).toContain('Estimado pela ferramenta');
    // letramento (modelo de formação) e educação
    S().carregarExemplo('novo'); letramento(); publico('A11', 100, 10); publico('A14', 10, 5); g('orcamento.itens.oferta', { situacao: 'referencia' });
    for (const tipo of ['brief', 'anexo'] as const) {
      const doc = await gerarGovernancaPDF(S().estado(), { tipo, modelo: 'letramento', lang: 'pt', fontes: null }); salvarPDF('lit-' + tipo + '.pdf', doc);
      for (const r of ['Informado', 'Estimado pela ferramenta', 'Ainda a levantar']) expect(textoPDF(doc)).toContain(r);
    }
    S().carregarExemplo('novo'); educacao(); e('orcamento.quantidades', { profissionais: 10, horasProfissional: 8 }); e('orcamento.itens.formacao', { situacao: 'referencia' });
    for (const tipo of ['brief', 'anexo'] as const) {
      const doc = await gerarEducacaoPDF(S().estado(), { tipo, lang: 'pt', fontes: null }); salvarPDF('ed-' + tipo + '.pdf', doc);
      for (const r of ['Informado', 'Estimado pela ferramenta', 'Ainda a levantar']) expect(textoPDF(doc)).toContain(r);
    }
  });

  it('textos em inglês sem português restante na conta e nos totais', () => {
    governanca(); periodoGov('Próximos 12 meses'); S().responder('govOrcamento.quantidades.equipeFte', 1); S().responder('govOrcamento.itens.equipe', { situacao: 'referencia' });
    const antes = getDicionarios();
    setDicionarios({ ...antes, en: JSON.parse(readFileSync(new URL('../../src/i18n/en.json', import.meta.url), 'utf8')) });
    setLang('en');
    try {
    const est = estimativaReferencia('governanca', 'equipe', S())!;
    expect(est.conta.formula).toBe('Full-time people × (months in the period ÷ 12) × annual reference cost per person');
    expect(linhasTotais(orcamentoGovernanca(S())).map(l => l.rotulo)).toEqual(['Entered', 'Estimated by the tool', 'Still to collect']);
    expect(estimativaReferencia('governanca', 'formacao', S())!.mensagem).toMatch(/^Enter /);
    } finally { setLang('pt'); setDicionarios(antes); }
  });
});
