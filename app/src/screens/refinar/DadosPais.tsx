// "Dados do país" (REF-08, REF-09): os 9 campos do perfil do país, cada um com o valor em uso e de onde veio
// ("dos dados do país", "editado por você", "estimado pela região", "valor ilustrativo" ou "sem dado"), com fonte, ano
// e grau. Digitar um valor faz dele o seu; "restaurar" volta ao valor da base ("apagar" quando a base não tem valor).
// Inflação, taxa de desconto, salário do professor, escolas com internet e número de escolas entram na estimativa
// quando têm valor (cfgDoCaso). Fica no Refinar (aba Premissas da calculadora e capítulo 1), recolhido por padrão.
import { useId, useState, type ReactNode } from 'react';
import { perfilDoPais, lerValorCampo, valorParaTexto, dicaOrigem, ORIGEM_ROTULO, tr } from '../../domain';
import { useCaso } from '../../store';
import { Button, TextField, IconChevronDown, IconChevronUp } from '../../ui';
import { CampoNumero } from '../../percurso/CampoNumero';
import { Pais } from '../../percurso/Pais';
import { t } from '../../percurso/textos';
import { Bloco } from './Campos';
import './referencias.css';

/** origem e fonte do valor do campo (texto já traduzido); "sem dado" quando a base não tem valor */
function marcador(info: any): { origem: string; dica: string } {
  if (!info) return { origem: t('sem dado'), dica: '' };
  return { origem: String(tr((ORIGEM_ROTULO as Record<string, string>)[info.origem] || info.origem)), dica: String(dicaOrigem(info)) };
}

function CampoPais({ item }: { item: any }) {
  const editar = useCaso((s) => s.editarCampoPais);
  const restaurar = useCaso((s) => s.restaurarCampoPais);
  const { def, info, editado } = item;
  const m = marcador(info);
  const rotulo = String(tr(def.rotulo));
  const hint = (
    <span className="rf-ref">
      <span className={info ? 'rf-dpais-origem' : 'rf-dpais-origem rf-dpais-semdado'}>{m.origem}</span>
      {m.dica ? <span className="rf-ref-fonte">{m.dica}</span> : null}
    </span>
  );
  const botao = editado ? (
    <Button variant="link" size="sm" className="rf-ref-restaurar" aria-label={(info && info.padrao != null ? t('restaurar') : t('apagar')) + ': ' + rotulo} onClick={() => restaurar(def.id)}>
      {info && info.padrao != null ? t('restaurar') : t('apagar')}
    </Button>
  ) : null;
  if (def.tipo === 'lista') return <CampoLista item={item} rotulo={rotulo} hint={hint} botao={botao} />;
  const v = info ? info.valor : '';
  return (
    <li className="rf-dpais-item">
      <CampoNumero
        label={rotulo}
        value={v === '' || v == null || !isFinite(+v) ? '' : +v}
        decimais={def.tipo !== 'int'}
        percentual={def.tipo === 'frac'}
        negativo={def.tipo === 'frac'}
        suffix={def.tipo === 'pct100' ? '%' : undefined}
        size={10}
        hint={hint}
        onChange={(x) => editar(def.id, x === '' ? '' : def.tipo === 'frac' ? x : lerValorCampo(def, x))}
      />
      {botao}
    </li>
  );
}

/** idiomas de ensino: códigos separados por vírgula, gravados ao sair do campo */
function CampoLista({ item, rotulo, hint, botao }: { item: any; rotulo: string; hint: ReactNode; botao: ReactNode }) {
  const editar = useCaso((s) => s.editarCampoPais);
  const { def, info } = item;
  const externo = String(valorParaTexto(def, info ? info.valor : ''));
  const [texto, setTexto] = useState<string | null>(null);
  return (
    <li className="rf-dpais-item">
      <TextField
        label={rotulo}
        value={texto ?? externo}
        hint={hint}
        placeholder="pt, es"
        onChange={(x) => setTexto(x)}
        inputProps={{ onBlur: () => { if (texto != null) { editar(def.id, lerValorCampo(def, texto)); setTexto(null); } } }}
      />
      {botao}
    </li>
  );
}

export function DadosPais({ aberto: abertoInicial = false }: { aberto?: boolean }) {
  const caso = useCaso((s) => s.caso);
  useCaso((s) => s.lang);
  const [aberto, setAberto] = useState(abertoInicial);
  const listaId = useId();
  const perfil = perfilDoPais(caso) as any[];
  const comValor = perfil.filter((x) => x.info).length;
  return (
    <Bloco
      id="pais"
      titulo={t('Dados do país (opcional)')}
      nota={t('Cada valor mostra de onde veio. Se você mudar um valor, ele passa a valer como seu; “restaurar” volta ao valor da base de dados. Entram na estimativa de custo, quando têm valor: inflação, taxa de desconto, salário do professor, escolas com internet e número de escolas.')}
    >
      <Pais />
      <Button
        variant="secondary"
        size="sm"
        className="rf-dpais-abrir"
        aria-expanded={aberto}
        aria-controls={listaId}
        icon={aberto ? <IconChevronUp size={16} aria-hidden="true" /> : <IconChevronDown size={16} aria-hidden="true" />}
        onClick={() => setAberto((x) => !x)}
      >
        {aberto ? t('Ocultar os dados do país') : t('Mostrar os dados do país ({n} de {total} com valor)', { n: comValor, total: perfil.length })}
      </Button>
      {aberto ? (
        <ul className="rf-dpais-lista" id={listaId}>
          {perfil.map((item) => <CampoPais key={item.def.id} item={item} />)}
        </ul>
      ) : null}
    </Bloco>
  );
}
