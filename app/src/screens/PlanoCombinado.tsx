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
import { totalConhecido, orcamentoV16 } from '../percurso/orcamentoV016';
import { orcamentoEducacao, nomeDesafio } from '../percurso/educacaoV20';
import { partesTelaEd } from '../store';
import { nomePais, paisDoCaso, prioridadesNoCombinado } from '../domain';
import { Shell } from './Shell';
import { PlanoGov, PlanoLit } from './Governanca';
import { PlanoEducacao } from './EducacaoV20';
import { EquivalenteUSD } from './EquivalenteUSD';
import './educacaoV20.css';

const r2 = (v: number) => Math.round(v * 100) / 100;
const ir = (id: string) => (ev: { preventDefault: () => void }) => { ev.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

export function PlanoCombinado() {
  const s: CasoStore = useCaso();
  // v022.1: duas ou três prioridades (governança, educando sobre a IA, educação com e sem IA), na ordem do fluxo
  const pr = prioridadesNoCombinado(s.ctx), temGov = pr.includes('governar'), temLit = pr.includes('sobre'), temEd = pr.includes('com');
  const parte = (o: any) => { const T = totalConhecido(o), K = Number(o.capex) || 0, U = Number(o.uso) || 0; return { total: T, k: K, u: U, x: r2(T - K - U), existente: Number(o.existentes) || 0 }; };
  const zero = { total: 0, k: 0, u: 0, x: 0, existente: 0 };
  const g: any = temGov ? orcamentoGovernanca(s) : null, l: any = temLit ? orcamentoV16(s, 'letramento') : null, e = temEd ? orcamentoEducacao(s) : null;
  const moeda = String(e?.moeda || g?.moeda || l?.moeda || s.moeda?.cod || 'USD');
  const f = (v: number) => formatarMoedaEst(v, moeda);
  const pg = g ? parte(g) : zero, pl = l ? parte(l) : zero;
  const alt = (a: 'com' | 'sem') => { const x = e ? e[a] : zero; return { total: r2(pg.total + pl.total + x.total), k: r2(pg.k + pl.k + x.k), x: r2(pg.x + pl.x + x.x), u: r2(pg.u + pl.u + x.u), existente: r2(pg.existente + pl.existente + x.existente) }; };
  const com = alt('com'), sem = alt('sem');
  const lugar = String(s.ctx.local || '').trim(), pais = s.caso?.pais ? nomePais(paisDoCaso(s.caso)) : '';
  const faltam = telasAtivas(s).filter(q => !telaRespondida(s, q));
  const nomeTela = (id: string) => { const pt = partesTelaEd(id); return t(CURTO[id] || id) + (pt ? ' · ' + nomeDesafio(pt.d) : ''); };
  const linha = (rot: string, a: number, b: number, forte = false) => <tr key={rot} className={forte ? 'ed-total' : undefined}><th scope="row">{rot}</th><td>{f(a)}</td>{temEd ? <td>{f(b)}</td> : null}</tr>;
  const nomes = [temGov ? t('Governança') : '', temLit ? t('Educando sobre a IA') : '', temEd ? t('Educação com e sem IA') : ''].filter(Boolean);
  const titulo = temGov && temEd && !temLit ? t('Plano do programa: governança e educação com e sem IA') : t('Plano do programa: {p}', { p: nomes.join(' · ') });
  const secoes: [string, string][] = [...(temGov ? [['plano-governanca', t('Governança')] as [string, string]] : []), ...(temLit ? [['plano-letramento', t('Educando sobre a IA')] as [string, string]] : []), ...(temEd ? [['plano-educacao', t('Educação com e sem IA')] as [string, string]] : [])];
  return <Shell plano={false}>
    <div className="ed-plano">
      <h1>{titulo}</h1>
      <p className="pc-lead">{[lugar, pais].filter(Boolean).join(' · ')}</p>
      {faltam.length ? <Alert kind="atencao" title={t('Respostas que faltam')}><ul>{faltam.map(q => <li key={q.id}><a href={href.pergunta(q.capitulo, q.id)}>{nomeTela(q.id)}</a></li>)}</ul></Alert> : null}
      {/* v022.1: resumo do investimento por prioridade */}
      <ResumoInvestimento s={s} />
      <h2>{t('Total do programa')}</h2>
      <div className="ed-rolo"><table className="ed-tabela ed-tabela--num"><thead><tr><th></th>{temEd ? <><th>{t('Com IA na educação')}</th><th>{t('Sem IA na educação')}</th></> : <th>{t('Total')}</th>}</tr></thead><tbody>
        {temGov ? linha(t('Governança'), pg.total, pg.total) : null}
        {temLit ? linha(t('Educando sobre a IA'), pl.total, pl.total) : null}
        {e ? linha(t('Educação com e sem IA'), e.com.total, e.sem.total) : null}
        {linha(t('Custo total'), com.total, sem.total, true)}
        {linha('CapEx', com.k, sem.k)}
        {linha('OpEx', com.x, sem.x)}
        {linha(t('Utilidades (consumo)'), com.u, sem.u)}
        {linha(t('Desembolso novo'), r2(com.total - com.existente), r2(sem.total - sem.existente))}
      </tbody></table></div>
      {temEd ? <><EquivalenteUSD total={com.total} moeda={moeda} rotulo={t('Com IA na educação')} /><EquivalenteUSD total={sem.total} moeda={moeda} rotulo={t('Sem IA na educação')} /></>
        : <EquivalenteUSD total={com.total} moeda={moeda} rotulo={t('Total')} />}
      <p className="pc-nota">{temEd ? t('A governança entra igual nas duas colunas; a diferença entre elas é a da educação com IA e sem IA. Cada prioridade usa as suas fases e os seus custos adicionais, mostrados nas seções abaixo.')
        : t('Cada prioridade usa as suas fases e os seus custos adicionais, mostrados nas seções abaixo.')}</p>
      {temLit && temEd ? <Alert kind="info" title={t('Formação de professores nas duas prioridades')}>{t('Educando sobre a IA e Educação com e sem IA têm cada uma a sua formação de professores. Se forem os mesmos professores, revise as quantidades para não contar a mesma formação duas vezes.')}</Alert> : null}
      <nav className="pc-nota" aria-label={t('Seções do plano')}>{secoes.map(([id, nome], i) => <span key={id}>{i ? ' · ' : ''}<a href={href.plano()} onClick={ir(id)}>{nome}</a></span>)}</nav>
      {temGov ? <><hr /><PlanoGov s={s} embutido /></> : null}
      {temLit ? <><hr /><PlanoLit s={s} embutido /></> : null}
      {temEd ? <><hr /><PlanoEducacao s={s} embutido /></> : null}
    </div>
  </Shell>;
}
