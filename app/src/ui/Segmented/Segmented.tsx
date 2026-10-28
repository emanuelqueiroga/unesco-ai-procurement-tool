import './Segmented.css';

export type SegmentedOption<V extends string = string> = { value: V; label: string };

export type SegmentedProps<V extends string = string> = {
  /** Rótulo acessível do grupo (a pergunta). */
  label: string;
  /** Três ou quatro opções, sempre na ordem afirmativo, parcial, negativo, não sei. */
  options: SegmentedOption<V>[];
  value?: V;
  onChange?: (value: V) => void;
  /** Em 400 px o grupo ocupa a largura toda; `fullWidth` força isso em qualquer largura. */
  fullWidth?: boolean;
  disabled?: boolean;
};

/** Controle segmentado para escalas fechadas: botões de 44 px com `aria-pressed`. */
export function Segmented<V extends string = string>({
  label,
  options,
  value,
  onChange,
  fullWidth,
  disabled,
}: SegmentedProps<V>) {
  return (
    <div
      className={['pr-segmented', fullWidth ? 'pr-segmented--full' : ''].filter(Boolean).join(' ')}
      role="group"
      aria-label={label}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="pr-segmented-item"
          aria-pressed={o.value === value}
          disabled={disabled}
          onClick={() => onChange?.(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
