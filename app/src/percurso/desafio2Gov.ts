// v018.1 (governança, desafio 2 "Soberania"): opções conforme a figura "Governing AI in Education". Cada opção soma uma
// equipe de referência (quando há trabalho de pessoas) e partes com fonte: consumo de nuvem pela tabela pública de preços,
// as calculadoras oficiais do X-Road, o modelo da nuvem soberana e valores informados. Toda parte é CapEx (ativos e
// implantação de sistemas, plataformas, integrações e migração) ou OpEx (operação, consumo e serviços), pela regra contábil.
import type { Estado14 } from '../store/tipos';
import { t } from './textos';
import { LOC, getTabelaMoedas } from '../domain';
import { calcularTime, custoMensalPerfil, chaveOpcao, type CustoSalvo, type FaseCalc, type LinhaOpcao, type ParteConta, type FonteConta, type EntradaD2 } from './custosV017';
import { EQUIPES_GOV } from './equipesGov';
import { paisSoberana, soberanaNacional, COEF_SOBERANA, FONTES_SOBERANA, NOME_GRUPO_FMI } from './nuvemSoberana';

export type Classe = 'capex' | 'opex';
/** Preços de referência de nuvem (US$), tabela pública da Azure (consulta de 10/11/2026); máquina = mediana de 68 regiões. */
export const PRECOS_NUVEM = { vmHora: 0.115, horasMes: 730, armazenamentoGB: 0.0208, frioGB: 0.0152, arquivoGB: 0.00099, saidaGB: 0.087 };
/** Calculadoras oficiais de custo do X-Road (NIIS, 2021; valores em euros). */
export const XROAD = { centralDias: 655, centralInfraAno: 62160, membroDias: 44, membroInfraAno: 6480, membroPessoas: 0.1, diasAno: 260 };
export const FONTES_D2: Record<string, FonteConta> = {
  azure: { titulo: 'Microsoft Azure: tabela pública de preços (Retail Prices API), consulta de 10/11/2026', url: 'https://prices.azure.com/api/retail/prices' },
  google: { titulo: 'Google Cloud Storage: preços', url: 'https://cloud.google.com/storage/pricing' },
  xroad: { titulo: 'NIIS: calculadoras de custo do X-Road (2021)', url: 'https://x-road.global/xroad-cost-calculators' },
  cisa: { titulo: 'CISA: Back Up Government Data (regra 3-2-1)', url: 'https://www.cisa.gov/audiences/state-local-tribal-and-territorial-government/secure-us-sltt/back-government-data' },
  ckan: { titulo: 'CKAN: catálogo de dados de código aberto', url: 'https://ckan.org/' },
  keycloak: { titulo: 'Keycloak: gestão de identidade e acesso de código aberto', url: 'https://www.keycloak.org/' },
  dataAct: { titulo: 'União Europeia, Regulamento (UE) 2023/2854 (Data Act), art. 29: fim das tarifas de troca de fornecedor', url: 'https://eur-lex.europa.eu/eli/reg/2023/2854/oj' },
};

/** Opções do desafio 2 com conta própria e a classe (CapEx ou OpEx) da equipe de referência de cada uma. */
export const OPCOES_D2: Record<string, { equipe: Classe | null }> = {
  'Inventário e curadoria de dados': { equipe: 'opex' },
  'Controles de acesso e regras de retenção': { equipe: 'opex' },
  'Interoperabilidade e portabilidade de dados': { equipe: 'opex' },
  'Infraestrutura pública de dados compartilhada': { equipe: 'opex' },
  'Nuvem soberana': { equipe: 'capex' },
  'Hospedagem segura e armazenamento de dados': { equipe: null },
  'Infraestrutura de computação e rede': { equipe: null },
  'Backup e continuidade do serviço': { equipe: 'opex' },
  'Adoção e manutenção de código aberto': { equipe: 'opex' },
  'Transferência de tecnologia': { equipe: 'opex' },
  'Customização local': { equipe: 'capex' },
  'Migração e saída': { equipe: 'capex' },
};
export const ehOpcaoD2 = (rotulo: string) => Object.hasOwn(OPCOES_D2, rotulo);
/** Classe das demais opções: tudo é OpEx (trabalho de normas, diretrizes, supervisão, pessoal, formação). */
export const classeDaOpcao = (rotulo: string): Classe => OPCOES_D2[rotulo]?.equipe === 'capex' ? 'capex' : 'opex';

