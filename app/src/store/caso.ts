// Store do caso (Zustand): o estado v14 mais as ações do percurso. Substitui a global S e as funções que a
// mutavam em src/app.js e src/fluxo.js (marcarCampo, gravarNumCaso, aplicarPadroes/Problemas/Sugestoes,
// carregarExemplo, aplicarImportado). Cada ação trabalha numa cópia profunda do estado e grava o resultado,
// para que o React veja um objeto novo; o domínio continua recebendo o `estado` como parâmetro.
//
// Origem de cada valor (spec, "Modelo de dados do caso"):
//   responder → 'informado'   (a pessoa respondeu, em qualquer modo)
//   sugerir   → 'sugerido'    (a ferramenta deduziu de outra resposta; só sobre 'padrao' ou 'sugerido')
//   confirmar → 'informado'   (a pessoa aceitou a sugestão como está)
//   refinar   → 'refinado'    (a pessoa alterou uma premissa no modo Refinar)
// respC continua sendo derivado (informado/refinado = confirmado), para o domínio e a exportação da v13.
import { create } from 'zustand';
import { clone, CASO_VAZIO, CASOS, CTX_EX, RESP_EX, CAMPO_POR_ID, CAMPOS_CUSTO, CAMPOS_SUGERIDOS, CAMPOS_PROB, SUB_OBJ,
  confirmarGerados, horasEstimativa, vazio, tr } from '../domain';
import type { Estado14, Origem, Modo, Capitulo, DadosCaso14 } from './tipos';
import { estadoInicial, migrar, ErroImportacao } from './migracoes';
import { aplicarSugestoes } from './sugestoes';
import { afetadosPor, telaDoCampo, ESSENCIAL, CAPITULOS } from './perguntas';
import { dadosCaso } from '../export/json';

/** O que acabou de mudar no plano: a interface destaca os trechos por alguns segundos (âmbar). */
export interface Recente { campo: string; afetados: string[]; em: number }

export interface CasoStore extends Estado14 {
  recente: Recente | null;
  /** aviso de carga: o caso veio do localStorage da v13 ou do app anterior */
  migradoDe: '' | 'v14' | 'v13' | 'v8';

  responder(campo: string, valor: any): void;
  sugerir(campo: string, valor: any, deQuem: string): void;
  confirmar(campo: string): void;
  refinar(campo: string, valor: any): void;
  /** governança (1.3.x): resposta e, se houver, os detalhes de "Sim"/"Em parte" */
  responderGov(id: string, valor: string, det?: { qual?: string; falta?: string }): void;
  marcarRevisado(campo: string): void;
  setModo(modo: Modo): void;
  irPara(capitulo: Capitulo, pergunta?: string): void;
  setLang(lang: string): void;
  setMoeda(moeda: Estado14['moeda']): void;
  setCusto(custo: Partial<Estado14['custo']>): void;

  carregarExemplo(k: string): void;
  limpar(): void;
  /** lança ErroImportacao quando o JSON não é um caso aceito */
  importar(json: string | object): void;
  exportar(): DadosCaso14;
  /** substitui o estado inteiro (carga do localStorage) */
  repor(estado: Estado14, migradoDe?: CasoStore['migradoDe']): void;
  /** cópia simples do estado v14, sem as ações */
  estado(): Estado14;
}

const CHAVES_ESTADO: (keyof Estado14)[] = ['formato', 'versao', 'caso', 'ctx', 'resp', 'respC', 'respDet', 'revisar', 'feitos', 'custo', 'moeda', 'lang', 'origem', 'sugestoes', 'modo', 'capitulo', 'exemplo'];

export function soEstado(s: Estado14 | CasoStore): Estado14 {
  const o: any = {};
  CHAVES_ESTADO.forEach(k => { o[k] = (s as any)[k]; });
  return o as Estado14;
}
const copiar = (s: Estado14 | CasoStore): Estado14 => clone(soEstado(s));

