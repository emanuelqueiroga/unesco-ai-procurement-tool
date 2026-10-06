#!/bin/bash
cd /home/claude/app
out=navegador.html
L1=$(base64 -w0 assets/iaedu.png); L2=$(base64 -w0 assets/catedra.png)
{ sed -e "s#%%LOGO_IAEDU%%#data:image/png;base64,$L1#g" -e "s#%%LOGO_CATEDRA%%#data:image/png;base64,$L2#g" src/shell.html | python3 -c "import sys; t=sys.stdin.read(); sys.stdout.write(t.replace('/*%%FLUXO_CSS%%*/', open('src/fluxo.css').read()))"; echo '<script>';
  cat vendor/jspdf.umd.min.js; echo; cat vendor/jspdf.plugin.autotable.min.js; echo; echo '</script><script>';
  echo -n 'const MOEDAS = '; cat /home/claude/guia/custos2/moedas.json; echo ';';
  echo -n 'const I18N = {'; for l in en es fr; do f=i18n/$l.json; echo -n "\"$l\": "; python3 -c "import json,sys,os; d=json.load(open('$f')) if os.path.exists('$f') else {}; e='i18n/extra_$l.json'; d.update(json.load(open(e)) if os.path.exists(e) else {}); sys.stdout.write(json.dumps(d,ensure_ascii=False))"; echo ','; done; echo '};';
  cat src/i18n.js src/custos.js src/framework.js src/casos.js src/custos_ui.js src/fluxo_dados.js src/fluxo.js src/resumo.js src/app.js | grep -v "^if (typeof module" ; echo '</script>'; } > $out
node -e "const p=require('fs').readFileSync('$out','utf8').split('<script>'); new Function(p[p.length-1].split('</script>')[0])" && echo "syntax ok" && wc -c $out
