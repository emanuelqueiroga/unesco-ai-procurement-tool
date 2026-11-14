// v020: telas de "Educating with and without AI" (figura do projeto): desafios, público e ambiente, fases do ciclo, uma
// página de custos por desafio (as quatro categorias compartilhadas e as suas opções, com o custo com IA e sem IA lado a
// lado), custos adicionais e o plano. Valores simulados, marcados como tal, para validar o ciclo e o fluxo.
import { useEffect, useState, type ReactNode } from 'react';
import { useCaso, telasDoCapitulo, telasAtivas, telaRespondida, desafioDaTelaEd, type CasoStore, type Capitulo } from '../store';
import { QuestionFrame, OptionCard, OptionCardGroup, NumeroField, Alert, Button } from '../ui';
import { infoCapitulo, t } from '../percurso/textos';
import { href, ir, type Rota } from '../percurso/rota';
import { entradaEtapa, vizinhos } from '../percurso/navegacaoOrientada';
import { formatarMoedaEst } from '../percurso/estimativasOrcamento';
import { nomePais, paisDoCaso, LOC } from '../domain';
/** A conta de cada opção é traduzida por partes (separadas por " + "). */
const traduzConta = (c: string) => c.split(' + ').map((x) => t(x)).join(' + ');
const nfmt = (v: number) => new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 0 }).format(v);
import {
  CATEGORIAS_ED, DESAFIOS_ED, AMBIENTES, MODALIDADES, ESCOLAS_POC, SIM, lerEd, publico, publicoSugerido, fases, desafiosEscolhidos,
  opcoesEscolhidas, orcamentoEducacao, nomeDesafio, type ResultadoEd, type Alternativa,
} from '../percurso/educacaoV20';
import { AcoesPercurso } from './AcoesPercurso';
import { Shell } from './Shell';
import './educacaoV20.css';

/** Grava um valor dentro de ctx.edV20 (caminho com pontos). */
export function gravarEd(caminho: string, valor: unknown) {
  const s = useCaso.getState(), raiz = JSON.parse(JSON.stringify(s.ctx.edV20 || {}));
  const partes = caminho.split('.'); let o = raiz;
  for (const p of partes.slice(0, -1)) { if (typeof o[p] !== 'object' || o[p] === null) o[p] = {}; o = o[p]; }
  o[partes[partes.length - 1]] = valor;
  s.responder('edV20', raiz);
}

const fmt = (r: ResultadoEd) => (v: number) => formatarMoedaEst(v, r.moeda);
const AvisoSimulado = () => <Alert kind="info" title={t('Valores simulados')}>{t('Os custos unitários desta versão são simulados, para validar o ciclo e as telas; serão substituídos por valores com fonte.')}</Alert>;

function Desafios({ s }: { s: CasoStore }) {
  const sel = desafiosEscolhidos(s);
  const marcar = (id: string, on: boolean) => gravarEd('desafios', on ? [...sel.filter(x => x !== id), id] : sel.filter(x => x !== id));
  return <OptionCardGroup className="pc-lit-opcoes ed-desafios" label={t('Desafios educacionais')} type="checkbox">
    {DESAFIOS_ED.map((d, i) => <OptionCard key={d.id} type="checkbox" name="ed-desafios" value={d.id} checked={sel.includes(d.id)} label={`${i + 1} ${t(d.nome)}`} subtext={t(d.desc)} onChange={(id, on) => marcar(id, on)} />)}
  </OptionCardGroup>;
}

