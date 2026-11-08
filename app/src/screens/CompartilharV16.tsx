// Versão de teste v016: botão "Copiar link do plano" e faixa do plano recebido por link.
import { useEffect, useState } from 'react';
import { Button, Alert } from '../ui';
import { t } from '../percurso/textos';
import { linkDoPlano, LIMITE_LINK, useRecebido, aceitarRecebido, recusarRecebido, lerLinkDoEndereco } from '../compartilhar';

export function BotaoLinkPlano() {
  const [estado, setEstado] = useState<'' | 'copiado' | 'manual' | 'erro'>(''), [link, setLink] = useState('');
  const copiar = async () => {
    try {
      const l = await linkDoPlano(); setLink(l);
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(l); setEstado('copiado'); } else setEstado('manual');
    } catch { setEstado(link ? 'manual' : 'erro'); }
  };
  return <div className="pv-link">
    <Button variant="secondary" onClick={() => void copiar()}>{t('Copiar link do plano')}</Button>
    <p className="pc-nota" role="status" aria-live="polite">{estado === 'copiado' ? t('Link copiado. Quem abrir verá este plano; nada fica guardado em servidor.') : estado === 'erro' ? t('Não foi possível criar o link. Exporte o caso (.json) e envie o arquivo.') : ''}</p>
    {estado === 'manual' && link ? <textarea className="pv-link-campo" readOnly value={link} aria-label={t('Link do plano')} onFocus={e => e.currentTarget.select()} /> : null}
    {link.length > LIMITE_LINK ? <p className="pc-nota">{t('Este link é longo; alguns aplicativos de mensagem podem cortá-lo.')}</p> : null}
  </div>;
}

export function RecebidoHost() {
  const { pendente, erro } = useRecebido();
  useEffect(() => { const f = () => { void lerLinkDoEndereco(); }; window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  if (erro) return <div className="pv-recebido"><Alert kind="atencao" title={t('Não foi possível abrir o plano deste link.')}>{erro === 'navegador' ? t('Atualize o navegador ou peça o arquivo do caso (.json).') : t('O link está incompleto ou foi alterado. Peça o link de novo ou o arquivo do caso (.json).')}</Alert><Button size="sm" variant="secondary" onClick={() => useRecebido.setState({ erro: '' })}>{t('Fechar aviso')}</Button></div>;
  if (!pendente) return null;
  return <div className="pv-recebido" role="region" aria-label={t('Plano recebido por link')}>
    <p><strong>{t('Este link traz um plano compartilhado.')}</strong> {t('Neste navegador já há um plano salvo. Abrir o recebido substitui o seu.')}</p>
    <div className="pc-botoes"><Button size="sm" onClick={aceitarRecebido}>{t('Abrir o plano recebido')}</Button><Button size="sm" variant="secondary" onClick={recusarRecebido}>{t('Ficar com o meu plano')}</Button></div>
  </div>;
}
