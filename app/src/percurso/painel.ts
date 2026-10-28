// Projeção do estado no plano: o que o painel "Seu plano", a gaveta do celular, as sínteses e a página do plano
// mostram. Pura (recebe o Estado14 e devolve dados prontos para os componentes), testada em tests/unit/painel.test.ts.
import { ETAPAS_ENS, QUANDO_REC, totaisCtx, modoTeste, PRIORIDADES, OPC, RESP_G, CAMPOS, rotulo, tr, faltasTodas, explicacaoCusto, premissasUnitarias } from '../domain';
import type { Estado14, Origem } from '../store';
import { ESSENCIAL, afetadosPor, numerosDe, recomendacoesDe, faltamDe, origemDe, respondido, camposAtivos, cfgDe, telaDoCampo, capituloDoCampo } from '../store';
import { fmt, sincronizar } from './ambiente';
import { t, plural, NOME_TESTE, CURTO, CAPITULOS_INFO, minusc } from './textos';
import { href } from './rota';

export type KpiId = 'kpi.ano0' | 'kpi.anual' | 'kpi.total' | 'kpi.porAluno';
export const KPI_IDS: KpiId[] = ['kpi.ano0', 'kpi.total', 'kpi.anual', 'kpi.porAluno'];

export interface KpiPlano { id: KpiId; label: string; value?: string; fullValue?: string; bruto?: number; origem: Origem }
export interface RecPlano {
  id: string; texto: string; prioridade: 'alta' | 'media'; quando: string; quandoRotulo: string; tipo: string; porque: string;
  /** tela do Essencial que reúne a pergunta (só quando a pergunta está no Essencial) */
  tela?: string;
  /** id do campo da pergunta que originou a recomendação (Essencial ou Refinar) */
  campo?: string;
  /** onde rever a resposta: a tela do Essencial ou a síntese do capítulo com o campo em foco (Refinar) */
  href?: string;
}

/** Uma pergunta ainda sem resposta: do Essencial (uma tela) ou de refinamento (uma pergunta fora das telas pendentes). */
export interface Lacuna { campo: string; n: string; texto: string; capitulo: number; capituloTitulo: string; href: string; essencial: boolean }
/** Lacunas do caso: a mesma contagem na página, no botão do PDF e no PDF. */
export interface Lacunas { essencial: number; refino: number; total: number; itens: Lacuna[] }
/** Resposta que falta para o primeiro número ou para um número mais fiel, com o link para respondê-la. */
export interface FaltaNumero { campo: string; n: string; label: string; href: string; obrigatoria: boolean }
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
  /** telas do Essencial ainda sem resposta (o que o percurso conta) */
  faltam: number;
  /** telas do Essencial ainda com premissa padrão ou sugestão não confirmada */
  premissas: number;
  /** lacunas do caso, nas duas classes (Essencial e refinamento): a fonte da página e do PDF */
  lacunas: Lacunas;
  /** ações de prioridade alta */
  nAlta: number;
  /** respostas que faltam para o primeiro número (ou para um número mais fiel), com link */
  paraNumero: FaltaNumero[];
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
  if (e.custo && e.custo.editado) return 'refinado';
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

/** número da pergunta ("2.3.7") → id do campo, para qualquer pergunta (Essencial ou Refinar) */
const CAMPO_POR_N: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  (CAMPOS as any[]).forEach((f) => { if (f.n != null && !(String(f.n) in m)) m[String(f.n)] = f.id; });
  return m;
})();
export const campoDoNumero = (n?: string): string | undefined => (n ? CAMPO_POR_N[String(n)] : undefined);

/** Rótulo de uma resposta: "nao_sei" nunca chega à tela (PLA-19). Valores já em texto passam só pela tradução. */
const BRUTO = /^[a-z][a-z0-9_]*$/;
export function rotuloResposta(campo: string | undefined, valor: string): string {
  const v = String(valor ?? '').trim();
  if (!v) return '—';
  if (!BRUTO.test(v)) return String(tr(v));
  const lista = campo ? ((OPC as any)[campo] as any[] | undefined) : undefined;
  const o = (lista || []).find((x) => String(x[0]) === v) || (RESP_G as any[]).find((x) => String(x[0]) === v);
  if (o) return String(tr(o[1]));
  return v === 'nao_sei' ? t('Não sei') : v.replace(/_/g, ' ');
}

