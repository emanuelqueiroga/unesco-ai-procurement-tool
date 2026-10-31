// v015: governança isolada cobre a rede inteira, sem selecionar etapas de ensino.
export function somenteGovernanca(ctx) {
  const p = (ctx || {}).prioridades;
  return Array.isArray(p) && p.length > 0 && p.every(id => id === 'governar');
}
export function tamanhoRedeValido(ctx) {
  const r = (ctx || {}).redeNacional || {};
  return ['escolas', 'estudantes'].every(k => Number.isSafeInteger(r[k]) && r[k] > 0)
    || FAIXAS_ESCOLAS.some(([id]) => id === r.faixaEscolas) && FAIXAS_ESTUDANTES.some(([id]) => id === r.faixaEstudantes);
}

/** Uma prioridade combinada não implica contratar ou testar uma ferramenta. */
export function temGovernanca(ctx) { return Array.isArray(ctx?.prioridades) && ctx.prioridades.includes('governar'); }
export function projetoUsoDefinido(ctx) {
  const p = ctx?.projetoIA;
  return temGovernanca(ctx) && ctx.prioridades.some(id => id !== 'governar')
    && p?.incluir === 'sim' && typeof p.descricao === 'string' && p.descricao.trim().length > 0 && !p.descricao.includes('__');
}
export function percursoGovernanca(ctx) {
  return temGovernanca(ctx) && !(projetoUsoDefinido(ctx) && ctx.frenteAtiva === 'projeto');
}
/** Vista do projeto: desafios institucionais e seu orçamento não alimentam o relatório de ferramenta. */
export function estadoDoProjeto(estado) {
  if (!projetoUsoDefinido(estado?.ctx) || estado.ctx.frenteAtiva !== 'projeto') return estado;
  const x = estado.ctx, c = estado.caso || {};
  const informado = k => ['informado', 'refinado'].includes(estado.origem?.[k]) || estado.respC?.[k];
  return { ...estado,
    ctx: { ...x, prioridades: x.prioridades.filter(id => id !== 'governar'), problemas: (x.problemas || []).filter(id => !/^G\d+$/.test(id)),
      olhando: informado('olhando') ? x.olhando : x.projetoIA.descricao, problemaOutro: '' },
    caso: { ...c, titulo: informado('titulo') ? c.titulo : x.projetoIA.descricao },
  };
}

export function prioridadeEscolhida(ctx) { return Array.isArray(ctx?.prioridades) && ctx.prioridades.length > 0; }

export const FAIXAS_ESCOLAS = [['ate1000','Até 1.000 escolas'],['1001a10000','De 1.001 a 10.000 escolas'],['10001a50000','De 10.001 a 50.000 escolas'],['mais50000','Mais de 50.000 escolas'],['a_levantar','Total de escolas ainda a levantar']];
export const FAIXAS_ESTUDANTES = [['ate100000','Até 100.000 estudantes'],['100001a1000000','De 100.001 a 1.000.000 de estudantes'],['1000001a10000000','De 1.000.001 a 10.000.000 de estudantes'],['mais10000000','Mais de 10.000.000 de estudantes'],['a_levantar','Total de estudantes ainda a levantar']];
