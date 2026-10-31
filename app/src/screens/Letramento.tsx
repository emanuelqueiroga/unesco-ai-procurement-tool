import { useEffect, useState, type ReactNode } from 'react';
import { useCaso, telasDoCapitulo, telasAtivas, faltamDe, telaRespondida, type CasoStore, type Capitulo } from '../store';
import { LOC, getLang } from '../domain';
import { Button, TextField, OptionCard, OptionCardGroup, QuestionFrame, Alert, PlanPanel, PlanDrawer, useMediaQuery } from '../ui';
import { Shell } from './Shell';
import { ControlesTela } from '../percurso/Controles';
import { CampoNumero } from '../percurso/CampoNumero';
import { t, infoCapitulo, CURTO, TITULO_TELA, LEAD } from '../percurso/textos';
import { href, ir, type Rota } from '../percurso/rota';
import { selecoesLit, rotuloLit, alterarLit, lerLit, camposLetramento, campoLitRespondido, planoLetramento, orcamentoLetramento, TITULOS_LIT, telaLetramentoLegada, errosAlcance, valorCampoLit, somenteCurriculoLit, tituloDaTelaLit, L, type CampoLit } from '../percurso/letramento';
import { entradaEtapaLit, vizinhosLit, selecionarLit, gruposCamposLit, pendenciasCamposLit, pendenciasCustosLit, rotuloVisivelLit, guiaTelaLit } from '../percurso/letramentoInterface';
import { moedaGovernanca, orcamentoGovernanca } from '../percurso/governanca';
import './governanca.css';
import './letramento.css';

