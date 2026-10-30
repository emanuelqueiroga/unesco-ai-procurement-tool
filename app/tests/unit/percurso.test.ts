// Percurso (0.1.0-alpha.2): rotas, projeção do plano (painel), sínteses de capítulo e textos.
import { describe, it, expect, beforeEach } from 'vitest';
import { useCaso } from '../../src/store/caso';
import { ESSENCIAL } from '../../src/store/perguntas';
import { lerRota, href } from '../../src/percurso/rota';
import { painelDe, temNumeros, origemKpi, recsPlano, tituloCaso, fatosCaso } from '../../src/percurso/painel';
import { sinteseCapitulo } from '../../src/percurso/sintese';
import { LEAD, CURTO, linhaAfeta, plural, tituloGovernanca } from '../../src/percurso/textos';
import { resultadoRecomendacoes } from '../../src/domain';
import { briefDados } from '../../src/plano/brief.js';

const S = () => useCaso.getState();
const rede = () => S().responder('etapas', { fund2: { on: true, escolas: 48, alunos: 9000, soTotal: true } });
beforeEach(() => { S().carregarExemplo('novo'); });

describe('rotas', () => {
  it('lê as rotas do percurso e do plano', () => {
    expect(lerRota('')).toEqual({ tipo: 'inicio' });
    expect(lerRota('#/')).toEqual({ tipo: 'inicio' });
    expect(lerRota('#/capitulo/2')).toEqual({ tipo: 'abertura', n: 2 });
    expect(lerRota('#/capitulo/2/piloto')).toEqual({ tipo: 'pergunta', n: 2, tela: 'piloto' });
    expect(lerRota('#/capitulo/3/sintese')).toEqual({ tipo: 'sintese', n: 3 });
    expect(lerRota('#/plano')).toEqual({ tipo: 'plano', pagina: 'resumo' });
    expect(lerRota('#/plano/fazer')).toEqual({ tipo: 'plano', pagina: 'fazer' });
    expect(lerRota('#/galeria')).toEqual({ tipo: 'galeria' });
  });
  it('a antiga tela situacao leva a prioridades sem alterar respostas salvas', () => {
    S().responder('situacao', 'renovar');
    expect(lerRota('#/capitulo/1/situacao')).toEqual({ tipo: 'pergunta', n: 1, tela: 'prioridades' });
    expect(ESSENCIAL.slice(0, 3).map(t => t.id)).toEqual(['local', 'prioridades', 'etapas']);
    expect(ESSENCIAL.some(t => t.id === 'situacao')).toBe(false);
    expect(S().caso.situacao).toBe('renovar');
  });
  it('rotas inválidas caem num lugar seguro', () => {
    expect(lerRota('#/capitulo/9')).toEqual({ tipo: 'inicio' });
    expect(lerRota('#/capitulo/1/piloto')).toEqual({ tipo: 'abertura', n: 1 });   // tela de outro capítulo
    expect(lerRota('#/qualquer')).toEqual({ tipo: 'inicio' });
  });
  it('href e lerRota são inversos para todas as telas', () => {
    ESSENCIAL.forEach((t) => expect(lerRota(href.tela(t.id))).toEqual({ tipo: 'pergunta', n: t.capitulo, tela: t.id }));
  });
});

describe('textos', () => {
  it('toda tela do Essencial tem frase de abertura e nome curto', () => {
    ESSENCIAL.forEach((t) => { expect(LEAD[t.id], t.id).toBeTruthy(); expect(CURTO[t.id], t.id).toBeTruthy(); });
  });
  it('o título de regulamentação usa o país escolhido e tem fallback sem país', () => {
    expect(tituloGovernanca('g-legislacao', { pais: 'BRA' }, '')).toBe('Regulamentação em Brasil');
    expect(tituloGovernanca('g-legislacao', { pais: 'outro' }, '')).toBe('Regulamentação no país');
    expect(tituloGovernanca('g-legislacao', {}, '')).toBe('Regulamentação no país');
  });
  it('linha "muda no plano"', () => {
    expect(linhaAfeta(['kpi.ano0', 'A1', 'rec:x', 'rec:y'])).toBe('custo do teste (Ano 0) · regras do teste e da implantação (A1) · 2 recomendações possíveis');
    expect(linhaAfeta([])).toBe('perfil do caso');
    expect(plural(1, '{n} lacuna', '{n} lacunas')).toBe('1 lacuna');
    expect(plural(3, '{n} lacuna', '{n} lacunas')).toBe('3 lacunas');
  });
});

