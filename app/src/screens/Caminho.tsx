// v019: coluna "Seu caminho" do design (Figma), à esquerda das telas da governança a partir da escolha dos desafios.
// Árvore radial fixa: a frente no centro; os três desafios em ramos curvos (Soberania à esquerda, Capacidade do setor
// público à direita, Direitos e inovação responsável abaixo), cada um com as suas três categorias nas pontas.
// Estados: vazio (cinza com contorno na cor do desafio); feito (cheio na cor do desafio, com o galho na mesma cor);
// caminho atual (azul, da frente até a tela atual); atual (azul com halo). Uma categoria fica feita quando foi
// escolhida e todas as suas opções marcadas têm valor; um desafio, quando todas as suas categorias escolhidas estão
// feitas. Desafios não marcados ficam esmaecidos. Abaixo, a lista dos desafios com "n de m" e uma barra na cor do desafio.
import type { CasoStore } from '../store';
import { categoriaGov, desafioDaTelaCategorias, categoriaLit, desafioDaTelaCategoriasLit } from '../store';
import { t } from '../percurso/textos';
import { frentesDoPlano, frenteAtual } from '../percurso/frentes';
import { orcamentoGovernanca } from '../percurso/governanca';
import { DESAFIOS_GOV_V016, DESAFIOS_LIT_V023, CATEGORIAS } from '../domain/catalogo_v016.js';
import { orcamentoV16 } from '../percurso/orcamentoV016';
import { percursoEducacaoV20, percursoCombinado, telaDaEducacao, telaDoLetramento, somenteLetramento, temGovernanca } from '../domain';
import { desafioDaTelaEd } from '../store';
import { CATEGORIAS_ED, desafiosEscolhidos, opcoesEscolhidas, nomeDesafio, categoriasEscolhidas as categoriasEdEscolhidas } from '../percurso/educacaoV20';

/** Cor de cada desafio da governança (a mesma na árvore e na lista). */
export const COR_DESAFIO: Record<string, string> = { G21: 'var(--v19-d1)', G22: 'var(--v19-d2)', G23: 'var(--v19-d3)' };

type Estado = 'vazio' | 'feito' | 'caminho' | 'atual';
type P = [number, number];
const CENTRO: P = [170, 183];
/** Posição de cada desafio e de cada categoria, e os galhos (curvas) que os ligam, como no Figma. */
const GEO: Record<string, { no: P; galho: string; folhas: [string, P, string][] }> = {
  G22: { no: [127, 158], galho: 'M170 183C152 183 140 170 127 158', folhas: [
    ['g21', [71, 175], 'M127 158C110 160 88 176 71 175'], ['g22', [89, 137], 'M127 158C112 148 100 140 89 137'], ['g23', [113, 102], 'M127 158C127 135 112 125 113 102']] },
  G23: { no: [213, 158], galho: 'M170 183C188 183 200 170 213 158', folhas: [
    ['g31', [227, 102], 'M213 158C213 135 228 125 227 102'], ['g32', [251, 137], 'M213 158C228 148 240 140 251 137'], ['g33', [269, 175], 'M213 158C230 160 252 176 269 175']] },
  G21: { no: [170, 233], galho: 'M170 183C170 203 166 213 170 233', folhas: [
    ['g11', [128, 273], 'M170 233C160 245 140 250 128 273'], ['g12', [170, 277], 'M170 233C172 250 168 262 170 277'], ['g13', [212, 273], 'M170 233C180 245 200 250 212 273']] },
};
const ORDEM = ['G21', 'G22', 'G23'];
type Cat = { id: string; n: string; nome: string; desafio: string };
const CATS_GOV = (CATEGORIAS as any).governanca as Cat[];
type Geo = { no: P; galho: string; folhas: [string, P, string][] };