function Publico({ s }: { s: CasoStore }) {
  const ds = desafiosEscolhidos(s), sv = lerEd(s).publico || {};
  if (!ds.length) return <p className="pc-nota">{t('Volte e escolha pelo menos um desafio.')}</p>;
  return <div className="ed-publico">
    <p className="pc-nota">{t('Os números sugeridos partem das matrículas do país (Banco Mundial) e de razões simuladas; ajuste-os à sua rede.')}</p>
    {ds.map(d => {
      const p = publico(s, d), sug = publicoSugerido(s, d), salvo = sv[d] || {};
      return <section key={d} className="ed-cartao">
        <h2 className="ed-cartao-titulo">{nomeDesafio(d)}</h2>
        <div className="ed-campos">
          <NumeroField locale={String(LOC())} label={t('Estudantes')} value={p.estudantes} suggested={salvo.estudantes === undefined} hint={t('Sugerido: {n}', { n: nfmt(sug.estudantes) })} onChange={v => gravarEd(`publico.${d}.estudantes`, v === '' ? undefined : v)} />
          <NumeroField locale={String(LOC())} label={t('Professores')} value={p.professores} suggested={salvo.professores === undefined} hint={t('Sugerido: {n}', { n: nfmt(sug.professores) })} onChange={v => gravarEd(`publico.${d}.professores`, v === '' ? undefined : v)} />
          <label className="ed-select"><span>{t('Ambiente de implantação')}</span>
            <select value={p.ambiente} onChange={e => gravarEd(`publico.${d}.ambiente`, e.target.value)}>{AMBIENTES.map(([v, r]) => <option key={v} value={v}>{t(r)}</option>)}</select></label>
          <label className="ed-select"><span>{t('Modalidade')}</span>
            <select value={p.modalidade} onChange={e => gravarEd(`publico.${d}.modalidade`, e.target.value)}>{MODALIDADES.map(([v, r]) => <option key={v} value={v}>{t(r)}</option>)}</select></label>
          <NumeroField locale={String(LOC())} label={t('Línguas de instrução')} value={p.linguas} suggested={salvo.linguas === undefined} onChange={v => gravarEd(`publico.${d}.linguas`, v === '' ? undefined : v)} />
        </div>
      </section>;
    })}
  </div>;
}

function Fases({ s }: { s: CasoStore }) {
  const fs = fases(s), sv = lerEd(s).fases || [];
  const grava = (i: number, campo: 'meses' | 'alcance', v: number | '') => { const novo = fs.map((f, k) => ({ ...(sv[k] || {}), ...(k === i ? { [campo]: v === '' ? undefined : v } : {}) })); gravarEd('fases', novo); };
  return <div className="ed-fases">
    <p className="pc-nota">{t('As quatro fases do ciclo: testar a viabilidade em pequena escala, avaliar em condições reais, implantar para uso rotineiro e expandir mantendo a qualidade.')}</p>
    <div className="ed-rolo"><table className="ed-tabela"><thead><tr><th>{t('Fase')}</th><th>{t('Meses')}</th><th>{t('Alcance')}</th></tr></thead>
      <tbody>{fs.map((f, i) => <tr key={f.id}><th scope="row">{t(f.nome)}</th>
        <td><NumeroField locale={String(LOC())} label={t('Meses') + ' · ' + t(f.nome)} value={f.meses} size={4} onChange={v => grava(i, 'meses', v)} suggested={sv[i]?.meses === undefined} /></td>
        <td>{f.id === 'poc' ? <span className="ed-poc">{t('{n} escolas', { n: ESCOLAS_POC })}</span> : <NumeroField locale={String(LOC())} label={t('Alcance (%)') + ' · ' + t(f.nome)} value={f.alcance} size={4} percentual onChange={v => grava(i, 'alcance', v)} suggested={sv[i]?.alcance === undefined} />}</td></tr>)}</tbody></table></div>
    <p className="pc-nota">{t('Duração total: {n} meses.', { n: fs.reduce((a, f) => a + f.meses, 0) })}</p>
  </div>;
}

