// Telas do percurso: abertura de capítulo (D2), pergunta (D3–D6, M2, M3) e síntese de capítulo (D7).
import { useEffect, useState, type ReactNode } from 'react';
import {
  CAMPO_POR_ID, textoCampo, tr, REF_TCO, INFO_C236, modoTeste, ajudaDeTela, dicaDaTela, dicaDoCampo, quemSabe,
} from '../domain';
import {
  useCaso, ESSENCIAL, telasDoCapitulo, afetadosPor, camposRefinar, origemDe, extrasDoCapitulo, comparaN, idDoFoco, comLacuna,
  type Capitulo, type CasoStore, type Origem,
} from '../store';
import { ChapterOpening, ChapterSummary, QuestionFrame, Button, SourceTag, Popover } from '../ui';
import { TextoComTermos } from '../ui/Termo';
import { Shell } from './Shell';
import { BotoesPDF } from './Plano';
import { ControlesTela, ControleCampo, ControleExtra, ProvedorRefinar, sugeridosDaTela, TIPOS_SIMPLES } from '../percurso/Controles';
import { sinteseCapitulo, type Proximo } from '../percurso/sintese';
import './plano-rec.css';
import { CAPITULOS_INFO, LEAD, TITULO_TELA, linhaAfeta, plural, t } from '../percurso/textos';
import { href, ir } from '../percurso/rota';
import './percurso-ajuda.css';

const rotuloOrigem = (o: string) => ({ padrao: t('padrão'), sugerido: t('~ sugerido'), informado: t('informado'), refinado: t('refinado') } as Record<string, string>)[o] || o;

export function Abertura({ n }: { n: Capitulo }) {
  // A abertura também deve retraduzir seus textos ao trocar o idioma no cabeçalho.
  useCaso((s) => s.lang);
  const info = CAPITULOS_INFO[n];
  const telas = telasDoCapitulo(n);
  return (
    <Shell pos={{ capitulo: n }} contexto={t('Capítulo {n} de 4', { n })}>
      <div className="pc-abertura" data-abertura={n}>
        <ChapterOpening
          n={n}
          kicker={t('Capítulo {n} de 4', { n })}
          title={t(info.titulo)}
          guide={t(info.guia)}
          questions={telas.length}
          minutes={info.minutos}
          action={
            <div className="pc-botoes">
              <Button variant="secondary" href={n === 1 ? href.inicio() : href.sintese((n - 1) as Capitulo)}>{n === 1 ? t('Voltar ao início') : t('Voltar ao capítulo {n}', { n: n - 1 })}</Button>
              <Button href={href.pergunta(n, telas[0].id)}>{t('Começar o capítulo')}</Button>
            </div>
          }
        >
          {t(info.texto)}
        </ChapterOpening>
        <ul className="pc-abertura-notas">
          <li>{t('Você sai com: {entrega}', { entrega: t(info.entrega) })}</li>
          {n === 1 ? <li>{t('Tenha à mão o cadastro de escolas e matrículas, ou os números da sua rede.')}</li> : null}
          <li className="pc-nota">{t('Alimenta: {c}', { c: t(info.alimenta) })}</li>
          {n === 3 ? (
            <li className="pc-nota">
              <Popover
                label={t('Sobre as camadas 2, 3 e 6')}
                title={t('Sobre as camadas 2, 3 e 6')}
                actions={<a href={REF_TCO.url} target="_blank" rel="noopener noreferrer">{String(tr(REF_TCO.link))}</a>}
              >
                {String(tr(INFO_C236))} {String(tr(REF_TCO.texto))}
              </Popover>
            </li>
          ) : null}
        </ul>
      </div>
    </Shell>
  );
}

function tituloTela(s: CasoStore, id: string): string {
  if (TITULO_TELA[id]) return t(TITULO_TELA[id]);
  const f: any = (CAMPO_POR_ID as any)[id];
  return f ? String(tr(textoCampo(f, s.caso))) : id;
}

const semDoisPontos = (x: string) => x.replace(/\s*[:：]\s*$/, '');

