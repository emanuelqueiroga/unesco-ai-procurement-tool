// v021: telas de "Educating with and without AI". Depois da escolha dos desafios, cada desafio tem o seu ciclo, como na
// governança: público e ambiente, fases, categorias, uma tela por categoria (as opções e, em cada opção marcada, as linhas
// de custo com IA e sem IA, com quantidades e preços editáveis e "Como foi calculado") e o resumo do desafio. Depois do
// último desafio, os custos adicionais e o plano. Valores simulados, marcados como tal.
import { useEffect, useState, type ReactNode } from 'react';
import { useCaso, telasAtivas, telaRespondida, partesTelaEd, type CasoStore, type Capitulo } from '../store';
import { QuestionFrame, OptionCard, OptionCardGroup, NumeroField, Alert, Button, Popover, TextField } from '../ui';
import { infoCapitulo, t } from '../percurso/textos';
import { href, ir, type Rota } from '../percurso/rota';
import { entradaEtapa, vizinhos } from '../percurso/navegacaoOrientada';
import { formatarMoedaEst } from '../percurso/estimativasOrcamento';
import { NOME_PERFIL } from '../percurso/custosV017';
import { nomePais, paisDoCaso, LOC } from '../domain';
import {
  CATEGORIAS_ED, DESAFIOS_ED, AMBIENTES, MODALIDADES, ESCOLAS_POC, SIM, IA_TIPO, IA_ARQ, IA_PAG, IA_LIC, lerEd, publico, publicoSugerido, fases,
  desafiosEscolhidos, categoriasEscolhidas, opcoesEscolhidas, escolhaIA, escolasPoc, orcamentoEducacao, calcularDesafio, nomeDesafio, padraoParam, vale,
  type ResultadoEd, type Alternativa, type CompCalc, type OpcaoCalc, type DesafioCalc, type ParamDef, type PapelExtraEd, type AltSel,
} from '../percurso/educacaoV20';
import { AcoesPercurso } from './AcoesPercurso';
import { Shell } from './Shell';
import './educacaoV20.css';

/** O NumeroField com `percentual` mostra e devolve fração (0,25 = 25%); o percurso guarda pontos percentuais (25). */
const paraFracao = (pp: number) => pp / 100;
const paraPontos = (v: number | '') => v === '' ? undefined : Math.round(v * 100 * 1e6) / 1e6;
const nfmt = (v: number, dec = 0) => new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: dec }).format(v);
const qfmt = (v: number) => nfmt(v, Math.abs(v) < 10 && v % 1 ? 2 : Math.abs(v) < 1000 && v % 1 ? 1 : 0);
const ALTS: Alternativa[] = ['com', 'sem'];
const rotAlt = (a: Alternativa) => a === 'com' ? t('Com IA') : t('Sem IA');
const CLASSE: Record<string, string> = { capex: 'CapEx', opex: 'OpEx', uso: 'Utilidades (consumo)' };
const rotClasse = (c: string) => c === 'uso' ? t('Utilidades (consumo)') : CLASSE[c];

/** Grava um valor dentro de ctx.edV20 (caminho com pontos); undefined apaga só aquela chave. */
export function gravarEd(caminho: string, valor: unknown) {
  const s = useCaso.getState(), raiz = JSON.parse(JSON.stringify(s.ctx.edV20 || {}));
  const partes = caminho.split('.'); let o = raiz;
  for (const p of partes.slice(0, -1)) { if (typeof o[p] !== 'object' || o[p] === null) o[p] = {}; o = o[p]; }
  if (valor === undefined) delete o[partes[partes.length - 1]]; else o[partes[partes.length - 1]] = valor;
  s.responder('edV20', raiz);
}
const lerCaminho = (caminho: string): any => caminho.split('.').reduce((o: any, k) => (o && typeof o === 'object' ? o[k] : undefined), useCaso.getState().ctx.edV20 || {});

const fmtR = (r: { moeda: string }) => (v: number) => formatarMoedaEst(v, r.moeda);
const AvisoSimulado = () => <Alert kind="info" title={t('Valores simulados')}>{t('Os custos unitários desta versão são simulados, para validar o ciclo e as telas; serão substituídos por valores com fonte.')}</Alert>;

// ---------------------------------------------------------------- desafios
function Desafios({ s }: { s: CasoStore }) {
  const sel = desafiosEscolhidos(s);
  const marcar = (id: string, on: boolean) => gravarEd('desafios', on ? [...sel.filter(x => x !== id), id] : sel.filter(x => x !== id));
  return <OptionCardGroup className="pc-lit-opcoes ed-desafios" label={t('Desafios educacionais')} type="checkbox">
    {DESAFIOS_ED.map((d, i) => <OptionCard key={d.id} type="checkbox" name="ed-desafios" value={d.id} checked={sel.includes(d.id)} label={`${i + 1} ${t(d.nome)}`} subtext={t(d.desc)} onChange={(id, on) => marcar(id, on)} />)}
  </OptionCardGroup>;
}

