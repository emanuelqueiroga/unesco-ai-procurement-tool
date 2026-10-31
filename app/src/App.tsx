import { Letramento } from './screens/Letramento';
import { Governanca } from './screens/Governanca';
import { percursoGovernanca, percursoLetramento, prioridadeEscolhida } from './domain';
import { useEffect } from 'react';
import { Galeria } from './screens/Galeria';
import { Inicio } from './screens/Inicio';
import { Abertura, Pergunta, Sintese } from './screens/Percurso';
import { Plano } from './screens/Plano';
import { href, ir, useRota } from './percurso/rota';
import { useCaso } from './store';
import { FaixaRevisao } from './screens/FaixaRevisao';
import { ConfirmacaoHost, AvisosHost } from './screens/Confirmar';
import { Refinar } from './screens/Refinar';
import './screens/shell.css';

export function App() {
  const rota = useRota();
  const ctx = useCaso(s => s.ctx);
  // a posição no percurso fica no caso (capitulo.atual/pergunta), para "continuar de onde parei"
  const irPara = useCaso((s) => s.irPara);
  const chave = rota.tipo === 'pergunta' ? `${rota.n}/${rota.tela}` : '';
  useEffect(() => {
    if (rota.tipo !== 'pergunta') return;
    const c = useCaso.getState().capitulo;
    if (c.atual !== rota.n || c.pergunta !== rota.tela) irPara(rota.n, rota.tela);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);
  const aguardaPrioridade = !prioridadeEscolhida(ctx) && !(rota.tipo === 'inicio' || rota.tipo === 'galeria' || (rota.tipo === 'abertura' && rota.n === 1) || (rota.tipo === 'pergunta' && rota.n === 1 && ['local','prioridades'].includes(rota.tela)));
  useEffect(() => { if (aguardaPrioridade) ir(href.pergunta(1, 'prioridades')); }, [aguardaPrioridade]);
  const tela = (() => {
    if (aguardaPrioridade) return <Pergunta n={1} tela="prioridades" />;
    if (percursoLetramento(ctx) && !['inicio','galeria'].includes(rota.tipo)) return <Letramento key={rota.tipo === 'pergunta' ? rota.tela : rota.tipo} rota={rota} />;
    if (percursoGovernanca(ctx) && !['inicio', 'galeria'].includes(rota.tipo)) return <Governanca key={rota.tipo === 'pergunta' ? rota.tela : rota.tipo === 'abertura' || rota.tipo === 'sintese' ? `${rota.tipo}${rota.n}` : rota.tipo} rota={rota} />;
    switch (rota.tipo) {
      case 'galeria': return <Galeria />;
      case 'abertura': return <Abertura key={`a${rota.n}`} n={rota.n} />;
      case 'pergunta': return <Pergunta key={`p${rota.tela}`} n={rota.n} tela={rota.tela} />;
      case 'sintese': return <Sintese key={`s${rota.n}`} n={rota.n} foco={rota.foco} />;
      case 'plano': return <Plano pagina={rota.pagina} />;
      case 'refinar': return <Refinar aba={rota.aba} foco={rota.foco} />;
      default: return <Inicio />;
    }
  })();
  return <><FaixaRevisao />{tela}<ConfirmacaoHost /><AvisosHost /></>;
}
