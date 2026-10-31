import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { useCaso, telasAtivas, telasDoCapitulo, proximaTela, telaAnterior, faltamDe, telaRespondida, telaDoCampo, progressoDe, migrar, numerosDe } from '../../src/store';
import { somenteGovernanca, temGovernanca, percursoGovernanca, projetoUsoDefinido, tamanhoRedeValido, estadoDoProjeto, PRIORIDADES, setLang } from '../../src/domain';
import { dadosCaso } from '../../src/export/json';
import { destinoContinuar, tituloDaAba } from '../../src/screens/transversal';
import { planoGovernanca, orcamentoGovernanca, governancaRespondida, CUSTOS_GOV, CAMPOS_SANDBOX } from '../../src/percurso/governanca';
import { aplicarSugestoes } from '../../src/store/sugestoes';
import { briefDados } from '../../src/plano/brief.js';
import { gerarBrief } from '../../src/plano/pdf_brief.js';
import { gerarPDF } from '../../src/plano/pdf.js';
const S = () => useCaso.getState();
const selecionar = () => S().responder('prioridades', ['governar']);
const rede = () => S().responder('redeNacional', { escolas: 12345, estudantes: 1600000 });
const desafios = (ids = ['G11']) => { selecionar(); rede(); S().responder('problemas', ids); };
beforeEach(() => { setLang('pt'); S().carregarExemplo('novo'); });

