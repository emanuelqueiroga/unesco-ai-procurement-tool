// "Seu plano": o painel à direita (≥ 1100 px) e a gaveta do celular, projetados do store a cada resposta.
// Só um item em âmbar por vez: o primeiro KPI que mudou; se nenhum mudou, a primeira recomendação nova.
// PB-06: sob os números, a mesma recomendação do policy brief e de "Em resumo" (plano/brief.js).
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CasoStore } from '../store';
import { PlanPanel, PlanDrawer, SourceTag, Button, useMediaQuery, BREAKPOINTS, type PanelKpi } from '../ui';
import { painelDe, type Painel } from '../percurso/painel';
import { href, ir } from '../percurso/rota';
import { t, plural } from '../percurso/textos';
import { useRecomendacao } from './brief';
import './plano-brief.css';

export function usePainel(s: CasoStore): Painel {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => painelDe(s), [s.caso, s.ctx, s.resp, s.origem, s.custo, s.moeda, s.exemplo, s.lang]);
}

export interface Novidade { kpi?: string; rec?: string; texto?: string; em: number }

export function useNovidade(p: Painel, recenteEm: number | undefined): Novidade | null {
  const ant = useRef<Painel | null>(null);
  const [nov, setNov] = useState<Novidade | null>(null);
  useEffect(() => {
    const antes = ant.current;
    ant.current = p;
    if (!antes || !recenteEm) return;
    const kpi = p.kpis.find((k, i) => k.value !== undefined && k.value !== antes.kpis[i]?.value);
    const ids = new Set(antes.recs.map((r) => r.id));
    const rec = kpi ? undefined : p.recs.find((r) => !ids.has(r.id));
    if (!kpi && !rec) return;
    const texto = kpi ? (antes.kpis.find((k) => k.id === kpi.id)?.value ? t('número atualizado') : t('1 número novo')) : t('1 recomendação nova');
    setNov({ kpi: kpi?.id, rec: rec?.id, texto, em: recenteEm });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p]);
  useEffect(() => {
    if (!nov) return;
    const id = window.setTimeout(() => setNov(null), 4000);
    return () => window.clearTimeout(id);
  }, [nov]);
  return nov;
}

