// País da rede (REF-06, REF-07, REF-10): controle opcional da tela "Nome do lugar ou da rede" (1.1.2) e do bloco
// "Dados do país" no Refinar. Não é uma das 25 perguntas: não conta como lacuna, não entra em ESSENCIAL.campos nem
// na origem dos KPIs. Ao escolher o país, a moeda de exibição passa à do país só se ainda estiver em dólar (ou se foi
// o país anterior que a pôs); a nota diz moeda, taxa de referência, região e grupo de renda, com a fonte. Trocar de
// país com valores do perfil editados pede confirmação (eles voltam aos da base); com a calculadora editada, o aviso
// `pendente` da calculadora pergunta se mantém as edições (nada é descartado em silêncio).
import { useId } from 'react';
import { notaPais, paisesOrdenados, nomeMoeda, tr, LOC, OUTRO_PAIS } from '../domain';
import { useCaso } from '../store';
import { confirmar, avisar } from '../screens/Confirmar';
import { taxaReferencia } from '../screens/refinar/calc';
import { t } from './textos';
import '../screens/refinar.css';
import '../screens/refinar/referencias.css';

/** texto da nota abaixo do seletor (já traduzido) */
export function textoNotaPais(pais: string): string {
  if (pais === OUTRO_PAIS) return t('Sem dados de país: valem os valores ilustrativos da ferramenta. Informe os números da sua rede nas perguntas abaixo.');
  const n = notaPais({ pais });
  if (!n) return t('Opcional. Com o país, a moeda de exibição passa à do país (se ainda estiver em dólar) e as premissas usam os dados de referência do país quando a base os tiver. Você pode alterar qualquer valor.');
  const taxa = taxaReferencia(n.moeda);
  const partes = [
    t('Moeda do país:') + ' ' + n.moeda + ' · ' + String(nomeMoeda(n.moeda)) + '.',
    taxa ? t('1 US$ =') + ' ' + taxa.toLocaleString(String(LOC()), { maximumFractionDigits: 4 }) + ' ' + n.moeda + '.' : '',
    t('Região:') + ' ' + String(tr(n.nomeRegiao)) + '.',
    n.renda ? t('Grupo de renda:') + ' ' + String(tr(n.renda)) + (n.fonteRenda ? ' (' + String(tr(n.fonteRenda)) + ')' : '') + '.' : '',
  ];
  return partes.filter(Boolean).join(' ');
}

export function Pais({ semNota }: { semNota?: boolean }) {
  const pais = useCaso((s) => String(s.caso.pais || ''));
  const nEditados = useCaso((s) => Object.keys(s.caso.editados || {}).length);
  const escolherPais = useCaso((s) => s.escolherPais);
  useCaso((s) => s.lang);   // os nomes dos países mudam com o idioma
  const id = useId();
  const notaId = useId();
  const mudar = async (v: string) => {
    if (v === pais) return;
    if (nEditados > 0 && !(await confirmar({
      titulo: t('Trocar de país?'),
      texto: t('Os valores que você editou nos dados do país voltam aos da base do país escolhido.'),
      ok: t('Trocar de país'),
    }))) return;
    const r = escolherPais(v);
    if (r.moeda) avisar(t('Moeda ajustada para') + ' ' + r.moeda + '.');
  };
  return (
    <div className="rf-pais">
      <label className="rf-rotulo" htmlFor={id}>{t('Em que país fica a rede?')} ({t('opcional')})</label>
      <select id={id} className="rf-select" value={pais} aria-describedby={semNota ? undefined : notaId} onChange={(e) => { void mudar(e.target.value); }}>
        <option value="">{t('Escolha o país')}</option>
        {paisesOrdenados().map((p: any) => <option key={p.iso3} value={p.iso3}>{p.nome}</option>)}
        <option value={OUTRO_PAIS}>{t('Outro país ou não listado')}</option>
      </select>
      {semNota ? null : <p className="rf-pais-nota" id={notaId}>{textoNotaPais(pais)}</p>}
    </div>
  );
}
