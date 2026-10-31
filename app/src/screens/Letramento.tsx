import { useEffect, useState } from 'react';
import { useCaso, telasDoCapitulo, telasAtivas, faltamDe, type CasoStore, type Capitulo } from '../store';
import { LOC, getLang } from '../domain';
import { Button, TextField, Chip, ChipGroup, QuestionFrame, ChapterOpening, Alert, PlanPanel, PlanDrawer, useMediaQuery, BREAKPOINTS } from '../ui';
import { Shell } from './Shell';
import { ControlesTela } from '../percurso/Controles';
import { CampoNumero } from '../percurso/CampoNumero';
import { t, infoCapitulo, CURTO, TITULO_TELA } from '../percurso/textos';
import { href, ir, type Rota } from '../percurso/rota';
import { selecoesLit, rotuloLit, alterarLit, lerLit, camposLetramento, campoLitRespondido, planoLetramento, orcamentoLetramento, TITULOS_LIT, telaLetramentoLegada, errosAlcance, valorCampoLit, L, type CampoLit } from '../percurso/letramento';
import { moedaGovernanca, orcamentoGovernanca } from '../percurso/governanca';
import './governanca.css';
function gravar(s:CasoStore,caminho:string,v:any) { s.responder('letramento',alterarLit(useCaso.getState().ctx.letramento,caminho,v)); }
function Escolha({s,f}:{s:CasoStore;f:CampoLit}) {
 const v=lerLit(s,f.caminho)||{},ids=selecoesLit(s,f.caminho);
 const salvar=(valor:any)=>{
  gravar(s,f.caminho,valor);
  if(f.caminho.startsWith('projeto.')) {
   const atual=useCaso.getState();const ds=camposLetramento(atual).find(f=>f.caminho==='projeto.descricao');
   atual.responder('projetoIA',{...atual.ctx.projetoIA,incluir:selecoesLit(atual,'projeto.decisao').includes('sim')?'sim':'nao',descricao:ds&&(selecoesLit(atual,'projeto.descricao').some(id=>id!=='_pendente')||String(lerLit(atual,'projeto.descricao')?.detalhe||'').trim())?valorCampoLit(atual,ds):''});
  }
 };
 return <section className="pc-gov-escolha" data-campo-lit={f.caminho}>
  {!f.numero?<p className="pc-gov-rotulo">{rotuloLit(f.label)}</p>:null}
  {f.numero?<><CampoNumero label={rotuloLit(f.label)} value={v.situacao==='a_levantar'?'':v.valor??''} decimais={f.numero==='decimal'}
    error={v.situacao!=='a_levantar'&&v.valor!==''&&v.valor!=null&&!campoLitRespondido(s,f)?t('Informe um número inteiro maior que zero.'):undefined}
    onChange={valor=>salvar({...v,valor,situacao:'informado'})}/>
    <ChipGroup label={t('Situação')}><Chip label={t(L('Informação a levantar','Information to collect'))} pressed={v.situacao==='a_levantar'} onToggle={on=>salvar({...v,situacao:on?'a_levantar':'informado'})}/></ChipGroup>
   </>:<ChipGroup label={rotuloLit(f.label)}>{f.opcoes?.map(o=><Chip key={o.id} label={t(o.texto)} pressed={ids.includes(o.id)} onToggle={on=>{
    const exclusiva=['_pendente','nenhum','nao'].includes(o.id);
    const escolhas=on?!f.multipla||exclusiva?[o.id]:[...ids.filter(id=>!['_pendente','nenhum','nao'].includes(id)),o.id]:ids.filter(id=>id!==o.id);
    salvar({...v,escolhas});
   }}/>)}</ChipGroup>}
  {f.evidencia?<p className="pc-nota">{t('Selecione o tipo de evidência. Você pode identificar o documento nas informações adicionais.')}</p>:null}
  <details className="pc-gov-detalhes"><summary>{t('Adicionar mais informações +')}{v.detalhe?' · '+t('Informações adicionadas'):''}</summary>
   <TextField multiline label={t('Informações adicionais: {campo}',{campo:rotuloLit(f.label)})} value={String(v.detalhe||'')} onChange={detalhe=>salvar({...v,detalhe})}/>
  </details>
 </section>;
}
function OrcamentoLit({s}:{s:CasoStore}) {
 const o=orcamentoLetramento(s),gov=orcamentoGovernanca(s);
 return <><p className="pc-nota">{t(L('Informe apenas os recursos desta frente. Custos compartilhados são referenciados, sem somar novamente.','Enter only this workstream’s resources. Shared costs are referenced without counting them again.'))}</p><p>{t('Moeda')}: <b>{o.moeda}</b></p>
  {o.itens.map(i=>{const caminho='orcamento.itens.'+i.id,v=lerLit(s,caminho)||{};const salvar=(novo:any)=>{gravar(s,'orcamento.moeda',o.moeda);gravar(s,caminho,novo);};
   return <section className="pc-gov-card" key={i.id}><h2>{i.nome}</h2>
    <ChipGroup label={i.nome}>{[['a_estimar','Custo ainda a levantar'],['sem_custo','Sem custo neste orçamento'],['informado','Já tenho um valor'],...(s.ctx.prioridades?.includes('governar')?[['compartilhado',L('Já custeado na governança','Already funded under governance')]]:[])].map(([id,label])=><Chip key={id} label={t(label)} pressed={v.situacao===id} onToggle={on=>salvar({...v,situacao:on?id:''})}/>)}</ChipGroup>
    {v.situacao==='informado'?<CampoNumero label={i.nome+' ('+o.moeda+')'} value={v.valor??''} decimais error={typeof v.valor==='number'&&(!Number.isFinite(v.valor)||v.valor<0)?t('Informe um valor maior ou igual a zero.'):undefined} onChange={valor=>salvar({...v,valor})}/>:null}
    {v.situacao==='compartilhado'?<ChipGroup label={t(L('Item de origem na governança','Source item under governance'))}>{gov.itens.map(g=><Chip key={g.id} label={g.nome} pressed={v.referencia===g.id} onToggle={on=>salvar({...v,referencia:on?g.id:''})}/>)}</ChipGroup>:null}
    <details className="pc-gov-detalhes"><summary>{t('Adicionar mais informações +')}</summary><TextField multiline label={t('Detalhamento e fonte do item')} value={String(v.detalhe||'')} onChange={detalhe=>salvar({...v,detalhe})}/></details>
    {i.id.startsWith('adicional-')?<Button variant="link" onClick={()=>{const atual=useCaso.getState();const {[i.id]:_x,...resto}=atual.ctx.letramento.orcamento.adicionais;const {[i.id]:_y,...itens}=atual.ctx.letramento.orcamento.itens||{};gravar(s,'orcamento.adicionais',resto);gravar(s,'orcamento.itens',itens);}}>{t('Remover')}</Button>:null}
   </section>;
  })}<Button variant="secondary" onClick={()=>{const seq=(lerLit(useCaso.getState(),'orcamento.seq')||0)+1;gravar(s,'orcamento.seq',seq);gravar(s,'orcamento.adicionais.adicional-'+seq,{nome:{}});}}>{t('Adicionar recurso')}</Button><ResumoOrcamento s={s}/></>;
}
function ResumoOrcamento({s}:{s:CasoStore}) {
 const o=orcamentoLetramento(s);
 return <div className="pc-gov-orcamento" role="status"><b>{t(L('Subtotal desta frente, sem custos compartilhados','Workstream subtotal, excluding shared costs'))}: {o.temSubtotal?moedaGovernanca(o.subtotal,o.moeda,String(LOC())):t('Não informado')}</b><p>{t('{n} itens sem valor informado. O subtotal não é o orçamento completo.',{n:o.faltam})}</p></div>;
}
export function PainelLetramento({s}:{s:CasoStore}) {
 const p=planoLetramento(s),o=p.orcamento,gaveta=useMediaQuery(BREAKPOINTS.drawer),[aberta,setAberta]=useState(false);
 const painel=<PlanPanel fluid paperOnly={gaveta} state={p.faltam.length||p.pendentes?'writing':'complete'} title={p.pais||p.titulo} kicker={p.titulo} openHref={href.plano()} summaryTitle={t('Em resumo')} originLine={<>{p.proxima}<p>{p.escopo}</p></>}
  kpis={[{id:'lit-orcamento',label:t(L('Subtotal desta frente, sem custos compartilhados','Workstream subtotal, excluding shared costs')),value:o.temSubtotal?moedaGovernanca(o.subtotal,o.moeda,String(LOC())):t('Não informado')}]}
  footer={<><p>{t(L('{n} definições e valores a levantar','{n} definitions and amounts to collect'),{n:p.pendentes})}</p><Button size="sm" variant="secondary" href={href.plano()}>{t('Abrir o plano inteiro')}</Button></>}/>;
 return gaveta?<PlanDrawer open={aberta} onOpenChange={setAberta} zoneLabel={p.titulo} summary={p.proxima} closeLabel={t('Fechar')} openLabel={t('Abrir o seu plano')}>{painel}</PlanDrawer>:<aside className="pc-plano" aria-label={p.titulo}>{painel}</aside>;
}
function PlanoLit({s}:{s:CasoStore}) {
 const p=planoLetramento(s),[erro,setErro]=useState(''),[ocupado,setOcupado]=useState(false);
 const baixar=async(tipo:'brief'|'anexo')=>{setOcupado(true);setErro('');try {const {gerarGovernancaPDF}=await import('../plano/pdf_governanca');const doc=await gerarGovernancaPDF(s.estado(),{tipo,modelo:'letramento'});doc.save(tipo==='brief'?'resumo-letramento.pdf':'plano-letramento.pdf');}catch(e){console.error(e);setErro(t('Não foi possível gerar o PDF.'));}finally{setOcupado(false);}};
 return <div className="pc-gov-plano"><h1>{p.titulo}</h1><p className="pc-lead">{p.pais}</p><Alert kind="info" title={p.proxima}>{p.escopo}</Alert><ResumoOrcamento s={s}/>
  <div className="pc-botoes"><Button disabled={ocupado} onClick={()=>void baixar('brief')}>{t(L('Resumo do programa (PDF)','Programme summary (PDF)'))}</Button><Button disabled={ocupado} variant="secondary" onClick={()=>void baixar('anexo')}>{t(L('Plano de formação e currículo (PDF)','Training and curriculum plan (PDF)'))}</Button></div>{erro?<p role="alert">{erro}</p>:null}
  {p.faltam.length?<section className="pc-gov-card"><h2>{t('Respostas que faltam')}</h2><ul>{faltamDe(s).map(q=><li key={q.id}><a href={href.pergunta(q.capitulo,q.id)}>{t(CURTO[q.id]||q.id)}</a></li>)}</ul></section>:null}
  {p.blocos.map((b,i)=><section className="pc-gov-card" key={i}><h2>{b.titulo}</h2><dl className="pc-gov-dados">{b.linhas.map((l,j)=><div key={j}><dt>{l.rotulo}</dt><dd>{l.valor}</dd></div>)}</dl></section>)}<Button variant="secondary" href={href.pergunta(4,'lit-revisao')}>{t('Voltar')}</Button>
 </div>;
}
export function Letramento({rota}:{rota:Rota}) {
 const s=useCaso(),n:Capitulo=['abertura','pergunta','sintese'].includes(rota.tipo)?(rota as {n:Capitulo}).n:3;
 const lista=telasDoCapitulo(n,s),ativa=rota.tipo==='pergunta'?lista.find(q=>q.id===rota.tela):undefined;
 const legado=rota.tipo==='pergunta'?telaLetramentoLegada(rota.tela):'';
 const alvo=telasAtivas(s).find(q=>q.id===legado);
 const remap=rota.tipo==='refinar'?href.pergunta(3,'lit-recursos'):rota.tipo==='pergunta'&&!ativa?alvo?href.pergunta(alvo.capitulo,alvo.id):href.pergunta(n,lista[0].id):null;
 useEffect(()=>{if(remap)ir(remap);},[remap]);if(remap)return null;
 const info=infoCapitulo(n,s);
 const aviso=!['pt','en'].includes(getLang())?<p className="pc-nota">{t(L('Tradução deste percurso em revisão; textos novos podem aparecer em inglês.','Translation of this pathway is under review; new text may appear in English.'))}</p>:null;
 if(rota.tipo==='plano')return <Shell plano={false}>{aviso}<PlanoLit s={s}/></Shell>;
 if(rota.tipo==='abertura'||rota.tipo==='sintese') {
  const sin=rota.tipo==='sintese',proxima=sin?n<4?href.abertura(n+1):href.plano():href.pergunta(n,lista[0].id);
  return <Shell pos={{capitulo:n,sintese:sin}} contexto={t(info.titulo)}>{aviso}<div className="pc-abertura"><ChapterOpening n={n} title={t(info.titulo)} guide={<strong>{t(info.guia)}</strong>} action={<div className="pc-botoes"><Button variant="secondary" href={sin?href.pergunta(n,lista[lista.length-1].id):n===1?href.inicio():href.sintese(n-1)}>{t('Voltar')}</Button><Button href={proxima}>{t('Próximo')}</Button></div>}>{null}</ChapterOpening>{sin?<p>{planoLetramento(s).proxima}</p>:null}</div></Shell>;
 }
 if(!ativa)return null;
 const id=ativa.id,i=lista.indexOf(ativa),campos=camposLetramento(s).filter(f=>f.tela===id),erros=id==='lit-alcance'?errosAlcance(s):[];
 const falta=id==='prioridades'?!s.ctx.prioridades?.length:id==='problemas'?!(s.ctx.problemas||[]).some((id:string)=>/^A\d+$/.test(id)):id.startsWith('lit-')&&!s.ctx.letramento?true:id.startsWith('lit-')&&!campos.every(f=>campoLitRespondido(s,f))||erros.length>0||id==='lit-recursos'&&!orcamentoLetramento(s).itens.every(i=>i.respondido);
 return <Shell pos={{capitulo:n,tela:id}} contexto={t(info.titulo)}>{aviso}<div className="pc-pergunta"><QuestionFrame kicker={t('{nome} · pergunta {i} de {total}',{nome:t(info.titulo),i:i+1,total:lista.length})} title={t(TITULOS_LIT[id]||TITULO_TELA[id]||CURTO[id]||id)}
  actions={<><div className="pc-botoes"><Button variant="secondary" href={i?href.pergunta(n,lista[i-1].id):href.abertura(n)}>{t('Voltar')}</Button><Button disabled={!!falta} onClick={()=>ir(lista[i+1]?href.pergunta(n,lista[i+1].id):href.sintese(n))}>{t('Próximo')}</Button></div>{falta?<p className="pc-nota">{t(L('Selecione as opções ou indique as informações a levantar para avançar.','Select options or identify information to collect before continuing.'))}</p>:null}</>}>
   {id.startsWith('lit-')?<>{campos.map(f=><Escolha key={f.caminho} s={s} f={f}/>)}{id==='lit-recursos'?<OrcamentoLit s={s}/>:null}{erros.map(e=><p role="alert" key={e}>{t(e)}</p>)}{id==='lit-projeto'?<p>{t(L('O projeto de ferramenta tem ações e orçamento próprios; a formação permanece nesta frente.','The tool project has its own actions and budget; training remains in this workstream.'))}</p>:null}</>:<ControlesTela e={s} tela={ativa}/>}
  </QuestionFrame></div></Shell>;
}
