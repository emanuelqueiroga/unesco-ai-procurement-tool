// Aba 1 — Premissas por ano (CUS-03 demanda, CUS-04 insumos, CUS-05 tempo e câmbio, CUS-25 conta econômica
// avançada) e os resultados que mudam a cada edição: árvore K1–K6 nas duas contas (CUS-12), visão orçamentária
// por exercício (CUS-13) e as contas de cada ano com abas Ano 0…H e Saída (CUS-19).
import { useState } from 'react';
import { useCaso, calcDe } from '../../store';
import { SAL, SAL_NOME, salario, arquitetura, din, mil, pct, unidMil, LOC } from '../../domain';
import { Button, DataTable, Segmented, type DataColumn, type DataRow } from '../../ui';
import { t } from '../../percurso/textos';
import { AnosCfg, Bloco, CampoCfg, Selecao, SelecaoFuncao, SelecaoSub, TextoCfg } from './Campos';
import { contasPorAno, linhasArvore, novaLinha, subDe, todosAbertos, type Resultados } from './calc';

const nfInt = (x: number) => Math.round(+x || 0).toLocaleString(String(LOC()));

/** o que as seções de entrada precisam: a cfg (com as opções completas) e o horizonte */
export interface BaseCfg { cfg: any; H: number }

/** só as premissas (também quando o cálculo falha, para a pessoa corrigir o campo) */
export function PremissasEntrada({ res }: { res: BaseCfg }) {
  return (
    <>
      <h2 className="rf-grupo-h">{t('Premissas')}</h2>
      <Demanda res={res} />
      <Tempo res={res} />
      <Insumos res={res} />
      <Avancado res={res} />
    </>
  );
}

export function AbaPremissas({ res }: { res: Resultados }) {
  return (
    <>
      <PremissasEntrada res={res} />
      <h2 className="rf-grupo-h">{t('Resultados')}</h2>
      <Arvore res={res} />
      <Orcamento res={res} />
      <Contas res={res} />
    </>
  );
}

// ----------------------------------------------------------- demanda (CUS-03)
function Demanda({ res }: { res: BaseCfg }) {
  const { cfg, H } = res;
  const d = cfg.demanda || {};
  const arq = arquitetura(cfg);
  return (
    <Bloco id="demanda" titulo={t('Premissas de demanda')}>
      <div className="rf-pilha">
        <AnosCfg caminho="demanda.E" rotulo={t('Pessoas elegíveis')} valores={d.E} H={H} decimais={false}
          dica={t('Ano 0 = participantes do teste (prova de conceito e/ou piloto); Ano 1 = primeira etapa da implantação. Além do último ano informado, o valor se repete.')} />
        <AnosCfg caminho="demanda.adocao" rotulo={t('Taxa de adoção (usuários ativos ÷ elegíveis)')} valores={d.adocao} H={H} percentual />
        <AnosCfg caminho="demanda.meses" rotulo={t('Meses de uso no ano')} valores={d.meses} H={H} />
        {arq !== 'saas' ? (
          <div className="rf-grade">
            <CampoCfg caminho="demanda.s" rotulo={t('Sessões por usuário ativo por mês (s)')} valor={d.s} />
            <CampoCfg caminho="demanda.i" rotulo={t('Interações por sessão (i)')} valor={d.i} />
          </div>
        ) : null}
      </div>
    </Bloco>
  );
}

