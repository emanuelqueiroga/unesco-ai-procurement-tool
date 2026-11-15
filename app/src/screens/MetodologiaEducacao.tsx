// v022: página "Como o custo é calculado" de "Educando com e sem IA": linguagem simples, passo a passo, notação,
// equações numeradas (MathML), valores por país com fonte e grau, os valores do país do plano e o catálogo linha a linha,
// gerado do próprio modelo (COMPONENTES), com a nota técnica e a planilha para baixar. Texto em português e inglês; o
// catálogo segue o idioma da ferramenta.
import { useEffect } from 'react';
import { Button } from '../ui';
import { Shell } from './Shell';
import { t } from '../percurso/textos';
import { href } from '../percurso/rota';
import { getLang } from '../domain/i18n.js';
import { LOC, nomePais, paisDoCaso } from '../domain';
import { useCaso } from '../store';
import { MET_ED, NOTA_PDF_ED, PLANILHA_ED } from '../percurso/metodologiaEd';
import { FORMULAS_MET_ED } from '../percurso/formulasMetEd';
import { COMPONENTES, CATEGORIAS_ED, DESAFIOS_ED, FASES_PADRAO, ESCOLAS_POC, PILOTO_MIN, PILOTO_MAX, SIM, type CompDef, type ParamDef } from '../percurso/educacaoV20';
import { FONTES_ED, DEFICIENCIA_MUNDO, NIVEIS_DESAFIO, semEnergiaPais, semInternetPais, razaoPais, deficienciaPais, precoPais, paramPais, origemTexto, nomesNiveis, type ValorPais } from '../percurso/educacaoPais';
import { ESCOLAS_UIS, RAZAO_UIS, KWH_PAIS, BANDA_UIT, MOVEL_UIT, PVOUT, DEFICIENCIA_UNICEF } from '../percurso/educacaoDados';
import { PAPEIS_ESPECIALISTA, premioEspecialista } from '../percurso/equipesGov';
import { NOME_PERFIL } from '../percurso/custosV017';
import './salarios.css';
import './educacaoV20.css';

