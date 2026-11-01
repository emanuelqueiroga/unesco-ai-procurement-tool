import { percursoGovernanca, percursoLetramento, percursoPedagogico, projetoUsoDefinido, temGovernanca, temLetramento, temEducacao } from '../domain';
import { useCaso, telasAtivas, telaRespondida, type Estado14 } from '../store';
import { href } from './rota';

export type FrenteId = 'governanca' | 'letramento' | 'educacao' | 'projeto';
export interface Frente { id: FrenteId; titulo: string; descricao: string; etapas: string }
/** Com e para a era da IA pertencem à mesma intervenção, sem duplicar seu orçamento. */
export function frentesDoPlano(s: Estado14): Frente[] {
 const x=s.ctx, frentes: Frente[]=[];
 if(temGovernanca(x))frentes.push({id:'governanca',titulo:'Plano de governança',descricao:'Defina políticas, normas e capacidades para a IA na educação em todo o país.',etapas:'Diagnóstico institucional, instrumentos, ações, recursos e acompanhamento.'});
 if(temLetramento(x))frentes.push({id:'letramento',titulo:'Letramento e currículo',descricao:'Planeje o letramento em IA dos públicos escolhidos e o currículo nacional.',etapas:'Públicos, aprendizagem, formação, currículo, recursos e acompanhamento.'});
 if(temEducacao(x))frentes.push({id:'educacao',titulo:'Intervenção educacional',descricao:x.prioridades.includes('com')&&x.prioridades.includes('para')?'Reúna a educação com e sem IA e a educação para a era da IA em uma mesma intervenção.':'Planeje melhorias na aprendizagem e na preparação para a era da IA.',etapas:'Etapas de ensino, escolas, estudantes, desafios, resultados, ações e recursos.'});
 if(projetoUsoDefinido(x))frentes.push({id:'projeto',titulo:'Projeto de uso de IA',descricao:'Detalhe o projeto de uso de IA que você já identificou.',etapas:'Solução, condições de uso, implantação e orçamento do projeto.'});
 return frentes;
}
export function frenteAtual(s: Estado14): FrenteId {
 return percursoGovernanca(s.ctx)?'governanca':percursoLetramento(s.ctx)?'letramento':percursoPedagogico(s.ctx)?'educacao':'projeto';
}
/** Retoma a primeira pergunta pendente da frente, preservando as demais. */
export function abrirFrente(id: FrenteId): string | null {
 const s=useCaso.getState();
 if(!frentesDoPlano(s).some(f=>f.id===id))return null;
 s.responder('frenteAtiva',id);
 const atual=useCaso.getState(),telas=telasAtivas(atual).filter(q=>!['local','prioridades'].includes(q.id));
 const proxima=telas.find(q=>!telaRespondida(atual,q));
 return proxima?href.pergunta(proxima.capitulo,proxima.id):href.plano();
}

export function estadoDaFrente(s: Estado14,id: FrenteId): Estado14 {
 return {...s,ctx:{...s.ctx,frenteAtiva:id}};
}
export function progressoFrente(s: Estado14,id: FrenteId){
 const estado=estadoDaFrente(s,id),telas=telasAtivas(estado).filter(q=>!['local','prioridades'].includes(q.id));
 const feitas=telas.filter(q=>telaRespondida(estado,q)).length;
 return {telas,feitas,total:telas.length,estado:feitas===0?'nova':feitas===telas.length?'completa':'andamento'} as const;
}