function Custos({ s, d }: { s: CasoStore; d: string }) {
  const r = orcamentoEducacao(s), f = fmt(r), sel = opcoesEscolhidas(s, d);
  const marcar = (id: string, on: boolean) => gravarEd(`opcoes.${d}`, on ? [...sel.filter(x => x !== id), id] : sel.filter(x => x !== id));
  const linha = (op: string, a: Alternativa) => (a === 'com' ? r.com : r.sem).linhas.find(l => l.desafio === d && l.opcao === op);
  const totalCat = (cat: string, a: Alternativa) => (a === 'com' ? r.com : r.sem).linhas.filter(l => l.desafio === d && l.cat === cat).reduce((n, l) => n + l.total, 0);
  const todas = CATEGORIAS_ED.flatMap(c => c.opcoes.map(o => o.id));
  return <div className="ed-custos">
    <AvisoSimulado />
    <p className="ed-acoes-rapidas"><Button variant="link" size="sm" onClick={() => gravarEd(`opcoes.${d}`, sel.length === todas.length ? [] : todas)}>{sel.length === todas.length ? t('Desmarcar todas') : t('Marcar todas as opções')}</Button></p>
    {CATEGORIAS_ED.map(c => <section key={c.id} className="ed-cat">
      <header className="ed-cat-cab"><h2>{c.n} {t(c.nome)}</h2>
        <p className="ed-cat-total"><span>{t('Com IA')} <b>{f(totalCat(c.id, 'com'))}</b></span><span>{t('Sem IA')} <b>{f(totalCat(c.id, 'sem'))}</b></span></p></header>
      <OptionCardGroup className="pc-lit-opcoes" label={t(c.nome)} type="checkbox">
        {c.opcoes.map(o => { const on = sel.includes(o.id), lc = linha(o.id, 'com'), ls = linha(o.id, 'sem');
          return <div key={o.id} className={'ed-opcao' + (on ? ' is-on' : '')}>
            <OptionCard type="checkbox" name={`ed-${d}`} value={o.id} checked={on} label={t(o.nome)} subtext={o.so === 'com' ? t('Só na alternativa com IA') : undefined} onChange={(id, v) => marcar(id, v)} />
            {on ? <dl className="ed-opcao-valores">
              <div><dt>{t('Com IA')}</dt><dd>{lc ? f(lc.total) : '—'}</dd>{lc ? <small>CapEx {f(lc.k)} · OpEx {f(lc.x)} · {t('Uso')} {f(lc.u)}</small> : null}</div>
              <div><dt>{t('Sem IA')}</dt><dd>{ls ? f(ls.total) : '—'}</dd>{ls ? <small>CapEx {f(ls.k)} · OpEx {f(ls.x)} · {t('Uso')} {f(ls.u)}</small> : null}</div>
              {lc || ls ? <p className="ed-conta">{traduzConta((lc || ls)!.conta)}</p> : null}
            </dl> : null}
          </div>; })}
      </OptionCardGroup>
    </section>)}
  </div>;
}

function Adicionais({ s }: { s: CasoStore }) {
  const r = orcamentoEducacao(s), f = fmt(r), sv = lerEd(s);
  const campo = (k: 'pV' | 'pO' | 'pT', rot: string, padrao: number, base: string) => <NumeroField locale={String(LOC())} label={t(rot)} percentual value={sv[k] ?? padrao} suggested={sv[k] === undefined}
    hint={t('Padrão: {p}% de {b}', { p: padrao, b: t(base) })} onChange={v => gravarEd(k, v === '' ? undefined : v)} />;
  return <div className="ed-adicionais">
    <p className="pc-nota">{t('Os mesmos percentuais e bases da governança: viagens sobre o trabalho de pessoas, overhead sobre esse trabalho e as viagens, e taxa administrativa sobre o custo direto e as viagens.')}</p>
    <div className="ed-campos">
      {campo('pV', 'Viagens e atividades presenciais', SIM.viagens, 'trabalho de pessoas')}
      {campo('pO', 'Overhead (custos indiretos)', SIM.overhead, 'trabalho e viagens')}
      {campo('pT', 'Taxa administrativa', SIM.taxa, 'custo direto e viagens')}
    </div>
    <div className="ed-rolo"><table className="ed-tabela"><thead><tr><th></th><th>{t('Com IA')}</th><th>{t('Sem IA')}</th></tr></thead><tbody>
      {([['Custo direto', 'direto'], ['Viagens e atividades presenciais', 'V'], ['Overhead (custos indiretos)', 'O'], ['Taxa administrativa', 'T'], ['Custo total', 'total']] as const).map(([rot, k]) =>
        <tr key={k} className={k === 'total' ? 'ed-total' : undefined}><th scope="row">{t(rot)}</th><td>{f(r.com[k])}</td><td>{f(r.sem[k])}</td></tr>)}
    </tbody></table></div>
  </div>;
}

const TITULOS: Record<string, string> = { 'ed-desafios': 'Quais desafios educacionais você quer enfrentar?', 'ed-publico': 'Para quem e onde?', 'ed-fases': 'Fases do ciclo', 'ed-adicionais': 'Custos adicionais' };
function titulo(id: string) { const d = desafioDaTelaEd(id); return d ? t('Quais custos você quer incluir?') : t(TITULOS[id] || id); }

