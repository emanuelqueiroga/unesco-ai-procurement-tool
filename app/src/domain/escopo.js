// v015: governança isolada cobre a rede inteira, sem selecionar etapas de ensino.
export function somenteGovernanca(ctx) {
  const p = (ctx || {}).prioridades;
  return Array.isArray(p) && p.length > 0 && p.every(id => id === 'governar');
}
export function tamanhoRedeValido(ctx) {
  const r = (ctx || {}).redeNacional || {};
  return ['escolas', 'estudantes'].every(k => Number.isSafeInteger(r[k]) && r[k] > 0);
}
