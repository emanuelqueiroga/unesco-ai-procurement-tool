import { useEffect, type RefObject } from 'react';
/** Isola o modal portado ao body, preservando o estado anterior dos irmãos. */
export function useModalIsolation(ref:RefObject<HTMLElement>,ativo:boolean){
 useEffect(()=>{
  const raiz=ref.current;
  if(!ativo||!raiz)return;
  const irmaos=Array.from(raiz.parentElement?.children||[]).filter((e):e is HTMLElement=>e instanceof HTMLElement&&e!==raiz);
  const anteriores=irmaos.map(el=>({el,inert:el.inert})),overflow=document.body.style.overflow;
  anteriores.forEach(({el})=>{el.inert=true;});document.body.style.overflow='hidden';
  return()=>{anteriores.forEach(({el,inert})=>{el.inert=inert;});document.body.style.overflow=overflow;};
 },[ref,ativo]);
}
