// Perguntas do modo Essencial e vínculo resposta → trecho do plano
// (spec, "Mapa das 51 perguntas para as 24 do Essencial" e "Comportamentos que fazem a narrativa").
import { CAMPOS, CAMPO_POR_ID, QUESTOES_G, REGRAS_REC, modoTeste, percursoGovernanca, percursoEducacaoV20, percursoCombinado, percursoLetramentoV23, prioridadesNoCombinado } from '../domain';
import type { Capitulo } from './tipos';
import { CATEGORIAS } from '../domain/catalogo_v016.js';

export interface TelaEssencial {
  /** id da tela (o id do campo principal; 'governanca' para as seis 1.3.x) */
  id: string;
  capitulo: Capitulo;
  /** números das perguntas da v13 que a tela reúne */
  n: string[];
  /** ids dos campos de CAMPOS (ou de QUESTOES_G, g-*) que a tela responde */
  campos: string[];
  /** observação da spec (só totais, até 3, condicional…) */
  nota?: string;
}

// As 25 telas do Essencial, na ordem da spec: 1.1.1, 1.1.2, 1.1.3, 1.1.4+1.1.5, 1.2.1, 1.2.2, 1.2.4, 1.2.5, 1.2.7, 1.2.8,
// governança (1.3.1–1.3.6, uma tela), 2.0, 2.1.1, 2.2.1, 2.2.2+2.2.3, 2.3.4, 2.3.5, 2.3.8, 2.4.1+2.4.2, 2.4.3, 2.5.1+2.5.4,
// 2.6.2, 3.1.1, 4.1.1, 4.1.2. As demais perguntas de CAMPOS ficam no modo Refinar com a premissa padrão.
export const ESSENCIAL: TelaEssencial[] = [
  // v018: o planejamento é sempre do país (sem 1.1.1) e vai do lugar direto à prioridade (sem 1.1.3), como na v017;
  // os valores já salvos de nível e situação continuam guardados, e a situação usa a premissa padrão.
  { id: 'local', capitulo: 1, n: ['1.1.2'], campos: ['local'] },
  { id: 'prioridades', capitulo: 1, n: ['1.2.1'], campos: ['prioridades'] },
  { id: 'etapas', capitulo: 1, n: ['1.1.4', '1.1.5'], campos: ['etapas', 'grade'], nota: 'só totais; detalhe por ano em Refinar' },
  { id: 'problemas', capitulo: 1, n: ['1.2.2'], campos: ['problemas'], nota: 'até 3; subcategorias e "outro problema" em Refinar' },
  { id: 'problema', capitulo: 1, n: ['1.2.4'], campos: ['problema'] },
  { id: 'impactos', capitulo: 1, n: ['1.2.5'], campos: ['impactos'] },
  { id: 'linhaBase', capitulo: 1, n: ['1.2.7'], campos: ['linhaBase'], nota: 'detalhes em Refinar' },
  { id: 'alternativa', capitulo: 1, n: ['1.2.8'], campos: ['alternativa'] },
  { id: 'governanca', capitulo: 1, n: ['1.3.1', '1.3.2', '1.3.3', '1.3.4', '1.3.5', '1.3.6'], campos: QUESTOES_G.map((q: any) => q.id), nota: 'uma tela; os detalhes respDet em Refinar' },
  { id: 'testes', capitulo: 2, n: ['2.0'], campos: ['testes'] },
  { id: 'tarefas', capitulo: 2, n: ['2.1.1'], campos: ['tarefas'] },
  { id: 'usuarios', capitulo: 2, n: ['2.2.1'], campos: ['usuarios'] },
  { id: 'afetados', capitulo: 2, n: ['2.2.2', '2.2.3'], campos: ['afetados', 'consequencias'] },
  { id: 'tipoTec', capitulo: 2, n: ['2.3.4'], campos: ['tipoTec'], nota: 'com "não sei"' },
  { id: 'pagamento', capitulo: 2, n: ['2.3.5'], campos: ['pagamento'], nota: 'sugerido' },
  { id: 'piloto', capitulo: 2, n: ['2.3.8'], campos: ['piloto'], nota: 'sugerido' },
  { id: 'internet', capitulo: 2, n: ['2.4.1', '2.4.2'], campos: ['internet', 'escolasInternet'], nota: '2.4.2 condicional' },
  { id: 'modeloDisp', capitulo: 2, n: ['2.4.3'], campos: ['modeloDisp'] },
  { id: 'formados', capitulo: 2, n: ['2.5.1', '2.5.4'], campos: ['formados', 'formacaoHoras'], nota: 'horas com estimativa' },
  { id: 'suporteNivel', capitulo: 2, n: ['2.6.2'], campos: ['suporteNivel'] },
  { id: 'implantacao', capitulo: 3, n: ['3.1.1'], campos: ['implantacao'], nota: 'sugerido' },
  { id: 'elegiveis', capitulo: 4, n: ['4.1.1'], campos: ['elegiveis'], nota: 'sugerido' },
  { id: 'expansao', capitulo: 4, n: ['4.1.2'], campos: ['expansao'] },
];

