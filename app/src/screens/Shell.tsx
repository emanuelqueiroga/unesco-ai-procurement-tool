import { entradaEtapa } from '../percurso/navegacaoOrientada';
// Moldura das telas (teste de layout da v015): cabeçalho com a frente atual numa pílula e as quatro etapas em linha
// (sem a coluna lateral "Seu caminho"), a coluna da pergunta e, à direita, o cartão "Custo desta frente" (≥ 1100 px;
// abaixo, uma faixa noite sob o cabeçalho que leva ao orçamento) e o rodapé institucional. No celular (≤ 900 px) o
// cabeçalho fica compacto: a frente, o menu e a barra de etapas. A página inicial mantém o cabeçalho anterior.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useCaso, telasAtivas, telasDoCapitulo, telaRespondida, origemDe, progressoDe, type Capitulo, type CasoStore } from '../store';
import { Header, StepBar, Segmented, Button, IconMoon, IconSun, IconMenu, IconClose, useMediaQuery, useTheme, BREAKPOINTS, type NavChapter, type BarChapter, type Step } from '../ui';
import { infoCapitulo, CURTO, t } from '../percurso/textos';
import { href, lerRota } from '../percurso/rota';
import { tituloDaTelaLit } from '../percurso/letramento';
import { entradaEtapaLit } from '../percurso/letramentoInterface';
import { percursoPedagogico, percursoGovernanca, percursoLetramento, percursoInstitucional, prioridadeEscolhida, nomePais, paisDoCaso, tr } from '../domain';
import { frentesDoPlano, frenteAtual } from '../percurso/frentes';
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

export function capitulosNav(s: CasoStore, pos: Posicao): NavChapter[] {
  const prog = progressoDe(s);
  return (prioridadeEscolhida(s.ctx) ? [1, 2, 3, 4] : [1] as Capitulo[]).map((n) => {
    const atual = pos.capitulo === n;
    const p = prog[n - 1];
    return {
      n, title: t(infoCapitulo(n as Capitulo, s).titulo), href: percursoLetramento(s.ctx) ? entradaEtapaLit(s, n as Capitulo) : percursoGovernanca(s.ctx)||percursoPedagogico(s.ctx) ? entradaEtapa(s,n as Capitulo) : href.abertura(n),
      state: atual ? 'current' : p.completo ? 'done' : 'todo',
      questions: atual
        ? telasDoCapitulo(n as Capitulo, s).filter(tela => prioridadeEscolhida(s.ctx) || ['local', 'prioridades'].includes(tela.id)).map((tela) => ({
          id: tela.id, title: t(percursoLetramento(s.ctx) && tituloDaTelaLit(s,tela.id) || CURTO[tela.id] || tela.id), href: href.pergunta(n, tela.id),
          state: tela.id === pos.tela ? 'current' : telaRespondida(s, tela) ? 'done' : tela.campos.some((c) => origemDe(s, c) === 'sugerido') ? 'suggested' : 'todo',
        }))
        : undefined,
    } as NavChapter;
  });
}

export function capitulosBarra(s: CasoStore, pos: Posicao): BarChapter[] {
  return progressoDe(s).filter(p => prioridadeEscolhida(s.ctx) || p.capitulo === 1).map((p) => ({
    n: p.capitulo, label: t(infoCapitulo(p.capitulo, s).titulo), progress: prioridadeEscolhida(s.ctx) ? p.total ? p.feitas / p.total : 0 : telasDoCapitulo(1, s).filter(t => ['local', 'prioridades'].includes(t.id) && telaRespondida(s, t)).length / 2, href: percursoLetramento(s.ctx) ? entradaEtapaLit(s, p.capitulo) : percursoGovernanca(s.ctx)||percursoPedagogico(s.ctx) ? entradaEtapa(s,p.capitulo) : href.abertura(p.capitulo),
    state: pos.capitulo === p.capitulo ? 'current' : p.completo ? 'done' : 'todo',
  }));
}

/** Etapas em linha: ✓ nas concluídas, "nome · n de m" e o segmento preenchido até a tela atual na etapa atual. */
export function etapasDaFrente(s: CasoStore, pos: Posicao): Step[] {
  return capitulosBarra(s, pos).map((c) => {
    if (c.state !== 'current' || !pos.tela) return { n: c.n, label: c.label, href: c.href, state: c.state ?? 'todo', progress: c.progress };
    const qs = telasDoCapitulo(c.n as Capitulo, s).filter(q => prioridadeEscolhida(s.ctx) || ['local', 'prioridades'].includes(q.id));
    const i = qs.findIndex(q => q.id === pos.tela);
    return { n: c.n, label: c.label, href: c.href, state: 'current', progress: i < 0 ? c.progress : (i + 1) / qs.length, position: i < 0 ? undefined : t('{n} de {total}', { n: i + 1, total: qs.length }) };
  });
}

