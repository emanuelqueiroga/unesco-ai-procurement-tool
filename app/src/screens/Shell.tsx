// Moldura das telas: cabeçalho (logos, modo, plano, caso), navegação de capítulos (lateral ≥ 900 px, barra abaixo),
// o conteúdo e o plano vivo (painel ≥ 1100 px, gaveta abaixo).
import { useState, type ReactNode } from 'react';
import { useCaso, ESSENCIAL, telasDoCapitulo, telaRespondida, origemDe, progressoDe, type Capitulo, type CasoStore } from '../store';
import { Header, ChapterNav, ChapterBar, Segmented, Button, useMediaQuery, BREAKPOINTS, type NavChapter, type BarChapter } from '../ui';
import logoCatedra from '../assets/logos/catedra-unesco-unitwin.png';
import logoIaedu from '../assets/logos/iaedu.png';
import { CAPITULOS_INFO, CURTO, t } from '../percurso/textos';
import { href } from '../percurso/rota';
import { PlanoVivo } from './PlanoVivo';
import { CasoDialog } from './CasoDialog';
import './shell.css';

export const LOGOS = [
  { src: logoCatedra, alt: 'Cátedra UNESCO UNITWIN de Inteligência Artificial Desplugada na Educação' },
  { src: logoIaedu, alt: 'IA.EDU' },
];

export interface Posicao { capitulo?: Capitulo; tela?: string; sintese?: boolean }

function capitulosNav(s: CasoStore, pos: Posicao): NavChapter[] {
  const prog = progressoDe(s);
  return ([1, 2, 3, 4] as Capitulo[]).map((n) => {
    const atual = pos.capitulo === n;
    const p = prog[n - 1];
    return {
      n, title: t(CAPITULOS_INFO[n].titulo), href: href.abertura(n),
      state: atual ? 'current' : p.completo ? 'done' : 'todo',
      questions: atual
        ? telasDoCapitulo(n).map((tela) => ({
          id: tela.id, title: t(CURTO[tela.id] || tela.id), href: href.pergunta(n, tela.id),
          state: tela.id === pos.tela ? 'current' : telaRespondida(s, tela) ? 'done' : tela.campos.some((c) => origemDe(s, c) === 'sugerido') ? 'suggested' : 'todo',
        }))
        : undefined,
    } as NavChapter;
  });
}

function capitulosBarra(s: CasoStore, pos: Posicao): BarChapter[] {
  return progressoDe(s).map((p) => ({
    n: p.capitulo, label: t(CAPITULOS_INFO[p.capitulo].titulo), progress: p.total ? p.feitas / p.total : 0, href: href.abertura(p.capitulo),
    state: pos.capitulo === p.capitulo ? 'current' : p.completo ? 'done' : 'todo',
  }));
}

export function Shell({ children, pos = {}, nav = true, plano = true, contexto }: { children: ReactNode; pos?: Posicao; nav?: boolean; plano?: boolean; contexto?: ReactNode }) {
  const s = useCaso();
  const barra = useMediaQuery(BREAKPOINTS.bar);
  const estreito = useMediaQuery(BREAKPOINTS.cards);
  const [caso, setCaso] = useState(false);
  const respondidas = ESSENCIAL.length - progressoDe(s).reduce((a, p) => a + (p.total - p.feitas), 0);
  return (
    <div className="pc-app">
      <a className="pc-pular" href="#conteudo" onClick={(e) => { e.preventDefault(); document.getElementById('conteudo')?.focus(); }}>{t('Pular para o conteúdo')}</a>
      <Header
        logos={LOGOS}
        href={href.inicio()}
        compact={estreito}
        context={contexto}
        actions={
          <>
            {!estreito ? (
              <Segmented
                label={t('Modo')}
                value={s.modo}
                onChange={(m) => s.setModo(m)}
                options={[{ value: 'essencial', label: t('Essencial') }, { value: 'refinar', label: t('Refinar') }]}
              />
            ) : null}
            {respondidas > 0 || s.exemplo !== 'novo' ? <Button variant="secondary" size="sm" href={href.plano()}>{t('Ver o plano')}</Button> : null}
            <Button variant="secondary" size="sm" onClick={() => setCaso(true)} aria-haspopup="dialog">{t('Caso')}</Button>
          </>
        }
      />
      {nav && barra ? <div className="pc-barra"><ChapterBar chapters={capitulosBarra(s, pos)} compact={estreito} /></div> : null}
      <div className={['pc-corpo', nav && !barra ? 'pc-corpo--nav' : '', plano ? 'pc-corpo--plano' : ''].filter(Boolean).join(' ')}>
        {nav && !barra ? <aside className="pc-nav"><ChapterNav zoneLabel={t('Seu caminho')} chapters={capitulosNav(s, pos)} /></aside> : null}
        <main id="conteudo" className="pc-main" tabIndex={-1}>{children}</main>
        {plano ? <PlanoVivo s={s} /> : null}
      </div>
      <CasoDialog open={caso} onClose={() => setCaso(false)} />
    </div>
  );
}

export function Rodape() {
  return (
    <p className="pc-rodape">
      {t('Vinculado à Cátedra UNESCO UNITWIN de Inteligência Artificial Desplugada na Educação e ao IA.EDU. Valores ilustrativos; a ferramenta não fala em nome da UNESCO ou de outra instituição.')}
    </p>
  );
}
