// REF-17: base de referências e perfis de país (porte de tests/test_v14_referencias.js da 0.0.15-rc.1).
// (1) o verificador (scripts/checar-referencias.mjs) aceita os dados e rejeita linhas quebradas; (2) os valores-padrão lidos
// da base são os da v13 (tests/fixtures/valores_v13.json); (3) toda linha da base é usada pelo código; (4) cadeia de recuo
// país → região → global no motor; (5) premissasDoCaso, resumoPremissas e versaoReferencias (contrato com o relatório);
// (6) faixa de referência de um campo da calculadora; (7) moeda ao escolher o país.
import { describe, it, expect, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SAL, OPC_PADRAO, PRESETS, PAPEIS_SAL, construirPresets, direcionadores, compArquiteturas, clone, avaliar, calcular } from '../../src/domain/custos.js';
import { casoEfetivo, perfilFinal } from '../../src/domain/framework.js';
import { CASOS, CTX_EX, PREMISSAS_K1, PREMISSAS_V11, governancaPorRisco, cfgDoCaso, horasFormacaoEstimada } from '../../src/domain/casos.js';
import { totaisCtx } from '../../src/domain/fluxo.js';
import {
  premissasDoCaso, resumoPremissas, versaoReferencias, refFaixa, refValor, refLinha, origemDaLinha, REF_DADOS, GRUPOS_PREMISSA,
} from '../../src/domain/referencias.js';
import {
  PAIS_CAMPOS, PAIS_CAMPO_POR_ID, listaPaises, paisPorIso, escoposDeCaso, valorEfetivoCampo, escolherPais, restaurarCampoPais, editarCampoPais,
  lerValorCampo, valorParaTexto, faixaDoCampo, idRefDoCaminho, moedaAoEscolherPais, notaPais, perfilDoPais, nomePais,
} from '../../src/domain/pais.js';
import * as D from '../../src/domain';
import { checar } from '../../scripts/checar-referencias.mjs';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const RAIZ = path.join(APP, '..');
const lerJson = (f) => JSON.parse(fs.readFileSync(path.join(RAIZ, f), 'utf8'));
const semRef = (o) => JSON.parse(JSON.stringify(o, (k, v) => (/^ref/.test(k) ? undefined : v)));
const clonar = (o) => JSON.parse(JSON.stringify(o));
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= Math.max(1e-9, Math.abs(b) * tol);
const mk = (k, muda) => { const c = Object.assign(clone(CASOS[k]), muda || {}); const ce = casoEfetivo(c, totaisCtx(CTX_EX[k])); return { caso: c, cfg: cfgDoCaso(ce, perfilFinal(ce)) }; };
const av = (cfg) => avaliar(calcular(cfg));
const campoP = (L, id) => L.find((x) => x.id === id);

// linhas de teste acrescentadas à base (e dados de país) são retiradas depois de cada teste
const extras = [];
const nova = (id, escopo, valor, grau) => {
  const g = refLinha(id);
  const l = Object.assign({}, clone(g), { escopo, valor, baixo: valor * 0.9, alto: valor * 1.2, grau: grau || 'B', fonte: { titulo: 'Estudo de teste', url: null }, anoPreco: 2025 });
  REF_DADOS.referencias.push(l); extras.push(l); return l;
};
const PAISES_ORIG = clonar(listaPaises());
afterEach(() => {
  extras.splice(0).forEach((l) => REF_DADOS.referencias.splice(REF_DADOS.referencias.indexOf(l), 1));
  listaPaises().forEach((p, i) => { PAIS_CAMPOS.forEach((c) => { p[c.id] = PAISES_ORIG[i][c.id]; }); });
});

