// Controles das perguntas: um renderizador por tipo de campo de CAMPOS (radio → OptionCard; chips, multi → Chip
// ou OptionCard; texto, area, num, horas → TextField; etapas → SchoolsGrid; setup → PilotSize) e as telas do
// Essencial que juntam mais de um campo (governança, internet, formação, afetados, implantação). Lê e grava o store.
import { Fragment, type ReactNode } from 'react';
import {
  CAMPO_POR_ID, ETAPAS_ENS, PRIORIDADES, RESP_G, QUESTOES_G, listaOpc, totaisCtx, alunosEtapa, modoTeste, horasEstimativa, lerNumero, tr,
} from '../domain';
import { useCaso, origemDe, valorDe, type Estado14, type TelaEssencial } from '../store';
import {
  OptionCard, OptionCardField, OptionCardGroup, Chip, ChipGroup, TextField, Segmented, SchoolsGrid, PilotSize, SourceTag, Button,
  type SchoolStage, type PilotField,
} from '../ui';
import { fmt } from './ambiente';
import { t } from './textos';

// ----------------------------------------------------------- utilidades
const num = (v: string): number | '' => { const n = lerNumero(v); return n === '' ? '' : Math.max(0, Math.round(+n)); };
const str = (v: unknown) => (v == null ? '' : String(v));
const LIMITE_PROBLEMAS = 3;
/** nome da opção com a explicação embaixo (o subtexto do OptionCard é para legendas curtas à direita) */
const comDescricao = (nome: unknown, desc?: unknown): ReactNode =>
  desc ? <>{String(tr(nome))}<span className="pr-optioncard-desc">{String(tr(desc))}</span></> : String(tr(nome));

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

// ----------------------------------------------------------- por tipo
function Radio({ e, campo, sub = true }: { e: Estado14; campo: string; sub?: boolean }) {
  const f: any = (CAMPO_POR_ID as any)[campo];
  const responder = useCaso((s) => s.responder);
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
            onChange={(val) => responder(campo, val)}
          />
        ))}
      </OptionCardGroup>
      {outro && v === outro.v ? (
        <TextField label={String(tr(outro.t))} value={str(valorDe(e, outro.id))} onChange={(x) => responder(outro.id, x)} />
      ) : null}
      <Origem e={e} campos={[campo]} />
    </>
  );
}

function Chips({ e, campo, rotulo, max }: { e: Estado14; campo: string; rotulo?: string; max?: number }) {
  const f: any = (CAMPO_POR_ID as any)[campo];
  const responder = useCaso((s) => s.responder);
  const atual: string[] = (visivel(e, campo) as string[]) || [];
  const sug = origemDe(e, campo) === 'sugerido';
  const opc = listaOpc(f) as any[];
  const alternar = (id: string, on: boolean) => {
    const set = new Set(atual);
    if (on) set.add(id); else set.delete(id);
    responder(campo, opc.map((o) => String(o[0])).filter((k) => set.has(k)));
  };
  const outro = f.outro;
  return (
    <ChipGroup
      label={rotulo || String(tr(f.t))}
      counter={max ? t('{n} de {m} marcados', { n: atual.length, m: max }) : undefined}
      after={outro && atual.includes(outro.v) ? <TextField label={String(tr(outro.t))} value={str(valorDe(e, outro.id))} onChange={(x) => responder(outro.id, x)} /> : undefined}
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
            onToggle={(p) => alternar(String(o[0]), p)}
          />
        );
      })}
    </ChipGroup>
  );
}

/** lista de múltipla escolha com descrição (tarefas): cartões de seleção */
function Multi({ e, campo }: { e: Estado14; campo: string }) {
  const f: any = (CAMPO_POR_ID as any)[campo];
  const responder = useCaso((s) => s.responder);
  const atual: string[] = (visivel(e, campo) as string[]) || [];
  const opc = listaOpc(f) as any[];
  const outro = f.outro;
  return (
    <>
      <OptionCardGroup label={String(tr(f.t))} type="checkbox">
        {opc.map((o) => (
          <OptionCard
            key={o[0]}
            type="checkbox"
            name={campo}
            value={String(o[0])}
            label={comDescricao(o[1], typeof o[2] === 'string' ? o[2] : undefined)}
            checked={atual.includes(String(o[0]))}
            onChange={(val, on) => {
              const set = new Set(atual);
              if (on) set.add(val); else set.delete(val);
              responder(campo, opc.map((x) => String(x[0])).filter((k) => set.has(k)));
            }}
          />
        ))}
      </OptionCardGroup>
      {outro && atual.includes(outro.v) ? <TextField label={String(tr(outro.t))} value={str(valorDe(e, outro.id))} onChange={(x) => responder(outro.id, x)} /> : null}
      <Origem e={e} campos={[campo]} />
    </>
  );
}

