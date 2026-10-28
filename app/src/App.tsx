import { useEffect, useState } from 'react';
import pkg from '../package.json';
import { Galeria } from './screens/Galeria';
import { Button, useTheme } from './ui';
import { useCaso, faltamDe, ESSENCIAL } from './store';

function useHashRoute(): string {
  const read = () => (typeof window === 'undefined' ? '' : window.location.hash.replace(/^#/, ''));
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

function Inicio() {
  const [theme, , toggleTheme] = useTheme();
  const caso = useCaso();   // o objeto do store é estável entre mudanças; um seletor que criasse objetos novos faria o React repintar sem parar
  const respondidas = ESSENCIAL.length - faltamDe(caso).length;
  const migradoDe = caso.migradoDe;
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        padding: 'var(--space-8) var(--space-4)',
        maxWidth: 640,
        margin: '0 auto',
      }}
    >
      <div className="t-label-12" style={{ color: 'var(--muted)' }}>
        Versão {pkg.version} · reimplementação em andamento
      </div>
      <h1 className="t-title-32">AI in Education Procurement Tool</h1>
      <p className="t-body-16" style={{ color: 'var(--ink-2)' }}>
        Do contexto ao plano de contratação de IA, com custo do ciclo de vida. Esta página inicial é provisória: as
        telas do percurso chegam nas próximas etapas.
      </p>
      <p className="t-caption-13" style={{ color: 'var(--muted)' }}>
        Caso neste navegador: {respondidas} de {ESSENCIAL.length} perguntas essenciais respondidas
        {migradoDe === 'v13' ? ' (trazido da versão anterior)' : migradoDe === 'v8' ? ' (trazido do Navegador de IA na Educação)' : ''}.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <Button href="#/galeria">Abrir a galeria de componentes</Button>
        <Button variant="secondary" onClick={toggleTheme}>
          {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        </Button>
      </div>
      <p className="t-caption-13" style={{ color: 'var(--muted)', marginTop: 'auto' }}>
        Valores ilustrativos. A ferramenta não fala em nome da UNESCO ou de outra instituição.
      </p>
    </main>
  );
}

export function App() {
  const route = useHashRoute();
  if (route.startsWith('/galeria')) return <Galeria />;
  return <Inicio />;
}