// ----------------------------------------------------------- tempo, preços e câmbio (CUS-05)
function Tempo({ res }: { res: BaseCfg }) {
  const { cfg } = res;
  const o = cfg.opc, m = cfg.mult || {};
  const arq = arquitetura(cfg);
  return (
    <Bloco id="tempo" titulo={t('Tempo, preços e câmbio')}>
      <div className="rf-grade">
        <CampoCfg caminho="opc.H" rotulo={t('Horizonte de operação (anos)')} valor={o.H} decimais={false} dica={t('Anos de operação depois do Ano 0. Muda o número de colunas.')} />
        <CampoCfg caminho="opc.pi" rotulo={t('Inflação na moeda do orçamento')} valor={o.pi} percentual dica={t('Corrige itens locais nos preços correntes e deflaciona a conta econômica. Premissa ilustrativa: use a meta ou projeção oficial.')} />
        <CampoCfg caminho="opc.dep" rotulo={t('Variação anual do câmbio sobre itens em US$')} valor={o.dep} percentual negativo dica={t('Relevante quando o orçamento é em moeda local. 0 = câmbio estável.')} />
        <CampoCfg caminho="mult.fx" rotulo={t('Multiplicador cambial (choque)')} valor={m.fx ?? 1} dica={t('1,25 = depreciação de 25% sobre todos os itens em US$')} />
        <CampoCfg caminho="mult.pessoas" rotulo={t('Multiplicador do custo de pessoal')} valor={m.pessoas ?? 1} />
        {arq !== 'saas' ? <CampoCfg caminho="mult.preco" rotulo={t('Multiplicador de preço de modelo ou GPU')} valor={m.preco ?? 1} /> : null}
        <CampoCfg caminho="opc.contPct" rotulo={t('Reserva de contingência')} valor={o.contPct} percentual />
      </div>
      {cfg.adaptacao ? (
        <div id="rf-adaptacao" className="rf-sub">
          <h3 className="rf-sub-h">{t('Adaptação ao contexto')}</h3>
          <div className="rf-grade">
            <CampoCfg caminho="adaptacao.fK31" rotulo={t('Adaptação: multiplicador de K3.1')} valor={cfg.adaptacao.fK31 ?? 1}
              dica={t('Integração e desenvolvimento. 1 = nível de referência do exemplo do guia. Convenção ilustrativa da ferramenta.')} />
            <CampoCfg caminho="adaptacao.fK32" rotulo={t('Adaptação: multiplicador de K3.2')} valor={cfg.adaptacao.fK32 ?? 1}
              dica={t('Conteúdo e configuração iniciais. 1 = nível de referência do exemplo do guia. Convenção ilustrativa da ferramenta.')} />
          </div>
        </div>
      ) : null}
    </Bloco>
  );
}

// ----------------------------------------------------------- insumos (CUS-04)
function BotaoRemover({ caminho, i, rotulo }: { caminho: string; i: number; rotulo: string }) {
  const remover = useCaso((s) => s.removerLinhaCfg);
  return <Button variant="secondary" size="sm" onClick={() => remover(caminho, i)} aria-label={t('Remover: {nome}', { nome: rotulo })}>{t('Remover')}</Button>;
}

