// Plano (D8, D9, M4): Em resumo, O que fazer e Respostas que faltam. Quanto custa (tabela por camada e ano),
// O que exigir, o apêndice, a calculadora do Refinar e o PDF chegam na 0.1.0-alpha.3.
import { CAMADAS, QUANDO_REC, tr } from '../domain';
import { useCaso, faltamDe, type CasoStore } from '../store';
import { PlanIndex, KpiTile, LayerBars, Recommendation, SourceTag, Alert, Button, type PlanIndexItem } from '../ui';
import { Shell, Rodape } from './Shell';
import { usePainel } from './PlanoVivo';
import { baixarArquivo } from './CasoDialog';
import { textoCaso, nomeArqCaso } from '../export/json';
import { fmt } from '../percurso/ambiente';
import { CURTO, CAPITULOS_INFO, t } from '../percurso/textos';
import { href } from '../percurso/rota';
import type { Painel, RecPlano } from '../percurso/painel';

type Pagina = 'resumo' | 'fazer' | 'faltam';
const rotuloOrigem = (o: string) => ({ padrao: t('padrão'), sugerido: t('~ sugerido'), informado: t('informado'), refinado: t('refinado') } as Record<string, string>)[o] || o;

function Rec({ r, n, compact }: { r: RecPlano; n?: number; compact?: boolean }) {
  return (
    <Recommendation
      n={n}
      compact={compact}
      action={r.texto}
      why={r.porque || undefined}
      priority={r.prioridade}
      priorityLabel={r.prioridade === 'alta' ? t('Prioridade alta') : t('Prioridade média')}
      moment={r.quandoRotulo || undefined}
      kind={r.tipo === 'custo' ? t('Custo e compra') : r.tipo === 'politica' ? t('Política e governança') : undefined}
      link={r.tela ? { href: href.tela(r.tela), label: t('Rever a resposta') } : undefined}
    />
  );
}

function Resumo({ s, p }: { s: CasoStore; p: Painel }) {
  const principal = p.recs.find((r) => r.prioridade === 'alta') || p.recs[0];
  const total = p.camadas.reduce((a, c) => a + c.valor, 0);
  const maior = [...p.camadas].sort((a, b) => b.valor - a.valor)[0];
  const nomeCamada = (n: number) => String(tr(((CAMADAS as any[]).find((c) => c[0] === n) || [n, ''])[1]));
  return (
    <>
      <header className="pc-plano-capa">
        <p className="pc-kicker">{p.premissas ? t('Plano de contratação · estimativa com {n} respostas a confirmar', { n: p.premissas }) : t('Plano de contratação')}</p>
        <h1 className="pc-plano-titulo">{p.titulo || t('Caso sem nome')}</h1>
        {p.fatos ? <p className="pc-plano-fatos">{p.fatos}</p> : null}
        {s.exemplo !== 'novo' ? <p className="pc-nota">{t('Exemplo ilustrativo: as respostas não são de uma rede real.')}</p> : null}
      </header>
      {principal ? (
        <div className="pc-callout">
          <span className="pc-callout-rotulo">{t('Recomendação principal')}</span>
          <span>{principal.texto}</span>
        </div>
      ) : null}
      {p.temNumeros ? (
        <>
          <div className="pc-kpis">
            {p.kpis.map((k) => (
              <KpiTile key={k.id} label={k.label} value={k.value} fullValue={k.fullValue} origin={<SourceTag origin={k.origem} label={rotuloOrigem(k.origem)} />} />
            ))}
          </div>
          {total > 0 ? (
            <LayerBars
              title={t('Custo por camada, {H} anos', { H: p.H })}
              items={p.camadas.filter((c) => c.valor > 0).map((c) => ({ layer: c.layer, label: nomeCamada(c.layer), value: c.valor, display: fmt.curto(c.valor) }))}
              conclusion={maior ? t('A maior parte do custo está em {c} ({pct} do total), não na licença da ferramenta.', { c: nomeCamada(maior.layer).toLowerCase(), pct: Math.round((100 * maior.valor) / total) + '%' }) : ''}
              caption={t('Sete camadas de Krueger e Jackson (2026). Custo econômico em valores constantes.')}
            />
          ) : null}
        </>
      ) : (
        <Alert kind="info" title={t('Ainda sem números')}>
          {t('Os números do plano aparecem quando você disser o tipo de tecnologia da ferramenta (pergunta 2.3.4).')}{' '}
          <a href={href.tela('tipoTec')}>{t('Ir à pergunta')}</a>
        </Alert>
      )}
      {p.recs.length ? (
        <section className="pc-plano-sec">
          <h2 className="pc-plano-h2">{t('Comece por estas')}</h2>
          <div className="pc-recs">{p.recs.slice(0, 3).map((r, i) => <Rec key={r.id} r={r} n={i + 1} />)}</div>
          <a href={href.plano('fazer')}>{t('Ver todas as {n} recomendações, por momento', { n: p.recs.length })}</a>
        </section>
      ) : null}
    </>
  );
}