describe('(1) verificador da base (scripts/checar-referencias.mjs)', () => {
  const refs0 = lerJson('data/referencias.json'), pais0 = lerJson('data/paises.json'), moedas = lerJson('data/moedas.json');
  const quebra = (f) => { const R = clonar(refs0), P = clonar(pais0); f(R, P); return checar(R, P, moedas).join('\n'); };
  it('os dados de data/ passam', () => { expect(checar(refs0, pais0, moedas)).toEqual([]); });
  it.each([
    ['valor acima de alto', (R) => { R.referencias[0].alto = R.referencias[0].valor - 1; }, /baixo <= valor <= alto/],
    ['valor abaixo de baixo', (R) => { R.referencias[0].baixo = R.referencias[0].valor + 1; R.referencias[0].alto = R.referencias[0].valor + 2; }, /baixo <= valor <= alto/],
    ['grau fora de A, B, C', (R) => { R.referencias[1].grau = 'D'; }, /grau deve ser A, B ou C/],
    ['moeda que não existe em moedas.json', (R) => { R.referencias[2].moeda = 'XXX'; }, /moeda "XXX" não existe/],
    ['escopo que não é global, região nem ISO3', (R) => { R.referencias[3].escopo = 'ZZZ9'; }, /escopo "ZZZ9"/],
    ['campo obrigatório ausente', (R) => { delete R.referencias[4].fonte; }, /campo "fonte" ausente/],
    ['id repetido no mesmo escopo', (R) => { R.referencias[6].id = R.referencias[5].id; }, /repetido/],
    ['versão ausente', (R) => { delete R.versao; }, /"versao" ausente/],
    ['data de atualização fora do formato', (R) => { R.atualizado = '18/10/2026'; }, /"atualizado"/],
    ['acesso fora do formato', (R) => { R.referencias[7].acesso = 'ontem'; }, /"acesso"/],
    ['url que não é http', (R) => { R.referencias[8].fonte.url = 'ftp://x'; }, /url/],
    ['convenção da ferramenta com grau A', (R) => { R.referencias[9].grau = 'A'; }, /só pode ter grau C/],
    ['país com ISO3 inválido', (R, P) => { P.paises[0].iso3 = 'XYZ'; }, /iso3 inválido/],
    ['país com moeda inexistente', (R, P) => { P.paises[1].moeda = 'ZZZ'; }, /moeda "ZZZ"/],
    ['país com região desconhecida', (R, P) => { P.paises[2].regiao = 'MARTE'; }, /região "MARTE"/],
    ['país com campo do perfil malformado', (R, P) => { P.paises[3].inflacao = { valor: 0.05 }; }, /null ou \{valor, fonte, ano\}/],
    ['país com porcentagem fora de 0 a 100', (R, P) => { P.paises[4].pctUrbano = { valor: 180, fonte: 'x', ano: 2024 }; }, /porcentagem de 0 a 100/],
    ['país repetido', (R, P) => { P.paises[1].iso3 = P.paises[0].iso3; }, /iso3 repetido/],
    ['linha por país sem a linha global', (R) => { const l = clonar(R.referencias.find((x) => x.id === 'sal.eng_ml')); l.escopo = 'BRA'; R.referencias = R.referencias.filter((x) => x.id !== 'sal.eng_ml').concat([l]); }, /sem a linha global/],
  ])('rejeita: %s', (_n, f, re) => { expect(quebra(f)).toMatch(re); });
  it('aceita linha por país e por região quando há a global', () => {
    const R = clonar(refs0);
    ['BRA', 'LAC'].forEach((e) => { const l = clonar(R.referencias.find((x) => x.id === 'sal.eng_ml')); Object.assign(l, { escopo: e, valor: 70000, baixo: 63000, alto: 80500, grau: 'B', fonte: { titulo: 'Estudo de teste', url: 'https://exemplo.org/estudo' } }); R.referencias.push(l); });
    expect(checar(R, clonar(pais0), moedas)).toEqual([]);
  });
  it('o prebuild roda o verificador antes do resto', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(APP, 'package.json'), 'utf8'));
    expect(pkg.scripts.prebuild).toMatch(/^node scripts\/checar-referencias\.mjs &&/);
  });
});

