// Lógica pura das perguntas do modo Refinar (sem React nem DOM): edição da lista de ferramentas, das subcategorias,
// dos estudantes por ano, dos detalhes da governança, o aviso "revisar" e as notas de premissa. Os controles de
// Controles.tsx só chamam estas funções e gravam o resultado no store; os testes cobrem estas funções.
import {
  CAMPO_POR_ID, OPC, ETAPAS_ENS, PRIORIDADES, IMPACTO_TAREFAS, ALUNOS_POR_PROF, LOC, clone, derivarArquitetura, basePessoas, modoTeste, rotulo, listaOpc,
} from '../domain';
import { aplicarSugestoes, valorDe, origemDe, type Estado14 } from '../store';
import { t } from './textos';

// ----------------------------------------------------------- números
/** inteiro não negativo (escolas, pessoas, meses, horas) ou '' */
export const inteiro = (v: number | ''): number | '' => (v === '' || v == null || !isFinite(+v) ? '' : Math.max(0, Math.round(+v)));
/** valor de um campo numérico do estado para o NumeroField */
export const numeroDe = (x: unknown): number | '' => (x === '' || x == null || !isFinite(+(x as any)) ? '' : +(x as any));

/** Mensagem curta do campo numérico (TRA-26): zero onde não cabe e valor acima do total da rede. Sem erro: undefined. */
export function erroNumero(v: unknown, o: { max?: number; permiteZero?: boolean } = {}): string | undefined {
  if (v === '' || v == null || !isFinite(+(v as any))) return undefined;
  const n = +(v as any);
  if (n < 0 || (n === 0 && !o.permiteZero)) return t('Informe um número maior que zero.');
  if (o.max && o.max > 0 && n > o.max) return t('Não pode passar de {n}, o total de escolas da rede.', { n: Math.round(o.max).toLocaleString(LOC()) });
  return undefined;
}

// ----------------------------------------------------------- listas de opções
const EXCLUSIVAS: Record<string, string> = { consequencias: 'nenhuma' };
/** Marca ou desmarca uma opção mantendo a ordem do catálogo; a opção exclusiva (2.2.3, "nenhuma") limpa as demais e vice-versa (PER-21). */
export function alternarOpcao(campo: string, atual: string[], ordem: string[], id: string, on: boolean): string[] {
  const excl = EXCLUSIVAS[campo];
  let s = new Set(atual || []);
  if (on) {
    if (excl && id === excl) s = new Set([id]);
    else { if (excl) s.delete(excl); s.add(id); }
  } else s.delete(id);
  return ordem.filter((k) => s.has(k));
}
/** opções de uma lista com legenda própria (subtexto), para explicar os chips: [rótulo, legenda][] */
export function legendasOpc(opc: any[]): [string, string][] {
  return (opc || []).filter((o) => o[0] !== 'outro' && typeof o[2] === 'string' && o[2]).map((o) => [String(o[1]), String(o[2])] as [string, string]);
}
/** Marca (on) ou desmarca todos os problemas de uma prioridade (PER-15, só no Refinar), na ordem do catálogo. */
export function problemasDoGrupo(atual: string[], ordem: string[], ids: string[], on: boolean): string[] {
  const s = new Set(atual || []);
  ids.forEach((i) => (on ? s.add(i) : s.delete(i)));
  return ordem.filter((k) => s.has(k));
}
/** ids de todos os problemas do catálogo, na ordem das prioridades */
export const ORDEM_PROBLEMAS: string[] = (PRIORIDADES as any[]).flatMap((p) => p.problemas.map((q: any) => q.id));
/** ids de todas as subcategorias, na ordem do catálogo */
export const ORDEM_SUBS: string[] = (PRIORIDADES as any[]).flatMap((p) => p.problemas.flatMap((q: any) => (q.sub || []).map((s: any) => s[0])));
/** a tarefa tem a etiqueta "sugerida pelo impacto" (IMPACTO_TAREFAS) para os impactos marcados? (PER-25) */
export function sugeridaPeloImpacto(impactos: string[], tarefa: string): boolean {
  const IT: Record<string, string[]> = IMPACTO_TAREFAS as any;
  return (impactos || []).some((i) => (IT[i] || []).includes(tarefa));
}

