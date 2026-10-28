// =====================================================================
// Percurso em quatro fases (v11): a parte de LÓGICA de src/fluxo.js (dados em fluxo_dados.js), mais os
// derivados do caso que viviam em src/app.js (casoAtual, perfil, cfgAtual).
// Reimplementação: a global S virou o parâmetro `estado` ({ caso, ctx, resp, respC, respDet, custo, moeda,
// exemplo, feitos, revisar }), passado a todas as funções que o liam. Telas, acordeões, mandala, painel e
// eventos ficam fora do domínio (substituídos pela interface nova).
// =====================================================================
import { clone, ano, arquitetura, calcular, avaliar, somaPorCamada, indicadores, orcamento, PRESETS } from './custos.js';
import { OPC, ORDEM_FREQ, casoEfetivo, perfilFinal, fmtInt } from './framework.js';
import { CASO_VAZIO, PREMISSAS_K1, PREMISSAS_V11, horasFormacaoEstimada, cfgDoCaso } from './casos.js';
import { problemasMarcados, sugestoesProblemas, temLacuna } from './prioridades.js';
import { FASES, PASSOS, PASSO_INFO, ETAPAS_ENS, QUESTOES_G, CAMPOS } from './fluxo_dados.js';
import { LOC, tr } from './i18n.js';
import { din, pct, garantirOpc } from './custos_ui.js';
import { camposDescidos } from './matriz.js';

const CAMPO_POR_ID = {};
CAMPOS.forEach(f => { CAMPO_POR_ID[f.id] = f; });
// v11: um campo do caso cujo valor em CASO_VAZIO não é vazio só conta depois que a pessoa responde
if (typeof CASO_VAZIO !== 'undefined') CAMPOS.forEach(f => {
  const v = CASO_VAZIO[f.id];
  if (f.onde === 'caso' && !f.padrao && ['radio', 'chips', 'multi'].includes(f.tipo) && !(v == null || v === '' || (Array.isArray(v) && !v.length))) f.padrao = true;
});
const CAMPOS_SUGERIDOS = ['usuarios', 'afetados', 'consequencias', 'frequencia'];
// v13: campos sugeridos pelos problemas marcados no passo 1.2 (sugestoesProblemas, prioridades.js); olhando fica em estado.ctx
const CAMPOS_PROB = ['olhando', 'problema', 'impactos', 'resultado', 'tarefas'];
// Passos sem perguntas (4.2 estimativa, 4.3 recomendações): concluídos quando abertos
const PASSOS_VER = ['4b', '4c'];
// Premissas de partida por arquitetura (antes em src/resumo.js, PRESET_ARQ; usadas por premissasUnitarias e formula.js)
const PRESET_ARQ = { saas: 'Exemplo A do guia (cap. 12): produto pronto por licença', api: 'Exemplo B do guia (cap. 12): aplicação com modelo por API e base de conhecimento', ow: 'Exemplo C do guia (cap. 12): modelo de pesos abertos em infraestrutura contratada' };

// ----------------------------------------------------------- estado
const SUB_OBJ = { piloto: ['escolas', 'participantes', 'meses'], poc: ['participantes', 'meses'], implantacao: ['escolas', 'pessoas'] };
function objVazio(k) { const o = {}; SUB_OBJ[k].forEach(x => { o[x] = ''; }); return o; }
// 2.0: testes marcados (compatível com o campo antigo "teste") e modo derivado
function testesDe(c) {
  c = c || {};
  const t = Array.isArray(c.testes) ? c.testes : [];
  if (!t.length && c.teste) return c.teste === 'ambos' ? ['poc', 'piloto'] : [c.teste];
  return t;
}
// 'poc' | 'piloto' | 'ambos' | 'recomendar' | ''
function modoTeste(c) {
  const t = testesDe(c);
  if (t.includes('recomendar')) return 'recomendar';
  if (t.includes('poc') && t.includes('piloto')) return 'ambos';
  return t[0] || '';
}
// v13 (RQ-13): com prova de conceito ou piloto no 2.0, as perguntas da camada 2 de camposDescidos (matriz.js)
// saem dos passos 2.2 e 2.3 e passam a contar no passo 3.1; em 2.2 e 2.3 continuam num <details> "Para a implantação".
function descidos(caso) { return typeof camposDescidos === 'function' ? camposDescidos(caso || {}) : []; }
function passoDe(f, caso) { return f && descidos(caso).includes(f.id) ? '3a' : f ? f.passo : ''; }
// Destino de "Ir à pergunta" (fase:passo:número), na distribuição atual dos passos
function irCampo(f, caso) { const p = passoDe(f, caso); return fasePasso(p) + ':' + p + ':' + f.n.replace(/\./g, '-'); }
// A pergunta aparece? (condição "se" do registro CAMPOS)
function visivel(f, caso) { try { return !f.se || !!f.se(caso || {}); } catch (e) { return true; } }
// Num caso em branco, um campo com valor padrão só conta depois que a pessoa responde.
function respondido(campo, estado) { return estado.exemplo !== 'novo' || !!(estado.respC || {})[campo]; }

