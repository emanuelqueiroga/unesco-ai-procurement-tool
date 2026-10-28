import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import './TextField.css';

export type TextFieldProps = {
  id?: string;
  label: string;
  value: string;
  onChange?: (value: string) => void;
  /** `number` usa inputMode numérico; a validação é de quem chama. */
  type?: 'text' | 'number';
  /** Texto longo: `textarea` de 3 linhas mínimas, mesma anatomia. */
  multiline?: boolean;
  placeholder?: string;
  /** Linha de origem: "informado", "padrão: em branco", "~ sugerido · 5% de 48 escolas". */
  hint?: ReactNode;
  /** Valor sugerido ainda não confirmado: fundo `accent-tint`, borda `accent`, linha em `accent-ink`. */
  suggested?: boolean;
  /** Mensagem de erro dizendo o que fazer; substitui a linha de origem. */
  error?: string;
  /** Só o estado de erro (borda `crit`), quando a mensagem fica fora do campo. */
  invalid?: boolean;
  disabled?: boolean;
  /** Texto curto depois do campo, como "de 48". */
  suffix?: ReactNode;
  /** Largura em caracteres, para campos de número dentro de linhas. */
  size?: number;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'id' | 'type' | 'size'>;
  className?: string;
};

/** Campo de texto ou número com rótulo acima e linha de origem abaixo. */
export function TextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  multiline,
  placeholder,
  hint,
  suggested,
  error,
  invalid,
  disabled,
  suffix,
  size,
  inputProps,
  className,
}: TextFieldProps) {
  const auto = useId();
  const fieldId = id ?? `pr-field-${auto}`;
  const hintId = `${fieldId}-hint`;
  const cls = [
    'pr-textfield',
    suggested && !error && !invalid ? 'pr-textfield--suggested' : '',
    error || invalid ? 'pr-textfield--error' : '',
    disabled ? 'pr-textfield--disabled' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  const line = error ?? hint;
  const common = {
    id: fieldId,
    value,
    placeholder,
    disabled,
    'aria-invalid': error || invalid ? true : undefined,
    'aria-describedby': line ? hintId : inputProps?.['aria-describedby'],
    onChange: (e: { target: { value: string } }) => onChange?.(e.target.value),
  };
  return (
    <div className={cls}>
      <label className="pr-textfield-label" htmlFor={fieldId}>
        {label}
      </label>
      <div className="pr-textfield-row">
        {multiline ? (
          <textarea className="pr-textfield-input pr-textfield-input--area" rows={3} {...common} />
        ) : (
          <input
            className="pr-textfield-input"
            type={type === 'number' ? 'text' : type}
            inputMode={type === 'number' ? 'decimal' : undefined}
            size={size}
            {...inputProps}
            {...common}
          />
        )}
        {suffix ? <span className="pr-textfield-suffix">{suffix}</span> : null}
      </div>
      {line ? (
        <span
          id={hintId}
          className={[
            'pr-textfield-hint',
            error ? 'pr-textfield-hint--error' : suggested ? 'pr-textfield-hint--suggested' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {line}
        </span>
      ) : null}
    </div>
  );
}
