import { useState } from 'react';
import type { CasoStore } from '../store';
import { Button } from '../ui';
import { t } from '../percurso/textos';
import { leituraSimples, textoCurto, type LinhaSimples } from '../plano/leituraSimples';
import { baixarArquivo } from './acoes';
import './leituraSimples.css';
function Linhas({linhas}:{linhas:LinhaSimples[]}) {return <dl className="pc-leitura-dados">{linhas.map((l,i)=><div key={i}><dt>{l.rotulo}</dt><dd>{textoCurto(l.valor)}</dd></div>)}</dl>;}
export function AtalhoLeituraSimples(){return <Button variant="link" size="sm" onClick={()=>{const alvo=document.getElementById('leitura-titulo');alvo?.scrollIntoView({block:'start'});alvo?.focus({preventScroll:true});}}>{t('Ver versão curta extra')}</Button>;}
/** Apêndice experimental: os relatórios existentes permanecem intactos. */
export function LeituraSimples({s}:{s:CasoStore}) {
 const p=leituraSimples(s),[ocupado,setOcupado]=useState(false),[erro,setErro]=useState('');
 async function baixar(tipo:'sumario'|'relatorio') {
  setOcupado(true);setErro('');try {
   const {gerarLeituraSimplesPDF}=await import('../plano/pdf_simples');
   const doc=await gerarLeituraSimplesPDF(s.estado(),{tipo});
   await baixarArquivo(`${tipo}-curto-${p.frente}-v015.pdf`,doc.output('blob'),'application/pdf');
  }catch {setErro(t('Não foi possível gerar o PDF.'));}finally {setOcupado(false);}
 }
 return <section id="versao-curta" className="pc-leitura" aria-labelledby="leitura-titulo">
  <header><p className="pc-kicker">{t('Extra · versão para validação')}</p><h2 id="leitura-titulo" tabIndex={-1}>{t('Seu plano em linguagem simples')}</h2><p>{t('Uma proposta de leitura curta. Compare com a versão completa acima.')}</p></header>
  <section aria-labelledby="leitura-sumario"><h3 id="leitura-sumario">{t('Sumário executivo curto')}</h3><p className="pc-leitura-pais">{[p.pais,p.titulo].filter(Boolean).join(' · ')}</p><Linhas linhas={p.resumo}/><Button variant="secondary" disabled={ocupado} aria-busy={ocupado||undefined} onClick={()=>void baixar('sumario')}>{t('Baixar sumário curto (PDF)')}</Button></section>
  <details className="pc-leitura-relatorio"><summary>{t('Relatório curto')}</summary><p>{t('O essencial para organizar a execução e revisar as decisões.')}</p>{p.secoes.map((sec,i)=><section key={i}><h4>{sec.titulo}</h4><Linhas linhas={sec.linhas}/></section>)}<Button variant="secondary" disabled={ocupado} aria-busy={ocupado||undefined} onClick={()=>void baixar('relatorio')}>{t('Baixar relatório curto (PDF)')}</Button></details>
  {erro?<p role="alert">{erro}</p>:null}<p className="pc-nota">{p.nota} {t('Textos longos são abreviados aqui; consulte as respostas completas acima.')}</p>
 </section>;
}
