// Teste de fumaça do domínio com `estado` em vez da global S (fluxo.js, matriz.js, recomendacoes.js, custos_ui.js).
// Os valores esperados foram conferidos contra a v13 (src/*.js carregados num vm com S global, nos exemplos A e D
// e num caso em branco): 143 comparações iguais entre legado e domínio ao fazer o porte. Aqui ficam só alguns
// pontos de referência, para pegar regressões na passagem do estado.
import { describe, it, expect } from 'vitest';
import * as D from '../../src/domain/index.ts';
const MODULOS = ['escopo', 'custos', 'framework', 'casos', 'prioridades', 'plano_dados', 'fluxo_dados', 'i18n', 'custos_ui', 'formula', 'fluxo', 'matriz', 'recomendacoes', 'glossario', 'ajuda', 'referencias', 'pais', 'rec_numeros'];

function estadoExemplo(k) {
  const caso = k === 'novo' ? D.clone(D.CASO_VAZIO) : D.clone(D.CASOS[k]);
  const estado = { caso, ctx: k === 'novo' ? {} : D.clone(D.CTX_EX[k]), resp: k === 'novo' ? {} : D.clone(D.RESP_EX[k]), respC: {}, respDet: {}, exemplo: k, feitos: {}, custo: { base: 'caso' } };
  // como aplicarExemploFluxo (v13): nos exemplos, as sugestões já estão confirmadas
  if (k !== 'novo') { D.CAMPOS_SUGERIDOS.forEach(c => { estado.respC[c] = true; }); D.confirmarGerados(estado.caso, estado.respC); D.CAMPOS_PROB.concat(['nFerramentas']).forEach(c => { estado.respC[c] = true; }); }
  return estado;
}

describe('index.ts reexporta os módulos sem colisão', () => {
  it('cada nome exportado por um módulo chega ao index e vem de um só módulo (export * omite os ambíguos)', async () => {
    const origem = {};
    for (const m of MODULOS) {
      const mod = await import(`../../src/domain/${m}.js`);
      for (const n of Object.keys(mod)) {
        expect(origem[n], `colisão: ${n} em ${origem[n]} e ${m}`).toBeUndefined();
        origem[n] = m;
        expect(D[n], `${m}.${n} ausente do index`).toBe(mod[n]);
      }
    }
    expect(Object.keys(D).length).toBe(Object.keys(origem).length);
  });
  it('expõe as funções que a interface chama', () => {
    ['calcular', 'avaliar', 'indicadores', 'cfgDoCaso', 'casoEfetivo', 'perfilFinal', 'alertas', 'sugestoesProblemas', 'recomendacoesCaso', 'matrizCaso',
      'explicacaoCusto', 'secaoFormula', 'numerosCusto', 'totaisCtx', 'qOk', 'faltas', 'faltasTodas', 'padroesGerados', 'premissasUnitarias', 'casoAtual', 'perfil', 'cfgAtual',
      't', 'tr', 'LOC', 'setDicionarios', 'setLang', 'setMoeda', 'moedaInfo', 'din', 'grande', 'csvCustos', 'secaoRecomendacoes'].forEach(f => expect(typeof D[f], f).toBe('function'));
    expect(D.t).toBe(D.tr);
    ['CAMPOS', 'PASSOS', 'FASES', 'CAMADAS', 'ETAPAS_ENS', 'NIVEIS_ADM', 'OPC', 'PRESETS', 'MATRIZ', 'REGRAS_REC', 'TIT_PLANO', 'RECS', 'PRIORIDADES'].forEach(c => expect(D[c], c).toBeTruthy());
  });
});

describe('fluxo.js com estado', () => {
  it('exemplo A: totais do contexto, padrões gerados, faltas e números', () => {
    const e = estadoExemplo('A');
    expect(D.totaisCtx(e.ctx).alunos).toBeGreaterThan(0);
    expect(D.padroesGerados(e)).toEqual({ piloto: { escolas: 30, participantes: 600, meses: 4 }, pagamento: 'institucional', licenca: 'assinatura', nFerramentas: '1', elegiveis: 12000, implantacao: { escolas: 267, pessoas: 4000 } });
    expect(D.faltasTodas(e).map(f => f.id)).toEqual(['pais', 'formacaoHoras', 'arquitetura']);   // sem aplicarExemploFluxo (que preenche os dois)
    expect(D.faltasEstimativa(e)).toEqual([]);
    expect(D.qOk('tarefas', e)).toBe(true);
    expect(D.qOk(D.CAMPO_POR_ID.arquitetura, e)).toBe(false);
    const n = D.numerosCusto(D.cfgAtual(e));
    // R7 (seção 8, E2): + US$ 12 mil de K3.4 (teste local) no Ano 0; a dotação do Ano 0 sobe 12.600 (contingência de 5%)
    expect(Math.round(n.total)).toBe(4759846);
    expect(Math.round(n.piloto)).toBe(106680);
    expect(D.perfil(e).agregado).toBe('moderado');
    expect(D.premissasUnitarias(e)[0]).toMatch(/^Premissas de partida: Exemplo A/);
    expect(D.cfgAtual(e)).toBe(e.custo.cfg);   // guardada no estado, como no legado
  });
  it('exemplo D: prova de conceito e caso em branco', () => {
    const d = estadoExemplo('D');
    expect(D.padroesGerados(d).poc).toEqual({ participantes: 15, meses: 2 });
    // R7 (E1, REC-46): verificabilidade "parcial" com API → D moderado: 570.107 → 630.407 (618,4 mil do E1 + 12 mil de K3.4)
    expect(Math.round(D.numerosCusto(D.cfgAtual(d)).total)).toBe(630407);
    const v = estadoExemplo('novo');
    expect(D.padroesGerados(v)).toEqual({});
    expect(D.faltasTodas(v).length).toBe(46);
    expect(D.faltasEstimativa(v).map(f => f.id)).toEqual(['tarefas', 'tipoTec', 'elegiveis']);
    expect(D.perfil(v).agregado).toBe('moderado');
    const semCusto = { caso: v.caso, ctx: {}, resp: {}, respC: {} };
    expect(Number.isFinite(D.avaliar(D.calcular(D.cfgAtual(semCusto))).ctEco)).toBe(true);   // sem estado.custo, devolve a cfg sem guardar
  });
});

