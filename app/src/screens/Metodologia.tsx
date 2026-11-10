// v018: página "Como o custo é calculado" (governança), em duas partes: a explicação em linguagem simples, passo a
// passo com um exemplo fictício, e o modelo técnico completo (notação, equações numeradas em MathML, parâmetros com
// fonte e grau, regras de dados, equipes de referência, incertezas e referências), com o download da nota e da planilha.
import { Button } from '../ui';
import { Shell } from './Shell';
import { t } from '../percurso/textos';
import { href } from '../percurso/rota';
import { getLang } from '../domain/i18n.js';
import { MET, NOTA_PDF, PLANILHA, EXEMPLO, contasExemplo } from '../percurso/metodologiaGov';
import { FORMULAS_MET } from '../percurso/formulasMet';
import { EQUIPES_GOV, PAPEIS_ESPECIALISTA, pessoasDaEquipe } from '../percurso/equipesGov';
import { MEDIANA_MUNDIAL } from '../percurso/custosV017';
import { CASOS_SOBERANA, NOME_GRUPO_FMI, paisSoberana, soberanaNacional } from '../percurso/nuvemSoberana';
import { LOC } from '../domain';
import './salarios.css';

/** Estrutura do custo: do total aos parâmetros (mesma figura da nota técnica). */
function FiguraCusto() {
  const edge = 'var(--muted)', accent = 'var(--primary)', ink = 'currentColor', quiet = 'var(--muted)', h = 48;
  const c0 = 16, w0 = 124, c1 = 164, w1 = 184, c2 = 372, w2 = 180, c3 = 576, w3 = 168;
  const no = (x: number, y: number, w: number, main: boolean, a: string, b: string) => <g>
    <rect x={x} y={y} width={w} height={h} rx="8" fill={main ? accent : 'none'} fillOpacity={main ? 0.12 : 1} stroke={main ? accent : edge} strokeWidth={main ? 2 : 1.25} />
    <text x={x + 12} y={y + 20} fontWeight="600" fill={ink}>{a}</text>
    <text x={x + 12} y={y + 37} fontSize="11.5" fill={quiet}>{b}</text>
  </g>;
  const caminhos = [`M${c0 + w0} 305H152V170H${c1}`, 'M152 305V320H164', 'M152 320V380H164', 'M152 380V440H164', `M${c1 + w1} 170H360V80H${c2}`,
    `M360 170V140H${c2}`, `M360 170V200H${c2}`, `M360 200V260H${c2}`, `M${c2 + w2} 80H${c3}`, `M564 80V140H${c3}`, `M564 140V200H${c3}`];
  return <div className="pc-sal-rolagem pc-met-fig" tabIndex={0} role="region" aria-label={t(MET.figura)}>
    <svg viewBox="0 40 760 448" role="img" aria-label={t(MET.figura)} fontSize="13">
      <defs><marker id="met-seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill={edge} /></marker></defs>
      <g fill="none" stroke={edge} strokeWidth="1.25">{caminhos.map(d => <path key={d} d={d} markerEnd="url(#met-seta)" />)}</g>
      {no(c0, 281, w0, true, t(MET.fTotal), MET.fTotal2)}
      {no(c1, 146, w1, false, t(MET.fDireto), t(MET.fDireto2))}
      {no(c1, 296, w1, false, t(MET.fViagens), t(MET.fViagens2))}
      {no(c1, 356, w1, false, t(MET.fOverhead), t(MET.fOverhead2))}
      {no(c1, 416, w1, false, t(MET.fTaxa), '7% × (D + V)')}
      {no(c2, 56, w2, true, t(MET.fEquipe), t(MET.fEquipe2))}
      {no(c2, 116, w2, false, t(MET.fPessoal), '3.1: n × c₂ × H')}
      {no(c2, 176, w2, false, t(MET.fForm), t(MET.fForm2))}
      {no(c2, 236, w2, false, t(MET.fInf), t(MET.fInf2))}
      {no(c3, 56, w3, false, t(MET.fMeses), t(MET.fMeses2))}
      {no(c3, 116, w3, false, t(MET.fPessoas), t(MET.fPessoas2))}
      {no(c3, 176, w3, false, t(MET.fMensal), 'w × I × (1 + e) × (1 + p·s)')}
    </svg>
  </div>;
}