// ---------------------------------------------------------------- público e ambiente
function Selecao({ rotulo, valor, opcoes, onChange }: { rotulo: string; valor: string; opcoes: readonly (readonly [string, string])[]; onChange: (v: string) => void }) {
  return <label className="ed-select"><span className="ed-select-rotulo">{rotulo}</span>
    <select value={valor} onChange={e => onChange(e.target.value)}>{opcoes.map(([v, r]) => <option key={v} value={v}>{t(r)}</option>)}</select></label>;
}
function Publico({ s, d }: { s: CasoStore; d: string }) {
  const p = publico(s, d), sug = publicoSugerido(s, d, p.ambiente), salvo = lerEd(s).publico?.[d] || {};
  const grava = (k: string, v: unknown) => gravarEd(`publico.${d}.${k}`, v === '' ? undefined : v);
  const anteriores = desafiosEscolhidos(s).filter((x, i, a) => i < a.indexOf(d));
  const num = (k: 'estudantes' | 'professores' | 'escolas' | 'linguas', rot: string) => <NumeroField locale={String(LOC())} label={t(rot)} value={p[k]} suggested={salvo[k] === undefined}
    hint={k === 'linguas' ? undefined : t('Sugerido: {n}', { n: nfmt(sug[k] as number) })} onChange={v => grava(k, v)} />;
  const pct = (k: 'semEnergia' | 'semInternet' | 'dispositivos' | 'deficiencia', rot: string) => <NumeroField locale={String(LOC())} label={t(rot)} value={paraFracao(p[k])} percentual suggested={salvo[k] === undefined}
    hint={t('Sugerido: {n}%', { n: nfmt(sug[k] as number) })} onChange={v => grava(k, paraPontos(v))} />;
  const semLocal = p.ambiente === 'casa';
  return <div className="ed-publico">
    <p className="pc-nota">{t('Os números sugeridos partem das matrículas do país (Banco Mundial) e de razões simuladas; ajuste-os à sua rede.')}</p>
    <section className="ed-cartao">
      <h2 className="ed-cartao-titulo">{t('Quem participa')}</h2>
      <div className="ed-campos ed-campos--alinhados">
        {num('estudantes', 'Estudantes')}{num('professores', 'Professores')}
        {semLocal ? null : num('escolas', p.ambiente === 'escolas' ? 'Escolas' : p.ambiente === 'centros' ? 'Centros comunitários' : 'Instituições de educação profissional')}
        {num('linguas', 'Línguas de instrução')}
      </div>
    </section>
    <section className="ed-cartao">
      <h2 className="ed-cartao-titulo">{t('Onde e como')}</h2>
      <div className="ed-campos ed-campos--alinhados">
        <Selecao rotulo={t('Ambiente de implantação')} valor={p.ambiente} opcoes={AMBIENTES} onChange={v => grava('ambiente', v)} />
        <Selecao rotulo={t('Modalidade')} valor={p.modalidade} opcoes={MODALIDADES} onChange={v => grava('modalidade', v)} />
      </div>
    </section>
    <section className="ed-cartao">
      <h2 className="ed-cartao-titulo">{t('Condições de partida')}</h2>
      <div className="ed-campos ed-campos--alinhados">
        {semLocal ? null : pct('semEnergia', 'Locais sem energia confiável')}
        {semLocal ? null : pct('semInternet', 'Locais sem internet')}
        {pct('dispositivos', 'Estudantes que já têm dispositivo')}
        {pct('deficiencia', 'Estudantes com deficiência')}
      </div>
    </section>
    {anteriores.length && !semLocal && p.modalidade !== 'online' ? <section className="ed-cartao">
      <h2 className="ed-cartao-titulo">{t('Infraestrutura compartilhada')}</h2>
      <Selecao rotulo={t('Este desafio atende as mesmas escolas de outro desafio?')} valor={p.mesmas}
        opcoes={[['', 'Não, são outras escolas'] as const, ...anteriores.map(x => [x, nomeDesafio(x)] as const)]} onChange={v => grava('mesmas', v || undefined)} />
      <p className="pc-nota">{t('Se forem as mesmas, energia, conectividade, rede sem fio, servidores locais e pacotes offline entram uma vez só: aqui contam apenas os locais além dos do outro desafio.')}</p>
    </section> : null}
  </div>;
}

// ---------------------------------------------------------------- fases
function Fases({ s, d }: { s: CasoStore; d: string }) {
  const fs = fases(s, d), sv = lerEd(s).fasesD?.[d] || [], comum = lerEd(s).fases || [];
  const grava = (i: number, campo: 'meses' | 'alcance', v: number | '' | undefined) => { const novo = fs.map((_f, k) => ({ ...(sv[k] || {}), ...(k === i ? { [campo]: v === '' ? undefined : v } : {}) })); gravarEd(`fasesD.${d}`, novo); };
  const sugerido = (i: number, k: 'meses' | 'alcance') => (sv[i] as any)?.[k] === undefined && (comum[i] as any)?.[k] === undefined;
  const dc = calcularDesafio(s, d), p = publico(s, d), poc = escolasPoc(s, d);
  return <div className="ed-fases">
    <p className="pc-nota">{t('As quatro fases do ciclo: testar a viabilidade em pequena escala, avaliar em condições reais, implantar para uso rotineiro e expandir mantendo a qualidade.')}</p>
    <div className="ed-rolo"><table className="ed-tabela"><thead><tr><th>{t('Fase')}</th><th>{t('Meses')}</th><th>{t('Alcance')}</th></tr></thead>
      <tbody>{fs.map((f, i) => <tr key={f.id}><th scope="row">{t(f.nome)}</th>
        <td><NumeroField locale={String(LOC())} label={t('Meses') + ' · ' + t(f.nome)} value={f.meses} size={4} onChange={v => grava(i, 'meses', v)} suggested={sugerido(i, 'meses')} /></td>
        <td>{f.id === 'poc' ? <NumeroField locale={String(LOC())} label={t('Locais na prova de conceito')} value={poc} size={4} suggested={lerEd(s).poc?.[d] === undefined} hint={t('locais')} onChange={v => gravarEd(`poc.${d}`, v === '' ? undefined : v)} />
          : <NumeroField locale={String(LOC())} label={t('Alcance (%)') + ' · ' + t(f.nome)} value={paraFracao(f.alcance)} size={4} percentual onChange={v => grava(i, 'alcance', paraPontos(v) ?? '')} suggested={sugerido(i, 'alcance')} />}</td></tr>)}</tbody></table></div>
    <h2 className="ed-subtitulo">{t('Quem entra em cada fase')}</h2>
    <p className="pc-nota">{t('Compras feitas uma vez usam quem entra na fase (novos); custos mensais usam quem é atendido na fase, multiplicado pelos meses.')}</p>
    <div className="ed-rolo"><table className="ed-tabela ed-tabela--num"><thead><tr><th>{t('Fase')}</th><th>{p.ambiente === 'casa' ? t('Famílias') : t('Locais')}</th><th>{t('Estudantes')}</th><th>{t('Professores')}</th><th>{t('Novos estudantes')}</th><th>{t('Novos professores')}</th></tr></thead>
      <tbody>{dc.fases.map(f => <tr key={f.id}><th scope="row">{t(f.nome)}</th><td>{nfmt(p.ambiente === 'casa' ? f.casa : f.E)}</td><td>{nfmt(f.A)}</td><td>{nfmt(f.P)}</td><td>{nfmt(f.nA)}</td><td>{nfmt(f.nP)}</td></tr>)}</tbody></table></div>
    <p className="pc-nota">{t('Duração total: {n} meses.', { n: fs.reduce((a, f) => a + f.meses, 0) })}{dc.ref ? ' ' + t('Infraestrutura compartilhada com {d}.', { d: nomeDesafio(dc.ref) }) : ''}</p>
  </div>;
}

