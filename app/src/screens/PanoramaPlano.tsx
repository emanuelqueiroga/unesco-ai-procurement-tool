import { Governanca } from './Governanca';
import { Letramento } from './Letramento';
import { Educacao } from './Educacao';
import { Plano } from './Plano';
import { useEffect } from 'react';
import { useCaso } from '../store';
import { LOC, paisesOrdenados } from '../domain';
import { Button } from '../ui';
import { abrirFrente,estadoDaFrente,frentesDoPlano,progressoFrente,frenteAtual, type FrenteId } from '../percurso/frentes';
import { orcamentoGovernanca } from '../percurso/governanca';
import { linhasTotais } from '../percurso/estimativasOrcamento';
import './estimativas.css';
import { orcamentoLetramento } from '../percurso/letramento';
import { orcamentoEd } from '../percurso/pedagogico';
import { href,ir } from '../percurso/rota';
import { t } from '../percurso/textos';
import { Shell } from './Shell';
export const rotuloEstadoFrente=(estado:string)=>t(estado==='completa'?'Concluída':estado==='andamento'?'Em andamento':'Não iniciada');
export function PanoramaPlano(){
 const s=useCaso(),frentes=frentesDoPlano(s),pais=(paisesOrdenados() as any[]).find(p=>p.iso3===s.caso.pais)?.nome;
 return <Shell nav={false} plano={false} contexto={t('Plano nacional')}><div className="pc-ux-panorama">
  <div><p className="pc-kicker">{t('Plano nacional')}</p><h1>{t('Seu plano de IA na educação')}</h1><p className="pc-lead">{t('Acompanhe as frentes e abra o resumo de cada uma.')}</p></div>
  <section className="pc-ux-contexto"><div><h2>{t('Contexto compartilhado')}</h2><p>{pais||t('País a definir')}</p></div><div className="pc-botoes"><Button size="sm" variant="secondary" href={href.pergunta(1,'local')}>{t('Revisar país')}</Button><Button size="sm" variant="secondary" href={href.pergunta(1,'prioridades')}>{t('Revisar prioridades')}</Button></div></section>
  <div className="pc-ux-frentes-lista">{frentes.map(f=>{
   const view=estadoDaFrente(s,f.id),p=progressoFrente(s,f.id);
   const o=f.id==='governanca'?orcamentoGovernanca(view):f.id==='letramento'?orcamentoLetramento(view):f.id==='educacao'?orcamentoEd(view):null;
   return <section className="pc-ux-frente-card" key={f.id}>
    <div className="pc-ux-frente-cab"><h2>{t(f.titulo)}</h2><span className={'pc-ux-status pc-ux-status--'+p.estado}>{rotuloEstadoFrente(p.estado)}</span></div>
    <p>{t(f.descricao)}</p><p className="pc-nota">{t('{n} de {total} telas desta frente preenchidas',{n:p.feitas,total:p.total})}</p>
    <progress value={p.feitas} max={p.total||1} aria-label={t('Preenchimento: {nome}',{nome:t(f.titulo)})}/>
    {o?<div className="pc-ux-subtotal"><span>{t('Orçamento desta frente')} · {o.moeda}</span><dl className="pc-est-panorama">{linhasTotais(o).map((l,i)=><div key={i} className={l.destaque?'pc-est-total':undefined}><dt>{l.rotulo}</dt><dd>{l.valor}</dd></div>)}</dl></div>:<p className="pc-nota">{t('Consulte os valores no resumo do projeto.')}</p>}
    <div className="pc-botoes"><Button href={href.frente(f.id)}>{t(p.estado==='completa'?'Revisar respostas':'Continuar esta frente')}</Button><Button variant="secondary" href={href.frente(f.id,true)}>{t('Resumo desta frente')}</Button></div>
   </section>;
  })}</div>
  <p className="pc-nota">{t('O progresso indica o preenchimento das telas. Revise as informações a levantar antes de aprovar o plano.')}</p>
  <p className="pc-ux-escopo-recursos">{t('Os valores pertencem a cada frente. Custos compartilhados ficam referenciados na frente de origem. Consulte o período e a moeda em cada resumo.')} {t('Estimativas de referência são ilustrativas e aparecem separadas dos valores informados.')}</p>
 </div></Shell>;
}
export function EntradaFrente({id,resumo}:{id:FrenteId;resumo:boolean}){
 const s=useCaso(),permitida=frentesDoPlano(s).some(f=>f.id===id),ativa=frenteAtual(s)===id;
 useEffect(()=>{
  if(!permitida){window.location.replace(href.panorama());return;}
  if(resumo){if(!ativa)useCaso.getState().responder('frenteAtiva',id);}
  else {const destino=abrirFrente(id);window.location.replace(destino||href.panorama());}
 },[id,resumo,permitida,ativa]);
 if(resumo&&permitida&&ativa){
  const rota={tipo:'plano',pagina:'resumo'} as const;
  return id==='governanca'?<Governanca rota={rota}/>:id==='letramento'?<Letramento rota={rota}/>:id==='educacao'?<Educacao rota={rota}/>:<Plano pagina="resumo"/>;
 }
 return <p className="pc-ux-carregando" role="status">{t('Abrindo a frente…')}</p>;
}
