// v018: página "Salários de referência por país" — de onde vem o custo de pessoal da governança. Mostra, por país, o
// salário médio mensal dos dois perfis usados (ILOSTAT, grandes grupos 1 e 2 da ISCO-08), como cada valor foi obtido
// (dado do país ou mediana de países parecidos) e o fator de encargos (SSA e ISSA), com o link de cada fonte.
import { useMemo, useState } from 'react';
import { useCaso } from '../store';
import { Button, TextField } from '../ui';
import { Shell } from './Shell';
import { t } from '../percurso/textos';
import { href } from '../percurso/rota';
import { SALARIOS_ILO, FONTES_ILO, REGIOES_WB, RENDA_WB, URL_ILOSTAT, URL_ILOSTAT_API, URL_WB_PAISES, type Perfil } from '../percurso/salariosPais';
import { CONTRIBUICAO_PATRONAL, encargosDoPais } from '../percurso/encargosPais';
import { nomeDoPaisIso, NOME_PERFIL } from '../percurso/custosV017';
import { EQUIPES_GOV } from '../percurso/equipesGov';
import { formatarMoedaEst } from '../percurso/estimativasOrcamento';
import { LOC } from '../domain';
import './salarios.css';

const URL_SSA = 'https://www.ssa.gov/policy/docs/progdesc/ssptw/';
const n2 = (v: number) => new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 2 }).format(v);

function Valor({ p }: { p: Perfil | null }) {
  if (!p) return <>—</>;
  const [ano, lcu, usd, metodo] = p;
  return <span className="pc-sal-valor">
    {metodo === 'd' && lcu !== null ? <span>{n2(lcu)} <span className="pc-sal-moeda">{t('moeda local')}</span></span> : null}
    {usd !== null ? <span className={metodo === 'd' && lcu !== null ? 'pc-sal-usd' : ''}>{formatarMoedaEst(usd, 'USD')}</span> : null}
    {ano ? <span className="pc-sal-ano">{ano}</span> : null}
  </span>;
}

function Metodo({ iso }: { iso: string }) {
  const e = SALARIOS_ILO[iso], p = e.p2 || e.p1;
  if (!p) return <>—</>;
  if (p[3] === 'd') return <>{t('Dado do país (ILOSTAT)')}{e.f !== null ? <span className="pc-sal-fonte">{FONTES_ILO[e.f]}</span> : null}</>;
  const grupo = p[3] === 'r' ? t(REGIOES_WB[e.r!]) + ', ' + t(RENDA_WB[e.g!]) : t(RENDA_WB[e.g!] || '');
  return <>{t('Estimado: mediana de {n} países com dado no ILOSTAT', { n: p[4] || 0 })}<span className="pc-sal-fonte">{grupo}</span></>;
}