// ----------------------------------------------------------- 2.3.3 lista de ferramentas
export interface Ferramenta { nome: string; tarefas: string[]; tipoTec: string; pagamento: string; preco: number | '' }
export const ferramentaNova = (): Ferramenta => ({ nome: '', tarefas: [], tipoTec: '', pagamento: '', preco: '' });
/** Nova linha no fim; a primeira é a principal e já traz o tipo e o pagamento das perguntas 2.3.4 e 2.3.5. */
export function ferramentaAdicionada(lista: Ferramenta[], caso: Record<string, any>): Ferramenta[] {
  const nova = ferramentaNova();
  if (!(lista || []).length) { nova.tipoTec = caso.tipoTec || ''; nova.pagamento = caso.pagamento || ''; }
  return [...(lista || []).map((f) => ({ ...f })), nova];
}
export function ferramentaRemovida(lista: Ferramenta[], i: number): Ferramenta[] {
  return (lista || []).filter((_, k) => k !== i).map((f) => ({ ...f }));
}
export function ferramentaAlterada(lista: Ferramenta[], i: number, patch: Partial<Ferramenta>): Ferramenta[] {
  return (lista || []).map((f, k) => (k === i ? { ...f, ...patch } : { ...f }));
}
/** tarefas da linha na ordem das tarefas marcadas em 2.1.1 */
export function ferramentaTarefa(lista: Ferramenta[], i: number, tarefa: string, on: boolean, ordem: string[]): Ferramenta[] {
  const f = (lista || [])[i];
  if (!f) return lista;
  const s = new Set(f.tarefas || []);
  if (on) s.add(tarefa); else s.delete(tarefa);
  return ferramentaAlterada(lista, i, { tarefas: (ordem || []).filter((k) => s.has(k)) });
}

// ----------------------------------------------------------- 3.2.1 arquitetura
/** a arquitetura que a ferramenta presume das respostas de 2.3 ('saas' | 'api' | 'ow') */
export function arquiteturaPresumida(caso: Record<string, any>): string {
  try { return String(derivarArquitetura({ ...caso, arquitetura: '', arquiteturaManual: '' }, true)); } catch { return ''; }
}
export function rotuloArquitetura(id: string): string {
  return rotulo((OPC as any).arquitetura, id);
}

// ----------------------------------------------------------- 1.1.5 estudantes por ano ou série
export interface PatchEtapa { on?: boolean; escolas?: number | ''; alunos?: number | ''; ano?: { i: number; v: number | '' }; soTotal?: boolean }
const somaAnos = (anos: any) => (Array.isArray(anos) ? anos : []).reduce((a: number, b: any) => a + (+b || 0), 0);
/**
 * Edita uma etapa de ctx.etapas sem perder dados (PER-14): mexer nas escolas não troca o modo; digitar o total da etapa
 * passa para "só o total" e mexer num ano passa para "por ano", e os anos digitados continuam guardados nos dois casos.
 */
export function etapaEditada(et: Record<string, any>, id: string, patch: PatchEtapa, nAnos = 0): Record<string, any> {
  const novo: Record<string, any> = clone(et || {});
  const x = (novo[id] = novo[id] || {});
  if (patch.on !== undefined) x.on = patch.on;
  if (patch.escolas !== undefined) x.escolas = patch.escolas;
  if (patch.alunos !== undefined) { x.alunos = patch.alunos; x.soTotal = true; }
  if (patch.ano) {
    const n = Math.max(nAnos, (x.anos || []).length, patch.ano.i + 1);
    const anos = Array.from({ length: n }, (_, k) => ((x.anos || [])[k] ?? ''));
    anos[patch.ano.i] = patch.ano.v;
    x.anos = anos; x.soTotal = false;
  }
  if (patch.soTotal !== undefined) {
    x.soTotal = patch.soTotal;
    if (x.soTotal && !(+x.alunos > 0)) { const s = somaAnos(x.anos); if (s > 0) x.alunos = s; }
  }
  return novo;
}
/** anos ou séries de uma etapa (ETAPAS_ENS); [] para as etapas só com total */
export function anosDaEtapa(id: string): string[] {
  const d = (ETAPAS_ENS as any[]).find((x) => x[0] === id);
  return d ? (d[3] as string[]) : [];
}

// ----------------------------------------------------------- 1.3.x "Qual?" e "O que falta?"
export interface DetGov { qual?: string; falta?: string }
/**
 * Resposta nova de uma pergunta de governança. Clicar de novo na resposta marcada a limpa (PER-28). Os detalhes já
 * digitados seguem guardados mesmo quando a resposta passa a ser Não ou Não sei (o store só os apaga sem `det`).
 */