function gravar(s: CasoStore, caminho: string, v: any) {
  s.responder('letramento', alterarLit(useCaso.getState().ctx.letramento, caminho, v));
}
const campoId = (caminho: string) => 'lit-' + caminho.replace(/[^a-zA-Z0-9_-]/g, '-');
function focarCampo(caminho: string) {
  const el = document.getElementById(campoId(caminho));
  if (!el) return;
  let pai = el.parentElement;
  while (pai) { if (pai.tagName === 'DETAILS') (pai as HTMLDetailsElement).open = true; pai = pai.parentElement; }
  requestAnimationFrame(() => {
    el.scrollIntoView({ block: 'center' });
    (el.querySelector<HTMLElement>('input:not(:disabled),button,select,textarea') || el).focus({ preventScroll: true });
  });
}
function GrupoLit({ titulo, estado, recolhivel, abrir = false, children }: { titulo: string; estado?: string; recolhivel?: boolean; abrir?: boolean; children: ReactNode }) {
  const [aberto, setAberto] = useState(abrir);
  const conteudo = <div className="pc-lit-grupo-dados" role="group" aria-label={titulo}>{children}</div>;
  return recolhivel ? <details className="pc-lit-grupo" open={aberto} onToggle={e => { if (e.target === e.currentTarget) setAberto(e.currentTarget.open); }}>
    <summary><h2 className="pc-lit-grupo-titulo">{titulo}</h2><span className="pc-lit-grupo-estado">{estado}</span></summary>{conteudo}
  </details> : <section className="pc-lit-grupo"><h2>{titulo}</h2>{conteudo}</section>;
}
function Escolha({ s, f, contexto, tentou = false }: { s: CasoStore; f: CampoLit; contexto?: string; tentou?: boolean }) {
  const v = lerLit(s, f.caminho) || {}, ids = selecoesLit(s, f.caminho);
  const label = rotuloVisivelLit(f, contexto);
  const TituloCampo = contexto ? 'h3' : 'h2';
  const faltando = tentou && !campoLitRespondido(s, f);
  const salvar = (valor: any) => {
    gravar(s, f.caminho, valor);
    if (f.caminho.startsWith('projeto.')) {
      const atual = useCaso.getState(), ds = camposLetramento(atual).find(f => f.caminho === 'projeto.descricao');
      atual.responder('projetoIA', { ...atual.ctx.projetoIA, incluir: selecoesLit(atual, 'projeto.decisao').includes('sim') ? 'sim' : 'nao', descricao: ds && (selecoesLit(atual, 'projeto.descricao').some(id => id !== '_pendente') || String(lerLit(atual, 'projeto.descricao')?.detalhe || '').trim()) ? valorCampoLit(atual, ds) : '' });
    }
  };
  const erro = f.numero && v.situacao !== 'a_levantar' && (faltando || v.valor !== '' && v.valor != null && !campoLitRespondido(s, f))
    ? t(f.numero === 'decimal' ? 'Informe um número maior que zero ou marque a informação a levantar.' : 'Informe um número inteiro maior que zero ou marque a informação a levantar.') : undefined;
  return <section className={'pc-lit-campo' + (f.numero ? ' pc-lit-campo--numero' : '')} id={campoId(f.caminho)} data-campo-lit={f.caminho} tabIndex={-1}>
    {f.numero ? <>
      <CampoNumero label={label} value={v.situacao === 'a_levantar' ? '' : v.valor ?? ''} disabled={v.situacao === 'a_levantar'} decimais={f.numero === 'decimal'} error={erro} onChange={valor => salvar({ ...v, valor, situacao: 'informado' })} />
      <label className="pc-lit-pendente"><input type="checkbox" checked={v.situacao === 'a_levantar'} onChange={e => salvar({ ...v, situacao: e.target.checked ? 'a_levantar' : 'informado' })} />{t('Informação a levantar')}</label>
    </> : <>
      <TituloCampo className="pc-lit-campo-titulo">{label}</TituloCampo>
      <OptionCardGroup className="pc-lit-opcoes" label={label} type={f.multipla ? 'checkbox' : 'radio'}>{f.opcoes?.map(o => <OptionCard key={o.id} name={f.caminho} value={o.id} label={t(o.texto)} type={f.multipla ? 'checkbox' : 'radio'} checked={ids.includes(o.id)} onChange={(id, on) => salvar({ ...v, escolhas: selecionarLit(ids, id, on, f.multipla) })} />)}</OptionCardGroup>
      {faltando ? <p className="pc-lit-erro">{t('Selecione uma opção ou indique a informação a levantar.')}</p> : null}
    </>}
    {f.evidencia ? <p className="pc-nota">{t('Selecione o tipo de evidência. Você pode identificar o documento nas informações adicionais.')}</p> : null}
    <details className="pc-gov-detalhes"><summary>{t('Adicionar mais informações +')}{v.detalhe ? ' · ' + t('Informações adicionadas') : ''}</summary>
      <TextField multiline label={t('Informações adicionais: {campo}', { campo: rotuloLit(f.label) })} value={String(v.detalhe || '')} onChange={detalhe => salvar({ ...v, detalhe })} />
    </details>
  </section>;
}
function CamposLit({ s, id, tentou }: { s: CasoStore; id: string; tentou: boolean }) {
  const grupos = gruposCamposLit(s, id);
  return <div className="pc-lit-campos">{grupos.map((g, i) => {
    const conteudo = g.campos.map(f => <Escolha key={f.caminho} s={s} f={f} contexto={g.titulo} tentou={tentou} />);
    return g.titulo ? <GrupoLit key={g.id} titulo={t(g.titulo)} recolhivel={g.recolhivel} abrir={i === grupos.findIndex(g => g.recolhivel)} estado={t('{n} de {total} respostas', { n: g.campos.filter(f => campoLitRespondido(s, f)).length, total: g.campos.length })}>{conteudo}</GrupoLit>
      : <div className="pc-lit-campos" key={g.id}>{conteudo}</div>;
  })}</div>;
}
function OrcamentoLit({ s, tentou }: { s: CasoStore; tentou: boolean }) {
  const o = orcamentoLetramento(s), gov = orcamentoGovernanca(s);
  return <div className="pc-lit-orcamento"><p className="pc-nota">{t('Moeda')}: <b>{o.moeda}</b>. {t(L('Informe apenas os recursos desta frente. Custos compartilhados são referenciados, sem somar novamente.', 'Enter only this workstream’s resources. Shared costs are referenced without counting them again.'))}</p>
    {o.itens.map((i, idx) => {
      const caminho = 'orcamento.itens.' + i.id, v = lerLit(s, caminho) || {};
      const salvar = (novo: any) => { gravar(s, 'orcamento.moeda', o.moeda); gravar(s, caminho, novo); };
      const adicional = camposLetramento(s).find(f => f.caminho === 'orcamento.adicionais.' + i.id + '.nome');
      const estado = i.compartilhado ? t('Já custeado na governança') : i.valor !== null ? moedaGovernanca(i.valor, o.moeda, String(LOC())) : v.situacao === 'a_estimar' ? t('Custo ainda a levantar') : t('Não informado');
      return <div id={campoId(caminho)} data-orcamento-lit={i.id} key={i.id} tabIndex={-1}>
        <GrupoLit titulo={i.nome} recolhivel abrir={idx === 0 || i.id.startsWith('adicional-')} estado={estado}>
          {adicional ? <Escolha s={s} f={adicional} contexto={i.nome} tentou={tentou} /> : null}
          <OptionCardGroup className="pc-lit-opcoes" label={t('Situação do custo') + ': ' + i.nome}>{[['a_estimar', 'Custo ainda a levantar'], ['sem_custo', 'Sem custo neste orçamento'], ['informado', 'Já tenho um valor'], ...(s.ctx.prioridades?.includes('governar') ? [['compartilhado', L('Já custeado na governança', 'Already funded under governance')]] : [])].map(([id, label]) => <OptionCard key={id} name={caminho} value={id} label={t(label)} checked={v.situacao === id} onChange={id => salvar({ ...v, situacao: id })} />)}</OptionCardGroup>
          {v.situacao === 'informado' ? <div className="pc-lit-campo"><CampoNumero label={t('Valor informado') + ' (' + o.moeda + ')'} value={v.valor ?? ''} decimais error={tentou && !i.respondido || typeof v.valor === 'number' && (!Number.isFinite(v.valor) || v.valor < 0) ? t('Informe um valor maior ou igual a zero.') : undefined} onChange={valor => salvar({ ...v, valor })} /></div> : null}
          {v.situacao === 'compartilhado' ? <OptionCardGroup className="pc-lit-opcoes" label={t(L('Item de origem na governança', 'Source item under governance'))}>{gov.itens.map(g => <OptionCard key={g.id} name={caminho + '.referencia'} value={g.id} label={g.nome} checked={v.referencia === g.id} onChange={id => salvar({ ...v, referencia: id })} />)}</OptionCardGroup> : null}
          {tentou && !i.respondido ? <p className="pc-lit-erro">{t('Informe a situação e, quando necessário, o valor ou o item de origem.')}</p> : null}
          <div className="pc-lit-campo"><details className="pc-gov-detalhes"><summary>{t('Adicionar mais informações +')}</summary><TextField multiline label={t('Detalhamento e fonte do item')} value={String(v.detalhe || '')} onChange={detalhe => salvar({ ...v, detalhe })} /></details></div>
          {i.id.startsWith('adicional-') ? <Button variant="link" onClick={() => { const atual = useCaso.getState(); const { [i.id]: _x, ...resto } = atual.ctx.letramento.orcamento.adicionais; const { [i.id]: _y, ...itens } = atual.ctx.letramento.orcamento.itens || {}; gravar(s, 'orcamento.adicionais', resto); gravar(s, 'orcamento.itens', itens); }}>{t('Remover')}</Button> : null}
        </GrupoLit>
      </div>;
    })}
    <Button variant="secondary" onClick={() => { const seq = (lerLit(useCaso.getState(), 'orcamento.seq') || 0) + 1; gravar(s, 'orcamento.seq', seq); gravar(s, 'orcamento.adicionais.adicional-' + seq, { nome: {} }); requestAnimationFrame(() => focarCampo('orcamento.itens.adicional-' + seq)); }}>{t('Adicionar recurso')}</Button>
    <ResumoOrcamento s={s} />
  </div>;
}
function ResumoOrcamento({ s }: { s: CasoStore }) {
  const o = orcamentoLetramento(s);
  return <div className="pc-gov-orcamento" role="status"><b>{t(L('Subtotal desta frente, sem custos compartilhados', 'Workstream subtotal, excluding shared costs'))}: {o.temSubtotal ? moedaGovernanca(o.subtotal, o.moeda, String(LOC())) : t('Não informado')}</b><p>{t('{n} itens sem valor informado. O subtotal não é o orçamento completo.', { n: o.faltam })}</p></div>;
}
export function PainelLetramento({ s }: { s: CasoStore }) {
  const p = planoLetramento(s), o = p.orcamento, gaveta = useMediaQuery('(max-width: 1439px)'), [aberta, setAberta] = useState(false);
  const telas = telasAtivas(s), faltam = faltamDe(s), proxima = faltam[0];
  const progresso = t('{n} de {total} telas respondidas', { n: telas.length - faltam.length, total: telas.length });
  const painel = <PlanPanel className="pc-lit-painel" fluid paperOnly={gaveta} state={p.faltam.length || p.pendentes ? 'writing' : 'complete'} title={p.pais || t('Educar sobre a IA')} kicker={t('Letramento e currículo')} facts={progresso} openHref={href.plano()} summaryTitle={t('Recursos')}
    originLine={<><p>{proxima ? <>{t('Próxima resposta')}: <a href={href.pergunta(proxima.capitulo, proxima.id)}>{t(CURTO[proxima.id] || proxima.id)}</a></> : p.proxima}</p>{o.faltam ? <p>{t('{n} itens sem valor informado. O subtotal não é o orçamento completo.', { n: o.faltam })}</p> : null}</>}
    kpis={[{ id: 'lit-orcamento', label: t('Subtotal informado'), value: o.temSubtotal ? moedaGovernanca(o.subtotal, o.moeda, String(LOC())) : t('Não informado') }]}
    footer={<><p>{t(L('{n} definições e valores a levantar', '{n} definitions and amounts to collect'), { n: p.pendentes })}</p><Button size="sm" variant="secondary" href={href.plano()}>{t('Abrir o plano inteiro')}</Button></>} />;
  return gaveta ? <div className="pc-lit-painel"><PlanDrawer open={aberta} onOpenChange={setAberta} zoneLabel={t('Seu plano')} summary={progresso} closeLabel={t('Fechar')} openLabel={t('Abrir o seu plano')}>{painel}</PlanDrawer></div> : <aside className="pc-plano pc-lit-painel" aria-label={p.titulo}>{painel}</aside>;
}
function PlanoLit({s}:{s:CasoStore}) {
 const p=planoLetramento(s),[erro,setErro]=useState(''),[ocupado,setOcupado]=useState(false);
 const baixar=async(tipo:'brief'|'anexo')=>{setOcupado(true);setErro('');try {const {gerarGovernancaPDF}=await import('../plano/pdf_governanca');const doc=await gerarGovernancaPDF(s.estado(),{tipo,modelo:'letramento'});doc.save(tipo==='brief'?'resumo-letramento.pdf':'plano-letramento.pdf');}catch(e){console.error(e);setErro(t('Não foi possível gerar o PDF.'));}finally{setOcupado(false);}};
 return <div className="pc-gov-plano"><h1>{p.titulo}</h1><p className="pc-lead">{p.pais}</p><Alert kind="info" title={p.proxima}>{p.escopo}</Alert><ResumoOrcamento s={s}/>
  <div className="pc-botoes"><Button disabled={ocupado} onClick={()=>void baixar('brief')}>{t(L('Resumo do programa (PDF)','Programme summary (PDF)'))}</Button><Button disabled={ocupado} variant="secondary" onClick={()=>void baixar('anexo')}>{t(L('Plano de formação e currículo (PDF)','Training and curriculum plan (PDF)'))}</Button></div>{erro?<p role="alert">{erro}</p>:null}
  {p.faltam.length?<section className="pc-gov-card"><h2>{t('Respostas que faltam')}</h2><ul>{faltamDe(s).map(q=><li key={q.id}><a href={href.pergunta(q.capitulo,q.id)}>{t(tituloDaTelaLit(s,q.id)||CURTO[q.id]||q.id)}</a></li>)}</ul></section>:null}
  {p.blocos.map((b,i)=><section className="pc-gov-card" key={i}><h2>{b.titulo}</h2><dl className="pc-gov-dados">{b.linhas.map((l,j)=><div key={j}><dt>{l.rotulo}</dt><dd>{l.valor}</dd></div>)}</dl></section>)}<Button variant="secondary" href={href.pergunta(4,'lit-revisao')}>{t('Voltar')}</Button>
 </div>;
}
export function Letramento({ rota }: { rota: Rota }) {
  const s = useCaso(), n: Capitulo = ['abertura', 'pergunta', 'sintese'].includes(rota.tipo) ? (rota as { n: Capitulo }).n : 3;
  const [tentou, setTentou] = useState(false);
  const lista = telasDoCapitulo(n, s), telas = telasAtivas(s), ativa = rota.tipo === 'pergunta' ? lista.find(q => q.id === rota.tela) : undefined;
  const legado = rota.tipo === 'pergunta' ? telaLetramentoLegada(rota.tela) : '';
  const alternativa: Record<string,string> = { ...(somenteCurriculoLit(s) ? {'lit-alcance':'lit-curriculo'} : {}), 'lit-validacao': 'lit-oferta', 'lit-digital': 'lit-oferta', 'lit-projeto': 'lit-oferta', 'lit-curriculo': 'lit-desenho' };
  const alvo = telas.find(q => q.id === legado) || telas.find(q => q.id === alternativa[legado]);
  const semPublicos = !(s.ctx.problemas || []).some((id: string) => /^A\d+$/.test(id));
  const remap = rota.tipo === 'refinar' ? href.pergunta(3, 'lit-recursos')
    : rota.tipo !== 'plano' && semPublicos && (n > 1 || rota.tipo === 'pergunta' && rota.tela === 'lit-alcance') ? href.pergunta(1, 'problemas')
    : rota.tipo === 'abertura' ? entradaEtapaLit(s, n)
    : rota.tipo === 'sintese' ? n < 4 ? entradaEtapaLit(s, (n + 1) as Capitulo) : href.plano()
    : rota.tipo === 'pergunta' && !ativa ? alvo ? href.pergunta(alvo.capitulo, alvo.id) : entradaEtapaLit(s, n) : null;
  useEffect(() => { if (remap) window.location.replace(remap); }, [remap]);
  if (remap) return null;
  const info = infoCapitulo(n, s);
  const aviso = !['pt', 'en'].includes(getLang()) ? <p className="pc-nota">{t(L('Tradução deste percurso em revisão; textos novos podem aparecer em inglês.', 'Translation of this pathway is under review; new text may appear in English.'))}</p> : null;
  if (rota.tipo === 'plano') return <Shell plano={false}>{aviso}<PlanoLit s={s} /></Shell>;
  if (!ativa) return null;
  const id = ativa.id, i = lista.indexOf(ativa), erros = id === 'lit-alcance' ? errosAlcance(s) : [];
  const camposFaltando = pendenciasCamposLit(s, id), custosFaltando = pendenciasCustosLit(s, id);
  const pendencias = [...camposFaltando.map(f => ({ caminho: f.caminho, label: rotuloLit(f.label) })), ...custosFaltando.map(c => ({ caminho: 'orcamento.itens.' + c.id, label: c.nome }))];
  const itemPendente = (p: { caminho: string; label: string }) => <li key={p.caminho}><a href={'#' + campoId(p.caminho)} onClick={e => { e.preventDefault(); focarCampo(p.caminho); }}>{p.label}</a></li>;
  const falta = !telaRespondida(s, ativa) || erros.length > 0;
  const destinos = vizinhosLit(s, id);
  const avancar = () => {
    if (!falta) { ir(destinos.proxima); return; }
    setTentou(true);
    if (camposFaltando.length) focarCampo(camposFaltando[0].caminho);
    else if (custosFaltando.length) focarCampo('orcamento.itens.' + custosFaltando[0].id);
    else requestAnimationFrame(() => document.getElementById('lit-validacao-tela')?.focus());
  };
  return <Shell pos={{ capitulo: n, tela: id }} contexto={t(info.titulo)}>{aviso}<div className="pc-pergunta" data-tela={id}><QuestionFrame
    kicker={t('{nome} · pergunta {i} de {total}', { nome: t(info.titulo), i: i + 1, total: lista.length })}
    title={t(tituloDaTelaLit(s,id) || TITULO_TELA[id] || CURTO[id] || id)} explanation={t(guiaTelaLit(s,id) || LEAD[id] || '')}
    actions={<div className="pc-lit-acoes"><p className="pc-lit-progresso">{t('Pergunta {i} de {n} do Essencial', { i: telas.indexOf(ativa) + 1, n: telas.length })}</p><div className="pc-botoes"><Button variant="secondary" href={destinos.anterior}>{t('Voltar')}</Button><Button onClick={avancar}>{t('Próximo')}</Button></div></div>}>
    {tentou && falta ? <div className="pc-lit-validacao" id="lit-validacao-tela" role="alert" tabIndex={-1}><b>{t('Complete as respostas indicadas ou marque as informações a levantar.')}</b><ul>
      {pendencias.slice(0, 3).map(itemPendente)}
      {erros.map(e => <li key={e}>{t(e)}</li>)}
      {!camposFaltando.length && !custosFaltando.length && !erros.length ? <li>{t(id === 'problemas' ? 'Selecione os públicos ou o currículo que fazem parte do plano.' : id === 'local' ? 'Escolha o país para avançar.' : 'Selecione ao menos uma prioridade.')}</li> : null}
    </ul>{pendencias.length > 3 ? <details><summary>{t('Ver outras {n} pendências', { n: pendencias.length - 3 })}</summary><ul>{pendencias.slice(3).map(itemPendente)}</ul></details> : null}</div> : null}
    {id.startsWith('lit-') ? <div className="pc-lit-campos"><CamposLit s={s} id={id} tentou={tentou} />{id === 'lit-recursos' ? <OrcamentoLit s={s} tentou={tentou} /> : null}{erros.length && !tentou ? erros.map(e => <p role="alert" className="pc-lit-erro" key={e}>{t(e)}</p>) : null}</div> : <ControlesTela e={s} tela={ativa} />}
  </QuestionFrame></div></Shell>;
}
