// Versão de teste: valores pré-preenchidos nos fluxos enxutos, para a pessoa só ajustar o que precisar.
// Cada frente guarda em `sugeridos` (caminho → valor sugerido, em JSON) o que a ferramenta preencheu. Um campo vazio,
// ou ainda igual ao que foi sugerido, recebe a sugestão atual (assim os participantes acompanham os totais e a
// situação de um item passa a "Usar estimativa" quando a conta fecha); um campo que a pessoa mudou não é tocado.
import { ALUNOS_POR_PROF, totaisCtx } from '../domain';
import type { Estado14 } from '../store/tipos';
import { alterarLit, custosLetramento, lerLit, publicosLetramento, telasLetramento } from './letramento';
import { chaveEd, custosEd, lerEd, temasEd, usaIAEd } from './pedagogico';
import { CUSTOS_GOV, temSandbox } from './governanca';
import { presetGovernanca, selecoesGov, textoSelecaoGov } from './governancaPresets';
import { estimativaReferencia, temBaseEstimativa, type FrenteEstimativa } from './estimativasOrcamento';

type Estado = Pick<Estado14, 'ctx' | 'moeda'> & Partial<Pick<Estado14, 'caso'>>;
export interface Escrita { campo: string; valor: any }
interface Desejo { caminho: string; valor: any; /** só preenche quando vazio (não acompanha mudanças) */ fixo?: boolean }

/** Convenções de partida (editáveis; marcadas como sugeridas na tela). */
export const PADROES = {
  equipeFte: 2,
  horasLit: { A11: 30, A12: 20, A13: 12, A14: 10, A15: 20 } as Record<string, number>,
  participantesA13: 50,
  servidores: 50, horasServidor: 20, horasProfissional: 30,
};

const J = (v: unknown) => JSON.stringify(v ?? null);
const numPos = (v: unknown): number => typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
const val = (v: any): number => numPos(v?.situacao === 'a_levantar' ? 0 : v?.valor);
/** campo sem resposta: nada, texto vazio, zero, objeto sem valor, sem escolhas e sem situação */
function vazio(v: any): boolean {
  if (v == null || v === '' || v === 0) return true;
  if (typeof v !== 'object' || Array.isArray(v)) return false;
  if (v.situacao) return false;
  if (Array.isArray(v.escolhas) && v.escolhas.length) return false;
  if (v.detalhe && String(v.detalhe).trim()) return false;
  return v.valor == null || v.valor === '';
}
const ler = (raiz: any, caminho: string) => caminho.split('.').reduce((o, k) => o?.[k], raiz);

/** Aplica os desejos a um objeto raiz da frente; devolve o novo objeto ou null quando nada muda. */
function aplicar(raiz: any, desejos: Desejo[]): any | null {
  let novo = raiz || {}, mudou = false;
  const marcas: Record<string, string> = { ...(novo.sugeridos || {}) };
  for (const d of desejos) {
    const atual = ler(novo, d.caminho), marca = marcas[d.caminho];
    const aindaSugerido = !d.fixo && (marca !== undefined && J(atual) === marca || atual?.origem === 'sugerido');
    if (!vazio(atual) && !aindaSugerido) continue;
    if (J(atual) === J(d.valor)) { if (marca !== J(d.valor)) { marcas[d.caminho] = J(d.valor); mudou = true; } continue; }
    novo = alterarLit(novo, d.caminho, d.valor); marcas[d.caminho] = J(d.valor); mudou = true;
  }
  return mudou ? { ...novo, sugeridos: marcas } : null;
}
/** O valor no caminho ainda é o que a ferramenta sugeriu? (para a marca "sugerido") */
export function ehSugerido(s: Pick<Estado14, 'ctx'>, frente: FrenteEstimativa, caminho: string): boolean {
  const raiz = frente === 'letramento' ? s.ctx.letramento : frente === 'educacao' ? s.ctx.educacao : s.ctx.govOrcamento;
  const completo = frente === 'educacao' && !/^(temas|contexto)(\.|$)/.test(caminho) ? 'percursos.' + chaveEd(s) + '.' + caminho : caminho;
  const atual = ler(raiz, completo), marca = raiz?.sugeridos?.[completo];
  return atual?.origem === 'sugerido' || marca !== undefined && !vazio(atual) && J(atual) === marca;
}