export function respostaGov(atual: string | undefined, nova: string, det?: DetGov): { valor: string; det?: DetGov } {
  const valor = atual === nova ? '' : nova;
  const tem = !!det && (String(det.qual || '').trim() !== '' || String(det.falta || '').trim() !== '');
  return tem ? { valor, det: { ...det } } : { valor };
}
/** a resposta pede os campos de detalhe? (Sim ou Em parte; "O que falta?" só com Em parte) */
export const pedeDetalhe = (resp: string | undefined) => resp === 'sim' || resp === 'parcial';

// ----------------------------------------------------------- PER-07 aviso "revisar"
export interface PendenciaRevisar { campo: string; valor: any; atual: any }
/**
 * Campos do 2.2 já confirmados cuja sugestão (a partir das tarefas) hoje é outra: o aviso só existe enquanto a
 * sugestão nova difere da resposta, então some sozinho quando a pessoa ajusta a resposta ou aceita a sugestão.
 */
export function pendenciasRevisar(s: Estado14): PendenciaRevisar[] {
  if (!(s.revisar || []).length) return [];
  const novas = aplicarSugestoes(s).revisar;
  const out: PendenciaRevisar[] = [];
  (s.revisar || []).forEach((campo) => {
    const x = novas.find((y) => y.campo === campo);
    if (x) out.push({ campo, valor: x.valor, atual: valorDe(s, campo) });
  });
  return out;
}
/** nomes das opções de um valor sugerido ("Professores, Gestores") */
export function nomesDoValor(campo: string, valor: any): string {
  const f: any = (CAMPO_POR_ID as any)[campo];
  const opc = f ? (listaOpc(f) as any[]) : [];
  const vs: string[] = Array.isArray(valor) ? valor : valor ? [valor] : [];
  return vs.map((v) => rotulo(opc, v) || String(v)).join(', ');
}

// ----------------------------------------------------------- PER-20 premissas declaradas
/**
 * Notas das sugestões que dependem de uma premissa desta ferramenta e não de um dado da rede (textos da v13,
 * `notaSugerido`): 1 professor para cada 25 estudantes, uma ferramenta por vez, dispositivos próprios, um terço
 * na primeira etapa. Chaves de tradução em português; a tela as passa por t().
 */
export function notasPremissa(e: Estado14, campo: string): string[] {
  const sug = (c: string) => origemDe(e, c) === 'sugerido';
  const prof = basePessoas(e).prof;
  const L: string[] = [];
  if (campo === 'piloto') {
    const m = modoTeste(e.caso);
    const sp = ['escolas', 'participantes', 'meses'].some((k) => sug('piloto.' + k));
    const sc = ['participantes', 'meses'].some((k) => sug('poc.' + k));
    if ((m === 'poc' || m === 'ambos') && sc) L.push('Sugestão para uma prova de conceito: 15 pessoas por 2 meses, sem escolas. Ajuste ao seu teste.');
    if (m !== 'poc' && sp) {
      L.push('Sugestão: cerca de 5% das escolas da rede (no mínimo 3 e no máximo 30), 5% das pessoas que usariam e 4 meses. Ajuste ao seu piloto.');
      if (prof && sug('piloto.participantes')) L.push('Participantes estimados com uma premissa ilustrativa de 1 professor para cada 25 estudantes, e não com um dado da sua rede.');
    }
  } else if (campo === 'elegiveis') {
    if (sug('elegiveis')) L.push(prof ? 'Sugestão ilustrativa: 1 professor para cada 25 estudantes das etapas marcadas. É uma premissa desta ferramenta, e não um dado da sua rede; informe o número real se souber.'
      : 'Sugestão: o total de estudantes das etapas marcadas no passo 1.1. Confirme ou informe outro número.');
  } else if (campo === 'implantacao') {
    if (sug('implantacao.escolas') || sug('implantacao.pessoas')) L.push(+(e.caso.elegiveis) > 0
      ? 'Sugestão ilustrativa: um terço das pessoas da resposta 4.1.1 e um terço das escolas da rede. Confirme ou informe os números da sua primeira etapa.'
      : 'Sugestão ilustrativa: um terço dos estudantes e das escolas das etapas marcadas no passo 1.1. Confirme ou informe os números da sua primeira etapa.');
  } else if (campo === 'nFerramentas') {
    if (sug('nFerramentas')) L.push('Testar uma ferramenta por vez permite saber o que funcionou. Confirme ou escolha outra opção.');
  } else if (campo === 'dispExistem') {
    if (sug('dispExistem')) L.push('Sugestão: com dispositivos próprios das pessoas, a rede não precisa comprar equipamentos. Confirme ou escolha outra opção.');
  }
  return L;
}
/** razão estudantes por professor da premissa ilustrativa (para os testes) */
export const RAZAO_PROFESSORES = ALUNOS_POR_PROF;
