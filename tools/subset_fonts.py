#!/usr/bin/env python3
"""Subconjuntos das fontes do PDF (jsPDF) para os idiomas fora do WinAnsi (v13, RQ-18).

Uso (pelo build.sh):  python3 tools/subset_fonts.py [--dic-extra DIR] > fontes_pdf.js
Escreve na saída padrão uma linha JavaScript:
    const FONTES_PDF = { ar: {...}, zh: {...}, latin: {...} };
Cada família traz:
    nome    nome da família registrada no jsPDF (addFont);
    regular / bold   arquivo TrueType (contornos glyf) comprimido com deflate (raw) e em base64;
    cobre   os caracteres que a fonte cobre (o resto passa pela troca de pdfTxt);
    idiomas os idiomas que usam a família.

Famílias:
  ar     Noto Sans (latim) + Noto Sans Arabic, fundidas numa só fonte (o jsPDF usa uma fonte por trecho);
         inclui as formas de apresentação árabes (FB50–FBFF, FE70–FEFF), que o processArabic do jsPDF usa.
  zh     Noto Sans CJK SC (face SC da coleção .ttc), CFF convertido para TrueType (cu2qu). Só o peso
         regular: o negrito é simulado no PDF (preenchimento + contorno), para manter o tamanho baixo.
  latin  Noto Sans regular e bold, para o bambara (ɛ ɔ ɲ ŋ e maiúsculas Ɛ Ɔ Ɲ Ŋ).

Caracteres de cada subconjunto: os dos dicionários do idioma (i18n/<l>.json, i18n/v13_*_<l>.json, i18n/v14_*_<l>.json e, com
--dic-extra, DIR/<l>.json), os do inglês (fallback), ASCII, Latin-1, pontuação geral e os símbolos que o PDF
desenha. Se nenhum dicionário do idioma existir, usa um texto de exemplo (AMOSTRA).

Cache: o resultado é guardado em ~/.cache/navegador-fontes/<hash>.js (hash dos caracteres, das fontes e
deste script), para que o build não refaça a conversão CJK (alguns segundos) a cada execução.
"""
import argparse, base64, glob, hashlib, io, json, os, sys, zlib

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NOTO = '/usr/share/fonts/truetype/noto/'
CJK = '/usr/share/fonts/opentype/noto/'
FONTES = {
    'ar': {'nome': 'NotoAr', 'idiomas': ['ar'],
           'regular': [NOTO + 'NotoSans-Regular.ttf', NOTO + 'NotoSansArabic-Regular.ttf'],
           'bold': [NOTO + 'NotoSans-Bold.ttf', NOTO + 'NotoSansArabic-Bold.ttf']},
    'zh': {'nome': 'NotoSC', 'idiomas': ['zh'],
           'regular': [(CJK + 'NotoSansCJK-Regular.ttc', 'Noto Sans CJK SC')]},
    'latin': {'nome': 'NotoLatin', 'idiomas': ['bm'],
              'regular': [NOTO + 'NotoSans-Regular.ttf'], 'bold': [NOTO + 'NotoSans-Bold.ttf']},
}
# Sempre incluídos: magnitudes e unidades de i18n.js (MAGNITUDES, UNID_MIL), letras próprias e pontuação do idioma;
# sem dicionário do idioma, também um texto de exemplo.
SEMPRE = {
    'ar': 'آلاف ، ؛ ؟ ٪ يناير فبراير مارس أبريل مايو يونيو يوليو أغسطس سبتمبر أكتوبر نوفمبر ديسمبر',   # e os meses (datas do Intl)
    'zh': '千百万十亿，。：；？！（）、“”《》·…—年月日星期一二三四五六七八九',   # e as datas do Intl (2026年10月16日)
    'latin': 'ɛɔɲŋƐƆƝŊ\u0300\u0301\u030c',
}
AMOSTRA = {
    'ar': 'خطة الشراء التكلفة الإجمالية لدورة الحياة السنة إثبات المفهوم مشروع تجريبي النشر التوسّع الطبقة التوصيات قيم توضيحية',
    'zh': '采购计划生命周期总成本第年概念验证试点部署扩展层建议示意性数值',
    'latin': 'Sanni labɛn',
}
# símbolos desenhados pelo PDF (plano_pdf.js) e pontuação comum
EXTRA = '·…—–‘’“”•€‚„†‡‰‹›−≈≥≤→←✓✕ⓘ☐   ‑‐'


