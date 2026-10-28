// Calculadora do modo Refinar (#/refinar/:aba[/:foco]), CUS-01: três abas (Premissas por ano; Ferramentas e
// licenças; Cenários e sensibilidade), com moeda e taxa (CUS-07/08), base de premissas (CUS-11), "Refazer a partir
// das respostas" e o aviso de edições pendentes (CUS-10), CSV de custos (CUS-22), os números-chave que mudam a cada
// edição e o texto "Como ler" (CUS-28). O foco (#/refinar/premissas/demanda.adocao) rola até o campo e o destaca;
// é o destino de "Ajustar premissas" no "de onde vem?" do plano (CUS-02).
import { useEffect, useMemo } from 'react';
import { useCaso, calcDe, cfgDe, casoEfetivoDe, perfilDe } from '../store';
import { PRESETS, NIVEL_NOME, adaptacaoAno0, arquitetura, opcoes, din, grande, LOC } from '../domain';
import { Alert, Button, KpiTile, Segmented, SourceTag, type Origin } from '../ui';
import { sincronizar } from '../percurso/ambiente';
import { href, ir, type AbaRefinar } from '../percurso/rota';
import { origemKpi, rotuloOpc } from '../percurso/painel';
import { t } from '../percurso/textos';
import { slugCaso } from '../export/json';
import { Shell, Rodape } from './Shell';
import { baixarArquivo } from './CasoDialog';
import { confirmar } from './Confirmar';
import { SeletorMoeda } from './refinar/SeletorMoeda';
import { AbaPremissas, PremissasEntrada } from './refinar/Premissas';
import { AbaFerramentas } from './refinar/Ferramentas';
import { AbaCenarios } from './refinar/Cenarios';
import { abaDoFoco, candidatosFoco, cfgPronta, csvCustosMoeda, focoNormal, resultados, type Resultados } from './refinar/calc';
import './refinar.css';

const ABAS: { id: AbaRefinar; rotulo: () => string }[] = [
  { id: 'premissas', rotulo: () => t('Premissas por ano') },
  { id: 'ferramentas', rotulo: () => t('Ferramentas e licenças') },
  { id: 'cenarios', rotulo: () => t('Cenários e sensibilidade') },
];
/** focos que só existem no modo avançado */
const FOCO_AVANCADO = ['opc.r', 'opc.delta', 'opc.sigmaCap', 'opc.pSaida', 'opc.vidaUtil', 'opc.fechamento', 'opc.doados', 'avancado', 'avancado-analises', 'cae', 'lmdi', 'laspeyres', 'alternativas', 'equidade'];
const ARQ_NOME: Record<string, string> = { saas: 'SaaS', api: 'API + RAG', ow: 'pesos abertos' };

