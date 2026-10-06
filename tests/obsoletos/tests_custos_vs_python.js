const C=require('/home/claude/app/src/custos.js');
const N=require('/home/claude/guia/new/tools/numeros.json');
const near=(a,b)=>Math.abs(a-b)<=Math.max(1,Math.abs(b)*1e-6);
let ok=true; const chk=(n,a,b)=>{const g=near(a,b); if(!g){ok=false;} console.log((g?'OK ':'XX ')+n,Math.round(a),Math.round(b));};
for(const k of ['A','B','C']){
  const r=C.calcular(C.PRESETS[k]); const s=C.resumo(r);
  chk(k+' tco',s.tco,N[k+'_tco']);
  C.ANOS.forEach(t=>chk(k+' tot'+t,s.tot[t],N[k+'_tot'][t]));
  const cen=C.cenarios(C.PRESETS[k]);
  for(const c of Object.keys(N.CEN[k])){ const rs=C.resumo(cen[c]); chk(k+' '+c+' tco',rs.tco,N.CEN[k][c].tco); chk(k+' '+c+' t2',rs.tot[2],N.CEN[k][c].t2);}
  const sv=C.sensibilidade(C.PRESETS[k]);
  for(const [nome,lo,hi] of N.SENS[k][1]){ const row=sv.rows.find(x=>x.nome.startsWith(nome.split(' (')[0].replace('\\','').slice(0,12))); if(!row){console.log('?? sens',k,nome);ok=false;continue;} chk(k+' sens '+nome,row.hi,hi); }
  const o=C.orcamento(C.PRESETS[k]); const No=N.ORC[k];
  C.ANOS.forEach(t=>chk(k+' dot'+t,o.dot[t],No.dot[t]));
  chk(k+' saidaExt',o.saida,No.saida);
}
chk('A saida',C.resumo(C.calcular(C.PRESETS.A)).saida,N.A_saida);
const cl=C.compLicenca(C.PRESETS.A); chk('aEq',cl.aEq*1000,N.a_eq*1000);
const ca=C.compArquiteturas(C.PRESETS.C); ca.rows.forEach((r,i)=>chk('arq'+i,r.tot,N.ARQ[i][3]));
const rB=C.calcular(C.PRESETS.B); chk('B cint*1e6',rB.extra.cInt*1e6,N.B_cint*1e6);
console.log(ok?'ALL OK':'MISMATCH');