export function EducacaoV20({ rota }: { rota: Rota }) {
  const s = useCaso(), [tentou, setTentou] = useState(false);
  const n: Capitulo = rota.tipo === 'pergunta' || rota.tipo === 'abertura' || rota.tipo === 'sintese' ? rota.n : 1;
  const qs = telasAtivas(s), ativa = rota.tipo === 'pergunta' ? qs.find(q => q.id === rota.tela) : undefined;
  const remap = rota.tipo === 'plano' ? null : rota.tipo === 'abertura' ? entradaEtapa(s, n) : rota.tipo === 'sintese' ? (n < 4 ? entradaEtapa(s, (n + 1) as Capitulo) : href.plano()) : !ativa ? entradaEtapa(s, n) : null;
  useEffect(() => { if (remap) window.location.replace(remap); }, [remap]);
  useEffect(() => setTentou(false), [rota.tipo === 'pergunta' ? rota.tela : '']);
  if (remap) return null;
  if (rota.tipo === 'plano') return <Shell plano={false}><PlanoEducacao s={s} /></Shell>;
  if (!ativa) return null;
  const id = ativa.id, dest = vizinhos(s, id), falta = !telaRespondida(s, ativa), d = desafioDaTelaEd(id);
  const avancar = () => { if (!falta) { ir(dest.proxima); return; } setTentou(true); };
  let corpo: ReactNode = null;
  if (id === 'ed-desafios') corpo = <Desafios s={s} />;
  else if (id === 'ed-publico') corpo = <Publico s={s} />;
  else if (id === 'ed-fases') corpo = <Fases s={s} />;
  else if (id === 'ed-adicionais') corpo = <Adicionais s={s} />;
  else if (d) corpo = <Custos s={s} d={d} />;
  return <Shell pos={{ capitulo: n, tela: id }} contexto={t(infoCapitulo(n, s).titulo)}>
    <div className="pc-pergunta" data-tela={id}>
      <QuestionFrame title={titulo(id)} kicker={d ? nomeDesafio(d) : undefined} actions={<AcoesPercurso anterior={dest.anterior} avancar={avancar} />}>
        {tentou && falta ? <div className="pc-lit-validacao" role="alert"><b>{d ? t('Marque pelo menos uma opção para continuar.') : t('Escolha pelo menos um desafio para continuar.')}</b></div> : null}
        <div className="pc-lit-campos">{corpo}</div>
      </QuestionFrame>
    </div>
  </Shell>;
}

