// Aba 2 — Ferramentas e licenças: ferramentas do caso com preço e as respostas da ferramenta principal (CUS-21),
// a escolha da arquitetura (3.2.1, inalcançável no Essencial), os parâmetros da arquitetura com os rótulos da v13
// (CUS-03) e as comparações licença institucional × nominal e "a mesma função em outras arquiteturas" (CUS-20).
import { useCaso, casoEfetivoDe } from '../../store';
import { OPC, arquitetura, compLicenca, compArquiteturas, din, mil, pct, unidMil, LOC } from '../../domain';
import { Button, DataTable, OptionCard, OptionCardGroup, TextField, type DataColumn, type DataRow } from '../../ui';
import { CampoNumero } from '../../percurso/CampoNumero';
import { ControleCampo } from '../../percurso/Controles';
import { t } from '../../percurso/textos';
import { AnosCfg, Bloco, CampoCfg } from './Campos';
import type { Resultados } from './calc';
import type { BaseCfg } from './Premissas';

const nfInt = (x: number) => Math.round(+x || 0).toLocaleString(String(LOC()));
const FERRAMENTA_VAZIA = { nome: '', tarefas: [], tipoTec: '', pagamento: '', preco: '' };

export function AbaFerramentas({ res }: { res: Resultados | BaseCfg }) {
  return (
    <>
      <FerramentasCaso />
      <Arquitetura res={res} />
      <ParametrosArq res={res} />
      <Licenca res={res} />
      <OutrasArquiteturas res={res} />
    </>
  );
}

// ----------------------------------------------------------- ferramentas do caso (CUS-21)
function FerramentasCaso() {
  const s = useCaso();
  const lista: any[] = Array.isArray(s.caso.ferramentas) ? s.caso.ferramentas : [];
  const gravar = (nova: any[]) => s.refinar('ferramentas', nova);
  const mudar = (i: number, campo: string, v: any) => gravar(lista.map((f, j) => (j === i ? { ...f, [campo]: v } : f)));
  return (
    <Bloco id="ferramentas" titulo={t('Ferramentas do caso')}
      nota={t('A primeira da lista é a ferramenta principal. O preço é opcional, em US$ por usuário por mês; sem ele, a estimativa usa o preço de referência do exemplo do guia.')}>
      <div className="rf-pilha">
        <ControleCampo e={s} campo="nFerramentas" />
        <ControleCampo e={s} campo="conheceFerramentas" />
      </div>
      {lista.map((f, i) => (
        <div className="rf-linha" key={i} id={'rf-ferramentas.' + i}>
          <div className="rf-campo rf-campo--texto">
            <TextField label={i === 0 ? t('Ferramenta principal') : t('Ferramenta {n}', { n: i + 1 })} value={String(f.nome ?? '')} onChange={(v) => mudar(i, 'nome', v)} />
          </div>
          <div className="rf-campo">
            <CampoNumero label={t('Preço (US$ por usuário por mês)')} value={f.preco === '' || f.preco == null ? '' : +f.preco} decimais size={9}
              onChange={(v) => mudar(i, 'preco', v === '' ? '' : v)} />
          </div>
          <div className="rf-linha-acao">
            <Button variant="secondary" size="sm" aria-label={t('Remover: {nome}', { nome: String(f.nome || t('Ferramenta {n}', { n: i + 1 })) })}
              onClick={() => gravar(lista.filter((_, j) => j !== i))}>{t('Remover')}</Button>
          </div>
        </div>
      ))}
      <div className="rf-botoes"><Button variant="secondary" onClick={() => gravar([...lista, { ...FERRAMENTA_VAZIA }])}>{t('Adicionar ferramenta')}</Button></div>
      <div className="rf-pilha">
        <ControleCampo e={s} campo="pagamento" />
        <ControleCampo e={s} campo="licenca" />
        <ControleCampo e={s} campo="adaptacao" />
      </div>
    </Bloco>
  );
}

// ----------------------------------------------------------- arquitetura (3.2.1)
function Arquitetura({ res }: { res: BaseCfg }) {
  const s = useCaso();
  const ce: any = casoEfetivoDe(s);
  const opc = ((OPC as any).arquitetura || []) as [string, string, string?][];
  const presumida = opc.find((o) => o[0] === ce.arquitetura);
  const valor = String(s.caso.arquitetura || '');
  const ativa = arquitetura(res.cfg);
  return (
    <Bloco id="arquitetura" titulo={t('Qual arquitetura a ferramenta principal vai usar?')}
      nota={t('Arquitetura é a forma como a ferramenta funciona por dentro e se liga aos sistemas da rede. Mude só se souber; senão, use a arquitetura presumida.')}>
      <OptionCardGroup label={t('Qual arquitetura a ferramenta principal vai usar?')}>
        {opc.filter((o) => ['saas', 'api', 'ow'].includes(o[0])).map((o) => (
          <OptionCard key={o[0]} name="rf-arquitetura" value={o[0]} checked={valor === o[0]} onChange={(v) => s.refinar('arquitetura', v)}
            label={<span className="rf-opcao"><span>{t(o[1])}</span>{o[2] ? <span className="rf-opcao-desc">{t(o[2])}</span> : null}</span>} />
        ))}
        <OptionCard name="rf-arquitetura" value="nao_sei" checked={valor === 'nao_sei' || valor === ''} onChange={(v) => s.refinar('arquitetura', v)}
          label={<span className="rf-opcao"><span>{t('Ainda não sei')}{presumida && !ce.__arqEscolhida ? <> ({t('usar a presumida:')} {t(presumida[1])})</> : null}</span>
            <span className="rf-opcao-desc">{t('A ferramenta deduz a arquitetura das respostas do passo 2.3 para estimar o custo.')}</span></span>} />
      </OptionCardGroup>
      {s.custo.base !== 'caso' ? <p className="rf-nota">{t('A base de premissas é um exemplo do guia: a arquitetura do cálculo é a do exemplo ({arq}).', { arq: ativa.toUpperCase() })}</p> : null}
    </Bloco>
  );
}