// ---------------------------------------------------------------- categorias
function Categorias({ s, d }: { s: CasoStore; d: string }) {
  const sel = categoriasEscolhidas(s, d);
  const marcar = (id: string, on: boolean) => gravarEd(`categorias.${d}`, on ? [...sel.filter(x => x !== id), id] : sel.filter(x => x !== id));
  return <OptionCardGroup className="pc-lit-opcoes" label={t('Categorias de custo')} type="checkbox">
    {CATEGORIAS_ED.map(c => <OptionCard key={c.id} type="checkbox" name={`ed-cat-${d}`} value={c.id} checked={sel.includes(c.id)} label={`${c.n} ${t(c.nome)}`}
      subtext={c.opcoes.map(o => t(o.nome)).join(' · ')} onChange={(id, on) => marcar(id, on)} />)}
  </OptionCardGroup>;
}

// ---------------------------------------------------------------- opções de uma categoria e linhas
function Opcoes({ s, d, cat }: { s: CasoStore; d: string; cat: string }) {
  const c = CATEGORIAS_ED.find(x => x.id === cat)!, sel = lerEd(s).opcoes?.[d] || [], r = orcamentoEducacao(s), f = fmtR(r), dc = r.porDesafio[d] || calcularDesafio(s, d);
  const marcar = (id: string, on: boolean) => gravarEd(`opcoes.${d}`, on ? [...sel.filter(x => x !== id), id] : sel.filter(x => x !== id));
  const tot = (a: Alternativa) => dc.opcoes.filter(o => o.op.startsWith(cat)).reduce((n, o) => n + o[a].total, 0);
  return <div className="ed-custos">
    <AvisoSimulado />
    <p className="ed-cat-total"><span>{t('Com IA')} <b>{f(tot('com'))}</b></span><span>{t('Sem IA')} <b>{f(tot('sem'))}</b></span></p>
    <OptionCardGroup className="pc-lit-opcoes" label={`${c.n} ${t(c.nome)}`} type="checkbox">
      {c.opcoes.map(o => { const on = sel.includes(o.id), oc = dc.opcoes.find(x => x.op === o.id);
        return <div key={o.id} className={'ed-opcao' + (on ? ' is-on' : '')}>
          <OptionCard type="checkbox" name={`ed-${d}-${cat}`} value={o.id} checked={on} label={t(o.nome)} subtext={o.so === 'com' ? t('Só na alternativa com IA') : undefined} onChange={(id, v) => marcar(id, v)} />
          {on && oc ? <OpcaoAberta s={s} d={d} oc={oc} dc={dc} r={r} /> : null}
        </div>; })}
    </OptionCardGroup>
  </div>;
}

function Totais({ x, f, a, so }: { x: { k: number; x: number; u: number; total: number }; f: (v: number) => string; a: Alternativa; so?: Alternativa }) {
  const na = so && so !== a;
  return <div className={'ed-tot ed-tot--' + a}><dt>{rotAlt(a)}</dt><dd>{na ? t('não se aplica') : f(x.total)}</dd>
    {na ? null : <small className="ed-classes"><span>CapEx {f(x.k)}</span><span>OpEx {f(x.x)}</span><span>{t('Utilidades (consumo)')} {f(x.u)}</span></small>}</div>;
}

function OpcaoAberta({ s, d, oc, dc, r }: { s: CasoStore; d: string; oc: OpcaoCalc; dc: DesafioCalc; r: ResultadoEd }) {
  const f = fmtR(r), so = CATEGORIAS_ED.flatMap(c => c.opcoes).find(o => o.id === oc.op)?.so;
  const ids = [...new Set(oc.comps.map(c => c.def.id))];
  return <div className="ed-aberta">
    <dl className="ed-opcao-valores">{ALTS.map(a => <Totais key={a} x={oc[a]} f={f} a={a} so={so} />)}</dl>
    {oc.op === 'e43' ? <EscolhaIA s={s} d={d} /> : null}
    <Comuns d={d} oc={oc} />
    <div className="ed-linhas">{ids.map(id => <LinhaEd key={id} s={s} d={d} comps={oc.comps.filter(c => c.def.id === id)} dc={dc} r={r} />)}</div>
  </div>;
}

/** Valores que valem para várias linhas da opção (horas do curso, professores por turma…), editados uma vez. */
function Comuns({ d, oc }: { d: string; oc: OpcaoCalc }) {
  const vistos = new Map<string, { pd: ParamDef; alts: Alternativa[]; valores: Partial<Record<Alternativa, number>> }>();
  for (const c of oc.comps) for (const pd of c.def.params || []) if (pd.comum && c.on) {
    const x = vistos.get(pd.id) || { pd, alts: [], valores: {} };
    if (!x.alts.includes(c.alt)) x.alts.push(c.alt);
    x.valores[c.alt] = c.params[pd.id]; vistos.set(pd.id, x);
  }
  if (!vistos.size) return null;
  const base = `linhas.${d}.${oc.op}.p`;
  return <section className="ed-comuns" aria-label={t('Valores comuns às linhas desta opção')}>
    <h4 className="ed-ia-titulo">{t('Valores comuns às linhas desta opção')}</h4>
    <div className="ed-campos ed-campos--linha">{[...vistos.values()].flatMap(({ pd, alts, valores }) => {
      const difere = typeof pd.padrao !== 'number' && alts.length > 1;
      return (difere ? ALTS.filter(a => alts.includes(a)) : [null]).map(a => { const al = a || alts[0], salvo = lerCaminho(`${base}.${pd.id}`);
        const gravado = a ? (salvo && typeof salvo === 'object' ? salvo[a] : undefined) : (typeof salvo === 'number' ? salvo : undefined);
        return <NumeroField key={pd.id + (a || '')} locale={String(LOC())} label={t(pd.rotulo) + (a ? ' · ' + rotAlt(a) : '')} value={valores[al] ?? padraoParam(pd, al)} decimais suffix={pd.pct ? '%' : undefined}
          suggested={gravado === undefined} hint={t('Sugerido: {n}', { n: nfmt(padraoParam(pd, al), 2) + (pd.pct ? '%' : '') })} onChange={x => gravarEd(`${base}.${pd.id}${a ? '.' + a : ''}`, x === '' ? undefined : x)} />; });
    })}</div>
  </section>;
}

