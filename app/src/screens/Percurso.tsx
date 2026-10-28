// Telas do percurso: abertura de capítulo (D2), pergunta (D3–D6, M2, M3) e síntese de capítulo (D7).
import { useState } from 'react';
import { CAMPO_POR_ID, textoCampo, tr } from '../domain';
import { useCaso, ESSENCIAL, telasDoCapitulo, afetadosPor, camposRefinar, origemDe, type Capitulo, type CasoStore } from '../store';
import { ChapterOpening, ChapterSummary, QuestionFrame, Button, SourceTag } from '../ui';
import { Shell } from './Shell';
import { ControlesTela, ControleCampo, sugeridosDaTela, TIPOS_SIMPLES } from '../percurso/Controles';
import { sinteseCapitulo } from '../percurso/sintese';
import { CAPITULOS_INFO, LEAD, TITULO_TELA, linhaAfeta, plural, t } from '../percurso/textos';
import { href, ir } from '../percurso/rota';

const rotuloOrigem = (o: string) => ({ padrao: t('padrão'), sugerido: t('~ sugerido'), informado: t('informado'), refinado: t('refinado') } as Record<string, string>)[o] || o;

export function Abertura({ n }: { n: Capitulo }) {
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
        <p className="pc-nota">{t('Alimenta: {c}', { c: t(info.alimenta) })}</p>
      </div>
    </Shell>
  );
}

function tituloTela(s: CasoStore, id: string): string {
  if (TITULO_TELA[id]) return t(TITULO_TELA[id]);
  const f: any = (CAMPO_POR_ID as any)[id];
  return f ? String(tr(textoCampo(f, s.caso))) : id;
}