describe('(2) valores-padrão lidos da base = v13', () => {
  const V13 = JSON.parse(fs.readFileSync(path.join(APP, 'tests', 'fixtures', 'valores_v13.json'), 'utf8'));
  it('salários, inflação e taxa de desconto, exemplos, condições de base e premissas v11', () => {
    expect(SAL).toEqual(V13.SAL);
    expect({ pi: OPC_PADRAO.pi, r: OPC_PADRAO.r }).toEqual(V13.OPC_PADRAO);
    expect(semRef(PRESETS)).toEqual(V13.PRESETS);
    expect({ precoDispositivo: PREMISSAS_K1.precoDispositivo, conectEscolaAno: PREMISSAS_K1.conectEscolaAno }).toEqual(V13.PREMISSAS_K1);
    expect({ horasFormacao: PREMISSAS_V11.horasFormacao, horasFormacaoPorArq: PREMISSAS_V11.horasFormacaoPorArq, taxaFornecedor: PREMISSAS_V11.taxaFornecedor }).toEqual(V13.PREMISSAS_V11);
  });
  // R7 (decisão 2, opção b; seção 8, E2): a única diferença em relação à v13 é a linha K3.4 "Teste local e conjunto de
  // avaliação" (US$ 12 mil no Ano 0), que antes só existia no risco limitado e agora entra em todos os níveis. O resto
  // tem de ser igual à v13; sem opts (sem crianças em contato direto nem revisão por volume), K5.4 não muda.
  const semK34 = (g) => ({ pessoas: g.pessoas, itens: g.itens.filter((x) => x.s !== 'K3.4') });
  it.each(['critico', 'elevado', 'moderado', 'limitado', 'minimo'])('governança por risco "%s" igual à v13, com K3.4 em todos os níveis', (n) => {
    const c = { pessoas: [], itens: [] }; governancaPorRisco(c, n);
    const g = semRef({ pessoas: c.pessoas, itens: c.itens });
    expect(semK34(g)).toEqual(semK34(V13.governanca[n]));
    const k34 = g.itens.filter((x) => x.s === 'K3.4');
    expect(k34).toEqual([{ cat: 'Avaliação', s: 'K3.4', nome: 'Teste local e conjunto de avaliação', nat: 'D', v: [12000, 0, 0, 0] }]);
  });
  it('faixas do tornado e comparação de arquiteturas iguais às da v13', () => {
    ['A', 'B', 'C'].forEach((k) => expect(direcionadores(PRESETS[k]).map((d) => ({ id: d.id, min: d.min, max: d.max }))).toEqual(V13.direcionadores[k]));
    compArquiteturas(clone(PRESETS.C)).rows.forEach((r, i) => expect(near(r.tot, V13.compArquiteturas[i], 1e-12)).toBe(true));
  });
  it('o motor lê a base: mudar a linha muda o exemplo; id que falta é erro', () => {
    const l = REF_DADOS.referencias.find((x) => x.id === 'saas.preco'), antes = { valor: l.valor, alto: l.alto };
    l.valor = 10; l.alto = 12;
    const p = construirPresets().A.saas.preco; Object.assign(l, antes);
    expect(p).toBe(10);
    expect(construirPresets().A.saas.preco).toBe(9);
    expect(() => refValor('nao.existe')).toThrow(/falta a linha "nao\.existe"/);
  });
});

describe('(3) toda linha da base é usada', () => {
  it('cada id aparece no código (salários e níveis do fornecedor por prefixo); sementes globais de grau C', () => {
    const codigo = ['custos.js', 'casos.js', 'pais.js', 'referencias.js'].map((f) => fs.readFileSync(path.join(APP, 'src', 'domain', f), 'utf8')).join('\n');
    const orfas = REF_DADOS.referencias.filter((r) => !codigo.includes("'" + r.id + "'") && !/^sal\./.test(r.id) && !/^v11\.fornecedor\./.test(r.id));
    expect(orfas.map((r) => r.id)).toEqual([]);
    expect(PAPEIS_SAL.every((k) => REF_DADOS.referencias.some((r) => r.id === 'sal.' + k))).toBe(true);
    expect(REF_DADOS.referencias.every((r) => r.escopo === 'global' && r.grau === 'C' && r.fonte.titulo === 'Convenção da ferramenta (v13), ilustrativa' && r.fonte.url === null)).toBe(true);
    ['sal.gestor_produto', 'saas.preco', 'ow.gpu.hora', 'api.manutPct'].forEach((id) => expect(refLinha(id).alto).toBeGreaterThan(refLinha(id).baixo));
    expect([refLinha('k1.dispositivo').baixo, refLinha('k1.dispositivo').alto]).toEqual([300, 300]);
  });
});

