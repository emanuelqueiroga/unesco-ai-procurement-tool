import { useEffect } from 'react';
import { Galeria } from './screens/Galeria';
import { Inicio } from './screens/Inicio';
import { Abertura, Pergunta, Sintese } from './screens/Percurso';
import { Plano } from './screens/Plano';
import { useRota } from './percurso/rota';
import { useCaso } from './store';

export function App() {
  const rota = useRota();
  // a posição no percurso fica no caso (capitulo.atual/pergunta), para "continuar de onde parei"
  const irPara = useCaso((s) => s.irPara);
  const chave = rota.tipo === 'pergunta' ? `${rota.n}/${rota.tela}` : '';
  useEffect(() => {
    if (rota.tipo !== 'pergunta') return;
    const c = useCaso.getState().capitulo;
    if (c.atual !== rota.n || c.pergunta !== rota.tela) irPara(rota.n, rota.tela);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);
  switch (rota.tipo) {
    case 'galeria': return <Galeria />;
    case 'abertura': return <Abertura key={`a${rota.n}`} n={rota.n} />;
    case 'pergunta': return <Pergunta key={`p${rota.tela}`} n={rota.n} tela={rota.tela} />;
    case 'sintese': return <Sintese key={`s${rota.n}`} n={rota.n} />;
    case 'plano': return <Plano pagina={rota.pagina} />;
    default: return <Inicio />;
  }
}