def chars_de(obj, out):
    if isinstance(obj, str): out.update(obj)
    elif isinstance(obj, dict):
        for v in obj.values(): chars_de(v, out)
    elif isinstance(obj, list):
        for v in obj: chars_de(v, out)


def texto_idioma(langs, extra_dir):
    s, achou = set(), False
    for l in langs:
        # v13_*: dicionários da v13; v14_*: textos novos da reimplementação (app/), cobertos também no PDF
        arqs = [os.path.join(RAIZ, 'i18n', l + '.json')] + sorted(glob.glob(os.path.join(RAIZ, 'i18n', 'v13_*_%s.json' % l))) \
            + sorted(glob.glob(os.path.join(RAIZ, 'i18n', 'v14_*_%s.json' % l)))
        if extra_dir: arqs.append(os.path.join(extra_dir, l + '.json'))
        for f in arqs:
            if os.path.exists(f):
                chars_de(json.load(open(f, encoding='utf-8')), s)
                if not os.path.basename(f).startswith('v13_idiomas_'): achou = True
    return s, achou


def texto_base():
    s = set(chr(c) for c in range(0x20, 0x7F)) | set(chr(c) for c in range(0xA0, 0x100)) | set(EXTRA)
    # inglês: fallback dos idiomas novos
    for f in [os.path.join(RAIZ, 'i18n', 'en.json'), os.path.join(RAIZ, 'i18n', 'extra_en.json')] + sorted(glob.glob(os.path.join(RAIZ, 'i18n', 'v*_*_en.json'))):
        if os.path.exists(f): chars_de(json.load(open(f, encoding='utf-8')), s)
    return s


def abrir(fonte):
    from fontTools.ttLib import TTFont
    if isinstance(fonte, tuple):
        caminho, nome = fonte
        from fontTools.ttLib import TTCollection
        for i, f in enumerate(TTCollection(caminho).fonts):
            if f['name'].getDebugName(4) == nome:
                return TTFont(caminho, fontNumber=i)
        raise SystemExit('face não encontrada: %s em %s' % (nome, caminho))
    return TTFont(fonte)


def otf2ttf(font, max_err=1.0):
    """CFF → TrueType (contornos quadráticos em glyf), como o Snippets/otf2ttf.py do fontTools."""
    from fontTools.ttLib import newTable
    from fontTools.pens.cu2quPen import Cu2QuPen
    from fontTools.pens.ttGlyphPen import TTGlyphPen
    ordem = font.getGlyphOrder()
    font['loca'] = newTable('loca')
    font['glyf'] = glyf = newTable('glyf')
    glyf.glyphOrder = ordem; glyf.glyphs = {}
    gs = font.getGlyphSet()
    for nome in ordem:
        pen = TTGlyphPen(gs)
        gs[nome].draw(Cu2QuPen(pen, max_err, reverse_direction=True))
        glyf[nome] = pen.glyph()
    font['maxp'] = maxp = newTable('maxp')
    maxp.tableVersion = 0x00010000
    for k in ('maxZones',): setattr(maxp, k, 1)
    for k in ('maxTwilightPoints', 'maxStorage', 'maxFunctionDefs', 'maxInstructionDefs', 'maxStackElements', 'maxSizeOfInstructions', 'maxComponentElements'):
        setattr(maxp, k, 0)
    del font['CFF ']
    for t in ('VORG',):
        if t in font: del font[t]
    post = font['post']; post.formatType = 2.0; post.extraNames = []; post.mapping = {}; post.glyphOrder = ordem
    font.sfntVersion = '\x00\x01\x00\x00'
    return font


def subconjunto(font, texto, unicodes=()):
    from fontTools import subset
    o = subset.Options()
    o.layout_features = []          # o jsPDF não usa GSUB/GPOS (o árabe vem em formas de apresentação)
    o.name_IDs = ['*']; o.name_languages = ['*']
    o.notdef_outline = True; o.hinting = False; o.desubroutinize = True
    o.drop_tables += ['GSUB', 'GPOS', 'GDEF', 'BASE', 'VORG', 'vhea', 'vmtx', 'MATH', 'JSTF', 'DSIG', 'meta', 'STAT', 'MVAR', 'HVAR', 'fvar', 'gvar', 'avar']
    s = subset.Subsetter(o)
    s.populate(text=texto, unicodes=list(unicodes))
    s.subset(font)
    return font