/** "Por que perguntamos isso?" aberto: Como responder, Quem costuma saber e Exemplo, com os termos do glossário sublinhados. */
function AjudaPergunta({ ajuda }: { ajuda: { como: string | null; quem: string | null; exemplo: string | null } }) {
  const itens = ([
    [t('Como responder'), ajuda.como],
    [semDoisPontos(t('Quem costuma saber:')), ajuda.quem],
    [t('Exemplo'), ajuda.exemplo],
  ] as [string, string | null][]).filter((x): x is [string, string] => !!x[1]);
  return (
    <dl className="pc-ajuda" id="pc-ajuda">
      {itens.map(([rotulo, texto]) => (
        <div key={rotulo} className="pc-ajuda-item">
          <dt>{rotulo}</dt>
          <dd><TextoComTermos texto={texto} /></dd>
        </div>
      ))}
    </dl>
  );
}

export function Pergunta({ n, tela: id }: { n: Capitulo; tela: string }) {
  const s = useCaso();
  // sem memória: a explicação começa fechada em cada pergunta (a tela é remontada a cada pergunta) e nunca abre sozinha
  const [porque, setPorque] = useState(false);
  const telas = telasDoCapitulo(n);
  const i = telas.findIndex((x) => x.id === id);
  const tela = telas[i];
  const prox = telas[i + 1] ? href.pergunta(n, telas[i + 1].id) : href.sintese(n);
  const ant = i > 0 ? href.pergunta(n, telas[i - 1].id) : href.abertura(n);
  const sugeridos = sugeridosDaTela(s, tela);
  const ajuda = ajudaDeTela(tela.n, { modo: modoTeste(s.caso) });
  const dica = dicaDaTela(tela.campos);
  const afetados = Array.from(new Set(tela.campos.flatMap((c) => afetadosPor(c))));
  // um texto sugerido que ainda tem lacuna (__) não é confirmado: a pessoa precisa completá-lo
  const confirmaveis = sugeridos.filter((c) => !comLacuna(s, c));
  const continuar = () => { confirmaveis.forEach((c) => s.confirmar(c)); ir(prox); };
  // no Refinar não há limite de problemas, então a frase de abertura muda
  const lead = id === 'problemas' && s.modo === 'refinar'
    ? 'Marque os problemas que quer resolver; no modo Refinar não há limite. Cada problema já traz uma descrição, impactos e tarefas que a IA pode apoiar; você ajusta depois.'
    : LEAD[id] || null;
  const numeroGlobal = ESSENCIAL.indexOf(tela) + 1;
  return (
    <Shell pos={{ capitulo: n, tela: id }} contexto={t('Capítulo {n} · {nome}', { n, nome: t(CAPITULOS_INFO[n].titulo) })}>
      <div className="pc-pergunta" data-tela={id}>
        <QuestionFrame
          kicker={t('Capítulo {n} · {nome} · pergunta {i} de {total}', { n, nome: t(CAPITULOS_INFO[n].titulo), i: i + 1, total: telas.length })}
          title={tituloTela(s, id)}
          explanation={
            <>
              {lead ? <TextoComTermos texto={lead} /> : null}
              {dica ? <>{lead ? ' ' : ''}<span className="pc-dica"><span className="pc-dica-rot">{t('Dica:')}</span> <TextoComTermos texto={dica} /></span></> : null}
            </>
          }
          help={porque && ajuda ? <AjudaPergunta ajuda={ajuda} /> : null}
          actions={
            <div className="pc-botoes">
              <Button onClick={continuar}>{confirmaveis.length ? t('Aceitar a sugestão e continuar') : t('Continuar')}</Button>
              <Button variant="secondary" href={prox}>{t('Pular por agora')}</Button>
              {ajuda ? (
                <Button variant="link" aria-expanded={porque} aria-controls={porque ? 'pc-ajuda' : undefined} onClick={() => setPorque((x) => !x)}>
                  {porque ? t('Fechar a explicação') : t('Por que perguntamos isso?')}
                </Button>
              ) : null}
            </div>
          }
          affectsPrefix={t('Esta resposta muda no plano:')}
          affects={linhaAfeta(afetados, +s.caso.horizonte || 3)}
        >
          <ControlesTela e={s} tela={tela} />
        </QuestionFrame>
        <nav className="pc-voltar" aria-label={t('Navegação entre perguntas')}>
          <a href={ant}><span aria-hidden="true" className="pc-seta-voltar">← </span>{i > 0 ? t('Pergunta anterior') : t('Abertura do capítulo')}</a>
          <span className="pc-nota">{t('Pergunta {i} de {n} do Essencial', { i: numeroGlobal, n: ESSENCIAL.length })}</span>
        </nav>
      </div>
    </Shell>
  );
}

