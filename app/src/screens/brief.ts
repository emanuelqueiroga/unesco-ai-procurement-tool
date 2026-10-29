// Dados do policy brief na tela (PB-06): a mesma recomendação, as mesmas cinco frases, os mesmos três números, as
// etapas e as cinco ações da página 1 do brief em PDF, vindos de plano/brief.js:briefDados (textos já traduzidos).
// "Em resumo" (Plano.tsx), o painel "Seu plano" (PlanoVivo.tsx) e "Seu próximo passo" (sintese.ts) usam estes dados.
import { useEffect, useMemo, useState } from 'react';
import type { CasoStore, Estado14 } from '../store';
import { href } from '../percurso/rota';
import { sincronizar } from '../percurso/ambiente';
import { briefDados } from '../plano/brief.js';

export type IdFrase = 'contexto' | 'teste' | 'implantacao' | 'expansao' | 'custo';
export const ORDEM_FRASES: IdFrase[] = ['contexto', 'teste', 'implantacao', 'expansao', 'custo'];

export interface FraseBrief { rotulo: string; texto: string; falta?: { n: string; pergunta: string; ir: string } | null }
export interface NumeroBrief { id: 'total' | 'ano0' | 'regime'; rotulo: string; valor: string; nota?: string }
export interface EtapaBrief { id: string; nome: string; anos: string | number[]; custo?: number; custoTxt?: string }
export interface AcaoBrief { n: number; id: string; oque: string; quem: string; quando: string }
export interface BriefDados {
  vazio: boolean; titulo: string; subtitulo?: string; data?: string;
  recomendacao: { texto: string; porque?: string; codigo?: string };
  frases: Partial<Record<IdFrase, FraseBrief>>;
  numeros: NumeroBrief[];
  etapas: EtapaBrief[];
  paginas?: unknown;
  acoes: AcaoBrief[];
  /** rótulos fixos já traduzidos, os mesmos do PDF */
  rotulos?: Partial<Record<'tipoDoc' | 'resumoExec' | 'recomendacao' | 'etapas' | 'numeros' | 'acoes' | 'oque' | 'quem' | 'quando' | 'n' | 'anexo' | 'isencao', string>>;
}

/** briefDados sem derrubar a tela: um erro do brief vira `null` (a página mostra o resto). */
export function dadosBrief(e: Estado14): BriefDados | null {
  try {
    sincronizar(e);
    const b = (briefDados as (x: Estado14) => unknown)(e) as BriefDados | null;
    return b && b.recomendacao ? b : null;
  } catch (err) {
    console.warn(err);
    return null;
  }
}

/** O KPI do painel que explica cada número do brief (o "de onde vem?"). */
export const KPI_DO_NUMERO: Record<NumeroBrief['id'], 'kpi.total' | 'kpi.ano0' | 'kpi.anual'> = { total: 'kpi.total', ano0: 'kpi.ano0', regime: 'kpi.anual' };

/** Destino de "Responder": `ir` já é um endereço (#/…) ou é o id do campo. */
export const hrefFalta = (ir: string): string => (/^#/.test(ir) ? ir : href.campo(ir));

/** Os anos de uma etapa em texto ("Ano 0", "Anos 1–2"), aceitando texto pronto ou a lista de anos. */
export const anosTxt = (a: EtapaBrief['anos']): string => (Array.isArray(a) ? a.join('–') : String(a ?? ''));

const deps = (s: CasoStore) => [s.caso, s.ctx, s.resp, s.origem, s.custo, s.moeda, s.exemplo, s.lang];

/** Os dados do brief na página do plano, recalculados quando o caso muda. */
export function useBrief(s: CasoStore): BriefDados | null {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => dadosBrief(s.estado()), deps(s));
}

/** A recomendação do brief no painel ao vivo: calculada depois de uma pausa curta, para não pesar a cada tecla. */
export function useRecomendacao(s: CasoStore, atraso = 250): string {
  const [texto, setTexto] = useState('');
  useEffect(() => {
    const id = window.setTimeout(() => {
      const b = dadosBrief(s.estado());
      setTexto(b ? String(b.recomendacao.texto || '') : '');
    }, atraso);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps(s));
  return texto;
}