function setPath(obj: any, path: string, val: any) {
  const ks = path.split('.'); let o = obj;
  for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null) o[ks[i]] = {}; o = o[ks[i]]; }
  o[ks[ks.length - 1]] = val;
}
/** onde um campo mora: 'resp' (g-*), 'ctx' ou 'caso' */
// campos "Outro, qual?" (nivelOutro, impactoOutro, tarefaOutra) moram junto do campo de que dependem
const PAI_DO_OUTRO: Record<string, string> = Object.fromEntries(
  Object.values(CAMPO_POR_ID as Record<string, any>).filter((f) => f && f.outro && f.outro.id).map((f) => [f.outro.id, f.id]),
);
export function ondeMora(campo: string): 'resp' | 'ctx' | 'caso' {
  if (/^g-/.test(campo)) return 'resp';
  const top = campo.split('.')[0];
  const f = (CAMPO_POR_ID as any)[top] || (CAMPO_POR_ID as any)[PAI_DO_OUTRO[top]];
  return f && f.onde === 'ctx' ? 'ctx' : 'caso';
}
function gravar(e: Estado14, campo: string, valor: any) {
  const onde = ondeMora(campo);
  if (onde === 'resp') { e.resp[campo] = valor; return; }
  setPath(onde === 'ctx' ? e.ctx : e.caso, campo, clone(valor));
}
export function valorDe(e: Estado14, campo: string) {
  const onde = ondeMora(campo);
  if (onde === 'resp') return e.resp[campo];
  return campo.split('.').reduce((o: any, k) => (o == null ? undefined : o[k]), onde === 'ctx' ? e.ctx : e.caso);
}
function marcar(e: Estado14, campo: string, origem: Origem) {
  const top = campo.split('.')[0];
  e.origem[campo] = origem;
  const confirmado = origem === 'informado' || origem === 'refinado';
  if (!/^g-/.test(campo)) {
    if (confirmado) { e.respC[campo] = true; e.respC[top] = true; } else delete e.respC[campo];
  }
  if (confirmado) { delete e.sugestoes[campo]; e.revisar = e.revisar.filter(k => k !== campo); }
  if (e.exemplo !== 'novo' && confirmado) e.exemplo = 'editado';
  if (CAMPOS_CUSTO.includes(top) && e.custo.base === 'caso') { e.custo.editado = false; e.custo.cfg = null; }
}
// Efeitos de uma resposta que o percurso da v13 fazia em aoMudarCampo, sem a parte de tela
function efeitos(e: Estado14, campo: string) {
  const c: any = e.caso;
  if (campo === 'testes') delete c.teste;   // casoEfetivo deriva "teste" de "testes"
  if (campo === 'conheceFerramentas' && c.conheceFerramentas === 'sim' && !(c.ferramentas || []).length) {
    const n = ({ '1': 1, '2': 2, '3mais': 3 } as Record<string, number>)[c.nFerramentas] || 1;
    c.ferramentas = Array.from({ length: n }, () => ({ nome: '', tarefas: [], tipoTec: '', pagamento: '', preco: '' }));
  }
  if (campo === 'formacaoHoras') c.formacaoEstimativa = false;   // horas digitadas pela pessoa
}
// Sugestões em cascata até o ponto fixo (2.0 → 2.3.8; 2.2.1 → 4.1.1 → 3.1.1…); no máximo 5 voltas.
function propagar(e: Estado14): string[] {
  const tocados: string[] = [];
  for (let i = 0; i < 5; i++) {
    const r = aplicarSugestoes(e);
    r.revisar.forEach(x => { if (!e.revisar.includes(x.campo)) e.revisar.push(x.campo); });
    if (!r.sugestoes.length) break;
    r.sugestoes.forEach(s => {
      gravar(e, s.campo, s.valor);
      e.origem[s.campo] = 'sugerido'; e.sugestoes[s.campo] = s.deQuem;
      delete e.respC[s.campo];
      if (!tocados.includes(s.campo)) tocados.push(s.campo);
    });
  }
  if (tocados.some(k => CAMPOS_CUSTO.includes(k.split('.')[0])) && e.custo.base === 'caso') { e.custo.editado = false; e.custo.cfg = null; }
  return tocados;
}
function recenteDe(campo: string, tocados: string[]): Recente {
  const afetados: string[] = [];
  [campo, ...tocados].forEach(k => afetadosPor(k).forEach(x => { if (!afetados.includes(x)) afetados.push(x); }));
  tocados.forEach(k => { const x = 'campo:' + k; if (!afetados.includes(x)) afetados.push(x); });
  return { campo, afetados, em: Date.now() };
}
function proximaTela(e: Estado14, campo: string) {
  const t = telaDoCampo(campo.split('.')[0]);
  if (t) e.capitulo = { atual: t.capitulo, pergunta: t.id };
}

