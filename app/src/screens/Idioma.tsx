// Seletor de idioma no cabeçalho (os nove idiomas da v13) e o aviso de tradução preliminar dos idiomas novos
// (ar, zh, bm, zu, sw), no idioma escolhido e em inglês, como na v13. A faixa pode ser fechada (botão ou Esc) e
// volta ao trocar de idioma.
import { useEffect, useState } from 'react';
import { IDIOMAS, avisoTraducao, idiomaInfo } from '../domain';
import { useCaso } from '../store';
import { t } from '../percurso/textos';
import { trocarIdioma } from './acoes';

export function SeletorIdioma({ compacto }: { compacto?: boolean }) {
  const lang = useCaso((s) => s.lang) || 'en';
  return (
    <label className={'pc-idioma' + (compacto ? ' pc-idioma--compacto' : '')}>
      <span className="pc-idioma-rotulo">{t('Idioma')}</span>
      <select
        id="sel-lang"
        className="pc-idioma-select"
        value={lang}
        onChange={(ev) => { void trocarIdioma(ev.target.value); }}
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
  // idioma cujo aviso a pessoa fechou: trocar de idioma traz o aviso de volta
  const [fechado, setFechado] = useState<string | null>(null);
  const a: any = avisoTraducao(lang);
  const visivel = !!a && fechado !== lang;
  useEffect(() => {
    if (!visivel) return;
    const tecla = (e: KeyboardEvent) => {
      // Esc dentro de um diálogo fecha o diálogo, não o aviso
      if (e.key === 'Escape' && !document.querySelector('[role="dialog"]')) setFechado(lang);
    };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [visivel, lang]);
  if (!visivel) return null;
  return (
    <section className="pc-aviso-trad" aria-label={t('Tradução preliminar')}>
      <div className="pc-aviso-trad-textos">
        <span lang={a.lang} dir={a.dir}>{a.local}</span>
        {a.en && a.en !== a.local ? <span className="pc-aviso-trad-en" lang="en" dir="ltr">{a.en}</span> : null}
      </div>
      <button type="button" className="pc-aviso-trad-fechar" onClick={() => setFechado(lang)} aria-label={t('Fechar o aviso de tradução')}>
        <span aria-hidden="true">×</span>
      </button>
    </section>
  );
}
