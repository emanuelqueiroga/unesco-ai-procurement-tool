// Síntese de fim de capítulo: até dois parágrafos em prosa a partir das respostas, sem veredito, e o número que o
// capítulo libera (2: custo do teste; 3: custo do primeiro ano; 4: custo total). Pura.
// R6 (REC-42; seção 5.6): o capítulo 4 termina com "Seu próximo passo" (`proximo`): o veredito e o porquê, as 3
// primeiras ações com quem age e o marco, o custo e a dotação do Ano 0, o nível de cuidado numa frase e as respostas
// que faltam; as frases são as de plano/recplano.js, as mesmas de "Em resumo" e do PDF.
// PB-06: a recomendação e o porquê vêm do policy brief (plano/brief.js), a mesma frase de "Em resumo" e do painel.
import { totaisCtx, modoTeste, QUESTOES_G, NIVEIS_ADM, tr, rotulo, numerosCusto, pct } from '../domain';
import type { Estado14, Capitulo } from '../store';
import { cfgDe, respondido } from '../store';
import { fmt, sincronizar } from './ambiente';
import { t, minusc, minusc1 } from './textos';
import { crescimentoDoCaso } from './motor';
import { etapasTexto, prioridadesTexto, origemKpi, temNumeros, recsPlano, rotuloOpc, type KpiId } from './painel';
import { proximoPasso } from '../plano/recplano.js';
import { briefDados } from '../plano/brief.js';
import type { Origem } from '../store';

export interface Sintese {
  paragrafos: string[];
  kpi?: { id: KpiId | 'ano1'; label: string; value: string; fullValue: string; origem: Origem };
  nRecs: number;
  /** condições abertas (nível Condição; REC-19: sem "prioridade alta") */
  nCondicoes: number;
  /** capítulo 4: "Seu próximo passo" (5.6) */
  proximo?: Proximo | null;
}
export interface Proximo {
  titulo: string; veredito: string; porque: string; acoesTitulo: string;
  acoes: { id: string; oque: string; quem: string; marco: string; linha: string }[];
  custo: string; cuidado: string; faltam: number; faltamTxt: string; pdf: string;
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

/** Como o uso cresce (4.1.4 e 4.1.5): em passos iguais, em curva em S ou em ondas, com os anos e as porcentagens. */
export function textoCrescimento(c: Record<string, any>): string {
  const g = crescimentoDoCaso(c);
  if (g.tipo === 's') return t('o uso cresce em curva em S (devagar no começo, mais rápido no meio e devagar no fim)');
  if (g.tipo === 'ondas') {
    const o = g.ondas.map((x) => t('Ano {a}: {p}%', { a: x.ano, p: x.pct })).join('; ');
    return t('o uso cresce em ondas ({o})', { o }) + (g.patamar != null ? '; ' + t('depois da última onda o uso fica em {p}% das pessoas da rede', { p: g.patamar }) : '');
  }
  return t('o uso cresce em passos iguais');
}

function cap4(e: Estado14): string[] {
  const c = e.caso;
  const out: string[] = [];
  const ondas = crescimentoDoCaso(c).tipo === 'ondas';
  if (+c.elegiveis) out.push(t('Em toda a rede, {n} pessoas usariam a ferramenta', { n: fmt.int(c.elegiveis) }));
  // com ondas, as ondas substituem a resposta do 4.1.2: a meta "em quanto tempo" sai da frase
  if (c.expansao && !ondas) out.push(t('a meta é chegar a todas {q}', { q: minusc(rotuloOpc('expansao', c.expansao)) }));
  // chegando à rede toda no primeiro ano (4.1.2), não há curva a descrever
  if (out.length && (ondas || (c.expansao && c.expansao !== 'ano1'))) out.push(textoCrescimento(c));
  return out.length ? [ponto(out.join('; '))] : [t('O tamanho da rede inteira ainda não foi informado: o plano usa a estimativa a partir das etapas.')];
}

/**
 * O que cada fase do custo (Prova de conceito ou piloto, Implantação, Expansão) tem a dizer no capítulo correspondente
 * (2, 3 e 4): a parte de pagamento único e a recorrente. Em porcentagem no 2 e no 3, porque o número do capítulo
 * (custo do teste, custo do primeiro ano) está em preços constantes e a fase em valor presente; no 4, o custo da expansão.
 */
export function fraseDaFase(n: Capitulo, fases: any): string {
  const id = n === 2 ? 'piloto' : n === 3 ? 'implantacao' : n === 4 ? 'expansao' : '';
  const f = fases && fases.porFase ? fases.porFase[id] : null;
  if (!f || !f.anos || !f.anos.length || !(f.total > 0)) return '';
  const u = pct(f.unico / f.total), r = pct(f.recorrente / f.total);
  if (n !== 4) return t('Do custo da fase de {nome}, {u} é pagamento único e {r} é recorrente.', { nome: minusc(t(f.nome)), u, r });
  const a0 = f.anos[0], a1 = f.anos[f.anos.length - 1];
  const anos = a0 === a1 ? t('Ano ' + a0) : t('Anos {0} a {1}', { 0: a0, 1: a1 });
  return t('A fase de {nome} ({anos}) custa {v}: {u} é pagamento único e {r} é recorrente.', { nome: minusc(t(f.nome)), anos, v: fmt.curto(f.total), u, r });
}

export function sinteseCapitulo(n: Capitulo, e: Estado14): Sintese {
  sincronizar(e);
  const paragrafos = n === 1 ? cap1(e) : n === 2 ? cap2(e) : n === 3 ? cap3(e) : cap4(e);
  const recs = recsPlano(e);
  let kpi: Sintese['kpi'];
  if (n > 1 && temNumeros(e)) {
    const num = numerosCusto(cfgDe(e)) as any;
    const fase = fraseDaFase(n, num.av && num.av.fases);
    if (fase && paragrafos.length) paragrafos[paragrafos.length - 1] += ' ' + fase;
    if (n === 2) kpi = { id: 'kpi.ano0', label: t('Custo do teste (Ano 0)'), value: fmt.curto(num.ano0), fullValue: fmt.cheio(num.ano0), origem: origemKpi(e, 'kpi.ano0') };
    else if (n === 3) { const v = (num.av.ecoAno || [])[1] || 0; kpi = { id: 'ano1', label: t('Custo do primeiro ano de uso (Ano 1)'), value: fmt.curto(v), fullValue: fmt.cheio(v), origem: origemKpi(e, 'kpi.anual') }; }
    else kpi = { id: 'kpi.total', label: t('Custo total, {H} anos', { H: num.H }), value: fmt.curto(num.total), fullValue: fmt.cheio(num.total), origem: origemKpi(e, 'kpi.total') };
  }
  let proximo: Proximo | null = null;
  if (n === 4) {
    try { proximo = proximoPasso(e) as Proximo | null; } catch (err) { console.warn(err); }
    if (proximo) {
      try {
        const b: any = (briefDados as (x: Estado14) => any)(e);
        if (b && b.recomendacao && b.recomendacao.texto) proximo = { ...proximo, veredito: String(b.recomendacao.texto), porque: String(b.recomendacao.porque || '') };
      } catch (err) { console.warn(err); }
    }
  }
  return { paragrafos: paragrafos.length ? paragrafos : [t('Este capítulo ainda não tem respostas: o plano usa as premissas padrão.')], kpi, nRecs: recs.length,
    nCondicoes: recs.filter((r) => r.nivel === 'condicao').length, proximo };
}
