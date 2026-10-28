// Aba 3 — Cenários e sensibilidade: os 7 indicadores e o índice de custo unitário por componente (CUS-18),
// cenários Esperado / Alta adoção / Estresse (CUS-14), tornado (CUS-15) com as faixas editáveis (CUS-16),
// Monte Carlo sob demanda (CUS-17) e, no modo avançado, custo anual equivalente, LMDI, Laspeyres (CUS-25),
// comparação de alternativas e equidade por estrato (CUS-24).
import { useMemo, useState } from 'react';
import { useCaso, calcDe, fonteMotor, type AlternativaCusto, type EstratoCusto } from '../../store';
import {
  ARVORE, NOME_K, cenarios, tornado, direcionadores, simular, cae, lmdi, laspeyres, comparar, equidade, arquitetura,
  din, mil, pct, unidMil, LOC,
} from '../../domain';
import { Button, DataTable, KpiTile, Segmented, TextField, type DataColumn, type DataRow } from '../../ui';
import { CampoNumero } from '../../percurso/CampoNumero';
import { t } from '../../percurso/textos';
import { Bloco } from './Campos';
import { BarrasFases, BarrasICU, FaixasMC, Tornado } from './Graficos';
import { cenariosTabela, detalhePorFase, legendaCenarios, listaComparacao, novaLinha, tabelaFases, type DetalheFase, type Resultados } from './calc';

const nf = (x: number, d = 2) => (+x || 0).toLocaleString(String(LOC()), { maximumFractionDigits: d });
const nfInt = (x: number) => Math.round(+x || 0).toLocaleString(String(LOC()));

export function AbaCenarios({ res }: { res: Resultados }) {
  const s = useCaso();
  const calc = calcDe(s.custo);
  return (
    <>
      <Indicadores res={res} />
      <Fases res={res} />
      <Cenarios res={res} />
      <Sensibilidade res={res} />
      <MonteCarlo res={res} />
      {calc.avancado ? <Analises res={res} /> : (
        <p className="rf-nota">{t('Custo anual equivalente, decomposição da variação (LMDI), índice de preços, comparação de alternativas e equidade por estrato aparecem no modo avançado.')}</p>
      )}
    </>
  );
}

// ----------------------------------------------------------- indicadores (CUS-18)
export function kpisCompletos(res: Resultados): [string, string, string?][] {
  const { av, ind, H, dotTotal } = res;
  return [
    [t('Custo total do ciclo de vida (conta econômica)'), din(av.ctEco, 0)],
    [t('Dotação total nos {n} exercícios (conta orçamentária)', { n: H + 1 }), din(dotTotal, 0)],
    [t('Índice de custo unitário: por usuário ativo por ano'), din(ind.icu, 2)],
    [t('Custo marginal por usuário ativo adicional'), din(ind.marginal, 2)],
    [t('Capacidade interna (sem dotação nova)'), pct(ind.pCapacidade)],
    [t('Cotado em moeda estrangeira'), pct(ind.pUSD)],
    [t('Custo de sair, em anos de custo recorrente'), t('{n} ano(s)', { n: nf(ind.anosParaSair, 1) })],
  ];
}
function Indicadores({ res }: { res: Resultados }) {
  const { ind } = res;
  const itens = (ARVORE as any[]).map(([k, n]) => ({ k, nome: k + ' ' + t(n), v: ind.icuK[k] || 0 }));
  return (
    <Bloco id="indicadores" titulo={t('Indicadores')}>
      <div className="rf-kpis rf-kpis--7">
        {kpisCompletos(res).map(([l, v], i) => <KpiTile key={i} label={l} value={v} />)}
      </div>
      <h3 className="rf-sub-h">{t('Índice de custo unitário e seus componentes')}</h3>
      <p className="rf-nota">
        {t('O índice total é a soma exata dos índices dos componentes, porque todos dividem pelo mesmo denominador: {n} usuários ativos-ano no horizonte.', { n: nfInt(ind.usuariosAno) })}{' '}
        {t('Custo por elegível por ano: {v}.', { v: din(ind.icuElegivel, 2) })}{' '}
        {ind.custoInteracao ? t('Custo por interação: {v}.', { v: din(ind.custoInteracao, 3) }) + ' ' : ''}
        {t('Custo marginal ÷ médio: {v} (abaixo de 1 indica custos fixos diluídos com a escala).', { v: nf(ind.razaoMarginalMedio) })}
      </p>
      <BarrasICU itens={itens} total={ind.icu} />
    </Bloco>
  );
}

