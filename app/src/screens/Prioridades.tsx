import { AcoesPercurso } from './AcoesPercurso';
import { useState, type ReactNode } from 'react';
import { useCaso } from '../store';
import { QuestionFrame } from '../ui';
import { PRIORIDADES } from '../domain';
import { PRIORIDADES_V016 } from '../domain/catalogo_v016.js';
import { confirmarPrioridades } from '../percurso/confirmarPrioridades';
import { infoCapitulo, t } from '../percurso/textos';
import { href, ir } from '../percurso/rota';
import { Shell } from './Shell';
import './prioridades.css';

const svg = (d: ReactNode) => <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
/** Ícones simples: governar (escudo com marca), educar sobre a IA (livro com circuito), com e sem IA (escola). */
const ICONES: Record<string, ReactNode> = {
  governar: svg(<><path d="M24 5 9 11v11c0 10 6.5 17.5 15 21 8.5-3.5 15-11 15-21V11L24 5Z" /><path d="m17 24 5 5 9-10" /></>),
  sobre: svg(<><path d="M6 10c6-2 12-1 18 3v27c-6-4-12-5-18-3V10Z" /><path d="M42 10c-6-2-12-1-18 3v27c6-4 12-5 18-3V10Z" /><circle cx="33" cy="20" r="2.5" /><path d="M33 22.5V30M30 30h6" /></>),
  com: svg(<><path d="M5 20 24 9l19 11-19 11L5 20Z" /><path d="M13 25v9c3 3 7 4.5 11 4.5s8-1.5 11-4.5v-9" /><path d="M43 20v12" /></>),
};

/** A seleção fica local até Próximo; a moldura continua usando o caso confirmado. */
export function Prioridades() {
  const s = useCaso();
  const [rascunho, setRascunho] = useState<string[]>(() => (s.ctx.prioridades || []).filter((id: string) => PRIORIDADES_V016.includes(id)));
  const P = (PRIORIDADES as any[]).filter(p => PRIORIDADES_V016.includes(p.id));
  const alternar = (id: string) => setRascunho(r => { const n = new Set(r); if (n.has(id)) n.delete(id); else n.add(id); return P.map(p => p.id).filter(k => n.has(k)); });
  const avancar = () => { const destino = confirmarPrioridades(rascunho); if (destino) ir(destino); };
  return <Shell pos={{ capitulo: 1, tela: 'prioridades' }} contexto={t(infoCapitulo(1, s).titulo)}>
    <div className="pc-pergunta" data-tela="prioridades"><QuestionFrame title={t('Prioridades')}
      actions={<AcoesPercurso anterior={href.pergunta(1, 'local')} avancar={avancar} disabled={!rascunho.length} />}>
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