function Texto({ e, campo, multiline, numero, rotulo, sufixo, dica }: { e: Estado14; campo: string; multiline?: boolean; numero?: boolean; rotulo?: string; sufixo?: ReactNode; dica?: ReactNode }) {
  const f: any = (CAMPO_POR_ID as any)[campo] || {};
  const responder = useCaso((s) => s.responder);
  const o = origemDe(e, campo);
  const v = o === 'padrao' && e.exemplo === 'novo' && numero ? '' : str(valorDe(e, campo));
  return (
    <TextField
      label={rotulo || t('Sua resposta')}
      value={v}
      type={numero ? 'number' : 'text'}
      multiline={multiline}
      placeholder={f.ph ? String(tr(f.ph)) : undefined}
      suggested={o === 'sugerido'}
      hint={o === 'sugerido' ? textoSugestao(e, campo) : dica}
      suffix={sufixo}
      size={numero ? 10 : undefined}
      onChange={(x) => responder(campo, numero ? num(x) : x)}
    />
  );
}

/** Controle genérico de um campo (usado no modo Refinar e nas telas de um campo só). null quando o tipo não tem controle simples. */
export function ControleCampo({ e, campo }: { e: Estado14; campo: string }) {
  const f: any = (CAMPO_POR_ID as any)[campo];
  if (!f) return null;
  switch (f.tipo) {
    case 'radio': return <Radio e={e} campo={campo} />;
    case 'chips': return <Chips e={e} campo={campo} />;
    case 'multi': return <Multi e={e} campo={campo} />;
    case 'texto': return <Texto e={e} campo={campo} />;
    case 'area': return <Texto e={e} campo={campo} multiline />;
    case 'num': case 'horas': return <Texto e={e} campo={campo} numero />;
    default: return null;
  }
}
export const TIPOS_SIMPLES = ['radio', 'chips', 'multi', 'texto', 'area', 'num', 'horas'];

// ----------------------------------------------------------- telas compostas
function Etapas({ e }: { e: Estado14 }) {
  const responder = useCaso((s) => s.responder);
  const confirmar = useCaso((s) => s.confirmar);
  const et: Record<string, any> = e.ctx.etapas || {};
  const stages: SchoolStage[] = (ETAPAS_ENS as any[]).map((d) => {
    const x = et[d[0]] || {};
    return { id: d[0], label: String(tr(d[1])), sub: String(tr(d[2])), on: !!x.on, schools: str(x.escolas), students: x.on ? str(alunosEtapa(e.ctx, d[0]) || '') : '' };
  });
  const tt = totaisCtx(e.ctx);
  return (
    <SchoolsGrid
      label={t('Etapas de ensino atendidas')}
      stages={stages}
      totals={tt.n ? { schools: fmt.int(tt.escolas), students: fmt.int(tt.alunos), label: t('Total da rede') } : undefined}
      onChange={(id, patch) => {
        const novo = JSON.parse(JSON.stringify(et));
        const x = (novo[id] = novo[id] || {});
        if (patch.on !== undefined) x.on = patch.on;
        if (patch.schools !== undefined) x.escolas = num(patch.schools);
        if (patch.students !== undefined) { x.alunos = num(patch.students); x.soTotal = true; }
        responder('etapas', novo);
        confirmar('grade');
      }}
    />
  );
}

function Prioridades({ e }: { e: Estado14 }) {
  const responder = useCaso((s) => s.responder);
  const atual: string[] = e.ctx.prioridades || [];
  const P = PRIORIDADES as any[];
  return (
    <OptionCardGroup label={t('Prioridades')} type="checkbox">
      {P.map((p) => (
        <OptionCard
          key={p.id}
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
      ))}
    </OptionCardGroup>
  );
}

