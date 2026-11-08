import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMediaQuery } from '../ui';
const Contexto = createContext<{aberta:boolean;setAberta:(v:boolean)=>void;disponivel:boolean;integrado:boolean;gaveta:boolean}|null>(null);
export function ResumoProvider({children,disponivel,integrado,limite=1439}:{children:ReactNode;disponivel:boolean;integrado:boolean;limite?:number}) {
 const [aberta,setAberta]=useState(false),gaveta=useMediaQuery(`(max-width: ${limite}px)`);
 useEffect(()=>{if(!gaveta||!disponivel)setAberta(false);},[gaveta,disponivel]);
 const value=useMemo(()=>({aberta,setAberta,disponivel,integrado,gaveta}),[aberta,disponivel,integrado,gaveta]);
 return <Contexto.Provider value={value}>{children}</Contexto.Provider>;
}
export function useResumoPlano(){
 const ctx=useContext(Contexto),[aberta,setAberta]=useState(false);
 return ctx||{aberta,setAberta,disponivel:false,integrado:false,gaveta:false};
}