export function recsPlano(e: Estado14): RecPlano[] {
  const lista = recomendacoesDe(e) as any[];
  return lista
    .map((r) => {
      const p = r.porque || {};
      const campo = campoDoNumero(p.n);
      const resposta = String(p.resposta || '').split('; ').map((z: string) => rotuloResposta(campo, z)).join('; ');
      const porque = p.pergunta ? t('Por quê: você respondeu "{r}" à pergunta {n}.', { r: resposta || '—', n: p.n || '' }) : '';
      return {
        id: String(r.id), texto: String(tr(r.texto)), prioridade: r.prioridade === 'alta' ? 'alta' : 'media', quando: String(r.quando || ''),
        quandoRotulo: String(tr(rotulo(QUANDO_REC, r.quando) || '')), tipo: String(r.tipo || ''), porque, tela: telaDoNumero(p.n),
        campo, href: campo ? href.campo(campo) : undefined,
      } as RecPlano;
    })
    .sort((a, b) => (a.prioridade === b.prioridade ? 0 : a.prioridade === 'alta' ? -1 : 1) || ordemQuando(a.quando) - ordemQuando(b.quando));
}

// ----------------------------------------------------------- lacunas (a mesma contagem na página e no PDF)
/**
 * Lacunas do caso, em duas classes:
 *  - do Essencial: as telas do percurso ainda sem resposta (o que o percurso e o painel contam);
 *  - de refinamento: as demais perguntas obrigatórias da v13 (faltasTodas) que não estão numa tela pendente do Essencial
 *    (perguntas só do Refinar, ou campos secundários de uma tela já respondida).
 * Total = as duas somadas; é o número do botão do PDF, do aviso da página e do aviso do PDF.
 */
export function lacunasDe(e: Estado14): Lacunas {
  const telas = faltamDe(e);
  const cobertos = new Set(telas.flatMap((x) => x.campos));
  const itens: Lacuna[] = telas.map((tela) => ({
    campo: tela.campos[0], n: tela.n.join(' e '), texto: t(CURTO[tela.id] || tela.id), capitulo: tela.capitulo,
    capituloTitulo: t(CAPITULOS_INFO[tela.capitulo].titulo), href: href.pergunta(tela.capitulo, tela.id), essencial: true,
  }));
  const refino: Lacuna[] = [];
  (faltasTodas(e) as any[]).forEach((f) => {
    if (cobertos.has(f.id)) return;
    const cap = capituloDoCampo(f.id);
    refino.push({ campo: f.id, n: String(f.n), texto: String(tr(f.texto)), capitulo: cap, capituloTitulo: t(CAPITULOS_INFO[cap].titulo), href: href.campo(f.id), essencial: false });
  });
  return { essencial: itens.length, refino: refino.length, total: itens.length + refino.length, itens: itens.concat(refino) };
}

/** "Plano parcial: 39 respostas pendentes." */
export const tituloParcial = (l: Pick<Lacunas, 'total'>): string =>
  l.total === 1 ? t('Plano parcial: 1 resposta pendente.') : t('Plano parcial: {0} respostas pendentes.', { '0': l.total });
/** A definição da contagem: "25 perguntas do Essencial; 14 de refinamento." */
export const textoLacunas = (l: Pick<Lacunas, 'essencial' | 'refino'>): string =>
  plural(l.essencial, '{n} pergunta do Essencial', '{n} perguntas do Essencial') + '; ' + t('{n} de refinamento', { n: l.refino }) + '.';

/** "3 ações de prioridade alta" */
export const textoAltas = (n: number): string =>
  n === 0 ? t('Nenhuma ação de prioridade alta') : n === 1 ? t('1 ação de prioridade alta') : t('{0} ações de prioridade alta', { '0': n });

export const rotuloOrigem = (o: string): string =>
  ({ padrao: t('padrão'), sugerido: t('~ sugerido'), informado: t('informado'), refinado: t('refinado') } as Record<string, string>)[o] || o;

/** respostas que faltam para o primeiro número (tipo de tecnologia) e para um número mais fiel (tarefas, pessoas na rede) */
export function paraNumeroDe(e: Estado14): FaltaNumero[] {
  const out: FaltaNumero[] = [];
  const add = (campo: string, obrigatoria: boolean) => {
    const tela = telaDoCampo(campo);
    if (!tela || respondido(e, campo)) return;
    out.push({ campo, n: tela.n.join(' e '), label: t(CURTO[tela.id] || tela.id), href: href.pergunta(tela.capitulo, tela.id), obrigatoria });
  };
  add('tipoTec', true); add('tarefas', false); add('elegiveis', false);
  return out;
}

