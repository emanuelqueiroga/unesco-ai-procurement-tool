// =====================================================================
// Base de referências (0.0.15-rc.1, BL4.1): leitura das linhas de data/referencias.json e de data/paises.json.
// Camada de baixo, sem dependência de outro módulo do domínio: custos.js e casos.js leem os valores-padrão daqui
// (refValor), pais.js monta a cadeia de escopos e o perfil do país, e referencias.js (contrato com o relatório)
// lista as premissas do caso. Cada linha tem escopo 'global', um código de região (paises.json) ou um ISO3.
// refValor(id, escopos) percorre a lista de escopos na ordem (país, região, global) e devolve o primeiro valor
// encontrado: é a cadeia de recuo do BL1.3. Sem escopos, vale só o global, e os números são os da v13.
// Um id que falta é erro, para que nenhum valor-padrão volte a ficar escrito no código.
// =====================================================================
import REFERENCIAS from '../../../data/referencias.json';
import PAISES from '../../../data/paises.json';

/** conteúdo de data/referencias.json ({ versao, atualizado, nota, referencias: [linha] }) */
const REF_DADOS = REFERENCIAS;
/** conteúdo de data/paises.json ({ versao, atualizado, nota, regioes, paises }) */
const PAISES_DADOS = PAISES;

/** linha da base para um id, pela cadeia de escopos (['BRA', 'LAC', 'global']); sem escopos, a global; null se não há */
function refLinha(id, esc) {
  const L = (REF_DADOS.referencias || []).filter(r => r.id === id);
  const ordem = Array.isArray(esc) && esc.length ? esc.concat(esc.includes('global') ? [] : ['global']) : ['global'];
  for (const e of ordem) { const r = L.find(x => x.escopo === e); if (r) return r; }
  return null;
}
/** valor central da linha; lança erro quando o id não existe na base */
function refValor(id, esc) {
  const r = refLinha(id, esc);
  if (!r) throw new Error('base de referências: falta a linha "' + id + '"');
  return r.valor;
}
/** faixa do tornado como multiplicadores do valor provável, a partir de baixo e alto da linha (1 quando o valor é zero) */
function refFaixaMult(id, esc) {
  const r = refLinha(id, esc);
  if (!r) throw new Error('base de referências: falta a linha "' + id + '"');
  return r.valor ? { min: +(r.baixo / r.valor).toFixed(12), max: +(r.alto / r.valor).toFixed(12) } : { min: 1, max: 1 };
}
/** a linha tem faixa de referência (baixo < alto)? Sem faixa conhecida, nada é sinalizado como fora dela */
function temFaixa(row) { return !!row && +row.alto > +row.baixo; }
/** o valor sai da faixa da linha? (só quando a linha tem faixa; os limites não contam como fora) */
function foraDaFaixaLinha(row, v) { return temFaixa(row) && v !== '' && v != null && Number.isFinite(+v) && (+v < row.baixo - 1e-12 || +v > row.alto + 1e-12); }
/** de onde vem a linha: 'ilustrativo' (global), 'regiao' (código de região de paises.json) ou 'pais' (ISO3) */
function origemDaLinha(row) {
  if (!row || row.escopo === 'global') return 'ilustrativo';
  return (PAISES_DADOS.regioes || []).some(r => r.codigo === row.escopo) ? 'regiao' : 'pais';
}

export { REF_DADOS, PAISES_DADOS, refLinha, refValor, refFaixaMult, temFaixa, foraDaFaixaLinha, origemDaLinha };
