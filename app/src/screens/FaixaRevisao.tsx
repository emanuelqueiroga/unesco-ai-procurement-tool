// Faixa das versões de revisão: diz que esta não é a ferramenta publicada e leva à versão estável.
import { CANAL, VERSAO, URL_ESTAVEL, TESTE } from '../percurso/canal';
import { t } from '../percurso/textos';

export function FaixaRevisao() {
  if (CANAL !== 'revisao' && !TESTE) return null;
  return (
    <details className="pc-faixa-revisao" aria-label={t('Versão de revisão')}>
      <summary>{TESTE ? (/^v0\d+$/.test(TESTE) ? t('Versão de teste {v} — não substitui a v015', { v: TESTE }) : t('Versão de teste do layout — não substitui a v015')) : <>{t('Versão de revisão')} · v015</>}</summary>
      <p>{t('Versão de revisão {v} · redesenho com o design system Prumo · não é a ferramenta publicada.', { v: VERSAO })}{' '}<a href={URL_ESTAVEL}>{t('Abrir a versão estável')}</a></p>
    </details>
  );
}
