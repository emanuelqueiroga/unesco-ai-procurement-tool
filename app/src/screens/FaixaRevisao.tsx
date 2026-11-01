// Faixa das versões de revisão: diz que esta não é a ferramenta publicada e leva à versão estável.
import { CANAL, VERSAO, URL_ESTAVEL } from '../percurso/canal';
import { t } from '../percurso/textos';

export function FaixaRevisao() {
  if (CANAL !== 'revisao') return null;
  return (
    <details className="pc-faixa-revisao" aria-label={t('Versão de revisão')}>
      <summary>{t('Versão de revisão')} · v015</summary>
      <p>{t('Versão de revisão {v} · redesenho com o design system Prumo · não é a ferramenta publicada.', { v: VERSAO })}{' '}<a href={URL_ESTAVEL}>{t('Abrir a versão estável')}</a></p>
    </details>
  );
}
