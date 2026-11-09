// v018: página "Como o custo é calculado" (governança) — o modelo de custeio em uma página: a estrutura do custo, a
// conta de cada tipo de opção, os custos adicionais, os limites, e o download da nota técnica e da planilha.
import { Button } from '../ui';
import { Shell } from './Shell';
import { t } from '../percurso/textos';
import { href } from '../percurso/rota';
import { getLang } from '../domain/i18n.js';
import { MET, NOTA_PDF, PLANILHA } from '../percurso/metodologiaGov';
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
      {no(c0, 281, w0, true, t(MET.fTotal), 'C = D + V + O + T')}
      {no(c1, 146, w1, false, t(MET.fDireto), t(MET.fDireto2))}
      {no(c1, 296, w1, false, t(MET.fViagens), '25% × D')}
      {no(c1, 356, w1, false, t(MET.fOverhead), '15% × (D + V)')}
      {no(c1, 416, w1, false, t(MET.fTaxa), '7% × (D + V)')}
      {no(c2, 56, w2, true, t(MET.fEquipe), t(MET.fEquipe2))}
      {no(c2, 116, w2, false, t(MET.fPessoal), '3.1: n × c₂ × H')}
      {no(c2, 176, w2, false, t(MET.fForm), t(MET.fForm2))}
      {no(c2, 236, w2, false, t(MET.fInf), t(MET.fInf2))}
      {no(c3, 56, w3, false, t(MET.fMeses), t(MET.fMeses2))}
      {no(c3, 116, w3, false, t(MET.fPessoas), t(MET.fPessoas2))}
      {no(c3, 176, w3, false, t(MET.fMensal), 'w (ILOSTAT) × (1 + e)')}
    </svg>
  </div>;
}

export function Metodologia() {
  const l: 'pt' | 'en' = getLang() === 'pt' ? 'pt' : 'en';
  return <Shell nav={false} plano={false}>
    <section className="pc-sal pc-met" aria-labelledby="met-titulo">
      <h1 id="met-titulo">{t('Como o custo é calculado')}</h1>
      <p className="pc-lead">{t(MET.lead)}</p>
      <p className="pc-met-arquivos">
        <a className="pc-met-baixar" href={NOTA_PDF[l]} download>{t('Baixar a nota técnica (PDF)')}</a>
        <a className="pc-met-baixar" href={PLANILHA[l]} download>{t('Baixar a planilha de cálculo (Excel)')}</a>
      </p>
      <p className="pc-nota">{t(MET.arquivos)}</p>

      <h2>{t(MET.figura)}</h2>
      <FiguraCusto />

      <h2>{t(MET.hGeral)}</h2>
      <p className="pc-met-formula">C = D + V + O + T</p>
      <p>{t(MET.geral)}</p>

      <h2>{t(MET.hEquipe)}</h2>
      <p className="pc-met-formula">Cₒ = M × Σ (q × d × c) · c = w × (1 + e)</p>
      <p>{t(MET.equipe)}</p>
      <ul className="pc-sal-lista">{MET.equipeItens.map(x => <li key={x}>{t(x)}</li>)}</ul>
      <p><a href={href.esforcos()}>{t('Ver as equipes de referência')}</a> · <a href={href.salarios()}>{t('Ver salários e encargos por país')}</a></p>

      <h2>{t(MET.hDemais)}</h2>
      <ul className="pc-sal-lista">{MET.demais.map(([a, b]) => <li key={a}><b>{t(a)}:</b> {t(b)}</li>)}</ul>

      <h2>{t(MET.hAdic)}</h2>
      <p>{t(MET.adic)}</p>
      <div className="pc-sal-rolagem" tabIndex={0} role="region" aria-label={t(MET.hAdic)}>
        <table className="pc-sal-tabela">
          <tbody>{MET.adicItens.map(([a, b, c]) => <tr key={a}><th scope="row">{t(a)}</th><td className="pc-met-num">{b}</td><td>{t(c)}</td></tr>)}</tbody>
        </table>
      </div>

      <h2>{t(MET.hTotais)}</h2>
      <p>{t(MET.totais)}</p>

      <h2>{t(MET.hLimites)}</h2>
      <ul className="pc-sal-lista">{MET.limites.map(x => <li key={x}>{t(x)}</li>)}</ul>

      <p><Button variant="secondary" onClick={() => history.length > 1 ? history.back() : (location.hash = href.plano())}>{t('Voltar')}</Button></p>
    </section>
  </Shell>;
}
