// v018: o "i" de explicação do fluxo da governança. Abre ao passar o mouse e fixa no clique (no toque, abre e fecha no
// toque); fecha com Esc ou clique fora. Fica fora do <label> do cartão, para não marcar a opção ao ser clicado.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { IconInfo } from '../ui';
import { t } from '../percurso/textos';
import { explicacaoGov } from '../percurso/explicacoesGov';
import './infoDica.css';

export function InfoDica({ nome, texto, inicio = false, rotulo }: { nome: string; texto: ReactNode; inicio?: boolean; rotulo?: string }) {
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
    <button ref={botao} type="button" className="pc-dica-botao" aria-label={rotulo ?? t('O que é: {nome}', { nome })} aria-expanded={aberto} aria-controls={aberto ? id : undefined}
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

/** v022.1: grupos de itens do "i" de um cartão de seleção (o que se abre depois de marcar o item). */
export interface GrupoDica { titulo?: string; itens: string[]; numerada?: boolean }

function ConteudoLista({ grupos }: { grupos: GrupoDica[] }) {
  return <>{grupos.filter(g => g.itens.length).map((g, i) => <span key={i} className="pc-dica-grupo">
    {g.titulo ? <span className="pc-dica-grupo-titulo">{g.titulo}</span> : null}
    <span role="list" className={'pc-dica-lista' + (g.numerada ? ' pc-dica-lista--numerada' : '')}>
      {g.itens.map((x, j) => <span key={j} role="listitem" className="pc-dica-item">{x}</span>)}
    </span>
  </span>)}</>;
}

/** v022.1: um cartão de seleção com o "i" listando o que se abre depois de marcá-lo (categorias, opções, equipe e
 *  campos). Sem itens, o cartão fica sem o "i". */
export function CartaoComLista({ nome, grupos, children }: { nome: string; grupos: GrupoDica[]; children: ReactNode }) {
  if (!grupos.some(g => g.itens.length)) return <>{children}</>;
  return <div className="pc-dica-cartao">{children}<InfoDica nome={nome} rotulo={t('O que inclui: {nome}', { nome })} texto={<ConteudoLista grupos={grupos} />} /></div>;
}