function Insumos({ res }: { res: BaseCfg }) {
  const { cfg, H } = res;
  const adicionar = useCaso((s) => s.adicionarLinhaCfg);
  const editarCfg = useCaso((s) => s.editarCfg);
  const fmt = cfg.formacaoTempo || {};
  const sa = cfg.saida || {};
  return (
    <Bloco id="insumos" titulo={t('Insumos editáveis: implantação, itens, pessoas e saída')}>
      {/* implantação e manutenção */}
      <div className="rf-sub" id="rf-implantacao">
        <h3 className="rf-sub-h">{t('Implantação e manutenção anual')}</h3>
        {(cfg.implantacao || []).length ? (cfg.implantacao as any[]).map((x, i) => (
          <div className="rf-linha" key={i} id={'rf-implantacao.' + i}>
            <TextoCfg caminho={`implantacao.${i}.nome`} rotulo={t('Implantação (Ano 0, despesa de capital)')} valor={x.nome} />
            <CampoCfg caminho={`implantacao.${i}.valor`} rotulo={t('Valor (US$)')} valor={x.valor} />
            <CampoCfg caminho={`implantacao.${i}.manutPct`} rotulo={t('Manutenção % a.a.')} valor={x.manutPct} percentual />
          </div>
        )) : <p className="rf-nota">{t('Sem implantação modelada.')}</p>}
      </div>

      {/* serviços mensais */}
      <div className="rf-sub" id="rf-mensais">
        <h3 className="rf-sub-h">{t('Serviços mensais em US$')}</h3>
        {(cfg.mensais || []).map((x: any, i: number) => (
          <div className="rf-linha" key={i} id={'rf-mensais.' + i}>
            <TextoCfg caminho={`mensais.${i}.nome`} rotulo={t('Serviço')} valor={x.nome} />
            <SelecaoSub caminho={`mensais.${i}.s`} valor={subDe(x, 'K2.5')} />
            <CampoCfg caminho={`mensais.${i}.valor`} rotulo={t('US$/mês')} valor={x.valor} />
            <CampoCfg caminho={`mensais.${i}.mesesY0`} rotulo={t('Meses no Ano 0')} valor={x.mesesY0} />
            <div className="rf-linha-acao"><BotaoRemover caminho="mensais" i={i} rotulo={String(x.nome || '')} /></div>
          </div>
        ))}
        <div className="rf-botoes"><Button variant="secondary" onClick={() => adicionar('mensais', novaLinha.mensal())}>{t('Adicionar serviço mensal')}</Button></div>
      </div>

      {/* itens por ano */}
      <div className="rf-sub" id="rf-itens">
        <h3 className="rf-sub-h">{t('Itens por ano (desembolso)')}</h3>
        {(cfg.itens || []).map((x: any, i: number) => (
          <div className="rf-cartao" key={i} id={'rf-itens.' + i}>
            <div className="rf-linha">
              <TextoCfg caminho={`itens.${i}.nome`} rotulo={t('Item')} valor={x.nome} />
              <SelecaoSub caminho={`itens.${i}.s`} valor={subDe(x, 'K4.1')} />
              <Selecao rotulo={t('Moeda')} valor={x.moeda === 'USD' ? 'USD' : 'LOC'} onChange={(v) => editarCfg(`itens.${i}.moeda`, v)}>
                <option value="LOC">{t('Local')}</option>
                <option value="USD">US$</option>
              </Selecao>
              <div className="rf-linha-acao rf-linha-acao--fim"><BotaoRemover caminho="itens" i={i} rotulo={String(x.nome || '')} /></div>
            </div>
            {x.aEstimar ? <span className="rf-etiqueta">{t('a estimar')}</span> : null}
            <AnosCfg caminho={`itens.${i}.v`} rotulo={t('Valor por ano (US$)')} valores={x.v} H={H} />
          </div>
        ))}
        <div className="rf-botoes">
          <Button variant="secondary" onClick={() => adicionar('itens', novaLinha.item(H))}>{t('Adicionar item')}</Button>
          <Button variant="secondary" onClick={() => adicionar('itens', novaLinha.base(H))}>{t('Adicionar custo de condições de base (K1)')}</Button>
        </div>
      </div>

      {/* pessoas */}
      <div className="rf-sub" id="rf-pessoas">
        <h3 className="rf-sub-h">{t('Pessoas (FTE por ano)')}</h3>
        <p className="rf-nota">{t('Capacidade interna é tempo de equipes existentes: tem custo econômico, mas não pede dotação nova. Desembolso novo é contratação ou serviço.')}</p>
        {(cfg.pessoas || []).map((pp: any, i: number) => (
          <div className="rf-cartao" key={i} id={'rf-pessoas.' + i}>
            <div className="rf-linha">
              <TextoCfg caminho={`pessoas.${i}.nome`} rotulo={t('Atividade')} valor={pp.nome} />
              <SelecaoSub caminho={`pessoas.${i}.s`} valor={subDe(pp, 'K4.1')} />
              <Selecao rotulo={t('Natureza')} valor={pp.nat === 'D' ? 'D' : 'C'} onChange={(v) => editarCfg(`pessoas.${i}.nat`, v)}>
                <option value="C">{t('Capacidade interna')}</option>
                <option value="D">{t('Desembolso novo')}</option>
              </Selecao>
              <div className="rf-linha-acao rf-linha-acao--fim"><BotaoRemover caminho="pessoas" i={i} rotulo={String(pp.nome || '')} /></div>
            </div>
            {(pp.partes || []).map((pt: any, j: number) => (
              <div className="rf-parte" key={j}>
                <SelecaoFuncao caminho={`pessoas.${i}.partes.${j}.0`} valor={String(pt[0])} />
                <AnosCfg caminho={`pessoas.${i}.partes.${j}.1`} rotulo={j === 0 ? t('FTE por ano') : t('FTE por ano (outra função)')} valores={pt[1]} H={H} />
              </div>
            ))}
          </div>
        ))}
        <div className="rf-botoes"><Button variant="secondary" onClick={() => adicionar('pessoas', novaLinha.pessoa(H))}>{t('Adicionar atividade')}</Button></div>
      </div>

      {/* salários */}
      <div className="rf-sub" id="rf-salarios">
        <h3 className="rf-sub-h">{t('Custo anual carregado por função (US$)')}</h3>
        <div className="rf-grade">
          {Object.keys(SAL).map((k) => <CampoCfg key={k} caminho={'salarios.' + k} rotulo={t((SAL_NOME as any)[k])} valor={salario(cfg, k)} />)}
        </div>
      </div>

      {/* formação */}
      <div className="rf-sub" id="rf-formacaoTempo">
        <h3 className="rf-sub-h">{t('Formação')}</h3>
        {fmt.ativo ? (
          <div className="rf-grade">
            <CampoCfg caminho="formacaoTempo.horas" rotulo={t('Horas de formação por pessoa')} valor={fmt.horas} />
            <CampoCfg caminho="formacaoTempo.custoHora" rotulo={t('Custo-hora de quem é formado (US$)')} valor={fmt.custoHora} />
            {fmt.modo === 'razao'
              ? <CampoCfg caminho="formacaoTempo.razao" rotulo={t('Estudantes por professor formado')} valor={fmt.razao} />
              : <CampoCfg caminho="formacaoTempo.rot" rotulo={t('Rotatividade anual')} valor={fmt.rot} percentual />}
          </div>
        ) : <p className="rf-nota">{t('Sem tempo de formação modelado.')}</p>}
      </div>

      {/* saída */}
      <div className="rf-sub" id="rf-saida">
        <h3 className="rf-sub-h">{t('Saída ao final do horizonte')}</h3>
        <div className="rf-grade">
          <CampoCfg caminho="saida.reconstrucaoPct" rotulo={t('Reconstrução (% da implantação)')} valor={sa.reconstrucaoPct || 0} percentual />
          <CampoCfg caminho="saida.mesesParalelo" rotulo={t('Meses de operação paralela')} valor={sa.mesesParalelo || 0} />
          <CampoCfg caminho="saida.horasRetreino" rotulo={t('Horas de retreinamento por usuário ativo')} valor={sa.horasRetreino || 0} />
        </div>
        <h4 className="rf-sub-h4">{t('Outros custos de saída')}</h4>
        {(sa.itens || []).map((x: any, i: number) => (
          <div className="rf-linha" key={i} id={'rf-saida.itens.' + i}>
            <TextoCfg caminho={`saida.itens.${i}.nome`} rotulo={t('Item de saída')} valor={x.nome} />
            <CampoCfg caminho={`saida.itens.${i}.valor`} rotulo="US$" valor={x.valor} />
            <div className="rf-linha-acao"><BotaoRemover caminho="saida.itens" i={i} rotulo={String(x.nome || '')} /></div>
          </div>
        ))}
        <div className="rf-botoes"><Button variant="secondary" onClick={() => adicionar('saida.itens', novaLinha.saida())}>{t('Adicionar custo de saída')}</Button></div>
      </div>
    </Bloco>
  );
}

