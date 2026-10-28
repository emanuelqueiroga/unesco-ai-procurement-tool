import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';
import { App } from './App';
import { applyTheme, initialTheme } from './ui/theme';
import { ligarPersistencia, useCaso } from './store';
import { usarIdioma, idiomaInicial } from './i18n';
import { CHAVE_CASO } from './percurso/canal';
import { setTradutorUI } from './ui';
import { tr } from './domain';
import './styles/idiomas.css';

// Os textos fixos dos componentes passam pelo mesmo tradutor do domínio.
setTradutorUI((s) => String(tr(s)));
// O tema entra antes da primeira pintura para não piscar.
applyTheme(initialTheme());
// O caso guardado (v14, v13 ou do app anterior) entra no store e passa a ser gravado a cada mudança.
ligarPersistencia(undefined, undefined, CHAVE_CASO);
// Idioma: o do caso guardado, senão inglês (como na v13). A primeira pintura espera o dicionário (um arquivo
// local, carregado sob demanda), para a tela não aparecer em português e trocar de idioma em seguida.
const desenhar = () => createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
usarIdioma(idiomaInicial(useCaso.getState().lang))
  .then((l) => { if (useCaso.getState().lang !== l) useCaso.getState().setLang(l); })
  .catch((e) => console.error('idioma', e))
  .finally(desenhar);
