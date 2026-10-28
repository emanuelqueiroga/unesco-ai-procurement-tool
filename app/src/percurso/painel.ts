// Projeção do estado no plano: o que o painel "Seu plano", a gaveta do celular, as sínteses e a página do plano
// mostram. Pura (recebe o Estado14 e devolve dados prontos para os componentes), testada em tests/unit/painel.test.ts.
import { ETAPAS_ENS, QUANDO_REC, totaisCtx, modoTeste, PRIORIDADES, OPC, rotulo, tr } from '../domain';
import type { Estado14, Origem } from '../store';
import { ESSENCIAL, afetadosPor, numerosDe, recomendacoesDe, faltamDe, origemDe, respondido, camposAtivos } from '../store';
import { fmt, sincronizar } from './ambiente';
import { t, NOME_TESTE, minusc } from './textos';

export type KpiId = 'kpi.ano0' | 'kpi.anual' | 'kpi.total' | 'kpi.porAluno';
export const KPI_IDS: KpiId[] = ['kpi.ano0', 'kpi.total', 'kpi.anual', 'kpi.porAluno'];

export interface KpiPlano { id: KpiId; label: string; value?: string; fullValue?: string; bruto?: number; origem: Origem }
export interface RecPlano { id: string; texto: string; prioridade: 'alta' | 'media'; quando: string; quandoRotulo: string; tipo: string; porque: string; tela?: string }
export interface Painel {
  estado: 'empty' | 'writing' | 'complete';
  titulo: string;
  fatos: string;
  temNumeros: boolean;
  H: number;
  kpis: KpiPlano[];
  camadas: { layer: number; valor: number }[];
  recs: RecPlano[];
  respondidas: number;
  faltam: number;
  /** telas do Essencial ainda com premissa padrão ou sugestão não confirmada */
  premissas: number;
}

const ORDEM_ORIGEM: Origem[] = ['padrao', 'sugerido', 'informado', 'refinado'];
const pior = (a: Origem, b: Origem): Origem => (ORDEM_ORIGEM.indexOf(a) <= ORDEM_ORIGEM.indexOf(b) ? a : b);

/** campos do Essencial que mexem em cada KPI (pelo mapa resposta → trecho) */
const DRIVERS: Record<KpiId, string[]> = (() => {
  const out: Record<string, string[]> = { 'kpi.ano0': [], 'kpi.anual': [], 'kpi.total': [], 'kpi.porAluno': [] };
  ESSENCIAL.forEach((tela) => tela.campos.forEach((c) => afetadosPor(c).forEach((a) => { if (out[a] && !out[a].includes(c)) out[a].push(c); })));
  return out as Record<KpiId, string[]>;
})();

/** origem de um número: a pior entre as respostas que o alimentam (uma premissa padrão faz o número "padrão") */
export function origemKpi(e: Estado14, id: KpiId): Origem {
  if (e.exemplo !== 'novo') return 'informado';
  return DRIVERS[id].reduce<Origem>((acc, c) => pior(acc, origemDe(e, c)), 'refinado');
}

/** O plano mostra números depois que a pessoa diz que tipo de tecnologia vai usar (2.3.4), ou num exemplo. */
export function temNumeros(e: Estado14): boolean {
  return e.exemplo !== 'novo' || respondido(e, 'tipoTec');
}

export function tituloCaso(e: Estado14): string {
  const c = e.caso, x = e.ctx;
  const nome = String(c.titulo || x.olhando || '').trim();
  const rede = String(x.local || '').trim();
  return [nome, rede].filter(Boolean).join(' · ');
}

export function etapasTexto(e: Estado14): string {
  const ids = totaisCtx(e.ctx).etapas as string[];
  const nomes = ids.map((id) => { const d = (ETAPAS_ENS as any[]).find((x) => x[0] === id); return d ? String(tr(d[1])) : id; });
  return nomes.map((n) => minusc(n.replace(/^Ensino fundamental: /, ''))).join(', ');
}

export function fatosCaso(e: Estado14): string {
  const c = e.caso, m = modoTeste(c);
  const partes: string[] = [];
  const p = c.piloto || {}, poc = c.poc || {};
  if (m === 'poc' && (+poc.participantes || +poc.meses)) partes.push(t('Prova de conceito com {p} pessoas por {m} meses', { p: fmt.int(poc.participantes), m: fmt.int(poc.meses) }));
  else if ((m === 'piloto' || m === 'ambos' || m === 'recomendar') && (+p.escolas || +p.meses)) partes.push(t('{teste} em {e} escolas por {m} meses', { teste: t(NOME_TESTE[m] || 'Piloto'), e: fmt.int(p.escolas), m: fmt.int(p.meses) }));
  else if (m) partes.push(t(NOME_TESTE[m]));
  const et = etapasTexto(e);
  if (et) partes.push(et);
  const tt = totaisCtx(e.ctx);
  if (!partes.length && tt.escolas) partes.push(t('{e} escolas', { e: fmt.int(tt.escolas) }));
  return partes.join(' · ');
}

