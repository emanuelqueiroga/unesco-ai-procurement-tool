import { rotuloEstadoFrente } from './PanoramaPlano';
import { AcoesPercurso } from './AcoesPercurso';
import { ProgressoPergunta } from './ProgressoPergunta';
import { useState } from 'react';
import { useCaso } from '../store';
import { Button, OptionCard, OptionCardGroup, QuestionFrame } from '../ui';
import { abrirFrente, frenteAtual, frentesDoPlano, progressoFrente, type FrenteId } from '../percurso/frentes';
import { href, ir } from '../percurso/rota';
import { t } from '../percurso/textos';
import { Shell } from './Shell';
import './frentes.css';

export function FrentesPlano() {
 const s=useCaso(),frentes=frentesDoPlano(s);
 const [escolha,setEscolha]=useState<FrenteId>(()=>frenteAtual(s));
 const selecionada=frentes.some(f=>f.id===escolha)?escolha:frentes[0]?.id;
 const avancar=()=>{if(selecionada){const destino=abrirFrente(selecionada);if(destino)ir(destino);}};
 return <Shell nav={false} plano={false} contexto={t('Frentes do plano')}>
  <div className="pc-frentes-plano"><QuestionFrame kicker={t('Frentes do plano')}
   title={t('Por onde você quer começar?')}
   explanation={t('Suas prioridades se organizam nas frentes abaixo. Escolha uma para continuar.')}
   actions={<AcoesPercurso anterior={href.pergunta(1,'prioridades')} avancar={avancar} disabled={!selecionada} nota={t('Clique em Próximo para abrir a frente escolhida.')}/>} >
   <p>{t('As frentes fazem parte do mesmo plano nacional. Cada uma mantém suas perguntas, ações e recursos.')}</p>
   <OptionCardGroup label={t('Escolha uma frente')} type="radio" className="pc-frentes-opcoes">
    {frentes.map(f=><OptionCard key={f.id} name="frente-inicial" value={f.id} type="radio" checked={selecionada===f.id} onChange={()=>setEscolha(f.id)} label={<>{t(f.titulo)} <span className="pc-ux-status">{rotuloEstadoFrente(progressoFrente(s,f.id).estado)}</span><span className="pr-optioncard-desc">{t(f.descricao)}<span className="pc-frentes-etapas">{t(f.etapas)}</span></span></>}/>)}
   </OptionCardGroup>
   <p className="pc-nota">{t('Você trabalha em uma frente por vez. Para passar às outras, use “Trocar”. Suas respostas ficam salvas.')}</p>
  </QuestionFrame></div>
 </Shell>;
}