// ----------------------------------------------------------- cálculos
function etapasAtivas(ctx) { return ETAPAS_ENS.filter(e => (((ctx || {}).etapas || {})[e[0]] || {}).on); }
function alunosEtapa(ctx, id) {
  const e = ((ctx || {}).etapas || {})[id] || {};
  const def = ETAPAS_ENS.find(x => x[0] === id);
  const temAnos = def && def[3].length;
  if (!temAnos || e.soTotal) return +e.alunos || 0;
  return (Array.isArray(e.anos) ? e.anos : []).reduce((a, b) => a + (+b || 0), 0);
}
function totaisCtx(ctx) {
  if (!ctx || !ctx.etapas) return { escolas: 0, alunos: 0, n: 0, etapas: [] };
  const at = etapasAtivas(ctx);
  return { escolas: at.reduce((a, e) => a + (+(ctx.etapas[e[0]] || {}).escolas || 0), 0), alunos: at.reduce((a, e) => a + alunosEtapa(ctx, e[0]), 0), n: at.length, etapas: at.map(e => e[0]) };
}
function rotulo(lista, v) { return ((lista || []).find(o => String(o[0]) === String(v)) || ['', ''])[1]; }
function listaOpc(f) { return typeof f.opc === 'string' ? ((typeof OPC !== 'undefined' && OPC[f.opc]) || []) : (f.opc || []); }
function valorCampo(f, estado) {
  if (f.onde === 'resp') return (estado.resp || {})[f.id];
  if (f.onde === 'ctx') return (estado.ctx || {})[f.id];
  return (estado.caso || {})[f.id];
}
function vazio(v) { return v == null || v === '' || (Array.isArray(v) && !v.length); }
function textoCampo(f, caso) { const m = modoTeste(caso); return m === 'poc' && f.tPoc ? f.tPoc : m === 'ambos' && f.tAmbos ? f.tAmbos : f.t; }

