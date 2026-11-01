import { useState } from 'react';
import { useCaso } from '../store';
import { Button, OptionCard, OptionCardGroup, QuestionFrame } from '../ui';
import { abrirFrente, frenteAtual, frentesDoPlano, type FrenteId } from '../percurso/frentes';
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
   actions={<div className="pc-lit-acoes"><div className="pc-botoes"><Button variant="secondary" href={href.pergunta(1,'prioridades')}>{t('Voltar')}</Button><Button disabled={!selecionada} onClick={avancar}>{t('Próximo')}</Button></div></div>}>
   <p>{t('As frentes fazem parte do mesmo plano nacional. Cada uma mantém suas perguntas, ações e recursos.')}</p>
   <OptionCardGroup label={t('Escolha uma frente')} type="radio" className="pc-frentes-opcoes">
    {frentes.map(f=><OptionCard key={f.id} name="frente-inicial" value={f.id} type="radio" checked={selecionada===f.id} onChange={()=>setEscolha(f.id)} label={<>{t(f.titulo)}<span className="pr-optioncard-desc">{t(f.descricao)}<span className="pc-frentes-etapas">{t(f.etapas)}</span></span></>}/>)}
   </OptionCardGroup>
   <p className="pc-nota">{t('Você trabalha em uma frente por vez. Para passar às outras, use “Ver todas as frentes”. Suas respostas ficam salvas.')}</p>
  </QuestionFrame></div>
 </Shell>;
}