// ----------------------------------------------------------- custo por fase (MOT-10)
/** Custo por fase do motor (Prova de conceito ou piloto, Implantação, Expansão): único e recorrente, pessoas alcançadas e, abrindo, camadas ou componentes. */
function Fases({ res }: { res: Resultados }) {
  const [vista, setVista] = useState<'fase' | DetalheFase>('fase');
  const tab = tabelaFases(res.av);
  if (!tab || !tab.linhas.length) return null;
  const { linhas, total } = tab;
  const temAprendiz = linhas.some((l) => l.aprendizes != null), temProf = linhas.some((l) => l.professores != null);
  const cols: DataColumn[] = [
    { key: 'f', label: t('Fase') }, { key: 'anos', label: t('Anos') },
    { key: 'u', label: t('Pagamento único'), numeric: true }, { key: 'r', label: t('Recorrente'), numeric: true }, { key: 't', label: t('Total'), numeric: true },
    { key: 'p', label: t('Pessoas alcançadas'), numeric: true },
    ...(temAprendiz ? [{ key: 'a', label: t('Aprendizes'), numeric: true }] : []),
    ...(temProf ? [{ key: 'pr', label: t('Professores'), numeric: true }] : []),
  ];
  const celulaPessoas = (v: number | null) => (v == null ? '–' : nfInt(v));
  const rows: DataRow[] = [
    ...linhas.map((l): DataRow => ({
      key: l.id,
      cells: { f: t(l.nome), anos: l.rotuloAnos, u: mil(l.unico), r: mil(l.recorrente), t: mil(l.total), p: nfInt(l.pessoas), a: celulaPessoas(l.aprendizes), pr: celulaPessoas(l.professores) },
    })),
    { key: 'total', total: true, cells: { f: t('Custo total do ciclo de vida'), anos: '', u: mil(total.unico), r: mil(total.recorrente), t: mil(total.total), p: nfInt(total.pessoas), a: '', pr: '' } },
  ];
  const det = vista === 'fase' ? null : detalhePorFase(res.av, vista);
  const colsDet: DataColumn[] = det ? [{ key: 'n', label: vista === 'camada' ? t('Camada') : t('Componente') }, ...det.fases.map((f) => ({ key: f.id, label: t(f.nome), numeric: true })), { key: 'tot', label: t('Total'), numeric: true }] : [];
  const rowsDet: DataRow[] = det ? [
    ...det.linhas.map((l): DataRow => ({
      key: l.id, layer: vista === 'camada' ? +l.id : undefined,
      cells: { n: l.rotulo, ...Object.fromEntries(det.fases.map((f) => [f.id, mil(l.porFase[f.id])])), tot: mil(l.total) },
    })),
    { key: 'total', total: true, cells: { n: t('Custo total do ciclo de vida'), ...Object.fromEntries(det.fases.map((f) => [f.id, mil(det.linhas.reduce((a, l) => a + l.porFase[f.id], 0))])), tot: mil(det.linhas.reduce((a, l) => a + l.total, 0)) } },
  ] : [];
  const notaFases = fonteMotor('fases')!.nota!, notaUnico = fonteMotor('unicoRecorrente')!.nota!;
  return (
    <Bloco id="fases" titulo={t('Custo por fase')} nota={t(notaUnico)}>
      <BarrasFases fmt={(v) => din(v, 0)} fases={linhas.map((l) => ({ id: l.id, nome: l.nome, rotuloAnos: l.rotuloAnos, unico: l.unico, recorrente: l.recorrente, total: l.total }))} />
      <div className="rf-tabela"><DataTable columns={cols} rows={rows} caption={t('Custo por fase') + ' (' + unidMil() + ')'} /></div>
      <p className="rf-nota">{t(notaFases)} {t('No total, as pessoas alcançadas são o máximo entre as fases, não a soma.')}</p>
      <div className="rf-fases-seletor">
        <Segmented
          label={t('Custo por fase')}
          value={vista}
          onChange={setVista}
          options={[{ value: 'fase', label: t('Fase') }, { value: 'camada', label: t('Camada') }, { value: 'componente', label: t('Componente') }]}
        />
      </div>
      {det ? (
        <div className="rf-tabela" id="rf-fases-detalhe">
          <DataTable columns={colsDet} rows={rowsDet} caption={t('Custo por fase') + ' · ' + (vista === 'camada' ? t('Camada') : t('Componente')) + ' (' + unidMil() + ')'} />
        </div>
      ) : null}
    </Bloco>
  );
}

