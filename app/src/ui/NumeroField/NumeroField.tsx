// Campo numérico do Prumo: TextField que formata o número nos separadores do idioma enquanto se digita
// (1.600.000 em pt, 1,600,000 em en), aceita decimais quando pedido e guarda número puro. Percentual: mostra
// 2,5 e guarda 0,025. O idioma vem por `locale` (a aplicação passa o LOC() do domínio).
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { TextField } from '../TextField/TextField';
import { formatarDigitando, paraTexto } from './formatar';

export type NumeroFieldProps = {
  id?: string;
  label: string;
  value: number | '' | null | undefined;
  onChange?: (valor: number | '') => void;
  locale?: string;
  /** aceita casas decimais (FTE 0,05; preço 0,05) */
  decimais?: boolean;
  /** mostra em % e guarda fração (2,5 → 0,025) */
  percentual?: boolean;
  /** aceita negativos */
  negativo?: boolean;
  hint?: ReactNode;
  suggested?: boolean;
  error?: string;
  suffix?: ReactNode;
  size?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function NumeroField({
  id, label, value, onChange, locale, decimais, percentual, negativo, hint, suggested, error, suffix, size = 10, placeholder, disabled, className,
}: NumeroFieldProps) {
  const auto = useId();
  const fieldId = id ?? `pr-num-${auto}`;
  const fator = percentual ? 100 : 1;
  const externo = value === '' || value == null || !isFinite(value as number) ? '' : (value as number) * fator;
  const [texto, setTexto] = useState(() => paraTexto(externo, locale));
  const focado = useRef(false);
  const caret = useRef<number | null>(null);
  // valor de fora (outra tela, importação, troca de idioma): reformata quando o campo não está em edição
  useEffect(() => { if (!focado.current) setTexto(paraTexto(externo, locale)); }, [externo, locale]);
  useLayoutEffect(() => {
    if (caret.current == null) return;
    const el = document.getElementById(fieldId) as HTMLInputElement | null;
    if (el && document.activeElement === el) { try { el.setSelectionRange(caret.current, caret.current); } catch { /* sem cursor */ } }
    caret.current = null;
  });
  return (
    <TextField
      id={fieldId}
      label={label}
      type="number"
      value={texto}
      hint={hint}
      suggested={suggested}
      error={error}
      suffix={suffix ?? (percentual ? '%' : undefined)}
      size={size}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      inputProps={{
        inputMode: decimais || percentual ? 'decimal' : 'numeric',
        onFocus: () => { focado.current = true; },
        onBlur: () => { focado.current = false; setTexto(paraTexto(externo, locale)); },
      }}
      onChange={(v) => {
        const el = document.getElementById(fieldId) as HTMLInputElement | null;
        const pos = el?.selectionStart ?? v.length;
        const r = formatarDigitando(v, pos, locale, !!(decimais || percentual), !!negativo);
        caret.current = r.caret;
        setTexto(r.texto);
        onChange?.(r.valor === '' ? '' : percentual ? r.valor / 100 : r.valor);
      }}
    />
  );
}