type L = 'pt' | 'en';
const ROT: Record<string, { pt: string; en: string }> = {
  baixarNota: { pt: 'Baixar a nota técnica (PDF)', en: 'Download the technical note (PDF)' },
  baixarPlanilha: { pt: 'Baixar a planilha de cálculo (Excel)', en: 'Download the calculation spreadsheet (Excel)' },
  alt: { pt: 'Alternativa', en: 'Alternative' }, classe: { pt: 'Classe', en: 'Class' }, unidade: { pt: 'Unidade', en: 'Unit' },
  conta: { pt: 'Conta', en: 'Calculation' }, params: { pt: 'Parâmetros (valor sugerido)', en: 'Parameters (suggested value)' },
  preco: { pt: 'Preço', en: 'Price' }, equipe: { pt: 'Equipe', en: 'Team' }, vida: { pt: 'Vida útil', en: 'Useful life' },
  so: { pt: 'Só nos desafios', en: 'Only in challenges' }, pct: { pt: 'Percentual de', en: 'Percentage of' }, nota: { pt: 'Nota', en: 'Note' },
  ambos: { pt: 'com e sem IA', en: 'with and without AI' }, com: { pt: 'só com IA', en: 'with AI only' }, sem: { pt: 'só sem IA', en: 'without AI only' },
  capex: { pt: 'CapEx (investimento)', en: 'CapEx (investment)' }, opex: { pt: 'OpEx (operação)', en: 'OpEx (operation)' }, uso: { pt: 'Utility (consumo medido)', en: 'Utility (metered consumption)' },
  doPais: { pt: 'do país', en: 'from the country' }, mediana: { pt: 'sem dado do país, a mediana do grupo do FMI do país', en: 'without country data, the median of the country IMF group' }, porDesafio: { pt: 'por desafio', en: 'by challenge' },
  local: { pt: 'valor de referência em US$ × nível de preços do país (grau C)', en: 'reference value in US$ × country price level (grade C)' },
  intl: { pt: 'valor de referência internacional em US$ (grau C)', en: 'international reference value in US$ (grade C)' },
  perfilH: { pt: 'custo da hora do perfil {g} no país (ILOSTAT, com encargos), grau B', en: 'hourly cost of profile {g} in the country (ILOSTAT, with contributions), grade B' },
  perfilM: { pt: 'custo mensal do perfil {g} no país (ILOSTAT, com encargos), grau B', en: 'monthly cost of profile {g} in the country (ILOSTAT, with contributions), grade B' },
  mult: { pt: 'mais o percentual de impostos e frete', en: 'plus the taxes and freight percentage' },
  porArq: { pt: 'conforme a arquitetura', en: 'by architecture' }, meses: { pt: 'meses', en: 'months' },
  pessoas: { pt: 'pessoa(s)', en: 'person(s)' }, umPara: { pt: '1 para cada {n} {b}', en: '1 per {n} {b}' },
  bE: { pt: 'locais', en: 'sites' }, bA: { pt: 'estudantes', en: 'students' }, bP: { pt: 'professores', en: 'teachers' }, bdef: { pt: 'estudantes com deficiência', en: 'students with disabilities' },
  fases: { pt: 'fases', en: 'phases' }, todas: { pt: 'todas as fases', en: 'all phases' }, especialista: { pt: 'com prêmio de especialista de {p}%', en: 'with a {p}% specialist premium' },
  fonteDado: { pt: 'Fonte', en: 'Source' }, licenca: { pt: 'licença', en: 'licence' }, voltar: { pt: 'Voltar', en: 'Back' },
  valor: { pt: 'Valor', en: 'Value' }, item: { pt: 'Item', en: 'Item' }, origem: { pt: 'Origem e grau', en: 'Origin and grade' },
  semDado: { pt: 'sem dado: vale a referência da ferramenta (grau C)', en: 'no data: the tool reference applies (grade C)' },
  fasesTit: { pt: 'Fases sugeridas', en: 'Suggested phases' }, adicionais: { pt: 'Custos adicionais sugeridos: viagens {v}%, custos indiretos {o}%, taxa administrativa {t}%.', en: 'Suggested additional costs: travel {v}%, indirect costs {o}%, administrative fee {t}%.' },
  pocLoc: { pt: '{n} locais', en: '{n} sites' }, pilotoReg: { pt: '{a}% dos locais, entre {min} e {max}', en: '{a}% of sites, between {min} and {max}' }, alcance: { pt: '{a}% do público', en: '{a}% of the population' },
  niveis: { pt: 'Níveis usados por desafio', en: 'Levels used by challenge' }, escolasN: { pt: 'escolas', en: 'schools' }, razaoN: { pt: 'razão', en: 'ratio' },
};
const r = (l: L, k: string, v?: Record<string, string | number>) => { let s = ROT[k]?.[l] ?? k; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(String(b)); return s; };

function Formula({ tex, n }: { tex: string; n?: number }) {
  const f = FORMULAS_MET_ED[tex];
  return <div className="pc-met-eq"><div className="pc-met-eq-f" dangerouslySetInnerHTML={{ __html: f ? f.b : tex }} />{n ? <span className="pc-met-eq-n">({n})</span> : null}</div>;
}
const Simbolo = ({ tex }: { tex: string }) => { const f = FORMULAS_MET_ED[tex]; return <span className="pc-met-sim" dangerouslySetInnerHTML={{ __html: f ? f.i : tex }} />; };

