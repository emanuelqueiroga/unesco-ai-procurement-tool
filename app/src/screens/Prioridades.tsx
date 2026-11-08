// Prioridades (v018): a tela da v017 — três cartões quadrados com ícone, no gerúndio, escolha de uma ou mais.
// "Educar para a era da IA" não é oferecida; casos salvos com ela guardam os dados.
import { useState, type ReactNode } from 'react';
import { useCaso, telasDoCapitulo } from '../store';
import { QuestionFrame } from '../ui';
import { PRIORIDADES } from '../domain';
import { CAPITULOS_INFO, t } from '../percurso/textos';
import { href, ir } from '../percurso/rota';
import { AcoesPercurso } from './AcoesPercurso';
import { Shell } from './Shell';
import './prioridades.css';

const OFERECIDAS = ['governar', 'sobre', 'com'];
const svg = (d: ReactNode) => <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
/** Ícones simples: governar (escudo com marca), educar sobre a IA (livro com circuito), com e sem IA (escola). */
const ICONES: Record<string, ReactNode> = {
  governar: svg(<><path d="M24 5 9 11v11c0 10 6.5 17.5 15 21 8.5-3.5 15-11 15-21V11L24 5Z" /><path d="m17 24 5 5 9-10" /></>),
  sobre: svg(<><path d="M6 10c6-2 12-1 18 3v27c-6-4-12-5-18-3V10Z" /><path d="M42 10c-6-2-12-1-18 3v27c6-4 12-5 18-3V10Z" /><circle cx="33" cy="20" r="2.5" /><path d="M33 22.5V30M30 30h6" /></>),
  com: svg(<><path d="M5 20 24 9l19 11-19 11L5 20Z" /><path d="M13 25v9c3 3 7 4.5 11 4.5s8-1.5 11-4.5v-9" /><path d="M43 20v12" /></>),
};

/** A seleção fica local até Próximo, como na v017. */
export function Prioridades() {
  const s = useCaso();
  const [rascunho, setRascunho] = useState<string[]>(() => (s.ctx.prioridades || []).filter((id: string) => OFERECIDAS.includes(id)));
  const P = (PRIORIDADES as any[]).filter(p => OFERECIDAS.includes(p.id));
  const alternar = (id: string) => setRascunho(r => { const n = new Set(r); if (n.has(id)) n.delete(id); else n.add(id); return P.map(p => p.id).filter(k => n.has(k)); });
  const telas = telasDoCapitulo(1), i = telas.findIndex(x => x.id === 'prioridades');
  const ant = i > 0 ? href.pergunta(1, telas[i - 1].id) : href.inicio();
  const prox = telas[i + 1] ? href.pergunta(1, telas[i + 1].id) : href.sintese(1);
  const avancar = () => {
    if (!rascunho.length) return;
    // mantém uma prioridade antiga ("para a era da IA") que já estava salva
    const antigas = (useCaso.getState().ctx.prioridades || []).filter((id: string) => !OFERECIDAS.includes(id));
    s.responder('prioridades', [...rascunho, ...antigas]);
    ir(prox);
  };
  return <Shell pos={{ capitulo: 1, tela: 'prioridades' }} contexto={t(CAPITULOS_INFO[1].titulo)}>
    <div className="pc-pergunta" data-tela="prioridades"><QuestionFrame title={t('Prioridades')}
      actions={<AcoesPercurso anterior={ant} avancar={avancar} disabled={!rascunho.length} />}>
      <div className="pv-prio" role="group" aria-label={t('Prioridades')}>
        {P.map(p => {
          const on = rascunho.includes(p.id);
          return <button key={p.id} type="button" role="checkbox" aria-checked={on} className={'pv-prio-card' + (on ? ' is-on' : '')} onClick={() => alternar(p.id)}>
            <span className="pv-prio-marca" aria-hidden="true">{on ? '✓' : ''}</span>
            <span className="pv-prio-icone">{ICONES[p.id]}</span>
            <span className="pv-prio-nome">{t(p.nome)}</span>
            <span className="pv-prio-desc">{t(p.desc)}</span>
          </button>;
        })}
      </div>
    </QuestionFrame></div>
  </Shell>;
}