function Conteudo({ p, nov, fluid, soPapel, rec }: { p: Painel; nov: Novidade | null; fluid?: boolean; soPapel?: boolean; rec?: string }) {
  // decisão 3 (0.0.15): o custo por pessoa diz o denominador; US$ 12,77 é por usuário ativo, o mesmo nome do plano e do PDF
  const kpis: PanelKpi[] = p.kpis.map((k) => ({ id: k.id, label: k.id === 'kpi.porAluno' ? t('Por usuário ativo por ano') : k.label, value: k.value, fullValue: k.fullValue, fresh: nov?.kpi === k.id }));
  const padrao = p.kpis.some((k) => k.value && k.origem === 'padrao');
  const linhaOrigem = p.temNumeros ? (
    <>
      <SourceTag origin={padrao ? 'padrao' : 'informado'} label={padrao ? t('estimativa com premissas padrão') : t('estimativa com as suas respostas')} />
      {p.premissas ? ' · ' + plural(p.premissas, '{n} resposta a confirmar', '{n} respostas a confirmar') : ''}
    </>
  ) : p.respondidas ? (
    p.paraNumero && p.paraNumero.some((f) => f.obrigatoria) ? (
      <>
        {t('Para ver os números, falta responder:')}{' '}
        {p.paraNumero.filter((f) => f.obrigatoria).map((f, i) => <span key={f.campo}>{i ? ' · ' : ''}<a href={f.href}>{f.n} {f.label}</a></span>)}
      </>
    ) : t('Os números aparecem quando você disser o tipo de tecnologia (pergunta 2.3.4).')
  ) : null;
  // a recomendação do policy brief, a mesma de "Em resumo" (PB-06)
  const recNo = rec && p.estado !== 'empty' ? <span className="pc-vivo-rec" data-recomendacao><b className="pc-vivo-rec-rot">{t('Recomendação')}</b> {rec}</span> : null;
  return (
    <PlanPanel
      fluid={fluid}
      paperOnly={soPapel}
      state={p.estado}
      stateLabels={{ empty: t('Seu plano · em branco'), writing: t('Seu plano · escrevendo'), complete: t('Seu plano · completo') }}
      openHref={href.plano()}
      kicker={t('Plano de contratação')}
      title={p.titulo || undefined}
      facts={p.fatos || undefined}
      emptyTitle={t('Rede: ———')}
      emptyFacts={t('Problema: ——— · Teste: ———')}
      emptyMessage={t('A primeira resposta escreve a primeira linha.')}
      summaryTitle={t('Em resumo')}
      kpis={kpis}
      originLine={linhaOrigem || recNo ? <>{linhaOrigem}{recNo}</> : undefined}
      recommendationsTitle={t('Comece por estas')}
      // R6: os 3 primeiros cartões de "Comece por estas" (seleção de 4.3), os mesmos de "Em resumo"
      recommendations={(p.cartoes.length ? p.cartoes : p.recs).slice(0, 3).map((r) => ({ id: r.id, text: r.texto, fresh: nov?.rec === r.id }))}
      recommendationsCount={p.recs.length}
      sections={[
        { id: 'custa', title: t('Quanto custa'), note: p.temNumeros ? plural(p.camadas.filter((c) => c.valor > 0).length, '{n} camada com custo', '{n} camadas com custo') : undefined },
        { id: 'fazer', title: t('O que fazer'), note: p.recs.length ? (p.nPacotes ? t('{n} ações em {g} pacotes', { n: p.recs.length, g: p.nPacotes }) : plural(p.recs.length, '{n} recomendação', '{n} recomendações')) : undefined },
        { id: 'exigir', title: t('O que exigir') },
      ]}
      footer={p.estado !== 'empty' ? <Button variant="secondary" size="sm" href={href.plano()}>{t('Abrir o plano inteiro')}</Button> : undefined}
    />
  );
}

/** Painel à direita, ou gaveta abaixo de 1100 px. */
export function PlanoVivo({ s, forcarGaveta }: { s: CasoStore; forcarGaveta?: boolean }) {
  const p = usePainel(s);
  const nov = useNovidade(p, s.recente?.em);
  const rec = useRecomendacao(s);
  const gaveta = useMediaQuery(BREAKPOINTS.drawer) || !!forcarGaveta;
  const [aberta, setAberta] = useState(false);
  if (!gaveta) return <aside className="pc-plano" aria-label={t('Seu plano')}><Conteudo p={p} nov={nov} fluid rec={rec} /></aside>;
  const kpiVisivel = p.kpis.find((k) => k.id === nov?.kpi) || p.kpis.find((k) => k.value);
  const resumo = [
    p.recs.length ? plural(p.recs.length, '{n} recomendação', '{n} recomendações') : '',
    p.faltam ? plural(p.faltam, '{n} lacuna', '{n} lacunas') : t('completo'),
  ].filter(Boolean).join(' · ');
  return (
    <PlanDrawer
      open={aberta}
      onOpenChange={setAberta}
      zoneLabel={t('Seu plano')}
      highlight={nov?.texto}
      summary={resumo}
      kpi={kpiVisivel?.value}
      closeLabel={t('Fechar')}
      openLabel={t('Abrir o seu plano')}
    >
      <Conteudo p={p} nov={nov} fluid soPapel rec={rec} />
      <div className="pc-gaveta-acoes">
        <Button href={href.plano()} onClick={() => { setAberta(false); ir(href.plano()); }}>{t('Abrir o plano inteiro')}</Button>
      </div>
    </PlanDrawer>
  );
}