// ----------------------------------------------------------- parâmetros por arquitetura (CUS-03)
function ParametrosArq({ res }: { res: BaseCfg }) {
  const { cfg, H } = res;
  const arq = arquitetura(cfg);
  if (arq === 'saas' && cfg.saas) {
    const sa = cfg.saas;
    return (
      <Bloco id="saas" titulo={t('Licenciamento SaaS')}>
        <div className="rf-grade">
          <CampoCfg caminho="saas.preco" rotulo={t('Preço por licença por mês (US$)')} valor={sa.preco} />
          <CampoCfg caminho="saas.reajuste" rotulo={t('Reajuste contratual anual')} valor={sa.reajuste} percentual dica={t('Nominal, a partir do Ano 2')} />
          <CampoCfg caminho="saas.precoNominal" rotulo={t('Preço da licença nominal (US$/mês)')} valor={sa.precoNominal} />
          <CampoCfg caminho="saas.fatorNominal" rotulo={t('Licenças nominais por usuário ativo')} valor={sa.fatorNominal} />
        </div>
        <div className="rf-pilha">
          <AnosCfg caminho="saas.qtd" rotulo={t('Licenças contratadas')} valores={sa.qtd} H={H} decimais={false} />
          <AnosCfg caminho="saas.mesesCobr" rotulo={t('Meses cobrados')} valores={sa.mesesCobr} H={H} />
          <AnosCfg caminho="saas.fatorPreco" rotulo={t('Fração do preço cobrada')} valores={sa.fatorPreco} H={H}
            dica={t('0 = cedido sem custo (o valor de mercado entra na conta econômica como insumo doado)')} />
        </div>
      </Bloco>
    );
  }
  if (arq === 'api' && cfg.api) {
    const a = cfg.api, r = cfg.rag || {};
    return (
      <Bloco id="api" titulo={t('Consumo de modelo e base de conhecimento (RAG)')}>
        <div className="rf-grade">
          <CampoCfg caminho="api.k" rotulo={t('Chamadas ao modelo por interação (k)')} valor={a.k} />
          <CampoCfg caminho="api.Tin" rotulo={t('Tokens de entrada por chamada')} valor={a.Tin} />
          <CampoCfg caminho="api.Tout" rotulo={t('Tokens de saída por chamada')} valor={a.Tout} />
          <CampoCfg caminho="api.h" rotulo={t('Fração da entrada em cache')} valor={a.h} percentual />
          <CampoCfg caminho="api.Pin" rotulo={t('Preço de entrada (US$/milhão)')} valor={a.Pin} />
          <CampoCfg caminho="api.Pout" rotulo={t('Preço de saída (US$/milhão)')} valor={a.Pout} />
          <CampoCfg caminho="api.TinAux" rotulo={t('Chamada auxiliar: tokens de entrada')} valor={a.TinAux} />
          <CampoCfg caminho="api.PinAux" rotulo={t('Chamada auxiliar: preço de entrada')} valor={a.PinAux} />
          <CampoCfg caminho="api.PrerankMil" rotulo={t('Reranking (US$ por mil consultas)')} valor={a.PrerankMil} />
        </div>
        {cfg.rag ? (
          <div className="rf-grade" id="rf-rag">
            <CampoCfg caminho="rag.docs" rotulo={t('Documentos na base')} valor={r.docs} />
            <CampoCfg caminho="rag.tokDoc" rotulo={t('Tokens por documento')} valor={r.tokDoc} />
            <CampoCfg caminho="rag.docsNovos" rotulo={t('Documentos novos por ano')} valor={r.docsNovos} />
            <CampoCfg caminho="rag.reindexAno" rotulo={t('Reindexações completas por ano')} valor={r.reindexAno} />
            <CampoCfg caminho="rag.Pemb" rotulo={t('Preço de embeddings (US$/milhão)')} valor={r.Pemb} />
            <CampoCfg caminho="rag.paginas" rotulo={t('Páginas para OCR na implantação')} valor={r.paginas} />
          </div>
        ) : null}
      </Bloco>
    );
  }
  if (arq === 'ow' && cfg.ow) {
    const o = cfg.ow;
    return (
      <Bloco id="ow" titulo={t('Dimensionamento de GPU para pesos abertos')}>
        <div className="rf-grade">
          <CampoCfg caminho="ow.Tin" rotulo={t('Tokens de entrada por interação')} valor={o.Tin} />
          <CampoCfg caminho="ow.Tout" rotulo={t('Tokens de saída por interação')} valor={o.Tout} />
          <CampoCfg caminho="ow.fPico" rotulo={t('Fração do uso no pico')} valor={o.fPico} percentual />
          <CampoCfg caminho="ow.hPicoMes" rotulo={t('Horas de pico por mês ativo')} valor={+(+o.hPicoMes).toFixed(2)} />
          <CampoCfg caminho="ow.phi" rotulo={t('Fator de rajada no pico (φ)')} valor={o.phi} />
          <CampoCfg caminho="ow.theta" rotulo={t('Vazão por GPU (tokens/s)')} valor={o.theta} />
          <CampoCfg caminho="ow.u" rotulo={t('Utilização-alvo da GPU')} valor={o.u} percentual />
          <CampoCfg caminho="ow.red" rotulo={t('GPUs de redundância')} valor={o.red} decimais={false} />
          <CampoCfg caminho="ow.minFora" rotulo={t('GPUs mínimas fora do pico')} valor={o.minFora} decimais={false} />
          <CampoCfg caminho="ow.Pgpu" rotulo={t('Preço da hora de GPU (US$)')} valor={o.Pgpu} />
          <CampoCfg caminho="ow.nSeg" rotulo={t('Instâncias do classificador de segurança')} valor={o.nSeg} decimais={false} />
          <CampoCfg caminho="ow.Pseg" rotulo={t('Preço da hora da instância de segurança')} valor={o.Pseg} />
        </div>
      </Bloco>
    );
  }
  return null;
}