// ----------------------------------------------------------- conta econômica (modo avançado, CUS-25)
function Avancado({ res }: { res: BaseCfg }) {
  const s = useCaso();
  const calc = calcDe(s.custo);
  if (!calc.avancado) return null;
  const o = res.cfg.opc;
  return (
    <Bloco id="avancado" titulo={t('Conta econômica (modo avançado)')}>
      <div className="rf-grade">
        <CampoCfg caminho="opc.r" rotulo={t('Taxa de desconto real')} valor={o.r} percentual dica={t('Use a taxa social oficial da jurisdição. 0 = sem desconto.')} />
        <CampoCfg caminho="opc.delta" rotulo={t('Tendência anual de preço de modelos e GPU')} valor={o.delta} percentual dica={t('Queda anual esperada. Use só na conta econômica e na sensibilidade, nunca para reduzir a dotação.')} />
        <CampoCfg caminho="opc.sigmaCap" rotulo={t('Preço-sombra da capacidade interna')} valor={o.sigmaCap} dica={t('1 = custo carregado de mercado; 0 = tempo sem uso alternativo')} />
        <CampoCfg caminho="opc.pSaida" rotulo={t('Probabilidade de saída ao fim do horizonte')} valor={o.pSaida} percentual />
        <CampoCfg caminho="opc.vidaUtil" rotulo={t('Vida útil da implantação (anos)')} valor={o.vidaUtil} dica={t('Usada no valor residual e no custo anual equivalente')} />
        <div className="rf-campo" id="rf-opc.fechamento">
          <Selecao rotulo={t('Fechamento do horizonte')} valor={o.fechamento === 'continuidade' ? 'continuidade' : 'saida'} onChange={(v) => s.editarCfg('opc.fechamento', v)}>
            <option value="saida">{t('Ciclo com saída (padrão)')}</option>
            <option value="continuidade">{t('Continuidade com valor residual')}</option>
          </Selecao>
          <p className="rf-dica">{t('Convenções exclusivas: usar as duas contaria o mesmo ativo duas vezes.')}</p>
        </div>
        <label className="rf-check" id="rf-opc.doados">
          <input type="checkbox" checked={!!o.doados} onChange={(e) => s.editarCfg('opc.doados', e.target.checked)} />
          <span>{t('Valorar insumos cedidos sem custo a preço de mercado')}</span>
        </label>
      </div>
    </Bloco>
  );
}

