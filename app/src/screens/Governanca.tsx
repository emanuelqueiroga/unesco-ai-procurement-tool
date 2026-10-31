import { useEffect, useState } from 'react';
import { useCaso, telasDoCapitulo, telasAtivas, faltamDe, type CasoStore, type Capitulo } from '../store';
import { percursoGovernanca, projetoUsoDefinido, tamanhoRedeValido, LOC } from '../domain';
import { Button, TextField, OptionCard, OptionCardGroup, QuestionFrame, ChapterOpening, PlanPanel, PlanDrawer, useMediaQuery, BREAKPOINTS, Alert, Chip, ChipGroup } from '../ui';
import { Shell } from './Shell';
import { ControlesTela } from '../percurso/Controles';
import { CampoNumero } from '../percurso/CampoNumero';
import { CURTO, TITULO_TELA, infoCapitulo, t } from '../percurso/textos';
import { href, ir, type Rota } from '../percurso/rota';
import { telaGovernancaLegada, desafiosGovernanca, acoesGovernanca, planoGovernanca, orcamentoGovernanca, moedaGovernanca, temSandbox, CUSTOS_GOV, CAMPOS_SANDBOX, INSTRUMENTOS_GOV, MARCOS_GOV } from '../percurso/governanca';
import './governanca.css';

