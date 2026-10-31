// v015: país do planejamento nacional, com catálogo completo e instituição opcional na mesma tela.
// Identidade do país independe da existência de dados locais. A política anterior de moeda e referências é preservada.
import { useId, useMemo, useState } from 'react';
import { TextField } from '../ui';
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
  if (!n && pais) return t('Sem dados locais para este país: as estimativas usam referências globais ilustrativas. Você pode ajustar as premissas.');
  if (!n) return t('Selecione o país para iniciar o planejamento nacional.');
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
  const lang = useCaso((s) => s.lang);   // os nomes dos países mudam com o idioma
  const id = useId();
  const notaId = useId();
  const [busca, setBusca] = useState('');
  const normalizar = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
  const todos = useMemo(paisesOrdenados, [lang]);
  const encontrados = todos.filter((p: any) => normalizar(p.nome + ' ' + p.iso3 + ' ' + p.iso2).includes(normalizar(busca.trim())));
  const opcoes = encontrados.some((p: any) => p.iso3 === pais) ? encontrados : [...encontrados, ...todos.filter((p: any) => p.iso3 === pais)];
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
      <p className="pc-nota">{t('Planejamento no nível do país.')}</p>
      <details className="pc-gov-detalhes"><summary>{t('Buscar país')}</summary><TextField label={t('Buscar país')} value={busca} onChange={setBusca} /></details>
      <label className="rf-rotulo" htmlFor={id}>{t('País')}</label>
      <select id={id} className="rf-select" value={pais} aria-describedby={semNota ? undefined : notaId} onChange={(e) => { void mudar(e.target.value); }}>
        <option value="">{t('Escolha o país')}</option>
        {opcoes.map((p: any) => <option key={p.iso3} value={p.iso3}>{p.nome}</option>)}
        <option value={OUTRO_PAIS}>{t('Não informado')}</option>
      </select>
      {!encontrados.length ? <p role="status">{t('Nenhum país encontrado.')}</p> : null}
      {semNota ? null : <p className="rf-pais-nota" id={notaId}>{textoNotaPais(pais)}</p>}
    </div>
  );
}
