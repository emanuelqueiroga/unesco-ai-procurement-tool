// Moldura das telas (v018: a 0.0.14 com o visual atual). Cabeçalho com os atalhos e as quatro etapas em linha (sem a
// coluna lateral "Seu caminho"), a coluna da pergunta e, à direita, o cartão de custo do projeto (≥ 1024 px; abaixo,
// uma faixa noite sob o cabeçalho que leva ao plano) e o rodapé institucional. No celular (≤ 900 px) o cabeçalho fica
// compacto: a marca, o menu e a barra de etapas. A página inicial usa o cabeçalho simples. Com a governança como única
// prioridade, a moldura é a do fluxo da governança da v017: etapas Contexto · Categorias · Opções, a frente numa pílula,
// sem Matriz, Calculadora e modo, e o cartão "Custo desta frente".
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useCaso, telasAtivas, telasDoCapitulo, progressoDe, type Capitulo, type CasoStore } from '../store';
import { AcoesForaDoQuadro, Header, StepBar, Segmented, Button, IconMoon, IconSun, IconMenu, IconClose, useMediaQuery, useTheme, BREAKPOINTS, type Step } from '../ui';
import { infoCapitulo, t } from '../percurso/textos';
import { entradaEtapa } from '../percurso/navegacaoOrientada';
import { frentesDoPlano, frenteAtual } from '../percurso/frentes';
import { href, lerRota } from '../percurso/rota';
import { nomePais, paisDoCaso, percursoGovernanca, tr } from '../domain';
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
  const gov = percursoGovernanca(s.ctx);
  // governança (v017): etapas sem telas (a 4) não aparecem na barra, e cada etapa leva à primeira tela pendente
  return progressoDe(s).filter((p) => !gov || p.capitulo === 1 || p.total > 0).map((p) => {
    const n = p.capitulo as Capitulo, label = t(infoCapitulo(n, s).titulo), atual = pos.capitulo === n;
    const destino = gov ? entradaEtapa(s, n) : href.abertura(n);
    const state = atual ? 'current' : p.completo ? 'done' : 'todo';
    const progress = p.total ? p.feitas / p.total : 0;
    if (!atual || !pos.tela) return { n, label, href: destino, state, progress };
    const qs = telasDoCapitulo(n, s), i = qs.findIndex((q) => q.id === pos.tela);
    return { n, label, href: destino, state, progress: i < 0 ? progress : (i + 1) / qs.length, position: i < 0 || qs.length < 2 ? undefined : t('{n} de {total}', { n: i + 1, total: qs.length }) };
  });
}

/** Governança (v017): a frente atual numa pílula. */
function PilulaFrente({ s }: { s: CasoStore }) {
  const atual = frentesDoPlano(s).find(f => f.id === frenteAtual(s));
  if (!atual) return null;
  return <span className="pc-frente-pilula pc-frente-pilula--fixa"><i className="pc-frente-ponto" aria-hidden="true" /><span className="pc-frente-rotulo">{t('Frente:')}</span> <strong>{t(atual.titulo)}</strong></span>;
}

