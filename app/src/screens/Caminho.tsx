// v019: coluna "Seu caminho" do design (Figma), à esquerda das telas da governança a partir da escolha dos desafios.
// A árvore cresce com a navegação: a frente na raiz; os desafios marcados abaixo dela; na página de categorias de um
// desafio, esse desafio se abre nas suas categorias (as escolhidas cheias, as demais só com contorno); na página de uma
// categoria, o desafio mostra as categorias escolhidas e a categoria atual se abre em todas as suas opções (cheias
// quando marcadas e com valor). O nó da tela atual fica em azul com halo; o caminho da raiz até ele, em linha cheia. Abaixo, a lista dos
// desafios com quantas categorias foram escolhidas e, na barra, quantas opções já têm valor.
import type { CasoStore } from '../store';
import { categoriaGov, desafioDaTelaCategorias, TELA_ADICIONAIS_GOV } from '../store';
import { t } from '../percurso/textos';
import { frentesDoPlano, frenteAtual } from '../percurso/frentes';
import { orcamentoGovernanca } from '../percurso/governanca';
import { DESAFIOS_GOV_V016 } from '../domain/catalogo_v016.js';
import { petalasDoPlano } from './MandalaProgresso';

/** Cor de cada desafio da governança (a mesma no diagrama e na lista). */
export const COR_DESAFIO: Record<string, string> = { G21: 'var(--v19-d1)', G22: 'var(--v19-d2)', G23: 'var(--v19-d3)' };

interface No { id: string; nivel: number; pai: string | null; rotulo: string; cor: string; cheio: boolean; atual: boolean; noCaminho: boolean }

/** Onde a tela atual está na árvore: a raiz, um desafio (categorias) ou uma categoria (opções). */
export function posicaoNaArvore(tela?: string): { desafio: string | null; categoria: string | null; raiz: boolean } {
  if (!tela) return { desafio: null, categoria: null, raiz: false };
  const d = desafioDaTelaCategorias(tela);
  if (d) return { desafio: d, categoria: null, raiz: false };
  const c = categoriaGov(tela);
  if (c) return { desafio: c.desafio, categoria: c.id, raiz: false };
  return { desafio: null, categoria: null, raiz: tela === 'problemas' || tela === TELA_ADICIONAIS_GOV };
}

/** Os nós da árvore para a tela atual (exportado para os testes). */
export function nosDaArvore(s: CasoStore, tela?: string): No[] {
  const pos = posicaoNaArvore(tela);
  const marcados: string[] = (Array.isArray(s.ctx.problemas) ? s.ctx.problemas : []).filter((x: unknown) => typeof x === 'string' && x in COR_DESAFIO);
  const desafios = DESAFIOS_GOV_V016.filter((d: any) => marcados.includes(d.id));
  const { petalas } = petalasDoPlano(s);
  const nos: No[] = [{ id: 'raiz', nivel: 0, pai: null, rotulo: t('Plano de governança'), cor: 'var(--primary)', cheio: true, atual: pos.raiz, noCaminho: true }];
  for (const d of desafios as any[]) {
    const n = DESAFIOS_GOV_V016.findIndex((x: any) => x.id === d.id) + 1;
    const cats = petalas.filter((p) => p.desafio === n);
    const aberto = pos.desafio === d.id;
    nos.push({ id: d.id, nivel: 1, pai: 'raiz', rotulo: t(d.t), cor: COR_DESAFIO[d.id], cheio: cats.some((p) => p.escolhida), atual: aberto && !pos.categoria, noCaminho: aberto });
    if (!aberto) continue;
    // na página de categorias, todas as categorias do desafio; na de uma categoria, só as escolhidas
    for (const c of cats.filter((p) => !pos.categoria || p.escolhida)) {
      const atual = pos.categoria === c.id;
      nos.push({ id: c.id, nivel: 2, pai: d.id, rotulo: c.n + ' ' + c.nome, cor: COR_DESAFIO[d.id], cheio: c.escolhida, atual, noCaminho: atual });
      if (!atual) continue;
      const item: any = (orcamentoGovernanca(s).itens as any[]).find((i) => i.id === c.id);
      // todas as opções da categoria: marcadas e com valor ficam cheias; as demais, só com contorno
      ((item?.opcoes || []) as string[]).forEach((r, k) => {
        const marcada = (item.marcadas || []).includes(r), l = (item.linhas || []).find((x: any) => x.rotulo === r);
        nos.push({ id: c.id + ':' + k, nivel: 3, pai: c.id, rotulo: t(r), cor: COR_DESAFIO[d.id], cheio: marcada && (!l || (l.status !== 'falta' && l.total !== null)), atual: false, noCaminho: false });
      });
    }
  }
  return nos;
}