const ordemQuando = (q: string) => { const i = (QUANDO_REC as any[]).findIndex((x) => x[0] === q); return i < 0 ? 9 : i; };
const telaDoNumero = (n?: string) => (n ? ESSENCIAL.find((x) => x.n.includes(n))?.id : undefined);

export function recsPlano(e: Estado14): RecPlano[] {
  const lista = recomendacoesDe(e) as any[];
  return lista
    .map((r) => {
      const p = r.porque || {};
      const resposta = String(p.resposta || '').split('; ').map((z: string) => String(tr(z))).join('; ');   // como recTrPartes (v13)
      const porque = p.pergunta ? t('Por quê: você respondeu "{r}" à pergunta {n}.', { r: resposta || '—', n: p.n || '' }) : '';
      return {
        id: String(r.id), texto: String(tr(r.texto)), prioridade: r.prioridade === 'alta' ? 'alta' : 'media', quando: String(r.quando || ''),
        quandoRotulo: String(tr(rotulo(QUANDO_REC, r.quando) || '')), tipo: String(r.tipo || ''), porque, tela: telaDoNumero(p.n),
      } as RecPlano;
    })
    .sort((a, b) => (a.prioridade === b.prioridade ? 0 : a.prioridade === 'alta' ? -1 : 1) || ordemQuando(a.quando) - ordemQuando(b.quando));
}

export function painelDe(e: Estado14): Painel {
  sincronizar(e);
  const faltam = faltamDe(e).length, respondidas = ESSENCIAL.length - faltam;
  const premissas = ESSENCIAL.filter((tela) => camposAtivos(e, tela).some((c) => origemDe(e, c) === 'padrao' || origemDe(e, c) === 'sugerido')).length;
  const comNumeros = temNumeros(e);
  let H = +(e.caso.horizonte || 3) || 3;
  const vazio: Record<KpiId, number | undefined> = { 'kpi.ano0': undefined, 'kpi.anual': undefined, 'kpi.total': undefined, 'kpi.porAluno': undefined };
  let camadas: { layer: number; valor: number }[] = [];
  if (comNumeros) {
    const n = numerosDe(e);
    H = n.H || H;
    vazio['kpi.ano0'] = n.ano0; vazio['kpi.anual'] = n.anual; vazio['kpi.total'] = n.total; vazio['kpi.porAluno'] = n.porAluno;
    const tot = (n.camadas && n.camadas.total) || {};
    camadas = Object.keys(tot).map((k) => ({ layer: +k, valor: +tot[k] || 0 }));
  }
  const ROT: Record<KpiId, string> = {
    'kpi.ano0': t('Custo do teste (Ano 0)'), 'kpi.total': t('Custo total, {H} anos', { H }),
    'kpi.anual': t('Por ano de operação'), 'kpi.porAluno': t('Por estudante por ano'),
  };
  const kpis: KpiPlano[] = KPI_IDS.map((id) => {
    const v = vazio[id];
    const curto = id === 'kpi.porAluno' ? fmt.cheio : fmt.curto;
    return { id, label: ROT[id], bruto: v, value: v === undefined ? undefined : curto(v), fullValue: v === undefined ? undefined : fmt.cheio(v), origem: origemKpi(e, id) };
  });
  const recs = respondidas > 0 || e.exemplo !== 'novo' ? recsPlano(e) : [];
  return {
    estado: respondidas === 0 && e.exemplo === 'novo' ? 'empty' : faltam === 0 || e.exemplo !== 'novo' ? 'complete' : 'writing',
    titulo: tituloCaso(e), fatos: fatosCaso(e), temNumeros: comNumeros, H, kpis, camadas, recs, respondidas, faltam, premissas,
  };
}

/** nomes das prioridades e problemas escolhidos (para as sínteses) */
export function prioridadesTexto(e: Estado14): { prioridades: string[]; problemas: string[] } {
  const pr = (e.ctx.prioridades || []) as string[], pb = (e.ctx.problemas || []) as string[];
  const P = PRIORIDADES as any[];
  return {
    prioridades: P.filter((p) => pr.includes(p.id)).map((p) => String(tr(p.nome))),
    problemas: P.flatMap((p) => p.problemas).filter((q: any) => pb.includes(q.id)).map((q: any) => String(tr(q.t)).replace(/\.$/, '')),
  };
}

export const rotuloOpc = (lista: string, v: string) => String(tr(rotulo((OPC as any)[lista], v) || ''));
