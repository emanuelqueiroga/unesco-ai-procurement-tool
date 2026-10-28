// Início (D1, M1): a promessa, os quatro capítulos (com o que cada um entrega, as camadas que alimenta e a coluna
// da matriz) e o plano em branco ao lado. Com um caso salvo, oferece continuar de onde parou ou começar em branco
// (o que pede confirmação, porque apaga o caso salvo).
import { useState } from 'react';
import { FASES_MATRIZ } from '../domain';
import { useCaso, faltamDe, telasDoCapitulo, temRespostas, ESSENCIAL, type Capitulo } from '../store';
import { Button, Alert } from '../ui';
import { Shell } from './Shell';
import { CampoImportar } from './CasoDialog';
import { abrirMatriz, abrirFigura } from './Matriz';
import { abrirExemplo, comecarEmBranco, exportarCaso } from './acoes';
import { precisaConfirmar, destinoContinuar } from './transversal';
import { CAPITULOS_INFO, t } from '../percurso/textos';
import { href, ir } from '../percurso/rota';

export function Inicio() {
  const s = useCaso();
  const [erro, setErro] = useState<string | null>(null);
  const comCaso = temRespostas(s);
  const faltam = faltamDe(s);
  const continuar = destinoContinuar(s, faltam);
  const titulo = s.exemplo !== 'novo' && s.exemplo !== 'editado'
    ? t('Há um exemplo aberto neste navegador.')
    : s.migradoDe === 'v13' ? t('Encontramos o caso que você preencheu na versão anterior.')
      : s.migradoDe === 'v8' ? t('Encontramos o caso que você preencheu no aplicativo anterior.')
        : t('Há um caso salvo neste navegador.');
  return (
    <Shell nav={false}>
      <div className="pc-inicio">
        <p className="pc-kicker">{t('Plano de contratação com custo do ciclo de vida')}</p>
        <h1 className="pc-hero">{t('Seu plano de contratação de IA se escreve enquanto você responde')}</h1>
        <p className="pc-lead">{t('Cerca de {n} perguntas sobre a sua rede, o problema que quer resolver e o teste que pretende fazer. A cada resposta, o plano ao lado ganha um número, uma frase ou uma recomendação.', { n: ESSENCIAL.length })}</p>
        {comCaso ? (
          <Alert kind="info" title={titulo}>
            {t('{r} de {n} perguntas essenciais respondidas.', { r: ESSENCIAL.length - faltam.length, n: ESSENCIAL.length })}
            {precisaConfirmar(s) ? <> {t('Começar em branco ou abrir um exemplo apaga o caso salvo. Para guardá-lo, exporte o caso.')}</> : null}
            <span className="pc-botoes pc-botoes--alerta">
              <Button size="sm" href={continuar.href}>{continuar.pendente ? t('Continuar de onde parei') : t('Abrir o plano')}</Button>
              <Button size="sm" variant="secondary" onClick={() => { void comecarEmBranco(); }}>{t('Começar em branco')}</Button>
              {precisaConfirmar(s) ? <Button size="sm" variant="link" onClick={() => { void exportarCaso(); }}>{t('Exportar o caso')}</Button> : null}
            </span>
          </Alert>
        ) : null}
        {erro ? <Alert kind="atencao" title={erro} /> : null}
        <div className="pc-botoes">
          {!comCaso ? <Button href={href.abertura(1)}>{t('Começar')}</Button> : null}
          <Button variant="secondary" onClick={() => { void abrirExemplo('B'); }}>{t('Ver um plano de exemplo')}</Button>
          <CampoImportar onPronto={(e) => { setErro(e); if (!e) ir(href.plano()); }} />
        </div>
        <p className="pc-nota">
          {t('Leva uns 20 minutos. Dá para parar e voltar: as respostas ficam salvas só neste navegador.')}{' '}
          <Button variant="link" size="sm" onClick={() => { void abrirExemplo('B', 'percurso'); }}>{t('Percorrer um exemplo, pergunta a pergunta')}</Button>
        </p>
        <ol className="pc-capitulos">
          {([1, 2, 3, 4] as Capitulo[]).map((n) => {
            const n2 = telasDoCapitulo(n).length;
            return (
              <li key={n} className="pc-capitulo" style={{ borderTopColor: `var(--phase-${n})` }}>
                <a href={href.abertura(n)} className="pc-capitulo-link">{n} · {t(CAPITULOS_INFO[n].titulo)}</a>
                <span className="pc-capitulo-meta">{n2 === 1 ? t('1 pergunta') : t('{n} perguntas', { n: n2 })} · {t(CAPITULOS_INFO[n].entrega)}</span>
                <span className="pc-capitulo-meta">{t('Alimenta: {camadas}', { camadas: t(CAPITULOS_INFO[n].alimenta) })}</span>
                <Button variant="link" size="sm" className="pc-capitulo-matriz" onClick={() => abrirMatriz(FASES_MATRIZ[n - 1])} aria-haspopup="dialog">
                  {t('Ver na matriz')}
                </Button>
              </li>
            );
          })}
        </ol>
        <div className="pc-botoes">
          <Button variant="secondary" size="sm" onClick={() => abrirMatriz()} aria-haspopup="dialog">{t('Ver a matriz completa')}</Button>
          <Button variant="secondary" size="sm" onClick={abrirFigura} aria-haspopup="dialog">{t('Ampliar a figura das sete camadas')}</Button>
        </div>
      </div>
    </Shell>
  );
}