function EscolhaIA({ s, d }: { s: CasoStore; d: string }) {
  const e = escolhaIA(s, d), grava = (k: string, v: string) => gravarEd(`ia.${d}.${k}`, v);
  return <section className="ed-ia" aria-label={t('Como a ferramenta de IA é oferecida')}>
    <h4 className="ed-ia-titulo">{t('Como a ferramenta de IA é oferecida')}</h4>
    <div className="ed-campos ed-campos--alinhados ed-campos--largos">
      <Selecao rotulo={t('Tipo de tecnologia')} valor={e.tipo} opcoes={IA_TIPO} onChange={v => grava('tipo', v)} />
      <Selecao rotulo={t('Arquitetura')} valor={e.arq} opcoes={IA_ARQ} onChange={v => grava('arq', v)} />
      <Selecao rotulo={t('Forma de pagamento')} valor={e.pag} opcoes={IA_PAG} onChange={v => grava('pag', v)} />
      <Selecao rotulo={t('Licença')} valor={e.lic} opcoes={IA_LIC} onChange={v => grava('lic', v)} />
    </div>
    <p className="pc-nota">{t('As linhas abaixo se ligam conforme a escolha: licenças, assinatura, consumo de tokens, base de conhecimento, desenvolvimento próprio ou GPUs. Código aberto e pesos abertos não eliminam custos: mudam onde eles aparecem.')}</p>
  </section>;
}

/** Uma linha de custo (um componente) com as duas alternativas. */
function LinhaEd({ s, d, comps, dc, r }: { s: CasoStore; d: string; comps: CompCalc[]; dc: DesafioCalc; r: ResultadoEd }) {
  const def = comps[0].def, on = comps[0].on, f = fmtR(r), base = `linhas.${d}.${def.id}`;
  const altsLinha = ALTS.filter(a => vale(def, a));
  const selo = def.alt === 'ambos' ? t('Com e sem IA') : def.alt === 'com' ? t('Só com IA') : t('Só sem IA');
  const ligar = (v: boolean) => { gravarEd(base + '.off', v ? undefined : true); gravarEd(base + '.on', v && !comps[0].ligadoPadrao ? true : undefined); };
  return <div className={'ed-linha' + (on ? '' : ' is-off') + (def.informativo ? ' is-info' : '')} role="group" aria-label={t(def.nome)}>
    <div className="ed-linha-cab">
      <label className="ed-linha-liga"><input type="checkbox" checked={on} onChange={e => ligar(e.target.checked)} /> <span className="ed-linha-nome">{t(def.nome)}</span></label>
      <span className="ed-selos"><span className={'ed-selo ed-selo--' + def.alt}>{selo}</span><span className="ed-selo ed-selo--classe">{def.informativo ? t('fora do total') : rotClasse(def.classe)}</span></span>
    </div>
    <p className="ed-linha-formula">{t(def.formula)}</p>
    {!on && !comps[0].ligadoPadrao && comps[0].motivo ? <p className="pc-nota">{t('Desligada por padrão: {m}.', { m: t(comps[0].motivo) })}</p> : null}
    {on ? <>
      <dl className="ed-linha-valores">{ALTS.map(a => { const c = comps.find(x => x.alt === a);
        return <div key={a} className={'ed-tot ed-tot--' + a}><dt>{rotAlt(a)}</dt><dd>{c ? f(c.total) : t('não se aplica')}</dd></div>; })}</dl>
      <ResumoLinha comps={comps} altsLinha={altsLinha} f={f} />
      <details className="ed-ajustar"><summary>{t('Ajustar quantidades e preços')}</summary>
        <CamposLinha d={d} comps={comps} altsLinha={altsLinha} base={base} moeda={r.moeda} f={f} />
      </details>
      {comps[0].def.nota ? <p className="pc-nota">{t(comps[0].def.nota)}</p> : null}
      <ComoCalculadoEd comps={comps} dc={dc} f={f} />
    </> : null}
  </div>;
}

/** Os valores que a linha usa, à vista: parâmetros, preço e equipe. */
function ResumoLinha({ comps, altsLinha, f }: { comps: CompCalc[]; altsLinha: Alternativa[]; f: (v: number) => string }) {
  const def = comps[0].def, por = (a: Alternativa) => comps.find(c => c.alt === a) || comps[0], partes: string[] = [];
  const val = (get: (c: CompCalc) => string) => { const vs = altsLinha.map(a => get(por(a))); return vs.length > 1 && vs[0] !== vs[1] ? altsLinha.map((a, i) => `${rotAlt(a)} ${vs[i]}`).join(' / ') : vs[0]; };
  for (const pd of def.params || []) partes.push(`${t(pd.rotulo)}: ${val(c => nfmt(c.params[pd.id], 2) + (pd.pct ? '%' : ''))}`);
  if (def.preco) partes.push(`${t(def.preco.rotulo)}: ${val(c => f(c.unit))}`);
  if (def.papeis) for (const p of comps[0].papeis) partes.push(`${t(p.papel)}: ${nfmt(p.pessoas, 1)} × ${nfmt(p.ded * 100)}% × ${f(p.unit)}`);
  return partes.length ? <p className="ed-linha-resumo">{partes.join(' · ')}</p> : null;
}