// ----------------------------------------------------------- cenários (CUS-14)
function Cenarios({ res }: { res: Resultados }) {
  const { cfg, H } = res;
  const cen = useMemo(() => { try { return cenariosTabela(cenarios(cfg), cfg); } catch (e) { return null; } }, [cfg]);
  if (!cen) return null;
  const cols: DataColumn[] = ([{ key: 'n', label: t('Indicador') }] as DataColumn[]).concat(cen.map((c, i) => ({ key: 'c' + i, label: t(c.nome), numeric: true })));
  const linha = (key: string, rot: string, f: (c: any) => string, extra: Partial<DataRow> = {}): DataRow => {
    const cells: Record<string, any> = { n: rot };
    cen.forEach((c, i) => { cells['c' + i] = f(c); });
    return { key, cells, ...extra };
  };
  const rows: DataRow[] = [
    linha('U', t('Usuários ativos no último ano'), (c) => nfInt(c.r.U[H])),
    linha('ct', t('Custo total do ciclo de vida ({unid})', { unid: unidMil() }), (c) => mil(c.av.ctEco)),
    linha('dot', t('Desembolso com contingência, sem reserva de adoção ({unid})', { unid: unidMil() }), (c) => mil(c.orc.dot.reduce((a: number, b: number) => a + b, 0))),
    linha('icu', t('Índice de custo unitário'), (c) => din(c.ind.icu, 2)),
    ...(ARVORE as any[]).map(([k]) => linha(k, k + ' ' + t((NOME_K as any)[k]), (c) => mil(c.av.porK[k]))),
  ];
  return (
    <Bloco id="cenarios" titulo={t('Cenários')} nota={legendaCenarios(cfg)}>
      <div className="rf-tabela"><DataTable columns={cols} rows={rows} caption={t('Cenários')} /></div>
    </Bloco>
  );
}