// ----------------------------------------------------------- padrões gerados (v10, ampliados na v11)
// Nada vem marcado antes de a pessoa agir. Quando ela marca uma resposta de origem, os campos que dependem
// dela recebem um valor sugerido ("sugerido"), que só conta depois de confirmado (estado.respC), como no passo 2.2.
// Mudar a origem recalcula só as sugestões ainda não confirmadas.
//   2.0 testes → 2.3.8 tamanho e duração (PoC, piloto ou os dois); 2.3.4 tipo de tecnologia → 2.3.5 pagamento e 2.3.6 licença;
//   2.4.3 dispositivos próprios → 2.4.4 "já existem"; 2.2.1 usuários (confirmados) → 4.1.1 pessoas na rede;
//   4.1.1 pessoas na rede (ou as etapas do 1.1) → 3.1.1 primeira etapa (1/3); botão "Usar uma estimativa" → 2.5.4 horas.
// v13: 2.0 respondida → 2.3.1 "Uma" ferramenta; problemas marcados no 1.2 → 1.2.3, 1.2.4, 1.2.5, 1.2.6 e 2.1.1 (CAMPOS_PROB).
const PAG_LIC = { publica: ['gratuito', 'termos'], aberta: ['consumo', 'aberta'], paga: ['institucional', 'assinatura'] };
const ALUNOS_POR_PROF = 25;   // premissa ilustrativa: 1 professor para cada 25 estudantes
// premissa ilustrativa (casos.js, PREMISSAS_V11): a primeira etapa da implantação alcança 1/3 das pessoas e das escolas
const FRACAO_IMPLANT = typeof PREMISSAS_V11 !== 'undefined' && +PREMISSAS_V11.implantacaoFracao > 0 ? +PREMISSAS_V11.implantacaoFracao : 1 / 3;
const CAMPOS_GERADOS = ['pagamento', 'licenca', 'elegiveis', 'dispExistem', 'nFerramentas'];
// Horas de formação por pessoa da estimativa ilustrativa (premissa do motor, se houver)
function horasEstimativa(caso) {
  if (typeof horasFormacaoEstimada === 'function') { try { const h = +horasFormacaoEstimada(caso); if (h > 0) return h; } catch (e) { } }
  const P = typeof PREMISSAS_V11 !== 'undefined' ? PREMISSAS_V11 : {};
  const h = +(P.horasFormacao || (P.formacao && P.formacao.horas) || 0);
  return h > 0 ? h : 8;
}
// Usuários de 2.2.1 já confirmados pela pessoa (uma sugestão das tarefas ainda não conta)
function usuariosMarcados(estado) { return (estado.respC || {}).usuarios || estado.exemplo !== 'novo' ? ((estado.caso || {}).usuarios || []) : []; }
// Base de pessoas para as sugestões: estudantes das etapas ou, se só professores usam, a estimativa de professores
function basePessoas(estado) {
  const u = usuariosMarcados(estado), al = totaisCtx(estado.ctx).alunos;
  if (!(al > 0)) return { n: 0, prof: false };
  if (!u.length || u.includes('estudantes')) return { n: al, prof: false };
  if (u.includes('professores')) return { n: Math.max(1, Math.round(al / ALUNOS_POR_PROF)), prof: true };
  return { n: 0, prof: false };
}
// Origem da sugestão do 3.1.1: 'eleg' (resposta 4.1.1) | 'etapas' (passo 1.1) | ''
function origemImplantacao(estado) { const t = totaisCtx(estado.ctx); return +(estado.caso || {}).elegiveis > 0 ? 'eleg' : t.alunos > 0 || t.escolas > 0 ? 'etapas' : ''; }
function padroesGerados(estado) {
  const c = estado.caso || {}, t = totaisCtx(estado.ctx), g = {}, m = modoTeste(c);
  if (m === 'poc' || m === 'ambos') g.poc = { participantes: 15, meses: 2 };
  if (m === 'piloto' || m === 'recomendar' || m === 'ambos') {
    const b = basePessoas(estado);
    g.piloto = {
      escolas: t.escolas > 0 ? Math.min(t.escolas, Math.max(3, Math.min(30, Math.round(0.05 * t.escolas)))) : '',
      participantes: b.n > 0 ? Math.max(1, Math.round(0.05 * b.n)) : '',
      meses: 4,
    };
  }
  const pl = PAG_LIC[c.tipoTec];
  if (pl) { g.pagamento = pl[0]; g.licenca = pl[1]; }
  if (testesDe(c).length) g.nFerramentas = '1';
  const u = usuariosMarcados(estado);
  if (u.length) { const b = basePessoas(estado); if (b.n > 0) g.elegiveis = b.n; }
  if (c.modeloDisp === 'proprio') g.dispExistem = 'sim';
  const o = origemImplantacao(estado);
  if (o) {
    const E = o === 'eleg' ? +c.elegiveis : basePessoas(estado).n;
    g.implantacao = { escolas: t.escolas > 0 ? Math.max(1, Math.round(FRACAO_IMPLANT * t.escolas)) : '', pessoas: E > 0 ? Math.max(1, Math.round(FRACAO_IMPLANT * E)) : '' };
  }
  return g;
}
// v13: sugestões dos problemas marcados no passo 1.2 (só nos campos ainda não confirmados)
function sugProblemas(ctx) { return typeof sugestoesProblemas === 'function' ? sugestoesProblemas(ctx || {}, tr) : null; }
// Marca como confirmados os valores já preenchidos dos campos gerados (exemplos e estados anteriores à v10)
function confirmarGerados(caso, respC) {
  CAMPOS_GERADOS.concat(['formacaoHoras']).forEach(k => { if (!vazio(caso[k])) respC[k] = true; });
  Object.keys(SUB_OBJ).forEach(o => { const p = caso[o] || {}; SUB_OBJ[o].forEach(k => { if (!vazio(p[k])) respC[o + '.' + k] = true; }); });
}
// Subcampos (objeto.chave) de uma pergunta de tamanho: 2.3.8 conforme a resposta 2.0; 3.1.1
function subcampos(f, caso) {
  if (f.id === 'implantacao') return SUB_OBJ.implantacao.map(k => ['implantacao', k]);
  if (f.id !== 'piloto') return [];
  const m = modoTeste(caso), L = [];
  if (m === 'poc' || m === 'ambos') SUB_OBJ.poc.forEach(k => L.push(['poc', k]));
  if (m !== 'poc') SUB_OBJ.piloto.forEach(k => L.push(['piloto', k]));
  return L;
}
// O campo mostra um valor gerado ainda não confirmado pela pessoa?
function sugerido(f, estado) {
  if (!f) return false;
  const respC = estado.respC || {}, caso = estado.caso || {};
  if (f.sugere) return !respC[f.id] && (caso.tarefas || []).length > 0;
  if (f.tipo === 'horas') return !respC[f.id] && !!caso.formacaoEstimativa && !vazio(caso[f.id]);
  if (!f.sugDe) return false;
  if (f.sugDe === 'problemas' && (respC[f.id] || !((sugProblemas(estado.ctx) || {}).n > 0))) return false;
  if (f.tipo === 'setup' || f.tipo === 'implant') return subcampos(f, caso).some(([o, k]) => !respC[o + '.' + k] && !vazio((caso[o] || {})[k]));
  return !respC[f.id] && !vazio(valorCampo(f, estado));
}
function textoSugerido(f, estado) {
  if (f.sugere) return 'sugerido pela tarefa';
  if (f.tipo === 'horas') return 'estimativa ilustrativa';
  if (f.id === 'implantacao') return origemImplantacao(estado) === 'eleg' ? 'sugerido pela resposta 4.1.1' : 'sugerido pelas etapas do passo 1.1';
  return { problemas: 'sugerido pelos problemas do passo 1.2', testes: 'sugerido pela resposta 2.0', tipoTec: 'sugerido pela resposta 2.3.4', usuarios: 'sugerido pela resposta 2.2.1', modeloDisp: 'sugerido pela resposta 2.4.3' }[f.sugDe] || 'sugerido';
}
// A pergunta está respondida? f: objeto de CAMPOS ou o id do campo. Com semSug, considera as sugestões como se estivessem confirmadas.
function qOk(f, estado, semSug) {
  if (typeof f === 'string') f = CAMPO_POR_ID[f];
  if (!f) return false;
  const x = estado.ctx || {}, c = estado.caso || {}, v = valorCampo(f, estado);
  switch (f.tipo) {
    case 'seg': return !!(estado.resp || {})[f.id];
    case 'etapas': return etapasAtivas(x).length > 0;
    case 'grade': { const at = etapasAtivas(x); return at.length > 0 && at.every(e => +(x.etapas[e[0]] || {}).escolas > 0 && alunosEtapa(x, e[0]) > 0); }
    case 'prior': return (x.prioridades || []).length > 0;
    case 'problemas': return (typeof problemasMarcados === 'function' && problemasMarcados(x).length > 0) || !!String(x.problemaOutro || '').trim();
    // v13: texto com lacunas "__" (objetivos e modelos sugeridos) não conta como respondido
    case 'texto': case 'area': return !!String(v || '').trim() && !temLac(v) && (semSug || !sugerido(f, estado));
    case 'num': case 'horas': return +v > 0 && (semSug || !sugerido(f, estado));
    case 'testes': return testesDe(c).length > 0;
    case 'ferramentas': { const L = c.ferramentas || []; return L.length > 0 && L.every(t => !!String(t.nome || '').trim()); }
    case 'setup': case 'implant': {
      const sc = subcampos(f, c);
      return sc.length > 0 && sc.every(([o, k]) => +(c[o] || {})[k] > 0 || (o === 'implantacao' && k === 'escolas' && !(totaisCtx(x).escolas > 0))) && (semSug || !sugerido(f, estado));
    }
    case 'arq': return !!c.arquitetura;
    default:
      if (vazio(v)) return false;
      if (!semSug && sugerido(f, estado)) return false;
      return f.padrao ? respondido(f.id, estado) || (semSug && sugerido(f, estado)) : true;
  }
}
function temLac(v) { return typeof temLacuna === 'function' ? temLacuna(v) : String(v || '').includes('__'); }
// Perguntas de um passo na distribuição atual: no 3.1, depois das próprias, as da camada 2 que desceram (RQ-13)
function camposPasso(id, estado) {
  const caso = estado.caso || {}, d = descidos(caso);
  const L = CAMPOS.filter(f => f.passo === id && !d.includes(f.id) && visivel(f, caso));
  return id === '3a' && d.length ? L.concat(CAMPOS.filter(f => d.includes(f.id) && visivel(f, caso))) : L;
}
// Perguntas da camada 2 que desceram para a implantação e que nasceram neste passo (2.2 ou 2.3)
function camposDescidosPasso(id, estado) { const caso = estado.caso || {}, d = descidos(caso); return CAMPOS.filter(f => f.passo === id && d.includes(f.id) && visivel(f, caso)); }
// Perguntas obrigatórias ainda sem resposta num passo (objetos de CAMPOS)
function faltas(id, estado) { return camposPasso(id, estado).filter(f => !f.opcional && !qOk(f, estado)); }
function passoFeito(id, estado) { return PASSOS_VER.includes(id) ? !!(estado.feitos || {})[id] : !faltas(id, estado).length; }
function estadoPasso(id, estado) {
  if (passoFeito(id, estado)) return 'ok';
  if (!PASSOS_VER.includes(id) && camposPasso(id, estado).some(f => qOk(f, estado))) return 'andamento';
  return '';
}
function fasePasso(id) { return Object.keys(PASSOS).find(f => PASSOS[f].some(p => p[0] === id)); }
function numPasso(id) { return (PASSO_INFO[id] || {}).num || id; }
function nomePasso(id) { const f = fasePasso(id); return f ? (PASSOS[f].find(p => p[0] === id) || ['', ''])[1] : ''; }
function progressoFase(fid, estado) {
  const ps = PASSOS[fid]; const feitos = ps.filter(([id]) => passoFeito(id, estado)).length;
  return { feitos, total: ps.length, pct: feitos / ps.length, completa: feitos === ps.length };
}
function idQ(n) { return 'q-' + String(n).replace(/\./g, '-'); }
// Todas as perguntas sem resposta, para o plano de contratação
function faltasTodas(estado) {
  const out = [];
  FASES.forEach(fa => PASSOS[fa.id].forEach(([pid]) => faltas(pid, estado).forEach(f => out.push({ n: f.n, id: f.id, texto: textoCampo(f, estado.caso), passo: pid, ir: fa.id + ':' + pid + ':' + f.n.replace(/\./g, '-') }))));
  return out;
}
function questoesGov() { return QUESTOES_G; }
// Números da estimativa a partir da cfg (antes lia cfgAtual())
function numerosCusto(cfg) {
  garantirOpc(cfg);
  const av = avaliar(calcular(cfg)), ind = indicadores(cfg, av), orc = orcamento(cfg);
  const T = av.r.anos.filter(t => t > 0);
  const anual = T.length ? T.reduce((s, t) => s + (orc.dot[t] || 0), 0) / T.length : 0;
  let camadas = null;
  try { if (typeof somaPorCamada === 'function') camadas = somaPorCamada(av); } catch (e) { camadas = null; }
  return { av, ind, orc, H: av.r.H, piloto: orc.dot[0] || 0, ano0: (av.ecoAno || [])[0] || 0, anual, porAluno: ind.icu, total: av.ctEco, camadas };
}
// União da resposta confirmada com a sugestão nova (listas) ou a frequência mais alta das duas
function juntarSugestao(k, atual, sug) {
  if (!Array.isArray(sug)) {
    const O = typeof ORDEM_FREQ !== 'undefined' ? ORDEM_FREQ : [];
    if (!atual) return sug;
    return k === 'frequencia' && O.indexOf(sug) > O.indexOf(atual) ? sug : atual;
  }
  const lista = (Array.isArray(atual) ? atual : []).concat(sug.filter(v => !(atual || []).includes(v)));
  const ids = (typeof OPC !== 'undefined' && OPC[k] ? OPC[k] : []).map(o => o[0]);
  let out = ids.filter(v => lista.includes(v)).concat(lista.filter(v => !ids.includes(v)));
  if (k === 'consequencias' && out.length > 1) out = out.filter(v => v !== 'nenhuma');
  return out;
}

