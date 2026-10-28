// Peças de formulário da calculadora: campos ligados a um caminho da cfg de custo (useCaso().editarCfg), séries
// por ano, seletores de subcomponente, função e natureza, seção com âncora para o foco ("Ajustar premissas").
// Da 0.0.15 (REF-02 a REF-04): o campo ligado a uma linha da base de referências mostra "seu valor · faixa de
// referência", o sinal "fora da faixa" (ícone e texto) e de onde vem o padrão (origem, fonte, ano e grau); um valor
// alterado na calculadora ganha "restaurar", que o devolve ao valor das respostas.
import { useId, type ReactNode } from 'react';
import { useCaso } from '../../store';
import { CampoNumero } from '../../percurso/CampoNumero';
import { TextField, Button, IconWarning } from '../../ui';
import { t } from '../../percurso/textos';
import { SAL, SAL_NOME, faixaDoCampo } from '../../domain';
import { gruposSub, serieAnos } from './calc';
import { useRefCampo, fmtRef, origemDaRef, cfgBaseDe } from './referencia';
import './referencias.css';

const numOuZero = (v: number | '') => (v === '' ? 0 : v);

/** "seu valor X · faixa de referência A a B", "fora da faixa" e a origem do padrão (fonte, ano, grau) */
export function TextoFaixa({ f, percentual }: { f: any; percentual?: boolean }) {
  const v = fmtRef(f.valor, percentual) || '—';
  return (
    <span className="rf-ref">
      <span className="rf-ref-faixa">
        {f.semFaixa
          ? t('seu valor {0} · sem faixa de referência (valor da base {1})', { 0: v, 1: fmtRef(f.padrao, percentual) })
          : t('seu valor {0} · faixa de referência {1} a {2}', { 0: v, 1: fmtRef(f.baixo, percentual), 2: fmtRef(f.alto, percentual) })}
        {f.fora ? <span className="rf-ref-fora"><IconWarning size={16} aria-hidden="true" focusable="false" />{t('fora da faixa')}</span> : null}
      </span>
      <span className="rf-ref-fonte">{origemDaRef(f)}</span>
    </span>
  );
}

/** "restaurar": volta o caminho ao valor das respostas (ou da base) */
export function BotaoRestaurar({ caminho, rotulo }: { caminho: string; rotulo: string }) {
  const restaurarCfg = useCaso((s) => s.restaurarCfg);
  return (
    <Button variant="link" size="sm" className="rf-ref-restaurar" aria-label={t('Restaurar o valor padrão: {rotulo}', { rotulo })} onClick={() => restaurarCfg(caminho)}>
      {t('restaurar')}
    </Button>
  );
}

/** Campo numérico de um caminho da cfg; `percentual` mostra % e guarda fração; `decimais` aceita 0,05 */
export function CampoCfg({ caminho, rotulo, valor, decimais = true, percentual, negativo, dica, rotuloOculto }: {
  caminho: string; rotulo: string; valor: any; decimais?: boolean; percentual?: boolean; negativo?: boolean; dica?: ReactNode; rotuloOculto?: boolean;
}) {
  const editarCfg = useCaso((s) => s.editarCfg);
  const { faixa, alterado } = useRefCampo(caminho);
  const v = valor === '' || valor == null || !isFinite(+valor) ? '' : +valor;
  const hint = faixa ? <>{dica ? <span className="rf-ref-dica">{dica}</span> : null}<TextoFaixa f={faixa} percentual={percentual} /></> : dica;
  return (
    <div className={['rf-campo', rotuloOculto ? 'rf-campo--oculto' : '', faixa && faixa.fora ? 'rf-campo--fora' : ''].filter(Boolean).join(' ')} id={'rf-' + caminho}>
      <CampoNumero label={rotulo} value={v} decimais={decimais} percentual={percentual} negativo={negativo} hint={hint} size={9} onChange={(x) => editarCfg(caminho, numOuZero(x))} />
      {alterado ? <BotaoRestaurar caminho={caminho} rotulo={rotulo} /> : null}
    </div>
  );
}

/** Texto de um caminho da cfg (nome de item, atividade, alternativa) */
export function TextoCfg({ caminho, rotulo, valor, rotuloOculto }: { caminho: string; rotulo: string; valor: any; rotuloOculto?: boolean }) {
  const editarCfg = useCaso((s) => s.editarCfg);
  return (
    <div className={['rf-campo rf-campo--texto', rotuloOculto ? 'rf-campo--oculto' : ''].filter(Boolean).join(' ')}>
      <TextField label={rotulo} value={String(valor ?? '')} onChange={(x) => editarCfg(caminho, x)} />
    </div>
  );
}