/** Fórmula em MathML: em bloco (com o número da equação) ou na linha do texto. */
function Formula({ tex, n }: { tex: string; n?: number }) {
  const f = FORMULAS_MET[tex];
  return <div className="pc-met-eq"><div className="pc-met-eq-f" dangerouslySetInnerHTML={{ __html: f ? f.b : tex }} />{n ? <span className="pc-met-eq-n">({n})</span> : null}</div>;
}
function Simbolo({ tex }: { tex: string }) {
  const f = FORMULAS_MET[tex];
  return <span className="pc-met-sim" dangerouslySetInnerHTML={{ __html: f ? f.i : tex }} />;
}

/** Texto com fórmulas na linha entre colchetes duplos ([[…]]). */
function Rico({ s }: { s: string }) {
  return <>{s.split(/\[\[([^\]]+)\]\]/).map((x, i) => i % 2 ? <Simbolo key={i} tex={x} /> : x)}</>;
}

/** Valores do exemplo fictício, formatados no idioma da tela. */
function valoresExemplo(): Record<string, string | number> {
  const loc = String(LOC()), x = EXEMPLO, k = contasExemplo();
  const usd = (v: number) => new Intl.NumberFormat(loc, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const pct = (v: number) => new Intl.NumberFormat(loc, { style: 'percent', maximumFractionDigits: 1 }).format(v);
  const num = (v: number, d: number) => new Intl.NumberFormat(loc, { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
  const r: Record<string, string | number> = { ano: x.ano, meses: x.meses, h: x.h, participantes: x.participantes, horas: x.horas,
    pi1: pct(x.pi[0]), pi2: pct(x.pi[1]), e: pct(x.e), f1: num(1 + x.pi[0], 2), f2: num(1 + x.pi[1], 2), I: num(k.I, 4), fe: num(1 + x.e, 2), fp: num(1 + x.p, 2),
    w1: usd(x.w1), w2: usd(x.w2), w4: usd(x.w4), tb: x.tb, equip: usd(x.equip), sobM: num(k.sobM, 2), tau: k.tau, dias: k.dias, hp: num(k.hp, 0), ho: num(k.ho, 0) };
  for (const c of ['w2i', 'c1', 'c2', 'c4', 'c2e', 'r1', 'r2', 'r3', 'r4', 'mensal', 'norma', 'integral', 'hf', 'fCri', 'fIns', 'fSala', 'fDes', 'fCoo', 'formacao', 'hosp', 'vmsV', 'comp', 'P', 'D', 'V', 'O', 'T', 'C', 'TK', 'K', 'TU', 'U', 'X', 'existente', 'desembolso', 'sobK', 'sobKe'] as const) r[c] = usd(k[c]);
  return r;
}

export function Metodologia() {
  const l: 'pt' | 'en' = getLang() === 'pt' ? 'pt' : 'en';
  const loc = String(LOC()), ex = valoresExemplo();
  const num = (v: number) => new Intl.NumberFormat(loc, { maximumFractionDigits: 2 }).format(v);
  const usd = (v: number) => new Intl.NumberFormat(loc, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v);
  const med = { m1: usd(MEDIANA_MUNDIAL[1]), m2: usd(MEDIANA_MUNDIAL[2]), m3: usd(MEDIANA_MUNDIAL[3]), m4: usd(MEDIANA_MUNDIAL[4]) };
  const ir = (id: string) => (e: React.MouseEvent) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const secoes: [string, string][] = [['met-notacao', MET.hNotacao], ['met-equacoes', MET.hEquacoes], ['met-parametros', MET.hParametros], ['met-dados', MET.hDados],
    ['met-equipes', MET.hEquipes], ['met-soberana', MET.hSoberana], ['met-incertezas', MET.hIncertezas], ['met-graus', MET.hGraus], ['met-refs', MET.hRefs]];
  let n = 0;
  return <Shell nav={false} plano={false}>
    <section className="pc-sal pc-met" aria-labelledby="met-titulo">
      <h1 id="met-titulo">{t('Como o custo é calculado')}</h1>
      <p className="pc-lead">{t(MET.lead)}</p>
      <p className="pc-met-arquivos">
        <a className="pc-met-baixar" href={NOTA_PDF[l]} download>{t('Baixar a nota técnica (PDF)')}</a>
        <a className="pc-met-baixar" href={PLANILHA[l]} download>{t('Baixar a planilha de cálculo (Excel)')}</a>
      </p>
      <p className="pc-nota">{t(MET.arquivos)}</p>

      <nav className="pc-met-indice" aria-label={t(MET.indice)}>
        <p className="pc-met-indice-rot">{t(MET.indice)}</p>
        <ol>
          <li><a href={href.metodologia()} onClick={ir('met-simples')}>{t(MET.hSimples)}</a></li>
          <li><a href={href.metodologia()} onClick={ir('met-tecnico')}>{t(MET.hTecnico)}</a>
            <ol>{secoes.map(([id, h]) => <li key={id}><a href={href.metodologia()} onClick={ir(id)}>{t(h)}</a></li>)}</ol></li>
        </ol>
      </nav>

      <h2 id="met-simples">{t(MET.hSimples)}</h2>
      {MET.simples.map(x => <p key={x}>{t(x)}</p>)}
      <h3>{t(MET.figura)}</h3>
      <FiguraCusto />
      <p>{t(MET.exemploIntro)}</p>
      {MET.passos.map(pa => <section key={pa.titulo} className="pc-met-passo" aria-label={t(pa.titulo)}>
        <h3>{t(pa.titulo)}</h3>
        {pa.textos.map(x => <p key={x}>{t(x)}</p>)}
        <div className="pc-met-exemplo">
          <p className="pc-met-exemplo-rot">{t(MET.rotExemplo)}</p>
          {pa.exemplo.map(x => <p key={x}>{t(x, ex)}</p>)}
        </div>
      </section>)}

      <h2 id="met-tecnico">{t(MET.hTecnico)}</h2>
      <p>{t(MET.tecnico)}</p>

      <h3 id="met-notacao">{t(MET.hNotacao)}</h3>
      <div className="pc-sal-rolagem" tabIndex={0} role="region" aria-label={t(MET.hNotacao)}>
        <table className="pc-sal-tabela"><thead><tr>{MET.cabNotacao.map(c => <th key={c} scope="col">{t(c)}</th>)}</tr></thead>
          <tbody>{MET.notacao.map(([s, d, u]) => <tr key={s}><td><Simbolo tex={s} /></td><td>{t(d)}</td><td>{t(u)}</td></tr>)}</tbody></table>
      </div>

      <h3 id="met-equacoes">{t(MET.hEquacoes)}</h3>
      {MET.equacoes.map(eq => <section key={eq.titulo} className="pc-met-equacao" aria-label={t(eq.titulo)}>
        <h4>{t(eq.titulo)}</h4>
        {eq.tex.map(x => <Formula key={x} tex={x} n={++n} />)}
        <p><Rico s={t(eq.texto)} /></p>
      </section>)}

      <h3 id="met-parametros">{t(MET.hParametros)}</h3>
      <div className="pc-sal-rolagem" tabIndex={0} role="region" aria-label={t(MET.hParametros)}>
        <table className="pc-sal-tabela"><thead><tr>{MET.cabParametros.map(c => <th key={c} scope="col">{t(c)}</th>)}</tr></thead>
          <tbody>{MET.parametros.map(([s, d, v, f, g]) => <tr key={s}><td><Simbolo tex={s} /></td><td>{t(d)}</td><td>{t(v, med)}</td><td>{t(f)}</td><td>{g}</td></tr>)}</tbody></table>
      </div>

      <h3 id="met-dados">{t(MET.hDados)}</h3>
      <ul className="pc-sal-lista">{MET.dados.map(x => <li key={x}>{t(x)}</li>)}</ul>

      <h3 id="met-equipes">{t(MET.hEquipes)}</h3>
      <p>{t(MET.equipes)}</p>
      <div className="pc-sal-rolagem" tabIndex={0} role="region" aria-label={t(MET.hEquipes)}>
        <table className="pc-sal-tabela pc-met-equipes"><thead><tr>{MET.cabEquipes.map(c => <th key={c} scope="col">{t(c)}</th>)}</tr></thead>
          <tbody>{Object.entries(EQUIPES_GOV).map(([op, eq]) => <tr key={op}>
            <th scope="row">{t(op)}</th><td>{eq.meses ?? t(MET.continua)}</td><td>{pessoasDaEquipe(eq)}</td>
            <td>{num(eq.papeis.reduce((s, p) => s + p.qtd * p.dedicacao, 0))}</td>
            <td>{eq.papeis.map(p => t(p.papel) + (PAPEIS_ESPECIALISTA.has(p.papel) ? '*' : '') + ' (G' + p.perfil + ') ' + num(p.qtd) + ' × ' + num(p.dedicacao)).join('; ')}</td>
          </tr>)}</tbody></table>
      </div>
      <p><a href={href.esforcos()}>{t('Ver as equipes de referência')}</a> · <a href={href.salarios()}>{t('Ver salários e encargos por país')}</a></p>

      <h3 id="met-soberana">{t(MET.hSoberana)}</h3>
      <p>{t(MET.soberana)}</p>
      <div className="pc-sal-rolagem" tabIndex={0} role="region" aria-label={t(MET.hSoberana)}>
        <table className="pc-sal-tabela"><thead><tr>{MET.cabSoberana.map(c => <th key={c} scope="col">{t(c)}</th>)}</tr></thead>
          <tbody>{CASOS_SOBERANA.map(c => { const m = soberanaNacional(paisSoberana(c.iso, c.populacao * 1000))!.capexUSD;
            return <tr key={c.iso}><th scope="row">{t(c.pais)}</th><td>{t(NOME_GRUPO_FMI[c.grupo])}</td><td>{num(c.populacao)}</td><td>{new Intl.NumberFormat(loc, { style: 'currency', currency: c.moeda, notation: 'compact', maximumFractionDigits: 2 }).format(c.investimento)}</td>
              <td>{num(c.usd / 1e6)}</td><td>{num(m / 1e6)}</td><td>{c.usado ? num(m / c.usd) : t(MET.foraCalibracao)}</td>
              <td><a href={c.fonte.url} target="_blank" rel="noopener noreferrer">{t(c.nota)}</a></td></tr>; })}</tbody></table>
      </div>

      <h3 id="met-incertezas">{t(MET.hIncertezas)}</h3>
      {MET.incertezas.map(x => <p key={x}>{t(x)}</p>)}

      <h3 id="met-graus">{t(MET.hGraus)}</h3>
      <p>{t(MET.graus)}</p>

      <h3 id="met-refs">{t(MET.hRefs)}</h3>
      <ul className="pc-met-refs">{MET.refs.map(([r, u]) => <li key={u}>{t(r)} <a href={u} target="_blank" rel="noopener noreferrer">{u}</a></li>)}</ul>

      <p><Button variant="secondary" onClick={() => history.length > 1 ? history.back() : (location.hash = href.plano())}>{t('Voltar')}</Button></p>
    </section>
  </Shell>;
}