/** títulos dos detalhes do Refinar que não são perguntas de CAMPOS (EXTRAS_REFINAR) */
const TITULO_EXTRA: Record<string, string> = {
  grade: 'Estudantes por ano ou série',
  subs: 'Subcategorias dos problemas',
  problemaOutro: 'Outro problema',
  linhaBase: 'Para quais problemas e qual medida (linha de base)',
  governanca: 'Qual documento ou equipe já existe, e o que falta (governança)',
};

/** Dica de uma linha e "Quem costuma saber" de uma pergunta do Refinar (as dez que o Essencial não traz ficavam sem ajuda). */
function AjudaRefinar({ id, n }: { id: string; n: string }) {
  const dica = dicaDoCampo(id), quem = quemSabe(n);
  if (!dica && !quem) return null;
  return (
    <p className="pc-ajuda-refinar">
      {dica ? <span className="pc-dica"><span className="pc-dica-rot">{t('Dica:')}</span> <TextoComTermos texto={dica} /></span> : null}
      {quem ? <span className="pc-quem"><span className="pc-dica-rot">{t('Quem costuma saber:')}</span> {t(quem)}</span> : null}
    </p>
  );
}

interface ItemPremissa { id: string; n: string; titulo: string; origem: Origem | null; corpo: ReactNode }

/**
 * Modo Refinar: as perguntas deste capítulo que não estão no Essencial (inclusive a lista de ferramentas e a arquitetura) e os
 * detalhes das perguntas do Essencial (estudantes por ano, subcategorias, outro problema, medida, governança), gravados com
 * refinar() (origem "refinado"). Cada item tem o id `prem-<campo>`, o alvo de `#/capitulo/:n/sintese/:campo`.
 */
function PremissasCapitulo({ s, n, foco }: { s: CasoStore; n: Capitulo; foco?: string }) {
  const campos = camposRefinar(n).filter((c) => TIPOS_SIMPLES.includes((CAMPO_POR_ID as any)[c].tipo) && (!(CAMPO_POR_ID as any)[c].se || (CAMPO_POR_ID as any)[c].se(s.caso)));
  const itens: ItemPremissa[] = [
    ...campos.map((c): ItemPremissa => {
      const f: any = (CAMPO_POR_ID as any)[c];
      return { id: c, n: f.n, titulo: String(tr(textoCampo(f, s.caso))), origem: origemDe(s, c), corpo: <ControleCampo e={s} campo={c} /> };
    }),
    ...extrasDoCapitulo(n).map((x): ItemPremissa => {
      const o = x.campos.map((c) => origemDe(s, c)).find((v) => v === 'refinado' || v === 'informado');
      return { id: x.id, n: x.n, titulo: t(TITULO_EXTRA[x.id] || x.id), origem: x.campos.length ? (o || 'padrao') : null, corpo: <ControleExtra e={s} id={x.id} /> };
    }),
  ].sort((a, b) => comparaN(a.n, b.n));
  const alvo = foco ? idDoFoco(foco) : '';
  // com `foco`, rola até o campo e dá foco nele (depois do foco no título que a rota dá ao trocar de tela)
  useEffect(() => {
    if (!alvo) return;
    let cancelado = false, r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        if (cancelado) return;
        const el = document.getElementById('prem-' + alvo) || document.getElementById(`pc-refinar-${n}`);
        if (!el) return;
        el.scrollIntoView({ block: 'center' });
        const controle = el.querySelector<HTMLElement>('input, select, textarea, button, a[href]');
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
        (controle || el).focus({ preventScroll: true });
      });
    });
    return () => { cancelado = true; cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, [alvo, n]);
  if (!itens.length) return null;
  return (
    <section className="pc-refinar" aria-labelledby={`pc-refinar-${n}`}>
      <h2 id={`pc-refinar-${n}`} className="pc-refinar-titulo">{t('Premissas deste capítulo')}</h2>
      <p className="pc-nota">{t('No modo Essencial estas perguntas usam a premissa padrão. Ajuste o que conhecer; o resto continua padrão.')}</p>
      <ProvedorRefinar value>
        <ol className="pc-refinar-lista">
          {itens.map((it) => (
            <li key={it.id} id={`prem-${it.id}`} className={['pc-refinar-item', it.id === alvo ? 'pcx-foco' : ''].filter(Boolean).join(' ')}>
              <div className="pc-refinar-cab">
                <span className="pc-refinar-n">{it.n}</span>
                <span className="pc-refinar-q">{it.titulo}</span>
                {it.origem ? <SourceTag origin={it.origem} label={rotuloOrigem(it.origem)} /> : null}
              </div>
              <AjudaRefinar id={it.id} n={it.n} />
              {it.corpo}
            </li>
          ))}
        </ol>
      </ProvedorRefinar>
    </section>
  );
}

