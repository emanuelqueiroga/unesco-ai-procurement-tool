// Seletor de idioma no cabeçalho (os nove idiomas da v13) e o aviso de tradução preliminar dos idiomas novos
// (ar, zh, bm, zu, sw), no idioma escolhido e em inglês, como na v13.
import { IDIOMAS, avisoTraducao, idiomaInfo } from '../domain';
import { useCaso } from '../store';
import { usarIdioma } from '../i18n';
import { t } from '../percurso/textos';

export function SeletorIdioma({ compacto }: { compacto?: boolean }) {
  const lang = useCaso((s) => s.lang) || 'en';
  const setLang = useCaso((s) => s.setLang);
  return (
    <label className={'pc-idioma' + (compacto ? ' pc-idioma--compacto' : '')}>
      <span className="pc-idioma-rotulo">{t('Idioma')}</span>
      <select
        id="sel-lang"
        className="pc-idioma-select"
        value={lang}
        onChange={async (ev) => { const l = await usarIdioma(ev.target.value); setLang(l); }}
      >
        {(IDIOMAS as any[]).map((i) => {
          const f: any = idiomaInfo(i[0]);
          return <option key={i[0]} value={i[0]} lang={f.lang} dir={f.dir}>{i[1]}</option>;
        })}
      </select>
    </label>
  );
}

export function AvisoTraducao() {
  const lang = useCaso((s) => s.lang);
  const a: any = avisoTraducao(lang);
  if (!a) return null;
  return (
    <div className="pc-aviso-trad" role="note">
      <span lang={a.lang} dir={a.dir}>{a.local}</span>
      {a.en && a.en !== a.local ? <span className="pc-aviso-trad-en" lang="en" dir="ltr">{a.en}</span> : null}
    </div>
  );
}
