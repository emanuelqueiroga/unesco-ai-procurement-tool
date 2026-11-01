import type { Estado14 } from '../store';
import { leituraSimples, textoCurto } from './leituraSimples';
import { t } from '../percurso/textos';
import { getLang, setLang } from '../domain/i18n.js';
import { carregarJsPDF, carregarFontesPDF, fontePDF, limparFontePDF, pdfTxt, IDIOMAS_FONTE } from './pdf.js';
export async function gerarLeituraSimplesPDF(s:Estado14,opts:{tipo:'sumario'|'relatorio';lang?:string;fontes?:any;data?:Date}) {
 const anterior=getLang(),lang=opts.lang||anterior||s.lang||'pt',jsPDF=await carregarJsPDF();
 const fontes=opts.fontes!==undefined?opts.fontes:IDIOMAS_FONTE.includes(lang)?await carregarFontesPDF():null;
 if(lang!==anterior)setLang(lang);
 try {
  const p=leituraSimples(s),doc=new jsPDF({unit:'pt',format:'a4',compress:true});fontePDF(doc,fontes,lang);
  const titulo=t(opts.tipo==='sumario'?'Sumário executivo curto':'Relatório curto'),M=50,W=495,LIM=opts.tipo==='relatorio'?744:760;let y=76;
  const font=(n:number,b=false)=>{doc.setFont('helvetica',b?'bold':'normal');doc.setFontSize(n);doc.setTextColor(27,47,55);};
  const nova=()=>{doc.addPage();y=76;cab();};
  const cabe=(altura:number)=>{if(y+altura>LIM)nova();};
  const cab=()=>{font(8);doc.setTextColor(82,103,113);doc.text(pdfTxt(t('Extra · versão para validação')+' · v015'),M,34);doc.setDrawColor(210,220,224);doc.line(M,44,545,44);};
  const texto=(v:string,n=11,b=false,max=38)=>{font(n,b);const ls:string[]=doc.splitTextToSize(pdfTxt(textoCurto(v,max)),W);for(const l of ls){cabe(n*1.4);font(n,b);doc.text(l,M,y);y+=n*1.4;}y+=6;};
  cab();texto(titulo,24,true);texto([p.pais,p.titulo].filter(Boolean).join(' · '),11,false,32);y+=10;
  const secoes=opts.tipo==='sumario'?[{titulo:'',linhas:p.resumo}]:p.secoes;
  for(const sec of secoes){
   if(sec.titulo){cabe(110);y+=10;texto(sec.titulo,14,true);}
   for(const l of sec.linhas){
    if(opts.tipo==='sumario'){cabe(65);texto(l.rotulo,10,true,24);texto(l.valor);continue;}
    font(9,true);const rotulos:string[]=doc.splitTextToSize(pdfTxt(textoCurto(l.rotulo,24)),150);
    font(10);const valores:string[]=doc.splitTextToSize(pdfTxt(textoCurto(l.valor)),327);
    const altura=Math.max(rotulos.length*12,valores.length*13)+12;cabe(altura);
    doc.setDrawColor(230,235,237);doc.line(M,y-10,545,y-10);
    font(9,true);rotulos.forEach((v,i)=>doc.text(v,M,y+i*12));
    font(10);valores.forEach((v,i)=>doc.text(v,M+168,y+i*13));y+=altura;
   }
  }
  if(opts.tipo==='sumario'){cabe(80);y+=12;texto(p.nota,9);texto(t('Textos longos são abreviados aqui; consulte as respostas completas no plano.'),9);}
  const N=doc.getNumberOfPages(),data=(opts.data||new Date()).toISOString().slice(0,10);
  for(let i=1;i<=N;i++){doc.setPage(i);if(opts.tipo==='relatorio'){font(7.5);const notas:string[]=doc.splitTextToSize(pdfTxt(p.nota+' '+t('Textos longos são abreviados aqui; consulte as respostas completas no plano.')),W);notas.forEach((n,j)=>doc.text(n,M,755+j*9));}font(8);doc.setTextColor(82,103,113);doc.line(M,787,545,787);doc.text(pdfTxt(titulo+' · '+data),M,807);doc.text(i+' / '+N,545,807,{align:'right'});}
  return doc;
 }finally{limparFontePDF();if(lang!==anterior)setLang(anterior);}
}