describe('painel do plano', () => {
  it('em branco: sem números, sem recomendações, 23 lacunas', () => {
    const p = painelDe(S().estado());
    expect(p.estado).toBe('empty');
    expect(p.temNumeros).toBe(false);
    expect(p.kpis.every((k) => k.value === undefined)).toBe(true);
    expect(p.recs).toEqual([]);
    expect(p.faltam).toBe(23);
  });
  it('o primeiro número aparece ao responder o tipo de tecnologia (2.3.4)', () => {
    rede();
    S().responder('testes', ['piloto']);
    S().responder('tarefas', ['tutoria']);
    expect(temNumeros(S().estado())).toBe(false);
    S().responder('tipoTec', 'paga');
    const p = painelDe(S().estado());
    expect(p.estado).toBe('writing');
    expect(p.temNumeros).toBe(true);
    const ano0 = p.kpis.find((k) => k.id === 'kpi.ano0')!;
    expect(ano0.bruto).toBeGreaterThan(0);
    expect(ano0.value).toMatch(/US\$/);
    expect(p.camadas.length).toBe(7);
    expect(p.fatos).toContain('Piloto em 3 escolas por 4 meses');
  });
  it('a origem do número é a pior entre as respostas que o alimentam', () => {
    rede(); S().responder('testes', ['piloto']); S().responder('tipoTec', 'paga');
    expect(origemKpi(S().estado(), 'kpi.ano0')).toBe('padrao');      // internet, formação… ainda padrão
    S().carregarExemplo('A');
    expect(origemKpi(S().estado(), 'kpi.ano0')).toBe('informado');
  });
  it('num exemplo, o plano está completo, com as recomendações na ordem do motor e o veredito', () => {
    S().carregarExemplo('B');
    const p = painelDe(S().estado());
    expect(p.estado).toBe('complete');
    expect(p.recs.length).toBeGreaterThan(5);
    // R6: a ordem é a do motor (pontuação da seção 4.1), a mesma de resultadoRecomendacoes
    expect(p.recs.map((r) => r.id)).toEqual((resultadoRecomendacoes(S().estado()).recs as any[]).map((r) => r.id));
    expect(p.cartoes.length).toBe(5);
    expect(p.veredito).toMatch(/^Próxima decisão: /);
    expect(JSON.stringify(p.recs)).not.toMatch(/prioridade alta|"Alta"|"Média"/);
    expect(p.titulo).toContain(' · ');
  });
  it('os quatro exemplos respondem todas as 23 telas do Essencial', () => {
    ['A', 'B', 'C', 'D'].forEach((k) => {
      S().carregarExemplo(k);
      const p = painelDe(S().estado());
      expect(p.faltam, k).toBe(0);
      expect(p.premissas, k).toBe(0);
    });
  });
  it('as recomendações apontam para a tela que as originou, quando está no Essencial', () => {
    S().carregarExemplo('B');
    const r = recsPlano(S().estado()).find((x) => x.id === 'R-83');   // R2: a ação da 1.3.1 (era g-comite)
    expect(r && r.tela).toBe('governanca');
    // R6 (REC-10): o "Por quê" é a razão da regra; a pergunta e a resposta vão para a origem
    expect(r && r.porque).not.toMatch(/você respondeu/);
    expect(r && r.origem).toMatch(/^1\.3\.1 /);
    expect(r && r.quem).toMatch(/\S/);
    expect(r && r.rotuloNivel).toMatch(/^(Condição|Recomendada|Para acompanhar)/);
  });
  it('título e fatos do caso', () => {
    S().responder('local', 'Rede Municipal de Exemplo');
    S().responder('problema', 'Defasagem em matemática');
    expect(tituloCaso(S().estado())).toBe('Rede Municipal de Exemplo');
    rede(); S().responder('testes', ['poc']);
    expect(fatosCaso(S().estado())).toMatch(/^Prova de conceito com 15 pessoas por 2 meses/);
  });
});

