// Campo numérico da aplicação: o NumeroField do Prumo no idioma corrente (LOC() do domínio).
import { LOC } from '../domain';
import { NumeroField, type NumeroFieldProps } from '../ui';

export function CampoNumero(props: Omit<NumeroFieldProps, 'locale'>) {
  return <NumeroField {...props} locale={String(LOC())} />;
}