describe('matriz.js e recomendacoes.js com estado', () => {
  it('matrizCaso: estados das células e custo por fase', () => {
    const a = D.matrizCaso(estadoExemplo('A'));
    expect(a.custo).toBe(true);
    expect(a.celulas[2].piloto.n).toEqual(['2.1.1', '2.1.2', '2.2.1', '2.2.2', '2.2.3', '2.3.1', '2.3.2', '2.3.3', '2.3.4', '2.3.5', '2.3.8']);
    expect(a.celulas[4].implantacao.estado).toBe('andamento');
    expect(a.celulas[7].contexto.estado).toBe('na');
    expect(a.celulas[2].piloto.custo).toBeGreaterThan(0);
    const v = D.matrizCaso(estadoExemplo('novo'));
    expect(v.custo).toBe(false);
    expect(v.celulas[1].contexto.estado).toBe('pendente');
  });
  it('recomendacoesCaso: lista ordenada por prioridade e secaoRecomendacoes', () => {
    // ids R-nn do catálogo (regras/); ordem pela pontuação de 4.1 (rec_selecao.js)
    // integração do R4: o catálogo completo (regras novas R-01 a R-87) dá 48 ações no A; a primeira é a R-04 (Condição de
    // 6 pontos, empatada com R-08, R-13, R-20 e R-56; o desempate é a ordem dos pacotes, PROB primeiro)
    const recs = D.recomendacoesCaso(estadoExemplo('A'));
    expect(recs.length).toBe(49);   // inclui R-01 (meta sem número)
    expect(recs[0].id).toBe('R-04');
    expect(recs.every((r, i) => !i || D.PRIO_REC[r.prioridade] && (recs[i - 1].prioridade !== 'media' || r.prioridade === 'media'))).toBe(true);
    const d = D.recomendacoesCaso(estadoExemplo('D'));
    expect(d.slice(0, 3).map(r => r.id)).toEqual(['R-57', 'R-08', 'R-20']);   // ordem pela pontuação de 4.1 (as três Condições do M1)
    expect(D.recomendacoesCaso(estadoExemplo('novo'))).toEqual([]);
    const sec = D.secaoRecomendacoes(null, estadoExemplo('A'));
    expect(sec.id).toBe('recs');
    expect(sec.table.rows.length).toBe(recs.length);
    expect(D.secaoRecomendacoes(null).table).toBe(null);
  });
});

describe('custos_ui.js e i18n.js sem globais', () => {
  it('moeda e idioma por estado de módulo', () => {
    D.setTabelaMoedas({ taxas: { USD: 1, BRL: 5 } });
    D.setMoeda({ cod: 'BRL', taxa: '' });
    expect(D.moedaInfo()).toMatchObject({ cod: 'BRL', f: 5, ov: false });
    expect(D.din(100)).toMatch(/500/);
    D.setMoeda({ cod: 'BRL', taxa: '4', taxaDe: 'BRL' });
    expect(D.moedaInfo()).toMatchObject({ cod: 'BRL', f: 4, ov: true });
    D.setMoeda({ cod: 'USD', taxa: '' });
    expect(D.moedaInfo().pre).toBe('US$');
    expect(D.LOC()).toBe('pt-BR');
    D.setLang('en'); expect(D.getLang()).toBe('en'); expect(D.LOC()).toBe('en');
    D.setDicionarios({ en: { 'Ano {0}': 'Year {0}' } });
    expect(D.t('Ano 2')).toBe('Year 2');
    expect(D.fmtInt(12345)).toBe('12,345');
    D.setLang('xx'); expect(D.getLang()).toBe('pt');
    expect(D.t('Ano 2')).toBe('Ano 2');
    expect(D.csvCustos(D.clone(D.PRESETS.A)).split('\n').length).toBeGreaterThan(10);
  });
});