// ----------------------------------------------------------- "de onde vem?" (CUS-02)
export type KpiOuSaida = KpiId | 'saida';
export interface DriverKpi { campo: string; label: string; origem: Origem; href: string }
export interface ExplicacaoKpi {
  origem: Origem;
  /** como o número é montado (linhas de texto, já formatadas) */
  conta: string[];
  /** premissas que o alimentam */
  premissas: string[];
  /** respostas que mais pesam, as menos firmes primeiro */
  drivers: DriverKpi[];
  /** onde responder primeiro: a resposta menos firme */
  irCampo?: DriverKpi;
}
/** respostas do Essencial que alimentam um KPI, da menos firme para a mais firme (uma por tela) */
export function driversDe(e: Estado14, id: KpiOuSaida): DriverKpi[] {
  const base = DRIVERS[(id === 'saida' ? 'kpi.total' : id) as KpiId] || [];
  const vistas = new Set<string>();
  const L: DriverKpi[] = [];
  base.forEach((c) => {
    const tela = telaDoCampo(c);
    if (!tela || vistas.has(tela.id)) return;
    vistas.add(tela.id);
    const origem = e.exemplo !== 'novo' ? 'informado' : camposAtivos(e, tela).map((k) => origemDe(e, k)).reduce<Origem>((acc, o) => pior(acc, o), 'refinado');
    L.push({ campo: c, label: t(CURTO[tela.id] || tela.id), origem, href: href.campo(c) });
  });
  return L.map((d, i) => [d, i] as const).sort((a, b) => ORDEM_ORIGEM.indexOf(a[0].origem) - ORDEM_ORIGEM.indexOf(b[0].origem) || a[1] - b[1]).map((x) => x[0]);
}

/** O que o popover "de onde vem?" mostra de um KPI: origem, como é calculado, premissas e as respostas que mais pesam. */
export function explicacaoKpi(e: Estado14, id: KpiOuSaida): ExplicacaoKpi {
  sincronizar(e);
  const kpi: KpiId = id === 'saida' ? 'kpi.total' : id;
  const origem = origemKpi(e, kpi);
  const drivers = driversDe(e, id);
  let conta: string[] = [], premissas: string[] = [];
  try {
    const cfg = cfgDe(e);
    const x: any = explicacaoCusto(cfg);
    const n: any = numerosDe(e);
    if (x) {
      if (id === 'kpi.total') conta = [x.formula.numeros, x.formula.texto];
      else if (id === 'kpi.ano0') {
        const a0 = x.anos[0];
        conta = a0 ? [t('Soma de {n} itens do teste, entre eles:', { n: a0.linhas.length + (a0.outros ? a0.outros.n : 0) })].concat(a0.linhas.slice(0, 3).map((l: any) => l.texto)) : [];
      } else if (id === 'kpi.anual') {
        const dot = n.orc && n.orc.dot ? n.orc.dot : {};
        const anos = (x.anos as any[]).filter((a) => typeof a.t === 'number' && a.t > 0);
        conta = [t('Média da dotação a solicitar nos anos de operação:') + ' ' + anos.map((a) => a.rotulo + ' ' + fmt.curto(+dot[a.t] || 0)).join('; ') + '.'];
      } else if (id === 'kpi.porAluno') conta = (x.origem as string[]).filter((l) => /^(Usuários ativos|Nem todas usam|Pessoas que poderiam)/.test(l)).slice(0, 3);
      else if (id === 'saida') {
        const sa = (x.anos as any[]).find((a) => a.id === 'saida');
        conta = sa ? [t('Custo de transição e saída, no fim do horizonte:') + ' ' + fmt.curto(sa.totalMostrado || 0) + '.'].concat((sa.linhas || []).slice(0, 3).map((l: any) => l.texto)) : [];
      }
    }
    premissas = (premissasUnitarias(e, cfg) as string[]).slice(0, id === 'kpi.porAluno' ? 3 : 4);
  } catch (err) { console.warn(err); }
  return { origem, conta, premissas, drivers, irCampo: drivers[0] };
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
    lacunas: lacunasDe(e), nAlta: recs.filter((r) => r.prioridade === 'alta').length, paraNumero: paraNumeroDe(e),
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
