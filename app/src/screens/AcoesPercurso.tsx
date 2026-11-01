import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from '../ui';
import { useResumoPlano } from './ResumoContexto';
import { t } from '../percurso/textos';
export function AcoesPercurso({anterior,avancar,disabled=false,nota}:{anterior:string;avancar:()=>void;disabled?:boolean;nota?:ReactNode}){
 const resumo=useResumoPlano(),barra=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const vv=window.visualViewport;
  if(!vv)return;
  const atualizar=()=>barra.current?.style.setProperty('--teclado-offset',Math.max(0,window.innerHeight-vv.height-vv.offsetTop)+'px');
  vv.addEventListener('resize',atualizar);vv.addEventListener('scroll',atualizar);atualizar();
  return()=>{vv.removeEventListener('resize',atualizar);vv.removeEventListener('scroll',atualizar);};
 },[]);
 return <div className="pc-ux-acoes"><div ref={barra} className="pc-ux-barra-acoes" role="group" aria-label={t('Navegação do planejamento')}>
  <Button variant="secondary" href={anterior}>{t('Voltar')}</Button>
  {resumo.disponivel&&resumo.gaveta?<Button variant="link" aria-haspopup="dialog" aria-expanded={resumo.aberta} onClick={()=>resumo.setAberta(true)}>{t('Resumo')}</Button>:<span aria-hidden="true"/>}
  <Button disabled={disabled} onClick={avancar}>{t('Próximo')}</Button>
 </div>{nota?<p className="pc-nota pc-ux-nota-confirmacao">{nota}</p>:null}</div>;
}
