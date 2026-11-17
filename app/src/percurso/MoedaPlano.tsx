// v022.2: "Em que moeda o plano será apresentado?" na tela do lugar. Três cartões: a moeda do país (marcada ao escolher
// o país), o dólar e "outra moeda", que abre a lista completa. Fora do dólar, a taxa por US$ 1 vem da cotação do dia e
// pode ser substituída. A escolha grava a moeda do caso (setMoeda); trocar de país volta à moeda do novo país.
import { useId, useState } from 'react';
import { useCaso } from '../store';
import { OptionCard, OptionCardGroup } from '../ui';
import { nomeMoeda, lerNumero, LOC, paisPorIso, getTabelaMoedas, OUTRO_PAIS } from '../domain';
import { CampoNumero } from './CampoNumero';
import { t } from './textos';
import { listaMoedas, taxaReferencia } from '../screens/refinar/calc';
import { dataTaxa } from '../screens/refinar/SeletorMoeda';
import '../screens/refinar.css';

export function MoedaPlano() {
  const moeda = useCaso((s) => s.moeda), pais = useCaso((s) => String(s.caso.pais || ''));
  useCaso((s) => s.lang);
  const setMoeda = useCaso((s) => s.setMoeda);
  const idLista = useId();
  const cod = (moeda && moeda.cod) || 'USD';
  const p: any = pais && pais !== OUTRO_PAIS ? paisPorIso(pais) : null;
  const doPais: string = p && p.moeda && p.moeda !== 'USD' ? p.moeda : '';
  const marcado = doPais && cod === doPais ? 'pais' : cod === 'USD' ? 'usd' : 'outra';
  const [abrir, setAbrir] = useState(false);
  const opcao = abrir && marcado !== 'outra' ? 'outra' : marcado;
  const escolher = (v: string) => {
    if (v === 'pais' && doPais) { setMoeda({ cod: doPais, taxa: '', taxaDe: '', doPais: pais } as any); setAbrir(false); }
    else if (v === 'usd') { setMoeda({ cod: 'USD', taxa: '', taxaDe: '' }); setAbrir(false); }
    else setAbrir(true);
  };
  const { principais, demais } = listaMoedas();
  const op = (c: string) => <option key={c} value={c}>{c} · {String(nomeMoeda(c))}</option>;
  const ref = taxaReferencia(cod), informada = moeda && moeda.taxaDe === cod ? lerNumero(moeda.taxa) : '';
  const fmt = (v: number) => v.toLocaleString(String(LOC()), { maximumFractionDigits: 4 });
  return (
    <div className="pc-moeda-plano">
      <p className="rf-rotulo pc-moeda-plano-rotulo" aria-hidden="true">{t('Em que moeda o plano será apresentado?')}</p>
      <OptionCardGroup className="pc-lit-opcoes" label={t('Em que moeda o plano será apresentado?')} type="radio">
        {doPais ? <OptionCard name="moeda-plano" value="pais" checked={opcao === 'pais'} onChange={escolher}
          label={`${String(nomeMoeda(doPais))} (${doPais})`} subtext={t('moeda do país')} /> : null}
        <OptionCard name="moeda-plano" value="usd" checked={opcao === 'usd'} onChange={escolher} label={`${String(nomeMoeda('USD'))} (US$)`} />
        <OptionCard name="moeda-plano" value="outra" checked={opcao === 'outra'} onChange={escolher} label={t('Outra moeda')} />
      </OptionCardGroup>
      {opcao === 'outra' ? <div className="rf-campo rf-campo--sel">
        <label className="rf-rotulo" htmlFor={idLista}>{t('Escolha a moeda')}</label>
        <select id={idLista} className="rf-select rf-select--moeda" value={marcado === 'outra' ? cod : ''}
          onChange={(e) => { if (e.target.value) setMoeda({ cod: e.target.value, taxa: '', taxaDe: '' }); }}>
          {marcado === 'outra' ? null : <option value="">{t('Escolha a moeda')}</option>}
          {principais.map(op)}
          <option disabled value="-">──────────</option>
          {demais.map(op)}
        </select>
      </div> : null}
      {cod !== 'USD' ? <div className="rf-campo">
        <CampoNumero label={t('{moeda} por US$ 1', { moeda: cod })} value={informada === '' ? '' : +informada} decimais size={10}
          placeholder={ref ? fmt(ref) : ''} hint={ref ? t('Referência: {taxa}', { taxa: fmt(ref) }) : undefined}
          onChange={(v) => setMoeda({ ...(moeda as any), cod, taxa: v === '' ? '' : v, taxaDe: v === '' ? '' : cod })} />
      </div> : null}
      <p className="rf-nota">{t('Os valores de referência estão em dólares e são convertidos pela cotação de {data} ({fonte}), que você pode substituir. Nunca se somam valores de moedas diferentes: todo o plano fica na moeda escolhida.', { data: dataTaxa(), fonte: getTabelaMoedas().fonte })}</p>
    </div>
  );
}
