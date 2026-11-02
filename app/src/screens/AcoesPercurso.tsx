import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from '../ui';
import { useSalvamento } from './salvamento';
import { t } from '../percurso/textos';
// Barra fixa inferior (teste de layout da v015): Voltar · "Salvo neste navegador" · Próximo. O comportamento de
// Voltar, Próximo e das pendências é o de cada tela; a barra só os apresenta.
export function AcoesPercurso({anterior,avancar,disabled=false,nota}:{anterior:string;avancar:()=>void;disabled?:boolean;nota?:ReactNode}){
 const barra=useRef<HTMLDivElement>(null),falhou=useSalvamento(s=>s.falhou);
 useEffect(()=>{
  const vv=window.visualViewport;
  if(!vv)return;
  const atualizar=()=>barra.current?.style.setProperty('--teclado-offset',Math.max(0,window.innerHeight-vv.height-vv.offsetTop)+'px');
  vv.addEventListener('resize',atualizar);vv.addEventListener('scroll',atualizar);atualizar();
  return()=>{vv.removeEventListener('resize',atualizar);vv.removeEventListener('scroll',atualizar);};
 },[]);
 return <div className="pc-ux-acoes"><div ref={barra} className="pc-ux-barra-acoes" role="group" aria-label={t('Navegação do planejamento')}>
  <div className="pc-ux-barra-dentro">
   <Button variant="secondary" href={anterior}>{t('Voltar')}</Button>
   <span className={'pc-ux-salvo'+(falhou?' pc-ux-salvo--falha':'')} role="status">{falhou?t('Não está sendo salvo neste navegador'):t('Salvo neste navegador')}</span>
   <Button disabled={disabled} onClick={avancar}>{t('Próximo')}</Button>
  </div>
 </div>{nota?<p className="pc-nota pc-ux-nota-confirmacao">{nota}</p>:null}</div>;
}