const W = 196, Y0 = 22, DY = 58, R = [9, 7, 6, 4];

function Arvore({ nos }: { nos: No[] }) {
  const niveis = Math.max(...nos.map((n) => n.nivel)) + 1;
  const xy: Record<string, { x: number; y: number }> = {};
  for (let v = 0; v < niveis; v++) {
    const linha = nos.filter((n) => n.nivel === v), m = linha.length, margem = v === 3 ? 10 : 22;
    linha.forEach((n, i) => { xy[n.id] = { x: m === 1 ? W / 2 : margem + (i * (W - 2 * margem)) / (m - 1), y: Y0 + v * DY }; });
  }
  const H = Y0 * 2 + (niveis - 1) * DY;
  return (
    <svg className="v19-caminho-diagrama" viewBox={`0 0 ${W} ${H}`} style={{ maxBlockSize: H + 'px' }} role="img" aria-hidden="true" focusable="false" data-niveis={niveis} data-nos={nos.length}>
      {nos.filter((n) => n.pai).map((n) => {
        const a = xy[n.pai!], b = xy[n.id];
        return <line key={'l' + n.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={n.noCaminho ? 'var(--primary)' : 'var(--line-control)'} strokeOpacity={n.noCaminho ? 1 : .6} strokeWidth={n.noCaminho ? 2 : 1.2} strokeDasharray={n.cheio || n.noCaminho ? undefined : '3 3'} />;
      })}
      {nos.map((n) => {
        const p = xy[n.id], r = R[n.nivel] + (n.atual ? 3 : 0);
        return <g key={n.id} className={'v19-no' + (n.atual ? ' is-atual' : '')} data-id={n.id}>
          {n.atual ? <circle cx={p.x} cy={p.y} r={r + 5} fill="none" stroke="var(--primary)" strokeOpacity=".3" strokeWidth="4" /> : null}
          <circle cx={p.x} cy={p.y} r={r} fill={n.atual ? 'var(--primary)' : n.cheio ? n.cor : 'var(--surface-1)'} stroke={n.atual ? 'var(--primary)' : n.cor} strokeWidth="1.5" />
          <title>{n.rotulo}</title>
        </g>;
      })}
    </svg>
  );
}

export function CaminhoLateral({ s, tela }: { s: CasoStore; tela?: string }) {
  const frente = frentesDoPlano(s).find((f) => f.id === frenteAtual(s));
  const nos = nosDaArvore(s, tela);
  const desafios = nos.filter((n) => n.nivel === 1);
  const { petalas } = petalasDoPlano(s);
  const pos = posicaoNaArvore(tela);
  const naCategoria = !!pos.desafio;
  return (
    <aside className="v19-caminho" aria-label={t('Seu caminho')}>
      <p className="v19-caminho-rotulo">{t('Seu caminho')}</p>
      {frente ? <p className="v19-caminho-frente"><i aria-hidden="true" /><span><strong>{t('Frente:')}</strong> {t(frente.titulo)}</span></p> : null}
      {desafios.length ? <Arvore nos={nos} /> : null}
      {desafios.length ? <ul className="v19-caminho-lista">
        {desafios.map((d) => {
          const n = DESAFIOS_GOV_V016.findIndex((x: any) => x.id === d.id) + 1;
          const cats = petalas.filter((p) => p.desafio === n), esc = cats.filter((p) => p.escolhida);
          const total = esc.reduce((a, p) => a + p.total, 0), feitas = esc.reduce((a, p) => a + p.feitas, 0);
          const frac = total ? feitas / total : 0, atual = pos.desafio === d.id;
          return <li key={d.id} className={'v19-caminho-item' + (atual ? ' is-atual' : '')} aria-current={atual ? 'step' : undefined}>
            <i className="v19-caminho-ponto" style={{ background: d.cor }} aria-hidden="true" />
            <span className="v19-caminho-nome">{d.rotulo}</span>
            {naCategoria && cats.length ? <span className="v19-caminho-conta">{t('{n} de {total}', { n: esc.length, total: cats.length })}</span> : null}
            <span className="v19-caminho-barra" aria-hidden="true"><span style={{ inlineSize: (frac * 100).toFixed(1) + '%' }} /></span>
          </li>;
        })}
      </ul> : null}
    </aside>
  );
}