export function Frentes({ s }: { s: CasoStore }) {
  const projeto = projetoUsoDefinido(s.ctx), gov = percursoGovernanca(s.ctx);
  if (!projeto && gov) return null;
  const abrir = (frente: string) => { s.responder('frenteAtiva', frente); ir(href.plano()); };
  return <section className="pc-gov-frentes" aria-label={t('Frentes do plano')}>
    <p>{t('Governança e projeto de uso de IA têm ações e orçamentos separados.')}</p>
    <div className="pc-botoes">
      <Button size="sm" variant={gov ? 'primary' : 'secondary'} onClick={() => abrir('governanca')}>{t('Plano de governança')}</Button>
      {projeto ? <Button size="sm" variant={!gov ? 'primary' : 'secondary'} onClick={() => abrir('projeto')}>{t('Projeto de uso de IA')}</Button> : null}
    </div>
    {!gov ? <p className="pc-nota">{t('Projeto identificado: {nome}', { nome: s.ctx.projetoIA.descricao })}</p> : null}
  </section>;
}
const NA = () => t('Não informado');
const gv = (s: CasoStore, campo: string) => campo.split('.').reduce((o: any, k) => o?.[k], s.ctx);
function Texto({ s, campo, label, longo = true, sugestao }: { s: CasoStore; campo: string; label: string; longo?: boolean; sugestao?: string }) {
  return <TextField label={t(label)} value={String(gv(s, campo) || '')} onChange={v => s.responder(campo, v)} multiline={longo} placeholder={sugestao} />;
}
function Grupo({ s, base, campos }: { s: CasoStore; base: string; campos: readonly (readonly [string, string])[] }) {
  return <div className="pc-gov-campos">{campos.map(([id, label]) => <Texto key={id} s={s} campo={base + '.' + id} label={label} />)}</div>;
}
function Instrumentos({ s }: { s: CasoStore }) {
  return <div className="pc-gov-lista">{desafiosGovernanca(s).map(q => {
    const d = s.ctx.govInstrumentos?.[q.id] || {}, base = 'govInstrumentos.' + q.id;
    return <section className="pc-gov-card" key={q.id}>
      <h2>{q.titulo}</h2>
      <OptionCardGroup label={t('O que já existe?')}>
        {[['existente', 'Existe'], ['parcial', 'Em parte'], ['ausente', 'Não existe'], ['nao_sei', 'Não sei']].map(([v, nome]) => <OptionCard key={v} name={base} value={v} label={t(nome)} checked={d.situacao === v} onChange={v => s.responder(base + '.situacao', v)} />)}
      </OptionCardGroup>
      <Grupo s={s} base={base} campos={[
        ['instrumento', 'Instrumento existente'], ['responsavel', 'Instituição responsável'], ['evidencia', 'Documento ou evidência'], ['lacuna', 'Lacunas a resolver'],
      ]} />
    </section>;
  })}</div>;
}
function Acoes({ s }: { s: CasoStore }) {
  const acoes = acoesGovernanca(s);
  return <><p className="pc-nota">{t('Revise a entrega sugerida de cada desafio e defina como executá-la.')}</p>
    <p className="pc-nota">{MARCOS_GOV.map(v => t(v)).join(' · ')}</p>
    {!acoes.length ? <p><a href={href.pergunta(1, 'problemas')}>{t('Selecione os desafios do plano.')}</a></p> : null}
    <div className="pc-gov-lista">{acoes.map(a => <section className="pc-gov-card" key={a.id}>
      <h2>{a.titulo}</h2>
      <Texto s={s} campo={'govAcoes.' + a.id + '.entrega'} label="Entrega prevista" sugestao={a.entrega} />
      <p className="pc-nota">{a.sugerida ? t('Sugestão a revisar') + ': ' + a.entrega : null}</p>
      <Grupo s={s} base={'govAcoes.' + a.id} campos={[
        ['responsavel', 'Responsável'], ['prazo', 'Prazo'], ['marco', 'Marcos de execução'], ['indicador', 'Indicador de entrega'],
      ]} />
    </section>)}</div></>;
}
function Orcamento({ s }: { s: CasoStore }) {
  const o = orcamentoGovernanca(s), atual = s.ctx.govOrcamento || {};
  const set = (campo: string, v: any) => {
    // A unidade monetária fica gravada com os valores, mesmo que o país mude depois.
    s.responder('govOrcamento', { ...useCaso.getState().ctx.govOrcamento, moeda: o.moeda });
    s.responder('govOrcamento.' + campo, v);
  };
  const categorias: [string, string][] = CUSTOS_GOV.map(([id, nome]) => [id, nome]);
  if (temSandbox(s)) categorias.push(['sandbox', 'Experimentação supervisionada']);
  return <>
    <p>{t('Informe o custo total de cada item no período escolhido. Use zero apenas quando o custo for conhecido e igual a zero.')}</p>
    <Grupo s={s} base="govOrcamento" campos={[
      ['periodo', 'Período do orçamento'], ['fonte', 'Fonte dos valores'],
    ]} />
    <p><b>{t('Moeda')}: {o.moeda}</b></p>
    {categorias.map(([id, nome]) => <div className="pc-gov-custo" key={id}>
      <CampoNumero label={t(nome) + ' (' + o.moeda + ')'} value={atual.itens?.[id]?.valor ?? ''} decimais
        error={typeof atual.itens?.[id]?.valor === 'number' && atual.itens[id].valor < 0 ? t('Informe um valor maior ou igual a zero.') : undefined}
        onChange={v => set('itens.' + id + '.valor', v)} />
      <Texto s={s} campo={'govOrcamento.itens.' + id + '.detalhe'} label="Detalhamento e fonte do item" />
    </div>)}
    {(atual.extras || []).map((x: any, i: number) => <section className="pc-gov-card" key={i}>
      <Texto s={s} campo={`govOrcamento.extras.${i}.nome`} label="Recurso adicional" />
      <CampoNumero label={t('Valor informado') + ' (' + o.moeda + ')'} value={x.valor ?? ''} decimais onChange={v => set(`extras.${i}.valor`, v)} />
      <Texto s={s} campo={`govOrcamento.extras.${i}.detalhe`} label="Detalhamento e fonte do item" />
      <Button variant="link" onClick={() => s.responder('govOrcamento.extras', atual.extras.filter((_: any, n: number) => n !== i))}>{t('Remover')}</Button>
    </section>)}
    <Button variant="secondary" onClick={() => set('extras', [...(atual.extras || []), { nome: '', valor: '', detalhe: '' }])}>{t('Adicionar recurso')}</Button>
    <p className="pc-nota">{t('Inclua equipamentos ou conectividade somente se forem recursos concretos desta ação.')}</p>
    <ResultadoOrcamento s={s} />
  </>;
}
function ResultadoOrcamento({ s }: { s: CasoStore }) {
  const o = orcamentoGovernanca(s);
  return <div className="pc-gov-orcamento" role="status">
    <b>{o.total === null ? t('Subtotal informado') : t('Total informado')}: {o.informados ? moedaGovernanca(o.subtotal, o.moeda, String(LOC())) : NA()}</b>
    {o.faltam ? <p>{t('{n} itens sem valor informado. O subtotal não é o orçamento completo.', { n: o.faltam })}</p> : null}
    <p>{t('Período do orçamento')}: {o.periodo || NA()}</p>
  </div>;
}
function Projeto({ s }: { s: CasoStore }) {
  return <>
    <p>{t('Há também um projeto concreto de uso de IA? A escolha de outra prioridade, por si só, não exige um teste de ferramenta.')}</p>
    <OptionCardGroup label={t('Incluir projeto de uso de IA?')}>
      {[['nao', 'Somente ações institucionais por enquanto'], ['sim', 'Sim, há um projeto de uso de IA identificado']].map(([v, label]) => <OptionCard key={v} name="projetoIA" value={v} label={t(label)} checked={s.ctx.projetoIA?.incluir === v} onChange={v => s.responder('projetoIA.incluir', v)} />)}
    </OptionCardGroup>
    {s.ctx.projetoIA?.incluir === 'sim' ? <Texto s={s} campo="projetoIA.descricao" label="Descreva o projeto, a tarefa de IA e o público previsto" /> : null}
    {projetoUsoDefinido(s.ctx) ? <p className="pc-nota">{t('O projeto terá seu próprio percurso de teste, implantação e expansão. As ações de governança permanecem neste plano.')}</p> : null}
  </>;
}
function ControlesGov({ s, id }: { s: CasoStore; id: string }) {
  const tela = telasAtivas(s).find(x => x.id === id)!;
  if (['local', 'prioridades', 'problemas'].includes(id)) return <ControlesTela e={s} tela={tela} />;
  switch (id) {
    case 'gov-projeto': return <Projeto s={s} />;
    case 'gov-diagnostico': return <Grupo s={s} base="govDiagnostico" campos={[
      ['atual', 'Situação institucional atual'], ['resultado', 'Resultado esperado'], ['linhaBase', 'Linha de base institucional'], ['fonte', 'Fonte e data da evidência'],
    ]} />;
    case 'gov-instrumentos': return <Instrumentos s={s} />;
    case 'gov-solucoes': {
      const marcados: string[] = s.ctx.govSolucoes?.instrumentos || [];
      return <><ChipGroup label={t('Instrumentos de política')}>{INSTRUMENTOS_GOV.map(v => <Chip key={v} label={t(v)} pressed={marcados.includes(v)} onToggle={on => s.responder('govSolucoes.instrumentos', on ? [...marcados, v] : marcados.filter(x => x !== v))} />)}</ChipGroup>
        <Texto s={s} campo="govSolucoes.justificativa" label="Por que esses instrumentos são adequados aos desafios?" /></>;
    }
    case 'gov-atores': return <Grupo s={s} base="govAtores" campos={[
      ['coordenacao', 'Instituição coordenadora'], ['instituicoes', 'Instituições participantes'], ['grupos', 'Grupos afetados'], ['participacao', 'Como serão ouvidos e envolvidos'],
    ]} />;
    case 'gov-acoes': return <Acoes s={s} />;
    case 'gov-capacidade': return <Grupo s={s} base="govCapacidade" campos={[
      ['equipe', 'Equipe e competências necessárias'], ['formacao', 'Formação institucional'], ['orientacao', 'Orientação às instituições'], ['supervisao', 'Supervisão e acompanhamento'], ['incidentes', 'Resposta a incidentes e reclamações'],
    ]} />;
    case 'gov-recursos': return <Orcamento s={s} />;
    case 'gov-sandbox': return <Grupo s={s} base="govSandbox" campos={CAMPOS_SANDBOX} />;
    case 'gov-revisao': return <Grupo s={s} base="govRevisao" campos={[
      ['indicadores', 'Indicadores e metas institucionais'], ['responsavel', 'Responsável pelo acompanhamento'], ['periodicidade', 'Periodicidade da revisão'], ['data', 'Próxima revisão'], ['alcance', 'Alcance da política'], ['progresso', 'Progresso de implementação'], ['canal', 'Transparência e prestação de contas'],
    ]} />;
    default: return null;
  }
}
export function PainelGovernanca({ s }: { s: CasoStore }) {
  const p = planoGovernanca(s), o = p.orcamento;
  const gaveta = useMediaQuery(BREAKPOINTS.drawer), [aberta, setAberta] = useState(false);
  const painel = <PlanPanel fluid paperOnly={gaveta} state={faltamDe(s).length ? 'writing' : 'complete'}
    title={p.pais || t('Governança de IA na educação')} kicker={p.titulo} facts={t('{n} desafios selecionados', { n: p.desafios.length })}
    openHref={href.plano()} summaryTitle={t('Em resumo')} originLine={<>{p.proxima}<p>{p.escopo}</p></>}
    kpis={[{ id: 'gov-orcamento', label: o.total === null ? t('Subtotal informado') : t('Total informado'), value: o.informados ? moedaGovernanca(o.subtotal, o.moeda, String(LOC())) : NA() }]}
    recommendationsTitle={t('Entregas previstas')} recommendationsCount={p.acoes.length}
    recommendations={p.acoes.slice(0, 3).map(a => ({ id: a.id, text: a.entrega }))}
    footer={<><p className="pc-nota">{o.faltam ? t('{n} itens sem valor informado. O subtotal não é o orçamento completo.', { n: o.faltam }) : o.periodo || t('Período do orçamento') + ': ' + NA()}</p><Button variant="secondary" size="sm" href={href.plano()}>{t('Abrir o plano inteiro')}</Button></>} />;
  return gaveta ? <PlanDrawer open={aberta} onOpenChange={setAberta} zoneLabel={p.titulo} summary={t('{n} desafios selecionados', { n: p.desafios.length })} closeLabel={t('Fechar')} openLabel={t('Abrir o seu plano')}>{painel}</PlanDrawer>
    : <aside className="pc-plano" aria-label={p.titulo}>{painel}</aside>;
}
function PDFs({ s }: { s: CasoStore }) {
  const [erro, setErro] = useState(''), [ocupado, setOcupado] = useState(false);
  const baixar = async (tipo: 'brief' | 'anexo') => {
    setOcupado(true); setErro('');
    try { const { gerarGovernancaPDF } = await import('../plano/pdf_governanca'); const doc = await gerarGovernancaPDF(s.estado(), { tipo }); doc.save(tipo === 'brief' ? 'policy-brief-governanca.pdf' : 'anexo-governanca.pdf'); }
    catch (e) { console.error(e); setErro(t('Não foi possível gerar o PDF.')); }
    finally { setOcupado(false); }
  };
  return <><div className="pc-botoes"><Button disabled={ocupado} onClick={() => void baixar('brief')}>{t('Policy brief (PDF)')}</Button><Button disabled={ocupado} variant="secondary" onClick={() => void baixar('anexo')}>{t('Anexo de governança (PDF)')}</Button></div>{erro ? <p role="alert">{erro}</p> : null}</>;
}
function PlanoGov({ s }: { s: CasoStore }) {
  const p = planoGovernanca(s), faltam = faltamDe(s);
  return <div className="pc-gov-plano">
    <h1>{p.titulo}</h1><p className="pc-lead">{p.pais}</p>
    <Alert kind="info" title={p.proxima}>{p.escopo}</Alert>
    <ResultadoOrcamento s={s} /><PDFs s={s} />
    {faltam.length ? <details className="pc-gov-card" open><summary>{t('Respostas que faltam')} ({faltam.length})</summary><ul>{faltam.map(q => <li key={q.id}><a href={href.pergunta(q.capitulo, q.id)}>{t(CURTO[q.id] || q.id)}</a></li>)}</ul></details> : null}
    {p.blocos.map((b, i) => <section className="pc-gov-card" key={i}><h2>{b.titulo}</h2><dl className="pc-gov-dados">{b.linhas.map((l, j) => <div key={j}><dt>{l.rotulo}</dt><dd>{l.valor}</dd></div>)}</dl></section>)}
    <p><Button variant="secondary" href={href.pergunta(4, 'gov-revisao')}>{t('Voltar')}</Button></p>
  </div>;
}
// Links e posições antigas são remapeados; as respostas antigas continuam guardadas no caso.
export function Governanca({ rota }: { rota: Rota }) {
  const s = useCaso();
  const n: Capitulo = rota.tipo === 'abertura' || rota.tipo === 'pergunta' || rota.tipo === 'sintese' ? rota.n : 3;
  const lista = telasDoCapitulo(n, s);
  const ativa = rota.tipo === 'pergunta' ? lista.find(q => q.id === rota.tela) : undefined;
  const legada = rota.tipo === 'pergunta' ? telaGovernancaLegada(rota.tela) : null;
  const remap = rota.tipo === 'refinar' ? href.pergunta(3, 'gov-recursos') : rota.tipo === 'pergunta' && !ativa ? legada ? href.pergunta(legada.n, legada.id) : href.pergunta(n, lista[0].id) : null;
  useEffect(() => { if (remap) ir(remap); }, [remap]);
  if (remap) return null;
  const info = infoCapitulo(n, s);
  if (rota.tipo === 'plano') return <Shell plano={false}><PlanoGov s={s} /></Shell>;
  if (rota.tipo === 'abertura' || rota.tipo === 'sintese') {
    const sin = rota.tipo === 'sintese', proxima = sin ? n < 4 ? href.abertura(n + 1) : href.plano() : href.pergunta(n, lista[0].id);
    return <Shell pos={{ capitulo: n, sintese: sin }} contexto={t(info.titulo)}><div className="pc-abertura">
      <ChapterOpening n={n} title={t(info.titulo)} guide={<strong>{t(info.guia)}</strong>} action={<div className="pc-botoes">
        <Button variant="secondary" href={sin ? href.pergunta(n, lista[lista.length - 1].id) : n === 1 ? href.inicio() : href.sintese(n - 1)}>{t('Voltar')}</Button><Button href={proxima}>{t('Próximo')}</Button>
      </div>}>{null}</ChapterOpening>
      {sin ? <><p>{planoGovernanca(s).proxima}</p><p className="pc-nota">{planoGovernanca(s).escopo}</p>{n === 3 || n === 4 ? <ResultadoOrcamento s={s} /> : null}</> : null}
    </div></Shell>;
  }
  if (!ativa) return null;
  const i = lista.indexOf(ativa), id = ativa.id;
  const faltaRede = id === 'problemas' && !tamanhoRedeValido(s.ctx);
  const titulo = TITULO_TELA[id] || CURTO[id] || id;
  return <Shell pos={{ capitulo: n, tela: id }} contexto={t(info.titulo)}>
    <div className="pc-pergunta" data-tela={id}><QuestionFrame kicker={t('{nome} · pergunta {i} de {total}', { nome: t(info.titulo), i: i + 1, total: lista.length })}
      title={t(titulo)}
      actions={<><div className="pc-botoes"><Button variant="secondary" href={i ? href.pergunta(n, lista[i - 1].id) : href.abertura(n)}>{t('Voltar')}</Button>
        <Button disabled={faltaRede} onClick={() => ir(lista[i + 1] ? href.pergunta(n, lista[i + 1].id) : href.sintese(n))}>{t('Próximo')}</Button></div>
        {faltaRede ? <p className="pc-nota">{t('Informe os totais da rede para avançar.')}</p> : null}</>}>
      <ControlesGov s={s} id={id} />
    </QuestionFrame></div>
  </Shell>;
}
