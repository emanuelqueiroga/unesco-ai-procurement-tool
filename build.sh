#!/bin/bash
cd "$(dirname "$0")"
out=navegador.html
NOVOS="ar zh bm zu sw"   # v13 (RQ-18): idiomas novos
L1=$(base64 -w0 assets/iaedu.png); L2=$(base64 -w0 assets/catedra.png)
# ordem dos scripts (plano_dados.js logo depois de fluxo_dados.js; v10: formula.js e recomendacoes.js antes de resumo.js)
# v13: prioridades.js (catálogo do 1.2) depois de framework.js; matriz.js depois de fluxo_dados.js; inicio.js (página inicial e matriz) depois de fluxo.js
JS="src/i18n.js src/custos.js src/framework.js src/prioridades.js src/casos.js src/custos_ui.js src/fluxo_dados.js src/matriz.js src/plano_dados.js src/formula.js src/recomendacoes.js src/fluxo.js src/inicio.js src/resumo.js src/plano_pdf.js src/app.js"
# opcionais enquanto os pacotes R2 e R3 da v10 não chegam: avisam e ficam de fora; os demais são obrigatórios
OPCIONAIS=" src/formula.js src/recomendacoes.js src/inicio.js "
JS_OK=""
for f in $JS; do
  if [ -f "$f" ]; then JS_OK="$JS_OK $f"
  elif [[ "$OPCIONAIS" == *" $f "* ]]; then echo "aviso: $f não encontrado; build sem ele" >&2
  else echo "faltando: $f" >&2; exit 1; fi
done
JS=$JS_OK
{ sed -e "s#%%LOGO_IAEDU%%#data:image/png;base64,$L1#g" -e "s#%%LOGO_CATEDRA%%#data:image/png;base64,$L2#g" src/shell.html | python3 -c "import sys; t=sys.stdin.read(); sys.stdout.write(t.replace('/*%%FLUXO_CSS%%*/', open('src/fluxo.css').read() + ''.join(open(f).read() for f in ['src/inicio.css', 'src/idiomas.css'] if __import__('os').path.exists(f))))"; echo '<script>';
  cat vendor/jspdf.umd.min.js; echo; cat vendor/jspdf.plugin.autotable.min.js; echo; echo '</script><script>';
  echo -n 'const MOEDAS = '; cat data/moedas.json; echo ';';
  # v11: Figura 1 (p. 11) de Krueger e Jackson (2026), sem alteração, como data URI
  echo -n "const FIG_TCO = 'data:image/jpeg;base64,"; base64 -w0 assets/fig1_tco.jpg; echo "';";
  # i18n: <l>.json, depois extra_<l>.json, depois i18n/v9_*_<l>.json, i18n/v10_*_<l>.json e i18n/v11_*_<l>.json em ordem alfabética (as últimas prevalecem)
  # v13 (RQ-18): idiomas novos (ar zh bm zu sw): i18n/<l>.json (dicionário completo, quando existir) e depois
  # i18n/v13_*_<l>.json. Sem i18n/<l>.json o build não falha: o que falta usa o inglês (tr(), i18n.js).
  # I18N_TESTE=<pasta> (só em testes) acrescenta <pasta>/<l>.json logo depois de i18n/<l>.json.
  echo -n 'const I18N = {'; for l in en es fr $NOVOS; do echo -n "\"$l\": "; python3 -c "
import json, sys, os, glob
l = '$l'; d = {}
if l in '$NOVOS'.split():
    arqs = ['i18n/%s.json' % l] + ([os.path.join(os.environ['I18N_TESTE'], l + '.json')] if os.environ.get('I18N_TESTE') else []) + sorted(glob.glob('i18n/v13_*_%s.json' % l)) + sorted(glob.glob('i18n/v14_*_%s.json' % l))
else:
    arqs = ['i18n/%s.json' % l, 'i18n/extra_%s.json' % l] + sorted(glob.glob('i18n/v9_*_%s.json' % l)) + sorted(glob.glob('i18n/v10_*_%s.json' % l)) + sorted(glob.glob('i18n/v11_*_%s.json' % l)) + sorted(glob.glob('i18n/v12_*_%s.json' % l)) + sorted(glob.glob('i18n/v13_*_%s.json' % l)) + sorted(glob.glob('i18n/v14_*_%s.json' % l))
for f in arqs:
    if os.path.exists(f): d.update(json.load(open(f)))
sys.stdout.write(json.dumps(d, ensure_ascii=False))"; echo ','; done; echo '};';
  # v13 (RQ-18): fontes do PDF para ar, zh e bm (subconjuntos TrueType em base64; SEM_FONTES=1 deixa de fora)
  if [ -z "$SEM_FONTES" ]; then python3 tools/subset_fonts.py --relatorio || exit 1; else echo 'const FONTES_PDF = null;'; fi
  # %%FIG_TCO%% num script vira a mesma data URI (FIG_TCO já está definido acima)
  # module.exports (também em várias linhas) só serve aos testes em node: fica de fora da página
  python3 -c "
import re, sys
t = ''.join(open(f).read() + '\\n' for f in sys.argv[1:])
sys.stdout.write(re.sub(r'(?ms)^if \\(typeof module[^\\n]*?module\\.exports\\s*=\\s*\\{.*?\\};?[ \\t]*\\n', '', t))" $JS | sed -e "/\(const\|let\|var\) FIG_TCO *= *['\"]%%FIG_TCO%%/d" -e "s#'%%FIG_TCO%%'#FIG_TCO#g" -e 's#"%%FIG_TCO%%"#FIG_TCO#g' ; echo '</script>'; } > $out
node -e "const p=require('fs').readFileSync('$out','utf8').split('<script>'); new Function(p[p.length-1].split('</script>')[0])" && echo "syntax ok" && wc -c $out