interface Parte { id: string; rotulo: string; classe: Classe; valor: number | null; texto: string; fontes: FonteConta[]; estimado: boolean; pessoas?: boolean }
const centavos = (v: number) => Math.round(v * 100) / 100;
const pos = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
const naoNeg = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;

/** Custo da opção do desafio 2: equipe (quando há) + partes, separado em CapEx e OpEx. */
export function calcularD2(s: Pick<Estado14, 'ctx'>, rotulo: string, salvo: CustoSalvo, fases: FaseCalc[], taxa: number | null,
  fmt: (v: number) => string, num: (v: number) => string, moeda?: string): LinhaOpcao {
  const H = fases.reduce((n, x) => n + x.meses, 0), q = salvo.q || {}, esc = salvo.escolha || {};
  const iso = (s as any).caso?.pais as string | undefined;
  const usd = (v: number) => taxa === null ? null : v * taxa;
  const taxaEUR = (getTabelaMoedas() as any)?.taxas?.EUR as number | undefined;
  const eur = (v: number) => taxa === null || !pos(taxaEUR) ? null : v / taxaEUR * taxa;
  const n2 = (v: number) => new Intl.NumberFormat(String(LOC()), { maximumFractionDigits: 2 }).format(v);
  const usdF = (v: number) => new Intl.NumberFormat(String(LOC()), { style: 'currency', currency: 'USD', maximumFractionDigits: 5 }).format(v);
  const partes: Parte[] = [], entradas: EntradaD2[] = [], falta: string[] = [];
  const vmMes = PRECOS_NUVEM.vmHora * PRECOS_NUVEM.horasMes;
  const especialista = () => custoMensalPerfil(s, 2, true, taxa, moeda, num);
  const numero = (id: string, r: string, opts: Partial<EntradaD2> = {}) => { entradas.push({ id, rotulo: t(r), tipo: 'numero', valor: naoNeg(q[id]) ? q[id] : '', decimais: true, ...opts }); return naoNeg(q[id]) ? q[id] : null; };
  const add = (p: Parte) => { if (p.valor !== null) p.valor = centavos(p.valor); partes.push(p); };
  const maquinas = (id: string, r: string, n: number, classe: Classe, extra: FonteConta[] = []) => add({ id, rotulo: t(r), classe, estimado: true,
    valor: usd(n * vmMes * H), texto: t('{n} máquinas virtuais (2 núcleos, 8 GB) × {p} por hora × 730 horas × {h} meses', { n: n2(n), p: usdF(PRECOS_NUVEM.vmHora), h: n2(H) }), fontes: [FONTES_D2.azure, ...extra] });
  const anual = (id: string, r: string, classe: Classe, valorAno: number | null) => { if (valorAno !== null && valorAno > 0) add({ id, rotulo: t(r), classe, estimado: false, valor: valorAno * H / 12, texto: t('{v} por ano, informado por você, × {h} meses', { v: fmt(valorAno), h: n2(H) }), fontes: [] }); };
  const total1 = (id: string, r: string, classe: Classe, valor: number | null) => { if (valor !== null && valor > 0) add({ id, rotulo: t(r), classe, estimado: false, valor, texto: t('valor total informado por você'), fontes: [] }); };
  const diaria = (c: { valor: number }) => c.valor * 12 / XROAD.diasAno;

  // a equipe de referência entra quando a opção tem equipe (na nuvem soberana, só no caminho "contratar")
  let usarEquipe = !!EQUIPES_GOV[rotulo];
  switch (rotulo) {
    case 'Inventário e curadoria de dados': {
      const n = numero('curadores', 'Curadores de dados (pessoas, durante todo o plano)', { sugestao: '2', dica: t('Vazio = 2 pessoas (estimativa de referência, grau C).') });
      const c = especialista(), pessoas = n ?? 2;
      add({ id: 'curadoria', rotulo: t('Curadoria contínua dos dados'), classe: 'opex', estimado: n === null || !!c, pessoas: true,
        valor: c ? pessoas * c.valor * H : null, texto: t('{n} pessoas × {c} por mês × {h} meses', { n: n2(pessoas), c: c ? fmt(c.valor) : '—', h: n2(H) }) + (c ? ' · ' + c.texto : ''), fontes: c ? c.fontes : [] });
      maquinas('catalogo', 'Catálogo de dados (código aberto, CKAN)', 1, 'opex', [FONTES_D2.ckan]);
      break;
    }
    case 'Controles de acesso e regras de retenção': {
      maquinas('acesso', 'Sistema de controle de acesso (código aberto, Keycloak)', 2, 'opex', [FONTES_D2.keycloak]);
      const tb = numero('arquivoTB', 'Registros guardados para retenção (TB)', { dica: t('Opcional. Guardados em armazenamento de arquivo.') });
      if (tb !== null && tb > 0) add({ id: 'arquivo', rotulo: t('Arquivo dos registros'), classe: 'opex', estimado: true, valor: usd(tb * 1024 * PRECOS_NUVEM.arquivoGB * H),
        texto: t('{v} TB × 1.024 GB × {p} por GB por mês × {h} meses', { v: n2(tb), p: usdF(PRECOS_NUVEM.arquivoGB), h: n2(H) }), fontes: [FONTES_D2.azure] });
      anual('licenca', 'Licença comercial de controle de acesso', 'opex', numero('licencaAno', 'Licença comercial, se houver (valor por ano)', { dica: t('Opcional. Substitui o sistema de código aberto quando o órgão já usa uma solução paga.') }));
      break;
    }
    case 'Interoperabilidade e portabilidade de dados': {
      const n = numero('sistemas', 'Sistemas a integrar', { obrigatoria: true });
      const c = especialista();
      if (n === null) falta.push(t('sistemas a integrar'));
      else {
        add({ id: 'integracao', rotulo: t('Integração de cada sistema'), classe: 'capex', estimado: true, pessoas: true, valor: c ? n * XROAD.membroDias * diaria(c) : null,
          texto: t('{n} sistemas × {d} dias de trabalho × diária de {v} (custo mensal × 12 ÷ 260 dias)', { n: n2(n), d: XROAD.membroDias, v: c ? fmt(diaria(c)) : '—' }) + (c ? ' · ' + c.texto : ''), fontes: [FONTES_D2.xroad, ...(c ? c.fontes : [])] });
        add({ id: 'servidores', rotulo: t('Servidores e certificados de cada sistema'), classe: 'opex', estimado: true, valor: (() => { const v = eur(n * XROAD.membroInfraAno * H / 12); return v; })(),
          texto: t('{n} sistemas × € {v} por ano × {h} meses', { n: n2(n), v: n2(XROAD.membroInfraAno), h: n2(H) }), fontes: [FONTES_D2.xroad] });
        add({ id: 'manutencao', rotulo: t('Manutenção das integrações'), classe: 'opex', estimado: true, pessoas: true, valor: c ? n * XROAD.membroPessoas * c.valor * H : null,
          texto: t('{n} sistemas × {p} pessoa × {c} por mês × {h} meses', { n: n2(n), p: n2(XROAD.membroPessoas), c: c ? fmt(c.valor) : '—', h: n2(H) }), fontes: [FONTES_D2.xroad] });
      }
      break;
    }
    case 'Infraestrutura pública de dados compartilhada': {
      const c = especialista();
      add({ id: 'implantacao', rotulo: t('Implantação da plataforma de troca de dados'), classe: 'capex', estimado: true, pessoas: true, valor: c ? XROAD.centralDias * diaria(c) : null,
        texto: t('{d} dias de trabalho × diária de {v} (custo mensal × 12 ÷ 260 dias)', { d: XROAD.centralDias, v: c ? fmt(diaria(c)) : '—' }) + (c ? ' · ' + c.texto : ''), fontes: [FONTES_D2.xroad, ...(c ? c.fontes : [])] });
      add({ id: 'infra', rotulo: t('Servidores, módulos de segurança e certificados'), classe: 'opex', estimado: true, valor: eur(XROAD.centralInfraAno * H / 12),
        texto: t('€ {v} por ano × {h} meses', { v: n2(XROAD.centralInfraAno), h: n2(H) }), fontes: [FONTES_D2.xroad] });
      break;
    }
    case 'Nuvem soberana': {
      const modelo = esc.modelo === 'construir' || esc.modelo === 'contratar' ? esc.modelo : '';
      entradas.push({ id: 'modelo', rotulo: t('Como o governo terá a nuvem soberana?'), tipo: 'escolha', valor: modelo, obrigatoria: true,
        opcoes: [['construir', t('Construir a própria infraestrutura')], ['contratar', t('Contratar um provedor de nuvem soberana')]] });
      const pInf = numero('populacao', 'População do país (milhares)', {});
      const p = paisSoberana(iso, pInf);
      if (p.populacaoMil !== null && pInf === null) entradas[entradas.length - 1].sugestao = n2(p.populacaoMil);
      const parc = numero('parcela', 'Parcela da educação (%)', { sugestao: n2(p.edu), dica: t('Vazio = gasto com educação em % do gasto do governo ({v}%, Banco Mundial).', { v: n2(p.edu) }) });
      const parcela = (parc ?? p.edu) / 100;
      usarEquipe = modelo === 'contratar';
      if (!modelo) { falta.push(t('construir ou contratar')); break; }
      const nac = soberanaNacional(p), c = especialista();
      if (!nac) { falta.push(t('população do país')); break; }
      const base = t('{pais}: {g}; {n} × 100 mil habitantes; CGSI {cgsi}{est}, m = {m}', { pais: iso || '—', g: t(NOME_GRUPO_FMI[p.grupo]), n: n2(p.N as number), cgsi: n2(p.cgsi), est: p.cgsiEstimado ? ' (' + t('mediana do grupo') + ')' : '', m: n2(p.m) });
      const k = COEF_SOBERANA.porCemMil[p.grupo];
      const capexNac = usd(nac.capexUSD), fontesBase = [FONTES_SOBERANA.gtmi, FONTES_SOBERANA.fmi, FONTES_SOBERANA.edu];
      const usd0 = (v: number) => new Intl.NumberFormat(String(LOC()), { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
      const txtCapex = t('investimento nacional = {F} + {k} × {n} × {m} = {v}', { F: usd0(COEF_SOBERANA.piso), k: usd0(k), n: n2(p.N as number), m: n2(p.m), v: usd0(nac.capexUSD) });
      const txtParc = t('× parcela da educação de {p}%', { p: n2(parcela * 100) });
      const equipeMes = c ? nac.pessoas * c.valor : null;
      if (modelo === 'construir') {
        add({ id: 'investimento', rotulo: t('Investimento na infraestrutura soberana'), classe: 'capex', estimado: true, valor: capexNac === null ? null : parcela * capexNac,
          texto: base + ' · ' + txtCapex + ' ' + txtParc, fontes: fontesBase });
        add({ id: 'instalacoes', rotulo: t('Operação e manutenção das instalações'), classe: 'opex', estimado: true, valor: capexNac === null ? null : parcela * COEF_SOBERANA.operacao * capexNac * H / 12,
          texto: t('{r}% do investimento por ano × {h} meses', { r: n2(COEF_SOBERANA.operacao * 100), h: n2(H) }) + ' ' + txtParc, fontes: [FONTES_SOBERANA.kpmg] });
        add({ id: 'operacao', rotulo: t('Equipe de operação da plataforma'), classe: 'opex', estimado: true, pessoas: true, valor: equipeMes === null ? null : parcela * equipeMes * H,
          texto: t('({a} + {b} × {n} × {m}) = {p} pessoas × {c} por mês × {h} meses', { a: COEF_SOBERANA.equipeMinima, b: n2(COEF_SOBERANA.equipePorCemMil), n: n2(p.N as number), m: n2(p.m), p: n2(nac.pessoas), c: c ? fmt(c.valor) : '—', h: n2(H) }) + ' ' + txtParc + (c ? ' · ' + c.texto : ''),
          fontes: [FONTES_SOBERANA.odc, FONTES_SOBERANA.kpmg, ...(c ? c.fontes : [])] });
      } else {
        const anoConstruir = capexNac === null || equipeMes === null ? null : capexNac / COEF_SOBERANA.vidaUtil + COEF_SOBERANA.operacao * capexNac + 12 * equipeMes;
        add({ id: 'servico', rotulo: t('Serviço de nuvem soberana contratado'), classe: 'opex', estimado: true,
          valor: anoConstruir === null ? null : parcela * anoConstruir * (1 + COEF_SOBERANA.premio) * H / 12,
          texto: base + ' · ' + t('custo anual equivalente ao de construir (investimento ÷ {vida} anos + operação das instalações + equipe) × (1 + {pr}% de prêmio da nuvem soberana) × {h} meses', { vida: COEF_SOBERANA.vidaUtil, pr: n2(COEF_SOBERANA.premio * 100), h: n2(H) }) + ' ' + txtParc + ' · ' + txtCapex,
          fontes: [...fontesBase, FONTES_SOBERANA.bcg, FONTES_SOBERANA.kpmg, FONTES_SOBERANA.odc] });
      }
      break;
    }
    case 'Hospedagem segura e armazenamento de dados': {
      const v = numero('volumeTB', 'Dados guardados (TB)', { obrigatoria: true }), e = numero('saidaTB', 'Dados enviados para fora da nuvem (TB por mês)', { dica: t('Opcional.') });
      if (v === null) falta.push(t('dados guardados (TB)'));
      else add({ id: 'armazenamento', rotulo: t('Armazenamento'), classe: 'opex', estimado: true, valor: usd(v * 1024 * PRECOS_NUVEM.armazenamentoGB * H),
        texto: t('{v} TB × 1.024 GB × {p} por GB por mês × {h} meses', { v: n2(v), p: usdF(PRECOS_NUVEM.armazenamentoGB), h: n2(H) }), fontes: [FONTES_D2.azure, FONTES_D2.google] });
      if (e !== null && e > 0) add({ id: 'saida', rotulo: t('Envio de dados para fora da nuvem'), classe: 'opex', estimado: true, valor: usd(e * 1024 * PRECOS_NUVEM.saidaGB * H),
        texto: t('{v} TB por mês × 1.024 GB × {p} por GB × {h} meses', { v: n2(e), p: usdF(PRECOS_NUVEM.saidaGB), h: n2(H) }), fontes: [FONTES_D2.azure] });
      break;
    }
    case 'Infraestrutura de computação e rede': {
      const n = numero('maquinas', 'Máquinas virtuais (2 núcleos, 8 GB)', { obrigatoria: true });
      if (n === null) falta.push(t('máquinas virtuais'));
      else maquinas('maquinas', 'Máquinas virtuais', n, 'opex');
      anual('rede', 'Links de rede', 'opex', numero('redeAno', 'Links de rede (valor por ano)', { dica: t('Opcional. O preço dos links varia muito de país para país.') }));
      total1('equipamentos', 'Equipamentos de rede próprios', 'capex', numero('equipamentos', 'Equipamentos de rede próprios (valor total)', { dica: t('Opcional.') }));
      break;
    }
    case 'Backup e continuidade do serviço': {
      const v = numero('volumeTB', 'Dados copiados (TB)', { obrigatoria: true });
      if (v === null) falta.push(t('dados copiados (TB)'));
      else add({ id: 'copias', rotulo: t('Cópias de segurança (regra 3-2-1)'), classe: 'opex', estimado: true, valor: usd(v * 1024 * (PRECOS_NUVEM.frioGB + PRECOS_NUVEM.arquivoGB) * H),
        texto: t('{v} TB × 1.024 GB × ({a} de uma cópia pouco acessada + {b} de uma cópia de arquivo) por GB por mês × {h} meses', { v: n2(v), a: usdF(PRECOS_NUVEM.frioGB), b: usdF(PRECOS_NUVEM.arquivoGB), h: n2(H) }), fontes: [FONTES_D2.cisa, FONTES_D2.azure] });
      anual('contingencia', 'Ambiente de contingência ligado', 'opex', numero('contingenciaAno', 'Ambiente de contingência ligado, se houver (valor por ano)', { dica: t('Opcional.') }));
      break;
    }
    case 'Adoção e manutenção de código aberto':
      anual('suporte', 'Contrato de suporte', 'opex', numero('suporteAno', 'Contrato de suporte, se houver (valor por ano)', { dica: t('Opcional.') }));
      break;
    case 'Transferência de tecnologia':
      total1('licenciamento', 'Licenciamento ou taxa de transferência', 'capex', numero('taxa', 'Licenciamento ou taxa de transferência (valor total)', { dica: t('Opcional.') }));
      break;
    case 'Migração e saída': {
      const v = numero('volumeTB', 'Dados a retirar do ambiente atual (TB)', { dica: t('Opcional.') });
      if (v !== null && v > 0) add({ id: 'retirada', rotulo: t('Retirada dos dados'), classe: 'capex', estimado: true, valor: usd(v * 1024 * PRECOS_NUVEM.saidaGB),
        texto: t('{v} TB × 1.024 GB × {p} por GB (na União Europeia, sem tarifa de troca a partir de 12/01/2027)', { v: n2(v), p: usdF(PRECOS_NUVEM.saidaGB) }), fontes: [FONTES_D2.azure, FONTES_D2.dataAct] });
      const m = numero('mesesParalelo', 'Meses com os dois sistemas funcionando', { dica: t('Opcional.') }), cm = numero('custoAtual', 'Custo mensal do sistema atual', { dica: t('Opcional.') });
      if (m !== null && cm !== null && m > 0 && cm > 0) add({ id: 'paralelo', rotulo: t('Operação paralela'), classe: 'opex', estimado: false, valor: m * cm,
        texto: t('{m} meses × {c} por mês, informado por você', { m: n2(m), c: fmt(cm) }), fontes: [] });
      break;
    }
  }

  const base = usarEquipe ? calcularTime(s, rotulo, salvo, fases, taxa, fmt, num, moeda) : null;
  const classeEq: Classe = OPCOES_D2[rotulo]?.equipe || 'opex';
  if (base) falta.unshift(...base.falta);
  if (partes.some(p => p.valor === null)) falta.push(t('câmbio ou salário de referência'));
  const somaPartes = (c?: Classe) => partes.filter(p => p.valor !== null && (!c || p.classe === c)).reduce((n, p) => n + (p.valor as number), 0);
  const ok = !falta.length;
  const totEq = base?.total ?? 0;
  const total = ok ? centavos(totEq + somaPartes()) : null;
  const capex = ok ? centavos((classeEq === 'capex' ? totEq : 0) + somaPartes('capex')) : null;
  const opex = ok && total !== null && capex !== null ? centavos(total - capex) : null;
  // trabalho de pessoas (equipe e partes de pessoal): base das viagens e do overhead
  const somaPessoas = (c?: Classe) => partes.filter(p => p.pessoas && p.valor !== null && (!c || p.classe === c)).reduce((n, p) => n + (p.valor as number), 0);
  const pessoas = ok ? centavos(totEq + somaPessoas()) : null, pessoasCapex = ok ? centavos((classeEq === 'capex' ? totEq : 0) + somaPessoas('capex')) : null;
  const porFase: Record<string, number> = {};
  if (total !== null) { let resto = total; fases.forEach((x, i) => { const v = i === fases.length - 1 ? centavos(resto) : centavos(total * x.meses / (H || 1)); porFase[x.id] = v; resto -= v; }); }
  const contaPartes: ParteConta[] = [...(base?.conta?.partes || [])];
  if (base?.total != null) contaPartes.unshift({ rotulo: t('Equipe de referência') + ' (' + (classeEq === 'capex' ? 'CapEx' : 'OpEx') + ')', valor: fmt(base.total), texto: base.conta?.formula || '', fontes: [] });
  for (const p of partes) contaPartes.push({ rotulo: p.rotulo + ' (' + (p.classe === 'capex' ? 'CapEx' : 'OpEx') + ')', valor: p.valor === null ? '—' : fmt(p.valor), texto: p.texto, fontes: p.fontes });
  const formula = total === null ? '' : [base?.total != null ? t('equipe') + ' ' + fmt(base.total) : '', ...partes.filter(p => p.valor !== null).map(p => p.rotulo.toLocaleLowerCase() + ' ' + fmt(p.valor as number))].filter(Boolean).join(' + ') + ' = ' + fmt(total)
    + (capex !== null && opex !== null ? ' (CapEx ' + fmt(capex) + '; OpEx ' + fmt(opex) + ')' : '');
  const estimado = (base ? base.status === 'referencia' : false) || partes.some(p => p.estimado);
  const status: LinhaOpcao['status'] = !ok ? 'falta' : estimado ? 'referencia' : 'informado';
  const existentes = base?.time ? base.time.filter(p => p.existente).reduce((n, p) => n + (p.custo || 0), 0) : 0;
  const valoresFase: Record<string, number | ''> = {}; for (const x of fases) valoresFase[x.id] = '';
  return {
    ...(base || {}), chave: chaveOpcao(rotulo), rotulo, tipo: base ? 'time' : 'comp', tipoPadrao: base ? 'time' : 'comp', fonte: null,
    qtd: base?.qtd ?? null, qtdSugerida: false, horas: base?.horas ?? null, unit: null, unitRef: null, unitDaReferencia: estimado, valoresFase,
    porFase, total, status, falta, capex, opex, pessoas, pessoasCapex, entradas, refPais: base?.refPais,
    desembolso: total === null ? null : centavos(total - existentes),
    conta: { formula, partes: contaPartes },
    memoria: total === null ? '' : formula,
  } as LinhaOpcao;
}
