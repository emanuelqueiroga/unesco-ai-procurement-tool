// Moeda de exibição e taxa de câmbio (CUS-07, CUS-08): lista com as principais moedas no topo e as demais por
// nome no idioma; campo "XXX por US$ 1" com a taxa de referência como sugestão; data e fonte da taxa. Trocar de
// moeda zera a taxa informada. Grava com setMoeda({ cod, taxa, taxaDe }); o domínio (moedaInfo) só honra a taxa
// quando taxaDe é a moeda atual. Reutilizável (caixa Caso, pacote transversal). Quando foi o país da rede que pôs a
// moeda (moeda.doPais, REF-07), uma linha diz isso; escolher outra moeda aqui é escolha da pessoa e o país não a muda mais.
import { useId } from 'react';
import { useCaso } from '../../store';
import { nomeMoeda, lerNumero, LOC, paisPorIso, nomePais } from '../../domain';
import { CampoNumero } from '../../percurso/CampoNumero';
import { MOEDAS } from '../../percurso/ambiente';
import { t } from '../../percurso/textos';
import { listaMoedas, taxaReferencia } from './calc';
import '../refinar.css';

export function dataTaxa(): string {
  try { return new Date(MOEDAS.data + 'T12:00:00').toLocaleDateString(String(LOC())); } catch (e) { return MOEDAS.data; }
}

export function SeletorMoeda({ compacto, semNota }: { compacto?: boolean; semNota?: boolean }) {
  const moeda = useCaso((s) => s.moeda);
  const lang = useCaso((s) => s.lang);   // os nomes das moedas mudam com o idioma
  const setMoeda = useCaso((s) => s.setMoeda);
  const id = useId();
  const cod = (moeda && moeda.cod) || 'USD';
  const { principais, demais } = listaMoedas();
  const ref = taxaReferencia(cod);
  const informada = moeda && moeda.taxaDe === cod ? lerNumero(moeda.taxa) : '';
  const op = (c: string) => <option key={c} value={c}>{c} · {String(nomeMoeda(c))}</option>;
  return (
    <div className={['rf-moeda', compacto ? 'rf-moeda--compacta' : ''].filter(Boolean).join(' ')} data-lang={lang}>
      <div className="rf-moeda-linha">
        <div className="rf-campo rf-campo--sel">
          <label className="rf-rotulo" htmlFor={id}>{t('Moeda de exibição')}</label>
          <select
            id={id}
            className="rf-select rf-select--moeda"
            value={cod}
            onChange={(e) => setMoeda({ cod: e.target.value, taxa: '', taxaDe: '' })}
          >
            {principais.map(op)}
            <option disabled value="">──────────</option>
            {demais.map(op)}
          </select>
        </div>
        {cod !== 'USD' ? (
          <div className="rf-campo">
            <CampoNumero
              label={t('{moeda} por US$ 1', { moeda: cod })}
              value={informada === '' ? '' : +informada}
              decimais
              size={10}
              placeholder={ref ? ref.toLocaleString(String(LOC()), { maximumFractionDigits: 4 }) : ''}
              hint={ref ? t('Referência: {taxa}', { taxa: ref.toLocaleString(String(LOC()), { maximumFractionDigits: 4 }) }) : undefined}
              onChange={(v) => setMoeda({ cod, taxa: v === '' ? '' : v, taxaDe: v === '' ? '' : cod })}
            />
          </div>
        ) : null}
      </div>
      {moeda && moeda.doPais && paisPorIso(moeda.doPais) && (paisPorIso(moeda.doPais) as any).moeda === cod ? (
        <p className="rf-nota">{t('Moeda do país escolhido ({pais}).', { pais: String(nomePais(paisPorIso(moeda.doPais))) })}</p>
      ) : null}
      {semNota ? null : (
        <p className="rf-nota">
          {t('O modelo calcula em dólares (US$) e converte para a moeda escolhida pela taxa de referência de {data} ({fonte}), que você pode substituir. A conversão é de exibição. O risco de variação cambial sobre os itens cotados em dólar está nas premissas (trajetória do câmbio) e nos cenários.', { data: dataTaxa(), fonte: MOEDAS.fonte })}
        </p>
      )}
    </div>
  );
}