describe('sínteses de capítulo', () => {
  it('capítulo 1: prosa da rede e da governança, sem número', () => {
    S().responder('local', 'Rede Municipal de Exemplo'); rede();
    S().responder('prioridades', ['com']); S().responder('problemas', ['C2']);
    ['g-comite', 'g-politica', 'g-legislacao', 'g-dados', 'g-etica', 'g-compras'].forEach((g, i) => S().responderGov(g, i < 2 ? 'sim' : 'nao'));
    const s = sinteseCapitulo(1, S().estado());
    expect(s.kpi).toBeUndefined();
    expect(s.paragrafos[0]).toContain('Rede Municipal de Exemplo');
    expect(s.paragrafos[0]).toContain('48 escolas');
    expect(s.paragrafos[0]).toMatch(/matemática/);
    expect(s.paragrafos[1]).toContain('2 de 6');
  });
  it('capítulo 2 mostra o custo do teste; 3 o do primeiro ano; 4 o total', () => {
    S().carregarExemplo('A');
    const e = S().estado();
    const s2 = sinteseCapitulo(2, e), s3 = sinteseCapitulo(3, e), s4 = sinteseCapitulo(4, e);
    expect(s2.kpi?.id).toBe('kpi.ano0'); expect(s3.kpi?.id).toBe('ano1'); expect(s4.kpi?.id).toBe('kpi.total');
    expect(s2.kpi?.value).toMatch(/US\$/);
    expect(s2.paragrafos.join(' ')).toMatch(/O teste será/);
    expect(s4.paragrafos.join(' ')).toMatch(/Em toda a rede/);
    expect(s2.nRecs).toBeGreaterThan(0);
  });
  it('REC-42 e PB-06: o capítulo 4 do B termina com "Seu próximo passo" (recomendação do brief, 3 ações, Ano 0, cuidado)', () => {
    S().carregarExemplo('B');
    const e = S().estado();
    const s4 = sinteseCapitulo(4, e);
    const v = (resultadoRecomendacoes(e) as any).veredito;
    expect(s4.proximo).toBeTruthy();
    const p = s4.proximo!;
    expect(p.titulo).toBe('Seu próximo passo');
    // PB-06: a mesma recomendação do policy brief, de "Em resumo" e do painel "Seu plano"
    const b: any = briefDados(e);
    expect(p.veredito).toBe(b.recomendacao.texto);
    expect(p.porque).toBe(b.recomendacao.porque);
    expect(p.veredito).toMatch(/^Próxima decisão: /);
    expect(p.veredito).toContain('Recomendação: começar por uma prova de conceito antes do piloto');
    expect(p.veredito).not.toMatch(/Ainda não avance/i);   // PB-05: redação construtiva
    expect(v.codigo).toBe('nao');
    expect(p.porque).toMatch(/^Por quê: /);
    expect(p.acoes.length).toBe(3);
    p.acoes.forEach((a) => { expect(a.quem).toMatch(/\S/); expect(a.marco).toMatch(/\S/); expect(a.id).toMatch(/^R-\d+$/); });
    expect(p.custo).toMatch(/^Custo do Ano 0: US\$ .+ Dotação do Ano 0: US\$ /);
    expect(p.cuidado).toMatch(/^Cuidado (limitado|moderado|elevado|crítico)/);
    expect(p.pdf).toBe('Baixar o policy brief (PDF)');
    expect(p.faltam).toBe(0);
    expect(sinteseCapitulo(3, e).proximo).toBeNull();
  });
  it('sem respostas, a síntese diz que usa as premissas padrão e nunca mostra "undefined" ou NaN', () => {
    ([1, 2, 3, 4] as const).forEach((n) => {
      const s = sinteseCapitulo(n, S().estado());
      expect(s.paragrafos.length).toBeGreaterThan(0);
      s.paragrafos.forEach((p) => { expect(p).not.toMatch(/undefined|NaN|null/); });
    });
  });
});
