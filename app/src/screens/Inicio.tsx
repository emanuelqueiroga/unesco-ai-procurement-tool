// Início (v018): a página da v017, limpa: título, um botão principal que leva direto à primeira pergunta, exemplo,
// importar, "Como funciona" recolhido e o diagrama do modelo de custo. Com um caso salvo, oferece continuar ou
// começar um novo (o que pede confirmação, porque apaga o caso salvo).
import { useState } from 'react';
import { useCaso, faltamDe, temRespostas, ESSENCIAL, type Capitulo } from '../store';
import { Button, Alert } from '../ui';
import { Shell } from './Shell';
import { CampoImportar } from './CasoDialog';
import { abrirMatriz } from './Matriz';
import { abrirExemplo, comecarEmBranco, exportarCaso } from './acoes';
import { destinoContinuar } from './transversal';
import { DiagramaCusto } from './DiagramaCusto';
import { TESTE } from '../percurso/canal';
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
    : s.migradoDe === 'v13' ? t('Encontramos o plano que você preencheu na versão anterior.')
      : s.migradoDe === 'v8' ? t('Encontramos o plano que você preencheu no aplicativo anterior.')
        : t('Há um plano salvo neste navegador.');
  return (
    <Shell nav={false} plano={false}>
      <section className="pc-inicio pc-inicio-simples" aria-labelledby="inicio-titulo">
        <p className="pc-kicker pc-inicio-kicker">{t('Planejamento de IA na educação')} {TESTE ? <span className="pc-inicio-versao" dir="ltr">{TESTE + ' · teste'}</span> : null}</p>
        <h1 id="inicio-titulo" className="pc-hero">{t('Planeje a IA na educação a partir do seu contexto')}</h1>
        <p className="pc-lead">{t('Descreva sua rede, defina prioridades e explore os recursos e custos do seu plano.')}</p>
        {comCaso ? (
          <Alert kind="info" title={titulo}>
            {t('{r} de {n} perguntas essenciais respondidas.', { r: ESSENCIAL.length - faltam.length, n: ESSENCIAL.length })}
          </Alert>
        ) : null}
        {erro ? <Alert kind="atencao" title={erro} /> : null}
        <div className="pc-inicio-principal">
          <Button href={comCaso ? continuar.href : href.pergunta(1, 'local')}>
            {comCaso ? (continuar.pendente ? t('Continuar de onde parei') : t('Abrir o plano')) : t('Começar')}
          </Button>
          {comCaso ? (
            <Button variant="secondary" onClick={async () => {
              if (await comecarEmBranco()) ir(href.pergunta(1, 'local'));
            }}>{t('Começar novo plano')}</Button>
          ) : <p>{t('Primeiro, descreva seu contexto.')}</p>}
        </div>
        <p className="pc-nota">{t('Suas respostas ficam salvas neste navegador. Você pode parar e continuar depois.')}</p>
        <div className="pc-inicio-opcoes">
          <div className="pc-inicio-secundarias">
            <Button variant="link" onClick={() => { void abrirExemplo('B'); }}>{t('Ver um plano de exemplo')}</Button>
            {comCaso ? <Button variant="link" onClick={() => { void exportarCaso(); }}>{t('Exportar o plano')}</Button> : null}
          </div>
          <details className="pc-inicio-detalhe">
            <summary>{t('Importar plano')}</summary>
            <div className="pc-inicio-detalhe-corpo pc-botoes">
              <CampoImportar onPronto={(e) => { setErro(e); if (!e) ir(href.plano()); }} />
            </div>
          </details>
          <details className="pc-inicio-detalhe">
            <summary>{t('Como funciona')}</summary>
            <div className="pc-inicio-detalhe-corpo">
              <ol className="pc-inicio-passos">
                {([1, 2, 3, 4] as Capitulo[]).map((n) => (
                  <li key={n}><b>{t(CAPITULOS_INFO[n].titulo)}</b><p>{t(CAPITULOS_INFO[n].guia)}</p></li>
                ))}
              </ol>
              <p>{t('Os valores são estimativas. Você pode revisar as premissas ao longo do planejamento.')}</p>
              <Button variant="link" onClick={() => abrirMatriz()} aria-haspopup="dialog">{t('Ver a matriz completa')}</Button>
            </div>
          </details>
        </div>
        <DiagramaCusto />
      </section>
    </Shell>
  );
}
