// Moldura das telas: cabeçalho (logos, atalhos, modo, plano, idioma, tema, caso), navegação de capítulos (lateral
// ≥ 900 px, barra abaixo), o conteúdo, o plano vivo (painel ≥ 1100 px, gaveta abaixo) e o rodapé institucional.
// Até 1360 px os atalhos do cabeçalho (Início, Matriz, Calculadora, Modo, Ver o plano, tema) descem para uma
// faixa própria sob o cabeçalho, para que "Início" e "Matriz" estejam visíveis em qualquer largura.
import { useEffect, useState, type ReactNode } from 'react';
import { useCaso, ESSENCIAL, telasDoCapitulo, telaRespondida, origemDe, progressoDe, type Capitulo, type CasoStore } from '../store';
import { Header, ChapterNav, ChapterBar, Segmented, Button, IconMoon, IconSun, useMediaQuery, useTheme, BREAKPOINTS, type NavChapter, type BarChapter } from '../ui';
import { CAPITULOS_INFO, CURTO, t } from '../percurso/textos';
import { href, lerRota } from '../percurso/rota';
import { PlanoVivo } from './PlanoVivo';
import { CasoDialog } from './CasoDialog';
import { SeletorIdioma, AvisoTraducao } from './Idioma';
import { MatrizHost, abrirMatriz } from './Matriz';
import { RodapeCompleto, DentroDaMoldura } from './Rodape';
import { LOGOS } from './logos';
import { useSalvamento } from './salvamento';
import { exportarCaso, comecarEmBranco } from './acoes';
import { exemploIlustrativo, nomeDoExemplo, tituloDaAba } from './transversal';
import './shell.css';
import './transversal.css';

export { LOGOS };
// O rodapé institucional é da moldura; quem ainda chama <Rodape/> (Inicio, Plano) não o duplica.
export { Rodape } from './Rodape';

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
  const faixa = useMediaQuery('(max-width: 1360px)');   // atalhos numa faixa própria sob o cabeçalho (não cabem junto do nome e do contexto)
  const [caso, setCaso] = useState(false);
  const [tema, , alternarTema] = useTheme();
  const salvamento = useSalvamento();
  const respondidas = ESSENCIAL.length - progressoDe(s).reduce((a, p) => a + (p.total - p.feitas), 0);
  const rota = lerRota(typeof window === 'undefined' ? '' : window.location.hash);

  // título da aba por tela (e no idioma da interface)
  useEffect(() => {
    const atualizar = () => { document.title = tituloDaAba(lerRota(window.location.hash)); };
    atualizar();
    window.addEventListener('hashchange', atualizar);
    return () => window.removeEventListener('hashchange', atualizar);
  }, [s.lang]);

  const comPlano = respondidas > 0 || s.exemplo !== 'novo';
  const atalhos = (
    <>
      <Button variant="secondary" size="sm" href={href.inicio()}>{t('Início')}</Button>
      <Button variant="secondary" size="sm" onClick={() => abrirMatriz()} aria-haspopup="dialog" aria-label={t('Matriz camadas × fases')}>{t('Matriz')}</Button>
      {s.modo === 'refinar' ? <Button variant="secondary" size="sm" href={href.refinar()}>{t('Calculadora')}</Button> : null}
    </>
  );
  const modo = (
    <Segmented
      label={t('Modo')}
      value={s.modo}
      onChange={(m) => s.setModo(m)}
      options={[{ value: 'essencial', label: t('Essencial') }, { value: 'refinar', label: t('Refinar') }]}
    />
  );
  const verPlano = comPlano ? <Button variant="secondary" size="sm" href={href.plano()}>{t('Ver o plano')}</Button> : null;
  const botaoTema = (
    <Button
      variant="secondary"
      size="sm"
      icon={tema === 'dark' ? <IconSun /> : <IconMoon />}
      aria-label={tema === 'dark' ? t('Tema claro') : t('Tema escuro')}
      onClick={alternarTema}
    />
  );
  const nomeExemplo = exemploIlustrativo(s) ? nomeDoExemplo(s.exemplo) : '';
  return (
    <DentroDaMoldura.Provider value>
      <div className="pc-app">
        <a className="pc-pular" href="#conteudo" onClick={(e) => { e.preventDefault(); document.getElementById('conteudo')?.focus(); }}>{t('Pular para o conteúdo')}</a>
        <Header
          logos={LOGOS}
          href={href.inicio()}
          compact={estreito}
          context={contexto}
          actions={
            faixa ? (
              <>
                <SeletorIdioma compacto={estreito} />
                <Button variant="secondary" size="sm" onClick={() => setCaso(true)} aria-haspopup="dialog">{t('Caso')}</Button>
              </>
            ) : (
              <>
                {atalhos}
                {modo}
                <SeletorIdioma />
                {verPlano}
                {botaoTema}
                <Button variant="secondary" size="sm" onClick={() => setCaso(true)} aria-haspopup="dialog">{t('Caso')}</Button>
              </>
            )
          }
        />
        {faixa ? (
          <nav className="pc-atalhos" aria-label={t('Atalhos')}>
            {atalhos}
            {!estreito ? modo : null}
            {verPlano}
            {botaoTema}
          </nav>
        ) : null}
        {salvamento.falhou && !salvamento.dispensado ? (
          <section className="pc-faixa pc-faixa--atencao" role="status" aria-label={t('Aviso')}>
            <span>{t('Suas respostas não estão sendo salvas neste navegador; exporte o caso para guardá-las.')}</span>
            <Button size="sm" variant="secondary" onClick={() => { void exportarCaso(); }}>{t('Exportar o caso')}</Button>
            <Button size="sm" variant="link" onClick={() => useSalvamento.setState({ dispensado: true })}>{t('Dispensar')}</Button>
          </section>
        ) : null}
        {nomeExemplo && rota.tipo !== 'inicio' ? (
          <section className="pc-faixa pc-faixa--exemplo" aria-label={t('Caso ilustrativo')}>
            <span>{t('Você está vendo um caso ilustrativo: {nome}. Ao mudar uma resposta, ele passa a ser o seu caso.', { nome: nomeExemplo })}</span>
            <Button size="sm" variant="secondary" onClick={() => { void comecarEmBranco(); }}>{t('Começar em branco')}</Button>
          </section>
        ) : null}
        <AvisoTraducao />
        {nav && barra ? <div className="pc-barra"><ChapterBar chapters={capitulosBarra(s, pos)} compact={estreito} /></div> : null}
        <div className={['pc-corpo', nav && !barra ? 'pc-corpo--nav' : '', plano ? 'pc-corpo--plano' : ''].filter(Boolean).join(' ')}>
          {nav && !barra ? <aside className="pc-nav"><ChapterNav zoneLabel={t('Seu caminho')} chapters={capitulosNav(s, pos)} /></aside> : null}
          <main id="conteudo" className="pc-main" tabIndex={-1}>
            {rota.tipo === 'plano' ? <p className="pc-so-impressao">{t('Para imprimir o plano completo, use "Baixar o plano em PDF".')}</p> : null}
            {children}
          </main>
          {plano ? <PlanoVivo s={s} /> : null}
        </div>
        <RodapeCompleto />
        <CasoDialog open={caso} onClose={() => setCaso(false)} />
        <MatrizHost />
      </div>
    </DentroDaMoldura.Provider>
  );
}
