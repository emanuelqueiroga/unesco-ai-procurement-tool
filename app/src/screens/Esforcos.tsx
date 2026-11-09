// v018: página "Equipes de referência" — a equipe que cada opção de pessoal da governança traz preenchida: quem lidera,
// os especialistas e o apoio, com pessoas, dedicação, perfil (ISCO-08, que define o salário do país) e o que cada um faz;
// o prazo, o porquê do tamanho, o caso real citado (quando há) e o grau de confiança.
import { useEffect } from 'react';
import { Button } from '../ui';
import { Shell } from './Shell';
import { t } from '../percurso/textos';
import { href } from '../percurso/rota';
import { CATEGORIAS } from '../domain/catalogo_v016.js';
import { FONTES_GOV, NOME_PERFIL, chaveOpcao } from '../percurso/custosV017';
import { EQUIPES_GOV, pessoasDaEquipe } from '../percurso/equipesGov';
import { LOC } from '../domain';
import './salarios.css';

const n2 = (v: number) => new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 2 }).format(v);

export function Esforcos({ chave }: { chave?: string }) {
  // as categorias sem opções (2.1) usam o próprio nome como opção
  const linhas = (CATEGORIAS.governanca as any[]).flatMap(c => (c.opcoes.length ? c.opcoes : [c.nome]).filter((o: string) => EQUIPES_GOV[o]).map((o: string) => ({ cat: c.n + ' ' + t(c.nome), opcao: o })));
  useEffect(() => { if (chave) requestAnimationFrame(() => document.getElementById('esf-' + chave)?.scrollIntoView({ block: 'start' })); }, [chave]);
  return <Shell nav={false} plano={false}>
    <section className="pc-sal" aria-labelledby="esf-titulo">
      <h1 id="esf-titulo">{t('Equipes de referência')}</h1>
      <p className="pc-lead">{t('Quando você marca uma opção de pessoal da governança, a ferramenta já preenche a equipe e o prazo. Esta página mostra cada equipe: quem faz o quê, por quanto tempo e por quê.')}</p>
      <h2>{t('Como as equipes foram montadas')}</h2>
      <ul className="pc-sal-lista">
        <li>{t('Cada equipe foi pensada como um líder montaria o time: uma coordenação, os especialistas de cada área que o trabalho exige e o apoio (técnico e administrativo).')}</li>
        <li>{t('Dedicação é a parte do tempo de cada pessoa no trabalho: 100% = tempo integral; 50% = metade do tempo. A coordenação costuma ter dedicação parcial nos trabalhos menores.')}</li>
        <li>{t('O perfil (grande grupo da ISCO-08) define o salário usado: diretores e gerentes, profissionais, técnicos de nível médio ou apoio administrativo. O salário de cada perfil vem do ILOSTAT para o país, com os encargos do empregador.')} <a href={href.salarios()}>{t('Ver salários e encargos por país')}</a></li>
        <li>{t('Trabalho pontual tem prazo (elaborar uma norma, uma diretriz). Operação contínua dura todo o plano (supervisão, secretaria).')}</li>
        <li>{t('São convenções da ferramenta (grau C), não valores medidos: governos raramente publicam o pessoal e o tempo usados para elaborar uma norma. Onde há caso real publicado, ele aparece para conferir a ordem de grandeza.')}</li>
        <li>{t('Na tela, em "Ajustar a equipe", você pode trocar as pessoas e o custo mensal de cada papel, e o prazo; o valor digitado passa a valer no lugar da referência.')}</li>
      </ul>
      <h2>{t('Opções da governança')}</h2>
      {linhas.map(({ cat, opcao }) => {
        const e = EQUIPES_GOV[opcao], k = chaveOpcao(opcao), f = e.base ? FONTES_GOV[e.base] : null;
        const integral = e.papeis.reduce((n, p) => n + p.qtd * p.dedicacao, 0);
        return <article key={k} id={'esf-' + k} className={'pc-esf' + (k === chave ? ' pc-sal-atual' : '')} aria-labelledby={'esf-h-' + k}>
          <h3 id={'esf-h-' + k}>{t(opcao)}<span className="pc-sal-fonte">{cat}</span></h3>
          <p className="pc-esf-meta">{e.meses ? t('Trabalho pontual: {m} meses', { m: e.meses }) : t('Operação contínua: durante todo o plano')} · {t('{n} pessoas ({e} em tempo integral)', { n: n2(pessoasDaEquipe(e)), e: n2(integral) })} · {t('grau C')}</p>
          <div className="pc-sal-rolagem" tabIndex={0} role="region" aria-label={t(opcao)}>
            <table className="pc-sal-tabela">
              <thead><tr><th scope="col">{t('Papel')}</th><th scope="col">{t('Pessoas')}</th><th scope="col">{t('Dedicação')}</th><th scope="col">{t('Perfil')}</th><th scope="col">{t('O que faz')}</th></tr></thead>
              <tbody>{e.papeis.map(p => <tr key={p.papel}>
                <th scope="row">{t(p.papel)}</th><td>{n2(p.qtd)}</td><td>{Math.round(p.dedicacao * 100)}%</td>
                <td>{t(NOME_PERFIL[p.perfil])}</td><td>{t(p.faz)}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <p><b>{t('Por que esse tamanho e esse prazo')}:</b> {t(e.porque)}</p>
          <p><b>{t('Caso real')}:</b> {f ? <a href={f.url!} target="_blank" rel="noopener noreferrer">{t(f.titulo)}</a> : t('Sem caso publicado')}</p>
        </article>;
      })}
      <p><Button variant="secondary" onClick={() => history.length > 1 ? history.back() : (location.hash = href.plano())}>{t('Voltar')}</Button></p>
    </section>
  </Shell>;
}