/** Situação sugerida de cada item: "Usar estimativa" quando a conta fecha, senão "A levantar". */
function itens(frente: FrenteEstimativa, ids: string[], s: Estado, prefixo: string): Desejo[] {
  return ids.map(id => {
    const est = temBaseEstimativa(frente, id) ? estimativaReferencia(frente, id, s) : null;
    return { caminho: prefixo + id, valor: { situacao: typeof est?.valor === 'number' ? 'referencia' : 'a_estimar' } };
  });
}

function desejosLit(s: Estado): Desejo[] {
  const r = (s.ctx as any).redeNacional || {}, tot = totaisCtx(s.ctx), pubs = publicosLetramento(s).map(p => p.id), out: Desejo[] = [];
  const escolasCtx = +r.escolas || tot.escolas, estudantesCtx = +r.estudantes || tot.alunos;
  const escolas = val(lerLit(s, 'alcance.escolas')) || escolasCtx, estudantes = val(lerLit(s, 'alcance.estudantes')) || estudantesCtx;
  const professores = val(lerLit(s, 'alcance.professores')) || (estudantes ? Math.max(1, Math.round(estudantes / ALUNOS_POR_PROF)) : 0);
  if (telasLetramento(s).includes('lit-escolas')) {
    const etapas = [...(tot.etapas.length ? tot.etapas : ['fund1', 'fund2', 'medio']), ...(pubs.includes('A15') ? ['superior'] : [])].filter((x, i, a) => a.indexOf(x) === i);
    out.push({ caminho: 'alcance.etapas', valor: { escolhas: etapas }, fixo: true });
    if (escolasCtx) out.push({ caminho: 'alcance.escolas', valor: { valor: escolasCtx } });
    if (estudantesCtx) out.push({ caminho: 'alcance.estudantes', valor: { valor: estudantesCtx } });
    if (estudantes) out.push({ caminho: 'alcance.professores', valor: { valor: Math.max(1, Math.round(estudantes / ALUNOS_POR_PROF)) } });
  }
  const base: Record<string, number> = { A11: professores, A12: estudantes, A13: PADROES.participantesA13, A14: escolas };
  for (const id of pubs) {
    if (base[id]) out.push({ caminho: `publicos.${id}.participantes`, valor: { valor: base[id] } });
    if (PADROES.horasLit[id]) out.push({ caminho: `publicos.${id}.horas`, valor: { valor: PADROES.horasLit[id] }, fixo: true });
  }
  out.push({ caminho: 'orcamento.periodo', valor: { escolhas: ['12'] }, fixo: true });
  out.push({ caminho: 'orcamento.quantidades.equipeFte', valor: PADROES.equipeFte, fixo: true });
  return out;
}
function desejosEd(s: Estado): Desejo[] {
  const tot = totaisCtx(s.ctx), comIA = (s.ctx.problemas || []).some((id: string) => /^C\d+$/.test(id));
  const out: Desejo[] = [{ caminho: 'intervencao.tipo', valor: { escolhas: [comIA ? 'mista' : 'sem'] }, fixo: true }];
  if (tot.alunos) out.push({ caminho: 'orcamento.quantidades.profissionais', valor: Math.max(1, Math.round(tot.alunos / ALUNOS_POR_PROF)) });
  out.push({ caminho: 'orcamento.quantidades.horasProfissional', valor: PADROES.horasProfissional, fixo: true });
  out.push({ caminho: 'orcamento.periodo', valor: { escolhas: ['anual'] }, fixo: true });
  out.push({ caminho: 'orcamento.quantidades.equipeFte', valor: PADROES.equipeFte, fixo: true });
  return out;
}
const comPrefixoEd = (s: Estado, ds: Desejo[]) => ds.map(d => ({ ...d, caminho: /^(temas|contexto)(\.|$)/.test(d.caminho) ? d.caminho : 'percursos.' + chaveEd(s) + '.' + d.caminho }));

