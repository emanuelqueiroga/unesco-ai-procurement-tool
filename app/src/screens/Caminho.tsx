// v019: coluna "Seu caminho" do design (Figma), à esquerda das telas da governança a partir da escolha dos desafios.
// Árvore radial fixa: a frente no centro; os três desafios em ramos curvos (Soberania à esquerda, Capacidade do setor
// público à direita, Direitos e inovação responsável abaixo), cada um com as suas três categorias nas pontas.
// Estados: vazio (cinza com contorno na cor do desafio); feito (cheio na cor do desafio, com o galho na mesma cor);
// caminho atual (azul, da frente até a tela atual); atual (azul com halo). Uma categoria fica feita quando foi
// escolhida e todas as suas opções marcadas têm valor; um desafio, quando todas as suas categorias escolhidas estão
// feitas. Desafios não marcados ficam esmaecidos. Abaixo, a lista dos desafios com "n de m" e uma barra na cor do desafio.
import type { CasoStore } from '../store';
import { categoriaGov, desafioDaTelaCategorias } from '../store';
import { t } from '../percurso/textos';
import { frentesDoPlano, frenteAtual } from '../percurso/frentes';
import { orcamentoGovernanca } from '../percurso/governanca';
import { DESAFIOS_GOV_V016, CATEGORIAS } from '../domain/catalogo_v016.js';

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
const CATS_GOV = (CATEGORIAS as any).governanca as { id: string; n: string; nome: string; desafio: string }[];

interface Info { estado: Estado; desafio: string; marcado: boolean }
export interface Arvore { centro: Estado; nos: Record<string, Info>; lista: { id: string; nome: string; cor: string; marcado: boolean; n: number; de: number; atual: boolean }[] }

/** Estado de cada nó da árvore para a tela atual (exportado para os testes). */
export function estadoDaArvore(s: CasoStore, tela?: string): Arvore {
  const dTela = tela ? desafioDaTelaCategorias(tela) : null, cTela = tela ? categoriaGov(tela) : undefined;
  const desafioAtual = dTela || cTela?.desafio || null, catAtual = cTela?.id || null;
  const marcados: string[] = (Array.isArray(s.ctx.problemas) ? s.ctx.problemas : []).filter((x: unknown) => typeof x === 'string');
  const itens = new Map<string, any>((orcamentoGovernanca(s).itens as any[]).map((i) => [i.id, i]));
  const nos: Record<string, Info> = {};
  const lista: Arvore['lista'] = [];
  for (const d of ORDEM) {
    const marcado = marcados.includes(d), cats = CATS_GOV.filter((c) => c.desafio === d);
    const escolhidas = cats.filter((c) => itens.has(c.id)), feitas = escolhidas.filter((c) => itens.get(c.id).respondido);
    for (const c of cats) {
      const item = itens.get(c.id);
      nos[c.id] = { desafio: d, marcado, estado: c.id === catAtual ? 'atual' : item && item.respondido ? 'feito' : 'vazio' };
    }
    const noCaminho = desafioAtual === d;
    nos[d] = { desafio: d, marcado, estado: noCaminho ? (catAtual ? 'caminho' : 'atual') : marcado && escolhidas.length > 0 && feitas.length === escolhidas.length ? 'feito' : 'vazio' };
    const atualNele = !!catAtual && cats.some((c) => c.id === catAtual) && !itens.get(catAtual)?.respondido;
    const de = escolhidas.length || cats.length;
    const nome = String((DESAFIOS_GOV_V016 as any[]).find((x) => x.id === d)?.t || d);
    lista.push({ id: d, nome: t(nome), cor: COR_DESAFIO[d], marcado, n: Math.min(de, feitas.length + (atualNele ? 1 : 0)), de, atual: noCaminho });
  }
  return { centro: desafioAtual ? 'caminho' : 'atual', nos, lista };
}

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
  // galhos: cinza por baixo, depois os feitos (na cor do desafio) e, por cima, o caminho atual (azul)
  const galhos: { d: string; e: Estado; cor: string; marcado: boolean; k: string }[] = [];
  for (const d of ORDEM) {
    const g = GEO[d], info = a.nos[d], cor = COR_DESAFIO[d];
    galhos.push({ k: d, d: g.galho, e: info.estado, cor, marcado: info.marcado });
    for (const [id, , path] of g.folhas) galhos.push({ k: id, d: path, e: a.nos[id].estado, cor, marcado: info.marcado });
  }
  galhos.sort((x, y) => ordemGalho(x.e) - ordemGalho(y.e));
  return (
    <svg className="v19-caminho-diagrama" viewBox="55 88 230 204" role="img" aria-hidden="true" focusable="false">
      {galhos.map((g) => <path key={'g' + g.k} d={g.d} fill="none" stroke={corGalho(g.e, g.cor)} strokeWidth={g.e === 'vazio' ? 3 : 2.4} strokeLinecap="round" opacity={g.marcado ? 1 : .45} />)}
      {ORDEM.map((d) => {
        const g = GEO[d], cor = COR_DESAFIO[d], info = a.nos[d];
        return <g key={d} opacity={info.marcado ? 1 : .45}>
          {g.folhas.map(([id, p]) => <No key={id} id={id} p={p} e={a.nos[id].estado} cor={cor} />)}
          <No id={d} p={g.no} e={info.estado} cor={cor} />
        </g>;
      })}
      <No id="frente" p={CENTRO} e={a.centro} cor="var(--primary)" raio={9} />
    </svg>
  );
}

export function CaminhoLateral({ s, tela }: { s: CasoStore; tela?: string }) {
  const frente = frentesDoPlano(s).find((f) => f.id === frenteAtual(s));
  const a = estadoDaArvore(s, tela);
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
