// v018: cotação do dia. Ao abrir, a ferramenta busca as taxas por US$ do dia na ExchangeRate-API (open.er-api.com,
// sem chave, atualizada uma vez por dia); se ela falhar, na currency-api (Fawaz Ahmed, pelo jsDelivr ou pelo
// Cloudflare). A tabela obtida fica guardada no navegador até o fim do dia, para não buscar a cada página. Sem rede,
// vale a última tabela guardada ou a embutida (data/moedas.json), sempre com a sua data, que a tela mostra.
// Uma moeda que a fonte do dia não traga fica com a taxa da tabela embutida. A taxa informada no caso continua valendo
// por cima de todas.
import moedas from '../../../data/moedas.json';
import { setTabelaMoedas } from '../domain';

export interface TabelaMoedas { fonte: string; data: string; taxas: Record<string, number> }
interface Guardada extends TabelaMoedas { buscadoEm: string }

const EMBUTIDA = moedas as TabelaMoedas;
const CHAVE = 'aiep-cotacoes-dia-v1';
const FONTE_ER = EMBUTIDA.fonte;   // "ExchangeRate-API (open.er-api.com), taxas de referência com base em USD"
const FONTE_FA = 'currency-api (Fawaz Ahmed), taxas de referência com base em USD';
const hoje = () => new Date().toISOString().slice(0, 10);

function lerGuardada(): Guardada | null {
  try {
    const j = JSON.parse(localStorage.getItem(CHAVE) || 'null');
    return j && j.taxas && typeof j.data === 'string' && typeof j.buscadoEm === 'string' ? j : null;
  } catch { return null; }
}
function guardar(t: TabelaMoedas) { try { localStorage.setItem(CHAVE, JSON.stringify({ ...t, buscadoEm: hoje() })); } catch { /* sem armazenamento: busca de novo na próxima abertura */ } }

/** Só taxas positivas de códigos de três letras; as moedas que faltarem ficam com a taxa da tabela embutida. */
function completar(t: TabelaMoedas): TabelaMoedas {
  const taxas: Record<string, number> = { ...EMBUTIDA.taxas };
  for (const [c, v] of Object.entries(t.taxas || {})) { const k = c.toUpperCase(); if (/^[A-Z]{3}$/.test(k) && typeof v === 'number' && v > 0) taxas[k] = v; }
  taxas.USD = 1;
  return { fonte: t.fonte, data: t.data, taxas };
}

async function json(url: string, sinal: AbortSignal) {
  const r = await fetch(url, { signal: sinal, cache: 'no-store' });
  if (!r.ok) throw new Error(url + ': ' + r.status);
  return r.json();
}
async function exchangeRateApi(sinal: AbortSignal): Promise<TabelaMoedas> {
  const j = await json('https://open.er-api.com/v6/latest/USD', sinal);
  if (j?.result !== 'success' || !j.rates || !j.time_last_update_unix) throw new Error('ExchangeRate-API sem taxas');
  return { fonte: FONTE_ER, data: new Date(j.time_last_update_unix * 1000).toISOString().slice(0, 10), taxas: j.rates };
}
async function currencyApi(sinal: AbortSignal): Promise<TabelaMoedas> {
  let erro: unknown = null;
  for (const url of ['https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json',
    'https://latest.currency-api.pages.dev/v1/currencies/usd.min.json']) {
    try {
      const j = await json(url, sinal);
      if (!j?.usd || !j.date) throw new Error('currency-api sem taxas');
      // a currency-api traz também criptomoedas e metais: ficam só os códigos da tabela embutida (moedas nacionais)
      const taxas = Object.fromEntries(Object.entries(j.usd as Record<string, number>).map(([c, v]) => [c.toUpperCase(), v]).filter(([c]) => c in EMBUTIDA.taxas));
      return { fonte: FONTE_FA, data: String(j.date), taxas };
    } catch (e) { erro = e; }
  }
  throw erro;
}
async function buscar(): Promise<TabelaMoedas | null> {
  const ctl = new AbortController(), limite = setTimeout(() => ctl.abort(), 8000);
  try {
    try { return completar(await exchangeRateApi(ctl.signal)); }
    catch { return completar(await currencyApi(ctl.signal)); }
  } catch { return null; } finally { clearTimeout(limite); }
}

/**
 * Põe em uso a cotação do dia antes da primeira pintura. Com tabela já buscada hoje, usa-a sem ir à rede. Senão,
 * busca e espera no máximo `espera` ms: se a resposta chegar depois, fica guardada para a próxima abertura (a tela
 * já desenhada não troca de taxa no meio do uso). Devolve a tabela em uso.
 */
export async function carregarCotacoes(espera = 2500): Promise<TabelaMoedas> {
  const g = lerGuardada();
  if (g) setTabelaMoedas(completar(g));
  if (g && g.buscadoEm === hoje()) return completar(g);
  let aTempo = true;
  const busca = buscar().then(t => { if (t) { guardar(t); if (aTempo) setTabelaMoedas(t); } return t; });
  const r = await Promise.race([busca, new Promise<null>(z => setTimeout(() => z(null), espera))]);
  aTempo = false;
  return r || (g ? completar(g) : EMBUTIDA);
}
