// v018: página "Esforços de referência" — de onde vêm as pessoas e os meses que as opções da governança trazem
// preenchidos: a equipe pensada, o porquê do valor, o caso real citado (quando há) e o grau de confiança.
import { useEffect } from 'react';
import { Button } from '../ui';
import { Shell } from './Shell';
import { t } from '../percurso/textos';
import { href } from '../percurso/rota';
import { CATEGORIAS } from '../domain/catalogo_v016.js';
import { ESFORCO_GOV, FONTES_GOV, chaveOpcao, PERFIL_GOV } from '../percurso/custosV017';
import { LOC } from '../domain';
import './salarios.css';

const n2 = (v: number) => new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 2 }).format(v);

export function Esforcos({ chave }: { chave?: string }) {
  // as categorias sem opções (2.1, 3.2) usam o próprio nome como opção
  const linhas = (CATEGORIAS.governanca as any[]).flatMap(c => (c.opcoes.length ? c.opcoes : [c.nome]).filter((o: string) => ESFORCO_GOV[o]).map((o: string) => ({ cat: c.n + ' ' + t(c.nome), opcao: o })));
  useEffect(() => { if (chave) requestAnimationFrame(() => document.getElementById('esf-' + chave)?.scrollIntoView({ block: 'center' })); }, [chave]);
  return <Shell nav={false} plano={false}>
    <section className="pc-sal" aria-labelledby="esf-titulo">
      <h1 id="esf-titulo">{t('Esforços de referência')}</h1>
      <p className="pc-lead">{t('Quando você marca uma opção de pessoal da governança, a ferramenta já preenche quantas pessoas e por quantos meses. Esta página mostra de onde vem cada número.')}</p>
      <h2>{t('O que são')}</h2>
      <ul className="pc-sal-lista">
        <li>{t('São convenções da ferramenta (grau C): uma estimativa do tamanho da equipe e do tempo de trabalho, não um valor medido. Governos raramente publicam quanto pessoal e tempo usaram para elaborar uma norma ou uma diretriz.')}</li>
        <li>{t('Onde há caso real publicado, ele aparece na coluna "Caso real" e serve para conferir a ordem de grandeza, não para calcular o valor.')}</li>
        <li>{t('Trabalho pontual = pessoas × meses (elaborar uma norma, uma diretriz). Operação contínua = pessoas em tempo integral durante todo o plano (supervisão, secretaria).')}</li>
        <li>{t('O custo por pessoa vem do salário do país (ILOSTAT) e dos encargos; veja a página de salários.')} <a href={href.salarios()}>{t('Ver salários e encargos por país')}</a></li>
        <li>{t('Os números podem ser trocados em cada opção; o valor digitado passa a valer no lugar da referência.')}</li>
      </ul>
      <h2>{t('Opções da governança')}</h2>
      <div className="pc-sal-rolagem" tabIndex={0} role="region" aria-label={t('Esforços de referência')}>
        <table className="pc-sal-tabela">
          <thead><tr><th scope="col">{t('Opção')}</th><th scope="col">{t('Esforço')}</th><th scope="col">{t('Equipe pensada')}</th><th scope="col">{t('Por que esse valor')}</th><th scope="col">{t('Caso real')}</th><th scope="col">{t('Grau')}</th></tr></thead>
          <tbody>{linhas.map(({ cat, opcao }) => {
            const e = ESFORCO_GOV[opcao], k = chaveOpcao(opcao), f = e.base ? FONTES_GOV[e.base] : null;
            return <tr key={k} id={'esf-' + k} className={k === chave ? 'pc-sal-atual' : ''}>
              <th scope="row">{t(opcao)}<span className="pc-sal-fonte">{cat}</span></th>
              <td>{e.meses ? t('{p} pessoas × {m} meses', { p: n2(e.qtd), m: e.meses }) : t('{p} pessoas em tempo integral', { p: n2(e.qtd) })}
                <span className="pc-sal-fonte">{e.meses ? t('trabalho pontual') : t('operação contínua')} · {PERFIL_GOV[opcao] === 1 ? t('diretores e gerentes (ISCO 1)') : t('profissionais (ISCO 2)')}</span></td>
              <td>{t(e.equipe)}</td>
              <td>{t(e.porque)}</td>
              <td>{f ? <a href={f.url!} target="_blank" rel="noopener noreferrer">{t(f.titulo)}</a> : t('Sem caso publicado')}</td>
              <td>C</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <p><Button variant="secondary" onClick={() => history.length > 1 ? history.back() : (location.hash = href.plano())}>{t('Voltar')}</Button></p>
    </section>
  </Shell>;
}
