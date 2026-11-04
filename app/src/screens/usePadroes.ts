// Versão de teste: aplica os valores pré-preenchidos da frente enquanto a pessoa está numa tela dela.
// Roda a cada mudança; escritasPadroes devolve vazio quando nada muda, então não há laço.
import { useEffect } from 'react';
import { useCaso } from '../store';
import { escritasPadroes } from '../percurso/padroesTeste';
import type { FrenteEstimativa } from '../percurso/estimativasOrcamento';

export function usePadroes(frente: FrenteEstimativa, ativo: boolean) {
  const s = useCaso();
  useEffect(() => {
    if (!ativo) return;
    const w = escritasPadroes(useCaso.getState(), frente);
    if (w.length) useCaso.getState().preencher(w);
  }, [s, frente, ativo]);
}