export function Pergunta({ n, tela: id }: { n: Capitulo; tela: string }) {
  const s = useCaso();
  const [porque, setPorque] = useState(false);
  const telas = telasDoCapitulo(n);
  const i = telas.findIndex((x) => x.id === id);
  const tela = telas[i];
  const prox = telas[i + 1] ? href.pergunta(n, telas[i + 1].id) : href.sintese(n);
  const ant = i > 0 ? href.pergunta(n, telas[i - 1].id) : href.abertura(n);
  const sugeridos = sugeridosDaTela(s, tela);
  const f: any = (CAMPO_POR_ID as any)[tela.campos[0]] || {};
  const ajuda = [f.h, f.ex].filter(Boolean).map((x: string) => String(tr(x)));
  const afetados = Array.from(new Set(tela.campos.flatMap((c) => afetadosPor(c))));
  const continuar = () => { sugeridos.forEach((c) => s.confirmar(c)); ir(prox); };
  const numeroGlobal = ESSENCIAL.indexOf(tela) + 1;
  return (
    <Shell pos={{ capitulo: n, tela: id }} contexto={t('Capítulo {n} · {nome}', { n, nome: t(CAPITULOS_INFO[n].titulo) })}>
      <div className="pc-pergunta" data-tela={id}>
        <QuestionFrame
          kicker={t('Capítulo {n} · {nome} · pergunta {i} de {total}', { n, nome: t(CAPITULOS_INFO[n].titulo), i: i + 1, total: telas.length })}
          title={tituloTela(s, id)}
          explanation={
            <>
              {LEAD[id] ? t(LEAD[id]) : null}
              {porque && ajuda.length ? <span className="pc-porque" id="pc-porque">{ajuda.map((a) => <span key={a}>{a}</span>)}</span> : null}
            </>
          }
          actions={
            <div className="pc-botoes">
              <Button onClick={continuar}>{sugeridos.length ? t('Aceitar a sugestão e continuar') : t('Continuar')}</Button>
              <Button variant="secondary" href={prox}>{t('Pular por agora')}</Button>
              {ajuda.length ? (
                <Button variant="link" aria-expanded={porque} aria-controls="pc-porque" onClick={() => setPorque((x) => !x)}>
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
          <a href={ant}>← {i > 0 ? t('Pergunta anterior') : t('Abertura do capítulo')}</a>
          <span className="pc-nota">{t('Pergunta {i} de {n} do Essencial', { i: numeroGlobal, n: ESSENCIAL.length })}</span>
        </nav>
      </div>
    </Shell>
  );
}

/** Modo Refinar: as perguntas deste capítulo que não estão no Essencial, com a premissa padrão aberta para edição. */
function PremissasCapitulo({ s, n }: { s: CasoStore; n: Capitulo }) {
  const campos = camposRefinar(n).filter((c) => TIPOS_SIMPLES.includes((CAMPO_POR_ID as any)[c].tipo) && (!(CAMPO_POR_ID as any)[c].se || (CAMPO_POR_ID as any)[c].se(s.caso)));
  if (!campos.length) return null;
  return (
    <section className="pc-refinar" aria-labelledby={`pc-refinar-${n}`}>
      <h2 id={`pc-refinar-${n}`} className="pc-refinar-titulo">{t('Premissas deste capítulo')}</h2>
      <p className="pc-nota">{t('No modo Essencial estas perguntas usam a premissa padrão. Ajuste o que conhecer; o resto continua padrão.')}</p>
      <ol className="pc-refinar-lista">
        {campos.map((c) => {
          const f: any = (CAMPO_POR_ID as any)[c];
          return (
            <li key={c} className="pc-refinar-item">
              <div className="pc-refinar-cab">
                <span className="pc-refinar-n">{f.n}</span>
                <span className="pc-refinar-q">{String(tr(textoCampo(f, s.caso)))}</span>
                <SourceTag origin={origemDe(s, c)} label={rotuloOrigem(origemDe(s, c))} />
              </div>
              <ControleCampo e={s} campo={c} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function Sintese({ n }: { n: Capitulo }) {
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
          title={n === 4 ? t('O plano está completo') : t('Até aqui, o que você já sabe')}
          paragraphs={sin.paragrafos}
          kpi={sin.kpi ? {
            kicker: n === 2 ? t('O primeiro número do seu plano') : t('O número deste capítulo'),
            label: sin.kpi.label, value: sin.kpi.value, fullValue: sin.kpi.fullValue,
            origin: <SourceTag origin={sin.kpi.origem} label={sin.kpi.origem === 'padrao' ? t('estimativa com premissas padrão') : rotuloOrigem(sin.kpi.origem)} />,
          } : undefined}
          recommendations={sin.nRecs ? (
            <>
              {sin.nRecs === 1 ? t('Já apareceu 1 recomendação') : t('Já apareceram {n} recomendações', { n: sin.nRecs })}
              {sin.recsAltas.length ? ', ' + plural(sin.recsAltas.length, '{n} de prioridade alta', '{n} de prioridade alta') : ''}
              {' · '}<a href={href.plano('fazer')}>{t('ver no plano')}</a>
            </>
          ) : undefined}
          next={prox ? { title: t('Próximo capítulo: {nome}', { nome: t(prox.titulo).toLowerCase() }), text: t(prox.guia) } : undefined}
          actions={
            <div className="pc-botoes">
              <Button variant="secondary" href={href.pergunta(n, telas[0].id)}>{t('Revisar o capítulo {n}', { n })}</Button>
              {n < 4 ? <Button variant="secondary" href={href.plano()}>{t('Ver o plano parcial')}</Button> : null}
              <Button href={n < 4 ? href.abertura(n + 1) : href.plano()}>{n < 4 ? t('Capítulo {n}: {nome}', { n: n + 1, nome: t(prox!.titulo).toLowerCase() }) : t('Abrir o plano')}</Button>
            </div>
          }
        />
        {s.modo === 'refinar' ? <PremissasCapitulo s={s} n={n} /> : (
          <p className="pc-nota pc-dica-refinar">
            {t('Quer ajustar as premissas padrão deste capítulo?')}{' '}
            <Button variant="link" onClick={() => s.setModo('refinar')}>{t('Mudar para o modo Refinar')}</Button>
          </p>
        )}
      </div>
    </Shell>
  );
}
