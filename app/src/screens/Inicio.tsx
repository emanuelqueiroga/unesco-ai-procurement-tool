// v015: página inicial sobre a v014 React/Prumo, com as quatro etapas do percurso.
import { useState } from 'react';
import { useCaso, faltamDe, temRespostas, ESSENCIAL } from '../store';
import { Button, Alert } from '../ui';
import { Shell } from './Shell';
import { CampoImportar } from './CasoDialog';
import { abrirMatriz } from './Matriz';
import { abrirExemplo, comecarEmBranco, exportarCaso } from './acoes';
import { destinoContinuar } from './transversal';
import { CAPITULOS_INFO, t } from '../percurso/textos';
import { href, ir } from '../percurso/rota';
import './inicio.css';

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
    <Shell nav={false} plano={false} inicio>
      <section className="pc-inicio pc-inicio-simples" aria-labelledby="inicio-titulo">
        <p className="pc-kicker pc-inicio-kicker">{t('Planejamento de IA na educação')} <span className="pc-inicio-versao" dir="ltr">v015</span></p>
        <h1 id="inicio-titulo" className="pc-hero">{t('Planeje a IA na educação a partir do seu contexto')}</h1>
        <p className="pc-lead">{t('Descreva sua rede, defina prioridades e explore os recursos e custos do seu plano.')}</p>
        {comCaso ? (
          <Alert kind="info" title={titulo}>
            {t('{r} de {n} perguntas essenciais respondidas.', { r: ESSENCIAL.length - faltam.length, n: ESSENCIAL.length })}
          </Alert>
        ) : null}
        {erro ? <Alert kind="atencao" title={erro} /> : null}
        <div className="pc-inicio-principal">
          <Button href={comCaso ? continuar.href : href.abertura(1)}>
            {comCaso ? (continuar.pendente ? t('Continuar de onde parei') : t('Abrir o plano')) : t('Começar')}
          </Button>
          {comCaso ? (
            <Button variant="secondary" onClick={async () => {
              if (await comecarEmBranco()) ir(href.abertura(1));
            }}>{t('Começar novo plano')}</Button>
          ) : <p>{t('Primeiro, descreva seu contexto.')}</p>}
        </div>
        <p className="pc-nota">{t('Suas respostas ficam salvas neste navegador. Você pode parar e continuar depois.')}</p>
        <div className="pc-inicio-opcoes">
          <div className="pc-inicio-secundarias">
            <Button variant="link" onClick={() => { void abrirExemplo('B'); }}>{t('Ver um plano de exemplo')}</Button>
            {comCaso ? <Button variant="link" onClick={() => { void exportarCaso(); }}>{t('Exportar o caso')}</Button> : null}
          </div>
          <details className="pc-inicio-detalhe">
            <summary>{t('Importar caso')}</summary>
            <div className="pc-inicio-detalhe-corpo pc-botoes">
              <CampoImportar onPronto={(e) => { setErro(e); if (!e) ir(href.plano()); }} />
            </div>
          </details>
          <details className="pc-inicio-detalhe">
            <summary>{t('Como funciona')}</summary>
            <div className="pc-inicio-detalhe-corpo">
              <ol className="pc-inicio-passos">
                {Object.values(CAPITULOS_INFO).map((etapa) => (
                  <li key={etapa.n}><b>{t(etapa.titulo)}</b><p>{t(etapa.guia)}</p></li>
                ))}
              </ol>
              <p>{t('Os valores são estimativas. Você pode revisar as premissas ao longo do planejamento.')}</p>
              <Button variant="link" onClick={() => abrirMatriz()} aria-haspopup="dialog">{t('Ver a matriz completa')}</Button>
            </div>
          </details>
        </div>
      </section>
    </Shell>
  );
}
