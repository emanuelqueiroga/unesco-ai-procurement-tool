// Testes da base de referências e dos perfis de país (v14: BL4.1, BL4.3, BL4.5, BL1.3, BL1.5; motor e funções do relatório).
// Uso: node tests/test_v14_referencias.js
// (1) o verificador aceita os dados e rejeita linhas quebradas; (2) os valores-padrão lidos da base são os da v13
//     (tests/fixtures/valores_v13.json, tirado do código da v13); (3) toda linha da base é usada pelo código;
// (4) cadeia de recuo país → região → global no motor; (5) premissasDoCaso e versaoReferencias; (6) faixa de referência.
const path = require('path');
const fs = require('fs');
const os = require('os');
const cp = require('child_process');
global.LOC = () => 'pt-BR';
const RAIZ = path.join(__dirname, '..');
const src = f => path.join(RAIZ, 'src', f);
Object.assign(global, require(src('custos.js')));
Object.assign(global, require(src('framework.js')));
Object.assign(global, require(src('casos.js')));
Object.assign(global, require(src('pais.js')));

let ok = 0, bad = 0;
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= Math.max(1e-9, Math.abs(b) * tol);
const eq = (n, a, b, tol) => { if (near(a, b, tol)) ok++; else { bad++; console.log('FALHA', n, a, b); } };
const chk = (n, c, extra) => { if (c) ok++; else { bad++; console.log('FALHA', n, extra !== undefined ? JSON.stringify(extra) : ''); } };
const igual = (n, a, b) => chk(n, JSON.stringify(a) === JSON.stringify(b), [a, b]);
const semRef = o => JSON.parse(JSON.stringify(o, (k, v) => /^ref/.test(k) ? undefined : v));
const lerJson = f => JSON.parse(fs.readFileSync(path.join(RAIZ, f), 'utf8'));

