// v022.2: no plano, quando a moeda não é o dólar, o mesmo total convertido em dólares, com a taxa e a data usadas.
// Não soma moedas: é o total do plano mostrado de novo em outra unidade, para quem leva o plano a um financiador.
import { useCaso } from '../store';
import { getTabelaMoedas, lerNumero, LOC } from '../domain';
import { taxaV16 } from '../percurso/orcamentoV016';
import { t } from '../percurso/textos';
import { dataTaxa } from './refinar/SeletorMoeda';

export function EquivalenteUSD({ total, moeda, rotulo }: { total: number; moeda: string; rotulo?: string }) {
  const s = useCaso();
  if (!moeda || moeda === 'USD' || !(total > 0)) return null;
  const taxa = taxaV16(moeda, s);
  if (!taxa) return null;
  const informada = s.moeda && s.moeda.taxaDe === moeda && lerNumero(s.moeda.taxa) !== '';
  const usd = new Intl.NumberFormat(String(LOC()), { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(total / taxa);
  const tx = taxa.toLocaleString(String(LOC()), { maximumFractionDigits: 4 });
  return <p className="pc-nota pc-equivalente-usd">{(rotulo ? rotulo + ': ' : '') + t('equivale a {usd}, à taxa de 1 US$ = {taxa} {moeda}', { usd, taxa: tx, moeda })}
    {' '}({informada ? t('taxa informada no plano') : t('cotação de {data}, {fonte}', { data: dataTaxa(), fonte: getTabelaMoedas().fonte })}).</p>;
}
