// Plano de contratação: Em resumo, Quanto custa, O que fazer, O que exigir e Apêndice (D8–D11, M4), com o
// relatório em PDF e o caso em JSON. As seções vêm de src/plano/secoes.js (porte de src/resumo.js da v13).
import { useMemo, useState } from 'react';
import { CAMADAS, QUANDO_REC, getLang, tr } from '../domain';
import { useCaso, faltamDe, type CasoStore, type Estado14 } from '../store';
import { PlanIndex, KpiTile, LayerBars, Recommendation, SourceTag, Alert, Button, type PlanIndexItem } from '../ui';
import { Shell, Rodape } from './Shell';
import { usePainel } from './PlanoVivo';
import { baixarArquivo } from './CasoDialog';
import { Secao, type SecaoPlano } from './Secao';
import { textoCaso, nomeArqCaso } from '../export/json';
import { fmt, sincronizar } from '../percurso/ambiente';
import { VERSAO } from '../percurso/canal';
import { CURTO, CAPITULOS_INFO, t, plural, minusc } from '../percurso/textos';
import { href, type PaginaPlano } from '../percurso/rota';
import type { Painel, RecPlano } from '../percurso/painel';
import { secoesPlano, trSecao, painelPlano } from '../plano/secoes.js';
import figuraTCO from '../../../assets/fig1_tco.jpg';

const rotuloOrigem = (o: string) => ({ padrao: t('padrão'), sugerido: t('~ sugerido'), informado: t('informado'), refinado: t('refinado') } as Record<string, string>)[o] || o;
const nomeCamada = (n: number) => String(tr(((CAMADAS as any[]).find((c) => c[0] === n) || [n, ''])[1]));

/** Gera o PDF (jsPDF carregado sob demanda) e entrega o arquivo. */
export async function baixarPDF(e: Estado14): Promise<void> {
  sincronizar(e);
  const m: any = await import('../plano/pdf.js');
  const recursos = await m.recursosPDF();
  const doc = await m.gerarPDF(e, { versao: VERSAO, lang: getLang(), ...recursos });
  baixarArquivo(m.nomeArqPDF(e), doc.output('blob'));
}

export function BotaoPDF({ s, variante = 'primary', tamanho = 'sm' }: { s: CasoStore; variante?: 'primary' | 'secondary'; tamanho?: 'sm' | 'md' }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState('');
  const faltam = faltamDe(s).length;
  return (
    <>
      <Button
        variant={variante}
        size={tamanho}
        disabled={gerando}
        aria-busy={gerando || undefined}
        onClick={async () => {
          setGerando(true); setErro('');
          try { await baixarPDF(s.estado()); } catch (err) { console.error(err); setErro(t('Não foi possível gerar o PDF. Tente de novo; se continuar, exporte o caso e avise a equipe.')); }
          finally { setGerando(false); }
        }}
      >
        {gerando ? t('Gerando o PDF…') : faltam ? t('Baixar o plano em PDF · {n} lacunas', { n: faltam }) : t('Baixar o plano em PDF')}
      </Button>
      {erro ? <span className="pc-erro" role="alert">{erro}</span> : null}
    </>
  );
}