// ------------------------------------------------------------------ (1) verificador
const refs0 = lerJson('data/referencias.json'), pais0 = lerJson('data/paises.json');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'refs-'));
function rodar(refs, paises) {
  const a = path.join(TMP, 'r.json'), b = path.join(TMP, 'p.json');
  fs.writeFileSync(a, JSON.stringify(refs)); fs.writeFileSync(b, JSON.stringify(paises));
  const r = cp.spawnSync('python3', ['-I', path.join(RAIZ, 'tools', 'checar_referencias.py'), '--refs', a, '--paises', b], { encoding: 'utf8' });
  return { rc: r.status, err: r.stderr, out: r.stdout };
}
const clonar = o => JSON.parse(JSON.stringify(o));
const r0 = cp.spawnSync('python3', ['-I', path.join(RAIZ, 'tools', 'checar_referencias.py')], { encoding: 'utf8' });
chk('verificador: os dados de data/ passam', r0.status === 0, r0.stderr);
chk('verificador: diz quantas linhas e países', /referências ok: \d+ linhas .* 5 países/.test(r0.stdout), r0.stdout);
const quebra = (nome, f, padrao) => {
  const R = clonar(refs0), P = clonar(pais0); f(R, P);
  const x = rodar(R, P);
  chk('verificador rejeita: ' + nome, x.rc === 1 && padrao.test(x.err), x);
};
chk('verificador: cópia intacta passa', rodar(clonar(refs0), clonar(pais0)).rc === 0);
quebra('valor acima de alto', R => { R.referencias[0].alto = R.referencias[0].valor - 1; }, /baixo <= valor <= alto/);
quebra('valor abaixo de baixo', R => { R.referencias[0].baixo = R.referencias[0].valor + 1; R.referencias[0].alto = R.referencias[0].valor + 2; }, /baixo <= valor <= alto/);
quebra('grau fora de A, B, C', R => { R.referencias[1].grau = 'D'; }, /grau deve ser A, B ou C/);
quebra('moeda que não existe em moedas.json', R => { R.referencias[2].moeda = 'XXX'; }, /moeda 'XXX' não existe/);
quebra('escopo que não é global, região nem ISO3', R => { R.referencias[3].escopo = 'ZZZ9'; }, /escopo 'ZZZ9'/);
quebra('campo obrigatório ausente', R => { delete R.referencias[4].fonte; }, /campo "fonte" ausente/);
quebra('id repetido no mesmo escopo', R => { R.referencias[6].id = R.referencias[5].id; }, /repetido/);
quebra('versão ausente', R => { delete R.versao; }, /"versao" ausente/);
quebra('data de atualização fora do formato', R => { R.atualizado = '18/10/2026'; }, /"atualizado"/);
quebra('acesso fora do formato', R => { R.referencias[7].acesso = 'ontem'; }, /"acesso"/);
quebra('url que não é http', R => { R.referencias[8].fonte.url = 'ftp://x'; }, /url/);
quebra('convenção da ferramenta com grau A', R => { R.referencias[9].grau = 'A'; }, /só pode ter grau C/);
quebra('país com ISO3 inválido', (R, P) => { P.paises[0].iso3 = 'XYZ'; }, /iso3 inválido/);
quebra('país com moeda inexistente', (R, P) => { P.paises[1].moeda = 'ZZZ'; }, /moeda 'ZZZ'/);
quebra('país com região desconhecida', (R, P) => { P.paises[2].regiao = 'MARTE'; }, /região 'MARTE'/);
quebra('país com campo do perfil malformado', (R, P) => { P.paises[3].inflacao = { valor: 0.05 }; }, /null ou \{valor, fonte, ano\}/);
quebra('país com porcentagem fora de 0 a 100', (R, P) => { P.paises[4].pctUrbano = { valor: 180, fonte: 'x', ano: 2024 }; }, /porcentagem de 0 a 100/);
quebra('país repetido', (R, P) => { P.paises[1].iso3 = P.paises[0].iso3; }, /iso3 repetido/);
quebra('linha por país sem a linha global', R => { const l = clonar(R.referencias.find(x => x.id === 'sal.eng_ml')); l.escopo = 'BRA'; R.referencias = R.referencias.filter(x => x.id !== 'sal.eng_ml').concat([l]); }, /sem a linha global/);
chk('verificador aceita linha por país e por região quando há a global', (() => {
  const R = clonar(refs0), P = clonar(pais0);
  ['BRA', 'LAC'].forEach(e => { const l = clonar(R.referencias.find(x => x.id === 'sal.eng_ml')); l.escopo = e; l.valor = 70000; l.baixo = 63000; l.alto = 80500; l.grau = 'B'; l.fonte = { titulo: 'Estudo de teste', url: 'https://exemplo.org/estudo' }; R.referencias.push(l); });
  return rodar(R, P).rc === 0;
})());
// o build para quando o verificador falha: build.sh chama o verificador antes de montar a página
chk('build.sh roda o verificador e para se ele falhar', /checar_referencias\.py \|\| \{[^}]*exit 1/.test(fs.readFileSync(path.join(RAIZ, 'build.sh'), 'utf8')));

