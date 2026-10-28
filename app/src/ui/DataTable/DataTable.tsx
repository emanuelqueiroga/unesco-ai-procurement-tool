import type { ReactNode } from 'react';
import './DataTable.css';

export type DataColumn = {
  key: string;
  label: string;
  /** Números à direita com `tabular-nums`. */
  numeric?: boolean;
};

export type DataRow = {
  key: string;
  cells: Record<string, ReactNode>;
  /** Quadrado de 10 px na cor da camada antes do nome (1 a 7). */
  layer?: number;
  /** Linha de total: peso 600 e linha superior de 2 px. */
  total?: boolean;
  /** Linha destacada (`primary-tint`), como a camada aberta no popover "de onde vem?". */
  selected?: boolean;
};

export type DataTableProps = {
  columns: DataColumn[];
  rows: DataRow[];
  /** Legenda da tabela, para leitores de tela (e visível quando `showCaption`). */
  caption?: string;
  showCaption?: boolean;
  className?: string;
};

/** Tabela de leitura; abaixo de 640 px vira cartões empilhados, nunca rolagem horizontal. */
export function DataTable({ columns, rows, caption, showCaption, className }: DataTableProps) {
  const first = columns[0]?.key;
  return (
    <div className={['pr-datatable', className ?? ''].filter(Boolean).join(' ')}>
      <table className="pr-datatable-table">
        {caption ? (
          <caption className={showCaption ? 'pr-datatable-caption' : 'pr-datatable-caption pr-datatable-caption--sr'}>
            {caption}
          </caption>
        ) : null}
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={c.numeric ? 'pr-datatable-num' : undefined}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.key}
              className={[r.total ? 'pr-datatable-total' : '', r.selected ? 'pr-datatable-selected' : '']
                .filter(Boolean)
                .join(' ') || undefined}
            >
              {columns.map((c, i) => {
                const content = (
                  <>
                    {i === 0 && r.layer ? (
                      <span
                        className="pr-datatable-swatch"
                        style={{ background: `var(--layer-${r.layer})` }}
                        aria-hidden="true"
                      />
                    ) : null}
                    {r.cells[c.key]}
                  </>
                );
                const cls = c.numeric ? 'pr-datatable-num' : undefined;
                return c.key === first ? (
                  <th key={c.key} scope="row" className={cls} data-label={c.label}>
                    {content}
                  </th>
                ) : (
                  <td key={c.key} className={cls} data-label={c.label}>
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