def montar(fam, peso, texto):
    from fontTools.ttLib import TTFont
    fontes = FONTES[fam][peso]
    partes = []
    for f in fontes:
        ft = abrir(f)
        cm = ft.getBestCmap()
        uni = []
        if fam == 'ar' and 'Arabic' in str(f):
            uni = [c for c in cm if 0xFB50 <= c <= 0xFBFF or 0xFE70 <= c <= 0xFEFF]
        subconjunto(ft, ''.join(ch for ch in texto if ord(ch) in cm), uni)
        if 'CFF ' in ft: otf2ttf(ft)
        partes.append(ft)
    if len(partes) == 1:
        font = partes[0]
    else:
        # fusão: o primeiro arquivo (latim) prevalece nos caracteres comuns (algarismos, pontuação)
        from fontTools.merge import Merger
        tmp = []
        for i, p in enumerate(partes):
            b = io.BytesIO(); p.save(b); b.seek(0); tmp.append(b)
        font = Merger().merge(tmp)
    nome = FONTES[fam]['nome']
    # nomes internos (o jsPDF lê o PostScript name)
    for rec in font['name'].names:
        if rec.nameID in (1, 16): rec.string = nome
        elif rec.nameID in (2, 17): rec.string = 'Bold' if peso == 'bold' else 'Regular'
        elif rec.nameID == 4: rec.string = nome + (' Bold' if peso == 'bold' else ' Regular')
        elif rec.nameID == 6: rec.string = nome + ('-Bold' if peso == 'bold' else '-Regular')
    b = io.BytesIO(); font.save(b)
    dados = b.getvalue()
    cobre = ''.join(sorted(chr(c) for c in font.getBestCmap()))
    return dados, cobre


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dic-extra', default=os.environ.get('I18N_TESTE') or '')
    ap.add_argument('--sem-cache', action='store_true')
    ap.add_argument('--relatorio', action='store_true', help='tamanhos na saída de erro')
    a = ap.parse_args()
    base = texto_base()
    textos = {}
    for fam, cfg in FONTES.items():
        s, achou = texto_idioma(cfg['idiomas'], a.dic_extra)
        s |= set(SEMPRE[fam])
        if not achou: s |= set(AMOSTRA[fam])
        s = base | s
        s |= set(''.join(ch.upper() + ch.lower() for ch in s))   # o PDF põe rótulos em maiúsculas (toUpperCase)
        textos[fam] = ''.join(sorted(s))
    h = hashlib.sha256()
    h.update(open(os.path.abspath(__file__), 'rb').read())
    for fam in sorted(textos):
        h.update(fam.encode()); h.update(textos[fam].encode('utf-8'))
        for peso in ('regular', 'bold'):
            for f in FONTES[fam].get(peso, []):
                p = f[0] if isinstance(f, tuple) else f
                h.update(('%s:%d' % (p, os.path.getsize(p))).encode())
    cache_dir = os.path.expanduser('~/.cache/navegador-fontes')
    cache = os.path.join(cache_dir, h.hexdigest()[:24] + '.js')
    if not a.sem_cache and os.path.exists(cache):
        sys.stdout.write(open(cache, encoding='utf-8').read())
        if a.relatorio: print('fontes do PDF: cache ' + cache, file=sys.stderr)
        return
    out = {}
    for fam, cfg in FONTES.items():
        o = {'nome': cfg['nome'], 'idiomas': cfg['idiomas']}
        for peso in ('regular', 'bold'):
            if peso not in cfg: continue
            dados, cobre = montar(fam, peso, textos[fam])
            z = zlib.compressobj(9, zlib.DEFLATED, -15)
            comp = z.compress(dados) + z.flush()
            o[peso] = base64.b64encode(comp).decode('ascii')
            if peso == 'regular': o['cobre'] = cobre
            if a.relatorio: print('fontes do PDF: %s %s  ttf %d B  deflate %d B  base64 %d B  %d caracteres' % (fam, peso, len(dados), len(comp), len(o[peso]), len(cobre)), file=sys.stderr)
        out[fam] = o
    js = 'const FONTES_PDF = ' + json.dumps(out, ensure_ascii=True, separators=(',', ':')) + ';\n'
    try:
        os.makedirs(cache_dir, exist_ok=True)
        open(cache, 'w', encoding='utf-8').write(js)
    except OSError:
        pass
    sys.stdout.write(js)


if __name__ == '__main__':
    main()
