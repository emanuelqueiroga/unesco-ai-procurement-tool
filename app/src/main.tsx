import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';
import { App } from './App';
import { applyTheme, initialTheme, acompanharTemaDoSistema } from './ui/theme';
import { ligarPersistencia, salvar, useCaso } from './store';
import { usarIdioma, idiomaInicial } from './i18n';
import { CHAVE_CASO } from './percurso/canal';
import { setTradutorUI } from './ui';
import { tr } from './domain';
import { vigiarSalvamento } from './screens/salvamento';
import { iniciarCapacidades } from './screens/acoes';
import './styles/idiomas.css';

// Os textos fixos dos componentes passam pelo mesmo tradutor do domínio.
setTradutorUI((s) => String(tr(s)));
// O tema entra antes da primeira pintura para não piscar; sem escolha guardada, acompanha o do sistema.
applyTheme(initialTheme());
acompanharTemaDoSistema();
// O caso guardado (v14, v13 ou do app anterior) entra no store e passa a ser gravado a cada mudança.
ligarPersistencia(undefined, undefined, CHAVE_CASO);
// Um caso vindo da v13 ou do app anterior é gravado na chave v14 já na abertura (e não só na primeira alteração).
if (useCaso.getState().migradoDe === 'v13' || useCaso.getState().migradoDe === 'v8') salvar(useCaso.getState().estado(), undefined, CHAVE_CASO);
// Se o navegador não guarda (armazenamento bloqueado ou cheio), a moldura avisa uma vez.
vigiarSalvamento(CHAVE_CASO);
// Ambiente de artefato: capacidade de baixar arquivos (fora dele, <a download>).
void iniciarCapacidades();

// A página de componentes (#/galeria) é só de desenvolvimento: não tem link e, se alguém a abrir, sai da indexação.
const marcarGaleria = () => {
  const gal = /^#\/galeria/.test(window.location.hash);
  const atual = document.querySelector('meta[name="robots"][data-galeria]');
  if (gal && !atual) { const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex, nofollow'; m.setAttribute('data-galeria', ''); document.head.appendChild(m); }
  else if (!gal && atual) atual.remove();
};
marcarGaleria();
window.addEventListener('hashchange', marcarGaleria);

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
