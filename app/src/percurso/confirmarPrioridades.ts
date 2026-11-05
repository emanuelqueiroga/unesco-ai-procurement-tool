import { PRIORIDADES } from '../domain';
import { PRIORIDADES_V016 } from '../domain/catalogo_v016.js';
import { useCaso, telasAtivas } from '../store';
import { href } from './rota';
/** Só a confirmação altera o caso e define a próxima pergunta do novo percurso. */
export function confirmarPrioridades(ids: string[]): string | null {
 const prioridades=(PRIORIDADES as {id:string}[]).map(p=>p.id).filter(id=>ids.includes(id)&&PRIORIDADES_V016.includes(id));
 if(!prioridades.length)return null;
 useCaso.getState().responder('prioridades',prioridades);
 if(prioridades.length>1)return href.frentes();
 const telas=telasAtivas(useCaso.getState()),i=telas.findIndex(q=>q.id==='prioridades'),proxima=telas[i+1];
 return proxima?href.pergunta(proxima.capitulo,proxima.id):href.plano();
}