// ----------------------------------------------------------- tornado e faixas (CUS-15, CUS-16)
function Sensibilidade({ res }: { res: Resultados }) {
  const { cfg } = res;
  const editarFaixa = useCaso((s) => s.editarFaixa);
  const [faixasAbertas, setFaixasAbertas] = useState(false);
  const tor = useMemo(() => { try { return tornado(cfg); } catch (e) { return null; } }, [cfg]);
  const dirs = useMemo(() => { try { return direcionadores(cfg) as any[]; } catch (e) { return []; } }, [cfg]);
  if (!tor) return null;
  return (
    <Bloco id="tornado" titulo={t('O que mais move o custo')}
      nota={t('Cada direcionador varia na sua própria faixa plausível, mantidos os demais no valor provável. As faixas são convenções editoriais do guia e podem ser editadas abaixo.')}>
      <Tornado rows={tor.rows} base={tor.base} rotuloBase={t('custo econômico total')} />
      <div className="rf-sub" id="rf-faixas">
        <button type="button" className="rf-arv-tg rf-abre" aria-expanded={faixasAbertas} aria-controls="rf-faixas-corpo" onClick={() => setFaixasAbertas(!faixasAbertas)}>
          <span aria-hidden="true">{faixasAbertas ? '▾' : '▸'}</span> {t('Faixas dos direcionadores')}
        </button>
        {faixasAbertas ? (
          <div id="rf-faixas-corpo" className="rf-pilha">
            {dirs.map((d) => (
              <div className="rf-linha" key={d.id}>
                <span className="rf-linha-nome">{t(d.nome)}</span>
                <div className="rf-campo"><CampoNumero label={t('Mínimo (×)')} value={d.min} decimais size={7} onChange={(v) => { if (v !== '') editarFaixa(d.id, 'min', v); }} /></div>
                <div className="rf-campo"><CampoNumero label={t('Máximo (×)')} value={d.max} decimais size={7} onChange={(v) => { if (v !== '') editarFaixa(d.id, 'max', v); }} /></div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Bloco>
  );
}

// ----------------------------------------------------------- Monte Carlo (CUS-17)
// O resultado não persiste (como SIM na v13): fica na memória da página enquanto a cfg for a mesma.
let SIM: { chave: string; res: any } | null = null;
function MonteCarlo({ res }: { res: Resultados }) {
  const { cfg } = res;
  const chave = useMemo(() => JSON.stringify(cfg), [cfg]);
  const [, setVersao] = useState(0);
  const [rodando, setRodando] = useState(false);
  const sim = SIM && SIM.chave === chave ? SIM.res : null;
  const rodar = () => {
    setRodando(true);
    setTimeout(() => {
      try { SIM = { chave, res: simular(cfg, 1500) }; } catch (e) { SIM = null; }
      setRodando(false); setVersao((v) => v + 1);
    }, 30);
  };
  const fmtMil = (v: number) => mil(v);
  return (
    <Bloco id="montecarlo" titulo={t('Simulação de Monte Carlo')}
      acoes={<Button onClick={rodar} disabled={rodando} aria-busy={rodando}>{rodando ? t('Simulando…') : t('Rodar 1.500 cenários')}</Button>}>
      {sim ? (
        <>
          <FaixasMC titulo={t('Custo total do ciclo de vida ({unid})', { unid: unidMil() })} fmt={fmtMil}
            linhas={[{ id: 'ct', rotulo: t('Custo total do ciclo de vida ({unid})', { unid: unidMil() }), ...sim.ct }]} />
          <FaixasMC titulo={t('Dotação por exercício ({unid})', { unid: unidMil() })} fmt={fmtMil}
            linhas={sim.dot.map((q: any, i: number) => ({ id: 'd' + i, rotulo: t('Dotação do Ano ' + i), ...q }))} />
          <div className="rf-tabela">
            <DataTable
              caption={t('Simulação de Monte Carlo')}
              columns={[{ key: 'n', label: t('Saída') }, { key: 'p10', label: 'P10', numeric: true }, { key: 'p50', label: 'P50', numeric: true }, { key: 'p90', label: 'P90', numeric: true }, { key: 'cr', label: t('Custo em risco (P90 − P50)'), numeric: true }]}
              rows={[
                { key: 'ct', cells: { n: t('Custo total do ciclo de vida ({unid})', { unid: unidMil() }), p10: mil(sim.ct.p10), p50: mil(sim.ct.p50), p90: mil(sim.ct.p90), cr: mil(sim.ct.p90 - sim.ct.p50) } },
                ...sim.dot.map((q: any, i: number) => ({ key: 'd' + i, cells: { n: t('Dotação do Ano ' + i), p10: mil(q.p10), p50: mil(q.p50), p90: mil(q.p90), cr: mil(sim.custoEmRisco[i]) } })),
              ]}
            />
          </div>
          <p className="rf-nota">{t('{n} cenários, distribuição triangular em cada direcionador (moda no valor provável), choques comuns de adoção e câmbio, semente {semente}. As faixas são convenções; P10 e P90 não são probabilidades medidas.', { n: nfInt(sim.N), semente: sim.seed })}</p>
        </>
      ) : <p className="rf-nota">{t('Ainda não simulado para estas premissas.')}</p>}
    </Bloco>
  );
}

// ----------------------------------------------------------- análises avançadas (CUS-24, CUS-25)
function Analises({ res }: { res: Resultados }) {
  const s = useCaso();
  const calc = calcDe(s.custo);
  const { cfg, r, av, ind, T, H } = res;
  const o = r.opc;
  const caeImpl = (cfg.implantacao || []).reduce((a: number, x: any) => a + (+x.valor || 0), 0);
  const t0 = Math.min(calc.lmdi0, H), t1 = Math.min(calc.lmdi1, H);
  let lm: any = null;
  try { lm = lmdi(cfg, t0, cfg, t1); } catch (e) { lm = null; }
  let las: any[] = [];
  try { las = laspeyres(cfg); } catch (e) { las = []; }
  const anoOpc = T.map((x) => ({ value: String(x), label: t('Ano ' + x) }));
  return (
    <Bloco id="avancado-analises" titulo={t('Modo avançado')}>
      <div className="rf-sub" id="rf-cae">
        <h3 className="rf-sub-h">{t('Custo anual equivalente')}</h3>
        <p className="rf-paragrafo">
          {t('Implantação de {v} com vida útil de {n} anos equivale a {cae} por ano', { v: din(caeImpl), n: o.vidaUtil, cae: din(cae(caeImpl, o.r, o.vidaUtil)) })}
          {o.r ? ' ' + t('à taxa de {taxa}', { taxa: pct(o.r, 1) }) : ' ' + t('sem desconto')}.{' '}
          {t('Custo econômico do ciclo inteiro por ano: {v}.', { v: din(cae(av.ctEco, o.r, H + 1)) })}
        </p>
      </div>

      <div className="rf-sub" id="rf-lmdi">
        <h3 className="rf-sub-h">{t('Decomposição da variação (LMDI)')}</h3>
        {lm ? (
          <>
            <div className="rf-linha">
              <div className="rf-campo rf-campo--sel">
                <label className="rf-rotulo" htmlFor="rf-lmdi0">{t('De')}</label>
                <select id="rf-lmdi0" className="rf-select" value={String(t0)} onChange={(e) => s.setCalc({ lmdi0: +e.target.value })}>{anoOpc.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}</select>
              </div>
              <div className="rf-campo rf-campo--sel">
                <label className="rf-rotulo" htmlFor="rf-lmdi1">{t('para')}</label>
                <select id="rf-lmdi1" className="rf-select" value={String(t1)} onChange={(e) => s.setCalc({ lmdi1: +e.target.value })}>{anoOpc.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}</select>
              </div>
            </div>
            <div className="rf-tabela">
              <DataTable
                caption={t('Decomposição da variação (LMDI)')}
                columns={[{ key: 'n', label: t('Fator') }, { key: 'v0', label: t('Ano ' + t0), numeric: true }, { key: 'v1', label: t('Ano ' + t1), numeric: true }, { key: 'ef', label: t('Efeito ({unid})', { unid: unidMil() }), numeric: true }]}
                rows={[
                  ...lm.contrib.map((c: any, i: number) => ({ key: String(i), cells: { n: t(c.fator), v0: nf(c.v0, 4), v1: nf(c.v1, 4), ef: mil(c.efeito) } })),
                  { key: 'tot', total: true, cells: { n: arquitetura(cfg) === 'saas' ? t('Variação total do custo de licenças') : t('Variação total do consumo de modelos'), v0: mil(lm.C0), v1: mil(lm.C1), ef: mil(lm.delta) } },
                ]}
              />
            </div>
            <p className="rf-nota">{t('Decomposição logarítmica (LMDI): os efeitos somam exatamente a variação. Mostra quanto veio de escala, intensidade de uso, preço e câmbio.')}</p>
          </>
        ) : <p className="rf-nota">{t('Disponível para soluções por licença ou por consumo de API.')}</p>}
      </div>

      <div className="rf-sub" id="rf-laspeyres">
        <h3 className="rf-sub-h">{t('Índice de preços do caso')}</h3>
        <div className="rf-tabela">
          <DataTable
            caption={t('Índice de preços do caso')}
            columns={([{ key: 'n', label: t('Índice') }] as DataColumn[]).concat(T.map((x) => ({ key: 'a' + x, label: t('Ano ' + x), numeric: true })))}
            rows={[{ key: 'l', cells: Object.fromEntries([['n', t('Preços dos insumos do caso (Ano 1 = 100)')], ...T.map((x, i) => ['a' + x, las[i] == null ? '–' : nf(las[i], 1)])]) }]}
          />
        </div>
        <p className="rf-nota">{t('Laspeyres com a cesta de insumos do Ano 1. Use para comparar com o índice de reajuste do contrato e para separar, na execução, efeito preço de efeito quantidade.')}</p>
      </div>

      <Alternativas res={res} />
      <Equidade res={res} ind={ind} />
    </Bloco>
  );
}

function Alternativas({ res }: { res: Resultados }) {
  const s = useCaso();
  const calc = calcDe(s.custo);
  const alts = calc.alts;
  const nomeCaso = s.custo.base === 'caso' ? t('Seu caso') : t('Exemplo {x}', { x: s.custo.base });
  const setAlt = (i: number, campo: keyof AlternativaCusto, v: any) => s.setCalc({ alts: alts.map((a, j) => (j === i ? { ...a, [campo]: v } : a)) });
  let comp: any[] | null = null;
  try { if (alts.length) comp = comparar(listaComparacao(nomeCaso, res.cfg, alts, calc.efeitoCaso, calc.refAlt)); } catch (e) { comp = null; }
  const lam = typeof calc.lambda === 'number' ? calc.lambda : 0;
  const refNome = calc.refAlt == null ? nomeCaso : (alts[calc.refAlt]?.nome || nomeCaso);
  return (
    <div className="rf-sub" id="rf-alternativas">
      <h3 className="rf-sub-h">{t('Comparação de alternativas e custo-efetividade')}</h3>
      <p className="rf-nota">{t('Monte alternativas na mesma árvore, inclusive o status quo ou uma solução sem IA, e informe o efeito de cada uma, se houver estimativa, na mesma unidade (por exemplo, desvio-padrão em aprendizagem ou horas liberadas por usuário). A primeira linha da tabela é a referência.')}</p>
      <div className="rf-cartao">
        <div className="rf-linha">
          <span className="rf-linha-nome">{nomeCaso} <span className="rf-mudo">({t('premissas acima')})</span></span>
          <div className="rf-campo"><CampoNumero label={t('Efeito')} value={calc.efeitoCaso} decimais negativo size={7} onChange={(v) => s.setCalc({ efeitoCaso: v })} /></div>
        </div>
      </div>
      {alts.map((a, i) => (
        <div className="rf-cartao" key={i}>
          <div className="rf-linha">
            <div className="rf-campo rf-campo--texto"><TextField label={t('Alternativa')} value={a.nome} onChange={(v) => setAlt(i, 'nome', v)} /></div>
            <div className="rf-campo"><CampoNumero label={t('Implantação (US$)')} value={a.impl} decimais size={9} onChange={(v) => setAlt(i, 'impl', v)} /></div>
            <div className="rf-campo"><CampoNumero label={t('Custo anual (US$)')} value={a.anual} decimais size={9} onChange={(v) => setAlt(i, 'anual', v)} /></div>
            <div className="rf-campo"><CampoNumero label={t('FTE internos/ano')} value={a.fte} decimais size={6} onChange={(v) => setAlt(i, 'fte', v)} /></div>
            <div className="rf-campo"><CampoNumero label={t('Efeito')} value={a.efeito} decimais negativo size={7} onChange={(v) => setAlt(i, 'efeito', v)} /></div>
            <div className="rf-linha-acao">
              <Button variant="secondary" size="sm" aria-label={t('Remover: {nome}', { nome: a.nome })} onClick={() => {
                const nova = alts.filter((_, j) => j !== i);
                s.setCalc({ alts: nova, refAlt: calc.refAlt != null && calc.refAlt >= nova.length ? null : calc.refAlt });
              }}>{t('Remover')}</Button>
            </div>
          </div>
        </div>
      ))}
      <div className="rf-linha">
        <Button variant="secondary" onClick={() => s.setCalc({ alts: [...alts, novaLinha.alternativa()] })}>{t('Adicionar alternativa sem IA ou status quo')}</Button>
        <div className="rf-campo"><CampoNumero label={t('Quanto a rede aceita pagar por unidade de efeito (US$)')} value={calc.lambda} decimais size={9} onChange={(v) => s.setCalc({ lambda: v })} /></div>
      </div>
      {alts.length ? (
        <div className="rf-campo rf-campo--sel">
          <label className="rf-rotulo" htmlFor="rf-refalt">{t('Referência')}</label>
          <select id="rf-refalt" className="rf-select" value={calc.refAlt == null ? '-1' : String(calc.refAlt)} onChange={(e) => s.setCalc({ refAlt: +e.target.value < 0 ? null : +e.target.value })}>
            <option value="-1">{nomeCaso}</option>
            {alts.map((a, i) => <option key={i} value={String(i)}>{a.nome || t('Alternativa') + ' ' + (i + 1)}</option>)}
          </select>
        </div>
      ) : null}
      {comp ? (
        <>
          <div className="rf-tabela">
            <DataTable
              caption={t('Comparação de alternativas e custo-efetividade') + ' · ' + t('Referência') + ': ' + refNome}
              columns={[
                { key: 'n', label: t('Alternativa') }, { key: 'ct', label: t('Custo total ({unid})', { unid: unidMil() }), numeric: true },
                { key: 'dc', label: t('Diferença para a referência'), numeric: true }, { key: 'ef', label: t('Efeito'), numeric: true },
                { key: 'rcei', label: t('Razão custo-efetividade incremental'), numeric: true }, { key: 'sit', label: t('Situação') },
                { key: 'min', label: t('Efeito mínimo para justificar'), numeric: true },
              ]}
              rows={comp.map((x: any, i: number) => ({
                key: String(i),
                cells: {
                  n: <>{x.nome}{i === 0 ? <span className="rf-etiqueta">{t('referência')}</span> : null}</>,
                  ct: mil(x.ct), dc: i === 0 ? '–' : mil(x.dC), ef: x.efeito == null ? '–' : nf(x.efeito, 4),
                  rcei: x.rcei != null ? t('{v} por unidade', { v: din(x.rcei, 0) }) : '–',
                  sit: x.dominada ? <span className="rf-etiqueta rf-etiqueta--alerta">{t('dominada')}</span> : x.efeito != null ? t('não dominada') : t('sem efeito informado'),
                  min: i > 0 && lam > 0 ? nf(x.dC / lam, 3) + (comp![0].efeito != null ? ' ' + t('acima da referência') : '') : '–',
                },
              }))}
            />
          </div>
          <p className="rf-nota">{t('Dominada: mais cara e não mais efetiva que outra. A razão incremental compara cada alternativa não dominada com a anterior, ordenadas por custo. O efeito mínimo é a diferença de custo dividida pelo valor que a rede aceita pagar por unidade de efeito.')}</p>
        </>
      ) : null}
    </div>
  );
}

function Equidade({ res, ind }: { res: Resultados; ind: any }) {
  const s = useCaso();
  const calc = calcDe(s.custo);
  const estratos = calc.estratos;
  let eq: any[] = [];
  try { eq = equidade(res.cfg, estratos, res.av); } catch (e) { eq = []; }
  const setE = (i: number, campo: keyof EstratoCusto, v: any) => s.setCalc({ estratos: estratos.map((z, j) => (j === i ? { ...z, [campo]: v } : z)) });
  return (
    <div className="rf-sub" id="rf-equidade">
      <h3 className="rf-sub-h">{t('Equidade: custo por estrato')}</h3>
      {estratos.map((z, i) => (
        <div className="rf-cartao" key={i}>
          <div className="rf-linha">
            <div className="rf-campo rf-campo--texto"><TextField label={t('Estrato')} value={t(z.nome)} onChange={(v) => setE(i, 'nome', v)} /></div>
            <div className="rf-campo"><CampoNumero label={t('Participação dos usuários (%)')} value={z.part} percentual size={6} onChange={(v) => setE(i, 'part', v === '' ? 0 : v)} /></div>
            <div className="rf-campo"><CampoNumero label={t('Fator sobre K1 (base)')} value={z.fK1} decimais size={6} onChange={(v) => setE(i, 'fK1', v === '' ? 1 : v)} /></div>
            <div className="rf-campo"><CampoNumero label={t('Fator sobre K4 (operação e formação)')} value={z.fK4} decimais size={6} onChange={(v) => setE(i, 'fK4', v === '' ? 1 : v)} /></div>
          </div>
          {eq[i] ? <p className="rf-nota">{t('Custo por usuário-ano')}: <b>{din(eq[i].icu, 2)}</b> · {t('Diferença para a média')}: {din(eq[i].delta, 2)}</p> : null}
        </div>
      ))}
      <p className="rf-nota">{t('Os estratos e fatores são exemplos editáveis, não dados. Mostram quanto custa garantir uso onde há menos condições: mais suporte, formação e infraestrutura por usuário.')}{(ind.icuK.K1 || 0) === 0 ? ' ' + t('Como não há custos de base (K1) nas premissas, só o fator sobre K4 tem efeito.') : ''}</p>
    </div>
  );
}