/** "Seu próximo passo" (5.6, REC-42): a recomendação do brief, 3 ações com quem age e o marco, custo do Ano 0, cuidado e
 *  o que falta; PB-08: os dois downloads, o policy brief (principal) e o anexo técnico. */
function ProximoPasso({ p, s }: { p: Proximo; s: CasoStore }) {
  return (
    <div className="pc-proximo" data-proximo>
      <span className="pc-proximo-v">{p.veredito}</span>
      {p.porque ? <span className="pc-nota">{p.porque}</span> : null}
      {p.acoes.length ? (
        <>
          <b>{p.acoesTitulo}</b>
          <ol>{p.acoes.map((a) => <li key={a.id}>{a.oque} <span className="pc-nota">({a.id} · {a.linha})</span></li>)}</ol>
        </>
      ) : null}
      {p.custo ? <span>{p.custo}</span> : null}
      {p.cuidado ? <span className="pc-nota">{p.cuidado}</span> : null}
      {p.faltam ? <a href={href.plano('faltam')}>{p.faltamTxt}</a> : null}
      <BotoesPDF s={s} tamanho="md" />
    </div>
  );
}

export function Sintese({ n, foco }: { n: Capitulo; foco?: string }) {
  const s = useCaso();
  const sin = sinteseCapitulo(n, s);
  const prox = n < 4 ? CAPITULOS_INFO[(n + 1) as Capitulo] : null;
  const telas = telasDoCapitulo(n);
  return (
    <Shell pos={{ capitulo: n, sintese: true }} contexto={t('Fim do capítulo {n}', { n })}>
      <div className="pc-sintese" data-sintese={n}>
        <ChapterSummary
          n={n}
          kicker={t('Fim do capítulo {n}', { n })}
          title={n === 4 && sin.proximo ? sin.proximo.titulo : t('Até aqui, o que você já sabe')}
          paragraphs={sin.paragrafos}
          kpi={sin.kpi ? {
            kicker: n === 2 ? t('O primeiro número do seu plano') : t('O número deste capítulo'),
            label: sin.kpi.label, value: sin.kpi.value, fullValue: sin.kpi.fullValue,
            origin: <SourceTag origin={sin.kpi.origem} label={sin.kpi.origem === 'padrao' ? t('estimativa com premissas padrão') : rotuloOrigem(sin.kpi.origem)} />,
          } : undefined}
          recommendations={n === 4 && sin.proximo ? <ProximoPasso p={sin.proximo} s={s} /> : sin.nRecs ? (
            <>
              {sin.nRecs === 1 ? t('Já apareceu 1 recomendação') : t('Já apareceram {n} recomendações', { n: sin.nRecs })}
              {sin.nCondicoes ? ', ' + plural(sin.nCondicoes, '{n} condição', '{n} condições') : ''}
              {' · '}<a href={href.plano('fazer')}>{t('ver no plano')}</a>
            </>
          ) : undefined}
          next={prox ? { title: t('Próximo capítulo: {nome}', { nome: t(prox.titulo) }), text: t(prox.guia) } : undefined}
          actions={
            <div className="pc-botoes">
              <Button variant="secondary" href={href.pergunta(n, telas[0].id)}>{t('Revisar o capítulo {n}', { n })}</Button>
              {n < 4 ? <Button variant="secondary" href={href.plano()}>{t('Ver o plano parcial')}</Button> : null}
              <Button href={n < 4 ? href.abertura(n + 1) : href.plano()}>{n < 4 ? t('Capítulo {n}: {nome}', { n: n + 1, nome: t(prox!.titulo) }) : t('Abrir o plano')}</Button>
            </div>
          }
        />
        {s.modo === 'refinar' || foco ? <PremissasCapitulo s={s} n={n} foco={foco} /> : (
          <p className="pc-nota pc-dica-refinar">
            {t('Quer ajustar as premissas padrão deste capítulo?')}{' '}
            <Button variant="link" onClick={() => s.setModo('refinar')}>{t('Mudar para o modo Refinar')}</Button>
          </p>
        )}
      </div>
    </Shell>
  );
}