/** Uma linha do catálogo, descrita a partir da definição do modelo. */
function LinhaCatalogo({ def, l }: { def: CompDef; l: L }) {
  const loc = String(LOC()), usd = (v: number) => new Intl.NumberFormat(loc, { style: 'currency', currency: 'USD', maximumFractionDigits: v < 1 ? 4 : 2 }).format(v);
  const num = (v: number) => new Intl.NumberFormat(loc, { maximumFractionDigits: 4 }).format(v);
  const val = (pd: ParamDef) => { const p = pd.padrao, u = pd.pct ? '%' : '';
    let s = typeof p === 'number' ? num(p) + u : `${t('Com IA')} ${num(p.com)}${u} · ${t('Sem IA')} ${num(p.sem)}${u}`;
    if (pd.pais) return `${r(l, 'doPais')}: ${FONTE_PARAM[pd.pais] || pd.pais} (${r(l, 'mediana')})`;
    if (pd.porDesafio) s += ` (${r(l, 'porDesafio')}: ${Object.entries(pd.porDesafio).map(([d, v]) => d + ' ' + num(v) + u).join(', ')})`;
    return s; };
  const pr = def.preco;
  const preco = pr ? (pr.perfil ? r(l, pr.hora ? 'perfilH' : 'perfilM', { g: pr.perfil + ' · ' + t(NOME_PERFIL[pr.perfil]) })
    : pr.pais ? `${r(l, 'doPais')}: ${FONTE_PRECO[pr.pais] || pr.pais} (${r(l, 'mediana')})`
    : `${typeof pr.padrao === 'number' ? usd(pr.padrao) : `${t('Com IA')} ${usd(pr.padrao.com)} · ${t('Sem IA')} ${usd(pr.padrao.sem)}`}${pr.porArq ? ' (' + r(l, 'porArq') + ': ' + Object.entries(pr.porArq).map(([a, v]) => a + ' ' + usd(v)).join(', ') + ')' : ''}; ${pr.pais ? r(l, 'doPais') + ': ' + (FONTE_PRECO[pr.pais] || pr.pais) : pr.local ? r(l, 'local') : r(l, 'intl')}${pr.mult ? '; ' + r(l, 'mult') : ''}`) : '';
  const premio = premioEspecialista().pct;
  return <section id={'met-' + def.id} className="pc-met-linha" aria-label={t(def.nome)}>
    <h5>{t(def.nome)} <small>({def.id})</small></h5>
    <dl className="pc-met-dl">
      <div><dt>{r(l, 'alt')}</dt><dd>{r(l, def.alt)} · {r(l, def.classe)}{def.unidade ? ' · ' + t(def.unidade) : ''}{def.informativo ? ' · ' + t('fora do total') : ''}</dd></div>
      <div><dt>{r(l, 'conta')}</dt><dd>{t(def.formula)}</dd></div>
      {def.params?.length ? <div><dt>{r(l, 'params')}</dt><dd>{def.params.map(pd => <span key={pd.id} className="pc-met-item">{t(pd.rotulo)}: {val(pd)}</span>)}</dd></div> : null}
      {pr ? <div><dt>{r(l, 'preco')}</dt><dd>{t(pr.rotulo)}: {preco}</dd></div> : null}
      {def.papeis ? <div><dt>{r(l, 'equipe')}</dt><dd>{def.papeis.map(p => { const esp = p.especialista ?? PAPEIS_ESPECIALISTA.has(p.papel);
        return <span key={p.papel} className="pc-met-item">{t(p.papel)} · G{p.perfil} {t(NOME_PERFIL[p.perfil])} · {p.porParam ? r(l, 'umPara', { n: num(Number(def.params?.find(x => x.id === p.porParam)?.padrao ?? 0)), b: r(l, 'b' + (p.base || 'E')) }) : num(p.pessoas || 0) + ' ' + r(l, 'pessoas')} × {num(p.ded * 100)}% · {p.fases ? p.fases.map(f => t(FASES_PADRAO.find(x => x.id === f)?.nome || f)).join(', ') : r(l, 'todas')}{p.alt && p.alt !== 'ambos' ? ' · ' + r(l, p.alt) : ''}{esp ? ' · ' + r(l, 'especialista', { p: premio }) : ''}</span>; })}</dd></div> : null}
      {def.pctDe ? <div><dt>{r(l, 'pct')}</dt><dd>{def.pctDe.ids.map(id => t(COMPONENTES.find(c => c.id === id)?.nome || id)).join(', ')}</dd></div> : null}
      {def.vida ? <div><dt>{r(l, 'vida')}</dt><dd>{num(Number(def.params?.find(x => x.id === def.vida)?.padrao ?? 0))} {r(l, 'meses')}</dd></div> : null}
      {def.extra ? <div><dt>{r(l, 'so')}</dt><dd>{def.extra.map(d => d + ' ' + t(DESAFIOS_ED.find(x => x.id === d)?.nome || d)).join(', ')}</dd></div> : null}
      {def.nota ? <div><dt>{r(l, 'nota')}</dt><dd>{t(def.nota)}</dd></div> : null}
    </dl>
  </section>;
}
const FONTE_PRECO: Record<string, string> = { kwh: FONTES_ED.kwh.nome, mbps: FONTES_ED.banda.nome, gb: FONTES_ED.movel.nome };
const FONTE_PARAM: Record<string, string> = { pvout: FONTES_ED.pvout.nome, velBanda: FONTES_ED.banda.nome };