describe('(4) países e cadeia de recuo', () => {
  it('5 países piloto, com moeda, região e grupo de renda; o resto nulo', () => {
    expect(listaPaises().map((p) => p.iso3 + p.moeda)).toEqual(['BRABRL', 'MEXMXN', 'KENKES', 'MARMAD', 'IDNIDR']);
    expect(listaPaises().every((p) => p.regiao && p.grupoRenda && p.grupoRenda.fonte === 'Banco Mundial, a verificar' && PAIS_CAMPOS.every((c) => p[c.id] === null))).toBe(true);
    expect(escoposDeCaso({ pais: 'BRA' })).toEqual(['BRA', 'LAC', 'global']);
    expect([escoposDeCaso({}), escoposDeCaso({ pais: 'outro' }), escoposDeCaso({ pais: 'XXX' })]).toEqual([null, null, null]);
  });
  it.each(['A', 'B', 'C', 'D'])('exemplo %s: com o Brasil escolhido (dados globais), o custo e a cfg não mudam', (k) => {
    const base = mk(k), com = mk(k, { pais: 'BRA' });
    expect(near(av(com.cfg).ctEco, av(base.cfg).ctEco, 1e-12)).toBe(true);
    expect(com.cfg.escopos).toEqual(['BRA', 'LAC', 'global']);
    expect(JSON.stringify(Object.assign({}, com.cfg, { escopos: undefined }))).toBe(JSON.stringify(base.cfg));
  });
  it('linha do país vence a da região, que vence a global; o custo segue', () => {
    const salBase = refValor('sal.eng_ml');
    const lReg = nova('sal.eng_ml', 'LAC', 70000), lBra = nova('sal.eng_ml', 'BRA', 80000, 'A');
    expect(refValor('sal.eng_ml')).toBe(salBase);
    expect(refValor('sal.eng_ml', ['BRA', 'LAC', 'global'])).toBe(80000);
    expect(refValor('sal.eng_ml', ['MEX', 'LAC', 'global'])).toBe(70000);
    expect(refValor('sal.eng_ml', ['KEN', 'SSA', 'global'])).toBe(salBase);
    expect([origemDaLinha(lBra), origemDaLinha(lReg), origemDaLinha(refLinha('sal.eng_ml'))]).toEqual(['pais', 'regiao', 'ilustrativo']);
    const cB = mk('B', { pais: 'BRA' }), cM = mk('B', { pais: 'MEX' }), cK = mk('B', { pais: 'KEN' }), c0 = mk('B');
    expect(cB.cfg.salarios.eng_ml).toBe(80000);
    expect(cM.cfg.salarios.eng_ml).toBe(70000);
    expect(cK.cfg.salarios).toBeUndefined();
    expect(JSON.stringify(Object.assign({}, cK.cfg, { escopos: undefined }))).toBe(JSON.stringify(c0.cfg));
    expect(av(cB.cfg).ctEco).toBeGreaterThan(av(cM.cfg).ctEco);
    expect(av(cM.cfg).ctEco).toBeGreaterThan(av(cK.cfg).ctEco);
    const est = (c) => ({ caso: c.caso, ctx: CTX_EX.B, custo: { base: 'caso', cfg: null, editado: false } });
    const pB = campoP(premissasDoCaso(est(cB), cB.cfg), 'sal.eng_ml'), pM = campoP(premissasDoCaso(est(cM), cM.cfg), 'sal.eng_ml'), pK = campoP(premissasDoCaso(est(cK), cK.cfg), 'sal.eng_ml');
    expect([pB.origem, pB.grau, pB.ano, pB.fonte]).toEqual(['pais', 'A', 2025, 'Estudo de teste']);
    expect([pM.origem, pM.valor]).toEqual(['regiao', 70000]);
    expect([pK.origem, pK.grau, pK.valor]).toEqual(['ilustrativo', 'C', salBase]);
  });
  it('perfil do país entra no motor: inflação, taxa de desconto, salário do professor, escolas e internet', () => {
    const BRA = paisPorIso('BRA');
    BRA.inflacao = { valor: 0.045, fonte: 'IBGE (teste)', ano: 2025 };
    BRA.taxaDesconto = { valor: 0.06, fonte: 'Guia de teste', ano: 2024 };
    BRA.salarioProfessor = { valor: 17600, fonte: 'MEC (teste)', ano: 2025 };
    BRA.pctEscolasInternet = { valor: 60, fonte: 'Censo (teste)', ano: 2024 };
    BRA.escolas = { valor: 1000, fonte: 'Censo (teste)', ano: 2024 };
    const caso = Object.assign(clone(CASOS.B), { pais: 'BRA', internet: 'parcial', escolasInternet: '' });
    const ce = casoEfetivo(caso, { alunos: 0, escolas: 0 }), cfgP = cfgDoCaso(ce, perfilFinal(ce));
    let e = valorEfetivoCampo(caso, 'inflacao');
    expect([e.origem, e.valor, e.fonte, e.ano]).toEqual(['pais', 0.045, 'IBGE (teste)', 2025]);
    expect([cfgP.opc.pi, cfgP.opc.r, cfgP.formacaoTempo.custoHora]).toEqual([0.045, 0.06, 17600 / 1760]);
    expect(cfgP.v11.escolas.some((n) => n > 0)).toBe(true);
    expect(cfgP.v11.internet.fracaoSem).toBe(0.4);
    caso.editados = { inflacao: 0.03 };
    e = valorEfetivoCampo(caso, 'inflacao');
    expect([e.origem, e.valor, e.padrao, e.origemPadrao]).toEqual(['usuario', 0.03, 0.045, 'pais']);
    restaurarCampoPais(caso, 'inflacao');
    expect(valorEfetivoCampo(caso, 'inflacao').origem).toBe('pais');
    // premissasDoCaso com o perfil: hora de formação herda a origem do salário; o perfil aparece com fonte e ano
    const L = premissasDoCaso({ caso, ctx: {}, custo: { base: 'caso', cfg: null, editado: false } }, cfgP);
    const h = L.find((x) => /^formacao\.custoHora\./.test(x.id));
    expect([h.origem, h.fonte]).toEqual(['pais', 'MEC (teste)']);
    expect(L.some((x) => x.id === 'conv.horasAno')).toBe(true);
    expect([campoP(L, 'inflacao').origem, campoP(L, 'inflacao').fonte, campoP(L, 'salarioProfessor').valor]).toEqual(['pais', 'IBGE (teste)', 17600]);
    const editado = premissasDoCaso({ caso: Object.assign(clone(caso), { editados: { salarioProfessor: 20000 } }), ctx: {}, custo: { base: 'caso', cfg: null, editado: false } });
    expect([campoP(editado, 'salarioProfessor').origem, campoP(editado, 'salarioProfessor').valor]).toEqual(['usuario', 20000]);
  });
  it('região e valor ilustrativo; nada é inventado; escolherPais; leitura dos campos', () => {
    nova('macro.inflacao', 'LAC', 0.06);
    expect([valorEfetivoCampo({ pais: 'MEX' }, 'inflacao').origem, valorEfetivoCampo({ pais: 'MEX' }, 'inflacao').valor]).toEqual(['regiao', 0.06]);
    extras.splice(0).forEach((l) => REF_DADOS.referencias.splice(REF_DADOS.referencias.indexOf(l), 1));
    const e = valorEfetivoCampo({ pais: 'MEX' }, 'inflacao');
    expect([e.origem, e.valor, e.grau]).toEqual(['ilustrativo', 0.025, 'C']);
    expect(valorEfetivoCampo({ pais: 'outro' }, 'taxaDesconto').valor).toBe(0);
    expect(valorEfetivoCampo({ pais: 'MEX' }, 'salarioProfessor')).toBeNull();
    expect(valorEfetivoCampo({}, 'escolas')).toBeNull();
    const cc = { pais: '', editados: { inflacao: 0.1 } };
    expect(escolherPais(cc, 'KEN').iso3).toBe('KEN');
    expect(cc.editados).toEqual({});
    expect(escolherPais(cc, 'outro')).toBeNull();
    expect(cc.pais).toBe('outro');
    escolherPais(cc, 'QQQ'); expect(cc.pais).toBe('');
    expect(lerValorCampo(PAIS_CAMPO_POR_ID.inflacao, 4.5)).toBe(0.045);
    expect(lerValorCampo(PAIS_CAMPO_POR_ID.idiomas, 'pt, ES;fr')).toEqual(['pt', 'es', 'fr']);
    expect(lerValorCampo(PAIS_CAMPO_POR_ID.pctUrbano, 180)).toBe(100);
    expect(lerValorCampo(PAIS_CAMPO_POR_ID.escolas, '')).toBe('');
    expect(valorParaTexto(PAIS_CAMPO_POR_ID.inflacao, 0.045)).toBe(4.5);
    editarCampoPais(cc, 'escolas', 50); expect(cc.editados.escolas).toBe(50);
    editarCampoPais(cc, 'escolas', ''); expect('escolas' in cc.editados).toBe(false);
  });
  it('nota e perfil do país para a interface; nome no idioma', () => {
    expect(notaPais({})).toBeNull();
    const n = notaPais({ pais: 'BRA' });
    expect([n.moeda, n.regiao, n.nomeRegiao, n.renda, n.fonteRenda]).toEqual(['BRL', 'LAC', 'América Latina e Caribe', 'renda média-alta', 'Banco Mundial, a verificar']);
    const P = perfilDoPais({ pais: 'BRA' });
    expect(P.map((x) => x.def.id)).toEqual(PAIS_CAMPOS.map((c) => c.id));
    // nos 5 pilotos, só inflação e taxa de desconto têm valor (ilustrativo); os outros 7 ficam "sem dado"
    expect(P.filter((x) => x.info == null).length).toBe(7);
    expect(nomePais(paisPorIso('BRA'))).toBe('Brasil');
  });
});

