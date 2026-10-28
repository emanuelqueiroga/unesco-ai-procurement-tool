// Faixa das versões de revisão: diz que esta não é a ferramenta publicada e leva à versão estável.
import { CANAL, VERSAO, URL_ESTAVEL } from '../percurso/canal';
import { t } from '../percurso/textos';

export function FaixaRevisao() {
  if (CANAL !== 'revisao') return null;
  return (
    <div className="pc-faixa-revisao" role="note">
      {t('Versão de revisão {v} · redesenho com o design system Prumo · não é a ferramenta publicada.', { v: VERSAO })}{' '}
      <a href={URL_ESTAVEL}>{t('Abrir a versão estável')}</a>
    </div>
  );
}
