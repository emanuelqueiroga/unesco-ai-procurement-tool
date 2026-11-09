import { useEffect } from 'react';
import { Galeria } from './screens/Galeria';
import { Inicio } from './screens/Inicio';
import { Abertura, Pergunta, Sintese } from './screens/Percurso';
import { Prioridades } from './screens/Prioridades';
import { Governanca } from './screens/Governanca';
import { Salarios } from './screens/Salarios';
import { Esforcos } from './screens/Esforcos';
import { Metodologia } from './screens/Metodologia';
import { RecebidoHost } from './screens/CompartilharV16';
import { percursoGovernanca } from './domain';
import { Plano } from './screens/Plano';
import { useRota } from './percurso/rota';
import { useCaso } from './store';
import { FaixaRevisao } from './screens/FaixaRevisao';
import { ConfirmacaoHost, AvisosHost } from './screens/Confirmar';
import { Refinar } from './screens/Refinar';
import './screens/shell.css';

export function App() {
  const rota = useRota();
  // a posição no percurso fica no caso (capitulo.atual/pergunta), para "continuar de onde parei"
  const irPara = useCaso((s) => s.irPara);
  const ctx = useCaso((s) => s.ctx);
  const chave = rota.tipo === 'pergunta' ? `${rota.n}/${rota.tela}` : '';
  useEffect(() => {
    if (rota.tipo !== 'pergunta') return;
    const c = useCaso.getState().capitulo;
    if (c.atual !== rota.n || c.pergunta !== rota.tela) irPara(rota.n, rota.tela);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);
  const tela = (() => {
    // v018: com a governança como única prioridade, o fluxo é o da v017 (Contexto → Categorias → Opções → resumo)
    // o lugar e as prioridades continuam as telas da v018 (iguais às da v017)
    const telaPrioridades = rota.tipo === 'pergunta' && rota.n === 1 && ['local', 'prioridades'].includes(rota.tela);
    if (rota.tipo === 'salarios') return <Salarios pais={rota.pais} />;
    if (rota.tipo === 'esforcos') return <Esforcos chave={rota.chave} />;
    if (rota.tipo === 'metodologia') return <Metodologia />;
    if (percursoGovernanca(ctx) && !telaPrioridades && !['inicio', 'galeria'].includes(rota.tipo))
      return <Governanca key={rota.tipo === 'pergunta' ? rota.tela : rota.tipo === 'abertura' || rota.tipo === 'sintese' ? `${rota.tipo}${rota.n}` : rota.tipo} rota={rota} />;
    switch (rota.tipo) {
      case 'galeria': return <Galeria />;
      // v018: sem abertura do capítulo 1; o início leva direto à primeira pergunta, como na v017
      case 'abertura': return rota.n === 1 ? <Pergunta key="p1local" n={1} tela="local" /> : <Abertura key={`a${rota.n}`} n={rota.n} />;
      case 'pergunta': return rota.n === 1 && rota.tela === 'prioridades' ? <Prioridades /> : <Pergunta key={`p${rota.tela}`} n={rota.n} tela={rota.tela} />;
      case 'sintese': return <Sintese key={`s${rota.n}`} n={rota.n} foco={rota.foco} />;
      case 'plano': return <Plano pagina={rota.pagina} />;
      case 'refinar': return <Refinar aba={rota.aba} foco={rota.foco} />;
      default: return <Inicio />;
    }
  })();
  return <><FaixaRevisao /><RecebidoHost />{tela}<ConfirmacaoHost /><AvisosHost /></>;
}