// ----------------------------------------------------------- árvore de custos (CUS-12)
function Arvore({ res }: { res: Resultados }) {
  const s = useCaso();
  const calc = calcDe(s.custo);
  const conta = calc.conta;
  const { linhas, total } = linhasArvore(res.av, res.ind, conta, calc.abertos);
  const T = res.T;
  const alternar = (id: string) => s.setCalc({ abertos: { ...calc.abertos, [id]: !calc.abertos[id] } });
  const cel = (v: number) => (Math.abs(v) > 0.5 ? mil(v) : '–');
  const cols: DataColumn[] = ([{ key: 'n', label: t('Componente, subcomponente e insumo') }] as DataColumn[])
    .concat(T.map((x) => ({ key: 'a' + x, label: t('Ano ' + x), numeric: true })))
    .concat([{ key: 'tot', label: t('Total'), numeric: true }, { key: 'pu', label: t('Por usuário-ano'), numeric: true }, { key: 'pc', label: '%', numeric: true }]);
  const rows: DataRow[] = linhas.map((l) => {
    const cells: Record<string, any> = {
      n: (
        <span className={'rf-arv rf-arv--' + l.nivel}>
          {l.expansivel ? (
            <button type="button" className="rf-arv-tg" aria-expanded={l.aberto} onClick={() => alternar(l.id)}>
              <span aria-hidden="true">{l.aberto ? '▾' : '▸'}</span>
              <span className="rf-sr">{l.aberto ? t('Fechar') : t('Abrir')}: </span>
              {l.nivel === 0 ? <b>{l.rotulo}</b> : l.rotulo}
            </button>
          ) : (
            <span className="rf-arv-folha">
              {l.rotulo}
              {(l.tags || []).map((g, i) => <span key={i} className="rf-etiqueta">{g}</span>)}
              {l.unidade ? <span className="rf-mudo"> · {t('unidade')}: {l.unidade}</span> : null}
            </span>
          )}
        </span>
      ),
      tot: l.nivel === 0 ? <b>{mil(l.total)}</b> : mil(l.total),
      pu: l.porUsuario == null ? '–' : din(l.porUsuario, 2),
      pc: l.pct == null ? '' : pct(l.pct),
    };
    T.forEach((x, i) => { cells['a' + x] = cel(l.serie[i]); });
    return { key: l.id, cells };
  });
  const totCells: Record<string, any> = {
    n: conta === 'fin' ? t('Desembolso total (sem reservas)') : t('Custo total do ciclo de vida'),
    tot: mil(total.total), pu: total.porUsuario == null ? '–' : din(total.porUsuario, 2), pc: '100%',
  };
  T.forEach((x, i) => { totCells['a' + x] = cel(total.serie[i]); });
  rows.push({ key: 'total', cells: totCells, total: true });
  return (
    <Bloco
      id="arvore"
      titulo={t('Árvore de custos ({unid})', { unid: unidMil() })}
      acoes={
        <Segmented
          label={t('Conta exibida na árvore')}
          value={conta}
          onChange={(v) => s.setCalc({ conta: v as 'eco' | 'fin' })}
          options={[{ value: 'eco', label: t('Econômica') }, { value: 'fin', label: t('Orçamentária') }]}
        />
      }
      nota={conta === 'fin'
        ? t('Conta orçamentária: preços correntes, só desembolso; a saída aparece no fim do horizonte e só entra no orçamento se for decidida.')
        : t('Conta econômica: preços constantes do Ano 0') + (res.r.opc.r ? ', ' + t('descontados à taxa real de {taxa}', { taxa: pct(res.r.opc.r, 1) }) : '') + '; ' + t('inclui capacidade interna e insumos cedidos.')}
    >
      <div className="rf-botoes">
        <Button variant="secondary" size="sm" onClick={() => s.setCalc({ abertos: todosAbertos() })}>{t('Abrir tudo')}</Button>
        <Button variant="secondary" size="sm" onClick={() => s.setCalc({ abertos: {} })}>{t('Fechar tudo')}</Button>
      </div>
      <div className="rf-tabela"><DataTable columns={cols} rows={rows} caption={t('Árvore de custos ({unid})', { unid: unidMil() })} /></div>
    </Bloco>
  );
}

