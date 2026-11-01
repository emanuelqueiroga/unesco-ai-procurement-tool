import { createContext, useState, type ReactNode } from 'react';
export const ValidacaoCampos=createContext(false);
/** O agrupamento nativo permite teclado e abre automaticamente ao focar uma pendência. */
export function GrupoFormulario({titulo,estado,abrir=false,nome='pergunta-blocos',children}:{titulo:string;estado?:string;abrir?:boolean;nome?:string;children:ReactNode}){
 const [aberto,setAberto]=useState(abrir);
 return <details className="pc-lit-grupo pc-ux-bloco" {...{name:nome}} open={aberto} onToggle={e=>{if(e.target===e.currentTarget)setAberto(e.currentTarget.open);}}>
  <summary><h2 className="pc-lit-grupo-titulo">{titulo}</h2>{estado?<span className="pc-lit-grupo-estado">{estado}</span>:null}</summary>
  <div className="pc-lit-grupo-dados">{children}</div>
 </details>;
}