function Fazer({ p }: { p: Painel }) {
  if (!p.recs.length) return <Alert kind="info" title={t('Ainda não há respostas suficientes para recomendar ações.')} />;
  let i = 0;
  return (
    <>
      <h1 className="pc-plano-titulo">{t('O que fazer')}</h1>
      <p className="pc-lead">{t('Ações geradas a partir das respostas deste caso, por momento e prioridade. Cada ação mostra a pergunta que a originou: se mudar a resposta, a lista muda.')}</p>
      {(QUANDO_REC as any[]).map(([q, rot]) => {
        const lista = p.recs.filter((r) => r.quando === q);
        if (!lista.length) return null;
        return (
          <section key={q} className="pc-plano-sec">
            <h2 className="pc-plano-h2">{String(tr(rot))} <span className="pc-contagem">· {lista.length}</span></h2>
            <div className="pc-recs">{lista.map((r) => <Rec key={r.id} r={r} n={++i} />)}</div>
          </section>
        );
      })}
    </>
  );
}

function Faltam({ s }: { s: CasoStore }) {
  const faltam = faltamDe(s);
  if (!faltam.length) return <Alert kind="info" title={t('Todas as perguntas do Essencial estão respondidas.')} />;
  return (
    <>
      <h1 className="pc-plano-titulo">{t('Respostas que faltam')}</h1>
      <p className="pc-lead">{t('Enquanto uma pergunta não é respondida, o plano usa a premissa padrão ou a sugestão. Nada impede baixar o plano; estas são as respostas que mais o deixariam fiel à sua rede.')}</p>
      <ol className="pc-faltam">
        {faltam.map((tela) => (
          <li key={tela.id}>
            <a href={href.pergunta(tela.capitulo, tela.id)}>{tela.n.join(' e ')} · {t(CURTO[tela.id] || tela.id)}</a>
            <span className="pc-nota"> · {t(CAPITULOS_INFO[tela.capitulo].titulo)}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

export function Plano({ pagina }: { pagina: Pagina }) {
  const s = useCaso();
  const p = usePainel(s);
  const itens: PlanIndexItem[] = [
    { id: 'resumo', label: t('Em resumo'), href: href.plano('resumo'), active: pagina === 'resumo' },
    { id: 'custa', label: t('Quanto custa'), href: href.plano('resumo'), dim: true },
    { id: 'fazer', label: t('O que fazer'), href: href.plano('fazer'), count: p.recs.length || undefined, active: pagina === 'fazer' },
    { id: 'exigir', label: t('O que exigir'), href: href.plano('resumo'), dim: true },
  ];
  const secundarios: PlanIndexItem[] = [
    { id: 'faltam', label: t('Respostas que faltam'), href: href.plano('faltam'), count: p.faltam || undefined, active: pagina === 'faltam' },
  ];
  const voltar = faltamDe(s)[0];
  return (
    <Shell nav={false} plano={false} contexto={t('Plano de contratação')}>
      <div className="pc-plano-pagina">
        <PlanIndex
          zoneLabel={t('Neste plano')}
          items={itens}
          secondary={secundarios}
          note={t('Quanto custa e O que exigir chegam na próxima versão, com o PDF.')}
        />
        <div className="pc-plano-conteudo">
          <div className="pc-botoes pc-plano-acoes">
            <Button variant="secondary" size="sm" href={voltar ? href.pergunta(voltar.capitulo, voltar.id) : href.abertura(1)}>
              {voltar ? t('Voltar às perguntas · {n} faltam', { n: p.faltam }) : t('Rever as respostas')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => baixarArquivo(nomeArqCaso(s.estado()), textoCaso(s.estado()))}>{t('Exportar caso')}</Button>
          </div>
          {pagina === 'resumo' ? <Resumo s={s} p={p} /> : pagina === 'fazer' ? <Fazer p={p} /> : <Faltam s={s} />}
          <Rodape />
        </div>
      </div>
    </Shell>
  );
}