/** o link antigo "detalhar por ano" (#/refinar/rede) abre a demanda por ano */
function focoDaRota(foco?: string): string | undefined {
  if (foco) return foco;
  if (typeof window !== 'undefined' && /^#\/refinar\/rede\b/.test(window.location.hash)) return 'demanda.E';
  return undefined;
}

export function Refinar({ aba, foco: focoRota }: { aba: AbaRefinar; foco?: string }) {
  const s = useCaso();
  sincronizar(s);
  const calc = calcDe(s.custo);
  const foco = focoDaRota(focoRota);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cfg = useMemo(() => cfgDe(s), [s.custo.cfg, s.custo.base, s.custo.editado, s.caso, s.ctx, s.resp, s.respC]);
  const res = useMemo(() => resultados(cfg), [cfg]);
  const base = useMemo(() => { const c = cfgPronta(cfg); return { cfg: c, H: opcoes(c).H }; }, [cfg]);

  useEffect(() => {
    const destino = abaDoFoco(foco);
    if (destino && destino !== aba) { ir(href.refinar(destino, foco)); return; }
    const ids = candidatosFoco(foco);
    if (!ids.length) return;
    const f = focoNormal(foco) || '';
    if (FOCO_AVANCADO.includes(f) && !calcDe(useCaso.getState().custo).avancado) useCaso.getState().setCalc({ avancado: true });
    let vivo = true;
    const tentar = (n: number) => {
      if (!vivo) return;
      const el = ids.map((id) => document.getElementById(id)).find(Boolean) as HTMLElement | undefined;
      if (!el) { if (n < 5) requestAnimationFrame(() => tentar(n + 1)); return; }
      el.scrollIntoView({ block: 'center' });
      el.classList.add('rf-foco');
      const campo = el.matches('input, select, button') ? el : el.querySelector<HTMLElement>('input, select, button');
      if (campo) campo.focus({ preventScroll: true });
      setTimeout(() => el.classList.remove('rf-foco'), 2600);
    };
    requestAnimationFrame(() => requestAnimationFrame(() => tentar(0)));
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba, foco]);

  const refazer = async () => {
    if (calc.editado && !(await confirmar({
      titulo: t('Refazer a partir das respostas?'),
      texto: t('As premissas editadas na calculadora serão descartadas e montadas de novo a partir das respostas do caso.'),
      ok: t('Refazer a partir das respostas'),
    }))) return;
    s.refazerCfg();
  };
  const trocarBase = async (b: string) => {
    if (b === calc.base) return;
    if (calc.editado && !(await confirmar({
      titulo: t('Trocar a base de premissas?'),
      texto: t('As premissas editadas na calculadora serão descartadas.'),
      ok: t('Trocar a base'),
    }))) return;
    s.setBaseCusto(b);
  };
  const baixarCsv = () => baixarArquivo('costs-' + slugCaso(s) + '.csv', csvCustosMoeda(cfg), 'text/csv');

  return (
    <Shell nav={false} contexto={t('Refinar')}>
      <div className="rf" data-lang={s.lang}>
        <div className="rf-topo">
          <a className="rf-voltar" href={href.plano('custa')}><span aria-hidden="true" className="pc-seta-voltar">← </span>{t('Voltar ao plano')}</a>
          <p className="pc-kicker">{t('Modo Refinar')}</p>
          <h1 className="pc-plano-titulo" data-foco-inicial>{t('Custo total e orçamento')}</h1>
          <p className="rf-lead">{t('O custo é montado como uma árvore: insumos (quantidade × preço) somam subcomponentes, que somam seis componentes, que somam o custo total do ciclo de vida. A mesma árvore gera duas contas: a econômica, que mostra quanto a decisão consome de recursos, e a orçamentária, que mostra quanto pedir em cada exercício.')}</p>
        </div>

        <nav className="rf-abas" aria-label={t('Abas da calculadora')}>
          {ABAS.map((a) => (
            <a key={a.id} className="rf-aba" href={href.refinar(a.id)} aria-current={a.id === aba ? 'page' : undefined}>{a.rotulo()}</a>
          ))}
        </nav>

        {calc.pendente ? (
          <div id="rf-pendente">
            <Alert kind="atencao" title={t('Uma resposta que alimenta o custo mudou')}>
              <p>{t('As premissas que você editou na calculadora foram mantidas e ainda não refletem a resposta nova. Mantenha as edições ou refaça as premissas a partir das respostas.')}</p>
              <div className="rf-botoes">
                <Button variant="secondary" onClick={() => s.manterEdicoesCfg()}>{t('Manter edições')}</Button>
                <Button onClick={() => s.refazerCfg()}>{t('Refazer a partir das respostas')}</Button>
              </div>
            </Alert>
          </div>
        ) : null}

        <section className="rf-painel" aria-label={t('Moeda e base de premissas')}>
          <SeletorMoeda />
          <div className="rf-base" id="rf-base">
            <span className="rf-rotulo" id="rf-base-rotulo">{t('Base de premissas')}</span>
            <Segmented
              label={t('Base de premissas')}
              value={calc.base}
              onChange={(b) => { void trocarBase(b); }}
              options={[{ value: 'caso', label: t('Seu caso') }, { value: 'A', label: t('Exemplo A') }, { value: 'B', label: t('Exemplo B') }, { value: 'C', label: t('Exemplo C') }]}
            />
            <OrigemPremissas cfg={base.cfg} />
          </div>
          <div className="rf-botoes">
            {calc.base === 'caso' ? <Button variant="secondary" onClick={() => { void refazer(); }}>{t('Refazer a partir das respostas')}</Button> : null}
            <Button variant="secondary" onClick={baixarCsv} disabled={!res.ok}>{t('Baixar custos em CSV')}</Button>
            <label className="rf-check">
              <input type="checkbox" checked={calc.avancado} onChange={(e) => s.setCalc({ avancado: e.target.checked })} />
              <span>{t('Modo avançado')}</span>
            </label>
          </div>
        </section>

        {res.ok ? <Numeros res={res} /> : (
          <Alert kind="bloqueio" title={t('Não foi possível calcular com estas premissas.')}>
            <p>{t('Verifique campos vazios ou zerados.')}</p>
          </Alert>
        )}

        <div className="rf-conteudo">
          {aba === 'premissas' ? (res.ok ? <AbaPremissas res={res} /> : <PremissasEntrada res={base} />) : null}
          {aba === 'ferramentas' ? <AbaFerramentas res={res.ok ? res : base} /> : null}
          {aba === 'cenarios' ? (res.ok ? <AbaCenarios res={res} /> : null) : null}
        </div>

        <ComoLer />
        <div className="rf-botoes rf-fim">
          <Button variant="secondary" href={href.plano('custa')}>{t('Voltar ao plano')}</Button>
        </div>
        <Rodape />
      </div>
    </Shell>
  );
}

/** "Premissas montadas a partir do seu caso…" ou "Exemplo do Capítulo 12 do guia" (CUS-11) */
function OrigemPremissas({ cfg }: { cfg: any }) {
  const s = useCaso();
  if (s.custo.base !== 'caso') {
    const p: any = (PRESETS as any)[s.custo.base];
    return <p className="rf-nota">{t('Exemplo do Capítulo 12 do guia.')} {p ? t(p.nome) + '.' : ''}</p>;
  }
  const ce: any = casoEfetivoDe(s);
  const pf: any = perfilDe(s);
  const arq = arquitetura(cfg);
  const nivel = String(t((NIVEL_NOME as any)[pf.agregado] || '')).toLocaleLowerCase();
  const eleg = Math.round(+ce.elegiveis || 0).toLocaleString(String(LOC()));
  return (
    <p className="rf-nota">
      {t('Premissas montadas a partir do seu caso:')} {t('arquitetura')} {t(ARQ_NOME[arq] || arq)}, {t('{n} elegíveis', { n: eleg })}, {t('governança para perfil')} {nivel}.{' '}
      {t('Os demais valores vêm do Exemplo {x} do guia e precisam ser substituídos por cotações e dados locais.', { x: cfg.origem || 'A' })}
      {ce.__arqPresumida ? ' ' + t('Como a arquitetura não foi definida, o modelo usa SaaS como ponto de partida.') : ''}
    </p>
  );
}

/** os números-chave da calculadora, que mudam a cada edição, com a etiqueta de origem (CUS-06) e a linha de adaptação (CUS-23) */
function Numeros({ res }: { res: Resultados }) {
  const s = useCaso();
  const { av, ind, dotTotal, H } = res;
  const origem: Origin = s.custo.editado ? 'refinado' : s.custo.base !== 'caso' ? 'padrao' : origemKpi(s, 'kpi.total');
  const tag = <SourceTag origin={origem} label={t(({ padrao: 'padrão', sugerido: '~ sugerido', informado: 'informado', refinado: 'refinado' } as Record<Origin, string>)[origem])} />;
  const adapt = adaptacaoAno0(av);
  const nivel = s.caso.adaptacao ? rotuloOpc('adaptacao', String(s.caso.adaptacao)) : '';
  return (
    <section className="rf-numeros" aria-label={t('Números-chave')} aria-live="polite">
      <div className="rf-kpis">
        <KpiTile label={t('Custo total do ciclo de vida (conta econômica)')} value={grande(av.ctEco)} fullValue={din(av.ctEco, 0)} origin={tag} />
        <KpiTile label={t('Dotação total nos {n} exercícios (conta orçamentária)', { n: H + 1 })} value={grande(dotTotal)} fullValue={din(dotTotal, 0)} origin={tag} />
        <KpiTile label={t('Por usuário ativo por ano')} value={din(ind.icu, 2)} origin={tag} />
        <KpiTile label={t('Custo de sair, em anos de custo recorrente')} value={t('{n} ano(s)', { n: (+ind.anosParaSair || 0).toLocaleString(String(LOC()), { maximumFractionDigits: 1 }) })} origin={tag} />
      </div>
      {adapt > 0 ? (
        <p className="rf-nota" id="rf-adaptacao-ano0">
          {t('Adaptação (K3.1 + K3.2), Ano 0')}: <b>{din(adapt, 0)}</b>{nivel ? ' · ' + t('nível escolhido') + ': ' + nivel : ''}
        </p>
      ) : null}
    </section>
  );
}

function ComoLer() {
  return (
    <section className="rf-bloco rf-comoler" id="rf-comoler" aria-labelledby="rf-h-comoler">
      <h2 className="rf-bloco-h" id="rf-h-comoler">{t('Como ler e o que ainda depende de dados locais')}</h2>
      <ul className="rf-lista">
        <li><b>{t('Duas contas.')}</b> {t('A econômica soma desembolso, capacidade interna e insumos cedidos, em preços constantes do Ano 0. A orçamentária soma só o desembolso, em preços correntes de cada exercício, com reservas. A identidade custo econômico = desembolso + capacidade + cedidos é verificada pelo modelo.')}</li>
        <li><b>{t('Índices.')}</b> {t('O índice de custo unitário (custo por usuário ativo por ano) se decompõe exatamente nos índices dos componentes e subcomponentes, porque todos usam o mesmo denominador. Razões com denominadores diferentes (% em moeda estrangeira, anos para sair) não se somam.')}</li>
        <li><b>{t('Premissas ilustrativas.')}</b> {t('Salários, custo-hora, inflação, valores de implantação, faixas de incerteza e governança por nível de risco são convenções do guia. Substitua por dados e cotações locais.')}</li>
        <li><b>{t('Benefícios fora do custo.')}</b> {t('Capacidade liberada tem valor, mas não reduz o orçamento. Compare alternativas pela razão custo-efetividade ou pelo efeito mínimo (modo avançado).')}</li>
      </ul>
    </section>
  );
}