// ------------------------------------------------------------------ (2) valores-padrão = v13
const V13 = lerJson('tests/fixtures/valores_v13.json');
igual('SAL igual à v13', SAL, V13.SAL);
igual('OPC_PADRAO.pi e r iguais à v13', { pi: OPC_PADRAO.pi, r: OPC_PADRAO.r }, V13.OPC_PADRAO);
igual('os três exemplos (PRESETS) são os da v13', semRef(PRESETS), V13.PRESETS);
igual('PREMISSAS_K1 (dispositivo e conexão) iguais à v13', { precoDispositivo: PREMISSAS_K1.precoDispositivo, conectEscolaAno: PREMISSAS_K1.conectEscolaAno }, V13.PREMISSAS_K1);
igual('PREMISSAS_V11 (horas de formação e taxa do fornecedor) iguais à v13', { horasFormacao: PREMISSAS_V11.horasFormacao, horasFormacaoPorArq: PREMISSAS_V11.horasFormacaoPorArq, taxaFornecedor: PREMISSAS_V11.taxaFornecedor }, V13.PREMISSAS_V11);
['critico', 'elevado', 'moderado', 'limitado', 'minimo'].forEach(n => {
  const c = { pessoas: [], itens: [] }; governancaPorRisco(c, n);
  igual('governança por risco "' + n + '" igual à v13', semRef({ pessoas: c.pessoas, itens: c.itens }), V13.governanca[n]);
});
['A', 'B', 'C'].forEach(k => igual('faixas do tornado do exemplo ' + k + ' iguais às da v13', direcionadores(PRESETS[k]).map(d => ({ id: d.id, min: d.min, max: d.max })), V13.direcionadores[k]));
compArquiteturas(clone(PRESETS.C)).rows.forEach((r, i) => eq('comparação de arquiteturas, linha ' + i, r.tot, V13.compArquiteturas[i], 1e-12));
// o motor lê da base: mudar uma linha muda o preset
chk('PRESETS lê a base: construirPresets com outro valor muda o exemplo', (() => {
  const R = REF_DADOS.referencias, l = R.find(x => x.id === 'saas.preco'), antes = l.valor;
  l.valor = 10; l.alto = 12;
  const p = construirPresets().A.saas.preco; l.valor = antes; l.alto = 10.35;
  return p === 10 && construirPresets().A.saas.preco === 9;
})());
let erro = null; try { refValor('nao.existe'); } catch (e) { erro = e; }
chk('id que não existe na base é erro, não valor silencioso', erro && /falta a linha "nao\.existe"/.test(erro.message));

// ------------------------------------------------------------------ (3) toda linha da base é usada
const codigo = ['custos.js', 'casos.js', 'pais.js'].map(f => fs.readFileSync(src(f), 'utf8')).join('\n');
const orfas = REF_DADOS.referencias.filter(r => !codigo.includes("'" + r.id + "'") && !/^sal\./.test(r.id) && !/^v11\.fornecedor\./.test(r.id));
chk('toda linha da base aparece no código (' + REF_DADOS.referencias.length + ' linhas)', orfas.length === 0, orfas.map(r => r.id));
chk('os 8 salários e os 3 níveis do fornecedor são lidos por prefixo', PAPEIS_SAL.every(k => REF_DADOS.referencias.some(r => r.id === 'sal.' + k)) && ['basico', 'ampliado', 'dedicado'].every(k => REF_DADOS.referencias.some(r => r.id === 'v11.fornecedor.' + k)));
chk('as linhas semente são globais, de grau C, com a fonte convencionada e sem url', REF_DADOS.referencias.every(r => r.escopo === 'global' && r.grau === 'C' && r.fonte.titulo === 'Convenção da ferramenta (v13), ilustrativa' && r.fonte.url === null));
chk('a faixa de cada linha é a do tornado quando existe, senão valor = baixo = alto', REF_DADOS.referencias.every(r => r.baixo <= r.valor && r.valor <= r.alto));
['sal.gestor_produto', 'saas.preco', 'ow.gpu.hora', 'api.manutPct'].forEach(id => chk('linha com faixa (tornado): ' + id, refLinha(id).alto > refLinha(id).baixo));
chk('linha sem faixa conhecida tem baixo = valor = alto: k1.dispositivo', refLinha('k1.dispositivo').baixo === 300 && refLinha('k1.dispositivo').alto === 300);

// ------------------------------------------------------------------ (4) países e cadeia de recuo
const totDe = ctx => {
  const ids = Object.keys(ctx.etapas).filter(k => ctx.etapas[k].on);
  const al = id => { const e = ctx.etapas[id]; return (!e.soTotal && Array.isArray(e.anos) && e.anos.length) ? e.anos.reduce((a, b) => a + (+b || 0), 0) : +e.alunos || 0; };
  return { alunos: ids.reduce((s, id) => s + al(id), 0), escolas: ids.reduce((s, id) => s + (+ctx.etapas[id].escolas || 0), 0), etapas: ids };
};
const mk = (k, muda) => { const c = Object.assign(clone(CASOS[k]), muda || {}); const ce = casoEfetivo(c, totDe(CTX_EX[k])); return { caso: c, cfg: cfgDoCaso(ce, perfilFinal(ce)) }; };
const av = cfg => avaliar(calcular(cfg));