export function Salarios({ pais }: { pais?: string }) {
  const s = useCaso();
  const doCaso = pais || (s.caso?.pais && s.caso.pais !== 'outro' ? s.caso.pais : '');
  const [busca, setBusca] = useState('');
  const lista = useMemo(() => Object.keys(SALARIOS_ILO).map(iso => ({ iso, nome: nomeDoPaisIso(iso) })).sort((a, b) => a.nome.localeCompare(b.nome, String(LOC()))), [s.lang]);
  const q = busca.trim().toLocaleLowerCase();
  const filtrada = lista.filter(x => !q || x.nome.toLocaleLowerCase().includes(q) || x.iso.toLowerCase() === q);
  const destaque = doCaso && SALARIOS_ILO[doCaso] ? doCaso : '';
  const enc = destaque ? encargosDoPais(destaque) : null;
  // os papéis das equipes de referência, por perfil (sem repetição); no grupo 2 entram também as opções de pessoal da 3.1
  const papeis = (g: 1 | 2 | 3 | 4) => [...new Set(Object.values(EQUIPES_GOV).flatMap(e => e.papeis.filter(p => p.perfil === g).map(p => p.papel)))];
  const cargos31 = ['Profissionais jurídicos', 'Pessoal de governança de IA', 'Especialistas em IA e educação'];
  const cabecalho = <thead><tr><th scope="col">{t('País')}</th><th scope="col">{t('Diretores e gerentes (ISCO 1), por mês')}</th><th scope="col">{t('Profissionais (ISCO 2), por mês')}</th><th scope="col">{t('Técnicos de nível médio (ISCO 3), por mês')}</th><th scope="col">{t('Apoio administrativo (ISCO 4), por mês')}</th><th scope="col">{t('Como foi obtido')}</th><th scope="col">{t('Fator de encargos')}</th></tr></thead>;
  const linha = (iso: string, nome: string) => {
    const e = SALARIOS_ILO[iso], c = CONTRIBUICAO_PATRONAL[iso];
    return <tr key={iso} id={'sal-' + iso} className={iso === destaque ? 'pc-sal-atual' : ''}>
      <th scope="row">{nome}</th>
      <td><Valor p={e.p1} /></td>
      <td><Valor p={e.p2} /></td>
      <td><Valor p={e.p3} /></td>
      <td><Valor p={e.p4} /></td>
      <td className="pc-sal-metodo"><Metodo iso={iso} /></td>
      <td>{c ? <>{n2(1 + c[0] / 100)}<span className="pc-sal-fonte">{n2(c[0])}%</span></> : '—'}</td>
    </tr>;
  };
  return <Shell nav={false} plano={false}>
    <section className="pc-sal" aria-labelledby="sal-titulo">
      <h1 id="sal-titulo">{t('Salários de referência por país')}</h1>
      <p className="pc-lead">{t('O custo de pessoal da governança é o salário médio mensal do país para o perfil do cargo, multiplicado pelos encargos do empregador. Os valores foram fixados na ferramenta a partir das fontes abaixo.')}</p>
      {destaque ? <div className="pc-sal-caso">
        <h2>{t('Este país')}</h2>
        <div className="pc-sal-rolagem"><table className="pc-sal-tabela pc-sal-tabela--um">{cabecalho}<tbody>{linha(destaque, nomeDoPaisIso(destaque))}</tbody></table></div>
        {!enc ? <p className="pc-nota">{t('Sem dado de encargos para este país: o custo usa só o salário.')}</p> : null}
      </div> : null}
      <h2>{t('Cargos e perfis')}</h2>
      <p>{t('Cada papel das equipes de referência usa o salário de um destes perfis.')} <a href={href.esforcos()}>{t('Ver as equipes de referência')}</a></p>
      <ul className="pc-sal-lista">
        {([1, 2, 3, 4] as const).map(g => <li key={g}><b>{t(NOME_PERFIL[g])}</b>: {[...papeis(g), ...(g === 2 ? cargos31 : [])].map(c => t(c)).join('; ')}.</li>)}
      </ul>
      <h2>{t('Como cada valor foi obtido')}</h2>
      <ul className="pc-sal-lista">
        <li>{t('Dado do país: salário médio mensal dos empregados por ocupação, total dos sexos, último ano disponível desde 2015 (ILOSTAT, OIT). Grau A.')}</li>
        <li>{t('País sem dado: mediana em US$ dos países com dado da mesma região e do mesmo grupo de renda do Banco Mundial (pelo menos 3 países); sem isso, mediana do mesmo grupo de renda. Grau B.')}</li>
        <li>{t('Na conta, a ferramenta usa o valor em moeda local quando o plano está na moeda do país; nos outros casos, o valor em US$ convertido pelo câmbio do plano. Os valores não são corrigidos pela inflação desde o ano do dado.')}</li>
        <li>{t('Encargos: 1 + contribuição patronal à seguridade social, em % da folha (SSA e ISSA, 2018–2019). Não incluem 13º, benefícios nem custos indiretos.')}</li>
      </ul>
      <h2>{t('Fontes')}</h2>
      <ul className="pc-sal-lista">
        <li><a href={URL_ILOSTAT} target="_blank" rel="noopener noreferrer">{t('ILOSTAT (OIT): Average monthly earnings of employees by sex, occupation and currency')}</a> · <a href={URL_ILOSTAT_API} target="_blank" rel="noopener noreferrer">{t('consulta usada (API oficial da OIT)')}</a></li>
        <li><a href={URL_WB_PAISES} target="_blank" rel="noopener noreferrer">{t('Banco Mundial: regiões e grupos de renda dos países')}</a></li>
        <li><a href={URL_SSA} target="_blank" rel="noopener noreferrer">{t('Social Security Programs Throughout the World (SSA e ISSA), tabela 4')}</a></li>
      </ul>
      <h2>{t('Todos os países')}</h2>
      <div className="pc-sal-busca"><TextField label={t('Buscar país')} value={busca} onChange={setBusca} /></div>
      <div className="pc-sal-rolagem" tabIndex={0} role="region" aria-label={t('Salários de referência por país')}>
        <table className="pc-sal-tabela">
          <caption className="pc-sr">{t('Salário médio mensal por perfil, método e encargos, por país')}</caption>
          {cabecalho}
          <tbody>{filtrada.map(x => linha(x.iso, x.nome))}</tbody>
        </table>
      </div>
      <p><Button variant="secondary" onClick={() => history.length > 1 ? history.back() : (location.hash = href.plano())}>{t('Voltar')}</Button></p>
    </section>
  </Shell>;
}
