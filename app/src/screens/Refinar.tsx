// Calculadora do modo Refinar (#/refinar/:aba). Esqueleto: o pacote P2 implementa as três abas.
import type { AbaRefinar } from '../percurso/rota';
import { Shell } from './Shell';
import { t } from '../percurso/textos';

export function Refinar({ aba }: { aba: AbaRefinar; foco?: string }) {
  return (
    <Shell nav={false} plano={false} contexto={t('Refinar')}>
      <h1 className="pc-plano-titulo">{t('Refinar')}</h1>
      <p className="pc-nota">{aba}</p>
    </Shell>
  );
}