export const useCaso = create<CasoStore>()((set, get) => ({
  ...estadoInicial(),
  recente: null,
  migradoDe: '',

  responder(campo, valor) {
    const e = copiar(get());
    gravar(e, campo, valor);
    marcar(e, campo, 'informado');
    efeitos(e, campo);
    const tocados = propagar(e);
    proximaTela(e, campo);
    set({ ...e, recente: recenteDe(campo, tocados) });
  },
  sugerir(campo, valor, deQuem) {
    const e = copiar(get());
    const o = e.origem[campo];
    if (o === 'informado' || o === 'refinado' || e.respC[campo]) return;
    gravar(e, campo, valor);
    e.origem[campo] = 'sugerido'; e.sugestoes[campo] = deQuem; delete e.respC[campo];
    if (CAMPOS_CUSTO.includes(campo.split('.')[0]) && e.custo.base === 'caso') { e.custo.editado = false; e.custo.cfg = null; }
    set({ ...e, recente: recenteDe(campo, []) });
  },
  confirmar(campo) {
    const e = copiar(get());
    marcar(e, campo, 'informado');
    const tocados = propagar(e);
    set({ ...e, recente: recenteDe(campo, tocados) });
  },
  refinar(campo, valor) {
    const e = copiar(get());
    gravar(e, campo, valor);
    marcar(e, campo, 'refinado');
    efeitos(e, campo);
    const tocados = propagar(e);
    set({ ...e, recente: recenteDe(campo, tocados) });
  },
  responderGov(id, valor, det) {
    const e = copiar(get());
    e.resp[id] = valor;
    if (det) e.respDet[id] = { ...(e.respDet[id] || {}), ...det }; else if (valor !== 'sim' && valor !== 'parcial') delete e.respDet[id];
    marcar(e, id, 'informado');
    set({ ...e, recente: recenteDe(id, []) });
  },
  marcarRevisado(campo) {
    const e = copiar(get());
    e.revisar = e.revisar.filter(k => k !== campo);
    set(e);
  },
  setModo(modo) { set({ modo }); },
  irPara(capitulo, pergunta) {
    const t = ESSENCIAL.find(x => x.capitulo === capitulo);
    set({ capitulo: { atual: capitulo, pergunta: pergunta || (t ? t.id : '') } });
  },
  setLang(lang) { set({ lang }); },
  setMoeda(moeda) { set({ moeda: clone(moeda) }); },
  setCusto(custo) { set({ custo: { ...get().custo, ...custo } }); },

  carregarExemplo(k) {
    const base = estadoInicial();
    const e: Estado14 = { ...base, lang: get().lang, moeda: clone(get().moeda), modo: get().modo };
    const ex: any = (CASOS as any)[k];
    if (k === 'novo' || !ex) { set({ ...e, recente: null, migradoDe: '' }); return; }
    e.caso = Object.assign(clone(CASO_VAZIO), clone(ex));
    e.exemplo = k;
    e.ctx = clone((CTX_EX as any)[k] || {}); e.resp = clone((RESP_EX as any)[k] || {});
    // textos do exemplo no idioma corrente (textosExemplo, src/app.js)
    ['titulo', 'problema', 'resultado', 'linhaBaseMedida', 'tarefaOutra', 'impactoOutro'].forEach(f => { if (ex[f]) (e.caso as any)[f] = tr(ex[f]); });
    (ex.ferramentas || []).forEach((fe: any, i: number) => { if (fe && fe.nome && e.caso.ferramentas[i]) e.caso.ferramentas[i].nome = tr(fe.nome); });
    ['local', 'olhando', 'problemaOutro'].forEach(f => { if (e.ctx[f]) e.ctx[f] = tr(e.ctx[f]); });
    // nos exemplos, horas de formação "estimadas" e arquitetura não informada já aparecem respondidas (aplicarExemploFluxo)
    if (e.caso.formacaoEstimativa && vazio(e.caso.formacaoHoras)) e.caso.formacaoHoras = horasEstimativa(e.caso);
    if (!e.caso.arquitetura) e.caso.arquitetura = 'nao_sei';
    const rc: Record<string, boolean> = {};
    (CAMPOS_SUGERIDOS as string[]).forEach(c => { rc[c] = true; });
    confirmarGerados(e.caso, rc);
    (CAMPOS_PROB as string[]).concat(['nFerramentas']).forEach(c => { rc[c] = true; });
    // todo valor do exemplo é 'informado' (as sugestões não substituem as respostas ilustrativas)
    // no exemplo, todo valor preenchido é resposta, inclusive os que coincidem com a premissa padrão (situação 'nova',
    // expansão 'ano1'…); nos objetos de tamanho (piloto, poc, implantacao) contam o subcampo e o campo
    Object.keys(e.caso).forEach(c => {
      const v = (e.caso as any)[c];
      if (c in (SUB_OBJ as any)) {
        (SUB_OBJ as any)[c].forEach((s: string) => { if (!vazio((v || {})[s])) { rc[c + '.' + s] = true; rc[c] = true; } });
        return;
      }
      if (!vazio(v) && v !== false) rc[c] = true;
    });
    Object.keys(e.ctx).forEach(c => { if (!vazio(e.ctx[c])) rc[c] = true; });
    if (Object.values(e.ctx.etapas || {}).some((x: any) => x && x.on)) rc.grade = true;   // escolas e estudantes por etapa (1.1.5)
    Object.keys(rc).forEach(c => { e.origem[c] = 'informado'; });
    Object.keys(e.resp).forEach(g => { if (e.resp[g]) e.origem[g] = 'informado'; });
    e.respC = Object.fromEntries(Object.keys(rc).filter(c => !/^g-/.test(c)).map(c => [c, true]));
    propagar(e);
    set({ ...e, recente: null, migradoDe: '' });
  },
  limpar() { get().carregarExemplo('novo'); },
  importar(json) {
    const e = migrar(json);
    e.lang = e.lang || get().lang;
    propagar(e);
    set({ ...e, recente: null, migradoDe: '' });
  },
  exportar() { return dadosCaso(soEstado(get())); },
  repor(estado, migradoDe) { set({ ...clone(estado), recente: null, migradoDe: migradoDe || '' }); },
  estado() { return soEstado(get()); },
}));

export { ErroImportacao, CAPITULOS };
