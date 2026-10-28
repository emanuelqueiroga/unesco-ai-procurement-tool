// Controles das perguntas: um renderizador por tipo de campo de CAMPOS (radio → OptionCard; chips, multi → Chip
// ou OptionCard; texto, area → TextField; num, horas → CampoNumero; etapas → SchoolsGrid; setup → campos do teste;
// ferramentas e arq → listas do Refinar) e as telas do Essencial que juntam mais de um campo (governança, internet,
// formação, afetados, implantação). Lê e grava o store. No modo Refinar, as perguntas do Essencial que têm detalhe
// (estudantes por ano, subcategorias e "Outro problema", medida da linha de base, "Qual?/O que falta?" da governança)
// mostram o detalhe recolhido na própria tela; a lógica pura dessas edições está em refinar.ts.
import { Fragment, createContext, useContext, useId, useState, type ReactNode } from 'react';
import {
  CAMPO_POR_ID, ETAPAS_ENS, PRIORIDADES, RESP_G, QUESTOES_G, OPC, ARQ_DESC, AVISO_SEM_FERRAMENTA,
  listaOpc, totaisCtx, alunosEtapa, etapasAtivas, modoTeste, horasEstimativa, lerNumero, problemasMarcados, sugProblemas, temLacuna, rotulo, pct, tr,
} from '../domain';
import { useCaso, origemDe, valorDe, type Estado14, type TelaEssencial } from '../store';
import {
  OptionCard, OptionCardGroup, Chip, ChipGroup, TextField, Segmented, SchoolsGrid, SourceTag, Button, Alert, IconInfo, IconChevronDown,
  type SchoolStage,
} from '../ui';
import { fmt } from './ambiente';
import { CampoNumero } from './CampoNumero';
import { t, plural } from './textos';
import { href } from './rota';
import {
  inteiro, numeroDe, erroNumero, alternarOpcao, legendasOpc, problemasDoGrupo, ORDEM_PROBLEMAS, ORDEM_SUBS, sugeridaPeloImpacto,
  ferramentaAdicionada, ferramentaRemovida, ferramentaAlterada, ferramentaTarefa, arquiteturaPresumida, rotuloArquitetura,
  etapaEditada, anosDaEtapa, respostaGov, pedeDetalhe, pendenciasRevisar, nomesDoValor, notasPremissa,
  type Ferramenta, type PatchEtapa,
} from './refinar';
import './controles.css';

// ----------------------------------------------------------- utilidades
/** inteiro digitado no campo de texto do SchoolsGrid (escolas, estudantes) */
const num = (v: string): number | '' => inteiro(lerNumero(v) === '' ? '' : +lerNumero(v));
const str = (v: unknown) => (v == null ? '' : String(v));
const LIMITE_PROBLEMAS = 3;
/** nome da opção com a explicação embaixo (o subtexto do OptionCard é para legendas curtas à direita) */
const comDescricao = (nome: unknown, desc?: unknown, extra?: ReactNode): ReactNode =>
  desc || extra ? <>{String(tr(nome))}{desc ? <span className="pr-optioncard-desc">{String(tr(desc))}</span> : null}{extra}</> : String(tr(nome));

const DE_QUEM: Record<string, string> = {
  problemas: 'pelos problemas que você escolheu (1.2.2)',
  tarefas: 'pelas tarefas da IA (2.1.1)',
  testes: 'pela escolha do teste (2.0)',
  tipoTec: 'pelo tipo de tecnologia (2.3.4)',
  usuarios: 'por quem vai usar (2.2.1)',
  elegiveis: 'pelas pessoas na rede (4.1.1)',
  modeloDisp: 'pelo uso dos dispositivos (2.4.3)',
  pagamento: 'pela forma de pagamento (2.3.5)',
};
/** "~ sugerido pelas tarefas da IA (2.1.1)" */
export function textoSugestao(e: Estado14, campo: string): string {
  const de = e.sugestoes[campo] || e.sugestoes[campo.split('.')[0]];
  return t('~ sugerido') + (de && DE_QUEM[de] ? ' ' + t(DE_QUEM[de]) : '');
}
/** valor visível: num caso em branco, a premissa padrão não aparece marcada (só depois de respondida ou sugerida) */
function visivel(e: Estado14, campo: string): any {
  const o = origemDe(e, campo);
  if (o === 'padrao' && e.exemplo === 'novo') return undefined;
  return valorDe(e, campo);
}

function Origem({ e, campos }: { e: Estado14; campos: string[] }) {
  const sug = campos.find((c) => origemDe(e, c) === 'sugerido');
  if (!sug) return null;
  return <p className="pc-origem"><SourceTag origin="sugerido" label={textoSugestao(e, sug)} /></p>;
}
/** por que a sugestão é ilustrativa (1 professor para cada 25 estudantes, uma ferramenta por vez, dispositivos próprios…) */
function NotaPremissa({ e, campo }: { e: Estado14; campo: string }) {
  const L = notasPremissa(e, campo);
  if (!L.length) return null;
  return <p className="pc-nota pcx-premissa">{L.map((x) => <span key={x}>{t(x)}</span>)}</p>;
}

// ----------------------------------------------------------- modo Refinar: como gravar
const RefinandoCtx = createContext(false);
/** Dentro do provedor, os controles gravam com refinar() (origem "refinado"); fora, com responder() ("informado"). */
export const ProvedorRefinar = RefinandoCtx.Provider;
function useGravar(): (campo: string, valor: any) => void {
  const refinando = useContext(RefinandoCtx);
  const responder = useCaso((s) => s.responder);
  const refinar = useCaso((s) => s.refinar);
  return refinando ? refinar : responder;
}

// ----------------------------------------------------------- apoio de tela
/** Bloco que abre e fecha (aria-expanded); o conteúdo continua montado fechado, para não perder o que foi digitado. */
function Recolher({ titulo, extra, aberto: abertoInicial = false, children }: { titulo: ReactNode; extra?: ReactNode; aberto?: boolean; children: ReactNode }) {
  const id = useId();
  const [aberto, setAberto] = useState(abertoInicial);
  return (
    <div className={['pcx-recolher', aberto ? 'pcx-recolher--aberto' : ''].filter(Boolean).join(' ')}>
      <button type="button" className="pcx-recolher-botao" aria-expanded={aberto} aria-controls={id} onClick={() => setAberto((x) => !x)}>
        <IconChevronDown size={18} className="pcx-recolher-seta" />
        <span className="pcx-recolher-titulo">{titulo}</span>
        {extra ? <span className="pcx-recolher-extra">{extra}</span> : null}
      </button>
      <div id={id} className="pcx-recolher-corpo" hidden={!aberto}>{children}</div>
    </div>
  );
}
/** No Essencial, diz onde estão os detalhes de uma resposta e leva ao modo Refinar. */
function DicaRefinar({ texto }: { texto: string }) {
  const setModo = useCaso((s) => s.setModo);
  return (
    <p className="pc-nota pcx-dica">
      {texto}{' '}
      <Button variant="link" onClick={() => setModo('refinar')}>{t('Mudar para o modo Refinar')}</Button>
    </p>
  );
}
function useRefinando(): boolean { return useCaso((s) => s.modo) === 'refinar'; }