chk('5 países piloto, com moeda, região e grupo de renda; o resto nulo', listaPaises().length === 5 && ['BRA', 'MEX', 'KEN', 'MAR', 'IDN'].every(i => paisPorIso(i)) &&
  listaPaises().every(p => p.moeda && p.regiao && p.grupoRenda && p.grupoRenda.fonte === 'Banco Mundial, a verificar' && PAIS_CAMPOS.every(c => p[c.id] === null)));
igual('moedas dos pilotos', listaPaises().map(p => p.iso3 + p.moeda), ['BRABRL', 'MEXMXN', 'KENKES', 'MARMAD', 'IDNIDR']);
igual('escopos de um país: país, região, global', escoposDeCaso({ pais: 'BRA' }), ['BRA', 'LAC', 'global']);
chk('sem país, ou em "outro", não há escopos (vale só o global)', escoposDeCaso({}) === null && escoposDeCaso({ pais: 'outro' }) === null && escoposDeCaso({ pais: 'XXX' }) === null);
// só países com dado nulo e linhas globais: o resultado é o da v13, byte a byte, com ou sem país
['A', 'B', 'C', 'D'].forEach(k => {
  const base = mk(k), com = mk(k, { pais: 'BRA' });
  eq('exemplo ' + k + ': custo total igual com o Brasil escolhido (dados globais)', av(com.cfg).ctEco, av(base.cfg).ctEco, 1e-12);
  chk('exemplo ' + k + ': com país, cfg.escopos é a cadeia e nada mais muda', JSON.stringify(com.cfg.escopos) === JSON.stringify(['BRA', 'LAC', 'global']) && JSON.stringify(Object.assign({}, com.cfg, { escopos: undefined })) === JSON.stringify(base.cfg));
});
// linhas de região e de país na base e dados do perfil (mexe nos objetos carregados e restaura no fim)
const salBase = refValor('sal.eng_ml');
const nova = (id, escopo, valor, grau) => { const g = refLinha(id); const l = Object.assign({}, clone(g), { escopo, valor, baixo: valor * 0.9, alto: valor * 1.2, grau: grau || 'B', fonte: { titulo: 'Estudo de teste', url: null }, anoPreco: 2025 }); REF_DADOS.referencias.push(l); return l; };
const lReg = nova('sal.eng_ml', 'LAC', 70000), lBra = nova('sal.eng_ml', 'BRA', 80000, 'A');
eq('cadeia: sem escopos vale o global', refValor('sal.eng_ml'), salBase);
eq('cadeia: o país vence a região', refValor('sal.eng_ml', ['BRA', 'LAC', 'global']), 80000);
eq('cadeia: sem linha do país, vale a da região', refValor('sal.eng_ml', ['MEX', 'LAC', 'global']), 70000);
eq('cadeia: sem país nem região, vale o global', refValor('sal.eng_ml', ['KEN', 'SSA', 'global']), salBase);
chk('a origem da linha: país, região, ilustrativo', origemDaLinha(lBra) === 'pais' && origemDaLinha(lReg) === 'regiao' && origemDaLinha(refLinha('sal.eng_ml')) === 'ilustrativo');
const ex = (iso) => mk('B', { pais: iso });
const cB = ex('BRA'), cM = ex('MEX'), cK = ex('KEN'), c0 = mk('B');
eq('Brasil: salário de ML da linha do país no cfg', cB.cfg.salarios.eng_ml, 80000);
eq('México: salário de ML da linha da região', cM.cfg.salarios.eng_ml, 70000);
chk('Quênia: sem linha própria, o cfg não ganha tabela de salários e o resto não muda', cK.cfg.salarios === undefined && JSON.stringify(Object.assign({}, cK.cfg, { escopos: undefined })) === JSON.stringify(c0.cfg));
chk('o custo muda com a linha do país: Brasil > México > Quênia', av(cB.cfg).ctEco > av(cM.cfg).ctEco && av(cM.cfg).ctEco > av(cK.cfg).ctEco, [av(cB.cfg).ctEco, av(cM.cfg).ctEco, av(cK.cfg).ctEco]);
// premissasDoCaso: origens
const P_B = premissasDoCaso(cB.caso, cB.cfg), P_M = premissasDoCaso(cM.caso, cM.cfg), P_K = premissasDoCaso(cK.caso, cK.cfg);
const campoP = (L, id) => L.find(x => x.campo === id);
chk('premissasDoCaso, Brasil: salário de ML vem do país, grau A', campoP(P_B, 'sal.eng_ml') && campoP(P_B, 'sal.eng_ml').origem === 'pais' && campoP(P_B, 'sal.eng_ml').grau === 'A' && campoP(P_B, 'sal.eng_ml').ano === 2025 && campoP(P_B, 'sal.eng_ml').fonte === 'Estudo de teste', campoP(P_B, 'sal.eng_ml'));
chk('premissasDoCaso, México: vem da região', campoP(P_M, 'sal.eng_ml').origem === 'regiao' && campoP(P_M, 'sal.eng_ml').valor === 70000);
chk('premissasDoCaso, Quênia: valor ilustrativo, grau C', campoP(P_K, 'sal.eng_ml').origem === 'ilustrativo' && campoP(P_K, 'sal.eng_ml').grau === 'C' && campoP(P_K, 'sal.eng_ml').valor === salBase);
REF_DADOS.referencias.splice(REF_DADOS.referencias.indexOf(lBra), 1); REF_DADOS.referencias.splice(REF_DADOS.referencias.indexOf(lReg), 1);
eq('a base volta ao que era', refValor('sal.eng_ml', ['BRA', 'LAC', 'global']), salBase);