// ----------------------------------------------------------- visão orçamentária por exercício (CUS-13)
function Orcamento({ res }: { res: Resultados }) {
  const { orc, T } = res;
  const soma = (v: number[]) => v.reduce((a, b) => a + b, 0);
  const cols: DataColumn[] = ([{ key: 'n', label: t('Componente') }] as DataColumn[])
    .concat(T.map((x) => ({ key: 'a' + x, label: t('Ano ' + x), numeric: true })))
    .concat([{ key: 'tot', label: t('Total'), numeric: true }]);
  const linha = (key: string, rot: string, v: number[], extra: Partial<DataRow> = {}): DataRow => {
    const cells: Record<string, any> = { n: rot, tot: mil(soma(v)) };
    T.forEach((x, i) => { cells['a' + x] = v[i] > 0.5 ? mil(v[i]) : '–'; });
    return { key, cells, ...extra };
  };
  const rows: DataRow[] = [
    linha('fixo', t('Contratos e serviços de valor fixo'), orc.fixo),
    linha('var', t('Consumo variável (cenário esperado)'), orc.var),
    linha('reserva', t('Reserva para adoção acima do esperado'), orc.reserva),
    linha('cont', t('Reserva de contingência ({pct})', { pct: pct(orc.contPct) }), orc.cont),
    linha('dot', t('Dotação a solicitar'), orc.dot, { total: true }),
    linha('capital', t('da qual despesa de capital (implantação)'), orc.capital),
    linha('corrente', t('da qual despesa corrente'), orc.corrente),
    linha('cap', t('Capacidade interna mobilizada (declarar, não solicitar)'), orc.cap),
  ];
  if (orc.doado.some((x: number) => x > 0)) rows.push(linha('doado', t('Insumos cedidos sem custo, a preço de mercado (registrar)'), orc.doado));
  rows.push(linha('saida', t('Desembolso estimado de saída (orçar se a saída for decidida)'), T.map((_, i) => (i === T.length - 1 ? orc.saida : 0))));
  return (
    <Bloco id="orcamento" titulo={t('Visão orçamentária por exercício ({unid}, preços correntes)', { unid: unidMil() })}
      nota={t('A classificação entre despesa de capital e corrente é uma sugestão: confirme com a regra orçamentária da sua jurisdição.')}>
      <div className="rf-tabela"><DataTable columns={cols} rows={rows} caption={t('Visão orçamentária por exercício')} /></div>
    </Bloco>
  );
}

