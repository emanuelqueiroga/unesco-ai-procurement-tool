// v022.1: "Em que moeda o plano será apresentado?" na tela do lugar, numa lista: vem com a moeda do país; no topo da
// lista, a moeda do país, o dólar e o euro, e depois as demais. Fora do dólar, a taxa por US$ 1 vem da cotação do dia e
// pode ser substituída. A escolha grava a moeda do caso (setMoeda); trocar de país volta à moeda do novo país.
import { useEffect, useId } from 'react';
import { useCaso } from '../store';
import { nomeMoeda, lerNumero, LOC, paisPorIso, OUTRO_PAIS } from '../domain';
import { CampoNumero } from './CampoNumero';
import { t } from './textos';
import { listaMoedas, taxaReferencia } from '../screens/refinar/calc';
import '../screens/refinar.css';

export function MoedaPlano() {
  const moeda = useCaso((s) => s.moeda), pais = useCaso((s) => String(s.caso.pais || ''));
  useCaso((s) => s.lang);
  const setMoeda = useCaso((s) => s.setMoeda);
  const id = useId();
  const cod = (moeda && moeda.cod) || 'USD';
  const p: any = pais && pais !== OUTRO_PAIS ? paisPorIso(pais) : null;
  const doPais: string = p && p.moeda ? p.moeda : '';
  // no topo: a moeda do país, o dólar e o euro; depois as demais, pelo nome no idioma da tela
  const topo = [doPais, 'USD', 'EUR'].filter((c, k, a) => c && a.indexOf(c) === k);
  const { principais, demais } = listaMoedas();
  const resto = [...principais, ...demais].filter((c, k, a) => !topo.includes(c) && a.indexOf(c) === k)
    .sort((a, b) => String(nomeMoeda(a)).localeCompare(String(nomeMoeda(b)), String(LOC())));
  const op = (c: string) => <option key={c} value={c}>{String(nomeMoeda(c))} ({c}){c === doPais ? ' · ' + t('moeda do país') : ''}</option>;
  const ref = taxaReferencia(cod), informada = moeda && moeda.taxaDe === cod ? lerNumero(moeda.taxa) : '';
  const fmt = (v: number) => v.toLocaleString(String(LOC()), { maximumFractionDigits: 4 });
  const escolher = (c: string) => setMoeda(c === doPais && pais ? { cod: c, taxa: '', taxaDe: '', doPais: pais } as any : { cod: c, taxa: '', taxaDe: '', escolhida: true } as any);
  // Por padrão, a moeda do país: vale também para casos salvos em que o país já estava escolhido e a moeda ficou no
  // dólar (o país não foi trocado, então a troca automática não aconteceu). Só a escolha da pessoa na lista fica.
  useEffect(() => {
    if (doPais && cod !== doPais && !(moeda as any)?.escolhida) setMoeda({ cod: doPais, taxa: '', taxaDe: '', doPais: pais } as any);
  }, [pais, doPais, cod]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="pc-moeda-plano">
      <div className="pc-moeda-plano-linha">
        <div className="rf-campo rf-campo--sel">
          <label className="rf-rotulo" htmlFor={id}>{t('Em que moeda o plano será apresentado?')}</label>
          <select id={id} className="rf-select rf-select--moeda" value={cod} onChange={(e) => { if (e.target.value && e.target.value !== '-') escolher(e.target.value); }}>
            {topo.map(op)}
            <option disabled value="-">──────────</option>
            {resto.map(op)}
          </select>
        </div>
        {cod !== 'USD' ? <div className="rf-campo">
          <CampoNumero label={t('{moeda} por US$ 1', { moeda: cod })} value={informada === '' ? '' : +informada} decimais size={10}
            placeholder={ref ? fmt(ref) : ''} hint={ref ? t('Referência: {taxa}', { taxa: fmt(ref) }) : undefined}
            onChange={(v) => setMoeda({ ...(moeda as any), cod, taxa: v === '' ? '' : v, taxaDe: v === '' ? '' : cod })} />
        </div> : null}
      </div>
    </div>
  );
}
