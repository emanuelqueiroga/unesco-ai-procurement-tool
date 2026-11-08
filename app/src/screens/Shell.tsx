// Moldura das telas (v018: a 0.0.14 com o visual atual). Cabeçalho com os atalhos e as quatro etapas em linha (sem a
// coluna lateral "Seu caminho"), a coluna da pergunta e, à direita, o cartão de custo do projeto (≥ 1024 px; abaixo,
// uma faixa noite sob o cabeçalho que leva ao plano) e o rodapé institucional. No celular (≤ 900 px) o cabeçalho fica
// compacto: a marca, o menu e a barra de etapas. A página inicial usa o cabeçalho simples.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useCaso, ESSENCIAL, telasDoCapitulo, progressoDe, type Capitulo, type CasoStore } from '../store';
import { AcoesForaDoQuadro, Header, StepBar, Segmented, Button, IconMoon, IconSun, IconMenu, IconClose, useMediaQuery, useTheme, BREAKPOINTS, type Step } from '../ui';
import { CAPITULOS_INFO, t } from '../percurso/textos';
import { href, lerRota } from '../percurso/rota';
import { nomePais, paisDoCaso, tr } from '../domain';
import { ColunaCusto, FaixaCusto } from './CartaoCusto';
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
import './ux.css';
import './moldura.css';

export { LOGOS };
// O rodapé institucional é da moldura; quem ainda chama <Rodape/> (Inicio, Plano) não o duplica.
export { Rodape } from './Rodape';

export interface Posicao { capitulo?: Capitulo; tela?: string; sintese?: boolean }

/** Os quatro capítulos em linha: ✓ nos concluídos, "nome · n de m" e o segmento preenchido até a pergunta atual. */
export function etapas(s: CasoStore, pos: Posicao): Step[] {
  return progressoDe(s).map((p) => {
    const n = p.capitulo as Capitulo, label = t(CAPITULOS_INFO[n].titulo), atual = pos.capitulo === n;
    const state = atual ? 'current' : p.completo ? 'done' : 'todo';
    const progress = p.total ? p.feitas / p.total : 0;
    if (!atual || !pos.tela) return { n, label, href: href.abertura(n), state, progress };
    const qs = telasDoCapitulo(n), i = qs.findIndex((q) => q.id === pos.tela);
    return { n, label, href: href.abertura(n), state, progress: i < 0 ? progress : (i + 1) / qs.length, position: i < 0 || qs.length < 2 ? undefined : t('{n} de {total}', { n: i + 1, total: qs.length }) };
  });
}