export function MetodologiaEducacao({ foco }: { foco?: string }) {
  const l: L = getLang() === 'pt' ? 'pt' : 'en', M = MET_ED, loc = String(LOC());
  const caso = useCaso(s => (s as any).caso), iso: string = typeof caso?.pais === 'string' && caso.pais.length === 3 ? caso.pais : 'BRA';
  const ir = (id: string) => (e: React.MouseEvent) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  useEffect(() => { if (foco) setTimeout(() => document.getElementById('met-' + foco)?.scrollIntoView({ block: 'start' }), 50); }, [foco]);
  const num = (v: number, d = 2) => new Intl.NumberFormat(loc, { maximumFractionDigits: d }).format(v);
  const usd = (v: number) => new Intl.NumberFormat(loc, { style: 'currency', currency: 'USD', maximumFractionDigits: 4 }).format(v);
  const n = (o: object) => Object.keys(o).length;
  const linhasDados: [string, string, string, number, string, string][] = [
    [l === 'pt' ? 'Locais sem energia (%)' : 'Sites without electricity (%)', l === 'pt' ? 'Público: condições de partida; 2.1 Energia' : 'Population: starting conditions; 2.1 Energy', FONTES_ED.uisEscolas.nome + '; 100 − SCHBSP.x.WELEC', n(ESCOLAS_UIS), 'A', r(l, 'semDado') + ' (30%)'],
    [l === 'pt' ? 'Locais sem internet (%)' : 'Sites without internet (%)', l === 'pt' ? 'Público: condições de partida; 2.2 Conectividade; 2.4 servidores locais' : 'Population: starting conditions; 2.2 Connectivity; 2.4 local servers', FONTES_ED.uisEscolas.nome + '; 100 − SCHBSP.x.WINTERN', n(ESCOLAS_UIS), 'A', r(l, 'semDado') + ' (40%)'],
    [l === 'pt' ? 'Estudantes por professor' : 'Pupils per teacher', l === 'pt' ? 'Público: professores sugeridos' : 'Population: suggested teachers', FONTES_ED.uisRazao.nome, n(RAZAO_UIS), 'A (C31, C37: B)', r(l, 'semDado')],
    [l === 'pt' ? 'Estudantes com deficiência (%)' : 'Students with disabilities (%)', l === 'pt' ? 'Público; 2.3 assistivos; 3.3 apoio; 4.4 acessíveis' : 'Population; 2.3 assistive; 3.3 support; 4.4 accessible', FONTES_ED.unicef.nome, n(DEFICIENCIA_UNICEF), 'A', (l === 'pt' ? 'estimativa mundial do UNICEF, ' : 'UNICEF world estimate, ') + num(DEFICIENCIA_MUNDO, 1) + '% (B)'],
    [l === 'pt' ? 'Preço do kWh' : 'Price per kWh', '2.1 ' + t('Consumo de eletricidade'), FONTES_ED.kwh.nome, n(KWH_PAIS), 'B', l === 'pt' ? 'mediana do grupo do FMI (B)' : 'IMF group median (B)'],
    [l === 'pt' ? 'Produção solar por kW (kWh/dia)' : 'Solar output per kW (kWh/day)', '2.1 ' + t('Sistemas de energia nos locais sem energia'), FONTES_ED.pvout.nome, n(PVOUT), 'A', l === 'pt' ? 'mediana do grupo do FMI (B)' : 'IMF group median (B)'],
    [l === 'pt' ? 'Preço por Mbps e banda mínima' : 'Price per Mbps and minimum bandwidth', '2.2 ' + t('Mensalidade de internet'), FONTES_ED.banda.nome + (l === 'pt' ? '; preço da cesta ÷ velocidade' : '; basket price ÷ speed'), n(BANDA_UIT), 'B', l === 'pt' ? 'mediana do grupo do FMI (B)' : 'IMF group median (B)'],
    [l === 'pt' ? 'Preço do GB de dados móveis' : 'Price per GB of mobile data', '2.2 ' + t('Dados móveis para estudar em casa'), FONTES_ED.movel.nome + (l === 'pt' ? '; preço da cesta ÷ franquia' : '; basket price ÷ allowance'), n(MOVEL_UIT), 'A', l === 'pt' ? 'mediana do grupo do FMI (B)' : 'IMF group median (B)'],
    [l === 'pt' ? 'Salários por perfil' : 'Salaries by profile', l === 'pt' ? 'Todas as linhas de pessoas e horas de perfis' : 'All people and profile-hour lines', 'ILOSTAT (DF_EAR_EMTA_SEX_OCU_CUR_NB), FMI (inflação), SSA (encargos)', 0, 'B', l === 'pt' ? 'mediana mundial do perfil' : 'world median of the profile'],
    [l === 'pt' ? 'Nível de preços' : 'Price level', l === 'pt' ? 'Serviços locais sem dado do país' : 'Local services without country data', 'Banco Mundial, PA.NUS.PRVT.PP ÷ PA.NUS.FCRF', 0, 'A', l === 'pt' ? 'mediana do grupo do FMI' : 'IMF group median'],
    [l === 'pt' ? 'Matrículas' : 'Enrolment', l === 'pt' ? 'Público: estudantes sugeridos (parte por desafio, grau C)' : 'Population: suggested students (share by challenge, grade C)', 'Banco Mundial, SE.PRM.ENRL + SE.SEC.ENRL', 0, 'A', l === 'pt' ? '1 milhão' : '1 million'],
  ];
  const ds = ['C32', 'C33', 'C36'];
  const linhasPais: [string, ValorPais | null, string][] = [
    ...ds.flatMap(d => [[`${l === 'pt' ? 'Locais sem energia' : 'Sites without electricity'} · ${d}`, semEnergiaPais(iso, d), '%'], [`${l === 'pt' ? 'Locais sem internet' : 'Sites without internet'} · ${d}`, semInternetPais(iso, d), '%'],
      [`${l === 'pt' ? 'Estudantes por professor' : 'Pupils per teacher'} · ${d}`, razaoPais(iso, d), '']] as [string, ValorPais | null, string][]),
    [l === 'pt' ? 'Estudantes com deficiência' : 'Students with disabilities', deficienciaPais(iso), '%'],
    [l === 'pt' ? 'Preço do kWh' : 'Price per kWh', precoPais('kwh', iso), 'US$'], [l === 'pt' ? 'Preço por Mbps por mês' : 'Price per Mbps per month', precoPais('mbps', iso), 'US$'],
    [l === 'pt' ? 'Banda mínima por local (Mbps)' : 'Minimum bandwidth per site (Mbps)', paramPais('velBanda', iso), ''], [l === 'pt' ? 'Preço do GB de dados móveis' : 'Price per GB of mobile data', precoPais('gb', iso), 'US$'],
    [l === 'pt' ? 'Produção solar por kW instalado (kWh por dia)' : 'Solar output per installed kW (kWh per day)', paramPais('pvout', iso), ''],
  ];
  let k = 0;
  return <Shell nav={false} plano={false}>
    <section className="pc-sal pc-met" aria-labelledby="met-ed-titulo">
      <h1 id="met-ed-titulo">{M.titulo[l]}</h1>
      <p className="pc-lead">{M.lead[l]}</p>
      <p className="pc-met-arquivos">
        <a className="pc-met-baixar" href={NOTA_PDF_ED[l]} download>{r(l, 'baixarNota')}</a>
        <a className="pc-met-baixar" href={PLANILHA_ED[l]} download>{r(l, 'baixarPlanilha')}</a>
      </p>
      <p className="pc-nota">{M.arquivos[l]}{getLang() !== 'pt' && getLang() !== 'en' ? ' ' + M.idioma.en : ''}</p>
      <nav className="pc-met-indice" aria-label={M.indice[l]}>
        <p className="pc-met-indice-rot">{M.indice[l]}</p>
        <ol>{([['med-simples', M.hSimples], ['med-passos', M.hPassos], ['med-notacao', M.hNotacao], ['med-equacoes', M.hEquacoes], ['med-dados', M.hDados], ['med-pais', M.hPais],
          ['med-catalogo', M.hCatalogo], ['med-comparacao', M.hComparacao], ['med-limites', M.hLimites], ['med-graus', M.hGraus], ['med-refs', M.hRefs]] as const).map(([id, h]) =>
          <li key={id}><a href={href.metodologiaEd()} onClick={ir(id)}>{h[l]}</a></li>)}</ol>
      </nav>

      <h2 id="med-simples">{M.hSimples[l]}</h2>
      {M.simples.map(x => <p key={x.pt}>{x[l]}</p>)}

      <h2 id="med-passos">{M.hPassos[l]}</h2>
      {M.passos.map(p => <section key={p.titulo.pt} className="pc-met-passo" aria-label={p.titulo[l]}><h3>{p.titulo[l]}</h3><p>{p.texto[l]}</p></section>)}
      <h3>{r(l, 'fasesTit')}</h3>
      <ul className="pc-sal-lista">{FASES_PADRAO.map(f => <li key={f.id}>{t(f.nome)}: {f.meses} {r(l, 'meses')} · {f.id === 'poc' ? r(l, 'pocLoc', { n: ESCOLAS_POC }) : f.id === 'piloto' ? r(l, 'pilotoReg', { a: f.alcance, min: PILOTO_MIN, max: PILOTO_MAX }) : r(l, 'alcance', { a: f.alcance })}</li>)}</ul>
      <p>{r(l, 'adicionais', { v: SIM.viagens, o: SIM.overhead, t: SIM.taxa })}</p>

      <h2 id="med-tecnico">{M.hTecnico[l]}</h2>
      <h3 id="med-notacao">{M.hNotacao[l]}</h3>
      <div className="pc-sal-rolagem" tabIndex={0} role="region" aria-label={M.hNotacao[l]}>
        <table className="pc-sal-tabela"><thead><tr>{M.cabNotacao.map(c => <th key={c.pt} scope="col">{c[l]}</th>)}</tr></thead>
          <tbody>{M.notacao.map(([s, d, u]) => <tr key={s}><td><Simbolo tex={s} /></td><td>{d[l]}</td><td>{u[l]}</td></tr>)}</tbody></table>
      </div>

      <h3 id="med-equacoes">{M.hEquacoes[l]}</h3>
      {M.equacoes.map(eq => <section key={eq.id} id={'med-eq-' + eq.id} className="pc-met-equacao" aria-label={eq.titulo[l]}>
        <h4>{eq.titulo[l]}</h4>
        {eq.tex.map(x => <Formula key={x} tex={x} n={++k} />)}
        <p>{eq.texto[l]}</p>
      </section>)}

      <h3 id="med-dados">{M.hDados[l]}</h3>
      <p>{M.dados[l]}</p>
      <div className="pc-sal-rolagem" tabIndex={0} role="region" aria-label={M.hDados[l]}>
        <table className="pc-sal-tabela"><thead><tr>{M.cabDados.map(c => <th key={c.pt} scope="col">{c[l]}</th>)}</tr></thead>
          <tbody>{linhasDados.map(([v, onde, f, c, g, sem]) => <tr key={v}><th scope="row">{v}</th><td>{onde}</td><td>{f}</td><td>{c || '—'}</td><td>{g}</td><td>{sem}</td></tr>)}</tbody></table>
      </div>
      <p className="pc-nota">{r(l, 'niveis')}: {Object.entries(NIVEIS_DESAFIO).map(([d, x]) => `${d} (${r(l, 'escolasN')}: ${nomesNiveis(x.escolas, t)}; ${r(l, 'razaoN')}: ${nomesNiveis(x.razao, t)})`).join('; ')}.</p>
      <ul className="pc-met-refs">{Object.values(FONTES_ED).map(f => <li key={f.url + f.nome}>{f.nome} ({r(l, 'licenca')}: {f.licenca}) <a href={f.url} target="_blank" rel="noopener noreferrer">{f.url}</a></li>)}</ul>

      <h3 id="med-pais">{M.hPais[l]}: {nomePais(paisDoCaso({ pais: iso }))}</h3>
      <p>{M.pais[l]}</p>
      <div className="pc-sal-rolagem" tabIndex={0} role="region" aria-label={M.hPais[l]}>
        <table className="pc-sal-tabela"><thead><tr><th scope="col">{r(l, 'item')}</th><th scope="col">{r(l, 'valor')}</th><th scope="col">{r(l, 'origem')}</th></tr></thead>
          <tbody>{linhasPais.map(([rot, x, u]) => <tr key={rot}><th scope="row">{rot}</th><td>{x ? (u === 'US$' ? usd(x.v) : num(x.v, 2) + (u === '%' ? '%' : '')) : '—'}</td><td>{x ? origemTexto(x, t) : r(l, 'semDado')}</td></tr>)}</tbody></table>
      </div>

      <h3 id="med-catalogo">{M.hCatalogo[l]}</h3>
      <p>{M.catalogo[l]}</p>
      {CATEGORIAS_ED.map(c => <section key={c.id} aria-label={c.n + ' ' + t(c.nome)}>
        <h4>{c.n} {t(c.nome)}</h4>
        {c.opcoes.map((o, i) => <section key={o.id} aria-label={t(o.nome)}>
          <h4 className="pc-met-opcao">{c.n}.{i + 1} {t(o.nome)}</h4>
          {COMPONENTES.filter(d => d.op === o.id).map(d => <LinhaCatalogo key={d.id} def={d} l={l} />)}
        </section>)}
      </section>)}

      <h3 id="med-comparacao">{M.hComparacao[l]}</h3>
      {M.comparacao.map(x => <p key={x.pt}>{x[l]}</p>)}
      <h3 id="med-limites">{M.hLimites[l]}</h3>
      {M.limites.map(x => <p key={x.pt}>{x[l]}</p>)}
      <h3 id="med-graus">{M.hGraus[l]}</h3>
      <p>{M.graus[l]}</p>
      <h3 id="med-refs">{M.hRefs[l]}</h3>
      <ul className="pc-met-refs">{M.refs.map(([x, u]) => <li key={u}>{x} <a href={u} target="_blank" rel="noopener noreferrer">{u}</a></li>)}</ul>
      <p><Button variant="secondary" onClick={() => history.length > 1 ? history.back() : (location.hash = href.plano())}>{r(l, 'voltar')}</Button></p>
    </section>
  </Shell>;
}