describe('v015: percurso institucional de governança', () => {
  it('substitui o percurso de ferramenta por quatro etapas institucionais, com contadores e navegação coerentes', () => {
    expect(telasAtivas(S())).toHaveLength(23);
    selecionar(); S().irPara(1, 'prioridades');
    expect(somenteGovernanca(S().ctx)).toBe(true);
    expect(proximaTela(S())?.id).toBe('problemas');
    expect(telasAtivas(S())).toHaveLength(11);
    expect(telasDoCapitulo(1, S())).toHaveLength(3);
    expect(telasDoCapitulo(2, S()).map(t => t.id)).toEqual(['gov-diagnostico', 'gov-instrumentos', 'gov-solucoes']);
    expect(progressoDe(S())[0].total).toBe(3);
    S().irPara(1, 'problemas'); expect(telaAnterior(S())?.id).toBe('prioridades');
    expect(tituloDaAba({ tipo: 'pergunta', n: 1, tela: 'problemas' }, S())).toMatch(/^Pergunta 3 de 11/);
    expect(telasAtivas(S()).some(t => ['etapas', 'testes', 'piloto', 'tipoTec', 'pagamento', 'elegiveis', 'internet'].includes(t.id))).toBe(false);
  });
  it('retoma em desafios se o caso estava na seleção de etapas', () => {
    selecionar(); S().irPara(1, 'etapas');
    expect(destinoContinuar(S(), faltamDe(S())).href).toBe('#/capitulo/1/problemas');
    expect(faltamDe(S()).some(t => t.id === 'etapas')).toBe(false);
  });
  it('exige desafios e totais nacionais válidos, sem tomar a antiga etapa como a rede inteira', () => {
    S().responder('etapas', { fund1: { on: true, escolas: 10, alunos: 3000, soTotal: true } }); selecionar();
    S().responder('problemas', ['G11']);
    const tela = telaDoCampo('problemas')!;
    expect(telaRespondida(S(), tela)).toBe(false);
    S().responder('redeNacional.escolas', 12345); S().responder('redeNacional.estudantes', 0);
    expect(telaRespondida(S(), tela)).toBe(false); rede(); expect(telaRespondida(S(), tela)).toBe(true);
    for (const escolas of [1.5, -1, Infinity]) expect(tamanhoRedeValido({ redeNacional: { escolas, estudantes: 3 } })).toBe(false);
  });
  it('não limita os desafios; todos eles geram uma ação, incluindo desafios legados e outro descrito', () => {
    const p: any = (PRIORIDADES as any[]).find(p => p.id === 'governar');
    desafios(p.problemas.map((q: any) => q.id)); S().responder('problemaOutro', 'Coordenação federativa');
    const plano = planoGovernanca(S());
    expect(S().ctx.problemas).toHaveLength(18); expect(plano.acoes).toHaveLength(19);
    expect(plano.acoes.map(a => a.id)).toEqual([...p.problemas.map((q: any) => q.id), 'outro']);
    S().responder('prioridades', ['com']); S().responder('problemas', ['C1', 'C2', 'C3', 'C4', 'C5']);
    expect(S().ctx.problemas).toHaveLength(5);
  });
  it('ativa sandbox apenas com o desafio G15; regulamentação não cria experimentação', () => {
    desafios(); expect(telasAtivas(S()).some(t => t.id === 'gov-sandbox')).toBe(false);
    S().responder('problemas', ['G11', 'G15']);
    expect(telasAtivas(S()).some(t => t.id === 'gov-sandbox')).toBe(true);
    expect(governancaRespondida(S(), 'gov-sandbox')).toBe(false);
    S().responder('govSandbox', Object.fromEntries(CAMPOS_SANDBOX.map(([k]) => [k, 'Plano informado'])));
    expect(governancaRespondida(S(), 'gov-sandbox')).toBe(true);
    S().responder('problemas', ['G11']);
    expect(planoGovernanca(S()).blocos.some(b => b.titulo === 'Experimentação supervisionada')).toBe(false);
    expect(S().ctx.govSandbox.objetivo).toBe('Plano informado');
  });
  it('não deriva participantes, licenças nem dinheiro do tamanho da rede ou de respostas antigas de ferramenta', () => {
    S().responder('tarefas', ['tutoria']); S().responder('tipoTec', 'paga');
    desafios(); const c = JSON.parse(JSON.stringify(S().caso));
    const antes = planoGovernanca(S()); S().responder('redeNacional.estudantes', 2000000);
    expect(S().caso).toEqual(c); expect(aplicarSugestoes(S()).sugestoes).toEqual([]);
    expect(planoGovernanca(S()).orcamento).toEqual(antes.orcamento);
    expect(antes.orcamento.total).toBeNull(); expect(antes.orcamento.informados).toBe(0);
    expect(() => numerosDe(S())).toThrow(/institucional/);
    const texto = JSON.stringify(planoGovernanca(S())); expect(texto).not.toMatch(/autorizar.*(PoC|piloto)|licença|por usuário/i);
  });
  it('distingue custo desconhecido, zero, parcial e total, sem anualizar ou extrapolar', () => {
    desafios();
    expect(orcamentoGovernanca(S()).total).toBeNull();
    S().responder('govOrcamento.itens.equipe.valor', 0);
    expect(orcamentoGovernanca(S())).toMatchObject({ total: null, subtotal: 0, informados: 1, faltam: 6 });
    S().responder('govOrcamento.itens.estudos.valor', 1500);
    expect(orcamentoGovernanca(S())).toMatchObject({ total: null, subtotal: 1500, faltam: 5 });
    for (const [k] of CUSTOS_GOV) S().responder('govOrcamento.itens.' + k + '.valor', 100);
    expect(orcamentoGovernanca(S())).toMatchObject({ total: 700, faltam: 0 });
    expect(governancaRespondida(S(), 'gov-recursos')).toBe(false);
    S().responder('govOrcamento.periodo', '2027-2028'); S().responder('govOrcamento.fonte', 'Orçamento informado pela equipe');
    expect(governancaRespondida(S(), 'gov-recursos')).toBe(true);
    S().responder('govOrcamento.itens.equipe.valor', -1); expect(orcamentoGovernanca(S()).total).toBeNull();
    S().responder('govOrcamento.itens.equipe.valor', '100'); expect(orcamentoGovernanca(S()).total).toBeNull();
  });
  it('checklist e ações exigem resposta para todos os desafios, com responsável, evidência ou lacuna', () => {
    desafios(['G11', 'G16']);
    S().responder('govInstrumentos.G11', { situacao: 'existente', instrumento: 'Norma X', evidencia: 'Documento X', responsavel: 'Ministério' });
    expect(governancaRespondida(S(), 'gov-instrumentos')).toBe(false);
    S().responder('govInstrumentos.G16', { situacao: 'ausente', responsavel: 'Ministério', lacuna: 'Criar salvaguardas' });
    expect(governancaRespondida(S(), 'gov-instrumentos')).toBe(true);
    S().responder('govAcoes.G11', { responsavel: 'A', prazo: '2027', marco: 'Consulta', indicador: 'Consulta publicada' });
    expect(governancaRespondida(S(), 'gov-acoes')).toBe(false);
    S().responder('govAcoes.G16', { responsavel: 'B', prazo: '2028', marco: 'Publicação', indicador: 'Normas publicadas' });
    expect(governancaRespondida(S(), 'gov-acoes')).toBe(true);
    expect(planoGovernanca(S()).faltam.length).toBe(faltamDe(S()).length);
  });
  it('prioridades combinadas permanecem institucionais até identificar explicitamente o projeto', () => {
    desafios(); S().responder('prioridades', ['governar', 'com']); S().responder('problemas', ['G11', 'C4']);
    expect(percursoGovernanca(S().ctx)).toBe(true); expect(temGovernanca(S().ctx)).toBe(true);
    expect(telasAtivas(S()).some(t => t.id === 'gov-projeto')).toBe(true);
    S().responder('frenteAtiva', 'projeto'); expect(percursoGovernanca(S().ctx)).toBe(true);
    S().responder('projetoIA.incluir', 'sim'); expect(projetoUsoDefinido(S().ctx)).toBe(false);
    S().responder('projetoIA.descricao', 'Apoio a planos de aula em escolas participantes');
    expect(projetoUsoDefinido(S().ctx)).toBe(true); expect(percursoGovernanca(S().ctx)).toBe(false);
    expect(telasAtivas(S()).some(t => t.id === 'testes')).toBe(true);
    S().responder('govOrcamento.itens.equipe.valor', 500);
    S().responder('frenteAtiva', 'governanca'); expect(percursoGovernanca(S().ctx)).toBe(true);
    expect(orcamentoGovernanca(S()).subtotal).toBe(500);
    S().responder('projetoIA.incluir', 'nao'); expect(projetoUsoDefinido(S().ctx)).toBe(false);
    expect(S().ctx.projetoIA.descricao).toContain('Apoio');
  });
  it('isola o projeto das ações e do orçamento de governança em relatórios e estimativas', () => {
    desafios(['G11']); S().responder('prioridades', ['governar', 'com']); S().responder('problemas', ['G11', 'C4']);
    S().responder('projetoIA', { incluir: 'sim', descricao: 'Projeto de apoio a planos de aula' });
    S().responder('frenteAtiva', 'projeto');
    S().responder('etapas', { fund1: { on: true, escolas: 10, alunos: 1000, soTotal: true } });
    S().responder('tarefas', ['planos_aula']); S().responder('tipoTec', 'paga'); S().responder('usuarios', ['professores']);
    const vista = estadoDoProjeto(S());
    expect(vista.ctx.prioridades).toEqual(['com']); expect(vista.ctx.problemas).toEqual(['C4']);
    expect(S().ctx.problemas).toEqual(['G11', 'C4']);
    const b = briefDados(S()); expect(b.titulo).toContain('Projeto de apoio a planos de aula');
    expect(b.frases.contexto.texto).not.toContain('Criar regulamentação');
    const custo = numerosDe(S()).total;
    S().responder('govOrcamento.itens.equipe.valor', 9000000); S().responder('redeNacional.estudantes', 9000000);
    expect(numerosDe(S()).total).toBe(custo);
    S().responder('frenteAtiva', 'governanca');
    expect(planoGovernanca(S()).acoes.map(a => a.id)).toEqual(['G11', 'C4']);
    expect(orcamentoGovernanca(S()).subtotal).toBe(9000000);
  });
  it('exporta/importa todos os novos campos, o ponto salvo e os dados legados', () => {
    S().responder('etapas', { fund1: { on: true, escolas: 10, alunos: 3000 } });
    S().responder('piloto', { escolas: 10, participantes: 50, meses: 2 });
    desafios(['G1', 'G11']); S().responder('govDiagnostico.atual', 'Norma em revisão');
    S().responder('govOrcamento', { moeda: 'BRL', periodo: '2027', extras: [{ nome: 'Estudo', valor: 10 }] });
    S().irPara(2, 'gov-diagnostico'); const antes = JSON.parse(JSON.stringify(S().ctx));
    const r = migrar(JSON.stringify(dadosCaso(S())));
    expect(r.ctx).toEqual({ ...antes, problemaOutro: '', subs: [] }); expect(r.caso.piloto).toEqual(S().caso.piloto);
    expect(r.capitulo).toEqual({ atual: 2, pergunta: 'gov-diagnostico' });
    expect(destinoContinuar(r, faltamDe(r)).href).toBe('#/capitulo/2/gov-diagnostico');
    S().importar(JSON.stringify(dadosCaso(S()))); expect(S().ctx).toEqual({ ...antes, problemaOutro: '', subs: [] });
  });
  it('as duas entradas públicas de PDF exportam o plano de governança sem chamar a estimativa de ferramenta', async () => {
    desafios(['G11', 'G16']); S().escolherPais('BRA');
    S().responder('govDiagnostico', { atual: 'Norma nacional em revisão.', resultado: 'Orientação nacional publicada.', linhaBase: 'Uma norma existente.', fonte: 'Inventário institucional, 2026.' });
    S().responder('govOrcamento.itens.equipe.valor', 1234.56);
    const brief = await gerarBrief(S(), { fontes: null }), anexo = await gerarPDF(S(), { fontes: null });
    expect(brief.getNumberOfPages()).toBeGreaterThan(1); expect(anexo.getNumberOfPages()).toBeGreaterThanOrEqual(brief.getNumberOfPages());
    if (process.env.V015_PDF_QA) {
      const dir = process.env.V015_PDF_QA; mkdirSync(dir, { recursive: true });
      writeFileSync(dir + '/brief-governanca.pdf', Buffer.from(brief.output('arraybuffer')));
      writeFileSync(dir + '/anexo-governanca.pdf', Buffer.from(anexo.output('arraybuffer')));
      writeFileSync(dir + '/plano.json', JSON.stringify(planoGovernanca(S()), null, 2));
    }
  });
  it('mantém traduções dos oito desafios nos idiomas publicados', () => {
    const grupo: any = (PRIORIDADES as any[]).find(p => p.id === 'governar');
    const chaves = [grupo.nome, ...grupo.problemas.filter((q: any) => q.v015).flatMap((q: any) => [q.t, q.desc])];
    for (const lang of ['en', 'es', 'fr', 'ar', 'zh', 'bm', 'zu', 'sw']) {
      const d = JSON.parse(readFileSync(new URL(`../../src/i18n/${lang}.json`, import.meta.url), 'utf8'));
      chaves.forEach(k => expect(d[k], `${lang}: ${k}`).toBeTruthy());
    }
  });
});
