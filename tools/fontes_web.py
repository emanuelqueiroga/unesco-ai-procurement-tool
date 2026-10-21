#!/usr/bin/env python3
"""v15 (proposta B3): fontes web embutidas na página, para as três aparências (sem Google Fonts; funciona offline).

Uso no build (build.sh):  python3 tools/fontes_web.py            → imprime as regras @font-face (WOFF2 em base64)
Regerar os subconjuntos:  python3 tools/fontes_web.py --gerar DIR → lê os TTF/OTF de DIR e grava assets/fontes/b3/*.woff2

Famílias e pesos (referencias-design.md, "Kits propostos"):
  Noto Sans 400/600/700 (kits 1 e 3), Noto Serif 600 (títulos do kit 3), Inter 400/500/600 (kit 2).
Subconjunto: latim básico e Latin-1, Latin Extended-A, as letras do bambara (ɛ ɔ ɲ ŋ Ɛ Ɔ Ɲ Ŋ) com os acentos
combinantes, pontuação geral, setas, sinais de moeda e os símbolos da interface (✓ ✕ ▴ −). Árabe e chinês usam as
fontes do sistema (pilhas em src/aparencia.css). Licença: SIL Open Font License 1.1 (assets/fontes/OFL.txt).
"""
import base64, os, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASTA = os.path.join(RAIZ, 'assets', 'fontes', 'b3')
# (arquivo de saída, família CSS, peso, arquivo de origem)
FONTES = [
    ('noto-sans-400.woff2', 'UPT Noto Sans', 400, 'NotoSans-Regular.ttf'),
    ('noto-sans-600.woff2', 'UPT Noto Sans', 600, 'NotoSans-SemiBold.ttf'),
    ('noto-sans-700.woff2', 'UPT Noto Sans', 700, 'NotoSans-Bold.ttf'),
    ('noto-serif-600.woff2', 'UPT Noto Serif', 600, 'NotoSerif-SemiBold.ttf'),
    ('inter-400.woff2', 'UPT Inter', 400, 'Inter-Regular.otf'),
    ('inter-500.woff2', 'UPT Inter', 500, 'Inter-Medium.otf'),
    ('inter-600.woff2', 'UPT Inter', 600, 'Inter-SemiBold.otf'),
]
UNICODES = ','.join([
    'U+0000-00FF', 'U+0100-017F', 'U+0186', 'U+0190', 'U+019D', 'U+0254', 'U+025B', 'U+0272', 'U+014A-014B',
    'U+0300-0301', 'U+0302', 'U+0303', 'U+0308', 'U+030C', 'U+02BB-02BC', 'U+02C6', 'U+02DA', 'U+02DC',
    'U+2000-206F', 'U+20A0-20C0', 'U+2122', 'U+2190-2193', 'U+2212', 'U+2215', 'U+2248', 'U+2264-2265',
    'U+2713', 'U+2715', 'U+25B4', 'U+25BE', 'U+24D8',
])
FEATURES = 'kern,liga,calt,ccmp,locl,mark,mkmk,tnum,lnum,pnum,case'


def gerar(origem):
    from fontTools import subset
    os.makedirs(PASTA, exist_ok=True)
    for saida, _fam, _peso, arq in FONTES:
        src = os.path.join(origem, arq)
        if not os.path.exists(src):
            sys.exit(f'faltando: {src}')
        dst = os.path.join(PASTA, saida)
        subset.main([src, f'--unicodes={UNICODES}', f'--layout-features={FEATURES}', '--flavor=woff2',
                     '--no-hinting', '--desubroutinize', '--name-IDs=0,1,2,3,4,5,6', f'--output-file={dst}'])
        print(f'{saida}: {os.path.getsize(dst)} bytes', file=sys.stderr)


def css():
    regras = []
    for saida, fam, peso, _arq in FONTES:
        p = os.path.join(PASTA, saida)
        if not os.path.exists(p):
            sys.exit(f'faltando: {p} (rode tools/fontes_web.py --gerar <pasta com os TTF/OTF>)')
        b64 = base64.b64encode(open(p, 'rb').read()).decode('ascii')
        regras.append(f'@font-face{{font-family:"{fam}";font-style:normal;font-weight:{peso};font-display:swap;'
                      f'src:url(data:font/woff2;base64,{b64}) format("woff2");unicode-range:{UNICODES};}}')
    sys.stdout.write('\n'.join(regras) + '\n')


if __name__ == '__main__':
    if len(sys.argv) > 2 and sys.argv[1] == '--gerar':
        gerar(sys.argv[2])
    else:
        css()