/** ids de todos os campos do Essencial (inclui g-*) */
export const CAMPOS_ESSENCIAIS: string[] = ESSENCIAL.flatMap(t => t.campos);
export const CAPITULOS: Capitulo[] = [1, 2, 3, 4];
export type EscopoPercurso = { ctx?: Record<string, any> };
// v018: o fluxo da governança é o da v017 (Contexto → Categorias → Opções, com os valores de cada opção marcada); vale
// quando a única prioridade é a governança. As demais combinações seguem o percurso da 0.0.14 (ESSENCIAL).
// Cada categoria escolhida tem a sua página (na ordem do catálogo: 1.1, 1.2...), e os custos adicionais, com a
// duração do plano, fecham o fluxo numa página própria.
type CategoriaGov = { id: string; n: string; nome: string; desafio: string };
const CATEGORIAS_GOV = (CATEGORIAS as unknown as { governanca: CategoriaGov[] }).governanca;
export const PREFIXO_OPCOES_GOV = 'gov-opcoes-';
export const TELA_ADICIONAIS_GOV = 'gov-adicionais';
/** Id da página de uma categoria da governança ('gov-opcoes-g11'). */
export const telaOpcoesGov = (cat: string) => PREFIXO_OPCOES_GOV + cat;
/** Categoria da governança de uma página de opções (ou null). */
export const categoriaDaTelaGov = (id: string) => id.startsWith(PREFIXO_OPCOES_GOV) ? id.slice(PREFIXO_OPCOES_GOV.length) : null;
/** Nome (sem número) e número da categoria de uma página de opções da governança. */
export function categoriaGov(id: string): CategoriaGov | undefined { const c = categoriaDaTelaGov(id); return c ? CATEGORIAS_GOV.find(x => x.id === c) : undefined; }
/** Categorias da governança escolhidas e disponíveis para os desafios marcados, na ordem do catálogo. */
export function categoriasGovAtivas(ctx?: Record<string, any>): string[] {
  const problemas: unknown[] = Array.isArray(ctx?.problemas) ? ctx!.problemas : [], sel: unknown = ctx?.govOrcamento?.categorias;
  const escolhidas = Array.isArray(sel) ? sel : [];
  return CATEGORIAS_GOV.filter(c => problemas.includes(c.desafio) && escolhidas.includes(c.id)).map(c => c.id);
}
// v022.1: navegação em profundidade: as páginas de opções ficam no capítulo 2, logo depois das categorias do desafio
const TELAS_CATEGORIAS_GOV: TelaEssencial[] = CATEGORIAS_GOV.map(c => ({ id: telaOpcoesGov(c.id), capitulo: 2 as Capitulo, n: [], campos: ['govOrcamento'] }));
// v019: as categorias de custo ficam numa página por desafio (como no Figma), na ordem dos desafios do catálogo; só as
// dos desafios marcados entram no fluxo. A antiga página única ('gov-categorias') leva à do primeiro desafio marcado.
export const PREFIXO_CATEGORIAS_GOV = 'gov-categorias-';
export const DESAFIOS_COM_CATEGORIAS: string[] = [...new Set(CATEGORIAS_GOV.map(c => c.desafio))];
/** Id da página das categorias de um desafio ('gov-categorias-G21'). */
export const telaCategoriasGov = (desafio: string) => PREFIXO_CATEGORIAS_GOV + desafio;
/** Desafio de uma página de categorias da governança (ou null). */
export const desafioDaTelaCategorias = (id: string) => id.startsWith(PREFIXO_CATEGORIAS_GOV) ? id.slice(PREFIXO_CATEGORIAS_GOV.length) : null;
const TELAS_ESCOLHA_GOV: TelaEssencial[] = DESAFIOS_COM_CATEGORIAS.map(d => ({ id: telaCategoriasGov(d), capitulo: 2 as Capitulo, n: [], campos: ['govOrcamento'] }));
export const GOVERNANCA: TelaEssencial[] = [
  ...ESSENCIAL.filter(t => ['local', 'prioridades', 'problemas'].includes(t.id)),
  // v022.1: em profundidade: para cada desafio, a página das categorias dele e, em seguida, as opções de cada categoria
  // (1.1, 1.2...); depois o próximo desafio; os custos adicionais fecham o fluxo, no capítulo 3
  ...TELAS_ESCOLHA_GOV.flatMap(tc => [tc, ...TELAS_CATEGORIAS_GOV.filter(to => CATEGORIAS_GOV.find(c => telaOpcoesGov(c.id) === to.id)?.desafio === desafioDaTelaCategorias(tc.id))]),
  ...TELAS_CATEGORIAS_GOV.filter(to => !TELAS_ESCOLHA_GOV.some(tc => CATEGORIAS_GOV.find(c => telaOpcoesGov(c.id) === to.id)?.desafio === desafioDaTelaCategorias(tc.id))),
  { id: TELA_ADICIONAIS_GOV, capitulo: 3, n: [], campos: ['govOrcamento'] },
];
/** Fluxo da governança do caso: só as páginas das categorias escolhidas. */
function governancaDoCaso(ctx?: Record<string, any>): TelaEssencial[] {
  const ativas = new Set(categoriasGovAtivas(ctx).map(telaOpcoesGov));
  const problemas: unknown[] = Array.isArray(ctx?.problemas) ? ctx!.problemas : [];
  const desafios = DESAFIOS_COM_CATEGORIAS.filter(d => problemas.includes(d));
  return GOVERNANCA.filter(t => {
    if (t.id.startsWith(PREFIXO_OPCOES_GOV)) return ativas.has(t.id);
    const d = desafioDaTelaCategorias(t.id);
    // sem desafio marcado, a página do primeiro desafio fica no fluxo (e avisa para voltar e escolher)
    return d === null || desafios.includes(d) || (!desafios.length && d === DESAFIOS_COM_CATEGORIAS[0]);
  });
}
/** Página de categorias do primeiro desafio marcado (para onde vão os links antigos de 'gov-categorias'). */
export function entradaCategoriasGov(e?: EscopoPercurso): string {
  const problemas: unknown[] = Array.isArray(e?.ctx?.problemas) ? e!.ctx!.problemas : [];
  return telaCategoriasGov(DESAFIOS_COM_CATEGORIAS.find(d => problemas.includes(d)) || DESAFIOS_COM_CATEGORIAS[0]);
}
/** Primeira página de opções da governança (a da primeira categoria escolhida; sem categoria, a dos custos adicionais).
 *  É para onde vão os links antigos da página única de opções ('gov-opcoes'). */
