// Início (v019): a página inicial v2 do design (Figma): faixa principal com foto e camada azul e o diagrama do modelo de
// custo em quatro colunas (v020: sem a seção "Como funciona" e a foto provisória dela). O conteúdo é o da
// v018.1: governança ativa, as demais prioridades numa próxima versão, uma duração com custos adicionais (sem fases).
// Com um caso salvo, oferece continuar ou começar um novo (o que pede confirmação, porque apaga o caso salvo).
import { useState } from 'react';
import { useCaso, faltamDe, temRespostas, telasAtivas } from '../store';
import { Button, Alert } from '../ui';
import { Shell } from './Shell';
import { CampoImportar } from './CasoDialog';
import { abrirExemplo, comecarEmBranco, exportarCaso } from './acoes';
import { destinoContinuar } from './transversal';
import { t } from '../percurso/textos';
import { href, ir } from '../percurso/rota';
import './inicio.css';

function Coluna({ n, titulo, sub, itens }: { n: number; titulo: string; sub: string; itens: [string, string?][] }) {
  return <section className="v19-dg-col">
    <header className="v19-dg-cab"><span className="v19-dg-num">{String(n).padStart(2, '0')}</span><h3>{titulo}</h3><p>{sub}</p></header>
    <ul>{itens.map(([a, b]) => <li key={a}><b>{a}</b>{b ? <span>{b}</span> : null}</li>)}</ul>
  </section>;
}

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
  const comecar = comCaso ? continuar.href : href.pergunta(1, 'local');
  const rotuloComecar = comCaso ? (continuar.pendente ? t('Continuar de onde parei') : t('Abrir o plano')) : t('Começar novo plano');
  const futura = t('Disponível em uma próxima versão');
  return (
    <Shell nav={false} plano={false}>
      <section className="v19-hero" aria-labelledby="inicio-titulo">
        <div className="v19-hero-foto" aria-hidden="true" />
        <div className="v19-hero-conteudo pc-container">
          <h1 id="inicio-titulo">{t('Planeje a IA na educação a partir do seu contexto')}</h1>
          <p className="v19-hero-lead">{t('Descreva sua rede, defina prioridades e explore os recursos e custos do seu plano.')}</p>
          {comCaso ? <Alert kind="info" title={titulo}>{t('{r} de {n} perguntas essenciais respondidas.', { r: telasAtivas(s).length - faltam.length, n: telasAtivas(s).length })}</Alert> : null}
          {erro ? <Alert kind="atencao" title={erro} /> : null}
          <div className="v19-hero-acoes">
            <Button href={comecar} className="v19-botao-claro">{rotuloComecar}</Button>
            {comCaso ? <Button variant="secondary" className="v19-botao-contorno" onClick={async () => { if (await comecarEmBranco()) ir(href.pergunta(1, 'local')); }}>{t('Começar novo plano')}</Button> : null}
            <details className="v19-hero-importar">
              <summary>{t('Importar plano')}</summary>
              <div className="pc-botoes"><CampoImportar onPronto={(e) => { setErro(e); if (!e) ir(href.plano()); }} /></div>
            </details>
          </div>
          <p className="v19-hero-nota">{t('Suas respostas ficam salvas neste navegador. Você pode parar e continuar depois.')}</p>
          <p className="v19-hero-sec">
            <Button variant="link" onClick={() => { void abrirExemplo('B'); }}>{t('Ver um plano de exemplo')}</Button>
            {comCaso ? <Button variant="link" onClick={() => { void exportarCaso(); }}>{t('Exportar o plano')}</Button> : null}
          </p>
        </div>
      </section>

      <section className="v19-dg pc-container" aria-labelledby="dg-titulo">
        <h2 id="dg-titulo">{t('Diagrama do modelo de custo')}</h2>
        <div className="v19-dg-grade">
          <Coluna n={1} titulo={t('Prioridades')} sub={t('Escolha uma ou mais')} itens={[[t('Governando a IA na educação')], [t('Educando sobre a IA'), futura], [t('Educando com e sem IA'), futura]]} />
          <Coluna n={2} titulo={t('Desafios e dimensões')} sub={t('Cada desafio traz suas categorias de custo')} itens={[[t('Governança'), t('3 desafios · 9 categorias: direitos, soberania, capacidade do setor público')], [t('Equipes de referência'), t('Papéis, pessoas, dedicação e meses de cada opção')]]} />
          <Coluna n={3} titulo={t('Custos adicionais')} sub={t('Duração do plano e percentuais com fonte pública')} itens={[[t('Viagens e atividades presenciais'), t('25% do trabalho das pessoas')], [t('Overhead (custos indiretos)'), t('15% do trabalho e das viagens')], [t('Taxa administrativa'), t('7% das opções e das viagens')]]} />
          <Coluna n={4} titulo={t('Custo')} sub={t('Por categoria, em investimento, operação e uso')} itens={[[t('Informado'), t('valores que a equipe já tem')], [t('Estimado'), t('estimativas de referência (equipe, formação, nuvem)')], [t('Falta valor'), t('itens ainda sem valor')]]} />
        </div>
        <div className="v19-dg-faixa">
          <p><b>{t('Estimativas de referência')}</b> {t('salários do país por perfil × pessoas × dedicação × meses; preços públicos de nuvem; percentuais com fonte')}</p>
          <p><b>{t('Resultado')}</b> {t('custo por categoria e total, e o que ainda não tem valor')}</p>
          <p><a href={href.metodologia()}>{t('Como o custo é calculado')} <span aria-hidden="true">→</span></a></p>
        </div>
      </section>
    </Shell>
  );
}