describe('(5) premissasDoCaso e versaoReferencias (contrato com o relatório)', () => {
  const sem = mk('A');
  const est = { caso: sem.caso, ctx: CTX_EX.A, custo: { base: 'caso', cfg: null, editado: false } };
  const CAMPOS = ['id', 'grupo', 'rotulo', 'valor', 'unidade', 'origem', 'fonte', 'ano', 'grau', 'baixo', 'alto', 'fora'];
  it('lista com os campos do contrato; sem país nem edição, tudo ilustrativo, grau C, dentro da faixa', () => {
    const PL = premissasDoCaso(est);
    expect(PL.length).toBeGreaterThan(10);
    expect(PL.filter((x) => !CAMPOS.every((k) => k in x))).toEqual([]);
    expect(PL.every((x) => ['pais', 'regiao', 'usuario', 'ilustrativo'].includes(x.origem))).toBe(true);
    expect(PL.every((x) => GRUPOS_PREMISSA.some((g) => g[0] === x.grupo))).toBe(true);
    expect(PL.filter((x) => x.origem !== 'ilustrativo' || x.grau !== 'C' || x.fora !== false)).toEqual([]);
    expect(campoP(PL, 'saas.preco').valor).toBe(9);
    expect(campoP(PL, 'sal.gestor_produto')).toBeTruthy();
    expect(campoP(PL, 'macro.inflacao')).toBeUndefined();
    expect([campoP(PL, 'inflacao').valor, campoP(PL, 'taxaDesconto').valor]).toEqual([0.025, 0]);
    expect(campoP(PL, 'ow.gpu.hora') || campoP(PL, 'api.modelo_intermediario.Pin')).toBeUndefined();
    const s = campoP(PL, 'saas.preco');
    expect([s.rotulo, s.unidade, s.ano, s.fonte, s.baixo, s.alto, s.grupo]).toEqual(['Preço da licença por usuário', 'US$ por licença por mês', 2026, 'Convenção da ferramenta (v13), ilustrativa', 8.55, 10.35, 'tecnologia']);
    // ordem por grupo: o perfil do país vem primeiro
    expect(PL[0].grupo).toBe('pais');
    // a mesma lista sem passar a cfg: premissasDoCaso(estado) monta a cfg do estado sem alterá-lo
    const antes = JSON.stringify(est);
    expect(premissasDoCaso(est).map((x) => x.id)).toEqual(PL.map((x) => x.id));
    expect(JSON.stringify(est)).toBe(antes);
  });
  it('valores editados na calculadora: usuario e fora da faixa; os limites não são sinalizados', () => {
    const cfgE = clone(sem.cfg); cfgE.__base = 'caso'; cfgE.saas.preco = 20; cfgE.salarios = Object.assign({}, SAL, { eng_integracao: 46000 });
    const PE = premissasDoCaso({ ...est, custo: { base: 'caso', cfg: cfgE, editado: true } });
    expect([campoP(PE, 'saas.preco').origem, campoP(PE, 'saas.preco').fora]).toEqual(['usuario', true]);
    expect([campoP(PE, 'sal.eng_integracao').origem, campoP(PE, 'sal.eng_integracao').fora]).toEqual(['usuario', false]);
    expect(PE.filter((x) => !['saas.preco', 'sal.eng_integracao'].includes(x.id)).every((x) => x.origem === 'ilustrativo')).toBe(true);
    const r = resumoPremissas(PE);
    expect([r.usuario, r.fora, r.total - r.convencao]).toEqual([2, 1, 2]);
    const cfgF = clone(sem.cfg); cfgF.saas.preco = 8.0;
    expect(campoP(premissasDoCaso(est, cfgF), 'saas.preco').fora).toBe(true);
    const cfgG = clone(sem.cfg); cfgG.saas.preco = 10.35;
    expect(campoP(premissasDoCaso(est, cfgG), 'saas.preco').fora).toBe(false);
    const cfgH = clone(sem.cfg); cfgH.opc = { H: 3, pi: 0.05 };
    expect([campoP(premissasDoCaso(est, cfgH), 'inflacao').origem, campoP(premissasDoCaso(est, cfgH), 'inflacao').valor]).toEqual(['usuario', 0.05]);
  });
  it('exemplos B (pesos abertos) e D (API e RAG) listam as premissas da arquitetura', () => {
    const quais = (k) => { const x = mk(k); return premissasDoCaso({ caso: x.caso, ctx: CTX_EX[k], custo: { base: 'caso', cfg: null, editado: false } }, x.cfg).map((p) => p.id); };
    expect(quais('D')).toEqual(expect.arrayContaining(['api.modelo_intermediario.Pin', 'api.modelo_intermediario.Pout', 'api.modelo_pequeno.Pin', 'rag.embeddings', 'api.mensal.hospedagem', 'api.implantacao', 'api.manutPct']));
    expect(quais('B')).toEqual(expect.arrayContaining(['ow.gpu.hora', 'ow.seg.hora', 'ow.implantacao', 'gov.avaliacaoImpacto', 'gov.testesAdversariais']));
  });
  it('versaoReferencias, refFaixa e refValor; exportados pelo index do domínio', () => {
    const refs0 = lerJson('data/referencias.json'), pais0 = lerJson('data/paises.json');
    const v = versaoReferencias();
    expect([v.referencias, v.paises, v.data, v.linhas, v.nPaises]).toEqual([refs0.versao, pais0.versao, '2026-10-18', refs0.referencias.length, 5]);
    expect(v.texto).toBe('referências v1.0.0 (2026-10-18), países v1.0.0 (2026-10-18)');
    expect(refFaixa('saas.preco')).toEqual({ baixo: 8.55, alto: 10.35 });
    expect(refFaixa('nao.existe')).toBeNull();
    expect(refValor('k1.dispositivo')).toBe(300);
    ['premissasDoCaso', 'versaoReferencias', 'refFaixa', 'refValor', 'faixaDoCampo', 'valorEfetivoCampo', 'escoposDeCaso'].forEach((f) => expect(typeof D[f], f).toBe('function'));
  });
});

