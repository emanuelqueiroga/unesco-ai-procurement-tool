#!/bin/bash
cd /home/claude/app
out=navegador.html
L1=$(base64 -w0 assets/iaedu.png); L2=$(base64 -w0 assets/catedra.png)
# ordem dos scripts (plano_dados.js logo depois de fluxo_dados.js; v10: formula.js e recomendacoes.js antes de resumo.js)
JS="src/i18n.js src/custos.js src/framework.js src/casos.js src/custos_ui.js src/fluxo_dados.js src/plano_dados.js src/formula.js src/recomendacoes.js src/fluxo.js src/resumo.js src/app.js"
# opcionais enquanto os pacotes R2 e R3 da v10 não chegam: avisam e ficam de fora; os demais são obrigatórios
OPCIONAIS=" src/formula.js src/recomendacoes.js "
JS_OK=""
for f in $JS; do
  if [ -f "$f" ]; then JS_OK="$JS_OK $f"
  elif [[ "$OPCIONAIS" == *" $f "* ]]; then echo "aviso: $f não encontrado; build sem ele" >&2
  else echo "faltando: $f" >&2; exit 1; fi
done
JS=$JS_OK
{ sed -e "s#%%LOGO_IAEDU%%#data:image/png;base64,$L1#g" -e "s#%%LOGO_CATEDRA%%#data:image/png;base64,$L2#g" src/shell.html | python3 -c "import sys; t=sys.stdin.read(); sys.stdout.write(t.replace('/*%%FLUXO_CSS%%*/', open('src/fluxo.css').read()))"; echo '<script>';
  cat vendor/jspdf.umd.min.js; echo; cat vendor/jspdf.plugin.autotable.min.js; echo; echo '</script><script>';
  echo -n 'const MOEDAS = '; cat /home/claude/guia/custos2/moedas.json; echo ';';
  # i18n: <l>.json, depois extra_<l>.json, depois i18n/v9_*_<l>.json e i18n/v10_*_<l>.json em ordem alfabética (as últimas prevalecem)
  echo -n 'const I18N = {'; for l in en es fr; do echo -n "\"$l\": "; python3 -c "
import json, sys, os, glob
l = '$l'; d = {}
for f in ['i18n/%s.json' % l, 'i18n/extra_%s.json' % l] + sorted(glob.glob('i18n/v9_*_%s.json' % l)) + sorted(glob.glob('i18n/v10_*_%s.json' % l)):
    if os.path.exists(f): d.update(json.load(open(f)))
sys.stdout.write(json.dumps(d, ensure_ascii=False))"; echo ','; done; echo '};';
  cat $JS | grep -v "^if (typeof module" ; echo '</script>'; } > $out
node -e "const p=require('fs').readFileSync('$out','utf8').split('<script>'); new Function(p[p.length-1].split('</script>')[0])" && echo "syntax ok" && wc -c $out
