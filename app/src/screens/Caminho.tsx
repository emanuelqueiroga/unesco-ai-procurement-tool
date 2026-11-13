// v019: coluna "Seu caminho" do design (Figma), à esquerda das telas da governança a partir da escolha dos desafios.
// Mostra a frente numa pílula, um diagrama com a frente e os desafios marcados (o desafio da tela atual em destaque) e,
// para cada desafio marcado, quantas das suas categorias foram escolhidas e, na barra, quantas opções já têm valor.
import type { CasoStore } from '../store';
import { categoriaGov } from '../store';
import { t } from '../percurso/textos';
import { frentesDoPlano, frenteAtual } from '../percurso/frentes';
import { DESAFIOS_GOV_V016 } from '../domain/catalogo_v016.js';
import { petalasDoPlano } from './MandalaProgresso';

/** Cor de cada desafio da governança (a mesma no diagrama e na lista). */
export const COR_DESAFIO: Record<string, string> = { G21: 'var(--v19-d1)', G22: 'var(--v19-d2)', G23: 'var(--v19-d3)' };

/** Desafio da tela atual: o da categoria nas páginas de opções; null nas demais. */
function desafioDaTela(tela?: string): string | null {
  const c = tela ? categoriaGov(tela) : undefined;
  return c ? c.desafio : null;
}

function Diagrama({ marcados, atual }: { marcados: string[]; atual: string | null }) {
  // a frente no alto; os desafios marcados em leque abaixo, ligados à frente
  const W = 180, H = 132, raiz = { x: 90, y: 34 };
  const n = marcados.length;
  const pos = marcados.map((_, i) => {
    if (n === 1) return { x: 90, y: 104 };
    const a = (-60 + (120 * i) / (n - 1)) * Math.PI / 180;
    return { x: 90 + 62 * Math.sin(a), y: 34 + 70 * Math.cos(a) };
  });
  return (
    <svg className="v19-caminho-diagrama" viewBox={`0 0 ${W} ${H}`} role="img" aria-hidden="true" focusable="false">
      {pos.map((p, i) => <line key={'l' + i} x1={raiz.x} y1={raiz.y} x2={p.x} y2={p.y} stroke="var(--primary)" strokeWidth="2" />)}
      <circle cx={raiz.x} cy={raiz.y} r={atual ? 7 : 10} fill="var(--primary)" />
      {!atual ? <circle cx={raiz.x} cy={raiz.y} r={14} fill="none" stroke="var(--primary)" strokeOpacity=".35" strokeWidth="3" /> : null}
      {pos.map((p, i) => {
        const id = marcados[i], foco = id === atual, cor = COR_DESAFIO[id];
        return <g key={id}>
          {foco ? <circle cx={p.x} cy={p.y} r={14} fill="none" stroke="var(--primary)" strokeOpacity=".35" strokeWidth="3" /> : null}
          <circle cx={p.x} cy={p.y} r={foco ? 10 : 7} fill={foco ? 'var(--primary)' : 'var(--surface-1)'} stroke={foco ? 'var(--primary)' : cor} strokeWidth="1.5" />
          {!foco ? <circle cx={p.x} cy={p.y} r={7} fill={cor} fillOpacity=".18" /> : null}
        </g>;
      })}
    </svg>
  );
}

export function CaminhoLateral({ s, tela }: { s: CasoStore; tela?: string }) {
  const frente = frentesDoPlano(s).find((f) => f.id === frenteAtual(s));
  const marcados: string[] = (Array.isArray(s.ctx.problemas) ? s.ctx.problemas : []).filter((x: unknown) => typeof x === 'string' && x in COR_DESAFIO);
  const ordem = DESAFIOS_GOV_V016.map((d: any) => d.id as string).filter((id: string) => marcados.includes(id));
  const { petalas } = petalasDoPlano(s);
  const atual = desafioDaTela(tela);
  const naCategoria = tela === 'gov-categorias' || !!atual;
  return (
    <aside className="v19-caminho" aria-label={t('Seu caminho')}>
      <p className="v19-caminho-rotulo">{t('Seu caminho')}</p>
      {frente ? <p className="v19-caminho-frente"><i aria-hidden="true" /><span><strong>{t('Frente:')}</strong> {t(frente.titulo)}</span></p> : null}
      {ordem.length ? <Diagrama marcados={ordem} atual={atual} /> : null}
      {ordem.length ? <ul className="v19-caminho-lista">
        {DESAFIOS_GOV_V016.filter((d: any) => ordem.includes(d.id)).map((d: any) => {
          const n = DESAFIOS_GOV_V016.findIndex((x: any) => x.id === d.id) + 1;
          const cats = petalas.filter((p) => p.desafio === n), esc = cats.filter((p) => p.escolhida);
          const total = esc.reduce((a, p) => a + p.total, 0), feitas = esc.reduce((a, p) => a + p.feitas, 0);
          const frac = total ? feitas / total : 0;
          return <li key={d.id} className={'v19-caminho-item' + (d.id === atual ? ' is-atual' : '')} aria-current={d.id === atual ? 'step' : undefined}>
            <i className="v19-caminho-ponto" style={{ background: COR_DESAFIO[d.id] }} aria-hidden="true" />
            <span className="v19-caminho-nome">{t(d.t)}</span>
            {naCategoria && cats.length ? <span className="v19-caminho-conta">{t('{n} de {total}', { n: esc.length, total: cats.length })}</span> : null}
            <span className="v19-caminho-barra" aria-hidden="true"><span style={{ inlineSize: (frac * 100).toFixed(1) + '%' }} /></span>
          </li>;
        })}
      </ul> : null}
    </aside>
  );
}