/** Selecão simples (lista suspensa nativa) com rótulo; o Prumo ainda não tem componente de seleção. */
function Selecao({ label, value, opcoes, onChange }: { label: string; value: string; opcoes: [string, string][]; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="pcx-campo">
      <label className="pcx-rotulo" htmlFor={id}>{label}</label>
      <select id={id} className="pcx-select" value={value} onChange={(ev) => onChange(ev.target.value)}>
        <option value="">{t('Escolha')}</option>
        {opcoes.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
      </select>
    </div>
  );
}

// ----------------------------------------------------------- por tipo
function Radio({ e, campo, sub = true }: { e: Estado14; campo: string; sub?: boolean }) {
  const f: any = (CAMPO_POR_ID as any)[campo];
  const gravar = useGravar();
  const v = str(visivel(e, campo));
  const opc = listaOpc(f) as any[];
  const outro = f.outro;
  return (
    <>
      <OptionCardGroup label={String(tr(f.t))}>
        {opc.map((o) => (
          <OptionCard
            key={o[0]}
            name={campo}
            value={String(o[0])}
            label={comDescricao(o[1], sub && typeof o[2] === 'string' ? o[2] : undefined)}
            checked={v === String(o[0])}
            onChange={(val) => gravar(campo, val)}
          />
        ))}
      </OptionCardGroup>
      {outro && v === outro.v ? (
        <TextField label={String(tr(outro.t))} value={str(valorDe(e, outro.id))} onChange={(x) => gravar(outro.id, x)} />
      ) : null}
      <Origem e={e} campos={[campo]} />
      <NotaPremissa e={e} campo={campo} />
    </>
  );
}

function Chips({ e, campo, rotulo: rotuloGrupo, max }: { e: Estado14; campo: string; rotulo?: string; max?: number }) {
  const f: any = (CAMPO_POR_ID as any)[campo];
  const gravar = useGravar();
  const atual: string[] = (visivel(e, campo) as string[]) || [];
  const sug = origemDe(e, campo) === 'sugerido';
  const opc = listaOpc(f) as any[];
  const ordem = opc.map((o) => String(o[0]));
  const legendas = legendasOpc(opc);
  const outro = f.outro;
  return (
    <>
      <ChipGroup
        label={rotuloGrupo || String(tr(f.t))}
        counter={max ? t('{n} de {m} marcados', { n: atual.length, m: max }) : undefined}
        after={outro && atual.includes(outro.v) ? <TextField label={String(tr(outro.t))} value={str(valorDe(e, outro.id))} onChange={(x) => gravar(outro.id, x)} /> : undefined}
      >
        {opc.map((o) => {
          const on = atual.includes(String(o[0]));
          return (
            <Chip
              key={o[0]}
              label={String(tr(o[1]))}
              pressed={on}
              suggested={sug && on}
              disabled={!!max && !on && atual.length >= max}
              onToggle={(p) => gravar(campo, alternarOpcao(campo, atual, ordem, String(o[0]), p))}
            />
          );
        })}
      </ChipGroup>
      {legendas.length ? (
        <Recolher titulo={t('O que significa cada opção')}>
          <dl className="pcx-legendas">
            {legendas.map(([n, l]) => <Fragment key={n}><dt>{String(tr(n))}</dt><dd>{String(tr(l))}</dd></Fragment>)}
          </dl>
        </Recolher>
      ) : null}
    </>
  );
}

/** lista de múltipla escolha com descrição (tarefas): cartões de seleção; as ligadas ao impacto marcado levam a etiqueta */
function Multi({ e, campo }: { e: Estado14; campo: string }) {
  const f: any = (CAMPO_POR_ID as any)[campo];
  const gravar = useGravar();
  const atual: string[] = (visivel(e, campo) as string[]) || [];
  const opc = listaOpc(f) as any[];
  const outro = f.outro;
  const impactos: string[] = e.caso.impactos || [];
  return (
    <>
      <OptionCardGroup label={String(tr(f.t))} type="checkbox">
        {opc.map((o) => (
          <OptionCard
            key={o[0]}
            type="checkbox"
            name={campo}
            value={String(o[0])}
            label={comDescricao(o[1], typeof o[2] === 'string' ? o[2] : undefined,
              campo === 'tarefas' && sugeridaPeloImpacto(impactos, String(o[0])) ? <span className="pcx-etiqueta">{t('sugerida pelo impacto')}</span> : undefined)}
            checked={atual.includes(String(o[0]))}
            onChange={(val, on) => gravar(campo, alternarOpcao(campo, atual, opc.map((x) => String(x[0])), val, on))}
          />
        ))}
      </OptionCardGroup>
      {outro && atual.includes(outro.v) ? <TextField label={String(tr(outro.t))} value={str(valorDe(e, outro.id))} onChange={(x) => gravar(outro.id, x)} /> : null}
      <Origem e={e} campos={[campo]} />
    </>
  );
}

function Texto({ e, campo, multiline, rotulo: rotuloCampo, sufixo, dica }: { e: Estado14; campo: string; multiline?: boolean; rotulo?: string; sufixo?: ReactNode; dica?: ReactNode }) {
  const f: any = (CAMPO_POR_ID as any)[campo] || {};
  const gravar = useGravar();
  const o = origemDe(e, campo);
  const v = str(valorDe(e, campo));
  let ph = f.ph ? String(tr(f.ph)) : undefined;
  if (campo === 'titulo') {   // o exemplo do título é a primeira tarefa marcada
    const t0 = (e.caso.tarefas || [])[0];
    if (t0) ph = t0 === 'outra' ? str(e.caso.tarefaOutra) : String(tr(rotulo(listaOpc((CAMPO_POR_ID as any).tarefas), t0)));
  }
  const lacuna = temLacuna(v);
  const sugerido = o === 'sugerido';
  const hint = lacuna
    ? <>{sugerido ? textoSugestao(e, campo) + ' · ' : ''}{t('Complete as lacunas (__) com os dados da rede.')}</>
    : sugerido ? textoSugestao(e, campo) : dica;
  return (
    <TextField
      label={rotuloCampo || t('Sua resposta')}
      value={v}
      multiline={multiline}
      placeholder={ph}
      suggested={sugerido}
      hint={hint}
      suffix={sufixo}
      onChange={(x) => gravar(campo, x)}
    />
  );
}

/** Campo numérico de um campo do caso (inteiro, formatado no idioma enquanto se digita). */
function Numero({ e, campo, rotulo: rotuloCampo, sufixo, dica, max, tamanho = 10 }: { e: Estado14; campo: string; rotulo?: string; sufixo?: ReactNode; dica?: ReactNode; max?: number; tamanho?: number }) {
  const gravar = useGravar();
  const o = origemDe(e, campo);
  const v = numeroDe(o === 'padrao' && e.exemplo === 'novo' ? '' : valorDe(e, campo));
  return (
    <CampoNumero
      label={rotuloCampo || t('Sua resposta')}
      value={v}
      suggested={o === 'sugerido'}
      hint={o === 'sugerido' ? textoSugestao(e, campo) : dica}
      suffix={sufixo}
      size={tamanho}
      error={erroNumero(v, { max })}
      onChange={(x) => gravar(campo, inteiro(x))}
    />
  );
}

// ----------------------------------------------------------- 2.3.3 ferramentas e 3.2.1 arquitetura (só no Refinar)
function Ferramentas({ e }: { e: Estado14 }) {
  const refinar = useCaso((s) => s.refinar);
  const lista: Ferramenta[] = e.caso.ferramentas || [];
  const tarefas: string[] = e.caso.tarefas || [];
  const opcTarefas = listaOpc((CAMPO_POR_ID as any).tarefas) as any[];
  const rotTarefa = (k: string) => (k === 'outra' ? str(e.caso.tarefaOutra) || t('Outra tarefa') : String(tr(rotulo(opcTarefas, k))));
  const grava = (nova: Ferramenta[]) => refinar('ferramentas', nova);
  const tipos = (listaOpc((CAMPO_POR_ID as any).tipoTec) as any[]).map((o) => [String(o[0]), String(tr(o[1]))] as [string, string]);
  const pags = (listaOpc((CAMPO_POR_ID as any).pagamento) as any[]).map((o) => [String(o[0]), String(tr(o[1]))] as [string, string]);
  return (
    <div className="pcx-ferramentas">
      {lista.length ? null : <p className="pc-nota">{t('Nenhuma ferramenta na lista.')}</p>}
      {lista.map((f, i) => {
        const principal = i === 0;
        const nome = String(tr('Ferramenta ' + (i + 1)));
        // na principal, tecnologia e pagamento são as respostas 2.3.4 e 2.3.5
        const tipo = principal ? str(e.caso.tipoTec) : f.tipoTec;
        const pag = principal ? str(e.caso.pagamento) : f.pagamento;
        return (
          <fieldset key={i} className="pcx-ferramenta">
            <legend className="pcx-ferramenta-titulo">{nome}{principal ? <span className="pcx-etiqueta">{t('principal')}</span> : null}</legend>
            <TextField label={t('Nome da ferramenta')} value={str(f.nome)} onChange={(x) => grava(ferramentaAlterada(lista, i, { nome: x }))} />
            <div className="pcx-tarefas" role="group" aria-label={t('Tarefas que ela cobre')}>
              <span className="pcx-rotulo">{t('Tarefas que ela cobre')}</span>
              {tarefas.length ? (
                <div className="pcx-chips">
                  {tarefas.map((k) => (
                    <Chip key={k} label={rotTarefa(k)} pressed={(f.tarefas || []).includes(k)} onToggle={(p) => grava(ferramentaTarefa(lista, i, k, p, tarefas))} />
                  ))}
                </div>
              ) : <p className="pc-nota">{t('Marque antes as tarefas no passo 2.1.')}</p>}
            </div>
            <div className="pcx-ferramenta-campos">
              <Selecao label={t('Tipo de tecnologia')} value={tipo} opcoes={tipos} onChange={(v) => (principal ? refinar('tipoTec', v) : grava(ferramentaAlterada(lista, i, { tipoTec: v })))} />
              <Selecao label={t('Forma de pagamento')} value={pag} opcoes={pags} onChange={(v) => (principal ? refinar('pagamento', v) : grava(ferramentaAlterada(lista, i, { pagamento: v })))} />
              <CampoNumero
                label={t('Preço por usuário por mês, em US$ (opcional)')}
                decimais
                value={numeroDe(f.preco)}
                hint={principal && !(+f.preco > 0) ? t('Sem preço, a estimativa usa um preço ilustrativo.') : undefined}
                error={erroNumero(f.preco)}
                onChange={(x) => grava(ferramentaAlterada(lista, i, { preco: x === '' ? '' : Math.max(0, +x) }))}
              />
            </div>
            {principal ? <p className="pc-nota">{t('Na ferramenta principal, tecnologia e pagamento são as respostas 2.3.4 e 2.3.5.')}</p> : null}
            <div>
              <Button variant="link" aria-label={`${t('Remover')} ${nome}`} onClick={() => grava(ferramentaRemovida(lista, i))}>{t('Remover')}</Button>
            </div>
          </fieldset>
        );
      })}
      <div><Button variant="secondary" onClick={() => grava(ferramentaAdicionada(lista, e.caso))}>{t('Adicionar ferramenta')}</Button></div>
    </div>
  );
}

function Arquitetura({ e }: { e: Estado14 }) {
  const refinar = useCaso((s) => s.refinar);
  const f: any = (CAMPO_POR_ID as any).arquitetura;
  const o = origemDe(e, 'arquitetura');
  const v = o === 'padrao' && e.exemplo === 'novo' ? '' : str(valorDe(e, 'arquitetura'));
  const arqs = ((OPC as any).arquitetura as any[]).filter((x) => ['saas', 'api', 'ow'].includes(x[0]));
  const pres = rotuloArquitetura(arquiteturaPresumida(e.caso));
  return (
    <OptionCardGroup label={String(tr(f.t))}>
      {arqs.map((x) => (
        <OptionCard key={x[0]} name="arquitetura" value={x[0]} label={comDescricao(x[1], (ARQ_DESC as any)[x[0]] || x[2])} checked={v === x[0]} onChange={(val) => refinar('arquitetura', val)} />
      ))}
      <OptionCard
        name="arquitetura"
        value="nao_sei"
        label={comDescricao(
          String(tr('Ainda não sei')) + (pres ? ` (${String(tr('usar a presumida:'))} ${String(tr(pres))})` : ''),
          'A ferramenta deduz a arquitetura das respostas do passo 2.3 para estimar o custo.',
        )}
        checked={v === 'nao_sei'}
        onChange={(val) => refinar('arquitetura', val)}
      />
    </OptionCardGroup>
  );
}

/** Controle genérico de um campo (usado no modo Refinar e nas telas de um campo só). null quando o tipo não tem controle. */
export function ControleCampo({ e, campo }: { e: Estado14; campo: string }) {
  const f: any = (CAMPO_POR_ID as any)[campo];
  if (!f) return null;
  switch (f.tipo) {
    case 'radio': return <><Radio e={e} campo={campo} />{campo === 'frequencia' ? <AvisoRevisar e={e} campos={['frequencia']} /> : null}</>;
    case 'chips': return <Chips e={e} campo={campo} />;
    case 'multi': return <Multi e={e} campo={campo} />;
    case 'texto': return <Texto e={e} campo={campo} />;
    case 'area': return <Texto e={e} campo={campo} multiline />;
    case 'num': case 'horas': return <Numero e={e} campo={campo} />;
    case 'ferramentas': return <Ferramentas e={e} />;
    case 'arq': return <Arquitetura e={e} />;
    default: return null;
  }
}
export const TIPOS_SIMPLES = ['radio', 'chips', 'multi', 'texto', 'area', 'num', 'horas', 'ferramentas', 'arq'];

// ----------------------------------------------------------- telas compostas
function Etapas({ e }: { e: Estado14 }) {
  const responder = useCaso((s) => s.responder);
  const confirmar = useCaso((s) => s.confirmar);
  const et: Record<string, any> = e.ctx.etapas || {};
  const tt = totaisCtx(e.ctx);
  const stages: SchoolStage[] = (ETAPAS_ENS as any[]).map((d) => {
    const x = et[d[0]] || {};
    const porAno = anosDaEtapa(d[0]).length > 0 && !x.soTotal;
    const zero = x.on && (x.escolas === 0 || (!porAno && x.alunos === 0));
    return {
      id: d[0], label: String(tr(d[1])), sub: String(tr(d[2])), on: !!x.on, schools: str(x.escolas),
      students: x.on ? (porAno ? str(alunosEtapa(e.ctx, d[0]) || '') : str(x.alunos)) : '',
      hint: x.on && porAno && alunosEtapa(e.ctx, d[0]) > 0 ? t('Soma dos anos ou séries. Digite o total para informar só o total.') : undefined,
      error: zero ? t('Informe um número maior que zero.') : undefined,
    };
  });
  const incompleto = tt.n > 0 && (etapasAtivas(e.ctx) as any[]).some((d) => !(+(et[d[0]] || {}).escolas > 0 && alunosEtapa(e.ctx, d[0]) > 0));
  return (
    <>
      <SchoolsGrid
        label={t('Etapas de ensino atendidas')}
        stages={stages}
        totals={tt.n ? { schools: fmt.int(tt.escolas), students: fmt.int(tt.alunos), label: t('Total da rede') } : undefined}
        onChange={(id, patch) => {
          const p: PatchEtapa = {};
          if (patch.on !== undefined) p.on = patch.on;
          if (patch.schools !== undefined) p.escolas = num(patch.schools);
          if (patch.students !== undefined) p.alunos = num(patch.students);
          responder('etapas', etapaEditada(et, id, p, anosDaEtapa(id).length));
          confirmar('grade');
        }}
      />
      {incompleto ? <p className="pc-nota">{t('Falta informar escolas e estudantes em cada etapa marcada.')}</p> : null}
    </>
  );
}

/** 1.1.5: estudantes de cada ano ou série, com o total da etapa calculado, ou só o total (PER-14) */
function EstudantesPorAno({ e }: { e: Estado14 }) {
  const refinar = useCaso((s) => s.refinar);
  const et: Record<string, any> = e.ctx.etapas || {};
  const ativas = etapasAtivas(e.ctx) as any[];
  if (!ativas.length) return <p className="pc-aviso">{t('Marque antes as etapas de ensino na pergunta 1.1.4.')}</p>;
  const comAnos = ativas.filter((d) => anosDaEtapa(d[0]).length);
  if (!comAnos.length) return <p className="pc-nota">{t('As etapas marcadas só pedem o total de estudantes.')}</p>;
  const grava = (id: string, patch: PatchEtapa) => refinar('etapas', etapaEditada(et, id, patch, anosDaEtapa(id).length));
  return (
    <div className="pcx-anos">
      {comAnos.map((d) => {
        const id = d[0] as string, anos = anosDaEtapa(id), x = et[id] || {}, porAno = !x.soTotal;
        return (
          <fieldset key={id} className="pcx-etapa">
            <legend className="pcx-etapa-titulo">{String(tr(d[1]))}</legend>
            {porAno ? (
              <>
                <div className="pcx-anos-campos">
                  {anos.map((a, i) => (
                    <CampoNumero key={a} label={String(tr(a))} value={numeroDe((x.anos || [])[i])} size={8} error={erroNumero((x.anos || [])[i], { permiteZero: true })} onChange={(v) => grava(id, { ano: { i, v: inteiro(v) } })} />
                  ))}
                </div>
                <p className="pcx-total">{t('Total da etapa:')} <output className="pcx-total-valor">{fmt.int(alunosEtapa(e.ctx, id))}</output></p>
              </>
            ) : (
              <p className="pc-nota">{t('Só o total da etapa:')} <b>{fmt.int(alunosEtapa(e.ctx, id))}</b></p>
            )}
            <div><Button variant="link" onClick={() => grava(id, { soTotal: porAno })}>{porAno ? t('Informar só o total da etapa') : t('Detalhar por ano ou série')}</Button></div>
          </fieldset>
        );
      })}
    </div>
  );
}

/** 1.2.1: cartões das prioridades, cada um com ⓘ que abre os exemplos sem mudar a seleção (PER-11) */
function Prioridades({ e }: { e: Estado14 }) {
  const responder = useCaso((s) => s.responder);
  const [abertas, setAbertas] = useState<Record<string, boolean>>({});
  const atual: string[] = e.ctx.prioridades || [];
  const P = PRIORIDADES as any[];
  return (
    <OptionCardGroup label={t('Prioridades')} type="checkbox">
      {P.map((p) => {
        const aberta = !!abertas[p.id];
        const idEx = `pcx-ex-${p.id}`;
        return (
          <div key={p.id} className="pcx-prio">
            <OptionCard
              type="checkbox"
              name="prioridades"
              value={p.id}
              label={comDescricao(p.nome, p.desc)}
              checked={atual.includes(p.id)}
              onChange={(v, on) => {
                const s = new Set(atual); if (on) s.add(v); else s.delete(v);
                responder('prioridades', P.map((x) => x.id).filter((k: string) => s.has(k)));
              }}
            />
            <button type="button" className="pcx-info" aria-expanded={aberta} aria-controls={idEx} aria-label={`${t('Exemplos')}: ${String(tr(p.nome))}`} onClick={() => setAbertas((a) => ({ ...a, [p.id]: !a[p.id] }))}>
              <IconInfo size={20} />
            </button>
            <div id={idEx} className="pcx-exemplos" hidden={!aberta}>
              <p className="pc-kicker">{t('Exemplos')}</p>
              <ul>{(p.ex || []).map((x: string) => <li key={x}>{String(tr(x))}</li>)}</ul>
            </div>
          </div>
        );
      })}
    </OptionCardGroup>
  );
}

/** 1.2.2 no Refinar: subcategorias dos problemas marcados (3 a 5 por problema, com contador) */
function Subcategorias({ e, grupo, recolhido }: { e: Estado14; grupo?: any; recolhido?: boolean }) {
  const refinar = useCaso((s) => s.refinar);
  const subs: string[] = e.ctx.subs || [];
  const marcados = (problemasMarcados(e.ctx) as any[]).filter((q) => (q.sub || []).length && (!grupo || grupo.problemas.some((g: any) => g.id === q.id)));
  if (!marcados.length) return recolhido ? null : <p className="pc-nota">{t('Marque antes os problemas na pergunta 1.2.2.')}</p>;
  return (
    <div className="pcx-subs">
      {marcados.map((q) => {
        const n = q.sub.filter(([k]: [string]) => subs.includes(k)).length;
        const contador = t('{n} de {m} marcadas', { n, m: q.sub.length });
        const chips = (
          <ChipGroup label={`${t('Subcategorias (opcional)')}: ${String(tr(q.t))}`} counter={recolhido ? undefined : contador}>
            {q.sub.map(([k, txt]: [string, string]) => (
              <Chip key={k} label={String(tr(txt))} pressed={subs.includes(k)} onToggle={(p) => refinar('subs', alternarOpcao('subs', subs, ORDEM_SUBS, k, p))} />
            ))}
          </ChipGroup>
        );
        return recolhido ? (
          <Recolher
            key={q.id}
            aberto={n > 0}
            titulo={<><span>{t('Subcategorias (opcional)')}</span><span className="pcx-recolher-sub">{String(tr(q.t))}</span></>}
            extra={contador}
          >{chips}</Recolher>
        ) : (
          <div key={q.id} className="pcx-sub-grupo"><p className="pcx-sub-titulo">{String(tr(q.t))}</p>{chips}</div>
        );
      })}
    </div>
  );
}
function OutroProblema({ e }: { e: Estado14 }) {
  const refinar = useCaso((s) => s.refinar);
  return (
    <TextField
      label={t('Outro problema')}
      multiline
      value={str(e.ctx.problemaOutro)}
      hint={t('Descreva um problema que não está na lista. Ele entra na descrição do caso e no plano.')}
      onChange={(x) => refinar('problemaOutro', x)}
    />
  );
}

function Problemas({ e }: { e: Estado14 }) {
  const responder = useCaso((s) => s.responder);
  const refinando = useRefinando();
  const pr: string[] = e.ctx.prioridades || [];
  const atual: string[] = e.ctx.problemas || [];
  const P = (PRIORIDADES as any[]).filter((p) => pr.includes(p.id));
  if (!P.length) return <p className="pc-aviso">{t('Escolha antes uma prioridade (pergunta anterior): os problemas aparecem agrupados por prioridade.')}</p>;
  // o limite de três vale só no Essencial; no Refinar volta o "Marcar todos" por prioridade
  const cheio = !refinando && atual.length >= LIMITE_PROBLEMAS;
  const grava = (lista: string[]) => responder('problemas', lista);
  return (
    <div className="pc-grupos">
      {refinando ? null : (
        <>
          <p className="pc-contador" aria-live="polite">{t('{n} de {m} marcados', { n: atual.length, m: LIMITE_PROBLEMAS })}</p>
          <p className="pc-nota">{t('O limite de três mantém o primeiro teste focado: cada problema acrescenta objetivos, tarefas e custos ao plano. No modo Refinar não há limite.')}</p>
        </>
      )}
      {P.map((p) => {
        const ids: string[] = p.problemas.map((q: any) => q.id);
        const n = ids.filter((k) => atual.includes(k)).length;
        return (
          <section key={p.id} className="pc-grupo">
            <div className="pcx-grupo-cab">
              <h2 className="pc-grupo-titulo">{String(tr(p.nome))}</h2>
              {refinando ? (
                <>
                  <span className="pc-contador" aria-live="polite">{t('{n} de {m} marcados', { n, m: ids.length })}</span>
                  <span className="pcx-grupo-acoes">
                    <Button variant="secondary" size="sm" disabled={n === ids.length} onClick={() => grava(problemasDoGrupo(atual, ORDEM_PROBLEMAS, ids, true))}>{t('Marcar todos')}</Button>
                    <Button variant="secondary" size="sm" disabled={n === 0} onClick={() => grava(problemasDoGrupo(atual, ORDEM_PROBLEMAS, ids, false))}>{t('Desmarcar todos')}</Button>
                  </span>
                </>
              ) : null}
            </div>
            <OptionCardGroup label={String(tr(p.nome))} type="checkbox">
              {p.problemas.map((q: any) => {
                const on = atual.includes(q.id);
                return (
                  <OptionCard
                    key={q.id}
                    type="checkbox"
                    name="problemas"
                    value={q.id}
                    label={<>{String(tr(q.t))}<span className="pr-optioncard-desc"><span className="pcx-obj">{t('Objetivo:')}</span> {String(tr(q.obj))}</span></>}
                    checked={on}
                    disabled={cheio && !on}
                    onChange={(v, marcado) => grava(problemasDoGrupo(atual, ORDEM_PROBLEMAS, [v], marcado))}
                  />
                );
              })}
            </OptionCardGroup>
            {refinando ? <Subcategorias e={e} grupo={p} recolhido /> : null}
          </section>
        );
      })}
      {refinando ? <OutroProblema e={e} /> : <DicaRefinar texto={t('Para marcar subcategorias, descrever outro problema ou marcar mais de três, use o modo Refinar.')} />}
    </div>
  );
}

/** 1.2.7: para quais problemas e qual medida (com Sim ou Em parte) */
function DetalheLinhaBase({ e, semResposta }: { e: Estado14; semResposta?: boolean }) {
  const refinar = useCaso((s) => s.refinar);
  const c = e.caso;
  if (!['sim', 'parcial'].includes(c.linhaBase)) {
    return semResposta ? (
      <p className="pc-nota">{t('Responda “Sim” ou “Em parte” na pergunta 1.2.7 para detalhar a medida.')}{' '}<a href={href.tela('linhaBase')}>{t('Ir para a pergunta')}</a></p>
    ) : null;
  }
  const ps = problemasMarcados(e.ctx) as any[];
  const sel: string[] = c.linhaBaseProblemas || [];
  return (
    <div className="pcx-detalhe">
      {ps.length ? (
        <OptionCardGroup label={`${t('Para quais problemas?')} (${t('opcional')})`} type="checkbox">
          {ps.map((q) => (
            <OptionCard
              key={q.id}
              type="checkbox"
              name="linhaBaseProblemas"
              value={q.id}
              label={String(tr(q.t))}
              checked={sel.includes(q.id)}
              onChange={(v, on) => refinar('linhaBaseProblemas', alternarOpcao('linhaBaseProblemas', sel, ORDEM_PROBLEMAS, v, on))}
            />
          ))}
        </OptionCardGroup>
      ) : (
        <TextField label={`${t('Para quais problemas?')} (${t('opcional')})`} value={str(c.linhaBaseProblemaTxt)} onChange={(x) => refinar('linhaBaseProblemaTxt', x)} />
      )}
      <TextField
        label={`${t('Qual medida?')} (${t('opcional')})`}
        value={str(c.linhaBaseMedida)}
        placeholder={String(tr('Ex.: avaliação estadual de leitura do 5º ano, 2025'))}
        onChange={(x) => refinar('linhaBaseMedida', x)}
      />
    </div>
  );
}

/** "Qual?" e, com Em parte, "O que falta?" de uma pergunta de governança */
function DetalheGov({ e, q }: { e: Estado14; q: any }) {
  const responderGov = useCaso((s) => s.responderGov);
  const resp = e.resp[q.id] || '';
  const det = e.respDet[q.id] || {};
  const grava = (k: 'qual' | 'falta', x: string) => responderGov(q.id, resp, { [k]: x });
  return (
    <div className="pcx-detalhe">
      <TextField label={`${String(tr(q.detalhe))} (${t('opcional')})`} value={str(det.qual)} onChange={(x) => grava('qual', x)} />
      {resp === 'parcial' ? <TextField label={`${t('O que falta?')} (${t('opcional')})`} value={str(det.falta)} onChange={(x) => grava('falta', x)} /> : null}
    </div>
  );
}
/** os detalhes da governança de todas as perguntas respondidas com Sim ou Em parte (síntese do capítulo 1, modo Refinar) */
function DetalhesGovernanca({ e }: { e: Estado14 }) {
  const com = (QUESTOES_G as any[]).filter((q) => pedeDetalhe(e.resp[q.id]));
  if (!com.length) {
    return <p className="pc-nota">{t('Responda “Sim” ou “Em parte” em alguma pergunta da governança para detalhar.')}{' '}<a href={href.tela('governanca')}>{t('Ir para a pergunta')}</a></p>;
  }
  return (
    <div className="pcx-gov-detalhes">
      {com.map((q) => (
        <div key={q.id} className="pcx-sub-grupo">
          <p className="pcx-sub-titulo">{q.n} {String(tr(q.t))}</p>
          <DetalheGov e={e} q={q} />
        </div>
      ))}
    </div>
  );
}

function Governanca({ e }: { e: Estado14 }) {
  const responderGov = useCaso((s) => s.responderGov);
  const refinando = useRefinando();
  const opcoes = (RESP_G as any[]).map((o) => ({ value: String(o[0]), label: String(tr(o[1])) }));
  return (
    <div className="pc-gov">
      {(QUESTOES_G as any[]).map((q) => {
        const resp = e.resp[q.id] || '';
        const det = e.respDet[q.id];
        const tem = !!(det && (str(det.qual).trim() || str(det.falta).trim()));
        return (
          <div key={q.id} className="pc-gov-linha">
            <div className="pc-gov-texto">
              <span className="pc-gov-pergunta">{String(tr(q.t))}</span>
              {q.h ? <span className="pc-gov-dica">{String(tr(q.h))}</span> : null}
              {q.ex ? <span className="pc-gov-dica">{String(tr(q.ex))}</span> : null}
            </div>
            <Segmented
              label={String(tr(q.t))}
              options={opcoes}
              value={resp || undefined}
              onChange={(v) => { const r = respostaGov(resp, v, det); responderGov(q.id, r.valor, r.det); }}
            />
            {refinando && pedeDetalhe(resp) ? (
              <Recolher titulo={t('Detalhar (opcional)')} aberto={tem}><DetalheGov e={e} q={q} /></Recolher>
            ) : null}
          </div>
        );
      })}
      {refinando ? null : <DicaRefinar texto={t('Para dizer qual documento ou equipe já existe e o que falta, use o modo Refinar.')} />}
    </div>
  );
}

function Testes({ e }: { e: Estado14 }) {
  const responder = useCaso((s) => s.responder);
  const f: any = (CAMPO_POR_ID as any).testes;
  const atual: string[] = e.caso.testes || [];
  return (
    <OptionCardGroup label={String(tr(f.t))} type="checkbox">
      {(listaOpc(f) as any[]).map((o) => (
        <OptionCard
          key={o[0]}
          type="checkbox"
          name="testes"
          value={o[0]}
          label={comDescricao(o[1], o[2])}
          checked={atual.includes(o[0])}
          onChange={(v, on) => {
            let novo: string[];
            if (v === 'recomendar') novo = on ? ['recomendar'] : [];
            else { const s = new Set(atual.filter((x) => x !== 'recomendar')); if (on) s.add(v); else s.delete(v); novo = ['poc', 'piloto'].filter((k) => s.has(k)); }
            responder('testes', novo);
          }}
        />
      ))}
    </OptionCardGroup>
  );
}

type CampoTeste = 'escolas' | 'participantes' | 'meses';
function Piloto({ e }: { e: Estado14 }) {
  const responder = useCaso((s) => s.responder);
  const m = modoTeste(e.caso);
  const modo = m === 'poc' ? 'poc' : m === 'ambos' ? 'ambos' : 'piloto';
  const p = e.caso.piloto || {}, poc = e.caso.poc || {};
  const sug = (o: string, k: string) => origemDe(e, `${o}.${k}`) === 'sugerido';
  const tt = totaisCtx(e.ctx);
  if (!m) return <p className="pc-aviso">{t('Escolha antes o tipo de teste (pergunta 2.0). Sem ela, o plano considera um piloto.')}</p>;
  const ROTULO: Record<CampoTeste, string> = { escolas: t('Escolas'), participantes: t('Participantes'), meses: t('Duração (meses)') };
  const dica = (bloco: 'poc' | 'piloto', k: CampoTeste): string | undefined => {
    if (bloco === 'piloto' && k === 'escolas') {
      if (sug('piloto', 'escolas')) return tt.escolas ? t('~ sugerido · cerca de 5% de {n}', { n: fmt.int(tt.escolas) }) : t('~ sugerido');
      if (!tt.escolas && !+p.escolas) return t('informe as escolas da rede (1.1.4) para ter uma sugestão');
      // % do piloto sobre a rede, ao vivo (PER-26)
      if (tt.escolas && +p.escolas) return `${t('Escolas do piloto em relação à rede:')} ${pct(Math.min(1, +p.escolas / tt.escolas))}`;
      return undefined;
    }
    if (sug(bloco, k)) return k === 'participantes' && bloco === 'piloto' ? t('~ sugerido · 5% das pessoas') : t('~ sugerido');
    return undefined;
  };
  const bloco = (b: 'poc' | 'piloto', campos: CampoTeste[]) => {
    const titulo = b === 'poc' ? t('Prova de conceito') : t('Piloto');
    const v = b === 'poc' ? poc : p;
    return (
      <div className="pcx-piloto-bloco" role="group" aria-label={titulo}>
        {modo === 'ambos' ? <div className="pcx-piloto-titulo">{titulo}</div> : null}
        <div className="pcx-piloto-campos">
          {campos.map((k) => {
            const escolas = b === 'piloto' && k === 'escolas';
            return (
              <CampoNumero
                key={k}
                label={ROTULO[k]}
                value={numeroDe(v[k])}
                suggested={sug(b, k)}
                hint={dica(b, k)}
                suffix={escolas && tt.escolas ? t('de {n}', { n: fmt.int(tt.escolas) }) : undefined}
                error={erroNumero(v[k], { max: escolas ? tt.escolas : undefined })}
                size={8}
                onChange={(x) => responder(`${b}.${k}`, inteiro(x))}
              />
            );
          })}
        </div>
      </div>
    );
  };
  return (
    <div className="pcx-piloto">
      {modo === 'poc' || modo === 'ambos' ? bloco('poc', ['participantes', 'meses']) : null}
      {modo === 'piloto' || modo === 'ambos' ? bloco('piloto', ['escolas', 'participantes', 'meses']) : null}
      <NotaPremissa e={e} campo="piloto" />
    </div>
  );
}

function Internet({ e }: { e: Estado14 }) {
  const responder = useCaso((s) => s.responder);
  const f: any = (CAMPO_POR_ID as any).internet;
  const v = str(visivel(e, 'internet'));
  const tt = totaisCtx(e.ctx);
  const n = numeroDe(e.caso.escolasInternet);
  return (
    <>
      <OptionCardGroup label={String(tr(f.t))}>
        {(listaOpc(f) as any[]).map((o) => (
          <OptionCard key={o[0]} name="internet" value={o[0]} label={comDescricao(o[1], v === o[0] ? undefined : o[2])} checked={v === o[0]} onChange={(val) => responder('internet', val)} />
        ))}
      </OptionCardGroup>
      {v === 'parcial' ? (
        <div className="pcx-parcial">
          <CampoNumero
            label={t('Em quantas?')}
            value={n}
            size={8}
            suffix={tt.escolas ? t('de {n}', { n: fmt.int(tt.escolas) }) : undefined}
            error={erroNumero(n, { max: tt.escolas })}
            onChange={(x) => responder('escolasInternet', inteiro(x))}
          />
        </div>
      ) : null}
    </>
  );
}

function Formacao({ e }: { e: Estado14 }) {
  const responder = useCaso((s) => s.responder);
  const est = horasEstimativa(e.caso);
  const o = origemDe(e, 'formacaoHoras');
  const v = numeroDe(o === 'padrao' && e.exemplo === 'novo' ? '' : e.caso.formacaoHoras);
  return (
    <>
      <Chips e={e} campo="formados" rotulo={t('Quem será formado?')} />
      <div className="pc-linha">
        <CampoNumero
          label={String(tr((CAMPO_POR_ID as any).formacaoHoras.t))}
          size={6}
          value={v}
          suggested={o === 'sugerido'}
          hint={o === 'sugerido' ? t('~ estimativa ilustrativa') : t('estimativa ilustrativa: {h} horas', { h: fmt.int(est) })}
          suffix={t('horas')}
          error={erroNumero(v)}
          onChange={(x) => responder('formacaoHoras', inteiro(x))}
        />
        <Button variant="link" onClick={() => { responder('formacaoHoras', est); responder('formacaoEstimativa', true); }}>
          {t('Usar a estimativa ({h} h)', { h: fmt.int(est) })}
        </Button>
      </div>
    </>
  );
}

function Afetados({ e }: { e: Estado14 }) {
  return (
    <>
      <AvisoRevisar e={e} campos={['afetados', 'consequencias']} />
      <h2 className="pc-sub">{String(tr((CAMPO_POR_ID as any).afetados.t))}</h2>
      <Chips e={e} campo="afetados" />
      <h2 className="pc-sub">{String(tr((CAMPO_POR_ID as any).consequencias.t))}</h2>
      <Chips e={e} campo="consequencias" />
      <Origem e={e} campos={['afetados', 'consequencias']} />
    </>
  );
}

function Implantacao({ e }: { e: Estado14 }) {
  const responder = useCaso((s) => s.responder);
  const i = e.caso.implantacao || {};
  const tt = totaisCtx(e.ctx);
  const sug = (k: string) => origemDe(e, 'implantacao.' + k) === 'sugerido';
  return (
    <>
      <div className="pc-linha pc-linha--campos">
        <CampoNumero
          label={t('Escolas')}
          size={8}
          value={numeroDe(i.escolas)}
          suggested={sug('escolas')}
          hint={sug('escolas') ? t('~ sugerido · um terço das escolas') : undefined}
          suffix={tt.escolas ? t('de {n}', { n: fmt.int(tt.escolas) }) : undefined}
          error={erroNumero(i.escolas, { max: tt.escolas })}
          onChange={(x) => responder('implantacao.escolas', inteiro(x))}
        />
        <CampoNumero
          label={t('Pessoas que usam')}
          size={10}
          value={numeroDe(i.pessoas)}
          suggested={sug('pessoas')}
          hint={sug('pessoas') ? t('~ sugerido · um terço das pessoas') : undefined}
          error={erroNumero(i.pessoas)}
          onChange={(x) => responder('implantacao.pessoas', inteiro(x))}
        />
      </div>
      <NotaPremissa e={e} campo="implantacao" />
    </>
  );
}

// ----------------------------------------------------------- PER-07 aviso "revisar"
/**
 * Respostas já confirmadas do 2.2 cuja sugestão, a partir das tarefas, mudou. Nada é trocado sozinho: cada linha
 * leva à pergunta e oferece aceitar a sugestão nova (responder) ou manter a resposta (marcarRevisado).
 */
export function AvisoRevisar({ e, campos }: { e: Estado14; campos?: string[] }) {
  const responder = useCaso((s) => s.responder);
  const marcarRevisado = useCaso((s) => s.marcarRevisado);
  const pend = pendenciasRevisar(e).filter((p) => !campos || campos.includes(p.campo));
  if (!pend.length) return null;
  return (
    <Alert kind="atencao" title={plural(pend.length, 'Revise {n} resposta do 2.2: as tarefas mudaram', 'Revise {n} respostas do 2.2: as tarefas mudaram')}>
      <p className="pcx-revisar-texto">{t('Você já confirmou estas respostas e a sugestão a partir das tarefas agora é outra. Nada foi trocado: aceite a sugestão nova ou mantenha a sua.')}</p>
      <ul className="pcx-revisar">
        {pend.map((p) => {
          const f: any = (CAMPO_POR_ID as any)[p.campo];
          return (
            <li key={p.campo} className="pcx-revisar-item">
              <a href={href.campo(p.campo)}>{f.n} {String(tr(f.t))}</a>
              <span className="pcx-revisar-valor">{t('Sugestão nova: {v}', { v: String(tr(nomesDoValor(p.campo, p.valor))) })}</span>
              <span className="pcx-revisar-acoes">
                <Button variant="secondary" size="sm" onClick={() => responder(p.campo, p.valor)}>{t('Aceitar a nova sugestão')}</Button>
                <Button variant="link" onClick={() => marcarRevisado(p.campo)}>{t('Manter a minha')}</Button>
              </span>
            </li>
          );
        })}
      </ul>
    </Alert>
  );
}

// ----------------------------------------------------------- detalhes do Refinar fora das perguntas de CAMPOS
/** O controle de um detalhe do Refinar (EXTRAS_REFINAR): estudantes por ano, subcategorias, outro problema, medida, governança. */
export function ControleExtra({ e, id }: { e: Estado14; id: string }) {
  switch (id) {
    case 'grade': return <EstudantesPorAno e={e} />;
    case 'subs': return <Subcategorias e={e} />;
    case 'problemaOutro': return <OutroProblema e={e} />;
    case 'linhaBase': return <DetalheLinhaBase e={e} semResposta />;
    case 'governanca': return <DetalhesGovernanca e={e} />;
    default: return null;
  }
}

/** Os controles de uma tela do Essencial. */
export function ControlesTela({ e, tela }: { e: Estado14; tela: TelaEssencial }) {
  const refinando = useRefinando();
  switch (tela.id) {
    case 'etapas': return (
      <>
        <Etapas e={e} />
        {refinando
          ? <Recolher titulo={t('Estudantes por ano ou série (opcional)')} aberto={etapasComAnos(e)}><EstudantesPorAno e={e} /></Recolher>
          : <DicaRefinar texto={t('Para informar os estudantes ano a ano ou série a série, use o modo Refinar.')} />}
      </>
    );
    case 'prioridades': return <Prioridades e={e} />;
    case 'problemas': return <Problemas e={e} />;
    case 'problema': return <Texto e={e} campo="problema" multiline rotulo={t('Situação atual')} />;
    case 'impactos': return <><Chips e={e} campo="impactos" /><Origem e={e} campos={['impactos']} /></>;
    case 'linhaBase': return (
      <>
        <ControleCampo e={e} campo="linhaBase" />
        {['sim', 'parcial'].includes(e.caso.linhaBase) ? (refinando
          ? <Recolher titulo={t('Detalhar a medida (opcional)')} aberto={!!(str(e.caso.linhaBaseMedida) || (e.caso.linhaBaseProblemas || []).length || str(e.caso.linhaBaseProblemaTxt))}><DetalheLinhaBase e={e} /></Recolher>
          : <DicaRefinar texto={t('Para dizer quais problemas a medida cobre e qual é, use o modo Refinar.')} />) : null}
      </>
    );
    case 'governanca': return <Governanca e={e} />;
    case 'testes': return <Testes e={e} />;
    case 'tarefas': {
      const sp: any = sugProblemas(e.ctx);
      return (
        <>
          <AvisoRevisar e={e} />
          {sp && sp.semFerramenta ? <p className="pc-aviso">{String(tr(AVISO_SEM_FERRAMENTA))}</p> : null}
          <Multi e={e} campo="tarefas" />
        </>
      );
    }
    case 'usuarios': return <><AvisoRevisar e={e} campos={['usuarios']} /><Chips e={e} campo="usuarios" /><Origem e={e} campos={['usuarios']} /></>;
    case 'afetados': return <Afetados e={e} />;
    case 'piloto': return <Piloto e={e} />;
    case 'internet': return <Internet e={e} />;
    case 'formados': return <Formacao e={e} />;
    case 'implantacao': return <Implantacao e={e} />;
    case 'elegiveis': return <><Numero e={e} campo="elegiveis" rotulo={t('Pessoas em toda a rede')} /><NotaPremissa e={e} campo="elegiveis" /></>;
    case 'local': return <Texto e={e} campo="local" rotulo={t('Nome do lugar ou da rede')} />;
    default: return <Fragment>{tela.campos.map((c) => <ControleCampo key={c} e={e} campo={c} />)}</Fragment>;
  }
}
/** alguma etapa marcada já tem estudantes por ano guardados? (abre o detalhe) */
function etapasComAnos(e: Estado14): boolean {
  const et: Record<string, any> = e.ctx.etapas || {};
  return (etapasAtivas(e.ctx) as any[]).some((d) => anosDaEtapa(d[0]).length && !(et[d[0]] || {}).soTotal && (et[d[0]].anos || []).some((a: any) => +a > 0));
}

/** campos da tela que estão com sugestão ainda não confirmada */
export function sugeridosDaTela(e: Estado14, tela: TelaEssencial): string[] {
  const chaves = tela.id === 'piloto' ? ['piloto.escolas', 'piloto.participantes', 'piloto.meses', 'poc.participantes', 'poc.meses']
    : tela.id === 'implantacao' ? ['implantacao.escolas', 'implantacao.pessoas'] : tela.campos;
  return chaves.filter((c) => origemDe(e, c) === 'sugerido');
}
