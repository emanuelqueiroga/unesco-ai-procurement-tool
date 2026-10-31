// v015: governança isolada cobre a rede inteira, sem selecionar etapas de ensino.
export function somenteGovernanca(ctx) {
  const p = (ctx || {}).prioridades;
  return Array.isArray(p) && p.length > 0 && p.every(id => id === 'governar');
}
export function tamanhoRedeValido(ctx) {
  const r = (ctx || {}).redeNacional || {};
  return ['escolas', 'estudantes'].every(k => Number.isSafeInteger(r[k]) && r[k] > 0);
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