describe('(6) faixa de referência de um campo da calculadora', () => {
  const cfgA = clone(PRESETS.A);
  it('preço, salário, implantação sem faixa, itens por ano e campos sem linha', () => {
    let f = faixaDoCampo(cfgA, 'saas.preco', null);
    expect([f.valor, f.baixo, f.alto, f.fora, f.semFaixa, f.grau]).toEqual([9, 8.55, 10.35, false, false, 'C']);
    expect(faixaDoCampo(cfgA, 'saas.preco', null, 11).fora).toBe(true);
    f = faixaDoCampo(cfgA, 'salarios.eng_ml', null, 100000);
    expect([f.fora, f.baixo, f.alto]).toEqual([true, 54000, 69000]);
    f = faixaDoCampo(cfgA, 'implantacao.0.valor', null, 400000);
    expect([f.semFaixa, f.fora, f.linha.valor]).toEqual([true, false, 40000]);
    expect(faixaDoCampo(cfgA, 'itens.2.v.0', null).linha.valor).toBe(20000);
    expect(faixaDoCampo(cfgA, 'itens.2.v.2', null).linha.valor).toBe(12000);
    expect(faixaDoCampo(cfgA, 'itens.2.v.0', null).id).toBe('saas.formacao.ano0');
    expect(faixaDoCampo(cfgA, 'saas.qtd.1', null)).toBeNull();
    expect(faixaDoCampo(cfgA, 'demanda.s', null)).toBeNull();
    expect(idRefDoCaminho(cfgA, 'opc.pi')).toBe('macro.inflacao');
    const cfgB = clone(PRESETS.B);
    expect(faixaDoCampo(cfgB, 'api.Pin', null).baixo).toBe(1.6);
    expect(faixaDoCampo(cfgB, 'api.Pout', null).alto).toBe(12.5);
    expect(faixaDoCampo(cfgB, 'implantacao.0.manutPct', null).baixo).toBe(0.16);
    expect(faixaDoCampo(cfgB, 'mensais.1.valor', null).id).toBe('api.mensal.hospedagem');
  });
  it('a linha do país vale quando há país', () => {
    nova('saas.preco', 'BRA', 6);
    const r = faixaDoCampo(cfgA, 'saas.preco', { pais: 'BRA' }, 7);
    expect([r.origem, r.baixo, r.fora]).toEqual(['pais', 5.4, false]);
  });
  it('horas de formação estimadas seguem a base (sem país, as da v13)', () => {
    expect(horasFormacaoEstimada('api')).toBe(1.5);
    expect(horasFormacaoEstimada({ arquitetura: 'ow', pais: 'BRA' })).toBe(2);
  });
});