function Problemas({ e }: { e: Estado14 }) {
  const responder = useCaso((s) => s.responder);
  const pr: string[] = e.ctx.prioridades || [];
  const atual: string[] = e.ctx.problemas || [];
  const P = (PRIORIDADES as any[]).filter((p) => pr.includes(p.id));
  if (!P.length) return <p className="pc-aviso">{t('Escolha antes uma prioridade (pergunta anterior): os problemas aparecem agrupados por prioridade.')}</p>;
  const todos = (PRIORIDADES as any[]).flatMap((p) => p.problemas.map((q: any) => q.id));
  const cheio = atual.length >= LIMITE_PROBLEMAS;
  return (
    <div className="pc-grupos">
      <p className="pc-contador" aria-live="polite">{t('{n} de {m} marcados', { n: atual.length, m: LIMITE_PROBLEMAS })}</p>
      {P.map((p) => (
        <section key={p.id} className="pc-grupo">
          <h2 className="pc-grupo-titulo">{String(tr(p.nome))}</h2>
          <OptionCardGroup label={String(tr(p.nome))} type="checkbox">
            {p.problemas.map((q: any) => {
              const on = atual.includes(q.id);
              return (
                <OptionCard
                  key={q.id}
                  type="checkbox"
                  name="problemas"
                  value={q.id}
                  label={String(tr(q.t))}
                  checked={on}
                  disabled={cheio && !on}
                  onChange={(v, marcado) => {
                    const s = new Set(atual); if (marcado) s.add(v); else s.delete(v);
                    responder('problemas', todos.filter((k: string) => s.has(k)));
                  }}
                />
              );
            })}
          </OptionCardGroup>
        </section>
      ))}
    </div>
  );
}

