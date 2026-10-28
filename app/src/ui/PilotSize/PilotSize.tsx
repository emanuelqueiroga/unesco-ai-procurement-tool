import { TextField } from '../TextField/TextField';
import './PilotSize.css';
import { tx } from '../texto';

export type PilotMode = 'poc' | 'piloto' | 'ambos';

export type PilotValues = {
  poc?: { participants: string; months: string };
  piloto?: { schools: string; participants: string; months: string };
};

export type PilotField = 'participants' | 'months' | 'schools';

export type PilotHints = {
  poc?: Partial<Record<PilotField, string>>;
  piloto?: Partial<Record<PilotField, string>>;
};

export type PilotSizeProps = {
  /** `poc`: participantes e meses; `piloto`: escolas, participantes e meses; `ambos`: os dois blocos. */
  mode: PilotMode;
  values: PilotValues;
  onChange?: (block: 'poc' | 'piloto', field: PilotField, value: string) => void;
  /** Linhas de origem por campo ("~ sugerido · 5% de 48"). */
  hints?: PilotHints;
  /** Os valores vieram de sugestão e ainda não foram confirmados. */
  suggested?: boolean | { poc?: boolean; piloto?: boolean };
  errors?: PilotHints;
  labels?: Partial<Record<PilotField, string>>;
  blockTitles?: { poc?: string; piloto?: string };
  className?: string;
};

const LABELS: Record<PilotField, string> = { schools: 'Escolas', participants: 'Participantes', months: 'Duração (meses)' };

/** Campos de tamanho e duração do teste conforme o modo (prova de conceito, piloto ou ambos). */
export function PilotSize({
  mode,
  values,
  onChange,
  hints,
  suggested,
  errors,
  labels,
  blockTitles,
  className,
}: PilotSizeProps) {
  const lab = { schools: tx(LABELS.schools), participants: tx(LABELS.participants), months: tx(LABELS.months), ...labels };
  const titulos = { poc: tx('Prova de conceito'), piloto: tx('Piloto'), ...blockTitles };
  const sug = (b: 'poc' | 'piloto') => (typeof suggested === 'boolean' ? suggested : suggested?.[b]) ?? false;

  const block = (b: 'poc' | 'piloto', fields: PilotField[]) => (
    <div className="pr-pilotsize-block" role="group" aria-label={titulos[b]}>
      {mode === 'ambos' ? <div className="pr-pilotsize-title">{titulos[b]}</div> : null}
      <div className="pr-pilotsize-fields" style={{ gridTemplateColumns: `repeat(${fields.length}, minmax(0, 1fr))` }}>
        {fields.map((f) => {
          const v = (values[b] as Record<string, string> | undefined)?.[f] ?? '';
          return (
            <TextField
              key={f}
              id={`pr-pilotsize-${b}-${f}`}
              label={lab[f]}
              type="number"
              value={v}
              onChange={(val) => onChange?.(b, f, val)}
              suggested={sug(b)}
              hint={hints?.[b]?.[f]}
              error={errors?.[b]?.[f]}
            />
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={['pr-pilotsize', className ?? ''].filter(Boolean).join(' ')}>
      {mode === 'poc' || mode === 'ambos' ? block('poc', ['participants', 'months']) : null}
      {mode === 'piloto' || mode === 'ambos' ? block('piloto', ['schools', 'participants', 'months']) : null}
    </div>
  );
}