describe('(7) moeda ao escolher o país (decisão 4: só se ainda estiver em USD)', () => {
  it('USD → moeda do país; escolha da pessoa fica; troca automática segue o país; sem país volta ao USD', () => {
    expect(moedaAoEscolherPais({ cod: 'USD', taxa: '' }, 'BRA')).toEqual({ cod: 'BRL', taxa: '', taxaDe: '', doPais: 'BRA' });
    expect(moedaAoEscolherPais({ cod: 'EUR', taxa: 0.9, taxaDe: 'EUR' }, 'BRA')).toBeNull();
    expect(moedaAoEscolherPais({ cod: 'BRL', taxa: '', doPais: 'BRA' }, 'MEX')).toEqual({ cod: 'MXN', taxa: '', taxaDe: '', doPais: 'MEX' });
    expect(moedaAoEscolherPais({ cod: 'BRL', taxa: '', doPais: 'BRA' }, 'BRA')).toBeNull();
    expect(moedaAoEscolherPais({ cod: 'BRL', taxa: '', doPais: 'BRA' }, 'outro')).toEqual({ cod: 'USD', taxa: '', taxaDe: '' });
    // a pessoa trocou a moeda depois do país: a marca do país não vale mais
    expect(moedaAoEscolherPais({ cod: 'EUR', taxa: '', doPais: 'BRA' }, 'MEX')).toBeNull();
    expect(moedaAoEscolherPais({ cod: 'USD', taxa: '' }, '')).toBeNull();
  });
});