// ----------------------------------------------------------- licença institucional × nominal (CUS-20)
function Licenca({ res }: { res: BaseCfg }) {
  let cl: any = null;
  try { cl = compLicenca(res.cfg); } catch (e) { cl = null; }
  if (!cl) return null;
  const cols: DataColumn[] = ([{ key: 'n', label: t('Indicador') }] as DataColumn[]).concat(cl.rows.map((x: any) => ({ key: 'a' + x.t, label: t('Ano ' + x.t), numeric: true })));
  const linha = (key: string, rot: string, f: (x: any) => string): DataRow => {
    const cells: Record<string, any> = { n: rot };
    cl.rows.forEach((x: any) => { cells['a' + x.t] = f(x); });
    return { key, cells };
  };
  const rows = [
    linha('U', t('Usuários ativos'), (x) => nfInt(x.U)),
    linha('inst', t('Institucional: licenças por ano ({unid})', { unid: unidMil() }), (x) => mil(x.inst)),
    linha('instAtivo', t('Institucional: por usuário ativo por mês'), (x) => din(x.instAtivo, 2)),
    linha('nom', t('Nominal: licenças por ano ({unid})', { unid: unidMil() }), (x) => mil(x.nom)),
    linha('nomAtivo', t('Nominal: por usuário ativo por mês'), (x) => din(x.nomAtivo, 2)),
  ];
  return (
    <Bloco id="licenca" titulo={t('Licença institucional ou licenças nominais')}>
      <div className="rf-tabela"><DataTable columns={cols} rows={rows} caption={t('Licença institucional ou licenças nominais')} /></div>
      <p className="rf-destaque">{t('A licença institucional só compensa com adoção acima de {pct} dos elegíveis.', { pct: pct(cl.aEq) })}</p>
    </Bloco>
  );
}

// ----------------------------------------------------------- a mesma função em outras arquiteturas (CUS-20)
function OutrasArquiteturas({ res }: { res: BaseCfg }) {
  let ca: any = null;
  try { ca = compArquiteturas(res.cfg); } catch (e) { ca = null; }
  if (!ca) {
    return (
      <Bloco id="arquiteturas" titulo={t('A mesma função em outras arquiteturas')}>
        <p className="rf-nota">{t('A comparação com outras arquiteturas está disponível quando a solução usa modelo de pesos abertos (Exemplo C do guia).')}</p>
      </Bloco>
    );
  }
  const cols: DataColumn[] = [
    { key: 'n', label: t('Arquitetura') }, { key: 'comp', label: t('Computação ou consumo'), numeric: true }, { key: 'pes', label: t('Engenharia de operação'), numeric: true },
    { key: 'resto', label: t('Demais custos'), numeric: true }, { key: 'tot', label: t('Total'), numeric: true },
  ];
  const rows: DataRow[] = ca.rows.map((x: any, i: number) => ({ key: String(i), cells: { n: t(x.nome), comp: mil(x.comp), pes: mil(x.pes), resto: mil(ca.resto), tot: <b>{mil(x.tot)}</b> } }));
  return (
    <Bloco id="arquiteturas" titulo={t('A mesma função em outras arquiteturas (Ano 2, {unid})', { unid: unidMil() })}>
      <div className="rf-tabela"><DataTable columns={cols} rows={rows} caption={t('A mesma função em outras arquiteturas')} /></div>
    </Bloco>
  );
}