// perfil do país: dado do país → editado → restaurado; inflação e taxa de desconto, salário do professor, escolas com internet entram no motor
const BRA = paisPorIso('BRA');
BRA.inflacao = { valor: 0.045, fonte: 'IBGE (teste)', ano: 2025 };
BRA.taxaDesconto = { valor: 0.06, fonte: 'Guia de teste', ano: 2024 };
BRA.salarioProfessor = { valor: 17600, fonte: 'MEC (teste)', ano: 2025 };
BRA.pctEscolasInternet = { valor: 60, fonte: 'Censo (teste)', ano: 2024 };
BRA.escolas = { valor: 1000, fonte: 'Censo (teste)', ano: 2024 };
const caso = Object.assign(clone(CASOS.B), { pais: 'BRA', internet: 'parcial', escolasInternet: '' });
const ce = casoEfetivo(caso, { alunos: 0, escolas: 0 }), cfgP = cfgDoCaso(ce, perfilFinal(ce));
let e = valorEfetivoCampo(caso, 'inflacao');
chk('inflação: dado do país', e.origem === 'pais' && e.valor === 0.045 && e.fonte === 'IBGE (teste)' && e.ano === 2025, e);
eq('inflação do país entra em cfg.opc.pi', cfgP.opc.pi, 0.045);
eq('taxa de desconto do país entra em cfg.opc.r', cfgP.opc.r, 0.06);
eq('salário do professor define o custo da hora de formação (÷ 1.760 h)', cfgP.formacaoTempo.custoHora, 17600 / 1760);
chk('número de escolas do país vale quando o contexto não informa escolas', cfgP.v11.escolas.some(n => n > 0) && cfgP.v11.internet.fracaoSem === 0.4, [cfgP.v11.escolas, cfgP.v11.internet]);
caso.editados = { inflacao: 0.03 };
e = valorEfetivoCampo(caso, 'inflacao');
chk('inflação editada: origem "usuario", com o valor da base guardado', e.origem === 'usuario' && e.valor === 0.03 && e.padrao === 0.045 && e.origemPadrao === 'pais', e);
restaurarCampoPais(caso, 'inflacao');
e = valorEfetivoCampo(caso, 'inflacao');
chk('restaurar devolve o dado do país', e.origem === 'pais' && e.valor === 0.045);
// inflação com linha da região (sem dado do país): "estimado pela região"
const MEXc = { pais: 'MEX' };
const lInf = nova('macro.inflacao', 'LAC', 0.06);
e = valorEfetivoCampo(MEXc, 'inflacao');
chk('inflação do México: estimada pela região', e.origem === 'regiao' && e.valor === 0.06, e);
REF_DADOS.referencias.splice(REF_DADOS.referencias.indexOf(lInf), 1);
e = valorEfetivoCampo(MEXc, 'inflacao');
chk('sem linha da região, a inflação do México é o valor ilustrativo global', e.origem === 'ilustrativo' && e.valor === 0.025 && e.grau === 'C');
chk('sem país, a inflação é o valor ilustrativo', valorEfetivoCampo({}, 'inflacao').origem === 'ilustrativo' && valorEfetivoCampo({ pais: 'outro' }, 'taxaDesconto').valor === 0);
chk('campo sem dado nem padrão não tem valor (nada é inventado)', valorEfetivoCampo({ pais: 'MEX' }, 'salarioProfessor') === null && valorEfetivoCampo({}, 'escolas') === null);
// escolherPais zera as edições e devolve o perfil
const cc = { pais: '', editados: { inflacao: 0.1 } };
chk('escolherPais grava o ISO3, zera as edições e devolve o perfil', escolherPais(cc, 'KEN').iso3 === 'KEN' && cc.pais === 'KEN' && Object.keys(cc.editados).length === 0);
chk('escolherPais aceita "outro" e rejeita código desconhecido', escolherPais(cc, 'outro') === null && cc.pais === 'outro' && (escolherPais(cc, 'QQQ'), cc.pais === ''));
// leitura dos campos
eq('lerValorCampo: inflação digitada em % vira fração', lerValorCampo(PAIS_CAMPO_POR_ID.inflacao, '4,5'), 0.045);
chk('lerValorCampo: lista de idiomas, porcentagem limitada e vazio', JSON.stringify(lerValorCampo(PAIS_CAMPO_POR_ID.idiomas, 'pt, ES;fr')) === '["pt","es","fr"]' && lerValorCampo(PAIS_CAMPO_POR_ID.pctUrbano, '180') === 100 && lerValorCampo(PAIS_CAMPO_POR_ID.escolas, '') === '');