function CamposLinha({ d, comps, altsLinha, base, moeda, f }: { d: string; comps: CompCalc[]; altsLinha: Alternativa[]; base: string; moeda: string; f: (v: number) => string }) {
  const def = comps[0].def, por = (a: Alternativa) => comps.find(c => c.alt === a) || comps[0];
  const campoParam = (pd: ParamDef) => { if (pd.comum) return [];
    const difere = typeof pd.padrao !== 'number' && altsLinha.length > 1;
    const um = (a: Alternativa | null) => { const c = por(a || altsLinha[0]), v = c.params[pd.id], padrao = padraoParam(pd, a || altsLinha[0]);
      const salvo = lerCaminho(`${base}.p.${pd.id}`), gravado = a ? (salvo && typeof salvo === 'object' ? salvo[a] : undefined) : (typeof salvo === 'number' ? salvo : undefined);
      return <NumeroField key={pd.id + (a || '')} locale={String(LOC())} label={t(pd.rotulo) + (a ? ' · ' + rotAlt(a) : '')} value={v} decimais suffix={pd.pct ? '%' : undefined} suggested={gravado === undefined}
        hint={t('Sugerido: {n}', { n: nfmt(padrao, 2) + (pd.pct ? '%' : '') })} onChange={x => gravarEd(`${base}.p.${pd.id}${a ? '.' + a : ''}`, x === '' ? undefined : x)} />; };
    return difere ? altsLinha.map(a => um(a)) : [um(null)];
  };
  const precoDifere = def.preco && typeof def.preco.padrao !== 'number' && altsLinha.length > 1;
  const campoPreco = (a: Alternativa | null) => { const c = por(a || altsLinha[0]), salvo = lerCaminho(`${base}.unit`);
    const gravado = a ? (salvo && typeof salvo === 'object' ? salvo[a] : undefined) : (typeof salvo === 'number' ? salvo : undefined);
    return <NumeroField key={'u' + (a || '')} locale={String(LOC())} label={t(def.preco!.rotulo) + ' (' + moeda + ')' + (a ? ' · ' + rotAlt(a) : '')} value={c.unit} decimais suggested={gravado === undefined}
      hint={t('Sugerido: {v}', { v: f(c.unitRef) }) + (def.preco!.perfil ? ' · ' + t('salário do país (ILOSTAT) com encargos') : def.preco!.local ? ' · ' + t('ajustado ao nível de preços do país') : '')}
      onChange={x => gravarEd(`${base}.unit${a ? '.' + a : ''}`, x === '' ? undefined : x)} />; };
  return <>
    {(def.params?.length || def.preco) ? <div className="ed-campos ed-campos--linha">
      {(def.params || []).flatMap(campoParam)}
      {def.preco ? (precoDifere ? altsLinha.map(a => campoPreco(a)) : [campoPreco(null)]) : null}
    </div> : null}
    {def.papeis ? <Papeis d={d} comps={comps} base={base} moeda={moeda} f={f} /> : null}
  </>;
}

function Papeis({ d, comps, base, moeda, f }: { d: string; comps: CompCalc[]; base: string; moeda: string; f: (v: number) => string }) {
  const def = comps[0].def, c0 = comps[0], porPapel = new Map<string, CompCalc['papeis'][number]>();
  for (const c of comps) for (const p of c.papeis) if (!porPapel.has(p.extra || p.papel)) porPapel.set(p.extra || p.papel, p);
  const papeis = [...porPapel.values()].filter(p => !p.extra);
  const extras: PapelExtraEd[] = (lerEd(useCaso.getState()).extras?.[d]?.[def.id] || []);
  const salvarExtras = (lista: PapelExtraEd[]) => gravarEd(`extras.${d}.${def.id}`, lista.length ? lista : undefined);
  const mudar = (id: string, k: keyof PapelExtraEd, v: unknown) => salvarExtras(extras.map(x => x.id === id ? { ...x, [k]: v === '' ? undefined : v } : x));
  return <div className="ed-papeis">
    {papeis.map(p => { const salvo = lerCaminho(`${base}.papeis.${p.papel}`) || {};
      return <div key={p.papel} className="ed-papel" role="group" aria-label={t(p.papel)}>
        <p className="ed-papel-nome"><b>{t(p.papel)}</b> <span>{t(NOME_PERFIL[p.perfil])}{p.alt !== 'ambos' ? ' · ' + (p.alt === 'com' ? t('Só com IA') : t('Só sem IA')) : ''}</span></p>
        <div className="ed-campos ed-campos--linha">
          <NumeroField locale={String(LOC())} label={t('Pessoas')} value={salvo.pessoas ?? ''} placeholder={nfmt(p.pessoas, 1)} decimais hint={t('Vazio = calculado ({n})', { n: nfmt(p.pessoas, 1) })} onChange={v => gravarEd(`${base}.papeis.${p.papel}.pessoas`, v === '' ? undefined : v)} />
          <NumeroField locale={String(LOC())} label={t('Dedicação (%)')} value={salvo.ded === undefined ? p.ded : salvo.ded} percentual suggested={salvo.ded === undefined} onChange={v => gravarEd(`${base}.papeis.${p.papel}.ded`, v === '' ? undefined : v)} />
          <NumeroField locale={String(LOC())} label={t('Custo mensal por pessoa') + ' (' + moeda + ')'} value={salvo.unit ?? ''} placeholder={nfmt(p.unitRef, 2)} decimais hint={t('Vazio = salário do país (ILOSTAT) com encargos ({v}).', { v: f(p.unitRef) })} onChange={v => gravarEd(`${base}.papeis.${p.papel}.unit`, v === '' ? undefined : v)} />
        </div>
      </div>; })}
    {extras.map(x => <div key={x.id} className="ed-papel" role="group" aria-label={x.papel || t('Novo papel')}>
      <div className="ed-campos ed-campos--linha">
        <TextField label={t('Papel')} value={x.papel || ''} onChange={v => mudar(x.id, 'papel', v)} />
        <Selecao rotulo={t('Perfil (salário do país)')} valor={String(x.perfil)} opcoes={([1, 2, 3, 4] as const).map(g => [String(g), NOME_PERFIL[g]] as const)} onChange={v => mudar(x.id, 'perfil', Number(v))} />
        <Selecao rotulo={t('Alternativa')} valor={x.alt} opcoes={[['ambos', 'Com e sem IA'], ['com', 'Só com IA'], ['sem', 'Só sem IA']] as const} onChange={v => mudar(x.id, 'alt', v as AltSel)} />
        <NumeroField locale={String(LOC())} label={t('Pessoas')} value={x.pessoas ?? ''} decimais onChange={v => mudar(x.id, 'pessoas', v)} />
        <NumeroField locale={String(LOC())} label={t('Dedicação (%)')} value={x.ded ?? ''} percentual onChange={v => mudar(x.id, 'ded', v)} />
        <NumeroField locale={String(LOC())} label={t('Custo mensal por pessoa') + ' (' + moeda + ')'} value={x.unit ?? ''} decimais hint={t('Vazio = salário do país (ILOSTAT) do perfil, com encargos.')} onChange={v => mudar(x.id, 'unit', v)} />
      </div>
      <p><Button variant="secondary" size="sm" onClick={() => salvarExtras(extras.filter(y => y.id !== x.id))}>{t('Remover papel')}</Button></p>
    </div>)}
    <p><Button variant="secondary" size="sm" onClick={() => salvarExtras([...extras, { id: 'p' + Date.now().toString(36), papel: '', perfil: 2, pessoas: 1, ded: 1, alt: 'ambos' }])}>{t('Adicionar papel')}</Button></p>
    {c0 ? null : null}
  </div>;
}