export function entradaOpcoesGov(e?: EscopoPercurso): string {
  const c = categoriasGovAtivas(e?.ctx)[0];
  return c ? telaOpcoesGov(c) : TELA_ADICIONAIS_GOV;
}
/** Telas da governança que saíram do fluxo nas versões anteriores → a tela mantida mais próxima ('gov-opcoes', a antiga
 *  página única de opções, vai para entradaOpcoesGov). */
export const TELAS_FORA_DO_FLUXO: Record<string, string> = {
  'gov-categorias': 'gov-categorias', 'gov-opcoes': 'gov-opcoes', 'gov-recursos': 'gov-opcoes', 'gov-equipe': 'gov-categorias', 'gov-fases': 'gov-opcoes',
  'gov-projeto': 'gov-categorias', 'gov-diagnostico': 'gov-categorias', 'gov-instrumentos': 'gov-categorias', 'gov-solucoes': 'gov-categorias',
  'gov-atores': 'gov-categorias', 'gov-capacidade': 'gov-categorias', 'gov-acoes': 'gov-opcoes', 'gov-sandbox': 'gov-opcoes', 'gov-revisao': 'gov-opcoes',
};
// v021: Educating with and without AI. Depois da escolha dos desafios, cada desafio tem o seu ciclo de telas, como na
// governança: público e ambiente, fases, categorias, uma tela por categoria escolhida e o resumo do desafio. Depois do
// último desafio, os custos adicionais e o plano. As telas da v020 ('ed-publico', 'ed-fases', 'ed-custos-Cxx') saíram do
// fluxo; links antigos levam à primeira tela pendente.
export const PREFIXO_CUSTOS_ED = 'ed-custos-';
export const DESAFIOS_ED_IDS = ['C31', 'C32', 'C33', 'C34', 'C35', 'C36', 'C37', 'C38'];
export const CATEGORIAS_ED_IDS = ['e1', 'e2', 'e3', 'e4'];
const PASSOS_ED = ['publico', 'fases', 'categorias', 'opcoes', 'resumo'] as const;
export type PassoEd = typeof PASSOS_ED[number];
export const telaCustosEd = (d: string) => PREFIXO_CUSTOS_ED + d;
export const telaEd = (passo: PassoEd, d: string, cat?: string) => passo === 'opcoes' ? `ed-opcoes-${d}-${cat}` : `ed-${passo}-${d}`;
/** Passo, desafio e categoria de uma tela da educação (ou null). */
export function partesTelaEd(id: string): { passo: PassoEd | 'custos'; d: string; cat?: string } | null {
  const m = /^ed-(publico|fases|categorias|opcoes|resumo|custos)-(C\d+)(?:-(e\d))?$/.exec(id);
  return m ? { passo: m[1] as PassoEd | 'custos', d: m[2], cat: m[3] } : null;
}
/** Desafio de uma tela da educação (ou null). */
export const desafioDaTelaEd = (id: string) => partesTelaEd(id)?.d ?? null;
/** Categoria de uma tela de opções da educação (ou null). */
export const categoriaDaTelaEd = (id: string) => partesTelaEd(id)?.cat ?? null;
const telasDoDesafioEd = (d: string, cats: string[]): TelaEssencial[] => [
  { id: telaEd('publico', d), capitulo: 2, n: [], campos: ['edV20'] },
  { id: telaEd('fases', d), capitulo: 2, n: [], campos: ['edV20'] },
  { id: telaEd('categorias', d), capitulo: 2, n: [], campos: ['edV20'] },
  ...cats.map(c => ({ id: telaEd('opcoes', d, c), capitulo: 2 as Capitulo, n: [], campos: ['edV20'] })),
  { id: telaEd('resumo', d), capitulo: 2, n: [], campos: ['edV20'] },
];
export const EDUCACAO_V20: TelaEssencial[] = [
  ...ESSENCIAL.filter(t => ['local', 'prioridades'].includes(t.id)),
  { id: 'ed-desafios', capitulo: 1, n: [], campos: ['edV20'] },
  ...DESAFIOS_ED_IDS.flatMap(d => telasDoDesafioEd(d, CATEGORIAS_ED_IDS)),
  { id: 'ed-adicionais', capitulo: 3, n: [], campos: ['edV20'] },
];
/** Categorias escolhidas num desafio; sem escolha gravada (casos da v020), as das opções já marcadas. */
export function categoriasEdDoCaso(ctx: Record<string, any> | undefined, d: string): string[] {
  const e = ctx?.edV20 || {}, sel = e.categorias?.[d];
  const lista: unknown[] = Array.isArray(sel) ? sel : (Array.isArray(e.opcoes?.[d]) ? e.opcoes[d] : []).map((o: string) => String(o).slice(0, 2));
  return CATEGORIAS_ED_IDS.filter(c => lista.includes(c));
}
function educacaoDoCaso(ctx?: Record<string, any>): TelaEssencial[] {
  const ds: unknown[] = Array.isArray(ctx?.edV20?.desafios) ? ctx!.edV20.desafios : [];
  const escolhidos = DESAFIOS_ED_IDS.filter(d => ds.includes(d));
  return [
    ...EDUCACAO_V20.filter(t => !partesTelaEd(t.id) && t.id !== 'ed-adicionais'),
    // sem desafio escolhido, o ciclo do primeiro fica no fluxo (e avisa para voltar e escolher)
    ...(escolhidos.length ? escolhidos : [DESAFIOS_ED_IDS[0]]).flatMap(d => telasDoDesafioEd(d, categoriasEdDoCaso(ctx, d))),
    ...EDUCACAO_V20.filter(t => t.id === 'ed-adicionais'),
  ];
}
// v022.1: Educando sobre a IA (letramento), com o fluxo da governança: os desafios (A11, A12, A16) e, para cada desafio
// marcado, a página das categorias dele e uma página de opções por categoria marcada; depois as fases e os custos adicionais.
type CategoriaLit = { id: string; n: string; nome: string; desafio: string };
const CATEGORIAS_LIT = (CATEGORIAS as unknown as { letramento: CategoriaLit[] }).letramento;
export const DESAFIOS_LIT_IDS: string[] = [...new Set(CATEGORIAS_LIT.map(c => c.desafio))];
export const PREFIXO_CATEGORIAS_LIT = 'lit-categorias-', PREFIXO_OPCOES_LIT = 'lit-opcoes-', TELA_FASES_LIT = 'lit-fases', TELA_ADICIONAIS_LIT = 'lit-adicionais';
export const telaCategoriasLit = (d: string) => PREFIXO_CATEGORIAS_LIT + d;
export const telaOpcoesLit = (c: string) => PREFIXO_OPCOES_LIT + c;
export const desafioDaTelaCategoriasLit = (id: string) => id.startsWith(PREFIXO_CATEGORIAS_LIT) ? id.slice(PREFIXO_CATEGORIAS_LIT.length) : null;
export const categoriaDaTelaLit = (id: string) => id.startsWith(PREFIXO_OPCOES_LIT) ? id.slice(PREFIXO_OPCOES_LIT.length) : null;
/** Categoria do letramento de uma página de opções (ou undefined). */
export function categoriaLit(id: string): CategoriaLit | undefined { const c = categoriaDaTelaLit(id); return c ? CATEGORIAS_LIT.find(x => x.id === c) : undefined; }
/** Categorias do letramento escolhidas, dos desafios marcados, na ordem do catálogo. */
export function categoriasLitAtivas(ctx?: Record<string, any>): string[] {
  const problemas: unknown[] = Array.isArray(ctx?.problemas) ? ctx!.problemas : [], sel: unknown = ctx?.letramento?.orcamento?.categorias;
  const escolhidas = Array.isArray(sel) ? sel : [];
  return CATEGORIAS_LIT.filter(c => problemas.includes(c.desafio) && escolhidas.includes(c.id)).map(c => c.id);
}
/** As páginas de um percurso de letramento (sem as do contexto): em profundidade, categorias e opções de cada desafio; depois as fases. */
function letramentoDoDesafio(ctx?: Record<string, any>): TelaEssencial[] {
  const problemas: unknown[] = Array.isArray(ctx?.problemas) ? ctx!.problemas : [];
  const ds = DESAFIOS_LIT_IDS.filter(d => problemas.includes(d)), ativas = categoriasLitAtivas(ctx);
  // v022.1 (18/11): as fases vêm depois dos itens de todos os desafios (primeiro se escolhe o que entra, depois o ritmo)
  return [
    ...(ds.length ? ds : [DESAFIOS_LIT_IDS[0]]).flatMap(d => [
      { id: telaCategoriasLit(d), capitulo: 2 as Capitulo, n: [], campos: ['letramento'] },
      ...CATEGORIAS_LIT.filter(c => c.desafio === d && ativas.includes(c.id)).map(c => ({ id: telaOpcoesLit(c.id), capitulo: 2 as Capitulo, n: [], campos: ['letramento'] })),
    ]),
    { id: TELA_FASES_LIT, capitulo: 2, n: [], campos: ['letramento'] },
  ];
}
function letramentoDoCaso(ctx?: Record<string, any>): TelaEssencial[] {
  return [...ESSENCIAL.filter(t => ['local', 'prioridades', 'problemas'].includes(t.id)), ...letramentoDoDesafio(ctx), { id: TELA_ADICIONAIS_LIT, capitulo: 3, n: [], campos: ['letramento'] }];
}
export const TODAS_TELAS = [...ESSENCIAL, ...GOVERNANCA.filter(t => !ESSENCIAL.some(e => e.id === t.id)), ...EDUCACAO_V20.filter(t => t.id.startsWith('ed-')),
  { id: TELA_FASES_LIT, capitulo: 2 as Capitulo, n: [], campos: ['letramento'] },
  ...DESAFIOS_LIT_IDS.flatMap(d => [{ id: telaCategoriasLit(d), capitulo: 2 as Capitulo, n: [], campos: ['letramento'] },
    ...CATEGORIAS_LIT.filter(c => c.desafio === d).map(c => ({ id: telaOpcoesLit(c.id), capitulo: 2 as Capitulo, n: [], campos: ['letramento'] }))]),
  { id: TELA_ADICIONAIS_LIT, capitulo: 3 as Capitulo, n: [], campos: ['letramento'] }];
