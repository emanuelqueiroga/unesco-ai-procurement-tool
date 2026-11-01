import { telasDoCapitulo, type Estado14, type Capitulo } from '../store';
import { prioridadeEscolhida } from '../domain';
import { infoCapitulo,t } from '../percurso/textos';
export function ProgressoPergunta({s,n,id}:{s:Estado14;n:Capitulo;id:string}){
 const qs=telasDoCapitulo(n,s).filter(q=>prioridadeEscolhida(s.ctx)||['local','prioridades'].includes(q.id));
 const i=qs.findIndex(q=>q.id===id);
 return <span className="pc-ux-progresso"><span>{t('Etapa {n} de {total}: {nome}',{n,total:prioridadeEscolhida(s.ctx)?4:1,nome:t(infoCapitulo(n,s).titulo)})}</span><span>{t('Tela {n} de {total}',{n:i+1,total:qs.length})}</span></span>;
}