function Rec({ r, n }: { r: RecPlano; n?: number }) {
  return (
    <Recommendation
      n={n}
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

function BarrasCamadas({ p }: { p: Painel }) {
  const total = p.camadas.reduce((a, c) => a + c.valor, 0);
  if (!(total > 0)) return null;
  const maior = [...p.camadas].sort((a, b) => b.valor - a.valor)[0];
  return (
    <LayerBars
      title={t('Custo por camada, {H} anos', { H: p.H })}
      items={p.camadas.filter((c) => c.valor > 0).map((c) => ({ layer: c.layer, label: nomeCamada(c.layer), value: c.valor, display: fmt.curto(c.valor) }))}
      conclusion={t('A maior parte do custo está em {c} ({pct} do total).', { c: minusc(nomeCamada(maior.layer)), pct: Math.round((100 * maior.valor) / total) + '%' })}
      caption={t('Sete camadas de Krueger e Jackson (2026). Custo econômico em valores constantes.')}
    />
  );
}

function Resumo({ s, p, secs, principal }: { s: CasoStore; p: Painel; secs: SecaoPlano[]; principal: string }) {
  const resumo = secs.find((x) => x.id === 'resumo' && !x.sub);
  return (
    <>
      <header className="pc-plano-capa">
        <p className="pc-kicker">{p.premissas ? t('Plano de contratação · estimativa com {n} respostas a confirmar', { n: p.premissas }) : t('Plano de contratação')}</p>
        <h1 className="pc-plano-titulo">{p.titulo || t('Caso sem nome')}</h1>
        {p.fatos ? <p className="pc-plano-fatos">{p.fatos}</p> : null}
        {s.exemplo !== 'novo' ? <p className="pc-nota">{t('Exemplo ilustrativo: as respostas não são de uma rede real.')}</p> : null}
      </header>
      {principal ? (
        <div className="pc-callout"><span className="pc-callout-rotulo">{t('Recomendação principal')}</span><span>{principal}</span></div>
      ) : null}
      {p.faltam ? (
        <Alert kind="info" title={plural(p.faltam, 'Plano parcial: 1 pergunta essencial sem resposta.', 'Plano parcial: {n} perguntas essenciais sem resposta.')}>
          {t('O plano já pode ser usado; o que depende dessas respostas usa premissas padrão.')} <a href={href.plano('faltam')}>{t('Ver o que falta')}</a>
        </Alert>
      ) : null}
      {p.temNumeros ? (
        <>
          <div className="pc-kpis">
            {p.kpis.map((k) => <KpiTile key={k.id} label={k.label} value={k.value} fullValue={k.fullValue} origin={<SourceTag origin={k.origem} label={rotuloOrigem(k.origem)} />} />)}
          </div>
          <BarrasCamadas p={p} />
        </>
      ) : (
        <Alert kind="info" title={t('Ainda sem números')}>
          {t('Os números do plano aparecem quando você disser o tipo de tecnologia da ferramenta (pergunta 2.3.4).')} <a href={href.tela('tipoTec')}>{t('Ir à pergunta')}</a>
        </Alert>
      )}
      {p.recs.length ? (
        <section className="pc-plano-sec">
          <h2 className="pc-plano-h2">{t('Comece por estas')}</h2>
          <div className="pc-recs">{p.recs.slice(0, 3).map((r, i) => <Rec key={r.id} r={r} n={i + 1} />)}</div>
          <a href={href.plano('fazer')}>{t('Ver todas as {n} recomendações, por momento', { n: p.recs.length })}</a>
        </section>
      ) : null}
      {resumo ? <Secao s={{ ...resumo, cartoes: undefined, tipo: undefined }} /> : null}
    </>
  );
}

function Fazer({ p, secs }: { p: Painel; secs: SecaoPlano[] }) {
  let i = 0;
  return (
    <>
      <h1 className="pc-plano-titulo">{t('O que fazer')}</h1>
      <p className="pc-lead">{t('Ações geradas a partir das respostas deste caso, por momento e prioridade. Cada ação mostra a pergunta que a originou: se mudar a resposta, a lista muda.')}</p>
      {!p.recs.length ? <Alert kind="info" title={t('Ainda não há respostas suficientes para recomendar ações.')} /> : null}
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
      {secs.filter((x) => x.pagina === 'fazer' && x.id !== 'recs').map((x, j) => <Secao key={j} s={x} />)}
    </>
  );
}

function Pagina({ titulo, intro, secs, pagina, antes }: { titulo: string; intro?: string; secs: SecaoPlano[]; pagina: string; antes?: React.ReactNode }) {
  return (
    <>
      <h1 className="pc-plano-titulo">{titulo}</h1>
      {intro ? <p className="pc-lead">{intro}</p> : null}
      {antes}
      {secs.filter((x) => x.pagina === pagina && x.id !== 'faltas').map((x, j) => <Secao key={j} s={x} />)}
    </>
  );
}

function Faltam({ s }: { s: CasoStore }) {
  const faltam = faltamDe(s);
  return (
    <section className="pc-plano-sec" id="faltam">
      <h2 className="pc-plano-h2">{t('Respostas que faltam')}</h2>
      {!faltam.length ? <p className="pc-nota">{t('Todas as perguntas do Essencial estão respondidas.')}</p> : (
        <>
          <p className="pc-nota">{t('Enquanto uma pergunta não é respondida, o plano usa a premissa padrão ou a sugestão. Nada impede baixar o plano; estas são as respostas que mais o deixariam fiel à sua rede.')}</p>
          <ol className="pc-faltam">
            {faltam.map((tela) => (
              <li key={tela.id}>
                <a href={href.pergunta(tela.capitulo, tela.id)}>{tela.n.join(' e ')} · {t(CURTO[tela.id] || tela.id)}</a>
                <span className="pc-nota"> · {t(CAPITULOS_INFO[tela.capitulo].titulo)}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

export function Plano({ pagina }: { pagina: PaginaPlano }) {
  const s = useCaso();
  const p = usePainel(s);
  const { secs, principal } = useMemo(() => {
    sincronizar(s);
    const brutas = secoesPlano(s, { figura: figuraTCO });
    const secs = (brutas as any[]).map((x) => trSecao(x)) as SecaoPlano[];
    let principal = '';
    try { principal = String((painelPlano(s, secs as any) as any).principal || ''); } catch (e) { principal = ''; }
    return { secs, principal: principal || (p.recs.find((r) => r.prioridade === 'alta') || p.recs[0] || { texto: '' }).texto };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.caso, s.ctx, s.resp, s.origem, s.custo, s.moeda, s.exemplo, s.lang, p]);
  const conta = (pg: string) => secs.filter((x) => x.pagina === pg && !x.sub && x.tipo !== 'bloco').length;
  const itens: PlanIndexItem[] = [
    { id: 'resumo', label: t('Em resumo'), href: href.plano('resumo'), active: pagina === 'resumo' },
    { id: 'custa', label: t('Quanto custa'), href: href.plano('custa'), active: pagina === 'custa', count: conta('custa') || undefined },
    { id: 'fazer', label: t('O que fazer'), href: href.plano('fazer'), count: p.recs.length || undefined, active: pagina === 'fazer' },
    { id: 'exigir', label: t('O que exigir'), href: href.plano('exigir'), active: pagina === 'exigir', count: conta('exigir') || undefined },
  ];
  const secundarios: PlanIndexItem[] = [
    { id: 'apendice', label: t('Apêndice'), href: href.plano('apendice'), active: pagina === 'apendice' },
    { id: 'faltam', label: t('Respostas que faltam'), href: href.plano('faltam'), count: p.faltam || undefined, active: pagina === 'faltam' },
  ];
  const voltar = faltamDe(s)[0];
  return (
    <Shell nav={false} plano={false} contexto={t('Plano de contratação')}>
      <div className="pc-plano-pagina">
        <PlanIndex zoneLabel={t('Neste plano')} items={itens} secondary={secundarios} note={<BotaoPDF s={s} variante="secondary" />} />
        <div className="pc-plano-conteudo">
          <div className="pc-botoes pc-plano-acoes">
            <Button variant="secondary" size="sm" href={voltar ? href.pergunta(voltar.capitulo, voltar.id) : href.abertura(1)}>
              {voltar ? t('Voltar às perguntas · {n} faltam', { n: p.faltam }) : t('Rever as respostas')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => baixarArquivo(nomeArqCaso(s.estado()), textoCaso(s.estado()))}>{t('Exportar caso')}</Button>
            <BotaoPDF s={s} />
          </div>
          {pagina === 'resumo' ? <Resumo s={s} p={p} secs={secs} principal={principal} />
            : pagina === 'fazer' ? <Fazer p={p} secs={secs} />
              : pagina === 'custa' ? <Pagina titulo={t('Quanto custa')} secs={secs} pagina="custa" antes={p.temNumeros ? <BarrasCamadas p={p} /> : null} />
                : pagina === 'exigir' ? <Pagina titulo={t('O que exigir')} intro={t('O que pedir na contratação: o arranjo de aquisição, as cláusulas de custo, dados e saída, a diligência proporcional ao risco e os documentos do dossiê.')} secs={secs} pagina="exigir" />
                  : pagina === 'apendice' ? <><Pagina titulo={t('Apêndice')} secs={secs} pagina="apendice" /><Faltam s={s} /></>
                    : <><h1 className="pc-plano-titulo">{t('Respostas que faltam')}</h1><Faltam s={s} /></>}
          <nav className="pc-plano-proxima" aria-label={t('Páginas do plano')}>
            {(['resumo', 'custa', 'fazer', 'exigir', 'apendice'] as const).filter((x) => x !== pagina).map((x) => (
              <a key={x} href={href.plano(x)}>{t(({ resumo: 'Em resumo', custa: 'Quanto custa', fazer: 'O que fazer', exigir: 'O que exigir', apendice: 'Apêndice' } as const)[x])}</a>
            ))}
          </nav>
          <Rodape />
        </div>
      </div>
    </Shell>
  );
}
