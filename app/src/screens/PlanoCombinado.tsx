// v022.1: plano do percurso combinado (governança e educação com e sem IA). Abre com o total do programa nas duas
// alternativas (a governança entra igual nas duas; a educação com o valor com IA ou sem IA), separado em CapEx, OpEx e
// consumo, com o desembolso novo; depois vêm as seções da governança e da educação, como nos planos de cada uma.
// Tudo na mesma moeda do plano: nada de moedas diferentes é somado.
import { ResumoInvestimento } from './ResumoInvestimento';
import { useCaso, telasAtivas, telaRespondida, type CasoStore } from '../store';
import { Alert } from '../ui';
import { t, CURTO } from '../percurso/textos';
import { href } from '../percurso/rota';
import { formatarMoedaEst } from '../percurso/estimativasOrcamento';
import { orcamentoGovernanca } from '../percurso/governanca';
import { totalConhecido } from '../percurso/orcamentoV016';
import { orcamentoEducacao, nomeDesafio } from '../percurso/educacaoV20';
import { partesTelaEd } from '../store';
import { nomePais, paisDoCaso } from '../domain';
import { Shell } from './Shell';
import { PlanoGov } from './Governanca';
import { PlanoEducacao } from './EducacaoV20';
import { EquivalenteUSD } from './EquivalenteUSD';
import './educacaoV20.css';

const r2 = (v: number) => Math.round(v * 100) / 100;
const ir = (id: string) => (ev: { preventDefault: () => void }) => { ev.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

export function PlanoCombinado() {
  const s: CasoStore = useCaso();
  const g: any = orcamentoGovernanca(s), e = orcamentoEducacao(s), moeda = e.moeda || g.moeda;
  const f = (v: number) => formatarMoedaEst(v, moeda);
  const gT = totalConhecido(g), gK = Number(g.capex) || 0, gU = Number(g.uso) || 0, gX = r2(gT - gK - gU), gE = Number(g.existentes) || 0;
  const alt = (a: 'com' | 'sem') => { const x = e[a]; return { total: r2(gT + x.total), k: r2(gK + x.k), x: r2(gX + x.x), u: r2(gU + x.u), existente: r2(gE + x.existente) }; };
  const com = alt('com'), sem = alt('sem');
  const lugar = String(s.ctx.local || '').trim(), pais = s.caso?.pais ? nomePais(paisDoCaso(s.caso)) : '';
  const faltam = telasAtivas(s).filter(q => !telaRespondida(s, q));
  const nomeTela = (id: string) => { const pt = partesTelaEd(id); return t(CURTO[id] || id) + (pt ? ' · ' + nomeDesafio(pt.d) : ''); };
  const linha = (rot: string, a: number, b: number, forte = false) => <tr className={forte ? 'ed-total' : undefined}><th scope="row">{rot}</th><td>{f(a)}</td><td>{f(b)}</td></tr>;
  return <Shell plano={false}>
    <div className="ed-plano">
      <h1>{t('Plano do programa: governança e educação com e sem IA')}</h1>
      <p className="pc-lead">{[lugar, pais].filter(Boolean).join(' · ')}</p>
      {faltam.length ? <Alert kind="atencao" title={t('Respostas que faltam')}><ul>{faltam.map(q => <li key={q.id}><a href={href.pergunta(q.capitulo, q.id)}>{nomeTela(q.id)}</a></li>)}</ul></Alert> : null}
      {/* v022.1: resumo do investimento por prioridade */}
      <ResumoInvestimento s={s} />
      <h2>{t('Total do programa')}</h2>
      <div className="ed-rolo"><table className="ed-tabela ed-tabela--num"><thead><tr><th></th><th>{t('Com IA na educação')}</th><th>{t('Sem IA na educação')}</th></tr></thead><tbody>
        {linha(t('Governança'), gT, gT)}
        {linha(t('Educação com e sem IA'), e.com.total, e.sem.total)}
        {linha(t('Custo total'), com.total, sem.total, true)}
        {linha('CapEx', com.k, sem.k)}
        {linha('OpEx', com.x, sem.x)}
        {linha(t('Utilidades (consumo)'), com.u, sem.u)}
        {linha(t('Desembolso novo'), r2(com.total - com.existente), r2(sem.total - sem.existente))}
      </tbody></table></div>
      <EquivalenteUSD total={com.total} moeda={moeda} rotulo={t('Com IA na educação')} /><EquivalenteUSD total={sem.total} moeda={moeda} rotulo={t('Sem IA na educação')} />
      <p className="pc-nota">{t('A governança entra igual nas duas colunas; a diferença entre elas é a da educação com IA e sem IA. Cada prioridade usa as suas fases e os seus custos adicionais, mostrados nas seções abaixo.')}</p>
      <nav className="pc-nota" aria-label={t('Seções do plano')}><a href={href.plano()} onClick={ir('plano-governanca')}>{t('Governança')}</a> · <a href={href.plano()} onClick={ir('plano-educacao')}>{t('Educação com e sem IA')}</a></nav>
      <hr />
      <PlanoGov s={s} embutido />
      <hr />
      <PlanoEducacao s={s} embutido />
    </div>
  </Shell>;
}