/** v022.1: governança e educação juntas. Capítulo 1: lugar, prioridades e desafios da governança; 2: categorias e
 *  opções da governança; 3: desafios e ciclo de cada desafio da educação; 4: uma tela de custos adicionais para as
 *  duas (a 'ed-adicionais', que no combinado mostra também os da governança). */
// v022.1: qualquer combinação de duas ou três prioridades, na ordem governança, educando sobre a IA, educando com e sem
// IA. Capítulo 1: contexto (com os desafios da governança e do letramento); 2: governança e letramento; 3: educação com e
// sem IA; os custos adicionais de todas numa tela só, no fim ('ed-adicionais' com a educação; sem ela, 'lit-adicionais').
function combinadoDoCaso(ctx?: Record<string, any>): TelaEssencial[] {
  const pr = prioridadesNoCombinado(ctx), gov = pr.includes('governar'), lit = pr.includes('sobre'), ed = pr.includes('com');
  const contexto = ESSENCIAL.filter(t => ['local', 'prioridades', ...(gov || lit ? ['problemas'] : [])].includes(t.id));
  const telasGov = gov ? governancaDoCaso(ctx).filter(t => t.capitulo !== 1 && t.id !== TELA_ADICIONAIS_GOV).map(t => ({ ...t, capitulo: 2 as Capitulo })) : [];
  const telasLit = lit ? letramentoDoDesafio(ctx) : [];
  const telasEd = ed ? educacaoDoCaso(ctx).filter(t => !['local', 'prioridades'].includes(t.id)).map(t => ({ ...t, capitulo: (t.id === 'ed-adicionais' ? 4 : 3) as Capitulo })) : [];
  return [...contexto, ...telasGov, ...telasLit, ...telasEd, ...(ed ? [] : [{ id: TELA_ADICIONAIS_LIT, capitulo: 3 as Capitulo, n: [], campos: ['letramento'] }])];
}
export function telasAtivas(e?: EscopoPercurso): TelaEssencial[] { return percursoCombinado(e?.ctx) ? combinadoDoCaso(e?.ctx) : percursoGovernanca(e?.ctx) ? governancaDoCaso(e?.ctx) : percursoLetramentoV23(e?.ctx) ? letramentoDoCaso(e?.ctx) : percursoEducacaoV20(e?.ctx) ? educacaoDoCaso(e?.ctx) : ESSENCIAL; }
export function telasDoCapitulo(n: Capitulo, e?: EscopoPercurso): TelaEssencial[] { return telasAtivas(e).filter(t => t.capitulo === n); }
export function telaDoCampo(campo: string): TelaEssencial | undefined { return ESSENCIAL.find(t => t.campos.includes(campo)) || TODAS_TELAS.find(t => t.campos.includes(campo)); }
export function essencial(campo: string): boolean { return CAMPOS_ESSENCIAIS.includes(campo); }
// Campos que o Refinar grava em ctx/caso mas que não são perguntas de CAMPOS (subcategorias e "Outro problema" do 1.2.2).
// ondeMora (caso.ts) procura o campo em CAMPO_POR_ID para saber se mora em ctx; sem este registro eles iriam para `caso`.
{
  const reg: any = CAMPO_POR_ID;
  if (!reg.subs) reg.subs = { id: 'subs', onde: 'ctx', tipo: 'extra', passo: '' };
  if (!reg.problemaOutro) reg.problemaOutro = { id: 'problemaOutro', onde: 'ctx', tipo: 'extra', passo: '' };
  // v018: dados do fluxo da governança (v017), guardados em ctx
  for (const id of ['govOrcamento', 'frenteAtiva', 'govSelecoes', 'govDetalhes', 'letramento', 'educacao', 'edV20']) { if (!reg[id]) reg[id] = { id, onde: 'ctx', tipo: 'extra', passo: '' }; }
}
/** capítulo dos campos de detalhe que não são perguntas de CAMPOS */
const CAPITULO_EXTRA: Record<string, Capitulo> = { subs: 1, problemaOutro: 1, linhaBaseProblemas: 1, linhaBaseProblemaTxt: 1, linhaBaseMedida: 1 };
/** capítulo de um campo: no Essencial pela tela; fora dele pela fase do passo em CAMPOS (contexto 1, piloto 2, implantacao 3, expansao 4) */
export function capituloDoCampo(campo: string): Capitulo {
  const t = telaDoCampo(campo);
  if (t) return t.capitulo;
  if (CAPITULO_EXTRA[campo]) return CAPITULO_EXTRA[campo];
  const f: any = (CAMPOS as any[]).find(c => c.id === campo);
  const p = f ? String(f.passo) : '';
  return (p.startsWith('1') ? 1 : p.startsWith('2') ? 2 : p.startsWith('3') ? 3 : 4) as Capitulo;
}