// ---------------------------------------------------------------- plano
function PlanoEducacao({ s }: { s: CasoStore }) {
  const r = orcamentoEducacao(s), f = fmt(r), lugar = String(s.ctx.local || '').trim(), pais = s.caso?.pais ? nomePais(paisDoCaso(s.caso)) : '';
  const faltam = telasAtivas(s).filter(q => !telaRespondida(s, q));
  const pct = (a: number, b: number) => b ? Math.round(a / b * 100) + '%' : '—';
  const dif = r.com.total - r.sem.total;
  const kpi = (a: Alternativa) => { const x = a === 'com' ? r.com : r.sem; return <section className={'ed-kpi ed-kpi--' + a}>
    <h3>{a === 'com' ? t('Com IA') : t('Sem IA')}</h3>
    <p className="ed-kpi-total">{f(x.total)}</p>
    <dl><div><dt>CapEx</dt><dd>{f(x.k)} <small>{pct(x.k, x.total)}</small></dd></div><div><dt>OpEx</dt><dd>{f(x.x)} <small>{pct(x.x, x.total)}</small></dd></div>
      <div><dt>{t('Uso')}</dt><dd>{f(x.u)} <small>{pct(x.u, x.total)}</small></dd></div><div><dt>{t('Por estudante')}</dt><dd>{x.porEstudante === null ? '—' : f(x.porEstudante)}</dd></div></dl>
  </section>; };
  return <div className="ed-plano">
    <h1>{t('Plano de educação com e sem IA')}</h1>
    <p className="pc-lead">{[lugar, pais].filter(Boolean).join(' · ')}</p>
    <AvisoSimulado />
    {faltam.length ? <Alert kind="atencao" title={t('Respostas que faltam')}><ul>{faltam.map(q => <li key={q.id}><a href={href.pergunta(q.capitulo, q.id)}>{titulo(q.id)}{desafioDaTelaEd(q.id) ? ' · ' + nomeDesafio(desafioDaTelaEd(q.id)!) : ''}</a></li>)}</ul></Alert> : null}
    <h2>{t('Com IA e sem IA')}</h2>
    <div className="ed-kpis">{kpi('com')}{kpi('sem')}</div>
    <p>{dif >= 0 ? t('A alternativa com IA custa {v} a mais em {m} meses.', { v: f(dif), m: r.fases.reduce((a, x) => a + x.meses, 0) }) : t('A alternativa com IA custa {v} a menos em {m} meses.', { v: f(-dif), m: r.fases.reduce((a, x) => a + x.meses, 0) })} {t('Compare tarefas equivalentes no mesmo horizonte de tempo antes de decidir.')}</p>
    <h2>{t('Custo por desafio')}</h2>
    <div className="ed-rolo"><table className="ed-tabela"><thead><tr><th>{t('Desafio')}</th><th>{t('Estudantes')}</th><th>{t('Com IA')}</th><th>{t('Sem IA')}</th></tr></thead><tbody>
      {r.desafios.map(d => <tr key={d}><th scope="row">{nomeDesafio(d)}</th><td>{nfmt(publico(s, d).estudantes)}</td><td>{f(r.com.porDesafio[d] || 0)}</td><td>{f(r.sem.porDesafio[d] || 0)}</td></tr>)}
    </tbody></table></div>
    <h2>{t('Custo por fase')}</h2>
    <div className="ed-rolo"><table className="ed-tabela"><thead><tr><th>{t('Fase')}</th><th>{t('Meses')}</th><th>{t('Com IA')}</th><th>{t('Sem IA')}</th></tr></thead><tbody>
      {r.fases.map(x => <tr key={x.id}><th scope="row">{t(x.nome)}</th><td>{x.meses}</td><td>{f(r.com.porFase[x.id] || 0)}</td><td>{f(r.sem.porFase[x.id] || 0)}</td></tr>)}
    </tbody></table></div>
    <h2>{t('Custo por categoria')}</h2>
    <div className="ed-rolo"><table className="ed-tabela"><thead><tr><th>{t('Categoria')}</th><th>{t('Com IA')}</th><th>{t('Sem IA')}</th></tr></thead><tbody>
      {CATEGORIAS_ED.map(c => <tr key={c.id}><th scope="row">{c.n} {t(c.nome)}</th><td>{f(r.com.porCategoria[c.id] || 0)}</td><td>{f(r.sem.porCategoria[c.id] || 0)}</td></tr>)}
      <tr><th scope="row">{t('Custos adicionais')}</th><td>{f(r.com.V + r.com.O + r.com.T)}</td><td>{f(r.sem.V + r.sem.O + r.sem.T)}</td></tr>
    </tbody></table></div>
    <h2>{t('Riscos do custo total')}</h2>
    <ul className="ed-lista">
      <li><b>CapEx</b> · {t('obsolescência: dispositivos e servidores precisam de reposição ao fim da vida útil.')}</li>
      <li><b>OpEx</b> · {t('subutilização: licenças, conteúdos e equipes pagos e pouco usados.')}</li>
      <li><b>{t('Uso')}</b> · {t('volatilidade do orçamento: consumo medido de IA, computação, energia e banda varia com o uso.')}</li>
      <li>{t('Comprar só hardware raramente melhora a aprendizagem; software adaptativo é promissor quando os equipamentos já existem (GEEAP, 2023).')}</li>
    </ul>
    <h2>{t('Roteiro de implementação')}</h2>
    <ol className="ed-roteiro">
      <li><b>{t('Configurar e comparar')}</b> · {t('alternativas com e sem IA; nuvem, servidores próprios ou híbrido; prova de conceito, piloto, implantação e expansão; tarefas equivalentes no mesmo horizonte de tempo.')}</li>
      {r.fases.map(x => <li key={x.id}><b>{t(x.nome)}</b> · {t('{m} meses', { m: x.meses })}{x.id === 'poc' ? ' · ' + t('{n} escolas', { n: ESCOLAS_POC }) : ' · ' + t('{p}% do público', { p: x.alcance })}</li>)}
      <li><b>{t('Avaliar e contratar')}</b> · {t('valor educacional e evidências; direitos, segurança e acessibilidade; custo do ciclo de vida; interoperabilidade, soberania e saída.')}</li>
      <li><b>{t('Monitorar e adaptar')}</b> · {t('custo por serviço e uso; aprendizagem, bem-estar e equidade; qualidade, confiabilidade e risco; otimizar o uso, revisar, renovar ou sair.')}</li>
    </ol>
    <p className="pc-nota">{t('Os PDFs desta prioridade entram numa próxima rodada.')}</p>
    <p><Button variant="secondary" href={href.pergunta(4, 'ed-adicionais')}>{t('Voltar')}</Button></p>
  </div>;
}
