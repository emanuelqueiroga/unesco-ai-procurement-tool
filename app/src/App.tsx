import { useEffect } from 'react';
import { Galeria } from './screens/Galeria';
import { Inicio } from './screens/Inicio';
import { Abertura, Pergunta, Sintese } from './screens/Percurso';
import { Prioridades } from './screens/Prioridades';
import { Governanca } from './screens/Governanca';
import { EducacaoV20 } from './screens/EducacaoV20';
import { Salarios } from './screens/Salarios';
import { Esforcos } from './screens/Esforcos';
import { MetodologiaEducacao } from './screens/MetodologiaEducacao';
import { Metodologia } from './screens/Metodologia';
import { RecebidoHost } from './screens/CompartilharV16';
import { percursoGovernanca, percursoEducacaoV20, percursoCombinado, percursoLetramentoV23, temEducacao, telaDaEducacao } from './domain';
import { PlanoCombinado } from './screens/PlanoCombinado';
import { telasAtivas as telasDoPercurso } from './store';
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
  // v022.1: no percurso combinado as telas mudam de capítulo; um link com o capítulo antigo vai para o certo
  useEffect(() => {
    // v022.1: também na governança, onde as páginas de opções passaram do capítulo 3 para o 2 (navegação em profundidade)
    if (rota.tipo !== 'pergunta' || !(percursoCombinado(ctx) || percursoGovernanca(ctx) || percursoLetramentoV23(ctx))) return;
    const q = telasDoPercurso(useCaso.getState()).find(x => x.id === rota.tela);
    if (q && q.capitulo !== rota.n) window.location.replace(`#/capitulo/${q.capitulo}/${q.id}`);
  }, [chave, ctx]); // eslint-disable-line react-hooks/exhaustive-deps
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
    if (rota.tipo === 'metodologia') return rota.parte === 'educacao' ? <MetodologiaEducacao foco={rota.foco} /> : <Metodologia />;
    // v022.1: governança e educação juntas: primeiro as telas da governança, depois as da educação, e um plano só
    if (percursoCombinado(ctx) && !telaPrioridades && !['inicio', 'galeria'].includes(rota.tipo)) {
      if (rota.tipo === 'plano') return <PlanoCombinado />;
      const daEd = rota.tipo === 'pergunta' ? telaDaEducacao(rota.tela) : (rota.tipo === 'abertura' || rota.tipo === 'sintese') ? rota.n >= 3 && temEducacao(ctx) : false;
      return daEd ? <EducacaoV20 key={rota.tipo === 'pergunta' ? rota.tela : rota.tipo + (rota.tipo === 'abertura' || rota.tipo === 'sintese' ? rota.n : '')} rota={rota} />
        : <Governanca key={rota.tipo === 'pergunta' ? rota.tela : rota.tipo === 'abertura' || rota.tipo === 'sintese' ? `${rota.tipo}${rota.n}` : rota.tipo} rota={rota} />;
    }
    // v022.1: Educando sobre a IA sozinha segue o fluxo da governança (mesma tela)
    if ((percursoGovernanca(ctx) || percursoLetramentoV23(ctx)) && !telaPrioridades && !['inicio', 'galeria'].includes(rota.tipo))
      return <Governanca key={rota.tipo === 'pergunta' ? rota.tela : rota.tipo === 'abertura' || rota.tipo === 'sintese' ? `${rota.tipo}${rota.n}` : rota.tipo} rota={rota} />;
    // v020: Educating with and without AI como única prioridade segue o percurso da figura
    if (percursoEducacaoV20(ctx) && !telaPrioridades && !['inicio', 'galeria'].includes(rota.tipo))
      return <EducacaoV20 key={rota.tipo === 'pergunta' ? rota.tela : rota.tipo} rota={rota} />;
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