/** A frente atual numa pílula; com mais de uma frente, leva ao seletor de frentes. */
function PilulaFrente({ s }: { s: CasoStore }) {
  const lista = frentesDoPlano(s), atual = lista.find(f => f.id === frenteAtual(s));
  if (!atual || !prioridadeEscolhida(s.ctx)) return null;
  const conteudo = <><i className="pc-frente-ponto" aria-hidden="true" /><span className="pc-frente-rotulo">{t('Frente:')}</span> <strong>{t(atual.titulo)}</strong></>;
  return lista.length > 1 || s.ctx.prioridades?.length > 1
    ? <a className="pc-frente-pilula" href={href.frentes()} aria-label={t('Frente:') + ' ' + t(atual.titulo) + ' · ' + t('Trocar')}>{conteudo}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></a>
    : <span className="pc-frente-pilula pc-frente-pilula--fixa">{conteudo}</span>;
}

export function Shell({ children, pos = {}, nav = true, plano = true, inicio = false, contexto }: { children: ReactNode; pos?: Posicao; nav?: boolean; plano?: boolean; inicio?: boolean; contexto?: ReactNode }) {
  const s = useCaso();
  plano = plano && prioridadeEscolhida(s.ctx);
  const estreito = useMediaQuery(BREAKPOINTS.cards);
  const celular = useMediaQuery(BREAKPOINTS.bar);           // cabeçalho compacto com menu
  const semColuna = useMediaQuery('(max-width: 1099px)');   // custo numa faixa sob o cabeçalho
  const [caso, setCaso] = useState(false);
  const [menu, setMenu] = useState(false);
  const botaoMenu = useRef<HTMLButtonElement>(null);
  const [tema, , alternarTema] = useTheme();
  const salvamento = useSalvamento();
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
  const projeto = prioridadeEscolhida(s.ctx) && !percursoInstitucional(s.ctx) && !percursoPedagogico(s.ctx);
  const atalhos = (
    <>
      <Button variant="secondary" size="sm" href={href.inicio()}>{t('Início')}</Button>
      {projeto ? <Button variant="secondary" size="sm" onClick={() => abrirMatriz()} aria-haspopup="dialog" aria-label={t('Matriz camadas × fases')}>{t('Matriz')}</Button> : null}
      {projeto && s.modo === 'refinar' ? <Button variant="secondary" size="sm" href={href.refinar()}>{t('Calculadora')}</Button> : null}
    </>
  );
  const modo = !projeto ? null : (
    <Segmented
      label={t('Modo')}
      value={s.modo}
      onChange={(m) => s.setModo(m)}
      options={[{ value: 'essencial', label: t('Essencial') }, { value: 'refinar', label: t('Refinar') }]}
    />
  );
  const verPlano = comPlano && prioridadeEscolhida(s.ctx) ? <Button variant="link" size="sm" href={href.panorama()}>{t('Plano nacional')}</Button> : null;
  const botaoTema = (
    <Button
      variant="secondary"
      size="sm"
      icon={tema === 'dark' ? <IconSun /> : <IconMoon />}
      aria-label={tema === 'dark' ? t('Tema claro') : t('Tema escuro')}
      onClick={alternarTema}
    />
  );
  const botaoCaso = <Button variant="secondary" size="sm" onClick={() => { setMenu(false); setCaso(true); }} aria-haspopup="dialog">{t('Plano')}</Button>;
  const barraAcoes = rota.tipo === 'pergunta' || rota.tipo === 'frentes';
  const nomeExemplo = exemploIlustrativo(s) ? nomeDoExemplo(s.exemplo) : '';
  const faixas = (
    <>
      {salvamento.falhou && !salvamento.dispensado ? (
        <section className="pc-faixa pc-faixa--atencao" role="status" aria-label={t('Aviso')}>
          <span>{t('Suas respostas não estão sendo salvas neste navegador; exporte o caso para guardá-las.')}</span>
          <Button size="sm" variant="secondary" onClick={() => { void exportarCaso(); }}>{t('Exportar o plano')}</Button>
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

  if (inicio) {
    // Página inicial: fora do teste de layout, mantém o cabeçalho e a moldura anteriores (só herda cores e tipos).
    return (
      <DentroDaMoldura.Provider value>
        <div className="pc-app pc-app--inicio">
          <a className="pc-pular" href="#conteudo" onClick={(e) => { e.preventDefault(); document.getElementById('conteudo')?.focus(); }}>{t('Pular para o conteúdo')}</a>
          <Header logos={LOGOS} href={href.inicio()} compact={estreito} context={contexto} actions={<><SeletorIdioma compacto={estreito} />{botaoTema}</>} />
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
  const ctxCab = pais && prioridadeEscolhida(s.ctx) ? pais + ' · ' + t('plano nacional') : contexto;
  const etapas = nav ? etapasDaFrente(s, pos) : [];
  const marca = (
    <a className="pc-cab-marca" href={href.inicio()}>
      <span className="pr-header-plate pc-cab-plate">{LOGOS.map((l) => <img key={l.src} className="pc-cab-logo" src={l.src} alt={String(tr(l.alt))} />)}</span>
      <span className="pc-cab-nome">AI in Education Procurement Tool</span>
    </a>
  );
  return (
    <DentroDaMoldura.Provider value>
      <div data-barra-acoes={barraAcoes || undefined} className={'pc-app pc-app--novo' + (percursoLetramento(s.ctx) ? ' pc-app--letramento' : percursoGovernanca(s.ctx) || percursoPedagogico(s.ctx) ? ' pc-app--orientado' : '')}>
        <a className="pc-pular" href="#conteudo" onClick={(e) => { e.preventDefault(); document.getElementById('conteudo')?.focus(); }}>{t('Pular para o conteúdo')}</a>
        <header className={'pc-cab' + (celular ? ' pc-cab--celular' : '')}>
          <div className="pc-cab-linha">
            <div className="pc-cab-esq">
              {marca}
              {!celular && ctxCab ? <span className="pc-cab-ctx">{ctxCab}</span> : null}
            </div>
            <PilulaFrente s={s} />
            {celular ? (
              <button ref={botaoMenu} type="button" className="pc-cab-menu" aria-expanded={menu} aria-controls="pc-menu" aria-label={menu ? t('Fechar o menu') : t('Menu')} onClick={() => setMenu((m) => !m)}>
                {menu ? <IconClose /> : <IconMenu />}
              </button>
            ) : (
              <div className="pc-cab-acoes">
                {projeto ? atalhos : null}
                {modo}
                {verPlano}
                <SeletorIdioma compacto />
                {botaoTema}
                {botaoCaso}
              </div>
            )}
          </div>
          {celular && menu ? (
            <nav id="pc-menu" className="pc-menu" aria-label={t('Menu')}>
              {ctxCab ? <p className="pc-menu-ctx">{ctxCab}</p> : null}
              <div className="pc-menu-acoes">{atalhos}{verPlano}{plano ? <Button variant="link" size="sm" href={href.plano()}>{t('Resumo desta frente')}</Button> : null}</div>
              {modo ? <div className="pc-menu-linha">{modo}</div> : null}
              <div className="pc-menu-linha"><SeletorIdioma />{botaoTema}{botaoCaso}</div>
            </nav>
          ) : null}
          {nav && etapas.length ? <div className="pc-cab-etapas"><StepBar steps={etapas} compact={celular} label={t('Etapas da frente')} /></div> : null}
        </header>
        {faixas}
        {plano && semColuna ? <FaixaCusto s={s} tela={pos.tela} /> : null}
        <div className={'pc-corpo pc-corpo--novo' + (plano && !semColuna ? ' pc-corpo--custo' : '')}>
          <main id="conteudo" className="pc-main" tabIndex={-1}>
            {rota.tipo === 'plano' && !percursoInstitucional(s.ctx) && !percursoPedagogico(s.ctx) ? <p className="pc-so-impressao">{t('Para imprimir o plano completo, use "Anexo técnico (PDF)".')}</p> : null}
            {children}
          </main>
          {plano && !semColuna ? <ColunaCusto s={s} tela={pos.tela} /> : null}
        </div>
        <RodapeCompleto />
        <CasoDialog open={caso} onClose={() => setCaso(false)} />
        <MatrizHost />
      </div>
    </DentroDaMoldura.Provider>
  );
}
