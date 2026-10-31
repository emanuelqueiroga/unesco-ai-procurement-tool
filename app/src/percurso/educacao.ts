import { problemasMarcados, sugestoesProblemas, percursoEducacao, projetoUsoDefinido, estadoDoProjeto } from '../domain';
export function impactosEducacao(s: {ctx:Record<string,any>;caso?:Record<string,any>}):string[] {
 const ctx=projetoUsoDefinido(s.ctx)?estadoDoProjeto({...s,ctx:{...s.ctx,frenteAtiva:'projeto'}}).ctx:s.ctx;
 const novos=ctx.impactosAutomaticosEducacao || problemasMarcados(ctx).some((q:any)=>q.educacao);
 return novos?sugestoesProblemas(ctx).impactos:s.caso?.impactos?.length?s.caso.impactos:sugestoesProblemas(ctx).impactos;
}
export function educacaoAutomatica(ctx:Record<string,any>) {return percursoEducacao(ctx)&&(ctx.impactosAutomaticosEducacao || problemasMarcados(ctx).some((q:any)=>q.educacao));}
