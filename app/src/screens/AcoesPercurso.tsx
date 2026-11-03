import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from '../ui';
import { t } from '../percurso/textos';
// Voltar e Próximo (teste de layout da v015): barra fixa no rodapé da janela, sem texto, no mesmo container e no
// mesmo grid da área principal (Voltar na borda esquerda e Próximo na borda direita da coluna da pergunta). O comportamento de Voltar, Próximo e das pendências é o de cada tela.
export function AcoesPercurso({anterior,avancar,disabled=false,nota}:{anterior:string;avancar:()=>void;disabled?:boolean;nota?:ReactNode}){
 const barra=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const vv=window.visualViewport;
  if(!vv)return;
  const atualizar=()=>barra.current?.style.setProperty('--teclado-offset',Math.max(0,window.innerHeight-vv.height-vv.offsetTop)+'px');
  vv.addEventListener('resize',atualizar);vv.addEventListener('scroll',atualizar);atualizar();
  return()=>{vv.removeEventListener('resize',atualizar);vv.removeEventListener('scroll',atualizar);};
 },[]);
 return <div className="pc-ux-acoes"><div ref={barra} className="pc-ux-barra-acoes" role="group" aria-label={t('Navegação do planejamento')}>
  <div className="pc-ux-barra-dentro pc-container pc-grade"><div className="pc-ux-barra-botoes">
   <Button variant="secondary" href={anterior}>{t('Voltar')}</Button>
   <Button disabled={disabled} onClick={avancar}>{t('Próximo')}</Button>
  </div></div>
 </div>{nota?<p className="pc-nota pc-ux-nota-confirmacao">{nota}</p>:null}</div>;
}
