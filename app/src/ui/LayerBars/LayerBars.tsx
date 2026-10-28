import './LayerBars.css';

export type LayerBarItem = {
  /** Nome da camada em linguagem de educação ("Internet e dispositivos"). */
  label: string;
  /** Valor numérico, para o comprimento da barra (proporcional ao maior). */
  value: number;
  /** Valor em texto, à direita ("46%", "R$ 980 mil"). */
  display: string;
  /** Camada 1 a 7: cor `layer-N`. */
  layer: number;
};

export type LayerBarsProps = {
  /** Título em 16 px 600 dizendo o que se mede. */
  title: string;
  items: LayerBarItem[];
  /** A conclusão, no `aria-label` ("Aplicações e internet somam 71% do custo em 3 anos"). */
  conclusion: string;
  /** Legenda com a fonte e "valores ilustrativos". */
  caption?: string;
  /** Ordena por valor decrescente (padrão); `false` mantém a ordem recebida. */
  sort?: boolean;
  className?: string;
};

/** Barras horizontais do custo por camada, rótulo e valor fora da barra, ordem decrescente. */
export function LayerBars({ title, items, conclusion, caption, sort = true, className }: LayerBarsProps) {
  const ordered = sort ? [...items].sort((a, b) => b.value - a.value) : items;
  const max = Math.max(...ordered.map((i) => i.value), 0) || 1;
  return (
    <figure
      className={['pr-layerbars', className ?? ''].filter(Boolean).join(' ')}
      role="img"
      aria-label={conclusion}
    >
      <div className="pr-layerbars-title">{title}</div>
      {ordered.map((it) => (
        <div className="pr-layerbars-row" key={`${it.layer}-${it.label}`}>
          <span className="pr-layerbars-name">{it.label}</span>
          <span className="pr-layerbars-track">
            <span
              className="pr-layerbars-bar"
              style={{ width: `${Math.max(0, (it.value / max) * 100)}%`, background: `var(--layer-${it.layer})` }}
            />
          </span>
          <span className="pr-layerbars-value">{it.display}</span>
        </div>
      ))}
      {caption ? <figcaption className="pr-layerbars-caption">{caption}</figcaption> : null}
    </figure>
  );
}