/** "Como foi calculado": a conta, fase por fase, nas duas alternativas, e de onde vem cada número. */
function ComoCalculadoEd({ comps, dc, f }: { comps: CompCalc[]; dc: DesafioCalc; f: (v: number) => string }) {
  const def = comps[0].def, unidade = def.unidade ? t(def.unidade) : '';
  const fechar = <button type="button" className="pc-est-fechar" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))}>{t('Fechar')}</button>;
  const nomeFase = (id: string) => t(dc.fases.find(x => x.id === id)?.nome || id);
  return <p className="pc-est-acoes pv-v17-conta"><Popover className="pc-est-popover" label={t('Como foi calculado')} title={t('Como foi calculado')} actions={fechar}>
    <span className="pv-conta-formula">{t(def.formula)}</span>
    <span className="pv-conta-partes">{comps.map(c => <span key={c.alt} className="pv-conta-parte">
      <b>{rotAlt(c.alt)}: {f(c.total)}</b>
      {def.papeis ? c.papeis.map(p => <span key={p.extra || p.papel}>{t(p.papel)}: {nfmt(p.pessoas, 1)} × {nfmt(p.ded * 100)}% × {f(p.unit)} {t('por mês')} = {f(p.valor)}</span>)
        : c.porFase.filter(v => v.qtd > 0).map(v => <span key={v.fase}>{nomeFase(v.fase)}: {def.pctDe ? `${nfmt(v.unit * 100, 1)}% × ${f(v.qtd)}` : `${qfmt(v.qtd)} ${unidade} × ${f(v.unit)}`} = {f(v.valor)}</span>)}
      {!def.papeis && !c.porFase.some(v => v.qtd > 0) ? <span>{t('Sem quantidade neste caso.')}</span> : null}
    </span>)}</span>
    <span className="pv-conta-fonte">{def.preco?.perfil || def.papeis ? t('Salário: ILOSTAT, média mensal do perfil no país, atualizada pela inflação (FMI) e com os encargos patronais (SSA).') : def.preco?.local ? t('Serviço local: valor de referência em US$ ajustado ao nível de preços do país (Banco Mundial, PPC).') : t('Bem ou serviço internacional: valor de referência em US$, sem ajuste de preços locais.')}</span>
    <span className="pv-conta-grau">{t('Grau C: valor simulado desta versão, que será substituído por valor com fonte.')}</span>
    <span className="pv-conta-fonte"><a href={href.metodologia()}>{t('Como o custo é calculado')}</a></span>
  </Popover></p>;
}

// ---------------------------------------------------------------- resumo do desafio
function Resumo({ s, d }: { s: CasoStore; d: string }) {
  const r = orcamentoEducacao(s), f = fmtR(r), dc = r.porDesafio[d];
  if (!dc) return null;
  const tot = (a: Alternativa) => dc.opcoes.reduce((o, x) => ({ k: o.k + x[a].k, x: o.x + x[a].x, u: o.u + x[a].u, total: o.total + x[a].total }), { k: 0, x: 0, u: 0, total: 0 });
  const porFase = (a: Alternativa, i: number) => dc.opcoes.reduce((n, o) => n + o.comps.filter(c => c.alt === a && c.on && !c.def.informativo).reduce((m, c) => m + c.porFase[i].valor, 0), 0);
  const porCat = (a: Alternativa, cat: string) => dc.opcoes.filter(o => o.op.startsWith(cat)).reduce((n, o) => n + o[a].total, 0);
  const p = publico(s, d);
  return <div className="ed-resumo">
    <AvisoSimulado />
    <p className="pc-nota">{t('Custo direto deste desafio, antes dos custos adicionais (viagens, overhead e taxa), que entram no fim.')}</p>
    <dl className="ed-opcao-valores ed-opcao-valores--grande">{ALTS.map(a => <Totais key={a} x={tot(a)} f={f} a={a} />)}</dl>
    <p>{t('Por estudante')}: {rotAlt('com')} {f(tot('com').total / Math.max(1, p.estudantes))} · {rotAlt('sem')} {f(tot('sem').total / Math.max(1, p.estudantes))}</p>
    <h2 className="ed-subtitulo">{t('Por fase')}</h2>
    <div className="ed-rolo"><table className="ed-tabela ed-tabela--num"><thead><tr><th>{t('Fase')}</th><th>{t('Meses')}</th><th>{t('Com IA')}</th><th>{t('Sem IA')}</th></tr></thead><tbody>
      {dc.fases.map((x, i) => <tr key={x.id}><th scope="row">{t(x.nome)}</th><td>{x.meses}</td><td>{f(porFase('com', i))}</td><td>{f(porFase('sem', i))}</td></tr>)}
    </tbody></table></div>
    <h2 className="ed-subtitulo">{t('Por categoria')}</h2>
    <div className="ed-rolo"><table className="ed-tabela ed-tabela--num"><thead><tr><th>{t('Categoria')}</th><th>{t('Com IA')}</th><th>{t('Sem IA')}</th></tr></thead><tbody>
      {CATEGORIAS_ED.filter(c => categoriasEscolhidas(s, d).includes(c.id)).map(c => <tr key={c.id}><th scope="row">{c.n} {t(c.nome)}</th><td>{f(porCat('com', c.id))}</td><td>{f(porCat('sem', c.id))}</td></tr>)}
    </tbody></table></div>
    {opcoesEscolhidas(s, d).length ? null : <p className="pc-nota">{t('Nenhuma opção escolhida neste desafio.')}</p>}
  </div>;
}

