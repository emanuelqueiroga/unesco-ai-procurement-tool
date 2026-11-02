import { AcoesPercurso } from './AcoesPercurso';
import { useState } from 'react';
import { useCaso, telasDoCapitulo } from '../store';
import { Button, QuestionFrame } from '../ui';
import { OpcoesPrioridades } from '../percurso/Controles';
import { confirmarPrioridades } from '../percurso/confirmarPrioridades';
import { infoCapitulo, t } from '../percurso/textos';
import { href, ir } from '../percurso/rota';
import { Shell } from './Shell';

/** A seleção fica local até Próximo; a moldura continua usando o caso confirmado. */
export function Prioridades() {
 const s=useCaso();
 const [rascunho,setRascunho]=useState<string[]>(()=>[...(s.ctx.prioridades||[])]);
 const telas=telasDoCapitulo(1,s).filter(q=>s.ctx.prioridades?.length||['local','prioridades'].includes(q.id));
 const i=telas.findIndex(q=>q.id==='prioridades');
 const avancar=()=>{const destino=confirmarPrioridades(rascunho);if(destino)ir(destino);};
 return <Shell pos={{capitulo:1,tela:'prioridades'}} contexto={t(infoCapitulo(1,s).titulo)}>
  <div className="pc-pergunta" data-tela="prioridades"><QuestionFrame
   title={t('Prioridades')} explanation={t('Escolha uma ou mais prioridades.')}
   actions={<AcoesPercurso anterior={href.pergunta(1,'local')} avancar={avancar} disabled={!rascunho.length} nota={t('Clique em Próximo para aplicar sua seleção.')}/>} >
   <OpcoesPrioridades atual={rascunho} onChange={setRascunho}/>
  </QuestionFrame></div>
 </Shell>;
}
