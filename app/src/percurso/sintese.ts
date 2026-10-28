// Síntese de fim de capítulo: até dois parágrafos em prosa a partir das respostas, sem veredito, e o número que o
// capítulo libera (2: custo do teste; 3: custo do primeiro ano; 4: custo total). Pura.
import { totaisCtx, modoTeste, QUESTOES_G, NIVEIS_ADM, tr, rotulo, numerosCusto } from '../domain';
import type { Estado14, Capitulo } from '../store';
import { cfgDe, respondido } from '../store';
import { fmt, sincronizar } from './ambiente';
import { t, minusc, minusc1 } from './textos';
import { etapasTexto, prioridadesTexto, origemKpi, temNumeros, recsPlano, rotuloOpc, type KpiId } from './painel';
import type { Origem } from '../store';

export interface Sintese {
  paragrafos: string[];
  kpi?: { id: KpiId | 'ano1'; label: string; value: string; fullValue: string; origem: Origem };
  nRecs: number;
  recsAltas: string[];
}

const lista = (xs: string[]) => {
  const v = xs.filter(Boolean);
  if (v.length <= 1) return v.join('');
  return v.slice(0, -1).join(', ') + ' ' + t('e') + ' ' + v[v.length - 1];
};
const nomesOpc = (k: string, vs: string[]) => (vs || []).map((v) => minusc(rotuloOpc(k, v))).filter(Boolean);
const ponto = (s: string) => (s && !/[.!?]$/.test(s) ? s + '.' : s);

function cap1(e: Estado14): string[] {
  const x = e.ctx, tt = totaisCtx(x);
  const rede = String(x.local || '').trim() || t('A rede');
  const nivel = x.nivel === 'outro' ? String(x.nivelOutro || '') : x.nivel ? rotulo(NIVEIS_ADM, x.nivel) : '';
  const { prioridades, problemas } = prioridadesTexto(e);
  const p1: string[] = [];
  const tamanho = tt.escolas || tt.alunos ? t('tem {e} escolas e {a} estudantes', { e: fmt.int(tt.escolas), a: fmt.int(tt.alunos) }) : '';
  const et = etapasTexto(e);
  p1.push(ponto([rede, nivel ? `(${minusc(String(tr(nivel)))})` : '', tamanho, et ? t('em {et}', { et }) : ''].filter(Boolean).join(' ')));
  if (problemas.length) p1.push(ponto(t('O problema a resolver: {p}', { p: lista(problemas.map(minusc1)) })));
  else if (prioridades.length) p1.push(ponto(t('A prioridade é {p}', { p: lista(prioridades.map(minusc)) })));
  if (respondido(e, 'linhaBase')) p1.push(e.caso.linhaBase === 'nao' ? t('Ainda não há uma medida atual do problema.') : t('Já existe uma medida atual do problema, ao menos em parte.'));
  const g = (QUESTOES_G as any[]).map((q) => e.resp[q.id]).filter(Boolean) as string[];
  const p2: string[] = [];
  if (g.length) {
    const sim = g.filter((r) => r === 'sim').length, parte = g.filter((r) => r === 'parcial').length;
    p2.push(sim === 6 ? t('A governança de IA da rede está estruturada nas seis frentes perguntadas.') : t('Na governança de IA, {s} de 6 frentes já estão estruturadas e {p} em parte; o plano traz ações para as demais.', { s: sim, p: parte }));
  }
  if (respondido(e, 'alternativa')) p2.push(e.caso.alternativa === 'sim' ? t('Uma alternativa sem IA já foi comparada.') : t('Nenhuma alternativa sem IA foi comparada ainda.'));
  return [p1.join(' '), p2.join(' ')].filter(Boolean);
}