// ---------------------------------------------------------------- custos adicionais
function Adicionais({ s }: { s: CasoStore }) {
  const r = orcamentoEducacao(s), f = fmtR(r), sv = lerEd(s);
  const campo = (k: 'pV' | 'pO' | 'pT', rot: string, padrao: number, base: string) => <NumeroField locale={String(LOC())} label={t(rot)} percentual value={paraFracao(sv[k] ?? padrao)} suggested={sv[k] === undefined}
    hint={t('Padrão: {p}% de {b}', { p: padrao, b: t(base) })} onChange={v => gravarEd(k, paraPontos(v))} />;
  return <div className="ed-adicionais">
    <p className="pc-nota">{t('Os mesmos percentuais e bases da governança: viagens sobre o trabalho de pessoas, overhead sobre esse trabalho e as viagens, e taxa administrativa sobre o custo direto e as viagens.')}</p>
    <div className="ed-campos ed-campos--alinhados">
      {campo('pV', 'Viagens e atividades presenciais', SIM.viagens, 'trabalho de pessoas')}
      {campo('pO', 'Overhead (custos indiretos)', SIM.overhead, 'trabalho e viagens')}
      {campo('pT', 'Taxa administrativa', SIM.taxa, 'custo direto e viagens')}
    </div>
    <div className="ed-rolo"><table className="ed-tabela ed-tabela--num"><thead><tr><th></th><th>{t('Com IA')}</th><th>{t('Sem IA')}</th></tr></thead><tbody>
      {([['Custo direto', 'direto'], ['Viagens e atividades presenciais', 'V'], ['Overhead (custos indiretos)', 'O'], ['Taxa administrativa', 'T'], ['Custo total', 'total']] as const).map(([rot, k]) =>
        <tr key={k} className={k === 'total' ? 'ed-total' : undefined}><th scope="row">{t(rot)}</th><td>{f(r.com[k])}</td><td>{f(r.sem[k])}</td></tr>)}
    </tbody></table></div>
  </div>;
}

// ---------------------------------------------------------------- moldura
export const TITULOS: Record<string, string> = {
  'ed-desafios': 'Quais desafios educacionais você quer enfrentar?', 'ed-adicionais': 'Custos adicionais',
  publico: 'Para quem e onde?', fases: 'Fases do ciclo', categorias: 'Quais categorias de custo entram neste desafio?', resumo: 'Resumo do desafio',
};
function titulo(id: string) {
  const pt = partesTelaEd(id);
  if (pt?.passo === 'opcoes') { const c = CATEGORIAS_ED.find(x => x.id === pt.cat); return c ? `${c.n} ${t(c.nome)}` : id; }
  return t(TITULOS[pt ? pt.passo : id] || id);
}
const VALIDACAO: Record<string, string> = { 'ed-desafios': 'Escolha pelo menos um desafio para continuar.', categorias: 'Escolha pelo menos uma categoria para continuar.', opcoes: 'Marque pelo menos uma opção para continuar.' };

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
  const id = ativa.id, dest = vizinhos(s, id), falta = !telaRespondida(s, ativa), pt = partesTelaEd(id), d = pt?.d;
  const avancar = () => { if (!falta) { ir(dest.proxima); return; } setTentou(true); };
  const semDesafio = d && !desafiosEscolhidos(s).includes(d);
  let corpo: ReactNode = null;
  if (id === 'ed-desafios') corpo = <Desafios s={s} />;
  else if (id === 'ed-adicionais') corpo = <Adicionais s={s} />;
  else if (semDesafio) corpo = <p className="pc-nota">{t('Volte e escolha pelo menos um desafio.')}</p>;
  else if (pt && d) corpo = pt.passo === 'publico' ? <Publico s={s} d={d} /> : pt.passo === 'fases' ? <Fases s={s} d={d} /> : pt.passo === 'categorias' ? <Categorias s={s} d={d} />
    : pt.passo === 'opcoes' && pt.cat ? <Opcoes s={s} d={d} cat={pt.cat} /> : pt.passo === 'resumo' ? <Resumo s={s} d={d} /> : null;
  const ds = desafiosEscolhidos(s), kicker = d ? `${nomeDesafio(d)}${ds.length > 1 && ds.includes(d) ? ' · ' + t('desafio {n} de {total}', { n: ds.indexOf(d) + 1, total: ds.length }) : ''}` : undefined;
  return <Shell pos={{ capitulo: n, tela: id }} contexto={t(infoCapitulo(n, s).titulo)}>
    <div className="pc-pergunta" data-tela={id}>
      <QuestionFrame title={titulo(id)} kicker={kicker} actions={<AcoesPercurso anterior={dest.anterior} avancar={avancar} />}>
        {tentou && falta ? <div className="pc-lit-validacao" role="alert"><b>{t(VALIDACAO[pt ? pt.passo : id] || VALIDACAO['ed-desafios'])}</b></div> : null}
        <div className="pc-lit-campos">{corpo}</div>
      </QuestionFrame>
    </div>
  </Shell>;
}

