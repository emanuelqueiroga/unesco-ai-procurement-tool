// v018: o "i" de explicação do fluxo da governança. Abre ao passar o mouse e fixa no clique (no toque, abre e fecha no
// toque); fecha com Esc ou clique fora. Fica fora do <label> do cartão, para não marcar a opção ao ser clicado.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { IconInfo } from '../ui';
import { t } from '../percurso/textos';
import { explicacaoGov } from '../percurso/explicacoesGov';
import './infoDica.css';

export function InfoDica({ nome, texto, inicio = false }: { nome: string; texto: string; inicio?: boolean }) {
  const [fixo, setFixo] = useState(false), [sobre, setSobre] = useState(false);
  const raiz = useRef<HTMLSpanElement>(null), botao = useRef<HTMLButtonElement>(null), id = useId();
  const aberto = fixo || sobre;
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => { if (raiz.current && !raiz.current.contains(e.target as Node)) { setFixo(false); setSobre(false); } };
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') { setFixo(false); setSobre(false); botao.current?.focus(); } };
    document.addEventListener('pointerdown', fora);
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('pointerdown', fora); document.removeEventListener('keydown', tecla); };
  }, [aberto]);
  return <span ref={raiz} className={'pc-dica' + (inicio ? ' pc-dica--inicio' : '')}
    onPointerEnter={e => { if (e.pointerType === 'mouse') setSobre(true); }} onPointerLeave={e => { if (e.pointerType === 'mouse') setSobre(false); }}>
    <button ref={botao} type="button" className="pc-dica-botao" aria-label={t('O que é: {nome}', { nome })} aria-expanded={aberto} aria-controls={aberto ? id : undefined}
      onClick={e => { e.preventDefault(); e.stopPropagation(); if (fixo) { setFixo(false); setSobre(false); } else setFixo(true); }}>
      <IconInfo size={18} />
    </button>
    {aberto ? <span id={id} role="note" className="pc-dica-balao">{texto}</span> : null}
  </span>;
}

/** O "i" de um item do catálogo da governança (pelo texto em português), ou nada quando não há explicação. */
export function DicaGov({ chave, nome, inicio }: { chave: string; nome?: string; inicio?: boolean }) {
  const texto = explicacaoGov(chave);
  return texto ? <InfoDica nome={nome ?? t(chave)} texto={t(texto)} inicio={inicio} /> : null;
}

/** Um cartão de opção com o "i" no canto. */
export function CartaoComDica({ chave, nome, children }: { chave: string; nome?: string; children: ReactNode }) {
  if (!explicacaoGov(chave)) return <>{children}</>;
  return <div className="pc-dica-cartao">{children}<DicaGov chave={chave} nome={nome} /></div>;
}