// ------------------------------------------------------------------ (5) premissasDoCaso e versaoReferencias
const sem = mk('A');
const PL = premissasDoCaso(sem.caso, sem.cfg);
const CAMPOS_PREM = ['campo', 'rotulo', 'valor', 'unidade', 'origem', 'fonte', 'ano', 'grau', 'foraDaFaixa'];
chk('premissasDoCaso devolve uma lista com todos os campos do contrato', Array.isArray(PL) && PL.length > 10 && PL.every(x => CAMPOS_PREM.every(k => k in x)), PL.find(x => !CAMPOS_PREM.every(k => k in x)));
chk('origens possíveis: pais, regiao, usuario, ilustrativo', PL.every(x => ['pais', 'regiao', 'usuario', 'ilustrativo'].includes(x.origem)));
chk('sem país e sem edição, tudo é ilustrativo, grau C, dentro da faixa', PL.every(x => x.origem === 'ilustrativo' && x.grau === 'C' && x.foraDaFaixa === false), PL.filter(x => x.origem !== 'ilustrativo'));
chk('exemplo A: preço da licença (9), salários usados e inflação aparecem', campoP(PL, 'saas.preco').valor === 9 && campoP(PL, 'sal.gestor_produto') && campoP(PL, 'macro.inflacao') === undefined && campoP(PL, 'inflacao').valor === 0.025 && campoP(PL, 'taxaDesconto').valor === 0);
chk('exemplo A: só entram os custos que o caso usa (não há preço de GPU nem de token)', !campoP(PL, 'ow.gpu.hora') && !campoP(PL, 'api.modelo_intermediario.Pin'));
chk('exemplo A: rótulo e unidade vêm da linha da base', campoP(PL, 'saas.preco').rotulo === 'Preço da licença por usuário' && campoP(PL, 'saas.preco').unidade === 'US$ por licença por mês' && campoP(PL, 'saas.preco').ano === 2026 && campoP(PL, 'saas.preco').fonte === 'Convenção da ferramenta (v13), ilustrativa');
// valores editados no painel de custos: "usuario" e fora da faixa
const cfgE = clone(sem.cfg); cfgE.saas.preco = 20; cfgE.salarios = Object.assign({}, SAL, { eng_integracao: 46000 });
const PE = premissasDoCaso(sem.caso, cfgE);
chk('preço da licença 20 (faixa 8,55 a 10,35): origem usuario e fora da faixa', campoP(PE, 'saas.preco').origem === 'usuario' && campoP(PE, 'saas.preco').valor === 20 && campoP(PE, 'saas.preco').foraDaFaixa === true, campoP(PE, 'saas.preco'));
chk('salário 46.000 (faixa 40.500 a 51.750): usuario, dentro da faixa', campoP(PE, 'sal.eng_integracao').origem === 'usuario' && campoP(PE, 'sal.eng_integracao').foraDaFaixa === false);
chk('os demais continuam ilustrativos', PE.filter(x => !['saas.preco', 'sal.eng_integracao'].includes(x.campo)).every(x => x.origem === 'ilustrativo'));
const cfgF = clone(sem.cfg); cfgF.saas.preco = 8.0;
chk('abaixo de baixo também é sinalizado', campoP(premissasDoCaso(sem.caso, cfgF), 'saas.preco').foraDaFaixa === true);
const cfgG = clone(sem.cfg); cfgG.saas.preco = 10.35;
chk('no limite de alto não é sinalizado', campoP(premissasDoCaso(sem.caso, cfgG), 'saas.preco').foraDaFaixa === false);
const cfgH = clone(sem.cfg); cfgH.opc = { H: 3, pi: 0.05 };
chk('inflação alterada no painel: usuario', campoP(premissasDoCaso(sem.caso, cfgH), 'inflacao').origem === 'usuario' && campoP(premissasDoCaso(sem.caso, cfgH), 'inflacao').valor === 0.05);
// o custo da formação com o salário do país: a origem é a do salário
chk('custo da hora de formação derivado do salário do professor tem a origem do salário (pais)', (() => {
  const L = premissasDoCaso(caso, cfgP), h = L.find(x => /^formacao\.custoHora\./.test(x.campo));
  return h && h.origem === 'pais' && h.fonte === 'MEC (teste)' && L.some(x => x.campo === 'conv.horasAno');
})(), premissasDoCaso(caso, cfgP).filter(x => /custoHora/.test(x.campo)));
chk('perfil do país com valor aparece em premissasDoCaso, com fonte, ano e origem', (() => {
  const L = premissasDoCaso(caso, cfgP), x = L.find(y => y.campo === 'inflacao'), s = L.find(y => y.campo === 'salarioProfessor');
  return x.origem === 'pais' && x.fonte === 'IBGE (teste)' && x.ano === 2025 && s.valor === 17600 && s.origem === 'pais';
})());
chk('premissasDoCaso com um valor editado do perfil: usuario', (() => { const c = Object.assign(clone(caso), { editados: { salarioProfessor: 20000 } }); const L = premissasDoCaso(c); const s = L.find(y => y.campo === 'salarioProfessor'); return s.origem === 'usuario' && s.valor === 20000; })());
// as exemplos A, B, C e D listam premissas coerentes com a arquitetura
const quais = k => premissasDoCaso(mk(k).caso, mk(k).cfg).map(x => x.campo);
chk('exemplo D (API e RAG): preços de token, embeddings, serviços mensais e implantação', ['api.modelo_intermediario.Pin', 'api.modelo_intermediario.Pout', 'api.modelo_pequeno.Pin', 'rag.embeddings', 'api.mensal.hospedagem', 'api.implantacao', 'api.manutPct'].every(i => quais('D').includes(i)), quais('D'));
chk('exemplo B (pesos abertos): hora de GPU e de segurança, implantação e governança de risco elevado', ['ow.gpu.hora', 'ow.seg.hora', 'ow.implantacao', 'gov.avaliacaoImpacto', 'gov.testesAdversariais'].every(i => quais('B').includes(i)), quais('B'));
const vv = versaoReferencias();
chk('versaoReferencias: versão, data e contagem das duas bases', vv.referencias === refs0.versao && vv.atualizado === refs0.atualizado && vv.linhas === refs0.referencias.length && vv.paises === pais0.versao && vv.nPaises === 5 && /referências v1\.0\.0/.test(vv.texto), vv);