// ---------------------------------------------------------------- plano
function PlanoEducacao({ s }: { s: CasoStore }) {
  const r = orcamentoEducacao(s), f = fmtR(r), lugar = String(s.ctx.local || '').trim(), pais = s.caso?.pais ? nomePais(paisDoCaso(s.caso)) : '';
  const faltam = telasAtivas(s).filter(q => !telaRespondida(s, q));
  const pct = (a: number, b: number) => b ? Math.round(a / b * 100) + '%' : '—';
  const dif = r.com.total - r.sem.total;
  const kpi = (a: Alternativa) => { const x = a === 'com' ? r.com : r.sem; return <section className={'ed-kpi ed-kpi--' + a}>
    <h3>{rotAlt(a)}</h3>
    <p className="ed-kpi-total">{f(x.total)}</p>
    <dl><div><dt>CapEx</dt><dd>{f(x.k)} <small>{pct(x.k, x.total)}</small></dd></div><div><dt>OpEx</dt><dd>{f(x.x)} <small>{pct(x.x, x.total)}</small></dd></div>
      <div><dt>{t('Utilidades (consumo)')}</dt><dd>{f(x.u)} <small>{pct(x.u, x.total)}</small></dd></div><div><dt>{t('Por estudante')}</dt><dd>{x.porEstudante === null ? '—' : f(x.porEstudante)}</dd></div></dl>
  </section>; };
  const nomeTela = (id: string) => { const pt = partesTelaEd(id); return titulo(id) + (pt ? ' · ' + nomeDesafio(pt.d) : ''); };
  return <div className="ed-plano">
    <h1>{t('Plano de educação com e sem IA')}</h1>
    <p className="pc-lead">{[lugar, pais].filter(Boolean).join(' · ')}</p>
    <AvisoSimulado />
    {faltam.length ? <Alert kind="atencao" title={t('Respostas que faltam')}><ul>{faltam.map(q => <li key={q.id}><a href={href.pergunta(q.capitulo, q.id)}>{nomeTela(q.id)}</a></li>)}</ul></Alert> : null}
    <h2>{t('Com IA e sem IA')}</h2>
    <div className="ed-kpis">{kpi('com')}{kpi('sem')}</div>
    <p>{dif >= 0 ? t('A alternativa com IA custa {v} a mais em {m} meses.', { v: f(dif), m: r.meses }) : t('A alternativa com IA custa {v} a menos em {m} meses.', { v: f(-dif), m: r.meses })} {t('Compare tarefas equivalentes no mesmo horizonte de tempo antes de decidir.')}</p>
    <h2>{t('Custo por desafio')}</h2>
    <div className="ed-rolo"><table className="ed-tabela ed-tabela--num"><thead><tr><th>{t('Desafio')}</th><th>{t('Estudantes')}</th><th>{t('Com IA')}</th><th>{t('Sem IA')}</th></tr></thead><tbody>
      {r.desafios.map(d => <tr key={d}><th scope="row"><a href={href.pergunta(2, 'ed-resumo-' + d)}>{nomeDesafio(d)}</a></th><td>{nfmt(publico(s, d).estudantes)}</td><td>{f(r.com.porDesafio[d] || 0)}</td><td>{f(r.sem.porDesafio[d] || 0)}</td></tr>)}
    </tbody></table></div>
    <h2>{t('Custo por fase')}</h2>
    <div className="ed-rolo"><table className="ed-tabela ed-tabela--num"><thead><tr><th>{t('Fase')}</th><th>{t('Com IA')}</th><th>{t('Sem IA')}</th></tr></thead><tbody>
      {r.fases.map(x => <tr key={x.id}><th scope="row">{t(x.nome)}</th><td>{f(r.com.porFase[x.id] || 0)}</td><td>{f(r.sem.porFase[x.id] || 0)}</td></tr>)}
    </tbody></table></div>
    <h2>{t('Custo por categoria')}</h2>
    <div className="ed-rolo"><table className="ed-tabela ed-tabela--num"><thead><tr><th>{t('Categoria')}</th><th>{t('Com IA')}</th><th>{t('Sem IA')}</th></tr></thead><tbody>
      {CATEGORIAS_ED.map(c => <tr key={c.id}><th scope="row">{c.n} {t(c.nome)}</th><td>{f(r.com.porCategoria[c.id] || 0)}</td><td>{f(r.sem.porCategoria[c.id] || 0)}</td></tr>)}
      <tr><th scope="row">{t('Custos adicionais')}</th><td>{f(r.com.V + r.com.O + r.com.T)}</td><td>{f(r.sem.V + r.sem.O + r.sem.T)}</td></tr>
    </tbody></table></div>
    <h2>{t('Riscos do custo total')}</h2>
    <ul className="ed-lista">
      <li><b>CapEx</b> · {t('obsolescência: dispositivos e servidores precisam de reposição ao fim da vida útil.')}</li>
      <li><b>OpEx</b> · {t('subutilização: licenças, conteúdos e equipes pagos e pouco usados.')}</li>
      <li><b>{t('Utilidades (consumo)')}</b> · {t('volatilidade do orçamento: consumo medido de IA, computação, energia e banda varia com o uso.')}</li>
      <li>{t('Comprar só hardware raramente melhora a aprendizagem; software adaptativo é promissor quando os equipamentos já existem (GEEAP, 2023).')}</li>
    </ul>
    <h2>{t('Roteiro de implementação')}</h2>
    <ol className="ed-roteiro">
      <li><b>{t('Configurar e comparar')}</b> · {t('alternativas com e sem IA; nuvem, servidores próprios ou híbrido; prova de conceito, piloto, implantação e expansão; tarefas equivalentes no mesmo horizonte de tempo.')}</li>
      {r.fases.map(x => <li key={x.id}><b>{t(x.nome)}</b> · {t('{m} meses', { m: x.meses })}{x.id === 'poc' ? ' · ' + t('{n} escolas', { n: r.desafios[0] ? escolasPoc(s, r.desafios[0]) : ESCOLAS_POC }) : ' · ' + t('{p}% do público', { p: x.alcance })}</li>)}
      <li><b>{t('Avaliar e contratar')}</b> · {t('valor educacional e evidências; direitos, segurança e acessibilidade; custo do ciclo de vida; interoperabilidade, soberania e saída.')}</li>
      <li><b>{t('Monitorar e adaptar')}</b> · {t('custo por serviço e uso; aprendizagem, bem-estar e equidade; qualidade, confiabilidade e risco; otimizar o uso, revisar, renovar ou sair.')}</li>
    </ol>
    <p className="pc-nota">{t('Os PDFs desta prioridade entram numa próxima rodada.')}</p>
    <p><Button variant="secondary" href={href.pergunta(3, 'ed-adicionais')}>{t('Voltar')}</Button></p>
  </div>;
}