// Premissas unitárias da estimativa, tiradas da cfg do caso: exemplo de origem, pessoas, adoção, preço da
// licença, uso do modelo, dispositivos e conectividade. Usadas no passo 4.2 e em A2 do plano. Textos já traduzidos.
// cfg: opcional; quando ausente, é cfgAtual(estado).
function premissasUnitarias(estado, cfgIn) {
  const cfg = cfgIn || cfgAtual(estado), ce = casoAtual(estado), c = estado.caso || {}, L = [];
  const nf = (x, d = 1) => (+x || 0).toLocaleString(LOC(), { maximumFractionDigits: d });
  const arqC = typeof arquitetura === 'function' ? arquitetura(cfg) : ({ A: 'saas', B: 'api', C: 'ow' })[cfg.origem];
  const orig = ({ A: 'saas', B: 'api', C: 'ow' })[cfg.origem] || arqC;
  if (orig && typeof PRESET_ARQ !== 'undefined' && PRESET_ARQ[orig]) L.push(tr('Premissas de partida:') + ' ' + tr(PRESET_ARQ[orig]) + '.');
  const dm = cfg.demanda || {}, E = dm.E || [], H = Math.max(1, E.length - 1);
  const Emax = Math.max(0, ...E.slice(1));
  if (Emax) L.push(tr('Pessoas que usariam na rede:') + ' ' + fmtInt(Emax) + (ce.__elegPadrao ? ' (' + tr('premissa padrão; informe no passo 4.1.1') + ')' : '') + '.');
  if (E[0]) L.push(tr('Participantes do teste (Ano 0):') + ' ' + fmtInt(E[0]) + '.');
  if (dm.adocao != null) {
    const anos = Array.from({ length: H }, (_, i) => i + 1);
    L.push(tr('Usuários ativos entre as pessoas que usariam:') + ' ' + anos.map(t => tr('Ano ' + t) + ': ' + pct(ano(dm.adocao, t))).join('; ') + '.');
  }
  if (arqC === 'saas' && cfg.saas && cfg.saas.ativo) {
    const sa = cfg.saas;
    if (c.pagamento === 'incluida' || !(+sa.preco > 0)) L.push(tr('Licença: incluída em contrato existente, sem preço adicional.'));
    else if (c.pagamento === 'usuario') L.push(tr('Preço da licença por usuário por mês:') + ' ' + din(sa.preco, 2) + ' (' + tr('licenças contratadas = usuários ativos + ' + pct((+sa.fatorNominal || 1) - 1)) + ').');
    else L.push(tr('Preço da licença institucional por pessoa que usaria, por mês:') + ' ' + din(sa.preco, 2) + '.');
    if ((c.usuarios || []).includes('estudantes') && (c.usuarios || []).length && cfg.origem === 'A') L.push(tr('O preço de referência vem de um copiloto para professores; confira o preço por estudante, que costuma ser diferente.'));
  }
  if ((arqC === 'api' || arqC === 'ow') && +dm.s > 0) L.push(tr('Uso por usuário ativo:') + ' ' + tr(nf(dm.s) + ' sessões por mês e ' + nf(dm.i) + ' interações por sessão') + '.');
  if (arqC === 'api' && cfg.api) {
    const a = cfg.api;
    L.push(tr('Modelo por API:') + ' ' + tr(nf(a.k) + ' chamadas por interação, com ' + fmtInt(a.Tin) + ' tokens de entrada e ' + fmtInt(a.Tout) + ' de saída por chamada') + '; ' + tr('preço por milhão de tokens de entrada e de saída:') + ' ' + din(a.Pin, 2) + ' / ' + din(a.Pout, 2) + '.');
  }
  if (arqC === 'ow' && cfg.ow) {
    const o = cfg.ow;
    L.push(tr('Modelo de pesos abertos:') + ' ' + tr(fmtInt(o.Tin) + ' tokens de entrada e ' + fmtInt(o.Tout) + ' de saída por interação') + '; ' + tr('preço da hora de GPU:') + ' ' + din(o.Pgpu, 2) + '.');
  }
  // v11: internet e dispositivos separados (2.4)
  if (typeof PREMISSAS_K1 !== 'undefined') {
    const K = PREMISSAS_K1;
    if (c.internet === 'nao' || c.internet === 'parcial') L.push(tr('Conexão para as escolas sem internet adequada:') + ' ' + din(K.conectEscolaAno, 0) + ' ' + tr('por escola por ano') + '.');
    if ((c.dispExistem === 'nao' || c.dispExistem === 'parcial') && c.modeloDisp && c.modeloDisp !== 'proprio') L.push(tr('Dispositivos que faltam:') + ' ' + din(K.precoDispositivo, 0) + ' ' + tr('por dispositivo') + '.');
  }
  return L;
}
// Adaptação ao contexto (K3.1 + K3.2) no Ano 0, para mostrar o efeito da resposta 2.3.7
function adaptacaoAno0(av) { return (av.linhas || []).filter(l => l.s === 'K3.1' || l.s === 'K3.2').reduce((t, l) => t + ((l.eco || [])[0] || 0), 0); }
// O painel só mostra a estimativa depois das respostas que a definem (2.1.1, 2.3.4 e 4.1.1)
function faltasEstimativa(estado) { return ['tarefas', 'tipoTec', 'elegiveis'].map(k => CAMPO_POR_ID[k]).filter(f => f && !qOk(f, estado)); }