export function Shell({ children, pos = {}, nav = true, plano = true, contexto }: { children: ReactNode; pos?: Posicao; nav?: boolean; plano?: boolean; contexto?: ReactNode }) {
  const s = useCaso();
  const estreito = useMediaQuery(BREAKPOINTS.cards);
  const celular = useMediaQuery(BREAKPOINTS.bar);           // cabeçalho compacto com menu
  const semColuna = useMediaQuery('(max-width: 1023px)');   // custo numa faixa sob o cabeçalho (uma coluna só)
  const [caso, setCaso] = useState(false);
  const [menu, setMenu] = useState(false);
  const botaoMenu = useRef<HTMLButtonElement>(null);
  const [tema, , alternarTema] = useTheme();
  const salvamento = useSalvamento();
  const respondidas = ESSENCIAL.length - progressoDe(s).reduce((a, p) => a + (p.total - p.feitas), 0);
  const rota = lerRota(typeof window === 'undefined' ? '' : window.location.hash);

  // título da aba por tela (e no idioma da interface)
  useEffect(() => {
    const atualizar = () => { document.title = tituloDaAba(lerRota(window.location.hash)); setMenu(false); };
    atualizar();
    window.addEventListener('hashchange', atualizar);
    return () => window.removeEventListener('hashchange', atualizar);
  }, [s.lang]);
  useEffect(() => {
    if (!menu) return;
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenu(false); botaoMenu.current?.focus(); } };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [menu]);
  useEffect(() => { if (!celular) setMenu(false); }, [celular]);

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
  const verPlano = comPlano ? <Button variant="link" size="sm" href={href.plano()}>{t('Ver o plano')}</Button> : null;
  const botaoTema = (
    <Button
      variant="secondary"
      size="sm"
      icon={tema === 'dark' ? <IconSun /> : <IconMoon />}
      aria-label={tema === 'dark' ? t('Tema claro') : t('Tema escuro')}
      onClick={alternarTema}
    />
  );
  const botaoCaso = <Button variant="secondary" size="sm" onClick={() => { setMenu(false); setCaso(true); }} aria-haspopup="dialog">{t('Caso')}</Button>;
  const barraAcoes = rota.tipo === 'pergunta';
  const nomeExemplo = exemploIlustrativo(s) ? nomeDoExemplo(s.exemplo) : '';
  const faixas = (
    <>
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
    </>
  );

  if (rota.tipo === 'inicio') {
    // Página inicial: cabeçalho simples (marca, idioma, tema), sem etapas nem cartão de custo.
    return (
      <DentroDaMoldura.Provider value>
        <div className="pc-app pc-app--inicio">
          <a className="pc-pular" href="#conteudo" onClick={(e) => { e.preventDefault(); document.getElementById('conteudo')?.focus(); }}>{t('Pular para o conteúdo')}</a>
          <Header logos={LOGOS} href={href.inicio()} compact={estreito} context={contexto} actions={<><SeletorIdioma compacto={estreito} />{botaoTema}{botaoCaso}</>} />
          {faixas}
          <div className="pc-corpo"><main id="conteudo" className="pc-main" tabIndex={-1}>{children}</main></div>
          <RodapeCompleto />
          <CasoDialog open={caso} onClose={() => setCaso(false)} />
          <MatrizHost />
        </div>
      </DentroDaMoldura.Provider>
    );
  }

  const pais = s.caso?.pais ? nomePais(paisDoCaso(s.caso)) : '';
  const lugar = String(s.caso?.local || '').trim();
  const ctxCab = [lugar, pais].filter(Boolean).join(' · ') || contexto;
  const passos = nav ? etapas(s, pos) : [];
  const marca = (
    <a className="pc-cab-marca" href={href.inicio()}>
      <span className="pr-header-plate pc-cab-plate">{LOGOS.map((l) => <img key={l.src} className="pc-cab-logo" src={l.src} alt={String(tr(l.alt))} />)}</span>
      <span className="pc-cab-nome">AI in Education Procurement Tool</span>
    </a>
  );
  return (
    <DentroDaMoldura.Provider value>
      <div data-barra-acoes={barraAcoes || undefined} data-coluna={plano || undefined} className="pc-app pc-app--novo">
        <a className="pc-pular" href="#conteudo" onClick={(e) => { e.preventDefault(); document.getElementById('conteudo')?.focus(); }}>{t('Pular para o conteúdo')}</a>
        <header className={'pc-cab' + (celular ? ' pc-cab--celular' : '')}>
          <div className="pc-cab-linha pc-container">
            <div className="pc-cab-esq">
              {marca}
              {!celular && ctxCab ? <span className="pc-cab-ctx">{ctxCab}</span> : null}
            </div>
            {celular ? (
              <button ref={botaoMenu} type="button" className="pc-cab-menu" aria-expanded={menu} aria-controls="pc-menu" aria-label={menu ? t('Fechar o menu') : t('Menu')} onClick={() => setMenu((m) => !m)}>
                {menu ? <IconClose /> : <IconMenu />}
              </button>
            ) : (
              <div className="pc-cab-acoes">
                {atalhos}
                {modo}
                {verPlano}
                <SeletorIdioma compacto />
                {botaoTema}
                {botaoCaso}
              </div>
            )}
          </div>
          {celular && menu ? (
            <nav id="pc-menu" className="pc-menu pc-container" aria-label={t('Menu')}>
              {ctxCab ? <p className="pc-menu-ctx">{ctxCab}</p> : null}
              <div className="pc-menu-acoes">{atalhos}{verPlano}</div>
              <div className="pc-menu-linha">{modo}</div>
              <div className="pc-menu-linha"><SeletorIdioma />{botaoTema}{botaoCaso}</div>
            </nav>
          ) : null}
          {nav && passos.length ? <div className="pc-cab-etapas pc-container"><StepBar steps={passos} compact={celular} label={t('Seu caminho')} /></div> : null}
        </header>
        {faixas}
        {plano && semColuna ? <div className="pc-container"><FaixaCusto s={s} /></div> : null}
        <div className={'pc-corpo pc-corpo--novo pc-container pc-grade' + (plano && !semColuna ? ' pc-corpo--custo' : '')}>
          <main id="conteudo" className="pc-main" tabIndex={-1}><AcoesForaDoQuadro.Provider value>
            {rota.tipo === 'plano' ? <p className="pc-so-impressao">{t('Para imprimir o plano completo, use "Anexo técnico (PDF)".')}</p> : null}
            {children}
          </AcoesForaDoQuadro.Provider></main>
          {plano && !semColuna ? <ColunaCusto s={s} /> : null}
        </div>
        <div className="pc-rodape-faixa"><div className="pc-container"><RodapeCompleto /></div></div>
        <CasoDialog open={caso} onClose={() => setCaso(false)} />
        <MatrizHost />
      </div>
    </DentroDaMoldura.Provider>
  );
}
