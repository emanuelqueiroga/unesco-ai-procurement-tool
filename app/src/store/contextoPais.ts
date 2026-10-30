// v015: o escopo ativo é sempre o país; dados legados são conservados sem inferir país pelo nome da instituição.
import type { Estado14 } from './tipos';
import { paisPorIso, OUTRO_PAIS } from '../domain/pais.js';

export function normalizarContextoPais(e: Estado14): Estado14 {
  const x = e.ctx;
  if ((x.nivel && x.nivel !== 'pais') || x.nivelOutro) {
    x.escopoLegado = x.escopoLegado || { nivel: x.nivel, nivelOutro: x.nivelOutro || '', origem: e.origem.nivel, confirmado: !!e.respC.nivel };
  }
  x.nivel = 'pais';
  delete x.nivelOutro;
  e.origem.nivel = 'padrao';
  delete e.respC.nivel;
  delete e.origem.nivelOutro;
  delete e.respC.nivelOutro;
  e.revisar = e.revisar.filter(k => !['nivel', 'nivelOutro'].includes(k));
  if (e.capitulo.pergunta === 'nivel') e.capitulo = { atual: 1, pergunta: 'local' };
  const pais = String(e.caso.pais || '');
  if (pais && (pais === OUTRO_PAIS || paisPorIso(pais))) {
    e.origem.pais = e.origem.pais === 'refinado' ? 'refinado' : 'informado';
    e.respC.pais = true;
  } else if (pais) {
    e.caso.paisLegado = pais;
    e.caso.pais = '';
    delete e.origem.pais;
    delete e.respC.pais;
  }
  return e;
}
