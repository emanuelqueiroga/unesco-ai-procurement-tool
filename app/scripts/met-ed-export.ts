// Exporta o caso de exemplo da metodologia da educação (Brasil, alfabetização e numeracia, todas as opções, em US$)
// e o catálogo de linhas, em JSON, para a nota técnica (PDF) e a planilha (Excel) em português e inglês.
// Uso: npx vite-node scripts/met-ed-export.ts <saida.json>
import fs from 'node:fs';
import { orcamentoEducacao, COMPONENTES, CATEGORIAS_ED, DESAFIOS_ED, FASES_PADRAO, SIM, publico, padraoParam, type CompDef } from '../src/percurso/educacaoV20';
import { FONTES_ED, semEnergiaPais, semInternetPais, razaoPais, deficienciaPais, precoPais, paramPais, NIVEIS_DESAFIO } from '../src/percurso/educacaoPais';
import { PAPEIS_ESPECIALISTA, premioEspecialista } from '../src/percurso/equipesGov';
import { NOME_PERFIL } from '../src/percurso/custosV017';
import { nivelPrecos } from '../src/percurso/formacaoGov';
import { MET_ED } from '../src/percurso/metodologiaEd';

const en = JSON.parse(fs.readFileSync('src/i18n/en.json', 'utf8'));
const dicEn: Record<string, string> = en.dic || en.textos || en;
const EN = (s: string) => (typeof dicEn[s] === 'string' ? dicEn[s] : s);
const bi = (s: string) => ({ pt: s, en: EN(s) });

const TODAS = CATEGORIAS_ED.flatMap(c => c.opcoes.map(o => o.id));
const s: any = { ctx: { prioridades: ['com'], local: 'Rede de exemplo', edV20: { desafios: ['C32'], categorias: { C32: ['e1', 'e2', 'e3', 'e4'] }, opcoes: { C32: TODAS } } }, caso: { pais: 'BRA' }, moeda: { cod: 'USD', taxa: '', taxaDe: '' } };
const r = orcamentoEducacao(s), dc = r.porDesafio.C32, p = publico(s, 'C32');
const linhas = dc.opcoes.flatMap(o => o.comps.filter(c => c.on).map(c => ({
  id: c.def.id, op: o.op, nome: bi(c.def.nome), alt: c.alt, classe: c.def.classe, informativo: !!c.def.informativo, unidade: bi(c.def.unidade || ''), formula: bi(c.def.formula),
  tipo: c.def.papeis ? 'papeis' : c.def.pctDe ? 'pct' : 'qtd', total: c.total, unit: c.unit,
  porFase: c.porFase.map(v => ({ fase: v.fase, qtd: v.qtd, unit: v.unit, valor: v.valor })),
  papeis: c.papeis.map(x => ({ papel: bi(x.papel), perfil: x.perfil, ded: x.ded, unit: x.unit, especialista: x.especialista, valor: x.valor, porFase: x.porFase })),
  pctDe: c.def.pctDe ? c.def.pctDe.ids : null,
})));
const catalogo = COMPONENTES.map((d: CompDef) => ({
  id: d.id, op: d.op, nome: bi(d.nome), alt: d.alt, classe: d.classe, unidade: bi(d.unidade || ''), formula: bi(d.formula), nota: d.nota ? bi(d.nota) : null,
  params: (d.params || []).map(x => ({ id: x.id, rotulo: bi(x.rotulo), padrao: x.padrao, pct: !!x.pct, pais: x.pais || null, porDesafio: x.porDesafio || null })),
  preco: d.preco ? { rotulo: bi(d.preco.rotulo), padrao: d.preco.padrao, local: !!d.preco.local, perfil: d.preco.perfil || null, hora: !!d.preco.hora, pais: d.preco.pais || null, mult: d.preco.mult || null, porArq: d.preco.porArq || null } : null,
  papeis: (d.papeis || []).map(x => ({ papel: bi(x.papel), perfil: x.perfil, perfilNome: bi(NOME_PERFIL[x.perfil]), pessoas: x.pessoas ?? null, porParam: x.porParam || null, base: x.base || null, ded: x.ded, fases: x.fases || null, alt: x.alt || 'ambos', especialista: x.especialista ?? PAPEIS_ESPECIALISTA.has(x.papel) })),
  pctDe: d.pctDe || null, vida: d.vida ? Number((d.params || []).find(x => x.id === d.vida)?.padrao ?? 0) : null, extra: d.extra || null,
}));
const pais = {
  semEnergia: semEnergiaPais('BRA', 'C32'), semInternet: semInternetPais('BRA', 'C32'), razao: razaoPais('BRA', 'C32'), deficiencia: deficienciaPais('BRA'),
  kwh: precoPais('kwh', 'BRA'), mbps: precoPais('mbps', 'BRA'), gb: precoPais('gb', 'BRA'), pvout: paramPais('pvout', 'BRA'), velBanda: paramPais('velBanda', 'BRA'), nivel: nivelPrecos('BRA'),
};
const out = {
  geradoEm: '2026-11-15', moeda: r.moeda, publico: p, fases: dc.fases, sim: SIM, premio: premioEspecialista().pct,
  resultado: { com: { k: r.com.k, x: r.com.x, u: r.com.u, direto: r.com.direto, P: r.com.P, V: r.com.V, O: r.com.O, T: r.com.T, total: r.com.total, existente: r.com.existente },
    sem: { k: r.sem.k, x: r.sem.x, u: r.sem.u, direto: r.sem.direto, P: r.sem.P, V: r.sem.V, O: r.sem.O, T: r.sem.T, total: r.sem.total, existente: r.sem.existente } },
  linhas, catalogo, pais, fontes: FONTES_ED, niveis: NIVEIS_DESAFIO, met: MET_ED,
  categorias: CATEGORIAS_ED.map(c => ({ id: c.id, n: c.n, nome: bi(c.nome), opcoes: c.opcoes.map((o, i) => ({ id: o.id, n: `${c.n}.${i + 1}`, nome: bi(o.nome) })) })),
  desafios: DESAFIOS_ED.map(d => ({ id: d.id, nome: bi(d.nome) })), fasesPadrao: FASES_PADRAO.map(f => ({ ...f, nomeBi: bi(f.nome) })),
};
fs.writeFileSync(process.argv[2] || 'met-ed.json', JSON.stringify(out, null, 1));
console.log('linhas', linhas.length, 'catálogo', catalogo.length, 'total com', r.com.total, 'sem', r.sem.total);
void padraoParam;
