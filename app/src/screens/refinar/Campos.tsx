// Peças de formulário da calculadora: campos ligados a um caminho da cfg de custo (useCaso().editarCfg), séries
// por ano, seletores de subcomponente, função e natureza, seção com âncora para o foco ("Ajustar premissas").
import { useId, type ReactNode } from 'react';
import { useCaso } from '../../store';
import { CampoNumero } from '../../percurso/CampoNumero';
import { TextField } from '../../ui';
import { t } from '../../percurso/textos';
import { SAL, SAL_NOME } from '../../domain';
import { gruposSub, serieAnos } from './calc';

const numOuZero = (v: number | '') => (v === '' ? 0 : v);

/** Campo numérico de um caminho da cfg; `percentual` mostra % e guarda fração; `decimais` aceita 0,05 */
export function CampoCfg({ caminho, rotulo, valor, decimais = true, percentual, negativo, dica, rotuloOculto }: {
  caminho: string; rotulo: string; valor: any; decimais?: boolean; percentual?: boolean; negativo?: boolean; dica?: ReactNode; rotuloOculto?: boolean;
}) {
  const editarCfg = useCaso((s) => s.editarCfg);
  const v = valor === '' || valor == null || !isFinite(+valor) ? '' : +valor;
  return (
    <div className={['rf-campo', rotuloOculto ? 'rf-campo--oculto' : ''].filter(Boolean).join(' ')} id={'rf-' + caminho}>
      <CampoNumero label={rotulo} value={v} decimais={decimais} percentual={percentual} negativo={negativo} hint={dica} size={9} onChange={(x) => editarCfg(caminho, numOuZero(x))} />
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
  const serie = serieAnos(valores, H);
  const dicaId = useId();
  return (
    <fieldset className="rf-anos" id={'rf-' + caminho} aria-describedby={dica ? dicaId : undefined}>
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
    </fieldset>
  );
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