/** Escritas que pré-preenchem a frente (vazio quando já está tudo preenchido). */
export function escritasPadroes(s: Estado, frente: FrenteEstimativa): Escrita[] {
  if (frente === 'letramento') {
    const r1 = aplicar(s.ctx.letramento, desejosLit(s)) ?? s.ctx.letramento ?? {};
    const s1 = { ...s, ctx: { ...s.ctx, letramento: r1 } };
    const ids = custosLetramento(s1).map(([id]) => id).filter(id => !id.startsWith('adicional-'));
    const r2 = aplicar(r1, itens('letramento', ids, s1, 'orcamento.itens.')) ?? r1;
    return r2 === (s.ctx.letramento ?? {}) || J(r2) === J(s.ctx.letramento) ? [] : [{ campo: 'letramento', valor: r2 }];
  }
  if (frente === 'educacao') {
    if (!temasEd(s as any).length) return [];
    let r1 = aplicar(s.ctx.educacao, comPrefixoEd(s, desejosEd(s))) ?? s.ctx.educacao ?? {};
    let s1: Estado = { ...s, ctx: { ...s.ctx, educacao: r1 } };
    if (usaIAEd(s1)) { r1 = aplicar(r1, comPrefixoEd(s1, [{ caminho: 'usoIA.quem', valor: { escolhas: ['professores'] }, fixo: true }])) ?? r1; s1 = { ...s, ctx: { ...s.ctx, educacao: r1 } }; }
    const ids = custosEd(s1 as any).map(c => c.id).filter(id => !id.startsWith('adicional-'));
    const r2 = aplicar(r1, comPrefixoEd(s1, itens('educacao', ids, s1, 'orcamento.itens.'))) ?? r1;
    return J(r2) === J(s.ctx.educacao) ? [] : [{ campo: 'educacao', valor: r2 }];
  }
  const out: Escrita[] = [];
  const campo = 'govOrcamento.periodo';
  let ctx = s.ctx;
  if (!selecoesGov(s, campo).length) {
    const op = presetGovernanca(s, campo).opcoes.find(o => o.texto === 'Próximos 12 meses');
    if (op) {
      const sel = { ...(ctx.govSelecoes || {}), [campo]: [op.id] }, texto = textoSelecaoGov({ ...s, ctx: { ...ctx, govSelecoes: sel } }, campo, [op.id], '');
      ctx = { ...ctx, govSelecoes: sel, govOrcamento: { ...(ctx.govOrcamento || {}), periodo: texto } };
      out.push({ campo: 'govSelecoes', valor: sel });
    }
  }
  const qs: Desejo[] = [['equipeFte', PADROES.equipeFte], ['servidores', PADROES.servidores], ['horasServidor', PADROES.horasServidor]]
    .map(([k, v]) => ({ caminho: 'quantidades.' + k, valor: v, fixo: true }));
  const r1 = aplicar(ctx.govOrcamento, qs) ?? ctx.govOrcamento ?? {};
  const s1 = { ...s, ctx: { ...ctx, govOrcamento: r1 } };
  const ids = [...CUSTOS_GOV.map(([id]) => id as string), ...(temSandbox(s1) ? ['sandbox'] : [])];
  const r2 = aplicar(r1, itens('governanca', ids, s1, 'itens.')) ?? r1;
  if (J(r2) !== J(s.ctx.govOrcamento)) out.push({ campo: 'govOrcamento', valor: r2 });
  return out;
}
