// Início (D1, M1): a promessa, os quatro capítulos e o plano em branco ao lado. Com um caso salvo, oferece
// continuar de onde parou ou começar em branco.
import { useState } from 'react';
import { useCaso, faltamDe, telasDoCapitulo, temRespostas, ESSENCIAL, type Capitulo } from '../store';
import { Button, Alert } from '../ui';
import { Shell, Rodape } from './Shell';
import { CampoImportar } from './CasoDialog';
import { CAPITULOS_INFO, t } from '../percurso/textos';
import { href, ir } from '../percurso/rota';

export function Inicio() {
  const s = useCaso();
  const [erro, setErro] = useState<string | null>(null);
  const comCaso = temRespostas(s);
  const faltam = faltamDe(s);
  const continuar = faltam[0] ? href.pergunta(faltam[0].capitulo, faltam[0].id) : href.plano();
  return (
    <Shell nav={false}>
      <div className="pc-inicio">
        <p className="pc-kicker">{t('Plano de contratação com custo do ciclo de vida')}</p>
        <h1 className="pc-hero">{t('Seu plano de contratação de IA se escreve enquanto você responde')}</h1>
        <p className="pc-lead">{t('Cerca de {n} perguntas sobre a sua rede, o problema que quer resolver e o teste que pretende fazer. A cada resposta, o plano ao lado ganha um número, uma frase ou uma recomendação.', { n: ESSENCIAL.length })}</p>
        {comCaso ? (
          <Alert kind="info" title={s.exemplo !== 'novo' ? t('Há um exemplo aberto neste navegador.') : s.migradoDe === 'v13' ? t('Encontramos o caso que você preencheu na versão anterior.') : t('Há um caso salvo neste navegador.')}>
            {t('{r} de {n} perguntas essenciais respondidas.', { r: ESSENCIAL.length - faltam.length, n: ESSENCIAL.length })}
            <span className="pc-botoes pc-botoes--alerta">
              <Button size="sm" href={continuar}>{faltam.length ? t('Continuar de onde parei') : t('Abrir o plano')}</Button>
              <Button size="sm" variant="secondary" onClick={() => s.limpar()}>{t('Começar em branco')}</Button>
            </span>
          </Alert>
        ) : null}
        {erro ? <Alert kind="atencao" title={erro} /> : null}
        <div className="pc-botoes">
          {!comCaso ? <Button href={href.abertura(1)}>{t('Começar')}</Button> : null}
          <Button variant="secondary" onClick={() => { s.carregarExemplo('B'); ir(href.plano()); }}>{t('Ver um plano de exemplo')}</Button>
          <CampoImportar onPronto={(e) => { setErro(e); if (!e) ir(href.plano()); }} />
        </div>
        <p className="pc-nota">{t('Leva uns 20 minutos. Dá para parar e voltar: as respostas ficam salvas só neste navegador.')}</p>
        <ol className="pc-capitulos">
          {([1, 2, 3, 4] as Capitulo[]).map((n) => {
            const n2 = telasDoCapitulo(n).length;
            return (
              <li key={n} className="pc-capitulo" style={{ borderTopColor: `var(--phase-${n})` }}>
                <a href={href.abertura(n)} className="pc-capitulo-link">{n} · {t(CAPITULOS_INFO[n].titulo)}</a>
                <span className="pc-capitulo-meta">{n2 === 1 ? t('1 pergunta') : t('{n} perguntas', { n: n2 })} · {t(CAPITULOS_INFO[n].entrega)}</span>
              </li>
            );
          })}
        </ol>
        <Rodape />
      </div>
    </Shell>
  );
}