// ----------------------------------------------------------- resposta → trechos do plano
// Trechos: 'kpi.ano0' (custo do teste), 'kpi.anual' (dotação média por exercício), 'kpi.total' (custo do ciclo),
// 'kpi.porAluno', 'A1' (teste e implantação, TXT_A1/TXT_A1_POC), 'A2' (premissas da estimativa), 'rec:<id>' (regra de REGRAS_REC).
// Tabela mínima campo → KPIs: o que entra em cfgDoCaso muda a estimativa (CAMPOS_CUSTO em fluxo.js); o contexto
// (etapas, grade) muda a demanda padrão. Os ids de regras vêm de REGRAS_REC[].campo (as regras com campo em função
// — formacao-plano, ferramentas-*, gratis-adiados, dados-* — entram pelos campos que o seu contexto lê).
const KPIS_TODOS = ['kpi.ano0', 'kpi.anual', 'kpi.total', 'kpi.porAluno'];
const KPI_POR_CAMPO: Record<string, string[]> = {
  etapas: KPIS_TODOS, grade: KPIS_TODOS, usuarios: KPIS_TODOS, elegiveis: KPIS_TODOS, tarefas: KPIS_TODOS, tipoTec: KPIS_TODOS,
  testes: ['kpi.ano0', 'kpi.total', 'A1'], piloto: ['kpi.ano0', 'kpi.total', 'A1'], poc: ['kpi.ano0', 'kpi.total', 'A1'],
  implantacao: ['kpi.anual', 'kpi.total', 'A1'], expansao: ['kpi.anual', 'kpi.total', 'A1'], horizonte: ['kpi.anual', 'kpi.total'],
  pagamento: KPIS_TODOS, licenca: ['A2'], adaptacao: ['kpi.ano0', 'kpi.total'], arquitetura: KPIS_TODOS,
  nFerramentas: ['kpi.anual', 'kpi.total'], conheceFerramentas: ['A2'], ferramentas: KPIS_TODOS,
  internet: KPIS_TODOS, escolasInternet: KPIS_TODOS, modeloDisp: ['kpi.ano0', 'kpi.total'], dispExistem: ['kpi.ano0', 'kpi.total'],
  formados: ['kpi.ano0', 'kpi.anual', 'kpi.total'], formacaoHoras: ['kpi.ano0', 'kpi.anual', 'kpi.total'], formacaoFormato: ['kpi.ano0', 'kpi.anual', 'kpi.total'],
  formacaoTipo: ['A2'], formacaoPaga: ['kpi.anual', 'kpi.total'],
  suporteQuem: ['kpi.anual', 'kpi.total'], suporteNivel: ['kpi.anual', 'kpi.total'], acompanhamento: ['kpi.anual', 'kpi.total'],
  afetados: ['A2'], consequencias: ['A2'], frequencia: ['A2'],
  // v15 (MOT-02): perguntas opcionais do motor, só no Refinar do capítulo 4 (curva, ondas, reposição dos dispositivos, rotatividade)
  curva: ['kpi.anual', 'kpi.total', 'A2'], ondas: ['kpi.anual', 'kpi.total', 'A2'],
  reposicaoDisp: ['kpi.anual', 'kpi.total', 'A2'], rotacaoFormacao: ['kpi.anual', 'kpi.total', 'A2'],
  // R8 (REC-52): respostas do Refinar que mudam o risco, e com ele a governança proporcional (casoEfetivo), ou a revisão por volume (K5.3).
  // As demais perguntas novas só mudam recomendações e números ligados a elas (REC_DAS_PERGUNTAS_REC).
  publico: KPIS_TODOS, contestacaoExiste: KPIS_TODOS, treino: KPIS_TODOS, verificacao: KPIS_TODOS,
  revisao: ['kpi.ano0', 'kpi.anual', 'kpi.total'],
};
/**
 * R8 (REC-52): as 13 perguntas novas do Refinar (seção 7 de design/redesign/05-requisitos-recomendacoes.md), por capítulo.
 * Todas são `opcional` em CAMPOS, ficam fora do Essencial (que continua com 25 telas) e, sem resposta, valem "não informado":
 * a regra dispara na variante "Decidir…" e o motor mantém a premissa de antes. `revisao` só aparece com a tarefa de alerta precoce.
 */