export function Shell({ children, pos = {}, nav = true, plano = true, contexto }: { children: ReactNode; pos?: Posicao; nav?: boolean; plano?: boolean; contexto?: ReactNode }) {
  const s = useCaso();
  // como na v017: o cartão de custo aparece depois que a prioridade é escolhida
  plano = plano && (s.ctx.prioridades || []).length > 0;
  const estreito = useMediaQuery(BREAKPOINTS.cards);
  const celular = useMediaQuery(BREAKPOINTS.bar);           // cabeçalho compacto com menu
  const semColuna = useMediaQuery('(max-width: 1023px)');
  const matrizCurta = useMediaQuery('(max-width: 1279px)'); // no cabeçalho do percurso, rótulo curto abaixo de 1280 px   // custo numa faixa sob o cabeçalho (uma coluna só)
  const calculoCurto = useMediaQuery('(max-width: 1599px)'); // v018: "Cálculo" abaixo de 1600 px
  const [caso, setCaso] = useState(false);
  const [menu, setMenu] = useState(false);
  const botaoMenu = useRef<HTMLButtonElement>(null);
  const [tema, , alternarTema] = useTheme();
  const salvamento = useSalvamento();
  const gov = percursoGovernanca(s.ctx);
  const respondidas = telasAtivas(s).length - progressoDe(s).reduce((a, p) => a + (p.total - p.feitas), 0);
  const rota = lerRota(typeof window === 'undefined' ? '' : window.location.hash);

  // título da aba por tela (e no idioma da interface)
  useEffect(() => {
    const atualizar = () => { document.title = tituloDaAba(lerRota(window.location.hash), useCaso.getState()); setMenu(false); };
    atualizar();
    window.addEventListener('hashchange', atualizar);
    return () => window.removeEventListener('hashchange', atualizar);
  }, [s.lang, s.ctx.prioridades]);
  useEffect(() => {
    if (!menu) return;
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenu(false); botaoMenu.current?.focus(); } };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [menu]);
  useEffect(() => { if (!celular) setMenu(false); }, [celular]);

  const comPlano = respondidas > 0 || s.exemplo !== 'novo';
  // v018: o botão da matriz camadas × fases (como na 0.0.14), também na página inicial e no percurso da governança
  const curtoMatriz = rota.tipo === 'inicio' ? estreito : matrizCurta;
  const botaoMatriz = <Button variant="secondary" size="sm" onClick={() => abrirMatriz()} aria-haspopup="dialog" aria-label={curtoMatriz ? t('Matriz camadas × fases') : undefined}>{curtoMatriz ? t('Matriz') : t('Matriz camadas × fases')}</Button>;
  // v018: como o custo da governança é calculado (ao lado da matriz, no percurso da governança)
  const botaoCalculo = <Button variant="secondary" size="sm" href={href.metodologia()} aria-label={calculoCurto ? t('Como o custo é calculado') : undefined} title={calculoCurto ? t('Como o custo é calculado') : undefined}>{calculoCurto ? t('Cálculo') : t('Como o custo é calculado')}</Button>;
  const atalhos = (
    <>
      <Button variant="secondary" size="sm" href={href.inicio()}>{t('Início')}</Button>
      {botaoMatriz}
      {s.modo === 'refinar' ? <Button variant="secondary" size="sm" href={href.refinar()}>{t('Calculadora')}</Button> : null}
    </>
  );
  const modo = gov ? null : (
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
          <Header logos={LOGOS} href={href.inicio()} compact={estreito} context={contexto} actions={<>{estreito ? null : botaoMatriz}<SeletorIdioma compacto={estreito} />{botaoTema}</>} />
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
  // governança (v017): a instituição responsável · o país
  const lugar = String((gov ? s.ctx.local : s.caso?.local) || '').trim();
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
      <div data-barra-acoes={barraAcoes || undefined} data-coluna={plano || undefined} className={'pc-app pc-app--novo' + (gov ? ' pc-app--orientado' : '')}>
        <a className="pc-pular" href="#conteudo" onClick={(e) => { e.preventDefault(); document.getElementById('conteudo')?.focus(); }}>{t('Pular para o conteúdo')}</a>
        <header className={'pc-cab' + (celular ? ' pc-cab--celular' : '')}>
          <div className="pc-cab-linha pc-container">
            <div className="pc-cab-esq">
              {marca}
              {gov ? <PilulaFrente s={s} /> : null}
              {!celular && ctxCab ? <span className="pc-cab-ctx">{ctxCab}</span> : null}
            </div>
            {celular ? (
              <button ref={botaoMenu} type="button" className="pc-cab-menu" aria-expanded={menu} aria-controls="pc-menu" aria-label={menu ? t('Fechar o menu') : t('Menu')} onClick={() => setMenu((m) => !m)}>
                {menu ? <IconClose /> : <IconMenu />}
              </button>
            ) : (
              <div className="pc-cab-acoes">
                {gov ? <>{botaoMatriz}{botaoCalculo}</> : atalhos}
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
              <div className="pc-menu-acoes">{gov ? <>{botaoMatriz}{botaoCalculo}</> : atalhos}{verPlano}</div>
              {modo ? <div className="pc-menu-linha">{modo}</div> : null}
              <div className="pc-menu-linha"><SeletorIdioma />{botaoTema}{botaoCaso}</div>
            </nav>
          ) : null}
          {nav && passos.length ? <div className="pc-cab-etapas pc-container"><StepBar steps={passos} compact={celular} label={t('Seu caminho')} /></div> : null}
        </header>
        {faixas}
        {plano && semColuna ? <div className="pc-container"><FaixaCusto s={s} tela={pos.tela} /></div> : null}
        <div className={'pc-corpo pc-corpo--novo pc-container pc-grade' + (plano && !semColuna ? ' pc-corpo--custo' : '')}>
          <main id="conteudo" className="pc-main" tabIndex={-1}><AcoesForaDoQuadro.Provider value>
            {rota.tipo === 'plano' && !gov ? <p className="pc-so-impressao">{t('Para imprimir o plano completo, use "Anexo técnico (PDF)".')}</p> : null}
            {children}
          </AcoesForaDoQuadro.Provider></main>
          {plano && !semColuna ? <ColunaCusto s={s} tela={pos.tela} /> : null}
        </div>
        <div className="pc-rodape-faixa"><div className="pc-container"><RodapeCompleto /></div></div>
        <CasoDialog open={caso} onClose={() => setCaso(false)} />
        <MatrizHost />
      </div>
    </DentroDaMoldura.Provider>
  );
}
