// Rodapé institucional, desenhado pela moldura (Shell) no fim de TODAS as telas: os dois logos, o vínculo com a
// Cátedra e o IA.EDU, a isenção completa da UNESCO (TXT_ISENCAO), o aviso de tradução preliminar nos idiomas que
// ainda não foram revisados, e a versão e a data do build.
import { createContext, useContext } from 'react';
import { TXT_VINCULO, TXT_ISENCAO, avisoTraducao, tr } from '../domain';
import { useCaso } from '../store';
import { VERSAO, CANAL } from '../percurso/canal';
import { textoVersao } from './transversal';
import { LOGOS } from './logos';
import './shell.css';

/** Data do build (AAAA-MM-DD), injetada pelo vite.config.ts (`define`; tipo em src/build.d.ts). */
export const DATA_BUILD: string = typeof __BUILD_DATE__ === 'string' ? __BUILD_DATE__ : '';

/** Verdadeiro dentro da moldura: quem ainda chama <Rodape/> por conta própria não duplica o rodapé. */
export const DentroDaMoldura = createContext(false);

export function RodapeCompleto() {
  const lang = useCaso((s) => s.lang);
  const aviso: any = avisoTraducao(lang);
  return (
    <footer className="pc-rodape" data-testid="rodape">
      <div className="pc-rodape-logos pr-header-plate">
        {LOGOS.map((l) => <img key={l.src} className="pc-rodape-logo" src={l.src} alt={String(tr(l.alt))} height={32} />)}
      </div>
      <div className="pc-rodape-texto">
        <p className="pc-rodape-vinculo">{String(tr(TXT_VINCULO))}</p>
        <p className="pc-rodape-isencao">{String(tr(TXT_ISENCAO))}</p>
        {aviso ? (
          <p className="pc-rodape-aviso">
            <span lang={aviso.lang} dir={aviso.dir}>{aviso.local}</span>
            {aviso.en && aviso.en !== aviso.local ? <> <span lang="en" dir="ltr">{aviso.en}</span></> : null}
          </p>
        ) : null}
        <p className="pc-rodape-versao" dir="ltr" data-testid="versao">{textoVersao(VERSAO, CANAL, DATA_BUILD)}</p>
      </div>
    </footer>
  );
}

/** Compatível com quem já usava <Rodape/> (Inicio, Plano): dentro da moldura não desenha nada, porque o Shell
 *  desenha o rodapé; fora dela, desenha o rodapé completo. */
export function Rodape() {
  const dentro = useContext(DentroDaMoldura);
  return dentro ? null : <RodapeCompleto />;
}
