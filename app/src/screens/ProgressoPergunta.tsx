import { telasAtivas, type Estado14, type Capitulo } from '../store';
import { prioridadeEscolhida } from '../domain';
import { t } from '../percurso/textos';
// Teste de layout da v015: a etapa e a posição dentro dela ficam na barra de etapas do cabeçalho; acima do título,
// a posição da pergunta no percurso da frente ("Pergunta 6 de 11").
export function ProgressoPergunta({s,id}:{s:Estado14;n?:Capitulo;id:string}){
 const qs=telasAtivas(s).filter(q=>prioridadeEscolhida(s.ctx)||['local','prioridades'].includes(q.id));
 const i=qs.findIndex(q=>q.id===id);
 return <span className="pc-ux-progresso">{t('Pergunta {n} de {total}',{n:i+1,total:qs.length})}</span>;
}