function Governanca({ e }: { e: Estado14 }) {
  const responderGov = useCaso((s) => s.responderGov);
  const opcoes = (RESP_G as any[]).map((o) => ({ value: String(o[0]), label: String(tr(o[1])) }));
  return (
    <div className="pc-gov">
      {(QUESTOES_G as any[]).map((q) => (
        <div key={q.id} className="pc-gov-linha">
          <div className="pc-gov-texto">
            <span className="pc-gov-pergunta">{String(tr(q.t))}</span>
            {q.h ? <span className="pc-gov-dica">{String(tr(q.h))}</span> : null}
          </div>
          <Segmented label={String(tr(q.t))} options={opcoes} value={e.resp[q.id] || undefined} onChange={(v) => responderGov(q.id, v)} />
        </div>
      ))}
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

const CAMPO_PILOTO: Record<PilotField, string> = { schools: 'escolas', participants: 'participantes', months: 'meses' };
function Piloto({ e }: { e: Estado14 }) {
  const responder = useCaso((s) => s.responder);
  const m = modoTeste(e.caso);
  const modo = m === 'poc' ? 'poc' : m === 'ambos' ? 'ambos' : 'piloto';
  const p = e.caso.piloto || {}, poc = e.caso.poc || {};
  const sug = (o: string, k: string) => origemDe(e, `${o}.${k}`) === 'sugerido';
  const tt = totaisCtx(e.ctx);
  const dicaPiloto: Partial<Record<PilotField, string>> = {};
  if (sug('piloto', 'escolas')) dicaPiloto.schools = tt.escolas ? t('~ sugerido · cerca de 5% de {n}', { n: fmt.int(tt.escolas) }) : t('~ sugerido');
  if (sug('piloto', 'participantes')) dicaPiloto.participants = t('~ sugerido · 5% das pessoas');
  if (sug('piloto', 'meses')) dicaPiloto.months = t('~ sugerido');
  if (!tt.escolas && !+p.escolas) dicaPiloto.schools = t('informe as escolas da rede (1.1.4) para ter uma sugestão');
  const dicaPoc: Partial<Record<PilotField, string>> = {};
  if (sug('poc', 'participantes')) dicaPoc.participants = t('~ sugerido');
  if (sug('poc', 'meses')) dicaPoc.months = t('~ sugerido');
  if (!m) return <p className="pc-aviso">{t('Escolha antes o tipo de teste (pergunta 2.0). Sem ela, o plano considera um piloto.')}</p>;
  return (
    <PilotSize
      mode={modo}
      values={{
        poc: { participants: str(poc.participantes), months: str(poc.meses) },
        piloto: { schools: str(p.escolas), participants: str(p.participantes), months: str(p.meses) },
      }}
      hints={{ poc: dicaPoc, piloto: dicaPiloto }}
      suggested={{ poc: sug('poc', 'participantes') || sug('poc', 'meses'), piloto: sug('piloto', 'escolas') || sug('piloto', 'participantes') || sug('piloto', 'meses') }}
      labels={{ schools: t('Escolas'), participants: t('Participantes'), months: t('Duração (meses)') }}
      blockTitles={{ poc: t('Prova de conceito'), piloto: t('Piloto') }}
      onChange={(bloco, campo, v) => responder(`${bloco}.${CAMPO_PILOTO[campo]}`, num(v))}
    />
  );
}

function Internet({ e }: { e: Estado14 }) {
  const responder = useCaso((s) => s.responder);
  const f: any = (CAMPO_POR_ID as any).internet;
  const v = str(visivel(e, 'internet'));
  const tt = totaisCtx(e.ctx);
  return (
    <OptionCardGroup label={String(tr(f.t))}>
      {(listaOpc(f) as any[]).map((o) => (
        <OptionCard key={o[0]} name="internet" value={o[0]} label={comDescricao(o[1], v === o[0] ? undefined : o[2])} checked={v === o[0]} onChange={(val) => responder('internet', val)}>
          {o[0] === 'parcial' ? (
            <OptionCardField
              label={t('Em quantas?')}
              value={str(e.caso.escolasInternet)}
              suffix={tt.escolas ? t('de {n}', { n: fmt.int(tt.escolas) }) : undefined}
              onChange={(x) => responder('escolasInternet', num(x))}
            />
          ) : null}
        </OptionCard>
      ))}
    </OptionCardGroup>
  );
}

function Formacao({ e }: { e: Estado14 }) {
  const responder = useCaso((s) => s.responder);
  const est = horasEstimativa(e.caso);
  const o = origemDe(e, 'formacaoHoras');
  return (
    <>
      <Chips e={e} campo="formados" rotulo={t('Quem será formado?')} />
      <div className="pc-linha">
        <TextField
          label={String(tr((CAMPO_POR_ID as any).formacaoHoras.t))}
          type="number"
          size={6}
          value={o === 'padrao' && e.exemplo === 'novo' ? '' : str(e.caso.formacaoHoras)}
          suggested={o === 'sugerido'}
          hint={o === 'sugerido' ? t('~ estimativa ilustrativa') : t('estimativa ilustrativa: {h} horas', { h: fmt.int(est) })}
          suffix={t('horas')}
          onChange={(x) => responder('formacaoHoras', num(x))}
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
  const sug = (k: string) => origemDe(e, 'implantacao.' + k) === 'sugerido';
  return (
    <div className="pc-linha pc-linha--campos">
      <TextField label={t('Escolas')} type="number" size={8} value={str(i.escolas)} suggested={sug('escolas')} hint={sug('escolas') ? t('~ sugerido · um terço das escolas') : undefined} onChange={(x) => responder('implantacao.escolas', num(x))} />
      <TextField label={t('Pessoas que usam')} type="number" size={10} value={str(i.pessoas)} suggested={sug('pessoas')} hint={sug('pessoas') ? t('~ sugerido · um terço das pessoas') : undefined} onChange={(x) => responder('implantacao.pessoas', num(x))} />
    </div>
  );
}

/** Os controles de uma tela do Essencial. */
export function ControlesTela({ e, tela }: { e: Estado14; tela: TelaEssencial }) {
  switch (tela.id) {
    case 'etapas': return <Etapas e={e} />;
    case 'prioridades': return <Prioridades e={e} />;
    case 'problemas': return <Problemas e={e} />;
    case 'problema': return <Texto e={e} campo="problema" multiline rotulo={t('Situação atual')} />;
    case 'impactos': return <><Chips e={e} campo="impactos" /><Origem e={e} campos={['impactos']} /></>;
    case 'governanca': return <Governanca e={e} />;
    case 'testes': return <Testes e={e} />;
    case 'tarefas': return <Multi e={e} campo="tarefas" />;
    case 'usuarios': return <><Chips e={e} campo="usuarios" /><Origem e={e} campos={['usuarios']} /></>;
    case 'afetados': return <Afetados e={e} />;
    case 'piloto': return <Piloto e={e} />;
    case 'internet': return <Internet e={e} />;
    case 'formados': return <Formacao e={e} />;
    case 'implantacao': return <Implantacao e={e} />;
    case 'elegiveis': return <Texto e={e} campo="elegiveis" numero rotulo={t('Pessoas em toda a rede')} />;
    case 'local': return <Texto e={e} campo="local" rotulo={t('Nome do lugar ou da rede')} />;
    default: return <Fragment>{tela.campos.map((c) => <ControleCampo key={c} e={e} campo={c} />)}</Fragment>;
  }
}

/** campos da tela que estão com sugestão ainda não confirmada */
export function sugeridosDaTela(e: Estado14, tela: TelaEssencial): string[] {
  const chaves = tela.id === 'piloto' ? ['piloto.escolas', 'piloto.participantes', 'piloto.meses', 'poc.participantes', 'poc.meses']
    : tela.id === 'implantacao' ? ['implantacao.escolas', 'implantacao.pessoas'] : tela.campos;
  return chaves.filter((c) => origemDe(e, c) === 'sugerido');
}