/** Uma série por ano (Ano 0…H) de um caminho da cfg: elegíveis, adoção, meses, licenças, FTE, valores de itens */
export function AnosCfg({ caminho, rotulo, valores, H, percentual, decimais = true, dica }: {
  caminho: string; rotulo: string; valores: any; H: number; percentual?: boolean; decimais?: boolean; dica?: ReactNode;
}) {
  const editarCfg = useCaso((s) => s.editarCfg);
  const cfgUso = useCaso((s) => (s.custo.editado && s.custo.cfg ? s.custo.cfg : null));
  const caso = useCaso((s) => s.caso);
  const { alterado } = useRefCampo(caminho);
  const serie = serieAnos(valores, H);
  const dicaId = useId();
  const refId = useId();
  // linha da base de cada ano (itens com refs por ano: formação, avaliações); só a cfg editada ou a das respostas têm os ids
  const refs = useRefAnos(caminho, serie, cfgUso, caso);
  const temDescr = !!dica || refs.length > 0;
  return (
    <fieldset className="rf-anos" id={'rf-' + caminho} aria-describedby={temDescr ? [dica ? dicaId : '', refs.length ? refId : ''].filter(Boolean).join(' ') : undefined}>
      <legend className="rf-anos-legenda">{rotulo}{percentual ? ' (%)' : ''}</legend>
      <div className="rf-anos-grade">
        {serie.map((v, i) => (
          <CampoNumero
            key={i}
            label={t('Ano ' + i)}
            value={v}
            decimais={decimais}
            percentual={percentual}
            size={8}
            onChange={(x) => editarCfg(caminho + '.' + i, numOuZero(x))}
          />
        ))}
      </div>
      {dica ? <p className="rf-dica" id={dicaId}>{dica}</p> : null}
      {refs.length ? (
        <p className="rf-dica rf-ref" id={refId}>
          {refs.map((r) => (
            <span key={r.anos} className="rf-ref-faixa">
              {r.anos}: {r.f.semFaixa
                ? t('seu valor {0} · sem faixa de referência (valor da base {1})', { 0: fmtRef(r.f.valor, percentual) || '—', 1: fmtRef(r.f.padrao, percentual) })
                : t('seu valor {0} · faixa de referência {1} a {2}', { 0: fmtRef(r.f.valor, percentual) || '—', 1: fmtRef(r.f.baixo, percentual), 2: fmtRef(r.f.alto, percentual) })}
              {r.f.fora ? <span className="rf-ref-fora"><IconWarning size={16} aria-hidden="true" focusable="false" />{t('fora da faixa')}</span> : null}
            </span>
          ))}
          <span className="rf-ref-fonte">{origemDaRef(refs[0].f)}</span>
        </p>
      ) : null}
      {alterado ? <BotaoRestaurar caminho={caminho} rotulo={rotulo} /> : null}
    </fieldset>
  );
}

/** linhas da base por ano de uma série, juntando anos seguidos com a mesma linha e o mesmo valor ("Ano 1–Ano 3") */
function useRefAnos(caminho: string, serie: (number | '')[], cfgUso: any, caso: any): { anos: string; f: any }[] {
  const base = useRefBase();
  const cfg = cfgUso || base;
  if (!cfg) return [];
  const out: { anos: string; f: any; ini: number; fim: number; chave: string }[] = [];
  serie.forEach((v, i) => {
    let f: any = null;
    try { f = faixaDoCampo(cfg, caminho + '.' + i, caso, v); } catch (e) { f = null; }
    if (!f) return;
    const chave = f.id + '|' + f.valor + '|' + f.fora;
    const ult = out[out.length - 1];
    if (ult && ult.chave === chave && ult.fim === i - 1) { ult.fim = i; ult.anos = t('Ano ' + ult.ini) + '–' + t('Ano ' + i); }
    else out.push({ anos: t('Ano ' + i), f, ini: i, fim: i, chave });
  });
  return out;
}
function useRefBase(): any {
  const caso = useCaso((s) => s.caso);
  const ctx = useCaso((s) => s.ctx);
  const custo = useCaso((s) => s.custo);
  return cfgBaseDe({ caso, ctx, custo } as any);
}

/** <select> nativo com rótulo (visível ou só para leitores de tela) */
export function Selecao({ rotulo, valor, onChange, children, rotuloOculto, id }: {
  rotulo: string; valor: string; onChange: (v: string) => void; children: ReactNode; rotuloOculto?: boolean; id?: string;
}) {
  const auto = useId();
  const fid = id || 'rf-sel-' + auto;
  return (
    <div className={['rf-campo rf-campo--sel', rotuloOculto ? 'rf-campo--oculto' : ''].filter(Boolean).join(' ')}>
      <label className="rf-rotulo" htmlFor={fid}>{rotulo}</label>
      <select id={fid} className="rf-select" value={valor} onChange={(e) => onChange(e.target.value)}>{children}</select>
    </div>
  );
}

export function SelecaoSub({ caminho, valor, rotuloOculto }: { caminho: string; valor: string; rotuloOculto?: boolean }) {
  const editarCfg = useCaso((s) => s.editarCfg);
  return (
    <Selecao rotulo={t('Subcomponente')} valor={valor} rotuloOculto={rotuloOculto} onChange={(v) => editarCfg(caminho, v)}>
      {gruposSub().map((g) => (
        <optgroup key={g.k} label={g.nome}>
          {g.subs.map((s) => <option key={s.s} value={s.s}>{s.nome}</option>)}
        </optgroup>
      ))}
    </Selecao>
  );
}

export function SelecaoFuncao({ caminho, valor }: { caminho: string; valor: string }) {
  const editarCfg = useCaso((s) => s.editarCfg);
  return (
    <Selecao rotulo={t('Função')} valor={valor} onChange={(v) => editarCfg(caminho, v)}>
      {Object.keys(SAL).map((k) => <option key={k} value={k}>{t((SAL_NOME as any)[k])}</option>)}
    </Selecao>
  );
}

/** Seção da calculadora com âncora para o foco (#/refinar/:aba/:foco) */
export function Bloco({ id, titulo, children, nota, acoes }: { id: string; titulo: ReactNode; children: ReactNode; nota?: ReactNode; acoes?: ReactNode }) {
  return (
    <section className="rf-bloco" id={'rf-' + id} aria-labelledby={'rf-h-' + id}>
      <div className="rf-bloco-cab">
        <h2 className="rf-bloco-h" id={'rf-h-' + id}>{titulo}</h2>
        {acoes ? <div className="rf-bloco-acoes">{acoes}</div> : null}
      </div>
      {nota ? <p className="rf-nota">{nota}</p> : null}
      {children}
    </section>
  );
}