export const CAMPOS_REC: Record<Capitulo, string[]> = {
  1: ['publico', 'altCustoEfeito', 'volumeResultado'],
  2: ['instrumentoTeste', 'contestacaoExiste', 'momentoUso', 'treino', 'tempoJornada', 'apoioEscola', 'revisao'],
  3: ['estrategiaCompra', 'dotacao', 'verificacao'],
  4: [],
};
/** todas as perguntas de CAMPOS_REC, em ordem de capítulo */
export const CAMPOS_REC_TODOS: string[] = ([1, 2, 3, 4] as Capitulo[]).flatMap(c => CAMPOS_REC[c]);
/**
 * Regras (ids do catálogo, `rec:<id>`) que leem uma pergunta nova sem que ela conste em `campos` da regra (REGRAS_REC): R-32 (contestacaoExiste),
 * R-73 (dotacao), R-55 (estrategiaCompra), R-56 (instrumentoTeste), R-31 (revisao, as horas da revisão caso a caso) e R-17 (altCustoEfeito e
 * volumeResultado, o efeito de empate e o custo por unidade). tempoJornada, apoioEscola e publico já entram por `campos` (R-46, R-47, R-52, R-53).
 */
export const REC_DAS_PERGUNTAS_REC: Record<string, string[]> = {
  contestacaoExiste: ['rec:R-32'], dotacao: ['rec:R-73'], estrategiaCompra: ['rec:R-55'], instrumentoTeste: ['rec:R-56'],
  revisao: ['rec:R-31'], altCustoEfeito: ['rec:R-17'], volumeResultado: ['rec:R-17'],
};
/** perguntas opcionais do motor (4.1.4 a 4.1.7): só no Refinar; nunca são lacuna e, sem resposta, valem os padrões da v13 */
export const CAMPOS_MOTOR = ['curva', 'ondas', 'reposicaoDisp', 'rotacaoFormacao'];
/**
 * "De onde vem?" dos números do motor (MOT-12): a pergunta (ou as perguntas) do Refinar que o número lê e, quando não há pergunta,
 * a nota da convenção. `nota` é texto em português para o consumidor passar por t().
 *  - curva: como o uso cresce (4.1.4 e, em ondas, 4.1.5); reposicao: ciclo dos dispositivos (4.1.6); rotatividade: 4.1.7;
 *  - fases: fronteiras dos anos (convenção, sem pergunta); unicoRecorrente: o que é pagamento único e o que é recorrente.
 */