function cap2(e: Estado14): string[] {
  const c = e.caso, m = modoTeste(c), p = c.piloto || {}, poc = c.poc || {};
  const p1: string[] = [];
  const tarefas = nomesOpc('tarefas', c.tarefas);
  const tipo = c.tipoTec ? minusc(rotuloOpc('tipoTec', c.tipoTec)) : '';
  if (m === 'poc') p1.push(t('O teste será uma prova de conceito com {p} pessoas por {m} meses', { p: fmt.int(poc.participantes), m: fmt.int(poc.meses) }));
  else if (m) p1.push(t('O teste será {qual} em {e} escolas por {m} meses, com cerca de {p} participantes', {
    qual: m === 'ambos' ? t('uma prova de conceito seguida de um piloto') : t('um piloto'), e: fmt.int(p.escolas), m: fmt.int(p.meses), p: fmt.int(p.participantes),
  }));
  if (tarefas.length) p1.push(t('A IA deve {t}', { t: lista(tarefas.map(minusc1)) }));
  if (tipo) p1.push(t('A ferramenta principal é do tipo: {t}', { t: tipo }));
  const p2: string[] = [];
  if (c.internet) p2.push(c.internet === 'sim' ? t('As escolas têm internet adequada') : c.internet === 'parcial' ? (+c.escolasInternet ? t('{n} escolas têm internet adequada', { n: fmt.int(c.escolasInternet) }) : t('Só parte das escolas tem internet adequada')) : t('As escolas vão precisar de conexão nova ou melhor'));
  const formados = nomesOpc('formados', c.formados);
  if (formados.length) p2.push(t('{f} recebem {h} horas de formação', { f: lista(formados), h: fmt.int(c.formacaoHoras) }));
  if (c.suporteNivel) p2.push(t('o suporte é {s}', { s: minusc(rotuloOpc('suporteNivel', c.suporteNivel)) }));
  return [p1.map(ponto).join(' '), p2.length ? ponto(p2.join('; ')).replace(/^./, (x) => x.toUpperCase()) : ''].filter(Boolean);
}

function cap3(e: Estado14): string[] {
  const i = e.caso.implantacao || {};
  if (!(+i.escolas || +i.pessoas)) return [t('A primeira etapa ainda não tem tamanho: o plano usa a sugestão de um terço da rede.')];
  return [ponto(t('No primeiro ano de uso real, {e} escolas e {p} pessoas usam a ferramenta', { e: fmt.int(i.escolas), p: fmt.int(i.pessoas) }))];
}

function cap4(e: Estado14): string[] {
  const c = e.caso;
  const out: string[] = [];
  if (+c.elegiveis) out.push(t('Em toda a rede, {n} pessoas usariam a ferramenta', { n: fmt.int(c.elegiveis) }));
  if (c.expansao) out.push(t('a meta é chegar a todas {q}', { q: minusc(rotuloOpc('expansao', c.expansao)) }));
  return out.length ? [ponto(out.join('; '))] : [t('O tamanho da rede inteira ainda não foi informado: o plano usa a estimativa a partir das etapas.')];
}

export function sinteseCapitulo(n: Capitulo, e: Estado14): Sintese {
  sincronizar(e);
  const paragrafos = n === 1 ? cap1(e) : n === 2 ? cap2(e) : n === 3 ? cap3(e) : cap4(e);
  const recs = recsPlano(e);
  let kpi: Sintese['kpi'];
  if (n > 1 && temNumeros(e)) {
    const num = numerosCusto(cfgDe(e)) as any;
    if (n === 2) kpi = { id: 'kpi.ano0', label: t('Custo do teste (Ano 0)'), value: fmt.curto(num.ano0), fullValue: fmt.cheio(num.ano0), origem: origemKpi(e, 'kpi.ano0') };
    else if (n === 3) { const v = (num.av.ecoAno || [])[1] || 0; kpi = { id: 'ano1', label: t('Custo do primeiro ano de uso (Ano 1)'), value: fmt.curto(v), fullValue: fmt.cheio(v), origem: origemKpi(e, 'kpi.anual') }; }
    else kpi = { id: 'kpi.total', label: t('Custo total, {H} anos', { H: num.H }), value: fmt.curto(num.total), fullValue: fmt.cheio(num.total), origem: origemKpi(e, 'kpi.total') };
  }
  return { paragrafos: paragrafos.length ? paragrafos : [t('Este capítulo ainda não tem respostas: o plano usa as premissas padrão.')], kpi, nRecs: recs.length, recsAltas: recs.filter((r) => r.prioridade === 'alta').map((r) => r.texto) };
}