// ------------------------------------------------------------------ (6) faixa de referência de um campo do painel (BL4.3)
const cfgA = clone(PRESETS.A);
let f = faixaDoCampo(cfgA, 'saas.preco', null);
chk('faixaDoCampo: preço da licença 9, faixa 8,55 a 10,35, dentro', f && f.valor === 9 && f.baixo === 8.55 && f.alto === 10.35 && f.fora === false && f.semFaixa === false && f.grau === 'C');
f = faixaDoCampo(cfgA, 'saas.preco', null, 11);
chk('faixaDoCampo: valor 11 digitado, fora da faixa', f.fora === true && f.valor === 11);
f = faixaDoCampo(cfgA, 'salarios.eng_ml', null, 100000);
chk('faixaDoCampo: salário 100.000 fora da faixa (54.000 a 69.000)', f.fora === true && f.baixo === 54000 && f.alto === 69000);
f = faixaDoCampo(cfgA, 'implantacao.0.valor', null, 400000);
chk('faixaDoCampo: implantação sem faixa conhecida não é sinalizada, mesmo longe do valor da base', f && f.semFaixa === true && f.fora === false && f.linha.valor === 40000);
chk('faixaDoCampo: itens por ano (formação) usam a linha do ano', faixaDoCampo(cfgA, 'itens.2.v.0', null).linha.valor === 20000 && faixaDoCampo(cfgA, 'itens.2.v.2', null).linha.valor === 12000 && faixaDoCampo(cfgA, 'itens.2.v.0', null).id === 'saas.formacao.ano0');
chk('faixaDoCampo: campo sem linha na base devolve null', faixaDoCampo(cfgA, 'saas.qtd.1', null) === null && faixaDoCampo(cfgA, 'demanda.s', null) === null);
chk('faixaDoCampo: a linha do país vale quando há país', (() => {
  const l = nova('saas.preco', 'BRA', 6); const r = faixaDoCampo(cfgA, 'saas.preco', { pais: 'BRA' }, 7);
  REF_DADOS.referencias.splice(REF_DADOS.referencias.indexOf(l), 1);
  return r.origem === 'pais' && r.baixo === 5.4 && r.fora === false && faixaDoCampo(cfgA, 'saas.preco', { pais: 'BRA' }, 7).baixo === 8.55;
})());
const cfgBp = clone(PRESETS.B);
chk('faixaDoCampo: preço de token do exemplo B e manutenção da implantação (16% a 30%)', faixaDoCampo(cfgBp, 'api.Pin', null).baixo === 1.6 && faixaDoCampo(cfgBp, 'api.Pout', null).alto === 12.5 && faixaDoCampo(cfgBp, 'implantacao.0.manutPct', null).baixo === 0.16 && faixaDoCampo(cfgBp, 'mensais.1.valor', null).id === 'api.mensal.hospedagem');

fs.rmSync(TMP, { recursive: true, force: true });
console.log('\nverificações: ' + ok + ' ok, ' + bad + ' falhas');
process.exit(bad ? 1 : 0);