export interface FonteMotor { campos: string[]; nota?: string }
export const FONTES_MOTOR: Record<string, FonteMotor> = {
  curva: { campos: ['curva', 'ondas'] },
  reposicao: { campos: ['reposicaoDisp'] },
  rotatividade: { campos: ['rotacaoFormacao'] },
  fases: { campos: [], nota: 'As fases seguem o calendário: o Ano 0 é a prova de conceito ou o piloto, o Ano 1 é a implantação e, do Ano 2 em diante, a expansão.' },
  unicoRecorrente: { campos: [], nota: 'O pagamento único reúne a implantação, a integração, a formação inicial e a compra de dispositivos. O recorrente reúne licenças, conectividade, operação, suporte, reciclagem da formação e reposição.' },
  regime: { campos: ['elegiveis', 'expansao', 'curva', 'ondas', 'horizonte'] },
};
/** o número tem uma pergunta do motor por trás? (ids de FONTES_MOTOR com pergunta) */
export function fonteMotor(id: string): FonteMotor | null { return FONTES_MOTOR[id] || null; }
/** trechos do plano que dependem de uma pergunta do motor: o inverso de afetadosPor para os 4 campos */
export function motorQueAfeta(trecho: string): string[] { return CAMPOS_MOTOR.filter((c) => (KPI_POR_CAMPO[c] || []).includes(trecho)); }