/** v022.1: Educando sobre a IA: a mesma árvore, com as folhas calculadas em leque (o desafio 1 tem cinco categorias). */
const r1 = (v: number) => Math.round(v * 10) / 10;
function leque(no: P, galho: string, ang: number, abertura: number, ids: string[], r = 48): Geo {
  const rad = Math.PI / 180, c: P = [r1(no[0] + r * .45 * Math.cos(ang * rad)), r1(no[1] + r * .45 * Math.sin(ang * rad))];
  return { no, galho, folhas: ids.map((id, i) => {
    const a = (ang - abertura / 2 + (ids.length > 1 ? abertura * i / (ids.length - 1) : abertura / 2)) * rad, p: P = [r1(no[0] + r * Math.cos(a)), r1(no[1] + r * Math.sin(a))];
    return [id, p, `M${no[0]} ${no[1]}Q${c[0]} ${c[1]} ${p[0]} ${p[1]}`];
  }) };
}
const CATS_LIT = (CATEGORIAS as any).letramento as Cat[];
const idsLit = (d: string) => CATS_LIT.filter(c => c.desafio === d).map(c => c.id);
const GEO_LIT: Record<string, Geo> = {
  A11: leque(GEO.G21.no, GEO.G21.galho, 90, 150, idsLit('A11'), 50),
  A12: leque(GEO.G22.no, GEO.G22.galho, 210, 95, idsLit('A12')),
  A16: leque(GEO.G23.no, GEO.G23.galho, 330, 95, idsLit('A16')),
};
interface Modelo { frente: 'governanca' | 'letramento'; ordem: string[]; cats: Cat[]; desafios: any[]; geo: Record<string, Geo>; cor: Record<string, string>; dTela: (id: string) => string | null; cTela: (id: string) => Cat | undefined }
const MODELO_GOV: Modelo = { frente: 'governanca', ordem: ORDEM, cats: CATS_GOV, desafios: DESAFIOS_GOV_V016 as any[], geo: GEO, cor: COR_DESAFIO, dTela: desafioDaTelaCategorias, cTela: categoriaGov };
const MODELO_LIT: Modelo = { frente: 'letramento', ordem: ['A11', 'A12', 'A16'], cats: CATS_LIT, desafios: DESAFIOS_LIT_V023 as any[], geo: GEO_LIT,
  cor: { A11: 'var(--v19-d1)', A12: 'var(--v19-d2)', A16: 'var(--v19-d3)' }, dTela: desafioDaTelaCategoriasLit, cTela: categoriaLit };
/** Árvore da governança ou do letramento: a do letramento só quando ele é a prioridade única ou a tela é dele. */
const modeloDe = (s: CasoStore, tela?: string) => somenteLetramento(s.ctx) || (percursoCombinado(s.ctx) && (telaDoLetramento(tela) || !temGovernanca(s.ctx))) ? MODELO_LIT : MODELO_GOV;

/** `fora` (v022.1): categoria que ficou de fora (o desafio já tem categorias escolhidas e esta não está entre elas) */
interface Info { estado: Estado; desafio: string; marcado: boolean; fora?: boolean }
export interface Arvore { modelo?: Modelo; centro: Estado; nos: Record<string, Info>; lista: { id: string; nome: string; cor: string; marcado: boolean; n: number; de: number; atual: boolean }[] }

