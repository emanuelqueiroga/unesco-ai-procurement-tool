import { Governanca } from './Governanca';
import { Letramento } from './Letramento';
import { Educacao } from './Educacao';
import { Plano } from './Plano';
import { useEffect, useState } from 'react';
import { consolidadoV16 } from '../percurso/consolidadoV016';
import { totalConhecido } from '../percurso/orcamentoV016';
import { formatarMoedaEst } from '../percurso/estimativasOrcamento';
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
function ConsolidadoV16(){
 const s=useCaso(),c=consolidadoV16(s),[ocupado,setOcupado]=useState(false),[erro,setErro]=useState('');
 if(!c.frentes.length)return null;
 const baixar=async()=>{setOcupado(true);setErro('');try{const m=await import('../plano/pdf_v016');const doc:any=await m.gerarPDFPlanoV16(s.estado());doc.save(m.nomeArquivoV16('plano'));}catch(e){console.error(e);setErro(t('Não foi possível gerar o PDF.'));}finally{setOcupado(false);}};
 return <section className="pv-consolidado" aria-labelledby="pv-consolidado-t">
  <h2 id="pv-consolidado-t">{t('Custo do plano (todas as frentes)')}</h2>
  {c.mesmaMoeda?<>
   <p className="pv-consolidado-total">{formatarMoedaEst(c.conhecido,c.moeda)}<span>{c.faltam===1?t('custo conhecido · 1 item a levantar'):c.faltam?t('custo conhecido · {n} itens a levantar',{n:c.faltam}):t('custo total')}</span></p>
   <dl className="pv-consolidado-lista"><div><dt>{t('Informado')}</dt><dd>{formatarMoedaEst(c.informado,c.moeda)}</dd></div><div><dt>{t('Estimado')}</dt><dd className="pv-matriz-est">{formatarMoedaEst(c.estimado,c.moeda)}</dd></div>{c.fases.map(f=><div key={f.id}><dt>{f.nome}</dt><dd>{formatarMoedaEst(f.valor,c.moeda)}</dd></div>)}</dl>
   <ul className="pv-consolidado-frentes">{c.frentes.map(f=><li key={f.id}><span>{f.titulo}</span><b>{formatarMoedaEst(totalConhecido(f.o),f.o.moeda)}</b></li>)}</ul>
  </>:<p>{t('As frentes usam moedas diferentes ({moedas}); os valores não são somados.',{moedas:c.moedas.join(', ')})}</p>}
  <div className="pc-botoes"><Button disabled={ocupado} onClick={()=>void baixar()}>{t('Resumo do plano completo (PDF)')}</Button></div>{erro?<p role="alert">{erro}</p>:null}
 </section>;
}
export function PanoramaPlano(){
 const s=useCaso(),frentes=frentesDoPlano(s),pais=(paisesOrdenados() as any[]).find(p=>p.iso3===s.caso.pais)?.nome;
 return <Shell nav={false} plano={false} contexto={t('Visão geral do plano')}><div className="pc-ux-panorama">
  <div><p className="pc-kicker">{t('Visão geral do plano')}</p><h1>{t('Seu plano de IA na educação')}</h1><p className="pc-lead">{t('Acompanhe as frentes e abra o resumo de cada uma.')}</p></div>
  <ConsolidadoV16/>
  <section className="pc-ux-contexto"><div><h2>{t('Contexto compartilhado')}</h2><p>{pais||t('País a definir')}</p></div><div className="pc-botoes"><Button size="sm" variant="secondary" href={href.pergunta(1,'local')}>{t('Revisar país')}</Button><Button size="sm" variant="secondary" href={href.pergunta(1,'prioridades')}>{t('Revisar prioridades')}</Button></div></section>
  <div className="pc-ux-frentes-lista">{frentes.map(f=>{
   const view=estadoDaFrente(s,f.id),p=progressoFrente(s,f.id);
   const o=f.id==='governanca'?orcamentoGovernanca(view):f.id==='letramento'?orcamentoLetramento(view):f.id==='educacao'?orcamentoEd(view):null;
   return <section className="pc-ux-frente-card" key={f.id}>
    <div className="pc-ux-frente-cab"><h2>{t(f.titulo)}</h2><span className={'pc-ux-status pc-ux-status--'+(p.estado==='completa'&&o?.faltam?'andamento':p.estado)}>{p.estado==='completa'&&o?.faltam?t('Telas preenchidas · {n} valores a levantar',{n:o.faltam}):rotuloEstadoFrente(p.estado)}</span></div>
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