// regras cujo `campo` é função (lê o contexto k): campos de origem declarados aqui
const REGRAS_CAMPO_FN: Record<string, string[]> = {
  'formacao-plano': ['problemas', 'prioridades'], 'ferramentas-levantar': ['nFerramentas', 'conheceFerramentas'], 'ferramentas-interop': ['ferramentas', 'nFerramentas'],
  'ferramentas-sobrepostas': ['ferramentas'], 'gratis-adiados': ['pagamento', 'tipoTec'], 'dados-acordo': ['tarefas', 'usuarios'], 'dados-base-legal': ['tarefas', 'usuarios'], 'dados-impacto': ['tarefas', 'usuarios'],
};
const GOV = QUESTOES_G.map((q: any) => q.id as string);

/** trechos do plano que a resposta a `campo` pode mudar */
export function afetadosPor(campo: string): string[] {
  const base = String(campo).split('.')[0];
  const out: string[] = [];
  const add = (x: string) => { if (!out.includes(x)) out.push(x); };
  (KPI_POR_CAMPO[base] || []).forEach(add);
  if (GOV.includes(base)) add('rec:' + base);   // cada resposta Não/Em parte/Não sei vira uma ação (ACOES_G)
  (REC_DAS_PERGUNTAS_REC[base] || []).forEach(add);
  (REGRAS_REC as any[]).forEach(r => {
    const c = typeof r.campo === 'function' ? (REGRAS_CAMPO_FN[r.id] || []) : [r.campo];
    if (c.includes(base)) add('rec:' + r.id);
  });
  return out;
}

// ----------------------------------------------------------- perguntas só do Refinar que não são campos de CAMPOS
/**
 * Detalhes de perguntas do Essencial que só existem no modo Refinar: estudantes por ano (1.1.5), subcategorias e
 * "Outro problema" (1.2.2), medida da linha de base (1.2.7) e "Qual?/O que falta?" da governança (1.3.x). `id` é o
 * que a síntese usa para o âncora (`prem-<id>`); `campos` são os campos do estado que guardam a resposta.
 */
export interface ExtraRefinar { id: string; capitulo: Capitulo; n: string; campos: string[] }
export const EXTRAS_REFINAR: ExtraRefinar[] = [
  { id: 'grade', capitulo: 1, n: '1.1.5', campos: ['etapas'] },
  { id: 'subs', capitulo: 1, n: '1.2.2', campos: ['subs'] },
  { id: 'problemaOutro', capitulo: 1, n: '1.2.2', campos: ['problemaOutro'] },
  { id: 'linhaBase', capitulo: 1, n: '1.2.7', campos: ['linhaBaseProblemas', 'linhaBaseProblemaTxt', 'linhaBaseMedida'] },
  { id: 'governanca', capitulo: 1, n: '1.3', campos: [] },
];
export function extrasDoCapitulo(capitulo: Capitulo): ExtraRefinar[] { return EXTRAS_REFINAR.filter(x => x.capitulo === capitulo); }
/** o id de âncora de um campo na síntese (`#/capitulo/:n/sintese/:campo`): campos de detalhe apontam para o seu bloco */
export function idDoFoco(campo: string): string {
  const c = String(campo || '');
  if (/^g-/.test(c)) return 'governanca';
  if (['linhaBaseProblemas', 'linhaBaseProblemaTxt', 'linhaBaseMedida'].includes(c)) return 'linhaBase';
  return c;
}
/** compara números de pergunta ("1.2.7" < "1.3" < "2.0") */
export function comparaN(a: string, b: string): number {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d; }
  return 0;
}

// ----------------------------------------------------------- ajuda da tela ("Por que perguntamos isso?")
/**
 * Textos de ajuda (`h` e `ex` do domínio, sem traduzir) de todos os campos da tela, e não só do primeiro: as telas
 * compostas (2.2.2 + 2.2.3, 1.1.4 + 1.1.5, 2.4.1 + 2.4.2…) mostram a ajuda de cada pergunta, e o tamanho do teste (2.3.8) usa as
 * variantes da prova de conceito e dos dois (`hPoc/exPoc`, `hAmbos/exAmbos`). Na governança cada linha mostra a sua.
 */
export function ajudaDaTela(caso: Record<string, any>, tela: TelaEssencial): string[] {
  const out: string[] = [];
  if (tela.id === 'governanca') return out;
  const add = (x?: unknown) => { if (typeof x === 'string' && x && !out.includes(x)) out.push(x); };
  tela.campos.forEach(c => {
    const f: any = (CAMPO_POR_ID as any)[c];
    if (!f) return;
    if (f.id === 'piloto') {
      const m = modoTeste(caso);
      if (m === 'poc') { add(f.hPoc); add(f.exPoc); } else if (m === 'ambos') { add(f.hAmbos); add(f.exAmbos); } else { add(f.h); add(f.ex); }
      return;
    }
    add(f.h); add(f.ex);
  });
  return out;
}