/** Estado de cada nó da árvore para a tela atual (exportado para os testes). */
export function estadoDaArvore(s: CasoStore, tela?: string, m: Modelo = modeloDe(s, tela)): Arvore {
  const dTela = tela ? m.dTela(tela) : null, cTela = tela ? m.cTela(tela) : undefined;
  const desafioAtual = dTela || cTela?.desafio || null, catAtual = cTela?.id || null;
  const marcados: string[] = (Array.isArray(s.ctx.problemas) ? s.ctx.problemas : []).filter((x: unknown) => typeof x === 'string');
  const itens = new Map<string, any>(((m.frente === 'governanca' ? orcamentoGovernanca(s) : orcamentoV16(s, 'letramento')).itens as any[]).map((i) => [i.id, i]));
  const nos: Record<string, Info> = {};
  const lista: Arvore['lista'] = [];
  for (const d of m.ordem) {
    const marcado = marcados.includes(d), cats = m.cats.filter((c) => c.desafio === d);
    const escolhidas = cats.filter((c) => itens.has(c.id)), feitas = escolhidas.filter((c) => itens.get(c.id).respondido);
    for (const c of cats) {
      const item = itens.get(c.id);
      nos[c.id] = { desafio: d, marcado, estado: c.id === catAtual ? 'atual' : item && item.respondido ? 'feito' : 'vazio', fora: escolhidas.length > 0 && !item };
    }
    const noCaminho = desafioAtual === d;
    nos[d] = { desafio: d, marcado, estado: noCaminho ? (catAtual ? 'caminho' : 'atual') : marcado && escolhidas.length > 0 && feitas.length === escolhidas.length ? 'feito' : 'vazio' };
    const atualNele = !!catAtual && cats.some((c) => c.id === catAtual) && !itens.get(catAtual)?.respondido;
    const de = escolhidas.length || cats.length;
    const nome = String(m.desafios.find((x) => x.id === d)?.t || d);
    lista.push({ id: d, nome: t(nome), cor: m.cor[d], marcado, n: Math.min(de, feitas.length + (atualNele ? 1 : 0)), de, atual: noCaminho });
  }
  return { modelo: m, centro: desafioAtual ? 'caminho' : 'atual', nos, lista };
}

/** v022.1: opacidade do que ficou de fora do caminho (desafio não marcado ou categoria não escolhida). */
const APAGADO = .2;
const corGalho = (e: Estado, cor: string) => e === 'feito' ? cor : e === 'caminho' || e === 'atual' ? 'var(--primary)' : 'var(--v19-galho)';
const ordemGalho = (e: Estado) => e === 'vazio' ? 0 : e === 'feito' ? 1 : 2;

function No({ p, e, cor, id, raio = 8.5 }: { p: P; e: Estado; cor: string; id: string; raio?: number }) {
  return <g className={'v19-no is-' + e} data-id={id} data-estado={e}>
    {e === 'atual' ? <circle cx={p[0]} cy={p[1]} r={raio + 6} fill="var(--primary)" fillOpacity=".45" /> : null}
    <circle cx={p[0]} cy={p[1]} r={e === 'atual' ? raio + 1.5 : raio}
      fill={e === 'vazio' ? 'var(--v19-no-vazio)' : e === 'feito' ? cor : 'var(--primary)'}
      stroke={e === 'vazio' ? cor : 'none'} strokeWidth={1.1} />
  </g>;
}

function ArvoreSVG({ a }: { a: Arvore }) {
  const m = a.modelo || MODELO_GOV;
  // galhos: cinza por baixo, depois os feitos (na cor do desafio) e, por cima, o caminho atual (azul)
  const galhos: { d: string; e: Estado; cor: string; marcado: boolean; k: string; fora?: boolean }[] = [];
  for (const d of m.ordem) {
    const g = m.geo[d], info = a.nos[d], cor = m.cor[d];
    galhos.push({ k: d, d: g.galho, e: info.estado, cor, marcado: info.marcado });
    for (const [id, , path] of g.folhas) galhos.push({ k: id, d: path, e: a.nos[id].estado, cor, marcado: info.marcado, fora: a.nos[id].fora });
  }
  galhos.sort((x, y) => ordemGalho(x.e) - ordemGalho(y.e));
  return (
    <svg className="v19-caminho-diagrama" viewBox="55 88 230 204" role="img" aria-hidden="true" focusable="false">
      {galhos.map((g) => <path key={'g' + g.k} d={g.d} fill="none" stroke={corGalho(g.e, g.cor)} strokeWidth={g.e === 'vazio' ? 3 : 2.4} strokeLinecap="round" opacity={!g.marcado ? APAGADO : g.fora ? APAGADO : 1} />)}
      {m.ordem.map((d) => {
        const g = m.geo[d], cor = m.cor[d], info = a.nos[d];
        return <g key={d} opacity={info.marcado ? 1 : APAGADO}>
          {g.folhas.map(([id, p]) => <g key={id} opacity={info.marcado && a.nos[id].fora ? APAGADO : 1}><No id={id} p={p} e={a.nos[id].estado} cor={cor} /></g>)}
          <No id={d} p={g.no} e={info.estado} cor={cor} />
        </g>;
      })}
      <No id="frente" p={CENTRO} e={a.centro} cor="var(--primary)" raio={9} />
    </svg>
  );
}