// ----------------------------------------------------------- as contas de cada ano (CUS-19)
function Contas({ res }: { res: Resultados }) {
  const [aba, setAba] = useState('1');
  const [outros, setOutros] = useState(false);
  const cx = contasPorAno(res.cfg);
  if (!cx) return null;
  const atual = cx.anos.find((a: any) => String(a.id) === aba) || cx.anos[Math.min(1, cx.anos.length - 1)];
  const linhas: any[] = atual.linhas || [];
  return (
    <Bloco id="contas" titulo={t('As contas de cada ano')} nota={cx.formula.texto}>
      <p className="rf-formula">{cx.formula.numeros}</p>
      {cx.formula.usoTexto ? <p className="rf-nota">{cx.formula.usoTexto}</p> : null}
      <div className="rf-abas-ano" role="group" aria-label={t('Ano das contas')}>
        {cx.abas.map((a) => (
          <button key={a.id} type="button" className="rf-aba-ano" aria-pressed={String(atual.id) === a.id} onClick={() => { setAba(a.id); setOutros(false); }}>
            {a.rotulo}
          </button>
        ))}
      </div>
      <h3 className="rf-sub-h">{atual.rotulo} · {atual.sub}</h3>
      {atual.continuidade ? <p className="rf-nota">{t('Continuidade com valor residual: a saída não entra no custo.')}</p> : null}
      {atual.cobertura != null && atual.outros ? <p className="rf-nota">{t('As linhas abaixo somam {pct} do custo do ano; as demais estão em "Outros itens".', { pct: pct(atual.cobertura) })}</p> : null}
      <ul className="rf-contas">
        {linhas.map((x: any, i: number) => (
          <li key={i} className="rf-conta">
            <span className="rf-conta-nome">{x.nome} <span className="rf-etiqueta">{x.tipoTxt}</span></span>
            <span className="rf-conta-calc">{x.conta}</span>
            <span className="rf-conta-v">{din(x.mostrado, 0)}</span>
          </li>
        ))}
        {atual.outros ? (
          <li className="rf-conta rf-conta--outros">
            <span className="rf-conta-nome">
              <button type="button" className="rf-arv-tg" aria-expanded={outros} onClick={() => setOutros(!outros)}>
                <span aria-hidden="true">{outros ? '▾' : '▸'}</span> {atual.outros.rotulo}
              </button>
            </span>
            <span className="rf-conta-calc" />
            <span className="rf-conta-v">{din(atual.outros.mostrado, 0)}</span>
          </li>
        ) : null}
        {atual.outros && outros ? atual.outros.itens.map((x: any, i: number) => (
          <li key={'o' + i} className="rf-conta rf-conta--sub">
            <span className="rf-conta-nome">{x.nome}</span>
            <span className="rf-conta-calc">{x.conta}</span>
            <span className="rf-conta-v">{din(x.mostrado, 0)}</span>
          </li>
        )) : null}
        <li className="rf-conta rf-conta--soma">
          <span className="rf-conta-nome">{t('Soma')}</span>
          <span className="rf-conta-calc">
            {atual.id === 'saida' && atual.pSaida != null && atual.pSaida !== 1 ? t('× probabilidade de saída {p}', { p: pct(atual.pSaida) }) : ''}
            {Math.abs((atual.fatorVP ?? 1) - 1) > 1e-9 ? ' ' + t('× fator de valor presente {f}', { f: (atual.fatorVP as number).toLocaleString(String(LOC()), { maximumFractionDigits: 4 }) }) : ''}
          </span>
          <span className="rf-conta-v">{din(atual.somaMostrada ?? atual.soma, 0)}</span>
        </li>
      </ul>
      {res.r.U ? <p className="rf-nota">{t('Usuários ativos no ano')}: {atual.id === 'saida' ? nfInt(res.r.U[res.H]) : nfInt(res.r.U[+atual.id] || 0)}</p> : null}
    </Bloco>
  );
}
