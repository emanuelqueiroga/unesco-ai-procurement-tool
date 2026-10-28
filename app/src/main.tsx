import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';
import { App } from './App';
import { applyTheme, initialTheme } from './ui/theme';
import { ligarPersistencia, useCaso } from './store';
import { usarIdioma, idiomaInicial } from './i18n';

// O tema entra antes da primeira pintura para não piscar.
applyTheme(initialTheme());
// O caso guardado (v14, v13 ou do app anterior) entra no store e passa a ser gravado a cada mudança.
ligarPersistencia();
// Idioma: o do caso guardado, senão o do navegador; os dicionários chegam sob demanda.
usarIdioma(idiomaInicial(useCaso.getState().lang)).then(l => { if (useCaso.getState().lang !== l) useCaso.getState().setLang(l); });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