/** v020: cores dos oito desafios da educação com e sem IA. */
const CORES_ED = ['#2f7fb8', '#6b2fb3', '#2f8a5c', '#b3177f', '#c26a00', '#5b6b2f', '#1f8a8a', '#a8433a'];
const IDS_ED = ['C31', 'C32', 'C33', 'C34', 'C35', 'C36', 'C37', 'C38'];
const corEd = (d: string) => CORES_ED[Math.max(0, IDS_ED.indexOf(d))];

/** v020: árvore radial da educação: a frente no centro, os desafios escolhidos em volta e as quatro categorias de cada um
 *  nas pontas. Categoria feita = tem opção marcada; desafio feito = a página de custos dele tem opção; caminho e atual em azul. */
function CaminhoEducacao({ s, tela, frente }: { s: CasoStore; tela?: string; frente?: { titulo: string } }) {
  const ds = desafiosEscolhidos(s), atual = tela ? desafioDaTelaEd(tela) : null, n = ds.length;
  const C: P = [120, 112], R1 = n <= 2 ? 44 : 50, R2 = 92;
  const ang = (i: number) => (n === 1 ? 90 : -90 + (360 * i) / n) * Math.PI / 180;
  const pos = (r: number, a: number): P => [C[0] + r * Math.cos(a), C[1] + r * Math.sin(a)];
  const curva = (a: P, b: P) => `M${a[0].toFixed(1)} ${a[1].toFixed(1)}Q${((a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.15).toFixed(1)} ${((a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.15).toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
  const itens = ds.map((d, i) => {
    const a = ang(i), no = pos(R1, a), sel = opcoesEscolhidas(s, d), cats = categoriasEdEscolhidas(s, d);
    const folhas = CATEGORIAS_ED.map((c, k) => { const da = (k - 1.5) * (n > 4 ? 0.22 : 0.3); return { id: d + c.id, p: pos(R2, a + da), feito: sel.some(o => o.startsWith(c.id)), fora: cats.length > 0 && !cats.includes(c.id) }; });
    const eAtual = atual === d, feito = sel.length > 0 && !eAtual;
    return { d, no, folhas, estado: (eAtual ? 'atual' : feito ? 'feito' : 'vazio') as Estado, cor: corEd(d), feitas: folhas.filter(f => f.feito).length };
  });
  const corG = (e: Estado, cor: string) => e === 'feito' ? cor : e === 'atual' ? 'var(--primary)' : 'var(--v19-galho)';
  return (
    <aside className="v19-caminho" aria-label={t('Seu caminho')}>
      <p className="v19-caminho-rotulo">{t('Seu caminho')}</p>
      {frente ? <p className="v19-caminho-frente"><i aria-hidden="true" /><span><strong>{t('Frente:')}</strong> {t(frente.titulo)}</span></p> : null}
      {n ? <svg className="v19-caminho-diagrama" viewBox="0 0 240 224" role="img" aria-hidden="true" focusable="false">
        {itens.map(x => <g key={'g' + x.d}>
          {x.folhas.map(f => <path key={f.id} opacity={f.fora ? APAGADO : 1} d={curva(x.no, f.p)} fill="none" stroke={f.feito ? x.cor : 'var(--v19-galho)'} strokeWidth={f.feito ? 2.2 : 2.6} strokeLinecap="round" />)}
          <path d={curva(C, x.no)} fill="none" stroke={corG(x.estado, x.cor)} strokeWidth={x.estado === 'vazio' ? 2.6 : 2.4} strokeLinecap="round" />
        </g>)}
        {itens.map(x => <g key={x.d}>
          {x.folhas.map(f => <g key={f.id} opacity={f.fora ? APAGADO : 1} className={'v19-no is-' + (f.feito ? 'feito' : 'vazio')} data-id={f.id} data-estado={f.feito ? 'feito' : 'vazio'}><circle cx={f.p[0]} cy={f.p[1]} r={6} fill={f.feito ? x.cor : 'var(--v19-no-vazio)'} stroke={f.feito ? 'none' : x.cor} strokeWidth={1.1} /></g>)}
          <No id={x.d} p={x.no} e={x.estado} cor={x.cor} raio={8} />
        </g>)}
        <No id="frente" p={C} e={atual ? 'caminho' : 'atual'} cor="var(--primary)" raio={9} />
      </svg> : null}
      <ul className="v19-caminho-lista">
        {itens.map(x => <li key={x.d} className={'v19-caminho-item' + (atual === x.d ? ' is-atual' : '')} aria-current={atual === x.d ? 'step' : undefined}>
          <i className="v19-caminho-ponto" style={{ background: x.cor }} aria-hidden="true" />
          <span className="v19-caminho-nome">{nomeDesafio(x.d)}</span>
          <span className="v19-caminho-conta">{t('{n} de {total}', { n: x.feitas, total: 4 })}</span>
          <span className="v19-caminho-barra" aria-hidden="true"><span style={{ inlineSize: (x.feitas / 4 * 100).toFixed(1) + '%', background: x.cor }} /></span>
        </li>)}
      </ul>
    </aside>
  );
}

export function CaminhoLateral({ s, tela }: { s: CasoStore; tela?: string }) {
  if (percursoEducacaoV20(s.ctx)) return <CaminhoEducacao s={s} tela={tela} frente={frentesDoPlano(s).find((f) => f.id === frenteAtual(s))} />;
  // v022.1: no percurso combinado, a árvore da educação nas telas da educação e a da governança nas demais
  if (percursoCombinado(s.ctx) && telaDaEducacao(tela)) return <CaminhoEducacao s={s} tela={tela} frente={frentesDoPlano(s).find((f) => f.id === 'educacao')} />;
  const a = estadoDaArvore(s, tela);
  const frente = frentesDoPlano(s).find((f) => f.id === (a.modelo?.frente === 'letramento' ? 'letramento' : frenteAtual(s)));
  return (
    <aside className="v19-caminho" aria-label={t('Seu caminho')}>
      <p className="v19-caminho-rotulo">{t('Seu caminho')}</p>
      {frente ? <p className="v19-caminho-frente"><i aria-hidden="true" /><span><strong>{t('Frente:')}</strong> {t(frente.titulo)}</span></p> : null}
      <ArvoreSVG a={a} />
      <ul className="v19-caminho-lista">
        {a.lista.map((d) => <li key={d.id} className={'v19-caminho-item' + (d.atual ? ' is-atual' : '') + (d.marcado ? '' : ' is-fora')} aria-current={d.atual ? 'step' : undefined}>
          <i className="v19-caminho-ponto" style={{ background: d.cor }} aria-hidden="true" />
          <span className="v19-caminho-nome">{d.nome}</span>
          <span className="v19-caminho-conta">{d.marcado ? t('{n} de {total}', { n: d.n, total: d.de }) : '—'}</span>
          <span className="v19-caminho-barra" aria-hidden="true"><span style={{ inlineSize: (d.de ? (d.n / d.de) * 100 : 0).toFixed(1) + '%', background: d.cor }} /></span>
        </li>)}
      </ul>
    </aside>
  );
}