// ----------------------------------------------------------- derivados (antes em src/app.js)
// caso efetivo: o caso com os campos legados deduzidos das tarefas e da adoção (P1)
function casoAtual(estado) {
  return typeof casoEfetivo === 'function' ? casoEfetivo(estado.caso, totaisCtx(estado.ctx)) : estado.caso;
}
function perfil(estado) { return perfilFinal(casoAtual(estado)); }
// cfg do caso: montada de cfgDoCaso ou de um exemplo do guia (estado.custo.base); como no legado, a cfg fica
// guardada em estado.custo.cfg enquanto editado = true (calculadora). Sem estado.custo, devolve a cfg do caso sem guardar.
function cfgAtual(estado) {
  const sc = estado.custo;
  if (!sc) { const ce = casoAtual(estado); return cfgDoCaso(ce, perfilFinal(ce)); }
  if (sc.base && sc.base !== 'caso') {
    if (!sc.cfg || sc.cfg.__base !== sc.base) { sc.cfg = clone(PRESETS[sc.base]); sc.cfg.__base = sc.base; sc.editado = false; }
    return sc.cfg;
  }
  if (!sc.cfg || sc.cfg.__base !== 'caso' || !sc.editado) {
    const ce = casoAtual(estado);
    sc.cfg = cfgDoCaso(ce, perfilFinal(ce)); sc.cfg.__base = 'caso';
  }
  return sc.cfg;
}
// campos cuja mudança refaz as premissas de custo montadas a partir do caso
const CAMPOS_CUSTO = ['tarefas', 'usuarios', 'afetados', 'consequencias', 'testes', 'tipoTec', 'pagamento', 'licenca', 'adaptacao', 'piloto', 'poc',
  'nFerramentas', 'conheceFerramentas', 'ferramentas', 'internet', 'escolasInternet', 'modeloDisp', 'dispExistem', 'formados', 'formacaoTipo', 'formacaoFormato',
  'formacaoHoras', 'formacaoPaga', 'suporteQuem', 'suporteNivel', 'acompanhamento', 'implantacao', 'arquitetura', 'elegiveis', 'expansao', 'horizonte'];

export { CAMPO_POR_ID, CAMPOS_SUGERIDOS, CAMPOS_PROB, PASSOS_VER, PRESET_ARQ, SUB_OBJ, objVazio, testesDe, modoTeste, descidos, passoDe, irCampo, visivel, respondido,
  etapasAtivas, alunosEtapa, totaisCtx, rotulo, listaOpc, valorCampo, vazio, textoCampo,
  PAG_LIC, ALUNOS_POR_PROF, FRACAO_IMPLANT, CAMPOS_GERADOS, horasEstimativa, usuariosMarcados, basePessoas, origemImplantacao, padroesGerados, sugProblemas,
  confirmarGerados, subcampos, sugerido, textoSugerido, qOk, temLac, camposPasso, camposDescidosPasso, faltas, passoFeito, estadoPasso, fasePasso, numPasso, nomePasso,
  progressoFase, idQ, faltasTodas, questoesGov, numerosCusto, juntarSugestao, premissasUnitarias, adaptacaoAno0, faltasEstimativa,
  casoAtual, perfil, cfgAtual, CAMPOS_CUSTO };
