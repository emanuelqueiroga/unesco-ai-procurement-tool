import type { MouseEvent } from 'react';
import { TextField } from '../TextField/TextField';
import './SchoolsGrid.css';

export type SchoolStage = {
  id: string;
  /** "Ensino fundamental: anos finais". */
  label: string;
  /** "Do 6º ao 9º ano". */
  sub?: string;
  on: boolean;
  schools?: string;
  students?: string;
  /** Valores sugeridos ainda não confirmados. */
  suggested?: boolean;
  /** Linha de origem dos números ("~ sugerido · 400 por escola"). */
  hint?: string;
  /** Erro no número de escolas ou estudantes. */
  error?: string;
};

export type SchoolsGridProps = {
  /** Rótulo acessível do grupo (a pergunta). */
  label: string;
  stages: SchoolStage[];
  onChange?: (id: string, patch: Partial<Pick<SchoolStage, 'on' | 'schools' | 'students'>>) => void;
  schoolsLabel?: string;
  studentsLabel?: string;
  /** Link "detalhar por ano" (vai para o modo Refinar). */
  detailHref?: string;
  onDetail?: (e: MouseEvent<HTMLElement>) => void;
  detailLabel?: string;
  /** Linha de totais, se quem chama a calcula. */
  totals?: { schools: string; students: string; label?: string };
  className?: string;
};

/** Etapas de ensino com caixa de marcar e, por etapa marcada, escolas e estudantes. */
export function SchoolsGrid({
  label,
  stages,
  onChange,
  schoolsLabel = 'Escolas',
  studentsLabel = 'Estudantes',
  detailHref,
  onDetail,
  detailLabel = 'Detalhar por ano',
  totals,
  className,
}: SchoolsGridProps) {
  return (
    <div className={['pr-schoolsgrid', className ?? ''].filter(Boolean).join(' ')} role="group" aria-label={label}>
      {stages.map((s) => {
        const boxId = `pr-schoolsgrid-${s.id}`;
        return (
          <div
            key={s.id}
            className={['pr-schoolsgrid-row', s.on ? 'pr-schoolsgrid-row--on' : ''].filter(Boolean).join(' ')}
          >
            <label className="pr-schoolsgrid-check" htmlFor={boxId}>
              <input
                id={boxId}
                type="checkbox"
                checked={s.on}
                onChange={(e) => onChange?.(s.id, { on: e.target.checked })}
              />
              <span className="pr-schoolsgrid-text">
                <span className="pr-schoolsgrid-label">{s.label}</span>
                {s.sub ? <span className="pr-schoolsgrid-sub">{s.sub}</span> : null}
              </span>
            </label>
            {s.on ? (
              <div className="pr-schoolsgrid-fields">
                <TextField
                  id={`${boxId}-escolas`}
                  label={schoolsLabel}
                  type="number"
                  value={s.schools ?? ''}
                  onChange={(v) => onChange?.(s.id, { schools: v })}
                  suggested={s.suggested}
                  invalid={Boolean(s.error)}
                  inputProps={{ 'aria-describedby': s.hint || s.error ? `${boxId}-linha` : undefined }}
                />
                <TextField
                  id={`${boxId}-estudantes`}
                  label={studentsLabel}
                  type="number"
                  value={s.students ?? ''}
                  onChange={(v) => onChange?.(s.id, { students: v })}
                  suggested={s.suggested}
                  invalid={Boolean(s.error)}
                  inputProps={{ 'aria-describedby': s.hint || s.error ? `${boxId}-linha` : undefined }}
                />
                {s.error || s.hint ? (
                  <span
                    id={`${boxId}-linha`}
                    className={[
                      'pr-schoolsgrid-hint',
                      s.error ? 'pr-schoolsgrid-hint--error' : s.suggested ? 'pr-schoolsgrid-hint--suggested' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {s.error ?? s.hint}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
      {totals || detailHref || onDetail ? (
        <div className="pr-schoolsgrid-foot">
          {totals ? (
            <span className="pr-schoolsgrid-totals">
              {totals.label ?? 'Total'}: <b>{totals.schools}</b> escolas · <b>{totals.students}</b> estudantes
            </span>
          ) : null}
          {detailHref || onDetail ? (
            <a className="pr-schoolsgrid-detail" href={detailHref ?? '#'} onClick={onDetail}>
              {detailLabel}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
